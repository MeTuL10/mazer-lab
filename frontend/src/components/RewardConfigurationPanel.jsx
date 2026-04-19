import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
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

export default function RewardConfigurationPanel({ model }) {
  const {
    expanded,
    onToggle,
    rewards,
    onRewardFieldChange,
  } = model;

  return (
    <Accordion expanded={expanded} onChange={onToggle}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Reward Configuration
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.2}>
          <FieldHint label="Step Reward" hint={MODEL_PARAMETER_HINTS.step_reward} />
          <TextField
            size="small"
            type="number"
            value={rewards?.step_reward}
            inputProps={{ step: 0.01 }}
            onChange={(e) => onRewardFieldChange("step_reward", e.target.value)}
          />

          <FieldHint label="Wall Penalty" hint={MODEL_PARAMETER_HINTS.wall_penalty} />
          <TextField
            size="small"
            type="number"
            value={rewards?.wall_penalty}
            inputProps={{ step: 0.01 }}
            onChange={(e) => onRewardFieldChange("wall_penalty", e.target.value)}
          />

          <FieldHint label="Goal Reward" hint={MODEL_PARAMETER_HINTS.goal_reward} />
          <TextField
            size="small"
            type="number"
            value={rewards?.goal_reward}
            inputProps={{ step: 0.01 }}
            onChange={(e) => onRewardFieldChange("goal_reward", e.target.value)}
          />
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
