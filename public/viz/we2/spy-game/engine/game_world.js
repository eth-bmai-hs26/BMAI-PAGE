// Game world: map, cells, NPCs, items, and quest data for The Hidden Layer.
// Ported from agentic_ai_spy/hidden_layer/game_world.py. No DOM access.
//
// Position tuples (row, col) become plain [row, col] arrays; anywhere Python used them as
// dict keys (FACILITY_CATALOG, SAFEHOUSE_CATALOG) this file uses a "row,col" string key
// via posKey(). Cell.npc is ported as a function, cellNpc(cell), since JS object literals
// cannot carry a live computed property that re-reads a catalog by reference the way a
// Python @property does.

import { CellType, cellTypeEmoji, cellTypeLabel } from "./cell_types.js";
import { EM } from "./text.js";

// Re-exported so callers (tools.js, micro_mission.js, training_mission.js) can pull
// CellType from the same module they already import Cell/GameWorld helpers from.
export { CellType, cellTypeEmoji, cellTypeLabel };

export function posKey(row, col) {
  return `${row},${col}`;
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export const ITEM_CATALOG = {
  "Fuel Canister": { name: "Fuel Canister", description: "A canister of high-octane fuel.", questItem: true },
  "Hard Drive": { name: "Hard Drive", description: "An encrypted hard drive from OVERFIT's servers.", questItem: true },
  "Medical Supplies": { name: "Medical Supplies", description: "A field medic kit with bandages and antibiotics.", questItem: true },
  "Virus Code": { name: "Virus Code", description: "Source code for a computer virus targeting OVERFIT's AI.", questItem: true },
  "USB Drive": { name: "USB Drive", description: "A USB drive with intercepted OVERFIT data.", questItem: true },
  "Microfilm": { name: "Microfilm", description: "A roll of microfilm with stolen intelligence.", questItem: true },
  "Radio Codebook": { name: "Radio Codebook", description: "An encrypted codebook for re-establishing comms.", questItem: true },
  "Flamethrower": { name: "Flamethrower", description: "A portable flamethrower. Effective against cryo systems.", questItem: true },
  "Computer Virus": { name: "Computer Virus", description: "A compiled virus on a USB stick. Lethal to AI systems.", questItem: true },
  "Scrap Metal": { name: "Scrap Metal", description: "Salvaged robot parts. Might be worth something at the lab.", questItem: false },
};

// ---------------------------------------------------------------------------
// NPCs (base/full catalog). Used ONLY for two things: (a) the "You encounter X.
// <greeting>" line that move() prints when walking into an INFORMANT cell, and
// (b) the npc_name field in serialization. The micro/training missions look up
// their OWN NPC catalogs (MICRO_NPC_CATALOG / TRAINING_NPC_CATALOG) for talk()
// dialogue instead, so the greeting shown on arrival (from this catalog) is
// genuinely different in tone from that informant's actual talk() responses.
// That is source behavior, not a porting bug: reproduce it exactly.
// ---------------------------------------------------------------------------

export const NPC_CATALOG = {
  dr_vapnik: {
    name: "Dr. Vapnik",
    personality: "Cryptic, speaks in statistical metaphors. Old, disillusioned, once designed OVERFIT's core algorithms.",
    knowledge: [
      `The Cryo-Sentinel guards the northern server room (around row 2). It freezes intruders solid.`,
      `Only fire can defeat the Cryo-Sentinel ${EM} 'summer's fury melts winter's grip'.`,
      `The Weapons Forge to the south can build a flamethrower, but needs a Fuel Canister.`,
      `There is a dossier cache nearby to the southwest.`,
      `Agent Dropout in the center of the island knows where to find materials.`,
      `He has a USB Drive that needs to reach Informant Backprop.`,
    ],
    style: "Speaks in statistical metaphors. Uses phrases like 'data point', 'global minimum', 'converge'. Never gives direct coordinates.",
    greeting: `Ah, another data point walks in... Tell me, agent ${EM} do you seek the global minimum, or will you settle for a local one?`,
  },
  backprop: {
    name: "Informant Backprop",
    personality: "Paranoid double agent, fast-talking, always looking over his shoulder. Passes information backward through the network.",
    knowledge: [
      `The Evil AI Robot lurks in the eastern wing (around row 4, eastern side). It controls all cameras and locks.`,
      `Only a computer virus can take down the Evil AI Robot.`,
      `Agent Bias at the Northern Safe House had the virus code before she was compromised.`,
      `Bias needs medical supplies ${EM} she's injured and can't retrieve what she hid.`,
      `The agent they call Dropout scavenges medical gear. She might trade.`,
      `He has a Microfilm that needs to reach Dr. Vapnik. Will pay 2 dossiers.`,
    ],
    style: "Paranoid, fast-talking. Uses spy jargon. Calls the operative 'asset' or 'contact'. Always whispers. Never gives direct coordinates.",
    greeting: `Psst ${EM} you didn't hear this from me, and I didn't hear it from my source... but the gradient points east.`,
  },
  dropout: {
    name: "Agent Dropout",
    personality: "Burned spy who 'dropped out' of the network. Lives off-grid in the jungle. Expert in improvised equipment.",
    knowledge: [
      `Fuel Canisters can be found in the jungle to the northwest, where the western palms grow tallest (the jungle at row 2, column 0).`,
      `A Hard Drive is hidden in the dark jungle far to the north (the jungle at row 0, column 2).`,
      `She has Medical Supplies scavenged from a supply drop. Will trade for a Hard Drive.`,
      `She heard Agent Bias got hurt at the Northern Safe House and needs medical supplies.`,
      `The Weapons Forge and the Research Lab can both build powerful weapons from raw materials.`,
    ],
    style: "Bitter, sarcastic, but helpful. References being 'dropped' from the program. Uses nature metaphors mixed with tech jargon. Never gives direct coordinates.",
    greeting: `They dropped me from the program. Said I was 'reducing overfitting.' Jokes on them ${EM} I'm the only one still standing.`,
  },
};

export function cellNpc(cell) {
  if (cell.npcId) return NPC_CATALOG[cell.npcId] || null;
  return null;
}

// ---------------------------------------------------------------------------
// Facilities (Forge and Lab), keyed by their ORIGINAL 8x8-mission positions:
// these are shared as-is by the micro/training missions' inherited move() and
// fabricate() logic, whose own Forge cells sit at different coordinates. A
// facility lookup at those mission-local coordinates legitimately misses (see
// tools.js move()/fabricate()); that mismatch is source behavior.
// ---------------------------------------------------------------------------

export const FACILITY_CATALOG = new Map([
  [posKey(6, 2), {
    name: "Weapons Forge",
    description: "A makeshift workshop. A burly engineer wipes grease from his hands.",
    sells: {},
    crafts: { "Flamethrower": ["Fuel Canister", 1] },
    buys: {},
  }],
  [posKey(4, 1), {
    name: "Research Lab",
    description: "A cluttered lab full of screens and wires. A wild-haired scientist spins in his chair.",
    sells: {},
    crafts: { "Computer Virus": ["Virus Code", 1] },
    buys: { "Scrap Metal": 1 },
  }],
]);

// ---------------------------------------------------------------------------
// Safe Houses: same story as FACILITY_CATALOG, original 8x8-mission positions.
// ---------------------------------------------------------------------------

export const SAFEHOUSE_CATALOG = new Map([
  [posKey(7, 4), { name: "Southern Safe House", description: "A hidden basement beneath a ruined building. A handler sits by a radio, looking tense." }],
  [posKey(2, 5), { name: "Northern Safe House", description: "A concealed room behind a false wall. A woman clutches her side, wincing." }],
]);

// ---------------------------------------------------------------------------
// Cells
// ---------------------------------------------------------------------------

export function makeCell(cellType, opts = {}) {
  return {
    cellType,
    items: opts.items ? opts.items.slice() : [],
    npcId: opts.npcId ?? null,
    robotName: opts.robotName ?? null,
    trap: opts.trap ?? false,
    facilityPos: opts.facilityPos ?? null, // [row, col] or null
    safehousePos: opts.safehousePos ?? null, // [row, col] or null
    description: opts.description ?? "",
  };
}

// ---------------------------------------------------------------------------
// Game World (base class). ROWS/COLS and build_map() are supplied by mission
// subclasses, MicroGameWorld and TrainingGameWorld, exactly as in Python,
// where the shared 8x8 base map is never reached by either mission.
// ---------------------------------------------------------------------------

export class GameWorld {
  constructor() {
    this.grid = [];
    this.usbDrivePickedUp = false;
    this.usbDriveDelivered = false;
    this.microfilmPickedUp = false;
    this.microfilmDelivered = false;
    this.codebookPickedUp = false;
    this.codebookDelivered = false;
    this.hardDriveTraded = false;
    this.medicalSuppliesDelivered = false;
    this.virusCodeReceived = false;
    this.cryoSentinelAlive = true;
    this.evilAiRobotAlive = true;
  }

  _set(row, col, cell) {
    this.grid[row][col] = cell;
  }

  getCell(row, col) {
    if (row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS) {
      return this.grid[row][col];
    }
    return makeCell(CellType.WALL, { description: "The edge of the island." });
  }

  isPassable(row, col) {
    if (!(row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS)) return false;
    return this.grid[row][col].cellType !== CellType.WALL;
  }

  getAdjacent(row, col) {
    const directions = {
      north: [row - 1, col],
      south: [row + 1, col],
      east: [row, col + 1],
      west: [row, col - 1],
    };
    const result = {};
    for (const [direction, pos] of Object.entries(directions)) {
      const r = pos[0], c = pos[1];
      if (r >= 0 && r < this.ROWS && c >= 0 && c < this.COLS) {
        result[direction] = this.grid[r][c];
      } else {
        result[direction] = null;
      }
    }
    return result;
  }

  getVisibleDescription(row, col) {
    const lines = [];
    const current = this.getCell(row, col);
    lines.push(`You are at position (${row}, ${col}).`);
    if (current.description) {
      lines.push(`Current location: ${current.description}`);
    }
    const adjacent = this.getAdjacent(row, col);
    for (const [direction, cell] of Object.entries(adjacent)) {
      const cap = direction.charAt(0).toUpperCase() + direction.slice(1);
      if (cell === null) {
        lines.push(`  ${cap}: Edge of the island (impassable).`);
      } else {
        lines.push(`  ${cap}: ${cellTypeLabel(cell.cellType)} ${cellTypeEmoji(cell.cellType)}`);
      }
    }
    return lines.join("\n");
  }
}
