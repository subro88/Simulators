"""
Standalone GLTF/GLB Four-Stroke Engine Generator
================================================
Generates a binary .glb model of a single-cylinder 4-stroke engine assembly
with named mechanical nodes for Three.js slider-crank animation and Exploded View.
"""

import json
import struct
import math
from pathlib import Path
import numpy as np


def create_cylinder(radius: float, height: float, inner_rad: float = 0.0, segments: int = 24):
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

    if inner_rad > 0.0:
        in_start = len(vertices)
        for i in range(segments):
            theta = 2.0 * math.pi * i / segments
            x = inner_rad * math.cos(theta)
            z = inner_rad * math.sin(theta)
            vertices.append([x, half_h, z])
            normals.append([0.0, 1.0, 0.0])
            vertices.append([x, -half_h, z])
            normals.append([0.0, -1.0, 0.0])

        for i in range(segments):
            next_i = (i + 1) % segments
            t1, t2 = i * 2, next_i * 2
            in_t1 = in_start + i * 2
            in_t2 = in_start + next_i * 2
            indices.extend([t1, t2, in_t1, t2, in_t2, in_t1])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def generate_four_stroke_glb(output_path: str = "frontend/models/four_stroke_engine.glb"):
    components = [
        ("CylinderBlock", create_cylinder, (1.2, 3.2, 0.95, 24), [0.0, 0.5, 0.0], [0.0, 0.0, 0.0], [0.25, 0.30, 0.38, 0.4]),
        ("Piston", create_cylinder, (0.9, 0.8, 0.0, 24), [0.0, 1.2, 0.0], [0.0, 0.0, 0.0], [0.85, 0.88, 0.92, 1.0]),
        ("PistonPin", create_cylinder, (0.15, 1.4, 0.0, 16), [0.0, 1.1, 0.0], [0.0, 0.0, math.pi / 2], [0.55, 0.62, 0.70, 1.0]),
        ("ConnectingRod", create_cylinder, (0.18, 2.2, 0.0, 16), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("Crankshaft", create_cylinder, (0.45, 1.2, 0.0, 20), [0.0, -1.2, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 1.0]),
        ("Flywheel", create_cylinder, (1.4, 0.3, 0.2, 28), [0.0, -1.2, -0.8], [0.0, 0.0, math.pi / 2], [0.18, 0.22, 0.28, 1.0]),
        ("IntakeValve", create_cylinder, (0.35, 1.4, 0.0, 16), [-0.45, 2.2, 0.0], [0.0, 0.0, 0.0], [0.20, 0.85, 0.40, 1.0]),
        ("ExhaustValve", create_cylinder, (0.35, 1.4, 0.0, 16), [0.45, 2.2, 0.0], [0.0, 0.0, 0.0], [0.95, 0.35, 0.20, 1.0]),
        ("SparkPlug", create_cylinder, (0.18, 0.8, 0.0, 12), [0.0, 2.4, 0.0], [0.0, 0.0, 0.0], [0.95, 0.85, 0.15, 1.0]),
    ]

    bin_buffer = bytearray()
    buffer_views, accessors, meshes, nodes, materials = [], [], [], [], []

    for name, func, args, pos, rot, color in components:
        verts, norms, indices = func(*args)

        rx, ry, rz = rot
        if rx != 0.0:
            c, s = math.cos(rx), math.sin(rx)
            verts = np.dot(verts, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))
            norms = np.dot(norms, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))
        if rz != 0.0:
            c, s = math.cos(rz), math.sin(rz)
            verts = np.dot(verts, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))
            norms = np.dot(norms, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))

        def align():
            rem = len(bin_buffer) % 4
            if rem > 0:
                bin_buffer.extend(b'\x00' * (4 - rem))

        align()
        idx_offset = len(bin_buffer)
        idx_bytes = indices.tobytes()
        bin_buffer.extend(idx_bytes)
        buffer_views.append({"buffer": 0, "byteOffset": idx_offset, "byteLength": len(idx_bytes), "target": 34963})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5123, "count": len(indices), "type": "SCALAR"})

        align()
        v_offset = len(bin_buffer)
        v_bytes = verts.tobytes()
        bin_buffer.extend(v_bytes)
        buffer_views.append({"buffer": 0, "byteOffset": v_offset, "byteLength": len(v_bytes), "target": 34962})
        accessors.append({
            "bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(verts), "type": "VEC3",
            "min": verts.min(axis=0).tolist(), "max": verts.max(axis=0).tolist()
        })

        align()
        n_offset = len(bin_buffer)
        n_bytes = norms.tobytes()
        bin_buffer.extend(n_bytes)
        buffer_views.append({"buffer": 0, "byteOffset": n_offset, "byteLength": len(n_bytes), "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(norms), "type": "VEC3"})

        materials.append({"name": f"Mat_{name}", "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.85, "roughnessFactor": 0.28}})
        meshes.append({"name": f"Mesh_{name}", "primitives": [{"attributes": {"POSITION": len(accessors) - 2, "NORMAL": len(accessors) - 1}, "indices": len(accessors) - 3, "material": len(materials) - 1}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1, "translation": pos})

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "Four Stroke Engine GLB Generator"},
        "scenes": [{"name": "EngineScene", "nodes": list(range(len(nodes)))}],
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
    if rem > 0:
        json_bytes += b' ' * (4 - rem)

    rem = len(bin_buffer) % 4
    if rem > 0:
        bin_buffer.extend(b'\x00' * (4 - rem))

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

    print(f"Generated Four-Stroke Engine GLB ({len(bin_buffer)} bytes) -> {output_path}")


if __name__ == "__main__":
    generate_four_stroke_glb()
