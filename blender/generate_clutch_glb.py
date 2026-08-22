"""
Standalone GLTF/GLB Clutch Generator
====================================
Generates a binary .glb model of an automotive friction clutch assembly
with named component nodes for Three.js WebGL animation and Exploded View inspection.
"""

import json
import struct
import math
from pathlib import Path
import numpy as np


def create_disc(radius: float, height: float, inner_rad: float = 0.0, segments: int = 32):
    """Generate vertex positions, normals, and face indices for a circular disc/ring."""
    vertices = []
    normals = []
    indices = []

    half_h = height / 2.0

    # Outer ring vertices
    for i in range(segments):
        theta = 2.0 * math.pi * i / segments
        x = radius * math.cos(theta)
        z = radius * math.sin(theta)
        nx = math.cos(theta)
        nz = math.sin(theta)

        vertices.append([x, half_h, z])
        normals.append([nx, 0.0, nz])
        vertices.append([x, -half_h, z])
        normals.append([nx, 0.0, nz])

    for i in range(segments):
        next_i = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = next_i * 2, next_i * 2 + 1
        indices.extend([t1, b1, t2, t2, b1, b2])

    if inner_rad > 0.0:
        inner_start = len(vertices)
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
            t1 = i * 2
            t2 = next_i * 2
            in_t1 = inner_start + i * 2
            in_t2 = inner_start + next_i * 2
            indices.extend([t1, t2, in_t1, t2, in_t2, in_t1])
    else:
        top_center = len(vertices)
        vertices.append([0.0, half_h, 0.0])
        normals.append([0.0, 1.0, 0.0])
        bot_center = len(vertices)
        vertices.append([0.0, -half_h, 0.0])
        normals.append([0.0, -1.0, 0.0])

        for i in range(segments):
            next_i = (i + 1) % segments
            t1, t2 = i * 2, next_i * 2
            indices.extend([top_center, t1, t2])
            b1, b2 = i * 2 + 1, next_i * 2 + 1
            indices.extend([bot_center, b2, b1])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def create_diaphragm_spring(radius: float, height: float, fingers: int = 12):
    """Generate conical diaphragm Belleville spring mesh."""
    vertices = []
    normals = []
    indices = []

    segments = fingers * 2
    half_h = height / 2.0

    for i in range(segments):
        theta = 2.0 * math.pi * i / segments
        is_finger = (i % 2 == 0)
        r = radius if is_finger else radius * 0.4

        x = r * math.cos(theta)
        z = r * math.sin(theta)
        y = half_h if is_finger else -half_h

        vertices.append([x, y, z])
        normals.append([math.cos(theta), 0.5, math.sin(theta)])

    center_idx = len(vertices)
    vertices.append([0.0, -half_h, 0.0])
    normals.append([0.0, -1.0, 0.0])

    for i in range(segments):
        next_i = (i + 1) % segments
        indices.extend([center_idx, i, next_i])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def generate_clutch_glb(output_path: str = "frontend/models/clutch.glb"):
    """
    Generate valid binary GLB model for an automotive friction clutch assembly
    with named mechanical nodes for Three.js animation.
    """
    components = [
        ("Flywheel", create_disc, (1.5, 0.3, 0.2, 32), [0.0, 0.0, -0.6], [math.pi / 2, 0.0, 0.0], [0.22, 0.25, 0.30, 1.0]),
        ("FrictionDisc_Lining", create_disc, (1.4, 0.12, 0.8, 32), [0.0, 0.0, -0.3], [math.pi / 2, 0.0, 0.0], [0.85, 0.45, 0.20, 1.0]),
        ("FrictionDisc_Hub", create_disc, (0.7, 0.2, 0.25, 24), [0.0, 0.0, -0.3], [math.pi / 2, 0.0, 0.0], [0.55, 0.62, 0.70, 1.0]),
        ("PressurePlate", create_disc, (1.42, 0.25, 0.75, 32), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.16, 0.71, 0.96, 1.0]),
        ("DiaphragmSpring", create_diaphragm_spring, (1.35, 0.35, 12), [0.0, 0.0, 0.35], [math.pi / 2, 0.0, 0.0], [1.0, 0.84, 0.0, 1.0]),
        ("ReleaseBearing", create_disc, (0.45, 0.4, 0.25, 20), [0.0, 0.0, 0.8], [math.pi / 2, 0.0, 0.0], [0.38, 0.86, 0.52, 1.0]),
        ("SplinedShaft", create_disc, (0.22, 3.2, 0.0, 20), [0.0, 0.0, 0.2], [math.pi / 2, 0.0, 0.0], [0.65, 0.70, 0.78, 1.0]),
    ]

    bin_buffer = bytearray()
    buffer_views = []
    accessors = []
    meshes = []
    nodes = []
    materials = []

    for idx, (name, func, args, pos, rot, color) in enumerate(components):
        verts, norms, indices = func(*args)

        rx, ry, rz = rot
        if rx != 0.0:
            c, s = math.cos(rx), math.sin(rx)
            verts = np.dot(verts, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))
            norms = np.dot(norms, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))
        if ry != 0.0:
            c, s = math.cos(ry), math.sin(ry)
            verts = np.dot(verts, np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]))
            norms = np.dot(norms, np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]]))
        if rz != 0.0:
            c, s = math.cos(rz), math.sin(rz)
            verts = np.dot(verts, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))
            norms = np.dot(norms, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))

        def align_buffer():
            rem = len(bin_buffer) % 4
            if rem > 0:
                bin_buffer.extend(b'\x00' * (4 - rem))

        align_buffer()
        idx_offset = len(bin_buffer)
        idx_bytes = indices.tobytes()
        bin_buffer.extend(idx_bytes)
        idx_view_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": idx_offset,
            "byteLength": len(idx_bytes),
            "target": 34963
        })
        idx_acc_idx = len(accessors)
        accessors.append({
            "bufferView": idx_view_idx,
            "byteOffset": 0,
            "componentType": 5123,
            "count": len(indices),
            "type": "SCALAR"
        })

        align_buffer()
        v_offset = len(bin_buffer)
        v_bytes = verts.tobytes()
        bin_buffer.extend(v_bytes)
        v_view_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": v_offset,
            "byteLength": len(v_bytes),
            "target": 34962
        })
        v_acc_idx = len(accessors)
        accessors.append({
            "bufferView": v_view_idx,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(verts),
            "type": "VEC3",
            "min": verts.min(axis=0).tolist(),
            "max": verts.max(axis=0).tolist()
        })

        align_buffer()
        n_offset = len(bin_buffer)
        n_bytes = norms.tobytes()
        bin_buffer.extend(n_bytes)
        n_view_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": n_offset,
            "byteLength": len(n_bytes),
            "target": 34962
        })
        n_acc_idx = len(accessors)
        accessors.append({
            "bufferView": n_view_idx,
            "byteOffset": 0,
            "componentType": 5126,
            "count": len(norms),
            "type": "VEC3"
        })

        mat_idx = len(materials)
        materials.append({
            "name": f"Mat_{name}",
            "pbrMetallicRoughness": {
                "baseColorFactor": color,
                "metallicFactor": 0.85,
                "roughnessFactor": 0.28
            }
        })

        mesh_idx = len(meshes)
        meshes.append({
            "name": f"Mesh_{name}",
            "primitives": [{
                "attributes": {
                    "POSITION": v_acc_idx,
                    "NORMAL": n_acc_idx
                },
                "indices": idx_acc_idx,
                "material": mat_idx
            }]
        })

        nodes.append({
            "name": name,
            "mesh": mesh_idx,
            "translation": pos
        })

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "Automotive Clutch GLB Builder"},
        "scenes": [{"name": "ClutchScene", "nodes": list(range(len(nodes)))}],
        "scene": 0,
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_buffer)}]
    }

    json_str = json.dumps(gltf_dict, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')

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

    print(f"Generated Clutch GLB ({len(bin_buffer)} bytes) -> {output_path}")


if __name__ == "__main__":
    generate_clutch_glb()
