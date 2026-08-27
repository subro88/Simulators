"""
Binary glTF (.glb) Generator for WBSCTE Electrical Engineering 6th Semester Tools
================================================================================
Generates 6 high-quality 3D assets:
- frontend/models/electrical_design_estimation.glb
- frontend/models/electrical_installation_testing.glb
- frontend/models/electrical_workshop_2.glb
- frontend/models/industrial_automation_plc.glb
- frontend/models/process_control_instrumentation.glb
- frontend/models/control_electrical_machines.glb
"""

import json
import struct
import math
from pathlib import Path
import numpy as np


def create_box(width: float, height: float, depth: float):
    w2, h2, d2 = width / 2.0, height / 2.0, depth / 2.0
    vertices = [
        # Front
        [-w2, -h2,  d2], [ w2, -h2,  d2], [ w2,  h2,  d2], [-w2,  h2,  d2],
        # Back
        [ w2, -h2, -d2], [-w2, -h2, -d2], [-w2,  h2, -d2], [ w2,  h2, -d2],
        # Top
        [-w2,  h2,  d2], [ w2,  h2,  d2], [ w2,  h2, -d2], [-w2,  h2, -d2],
        # Bottom
        [-w2, -h2, -d2], [ w2, -h2, -d2], [ w2, -h2,  d2], [-w2, -h2,  d2],
        # Right
        [ w2, -h2,  d2], [ w2, -h2, -d2], [ w2,  h2, -d2], [ w2,  h2,  d2],
        # Left
        [-w2, -h2, -d2], [-w2, -h2,  d2], [-w2,  h2,  d2], [-w2,  h2, -d2],
    ]
    normals = [
        [0,0,1],[0,0,1],[0,0,1],[0,0,1],
        [0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],
        [0,1,0],[0,1,0],[0,1,0],[0,1,0],
        [0,-1,0],[0,-1,0],[0,-1,0],[0,-1,0],
        [1,0,0],[1,0,0],[1,0,0],[1,0,0],
        [-1,0,0],[-1,0,0],[-1,0,0],[-1,0,0],
    ]
    indices = []
    for f in range(6):
        b = f * 4
        indices.extend([b, b+1, b+2, b, b+2, b+3])
    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def create_cylinder(radius: float, height: float, segments: int = 24):
    vertices, normals, indices = [], [], []
    half_h = height / 2.0
    for i in range(segments):
        theta = 2.0 * math.pi * i / segments
        x = radius * math.cos(theta)
        z = radius * math.sin(theta)
        vertices.append([x, half_h, z])
        normals.append([math.cos(theta), 0.0, math.sin(theta)])
        vertices.append([x, -half_h, z])
        normals.append([math.cos(theta), 0.0, math.sin(theta)])

    for i in range(segments):
        next_i = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = next_i * 2, next_i * 2 + 1
        indices.extend([t1, b1, t2, t2, b1, b2])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def build_glb(components, output_path: str):
    bin_buffer = bytearray()
    buffer_views, accessors, meshes, nodes, materials = [], [], [], [], []

    for name, func, args, pos, rot, color in components:
        verts, norms, indices = func(*args)

        def align():
            rem = len(bin_buffer) % 4
            if rem > 0:
                bin_buffer.extend(b'\x00' * (4 - rem))

        align()
        idx_offset = len(bin_buffer)
        bin_buffer.extend(indices.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": idx_offset, "byteLength": len(indices.tobytes()), "target": 34963})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5123, "count": len(indices), "type": "SCALAR"})

        align()
        v_offset = len(bin_buffer)
        bin_buffer.extend(verts.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": v_offset, "byteLength": len(verts.tobytes()), "target": 34962})
        accessors.append({
            "bufferView": len(buffer_views) - 1,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(verts),
            "type": "VEC3",
            "max": [float(x) for x in np.max(verts, axis=0)],
            "min": [float(x) for x in np.min(verts, axis=0)]
        })

        align()
        n_offset = len(bin_buffer)
        bin_buffer.extend(norms.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": n_offset, "byteLength": len(norms.tobytes()), "target": 34962})
        accessors.append({
            "bufferView": len(buffer_views) - 1,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(norms),
            "type": "VEC3",
            "max": [float(x) for x in np.max(norms, axis=0)],
            "min": [float(x) for x in np.min(norms, axis=0)]
        })

        mat_idx = len(materials)
        materials.append({
            "name": f"Mat_{name}",
            "pbrMetallicRoughness": {
                "baseColorFactor": color,
                "metallicFactor": 0.45,
                "roughnessFactor": 0.35
            }
        })

        mesh_idx = len(meshes)
        meshes.append({
            "name": name,
            "primitives": [{
                "attributes": {
                    "POSITION": len(accessors) - 2,
                    "NORMAL": len(accessors) - 1
                },
                "indices": len(accessors) - 3,
                "material": mat_idx
            }]
        })

        nodes.append({
            "name": name,
            "mesh": mesh_idx,
            "translation": pos,
            "rotation": rot
        })

    align()
    gltf_dict = {
        "asset": {"version": "2.0", "generator": "NHIT EE 6th Sem GLB Engine"},
        "scene": 0,
        "scenes": [{"name": "DefaultScene", "nodes": list(range(len(nodes)))}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_buffer)}]
    }

    json_str = json.dumps(gltf_dict)
    json_bytes = json_str.encode("utf-8")
    json_padding = (4 - (len(json_bytes) % 4)) % 4
    json_bytes += b' ' * json_padding

    bin_padding = (4 - (len(bin_buffer) % 4)) % 4
    bin_buffer += b'\x00' * bin_padding

    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    header = struct.pack("<4sII", b"glTF", 2, total_len)
    chunk0_hdr = struct.pack("<II", len(json_bytes), 0x4E4F534A)
    chunk1_hdr = struct.pack("<II", len(bin_buffer), 0x004E4942)

    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)
    with open(out_file, "wb") as f:
        f.write(header)
        f.write(chunk0_hdr)
        f.write(json_bytes)
        f.write(chunk1_hdr)
        f.write(bin_buffer)

    print(f"Generated GLB model: {output_path} ({total_len} bytes, {len(nodes)} components)")


def generate_all():
    # 1. Electrical Design, Estimation & Costing 3D Model
    edec_components = [
        ("DistributionBoardEnclosure", create_box, (1.8, 1.8, 0.4), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("MCBRailRow", create_box, (1.4, 0.35, 0.25), [-0.5, 0.2, 0.2], [0, 0, 0, 1], [0.15, 0.20, 0.28, 1.0]),
        ("ArmouredCableDrum", create_cylinder, (0.5, 0.6, 20), [0.8, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("NeutralEarthBusbar", create_box, (1.2, 0.1, 0.08), [-0.5, -0.6, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(edec_components, "frontend/models/electrical_design_estimation.glb")

    # 2. Electrical Installation, Maintenance & Testing 3D Model
    eimt_components = [
        ("DistributionTransformerTank", create_box, (1.6, 1.4, 1.2), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("HVPorcelainBushings", create_cylinder, (0.12, 0.7, 16), [-0.5, 1.0, 0.0], [0, 0, 0, 1], [0.65, 0.35, 0.20, 1.0]),
        ("MeggerInsulationTester", create_box, (0.8, 0.5, 0.6), [0.8, 0.3, 0.0], [0, 0, 0, 1], [0.95, 0.65, 0.15, 1.0]),
        ("EarthResistanceElectrode", create_cylinder, (0.05, 1.4, 16), [0.8, -0.6, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(eimt_components, "frontend/models/electrical_installation_testing.glb")

    # 3. Electrical Workshop - II 3D Model
    ew_components = [
        ("StatorCoreLaminations", create_cylinder, (0.6, 0.8, 24), [-0.6, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.35, 0.40, 0.48, 1.0]),
        ("DiamondWindingCoilOverhang", create_cylinder, (0.45, 1.1, 20), [-0.6, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("CommutatorRig", create_cylinder, (0.3, 0.4, 20), [0.7, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("CableCrimpingTerminationLug", create_box, (0.4, 0.15, 0.15), [0.7, 0.6, 0.0], [0, 0, 0, 1], [0.85, 0.85, 0.90, 1.0]),
    ]
    build_glb(ew_components, "frontend/models/electrical_workshop_2.glb")

    # 4. Industrial Automation & PLC 3D Model
    ia_components = [
        ("ModularPLCCPURack", create_box, (1.8, 1.0, 0.6), [-0.2, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.16, 0.22, 1.0]),
        ("DigitalIOModuleBlock", create_box, (0.4, 0.9, 0.55), [0.3, 0.0, 0.05], [0, 0, 0, 1], [0.20, 0.65, 0.95, 1.0]),
        ("PowerSupplyUnit24V", create_box, (0.4, 0.9, 0.55), [-0.7, 0.0, 0.05], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("SCADATouchHMI", create_box, (1.2, 0.8, 0.1), [0.8, 0.2, 0.6], [0, 0.2588, 0, 0.9659], [0.08, 0.10, 0.15, 1.0]),
    ]
    build_glb(ia_components, "frontend/models/industrial_automation_plc.glb")

    # 5. Process Control & Instrumentation 3D Model
    pc_components = [
        ("PneumaticDiaphragmValve", create_cylinder, (0.4, 0.9, 20), [-0.6, 0.2, 0.0], [0, 0, 0, 1], [0.20, 0.60, 0.95, 1.0]),
        ("PressureTransmitterHead", create_cylinder, (0.2, 0.5, 16), [0.6, 0.4, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("ProcessBufferTank", create_cylinder, (0.55, 1.6, 24), [0.6, -0.4, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.88, 1.0]),
        ("RTDTemperatureProbe", create_cylinder, (0.04, 1.0, 16), [-0.6, -0.6, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.85, 0.90, 1.0]),
    ]
    build_glb(pc_components, "frontend/models/process_control_instrumentation.glb")

    # 6. Control of Electrical Machines 3D Model
    cem_components = [
        ("StarDeltaContactorCabinet", create_box, (1.6, 1.6, 0.6), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.28, 1.0]),
        ("ThermalOverloadRelay", create_box, (0.6, 0.5, 0.3), [-0.5, 0.4, 0.3], [0, 0, 0, 1], [0.95, 0.35, 0.15, 1.0]),
        ("InductionMotorDriveUnit", create_cylinder, (0.45, 1.0, 20), [0.8, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.20, 0.55, 0.85, 1.0]),
        ("RotorResistanceBank", create_box, (0.8, 0.6, 0.6), [0.8, -0.8, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(cem_components, "frontend/models/control_electrical_machines.glb")


if __name__ == "__main__":
    generate_all()
