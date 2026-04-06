export const API_DEFAULT_BASE_URL = "http://localhost:8000";

export const APP_SHELL_PADDING_X = { xs: 1.5, md: 2.5 };
export const APP_SHELL_PADDING_Y = 2.5;
export const APP_LAYOUT_MARGIN_TOP = 1.5;
export const APP_LAYOUT_GAP = 2;
export const APP_LAYOUT_RIGHT_COLUMN = { xs: "1fr", md: "minmax(340px, 430px) 1fr" };

export const DEFAULT_GRID_SIZE = 8;
export const MIN_GRID_SIZE = 4;
export const MAX_GRID_SIZE = 30;
export const MAZE_RESERVED_TILES = 2;

export const DEFAULT_GRID_PIXEL_SIZE = 760;
export const DEFAULT_RANDOM_WALLS = 10;

export const TRAINING_REPLAY_INTERVAL_MS = 120;
export const TRAINING_STREAM_RENDER_INTERVAL_MS = 85;

export const TILE_TOOLS = {
  START: "start",
  GOAL: "goal",
  WALL: "wall",
  ERASE: "erase",
};

export const DEFAULT_TILE_TOOL = TILE_TOOLS.WALL;

export const MAZE_VIEW_SLIDER_MIN = 320;
export const MAZE_VIEW_SLIDER_MAX = 1100;
export const MAZE_VIEW_SLIDER_STEP = 10;
export const MAZE_VIEW_SLIDER_WIDTH_SM = 340;
export const MAZE_VIEW_LABEL_MIN_WIDTH = 122;
export const MAZE_VIEW_RUN_BUTTON_MIN_WIDTH = 190;
export const MAZE_VIEW_REPLAY_BUTTON_MIN_WIDTH = 140;

export const DEFAULT_FORM = {
  model_id: "",
  episodes: 800,
  alpha: 0.1,
  gamma: 0.95,
  epsilon: 0.8,
  epsilon_decay: 1.0,
  max_steps: 60,
};

export const DEFAULT_TRAINING_VIEW = {
  completed: 0,
  total: 0,
  path: [],
  currentStep: 0,
  buffered: 0,
  isEpisodeActive: false,
};

export const MODEL_PARAMETER_HINTS = {
  model: "Choose which RL strategy learns the maze policy.",
  episodes: "Number of training runs through the maze. More episodes usually improve learning.",
  alpha: "Learning rate. Higher alpha updates Q-values faster from new experience.",
  gamma: "Discount factor. Higher gamma makes the agent value long-term rewards more.",
  epsilon: "Exploration rate. Higher epsilon makes the agent try random actions more often.",
  epsilon_decay: "Epsilon decay per episode. New epsilon = epsilon * decay (0..1).",
  max_steps: "Maximum steps per episode before truncation.",
};
