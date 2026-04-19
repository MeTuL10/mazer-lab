from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .rl.registry import list_models
from .schemas import SimulateRequest, SimulateResponse
from .utils.simulation import (
    build_simulation,
    build_simulation_response,
    forward_progress,
)

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


@app.post("/api/simulate", response_model=SimulateResponse)
def simulate(request: SimulateRequest) -> SimulateResponse:
    try:
        env, model, model_name = build_simulation(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    logger.info("Training started | model=%s | episodes=%d", model_name, request.episodes)

    def progress_logger(completed: int, total: int, _episode_path: list[list[int]], _policy: list[list[str | None]]) -> None:
        logger.info(
            "Training progress | model=%s | episodes_completed=%d/%d",
            model_name,
            completed,
            total,
        )

    model.set_progress_callback(progress_logger)

    training_result = model.train()
    path, solved, optimal_path_reward = model.greedy_path(request.max_steps)

    logger.info(
        "Training completed | model=%s | solved=%s | path_length=%d",
        model_name,
        solved,
        len(path),
    )

    return build_simulation_response(env, model, training_result, path, solved, optimal_path_reward)


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
        env, model, model_name = build_simulation(request)
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

    def progress_logger(completed: int, total: int, episode_path: list[list[int]], policy: list[list[str | None]]) -> None:
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
            "policy": policy,
        }
        loop.call_soon_threadsafe(progress_queue.put_nowait, event)

    model.set_progress_callback(progress_logger)
    sender_task = asyncio.create_task(forward_progress(websocket, progress_queue))

    training_result: dict[str, Any]
    path: list[list[int]]
    solved: bool
    optimal_path_reward: float

    try:
        training_result = await asyncio.to_thread(model.train)
        path, solved, optimal_path_reward = await asyncio.to_thread(model.greedy_path, request.max_steps)
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

    response = build_simulation_response(env, model, training_result, path, solved, optimal_path_reward)
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
