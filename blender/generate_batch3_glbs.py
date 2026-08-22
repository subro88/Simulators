"""
Master Procedural GLTF/GLB Asset Generator for Batch 3 SOM & Machine Design Suite
================================================================================
Generates 18 binary .glb 3D mechanical models saved to frontend/models/:
- stress_strain.glb
- beam_bending.glb
- shaft_torsion.glb
- column_buckling.glb
- mohrs_circle.glb
- stress_concentration.glb
- pressure_vessel.glb
- spring_design.glb
- bolted_joint.glb
- riveted_joints.glb
- weld_strength.glb
- bearing_selection.glb
- gear_strength.glb
- power_screw.glb
- fatigue_life.glb
- crack_propagation.glb
- cross_section_props.glb
- material_testing.glb
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


def generate_all_batch3_glbs():
    # 1. Stress Strain
    export_generic_glb([
        ("TensileSpecimen", create_cylinder, (0.25, 2.0, 20), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("GripJaws_Top", create_box, (0.6, 0.4, 0.6), [0.0, 1.1, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("GripJaws_Bottom", create_box, (0.6, 0.4, 0.6), [0.0, -1.1, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("Extensometer", create_box, (0.4, 0.8, 0.2), [0.3, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/stress_strain.glb", "Stress Strain GLB Builder")

    # 2. Beam Bending
    export_generic_glb([
        ("BeamStructure", create_box, (3.0, 0.3, 0.2), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("Support_Pin", create_cylinder, (0.2, 0.4, 16), [-1.2, -0.3, 0.0], [math.pi / 2, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("Support_Roller", create_sphere, (0.18, 12, 16), [1.2, -0.3, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0]),
        ("LoadVector", create_cylinder, (0.08, 0.8, 12), [0.0, 0.6, 0.0], [0.0, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0])
    ], "frontend/models/beam_bending.glb", "Beam Bending GLB Builder")

    # 3. Shaft Torsion
    export_generic_glb([
        ("SolidShaft", create_cylinder, (0.35, 2.5, 24), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.8, 0.8, 0.8, 1.0]),
        ("DriveFlange", create_cylinder, (0.7, 0.2, 20), [-1.2, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0]),
        ("BearingSupport", create_box, (0.3, 1.0, 1.0), [1.2, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/shaft_torsion.glb", "Shaft Torsion GLB Builder")

    # 4. Column Buckling
    export_generic_glb([
        ("ColumnStrut", create_box, (0.2, 2.8, 0.2), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("BasePlate", create_box, (1.0, 0.2, 1.0), [0.0, -1.5, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("TopCap", create_box, (0.8, 0.2, 0.8), [0.0, 1.5, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/column_buckling.glb", "Column Buckling GLB Builder")

    # 5. Mohr's Circle
    export_generic_glb([
        ("StressElementCube", create_box, (0.8, 0.8, 0.8), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("PrincipalAxes", create_cylinder, (0.04, 2.2, 12), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 4], [0.20, 0.75, 0.95, 1.0]),
        ("ShearPlanes", create_box, (1.2, 0.04, 0.8), [0.0, 0.0, 0.0], [0.0, 0.0, -math.pi / 4], [0.34, 0.85, 0.40, 1.0])
    ], "frontend/models/mohrs_circle.glb", "Mohr Circle GLB Builder")

    # 6. Stress Concentration
    export_generic_glb([
        ("HolePlate", create_box, (2.4, 1.2, 0.15), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("HoleEdgeRing", create_cylinder, (0.3, 0.18, 20), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0])
    ], "frontend/models/stress_concentration.glb", "Stress Concentration GLB Builder")

    # 7. Pressure Vessel
    export_generic_glb([
        ("CylindricalVessel", create_cylinder, (0.8, 2.2, 24), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 0.8]),
        ("HemisphericalEndCap", create_sphere, (0.8, 16, 20), [-1.1, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("PressureGauge", create_cylinder, (0.2, 0.3, 16), [0.0, 0.9, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0])
    ], "frontend/models/pressure_vessel.glb", "Pressure Vessel GLB Builder")

    # 8. Spring Design
    export_generic_glb([
        ("HelicalCoilSpring", create_cylinder, (0.6, 1.8, 24), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("CompressorPlates", create_box, (1.4, 0.15, 1.4), [0.0, 1.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/spring_design.glb", "Spring Design GLB Builder")

    # 9. Bolted Joint
    export_generic_glb([
        ("HexBolt", create_cylinder, (0.2, 1.8, 16), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("ClampedPlates", create_box, (1.6, 0.8, 1.2), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 0.7]),
        ("NutThread", create_cylinder, (0.3, 0.3, 16), [0.0, -0.6, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/bolted_joint.glb", "Bolted Joint GLB Builder")

    # 10. Riveted Joints
    export_generic_glb([
        ("LapJointPlate", create_box, (2.2, 0.15, 1.0), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("RivetShank", create_cylinder, (0.15, 0.5, 16), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/riveted_joints.glb", "Riveted Joints GLB Builder")

    # 11. Weld Strength
    export_generic_glb([
        ("WeldBasePlate", create_box, (2.0, 0.15, 1.2), [0.0, -0.1, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("FilletWeldBead", create_box, (0.12, 0.12, 1.2), [0.5, 0.1, 0.0], [0.0, 0.0, math.pi / 4], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/weld_strength.glb", "Weld Strength GLB Builder")

    # 12. Bearing Selection
    export_generic_glb([
        ("BearingOuterRing", create_cylinder, (0.9, 0.4, 24), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("BearingInnerRing", create_cylinder, (0.4, 0.45, 20), [0.0, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0]),
        ("BallBearings", create_sphere, (0.18, 12, 16), [0.65, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/bearing_selection.glb", "Bearing Selection GLB Builder")

    # 13. Gear Strength
    export_generic_glb([
        ("SpurGearPinion", create_cylinder, (0.5, 0.3, 20), [-0.7, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("SpurGearWheel", create_cylinder, (1.2, 0.3, 32), [0.9, 0.0, 0.0], [math.pi / 2, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/gear_strength.glb", "Gear Strength GLB Builder")

    # 14. Power Screw
    export_generic_glb([
        ("SquareThreadScrew", create_cylinder, (0.3, 2.2, 20), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("BronzeNut", create_cylinder, (0.6, 0.5, 16), [0.0, 0.2, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0])
    ], "frontend/models/power_screw.glb", "Power Screw GLB Builder")

    # 15. Fatigue Life
    export_generic_glb([
        ("RotatingBendingSpecimen", create_cylinder, (0.25, 2.0, 20), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.8, 0.8, 0.8, 1.0]),
        ("LoadYoke", create_box, (0.4, 0.8, 0.6), [0.9, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/fatigue_life.glb", "Fatigue Life GLB Builder")

    # 16. Crack Propagation
    export_generic_glb([
        ("CrackedPlateSpecimen", create_box, (2.0, 1.4, 0.15), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("CrackTipDetail", create_box, (0.4, 0.04, 0.16), [-0.8, 0.0, 0.0], [0.0, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0])
    ], "frontend/models/crack_propagation.glb", "Crack Propagation GLB Builder")

    # 17. Cross Section Props
    export_generic_glb([
        ("IBeamSection", create_box, (0.12, 2.0, 1.0), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("TopFlange", create_box, (1.0, 0.15, 1.0), [0.0, 0.9, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/cross_section_props.glb", "Cross Section Props GLB Builder")

    # 18. Material Testing
    export_generic_glb([
        ("UTMTesterFrame", create_box, (1.6, 2.8, 0.3), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("HardnessIndenter", create_sphere, (0.15, 12, 16), [0.0, -0.2, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/material_testing.glb", "Material Testing GLB Builder")


if __name__ == "__main__":
    generate_all_batch3_glbs()
