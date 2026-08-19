(function () {
'use strict';
// ════════════════════════════════════════════════════════════════════
//  Screw Gauge (Micrometer) Simulator  —  app.js  v3
//  Dual-mode: SI (metric 0–15mm, LC 0.01mm) + Imperial (0–1", LC 0.001")
//  Features: Explore mode, Readout badges, Sound, IIFE
// ════════════════════════════════════════════════════════════════════

// ── SI instrument constants ───────────────────────────────────────
const SI = {
  pitch:    0.5,     // mm per full revolution
  csd:      50,      // circular scale divisions
  lc:       0.01,    // mm least count
  msdCount: 30,      // half-mm divisions on main scale
  maxMm:    15.0,    // usable range
  unit:     'mm',
};

// ── Imperial instrument constants ─────────────────────────────────
const IMP = {
  pitch:    0.025,   // inches per revolution (40 TPI)
  csd:      25,      // circular scale divisions
  lc:       0.001,   // inches least count
  msdCount: 40,      // 0.025" divisions on main scale (1 inch)
  maxMm:    25.4,    // 1 inch in mm
  maxInch:  1.0,
  unit:     'in',
};

// ── Original layout constants (world / image coordinate space) ────
const OX = {
  scaleX: 539, scaleY: 100, spindleX: 200, spindleY: 79,
  thimbleY1: 49, thimbleY3: 31, thimbleX2: 40, thimbleX3: 440,
};
const SCALE_WIN_W = OX.thimbleX3 - OX.thimbleX2 - 153;
const R1 = OX.scaleY - OX.thimbleY1;
const R2 = OX.scaleY - OX.thimbleY3;

// ── Canvas ────────────────────────────────────────────────────────
const DS = 0.75;
const CW = Math.round(1200 * DS);
const CH = 240;

const QUIZ_TOTAL  = 5;
const ANIM_SPEED  = 5;
const MM_TO_IN = 1 / 25.4;

// ── State ─────────────────────────────────────────────────────────
const state = {
  mm: 5.25, mode: 'free', unit: 'si',
  dragging: false, dragRefX: 0, dragRefMm: 0,
  zoomOpen: false, hinted: false,
  score: 0, attempts: 0, answered: false,
  playing: false, animDir: 1, animLast: 0, animRaf: null,
  quizQuestions: [], quizCurrent: 0, quizAnswers: [], quizAnswered: false,
  exploreCat: 0, exploreIdx: 0,
  audioCtx: null,
  zeOn: false, zeLc: 0,   // Zero Error: off by default; zeLc is signed integer count of LC units (±5)
  wp: null, wpRaf: null, pickerOpen: false,   // measure-an-object
  partIdx: 0, partPin: 0,                     // parts explorer
};

// ── DOM ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('gauge-canvas');
const ctx    = canvas.getContext('2d');

// ── Hi-DPI backing store ──────────────────────────────────────────
// Draw everything in logical CW×CH space; the backing store is CW*DPR ×
// CH*DPR so the vector scales/ticks/numbers render razor-sharp on Retina.
// Pointer mapping (getCanvasX) maps to this same logical space — keep them
// in lockstep (see correctness.md B1).
let DPR = 1;
function setupCanvas() {
  DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width  = Math.round(CW * DPR);
  canvas.height = Math.round(CH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
setupCanvas();

// ── Sprites ───────────────────────────────────────────────────────
const imgThimble = new Image(); imgThimble.src = 'assets/thimble.png';
const imgSpindle = new Image(); imgSpindle.src = 'assets/spindle.png';
const imgBase    = new Image(); imgBase.src    = 'assets/micrometer_base.png';
const imgTexture = new Image(); imgTexture.src = 'assets/texture9.png';

let loadedCount = 0;
function onImgLoad() { if (++loadedCount === 4) render(); }
[imgThimble, imgSpindle, imgBase, imgTexture].forEach(img => { img.onload = onImgLoad; img.onerror = onImgLoad; });

// ── Scale helpers ─────────────────────────────────────────────────
function isImperial() { return state.unit === 'imperial'; }
function getInst()    { return isImperial() ? IMP : SI; }
function getMaxMm()   { return getInst().maxMm; }
function getCsd()     { return getInst().csd; }
function getPitch()   { return isImperial() ? IMP.pitch * 25.4 : SI.pitch; } // in mm
function getLcMm()    { return isImperial() ? IMP.lc * 25.4 : SI.lc; }
function getLcDisplay(){ return getInst().lc; }
function getMsdCount(){ return getInst().msdCount; }
function uLabel()     { return getInst().unit; }

// Pixels per half-mm division (world coords) — scale stays consistent
function getMsdPx() { return 200 / getMsdCount(); }

function getShiftPx(mm) {
  return (mm / getPitch()) * getMsdPx();
}

function getMSR(mm) {
  const p = getPitch();
  const lc = getLcMm();
  // Work on the LC-quantized value so MSR and CSR always agree: when the
  // rounded fraction reaches a full revolution it belongs to the next MSR.
  const q = Math.round(mm / lc) * lc;
  return Math.floor(q / p + 1e-9) * p;
}

function getCSR(mm) {
  const p = getPitch();
  const lc = getLcMm();
  const q = Math.round(mm / lc) * lc;
  // With q on the LC grid, (q − MSR)/lc is an integer 0..csd−1 by construction:
  // a fraction that would round to a full revolution has already carried into
  // getMSR's floor, so the modulo never silently drops a pitch.
  return ((Math.round((q - getMSR(q)) / lc) % getCsd()) + getCsd()) % getCsd();
}

function snapToLc(mm) {
  const lc = getLcMm();
  return Math.round(mm / lc) * lc;
}

// A clamped part blocks the spindle from CLOSING past it: the anvil face is the
// fixed reference and the spindle tip stops on the part, exactly as on the real
// instrument. Every path that moves the spindle funnels through clampMm, so the
// stop cannot be bypassed. Snapping happens first, then the part stops the
// spindle — which is why a part can rest off the least-count grid, as in reality.
function wpMinMm() { return state.wp ? state.wp.mm : 0; }
const clampMm = mm => Math.max(wpMinMm(), Math.min(getMaxMm(), mm));

// ── Workpieces (measure a real object) ────────────────────────────
// World-coordinate geometry (drawGaugeContent runs inside the DS scale):
//   anvil measuring face → x = WP_FACE_X (base sprite's anvil rod ends there)
//   spindle tip          → x = WP_FACE_X + gap × px/mm  (probed: tip at 201+shift)
// so the gap drawn between the faces is exactly getDisplayMm-true px wide. A part
// rests against the ANVIL (as you would hold it) and is drawn exactly its true
// size wide; parts are centred on the measuring axis and extend above/below it,
// as real work does in a micrometer's throat.
const WP_FACE_X  = 200;   // anvil face, world px
const WP_AXIS_Y  = 100;   // measuring axis (spindle centreline), world px
const WP_MAX_HH  = 96;    // tallest half-height a part may draw, world px

function wpPxPerMm() { return getMsdPx() / getPitch(); }   // world px per mm

// Simulate set. True sizes are realistic, not tidy: stock is rolled or ground
// under nominal, and a 1/4″ ball is 6.35 mm exactly — which is why it reads a
// clean 0.250″ the moment you switch the instrument to Imperial.
const WORKPIECES = [
  { id: 'wire',  short: 'Wire',   name: 'Steel wire',          what: 'across the diameter',  mm: 1.62,  hMm: 22,   shape: 'cylV',
    note: '16 SWG wire, nominal 1.63 mm. Wire is the classic micrometer job &mdash; a vernier caliper cannot resolve the drawing tolerance on it.' },
  { id: 'sheet', short: 'Sheet',  name: 'Sheet metal strip',   what: 'across the thickness', mm: 1.22,  hMm: 20,   shape: 'bar',
    note: '18 SWG sheet = 1.219 mm nominal. Measure well inside the edge &mdash; shear rollover makes the first few millimetres thinner.' },
  { id: 'ball',  short: 'Ball',   name: 'Ball bearing',        what: 'across the diameter',  mm: 6.35,  hMm: 6.35, shape: 'ball',
    note: 'A 1/4&Prime; bearing ball = 6.35 mm exactly. Switch to Imperial and it reads a clean 0.250&Prime; &mdash; the same part, the same gap, two instruments.' },
  { id: 'pin',   short: 'Pin',    name: 'Dowel pin',           what: 'across the diameter',  mm: 7.98,  hMm: 20,   shape: 'cylV',
    note: 'An 8 mm h7 dowel: made 0&ndash;15 &micro;m under nominal so it presses into an 8 mm hole. Only a micrometer shows you that.' },
  { id: 'drill', short: 'Drill',  name: 'Drill shank',         what: 'across the diameter',  mm: 5.94,  hMm: 20,   shape: 'drill',
    note: 'A &Oslash;6 drill, shank ground a few hundredths under so it enters the chuck. Measure the plain shank, never across the flutes.' },
  { id: 'nut',   short: 'Hex nut', name: 'M5 hex nut',         what: 'across the flats',     mm: 7.92,  hMm: 9.15, shape: 'nut',
    note: 'ISO 4032 gives M5 a nominal 8.00 mm across flats, made to a minus tolerance. Measure across <em>flats</em>, never corners.' },
  { id: 'shim',  short: 'Shim',   name: 'Shim / feeler blade', what: 'across the thickness', mm: 0.48,  hMm: 16,   shape: 'bar',
    note: 'A 0.5 mm feeler blade, worn a shade under. Thin stock is the easiest thing to crush &mdash; close with the ratchet, never the thimble.' },
  { id: 'rod',   short: 'Rod',    name: 'Brass rod',           what: 'across the diameter',  mm: 9.52,  hMm: 20,   shape: 'cylV',
    note: '3/8&Prime; brass rod = 9.525 mm. Brass is soft: squeeze with the thimble and you can flatten a witness mark into it.' }
];

// Practice and Quiz draw from a SEPARATE catalogue. A student who has worked
// through Simulate has seen those eight sizes; graded exercises use different
// parts so the answer still has to be measured rather than recalled. Every size
// is an even number of hundredths (exact on the 0.01 mm grid, no half-LC ties)
// and the notes deliberately carry no dimensions.
const WP_EXERCISE = [
  { id: 'x1',  short: 'Wire',  name: 'Steel wire',        what: 'across the diameter',  mm: 2.36,  hMm: 22,   shape: 'cylV',
    note: 'Measure at three points along the wire — drawing dies wear, and the diameter drifts.' },
  { id: 'x2',  short: 'Wire',  name: 'Fine wire',         what: 'across the diameter',  mm: 0.90,  hMm: 22,   shape: 'cylV',
    note: 'Fine wire kinks under thimble pressure. Let the ratchet do the closing.' },
  { id: 'x3',  short: 'Sheet', name: 'Sheet strip',       what: 'across the thickness', mm: 1.58,  hMm: 20,   shape: 'bar',
    note: 'Keep the faces square to the anvil — a tilted strip reads thick.' },
  { id: 'x4',  short: 'Sheet', name: 'Plate offcut',      what: 'across the thickness', mm: 3.24,  hMm: 20,   shape: 'bar',
    note: 'Take the reading away from sheared edges.' },
  { id: 'x5',  short: 'Ball',  name: 'Bearing ball',      what: 'across the diameter',  mm: 4.76,  hMm: 4.76, shape: 'ball',
    note: 'A sphere between flat faces is always a diameter apart — angle cannot mislead you, squeeze can.' },
  { id: 'x6',  short: 'Ball',  name: 'Large ball',        what: 'across the diameter',  mm: 11.10, hMm: 11.10, shape: 'ball',
    note: 'Two readings at right angles should agree within a hundredth on a good ball.' },
  { id: 'x7',  short: 'Pin',   name: 'Dowel pin',         what: 'across the diameter',  mm: 6.52,  hMm: 20,   shape: 'cylV',
    note: 'Ground pins should read the same at both ends — taper means wear.' },
  { id: 'x8',  short: 'Pin',   name: 'Thick pin',         what: 'across the diameter',  mm: 9.98,  hMm: 20,   shape: 'cylV',
    note: 'Check the middle as well as the ends; centreless grinding can leave a barrel shape.' },
  { id: 'x9',  short: 'Drill', name: 'Drill shank',       what: 'across the diameter',  mm: 3.28,  hMm: 20,   shape: 'drill',
    note: 'The plain shank only — flutes give a false, smaller reading.' },
  { id: 'x10', short: 'Drill', name: 'Large drill shank', what: 'across the diameter',  mm: 7.44,  hMm: 20,   shape: 'drill',
    note: 'Shanks are ground under nominal so they enter the chuck.' },
  { id: 'x11', short: 'Hex nut', name: 'M4 hex nut',      what: 'across the flats',     mm: 6.86,  hMm: 7.92, shape: 'nut',
    note: 'Across FLATS, never corners — corners read about 15% larger.' },
  { id: 'x12', short: 'Hex nut', name: 'M8 hex nut',      what: 'across the flats',     mm: 12.88, hMm: 14.87, shape: 'nut',
    note: 'Nuts are made to a minus tolerance, so expect under nominal.' },
  { id: 'x13', short: 'Rod',   name: 'Silver-steel rod',  what: 'across the diameter',  mm: 11.94, hMm: 20,   shape: 'cylV',
    note: 'Precision-ground stock — this one should repeat to the last digit.' },
  { id: 'x14', short: 'Shim',  name: 'Shim blade',        what: 'across the thickness', mm: 0.64,  hMm: 16,   shape: 'bar',
    note: 'Hold thin stock flat against the anvil face before closing.' }
];

function findWp(id) {
  const all = WORKPIECES.concat(WP_EXERCISE);
  for (let i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

// Avoid handing out the same part twice in a row (or twice in one quiz).
function pickExerciseWp(exclude) {
  const pool = WP_EXERCISE.filter(function (w) { return !exclude || exclude.indexOf(w.id) < 0; });
  const from = pool.length ? pool : WP_EXERCISE;
  return from[Math.floor(Math.random() * from.length)];
}

function wpInContact() { return !!state.wp && state.mm <= state.wp.mm + 1e-6; }

// In Simulate the true size is shown on contact as instant feedback. In a graded
// exercise that would BE the answer, so every reveal — the canvas caption, the
// object bar's size and its resolution note — waits until the attempt is marked.
function wpRevealAllowed() {
  if (state.mode === 'practice') return !!state.answered;
  if (state.mode === 'quiz')     return !!state.quizAnswered;
  return state.mode === 'free';
}

// ── Workpiece drawing (world coordinates, inside the DS transform) ──
function wpSteel(x0, x1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0.00, '#4e5661');
  g.addColorStop(0.10, '#8b95a3');
  g.addColorStop(0.30, '#eef3f8');
  g.addColorStop(0.42, '#c4ccd8');
  g.addColorStop(0.62, '#98a2b0');
  g.addColorStop(0.86, '#6d7683');
  g.addColorStop(1.00, '#454c56');
  return g;
}

// Each silhouette is EXACTLY w px wide — w is the true size in pixels, so what
// the faces close on is what the drawing shows. Nothing may overhang the faces.
const WP_SHAPES = {
  bar: function (x, y, w, h) {                    // sheet / shim, on edge
    ctx.fillStyle = wpSteel(x, x + w);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, w - 1), h - 1);
  },
  cylV: function (x, y, w, h) {                   // wire / pin / rod, axis vertical
    ctx.fillStyle = wpSteel(x, x + w);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.30)';
    ctx.beginPath(); ctx.moveTo(x + w * 0.28, y + 2); ctx.lineTo(x + w * 0.28, y + h - 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, w - 1), h - 1);
  },
  ball: function (x, y, w, h) {
    const r = w / 2, cx = x + r, cy = y + h / 2;
    const g = ctx.createRadialGradient(cx - r * 0.34, cy - r * 0.40, r * 0.06, cx, cy, r);
    g.addColorStop(0.00, '#ffffff');
    g.addColorStop(0.16, '#e6edf5');
    g.addColorStop(0.48, '#a9b3c1');
    g.addColorStop(0.80, '#6d7683');
    g.addColorStop(1.00, '#3f464f');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(cx - r * 0.36, cy - r * 0.44, r * 0.20, r * 0.13, -0.5, 0, Math.PI * 2); ctx.fill();
  },
  nut: function (x, y, w, h) {
    // Hexagon with FLATS vertical: width = across flats (= w), height = across
    // corners = w × 2/√3.
    const cx = x + w / 2, cy = y + h / 2, af = w / 2, ac = h / 2;
    ctx.fillStyle = wpSteel(x, x + w);
    ctx.beginPath();
    ctx.moveTo(cx - af, cy - ac / 2); ctx.lineTo(cx, cy - ac); ctx.lineTo(cx + af, cy - ac / 2);
    ctx.lineTo(cx + af, cy + ac / 2); ctx.lineTo(cx, cy + ac); ctx.lineTo(cx - af, cy + ac / 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.lineWidth = 1; ctx.stroke();
    const br = af * 0.55;
    ctx.fillStyle = '#2b313a';
    ctx.beginPath(); ctx.arc(cx, cy, br, 0, Math.PI * 2); ctx.fill();
  },
  drill: function (x, y, w, h) {
    const shankH = h * 0.42;
    ctx.fillStyle = wpSteel(x, x + w);
    ctx.fillRect(x, y, w, h);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h - shankH); ctx.clip();
    ctx.strokeStyle = 'rgba(30,36,44,0.55)'; ctx.lineWidth = Math.max(1.4, w * 0.18);
    for (let k = -1; k < 6; k++) {
      ctx.beginPath();
      ctx.moveTo(x - w * 0.2, y + k * 14);
      ctx.bezierCurveTo(x + w * 0.5, y + k * 14 + 5, x + w * 0.5, y + k * 14 + 9, x + w * 1.2, y + k * 14 + 14);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(x, y + h - shankH, w, 1.5);
    ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, w - 1), h - 1);
  }
};

function drawWorkpiece() {
  const wp = state.wp;
  if (!wp) return;
  const ppm = wpPxPerMm();
  const w = wp.mm * ppm;
  const h = Math.min(wp.hMm * ppm, WP_MAX_HH * 2);
  const x = WP_FACE_X;
  const y = WP_AXIS_Y - h / 2;          // centred on the measuring axis
  const contact = wpInContact();

  ctx.save();
  (WP_SHAPES[wp.shape] || WP_SHAPES.bar)(x, y, w, h);
  ctx.restore();

  // Contact marks — thin bright lines on the two faces being touched.
  if (contact) {
    ctx.save();
    ctx.strokeStyle = 'rgba(61,220,132,0.95)'; ctx.lineWidth = 2.2;
    ctx.shadowColor = 'rgba(61,220,132,0.9)'; ctx.shadowBlur = 6;
    const half = Math.min(h * 0.38, 16);
    ctx.beginPath(); ctx.moveTo(x + 0.8, WP_AXIS_Y - half); ctx.lineTo(x + 0.8, WP_AXIS_Y + half); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - 0.8, WP_AXIS_Y - half); ctx.lineTo(x + w - 0.8, WP_AXIS_Y + half); ctx.stroke();
    ctx.restore();
  }
}

function wpDimText(contact) {
  const wp = state.wp;
  if (!contact) return wp.what;
  if (!wpRevealAllowed()) return 'read the scale';
  return isImperial() ? (wp.mm * MM_TO_IN).toFixed(3) + '″' : wp.mm.toFixed(2) + ' mm';
}

// Dimension line beneath the part, spanning exactly the measured face-to-face
// distance — a technical-drawing cue for WHICH dimension the faces are on.
function drawWorkpieceDims() {
  const wp = state.wp;
  if (!wp) return;
  const ppm = wpPxPerMm();
  const w = wp.mm * ppm;
  const h = Math.min(wp.hMm * ppm, WP_MAX_HH * 2);
  const x = WP_FACE_X;
  const contact = wpInContact();
  const partBottom = WP_AXIS_Y + h / 2;
  const dy = Math.min(partBottom + 22, 258);

  ctx.save();
  ctx.strokeStyle = contact ? 'rgba(61,220,132,0.9)' : 'rgba(180,196,216,0.6)';
  ctx.fillStyle   = ctx.strokeStyle;
  ctx.lineWidth = 1.2;
  // Witness lines from the measured faces down to the dimension line.
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(x, partBottom + 3); ctx.lineTo(x, dy + 5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w, partBottom + 3); ctx.lineTo(x + w, dy + 5); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.beginPath(); ctx.moveTo(x, dy); ctx.lineTo(x + w, dy); ctx.stroke();
  if (w > 18) {   // arrowheads inward when they fit, outward for thin parts
    [[x, 1], [x + w, -1]].forEach(function (a) {
      ctx.beginPath();
      ctx.moveTo(a[0], dy); ctx.lineTo(a[0] + 8 * a[1], dy - 3.4); ctx.lineTo(a[0] + 8 * a[1], dy + 3.4);
      ctx.closePath(); ctx.fill();
    });
  } else {
    [[x, -1], [x + w, 1]].forEach(function (a) {
      ctx.beginPath();
      ctx.moveTo(a[0], dy); ctx.lineTo(a[0] + 8 * a[1], dy - 3.4); ctx.lineTo(a[0] + 8 * a[1], dy + 3.4);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(a[0], dy); ctx.lineTo(a[0] + 16 * a[1], dy); ctx.stroke();
    });
  }
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const dimTxt = wpDimText(contact);
  const tw = ctx.measureText(dimTxt).width;
  const cx = Math.max(x + tw / 2 - 10, x + w / 2);
  ctx.fillStyle = 'rgba(6,12,18,0.78)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(cx - tw / 2 - 7, dy + 9, tw + 14, 20, 4);
  else ctx.rect(cx - tw / 2 - 7, dy + 9, tw + 14, 20);
  ctx.fill();
  ctx.fillStyle = contact ? '#3ddc84' : 'rgba(190,206,224,0.85)';
  ctx.fillText(dimTxt, cx, dy + 19);
  ctx.restore();
}

// ── Display formatting ────────────────────────────────────────────
function fmtReading(mm) {
  if (isImperial()) return (mm * MM_TO_IN).toFixed(3);
  return mm.toFixed(2);
}

function fmtMsr(mm) {
  // For negative ZE near closed jaws, displayMm can be slightly < 0; the barrel
  // physically shows MSR = 0 in that case (the 0 mm line is still at thimble edge).
  const msrMm = Math.max(0, getMSR(mm));
  if (isImperial()) return (msrMm * MM_TO_IN).toFixed(3);
  return msrMm.toFixed(2);
}

function fmtLc() {
  return isImperial() ? IMP.lc.toFixed(3) : SI.lc.toFixed(2);
}

function fmtTr(mm) {
  // The TR formula card shows the literal arithmetic of the displayed cells:
  // TR = (clamped MSR) + CSR × LC. For positive readings this equals fmtReading.
  // For negative-ZE-near-closed (rare edge case), this shows the raw sum
  // (0 + 47 × 0.01 = 0.47); the signed/corrected interpretation appears in the ZE box.
  const msr = Math.max(0, getMSR(mm));
  const csr = getCSR(mm);
  if (isImperial()) return (msr * MM_TO_IN + csr * IMP.lc).toFixed(3);
  return (msr + csr * SI.lc).toFixed(2);
}

function fmtPart(mm) {
  const csr = getCSR(mm);
  const lc = getLcDisplay();
  return (csr * lc).toFixed(isImperial() ? 3 : 2);
}

// ── Zero-error helpers ────────────────────────────────────────────
// Model: state.mm is the OBSERVED reading (what the canvas shows / the user reads).
// Corrected (true) reading = observed − zero error.
const ZE_MAX_LC = 5;
function getZeOffsetMm() { return state.zeOn ? state.zeLc * getLcMm() : 0; }
function clampZeLc(n) { return Math.max(-ZE_MAX_LC, Math.min(ZE_MAX_LC, n | 0)); }
function fmtZeSigned() {
  const dispVal = state.zeLc * getLcDisplay();
  const dp = isImperial() ? 3 : 2;
  if (state.zeLc === 0) return (0).toFixed(dp);
  const sign = state.zeLc > 0 ? '+' : '−';
  return sign + Math.abs(dispVal).toFixed(dp);
}
function parseNumericInput(raw) {
  const s = (raw || '').trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
  return parseFloat(s);
}

// ── Sound helpers ─────────────────────────────────────────────────
function getAudioCtx() {
  if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return state.audioCtx;
}
function playTone(freq, dur, type, vol) {
  try {
    const ac = getAudioCtx();
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || 'sine'; osc.frequency.value = freq;
    g.gain.value = vol || 0.08;
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(g); g.connect(ac.destination);
    osc.start(ac.currentTime); osc.stop(ac.currentTime + dur);
  } catch (e) { /* audio not available */ }
}
function playClick()   { playTone(800, 0.05, 'square', 0.04); }
function playTick()    { playTone(1200, 0.02, 'sine', 0.03); }
function playSuccess() { playTone(880, 0.12, 'sine', 0.1); setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 120); }
function playError()   { playTone(300, 0.2, 'sawtooth', 0.06); }
function playContact() { playTone(520, 0.06, 'square', 0.05); setTimeout(function(){ playTone(390, 0.09, 'square', 0.04); }, 55); }

// ── Core drawing ──────────────────────────────────────────────────
function drawGaugeContent() {
  // ── displayMm is the OBSERVED reading on the instrument = state.mm (TRUE) + ZE ──
  // For negative ZE near the closed jaws, displayMm can be slightly negative;
  // CSR/texture maths handle it via modular arithmetic, while spindle/thimble
  // translation is clamped so the thimble never moves past the anvil.
  const displayMm = state.mm + getZeOffsetMm();
  const csr       = getCSR(snapToLc(displayMm));
  const msdPx     = getMsdPx();
  const msdCount  = getMsdCount();
  const csd       = getCsd();
  const imperial  = isImperial();
  const N         = csd / 4;

  const rawShift  = getShiftPx(displayMm);
  const maxShift  = getShiftPx(getMaxMm());
  const shift     = Math.max(0, Math.min(maxShift, rawShift));

  // 0. Workpiece — drawn FIRST so the anvil (base) and spindle overlap its
  //    edges and it reads as gripped between the measuring faces.
  drawWorkpiece();

  // 1. Spindle
  ctx.drawImage(imgSpindle, OX.spindleX + shift, OX.spindleY,
    imgSpindle.naturalWidth, imgSpindle.naturalHeight);

  // 2. Base frame
  ctx.drawImage(imgBase, 0, 0, imgBase.naturalWidth, imgBase.naturalHeight);

  // 3. Main scale ticks
  {
    ctx.save();
    ctx.translate(OX.scaleX, OX.scaleY);
    ctx.strokeStyle = '#1a1a1a';
    ctx.fillStyle   = '#1a1a1a';
    ctx.lineWidth   = 1.5;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'bottom';

    const MAJ = 18, MED = 12, MIN = 9;

    if (imperial) {
      // Imperial 40 TPI: every 0.025" tick; all ticks ABOVE the datum line.
      // Major every 0.1" (i%4===0) labelled 1..9; inch boundaries bold.
      for (let i = 0; i <= msdCount; i++) {
        const x = i * msdPx;
        const isInch  = (i % 40 === 0);
        const isTenth = (i % 4  === 0);
        const isMid   = (i % 2  === 0);
        let len, lw;
        if (isInch)       { len = MAJ; lw = 1.8; }
        else if (isTenth) { len = MAJ; lw = 1.4; }
        else if (isMid)   { len = MED; lw = 1.0; }
        else              { len = MIN; lw = 0.8; }
        ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -len); ctx.stroke();

        if (isInch) {
          ctx.font = 'bold 11pt sans-serif';
          ctx.fillText(String(Math.round(i * IMP.pitch)), x, -MAJ - 2);
        } else if (isTenth) {
          ctx.font = '9pt sans-serif';
          ctx.fillText(String(i / 4), x, -MAJ - 2);
        }
      }
    } else {
      // SI: original metric scale
      for (let i = 0; i <= msdCount; i++) {
        const x = i * msdPx;
        let len;
        if (i % 2 === 1) len = -MIN;
        else if (i % 10 === 0) len = MAJ;
        else len = MED;
        ctx.lineWidth = (i % 10 === 0) ? 1.5 : 1.0;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, -len); ctx.stroke();
        if (i % 10 === 0) {
          ctx.font = 'bold 11pt sans-serif';
          ctx.fillText(String(i * SI.pitch), x, -MAJ - 2);
        }
      }
    }
    ctx.restore();
  }

  // 4. Thimble image
  ctx.drawImage(imgThimble, OX.scaleX + shift, OX.thimbleY3,
    imgThimble.naturalWidth, imgThimble.naturalHeight);

  // 5. Texture fill
  {
    const totalDivs = Math.floor(snapToLc(displayMm) / getPitch() + 1e-9) * csd + csr;
    const offsetY   = totalDivs * R1 * Math.PI / N / 2;
    const wx        = OX.scaleX + shift + OX.thimbleX2 + 49;

    const pat = ctx.createPattern(imgTexture, 'repeat');
    ctx.save();
    ctx.beginPath();
    ctx.rect(OX.scaleX + shift, OX.thimbleY3, SCALE_WIN_W, 2 * (OX.scaleY - OX.thimbleY3 - 1));
    ctx.clip();
    ctx.fillStyle = pat;
    ctx.translate(wx, OX.scaleY + offsetY);
    ctx.fillRect(0, -(R2 + offsetY), SCALE_WIN_W, 2 * R2);
    ctx.restore();
  }

  // 6. Gradient sheen
  {
    const wx  = OX.scaleX + shift + OX.thimbleX2 + 49;
    const grd = ctx.createLinearGradient(wx, OX.thimbleY3, wx, OX.thimbleY3 + 2 * R2);
    grd.addColorStop(0,   'rgba(0,0,0,0.85)');
    grd.addColorStop(0.5, 'rgba(184,203,184,0.55)');
    grd.addColorStop(1,   'rgba(0,0,0,0.85)');
    ctx.globalAlpha = 0.65;
    ctx.fillStyle = grd;
    ctx.fillRect(wx, OX.thimbleY3, SCALE_WIN_W, 2 * R2);
    ctx.globalAlpha = 1;
  }

  // 7. Circular scale ticks
  {
    const dth  = (Math.PI / 2) / N;
    const refX = OX.scaleX + shift;
    const MAJ_T = 28, MIN_T = 16;

    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(refX, OX.thimbleY1 - 2);
    ctx.lineTo(refX, OX.thimbleY1 + 2 * R1 + 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#111'; ctx.fillStyle = '#111';
    ctx.lineWidth = 1.2;
    ctx.font = '9pt sans-serif';
    ctx.textBaseline = 'middle';

    const labelEvery = imperial ? 5 : 5;

    for (let i = 0; i < Math.ceil(N) + 1; i++) {
      const sinTh = Math.sin(i * dth);
      if (sinTh > 0.70) ctx.globalAlpha = Math.max(0, 1 - 3 * (sinTh - 0.70));

      const dy1 = R1 * sinTh;

      // Upper tick
      const divU = (csr + i) % csd;
      const isMajU = divU % labelEvery === 0;
      const lenU = isMajU ? MAJ_T : MIN_T;
      const dy2U = dy1 * (R1 + (isMajU ? 8 : 4)) / R1;
      ctx.textAlign = 'left';
      ctx.beginPath(); ctx.moveTo(refX, OX.scaleY - dy1); ctx.lineTo(refX + lenU, OX.scaleY - dy2U); ctx.stroke();
      if (isMajU && i < Math.ceil(N) - 1) {
        ctx.fillText(String(divU), refX + lenU + 3, OX.scaleY - dy2U);
      }

      if (i === 0) { ctx.globalAlpha = 1; continue; }

      // Lower tick
      const divL = ((csr - i) % csd + csd) % csd;
      const isMajL = divL % labelEvery === 0;
      const lenL = isMajL ? MAJ_T : MIN_T;
      const dy2L = dy1 * (R1 + (isMajL ? 8 : 4)) / R1;
      ctx.beginPath(); ctx.moveTo(refX, OX.scaleY + dy1); ctx.lineTo(refX + lenL, OX.scaleY + dy2L); ctx.stroke();
      if (isMajL && i < Math.ceil(N) - 1) {
        ctx.fillText(String(divL), refX + lenL + 3, OX.scaleY + dy2L);
      }

      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  // 8. LC badge (free mode only)
  if (state.mode === 'free') {
    const lcTxt = 'LC = ' + fmtLc() + ' ' + uLabel();
    ctx.save();
    ctx.font = 'bold 8.5pt sans-serif';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    const tw = ctx.measureText(lcTxt).width;
    const bx = Math.min(OX.scaleX + shift - 40, 1200 * 0.97 / DS - 70);
    const bxC = bx - tw / 2 - 6;
    const by = 12;
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    if (ctx.roundRect) ctx.roundRect(bxC, by, tw + 12, 18, 4);
    else ctx.rect(bxC, by, tw + 12, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,200,66,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.fillText(lcTxt, bxC + tw / 2 + 6, by + 9);
    ctx.restore();
  }

  // 9. Workpiece dimension annotation, on top of everything.
  drawWorkpieceDims();
}

// Studio background: vertical gradient + accent spotlight behind the
// instrument + a soft contact shadow in the empty band below it, so the
// gauge sits on a surface instead of floating on flat fill.
function drawSceneBackground() {
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0,    '#10151f');
  bg.addColorStop(0.55, '#0d1117');
  bg.addColorStop(1,    '#090c11');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  const gx = CW * 0.5, gy = CH * 0.40;
  const glow = ctx.createRadialGradient(gx, gy, 30, gx, gy, CW * 0.6);
  glow.addColorStop(0, 'rgba(79,142,247,0.10)');
  glow.addColorStop(1, 'rgba(79,142,247,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  ctx.translate(CW * 0.5, CH * 0.70);
  ctx.scale(1, 0.16);
  const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, CW * 0.42);
  sh.addColorStop(0,   'rgba(0,0,0,0.5)');
  sh.addColorStop(0.7, 'rgba(0,0,0,0.22)');
  sh.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(0, 0, CW * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGauge() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (loadedCount < 4) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, CW, CH);
    ctx.fillStyle = '#6b7a99'; ctx.font = '14px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Loading sprites\u2026', CW / 2, CH / 2);
    return;
  }
  drawSceneBackground();
  ctx.save(); ctx.scale(DS, DS); drawGaugeContent(); ctx.restore();
}

function drawGaugeZoomed() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0, '#10151f');
  bg.addColorStop(1, '#090c11');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);
  if (loadedCount < 4) return;
  const ZDS = DS * 3.0;
  const displayMm = state.mm + getZeOffsetMm();
  const rawShift  = getShiftPx(displayMm);
  const maxShift  = getShiftPx(getMaxMm());
  const shift     = Math.max(0, Math.min(maxShift, rawShift));
  const offX = ZDS * (OX.scaleX + shift) - CW / 2;
  const offY = ZDS * OX.scaleY - CH / 2;
  ctx.save(); ctx.scale(ZDS, ZDS); ctx.translate(-offX / ZDS, -offY / ZDS);
  drawGaugeContent(); ctx.restore();
}

// ── Reading panel + badges ────────────────────────────────────────
// SEMANTICS:
//   state.mm  = TRUE measurement (physical gap between jaws)
//   obsMm     = OBSERVED reading on the canvas = state.mm + ZE (signed)
//   Corrected = state.mm  (=  Observed − ZE, by industry/NCERT convention)
function updateReadingPanel() {
  const u     = uLabel();
  const obsMm = state.mm + getZeOffsetMm();
  // MSR / CSR / TR describe what the student READS off the canvas → observed
  // values, QUANTIZED to the least count first. A workpiece can hold the spindle
  // off the LC grid (a 9.52 mm rod on a 0.001″ micrometer), and computing MSR and
  // CSR independently from the raw value lets a fraction that rounds up to a
  // full revolution (CSR = 25 → 0) drop a whole pitch from the reading. One
  // rounded value, everything derived from it.
  const obsQ    = snapToLc(obsMm);
  const csr     = getCSR(obsQ);
  const msrStr  = fmtMsr(obsQ);
  const csrStr  = String(csr);
  const lcStr   = fmtLc();
  const partStr = fmtPart(obsQ);
  const totStr  = fmtTr(obsQ);

  $('msr-val').textContent = msrStr;
  $('csr-val').textContent = csrStr;
  $('lc-val').textContent  = lcStr;

  $('f-msr').textContent  = msrStr;
  $('f-csr').textContent  = csrStr;
  $('f-lc').textContent   = lcStr;
  $('f-msr2').textContent = msrStr;
  $('f-part').textContent = partStr;
  $('f-tr').textContent   = totStr;

  // Big readout = the corrected (true) value — what the student should report after applying ZE correction.
  $('readout-display').textContent = fmtReading(state.mm);

  // Unit labels
  document.querySelectorAll('.rcell-msr .rcell-unit, .rcell-lc .rcell-unit').forEach(el => el.textContent = u);
  document.querySelector('.dr-unit').textContent = u;
  document.querySelector('.tr-unit').textContent = u;

  // LC badge in controls
  var lcBadge = $('lc-badge');
  if (lcBadge) lcBadge.textContent = lcStr + ' ' + u;

  // ── Zero error readout (visible when state.zeOn, hidden during un-answered practice/quiz) ──
  var zeBox = $('ze-readout');
  var hideUnanswered = (state.mode === 'practice' && !state.answered) ||
                       (state.mode === 'quiz'     && !state.quizAnswered);
  var zeVisible = state.zeOn && state.mode !== 'explore' && !hideUnanswered;
  if (zeBox) zeBox.style.display = zeVisible ? '' : 'none';
  if (zeVisible) {
    var obs = $('ze-observed');   if (obs) obs.textContent = fmtReading(obsMm);
    var ze  = $('ze-error');      if (ze)  ze.textContent  = fmtZeSigned();
    var cor = $('ze-corrected');  if (cor) cor.textContent = fmtReading(state.mm);
    document.querySelectorAll('#ze-readout .ze-cell-unit').forEach(function(el){ el.textContent = u; });
  }
  var zeVal = $('ze-val');
  if (zeVal) zeVal.textContent = fmtZeSigned() + ' ' + u;
  var zeStep = $('ze-stepper');
  if (zeStep) zeStep.style.display = state.zeOn ? '' : 'none';
}

function render() {
  updateReadingPanel();
  updateObjBar();
  syncExerciseUi();
  if (state.zoomOpen) drawGaugeZoomed();
  else drawGauge();
}

// ── Animation ─────────────────────────────────────────────────────
function animStep(ts) {
  if (!state.playing) return;
  if (state.animLast) {
    const dt = (ts - state.animLast) / 1000;
    let next = state.mm + state.animDir * ANIM_SPEED * dt;
    const maxMm = getMaxMm();
    if (next >= maxMm) { next = maxMm; state.animDir = -1; }
    const minMm = wpMinMm();
    if (next <= minMm) { next = minMm; state.animDir =  1; }
    state.mm = clampMm(snapToLc(next));
  }
  state.animLast = ts;
  render();
  state.animRaf = requestAnimationFrame(animStep);
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
  state.animLast = 0;
  state.answered = false;
  $('btn-play').innerHTML = '&#9654;&nbsp; Play';
  $('btn-play').classList.remove('playing');
  $('btn-check').disabled   = false;
  $('practice-input').value = '';
  $('practice-input').focus();
  playClick();
}

// ── Practice mode ─────────────────────────────────────────────────
function randomZeLc() {
  // Pick a nonzero ze in {±1..±ZE_MAX_LC}
  const mag = 1 + Math.floor(Math.random() * ZE_MAX_LC);
  return (Math.random() < 0.5 ? -1 : 1) * mag;
}

function newPractice() {
  if (state.playing) stopAnim();
  if (state.wp) clearWorkpiece();
  $('btn-play').disabled = false;
  $('caliper-card').style.cursor = 'default';
  const maxMm = getMaxMm();
  const lcMm = getLcMm();
  // state.mm is the TRUE value (what the student must enter). Pick well inside the
  // usable range so the OBSERVED (state.mm + ze) also stays in [0, maxMm].
  if (state.zeOn) {
    state.zeLc = randomZeLc();
    const zeM  = state.zeLc * lcMm;
    const lo   = Math.max(lcMm * 10, -zeM + lcMm);          // observed > 0
    const hi   = Math.min(maxMm - lcMm * 10, maxMm - zeM - lcMm); // observed < maxMm
    state.mm   = snapToLc(lo + Math.random() * Math.max(lcMm, hi - lo));
  } else {
    state.mm   = clampMm(snapToLc(lcMm * 10 + Math.random() * (maxMm - lcMm * 20)));
  }
  state.answered = false;
  $('feedback').textContent = '';
  $('feedback').className   = 'feedback';
  $('reading-cells').classList.add('cells-hidden');
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('practice-input').value          = '';
  $('dr-label').textContent          = 'Your Reading';
  $('btn-play').innerHTML            = '&#9654;&nbsp; Play';
  $('btn-play').classList.remove('playing');
  $('btn-check').disabled = false;
  setTimeout(() => $('practice-input').focus(), 50);
  render();
}

function getCorrectDisplay(mmVal) {
  const q = snapToLc(mmVal);
  if (isImperial()) {
    const msrMm = getMSR(q);
    const csr = getCSR(q);
    return (msrMm * MM_TO_IN + csr * IMP.lc).toFixed(3);
  }
  return q.toFixed(2);
}

function checkAnswer() {
  if (state.answered || state.playing) return;
  if (state.wp && !wpInContact()) return;   // object drill: not on the part yet
  const input = parseNumericInput($('practice-input').value);
  if (isNaN(input)) {
    $('feedback').textContent = 'Enter a valid number (e.g. 5.73).';
    $('feedback').className   = 'feedback err';
    return;
  }
  state.attempts++;
  const targetMm   = state.mm;   // state.mm IS the TRUE value the student must enter
  const correctStr = getCorrectDisplay(targetMm);
  const correctVal = parseFloat(correctStr);
  const tolerance = getLcDisplay() / 2 + 1e-6;
  const ok = Math.abs(input - correctVal) <= tolerance;
  state.answered = true;

  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('readout-display').textContent   = fmtReading(targetMm);
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Measurement';
  $('btn-check').disabled            = true;

  if (ok) {
    state.score++;
    $('feedback').innerHTML = `&#10003; Correct! &nbsp;<strong>${correctStr} ${uLabel()}</strong>`;
    $('feedback').className = 'feedback ok';
    playSuccess();
  } else {
    $('feedback').innerHTML = `&#10007; Incorrect &nbsp;|&nbsp; Answer: <strong>${correctStr} ${uLabel()}</strong>`;
    $('feedback').className = 'feedback err';
    playError();
  }
  $('score').textContent    = state.score;
  $('attempts').textContent = state.attempts;
  render();
}

// ── Quiz mode ─────────────────────────────────────────────────────
const QUIZ_OBJ_MIN = 2;   // at least this many of the five are real parts

function startQuiz() {
  if (state.wp) clearWorkpiece();
  const maxMm = getMaxMm();
  const lcMm = getLcMm();
  // Self-contained questions — robust to mid-quiz toggle changes.
  //   kind 'scale'  → { trueMm, zeLc }: the spindle is preset, just read it.
  //   kind 'object' → { wp, trueMm, zeLc }: close the spindle on a part first.
  // Two or three of the five are always objects, at shuffled positions.
  const objCount = QUIZ_OBJ_MIN + (Math.random() < 0.5 ? 0 : 1);
  const slots = [];
  for (let i = 0; i < QUIZ_TOTAL; i++) slots.push(i < objCount ? 'object' : 'scale');
  for (let i = slots.length - 1; i > 0; i--) {     // Fisher–Yates
    const j = Math.floor(Math.random() * (i + 1));
    const t = slots[i]; slots[i] = slots[j]; slots[j] = t;
  }

  state.quizQuestions = [];
  const used = new Set();
  const usedWp = [];
  slots.forEach(function (kind) {
    let z = state.zeOn ? randomZeLc() : 0;
    if (kind === 'object') {
      const wp = pickExerciseWp(usedWp);
      usedWp.push(wp.id);
      state.quizQuestions.push({ kind: 'object', wp: wp, trueMm: wp.mm, zeLc: z });
      return;
    }
    const zeM = z * lcMm;
    const lo  = Math.max(lcMm * 10, -zeM + lcMm);
    const hi  = Math.min(maxMm - lcMm * 10, maxMm - zeM - lcMm);
    if (hi <= lo) { z = 0; }
    let trueMm, key, guard = 0;
    do {
      trueMm = snapToLc(lo + Math.random() * Math.max(lcMm, hi - lo));
      key = trueMm.toFixed(4) + '_' + z;
    } while (used.has(key) && ++guard < 50);
    used.add(key);
    state.quizQuestions.push({ kind: 'scale', trueMm: Math.max(0, Math.min(maxMm, trueMm)), zeLc: z });
  });
  state.quizCurrent   = 0;
  state.quizAnswers   = [];
  state.quizAnswered  = false;
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  $('quiz-q-total').textContent  = QUIZ_TOTAL;
  showQuizQuestion(0);
}

function showQuizQuestion(idx) {
  const q = state.quizQuestions[idx];
  state.zeLc = q.zeLc;
  state.quizAnswered = false;

  const isObj = q.kind === 'object';
  const hint = document.querySelector('.qbar-hint');
  if (isObj) {
    // The part is the question: the spindle arrives backed off and the student
    // has to close onto it before the scales mean anything.
    state.mm = getMaxMm();
    loadWorkpieceObj(q.wp, true);
    $('caliper-card').style.cursor = 'grab';
    if (hint) hint.innerHTML = 'Close the spindle onto the part &middot; then read the scales&nbsp;&uarr;';
  } else {
    if (state.wp) clearWorkpiece();
    state.mm = q.trueMm;
    $('caliper-card').style.cursor = 'default';
    if (hint) hint.innerHTML = 'Read the gauge &middot; type your answer above&nbsp;&uarr;';
  }

  $('quiz-q-num').textContent    = idx + 1;
  $('quiz-feedback').textContent = '';
  $('quiz-feedback').className   = 'quiz-feedback';
  $('btn-quiz-submit').style.display = '';
  $('btn-quiz-submit').disabled      = isObj;   // enabled by syncExerciseUi on contact
  $('btn-quiz-next').style.display   = 'none';
  $('reading-cells').classList.add('cells-hidden');
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('practice-input').value          = '';
  $('dr-label').textContent          = 'Your Reading';
  if (!isObj) setTimeout(() => $('practice-input').focus(), 50);
  render();
}

function submitQuizAnswer() {
  if (state.quizAnswered) return;
  if ($('btn-quiz-submit').disabled) return;   // object question: not on the part yet
  const input = parseNumericInput($('practice-input').value);
  if (isNaN(input)) {
    $('quiz-feedback').textContent = 'Enter a valid number (e.g. 5.73).';
    $('quiz-feedback').className   = 'quiz-feedback err';
    return;
  }
  const q = state.quizQuestions[state.quizCurrent];
  const correctMm = q.trueMm;
  const correctStr = getCorrectDisplay(correctMm);
  const correctVal = parseFloat(correctStr);
  const tolerance = getLcDisplay() / 2 + 1e-6;
  const ok = Math.abs(input - correctVal) <= tolerance;

  state.quizAnswers.push({ given: input, correctMm, correctStr, ok });
  state.quizAnswered = true;

  $('readout-display').textContent   = fmtReading(correctMm);
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Measurement';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('btn-quiz-submit').style.display = 'none';

  if (ok) {
    $('quiz-feedback').innerHTML = '&#10003; Correct!';
    $('quiz-feedback').className = 'quiz-feedback ok';
    playSuccess();
  } else {
    $('quiz-feedback').innerHTML = `&#10007; Incorrect &nbsp;|&nbsp; Answer: <strong>${correctStr} ${uLabel()}</strong>`;
    $('quiz-feedback').className = 'quiz-feedback err';
    playError();
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
  if (state.wp) clearWorkpiece();
  $('caliper-card').style.cursor = 'default';
  $('quiz-bar').style.display    = 'none';
  $('quiz-result').style.display = '';

  const u = uLabel();
  const score     = state.quizAnswers.filter(a => a.ok).length;
  const filled    = n => '\u2605'.repeat(n) + '\u2606'.repeat(QUIZ_TOTAL - n);
  const scoreEl   = $('qr-score');
  const starsEl   = $('qr-stars');
  const verdictEl = $('qr-verdict');
  scoreEl.textContent = `${score} / ${QUIZ_TOTAL}`;

  if (score === QUIZ_TOTAL) { scoreEl.className='qr-score perfect'; starsEl.textContent=filled(QUIZ_TOTAL); starsEl.style.color='var(--gold)'; verdictEl.textContent='Perfect score! \uD83C\uDFAF'; }
  else if (score >= Math.ceil(QUIZ_TOTAL*0.8)) { scoreEl.className='qr-score good'; starsEl.textContent=filled(score); starsEl.style.color='var(--green)'; verdictEl.textContent='Great job! \uD83D\uDC4D'; }
  else if (score >= Math.ceil(QUIZ_TOTAL*0.6)) { scoreEl.className='qr-score good'; starsEl.textContent=filled(score); starsEl.style.color='var(--green)'; verdictEl.textContent='Good effort! \uD83D\uDCAA'; }
  else if (score >= 1) { scoreEl.className='qr-score poor'; starsEl.textContent=filled(score); starsEl.style.color='#ffb74d'; verdictEl.textContent='Keep practising! \uD83D\uDCAA'; }
  else { scoreEl.className='qr-score poor'; starsEl.textContent=filled(0); starsEl.style.color='var(--red)'; verdictEl.textContent='Try again! \uD83D\uDCAA'; }

  const rowsEl = $('qr-rows');
  rowsEl.innerHTML = '';
  state.quizAnswers.forEach((ans, i) => {
    const row = document.createElement('div');
    row.className = `qr-row ${ans.ok ? 'ok' : 'err'}`;
    row.innerHTML = `<span class="qr-qnum">Q${i+1}</span><span class="qr-correct">Correct: <strong>${ans.correctStr} ${u}</strong></span><span class="qr-given">Your answer: <strong>${ans.given} ${u}</strong></span><span class="qr-mark">${ans.ok ? '&#10003;' : '&#10007;'}</span>`;
    rowsEl.appendChild(row);
  });

  $('readout-display').textContent   = fmtReading(state.mm);
  $('readout-display').style.display = 'block';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('dr-label').textContent = 'Measurement';
}

// ── Parts & Components explorer ───────────────────────────────────
// A labelled, hoverable anatomy diagram drawn as inline SVG (side view of an
// outside micrometer). One shared axis (y = 168) keeps anvil face, spindle,
// sleeve and thimble collinear, the way the real instrument is built.
const PARTS_DATA = [
  { z: 1, name: 'U-Frame (C-Frame)', sub: 'Rigid backbone of the instrument',
    hl: '<path {A} d="M118 138 H196 V202 H160 C96 202 74 262 96 302 C118 338 190 344 232 316 L252 336 C192 376 66 366 42 296 C24 240 56 168 118 168 Z"/>',
    b: [70, 150], lead: ['M70 150 L92 220'], dots: [[92, 220]],
    info: '<span class="pi-tag">Structure</span><h3>U-Frame (C-Frame)</h3>' +
      '<p>The drop-forged steel arc that carries everything else. Its whole job is <strong>rigidity</strong>: any flex between anvil and spindle appears directly in the reading, so the frame is deep, ribbed and deliberately heavy for its size.</p>' +
      '<ul><li>Holds the anvil and the barrel assembly in one rigid line</li><li>Plastic heat-insulating pads keep hand warmth out of the steel &mdash; a 1&nbsp;&deg;C rise in a 25&nbsp;mm frame is a couple of microns</li><li>Frame size fixes the range: 0&ndash;25, 25&ndash;50, 50&ndash;75&nbsp;mm are separate instruments</li></ul>' +
      '<div class="pi-tip"><strong>Workshop habit:</strong> hold the frame by the insulator pads, not the bare steel &mdash; and never clamp it in a vice without soft jaws.</div>' },
  { z: 2, name: 'Anvil', sub: 'Fixed measuring face',
    hl: '<rect {A} x="196" y="152" width="26" height="32" rx="2"/>',
    b: [166, 96], lead: ['M166 96 L206 148'], dots: [[206, 148]],
    info: '<span class="pi-tag">Measuring</span><h3>Anvil</h3>' +
      '<p>The <strong>fixed</strong> measuring face, pressed into the left end of the frame. The workpiece rests against it while the spindle closes in from the other side.</p>' +
      '<dl class="pi-spec"><dt>Face material</dt><dd>Tungsten carbide tip</dd><dt>Face finish</dt><dd>Lapped optically flat</dd><dt>Face &Oslash;</dt><dd>&asymp; 6.5 mm</dd></dl>' +
      '<div class="pi-tip"><strong>Check it:</strong> a worn or dinged anvil face shows as a zero error that no amount of careful reading will remove &mdash; test with an optical flat or a gauge block.</div>' },
  { z: 2, name: 'Spindle', sub: 'Moving measuring face',
    hl: '<rect {A} x="262" y="156" width="164" height="24" rx="3"/>',
    b: [318, 96], lead: ['M318 96 L330 152'], dots: [[330, 152]],
    info: '<span class="pi-tag">Measuring</span><h3>Spindle</h3>' +
      '<p>The moving face. Inside the barrel its shank carries a precision-ground <strong>0.5&nbsp;mm pitch thread</strong> &mdash; one full turn of the thimble advances it exactly half a millimetre. That screw is the measuring element; everything else just reads it.</p>' +
      '<ul><li>Face carbide-tipped and lapped, parallel to the anvil at every rotation</li><li>Hardened, ground and stabilised steel</li><li>Never spin the spindle onto the work &mdash; drive the last part-turn with the ratchet</li></ul>' +
      '<div class="pi-tip"><strong>Why 0.5 mm pitch:</strong> LC = pitch &divide; thimble divisions = 0.5 &divide; 50 = <strong>0.01 mm</strong>. The screw IS the instrument.</div>' },
  { z: 3, name: 'Lock Nut / Lock Lever', sub: 'Freezes the spindle',
    hl: '<rect {A} x="426" y="148" width="26" height="40" rx="4"/>',
    b: [430, 96], lead: ['M430 96 L439 144'], dots: [[439, 144]],
    info: '<span class="pi-tag">Control</span><h3>Lock Nut (Spindle Clamp)</h3>' +
      '<p>A knurled ring (a lever on some patterns) that clamps the spindle so the reading cannot drift while you take the instrument off the work and hold it up to read.</p>' +
      '<ul><li>Lock <em>after</em> the ratchet clicks, then withdraw and read</li><li>Also holds a size for comparative (go / no-go) checks</li><li>Clamp gently &mdash; it grips a precision screw, not a bolt</li></ul>' +
      '<div class="pi-tip"><strong>Habit to build:</strong> ratchet &rarr; lock &rarr; withdraw &rarr; read at eye level. It removes both drift and parallax in one move.</div>' },
  { z: 1, name: 'Sleeve / Barrel', sub: 'Carries main scale + datum',
    hl: '<rect {A} x="452" y="140" width="212" height="56" rx="4"/>',
    b: [520, 96], lead: ['M520 96 L540 138'], dots: [[540, 138]],
    info: '<span class="pi-tag">Scale</span><h3>Sleeve (Barrel)</h3>' +
      '<p>The stationary tube fixed to the frame. It is engraved with the <strong>datum line</strong> along its axis and the <strong>main scale</strong>, and the thimble sweeps over it as the spindle screws in and out.</p>' +
      '<ul><li>Stationary: everything on it is the fixed reference</li><li>On adjustable micrometers the sleeve can be rotated slightly with a C-spanner to zero the instrument</li></ul>' +
      '<div class="pi-tip"><strong>Reading rule:</strong> the thimble edge is the cursor. Read the last main-scale mark it has fully exposed &mdash; never the next one.</div>' },
  { z: 4, name: 'Main Scale', sub: 'mm above, half-mm below',
    hl: '<path {A} d="M456 144 H600 V166 H456 Z M456 170 H600 V192 H456 Z"/>',
    b: [575, 250], lead: ['M575 250 L560 196'], dots: [[560, 196]],
    info: '<span class="pi-tag">Scale</span><h3>Main Scale (Sleeve Scale)</h3>' +
      '<p>Whole millimetres are engraved <strong>above</strong> the datum line and the <strong>half-millimetre</strong> marks below it (layouts vary by maker). The Main Scale Reading is everything the thimble edge has uncovered.</p>' +
      '<div class="formula-box">MSR = whole mm + (0.5 mm if the half-mm mark is exposed)</div>' +
      '<p>Missing an exposed half-mm mark is <em>the</em> classic micrometer error &mdash; it puts you out by exactly 0.50&nbsp;mm, because the same thimble number returns every half millimetre.</p>' },
  { z: 5, name: 'Datum (Index) Line', sub: 'The reference line',
    hl: '<rect {A} x="456" y="164" width="208" height="8" rx="2"/>',
    b: [634, 96], lead: ['M634 96 L640 162'], dots: [[640, 162]],
    info: '<span class="pi-tag">Reading</span><h3>Datum (Reference) Line</h3>' +
      '<p>The single horizontal line engraved along the sleeve. The thimble division that sits on this line <em>is</em> the Circular Scale Reading &mdash; nothing else on the thimble matters.</p>' +
      '<ul><li>CSR = the thimble division aligned with this line</li><li>Read square-on: viewing at an angle shifts the apparent alignment (parallax)</li></ul>' +
      '<div class="pi-tip"><strong>Between divisions?</strong> A micrometer is read to its least count &mdash; take the nearer division, never interpolate tenths by eye (that is a vernier micrometer’s job).</div>' },
  { z: 1, name: 'Thimble', sub: 'Rotates with the spindle',
    hl: '<path {A} d="M664 118 H780 V218 H664 Z"/>',
    b: [722, 76], lead: ['M722 76 L722 114'], dots: [[722, 114]],
    info: '<span class="pi-tag">Structure</span><h3>Thimble</h3>' +
      '<p>The knurled sleeve your fingers turn. It is fixed to the spindle, so one revolution = one pitch = <strong>0.5&nbsp;mm</strong> of spindle travel, and its bevelled edge doubles as the cursor for the main scale.</p>' +
      '<ul><li>Bevelled edge carries the 50-division circular scale</li><li>Knurling gives fine fingertip control</li><li>Use it for the approach &mdash; hand feel varies; the final contact belongs to the ratchet</li></ul>' },
  { z: 4, name: 'Circular (Thimble) Scale', sub: '50 divisions × 0.01 mm',
    hl: '<path {A} d="M652 118 H676 V218 H652 Z"/>',
    b: [664, 260], lead: ['M664 260 L662 222'], dots: [[662, 222]],
    info: '<span class="pi-tag">Scale</span><h3>Circular Scale (Thimble Scale)</h3>' +
      '<p>Fifty divisions around the thimble’s bevel. Each division the datum line crosses is one least count of spindle travel.</p>' +
      '<div class="formula-box">LC = pitch &divide; divisions = 0.5 mm &divide; 50 = <strong>0.01 mm</strong></div>' +
      '<dl class="pi-spec"><dt>Metric</dt><dd>50 div &times; 0.01 mm = 0.5 mm/rev</dd><dt>Imperial</dt><dd>25 div &times; 0.001&Prime; = 0.025&Prime;/rev</dd></dl>' +
      '<p>Because one revolution is only half a millimetre, the circular scale repeats twice per millimetre &mdash; which is exactly why the half-mm mark on the sleeve must never be missed.</p>' },
  { z: 2, name: 'Ratchet Stop', sub: 'Constant measuring force',
    hl: '<path {A} d="M780 148 H836 V188 H780 Z M836 154 H852 V182 H836 Z"/>',
    b: [822, 96], lead: ['M822 96 L816 144'], dots: [[816, 144]],
    info: '<span class="pi-tag">Control</span><h3>Ratchet Stop</h3>' +
      '<p>The small spring-loaded cap at the end of the thimble. Turn <em>it</em> for the final closing: when the measuring force reaches its preset value (roughly 5&ndash;10&nbsp;N) the ratchet slips and clicks instead of tightening further.</p>' +
      '<ul><li>Close on the work with <strong>2&ndash;3 clicks</strong>, every time, every operator</li><li>Removes the biggest human variable &mdash; grip strength</li><li>Skipping it flattens soft parts and springs the frame: both read wrong</li></ul>' +
      '<div class="pi-tip"><strong>Repeatability test:</strong> measure the same gauge block five times with the ratchet. The spread should be zero at 0.01 mm resolution.</div>' }
];

// Build the instrument artwork (static layer) as an SVG string.
function partsInstrumentSvg() {
  let g = '';
  // Frame: C-arc from the anvil block down and round to under the sleeve.
  g += '<path class="vc-metal" fill="url(#sgSteel)" d="M118 138 H196 V202 H160 C96 202 74 262 96 302 C118 338 190 344 232 316 L252 336 C192 376 66 366 42 296 C24 240 56 168 118 168 Z"/>';
  // Insulating pad on the frame arc.
  g += '<path class="vc-metal" fill="#2f3542" d="M60 250 C58 282 78 314 104 326 L96 338 C62 322 44 284 48 248 Z"/>';
  // Anvil block + face.
  g += '<rect class="vc-metal" fill="url(#sgSteel)" x="196" y="152" width="26" height="32" rx="2"/>';
  // Spindle rod (gap left deliberately between anvil face 222 and spindle tip 262).
  g += '<rect class="vc-metal" fill="url(#sgSteel)" x="262" y="156" width="164" height="24" rx="3"/>';
  // Lock nut.
  g += '<rect class="vc-metal" fill="url(#sgHead)" x="426" y="148" width="26" height="40" rx="4"/>';
  for (let x = 429; x < 450; x += 4) g += '<line class="vc-etch" x1="' + x + '" y1="151" x2="' + x + '" y2="185"/>';
  // Sleeve/barrel.
  g += '<rect class="vc-metal" fill="url(#sgSteel)" x="452" y="140" width="212" height="56" rx="4"/>';
  // Datum line.
  g += '<line class="vc-tick-b" x1="458" y1="168" x2="662" y2="168"/>';
  // Main scale: mm ticks above the datum (numbered 0,5,10), half-mm below.
  for (let i = 0; i <= 12; i++) {
    const x = 460 + i * 16;
    g += '<line class="' + (i % 5 === 0 ? 'vc-tick-b' : 'vc-tick') + '" x1="' + x + '" y1="168" x2="' + x + '" y2="' + (168 - (i % 5 === 0 ? 16 : 11)) + '"/>';
    if (i % 5 === 0) g += '<text class="vc-num" font-size="11" text-anchor="middle" x="' + x + '" y="147">' + i + '</text>';
    if (i < 12) g += '<line class="vc-tick" x1="' + (x + 8) + '" y1="168" x2="' + (x + 8) + '" y2="179"/>';
  }
  // Thimble body + bevel with circular-scale ticks.
  g += '<path class="vc-metal" fill="url(#sgHead)" d="M676 118 H780 V218 H676 Z"/>';
  g += '<path class="vc-metal" fill="url(#sgSteel)" d="M652 128 L676 118 V218 L652 208 Z"/>';
  for (let i = 0; i <= 10; i++) {
    const y = 128 + i * 8;
    g += '<line class="' + (i % 5 === 0 ? 'vc-tick-b' : 'vc-tick') + '" x1="654" y1="' + y + '" x2="' + (i % 5 === 0 ? 672 : 666) + '" y2="' + y + '"/>';
  }
  g += '<text class="vc-num" font-size="10" text-anchor="middle" x="663" y="112">45</text>';
  g += '<text class="vc-num" font-size="10" text-anchor="middle" x="663" y="236">40</text>';
  // Thimble knurling.
  for (let x = 682; x < 778; x += 6) g += '<line class="vc-etch" x1="' + x + '" y1="122" x2="' + x + '" y2="214"/>';
  // Ratchet stop: knurled drum + end cap.
  g += '<rect class="vc-metal" fill="url(#sgHead)" x="780" y="148" width="56" height="40" rx="5"/>';
  for (let x = 784; x < 834; x += 5) g += '<line class="vc-etch" x1="' + x + '" y1="151" x2="' + x + '" y2="185"/>';
  g += '<rect class="vc-metal" fill="url(#sgSteel)" x="836" y="154" width="16" height="28" rx="4"/>';
  return g;
}

function partOverlaySvg(p, num) {
  let s = '<g class="vc-part" data-num="' + num + '" tabindex="0" role="button" aria-label="' + p.name + '">';
  s += p.hl.replace(/\{A\}/g, 'class="vc-hl"');
  s += p.hl.replace(/\{A\}/g, 'class="vc-out"');
  p.lead.forEach(function (d) { s += '<path class="vc-lead" d="' + d + '"/>'; });
  p.dots.forEach(function (pt) { s += '<circle class="vc-dot" cx="' + pt[0] + '" cy="' + pt[1] + '" r="3.2"/>'; });
  s += '<circle class="vc-badge-bg" cx="' + p.b[0] + '" cy="' + p.b[1] + '" r="14"/>';
  s += '<text class="vc-badge-tx" x="' + p.b[0] + '" y="' + p.b[1] + '">' + num + '</text>';
  s += '</g>';
  return s;
}

let partsBuilt = false;

function buildPartsPanel() {
  const svgHost = $('parts-svg');
  const listEl  = $('parts-list');

  if (!partsBuilt) {
    // Overlays paint largest-first (by z) so a small hotspot such as the datum
    // line always wins the pointer over the sleeve beneath it.
    const order = PARTS_DATA.map(function (p, i) { return { p: p, i: i }; })
      .sort(function (a, b) { return a.p.z - b.p.z || a.i - b.i; });

    let svg = '<svg viewBox="20 40 860 330" role="img" ' +
      'aria-label="Labelled diagram of a micrometer screw gauge showing its ten main parts" ' +
      'xmlns="http://www.w3.org/2000/svg">';
    svg += '<defs>' +
      '<linearGradient id="sgSteel" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#8d95a3"/><stop offset="0.26" stop-color="#c3cbd6"/>' +
        '<stop offset="0.36" stop-color="#eef2f6"/><stop offset="0.56" stop-color="#aeb7c3"/>' +
        '<stop offset="0.80" stop-color="#cad2dc"/><stop offset="1" stop-color="#6d7583"/>' +
      '</linearGradient>' +
      '<linearGradient id="sgHead" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#7c8492"/><stop offset="0.3" stop-color="#c8d0da"/>' +
        '<stop offset="0.55" stop-color="#9aa3b1"/><stop offset="1" stop-color="#626a77"/>' +
      '</linearGradient>' +
      '</defs>';
    svg += '<g>' + partsInstrumentSvg() + '</g>';
    svg += '<g>';
    order.forEach(function (o) { svg += partOverlaySvg(o.p, o.i + 1); });
    svg += '</g></svg>';
    svgHost.innerHTML = svg;

    listEl.innerHTML = '';
    PARTS_DATA.forEach(function (p, i) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'part-row';
      row.setAttribute('role', 'listitem');
      row.innerHTML = '<span class="part-num">' + (i + 1) + '</span>' +
        '<span class="part-txt"><span class="part-name">' + p.name + '</span>' +
        '<span class="part-sub">' + p.sub + '</span></span>';
      row.addEventListener('click', function () { selectPart(i, true); });
      row.addEventListener('mouseenter', function () { selectPart(i, false); });
      listEl.appendChild(row);
    });
    listEl.addEventListener('mouseleave', function () { selectPart(state.partPin, false); });

    // Hover previews the part; click (and tap) pins it.
    svgHost.addEventListener('mouseover', function (e) {
      const g = e.target.closest ? e.target.closest('.vc-part') : null;
      if (g) selectPart(+g.getAttribute('data-num') - 1, false);
    });
    svgHost.addEventListener('mouseleave', function () { selectPart(state.partPin, false); });
    svgHost.addEventListener('click', function (e) {
      const g = e.target.closest ? e.target.closest('.vc-part') : null;
      if (g) { selectPart(+g.getAttribute('data-num') - 1, true); playClick(); }
    });
    svgHost.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const g = e.target.closest ? e.target.closest('.vc-part') : null;
      if (g) { e.preventDefault(); selectPart(+g.getAttribute('data-num') - 1, true); }
    });

    partsBuilt = true;
  }

  selectPart(state.partPin, true);
}

function selectPart(idx, pin) {
  if (idx == null || idx < 0 || idx >= PARTS_DATA.length) idx = 0;
  if (pin) state.partPin = idx;
  state.partIdx = idx;

  $('parts-svg').querySelectorAll('.vc-part').forEach(function (g) {
    g.classList.toggle('on', +g.getAttribute('data-num') - 1 === idx);
  });
  $('parts-list').querySelectorAll('.part-row').forEach(function (r, i) {
    r.classList.toggle('active', i === idx);
  });

  $('parts-info').innerHTML = PARTS_DATA[idx].info;
}

// ── Explore mode ──────────────────────────────────────────────────
const EXPLORE_DATA = [
  { cat: 'Parts & Components', parts: true, items: [] },
  { cat: 'Micrometer Types', items: [
    { icon: '\uD83D\uDD27', label: 'Outside Micrometer', sub: 'External dimensions',
      info: '<h3>Outside Micrometer</h3><p>The most common type, used to measure <strong>external dimensions</strong> — shaft diameters, plate thickness, wire gauge. Features an anvil, spindle, barrel (sleeve), thimble, and ratchet stop.</p><ul><li>Standard range: 0\u201325 mm (metric) or 0\u20131\u2033 (imperial)</li><li>Available in sets: 0\u201325, 25\u201350, 50\u201375 mm etc.</li><li>LC: 0.01 mm (metric) or 0.001\u2033 (imperial)</li></ul>' },
    { icon: '\u2B55', label: 'Inside Micrometer', sub: 'Internal dimensions',
      info: '<h3>Inside Micrometer</h3><p>Measures <strong>internal dimensions</strong> — bore diameters, slot widths, hole sizes. The jaws expand outward against the internal surface.</p><ul><li>Caliper type: small bores (5\u201330 mm)</li><li>Rod type: larger bores with extension rods</li><li>Reading technique is same as outside micrometer</li></ul>' },
    { icon: '\u2195\uFE0F', label: 'Depth Micrometer', sub: 'Depth measurement',
      info: '<h3>Depth Micrometer</h3><p>Measures <strong>depth of slots, steps, and holes</strong>. A flat base sits on the reference surface while the spindle extends into the cavity.</p><ul><li>Base width: 63 mm or 100 mm</li><li>Interchangeable rods for different depth ranges</li><li>Reading is inverted — thimble rotates opposite direction</li></ul>' },
    { icon: '\uD83D\uDCDF', label: 'Digital Micrometer', sub: 'Electronic display',
      info: '<h3>Digital Micrometer</h3><p>Uses an <strong>electronic encoder</strong> and LCD display for direct reading. Eliminates parallax and interpolation errors.</p><ul><li>Resolution: 0.001 mm (10\u00D7 finer than mechanical)</li><li>Features: mm/inch toggle, zero-set, data output (SPC)</li><li>Battery-powered; requires careful handling</li></ul>' }
  ]},
  { cat: 'Least Count', items: [
    { icon: '50', label: '0.01 mm LC', sub: 'Metric 50-division',
      info: '<h3>0.01 mm Least Count (Metric)</h3><p>The standard metric micrometer. Pitch = <strong>0.5 mm</strong>, thimble has <strong>50 divisions</strong>.</p><div class="formula-box">LC = Pitch \u00F7 CSD = 0.5 mm \u00F7 50 = <strong>0.01 mm</strong></div><p><strong>Example:</strong> MSR = 5.50 mm, CSR = 23<br>TR = 5.50 + (23 \u00D7 0.01) = <strong>5.73 mm</strong></p>' },
    { icon: '25', label: '0.001\u2033 LC', sub: 'Imperial 25-division',
      info: '<h3>0.001\u2033 Least Count (Imperial)</h3><p>The standard imperial micrometer. Pitch = <strong>0.025\u2033</strong> (40 TPI), thimble has <strong>25 divisions</strong>.</p><div class="formula-box">LC = Pitch \u00F7 CSD = 0.025\u2033 \u00F7 25 = <strong>0.001\u2033</strong></div><p><strong>Example:</strong> MSR = 0.275\u2033, CSR = 14<br>TR = 0.275 + (14 \u00D7 0.001) = <strong>0.289\u2033</strong></p>' },
    { icon: '\uD83D\uDCD0', label: 'LC Formula', sub: 'General formula',
      info: '<h3>Least Count \u2014 General Formula</h3><div class="formula-box">LC = Pitch \u00F7 Number of Circular Scale Divisions</div><p>Where:<br>\u2022 <strong>Pitch</strong> = distance spindle moves per full revolution<br>\u2022 <strong>CSD</strong> = number of divisions on the thimble</p><p>Metric: 0.5 mm \u00F7 50 = 0.01 mm<br>Imperial: 0.025\u2033 \u00F7 25 = 0.001\u2033</p>' },
    { icon: '\u2728', label: 'Vernier Micrometer', sub: '0.001 mm LC',
      info: '<h3>Vernier Micrometer (0.001 mm)</h3><p>Adds a <strong>vernier scale</strong> on the barrel with 10 divisions to further subdivide the thimble reading by 10\u00D7.</p><div class="formula-box">LC = 0.01 mm \u00F7 10 = <strong>0.001 mm</strong></div><p>Used in precision metrology labs where 0.01 mm is not sufficient. The vernier lines on the barrel indicate which thimble division is most closely aligned.</p>' }
  ]},
  { cat: 'Zero Error', items: [
    { icon: '\u2705', label: 'No Zero Error', sub: 'Perfect alignment',
      info: '<h3>No Zero Error</h3><p>When the spindle closes onto the anvil, the <strong>thimble zero aligns exactly</strong> with the datum line, and the barrel zero mark is just visible at the thimble edge.</p><ul><li>Close jaws gently using the ratchet stop</li><li>Check: thimble 0 aligns with datum line</li><li>Check: barrel shows exactly 0.00 mm</li></ul>' },
    { icon: '\u2795', label: 'Positive Error', sub: 'Thimble zero below datum',
      info: '<h3>Positive Zero Error</h3><p>When closed, the thimble zero is <strong>below the datum line</strong> (reading > 0). The micrometer over-reads.</p><div class="formula-box">Corrected = Observed \u2212 Zero Error</div><p><strong>Example:</strong> Zero error = +0.03 mm. Observed = 5.76 mm.<br>Corrected = 5.76 \u2212 0.03 = <strong>5.73 mm</strong>.</p>' },
    { icon: '\u2796', label: 'Negative Error', sub: 'Thimble zero above datum',
      info: '<h3>Negative Zero Error</h3><p>When closed, the thimble zero is <strong>above the datum line</strong> (reading < 0). The micrometer under-reads.</p><div class="formula-box">Corrected = Observed + |Zero Error|</div><p><strong>Example:</strong> Zero error = \u22120.02 mm (thimble shows 48).<br>ZE = \u2212(50 \u2212 48) \u00D7 0.01 = \u22120.02 mm.<br>Observed = 5.71 mm. Corrected = 5.71 + 0.02 = <strong>5.73 mm</strong>.</p>' },
    { icon: '\uD83D\uDD04', label: 'Zero Correction', sub: 'How to correct',
      info: '<h3>Zero Error Correction</h3><ol><li>Close the spindle onto the anvil using the <strong>ratchet stop</strong>.</li><li>Read the thimble division aligned with the datum line.</li><li>If thimble reads 0 \u2014 no error.</li><li>If thimble reads a positive number (e.g., 3) \u2014 ZE = +3 \u00D7 LC.</li><li>If thimble reads near max (e.g., 48 on 50-div) \u2014 ZE = \u2212(50\u221248) \u00D7 LC.</li><li>Apply: Corrected = Observed \u2212 ZE.</li></ol>' }
  ]},
  { cat: 'Reading Method', items: [
    { icon: '1\uFE0F\u20E3', label: 'Step 1: MSR', sub: 'Main Scale Reading',
      info: '<h3>Step 1 \u2014 Main Scale Reading (MSR)</h3><p>Look at the <strong>barrel scale</strong>. Count the whole millimetre (or 0.025\u2033) marks <strong>exposed by the thimble edge</strong>. Pay special attention to the <strong>half-millimetre mark</strong> (SI) \u2014 if it\'s visible, add 0.5 mm to your reading.</p><p><strong>SI:</strong> MSR = whole mm + (0.5 if half-mm mark visible).<br><strong>Imperial:</strong> MSR = count of 0.025\u2033 marks visible.</p>' },
    { icon: '2\uFE0F\u20E3', label: 'Step 2: CSR', sub: 'Circular Scale Reading',
      info: '<h3>Step 2 \u2014 Circular Scale Reading (CSR)</h3><p>Find the thimble division that aligns with the <strong>datum (reference) line</strong> on the barrel. This is the CSR.</p><p><strong>Tip:</strong> Use Zoom to magnify the reading area. In this simulator, the aligned division is clearly visible where the thimble edge meets the barrel.</p>' },
    { icon: '3\uFE0F\u20E3', label: 'Step 3: Calculate', sub: 'TR = MSR + CSR \u00D7 LC',
      info: '<h3>Step 3 \u2014 Calculate Total Reading</h3><div class="formula-box">TR = MSR + (CSR \u00D7 LC)</div><p><strong>SI:</strong> MSR = 5.50, CSR = 23 \u2192 TR = 5.50 + 0.23 = <strong>5.73 mm</strong></p><p><strong>Imperial:</strong> MSR = 0.275\u2033, CSR = 14 \u2192 TR = 0.275 + 0.014 = <strong>0.289\u2033</strong></p>' },
    { icon: '\u26A0\uFE0F', label: 'Common Errors', sub: 'Mistakes to avoid',
      info: '<h3>Common Reading Errors</h3><ul><li><strong>Missing the half-mm mark:</strong> The most common error \u2014 causes a 0.50 mm mistake. Always check if the half-mm line is visible.</li><li><strong>Parallax error:</strong> Reading the thimble at an angle. Look straight at the datum line.</li><li><strong>Over-tightening:</strong> Always use the ratchet stop to apply consistent force.</li><li><strong>Ignoring zero error:</strong> Check and correct before every measurement session.</li><li><strong>Wrong thimble division:</strong> Read the division aligned with the datum, not the nearest number.</li></ul>' }
  ]}
];

function buildExplorePanel() {
  var catEl  = $('explore-cats');
  var gridEl = $('explore-grid');
  var infoEl = $('explore-info');
  catEl.innerHTML = '';

  EXPLORE_DATA.forEach(function(cat, ci) {
    var btn = document.createElement('button');
    btn.className = 'pill' + (ci === state.exploreCat ? ' active' : '');
    btn.textContent = cat.cat;
    btn.addEventListener('click', function() {
      state.exploreCat = ci;
      state.exploreIdx = 0;
      buildExplorePanel();
    });
    catEl.appendChild(btn);
  });

  // The "Parts & Components" category swaps the icon grid for the interactive
  // anatomy diagram.
  var cat = EXPLORE_DATA[state.exploreCat];
  var wrap = $('parts-wrap');
  if (cat.parts) {
    gridEl.style.display = 'none';
    infoEl.style.display = 'none';
    wrap.style.display = '';
    buildPartsPanel();
    return;
  }
  wrap.style.display = 'none';
  gridEl.style.display = '';
  infoEl.style.display = '';

  var items = cat.items;
  gridEl.innerHTML = '';
  items.forEach(function(item, ii) {
    var btn = document.createElement('button');
    btn.className = 'is-btn' + (ii === state.exploreIdx ? ' active' : '');
    btn.innerHTML = '<span class="is-btn-icon">' + item.icon + '</span><span class="is-btn-label">' + item.label + '</span><span class="is-btn-sub">' + item.sub + '</span>';
    btn.addEventListener('click', function() {
      state.exploreIdx = ii;
      buildExplorePanel();
    });
    gridEl.appendChild(btn);
  });

  infoEl.innerHTML = items[state.exploreIdx].info;
}

// ── Workpiece picker / object bar / glide ─────────────────────────
const WP_THUMBS = {
  cylV:  '<rect x="16" y="4" width="8" height="30" rx="2"/>',
  bar:   '<rect x="17" y="5" width="6" height="28" rx="1"/>',
  ball:  '<circle cx="20" cy="19" r="12"/>',
  nut:   '<path d="M20 5 30 12 30 26 20 33 10 26 10 12 Z"/><circle cx="20" cy="19" r="5" fill="#0d1117"/>',
  drill: '<path d="M17 4 H23 V22 L20 34 L17 22 Z"/>'
};

function buildPicker() {
  const grid = $('obj-grid');
  if (!grid || grid.childElementCount) return;
  WORKPIECES.forEach(function (wp) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'obj-tile';
    b.setAttribute('data-id', wp.id);
    const full = wp.name + ' — measure ' + wp.what;
    b.title = full;
    b.setAttribute('aria-label', full);
    b.innerHTML =
      '<svg viewBox="0 0 40 38" aria-hidden="true" fill="#aab6c8">' + WP_THUMBS[wp.shape] + '</svg>' +
      '<span class="obj-tile-name">' + wp.short + '</span>';
    b.addEventListener('click', function () { loadWorkpiece(wp.id); });
    grid.appendChild(b);
  });
}

function togglePicker(open) {
  const pop = $('obj-picker');
  const fab = $('obj-fab');
  if (!pop) return;
  state.pickerOpen = (open === undefined) ? !state.pickerOpen : !!open;
  if (state.pickerOpen) buildPicker();
  pop.style.display = state.pickerOpen ? '' : 'none';
  fab.classList.toggle('active', state.pickerOpen);
  fab.setAttribute('aria-expanded', String(state.pickerOpen));
  syncPickerSelection();
}

function syncPickerSelection() {
  const grid = $('obj-grid');
  if (!grid) return;
  grid.querySelectorAll('.obj-tile').forEach(function (t) {
    t.classList.toggle('active', !!state.wp && t.getAttribute('data-id') === state.wp.id);
  });
}

// Any hands-on input wins over an in-flight glide.
function cancelGlide() {
  if (state.wpRaf) { cancelAnimationFrame(state.wpRaf); state.wpRaf = null; }
}

// Ease the spindle to a target opening. Used to back it fully off when a part
// is dropped in, and to run it down onto the part from the object bar.
function glideJawsTo(target, onDone) {
  cancelGlide();
  const from = state.mm;
  const dist = Math.abs(target - from);
  // A hidden tab suspends requestAnimationFrame; jump straight to the target.
  if (dist < 1e-6 || document.hidden) {
    state.mm = clampMm(target); render(); if (onDone) onDone(); return;
  }
  const dur = Math.max(280, Math.min(950, 260 + dist * 42));
  const t0 = performance.now();
  (function step(t) {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    state.mm = from + (target - from) * e;
    render();
    if (k < 1) state.wpRaf = requestAnimationFrame(step);
    else { state.wpRaf = null; state.mm = clampMm(target); render(); if (onDone) onDone(); }
  })(t0);
}

function loadWorkpieceObj(wp, silent) {
  if (!wp) return;
  state.wp = wp;
  // Bring the spindle inside the new part's legal range at once.
  state.mm = clampMm(state.mm);
  if (!silent) playClick();
  $('drag-hint').classList.add('hidden');
  state.hinted = true;
  objBarSig = '';
  updateObjBar();
  syncPickerSelection();
  // Real sequence: the part goes in with the spindle backed fully off, then you
  // run it down onto the part with the ratchet.
  glideJawsTo(getMaxMm(), updateObjBar);
}

function loadWorkpiece(id) {
  const wp = findWp(id);
  if (!wp) return;
  togglePicker(false);
  loadWorkpieceObj(wp);
}

function clearWorkpiece() {
  cancelGlide();
  state.wp = null;
  objBarSig = '';
  // Taking the part out hands Practice back to the Play/Pause drill.
  if (state.mode === 'practice') {
    $('btn-play').disabled = false;
    $('caliper-card').style.cursor = 'default';
  }
  updateObjBar();
  syncPickerSelection();
  render();
}

function snapToContact() {
  if (!state.wp) return;
  glideJawsTo(state.wp.mm, function () { playContact(); updateObjBar(); });
}

// The spindle is draggable in Simulate, and in a graded mode whenever a part is
// loaded — otherwise the student could not close onto it.
function canDragJaws() { return state.mode === 'free' || !!state.wp; }

// Called every frame: a graded answer may only be submitted once the spindle is
// actually on the part, so the button follows the contact state.
function syncExerciseUi() {
  if (!state.wp) return;
  const contact = wpInContact();
  if (state.mode === 'practice' && !state.answered) {
    const btn = $('btn-check');
    if (btn && btn.disabled === contact) btn.disabled = !contact;
  } else if (state.mode === 'quiz' && !state.quizAnswered) {
    const btn = $('btn-quiz-submit');
    if (btn && btn.disabled === contact) btn.disabled = !contact;
  }
}

let objBarSig = '';
function updateObjBar() {
  const bar = $('obj-bar');
  if (!bar) return;
  const wp = state.wp;
  const fab = $('obj-fab');
  if (fab) fab.classList.toggle('loaded', !!wp);
  if (!wp || state.mode === 'explore') { bar.style.display = 'none'; objBarSig = ''; return; }
  bar.style.display = '';

  const contact = wpInContact();
  const reveal = wpRevealAllowed();
  // Rebuilt from innerHTML — skip unless something shown has actually changed,
  // otherwise a drag would re-render it at 60 fps.
  const sig = [wp.id, contact, reveal, state.mode, state.unit, state.zeOn, state.zeLc,
               (contact && reveal) ? fmtTr(state.mm + getZeOffsetMm()) : ''].join('|');
  if (sig === objBarSig) return;
  objBarSig = sig;

  const u = uLabel();
  const trueDisp = isImperial() ? (wp.mm * MM_TO_IN).toFixed(3) : wp.mm.toFixed(2);
  const readDisp = fmtTr(state.mm + getZeOffsetMm());
  // What the instrument can actually resolve: the true size rounded to the LC.
  const resolvable = Math.round(wp.mm / getLcMm()) * getLcMm();
  const resDisp = isImperial() ? (resolvable * MM_TO_IN).toFixed(3) : resolvable.toFixed(2);
  const unresolved = Math.abs((isImperial() ? resolvable * MM_TO_IN : resolvable) -
                              (isImperial() ? wp.mm * MM_TO_IN : wp.mm)) > (isImperial() ? 4e-4 : 4e-3);

  let status;
  if (!contact) {
    status = '<span class="ob-state ob-open">Spindle open</span>' +
      '<span class="ob-msg">Drag the thimble <strong>left</strong> (or press <strong>&larr;</strong>) until the spindle stops on the part.</span>';
  } else if (!reveal) {
    status = '<span class="ob-state ob-contact">&#10003; Faces in contact</span>' +
      '<span class="ob-msg">Now read the scales and type your answer' +
      (state.zeOn ? ', applying the zero-error correction.' : '.') + '</span>';
  } else {
    status = '<span class="ob-state ob-contact">&#10003; Faces in contact</span>' +
      '<span class="ob-msg">Read the scales: <strong>' + readDisp + ' ' + u + '</strong>' +
      (state.zeOn ? ' &mdash; then apply the zero-error correction.' : '.') + '</span>';
  }

  let lesson = '';
  if (!reveal) {
    lesson = '';
  } else if (contact && unresolved) {
    lesson = '<div class="ob-lesson"><strong>Resolution limit:</strong> the part is truly ' +
      trueDisp + ' ' + u + ', but a ' + fmtLc() + ' ' + u +
      ' micrometer resolves it to <strong>' + resDisp + ' ' + u + '</strong>.</div>';
  } else if (contact && state.zeOn) {
    lesson = '<div class="ob-lesson"><strong>Zero error is on:</strong> the scales show ' + readDisp +
      ' ' + u + '. Subtract the zero error and you are back to the true ' + trueDisp + ' ' + u + '.</div>';
  }

  bar.innerHTML =
    '<div class="ob-head">' +
      '<svg class="ob-thumb" viewBox="0 0 40 38" aria-hidden="true" fill="#aab6c8">' + WP_THUMBS[wp.shape] + '</svg>' +
      '<div class="ob-id"><span class="ob-name">' + wp.name + '</span>' +
      '<span class="ob-what">Measuring ' + wp.what + '</span></div>' +
      '<div class="ob-status">' + status + '</div>' +
      '<div class="ob-actions">' +
        '<button type="button" class="ob-btn" id="ob-snap"' + (contact ? ' disabled' : '') + '>&#8677; Close onto part</button>' +
        // In Quiz the question owns the part, so it cannot be taken out.
        (state.mode === 'quiz' ? '' :
          '<button type="button" class="ob-btn ob-btn-x" id="ob-clear">Remove</button>') +
      '</div>' +
    '</div>' +
    '<div class="ob-note">' + wp.note + '</div>' + lesson;

  var sBtn = $('ob-snap'); if (sBtn) sBtn.addEventListener('click', snapToContact);
  var cBtn = $('ob-clear'); if (cBtn) cBtn.addEventListener('click', clearWorkpiece);
}

// Practice: two drills share the bar and never overlap — Play/Pause freezes the
// spindle at a random opening, Measure-an-object clamps a real part in it.
// Starting either one ends the other, so there is only ever a single target.
function practiceMeasureObject() {
  if (state.playing) stopAnim();
  if (state.zeOn) state.zeLc = randomZeLc();
  const wp = pickExerciseWp(state.wp ? [state.wp.id] : null);
  state.answered = false;
  $('practice-input').value = '';
  $('feedback').textContent = '';
  $('feedback').className   = 'feedback';
  $('reading-cells').classList.add('cells-hidden');
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('dr-label').textContent = 'Your Reading';
  $('btn-check').disabled = true;      // until the spindle is on the part
  $('btn-play').disabled  = true;      // Play would fight the clamp
  $('btn-play').innerHTML = '&#9654;&nbsp; Play';
  $('btn-play').classList.remove('playing');
  $('caliper-card').style.cursor = 'grab';
  loadWorkpieceObj(wp);
}

// ── Mode / unit management ────────────────────────────────────────
function setMode(mode) {
  if (state.playing) stopAnim();
  state.playing = false;
  if (state.animRaf) { cancelAnimationFrame(state.animRaf); state.animRaf = null; }

  state.mode = mode;
  $('practice-bar').style.display = 'none';
  $('quiz-bar').style.display     = 'none';
  $('quiz-result').style.display  = 'none';
  $('sec-explore').style.display  = 'none';

  var showCanvas = (mode !== 'explore');
  $('caliper-card').style.display = showCanvas ? '' : 'none';
  document.querySelector('.info-row').style.display = showCanvas ? '' : 'none';

  // The picker FAB is Simulate-only: Practice loads parts from its own button
  // and Quiz assigns them per question, so neither needs a free-choice picker.
  togglePicker(false);
  $('obj-fab').style.display = (mode === 'free') ? '' : 'none';
  if (mode !== 'free' && state.wp) clearWorkpiece();
  updateObjBar();

  if (mode === 'explore') {
    buildExplorePanel();
    $('sec-explore').style.display = '';
  } else if (mode === 'practice') {
    $('practice-bar').style.display = '';
    $('caliper-card').style.cursor  = 'default';
    state.dragging = false;
    state.score = 0; state.attempts = 0;
    $('score').textContent = '0'; $('attempts').textContent = '0';
    newPractice();
  } else if (mode === 'quiz') {
    $('caliper-card').style.cursor = 'default';
    state.dragging = false;
    startQuiz();
  } else {
    $('caliper-card').style.cursor = 'grab';
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent = 'Measurement';
    $('reading-cells').classList.remove('cells-hidden');
    $('tr-formula').classList.remove('formula-hidden');
    render();
  }
}

function setUnit(unit) {
  state.unit = unit;
  state.mm = clampMm(snapToLc(state.mm));
  state.zeLc = clampZeLc(state.zeLc);
  if      (state.mode === 'practice') newPractice();
  else if (state.mode === 'quiz')     startQuiz();
  else                                render();
}

function setZeroError(on) {
  state.zeOn = !!on;
  if (!state.zeOn) state.zeLc = 0;
  // Reflect toggle UI state
  document.querySelectorAll('#ze-toggle .pill').forEach(function(b){
    b.classList.toggle('active', b.dataset.value === (state.zeOn ? 'on' : 'off'));
  });
  if      (state.mode === 'practice') newPractice();
  else if (state.mode === 'quiz')     startQuiz();
  else                                render();
}

function bumpZe(delta) {
  if (!state.zeOn) return;
  state.zeLc = clampZeLc(state.zeLc + delta);
  if      (state.mode === 'practice') newPractice();
  else if (state.mode === 'quiz')     startQuiz();
  else                                render();
}

// ── Interaction ───────────────────────────────────────────────────
function getCanvasX(e) {
  var r = canvas.getBoundingClientRect();
  var cx = e.clientX !== undefined ? e.clientX
         : e.touches && e.touches.length ? e.touches[0].clientX
         : e.changedTouches[0].clientX;
  // Map CSS px → logical canvas px (CW), so drag deltas are in the same
  // units as pxPerMm (which is logical px/mm). This also corrects drag
  // sensitivity when the canvas renders narrower than CW (mobile / padding).
  return (cx - r.left) * (CW / r.width);
}

function onDragStart(e) {
  if (!canDragJaws()) return;
  if (state.zoomOpen) return;
  cancelGlide();
  e.preventDefault();
  state.dragging  = true;
  state.dragRefX  = getCanvasX(e);
  state.dragRefMm = state.mm;
  if (!state.hinted) { $('drag-hint').classList.add('hidden'); state.hinted = true; }
  playClick();
}

function onDragMove(e) {
  if (!state.dragging) return;
  var dx = getCanvasX(e) - state.dragRefX;
  var pxPerMm = getMsdPx() * DS / getPitch();
  var oldMm = state.mm;
  var wasContact = wpInContact();
  state.mm = clampMm(snapToLc(state.dragRefMm + dx / pxPerMm));
  if (state.mm !== oldMm) playTick();
  if (!wasContact && wpInContact()) playContact();
  render();
  e.preventDefault();
}

function onDragEnd() { state.dragging = false; }

function onWheel(e) {
  if (!canDragJaws()) return;
  cancelGlide();
  var lcMm = getLcMm();
  state.mm = clampMm(snapToLc(state.mm + (e.deltaY > 0 ? lcMm : -lcMm)));
  playTick();
  render();
  e.preventDefault();
}

function onKeyDown(e) {
  var inInput = document.activeElement === $('practice-input');
  // With a workpiece loaded, the arrows belong to the spindle even while the
  // answer input has focus — otherwise a keyboard user could never close onto
  // the part in a graded question (the branches preventDefault, so the number
  // input's own caret/spinner never reacts).
  var arrows = (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown');
  if (inInput && e.key !== 'Enter' && !(state.wp && arrows)) return;

  if (e.key === 'Enter') {
    if (state.mode === 'practice') checkAnswer();
    else if (state.mode === 'quiz') submitQuizAnswer();
    return;
  }
  if (e.key === 'z' || e.key === 'Z') {
    state.zoomOpen = !state.zoomOpen;
    $('btn-zoom').classList.toggle('active', state.zoomOpen);
    $('btn-zoom').innerHTML = state.zoomOpen ? '\u2715<span class="zt-lbl">&nbsp;Close</span>' : '\uD83D\uDD0D<span class="zt-lbl">&nbsp;Zoom</span>';
    render();
    return;
  }
  if (!canDragJaws()) return;

  var step = e.shiftKey ? getPitch() : getLcMm();
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    cancelGlide();
    state.mm = clampMm(snapToLc(state.mm + step));
    playTick(); render(); e.preventDefault();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    cancelGlide();
    var wasContact = wpInContact();
    state.mm = clampMm(snapToLc(state.mm - step));
    playTick();
    if (!wasContact && wpInContact()) playContact();
    render(); e.preventDefault();
  }
}

// ── Event wiring ──────────────────────────────────────────────────
canvas.addEventListener('mousedown',  onDragStart);
window.addEventListener('mousemove',  onDragMove);
window.addEventListener('mouseup',    onDragEnd);
canvas.addEventListener('touchstart', onDragStart, { passive: false });
canvas.addEventListener('touchmove',  onDragMove,  { passive: false });
canvas.addEventListener('touchend',   onDragEnd);
canvas.addEventListener('wheel',      onWheel,     { passive: false });
window.addEventListener('keydown',    onKeyDown);

document.querySelectorAll('#mode-tabs .pill').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#mode-tabs .pill').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    setMode(btn.dataset.value);
  });
});

document.querySelectorAll('#unit-toggle .pill').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#unit-toggle .pill').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    setUnit(btn.dataset.value);
  });
});

$('btn-zoom').addEventListener('click', function() {
  state.zoomOpen = !state.zoomOpen;
  $('btn-zoom').classList.toggle('active', state.zoomOpen);
  $('btn-zoom').innerHTML = state.zoomOpen ? '\u2715<span class="zt-lbl">&nbsp;Close</span>' : '\uD83D\uDD0D<span class="zt-lbl">&nbsp;Zoom</span>';
  render();
});

$('btn-play').addEventListener('click', function() {
  // Disabled while a part is clamped, but if one is somehow loaded, take it out
  // rather than animate against the stop.
  if (state.wp) { clearWorkpiece(); newPractice(); return; }
  if (state.playing) stopAnim(); else startAnim();
});
var btnObj = $('btn-obj');
if (btnObj) btnObj.addEventListener('click', practiceMeasureObject);

// ── Workpiece picker wiring ───────────────────────────────────────
var objFab = $('obj-fab');
if (objFab) objFab.addEventListener('click', function () { togglePicker(); });
var objClose = $('obj-picker-close');
if (objClose) objClose.addEventListener('click', function () { togglePicker(false); });
var objNone = $('obj-none');
if (objNone) objNone.addEventListener('click', function () { clearWorkpiece(); togglePicker(false); });
window.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.pickerOpen) togglePicker(false); });
$('btn-new').addEventListener('click', newPractice);
$('btn-check').addEventListener('click', checkAnswer);

$('btn-quiz-submit').addEventListener('click', submitQuizAnswer);
$('btn-quiz-next').addEventListener('click', nextQuizQuestion);
$('btn-quiz-retry').addEventListener('click', function() {
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  startQuiz();
});

$('practice-input').addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  if (state.mode === 'practice') checkAnswer();
  else if (state.mode === 'quiz') submitQuizAnswer();
});

$('practice-input').addEventListener('input', function() {
  if (state.mode === 'practice' && !state.playing && !state.answered) {
    // With a part loaded, contact — not typing — is what arms the button.
    $('btn-check').disabled = state.wp ? !wpInContact()
                                       : $('practice-input').value === '';
  }
});

// ── Zero Error controls ───────────────────────────────────────────
document.querySelectorAll('#ze-toggle .pill').forEach(function(btn) {
  btn.addEventListener('click', function() {
    setZeroError(btn.dataset.value === 'on');
  });
});
var zeDec = $('ze-dec'); if (zeDec) zeDec.addEventListener('click', function(){ bumpZe(-1); });
var zeInc = $('ze-inc'); if (zeInc) zeInc.addEventListener('click', function(){ bumpZe(+1); });

window.addEventListener('resize', function () { setupCanvas(); render(); });

// ── Boot ──────────────────────────────────────────────────────────
setMode('free');
})();
