"""
Standalone GLTF/GLB Slider-Crank Mechanism Generator
=====================================================
Generates a binary .glb model of a slider-crank assembly with named nodes:
CrankShaft, ConnectingRod, GudgeonPin, PistonHead, CylinderBlock.
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


def generate_slider_crank_glb(output_path: str = "frontend/models/slider_crank.glb"):
    components = [
        ("CrankShaft", create_box, (0.7, 0.16, 0.12), [-0.8, 0.0, 0.0], [0.0, 0.0, math.pi / 4], [0.95, 0.65, 0.15, 1.0]),
        ("ConnectingRod", create_box, (1.8, 0.14, 0.10), [0.1, 0.2, 0.1], [0.0, 0.0, -math.pi / 12], [0.20, 0.75, 0.95, 1.0]),
        ("GudgeonPin", create_cylinder, (0.08, 0.3, 12), [1.2, 0.0, 0.1], [math.pi / 2, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("PistonHead", create_cylinder, (0.45, 0.6, 20), [1.2, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.34, 0.85, 0.40, 1.0]),
        ("CylinderBlock", create_cylinder, (0.60, 2.2, 24), [1.2, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.22, 0.26, 0.34, 0.4]),
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
        "asset": {"version": "2.0", "generator": "Slider-Crank GLB Generator"},
        "scenes": [{"name": "SliderCrankScene", "nodes": list(range(len(nodes)))}],
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

    print(f"Generated Slider-Crank GLB ({len(bin_buffer)} bytes) -> {output_path}")


if __name__ == "__main__":
    generate_slider_crank_glb()
