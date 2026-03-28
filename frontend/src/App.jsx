import { useEffect, useMemo, useState } from "react";
import MazeGrid from "./components/MazeGrid";
import { fetchModels, runSimulation } from "./api";

const DEFAULT_GRID_SIZE = 8;
const MIN_GRID_SIZE = 4;
const MAX_GRID_SIZE = 30;

const DEFAULT_FORM = {
  model_id: "",
  episodes: 800,
  alpha: 0.1,
  gamma: 0.95,
  epsilon: 0.15,
  max_steps: 200,
};

function parseNumericInput(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createMazeDesign(size) {
  return {
    size,
    start: [0, 0],
    goal: [size - 1, size - 1],
    walls: [],
  };
}

function coordKey(row, col) {
  return `${row}-${col}`;
}

function isSameCoord(coord, row, col) {
  return coord[0] === row && coord[1] === col;
}

function buildMazeGrid(design) {
  const grid = Array.from({ length: design.size }, () => Array(design.size).fill(0));
  for (const [row, col] of design.walls) {
    if (row >= 0 && row < design.size && col >= 0 && col < design.size) {
      grid[row][col] = 1;
    }
  }
  return grid;
}

export default function App() {
  const [models, setModels] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [simResult, setSimResult] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [gridSizeInput, setGridSizeInput] = useState(DEFAULT_GRID_SIZE);
  const [wallCountInput, setWallCountInput] = useState(10);
  const [tileTool, setTileTool] = useState("wall");
  const [mazeDesign, setMazeDesign] = useState(createMazeDesign(DEFAULT_GRID_SIZE));

  useEffect(() => {
    async function loadModels() {
      try {
        const payload = await fetchModels();
        const list = payload.models || [];
        setModels(list);
        if (list.length > 0) {
          setForm((prev) => ({ ...prev, model_id: list[0].id }));
        }
      } catch (err) {
        setError(err.message || "Unable to fetch model list.");
      }
    }

    loadModels();
  }, []);

  useEffect(() => {
    if (!isAnimating || !simResult?.path?.length) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= simResult.path.length - 1) {
          setIsAnimating(false);
          return prev;
        }
        return prev + 1;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [isAnimating, simResult]);

  const designedMaze = useMemo(() => buildMazeGrid(mazeDesign), [mazeDesign]);

  const wallCount = mazeDesign.walls.length;
  const maxRandomWalls = mazeDesign.size * mazeDesign.size - 2;

  const canRun = useMemo(() => {
    return form.model_id && !loading;
  }, [form.model_id, loading]);

  function resetSimulationView() {
    setSimResult(null);
    setCurrentStep(0);
    setIsAnimating(false);
  }

  function updateDesign(mutator) {
    resetSimulationView();
    setMazeDesign((prev) => mutator(prev));
  }

  function handleCreateGrid(event) {
    event.preventDefault();
    setError("");
    const size = clamp(
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
      const wallSet = new Set(prev.walls.map(([r, c]) => coordKey(r, c)));

      if (tileTool === "start") {
        if (isSameCoord(prev.goal, row, col)) {
          setError("Start tile cannot overlap the goal tile.");
          return prev;
        }
        wallSet.delete(key);
        return {
          ...prev,
          start: [row, col],
          walls: [...wallSet].map((entry) => entry.split("-").map(Number)),
        };
      }

      if (tileTool === "goal") {
        if (isSameCoord(prev.start, row, col)) {
          setError("Goal tile cannot overlap the start tile.");
          return prev;
        }
        wallSet.delete(key);
        return {
          ...prev,
          goal: [row, col],
          walls: [...wallSet].map((entry) => entry.split("-").map(Number)),
        };
      }

      if (isSameCoord(prev.start, row, col) || isSameCoord(prev.goal, row, col)) {
        return prev;
      }

      if (tileTool === "erase") {
        wallSet.delete(key);
      } else {
        if (wallSet.has(key)) {
          wallSet.delete(key);
        } else {
          wallSet.add(key);
        }
      }

      return {
        ...prev,
        walls: [...wallSet].map((entry) => entry.split("-").map(Number)),
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
      const requested = clamp(
        Math.floor(parseNumericInput(wallCountInput, 0)),
        0,
        prev.size * prev.size - 2
      );
      setWallCountInput(requested);

      const excluded = new Set([
        coordKey(prev.start[0], prev.start[1]),
        coordKey(prev.goal[0], prev.goal[1]),
      ]);

      const candidates = [];
      for (let row = 0; row < prev.size; row += 1) {
        for (let col = 0; col < prev.size; col += 1) {
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

      return {
        ...prev,
        walls: candidates.slice(0, requested),
      };
    });
  }

  async function onRunSimulation(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    setIsAnimating(false);

    try {
      const payload = {
        model_id: form.model_id,
        episodes: parseNumericInput(form.episodes, 800),
        alpha: parseNumericInput(form.alpha, 0.1),
        gamma: parseNumericInput(form.gamma, 0.95),
        epsilon: parseNumericInput(form.epsilon, 0.15),
        max_steps: parseNumericInput(form.max_steps, 200),
        maze: {
          size: mazeDesign.size,
          start: mazeDesign.start,
          goal: mazeDesign.goal,
          walls: mazeDesign.walls,
        },
      };
      const result = await runSimulation(payload);
      setSimResult(result);
      setCurrentStep(0);
      setIsAnimating(true);
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  const displayMaze = simResult?.maze || designedMaze;
  const displayStart = simResult?.start || mazeDesign.start;
  const displayGoal = simResult?.goal || mazeDesign.goal;
  const displayPath = simResult?.path || [];

  return (
    <main className="page">
      <section className="panel">
        <h1>RL Maze Simulator</h1>
        <p>Design a maze, choose an RL model, and watch it learn the path.</p>

        <section className="designer-card">
          <h2>Maze Designer</h2>
          <form className="designer-grid-size" onSubmit={handleCreateGrid}>
            <label>
              Grid Size (n x n)
              <input
                type="number"
                min={MIN_GRID_SIZE}
                max={MAX_GRID_SIZE}
                value={gridSizeInput}
                onChange={(e) => setGridSizeInput(e.target.value)}
              />
            </label>
            <button type="submit">Create Grid</button>
          </form>

          <div className="tool-row">
            <span className="tool-label">Tile Tool</span>
            {[
              ["start", "Place Start"],
              ["goal", "Place Goal"],
              ["wall", "Toggle Wall"],
              ["erase", "Erase Wall"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                className={`tool-btn ${tileTool === id ? "active" : ""}`}
                onClick={() => setTileTool(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="wall-controls">
            <label>
              Random Walls (m)
              <input
                type="number"
                min="0"
                max={maxRandomWalls}
                value={wallCountInput}
                onChange={(e) => setWallCountInput(e.target.value)}
              />
            </label>
            <button type="button" onClick={handleRandomWalls}>
              Generate Random Walls
            </button>
            <button type="button" onClick={handleClearWalls}>
              Clear Walls
            </button>
          </div>

          <p className="designer-meta">
            Size: {mazeDesign.size}x{mazeDesign.size} | Start: [{mazeDesign.start[0]}, {mazeDesign.start[1]}] |
            Goal: [{mazeDesign.goal[0]}, {mazeDesign.goal[1]}] | Walls: {wallCount}
          </p>
        </section>

        <form className="form-grid" onSubmit={onRunSimulation}>
          <label>
            Model
            <select
              value={form.model_id}
              onChange={(e) => setForm((prev) => ({ ...prev, model_id: e.target.value }))}
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Episodes
            <input
              type="number"
              min="1"
              max="10000"
              value={form.episodes}
              onChange={(e) => setForm((prev) => ({ ...prev, episodes: e.target.value }))}
            />
          </label>

          <label>
            Alpha
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              value={form.alpha}
              onChange={(e) => setForm((prev) => ({ ...prev, alpha: e.target.value }))}
            />
          </label>

          <label>
            Gamma
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              value={form.gamma}
              onChange={(e) => setForm((prev) => ({ ...prev, gamma: e.target.value }))}
            />
          </label>

          <label>
            Epsilon
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.epsilon}
              onChange={(e) => setForm((prev) => ({ ...prev, epsilon: e.target.value }))}
            />
          </label>

          <label>
            Max Steps
            <input
              type="number"
              min="10"
              max="2000"
              value={form.max_steps}
              onChange={(e) => setForm((prev) => ({ ...prev, max_steps: e.target.value }))}
            />
          </label>

          <button type="submit" disabled={!canRun}>
            {loading ? "Training..." : "Run Simulation"}
          </button>
        </form>

        {error ? <div className="error-box">{error}</div> : null}

        {simResult ? (
          <div className="stats">
            <h2>Results</h2>
            <p>Algorithm: {simResult.metrics.algorithm}</p>
            <p>Solved: {simResult.solved ? "Yes" : "No"}</p>
            <p>Path Length: {simResult.path.length}</p>
            <p>Mean Reward: {simResult.metrics.mean_reward}</p>
            <p>Success Rate: {simResult.metrics.success_rate}</p>
            <button
              type="button"
              onClick={() => {
                setCurrentStep(0);
                setIsAnimating(true);
              }}
              disabled={!simResult.path?.length}
            >
              Replay Path
            </button>
          </div>
        ) : null}
      </section>

      <section className="maze-wrap">
        <MazeGrid
          maze={displayMaze}
          start={displayStart}
          goal={displayGoal}
          path={displayPath}
          currentStep={currentStep}
          onCellClick={handleCellClick}
        />
      </section>
    </main>
  );
}