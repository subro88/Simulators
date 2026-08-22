# Simulators Engineering Platform — Agent & Developer Guide

Welcome to the **Simulators** codebase. This repository is an interactive, multi-discipline engineering simulation platform combining **Python (FastAPI / NumPy)** for high-precision physics calculations and **WebGL (Three.js)** for interactive 3D rendering.

---

## 🏛️ Architecture Overview

The platform uses a decoupled client-server architecture:

```
                  ┌──────────────────────────────────────────────┐
                  │            Browser Client (WebGL)             │
                  │   HTML5 + Vanilla CSS + Three.js + GLTF       │
                  └──────────────────────┬───────────────────────┘
                                         │
                          WebSocket / REST API (Port 8080)
                                         │
                  ┌──────────────────────▼───────────────────────┐
                  │             Python Server (FastAPI)           │
                  │        app/main.py & app/simulation/         │
                  │  - Physics Kinematics & Numerical Calculus   │
                  │  - Real-Time Bidirectional Telemetry         │
                  │  - Static Asset & V1 Tool Hosting            │
                  └──────────────────────┴───────────────────────┘
```

### Key Mode Visual Guidelines

1. **`Simulate` Tab (Preserve Existing Logic)**:
   - Always keep the existing 2D canvas schematic and working simulation model intact. Do not break or remove working 2D simulation logic.
2. **`3D Model` Tab (Realistic GLB Model)**:
   - Render the photorealistic Three.js 3D GLB model with OrbitControls, PBR materials, Exploded View toggle, and telemetry node animations.

---

## 🔄 Seamless Task Resumption Across AI Tools

If quota resets or you switch between **Antigravity**, **OpenCode**, or **Claude Code**:
1. Check `task.md` for current phase status.
2. Run `python -m pytest tests/` to confirm backend physics test status.
3. Run `python blender/generate_glb.py` to ensure 3D `.glb` assets are generated.
4. Run `docker compose up --build -d` or `uvicorn app.main:app --port 8080` to launch and test.

---

## 🚀 Running the Project

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt

# Generate 3D Assets
python blender/generate_glb.py
python blender/generate_clutch_glb.py

# Launch FastAPI
uvicorn app.main:app --reload --port 8080
```
Open **`http://localhost:8080`**.

### Docker Development
```bash
docker-compose up --build -d
```
Open **`http://localhost:8080`**.
