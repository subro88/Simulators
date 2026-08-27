"""
Binary glTF (.glb) Generator for WBSCTE Computer Science & Technology 4th Semester Tools
=======================================================================================
Generates 6 high-quality 3D assets:
- frontend/models/microprocessor_8085.glb
- frontend/models/computer_networks.glb
- frontend/models/rdbms_sql_database.glb
- frontend/models/object_oriented_programming.glb
- frontend/models/computer_graphics.glb
- frontend/models/web_development.glb
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
        "asset": {"version": "2.0", "generator": "NHIT CST 4th Sem GLB Engine"},
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
    # 1. Microprocessor 8085 3D Model
    mp_components = [
        ("TrainerKitPCB", create_box, (3.2, 0.1, 2.2), [0.0, -0.9, 0.0], [0, 0, 0, 1], [0.08, 0.28, 0.18, 1.0]),
        ("DIP40_8085Chip", create_box, (1.8, 0.22, 0.6), [-0.2, -0.75, -0.3], [0, 0, 0, 1], [0.12, 0.14, 0.16, 1.0]),
        ("PPI8255Chip", create_box, (1.2, 0.2, 0.5), [0.8, -0.75, 0.4], [0, 0, 0, 1], [0.15, 0.17, 0.20, 1.0]),
        ("CrystalOscillator", create_box, (0.4, 0.18, 0.2), [-1.1, -0.75, 0.3], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("HexKeypadArray", create_box, (0.9, 0.15, 0.9), [-0.7, -0.78, 0.4], [0, 0, 0, 1], [0.25, 0.55, 0.95, 1.0]),
        ("SevenSegmentDisplay", create_box, (0.8, 0.2, 0.3), [0.8, -0.75, -0.4], [0, 0, 0, 1], [0.95, 0.25, 0.25, 1.0]),
    ]
    build_glb(mp_components, "frontend/models/microprocessor_8085.glb")

    # 2. Computer Networks 3D Model
    cn_components = [
        ("ServerRackChassis", create_box, (2.6, 2.8, 1.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.10, 0.12, 0.16, 1.0]),
        ("CoreRouterUnit", create_box, (2.2, 0.45, 1.4), [0.0, 0.7, 0.1], [0, 0, 0, 1], [0.20, 0.65, 0.95, 1.0]),
        ("GigabitSwitch", create_box, (2.2, 0.45, 1.4), [0.0, 0.1, 0.1], [0, 0, 0, 1], [0.25, 0.85, 0.45, 1.0]),
        ("PatchPanelRJ45", create_box, (2.2, 0.35, 1.3), [0.0, -0.45, 0.1], [0, 0, 0, 1], [0.85, 0.75, 0.20, 1.0]),
        ("FiberOpticTransceiver", create_box, (0.6, 0.25, 0.8), [-0.7, -0.9, 0.2], [0, 0, 0, 1], [0.95, 0.35, 0.15, 1.0]),
        ("NetworkCablingBundle", create_cylinder, (0.06, 1.6, 16), [0.9, 0.1, 0.3], [0, 0, 0, 1], [0.15, 0.85, 0.95, 1.0]),
    ]
    build_glb(cn_components, "frontend/models/computer_networks.glb")

    # 3. RDBMS SQL Database 3D Model
    rdbms_components = [
        ("StorageDiskPlatter", create_cylinder, (1.2, 0.15, 24), [0.0, -0.8, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.85, 1.0]),
        ("TableCylinder1", create_cylinder, (0.5, 0.7, 24), [-0.7, -0.3, -0.4], [0, 0, 0, 1], [0.25, 0.65, 0.95, 1.0]),
        ("TableCylinder2", create_cylinder, (0.5, 0.7, 24), [0.7, -0.3, -0.4], [0, 0, 0, 1], [0.95, 0.45, 0.25, 1.0]),
        ("BTreeIndexRoot", create_box, (0.6, 0.35, 0.6), [0.0, 0.5, 0.2], [0, 0, 0, 1], [0.90, 0.75, 0.15, 1.0]),
        ("ForeignKeyLinkBar", create_box, (1.1, 0.08, 0.08), [0.0, -0.1, -0.4], [0, 0, 0, 1], [0.00, 0.90, 0.45, 1.0]),
        ("TransactionWALBuffer", create_box, (1.4, 0.2, 0.5), [0.0, -0.6, 0.5], [0, 0, 0, 1], [0.85, 0.25, 0.85, 1.0]),
    ]
    build_glb(rdbms_components, "frontend/models/rdbms_sql_database.glb")

    # 4. OOP Virtual Lab 3D Model
    oop_components = [
        ("BaseClassObject", create_box, (1.2, 0.8, 1.2), [-0.6, -0.4, 0.0], [0, 0, 0, 1], [0.20, 0.60, 0.95, 1.0]),
        ("DerivedInheritedClass", create_box, (1.2, 0.8, 1.2), [0.7, -0.4, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("VTableMethodArray", create_box, (1.8, 0.25, 0.8), [0.05, 0.4, 0.0], [0, 0, 0, 1], [0.25, 0.85, 0.45, 1.0]),
        ("VirtualPointerVPtr", create_cylinder, (0.08, 0.6, 16), [0.05, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.85, 0.15, 1.0]),
        ("HeapMemorySegment", create_box, (2.6, 0.1, 1.6), [0.0, -0.9, 0.0], [0, 0, 0, 1], [0.15, 0.18, 0.25, 1.0]),
    ]
    build_glb(oop_components, "frontend/models/object_oriented_programming.glb")

    # 5. Computer Graphics 3D Model
    cg_components = [
        ("RasterDisplayCRT", create_box, (2.4, 1.6, 0.2), [0.0, 0.1, -0.6], [0, 0, 0, 1], [0.10, 0.14, 0.20, 1.0]),
        ("FrameBufferPixelGrid", create_box, (2.2, 1.4, 0.05), [0.0, 0.1, -0.45], [0, 0, 0, 1], [0.15, 0.55, 0.95, 1.0]),
        ("RasterizerCore", create_box, (0.8, 0.4, 0.6), [-0.6, -0.7, 0.2], [0, 0, 0, 1], [0.95, 0.35, 0.20, 1.0]),
        ("TransformationMatrixGizmo", create_cylinder, (0.35, 0.35, 20), [0.6, -0.7, 0.2], [0, 0, 0, 1], [0.00, 0.90, 0.45, 1.0]),
        ("ClippingFrustumWindow", create_box, (1.4, 0.9, 0.05), [0.0, 0.1, -0.3], [0, 0, 0, 1], [0.95, 0.85, 0.15, 1.0]),
    ]
    build_glb(cg_components, "frontend/models/computer_graphics.glb")

    # 6. Web Page Development 3D Model
    web_components = [
        ("BrowserViewportScreen", create_box, (2.4, 1.5, 0.1), [0.0, 0.2, -0.3], [0, 0, 0, 1], [0.12, 0.16, 0.24, 1.0]),
        ("DOMTreeHierarchy", create_box, (0.6, 0.6, 0.6), [-0.7, -0.6, 0.3], [0, 0, 0, 1], [0.25, 0.65, 0.95, 1.0]),
        ("CSSFlexGridEngine", create_box, (0.6, 0.6, 0.6), [0.7, -0.6, 0.3], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("JSEventBusPipeline", create_cylinder, (0.08, 1.2, 16), [0.0, -0.6, 0.3], [0, 0, 0.7071, 0.7071], [0.00, 0.85, 0.40, 1.0]),
        ("ClientServerNetworkLine", create_cylinder, (0.05, 0.8, 16), [0.0, 0.2, 0.3], [0.7071, 0, 0, 0.7071], [0.95, 0.85, 0.20, 1.0]),
    ]
    build_glb(web_components, "frontend/models/web_development.glb")


if __name__ == "__main__":
    generate_all()
