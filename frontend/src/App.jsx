import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Slider,
  Stack,
  Typography,
} from "@mui/material";

import { fetchModels, runSimulation, runSimulationStream } from "./api";
import {
  DEFAULT_FORM,
  DEFAULT_GRID_PIXEL_SIZE,
  DEFAULT_GRID_SIZE,
  DEFAULT_RANDOM_WALLS,
  DEFAULT_TRAINING_VIEW,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  TRAINING_REPLAY_INTERVAL_MS,
  TRAINING_STREAM_RENDER_INTERVAL_MS,
} from "./constants";
import AppTitle from "./components/AppTitle";
import MazeDesignPanel from "./components/MazeDesignPanel";
import MazeGrid from "./components/MazeGrid";
import ModelParametersPanel from "./components/ModelParametersPanel";
import SimulationResultsPanel from "./components/SimulationResultsPanel";

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
  const [wallCountInput, setWallCountInput] = useState(DEFAULT_RANDOM_WALLS);
  const [tileTool, setTileTool] = useState("wall");
  const [gridPixelSize, setGridPixelSize] = useState(DEFAULT_GRID_PIXEL_SIZE);
  const [mazeDesign, setMazeDesign] = useState(createMazeDesign(DEFAULT_GRID_SIZE));

  const [showTraining, setShowTraining] = useState(false);
  const [trainingView, setTrainingView] = useState(DEFAULT_TRAINING_VIEW);
  const streamQueueRef = useRef([]);

  const [expandedPanels, setExpandedPanels] = useState({
    maze: true,
    model: true,
    result: true,
  });

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
    }, TRAINING_REPLAY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isAnimating, simResult]);

  useEffect(() => {
    if (!showTraining) {
      return undefined;
    }

    const timer = setInterval(() => {
      const next = streamQueueRef.current.shift();
      if (!next) {
        return;
      }

      setTrainingView({
        completed: next.completed,
        total: next.total,
        path: next.path || [],
        buffered: streamQueueRef.current.length,
      });
    }, TRAINING_STREAM_RENDER_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [showTraining]);

  const designedMaze = useMemo(() => buildMazeGrid(mazeDesign), [mazeDesign]);

  const wallCount = mazeDesign.walls.length;
  const maxRandomWalls = mazeDesign.size * mazeDesign.size - 2;

  const canRun = useMemo(() => {
    return Boolean(form.model_id) && !loading;
  }, [form.model_id, loading]);

  const selectedModel = useMemo(() => {
    return models.find((item) => item.id === form.model_id)?.name || "No model selected";
  }, [models, form.model_id]);

  function handlePanelToggle(panel) {
    return (_event, isExpanded) => {
      setExpandedPanels((prev) => ({ ...prev, [panel]: isExpanded }));
    };
  }

  function resetTrainingView() {
    streamQueueRef.current = [];
    setTrainingView(DEFAULT_TRAINING_VIEW);
  }

  function resetSimulationView() {
    setSimResult(null);
    setCurrentStep(0);
    setIsAnimating(false);
    resetTrainingView();
  }

  function updateDesign(mutator) {
    resetSimulationView();
    setMazeDesign((prev) => mutator(prev));
  }

  function handleCreateGrid() {
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
      } else if (wallSet.has(key)) {
        wallSet.delete(key);
      } else {
        wallSet.add(key);
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

  async function onRunSimulation() {
    setError("");
    setLoading(true);
    setIsAnimating(false);
    setSimResult(null);
    setCurrentStep(0);
    resetTrainingView();

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

      const result = showTraining
        ? await runSimulationStream(payload, {
            onStarted: (event) => {
              setTrainingView((prev) => ({
                ...prev,
                total: event.episodes || payload.episodes,
              }));
            },
            onProgress: (event) => {
              streamQueueRef.current.push(event);
              setTrainingView((prev) => ({
                ...prev,
                total: event.total || prev.total,
                buffered: streamQueueRef.current.length,
              }));
            },
          })
        : await runSimulation(payload);

      setSimResult(result);
      setCurrentStep(0);
      setIsAnimating(true);
      setExpandedPanels((prev) => ({ ...prev, result: true }));
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  const displayMaze = simResult?.maze || designedMaze;
  const displayStart = simResult?.start || mazeDesign.start;
  const displayGoal = simResult?.goal || mazeDesign.goal;
  const hasLiveFrames = showTraining
    && trainingView.path.length > 0
    && (loading || trainingView.buffered > 0);
  const livePath = hasLiveFrames ? trainingView.path : [];
  const displayPath = livePath.length > 0 ? livePath : simResult?.path || [];
  const displayCurrentStep = hasLiveFrames
    ? Math.max(0, displayPath.length - 1)
    : currentStep;

  return (
    <Box
      className="app-shell"
      sx={{
        minHeight: "100vh",
        px: { xs: 1.5, md: 2.5 },
        py: 2.5,
      }}
    >
      <AppTitle />

      <Box
        sx={{
          mt: 1.5,
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "minmax(340px, 430px) 1fr" },
          alignItems: "start",
        }}
      >
        <Stack spacing={1.2}>
          <MazeDesignPanel
            expanded={expandedPanels.maze}
            onToggle={handlePanelToggle("maze")}
            mazeDesign={mazeDesign}
            wallCount={wallCount}
            gridSizeInput={gridSizeInput}
            setGridSizeInput={setGridSizeInput}
            onCreateGrid={handleCreateGrid}
            tileTool={tileTool}
            setTileTool={setTileTool}
            wallCountInput={wallCountInput}
            setWallCountInput={setWallCountInput}
            maxRandomWalls={maxRandomWalls}
            onRandomWalls={handleRandomWalls}
            onClearWalls={handleClearWalls}
          />

          <ModelParametersPanel
            expanded={expandedPanels.model}
            onToggle={handlePanelToggle("model")}
            selectedModel={selectedModel}
            models={models}
            form={form}
            setForm={setForm}
          />

          <SimulationResultsPanel
            expanded={expandedPanels.result}
            onToggle={handlePanelToggle("result")}
            simResult={simResult}
            canRun={canRun}
            loading={loading}
            error={error}
            showTraining={showTraining}
            onShowTrainingChange={setShowTraining}
            trainingProgress={showTraining ? trainingView : null}
            onRunSimulation={onRunSimulation}
            onReplayPath={() => {
              setCurrentStep(0);
              setIsAnimating(true);
            }}
          />
        </Stack>

        <Paper className="maze-panel" sx={{ p: 2, borderRadius: 3 }} elevation={4}>
          <Stack spacing={1.4}>
            <Stack spacing={0.8}>
              <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center" }}>
                Maze View
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignSelf: "flex-start" }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={onRunSimulation}
                  disabled={!canRun}
                  sx={{ minWidth: 190, px: 3 }}
                >
                  {loading ? "Training in progress" : "Run Simulation"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setCurrentStep(0);
                    setIsAnimating(true);
                  }}
                  disabled={loading || !simResult?.path?.length}
                  sx={{ minWidth: 140, px: 2 }}
                >
                  Replay Path
                </Button>
              </Stack>
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 122, textAlign: "left" }}>
                Grid Size in View
              </Typography>
              <Slider
                min={320}
                max={1100}
                step={10}
                value={gridPixelSize}
                onChange={(_event, value) => setGridPixelSize(value)}
                valueLabelDisplay="auto"
                sx={{ width: { xs: "100%", sm: 340 }, mx: { xs: 0, sm: "auto" } }}
              />
            </Stack>

            <MazeGrid
              maze={displayMaze}
              start={displayStart}
              goal={displayGoal}
              path={displayPath}
              currentStep={displayCurrentStep}
              onCellClick={handleCellClick}
              pixelSize={gridPixelSize}
            />
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}


