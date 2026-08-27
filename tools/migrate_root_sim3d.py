"""Bulk-upgrade legacy root-level simulation pages (frontend/<name>.html) to V2.

For every root HTML page that is an actual simulation (excluding the homepage/index and the
v2 engine test page), this:
  - backs up the pristine page to frontend/<name>.v1.html (once),
  - strips any LOCAL legacy three.js / diff3d includes (keeps CDN three),
  - injects the canonical .sim3d component (canvas + component carousel) before </body>,
  - marks the wrapper data-v2-inline="1" so v2_model_embed.js shows the 3D in place
    (no Simulate/3D-Model pane reorganization, which would break these pages).

The 3D embed's absolute asset URLs (/js, /models, /nhitvisuallab) resolve through the existing
mounts; serving at /<name>.html is handled by the generic route in app/main.py.
"""
import re
from migrate_sim3d_carousel import BLOCK, THREE, strip_legacy_three

ROOT = __import__("pathlib").Path(__file__).resolve().parent.parent
FRONTEND = ROOT / "frontend"
DENY = {"index.html", "v2_tool.html"}  # not simulations


def main():
    inj = 0
    backed = 0
    skip = 0
    for f in sorted(FRONTEND.glob("*.html")):
        name = f.name
        if name in DENY:
            continue
        html = f.read_text(encoding="utf-8")
        if 'id="model3d-wrapper"' in html:
            print("already V2, skip:", name)
            skip += 1
            continue
        # pristine backup (only once)
        bak = f.with_suffix(".v1.html")
        if not bak.exists():
            bak.write_text(html, encoding="utf-8")
            backed += 1
        html = strip_legacy_three(html)
        title = name[:-5].replace("-", " ").replace("_", " ").title()
        model = name[:-5].replace("-", "_")
        block = BLOCK.format(TITLE=title, SLUG=name[:-5], MODEL=model, THREE=THREE)
        # inline embed: don't let the viewer reorganize the page into panes
        block = block.replace(
            '<div id="model3d-wrapper">',
            '<div id="model3d-wrapper" data-v2-inline="1">',
        )
        if re.search(r"</body>", html, re.I):
            html = re.sub(r"</body>", block + "</body>", html, count=1, flags=re.I)
        else:
            html += block
        f.write_text(html, encoding="utf-8")
        print("injected V2 3D ->", name)
        inj += 1
    print(f"\nDone. injected={inj} backed_up={backed} skipped={skip}")


if __name__ == "__main__":
    main()
