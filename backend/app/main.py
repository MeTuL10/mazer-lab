from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .rl.maze_env import DEFAULT_MAZE, MazeEnv
from .rl.registry import list_models, make_model
from .schemas import SimulateRequest, SimulateResponse, SimulationMetrics

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
    maze_config = request.maze.to_config() if request.maze else DEFAULT_MAZE

    try:
        env = MazeEnv(config=maze_config, max_episode_steps=request.max_steps)
        model = make_model(
            request.model_id,
            env=env,
            episodes=request.episodes,
            alpha=request.alpha,
            gamma=request.gamma,
            epsilon=request.epsilon,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    training_result = model.train()
    path, solved = model.greedy_path(request.max_steps)

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