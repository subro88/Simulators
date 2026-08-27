"""
Binary glTF (.glb) Generator for WBSCTE Computer Science & Technology 3rd Semester Tools
=======================================================================================
Generates high-quality 3D assets:
- frontend/models/data_structures.glb
- frontend/models/computer_architecture.glb
- frontend/models/digital_logic_design.glb
- frontend/models/pc_hardware_assembly.glb
- frontend/models/discrete_mathematics.glb
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
        "asset": {"version": "2.0", "generator": "NHIT CST GLB Engine"},
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
    # 1. Data Structures 3D Model
    ds_components = [
        ("BasePlatform", create_box, (3.2, 0.1, 2.0), [0.0, -1.0, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.30, 1.0]),
        ("StackContainer", create_box, (0.8, 1.6, 0.8), [-1.0, -0.1, 0.0], [0, 0, 0, 1], [0.18, 0.55, 0.95, 1.0]),
        ("QueueBuffer", create_box, (1.8, 0.4, 0.6), [0.3, -0.6, 0.4], [0, 0, 0, 1], [0.25, 0.85, 0.55, 1.0]),
        ("LinkedListHead", create_cylinder, (0.25, 0.3, 20), [0.8, 0.4, -0.3], [0, 0, 0, 1], [0.95, 0.45, 0.20, 1.0]),
        ("TreeNodeRoot", create_cylinder, (0.28, 0.3, 20), [0.0, 0.8, -0.4], [0, 0, 0, 1], [0.90, 0.75, 0.15, 1.0]),
        ("PointerArrow", create_box, (0.4, 0.08, 0.08), [0.4, 0.6, -0.35], [0, 0, 0, 1], [0.85, 0.25, 0.85, 1.0]),
    ]
    build_glb(ds_components, "frontend/models/data_structures.glb")

    # 2. Computer Architecture & CPU 3D Model
    coa_components = [
        ("MotherboardSubstrate", create_box, (2.8, 0.08, 2.8), [0.0, -0.8, 0.0], [0, 0, 0, 1], [0.10, 0.38, 0.22, 1.0]),
        ("CPUSocket", create_box, (1.2, 0.12, 1.2), [0.0, -0.7, 0.0], [0, 0, 0, 1], [0.25, 0.28, 0.35, 1.0]),
        ("ALUCore", create_box, (0.45, 0.18, 0.45), [-0.25, -0.55, -0.25], [0, 0, 0, 1], [0.95, 0.35, 0.15, 1.0]),
        ("ControlUnit", create_box, (0.45, 0.18, 0.45), [0.25, -0.55, -0.25], [0, 0, 0, 1], [0.20, 0.65, 0.95, 1.0]),
        ("CacheL1L2", create_box, (0.95, 0.15, 0.35), [0.0, -0.55, 0.3], [0, 0, 0, 1], [0.85, 0.75, 0.20, 1.0]),
        ("RegistersBank", create_box, (0.35, 0.22, 0.8), [0.9, -0.65, 0.0], [0, 0, 0, 1], [0.75, 0.25, 0.85, 1.0]),
        ("SystemBusLines", create_box, (2.2, 0.04, 0.2), [0.0, -0.74, 0.8], [0, 0, 0, 1], [0.95, 0.85, 0.35, 1.0]),
    ]
    build_glb(coa_components, "frontend/models/computer_architecture.glb")

    # 3. Digital Logic Design 3D Model
    dld_components = [
        ("BreadboardPlate", create_box, (2.6, 0.1, 1.6), [0.0, -0.8, 0.0], [0, 0, 0, 1], [0.88, 0.90, 0.92, 1.0]),
        ("LogicGateIC7408", create_box, (0.9, 0.25, 0.4), [-0.5, -0.62, 0.0], [0, 0, 0, 1], [0.12, 0.14, 0.18, 1.0]),
        ("MuxDecoderIC74151", create_box, (0.9, 0.25, 0.4), [0.5, -0.62, 0.0], [0, 0, 0, 1], [0.12, 0.14, 0.18, 1.0]),
        ("InputSwitches", create_box, (0.8, 0.15, 0.3), [-0.6, -0.68, 0.5], [0, 0, 0, 1], [0.25, 0.55, 0.95, 1.0]),
        ("OutputLEDs", create_cylinder, (0.08, 0.2, 16), [0.6, -0.58, 0.5], [0, 0, 0, 1], [0.95, 0.25, 0.25, 1.0]),
        ("JumperWires", create_cylinder, (0.03, 1.2, 12), [0.0, -0.55, 0.2], [0, 0, 0.7071, 0.7071], [0.20, 0.85, 0.35, 1.0]),
    ]
    build_glb(dld_components, "frontend/models/digital_logic_design.glb")

    # 4. PC Hardware & Maintenance 3D Model
    pc_components = [
        ("ATXMotherboard", create_box, (2.6, 0.08, 2.6), [0.0, -0.8, 0.0], [0, 0, 0, 1], [0.08, 0.12, 0.18, 1.0]),
        ("LGACPUSocket", create_box, (0.8, 0.1, 0.8), [0.0, -0.7, -0.4], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("DDR4RAMSlots", create_box, (0.35, 0.22, 1.2), [0.75, -0.65, -0.3], [0, 0, 0, 1], [0.15, 0.65, 0.95, 1.0]),
        ("PCIe16xSlot", create_box, (1.3, 0.18, 0.15), [-0.2, -0.68, 0.4], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("M2NVMeHeatsink", create_box, (0.7, 0.12, 0.22), [0.2, -0.7, 0.1], [0, 0, 0, 1], [0.85, 0.25, 0.25, 1.0]),
        ("VRMHeatsinks", create_box, (0.3, 0.35, 0.8), [-0.65, -0.58, -0.4], [0, 0, 0, 1], [0.35, 0.38, 0.42, 1.0]),
        ("ATX24PinPowerHeader", create_box, (0.2, 0.25, 0.6), [1.1, -0.65, 0.3], [0, 0, 0, 1], [0.95, 0.85, 0.25, 1.0]),
    ]
    build_glb(pc_components, "frontend/models/pc_hardware_assembly.glb")

    # 5. Discrete Mathematics 3D Model
    dm_components = [
        ("BaseBoard", create_box, (2.6, 0.08, 2.2), [0.0, -0.8, 0.0], [0, 0, 0, 1], [0.12, 0.16, 0.25, 1.0]),
        ("SetRingA", create_cylinder, (0.55, 0.12, 24), [-0.4, -0.7, 0.0], [0, 0, 0, 1], [0.25, 0.65, 0.95, 1.0]),
        ("SetRingB", create_cylinder, (0.55, 0.12, 24), [0.4, -0.7, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.25, 1.0]),
        ("GraphNode1", create_cylinder, (0.18, 0.25, 18), [-0.7, -0.55, -0.5], [0, 0, 0, 1], [0.25, 0.85, 0.45, 1.0]),
        ("GraphNode2", create_cylinder, (0.18, 0.25, 18), [0.7, -0.55, -0.5], [0, 0, 0, 1], [0.95, 0.75, 0.15, 1.0]),
        ("GraphEdgeConnector", create_box, (1.2, 0.06, 0.06), [0.0, -0.55, -0.5], [0, 0, 0, 1], [0.85, 0.88, 0.95, 1.0]),
    ]
    build_glb(dm_components, "frontend/models/discrete_mathematics.glb")


if __name__ == "__main__":
    generate_all()
