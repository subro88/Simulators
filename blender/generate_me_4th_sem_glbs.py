"""
Binary glTF (.glb) Generator for WBSCTE Mechanical Engineering 4th Semester Tools
=================================================================================
Generates 12 3D assets for ME 4th Sem:
- frontend/models/reciprocating_air_compressor.glb
- frontend/models/gas_turbine_brayton.glb
- frontend/models/shaper_slotter_machine.glb
- frontend/models/grinding_wheel_abrasives.glb
- frontend/models/unconventional_machining_edm.glb
- frontend/models/transducers_instrumentation.glb
- frontend/models/sine_bar_slip_gauges.glb
- frontend/models/comparators_surface_roughness.glb
- frontend/models/sqc_control_charts.glb
- frontend/models/epicyclic_gear_trains.glb
- frontend/models/governor_mechanisms.glb
- frontend/models/balancing_rotating_masses.glb
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
        "asset": {"version": "2.0", "generator": "NHIT ME 4th Sem GLB Engine"},
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
    # 1. Reciprocating Air Compressor 3D Model
    comp_components = [
        ("AirReceiverStorageTank", create_cylinder, (0.5, 1.8, 24), [0.0, -0.4, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.45, 0.65, 1.0]),
        ("CompressorCylinderCasting", create_cylinder, (0.35, 0.8, 20), [-0.4, 0.6, 0.0], [0, 0, 0, 1], [0.25, 0.30, 0.38, 1.0]),
        ("IntercoolerCoolingCoil", create_cylinder, (0.1, 0.9, 16), [0.3, 0.6, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.75, 0.15, 1.0]),
        ("ElectricDriveMotorHead", create_cylinder, (0.3, 0.6, 20), [0.8, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.15, 0.65, 0.45, 1.0]),
    ]
    build_glb(comp_components, "frontend/models/reciprocating_air_compressor.glb")

    # 2. Gas Turbine & Brayton Cycle 3D Model
    turbine_components = [
        ("AxialCompressorRotor", create_cylinder, (0.45, 1.0, 24), [-0.7, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.75, 0.80, 0.88, 1.0]),
        ("AnnularCombustionChamber", create_cylinder, (0.55, 0.6, 24), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("HighPressureTurbineRotor", create_cylinder, (0.48, 0.7, 24), [0.7, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("JetPropulsionExhaustNozzle", create_cylinder, (0.35, 0.6, 20), [1.3, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.20, 0.25, 0.32, 1.0]),
    ]
    build_glb(turbine_components, "frontend/models/gas_turbine_brayton.glb")

    # 3. Shaper & Slotter Machine 3D Model
    shaper_components = [
        ("ShaperColumnMainBase", create_box, (1.2, 1.4, 0.9), [-0.3, -0.1, 0.0], [0, 0, 0, 1], [0.20, 0.25, 0.32, 1.0]),
        ("ReciprocatingToolRam", create_box, (1.4, 0.25, 0.35), [-0.1, 0.65, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("ShaperCrossfeedWorktable", create_box, (0.7, 0.5, 0.6), [0.5, -0.1, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("QuickReturnBullGearDrive", create_cylinder, (0.45, 0.15, 24), [-0.3, 0.0, 0.5], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(shaper_components, "frontend/models/shaper_slotter_machine.glb")

    # 4. Grinding Wheel & Abrasives 3D Model
    grind_components = [
        ("GrindingWheelHeadSpindle", create_cylinder, (0.45, 0.2, 24), [0.0, 0.4, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("VitrifiedAbrasiveWheelDisk", create_cylinder, (0.6, 0.12, 32), [0.0, 0.4, 0.12], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("MagneticChuckSurfaceTable", create_box, (1.4, 0.3, 0.8), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("DiamondWheelDressingTool", create_cylinder, (0.04, 0.6, 16), [0.4, 0.0, 0.2], [0, 0, 0, 1], [0.20, 0.65, 0.95, 1.0]),
    ]
    build_glb(grind_components, "frontend/models/grinding_wheel_abrasives.glb")

    # 5. Unconventional Machining (EDM) 3D Model
    edm_components = [
        ("EDMColumnMainChassis", create_box, (1.2, 1.6, 1.0), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.18, 0.22, 0.28, 1.0]),
        ("DielectricFluidWorkTank", create_box, (0.9, 0.6, 0.8), [0.3, -0.3, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("ServoElectrodeToolHolder", create_cylinder, (0.08, 0.7, 16), [0.3, 0.4, 0.0], [0, 0, 0, 1], [0.95, 0.75, 0.15, 1.0]),
        ("EDMPulsePowerSupplyUnit", create_box, (0.7, 0.9, 0.6), [-1.0, -0.2, 0.0], [0, 0, 0, 1], [0.25, 0.30, 0.38, 1.0]),
    ]
    build_glb(edm_components, "frontend/models/unconventional_machining_edm.glb")

    # 6. Industrial Sensors & Transducers 3D Model
    sensor_components = [
        ("CantileverStrainGaugeBeam", create_box, (1.4, 0.12, 0.3), [-0.2, 0.3, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.88, 1.0]),
        ("LVDTDisplacementCoreTube", create_cylinder, (0.15, 1.0, 20), [0.6, 0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("SBeamPrecisionLoadCell", create_box, (0.5, 0.6, 0.4), [-0.3, -0.4, 0.0], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("DigitalSensorIndicatorScope", create_box, (0.8, 0.5, 0.3), [0.6, -0.4, 0.0], [0, 0, 0, 1], [0.12, 0.16, 0.24, 1.0]),
    ]
    build_glb(sensor_components, "frontend/models/transducers_instrumentation.glb")

    # 7. Sine Bar & Slip Gauges 3D Model
    sine_components = [
        ("GraniteSurfacePlateDatum", create_box, (1.8, 0.3, 1.2), [0.0, -0.6, 0.0], [0, 0, 0, 1], [0.12, 0.16, 0.20, 1.0]),
        ("HardenedSteelSineBarBody", create_box, (1.2, 0.2, 0.25), [0.0, 0.1, 0.0], [0, 0, 0.1305, 0.9914], [0.85, 0.88, 0.92, 1.0]),
        ("SineBarCylindricalRoller", create_cylinder, (0.1, 0.3, 20), [-0.5, -0.05, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("WringedSlipGaugeBlockStack", create_box, (0.2, 0.55, 0.25), [0.55, -0.15, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(sine_components, "frontend/models/sine_bar_slip_gauges.glb")

    # 8. Comparators & Surface Roughness 3D Model
    comp_surf_components = [
        ("HeavyComparatorStandBase", create_box, (1.2, 0.3, 1.0), [-0.3, -0.6, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("PneumaticDialAirGaugeColumn", create_cylinder, (0.1, 1.2, 20), [-0.3, 0.1, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("StylusSurfaceRoughnessPickup", create_box, (0.6, 0.15, 0.15), [0.5, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("StandardSurfaceSpecimenBlock", create_box, (0.6, 0.2, 0.5), [0.5, -0.4, 0.0], [0, 0, 0, 1], [0.30, 0.65, 0.95, 1.0]),
    ]
    build_glb(comp_surf_components, "frontend/models/comparators_surface_roughness.glb")

    # 9. Statistical Quality Control (SQC) 3D Model
    sqc_components = [
        ("InspectionWorkstationTable", create_box, (1.6, 0.3, 1.2), [-0.2, -0.6, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.28, 1.0]),
        ("ControlChartAnalyticsDisplay", create_box, (1.1, 0.7, 0.08), [-0.2, 0.3, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("BatchSamplingInspectionTray", create_box, (0.6, 0.15, 0.5), [0.7, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("PrecisionGoNoGoPlugGauge", create_cylinder, (0.08, 0.6, 16), [0.7, 0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(sqc_components, "frontend/models/sqc_control_charts.glb")

    # 10. Epicyclic & Planetary Gear Trains 3D Model
    epi_components = [
        ("SunCentralSpurGear", create_cylinder, (0.28, 0.2, 24), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("PlanetarySatelliteGear1", create_cylinder, (0.22, 0.18, 20), [0.0, 0.5, 0.0], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("PlanetarySatelliteGear2", create_cylinder, (0.22, 0.18, 20), [0.0, -0.5, 0.0], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("PlanetCarrierRotatingArm", create_box, (0.15, 1.3, 0.12), [0.0, 0.0, 0.15], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(epi_components, "frontend/models/epicyclic_gear_trains.glb")

    # 11. Centrifugal Governor Mechanisms 3D Model
    gov_components = [
        ("VerticalGovernorSpindleShaft", create_cylinder, (0.08, 1.6, 20), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("RotatingFlyballMassLeft", create_cylinder, (0.22, 0.22, 20), [-0.55, 0.3, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.35, 0.15, 1.0]),
        ("RotatingFlyballMassRight", create_cylinder, (0.22, 0.22, 20), [0.55, 0.3, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.35, 0.15, 1.0]),
        ("SlidingCentralSleeveCollar", create_cylinder, (0.22, 0.3, 20), [0.0, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(gov_components, "frontend/models/governor_mechanisms.glb")

    # 12. Dynamic Balancing of Rotating Masses 3D Model
    balance_components = [
        ("BalancingMachineDriveShaft", create_cylinder, (0.08, 1.8, 20), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("RotatingMassPlaneDisc1", create_cylinder, (0.45, 0.1, 24), [-0.5, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("RotatingMassPlaneDisc2", create_cylinder, (0.45, 0.1, 24), [0.5, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("VibrationSensorPedestalStand", create_box, (0.3, 0.7, 0.4), [0.9, -0.4, 0.0], [0, 0, 0, 1], [0.20, 0.25, 0.32, 1.0]),
    ]
    build_glb(balance_components, "frontend/models/balancing_rotating_masses.glb")


if __name__ == "__main__":
    generate_all()
