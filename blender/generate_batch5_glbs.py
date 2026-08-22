"""
Master Procedural GLTF/GLB Asset Generator for Batch 5 Electrical & Electronics Suite
=====================================================================================
Generates 22 binary .glb 3D electrical & electronic models saved to frontend/models/:
- ohms_law.glb
- kirchhoffs_laws.glb
- rlc_circuit.glb
- three_phase_circuit.glb
- transformer.glb
- dc_motor.glb
- induction_motor.glb
- synchronous_machine.glb
- diode_characteristics.glb
- rectifier_circuit.glb
- bjt_transistor.glb
- mosfet_transistor.glb
- op_amp.glb
- logic_gates.glb
- combinational_logic.glb
- sequential_logic.glb
- timer_555.glb
- power_electronics.glb
- solar_pv_cell.glb
- battery_storage.glb
- control_system_pid.glb
- signal_processing_filter.glb
"""

import json, struct, math
from pathlib import Path
import numpy as np


def create_box(length: float, width: float, thickness: float):
    half_l, half_w, half_t = length / 2.0, width / 2.0, thickness / 2.0
    pts = [
        [-half_l, -half_w, -half_t], [half_l, -half_w, -half_t], [half_l, half_w, -half_t], [-half_l, half_w, -half_t],
        [-half_l, -half_w, half_t], [half_l, -half_w, half_t], [half_l, half_w, half_t], [-half_l, half_w, half_t]
    ]
    norms = [[0,0,-1],[0,0,-1],[0,0,-1],[0,0,-1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]]
    faces = [[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[2,6,7],[2,7,3],[3,7,4],[3,4,0]]
    verts, nms, idxs = [], [], []
    for p in pts: verts.append(p)
    for n in norms: nms.append(n)
    for f in faces: idxs.extend(f)
    return np.array(verts, dtype=np.float32), np.array(nms, dtype=np.float32), np.array(idxs, dtype=np.uint16)


def create_cylinder(radius: float, height: float, segments: int = 16):
    verts, nms, idxs = [], [], []
    half_h = height / 2.0
    for i in range(segments):
        a = 2.0 * math.pi * i / segments
        x, z = radius * math.cos(a), radius * math.sin(a)
        verts.append([x, half_h, z])
        nms.append([math.cos(a), 0, math.sin(a)])
        verts.append([x, -half_h, z])
        nms.append([math.cos(a), 0, math.sin(a)])
    for i in range(segments):
        n_i = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = n_i * 2, n_i * 2 + 1
        idxs.extend([t1, b1, t2, t2, b1, b2])
    return np.array(verts, dtype=np.float32), np.array(nms, dtype=np.float32), np.array(idxs, dtype=np.uint16)


def create_sphere(radius: float, rings: int = 12, segments: int = 16):
    verts, nms, idxs = [], [], []
    for i in range(rings + 1):
        v = i / rings
        lat = math.pi * (v - 0.5)
        for j in range(segments):
            u = j / segments
            lon = 2.0 * math.pi * u
            x = radius * math.cos(lat) * math.cos(lon)
            y = radius * math.sin(lat)
            z = radius * math.cos(lat) * math.sin(lon)
            nx, ny, nz = x / radius, y / radius, z / radius
            verts.append([x, y, z])
            nms.append([nx, ny, nz])
    for i in range(rings):
        for j in range(segments):
            p1 = i * (segments) + j
            p2 = p1 + segments
            idxs.extend([p1, p2, p1 + 1, p1 + 1, p2, p2 + 1])
    return np.array(verts, dtype=np.float32), np.array(nms, dtype=np.float32), np.array(idxs, dtype=np.uint16)


def export_generic_glb(components: list, output_path: str, generator_name: str):
    bin_buffer = bytearray()
    buffer_views, accessors, meshes, nodes, materials = [], [], [], [], []

    for name, func, args, pos, rot, color in components:
        verts, norms, indices = func(*args)
        rx, ry, rz = rot
        if rz != 0.0:
            c, s = math.cos(rz), math.sin(rz)
            verts = np.dot(verts, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))
            norms = np.dot(norms, np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]]))
        if rx != 0.0:
            c, s = math.cos(rx), math.sin(rx)
            verts = np.dot(verts, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))
            norms = np.dot(norms, np.array([[1, 0, 0], [0, c, -s], [0, s, c]]))

        def align():
            rem = len(bin_buffer) % 4
            if rem > 0: bin_buffer.extend(b'\x00' * (4 - rem))

        align()
        idx_offset = len(bin_buffer)
        bin_buffer.extend(indices.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": idx_offset, "byteLength": len(indices.tobytes()), "target": 34963})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5123, "count": len(indices), "type": "SCALAR"})

        align()
        v_offset = len(bin_buffer)
        bin_buffer.extend(verts.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": v_offset, "byteLength": len(verts.tobytes()), "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(verts), "type": "VEC3", "min": verts.min(axis=0).tolist(), "max": verts.max(axis=0).tolist()})

        align()
        n_offset = len(bin_buffer)
        bin_buffer.extend(norms.tobytes())
        buffer_views.append({"buffer": 0, "byteOffset": n_offset, "byteLength": len(norms.tobytes()), "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(norms), "type": "VEC3"})

        materials.append({"name": f"Mat_{name}", "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.85, "roughnessFactor": 0.28}})
        meshes.append({"name": f"Mesh_{name}", "primitives": [{"attributes": {"POSITION": len(accessors) - 2, "NORMAL": len(accessors) - 1}, "indices": len(accessors) - 3, "material": len(materials) - 1}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1, "translation": pos})

    gltf_dict = {
        "asset": {"version": "2.0", "generator": generator_name},
        "scenes": [{"name": "Scene", "nodes": list(range(len(nodes)))}],
        "scene": 0,
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_buffer)}]
    }

    json_bytes = json.dumps(gltf_dict, separators=(',', ':')).encode('utf-8')
    rem = len(json_bytes) % 4
    if rem > 0: json_bytes += b' ' * (4 - rem)
    rem = len(bin_buffer) % 4
    if rem > 0: bin_buffer.extend(b'\x00' * (4 - rem))

    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    glb_header = struct.pack('<4sII', b'glTF', 2, total_length)
    json_chunk_header = struct.pack('<II', len(json_bytes), 0x4E4F534A)
    bin_chunk_header = struct.pack('<II', len(bin_buffer), 0x004E4942)

    out_p = Path(output_path)
    out_p.parent.mkdir(parents=True, exist_ok=True)
    with open(out_p, 'wb') as f:
        f.write(glb_header)
        f.write(json_chunk_header)
        f.write(json_bytes)
        f.write(bin_chunk_header)
        f.write(bin_buffer)

    print(f"Generated {generator_name} ({len(bin_buffer)} bytes) -> {output_path}")


def generate_all_batch5_glbs():
    # 1. Ohm's Law
    export_generic_glb([
        ("BreadboardBase", create_box, (2.4, 0.15, 1.2), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.95, 0.95, 0.95, 1.0]),
        ("CeramicResistor", create_cylinder, (0.15, 0.8, 16), [0.0, 0.2, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/ohms_law.glb", "Ohms Law GLB Builder")

    # 2. Kirchhoff's Laws
    export_generic_glb([
        ("BridgePCBBoard", create_box, (2.2, 0.1, 1.6), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.45, 0.2, 1.0]),
        ("GalvanometerHead", create_cylinder, (0.3, 0.2, 16), [0.0, 0.3, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/kirchhoffs_laws.glb", "Kirchhoff GLB Builder")

    # 3. RLC Circuit
    export_generic_glb([
        ("InductorCoil", create_cylinder, (0.3, 0.7, 20), [-0.7, 0.2, 0.0], [0.0, 0.0, math.pi / 2], [0.85, 0.45, 0.15, 1.0]),
        ("FilmCapacitor", create_box, (0.4, 0.6, 0.3), [0.0, 0.2, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0]),
        ("WireResistor", create_cylinder, (0.15, 0.7, 16), [0.7, 0.2, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/rlc_circuit.glb", "RLC Circuit GLB Builder")

    # 4. 3-Phase Circuit
    export_generic_glb([
        ("ThreePhaseTerminalBlock", create_box, (1.8, 0.6, 0.8), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("PhaseL1Stud", create_cylinder, (0.1, 0.4, 12), [-0.5, 0.4, 0.0], [0.0, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0]),
        ("PhaseL2Stud", create_cylinder, (0.1, 0.4, 12), [0.0, 0.4, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0]),
        ("PhaseL3Stud", create_cylinder, (0.1, 0.4, 12), [0.5, 0.4, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/three_phase_circuit.glb", "3Phase Circuit GLB Builder")

    # 5. Transformer
    export_generic_glb([
        ("EICoreStack", create_box, (1.4, 1.4, 0.8), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("PrimaryCopperWinding", create_cylinder, (0.45, 0.9, 20), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.85, 0.45, 0.15, 1.0])
    ], "frontend/models/transformer.glb", "Transformer GLB Builder")

    # 6. DC Motor
    export_generic_glb([
        ("DCMotorFrame", create_cylinder, (0.7, 1.6, 24), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.22, 0.26, 0.34, 1.0]),
        ("CommutatorShaft", create_cylinder, (0.2, 2.2, 16), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/dc_motor.glb", "DC Motor GLB Builder")

    # 7. Induction Motor
    export_generic_glb([
        ("StatorFinHousing", create_cylinder, (0.8, 1.8, 24), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.20, 0.75, 0.95, 1.0]),
        ("RotorOutputShaft", create_cylinder, (0.25, 2.4, 16), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/induction_motor.glb", "Induction Motor GLB Builder")

    # 8. Synchronous Machine
    export_generic_glb([
        ("SalientRotorPole", create_cylinder, (0.85, 1.6, 24), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.65, 0.15, 1.0]),
        ("SlipRings", create_cylinder, (0.3, 0.4, 16), [1.1, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.85, 0.45, 0.15, 1.0])
    ], "frontend/models/synchronous_machine.glb", "Synchronous Machine GLB Builder")

    # 9. Diode Characteristics
    export_generic_glb([
        ("DiodeGlassBody", create_cylinder, (0.2, 0.8, 16), [0.0, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.9, 0.2, 0.1, 0.8]),
        ("CathodeBandMark", create_cylinder, (0.21, 0.15, 16), [0.3, 0.0, 0.0], [0.0, 0.0, math.pi / 2], [0.95, 0.95, 0.95, 1.0])
    ], "frontend/models/diode_characteristics.glb", "Diode GLB Builder")

    # 10. Rectifier Circuit
    export_generic_glb([
        ("BridgeICPackage", create_box, (0.8, 0.8, 0.4), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("SmoothingCapacitorCan", create_cylinder, (0.4, 1.0, 20), [0.9, 0.3, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/rectifier_circuit.glb", "Rectifier Circuit GLB Builder")

    # 11. BJT Transistor
    export_generic_glb([
        ("TO92PlasticBody", create_cylinder, (0.25, 0.5, 16), [0.0, 0.2, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("EmitterBaseCollectorLeads", create_cylinder, (0.04, 0.8, 12), [0.0, -0.3, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/bjt_transistor.glb", "BJT Transistor GLB Builder")

    # 12. MOSFET Transistor
    export_generic_glb([
        ("TO220TabBody", create_box, (0.6, 0.8, 0.2), [0.0, 0.2, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("MetalHeatsinkFin", create_box, (0.6, 0.4, 0.08), [0.0, 0.7, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/mosfet_transistor.glb", "MOSFET Transistor GLB Builder")

    # 13. Op-Amp
    export_generic_glb([
        ("DIP8BlackPackage", create_box, (1.0, 0.4, 0.6), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("ICPinLeads", create_box, (1.1, 0.1, 0.7), [0.0, -0.2, 0.0], [0.0, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/op_amp.glb", "Op-Amp GLB Builder")

    # 14. Logic Gates
    export_generic_glb([
        ("LogicGateIC14", create_box, (1.6, 0.4, 0.6), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("OutputLED", create_sphere, (0.15, 12, 16), [0.0, 0.4, 0.0], [0.0, 0.0, 0.0], [0.34, 0.85, 0.40, 1.0])
    ], "frontend/models/logic_gates.glb", "Logic Gates GLB Builder")

    # 15. Combinational Logic
    export_generic_glb([
        ("MuxChipPackage", create_box, (1.8, 0.4, 0.8), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("SevenSegmentDisplay", create_box, (0.8, 1.2, 0.2), [0.0, 0.8, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/combinational_logic.glb", "Combinational Logic GLB Builder")

    # 16. Sequential Logic
    export_generic_glb([
        ("DualFlipFlopIC", create_box, (1.6, 0.4, 0.6), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("CounterLEDBar", create_box, (1.0, 0.3, 0.3), [0.0, 0.5, 0.0], [0.0, 0.0, 0.0], [0.20, 0.75, 0.95, 1.0])
    ], "frontend/models/sequential_logic.glb", "Sequential Logic GLB Builder")

    # 17. 555 Timer
    export_generic_glb([
        ("NE555TimerIC", create_box, (0.8, 0.4, 0.6), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0]),
        ("PotentiometerKnob", create_cylinder, (0.3, 0.4, 16), [0.8, 0.2, 0.0], [0.0, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/timer_555.glb", "555 Timer GLB Builder")

    # 18. Power Electronics
    export_generic_glb([
        ("PowerToroidalInductor", create_cylinder, (0.6, 0.4, 20), [-0.5, 0.2, 0.0], [math.pi / 2, 0.0, 0.0], [0.85, 0.45, 0.15, 1.0]),
        ("PWMControllerChip", create_box, (0.6, 0.3, 0.6), [0.6, 0.2, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0])
    ], "frontend/models/power_electronics.glb", "Power Electronics GLB Builder")

    # 19. Solar PV Cell
    export_generic_glb([
        ("SolarPanelFrame", create_box, (2.2, 0.08, 1.4), [0.0, 0.0, 0.0], [0.3, 0.0, 0.0], [0.15, 0.25, 0.45, 1.0]),
        ("AluminumBezel", create_box, (2.3, 0.12, 1.5), [0.0, -0.05, 0.0], [0.3, 0.0, 0.0], [0.8, 0.8, 0.8, 1.0])
    ], "frontend/models/solar_pv_cell.glb", "Solar PV GLB Builder")

    # 20. Battery Storage
    export_generic_glb([
        ("BatteryModuleEnclosure", create_box, (1.8, 0.9, 1.2), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("BatteryTerminalPosts", create_cylinder, (0.15, 0.3, 16), [-0.6, 0.5, 0.0], [0.0, 0.0, 0.0], [1.0, 0.2, 0.2, 1.0])
    ], "frontend/models/battery_storage.glb", "Battery Storage GLB Builder")

    # 21. Control System PID
    export_generic_glb([
        ("PIDControlPanelBox", create_box, (2.0, 1.2, 0.4), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.22, 0.26, 0.34, 1.0]),
        ("TuningKnobProportional", create_cylinder, (0.2, 0.2, 16), [-0.6, 0.2, 0.2], [math.pi / 2, 0.0, 0.0], [0.95, 0.65, 0.15, 1.0])
    ], "frontend/models/control_system_pid.glb", "PID Control GLB Builder")

    # 22. Signal Processing Filter
    export_generic_glb([
        ("ActiveFilterModulePCB", create_box, (2.0, 0.1, 1.4), [0.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.1, 0.45, 0.2, 1.0]),
        ("DualOpAmpChip", create_box, (0.8, 0.3, 0.5), [0.0, 0.2, 0.0], [0.0, 0.0, 0.0], [0.1, 0.1, 0.1, 1.0])
    ], "frontend/models/signal_processing_filter.glb", "Signal Filter GLB Builder")


if __name__ == "__main__":
    generate_all_batch5_glbs()
