"""
Binary glTF (.glb) Generator for WBSCTE Electronics & Telecommunication Engineering 4th Semester Tools
======================================================================================================
Generates 12 3D assets for ETCE 4th Sem:
- frontend/models/am_fm_modulation_demodulation.glb
- frontend/models/superheterodyne_radio_receiver.glb
- frontend/models/pulse_code_modulation_sampling.glb
- frontend/models/feedback_amplifiers_topologies.glb
- frontend/models/rc_lc_crystal_oscillators.glb
- frontend/models/schmitt_trigger_comparators.glb
- frontend/models/ic555_multivibrators.glb
- frontend/models/audio_crossover_loudspeakers.glb
- frontend/models/color_tv_composite_video.glb
- frontend/models/intel8085_microprocessor_simulator.glb
- frontend/models/microprocessor_memory_interfacing.glb
- frontend/models/ppi_8255_interfacing_io.glb
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
        "asset": {"version": "2.0", "generator": "NHIT ETCE 4th Sem GLB Engine"},
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
    # 1. AM & FM Modulation / Demodulation 3D Model
    am_comp = [
        ("RFSignalGeneratorChassis", create_box, (1.4, 0.8, 0.6), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.22, 0.32, 1.0]),
        ("ModulatedOscilloscopeScreen", create_box, (0.7, 0.5, 0.05), [-0.25, 0.08, 0.32], [0, 0, 0, 1], [0.10, 0.75, 0.45, 1.0]),
        ("ModulationIndexDialKnob", create_cylinder, (0.12, 0.15, 20), [0.4, 0.1, 0.32], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("CarrierOscillatorTuningTank", create_cylinder, (0.15, 0.25, 16), [0.4, -0.2, 0.32], [0.7071, 0, 0, 0.7071], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(am_comp, "frontend/models/am_fm_modulation_demodulation.glb")

    # 2. Superheterodyne Radio Receiver 3D Model
    superhet_comp = [
        ("SuperheterodyneRFFrontEndChassis", create_box, (1.5, 0.5, 0.9), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.28, 0.36, 1.0]),
        ("IFCanShieldTransformer455kHz", create_box, (0.3, 0.45, 0.3), [-0.4, 0.35, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("LocalOscillatorGangedCapacitor", create_cylinder, (0.22, 0.3, 20), [0.1, 0.3, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("AudioEnvelopeDetectorDiode", create_cylinder, (0.06, 0.35, 16), [0.5, 0.2, 0.0], [0, 0, 0.7071, 0.7071], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(superhet_comp, "frontend/models/superheterodyne_radio_receiver.glb")

    # 3. Pulse Code Modulation (PCM) & Sampling 3D Model
    pcm_comp = [
        ("PCMEncoderTrainerUnit", create_box, (1.4, 0.6, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.25, 0.35, 1.0]),
        ("SampleAndHoldClockModule", create_box, (0.35, 0.25, 0.25), [-0.4, 0.15, 0.2], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("FlashADCQuantizerBlock", create_box, (0.4, 0.25, 0.25), [0.1, 0.15, 0.2], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("SerialBitStreamTransceiver", create_cylinder, (0.08, 0.2, 16), [0.5, 0.15, 0.2], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(pcm_comp, "frontend/models/pulse_code_modulation_sampling.glb")

    # 4. Negative Feedback Amplifiers 3D Model
    feedback_comp = [
        ("DiscreteBJTAmplifierPCB", create_box, (1.3, 0.08, 0.9), [0.0, -0.2, 0.0], [0, 0, 0, 1], [0.10, 0.45, 0.25, 1.0]),
        ("BetaFeedbackResistorNetwork", create_box, (0.4, 0.15, 0.2), [0.0, 0.0, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("InputComparisonSummingNode", create_cylinder, (0.1, 0.2, 16), [-0.4, 0.05, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("StabilizedVoltageOutputTerminal", create_cylinder, (0.06, 0.3, 16), [0.45, 0.05, 0.0], [0, 0, 0, 1], [0.95, 0.20, 0.15, 1.0]),
    ]
    build_glb(feedback_comp, "frontend/models/feedback_amplifiers_topologies.glb")

    # 5. RC, LC & Crystal Oscillators 3D Model
    osc_comp = [
        ("HermeticQuartzCrystalHC49", create_box, (0.4, 0.5, 0.18), [-0.4, 0.1, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("WienBridgeLeadLagNetwork", create_box, (0.4, 0.2, 0.3), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("HartleyTappedInductorTank", create_cylinder, (0.18, 0.35, 20), [0.4, 0.1, 0.0], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("FeedbackGainTrimmerPot", create_cylinder, (0.1, 0.15, 16), [0.0, 0.25, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(osc_comp, "frontend/models/rc_lc_crystal_oscillators.glb")

    # 6. Schmitt Trigger & Comparators 3D Model
    schmitt_comp = [
        ("DIP8OpAmpIC741Package", create_box, (0.6, 0.2, 0.4), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("PositiveFeedbackVoltageDivider", create_cylinder, (0.05, 0.4, 16), [-0.3, 0.0, 0.2], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("ThresholdReferenceBiasSource", create_box, (0.35, 0.25, 0.2), [0.3, 0.0, -0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("SaturatedBistableOutputTerminal", create_cylinder, (0.05, 0.25, 16), [0.4, 0.0, 0.1], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(schmitt_comp, "frontend/models/schmitt_trigger_comparators.glb")

    # 7. IC 555 Timer Multivibrators 3D Model
    timer_comp = [
        ("NE555TimerICDIP8Package", create_box, (0.6, 0.22, 0.4), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("ExternalTimingResistorsRARB", create_cylinder, (0.05, 0.45, 16), [-0.35, 0.0, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
        ("TimingElectrolyticCapacitorC", create_cylinder, (0.16, 0.45, 16), [0.35, 0.05, 0.0], [0, 0, 0, 1], [0.15, 0.45, 0.85, 1.0]),
        ("Pin3SquareWaveOutputDriver", create_cylinder, (0.04, 0.2, 16), [0.0, 0.2, 0.15], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
    ]
    build_glb(timer_comp, "frontend/models/ic555_multivibrators.glb")

    # 8. Audio Crossover & Loudspeakers 3D Model
    audio_comp = [
        ("Loudspeaker3WayCrossoverChassis", create_box, (1.2, 0.9, 0.8), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.22, 0.18, 0.14, 1.0]),
        ("AirCoreLowPassWooferInductor", create_cylinder, (0.28, 0.2, 20), [-0.3, -0.1, 0.2], [0, 0, 0, 1], [0.95, 0.55, 0.15, 1.0]),
        ("NonPolarizedHighPassCapacitor", create_box, (0.25, 0.3, 0.15), [0.3, 0.1, 0.2], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("MovingCoilDomeTweeterWoofer", create_cylinder, (0.35, 0.15, 24), [0.0, 0.2, 0.4], [0.7071, 0, 0, 0.7071], [0.12, 0.15, 0.20, 1.0]),
    ]
    build_glb(audio_comp, "frontend/models/audio_crossover_loudspeakers.glb")

    # 9. Color TV Composite Video 3D Model
    tv_comp = [
        ("ShadowMaskCRTPictureTube", create_box, (1.3, 0.9, 1.0), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.15, 0.18, 0.22, 1.0]),
        ("ElectronGunTriadRGBAssembly", create_cylinder, (0.16, 0.6, 16), [0.0, 0.0, -0.6], [0.7071, 0, 0, 0.7071], [0.95, 0.45, 0.15, 1.0]),
        ("LineDeflectionYokeCoil", create_cylinder, (0.3, 0.35, 20), [0.0, 0.0, -0.2], [0.7071, 0, 0, 0.7071], [0.95, 0.80, 0.15, 1.0]),
        ("VideoLuminanceProcessingPCB", create_box, (0.9, 0.08, 0.6), [0.0, -0.5, 0.0], [0, 0, 0, 1], [0.10, 0.45, 0.25, 1.0]),
    ]
    build_glb(tv_comp, "frontend/models/color_tv_composite_video.glb")

    # 10. Intel 8085 Microprocessor Simulator 3D Model
    cpu_comp = [
        ("DIP40Intel8085CPUPackage", create_box, (1.6, 0.22, 0.55), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("CrystalClockResonator6MHz", create_cylinder, (0.08, 0.3, 16), [-0.6, 0.2, 0.0], [0, 0, 0, 1], [0.85, 0.88, 0.92, 1.0]),
        ("DemuxAddressLatch74LS373", create_box, (0.8, 0.18, 0.4), [0.3, -0.25, 0.0], [0, 0, 0, 1], [0.15, 0.25, 0.35, 1.0]),
        ("StatusFlagIndicatorLEDs", create_cylinder, (0.04, 0.1, 16), [0.0, 0.18, 0.15], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
    ]
    build_glb(cpu_comp, "frontend/models/intel8085_microprocessor_simulator.glb")

    # 11. Microprocessor Memory & I/O Interfacing 3D Model
    mem_comp = [
        ("StaticRAM6116ICPackage", create_box, (1.1, 0.2, 0.45), [-0.3, 0.15, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("EPROM2716WithQuartzWindow", create_box, (1.1, 0.2, 0.45), [-0.3, -0.2, 0.0], [0, 0, 0, 1], [0.25, 0.45, 0.65, 1.0]),
        ("AddressDecoder74LS138", create_box, (0.7, 0.18, 0.35), [0.5, 0.0, 0.0], [0, 0, 0, 1], [0.95, 0.45, 0.15, 1.0]),
        ("SystemBusRibbonConnector", create_box, (1.6, 0.05, 0.8), [0.0, -0.4, 0.0], [0, 0, 0, 1], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(mem_comp, "frontend/models/microprocessor_memory_interfacing.glb")

    # 12. Programmable Peripheral Interface (8255 PPI) 3D Model
    ppi_comp = [
        ("DIP40PPI8255ICPackage", create_box, (1.6, 0.22, 0.55), [0.0, 0.0, 0.0], [0, 0, 0, 1], [0.12, 0.15, 0.20, 1.0]),
        ("PortALogicInputSwitches", create_box, (0.6, 0.15, 0.15), [-0.4, 0.25, 0.0], [0, 0, 0, 1], [0.95, 0.80, 0.15, 1.0]),
        ("PortBLEDOutputDisplayBar", create_cylinder, (0.05, 0.1, 16), [0.4, 0.25, 0.0], [0.7071, 0, 0, 0.7071], [0.0, 0.9, 0.4, 1.0]),
        ("PortCHandshakeControlLines", create_cylinder, (0.03, 0.3, 16), [0.0, -0.25, 0.0], [0, 0, 0.7071, 0.7071], [0.38, 0.74, 0.97, 1.0]),
    ]
    build_glb(ppi_comp, "frontend/models/ppi_8255_interfacing_io.glb")


if __name__ == "__main__":
    generate_all()
