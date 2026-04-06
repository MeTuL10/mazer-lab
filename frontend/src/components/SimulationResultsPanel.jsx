import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

function formatMetric(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(4);
  }
  return value;
}

export default function SimulationResultsPanel({ model }) {
  const {
    expanded,
    onToggle,
    simResult,
    canRun,
    loading,
    error,
    showTraining,
    onShowTrainingChange,
    onSkipLiveTraining,
    trainingProgress,
    onRunSimulation,
    onReplayPath,
    showRunButton = true,
  } = model;

  const metricCards = simResult
    ? [
        { label: "Algorithm", value: simResult.metrics.algorithm },
        { label: "Solved", value: simResult.solved ? "Yes" : "No" },
        { label: "Path Length", value: simResult.path.length },
        { label: "Mean Reward", value: simResult.metrics.mean_reward },
        { label: "Success Rate", value: simResult.metrics.success_rate },
      ]
    : [];

  const progressTotal = trainingProgress?.total || 0;
  const progressCompleted = trainingProgress?.completed || 0;
  const progressPercent = progressTotal > 0
    ? Math.min(100, (progressCompleted / progressTotal) * 100)
    : 0;

  const isLiveTrainingActive = showTraining && (loading || (trainingProgress?.buffered ?? 0) > 0);

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Simulation Control & Results
          </Typography>
          <Chip
            label={simResult ? (simResult.solved ? "Solved" : "Not solved") : "No run yet"}
            size="small"
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <FormControlLabel
              control={(
                <Switch
                  size="small"
                  checked={showTraining}
                  disabled={loading}
                  onChange={(event) => onShowTrainingChange(event.target.checked)}
                />
              )}
              label="Show Training Live"
              sx={{ m: 0 }}
            />
            <Tooltip
              title="Live training rendering is useful for visibility, but it can slow simulation speed because the UI has to keep repainting each streamed step."
              arrow
              placement="top"
            >
              <IconButton size="small" sx={{ p: 0.35 }}>
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {showRunButton ? (
            <Button variant="contained" onClick={onRunSimulation} disabled={!canRun}>
              {loading ? "Training in progress" : "Run Simulation"}
            </Button>
          ) : null}

          {loading ? (
            <Alert icon={<CircularProgress size={16} />} severity="info">
              training in the background
            </Alert>
          ) : null}

          {isLiveTrainingActive ? (
            <Stack spacing={0.6}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  {progressTotal > 0
                    ? `${loading ? "Streaming" : "Rendering buffered"} episodes: ${progressCompleted}/${progressTotal}`
                    : loading
                      ? "Preparing training stream..."
                      : "Rendering buffered episodes..."}
                  {trainingProgress?.buffered > 0
                    ? ` | buffered: ${trainingProgress.buffered}`
                    : ""}
                </Typography>
                {onSkipLiveTraining ? (
                  <Button size="small" variant="text" onClick={onSkipLiveTraining}>
                    Skip live training
                  </Button>
                ) : null}
              </Stack>
              <LinearProgress
                variant={progressTotal > 0 ? "determinate" : "indeterminate"}
                value={progressPercent}
              />
            </Stack>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {simResult ? (
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  gap: 1,
                }}
              >
                {metricCards.map((item) => (
                  <Box key={item.label} className="result-card">
                    <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "0.03em" }}>
                      {item.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {formatMetric(item.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Button variant="outlined" onClick={onReplayPath} disabled={!simResult.path?.length}>
                Replay Path
              </Button>
            </>
          ) : (
            <Box className="result-placeholder">
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                No run yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure your maze and model, then click "Run Simulation" to view metrics and replay.
              </Typography>
            </Box>
          )}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
