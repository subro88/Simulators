"""
Procedural GLB generator for the Rivet Joint Designer (Batch 4 — Strength of Materials)
Saves a multi-node assembly: two overlapping plates + a grid of rivet cylinders.
Pure stdlib (no numpy) so it runs anywhere.
"""

import json
import struct
import math
from pathlib import Path


def create_box(length, width, thickness):
    hl, hw, ht = length / 2.0, width / 2.0, thickness / 2.0
    pts = [
        [-hl, -hw, -ht], [hl, -hw, -ht], [hl, hw, -ht], [-hl, hw, -ht],
        [-hl, -hw, ht], [hl, -hw, ht], [hl, hw, ht], [-hl, hw, ht],
    ]
    norms = [[0, 0, -1]] * 4 + [[0, 0, 1]] * 4
    faces = [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1,
             1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0]
    return pts, norms, faces


def create_cylinder(radius, height, segments=16):
    verts, nms, idxs = [], [], []
    hh = height / 2.0
    for i in range(segments):
        a = 2.0 * math.pi * i / segments
        x, z = radius * math.cos(a), radius * math.sin(a)
        verts += [[x, hh, z], [x, -hh, z]]
        nms += [[math.cos(a), 0, math.sin(a)]] * 2
    for i in range(segments):
        n = (i + 1) % segments
        t1, b1 = i * 2, i * 2 + 1
        t2, b2 = n * 2, n * 2 + 1
        idxs += [t1, b1, t2, t2, b1, b2]
    return verts, nms, idxs


def _rotate(pts, norms, rx, ry, rz):
    if rz:
        c, s = math.cos(rz), math.sin(rz)
        pts = [[p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]] for p in pts]
        norms = [[n[0] * c - n[1] * s, n[0] * s + n[1] * c, n[2]] for n in norms]
    if rx:
        c, s = math.cos(rx), math.sin(rx)
        pts = [[p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c] for p in pts]
        norms = [[n[0], n[1] * c - n[2] * s, n[1] * s + n[2] * c] for n in norms]
    return pts, norms


def export_generic_glb(components, output_path, generator_name):
    bin_buffer = bytearray()
    buffer_views, accessors, meshes, nodes, materials = [], [], [], [], []

    for name, func, args, pos, rot, color in components:
        verts, norms, indices = func(*args)
        verts, norms = _rotate(verts, norms, rot[0], rot[1], rot[2])

        def align():
            while len(bin_buffer) % 4:
                bin_buffer.extend(b"\x00")

        align()
        io = len(bin_buffer)
        bin_buffer.extend(struct.pack("<%dH" % len(indices), *indices))
        buffer_views.append({"buffer": 0, "byteOffset": io, "byteLength": len(indices) * 2, "target": 34963})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5123, "count": len(indices), "type": "SCALAR"})

        align()
        vo = len(bin_buffer)
        flat = [v for p in verts for v in p]
        bin_buffer.extend(struct.pack("<%df" % len(flat), *flat))
        xs = [p[0] for p in verts]; ys = [p[1] for p in verts]; zs = [p[2] for p in verts]
        buffer_views.append({"buffer": 0, "byteOffset": vo, "byteLength": len(flat) * 4, "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(verts), "type": "VEC3",
                          "min": [min(xs), min(ys), min(zs)], "max": [max(xs), max(ys), max(zs)]})

        align()
        no = len(bin_buffer)
        nflat = [v for p in norms for v in p]
        bin_buffer.extend(struct.pack("<%df" % len(nflat), *nflat))
        buffer_views.append({"buffer": 0, "byteOffset": no, "byteLength": len(nflat) * 4, "target": 34962})
        accessors.append({"bufferView": len(buffer_views) - 1, "byteOffset": 0, "componentType": 5126, "count": len(norms), "type": "VEC3"})

        materials.append({"name": f"Mat_{name}", "pbrMetallicRoughness": {"baseColorFactor": color, "metallicFactor": 0.85, "roughnessFactor": 0.28}})
        meshes.append({"name": f"Mesh_{name}", "primitives": [{"attributes": {"POSITION": len(accessors) - 2, "NORMAL": len(accessors) - 1}, "indices": len(accessors) - 3, "material": len(materials) - 1}]})
        nodes.append({"name": name, "mesh": len(meshes) - 1, "translation": pos})

    gltf = {
        "asset": {"version": "2.0", "generator": generator_name},
        "scenes": [{"name": "Scene", "nodes": list(range(len(nodes)))}],
        "scene": 0, "nodes": nodes, "meshes": meshes,
        "materials": materials, "accessors": accessors,
        "bufferViews": buffer_views, "buffers": [{"byteLength": len(bin_buffer)}],
    }
    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    while len(json_bytes) % 4:
        json_bytes += b" "
    while len(bin_buffer) % 4:
        bin_buffer.extend(b"\x00")

    total = 12 + 8 + len(json_bytes) + 8 + len(bin_buffer)
    with open(output_path, "wb") as f:
        f.write(struct.pack("<4sII", b"glTF", 2, total))
        f.write(struct.pack("<II", len(json_bytes), 0x4E4F534A))
        f.write(json_bytes)
        f.write(struct.pack("<II", len(bin_buffer), 0x004E4942))
        f.write(bin_buffer)
    print(f"Generated {generator_name} ({len(bin_buffer)} bytes) -> {output_path}")


def generate():
    comps = [
        ("PlateTop", create_box, (2.4, 1.4, 0.18), [0.0, 0.12, 0.0], [0, 0, 0], [0.75, 0.78, 0.82, 1.0]),
        ("PlateBottom", create_box, (2.4, 1.4, 0.18), [0.0, -0.12, 0.0], [0, 0, 0], [0.62, 0.66, 0.70, 1.0]),
    ]
    for r in range(2):
        for c in range(4):
            x = -0.9 + c * 0.6
            z = -0.35 + r * 0.7
            comps.append((f"Rivet_{r}_{c}", create_cylinder, (0.12, 0.42, 14), [x, 0.0, z], [math.pi / 2, 0, 0], [0.95, 0.65, 0.15, 1.0]))
    out = Path(__file__).resolve().parent.parent / "frontend" / "models" / "rivet_joint_designer.glb"
    out.parent.mkdir(parents=True, exist_ok=True)
    export_generic_glb(comps, str(out), "Rivet Joint Designer GLB Builder")


if __name__ == "__main__":
    generate()
