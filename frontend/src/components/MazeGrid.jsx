import { DEFAULT_GRID_PIXEL_SIZE } from "../constants";

function keyFor(row, col) {
  return `${row}-${col}`;
}

export default function MazeGrid({
  maze,
  start,
  goal,
  path,
  currentStep,
  onCellClick,
  pixelSize = DEFAULT_GRID_PIXEL_SIZE,
}) {
  if (!maze || maze.length === 0 || !maze[0]?.length) {
    return <div className="maze-placeholder">Design a maze, then run a simulation.</div>;
  }

  const rows = maze.length;
  const cols = maze[0].length;
  const isInteractive = typeof onCellClick === "function";
  const visited = new Set(path.slice(0, currentStep + 1).map(([r, c]) => keyFor(r, c)));
  const current = path[currentStep] || null;

  return (
    <div
      className="maze-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        width: `min(100%, ${pixelSize}px)`,
      }}
    >
      {maze.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isWall = cell === 1;
          const isStart = start[0] === rowIndex && start[1] === colIndex;
          const isGoal = goal[0] === rowIndex && goal[1] === colIndex;
          const isVisited = visited.has(keyFor(rowIndex, colIndex));
          const isCurrent = current && current[0] === rowIndex && current[1] === colIndex;

          let className = "maze-cell";
          if (isWall) className += " wall";
          if (isVisited) className += " visited";
          if (isStart) className += " start";
          if (isGoal) className += " goal";
          if (isCurrent) className += " current";
          if (isInteractive) className += " clickable";

          return (
            <button
              type="button"
              className={className}
              key={keyFor(rowIndex, colIndex)}
              onClick={() => isInteractive && onCellClick(rowIndex, colIndex)}
            >
              {isStart ? "S" : isGoal ? "G" : isCurrent ? "A" : ""}
            </button>
          );
        })
      )}
    </div>
  );
}
