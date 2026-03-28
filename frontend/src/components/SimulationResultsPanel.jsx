import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function formatMetric(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(4);
  }
  return value;
}

export default function SimulationResultsPanel({
  expanded,
  onToggle,
  simResult,
  canRun,
  loading,
  error,
  onRunSimulation,
  onReplayPath,
}) {
  const metricCards = simResult
    ? [
        { label: "Algorithm", value: simResult.metrics.algorithm },
        { label: "Solved", value: simResult.solved ? "Yes" : "No" },
        { label: "Path Length", value: simResult.path.length },
        { label: "Mean Reward", value: simResult.metrics.mean_reward },
        { label: "Success Rate", value: simResult.metrics.success_rate },
      ]
    : [];

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
          <Button variant="contained" onClick={onRunSimulation} disabled={!canRun}>
            {loading ? "Training in progress" : "Run Simulation"}
          </Button>

          {loading ? (
            <Alert icon={<CircularProgress size={16} />} severity="info">
              training in the background
            </Alert>
          ) : null}

          {error ? <Alert severity="error">{error}</Alert> : null}

          {simResult ? (
            <>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip label={`Algo: ${simResult.metrics.algorithm}`} size="small" />
                <Chip label={`Path: ${simResult.path.length}`} size="small" />
                <Chip label={`Success: ${formatMetric(simResult.metrics.success_rate)}`} size="small" />
              </Stack>

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
