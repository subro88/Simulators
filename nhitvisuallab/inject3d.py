#!/usr/bin/env python3
"""Inject a Sim3D '3D Model' panel into MechSimulator tool pages.

Run from the mirrored site root (mechsimulator.com/).
For every tool under tools/ it:
  - extracts the page <h1> (title) and <meta name="description"> (blurb)
  - inserts a <section id="sim3d-section"> panel after the first </h1>
  - inserts three.js + viewer + models + an init call before </body>
The builder is resolved from the page slug via Sim3D.mapSlug at runtime.
"""
import os, re, sys, html

ROOT = os.path.dirname(os.path.abspath(__file__))
TOOLS = os.path.join(ROOT, "tools")
ALL = sorted(os.listdir(TOOLS))

PANEL = '''
<section id="sim3d-section" class="sim3d-section">
  <h2>3D Model — <span id="sim3d-title">%TITLE%</span></h2>
  <p id="sim3d-blurb" class="sim3d-blurb">%BLURB%</p>
  <div class="sim3d-wrap">
    <canvas id="sim3d-canvas" class="sim3d-canvas"></canvas>
    <div class="sim3d-hint">Drag to rotate · Scroll to zoom</div>
  </div>
  <style>
    .sim3d-section{margin:24px 0;padding:16px 18px;background:#0e1726;border:1px solid #1e2c44;border-radius:10px;color:#dce6f5;}
    .sim3d-section h2{margin:0 0 6px;font-size:1.15rem;color:#7fd1ff;}
    .sim3d-blurb{margin:0 0 12px;line-height:1.5;color:#aebfd4;}
    .sim3d-wrap{position:relative;width:100%;max-width:640px;}
    .sim3d-canvas{width:100%;height:380px;display:block;background:#0e1726;border-radius:8px;touch-action:none;cursor:grab;}
    .sim3d-canvas:active{cursor:grabbing;}
    .sim3d-hint{position:absolute;right:10px;bottom:8px;font-size:12px;color:#6b7f9c;background:rgba(0,0,0,.25);padding:2px 8px;border-radius:6px;}
  </style>
</section>
'''

SCRIPTS = '''
<script src="../../shared/three3d/three.min.js"></script>
<script src="../../shared/three3d/viewer.js"></script>
<script src="../../shared/three3d/models.js"></script>
<script>Sim3D.mount('%SLUG%', document.getElementById('sim3d-canvas'));</script>
'''

def extract(path):
    txt = open(path, encoding="utf-8").read()
    m = re.search(r"<h1[^>]*>(.*?)</h1>", txt, re.I | re.S)
    title = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else ""
    d = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', txt, re.I)
    blurb = html.unescape(d.group(1).strip()) if d else ""
    if not blurb:
        p = re.search(r"<p[^>]*>(.*?)</p>", txt, re.I | re.S)
        if p: blurb = html.unescape(re.sub(r"<[^>]+>", "", p.group(1))).strip()
    return title, blurb

def inject(slug, force=False):
    path = os.path.join(TOOLS, slug, "index.html")
    if not os.path.isfile(path):
        print("SKIP (no file):", slug); return
    page = open(path, encoding="utf-8").read()
    if "sim3d-canvas" in page and not force:
        print("exists:", slug); return
    if force:
        page = re.sub(r'<section id="sim3d-section".*?</section>', '', page, flags=re.S | re.I)
        page = re.sub(r'<script src="\.\./\.\./shared/three3d/three\.min\.js"></script>\s*'
                      r'<script src="\.\./\.\./shared/three3d/viewer\.js"></script>\s*'
                      r'<script src="\.\./\.\./shared/three3d/models\.js"></script>\s*'
                      r'<script>Sim3D\.mount\([^)]*\);</script>', '', page)
    title, blurb = extract(path)
    panel = PANEL.replace("%TITLE%", html.escape(title)).replace("%BLURB%", html.escape(blurb))
    m = re.search(r"</h1>", page, re.I)
    if not m:
        page = page.replace("</body>", panel + SCRIPTS.replace("%SLUG%", slug) + "</body>", 1)
    else:
        page = page[:m.end()] + panel + page[m.end():]
        page = page.replace("</body>", SCRIPTS.replace("%SLUG%", slug) + "</body>", 1)
    open(path, "w", encoding="utf-8").write(page)
    print(("re-injected" if force else "injected") + ":", slug)

if __name__ == "__main__":
    args = sys.argv[1:]
    force = "--force" in args
    args = [a for a in args if a != "--force"]
    targets = args or ALL
    for s in targets:
        if os.path.isdir(os.path.join(TOOLS, s)):
            inject(s, force=force)
