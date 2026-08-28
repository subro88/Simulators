"""
Binary glTF (.glb) Generator for WBSCTE Civil Engineering 6th Semester Tools
=============================================================================
Generates 12 3D assets for CE 6th Sem:
- frontend/models/is800_steel_bolted_welded_connection.glb
- frontend/models/is800_steel_tension_member_net_section.glb
- frontend/models/is800_steel_column_buckling_curves.glb
- frontend/models/is800_steel_beam_bending_web_crippling.glb
- frontend/models/is1893_seismic_base_shear_distribution.glb
- frontend/models/is13920_ductile_detailing_confinement.glb
- frontend/models/concrete_gravity_dam_stability_analysis.glb
- frontend/models/flownet_seepage_exit_gradient_piping.glb
- frontend/models/unit_hydrograph_flood_routing_rational.glb
- frontend/models/rebound_hammer_upv_ndt_testing.glb
- frontend/models/structural_retrofitting_frp_jacketing.glb
- frontend/models/micro_irrigation_drip_sprinkler_uniformity.glb
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
        "asset": {"version": "2.0", "generator": "NHIT Civil 6th Sem GLB Engine"},
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
    # 1. IS 800 Steel Bolted & Welded Connection 3D Model
    bolt_parts = [
        ("StructuralSteelGussetPlate", create_box, (1.2, 0.08, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ConnectingSteelLapPlate", create_box, (0.7, 0.08, 0.7), [0.2, 0.08, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("HighStrengthHexagonalBoltsGroup", create_cylinder, (0.04, 0.25, 16), [0.2, 0.08, 0.15], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("SideFilletWeldThroatBead", create_box, (0.7, 0.03, 0.03), [0.2, 0.12, 0.35], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(bolt_parts, "frontend/models/is800_steel_bolted_welded_connection.glb")

    # 2. IS 800 Steel Tension Member & Net Section 3D Model
    ten_parts = [
        ("SteelAngleTensionMemberISA", create_box, (0.15, 0.15, 1.6), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("EndGussetConnectionPlate", create_box, (0.35, 0.02, 0.45), [0.0, 0.08, -0.6], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("CriticalNetRuptureSectionPlane", create_box, (0.16, 0.16, 0.02), [0.0, 0.0, -0.5], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("BlockShearFailureTearoutPrism", create_box, (0.08, 0.08, 0.25), [0.04, 0.04, -0.55], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(ten_parts, "frontend/models/is800_steel_tension_member_net_section.glb")

    # 3. IS 800 Steel Column Buckling Curves 3D Model
    col_parts = [
        ("UniversalSteelColumnISection", create_box, (0.3, 0.3, 1.7), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("PinEndedBaseSupportHinge", create_cylinder, (0.1, 0.4, 20), [0.0, -0.85, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.75, 0.25, 1.0]),
        ("ParabolicEulerBucklingDisplacementCurve", create_cylinder, (0.02, 1.6, 16), [0.15, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("TopAxialCompressiveForceCap", create_box, (0.45, 0.08, 0.45), [0.0, 0.85, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(col_parts, "frontend/models/is800_steel_column_buckling_curves.glb")

    # 4. IS 800 Steel Beam & Web Crippling 3D Model
    bm_parts = [
        ("RolledSteelJoistISMBBeam", create_box, (0.2, 0.5, 1.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ConcentratedBearingFlangePlate", create_box, (0.25, 0.04, 0.3), [0.0, 0.27, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("WebCripplingLocalBucklingZone", create_box, (0.02, 0.2, 0.3), [0.0, 0.15, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("EndBearingStiffenersPair", create_box, (0.18, 0.46, 0.02), [0.0, 0.0, 0.8], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(bm_parts, "frontend/models/is800_steel_beam_bending_web_crippling.glb")

    # 5. IS 1893 Seismic Base Shear Distribution 3D Model
    eq_parts = [
        ("MultiStoreyBuildingStructuralFrame", create_box, (0.9, 1.6, 0.9), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("InvertedTriangularLateralForcePyramid", create_box, (0.04, 1.5, 0.4), [0.55, 0.0, 0.0], [0, 0, 0.1736, 0.9848], [0.95, 0.20, 0.15, 1.0]),
        ("GroundSeismicShakeBaseSlab", create_box, (1.5, 0.15, 1.5), [0.0, -0.85, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("StoryLevelFloorDiaphragms", create_box, (0.95, 0.04, 0.95), [0.0, 0.2, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(eq_parts, "frontend/models/is1893_seismic_base_shear_distribution.glb")

    # 6. IS 13920 Ductile Detailing Confinement 3D Model
    duc_parts = [
        ("BeamColumnDuctileJointCore", create_box, (0.45, 0.45, 0.45), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("CloselySpacedSpecialConfiningHoops", create_cylinder, (0.2, 0.8, 24), [0.0, 0.4, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("LongitudinalBeamPlasticHingeZone", create_box, (0.3, 0.4, 0.7), [0.0, 0.0, 0.55], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("Seismic135DegreeHookCrossTies", create_cylinder, (0.01, 0.35, 16), [0.0, 0.4, 0.0], [0, 0, 0.7071, 0.7071], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(duc_parts, "frontend/models/is13920_ductile_detailing_confinement.glb")

    # 7. Concrete Gravity Dam Stability 3D Model
    dam_parts = [
        ("ConcreteGravityDamTrapezoidalMonolith", create_box, (1.2, 1.5, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("ReservoirHydrostaticWaterWedge", create_box, (0.8, 1.3, 0.8), [-0.8, -0.1, 0.0], [0, 0, 0, 1], [0.02, 0.52, 0.78, 1.0]),
        ("TriangularUpliftPressureBaseProfile", create_box, (1.2, 0.06, 0.8), [0.0, -0.78, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("ToeCompressiveStressConcentrationZone", create_box, (0.3, 0.3, 0.8), [0.55, -0.6, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(dam_parts, "frontend/models/concrete_gravity_dam_stability_analysis.glb")

    # 8. Flow Net & Seepage Exit Gradient 3D Model
    flow_parts = [
        ("PerviousFoundationSoilDomain", create_box, (1.6, 0.6, 0.8), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.65, 0.45, 0.25, 1.0]),
        ("ImperviousConcreteWeirApronStructure", create_box, (0.8, 0.3, 0.8), [-0.1, 0.05, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("VerticalSheetPileCutoffWall", create_box, (0.04, 0.5, 0.8), [-0.45, -0.3, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("CurvilinearFlowLinesMeshGrid", create_box, (1.5, 0.02, 0.75), [0.0, -0.3, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(flow_parts, "frontend/models/flownet_seepage_exit_gradient_piping.glb")

    # 9. Unit Hydrograph & Flood Routing 3D Model
    hydro_parts = [
        ("WatershedTopographicCatchmentBasin", create_box, (1.5, 0.1, 1.2), [0.0, -0.3, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
        ("UnitHydrographBellCurvedSurface", create_box, (1.2, 0.8, 0.02), [0.0, 0.15, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("PeakDischargeGaugeStationSpillway", create_cylinder, (0.1, 0.4, 16), [0.5, -0.1, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("EffectiveRainfallHyetographColumns", create_box, (0.6, 0.3, 0.04), [-0.2, 0.65, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(hydro_parts, "frontend/models/unit_hydrograph_flood_routing_rational.glb")

    # 10. Rebound Hammer & UPV NDT Testing 3D Model
    ndt_parts = [
        ("ConcreteStructuralTestColumn", create_box, (0.5, 1.2, 0.5), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("SchmidtReboundHammerSpringPlunger", create_cylinder, (0.04, 0.5, 20), [-0.45, 0.1, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.75, 0.25, 1.0]),
        ("UPVPiezoelectricTransmitterProbe", create_cylinder, (0.05, 0.15, 16), [-0.32, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("UPVPiezoelectricReceiverProbe", create_cylinder, (0.05, 0.15, 16), [0.32, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(ndt_parts, "frontend/models/rebound_hammer_upv_ndt_testing.glb")

    # 11. Structural Retrofitting & FRP Jacketing 3D Model
    frp_parts = [
        ("DamagedDeterioratedConcreteCore", create_cylinder, (0.25, 1.4, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("CarbonFRPCompositeConfinementWrap", create_cylinder, (0.26, 1.35, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.15, 0.15, 1.0]),
        ("StructuralEpoxyAdhesiveBondLayer", create_cylinder, (0.255, 1.38, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("AnchoredSteelJacketAngleCollars", create_box, (0.6, 0.06, 0.6), [0.0, 0.65, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(frp_parts, "frontend/models/structural_retrofitting_frp_jacketing.glb")

    # 12. Micro-Irrigation Drip & Sprinkler Uniformity 3D Model
    drip_parts = [
        ("MicroIrrigationPolyethyleneLateralPipe", create_cylinder, (0.03, 1.8, 16), [0.0, 0.1, 0.0], [0.7071, 0, 0, 0.7071], [0.15, 0.15, 0.15, 1.0]),
        ("PressureCompensatingDripEmitterNozzle", create_box, (0.08, 0.06, 0.08), [0.0, 0.16, -0.3], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("RotaryImpactSprinklerNozzleRiser", create_cylinder, (0.04, 0.6, 16), [0.45, 0.35, 0.2], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("AgriculturalCatchCanUniformityGrid", create_cylinder, (0.08, 0.12, 16), [0.45, -0.2, 0.6], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(drip_parts, "frontend/models/micro_irrigation_drip_sprinkler_uniformity.glb")


if __name__ == "__main__":
    generate_all()
