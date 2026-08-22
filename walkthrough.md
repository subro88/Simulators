# Simulators V2 Platform — Architecture & Vertical Slice Walkthrough

## 🎯 What Was Built

We have created the **Simulators V2 Platform**: a decoupled, modern engineering simulation architecture combining:
1. **Python Physics & Numerical Calculus Backend (`FastAPI / NumPy / Pydantic`)**: Acts as the simulation brain, calculating exact kinematics and torque splits and streaming telemetry via WebSockets.
2. **WebGL 3D Visualizer (`Three.js / GLTF`)**: Loads `.glb` binary mechanical models generated via procedural Python/Blender scripts and rotates individual gear nodes in real time.
3. **OpenCode & AI Agent Skill (`v2-simulator-builder` + `AGENTS.md`)**: A complete developer and AI agent guide allowing OpenCode, Antigravity, and other assistants to build, migrate, and extend simulators following this standard.
4. **Unified Docker Environment (Port 8080)**: Production-ready multi-stage container hosting both V2 simulators and legacy V1 tools (`nhitvisuallab/`).

---

## 🏛️ Architecture & Data Flow

```
   Browser (Three.js WebGL + UI)
                │
                │  1. Slider moved: sends { type: "set_state", payload: { ... } }
                ▼
      WebSocket (ws://localhost:8080/ws/differential)
                │
                ▼
   FastAPI Server (app/main.py)
                │
                │  2. Validates parameters with Pydantic
                ▼
   Differential Physics Engine (app/simulation/differential.py)
                │
                │  3. Computes Kinematics (N_left + N_right = 2 * N_crown)
                │     & Dynamic Torque Distribution with NumPy
                ▼
   FastAPI Server (app/main.py)
                │
                │  4. Broadcasts { type: "state_update", payload: { ...telemetry } }
                ▼
   Browser (simulator.js & differential3d.js)
                │
                ├── 5. Updates live telemetry DOM badges & verification equations
                └── 6. Animates CrownWheel, SpiderGears, SunGears, and Wheels at exact physical RPMs
```

---

## 📁 Repository Structure

```
Simulators/
├── AGENTS.md                               # Workspace guide for OpenCode and AI agents
│
├── .agents/skills/
│   ├── nhitvisuallab-theme/                # V1 design system
│   └── v2-simulator-builder/SKILL.md       # NEW: AI skill for building V2 simulators
│
├── app/
│   ├── __init__.py
│   ├── main.py                             # FastAPI server: WebSockets, REST, static mounts
│   └── simulation/
│       ├── __init__.py
│       ├── base.py                         # BaseSimulationEngine abstract class
│       └── differential.py                 # Differential kinematics & torque engine
│
├── blender/
│   ├── create_differential.py              # Headless Blender automation script
│   └── generate_glb.py                     # Standalone Python GLB generator
│
├── frontend/
│   ├── index.html                          # V2 main interface (Modes: Simulate, 3D, Explore, Practice, Quiz)
│   ├── css/simulator.css                   # V2 design system & dark theme
│   ├── js/
│   │   ├── simulator.js                    # WebSocket client & telemetry manager
│   │   └── differential3d.js               # Three.js 3D model node rotator & controller
│   └── models/
│       └── differential.glb                # Hierarchical 3D binary glTF model
│
├── nhitvisuallab/                          # Staged V1 browser-based simulator collection
│
├── docker/
│   ├── Dockerfile                          # Multi-stage Python 3.11 container
│   └── nginx.conf
│
├── docker-compose.yml                      # Port 8080 configuration with live hot-reloading
├── requirements.txt                        # FastAPI, Uvicorn, NumPy, Pydantic, WebSockets, Trimesh
└── tests/
    └── test_differential.py                # Pytest unit tests for physics calculations
```

---

## 🧪 Verification & Results

### 1. Python Physics Engine Unit Tests
Ran `pytest tests/test_differential.py`:
- `test_straight_driving_kinematics`: **PASS** (Left = Right = Crown = 300 RPM, Spider = 0 RPM)
- `test_left_turn_kinematics`: **PASS** (Speed conservation $240 + 360 = 2 \times 300\text{ RPM}$, Spider $> 0$)
- `test_slip_condition`: **PASS** (Free wheel spins at $2 \times 300 = 600\text{ RPM}$, grounded wheel stationary at 0 RPM)
- `test_torque_and_power`: **PASS** (Torque multiplication and power calculation verified)

### 2. Browser Verification Screenshots

#### Default Simulation & Green Connected Badge
![Default Loaded State](C:\Users\user\.gemini\antigravity-ide\brain\186c32d6-84f8-4322-8a90-855c0b2c970d\simulate_initial_1787313555316.png)

#### Mud / Ice Traction Loss Mode
![Slip Active Live Telemetry](C:\Users\user\.gemini\antigravity-ide\brain\186c32d6-84f8-4322-8a90-855c0b2c970d\slip_active_1787313580983.png)

#### Explore Mode Cards
![Explore Mode](C:\Users\user\.gemini\antigravity-ide\brain\186c32d6-84f8-4322-8a90-855c0b2c970d\explore_mode_1787313606477.png)

### 3. Verification Recording
![Browser Session Recording](C:\Users\user\.gemini\antigravity-ide\brain\186c32d6-84f8-4322-8a90-855c0b2c970d\v2_platform_verify_1787313346370.webp)

---

## 🚀 How to Run

### Development Mode (with Live Hot-Reload)
```bash
# Activate your venv and install dependencies:
pip install -r requirements.txt

# Launch FastAPI on port 8080:
uvicorn app.main:app --reload --port 8080
```
Open **`http://localhost:8080`** in Chrome / Edge.

### Docker Mode
```bash
docker-compose up --build
```
Access at **`http://localhost:8080`**.
*(All legacy V1 tools remain accessible at `http://localhost:8080/nhitvisuallab/`)*.
