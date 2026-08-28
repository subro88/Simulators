"""
Binary glTF (.glb) Generator for WBSCTE Mechanical Engineering 6th Semester Tools
=================================================================================
Generates 12 3D assets for ME 6th Sem:
- frontend/models/power_screws_screw_jack.glb
- frontend/models/shaft_keys_flange_coupling.glb
- frontend/models/levers_knuckle_cotter_joint.glb
- frontend/models/hydro_pneumatic_circuits.glb
- frontend/models/absorption_refrigeration_electrolux.glb
- frontend/models/air_conditioning_load_duct_design.glb
- frontend/models/cad_transformations_solid_modeling.glb
- frontend/models/industrial_robotics_fms.glb
- frontend/models/solar_thermal_flat_plate_collector.glb
- frontend/models/belt_conveyor_material_handling.glb
- frontend/models/cpm_pert_network_analysis.glb
- frontend/models/inventory_control_eoq.glb
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
        "asset": {"version": "2.0", "generator": "NHIT ME 6th Sem GLB Engine"},
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
    # 1. Power Screws & Screw Jack 3D Model
    jack_comp = [
        ("CastIronScrewJackBody", create_cylinder, (0.45, 0.9, 24), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("SquareThreadedSpindleShaft", create_cylinder, (0.16, 1.2, 24), [0.0, 0.3, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("SwivelLoadBearingCup", create_cylinder, (0.28, 0.12, 20), [0.0, 0.9, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("TommyBarLeverHandle", create_cylinder, (0.05, 1.4, 16), [0.0, 0.7, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(jack_comp, "frontend/models/power_screws_screw_jack.glb")

    # 2. Shaft Keys & Flange Coupling 3D Model
    coupling_comp = [
        ("TransmissionDriveShaft", create_cylinder, (0.14, 1.8, 20), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("RectangularSunkKey", create_box, (0.4, 0.08, 0.06), [0.1, 0.15, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("ProtectedFlangeCouplingHalf", create_cylinder, (0.48, 0.22, 24), [-0.1, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("CouplingBoltCircleArray", create_cylinder, (0.05, 0.3, 16), [-0.1, 0.32, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(coupling_comp, "frontend/models/shaft_keys_flange_coupling.glb")

    # 3. Levers, Knuckle & Cotter Joint 3D Model
    lever_comp = [
        ("BellCrankRightAngleLever", create_box, (0.9, 0.15, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("ForkEyeKnuckleJointFork", create_box, (0.35, 0.6, 0.35), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("HardenedTaperCotterPin", create_box, (0.08, 0.7, 0.18), [0.5, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("SpigotSocketCollarBody", create_cylinder, (0.24, 0.8, 20), [0.5, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(lever_comp, "frontend/models/levers_knuckle_cotter_joint.glb")

    # 4. Hydro-Pneumatic Circuits 3D Model
    circuit_comp = [
        ("DirectionalControlValveBlock", create_box, (0.6, 0.5, 0.4), [-0.4, 0.2, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("DoubleActingHydraulicCylinder", create_cylinder, (0.22, 1.2, 20), [0.4, 0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.75, 0.80, 0.88, 1.0]),
        ("FlowControlThrottleCheckValve", create_box, (0.3, 0.3, 0.25), [0.0, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("HydroPneumaticPressureIntensifier", create_cylinder, (0.32, 0.9, 20), [-0.4, -0.4, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(circuit_comp, "frontend/models/hydro_pneumatic_circuits.glb")

    # 5. Absorption Refrigeration (Electrolux) 3D Model
    electrolux_comp = [
        ("GeneratorBoilerHeaterTube", create_cylinder, (0.18, 0.9, 20), [-0.6, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("BubblePumpPercolatorTube", create_cylinder, (0.06, 1.1, 16), [-0.4, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("AbsorberCoilTubingAssembly", create_cylinder, (0.35, 0.8, 20), [0.2, -0.3, 0.0], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("HydrogenEvaporatorChiller", create_box, (0.6, 0.5, 0.4), [0.4, 0.4, 0.0], [0, 0, 0, 1], [0.15, 0.75, 0.95, 1.0]),
    ]
    build_glb(electrolux_comp, "frontend/models/absorption_refrigeration_electrolux.glb")

    # 6. Air Conditioning Load & Duct Design 3D Model
    ac_comp = [
        ("AirHandlingUnitAHUCasing", create_box, (1.2, 0.9, 0.8), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.88, 1.0]),
        ("ChilledWaterCoolingCoil", create_box, (0.1, 0.7, 0.6), [-0.3, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.65, 0.95, 1.0]),
        ("VariableAirVolumeVAVDamper", create_cylinder, (0.2, 0.3, 16), [0.3, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("SheetMetalRectangularDuctwork", create_box, (0.8, 0.45, 0.45), [0.8, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(ac_comp, "frontend/models/air_conditioning_load_duct_design.glb")

    # 7. CAD Transformations & Solid Modeling 3D Model
    cad_comp = [
        ("SolidCSGPrimitiveBaseBlock", create_box, (0.9, 0.6, 0.6), [-0.2, 0.0, 0.0], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("SolidCylinderBooleanUnion", create_cylinder, (0.25, 0.8, 20), [-0.2, 0.4, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("CoordinateTransformationFrame", create_cylinder, (0.04, 1.0, 16), [0.6, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("ExtrudedProfileRibFeature", create_box, (0.6, 0.3, 0.2), [0.3, 0.2, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(cad_comp, "frontend/models/cad_transformations_solid_modeling.glb")

    # 8. Industrial Robotics & FMS 3D Model
    robot_comp = [
        ("ArticulatedRobotBasePedestal", create_cylinder, (0.45, 0.4, 24), [0.0, -0.6, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("RobotForearmArticulatedLink", create_cylinder, (0.12, 1.0, 20), [0.0, 0.0, 0.0], [0.3827, 0, 0, 0.9239], [0.95, 0.80, 0.15, 1.0]),
        ("TwoJawPneumaticGripper", create_box, (0.3, 0.3, 0.2), [0.0, 0.6, 0.4], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("AutomatedGuidedVehicleAGVPlatform", create_box, (1.4, 0.25, 0.9), [0.0, -0.8, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(robot_comp, "frontend/models/industrial_robotics_fms.glb")

    # 9. Solar Thermal Flat Plate Collector 3D Model
    solar_comp = [
        ("GlazedFlatPlateCollectorCasing", create_box, (1.6, 0.18, 1.1), [0.0, 0.0, 0.0], [0.2588, 0, 0, 0.9659], [0.22, 0.28, 0.36, 1.0]),
        ("CopperSelectiveAbsorberSheet", create_box, (1.45, 0.04, 0.95), [0.0, 0.02, 0.0], [0.2588, 0, 0, 0.9659], [0.15, 0.25, 0.45, 1.0]),
        ("RiserTubeHeaderManifold", create_cylinder, (0.05, 1.4, 16), [0.0, 0.05, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.55, 0.25, 1.0]),
        ("InsulatedStorageCaloriTank", create_cylinder, (0.35, 1.0, 20), [0.0, 0.6, -0.5], [0, 0, 0.7071, 0.7071], [0.75, 0.80, 0.88, 1.0]),
    ]
    build_glb(solar_comp, "frontend/models/solar_thermal_flat_plate_collector.glb")

    # 10. Belt Conveyor & Material Handling 3D Model
    conveyor_comp = [
        ("ConveyorRubberBeltTrough", create_box, (2.0, 0.08, 0.7), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.18, 0.22, 0.28, 1.0]),
        ("MotorizedHeadDrivePulley", create_cylinder, (0.28, 0.8, 20), [1.0, 0.1, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("ThreeRollTroughingIdlerSet", create_cylinder, (0.1, 0.7, 16), [0.0, -0.1, 0.0], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("GravityTakeUpTensionWeight", create_box, (0.4, 0.6, 0.4), [-0.8, -0.4, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(conveyor_comp, "frontend/models/belt_conveyor_material_handling.glb")

    # 11. CPM / PERT Network Analysis 3D Model
    cpm_comp = [
        ("ProjectGanttChartBoard", create_box, (1.6, 1.0, 0.1), [0.0, 0.2, 0.0], [0, 0, 0, 1], [0.15, 0.25, 0.35, 1.0]),
        ("PERTActivityNodeNetwork", create_cylinder, (0.15, 0.08, 16), [-0.4, 0.2, 0.08], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("CriticalPathMilestoneMarker", create_box, (0.25, 0.25, 0.12), [0.3, 0.2, 0.08], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("PlanningDigitalWorkstation", create_box, (1.4, 0.4, 0.8), [0.0, -0.5, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(cpm_comp, "frontend/models/cpm_pert_network_analysis.glb")

    # 12. Inventory Control & EOQ 3D Model
    eoq_comp = [
        ("WarehouseStorageRackFrame", create_box, (1.4, 1.4, 0.6), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("PalletizedStockGoodsBox", create_box, (0.45, 0.35, 0.45), [-0.3, -0.2, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("BarcodeInventoryScanner", create_cylinder, (0.08, 0.3, 16), [0.4, 0.3, 0.1], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("DispatchDigitalTerminal", create_box, (0.5, 0.6, 0.15), [0.0, 0.8, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(eoq_comp, "frontend/models/inventory_control_eoq.glb")


if __name__ == "__main__":
    generate_all()
