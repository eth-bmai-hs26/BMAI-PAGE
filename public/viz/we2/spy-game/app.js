// THE HIDDEN LAYER, browser build: renderer + controls.
//
// GameRenderer below is a near-verbatim port of the source app's web/static/game.js
// renderer (same element ids, same CSS classes, same state-dict shape from
// engine/serialization.js), so the CRT look and feel is unchanged. GameControls is a
// rewrite: it replaces the WebSocket client with direct calls into engine/*.js, and talks
// to OpenRouter straight from the browser instead of through a Python backend. This file
// itself touches the DOM freely; all game logic lives in engine/*.js, which does not.

import { createMicroGame, microStubOracle, MICRO_MISSION_BRIEFING, DEFAULT_SYSTEM_PROMPT } from "./engine/micro_mission.js";
import { createTrainingGame, trainingStubOracle, TRAINING_MISSION_BRIEFING } from "./engine/training_mission.js";
import { gameStateToDict } from "./engine/serialization.js";
import { runAutoMission, checkGameOver, formatAction } from "./engine/agent.js";
import { llmOracle } from "./engine/oracle.js";
import { OpenRouterError } from "./engine/openrouter.js";

// ============================================================
// GameRenderer: DOM rendering, ported from the source web app
// ============================================================

const GameRenderer = (function () {
  let previouslyVisible = new Set();

  const ITEM_ICONS = {
    "USB Drive": "\u{1F4BE}",
    "Flamethrower": "\u{1F525}",
    "Scrap Metal": "⚙️",
    "Microfilm": "\u{1F4F7}",
    "Fuel Canister": "⛽",
    "Hard Drive": "\u{1F4BF}",
    "Medical Supplies": "\u{1FA79}",
    "Virus Code": "\u{1F4BB}",
    "Computer Virus": "\u{1F41B}",
    "Radio Codebook": "\u{1F4D7}",
  };

  const NPC_PORTRAITS = {
    "dr_vapnik": "assets/portraits/dr_vapnik.webp",
    "dropout": "assets/portraits/dropout.webp",
    "backprop": "assets/portraits/backprop.webp",
    "bias": "assets/portraits/bias.webp",
    "forge": "assets/portraits/forge.webp",
    "cryo_sentinel": "assets/portraits/cryo_sentinel.webp",
  };

  const ACTION_ICONS = { move: "\u{1F9ED}", talk: "\u{1F4AC}", collect: "✋" };

  const SUCCESS_PATTERN = /dossier|collected|delivered|built|destroy|reward|mission complete/i;
  const DAMAGE_PATTERN = /damage|hurt|fail|cannot|retreat|tripwire|neutralized/i;

  function renderGrid(state) {
    const container = document.getElementById("game-map");
    if (!container) return;

    const rows = state.rows, cols = state.cols, grid = state.grid, position = state.position;

    const currentlyVisible = new Set();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].visible) currentlyVisible.add(r + "," + c);
      }
    }

    container.style.setProperty("--grid-cols", cols);

    const existingCells = container.querySelectorAll(".cell");
    if (existingCells.length !== rows * cols) {
      while (container.firstChild) container.removeChild(container.firstChild);
    }

    let cells = container.querySelectorAll(".cell");
    if (cells.length === 0) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          container.appendChild(document.createElement("div"));
        }
      }
      cells = container.querySelectorAll("div");
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const cellEl = cells[idx];
        const cellData = grid[r][c];
        const key = r + "," + c;
        const isAgent = position[0] === r && position[1] === c;

        cellEl.className = "cell";

        if (!cellData.visible) {
          cellEl.classList.add("cell--fog");
          cellEl.textContent = "░";
        } else {
          cellEl.classList.add("cell--" + cellData.type);
          if (isAgent) {
            cellEl.classList.add("cell--agent");
            cellEl.textContent = "\u{1F574}️";
          } else {
            cellEl.textContent = cellData.emoji;
          }
          if (!previouslyVisible.has(key)) {
            cellEl.classList.add("cell--reveal");
            setTimeout(() => cellEl.classList.remove("cell--reveal"), 300);
          }
        }
      }
    }

    previouslyVisible = currentlyVisible;
  }

  function renderHealth(state) {
    const container = document.getElementById("health-bar");
    if (!container) return;
    while (container.firstChild) container.removeChild(container.firstChild);
    for (let i = 0; i < state.max_health; i++) {
      const span = document.createElement("span");
      span.textContent = i < state.health ? "❤️" : "\u{1F5A4}";
      container.appendChild(span);
    }
  }

  function renderDossierBar(state) {
    const container = document.getElementById("dossier-bar");
    if (!container) return;
    let inner = container.querySelector(".dossier-bar__fill");
    let label = container.querySelector(".dossier-bar__text");
    if (!inner) { inner = document.createElement("div"); inner.className = "dossier-bar__fill"; container.appendChild(inner); }
    if (!label) { label = document.createElement("span"); label.className = "dossier-bar__text"; container.appendChild(label); }
    const pct = state.win_dossiers > 0 ? (state.dossiers / state.win_dossiers) * 100 : 0;
    inner.style.width = Math.min(pct, 100) + "%";
    label.textContent = state.dossiers + "/" + state.win_dossiers;
    container.classList.toggle("dossier-bar--complete", state.dossiers >= state.win_dossiers);
  }

  function renderTurnBar(state) {
    const container = document.getElementById("turn-bar");
    if (!container) return;
    let inner = container.querySelector(".turn-bar__fill");
    let label = container.querySelector(".turn-bar__text");
    if (!inner) { inner = document.createElement("div"); inner.className = "turn-bar__fill"; container.appendChild(inner); }
    if (!label) { label = document.createElement("span"); label.className = "turn-bar__text"; container.appendChild(label); }
    const pct = state.max_turns > 0 ? (state.turn / state.max_turns) * 100 : 0;
    inner.style.width = Math.min(pct, 100) + "%";
    label.textContent = "Turn " + state.turn + "/" + state.max_turns;
    container.classList.remove("turn-bar--ok", "turn-bar--warn", "turn-bar--danger");
    if (pct >= 80) container.classList.add("turn-bar--danger");
    else if (pct >= 60) container.classList.add("turn-bar--warn");
    else container.classList.add("turn-bar--ok");
  }

  function renderInventory(state) {
    const container = document.getElementById("inventory");
    if (!container) return;
    const target = container.querySelector(".inventory-items") || container;
    while (target.firstChild) target.removeChild(target.firstChild);
    if (!state.inventory || state.inventory.length === 0) {
      const empty = document.createElement("span");
      empty.className = "item-slot";
      empty.style.fontStyle = "italic";
      empty.textContent = "Empty";
      target.appendChild(empty);
      return;
    }
    for (const name of state.inventory) {
      const icon = ITEM_ICONS[name] || "\u{1F4E6}";
      const span = document.createElement("span");
      span.className = "item-slot";
      span.textContent = icon + " " + name;
      target.appendChild(span);
    }
  }

  function renderActionLog(action, result, portraitKey) {
    const container = document.getElementById("action-log");
    if (!container) return;

    const entry = document.createElement("div");
    entry.className = "log-entry";

    let icon = "\u{1F4CB}";
    if (action) {
      const actionName = action.split("(")[0];
      if (ACTION_ICONS[actionName]) icon = ACTION_ICONS[actionName];
    }

    if (action) {
      const actionSpan = document.createElement("div");
      actionSpan.className = "log-action";
      actionSpan.textContent = icon + " " + action;
      entry.appendChild(actionSpan);
    }

    if (portraitKey && NPC_PORTRAITS[portraitKey]) {
      const img = document.createElement("img");
      img.className = "log-portrait";
      img.src = NPC_PORTRAITS[portraitKey];
      img.alt = portraitKey;
      entry.appendChild(img);
    }

    if (result) {
      const resultSpan = document.createElement("div");
      resultSpan.className = "log-result";
      if (SUCCESS_PATTERN.test(result)) resultSpan.classList.add("result--success");
      else if (DAMAGE_PATTERN.test(result)) resultSpan.classList.add("result--damage");
      else resultSpan.classList.add("result--neutral");
      resultSpan.textContent = result;
      entry.appendChild(resultSpan);
    }

    container.appendChild(entry);

    let entries = container.querySelectorAll(".log-entry");
    while (entries.length > 20) {
      container.removeChild(entries[0]);
      entries = container.querySelectorAll(".log-entry");
    }

    container.scrollTop = container.scrollHeight;
  }

  function renderNarrator(resultText) {
    const container = document.getElementById("narrator-panel");
    if (!container) return;
    const div = container.querySelector(".narrator-text");
    if (div) div.textContent = resultText || "";
  }

  function renderGameOver(data) {
    const overlay = document.getElementById("game-over-overlay");
    if (!overlay) return;

    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
    overlay.className = "game-over-overlay game-over--visible";

    if (data.won) overlay.classList.add("game-over--victory");
    else if (data.reason && /fallen/i.test(data.reason)) overlay.classList.add("game-over--defeat");
    else overlay.classList.add("game-over--timeout");

    const panel = document.createElement("div");
    panel.className = "game-over-box";

    const title = document.createElement("h2");
    title.textContent = data.won ? "MISSION COMPLETE" : "MISSION FAILED";
    panel.appendChild(title);

    if (data.reason) {
      const reason = document.createElement("p");
      reason.textContent = data.reason;
      panel.appendChild(reason);
    }

    if (data.stats) {
      const stats = document.createElement("div");
      stats.className = "stats";
      const lines = [
        "Turns: " + data.stats.turns,
        "Dossiers: " + data.stats.dossiers,
        "Health: " + data.stats.health,
        "Cells Visited: " + data.stats.visited,
      ];
      for (const line of lines) {
        const div = document.createElement("div");
        div.textContent = line;
        stats.appendChild(div);
      }
      panel.appendChild(stats);
    }

    const btnRow = document.createElement("div");
    btnRow.style.display = "flex";
    btnRow.style.gap = "8px";
    btnRow.style.justifyContent = "center";
    btnRow.style.marginTop = "12px";

    const btn = document.createElement("button");
    btn.className = "btn btn--primary";
    btn.textContent = "Play Again";
    btn.addEventListener("click", () => {
      overlay.classList.remove("game-over--visible");
      if (window.GameControls && window.GameControls.resetGame) window.GameControls.resetGame();
    });
    btnRow.appendChild(btn);

    if (data.log) {
      const dlBtn = document.createElement("button");
      dlBtn.className = "btn btn--success";
      dlBtn.textContent = "\u{1F4BE} Download Log";
      dlBtn.addEventListener("click", () => {
        const logData = {
          outcome: data.won ? "mission_complete" : "mission_failed",
          reason: data.reason,
          stats: data.stats,
          history: data.log,
        };
        downloadJson(logData, "game_log_" + (data.won ? "win" : "fail") + "_" + Date.now() + ".json");
      });
      btnRow.appendChild(dlBtn);
    }

    panel.appendChild(btnRow);
    overlay.appendChild(panel);
  }

  function detectPortraitKey(state, action, result) {
    if (!state || !state.grid || !state.position) return null;

    if (action && action.startsWith("talk")) {
      const r = state.position[0], c = state.position[1];
      const cell = state.grid[r] && state.grid[r][c];
      if (!cell) return null;

      if (cell.npc_name) {
        const name = cell.npc_name.toLowerCase();
        if (name.indexOf("vapnik") !== -1) return "dr_vapnik";
        if (name.indexOf("backprop") !== -1) return "backprop";
        if (name.indexOf("dropout") !== -1) return "dropout";
        if (name.indexOf("cryo") !== -1) return "cryo_sentinel";
      }

      if (cell.type === "forge") return "forge";
      if (cell.type === "safehouse") return "bias";

      return null;
    }

    if (action && action.startsWith("move") && result) {
      if (/cryo.sentinel/i.test(result)) return "cryo_sentinel";
    }

    return null;
  }

  function removeSpinner() {
    const container = document.getElementById("action-log");
    if (!container) return;
    const spinner = container.querySelector(".log-spinner");
    if (spinner) spinner.parentNode.removeChild(spinner);
  }

  function showSpinner() {
    removeSpinner();
    const container = document.getElementById("action-log");
    if (!container) return;
    const el = document.createElement("div");
    el.className = "log-entry log-spinner";
    const span = document.createElement("span");
    span.className = "spinner";
    el.appendChild(span);
    const text = document.createElement("span");
    text.textContent = " LLM thinking...";
    text.style.color = "var(--amber)";
    el.appendChild(text);
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function updateUI(message) {
    if (!message || !message.type) return;

    switch (message.type) {
      case "turn_update":
        removeSpinner();
        if (message.state) {
          renderGrid(message.state);
          renderHealth(message.state);
          renderDossierBar(message.state);
          renderTurnBar(message.state);
          renderInventory(message.state);
        }
        renderActionLog(message.action, message.result, detectPortraitKey(message.state, message.action, message.result));
        if (message.think_error) renderActionLog("", "Warning, think_llm error: " + message.think_error);
        if (message.parse_error) renderActionLog("", "Warning, parse error: " + message.parse_error);
        if (message.llm_raw && (message.think_error || message.parse_error || (message.action && message.action.startsWith("scan")))) {
          renderActionLog("", "LLM raw: " + message.llm_raw);
        }
        renderNarrator(message.result);
        if (window._autoRunning && message.state && message.state.is_alive && !message.state.has_won) showSpinner();
        break;

      case "game_over":
        removeSpinner();
        renderGameOver(message);
        break;

      case "auto_started":
        showSpinner();
        break;

      case "auto_stopped":
        removeSpinner();
        break;

      case "error": {
        removeSpinner();
        renderActionLog("", message.message || "Unknown error");
        const log = document.getElementById("action-log");
        if (log) {
          const lastEntry = log.lastElementChild;
          if (lastEntry) {
            const resultEl = lastEntry.querySelector(".log-result");
            if (resultEl) resultEl.className = "log-result result--damage";
          }
        }
        break;
      }
    }
  }

  function resetFog() {
    previouslyVisible = new Set();
  }

  return {
    updateUI, renderGameOver, renderGrid, renderHealth, renderDossierBar,
    renderTurnBar, renderInventory, renderActionLog, renderNarrator, resetFog,
  };
})();

// ============================================================
// Small helpers
// ============================================================

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const LS_KEY_API = "spy_openrouter_key";
const LS_KEY_PROMPT = "spy_system_prompt";

function getStoredApiKey() {
  try {
    return (localStorage.getItem(LS_KEY_API) || "").trim();
  } catch (_e) {
    return "";
  }
}

// DEFAULT_SYSTEM_PROMPT is imported from engine/micro_mission.js (single source of
// truth, also used by the Node-side live-key check). It stays one static default
// regardless of the selected mission, matching the source app's own index.html, whose
// system-prompt textarea likewise never changed text when the mission did.

// ============================================================
// GameControls: mission/session lifecycle, manual + auto play
// ============================================================

const GameControls = (function () {
  let session = null;
  let mode = "manual";
  let autoRunning = false;
  let gameOver = false;
  let currentMission = "micro";

  const MISSIONS = {
    micro: { create: createMicroGame, stub: microStubOracle, briefing: MICRO_MISSION_BRIEFING, maxTurns: 30 },
    training: { create: createTrainingGame, stub: trainingStubOracle, briefing: TRAINING_MISSION_BRIEFING, maxTurns: 50 },
  };

  const MISSION_BRIEFING_LINES = {
    micro: "\u{1F4CB} Collect 3 dossiers. Talk to informants. Destroy the robot. 30 turns.",
    training: "\u{1F4CB} Collect 5 dossiers. Talk to NPCs, trade items, craft weapons, deliver supplies. 50 turns.",
  };

  const MISSION_NARRATORS = {
    micro: "You wade ashore on a fog-shrouded island. Somewhere in this jungle outpost, three classified dossiers await. The air smells of salt and secrets. Your mission begins now.",
    training: "You wade ashore on a larger island. Five classified dossiers are hidden across the compound. Walls divide the terrain. You'll need to trade, craft, and plan your route carefully. Your training begins now.",
  };

  // ------------------------------------------------------------------
  // Session lifecycle
  // ------------------------------------------------------------------

  function makeOracleFn(missionName) {
    const config = MISSIONS[missionName];
    return async function (npc, question, operative) {
      const apiKey = getStoredApiKey();
      if (apiKey) return llmOracle(npc, question, operative, apiKey);
      return config.stub(npc, question, operative);
    };
  }

  function newSession(missionName) {
    const config = MISSIONS[missionName] || MISSIONS.micro;
    const { operative, world, tools } = config.create();
    tools.setOracle(makeOracleFn(missionName));
    return {
      mission: missionName,
      operative, world, tools,
      turn: 0,
      maxTurns: config.maxTurns,
      history: [],
      gameLog: [],
      stopRequested: false,
    };
  }

  function stateDict() {
    return gameStateToDict(session.operative, session.world, session.turn, session.maxTurns);
  }

  // ------------------------------------------------------------------
  // Manual actions
  // ------------------------------------------------------------------

  async function sendAction(tool, args) {
    if (autoRunning) {
      GameRenderer.updateUI({ type: "error", message: "Auto mode is running. Stop it first." });
      return;
    }
    if (!session.operative.isAlive) {
      GameRenderer.updateUI({ type: "error", message: "Game over: the operative has fallen." });
      return;
    }
    if (session.operative.hasWon) {
      GameRenderer.updateUI({ type: "error", message: "Game over: mission already complete." });
      return;
    }
    if (session.turn >= session.maxTurns) {
      GameRenderer.updateUI({ type: "error", message: "Game over: out of turns." });
      return;
    }

    try {
      const scanResult = (await session.tools.execute("scan", {})).message;
      const result = await session.tools.execute(tool, args);
      session.turn += 1;

      const actionStr = formatAction(tool, args || {});
      const event = {
        type: "turn_update",
        turn: session.turn,
        action: actionStr,
        result: result.message,
        scan: scanResult,
        state: stateDict(),
      };
      GameRenderer.updateUI(event);

      session.history.push({ role: "observation", content: scanResult });
      session.history.push({ role: "action", content: actionStr });
      session.history.push({ role: "result", content: result.message });

      session.gameLog.push({
        turn: session.turn,
        mode: "manual",
        position: session.operative.position.slice(),
        health: session.operative.health,
        dossiers: session.operative.dossiers,
        inventory: session.operative.inventory.slice(),
        observation: scanResult,
        action: actionStr,
        result: result.message,
        success: result.success,
      });

      maybeGameOver();
    } catch (e) {
      const msg = e instanceof OpenRouterError ? e.message : `Unexpected error: ${e.message}`;
      GameRenderer.updateUI({ type: "error", message: msg });
    }
  }

  function maybeGameOver() {
    const over = checkGameOver(session.operative, session.turn, session.maxTurns);
    if (!over) return;
    gameOver = true;
    autoRunning = false;
    window._autoRunning = false;
    updateControlState();

    session.gameLog.push({
      turn: session.turn,
      event: "GAME_OVER",
      reason: over.reason,
      won: over.won,
      position: session.operative.position.slice(),
      health: session.operative.health,
      dossiers: session.operative.dossiers,
      inventory: session.operative.inventory.slice(),
    });

    GameRenderer.updateUI({
      type: "game_over",
      won: over.won,
      reason: over.reason,
      stats: {
        turns: session.turn,
        dossiers: session.operative.dossiers,
        health: session.operative.health,
        visited: session.operative.visited.size,
      },
      log: session.history,
    });
  }

  // ------------------------------------------------------------------
  // Auto mode
  // ------------------------------------------------------------------

  function getSystemPrompt() {
    const el = document.getElementById("system-prompt");
    return el ? el.value : "";
  }

  async function startAuto() {
    if (autoRunning) {
      GameRenderer.updateUI({ type: "error", message: "Auto mode is already running." });
      return;
    }
    const systemPrompt = getSystemPrompt().trim();
    if (!systemPrompt) {
      GameRenderer.updateUI({ type: "error", message: "Please provide a system prompt before running the agent." });
      return;
    }
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      GameRenderer.updateUI({
        type: "error",
        message: "No OpenRouter API key configured. Paste one in Settings to use Auto mode (manual play still works without a key).",
      });
      return;
    }

    autoRunning = true;
    session.stopRequested = false;
    window._autoRunning = true;
    updateControlState();
    GameRenderer.updateUI({ type: "auto_started" });

    const config = MISSIONS[session.mission];
    const iterator = runAutoMission(session, {
      briefing: config.briefing,
      getApiKey: getStoredApiKey,
      getSystemPrompt,
      shouldStop: () => session.stopRequested,
      turnDelayMs: 800,
    });

    try {
      for await (const event of iterator) {
        if (event.kind === "turn") {
          GameRenderer.updateUI({
            type: "turn_update",
            turn: event.turn,
            action: event.action,
            result: event.result,
            scan: event.scan,
            state: stateDict(),
            llm_raw: event.llmRaw ? event.llmRaw.slice(0, 500) : undefined,
          });
        } else if (event.kind === "error") {
          GameRenderer.updateUI({ type: "error", message: event.message });
        } else if (event.kind === "stopped") {
          break;
        }
      }
    } catch (e) {
      const msg = e instanceof OpenRouterError ? e.message : `Auto mode error: ${e.message}`;
      GameRenderer.updateUI({ type: "error", message: msg });
    } finally {
      autoRunning = false;
      window._autoRunning = false;
      GameRenderer.updateUI({ type: "auto_stopped" });
      updateControlState();
      maybeGameOver();
    }
  }

  function stopAuto() {
    session.stopRequested = true;
  }

  function resetGame(missionName) {
    const m = missionName || currentMission;
    currentMission = m;
    session = newSession(m);
    gameOver = false;
    autoRunning = false;
    window._autoRunning = false;

    const log = document.getElementById("action-log");
    if (log) {
      const header = log.querySelector(".log-header");
      log.textContent = "";
      if (header) log.appendChild(header);
    }
    const overlay = document.getElementById("game-over-overlay");
    if (overlay) overlay.classList.remove("game-over--visible");

    GameRenderer.resetFog();
    updateControlState();
  }

  // ------------------------------------------------------------------
  // Control state (enable/disable, mode panels)
  // ------------------------------------------------------------------

  function updateControlState() {
    const disabled = autoRunning || gameOver;

    for (const id of ["dpad-north", "dpad-south", "dpad-east", "dpad-west"]) {
      const btn = document.getElementById(id);
      if (btn) btn.disabled = disabled;
    }
    const collect = document.getElementById("btn-collect");
    if (collect) collect.disabled = disabled;
    const talkSend = document.getElementById("talk-send");
    if (talkSend) talkSend.disabled = disabled;
    const talkInput = document.getElementById("talk-input");
    if (talkInput) talkInput.disabled = disabled;

    const btnRun = document.getElementById("btn-run");
    if (btnRun) btnRun.disabled = mode !== "auto" || autoRunning || gameOver;
    const btnStop = document.getElementById("btn-stop");
    if (btnStop) btnStop.disabled = !autoRunning;

    const btnManual = document.getElementById("btn-manual");
    const btnAuto = document.getElementById("btn-auto");
    if (btnManual) btnManual.classList.toggle("btn--primary", mode === "manual");
    if (btnAuto) btnAuto.classList.toggle("btn--primary", mode === "auto");

    const editorArea = document.getElementById("editor-area");
    if (editorArea) editorArea.classList.toggle("editor-panel--collapsed", mode === "manual");
  }

  // ------------------------------------------------------------------
  // Event binding
  // ------------------------------------------------------------------

  function bindControls() {
    const directions = { "dpad-north": "north", "dpad-south": "south", "dpad-east": "east", "dpad-west": "west" };
    for (const [id, dir] of Object.entries(directions)) {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener("click", () => sendAction("move", { direction: dir }));
    }

    document.addEventListener("keydown", (e) => {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (autoRunning || gameOver) return;
      const keyMap = {
        ArrowUp: "north", w: "north", W: "north",
        ArrowDown: "south", s: "south", S: "south",
        ArrowLeft: "west", a: "west", A: "west",
        ArrowRight: "east", d: "east", D: "east",
      };
      const dir = keyMap[e.key];
      if (dir) { e.preventDefault(); sendAction("move", { direction: dir }); }
    });

    const collectBtn = document.getElementById("btn-collect");
    if (collectBtn) collectBtn.addEventListener("click", () => sendAction("collect", {}));

    const talkInput = document.getElementById("talk-input");
    const talkSend = document.getElementById("talk-send");
    function doTalk() {
      const val = talkInput ? talkInput.value.trim() : "";
      if (!val) return;
      sendAction("talk", { message: val });
      if (talkInput) talkInput.value = "";
    }
    if (talkSend) talkSend.addEventListener("click", doTalk);
    if (talkInput) talkInput.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doTalk(); } });

    const btnManual = document.getElementById("btn-manual");
    const btnAuto = document.getElementById("btn-auto");
    if (btnManual) btnManual.addEventListener("click", () => { mode = "manual"; updateControlState(); });
    if (btnAuto) btnAuto.addEventListener("click", () => { mode = "auto"; updateControlState(); });

    const btnRun = document.getElementById("btn-run");
    if (btnRun) btnRun.addEventListener("click", () => { startAuto(); });
    const btnStop = document.getElementById("btn-stop");
    if (btnStop) btnStop.addEventListener("click", () => stopAuto());

    const btnReset = document.getElementById("btn-reset");
    if (btnReset) btnReset.addEventListener("click", () => resetGame());

    const btnDownloadLog = document.getElementById("btn-download-log");
    if (btnDownloadLog) btnDownloadLog.addEventListener("click", () => {
      const op = session.operative;
      let outcome = "in_progress";
      if (!op.isAlive) outcome = "mission_failed_dead";
      else if (op.hasWon) outcome = "mission_complete";
      else if (session.turn >= session.maxTurns) outcome = "mission_failed_turns";
      downloadJson({
        session_id: "local",
        outcome,
        final_dossiers: op.dossiers,
        final_health: op.health,
        final_inventory: op.inventory.slice(),
        total_turns: session.turn,
        max_turns: session.maxTurns,
        journal: op.journal.slice(),
        turns: session.gameLog,
      }, "game_log_" + Date.now() + ".json");
    });

    // Mission selector
    const missionSelect = document.getElementById("mission-select");
    if (missionSelect) {
      missionSelect.addEventListener("change", () => {
        startNewGame(missionSelect.value);
      });
    }

    // API key settings
    const apiKeyInput = document.getElementById("api-key");
    const btnSaveKey = document.getElementById("btn-save-key");
    const btnForgetKey = document.getElementById("btn-forget-key");
    const apiKeyStatus = document.getElementById("api-key-status");

    function setKeyStatus(text, ok) {
      if (!apiKeyStatus) return;
      apiKeyStatus.textContent = text;
      apiKeyStatus.className = "api-key-status " + (ok ? "api-key--ok" : "api-key--err");
    }

    if (btnSaveKey) btnSaveKey.addEventListener("click", () => {
      const key = apiKeyInput ? apiKeyInput.value.trim() : "";
      if (!key) { setKeyStatus("No key entered.", false); return; }
      try {
        localStorage.setItem(LS_KEY_API, key);
        setKeyStatus("Key saved in this browser. Auto mode and LLM dialogue are now available.", true);
      } catch (_e) {
        setKeyStatus("Could not save key (browser storage unavailable).", false);
      }
    });

    if (btnForgetKey) btnForgetKey.addEventListener("click", () => {
      try { localStorage.removeItem(LS_KEY_API); } catch (_e) { /* ignore */ }
      if (apiKeyInput) apiKeyInput.value = "";
      setKeyStatus("Key forgotten. Manual play still works; Auto mode needs a key.", false);
    });

    if (apiKeyInput) apiKeyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); if (btnSaveKey) btnSaveKey.click(); }
    });

    // Editor collapse toggle
    const editorToggle = document.getElementById("editor-toggle");
    const editorArea = document.getElementById("editor-area");
    if (editorToggle && editorArea) {
      editorToggle.addEventListener("click", () => editorArea.classList.toggle("editor-panel--collapsed"));
    }

    // Tab key in the system-prompt textarea inserts 4 spaces
    const promptEl = document.getElementById("system-prompt");
    if (promptEl) {
      promptEl.addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const start = promptEl.selectionStart, end = promptEl.selectionEnd;
          promptEl.value = promptEl.value.substring(0, start) + "    " + promptEl.value.substring(end);
          promptEl.selectionStart = promptEl.selectionEnd = start + 4;
        }
      });
      promptEl.addEventListener("input", () => {
        try { localStorage.setItem(LS_KEY_PROMPT, promptEl.value); } catch (_e) { /* ignore */ }
      });
    }

    const btnPromptReset = document.getElementById("btn-prompt-reset");
    if (btnPromptReset) btnPromptReset.addEventListener("click", () => {
      if (promptEl) promptEl.value = DEFAULT_SYSTEM_PROMPT;
      try { localStorage.setItem(LS_KEY_PROMPT, DEFAULT_SYSTEM_PROMPT); } catch (_e) { /* ignore */ }
    });
  }

  function restoreEditor() {
    const promptEl = document.getElementById("system-prompt");
    if (promptEl) {
      let saved = null;
      try { saved = localStorage.getItem(LS_KEY_PROMPT); } catch (_e) { /* ignore */ }
      promptEl.value = saved || DEFAULT_SYSTEM_PROMPT;
    }

    const apiKeyInput = document.getElementById("api-key");
    const apiKeyStatus = document.getElementById("api-key-status");
    const savedKey = getStoredApiKey();
    if (savedKey && apiKeyInput) apiKeyInput.value = savedKey;
    if (apiKeyStatus) {
      if (savedKey) {
        apiKeyStatus.textContent = "Key loaded from this browser's storage.";
        apiKeyStatus.className = "api-key-status api-key--ok";
      } else {
        apiKeyStatus.textContent = "No key set. Manual play works without one.";
        apiKeyStatus.className = "api-key-status api-key--err";
      }
    }
  }

  // ------------------------------------------------------------------
  // Mission briefing panel + narrator
  // ------------------------------------------------------------------

  function showMissionBriefing(missionName) {
    const log = document.getElementById("action-log");
    if (!log) return;
    const panel = document.createElement("div");
    panel.className = "log-entry mission-briefing";
    const text = document.createElement("div");
    text.className = "result--success";
    text.textContent = MISSION_BRIEFING_LINES[missionName] || MISSION_BRIEFING_LINES.micro;
    panel.appendChild(text);
    const dismiss = document.createElement("button");
    dismiss.className = "btn";
    dismiss.textContent = "✕ Dismiss";
    dismiss.style.marginTop = "4px";
    dismiss.style.fontSize = "10px";
    dismiss.addEventListener("click", () => panel.parentNode.removeChild(panel));
    panel.appendChild(dismiss);
    const header = log.querySelector(".log-header");
    if (header && header.nextSibling) log.insertBefore(panel, header.nextSibling);
    else log.appendChild(panel);
  }

  function startNewGame(missionName) {
    currentMission = missionName || "micro";
    session = newSession(currentMission);
    gameOver = false;
    autoRunning = false;
    window._autoRunning = false;

    const log = document.getElementById("action-log");
    if (log) {
      const header = log.querySelector(".log-header");
      log.textContent = "";
      if (header) log.appendChild(header);
    }
    const overlay = document.getElementById("game-over-overlay");
    if (overlay) overlay.classList.remove("game-over--visible");

    GameRenderer.resetFog();

    GameRenderer.updateUI({
      type: "turn_update",
      turn: 0,
      action: "",
      result: "Welcome, Agent Lambda.",
      scan: "",
      state: stateDict(),
    });
    GameRenderer.renderNarrator(MISSION_NARRATORS[currentMission] || MISSION_NARRATORS.micro);
    showMissionBriefing(currentMission);
    updateControlState();
  }

  function init() {
    bindControls();
    restoreEditor();
    startNewGame("micro");
    updateControlState();
  }

  document.addEventListener("DOMContentLoaded", init);

  return { sendAction, startAuto, stopAuto, resetGame, startNewGame };
})();

window.GameControls = GameControls;
window.GameRenderer = GameRenderer;
