// Micro mission: 3x3 grid, 3 dossiers, 2 NPCs. Ported from
// agentic_ai_spy/hidden_layer/micro_mission.py (the module server.py actually imports;
// not the notebook's own inline copy, which embeds portrait HTML the web app never did).
// No DOM access.

import { CellType, makeCell, GameWorld } from "./game_world.js";
import { GameTools, ToolResult } from "./tools.js";
import { Operative } from "./operative.js";
import { EM } from "./text.js";

// ---------------------------------------------------------------------------
// Micro NPCs
// ---------------------------------------------------------------------------

export const MICRO_NPC_CATALOG = {
  dr_vapnik: {
    name: "Dr. Vapnik",
    personality: "Helpful old scientist. Gets to the point quickly.",
    knowledge: [
      "He has a USB Drive that must reach Agent Dropout at position (1, 1) in the center of the base.",
      "Delivering the USB Drive pays 1 dossier.",
    ],
    style: "Speaks in brief statistical metaphors but always delivers clear information.",
    greeting: "Ah, agent. I have a job for you. Ask me about it.",
  },
  dropout: {
    name: "Agent Dropout",
    personality: "Bitter but helpful burned spy. Very direct.",
    knowledge: [
      "She receives USB Drives. Will pay 1 dossier for one.",
      "The Cryo-Sentinel robot at position (2, 2) freezes intruders.",
      "A Flamethrower can destroy the Cryo-Sentinel. Worth 1 dossier.",
      "There is a Flamethrower hidden in the jungle at the northwest corner, position (0, 0).",
    ],
    style: "Direct and blunt. No riddles, no metaphors. Tells you exactly what you need.",
    greeting: "You again? Fine. What do you need?",
  },
};

// ---------------------------------------------------------------------------
// Micro stub oracle
// ---------------------------------------------------------------------------

function any_kw(q, kws) {
  return kws.some((kw) => q.includes(kw));
}

export function microStubOracle(npc, message, operative) {
  const q = message.toLowerCase();
  const name = npc.name;

  if (name === "Dr. Vapnik") {
    if (any_kw(q, ["usb", "drive", "deliver", "job", "work", "task", "errand", "help", "mission", "what", "how", "tell"])) {
      return `I have a USB Drive with critical data. Deliver it to Agent Dropout at position (1, 1) ${EM} the center of the base. 1 dossier for the job.`;
    }
    return "I have a job for you, agent. Ask me about a delivery or a job.";
  }

  if (name === "Agent Dropout") {
    if (any_kw(q, ["usb", "drive", "deliver"]) && operative.hasItem("USB Drive")) {
      return "The USB drive! Good. Here's your dossier.";
    }
    if (any_kw(q, ["robot", "cryo", "sentinel", "fire", "flame", "weapon", "help", "mission", "what", "how", "tell", "job", "task"])) {
      return `There's a Cryo-Sentinel robot at position (2, 2). It freezes everything. Move into it with a Flamethrower to destroy it ${EM} worth 1 dossier. There's a Flamethrower in the jungle at the northwest corner, position (0, 0).`;
    }
    return "Ask me about the robot or if you have something to deliver.";
  }

  return `${name} says nothing useful.`;
}

// ---------------------------------------------------------------------------
// Micro Game World: 3x3, no walls, open terrain.
// ---------------------------------------------------------------------------

export class MicroGameWorld extends GameWorld {
  constructor() {
    super();
    this.ROWS = 3;
    this.COLS = 3;
    this.evilAiRobotAlive = false; // no Evil AI Robot on this map
    this.buildMap();
  }

  buildMap() {
    this.grid = Array.from({ length: this.ROWS }, () =>
      Array.from({ length: this.COLS }, () => makeCell(CellType.OPEN))
    );

    // Row 0: jungle(flamethrower) . cache(dossier)
    this._set(0, 0, makeCell(CellType.JUNGLE, {
      items: ["Flamethrower"],
      description: "Dense jungle at the northwest corner. A Flamethrower is stashed under the roots!",
    }));
    this._set(0, 2, makeCell(CellType.CACHE, {
      items: ["dossier_1"],
      description: "A filing cabinet left unlocked. Classified documents inside!",
    }));

    // Row 1: . informant(dropout) .
    this._set(1, 1, makeCell(CellType.INFORMANT, {
      npcId: "dropout",
      description: "A camouflaged hideout. A woman sharpens a knife.",
    }));

    // Row 2: spawn informant(vapnik) robot(cryo)
    this._set(2, 0, makeCell(CellType.OPEN, {
      description: "The south shore. This is where you came ashore.",
    }));
    this._set(2, 1, makeCell(CellType.INFORMANT, {
      npcId: "dr_vapnik",
      description: "A weathered shack. An old man scribbles equations in the dirt.",
    }));
    this._set(2, 2, makeCell(CellType.ROBOT, {
      robotName: "Cryo-Sentinel",
      description: "A freezing corridor. A hulking robot blocks the path, frost pouring from its vents.",
    }));
  }
}

// ---------------------------------------------------------------------------
// Micro tools (patched for micro NPCs, plain text only)
// ---------------------------------------------------------------------------

export class MicroGameTools extends GameTools {
  async talk(message = "") {
    const [row, col] = this.operative.position;
    const cell = this.world.getCell(row, col);

    if (cell.cellType === CellType.INFORMANT && cell.npcId) {
      const npc = MICRO_NPC_CATALOG[cell.npcId];
      if (!npc) return new ToolResult(false, "Unknown informant.");
      if (this._oracleFn === null) return new ToolResult(false, "No oracle function set.");

      let text = await this._oracleFn(npc, message, this.operative);

      // Dr. Vapnik gives USB Drive
      if (cell.npcId === "dr_vapnik" && !this.world.usbDrivePickedUp) {
        if (any_kw(message.toLowerCase(), ["usb", "drive", "job", "work", "task", "delivery", "errand"])) {
          this.operative.addItem("USB Drive");
          this.world.usbDrivePickedUp = true;
          text += "\n[Dr. Vapnik hands you a USB Drive.]";
        }
      }

      // Dropout receives USB Drive
      if (cell.npcId === "dropout" && this.operative.hasItem("USB Drive") && !this.world.usbDriveDelivered) {
        if (any_kw(message.toLowerCase(), ["usb", "drive", "deliver", "data"])) {
          this.operative.removeItem("USB Drive");
          this.operative.addDossiers(1);
          this.world.usbDriveDelivered = true;
          text += "\n[You delivered the USB Drive! +1 dossier.]";
        }
      }

      this.operative.journal.push(`Talked to ${npc.name}: '${message}' → '${text.slice(0, 300)}'`);

      return new ToolResult(true, `${npc.name} says: ${text}`);
    }

    return new ToolResult(false, "There is no one to talk to here.");
  }
}

// ---------------------------------------------------------------------------
// Micro mission briefing
// ---------------------------------------------------------------------------

export const MICRO_MISSION_BRIEFING = `Collect 3 classified dossiers within 30 turns.

On the island there are dossier caches. Use collect() to grab them.
Throughout the grid you can use collect() to grab items.
Talk to informants and ask about "jobs" or "deliveries" to get quest items. If you have an item to deliver, mention it by name.

Available tools (use exactly one per turn):
TOOL: move(direction="north|south|east|west")
TOOL: talk(message="your message")
TOOL: collect()

Respond with exactly one TOOL: line, no other text.
`;

// The one default the page ships in its system-prompt textarea (matches the mission
// the Saturday 09:00 exercise actually edits, see this directory's CLAUDE.md). Exported
// from here, rather than duplicated in app.js and in the Node-side live-key check, so
// both read the same text.
export const DEFAULT_SYSTEM_PROMPT = `You are a spy. ${MICRO_MISSION_BRIEFING}`;

// ---------------------------------------------------------------------------
// Game creation
// ---------------------------------------------------------------------------

export function createMicroGame() {
  const world = new MicroGameWorld();
  const operative = new Operative({ position: [2, 0] });
  operative.WIN_DOSSIERS = 3;
  const tools = new MicroGameTools(operative, world);
  return { operative, world, tools };
}
