---
name: nhitvisuallab-theme
description: >
  Complete design system, theming, CSS tokens, and code conventions for the NHIT VisualLab
  engineering simulator project at C:\Users\user\AntigravityWorkDIR\Simulators\nhitvisuallab.
  Read this skill BEFORE adding any new feature or simulator so that all new code stays
  consistent with the existing codebase.
---

# NHIT VisualLab — Theme & Code Conventions

## Project Overview

NHIT VisualLab (nhitvisuallab/) is a collection of browser-based interactive engineering
simulators. Each simulator is a standalone HTML/CSS/JS page in tools/<tool-name>/.

## Directory Layout

nhitvisuallab/
  shared/
    site.css?v=20.css        <- global stylesheet (loaded by EVERY page)
    sidebar/sidebar.js       <- sidebar injection
    cookie-notice.js?v=2     <- cookie banner
    ads-collapse.js?v=2      <- AdSense collapse helper
  tools/<tool-name>/
    index.html               <- simulator page
    style.css?v=N.css        <- tool-specific CSS
    app.js?v=N               <- all simulator logic
  thermal/index.html         <- category page
  Icons/                     <- SVG tool card thumbnails
  brand/                     <- logo assets

NOTE: File names contain literal "?v=N" — in HTML href use URL-encoded %3F: style.css%3Fv=8.css

## Design Tokens (:root CSS variables)

--bg:        #0d1117
--surface:   #161b27
--surface2:  #1f2535
--border:    #2a3050
--accent:    <tool-specific color>
--accent-lo: rgba(R,G,B,.22)
--green:     #3ddc84
--red:       #ff5555
--gold:      #f5c842
--text:      #dde3f0
--text-dim:  #6b7a99
--font:      'Segoe UI', system-ui, sans-serif
--radius:    12px

## Per-Tool Accent Colors
- Rankine Cycle: #f4511e
- Thermodynamics: #ec407a
- Heat Transfer: #d32f2f
- Fluid Flow: #00695c
- Refrigeration: #0097a7
- Bernoulli: #8bc34a
- Thermal Power Plant: #e53935 (fire red)

## Global Shared CSS (from shared/site.css)
- #app: max-width:1400px; margin:0 auto
- .site-nav: breadcrumb nav bar
- .site-nav-back: back arrow link pill
- .logo-fixed: fixed brand logo top-left
- .tool-card, .tool-grid: category grid
- .site-footer, .site-footer-nav: footer

## Per-Tool Page Template (HTML structure)
1. Full SEO meta (title, desc, keywords, canonical, OG, Twitter)
2. JSON-LD: LearningResource+SoftwareApplication, BreadcrumbList, FAQPage
3. Linked: shared/site.css%3Fv=20.css AND style.css%3Fv=N.css
4. Body: skip-link, logo-fixed, main#app
5. Inside main: site-nav > header > controls-bar > canvas area > seo-article > site-footer
6. Scripts: app.js, cookie-notice.js, ads-collapse.js, sidebar.js

## Tool CSS Pattern (style.css)
- Always reset box-sizing + margin/padding
- Re-declare :root with tool accent color
- body { padding: 0 16px; background:var(--bg); }
- #app { max-width:1400px; margin:0 auto; display:flex; flex-direction:column; gap:14px; }
- .controls-bar: flexbox pill/tab control area
- .pill-tabs / .pill: mode switcher tabs
- .btn-primary / .btn-ghost: action buttons with hover glow
- .canvas-card: panel for Canvas elements
- .graph-badge / .graph-badge-val: live numeric readout badges

## JavaScript Architecture (app.js)
- Single self-contained file, no external runtime dependencies
- Canvas 2D API for all drawing (no WebGL, no chart libs)
- requestAnimationFrame loop for animation
- State machine: state object advanced each frame
- drawXxx() functions for each visual component
- Zoom: wheel event -> scale + redraw (min 0.3, max 5)
- Pan: mousedown+drag -> translate + redraw
- Tooltip: mousemove -> find nearest hotspot -> show floating div

## Zoom Implementation Pattern
let zoom = 1, panX = 0, panY = 0;
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  zoom = Math.max(0.3, Math.min(5, zoom * delta));
  draw();
}, { passive: false });

## Tooltip Implementation Pattern
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
  const my = (e.clientY - rect.top) * (canvas.height / rect.height);
  for (const hs of hotspots) {
    if (Math.hypot(mx-hs.x, my-hs.y) < 40) {
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY - 8) + 'px';
      tooltip.innerHTML = hs.html;
      tooltip.classList.add('visible');
      return;
    }
  }
  tooltip.classList.remove('visible');
});

## Adding a New Simulator
1. Create tools/<name>/ with index.html, style.css?v=1.css, app.js?v=1
2. Add tool card to relevant category/index.html
3. Update category schema ItemList
4. Create Icons/<name>.svg thumbnail

## Thermal Power Plant Simulator
- Tool path: tools/thermal-power-plant/
- Accent: #e53935 (fire red)
- Category: thermal/index.html
- All 8+ plant sections must be animated and interconnected
- Each section needs detailed info tooltip
- Mouse wheel zoom required (min 0.3x, max 5x)
