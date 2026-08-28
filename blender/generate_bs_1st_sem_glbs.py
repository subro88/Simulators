"""
Binary glTF (.glb) Generator for WBSCTE Basic Science (BS) 1st Semester Tools (Common for All Branches)
=======================================================================================================
Generates 16 3D assets for BS 1st Sem:
- frontend/models/vernier_caliper_volume_measurement.glb
- frontend/models/micrometer_screw_gauge_measurement.glb
- frontend/models/spherometer_radius_curvature.glb
- frontend/models/friction_inclined_plane_coefficient.glb
- frontend/models/flywheel_moment_of_inertia.glb
- frontend/models/stokes_law_viscosity_terminal_velocity.glb
- frontend/models/thermal_linear_expansion_coefficient.glb
- frontend/models/boyles_law_isothermal_gas.glb
- frontend/models/acid_base_titration_neutralization.glb
- frontend/models/water_hardness_edta_titration.glb
- frontend/models/daniel_cell_electrochemical_emf.glb
- frontend/models/faraday_electrolysis_copper_sulfate.glb
- frontend/models/redwood_viscometer_oil_viscosity.glb
- frontend/models/flash_fire_point_abel_apparatus.glb
- frontend/models/complex_numbers_argand_polar.glb
- frontend/models/vector_algebra_dot_cross_products.glb
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
                "metallicFactor": 0.5,
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
        "asset": {"version": "2.0", "generator": "NHIT Basic Science 1st Sem GLB Engine"},
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
    # 1. Vernier Caliper Volume Measurement 3D Model
    vc_parts = [
        ("StainlessSteelMainScaleBeam", create_box, (1.6, 0.08, 0.04), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("FixedExternalMeasuringJaw", create_box, (0.08, 0.4, 0.04), [-0.76, -0.16, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("SlidingVernierScaleSlider", create_box, (0.35, 0.12, 0.06), [-0.2, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("TestHollowCylinderSpecimen", create_cylinder, (0.08, 0.25, 20), [-0.55, -0.16, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(vc_parts, "frontend/models/vernier_caliper_volume_measurement.glb")

    # 2. Micrometer Screw Gauge Measurement 3D Model
    sg_parts = [
        ("CastSteelUCurvedFrame", create_cylinder, (0.35, 0.06, 24), [0.0, -0.15, 0.0], [0, 0, 0.7071, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("GraduatedMainScaleSleeve", create_cylinder, (0.07, 0.5, 20), [0.35, 0.05, 0.0], [0, 0, 0.7071, 0.7071], [0.75, 0.78, 0.82, 1.0]),
        ("RotatingCircularScaleThimble", create_cylinder, (0.08, 0.4, 20), [0.55, 0.05, 0.0], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("ThinResistanceWireSpecimen", create_cylinder, (0.008, 0.2, 12), [-0.15, 0.05, 0.0], [0, 0, 0, 1], [0.95, 0.40, 0.15, 1.0]),
    ]
    build_glb(sg_parts, "frontend/models/micrometer_screw_gauge_measurement.glb")

    # 3. Spherometer Radius of Curvature 3D Model
    sph_parts = [
        ("TriangularTripodLegsBase", create_box, (0.5, 0.04, 0.5), [0.0, -0.1, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("CentralMicrometerScrewSpindle", create_cylinder, (0.03, 0.4, 16), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("CircularGraduatedDialDisc", create_cylinder, (0.22, 0.02, 24), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("ConvexSphericalMirrorSurface", create_cylinder, (0.35, 0.04, 24), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(sph_parts, "frontend/models/spherometer_radius_curvature.glb")

    # 4. Friction on Inclined Plane 3D Model
    fric_parts = [
        ("AdjustableInclinedGlassPlane", create_box, (1.4, 0.04, 0.4), [0.0, 0.0, 0.0], [0, 0, 0.1736, 0.9848], [0.38, 0.74, 0.97, 1.0]),
        ("SlidingWoodenFrictionBlock", create_box, (0.2, 0.1, 0.15), [-0.1, 0.12, 0.0], [0, 0, 0.1736, 0.9848], [0.72, 0.45, 0.20, 1.0]),
        ("HeavyCastIronBaseFrame", create_box, (1.5, 0.06, 0.5), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("GraduatedProtractorScaleArc", create_cylinder, (0.2, 0.01, 16), [-0.65, -0.2, 0.2], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(fric_parts, "frontend/models/friction_inclined_plane_coefficient.glb")

    # 5. Flywheel Moment of Inertia 3D Model
    fly_parts = [
        ("HeavyCastIronFlywheelDisc", create_cylinder, (0.5, 0.08, 24), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("AxleShaftMountedOnBallBearings", create_cylinder, (0.05, 0.6, 16), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.75, 0.78, 0.82, 1.0]),
        ("SuspendedCordHangingMassPan", create_cylinder, (0.04, 0.1, 12), [0.4, -0.5, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("WallMountingBracketsAssembly", create_box, (0.2, 0.8, 0.2), [-0.3, 0.0, -0.2], [0, 0, 0, 1], [0.47, 0.55, 0.65, 1.0]),
    ]
    build_glb(fly_parts, "frontend/models/flywheel_moment_of_inertia.glb")

    # 6. Stokes' Law Viscosity Terminal Velocity 3D Model
    stk_parts = [
        ("TallTransparentGlassViscosityJar", create_cylinder, (0.1, 1.6, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.5]),
        ("ViscousGlycerinLiquidColumn", create_cylinder, (0.09, 1.45, 20), [0.0, -0.05, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 0.8]),
        ("FallingSteelBearingBallSphere", create_cylinder, (0.02, 0.02, 12), [0.0, 0.2, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("PhotocellReferenceTimingMarks", create_box, (0.25, 0.02, 0.02), [0.0, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(stk_parts, "frontend/models/stokes_law_viscosity_terminal_velocity.glb")

    # 7. Thermal Linear Expansion Coefficient 3D Model
    the_parts = [
        ("PullingersApparatusSteamJacket", create_cylinder, (0.06, 1.4, 20), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.75, 0.78, 0.82, 1.0]),
        ("MetalRodSpecimenCore", create_cylinder, (0.015, 1.35, 16), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.50, 0.15, 1.0]),
        ("SpherometerExpansionMicrometerHead", create_cylinder, (0.08, 0.15, 16), [0.7, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("SteamInletBoilerConnectionPipe", create_cylinder, (0.02, 0.25, 12), [-0.4, 0.15, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(the_parts, "frontend/models/thermal_linear_expansion_coefficient.glb")

    # 8. Boyle's Law Isothermal Gas Apparatus 3D Model
    boy_parts = [
        ("GraduatedGlassBoyleTubeColumn", create_cylinder, (0.04, 1.4, 20), [-0.15, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.6]),
        ("MercuryReservoirFlexibleManometer", create_cylinder, (0.04, 1.4, 20), [0.15, 0.2, 0.0], [0, 0, 0, 1], [0.65, 0.68, 0.72, 1.0]),
        ("HeavyCastIronUprightStandScale", create_box, (0.5, 1.6, 0.08), [0.0, 0.0, -0.06], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("TrappedAirIsothermalVolumeChamber", create_cylinder, (0.035, 0.4, 16), [-0.15, 0.45, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 0.8]),
    ]
    build_glb(boy_parts, "frontend/models/boyles_law_isothermal_gas.glb")

    # 9. Acid-Base Neutralization Titration 3D Model
    tit_parts = [
        ("Graduated50mlGlassBurette", create_cylinder, (0.025, 1.2, 16), [0.0, 0.3, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.5]),
        ("ConicalFlaskTitrationVessel", create_cylinder, (0.12, 0.25, 20), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.95, 0.40, 0.65, 0.8]),
        ("RetortStandWithBuretteClamp", create_box, (0.3, 0.04, 0.3), [0.15, -0.55, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("StopcockFluidControlValve", create_box, (0.04, 0.04, 0.08), [0.0, -0.22, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(tit_parts, "frontend/models/acid_base_titration_neutralization.glb")

    # 10. Water Hardness EDTA Complexometric Titration 3D Model
    edt_parts = [
        ("EDTASolutionFilledBurette", create_cylinder, (0.025, 1.2, 16), [0.0, 0.3, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.5]),
        ("EriochromeBlackTIndicatorFlask", create_cylinder, (0.12, 0.25, 20), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.85, 0.8]),
        ("HeavyLaboratoryRetortBase", create_box, (0.35, 0.04, 0.35), [0.15, -0.55, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("BufferSolutionPh10Dispenser", create_cylinder, (0.04, 0.15, 12), [-0.25, -0.45, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(edt_parts, "frontend/models/water_hardness_edta_titration.glb")

    # 11. Daniel Cell Electrochemical EMF 3D Model
    dan_parts = [
        ("PorousPotZincElectrodeHalfCell", create_cylinder, (0.12, 0.35, 20), [-0.2, 0.0, 0.0], [0, 0, 0, 1], [0.65, 0.68, 0.72, 1.0]),
        ("OuterGlassVesselCopperSulfate", create_cylinder, (0.18, 0.4, 20), [0.2, 0.0, 0.0], [0, 0, 0, 1], [0.02, 0.52, 0.78, 0.7]),
        ("ZincAndCopperElectrodePlates", create_box, (0.03, 0.45, 0.06), [0.2, 0.05, 0.0], [0, 0, 0, 1], [0.95, 0.50, 0.15, 1.0]),
        ("DigitalMillivoltmeterEMFReadout", create_box, (0.3, 0.15, 0.15), [0.0, 0.3, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(dan_parts, "frontend/models/daniel_cell_electrochemical_emf.glb")

    # 12. Faraday's Electrolysis Copper Sulfate 3D Model
    far_parts = [
        ("ElectrolyticCopperVoltameterBath", create_box, (0.6, 0.4, 0.4), [0.0, -0.1, 0.0], [0, 0, 0, 1], [0.02, 0.52, 0.78, 0.7]),
        ("PureCopperCathodeDepositionPlate", create_box, (0.02, 0.35, 0.2), [-0.15, -0.05, 0.0], [0, 0, 0, 1], [0.95, 0.50, 0.15, 1.0]),
        ("CopperAnodeElectrodePlate", create_box, (0.02, 0.35, 0.2), [0.15, -0.05, 0.0], [0, 0, 0, 1], [0.95, 0.50, 0.15, 1.0]),
        ("RegulatedDCPowerSupplyAmmeter", create_box, (0.35, 0.2, 0.2), [0.0, 0.28, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(far_parts, "frontend/models/faraday_electrolysis_copper_sulfate.glb")

    # 13. Redwood Viscometer Oil Viscosity 3D Model
    red_parts = [
        ("BrassOilCupWithAgateJetNozzle", create_cylinder, (0.12, 0.35, 24), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("ThermostaticWaterBathJacket", create_cylinder, (0.25, 0.45, 24), [0.0, 0.05, 0.0], [0, 0, 0, 1], [0.75, 0.78, 0.82, 1.0]),
        ("Standard50mlKohlrauschReceivingFlask", create_cylinder, (0.08, 0.2, 16), [0.0, -0.35, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 0.6]),
        ("SpiralWaterBathStirrerThermometer", create_cylinder, (0.015, 0.5, 12), [0.18, 0.2, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(red_parts, "frontend/models/redwood_viscometer_oil_viscosity.glb")

    # 14. Abel's Flash & Fire Point Apparatus 3D Model
    abl_parts = [
        ("AbelsClosedBrassOilCup", create_cylinder, (0.12, 0.3, 24), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("AirChamberAndWaterBathHeater", create_cylinder, (0.22, 0.4, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("SlidingShutterTestFlamePilotBurner", create_box, (0.06, 0.03, 0.06), [0.0, 0.28, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("PrecisionMercuryThermometerStem", create_cylinder, (0.01, 0.45, 12), [-0.05, 0.3, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(abl_parts, "frontend/models/flash_fire_point_abel_apparatus.glb")

    # 15. Complex Numbers Argand Polar 3D Model
    cpx_parts = [
        ("ArgandCartesianCoordinatePlane", create_box, (1.2, 0.02, 1.2), [0.0, -0.05, 0.0], [0, 0, 0, 1], [0.15, 0.20, 0.28, 1.0]),
        ("ComplexPhasorVectorModulusR", create_cylinder, (0.02, 0.8, 16), [0.25, 0.15, -0.25], [0.5, 0.5, -0.5, 0.5], [0.38, 0.74, 0.97, 1.0]),
        ("RealAndImaginaryProjectionArms", create_box, (0.6, 0.01, 0.6), [0.2, 0.0, -0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("DeMoivresRotationUnitCircleHelix", create_cylinder, (0.45, 0.01, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(cpx_parts, "frontend/models/complex_numbers_argand_polar.glb")

    # 16. Vector Algebra Dot & Cross Products 3D Model
    vec_parts = [
        ("PrimaryVectorAArrowShaft", create_cylinder, (0.025, 1.0, 16), [-0.2, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("SecondaryVectorBArrowShaft", create_cylinder, (0.025, 1.0, 16), [0.0, 0.2, -0.3], [0.3827, 0, 0, 0.9239], [0.95, 0.80, 0.15, 1.0]),
        ("CrossProductTorqueNormalVectorC", create_cylinder, (0.03, 1.2, 16), [0.0, 0.4, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("CoordinateOriginIntersectionNode", create_cylinder, (0.06, 0.06, 16), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(vec_parts, "frontend/models/vector_algebra_dot_cross_products.glb")


if __name__ == "__main__":
    generate_all()
