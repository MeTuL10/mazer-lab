from __future__ import annotations

from typing import Any

from fastapi import WebSocket

from ..rl.base import BaseRLModel
from ..rl.maze_env import DEFAULT_MAZE, DEFAULT_REWARDS, MazeEnv
from ..rl.registry import make_model
from ..schemas import SimulateRequest, SimulateResponse, SimulationMetrics


def build_simulation(request: SimulateRequest) -> tuple[MazeEnv, BaseRLModel, str]:
    maze_config = request.maze.to_config() if request.maze else DEFAULT_MAZE
    reward_config = request.rewards.to_config() if request.rewards else DEFAULT_REWARDS

    env = MazeEnv(
        config=maze_config,
        max_episode_steps=request.max_steps,
        rewards=reward_config,
    )
    model = make_model(
        request.model_id,
        env=env,
        episodes=request.episodes,
        alpha=request.alpha,
        gamma=request.gamma,
        epsilon=request.epsilon,
        epsilon_decay=request.epsilon_decay,
    )
    model_name = getattr(model, "label", request.model_id)
    return env, model, model_name


def build_simulation_response(
    env: MazeEnv,
    training_result: dict[str, Any],
    path: list[list[int]],
    solved: bool,
    optimal_path_reward: float,
) -> SimulateResponse:
    return SimulateResponse(
        maze=env.export_layout(),
        start=list(env.start),
        goal=list(env.goal),
        path=path,
        solved=solved,
        metrics=SimulationMetrics(
            algorithm=training_result["algorithm"],
            episodes=training_result["episodes"],
            mean_reward=training_result["mean_reward"],
            success_rate=training_result["success_rate"],
            optimal_path_reward=round(float(optimal_path_reward), 4),
        ),
    )


async def forward_progress(
    websocket: WebSocket,
    progress_queue,
) -> None:
    while True:
        item = await progress_queue.get()
        if item is None:
            return
        await websocket.send_json(item)
