// ════════════════════════════════════════════════════════════════════
//  Dial Gauge Simulator  —  app.js  v6
//  0–10.00 mm | LC = 0.01 mm | Revolution counter sub-dial 0–9
//  v3: slip-gauge practice/quiz  |  Set Zero = spindle → reference
//      clockwise rotation lifts spindle; sub-dial + main = total mm
//  v4: GUI spindle ▲▼ buttons (press-and-hold, touch-friendly)
//      doubled movement speed for all controls
//  v6: wrapped in IIFE (no leaked globals); live reading breakdown;
//      Runout (TIR) demo mode with rotating eccentric shaft
// ════════════════════════════════════════════════════════════════════
(function () {
'use strict';

// ── Instrument constants ──────────────────────────────────────────
const LC         = 1;        // 1 unit = 0.01 mm
const VAL_MIN    = 0;
const VAL_MAX    = 1000;     // 10.00 mm (integer hundredths)
const QUIZ_TOTAL = 5;

const MM_TO_UM  = 1000;
const MM_TO_IN  = 0.0393701;

// ── Canvas ────────────────────────────────────────────────────────
const CW = 520;
const CH = 590;
const CX = 260;
const CY = 222;

// ── Dial geometry ─────────────────────────────────────────────────
const R        = 192;
const FACE_R   = 174;
const TICK_OUT = 169;
const NUM_R    = 143;

// ── Sub-dial (revolution counter) ────────────────────────────────
const SD_CX   = CX - 63;
const SD_CY   = CY - 14;
const SD_FACE = 36;
const SD_LEN  = 25;

// ── Needle dimensions ─────────────────────────────────────────────
const MAIN_LEN  = 148;
const MAIN_TAIL = 28;

// ── Spindle geometry ──────────────────────────────────────────────
//   val = 0   → stem fully extended, tip rests ON reference surface
//   val = 1000 → stem fully compressed, tip 10 mm above reference
const BARREL_W   = 26;
const BARREL_H   = 26;
const STEM_W     = 13;
const STEM_H_MAX = 100;      // stem length at val = 0
const TIP_H      = 16;
const SPINDLE_Y0 = CY + R - 4;            // barrel top y
const BARREL_BOT = SPINDLE_Y0 + BARREL_H; // = 436
const REF_Y      = BARREL_BOT + STEM_H_MAX + TIP_H; // = 552  (fixed reference surface)
const PX_PER_UNIT = STEM_H_MAX / VAL_MAX;  // 0.1 px / hundredth = 10 px / mm

// ── Slip gauge range (practice & quiz) ───────────────────────────
const SLIP_MIN = 10;   // 0.10 mm
const SLIP_MAX = 300;  // 3.00 mm

// ── State ─────────────────────────────────────────────────────────
const state = {
  val          : 0,       // free-mode position in hundredths (0 = touching reference)
  animVal      : 0,       // currently rendered (animated) value
  mode         : 'free',
  dragging     : false,
  zoomOpen     : false,
  hinted       : false,
  // Practice
  targetVal    : 0,
  score        : 0, attempts : 0, answered : false,
  // Quiz
  quizQuestions: [], quizCurrent: 0, quizAnswers: [], quizAnswered: false,
  // Slip gauge — thickness in hundredths; 0 = none present
  slipThickness: 0,
  // Runout (TIR) demo
  runEcc     : 20,      // eccentricity in hundredths (0.20 mm) → TIR = 2·ecc
  runAngle   : 0,       // shaft rotation angle (rad)
  runSpinning: false,
  runMin     : null,    // observed min reading (hundredths)
  runMax     : null,    // observed max reading (hundredths)
};

// ── DOM ───────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('gauge-canvas');
const ctx    = canvas.getContext('2d');

// ── Hi-DPI backing store ──────────────────────────────────────────
// Draw in logical CW×CH; backing store is CW*DPR × CH*DPR so the vector dial,
// ticks, numerals and needles are razor-sharp on Retina. Pointer mapping
// (getCanvasXY) maps to this same logical space — keep them in lockstep.
let DPR = 1;
function setupCanvas() {
  DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width  = Math.round(CW * DPR);
  canvas.height = Math.round(CH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
setupCanvas();

// ── Math helpers ──────────────────────────────────────────────────
const snapVal = v  => Math.round(v / LC) * LC;
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** val → main needle angle (clockwise from top; one revolution = 1 mm). */
function valToMainAngle(val) {
  const pos = ((val % 100) + 100) % 100;   // 0–99 always positive
  return (270 + pos / 100 * 360) * Math.PI / 180;
}

/** val → sub-dial needle angle (full sweep 0→9 over 10 mm). */
function valToSubAngle(val) {
  return (270 + val / 1000 * 360) * Math.PI / 180;
}

/** Click/drag on dial face → updated val (keeps mm part, changes hundredths). */
function xyToVal(x, y) {
  const dx = x - CX, dy = y - CY;
  let deg = Math.atan2(dy, dx) * 180 / Math.PI;
  if (deg < 0) deg += 360;
  let fromTop = deg - 270;
  if (fromTop < 0) fromTop += 360;
  const hundredths = Math.round(fromTop / 360 * 100) % 100;
  const mmPart     = Math.floor(state.val / 100);
  return clamp(mmPart * 100 + hundredths, VAL_MIN, VAL_MAX);
}

// ── Gradient helper ───────────────────────────────────────────────
function hGrad(x0, x1, c0, c1, c2, c3, c4) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0,    c0);
  g.addColorStop(0.18, c1);
  g.addColorStop(0.50, c2);
  g.addColorStop(0.82, c3);
  g.addColorStop(1,    c4);
  return g;
}

// ── Animation engine ──────────────────────────────────────────────
let _animReq = null, _animFrom = 0, _animTo = 0, _animT0 = 0;
const ANIM_MS = 700;

function _easeInOut(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

function startAnim(toVal) {
  if (_animReq) cancelAnimationFrame(_animReq);
  _animFrom = state.animVal;
  _animTo   = clamp(toVal, VAL_MIN, VAL_MAX);
  _animT0   = performance.now();
  _animReq  = requestAnimationFrame(_animStep);
}

function _animStep(ts) {
  const t = Math.min((ts - _animT0) / ANIM_MS, 1);
  state.animVal = Math.round(_animFrom + (_animTo - _animFrom) * _easeInOut(t));
  _redrawOnly();
  if (t < 1) { _animReq = requestAnimationFrame(_animStep); }
  else        { state.animVal = _animTo; _animReq = null; render(); }
}

function _redrawOnly() {
  if (state.zoomOpen) drawZoomed(); else draw();
}

// ── Drawing — Reference surface ───────────────────────────────────
function drawReference() {
  const rw = 85;
  ctx.save();
  ctx.fillStyle = '#181c22';
  ctx.fillRect(CX - rw, REF_Y, rw * 2, CH - REF_Y);

  ctx.strokeStyle = 'rgba(95,105,120,0.50)';
  ctx.lineWidth   = 1;
  for (let x = CX - rw - 20; x <= CX + rw + 20; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x,      REF_Y);
    ctx.lineTo(x + 24, REF_Y + 24);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(CX - rw, REF_Y);
  ctx.lineTo(CX + rw, REF_Y);
  ctx.strokeStyle = '#aaaaaa';
  ctx.lineWidth   = 2.2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = 'bold 8.5px sans-serif';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#aaaaaa';
  ctx.fillText('REF', CX - rw - 5, REF_Y);
  ctx.restore();
}

// ── Drawing — Slip gauge plate ────────────────────────────────────
/**
 * Draws a precision slip gauge plate sitting on the reference surface.
 * The plate extends upward from REF_Y by (thickness × PX_PER_UNIT) px.
 * @param {number} thickness  Plate thickness in hundredths (same unit as val).
 */
function drawSlipGauge(thickness) {
  const hPx  = thickness * PX_PER_UNIT;          // actual height (matches spindle maths)
  const visH = Math.max(3, hPx);                  // visual min 3 px for sub-mm gauges
  const plateW = 70;
  const plateY = REF_Y - hPx;                     // true top of plate

  ctx.save();
  // Metallic body gradient (left → right highlight)
  const pg = ctx.createLinearGradient(CX - plateW / 2, 0, CX + plateW / 2, 0);
  pg.addColorStop(0,    '#2e3a48');
  pg.addColorStop(0.18, '#4e6878');
  pg.addColorStop(0.45, '#8faab8');
  pg.addColorStop(0.55, '#b0c8d8');
  pg.addColorStop(0.82, '#4e6878');
  pg.addColorStop(1,    '#2e3a48');
  ctx.fillStyle = pg;
  ctx.fillRect(CX - plateW / 2, plateY, plateW, visH);

  // Top surface highlight (precision ground finish)
  ctx.beginPath();
  ctx.moveTo(CX - plateW / 2, plateY);
  ctx.lineTo(CX + plateW / 2, plateY);
  ctx.strokeStyle = '#d4eaf5';
  ctx.lineWidth   = 1.8;
  ctx.stroke();

  // "SLIP GAUGE" label if plate is tall enough
  if (visH >= 12) {
    ctx.font         = `bold ${Math.min(8, visH * 0.6)}px sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(210,235,248,0.80)';
    ctx.fillText('SLIP GAUGE', CX, plateY + visH / 2);
  }
  ctx.restore();
}

// ── Drawing — Gap bracket ─────────────────────────────────────────
function drawGapIndicator(val) {
  const stemLen   = Math.max(0, STEM_H_MAX - val * PX_PER_UNIT);
  const tipBottom = BARREL_BOT + stemLen + TIP_H;
  const gapPx     = REF_Y - tipBottom;
  if (gapPx < 1) return;

  const xR  = CX + STEM_W / 2 + 12;
  const mid = tipBottom + gapPx / 2;

  ctx.save();
  ctx.strokeStyle = '#4fc3f7';
  ctx.fillStyle   = '#4fc3f7';
  ctx.lineWidth   = 1.3;

  // Top & bottom ticks
  ctx.beginPath(); ctx.moveTo(xR - 5, tipBottom); ctx.lineTo(xR + 5, tipBottom); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(xR - 5, REF_Y);     ctx.lineTo(xR + 5, REF_Y);     ctx.stroke();
  // Vertical connector
  ctx.beginPath(); ctx.moveTo(xR, tipBottom); ctx.lineTo(xR, REF_Y); ctx.stroke();

  // Arrow heads
  function arrowHead(ax, ay, dir) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 3, ay - dir * 6);
    ctx.lineTo(ax + 3, ay - dir * 6);
    ctx.closePath(); ctx.fill();
  }
  if (gapPx > 12) {
    arrowHead(xR, tipBottom + 2,  1);
    arrowHead(xR, REF_Y - 2,     -1);
  }

  // Label — hidden in practice/quiz to avoid giving away the answer
  if (state.mode === 'free') {
    ctx.font         = 'bold 10px sans-serif';
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText((val / 100).toFixed(2) + '\u00a0mm', xR + 9, mid);
  }
  ctx.restore();
}

// ── Drawing — Gauge body (bezel + face) ───────────────────────────
function drawGaugeBody() {
  // Drop shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.82)'; ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 12;
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a'; ctx.fill();
  ctx.restore();

  // Chrome bezel
  ctx.save();
  const bz = ctx.createLinearGradient(CX - R, CY - R, CX + R, CY + R);
  bz.addColorStop(0, '#e4e4e4'); bz.addColorStop(0.18, '#c8c8c8');
  bz.addColorStop(0.42, '#747474'); bz.addColorStop(0.55, '#484848');
  bz.addColorStop(0.72, '#bcbcbc'); bz.addColorStop(1, '#9c9c9c');
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2);
  ctx.fillStyle = bz; ctx.fill();
  ctx.restore();

  // Inner dark ring
  ctx.save();
  ctx.beginPath(); ctx.arc(CX, CY, FACE_R + 5, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(18,18,18,0.85)'; ctx.lineWidth = 10; ctx.stroke();
  ctx.restore();

  // Dial face
  ctx.save();
  const fg = ctx.createRadialGradient(CX - 20, CY - 16, 0, CX, CY, FACE_R);
  fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.70, '#f7f7f5'); fg.addColorStop(1, '#eaeae8');
  ctx.beginPath(); ctx.arc(CX, CY, FACE_R, 0, Math.PI * 2);
  ctx.fillStyle = fg; ctx.fill();
  ctx.restore();
}

// ── Drawing — Tick marks ──────────────────────────────────────────
function drawTicks() {
  ctx.save();
  for (let i = 0; i < 100; i++) {
    const ang     = (270 + i * 3.6) * Math.PI / 180;
    const isMajor = i % 10 === 0;
    const isMed   = !isMajor && i % 5 === 0;
    const len     = isMajor ? 18 : isMed ? 11 : 6;
    const lw      = isMajor ? 2.2 : isMed ? 1.4 : 0.85;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(CX + cos * TICK_OUT,         CY + sin * TICK_OUT);
    ctx.lineTo(CX + cos * (TICK_OUT - len), CY + sin * (TICK_OUT - len));
    ctx.strokeStyle = '#1c1c1c'; ctx.lineWidth = lw; ctx.stroke();
  }
  ctx.restore();
}

// ── Drawing — Scale numbers ───────────────────────────────────────
function drawNumbers() {
  ctx.save();
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#0f0f0f';
  for (let i = 0; i < 10; i++) {
    const ang = (270 + i * 36) * Math.PI / 180;
    ctx.fillText((i * 10).toString(), CX + Math.cos(ang) * NUM_R, CY + Math.sin(ang) * NUM_R);
  }
  ctx.restore();
  ctx.save();
  ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#777';
  ctx.fillText('0.01 mm', CX + 60, CY + 10);
  ctx.restore();
}

// ── Drawing — Sub-dial face ───────────────────────────────────────
function drawSubDial() {
  // Border ring
  ctx.save();
  ctx.beginPath(); ctx.arc(SD_CX, SD_CY, SD_FACE + 3.5, 0, Math.PI * 2);
  ctx.strokeStyle = '#888'; ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();

  // Face
  ctx.save();
  const sf = ctx.createRadialGradient(SD_CX - 7, SD_CY - 7, 0, SD_CX, SD_CY, SD_FACE);
  sf.addColorStop(0, '#f2f2f0'); sf.addColorStop(1, '#e2e2e0');
  ctx.beginPath(); ctx.arc(SD_CX, SD_CY, SD_FACE, 0, Math.PI * 2);
  ctx.fillStyle = sf; ctx.fill();
  ctx.restore();

  // Ticks (10 major + 10 half-way minor)
  ctx.save();
  for (let i = 0; i < 10; i++) {
    const a1 = (270 + i * 36)      * Math.PI / 180;
    const a2 = (270 + i * 36 + 18) * Math.PI / 180;
    for (const [a, len, lw, col] of [[a1, 7, 1.5, '#2a2a2a'], [a2, 4, 1.0, '#555']]) {
      const c = Math.cos(a), s = Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(SD_CX + c * SD_FACE,        SD_CY + s * SD_FACE);
      ctx.lineTo(SD_CX + c * (SD_FACE - len), SD_CY + s * (SD_FACE - len));
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    }
  }
  ctx.restore();

  // Numbers 0–9
  ctx.save();
  ctx.font = 'bold 8.5px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1a1a1a';
  const nr = SD_FACE - 13;
  for (let i = 0; i < 10; i++) {
    const ang = (270 + i * 36) * Math.PI / 180;
    ctx.fillText(i.toString(), SD_CX + Math.cos(ang) * nr, SD_CY + Math.sin(ang) * nr);
  }
  ctx.restore();
}

// ── Drawing — Sub-dial needle ─────────────────────────────────────
function drawSubNeedle(val) {
  ctx.save();
  ctx.beginPath(); ctx.arc(SD_CX, SD_CY, SD_FACE, 0, Math.PI * 2); ctx.clip();
  const ang = valToSubAngle(val);
  ctx.save();
  ctx.translate(SD_CX, SD_CY); ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(-9, 0); ctx.lineTo(-4, 1.3); ctx.lineTo(SD_LEN, 0.5);
  ctx.lineTo(SD_LEN, -0.5); ctx.lineTo(-4, -1.3); ctx.closePath();
  ctx.fillStyle = '#2c2c2c'; ctx.fill();
  ctx.restore(); ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(SD_CX, SD_CY, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#444'; ctx.fill();
  ctx.restore();
}

// ── Drawing — Main needle ─────────────────────────────────────────
function drawMainNeedle(val) {
  ctx.save();
  ctx.translate(CX, CY); ctx.rotate(valToMainAngle(val));
  ctx.shadowColor = 'rgba(0,0,0,0.42)'; ctx.shadowBlur = 7;
  ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
  ctx.beginPath();
  ctx.moveTo(-MAIN_TAIL,        0);
  ctx.lineTo(-MAIN_TAIL * 0.4,  3.8);
  ctx.lineTo( MAIN_LEN  * 0.48, 2.6);
  ctx.lineTo( MAIN_LEN,         0);
  ctx.lineTo( MAIN_LEN  * 0.48,-2.6);
  ctx.lineTo(-MAIN_TAIL * 0.4, -3.8);
  ctx.closePath();
  const ng = ctx.createLinearGradient(0, -4.5, 0, 4.5);
  ng.addColorStop(0, '#686868'); ng.addColorStop(0.38, '#242424'); ng.addColorStop(1, '#3c3c3c');
  ctx.fillStyle = ng; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.5; ctx.stroke();
  ctx.restore();
}

// ── Drawing — Centre pivot dot ────────────────────────────────────
function drawCentreDot() {
  ctx.save();
  const dg = ctx.createRadialGradient(CX - 2.5, CY - 2.5, 0, CX, CY, 9);
  dg.addColorStop(0, '#ff8a65'); dg.addColorStop(0.52, '#e64a19'); dg.addColorStop(1, '#bf360c');
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 1; ctx.shadowOffsetY = 2;
  ctx.beginPath(); ctx.arc(CX, CY, 9, 0, Math.PI * 2);
  ctx.fillStyle = dg; ctx.fill();
  ctx.beginPath(); ctx.arc(CX - 2, CY - 2, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,200,170,0.45)'; ctx.fill();
  ctx.restore();
}

// ── Drawing — Spindle (dynamic stem) ─────────────────────────────
function drawSpindle(val) {
  const compression = val * PX_PER_UNIT;
  const stemLen     = Math.max(0, STEM_H_MAX - compression);
  const stemTop     = BARREL_BOT;
  const stemBottom  = stemTop + stemLen;
  const tipY        = stemBottom;

  // Barrel (fixed)
  ctx.save();
  ctx.fillStyle = hGrad(CX - BARREL_W/2, CX + BARREL_W/2,
    '#585858', '#c0c0c0', '#e0e0e0', '#b8b8b8', '#585858');
  ctx.fillRect(CX - BARREL_W/2, SPINDLE_Y0, BARREL_W, BARREL_H);
  ctx.strokeStyle = '#484848'; ctx.lineWidth = 0.8;
  ctx.strokeRect(CX - BARREL_W/2, SPINDLE_Y0, BARREL_W, BARREL_H);
  ctx.restore();

  // Stem (variable length)
  if (stemLen > 0) {
    ctx.save();
    ctx.fillStyle = hGrad(CX - STEM_W/2, CX + STEM_W/2,
      '#686868', '#d0d0d0', '#eeeeee', '#d0d0d0', '#686868');
    ctx.fillRect(CX - STEM_W/2, stemTop, STEM_W, stemLen);
    ctx.strokeStyle = '#505050'; ctx.lineWidth = 0.8;
    ctx.strokeRect(CX - STEM_W/2, stemTop, STEM_W, stemLen);
    ctx.restore();
  }

  // Contact tip — glows orange when touching slip gauge
  const atContact = (state.slipThickness > 0 && val <= state.slipThickness + 1);
  ctx.save();
  const tg = ctx.createLinearGradient(CX - STEM_W/2, 0, CX + STEM_W/2, 0);
  if (atContact) {
    tg.addColorStop(0,   '#ff4500');
    tg.addColorStop(0.5, '#ff8c00');
    tg.addColorStop(1,   '#cc3a00');
    ctx.shadowColor = 'rgba(255,100,0,0.85)';
    ctx.shadowBlur  = 10;
  } else {
    tg.addColorStop(0,    '#8a5c10');
    tg.addColorStop(0.28, '#cc9820');
    tg.addColorStop(0.55, '#e8b838');
    tg.addColorStop(1,    '#966010');
  }
  ctx.beginPath();
  ctx.moveTo(CX - STEM_W/2, tipY);
  ctx.lineTo(CX,             tipY + TIP_H);
  ctx.lineTo(CX + STEM_W/2, tipY);
  ctx.closePath();
  ctx.fillStyle   = tg;
  ctx.fill();
  ctx.strokeStyle = atContact ? 'rgba(255,120,0,0.6)' : '#7a5010';
  ctx.lineWidth   = 0.8; ctx.stroke();
  ctx.restore();
}

// ── Drawing — LC badge (free mode) ───────────────────────────────
function drawBadge() {
  const txt = 'LC = 0.01 mm';
  ctx.save();
  ctx.font = 'bold 8.5pt sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(txt).width;
  const bx = 6, by = 5;
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  if (ctx.roundRect) ctx.roundRect(bx, by, tw + 12, 18, 4);
  else               ctx.rect(bx, by, tw + 12, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,229,255,0.52)'; ctx.lineWidth = 0.8; ctx.stroke();
  ctx.fillStyle   = '#00e5ff';
  ctx.fillText(txt, bx + 6, by + 9);
  ctx.restore();
}

// ── Drawing — Contact badge (practice/quiz) ───────────────────────
/** Green "✓ Contact!" badge when spindle tip is touching the slip gauge. */
function drawContactBadge() {
  const txt = '\u2713 Contact!  Read the gauge \u2192';
  ctx.save();
  ctx.font = 'bold 8.5pt sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const tw = ctx.measureText(txt).width;
  const bx = 6, by = CY + R + 8;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  if (ctx.roundRect) ctx.roundRect(bx, by, tw + 14, 20, 4);
  else               ctx.rect(bx, by, tw + 14, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(61,220,132,0.65)'; ctx.lineWidth = 0.9; ctx.stroke();
  ctx.fillStyle   = '#3ddc84';
  ctx.fillText(txt, bx + 7, by + 10);
  ctx.restore();
}

// ── Drawing — Runout demo: rotating eccentric shaft ───────────────
const SHAFT_R = 58;

/**
 * Draws a rotating cylindrical shaft (journal) whose top surface rests
 * exactly under the spindle tip. The journal's geometric centre bobs
 * vertically as the reading changes, while the true rotation axis (bore)
 * stays fixed — the offset between them IS the eccentricity `e`, so the
 * needle sweep = 2e = the Total Indicated Runout (TIR).
 */
function drawRunoutShaft(val) {
  const stemLen    = Math.max(0, STEM_H_MAX - val * PX_PER_UNIT);
  const tipBottom  = BARREL_BOT + stemLen + TIP_H;
  const centerY    = tipBottom + SHAFT_R;                 // journal geometric centre
  const ePx        = state.runEcc * PX_PER_UNIT;
  const axisY      = REF_Y - ePx + SHAFT_R;               // fixed rotation axis (mean centre)
  const phi        = state.runAngle;

  ctx.save();

  // V-block cradle beneath the shaft
  ctx.fillStyle = '#181c22';
  ctx.beginPath();
  ctx.moveTo(CX - 96, centerY + SHAFT_R + 40);
  ctx.lineTo(CX - 20, centerY + SHAFT_R + 40);
  ctx.lineTo(CX,      centerY + SHAFT_R - 4);
  ctx.lineTo(CX + 20, centerY + SHAFT_R + 40);
  ctx.lineTo(CX + 96, centerY + SHAFT_R + 40);
  ctx.lineTo(CX + 96, CH);
  ctx.lineTo(CX - 96, CH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(95,105,120,0.5)'; ctx.lineWidth = 1; ctx.stroke();

  // Journal body (steel)
  const bg = ctx.createRadialGradient(CX - 20, centerY - 22, 4, CX, centerY, SHAFT_R);
  bg.addColorStop(0, '#e8edf2'); bg.addColorStop(0.55, '#9fb0bd');
  bg.addColorStop(0.85, '#5d6b78'); bg.addColorStop(1, '#3a444e');
  ctx.beginPath(); ctx.arc(CX, centerY, SHAFT_R, 0, Math.PI * 2);
  ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = '#2a323b'; ctx.lineWidth = 1.6; ctx.stroke();

  // Rotating machined marks (keyway + spokes) about the true axis to show spin
  ctx.save();
  ctx.beginPath(); ctx.arc(CX, centerY, SHAFT_R - 3, 0, Math.PI * 2); ctx.clip();
  ctx.translate(CX, axisY);
  ctx.rotate(phi);
  // spokes
  ctx.strokeStyle = 'rgba(40,50,60,0.35)'; ctx.lineWidth = 1;
  for (let k = 0; k < 6; k++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -(SHAFT_R + ePx)); ctx.stroke();
  }
  // keyway slot
  ctx.fillStyle = '#20272e';
  ctx.fillRect(-4, -(SHAFT_R + ePx + 6), 8, 16);
  ctx.restore();

  // Bore / rotation axis (fixed) — a cross-hair on the mean centre
  ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(CX, axisY, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#2a323b'; ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,229,255,0.8)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(CX - 12, axisY); ctx.lineTo(CX + 12, axisY);
  ctx.moveTo(CX, axisY - 12); ctx.lineTo(CX, axisY + 12); ctx.stroke();

  // High-spot marker on the rim (rotates with the shaft)
  const hsx = CX + Math.cos(phi - Math.PI / 2) * (SHAFT_R - 8);
  const hsy = centerY + Math.sin(phi - Math.PI / 2) * (SHAFT_R - 8);
  ctx.beginPath(); ctx.arc(hsx, hsy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ff5252'; ctx.fill();

  // Eccentricity call-out between axis and geometric centre
  if (Math.abs(centerY - axisY) > 4) {
    ctx.strokeStyle = 'rgba(255,167,38,0.9)'; ctx.lineWidth = 1.4;
    ctx.setLineDash([3, 2]);
    ctx.beginPath(); ctx.moveTo(CX + 16, axisY); ctx.lineTo(CX + 16, centerY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 8.5px sans-serif'; ctx.fillStyle = '#ffa726';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('e', CX + 20, (axisY + centerY) / 2);
  }

  ctx.restore();
}

// ── Composite draw ────────────────────────────────────────────────
function drawContent() {
  const v = state.animVal;
  if (state.mode === 'runout') {
    drawRunoutShaft(v);
  } else {
    drawReference();
    if (state.slipThickness > 0) drawSlipGauge(state.slipThickness);
  }
  drawSpindle(v);
  drawGaugeBody();
  drawTicks();
  drawNumbers();
  drawSubDial();
  drawSubNeedle(v);
  drawMainNeedle(v);
  drawCentreDot();
  drawGapIndicator(v);
  if (state.mode === 'free') drawBadge();
  if (state.slipThickness > 0 && v <= state.slipThickness + 1) drawContactBadge();
}

// Studio background: vertical gradient + accent spotlight behind the dial so
// the gauge sits in a lit scene instead of floating on flat fill.
function drawSceneBackground() {
  const bg = ctx.createLinearGradient(0, 0, 0, CH);
  bg.addColorStop(0,    '#10151f');
  bg.addColorStop(0.55, '#0d1117');
  bg.addColorStop(1,    '#090c11');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CW, CH);

  const glow = ctx.createRadialGradient(CX, CY, 40, CX, CY, R * 1.8);
  glow.addColorStop(0, 'rgba(38,198,218,0.10)');
  glow.addColorStop(1, 'rgba(38,198,218,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CW, CH);
}

function draw() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawSceneBackground();
  drawContent();
}

function drawZoomed() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, CW, CH);
  const ZF = 2.4;
  ctx.save();
  ctx.scale(ZF, ZF);
  ctx.translate(-(CX - CW / (2 * ZF)), -(CY - CH / (2 * ZF)));
  drawContent();
  ctx.restore();
}

// ── Reading panel ─────────────────────────────────────────────────
function updateReadingPanel() {
  const v   = state.animVal;
  const mm  = v / 100;
  const um  = Math.round(mm * MM_TO_UM);
  const inc = mm * MM_TO_IN;

  $('mm-val').textContent = mm.toFixed(2);
  $('um-val').textContent = um;
  $('in-val').textContent = inc.toFixed(4);
  $('f-mm').textContent   = mm.toFixed(2);
  $('f-mm2').textContent  = mm.toFixed(2);
  $('f-um').textContent   = um;
  $('f-note').textContent =
    `Reading\u00a0=\u00a0${um}\u00a0\u03bcm\u00a0=\u00a0${inc.toFixed(4)}\u00a0inches`;
  $('readout-display').textContent = mm.toFixed(2);

  // Reading breakdown: whole mm (revolution counter) + main-dial divisions
  const whole = Math.floor(v / 100);       // complete revolutions = whole mm
  const div   = v % 100;                   // 0\u201399 divisions on the main dial
  $('rb-whole').textContent = whole;
  $('rb-div').textContent   = div;
  $('rb-total').textContent = mm.toFixed(2);
  // Breakdown follows the reading cells: hidden while a practice/quiz answer
  // is still being entered so it never reveals the target.
  $('reading-breakdown').classList.toggle('cells-hidden',
    $('reading-cells').classList.contains('cells-hidden'));
}

function render() { updateReadingPanel(); _redrawOnly(); positionSpindleBtns(); }

// ── Set Zero ──────────────────────────────────────────────────────
/**
 * Animates the spindle back to the reference surface (val = 0).
 * Both needles return to 0. Only active in free mode.
 */
function setZeroRef() {
  if (state.mode !== 'free') return;
  state.val = 0;
  startAnim(0);
}

// ── Runout (TIR) demo ─────────────────────────────────────────────
let _runReq = null, _runLastTs = 0;
const RUN_OMEGA = 1.15;   // shaft angular speed (rad/s) ≈ 5.5 s per revolution

/** reading (hundredths) for the current shaft angle: 0 → 2·ecc, TIR = 2·ecc. */
function runReadingFor(phi) {
  return Math.round(state.runEcc * (1 - Math.cos(phi)));
}

function applyRunAngle(phi) {
  state.runAngle = phi;
  const v = runReadingFor(phi);
  state.val = v; state.animVal = v;
  if (state.runMin === null || v < state.runMin) state.runMin = v;
  if (state.runMax === null || v > state.runMax) state.runMax = v;
}

function updateRunoutStats() {
  const fmt = h => (h / 100).toFixed(2);
  $('ro-min').textContent = state.runMin === null ? '—' : fmt(state.runMin) + ' mm';
  $('ro-max').textContent = state.runMax === null ? '—' : fmt(state.runMax) + ' mm';
  // TIR settles to 2·ecc once the shaft has completed at least half a turn
  const tir = (state.runMin !== null && state.runMax !== null)
    ? state.runMax - state.runMin : null;
  $('ro-tir').textContent = tir === null ? '—' : fmt(tir) + ' mm';
}

function _runStep(ts) {
  if (!state.runSpinning) { _runReq = null; return; }
  if (!_runLastTs) _runLastTs = ts;
  const dt = Math.min((ts - _runLastTs) / 1000, 0.05);   // clamp long frame gaps
  _runLastTs = ts;
  applyRunAngle(state.runAngle + RUN_OMEGA * dt);
  updateReadingPanel();
  updateRunoutStats();
  _redrawOnly();
  _runReq = requestAnimationFrame(_runStep);
}

function startRunout() {
  if (state.runSpinning) return;
  state.runSpinning = true;
  _runLastTs = 0;
  $('btn-run-play').innerHTML = '⏸︎  Pause';
  _runReq = requestAnimationFrame(_runStep);
}

function pauseRunout() {
  state.runSpinning = false;
  if (_runReq) { cancelAnimationFrame(_runReq); _runReq = null; }
  $('btn-run-play').innerHTML = '▶  Spin shaft';
}

function stopRunout() { pauseRunout(); }

function resetRunout() {
  pauseRunout();
  state.runAngle = 0;
  state.runMin = null; state.runMax = null;
  applyRunAngle(0);
  updateReadingPanel();
  updateRunoutStats();
  _redrawOnly();
}

// ── Mode management ───────────────────────────────────────────────
function setMode(mode) {
  stopRunout();
  state.mode = mode;
  canvas.style.cursor = 'default';   // grab affordance re-applied on hover in free mode
  $('practice-bar').style.display = 'none';
  $('quiz-bar').style.display     = 'none';
  $('quiz-result').style.display  = 'none';
  $('runout-bar').style.display   = 'none';
  $('spindle-btns').style.display = 'flex';   // hidden only in runout mode

  if (mode === 'practice') {
    $('btn-zero').disabled = true;
    $('practice-bar').style.display = '';
    state.score    = 0;
    state.attempts = 0;
    $('score').textContent    = '0';
    $('attempts').textContent = '0';
    newPractice();

  } else if (mode === 'quiz') {
    $('btn-zero').disabled = true;
    startQuiz();

  } else if (mode === 'runout') {
    // ── Runout / TIR demo ────────────────────────────────────────
    $('btn-zero').disabled = true;
    $('runout-bar').style.display = '';
    $('spindle-btns').style.display = 'none';
    state.slipThickness = 0;
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent          = 'Live Reading';
    $('reading-cells').classList.remove('cells-hidden');
    $('tr-formula').classList.remove('formula-hidden');
    $('drag-hint').textContent =
      'Spin the eccentric shaft — the needle sweeps min↔max · '
      + 'TIR = Max − Min = 2 × eccentricity';
    $('drag-hint').classList.remove('hidden');
    resetRunout();

  } else {
    // ── Free mode ────────────────────────────────────────────────
    $('btn-zero').disabled  = false;
    state.slipThickness     = 0;
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent          = 'Reading';
    $('reading-cells').classList.remove('cells-hidden');
    $('tr-formula').classList.remove('formula-hidden');
    $('drag-hint').textContent =
      'Grab\u00a0&\u00a0drag\u00a0the\u00a0needle\u00a0\u00a0|\u00a0\u00a0'
      + '\u25b2\u25bc\u00a0buttons\u00a0\u00a0|\u00a0\u00a0'
      + '\u2191\u2193\u00a0keys\u00a0\u00a0|\u00a0\u00a0'
      + 'X\u00a0=\u00a0Set\u00a0Zero';
    $('drag-hint').classList.remove('hidden');
    state.animVal = state.val;
    render();
  }
}

// ── Practice mode ─────────────────────────────────────────────────
function randomTargetVal() {
  // Uniform random slip gauge thickness: SLIP_MIN to SLIP_MAX in 0.01 mm steps
  const steps = Math.floor((SLIP_MAX - SLIP_MIN) / LC);
  return SLIP_MIN + Math.floor(Math.random() * (steps + 1)) * LC;
}

function newPractice() {
  state.answered      = false;
  state.targetVal     = randomTargetVal();
  state.slipThickness = state.targetVal;     // slip gauge thickness = measurement answer

  $('feedback').textContent = '';
  $('feedback').className   = 'feedback';
  $('reading-cells').classList.add('cells-hidden');
  $('reading-breakdown').classList.add('cells-hidden');  // never leak the answer
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('practice-input').value          = '';
  $('dr-label').textContent          = 'Your Reading';
  $('btn-check').disabled            = true;

  $('drag-hint').textContent =
    '\u25bc\u00a0button\u00a0or\u00a0\u2193\u00a0key\u00a0\u2014\u00a0'
    + 'lower\u00a0spindle\u00a0until\u00a0it\u00a0contacts\u00a0the\u00a0plate\u00a0'
    + '\u00b7\u00a0then\u00a0read\u00a0&\u00a0enter\u00a0mm';
  $('drag-hint').classList.remove('hidden');

  // Start spindle ABOVE the slip gauge so user must lower it to find contact
  const startPos = Math.min(state.slipThickness + 200, VAL_MAX);
  state.val = startPos;
  startAnim(startPos);

  setTimeout(() => $('practice-input').focus(), 50);
}

function checkAnswer() {
  if (state.answered) return;
  const raw = parseFloat($('practice-input').value);
  if (isNaN(raw)) {
    $('feedback').textContent = 'Enter a number first.';
    $('feedback').className   = 'feedback err';
    return;
  }

  state.attempts++;
  const correctMM = state.targetVal / 100;
  const ok        = Math.abs(raw - correctMM) < 0.005 + 0.0001;
  state.answered  = true;

  $('reading-cells').classList.remove('cells-hidden');
  $('reading-breakdown').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('readout-display').textContent   = correctMM.toFixed(2);
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Reading';
  $('btn-check').disabled            = true;

  // Animate spindle to the exact contact point (shows correct answer)
  state.val = state.targetVal;
  startAnim(state.targetVal);

  if (ok) {
    state.score++;
    $('feedback').innerHTML = `\u2713 Correct! &nbsp;<strong>${correctMM.toFixed(2)} mm</strong>`;
    $('feedback').className = 'feedback ok';
  } else {
    $('feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correctMM.toFixed(2)} mm</strong>`;
    $('feedback').className = 'feedback err';
  }
  $('score').textContent    = state.score;
  $('attempts').textContent = state.attempts;
}

// ── Quiz mode ─────────────────────────────────────────────────────
function startQuiz() {
  // Build pool, shuffle with crypto-quality randomness where available,
  // then slice to QUIZ_TOTAL — guarantees different values each time.
  const pool = [];
  for (let v = SLIP_MIN; v <= SLIP_MAX; v += LC) pool.push(v);

  // Fisher-Yates shuffle using Math.random (sufficient for educational use)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const shuffled = pool.slice(0, QUIZ_TOTAL);

  state.quizQuestions = shuffled;
  state.quizCurrent   = 0;
  state.quizAnswers   = [];
  state.quizAnswered  = false;

  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  $('quiz-q-total').textContent  = QUIZ_TOTAL;
  showQuizQuestion(0);
}

function showQuizQuestion(idx) {
  state.targetVal     = state.quizQuestions[idx];
  state.slipThickness = state.targetVal;
  state.quizAnswered  = false;

  $('quiz-q-num').textContent    = idx + 1;
  $('quiz-feedback').textContent = '';
  $('quiz-feedback').className   = 'quiz-feedback';
  $('btn-quiz-submit').style.display = '';
  $('btn-quiz-submit').disabled      = false;
  $('btn-quiz-next').style.display   = 'none';

  $('reading-cells').classList.add('cells-hidden');
  $('reading-breakdown').classList.add('cells-hidden');  // never leak the answer
  $('tr-formula').classList.add('formula-hidden');
  $('readout-display').style.display = 'none';
  $('practice-input').style.display  = 'block';
  $('practice-input').value          = '';
  $('dr-label').textContent          = 'Your Reading';

  $('drag-hint').textContent =
    '\u25bc\u00a0button\u00a0or\u00a0\u2193\u00a0key\u00a0\u2014\u00a0'
    + 'lower\u00a0spindle\u00a0until\u00a0it\u00a0contacts\u00a0the\u00a0plate\u00a0'
    + '\u00b7\u00a0then\u00a0read\u00a0&\u00a0enter\u00a0mm';
  $('drag-hint').classList.remove('hidden');

  // Start spindle above the slip gauge
  const startPos = Math.min(state.slipThickness + 200, VAL_MAX);
  state.val = startPos;
  startAnim(startPos);

  setTimeout(() => $('practice-input').focus(), 50);
}

function submitQuizAnswer() {
  if (state.quizAnswered) return;
  const raw = parseFloat($('practice-input').value);
  if (isNaN(raw)) {
    $('quiz-feedback').textContent = 'Enter a number first.';
    $('quiz-feedback').className   = 'quiz-feedback err';
    return;
  }

  const correctMM = state.quizQuestions[state.quizCurrent] / 100;
  const ok        = Math.abs(raw - correctMM) < 0.005 + 0.0001;
  state.quizAnswers.push({ given: raw, correct: correctMM, ok });
  state.quizAnswered = true;

  $('readout-display').textContent   = correctMM.toFixed(2);
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Reading';
  $('reading-cells').classList.remove('cells-hidden');
  $('reading-breakdown').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('btn-quiz-submit').style.display = 'none';

  // Animate to exact contact point
  state.val = state.targetVal;
  startAnim(state.targetVal);

  if (ok) {
    $('quiz-feedback').innerHTML = '\u2713 Correct!';
    $('quiz-feedback').className = 'quiz-feedback ok';
  } else {
    $('quiz-feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correctMM.toFixed(2)} mm</strong>`;
    $('quiz-feedback').className = 'quiz-feedback err';
  }

  const isLast = state.quizCurrent + 1 >= QUIZ_TOTAL;
  $('btn-quiz-next').innerHTML     = isLast ? '\uD83D\uDCCA\u00a0Results' : 'Next \u2192';
  $('btn-quiz-next').style.display = '';
}

function nextQuizQuestion() {
  state.quizCurrent++;
  if (state.quizCurrent >= QUIZ_TOTAL) showQuizResult();
  else showQuizQuestion(state.quizCurrent);
}

function showQuizResult() {
  $('quiz-bar').style.display    = 'none';
  $('quiz-result').style.display = '';
  state.slipThickness = 0;      // clear plate on result screen

  const score  = state.quizAnswers.filter(a => a.ok).length;
  const filled = n => '\u2605'.repeat(n) + '\u2606'.repeat(QUIZ_TOTAL - n);

  $('qr-score').textContent = `${score} / ${QUIZ_TOTAL}`;
  if (score === QUIZ_TOTAL) {
    $('qr-score').className = 'qr-score perfect';
    $('qr-stars').textContent = filled(QUIZ_TOTAL); $('qr-stars').style.color = 'var(--gold)';
    $('qr-verdict').textContent = 'Perfect score! \uD83C\uDFAF';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.8)) {
    $('qr-score').className = 'qr-score good';
    $('qr-stars').textContent = filled(score); $('qr-stars').style.color = 'var(--green)';
    $('qr-verdict').textContent = 'Great job! Almost perfect \uD83D\uDC4D';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.6)) {
    $('qr-score').className = 'qr-score good';
    $('qr-stars').textContent = filled(score); $('qr-stars').style.color = 'var(--green)';
    $('qr-verdict').textContent = 'Good effort! Keep practising \uD83D\uDCAA';
  } else if (score >= 1) {
    $('qr-score').className = 'qr-score poor';
    $('qr-stars').textContent = filled(score); $('qr-stars').style.color = '#ffb74d';
    $('qr-verdict').textContent = "Keep practising \u2014 you\u2019ll get it! \uD83D\uDCAA";
  } else {
    $('qr-score').className = 'qr-score poor';
    $('qr-stars').textContent = filled(0); $('qr-stars').style.color = 'var(--red)';
    $('qr-verdict').textContent = 'Try again \u2014 you can do it! \uD83D\uDCAA';
  }

  const rowsEl = $('qr-rows');
  rowsEl.innerHTML = '';
  state.quizAnswers.forEach((ans, i) => {
    const row = document.createElement('div');
    row.className = `qr-row ${ans.ok ? 'ok' : 'err'}`;
    row.innerHTML =
      `<span class="qr-qnum">Q${i + 1}</span>` +
      `<span class="qr-correct">Correct: <strong>${ans.correct.toFixed(2)} mm</strong></span>` +
      `<span class="qr-given">Your answer: <strong>${ans.given.toFixed(2)} mm</strong></span>` +
      `<span class="qr-mark">${ans.ok ? '\u2713' : '\u2717'}</span>`;
    rowsEl.appendChild(row);
  });

  $('readout-display').textContent   = (state.targetVal / 100).toFixed(2);
  $('readout-display').style.display = 'block';
  $('reading-cells').classList.remove('cells-hidden');
  $('reading-breakdown').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('dr-label').textContent = 'Reading';
}

// ── Pointer interaction (free mode only for click-drag) ───────────
function getCanvasXY(e) {
  const r  = canvas.getBoundingClientRect();
  const cx = e.clientX !== undefined ? e.clientX
           : (e.touches && e.touches.length) ? e.touches[0].clientX
           : e.changedTouches[0].clientX;
  const cy = e.clientY !== undefined ? e.clientY
           : (e.touches && e.touches.length) ? e.touches[0].clientY
           : e.changedTouches[0].clientY;
  // Map CSS px → logical canvas px (CW/CH). DPR is handled in setTransform,
  // so map against the LOGICAL size, not the device backing-store size.
  return {
    x: (cx - r.left) * (CW / r.width),
    y: (cy - r.top)  * (CH / r.height),
  };
}

function onPointerDown(e) {
  if (state.mode !== 'free' || state.zoomOpen) return;
  const { x, y } = getCanvasXY(e);
  /* Pick up (and block scroll) when the pointer is on the dial face. Anywhere
     off the face — the spindle, shaft or margins — passes through so the page
     can still scroll on touch. The needle then follows the pointer angle. */
  if (!overDialFace(x, y)) return;
  e.preventDefault();
  if (!state.hinted) { $('drag-hint').classList.add('hidden'); state.hinted = true; }
  state.dragging = true;
  canvas.style.cursor = 'grabbing';
  state.val = xyToVal(x, y);
  state.animVal = state.val;
  render();
}

function onPointerMove(e) {
  if (!state.dragging || state.mode !== 'free') return;
  const { x, y } = getCanvasXY(e);
  state.val = xyToVal(x, y);
  state.animVal = state.val;
  render();
  e.preventDefault();
}

function onPointerUp() {
  state.dragging = false;
  // Released over the dial face → back to the "grab" affordance; a stray
  // release elsewhere resets to default (the next hover refines it anyway).
  canvas.style.cursor = (state.mode === 'free' && !state.zoomOpen) ? 'grab' : 'default';
}

// ── Dial-face hit-testing & cursor affordance ─────────────────────
/** True when (x,y) in logical canvas space is over the round dial face. */
function overDialFace(x, y) {
  const dx = x - CX, dy = y - CY;
  return dx * dx + dy * dy <= FACE_R * FACE_R;
}

/** Hover handler: show the grab hand over the dial face in free mode. */
function updateHoverCursor(e) {
  if (state.dragging) return;                    // grabbing is set during a drag
  const draggable = state.mode === 'free' && !state.zoomOpen;
  const { x, y } = getCanvasXY(e);
  canvas.style.cursor = (draggable && overDialFace(x, y)) ? 'grab' : 'default';
}

// The mouse wheel is intentionally NOT captured: scrolling over the canvas
// scrolls the page. Move the spindle with the ▲▼ buttons, the arrow keys, or
// by grabbing and dragging the needle itself.

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
  if (e.key === 'x' || e.key === 'X') { setZeroRef(); return; }

  // Arrow keys: free mode for full range; practice/quiz clamped at slip gauge top
  if (state.mode !== 'free' && state.mode !== 'practice' && state.mode !== 'quiz') return;

  const step   = e.shiftKey ? 20 : 2 * LC;
  const minVal = (state.mode !== 'free') ? state.slipThickness : VAL_MIN;

  if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
    state.val     = clamp(snapVal(state.val + step), minVal, VAL_MAX);
    state.animVal = state.val;
    render(); e.preventDefault();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
    state.val     = clamp(snapVal(state.val - step), minVal, VAL_MAX);
    state.animVal = state.val;
    render(); e.preventDefault();
  }
}

// ── Event listeners ───────────────────────────────────────────────
canvas.addEventListener('mousedown',  onPointerDown);
canvas.addEventListener('mousemove',  updateHoverCursor);
canvas.addEventListener('mouseleave', function () {
  if (!state.dragging) canvas.style.cursor = 'default';
});
window.addEventListener('mousemove',  onPointerMove);
window.addEventListener('mouseup',    onPointerUp);
canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove',  onPointerMove, { passive: false });
canvas.addEventListener('touchend',   onPointerUp);
window.addEventListener('keydown',    onKeyDown);

document.querySelectorAll('#mode-tabs .pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#mode-tabs .pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    setMode(btn.dataset.value);
  });
});

$('btn-zoom').addEventListener('click', () => {
  state.zoomOpen = !state.zoomOpen;
  $('btn-zoom').classList.toggle('active', state.zoomOpen);
  render();
});

$('btn-zero').addEventListener('click', setZeroRef);

$('btn-new').addEventListener('click', newPractice);
$('btn-check').addEventListener('click', checkAnswer);
$('btn-quiz-submit').addEventListener('click', submitQuizAnswer);
$('btn-quiz-next').addEventListener('click', nextQuizQuestion);
$('btn-quiz-retry').addEventListener('click', () => {
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  startQuiz();
});

// ── Runout controls ──────────────────────────────────────────────
$('btn-run-play').addEventListener('click', () => {
  if (state.runSpinning) pauseRunout(); else startRunout();
});
$('btn-run-reset').addEventListener('click', resetRunout);
$('run-ecc').addEventListener('input', e => {
  state.runEcc = parseInt(e.target.value, 10) || 5;
  $('run-ecc-val').textContent = (state.runEcc / 100).toFixed(2) + ' mm';
  // Changing eccentricity invalidates the captured swing
  state.runMin = null; state.runMax = null;
  applyRunAngle(state.runAngle);
  updateReadingPanel();
  updateRunoutStats();
  _redrawOnly();
});

$('practice-input').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if      (state.mode === 'practice') checkAnswer();
  else if (state.mode === 'quiz')     submitQuizAnswer();
});
$('practice-input').addEventListener('input', () => {
  if (state.mode === 'practice' && !state.answered)
    $('btn-check').disabled = $('practice-input').value === '';
});

// ── Spindle button positioning ────────────────────────────────────
/**
 * Positions the #spindle-btns div precisely to the right of the spindle barrel,
 * accounting for the canvas's current rendered size (responsive scaling).
 */
function positionSpindleBtns() {
  const r    = canvas.getBoundingClientRect();
  const card = $('canvas-card').getBoundingClientRect();
  const btns = $('spindle-btns');
  if (!r.width || !card.width) return;

  const sx = r.width  / CW;   // CSS scale factor
  const sy = r.height / CH;

  // Position: right of spindle barrel + gap; vertically at barrel top
  const leftPx = (r.left - card.left) + (CX + BARREL_W / 2 + 44) * sx;
  const topPx  = (r.top  - card.top)  + SPINDLE_Y0 * sy;

  btns.style.left = leftPx + 'px';
  btns.style.top  = topPx  + 'px';
}

window.addEventListener('resize', function(){ setupCanvas(); render(); });
window.addEventListener('resize', positionSpindleBtns);

// ── Spindle GUI button press-and-hold logic ───────────────────────
/**
 * dir: +1 = raise spindle (val increases), -1 = lower spindle (val decreases).
 * Clamping mirrors the arrow-key logic exactly.
 */
let _spindleTimer = null;

function _doSpindleStep(dir) {
  if (state.mode !== 'free' && state.mode !== 'practice' && state.mode !== 'quiz') return;
  const minVal  = (state.mode !== 'free') ? state.slipThickness : VAL_MIN;
  state.val     = clamp(snapVal(state.val + dir * 2 * LC), minVal, VAL_MAX);
  state.animVal = state.val;
  render();
}

function _startSpindleRepeat(dir, e) {
  e.preventDefault();
  _stopSpindleRepeat();
  _doSpindleStep(dir);                                          // immediate first step
  _spindleTimer = setInterval(() => _doSpindleStep(dir), 50);  // then repeat every 50 ms
}

function _stopSpindleRepeat() {
  if (_spindleTimer) { clearInterval(_spindleTimer); _spindleTimer = null; }
}

['mousedown', 'touchstart'].forEach(ev => {
  $('btn-sp-up').addEventListener(ev,
    e => _startSpindleRepeat(+1, e), { passive: false });
  $('btn-sp-down').addEventListener(ev,
    e => _startSpindleRepeat(-1, e), { passive: false });
});
['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach(ev => {
  $('btn-sp-up').addEventListener(ev,   _stopSpindleRepeat);
  $('btn-sp-down').addEventListener(ev, _stopSpindleRepeat);
});

// ── Boot ──────────────────────────────────────────────────────────
setMode('free');
// Position spindle buttons once the layout has settled
setTimeout(positionSpindleBtns, 80);

})();
