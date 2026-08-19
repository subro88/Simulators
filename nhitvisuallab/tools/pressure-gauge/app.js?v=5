'use strict';
// ════════════════════════════════════════════════════════════════════
//  Pressure Gauge Simulator  —  app.js  v3
//  0–100 PSI | LC = 2 PSI | Dual scale: PSI / BAR / kPa
// ════════════════════════════════════════════════════════════════════

// ── Instrument constants ─────────────────────────────────────────
const LC_PSI    = 2;          // 2 PSI least count (one small division)
const PSI_MIN   = 0;
const PSI_MAX   = 100;
const QUIZ_TOTAL = 5;

// Conversion factors (exact)
const PSI_TO_BAR = 0.0689476; // 1 PSI = 0.0689476 bar
const BAR_TO_KPA = 100;       // 1 bar = 100 kPa

// ── Canvas ───────────────────────────────────────────────────────
const CW = 620;
const CH = 560;   // tall enough to show full circular gauge

// ── Gauge image layout ───────────────────────────────────────────
// The source image is 1104 × 960 (wider than tall — NOT square).
// We preserve the native aspect ratio to prevent squishing the circular dial.
const IMG_NATIVE_W = 1104;
const IMG_NATIVE_H = 960;
const IMG_W  = 576;                                          // display width
const IMG_H  = Math.round(IMG_W * IMG_NATIVE_H / IMG_NATIVE_W); // = 501 (preserves ratio)
const IMG_X  = Math.round((CW - IMG_W) / 2);                // = 22
const IMG_Y  = Math.round((CH - IMG_H) / 2);                // = 30

// Gauge face centre — very close to the geometric centre of the image.
// Fine-tune CY_FRAC upward slightly because the mounting screws sit at the bottom.
const CX_FRAC  = 0.500;
const CY_FRAC  = 0.496;
const GAUGE_CX = IMG_X + Math.round(IMG_W * CX_FRAC);       // ≈ 310
const GAUGE_CY = IMG_Y + Math.round(IMG_H * CY_FRAC);       // ≈ 278

// Gauge outer-rim radius in canvas px.
// In the original 960 px-tall image the dial circle diameter ≈ 900 px (15 px margins).
// Scale factor = IMG_H / IMG_NATIVE_H → radius = 450 × scale.
const GAUGE_RADIUS = Math.round(450 * IMG_H / IMG_NATIVE_H); // ≈ 235 px

// ── Needle geometry ──────────────────────────────────────────────
// Calibrated to this gauge image:
//   0 PSI  → canvas angle 122° (lower-left  / ~7:00 o'clock)
//  50 PSI  → canvas angle 263° (just before 12 o'clock / ~11:47)
// 100 PSI  → canvas angle  45° (lower-right / ~4:30 o'clock)
// Total sweep: 283°  Sum = 122+283 = 405° = 45° (mod 360) ✓
// Canvas angle convention: 0° = right (+x), clockwise = positive.
const ANGLE_START = 122;   // canvas degrees for 0 PSI  (calibrated)
const ANGLE_SWEEP = 283;   // total degrees of sweep    (calibrated)

// Needle length tuned so the tip reaches the scale-tick ring (≈84% of rim radius).
const NEEDLE_LEN  = Math.round(GAUGE_RADIUS * 0.84); // ≈ 197 px
const NEEDLE_TAIL = Math.round(GAUGE_RADIUS * 0.13); // ≈  31 px

// ── Practice / quiz PSI range ────────────────────────────────────
const PSI_PRACTICE_MIN = 10;
const PSI_PRACTICE_MAX = 96;   // keeps needle well clear of end-stops

// ── State ────────────────────────────────────────────────────────
const state = {
  psi          : 50,
  mode         : 'free',
  dragging     : false,
  zoomOpen     : false,
  hinted       : false,
  // Practice
  targetPSI    : 50,
  score        : 0, attempts: 0, answered: false,
  // Quiz
  quizQuestions: [], quizCurrent: 0, quizAnswers: [], quizAnswered: false,
};

// ── DOM helpers ───────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const canvas = $('gauge-canvas');
const ctx    = canvas.getContext('2d');

// ── Hi-DPI backing store ──────────────────────────────────────────
// Draw everything in logical CW×CH; backing store is CW*DPR × CH*DPR so the
// vector needle/hub and the photographic dial render crisp on Retina. Pointer
// mapping (getCanvasXY) maps to this same logical space — keep in lockstep.
let DPR = 1;
function setupCanvas() {
  DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width  = Math.round(CW * DPR);
  canvas.height = Math.round(CH * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
setupCanvas();

// ── Gauge image ───────────────────────────────────────────────────
const imgGauge = new Image();
let   gaugeReady = false;
imgGauge.onload  = () => { gaugeReady = true;  render(); };
imgGauge.onerror = () => { gaugeReady = false; render(); };
imgGauge.src = 'assets/Pressure_gaugue.png';

// ── Math helpers ──────────────────────────────────────────────────
const snapPSI = v  => Math.round(v / LC_PSI) * LC_PSI;
const clamp   = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** PSI value → canvas rotation angle (radians). */
function psiToAngle(psi) {
  return (ANGLE_START + (psi / PSI_MAX) * ANGLE_SWEEP) * Math.PI / 180;
}

/**
 * Convert a canvas (x, y) coordinate to a PSI reading.
 * Uses the angle from the gauge centre; clamps to [PSI_MIN, PSI_MAX].
 */
function xyToPSI(x, y) {
  const dx = x - GAUGE_CX;
  const dy = y - GAUGE_CY;

  // atan2 returns angle in [-π, π]; shift to [0, 360°]
  let deg = Math.atan2(dy, dx) * 180 / Math.PI;
  if (deg < 0) deg += 360;

  // Angle relative to the 0-PSI start position
  let rel = deg - ANGLE_START;
  if (rel < 0) rel += 360;

  // Dead zone = 360° − 270° = 90° between 100 PSI and 0 PSI at the bottom.
  // If the click falls in this dead zone snap to the nearer boundary.
  if (rel > ANGLE_SWEEP) {
    const midDead = ANGLE_SWEEP + (360 - ANGLE_SWEEP) / 2; // 315°
    rel = (rel > midDead) ? 0 : ANGLE_SWEEP;
  }

  return clamp(snapPSI((rel / ANGLE_SWEEP) * PSI_MAX), PSI_MIN, PSI_MAX);
}

// ── Drawing ───────────────────────────────────────────────────────

/** Draw the gauge face image (or a placeholder if not yet loaded). */
function drawGaugeImage() {
  if (!gaugeReady) {
    // Placeholder while image loads
    ctx.save();
    ctx.beginPath();
    ctx.arc(GAUGE_CX, GAUGE_CY, GAUGE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = '#e0e0e0';
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.fillStyle = '#888';
    ctx.font = 'bold 14pt sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Loading gauge…', GAUGE_CX, GAUGE_CY);
    ctx.restore();
    return;
  }

  // ── Step 1: Drop shadow (drawn as filled circle BEFORE the clip) ──
  // The shadow bleeds outside the circle onto the dark canvas; the black
  // fill inside the circle is completely covered by the image in Step 2.
  ctx.save();
  ctx.shadowColor   = 'rgba(0,0,0,0.88)';
  ctx.shadowBlur    = 30;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  ctx.arc(GAUGE_CX, GAUGE_CY, GAUGE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.restore();

  // ── Step 2: Gauge image clipped to circle — white corners never shown ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(GAUGE_CX, GAUGE_CY, GAUGE_RADIUS, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(imgGauge, IMG_X, IMG_Y, IMG_W, IMG_H);
  ctx.restore();

  // ── Step 3: Thin dark rim to sharpen the circular edge ──────────────
  ctx.save();
  ctx.beginPath();
  ctx.arc(GAUGE_CX, GAUGE_CY, GAUGE_RADIUS, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.lineWidth   = 2;
  ctx.stroke();
  ctx.restore();
}

/** Draw the needle rotated to the given PSI value, plus centre hub. */
function drawNeedle(psi) {
  const angle = psiToAngle(psi);

  ctx.save();
  ctx.translate(GAUGE_CX, GAUGE_CY);
  ctx.rotate(angle);

  // ── Drop shadow for depth ───────────────────────────────────────
  ctx.shadowColor   = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur    = 8;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;

  // ── Tapered needle body ─────────────────────────────────────────
  // Wide at the pivot end, tapers to a sharp point at the tip.
  ctx.beginPath();
  ctx.moveTo(-NEEDLE_TAIL,           0);          // tail end (centre)
  ctx.lineTo(-NEEDLE_TAIL * 0.4,     4.5);        // left shoulder
  ctx.lineTo( NEEDLE_LEN  * 0.50,    3.0);        // left mid-taper
  ctx.lineTo( NEEDLE_LEN,            0);          // sharp tip
  ctx.lineTo( NEEDLE_LEN  * 0.50,   -3.0);        // right mid-taper
  ctx.lineTo(-NEEDLE_TAIL * 0.4,    -4.5);        // right shoulder
  ctx.closePath();

  // Gradient: lighter on top face, darker underneath → 3-D look
  const ng = ctx.createLinearGradient(0, -5, 0, 5);
  ng.addColorStop(0,   '#3a3a3a');
  ng.addColorStop(0.35,'#111111');
  ng.addColorStop(1,   '#1c1c1c');
  ctx.fillStyle = ng;
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth   = 0.6;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();

  // ── Centre hub ──────────────────────────────────────────────────
  ctx.save();
  const hubR = 11;
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur  = 10;
  ctx.beginPath();
  ctx.arc(GAUGE_CX, GAUGE_CY, hubR, 0, Math.PI * 2);

  // Gold/brass hub matching the photo
  const hg = ctx.createRadialGradient(
    GAUGE_CX - 3, GAUGE_CY - 3, 0,
    GAUGE_CX,     GAUGE_CY,     hubR
  );
  hg.addColorStop(0,   '#e0c060');
  hg.addColorStop(0.5, '#b08020');
  hg.addColorStop(1,   '#705000');
  ctx.fillStyle = hg;
  ctx.fill();

  ctx.strokeStyle = 'rgba(80,55,0,0.80)';
  ctx.lineWidth   = 1.2;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Small bright centre dot
  ctx.beginPath();
  ctx.arc(GAUGE_CX - 2, GAUGE_CY - 2, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,230,100,0.70)';
  ctx.fill();
  ctx.restore();
}

/** LC badge drawn in free mode. */
function drawBadge() {
  const txt = 'LC = 2 PSI';
  ctx.save();
  ctx.font         = 'bold 8.5pt sans-serif';
  ctx.textAlign    = 'left';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(txt).width;
  const bx = 6, by = 5;
  ctx.fillStyle = 'rgba(0,0,0,0.60)';
  if (ctx.roundRect) ctx.roundRect(bx, by, tw + 12, 18, 4);
  else               ctx.rect(bx, by, tw + 12, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,200,66,0.55)';
  ctx.lineWidth   = 0.8;
  ctx.stroke();
  ctx.fillStyle = '#f5c842';
  ctx.fillText(txt, bx + 6, by + 9);
  ctx.restore();
}

function drawContent() {
  drawGaugeImage();
  const psi = (state.mode === 'free') ? state.psi : state.targetPSI;
  drawNeedle(psi);
  if (state.mode === 'free') drawBadge();
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

  const glow = ctx.createRadialGradient(GAUGE_CX, GAUGE_CY, 40, GAUGE_CX, GAUGE_CY, GAUGE_RADIUS * 1.7);
  glow.addColorStop(0, 'rgba(239,83,80,0.10)');
  glow.addColorStop(1, 'rgba(239,83,80,0)');
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
  const cx = GAUGE_CX - CW / (2 * ZF);
  const cy = GAUGE_CY - CH / (2 * ZF);

  ctx.save();
  ctx.scale(ZF, ZF);
  ctx.translate(-cx, -cy);
  drawContent();
  ctx.restore();
}

// ── Reading panel ─────────────────────────────────────────────────
function updateReadingPanel() {
  const psi = (state.mode === 'free') ? state.psi : state.targetPSI;
  const bar = psi * PSI_TO_BAR;
  const kpa = bar * BAR_TO_KPA;

  $('psi-val').textContent  = psi;
  $('bar-val').textContent  = bar.toFixed(3);
  $('kpa-val').textContent  = kpa.toFixed(1);

  $('f-psi').textContent    = psi;
  $('f-psi2').textContent   = psi;
  $('f-bar').textContent    = bar.toFixed(3);
  $('f-note').textContent   = `Pressure = ${bar.toFixed(3)} bar = ${kpa.toFixed(1)} kPa`;

  $('readout-display').textContent = psi;
}

function render() {
  updateReadingPanel();
  if (state.zoomOpen) drawZoomed();
  else                draw();
}

// ── Mode management ───────────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;

  $('practice-bar').style.display = 'none';
  $('quiz-bar').style.display     = 'none';
  $('quiz-result').style.display  = 'none';

  if (mode === 'practice') {
    $('practice-bar').style.display = '';
    state.score    = 0;
    state.attempts = 0;
    $('score').textContent    = '0';
    $('attempts').textContent = '0';
    newPractice();

  } else if (mode === 'quiz') {
    startQuiz();

  } else {
    // Free mode
    $('readout-display').style.display = 'block';
    $('practice-input').style.display  = 'none';
    $('dr-label').textContent          = 'Pressure';
    $('reading-cells').classList.remove('cells-hidden');
    $('tr-formula').classList.remove('formula-hidden');
    $('drag-hint').textContent =
      'Click & drag needle \u00a0|\u00a0 \u2190\u2192 Arrow keys \u00a0|\u00a0 Scroll wheel';
    render();
  }
}

// ── Practice mode ─────────────────────────────────────────────────
function randomTargetPSI() {
  const steps = Math.floor((PSI_PRACTICE_MAX - PSI_PRACTICE_MIN) / LC_PSI);
  return PSI_PRACTICE_MIN + Math.floor(Math.random() * (steps + 1)) * LC_PSI;
}

function newPractice() {
  state.answered  = false;
  state.targetPSI = randomTargetPSI();

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
  if (state.answered) return;
  const input = parseFloat($('practice-input').value);
  if (isNaN(input)) {
    $('feedback').textContent = 'Enter a number first.';
    $('feedback').className   = 'feedback err';
    return;
  }

  state.attempts++;
  const correct = state.targetPSI;
  const ok      = Math.abs(input - correct) < LC_PSI / 2 + 0.01;
  state.answered = true;

  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('readout-display').textContent   = correct;
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Pressure';
  $('btn-check').disabled            = true;

  if (ok) {
    state.score++;
    $('feedback').innerHTML = `\u2713 Correct! &nbsp;<strong>${correct} PSI</strong>`;
    $('feedback').className = 'feedback ok';
  } else {
    $('feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correct} PSI</strong>`;
    $('feedback').className = 'feedback err';
  }
  $('score').textContent    = state.score;
  $('attempts').textContent = state.attempts;
  render();
}

// ── Quiz mode ─────────────────────────────────────────────────────
function startQuiz() {
  // Build pool of valid PSI values, shuffle, pick QUIZ_TOTAL
  const pool = [];
  for (let p = PSI_PRACTICE_MIN; p <= PSI_PRACTICE_MAX; p += LC_PSI) pool.push(p);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, QUIZ_TOTAL);

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
  state.targetPSI    = state.quizQuestions[idx];
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
  const input = parseFloat($('practice-input').value);
  if (isNaN(input)) {
    $('quiz-feedback').textContent = 'Enter a number first.';
    $('quiz-feedback').className   = 'quiz-feedback err';
    return;
  }

  const correct = state.quizQuestions[state.quizCurrent];
  const ok      = Math.abs(input - correct) < LC_PSI / 2 + 0.01;
  state.quizAnswers.push({ given: input, correct, ok });
  state.quizAnswered = true;

  $('readout-display').textContent   = correct;
  $('readout-display').style.display = 'block';
  $('practice-input').style.display  = 'none';
  $('dr-label').textContent          = 'Pressure';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('btn-quiz-submit').style.display = 'none';

  if (ok) {
    $('quiz-feedback').innerHTML = '\u2713 Correct!';
    $('quiz-feedback').className = 'quiz-feedback ok';
  } else {
    $('quiz-feedback').innerHTML =
      `\u2717 Incorrect &nbsp;| Answer: <strong>${correct} PSI</strong>`;
    $('quiz-feedback').className = 'quiz-feedback err';
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
    scoreEl.className   = 'qr-score perfect';
    starsEl.textContent = filled(QUIZ_TOTAL); starsEl.style.color = 'var(--gold)';
    vEl.textContent     = 'Perfect score! \uD83C\uDFAF';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.8)) {
    scoreEl.className   = 'qr-score good';
    starsEl.textContent = filled(score); starsEl.style.color = 'var(--green)';
    vEl.textContent     = 'Great job! Almost perfect \uD83D\uDC4D';
  } else if (score >= Math.ceil(QUIZ_TOTAL * 0.6)) {
    scoreEl.className   = 'qr-score good';
    starsEl.textContent = filled(score); starsEl.style.color = 'var(--green)';
    vEl.textContent     = 'Good effort! Keep practising \uD83D\uDCAA';
  } else if (score >= 1) {
    scoreEl.className   = 'qr-score poor';
    starsEl.textContent = filled(score); starsEl.style.color = '#ffb74d';
    vEl.textContent     = "Keep practising \u2014 you\u2019ll get it! \uD83D\uDCAA";
  } else {
    scoreEl.className   = 'qr-score poor';
    starsEl.textContent = filled(0); starsEl.style.color = 'var(--red)';
    vEl.textContent     = 'Try again \u2014 you can do it! \uD83D\uDCAA';
  }

  const rowsEl = $('qr-rows');
  rowsEl.innerHTML = '';
  state.quizAnswers.forEach((ans, i) => {
    const row = document.createElement('div');
    row.className = `qr-row ${ans.ok ? 'ok' : 'err'}`;
    row.innerHTML =
      `<span class="qr-qnum">Q${i + 1}</span>` +
      `<span class="qr-correct">Correct: <strong>${ans.correct} PSI</strong></span>` +
      `<span class="qr-given">Your answer: <strong>${ans.given} PSI</strong></span>` +
      `<span class="qr-mark">${ans.ok ? '\u2713' : '\u2717'}</span>`;
    rowsEl.appendChild(row);
  });

  $('readout-display').textContent   = state.targetPSI;
  $('readout-display').style.display = 'block';
  $('reading-cells').classList.remove('cells-hidden');
  $('tr-formula').classList.remove('formula-hidden');
  $('dr-label').textContent = 'Pressure';
}

// ── Pointer interaction ───────────────────────────────────────────
function getCanvasXY(e) {
  const r  = canvas.getBoundingClientRect();
  const cx = e.clientX !== undefined ? e.clientX
           : e.touches && e.touches.length ? e.touches[0].clientX
           : e.changedTouches[0].clientX;
  const cy = e.clientY !== undefined ? e.clientY
           : e.touches && e.touches.length ? e.touches[0].clientY
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
  /* Only block scroll when touching the gauge face */
  const dx = x - GAUGE_CX, dy = y - GAUGE_CY;
  if (dx * dx + dy * dy > (GAUGE_RADIUS + 20) * (GAUGE_RADIUS + 20)) return;
  e.preventDefault();
  if (!state.hinted) { $('drag-hint').classList.add('hidden'); state.hinted = true; }
  state.dragging = true;
  state.psi = xyToPSI(x, y);
  render();
}

function onPointerMove(e) {
  if (!state.dragging || state.mode !== 'free') return;
  const { x, y } = getCanvasXY(e);
  state.psi = xyToPSI(x, y);
  render();
  e.preventDefault();
}

function onPointerUp() { state.dragging = false; }

// Scroll wheel — nudges needle by one LC
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  if (state.mode !== 'free') return;
  const delta = e.deltaY > 0 ? -LC_PSI : LC_PSI;
  state.psi = clamp(snapPSI(state.psi + delta), PSI_MIN, PSI_MAX);
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
  if (state.mode !== 'free') return;

  const step = e.shiftKey ? 10 : LC_PSI;
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
    state.psi = clamp(snapPSI(state.psi + step), PSI_MIN, PSI_MAX);
    render(); e.preventDefault();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
    state.psi = clamp(snapPSI(state.psi - step), PSI_MIN, PSI_MAX);
    render(); e.preventDefault();
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

// Input — Enter to submit, enable Check when non-empty
$('practice-input').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if      (state.mode === 'practice') checkAnswer();
  else if (state.mode === 'quiz')     submitQuizAnswer();
});
$('practice-input').addEventListener('input', () => {
  if (state.mode === 'practice' && !state.answered)
    $('btn-check').disabled = $('practice-input').value === '';
});

window.addEventListener('resize', () => { setupCanvas(); render(); });

// ── Boot ──────────────────────────────────────────────────────────
setMode('free');
