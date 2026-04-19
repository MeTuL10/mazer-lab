import { useCallback, useRef, useState } from "react";

import { useMazeDesignState } from "./useMazeDesignState";
import { useModelParametersState } from "./useModelParametersState";
import { usePanelState } from "./usePanelState";
import { useSimulationState } from "./useSimulationState";

export function useAppState() {
  const [error, setError] = useState("");

  const panelState = usePanelState();
  const resetSimulationRef = useRef(() => {});

  const onBeforeDesignChange = useCallback(() => {
    resetSimulationRef.current();
  }, []);

  const modelState = useModelParametersState({ setError });
  const mazeState = useMazeDesignState({ setError, onBeforeDesignChange });

  const simulationState = useSimulationState({
    form: modelState.form,
    mazeDesign: mazeState.mazeDesign,
    designedMaze: mazeState.designedMaze,
    setError,
    onExpandResults: () => panelState.expandPanel("result"),
  });

  resetSimulationRef.current = simulationState.resetSimulationView;

  return {
    appModel: panelState.appModel,
    panelModels: {
      mazeDesign: {
        expanded: panelState.expandedPanels.maze,
        onToggle: panelState.handlePanelToggle("maze"),
        mazeDesign: mazeState.mazeDesign,
        wallCount: mazeState.wallCount,
        gridSizeInput: mazeState.gridSizeInput,
        setGridSizeInput: mazeState.setGridSizeInput,
        onCreateGrid: mazeState.handleCreateGrid,
        tileTool: mazeState.tileTool,
        setTileTool: mazeState.setTileTool,
        wallCountInput: mazeState.wallCountInput,
        setWallCountInput: mazeState.setWallCountInput,
        maxRandomWalls: mazeState.maxRandomWalls,
        onRandomWalls: mazeState.handleRandomWalls,
        onClearWalls: mazeState.handleClearWalls,
      },
      modelParameters: {
        expanded: panelState.expandedPanels.model,
        onToggle: panelState.handlePanelToggle("model"),
        selectedModel: modelState.selectedModel,
        models: modelState.models,
        form: modelState.form,
        onFormFieldChange: modelState.onFormFieldChange,
      },
      rewardConfiguration: {
        expanded: panelState.expandedPanels.rewards,
        onToggle: panelState.handlePanelToggle("rewards"),
        rewards: modelState.form.rewards,
        onRewardFieldChange: modelState.onRewardFieldChange,
      },
      simulationResults: {
        expanded: panelState.expandedPanels.result,
        onToggle: panelState.handlePanelToggle("result"),
        simResult: simulationState.simResult,
        canRun: simulationState.canRun,
        loading: simulationState.loading,
        error,
        showTraining: simulationState.showTraining,
        onShowTrainingChange: simulationState.setShowTraining,
        onSkipLiveTraining: simulationState.handleSkipLiveTraining,
        trainingProgress: simulationState.showTraining ? simulationState.trainingView : null,
        onRunSimulation: simulationState.onRunSimulation,
        onReplayPath: simulationState.handleReplayPath,
        showRunButton: true,
      },
      mazeView: {
        canRun: simulationState.canRun,
        loading: simulationState.loading,
        onRunSimulation: simulationState.onRunSimulation,
        onReplayPath: simulationState.handleReplayPath,
        canReplay: Boolean(simulationState.simResult?.path?.length),
        gridPixelSize: mazeState.gridPixelSize,
        onGridPixelSizeChange: mazeState.setGridPixelSize,
        showTraining: simulationState.showTraining,
        onShowTrainingChange: simulationState.setShowTraining,
        viewPolicy: simulationState.viewPolicy,
        onViewPolicyChange: simulationState.setViewPolicy,
        maze: simulationState.displayMaze,
        start: simulationState.displayStart,
        goal: simulationState.displayGoal,
        path: simulationState.displayPath,
        policy: simulationState.displayPolicy,
        currentStep: simulationState.displayCurrentStep,
        onCellClick: mazeState.handleCellClick,
      },
    },
  };
}
