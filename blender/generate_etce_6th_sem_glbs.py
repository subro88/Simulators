"""
Binary glTF (.glb) Generator for WBSCTE Electronics & Telecommunication Engineering 6th Semester Tools
======================================================================================================
Generates 12 3D assets for ETCE 6th Sem:
- frontend/models/optical_fiber_link_attenuation.glb
- frontend/models/satellite_link_budget_look_angles.glb
- frontend/models/cellular_frequency_reuse_handoff.glb
- frontend/models/lvdt_displacement_transducer.glb
- frontend/models/strain_gauge_wheatstone_bridge.glb
- frontend/models/rtd_thermocouple_pyrometer.glb
- frontend/models/second_order_system_transient_response.glb
- frontend/models/routh_hurwitz_stability_criterion.glb
- frontend/models/dielectric_induction_heating.glb
- frontend/models/plc_ladder_logic_simulator.glb
- frontend/models/ultrasonic_flaw_detector_ndt.glb
- frontend/models/ecg_biopotential_instrumentation.glb
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
        "asset": {"version": "2.0", "generator": "NHIT ETCE 6th Sem GLB Engine"},
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
    # 1. Optical Fiber Link Attenuation 3D Model
    ofc_comp = [
        ("FiberSpoolCoreCladding", create_cylinder, (0.45, 0.35, 24), [-0.25, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("LaserDiodeTransmitterSource", create_box, (0.4, 0.3, 0.25), [0.35, 0.15, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("OpticalPowerMeterReceiver", create_box, (0.4, 0.35, 0.25), [0.35, -0.2, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("STFiberConnectorCoupler", create_cylinder, (0.06, 0.2, 16), [0.0, 0.0, 0.3], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(ofc_comp, "frontend/models/optical_fiber_link_attenuation.glb")

    # 2. Satellite Link Budget & Look Angles 3D Model
    sat_comp = [
        ("SatelliteMainBusChassis", create_box, (0.6, 0.6, 0.6), [0.0, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("SolarPanelArrayWings", create_box, (1.8, 0.05, 0.45), [0.0, 0.2, 0.0], [0, 0, 0, 1], [0.15, 0.25, 0.55, 1.0]),
        ("EarthStationParabolicDish", create_cylinder, (0.55, 0.12, 24), [0.0, -0.3, 0.0], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("CassegrainSubreflectorFeed", create_cylinder, (0.1, 0.25, 16), [0.0, -0.3, 0.3], [0.7071, 0, 0, 0.7071], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(sat_comp, "frontend/models/satellite_link_budget_look_angles.glb")

    # 3. Cellular Frequency Reuse & Handoff 3D Model
    cell_comp = [
        ("BaseTransceiverStationMast", create_cylinder, (0.08, 1.4, 16), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("TriSectorPanelAntennaArray", create_box, (0.15, 0.4, 0.3), [-0.4, 0.55, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("MobileSwitchingCenterRack", create_box, (0.5, 0.8, 0.4), [0.35, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("CellularMobileHandsetUnit", create_box, (0.12, 0.25, 0.04), [0.0, -0.3, 0.25], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(cell_comp, "frontend/models/cellular_frequency_reuse_handoff.glb")

    # 4. LVDT Displacement Transducer 3D Model
    lvdt_comp = [
        ("LVDTStainlessHousingTube", create_cylinder, (0.22, 1.2, 24), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("NickelIronMagneticCoreRod", create_cylinder, (0.08, 0.6, 16), [0.1, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("DifferentialSecondaryCoilBobbin", create_cylinder, (0.28, 0.35, 20), [-0.25, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.55, 0.15, 1.0]),
        ("WiringTerminalHeaderBlock", create_box, (0.3, 0.25, 0.25), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
    ]
    build_glb(lvdt_comp, "frontend/models/lvdt_displacement_transducer.glb")

    # 5. Strain Gauge & Wheatstone Bridge 3D Model
    sg_comp = [
        ("CantileverSteelBendingBeam", create_box, (1.5, 0.12, 0.35), [0.0, -0.15, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("ConstantanFoilStrainGaugeGrid", create_box, (0.35, 0.02, 0.15), [-0.3, -0.07, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("WheatstoneBridgeBalancePot", create_cylinder, (0.12, 0.15, 16), [0.35, 0.15, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("MicroStrainDigitalIndicator", create_box, (0.6, 0.35, 0.25), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(sg_comp, "frontend/models/strain_gauge_wheatstone_bridge.glb")

    # 6. RTD, Thermocouple & Pyrometer 3D Model
    rtd_comp = [
        ("Pt100RTDCeramicSheathProbe", create_cylinder, (0.06, 1.1, 16), [-0.35, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("TypeKThermocoupleJunctionBead", create_cylinder, (0.04, 0.9, 16), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("ThreeWireTransmitterHead", create_cylinder, (0.22, 0.25, 20), [-0.35, 0.55, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("DigitalTemperatureCalibratorUnit", create_box, (0.5, 0.4, 0.25), [0.4, 0.0, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(rtd_comp, "frontend/models/rtd_thermocouple_pyrometer.glb")

    # 7. Second-Order System Transient Response 3D Model
    sys2_comp = [
        ("DCServoMotorTachogenerator", create_cylinder, (0.25, 0.55, 20), [-0.35, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("RotaryInertiaFlywheelDisk", create_cylinder, (0.45, 0.1, 24), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("EddyCurrentDampingBrake", create_box, (0.35, 0.4, 0.2), [0.35, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("AngularPositionPotentiometer", create_cylinder, (0.1, 0.15, 16), [0.55, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(sys2_comp, "frontend/models/second_order_system_transient_response.glb")

    # 8. Routh-Hurwitz Stability Criterion 3D Model
    routh_comp = [
        ("FeedbackControlSystemChassis", create_box, (1.4, 0.7, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("SummingJunctionOpAmpNode", create_cylinder, (0.15, 0.12, 16), [-0.35, 0.1, 0.42], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("RouthArrayParameterKnobs", create_cylinder, (0.08, 0.1, 16), [0.3, 0.15, 0.42], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("StabilityPhaseMarginDisplay", create_box, (0.6, 0.4, 0.05), [0.0, -0.15, 0.42], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(routh_comp, "frontend/models/routh_hurwitz_stability_criterion.glb")

    # 9. Dielectric & Induction Heating 3D Model
    heat_comp = [
        ("RFPowerGeneratorCabinet", create_box, (0.7, 1.0, 0.6), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("WaterCooledInductionWorkCoil", create_cylinder, (0.28, 0.4, 24), [0.35, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("DielectricParallelPlatesFixture", create_box, (0.45, 0.05, 0.35), [0.35, -0.3, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("SolidSteelWorkpieceBillet", create_cylinder, (0.14, 0.3, 20), [0.35, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(heat_comp, "frontend/models/dielectric_induction_heating.glb")

    # 10. PLC Ladder Logic Simulator 3D Model
    plc_comp = [
        ("IndustrialPLCRackMainframe", create_box, (1.3, 0.7, 0.45), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("DigitalInputOptoisolatorModule", create_box, (0.25, 0.55, 0.2), [-0.35, 0.0, 0.15], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("RelayOutputTerminalStrip", create_box, (0.25, 0.55, 0.2), [0.35, 0.0, 0.15], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("LadderLogicProgrammingPort", create_cylinder, (0.06, 0.15, 16), [0.0, -0.2, 0.25], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(plc_comp, "frontend/models/plc_ladder_logic_simulator.glb")

    # 11. Ultrasonic Flaw Detector NDT 3D Model
    ndt_comp = [
        ("FlawDetectorMainChassis", create_box, (1.2, 0.8, 0.6), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("AScanCRTGraticuleScreen", create_box, (0.65, 0.45, 0.05), [-0.2, 0.08, 0.32], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("PiezoelectricSearchProbe", create_cylinder, (0.09, 0.25, 16), [0.38, -0.15, 0.32], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("CalibrationStandardTestBlockV1", create_box, (0.4, 0.2, 0.25), [0.35, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(ndt_comp, "frontend/models/ultrasonic_flaw_detector_ndt.glb")

    # 12. ECG Biopotential Instrumentation 3D Model
    ecg_comp = [
        ("ECGPatientMonitorEnclosure", create_box, (1.3, 0.75, 0.5), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("EinthovenLeadElectrodeCables", create_box, (0.35, 0.1, 0.2), [-0.4, -0.25, 0.25], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("InstrumentationAmplifierModule", create_box, (0.4, 0.3, 0.15), [0.35, -0.15, 0.2], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("ThermalStripChartRecorder", create_box, (0.6, 0.35, 0.05), [-0.1, 0.12, 0.27], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(ecg_comp, "frontend/models/ecg_biopotential_instrumentation.glb")


if __name__ == "__main__":
    generate_all()
