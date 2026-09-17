// Operative state management for The Hidden Layer.
// Ported from agentic_ai_spy/hidden_layer/operative.py. No DOM access.
//
// Python's `position: tuple[int,int]` and `visited: set[tuple[int,int]]` rely on tuples
// being hashable and value-comparable. JS arrays are neither, so `visited` is stored as a
// Set of "row,col" string keys (see posKey in game_world.js) and exposed to callers as an
// array of [row, col] pairs via visitedList(), matching serialization.py's
// `[[r, c] for r, c in operative.visited]`.

function posKey(row, col) {
  return `${row},${col}`;
}

export class Operative {
  constructor({ position = [7, 0] } = {}) {
    this.health = 3;
    this.dossiers = 0;
    this.inventory = [];
    this.position = [position[0], position[1]];
    this.visited = new Set([posKey(position[0], position[1])]);
    this.journal = [];
    this.MAX_HEALTH = 3;
    this.WIN_DOSSIERS = 10;
  }

  hasItem(name) {
    return this.inventory.includes(name);
  }

  addItem(name) {
    this.inventory.push(name);
  }

  removeItem(name) {
    const idx = this.inventory.indexOf(name);
    if (idx === -1) return false;
    this.inventory.splice(idx, 1);
    return true;
  }

  addDossiers(amount) {
    this.dossiers += amount;
  }

  spendDossiers(amount) {
    if (this.dossiers >= amount) {
      this.dossiers -= amount;
      return true;
    }
    return false;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }

  heal(amount) {
    this.health = Math.min(this.MAX_HEALTH, this.health + amount);
  }

  get isAlive() {
    return this.health > 0;
  }

  get hasWon() {
    return this.dossiers >= this.WIN_DOSSIERS && this.isAlive;
  }

  visitedAdd(row, col) {
    this.visited.add(posKey(row, col));
  }

  visitedHas(row, col) {
    return this.visited.has(posKey(row, col));
  }

  visitedDiscard(row, col) {
    this.visited.delete(posKey(row, col));
  }

  visitedList() {
    return Array.from(this.visited, (k) => k.split(",").map(Number));
  }

  statusText() {
    const inv = this.inventory.length ? this.inventory.join(", ") : "empty";
    return (
      `Health: ${this.health}/${this.MAX_HEALTH} | ` +
      `Dossiers: ${this.dossiers} | ` +
      `Position: (${this.position[0]}, ${this.position[1]}) | ` +
      `Inventory: [${inv}] | ` +
      `Visited: ${this.visited.size} cells`
    );
  }
}
