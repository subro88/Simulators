"""
Binary glTF (.glb) Generator for WBSCTE Basic Science (BS) 2nd Semester Tools (Common for All Branches)
=======================================================================================================
Generates 16 3D assets for BS 2nd Sem:
- frontend/models/snells_law_refraction_glass_slab.glb
- frontend/models/convex_lens_focal_length_uv.glb
- frontend/models/galvanometer_half_deflection_resistance.glb
- frontend/models/galvanometer_ammeter_voltmeter_conversion.glb
- frontend/models/photoelectric_effect_inverse_square_law.glb
- frontend/models/pn_junction_diode_knee_voltage.glb
- frontend/models/parallel_plate_capacitor_permittivity.glb
- frontend/models/cantilever_vibration_frequency_period.glb
- frontend/models/single_purchase_crab_winch.glb
- frontend/models/double_purchase_crab_winch.glb
- frontend/models/worm_and_worm_wheel_machine.glb
- frontend/models/differential_axle_and_wheel.glb
- frontend/models/lamis_theorem_coplanar_forces.glb
- frontend/models/jib_crane_tie_jib_forces.glb
- frontend/models/cramers_rule_matrix_inversion_system.glb
- frontend/models/number_system_base_conversions.glb
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
                "metallicFactor": 0.4,
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
        "asset": {"version": "2.0", "generator": "NHIT Basic Science 2nd Sem GLB Engine"},
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
    # 1. Snell's Law Refraction Glass Slab 3D Model
    snell_parts = [
        ("RectangularOpticalGlassSlab", create_box, (0.8, 0.2, 0.5), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.6]),
        ("LaserLightRayIncidentBeam", create_cylinder, (0.015, 1.0, 16), [-0.35, 0.35, 0.0], [0, 0, 0.3827, 0.9239], [0.95, 0.20, 0.15, 1.0]),
        ("RefractedInternalLightRay", create_cylinder, (0.015, 0.25, 16), [0.0, 0.0, 0.0], [0, 0, 0.1736, 0.9848], [0.95, 0.80, 0.15, 1.0]),
        ("EmergentParallelBeamWithShift", create_cylinder, (0.015, 1.0, 16), [0.35, -0.35, 0.0], [0, 0, 0.3827, 0.9239], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(snell_parts, "frontend/models/snells_law_refraction_glass_slab.glb")

    # 2. Convex Lens Focal Length u-v Method 3D Model
    lens_parts = [
        ("PrecisionOpticalBenchRail", create_box, (1.8, 0.08, 0.15), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("DoubleConvexGlassLensInHolder", create_cylinder, (0.18, 0.04, 24), [0.0, 0.1, 0.0], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 0.7]),
        ("IlluminatedObjectPinUpright", create_cylinder, (0.02, 0.4, 16), [-0.6, 0.05, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("RealImageScreenReceiverUpright", create_box, (0.25, 0.35, 0.02), [0.6, 0.1, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
    ]
    build_glb(lens_parts, "frontend/models/convex_lens_focal_length_uv.glb")

    # 3. Galvanometer Half-Deflection Resistance 3D Model
    galv_parts = [
        ("MovingCoilGalvanometerHousing", create_cylinder, (0.35, 0.25, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("HighResistanceDecadeBoxR", create_box, (0.4, 0.18, 0.25), [-0.5, -0.1, 0.0], [0, 0, 0, 1], [0.47, 0.55, 0.65, 1.0]),
        ("ShuntResistanceDecadeBoxS", create_box, (0.3, 0.15, 0.2), [0.5, -0.1, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("TwoWayTappingKeySwitchK2", create_box, (0.15, 0.08, 0.15), [0.2, 0.15, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(galv_parts, "frontend/models/galvanometer_half_deflection_resistance.glb")

    # 4. Galvanometer to Ammeter & Voltmeter Conversion 3D Model
    conv_parts = [
        ("WestonTypeGalvanometerDial", create_cylinder, (0.3, 0.2, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("LowResistanceParallelShuntWire", create_cylinder, (0.01, 0.35, 12), [0.3, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.50, 0.15, 1.0]),
        ("HighResistanceSeriesMultiplierR", create_box, (0.35, 0.12, 0.12), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("CalibratedTwinBindingPosts", create_cylinder, (0.03, 0.1, 12), [0.0, 0.18, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(conv_parts, "frontend/models/galvanometer_ammeter_voltmeter_conversion.glb")

    # 5. Photoelectric Effect Inverse Square Law 3D Model
    pe_parts = [
        ("EvacuatedPhotocellTubeHousing", create_cylinder, (0.18, 0.45, 20), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.6]),
        ("CesiumCoatedPhotocathodePlate", create_cylinder, (0.12, 0.3, 16), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("VariableDistanceLightSourceLamp", create_cylinder, (0.12, 0.25, 16), [-0.7, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.40, 0.15, 1.0]),
        ("MicroammeterPhotoCurrentDisplay", create_box, (0.3, 0.2, 0.15), [0.5, -0.1, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(pe_parts, "frontend/models/photoelectric_effect_inverse_square_law.glb")

    # 6. P-N Junction Diode Knee Voltage 3D Model
    pn_parts = [
        ("SemiconductorDiodeGlassBody", create_cylinder, (0.06, 0.25, 16), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("SilverCathodeBandIndicator", create_cylinder, (0.062, 0.05, 16), [0.08, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.75, 0.78, 0.82, 1.0]),
        ("ForwardBiasingVariableDCPower", create_box, (0.4, 0.2, 0.2), [-0.4, 0.1, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("DualChannelVoltAmmeterTrainer", create_box, (0.4, 0.2, 0.2), [0.4, 0.1, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(pn_parts, "frontend/models/pn_junction_diode_knee_voltage.glb")

    # 7. Parallel Plate Capacitor Permittivity 3D Model
    cap_parts = [
        ("CircularBrassParallelPlates", create_cylinder, (0.35, 0.02, 24), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("AdjustableAirGapMicrometerHead", create_cylinder, (0.04, 0.35, 16), [0.0, 0.0, -0.25], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("DielectricMaterialSheetInsert", create_box, (0.6, 0.6, 0.03), [0.0, 0.0, 0.05], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.7]),
        ("InsulatingBakeliteSupportPillars", create_cylinder, (0.03, 0.5, 12), [0.35, -0.25, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(cap_parts, "frontend/models/parallel_plate_capacitor_permittivity.glb")

    # 8. Cantilever Vibration Frequency & Period 3D Model
    cant_parts = [
        ("RigidGClampBenchMountBase", create_box, (0.25, 0.35, 0.25), [-0.6, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("UniformFlexibleSteelCantileverBlade", create_box, (1.2, 0.015, 0.08), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("DeadWeightLoadingPanAtFreeEnd", create_cylinder, (0.06, 0.12, 16), [0.55, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("OpticalVibrationSensorGate", create_box, (0.1, 0.25, 0.15), [0.55, 0.15, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(cant_parts, "frontend/models/cantilever_vibration_frequency_period.glb")

    # 9. Single Purchase Crab Winch 3D Model
    spw_parts = [
        ("CastIronSupportingSideFrames", create_box, (0.1, 0.6, 0.5), [-0.35, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("EffortWheelHandleOperatingSpurPinion", create_cylinder, (0.08, 0.12, 16), [-0.15, 0.15, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("LargeMainSpurGearWheelT2", create_cylinder, (0.35, 0.08, 24), [0.15, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("LoadDrumWindingRopeAndWeight", create_cylinder, (0.1, 0.35, 16), [0.15, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.75, 0.78, 0.82, 1.0]),
    ]
    build_glb(spw_parts, "frontend/models/single_purchase_crab_winch.glb")

    # 10. Double Purchase Crab Winch 3D Model
    dpw_parts = [
        ("HeavyDutyTwinGantrySideFrames", create_box, (0.1, 0.7, 0.6), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("FirstReductionPinionAndSpurWheel", create_cylinder, (0.22, 0.06, 20), [-0.1, 0.2, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("SecondReductionMainGearWheelT4", create_cylinder, (0.38, 0.08, 24), [0.2, -0.05, 0.0], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("HeavyLoadDrumWithSteelWireRope", create_cylinder, (0.12, 0.4, 16), [0.2, -0.05, 0.0], [0.7071, 0, 0, 0.7071], [0.75, 0.78, 0.82, 1.0]),
    ]
    build_glb(dpw_parts, "frontend/models/double_purchase_crab_winch.glb")

    # 11. Worm and Worm Wheel Machine 3D Model
    wrm_parts = [
        ("SteelWormScrewSingleStartThread", create_cylinder, (0.06, 0.5, 20), [0.0, -0.15, 0.0], [0, 0, 0.7071, 0.7071], [0.75, 0.78, 0.82, 1.0]),
        ("BronzeHelicalWormWheelGearT", create_cylinder, (0.3, 0.06, 24), [0.0, 0.15, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("EffortPulleyWheelDiameter2R", create_cylinder, (0.25, 0.04, 20), [-0.25, -0.15, 0.0], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("LoadWindingDrumShaftAssembly", create_cylinder, (0.08, 0.25, 16), [0.0, 0.15, 0.0], [0.7071, 0, 0, 0.7071], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(wrm_parts, "frontend/models/worm_and_worm_wheel_machine.glb")

    # 12. Differential Axle and Wheel 3D Model
    dif_parts = [
        ("EffortWheelLargeDiameterD", create_cylinder, (0.4, 0.05, 24), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("LargerDifferentialAxleDiameterD1", create_cylinder, (0.15, 0.18, 20), [0.0, 0.0, 0.15], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("SmallerDifferentialAxleDiameterD2", create_cylinder, (0.1, 0.18, 16), [0.0, 0.0, 0.35], [0.7071, 0, 0, 0.7071], [0.95, 0.40, 0.15, 1.0]),
        ("SuspendedSnatchBlockPulleyWithLoad", create_cylinder, (0.08, 0.04, 16), [0.0, -0.4, 0.25], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(dif_parts, "frontend/models/differential_axle_and_wheel.glb")

    # 13. Lami's Theorem Coplanar Forces 3D Model
    lam_parts = [
        ("VerticalDrawingBoardApparatus", create_box, (1.2, 0.9, 0.04), [0.0, 0.0, -0.05], [0, 0, 0, 1], [0.72, 0.45, 0.20, 1.0]),
        ("CentralEquilibriumKnotNode", create_cylinder, (0.03, 0.02, 16), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
        ("SuspendedWeightPansAndPulleys", create_cylinder, (0.05, 0.1, 12), [-0.4, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("ForceVectorsPolygonGraphSheet", create_box, (0.6, 0.5, 0.01), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.95, 0.95, 1.0]),
    ]
    build_glb(lam_parts, "frontend/models/lamis_theorem_coplanar_forces.glb")

    # 14. Jib Crane Tie & Jib Member Forces 3D Model
    jib_parts = [
        ("VerticalPostSupportColumn", create_box, (0.08, 1.2, 0.08), [-0.5, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("InclinedCompressionJibBoom", create_box, (1.1, 0.06, 0.06), [0.0, -0.15, 0.0], [0, 0, 0.2588, 0.9659], [0.95, 0.80, 0.15, 1.0]),
        ("TensionTieRodChainWithSpringBalance", create_cylinder, (0.015, 1.0, 12), [0.0, 0.3, 0.0], [0, 0, -0.2588, 0.9659], [0.95, 0.20, 0.15, 1.0]),
        ("SuspendedHookWeightW", create_cylinder, (0.06, 0.15, 16), [0.5, -0.3, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(jib_parts, "frontend/models/jib_crane_tie_jib_forces.glb")

    # 15. Cramer's Rule Matrix Inversion System 3D Model
    cram_parts = [
        ("MatrixDeterminantGridCube3x3", create_box, (0.8, 0.8, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.28, 1.0]),
        ("CoefficientMatrixSubSpaceVectors", create_cylinder, (0.02, 0.9, 16), [0.0, 0.0, 0.0], [0.5, 0.5, 0.5, 0.5], [0.38, 0.74, 0.97, 1.0]),
        ("RightHandConstantsVectorB", create_cylinder, (0.03, 0.7, 16), [0.5, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("UniqueSolutionIntersectionPoint", create_cylinder, (0.06, 0.06, 16), [0.2, 0.2, 0.2], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(cram_parts, "frontend/models/cramers_rule_matrix_inversion_system.glb")

    # 16. Number System Base Conversions 3D Model
    num_parts = [
        ("DigitalRegisterBitCellMatrix", create_box, (1.2, 0.4, 0.2), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.28, 1.0]),
        ("BinaryOctalDecimalHexDecoders", create_cylinder, (0.06, 0.2, 16), [-0.4, 0.0, 0.15], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
        ("SevenSegmentHexadecimalLEDDisplay", create_box, (0.3, 0.45, 0.05), [0.35, 0.0, 0.15], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("BCDGrayCodeParityLogicBoard", create_box, (1.0, 0.02, 0.6), [0.0, -0.25, 0.0], [0, 0, 0, 1], [0.02, 0.52, 0.78, 1.0]),
    ]
    build_glb(num_parts, "frontend/models/number_system_base_conversions.glb")


if __name__ == "__main__":
    generate_all()
