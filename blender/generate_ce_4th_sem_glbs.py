"""
Binary glTF (.glb) Generator for WBSCTE Civil Engineering 4th Semester Tools
=============================================================================
Generates 12 3D assets for CE 4th Sem:
- frontend/models/transit_theodolite_vernier_angles.glb
- frontend/models/theodolite_traverse_bowditch_rule.glb
- frontend/models/tacheometric_stadia_distance_height.glb
- frontend/models/circular_curve_setting_rankine_method.glb
- frontend/models/soil_phase_relationships_unit_weights.glb
- frontend/models/falling_head_permeability_darcy.glb
- frontend/models/rankine_earth_pressure_retaining_wall.glb
- frontend/models/unconfined_compression_vane_shear.glb
- frontend/models/highway_superelevation_stopping_sight_distance.glb
- frontend/models/california_bearing_ratio_cbr.glb
- frontend/models/bitumen_penetration_softening_ductility.glb
- frontend/models/crop_water_duty_delta_canal_design.glb
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
        "asset": {"version": "2.0", "generator": "NHIT Civil 4th Sem GLB Engine"},
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
    # 1. Transit Theodolite Vernier Angles 3D Model
    theo_parts = [
        ("TransitTelescopeTrunnionAxis", create_cylinder, (0.07, 1.1, 20), [0.0, 0.25, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("VerticalCircleVernierCasing", create_cylinder, (0.35, 0.06, 24), [0.0, 0.25, 0.15], [0.7071, 0, 0, 0.7071], [0.85, 0.75, 0.25, 1.0]),
        ("UpperLowerHorizontalVernierPlates", create_cylinder, (0.45, 0.12, 24), [0.0, -0.05, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("TribrachLevelingHeadBase", create_cylinder, (0.35, 0.15, 24), [0.0, -0.25, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
    ]
    build_glb(theo_parts, "frontend/models/transit_theodolite_vernier_angles.glb")

    # 2. Theodolite Traverse Bowditch Rule 3D Model
    trav_parts = [
        ("ClosedTraversePolygonFrame", create_box, (1.4, 0.04, 1.2), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("TraverseStationHubPegs", create_cylinder, (0.05, 0.25, 16), [-0.5, 0.1, -0.4], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("BowditchCorrectionVectorArrow", create_box, (0.4, 0.03, 0.03), [0.2, 0.12, 0.2], [0, 0.3827, 0, 0.9239], [0.95, 0.80, 0.15, 1.0]),
        ("ClosingErrorDiscrepancyBox", create_box, (0.2, 0.1, 0.2), [0.45, 0.05, -0.3], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(trav_parts, "frontend/models/theodolite_traverse_bowditch_rule.glb")

    # 3. Tacheometric Stadia Distance & Height 3D Model
    tach_parts = [
        ("TacheometerAnallaticTelescope", create_cylinder, (0.08, 1.2, 20), [0.0, 0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("StadiaCrossHairReticleRing", create_cylinder, (0.12, 0.04, 20), [0.0, 0.2, 0.4], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("VerticalLevellingStadiaRod", create_box, (0.1, 1.6, 0.06), [0.6, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("AnallaticLensInternalBarrel", create_cylinder, (0.05, 0.3, 16), [0.0, 0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(tach_parts, "frontend/models/tacheometric_stadia_distance_height.glb")

    # 4. Circular Curve Setting Rankine Method 3D Model
    curve_parts = [
        ("CircularCurveArcTrack", create_cylinder, (0.8, 0.04, 24), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
        ("TangentLinesIntersectionPointV", create_box, (0.08, 0.3, 0.08), [0.0, 0.15, -0.6], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("RankineDeflectionAngleTheodolite", create_cylinder, (0.15, 0.4, 20), [-0.6, 0.2, 0.3], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("SubChordRangingPegs", create_cylinder, (0.04, 0.2, 16), [0.2, 0.1, 0.4], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(curve_parts, "frontend/models/circular_curve_setting_rankine_method.glb")

    # 5. Soil Phase Relationships 3-Phase Diagram 3D Model
    phase_parts = [
        ("SolidSoilMineralGrainsLayer", create_box, (1.0, 0.45, 0.8), [0.0, -0.25, 0.0], [0, 0, 0, 1], [0.65, 0.45, 0.25, 1.0]),
        ("PoreWaterCapillaryLiquidLayer", create_box, (1.0, 0.35, 0.8), [0.0, 0.15, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("PoreAirVapourTopLayer", create_box, (1.0, 0.2, 0.8), [0.0, 0.42, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("ThreePhaseVolumetricGaugeFrame", create_box, (1.1, 1.0, 0.02), [0.0, 0.1, 0.42], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(phase_parts, "frontend/models/soil_phase_relationships_unit_weights.glb")

    # 6. Falling Head Permeability Darcy Lab 3D Model
    perm_parts = [
        ("GlassStandpipeGraduatedColumn", create_cylinder, (0.06, 1.2, 20), [-0.35, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("SoilPermeameterCellCylinder", create_cylinder, (0.25, 0.6, 20), [0.25, -0.1, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("PorousStonesDrainageFilterDiscs", create_cylinder, (0.24, 0.06, 20), [0.25, -0.38, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("ConnectingFlexibleHydraulicTube", create_box, (0.5, 0.03, 0.03), [-0.05, -0.3, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(perm_parts, "frontend/models/falling_head_permeability_darcy.glb")

    # 7. Rankine Earth Pressure Retaining Wall 3D Model
    wall_parts = [
        ("CantileverRCCRetainingWallStem", create_box, (0.2, 1.2, 1.0), [-0.3, 0.1, 0.0], [0, 0, 0, 1], [0.64, 0.74, 0.85, 1.0]),
        ("CohesionlessBackfillSoilWedge", create_box, (0.8, 1.1, 1.0), [0.2, 0.05, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.35, 1.0]),
        ("WallFoundationHeelToeBaseSlab", create_box, (1.2, 0.18, 1.0), [0.0, -0.55, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("TriangularActivePressureDistribution", create_box, (0.6, 0.9, 0.02), [-0.42, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(wall_parts, "frontend/models/rankine_earth_pressure_retaining_wall.glb")

    # 8. Unconfined Compression & Vane Shear 3D Model
    ucs_parts = [
        ("UCSTestingMachineGuideColumns", create_box, (0.6, 1.1, 0.4), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("CylindricalClaySoilSpecimen", create_cylinder, (0.12, 0.45, 20), [0.0, -0.05, 0.0], [0, 0, 0, 1], [0.65, 0.45, 0.25, 1.0]),
        ("ProvingRingLoadCellIndicator", create_cylinder, (0.18, 0.06, 20), [0.0, 0.35, 0.0], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("FourBladedShearVaneAssembly", create_box, (0.12, 0.3, 0.12), [0.35, -0.1, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
    ]
    build_glb(ucs_parts, "frontend/models/unconfined_compression_vane_shear.glb")

    # 9. Highway Superelevation & SSD 3D Model
    road_parts = [
        ("CamberedRoadwayPavementSection", create_box, (1.5, 0.15, 0.9), [0.0, -0.1, 0.0], [0, 0, 0.1736, 0.9848], [0.22, 0.28, 0.36, 1.0]),
        ("PassengerVehicleSimulationModel", create_box, (0.6, 0.3, 0.35), [0.1, 0.15, 0.0], [0, 0, 0.1736, 0.9848], [0.95, 0.20, 0.15, 1.0]),
        ("StoppingSightDistanceBrakingLine", create_box, (1.2, 0.02, 0.06), [0.0, -0.02, 0.3], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("CentrifugalForceLateralVector", create_box, (0.4, 0.03, 0.03), [0.1, 0.35, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(road_parts, "frontend/models/highway_superelevation_stopping_sight_distance.glb")

    # 10. California Bearing Ratio (CBR) 3D Model
    cbr_parts = [
        ("CBRStandardMouldWithCollar", create_cylinder, (0.28, 0.65, 24), [0.0, -0.1, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("Standard50mmPenetrationPiston", create_cylinder, (0.08, 0.4, 20), [0.0, 0.3, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("AnnularSlottedSurchargeWeights", create_cylinder, (0.24, 0.12, 20), [0.0, 0.05, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ProvingRingDialGaugeAssembly", create_cylinder, (0.16, 0.06, 20), [0.0, 0.55, 0.0], [0.7071, 0, 0, 0.7071], [0.15, 0.45, 0.85, 1.0]),
    ]
    build_glb(cbr_parts, "frontend/models/california_bearing_ratio_cbr.glb")

    # 11. Bitumen Penetration & Softening Point 3D Model
    bit_parts = [
        ("PenetrometerStandardNeedleShaft", create_cylinder, (0.02, 0.45, 16), [-0.3, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("BitumenSampleContainerCup", create_cylinder, (0.18, 0.18, 20), [-0.3, -0.2, 0.0], [0, 0, 0, 1], [0.15, 0.15, 0.15, 1.0]),
        ("RingAndBallSofteningBathFrame", create_box, (0.5, 0.6, 0.4), [0.35, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("TaperedBrassRingsWithSteelBalls", create_cylinder, (0.08, 0.04, 16), [0.35, 0.05, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
    ]
    build_glb(bit_parts, "frontend/models/bitumen_penetration_softening_ductility.glb")

    # 12. Crop Water Duty Delta & Canal Design 3D Model
    irr_parts = [
        ("TrapezoidalIrrigationCanalPrism", create_box, (1.4, 0.4, 0.9), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.65, 0.45, 0.25, 1.0]),
        ("FlowingWaterCanalDischargeLayer", create_box, (1.3, 0.25, 0.7), [0.0, -0.15, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("AdjustableCanalHeadRegulatorGate", create_box, (0.15, 0.6, 0.8), [-0.55, 0.1, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("AgriculturalCultivatedCropField", create_box, (0.8, 0.15, 0.8), [0.4, 0.05, 0.0], [0, 0, 0, 1], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(irr_parts, "frontend/models/crop_water_duty_delta_canal_design.glb")


if __name__ == "__main__":
    generate_all()
