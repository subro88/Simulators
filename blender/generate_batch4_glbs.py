"""
Master Procedural GLTF/GLB Asset Generator for Batch 4 Thermal & Fluid Suite
============================================================================
Generates 20 binary .glb 3D mechanical & fluid models saved to frontend/models/:
- bernoullis_principle.glb
- continuity_equation.glb
- reynolds_number.glb
- fluid_flow.glb
- buoyancy.glb
- pascals_law.glb
- wind_tunnel.glb
- heat_transfer.glb
- heat_exchanger.glb
- stefan_boltzmann.glb
- ideal_gas_law.glb
- thermodynamics.glb
- rankine_cycle.glb
- refrigeration_cycle.glb
- centrifugal_pump.glb
- hydraulic_turbine.glb
- hydraulic_circuit.glb
- pneumatic_circuit.glb
- thermal_power_plant.glb
- morse_test.glb
"""

import json, struct, math
from pathlib import Path
import numpy as np


def create_box(length: float, width: float, thickness: float):
    half_l, half_w, half_t = length / 2.0, width / 2.0, thickness / 2.0
    pts = [
        [-half_l, -half_w, -half_t], [half_l, -half_w, -half_t], [half_l, half_w, -half_t], [-half_l, half_w, -half_t],
        [-half_l, -half_w, half_t], [half_l, -half_w, half_t], [half_l, half_w, half_t], [-half_l, half_w, half_t]
    ]
    norms = [[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]]
    faces = [[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]]
    verts, nms, idxs = [], [], []
    for p in pts: verts.append(p)
    for n in norms: nms.append(n)
    for f in faces: idxs.extend(f)
    return np.array(verts, dtype=np.float32), np.array(nms, dtype=np.float32), np.array(idxs, dtype=np.uint16)


def create_cylinder(radius: float, height: float, segments: int = 16):
    verts, nms, idxs = [], [], []
    half_h = height / 2.0
    for i in range(segments):
        a = 2.0 * math.pi * i / segments
        x, z = radius * math.cos(a), radius * math.sin(a)
        verts.append([x, half_h, z])
        nms.append([math.cos(a), 0, math.sin(a)])
        verts.append([x, -half_h, z])
        nms.append([math.cos(a), 0, math.sin(a)])
    for i in range(segments):
        n_i = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = n_i * 2, n_i * 2 + 1
        idxs.extend([t1, b1, t2, t2, b1, b2])
    return np.array(verts, dtype=np.float32), np.array(nms, dtype=np.float32), np.array(idxs, dtype=np.uint16)


def create_sphere(radius: float, rings: int = 12, segments: int = 16):
    verts, nms, idxs = [], [], []
    for i in range(rings + 1):
        v = i / rings
        lat = math.pi * (v - 0.5)
        for j in range(segments):
            u = j / segments
            lon = 2.0 * math.pi * u
            x = radius * math.cos(lat) * math.cos(lon)
            y = radius * math.sin(lat)
            z = radius * math.cos(lat) * math.sin(lon)
            nx, ny, nz = x / radius, y / radius, z / radius
            verts.append([x, y, z])
            nms.append([nx, ny, nz])
    for i in range(rings):
        for j in range(segments):
            p1 = i * (segments) + j
            p2 = p1 + segments
            idxs.extend([p1, p2, p1 + 1, p1 + 1, p2, p2 + 1])
    return np.array(verts, dtype=np.float32), np.array(nms, dtype=np.float32), np.array(idxs, dtype=np.uint16)


def export_generic_glb(components: list, output_path: str, generator_name: str):
    bin_buffer = bytearray()
    buffer_views, accessors, meshes, nodes, materials = [], [], [], [], []

    for name, func, args, pos, rot, color in components:
        verts, norms, indices = func(*args)
        rx, ry, rz = rot
        if rz != 0.0:
            c, s = math.cos(rz), math.sin(rz)
            verts = np.dot(verts, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))
            norms = np.dot(norms, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))
        if rx != 0.0:
            c, s = math.cos(rx), math.sin(rx)
            verts = np.dot(verts, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))
            norms = np.dot(norms, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))

        def align():
            rem = len(bin_buffer) % 4
            if rem > 0: bin_buffer.extend(b'\x00' * (4 - rem))

        align()
        idx_offset = len(bin_buffer)
        bin_buffer.extend(indices.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": idx_offset, "byteLength": len(indices.tobytes()), "target": 34963})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5123, "count": len(indices), "type": "SCALAR"})

        align()
        v_offset = len(bin_buffer)
        bin_buffer.extend(verts.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": v_offset, "byteLength": len(verts.tobytes()), "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(verts), "type": "VEC3", "min": verts.min(axis=0).tolist(), "max": verts.max(axis=0).tolist()})

        align()
        n_offset = len(bin_buffer)
        bin_buffer.extend(norms.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": n_offset, "byteLength": len(norms.tobytes()), "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(norms), "type": "VEC3"})

        materials.append({"name": f"Mat_{name}", "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.85, "roughnessFactor": 0.28}})
        meshes.append({"name": f"Mesh_{name}", "primitives": [{"attributes": {"POSITION": len(accessors) - 2, "NORMAL": len(accessors) - 1}, "indices": len(accessors) - 3, "material": len(materials) - 1}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1, "translation": pos})

    gltf_dict = {
        "asset": {"version": "2.0", "generator": generator_name},
        "scenes": [{"name": "Scene", "nodes": list(range(len(nodes)))}],
        "scene": 0,
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_buffer)}]
    }

    json_bytes = json.dumps(gltf_dict, separators=(',', ':')).encode('utf-8')
    rem = len(json_bytes) % 4
    if rem > 0: json_bytes += b' ' * (4 - rem)
    rem = len(bin_buffer) % 4
    if rem > 0: bin_buffer.extend(b'\x00' * (4 - rem))

    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    glb_header = struct.pack('<4sII', b'glTF', 2, total_length)
    json_chunk_header = struct.pack('<II', len(json_bytes), 0x4E4F534A)
    bin_chunk_header = struct.pack('<II', len(bin_buffer), 0x004E4942)

    out_p = Path(output_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, 'wb') as f:
        f.write(glb_header)
        f.write(json_chunk_header)
        f.write(json_bytes)
        f.write(bin_chunk_header)
        f.write(bin_buffer)

    print(f"Generated {generator_name} ({len(bin_buffer)} bytes) -> {output_path}")


def generate_all_batch4_glbs():
    # 1. Bernoulli's Principle
    export_generic_glb([
        ("InletPipe", create_cylinder, (0.5, 1.2, 20), [-0.9, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 0.7]),
        ("ThroatPipe", create_cylinder, (0.25, 0.8, 20), [0.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 0.7]),
        ("ManometerLeft", create_cylinder, (0.05, 1.0, 12), [-0.9, -0.6, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("ManometerRight", create_cylinder, (0.05, 0.6, 12), [0.1, -0.4, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/bernoullis_principle.glb", "Bernoulli GLB Builder")

    # 2. Continuity Equation
    export_generic_glb([
        ("LargeSection", create_cylinder, (0.6, 1.2, 20), [-0.8, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 1.0]),
        ("ReducedNozzle", create_cylinder, (0.3, 1.0, 20), [0.7, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/continuity_equation.glb", "Continuity GLB Builder")

    # 3. Reynolds Number
    export_generic_glb([
        ("GlassTube", create_cylinder, (0.3, 2.5, 24), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.8, 0.8, 0.8, 0.6]),
        ("DyeInjector", create_cylinder, (0.04, 0.6, 12), [-1.2, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [1.0, 0.2, 0.2, 1.0]),
        ("StreamlineStreak", create_cylinder, (0.02, 2.0, 12), [0.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [1.0, 0.2, 0.2, 1.0])
    ], "frontend/models/reynolds_number.glb", "Reynolds GLB Builder")

    # 4. Fluid Flow
    export_generic_glb([
        ("StraightPipeline", create_cylinder, (0.4, 2.2, 20), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 1.0]),
        ("ElbowJoint", create_box, (0.5, 0.5, 0.5), [1.2, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("GateValveHandle", create_cylinder, (0.3, 0.08, 16), [-0.5, 0.5, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/fluid_flow.glb", "Fluid Flow GLB Builder")

    # 5. Buoyancy
    export_generic_glb([
        ("WaterTankBox", create_box, (2.6, 1.6, 1.8), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 0.4]),
        ("FloatingHull", create_box, (1.6, 0.6, 0.8), [0.0, 0.2, 0.0], [0.0, 0.0, 0.1], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/buoyancy.glb", "Buoyancy GLB Builder")

    # 6. Pascal's Law
    export_generic_glb([
        ("MasterCylinder", create_cylinder, (0.2, 1.0, 16), [-0.8, 0.0, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("SlaveCylinder", create_cylinder, (0.6, 1.2, 20), [0.8, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("FluidConnectingTube", create_cylinder, (0.1, 1.6, 12), [0.0, -0.5, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/pascals_law.glb", "Pascals Law GLB Builder")

    # 7. Wind Tunnel
    export_generic_glb([
        ("TestSectionDuct", create_box, (2.4, 1.2, 1.2), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 0.3]),
        ("AirfoilWing", create_box, (0.4, 0.08, 1.0), [0.0, 0.0, 0.0], [0.1, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/wind_tunnel.glb", "Wind Tunnel GLB Builder")

    # 8. Heat Transfer
    export_generic_glb([
        ("BrickWallLayer", create_box, (0.6, 1.4, 1.4), [-0.4, 0.0, 0.0], [0.0, 0.0, 0.0], [0.85, 0.35, 0.20, 1.0]),
        ("InsulationLayer", create_box, (0.3, 1.4, 1.4), [0.15, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.85, 0.30, 1.0])
    ], "frontend/models/heat_transfer.glb", "Heat Transfer GLB Builder")

    # 9. Heat Exchanger
    export_generic_glb([
        ("OuterShell", create_cylinder, (0.7, 2.2, 24), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 0.6]),
        ("InnerTubeBundle", create_cylinder, (0.35, 2.4, 20), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/heat_exchanger.glb", "Heat Exchanger GLB Builder")

    # 10. Stefan Boltzmann
    export_generic_glb([
        ("HotRadiatingPlate", create_box, (1.2, 1.2, 0.1), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [1.0, 0.3, 0.1, 1.0]),
        ("InfraredSensorHead", create_cylinder, (0.2, 0.4, 16), [0.0, 0.0, 1.0], [math.pi / 2, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/stefan_boltzmann.glb", "Stefan Boltzmann GLB Builder")

    # 11. Ideal Gas Law
    export_generic_glb([
        ("PistonCylinderBody", create_cylinder, (0.6, 1.8, 20), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 0.5]),
        ("GasPistonHead", create_cylinder, (0.58, 0.2, 16), [0.0, 0.4, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/ideal_gas_law.glb", "Ideal Gas Law GLB Builder")

    # 12. Thermodynamics
    export_generic_glb([
        ("HotReservoir", create_box, (1.2, 0.5, 1.2), [0.0, 1.0, 0.0], [0.0, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0]),
        ("EngineCore", create_cylinder, (0.4, 0.8, 16), [0.0, 0.1, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("ColdReservoir", create_box, (1.2, 0.5, 1.2), [0.0, -0.8, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/thermodynamics.glb", "Thermodynamics GLB Builder")

    # 13. Rankine Cycle
    export_generic_glb([
        ("SteamTurbineHousing", create_cylinder, (0.7, 0.8, 20), [-0.8, 0.4, 0.0], [math.pi / 2, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("FiredBoilerTower", create_box, (0.9, 1.4, 0.9), [0.8, 0.3, 0.0], [0.0, 0.0, 0.0], [1.0, 0.3, 0.1, 1.0]),
        ("FeedWaterPump", create_cylinder, (0.25, 0.3, 16), [0.0, -0.7, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/rankine_cycle.glb", "Rankine Cycle GLB Builder")

    # 14. Refrigeration Cycle
    export_generic_glb([
        ("HermeticCompressor", create_sphere, (0.5, 14, 18), [-0.8, -0.2, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("CondenserGrid", create_box, (1.0, 1.0, 0.1), [0.6, 0.4, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("EvaporatorCoil", create_box, (1.0, 0.8, 0.1), [0.6, -0.6, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/refrigeration_cycle.glb", "Refrigeration Cycle GLB Builder")

    # 15. Centrifugal Pump
    export_generic_glb([
        ("VoluteCasing", create_cylinder, (0.8, 0.4, 24), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("SuctionFlange", create_cylinder, (0.35, 0.6, 16), [0.0, 0.0, 0.5], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("DriveMotor", create_cylinder, (0.5, 1.0, 20), [-1.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/centrifugal_pump.glb", "Centrifugal Pump GLB Builder")

    # 16. Hydraulic Turbine
    export_generic_glb([
        ("PeltonRunnerWheel", create_cylinder, (0.9, 0.2, 24), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("SpearNozzlePipe", create_cylinder, (0.2, 1.2, 16), [1.1, -0.5, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/hydraulic_turbine.glb", "Hydraulic Turbine GLB Builder")

    # 17. Hydraulic Circuit
    export_generic_glb([
        ("HydraulicActuatorBar", create_cylinder, (0.3, 1.6, 20), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 1.0]),
        ("ValveManifoldBlock", create_box, (0.6, 0.6, 0.6), [-0.8, -0.6, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/hydraulic_circuit.glb", "Hydraulic Circuit GLB Builder")

    # 18. Pneumatic Circuit
    export_generic_glb([
        ("AirCompressorReceiver", create_cylinder, (0.6, 1.4, 20), [-0.8, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0]),
        ("FRLRegulatorUnit", create_box, (0.4, 0.7, 0.4), [0.5, 0.2, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/pneumatic_circuit.glb", "Pneumatic Circuit GLB Builder")

    # 19. Thermal Power Plant
    export_generic_glb([
        ("HyperbolicCoolingTower", create_cylinder, (0.9, 2.2, 24), [1.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("BoilerChimneyStack", create_cylinder, (0.25, 2.8, 16), [-1.0, 0.3, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/thermal_power_plant.glb", "Thermal Power Plant GLB Builder")

    # 20. Morse Test
    export_generic_glb([
        ("InlineEngineBlock", create_box, (1.6, 0.8, 0.7), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("DynamometerBrakeUnit", create_cylinder, (0.5, 0.4, 20), [1.2, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/morse_test.glb", "Morse Test GLB Builder")


if __name__ == "__main__":
    generate_all_batch4_glbs()
