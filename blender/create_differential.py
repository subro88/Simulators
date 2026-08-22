"""
Blender Procedural Differential Generator
=========================================
Run inside Blender headless:
  blender --background --python blender/create_differential.py -- frontend/models/differential.glb
"""

import sys
import math
from pathlib import Path

try:
    import bpy
    import bmesh
except ImportError:
    print("This script is intended to run inside Blender (bpy).")
    print("For standalone GLB generation, use blender/generate_glb.py.")
    sys.exit(0)


def clear_scene():
    """Clear default cube, lights, and cameras."""
    bpy.ops.wm.read_factory_settings(use_empty=True)


def create_material(name, color_hex, metallic=0.7, roughness=0.3):
    """Create a PBR metallic material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        # Convert hex to RGBA
        r = int(color_hex[1:3], 16) / 255.0
        g = int(color_hex[3:5], 16) / 255.0
        b = int(color_hex[5:7], 16) / 255.0
        bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
        bsdf.inputs['Metallic'].default_value = metallic
        bsdf.inputs['Roughness'].default_value = roughness
    return mat


def build_differential_assembly(output_path: str):
    clear_scene()

    # Materials
    mat_crown = create_material("MatCrown", "#29b6f6", metallic=0.8, roughness=0.25)
    mat_pinion = create_material("MatPinion", "#ff9800", metallic=0.85, roughness=0.25)
    mat_spider = create_material("MatSpider", "#ffd600", metallic=0.75, roughness=0.3)
    mat_sun = create_material("MatSun", "#3ddc84", metallic=0.8, roughness=0.25)
    mat_steel = create_material("MatSteel", "#8899aa", metallic=0.9, roughness=0.2)
    mat_rubber = create_material("MatRubber", "#22252a", metallic=0.1, roughness=0.8)
    mat_carrier = create_material("MatCarrier", "#1f2535", metallic=0.6, roughness=0.4)

    # 1. Drive Pinion (Input gear from propeller shaft)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.35, depth=0.8, location=(0, -1.8, 0))
    pinion = bpy.context.active_object
    pinion.name = "DrivePinion"
    pinion.rotation_euler = (math.pi / 2, 0, 0)
    pinion.data.materials.append(mat_pinion)

    # 2. Crown Wheel (Ring Gear mounted to Carrier)
    bpy.ops.mesh.primitive_torus_add(major_radius=1.4, minor_radius=0.22, location=(0, 0, 0))
    crown = bpy.context.active_object
    crown.name = "CrownWheel"
    crown.rotation_euler = (0, math.pi / 2, 0)
    crown.data.materials.append(mat_crown)

    # 3. Differential Carrier (Housing holding cross-pin)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.55, depth=0.6, location=(0, 0, 0))
    carrier = bpy.context.active_object
    carrier.name = "DifferentialCarrier"
    carrier.rotation_euler = (0, 0, math.pi / 2)
    carrier.data.materials.append(mat_carrier)

    # 4. Cross Pin (Shaft for spider gears)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=1.6, location=(0, 0, 0))
    pin = bpy.context.active_object
    pin.name = "CrossPin"
    pin.data.materials.append(mat_steel)
    pin.parent = carrier

    # 5. Top Spider Gear (Planet Pinion)
    bpy.ops.mesh.primitive_cone_add(radius1=0.32, radius2=0.1, depth=0.45, location=(0, 0.65, 0))
    spider_top = bpy.context.active_object
    spider_top.name = "SpiderGear_Top"
    spider_top.rotation_euler = (0, 0, 0)
    spider_top.data.materials.append(mat_spider)
    spider_top.parent = carrier

    # 6. Bottom Spider Gear (Planet Pinion)
    bpy.ops.mesh.primitive_cone_add(radius1=0.32, radius2=0.1, depth=0.45, location=(0, -0.65, 0))
    spider_bot = bpy.context.active_object
    spider_bot.name = "SpiderGear_Bottom"
    spider_bot.rotation_euler = (math.pi, 0, 0)
    spider_bot.data.materials.append(mat_spider)
    spider_bot.parent = carrier

    # 7. Left Sun Gear (Side Bevel Gear)
    bpy.ops.mesh.primitive_cone_add(radius1=0.48, radius2=0.15, depth=0.55, location=(-1.15, 0, 0))
    sun_left = bpy.context.active_object
    sun_left.name = "SunGear_Left"
    sun_left.rotation_euler = (0, 0, math.pi / 2)
    sun_left.data.materials.append(mat_sun)

    # 8. Right Sun Gear (Side Bevel Gear)
    bpy.ops.mesh.primitive_cone_add(radius1=0.48, radius2=0.15, depth=0.55, location=(1.15, 0, 0))
    sun_right = bpy.context.active_object
    sun_right.name = "SunGear_Right"
    sun_right.rotation_euler = (0, 0, -math.pi / 2)
    sun_right.data.materials.append(mat_sun)

    # 9. Left Axle Half-Shaft
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=2.0, location=(-2.2, 0, 0))
    axle_left = bpy.context.active_object
    axle_left.name = "Axle_Left"
    axle_left.rotation_euler = (0, 0, math.pi / 2)
    axle_left.data.materials.append(mat_steel)
    axle_left.parent = sun_left

    # 10. Right Axle Half-Shaft
    bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=2.0, location=(2.2, 0, 0))
    axle_right = bpy.context.active_object
    axle_right.name = "Axle_Right"
    axle_right.rotation_euler = (0, 0, math.pi / 2)
    axle_right.data.materials.append(mat_steel)
    axle_right.parent = sun_right

    # 11. Left Wheel & Tyre
    bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=0.5, location=(-3.2, 0, 0))
    wheel_left = bpy.context.active_object
    wheel_left.name = "Wheel_Left"
    wheel_left.rotation_euler = (0, 0, math.pi / 2)
    wheel_left.data.materials.append(mat_rubber)
    wheel_left.parent = axle_left

    # 12. Right Wheel & Tyre
    bpy.ops.mesh.primitive_cylinder_add(radius=0.9, depth=0.5, location=(3.2, 0, 0))
    wheel_right = bpy.context.active_object
    wheel_right.name = "Wheel_Right"
    wheel_right.rotation_euler = (0, 0, math.pi / 2)
    wheel_right.data.materials.append(mat_rubber)
    wheel_right.parent = axle_right

    # Export to GLTF Binary (.glb)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_yup=True,
        export_apply=False
    )
    print(f"Exported Differential GLB to {output_path}")


if __name__ == "__main__":
    out_file = sys.argv[-1] if len(sys.argv) > 1 and sys.argv[-1].endswith(".glb") else "frontend/models/differential.glb"
    build_differential_assembly(out_file)
