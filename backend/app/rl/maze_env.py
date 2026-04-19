from __future__ import annotations

from dataclasses import dataclass
from typing import List, Tuple

import numpy as np

try:
    import gymnasium as gym
    from gymnasium import spaces
except ImportError:  # pragma: no cover - fallback for older gym installs
    import gym
    from gym import spaces

Coord = Tuple[int, int]


@dataclass(frozen=True)
class MazeConfig:
    grid: List[List[int]]
    start: Coord
    goal: Coord


@dataclass(frozen=True)
class RewardConfig:
    step_reward: float = -0.04
    wall_penalty: float = -0.1
    goal_reward: float = 1.0


DEFAULT_MAZE = MazeConfig(
    grid=[
        [0, 0, 0, 1, 0, 0, 0, 0],
        [1, 1, 0, 1, 0, 1, 1, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 1, 0, 1],
        [0, 0, 0, 1, 0, 0, 0, 1],
        [1, 1, 0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 1, 0],
        [0, 1, 1, 1, 0, 0, 0, 0],
    ],
    start=(0, 0),
    goal=(7, 7),
)

DEFAULT_REWARDS = RewardConfig()


class MazeEnv(gym.Env):
    """Simple discrete maze environment compatible with Gym-style APIs."""

    metadata = {"render_modes": ["human"]}

    ACTIONS = {
        0: (-1, 0),  # up
        1: (0, 1),  # right
        2: (1, 0),  # down
        3: (0, -1),  # left
    }

    def __init__(
        self,
        config: MazeConfig | None = None,
        max_episode_steps: int = 200,
        rewards: RewardConfig | None = None,
    ):
        super().__init__()
        self.config = config or DEFAULT_MAZE
        self.rewards = rewards or DEFAULT_REWARDS

        self.grid = np.array(self.config.grid, dtype=np.int32)
        if self.grid.ndim != 2:
            raise ValueError("Maze grid must be a 2D matrix.")

        self.rows, self.cols = self.grid.shape
        if self.rows != self.cols:
            raise ValueError("Maze grid must be square (n x n).")

        self.start = self.config.start
        self.goal = self.config.goal
        self.max_episode_steps = max_episode_steps
        self.current_step = 0
        self.position = self.start

        self._validate_anchor(self.start, "start")
        self._validate_anchor(self.goal, "goal")

        self.action_space = spaces.Discrete(4)
        self.observation_space = spaces.Discrete(self.rows * self.cols)

    def coord_to_state(self, coord: Coord) -> int:
        return coord[0] * self.cols + coord[1]

    def state_to_coord(self, state: int) -> Coord:
        return state // self.cols, state % self.cols

    def _is_valid(self, coord: Coord) -> bool:
        r, c = coord
        in_bounds = 0 <= r < self.rows and 0 <= c < self.cols
        if not in_bounds:
            return False
        return self.grid[r, c] == 0

    def _validate_anchor(self, coord: Coord, name: str) -> None:
        row, col = coord
        if not (0 <= row < self.rows and 0 <= col < self.cols):
            raise ValueError(f"{name} tile {coord} is outside maze bounds.")
        if self.grid[row, col] == 1:
            raise ValueError(f"{name} tile {coord} cannot be a wall.")

    def reset(self, *, seed: int | None = None, options: dict | None = None):
        super().reset(seed=seed)
        self.current_step = 0
        self.position = self.start
        return self.coord_to_state(self.position), {}

    def step(self, action: int):
        self.current_step += 1
        dr, dc = self.ACTIONS[action]
        nr, nc = self.position[0] + dr, self.position[1] + dc
        candidate = (nr, nc)

        reward = self.rewards.step_reward
        if self._is_valid(candidate):
            self.position = candidate
        else:
            reward = self.rewards.wall_penalty

        done = self.position == self.goal
        if done:
            reward = self.rewards.goal_reward

        truncated = self.current_step >= self.max_episode_steps and not done
        state = self.coord_to_state(self.position)
        return state, reward, done, truncated, {}

    def export_layout(self) -> List[List[int]]:
        return self.grid.tolist()
