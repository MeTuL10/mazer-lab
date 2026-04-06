import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack } from "@mui/material";

import { fetchModels, runSimulation, runSimulationStream } from "./api";
import {
  DEFAULT_FORM,
  DEFAULT_GRID_PIXEL_SIZE,
  DEFAULT_GRID_SIZE,
  DEFAULT_RANDOM_WALLS,
  DEFAULT_TILE_TOOL,
  DEFAULT_TRAINING_VIEW,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
  TILE_TOOLS,
  TRAINING_REPLAY_INTERVAL_MS,
  TRAINING_STREAM_RENDER_INTERVAL_MS,
} from "./constants";
import AppTitle from "./components/AppTitle";
import MazeDesignPanel from "./components/MazeDesignPanel";
import MazeViewPanel from "./components/MazeViewPanel";
import ModelParametersPanel from "./components/ModelParametersPanel";
import SimulationResultsPanel from "./components/SimulationResultsPanel";
import { clampToRange, parseNumericInput } from "./utils/number";
import {
  buildMazeGrid,
  coordKey,
  createMazeDesign,
  generateRandomWalls,
  isSameCoord,
  keySetToWallCoords,
  maxWallsForSize,
  wallCoordsToKeySet,
} from "./utils/maze";

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
  const [tileTool, setTileTool] = useState(DEFAULT_TILE_TOOL);
  const [gridPixelSize, setGridPixelSize] = useState(DEFAULT_GRID_PIXEL_SIZE);
  const [mazeDesign, setMazeDesign] = useState(createMazeDesign(DEFAULT_GRID_SIZE));

  const [showTraining, setShowTraining] = useState(false);
  const [trainingView, setTrainingView] = useState(DEFAULT_TRAINING_VIEW);
  const streamQueueRef = useRef([]);
  const skipLiveTrainingRef = useRef(false);

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
  const maxRandomWalls = maxWallsForSize(mazeDesign.size);

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
    skipLiveTrainingRef.current = false;
    streamQueueRef.current = [];
    setTrainingView(DEFAULT_TRAINING_VIEW);
  }

  function handleSkipLiveTraining() {
    skipLiveTrainingRef.current = true;
    streamQueueRef.current = [];
    setTrainingView(DEFAULT_TRAINING_VIEW);
    setShowTraining(false);
  }

  function handleReplayPath() {
    setCurrentStep(0);
    setIsAnimating(true);
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
        episodes: parseNumericInput(form.episodes, DEFAULT_FORM.episodes),
        alpha: parseNumericInput(form.alpha, DEFAULT_FORM.alpha),
        gamma: parseNumericInput(form.gamma, DEFAULT_FORM.gamma),
        epsilon: parseNumericInput(form.epsilon, DEFAULT_FORM.epsilon),
        epsilon_decay: parseNumericInput(form.epsilon_decay, DEFAULT_FORM.epsilon_decay),
        max_steps: parseNumericInput(form.max_steps, DEFAULT_FORM.max_steps),
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
              if (skipLiveTrainingRef.current) {
                return;
              }
              setTrainingView((prev) => ({
                ...prev,
                total: event.episodes || payload.episodes,
              }));
            },
            onProgress: (event) => {
              if (skipLiveTrainingRef.current) {
                return;
              }
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
            onSkipLiveTraining={handleSkipLiveTraining}
            trainingProgress={showTraining ? trainingView : null}
            onRunSimulation={onRunSimulation}
            onReplayPath={handleReplayPath}
          />
        </Stack>

        <MazeViewPanel
          canRun={canRun}
          loading={loading}
          onRunSimulation={onRunSimulation}
          onReplayPath={handleReplayPath}
          canReplay={Boolean(simResult?.path?.length)}
          gridPixelSize={gridPixelSize}
          onGridPixelSizeChange={setGridPixelSize}
          maze={displayMaze}
          start={displayStart}
          goal={displayGoal}
          path={displayPath}
          currentStep={displayCurrentStep}
          onCellClick={handleCellClick}
        />
      </Box>
    </Box>
  );
}
