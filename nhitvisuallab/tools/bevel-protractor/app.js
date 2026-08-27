'use strict';
// ════════════════════════════════════════════════════════════════════
//  Bevel Protractor Simulator  —  app.js  v2
//  Universal bevel protractor: 0°–360°, Vernier LC = 5' (5 arcminutes)
//  12 vernier divisions span 23° on the main scale
//  v2: full graphics + UX overhaul (DPR-aware, workpiece, blade drag,
//       presets, custom input, reset, right-click menu, PNG export,
//       audio tick, smooth tween, inline ± controls)
// ════════════════════════════════════════════════════════════════════

;(function () {

// ── Instrument constants ─────────────────────────────────────────
const LC_MIN        = 5;
const LC_DEG        = 5 / 60;
const VERNIER_DIVS  = 12;
const VERNIER_SPAN  = 23;
const QUIZ_TOTAL    = 5;

// ── Canvas dimensions (logical / CSS pixels) ─────────────────────
const CW = 960;
const CH = 420;

// ── Protractor layout ────────────────────────────────────────────
const CX = 300;
const CY = 235;
const MAIN_RADIUS    = 158;
const MAIN_INNER     = 132;
const VERNIER_RADIUS = 124;
const VERNIER_INNER  = 110;
const BLADE_LEN      = 300;
const BLADE_BACK     = 56;
const STOCK_LEN      = 360;       // stock reference bar length

// Colours
const BODY_DARK    = '#37474f';
const BODY_MID     = '#546e7a';
const BODY_LIGHT   = '#78909c';
const BODY_HI      = '#b0bec5';
const VERNIER_BODY = '#3a4a55';
const BLADE_EDGE   = '#b0bec5';
const ACCENT       = '#ffd600';
const ACCENT_DIM   = 'rgba(255,214,0,0.35)';
const ACCENT_GLOW  = 'rgba(255,214,0,0.6)';
const WP_FILL      = '#4a6075';
const WP_EDGE      = '#90a4ae';

// Zoom inset (dynamic — repositions to avoid blade)
let zoomPos = { x: CW - 290, y: 14 };
const ZOOM_W = 278;
const ZOOM_H = 168;
const ZOOM_FACTOR = 4.0;

// ── State object ─────────────────────────────────────────────────
const S = {
  angle:    0,
  displayAngle: 0,        // for tweening
  mode:     'free',
  dragging: false,
  dragKind: null,          // 'blade' | 'disc'
  hinted:   false,
  zoomOpen: true,
  showWorkpiece: true,
  showAnnotations: true,
  unitMode: 'dm',          // 'dm' = deg/min, 'dec' = decimal degrees
  lastWholeDeg: 0,
  // Practice
  score: 0, attempts: 0, answered: false, targetAngle: 0,
  // Quiz
  quizQuestions: [], quizCurrent: 0, quizAnswers: [], quizAnswered: false,
};

// ── DOM shorthand ────────────────────────────────────────────────
const $ = function (id) { return document.getElementById(id); };
const canvas = $('main-canvas');
const ctx    = canvas.getContext('2d');

// ── DPR-aware sizing ─────────────────────────────────────────────
function setupCanvas() {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvas.width  = CW * dpr;
  canvas.height = CH * dpr;
  canvas.style.width  = '100%';
  canvas.style.maxWidth = CW + 'px';
  canvas.style.height = 'auto';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupCanvas();
window.addEventListener('resize', function(){ setupCanvas(); drawAll(); });

// ── Math helpers ─────────────────────────────────────────────────
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function snapAngle(d)  { return Math.round(d / LC_DEG) * LC_DEG; }
function clampAngle(d) { d = d % 360; if (d < 0) d += 360; return d; }

function decToDegMin(dec) {
  dec = clampAngle(dec);
  var wholeDeg = Math.floor(dec + 1e-9);
  var minutes  = Math.round((dec - wholeDeg) * 60);
  if (minutes >= 60) { wholeDeg++; minutes = 0; }
  return { deg: wholeDeg, min: minutes };
}

function degMinToDec(d, m) { return d + m / 60; }

function formatDM(dec) {
  var dm = decToDegMin(dec);
  return dm.deg + '° ' + dm.min + "'";
}

function formatReading(dec) {
  if (S.unitMode === 'dec') return clampAngle(dec).toFixed(3) + '°';
  return formatDM(dec);
}

function getMSR(dec)  { return Math.floor(clampAngle(dec) + 1e-9); }
function getVSC(dec)  {
  var frac = clampAngle(dec) - getMSR(dec);
  var v = Math.round(frac / LC_DEG);
  return Math.min(v, VERNIER_DIVS - 1);
}

function randomAngle(lo, hi) {
  var steps = Math.floor((hi - lo) / LC_DEG);
  return snapAngle(lo + Math.floor(Math.random() * steps) * LC_DEG);
}

// ── Web Audio tick on whole-degree crossing ──────────────────────
var audioCtx = null;
function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { audioCtx = null; }
  }
  return audioCtx;
}
function playTick(freq) {
  var ac = getAudio(); if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  var o = ac.createOscillator(), g = ac.createGain();
  o.type = 'square'; o.frequency.value = freq || 1800;
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.06, ac.currentTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.04);
  o.connect(g); g.connect(ac.destination);
  o.start(ac.currentTime); o.stop(ac.currentTime + 0.05);
}

function maybeTick(newAngle, oldAngle) {
  var nw = Math.floor(clampAngle(newAngle));
  var ow = Math.floor(clampAngle(oldAngle));
  if (nw !== ow) playTick(1800);
}

// ════════════════════════════════════════════════════════════════
//  DRAWING ROUTINES
// ════════════════════════════════════════════════════════════════

function render() {
  updatePanel();
  drawAll();
}

function drawAll() {
  ctx.clearRect(0, 0, CW, CH);
  drawBackground();
  if (S.showWorkpiece) drawWorkpiece();
  drawStock();
  drawAngleArc();
  drawMainBody();
  drawMainScale();
  drawTurret();
  drawBladeSlot();
  drawVernierStrip();
  drawVernierTicks();
  drawBlade();
  drawLockingScrew();
  drawPivot();
  if (S.showAnnotations) drawAnnotations();
  drawLCBadge();
  if (S.zoomOpen) drawZoomInset();
  drawWatermark();
}

// ── Background — workbench texture ───────────────────────────────
function drawBackground() {
  var g = ctx.createLinearGradient(0, 0, 0, CH);
  g.addColorStop(0, '#161c28');
  g.addColorStop(1, '#0a0e18');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CW, CH);
  // subtle grid
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = '#2a3a4a';
  ctx.lineWidth = 0.5;
  for (var x = 0; x <= CW; x += 32) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke();
  }
  for (var y = 0; y <= CH; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
  }
  ctx.restore();
  // vignette
  var rg = ctx.createRadialGradient(CW/2, CH/2, 100, CW/2, CH/2, CW*0.7);
  rg.addColorStop(0, 'rgba(0,0,0,0)');
  rg.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Workpiece (triangular wedge being measured) ──────────────────
function drawWorkpiece() {
  ctx.save();
  var a = S.displayAngle;
  // Workpiece is a triangle with one vertex at pivot.
  // Reference edge: along stock (positive x-axis from pivot)
  // Measured face: along blade
  // Use a fixed "size" so it's always visible.
  var L = 220;
  var rad = a * DEG2RAD;
  var bx = CX + L * Math.cos(rad), by = CY - L * Math.sin(rad);
  var sx = CX + L, sy = CY;

  // Fill triangle from pivot to stock-end to blade-end
  ctx.beginPath();
  ctx.moveTo(CX, CY);
  ctx.lineTo(sx, sy);
  ctx.arc(CX, CY, L, 0, -rad, true);
  ctx.closePath();

  // Hatched fill (engineering convention for material section)
  ctx.save();
  ctx.clip();
  var wpGrad = ctx.createLinearGradient(CX, CY-100, CX+L, CY+100);
  wpGrad.addColorStop(0, 'rgba(74,96,117,0.55)');
  wpGrad.addColorStop(1, 'rgba(55,71,79,0.40)');
  ctx.fillStyle = wpGrad;
  ctx.fillRect(CX - 10, CY - L - 10, L + 30, L + L + 30);

  // Diagonal hatch lines
  ctx.strokeStyle = 'rgba(176,190,197,0.18)';
  ctx.lineWidth = 0.6;
  for (var i = -L; i < L * 2; i += 8) {
    ctx.beginPath();
    ctx.moveTo(CX + i, CY - L);
    ctx.lineTo(CX + i + L * 2, CY + L);
    ctx.stroke();
  }
  ctx.restore();

  // Edge lines (the two faces the protractor measures between)
  ctx.strokeStyle = 'rgba(144,164,174,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(CX, CY); ctx.lineTo(sx, sy);
  ctx.moveTo(CX, CY); ctx.lineTo(bx, by);
  ctx.stroke();

  // Labels (only in free mode, hidden in practice/quiz to avoid giving away)
  if (S.mode === 'free' && a >= 6 && a <= 354) {
    ctx.font = '600 9px Arial,sans-serif';
    ctx.fillStyle = 'rgba(176,190,197,0.55)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('REFERENCE FACE', sx - 90, sy + 8);
    ctx.save();
    ctx.translate(bx, by);
    var rot = -rad;
    var nrm = ((360 - (a % 360)) % 360 + 360) % 360;
    if (nrm > 90 && nrm < 270) rot += Math.PI;
    ctx.rotate(rot);
    ctx.textAlign = 'right';
    ctx.fillText('MEASURED FACE', -8, 6);
    ctx.restore();
  }
  ctx.restore();
}

// ── Stock / reference bar with cast handle ───────────────────────
function drawStock() {
  ctx.save();
  // Main flat reference edge
  var sy = CY - 4, sh = 8, sx = CX, sw = STOCK_LEN;
  var g = ctx.createLinearGradient(sx, sy, sx, sy + sh);
  g.addColorStop(0, '#90a4ae');
  g.addColorStop(0.35, '#cfd8dc');
  g.addColorStop(0.55, '#eceff1');
  g.addColorStop(0.75, '#b0bec5');
  g.addColorStop(1, '#607d8b');
  ctx.fillStyle = g;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(sx, sy, sw, sh, 2); else ctx.rect(sx, sy, sw, sh);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Cast-iron handle body behind stock (substantial, real-instrument look)
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(sx + 80, sy - 14, sw - 100, 36, 6);
  else ctx.rect(sx + 80, sy - 14, sw - 100, 36);
  var hg = ctx.createLinearGradient(0, sy - 14, 0, sy + 22);
  hg.addColorStop(0, '#5d7180');
  hg.addColorStop(0.5, '#3d4f5a');
  hg.addColorStop(1, '#2a3742');
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Knurled grip pattern on handle
  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(sx + 90, sy + 4, sw - 120, 16, 4);
  else ctx.rect(sx + 90, sy + 4, sw - 120, 16);
  ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.5;
  for (var i = 0; i < 28; i++) {
    var hx = sx + 92 + i * 8;
    ctx.beginPath();
    ctx.moveTo(hx, sy + 4); ctx.lineTo(hx + 4, sy + 20);
    ctx.moveTo(hx + 4, sy + 4); ctx.lineTo(hx, sy + 20);
    ctx.stroke();
  }
  ctx.restore();

  // Mounting screws on handle
  [sx + 90, sx + sw - 30].forEach(function(scx){
    ctx.beginPath(); ctx.arc(scx, sy - 6, 3.5, 0, Math.PI * 2);
    var sg = ctx.createRadialGradient(scx-1, sy-7, 0, scx, sy-6, 3.5);
    sg.addColorStop(0, '#90a4ae'); sg.addColorStop(1, '#37474f');
    ctx.fillStyle = sg; ctx.fill();
    ctx.strokeStyle = '#1c252b'; ctx.lineWidth = 0.4; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(scx-2, sy-6); ctx.lineTo(scx+2, sy-6); ctx.stroke();
  });

  // 0° reference indicator (yellow tick at the far end of reference edge)
  ctx.beginPath();
  ctx.moveTo(CX + MAIN_RADIUS + 14, CY);
  ctx.lineTo(CX + MAIN_RADIUS + 34, CY);
  ctx.strokeStyle = ACCENT_DIM;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '600 9px Arial,sans-serif';
  ctx.fillStyle = ACCENT_DIM;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('0°', CX + MAIN_RADIUS + 38, CY);

  ctx.restore();
}

// ── Main protractor body ring ────────────────────────────────────
function drawMainBody() {
  ctx.save();
  // outer drop shadow
  ctx.beginPath();
  ctx.arc(CX, CY + 3, MAIN_RADIUS + 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.filter = 'blur(4px)';
  ctx.fill();
  ctx.filter = 'none';

  // ring
  ctx.beginPath();
  ctx.arc(CX, CY, MAIN_RADIUS + 6, 0, Math.PI * 2);
  ctx.arc(CX, CY, MAIN_INNER, 0, Math.PI * 2, true);
  // brushed metal gradient
  var rg = ctx.createRadialGradient(CX - 30, CY - 40, 20, CX, CY, MAIN_RADIUS + 6);
  rg.addColorStop(0, '#7a8e98');
  rg.addColorStop(0.5, '#566973');
  rg.addColorStop(1, '#37474f');
  ctx.fillStyle = rg;
  ctx.fill('evenodd');

  // outer rim highlight
  ctx.beginPath();
  ctx.arc(CX, CY, MAIN_RADIUS + 6, Math.PI * 1.05, Math.PI * 1.95);
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // inner bevel
  ctx.beginPath();
  ctx.arc(CX, CY, MAIN_INNER, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // outer dark edge
  ctx.beginPath();
  ctx.arc(CX, CY, MAIN_RADIUS + 6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.restore();
}

// ── Main scale 0–360° ────────────────────────────────────────────
function drawMainScale() {
  ctx.save();
  var tO = MAIN_RADIUS + 2;
  var numR = MAIN_RADIUS - 12;

  for (var d = 0; d < 360; d++) {
    var rad = d * DEG2RAD, c = Math.cos(rad), s = Math.sin(rad);
    var len, lw, col;
    if (d % 10 === 0)     { len = 16; lw = 1.6; col = '#eceff1'; }
    else if (d % 5 === 0) { len = 11; lw = 1.0; col = '#b0bec5'; }
    else                  { len = 6;  lw = 0.5; col = '#8a9aa5'; }
    ctx.lineWidth = lw; ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(CX + (tO - len) * c, CY - (tO - len) * s);
    ctx.lineTo(CX + tO * c, CY - tO * s);
    ctx.stroke();
  }
  // Labels every 10°
  ctx.fillStyle = '#eceff1'; ctx.font = 'bold 10px "Segoe UI",Arial,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (var d = 0; d < 360; d += 10) {
    var rad = d * DEG2RAD;
    var lx = CX + numR * Math.cos(rad), ly = CY - numR * Math.sin(rad);
    ctx.save(); ctx.translate(lx, ly);
    var rot = -rad;
    var nrm = ((360 - d) % 360 + 360) % 360;
    if (nrm > 90 && nrm < 270) rot += Math.PI;
    ctx.rotate(rot);
    ctx.fillText(d.toString(), 0, 0);
    ctx.restore();
  }
  // Cardinal emphasis
  ctx.font = 'bold 12px "Segoe UI",Arial,sans-serif'; ctx.fillStyle = ACCENT;
  [0, 90, 180, 270].forEach(function (cd) {
    var rad = cd * DEG2RAD;
    var lx = CX + (numR - 16) * Math.cos(rad), ly = CY - (numR - 16) * Math.sin(rad);
    ctx.save(); ctx.translate(lx, ly);
    var rot = -rad;
    var nrm = ((360 - cd) % 360 + 360) % 360;
    if (nrm > 90 && nrm < 270) rot += Math.PI;
    ctx.rotate(rot);
    ctx.fillText(cd.toString(), 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

// ── Vernier strip body ───────────────────────────────────────────
function drawVernierStrip() {
  ctx.save();
  var bRad = S.displayAngle * DEG2RAD;
  var hs   = (VERNIER_SPAN / 2) * DEG2RAD;
  var sa   = -bRad - hs;
  var ea   = -bRad + hs;
  ctx.beginPath();
  ctx.arc(CX, CY, VERNIER_RADIUS + 2, sa, ea);
  ctx.arc(CX, CY, VERNIER_INNER, ea, sa, true);
  ctx.closePath();
  var vg = ctx.createRadialGradient(CX, CY, VERNIER_INNER, CX, CY, VERNIER_RADIUS + 2);
  vg.addColorStop(0, '#2e3a44');
  vg.addColorStop(0.5, '#3a4a55');
  vg.addColorStop(1, '#4a5b66');
  ctx.fillStyle = vg; ctx.fill();
  ctx.strokeStyle = 'rgba(176,190,197,0.35)'; ctx.lineWidth = 0.8; ctx.stroke();
  // Bevel highlight on outer edge
  ctx.beginPath();
  ctx.arc(CX, CY, VERNIER_RADIUS + 1.5, sa, ea);
  ctx.strokeStyle = 'rgba(255,214,0,0.25)'; ctx.lineWidth = 1.2; ctx.stroke();
  // Inner dark line
  ctx.beginPath();
  ctx.arc(CX, CY, VERNIER_INNER + 0.5, sa, ea);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.6; ctx.stroke();
  ctx.restore();
}

// ── Vernier ticks ────────────────────────────────────────────────
function drawVernierTicks() {
  ctx.save();
  var vsc = getVSC(S.displayAngle);
  var vernDiv = VERNIER_SPAN / VERNIER_DIVS;
  var tO = VERNIER_RADIUS + 1;

  for (var j = 0; j <= VERNIER_DIVS; j++) {
    var tDeg  = S.displayAngle + j * vernDiv;
    var tRad  = tDeg * DEG2RAD;
    var c = Math.cos(tRad), s = Math.sin(tRad);
    var isCoinc  = (j === vsc);
    var isLabeled = (j % 3 === 0) || j === VERNIER_DIVS;
    var len = isLabeled ? 11 : 7;

    var x1 = CX + (tO - len) * c, y1 = CY - (tO - len) * s;
    var x2 = CX + tO * c,         y2 = CY - tO * s;

    if (isCoinc) {
      ctx.save();
      ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.6;
      ctx.shadowColor = ACCENT_GLOW; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
    } else {
      ctx.strokeStyle = isLabeled ? '#eceff1' : '#a0aeb6';
      ctx.lineWidth   = isLabeled ? 1.3 : 0.7;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    if (isLabeled) {
      var lR = tO - len - 7;
      var lx = CX + lR * c, ly = CY - lR * s;
      ctx.save(); ctx.translate(lx, ly);
      var rot = -tRad;
      var nrm = ((360 - (tDeg % 360)) % 360 + 360) % 360;
      if (nrm > 90 && nrm < 270) rot += Math.PI;
      ctx.rotate(rot);
      ctx.fillStyle = isCoinc ? ACCENT : '#cfd8dc';
      ctx.font = isCoinc ? 'bold 9px Arial,sans-serif' : '7.5px Arial,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((j * 5).toString(), 0, 0);
      ctx.restore();
    }
  }
  // Zero-line pointer triangle
  var zRad = S.displayAngle * DEG2RAD;
  var pR = VERNIER_INNER - 4, pL = 10, pH = 4;
  var px = CX + pR * Math.cos(zRad), py = CY - pR * Math.sin(zRad);
  var dx = Math.cos(zRad), dy = -Math.sin(zRad);
  var nx = -Math.sin(zRad), ny = -Math.cos(zRad);
  ctx.save();
  ctx.fillStyle = ACCENT; ctx.shadowColor = ACCENT_GLOW; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(px + dx * pL, py + dy * pL);
  ctx.lineTo(px + nx * pH, py + ny * pH);
  ctx.lineTo(px - nx * pH, py - ny * pH);
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0; ctx.restore();
  ctx.restore();
}

// ── Blade ────────────────────────────────────────────────────────
function drawBlade() {
  ctx.save();
  var rad = S.displayAngle * DEG2RAD;
  var c = Math.cos(rad), s = Math.sin(rad);
  var tipX = CX + BLADE_LEN * c,  tipY = CY - BLADE_LEN * s;
  var bkX  = CX - BLADE_BACK * c, bkY  = CY + BLADE_BACK * s;
  var hw = 5.5, px = -s, py = -c;

  // shadow
  ctx.save();
  ctx.translate(2, 2.5);
  ctx.beginPath();
  ctx.moveTo(bkX + px * hw, bkY + py * hw);
  ctx.lineTo(tipX + px * (hw * 0.32), tipY + py * (hw * 0.32));
  ctx.lineTo(tipX - px * (hw * 0.32), tipY - py * (hw * 0.32));
  ctx.lineTo(bkX - px * hw, bkY - py * hw);
  ctx.closePath();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.filter = 'blur(2px)';
  ctx.fill();
  ctx.filter = 'none';
  ctx.restore();

  // tapered blade
  ctx.beginPath();
  ctx.moveTo(bkX + px * hw, bkY + py * hw);
  ctx.lineTo(tipX + px * (hw * 0.32), tipY + py * (hw * 0.32));
  ctx.lineTo(tipX - px * (hw * 0.32), tipY - py * (hw * 0.32));
  ctx.lineTo(bkX - px * hw, bkY - py * hw);
  ctx.closePath();
  var g = ctx.createLinearGradient(
    bkX + px * hw, bkY + py * hw,
    bkX - px * hw, bkY - py * hw);
  g.addColorStop(0, '#4d6571');
  g.addColorStop(0.25, '#a8b8c0');
  g.addColorStop(0.5, '#f0f4f6');
  g.addColorStop(0.75, '#a8b8c0');
  g.addColorStop(1, '#4d6571');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 0.5; ctx.stroke();

  // Center engrave line
  ctx.beginPath(); ctx.moveTo(bkX, bkY); ctx.lineTo(tipX, tipY);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.7; ctx.stroke();

  // Engraved scale ticks along blade (every 20px)
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.5;
  for (var t = 40; t < BLADE_LEN - 10; t += 20) {
    var tx = CX + t * c, ty = CY - t * s;
    var tickH = (t % 100 === 0) ? hw * 0.6 : hw * 0.3;
    ctx.beginPath();
    ctx.moveTo(tx + px * tickH, ty + py * tickH);
    ctx.lineTo(tx - px * tickH, ty - py * tickH);
    ctx.stroke();
  }

  // Beveled tip
  ctx.beginPath();
  ctx.moveTo(tipX + px * (hw * 0.32), tipY + py * (hw * 0.32));
  ctx.lineTo(tipX + c * 8, tipY - s * 8);
  ctx.lineTo(tipX - px * (hw * 0.32), tipY - py * (hw * 0.32));
  ctx.closePath();
  ctx.fillStyle = '#e0e8ec';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.6; ctx.stroke();

  // Tip grab dot (visual cue for drag)
  ctx.beginPath(); ctx.arc(tipX + c * 4, tipY - s * 4, 4, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT;
  ctx.shadowColor = ACCENT_GLOW; ctx.shadowBlur = 8;
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 0.6; ctx.stroke();

  ctx.restore();
}

// ── Pivot (larger, with chamfer and detail) ──────────────────────
function drawPivot() {
  ctx.save();
  // outer ring
  ctx.beginPath(); ctx.arc(CX, CY, 16, 0, Math.PI * 2);
  var og = ctx.createRadialGradient(CX-3, CY-4, 2, CX, CY, 16);
  og.addColorStop(0, '#8aa0ab'); og.addColorStop(1, '#2a3742');
  ctx.fillStyle = og; ctx.fill();
  ctx.strokeStyle = '#1c252b'; ctx.lineWidth = 0.8; ctx.stroke();

  // chamfer ring
  ctx.beginPath(); ctx.arc(CX, CY, 12, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1; ctx.stroke();

  // inner cap
  ctx.beginPath(); ctx.arc(CX, CY, 9, 0, Math.PI * 2);
  var g = ctx.createRadialGradient(CX - 2, CY - 3, 0, CX, CY, 9);
  g.addColorStop(0, '#b0bec5'); g.addColorStop(1, '#455a64');
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 0.5; ctx.stroke();

  // hex screw indent
  ctx.beginPath();
  for (var i = 0; i < 6; i++) {
    var a = i * Math.PI / 3;
    var x = CX + 4 * Math.cos(a), y = CY + 4 * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = '#1a2228';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.4; ctx.stroke();

  // center accent dot
  ctx.beginPath(); ctx.arc(CX, CY, 1.5, 0, Math.PI * 2);
  ctx.fillStyle = ACCENT; ctx.shadowColor = ACCENT_GLOW; ctx.shadowBlur = 6;
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Angle arc sector (richer, with tick markers) ─────────────────
function drawAngleArc() {
  if (S.displayAngle < 0.1) return;
  ctx.save();
  var arcR = 56;
  var eRad = S.displayAngle * DEG2RAD;

  // Gradient fill sector
  ctx.beginPath(); ctx.moveTo(CX, CY);
  ctx.arc(CX, CY, arcR, 0, -eRad, true); ctx.closePath();
  var gg = ctx.createRadialGradient(CX, CY, 10, CX, CY, arcR);
  gg.addColorStop(0, 'rgba(255,214,0,0.18)');
  gg.addColorStop(1, 'rgba(255,214,0,0.04)');
  ctx.fillStyle = gg; ctx.fill();

  // Outer arc
  ctx.beginPath(); ctx.arc(CX, CY, arcR, 0, -eRad, true);
  ctx.strokeStyle = ACCENT_DIM; ctx.lineWidth = 1.8; ctx.stroke();

  // Tick marks every 30° along arc
  for (var d = 30; d < S.displayAngle; d += 30) {
    var r = d * DEG2RAD;
    var ix = CX + (arcR - 4) * Math.cos(r), iy = CY - (arcR - 4) * Math.sin(r);
    var ox = CX + (arcR + 2) * Math.cos(r), oy = CY - (arcR + 2) * Math.sin(r);
    ctx.beginPath(); ctx.moveTo(ix, iy); ctx.lineTo(ox, oy);
    ctx.strokeStyle = 'rgba(255,214,0,0.45)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // Label
  var show = S.mode === 'free' ||
             (S.mode === 'practice' && S.answered) ||
             (S.mode === 'quiz' && S.quizAnswered);
  if (show && S.displayAngle >= 12) {
    var mRad = (S.displayAngle / 2) * DEG2RAD, lR = arcR * 0.65;
    ctx.font = 'bold 11px "Segoe UI",Arial,sans-serif';
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 4;
    ctx.fillText(formatReading(S.displayAngle), CX + lR * Math.cos(mRad), CY - lR * Math.sin(mRad));
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// ── Reading annotations ──────────────────────────────────────────
function drawAnnotations() {
  var show = S.mode === 'free' ||
             (S.mode === 'practice' && S.answered) ||
             (S.mode === 'quiz' && S.quizAnswered);
  if (!show || S.displayAngle < 1) return;
  ctx.save();
  var msr = getMSR(S.displayAngle), vsc = getVSC(S.displayAngle);
  // MSR pointer
  var mRad = msr * DEG2RAD, aR = MAIN_RADIUS + 24;
  var mx = CX + aR * Math.cos(mRad), my = CY - aR * Math.sin(mRad);
  ctx.strokeStyle = 'rgba(79,195,247,0.6)'; ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(CX + (MAIN_RADIUS + 8) * Math.cos(mRad),
             CY - (MAIN_RADIUS + 8) * Math.sin(mRad));
  ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = 'bold 9px Arial,sans-serif'; ctx.fillStyle = '#4fc3f7';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 3;
  ctx.fillText('MSR=' + msr + '°', mx, my - 9);
  ctx.shadowBlur = 0;
  // VSC pointer
  if (vsc > 0) {
    var vDiv = VERNIER_SPAN / VERNIER_DIVS;
    var cDeg = S.displayAngle + vsc * vDiv, cRad = cDeg * DEG2RAD;
    var vR = VERNIER_INNER - 18;
    var vx = CX + vR * Math.cos(cRad), vy = CY - vR * Math.sin(cRad);
    ctx.strokeStyle = 'rgba(129,199,132,0.6)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(CX + (VERNIER_INNER - 2) * Math.cos(cRad),
               CY - (VERNIER_INNER - 2) * Math.sin(cRad));
    ctx.lineTo(vx, vy); ctx.stroke(); ctx.setLineDash([]);
    ctx.font = 'bold 9px Arial,sans-serif'; ctx.fillStyle = '#81c784';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 3;
    ctx.fillText('VSC=' + vsc, vx, vy + 9);
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

// ── LC badge ─────────────────────────────────────────────────────
function drawLCBadge() {
  if (S.mode !== 'free') return;
  ctx.save();
  var txt = "LC = 5' (5′ arcmin)";
  ctx.font = 'bold 10px "Segoe UI",Arial,sans-serif';
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  var tw = ctx.measureText(txt).width, bx = 14, by = 14, bw = tw + 18, bh = 22;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 6); else ctx.rect(bx, by, bw, bh);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,0,0.55)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = ACCENT; ctx.fillText(txt, bx + bw / 2, by + bh / 2);
  ctx.restore();
}

// ── Big reading HUD (top-right area, only in free mode) ──────────
function drawReadingHUD() {
  if (S.mode !== 'free') return;
  ctx.save();
  var hx = 14, hy = CH - 70, hw = 200, hh = 56;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.strokeStyle = 'rgba(255,214,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(hx, hy, hw, hh, 8); else ctx.rect(hx, hy, hw, hh);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,214,0,0.55)';
  ctx.font = 'bold 9px Arial,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillText('CURRENT ANGLE', hx + 12, hy + 8);
  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 22px "Courier New",monospace';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = ACCENT_GLOW; ctx.shadowBlur = 6;
  ctx.fillText(formatReading(S.displayAngle), hx + 12, hy + 36);
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── Turret / swivel plate ────────────────────────────────────────
function drawTurret() {
  ctx.save();
  var turretOuter = VERNIER_INNER - 2;
  var turretInner = 22;

  ctx.beginPath();
  ctx.arc(CX, CY, turretOuter, 0, Math.PI * 2);
  ctx.arc(CX, CY, turretInner, 0, Math.PI * 2, true);
  ctx.closePath();

  var tGrad = ctx.createRadialGradient(CX-10, CY-20, turretInner, CX, CY, turretOuter);
  tGrad.addColorStop(0, '#4a5d68');
  tGrad.addColorStop(0.5, '#3a4a55');
  tGrad.addColorStop(1, '#2a3742');
  ctx.fillStyle = tGrad;
  ctx.fill('evenodd');

  ctx.beginPath();
  ctx.arc(CX, CY, turretOuter, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(176,190,197,0.25)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Crosshairs rotating with blade
  var bRad = S.displayAngle * DEG2RAD;
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 0.5;
  for (var q = 0; q < 4; q++) {
    var qRad = bRad + q * Math.PI / 2;
    var c = Math.cos(qRad), s = Math.sin(qRad);
    ctx.beginPath();
    ctx.moveTo(CX + turretInner * c, CY - turretInner * s);
    ctx.lineTo(CX + (turretOuter - 8) * c, CY - (turretOuter - 8) * s);
    ctx.stroke();
  }

  // Fine-adjustment knob
  var knobAngle = (S.displayAngle + 135) * DEG2RAD;
  var knobR = turretOuter - 10;
  var kx = CX + knobR * Math.cos(knobAngle);
  var ky = CY - knobR * Math.sin(knobAngle);
  ctx.beginPath();
  ctx.arc(kx, ky, 7, 0, Math.PI * 2);
  var kGrad = ctx.createRadialGradient(kx - 1.5, ky - 2, 0, kx, ky, 7);
  kGrad.addColorStop(0, '#a8bcc4');
  kGrad.addColorStop(1, '#37474f');
  ctx.fillStyle = kGrad;
  ctx.fill();
  ctx.strokeStyle = '#2a3742';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Knurl
  for (var k = 0; k < 14; k++) {
    var kRad = k * Math.PI / 7;
    ctx.beginPath();
    ctx.moveTo(kx + 5.2 * Math.cos(kRad), ky + 5.2 * Math.sin(kRad));
    ctx.lineTo(kx + 7   * Math.cos(kRad), ky + 7   * Math.sin(kRad));
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  ctx.restore();
}

// ── Blade slot ───────────────────────────────────────────────────
function drawBladeSlot() {
  ctx.save();
  var rad = S.displayAngle * DEG2RAD;
  var c = Math.cos(rad), s = Math.sin(rad);

  var slotLen = VERNIER_INNER - 5;
  var slotX1 = CX - slotLen * c, slotY1 = CY + slotLen * s;
  var slotX2 = CX + slotLen * c, slotY2 = CY - slotLen * s;

  ctx.beginPath();
  ctx.moveTo(slotX1, slotY1);
  ctx.lineTo(slotX2, slotY2);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = 'rgba(120,144,156,0.35)';
  var hw = 5.5;
  var px = -s, py = -c;
  ctx.beginPath();
  ctx.moveTo(slotX1 + px * hw, slotY1 + py * hw);
  ctx.lineTo(slotX2 + px * hw, slotY2 + py * hw);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(slotX1 - px * hw, slotY1 - py * hw);
  ctx.lineTo(slotX2 - px * hw, slotY2 - py * hw);
  ctx.stroke();

  ctx.restore();
}

// ── Locking screw ────────────────────────────────────────────────
function drawLockingScrew() {
  ctx.save();
  var lockAngle = (S.displayAngle + 225) * DEG2RAD;
  var lockR = 40;
  var lx = CX + lockR * Math.cos(lockAngle);
  var ly = CY - lockR * Math.sin(lockAngle);

  ctx.beginPath();
  ctx.arc(lx, ly, 5, 0, Math.PI * 2);
  var sg = ctx.createRadialGradient(lx - 1, ly - 1.5, 0, lx, ly, 5);
  sg.addColorStop(0, '#a0b4bc'); sg.addColorStop(1, '#37474f');
  ctx.fillStyle = sg; ctx.fill();
  ctx.strokeStyle = '#1c252b'; ctx.lineWidth = 0.5; ctx.stroke();

  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(lx - 2.5, ly); ctx.lineTo(lx + 2.5, ly);
  ctx.moveTo(lx, ly - 2.5); ctx.lineTo(lx, ly + 2.5);
  ctx.stroke();

  ctx.restore();
}

// ── Zoom inset ───────────────────────────────────────────────────
function computeZoomPos() {
  // Dynamically reposition zoom to avoid the blade
  var rad = S.displayAngle * DEG2RAD;
  var bladeAngleNorm = ((S.displayAngle % 360) + 360) % 360;
  // Default top-right
  var x = CW - ZOOM_W - 12, y = 14;
  // If blade points to upper-right (0–90°), move to top-left of canvas
  if (bladeAngleNorm >= 340 || bladeAngleNorm <= 90) {
    x = 14; y = 14;
  }
  // If blade points to upper-left (90–180°), keep top-right
  // If blade points to lower (180–340°), keep top-right
  zoomPos.x = x; zoomPos.y = y;
}

function drawZoomInset() {
  computeZoomPos();
  var ZX = zoomPos.x, ZY = zoomPos.y;
  ctx.save();
  var vsc = getVSC(S.displayAngle);
  var vDiv = VERNIER_SPAN / VERNIER_DIVS;
  var coincDeg = S.displayAngle + vsc * vDiv;
  var coincRad = coincDeg * DEG2RAD;
  var midR = (MAIN_INNER + MAIN_RADIUS + 4) / 2;
  var zcx = CX + midR * Math.cos(coincRad);
  var zcy = CY - midR * Math.sin(coincRad);

  // Frame
  ctx.fillStyle = 'rgba(8,12,20,0.94)';
  ctx.strokeStyle = 'rgba(255,214,0,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(ZX, ZY, ZOOM_W, ZOOM_H, 10);
  else ctx.rect(ZX, ZY, ZOOM_W, ZOOM_H);
  ctx.fill(); ctx.stroke();

  // Title bar
  ctx.fillStyle = 'rgba(255,214,0,0.10)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(ZX, ZY, ZOOM_W, 20, [10,10,0,0]);
  else ctx.rect(ZX, ZY, ZOOM_W, 20);
  ctx.fill();
  ctx.fillStyle = ACCENT;
  ctx.font = 'bold 9px "Segoe UI",Arial,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('🔍  VERNIER COINCIDENCE  ·  ' + ZOOM_FACTOR + '×', ZX + 10, ZY + 11);

  // Clip + transform
  var clipY = ZY + 22, clipH = ZOOM_H - 22;
  ctx.beginPath(); ctx.rect(ZX + 1, clipY, ZOOM_W - 2, clipH); ctx.clip();
  ctx.translate(ZX + ZOOM_W / 2, clipY + clipH / 2);
  ctx.scale(ZOOM_FACTOR, ZOOM_FACTOR);
  ctx.translate(-zcx, -zcy);
  drawZoomContent(coincDeg, vsc);
  ctx.restore();

  // Connector line from zoom to coincidence point
  ctx.save();
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(255,214,0,0.35)';
  ctx.lineWidth = 0.8;
  var zoomCenterX = ZX + ZOOM_W / 2;
  var zoomCenterY = ZY + ZOOM_H / 2;
  ctx.beginPath();
  ctx.moveTo(zoomCenterX, ZY + ZOOM_H);
  ctx.lineTo(zcx, zcy);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawZoomContent(coincDeg, vsc) {
  var vDiv = VERNIER_SPAN / VERNIER_DIVS;
  // Main body arc slice
  var aS = (coincDeg - 7) * DEG2RAD, aE = (coincDeg + 7) * DEG2RAD;
  ctx.beginPath();
  ctx.arc(CX, CY, MAIN_RADIUS + 4, -aE, -aS);
  ctx.arc(CX, CY, MAIN_INNER, -aS, -aE, true);
  ctx.closePath();
  var mg = ctx.createRadialGradient(CX, CY, MAIN_INNER, CX, CY, MAIN_RADIUS+4);
  mg.addColorStop(0, '#5a6b76'); mg.addColorStop(1, '#37474f');
  ctx.fillStyle = mg; ctx.fill();

  var rS = Math.max(0, Math.floor(coincDeg - 6));
  var rE = Math.min(360, Math.ceil(coincDeg + 6));
  var tO = MAIN_RADIUS + 2;
  for (var d = rS; d <= rE; d++) {
    var rad = d * DEG2RAD, c = Math.cos(rad), s = Math.sin(rad);
    var len, lw, col;
    if (d % 10 === 0)     { len = 16; lw = 1.4; col = '#eceff1'; }
    else if (d % 5 === 0) { len = 11; lw = 0.9; col = '#b0bec5'; }
    else                  { len = 6;  lw = 0.5; col = '#90a4ae'; }
    ctx.lineWidth = lw; ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(CX + (tO - len) * c, CY - (tO - len) * s);
    ctx.lineTo(CX + tO * c, CY - tO * s); ctx.stroke();
    if (d % 5 === 0) {
      var nR = MAIN_RADIUS - 10;
      ctx.save(); ctx.translate(CX + nR * c, CY - nR * s);
      var rot = -rad;
      var nrm = ((360 - d) % 360 + 360) % 360;
      if (nrm > 90 && nrm < 270) rot += Math.PI;
      ctx.rotate(rot);
      ctx.fillStyle = '#eceff1'; ctx.font = 'bold 3.2px Arial,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.toString(), 0, 0); ctx.restore();
    }
  }

  // Vernier strip slice
  var hs = (VERNIER_SPAN / 2) * DEG2RAD;
  ctx.beginPath();
  ctx.arc(CX, CY, VERNIER_RADIUS + 2, -(S.displayAngle * DEG2RAD) - hs, -(S.displayAngle * DEG2RAD) + hs);
  ctx.arc(CX, CY, VERNIER_INNER, -(S.displayAngle * DEG2RAD) + hs, -(S.displayAngle * DEG2RAD) - hs, true);
  ctx.closePath(); ctx.fillStyle = VERNIER_BODY; ctx.fill();
  ctx.strokeStyle = 'rgba(255,214,0,0.3)'; ctx.lineWidth = 0.3; ctx.stroke();

  for (var j = 0; j <= VERNIER_DIVS; j++) {
    var tDeg = S.displayAngle + j * vDiv, tRad = tDeg * DEG2RAD;
    var c = Math.cos(tRad), s = Math.sin(tRad);
    var isCoinc = (j === vsc);
    var isLab   = (j % 3 === 0) || j === VERNIER_DIVS;
    var vTO = VERNIER_RADIUS + 1, len = isLab ? 11 : 7;
    var x1 = CX + (vTO - len) * c, y1 = CY - (vTO - len) * s;
    var x2 = CX + vTO * c, y2 = CY - vTO * s;
    if (isCoinc) {
      ctx.save(); ctx.strokeStyle = ACCENT; ctx.lineWidth = 2.2;
      ctx.shadowColor = ACCENT_GLOW; ctx.shadowBlur = 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.restore();
      ctx.beginPath(); ctx.arc((x1 + x2) / 2, (y1 + y2) / 2, 1.8, 0, Math.PI * 2);
      ctx.fillStyle = ACCENT; ctx.fill();
    } else {
      ctx.strokeStyle = isLab ? '#eceff1' : '#a0aeb6';
      ctx.lineWidth = isLab ? 1 : 0.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    if (isLab) {
      var lR = vTO - len - 4;
      ctx.save(); ctx.translate(CX + lR * c, CY - lR * s);
      var rot = -tRad;
      var nrm = ((360 - (tDeg % 360)) % 360 + 360) % 360;
      if (nrm > 90 && nrm < 270) rot += Math.PI;
      ctx.rotate(rot);
      ctx.fillStyle = isCoinc ? ACCENT : '#cfd8dc';
      ctx.font = isCoinc ? 'bold 2.8px Arial,sans-serif' : '2.3px Arial,sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((j * 5) + "'", 0, 0); ctx.restore();
    }
  }
}

function drawWatermark() {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.font = '10px Arial,sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('NHIT VisualLab', CW - 8, CH - 6);
  ctx.restore();
}

// ════════════════════════════════════════════════════════════════
//  READING PANEL UPDATE
// ════════════════════════════════════════════════════════════════

function updatePanel() {
  var angle = clampAngle(S.angle);
  var msr = getMSR(angle), vsc = getVSC(angle), dm = decToDegMin(angle);
  var reveal = S.mode === 'free' ||
               (S.mode === 'practice' && S.answered) ||
               (S.mode === 'quiz' && S.quizAnswered);

  var digitalText = reveal
    ? (S.unitMode === 'dec' ? angle.toFixed(3) + '°' : (dm.deg + '° ' + dm.min + "'"))
    : "? ° ?'";
  $('digital-val').textContent = digitalText;
  $('msr-val').textContent     = msr + '°';
  $('vsc-val').textContent     = vsc;
  $('lc-val').textContent      = "5'";

  $('f-msr').textContent   = msr;
  $('f-vsc').textContent   = vsc;
  $('f-msr2').textContent  = msr;
  $('f-part').textContent  = (vsc * 5);
  $('f-result').textContent = '= ' + dm.deg + '° ' + dm.min + "'";

  var infoRow = $('info-row'), formula = $('tr-formula');
  if (reveal) {
    infoRow.classList.remove('cells-hidden');
    formula.classList.remove('formula-hidden');
  } else {
    infoRow.classList.add('cells-hidden');
    formula.classList.add('formula-hidden');
  }

  // Update inline angle stepper readout
  var ai = $('angle-input');
  if (ai) {
    ai.textContent = (S.unitMode === 'dec')
      ? angle.toFixed(3) + '°'
      : (dm.deg + '° ' + dm.min + "'");
  }
}

// ════════════════════════════════════════════════════════════════
//  TWEENING (smooth angle changes for presets/custom input)
// ════════════════════════════════════════════════════════════════

var tweenRAF = null;
function tweenTo(targetAngle, duration) {
  if (tweenRAF) cancelAnimationFrame(tweenRAF);
  duration = duration || 350;
  var startAngle = S.displayAngle;
  // Choose shortest path
  var delta = clampAngle(targetAngle) - clampAngle(startAngle);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  var startTime = performance.now();
  S.angle = clampAngle(targetAngle);
  function step(now) {
    var t = Math.min(1, (now - startTime) / duration);
    var eased = t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
    var cur = startAngle + delta * eased;
    var prev = S.displayAngle;
    S.displayAngle = clampAngle(cur);
    maybeTick(S.displayAngle, prev);
    drawAll();
    if (t < 1) { tweenRAF = requestAnimationFrame(step); }
    else { S.displayAngle = clampAngle(targetAngle); tweenRAF = null; render(); }
  }
  tweenRAF = requestAnimationFrame(step);
}

function setAngleInstant(a) {
  var prev = S.displayAngle;
  S.angle = clampAngle(snapAngle(a));
  S.displayAngle = S.angle;
  maybeTick(S.displayAngle, prev);
  render();
}

// ════════════════════════════════════════════════════════════════
//  MODE MANAGEMENT
// ════════════════════════════════════════════════════════════════

function setMode(mode) {
  S.mode = mode;
  $('practice-bar').style.display   = 'none';
  $('practice-panel').style.display = 'none';
  $('quiz-bar').style.display       = 'none';
  $('quiz-result').style.display    = 'none';
  $('inline-controls').style.display = (mode === 'free') ? '' : 'none';
  $('canvas-card').style.cursor     = (mode === 'free') ? 'grab' : 'default';

  if (mode === 'free') {
    setAngleInstant(snapAngle(S.angle));
  } else if (mode === 'practice') {
    $('practice-bar').style.display   = '';
    $('practice-panel').style.display = '';
    S.score = 0; S.attempts = 0;
    $('score').textContent = '0'; $('attempts').textContent = '0';
    newPractice();
  } else if (mode === 'quiz') {
    $('practice-panel').style.display = '';
    startQuiz();
  }
}

// ════════════════════════════════════════════════════════════════
//  PRACTICE MODE
// ════════════════════════════════════════════════════════════════

function newPractice() {
  var a = randomAngle(5, 355);
  S.targetAngle = a;
  S.angle = a; S.displayAngle = a;
  S.answered = false;
  $('canvas-card').style.cursor = 'default';
  $('feedback').textContent = ''; $('feedback').className = 'feedback';
  $('btn-check').disabled = true;
  $('input-deg').value = ''; $('input-min').value = '';
  $('pp-feedback').textContent = ''; $('pp-feedback').className = 'pp-feedback';
  $('pp-prompt').textContent = 'Read the angle shown on the bevel protractor:';
  setTimeout(function () { $('input-deg').focus(); }, 50);
  render();
}

function checkPractice() {
  if (S.answered) return;
  var dv = parseInt($('input-deg').value, 10);
  var mv = parseInt($('input-min').value, 10);
  if (isNaN(dv)) { $('pp-feedback').textContent = 'Enter the degree value.'; $('pp-feedback').className = 'pp-feedback err'; return; }
  if (isNaN(mv)) { $('pp-feedback').textContent = 'Enter the minutes value.'; $('pp-feedback').className = 'pp-feedback err'; return; }
  S.attempts++;
  var inputDec = degMinToDec(dv, mv);
  var cDm = decToDegMin(S.targetAngle);
  var cDec = degMinToDec(cDm.deg, cDm.min);
  var tol = LC_DEG / 2 + 1e-9;
  var ok = Math.abs(inputDec - cDec) <= tol;
  S.answered = true; $('btn-check').disabled = true;
  var ansTxt = cDm.deg + '° ' + cDm.min + "'";
  if (ok) {
    S.score++;
    $('pp-feedback').innerHTML = '✓ Correct! <strong>' + ansTxt + '</strong>';
    $('pp-feedback').className = 'pp-feedback ok';
    $('feedback').innerHTML = '✓ Correct!'; $('feedback').className = 'feedback ok';
    playTick(2400);
  } else {
    $('pp-feedback').innerHTML = '✗ Incorrect. Answer: <strong>' + ansTxt + '</strong>';
    $('pp-feedback').className = 'pp-feedback err';
    $('feedback').innerHTML = '✗ Incorrect | Answer: <strong>' + ansTxt + '</strong>';
    $('feedback').className = 'feedback err';
    playTick(380);
  }
  $('score').textContent = S.score; $('attempts').textContent = S.attempts;
  render();
}

// ════════════════════════════════════════════════════════════════
//  QUIZ MODE
// ════════════════════════════════════════════════════════════════

function startQuiz() {
  var used = new Set();
  while (used.size < QUIZ_TOTAL) {
    var a = randomAngle(5, 355), tooClose = false;
    used.forEach(function (e) { if (Math.abs(a - e) < 3) tooClose = true; });
    if (!tooClose) used.add(a);
  }
  S.quizQuestions = Array.from(used);
  S.quizCurrent = 0; S.quizAnswers = []; S.quizAnswered = false;
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display = '';
  $('quiz-q-total').textContent = QUIZ_TOTAL;
  showQuizQ(0);
}

function showQuizQ(idx) {
  S.angle = S.quizQuestions[idx];
  S.displayAngle = S.angle;
  S.quizAnswered = false;
  $('quiz-q-num').textContent = idx + 1;
  $('quiz-feedback').textContent = ''; $('quiz-feedback').className = 'quiz-feedback';
  $('btn-quiz-submit').style.display = ''; $('btn-quiz-submit').disabled = false;
  $('btn-quiz-next').style.display = 'none';
  $('canvas-card').style.cursor = 'default';
  $('input-deg').value = ''; $('input-min').value = '';
  $('pp-feedback').textContent = ''; $('pp-feedback').className = 'pp-feedback';
  $('pp-prompt').textContent = 'Q' + (idx + 1) + ': Read the angle shown:';
  $('practice-panel').style.display = '';
  setTimeout(function () { $('input-deg').focus(); }, 50);
  render();
}

function submitQuiz() {
  if (S.quizAnswered) return;
  var dv = parseInt($('input-deg').value, 10);
  var mv = parseInt($('input-min').value, 10);
  if (isNaN(dv)) { $('quiz-feedback').textContent = 'Enter the degree value.'; $('quiz-feedback').className = 'quiz-feedback err'; return; }
  if (isNaN(mv)) { $('quiz-feedback').textContent = 'Enter the minutes value.'; $('quiz-feedback').className = 'quiz-feedback err'; return; }
  var inputDec = degMinToDec(dv, mv);
  var correct  = S.quizQuestions[S.quizCurrent];
  var cDm = decToDegMin(correct);
  var cDec = degMinToDec(cDm.deg, cDm.min);
  var ok = Math.abs(inputDec - cDec) <= LC_DEG / 2 + 1e-9;
  S.quizAnswers.push({ given: { deg: dv, min: mv }, correct: cDm, ok: ok });
  S.quizAnswered = true;
  $('btn-quiz-submit').style.display = 'none';
  var ansTxt = cDm.deg + '° ' + cDm.min + "'";
  if (ok) {
    $('quiz-feedback').innerHTML = '✓ Correct!'; $('quiz-feedback').className = 'quiz-feedback ok';
    $('pp-feedback').innerHTML = '✓ Correct! <strong>' + ansTxt + '</strong>'; $('pp-feedback').className = 'pp-feedback ok';
    playTick(2400);
  } else {
    $('quiz-feedback').innerHTML = '✗ Incorrect | Answer: <strong>' + ansTxt + '</strong>'; $('quiz-feedback').className = 'quiz-feedback err';
    $('pp-feedback').innerHTML = '✗ Answer: <strong>' + ansTxt + '</strong>'; $('pp-feedback').className = 'pp-feedback err';
    playTick(380);
  }
  var isLast = S.quizCurrent + 1 >= QUIZ_TOTAL;
  $('btn-quiz-next').innerHTML = isLast ? '&#128202;&nbsp;Results' : 'Next →';
  $('btn-quiz-next').style.display = '';
  render();
}

function nextQuizQ() {
  S.quizCurrent++;
  if (S.quizCurrent >= QUIZ_TOTAL) showQuizResult();
  else showQuizQ(S.quizCurrent);
}

function showQuizResult() {
  $('quiz-bar').style.display = 'none';
  $('practice-panel').style.display = 'none';
  $('quiz-result').style.display = '';
  var sc = S.quizAnswers.filter(function (a) { return a.ok; }).length;
  var el = $('qr-score'), st = $('qr-stars'), vd = $('qr-verdict');
  el.textContent = sc + ' / ' + QUIZ_TOTAL;
  var fill = function (n) { return '★'.repeat(n) + '☆'.repeat(QUIZ_TOTAL - n); };
  if (sc === QUIZ_TOTAL)                        { el.className = 'qr-score perfect'; st.textContent = fill(QUIZ_TOTAL); st.style.color = 'var(--gold)'; vd.textContent = 'Perfect score!'; }
  else if (sc >= Math.ceil(QUIZ_TOTAL * 0.8))   { el.className = 'qr-score good';    st.textContent = fill(sc); st.style.color = 'var(--green)'; vd.textContent = 'Great job! Almost perfect.'; }
  else if (sc >= Math.ceil(QUIZ_TOTAL * 0.6))   { el.className = 'qr-score good';    st.textContent = fill(sc); st.style.color = 'var(--green)'; vd.textContent = 'Good effort! Keep practising.'; }
  else if (sc >= 1)                              { el.className = 'qr-score poor';    st.textContent = fill(sc); st.style.color = '#ffb74d'; vd.textContent = "Keep practising -- you'll get it!"; }
  else                                           { el.className = 'qr-score poor';    st.textContent = fill(0);  st.style.color = 'var(--red)'; vd.textContent = 'Try again -- you can do it!'; }
  var rows = $('qr-rows'); rows.innerHTML = '';
  S.quizAnswers.forEach(function (ans, i) {
    var row = document.createElement('div');
    row.className = 'qr-row ' + (ans.ok ? 'ok' : 'err');
    row.innerHTML =
      '<span class="qr-qnum">Q' + (i + 1) + '</span>' +
      '<span class="qr-correct">Correct: <strong>' + ans.correct.deg + '° ' + ans.correct.min + "'" + '</strong></span>' +
      '<span class="qr-given">Your answer: <strong>' + ans.given.deg + '° ' + ans.given.min + "'" + '</strong></span>' +
      '<span class="qr-mark">' + (ans.ok ? '✓' : '✗') + '</span>';
    rows.appendChild(row);
  });
  S.answered = true; S.quizAnswered = true;
  render();
}

// ════════════════════════════════════════════════════════════════
//  INTERACTION — DRAG / POINTER
// ════════════════════════════════════════════════════════════════

function getCanvasPos(e) {
  var r = canvas.getBoundingClientRect();
  var cx = e.clientX !== undefined ? e.clientX : (e.touches && e.touches.length ? e.touches[0].clientX : (e.changedTouches ? e.changedTouches[0].clientX : 0));
  var cy = e.clientY !== undefined ? e.clientY : (e.touches && e.touches.length ? e.touches[0].clientY : (e.changedTouches ? e.changedTouches[0].clientY : 0));
  return { x: (cx - r.left) * (CW / r.width), y: (cy - r.top) * (CH / r.height) };
}

function angleFromPos(x, y) {
  var dx = x - CX, dy = CY - y;
  var d = Math.atan2(dy, dx) * RAD2DEG;
  if (d < 0) d += 360;
  return snapAngle(d);
}

function distFromPivot(x, y) {
  var dx = x - CX, dy = y - CY;
  return Math.sqrt(dx*dx + dy*dy);
}

function distFromBlade(x, y) {
  // Distance from point to blade line segment
  var rad = S.displayAngle * DEG2RAD;
  var c = Math.cos(rad), s = Math.sin(rad);
  var tipX = CX + BLADE_LEN * c, tipY = CY - BLADE_LEN * s;
  var vx = tipX - CX, vy = tipY - CY;
  var wx = x - CX, wy = y - CY;
  var t = (wx*vx + wy*vy) / (vx*vx + vy*vy);
  t = Math.max(0, Math.min(1, t));
  var px = CX + t * vx, py = CY + t * vy;
  return Math.sqrt((x-px)*(x-px) + (y-py)*(y-py));
}

function nearZoomInset(x, y) {
  if (!S.zoomOpen) return false;
  return x >= zoomPos.x && x <= zoomPos.x + ZOOM_W &&
         y >= zoomPos.y && y <= zoomPos.y + ZOOM_H;
}

function pickKind(x, y) {
  if (nearZoomInset(x, y)) return null;
  var dPiv = distFromPivot(x, y);
  // Blade is grabbable along its full length (pivot to tip + small back extension)
  var dBlade = distFromBlade(x, y);
  if (dBlade < 16 && dPiv <= BLADE_LEN + 12) return 'blade';
  // Disc is grabbable inside the main scale outer ring
  if (dPiv < MAIN_RADIUS + 16) return 'disc';
  return null;
}

function onDown(e) {
  if (S.mode !== 'free') return;
  var p = getCanvasPos(e);
  var kind = pickKind(p.x, p.y);
  if (!kind) return;
  S.dragging = true;
  S.dragKind = kind;
  if (!S.hinted) { $('drag-hint').classList.add('hidden'); S.hinted = true; }
  $('canvas-card').style.cursor = 'grabbing';
  var newAngle = angleFromPos(p.x, p.y);
  var prev = S.displayAngle;
  S.angle = newAngle; S.displayAngle = newAngle;
  maybeTick(S.displayAngle, prev);
  render(); e.preventDefault();
}

function onMove(e) {
  if (S.mode === 'free' && !S.dragging) {
    // Update cursor based on hover
    var p = getCanvasPos(e);
    var kind = pickKind(p.x, p.y);
    $('canvas-card').style.cursor = kind === 'blade' ? 'grab' : (kind === 'disc' ? 'grab' : 'default');
  }
  if (!S.dragging) return;
  var p2 = getCanvasPos(e);
  var newAngle = angleFromPos(p2.x, p2.y);
  var prev = S.displayAngle;
  S.angle = newAngle; S.displayAngle = newAngle;
  maybeTick(S.displayAngle, prev);
  render(); e.preventDefault();
}

function onUp() {
  if (S.dragging) {
    S.dragging = false;
    S.dragKind = null;
    if (S.mode === 'free') $('canvas-card').style.cursor = 'grab';
  }
}

function onKey(e) {
  // Modal: Esc closes it
  var modal = $('custom-modal');
  if (modal && modal.style.display !== 'none' && e.key === 'Escape') {
    closeCustomModal(); return;
  }

  if (e.key === 'Enter') {
    if (S.mode === 'practice' && !S.answered) { checkPractice(); return; }
    if (S.mode === 'quiz' && !S.quizAnswered) { submitQuiz(); return; }
    return;
  }
  if ((e.key === 'z' || e.key === 'Z') && document.activeElement !== $('input-deg') && document.activeElement !== $('input-min') && document.activeElement !== $('angle-input')) {
    S.zoomOpen = !S.zoomOpen;
    $('btn-zoom').classList.toggle('active', S.zoomOpen);
    $('btn-zoom').innerHTML = S.zoomOpen
      ? '✕<span class="zt-lbl">&nbsp;Close</span>'
      : '&#128269;<span class="zt-lbl">&nbsp;Zoom</span>';
    render(); return;
  }
  if (S.mode !== 'free') return;
  if (document.activeElement === $('input-deg') || document.activeElement === $('input-min') || document.activeElement === $('angle-input')) return;
  var step = e.shiftKey ? 1 : LC_DEG;
  if (e.key === 'ArrowRight' || e.key === 'ArrowUp')   { setAngleInstant(S.angle + step); e.preventDefault(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowDown')  { setAngleInstant(S.angle - step); e.preventDefault(); }
  if (e.key === '0' && (e.ctrlKey || e.metaKey))         { tweenTo(0); e.preventDefault(); }
}

// ════════════════════════════════════════════════════════════════
//  CONTEXT MENU
// ════════════════════════════════════════════════════════════════

function showContextMenu(x, y) {
  var menu = $('ctx-menu');
  menu.style.display = 'block';
  // Clamp inside viewport
  var rect = menu.getBoundingClientRect();
  var maxX = window.innerWidth - rect.width - 8;
  var maxY = window.innerHeight - rect.height - 8;
  menu.style.left = Math.min(x, maxX) + 'px';
  menu.style.top  = Math.min(y, maxY) + 'px';
}
function hideContextMenu() { $('ctx-menu').style.display = 'none'; }

// ════════════════════════════════════════════════════════════════
//  CUSTOM ANGLE MODAL
// ════════════════════════════════════════════════════════════════

function openCustomModal() {
  var dm = decToDegMin(S.angle);
  $('cm-deg').value = dm.deg;
  $('cm-min').value = dm.min;
  $('cm-err').textContent = '';
  $('custom-modal').style.display = 'flex';
  setTimeout(function(){ $('cm-deg').focus(); $('cm-deg').select(); }, 50);
}
function closeCustomModal() { $('custom-modal').style.display = 'none'; }
function applyCustomModal() {
  var d = parseFloat($('cm-deg').value);
  var m = parseFloat($('cm-min').value);
  if (isNaN(d) || d < 0 || d >= 360) {
    $('cm-err').textContent = 'Degrees must be 0–359.';
    return;
  }
  if (isNaN(m) || m < 0 || m >= 60) {
    $('cm-err').textContent = 'Minutes must be 0–59.';
    return;
  }
  // Snap minutes to nearest 5
  m = Math.round(m / 5) * 5;
  if (m >= 60) { d++; m = 0; }
  var target = clampAngle(snapAngle(degMinToDec(d, m)));
  closeCustomModal();
  tweenTo(target);
}

// ════════════════════════════════════════════════════════════════
//  EXPORT PNG
// ════════════════════════════════════════════════════════════════

function exportPNG() {
  // Render at native resolution and download
  var link = document.createElement('a');
  link.download = 'bevel-protractor-' + Math.floor(S.angle) + 'deg.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ════════════════════════════════════════════════════════════════
//  COPY READING
// ════════════════════════════════════════════════════════════════

function copyReading() {
  var dm = decToDegMin(S.angle);
  var txt = dm.deg + '° ' + dm.min + "'  (MSR=" + getMSR(S.angle) + '°, VSC=' + getVSC(S.angle) + ')';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).catch(function(){});
  }
  flashHint('Copied: ' + dm.deg + '° ' + dm.min + "'");
}

function flashHint(msg) {
  var el = $('flash-hint');
  if (!el) {
    el = document.createElement('div');
    el.id = 'flash-hint';
    el.className = 'flash-hint';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(function(){ el.classList.remove('show'); }, 1400);
}

// ════════════════════════════════════════════════════════════════
//  EVENT WIRING
// ════════════════════════════════════════════════════════════════

canvas.addEventListener('mousedown', onDown);
window.addEventListener('mousemove', onMove);
window.addEventListener('mouseup', onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove', onMove, { passive: false });
canvas.addEventListener('touchend', onUp);
window.addEventListener('keydown', onKey);

// Right-click context menu
canvas.addEventListener('contextmenu', function(e){
  if (S.mode !== 'free') return;
  e.preventDefault();
  showContextMenu(e.clientX, e.clientY);
});
document.addEventListener('click', function(e){
  if (!e.target.closest('#ctx-menu')) hideContextMenu();
});

// Context menu items
document.querySelectorAll('#ctx-menu [data-action]').forEach(function(item){
  item.addEventListener('click', function(){
    var action = item.dataset.action;
    hideContextMenu();
    if (action === 'reset')       tweenTo(0);
    else if (action === 'copy')   copyReading();
    else if (action === 'set')    openCustomModal();
    else if (action === 'export') exportPNG();
    else if (action === 'zoom')   { $('btn-zoom').click(); }
    else if (action === 'workpiece') {
      S.showWorkpiece = !S.showWorkpiece;
      $('toggle-workpiece').checked = S.showWorkpiece;
      render();
    }
  });
});

// Mode tabs
document.querySelectorAll('#mode-tabs .pill').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#mode-tabs .pill').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    setMode(btn.dataset.value);
  });
});

// Zoom toggle
$('btn-zoom').addEventListener('click', function () {
  S.zoomOpen = !S.zoomOpen;
  $('btn-zoom').classList.toggle('active', S.zoomOpen);
  $('btn-zoom').innerHTML = S.zoomOpen
      ? '✕<span class="zt-lbl">&nbsp;Close</span>'
      : '&#128269;<span class="zt-lbl">&nbsp;Zoom</span>';
  render();
});

// Unit toggle
document.querySelectorAll('#unit-tabs .pill').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('#unit-tabs .pill').forEach(function(b){ b.classList.remove('active'); });
    btn.classList.add('active');
    S.unitMode = btn.dataset.value;
    render();
  });
});

// Toggle workpiece / annotations
$('toggle-workpiece').addEventListener('change', function(){
  S.showWorkpiece = this.checked; render();
});
$('toggle-annotations').addEventListener('change', function(){
  S.showAnnotations = this.checked; render();
});

// Preset chips
document.querySelectorAll('.preset-chip').forEach(function(chip){
  chip.addEventListener('click', function(){
    if (S.mode !== 'free') return;
    var val = parseFloat(chip.dataset.angle);
    tweenTo(val);
  });
});

// Inline ± controls
$('btn-minus-deg').addEventListener('click', function(){
  if (S.mode !== 'free') return; setAngleInstant(S.angle - 1);
});
$('btn-plus-deg').addEventListener('click', function(){
  if (S.mode !== 'free') return; setAngleInstant(S.angle + 1);
});
$('btn-minus-lc').addEventListener('click', function(){
  if (S.mode !== 'free') return; setAngleInstant(S.angle - LC_DEG);
});
$('btn-plus-lc').addEventListener('click', function(){
  if (S.mode !== 'free') return; setAngleInstant(S.angle + LC_DEG);
});

// Reset & Set & Export
$('btn-reset').addEventListener('click', function(){
  if (S.mode === 'free') tweenTo(0);
});
$('btn-set').addEventListener('click', openCustomModal);
$('btn-export').addEventListener('click', exportPNG);

// Custom modal
$('cm-cancel').addEventListener('click', closeCustomModal);
$('cm-apply').addEventListener('click', applyCustomModal);
$('custom-modal').addEventListener('click', function(e){
  if (e.target === this) closeCustomModal();
});
$('cm-deg').addEventListener('keydown', function(e){ if (e.key === 'Enter') applyCustomModal(); });
$('cm-min').addEventListener('keydown', function(e){ if (e.key === 'Enter') applyCustomModal(); });

// Practice
$('btn-check').addEventListener('click', checkPractice);
$('btn-next').addEventListener('click', newPractice);

function updateCheckBtn() {
  if (S.mode === 'practice' && !S.answered) {
    $('btn-check').disabled = ($('input-deg').value === '' || $('input-min').value === '');
  }
}
$('input-deg').addEventListener('input', updateCheckBtn);
$('input-min').addEventListener('input', updateCheckBtn);

// Quiz
$('btn-quiz-submit').addEventListener('click', submitQuiz);
$('btn-quiz-next').addEventListener('click', nextQuizQ);
$('btn-quiz-retry').addEventListener('click', function () {
  $('quiz-result').style.display = 'none';
  $('quiz-bar').style.display = '';
  startQuiz();
});

// Enter on inputs
$('input-deg').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    if (S.mode === 'practice') checkPractice();
    else if (S.mode === 'quiz') submitQuiz();
  }
  if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); $('input-min').focus(); $('input-min').select(); }
});
$('input-min').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    if (S.mode === 'practice') checkPractice();
    else if (S.mode === 'quiz') submitQuiz();
  }
});

// ════════════════════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════════════════════

$('btn-zoom').classList.toggle('active', S.zoomOpen);
if (S.zoomOpen) $('btn-zoom').innerHTML = '✕<span class="zt-lbl">&nbsp;Close</span>';
setMode('free');

})();
