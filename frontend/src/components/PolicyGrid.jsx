import { DEFAULT_GRID_PIXEL_SIZE } from "../constants";

function keyFor(row, col) {
  return `${row}-${col}`;
}

export default function PolicyGrid({
  maze,
  policy,
  pixelSize = DEFAULT_GRID_PIXEL_SIZE,
}) {
  if (!maze || maze.length === 0 || !maze[0]?.length) {
    return <div className="maze-placeholder">Run a simulation to view policy.</div>;
  }

  const rows = maze.length;
  const cols = maze[0].length;
  const hasPolicy = Array.isArray(policy) && policy.length === rows;

  return (
    <div
      className="policy-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        width: `min(100%, ${pixelSize}px)`,
      }}
    >
      {maze.map((row, rowIndex) =>
        row.map((_cell, colIndex) => {
          const policyValue = hasPolicy ? policy?.[rowIndex]?.[colIndex] : null;
          const isBlockedPolicyCell = policyValue === "x" || policyValue === "X";

          let className = "policy-cell";
          if (isBlockedPolicyCell) className += " wall";

          return (
            <div className={className} key={keyFor(rowIndex, colIndex)}>
              {isBlockedPolicyCell ? "" : (policyValue || "")}
            </div>
          );
        })
      )}
    </div>
  );
}


