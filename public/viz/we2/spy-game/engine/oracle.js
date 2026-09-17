// Informant oracle for The Hidden Layer: the LLM-powered half of talk().
// Ported from agentic_ai_spy/hidden_layer/oracle.py's llm_oracle/build_npc_system_prompt/
// ORACLE_TEMPLATE, then re-pointed at OpenRouter exactly as
// w2-lecture-material/spy-game/hidden_layer/oracle.py already does for the notebooks (see
// that directory's CLAUDE.md, "OpenRouter port"). No DOM access.
//
// oracle.py's own stub_oracle() (the generic, full-8x8-mission keyword responder) is not
// ported: server.py never wires it up for micro or training (each mission supplies its own
// stub, see micro_mission.js / training_mission.js), so it is dead code for this build.

import { MODEL, chatCompletionWithRetry, firstContent } from "./openrouter.js";
import { EM } from "./text.js";

export { MODEL };

const ORACLE_TEMPLATE = (name, personality, knowledge, style, inventory, health, dossiers, visitedCount, patienceNote) => `You are ${name}, an informant in a spy thriller RPG set on a military island.

Personality: ${personality}

Your knowledge (share what you know clearly${EM} the operative's life depends on it):
${knowledge}

Speaking style: ${style}

The operative currently carries: ${inventory}
The operative has ${health} health and ${dossiers} dossiers.
The operative has visited ${visitedCount} locations.
${patienceNote}
Rules:
- Stay in character at all times.
- Be HELPFUL. Give concrete, actionable information. Name specific items, people, and directions.
- You can use vague language for flavor, but the core information must be clear.
  GOOD: "The burning fuel sleeps in the northwest jungle${EM} a Fuel Canister, hidden under the palms."
  BAD:  "The burning stones sleep where the parameters converge..."
- If the operative asks about jobs or deliveries, tell them exactly what you need and what you'll pay.
- If the operative has an item you want, tell them directly.
- Keep responses to 2-3 sentences.`;

export function buildNpcSystemPrompt(npc, operative) {
  const knowledgeStr = npc.knowledge.map((k) => `- ${k}`).join("\n");
  const inventoryStr = operative.inventory.length ? operative.inventory.join(", ") : "nothing";

  // Count how many times the operative has talked to this NPC.
  const talkCount = operative.journal.filter((entry) => entry.includes(npc.name)).length;

  let patienceNote = "";
  if (talkCount === 0) {
    patienceNote = "";
  } else if (talkCount <= 2) {
    patienceNote =
      "\nThe operative has talked to you before. Be a bit more direct this time " +
      `${EM} mention specific item names, locations (like 'the jungle to the northwest'), ` +
      "and what you need from them.\n";
  } else {
    patienceNote =
      "\nThe operative has talked to you MANY times and seems stuck. " +
      "Drop the cryptic act entirely. Be completely direct: name exact items, " +
      "give clear directions (e.g. 'Go north to row 0, column 2 to find a Hard Drive'), " +
      "and spell out exactly what you want and what you'll give in return. " +
      "The operative clearly needs help.\n";
  }

  return ORACLE_TEMPLATE(
    npc.name,
    npc.personality,
    knowledgeStr,
    npc.style,
    inventoryStr,
    operative.health,
    operative.dossiers,
    operative.visited.size,
    patienceNote
  );
}

// Ask an informant a question through OpenRouter. Returns the informant's
// in-character reply (a plain string), never throws for a missing/empty
// completion (falls back to a silent-stare line, matching oracle.py).
export async function llmOracle(npc, question, operative, apiKey) {
  const systemPrompt = buildNpcSystemPrompt(npc, operative);

  const response = await chatCompletionWithRetry({
    apiKey,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    maxTokens: 400,
    temperature: 0.3,
  });

  const content = firstContent(response);
  return content || `${npc.name} stares at you silently.`;
}
