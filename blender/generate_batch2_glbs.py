"""
Master Procedural GLTF/GLB Asset Generator for Batch 2 TOM & Kinematics Suite
=============================================================================
Generates 3D binary .glb models with named object nodes for Three.js animations:
- Scotch Yoke (scotch_yoke.glb)
- Geneva Mechanism (geneva_mechanism.glb)
- Centrifugal Governor (governor.glb)
- Flywheel Assembly (flywheel.glb)
- Gyroscope Gimbal (gyroscope.glb)
- Mechanical Vibrations (vibrations.glb)
- Simple Harmonic Motion (shm.glb)
- Simple Machines (simple_machines.glb)
- Collision Track (collision_momentum.glb)
- Rotational Dynamics (torque_rotation.glb)
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


def create_sphere(radius: float, rings: int = 12, segments: int = 16):
    verts, nms, idxs = [], [], []
    for i in range(rings + 1):
        v = i / rings
        lat = math.pi * (v - 0.5)
        for j in range(segments):
            u = j / segments
            lon = 2.0 * math.pi * u
            x = radius * math.cos(lat) * math.cos(lon)
            y = radius * math.sin(lat)
            z = radius * math.cos(lat) * math.sin(lon)
            nx, ny, nz = x / radius, y / radius, z / radius
            verts.append([x, y, z])
            nms.append([nx, ny, nz])
    for i in range(rings):
        for j in range(segments):
            p1 = i * (segments) + j
            p2 = p1 + segments
            idxs.extend([p1, p2, p1 + 1, p1 + 1, p2, p2 + 1])
    return np.array(verts, dtype=np.float32), np.array(nms, dtype=np.float32), np.array(idxs, dtype=np.uint16)


def export_generic_glb(components: list, output_path: str, generator_name: str):
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
        "asset": {"version": "2.0", "generator": generator_name},
        "scenes": [{"name": "Scene", "nodes": list(range(len(nodes)))}],
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

    print(f"Generated {generator_name} ({len(bin_buffer)} bytes) -> {output_path}")


def generate_all_batch2_glbs():
    # 1. Scotch Yoke
    export_generic_glb([
        ("CrankPinion", create_cylinder, (0.4, 0.15, 16), [-0.8, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("SlidingYoke", create_box, (1.6, 0.8, 0.12), [0.2, 0.0, 0.1], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("GuideRails", create_box, (2.2, 0.15, 0.12), [0.2, 0.5, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("OutputShaft", create_cylinder, (0.1, 1.2, 12), [1.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/scotch_yoke.glb", "Scotch Yoke GLB Builder")

    # 2. Geneva Mechanism
    export_generic_glb([
        ("DriverWheel", create_cylinder, (0.5, 0.15, 20), [-0.7, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("DrivePin", create_cylinder, (0.06, 0.25, 12), [-0.4, 0.2, 0.1], [0.0, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0]),
        ("GenevaWheel_4Slot", create_cylinder, (0.7, 0.15, 24), [0.7, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("LockingRing", create_cylinder, (0.35, 0.18, 20), [-0.7, 0.0, 0.1], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/geneva_mechanism.glb", "Geneva Mechanism GLB Builder")

    # 3. Governor
    export_generic_glb([
        ("SpindleShaft", create_cylinder, (0.08, 2.2, 16), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("GovernorFlyballs", create_sphere, (0.22, 12, 16), [0.6, 0.4, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("UpperArms", create_box, (0.7, 0.08, 0.06), [0.3, 0.7, 0.0], [0.0, 0.0, -math.pi / 4], [0.20, 0.75, 0.95, 1.0]),
        ("SlidingSleeve", create_cylinder, (0.2, 0.4, 16), [0.0, -0.3, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0])
    ], "frontend/models/governor.glb", "Centrifugal Governor GLB Builder")

    # 4. Flywheel
    export_generic_glb([
        ("FlywheelRim", create_cylinder, (1.2, 0.3, 32), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("FlywheelHub", create_cylinder, (0.3, 0.4, 20), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("Spokes", create_box, (2.2, 0.12, 0.12), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 4], [0.22, 0.26, 0.34, 1.0]),
        ("CrankShaftDrive", create_cylinder, (0.15, 1.5, 16), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/flywheel.glb", "Flywheel GLB Builder")

    # 5. Gyroscope
    export_generic_glb([
        ("FlywheelRotor", create_cylinder, (0.8, 0.2, 24), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("RotorGimbal_Inner", create_cylinder, (1.0, 0.1, 24), [0.0, 0.0, 0.0], [0.0, math.pi / 2, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("Gimbal_Outer", create_cylinder, (1.3, 0.1, 24), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0]),
        ("SupportStand", create_box, (0.2, 1.6, 0.2), [0.0, -1.2, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/gyroscope.glb", "Gyroscope GLB Builder")

    # 6. Mechanical Vibrations
    export_generic_glb([
        ("BasePlate", create_box, (2.0, 0.15, 1.2), [0.0, -1.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("VibratingMass", create_box, (0.8, 0.8, 0.8), [0.0, 0.2, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("SpringCoil", create_cylinder, (0.15, 0.8, 16), [-0.3, -0.4, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("DamperCylinder", create_cylinder, (0.12, 0.8, 16), [0.3, -0.4, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0])
    ], "frontend/models/vibrations.glb", "Mechanical Vibrations GLB Builder")

    # 7. SHM
    export_generic_glb([
        ("SupportRig", create_box, (1.6, 0.15, 0.8), [0.0, 1.2, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("PendulumBob", create_sphere, (0.25, 12, 16), [0.0, -0.6, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("SpringElement", create_cylinder, (0.1, 1.2, 12), [0.0, 0.3, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("OscillatingBlock", create_box, (0.6, 0.6, 0.6), [0.0, -0.3, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0])
    ], "frontend/models/shm.glb", "SHM GLB Builder")

    # 8. Simple Machines
    export_generic_glb([
        ("ScrewThread", create_cylinder, (0.25, 1.8, 20), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("LoadWeight", create_box, (0.9, 0.7, 0.7), [0.0, 1.1, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("TomHandle", create_box, (1.6, 0.1, 0.1), [0.0, 0.1, 0.0], [0.0, 0.0, math.pi / 4], [0.8, 0.8, 0.8, 1.0]),
        ("BaseNut", create_cylinder, (0.45, 0.4, 16), [0.0, -0.8, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/simple_machines.glb", "Simple Machines GLB Builder")

    # 9. Collision Track
    export_generic_glb([
        ("TrackRail", create_box, (3.2, 0.1, 0.6), [0.0, -0.4, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("Glider_A", create_box, (0.5, 0.4, 0.4), [-0.8, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("Glider_B", create_box, (0.5, 0.4, 0.4), [0.6, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("ImpactBumpers", create_sphere, (0.08, 8, 12), [-0.55, 0.0, 0.0], [0.0, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0])
    ], "frontend/models/collision_momentum.glb", "Collision & Momentum GLB Builder")

    # 10. Torque & Rotational Dynamics
    export_generic_glb([
        ("RotatingDisk", create_cylinder, (1.1, 0.25, 28), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("TorquePulley", create_cylinder, (0.35, 0.35, 20), [0.0, 0.0, 0.2], [math.pi / 2, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("HangingWeight", create_cylinder, (0.2, 0.4, 16), [0.35, -1.2, 0.2], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0]),
        ("PivotAxis", create_cylinder, (0.08, 1.5, 12), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/torque_rotation.glb", "Torque & Rotational Dynamics GLB Builder")


if __name__ == "__main__":
    generate_all_batch2_glbs()
