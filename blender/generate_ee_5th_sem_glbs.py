"""
Binary glTF (.glb) Generator for WBSCTE Electrical Engineering 5th Semester Tools
================================================================================
Generates 6 high-quality 3D assets:
- frontend/models/power_electronics_drives.glb
- frontend/models/microcontroller_8051.glb
- frontend/models/switchgear_protection.glb
- frontend/models/electric_traction_heating.glb
- frontend/models/illumination_engineering.glb
- frontend/models/energy_audit_conservation.glb
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
        "asset": {"version": "2.0", "generator": "NHIT EE 5th Sem GLB Engine"},
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
    # 1. Power Electronics & Drives 3D Model
    ped_components = [
        ("SCRStudPackage", create_cylinder, (0.35, 0.9, 20), [-0.7, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.35, 0.15, 1.0]),
        ("AluminumHeatSinkFins", create_box, (1.2, 0.8, 1.2), [-0.7, -0.4, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.85, 1.0]),
        ("IGBTInverterBridgeBlock", create_box, (1.0, 0.5, 0.8), [0.6, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.15, 0.20, 1.0]),
        ("GatePulseTransformerCoil", create_cylinder, (0.2, 0.4, 16), [0.6, 0.45, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(ped_components, "frontend/models/power_electronics_drives.glb")

    # 2. 8051 Microcontroller & Embedded 3D Model
    mc_components = [
        ("DIP40MicrocontrollerChip", create_box, (2.2, 0.3, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.12, 0.14, 1.0]),
        ("QuartzCrystalOscillator", create_cylinder, (0.12, 0.6, 16), [-0.8, 0.2, -0.6], [0, 0, 0.7071, 0.7071], [0.85, 0.85, 0.90, 1.0]),
        ("PortHeaderPinBus", create_box, (2.2, 0.15, 0.15), [0.0, 0.2, 0.6], [0, 0, 0, 1], [0.95, 0.85, 0.15, 1.0]),
        ("StepperMotorDriverBase", create_box, (1.0, 0.2, 1.0), [0.8, -0.1, -0.6], [0, 0, 0, 1], [0.10, 0.55, 0.30, 1.0]),
    ]
    build_glb(mc_components, "frontend/models/microcontroller_8051.glb")

    # 3. Switchgear & Protection 3D Model
    sgp_components = [
        ("IDMTRelayChamber", create_box, (1.8, 1.8, 1.2), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.10, 0.15, 0.22, 1.0]),
        ("InductionAluminumDisc", create_cylinder, (0.55, 0.05, 24), [-0.5, 0.2, 0.0], [0.7071, 0, 0, 0.7071], [0.90, 0.90, 0.95, 1.0]),
        ("CurrentPlugBridge", create_box, (0.8, 0.3, 0.2), [-0.5, -0.5, 0.4], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("SF6CircuitBreakerPillar", create_cylinder, (0.35, 1.8, 20), [0.8, 0.0, 0.0], [0, 0, 0, 1], [0.20, 0.60, 0.85, 1.0]),
    ]
    build_glb(sgp_components, "frontend/models/switchgear_protection.glb")

    # 4. Utilization, Traction & Heating 3D Model
    uth_components = [
        ("LocomotivePantographArm", create_cylinder, (0.05, 1.8, 16), [0.0, 0.6, 0.0], [0, 0, 0.3827, 0.9239], [0.95, 0.35, 0.15, 1.0]),
        ("TractionWheelBogieAxle", create_cylinder, (0.45, 1.6, 20), [0.0, -0.4, 0.0], [0, 0, 0.7071, 0.7071], [0.45, 0.50, 0.55, 1.0]),
        ("InductionHeatingCoil", create_cylinder, (0.40, 0.6, 20), [0.9, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.75, 0.15, 1.0]),
        ("DielectricHeatedWorkpiece", create_box, (0.4, 0.4, 0.4), [0.9, 0.1, 0.0], [0, 0, 0, 1], [0.85, 0.20, 0.20, 1.0]),
    ]
    build_glb(uth_components, "frontend/models/electric_traction_heating.glb")

    # 5. Illumination Engineering 3D Model
    ile_components = [
        ("GoniophotometerBase", create_box, (2.2, 0.15, 1.8), [0.0, -0.6, 0.0], [0, 0, 0, 1], [0.12, 0.16, 0.22, 1.0]),
        ("LEDHighBayLuminaire", create_cylinder, (0.6, 0.25, 24), [0.0, 0.7, 0.0], [0, 0, 0, 1], [0.95, 0.95, 0.95, 1.0]),
        ("GoniometerRotatingArm", create_cylinder, (0.04, 1.6, 16), [0.0, 0.1, 0.0], [0.7071, 0, 0, 0.7071], [0.38, 0.75, 0.95, 1.0]),
        ("LuxPhotocellSensor", create_cylinder, (0.15, 0.2, 16), [0.0, -0.4, 0.7], [0, 0, 0, 1], [0.10, 0.85, 0.45, 1.0]),
    ]
    build_glb(ile_components, "frontend/models/illumination_engineering.glb")

    # 6. Energy Conservation & Audit 3D Model
    eca_components = [
        ("PowerQualityAnalyzerChassis", create_box, (1.8, 1.4, 0.8), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.28, 1.0]),
        ("APFCCapacitorBankUnit", create_cylinder, (0.35, 1.2, 20), [0.7, 0.0, 0.0], [0, 0, 0, 1], [0.20, 0.65, 0.95, 1.0]),
        ("ThermalImagingSensor", create_cylinder, (0.15, 0.5, 16), [-0.5, 0.4, 0.5], [0, 0, 0.7071, 0.7071], [0.95, 0.35, 0.15, 1.0]),
        ("SankeyEnergyGaugeDial", create_cylinder, (0.3, 0.1, 20), [-0.5, -0.1, 0.45], [0.7071, 0, 0, 0.7071], [0.10, 0.85, 0.45, 1.0]),
    ]
    build_glb(eca_components, "frontend/models/energy_audit_conservation.glb")


if __name__ == "__main__":
    generate_all()
