from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .rl.base import BaseRLModel
from .rl.maze_env import DEFAULT_MAZE, MazeEnv
from .rl.registry import list_models, make_model
from .schemas import SimulateRequest, SimulateResponse, SimulationMetrics

logger = logging.getLogger("rl_simulator.api")

app = FastAPI(title="RL Maze Simulator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/models")
def models() -> dict:
    return {"models": list_models()}


def _build_simulation(request: SimulateRequest) -> tuple[MazeEnv, BaseRLModel, str]:
    maze_config = request.maze.to_config() if request.maze else DEFAULT_MAZE
    env = MazeEnv(config=maze_config, max_episode_steps=request.max_steps)
    model = make_model(
        request.model_id,
        env=env,
        episodes=request.episodes,
        alpha=request.alpha,
        gamma=request.gamma,
        epsilon=request.epsilon,
    )
    model_name = getattr(model, "label", request.model_id)
    return env, model, model_name


def _build_simulation_response(
    env: MazeEnv,
    training_result: dict[str, Any],
    path: list[list[int]],
    solved: bool,
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
        ),
    )


@app.post("/api/simulate", response_model=SimulateResponse)
def simulate(request: SimulateRequest) -> SimulateResponse:
    try:
        env, model, model_name = _build_simulation(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    logger.info("Training started | model=%s | episodes=%d", model_name, request.episodes)

    def progress_logger(completed: int, total: int, _episode_path: list[list[int]]) -> None:
        logger.info(
            "Training progress | model=%s | episodes_completed=%d/%d",
            model_name,
            completed,
            total,
        )

    model.set_progress_callback(progress_logger)

    training_result = model.train()
    path, solved = model.greedy_path(request.max_steps)

    logger.info(
        "Training completed | model=%s | solved=%s | path_length=%d",
        model_name,
        solved,
        len(path),
    )

    return _build_simulation_response(env, training_result, path, solved)


async def _forward_progress(
    websocket: WebSocket,
    progress_queue: asyncio.Queue[dict[str, Any] | None],
) -> None:
    while True:
        item = await progress_queue.get()
        if item is None:
            return
        await websocket.send_json(item)


@app.websocket("/ws/simulate")
async def simulate_stream(websocket: WebSocket) -> None:
    await websocket.accept()

    try:
        payload = await websocket.receive_json()
        request = SimulateRequest.model_validate(payload)
    except Exception as exc:
        await websocket.send_json({"type": "error", "detail": f"Invalid simulation payload: {exc}"})
        await websocket.close(code=1003)
        return

    try:
        env, model, model_name = _build_simulation(request)
    except ValueError as exc:
        await websocket.send_json({"type": "error", "detail": str(exc)})
        await websocket.close(code=1008)
        return

    interval = max(1, request.episodes // 100)
    logger.info("Training stream started | model=%s | episodes=%d", model_name, request.episodes)

    await websocket.send_json(
        {
            "type": "started",
            "model": model_name,
            "episodes": request.episodes,
            "interval": interval,
        }
    )

    loop = asyncio.get_running_loop()
    progress_queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

    def progress_logger(completed: int, total: int, episode_path: list[list[int]]) -> None:
        logger.info(
            "Training progress | model=%s | episodes_completed=%d/%d",
            model_name,
            completed,
            total,
        )
        event = {
            "type": "progress",
            "model": model_name,
            "completed": completed,
            "total": total,
            "path": episode_path,
        }
        loop.call_soon_threadsafe(progress_queue.put_nowait, event)

    model.set_progress_callback(progress_logger)
    sender_task = asyncio.create_task(_forward_progress(websocket, progress_queue))

    training_result: dict[str, Any]
    path: list[list[int]]
    solved: bool

    try:
        training_result = await asyncio.to_thread(model.train)
        path, solved = await asyncio.to_thread(model.greedy_path, request.max_steps)
    except Exception as exc:  # pragma: no cover - defensive runtime handling
        logger.exception("Training stream failed | model=%s", model_name, exc_info=exc)
        loop.call_soon_threadsafe(progress_queue.put_nowait, None)
        try:
            await sender_task
        except WebSocketDisconnect:
            return

        try:
            await websocket.send_json({"type": "error", "detail": "Simulation failed during training."})
            await websocket.close(code=1011)
        except WebSocketDisconnect:
            return
        return

    loop.call_soon_threadsafe(progress_queue.put_nowait, None)

    try:
        await sender_task
    except WebSocketDisconnect:
        return

    response = _build_simulation_response(env, training_result, path, solved)
    logger.info(
        "Training stream completed | model=%s | solved=%s | path_length=%d",
        model_name,
        solved,
        len(path),
    )

    try:
        await websocket.send_json({"type": "completed", "result": response.model_dump()})
        await websocket.close(code=1000)
    except WebSocketDisconnect:
        return
