"""
Binary glTF (.glb) Generator for WBSCTE Electronics & Telecommunication Engineering 5th Semester Tools
======================================================================================================
Generates 12 3D assets for ETCE 5th Sem:
- frontend/models/digital_modulation_ask_psk_qam.glb
- frontend/models/rectangular_waveguide_modes.glb
- frontend/models/reflex_klystron_magnetron.glb
- frontend/models/radar_range_doppler_antenna.glb
- frontend/models/maxwell_schering_ac_bridges.glb
- frontend/models/heterodyne_spectrum_analyzer.glb
- frontend/models/scr_two_transistor_commutation.glb
- frontend/models/single_phase_full_wave_scr_bridge.glb
- frontend/models/dc_dc_buck_boost_converters.glb
- frontend/models/microcontroller_8051_timers_uart.glb
- frontend/models/lcd_keypad_8051_interfacing.glb
- frontend/models/dsp_discrete_fourier_fft_fir.glb
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
        "asset": {"version": "2.0", "generator": "NHIT ETCE 5th Sem GLB Engine"},
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
    # 1. Digital Modulation (ASK, PSK, QAM) 3D Model
    mod_comp = [
        ("DigitalModulatorChassis", create_box, (1.4, 0.7, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("IQConstellationDisplayScreen", create_box, (0.6, 0.5, 0.05), [-0.25, 0.05, 0.42], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("CarrierPhaseShifterMultiplier", create_box, (0.35, 0.3, 0.2), [0.35, 0.1, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("VectorSignalAnalyzerBNC", create_cylinder, (0.06, 0.2, 16), [0.35, -0.2, 0.42], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(mod_comp, "frontend/models/digital_modulation_ask_psk_qam.glb")

    # 2. Rectangular Waveguide Modes 3D Model
    wg_comp = [
        ("WR90RectangularWaveguideTube", create_box, (1.6, 0.3, 0.6), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("PrecisionChokeFlangeCoupler", create_box, (0.5, 0.5, 0.1), [-0.75, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("SlottedLineProbeCarriage", create_box, (0.25, 0.35, 0.25), [0.1, 0.25, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("MatchedLoadTerminationWedge", create_box, (0.4, 0.2, 0.4), [0.7, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
    ]
    build_glb(wg_comp, "frontend/models/rectangular_waveguide_modes.glb")

    # 3. Reflex Klystron & Magnetron 3D Model
    klys_comp = [
        ("ReflexKlystronResonantCavity", create_cylinder, (0.35, 0.7, 24), [-0.35, 0.0, 0.0], [0, 0, 0, 1], [0.85, 0.75, 0.25, 1.0]),
        ("RepellerElectrodeTerminalPost", create_cylinder, (0.1, 0.3, 16), [-0.35, 0.45, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
        ("CavityMagnetronAnodeBlock", create_cylinder, (0.38, 0.5, 24), [0.4, 0.0, 0.0], [0.7071, 0, 0, 0.7071], [0.35, 0.38, 0.42, 1.0]),
        ("PermanentMagnetPoleYoke", create_box, (0.5, 0.65, 0.3), [0.4, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
    ]
    build_glb(klys_comp, "frontend/models/reflex_klystron_magnetron.glb")

    # 4. Radar Range, Doppler & Antennas 3D Model
    radar_comp = [
        ("ParabolicDishReflectorAntenna", create_cylinder, (0.6, 0.15, 24), [0.0, 0.2, -0.2], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
        ("WaveguideFeedHornSubreflector", create_box, (0.15, 0.15, 0.3), [0.0, 0.2, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("RadarPedestalAzimuthRotator", create_cylinder, (0.25, 0.4, 20), [0.0, -0.25, -0.2], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("DopplerTransceiverFrontEnd", create_box, (0.4, 0.25, 0.3), [0.0, -0.45, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
    ]
    build_glb(radar_comp, "frontend/models/radar_range_doppler_antenna.glb")

    # 5. Maxwell & Schering AC Bridges 3D Model
    bridge_comp = [
        ("ACBridgeMainChassis", create_box, (1.4, 0.3, 0.9), [0.0, -0.15, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("DecadeCapacitorResistanceBox", create_box, (0.5, 0.25, 0.4), [-0.35, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("NullDetectorMicroammeter", create_cylinder, (0.18, 0.15, 20), [0.35, 0.1, 0.0], [0.7071, 0, 0, 0.7071], [0.10, 0.75, 0.45, 1.0]),
        ("OscillatorSource1kHzTerminals", create_cylinder, (0.05, 0.2, 16), [0.0, 0.1, 0.3], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(bridge_comp, "frontend/models/maxwell_schering_ac_bridges.glb")

    # 6. Heterodyne Spectrum Analyzer 3D Model
    spec_comp = [
        ("SpectrumAnalyzerMainframe", create_box, (1.5, 0.8, 0.9), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("CRTGraticuleSpectralDisplay", create_box, (0.7, 0.5, 0.05), [-0.28, 0.05, 0.47], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("SweptLocalOscillatorMixerDial", create_cylinder, (0.12, 0.15, 20), [0.4, 0.15, 0.47], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("RFInputPrecisionAttenuator", create_cylinder, (0.08, 0.2, 16), [0.4, -0.18, 0.47], [0.7071, 0, 0, 0.7071], [0.85, 0.88, 0.92, 1.0]),
    ]
    build_glb(spec_comp, "frontend/models/heterodyne_spectrum_analyzer.glb")

    # 7. SCR Two-Transistor Analogy & Commutation 3D Model
    scr_comp = [
        ("TO247HighPowerSCRPackage", create_box, (0.45, 0.65, 0.18), [-0.2, 0.1, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("RCSnubberCapacitorResistor", create_box, (0.35, 0.25, 0.2), [0.35, 0.15, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("CommutatingLCResonantChoke", create_cylinder, (0.16, 0.35, 20), [0.35, -0.2, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("GateTriggerPulseTransformer", create_box, (0.3, 0.25, 0.25), [-0.2, -0.3, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(scr_comp, "frontend/models/scr_two_transistor_commutation.glb")

    # 8. Single-Phase Full-Wave SCR Bridge 3D Model
    bridge_scr_comp = [
        ("FourThyristorBridgeChassis", create_box, (1.3, 0.4, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("ExtrudedHeatSinkCoolingFins", create_box, (1.1, 0.3, 0.4), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("InductiveRLLoadSmoothingChoke", create_cylinder, (0.2, 0.35, 20), [0.4, -0.2, 0.0], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("UJTFiringCircuitPulseBoard", create_box, (0.5, 0.1, 0.3), [-0.3, -0.2, 0.0], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
    ]
    build_glb(bridge_scr_comp, "frontend/models/single_phase_full_wave_scr_bridge.glb")

    # 9. DC-DC Buck-Boost Converters 3D Model
    buck_comp = [
        ("BuckBoostPowerToroidInductor", create_cylinder, (0.28, 0.25, 24), [-0.3, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("FastRecoverySchottkyDiode", create_cylinder, (0.08, 0.35, 16), [0.2, 0.15, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.20, 0.15, 1.0]),
        ("LowESRSmoothingCapacitor", create_cylinder, (0.18, 0.5, 20), [0.45, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("MOSFETSwitchingTransistorTO220", create_box, (0.3, 0.45, 0.15), [-0.3, 0.3, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
    ]
    build_glb(buck_comp, "frontend/models/dc_dc_buck_boost_converters.glb")

    # 10. 8051 Microcontroller Timers & UART 3D Model
    mcu_comp = [
        ("DIP40Microcontroller8051IC", create_box, (1.6, 0.22, 0.55), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("CrystalClockResonator11MHz", create_cylinder, (0.08, 0.3, 16), [-0.6, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("MAX232LevelShifterIC", create_box, (0.7, 0.18, 0.35), [0.35, -0.25, 0.0], [0, 0, 0, 1], [0.15, 0.25, 0.35, 1.0]),
        ("DB9SerialPortConnector", create_box, (0.45, 0.35, 0.3), [0.65, 0.15, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(mcu_comp, "frontend/models/microcontroller_8051_timers_uart.glb")

    # 11. LCD & Keypad 8051 Interfacing 3D Model
    lcd_comp = [
        ("HD44780AlphanumericLCDModule", create_box, (1.4, 0.5, 0.12), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.10, 0.45, 0.25, 1.0]),
        ("Matrix4x4KeypadPushbuttonArray", create_box, (0.8, 0.8, 0.1), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("ContrastTrimmerPotentiometer", create_cylinder, (0.08, 0.12, 16), [-0.55, -0.05, 0.0], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("RibbonWiringHarnessHeader", create_box, (1.2, 0.08, 0.15), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(lcd_comp, "frontend/models/lcd_keypad_8051_interfacing.glb")

    # 12. DSP Discrete Fourier, FFT & FIR Filters 3D Model
    dsp_comp = [
        ("TMS320C67xxDSPProcessorBoard", create_box, (1.4, 0.1, 1.0), [0.0, -0.15, 0.0], [0, 0, 0, 1], [0.10, 0.45, 0.25, 1.0]),
        ("StereoAudioCodecIC", create_box, (0.35, 0.15, 0.35), [-0.4, 0.0, 0.2], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("FlashMemoryFirmwareChip", create_box, (0.4, 0.15, 0.4), [0.35, 0.0, -0.2], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("LEDSpectrumBarIndicator", create_cylinder, (0.05, 0.1, 16), [0.0, 0.1, 0.35], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(dsp_comp, "frontend/models/dsp_discrete_fourier_fft_fir.glb")


if __name__ == "__main__":
    generate_all()
