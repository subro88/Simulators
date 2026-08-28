"""
Binary glTF (.glb) Generator for WBSCTE Mechanical Engineering 3rd Semester Tools
=================================================================================
Generates 11 3D assets for ME 3rd Sem:
- frontend/models/casting_process.glb
- frontend/models/metal_forming_forging.glb
- frontend/models/welding_technology.glb
- frontend/models/shaft_couplings_joints.glb
- frontend/models/plummer_block_bearings.glb
- frontend/models/iron_carbon_phase_diagram.glb
- frontend/models/heat_treatment_metallurgy.glb
- frontend/models/ndt_materials_testing.glb
- frontend/models/air_standard_cycles.glb
- frontend/models/steam_properties_mollier.glb
- frontend/models/steam_boilers_mountings.glb
"""

import json
import struct
import math
from pathlib import Path
import numpy as np


def create_box(width: float, height: float, depth: float):
    w2, h2, d2 = width / 2.0, height / 2.0, depth / 2.0
    vertices = [
        [-w2, -h2,  d2], [ w2, -h2,  d2], [ w2,  h2,  d2], [-w2,  h2,  d2],
        [ w2, -h2, -d2], [-w2, -h2, -d2], [-w2,  h2, -d2], [ w2,  h2, -d2],
        [-w2,  h2,  d2], [ w2,  h2,  d2], [ w2,  h2, -d2], [-w2,  h2, -d2],
        [-w2, -h2, -d2], [ w2, -h2, -d2], [ w2, -h2,  d2], [-w2, -h2,  d2],
        [ w2, -h2,  d2], [ w2, -h2, -d2], [ w2,  h2, -d2], [ w2,  h2,  d2],
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
        "asset": {"version": "2.0", "generator": "NHIT ME 3rd Sem GLB Engine"},
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
    # 1. Casting Process 3D Model
    casting_components = [
        ("MoldingFlaskDrag", create_box, (1.6, 0.5, 1.4), [-0.5, -0.4, 0.0], [0, 0, 0, 1], [0.65, 0.55, 0.45, 1.0]),
        ("MoldingFlaskCope", create_box, (1.6, 0.5, 1.4), [-0.5, 0.2, 0.0], [0, 0, 0, 1], [0.55, 0.45, 0.35, 1.0]),
        ("GatingSprueRiser", create_cylinder, (0.12, 0.9, 16), [-0.5, 0.5, 0.2], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("CupolaFurnaceShell", create_cylinder, (0.45, 1.8, 20), [0.8, 0.1, 0.0], [0, 0, 0, 1], [0.25, 0.30, 0.38, 1.0]),
    ]
    build_glb(casting_components, "frontend/models/casting_process.glb")

    # 2. Metal Forming & Forging 3D Model
    forming_components = [
        ("ForgingPressBed", create_box, (1.6, 0.4, 1.4), [-0.4, -0.6, 0.0], [0, 0, 0, 1], [0.20, 0.25, 0.32, 1.0]),
        ("HydraulicRamUpperDie", create_box, (1.0, 0.5, 0.9), [-0.4, 0.5, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("RollingMillWorkRollUpper", create_cylinder, (0.22, 1.2, 20), [0.8, 0.35, 0.0], [0.7071, 0, 0, 0.7071], [0.70, 0.75, 0.82, 1.0]),
        ("RollingMillWorkRollLower", create_cylinder, (0.22, 1.2, 20), [0.8, -0.25, 0.0], [0.7071, 0, 0, 0.7071], [0.70, 0.75, 0.82, 1.0]),
    ]
    build_glb(forming_components, "frontend/models/metal_forming_forging.glb")

    # 3. Welding Technology 3D Model
    welding_components = [
        ("WeldingWorktable", create_box, (1.6, 0.4, 1.2), [-0.4, -0.5, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ButtJointWorkpieces", create_box, (1.2, 0.15, 0.8), [-0.4, -0.2, 0.0], [0, 0, 0, 1], [0.65, 0.70, 0.78, 1.0]),
        ("ArcElectrodeHolder", create_cylinder, (0.04, 0.8, 16), [-0.2, 0.4, 0.0], [0, 0, 0.2588, 0.9659], [0.95, 0.45, 0.15, 1.0]),
        ("GasOxygenCylinder", create_cylinder, (0.22, 1.6, 20), [0.8, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
    ]
    build_glb(welding_components, "frontend/models/welding_technology.glb")

    # 4. Shaft Couplings & Joints 3D Model
    coupling_components = [
        ("DrivingFlangeHub", create_cylinder, (0.45, 0.5, 20), [-0.5, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.45, 0.65, 1.0]),
        ("DrivenFlangeHub", create_cylinder, (0.45, 0.5, 20), [0.2, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.45, 0.65, 1.0]),
        ("FlangeCouplingBoltsRing", create_cylinder, (0.55, 0.1, 20), [-0.15, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("OldhamCenterSliderDisc", create_box, (0.1, 0.7, 0.7), [0.8, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(coupling_components, "frontend/models/shaft_couplings_joints.glb")

    # 5. Machine Bearings & Plummer Block 3D Model
    bearing_components = [
        ("PlummerBlockCastIronBase", create_box, (1.6, 0.4, 0.8), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.25, 0.30, 0.38, 1.0]),
        ("SplitBrassBearingBushLower", create_cylinder, (0.35, 0.6, 20), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.75, 0.15, 1.0]),
        ("PlummerBlockBearingCap", create_box, (1.2, 0.5, 0.75), [0.0, 0.35, 0.0], [0, 0, 0, 1], [0.35, 0.40, 0.48, 1.0]),
        ("RotatingShaftJournal", create_cylinder, (0.22, 1.4, 20), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(bearing_components, "frontend/models/plummer_block_bearings.glb")

    # 6. Iron-Carbon Phase Diagram 3D Model
    fe_c_components = [
        ("MicroscopeStandBase", create_box, (1.2, 0.3, 1.2), [-0.4, -0.6, 0.0], [0, 0, 0, 1], [0.12, 0.16, 0.22, 1.0]),
        ("MicroscopeOpticsTube", create_cylinder, (0.15, 1.0, 20), [-0.4, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("AusteniteFCCLatticeCube", create_box, (0.7, 0.7, 0.7), [0.7, 0.2, 0.0], [0, 0.3827, 0, 0.9239], [0.95, 0.45, 0.15, 1.0]),
        ("PearliteLamellarPlate", create_box, (0.8, 0.2, 0.8), [0.7, -0.5, 0.0], [0, 0, 0, 1], [0.30, 0.65, 0.95, 1.0]),
    ]
    build_glb(fe_c_components, "frontend/models/iron_carbon_phase_diagram.glb")

    # 7. Heat Treatment & Metallurgy 3D Model
    ht_components = [
        ("MuffleFurnaceChassis", create_box, (1.4, 1.4, 1.2), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.20, 0.25, 0.32, 1.0]),
        ("FurnaceInsulatedDoor", create_box, (1.1, 1.1, 0.15), [-0.5, 0.0, 0.65], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("QuenchingOilTank", create_box, (1.0, 0.9, 0.9), [0.8, -0.3, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.75, 1.0]),
        ("TemperatureControlDial", create_cylinder, (0.2, 0.1, 16), [-0.5, 0.9, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(ht_components, "frontend/models/heat_treatment_metallurgy.glb")

    # 8. NDT Materials Testing 3D Model
    ndt_components = [
        ("UltrasonicFlawDetectorUnit", create_box, (1.2, 0.9, 0.5), [-0.4, 0.1, 0.0], [0, 0, 0, 1], [0.12, 0.16, 0.24, 1.0]),
        ("UTDigitalScopeScreen", create_box, (0.8, 0.5, 0.05), [-0.4, 0.15, 0.26], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("AngleBeamUTProbe", create_box, (0.3, 0.25, 0.25), [0.7, -0.2, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("SteelCalibrationStepWedge", create_box, (0.8, 0.35, 0.5), [0.7, -0.6, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.88, 1.0]),
    ]
    build_glb(ndt_components, "frontend/models/ndt_materials_testing.glb")

    # 9. Air Standard Cycles 3D Model
    cycle_components = [
        ("EngineCylinderBlock", create_cylinder, (0.5, 1.4, 20), [-0.4, 0.1, 0.0], [0, 0, 0, 1], [0.25, 0.30, 0.38, 1.0]),
        ("ReciprocatingPistonHead", create_cylinder, (0.46, 0.3, 20), [-0.4, 0.3, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("EngineFlywheelWheel", create_cylinder, (0.6, 0.2, 24), [0.8, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("PVIndicatorGauge", create_cylinder, (0.25, 0.15, 16), [-0.4, 1.0, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(cycle_components, "frontend/models/air_standard_cycles.glb")

    # 10. Steam Properties & Mollier 3D Model
    steam_components = [
        ("ThrottlingCalorimeterBody", create_cylinder, (0.4, 1.2, 20), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.88, 1.0]),
        ("SteamSamplingPipe", create_cylinder, (0.08, 1.4, 16), [-0.5, 0.8, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("MercuryManometerUColumn", create_box, (0.2, 1.0, 0.1), [0.6, 0.1, 0.0], [0, 0, 0, 1], [0.20, 0.65, 0.95, 1.0]),
        ("SteamThermometerWell", create_cylinder, (0.04, 0.8, 16), [0.6, -0.5, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(steam_components, "frontend/models/steam_properties_mollier.glb")

    # 11. Steam Boilers & Mountings 3D Model
    boiler_components = [
        ("BabcockBoilerSteamDrum", create_cylinder, (0.5, 1.8, 24), [0.0, 0.6, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.45, 0.65, 1.0]),
        ("WaterTubesInclinedBank", create_box, (1.4, 0.7, 0.8), [0.0, -0.2, 0.0], [0.2588, 0, 0, 0.9659], [0.35, 0.40, 0.48, 1.0]),
        ("SpringLoadedSafetyValve", create_cylinder, (0.15, 0.6, 16), [-0.5, 1.1, 0.0], [0, 0, 0, 1], [0.95, 0.35, 0.15, 1.0]),
        ("BourdonSteamPressureGauge", create_cylinder, (0.2, 0.1, 16), [0.5, 1.1, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(boiler_components, "frontend/models/steam_boilers_mountings.glb")


if __name__ == "__main__":
    generate_all()
