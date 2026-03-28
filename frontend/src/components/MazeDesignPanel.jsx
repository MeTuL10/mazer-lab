import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

export default function MazeDesignPanel({
  expanded,
  onToggle,
  mazeDesign,
  wallCount,
  gridSizeInput,
  setGridSizeInput,
  onCreateGrid,
  tileTool,
  setTileTool,
  wallCountInput,
  setWallCountInput,
  maxRandomWalls,
  onRandomWalls,
  onClearWalls,
}) {
  return (
    <Accordion expanded={expanded} onChange={onToggle}>
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
          <TextField
            fullWidth
            size="small"
            label="Grid Size (n)"
            type="number"
            value={gridSizeInput}
            inputProps={{ min: 4, max: 30 }}
            onChange={(e) => setGridSizeInput(e.target.value)}
          />
          <Button fullWidth variant="contained" onClick={onCreateGrid}>
            Create Grid
          </Button>

          <Divider />

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant={tileTool === "start" ? "contained" : "outlined"}
              onClick={() => setTileTool("start")}
            >
              Place Start
            </Button>
            <Button
              fullWidth
              variant={tileTool === "goal" ? "contained" : "outlined"}
              onClick={() => setTileTool("goal")}
            >
              Place Goal
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant={tileTool === "wall" ? "contained" : "outlined"}
              onClick={() => setTileTool("wall")}
            >
              Toggle Wall
            </Button>
            <Button
              fullWidth
              variant={tileTool === "erase" ? "contained" : "outlined"}
              onClick={() => setTileTool("erase")}
            >
              Erase Wall
            </Button>
          </Stack>

          <TextField
            fullWidth
            sx={{ mt: 1.35 }}
            size="small"
            label="Random Walls (m)"
            type="number"
            value={wallCountInput}
            inputProps={{ min: 0, max: maxRandomWalls }}
            onChange={(e) => setWallCountInput(e.target.value)}
          />

          <Stack direction="row" spacing={1}>
            <Button fullWidth variant="outlined" onClick={onRandomWalls}>
              Generate Random Walls
            </Button>
            <Button fullWidth variant="outlined" color="inherit" onClick={onClearWalls}>
              Clear Walls
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 0.6 }}>
            <Chip
              label={`Start: [${mazeDesign.start[0]}, ${mazeDesign.start[1]}]`}
              size="small"
              sx={{ backgroundColor: "rgba(255, 99, 71, 0.22)" }}
            />
            <Chip
              label={`Goal: [${mazeDesign.goal[0]}, ${mazeDesign.goal[1]}]`}
              size="small"
              sx={{ backgroundColor: "rgba(255, 166, 77, 0.22)" }}
            />
          </Stack>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
