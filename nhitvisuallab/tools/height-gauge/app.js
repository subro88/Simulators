'use strict';
// ════════════════════════════════════════════════════════════════════
//  Vernier Height Gauge Simulator  —  app.js  v4  (vertical true-scale)
//  0–120 mm | LC = 0.02 mm | 50-division vernier scale
//
//  A vernier height gauge IS a vernier caliper stood on end: the granite
//  plate is the fixed jaw, the scriber is the moving jaw, the beam carries
//  the main scale and the slider carries the vernier. This build mirrors
//  the Vernier-Caliper simulator's FIXED px/mm, FULL-SCALE, TRUE-POSITION
//  vernier — division j sits at (vernier-zero) − j·VSD at its real place,
//  so the gold coincident division GENUINELY lands on a main-scale line.
//  The fine 0.02 mm scale is dense at true size (exactly like the real
//  instrument); the precision-aware Zoom centres on the coincidence so
//  the aligned line is separable.  Drag, arrow keys, scroll, Zoom.
// ════════════════════════════════════════════════════════════════════

// ── Instrument constants ──────────────────────────────────────────
const LC         = 0.02;   // least count (mm)
const VSD_N      = 50;     // vernier scale divisions
const MIN_MM     = 0;
const MAX_MM     = 120;    // measuring capacity (mm)
const QUIZ_TOTAL = 5;
const ANIM_SPEED = 12;     // mm/s during animation

// ── Canvas (logical CSS px — DPR scaling applied at setup) ─────────
const CW = 480;
const CH = 720;

// ── Vertical scale geometry (ONE fixed scale, like a real instrument) ──
const PXMM       = 3.5;                     // px per 1 mm — fixed for everything
const VSD_PX     = PXMM * (VSD_N - 1) / VSD_N;   // one vernier division in px
const SCALE_0_Y  = 632;                     // y of the main-scale 0 mark
const PLATE_TOP  = 672;                     // datum surface (scriber tip at mm=0)
const SCR_DROP   = PLATE_TOP - SCALE_0_Y;   // 40 px — offset scriber arm drop
const MAX_DRAW_MM = Math.ceil((SCALE_0_Y - 12) / PXMM);  // beam run-out (~177 mm)
                  // headroom so the 49 mm vernier always has a line to meet

// ── Horizontal layout — beam (right) + slider/vernier (left) ──────
// Coincidence boundary: main ticks point RIGHT of it, vernier ticks LEFT.
const BX        = 300;                      // main↔vernier boundary line
const BEAM_R    = 372;                      // beam right edge
const M_TICK_MAJOR = 22, M_TICK_MED = 14, M_TICK_MIN = 8;
const M_LABEL_X    = BX + M_TICK_MAJOR + 6;   // main numbers (left-aligned)
const V_TICK_MAJOR = 22, V_TICK_MIN = 10;
const V_LABEL_X    = BX - V_TICK_MAJOR - 6;   // vernier numbers (right-aligned)
const VP_L      = 254;                      // vernier chrome plate left edge
const CAR_L     = 170;                      // slider body left edge
const CAR_R     = BX + 8;                   // slider grips a sliver of the beam

// Surface plate
const PLATE_L   = 30;
const PLATE_R   = 450;
const PLATE_BOT = PLATE_TOP + 30;

// Base (heavy cast shoe, under the beam)
const BASE_L    = 180;
const BASE_R    = 392;
const BASE_TOP  = PLATE_TOP - 30;

// Scriber
const SCR_TIP_X = 96;

// ── Zoom ───────────────────────────────────────────────────────────
const ZOOM_FACTOR = 4.5;                    // dense 50-div fine scale needs the most

// ── State ─────────────────────────────────────────────────────────
const state = {
  mm: 47.36,
  mode: 'free',
  dragging: false, dragRefY: 0, dragRefMm: 0,
  zoomOpen: false,
  hinted: false,
  showAlign: true,
  hasWorkpiece: false, workpieceH: 0,   // quiz: measure a random block
  quizTarget: 0, answered: false, score: 0, attempts: 0,
  playing: false, animDir: 1, animLast: 0, animRaf: null,
  quizQuestions: [], quizCurrent: 0, quizAnswers: [], quizAnswered: false,
};

// ── DOM / canvas ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('hg-canvas');
if (!canvas) throw new Error('Canvas #hg-canvas not found — check index.html');
const ctx = canvas.getContext('2d');

// ── Hi-DPI crisp canvas (backing store = logical × DPR) ────────────
// We draw in logical CW×CH units; pointer math therefore maps with the
// LOGICAL height (see getCanvasY) — the two move together (B1).
let DPR = 1;
function setupCanvas() {
  DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5));
  canvas.width  = Math.round(CW * DPR);
  canvas.height = Math.round(CH * DPR);
  render();
}

// ── Math helpers ──────────────────────────────────────────────────
const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const snapMm = mm => Math.round(mm / LC) * LC;

function getMSR(mm)  { return Math.floor(mm + 1e-9); }
function getFrac(mm) { return mm - getMSR(mm); }
/** Coincident vernier division (0–49) — the VSR. */
function getVSR(mm)  { return Math.round(getFrac(mm) / LC) % VSD_N; }

/** y of a given mm on the main scale (higher mm → higher up). */
function yMm(mm)     { return SCALE_0_Y - mm * PXMM; }
/** y of the scriber carbide tip for a reading (mm=0 → on the plate). */
function tipYmm(mm)  { return PLATE_TOP - mm * PXMM; }
/** Lowest reading the slider may reach — the workpiece top stops it (quiz). */
function minMm()     { return state.hasWorkpiece ? state.workpieceH : MIN_MM; }
/** Is the scriber resting on the workpiece top? */
function isResting() { return state.hasWorkpiece && Math.abs(state.mm - state.workpieceH) <= LC / 2 + 1e-9; }

// ── Drawing helpers ───────────────────────────────────────────────
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  const clr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + clr, y);
  ctx.lineTo(x + w - clr, y);  ctx.arcTo(x + w, y, x + w, y + clr, clr);
  ctx.lineTo(x + w, y + h - clr); ctx.arcTo(x + w, y + h, x + w - clr, y + h, clr);
  ctx.lineTo(x + clr, y + h);  ctx.arcTo(x, y + h, x, y + h - clr, clr);
  ctx.lineTo(x, y + clr);      ctx.arcTo(x, y, x + clr, y, clr);
  ctx.closePath();
}

function drawDome(cx, cy, r, hue) {
  hue = hue || '#7d8cb6';
  const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.15, cx, cy, r);
  g.addColorStop(0, '#dbe1ee'); g.addColorStop(0.35, hue); g.addColorStop(1, '#1c2236');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + (r - 1.8) * Math.cos(a), cy + (r - 1.8) * Math.sin(a));
    ctx.lineTo(cx + r * Math.cos(a),         cy + r * Math.sin(a));
    ctx.strokeStyle = 'rgba(10,14,26,0.75)'; ctx.lineWidth = 0.7; ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(220,230,255,0.35)'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
}

function drawScrewHead(cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, '#e8edf6'); g.addColorStop(0.6, '#8a92a8'); g.addColorStop(1, '#2b3142');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(20,24,36,0.85)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy); ctx.lineTo(cx + r * 0.6, cy);
  ctx.strokeStyle = 'rgba(15,18,28,0.95)'; ctx.lineWidth = 1; ctx.stroke();
}

// ── Background ─────────────────────────────────────────────────────
function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0, '#12222c'); bg.addColorStop(0.55, '#0b1820'); bg.addColorStop(1, '#060f15');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, CW, CH);
  const glow = ctx.createRadialGradient(CW * 0.45, 70, 40, CW * 0.45, 70, CW * 0.9);
  glow.addColorStop(0, 'rgba(125,175,205,0.10)'); glow.addColorStop(1, 'rgba(125,175,205,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, CW, CH);
}

// ── Surface plate (matte granite) ─────────────────────────────────
function drawSurfacePlate() {
  const px = PLATE_L, py = PLATE_TOP, pw = PLATE_R - PLATE_L, ph = PLATE_BOT - PLATE_TOP;
  // contact shadow
  const ss = ctx.createLinearGradient(0, py, 0, py + 9);
  ss.addColorStop(0, 'rgba(0,0,0,0.45)'); ss.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = ss; ctx.fillRect(BASE_L - 10, py, (BASE_R - BASE_L) + 20, 9);

  const g = ctx.createLinearGradient(0, py, 0, py + ph);
  g.addColorStop(0, '#1a1d24'); g.addColorStop(0.25, '#13161c'); g.addColorStop(1, '#0a0c11');
  ctx.fillStyle = g; rrect(px, py, pw, ph, 3); ctx.fill();

  ctx.save(); rrect(px, py, pw, ph, 3); ctx.clip();
  for (let i = 0; i < 300; i++) {
    const sx = px + ((i * 2657) % pw);
    const sy = py + ((i * 1543) % ph);
    ctx.fillStyle = (i % 7 === 0) ? 'rgba(220,225,235,0.30)' : 'rgba(150,160,180,0.15)';
    ctx.fillRect(sx, sy, (i % 5 === 0) ? 0.9 : 0.5, (i % 5 === 0) ? 0.9 : 0.5);
  }
  const sh = ctx.createLinearGradient(0, py, 0, py + 8);
  sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sh; ctx.fillRect(px, py, pw, 8);
  ctx.restore();

  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + pw, py);
  ctx.strokeStyle = 'rgba(170,180,200,0.55)'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = 'rgba(140,150,170,0.42)';
  ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('GRANITE SURFACE PLATE', (PLATE_L + PLATE_R) / 2, py + ph * 0.62);
}

// ── Workpiece (quiz only — a block of unknown height to be measured) ──
// Top surface sits at the workpiece height; the scriber tip stops here.
function drawWorkpiece() {
  const H = state.workpieceH;
  const ww = 90, wx = SCR_TIP_X - ww / 2 + 4;     // centred under the carbide tip
  const wy = tipYmm(H);                            // top surface = the height
  const wh = PLATE_TOP - wy;
  if (wh < 4) return;

  const sg = ctx.createLinearGradient(0, PLATE_TOP, 0, PLATE_TOP + 8);
  sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(wx - 4, PLATE_TOP, ww + 12, 8);

  const g = ctx.createLinearGradient(wx, 0, wx + ww, 0);
  g.addColorStop(0, '#3a4258'); g.addColorStop(0.2, '#6f7a96');
  g.addColorStop(0.55, '#8c97b3'); g.addColorStop(0.85, '#6f7a96'); g.addColorStop(1, '#3a4258');
  ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);

  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let y = wy + 2; y < PLATE_TOP; y += 3) { ctx.beginPath(); ctx.moveTo(wx, y); ctx.lineTo(wx + ww, y); ctx.stroke(); }
  ctx.restore();

  const resting = isResting();
  // top surface — glows green when the scriber is resting on it
  ctx.strokeStyle = resting ? 'rgba(61,220,132,0.95)' : 'rgba(230,238,252,0.6)';
  ctx.lineWidth = resting ? 2 : 1;
  if (resting) { ctx.shadowColor = 'rgba(61,220,132,0.8)'; ctx.shadowBlur = 8; }
  ctx.beginPath(); ctx.moveTo(wx, wy + 0.5); ctx.lineTo(wx + ww, wy + 0.5); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(20,25,40,0.7)'; ctx.lineWidth = 1;
  ctx.strokeRect(wx + 0.5, wy + 0.5, ww - 1, wh - 1);

  // "?" label on the block face (its height is what the user must find)
  ctx.fillStyle = 'rgba(220,230,250,0.5)';
  ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (wh > 30) ctx.fillText('?', wx + ww / 2, Math.min(wy + wh / 2, PLATE_TOP - 18));

  if (!resting) {
    ctx.fillStyle = 'rgba(140,170,205,0.7)'; ctx.font = '10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('▼ lower onto the block', wx + ww / 2, wy - 6);
  }
}

// ── Base ───────────────────────────────────────────────────────────
function drawBase() {
  const bx = BASE_L, by = BASE_TOP, bw = BASE_R - BASE_L, bh = PLATE_TOP - BASE_TOP;
  const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
  g.addColorStop(0, '#1d2236'); g.addColorStop(0.12, '#3a4468'); g.addColorStop(0.5, '#52608a');
  g.addColorStop(0.88, '#3a4468'); g.addColorStop(1, '#1d2236');
  ctx.fillStyle = g; rrect(bx, by, bw, bh, 4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(bx + 3, by + 1); ctx.lineTo(bx + bw - 3, by + 1);
  ctx.strokeStyle = 'rgba(220,232,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = 'rgba(8,11,18,0.85)'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(bx + 2, by + bh - 1); ctx.lineTo(bx + bw - 2, by + bh - 1); ctx.stroke();
  ctx.strokeStyle = 'rgba(160,175,220,0.30)'; ctx.lineWidth = 1; rrect(bx, by, bw, bh, 4); ctx.stroke();

  // spec plate
  const px = bx + 12, py = by + 7, pw = 80, ph = 15;
  ctx.fillStyle = '#0d1422'; rrect(px, py, pw, ph, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(180,195,235,0.30)'; ctx.lineWidth = 0.8; rrect(px, py, pw, ph, 2); ctx.stroke();
  ctx.fillStyle = '#d6e2f5'; ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('0–120 mm · 0.02', px + pw / 2, py + ph / 2);
}

// ── Beam / column ──────────────────────────────────────────────────
function drawBeam() {
  const top = 14, bot = BASE_TOP + 6;
  // AO at beam-base junction
  const aoG = ctx.createLinearGradient(0, bot - 14, 0, bot);
  aoG.addColorStop(0, 'rgba(0,0,0,0)'); aoG.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = aoG; ctx.fillRect(BX - 4, bot - 14, BEAM_R - BX + 8, 14);

  // beam body — satin steel
  const g = ctx.createLinearGradient(BX, 0, BEAM_R, 0);
  g.addColorStop(0, '#141a2c'); g.addColorStop(0.18, '#9aa6c4'); g.addColorStop(0.5, '#c6d0e4');
  g.addColorStop(0.82, '#9aa6c4'); g.addColorStop(1, '#141a2c');
  ctx.fillStyle = g; ctx.fillRect(BX, top, BEAM_R - BX, bot - top);
  ctx.strokeStyle = 'rgba(20,25,40,0.55)'; ctx.lineWidth = 0.8;
  ctx.strokeRect(BX, top, BEAM_R - BX, bot - top);

  // top cap
  const capG = ctx.createLinearGradient(0, top, 0, top + 10);
  capG.addColorStop(0, '#6a7a9c'); capG.addColorStop(1, '#252c44');
  ctx.fillStyle = capG; rrect(BX - 3, top, BEAM_R - BX + 6, 10, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(180,195,235,0.4)'; ctx.lineWidth = 0.8; rrect(BX - 3, top, BEAM_R - BX + 6, 10, 2); ctx.stroke();
}

// ── Main scale (engraved on the beam; ticks point RIGHT of boundary) ──
function drawMainScale() {
  ctx.save();
  ctx.beginPath(); ctx.rect(BX - 1, 8, BEAM_R - BX + 60, BASE_TOP - 8); ctx.clip();
  for (let i = MIN_MM; i <= MAX_DRAW_MM; i++) {
    const y = yMm(i);
    if (y < 10) break;
    let len, lw, a;
    if (i % 10 === 0)      { len = M_TICK_MAJOR; lw = 1.4; a = 0.95; }
    else if (i % 5 === 0)  { len = M_TICK_MED;   lw = 1.0; a = 0.78; }
    else                   { len = M_TICK_MIN;   lw = 0.6; a = 0.5; }
    ctx.beginPath(); ctx.moveTo(BX, y); ctx.lineTo(BX + len, y);
    ctx.strokeStyle = `rgba(10,15,28,${a})`; ctx.lineWidth = lw; ctx.stroke();
    if (i % 10 === 0 && i <= MAX_MM) {
      ctx.fillStyle = 'rgba(10,15,28,0.95)'; ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(i, M_LABEL_X, y);
    }
  }
  // "mm" unit
  ctx.fillStyle = 'rgba(10,15,28,0.7)'; ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText('mm', M_LABEL_X, yMm(MAX_MM) - 4);
  ctx.restore();
}

// ── Carriage / slider (carries the vernier; rides the boundary) ───
function drawCarriage(mm) {
  const carY = yMm(mm);
  const vTop = carY - VSD_N * VSD_PX - 8;     // top of the 49 mm vernier window
  const bodyTop = vTop - 10;
  const bodyBot = carY + 36;

  // ── slider body ──
  const g = ctx.createLinearGradient(CAR_L, 0, CAR_R, 0);
  g.addColorStop(0, '#161c30'); g.addColorStop(0.14, '#2c3450'); g.addColorStop(0.5, '#454e72');
  g.addColorStop(0.7, '#3a4264'); g.addColorStop(1, '#141a2c');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 9; ctx.shadowOffsetX = -3;
  ctx.fillStyle = g; rrect(CAR_L, bodyTop, CAR_R - CAR_L, bodyBot - bodyTop, 7); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(130,148,210,0.4)'; ctx.lineWidth = 1.2;
  rrect(CAR_L, bodyTop, CAR_R - CAR_L, bodyBot - bodyTop, 7); ctx.stroke();
  // left bevel highlight
  ctx.fillStyle = 'rgba(220,232,255,0.18)'; ctx.fillRect(CAR_L + 1, bodyTop + 4, 1.5, bodyBot - bodyTop - 8);

  // ── vernier chrome plate (where the vernier scale is engraved) ──
  const vg = ctx.createLinearGradient(VP_L, 0, BX, 0);
  vg.addColorStop(0, '#3a4262'); vg.addColorStop(0.25, '#a4afca'); vg.addColorStop(0.7, '#c8d2e4'); vg.addColorStop(1, '#aeb9d2');
  ctx.fillStyle = vg; rrect(VP_L, vTop, BX - VP_L, carY + 6 - vTop, 2); ctx.fill();
  ctx.strokeStyle = 'rgba(20,25,40,0.5)'; ctx.lineWidth = 0.8; rrect(VP_L, vTop, BX - VP_L, carY + 6 - vTop, 2); ctx.stroke();

  // mounting screws on the plate
  drawScrewHead(VP_L + 6, vTop + 6, 2.4);
  drawScrewHead(VP_L + 6, carY - 2, 2.4);

  // ── fine-adjust slider (small block clamped below) ──
  const fTop = bodyBot + 3, fH = 22;
  const fg = ctx.createLinearGradient(CAR_L + 10, 0, CAR_R, 0);
  fg.addColorStop(0, '#161c30'); fg.addColorStop(0.5, '#3a4366'); fg.addColorStop(1, '#161c30');
  ctx.fillStyle = fg; rrect(CAR_L + 14, fTop, CAR_R - CAR_L - 22, fH, 4); ctx.fill();
  ctx.strokeStyle = 'rgba(130,148,210,0.3)'; ctx.lineWidth = 1; rrect(CAR_L + 14, fTop, CAR_R - CAR_L - 22, fH, 4); ctx.stroke();
  ctx.fillStyle = 'rgba(180,195,235,0.55)'; ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('FINE', (CAR_L + CAR_R) / 2 - 2, fTop + fH / 2);
  drawDome(CAR_L + 8, fTop + fH / 2, 7, '#5e6c94');           // fine wheel
  // lock knobs on the body
  drawDome(CAR_L + 18, bodyTop + 14, 8, '#6a7896');           // main lock
  drawScrewHead(VP_L - 6, bodyTop + 12, 3);
}

// ── Vernier scale — FULL SCALE, TRUE POSITIONS (ticks point LEFT) ──
function drawVernierScale(mm) {
  const carY = yMm(mm);
  const alignIdx = getVSR(mm);
  let vLabelGap = 10;                         // 50-div scale → label every 10

  ctx.save();
  for (let j = 0; j <= VSD_N; j++) {
    const y = carY - j * VSD_PX;              // upward, same sense as main scale
    if (y < 8) break;
    const labeled = (j % vLabelGap === 0);
    const aligned = state.showAlign && (j === alignIdx);
    const len = labeled ? V_TICK_MAJOR : V_TICK_MIN;
    if (aligned) {
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.4;
      ctx.shadowColor = 'rgba(245,200,66,0.9)'; ctx.shadowBlur = 8;
    } else {
      ctx.strokeStyle = 'rgba(10,15,28,0.9)';
      ctx.lineWidth = labeled ? 1.2 : 0.6; ctx.shadowBlur = 0;
    }
    ctx.beginPath(); ctx.moveTo(BX, y); ctx.lineTo(BX - len, y); ctx.stroke();
    ctx.shadowBlur = 0;
    if (labeled || aligned) {
      ctx.fillStyle = aligned ? '#b5860b' : 'rgba(10,15,28,0.9)';
      ctx.font = (aligned ? 'bold ' : '') + '9px sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(j, V_LABEL_X, y);
    }
  }
  ctx.restore();

  // cyan index line (vernier zero = the reading) across the plate
  ctx.beginPath(); ctx.moveTo(VP_L + 2, carY); ctx.lineTo(BX, carY);
  ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 2;
  ctx.shadowColor = 'rgba(79,195,247,0.55)'; ctx.shadowBlur = 5; ctx.stroke(); ctx.shadowBlur = 0;
  // "0" at the index
  ctx.fillStyle = '#0a3a55'; ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText('0', V_LABEL_X, carY);
}

// ── Scriber (projects LEFT from the slider to a carbide tip) ──────
function drawScriber(mm) {
  const carY = yMm(mm);
  const tipY = tipYmm(mm);                    // SCR_DROP below carY
  ctx.save();
  // clamp boss on the slider
  const clx = CAR_L - 6;
  const cg = ctx.createLinearGradient(clx, 0, CAR_L + 16, 0);
  cg.addColorStop(0, '#222a44'); cg.addColorStop(0.5, '#48527a'); cg.addColorStop(1, '#222a44');
  ctx.fillStyle = cg; rrect(clx, carY - 14, 28, 28, 3); ctx.fill();
  ctx.strokeStyle = 'rgba(150,165,210,0.45)'; ctx.lineWidth = 0.9; rrect(clx, carY - 14, 28, 28, 3); ctx.stroke();
  drawScrewHead(clx + 14, carY - 12, 3);      // clamp screw

  // tempered-steel blade: horizontal from clamp, then angled down to the tip
  const hingeX = clx, horizEndX = SCR_TIP_X + 16, thk = 5;
  const bg = ctx.createLinearGradient(0, carY - thk, 0, tipY + 2);
  bg.addColorStop(0, '#cad3e6'); bg.addColorStop(0.4, '#9aa5be'); bg.addColorStop(0.8, '#5e6883'); bg.addColorStop(1, '#2a3046');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(hingeX, carY - thk / 2);
  ctx.lineTo(horizEndX, carY - thk / 2);
  ctx.lineTo(SCR_TIP_X + 1.5, tipY - 1);
  ctx.lineTo(SCR_TIP_X, tipY);
  ctx.lineTo(SCR_TIP_X + 4, tipY + 0.6);
  ctx.lineTo(horizEndX + 2, carY + thk / 2);
  ctx.lineTo(hingeX, carY + thk / 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(15,20,32,0.85)'; ctx.lineWidth = 0.9; ctx.stroke();
  // polish highlight
  ctx.beginPath();
  ctx.moveTo(hingeX + 1, carY - thk / 2 + 0.6);
  ctx.lineTo(horizEndX, carY - thk / 2 + 0.6);
  ctx.lineTo(SCR_TIP_X + 2, tipY - 1.4);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 0.7; ctx.stroke();
  // carbide tip
  ctx.fillStyle = '#e6ecf5';
  ctx.beginPath(); ctx.moveTo(SCR_TIP_X, tipY); ctx.lineTo(SCR_TIP_X + 5, tipY - 2); ctx.lineTo(SCR_TIP_X + 5.5, tipY + 0.4); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(15,20,32,0.9)'; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.restore();
}

// ── Height dimension line (datum → scriber tip) ───────────────────
function drawHeightDimension(mm) {
  if (mm < 0.4) return;
  const tipY = tipYmm(mm), baseY = PLATE_TOP, dimX = SCR_TIP_X - 16;
  ctx.save();
  ctx.strokeStyle = 'rgba(79,195,247,0.5)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(dimX - 6, baseY); ctx.lineTo(dimX + 6, baseY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(dimX - 6, tipY);  ctx.lineTo(dimX + 6, tipY);  ctx.stroke();
  ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(dimX, baseY); ctx.lineTo(dimX, tipY); ctx.stroke(); ctx.setLineDash([]);
  [[tipY, -1], [baseY, 1]].forEach(([ay, dir]) => {
    ctx.fillStyle = 'rgba(79,195,247,0.65)';
    ctx.beginPath(); ctx.moveTo(dimX, ay); ctx.lineTo(dimX - 4, ay + dir * 7); ctx.lineTo(dimX + 4, ay + dir * 7); ctx.closePath(); ctx.fill();
  });
  if (state.mode === 'free') {
    const htxt = 'h = ' + state.mm.toFixed(2);
    ctx.font = 'bold 10px sans-serif'; ctx.textBaseline = 'middle';
    const tw = ctx.measureText(htxt).width, bw = tw + 12;
    const bx = Math.max(3, dimX - 10 - bw), by = clamp((baseY + tipY) / 2 - 8, 40, PLATE_TOP - 22);
    ctx.fillStyle = 'rgba(0,0,0,0.65)'; rrect(bx, by, bw, 16, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(79,195,247,0.45)'; ctx.lineWidth = 0.8; rrect(bx, by, bw, 16, 3); ctx.stroke();
    ctx.fillStyle = '#4fc3f7'; ctx.textAlign = 'left'; ctx.fillText(htxt, bx + 6, by + 8);
  }
  ctx.restore();
}

// ── LC badge ───────────────────────────────────────────────────────
function drawLcBadge() {
  ctx.save();
  // LC badge (top-left, fills the empty corner; clear of the Zoom button)
  const txt = 'LC = ' + LC.toFixed(2) + ' mm', bx = 16, by = 14;
  ctx.font = 'bold 11px sans-serif';
  const bw = ctx.measureText(txt).width + 16;
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; rrect(bx, by, bw, 20, 5); ctx.fill();
  ctx.strokeStyle = 'rgba(255,183,77,0.55)'; ctx.lineWidth = 0.8; rrect(bx, by, bw, 20, 5); ctx.stroke();
  ctx.fillStyle = '#ffb74d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, bx + bw / 2, by + 10);

  // hint to use Zoom for the fine coincidence
  ctx.fillStyle = 'rgba(140,170,205,0.6)'; ctx.font = '10px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('50-division vernier · 1 div = 0.98 mm', 16, by + 28);
  ctx.fillText('Tap Zoom to read the coinciding line', 16, by + 44);

  // engraved maker mark in the empty field
  ctx.font = 'italic 700 13px Georgia, serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillText('NHIT VisualLab', 18, CH * 0.30 + 1);
  ctx.fillStyle = 'rgba(120,140,165,0.10)'; ctx.fillText('NHIT VisualLab', 18, CH * 0.30);
  ctx.restore();
}

// ── Main draw (pure; layered back-to-front; drawn in the CURRENT
//    transform so the zoomed pass can scale/translate around it). ──
function draw() {
  drawBackground();
  drawSurfacePlate();
  if (state.hasWorkpiece) drawWorkpiece();   // quiz only — block to measure
  drawBase();
  drawBeam();
  drawCarriage(state.mm);     // slider body under the engraved scales
  drawScriber(state.mm);
  drawMainScale();            // main ticks always on top of the beam/grip
  drawVernierScale(state.mm); // vernier ticks + gold coincidence + index
  if (state.mode === 'free') drawHeightDimension(state.mm);
  drawLcBadge();
}

// ── Zoomed render — centre on the COINCIDENCE point ───────────────
function drawZoomed() {
  const ZF   = ZOOM_FACTOR;
  const srcW = CW / ZF, srcH = CH / ZF;
  const carY = yMm(state.mm);
  const coincX = BX;
  const coincY = carY - getVSR(state.mm) * VSD_PX;   // the gold vernier line
  const srcX = clamp(coincX - srcW * 0.5, 0, CW - srcW);
  const srcY = clamp(coincY - srcH * 0.5, 0, CH - srcH);
  ctx.save();
  ctx.scale(ZF, ZF);
  ctx.translate(-srcX, -srcY);
  draw();
  ctx.restore();
}

// ── Reading panel update ──────────────────────────────────────────
function updateReadingPanel() {
  const mm  = state.mm;
  const msr = getMSR(mm);
  const vsr = getVSR(mm);
  const tr  = msr + vsr * LC;
  $('readout-display').textContent = mm.toFixed(2);
  $('msr-val').textContent = msr;
  $('vsr-val').textContent = vsr;
  $('lc-val').textContent  = LC.toFixed(2);
  $('f-msr').textContent   = msr;
  $('f-vsr').textContent   = vsr;
  $('f-lc').textContent    = LC.toFixed(2);
  $('f-msr2').textContent  = msr;
  $('f-part').textContent  = (vsr * LC).toFixed(2);
  $('f-tr').textContent    = tr.toFixed(2);
}

// ── Render ────────────────────────────────────────────────────────
function render() {
  updateReadingPanel();
  // clear the whole backing store at identity, then draw in DPR-scaled space
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (state.zoomOpen) drawZoomed(); else draw();
}

// ── Animation ─────────────────────────────────────────────────────
function animStep(ts) {
  if (!state.playing) return;
  if (state.animLast) {
    const dt = (ts - state.animLast) / 1000;
    let next = state.mm + state.animDir * ANIM_SPEED * dt;
    if (next >= MAX_MM) { next = MAX_MM; state.animDir = -1; }
    if (next <= MIN_MM) { next = MIN_MM; state.animDir =  1; }
    state.mm = snapMm(clamp(next, MIN_MM, MAX_MM));
  }
  state.animLast = ts;
  state.animRaf  = requestAnimationFrame(animStep);
  render();
}

function startAnim() {
  if (state.animRaf) cancelAnimationFrame(state.animRaf);
  state.playing  = true;
  state.animLast = 0;
  state.animDir  = Math.random() < 0.5 ? 1 : -1;
  $('btn-play').innerHTML = '&#9646;&#9646;&nbsp; Pause';
  $('btn-play').classList.add('playing');
  $('btn-check').disabled   = true;
  $('practice-input').value = '';
  $('feedback').textContent = '';
  $('feedback').className   = 'feedback';
  state.animRaf = requestAnimationFrame(animStep);
}

function stopAnim() {
  state.playing = false;
  if (state.animRaf) { cancelAnimationFrame(state.animRaf); state.animRaf = null; }
  state.animLast   = 0;
  state.quizTarget = state.mm;
  state.answered   = false;
  $('btn-play').innerHTML = '&#9654;&nbsp; Play';
  $('btn-play').classList.remove('playing');
  $('btn-check').disabled   = false;
  $('practice-input').value = '';
  $('practice-input').focus();
}

// ── Practice mode ─────────────────────────────────────────────────
function newQuestion() {
  if (state.playing) stopAnim();
  state.mm         = snapMm(3 + Math.random() * 114);
  state.quizTarget = 0;
  state.answered   = false;
  $('practice-input').value = '';
  $('feedback').textContent = '';
  $('feedback').className   = 'feedback';
  $('btn-check').disabled   = true;
  $('btn-play').innerHTML   = '&#9654;&nbsp; Play';
  $('btn-play').classList.remove('playing');
  $('reading-cells').classList.add('cells-hidden');
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('dr-label').textContent = 'Your Answer';
  render();
}

function checkAnswer() {
  if (state.answered || state.playing) return;
  const input = parseFloat($('practice-input').value);
  if (isNaN(input)) {
    $('feedback').textContent = 'Enter a number first.';
    $('feedback').className   = 'feedback err';
    return;
  }
  state.attempts++;
  const correct = state.mm;
  const ok      = Math.abs(input - correct) <= LC / 2 + 1e-9;
  $('readout-display').textContent   = correct.toFixed(2);
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Measurement';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  if (ok) {
    state.score++;
    $('feedback').innerHTML = `&#10003; Correct! &nbsp;<strong>${correct.toFixed(2)} mm</strong>`;
    $('feedback').className = 'feedback ok';
  } else {
    $('feedback').innerHTML = `&#10007; Wrong &nbsp;|&nbsp; Answer: <strong>${correct.toFixed(2)} mm</strong>`;
    $('feedback').className = 'feedback err';
  }
  state.answered = true;
  $('score').textContent    = state.score;
  $('attempts').textContent = state.attempts;
  $('btn-check').disabled   = true;
  render();
}

// ── Quiz mode ─────────────────────────────────────────────────────
function startQuiz() {
  // Each question is a random workpiece height the user must measure.
  const used = new Set();
  while (used.size < QUIZ_TOTAL) used.add(snapMm(22 + Math.random() * 82));   // 22–104 mm blocks
  state.quizQuestions = [...used];
  state.quizCurrent   = 0;
  state.quizAnswers   = [];
  state.quizAnswered  = false;
  state.hasWorkpiece  = true;
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  $('quiz-q-total').textContent  = QUIZ_TOTAL;
  showQuizQuestion(0);
}

function showQuizQuestion(idx) {
  state.workpieceH   = state.quizQuestions[idx];
  state.hasWorkpiece = true;
  // Start the scriber ABOVE the block so the user lowers it onto the top surface.
  state.mm           = clamp(snapMm(state.workpieceH + 16 + Math.random() * 14), state.workpieceH, MAX_MM);
  state.quizAnswered = false;
  $('quiz-q-num').textContent    = idx + 1;
  $('quiz-feedback').textContent = '';
  $('quiz-feedback').className   = 'quiz-feedback';
  $('btn-quiz-submit').style.display = '';
  $('btn-quiz-submit').disabled      = false;
  $('btn-quiz-next').style.display   = 'none';
  $('reading-cells').classList.add('cells-hidden');
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('practice-input').value          = '';
  $('dr-label').textContent          = 'Your Reading';
  setTimeout(() => $('practice-input').focus(), 50);
  render();
}

function submitQuizAnswer() {
  if (state.quizAnswered) return;
  if (!isResting()) {
    $('quiz-feedback').textContent = 'Lower the scriber until it rests on the block, then read the height.';
    $('quiz-feedback').className   = 'quiz-feedback err';
    return;
  }
  const input = parseFloat($('practice-input').value);
  if (isNaN(input)) {
    $('quiz-feedback').textContent = 'Enter a number first.';
    $('quiz-feedback').className   = 'quiz-feedback err';
    return;
  }
  const correct = state.workpieceH;
  const ok      = Math.abs(input - correct) <= LC / 2 + 1e-9;
  state.quizAnswers.push({ given: input, correct, ok });
  state.quizAnswered = true;
  $('readout-display').textContent   = correct.toFixed(2);
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Measurement';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('btn-quiz-submit').style.display = 'none';
  if (ok) {
    $('quiz-feedback').innerHTML = '&#10003; Correct!';
    $('quiz-feedback').className = 'quiz-feedback ok';
  } else {
    $('quiz-feedback').innerHTML =
      `&#10007; Incorrect &nbsp;|&nbsp; Answer: <strong>${correct.toFixed(2)} mm</strong>`;
    $('quiz-feedback').className = 'quiz-feedback err';
  }
  const isLast = state.quizCurrent + 1 >= QUIZ_TOTAL;
  $('btn-quiz-next').innerHTML     = isLast ? '&#128202;&nbsp;Results' : 'Next &rarr;';
  $('btn-quiz-next').style.display = '';
  render();
}

function nextQuizQuestion() {
  state.quizCurrent++;
  if (state.quizCurrent >= QUIZ_TOTAL) showQuizResult();
  else showQuizQuestion(state.quizCurrent);
}

function showQuizResult() {
  $('quiz-bar').style.display    = 'none';
  $('quiz-result').style.display = '';
  const score     = state.quizAnswers.filter(a => a.ok).length;
  const scoreEl   = $('qr-score');
  const starsEl   = $('qr-stars');
  const verdictEl = $('qr-verdict');
  scoreEl.textContent = `${score} / ${QUIZ_TOTAL}`;
  const sf = '&#9733;', se = '&#9734;';
  const filled = n => sf.repeat(n) + se.repeat(QUIZ_TOTAL - n);
  if (score === QUIZ_TOTAL) {
    scoreEl.className = 'qr-score perfect'; starsEl.innerHTML = filled(QUIZ_TOTAL);
    starsEl.style.color = 'var(--gold)'; verdictEl.textContent = 'Perfect score! 🎯';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.8)) {
    scoreEl.className = 'qr-score good'; starsEl.innerHTML = filled(score);
    starsEl.style.color = 'var(--green)'; verdictEl.textContent = 'Great job! Almost perfect 👍';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.6)) {
    scoreEl.className = 'qr-score good'; starsEl.innerHTML = filled(score);
    starsEl.style.color = 'var(--green)'; verdictEl.textContent = 'Good effort! Keep practising 💪';
  } else if (score >= 1) {
    scoreEl.className = 'qr-score poor'; starsEl.innerHTML = filled(score);
    starsEl.style.color = '#ffb74d'; verdictEl.textContent = 'Keep practising — you\'ll get it! 💪';
  } else {
    scoreEl.className = 'qr-score poor'; starsEl.innerHTML = filled(0);
    starsEl.style.color = 'var(--red)'; verdictEl.textContent = 'Try again — you can do it! 💪';
  }
  const rowsEl = $('qr-rows');
  rowsEl.innerHTML = '';
  state.quizAnswers.forEach((ans, i) => {
    const row = document.createElement('div');
    row.className = `qr-row ${ans.ok ? 'ok' : 'err'}`;
    row.innerHTML = `
      <span class="qr-qnum">Q${i + 1}</span>
      <span class="qr-correct">Correct: <strong>${ans.correct.toFixed(2)} mm</strong></span>
      <span class="qr-given">Your answer: <strong>${isNaN(ans.given) ? '—' : ans.given.toFixed(2)} mm</strong></span>
      <span class="qr-mark">${ans.ok ? '&#10003;' : '&#10007;'}</span>`;
    rowsEl.appendChild(row);
  });
  $('readout-display').textContent   = state.mm.toFixed(2);
  $('readout-display').style.display = 'block';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('dr-label').textContent = 'Measurement';
  render();
}

// ── Mode switching ─────────────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  $('practice-bar').style.display = 'none';
  $('quiz-bar').style.display     = 'none';
  $('quiz-result').style.display  = 'none';
  if (mode === 'practice') {
    $('practice-bar').style.display = '';
    $('canvas-card').style.cursor   = 'default';
    state.dragging = false;
    state.hasWorkpiece = false;
    newQuestion();
  } else if (mode === 'quiz') {
    $('canvas-card').style.cursor = 'ns-resize';   // user lowers the scriber
    state.dragging = false;
    startQuiz();
  } else {
    if (state.playing) stopAnim();
    state.hasWorkpiece = false;
    $('canvas-card').style.cursor     = 'ns-resize';
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent          = 'Measurement';
    $('reading-cells').classList.remove('cells-hidden');
    $('tr-formula').classList.remove('formula-hidden');
    render();
  }
}

// ── Drag interaction (vertical — up = increase mm) ────────────────
function getCanvasY(e) {
  const rect    = canvas.getBoundingClientRect();
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return (clientY - rect.top) * (CH / rect.height);   // LOGICAL height (B1)
}

// Drag allowed in free mode, and in quiz to lower the scriber onto the block.
function canDrag() {
  return state.mode === 'free' || (state.mode === 'quiz' && !state.quizAnswered);
}

function onDragStart(e) {
  if (!canDrag()) return;
  e.preventDefault();
  state.dragging  = true;
  state.dragRefY  = getCanvasY(e);
  state.dragRefMm = state.mm;
  if (!state.hinted) { $('drag-hint').classList.add('hidden'); state.hinted = true; }
}

function onDragMove(e) {
  if (!state.dragging) return;
  const deltaCanvasY = getCanvasY(e) - state.dragRefY;
  state.mm = clamp(snapMm(state.dragRefMm - deltaCanvasY / PXMM), minMm(), MAX_MM);
  render();
  e.preventDefault();
}

function onDragEnd() { state.dragging = false; }

// ── Keyboard ──────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (!canDrag()) return;
  const lo = minMm();
  if (e.key === 'ArrowUp')   { state.mm = clamp(snapMm(state.mm + LC), lo, MAX_MM); render(); e.preventDefault(); }
  if (e.key === 'ArrowDown') { state.mm = clamp(snapMm(state.mm - LC), lo, MAX_MM); render(); e.preventDefault(); }
  if (e.key === 'PageUp')    { state.mm = clamp(snapMm(state.mm + 1), lo, MAX_MM); render(); e.preventDefault(); }
  if (e.key === 'PageDown')  { state.mm = clamp(snapMm(state.mm - 1), lo, MAX_MM); render(); e.preventDefault(); }
});

// ── Scroll wheel ──────────────────────────────────────────────────
canvas.addEventListener('wheel', e => {
  if (!canDrag()) return;
  const dir = e.deltaY > 0 ? -1 : 1;
  state.mm = clamp(snapMm(state.mm + dir * LC), minMm(), MAX_MM);
  render();
  e.preventDefault();
}, { passive: false });

// ── Event wiring ──────────────────────────────────────────────────
canvas.addEventListener('mousedown',  onDragStart);
window.addEventListener('mousemove',  onDragMove);
window.addEventListener('mouseup',    onDragEnd);
canvas.addEventListener('touchstart', onDragStart, { passive: false });
window.addEventListener('touchmove',  onDragMove,  { passive: false });
window.addEventListener('touchend',   onDragEnd);

document.querySelectorAll('#mode-tabs .pill').forEach(btn =>
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-tabs .pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setMode(btn.dataset.value);
  })
);

$('btn-zoom').addEventListener('click', () => {
  state.zoomOpen = !state.zoomOpen;
  const btn = $('btn-zoom');
  // Keep the label in its own span — phones hide it and show the glyph alone.
  btn.innerHTML = state.zoomOpen
    ? '&#10005;<span class="zt-lbl">&nbsp;Close</span>'
    : '&#128269;<span class="zt-lbl">&nbsp;Zoom</span>';
  btn.setAttribute('aria-label', state.zoomOpen ? 'Close zoom' : 'Zoom');
  btn.classList.toggle('active', state.zoomOpen);
  render();
});

$('btn-play').addEventListener('click', () => { if (state.playing) stopAnim(); else startAnim(); });
$('btn-check').addEventListener('click', checkAnswer);
$('btn-new').addEventListener('click', newQuestion);
$('practice-input').addEventListener('input', () => {
  $('btn-check').disabled = $('practice-input').value.trim() === '';
});
$('practice-input').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (state.mode === 'practice') checkAnswer();
  else if (state.mode === 'quiz') submitQuizAnswer();
});

$('btn-quiz-submit').addEventListener('click', submitQuizAnswer);
$('btn-quiz-next').addEventListener('click', nextQuizQuestion);
$('btn-quiz-retry').addEventListener('click', () => {
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  startQuiz();
});

// ── Boot ──────────────────────────────────────────────────────────
window.addEventListener('resize', setupCanvas);
setupCanvas();
