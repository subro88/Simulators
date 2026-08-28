"""
Binary glTF (.glb) Generator for WBSCTE Civil Engineering 5th Semester Tools
=============================================================================
Generates 12 3D assets for CE 5th Sem:
- frontend/models/rcc_singly_reinforced_beam_is456.glb
- frontend/models/rcc_doubly_reinforced_beam_is456.glb
- frontend/models/rcc_flanged_t_beam_design.glb
- frontend/models/rcc_beam_shear_design_stirrups.glb
- frontend/models/rcc_one_way_two_way_slab.glb
- frontend/models/rcc_short_column_helical_ties.glb
- frontend/models/rcc_isolated_footing_punching_shear.glb
- frontend/models/railway_superelevation_cant_deficiency.glb
- frontend/models/railway_turnout_points_crossing.glb
- frontend/models/airport_runway_length_corrections.glb
- frontend/models/soil_consolidation_oedometer_settlement.glb
- frontend/models/pile_foundation_load_capacity.glb
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
        "asset": {"version": "2.0", "generator": "NHIT Civil 5th Sem GLB Engine"},
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
    # 1. RCC Singly Reinforced Beam IS 456 3D Model
    beam_parts = [
        ("ConcreteBeamPrismStem", create_box, (0.3, 0.6, 1.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("TensionLongitudinalRebarsAst", create_cylinder, (0.02, 1.7, 16), [0.08, -0.22, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("NeutralAxisStressBlockPlane", create_box, (0.32, 0.02, 1.82), [0.0, 0.08, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("ConcreteParabolicCompressiveStressZone", create_box, (0.3, 0.24, 1.8), [0.0, 0.18, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(beam_parts, "frontend/models/rcc_singly_reinforced_beam_is456.glb")

    # 2. RCC Doubly Reinforced Beam 3D Model
    doubly_parts = [
        ("ConcreteBeamPrismDoublyStem", create_box, (0.3, 0.6, 1.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("CompressionRebarsAscZone", create_cylinder, (0.016, 1.7, 16), [0.08, 0.22, 0.0], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
        ("TensionRebarsAstZone", create_cylinder, (0.025, 1.7, 16), [0.08, -0.22, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("ClosedShearStirrupsCage", create_box, (0.24, 0.52, 1.75), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
    ]
    build_glb(doubly_parts, "frontend/models/rcc_doubly_reinforced_beam_is456.glb")

    # 3. RCC Flanged T-Beam Design 3D Model
    tbeam_parts = [
        ("TBeamCompressiveFlangeSlab", create_box, (1.2, 0.15, 1.8), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("TBeamWebStemRib", create_box, (0.3, 0.45, 1.8), [0.0, -0.05, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("TensionRebarBundleInWeb", create_cylinder, (0.025, 1.7, 16), [0.0, -0.22, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("FlangeTransverseShearReinforcement", create_box, (1.1, 0.02, 1.7), [0.0, 0.26, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(tbeam_parts, "frontend/models/rcc_flanged_t_beam_design.glb")

    # 4. RCC Beam Shear Design & Stirrups 3D Model
    shear_parts = [
        ("ConcreteBeamShearSpan", create_box, (0.3, 0.55, 1.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("TwoLeggedVerticalShearStirrups", create_box, (0.24, 0.48, 0.02), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("Diagonal45DegreeShearCrackPlane", create_box, (0.32, 0.45, 0.02), [0.3, 0.0, 0.0], [0, 0.3827, 0, 0.9239], [0.0, 0.9, 0.4, 1.0]),
        ("LongitudinalCornerHangerBars", create_cylinder, (0.012, 1.7, 16), [0.09, 0.22, 0.0], [0.7071, 0, 0, 0.7071], [0.85, 0.75, 0.25, 1.0]),
    ]
    build_glb(shear_parts, "frontend/models/rcc_beam_shear_design_stirrups.glb")

    # 5. RCC One-Way & Two-Way Slab 3D Model
    slab_parts = [
        ("TwoWayRestrainedRCCFloorSlab", create_box, (1.6, 0.15, 1.3), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("ShortSpanPrincipalBendingMesh", create_box, (1.5, 0.02, 1.2), [0.0, -0.05, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("LongSpanDistributionRebarLayer", create_box, (1.5, 0.02, 1.2), [0.0, -0.03, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("CornerTorsionalMeshReinforcement", create_box, (0.35, 0.04, 0.35), [0.6, 0.0, 0.45], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(slab_parts, "frontend/models/rcc_one_way_two_way_slab.glb")

    # 6. RCC Short Column & Helical Ties 3D Model
    col_parts = [
        ("RCCColumnConcreteCorePrism", create_cylinder, (0.22, 1.6, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("MainLongitudinalVerticalRebarsAsc", create_cylinder, (0.02, 1.55, 16), [0.15, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("ContinuousHelicalSpiralTieHelix", create_cylinder, (0.21, 1.5, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("ColumnTopLoadingPlatenCap", create_box, (0.5, 0.12, 0.5), [0.0, 0.85, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(col_parts, "frontend/models/rcc_short_column_helical_ties.glb")

    # 7. RCC Isolated Footing & Punching Shear 3D Model
    foot_parts = [
        ("TrapezoidalIsolatedRCCFootingBase", create_box, (1.6, 0.35, 1.6), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("CentralSquareRCCColumnStub", create_box, (0.4, 0.8, 0.4), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("TwoWayPunchingShearCriticalPerimeter", create_box, (0.7, 0.36, 0.7), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("BiaxialBottomFlexuralMeshRebars", create_box, (1.5, 0.02, 1.5), [0.0, -0.52, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(foot_parts, "frontend/models/rcc_isolated_footing_punching_shear.glb")

    # 8. Railway Track Cant & Superelevation 3D Model
    rail_parts = [
        ("BroadGaugeSteelRailsPair", create_box, (0.1, 0.15, 1.8), [-0.5, 0.05, 0.0], [0, 0, 0.087, 0.996], [0.22, 0.28, 0.36, 1.0]),
        ("PrestressedConcreteSleepersPSC", create_box, (1.5, 0.12, 0.2), [0.0, -0.1, 0.0], [0, 0, 0.087, 0.996], [0.64, 0.74, 0.85, 1.0]),
        ("CrushedStoneBallastBedCushion", create_box, (1.8, 0.25, 1.8), [0.0, -0.28, 0.0], [0, 0, 0, 1], [0.55, 0.55, 0.55, 1.0]),
        ("ConedTrainWheelsetAxisModel", create_cylinder, (0.28, 1.3, 24), [0.0, 0.35, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.75, 0.25, 1.0]),
    ]
    build_glb(rail_parts, "frontend/models/railway_superelevation_cant_deficiency.glb")

    # 9. Railway Turnout Points & Crossing 3D Model
    turn_parts = [
        ("StraightThroughMainTrackRails", create_box, (0.08, 0.12, 1.8), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("DivergingTurnoutBranchCurvedRails", create_box, (0.08, 0.12, 1.8), [0.3, 0.0, 0.0], [0, 0.1305, 0, 0.9914], [0.38, 0.74, 0.97, 1.0]),
        ("AcuteAngleCrossingVeeNosePoint", create_box, (0.15, 0.12, 0.4), [0.0, 0.0, 0.3], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("SwitchTongueRailsStretcherBar", create_box, (0.7, 0.04, 0.06), [-0.1, -0.02, -0.6], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(turn_parts, "frontend/models/railway_turnout_points_crossing.glb")

    # 10. Airport Runway Length Corrections 3D Model
    run_parts = [
        ("PavedAsphaltRunwayStripTrack", create_box, (1.8, 0.06, 0.9), [0.0, -0.1, 0.0], [0, 0, 0, 1], [0.15, 0.15, 0.15, 1.0]),
        ("WhiteRunwayThresholdCenterlineMarkings", create_box, (1.7, 0.02, 0.08), [0.0, -0.06, 0.0], [0, 0, 0, 1], [0.95, 0.95, 0.95, 1.0]),
        ("CommercialAircraftApproachModel", create_box, (0.6, 0.2, 0.5), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("AirportElevationTemperatureReferenceTower", create_cylinder, (0.06, 0.8, 16), [-0.7, 0.3, -0.3], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
    ]
    build_glb(run_parts, "frontend/models/airport_runway_length_corrections.glb")

    # 11. Soil Consolidation Oedometer 3D Model
    oed_parts = [
        ("BrassOedometerConsolidationRing", create_cylinder, (0.3, 0.15, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("SaturatedClaySoilConsolidationWafer", create_cylinder, (0.29, 0.12, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.65, 0.45, 0.25, 1.0]),
        ("UpperPorousStoneLoadingCap", create_cylinder, (0.28, 0.05, 24), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("ConsolidationLeverLoadingArmFrame", create_box, (0.1, 0.8, 0.6), [0.0, 0.4, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(oed_parts, "frontend/models/soil_consolidation_oedometer_settlement.glb")

    # 12. Pile Foundation Load Capacity 3D Model
    pile_parts = [
        ("CastInSituReinforcedConcretePileShaft", create_cylinder, (0.16, 1.6, 24), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("ExpandedPileBaseEndBearingBulb", create_cylinder, (0.25, 0.25, 24), [0.0, -0.95, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("FrictionalSoilShearResistanceInterface", create_cylinder, (0.2, 1.4, 24), [0.0, -0.15, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("RigidPileCapSuperstructureInterface", create_box, (0.7, 0.25, 0.7), [0.0, 0.65, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(pile_parts, "frontend/models/pile_foundation_load_capacity.glb")


if __name__ == "__main__":
    generate_all()
