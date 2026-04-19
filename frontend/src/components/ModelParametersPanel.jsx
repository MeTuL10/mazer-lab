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

import { MODEL_PARAMETER_HINTS } from "../constants";

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

export default function ModelParametersPanel({ model }) {
  const {
    expanded,
    onToggle,
    selectedModel,
    models,
    form,
    onFormFieldChange,
  } = model;

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
          <FieldHint label="Model" hint={MODEL_PARAMETER_HINTS.model} />
          <TextField
            select
            size="small"
            value={form.model_id}
            onChange={(e) => onFormFieldChange("model_id", e.target.value)}
          >
            {models.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>

          <FieldHint label="Episodes" hint={MODEL_PARAMETER_HINTS.episodes} />
          <TextField
            size="small"
            type="number"
            value={form.episodes}
            inputProps={{ min: 1 }}
            onChange={(e) => onFormFieldChange("episodes", e.target.value)}
          />

          <FieldHint label="Alpha" hint={MODEL_PARAMETER_HINTS.alpha} />
          <TextField
            size="small"
            type="number"
            value={form.alpha}
            inputProps={{ min: 0.01, max: 1, step: 0.01 }}
            onChange={(e) => onFormFieldChange("alpha", e.target.value)}
          />

          <FieldHint label="Gamma" hint={MODEL_PARAMETER_HINTS.gamma} />
          <TextField
            size="small"
            type="number"
            value={form.gamma}
            inputProps={{ min: 0.01, max: 1, step: 0.01 }}
            onChange={(e) => onFormFieldChange("gamma", e.target.value)}
          />

          <FieldHint label="Epsilon" hint={MODEL_PARAMETER_HINTS.epsilon} />
          <TextField
            size="small"
            type="number"
            value={form.epsilon}
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            onChange={(e) => onFormFieldChange("epsilon", e.target.value)}
          />

          <FieldHint label="Epsilon Decay" hint={MODEL_PARAMETER_HINTS.epsilon_decay} />
          <TextField
            size="small"
            type="number"
            value={form.epsilon_decay}
            inputProps={{ min: 0, max: 1, step: 0.01 }}
            onChange={(e) => onFormFieldChange("epsilon_decay", e.target.value)}
          />

          <FieldHint label="Max Steps" hint={MODEL_PARAMETER_HINTS.max_steps} />
          <TextField
            size="small"
            type="number"
            value={form.max_steps}
            inputProps={{ min: 10, max: 2000 }}
            onChange={(e) => onFormFieldChange("max_steps", e.target.value)}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
