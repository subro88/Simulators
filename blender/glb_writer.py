"""Reusable, dependency-free GLB generator for NHIT VisualLab tools.

Builds a representative 3D assembly per tool slug and writes
frontend/models/<slug_underscored>.glb. Geometry is non-indexed
(per-face normals) so it stays robust without numpy.
"""
import struct, json, os, math, pathlib, sys

BASE = pathlib.Path(__file__).resolve().parent.parent
MODELS = BASE / "frontend" / "models"
MODELS.mkdir(parents=True, exist_ok=True)

# ----- low level geometry helpers (emit triangles: 9 floats pos, 9 floats nrm) -----

def _normal(a, b, c):
    ux, uy, uz = b[0]-a[0], b[1]-a[1], b[2]-a[2]
    vx, vy, vz = c[0]-a[0], c[1]-a[1], c[2]-a[2]
    nx, ny, nz = uy*vz-uz*vy, uz*vx-ux*vz, ux*vy-uy*vx
    L = math.sqrt(nx*nx+ny*ny+nz*nz) or 1.0
    return nx/L, ny/L, nz/L

def _tri(out, a, b, c):
    n = _normal(a, b, c)
    out.extend(a+b+c + n+n+n)

def box(out, w, h, d, p=(0,0,0), c=(0.55,0.62,0.72)):
    x0, y0, z0 = p[0]-w/2, p[1]-h/2, p[2]-d/2
    x1, y1, z1 = p[0]+w/2, p[1]+h/2, p[2]+d/2
    v = [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),
         (x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]
   # bottom, top, front, back, left, right
    _tri(out, v[0],v[1],v[2]); _tri(out, v[0],v[2],v[3])
    _tri(out, v[4],v[6],v[5]); _tri(out, v[4],v[7],v[6])
    _tri(out, v[0],v[4],v[5]); _tri(out, v[0],v[5],v[1])
    _tri(out, v[3],v[2],v[6]); _tri(out, v[3],v[6],v[7])
    _tri(out, v[1],v[5],v[6]); _tri(out, v[1],v[6],v[2])
    _tri(out, v[0],v[3],v[7]); _tri(out, v[0],v[7],v[4])

def cylinder(out, r, h, seg=20, p=(0,0,0), axis="y"):
    def pt(i, yy):
        a = 2*math.pi*i/seg
        return (r*math.cos(a), yy, r*math.sin(a))
    y0, y1 = p[1]-h/2, p[1]+h/2
    if axis == "x":
        def place(a,b,c):
            # rotate around x: swap y/z
            _tri(out,(b[2],b[1],-b[0]),(a[2],a[1],-a[0]),(c[2],c[1],-c[0]))
        base=[(pt(i,y0)[2],y0,-pt(i,y0)[0]) for i in range(seg)]
        top=[(pt(i,y1)[2],y1,-pt(i,y1)[0]) for i in range(seg)]
    else:
        base=[pt(i,y0) for i in range(seg)]; top=[pt(i,y1) for i in range(seg)]
    for i in range(seg):
        j=(i+1)%seg
        _tri(out, base[i], base[j], top[j]); _tri(out, base[i], top[j], top[i])
        # caps
        if axis=="x":
            _tri(out,(0,y0,0),(base[j][2],y0,-base[j][0]),(base[i][2],y0,-base[i][0]))
            _tri(out,(0,y1,0),(top[i][2],y1,-top[i][0]),(top[j][2],y1,-top[j][0]))
        else:
            _tri(out,(0,y0,0), base[j], base[i]); _tri(out,(0,y1,0), top[i], top[j])

def sphere(out, r, seg=14, p=(0,0,0)):
    for i in range(seg):
        for j in range(seg):
            a0,a1=2*math.pi*i/seg,2*math.pi*(i+1)/seg
            b0,b1=math.pi*j/seg,math.pi*(j+1)/seg
            def P(a,b):
                return (r*math.sin(b)*math.cos(a)+p[0], r*math.cos(b)+p[1], r*math.sin(b)*math.sin(a)+p[2])
            _tri(out, P(a0,b0), P(a1,b0), P(a1,b1)); _tri(out, P(a0,b0), P(a1,b1), P(a0,b1))

def helix(out, r, h, coils=6, seg=80, p=(0,0,0)):
    for i in range(seg):
        t0=i/seg; t1=(i+1)/seg
        a0,a1=2*math.pi*coils*t0,2*math.pi*coils*t1
        y0=p[1]-h/2+h*t0; y1=p[1]-h/2+h*t1
        c0=(r*math.cos(a0),y0,r*math.sin(a0)); c1=(r*math.cos(a1),y1,r*math.sin(a1))
        # small tube segment approximated as a thin box
        box(out, 0.05, 0.02, 0.05, c0); box(out, 0.05,0.02,0.05,c1)

def lattice(out, span, bars=4, p=(0,0,0)):
    # simple planar truss: top & bottom chords + diagonals
    w=span; h=span*0.4
    box(out, w, 0.06, 0.06, (p[0], p[1]+h/2, p[2]))
    box(out, w, 0.06, 0.06, (p[0], p[1]-h/2, p[2]))
    for i in range(bars+1):
        x=p[0]-w/2+w*i/bars
        box(out, 0.06, h, 0.06, (x, p[1], p[2]))
    for i in range(bars):
        x0=p[0]-w/2+w*i/bars; x1=p[0]-w/2+w*(i+1)/bars
        box(out, w/bars, 0.05, 0.05, ((x0+x1)/2, p[1]+ (h/2 if i%2==0 else -h/2), p[2]))
        box(out, w/bars, 0.05, 0.05, ((x0+x1)/2, p[1]+ (h/2 if i%2==1 else -h/2), p[2]))

def gear(out, r, teeth=12, h=0.3, p=(0,0,0)):
    cylinder(out, r, h, 28, p)
    for i in range(teeth):
        a=2*math.pi*i/teeth
        t=(r*math.cos(a), p[1], r*math.sin(a))
        box(out, 0.12, h, 0.12, t)

def build_scene(slug):
    s = slug.lower()
    out = []
    color=(0.55,0.62,0.72)
    # base plate for everything
    box(out, 2.2, 0.18, 1.6, (0,-1.0,0), (0.32,0.36,0.42))
    if "spring" in s:
        helix(out, 0.35, 1.2, 7, 80, (0,0.1,0))
    elif "gear" in s or "gear" in s:
        gear(out, 0.6, 14, 0.3, (0,0.1,0))
    elif "beam" in s or "bending" in s:
        box(out, 1.8, 0.14, 0.14, (0,0.1,0), (0.7,0.75,0.8))
    elif "vessel" in s or "tank" in s or "pressure" in s or "cylinder" in s:
        cylinder(out, 0.55, 1.6, 24, (0,0.1,0), "x")
        cylinder(out, 0.2,1.7,12,(0.9,0.1,0),"x")
    elif "shaft" in s or "torsion" in s:
        cylinder(out, 0.22, 1.8, 20, (0,0.1,0), "x")
        cylinder(out, 0.45,0.18,16,(0.7,0.1,0),"x")
    elif "truss" in s:
        lattice(out, 1.8, 5, (0,0.1,0))
    elif "rivet" in s or "bolt" in s or "weld" in s or "joint" in s:
        box(out, 1.0,0.12,0.7,(0,0.0,0),(0.6,0.64,0.7))
        cylinder(out, 0.18,0.5,16,(0.3,0.3,0)); cylinder(out,0.18,0.5,16,(-0.3,0.3,0))
    elif "pendulum" in s or "circle" in s or "orbit" in s:
        sphere(out, 0.4, 16, (0.4,0.4,0)); cylinder(out,0.03,0.9,8,(0,0.5,0),"y")
    elif "circuit" in s or "wiring" in s or "logic" in s or "electric" in s or "resistor" in s:
        box(out, 1.2,0.1,0.8,(0,0.05,0),(0.2,0.5,0.3))
        cylinder(out,0.08,0.5,10,(0.4,0.3,0)); cylinder(out,0.08,0.5,10,(-0.4,0.3,0))
    elif "pump" in s or "turbine" in s:
        cylinder(out, 0.6,0.5,24,(0,0.1,0)); cylinder(out,0.15,0.8,12,(0.6,0.1,0),"x")
    elif "optics" in s or "lens" in s or "ray" in s:
        sphere(out, 0.5, 16, (0,0.1,0)); box(out,1.6,0.05,0.05,(0,0.1,0.3))
    elif "engine" in s or "stroke" in s or "morse" in s:
        cylinder(out, 0.5,0.9,24,(0,0.1,0)); cylinder(out,0.12,1.0,10,(0,0.6,0))
    else:
        # generic apparatus: post + head
        cylinder(out, 0.18,1.0,16,(0,0.1,0))
        box(out, 0.7,0.3,0.5,(0.35,0.5,0), color)
    return out

def write_glb_from_triangles(tris, path, color=(0.62,0.68,0.78)):
    # tris: flat list of (pos3 + nrm3) per vertex, 3 verts per triangle
    nv = len(tris)//6
    positions = []
    normals = []
    for i in range(nv):
        p = tris[i*6:i*6+3]; nrm = tris[i*6+3:i*6+6]
        positions += p; normals += nrm
    indices = list(range(nv))
    # build GLB
    pos_b = b''.join(struct.pack('<3f', *positions[i*3:i*3+3]) for i in range(nv))
    nrm_b = b''.join(struct.pack('<3f', *normals[i*3:i*3+3]) for i in range(nv))
    idx_b = b''.join(struct.pack('<I', i) for i in indices)
    def pad4(b):
        while len(b)%4: b += b'\x00'
        return b
    pos_b=pad4(pos_b); nrm_b=pad4(nrm_b); idx_b=pad4(idx_b)
    total_bin = pos_b+nrm_b+idx_b
    bv = []
    offset=0
    # positions
    bv.append({"buffer":0,"byteOffset":offset,"target":34962,"byteLength":len(pos_b)}); offset+=len(pos_b)
    bv.append({"buffer":0,"byteOffset":offset,"target":34962,"byteLength":len(nrm_b)}); offset+=len(nrm_b)
    bv.append({"buffer":0,"byteOffset":offset,"target":34963,"byteLength":len(idx_b)})
    acc = [
        {"bufferView":0,"componentType":5126,"count":nv,"type":"VEC3"},
        {"bufferView":1,"componentType":5126,"count":nv,"type":"VEC3"},
        {"bufferView":2,"componentType":5125,"count":len(indices),"type":"SCALAR"},
    ]
    gltf = {
        "asset":{"version":"2.0","generator":"nhit-glb"},
        "scenes":[{"nodes":[0]}], "scene":0,
        "nodes":[{"mesh":0,"name":"tool"}],
        "meshes":[{"primitives":[{"attributes":{"POSITION":0,"NORMAL":1},"indices":2,"material":0}]}],
        "materials":[{"pbrMetallicRoughness":{"baseColorFactor":[color[0],color[1],color[2],1.0],"metallicFactor":0.35,"roughnessFactor":0.55}}],
        "buffers":[{"byteLength":len(total_bin)}],
        "bufferViews":bv, "accessors":acc,
    }
    js = json.dumps(gltf, separators=(',',':')).encode('utf-8')
    while len(js)%4: js += b'\x20'
    binpad = total_bin
    body = struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(binpad), 0x004E4942) + binpad
    with open(path,'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12+len(body)) + body)

def generate(slug):
    tris = build_scene(slug)
    name = slug.replace("-","_")
    path = MODELS / f"{name}.glb"
    write_glb_from_triangles(tris, path)
    return path

if __name__ == "__main__":
    args = sys.argv[1:]
    if args:
        slugs = args
    else:
        T = BASE / "nhitvisuallab" / "tools"
        slugs = [d.name for d in T.iterdir() if d.is_dir()]
    done=0; skip=0
    for s in slugs:
        name = s.replace("-","_")
        if (MODELS/f"{name}.glb").exists():
            skip+=1; continue
        generate(s); done+=1
    print(f"generated {done} GLB(s), skipped {skip} existing")
