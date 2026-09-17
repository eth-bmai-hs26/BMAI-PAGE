// Game state serialization for the frontend (fog-of-war projection). Ported from
// agentic_ai_spy/hidden_layer/serialization.py. No DOM access: this only builds plain
// data, the same shape web/static/game.js's renderer already expects from the old
// WebSocket payloads, so the renderer itself barely changes.

import { cellTypeEmoji, cellTypeLabel } from "./cell_types.js";
import { cellNpc } from "./game_world.js";

function cellToDict(cell, row, col, operative, world) {
  let visible = operative.visitedHas(row, col);
  if (!visible) {
    for (const [vr, vc] of operative.visitedList()) {
      if (Math.abs(vr - row) + Math.abs(vc - col) === 1 && row >= 0 && row < world.ROWS && col >= 0 && col < world.COLS) {
        visible = true;
        break;
      }
    }
  }

  if (visible) {
    const npc = cellNpc(cell);
    return {
      type: cell.cellType,
      emoji: cellTypeEmoji(cell.cellType),
      label: cellTypeLabel(cell.cellType),
      description: cell.description,
      has_items: cell.items.length > 0,
      npc_name: npc ? npc.name : null,
      robot_name: cell.robotName,
      visible: true,
    };
  }
  return {
    type: "unknown",
    emoji: "░",
    label: "",
    description: "",
    has_items: false,
    npc_name: null,
    robot_name: null,
    visible: false,
  };
}

export function gameStateToDict(operative, world, turn, maxTurns) {
  const grid = [];
  for (let r = 0; r < world.ROWS; r++) {
    const row = [];
    for (let c = 0; c < world.COLS; c++) {
      row.push(cellToDict(world.getCell(r, c), r, c, operative, world));
    }
    grid.push(row);
  }

  return {
    turn,
    max_turns: maxTurns,
    position: operative.position.slice(),
    health: operative.health,
    max_health: operative.MAX_HEALTH,
    dossiers: operative.dossiers,
    win_dossiers: operative.WIN_DOSSIERS,
    inventory: operative.inventory.slice(),
    visited: operative.visitedList(),
    journal: operative.journal.slice(-5),
    grid,
    is_alive: operative.isAlive,
    has_won: operative.hasWon,
    cryo_alive: world.cryoSentinelAlive,
    evil_ai_alive: world.evilAiRobotAlive,
    rows: world.ROWS,
    cols: world.COLS,
  };
}
