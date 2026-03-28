import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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
    }, 120);

    return () => clearInterval(timer);
  }, [isAnimating, simResult]);

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

  function resetSimulationView() {
    setSimResult(null);
    setCurrentStep(0);
    setIsAnimating(false);
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

  async function onRunSimulation() {
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
  const displayPath = simResult?.path || [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 2,
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", md: "minmax(340px, 430px) 1fr" },
      }}
    >
      <Paper sx={{ p: 2, borderRadius: 3 }} elevation={4}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          RL Maze Simulator
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
          Configure the maze and model, then run training and watch path replay.
        </Typography>

        <Accordion expanded={expandedPanels.maze} onChange={handlePanelToggle("maze")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Maze Design
              </Typography>
              <Chip label={`${mazeDesign.size}x${mazeDesign.size}`} size="small" />
              <Chip label={`Walls: ${wallCount}`} size="small" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField
                  size="small"
                  label="Grid Size (n)"
                  type="number"
                  value={gridSizeInput}
                  inputProps={{ min: MIN_GRID_SIZE, max: MAX_GRID_SIZE }}
                  onChange={(e) => setGridSizeInput(e.target.value)}
                />
                <Button variant="contained" onClick={handleCreateGrid}>
                  Create Grid
                </Button>
              </Stack>

              <Divider />

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {[
                  ["start", "Place Start"],
                  ["goal", "Place Goal"],
                  ["wall", "Toggle Wall"],
                  ["erase", "Erase Wall"],
                ].map(([id, label]) => (
                  <Button
                    key={id}
                    size="small"
                    variant={tileTool === id ? "contained" : "outlined"}
                    onClick={() => setTileTool(id)}
                  >
                    {label}
                  </Button>
                ))}
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField
                  size="small"
                  label="Random Walls (m)"
                  type="number"
                  value={wallCountInput}
                  inputProps={{ min: 0, max: maxRandomWalls }}
                  onChange={(e) => setWallCountInput(e.target.value)}
                />
                <Button variant="outlined" onClick={handleRandomWalls}>
                  Generate Random Walls
                </Button>
                <Button variant="outlined" color="inherit" onClick={handleClearWalls}>
                  Clear Walls
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Start: [{mazeDesign.start[0]}, {mazeDesign.start[1]}] | Goal: [{mazeDesign.goal[0]}, {mazeDesign.goal[1]}]
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expandedPanels.model} onChange={handlePanelToggle("model")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Model & Parameters
              </Typography>
              <Chip label={selectedModel} size="small" />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.2}>
              <TextField
                select
                size="small"
                label="Model"
                value={form.model_id}
                onChange={(e) => setForm((prev) => ({ ...prev, model_id: e.target.value }))}
              >
                {models.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Episodes"
                type="number"
                value={form.episodes}
                inputProps={{ min: 1, max: 10000 }}
                onChange={(e) => setForm((prev) => ({ ...prev, episodes: e.target.value }))}
              />
              <TextField
                size="small"
                label="Alpha"
                type="number"
                value={form.alpha}
                inputProps={{ min: 0.01, max: 1, step: 0.01 }}
                onChange={(e) => setForm((prev) => ({ ...prev, alpha: e.target.value }))}
              />
              <TextField
                size="small"
                label="Gamma"
                type="number"
                value={form.gamma}
                inputProps={{ min: 0.01, max: 1, step: 0.01 }}
                onChange={(e) => setForm((prev) => ({ ...prev, gamma: e.target.value }))}
              />
              <TextField
                size="small"
                label="Epsilon"
                type="number"
                value={form.epsilon}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                onChange={(e) => setForm((prev) => ({ ...prev, epsilon: e.target.value }))}
              />
              <TextField
                size="small"
                label="Max Steps"
                type="number"
                value={form.max_steps}
                inputProps={{ min: 10, max: 2000 }}
                onChange={(e) => setForm((prev) => ({ ...prev, max_steps: e.target.value }))}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Stack spacing={1.2} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={onRunSimulation} disabled={!canRun}>
            {loading ? "Training..." : "Run Simulation"}
          </Button>

          {loading ? (
            <Alert icon={<CircularProgress size={16} />} severity="info">
              training in the background
            </Alert>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </Paper>

      <Stack spacing={2}>
        <Accordion expanded={expandedPanels.result} onChange={handlePanelToggle("result")}> 
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Results
              </Typography>
              <Chip
                label={simResult ? `${simResult.metrics.algorithm} | ${simResult.solved ? "Solved" : "Not Solved"}` : "No run yet"}
                size="small"
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {simResult ? (
              <Stack spacing={0.7}>
                <Typography variant="body2">Algorithm: {simResult.metrics.algorithm}</Typography>
                <Typography variant="body2">Solved: {simResult.solved ? "Yes" : "No"}</Typography>
                <Typography variant="body2">Path Length: {simResult.path.length}</Typography>
                <Typography variant="body2">Mean Reward: {simResult.metrics.mean_reward}</Typography>
                <Typography variant="body2">Success Rate: {simResult.metrics.success_rate}</Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCurrentStep(0);
                    setIsAnimating(true);
                  }}
                  disabled={!simResult.path?.length}
                >
                  Replay Path
                </Button>
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No model has been run yet. Configure maze and model settings, then click "Run Simulation".
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Paper sx={{ p: 2, borderRadius: 3 }} elevation={4}>
          <MazeGrid
            maze={displayMaze}
            start={displayStart}
            goal={displayGoal}
            path={displayPath}
            currentStep={currentStep}
            onCellClick={handleCellClick}
          />
        </Paper>
      </Stack>
    </Box>
  );
}