(function () {
'use strict';
// ════════════════════════════════════════════════════════════════════
//  Steel Ruler Simulator  —  app.js  v4
//  15 cm dual-scale ruler (0–150 mm / 0–5⅞″) | LC = 0.5 mm
//  Pure vector (canvas-drawn) · DPR-aware · brushed stainless look
// ════════════════════════════════════════════════════════════════════

// ── Instrument constants ─────────────────────────────────────────
let   LC         = 1;      // least count (mm) — toggleable: 1 (default) or 0.5
const RULER_MM   = 150;
const PX_PER_MM  = 4;
const QUIZ_TOTAL = 5;
const ANIM_SPEED = 20;
const INCH_MM    = 25.4;
const SIX_MM     = INCH_MM / 16;   // 1/16″ = 1.5875 mm

// ── Canvas (logical pixels) ──────────────────────────────────────
const CW = 700;
const CH = 200;
const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

// ── Ruler layout (canvas px) ─────────────────────────────────────
const RL      = 75;                                  // x-position of 0 mm mark (left padding for "0" numeral + "inch" label)
const RR      = 680;
const RW      = RR - RL;                             // 605 px ruler content width
const VIS_MM  = Math.floor(RW / PX_PER_MM);
const MAX_SCR = Math.max(0, RULER_MM - VIS_MM);

// SVG rendered height = 68 px; this includes the ruler body AND its tick marks.
// Drawing the SVG at full height lets the SVG's own marks serve as the scale.
const RY_TOP  = 10;              // top of ruler body on canvas
const RY_H    = 68;              // ruler body height = full SVG image height
const RY_BOT  = RY_TOP + RY_H;  // y = 78 — bottom measurement edge

// ── Bar (object) layout ──────────────────────────────────────────
const BAR_Y   = RY_BOT + 28;    // bar top face — gap clears the flipped cursor arrow
const BAR_FH  = 26;             // bar face height
const ISO_X   = 6;              // isometric x-offset (right)
const ISO_Y   = 3;              // isometric y-offset (up)

// ── Practice/quiz bar length range ──────────────────────────────
const BAR_MIN = 15;
const BAR_MAX = 140;

// ── State ────────────────────────────────────────────────────────
const state = {
  scrollMM    : 0,
  cursorMM    : 80,
  prevMM      : 80,
  mode        : 'free',
  dragging    : false,
  dragStartX  : 0,
  dragStartS  : 0,
  dragStartC  : 0,
  zoomOpen    : false,
  hinted      : false,
  // Options (Pass A)
  units       : 'mm',      // 'mm' | 'cm' | 'inch'
  snapCommon  : false,     // snap to common fastener sizes
  zeroError   : 0,         // worn-zero offset in mm (−2..+2)
  readBand    : true,      // highlight band from 0 to cursor
  // Pass B
  scenarioMode: false,
  currentScenario: null,
  // Pass C
  twoCursor   : false,
  cursor2MM   : 40,
  dragCursor  : 'main',   // 'main' | 'second'
  // Practice
  barMM       : 85,
  score       : 0, attempts: 0, answered: false,
  // Animation
  playing     : false, animDir: 1, animLast: 0, animRaf: null,
  // Quiz
  quizQuestions: [], quizCurrent: 0, quizAnswers: [], quizAnswered: false,
  quizConstruct: false,
  audioCtx: null,
};

// Common fastener / workshop sizes (in mm) for snap mode
const COMMON_SIZES = [
  3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150
];

// Real-world scenarios (Pass B)
const SCENARIOS = [
  { mm: 6,     label: 'M6 bolt diameter',         context: 'M6 is one of the most common metric fasteners — the bolt shank measures 6 mm across.' },
  { mm: 8.4,   label: 'USB-C connector width',    context: 'A USB-C plug is 8.4 mm wide × 2.6 mm thick — designed to be reversible and slim.' },
  { mm: 10,    label: 'Standard pencil lead',     context: 'A modern HB pencil shaft is about 7 mm; with the wood, the whole pencil is roughly 10 mm hex.' },
  { mm: 18,    label: 'AA battery diameter',      context: 'An AA cell measures 14.5 mm diameter × 50.5 mm long. A AAA is 10.5 × 44.5 mm.' },
  { mm: 25.4,  label: '1 inch (Imperial)',        context: 'Exactly 25.4 mm by international agreement (1959). Many machine sizes are still inch-based.' },
  { mm: 85.6,  label: 'Credit card width',        context: 'ISO/IEC 7810 ID-1: 85.60 × 53.98 mm × 0.76 mm. A useful calibration reference everywhere.' },
  { mm: 100,   label: '10 cm reference',          context: 'A round 100 mm benchmark — exactly one-tenth of a metre. Often used for quick rough measurement.' },
  { mm: 120,   label: 'CD/DVD diameter',          context: 'Standard CD/DVD discs are 120 mm diameter × 1.2 mm thick.' },
  { mm: 148,   label: 'A6 paper short edge',      context: 'A6 paper is 105 × 148 mm. The long edge of an A6 sheet fits a 150 mm steel ruler exactly.' },
  { mm: 50.5,  label: 'AA battery length',        context: 'Length of a standard AA cell — slightly over half the ruler.' },
];

const CONSTRUCT_TOL = 1.0;   // ±1 mm tolerance for reverse-quiz

// ── DOM ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('ruler-canvas');
const ctx    = canvas.getContext('2d');
// Backing store at device-pixel resolution for crisp ticks/text
canvas.width  = CW * DPR;
canvas.height = CH * DPR;

// ── Math helpers ─────────────────────────────────────────────────
const snapMM  = v  => Math.round(v / LC) * LC;
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Snap honoring "Snap to common" option (S-8)
function snapDist(mm) {
  if (state.snapCommon) {
    let best = COMMON_SIZES[0], bd = Infinity;
    for (let i = 0; i < COMMON_SIZES.length; i++) {
      const d = Math.abs(COMMON_SIZES[i] - mm);
      if (d < bd) { bd = d; best = COMMON_SIZES[i]; }
    }
    return best;
  }
  return snapMM(mm);
}

// Tick-on-mm-change (S-16)
function tickIfChanged() {
  const cur = state.mode === 'free' ? state.cursorMM : state.barMM;
  if (cur !== state.prevMM) {
    state.prevMM = cur;
    if (state.dragging) playTickSoft();
  }
}

// Format a length in the currently selected unit (S-U)
function formatLength(mm) {
  const m = mm + state.zeroError;     // worn-zero error: scale shows offset
  if (state.units === 'cm')   return { val: (m / 10).toFixed(2),  unit: 'cm' };
  if (state.units === 'inch') return { val: (m / INCH_MM).toFixed(3), unit: 'in' };
  return                            { val: m.toFixed(m % 1 === 0 ? 0 : 1), unit: 'mm' };
}

function mmToX(mm) {
  return RL + (mm - state.scrollMM) * PX_PER_MM;
}
function xToMM(x) {
  return (x - RL) / PX_PER_MM + state.scrollMM;
}

// ── Drawing helpers ──────────────────────────────────────────────

// Brushed stainless-steel ruler body, fully vector
function drawRuler() {
  const rx0  = mmToX(0);
  const rx1  = mmToX(RULER_MM);
  const vX0  = Math.max(rx0, RL);
  const vX1  = Math.min(rx1, RR);
  const visW = vX1 - vX0;
  if (visW <= 0) return;

  ctx.save();
  // Clip to ruler band with horizontal padding so "0" numeral & "inch" label
  // can render off the ruler body without being chopped
  ctx.beginPath();
  ctx.rect(RL - 12, RY_TOP - 2, RW + 24, RY_H + 12);
  ctx.clip();

  // 1. Drop shadow under ruler (drawn first, on dark canvas background)
  ctx.save();
  const sideG = ctx.createLinearGradient(0, RY_BOT, 0, RY_BOT + 8);
  sideG.addColorStop(0, 'rgba(0,0,0,0.45)');
  sideG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sideG;
  ctx.fillRect(vX0 + 3, RY_BOT, visW, 8);
  ctx.restore();

  // 2. Body fill — brushed stainless gradient
  const bodyG = ctx.createLinearGradient(0, RY_TOP, 0, RY_BOT);
  bodyG.addColorStop(0.00, '#dde0e3');
  bodyG.addColorStop(0.18, '#f3f4f6');
  bodyG.addColorStop(0.50, '#e4e6e9');
  bodyG.addColorStop(0.82, '#f1f3f5');
  bodyG.addColorStop(1.00, '#c9cbcd');
  ctx.fillStyle = bodyG;
  ctx.fillRect(rx0, RY_TOP, rx1 - rx0, RY_H);

  // 3. Horizontal brushed grain lines
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.strokeStyle = '#7a7d80';
  ctx.lineWidth = 0.5;
  for (let yy = RY_TOP + 4; yy < RY_BOT - 2; yy += 3) {
    ctx.beginPath();
    ctx.moveTo(rx0, yy + 0.5);
    ctx.lineTo(rx1, yy + 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Top edge bevel (highlight)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rx0, RY_TOP + 0.5);
  ctx.lineTo(rx1, RY_TOP + 0.5);
  ctx.stroke();

  // 5. Bottom edge — measurement edge, sharp dark line + thin highlight above
  ctx.strokeStyle = 'rgba(20,20,20,0.65)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(rx0, RY_BOT - 0.5);
  ctx.lineTo(rx1, RY_BOT - 0.5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(rx0, RY_BOT - 1.7);
  ctx.lineTo(rx1, RY_BOT - 1.7);
  ctx.stroke();

  // 6. METRIC scale — ticks descending from TOP edge
  const TOP_BASE = RY_TOP;
  const mStep = (LC === 0.5) ? 0.5 : 1;
  for (let mm = 0; mm <= RULER_MM + 1e-6; mm += mStep) {
    const x = mmToX(mm);
    if (x < rx0 - 2 || x > rx1 + 2) continue;
    const isWhole = Math.abs(mm - Math.round(mm)) < 1e-6;
    const mmInt   = Math.round(mm);
    let len, lw;
    if      (isWhole && mmInt % 10 === 0) { len = 13; lw = 1.25; }
    else if (isWhole && mmInt % 5  === 0) { len = 9;  lw = 1.00; }
    else if (isWhole)                     { len = 5;  lw = 0.70; }
    else                                  { len = 3;  lw = 0.55; }   // 0.5 mm sub-tick
    // White highlight (bevel)
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x + 0.55, TOP_BASE + 0.55);
    ctx.lineTo(x + 0.55, TOP_BASE + len + 0.55);
    ctx.stroke();
    // Engraved dark
    ctx.strokeStyle = '#1f1a14';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x, TOP_BASE);
    ctx.lineTo(x, TOP_BASE + len);
    ctx.stroke();
  }
  // Metric numerals (cm values 0–15) below the major ticks
  ctx.font = '700 11px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#1a1410';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (let cm = 0; cm <= 15; cm++) {
    const x = mmToX(cm * 10);
    if (x < rx0 - 6 || x > rx1 + 6) continue;
    ctx.fillText(String(cm), x, TOP_BASE + 14);
  }
  // "cm" unit label near left
  ctx.font = '700 9.5px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(95, 65, 18, 0.78)';
  ctx.textAlign = 'left';
  ctx.fillText('cm', rx0 + 4, TOP_BASE + 28);

  // 7. IMPERIAL scale — ticks ascending from BOTTOM edge
  const BOT_BASE = RY_BOT;
  const MAX_SIX  = Math.ceil(RULER_MM / SIX_MM);
  for (let i = 0; i <= MAX_SIX; i++) {
    const mm = i * SIX_MM;
    if (mm > RULER_MM + 0.01) break;
    const x = mmToX(mm);
    if (x < rx0 - 2 || x > rx1 + 2) continue;
    let len, lw;
    if      (i % 16 === 0) { len = 13; lw = 1.25; }   // whole inch
    else if (i % 8  === 0) { len = 10; lw = 1.05; }   // 1/2 inch
    else if (i % 4  === 0) { len = 7;  lw = 0.90; }   // 1/4 inch
    else if (i % 2  === 0) { len = 5;  lw = 0.75; }   // 1/8 inch
    else                   { len = 3;  lw = 0.60; }   // 1/16 inch
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x + 0.55, BOT_BASE - len + 0.55);
    ctx.lineTo(x + 0.55, BOT_BASE - 0.45);
    ctx.stroke();
    ctx.strokeStyle = '#1f1a14';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x, BOT_BASE - len);
    ctx.lineTo(x, BOT_BASE - 1);
    ctx.stroke();
  }
  // Inch numerals (0–5; 5⅞″ fits in 150 mm) above the major ticks
  ctx.font = '700 11px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = '#1a1410';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  for (let inch = 0; inch <= 5; inch++) {
    const mm = inch * INCH_MM;
    if (mm > RULER_MM) break;
    const x = mmToX(mm);
    if (x < rx0 - 6 || x > rx1 + 6) continue;
    ctx.fillText(String(inch), x, BOT_BASE - 14);
  }
  // "inch" unit label near left
  ctx.font = '700 9.5px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(95, 65, 18, 0.78)';
  ctx.textAlign = 'left';
  ctx.fillText('inch', rx0 + 4, BOT_BASE - 30);

  // 8. Brand engraving in the middle band
  ctx.font = '700 9.5px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const midY = (RY_TOP + RY_BOT) / 2;
  ctx.fillText('NHIT VisualLab', mmToX(75) + 0.5, midY + 0.5);
  ctx.fillStyle = 'rgba(80, 55, 15, 0.7)';
  ctx.fillText('NHIT VisualLab', mmToX(75), midY);
  ctx.font = '600 8px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(80, 55, 15, 0.6)';
  ctx.fillText('STEEL RULE · LC ' + LC + ' mm · STAINLESS', mmToX(75), midY + 11);

  // 9. End caps (subtle darker edges at 0 and 150)
  [rx0, rx1].forEach(x => {
    if (x >= rx0 - 2 && x <= rx1 + 2) {
      ctx.fillStyle = 'rgba(40,40,40,0.35)';
      ctx.fillRect(x - 0.7, RY_TOP, 1.4, RY_H);
    }
  });

  ctx.restore();
}

// Draw the 3D steel bar (object to measure)
// Left edge always aligns with 0 mm on the ruler
function drawBar(lenMM) {
  const x0  = mmToX(0);
  const x1  = mmToX(lenMM);
  if (x1 < RL || x0 > RR) return;

  const cX0 = Math.max(x0, RL);
  const cX1 = Math.min(x1, RR);
  const bY0 = BAR_Y;
  const bY1 = BAR_Y + BAR_FH;

  ctx.save();
  ctx.beginPath();
  ctx.rect(RL, BAR_Y - ISO_Y - 4, RW, BAR_FH + ISO_Y + 14);
  ctx.clip();

  // Drop shadow beneath bar
  const shadG = ctx.createLinearGradient(0, bY1, 0, bY1 + 9);
  shadG.addColorStop(0, 'rgba(0,0,0,0.32)');
  shadG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadG;
  ctx.fillRect(cX0 + 5, bY1, cX1 - cX0, 9);

  // ── Front face (main visible surface) ─────────────────────────
  const faceG = ctx.createLinearGradient(0, bY0, 0, bY1);
  faceG.addColorStop(0,   '#80ccee');
  faceG.addColorStop(0.3, '#55aad8');
  faceG.addColorStop(0.7, '#3a8ec0');
  faceG.addColorStop(1,   '#2670a8');
  ctx.fillStyle = faceG;
  ctx.fillRect(cX0, bY0, cX1 - cX0, BAR_FH);

  // Sheen highlight at top of face
  const sheenG = ctx.createLinearGradient(0, bY0, 0, bY0 + 10);
  sheenG.addColorStop(0, 'rgba(255,255,255,0.45)');
  sheenG.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheenG;
  ctx.fillRect(cX0, bY0, cX1 - cX0, 10);

  // Fine engraved line on face (decorative)
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cX0, bY0 + BAR_FH * 0.5);
  ctx.lineTo(cX1, bY0 + BAR_FH * 0.5);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(cX0, bY0 + BAR_FH * 0.5 + 1);
  ctx.lineTo(cX1, bY0 + BAR_FH * 0.5 + 1);
  ctx.stroke();

  // ── Top isometric face (thin parallelogram, light — faces "upward") ──
  if (x1 >= RL) {
    ctx.beginPath();
    ctx.moveTo(cX0,         bY0);
    ctx.lineTo(cX0 + ISO_X, bY0 - ISO_Y);
    ctx.lineTo(Math.min(x1 + ISO_X, cX1 + ISO_X), bY0 - ISO_Y);
    ctx.lineTo(cX1,         bY0);
    ctx.closePath();
    ctx.fillStyle = '#a8ddf5';
    ctx.fill();
  }

  // ── Right end face (dark — in shadow) ─────────────────────────
  if (x1 >= RL && x1 <= RR) {
    ctx.beginPath();
    ctx.moveTo(x1,         bY0);
    ctx.lineTo(x1 + ISO_X, bY0 - ISO_Y);
    ctx.lineTo(x1 + ISO_X, bY1 - ISO_Y);
    ctx.lineTo(x1,         bY1);
    ctx.closePath();
    const endG = ctx.createLinearGradient(x1, 0, x1 + ISO_X, 0);
    endG.addColorStop(0, '#3880b8');
    endG.addColorStop(1, '#205898');
    ctx.fillStyle = endG;
    ctx.fill();
  }

  // ── Bottom edge stroke ─────────────────────────────────────────
  ctx.strokeStyle = 'rgba(18,60,110,0.8)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cX0, bY1);
  ctx.lineTo(cX1, bY1);
  ctx.stroke();

  // ── Left end cap at 0 mm ───────────────────────────────────────
  if (x0 >= RL && x0 <= RR) {
    ctx.fillStyle = 'rgba(15,50,100,0.85)';
    ctx.fillRect(x0 - 1.5, bY0, 2, BAR_FH);
  }

  ctx.restore(); // ← release clip before drawing guide line

  // ── Red measurement guide line — drawn OUTSIDE clip so it spans
  //    from the mm measurement edge (RY_TOP) all the way through the bar.
  //    Practice/Quiz answers are read in mm, so the arrow must reach the
  //    top (metric) scale, not the bottom (inch) edge.
  if (x1 >= RL && x1 <= RR) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,60,60,0.92)';
    ctx.lineWidth   = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, RY_TOP);
    ctx.lineTo(x1, bY1 + 6);
    ctx.stroke();
    ctx.setLineDash([]);

    // Red arrowhead pointing UP to the mm measurement edge
    ctx.fillStyle = 'rgba(255,60,60,0.88)';
    ctx.beginPath();
    ctx.moveTo(x1,     RY_TOP);
    ctx.lineTo(x1 - 6, RY_TOP + 12);
    ctx.lineTo(x1 + 6, RY_TOP + 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Free-mode cursor: hairline through ruler body + arrow from below pointing up
function drawCursor(mm, color) {
  const x = mmToX(mm);
  if (x < RL || x > RR) return;
  const fill = color || '#f5c842';
  const rim  = color ? 'rgba(40, 80, 130, 0.95)' : 'rgba(140, 90, 0, 0.9)';
  const glow = color ? 'rgba(94, 154, 217, 0.85)' : 'rgba(245, 200, 66, 0.85)';
  const stemColor = color ? 'rgba(94,154,217,0.6)' : 'rgba(245,200,66,0.65)';

  ctx.save();

  ctx.strokeStyle = 'rgba(20,20,20,0.65)';
  ctx.lineWidth   = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x, RY_TOP + 2);
  ctx.lineTo(x, RY_BOT);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle   = fill;
  ctx.strokeStyle = rim;
  ctx.lineWidth   = 1;
  ctx.shadowColor = glow;
  ctx.shadowBlur  = 7;
  ctx.beginPath();
  ctx.moveTo(x,      RY_BOT);
  ctx.lineTo(x - 9,  RY_BOT + 18);
  ctx.lineTo(x + 9,  RY_BOT + 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = stemColor;
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, RY_BOT + 18);
  ctx.lineTo(x, RY_BOT + 26);
  ctx.stroke();

  ctx.restore();
}

function drawBadge() {
  const txt = 'LC = ' + LC + ' mm';
  ctx.save();
  ctx.font          = 'bold 8.5pt sans-serif';
  ctx.textAlign     = 'left';
  ctx.textBaseline  = 'middle';
  const tw = ctx.measureText(txt).width;
  // Position below the ruler, left-aligned — clear of the "0" mark
  const bx = 8, by = CH - 24;
  ctx.fillStyle = 'rgba(0,0,0,0.58)';
  if (ctx.roundRect) ctx.roundRect(bx, by, tw + 12, 18, 4);
  else ctx.rect(bx, by, tw + 12, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,200,66,0.52)';
  ctx.lineWidth   = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#f5c842';
  ctx.fillText(txt, bx + 6, by + 9);
  ctx.restore();
}

function drawContent() {
  drawRuler();
  if (state.mode === 'free') {
    drawReadingBand();
    drawCursor(state.cursorMM);
    if (state.twoCursor) drawCursor(state.cursor2MM, '#5e9ad9');
    drawBadge();
  } else {
    drawBar(state.barMM);
  }
}

// S-RB — Highlighted measurement band (0 → cursor in single-cursor; between cursors in two-cursor)
function drawReadingBand() {
  if (!state.readBand) return;
  let aMM, bMM;
  if (state.twoCursor) {
    aMM = Math.min(state.cursorMM, state.cursor2MM);
    bMM = Math.max(state.cursorMM, state.cursor2MM);
  } else {
    aMM = 0;
    bMM = state.cursorMM;
  }
  if (bMM <= aMM) return;
  const x1 = Math.max(mmToX(aMM), RL);
  const x2 = Math.min(mmToX(bMM), RR);
  if (x2 <= x1) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(RL - 1, RY_TOP - 2, RW + 2, RY_H + 4);
  ctx.clip();
  ctx.fillStyle = 'rgba(79, 142, 247, 0.14)';
  ctx.fillRect(x1, RY_TOP + 2, x2 - x1, RY_H - 4);
  // Endpoint markers
  ctx.strokeStyle = 'rgba(79, 142, 247, 0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, RY_TOP + 2); ctx.lineTo(x1, RY_BOT - 2);
  ctx.moveTo(x2, RY_TOP + 2); ctx.lineTo(x2, RY_BOT - 2);
  ctx.stroke();
  ctx.restore();
}

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, CW, CH);
  drawContent();
}

function drawZoomed() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, CW, CH);

  const ZF    = 3.0;
  const focMM = state.mode === 'free' ? state.cursorMM : state.barMM;
  const focX  = mmToX(focMM);
  // Center vertically on the ruler midline so BOTH the mm (top) and inch
  // (bottom) scales remain visible when zoomed in.
  const focY  = (RY_TOP + RY_BOT) / 2;
  const cx    = focX - CW  / (2 * ZF);
  const cy    = focY - CH  / (2 * ZF);

  ctx.save();
  ctx.scale(ZF, ZF);
  ctx.translate(-cx, -cy);
  drawContent();
  ctx.restore();
}

// ── Reading panel ─────────────────────────────────────────────────
function measuredMM() {
  if (state.mode === 'free' && state.twoCursor) {
    return Math.abs(state.cursorMM - state.cursor2MM);
  }
  return state.mode === 'free' ? state.cursorMM : state.barMM;
}

function updateReadingPanel() {
  const mm = measuredMM();
  const cm = (mm / 10).toFixed(2);
  const inch = (mm / INCH_MM).toFixed(3);
  const m  = (mm / 1000).toFixed(4);
  const ze = state.zeroError;
  const scaleMM = (state.mode === 'free' && !state.twoCursor)
                  ? clamp(state.cursorMM + ze, 0, RULER_MM)
                  : mm;   // worn-zero only applies to single-cursor reading from 0

  // MM cell with optional worn-zero highlight
  if (ze === 0 || state.twoCursor || state.mode !== 'free') {
    $('mm-val').textContent = mm;
  } else {
    $('mm-val').innerHTML = '<span style="opacity:.55">' + scaleMM +
      '</span> <span style="color:var(--accent);font-size:.7em">→ ' + mm + '</span>';
  }
  $('cm-val').textContent   = cm;
  $('m-val').textContent    = m;
  $('f-mm').textContent     = mm;
  $('f-mm2').textContent    = mm;
  $('f-cm').textContent     = cm;
  $('f-note').textContent   = `Length = ${cm} cm  ·  ${inch} in`;

  // Readout display: respects active unit (S-U)
  const fmt = formatLength(mm - ze);   // remove ze from formatting; display "true" length
  $('readout-display').textContent = fmt.val;
  const drUnit = document.querySelector('.dr-unit');
  if (drUnit) drUnit.textContent = fmt.unit;

  $('rb-mm').textContent = mm;
  $('rb-cm').textContent = cm;

  // Worn-zero correction line (S-13)
  let zeRow = document.getElementById('tr-ze');
  if (ze !== 0 && state.mode === 'free' && !state.twoCursor) {
    const sign = ze > 0 ? '+' : '−';
    const op   = ze > 0 ? '−' : '+';
    const html = 'Scale reads <strong>' + scaleMM + ' mm</strong>' +
                 ' &nbsp;|&nbsp; Worn zero <strong>' + sign + Math.abs(ze) + ' mm</strong>' +
                 ' &nbsp;&rArr;&nbsp; True = ' + scaleMM + ' ' + op + ' ' + Math.abs(ze) +
                 ' = <strong>' + mm + ' mm</strong>';
    if (!zeRow) {
      zeRow = document.createElement('div');
      zeRow.id = 'tr-ze';
      zeRow.className = 'tr-step tr-ze';
      zeRow.style.cssText = 'margin-top:4px;font-size:.78rem;color:#b06a18;';
      $('tr-formula').appendChild(zeRow);
    }
    zeRow.innerHTML = html;
  } else if (zeRow) {
    zeRow.remove();
  }
}

function render() {
  updateReadingPanel();
  if (state.zoomOpen) drawZoomed();
  else                draw();
}

// ── Animation (Play / Pause) ──────────────────────────────────────
function animStep(ts) {
  if (!state.playing) return;
  if (state.animLast) {
    const dt   = (ts - state.animLast) / 1000;
    let   next = state.barMM + state.animDir * ANIM_SPEED * dt;
    if (next >= BAR_MAX) { next = BAR_MAX; state.animDir = -1; }
    if (next <= BAR_MIN) { next = BAR_MIN; state.animDir =  1; }
    state.barMM = clamp(snapMM(next), BAR_MIN, BAR_MAX);
  }
  state.animLast = ts;
  render();
  state.animRaf = requestAnimationFrame(animStep);
}

function startAnim() {
  if (state.animRaf) cancelAnimationFrame(state.animRaf);
  state.playing  = true;
  state.animLast = 0;
  state.barMM    = BAR_MIN;   // always start from minimum
  state.animDir  = 1;
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
  $('btn-check').disabled   = false;
  $('practice-input').value = '';
  $('practice-input').focus();
}

// ── Mode management ───────────────────────────────────────────────
function setMode(mode) {
  if (state.playing) stopAnim();
  state.mode     = mode;
  state.scrollMM = 0;

  $('practice-bar').style.display = 'none';
  $('quiz-bar').style.display     = 'none';
  $('quiz-result').style.display  = 'none';
  $('sec-explore').style.display  = 'none';
  $('canvas-card').className      = 'canvas-card';
  $('canvas-card').style.display  = '';

  // Show/hide badges and info row based on mode
  var showBadges = mode === 'free';
  $('readout-badges').style.display = showBadges ? '' : 'none';

  if (mode === 'explore') {
    $('sec-explore').style.display = '';
    $('canvas-card').style.display = 'none';
    document.querySelector('.info-row').style.display = 'none';
    renderExplore('basics');
    // Reset explore tabs
    document.querySelectorAll('#explore-tabs .explore-tab').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('#explore-tabs .explore-tab[data-cat="basics"]').classList.add('active');
  } else if (mode === 'practice') {
    document.querySelector('.info-row').style.display = '';
    $('practice-bar').style.display = '';
    $('canvas-card').classList.add('grab');
    state.score    = 0;
    state.attempts = 0;
    $('score').textContent    = '0';
    $('attempts').textContent = '0';
    newPractice();
  } else if (mode === 'quiz') {
    document.querySelector('.info-row').style.display = '';
    $('canvas-card').classList.add('grab');
    startQuiz();
  } else {
    // Free mode
    document.querySelector('.info-row').style.display = '';
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent          = 'Length';
    $('reading-cells').classList.remove('cells-hidden');
    $('tr-formula').classList.remove('formula-hidden');
    $('drag-hint').textContent = 'Drag cursor \u00a0|\u00a0 \u2190\u2192 Arrow keys \u00a0|\u00a0 Scroll wheel';
    render();
  }
}

// ── Practice mode ─────────────────────────────────────────────────
function newPractice() {
  if (state.playing) stopAnim();
  state.scrollMM = 0;
  state.answered = false;
  // Mix of multiples-of-5 and 1mm-step values for variety
  const pool = [];
  for (let m = BAR_MIN; m <= BAR_MAX; m++) pool.push(m);
  state.barMM = pool[Math.floor(Math.random() * pool.length)];

  $('feedback').textContent = '';
  $('feedback').className   = 'feedback';
  $('reading-cells').classList.add('cells-hidden');
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('practice-input').value          = '';
  $('dr-label').textContent          = 'Your Reading';
  $('btn-check').disabled = true;

  setTimeout(() => $('practice-input').focus(), 50);
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
  const correct = state.barMM;
  const ok      = Math.abs(input - correct) < LC / 2 + 0.01; // within half a LC
  state.answered = true;

  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('readout-display').textContent   = correct;
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Length';
  $('btn-check').disabled            = true;

  if (ok) {
    state.score++;
    $('feedback').innerHTML = `\u2713 Correct! &nbsp;<strong>${correct} mm</strong>`;
    $('feedback').className = 'feedback ok';
    playSuccess();
  } else {
    $('feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correct} mm</strong>`;
    $('feedback').className = 'feedback err';
    playError();
  }
  $('score').textContent    = state.score;
  $('attempts').textContent = state.attempts;
  render();
}

// ── Quiz mode ─────────────────────────────────────────────────────
function startQuiz() {
  const pool = [];
  for (let m = BAR_MIN; m <= BAR_MAX; m++) pool.push(m);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, QUIZ_TOTAL);
  state.quizQuestions = shuffled;
  state.quizCurrent   = 0;
  state.quizAnswers   = [];
  state.quizAnswered  = false;
  state.scrollMM      = 0;
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  $('quiz-q-total').textContent  = QUIZ_TOTAL;
  showQuizQuestion(0);
}

function showQuizQuestion(idx) {
  state.barMM        = state.quizQuestions[idx];
  state.quizAnswered = false;
  state.scrollMM     = 0;

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
  const input = parseFloat($('practice-input').value);
  if (isNaN(input)) {
    $('quiz-feedback').textContent = 'Enter a number first.';
    $('quiz-feedback').className   = 'quiz-feedback err';
    return;
  }
  const correct = state.quizQuestions[state.quizCurrent];
  const ok      = Math.abs(input - correct) < LC / 2 + 0.01; // within half a LC
  state.quizAnswers.push({ given: input, correct, ok });
  state.quizAnswered = true;

  $('readout-display').textContent   = correct;
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Length';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('btn-quiz-submit').style.display = 'none';

  if (ok) {
    $('quiz-feedback').innerHTML = '\u2713 Correct!';
    $('quiz-feedback').className = 'quiz-feedback ok';
    playSuccess();
  } else {
    $('quiz-feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correct} mm</strong>`;
    $('quiz-feedback').className = 'quiz-feedback err';
    playError();
  }
  const isLast = state.quizCurrent + 1 >= QUIZ_TOTAL;
  $('btn-quiz-next').innerHTML     = isLast ? '\uD83D\uDCCA\u00a0Results' : 'Next \u2192';
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

  const score   = state.quizAnswers.filter(a => a.ok).length;
  const filled  = n => '\u2605'.repeat(n) + '\u2606'.repeat(QUIZ_TOTAL - n);
  const scoreEl = $('qr-score');
  const starsEl = $('qr-stars');
  const vEl     = $('qr-verdict');

  scoreEl.textContent = `${score} / ${QUIZ_TOTAL}`;
  if (score === QUIZ_TOTAL) {
    scoreEl.className = 'qr-score perfect';
    starsEl.textContent = filled(QUIZ_TOTAL); starsEl.style.color = 'var(--gold)';
    vEl.textContent = 'Perfect score! \uD83C\uDFAF';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.8)) {
    scoreEl.className = 'qr-score good';
    starsEl.textContent = filled(score); starsEl.style.color = 'var(--green)';
    vEl.textContent = 'Great job! Almost perfect \uD83D\uDC4D';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.6)) {
    scoreEl.className = 'qr-score good';
    starsEl.textContent = filled(score); starsEl.style.color = 'var(--green)';
    vEl.textContent = 'Good effort! Keep practising \uD83D\uDCAA';
  } else if (score >= 1) {
    scoreEl.className = 'qr-score poor';
    starsEl.textContent = filled(score); starsEl.style.color = '#ffb74d';
    vEl.textContent = "Keep practising \u2014 you\u2019ll get it! \uD83D\uDCAA";
  } else {
    scoreEl.className = 'qr-score poor';
    starsEl.textContent = filled(0); starsEl.style.color = 'var(--red)';
    vEl.textContent = 'Try again \u2014 you can do it! \uD83D\uDCAA';
  }

  const rowsEl = $('qr-rows');
  rowsEl.innerHTML = '';
  state.quizAnswers.forEach((ans, i) => {
    const row = document.createElement('div');
    row.className = `qr-row ${ans.ok ? 'ok' : 'err'}`;
    row.innerHTML =
      `<span class="qr-qnum">Q${i + 1}</span>` +
      `<span class="qr-correct">Correct: <strong>${ans.correct} mm</strong></span>` +
      `<span class="qr-given">Your answer: <strong>${ans.given} mm</strong></span>` +
      `<span class="qr-mark">${ans.ok ? '\u2713' : '\u2717'}</span>`;
    rowsEl.appendChild(row);
  });

  $('readout-display').textContent   = state.barMM;
  $('readout-display').style.display = 'block';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('dr-label').textContent = 'Length';
}

// ── Drag / interaction helpers ────────────────────────────────────
function getCanvasX(e) {
  const r  = canvas.getBoundingClientRect();
  const cx = e.clientX !== undefined ? e.clientX
           : e.touches && e.touches.length ? e.touches[0].clientX
           : e.changedTouches[0].clientX;
  // Map CSS pixels → logical canvas pixels (DPR handled in setTransform)
  return (cx - r.left) * (CW / r.width);
}

function onPointerDown(e) {
  if (state.zoomOpen) return;
  /* Only block scroll when touching the ruler body area */
  var r = canvas.getBoundingClientRect();
  var cy = (e.clientY !== undefined ? e.clientY : e.touches && e.touches.length ? e.touches[0].clientY : e.changedTouches[0].clientY);
  var canY = (cy - r.top) * (CH / r.height);
  if (canY < 20 || canY > CH - 20) return;
  e.preventDefault();
  if (!state.hinted) { $('drag-hint').classList.add('hidden'); state.hinted = true; }
  state.dragging   = true;
  state.dragStartX = getCanvasX(e);
  state.dragStartS = state.scrollMM;
  state.dragStartC = state.cursorMM;

  // Free mode: snap to clicked position; if two-cursor, snap nearest cursor
  if (state.mode === 'free') {
    const targetMM = clamp(snapDist(xToMM(state.dragStartX)), 0, RULER_MM);
    if (state.twoCursor) {
      const d1 = Math.abs(targetMM - state.cursorMM);
      const d2 = Math.abs(targetMM - state.cursor2MM);
      state.dragCursor = (d2 < d1) ? 'second' : 'main';
      if (state.dragCursor === 'second') state.cursor2MM = targetMM;
      else                                state.cursorMM = targetMM;
    } else {
      state.dragCursor = 'main';
      state.cursorMM = targetMM;
    }
    playClick();
    render();
  }
}

function onPointerMove(e) {
  if (!state.dragging) return;
  const x    = getCanvasX(e);
  const dxMM = (x - state.dragStartX) / PX_PER_MM;

  if (state.mode === 'free') {
    const targetMM = clamp(snapDist(xToMM(x)), 0, RULER_MM);
    if (state.twoCursor && state.dragCursor === 'second') state.cursor2MM = targetMM;
    else                                                   state.cursorMM = targetMM;
    // Auto-scroll to keep active cursor visible
    const activeMM = (state.twoCursor && state.dragCursor === 'second') ? state.cursor2MM : state.cursorMM;
    const curX = mmToX(activeMM);
    if (curX > RR - 15)
      state.scrollMM = clamp(activeMM - VIS_MM + 20, 0, MAX_SCR);
    else if (curX < RL + 15)
      state.scrollMM = clamp(activeMM - 20, 0, MAX_SCR);
  } else if (state.mode === 'quiz' && state.quizConstruct && !state.quizAnswered) {
    // Reverse-quiz: drag the bar (changes length)
    state.barMM = clamp(snapDist(xToMM(x)), BAR_MIN, BAR_MAX);
  } else {
    state.scrollMM = clamp(snapMM(state.dragStartS - dxMM), 0, MAX_SCR);
  }
  tickIfChanged();
  render();
  e.preventDefault();
}

function onPointerUp() { state.dragging = false; }

// Scroll wheel support
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = (e.deltaY > 0 ? 5 : -5);
  if (state.mode === 'free') {
    state.cursorMM = clamp(snapMM(state.cursorMM + delta), 0, RULER_MM);
  } else {
    state.scrollMM = clamp(snapMM(state.scrollMM + delta), 0, MAX_SCR);
  }
  render();
}, { passive: false });

// ── Keyboard ──────────────────────────────────────────────────────
function onKeyDown(e) {
  const inInput = document.activeElement === $('practice-input');
  if (inInput && e.key !== 'Enter') return;

  if (e.key === 'Enter') {
    if      (state.mode === 'practice') checkAnswer();
    else if (state.mode === 'quiz')     submitQuizAnswer();
    return;
  }
  if (e.key === 'z' || e.key === 'Z') {
    state.zoomOpen = !state.zoomOpen;
    $('btn-zoom').classList.toggle('active', state.zoomOpen);
    render(); return;
  }

  // S-10 — extended keyboard precision
  let step = LC;
  if (e.shiftKey) step = 10;
  if (e.key === 'PageUp' || e.key === 'PageDown') step = 10;

  if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') {
    if (state.mode === 'free')
      state.cursorMM = clamp(snapMM(state.cursorMM + step), 0, RULER_MM);
    else
      state.scrollMM = clamp(snapMM(state.scrollMM + step), 0, MAX_SCR);
    tickIfChanged(); render(); e.preventDefault();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') {
    if (state.mode === 'free')
      state.cursorMM = clamp(snapMM(state.cursorMM - step), 0, RULER_MM);
    else
      state.scrollMM = clamp(snapMM(state.scrollMM - step), 0, MAX_SCR);
    tickIfChanged(); render(); e.preventDefault();
  } else if (e.key === 'Home') {
    if (state.mode === 'free') state.cursorMM = 0;
    else                       state.scrollMM = 0;
    tickIfChanged(); render(); e.preventDefault();
  } else if (e.key === 'End') {
    if (state.mode === 'free') state.cursorMM = RULER_MM;
    else                       state.scrollMM = MAX_SCR;
    tickIfChanged(); render(); e.preventDefault();
  }
}

// ── Event listeners ───────────────────────────────────────────────
canvas.addEventListener('mousedown',  onPointerDown);
window.addEventListener('mousemove',  onPointerMove);
window.addEventListener('mouseup',    onPointerUp);
canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove',  onPointerMove, { passive: false });
canvas.addEventListener('touchend',   onPointerUp);
window.addEventListener('keydown',    onKeyDown);

// Mode tabs
document.querySelectorAll('#mode-tabs .pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-tabs .pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setMode(btn.dataset.value);
  });
});

// LC (precision) toggle — 1 mm (default) ↔ 0.5 mm
document.querySelectorAll('.lc-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = parseFloat(btn.dataset.lc);
    if (!(v === 1 || v === 0.5) || v === LC) return;
    LC = v;
    document.querySelectorAll('.lc-pill').forEach(b => b.classList.toggle('active', parseFloat(b.dataset.lc) === LC));
    // Re-snap current cursors to new LC grid
    state.cursorMM  = Math.round(state.cursorMM  / LC) * LC;
    state.cursor2MM = Math.round(state.cursor2MM / LC) * LC;
    state.barMM     = Math.round(state.barMM     / LC) * LC;
    // Sync labels that show the LC value
    const rbLc   = document.getElementById('rb-lc');     if (rbLc)   rbLc.textContent   = LC;
    const trlLc  = document.getElementById('trl-lc-val');if (trlLc)  trlLc.textContent  = LC;
    const subLc  = document.getElementById('subtitle-lc');if (subLc) subLc.textContent  = LC;
    const step3  = document.getElementById('step-3-label');
    if (step3 && step3.textContent.startsWith('Add fractional')) step3.textContent = 'Add fractional (' + LC + ' mm)';
    render();
  });
});

// Zoom
$('btn-zoom').addEventListener('click', () => {
  state.zoomOpen = !state.zoomOpen;
  $('btn-zoom').classList.toggle('active', state.zoomOpen);
  render();
});

// Practice
$('btn-new').addEventListener('click', newPractice);
$('btn-check').addEventListener('click', checkAnswer);

// Quiz
$('btn-quiz-submit').addEventListener('click', submitQuizAnswer);
$('btn-quiz-next').addEventListener('click', nextQuizQuestion);
$('btn-quiz-retry').addEventListener('click', () => {
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  startQuiz();
});

// Input: Enter submits; enable Check when non-empty
$('practice-input').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if      (state.mode === 'practice') checkAnswer();
  else if (state.mode === 'quiz')     submitQuizAnswer();
});
$('practice-input').addEventListener('input', () => {
  if (state.mode === 'practice' && !state.playing && !state.answered)
    $('btn-check').disabled = $('practice-input').value === '';
});

// ── Sound feedback ────────────────────────────────────────────────
function getAudioCtx() {
  if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return state.audioCtx;
}
function playTone(freq, dur, type, vol) {
  try {
    const c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch (e) { /* silent */ }
}
function playClick()    { playTone(800, 0.05, 'square', 0.04); }
function playTickSoft() { playTone(1500, 0.015, 'square', 0.018); }
function playSuccess()  { playTone(880, 0.12, 'sine', 0.1); setTimeout(() => playTone(1100, 0.15, 'sine', 0.1), 120); }
function playError()    { playTone(300, 0.2, 'sawtooth', 0.06); }

// ── Explore mode ──────────────────────────────────────────────────
const EXPLORE = {
  basics: [
    { title: 'What is a Steel Ruler?', body: 'A <strong>steel ruler</strong> (steel rule) is a flat, rigid measuring instrument made from hardened stainless steel. It is the most basic linear measuring tool in any workshop, used for quick measurements, marking out, and layout work.', note: 'Steel rulers are the foundation — master this before moving to vernier calipers or micrometers.' },
    { title: 'Scale Graduations', body: 'A metric steel ruler is graduated in <strong>millimetres (mm)</strong>. The longest lines mark centimetres (10 mm intervals), medium lines mark 5 mm, and the shortest lines mark individual millimetres. Some rulers have 0.5 mm graduations for finer reading.', note: 'This simulator uses 0.5 mm least count (LC) — the smallest readable division.' },
    { title: 'Least Count (LC)', body: 'The <strong>least count</strong> is the smallest measurement a ruler can read. For this ruler: <code>LC = 0.5 mm</code>. Any measurement is expressed as a multiple of the LC. For example, a reading of 47.5 mm means 95 × 0.5 mm divisions from zero.', note: 'LC determines the precision limit — you cannot read below this without estimation.' },
    { title: 'Material & Construction', body: 'Quality rulers use <strong>tempered stainless steel</strong> for corrosion resistance and dimensional stability. Graduations are chemically etched or laser-engraved (not printed) to resist wear. Typical thickness is 0.5–1.0 mm.' }
  ],
  reading: [
    { title: 'How to Read a Steel Ruler', body: 'Place the <strong>zero end</strong> flush against the reference edge of the workpiece. Read the value at the opposite edge. Identify the nearest mm graduation, then check whether the edge falls on a whole mm or between two marks (0.5 mm).', note: 'Always read from directly above to avoid parallax error.' },
    { title: 'Unit Conversions', body: 'Converting between metric units is straightforward:<br><code>cm = mm ÷ 10</code><br><code>m = mm ÷ 1000</code><br>Example: 75 mm = 7.5 cm = 0.075 m. This simulator shows all three units simultaneously.' },
    { title: 'Reading to 0.5 mm', body: 'When the workpiece edge falls between two 1 mm marks, read the lower mm value and add 0.5 mm. Example: edge between 42 mm and 43 mm → reading is <strong>42.5 mm</strong>. If the edge aligns exactly with a mark, the reading is a whole number.' },
    { title: 'Avoiding the Zero End', body: 'On a real ruler, the zero end wears over time, introducing error. A common technique is to <strong>start from the 10 mm mark</strong> and subtract 10 from the reading. This is called the <strong>offset method</strong>.' }
  ],
  types: [
    { title: 'Rigid Steel Ruler', body: 'The most common type — a flat, straight bar with mm/cm graduations. Lengths range from 150 mm (6") to 1000 mm (40"). Used for general measurement, marking out, and checking straightness.' },
    { title: 'Flexible Steel Ruler', body: 'A thinner, bendable ruler that conforms to <strong>curved surfaces</strong>. Used in sheet metal work, tailoring, and pipe measurement where rigid rulers cannot follow the contour.' },
    { title: 'Hook Rule', body: 'Has a small hook at the zero end for butting against an edge. This eliminates the <strong>end positioning error</strong> that occurs when trying to align a flat end with an edge by hand.' },
    { title: 'Shrink Rule', body: 'A specialised rule used in <strong>pattern making</strong> for metal casting. It is slightly longer than standard (built-in shrinkage allowance) to compensate for metal contraction as the casting cools.' }
  ],
  errors: [
    { title: 'Parallax Error', body: 'Reading the scale at an angle introduces <strong>parallax error</strong>. The apparent position of the graduation shifts relative to the workpiece edge. Always read from <strong>directly above</strong> the scale — perpendicular to the ruler surface.', note: 'Parallax is the #1 source of error with steel rulers.' },
    { title: 'End Wear Error', body: 'The zero end of a well-used ruler wears down, causing readings to be <strong>shorter than actual</strong>. Remedy: use the offset method (start from 10 mm, subtract 10) or periodically check the ruler against a calibrated reference.' },
    { title: 'Thermal Expansion', body: 'Steel expands with temperature. The coefficient of linear expansion for steel is approximately <code>11 × 10⁻⁶ /°C</code>. A 150 mm ruler at 40°C (vs 20°C standard) expands by about 0.033 mm — negligible for ruler precision but significant at micrometer level.' },
    { title: 'Cosine Error', body: 'If the ruler is <strong>tilted</strong> relative to the measurement axis, the reading will be longer than the actual dimension. The error equals <code>L × (1 − cos θ)</code> where θ is the tilt angle. Even 5° tilt on 100 mm adds ~0.38 mm error.' }
  ]
};

function renderExplore(cat) {
  const cards = EXPLORE[cat] || [];
  const container = $('explore-cards');
  container.innerHTML = '';
  cards.forEach(c => {
    const div = document.createElement('div');
    div.className = 'explore-card';
    div.innerHTML = '<div class="explore-card-title">' + c.title + '</div>' +
      '<div class="explore-card-body">' + c.body + '</div>' +
      (c.note ? '<div class="explore-card-note">' + c.note + '</div>' : '');
    container.appendChild(div);
  });
}

document.querySelectorAll('#explore-tabs .explore-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#explore-tabs .explore-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderExplore(btn.dataset.cat);
  });
});

// ── Pass A / B / C handlers ───────────────────────────────────────
function flashChip(el) {
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
}

// S-U — Units toggle (mm / cm / inch)
document.querySelectorAll('.unit-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    state.units = btn.dataset.unit;
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b === btn));
    render();
  });
});

// S-2 (Pass C) — Two-cursor toggle
$('opt-twocursor').addEventListener('click', function () {
  state.twoCursor = !state.twoCursor;
  this.setAttribute('aria-pressed', state.twoCursor ? 'true' : 'false');
  if (state.twoCursor) {
    // Default positions: 20 and 100 so the gap is obvious
    state.cursorMM  = 100;
    state.cursor2MM = 20;
  }
  render();
});

// S-8 — Snap to common sizes
$('opt-snap').addEventListener('click', function () {
  state.snapCommon = !state.snapCommon;
  this.setAttribute('aria-pressed', state.snapCommon ? 'true' : 'false');
  if (state.snapCommon && state.mode === 'free') {
    state.cursorMM = snapDist(state.cursorMM);
  }
  render();
});

// S-RB — Band toggle
$('opt-band').addEventListener('click', function () {
  state.readBand = !state.readBand;
  this.setAttribute('aria-pressed', state.readBand ? 'true' : 'false');
  render();
});

// S-13 — Worn-zero stepper
function setZeroError(v) {
  state.zeroError = Math.max(-2, Math.min(2, v | 0));
  const sign = state.zeroError > 0 ? '+' : state.zeroError < 0 ? '−' : '';
  $('opt-ze-val').textContent = sign + Math.abs(state.zeroError) + ' mm';
  render();
}
$('opt-ze-up').addEventListener('click', () => setZeroError(state.zeroError + 1));
$('opt-ze-dn').addEventListener('click', () => setZeroError(state.zeroError - 1));

// S-11 — Export PNG with watermark
$('opt-export').addEventListener('click', function () {
  const w = canvas.width, h = canvas.height;
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const octx = off.getContext('2d');
  octx.fillStyle = '#0d1117';
  octx.fillRect(0, 0, w, h);
  octx.drawImage(canvas, 0, 0);
  octx.font = '700 ' + (12 * DPR) + 'px "Helvetica Neue", Arial, sans-serif';
  octx.fillStyle = 'rgba(220, 230, 240, 0.55)';
  octx.textAlign = 'right';
  octx.textBaseline = 'bottom';
  const mm = measuredMM();
  octx.fillText('NHIT VisualLab  ·  Steel Ruler  ·  ' + mm + ' mm',
    w - 10 * DPR, h - 8 * DPR);
  const a = document.createElement('a');
  a.href = off.toDataURL('image/png');
  a.download = 'steel-ruler-' + mm + 'mm.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
});

// ── Pass B handlers ───────────────────────────────────────────────
function showStepsBanner(mode, construct) {
  const el = document.getElementById('steps-banner');
  if (!el) return;
  el.style.display = 'flex';
  const label = document.getElementById('step-3-label');
  if (construct) label.textContent = 'Drag bar end to target length';
  else if (mode === 'practice' || mode === 'quiz') label.textContent = 'Read at the bar’s right edge (mm)';
}
function hideStepsBanner() {
  const el = document.getElementById('steps-banner'); if (el) el.style.display = 'none';
}
function showScenarioBanner(s) {
  const el = document.getElementById('scenario-banner'); if (!el) return;
  el.style.display = 'flex';
  document.getElementById('scenario-label').textContent = s.label + ' (' + s.mm + ' mm)';
  document.getElementById('scenario-context').textContent = s.context;
}
function hideScenarioBanner() {
  const el = document.getElementById('scenario-banner'); if (el) el.style.display = 'none';
}

// Patch setMode to wire steps + scenarios banners
const _origSetMode = setMode;
setMode = function (mode) {
  _origSetMode(mode);
  hideStepsBanner();
  hideScenarioBanner();
  if (mode === 'practice' || mode === 'quiz') {
    showStepsBanner(mode, mode === 'quiz' && state.quizConstruct);
  }
};

// S-7 Scenarios toggle in Practice
$('btn-scenario').addEventListener('click', function () {
  state.scenarioMode = !state.scenarioMode;
  $('scenario-state').textContent = state.scenarioMode ? 'On' : 'Off';
  this.classList.toggle('btn-active', state.scenarioMode);
  if (state.mode === 'practice') newPractice();
});

// Patch newPractice to honor scenarios
const _origNewPractice = newPractice;
newPractice = function () {
  if (state.scenarioMode) {
    if (state.playing) stopAnim();
    const s = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    state.currentScenario = s;
    state.barMM = snapMM(s.mm);
    state.answered = false;
    state.scrollMM = 0;
    showScenarioBanner(s);
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    $('reading-cells').classList.add('cells-hidden');
    $('tr-formula').classList.add('formula-hidden');
    $('readout-display').style.display = 'none';
    $('practice-input').style.display  = 'block';
    $('practice-input').value          = '';
    $('dr-label').textContent          = 'Your Reading';
    $('btn-check').disabled = true;
    setTimeout(() => $('practice-input').focus(), 50);
    render();
  } else {
    hideScenarioBanner();
    state.currentScenario = null;
    _origNewPractice();
  }
};

// S-6 — Quiz mode toggle (Read vs Construct)
function setQuizConstruct(on) {
  state.quizConstruct = !!on;
  document.querySelectorAll('.qbar-mode-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.construct === String(state.quizConstruct))
  );
  if (state.mode === 'quiz') {
    showStepsBanner('quiz', state.quizConstruct);
    startQuiz();
  }
}
$('qm-read').addEventListener('click',  () => setQuizConstruct(false));
$('qm-build').addEventListener('click', () => setQuizConstruct(true));

// Patch showQuizQuestion for Construct mode
const _origShowQuizQuestion = showQuizQuestion;
showQuizQuestion = function (idx) {
  const target = state.quizQuestions[idx];
  if (state.quizConstruct) {
    state.barMM = BAR_MIN;
    state.quizAnswered = false;
    state.scrollMM = 0;
    $('quiz-q-num').textContent = idx + 1;
    $('quiz-feedback').textContent = ''; $('quiz-feedback').className = 'quiz-feedback';
    $('btn-quiz-submit').style.display = ''; $('btn-quiz-submit').disabled = false;
    $('btn-quiz-next').style.display = 'none';
    $('reading-cells').classList.add('cells-hidden');
    $('tr-formula').classList.add('formula-hidden');
    $('readout-display').textContent = target;
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent          = 'Target';
    $('qbar-hint').innerHTML = 'Drag the bar end to <strong>' + target + ' mm</strong>, then Submit';
    render();
  } else {
    $('qbar-hint').innerHTML = 'Read the ruler &middot; type mm value above&nbsp;&#8593;';
    _origShowQuizQuestion(idx);
  }
};

// Patch submitQuizAnswer for Construct
const _origSubmitQuizAnswer = submitQuizAnswer;
submitQuizAnswer = function () {
  if (!state.quizConstruct) { _origSubmitQuizAnswer(); return; }
  if (state.quizAnswered) return;
  const correct = state.quizQuestions[state.quizCurrent];
  const given   = state.barMM;
  const ok      = Math.abs(given - correct) <= CONSTRUCT_TOL;
  state.quizAnswers.push({ given, correct, ok });
  state.quizAnswered = true;
  state.barMM = correct;
  $('readout-display').textContent   = correct;
  $('readout-display').style.display = 'block';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('btn-quiz-submit').style.display = 'none';
  if (ok) {
    $('quiz-feedback').innerHTML = '✓ Correct! Within ±' + CONSTRUCT_TOL + ' mm';
    $('quiz-feedback').className = 'quiz-feedback ok';
    playSuccess();
  } else {
    $('quiz-feedback').innerHTML =
      '✗ You set ' + given + ' mm | Target: <strong>' + correct + ' mm</strong>';
    $('quiz-feedback').className = 'quiz-feedback err';
    playError();
  }
  const isLast = state.quizCurrent + 1 >= QUIZ_TOTAL;
  $('btn-quiz-next').innerHTML     = isLast ? '📊 Results' : 'Next →';
  $('btn-quiz-next').style.display = '';
  render();
};

// ── Boot ──────────────────────────────────────────────────────────
setMode('free');
})();
