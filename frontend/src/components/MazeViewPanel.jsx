import {
  Button,
  Paper,
  Slider,
  Stack,
  Typography,
} from "@mui/material";

import {
  MAZE_VIEW_LABEL_MIN_WIDTH,
  MAZE_VIEW_REPLAY_BUTTON_MIN_WIDTH,
  MAZE_VIEW_RUN_BUTTON_MIN_WIDTH,
  MAZE_VIEW_SLIDER_MAX,
  MAZE_VIEW_SLIDER_MIN,
  MAZE_VIEW_SLIDER_STEP,
  MAZE_VIEW_SLIDER_WIDTH_SM,
} from "../constants";
import MazeGrid from "./MazeGrid";

export default function MazeViewPanel({ model }) {
  const {
    canRun,
    loading,
    onRunSimulation,
    onReplayPath,
    canReplay,
    gridPixelSize,
    onGridPixelSizeChange,
    maze,
    start,
    goal,
    path,
    currentStep,
    onCellClick,
  } = model;

  return (
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
              sx={{ minWidth: MAZE_VIEW_RUN_BUTTON_MIN_WIDTH, px: 3 }}
            >
              {loading ? "Training in progress" : "Run Simulation"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={onReplayPath}
              disabled={loading || !canReplay}
              sx={{ minWidth: MAZE_VIEW_REPLAY_BUTTON_MIN_WIDTH, px: 2 }}
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
          <Typography variant="body2" sx={{ fontWeight: 600, minWidth: MAZE_VIEW_LABEL_MIN_WIDTH, textAlign: "left" }}>
            Grid Size in View
          </Typography>
          <Slider
            min={MAZE_VIEW_SLIDER_MIN}
            max={MAZE_VIEW_SLIDER_MAX}
            step={MAZE_VIEW_SLIDER_STEP}
            value={gridPixelSize}
            onChange={(_event, value) => onGridPixelSizeChange(value)}
            valueLabelDisplay="auto"
            sx={{ width: { xs: "100%", sm: MAZE_VIEW_SLIDER_WIDTH_SM }, mx: { xs: 0, sm: "auto" } }}
          />
        </Stack>

        <MazeGrid
          maze={maze}
          start={start}
          goal={goal}
          path={path}
          currentStep={currentStep}
          onCellClick={onCellClick}
          pixelSize={gridPixelSize}
        />
      </Stack>
    </Paper>
  );
}
