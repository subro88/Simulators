# Simulators Project Engineering Directive: VisualLab V2 Standard

This document establishes the mandatory visual, interaction, and architectural rules for all tools in `nhitvisuallab/tools/`.

---

## 1. Dual-Viewport Layout: Strict 3:2 Ratio (Canvas 60% : Tool Panel 40%)
```css
.dual-viewport {
  display: grid;
  grid-template-columns: 3fr 2fr; /* STRICT 3:2 RATIO */
  gap: 14px;
  align-items: stretch;
}

@media (max-width: 1080px) {
  .dual-viewport {
    grid-template-columns: 1fr;
  }
}
```
- **Left Viewport (60% / 3fr):** Interactive Canvas Viewport (HTML5 Canvas 2D / WebGL) with floating camera controls, coordinate grid, and contextual parameter/palette trays below.
- **Right Viewport (40% / 2fr):** Symbolic Computation, Diagnostic Telemetry, Live Truth Tables, Adjacency Matrices, and Parameter Controls.
- **Bottom Pane:** Progressive Learning Challenge Engine HUD and Formal Proof/Event Console.

---

## 2. Canvas Standards: Draggable, Zoomable & Fullscreen Facility
Every interactive simulation canvas MUST deliver complete, convenient navigation:
1. **Draggable & Pannable Canvas:**
   - Left-click drag on empty canvas background, middle-mouse drag, or `Space + Drag` to pan.
   - Dynamic cursors:
     - Hovering canvas: `cursor: grab;`
     - While panning: `cursor: grabbing;`
     - Hovering interactive entities: `cursor: pointer;`
2. **Smooth Cursor-Centered Wheel Zooming:**
   - Mouse wheel smoothly zooms camera (`0.4x` to `3.0x`) centered under the pointer.
   - Zoom HUD buttons: `[ ＋ ]`, `[ － ]`, `[ 1:1 ]`, `[ Fit ]`, `[ ⊞ Grid ]`.
3. **Dedicated Fullscreen Facility (`⛶ Fullscreen`):**
   - A prominent `⛶ Fullscreen` toggle button MUST be placed on the canvas card header.
   - Fullscreen expands the entire Canvas Workbench Card (canvas + zoom HUD + parameter trays).
   - Supports exiting via `Esc` key or clicking `🗗 Exit Fullscreen`.
4. **Convenient Keyboard Shortcuts:**
   - `Space` + Drag: Pan Camera
   - `+` / `=`: Zoom In
   - `-` / `_`: Zoom Out
   - `0`: Reset Zoom & Pan (1:1)
   - `F`: Toggle Fullscreen
   - `G`: Toggle Grid

---

## 3. Anti-Slop Visual & UX Principles
- High-contrast, bespoke dark engineering palette (`#020712`, `#0b1329`, `#162547`, `#38bdf8`, `#10b981`, `#f59e0b`, `#f43f5e`).
- Typography: `Inter` for interface copy, `JetBrains Mono` for math, code, and registers.
- Dynamic KaTeX rendering for all mathematical notation.
- Web Audio API tactile feedback (clicks, success chords, warning alerts).
- 4 Canonical Modes: `Simulate`, `3D Model`, `Theorems & Proofs`, `Quiz & Practice`.
