"""
Standalone Binary glTF (.glb) Procedural Generator for Batch 6
===============================================================
Generates 65 binary .glb models in frontend/models/ covering:
- Sub-Suite A: 20 Manufacturing Technology Tools
- Sub-Suite B: 18 Civil & Structural Engineering Tools
- Sub-Suite C: 15 Physics & Applied Science Tools
- Sub-Suite D: 12 Metrology, Quality & Production Management Tools
"""

import os
import struct
import json
import math

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "models")
os.makedirs(OUTPUT_DIR, exist_ok=True)

BATCH6_GLB_NAMES = [
    # Sub-Suite A: Manufacturing (1-20)
    "lathe_turning", "milling_cutting", "drilling_mechanics", "grinding_wheel",
    "sheet_metal_bending", "punching_blanking", "metal_casting", "welding_heat_input",
    "injection_molding", "additive_3d_printing", "cnc_gcode_machining", "powder_metallurgy",
    "metal_forging", "metal_extrusion", "wire_drawing", "edm_machining",
    "laser_beam_cutting", "waterjet_cutting", "plastic_thermoforming", "die_casting_high_pressure",
    # Sub-Suite B: Civil & Structural (21-38)
    "concrete_mix_design", "soil_bearing_capacity", "retaining_wall_stability", "truss_structural_analysis",
    "surveying_leveling", "pavement_design_flex", "hydrology_rational_runoff", "open_channel_manning",
    "seismic_base_shear", "steel_bolted_connection", "steel_welded_connection", "slope_stability_bishop",
    "consolidation_settlement", "shear_strength_direct", "concrete_beam_rc", "column_rc_design",
    "stormwater_pipe_sizing", "traffic_flow_greenshields",
    # Sub-Suite C: Physics & Science (39-53)
    "geometrical_optics_lens", "wave_interference_young", "doppler_effect_sound", "photoelectric_effect",
    "radioactive_decay", "projectile_motion", "electrostatics_coulomb", "electromagnetic_induction",
    "fluid_statics_manometer", "sound_decibel_attenuation", "blackbody_radiation_wien", "special_relativity_lorentz",
    "heat_conduction_transient", "viscous_fluid_poiseuille", "rotational_inertia_tensor",
    # Sub-Suite D: Metrology & Quality (54-65)
    "vernier_caliper_micrometer", "surface_roughness_profilometer", "coordinate_measuring_machine", "spc_control_charts",
    "iso_tolerance_fits", "hardness_testing_rockwell", "ndt_ultrasonic_testing", "sine_bar_angle_measurement",
    "optical_interferometer_flatness", "economic_order_quantity", "line_balancing_takt_time", "overall_equipment_effectiveness"
]


def create_cube_mesh():
    """Generates a standard 1x1x1 cube with positions, normals, and indices."""
    positions = [
        # Front
        -0.5, -0.5,  0.5,   0.5, -0.5,  0.5,   0.5,  0.5,  0.5,  -0.5,  0.5,  0.5,
        # Back
        -0.5, -0.5, -0.5,  -0.5,  0.5, -0.5,   0.5,  0.5, -0.5,   0.5, -0.5, -0.5,
        # Top
        -0.5,  0.5, -0.5,  -0.5,  0.5,  0.5,   0.5,  0.5,  0.5,   0.5,  0.5, -0.5,
        # Bottom
        -0.5, -0.5, -0.5,   0.5, -0.5, -0.5,   0.5, -0.5,  0.5,  -0.5, -0.5,  0.5,
        # Right
         0.5, -0.5, -0.5,   0.5,  0.5, -0.5,   0.5,  0.5,  0.5,   0.5, -0.5,  0.5,
        # Left
        -0.5, -0.5, -0.5,  -0.5, -0.5,  0.5,  -0.5,  0.5,  0.5,  -0.5,  0.5, -0.5,
    ]

    normals = [
         0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,   0.0,  0.0,  1.0,
         0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,   0.0,  0.0, -1.0,
         0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,   0.0,  1.0,  0.0,
         0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,   0.0, -1.0,  0.0,
         1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,   1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,  -1.0,  0.0,  0.0,
    ]

    indices = [
         0,  1,  2,   0,  2,  3,
         4,  5,  6,   4,  6,  7,
         8,  9, 10,   8, 10, 11,
        12, 13, 14,  12, 14, 15,
        16, 17, 18,  16, 18, 19,
        20, 21, 22,  20, 22, 23
    ]
    return positions, normals, indices


def build_glb_bytes(mesh_name: str, color_rgb=(0.2, 0.6, 0.9)) -> bytes:
    positions, normals, indices = create_cube_mesh()

    pos_bytes = b"".join(struct.pack("<fff", *positions[i:i+3]) for i in range(0, len(positions), 3))
    norm_bytes = b"".join(struct.pack("<fff", *normals[i:i+3]) for i in range(0, len(normals), 3))
    idx_bytes = b"".join(struct.pack("<H", idx) for idx in indices)

    pos_byte_len = len(pos_bytes)
    norm_byte_len = len(norm_bytes)
    idx_byte_len = len(idx_bytes)

    # Pad index bytes to 4-byte boundary
    idx_padded_len = (idx_byte_len + 3) & ~3
    idx_bytes += b"\x00" * (idx_padded_len - idx_byte_len)

    buffer_data = pos_bytes + norm_bytes + idx_bytes

    # Min / Max bounds
    min_x = min(positions[0::3]); max_x = max(positions[0::3])
    min_y = min(positions[1::3]); max_y = max(positions[1::3])
    min_z = min(positions[2::3]); max_z = max(positions[2::3])

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "Batch6GLBGenerator"},
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": mesh_name}],
        "meshes": [{
            "name": mesh_name,
            "primitives": [{
                "attributes": {"POSITION": 0, "NORMAL": 1},
                "indices": 2,
                "material": 0
            }]
        }],
        "materials": [{
            "name": f"{mesh_name}_Mat",
            "pbrMetallicRoughness": {
                "baseColorFactor": [color_rgb[0], color_rgb[1], color_rgb[2], 1.0],
                "metallicFactor": 0.3,
                "roughnessFactor": 0.4
            }
        }],
        "buffers": [{"byteLength": len(buffer_data)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": pos_byte_len, "target": 34962},
            {"buffer": 0, "byteOffset": pos_byte_len, "byteLength": norm_byte_len, "target": 34962},
            {"buffer": 0, "byteOffset": pos_byte_len + norm_byte_len, "byteLength": idx_byte_len, "target": 34963}
        ],
        "accessors": [
            {"bufferView": 0, "byteOffset": 0, "componentType": 5126, "count": 24, "type": "VEC3", "min": [min_x, min_y, min_z], "max": [max_x, max_y, max_z]},
            {"bufferView": 1, "byteOffset": 0, "componentType": 5126, "count": 24, "type": "VEC3"},
            {"bufferView": 2, "byteOffset": 0, "componentType": 5123, "count": 36, "type": "SCALAR"}
        ]
    }

    json_str = json.dumps(gltf_dict, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')
    json_padded_len = (len(json_bytes) + 3) & ~3
    json_bytes += b' ' * (json_padded_len - len(json_bytes))

    bin_padded_len = (len(buffer_data) + 3) & ~3
    bin_data = buffer_data + b'\x00' * (bin_padded_len - len(buffer_data))

    total_length = 12 + 8 + json_padded_len + 8 + bin_padded_len

    header = struct.pack("<I I I", 0x46546C67, 2, total_length)  # glTF magic 0x46546C67, version 2
    json_header = struct.pack("<I I", json_padded_len, 0x4E4F534A)  # JSON chunk 0x4E4F534A
    bin_header = struct.pack("<I I", bin_padded_len, 0x00414E49)   # BIN chunk 0x00414E49

    return header + json_header + json_bytes + bin_header + bin_data


def generate_batch6_glbs():
    print(f"Generating 65 Batch 6 3D GLB models in {OUTPUT_DIR}...")
    for idx, name in enumerate(BATCH6_GLB_NAMES, 1):
        filename = f"{name}.glb"
        filepath = os.path.join(OUTPUT_DIR, filename)

        # Color coding by sub-suite
        if idx <= 20:
            color = (0.9, 0.4, 0.2)  # Manufacturing: Industrial Amber
        elif idx <= 38:
            color = (0.2, 0.7, 0.4)  # Civil: Structural Emerald Green
        elif idx <= 53:
            color = (0.2, 0.5, 0.9)  # Physics & Science: Electric Blue
        else:
            color = (0.8, 0.3, 0.8)  # Metrology & Quality: Precision Purple

        glb_data = build_glb_bytes(name, color)
        with open(filepath, "wb") as f:
            f.write(glb_data)
        print(f" [{idx:02d}/65] Saved {filename} ({len(glb_data)} bytes)")

    print("Successfully generated all 65 Batch 6 3D GLB models!")


if __name__ == "__main__":
    generate_batch6_glbs()
