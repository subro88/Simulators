---
name: v2-simulator-builder
description: >
  Complete architectural guide and code standards for building and migrating engineering simulators
  to the V2 platform architecture (Python FastAPI backend, WebSocket streaming, Blender/GLB 3D pipeline,
  and Three.js WebGL frontend). Includes explicit guidelines for preserving 2D Simulate mode and resuming
  tasks seamlessly across OpenCode and Antigravity.
---

# V2 Simulator Builder — Architecture & Development Standard

This skill defines the exact standards for building, extending, and maintaining engineering simulators on the Python + WebGL V2 platform.

---

## 1. Core Visual Principles & Mode Rules

1. **`Simulate` Tab (Preserve Existing Logic)**:
   - Always preserve existing functioning 2D canvas schematics and simulation logic.
   - Shows live working mechanism diagram, controls, parameter sliders, and mathematical telemetry equations.
   - Do NOT break or strip out working 2D simulation code when adding 3D capabilities.

2. **`3D Model` Tab (Realistic GLB Model)**:
   - High-fidelity, realistic 3D `.glb` model loaded via Three.js `GLTFLoader`.
   - PBR metallic materials, OrbitControls (Orbit, Pan, Zoom).
   - Component Node Animation driven continuously by Python WebSocket telemetry.
   - **Exploded View Toggle**: Ability to smoothly interpolate component nodes outward along their local axes for internal mechanical inspection.

3. **`Explore`, `Practice`, `Quiz` Tabs**:
   - Component cards, worked numerical examples, guided calculation experiments, and multiple-choice quizzes.

---

## 2. Platform Architecture & Data Flow

```
User interaction in Browser
       │
       ▼
WebSocket send (simulator.js)
       │  JSON payload: { type: "set_state", payload: { ... } }
       ▼
FastAPI WebSocket route (app/main.py)
       │
       ▼
Python Simulation Engine (app/simulation/<name>.py)
       │  Validates via Pydantic & calculates with NumPy
       ▼
WebSocket broadcast / reply
       │  JSON payload: { type: "state_update", payload: { ... } }
       ▼
Frontend update (simulator.js & <name>3d.js)
       ├── Update 2D schematic & DOM numbers/equations
       └── Rotate/animate corresponding GLTF mesh nodes in Three.js
```

---

## 3. Python Simulation Engine Standard (`app/simulation/`)

Every simulation engine must inherit from `BaseSimulationEngine` in `app/simulation/base.py`.

```python
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from .base import BaseSimulationEngine

class MySimInput(BaseModel):
    rpm: float = Field(default=1200.0, ge=0.0, le=6000.0, description="Input shaft speed in RPM")
    load: float = Field(default=50.0, ge=0.0, le=100.0, description="Applied load percentage")

class MySimOutput(BaseModel):
    output_speed: float
    torque: float
    power: float
    efficiency: float
    telemetry: Dict[str, Any]

class MySimEngine(BaseSimulationEngine):
    name = "my-simulation"

    def calculate(self, params: MySimInput) -> MySimOutput:
        ...
        return MySimOutput(...)
```

---

## 4. Blender to GLB 3D Pipeline Standard (`blender/`)

### Component Naming & Hierarchies
Every independently moving mechanical part must be an individual Object/Node in the glTF hierarchy.

Example for Differential:
- `DrivePinion`
- `CrownWheel`
- `DifferentialCarrier`
- `SpiderGear_Top`, `SpiderGear_Bottom`
- `SunGear_Left`, `SunGear_Right`
- `Axle_Left`, `Axle_Right`
- `Wheel_Left`, `Wheel_Right`

Example for Clutch:
- `Flywheel`
- `FrictionDisc`
- `PressurePlate`
- `DiaphragmSpring`
- `ReleaseBearing`
- `InputShaft`

### Exploded View Node Offset Convention
In Three.js, store each node's base `position` and define an explosion vector `explodeOffset`. When Exploded View is active:
$$\text{node.position} = \text{basePosition} + (\text{explodeOffset} \times \text{factor})$$

---

## 5. Seamless Task Resumption (Antigravity & OpenCode)

If execution pauses or model quota resets:
1. Check `task.md` in the brain directory or project root.
2. Run `python -m pytest tests/` to verify current backend physics state.
3. Run `python blender/generate_glb.py` (and relevant generator scripts) to ensure `.glb` assets are fresh.
4. Launch `uvicorn app.main:app --port 8080` or `docker compose up --build -d` to verify deployment on `http://localhost:8080`.
