# Platform Architecture & Vertical Slice Plan: Python FastAPI + WebGL Simulator Engine

## 🎯 Architecture Vision

Transforming the **Simulators** suite into a modern, decoupled engineering platform where:
- **Backend (Python / FastAPI / NumPy / Pydantic)**: Acts as the high-precision mathematical and physics simulation engine, streaming telemetry over real-time WebSockets / REST.
- **Frontend (HTML5 / Vanilla CSS / Three.js / WebGL)**: Renders interactive 3D mechanisms (loaded from `.glb` models produced via Blender Python scripts) and connects live to the Python simulation engine.
- **3D Pipeline (`blender/`)**: Headless Python automation scripts (`create_differential.py`, etc.) that mathematically construct mechanism geometries, assign named component nodes, and export clean `.glb` assets for Three.js.
- **Extensibility**: Modular architecture (`app/simulation/<tool_name>.py`) designed so any simulator in the entire project can be plugged in seamlessly.
- **Production & Docker**: Multi-stage Docker setup matching port `8080` for both local live-reload dev and production deployment.

---

## 📁 Target Project Structure

```
Simulators/
│
├── .venv/                          # Local Python virtual environment
│
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application, CORS, static mounting, WebSockets
│   │
│   └── simulation/                 # Modular physics simulation engines
│       ├── __init__.py
│       ├── base.py                 # Abstract base class for simulation engines
│       └── differential.py         # Differential physics engine (kinematics, torque split, traction)
│
├── blender/
│   ├── create_differential.py      # Python script to procedurally construct & export differential.glb
│   └── generate_glb.py             # Pure-Python glTF/GLB builder fallback (ensures instant .glb generation without requiring Blender binary)
│
├── frontend/
│   ├── index.html                  # Main simulator interface (Mode tabs: Simulate, 3D Model, Explore, Practice, Quiz)
│   │
│   ├── css/
│   │   └── simulator.css           # Modern, dark-mode responsive styling
│   │
│   ├── js/
│   │   ├── simulator.js            # WebSocket client, UI controller, real-time telemetry binders
│   │   └── differential3d.js       # Three.js WebGL engine, GLTFLoader, live node rotations & orbital controls
│   │
│   └── models/
│       └── differential.glb        # Binary glTF 3D model containing distinct animated nodes
│
├── data/                           # Preset configs & optional session storage
│
├── docker/
│   ├── Dockerfile                  # Python 3.11 + FastAPI + Uvicorn container
│   └── nginx.conf                  # Optional reverse proxy configuration
│
├── docker-compose.yml              # Configured for port 8080 with volume mounts for live dev
└── requirements.txt                # FastAPI, Uvicorn, NumPy, Pydantic, WebSockets
```

---

## 🚀 Vertical Slice Execution Strategy

We will build the complete end-to-end vertical slice for the **Automotive Differential**:

### Phase 1: Python Simulation Engine & Backend (`app/`)
1. **`app/simulation/differential.py`**:
   - Pydantic models for input telemetry (`DifferentialInput`: `carrier_rpm`, `maneuver`, `turn_bias`, `traction_left`, `traction_right`, `pinion_teeth`, `crown_teeth`, `sun_teeth`, `spider_teeth`, `spider_count`).
   - Pure physics & kinematics calculation:
     $$\omega_{\text{left}} + \omega_{\text{right}} = 2 \cdot \omega_{\text{carrier}}$$
     $$\omega_{\text{spider}} = (\omega_{\text{outer}} - \omega_{\text{carrier}}) \cdot \frac{T_{\text{sun}}}{T_{\text{spider}}}$$
     Torque distribution calculation based on surface traction coefficients ($\mu_{\text{left}}, \mu_{\text{right}}$).
2. **`app/main.py`**:
   - FastAPI server serving static frontend files from `/frontend`.
   - WebSocket endpoint `/ws/differential` handling bi-directional state synchronization.
   - REST endpoints `/api/differential/simulate` and `/api/differential/presets` for HTTP fallbacks.

### Phase 2: 3D Model Generation (`blender/` -> `frontend/models/`)
1. **`blender/create_differential.py`**:
   - Script for Blender (`blender --background --python create_differential.py`) that constructs:
     - `DrivePinion` (input bevel gear)
     - `CrownWheel` (ring gear mounted to carrier)
     - `DifferentialCarrier` (cross-pin housing)
     - `SpiderGear_Top`, `SpiderGear_Bottom` (planet bevel pinions)
     - `SunGear_Left`, `SunGear_Right` (side bevel gears)
     - `Axle_Left`, `Axle_Right`, `Wheel_Left`, `Wheel_Right`
2. **`blender/generate_glb.py`**:
   - A standalone Python script using `trimesh` / procedural glTF packaging that outputs `frontend/models/differential.glb` immediately with full PBR materials and hierarchy, ensuring the 3D asset is immediately available and inspectable.

### Phase 3: WebGL & Three.js Frontend (`frontend/`)
1. **`frontend/js/differential3d.js`**:
   - Three.js WebGL scene with OrbitControls, PBR lighting, and `GLTFLoader`.
   - Traverses model nodes: caches references to `CrownWheel`, `DrivePinion`, `SpiderGears`, `SunGears`, `LeftWheel`, `RightWheel`.
   - Animation loop applying continuous rotations calculated directly from backend telemetry.
   - Cut-away / exploded view toggle and component inspection highlights.
2. **`frontend/js/simulator.js`**:
   - WebSocket manager with automatic reconnection.
   - Binds UI controls (RPM slider, Turn Bias, Surface Traction conditions, Gear Ratios).
   - Updates live telemetry badges: Crown RPM, Left/Right Wheel Speeds, Spider RPM, Torque Split, Kinematic Verification equation.
3. **`frontend/index.html` & `frontend/css/simulator.css`**:
   - Modern, high-aesthetic layout matching the existing standard (Simulate, 3D Model, Explore, Practice, Quiz, User Guide, SEO article, Share bar, Footer).

### Phase 4: Containerization & Production Setup (`docker/`)
1. **`requirements.txt`**: `fastapi`, `uvicorn[standard]`, `numpy`, `pydantic`, `websockets`, `trimesh`.
2. **`docker/Dockerfile`**: Clean Python 3.11-slim container running Uvicorn on port 8080.
3. **`docker-compose.yml`**: Configured with live volume mounting for `/app` and `/frontend`.

---

## 🧪 Verification Plan

1. **Backend Verification**:
   - Run unit tests on `app/simulation/differential.py` to confirm kinematic equations across Straight, Left Turn, Right Turn, Ice/Mud Slip, and One-Wheel-Jacked modes.
2. **3D Asset Generation**:
   - Generate `frontend/models/differential.glb` and verify all mesh nodes exist.
3. **WebSocket Telemetry Streaming**:
   - Start the FastAPI server on `http://localhost:8080`.
   - Connect client, verify WebSocket `state_update` messages stream accurately.
4. **Browser & 3D Integration**:
   - Test in Chrome / Edge:
     - 3D GLB model loads cleanly.
     - Moving sliders in UI updates Python simulation in real time (< 2ms response).
     - Gears rotate with exact mechanical angular velocities according to Python telemetry.
     - Mode switching (Simulate, 3D Model, Explore, Practice, Quiz) functions flawlessly.
