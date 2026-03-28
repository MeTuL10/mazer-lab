import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const PARAMETER_HINTS = {
  model: "Choose which RL strategy learns the maze policy.",
  episodes: "Number of training runs through the maze. More episodes usually improve learning.",
  alpha: "Learning rate. Higher alpha updates Q-values faster from new experience.",
  gamma: "Discount factor. Higher gamma makes the agent value long-term rewards more.",
  epsilon: "Exploration rate. Higher epsilon makes the agent try random actions more often.",
  max_steps: "Maximum steps per episode before truncation.",
};

function FieldHint({ label, hint }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Tooltip title={hint} arrow placement="top">
        <IconButton size="small" sx={{ p: 0.25 }}>
          <HelpOutlineIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default function ModelParametersPanel({
  expanded,
  onToggle,
  selectedModel,
  models,
  form,
  setForm,
}) {
  return (
    <Accordion expanded={expanded} onChange={onToggle}>
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
          <FieldHint label="Model" hint={PARAMETER_HINTS.model} />
          <TextField
            select
            size="small"
            value={form.model_id}
            onChange={(e) => setForm((prev) => ({ ...prev, model_id: e.target.value }))}
          >
            {models.map((model) => (
              <MenuItem key={model.id} value={model.id}>
                {model.name}
              </MenuItem>
            ))}
          </TextField>

          <FieldHint label="Episodes" hint={PARAMETER_HINTS.episodes} />
          <TextField
            size="small"
            type="number"
            value={form.episodes}
            inputProps={{ min: 1, max: 10000 }}
            onChange={(e) => setForm((prev) => ({ ...prev, episodes: e.target.value }))}
          />

          <FieldHint label="Alpha" hint={PARAMETER_HINTS.alpha} />
          <TextField
            size="small"
            type="number"
            value={form.alpha}
            inputProps={{ min: 0.01, max: 1, step: 0.01 }}
            onChange={(e) => setForm((prev) => ({ ...prev, alpha: e.target.value }))}
          />

          <FieldHint label="Gamma" hint={PARAMETER_HINTS.gamma} />
          <TextField
            size="small"
            type="number"
            value={form.gamma}
            inputProps={{ min: 0.01, max: 1, step: 0.01 }}
            onChange={(e) => setForm((prev) => ({ ...prev, gamma: e.target.value }))}
          />

          <FieldHint label="Epsilon" hint={PARAMETER_HINTS.epsilon} />
          <TextField
            size="small"
            type="number"
            value={form.epsilon}
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            onChange={(e) => setForm((prev) => ({ ...prev, epsilon: e.target.value }))}
          />

          <FieldHint label="Max Steps" hint={PARAMETER_HINTS.max_steps} />
          <TextField
            size="small"
            type="number"
            value={form.max_steps}
            inputProps={{ min: 10, max: 2000 }}
            onChange={(e) => setForm((prev) => ({ ...prev, max_steps: e.target.value }))}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
