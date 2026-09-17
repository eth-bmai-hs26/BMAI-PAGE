// Tool implementations for The Hidden Layer: the actions the agent can take.
// Ported from agentic_ai_spy/hidden_layer/tools.py. No DOM access.
//
// GameTools.talk() here is a minimal stub ("There is no one to talk to here."), not a full
// port of the Python base class's talk(). That base implementation (SAFEHOUSE/FORGE/LAB
// dialogue keyed off the full 8x8-mission NPC_CATALOG) is dead code for this build: both
// MicroGameTools and TrainingGameTools override talk() completely, exactly as in Python,
// and the 8x8/"full" mission is out of scope (the source web app does not serve it either;
// see the CLAUDE.md in this directory). The base talk() is never reached at runtime.

import { CellType, cellNpc, FACILITY_CATALOG, SAFEHOUSE_CATALOG, posKey } from "./game_world.js";

export class ToolResult {
  constructor(success, message) {
    this.success = success;
    this.message = message;
  }
}

// Weapon required to defeat each robot.
export const ROBOT_WEAPONS = {
  "Cryo-Sentinel": "Flamethrower",
  "Evil AI Robot": "Computer Virus",
};

export class GameTools {
  constructor(operative, world) {
    this.operative = operative;
    this.world = world;
    this._oracleFn = null;
  }

  setOracle(oracleFn) {
    this._oracleFn = oracleFn;
  }

  // ------------------------------------------------------------------
  // Internal: scan (auto-runs each turn, not agent-callable)
  // ------------------------------------------------------------------
  scan() {
    const [row, col] = this.operative.position;
    const desc = this.world.getVisibleDescription(row, col);
    return new ToolResult(true, desc);
  }

  // ------------------------------------------------------------------
  // Tool: move
  // ------------------------------------------------------------------
  move(direction) {
    direction = (direction || "").toLowerCase().trim();
    const deltas = { north: [-1, 0], south: [1, 0], east: [0, 1], west: [0, -1] };
    if (!(direction in deltas)) {
      return new ToolResult(false, `Invalid direction '${direction}'. Use north/south/east/west.`);
    }

    const [row, col] = this.operative.position;
    const [dr, dc] = deltas[direction];
    const newRow = row + dr, newCol = col + dc;

    if (!this.world.isPassable(newRow, newCol)) {
      const cell = this.world.getCell(newRow, newCol);
      if (cell.cellType === CellType.WALL) {
        return new ToolResult(false, `Cannot move ${direction}: concrete wall blocks your path.`);
      }
      return new ToolResult(false, `Cannot move ${direction}: out of bounds.`);
    }

    this.operative.position = [newRow, newCol];
    this.operative.visitedAdd(newRow, newCol);
    const cell = this.world.getCell(newRow, newCol);

    const messages = [`Moved ${direction} to (${newRow}, ${newCol}).`];

    // Cell-entry events
    if (cell.description) {
      messages.push(cell.description);
    }

    if (cell.cellType === CellType.JUNGLE && cell.trap) {
      this.operative.takeDamage(1);
      cell.trap = false;
      messages.push("Tripwire! A perimeter alarm triggers a shock device. You lose 1 health.");
    }

    if (cell.cellType === CellType.CACHE && cell.items.length) {
      messages.push("You spot classified documents here! Use collect() to grab them.");
    }

    if (cell.cellType === CellType.JUNGLE && cell.items.length) {
      messages.push("You notice something hidden among the vegetation. Use collect() to search.");
    }

    if (cell.cellType === CellType.INFORMANT) {
      const npc = cellNpc(cell);
      if (npc) {
        messages.push(`You encounter ${npc.name}. ${npc.greeting}`);
      }
    }

    if (cell.cellType === CellType.FORGE || cell.cellType === CellType.LAB) {
      const facility = cell.facilityPos ? FACILITY_CATALOG.get(posKey(...cell.facilityPos)) : null;
      if (facility) {
        messages.push(`You enter the ${facility.name}. ${facility.description}`);
      }
    }

    if (cell.cellType === CellType.SAFEHOUSE) {
      const sh = cell.safehousePos ? SAFEHOUSE_CATALOG.get(posKey(...cell.safehousePos)) : null;
      if (sh) {
        messages.push(`You enter the ${sh.name}. ${sh.description}`);
      }
    }

    if (cell.cellType === CellType.ROBOT) {
      const robot = cell.robotName;
      const requiredWeapon = ROBOT_WEAPONS[robot];
      const alreadyDead =
        (robot === "Cryo-Sentinel" && !this.world.cryoSentinelAlive) ||
        (robot === "Evil AI Robot" && !this.world.evilAiRobotAlive);
      if (alreadyDead) {
        messages.push(`The wreckage of the ${robot} lies here.`);
      } else if (this.operative.hasItem(requiredWeapon)) {
        // Auto-win: correct weapon in inventory
        if (robot === "Cryo-Sentinel") {
          this.world.cryoSentinelAlive = false;
        } else {
          this.world.evilAiRobotAlive = false;
        }
        this.operative.addDossiers(3);
        this.operative.addItem("Scrap Metal");
        messages.push(
          `You deploy the ${requiredWeapon} against the ${robot}! ` +
          `The machine crashes to the ground. +3 dossiers. ` +
          `You salvage Scrap Metal from the wreckage.`
        );
      } else {
        // No weapon: take damage and bounce back
        this.operative.takeDamage(1);
        this.operative.position = [row, col];
        this.operative.visitedDiscard(newRow, newCol);
        messages.push(
          `The ${robot} detects you and attacks! You take 1 damage and retreat. ` +
          `Health: ${this.operative.health}. You need ${requiredWeapon} to defeat it.`
        );
      }
    }

    if (cell.cellType === CellType.HELICOPTER) {
      messages.push("The helicopter is here. The pilot checks your dossier count...");
    }

    return new ToolResult(true, messages.join(" "));
  }

  // ------------------------------------------------------------------
  // Tool: talk (base stub; see file header)
  // ------------------------------------------------------------------
  talk(_message) {
    return new ToolResult(false, "There is no one to talk to here.");
  }

  // ------------------------------------------------------------------
  // Tool: collect
  // ------------------------------------------------------------------
  collect() {
    const [row, col] = this.operative.position;
    const cell = this.world.getCell(row, col);

    if (!cell.items.length) {
      return new ToolResult(false, "There is nothing to collect here.");
    }

    const picked = [];
    for (const itemName of cell.items.slice()) {
      if (itemName.startsWith("dossier_")) {
        this.operative.addDossiers(1);
        picked.push("1 dossier (classified files)");
      } else {
        this.operative.addItem(itemName);
        picked.push(itemName);
      }
    }
    cell.items.length = 0;

    return new ToolResult(true, `Collected: ${picked.join(", ")}.`);
  }

  // ------------------------------------------------------------------
  // Tool: fabricate
  // ------------------------------------------------------------------
  fabricate(item) {
    const [row, col] = this.operative.position;
    const cell = this.world.getCell(row, col);

    if (cell.cellType !== CellType.FORGE && cell.cellType !== CellType.LAB) {
      return new ToolResult(false, "You are not at a facility.");
    }

    const facility = cell.facilityPos ? FACILITY_CATALOG.get(posKey(...cell.facilityPos)) : null;
    if (!facility) {
      return new ToolResult(false, "This facility has nothing available.");
    }

    const itemClean = (item || "").trim();

    // Check craftable items first
    for (const [craftName, [required, cost]] of Object.entries(facility.crafts)) {
      if (itemClean.toLowerCase() === craftName.toLowerCase()) {
        if (!this.operative.hasItem(required)) {
          return new ToolResult(false, `You need ${required} to build ${craftName}.`);
        }
        if (!this.operative.spendDossiers(cost)) {
          return new ToolResult(false, `Not enough dossiers. ${craftName} costs ${cost} dossier(s) (plus ${required}).`);
        }
        this.operative.removeItem(required);
        this.operative.addItem(craftName);
        return new ToolResult(true, `Built ${craftName}! (Used ${required} + ${cost} dossier(s))`);
      }
    }

    // Check sellable items (operative selling to facility)
    for (const [buyName, price] of Object.entries(facility.buys)) {
      if (itemClean.toLowerCase() === buyName.toLowerCase() || itemClean.toLowerCase() === `sell ${buyName.toLowerCase()}`) {
        if (!this.operative.hasItem(buyName)) {
          return new ToolResult(false, `You don't have ${buyName} to sell.`);
        }
        this.operative.removeItem(buyName);
        this.operative.addDossiers(price);
        return new ToolResult(true, `Sold ${buyName} for ${price} dossier(s).`);
      }
    }

    const available = [...Object.keys(facility.crafts), ...Object.keys(facility.buys)];
    return new ToolResult(false, `'${itemClean}' is not available here. Available: ${available.join(", ")}`);
  }

  // ------------------------------------------------------------------
  // Dispatcher. Always async: talk() may need to await a network call to
  // OpenRouter (the LLM oracle), so every caller does
  // `const result = await tools.execute(name, args)` uniformly, even though
  // move()/collect()/scan()/fabricate() are internally synchronous. Awaiting
  // a plain (non-Promise) return value resolves it immediately, so this adds
  // no behavior change for the synchronous tools.
  // ------------------------------------------------------------------
  async execute(toolName, args) {
    args = args || {};
    const toolMap = {
      scan: () => this.scan(),
      move: () => this.move(args.direction || ""),
      talk: () => this.talk(args.message || ""),
      collect: () => this.collect(),
      fabricate: () => this.fabricate(args.item || ""),
    };

    const fn = toolMap[(toolName || "").toLowerCase().trim()];
    if (!fn) {
      return new ToolResult(false, `Unknown tool '${toolName}'. Available: ${Object.keys(toolMap).join(", ")}`);
    }

    return await fn();
  }
}
