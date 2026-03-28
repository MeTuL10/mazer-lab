# RL Maze Simulator (Python Gym + React)

This project contains:

- A Python backend using `FastAPI` and a custom Gym-style maze environment (`gymnasium` with gym-compatible APIs).
- A React frontend that lets users pick an RL model, design a maze, and simulate path-finding.

## Features

- Backend RL model hierarchy with inheritance:
  - `BaseRLModel`
  - `QLearningModel`
  - `SARSAModel`
  - `MonteCarloModel`
- Common simulation API:
  - `GET /api/models`
  - `POST /api/simulate`
- Frontend controls for:
  - Algorithm selection and hyperparameters
  - Custom `n x n` maze design (start, goal, wall tiles)
  - Random wall generation (`m` walls)
  - Animated maze path replay

## Project Structure

```text
backend/
  app/
    main.py
    schemas.py
    rl/
      base.py
      maze_env.py
      q_learning.py
      sarsa.py
      monte_carlo.py
      registry.py
  requirements.txt
frontend/
  src/
    components/MazeGrid.jsx
    api.js
    App.jsx
    App.css
    main.jsx
  package.json
  vite.config.js
```

## First-Time Setup

### 1) Backend setup

```powershell
cd backend
python -m venv .venv
```

Install backend dependencies:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```


### 2) Frontend setup

```powershell
cd frontend
npm install
```

## Start Both Servers

Open two terminals from the project root.

### Terminal 1: backend

```powershell
cd backend
# If env is activated:
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Or without activation:
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Terminal 2: frontend

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Open `http://127.0.0.1:5173` in your browser.

## Notes

- Maze cells: `0` is free space, `1` is a wall.
- Backend trains the selected algorithm and returns a greedy rollout path.
- If backend URL changes, set frontend env var before starting Vite:

```powershell
$env:VITE_API_BASE_URL = "http://127.0.0.1:8000"
```