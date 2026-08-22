(function () {
'use strict';
// ════════════════════════════════════════════════════════════════════
//  Protractor Simulator  —  app.js  v3
//  Vector-drawn semicircle protractor: 0°–180°, LC = 1°
//  Pixel-perfect ticks · DPR-aware · realistic plastic look
// ════════════════════════════════════════════════════════════════════

// ── Instrument constants ─────────────────────────────────────────
const LC        = 1;      // 1 degree least count
const MIN_DEG   = 0;
let   MAX_DEG   = 180;    // dynamic (180 semi, 359 full)
const QUIZ_TOTAL  = 5;
const ANIM_SPEED  = 25;   // degrees per second

// ── Canvas (logical pixels) ──────────────────────────────────────
const CW = 720;
let   CH = 380;
const DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));

// ── Protractor geometry (canvas pixels) — recomputed by layoutGeometry() ──
let PIVOT_X = CW / 2;
let PIVOT_Y = CH - 32;
let R_OUT       = 322;
let R_TICK_1    = R_OUT - 5;
let R_TICK_5    = R_OUT - 11;
let R_TICK_10   = R_OUT - 19;
let R_NUM_OUT   = R_OUT - 34;
let R_NUM_IN    = R_OUT - 58;
let R_INNER_ARC = R_NUM_IN - 18;
let ARM_LEN  = R_OUT - 4;
let FILL_R   = 108;

function layoutGeometry() {
  if (state.fullCircle) {
    CH      = 620;
    PIVOT_X = CW / 2;
    PIVOT_Y = CH / 2;
    R_OUT   = 285;
    FILL_R  = 100;
    MAX_DEG = 359;
  } else {
    CH      = 380;
    PIVOT_X = CW / 2;
    PIVOT_Y = CH - 32;
    R_OUT   = 322;
    FILL_R  = 108;
    MAX_DEG = 180;
  }
  R_TICK_1    = R_OUT - 5;
  R_TICK_5    = R_OUT - 11;
  R_TICK_10   = R_OUT - 19;
  R_NUM_OUT   = R_OUT - 34;
  R_NUM_IN    = R_OUT - 58;
  R_INNER_ARC = R_NUM_IN - 18;
  ARM_LEN     = R_OUT - 4;

  if (typeof canvas !== 'undefined' && canvas) {
    canvas.width  = CW * DPR;
    canvas.height = CH * DPR;
  }
}

// ── State ───────────────────────────────────────────────────────
const state = {
  angle: 45,
  prevAngle: 45,
  mode: 'free',
  dragging: false,
  zoomOpen: false,
  hinted: false,
  // Options (Pass A)
  snapCommon: false,           // L8 — snap to 0/15/30/45/60/90/120/135/150/180
  zeroError:  0,               // L13 — signed integer −5..+5 (degrees)
  dualArc:    true,            // L4 — always show both ANGLE and ALT arcs
  // Pass C
  fullCircle: false,           // L1 — semicircle 0-180° vs full circle 0-360°
  twoArm:     false,           // L2 — two draggable arms (baseline + measure)
  baseline:   0,               // L2 — baseline arm angle (drag-adjustable)
  dragArm:    'measure',       // L2 — which arm is currently being dragged
  // Practice
  score: 0, attempts: 0, answered: false,
  scenarioMode: false,        // L7 — when true, picks practice angles from SCENARIOS
  currentScenario: null,
  // Animation
  playing: false, animDir: 1, animLast: 0, animRaf: null,
  // Quiz
  quizQuestions: [], quizCurrent: 0, quizAnswers: [], quizAnswered: false,
  quizConstruct: false,       // L6 — reverse quiz: "Set the arm to X°"
  audioCtx: null,
};

// Common workshop / drawing angles for snap mode
const COMMON_ANGLES = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];

// L7 — Real-world angle scenarios (used in Practice "Scenarios" sub-mode)
const SCENARIOS = [
  { angle:  30, label: 'Standard chamfer angle',     context: 'A 30° chamfer is commonly used on shaft ends to ease assembly into bearings.' },
  { angle:  45, label: 'Mitre joint half-angle',     context: 'Two 45° cuts form a perfect 90° mitre joint in carpentry and picture-framing.' },
  { angle:  59, label: 'Twist-drill half-angle',     context: 'A standard twist drill has a 118° point angle — 59° each side from the axis.' },
  { angle:  60, label: 'Equilateral triangle',       context: 'All interior angles of an equilateral triangle are 60°. Used in structural trusses.' },
  { angle:  90, label: 'Right angle / squareness',   context: 'The fundamental reference in engineering — perpendicularity in joints, frames, walls.' },
  { angle: 120, label: 'Hexagonal nut interior',     context: 'Each interior angle of a regular hexagon is 120° — the geometry of every standard nut.' },
  { angle:  35, label: 'Typical roof pitch',         context: 'A 35° roof pitch is common in temperate climates — steep enough to shed snow, shallow enough to walk.' },
  { angle:  37, label: 'Staircase rise/run',         context: 'About 37° is the comfortable staircase angle — close to a 7-inch rise on an 11-inch run.' },
  { angle:  15, label: 'V-block half-angle',         context: 'A 90° V-block has 45° each side; a 30° V-block has 15° each side for fine shafts.' },
  { angle: 105, label: 'Sheet-metal bend angle',     context: 'Common in HVAC ductwork — a 105° bend opens the air path by 75° from flat.' },
];

// L6 — Reverse-quiz tolerance
const CONSTRUCT_TOL = 1.5;

// ── DOM ──────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('protractor-canvas');
const ctx    = canvas.getContext('2d');
// Backing store at device-pixel resolution; layoutGeometry sets actual size
layoutGeometry();

// ── Math helpers ─────────────────────────────────────────────────
const snapDeg  = d => Math.round(d / LC) * LC;
const clampDeg = d => Math.max(MIN_DEG, Math.min(MAX_DEG, d));

// Honors snap-to-common-angles toggle (L8)
function snapAngle(d) {
  if (state.snapCommon) {
    let best = COMMON_ANGLES[0], bd = Infinity;
    for (let i = 0; i < COMMON_ANGLES.length; i++) {
      const dd = Math.abs(COMMON_ANGLES[i] - d);
      if (dd < bd) { bd = dd; best = COMMON_ANGLES[i]; }
    }
    return best;
  }
  return snapDeg(d);
}

// Plays a soft tick whenever the displayed angle changes by 1° during drag (L16)
function tickIfChanged() {
  if (state.angle !== state.prevAngle) {
    state.prevAngle = state.angle;
    if (state.dragging) playTickSoft();
  }
}

// Arm tip in canvas coords for a given angle (degrees, 0 = right, CCW)
function armTip(deg) {
  const rad = deg * Math.PI / 180;
  return {
    x: PIVOT_X + ARM_LEN * Math.cos(rad),
    y: PIVOT_Y - ARM_LEN * Math.sin(rad),
  };
}

// Measured angle — in two-arm mode the angle BETWEEN arms (0–180)
function measuredAngle() {
  if (!state.twoArm) return state.angle;
  let d = ((state.angle - state.baseline) % 360 + 360) % 360;
  if (d > 180) d = 360 - d;
  return Math.round(d);
}

// Angle type classification
function angleType(deg) {
  if (deg === 0)   return { short: 'Zero',     name: 'Zero angle (0\u00b0)' };
  if (deg < 90)    return { short: 'Acute',    name: 'Acute angle (0\u00b0 < \u03b8 < 90\u00b0)' };
  if (deg === 90)  return { short: 'Right',    name: 'Right angle (\u03b8 = 90\u00b0)' };
  if (deg < 180)   return { short: 'Obtuse',   name: 'Obtuse angle (90\u00b0 < \u03b8 < 180\u00b0)' };
  if (deg === 180) return { short: 'Straight', name: 'Straight angle (\u03b8 = 180\u00b0)' };
  if (deg < 360)   return { short: 'Reflex',   name: 'Reflex angle (180\u00b0 < \u03b8 < 360\u00b0)' };
  return              { short: 'Full',      name: 'Full rotation (\u03b8 = 360\u00b0)' };
}

// ── Vector protractor pieces ─────────────────────────────────────

// Translucent yellow plastic body with drop shadow & top gloss
function drawProtractorBody() {
  ctx.save();

  // Soft drop shadow
  ctx.shadowColor   = 'rgba(15, 25, 45, 0.22)';
  ctx.shadowBlur    = 16;
  ctx.shadowOffsetY = 5;

  // Body fill — full circle or semicircle
  ctx.beginPath();
  if (state.fullCircle) {
    ctx.arc(PIVOT_X, PIVOT_Y, R_OUT, 0, Math.PI * 2, false);
  } else {
    ctx.moveTo(PIVOT_X - R_OUT, PIVOT_Y);
    ctx.arc(PIVOT_X, PIVOT_Y, R_OUT, Math.PI, 0, false);
    ctx.closePath();
  }

  const grad = ctx.createLinearGradient(0, PIVOT_Y - R_OUT, 0, PIVOT_Y);
  grad.addColorStop(0.00, 'rgba(255, 246, 214, 0.92)');
  grad.addColorStop(0.55, 'rgba(255, 233, 168, 0.82)');
  grad.addColorStop(1.00, 'rgba(248, 218, 142, 0.78)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Engraved outer rim (double-stroke for bevel feel)
  const rimStart = state.fullCircle ? 0           : Math.PI;
  const rimEnd   = state.fullCircle ? Math.PI * 2 : 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(PIVOT_X, PIVOT_Y, R_OUT - 1.2, rimStart, rimEnd, false);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(120, 85, 25, 0.65)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(PIVOT_X, PIVOT_Y, R_OUT, rimStart, rimEnd, false);
  ctx.stroke();

  // Engraved baseline (diameter — semicircle only)
  if (!state.fullCircle) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PIVOT_X - R_OUT, PIVOT_Y - 1);
    ctx.lineTo(PIVOT_X + R_OUT, PIVOT_Y - 1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(120, 85, 25, 0.7)';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(PIVOT_X - R_OUT, PIVOT_Y);
    ctx.lineTo(PIVOT_X + R_OUT, PIVOT_Y);
    ctx.stroke();
  }

  // Faint inner reference arc (decorative)
  ctx.strokeStyle = 'rgba(120, 85, 25, 0.28)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(PIVOT_X, PIVOT_Y, R_INNER_ARC, rimStart, rimEnd, false);
  ctx.stroke();

  // Top-left gloss highlight (radial, clipped to body)
  ctx.save();
  ctx.beginPath();
  if (state.fullCircle) {
    ctx.arc(PIVOT_X, PIVOT_Y, R_OUT - 2, 0, Math.PI * 2, false);
  } else {
    ctx.moveTo(PIVOT_X - R_OUT, PIVOT_Y);
    ctx.arc(PIVOT_X, PIVOT_Y, R_OUT - 2, Math.PI, 0, false);
    ctx.closePath();
  }
  ctx.clip();
  const gx = PIVOT_X - R_OUT * 0.42;
  const gy = PIVOT_Y - R_OUT * 0.62;
  const gloss = ctx.createRadialGradient(gx, gy, 6, gx, gy, R_OUT * 0.75);
  gloss.addColorStop(0.00, 'rgba(255, 255, 255, 0.55)');
  gloss.addColorStop(0.35, 'rgba(255, 255, 255, 0.18)');
  gloss.addColorStop(1.00, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gloss;
  ctx.fillRect(PIVOT_X - R_OUT, PIVOT_Y - R_OUT, R_OUT * 2, R_OUT);
  ctx.restore();

  ctx.restore();
}

// Draw a numeral rotated so its top points outward (radially)
function drawScaleNumber(value, rad, radius, fontSpec, color) {
  const x = PIVOT_X + radius * Math.cos(rad);
  const y = PIVOT_Y - radius * Math.sin(rad);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2 - rad);
  ctx.font = fontSpec;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Subtle white highlight then dark fill — engraved feel
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(String(value), 0.5, 0.5);
  ctx.fillStyle = color;
  ctx.fillText(String(value), 0, 0);
  ctx.restore();
}

// 1° tick marks (1°, 5°, 10° tiers) + numerals every 10°
function drawScales() {
  ctx.save();
  const full = state.fullCircle;
  const dMax = full ? 359 : 180;

  for (let d = 0; d <= dMax; d++) {
    const rad = d * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);

    let rIn, lw;
    if      (d % 10 === 0) { rIn = R_TICK_10; lw = 1.45; }
    else if (d % 5  === 0) { rIn = R_TICK_5;  lw = 1.10; }
    else                   { rIn = R_TICK_1;  lw = 0.75; }

    const x1 = PIVOT_X + R_OUT * cos;
    const y1 = PIVOT_Y - R_OUT * sin;
    const x2 = PIVOT_X + rIn   * cos;
    const y2 = PIVOT_Y - rIn   * sin;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = lw;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x1 + 0.55, y1 + 0.55);
    ctx.lineTo(x2 + 0.55, y2 + 0.55);
    ctx.stroke();

    ctx.strokeStyle = '#241a08';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Numerals every 10°
  if (full) {
    // Single scale 0..350 — full circle
    for (let d = 0; d < 360; d += 10) {
      const rad = d * Math.PI / 180;
      drawScaleNumber(d, rad, R_NUM_OUT,
        '700 12px "Helvetica Neue", Arial, sans-serif', '#1a1308');
    }
  } else {
    // Dual scale (outer red 180→0, inner black 0→180)
    for (let d = 0; d <= 180; d += 10) {
      const rad = d * Math.PI / 180;
      drawScaleNumber(180 - d, rad, R_NUM_OUT,
        '700 13px "Helvetica Neue", Arial, sans-serif', '#7a1818');
      drawScaleNumber(d, rad, R_NUM_IN,
        '700 12px "Helvetica Neue", Arial, sans-serif', '#1a1308');
    }
  }
  ctx.restore();
}

// Centre mark — crosshair + small ring around pivot (printed on body)
function drawCenterMark() {
  ctx.save();
  // Faint cream halo so the crosshair stays readable above body
  ctx.fillStyle = 'rgba(255, 250, 235, 0.78)';
  ctx.beginPath();
  if (state.fullCircle) ctx.arc(PIVOT_X, PIVOT_Y, 14, 0, Math.PI * 2);
  else                  ctx.arc(PIVOT_X, PIVOT_Y, 14, Math.PI, 0, false);
  ctx.fill();

  ctx.strokeStyle = 'rgba(40, 30, 12, 0.85)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PIVOT_X - 18, PIVOT_Y); ctx.lineTo(PIVOT_X - 6, PIVOT_Y);
  ctx.moveTo(PIVOT_X +  6, PIVOT_Y); ctx.lineTo(PIVOT_X + 18, PIVOT_Y);
  ctx.moveTo(PIVOT_X, PIVOT_Y - 18); ctx.lineTo(PIVOT_X, PIVOT_Y - 6);
  if (state.fullCircle) {
    ctx.moveTo(PIVOT_X, PIVOT_Y + 6); ctx.lineTo(PIVOT_X, PIVOT_Y + 18);
  }
  ctx.stroke();

  // Small reference ring
  ctx.beginPath();
  ctx.arc(PIVOT_X, PIVOT_Y, 5, 0, Math.PI * 2);
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.restore();
}

// Engraved brand mark on the body
function drawBrandMark() {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 10px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('NHIT VisualLab', PIVOT_X + 0.5, PIVOT_Y - 78 + 0.5);
  ctx.fillStyle = 'rgba(85, 58, 18, 0.7)';
  ctx.fillText('NHIT VisualLab', PIVOT_X, PIVOT_Y - 78);

  ctx.font = '600 8.5px "Helvetica Neue", Arial, sans-serif';
  ctx.fillStyle = 'rgba(85, 58, 18, 0.6)';
  ctx.fillText('PROTRACTOR · 0–180° · LC 1°', PIVOT_X, PIVOT_Y - 64);
  ctx.restore();
}

// ── Core drawing ─────────────────────────────────────────────────
function drawContent() {
  const deg = state.angle;
  const rad = deg * Math.PI / 180;
  const tip = armTip(deg);

  // 1. Protractor body (semicircular plastic disc)
  drawProtractorBody();

  // 2. Engraved tick scales + dual numerals
  drawScales();

  // 3. Brand mark engraved on body
  drawBrandMark();

  // 4. Centre mark — printed on body, under arm
  drawCenterMark();

  // 5a. Filled ANGLE sector
  const baseAngle = state.twoArm ? state.baseline : 0;
  const baseRadC  = -baseAngle * Math.PI / 180;
  const measRadC  = -deg * Math.PI / 180;
  let sectorDelta = measRadC - baseRadC;
  while (sectorDelta >  Math.PI) sectorDelta -= Math.PI * 2;
  while (sectorDelta <= -Math.PI) sectorDelta += Math.PI * 2;
  const displayedDeg = Math.round(Math.abs(sectorDelta) * 180 / Math.PI);

  if (displayedDeg > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(PIVOT_X, PIVOT_Y);
    ctx.arc(PIVOT_X, PIVOT_Y, FILL_R, baseRadC, measRadC, sectorDelta < 0);
    ctx.closePath();
    ctx.fillStyle = 'rgba(79, 142, 247, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(79, 142, 247, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 5b. Filled ALT sector (green, supplementary 180° − deg) — L4 (semicircle, single-arm only)
  if (state.dualArc && !state.fullCircle && !state.twoArm && deg < 180) {
    const altR = FILL_R * 0.78;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(PIVOT_X, PIVOT_Y);
    ctx.arc(PIVOT_X, PIVOT_Y, altR, -Math.PI, -(rad), false);
    ctx.closePath();
    ctx.fillStyle = 'rgba(76, 175, 80, 0.16)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(76, 175, 80, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ALT label inside green arc
    const showLabel = state.mode === 'free' ||
                      (state.mode === 'practice' && state.answered) ||
                      (state.mode === 'quiz' && state.quizAnswered);
    const altDeg = 180 - deg;
    if (altDeg >= 8 && showLabel) {
      const midRad = ((deg + 180) / 2) * Math.PI / 180;
      const lblR = altR * 0.62;
      const lx = PIVOT_X + lblR * Math.cos(midRad);
      const ly = PIVOT_Y - lblR * Math.sin(midRad);
      ctx.save();
      ctx.font = '700 11px "Helvetica Neue", Arial, sans-serif';
      ctx.fillStyle = '#1f5b21';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,255,255,0.9)';
      ctx.shadowBlur = 3;
      ctx.fillText(`${altDeg}°`, lx, ly);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  // 6. Baseline arm — solid in two-arm mode, dashed reference otherwise
  if (state.twoArm) {
    const bTip = armTip(state.baseline);
    ctx.save();
    ctx.strokeStyle = '#5e9ad9';
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(94,154,217,0.55)';
    ctx.shadowBlur = 7;
    ctx.beginPath();
    ctx.moveTo(PIVOT_X, PIVOT_Y);
    ctx.lineTo(bTip.x, bTip.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Small grip dot on baseline arm tip
    ctx.fillStyle = '#5e9ad9';
    ctx.beginPath();
    ctx.arc(bTip.x, bTip.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  } else if (!state.fullCircle) {
    ctx.save();
    ctx.strokeStyle = 'rgba(79,142,247,0.55)';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(PIVOT_X, PIVOT_Y);
    ctx.lineTo(PIVOT_X + FILL_R + 22, PIVOT_Y);
    ctx.stroke();
    ctx.restore();
  }

  // 4. Arm (bright gold line)
  ctx.save();
  ctx.strokeStyle = '#f5c842';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(245,200,66,0.6)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(PIVOT_X, PIVOT_Y);
  ctx.lineTo(tip.x, tip.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();

  // 5. Arrowhead at arm tip
  const arrowRad = Math.atan2(-(tip.y - PIVOT_Y), tip.x - PIVOT_X);
  const AS = 11;
  ctx.save();
  ctx.fillStyle = '#f5c842';
  ctx.shadowColor = 'rgba(245,200,66,0.6)';
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(
    tip.x - AS * Math.cos(arrowRad - 0.38),
    tip.y + AS * Math.sin(arrowRad - 0.38)
  );
  ctx.lineTo(
    tip.x - AS * Math.cos(arrowRad + 0.38),
    tip.y + AS * Math.sin(arrowRad + 0.38)
  );
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // 6. Pivot dot
  ctx.save();
  ctx.fillStyle = '#f5c842';
  ctx.shadowColor = 'rgba(245,200,66,0.8)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(PIVOT_X, PIVOT_Y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // 7. Angle arc label (halfway between 0° and deg) — hidden in practice/quiz until answered
  const showLabel = state.mode === 'free' ||
                    (state.mode === 'practice' && state.answered) ||
                    (state.mode === 'quiz' && state.quizAnswered);
  if (displayedDeg >= 5 && showLabel) {
    // Place label at the bisector of the actual sector
    const midRadC = baseRadC + sectorDelta / 2;
    const labelR = FILL_R * 0.58;
    const lx = PIVOT_X + labelR * Math.cos(midRadC);
    const ly = PIVOT_Y + labelR * Math.sin(midRadC);

    ctx.save();
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#1a2030';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.shadowBlur = 3;
    ctx.fillText(`${displayedDeg}\u00b0`, lx, ly);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // 8. LC badge (free mode only)
  if (state.mode === 'free') {
    const lcTxt = 'LC = 1\u00b0';
    ctx.save();
    ctx.font = 'bold 8.5pt sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    const tw = ctx.measureText(lcTxt).width;
    const bx = 18;
    const by = 14;
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    if (ctx.roundRect) ctx.roundRect(bx, by, tw + 12, 18, 4);
    else ctx.rect(bx, by, tw + 12, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,200,66,0.55)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.fillText(lcTxt, bx + tw / 2 + 6, by + 9);
    ctx.restore();
  }
}

function draw() {
  // Reset to identity then apply DPR — every render starts clean
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);
  drawContent();
}

function drawZoomed() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CW, CH);

  // Zoom 3× centred on arm tip (where it meets the scale)
  const ZF  = 3.0;
  const tip = armTip(state.angle);
  const cx  = tip.x - CW / (2 * ZF);
  const cy  = tip.y - CH / (2 * ZF);

  ctx.save();
  ctx.scale(ZF, ZF);
  ctx.translate(-cx, -cy);
  drawContent();
  ctx.restore();
}

// ── Reading panel ─────────────────────────────────────────────────
function updateReadingPanel() {
  const deg = measuredAngle();
  const alt = (state.fullCircle ? 360 : 180) - deg;
  const type = angleType(deg);
  const ze  = state.zeroError;
  const scaleReading = clampDeg(deg + ze);   // what the (mis-zeroed) scale shows

  // Reading cells
  if (ze === 0) {
    $('angle-val').textContent = deg;
  } else {
    $('angle-val').innerHTML = '<span style="opacity:.6">' + scaleReading +
      '</span> <span style="color:var(--accent);font-size:.7em">→ ' + deg + '</span>';
  }
  $('alt-val').textContent   = alt;
  $('type-val').textContent  = type.short;

  // Formula panel
  $('f-angle').textContent  = deg;
  $('f-angle2').textContent = deg;
  $('f-alt').textContent    = alt;
  $('f-type').textContent   = type.name;

  // Zero-error correction line (L13)
  let zeRow = document.getElementById('tr-ze');
  if (ze !== 0) {
    const sign = ze > 0 ? '+' : '−';
    const op   = ze > 0 ? '−' : '+';
    const html = 'Scale reads <strong>' + scaleReading + '°</strong>' +
                 ' &nbsp;|&nbsp; Zero error <strong>' + sign + Math.abs(ze) + '°</strong>' +
                 ' &nbsp;&rArr;&nbsp; True = ' + scaleReading + ' ' + op + ' ' + Math.abs(ze) +
                 ' = <strong>' + deg + '°</strong>';
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

  // In Construct quiz, readout-display shows the TARGET, not the live angle
  if (!(state.mode === 'quiz' && state.quizConstruct && !state.quizAnswered)) {
    $('readout-display').textContent = deg;
  }
  $('rb-angle').textContent = deg;
  $('rb-alt').textContent   = alt;
  $('rb-type').textContent  = type.short;
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
    const dt = (ts - state.animLast) / 1000;
    let next = state.angle + state.animDir * ANIM_SPEED * dt;
    if (next >= MAX_DEG) { next = MAX_DEG; state.animDir = -1; }
    if (next <= MIN_DEG) { next = MIN_DEG; state.animDir =  1; }
    state.angle = clampDeg(snapDeg(next));
  }
  state.animLast = ts;
  render();
  state.animRaf = requestAnimationFrame(animStep);
}

function startAnim() {
  if (state.animRaf) cancelAnimationFrame(state.animRaf);
  state.playing  = true;
  state.animLast = 0;
  state.angle    = 0;    // always start from 0°
  state.animDir  = 1;    // always sweep towards 180° first
  $('btn-play').innerHTML = '\u23F8\u23F8\u00a0 Pause';
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
  $('btn-play').innerHTML = '\u25B6\u00a0 Play';
  $('btn-play').classList.remove('playing');
  $('btn-check').disabled   = false;
  $('practice-input').value = '';
  $('practice-input').focus();
}

// ── Guided steps + scenarios helpers (Pass B) ─────────────────────
function showStepsBanner(mode, construct) {
  const el = document.getElementById('steps-banner');
  if (!el) return;
  el.style.display = 'flex';
  const label = document.getElementById('step-3-label');
  if (construct) {
    label.textContent = 'Drag the arm to the target angle';
  } else if (mode === 'practice' || mode === 'quiz') {
    label.textContent = 'Read where the arm crosses the scale';
  }
}
function hideStepsBanner() {
  const el = document.getElementById('steps-banner');
  if (el) el.style.display = 'none';
}
function showScenarioBanner(s) {
  const el = document.getElementById('scenario-banner');
  if (!el) return;
  el.style.display = 'flex';
  document.getElementById('scenario-label').textContent = s.label + ' (' + s.angle + '°)';
  document.getElementById('scenario-context').textContent = s.context;
}
function hideScenarioBanner() {
  const el = document.getElementById('scenario-banner');
  if (el) el.style.display = 'none';
}

// ── Mode management ───────────────────────────────────────────────
function setMode(mode) {
  if (state.playing) stopAnim();
  state.playing = false;
  if (state.animRaf) { cancelAnimationFrame(state.animRaf); state.animRaf = null; }

  state.mode = mode;
  $('practice-bar').style.display = 'none';
  $('quiz-bar').style.display     = 'none';
  $('quiz-result').style.display  = 'none';
  $('sec-explore').style.display  = 'none';
  $('canvas-card').style.cursor   = 'crosshair';
  $('canvas-card').style.display  = '';
  hideStepsBanner();
  hideScenarioBanner();
  if (mode === 'practice' || mode === 'quiz') showStepsBanner(mode, mode === 'quiz' && state.quizConstruct);

  // Show badges only in free mode
  $('readout-badges').style.display = mode === 'free' ? '' : 'none';

  if (mode === 'explore') {
    $('sec-explore').style.display = '';
    $('canvas-card').style.display = 'none';
    document.querySelector('.info-row').style.display = 'none';
    renderExplore('basics');
    document.querySelectorAll('#explore-tabs .explore-tab').forEach(function(b) { b.classList.remove('active'); });
    document.querySelector('#explore-tabs .explore-tab[data-cat="basics"]').classList.add('active');
  } else if (mode === 'practice') {
    document.querySelector('.info-row').style.display = '';
    $('practice-bar').style.display = '';
    state.score    = 0;
    state.attempts = 0;
    $('score').textContent    = '0';
    $('attempts').textContent = '0';
    newPractice();
  } else if (mode === 'quiz') {
    document.querySelector('.info-row').style.display = '';
    startQuiz();
  } else {
    // Free mode
    document.querySelector('.info-row').style.display = '';
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent = 'Angle';
    $('reading-cells').classList.remove('cells-hidden');
    $('tr-formula').classList.remove('formula-hidden');
    render();
  }
}

// ── Practice mode ─────────────────────────────────────────────────
function newPractice() {
  if (state.playing) stopAnim();

  if (state.scenarioMode) {
    // L7 — pick from real-world scenarios
    const s = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
    state.currentScenario = s;
    state.angle = s.angle;
    showScenarioBanner(s);
  } else {
    state.currentScenario = null;
    hideScenarioBanner();
    // Pick a "nice" random angle: multiples of 5 in 10°–170° range
    const choices = [];
    for (let d = 10; d <= 170; d += 5) choices.push(d);
    for (let d = 13; d <= 167; d += 7) choices.push(d);
    state.angle = choices[Math.floor(Math.random() * choices.length)];
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
  $('btn-play').innerHTML            = '\u25B6\u00a0 Play';
  $('btn-play').classList.remove('playing');
  $('btn-check').disabled = false;

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
  const correct = state.angle;
  const ok      = Math.abs(input - correct) <= LC / 2 + 1e-9;  // within ±0.5°
  state.answered = true;

  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('readout-display').textContent   = correct;
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Angle';
  $('btn-check').disabled            = true;

  if (ok) {
    state.score++;
    $('feedback').innerHTML = `\u2713 Correct! &nbsp;<strong>${correct}\u00b0</strong>`;
    $('feedback').className = 'feedback ok';
    playSuccess();
  } else {
    $('feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correct}\u00b0</strong>`;
    $('feedback').className = 'feedback err';
    playError();
  }
  $('score').textContent    = state.score;
  $('attempts').textContent = state.attempts;
  render();
}

// ── Quiz mode ─────────────────────────────────────────────────────
function startQuiz() {
  // Generate QUIZ_TOTAL distinct angles, mixed across range
  const used = new Set();
  while (used.size < QUIZ_TOTAL) {
    // angles: multiples of 5 in 15-165, plus some random 1-degree values
    const pool = [15,25,30,35,40,45,50,55,60,65,70,75,80,85,90,
                  95,100,105,110,115,120,125,130,135,140,145,150,155,165,
                  22,37,53,67,83,97,113,127,143,158];
    used.add(pool[Math.floor(Math.random() * pool.length)]);
  }
  state.quizQuestions = [...used];
  state.quizCurrent   = 0;
  state.quizAnswers   = [];
  state.quizAnswered  = false;
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display    = '';
  $('quiz-q-total').textContent  = QUIZ_TOTAL;
  showQuizQuestion(0);
}

function showQuizQuestion(idx) {
  const target = state.quizQuestions[idx];
  state.quizAnswered = false;
  $('quiz-q-num').textContent    = idx + 1;
  $('quiz-feedback').textContent = '';
  $('quiz-feedback').className   = 'quiz-feedback';
  $('btn-quiz-submit').style.display = '';
  $('btn-quiz-submit').disabled      = false;
  $('btn-quiz-next').style.display   = 'none';
  $('reading-cells').classList.add('cells-hidden');
  $('tr-formula').classList.add('formula-hidden');

  if (state.quizConstruct) {
    // L6 — Construct: show target, user drags arm; start arm at 0°
    state.angle = 0;
    $('readout-display').textContent   = target;
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent          = 'Target';
    $('qbar-hint').innerHTML = 'Drag the arm to <strong>' + target + '&deg;</strong>, then Submit';
  } else {
    state.angle = target;
    $('readout-display').style.display = 'none';
    $('practice-input').style.display  = 'block';
    $('practice-input').value          = '';
    $('dr-label').textContent          = 'Your Reading';
    $('qbar-hint').innerHTML = 'Read the protractor &middot; type your answer above&nbsp;&#8593;';
    setTimeout(() => $('practice-input').focus(), 50);
  }
  render();
}

function submitQuizAnswer() {
  if (state.quizAnswered) return;
  const correct = state.quizQuestions[state.quizCurrent];
  let input, ok;

  if (state.quizConstruct) {
    // L6 — user constructed via dragging; arm position is the answer
    input = state.angle;
    ok    = Math.abs(input - correct) <= CONSTRUCT_TOL;
    // After grading, snap the arm to the correct angle for visual confirmation
    state.angle = correct;
  } else {
    input = parseFloat($('practice-input').value);
    if (isNaN(input)) {
      $('quiz-feedback').textContent = 'Enter a number first.';
      $('quiz-feedback').className   = 'quiz-feedback err';
      return;
    }
    ok = Math.abs(input - correct) <= LC / 2 + 1e-9;
  }
  state.quizAnswers.push({ given: input, correct, ok });
  state.quizAnswered = true;

  $('readout-display').textContent   = correct;
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Angle';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('btn-quiz-submit').style.display = 'none';

  if (ok) {
    $('quiz-feedback').innerHTML = '\u2713 Correct!';
    $('quiz-feedback').className = 'quiz-feedback ok';
    playSuccess();
  } else {
    $('quiz-feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correct}\u00b0</strong>`;
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

  const score     = state.quizAnswers.filter(a => a.ok).length;
  const filled    = n => '\u2605'.repeat(n) + '\u2606'.repeat(QUIZ_TOTAL - n);
  const scoreEl   = $('qr-score');
  const starsEl   = $('qr-stars');
  const verdictEl = $('qr-verdict');
  scoreEl.textContent = `${score} / ${QUIZ_TOTAL}`;

  if (score === QUIZ_TOTAL) {
    scoreEl.className   = 'qr-score perfect';
    starsEl.textContent = filled(QUIZ_TOTAL);
    starsEl.style.color = 'var(--gold)';
    verdictEl.textContent = 'Perfect score! \uD83C\uDFAF';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.8)) {
    scoreEl.className   = 'qr-score good';
    starsEl.textContent = filled(score);
    starsEl.style.color = 'var(--green)';
    verdictEl.textContent = 'Great job! Almost perfect \uD83D\uDC4D';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.6)) {
    scoreEl.className   = 'qr-score good';
    starsEl.textContent = filled(score);
    starsEl.style.color = 'var(--green)';
    verdictEl.textContent = 'Good effort! Keep practising \uD83D\uDCAA';
  } else if (score >= 1) {
    scoreEl.className   = 'qr-score poor';
    starsEl.textContent = filled(score);
    starsEl.style.color = '#ffb74d';
    verdictEl.textContent = "Keep practising \u2014 you'll get it! \uD83D\uDCAA";
  } else {
    scoreEl.className   = 'qr-score poor';
    starsEl.textContent = filled(0);
    starsEl.style.color = 'var(--red)';
    verdictEl.textContent = 'Try again \u2014 you can do it! \uD83D\uDCAA';
  }

  const rowsEl = $('qr-rows');
  rowsEl.innerHTML = '';
  state.quizAnswers.forEach((ans, i) => {
    const row = document.createElement('div');
    row.className = `qr-row ${ans.ok ? 'ok' : 'err'}`;
    row.innerHTML =
      `<span class="qr-qnum">Q${i + 1}</span>` +
      `<span class="qr-correct">Correct: <strong>${ans.correct}\u00b0</strong></span>` +
      `<span class="qr-given">Your answer: <strong>${ans.given}\u00b0</strong></span>` +
      `<span class="qr-mark">${ans.ok ? '\u2713' : '\u2717'}</span>`;
    rowsEl.appendChild(row);
  });

  $('readout-display').textContent   = state.angle;
  $('readout-display').style.display = 'block';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('dr-label').textContent = 'Angle';
}

// ── Drag / interaction helpers ────────────────────────────────────
function getCanvasPos(e) {
  const r  = canvas.getBoundingClientRect();
  const cx = e.clientX !== undefined ? e.clientX
           : e.touches && e.touches.length ? e.touches[0].clientX
           : e.changedTouches[0].clientX;
  const cy = e.clientY !== undefined ? e.clientY
           : e.touches && e.touches.length ? e.touches[0].clientY
           : e.changedTouches[0].clientY;
  // Map CSS pixels → logical canvas pixels (DPR is handled in setTransform)
  const scaleX = CW / r.width;
  const scaleY = CH / r.height;
  return { x: (cx - r.left) * scaleX, y: (cy - r.top) * scaleY };
}

function angleFromPos(x, y) {
  const dx = x - PIVOT_X;
  const dy = PIVOT_Y - y;
  let deg = Math.atan2(dy, dx) * 180 / Math.PI;
  if (state.fullCircle) {
    if (deg < 0) deg += 360;
    return snapAngle(deg) % 360;
  }
  if (dy < -10) return dx >= 0 ? 0 : 180;   // semicircle: clicked below baseline
  return clampDeg(snapAngle(deg));
}

function onPointerDown(e) {
  if (state.mode === 'practice') return;
  if (state.mode === 'quiz' && !state.quizConstruct) return;
  if (state.mode === 'quiz' && state.quizAnswered) return;
  if (state.zoomOpen) return;
  const pos = getCanvasPos(e);
  if (!state.fullCircle && pos.y > PIVOT_Y + 30) return;
  e.preventDefault();
  state.dragging = true;
  if (!state.hinted) { $('drag-hint').classList.add('hidden'); state.hinted = true; }

  const clickDeg = angleFromPos(pos.x, pos.y);
  if (state.twoArm) {
    // Choose the arm closer to the click (modular distance)
    const dM = Math.min(Math.abs(clickDeg - state.angle),    360 - Math.abs(clickDeg - state.angle));
    const dB = Math.min(Math.abs(clickDeg - state.baseline), 360 - Math.abs(clickDeg - state.baseline));
    state.dragArm = (dB < dM) ? 'baseline' : 'measure';
    if (state.dragArm === 'baseline') state.baseline = clickDeg;
    else                              state.angle    = clickDeg;
  } else {
    state.dragArm = 'measure';
    state.angle = clickDeg;
  }
  playClick();
  render();
}

function onPointerMove(e) {
  if (!state.dragging) return;
  const pos = getCanvasPos(e);
  const deg = angleFromPos(pos.x, pos.y);
  if (state.twoArm && state.dragArm === 'baseline') state.baseline = deg;
  else                                              state.angle    = deg;
  tickIfChanged();
  render();
  e.preventDefault();
}

function onPointerUp() { state.dragging = false; }

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
    render();
    return;
  }
  if (state.mode !== 'free') return;

  // L10 — keyboard precision: arrows 1° (Shift 5°), PgUp/PgDn 10°
  let step = LC;
  if (e.shiftKey) step = 5;
  if (e.key === 'PageUp' || e.key === 'PageDown') step = 10;

  if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') {
    state.angle = clampDeg(snapDeg(state.angle + step));
    tickIfChanged(); render(); e.preventDefault();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'PageDown') {
    state.angle = clampDeg(snapDeg(state.angle - step));
    tickIfChanged(); render(); e.preventDefault();
  } else if (e.key === 'Home') {
    state.angle = 0; tickIfChanged(); render(); e.preventDefault();
  } else if (e.key === 'End') {
    state.angle = 180; tickIfChanged(); render(); e.preventDefault();
  }
}

// ── Event listeners ───────────────────────────────────────────────
canvas.addEventListener('mousedown',  onPointerDown);
window.addEventListener('mousemove',  onPointerMove);
window.addEventListener('mouseup',    onPointerUp);
canvas.addEventListener('touchstart', onPointerDown, { passive: false });
canvas.addEventListener('touchmove',  onPointerMove,  { passive: false });
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

// Zoom
$('btn-zoom').addEventListener('click', () => {
  state.zoomOpen = !state.zoomOpen;
  $('btn-zoom').classList.toggle('active', state.zoomOpen);
  render();
});

// Practice
$('btn-play').addEventListener('click', () => {
  if (state.playing) stopAnim();
  else               startAnim();
});
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

// Input: Enter submits; enable Check when value present
$('practice-input').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if      (state.mode === 'practice') checkAnswer();
  else if (state.mode === 'quiz')     submitQuizAnswer();
});
$('practice-input').addEventListener('input', () => {
  if (state.mode === 'practice' && !state.playing && !state.answered) {
    $('btn-check').disabled = $('practice-input').value === '';
  }
});

// ── Sound feedback ────────────────────────────────────────────────
function getAudioCtx() {
  if (!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return state.audioCtx;
}
function playTone(freq, dur, type, vol) {
  try {
    var c = getAudioCtx(), o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch (e) { /* silent */ }
}
function playClick()    { playTone(800, 0.05, 'square', 0.04); }
function playTickSoft() { playTone(1400, 0.018, 'square', 0.018); }  // L16 — degree-snap tick
function playSuccess()  { playTone(880, 0.12, 'sine', 0.1); setTimeout(function() { playTone(1100, 0.15, 'sine', 0.1); }, 120); }
function playError()    { playTone(300, 0.2, 'sawtooth', 0.06); }

// ── Explore mode ──────────────────────────────────────────────────
var EXPLORE = {
  basics: [
    { title: 'What is a Protractor?', body: 'A <strong>protractor</strong> is a semicircular or circular instrument used to measure and lay out angles. The most common type is the <strong>semicircular (180\u00b0) protractor</strong> made from transparent plastic or steel. It has two scales (inner and outer) reading in opposite directions.', note: 'The protractor is the fundamental angle-measuring tool in every workshop and drawing office.' },
    { title: 'Least Count (LC)', body: 'The <strong>least count</strong> of a standard protractor is <code>1\u00b0</code>. This means the smallest angle change you can read directly is 1 degree. For finer precision, a bevel protractor with a vernier scale reads to <code>5\u2032</code> (5 arcminutes = 1/12 of a degree).', note: 'LC = 1\u00b0 \u2014 you cannot read fractions of a degree on a standard protractor.' },
    { title: 'Inner vs Outer Scale', body: 'A protractor has two concentric scales reading in opposite directions:<br><strong>Inner scale:</strong> reads left-to-right, 0\u00b0 to 180\u00b0<br><strong>Outer scale:</strong> reads right-to-left, 180\u00b0 to 0\u00b0<br>The two readings always sum to 180\u00b0. Choose the scale whose 0\u00b0 aligns with your baseline.' },
    { title: 'How to Read a Protractor', body: '<strong>Step 1:</strong> Place the centre mark on the angle vertex.<br><strong>Step 2:</strong> Align the baseline (0\u00b0 line) with one arm of the angle.<br><strong>Step 3:</strong> Read the degree value where the second arm crosses the scale. Always confirm which scale (inner/outer) is correct for your baseline alignment.' }
  ],
  types: [
    { title: 'Acute Angle (0\u00b0 < \u03b8 < 90\u00b0)', body: 'An <strong>acute angle</strong> is any angle greater than 0\u00b0 but less than 90\u00b0. Examples in engineering: chamfer angles (typically 30\u00b0 or 45\u00b0), drill point angles (59\u00b0 half-angle for a standard 118\u00b0 drill), V-block half-angles.' },
    { title: 'Right Angle (\u03b8 = 90\u00b0)', body: 'A <strong>right angle</strong> is exactly 90\u00b0. It is the most important reference angle in engineering \u2014 perpendicularity, squareness, and T-joints all depend on accurate 90\u00b0 measurement. In drawings, a right angle is indicated by a small square symbol.' },
    { title: 'Obtuse Angle (90\u00b0 < \u03b8 < 180\u00b0)', body: 'An <strong>obtuse angle</strong> is greater than 90\u00b0 but less than 180\u00b0. Common in sheet metal bending: a 120\u00b0 bend angle means the metal opens to 120\u00b0 from the flat reference.' },
    { title: 'Supplementary & Complementary', body: 'Two angles are <strong>supplementary</strong> if they sum to 180\u00b0 (e.g., 60\u00b0 + 120\u00b0). Two angles are <strong>complementary</strong> if they sum to 90\u00b0 (e.g., 30\u00b0 + 60\u00b0). The inner and outer scale readings on a protractor are always supplementary.', note: 'Supplementary: \u03b1 + \u03b2 = 180\u00b0 \u2014 Complementary: \u03b1 + \u03b2 = 90\u00b0' }
  ],
  instruments: [
    { title: 'Simple Protractor', body: 'The standard <strong>semicircular protractor</strong> measures 0\u00b0\u2013180\u00b0 with 1\u00b0 LC. Made from transparent plastic (for drawing) or stainless steel (for workshop use). Best for layout work, marking angles, and rough measurement.' },
    { title: 'Full-Circle Protractor', body: 'A <strong>360\u00b0 circular protractor</strong> measures angles in any direction without needing to flip the instrument. Used in navigation, surveying, and when measuring reflex angles (> 180\u00b0).' },
    { title: 'Bevel Protractor (Universal)', body: 'The <strong>universal bevel protractor</strong> has a main scale reading to 1\u00b0 and a vernier scale reading to <code>5\u2032</code> (5 arcminutes). It uses a blade that slides and locks at any angle. Precision: 12\u00d7 finer than a standard protractor.', note: 'For precision machining, always use a bevel protractor instead of a simple protractor.' },
    { title: 'Digital Protractor', body: 'A <strong>digital protractor</strong> (or digital angle finder) displays the angle on an LCD screen with resolutions of 0.1\u00b0 or better. Some models use a spirit level to measure inclination. Used in carpentry, metalwork, and construction.' }
  ],
  errors: [
    { title: 'Parallax Error', body: 'Reading the scale from an angle rather than directly above causes <strong>parallax error</strong>. The apparent position of the arm relative to the graduation shifts. Always look straight down at the point where the arm crosses the scale.', note: 'Parallax is the most common reading error \u2014 always view from directly above.' },
    { title: 'Baseline Misalignment', body: 'If the protractor baseline is not perfectly aligned with one arm of the angle, the reading will be off by the misalignment amount. Always ensure the <strong>0\u00b0 line</strong> is flush with the reference arm before reading.' },
    { title: 'Wrong Scale Error', body: 'Choosing the inner scale when you should read the outer (or vice versa) gives the <strong>supplementary angle</strong> instead of the correct one. The error is <code>180\u00b0 \u2212 \u03b8</code>. Check: does the angle look acute or obtuse? Does your reading match?', note: 'Quick check: if the angle looks acute but your reading is > 90\u00b0, you are on the wrong scale.' },
    { title: 'Centre Point Misplacement', body: 'The centre mark must sit exactly on the <strong>vertex</strong> of the angle. If it is offset, the measured angle will differ from the true angle. This error increases as the arms of the angle become shorter.' }
  ]
};

function renderExplore(cat) {
  var cards = EXPLORE[cat] || [];
  var container = $('explore-cards');
  container.innerHTML = '';
  cards.forEach(function(c) {
    var div = document.createElement('div');
    div.className = 'explore-card';
    div.innerHTML = '<div class="explore-card-title">' + c.title + '</div>' +
      '<div class="explore-card-body">' + c.body + '</div>' +
      (c.note ? '<div class="explore-card-note">' + c.note + '</div>' : '');
    container.appendChild(div);
  });
}

document.querySelectorAll('#explore-tabs .explore-tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('#explore-tabs .explore-tab').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderExplore(btn.dataset.cat);
  });
});

// ── Pass B handlers ───────────────────────────────────────────────

// L7 — Scenarios toggle in Practice mode
$('btn-scenario').addEventListener('click', function () {
  state.scenarioMode = !state.scenarioMode;
  $('scenario-state').textContent = state.scenarioMode ? 'On' : 'Off';
  this.classList.toggle('btn-active', state.scenarioMode);
  if (state.mode === 'practice') newPractice();
});

// L6 — Quiz mode toggle (Read vs Construct)
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

// ── Options bar handlers (Pass A) ─────────────────────────────────
function flashChip(el) {
  el.classList.remove('flash');
  void el.offsetWidth;            // restart animation
  el.classList.add('flash');
}

// L1 — 360° / full-circle toggle
$('opt-full').addEventListener('click', function () {
  state.fullCircle = !state.fullCircle;
  this.setAttribute('aria-pressed', state.fullCircle ? 'true' : 'false');
  document.getElementById('canvas-card').classList.toggle('full-circle', state.fullCircle);
  flashChip(this);
  state.angle = state.fullCircle ? (state.angle % 360) : Math.min(state.angle, 180);
  layoutGeometry();
  render();
});

// L2 — Two-arm vertex measurement
$('opt-twoarm').addEventListener('click', function () {
  state.twoArm = !state.twoArm;
  this.setAttribute('aria-pressed', state.twoArm ? 'true' : 'false');
  flashChip(this);
  if (state.twoArm) {
    // Spread the arms so they're visually distinct
    state.baseline = 30;
    state.angle = 110;
  } else {
    state.baseline = 0;
  }
  render();
});

// L8 — Snap to common angles
$('opt-snap').addEventListener('click', function () {
  state.snapCommon = !state.snapCommon;
  this.setAttribute('aria-pressed', state.snapCommon ? 'true' : 'false');
  if (state.snapCommon) state.angle = snapAngle(state.angle);
  flashChip(this);
  render();
});

// L4 — Dual arc toggle
$('opt-dual').addEventListener('click', function () {
  state.dualArc = !state.dualArc;
  this.setAttribute('aria-pressed', state.dualArc ? 'true' : 'false');
  flashChip(this);
  render();
});

// L13 — Zero-error stepper
function setZeroError(v) {
  state.zeroError = Math.max(-5, Math.min(5, v | 0));
  const sign = state.zeroError > 0 ? '+' : state.zeroError < 0 ? '−' : '';
  $('opt-ze-val').textContent = sign + Math.abs(state.zeroError) + '°';
  render();
}
$('opt-ze-up').addEventListener('click', () => setZeroError(state.zeroError + 1));
$('opt-ze-dn').addEventListener('click', () => setZeroError(state.zeroError - 1));

// L11 — Export PNG (composites the canvas + tool-name watermark)
$('opt-export').addEventListener('click', function () {
  const w = canvas.width, h = canvas.height;
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const octx = off.getContext('2d');
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, w, h);
  octx.drawImage(canvas, 0, 0);
  // Watermark
  octx.font = '700 ' + (12 * DPR) + 'px "Helvetica Neue", Arial, sans-serif';
  octx.fillStyle = 'rgba(20, 30, 50, 0.55)';
  octx.textAlign = 'right';
  octx.textBaseline = 'bottom';
  octx.fillText('NHIT VisualLab  ·  Protractor  ·  ' + state.angle + '°',
    w - 10 * DPR, h - 8 * DPR);

  const a = document.createElement('a');
  a.href = off.toDataURL('image/png');
  a.download = 'protractor-' + state.angle + 'deg.png';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  flashChip(this);
});

// ── Boot ──────────────────────────────────────────────────────────
setMode('free');
})();
