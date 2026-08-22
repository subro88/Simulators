"""
Standalone High-Detail GLTF/GLB Differential Generator
======================================================
Generates a binary .glb model of an automotive differential assembly
with bevel gear profiles, cut-away housing, and individual named nodes
for Three.js animation and Exploded View inspection.
"""

import json
import struct
import math
from pathlib import Path
import numpy as np


def create_beveled_gear(radius: float, height: float, teeth: int = 14, inner_rad: float = 0.12):
    """Generate high-detail bevel gear mesh with distinct teeth profile."""
    vertices = []
    normals = []
    indices = []

    half_h = height / 2.0
    segments = teeth * 4

    for i in range(segments):
        angle = 2.0 * math.pi * i / segments
        # Tooth profile modulation: alternating tooth crest and root
        t_phase = (i % 4)
        if t_phase == 0 or t_phase == 1:
            r_top = radius * 1.08
            r_bot = radius * 0.95
        else:
            r_top = radius * 0.88
            r_bot = radius * 0.78

        x_top = r_top * math.cos(angle)
        z_top = r_top * math.sin(angle)
        x_bot = r_bot * math.cos(angle)
        z_bot = r_bot * math.sin(angle)

        nx = math.cos(angle)
        nz = math.sin(angle)

        # Top vertex
        vertices.append([x_top, half_h, z_top])
        normals.append([nx, 0.3, nz])

        # Bottom vertex
        vertices.append([x_bot, -half_h, z_bot])
        normals.append([nx, -0.3, nz])

    for i in range(segments):
        next_i = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = next_i * 2, next_i * 2 + 1
        indices.extend([t1, b1, t2, t2, b1, b2])

    # Inner bore hole (hub)
    bore_start = len(vertices)
    for i in range(segments):
        angle = 2.0 * math.pi * i / segments
        x = inner_rad * math.cos(angle)
        z = inner_rad * math.sin(angle)
        vertices.append([x, half_h, z])
        normals.append([0.0, 1.0, 0.0])
        vertices.append([x, -half_h, z])
        normals.append([0.0, -1.0, 0.0])

    for i in range(segments):
        next_i = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2 = next_i * 2
        in_t1 = bore_start + i * 2
        in_t2 = bore_start + next_i * 2
        indices.extend([t1, t2, in_t1, t2, in_t2, in_t1])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def create_crown_ring(major_r: float, minor_r: float, radial_seg: int = 32, tubular_seg: int = 20):
    """Generate high-detail Crown Wheel ring with gear teeth slots."""
    vertices = []
    normals = []
    indices = []

    for i in range(radial_seg):
        u = 2.0 * math.pi * i / radial_seg
        cu, su = math.cos(u), math.sin(u)
        tooth_mod = 1.0 + (0.08 if (i % 2 == 0) else 0.0)

        for j in range(tubular_seg):
            v = 2.0 * math.pi * j / tubular_seg
            cv, sv = math.cos(v), math.sin(v)

            r_curr = (major_r + minor_r * cv) * tooth_mod
            x = r_curr * cu
            y = minor_r * sv
            z = r_curr * su

            nx = cv * cu
            ny = sv
            nz = cv * su

            vertices.append([x, y, z])
            normals.append([nx, ny, nz])

    for i in range(radial_seg):
        next_i = (i + 1) % radial_seg
        for j in range(tubular_seg):
            next_j = (j + 1) % tubular_seg

            a = i * tubular_seg + j
            b = next_i * tubular_seg + j
            c = next_i * tubular_seg + next_j
            d = i * tubular_seg + next_j

            indices.extend([a, b, d, b, c, d])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def create_axle_housing(radius: float, height: float, segments: int = 24):
    """Generate cut-away semi-cylindrical axle housing tube."""
    vertices = []
    normals = []
    indices = []

    half_h = height / 2.0
    for i in range(segments):
        # Cut-away arc (270 degrees visible, 90 degrees open cut-away)
        angle = (math.pi * 1.5) * i / (segments - 1) - (math.pi * 0.75)
        x = radius * math.cos(angle)
        z = radius * math.sin(angle)
        nx = math.cos(angle)
        nz = math.sin(angle)

        vertices.append([x, half_h, z])
        normals.append([nx, 0.0, nz])
        vertices.append([x, -half_h, z])
        normals.append([nx, 0.0, nz])

    for i in range(segments - 1):
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = (i + 1) * 2, (i + 1) * 2 + 1
        indices.extend([t1, b1, t2, t2, b1, b2])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def generate_differential_glb(output_path: str = "frontend/models/differential.glb"):
    """Generate high-detail differential GLB with housing and named nodes."""
    components = [
        ("DrivePinion", create_beveled_gear, (0.36, 0.8, 10, 0.1), [0.0, -1.75, 0.0], [math.pi / 2, 0.0, 0.0], [1.0, 0.6, 0.0, 1.0]),
        ("CrownWheel", create_crown_ring, (1.35, 0.22, 32, 20), [0.0, 0.0, 0.0], [0.0, math.pi / 2, 0.0], [0.16, 0.71, 0.96, 1.0]),
        ("DifferentialCarrier", create_beveled_gear, (0.55, 0.6, 16, 0.2), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.12, 0.15, 0.22, 1.0]),
        ("CrossPin", create_beveled_gear, (0.08, 1.5, 8, 0.02), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.55, 0.62, 0.70, 1.0]),
        ("SpiderGear_Top", create_beveled_gear, (0.34, 0.45, 10, 0.08), [0.0, 0.62, 0.0], [0.0, 0.0, 0.0], [1.0, 0.84, 0.0, 1.0]),
        ("SpiderGear_Bottom", create_beveled_gear, (0.34, 0.45, 10, 0.08), [0.0, -0.62, 0.0], [math.pi, 0.0, 0.0], [1.0, 0.84, 0.0, 1.0]),
        ("SunGear_Left", create_beveled_gear, (0.48, 0.55, 14, 0.12), [-1.15, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.24, 0.86, 0.52, 1.0]),
        ("SunGear_Right", create_beveled_gear, (0.48, 0.55, 14, 0.12), [1.15, 0.0, 0.0], [0.0, 0.0, -math.pi / 2], [0.24, 0.86, 0.52, 1.0]),
        ("Axle_Left", create_beveled_gear, (0.12, 1.8, 12, 0.04), [-2.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.55, 0.62, 0.70, 1.0]),
        ("Axle_Right", create_beveled_gear, (0.12, 1.8, 12, 0.04), [2.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.55, 0.62, 0.70, 1.0]),
        ("Wheel_Left", create_beveled_gear, (0.88, 0.5, 24, 0.25), [-3.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.13, 0.15, 0.18, 1.0]),
        ("Wheel_Right", create_beveled_gear, (0.88, 0.5, 24, 0.25), [3.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.13, 0.15, 0.18, 1.0]),
        ("AxleHousing_Left", create_axle_housing, (0.6, 1.6, 20), [-2.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.18, 0.22, 0.30, 0.6]),
        ("AxleHousing_Right", create_axle_housing, (0.6, 1.6, 20), [2.0, 0.0, 0.0], [0.0, 0.0, -math.pi / 2], [0.18, 0.22, 0.30, 0.6]),
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
        "asset": {"version": "2.0", "generator": "High-Detail Differential GLB Builder"},
        "scenes": [{"name": "DifferentialScene", "nodes": list(range(len(nodes)))}],
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

    print(f"Generated High-Detail Differential GLB ({len(bin_buffer)} bytes) -> {output_path}")


if __name__ == "__main__":
    generate_differential_glb()
