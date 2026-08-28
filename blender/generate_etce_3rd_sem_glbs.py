"""
Binary glTF (.glb) Generator for WBSCTE Electronics & Telecommunication Engineering 3rd Semester Tools
======================================================================================================
Generates 12 3D assets for ETCE 3rd Sem:
- frontend/models/two_port_networks_attenuators.glb
- frontend/models/passive_filters_constant_k_m_derived.glb
- frontend/models/rlc_transient_response.glb
- frontend/models/diode_rectifiers_filters_clippers.glb
- frontend/models/bjt_biasing_stability_factors.glb
- frontend/models/fet_mosfet_characteristics.glb
- frontend/models/kmap_boolean_minimization.glb
- frontend/models/multiplexer_demux_decoder_ic.glb
- frontend/models/flipflops_counters_registers.glb
- frontend/models/dac_adc_converters.glb
- frontend/models/transformer_equivalent_circuit_regulation.glb
- frontend/models/dc_generator_characteristics_emf.glb
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
        "asset": {"version": "2.0", "generator": "NHIT ETCE 3rd Sem GLB Engine"},
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
    # 1. Two-Port Networks & Attenuators 3D Model
    two_port_comp = [
        ("TwoPortNetworkEnclosure", create_box, (1.4, 0.4, 0.9), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("InputPortBNCTerminals", create_cylinder, (0.08, 0.25, 16), [-0.5, 0.0, 0.5], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("TNetworkPrecisionResistors", create_box, (0.35, 0.15, 0.15), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("SymmetricalPiAttenuatorShield", create_box, (0.8, 0.2, 0.5), [0.0, -0.1, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(two_port_comp, "frontend/models/two_port_networks_attenuators.glb")

    # 2. Passive Filters (Constant-k & m-Derived) 3D Model
    filter_comp = [
        ("FilterChassisPCB", create_box, (1.5, 0.08, 1.0), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.10, 0.45, 0.25, 1.0]),
        ("ToroidalHighQInductor", create_cylinder, (0.22, 0.2, 20), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("SilverMicaShuntCapacitor", create_box, (0.25, 0.35, 0.15), [0.1, 0.05, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("mDerivedResonantNotchCoil", create_cylinder, (0.16, 0.28, 16), [0.5, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(filter_comp, "frontend/models/passive_filters_constant_k_m_derived.glb")

    # 3. RLC Transient Response 3D Model
    rlc_comp = [
        ("OscilloscopeCRTDisplayScreen", create_box, (1.2, 0.8, 0.6), [-0.2, 0.1, 0.0], [0, 0, 0, 1], [0.15, 0.25, 0.35, 1.0]),
        ("DCStepFunctionPulseGenerator", create_box, (0.5, 0.4, 0.5), [0.6, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("PrecisionDecadeResistorBox", create_box, (0.4, 0.2, 0.3), [0.0, -0.35, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("DampedResonantRLCTank", create_cylinder, (0.18, 0.3, 20), [0.5, -0.3, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(rlc_comp, "frontend/models/rlc_transient_response.glb")

    # 4. Diode Rectifiers, Filters & Clippers 3D Model
    rect_comp = [
        ("MoldedBridgeRectifierIC", create_box, (0.5, 0.3, 0.5), [-0.3, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("SmoothingElectrolyticCapacitor", create_cylinder, (0.22, 0.6, 20), [0.3, 0.15, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("FastRecoveryClippingDiode", create_cylinder, (0.08, 0.35, 16), [-0.3, -0.3, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("ClampingDCBiasVoltageSource", create_box, (0.4, 0.25, 0.3), [0.3, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(rect_comp, "frontend/models/diode_rectifiers_filters_clippers.glb")

    # 5. BJT Biasing & Stability Factors 3D Model
    bjt_comp = [
        ("TO92SiliconNPNTransistor", create_cylinder, (0.16, 0.35, 16), [0.0, 0.1, 0.0], [0, 0, 0, 1], [0.15, 0.18, 0.22, 1.0]),
        ("VoltageDividerMetalFilmResistors", create_cylinder, (0.06, 0.45, 16), [-0.4, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("EmitterBypassCapacitor", create_cylinder, (0.14, 0.38, 16), [0.4, -0.1, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("DualRegulatedDCPowerRails", create_box, (1.2, 0.08, 0.4), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(bjt_comp, "frontend/models/bjt_biasing_stability_factors.glb")

    # 6. FET & MOSFET Characteristics 3D Model
    fet_comp = [
        ("TO220PowerMOSFETPackage", create_box, (0.4, 0.6, 0.15), [-0.2, 0.1, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("ExtrudedAluminumHeatSinkFins", create_box, (0.5, 0.7, 0.35), [-0.2, 0.1, -0.25], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("JFETGateSourceTerminal", create_cylinder, (0.04, 0.4, 16), [0.3, -0.2, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("GateBiasPotentiometerDial", create_cylinder, (0.18, 0.15, 20), [0.4, 0.2, 0.0], [0.7071, 0, 0, 0.7071], [0.15, 0.65, 0.95, 1.0]),
    ]
    build_glb(fet_comp, "frontend/models/fet_mosfet_characteristics.glb")

    # 7. Karnaugh Map (K-Map) Minimization 3D Model
    kmap_comp = [
        ("KMap4VariableGridArray", create_box, (1.1, 1.1, 0.12), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("IlluminatedLogicCellSwitches", create_box, (0.2, 0.2, 0.08), [-0.25, 0.25, 0.08], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("SubcubeGroupingIndicatorLEDs", create_cylinder, (0.06, 0.1, 16), [0.25, 0.25, 0.08], [0.7071, 0, 0, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("SOPBooleanOutputDisplay", create_box, (0.9, 0.25, 0.1), [0.0, -0.7, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(kmap_comp, "frontend/models/kmap_boolean_minimization.glb")

    # 8. Multiplexer, DEMUX & Decoder IC 3D Model
    mux_comp = [
        ("DIP16MultiplexerICPackage", create_box, (1.2, 0.2, 0.45), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("BinaryChannelSelectSwitches", create_box, (0.1, 0.2, 0.08), [-0.3, 0.2, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("SevenSegmentLEDNumericDisplay", create_box, (0.35, 0.5, 0.1), [0.5, 0.2, 0.0], [0, 0, 0, 1], [0.95, 0.15, 0.15, 1.0]),
        ("ActiveLowChipEnablePins", create_cylinder, (0.03, 0.25, 16), [-0.4, -0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(mux_comp, "frontend/models/multiplexer_demux_decoder_ic.glb")

    # 9. Flip-Flops, Counters & Registers 3D Model
    ff_comp = [
        ("MasterSlaveJKFlipFlopIC", create_box, (1.1, 0.18, 0.4), [-0.2, 0.1, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("FourBitRippleCounterModule", create_box, (0.8, 0.3, 0.5), [0.3, -0.2, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ClockPulse555TimerUnit", create_cylinder, (0.15, 0.25, 16), [-0.5, -0.2, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("FourBitRegisterLEDOutputBar", create_cylinder, (0.05, 0.1, 16), [0.2, 0.25, 0.0], [0.7071, 0, 0, 0.7071], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(ff_comp, "frontend/models/flipflops_counters_registers.glb")

    # 10. DAC & ADC Converters 3D Model
    dac_comp = [
        ("R2RLadderResistorNetwork", create_box, (1.2, 0.2, 0.35), [-0.2, 0.1, 0.0], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("FastVoltageComparatorArray", create_box, (0.5, 0.25, 0.4), [0.4, 0.1, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("SARLogicControlRegister", create_box, (0.6, 0.2, 0.35), [0.0, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("SampleAndHoldAnalogInputStage", create_cylinder, (0.12, 0.3, 16), [-0.5, -0.3, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
    ]
    build_glb(dac_comp, "frontend/models/dac_adc_converters.glb")

    # 11. Transformer Equivalent Circuit & Regulation 3D Model
    tx_comp = [
        ("LaminatedSiliconSteelCore", create_box, (1.1, 1.1, 0.35), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.35, 0.38, 0.42, 1.0]),
        ("PrimaryHighVoltageWinding", create_cylinder, (0.28, 0.8, 20), [-0.3, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("SecondaryLowVoltageWinding", create_cylinder, (0.28, 0.8, 20), [0.3, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("MultiTapTerminalBushingPost", create_cylinder, (0.06, 0.3, 16), [0.0, 0.7, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(tx_comp, "frontend/models/transformer_equivalent_circuit_regulation.glb")

    # 12. DC Generator Characteristics & EMF 3D Model
    dcg_comp = [
        ("CastSteelGeneratorFrameYoke", create_cylinder, (0.5, 0.6, 24), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.22, 0.28, 0.36, 1.0]),
        ("FieldStatorPolesExcitationCoils", create_box, (0.2, 0.3, 0.4), [0.0, 0.3, 0.0], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("SlottedArmatureRotorWindings", create_cylinder, (0.32, 0.5, 20), [0.0, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 1.0]),
        ("CommutatorCarbonBrushGear", create_cylinder, (0.18, 0.2, 16), [0.0, 0.0, 0.35], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(dcg_comp, "frontend/models/dc_generator_characteristics_emf.glb")


if __name__ == "__main__":
    generate_all()
