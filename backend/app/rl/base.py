from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple

import numpy as np

from .maze_env import MazeEnv


class BaseRLModel(ABC):
    """Base class for tabular RL models used by the simulation API."""

    def __init__(
        self,
        env: MazeEnv,
        episodes: int = 600,
        alpha: float = 0.1,
        gamma: float = 0.95,
        epsilon: float = 0.15,
    ):
        self.env = env
        self.episodes = episodes
        self.alpha = alpha
        self.gamma = gamma
        self.epsilon = epsilon
        self.n_states = env.observation_space.n
        self.n_actions = env.action_space.n
        self.q_table = np.zeros((self.n_states, self.n_actions), dtype=np.float32)

    def epsilon_greedy_action(self, state: int) -> int:
        if np.random.random() < self.epsilon:
            return int(self.env.action_space.sample())
        return int(np.argmax(self.q_table[state]))

    def greedy_action(self, state: int) -> int:
        return int(np.argmax(self.q_table[state]))

    @abstractmethod
    def train(self) -> Dict[str, Any]:
        raise NotImplementedError

    def greedy_path(self, max_steps: int) -> Tuple[List[List[int]], bool]:
        state, _ = self.env.reset()
        coords = [list(self.env.state_to_coord(state))]
        solved = False

        for _ in range(max_steps):
            action = self.greedy_action(state)
            next_state, _, done, truncated, _ = self.env.step(action)
            coords.append(list(self.env.state_to_coord(next_state)))
            state = next_state

            if done:
                solved = True
                break
            if truncated:
                break

        return coords, solved

    def _success_rate(self, rewards: List[float]) -> float:
        successes = [1.0 if value > 0.0 else 0.0 for value in rewards]
        return float(np.mean(successes)) if successes else 0.0
