import { Box, Stack } from "@mui/material";

import AppTitle from "./components/AppTitle";
import MazeDesignPanel from "./components/MazeDesignPanel";
import MazeViewPanel from "./components/MazeViewPanel";
import ModelParametersPanel from "./components/ModelParametersPanel";
import SimulationResultsPanel from "./components/SimulationResultsPanel";
import { useAppState } from "./state";

export default function App() {
  const { appModel, panelModels } = useAppState();

  return (
    <Box className="app-shell" sx={appModel.shellSx}>
      <AppTitle />

      <Box sx={appModel.layoutSx}>
        <Stack spacing={appModel.leftPanelSpacing}>
          <MazeDesignPanel model={panelModels.mazeDesign} />
          <ModelParametersPanel model={panelModels.modelParameters} />
          <SimulationResultsPanel model={panelModels.simulationResults} />
        </Stack>

        <MazeViewPanel model={panelModels.mazeView} />
      </Box>
    </Box>
  );
}
