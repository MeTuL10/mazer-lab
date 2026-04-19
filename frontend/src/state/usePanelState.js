import { useState } from "react";

import {
  APP_LAYOUT_GAP,
  APP_LAYOUT_MARGIN_TOP,
  APP_LAYOUT_RIGHT_COLUMN,
  APP_SHELL_PADDING_X,
  APP_SHELL_PADDING_Y,
} from "../constants";

export function usePanelState() {
  const [expandedPanels, setExpandedPanels] = useState({
    maze: true,
    model: true,
    rewards: true,
    result: true,
  });

  function handlePanelToggle(panel) {
    return (_event, isExpanded) => {
      setExpandedPanels((prev) => ({ ...prev, [panel]: isExpanded }));
    };
  }

  function expandPanel(panel) {
    setExpandedPanels((prev) => ({ ...prev, [panel]: true }));
  }

  return {
    appModel: {
      shellSx: {
        minHeight: "100vh",
        px: APP_SHELL_PADDING_X,
        py: APP_SHELL_PADDING_Y,
      },
      layoutSx: {
        mt: APP_LAYOUT_MARGIN_TOP,
        display: "grid",
        gap: APP_LAYOUT_GAP,
        gridTemplateColumns: APP_LAYOUT_RIGHT_COLUMN,
        alignItems: "start",
      },
      leftPanelSpacing: 1.2,
    },
    expandedPanels,
    handlePanelToggle,
    expandPanel,
  };
}
