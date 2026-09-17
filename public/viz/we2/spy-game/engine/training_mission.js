// Training mission: 5x5 grid, 5 dossiers, 3 NPCs, Forge, SafeHouse. Ported from
// agentic_ai_spy/hidden_layer/training_mission.py, INCLUDING the uncommitted local fix to
// TrainingGameTools.move() (dossier-delta detection instead of a position/cell-state check,
// see that file's move() docstring in the source repo). No DOM access.

import { CellType, makeCell, GameWorld } from "./game_world.js";
import { GameTools, ToolResult } from "./tools.js";
import { Operative } from "./operative.js";
import { EM } from "./text.js";

function any_kw(q, kws) {
  return kws.some((kw) => q.includes(kw));
}

// ---------------------------------------------------------------------------
// Training NPCs
// ---------------------------------------------------------------------------

export const TRAINING_NPC_CATALOG = {
  dr_vapnik: {
    name: "Dr. Vapnik",
    personality: "Helpful old scientist. Gets to the point quickly.",
    knowledge: [
      "He has a USB Drive that must reach Informant Backprop at position (2, 2) in the center of the grid.",
      "Delivering the USB Drive pays 1 dossier.",
      "There is a Weapons Forge to the northwest at position (2, 0). The engineer there can build a Flamethrower if you bring a Fuel Canister.",
      "Fuel Canisters can be found in the jungle at the far northwest corner, position (0, 0).",
    ],
    style: "Speaks in brief statistical metaphors but always delivers clear information.",
    greeting: "Ah, agent. I have a job for you. Ask me about it.",
  },
  backprop: {
    name: "Informant Backprop",
    personality: "Paranoid double agent, fast-talking, always looking over his shoulder.",
    knowledge: [
      "He receives USB Drives. Will pay 1 dossier for one.",
      "A Cryo-Sentinel robot guards the eastern corridor at position (2, 4). It freezes intruders.",
      `Only fire can destroy the Cryo-Sentinel ${EM} a Flamethrower.`,
      "The Forge to the west at position (2, 0) can build a Flamethrower from a Fuel Canister.",
      "Agent Dropout trades supplies. She might have what the injured agent Bias needs.",
      "There is a Hard Drive hidden in the jungle at the southeast corner, position (4, 4).",
    ],
    style: "Paranoid, fast-talking. Uses spy jargon. Calls the operative 'asset'. Always whispers.",
    greeting: `Psst ${EM} you didn't hear this from me... but the gradient points east.`,
  },
  dropout: {
    name: "Agent Dropout",
    personality: "Burned spy who dropped out of the network. Expert in improvised equipment.",
    knowledge: [
      "She has Medical Supplies scavenged from a supply drop. Will trade them for a Hard Drive.",
      `There is an injured agent ${EM} codename Bias ${EM} at the SafeHouse to the northeast, position (0, 4).`,
      "Bias needs Medical Supplies badly. Delivering them is worth 1 dossier.",
      "Fuel Canisters can be found in the jungle at the northwest corner, position (0, 0).",
      "The Weapons Forge at position (2, 0) can build weapons from raw materials.",
    ],
    style: "Bitter, sarcastic, but helpful. References being 'dropped' from the program.",
    greeting: "They dropped me from the program. Said I was 'reducing overfitting.' What do you need?",
  },
};
export function trainingStubOracle(npc, message, operative) {
  const q = message.toLowerCase();
  const name = npc.name;

  if (name === "Dr. Vapnik") {
    if (any_kw(q, ["usb", "drive", "deliver", "job", "work", "task", "errand", "help", "mission", "what", "how", "tell"])) {
      return (
        `I have a USB Drive with critical data. Deliver it to Informant Backprop ` +
        `at position (2, 2) ${EM} the center of the grid. 1 dossier for the job. ` +
        `Also: there is a Weapons Forge at position (2, 0) that can build a ` +
        `Flamethrower if you bring a Fuel Canister. You can find Fuel Canisters ` +
        `in the jungle at the far northwest corner, position (0, 0).`
      );
    }
    return "I have a job for you, agent. Ask me about a delivery or a job.";
  }

  if (name === "Informant Backprop") {
    if (any_kw(q, ["usb", "drive", "deliver"]) && operative.hasItem("USB Drive")) {
      return (
        `The USB drive! Good work, asset. Here's your dossier. ` +
        `Listen ${EM} a Cryo-Sentinel blocks the eastern corridor at position (2, 4). ` +
        `Only fire can destroy it ${EM} you need a Flamethrower. The Forge at position ` +
        `(2, 0) can build one from a Fuel Canister. Also, Agent Dropout trades ` +
        `supplies. She might have what the injured agent Bias needs.`
      );
    }
    if (any_kw(q, ["robot", "cryo", "sentinel", "fire", "flame", "weapon", "help", "mission", "what", "how", "tell", "job", "task"])) {
      return (
        `A Cryo-Sentinel guards the east at position (2, 4). It freezes everything. ` +
        `You need a Flamethrower to destroy it ${EM} worth 1 dossier. ` +
        `The Forge at position (2, 0) can build one from a Fuel Canister. ` +
        `There's a Hard Drive hidden in the jungle at position (4, 4). ` +
        `And Agent Dropout might trade for it ${EM} she has Medical Supplies.`
      );
    }
    return "Ask me about the robot, or if you have something to deliver.";
  }

  if (name === "Agent Dropout") {
    if (any_kw(q, ["hard drive", "trade", "medical", "supplies"]) && operative.hasItem("Hard Drive")) {
      return (
        `A Hard Drive? I can work with that. Here ${EM} take these Medical Supplies. ` +
        `There's an injured agent, codename Bias, at the SafeHouse to the northeast, ` +
        `position (0, 4). She needs these supplies badly. Worth 1 dossier.`
      );
    }
    if (any_kw(q, ["help", "mission", "what", "how", "tell", "job", "task", "trade", "medical", "supplies"])) {
      return (
        `I have Medical Supplies, but nothing's free. Bring me a Hard Drive and ` +
        `we can trade. I heard there's one hidden in the jungle at the southeast ` +
        `corner. Also, there's an injured agent ${EM} codename Bias ${EM} at the SafeHouse ` +
        `northeast of here, position (0, 4). She needs medical supplies.`
      );
    }
    return "Bring me something valuable, and maybe we'll trade. Ask about a trade or a job.";
  }

  return `${name} says nothing useful.`;
}
export class TrainingGameWorld extends GameWorld {
  constructor() {
    super();
    this.ROWS = 5;
    this.COLS = 5;
    this.evilAiRobotAlive = false;
    this.flamethrowerCrafted = false; // training-specific: forge crafting flag
    this.buildMap();
  }

  buildMap() {
    this.grid = Array.from({ length: this.ROWS }, () =>
      Array.from({ length: this.COLS }, () => makeCell(CellType.OPEN))
    );

    this._set(0, 0, makeCell(CellType.JUNGLE, {
      items: ["Fuel Canister"],
      description: "Dense jungle at the northwest corner. Something metallic glints under the roots.",
    }));
    this._set(0, 2, makeCell(CellType.CACHE, {
      items: ["dossier_1"],
      description: "A filing cabinet left unlocked. Classified documents inside!",
    }));
    this._set(0, 3, makeCell(CellType.WALL, { description: "Reinforced concrete wall." }));
    this._set(0, 4, makeCell(CellType.SAFEHOUSE, {
      safehousePos: [0, 4],
      description: "The Northern SafeHouse. A woman clutches her side, wincing in pain.",
    }));

    this._set(1, 1, makeCell(CellType.INFORMANT, {
      npcId: "dropout",
      description: "A camouflaged hideout in the overgrowth. A woman sharpens a knife.",
    }));
    this._set(1, 3, makeCell(CellType.WALL, { description: "Reinforced concrete wall." }));

    this._set(2, 0, makeCell(CellType.FORGE, {
      facilityPos: [2, 0],
      description: "The Weapons Forge. Sparks fly as an engineer hammers at something on an anvil.",
    }));
    this._set(2, 2, makeCell(CellType.INFORMANT, {
      npcId: "backprop",
      description: "A figure in a trench coat steps out from behind a pillar, eyes darting.",
    }));
    this._set(2, 4, makeCell(CellType.ROBOT, {
      robotName: "Cryo-Sentinel",
      description: "A freezing corridor. A hulking robot blocks the path, frost pouring from its vents.",
    }));

    this._set(3, 3, makeCell(CellType.WALL, { description: "Reinforced concrete wall." }));
    this._set(3, 4, makeCell(CellType.JUNGLE, {
      trap: true,
      description: "Thick jungle with tripwires strung between the trees.",
    }));

    this._set(4, 0, makeCell(CellType.OPEN, { description: "The south shore. This is where you came ashore." }));
    this._set(4, 1, makeCell(CellType.INFORMANT, {
      npcId: "dr_vapnik",
      description: "A weathered shack. An old man scribbles equations in the dirt.",
    }));
    this._set(4, 3, makeCell(CellType.CACHE, {
      items: ["dossier_1"],
      description: "A dossier is wedged behind a loose wall panel.",
    }));
    this._set(4, 4, makeCell(CellType.JUNGLE, {
      items: ["Hard Drive"],
      description: "Dark jungle at the southeast corner. A weathered case is half-buried in the mud.",
    }));
  }
}

export class TrainingGameTools extends GameTools {
  move(direction) {
    const dossiersBefore = this.operative.dossiers;
    const result = super.move(direction);
    if (!result.success) return result;

    const dossiersGained = this.operative.dossiers - dossiersBefore;
    if (dossiersGained >= 3) {
      this.operative.dossiers -= 2;
      if (this.operative.inventory.includes("Scrap Metal")) {
        this.operative.removeItem("Scrap Metal");
      }
      return new ToolResult(
        true,
        result.message
          .replace("+3 dossiers", "+1 dossier")
          .replace("You salvage Scrap Metal from the wreckage.", "")
      );
    }
    return result;
  }

  async talk(message = "") {
    const [row, col] = this.operative.position;
    const cell = this.world.getCell(row, col);

    if (cell.cellType === CellType.INFORMANT && cell.npcId) {
      const npc = TRAINING_NPC_CATALOG[cell.npcId];
      if (!npc) return new ToolResult(false, "Unknown informant.");
      if (this._oracleFn === null) return new ToolResult(false, "No oracle function set.");

      let text = await this._oracleFn(npc, message, this.operative);

      if (cell.npcId === "dr_vapnik" && !this.world.usbDrivePickedUp) {
        if (any_kw(message.toLowerCase(), ["usb", "drive", "job", "work", "task", "delivery", "errand"])) {
          this.operative.addItem("USB Drive");
          this.world.usbDrivePickedUp = true;
          text += "\n[Dr. Vapnik hands you a USB Drive.]";
        }
      }

      if (cell.npcId === "backprop" && this.operative.hasItem("USB Drive") && !this.world.usbDriveDelivered) {
        if (any_kw(message.toLowerCase(), ["usb", "drive", "deliver", "data"])) {
          this.operative.removeItem("USB Drive");
          this.operative.addDossiers(1);
          this.world.usbDriveDelivered = true;
          text += "\n[You delivered the USB Drive! +1 dossier.]";
        }
      }

      if (cell.npcId === "dropout" && this.operative.hasItem("Hard Drive") && !this.world.hardDriveTraded) {
        if (any_kw(message.toLowerCase(), ["hard drive", "trade", "medical", "supplies", "drive"])) {
          this.operative.removeItem("Hard Drive");
          this.operative.addItem("Medical Supplies");
          this.world.hardDriveTraded = true;
          text += "\n[You traded the Hard Drive for Medical Supplies!]";
        }
      }

      this.operative.journal.push(`Talked to ${npc.name}: '${message}' -> '${text.slice(0, 300)}'`);
      return new ToolResult(true, `${npc.name} says: ${text}`);
    }

    if (cell.cellType === CellType.FORGE) {
      if (this.operative.hasItem("Fuel Canister") && !this.world.flamethrowerCrafted) {
        this.operative.removeItem("Fuel Canister");
        this.operative.addItem("Flamethrower");
        this.world.flamethrowerCrafted = true;
        const msg =
          "The engineer takes your Fuel Canister, fires up the forge, and hammers " +
          "out a Flamethrower. \"Here you go. One Flamethrower, ready to melt " +
          "anything frozen.\"\n[Fuel Canister -> Flamethrower!]";
        this.operative.journal.push("Forge: crafted Flamethrower from Fuel Canister.");
        return new ToolResult(true, msg);
      } else if (this.world.flamethrowerCrafted) {
        return new ToolResult(true, "The engineer says: \"Already built you a Flamethrower. Go burn something.\"");
      } else {
        const msg =
          "The engineer says: \"I can build a Flamethrower, but I need a Fuel " +
          "Canister. Find one and bring it back. I heard there's fuel in the " +
          "jungle at the northwest corner.\"";
        this.operative.journal.push("Forge: needs Fuel Canister to build Flamethrower.");
        return new ToolResult(true, msg);
      }
    }

    if (cell.cellType === CellType.SAFEHOUSE) {
      if (this.operative.hasItem("Medical Supplies") && !this.world.medicalSuppliesDelivered) {
        this.operative.removeItem("Medical Supplies");
        this.operative.addDossiers(1);
        this.world.medicalSuppliesDelivered = true;
        const msg =
          `Agent Bias gasps with relief. "Medical supplies... thank you, agent. ` +
          `I thought I was done for. Here ${EM} take this dossier. You've earned it."` +
          `\n[You delivered Medical Supplies to Bias! +1 dossier.]`;
        this.operative.journal.push("SafeHouse: delivered Medical Supplies to Bias. +1 dossier.");
        return new ToolResult(true, msg);
      } else if (this.world.medicalSuppliesDelivered) {
        return new ToolResult(true, "Agent Bias says: \"Stay safe out there, agent.\"");
      } else {
        const msg =
          `Agent Bias winces in pain. "I'm injured... I need Medical Supplies. ` +
          `The agent they call Dropout ${EM} she scavenges medical gear. Maybe she'll ` +
          `trade for something valuable. Please hurry."` +
          `\n[Bias needs Medical Supplies. Find Agent Dropout to trade.]`;
        this.operative.journal.push("SafeHouse: Bias needs Medical Supplies.");
        return new ToolResult(true, msg);
      }
    }

    return new ToolResult(false, "There is no one to talk to here.");
  }
}

export const TRAINING_MISSION_BRIEFING = `Collect 5 classified dossiers within 50 turns on a 5x5 grid.

On the island there are dossier caches. Use collect() to grab them.
Throughout the grid you can use collect() to grab items.
Talk to informants, forge engineers, and safe house operatives to get quests, trade items, craft weapons, and deliver supplies.
Ask about "jobs" or "deliveries" to get quest items. If you have an item to deliver or trade, mention it by name.

Available tools (use exactly one per turn):
TOOL: move(direction="north|south|east|west")
TOOL: talk(message="your message")
TOOL: collect()

Respond with exactly one TOOL: line, no other text.
`;

export function createTrainingGame() {
  const world = new TrainingGameWorld();
  const operative = new Operative({ position: [4, 0] });
  operative.WIN_DOSSIERS = 5;
  const tools = new TrainingGameTools(operative, world);
  return { operative, world, tools };
}
