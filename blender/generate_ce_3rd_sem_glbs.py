"""
Binary glTF (.glb) Generator for WBSCTE Civil Engineering 3rd Semester Tools
=============================================================================
Generates 12 3D assets for CE 3rd Sem:
- frontend/models/prismatic_compass_traverse_survey.glb
- frontend/models/dumpy_level_rise_fall_levelling.glb
- frontend/models/contour_interpolation_profile_levelling.glb
- frontend/models/trapezoidal_simpson_earthwork_volume.glb
- frontend/models/plane_table_radiation_intersection.glb
- frontend/models/vicat_cement_setting_soundness.glb
- frontend/models/brick_masonry_compressive_water_absorption.glb
- frontend/models/sand_bulking_moisture_content.glb
- frontend/models/concrete_mix_design_is10262.glb
- frontend/models/concrete_compacting_factor_veebee.glb
- frontend/models/split_tensile_flexural_concrete_strength.glb
- frontend/models/shear_force_bending_moment_diagrams.glb
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
        "asset": {"version": "2.0", "generator": "NHIT Civil 3rd Sem GLB Engine"},
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
    # 1. Prismatic Compass Traverse Survey 3D Model
    comp_parts = [
        ("PrismaticCompassCircularBox", create_cylinder, (0.45, 0.18, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("MagneticNeedleGraduatedRing", create_box, (0.7, 0.04, 0.06), [0.0, 0.1, 0.0], [0, 0.3827, 0, 0.9239], [0.95, 0.20, 0.15, 1.0]),
        ("SightingVaneWithHorsehair", create_box, (0.05, 0.5, 0.08), [-0.4, 0.25, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ReflectingPrismEyepiece", create_box, (0.12, 0.15, 0.12), [0.4, 0.15, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
    ]
    build_glb(comp_parts, "frontend/models/prismatic_compass_traverse_survey.glb")

    # 2. Dumpy Level Rise & Fall Levelling 3D Model
    dumpy_parts = [
        ("DumpyLevelTelescopeTube", create_cylinder, (0.08, 1.2, 20), [0.0, 0.15, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("TribrachLevelingFootscrews", create_cylinder, (0.35, 0.15, 24), [0.0, -0.15, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("LongitudinalSpiritBubbleTube", create_box, (0.35, 0.06, 0.06), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("LevellingStaffMetricBar", create_box, (0.1, 1.5, 0.06), [0.6, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(dumpy_parts, "frontend/models/dumpy_level_rise_fall_levelling.glb")

    # 3. Contour Interpolation & Profile Levelling 3D Model
    contour_parts = [
        ("TopographicTerrainContourBlock", create_box, (1.4, 0.4, 1.0), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.35, 0.55, 0.25, 1.0]),
        ("ElevationBenchmarkSurveyMarkers", create_cylinder, (0.06, 0.3, 16), [-0.4, 0.15, -0.2], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("ProfileSectionCuttingPlane", create_box, (1.3, 0.5, 0.02), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("ContourInterpolationGridFrame", create_box, (1.2, 0.02, 0.8), [0.0, 0.05, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(contour_parts, "frontend/models/contour_interpolation_profile_levelling.glb")

    # 4. Trapezoidal & Simpson Earthwork Volume 3D Model
    earth_parts = [
        ("RoadEmbankmentPrismoidCrossSection", create_box, (1.4, 0.5, 0.8), [0.0, -0.1, 0.0], [0, 0, 0, 1], [0.65, 0.45, 0.25, 1.0]),
        ("PolarPlanimeterIntegratingArm", create_box, (0.8, 0.04, 0.04), [-0.2, 0.25, 0.0], [0, 0.3827, 0, 0.9239], [0.85, 0.88, 0.92, 1.0]),
        ("MeasuringWheelRevolutionCounter", create_cylinder, (0.08, 0.06, 16), [0.3, 0.25, 0.0], [0, 0, 0.7071, 0.7071], [0.15, 0.45, 0.85, 1.0]),
        ("IrregularAreaBoundaryGrid", create_box, (1.2, 0.02, 0.7), [0.0, 0.15, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(earth_parts, "frontend/models/trapezoidal_simpson_earthwork_volume.glb")

    # 5. Plane Table Surveying 3D Model
    pt_parts = [
        ("WoodenPlaneTableBoard", create_box, (1.4, 0.08, 1.0), [0.0, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.65, 0.35, 1.0]),
        ("TelescopicSightAlidadeBlade", create_box, (0.8, 0.08, 0.08), [-0.1, 0.3, 0.0], [0, 0.2588, 0, 0.9659], [0.85, 0.75, 0.25, 1.0]),
        ("TroughCompassNeedleHousing", create_box, (0.5, 0.06, 0.12), [0.35, 0.28, 0.3], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("PlumbingForkWithPlumbBob", create_cylinder, (0.04, 0.5, 16), [0.0, -0.2, 0.45], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(pt_parts, "frontend/models/plane_table_radiation_intersection.glb")

    # 6. Vicat Cement Setting & Soundness 3D Model
    vicat_parts = [
        ("VicatApparatusIronFrame", create_box, (0.4, 0.9, 0.4), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("InitialSettingNeedlePlunger", create_cylinder, (0.02, 0.4, 16), [0.0, 0.05, 0.15], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("SplitLeChatelierMoldCylinder", create_cylinder, (0.15, 0.2, 20), [0.35, -0.25, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("VicatConicalCementPasteMold", create_cylinder, (0.2, 0.15, 20), [0.0, -0.35, 0.15], [0, 0, 0, 1], [0.65, 0.65, 0.65, 1.0]),
    ]
    build_glb(vicat_parts, "frontend/models/vicat_cement_setting_soundness.glb")

    # 7. Brick Masonry Compressive & Absorption 3D Model
    brick_parts = [
        ("ModularClayBrickSpecimen", create_box, (0.95, 0.45, 0.45), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.35, 0.20, 1.0]),
        ("MortarFrogIndentation", create_box, (0.5, 0.06, 0.22), [0.0, 0.22, 0.0], [0, 0, 0, 1], [0.55, 0.20, 0.10, 1.0]),
        ("CompressionMachinePlatens", create_box, (1.2, 0.15, 0.6), [0.0, 0.32, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("DigitalElectronicScale", create_box, (0.6, 0.12, 0.6), [-0.45, -0.3, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
    ]
    build_glb(brick_parts, "frontend/models/brick_masonry_compressive_water_absorption.glb")

    # 8. Sand Bulking & Moisture Content 3D Model
    sand_parts = [
        ("GlassMeasuringCylinder250ml", create_cylinder, (0.18, 1.1, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("BulkedSandSampleLayer", create_cylinder, (0.16, 0.5, 20), [0.0, -0.25, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.35, 1.0]),
        ("WaterMeniscusLayer", create_cylinder, (0.16, 0.25, 20), [0.0, 0.15, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("StandardSieveNestStack", create_cylinder, (0.28, 0.7, 20), [0.45, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
    ]
    build_glb(sand_parts, "frontend/models/sand_bulking_moisture_content.glb")

    # 9. Concrete Mix Design IS 10262 3D Model
    mix_parts = [
        ("SteelCubeMold150mm", create_box, (0.6, 0.6, 0.6), [-0.3, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ConcreteBatchingPanScale", create_box, (0.7, 0.1, 0.7), [0.35, -0.25, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("SlumpConeWithBasePlate", create_cylinder, (0.22, 0.5, 20), [0.35, 0.1, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("TampingRodSteel", create_cylinder, (0.02, 0.7, 16), [0.35, 0.4, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(mix_parts, "frontend/models/concrete_mix_design_is10262.glb")

    # 10. Concrete Compacting Factor & Vee-Bee 3D Model
    cf_parts = [
        ("UpperConicalHopper", create_cylinder, (0.35, 0.35, 20), [0.0, 0.4, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("LowerConicalHopper", create_cylinder, (0.3, 0.3, 20), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("ReceivingCylindricalMold", create_cylinder, (0.22, 0.35, 20), [0.0, -0.38, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("QuickReleaseTrapdoorLatch", create_box, (0.1, 0.08, 0.1), [0.22, 0.2, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(cf_parts, "frontend/models/concrete_compacting_factor_veebee.glb")

    # 11. Split Tensile & Flexural Concrete Strength 3D Model
    split_parts = [
        ("ConcreteCylinder150x300mm", create_cylinder, (0.22, 0.7, 20), [-0.3, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.65, 0.65, 0.65, 1.0]),
        ("PlywoodBearingPackingStrips", create_box, (0.7, 0.02, 0.08), [-0.3, 0.23, 0.0], [0, 0, 0, 1], [0.85, 0.65, 0.35, 1.0]),
        ("ConcreteFlexurePrismBeam", create_box, (1.2, 0.2, 0.2), [0.35, 0.0, 0.0], [0, 0, 0, 1], [0.65, 0.65, 0.65, 1.0]),
        ("TwoPointFlexuralLoadingRollers", create_cylinder, (0.04, 0.25, 16), [0.35, 0.15, 0.0], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(split_parts, "frontend/models/split_tensile_flexural_concrete_strength.glb")

    # 12. Shear Force & Bending Moment Diagrams 3D Model
    sf_parts = [
        ("SimplySupportedSteelIBeam", create_box, (1.6, 0.25, 0.18), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("PointLoadHydraulicJack", create_cylinder, (0.08, 0.3, 16), [0.1, 0.3, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("UDLSimulationUniformWeights", create_box, (0.8, 0.12, 0.12), [-0.25, 0.18, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("DialGaugeDeflectionIndicator", create_cylinder, (0.08, 0.15, 16), [0.0, -0.22, 0.0], [0.7071, 0, 0, 0.7071], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(sf_parts, "frontend/models/shear_force_bending_moment_diagrams.glb")


if __name__ == "__main__":
    generate_all()
