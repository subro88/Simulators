---
name: v2-simulator-builder
description: >
  Architecture and code standard for upgrading engineering simulators from V1 to V2 on the
  NHIT VisualLab platform. V2 = the original V1 simulation kept 100% intact, plus ONE added
  advancement: an inline interactive 3D (.glb) model with a component carousel. Applies to BOTH
  the canonical tool page (nhitvisuallab/tools/<slug>/index.html) and legacy root-level
  simulation pages (frontend/<name>.html, served at /<name>.html). Includes the migration recipe,
  the canonical page/section template, the 3D embed viewer, the manual GLB inbox, and the full
  list of hard-won gotchas so future new-tool work is consistent.
---

# V2 Simulator Builder — Architecture & Development Standard (FINAL)

This skill reflects the ACTUAL implemented architecture (used to migrate all 149 tools). Treat it
as the source of truth when adding a new tool or touching the 3D viewer.

## 0. The Single Golden Rule

> **V2 is NOT a parallel page. V2 IS the V1 page, with a 3D model added.**
> - Keep the original V1 simulation (canvas, sliders, math, JS) **100% untouched**.
> - The ONLY added V2 element is a `3D Model` section embedded in the same page.
> - No iframes. No separate "V1 tab" + "V2 tab".
> - A simulation page is served at **either** the canonical `nhitvisuallab/tools/<slug>/index.html`
>   **or** a legacy root `frontend/<name>.html` (URL `/<name>.html`, e.g. `soil_mechanics.html`).
>   **BOTH classes MUST carry the same canonical 3D embed** (§1) — V2 is not optional for any simulator.
> - The pristine original is kept as `v1.html` (tool pages) or `<name>.v1.html` (root pages) in the
>   same folder (backup; delete later if desired).
> - **Never edit `index.html` by hand for the 3D part** — edit `v1.html` or the migration script,
>   then regenerate `index.html` (see Section 4). `index.html` is always generated.

---

## 1. Canonical Tool Page Location & Section Structure

Every tool page lives at `nhitvisuallab/tools/<slug>/index.html` and contains:

| # | Section | Required id / marker | Purpose |
|---|---------|----------------------|---------|
| 1 | Page container | `<main id="app">` | Overall container (simulation + 3D live here) |
| 2 | Header | `<h1>`, `.subtitle` | Tool name + one-line description |
| 3 | Mode controls | `<div class="controls-bar">` + `.pill-tabs` (native OR injected) | Simulate / 3D Model / … switch |
| 4 | Simulation area | `id="sim-wrapper"` (V1 canvas/mechanism) | The original V1 working diagram + interactivity |
| 5 | Controls panel | `id="ctrl-panel"` | Parameter inputs / sliders |
| 6 | Results / readouts | `id="results-row"` | Computed outputs / telemetry |
| 7 | Explore / Theory | `id="explore-wrapper"` | Formulas, worked examples |
| 8 | **3D Model (V2)** | `<div id="model3d-wrapper">` → `<section id="sim3d-section">` + `<canvas id="sim3d-canvas">` + `<aside id="sim3d-components">` | **THE ONLY V2 ADDITION** (the canonical `.sim3d` component) |
| 9 | Shared sidebar | `<script src="/nhitvisuallab/shared/sidebar/sidebar.js">` | Site navigation (loaded once) |

### The canonical `.sim3d` component (inject verbatim)

This is the exact block produced by `tools/migrate_sim3d_carousel.py` (and `tools/scaffold_tool.py`).
For native-tab pages the migration adds `class="hidden"` to `#model3d-wrapper` so it only shows on
the **3D Model** pill. `{THREE}` expands to the five CDN `<script>` tags (three r128 + OrbitControls
+ GLTFLoader + DRACOLoader + RoomEnvironment). `{TITLE}/{SLUG}/{MODEL}` are filled per tool
(`MODEL` = slug with `-`→`_`).

```html
<!-- V2_3D_EMBED -->
<div id="model3d-wrapper">
  <section id="sim3d-section" class="sim3d-section">
    <h2>3D Model — <span id="sim3d-title">{TITLE}</span></h2>
    <p id="sim3d-blurb" class="sim3d-blurb">Interactive 3D model of this apparatus. Pick a component on the right, then drag to rotate · scroll to zoom · right-drag to pan.</p>
    <div class="sim3d-layout">
      <div class="sim3d-wrap">
        <canvas id="sim3d-canvas" class="sim3d-canvas"></canvas>
        <div class="sim3d-hint">Drag to rotate · Scroll to zoom</div>
      </div>
      <aside id="sim3d-components" class="sim3d-components"></aside>
    </div>
  </section>
</div>
<style>
  .sim3d-section{margin:24px 0;padding:16px 18px;background:#0e1726;border:1px solid #1e2c44;border-radius:10px;color:#dce6f5;position:relative;}
  .sim3d-section h2{margin:0 0 6px;font-size:1.15rem;color:#7fd1ff;}
  .sim3d-blurb{margin:0 0 12px;line-height:1.5;color:#aebfd4;}
  .sim3d-layout{display:flex;gap:14px;align-items:flex-start;min-width:0;}
  .sim3d-wrap{position:relative;flex:1 1 auto;min-width:0;width:100%;}
  .sim3d-canvas{width:100%;height:460px;display:block;background:#0a0e17;border-radius:8px;touch-action:none;cursor:grab;}
  .sim3d-canvas:active{cursor:grabbing;}
  .sim3d-hint{position:absolute;right:10px;bottom:8px;font-size:12px;color:#6b7f9c;background:rgba(0,0,0,.25);padding:2px 8px;border-radius:6px;}
  .sim3d-components{flex:0 0 180px;width:180px;max-height:460px;overflow:auto;display:flex;flex-direction:column;gap:8px;}
  .sim3d-comp{display:flex;flex-direction:column;gap:4px;align-items:stretch;text-align:left;padding:9px 11px;border:1px solid #1e2c44;background:#0c1320;color:#cdd7ee;border-radius:8px;cursor:pointer;font-size:13px;transition:all .15s;}
  .sim3d-comp:hover{background:#13203a;}
  .sim3d-comp.active{background:#29b6f6;color:#080c14;font-weight:700;border-color:#29b6f6;}
  .sim3d-thumb{width:100%;height:84px;object-fit:cover;background:#0a0e17;border-radius:6px;display:block;}
  .controls-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#0e1726;border:1px solid #1e2c44;border-radius:10px;flex-wrap:wrap;gap:12px;margin:16px 0 4px;}
  .ctrl-group{display:flex;align-items:center;gap:10px;}
  .ctrl-label{color:#aebfd4;font-size:.82rem;}
  .pill-tabs{display:flex;background:#0a0e17;border-radius:8px;padding:3px;gap:3px;flex-wrap:wrap;}
  .pill{padding:6px 13px;border:none;background:transparent;color:#aebfd4;border-radius:6px;cursor:pointer;font-size:.82rem;font-weight:600;}
  .pill.active{background:#29b6f6;color:#0b111a;font-weight:700;box-shadow:0 0 10px rgba(41,182,246,.35);}
  .v2-model-pane .sim3d-section{margin-top:0;}
  .sim3d-fs-btn{position:absolute;top:10px;right:12px;z-index:5;padding:6px 10px;border:1px solid #1e2c44;background:#0c1320;color:#cdd7ee;border-radius:7px;cursor:pointer;font-size:12px;}
  .sim3d-fs-btn:hover{background:#13203a;}
  .sim3d-section.fullscreen{position:fixed;inset:0;z-index:9998;margin:0;border-radius:0;background:#0a0e17;display:flex;flex-direction:column;padding:0;}
  .sim3d-section.fullscreen .sim3d-blurb{display:none;}
  .sim3d-section.fullscreen .sim3d-layout{flex:1;min-height:0;margin:0;}
  .sim3d-section.fullscreen .sim3d-wrap{flex:1;min-height:0;}
  .sim3d-section.fullscreen .sim3d-canvas{width:100%!important;height:100%!important;}
  .sim3d-section.fullscreen .sim3d-resize{display:none;}
  .sim3d-resize{height:10px;cursor:ns-resize;background:linear-gradient(#1e2c44,#0e1726);border-radius:0 0 8px 8px;margin-top:2px;}
</style>
<script>window.$=window.$||function(id){return document.getElementById(id)};window.V2_TOOL_ID="{SLUG}";window.V2_MODEL="{MODEL}";window.V2_COMPONENTS_URL="/models/{MODEL}_components.json";</script>
{THREE}
<script src="/js/v2_model_embed.js"></script>
```

`{THREE}` =
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/environments/RoomEnvironment.js"></script>
```

`frontend/js/v2_model_embed.js` targets `#sim3d-canvas`, requires `THREE`/`OrbitControls`/`GLTFLoader`
globals, reads `window.V2_TOOL_ID` and `window.V2_MODEL` (default = slug with `-`→`_`), and:
- loads `/models/<V2_MODEL>.glb` (or the first component from the manifest) and auto-frames it,
- builds the right-side carousel (`#sim3d-components`) from `window.V2_COMPONENTS` or
  `window.V2_COMPONENTS_URL` (a JSON `[{label,url}]` manifest), rendering a generated PNG thumbnail
  per component,
- exposes `window.loadSim3D(url)` to swap the loaded model,
- adds a **⤢ Fullscreen** button (top-right of the section) and a **drag-to-resize height** handle,
- uses `renderer.setSize(w, h, false)` so the canvas stays fluid (CSS `width:100%` governs display).

### 1b. Legacy root-level simulation pages (`frontend/<name>.html`)

A second class of simulator lives at the site root: `frontend/<name>.html`, served at
`http://localhost:8080/<name>.html` (e.g. `differential.html`, `clutch.html`, `soil_mechanics.html`).
These are first-class simulations and MUST carry the **exact same canonical `.sim3d` block** from §1
(inline 3D + component carousel), keeping the original simulation 100% intact.

**Serving / routing.** Each root page needs an explicit FastAPI route — the `/frontend` StaticFiles
mount serves `/frontend/<name>.html`, **not** `/<name>.html`. Mirror the existing pattern in
`app/main.py`:
```python
@app.get("/soil_mechanics.html")
async def serve_soil_mechanics():
    return FileResponse(str(FRONTEND_DIR / "soil_mechanics.html"))
```
The 3D embed's absolute asset URLs — `/js/v2_model_embed.js`, `/models/...`,
`/nhitvisuallab/shared/sidebar/sidebar.js` — already resolve through the existing mounts, so no extra
static wiring is needed. If the tool also has a canonical `nhitvisuallab/tools/<slug>/index.html`,
prefer that as the primary entry and treat the root page as a convenience alias (or redirect).

**Migration.** Same approach as §4 but on the root file: keep a pristine backup `frontend/<name>.v1.html`,
then inject the canonical block (with `window.V2_TOOL_ID`/`V2_MODEL`/`V2_COMPONENTS_URL` set for that
tool) before `</body>`. Never hand-edit the injected 3D part — edit the backup or the generator and
regenerate. The canonical block's layout rules use `!important` (and define `.hidden`) so any leftover
native `.sim3d-*` styles in the old page cannot override the V2 layout.

**Bulk helper.** `tools/migrate_root_sim3d.py` upgrades every root `frontend/<name>.html`
simulation at once: it backs each up to `<name>.v1.html`, strips local legacy three/diff3d, and
injects the canonical block (marked `data-v2-inline="1"` so `v2_model_embed.js` shows the 3D in
place without reorganizing the page into Simulate/3D-Model panes). Excludes `index.html` /
`v2_tool.html`. The serving side is the generic `@app.get("/{page}.html")` route in `app/main.py`
(which requires a container restart to take effect, since uvicorn runs without `--reload`).

---

## 2. 3D Asset Standard (`frontend/models/`)

- One GLB per tool named `<slug_with_underscores>.glb` (e.g. `mohrs_circle.glb`) plus, when the user
  supplies parts, a subfolder `frontend/models/<slug>/<component>.glb` and a manifest
  `frontend/models/<slug>_components.json`.
- Reusable generator: `blender/glb_writer.py` — `python blender/glb_writer.py <slug>` (re)generates a
  representative assembly; with no args it fills every missing tool. Geometry is non-indexed
  (per-face normals); no numpy needed.
- Accurate models are built by extending `glb_writer.py` `build_scene(slug)` with keyword-specific
  primitives (springs→helix, gears→teeth, beams→long box, vessels→cylinder, shafts→long cylinder,
  trusses→lattice, joints→plate+fasteners, etc.).
- If the GLB is missing, the viewer shows "3D model unavailable" — the V1 page is unaffected.

---

## 3. Optional Live Engine (NOT required for V2)

The 3D model is the only mandated V2 feature. A live Python engine (REST + WebSocket) is optional and
only needed when you want the 3D model or readouts to update from parameters.
- Engine: subclass `BaseSimulationEngine` in `app/simulation/base.py`; export from `app/simulation/__init__.py`.
- Register in `app/main.py`: `POST /api/<slug>/simulate`, `GET /api/<slug>/presets`, `WS /ws/<slug>`,
  and a `GET /<slug>.html` route (serves `frontend/v2_tool.html`).
- The root `/<slug>.html` engine page is a *secondary* view; the canonical entry remains
  `nhitvisuallab/tools/<slug>/index.html`.

---

## 4. Migration Recipe (regenerate every `index.html` from `v1.html`)

`tools/migrate_sim3d_carousel.py` is the one-shot migration used for all 149 tools. **Run it whenever
the 3D block, viewer, or CSS changes** — it always rebuilds `index.html` from the pristine `v1.html`,
so hand edits to `index.html` are never lost. For each tool folder:

1. Read `v1.html`.
2. `strip_legacy_three(html)` — drop any local `<script src>` containing `three` or `diff3d` that is
   NOT a CDN host (the legacy `shared/three3d/three.min.js` clobbers `THREE` and defines the global
   `$`; `diff3d.js` is a dead native 3D engine). CDN three/OrbitControls/GLTFLoader/DRACOLoader/
   RoomEnvironment are kept.
3. If the page has a native mode system (`class="controls-bar"`), inject `#model3d-wrapper` with
   `class="hidden"` (so it only shows on the native **3D Model** pill). Otherwise inject it visible.
4. If `v1.html` already contains `#model3d-wrapper`, replace that native block with the canonical
   one (override everywhere); else inject the canonical block before `</body>`.
5. Inject the `window.$=window.$||function(id){...}` helper (restores `$` after stripping three3d),
   `window.V2_TOOL_ID` / `V2_MODEL` / `V2_COMPONENTS_URL`, the five CDN three scripts, and
   `v2_model_embed.js`.
6. Write `index.html`. `v1.html` is left untouched.

```bash
python tools/migrate_sim3d_carousel.py
```

**Root-level `frontend/<name>.html` pages** are upgraded the same way: back up to `frontend/<name>.v1.html`,
inject the canonical §1 block (with that tool's `V2_TOOL_ID`/`V2_MODEL`/`V2_COMPONENTS_URL`), and add an
explicit `@app.get("/<name>.html")` route in `app/main.py` (mirror the existing `differential.html` route).
The migration script can be extended/pointed at these root files; the 3D embed and its asset URLs work
unchanged because the `/js`, `/models`, and `/nhitvisuallab` mounts already exist.

---

## 5. Adding a BRAND-NEW Tool (follow this structure)

```bash
python tools/scaffold_tool.py <slug> "<Title>" [<category>]
```
It creates `nhitvisuallab/tools/<slug>/index.html` (all sections + canonical 3D embed),
`nhitvisuallab/tools/<slug>/v1.html` (identical backup), and `frontend/models/<slug_underscored>.glb`
(placeholder). Then:
1. Implement the V1 simulation inside `#sim-wrapper` / `#ctrl-panel` / `#results-row`.
2. Refine `frontend/models/<slug_underscored>.glb` (extend `glb_writer.py`).
3. Register discoverability in the sidebar: add `{"slug":"<slug>","title":"<Title>"}` to
   `CATEGORY_DATA`/`COURSE_DATA` in `nhitvisuallab/shared/sidebar/sidebar.js`. It auto-links to
   `tools/<slug>/index.html`.
4. (Optional) Python engine per Section 3.

The scaffolded page is V2-compliant immediately (loads the shared sidebar + `v2_model_embed.js`).

---

## 6. Canonical V1 Sidebar Standard

All tool pages load the authentic sidebar once:
```html
<script src="/nhitvisuallab/shared/sidebar/sidebar.js"></script>
```
It builds links as `ROOT + "tools/" + slug + "/index.html"` (ROOT derived from the current URL), so it
resolves from `nhitvisuallab/tools/<slug>/index.html`. Never replace it with an ad-hoc sidebar.

---

## 7. Manual GLB Inbox, Carousel, Tabs, Fullscreen

### Inbox
```
frontend/glb_inbox/<slug>/<component>.glb      # one subfolder per tool, drop .glb files here
```
```bash
python tools/sync_glb_inbox.py
```
For each inbox subfolder it copies every `.glb` to `frontend/models/<slug>/<component>.glb`, writes
`frontend/models/<slug>_components.json = [{label, url}]` (label = humanized filename), and sets
`frontend/models/<slug>.glb` to the first component (default model). Idempotent.

### Carousel (thumbnails + text)
`buildCarousel` renders each component as a button with a generated PNG **thumbnail** (an offscreen
`WebGLRenderer` frames the GLB) plus its text label. Clicking loads that GLB via `window.loadSim3D`.
Metallic/PBR materials need image-based lighting: the viewer builds a `RoomEnvironment` PMREM (plus sRGB
output + ACES tone mapping) so they are visible — a bare metallic material with no env map renders
**black**. `DRACOLoader` is wired in for compressed GLBs.

### Simulate / 3D Model tabs (match `utm-testing`)
`v2_model_embed.js` mirrors `utm-testing`: a `.controls-bar` + `.pill-tabs` "Mode" switch where
**Simulate** shows the V1 simulation and **3D Model** shows the 3D viewer, swapping **in place** in the
same stage area below the controls bar.
- **Native mode system present** (`class="controls-bar"`): the viewer integrates instead of adding a
  second bar. It explicitly swaps because the native `app.js` `showSection` maps modes to
  `id + "-wrapper"` (e.g. `simulate-wrapper`) but the real section id is `sim-wrapper` — so the native
  toggle is unreliable for the simulation. The viewer attaches its own handlers: the **3D Model** pill
  hides every `.view-section` except `#model3d-wrapper` and reveals it; the **Simulate** pill reveals
  `#sim-wrapper` and hides the 3D. A `MutationObserver` calls `onShowModel()` (resize + re-frame) when
  `#model3d-wrapper` becomes visible.
- **No native mode system**: the viewer builds its own `.controls-bar` (Simulate / 3D Model) and swaps
  `#v2-sim-pane` / `#v2-model-pane`.

### Fullscreen + adjustable height
The 3D section has a **⤢ Fullscreen** button (top-right) that toggles `position:fixed;inset:0` to fill
the viewport (canvas full width/height), and a bottom **drag handle** (`.sim3d-resize`) to set the
canvas height. Both re-size the renderer. In fullscreen the canvas rule uses `!important` to beat the
leftover native `#sim3d-canvas` height rule.

---

## 8. GOTCHAS / LESSONS LEARNED (read before touching the 3D)

1. **Legacy `three3d/three.min.js` clobbers `THREE`.** Native pages load their own three.js *after*
   the CDN includes, overwriting `window.THREE` and destroying `OrbitControls`/`GLTFLoader` → viewer
   bails with "3D viewer unavailable". Always strip local three includes (keep only CDN). BUT that
   file also defined the global `$` helper `app.js` depends on — re-inject `window.$=window.$||…`.
2. **`diff3d.js` is dead** once the native 3D is replaced — strip it (it errors on the missing canvas).
3. **Metallic models render black** without an environment map. Always build `RoomEnvironment` PMREM
   and set sRGB + ACES tone mapping in the viewer.
4. **Native mode toggle id mismatch** (`simulate-wrapper` vs `sim-wrapper`): do NOT rely on `app.js`
   `showSection` for the swap — the viewer does it explicitly (activate3D/activateSim).
5. **Canvas must be fluid**: `renderer.setSize(w, h, false)` (the `false` = don't write inline px
   `width/height`). Otherwise three pins a fixed pixel width and the canvas stops filling its flex
   container. The CSS `width:100%` then governs display size.
6. **Fullscreen canvas** needs `width:100%!important;height:100%!important` to override the native
   `#sim3d-canvas{height:540px}` id rule.
7. **Migration regenerates `index.html` from `v1.html`.** Edit `v1.html` (or the migration script),
   never `index.html` directly, or changes are overwritten on the next migration run.
8. **Sandbox has no numpy/fastapi/uvicorn and `pip` is blocked.** Validate with
   `python -m py_compile` + `node --check` only; you cannot run the server here. The dev server runs
   on the user's machine (`uvicorn app.main:app --port 8080`).
9. **GLB sanity**: a valid glTF binary starts with magic `glTF` and version `2`; `GLTFLoader` r128
   handles Draco only if `DRACOLoader` is attached (done). If a model fails to load, the viewer shows
   "3D model unavailable" and keeps the V1 sim working.

---

## 9. Seamless Task Resumption / Validation

1. Check `implementation_plan.md` / notes for current batch status.
2. Syntax: `python -m py_compile tools/migrate_sim3d_carousel.py tools/scaffold_tool.py app/main.py`
   and `node --check frontend/js/v2_model_embed.js`.
3. Assets: `python blender/glb_writer.py` (placeholders) then `python tools/sync_glb_inbox.py`
   (user-supplied parts → manifest).
4. Regenerate pages after any 3D/viewer/CSS change: `python tools/migrate_sim3d_carousel.py`.
5. User runs `uvicorn app.main:app --port 8080` (needs `requirements.txt`: fastapi, uvicorn, pydantic,
   numpy). Visit `http://localhost:8080/nhitvisuallab/tools/<slug>/index.html`. Hard-refresh (cache).
