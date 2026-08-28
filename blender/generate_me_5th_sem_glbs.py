"""
Binary glTF (.glb) Generator for WBSCTE Mechanical Engineering 5th Semester Tools
=================================================================================
Generates 12 3D assets for ME 5th Sem:
- frontend/models/flow_orifice_venturimeter.glb
- frontend/models/pipe_friction_minor_losses.glb
- frontend/models/hydraulic_reaction_turbines.glb
- frontend/models/reciprocating_pump_air_vessel.glb
- frontend/models/jigs_fixtures_design.glb
- frontend/models/cnc_part_programming_gcode.glb
- frontend/models/advanced_machining_laser_waterjet.glb
- frontend/models/steam_turbines_nozzles.glb
- frontend/models/steam_condensers_cooling_towers.glb
- frontend/models/automotive_gearbox_transmission.glb
- frontend/models/automotive_braking_abs.glb
- frontend/models/press_tool_die_design.glb
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
        "asset": {"version": "2.0", "generator": "NHIT ME 5th Sem GLB Engine"},
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
    # 1. Flow Orifice & Venturimeter 3D Model
    flow_comp = [
        ("FlowPipeFlangeSection", create_cylinder, (0.35, 1.8, 24), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.45, 0.65, 1.0]),
        ("VenturiThroatConvergent", create_cylinder, (0.22, 0.6, 20), [-0.2, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("SharpEdgedOrificePlate", create_cylinder, (0.42, 0.05, 24), [0.4, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("DifferentialUTubeManometer", create_box, (0.4, 0.9, 0.15), [0.0, -0.6, 0.0], [0, 0, 0, 1], [0.15, 0.65, 0.95, 1.0]),
    ]
    build_glb(flow_comp, "frontend/models/flow_orifice_venturimeter.glb")

    # 2. Pipe Friction & Minor Losses 3D Model
    pipe_comp = [
        ("GalvanizedPipeTestLine", create_cylinder, (0.15, 2.0, 20), [0.0, 0.3, 0.0], [0, 0, 0.7071, 0.7071], [0.75, 0.80, 0.88, 1.0]),
        ("SmoothCopperPipeLine", create_cylinder, (0.12, 2.0, 20), [0.0, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.55, 0.25, 1.0]),
        ("NinetyDegreeElbowFitting", create_cylinder, (0.2, 0.3, 16), [0.9, 0.3, 0.0], [0.7071, 0, 0, 0.7071], [0.25, 0.30, 0.38, 1.0]),
        ("GateValveRegulatingSpindle", create_box, (0.35, 0.6, 0.35), [-0.4, 0.45, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(pipe_comp, "frontend/models/pipe_friction_minor_losses.glb")

    # 3. Hydraulic Reaction Turbines 3D Model
    turb_comp = [
        ("FrancisSpiralScrollCasing", create_cylinder, (0.65, 0.35, 24), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("RadialGuideVaneRing", create_cylinder, (0.45, 0.25, 20), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("FrancisMixedFlowRunner", create_cylinder, (0.32, 0.3, 20), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("ElbowDraftTubeRecovery", create_cylinder, (0.38, 0.9, 20), [0.0, -0.6, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
    ]
    build_glb(turb_comp, "frontend/models/hydraulic_reaction_turbines.glb")

    # 4. Reciprocating Pump & Air Vessel 3D Model
    recip_comp = [
        ("PumpCylinderBarrelBody", create_cylinder, (0.28, 1.0, 20), [0.0, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.30, 0.38, 1.0]),
        ("CrankConnectingRodDrive", create_cylinder, (0.4, 0.12, 24), [-0.7, -0.2, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("DomedDeliveryAirVessel", create_cylinder, (0.25, 0.8, 20), [0.4, 0.4, 0.0], [0, 0, 0, 1], [0.15, 0.65, 0.45, 1.0]),
        ("SuctionDeliveryCheckValves", create_box, (0.3, 0.5, 0.3), [0.4, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(recip_comp, "frontend/models/reciprocating_pump_air_vessel.glb")

    # 5. Jigs & Fixtures Design 3D Model
    jig_comp = [
        ("CastJigMainBaseplate", create_box, (1.4, 0.25, 1.0), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.20, 0.25, 0.32, 1.0]),
        ("ThreeTwoOneLocatingPins", create_cylinder, (0.08, 0.4, 16), [-0.4, 0.0, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("QuickActingCamClamp", create_box, (0.35, 0.5, 0.3), [0.4, 0.1, -0.2], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("HardenedDrillBushingGuide", create_cylinder, (0.12, 0.3, 16), [-0.1, 0.3, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(jig_comp, "frontend/models/jigs_fixtures_design.glb")

    # 6. CNC Part Programming & G-Code 3D Model
    cnc_comp = [
        ("CNCSlantBedLatheCarriage", create_box, (1.6, 1.2, 1.0), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.18, 0.22, 0.28, 1.0]),
        ("EightStationAutomaticTurret", create_cylinder, (0.35, 0.25, 20), [0.3, 0.4, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("ThreeJawPowerChukSpindle", create_cylinder, (0.4, 0.25, 24), [-0.6, 0.3, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("FanucCNCControlPanelUnit", create_box, (0.6, 0.8, 0.15), [0.8, 0.5, 0.4], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(cnc_comp, "frontend/models/cnc_part_programming_gcode.glb")

    # 7. Advanced Machining (Laser & Waterjet) 3D Model
    adv_comp = [
        ("FiberLaserCuttingHeadNozzle", create_cylinder, (0.12, 0.6, 16), [0.0, 0.4, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("WaterjetAbrasiveMixingChamber", create_cylinder, (0.18, 0.4, 16), [-0.4, 0.3, 0.0], [0, 0, 0, 1], [0.15, 0.65, 0.95, 1.0]),
        ("AbrasiveGarnetFeedHopper", create_box, (0.45, 0.6, 0.45), [-0.4, 0.8, 0.0], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("WorktableSlatGridCatchTank", create_box, (1.6, 0.3, 1.2), [0.0, -0.5, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(adv_comp, "frontend/models/advanced_machining_laser_waterjet.glb")

    # 8. Steam Turbines & Nozzles 3D Model
    turb_nozzle_comp = [
        ("ConvergentDivergentNozzleBlock", create_box, (0.5, 0.4, 0.4), [-0.6, 0.2, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("CurtisVelocityCompoundedRotor", create_cylinder, (0.6, 0.15, 24), [0.0, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("ShroudedRotorBladingStage", create_cylinder, (0.68, 0.1, 24), [0.0, 0.0, 0.12], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("SteamChestThrottleValveBody", create_cylinder, (0.22, 0.5, 16), [-0.6, 0.7, 0.0], [0, 0, 0, 1], [0.25, 0.30, 0.38, 1.0]),
    ]
    build_glb(turb_nozzle_comp, "frontend/models/steam_turbines_nozzles.glb")

    # 9. Steam Condensers & Cooling Towers 3D Model
    cond_comp = [
        ("SurfaceCondenserCylindricalShell", create_cylinder, (0.55, 1.6, 24), [-0.4, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.45, 0.65, 1.0]),
        ("CondenserTubeBundleWaterBox", create_box, (0.4, 0.7, 0.7), [0.5, -0.2, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("HyperbolicCoolingTowerShell", create_cylinder, (0.5, 1.2, 24), [1.1, 0.2, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.88, 1.0]),
        ("CoolingWaterCirculatingPump", create_box, (0.35, 0.4, 0.35), [0.0, -0.6, 0.0], [0, 0, 0, 1], [0.15, 0.65, 0.45, 1.0]),
    ]
    build_glb(cond_comp, "frontend/models/steam_condensers_cooling_towers.glb")

    # 10. Automotive Gearbox & Transmission 3D Model
    gearbox_comp = [
        ("GearboxAluminumCastingHousing", create_box, (1.2, 0.8, 0.7), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.75, 0.80, 0.88, 1.0]),
        ("InputSplinedClutchShaft", create_cylinder, (0.08, 0.8, 16), [-0.7, 0.1, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("SynchronizerRingHubAssembly", create_cylinder, (0.28, 0.15, 20), [0.1, 0.1, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("LayshaftClusterGearsAssembly", create_cylinder, (0.22, 0.9, 20), [0.0, -0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(gearbox_comp, "frontend/models/automotive_gearbox_transmission.glb")

    # 11. Automotive Braking & ABS 3D Model
    brake_comp = [
        ("TandemMasterCylinderReservoir", create_cylinder, (0.15, 0.7, 16), [-0.6, 0.3, 0.0], [0, 0, 0.7071, 0.7071], [0.25, 0.30, 0.38, 1.0]),
        ("VentilatedDiscBrakeRotor", create_cylinder, (0.55, 0.08, 24), [0.2, 0.0, 0.0], [0, 0, 0.7071, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("HydraulicTwinPistonCaliper", create_box, (0.3, 0.45, 0.25), [0.2, 0.35, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("ABSSolenoidHydraulicModulator", create_box, (0.45, 0.5, 0.35), [-0.5, -0.3, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(brake_comp, "frontend/models/automotive_braking_abs.glb")

    # 12. Press Tool & Die Design 3D Model
    press_comp = [
        ("HeavyDieSetUpperPunchShoe", create_box, (1.2, 0.25, 0.8), [0.0, 0.55, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("HardenedToolSteelBlankingPunch", create_cylinder, (0.2, 0.4, 20), [0.0, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("ToolSteelDiePlateBlock", create_box, (1.2, 0.3, 0.8), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.30, 0.65, 0.95, 1.0]),
        ("SpringLoadedStripperPlate", create_box, (0.8, 0.1, 0.6), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(press_comp, "frontend/models/press_tool_die_design.glb")


if __name__ == "__main__":
    generate_all()
