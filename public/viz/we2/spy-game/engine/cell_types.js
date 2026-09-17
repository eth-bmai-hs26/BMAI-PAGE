// Cell types for The Hidden Layer. Ported from agentic_ai_spy/hidden_layer/game_world.py
// (CellType enum). No DOM access. Values are plain strings, matching the Python enum's
// .value (used directly in serialization, exactly like cell.cell_type.value did).

export const CellType = Object.freeze({
  OPEN: "open",
  JUNGLE: "jungle",
  WALL: "wall",
  CACHE: "cache",
  INFORMANT: "informant",
  FORGE: "forge",
  LAB: "lab",
  SAFEHOUSE: "safehouse",
  ROBOT: "robot",
  HELICOPTER: "helicopter",
});

const EMOJI = {
  [CellType.OPEN]: "·",
  [CellType.JUNGLE]: "\u{1F334}",
  [CellType.WALL]: "\u{1F9F1}",
  [CellType.CACHE]: "\u{1F4C1}",
  [CellType.INFORMANT]: "\u{1F575}️",
  [CellType.FORGE]: "⚒️",
  [CellType.LAB]: "\u{1F52C}",
  [CellType.SAFEHOUSE]: "\u{1F3E0}",
  [CellType.ROBOT]: "\u{1F916}",
  [CellType.HELICOPTER]: "\u{1F681}",
};

const LABEL = {
  [CellType.OPEN]: "Open ground",
  [CellType.JUNGLE]: "Jungle",
  [CellType.WALL]: "Concrete wall (impassable)",
  [CellType.CACHE]: "Dossier cache",
  [CellType.INFORMANT]: "Informant",
  [CellType.FORGE]: "Weapons Forge",
  [CellType.LAB]: "Research Lab",
  [CellType.SAFEHOUSE]: "Safe House",
  [CellType.ROBOT]: "Robot",
  [CellType.HELICOPTER]: "Helicopter",
};

export function cellTypeEmoji(cellType) {
  return EMOJI[cellType];
}

export function cellTypeLabel(cellType) {
  return LABEL[cellType];
}
