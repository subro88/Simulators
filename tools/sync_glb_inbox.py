"""Sync manually-dropped GLBs from the inbox into the served models folder.

Inbox:  frontend/glb_inbox/<slug>/<component>.glb
Output: frontend/models/<slug>/<component>.glb   (one file per component)
        frontend/models/<slug>_components.json    (carousel manifest)
        frontend/models/<slug>.glb               (default = first component, if inbox present)

Run after dropping new files:  python tools/sync_glb_inbox.py
Idempotent.
"""
import json, pathlib, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
INBOX = ROOT / "frontend" / "glb_inbox"
MODELS = ROOT / "frontend" / "models"
MODELS.mkdir(parents=True, exist_ok=True)


def humanize(name):
    return name.replace("_", " ").replace("-", " ").strip().title()


def main():
    if not INBOX.exists():
        print("No inbox folder at", INBOX); return
    count = 0
    for slug_dir in sorted(INBOX.iterdir()):
        if not slug_dir.is_dir():
            continue
        slug = slug_dir.name
        glbs = sorted(slug_dir.glob("*.glb"))
        if not glbs:
            continue
        model = slug.replace("-", "_")
        dest_dir = MODELS / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        comps = []
        for g in glbs:
            comp = g.stem
            shutil.copy(g, dest_dir / (comp + ".glb"))
            comps.append({"label": humanize(comp), "url": f"/models/{slug}/{comp}.glb"})
        (MODELS / (model + "_components.json")).write_text(json.dumps(comps, indent=2), encoding="utf-8")
        shutil.copy(glbs[0], MODELS / (model + ".glb"))  # default
        print(f"synced {slug}: {len(comps)} component(s) -> {model}_components.json")
        count += 1
    print(f"done. {count} tool(s) synced from inbox.")


if __name__ == "__main__":
    main()
