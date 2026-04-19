from __future__ import annotations

from typing import List
from typing import Set
from typing import Tuple

from pydantic import BaseModel, Field, model_validator

from .rl.maze_env import MazeConfig
from .rl.maze_env import RewardConfig

Coord = Tuple[int, int]


class MazeInput(BaseModel):
    size: int = Field(default=8, ge=4, le=30)
    start: List[int] = Field(default_factory=lambda: [0, 0], min_length=2, max_length=2)
    goal: List[int] = Field(default_factory=lambda: [3, 3], min_length=2, max_length=2)
    walls: List[List[int]] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_layout(self) -> "MazeInput":
        start = self._normalize_coord(self.start, "start")
        goal = self._normalize_coord(self.goal, "goal")
        if start == goal:
            raise ValueError("Start and goal cannot be the same tile.")

        seen: Set[Coord] = set()
        normalized_walls: List[List[int]] = []
        for wall in self.walls:
            coord = self._normalize_coord(wall, "wall")
            if coord == start or coord == goal:
                raise ValueError("Walls cannot overlap the start or goal tile.")
            if coord in seen:
                continue
            seen.add(coord)
            normalized_walls.append([coord[0], coord[1]])

        max_walls = self.size * self.size - 2
        if len(normalized_walls) > max_walls:
            raise ValueError("Too many walls for this grid size.")

        self.start = [start[0], start[1]]
        self.goal = [goal[0], goal[1]]
        self.walls = normalized_walls
        return self

    def _normalize_coord(self, value: List[int], name: str) -> Coord:
        if len(value) != 2:
            raise ValueError(f"{name} must contain two values: [row, col].")

        row, col = int(value[0]), int(value[1])
        if not (0 <= row < self.size and 0 <= col < self.size):
            raise ValueError(f"{name} coordinate [{row}, {col}] is out of bounds.")
        return row, col

    def to_config(self) -> MazeConfig:
        grid = [[0 for _ in range(self.size)] for _ in range(self.size)]
        for row, col in self.walls:
            grid[row][col] = 1
        return MazeConfig(
            grid=grid,
            start=(self.start[0], self.start[1]),
            goal=(self.goal[0], self.goal[1]),
        )


class RewardsInput(BaseModel):
    step_reward: float = Field(default=-0.04)
    wall_penalty: float = Field(default=-0.1)
    goal_reward: float = Field(default=1.0)

    def to_config(self) -> RewardConfig:
        return RewardConfig(
            step_reward=float(self.step_reward),
            wall_penalty=float(self.wall_penalty),
            goal_reward=float(self.goal_reward),
        )


class SimulateRequest(BaseModel):
    model_id: str = Field(default="q_learning")
    episodes: int = Field(default=800, ge=1)
    alpha: float = Field(default=0.1, gt=0.0, le=1.0)
    gamma: float = Field(default=0.95, gt=0.0, le=1.0)
    epsilon: float = Field(default=0.15, ge=0.0, le=1.0)
    epsilon_decay: float = Field(default=1.0, ge=0.0, le=1.0)
    max_steps: int = Field(default=200, ge=10, le=2000)
    maze: MazeInput | None = None
    rewards: RewardsInput | None = None


class SimulationMetrics(BaseModel):
    algorithm: str
    episodes: int
    mean_reward: float
    success_rate: float
    optimal_path_reward: float


class SimulateResponse(BaseModel):
    maze: List[List[int]]
    start: List[int]
    goal: List[int]
    path: List[List[int]]
    policy: List[List[str | None]]
    solved: bool
    metrics: SimulationMetrics
