"""
Standalone GLTF/GLB Concrete Workability Apparatus Generator
=============================================================
Generates a binary .glb model of Concrete Workability Apparatus:
1. Slump Cone & Tamping Rod on Non-Porous Base Plate
2. Compacting Factor Upper & Lower Hoppers & Cylinder
3. Vee-Bee Consistometer Vibrating Pot & Rider Disc
"""

import json, struct, math
from pathlib import Path
import numpy as np


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


def create_frustum(r_top: float, r_bottom: float, height: float, segments: int = 24):
    vertices, normals, indices = [], [], []
    half_h = height / 2.0
    slope = math.atan2(r_bottom - r_top, height)
    ny = math.sin(slope)
    nr = math.cos(slope)

    for i in range(segments):
        theta = 2.0 * math.pi * i / segments
        xt = r_top * math.cos(theta)
        zt = r_top * math.sin(theta)
        xb = r_bottom * math.cos(theta)
        zb = r_bottom * math.sin(theta)

        vertices.append([xt, half_h, zt])
        normals.append([nr * math.cos(theta), ny, nr * math.sin(theta)])
        vertices.append([xb, -half_h, zb])
        normals.append([nr * math.cos(theta), ny, nr * math.sin(theta)])

    for i in range(segments):
        next_i = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = next_i * 2, next_i * 2 + 1
        indices.extend([t1, b1, t2, t2, b1, b2])

    return np.array(vertices, dtype=np.float32), np.array(normals, dtype=np.float32), np.array(indices, dtype=np.uint16)


def generate_concrete_workability_glb(output_path: str = "frontend/models/concrete_workability.glb"):
    components = [
        # Base Plate (Dark Metallic)
        ("BasePlate", create_cylinder, (1.8, 0.1, 32), [0.0, -1.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        # Slump Cone Frustum (Metallic Steel, 100mm top dia, 200mm bot dia, 300mm height)
        ("SlumpCone", create_frustum, (0.5, 1.0, 1.8, 24), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.85, 0.88, 0.94, 1.0]),
        # Concrete Sample Slump Cone (Textured Grey Concrete)
        ("ConcreteMould", create_frustum, (0.48, 0.98, 1.76, 24), [0.0, -0.02, 0.0], [0.0, 0.0, 0.0], [0.55, 0.58, 0.62, 1.0]),
        # Tamping Steel Rod (16mm dia, 600mm long with rounded hemispherical end)
        ("TampingRod", create_cylinder, (0.08, 3.2, 16), [1.3, 0.6, 0.0], [0.0, 0.0, 0.0], [0.38, 0.85, 0.98, 1.0]),
        # Slump Height Rule Gauge (Brass scale)
        ("HeightGauge", create_cylinder, (0.06, 2.0, 12), [-1.3, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.75, 0.15, 1.0]),
        # Compacting Factor Upper Hopper
        ("UpperHopper", create_frustum, (0.8, 0.35, 0.9, 20), [-2.8, 1.6, 0.0], [0.0, 0.0, 0.0], [0.29, 0.56, 0.89, 1.0]),
        # Compacting Factor Lower Hopper
        ("LowerHopper", create_frustum, (0.7, 0.3, 0.8, 20), [-2.8, 0.5, 0.0], [0.0, 0.0, 0.0], [0.29, 0.56, 0.89, 1.0]),
        # Compacting Factor Receiving Cylinder
        ("CylinderMould", create_cylinder, (0.5, 1.2, 20), [-2.8, -0.5, 0.0], [0.0, 0.0, 0.0], [0.95, 0.45, 0.15, 1.0]),
        # Vee-Bee Vibrating Pot & Rider Disc
        ("VeeBeePot", create_cylinder, (0.9, 1.0, 24), [2.8, -0.5, 0.0], [0.0, 0.0, 0.0], [0.15, 0.68, 0.38, 1.0]),
        ("VeeBeeRiderDisc", create_cylinder, (0.85, 0.08, 24), [2.8, 0.6, 0.0], [0.0, 0.0, 0.0], [0.75, 0.85, 0.95, 0.8]),
    ]

    bin_buffer = bytearray()
    buffer_views, accessors, meshes, nodes, materials = [], [], [], [], []

    for name, func, args, pos, rot, color in components:
        verts, norms, indices = func(*args)

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
        "asset": {"version": "2.0", "generator": "Concrete Workability GLB Generator"},
        "scenes": [{"name": "WorkabilityScene", "nodes": list(range(len(nodes)))}],
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

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, 'wb') as f:
        f.write(glb_header)
        f.write(json_chunk_header)
        f.write(json_bytes)
        f.write(bin_chunk_header)
        f.write(bin_buffer)
    print(f"Generated {output_path} ({total_length} bytes)")


if __name__ == "__main__":
    generate_concrete_workability_glb()
