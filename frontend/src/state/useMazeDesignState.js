import { useMemo, useState } from "react";

import {
  DEFAULT_GRID_PIXEL_SIZE,
  DEFAULT_GRID_SIZE,
  DEFAULT_RANDOM_WALLS,
  DEFAULT_TILE_TOOL,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  TILE_TOOLS,
} from "../constants";
import { clampToRange, parseNumericInput } from "../utils/number";
import {
  buildMazeGrid,
  coordKey,
  createMazeDesign,
  generateRandomWalls,
  isSameCoord,
  keySetToWallCoords,
  maxWallsForSize,
  wallCoordsToKeySet,
} from "../utils/maze";

export function useMazeDesignState({ setError, onBeforeDesignChange }) {
  const [gridSizeInput, setGridSizeInput] = useState(DEFAULT_GRID_SIZE);
  const [wallCountInput, setWallCountInput] = useState(DEFAULT_RANDOM_WALLS);
  const [tileTool, setTileTool] = useState(DEFAULT_TILE_TOOL);
  const [gridPixelSize, setGridPixelSize] = useState(DEFAULT_GRID_PIXEL_SIZE);
  const [mazeDesign, setMazeDesign] = useState(createMazeDesign(DEFAULT_GRID_SIZE));

  const designedMaze = useMemo(() => buildMazeGrid(mazeDesign), [mazeDesign]);
  const wallCount = mazeDesign.walls.length;
  const maxRandomWalls = maxWallsForSize(mazeDesign.size);

  function updateDesign(mutator) {
    onBeforeDesignChange();
    setMazeDesign((prev) => mutator(prev));
  }

  function handleCreateGrid() {
    setError("");
    const size = clampToRange(
      Math.floor(parseNumericInput(gridSizeInput, DEFAULT_GRID_SIZE)),
      MIN_GRID_SIZE,
      MAX_GRID_SIZE
    );
    setGridSizeInput(size);
    updateDesign(() => createMazeDesign(size));
  }

  function handleCellClick(row, col) {
    setError("");
    updateDesign((prev) => {
      const key = coordKey(row, col);
      const wallSet = wallCoordsToKeySet(prev.walls);

      if (tileTool === TILE_TOOLS.START) {
        if (isSameCoord(prev.goal, row, col)) {
          setError("Start tile cannot overlap the goal tile.");
          return prev;
        }
        wallSet.delete(key);
        return {
          ...prev,
          start: [row, col],
          walls: keySetToWallCoords(wallSet),
        };
      }

      if (tileTool === TILE_TOOLS.GOAL) {
        if (isSameCoord(prev.start, row, col)) {
          setError("Goal tile cannot overlap the start tile.");
          return prev;
        }
        wallSet.delete(key);
        return {
          ...prev,
          goal: [row, col],
          walls: keySetToWallCoords(wallSet),
        };
      }

      if (isSameCoord(prev.start, row, col) || isSameCoord(prev.goal, row, col)) {
        return prev;
      }

      if (tileTool === TILE_TOOLS.ERASE) {
        wallSet.delete(key);
      } else if (wallSet.has(key)) {
        wallSet.delete(key);
      } else {
        wallSet.add(key);
      }

      return {
        ...prev,
        walls: keySetToWallCoords(wallSet),
      };
    });
  }

  function handleClearWalls() {
    setError("");
    updateDesign((prev) => ({ ...prev, walls: [] }));
  }

  function handleRandomWalls() {
    setError("");
    updateDesign((prev) => {
      const requested = clampToRange(
        Math.floor(parseNumericInput(wallCountInput, 0)),
        0,
        maxWallsForSize(prev.size)
      );
      setWallCountInput(requested);

      return {
        ...prev,
        walls: generateRandomWalls(prev, requested),
      };
    });
  }

  return {
    mazeDesign,
    designedMaze,
    wallCount,
    gridSizeInput,
    setGridSizeInput,
    wallCountInput,
    setWallCountInput,
    tileTool,
    setTileTool,
    gridPixelSize,
    setGridPixelSize,
    maxRandomWalls,
    handleCreateGrid,
    handleCellClick,
    handleClearWalls,
    handleRandomWalls,
  };
}
