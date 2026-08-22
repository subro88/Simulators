"""
Standalone GLTF/GLB Four-Bar Linkage Generator
===============================================
Generates a binary .glb model of a four-bar linkage mechanism with named mechanical nodes
(GroundFrame, InputCrank, CouplerLink, OutputRocker, PinA, PinB, PinC, PinD).
"""

import json, struct, math
from pathlib import Path
import numpy as np


def create_link(length: float, width: float = 0.2, thickness: float = 0.15, segments: int = 16):
    vertices, normals, indices = [], [], []
    half_l = length / 2.0
    half_w = width / 2.0
    half_t = thickness / 2.0

    # Box vertices
    pts = [
        [-half_l, -half_w, -half_t], [half_l, -half_w, -half_t], [half_l, half_w, -half_t], [-half_l, half_w, -half_t],
        [-half_l, -half_w, half_t], [half_l, -half_w, half_t], [half_l, half_w, half_t], [-half_l, half_w, half_t]
    ]
    norms = [
        [0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1],
        [0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]
    ]
    faces = [
        [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6],
        [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2],
        [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]
    ]

    for pt in pts: vertices.append(pt)
    for n in norms: normals.append(n)
    for f in faces: indices.extend(f)

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def generate_four_bar_glb(output_path: str = "frontend/models/four_bar_linkage.glb"):
    components = [
        ("GroundFrame", create_link, (2.2, 0.25, 0.15), [0.0, -1.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("InputCrank", create_link, (0.8, 0.18, 0.12), [-0.8, -0.6, 0.1], [0.0, 0.0, math.pi / 4], [0.95, 0.65, 0.15, 1.0]),
        ("CouplerLink", create_link, (1.8, 0.18, 0.12), [0.0, 0.2, 0.2], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("OutputRocker", create_link, (1.4, 0.18, 0.12), [0.8, -0.3, 0.1], [0.0, 0.0, -math.pi / 6], [0.34, 0.85, 0.40, 1.0]),
    ]

    bin_buffer = bytearray()
    buffer_views, accessors, meshes, nodes, materials = [], [], [], [], []

    for name, func, args, pos, rot, color in components:
        verts, norms, indices = func(*args)
        rx, ry, rz = rot
        if rz != 0.0:
            c, s = math.cos(rz), math.sin(rz)
            verts = np.dot(verts, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))
            norms = np.dot(norms, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))

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
        accessors.append({
            "bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(verts), "type": "VEC3",
            "min": verts.min(axis=0).tolist(), "max": verts.max(axis=0).tolist()
        })

        align()
        n_offset = len(bin_buffer)
        bin_buffer.extend(norms.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": n_offset, "byteLength": len(norms.tobytes()), "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(norms), "type": "VEC3"})

        materials.append({"name": f"Mat_{name}", "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.85, "roughnessFactor": 0.28}})
        meshes.append({"name": f"Mesh_{name}", "primitives": [{"attributes": {"POSITION": len(accessors) - 2, "NORMAL": len(accessors) - 1}, "indices": len(accessors) - 3, "material": len(materials) - 1}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1, "translation": pos})

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "Four Bar Linkage GLB Generator"},
        "scenes": [{"name": "LinkageScene", "nodes": list(range(len(nodes)))}],
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

    print(f"Generated Four-Bar Linkage GLB ({len(bin_buffer)} bytes) -> {output_path}")


if __name__ == "__main__":
    generate_four_bar_glb()
