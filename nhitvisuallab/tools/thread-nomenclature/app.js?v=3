(function () {
'use strict';
// ════════════════════════════════════════════════════════════════════
//  Screw Thread Nomenclature Trainer — app.js v2
//  ISO 261 metric thread • 2D section + 3D helix view
//  HiDPI canvas • hover-linked dimensions • KaTeX formulas
// ════════════════════════════════════════════════════════════════════

var QUIZ_TOTAL = 5;

// ── ISO 261 Metric Thread Data ──────────────────────────────────────
var THREAD_DATA = [
  { label: 'M2',   d: 2,    coarse: 0.4,   fine: [0.25] },
  { label: 'M2.5', d: 2.5,  coarse: 0.45,  fine: [0.35] },
  { label: 'M3',   d: 3,    coarse: 0.5,   fine: [0.35] },
  { label: 'M4',   d: 4,    coarse: 0.7,   fine: [0.5] },
  { label: 'M5',   d: 5,    coarse: 0.8,   fine: [0.5] },
  { label: 'M6',   d: 6,    coarse: 1.0,   fine: [0.75] },
  { label: 'M8',   d: 8,    coarse: 1.25,  fine: [1.0, 0.75] },
  { label: 'M10',  d: 10,   coarse: 1.5,   fine: [1.25, 1.0, 0.75] },
  { label: 'M12',  d: 12,   coarse: 1.75,  fine: [1.5, 1.25, 1.0] }
];

// ── Helpers ─────────────────────────────────────────────────────────
var $ = function (id) { return document.getElementById(id); };
function fmt3(v) { return v.toFixed(3); }
function fmt4(v) { return v.toFixed(4); }
function fmtDeg(v) { return v.toFixed(2) + '°'; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

function getPitchType(td, pitch) {
  if (Math.abs(pitch - td.coarse) < 0.001) return 'coarse';
  if (td.fine.some(function (f) { return Math.abs(pitch - f) < 0.001; })) return 'fine';
  return 'custom';
}

function getPitchRange(td) {
  // ISO 262 standard pitches (kept as preset buttons)
  var allPitches = [td.coarse].concat(td.fine);
  // Slider sweep — realistic metric exploration range:
  //   min  = clamp(0.20, coarse × 0.35)   — well below the finest ISO pitch
  //   max  = clamp(3.50, coarse × 2.00)   — past the next-larger nominal coarse
  // Lets students see how dimensions change far beyond the standard pitches
  // (useful for teaching helix angle, tooth depth and root weakening).
  var sliderMin = Math.max(0.20, +(td.coarse * 0.35).toFixed(2));
  var sliderMax = Math.min(3.50, +(td.coarse * 2.00).toFixed(2));
  return {
    min: sliderMin,
    max: sliderMax,
    presets: allPitches.slice().sort(function (a, b) { return b - a; })
  };
}

function calcThread(d, P) {
  var H         = (Math.sqrt(3) / 2) * P;
  var d2        = d - 0.6495 * P;
  var d1        = d - 1.0825 * P;
  var h         = (5 / 8) * H;
  var lambda    = Math.atan(P / (Math.PI * d2));
  var lambdaDeg = lambda * (180 / Math.PI);
  return { d: d, P: P, H: H, d2: d2, d1: d1, h: h, lambda: lambda, lambdaDeg: lambdaDeg, threadAngle: 60 };
}

// ── Canvas Setup (HiDPI) ────────────────────────────────────────────
var canvas = $('thread-canvas');
var ctx    = canvas.getContext('2d');
var W = 900, H = 460;  // logical drawing coords
canvas.style.width = '100%';

function resizeCanvas() {
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  var cssW = rect.width || W;
  var targetH = cssW * (H / W);
  if (Math.abs(rect.height - targetH) > 1) canvas.style.height = targetH + 'px';
  canvas.width  = Math.round(cssW * dpr);
  canvas.height = Math.round(targetH * dpr);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(canvas.width / W, canvas.height / H);
  if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
  ctx.imageSmoothingQuality = 'high';
  render();
}

// ── Colours ─────────────────────────────────────────────────────────
var AXIS_Y = 230;
var COL = {
  major: '#4fc3f7', minor: '#81c784', pitch: '#ffb74d',
  depth: '#ef5350', angle: '#26c6da', helix: '#a78bfa',
  text: '#dde3f0', dim: '#8b9dc3', bg: '#0d1117',
  accent: '#ef6c00',
  shaftFill: 'rgba(129,199,132,0.12)', shaftStroke: '#81c784',
  toothFill: 'rgba(129,199,132,0.18)', toothStroke: '#66bb6a'
};

// ── State ───────────────────────────────────────────────────────────
var state = {
  threadIdx: 5,
  mode: 'explore',
  view: 'section',   // 'section' | 'iso'
  result: null,
  learnIdx: 0,
  currentPitch: 1.0,
  displayPitch: 1.0,   // animated value tracking currentPitch
  // toggles
  showDims: true, showLabels: true, showEquation: true, showPitchLine: true, showGrid: false,
  // hover/highlight
  hoverDim: null,
  // 3D
  isoAngle: 0,
  // Practice
  pScore: 0, pAttempts: 0, pChecked: false,
  // Quiz
  quizQs: [], quizIdx: 0, quizAnswers: [], quizAnswered: false,
  // animation
  animRAF: 0, lessonRAF: 0
};

// ── Drawing helpers ─────────────────────────────────────────────────
function drawHaloText(text, x, y, color, font) {
  ctx.font = font;
  ctx.lineJoin = 'round'; ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(13,17,30,0.85)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function dimArrowV(x, y1, y2, color, label, side, hot, labelY) {
  if (Math.abs(y2 - y1) < 2) return;
  var dir = y2 > y1 ? 1 : -1;
  ctx.strokeStyle = color; ctx.lineWidth = hot ? 2 : 1;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - 3, y1 + dir * 6); ctx.lineTo(x + 3, y1 + dir * 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - 3, y2 - dir * 6); ctx.lineTo(x + 3, y2 - dir * 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 4, y1); ctx.lineTo(x + 4, y1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 4, y2); ctx.lineTo(x + 4, y2); ctx.stroke();
  if (label) {
    var font = (hot ? 'bold ' : '') + '10px sans-serif';
    ctx.font = font; ctx.textBaseline = 'middle';
    var ly = (labelY != null) ? labelY : (y1 + y2) / 2;
    if (side === 'left') { ctx.textAlign = 'right'; drawHaloText(label, x - 7, ly, color, font); }
    else { ctx.textAlign = 'left'; drawHaloText(label, x + 7, ly, color, font); }
  }
}

function dimArrowH(y, x1, x2, color, label, side, hot) {
  if (Math.abs(x2 - x1) < 2) return;
  var dir = x2 > x1 ? 1 : -1;
  ctx.strokeStyle = color; ctx.lineWidth = hot ? 2 : 1;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + dir * 6, y - 3); ctx.lineTo(x1 + dir * 6, y + 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - dir * 6, y - 3); ctx.lineTo(x2 - dir * 6, y + 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x1, y - 4); ctx.lineTo(x1, y + 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y - 4); ctx.lineTo(x2, y + 4); ctx.stroke();
  if (label) {
    var font = (hot ? 'bold ' : '') + '10px sans-serif';
    ctx.textBaseline = side === 'top' ? 'bottom' : 'top'; ctx.textAlign = 'center';
    var ly = side === 'top' ? y - 7 : y + 7;
    drawHaloText(label, (x1 + x2) / 2, ly, color, font);
  }
}

function drawHatch(x, y, w, h, spacing, color) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = color; ctx.lineWidth = 0.7;
  var total = w + h;
  for (var d = spacing; d < total; d += spacing) {
    ctx.beginPath(); ctx.moveTo(x + d, y); ctx.lineTo(x, y + d); ctx.stroke();
  }
  ctx.restore();
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(139,157,195,0.08)'; ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (var x = 0; x <= W; x += 30) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
  for (var y = 0; y <= H; y += 30) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
  ctx.stroke();
}

// ── G2: Realistic ISO Truncated Tooth ───────────────────────────────
function drawRealisticTooth(cx, axisY, majorR, minorR, pitchPx, upper, crestFlat, hot) {
  var sign   = upper ? -1 : 1;
  var crestY = axisY + sign * majorR;
  var rootY  = axisY + sign * minorR;
  var halfP  = pitchPx / 2;
  var crestHalf = crestFlat / 2;
  var rootHalf  = pitchPx * 0.06;

  var grad = ctx.createLinearGradient(cx, crestY, cx, rootY);
  grad.addColorStop(0,   'rgba(129,199,132,0.42)');
  grad.addColorStop(0.4, 'rgba(129,199,132,0.18)');
  grad.addColorStop(1,   'rgba(129,199,132,0.06)');

  ctx.beginPath();
  ctx.moveTo(cx - halfP + rootHalf, rootY);
  ctx.lineTo(cx - crestHalf, crestY);
  ctx.lineTo(cx + crestHalf, crestY);
  ctx.lineTo(cx + halfP - rootHalf, rootY);
  ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = hot ? COL.accent : COL.toothStroke;
  ctx.lineWidth = hot ? 1.8 : 1.2; ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx + crestHalf, crestY);
  ctx.lineTo(cx + halfP - rootHalf, rootY);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2; ctx.stroke();
}

// Hit regions for hover detection
var hitRegions = [];
function pushHit(name, x, y, w, h) {
  hitRegions.push({ name: name, x: x, y: y, w: w, h: h });
}

// ── F5: Equation Overlay ────────────────────────────────────────────
function drawEquationOverlay(r) {
  var y = H - 60;
  var pad = 14;
  // background pill
  ctx.font = 'italic 700 17px "Cambria Math","Times New Roman",serif';
  var label1 = 'd₂ = d − 0.6495·P';
  var label2 = 'h = 0.5413·P';
  var label3 = 'λ = arctan(P / π d₂)';
  // three terms across the bottom
  var groups = [
    { text: label1, color: COL.pitch },
    { text: label2, color: COL.depth },
    { text: label3, color: COL.helix }
  ];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  var w = W / groups.length;
  groups.forEach(function (g, i) {
    var cx = w * (i + 0.5);
    drawHaloText(g.text, cx, y, g.color, 'italic 700 15px "Cambria Math","Times New Roman",serif');
  });
  // values below
  ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
  var values = [
    fmt3(r.d2) + ' mm',
    fmt3(r.h) + ' mm',
    fmtDeg(r.lambdaDeg)
  ];
  values.forEach(function (v, i) {
    var cx = w * (i + 0.5);
    drawHaloText('= ' + v, cx, y + 22, '#ffffff', 'bold 13px "JetBrains Mono", monospace');
  });
}

// ── Main Section View Drawing ───────────────────────────────────────
function drawSectionView(res, showVals) {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  if (state.showGrid) drawGrid();
  hitRegions = [];
  if (!res) return;
  var td = THREAD_DATA[state.threadIdx];
  var pitchType = getPitchType(td, state.displayPitch);

  var MAJOR_RAD_PX = 78;
  var depthRatio   = res.h / (res.d / 2);
  var depthPx      = Math.max(MAJOR_RAD_PX * depthRatio * 3.5, 22);
  var minorRadPx   = MAJOR_RAD_PX - depthPx;
  var pitchRadPx   = MAJOR_RAD_PX - depthPx / 2;

  var PROFILE_WIDTH = 500;
  var refPitchPx    = 100;
  var pitchRatio    = state.displayPitch / td.coarse;
  var rawPitchPx    = refPitchPx * pitchRatio;
  var numTeeth      = Math.max(3, Math.min(10, Math.round(PROFILE_WIDTH / rawPitchPx)));
  var pitchPx       = PROFILE_WIDTH / numTeeth;

  var profL  = 200;
  var profR  = profL + numTeeth * pitchPx;
  var shaftL = profL - 50;
  var shaftR = profR + 25;

  // Axis
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.8;
  ctx.setLineDash([8, 6]);
  ctx.beginPath(); ctx.moveTo(shaftL - 20, AXIS_Y); ctx.lineTo(shaftR + 55, AXIS_Y); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Shaft body
  var shaftGrad = ctx.createLinearGradient(0, AXIS_Y - minorRadPx, 0, AXIS_Y + minorRadPx);
  shaftGrad.addColorStop(0, 'rgba(129,199,132,0.22)');
  shaftGrad.addColorStop(0.5, 'rgba(129,199,132,0.10)');
  shaftGrad.addColorStop(1, 'rgba(129,199,132,0.22)');
  ctx.fillStyle = shaftGrad;
  ctx.fillRect(shaftL, AXIS_Y - minorRadPx, shaftR - shaftL, minorRadPx * 2);
  ctx.strokeStyle = 'rgba(129,199,132,0.3)'; ctx.lineWidth = 0.8;
  ctx.strokeRect(shaftL, AXIS_Y - minorRadPx, shaftR - shaftL, minorRadPx * 2);

  // Hatched end cap
  ctx.fillStyle = 'rgba(129,199,132,0.08)';
  ctx.fillRect(shaftL, AXIS_Y - MAJOR_RAD_PX, 18, MAJOR_RAD_PX * 2);
  drawHatch(shaftL, AXIS_Y - MAJOR_RAD_PX, 18, MAJOR_RAD_PX * 2, 5, 'rgba(129,199,132,0.15)');
  ctx.strokeStyle = COL.shaftStroke; ctx.lineWidth = 1.5;
  ctx.strokeRect(shaftL, AXIS_Y - MAJOR_RAD_PX, 18, MAJOR_RAD_PX * 2);

  // Teeth
  var crestFlat = pitchPx * 0.125;  // H/8 truncation
  for (var i = 0; i < numTeeth; i++) {
    var cx = profL + i * pitchPx + pitchPx / 2;
    drawRealisticTooth(cx, AXIS_Y, MAJOR_RAD_PX, minorRadPx, pitchPx, true,  crestFlat, false);
    drawRealisticTooth(cx, AXIS_Y, MAJOR_RAD_PX, minorRadPx, pitchPx, false, crestFlat, false);
  }
  // Root lines
  ctx.strokeStyle = 'rgba(129,199,132,0.4)'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(shaftL + 18, AXIS_Y - minorRadPx); ctx.lineTo(profR, AXIS_Y - minorRadPx);
  ctx.moveTo(shaftL + 18, AXIS_Y + minorRadPx); ctx.lineTo(profR, AXIS_Y + minorRadPx);
  ctx.stroke();

  // Crest reference line
  ctx.strokeStyle = 'rgba(79,195,247,0.25)'; ctx.lineWidth = 0.6;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(profL, AXIS_Y - MAJOR_RAD_PX); ctx.lineTo(profR, AXIS_Y - MAJOR_RAD_PX);
  ctx.moveTo(profL, AXIS_Y + MAJOR_RAD_PX); ctx.lineTo(profR, AXIS_Y + MAJOR_RAD_PX);
  ctx.stroke();
  ctx.setLineDash([]);

  // Pitch line
  if (state.showPitchLine) {
    ctx.strokeStyle = 'rgba(255,183,77,0.4)'; ctx.lineWidth = 0.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(profL, AXIS_Y - pitchRadPx); ctx.lineTo(profR, AXIS_Y - pitchRadPx);
    ctx.moveTo(profL, AXIS_Y + pitchRadPx); ctx.lineTo(profR, AXIS_Y + pitchRadPx);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Hit regions
  pushHit('d',  shaftL, AXIS_Y - MAJOR_RAD_PX - 6, profR - shaftL + 16, 6);
  pushHit('d',  shaftL, AXIS_Y + MAJOR_RAD_PX, profR - shaftL + 16, 6);
  pushHit('d1', shaftL, AXIS_Y - minorRadPx - 4, profR - shaftL, 8);
  pushHit('d1', shaftL, AXIS_Y + minorRadPx - 4, profR - shaftL, 8);
  pushHit('d2', shaftL, AXIS_Y - pitchRadPx - 4, profR - shaftL, 8);
  pushHit('d2', shaftL, AXIS_Y + pitchRadPx - 4, profR - shaftL, 8);
  pushHit('P',  profL, AXIS_Y - MAJOR_RAD_PX - 20, pitchPx * 2, 18);
  pushHit('h',  profR + 2, AXIS_Y - MAJOR_RAD_PX, 26, depthPx);

  // Title
  ctx.fillStyle = COL.text; ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  drawHaloText(td.label + ' × ' + state.displayPitch.toFixed(2), W / 2, 8, COL.text, 'bold 14px sans-serif');
  var typeCol = pitchType === 'coarse' ? '#3ddc84' : pitchType === 'fine' ? '#4fc3f7' : '#a78bfa';
  drawHaloText('ISO 261 METRIC ' + pitchType.toUpperCase(), W / 2, 26, typeCol, '11px sans-serif');

  // Axis label
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '9px sans-serif';
  ctx.textAlign = 'left'; ctx.fillText('axis', shaftR + 12, AXIS_Y - 3);

  if (showVals && state.showDims) {
    drawSectionDimensions(res, profL, profR, MAJOR_RAD_PX, minorRadPx, pitchRadPx, depthPx, pitchPx, pitchType);
  } else if (!showVals) {
    ctx.fillStyle = COL.dim; ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    drawHaloText('?', profL - 50, AXIS_Y, COL.dim, 'bold 16px sans-serif');
    drawHaloText('?', profL + pitchPx / 2, AXIS_Y - MAJOR_RAD_PX - 22, COL.dim, 'bold 16px sans-serif');
    drawHaloText('?', profR + 30, AXIS_Y - (MAJOR_RAD_PX + minorRadPx) / 2, COL.dim, 'bold 16px sans-serif');
  }

  if (state.showLabels) drawPartLabels(profL, MAJOR_RAD_PX, minorRadPx, pitchPx, crestFlat);

  // Tooth count + note
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.font = '9px sans-serif';
  ctx.textAlign = 'left'; ctx.fillText(numTeeth + ' teeth shown', profL, H - 8);
  ctx.textAlign = 'center';
  ctx.fillText('Thread profile exaggerated for visibility', W / 2, H - 8);

  if (state.showEquation && showVals) drawEquationOverlay(res);
}

function drawSectionDimensions(res, profL, profR, majorR, minorR, pitchR, depthPx, pitchPx, pitchType) {
  var leftBase = profL - 18;
  var hot = state.hoverDim;

  // Three vertical arrows on the left; labels stacked at different Y to avoid overlap
  var dAlpha = pitchType !== 'coarse' ? 0.55 : 1.0;
  ctx.globalAlpha = dAlpha;
  dimArrowV(leftBase - 100, AXIS_Y - majorR, AXIS_Y + majorR, COL.major,
    'd = ' + fmt3(res.d) + ' mm', 'left', hot === 'd', AXIS_Y - 18);
  ctx.globalAlpha = 1.0;
  dimArrowV(leftBase - 60, AXIS_Y - pitchR, AXIS_Y + pitchR, COL.pitch,
    'd₂ = ' + fmt3(res.d2) + ' mm', 'left', hot === 'd2', AXIS_Y);
  dimArrowV(leftBase - 20, AXIS_Y - minorR, AXIS_Y + minorR, COL.minor,
    'd₁ = ' + fmt3(res.d1) + ' mm', 'left', hot === 'd1', AXIS_Y + 18);

  // P (pitch)
  var tooth1X = profL + pitchPx / 2;
  var tooth2X = tooth1X + pitchPx;
  var pitchArrY = AXIS_Y - majorR - 18;
  dimArrowH(pitchArrY, tooth1X, tooth2X, COL.helix,
    'P = ' + fmt3(res.P) + ' mm', 'top', hot === 'P');
  ctx.strokeStyle = COL.helix; ctx.lineWidth = 0.6;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(tooth1X, AXIS_Y - majorR); ctx.lineTo(tooth1X, pitchArrY);
  ctx.moveTo(tooth2X, AXIS_Y - majorR); ctx.lineTo(tooth2X, pitchArrY);
  ctx.stroke();
  ctx.setLineDash([]);

  // h (thread depth)
  var depthX = profR + 16;
  dimArrowV(depthX, AXIS_Y - majorR, AXIS_Y - minorR, COL.depth,
    'h = ' + fmt3(res.h) + ' mm', 'right', hot === 'h');
  ctx.strokeStyle = COL.depth; ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(profR - 8, AXIS_Y - majorR); ctx.lineTo(depthX + 4, AXIS_Y - majorR);
  ctx.moveTo(profR - 8, AXIS_Y - minorR); ctx.lineTo(depthX + 4, AXIS_Y - minorR);
  ctx.stroke();
  ctx.setLineDash([]);

  // 60° angle arc
  var angleTooth = profL + pitchPx * 1.5;
  var arcR2 = Math.min(depthPx * 0.42, 22);
  var aAlpha = pitchType !== 'coarse' ? 0.55 : 1.0;
  ctx.globalAlpha = aAlpha;
  ctx.strokeStyle = hot === 'angle' ? COL.accent : COL.angle;
  ctx.lineWidth = hot === 'angle' ? 2 : 1.4;
  ctx.beginPath();
  var halfAngle = 30 * Math.PI / 180;
  ctx.arc(angleTooth, AXIS_Y - majorR, arcR2, Math.PI / 2 - halfAngle, Math.PI / 2 + halfAngle);
  ctx.stroke();
  drawHaloText('60°', angleTooth, AXIS_Y - majorR + arcR2 + 14, COL.angle, 'bold 10px sans-serif');
  ctx.globalAlpha = 1.0;
  pushHit('angle', angleTooth - arcR2, AXIS_Y - majorR, arcR2 * 2, arcR2 + 16);

  // helix angle indicator (small)
  if (hot === 'lambda' || true) {
    var lx = profL + pitchPx * 0.5;
    var ly = AXIS_Y + majorR + 24;
    ctx.strokeStyle = hot === 'lambda' ? COL.accent : COL.helix;
    ctx.lineWidth = hot === 'lambda' ? 2 : 1.2;
    var lambdaPx = res.lambdaDeg;
    var arrowDX = 38, arrowDY = arrowDX * Math.tan(res.lambda);
    ctx.beginPath();
    ctx.moveTo(lx, ly); ctx.lineTo(lx + arrowDX, ly - arrowDY); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lx, ly); ctx.lineTo(lx + arrowDX, ly); ctx.stroke();
    drawHaloText('λ = ' + fmtDeg(lambdaPx), lx + arrowDX + 4, ly - arrowDY / 2, COL.helix, '10px sans-serif');
    pushHit('lambda', lx, ly - 12, 60, 24);
  }
}

function drawPartLabels(profL, majorR, minorR, pitchPx, crestFlat) {
  ctx.textBaseline = 'middle';

  var crestX = profL + pitchPx * 2.5;
  drawHaloText('CREST', crestX, AXIS_Y - majorR - 12, COL.major, 'bold 10px sans-serif');
  ctx.fillStyle = COL.major; ctx.beginPath(); ctx.arc(crestX, AXIS_Y - majorR, 2.5, 0, Math.PI * 2); ctx.fill();

  var rootX = profL + pitchPx * 2;
  ctx.textAlign = 'center';
  drawHaloText('ROOT', rootX, AXIS_Y - minorR + 14, COL.minor, 'bold 10px sans-serif');
  ctx.fillStyle = COL.minor; ctx.beginPath(); ctx.arc(rootX, AXIS_Y - minorR, 2.5, 0, Math.PI * 2); ctx.fill();

  var flankX = profL + pitchPx * 1.25;
  var flankY = AXIS_Y - (majorR + minorR) / 2;
  ctx.save();
  ctx.translate(flankX, flankY);
  ctx.rotate(-0.5);
  drawHaloText('FLANK', 0, 0, COL.pitch, 'bold 10px sans-serif');
  ctx.restore();
}

// ── G3: ISO 3D Helix View ───────────────────────────────────────────
function drawIsoView(res) {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  if (state.showGrid) drawGrid();
  hitRegions = [];
  if (!res) return;

  var td = THREAD_DATA[state.threadIdx];
  var pitchType = getPitchType(td, state.displayPitch);

  // Title
  drawHaloText(td.label + ' × ' + state.displayPitch.toFixed(2), W / 2, 8, COL.text, 'bold 14px sans-serif');
  var typeCol = pitchType === 'coarse' ? '#3ddc84' : pitchType === 'fine' ? '#4fc3f7' : '#a78bfa';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  drawHaloText('ISO 261 METRIC ' + pitchType.toUpperCase() + ' — 3D HELIX VIEW', W / 2, 26, typeCol, '11px sans-serif');

  // Cylinder centred
  var cxC = W / 2;
  var cyC = H / 2 - 10;
  var R   = 80;     // major radius (pixels)
  var Ri  = 80 - 22; // minor visual
  var halfLen = 150;

  // Auto-rotation phase
  var phase = state.isoAngle;
  // Compute number of helix turns based on pitch (axial length / P)
  // virtual axial length scales with pitch ratio so finer pitch shows more turns
  var P = state.displayPitch;
  // visualization: ~7 turns at P=1.0; more for smaller pitch
  var visualTurns = clamp(7 * (1.0 / Math.max(0.3, P / Math.max(0.5, td.coarse))) * (td.coarse / 1.0), 4, 14);
  visualTurns = Math.max(4, Math.round(visualTurns));

  // Body — gradient cylinder (vertical orientation simulating perspective)
  // Use elliptical sides
  var ellH = 22;  // ellipse half-height (perspective tilt)
  ctx.save();
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cxC + 8, cyC + halfLen + 6, R, ellH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // body fill gradient
  var bodyGrad = ctx.createLinearGradient(cxC - R, 0, cxC + R, 0);
  bodyGrad.addColorStop(0,   'rgba(129,199,132,0.35)');
  bodyGrad.addColorStop(0.5, 'rgba(129,199,132,0.18)');
  bodyGrad.addColorStop(1,   'rgba(129,199,132,0.08)');
  ctx.fillStyle = bodyGrad;
  // rectangular body with elliptical caps
  ctx.beginPath();
  ctx.moveTo(cxC - R, cyC - halfLen);
  ctx.lineTo(cxC - R, cyC + halfLen);
  ctx.ellipse(cxC, cyC + halfLen, R, ellH, 0, Math.PI, 0, true);
  ctx.lineTo(cxC + R, cyC - halfLen);
  ctx.ellipse(cxC, cyC - halfLen, R, ellH, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COL.shaftStroke; ctx.lineWidth = 1.4;
  ctx.stroke();

  // Bottom ellipse (front-facing)
  ctx.strokeStyle = COL.shaftStroke; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(cxC, cyC + halfLen, R, ellH, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Top ellipse cap (visible)
  ctx.fillStyle = 'rgba(129,199,132,0.18)';
  ctx.beginPath();
  ctx.ellipse(cxC, cyC - halfLen, R, ellH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COL.shaftStroke;
  ctx.stroke();
  ctx.restore();

  // Draw helix path (right-handed) — sample many points
  // Helix: x = cxC + R*cos(t), y_perspective = cyC + halfLen*progress + ellH*sin(t)
  var totalAngle = visualTurns * Math.PI * 2;
  var segments = 600;

  // Two passes: back-half (lighter), front-half (vivid), with depth occlusion
  // We split each helix turn into back/front by cos(t+phase) > 0
  ctx.lineWidth = 3.2;
  ctx.lineCap = 'round';

  // First: back arcs (drawn first, slightly faded)
  for (var pass = 0; pass < 2; pass++) {
    ctx.beginPath();
    var drawing = false;
    var alpha = pass === 0 ? 0.28 : 1.0;
    ctx.strokeStyle = pass === 0
      ? 'rgba(167,139,250,' + alpha + ')'
      : COL.helix;
    var lineW = pass === 0 ? 2 : 3;
    ctx.lineWidth = lineW;
    for (var s = 0; s <= segments; s++) {
      var u = s / segments;        // 0..1 along helix
      var t = u * totalAngle + phase;
      var cosT = Math.cos(t);
      var sinT = Math.sin(t);
      // Front when sinT > 0 (visible side of cylinder when viewed from front)
      // (using sin because we look along +z, so front-facing pts have positive sinT)
      var isFront = sinT > 0;
      var includeNow = pass === 0 ? !isFront : isFront;
      var x = cxC + R * cosT;
      // axial: u maps to -halfLen..+halfLen
      var axialY = cyC - halfLen + u * (2 * halfLen);
      // perspective lift (ellipse projection)
      var y = axialY + sinT * ellH;
      if (includeNow) {
        if (!drawing) { ctx.moveTo(x, y); drawing = true; }
        else { ctx.lineTo(x, y); }
      } else {
        drawing = false;
      }
    }
    ctx.stroke();
  }

  // Highlight the helix angle on canvas
  drawHaloText('Helix angle λ = ' + fmtDeg(res.lambdaDeg),
    cxC + R + 24, cyC, COL.helix, 'bold 11px sans-serif');
  ctx.textAlign = 'left';
  ctx.beginPath();
  ctx.strokeStyle = COL.helix; ctx.lineWidth = 1;
  ctx.moveTo(cxC + R, cyC); ctx.lineTo(cxC + R + 20, cyC); ctx.stroke();

  // Pitch arrow on the side
  // Show axial step between adjacent crests
  var pStartT = phase + Math.PI / 2; // pick a t where helix is at left edge
  var ax1 = cxC - R;
  var pY1 = cyC - halfLen + 0.45 * (2 * halfLen);
  var pY2 = cyC - halfLen + (0.45 + 1 / visualTurns) * (2 * halfLen);
  ctx.strokeStyle = COL.pitch; ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(ax1 - 24, pY1); ctx.lineTo(ax1 - 24, pY2); ctx.stroke();
  // arrows
  ctx.fillStyle = COL.pitch;
  ctx.beginPath(); ctx.moveTo(ax1 - 24, pY1); ctx.lineTo(ax1 - 28, pY1 + 6); ctx.lineTo(ax1 - 20, pY1 + 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(ax1 - 24, pY2); ctx.lineTo(ax1 - 28, pY2 - 6); ctx.lineTo(ax1 - 20, pY2 - 6); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(ax1 - 28, pY1); ctx.lineTo(ax1 - 20, pY1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax1 - 28, pY2); ctx.lineTo(ax1 - 20, pY2); ctx.stroke();
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  drawHaloText('P = ' + fmt3(res.P) + ' mm', ax1 - 34, (pY1 + pY2) / 2, COL.pitch, 'bold 11px sans-serif');

  // d (major) horizontal indicator across the bottom of cylinder
  ctx.strokeStyle = COL.major; ctx.lineWidth = 1;
  var dY = cyC + halfLen + ellH + 18;
  ctx.beginPath();
  ctx.moveTo(cxC - R, dY); ctx.lineTo(cxC + R, dY); ctx.stroke();
  ctx.fillStyle = COL.major;
  ctx.beginPath(); ctx.moveTo(cxC - R, dY); ctx.lineTo(cxC - R + 6, dY - 3); ctx.lineTo(cxC - R + 6, dY + 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cxC + R, dY); ctx.lineTo(cxC + R - 6, dY - 3); ctx.lineTo(cxC + R - 6, dY + 3); ctx.closePath(); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  drawHaloText('d = ' + fmt3(res.d) + ' mm', cxC, dY + 6, COL.major, 'bold 11px sans-serif');

  // Stats panel (right side)
  var px = W - 180, py = 60;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(20,26,46,0.7)';
  ctx.fillRect(px - 10, py - 8, 170, 110);
  ctx.strokeStyle = 'rgba(139,157,195,0.25)'; ctx.lineWidth = 1;
  ctx.strokeRect(px - 10, py - 8, 170, 110);
  drawHaloText('Visual turns: ' + visualTurns, px, py, COL.text, '10px sans-serif');
  drawHaloText('Helix angle λ: ' + fmtDeg(res.lambdaDeg), px, py + 18, COL.helix, '10px sans-serif');
  drawHaloText('Pitch P: ' + fmt3(res.P) + ' mm', px, py + 36, COL.pitch, '10px sans-serif');
  drawHaloText('d₂: ' + fmt3(res.d2) + ' mm', px, py + 54, COL.pitch, '10px sans-serif');
  drawHaloText('Auto-rotating', px, py + 78, COL.dim, 'italic 9px sans-serif');
}

// ── Render dispatch ─────────────────────────────────────────────────
function recalc() {
  var td = THREAD_DATA[state.threadIdx];
  if (state.mode === 'explore') {
    state.result = calcThread(td.d, state.currentPitch);
  } else {
    state.result = calcThread(td.d, td.coarse);
  }
}

function render() {
  recalc();
  if (state.mode === 'learn') {
    drawLesson(state.learnIdx);
    renderLearn();
    return;
  }
  if (state.mode === 'explore') {
    if (state.view === 'iso') drawIsoView(state.result);
    else drawSectionView(state.result, true);
    renderExplore(state.result);
    return;
  }
  var showVals =
    (state.mode === 'practice' && state.pChecked) ||
    (state.mode === 'quiz' && state.quizAnswered);
  drawSectionView(state.result, showVals);
}

function renderExplore(r) {
  var td = THREAD_DATA[state.threadIdx];
  var pitchType = getPitchType(td, state.currentPitch);

  var pStr = Number.isInteger(state.currentPitch * 100) ?
    state.currentPitch.toFixed(2) : state.currentPitch.toFixed(3);
  $('desig-display').textContent = td.label + ' × ' + pStr;

  var badge = $('thread-badge');
  badge.textContent = pitchType === 'coarse' ? 'Coarse Pitch' :
                      pitchType === 'fine'   ? 'Fine Pitch'   : 'Custom Pitch';
  badge.className = 'thread-badge' + (pitchType !== 'coarse' ? ' ' + pitchType : '');

  $('pitch-val').textContent = state.currentPitch.toFixed(3) + ' mm';
  var slider = $('pitch-slider');
  if (document.activeElement !== slider) slider.value = state.currentPitch;
  var stp = $('stp-pitch');
  if (document.activeElement !== stp) stp.value = state.currentPitch.toFixed(2);

  $('res-d').textContent   = fmt3(r.d) + ' mm';
  $('res-d2').textContent  = fmt3(r.d2) + ' mm';
  $('res-d1').textContent  = fmt3(r.d1) + ' mm';
  $('res-P').textContent   = fmt3(r.P) + ' mm';
  $('res-h').textContent   = fmt3(r.h) + ' mm';
  $('res-angle').textContent  = '60°';
  $('res-lambda').textContent = fmtDeg(r.lambdaDeg);

  Array.prototype.forEach.call(document.querySelectorAll('.preset-btn'), function (btn) {
    var p = parseFloat(btn.dataset.pitch);
    btn.classList.toggle('active', Math.abs(p - state.currentPitch) < 0.001);
  });

  renderChangeIndicator(td, pitchType);
  renderSteps(r);
}

function renderChangeIndicator(td, pitchType) {
  var ci = $('change-indicator');
  var p = state.currentPitch;
  if (pitchType === 'coarse') {
    ci.innerHTML = '<span class="ci-fixed">Major diameter (d = ' + td.d + ' mm)</span> and ' +
      '<span class="ci-fixed">thread angle (60°)</span> are always constant. ' +
      'Drag the pitch slider (or use the stepper) to sweep pitch from ' +
      '<strong>' + (+($('pitch-slider').min)).toFixed(2) + '</strong> to ' +
      '<strong>' + (+($('pitch-slider').max)).toFixed(2) + ' mm</strong> and watch ' +
      '<span class="ci-changes">d₂, d₁, h, and λ</span> change.';
  } else if (pitchType === 'fine') {
    ci.innerHTML = '<span class="ci-fixed">' + td.label + '</span> at ISO fine pitch ' +
      '<strong>' + p.toFixed(2) + ' mm</strong> (coarse is ' + td.coarse + ' mm). ' +
      '<span class="ci-changes">Finer pitch → shallower threads, smaller helix angle, ' +
      'better vibration resistance.</span>';
  } else {
    // custom (non-standard) pitch — pedagogical commentary
    var ratio = p / td.coarse;
    var note;
    if (ratio < 0.5) note = 'very fine — far below any ISO standard pitch for this size';
    else if (ratio < 0.9) note = 'finer than the ISO standard fine pitch';
    else if (ratio < 1.1) note = 'close to ISO coarse pitch';
    else if (ratio < 1.5) note = 'coarser than ISO coarse — closer to the next-larger nominal size';
    else note = 'very coarse — past the next nominal size\'s coarse pitch';
    ci.innerHTML = '<span class="ci-fixed">Custom pitch ' + p.toFixed(2) + ' mm</span> on ' +
      td.label + ' &mdash; ' + note + '. ' +
      '<span class="ci-changes">Useful for exploring how pitch affects geometry; not a standard fastener size.</span>';
  }
}

function renderPresetButtons(td) {
  var range = getPitchRange(td);
  var html = '';
  range.presets.forEach(function (p) {
    var type = Math.abs(p - td.coarse) < 0.001 ? 'Coarse' : 'Fine';
    var active = Math.abs(p - state.currentPitch) < 0.001 ? ' active' : '';
    html += '<button class="preset-btn' + active + '" data-pitch="' + p + '">';
    html += p.toFixed(2) + '<span class="preset-type">' + type + '</span>';
    html += '</button>';
  });
  $('preset-btns').innerHTML = html;
}

function updateSliderForThread(td) {
  var range = getPitchRange(td);
  var slider = $('pitch-slider');
  slider.min = range.min;
  slider.max = range.max;
  slider.step = 0.05;

  state.currentPitch = td.coarse;
  state.displayPitch = td.coarse;
  slider.value = td.coarse;
  $('stp-pitch').value = td.coarse.toFixed(2);
  $('stp-pitch').min = range.min;
  $('stp-pitch').max = range.max;

  $('pitch-val').textContent = state.currentPitch.toFixed(3) + ' mm';
  $('pitch-min-label').textContent = range.min.toFixed(2);
  $('pitch-max-label').textContent = range.max.toFixed(2);

  renderPresetButtons(td);
}

// ── Step-by-step calculation (KaTeX) ────────────────────────────────
var _stepCache = '';
function renderSteps(r) {
  var td = THREAD_DATA[state.threadIdx];
  var html = '';
  html += stepBlock(1, 'Thread parameters',
    '\\(' + td.label + ': \\; d = ' + fmt3(r.d) + '\\;\\mathrm{mm}, \\; P = ' + fmt3(r.P) + '\\;\\mathrm{mm}\\)');
  html += stepBlock(2, 'Theoretical thread height (H)',
    '\\[ H = \\dfrac{\\sqrt{3}}{2}\\,P = 0.866025 \\times ' + fmt3(r.P) + ' = ' + fmt4(r.H) + '\\;\\mathrm{mm} \\]');
  html += stepBlock(3, 'Pitch diameter (d₂)',
    '\\[ d_{2} = d - 0.6495\\,P = ' + fmt3(r.d) + ' - 0.6495 \\times ' + fmt3(r.P) + ' = \\mathbf{' + fmt3(r.d2) + '\\;\\mathrm{mm}} \\]');
  html += stepBlock(4, 'Minor diameter (d₁)',
    '\\[ d_{1} = d - 1.0825\\,P = ' + fmt3(r.d) + ' - 1.0825 \\times ' + fmt3(r.P) + ' = \\mathbf{' + fmt3(r.d1) + '\\;\\mathrm{mm}} \\]');
  html += stepBlock(5, 'Actual thread depth (h)',
    '\\[ h = \\dfrac{5H}{8} = 0.5413\\,P = 0.5413 \\times ' + fmt3(r.P) + ' = \\mathbf{' + fmt3(r.h) + '\\;\\mathrm{mm}} \\]');
  html += stepBlock(6, 'Helix angle (λ)',
    '\\[ \\lambda = \\arctan\\!\\left(\\dfrac{P}{\\pi\\,d_{2}}\\right) = \\arctan\\!\\left(\\dfrac{' + fmt3(r.P) + '}{\\pi \\times ' + fmt3(r.d2) + '}\\right) = \\mathbf{' + fmtDeg(r.lambdaDeg) + '} \\]');

  if (html !== _stepCache) {
    $('step-content').innerHTML = html;
    _stepCache = html;
    renderKatex($('step-content'));
  }
}

function renderKatex(el) {
  if (!el) return;
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(el, {
        delimiters: [
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {}
  } else {
    // KaTeX still loading (defer) — retry
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      if (window.renderMathInElement) {
        clearInterval(iv);
        renderKatex(el);
      } else if (tries > 50) clearInterval(iv);
    }, 100);
  }
}

function stepBlock(n, title, body) {
  return '<div class="calc-step">' +
         '<div class="cs-num-circle">' + n + '</div>' +
         '<div class="cs-body">' +
         '<div class="cs-title">' + title + '</div>' +
         '<div class="cs-text">' + body + '</div></div></div>';
}

// ── F4: Calc Modal builder ──────────────────────────────────────────
function buildCalcSteps() {
  var r = state.result;
  var td = THREAD_DATA[state.threadIdx];
  var html = '';
  html += '<div class="cs-inputs"><span class="cs-badge">Given &mdash; Current Thread</span>';
  html += '<div class="cs-given">';
  html += '<span>Designation: ' + td.label + ' × ' + fmt3(r.P) + '</span>';
  html += '<span>d = ' + fmt3(r.d) + ' mm</span>';
  html += '<span>P = ' + fmt3(r.P) + ' mm</span>';
  html += '<span>Thread angle = 60°</span>';
  html += '</div>';
  html += '<p class="cs-si-note">ℹ All ISO 261 dimensions derive from just d and P plus the 60° angle.</p></div>';

  html += csStep(1, 'Theoretical thread height H',
    '\\[ H = \\dfrac{\\sqrt{3}}{2}\\,P \\]',
    '\\[ H = 0.866025 \\times ' + fmt3(r.P) + ' = ' + fmt4(r.H) + '\\;\\mathrm{mm} \\]',
    fmt4(r.H) + ' mm');

  html += csStep(2, 'Pitch diameter d₂',
    '\\[ d_{2} = d - 2 \\times \\dfrac{3H}{8} = d - 0.6495\\,P \\]',
    '\\[ d_{2} = ' + fmt3(r.d) + ' - 0.6495 \\times ' + fmt3(r.P) + ' = ' + fmt3(r.d2) + '\\;\\mathrm{mm} \\]',
    fmt3(r.d2) + ' mm');

  html += csStep(3, 'Minor diameter d₁',
    '\\[ d_{1} = d - 2 \\times \\dfrac{5H}{8} = d - 1.0825\\,P \\]',
    '\\[ d_{1} = ' + fmt3(r.d) + ' - 1.0825 \\times ' + fmt3(r.P) + ' = ' + fmt3(r.d1) + '\\;\\mathrm{mm} \\]',
    fmt3(r.d1) + ' mm');

  html += csStep(4, 'Actual thread depth h',
    '\\[ h = \\dfrac{5H}{8} = 0.5413\\,P \\]',
    '\\[ h = 0.5413 \\times ' + fmt3(r.P) + ' = ' + fmt3(r.h) + '\\;\\mathrm{mm} \\]',
    fmt3(r.h) + ' mm');

  html += csStep(5, 'Helix angle &lambda;',
    '\\[ \\lambda = \\arctan\\!\\left(\\dfrac{P}{\\pi\\,d_{2}}\\right) \\]',
    '\\[ \\lambda = \\arctan\\!\\left(\\dfrac{' + fmt3(r.P) + '}{\\pi \\times ' + fmt3(r.d2) + '}\\right) = \\arctan(' + fmt4(r.P / (Math.PI * r.d2)) + ') = ' + fmtDeg(r.lambdaDeg) + ' \\]',
    fmtDeg(r.lambdaDeg));

  html += csStep(6, 'Practical interpretation',
    '',
    '<p style="margin:0;line-height:1.6;color:#b6c3e0;">For ' + td.label + ' at this pitch, a nut must engage the thread along at least ~0.8&middot;d of axial length for full strength. Larger pitch (coarse) gives stronger threads but lower vibration resistance; smaller pitch (fine) gives the opposite.</p>',
    null);

  return html;
}

function csStep(n, title, formula, calc, result) {
  var html = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + n + '</span><span class="cs-title">' + title + '</span></div>';
  if (formula) html += '<div class="cs-formula">' + formula + '</div>';
  if (calc)    html += '<div class="cs-calc">' + calc + '</div>';
  if (result)  html += '<div class="cs-result">→ <strong>' + result + '</strong></div>';
  html += '</div>';
  return html;
}

function openCalcModal() {
  var modal = $('calc-modal');
  var body  = $('calc-modal-body');
  if (!modal || !body) return;
  body.innerHTML = buildCalcSteps();
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  var cb = $('calc-modal-close'); if (cb) cb.focus();
  document.body.style.overflow = 'hidden';
}
function closeCalcModal() {
  var modal = $('calc-modal'); if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  var b = $('btn-calc'); if (b) b.focus();
}

// ── Lessons (Learn mode) ────────────────────────────────────────────
var LESSONS = [
  { title: 'What is a Screw Thread?', body:
    '<p>A <strong>screw thread</strong> is a <strong>helical ridge</strong> formed on the outside (external thread / bolt) or inside (internal thread / nut) of a cylinder.</p>' +
    '<p>Threads convert <strong>rotational motion into linear motion</strong> — this is how a bolt pulls two parts together when tightened.</p>' +
    '<ul>' +
    '<li><strong>External thread</strong> — the thread on a bolt or screw</li>' +
    '<li><strong>Internal thread</strong> — the thread inside a nut or tapped hole</li>' +
    '<li><strong>Helix</strong> — the spiral path the thread follows</li>' +
    '</ul>' +
    '<p>If you "unwound" the helix onto a flat surface, it would form a <strong>right triangle</strong> where the base is the circumference (π × d) and the height is the pitch (P). Watch the animated unwrap on the canvas.</p>' },
  { title: 'Thread Terminology', body:
    '<p>Every thread profile has specific parts:</p>' +
    '<ul>' +
    '<li><span class="lb-key lb-major">Crest</span> — the top (outermost) surface of the thread</li>' +
    '<li><span class="lb-key lb-minor">Root</span> — the bottom (innermost) surface between threads</li>' +
    '<li><span class="lb-key lb-pitch">Flank</span> — the sloped surface connecting crest and root</li>' +
    '<li><span class="lb-key lb-angle">Thread Angle</span> — between the two flanks. For metric threads this is always <strong>60°</strong></li>' +
    '</ul>' +
    '<p>The canvas shows these parts highlighted on a thread cross-section.</p>' },
  { title: 'Key Dimensions', body:
    '<p>The three most important diameters:</p>' +
    '<ul>' +
    '<li><span class="lb-key lb-major">Major Diameter (d)</span> — largest diameter, across the crests. Nominal size (e.g., M8 = 8 mm).</li>' +
    '<li><span class="lb-key lb-pitch">Pitch Diameter (d₂)</span> — diameter where tooth width equals gap width. <strong>d₂ = d − 0.6495 × P</strong></li>' +
    '<li><span class="lb-key lb-minor">Minor Diameter (d₁)</span> — smallest diameter, across the roots. <strong>d₁ = d − 1.0825 × P</strong></li>' +
    '</ul>' +
    '<p>Other key dimensions:</p>' +
    '<ul>' +
    '<li><strong>Pitch (P)</strong> — distance from one crest to the next</li>' +
    '<li><strong>Thread Depth (h)</strong> — radial distance from crest to root. <strong>h = 0.5413 × P</strong></li>' +
    '<li><strong>Helix Angle (λ)</strong> — <strong>λ = arctan(P / (π × d₂))</strong></li>' +
    '</ul>' },
  { title: 'The Metric Thread System', body:
    '<p>The <strong>ISO 261</strong> standard defines the metric thread system used worldwide:</p>' +
    '<p style="text-align:center;font-family:monospace;font-size:1.3rem;font-weight:700;color:#fff;margin:10px 0;">M8 × 1.25</p>' +
    '<ul>' +
    '<li><strong>M</strong> — indicates Metric thread</li>' +
    '<li><strong>8</strong> — Major diameter in millimetres</li>' +
    '<li><strong>× 1.25</strong> — Pitch in millimetres (omitted for coarse pitch)</li>' +
    '</ul>' +
    '<p>If only "M8" is written, it means the <strong>standard coarse pitch</strong> for that size (1.25 mm for M8). A non-standard pitch must be specified: e.g., <strong>M8 × 1.0</strong>.</p>' },
  { title: 'Coarse vs Fine Pitch', body:
    '<p>ISO 261 defines two main thread series:</p>' +
    '<p><strong>Coarse Pitch</strong> — the default for each diameter:</p>' +
    '<ul>' +
    '<li>Stronger (more material at the root)</li>' +
    '<li>Easier to assemble, less likely to cross-thread</li>' +
    '<li>General-purpose fastening</li>' +
    '</ul>' +
    '<p><strong>Fine Pitch</strong> — more threads per unit length:</p>' +
    '<ul>' +
    '<li>Better resistance to vibration loosening</li>' +
    '<li>Higher tensile strength for same major diameter</li>' +
    '<li>Precision instruments, automotive, aerospace</li>' +
    '</ul>' +
    '<p>Example: M10 coarse = M10 × 1.5, M10 fine = M10 × 1.25 or M10 × 1.0</p>' }
];

function drawLesson(idx) {
  ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
  if (state.showGrid) drawGrid();
  if (idx === 0) drawLesson1Animated();
  else if (idx === 1) drawLesson2();
  else if (idx === 2) drawLesson3();
  else if (idx === 3) drawLesson4();
  else if (idx === 4) drawLesson5();
}

// G6: Animated helix unwrap (Lesson 1)
var lessonAnimT = 0; // 0..1
function drawLesson1Animated() {
  drawHaloText('What is a Screw Thread? — Helix Unwrap', W / 2, 20, COL.text, 'bold 14px sans-serif');

  var t = lessonAnimT;
  // Cylinder (left side)
  var cxC = 250, cyC = 230;
  var R = 60, halfLen = 100, ellH = 18;

  // Body
  var bg = ctx.createLinearGradient(cxC - R, 0, cxC + R, 0);
  bg.addColorStop(0, 'rgba(129,199,132,0.32)');
  bg.addColorStop(1, 'rgba(129,199,132,0.08)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(cxC - R, cyC - halfLen);
  ctx.lineTo(cxC - R, cyC + halfLen);
  ctx.ellipse(cxC, cyC + halfLen, R, ellH, 0, Math.PI, 0, true);
  ctx.lineTo(cxC + R, cyC - halfLen);
  ctx.ellipse(cxC, cyC - halfLen, R, ellH, 0, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COL.shaftStroke; ctx.lineWidth = 1.4;
  ctx.stroke();
  // top ellipse
  ctx.beginPath();
  ctx.ellipse(cxC, cyC - halfLen, R, ellH, 0, 0, Math.PI * 2);
  ctx.stroke();
  // bottom ellipse
  ctx.beginPath();
  ctx.ellipse(cxC, cyC + halfLen, R, ellH, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Number of helix turns to show
  var turns = 4;
  var segs = 400;

  // Mapping unwrap: param u along helix, from 0..1 (covering 2*PI*turns angularly)
  // unwrapped position: x_un = base_x + u * (2 * Math.PI * R * turns_compressed)
  // We'll compress the unwrapped length to fit ~360 px
  var unwrapStartX = cxC + R + 80;
  var unwrapBaseY  = cyC + halfLen;
  var unwrapW      = 420;
  var unwrapH      = 2 * halfLen;

  // Lerp between full helix (t=0) and full unwrap (t=1)
  ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.strokeStyle = COL.helix;
  ctx.beginPath();
  for (var s = 0; s <= segs; s++) {
    var u = s / segs;
    var theta = u * 2 * Math.PI * turns;
    // helix coords
    var hx = cxC + R * Math.cos(theta);
    var hyAxial = cyC - halfLen + u * 2 * halfLen;
    var hy = hyAxial + Math.sin(theta) * ellH;
    // unwrap coords
    var ux = unwrapStartX + u * unwrapW;
    var uy = unwrapBaseY - u * unwrapH;
    var x = lerp(hx, ux, t);
    var y = lerp(hy, uy, t);
    if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw the triangle outline at t > 0.5
  if (t > 0.4) {
    var alpha = clamp((t - 0.4) / 0.6, 0, 1);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = COL.helix; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(unwrapStartX, unwrapBaseY);
    ctx.lineTo(unwrapStartX + unwrapW, unwrapBaseY);
    ctx.lineTo(unwrapStartX + unwrapW, unwrapBaseY - unwrapH);
    ctx.stroke();
    // labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    drawHaloText('π × d × turns (circumference)', unwrapStartX + unwrapW / 2, unwrapBaseY + 8, COL.major, '10px sans-serif');
    ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    drawHaloText('Pitch × turns', unwrapStartX + unwrapW + 6, unwrapBaseY - unwrapH / 2, COL.pitch, '10px sans-serif');
    ctx.textAlign = 'center';
    drawHaloText('Helix path', unwrapStartX + unwrapW / 2 - 40, unwrapBaseY - unwrapH / 2 - 8, COL.helix, 'italic 10px sans-serif');
    ctx.globalAlpha = 1.0;
  }

  // Caption
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  drawHaloText('A thread is a helical ridge wrapped around a cylinder. Unwrap it: it becomes a triangle.', W / 2, H - 38, COL.dim, '11px sans-serif');
  drawHaloText('Helix angle λ depends on the ratio of pitch to circumference.', W / 2, H - 22, COL.dim, '11px sans-serif');
}

function drawLesson2() {
  drawHaloText('Thread Terminology', W / 2, 20, COL.text, 'bold 14px sans-serif');
  var cx = W / 2, cy = 230, majR = 80, minR = 40, pp = 150;
  var startX = cx - pp * 1.5;
  ctx.fillStyle = COL.shaftFill;
  ctx.fillRect(startX - 20, cy - minR, pp * 3 + 40, minR * 2);

  for (var i = 0; i < 3; i++) {
    var tx = startX + i * pp + pp / 2;
    drawRealisticTooth(tx, cy, majR, minR, pp, true, pp * 0.125, false);
    drawRealisticTooth(tx, cy, majR, minR, pp, false, pp * 0.125, false);
  }

  ctx.strokeStyle = 'rgba(129,199,132,0.4)'; ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(startX - 20, cy - minR); ctx.lineTo(startX + pp * 3 + 20, cy - minR);
  ctx.moveTo(startX - 20, cy + minR); ctx.lineTo(startX + pp * 3 + 20, cy + minR);
  ctx.stroke();

  // CREST
  var crestX = startX + pp * 1.5;
  drawHaloText('CREST', crestX, cy - majR - 16, COL.major, 'bold 11px sans-serif');
  ctx.fillStyle = COL.major; ctx.beginPath(); ctx.arc(crestX, cy - majR, 3, 0, Math.PI * 2); ctx.fill();

  // ROOT
  var rootX = startX + pp;
  drawHaloText('ROOT', rootX, cy - minR + 22, COL.minor, 'bold 11px sans-serif');
  ctx.fillStyle = COL.minor; ctx.beginPath(); ctx.arc(rootX, cy - minR, 3, 0, Math.PI * 2); ctx.fill();

  // FLANK
  var flankX = startX + pp * 0.75;
  var flankY = cy - (majR + minR) / 2;
  ctx.save(); ctx.translate(flankX, flankY); ctx.rotate(-0.5);
  drawHaloText('FLANK', 0, 0, COL.pitch, 'bold 11px sans-serif');
  ctx.restore();

  // Thread angle
  var angleTX = startX + pp * 2;
  ctx.strokeStyle = COL.angle; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(angleTX, cy - majR, 24, Math.PI / 2 - Math.PI / 6, Math.PI / 2 + Math.PI / 6);
  ctx.stroke();
  drawHaloText('60°', angleTX, cy - majR + 38, COL.angle, 'bold 11px sans-serif');
  drawHaloText('THREAD ANGLE', angleTX, cy - majR + 54, COL.angle, '10px sans-serif');

  drawHaloText('Metric threads always have a 60° thread angle (ISO 261)', W / 2, H - 26, COL.dim, '11px sans-serif');
}

function drawLesson3() {
  drawHaloText('Key Dimensions — M10 × 1.5 Example', W / 2, 20, COL.text, 'bold 14px sans-serif');
  var res = calcThread(10, 1.5);
  var majR = 70, minR = 32, pitchR = 51, pp = 120;
  var profL = 180, profCY = 220;

  ctx.fillStyle = COL.shaftFill;
  ctx.fillRect(profL - 30, profCY - minR, pp * 3 + 60, minR * 2);

  for (var i = 0; i < 3; i++) {
    var tx = profL + i * pp + pp / 2;
    drawRealisticTooth(tx, profCY, majR, minR, pp, true, pp * 0.125, false);
    drawRealisticTooth(tx, profCY, majR, minR, pp, false, pp * 0.125, false);
  }

  ctx.strokeStyle = 'rgba(129,199,132,0.3)'; ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(profL - 30, profCY - minR); ctx.lineTo(profL + pp * 3 + 30, profCY - minR);
  ctx.moveTo(profL - 30, profCY + minR); ctx.lineTo(profL + pp * 3 + 30, profCY + minR);
  ctx.stroke();

  dimArrowV(profL - 60, profCY - majR, profCY + majR, COL.major, 'd = 10.000', 'left', false);
  dimArrowV(profL - 38, profCY - pitchR, profCY + pitchR, COL.pitch, 'd₂ = ' + fmt3(res.d2), 'left', false);
  dimArrowV(profL - 16, profCY - minR, profCY + minR, COL.minor, 'd₁ = ' + fmt3(res.d1), 'left', false);

  var t1x = profL + pp / 2, t2x = t1x + pp;
  dimArrowH(profCY - majR - 16, t1x, t2x, COL.helix, 'P = 1.500', 'top', false);

  dimArrowV(profL + pp * 3 + 16, profCY - majR, profCY - minR, COL.depth, 'h = ' + fmt3(res.h), 'right', false);

  var fmX = 620, fmY = 80;
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  drawHaloText('d₂ = d − 0.6495·P = ' + fmt3(res.d2), fmX, fmY,      COL.pitch, 'bold 11px sans-serif');
  drawHaloText('d₁ = d − 1.0825·P = ' + fmt3(res.d1), fmX, fmY + 22, COL.minor, 'bold 11px sans-serif');
  drawHaloText('h   = 0.5413·P = ' + fmt3(res.h),            fmX, fmY + 44, COL.depth, 'bold 11px sans-serif');
  drawHaloText('λ  = arctan(P/πd₂) = ' + fmtDeg(res.lambdaDeg), fmX, fmY + 66, COL.helix, 'bold 11px sans-serif');
}

function drawLesson4() {
  drawHaloText('Reading ISO 261 Designations', W / 2, 20, COL.text, 'bold 14px sans-serif');
  drawHaloText('M8 × 1.25', W / 2, 90, '#ffffff', 'bold 32px "JetBrains Mono", monospace');

  var parts = [
    { x: W / 2 - 75, label: 'Metric thread',        color: '#ef6c00' },
    { x: W / 2 - 30, label: 'Major dia (8 mm)',     color: COL.major },
    { x: W / 2 + 50, label: 'Pitch (1.25 mm)',      color: COL.helix }
  ];

  parts.forEach(function (p, i) {
    var baseY = 110;
    var lineLen = 26 + i * 22;
    ctx.strokeStyle = p.color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.x, baseY); ctx.lineTo(p.x, baseY + lineLen); ctx.stroke();
    ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, baseY, 3.5, 0, Math.PI * 2); ctx.fill();
    drawHaloText(p.label, p.x, baseY + lineLen + 12, p.color, 'bold 11px sans-serif');
  });

  drawHaloText('Size Comparison', W / 2, 220, COL.text, 'bold 12px sans-serif');
  var sizes = [
    { label: 'M4 × 0.7', d: 4, P: 0.7, cx: W / 2 - 160 },
    { label: 'M10 × 1.5', d: 10, P: 1.5, cx: W / 2 + 160 }
  ];
  sizes.forEach(function (s) {
    var r = calcThread(s.d, s.P);
    var scale = 12;
    var majR = s.d / 2 * scale;
    var drawMinR = (s.d - r.h * 2) / 2 * scale;
    var pp = s.P * scale * 4;
    var cy = 320;

    ctx.fillStyle = COL.shaftFill;
    ctx.fillRect(s.cx - pp, cy - drawMinR, pp * 2, drawMinR * 2);
    for (var i = 0; i < 2; i++) {
      var tx = s.cx - pp / 2 + i * pp;
      drawRealisticTooth(tx, cy, majR, drawMinR, pp, true, pp * 0.125, false);
      drawRealisticTooth(tx, cy, majR, drawMinR, pp, false, pp * 0.125, false);
    }
    ctx.strokeStyle = COL.shaftStroke; ctx.lineWidth = 1;
    ctx.strokeRect(s.cx - pp, cy - drawMinR, pp * 2, drawMinR * 2);

    drawHaloText(s.label, s.cx, cy + majR + 22, COL.text, 'bold 11px "JetBrains Mono", monospace');
  });
}

function drawLesson5() {
  drawHaloText('Coarse vs Fine Pitch — M10 Example', W / 2, 20, COL.text, 'bold 14px sans-serif');
  var configs = [
    { label: 'Coarse: M10 × 1.5', P: 1.5, cx: W / 2 - 200, col: '#3ddc84' },
    { label: 'Fine: M10 × 1.0',   P: 1.0, cx: W / 2 + 200, col: '#ffb74d' }
  ];
  configs.forEach(function (c) {
    var r = calcThread(10, c.P);
    var majR = 55, pp = 80;
    var depthPx = Math.max(r.h / r.P * pp, 20);
    var minR = majR - depthPx;
    var cy = 240;
    var nTeeth = 3;
    var startX = c.cx - nTeeth * pp / 2;

    ctx.fillStyle = COL.shaftFill;
    ctx.fillRect(startX - 10, cy - minR, nTeeth * pp + 20, minR * 2);

    for (var i = 0; i < nTeeth; i++) {
      var tx = startX + i * pp + pp / 2;
      drawRealisticTooth(tx, cy, majR, minR, pp, true, pp * 0.125, false);
      drawRealisticTooth(tx, cy, majR, minR, pp, false, pp * 0.125, false);
    }
    ctx.strokeStyle = 'rgba(129,199,132,0.3)'; ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(startX - 10, cy - minR); ctx.lineTo(startX + nTeeth * pp + 10, cy - minR);
    ctx.moveTo(startX - 10, cy + minR); ctx.lineTo(startX + nTeeth * pp + 10, cy + minR);
    ctx.stroke();

    var t1 = startX + pp / 2, t2 = t1 + pp;
    dimArrowH(cy - majR - 14, t1, t2, c.col, 'P = ' + c.P, 'top', false);

    drawHaloText(c.label, c.cx, 78, c.col, 'bold 11px sans-serif');
    drawHaloText('Depth: ' + fmt3(r.h) + ' mm', c.cx, cy + majR + 22, COL.dim, '10px sans-serif');
    drawHaloText('d₁: ' + fmt3(r.d1) + ' mm', c.cx, cy + majR + 36, COL.dim, '10px sans-serif');
  });
  drawHaloText('Coarse: stronger, easier assembly  |  Fine: vibration resistance, precision', W / 2, H - 22, COL.dim, '11px sans-serif');
}

function renderLearn() {
  var lesson = LESSONS[state.learnIdx];
  $('learn-title').textContent = lesson.title;
  $('learn-body').innerHTML = lesson.body;
  var dots = '';
  for (var i = 0; i < LESSONS.length; i++) {
    dots += '<button class="learn-dot' + (i === state.learnIdx ? ' active' : '') + '" data-idx="' + i + '" aria-label="Lesson ' + (i + 1) + '"></button>';
  }
  $('learn-dots').innerHTML = dots;
  $('btn-learn-prev').disabled = state.learnIdx === 0;
  $('btn-learn-next').disabled = state.learnIdx === LESSONS.length - 1;
}

// ── G5: Animation loop (pitch transition + 3D rotation + lesson1) ───
var lastTime = 0;
function animTick(t) {
  if (!lastTime) lastTime = t;
  var dt = Math.min(0.05, (t - lastTime) / 1000);
  lastTime = t;
  var needRender = false;

  // pitch tween
  if (Math.abs(state.displayPitch - state.currentPitch) > 0.0005) {
    var diff = state.currentPitch - state.displayPitch;
    state.displayPitch += diff * Math.min(1, dt * 8);
    if (Math.abs(diff) < 0.001) state.displayPitch = state.currentPitch;
    needRender = true;
  }

  // 3D rotation
  if (state.mode === 'explore' && state.view === 'iso') {
    state.isoAngle += dt * 0.45;
    needRender = true;
  }

  // Lesson 1 unwrap animation cycle
  if (state.mode === 'learn' && state.learnIdx === 0) {
    lessonAnimT += dt * 0.25;
    if (lessonAnimT > 1.6) lessonAnimT = 0; // 1.6s pause then restart
    needRender = true;
  }

  if (needRender) render();
  state.animRAF = requestAnimationFrame(animTick);
}

// ── I1+I2: Hover / Tooltip / Bidirectional highlight ────────────────
function dimTitle(name, r) {
  switch (name) {
    case 'd':      return { name: 'Major diameter (d)',      val: fmt3(r.d) + ' mm' };
    case 'd2':     return { name: 'Pitch diameter (d₂)', val: fmt3(r.d2) + ' mm' };
    case 'd1':     return { name: 'Minor diameter (d₁)', val: fmt3(r.d1) + ' mm' };
    case 'P':      return { name: 'Pitch (P)',                val: fmt3(r.P) + ' mm' };
    case 'h':      return { name: 'Thread depth (h)',         val: fmt3(r.h) + ' mm' };
    case 'angle':  return { name: 'Thread angle',             val: '60°' };
    case 'lambda': return { name: 'Helix angle (λ)',     val: fmtDeg(r.lambdaDeg) };
  }
  return { name: name, val: '' };
}

function setHoverDim(name) {
  if (state.hoverDim === name) return;
  state.hoverDim = name;
  Array.prototype.forEach.call(document.querySelectorAll('.rc-row'), function (row) {
    row.classList.toggle('hl', row.dataset.dim === name);
  });
  render();
}

var tooltipEl = $('canvas-tooltip');
function showTooltip(name, clientX, clientY) {
  if (!tooltipEl || !state.result) return;
  var info = dimTitle(name, state.result);
  tooltipEl.innerHTML = '<span class="tt-name">' + info.name + '</span>' + info.val;
  var rect = canvas.getBoundingClientRect();
  var px = clientX - rect.left + 12;
  var py = clientY - rect.top - 10;
  tooltipEl.style.left = px + 'px';
  tooltipEl.style.top  = py + 'px';
  tooltipEl.classList.add('show');
  tooltipEl.setAttribute('aria-hidden', 'false');
}
function hideTooltip() {
  if (!tooltipEl) return;
  tooltipEl.classList.remove('show');
  tooltipEl.setAttribute('aria-hidden', 'true');
}

function canvasToLogical(clientX, clientY) {
  var rect = canvas.getBoundingClientRect();
  var x = (clientX - rect.left) * (W / rect.width);
  var y = (clientY - rect.top)  * (H / rect.height);
  return { x: x, y: y };
}

canvas.addEventListener('pointermove', function (e) {
  if (state.mode !== 'explore' || state.view !== 'section') {
    if (state.hoverDim) { setHoverDim(null); hideTooltip(); }
    return;
  }
  var p = canvasToLogical(e.clientX, e.clientY);
  var found = null;
  for (var i = 0; i < hitRegions.length; i++) {
    var r = hitRegions[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) { found = r.name; break; }
  }
  if (found) {
    setHoverDim(found);
    showTooltip(found, e.clientX, e.clientY);
    canvas.style.cursor = 'pointer';
  } else {
    if (state.hoverDim) setHoverDim(null);
    hideTooltip();
    canvas.style.cursor = 'crosshair';
  }
});
canvas.addEventListener('pointerleave', function () {
  if (state.hoverDim) setHoverDim(null);
  hideTooltip();
});

// Sidebar row hover → highlight canvas dim
Array.prototype.forEach.call(document.querySelectorAll('.rc-row'), function (row) {
  row.addEventListener('mouseenter', function () {
    if (state.mode !== 'explore') return;
    setHoverDim(row.dataset.dim);
  });
  row.addEventListener('mouseleave', function () {
    setHoverDim(null);
  });
});

// ── I3: Context menu ────────────────────────────────────────────────
var ctxMenu = $('canvas-menu');
canvas.addEventListener('contextmenu', function (e) {
  e.preventDefault();
  var vw = window.innerWidth, vh = window.innerHeight;
  var mw = 230, mh = 240;
  ctxMenu.style.left = Math.min(e.clientX, vw - mw - 8) + 'px';
  ctxMenu.style.top  = Math.min(e.clientY, vh - mh - 8) + 'px';
  ctxMenu.classList.add('show');
  ctxMenu.setAttribute('aria-hidden', 'false');
});
document.addEventListener('click', function (e) {
  if (!ctxMenu.contains(e.target)) {
    ctxMenu.classList.remove('show');
    ctxMenu.setAttribute('aria-hidden', 'true');
  }
});
ctxMenu.addEventListener('click', function (e) {
  var btn = e.target.closest('.ctx-item'); if (!btn) return;
  var act = btn.dataset.act;
  ctxMenu.classList.remove('show');
  ctxMenu.setAttribute('aria-hidden', 'true');
  if (act === 'png') exportPNG();
  else if (act === 'csv') copyCSV();
  else if (act === 'desig') copyDesignation();
  else if (act === 'toggle3d') toggleView();
  else if (act === 'reset') resetTool();
});

function exportPNG() {
  try {
    var url = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    var td = THREAD_DATA[state.threadIdx];
    a.href = url;
    a.download = 'thread-' + td.label.replace('.', '_') + '-P' + state.currentPitch.toFixed(2) + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  } catch (err) { console.warn('PNG export failed:', err); }
}
function copyCSV() {
  var r = state.result; if (!r) return;
  var td = THREAD_DATA[state.threadIdx];
  var csv = 'Parameter,Value,Unit\n' +
    'Designation,' + td.label + ' x ' + fmt3(r.P) + ',\n' +
    'Major diameter (d),' + fmt3(r.d) + ',mm\n' +
    'Pitch (P),' + fmt3(r.P) + ',mm\n' +
    'Pitch diameter (d2),' + fmt3(r.d2) + ',mm\n' +
    'Minor diameter (d1),' + fmt3(r.d1) + ',mm\n' +
    'Thread depth (h),' + fmt3(r.h) + ',mm\n' +
    'Thread angle,60,deg\n' +
    'Helix angle (lambda),' + r.lambdaDeg.toFixed(3) + ',deg\n';
  copyText(csv);
}
function copyDesignation() {
  var td = THREAD_DATA[state.threadIdx];
  copyText(td.label + ' x ' + fmt3(state.currentPitch));
}
function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text);
  } else {
    var ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }
}
function toggleView() {
  state.view = state.view === 'iso' ? 'section' : 'iso';
  Array.prototype.forEach.call(document.querySelectorAll('#view-tabs .pill'), function (b) {
    b.classList.toggle('active', b.dataset.view === state.view);
  });
  render();
}
function resetTool() {
  state.threadIdx = 5;
  state.view = 'section';
  state.showDims = true; state.showLabels = true; state.showEquation = true;
  state.showPitchLine = true; state.showGrid = false;
  $('chk-dims').checked = true; $('chk-labels').checked = true; $('chk-equation').checked = true;
  $('chk-pitchline').checked = true; $('chk-grid').checked = false;
  $('thread-size-sel').value = 5;
  updateSliderForThread(THREAD_DATA[5]);
  Array.prototype.forEach.call(document.querySelectorAll('#view-tabs .pill'), function (b) {
    b.classList.toggle('active', b.dataset.view === 'section');
  });
  render();
}

// ── Mode + view switching ───────────────────────────────────────────
function setMode(mode) {
  state.mode = mode;
  $('learn-panel').style.display    = mode === 'learn'    ? '' : 'none';
  $('explore-panel').style.display  = mode === 'explore'  ? '' : 'none';
  $('practice-panel').style.display = mode === 'practice' ? '' : 'none';
  $('quiz-panel').style.display     = mode === 'quiz'     ? '' : 'none';
  $('quiz-result').style.display    = 'none';

  if (mode === 'explore') {
    var td = THREAD_DATA[state.threadIdx];
    updateSliderForThread(td);
    render();
  } else if (mode === 'practice') {
    state.pChecked = false; newPractice();
  } else if (mode === 'quiz') {
    startQuiz();
  } else {
    lessonAnimT = 0;
    render();
  }
}

// ── Practice ────────────────────────────────────────────────────────
function newPractice() {
  var idx = Math.floor(Math.random() * THREAD_DATA.length);
  state.threadIdx = idx;
  state.pChecked = false;
  var td = THREAD_DATA[idx];
  $('thread-size-sel').value = idx;

  $('p-question').innerHTML =
    'Given <strong>' + td.label + ' × ' + td.coarse + '</strong>, calculate:';
  ['p-d2', 'p-d1', 'p-h'].forEach(function (id) {
    $(id).value = ''; $(id).className = 'pi-input';
  });
  $('p-feedback').innerHTML = ''; $('p-feedback').className = 'feedback';
  $('btn-p-check').disabled = false;
  $('p-solution').style.display = 'none';
  $('p-score').textContent = state.pScore;
  $('p-attempts').textContent = state.pAttempts;

  state.currentPitch = td.coarse;
  state.displayPitch = td.coarse;
  recalc();
  drawSectionView(state.result, false);
}

function checkPractice() {
  if (state.pChecked) return;
  state.pChecked = true;
  state.pAttempts++;
  var r = state.result;
  var checks = [
    { id: 'p-d2', correct: r.d2 },
    { id: 'p-d1', correct: r.d1 },
    { id: 'p-h',  correct: r.h }
  ];
  var allOk = true;
  checks.forEach(function (c) {
    var val = parseFloat($(c.id).value);
    var ok = !isNaN(val) && Math.abs(val - c.correct) < 0.002;
    $(c.id).className = 'pi-input ' + (ok ? 'pi-ok' : 'pi-err');
    if (!ok) allOk = false;
  });
  if (allOk) {
    state.pScore++;
    $('p-feedback').innerHTML = '✔ Perfect! All values correct.';
    $('p-feedback').className = 'feedback ok';
  } else {
    $('p-feedback').innerHTML = '✘ Some values incorrect. See solution below.';
    $('p-feedback').className = 'feedback err';
  }
  $('p-score').textContent = state.pScore;
  $('p-attempts').textContent = state.pAttempts;
  $('btn-p-check').disabled = true;
  renderPracticeSolution(r);
  $('p-solution').style.display = '';
  drawSectionView(r, true);
}

function renderPracticeSolution(r) {
  var td = THREAD_DATA[state.threadIdx];
  var html = '';
  html += '<div class="sol-row"><span>Thread</span><span>' + td.label + ' × ' + r.P + '</span></div>';
  html += '<div class="sol-row"><span>d (major)</span><span>' + fmt3(r.d) + ' mm</span></div>';
  html += '<div class="sol-divider"></div>';
  html += '<div class="sol-row"><span>d₂ (pitch dia)</span><span><strong>' + fmt3(r.d2) + '</strong> mm</span></div>';
  html += '<div class="sol-row"><span>d₁ (minor dia)</span><span><strong>' + fmt3(r.d1) + '</strong> mm</span></div>';
  html += '<div class="sol-row"><span>h (thread depth)</span><span><strong>' + fmt3(r.h) + '</strong> mm</span></div>';
  html += '<div class="sol-divider"></div>';
  html += '<div class="sol-row"><span>λ (helix angle)</span><span>' + fmtDeg(r.lambdaDeg) + '</span></div>';
  $('p-solution-content').innerHTML = html;
}

// ── Quiz ────────────────────────────────────────────────────────────
var QUIZ_TYPES = [
  { key: 'd2', label: 'Pitch diameter d₂ (mm)', tol: 0.002 },
  { key: 'd1', label: 'Minor diameter d₁ (mm)', tol: 0.002 },
  { key: 'h',  label: 'Thread depth h (mm)',        tol: 0.002 },
  { key: 'lambdaDeg', label: 'Helix angle λ (°)', tol: 0.05 },
  { key: 'd2', label: 'Pitch diameter d₂ (mm)', tol: 0.002 }
];

function startQuiz() {
  var used = {};
  var qs = [];
  while (qs.length < QUIZ_TOTAL) {
    var idx = Math.floor(Math.random() * THREAD_DATA.length);
    var typeIdx = qs.length % QUIZ_TYPES.length;
    var td = THREAD_DATA[idx];
    var key = td.label + QUIZ_TYPES[typeIdx].key;
    if (used[key]) continue;
    used[key] = true;
    var r = calcThread(td.d, td.coarse);
    qs.push({ threadIdx: idx, type: QUIZ_TYPES[typeIdx], result: r, td: td });
  }
  state.quizQs = qs;
  state.quizIdx = 0;
  state.quizAnswers = [];
  state.quizAnswered = false;
  $('quiz-result').style.display = 'none';
  $('quiz-panel').style.display = '';
  showQuizQ(0);
}

function showQuizQ(idx) {
  var q = state.quizQs[idx];
  state.threadIdx = q.threadIdx;
  state.quizAnswered = false;
  $('thread-size-sel').value = q.threadIdx;
  state.currentPitch = q.td.coarse;
  state.displayPitch = q.td.coarse;
  recalc();
  drawSectionView(state.result, false);

  $('quiz-q-num').textContent = idx + 1;
  $('quiz-q-total').textContent = QUIZ_TOTAL;
  $('q-designation').innerHTML = q.td.label + ' × ' + q.td.coarse;
  $('q-value-label').textContent = q.type.label;
  $('q-value-input').value = '';
  $('q-value-input').className = 'qi-input';
  $('q-value-input').disabled = false;
  $('quiz-feedback').innerHTML = '';
  $('quiz-feedback').className = 'quiz-feedback';
  $('btn-quiz-submit').style.display = '';
  $('btn-quiz-next').style.display = 'none';
}

function submitQuiz() {
  if (state.quizAnswered) return;
  state.quizAnswered = true;
  var q = state.quizQs[state.quizIdx];
  var r = q.result;
  var correct = r[q.type.key];
  var given = parseFloat($('q-value-input').value);
  var ok = !isNaN(given) && Math.abs(given - correct) < q.type.tol;
  $('q-value-input').className = 'qi-input ' + (ok ? 'pi-ok' : 'pi-err');
  $('q-value-input').disabled = true;
  state.quizAnswers.push({ given: given, correct: correct, ok: ok, type: q.type });

  if (ok) {
    $('quiz-feedback').innerHTML = '✔ Correct!';
    $('quiz-feedback').className = 'quiz-feedback ok';
  } else {
    var fmtFn = q.type.key === 'lambdaDeg' ? fmtDeg : fmt3;
    $('quiz-feedback').innerHTML = '✘ Answer: ' + fmtFn(correct);
    $('quiz-feedback').className = 'quiz-feedback err';
  }
  $('btn-quiz-submit').style.display = 'none';
  $('btn-quiz-next').style.display = '';
  $('btn-quiz-next').textContent = state.quizIdx + 1 >= QUIZ_TOTAL ? 'See Results' : 'Next →';
  drawSectionView(state.result, true);
}
function nextQuiz() {
  if (state.quizIdx + 1 >= QUIZ_TOTAL) showQuizResult();
  else { state.quizIdx++; showQuizQ(state.quizIdx); }
}
function showQuizResult() {
  $('quiz-panel').style.display = 'none';
  $('quiz-result').style.display = '';
  var total = state.quizAnswers.length;
  var correct = state.quizAnswers.filter(function (a) { return a.ok; }).length;

  $('qr-score').textContent = correct + ' / ' + total;
  $('qr-score').className = 'qr-score ' +
    (correct === total ? 'perfect' : correct >= 3 ? 'good' : 'poor');
  var stars = correct === total ? 3 : correct >= 4 ? 2 : correct >= 2 ? 1 : 0;
  $('qr-stars').textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
  var verdicts = ['Keep practising!', 'Getting there!', 'Good effort!', 'Excellent!'];
  $('qr-verdict').textContent = verdicts[stars];

  var rows = '';
  state.quizAnswers.forEach(function (a, i) {
    var q = state.quizQs[i];
    var cls = a.ok ? 'ok' : 'err';
    var fmtFn = a.type.key === 'lambdaDeg' ? fmtDeg : fmt3;
    rows += '<div class="qr-row ' + cls + '">' +
            '<div class="qr-q">' + (i + 1) + '</div>' +
            '<div class="qr-desig">' + q.td.label + ' × ' + q.td.coarse + '</div>' +
            '<div class="qr-given">' + (!isNaN(a.given) ? fmtFn(a.given) : '—') + '</div>' +
            '<div class="qr-correct">' + fmtFn(a.correct) + '</div>' +
            '<div class="qr-icon">' + (a.ok ? '✔' : '✘') + '</div>' +
            '</div>';
  });
  $('qr-rows').innerHTML = rows;
}

// ── Event Binding ───────────────────────────────────────────────────
Array.prototype.forEach.call(document.querySelectorAll('#mode-tabs .pill'), function (btn) {
  btn.addEventListener('click', function () {
    Array.prototype.forEach.call(document.querySelectorAll('#mode-tabs .pill'), function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    setMode(btn.dataset.value);
  });
});
Array.prototype.forEach.call(document.querySelectorAll('#view-tabs .pill'), function (btn) {
  btn.addEventListener('click', function () {
    Array.prototype.forEach.call(document.querySelectorAll('#view-tabs .pill'), function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.view = btn.dataset.view;
    render();
  });
});

$('thread-size-sel').addEventListener('change', function () {
  state.threadIdx = parseInt($('thread-size-sel').value, 10);
  if (state.mode !== 'explore') return;
  updateSliderForThread(THREAD_DATA[state.threadIdx]);
  render();
});

var rafPending = false;
function scheduleRender() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(function () { render(); rafPending = false; });
}

$('pitch-slider').addEventListener('input', function () {
  state.currentPitch = parseFloat($('pitch-slider').value);
  $('pitch-val').textContent = state.currentPitch.toFixed(3) + ' mm';
  // jump display close to current for input dragging feel (small gap to keep tween)
  scheduleRender();
});

$('stp-pitch').addEventListener('change', function () {
  var v = parseFloat($('stp-pitch').value);
  if (isNaN(v)) return;
  v = clamp(v, 0.1, 10);
  state.currentPitch = v;
  $('pitch-slider').value = v;
  $('pitch-val').textContent = v.toFixed(3) + ' mm';
  render();
});
$('stp-minus').addEventListener('click', function () {
  state.currentPitch = Math.max(0.1, +(state.currentPitch - 0.05).toFixed(2));
  $('pitch-slider').value = state.currentPitch;
  $('stp-pitch').value = state.currentPitch.toFixed(2);
  $('pitch-val').textContent = state.currentPitch.toFixed(3) + ' mm';
  render();
});
$('stp-plus').addEventListener('click', function () {
  state.currentPitch = +(state.currentPitch + 0.05).toFixed(2);
  $('pitch-slider').value = state.currentPitch;
  $('stp-pitch').value = state.currentPitch.toFixed(2);
  $('pitch-val').textContent = state.currentPitch.toFixed(3) + ' mm';
  render();
});

$('preset-btns').addEventListener('click', function (e) {
  var btn = e.target.closest('.preset-btn'); if (!btn) return;
  state.currentPitch = parseFloat(btn.dataset.pitch);
  $('pitch-slider').value = state.currentPitch;
  $('stp-pitch').value = state.currentPitch.toFixed(2);
  $('pitch-val').textContent = state.currentPitch.toFixed(3) + ' mm';
  render();
});

// Feature toggles
function wireToggle(id, prop) {
  var el = $(id); if (!el) return;
  el.addEventListener('change', function () {
    state[prop] = el.checked;
    render();
  });
}
wireToggle('chk-dims', 'showDims');
wireToggle('chk-labels', 'showLabels');
wireToggle('chk-equation', 'showEquation');
wireToggle('chk-pitchline', 'showPitchLine');
wireToggle('chk-grid', 'showGrid');

// Practice / Quiz
$('btn-p-check').addEventListener('click', checkPractice);
$('btn-p-new').addEventListener('click', newPractice);
$('btn-quiz-submit').addEventListener('click', submitQuiz);
$('btn-quiz-next').addEventListener('click', nextQuiz);
$('btn-quiz-retry').addEventListener('click', function () {
  $('quiz-result').style.display = 'none';
  startQuiz();
});

Array.prototype.forEach.call(document.querySelectorAll('.pi-input'), function (el) {
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !state.pChecked) checkPractice();
  });
});
$('q-value-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !state.quizAnswered) submitQuiz();
});

// Learn nav
$('btn-learn-prev').addEventListener('click', function () {
  if (state.learnIdx > 0) { state.learnIdx--; lessonAnimT = 0; render(); }
});
$('btn-learn-next').addEventListener('click', function () {
  if (state.learnIdx < LESSONS.length - 1) { state.learnIdx++; lessonAnimT = 0; render(); }
});
$('learn-dots').addEventListener('click', function (e) {
  var dot = e.target.closest('.learn-dot');
  if (dot) { state.learnIdx = parseInt(dot.dataset.idx, 10); lessonAnimT = 0; render(); }
});

// Calc modal
$('btn-calc').addEventListener('click', openCalcModal);
$('calc-modal-close').addEventListener('click', closeCalcModal);
$('calc-modal').addEventListener('click', function (e) {
  if (e.target === $('calc-modal')) closeCalcModal();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && $('calc-modal').classList.contains('active')) closeCalcModal();
  // Arrow keys
  if (state.mode === 'learn') {
    if (e.key === 'ArrowLeft' && state.learnIdx > 0) { state.learnIdx--; lessonAnimT = 0; render(); }
    if (e.key === 'ArrowRight' && state.learnIdx < LESSONS.length - 1) { state.learnIdx++; lessonAnimT = 0; render(); }
  } else if (state.mode === 'explore' && document.activeElement && document.activeElement.tagName !== 'INPUT') {
    if (e.key === 'ArrowLeft')  { $('stp-minus').click(); }
    if (e.key === 'ArrowRight') { $('stp-plus').click(); }
  }
});

// ── Init ────────────────────────────────────────────────────────────
window.addEventListener('resize', resizeCanvas);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeCanvas).observe(canvas);

updateSliderForThread(THREAD_DATA[state.threadIdx]);
resizeCanvas();
state.animRAF = requestAnimationFrame(animTick);

})();

/* ── ISO 261 thread chart: live filter ───────────────────────────────────
   Filters both the coarse and fine tables at once. The tables are static
   HTML so they stay crawlable; this only hides rows client-side.          */
(function () {
  'use strict';

  var input = document.getElementById('th-filter');
  var count = document.getElementById('th-count');
  var tables = document.querySelectorAll('table.thread-chart');
  if (!input || !tables.length) return;

  var rows = [];
  Array.prototype.forEach.call(tables, function (t) {
    rows = rows.concat(Array.prototype.slice.call(t.tBodies[0].rows));
  });
  var total = rows.length;

  function norm(s) {
    return s.toLowerCase().replace(/[\s×x]/g, '');
  }

  function report(shown) {
    if (count) {
      count.textContent = shown === total
        ? total + ' sizes'
        : shown + ' of ' + total + ' sizes';
    }
  }

  input.addEventListener('input', function () {
    var q = norm(input.value.trim());
    if (!q) {
      rows.forEach(function (r) { r.hidden = false; });
      report(total);
      return;
    }
    // Match on the designation cell only. Bare numbers are treated as a
    // size, so "12" finds M12 and M12x1.5 but not every row containing 12.
    if (/^\d/.test(q)) q = 'm' + q;
    var shown = 0;
    rows.forEach(function (r) {
      var hit = norm(r.cells[0].textContent).indexOf(q) === 0;
      r.hidden = !hit;
      if (hit) shown++;
    });
    report(shown);
  });

  report(total);
})();
