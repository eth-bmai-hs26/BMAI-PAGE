// Agent loop and think function for The Hidden Layer. Ported from
// agentic_ai_spy/hidden_layer/agent.py (parse_tool_call, the run_agent/run_auto_loop
// control flow) and web/server.py (the async auto-mode loop, consecutive-error handling,
// turn pacing), adapted from Gemini to OpenRouter's chat-completions shape the way
// w2-lecture-material/spy-game/hidden_layer/agent.py already does. No DOM access.
//
// Carries the two harness fixes documented in that directory's CLAUDE.md:
//  1. formatAction() renders past actions as tool(key="value"), the spelling
//     parseToolCall()'s own regex reads back. The source repo's run_agent() instead
//     stores f"{tool_name}({args})", which prints a Python dict and which its own
//     parser cannot read back; a model that copies that spelling from its own history
//     silently loses its arguments on every later turn.
//  2. stripPortrait() drops any embedded <img ...> tag before a result is appended to
//     the history sent to the model. This build's tool results never embed a portrait
//     (that was only ever the notebooks' inline demo code, not web/server.py's engine),
//     so this is currently a no-op safety net, kept for parity with the documented fix.

import { MODEL, chatCompletionWithRetry, firstContent } from "./openrouter.js";

// ---------------------------------------------------------------------------
// Tool call parser
// ---------------------------------------------------------------------------

export function parseToolCall(text) {
  text = text || "";
  let match = /TOOL:\s*(\w+)\((.*?)\)/s.exec(text);
  if (!match) {
    const simple = /TOOL:\s*(\w+)/.exec(text);
    if (simple) {
      return { toolName: simple[1], args: {} };
    }
    // Fallback: accept bare tool calls without a TOOL: prefix, e.g.
    // move(direction="east") or collect()
    const bare = /\b(move|talk|collect|scan)\((.*?)\)/s.exec(text);
    if (bare) {
      match = bare;
    } else {
      const bareSimple = /\b(move|talk|collect|scan)\b/.exec(text);
      if (bareSimple) {
        return { toolName: bareSimple[1], args: {} };
      }
      throw new Error(`No TOOL: call found in LLM response. Got: ${JSON.stringify(text.slice(0, 300))}`);
    }
  }

  const toolName = match[1];
  const argsStr = match[2].trim();
  if (!argsStr) {
    return { toolName, args: {} };
  }

  const args = {};
  const kvRegex = /(\w+)\s*=\s*["']([^"']*)["']/g;
  let kvMatch;
  while ((kvMatch = kvRegex.exec(argsStr)) !== null) {
    args[kvMatch[1]] = kvMatch[2];
  }
  return { toolName, args };
}

// Harness fix 1: render a past action the way parseToolCall() can read back.
export function formatAction(toolName, args) {
  const argsStr = Object.entries(args || {}).map(([k, v]) => `${k}="${v}"`).join(", ");
  return `${toolName}(${argsStr})`;
}

// Harness fix 2: drop an embedded NPC portrait <img> tag before text enters the
// LLM transcript.
const PORTRAIT_IMG_RE = /<img[^>]*>/g;
export function stripPortrait(text) {
  return (text || "").replace(PORTRAIT_IMG_RE, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// think_llm: decide the next action via OpenRouter. Ported from the source
// repo's fully-implemented agent.py think_llm() (system_prompt + built user
// message), re-pointed at OpenRouter's chat-completions shape.
// ---------------------------------------------------------------------------

export function buildThinkUserMessage(operative, world, history) {
  const [r, c] = operative.position;
  const cell = world.getCell(r, c);
  const cellDesc = cell.description || String(cell);

  const recent = history.slice(-10);
  const transcript = recent
    .map((entry) => `[${(entry.role || "").toUpperCase()}] ${entry.content || ""}`)
    .join("\n");

  let journalText = "";
  if (operative.journal.length) {
    journalText = "\n\nJOURNAL (key past conversations):\n" + operative.journal.map((j) => `- ${j}`).join("\n");
  }

  return (
    `OPERATIVE STATUS: ${operative.statusText()}\n\n` +
    `CURRENT CELL: ${cellDesc}\n\n` +
    `RECENT HISTORY:\n${transcript}` +
    `${journalText}\n\n` +
    `What do you do next? Respond with exactly one TOOL: call.`
  );
}

export async function thinkLlm(operative, world, history, apiKey, systemPrompt) {
  if (!systemPrompt) {
    throw new Error(
      "system_prompt is empty. Provide a prompt that describes the agent's role, available tools, and expected response format."
    );
  }
  const userMessage = buildThinkUserMessage(operative, world, history);
  const response = await chatCompletionWithRetry({
    apiKey,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    maxTokens: 800,
    temperature: 0.3,
  });
  return firstContent(response);
}

// ---------------------------------------------------------------------------
// Game-over check, shared by manual and auto mode. Ported from
// web/server.py's check_game_over().
// ---------------------------------------------------------------------------

export function checkGameOver(operative, turn, maxTurns) {
  if (!operative.isAlive) {
    return { reason: "The operative has fallen.", won: false };
  }
  if (operative.hasWon) {
    return { reason: "Mission complete! All dossiers collected.", won: true };
  }
  if (turn >= maxTurns) {
    return { reason: "Out of turns. Mission failed.", won: false };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Auto mode loop. Ported from web/server.py's run_auto_loop(): scan, build the
// turn-0 briefing-prefixed observation, call think_llm, parse, execute, track
// consecutive errors (stop after 3), pace turns, stop at the mission's turn
// limit. An async generator so the caller (the page's controls module) can
// render each yielded event and poll a Stop button between turns without this
// module ever touching the DOM itself.
//
// `session` is a plain mutable object the caller owns: { operative, world,
// tools, mission, turn, history, gameLog, maxTurns }. `getSystemPrompt` and
// `getApiKey` are functions (not raw values) so a page can let the participant
// edit the system prompt while auto mode is already stepping between turns.
// ---------------------------------------------------------------------------

const MAX_CONSECUTIVE_ERRORS = 3;

export async function* runAutoMission(session, { briefing, getApiKey, getSystemPrompt, shouldStop, turnDelayMs = 800 }) {
  let consecutiveErrors = 0;

  while (!shouldStop()) {
    const over = checkGameOver(session.operative, session.turn, session.maxTurns);
    if (over) break;

    // 1. Scan
    const scanResult = (await session.tools.execute("scan", {})).message;

    // 2. Build history entry
    let observation = scanResult;
    if (session.turn === 0) {
      observation = `${briefing}\n${scanResult}`;
    }
    session.history.push({ role: "observation", content: observation });

    // 3. Call think function
    let llmRaw = null;
    let thinkError = null;
    let parseError = null;
    let toolName = null;
    let args = null;

    try {
      llmRaw = await thinkLlm(session.operative, session.world, session.history, getApiKey(), getSystemPrompt());
    } catch (e) {
      thinkError = e.message;
      session.history.push({ role: "error", content: `Think error: ${e.message}` });
    }

    // 4. Parse
    if (llmRaw && !thinkError) {
      try {
        const parsed = parseToolCall(llmRaw);
        toolName = parsed.toolName;
        args = parsed.args;
        consecutiveErrors = 0;
      } catch (e) {
        parseError = e.message;
        thinkError = `Could not parse LLM response: ${llmRaw.slice(0, 200)}`;
      }
    }

    if (thinkError || toolName === null) {
      consecutiveErrors += 1;
      session.gameLog.push({
        turn: session.turn,
        position: session.operative.position.slice(),
        health: session.operative.health,
        dossiers: session.operative.dossiers,
        inventory: session.operative.inventory.slice(),
        observation,
        llm_raw_response: llmRaw,
        think_error: thinkError,
        parse_error: parseError,
        action: null,
        result: null,
        success: false,
      });
      yield { kind: "error", turn: session.turn, message: `[Turn ${session.turn + 1}] ${thinkError}` };
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        yield {
          kind: "error",
          turn: session.turn,
          message: `Stopped: ${consecutiveErrors} consecutive errors. Check your API key and system prompt.`,
        };
        yield { kind: "stopped", reason: "errors" };
        return;
      }
      await sleep(1000);
      continue;
    }

    // 5. Execute
    let result;
    try {
      result = await session.tools.execute(toolName, args);
    } catch (e) {
      consecutiveErrors += 1;
      const msg = `Tool execution error: ${e.message}`;
      session.gameLog.push({
        turn: session.turn,
        position: session.operative.position.slice(),
        health: session.operative.health,
        dossiers: session.operative.dossiers,
        inventory: session.operative.inventory.slice(),
        observation,
        llm_raw_response: llmRaw,
        think_error: msg,
        parse_error: null,
        action: Object.keys(args).length ? formatAction(toolName, args) : `${toolName}()`,
        result: null,
        success: false,
      });
      yield { kind: "error", turn: session.turn, message: `[Turn ${session.turn + 1}] ${msg}` };
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        yield {
          kind: "error",
          turn: session.turn,
          message: `Stopped: ${consecutiveErrors} consecutive errors. Check your API key and system prompt.`,
        };
        yield { kind: "stopped", reason: "errors" };
        return;
      }
      await sleep(1000);
      continue;
    }

    session.turn += 1;

    // 6. Update history (harness-fixed spelling, portrait-stripped result)
    const actionStr = formatAction(toolName, args);
    session.history.push({ role: "action", content: actionStr });
    session.history.push({ role: "result", content: stripPortrait(result.message) });

    // 7. Structured log (unstripped, matching web/server.py: the log is never sent to an LLM)
    session.gameLog.push({
      turn: session.turn,
      position: session.operative.position.slice(),
      health: session.operative.health,
      dossiers: session.operative.dossiers,
      inventory: session.operative.inventory.slice(),
      observation,
      llm_raw_response: llmRaw,
      think_error: null,
      parse_error: null,
      action: actionStr,
      result: result.message,
      success: result.success,
    });

    // 8. Yield the turn update for rendering
    yield {
      kind: "turn",
      turn: session.turn,
      action: actionStr,
      result: result.message,
      scan: scanResult,
      thinkError: null,
      parseError: null,
      llmRaw,
    };

    // 9. Pace the animation
    await sleep(turnDelayMs);
  }

  yield { kind: "stopped", reason: shouldStop() ? "user" : "finished" };
}
