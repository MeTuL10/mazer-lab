import { MAZE_RESERVED_TILES } from "../constants";

export function coordKey(row, col) {
  return `${row}-${col}`;
}

export function isSameCoord(coord, row, col) {
  return coord[0] === row && coord[1] === col;
}

export function createMazeDesign(size) {
  return {
    size,
    start: [0, 0],
    goal: [size - 1, size - 1],
    walls: [],
  };
}

export function wallCoordsToKeySet(walls) {
  return new Set(walls.map(([row, col]) => coordKey(row, col)));
}

export function keySetToWallCoords(wallSet) {
  return [...wallSet].map((entry) => entry.split("-").map(Number));
}

export function maxWallsForSize(size) {
  return size * size - MAZE_RESERVED_TILES;
}

export function buildMazeGrid(design) {
  const grid = Array.from({ length: design.size }, () => Array(design.size).fill(0));
  for (const [row, col] of design.walls) {
    if (row >= 0 && row < design.size && col >= 0 && col < design.size) {
      grid[row][col] = 1;
    }
  }
  return grid;
}

export function generateRandomWalls(design, requested) {
  const excluded = new Set([
    coordKey(design.start[0], design.start[1]),
    coordKey(design.goal[0], design.goal[1]),
  ]);

  const candidates = [];
  for (let row = 0; row < design.size; row += 1) {
    for (let col = 0; col < design.size; col += 1) {
      const key = coordKey(row, col);
      if (!excluded.has(key)) {
        candidates.push([row, col]);
      }
    }
  }

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  return candidates.slice(0, requested);
}
