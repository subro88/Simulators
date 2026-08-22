(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     1. MATERIALS DATA
     ══════════════════════════════════════════════════════════════ */
  var MATERIALS = [
    { name: 'Steel (carbon)',     alpha: 12.0e-6,  E: 200e3, nu: 0.30, color: '#78909c' },
    { name: 'Stainless 304',      alpha: 17.3e-6,  E: 193e3, nu: 0.29, color: '#b0bec5' },
    { name: 'Aluminum 6061',      alpha: 23.6e-6,  E: 68.9e3, nu: 0.33, color: '#90caf9' },
    { name: 'Copper',             alpha: 16.5e-6,  E: 117e3, nu: 0.34, color: '#ffab91' },
    { name: 'Brass',              alpha: 19.0e-6,  E: 100e3, nu: 0.34, color: '#ffd54f' },
    { name: 'Cast Iron',          alpha: 10.5e-6,  E: 170e3, nu: 0.26, color: '#8d6e63' },
    { name: 'Titanium',           alpha: 8.6e-6,   E: 116e3, nu: 0.34, color: '#ce93d8' },
    { name: 'Invar',              alpha: 1.2e-6,   E: 141e3, nu: 0.29, color: '#a5d6a7' },
    { name: 'Concrete',           alpha: 12.0e-6,  E: 30e3,  nu: 0.20, color: '#bdbdbd' },
    { name: 'Glass (boro)',       alpha: 3.3e-6,   E: 63e3,  nu: 0.20, color: '#80deea' }
  ];
  var CUSTOM_COLORS = ['#f48fb1', '#aed581', '#4dd0e1', '#ffb74d', '#9fa8da'];

  /* How much the DRAWN length change is magnified relative to the true strain.
     Applies to the picture only — every reported number stays true. Sized so
     the largest case in range (aluminium, +500 C, strain 1.18e-2) still fits
     the canvas: 520px bar x 1.18e-2 x 30 = 184px of growth, 92px per side. */
  var EXPANSION_EXAGGERATION = 30;

  /* Typical yield strength used ONLY for the coach's context note (MPa). */
  var MILD_STEEL_YIELD = 250;

  /* ══════════════════════════════════════════════════════════════
     2. DOM REFS
     ══════════════════════════════════════════════════════════════ */
  var canvas = document.getElementById('main-canvas');
  var ctx = canvas.getContext('2d');

  // Mode tabs
  var modeTabs = document.getElementById('mode-tabs');
  var secSimulate = document.getElementById('sec-simulate');
  var secExplore = document.getElementById('sec-explore');
  var secPractice = document.getElementById('sec-practice');
  var secQuiz = document.getElementById('sec-quiz');

  // Calc tabs + units
  var calcTabs = document.getElementById('calc-tabs');
  var unitTabs = document.getElementById('unit-tabs');
  var matBar2 = document.getElementById('material-bar-2');
  var matBtns1 = document.getElementById('material-btns');
  var matBtns2 = document.getElementById('material-btns-2');
  var presetBar = document.getElementById('preset-bar');
  var presetBtnsEl = document.getElementById('preset-btns');

  // Inputs
  var inpLength = document.getElementById('inp-length');
  var inpTInit = document.getElementById('inp-t-init');
  var inpDeltaT = document.getElementById('inp-delta-t');
  var inpDeltaTNum = document.getElementById('inp-delta-t-num');
  var valDeltaT = document.getElementById('val-delta-t');
  var lblDeltaT = document.getElementById('lbl-delta-t');
  var lblLength = document.getElementById('lbl-length');
  var lblTInit = document.getElementById('lbl-t-init');
  var inpShaftD = document.getElementById('inp-shaft-d');
  var inpHubBore = document.getElementById('inp-hub-bore');
  var inpHubOD = document.getElementById('inp-hub-od');
  var lblShaftD = document.getElementById('lbl-shaft-d');
  var lblHubBore = document.getElementById('lbl-hub-bore');
  var lblHubOD = document.getElementById('lbl-hub-od');
  var inpStripLen = document.getElementById('inp-strip-len');
  var inpT1 = document.getElementById('inp-t1');
  var inpT2 = document.getElementById('inp-t2');
  var lblStripLen = document.getElementById('lbl-strip-len');
  var lblT1 = document.getElementById('lbl-t1');
  var lblT2 = document.getElementById('lbl-t2');
  var inpArea = document.getElementById('inp-area');
  var lblArea = document.getElementById('lbl-area');

  // Input groups for show/hide
  var grpLength = document.getElementById('input-length');
  var grpTInit = document.getElementById('input-t-init');
  var grpDeltaT = document.getElementById('input-delta-t');
  var grpShaftD = document.getElementById('input-shaft-d');
  var grpHubBore = document.getElementById('input-hub-bore');
  var grpHubOD = document.getElementById('input-hub-od');
  var grpStripLen = document.getElementById('input-strip-len');
  var grpT1 = document.getElementById('input-t1');
  var grpT2 = document.getElementById('input-t2');
  var grpArea = document.getElementById('input-area');

  // Readout
  var roDeltaL = document.querySelector('#ro-delta-l .ro-value');
  var roLFinal = document.querySelector('#ro-l-final .ro-value');
  var roStrain = document.querySelector('#ro-strain .ro-value');
  var roExtra = document.querySelector('#ro-extra .ro-value');
  var roDeltaLLabel = document.querySelector('#ro-delta-l .ro-label');
  var roLFinalLabel = document.querySelector('#ro-l-final .ro-label');
  var roStrainLabel = document.querySelector('#ro-strain .ro-label');
  var roExtraLabel = document.querySelector('#ro-extra .ro-label');

  // Action bar / modals / menus
  var btnCSV = document.getElementById('btn-csv');
  var btnPNG = document.getElementById('btn-png');
  var btnReset = document.getElementById('btn-reset');
  var btnCustomMat = document.getElementById('btn-custom-mat');
  var ctxMenu = document.getElementById('ctx-menu');

  // Practice
  var btnNewQ = document.getElementById('btn-new-q');
  var btnCheck = document.getElementById('btn-check');
  var btnShowSol = document.getElementById('btn-show-sol');
  var pScore = document.getElementById('p-score');
  var pTotal = document.getElementById('p-total');
  var pqText = document.getElementById('pq-text');
  var pqInputRow = document.getElementById('pq-input-row');
  var pqInput = document.getElementById('pq-input');
  var pqUnit = document.getElementById('pq-unit');
  var pqFeedback = document.getElementById('pq-feedback');
  var pqSolution = document.getElementById('pq-solution');

  // Quiz
  var btnStartQuiz = document.getElementById('btn-start-quiz');
  var btnSubmitQ = document.getElementById('btn-submit-q');
  var btnNextQ = document.getElementById('btn-next-q');
  var quizCounter = document.getElementById('quiz-counter');
  var qqText = document.getElementById('qq-text');
  var qqOptions = document.getElementById('qq-options');
  var qqInputRow = document.getElementById('qq-input-row');
  var qqInput = document.getElementById('qq-input');
  var qqUnit = document.getElementById('qq-unit');
  var qqFeedback = document.getElementById('qq-feedback');
  var quizResultDiv = document.getElementById('quiz-result');

  // Explore
  var exploreTabs = document.getElementById('explore-tabs');
  var exploreCards = document.getElementById('explore-cards');

  /* ══════════════════════════════════════════════════════════════
     3. STATE
     ══════════════════════════════════════════════════════════════ */
  var mode = 'simulate';
  var calcMode = 'linear';
  var matIdx1 = 0;
  var matIdx2 = 2; // Aluminum for bimetallic pair
  var unitSys = 'si';        /* 'si' | 'imp' — display only, internals stay SI */
  var animProgress = 1;
  var animTarget = 1;
  var animRAF = null;

  /* Logical canvas dims (CSS px) — backing store is DPR-scaled. */
  var LW = 900, LH = 480;

  // Practice state
  var practiceScore = 0;
  var practiceTotal = 0;
  var currentProblem = null;

  // Quiz state
  var QUIZ_SIZE = 5;
  var quizSet = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswers = [];
  var quizLocked = false;

  /* ══════════════════════════════════════════════════════════════
     4. UNIT SYSTEM (display-only conversion; SI internally)
     ══════════════════════════════════════════════════════════════ */
  var MM_IN = 1 / 25.4;         /* mm → in  */
  var MPA_KSI = 0.1450377;      /* MPa → ksi */
  var KN_KIP = 0.2248089;       /* kN → kip  */

  function isImp() { return unitSys === 'imp'; }

  /* Lengths (mm internally) */
  function lenD(mm) { return isImp() ? mm * MM_IN : mm; }        /* to display */
  function lenSI(v) { return isImp() ? v / MM_IN : v; }          /* from display */
  function lenU() { return isImp() ? 'in' : 'mm'; }

  /* Temperature DIFFERENCE (°C internally): ×1.8, no offset */
  function dtD(dC) { return isImp() ? dC * 1.8 : dC; }
  function dtSI(v) { return isImp() ? v / 1.8 : v; }
  function tU() { return isImp() ? '\u00B0F' : '\u00B0C'; }

  /* Absolute temperature (°C internally): ×1.8 + 32 */
  function tAbsD(c) { return isImp() ? c * 1.8 + 32 : c; }
  function tAbsSI(v) { return isImp() ? (v - 32) / 1.8 : v; }

  /* Stress (MPa internally) */
  function stressD(mpa) { return isImp() ? mpa * MPA_KSI : mpa; }
  function stressU() { return isImp() ? 'ksi' : 'MPa'; }

  /* Force (kN internally) */
  function forceD(kn) { return isImp() ? kn * KN_KIP : kn; }
  function forceU() { return isImp() ? 'kip' : 'kN'; }

  /* Area (mm² internally) */
  function areaD(mm2) { return isImp() ? mm2 * MM_IN * MM_IN : mm2; }
  function areaSI(v) { return isImp() ? v / (MM_IN * MM_IN) : v; }
  function areaU() { return isImp() ? 'in\u00B2' : 'mm\u00B2'; }

  /* alpha displayed per-degree of the current temperature unit */
  function alphaD(a) { return isImp() ? a / 1.8 : a; }
  function alphaTxt(a) { return (alphaD(a) * 1e6).toFixed(isImp() ? 2 : 1) + ' \u00D710\u207B\u2076/' + tU(); }

  /* Read a length input (display units) → SI mm */
  function readLen(el, defSI) {
    var v = parseFloat(el.value);
    if (!isFinite(v)) return defSI;
    return lenSI(v);
  }
  function readArea(el, defSI) {
    var v = parseFloat(el.value);
    if (!isFinite(v)) return defSI;
    return areaSI(v);
  }
  /* ΔT slider always operates in SI (°C) */
  function readDT() { return parseFloat(inpDeltaT.value) || 0; }

  function fmtLen(mm, dp) { return lenD(mm).toFixed(dp !== undefined ? dp : (isImp() ? 4 : 2)); }

  /* ΔL pretty-printer, unit-aware */
  function formatDL(dlMM) {
    if (isImp()) {
      var din = dlMM * MM_IN;
      if (Math.abs(din) < 0.001) return (din * 1000).toFixed(2) + ' mil';
      if (Math.abs(din) < 0.1) return (din * 1000).toFixed(1) + ' mil';
      return din.toFixed(4) + ' in';
    }
    if (Math.abs(dlMM) < 0.001) return (dlMM * 1000).toFixed(3) + ' \u03BCm';
    if (Math.abs(dlMM) < 1) return (dlMM * 1000).toFixed(1) + ' \u03BCm';
    return dlMM.toFixed(4) + ' mm';
  }

  function formatRadius(rMM) {
    if (isImp()) {
      var rin = rMM * MM_IN;
      if (rin > 120) return (rin / 12).toFixed(2) + ' ft';
      return rin.toFixed(1) + ' in';
    }
    if (rMM > 1000) return (rMM / 1000).toFixed(2) + ' m';
    return rMM.toFixed(1) + ' mm';
  }

  function formatStress(mpa) {
    var v = stressD(mpa);
    return (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) + ' ' + stressU();
  }

  /* ══════════════════════════════════════════════════════════════
     5. INPUT LABELS + UNIT SWITCH
     ══════════════════════════════════════════════════════════════ */
  function updateInputLabels() {
    lblLength.textContent = 'Initial Length (' + lenU() + ')';
    lblTInit.textContent = 'Initial Temp (' + tU() + ')';
    lblShaftD.textContent = 'Shaft Diameter (' + lenU() + ')';
    lblHubBore.textContent = 'Hub Bore (' + lenU() + ')';
    lblHubOD.textContent = 'Hub OD (' + lenU() + ')';
    lblStripLen.textContent = 'Strip Length (' + lenU() + ')';
    lblT1.textContent = 'Layer 1 Thickness (' + lenU() + ')';
    lblT2.textContent = 'Layer 2 Thickness (' + lenU() + ')';
    lblArea.textContent = 'Cross-Section Area (' + areaU() + ')';
    lblDeltaT.textContent = (calcMode === 'shrinkfit' ? 'Hub Heating \u0394T (' : '\u0394T (') + tU() + ')';
  }

  /* Rewrite every visible number input from an SI snapshot when the unit
     system flips. Values round-trip through the snapshot so precision holds. */
  function switchUnits(next) {
    if (next === unitSys) return;
    /* Snapshot SI values under the OLD system */
    var s = {
      L0: readLen(inpLength, 500),
      T0: tAbsSI(parseFloat(inpTInit.value) || (isImp() ? 68 : 20)),
      dShaft: readLen(inpShaftD, 50),
      dBore: readLen(inpHubBore, 49.95),
      dHub: readLen(inpHubOD, 100),
      strip: readLen(inpStripLen, 100),
      t1: readLen(inpT1, 1),
      t2: readLen(inpT2, 1),
      area: readArea(inpArea, 500)
    };
    unitSys = next;
    /* Re-emit in the NEW system */
    inpLength.value = +lenD(s.L0).toFixed(isImp() ? 3 : 0);
    inpTInit.value = Math.round(tAbsD(s.T0));
    inpShaftD.value = +lenD(s.dShaft).toFixed(isImp() ? 4 : 2);
    inpHubBore.value = +lenD(s.dBore).toFixed(isImp() ? 4 : 2);
    inpHubOD.value = +lenD(s.dHub).toFixed(isImp() ? 3 : 1);
    inpStripLen.value = +lenD(s.strip).toFixed(isImp() ? 3 : 0);
    inpT1.value = +lenD(s.t1).toFixed(isImp() ? 3 : 1);
    inpT2.value = +lenD(s.t2).toFixed(isImp() ? 3 : 1);
    inpArea.value = +areaD(s.area).toFixed(isImp() ? 3 : 0);
    updateInputLabels();
    syncDeltaTDisplays();
    if (unitTabs) {
      unitTabs.querySelectorAll('.pill').forEach(function (p) {
        p.classList.toggle('active', p.dataset.unit === unitSys);
      });
    }
    rebuildMatButtons();
    triggerAnim();
  }

  function syncDeltaTDisplays() {
    var dC = readDT();
    var v = dtD(dC);
    valDeltaT.textContent = (v >= 0 ? '+' : '') + Math.round(v) + ' ' + tU();
    if (document.activeElement !== inpDeltaTNum) inpDeltaTNum.value = Math.round(v);
  }

  /* ══════════════════════════════════════════════════════════════
     6. MATERIAL BUTTONS
     ══════════════════════════════════════════════════════════════ */
  function buildMatBtns(container, selectedIdx, onClick) {
    container.innerHTML = '';
    MATERIALS.forEach(function (m, i) {
      var btn = document.createElement('button');
      btn.className = 'mat-btn' + (i === selectedIdx ? ' active' : '');
      btn.title = m.name + ' \u2014 \u03B1 = ' + alphaTxt(m.alpha);
      btn.innerHTML = '<span class="mat-dot" style="background:' + m.color + '"></span>' + m.name;
      btn.addEventListener('click', function () { onClick(i); });
      container.appendChild(btn);
    });
  }

  function updateMatBtns(container, idx) {
    var btns = container.querySelectorAll('.mat-btn');
    btns.forEach(function (b, i) { b.classList.toggle('active', i === idx); });
  }

  function rebuildMatButtons() {
    buildMatBtns(matBtns1, matIdx1, function (i) { matIdx1 = i; updateMatBtns(matBtns1, i); triggerAnim(); });
    buildMatBtns(matBtns2, matIdx2, function (i) { matIdx2 = i; updateMatBtns(matBtns2, i); triggerAnim(); });
  }
  rebuildMatButtons();

  /* ══════════════════════════════════════════════════════════════
     7. CALCULATION HELPERS  (all SI)
     ══════════════════════════════════════════════════════════════ */
  function getLinearResults() {
    var m = MATERIALS[matIdx1];
    var L0 = readLen(inpLength, 500);
    var dT = readDT();
    var dL = m.alpha * L0 * dT;
    var Lf = L0 + dL;
    var strain = m.alpha * dT;
    return { L0: L0, dT: dT, dL: dL, Lf: Lf, strain: strain, alpha: m.alpha, mat: m };
  }

  function getShrinkFitResults() {
    var m = MATERIALS[matIdx1];
    var dShaft = readLen(inpShaftD, 50);
    var dBore = readLen(inpHubBore, 49.95);
    var dHub = readLen(inpHubOD, 100);
    var geomOK = dHub > dShaft && dHub > dBore;
    var interference = dShaft - dBore;
    var dTReq = interference > 0 ? interference / (m.alpha * dBore) : 0;
    /* Contact pressure — same-material solid shaft + hub:
       p = E·δ·(D²−d²) / (2·d·D²). Combining the hub-expansion and
       shaft-compression Lamé terms, the ν terms cancel for equal materials. */
    var D = dHub;
    var d = dShaft;
    var pressure = 0;
    if (interference > 0 && geomOK && D * D - d * d > 0) {
      pressure = (m.E * interference * (D * D - d * d)) / (2 * d * D * D);
    }
    var dTApplied = readDT();
    return {
      dShaft: dShaft, dBore: dBore, dHub: dHub, geomOK: geomOK,
      interference: interference, dTReq: dTReq, pressure: pressure,
      dTApplied: dTApplied, mat: m
    };
  }

  function getBimetallicResults() {
    var m1 = MATERIALS[matIdx1];
    var m2 = MATERIALS[matIdx2];
    var dT = readDT();
    var L = readLen(inpStripLen, 100);
    var t1 = readLen(inpT1, 1);
    var t2 = readLen(inpT2, 1);
    if (t1 <= 0) t1 = 0.1;
    if (t2 <= 0) t2 = 0.1;
    var h = t1 + t2;
    var m = t1 / t2;
    var n = m1.E / m2.E;
    var dAlpha = Math.abs(m2.alpha - m1.alpha);
    // Timoshenko formula
    var num = 6 * dAlpha * dT * (1 + m) * (1 + m);
    var den = h * (3 * (1 + m) * (1 + m) + (1 + m * n) * (m * m + 1 / (m * n)));
    var kappa = den !== 0 ? num / den : 0;
    var radius = kappa !== 0 ? 1 / Math.abs(kappa) : Infinity;
    // Deflection at tip
    var deflection = kappa !== 0 ? radius - radius * Math.cos(L * kappa) : 0;
    return {
      L: L, t1: t1, t2: t2, h: h, dT: dT,
      kappa: kappa, radius: radius, deflection: deflection,
      m1: m1, m2: m2
    };
  }

  function getStressResults() {
    var m = MATERIALS[matIdx1];
    var L0 = readLen(inpLength, 500);
    var A = readArea(inpArea, 500);
    var dT = readDT();
    var stress = m.E * m.alpha * dT;           /* MPa (compressive when dT>0) */
    var force = stress * A / 1000;             /* MPa·mm² = N → kN */
    var freeDL = m.alpha * L0 * dT;            /* the suppressed expansion */
    var strain = m.alpha * dT;
    return { L0: L0, A: A, dT: dT, stress: stress, force: force, freeDL: freeDL, strain: strain, mat: m };
  }

  /* ══════════════════════════════════════════════════════════════
     8. DRAW — PURE RENDER  (DPR-aware backing store)
     ══════════════════════════════════════════════════════════════ */
  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var cssW = Math.floor(rect.width - 20);
    if (cssW < 300) cssW = 300;
    var cssH = Math.round(cssW * 0.53);
    LW = cssW; LH = cssH;
    var dpr = window.devicePixelRatio || 1;
    var bw = Math.round(cssW * dpr), bh = Math.round(cssH * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
  }

  function draw() {
    resizeCanvas();
    var W = LW;
    var H = LH;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (calcMode === 'linear') drawLinear(W, H);
    else if (calcMode === 'shrinkfit') drawShrinkFit(W, H);
    else if (calcMode === 'bimetallic') drawBimetallic(W, H);
    else if (calcMode === 'stress') drawStress(W, H);

    updateReadout();
    updateLearnPanels();
  }

  function drawLinear(W, H) {
    var r = getLinearResults();
    var mat = r.mat;
    var cx = W / 2;
    var cy = H / 2;
    var maxBarW = W * 0.7;
    var barH = H * 0.15;

    // Scale: original bar fills most of width
    var scale = maxBarW / r.L0;
    var origW = r.L0 * scale;

    /* Thermal strain is tiny — the drawn change is magnified by a single
       constant (stated on the canvas). All reported numbers stay true. */
    var expandedW = origW + r.dL * scale * EXPANSION_EXAGGERATION * animProgress;
    var deltaW = expandedW - origW;

    // Temperature color
    var tFrac = Math.max(0, Math.min(1, (r.dT + 200) / 700));

    // Draw original bar outline (dashed)
    var x0 = cx - origW / 2;
    var y0 = cy - barH / 2;
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x0, y0, origW, barH);
    ctx.setLineDash([]);
    ctx.restore();

    // Draw expanded bar
    var ex0 = cx - expandedW / 2;
    ctx.save();
    var grad = ctx.createLinearGradient(ex0, 0, ex0 + expandedW, 0);
    if (r.dT >= 0) {
      grad.addColorStop(0, lerpColor('#4a6fa5', '#ff6e40', tFrac));
      grad.addColorStop(1, lerpColor('#4a6fa5', '#ff3d00', tFrac));
    } else {
      grad.addColorStop(0, lerpColor('#4a6fa5', '#2196f3', 1 - tFrac));
      grad.addColorStop(1, lerpColor('#4a6fa5', '#0d47a1', 1 - tFrac));
    }
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.85;
    roundRect(ctx, ex0, y0, expandedW, barH, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = mat.color;
    ctx.lineWidth = 2;
    roundRect(ctx, ex0, y0, expandedW, barH, 4);
    ctx.stroke();
    ctx.restore();

    // Dimension lines
    var dimY1 = y0 - 30;
    var dimY2 = y0 + barH + 30;

    // Original length dimension
    drawDimLine(ctx, x0, dimY1, x0 + origW, 'L\u2080 = ' + fmtLen(r.L0, isImp() ? 3 : 1) + ' ' + lenU(), '#6b7a99');

    // Expanded length dimension
    drawDimLine(ctx, ex0, dimY2, ex0 + expandedW, 'L = ' + fmtLen(r.Lf, isImp() ? 4 : 3) + ' ' + lenU(), mat.color);

    // Delta L arrows if significant
    if (Math.abs(deltaW) > 2) {
      var arrowY = cy;
      var arrowX1 = cx + origW / 2;
      var arrowX2 = cx + expandedW / 2;
      ctx.save();
      ctx.strokeStyle = var_accent();
      ctx.fillStyle = var_accent();
      ctx.lineWidth = 2;
      drawArrow(ctx, arrowX1, arrowY, arrowX2, arrowY);

      var arrowL1 = cx - origW / 2;
      var arrowL2 = cx - expandedW / 2;
      drawArrow(ctx, arrowL1, arrowY, arrowL2, arrowY);
      ctx.restore();

      ctx.save();
      ctx.font = 'bold 13px ' + getFont();
      ctx.fillStyle = var_accent();
      ctx.textAlign = 'center';
      var dlText = '\u0394L = ' + formatDL(r.dL);
      ctx.fillText(dlText, cx, dimY2 + 30);
      ctx.restore();
    }

    // Material & strain info
    ctx.save();
    ctx.font = '12px ' + getFont();
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    ctx.fillText(mat.name + '  |  \u03B1 = ' + alphaTxt(mat.alpha), 12, H - 12);
    ctx.textAlign = 'right';
    var dTd = dtD(r.dT);
    ctx.fillText('\u0394T = ' + (dTd >= 0 ? '+' : '') + dTd.toFixed(0) + ' ' + tU(), W - 12, H - 12);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#5d6b86';
    ctx.font = 'italic 11px ' + getFont();
    ctx.fillText('length change shown \u00D7' + EXPANSION_EXAGGERATION + ' \u2014 not to scale', W / 2, H - 30);
    ctx.restore();

    // Thermometer
    drawThermometer(ctx, W - 50, 30, 20, H * 0.45, tFrac);
  }

  function drawShrinkFit(W, H) {
    var r = getShrinkFitResults();
    var cx = W / 2;
    var cy = H / 2;
    var scale = Math.min(W * 0.3, H * 0.35) / Math.max(r.dHub, r.dShaft + 1);

    var hubR = r.dHub / 2 * scale;
    var boreR = r.dBore / 2 * scale;
    var shaftR = r.dShaft / 2 * scale;

    // Animate: hub bore expands with the "Hub Heating ΔT" slider
    var dTSlider = Math.max(0, r.dTApplied);
    var expandedBoreR = boreR * (1 + r.mat.alpha * dTSlider * animProgress);
    var canAssemble = expandedBoreR * (2 / scale) / 2 >= r.dShaft / 2 - 1e-9 || r.interference <= 0;

    var tFrac = Math.max(0, Math.min(1, dTSlider / 500));

    if (!r.geomOK) {
      ctx.save();
      ctx.font = 'bold 14px ' + getFont();
      ctx.fillStyle = '#ff5555';
      ctx.textAlign = 'center';
      ctx.fillText('Invalid geometry: Hub OD must be larger than the shaft and bore.', cx, cy);
      ctx.restore();
      return;
    }

    // Hub outer
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.arc(cx, cy, expandedBoreR, 0, Math.PI * 2, true);
    var hubGrad = ctx.createRadialGradient(cx, cy, expandedBoreR, cx, cy, hubR);
    hubGrad.addColorStop(0, lerpColor('#2a3050', '#ff6e40', tFrac * 0.6));
    hubGrad.addColorStop(1, lerpColor('#1f2535', '#bf360c', tFrac * 0.4));
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = r.mat.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, hubR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, expandedBoreR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Shaft
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, shaftR, 0, Math.PI * 2);
    ctx.fillStyle = canAssemble ? '#4a6fa5' : '#7c4dff';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#90caf9';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Interference zone highlight
    if (!canAssemble && shaftR > expandedBoreR) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, shaftR, 0, Math.PI * 2);
      ctx.arc(cx, cy, expandedBoreR, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(255,85,85,0.3)';
      ctx.fill();
      ctx.restore();
    }

    // Labels
    ctx.save();
    ctx.font = 'bold 12px ' + getFont();
    ctx.textAlign = 'center';

    ctx.fillStyle = '#90caf9';
    ctx.fillText('Shaft \u00D8' + fmtLen(r.dShaft, isImp() ? 4 : 2) + ' ' + lenU(), cx, cy - shaftR - 8);

    ctx.fillStyle = r.mat.color;
    ctx.fillText('Hub OD \u00D8' + fmtLen(r.dHub, isImp() ? 3 : 1) + ' ' + lenU(), cx, cy - hubR - 8);

    ctx.font = '11px ' + getFont();
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Bore \u00D8' + fmtLen(r.dBore, isImp() ? 4 : 2) + ' ' + lenU(), cx, cy + boreR + 18);

    // Status
    ctx.font = 'bold 13px ' + getFont();
    if (r.interference <= 0) {
      ctx.fillStyle = '#3ddc84';
      ctx.fillText('Clearance fit \u2014 assembles without heating', cx, H - 40);
    } else if (canAssemble) {
      ctx.fillStyle = '#3ddc84';
      ctx.fillText('Bore expanded past shaft \u2014 assembly possible', cx, H - 40);
    } else {
      ctx.fillStyle = '#ff5555';
      ctx.fillText('Interference: ' + formatDL(r.interference), cx, H - 55);
      ctx.fillText('Heat hub by ' + dtD(r.dTReq).toFixed(1) + ' ' + tU() + ' to assemble', cx, H - 35);
    }
    ctx.restore();

    // Dimension lines on right side
    var dx = cx + hubR + 30;
    drawDimVert(ctx, dx, cy - hubR, cy + hubR, '\u00D8' + fmtLen(r.dHub, isImp() ? 3 : 1), r.mat.color);
    drawDimVert(ctx, dx + 50, cy - shaftR, cy + shaftR, '\u00D8' + fmtLen(r.dShaft, isImp() ? 4 : 2), '#90caf9');

    // Info bottom left
    ctx.save();
    ctx.font = '12px ' + getFont();
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    ctx.fillText(r.mat.name + '  |  \u03B4 = ' + formatDL(r.interference), 12, H - 12);
    if (r.pressure > 0) {
      ctx.textAlign = 'right';
      ctx.fillText('p = ' + formatStress(r.pressure), W - 12, H - 12);
    }
    ctx.restore();

    // Thermometer shows applied hub heating
    drawThermometer(ctx, W - 50, 30, 20, H * 0.4, tFrac);
  }

  function drawBimetallic(W, H) {
    var r = getBimetallicResults();
    var cx = W / 2;
    var cy = H * 0.45;
    var stripLen = Math.min(W * 0.6, 400);
    var stripH = Math.max(H * 0.06, 12);
    var t1H = stripH * r.t1 / r.h;
    var t2H = stripH * r.t2 / r.h;

    var tFrac = Math.max(0, Math.min(1, (r.dT + 200) / 700));

    if (Math.abs(r.kappa) < 1e-8 || !isFinite(r.radius)) {
      // Straight strip
      var sx = cx - stripLen / 2;
      ctx.save();
      ctx.fillStyle = r.m1.color;
      ctx.globalAlpha = 0.8;
      roundRect(ctx, sx, cy - t1H, stripLen, t1H, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = r.m1.color;
      ctx.lineWidth = 1;
      roundRect(ctx, sx, cy - t1H, stripLen, t1H, 2);
      ctx.stroke();

      ctx.fillStyle = r.m2.color;
      ctx.globalAlpha = 0.8;
      roundRect(ctx, sx, cy, stripLen, t2H, 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = r.m2.color;
      ctx.lineWidth = 1;
      roundRect(ctx, sx, cy, stripLen, t2H, 2);
      ctx.stroke();
      ctx.restore();
    } else {
      // Curved strip
      var pixelKappa = r.kappa * (r.L / stripLen) * animProgress * stripLen / r.L;
      pixelKappa = r.kappa * (stripLen / r.L) * animProgress;
      var pixelRadius = 1 / Math.max(Math.abs(pixelKappa), 1e-6);
      if (pixelRadius > 10000) pixelRadius = 10000;

      var bendUp = (r.m2.alpha > r.m1.alpha && r.dT > 0) || (r.m1.alpha > r.m2.alpha && r.dT < 0);
      var sign = bendUp ? -1 : 1;

      var arcAngle = stripLen / pixelRadius;
      if (arcAngle > Math.PI) arcAngle = Math.PI;

      var centerY = cy + sign * pixelRadius;
      var startAngle = bendUp ? Math.PI / 2 - arcAngle / 2 : -Math.PI / 2 - arcAngle / 2;

      ctx.save();
      var segments = 60;
      var dAngle = arcAngle / segments;

      for (var layer = 0; layer < 2; layer++) {
        var mat = layer === 0 ? r.m1 : r.m2;
        var innerR, outerR;
        if (bendUp) {
          if (layer === 0) { innerR = pixelRadius - t1H; outerR = pixelRadius; }
          else { outerR = pixelRadius + t2H; innerR = pixelRadius; }
        } else {
          if (layer === 0) { outerR = pixelRadius + t1H; innerR = pixelRadius; }
          else { innerR = pixelRadius - t2H; outerR = pixelRadius; }
        }

        ctx.beginPath();
        for (var s = 0; s <= segments; s++) {
          var a = startAngle + s * dAngle;
          var x = cx + outerR * Math.cos(a);
          var y = centerY + outerR * Math.sin(a);
          if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        for (var s2 = segments; s2 >= 0; s2--) {
          var a2 = startAngle + s2 * dAngle;
          var x2 = cx + innerR * Math.cos(a2);
          var y2 = centerY + innerR * Math.sin(a2);
          ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fillStyle = mat.color;
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = mat.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Radius of curvature arc indicator
      if (pixelRadius < 3000 && pixelRadius > 20) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(255,110,64,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, centerY, pixelRadius, startAngle, startAngle + arcAngle);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '11px ' + getFont();
        ctx.fillStyle = var_accent();
        ctx.textAlign = 'center';
        if (isFinite(r.radius) && r.radius < 1e6) {
          ctx.fillText('R = ' + formatRadius(r.radius), cx, centerY + sign * (pixelRadius + 25));
        }
        ctx.restore();
      }
    }

    // Legend
    ctx.save();
    ctx.font = '12px ' + getFont();
    ctx.textAlign = 'left';

    ctx.fillStyle = r.m1.color;
    ctx.fillRect(12, H - 50, 14, 14);
    ctx.fillStyle = '#dde3f0';
    ctx.fillText(r.m1.name + ' (\u03B1=' + (alphaD(r.m1.alpha) * 1e6).toFixed(1) + ')', 32, H - 39);

    ctx.fillStyle = r.m2.color;
    ctx.fillRect(12, H - 30, 14, 14);
    ctx.fillStyle = '#dde3f0';
    ctx.fillText(r.m2.name + ' (\u03B1=' + (alphaD(r.m2.alpha) * 1e6).toFixed(1) + ')', 32, H - 19);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6b7a99';
    var dTd = dtD(r.dT);
    ctx.fillText('\u0394T = ' + (dTd >= 0 ? '+' : '') + dTd.toFixed(0) + ' ' + tU(), W - 12, H - 12);
    ctx.restore();

    // Thermometer
    drawThermometer(ctx, W - 50, 30, 20, H * 0.35, tFrac);
  }

  function drawStress(W, H) {
    var r = getStressResults();
    var mat = r.mat;
    var cx = W / 2;
    var cy = H / 2;
    var wallW = 26;
    var span = W * 0.62;
    var barH = H * 0.16;
    var x0 = cx - span / 2;
    var y0 = cy - barH / 2;

    var tFrac = Math.max(0, Math.min(1, (r.dT + 200) / 700));
    var stressFrac = Math.max(0, Math.min(1, Math.abs(r.stress) / 500));

    /* Rigid walls with hatching */
    ctx.save();
    ctx.fillStyle = '#1f2535';
    ctx.fillRect(x0 - wallW, cy - H * 0.28, wallW, H * 0.56);
    ctx.fillRect(x0 + span, cy - H * 0.28, wallW, H * 0.56);
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
    for (var hy = cy - H * 0.28; hy < cy + H * 0.28 - 6; hy += 9) {
      ctx.beginPath();
      ctx.moveTo(x0 - wallW, hy + 9); ctx.lineTo(x0 - wallW + 9, hy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x0 + span + wallW - 9, hy + 9); ctx.lineTo(x0 + span + wallW, hy);
      ctx.stroke();
    }
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, cy - H * 0.28); ctx.lineTo(x0, cy + H * 0.28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + span, cy - H * 0.28); ctx.lineTo(x0 + span, cy + H * 0.28); ctx.stroke();
    ctx.restore();

    /* Bar — bulges slightly with compression (visual cue only) */
    var bulge = barH * 0.35 * stressFrac * (r.dT > 0 ? 1 : -0.6) * animProgress;
    ctx.save();
    var grad = ctx.createLinearGradient(x0, 0, x0 + span, 0);
    if (r.dT >= 0) {
      grad.addColorStop(0, lerpColor('#4a6fa5', '#ff6e40', tFrac));
      grad.addColorStop(0.5, lerpColor('#4a6fa5', '#ff3d00', tFrac));
      grad.addColorStop(1, lerpColor('#4a6fa5', '#ff6e40', tFrac));
    } else {
      grad.addColorStop(0, lerpColor('#4a6fa5', '#2196f3', 1 - tFrac));
      grad.addColorStop(1, lerpColor('#4a6fa5', '#0d47a1', 1 - tFrac));
    }
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo(cx, y0 - bulge, x0 + span, y0);
    ctx.lineTo(x0 + span, y0 + barH);
    ctx.quadraticCurveTo(cx, y0 + barH + bulge, x0, y0 + barH);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = mat.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    /* Reaction arrows from the walls (compression when heated) */
    if (Math.abs(r.stress) > 0.5) {
      ctx.save();
      ctx.strokeStyle = r.dT > 0 ? '#ff5555' : '#42a5f5';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2.5;
      var aLen = 34 + 26 * stressFrac;
      if (r.dT > 0) {
        drawArrow(ctx, x0 - wallW - aLen, cy, x0 - wallW - 4, cy);
        drawArrow(ctx, x0 + span + wallW + aLen, cy, x0 + span + wallW + 4, cy);
      } else {
        drawArrow(ctx, x0 - wallW - 4, cy, x0 - wallW - aLen, cy);
        drawArrow(ctx, x0 + span + wallW + 4, cy, x0 + span + wallW + aLen, cy);
      }
      ctx.restore();
    }

    /* Blocked-expansion ghost: dashed outline showing the free length */
    var scale = span / r.L0;
    var ghost = Math.min(span * 0.12, Math.abs(r.freeDL) * scale * EXPANSION_EXAGGERATION * animProgress);
    if (ghost > 2 && r.dT !== 0) {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(255,213,79,0.55)';
      ctx.lineWidth = 1.5;
      var g = r.dT > 0 ? ghost : -ghost;
      ctx.strokeRect(x0 - g / 2, y0 + barH + 16, span + g, 10);
      ctx.setLineDash([]);
      ctx.fillStyle = '#ffd54f';
      ctx.font = 'italic 11px ' + getFont();
      ctx.textAlign = 'center';
      ctx.fillText('free length it \u201Cwants\u201D (\u0394L = ' + formatDL(r.freeDL) + ', shown \u00D7' + EXPANSION_EXAGGERATION + ')', cx, y0 + barH + 44);
      ctx.restore();
    }

    /* σ = E·α·ΔT annotation */
    ctx.save();
    ctx.font = 'bold 15px ' + getFont();
    ctx.fillStyle = '#e6edf6';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C3 = E \u00B7 \u03B1 \u00B7 \u0394T = ' + formatStress(Math.abs(r.stress)) +
      (r.dT === 0 ? '' : (r.dT > 0 ? '  (compressive)' : '  (tensile)')), cx, cy - H * 0.33);
    ctx.restore();

    /* Info row */
    ctx.save();
    ctx.font = '12px ' + getFont();
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    ctx.fillText(mat.name + '  |  E = ' + (isImp() ? (mat.E * MPA_KSI / 1000).toFixed(1) + ' \u00D710\u00B3 ksi' : (mat.E / 1000).toFixed(0) + ' GPa') +
      '  |  \u03B1 = ' + alphaTxt(mat.alpha), 12, H - 12);
    ctx.textAlign = 'right';
    var dTd = dtD(r.dT);
    ctx.fillText('\u0394T = ' + (dTd >= 0 ? '+' : '') + dTd.toFixed(0) + ' ' + tU(), W - 12, H - 12);
    ctx.restore();

    drawThermometer(ctx, W - 50, 30, 20, H * 0.4, tFrac);
  }

  /* ══════════════════════════════════════════════════════════════
     9. DRAWING HELPERS
     ══════════════════════════════════════════════════════════════ */
  function var_accent() { return '#ff6e40'; }
  function getFont() { return "'Segoe UI', system-ui, sans-serif"; }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function lerpColor(a, b, t) {
    var ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
    var br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
    var rr = Math.round(ar + (br - ar) * t);
    var rg = Math.round(ag + (bg - ag) * t);
    var rb = Math.round(ab + (bb - ab) * t);
    return 'rgb(' + rr + ',' + rg + ',' + rb + ')';
  }

  function drawArrow(c, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 3) return;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    var ux = dx / len, uy = dy / len;
    var aw = 6;
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - aw * ux + aw * 0.5 * uy, y2 - aw * uy - aw * 0.5 * ux);
    c.lineTo(x2 - aw * ux - aw * 0.5 * uy, y2 - aw * uy + aw * 0.5 * ux);
    c.closePath();
    c.fill();
  }

  function drawDimLine(c, x1, y, x2, label, color) {
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x1, y - 5); c.lineTo(x1, y + 5);
    c.moveTo(x2, y - 5); c.lineTo(x2, y + 5);
    c.moveTo(x1, y); c.lineTo(x2, y);
    c.stroke();
    drawArrow(c, x1 + 10, y, x1, y);
    drawArrow(c, x2 - 10, y, x2, y);
    c.font = '11px ' + getFont();
    c.textAlign = 'center';
    c.fillText(label, (x1 + x2) / 2, y - 8);
    c.restore();
  }

  function drawDimVert(c, x, y1, y2, label, color) {
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - 4, y1); c.lineTo(x + 4, y1);
    c.moveTo(x - 4, y2); c.lineTo(x + 4, y2);
    c.moveTo(x, y1); c.lineTo(x, y2);
    c.stroke();
    c.font = '10px ' + getFont();
    c.textAlign = 'center';
    c.fillText(label, x, y1 - 6);
    c.restore();
  }

  function drawThermometer(c, x, y, w, h, frac) {
    var bulbR = w * 0.55;
    var tubeW = w * 0.35;
    var tubeH = h - bulbR * 2;

    c.save();
    c.fillStyle = '#1f2535';
    roundRect(c, x - tubeW / 2, y, tubeW, tubeH, tubeW / 2);
    c.fill();
    c.strokeStyle = '#2a3050';
    c.lineWidth = 1;
    roundRect(c, x - tubeW / 2, y, tubeW, tubeH, tubeW / 2);
    c.stroke();

    var fillH = tubeH * frac;
    if (fillH > 2) {
      var mercGrad = c.createLinearGradient(0, y + tubeH - fillH, 0, y + tubeH);
      mercGrad.addColorStop(0, '#2196f3');
      mercGrad.addColorStop(0.5, '#ff6e40');
      mercGrad.addColorStop(1, '#ff3d00');
      c.fillStyle = mercGrad;
      roundRect(c, x - tubeW / 2 + 2, y + tubeH - fillH, tubeW - 4, fillH, (tubeW - 4) / 2);
      c.fill();
    }

    c.beginPath();
    c.arc(x, y + tubeH + bulbR * 0.3, bulbR, 0, Math.PI * 2);
    c.fillStyle = lerpColor('#2196f3', '#ff3d00', frac);
    c.fill();
    c.strokeStyle = '#2a3050';
    c.lineWidth = 1;
    c.stroke();

    c.fillStyle = '#6b7a99';
    c.font = '9px ' + getFont();
    c.textAlign = 'left';
    for (var i = 0; i <= 4; i++) {
      var ty = y + tubeH - (tubeH * i / 4);
      c.beginPath();
      c.moveTo(x + tubeW / 2 + 2, ty);
      c.lineTo(x + tubeW / 2 + 6, ty);
      c.strokeStyle = '#4a5568';
      c.stroke();
    }
    c.restore();
  }

  /* ══════════════════════════════════════════════════════════════
     10. READOUT UPDATE
     ══════════════════════════════════════════════════════════════ */
  function updateReadout() {
    var dTd;
    if (calcMode === 'linear') {
      var r = getLinearResults();
      roDeltaLLabel.textContent = '\u0394L';
      roDeltaL.textContent = formatDL(r.dL);
      roLFinalLabel.textContent = 'L final';
      roLFinal.textContent = fmtLen(r.Lf, isImp() ? 5 : 4) + ' ' + lenU();
      roStrainLabel.textContent = 'Strain \u03B5';
      roStrain.textContent = (r.strain * 1e6).toFixed(2) + ' \u03BC\u03B5';
      roExtraLabel.textContent = '\u0394T';
      dTd = dtD(r.dT);
      roExtra.textContent = (dTd >= 0 ? '+' : '') + dTd.toFixed(0) + ' ' + tU();
    } else if (calcMode === 'shrinkfit') {
      var s = getShrinkFitResults();
      roDeltaLLabel.textContent = 'Interference \u03B4';
      roDeltaL.textContent = formatDL(s.interference);
      roLFinalLabel.textContent = '\u0394T required';
      roLFinal.textContent = dtD(s.dTReq).toFixed(1) + ' ' + tU();
      roStrainLabel.textContent = 'Pressure p';
      roStrain.textContent = s.geomOK ? formatStress(s.pressure) : '\u2014';
      roExtraLabel.textContent = 'Material';
      roExtra.textContent = s.mat.name;
    } else if (calcMode === 'bimetallic') {
      var b = getBimetallicResults();
      roDeltaLLabel.textContent = 'Tip Deflection';
      roDeltaL.textContent = formatDL(b.deflection);
      roLFinalLabel.textContent = 'Radius R';
      if (isFinite(b.radius) && b.radius < 1e6) {
        roLFinal.textContent = formatRadius(b.radius);
      } else {
        roLFinal.textContent = '\u221E';
      }
      roStrainLabel.textContent = 'Curvature \u03BA';
      roStrain.textContent = (b.kappa * 1e3).toFixed(4) + ' /m';
      roExtraLabel.textContent = '\u0394T';
      dTd = dtD(b.dT);
      roExtra.textContent = (dTd >= 0 ? '+' : '') + dTd.toFixed(0) + ' ' + tU();
    } else {
      var st = getStressResults();
      roDeltaLLabel.textContent = 'Thermal Stress \u03C3';
      roDeltaL.textContent = formatStress(Math.abs(st.stress)) + (st.dT > 0 ? ' (C)' : st.dT < 0 ? ' (T)' : '');
      roLFinalLabel.textContent = 'Wall Force F';
      roLFinal.textContent = forceD(Math.abs(st.force)).toFixed(1) + ' ' + forceU();
      roStrainLabel.textContent = 'Suppressed \u0394L';
      roStrain.textContent = formatDL(st.freeDL);
      roExtraLabel.textContent = '\u0394T';
      dTd = dtD(st.dT);
      roExtra.textContent = (dTd >= 0 ? '+' : '') + dTd.toFixed(0) + ' ' + tU();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     11. ANIMATION
     ══════════════════════════════════════════════════════════════ */
  /* Always cancel any pending frame and draw once synchronously — if rAF is
     suspended (hidden tab), the UI still reflects every input change. */
  function triggerAnim() {
    animProgress = 0;
    animTarget = 1;
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
    animLoop();
  }

  function animLoop() {
    animProgress += 0.04;
    if (animProgress >= animTarget) {
      animProgress = animTarget;
      animRAF = null;
      draw();
      return;
    }
    draw();
    animRAF = requestAnimationFrame(animLoop);
  }

  /* ══════════════════════════════════════════════════════════════
     12. MODE SWITCHING
     ══════════════════════════════════════════════════════════════ */
  modeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var v = e.target.dataset.value;
    modeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    mode = v;
    secSimulate.classList.toggle('hidden', v !== 'simulate');
    secExplore.classList.toggle('hidden', v !== 'explore');
    secPractice.classList.toggle('hidden', v !== 'practice');
    secQuiz.classList.toggle('hidden', v !== 'quiz');
    if (v === 'simulate') draw();
    if (v === 'explore') renderExplore();
  });

  /* ══════════════════════════════════════════════════════════════
     13. CALC MODE SWITCHING
     ══════════════════════════════════════════════════════════════ */
  calcTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var v = e.target.dataset.value;
    calcTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    calcMode = v;
    updateInputVisibility();
    updateInputLabels();
    buildPresetBtns();
    triggerAnim();
  });

  if (unitTabs) unitTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    switchUnits(e.target.dataset.unit);
  });

  function updateInputVisibility() {
    var isLinear = calcMode === 'linear';
    var isShrink = calcMode === 'shrinkfit';
    var isBi = calcMode === 'bimetallic';
    var isStress = calcMode === 'stress';

    grpLength.classList.toggle('hidden', !(isLinear || isStress));
    grpTInit.classList.toggle('hidden', !isLinear);
    /* ΔT slider stays visible in EVERY mode — in shrink fit it is the hub
       heating control the assembly check depends on. */
    grpDeltaT.classList.remove('hidden');
    grpShaftD.classList.toggle('hidden', !isShrink);
    grpHubBore.classList.toggle('hidden', !isShrink);
    grpHubOD.classList.toggle('hidden', !isShrink);
    grpStripLen.classList.toggle('hidden', !isBi);
    grpT1.classList.toggle('hidden', !isBi);
    grpT2.classList.toggle('hidden', !isBi);
    grpArea.classList.toggle('hidden', !isStress);
    matBar2.classList.toggle('hidden', !isBi);
  }

  /* ══════════════════════════════════════════════════════════════
     14. INPUT HANDLERS
     ══════════════════════════════════════════════════════════════ */
  inpDeltaT.addEventListener('input', function () {
    syncDeltaTDisplays();
    triggerAnim();
  });

  /* Companion number input — display units, converts back to SI slider */
  inpDeltaTNum.addEventListener('input', function () {
    var v = parseFloat(this.value);
    if (!isFinite(v)) return;
    var si = Math.max(-200, Math.min(500, Math.round(dtSI(v))));
    inpDeltaT.value = si;
    valDeltaT.textContent = (dtD(si) >= 0 ? '+' : '') + Math.round(dtD(si)) + ' ' + tU();
    triggerAnim();
  });
  inpDeltaTNum.addEventListener('blur', function () { syncDeltaTDisplays(); });

  [inpLength, inpTInit, inpShaftD, inpHubBore, inpHubOD, inpStripLen, inpT1, inpT2, inpArea].forEach(function (el) {
    el.addEventListener('input', function () { triggerAnim(); });
  });

  /* ══════════════════════════════════════════════════════════════
     15. PRESETS
     ══════════════════════════════════════════════════════════════ */
  var PRESETS = {
    linear: [
      { name: 'Rail section +40\u00B0C', mat: 'Steel (carbon)', set: { L0: 25000 * 0.02, dT: 40 } }, /* scaled 500mm shown */
      { name: 'Bridge girder summer', mat: 'Steel (carbon)', set: { L0: 2000, dT: 60 } },
      { name: 'Gauge block +5\u00B0C', mat: 'Steel (carbon)', set: { L0: 25, dT: 5 } },
      { name: 'Al vs Invar demo', mat: 'Aluminum 6061', set: { L0: 1000, dT: 100 } }
    ],
    shrinkfit: [
      { name: 'Gear hub \u00D850', mat: 'Steel (carbon)', set: { dShaft: 50, dBore: 49.95, dHub: 100, dT: 120 } },
      { name: 'Bearing race \u00D880', mat: 'Steel (carbon)', set: { dShaft: 80, dBore: 79.96, dHub: 140, dT: 80 } },
      { name: 'Bronze bush \u00D830', mat: 'Brass', set: { dShaft: 30, dBore: 29.97, dHub: 60, dT: 90 } }
    ],
    bimetallic: [
      { name: 'Thermostat (Brass/Invar)', mat: 'Brass', mat2: 'Invar', set: { strip: 50, t1: 0.5, t2: 0.5, dT: 30 } },
      { name: 'Steel/Copper strip', mat: 'Steel (carbon)', mat2: 'Copper', set: { strip: 100, t1: 1, t2: 1, dT: 100 } },
      { name: 'Max deflection demo', mat: 'Invar', mat2: 'Aluminum 6061', set: { strip: 150, t1: 0.8, t2: 0.8, dT: 150 } }
    ],
    stress: [
      { name: 'Clamped steam pipe', mat: 'Steel (carbon)', set: { L0: 1000, area: 800, dT: 180 } },
      { name: 'Concrete slab +30\u00B0C', mat: 'Concrete', set: { L0: 2000, area: 10000, dT: 30 } },
      { name: 'Al bus-bar +80\u00B0C', mat: 'Aluminum 6061', set: { L0: 500, area: 300, dT: 80 } }
    ]
  };
  /* Rail preset scaled oddly above — fix to plain value */
  PRESETS.linear[0].set.L0 = 2000;
  PRESETS.linear[0].name = 'Rail (2 m shown) +40\u00B0C';

  function findMat(name) {
    for (var i = 0; i < MATERIALS.length; i++) if (MATERIALS[i].name === name) return i;
    return 0;
  }

  function applyPreset(p) {
    matIdx1 = findMat(p.mat);
    updateMatBtns(matBtns1, matIdx1);
    if (p.mat2 !== undefined) {
      matIdx2 = findMat(p.mat2);
      updateMatBtns(matBtns2, matIdx2);
    }
    var s = p.set;
    if (s.L0 !== undefined) inpLength.value = +lenD(s.L0).toFixed(isImp() ? 3 : 0);
    if (s.dShaft !== undefined) inpShaftD.value = +lenD(s.dShaft).toFixed(isImp() ? 4 : 2);
    if (s.dBore !== undefined) inpHubBore.value = +lenD(s.dBore).toFixed(isImp() ? 4 : 2);
    if (s.dHub !== undefined) inpHubOD.value = +lenD(s.dHub).toFixed(isImp() ? 3 : 1);
    if (s.strip !== undefined) inpStripLen.value = +lenD(s.strip).toFixed(isImp() ? 3 : 0);
    if (s.t1 !== undefined) inpT1.value = +lenD(s.t1).toFixed(isImp() ? 3 : 1);
    if (s.t2 !== undefined) inpT2.value = +lenD(s.t2).toFixed(isImp() ? 3 : 1);
    if (s.area !== undefined) inpArea.value = +areaD(s.area).toFixed(isImp() ? 3 : 0);
    if (s.dT !== undefined) { inpDeltaT.value = s.dT; syncDeltaTDisplays(); }
    triggerAnim();
  }

  function buildPresetBtns() {
    if (!presetBtnsEl) return;
    var list = PRESETS[calcMode] || [];
    presetBtnsEl.innerHTML = '';
    list.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'preset-btn';
      b.type = 'button';
      b.textContent = p.name;
      b.addEventListener('click', function () { applyPreset(p); });
      presetBtnsEl.appendChild(b);
    });
    if (presetBar) presetBar.classList.toggle('hidden', list.length === 0);
  }

  /* ══════════════════════════════════════════════════════════════
     16. RESET
     ══════════════════════════════════════════════════════════════ */
  var DEFAULTS = { L0: 500, T0: 20, dT: 100, dShaft: 50, dBore: 49.95, dHub: 100, strip: 100, t1: 1, t2: 1, area: 500 };

  function resetInputs() {
    inpLength.value = +lenD(DEFAULTS.L0).toFixed(isImp() ? 3 : 0);
    inpTInit.value = Math.round(tAbsD(DEFAULTS.T0));
    inpShaftD.value = +lenD(DEFAULTS.dShaft).toFixed(isImp() ? 4 : 2);
    inpHubBore.value = +lenD(DEFAULTS.dBore).toFixed(isImp() ? 4 : 2);
    inpHubOD.value = +lenD(DEFAULTS.dHub).toFixed(isImp() ? 3 : 1);
    inpStripLen.value = +lenD(DEFAULTS.strip).toFixed(isImp() ? 3 : 0);
    inpT1.value = +lenD(DEFAULTS.t1).toFixed(isImp() ? 3 : 1);
    inpT2.value = +lenD(DEFAULTS.t2).toFixed(isImp() ? 3 : 1);
    inpArea.value = +areaD(DEFAULTS.area).toFixed(isImp() ? 3 : 0);
    inpDeltaT.value = DEFAULTS.dT;
    syncDeltaTDisplays();
    triggerAnim();
  }
  if (btnReset) btnReset.addEventListener('click', resetInputs);

  /* ══════════════════════════════════════════════════════════════
     17. EXPORT — CSV + PNG (watermarked)
     ══════════════════════════════════════════════════════════════ */
  function csvEscape(v) { return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }

  function buildCSV() {
    var rows = [];
    var m = MATERIALS[matIdx1];
    rows.push(['NHIT VisualLab \u2014 Thermal Expansion Calculator']);
    rows.push(['https://nhitvisuallab.org/tools/thermal-expansion/']);
    rows.push(['Mode', calcMode]);
    rows.push(['Material', m.name]);
    rows.push(['alpha (1e-6/degC)', (m.alpha * 1e6).toFixed(2)]);
    rows.push([]);
    var dT, i;
    if (calcMode === 'linear') {
      var r = getLinearResults();
      rows.push(['L0 (mm)', r.L0]);
      rows.push([]);
      rows.push(['dT (degC)', 'dL (mm)', 'L final (mm)', 'strain (microstrain)']);
      for (dT = -200; dT <= 500; dT += 25) {
        rows.push([dT, (m.alpha * r.L0 * dT).toFixed(6), (r.L0 * (1 + m.alpha * dT)).toFixed(5), (m.alpha * dT * 1e6).toFixed(2)]);
      }
    } else if (calcMode === 'shrinkfit') {
      var s = getShrinkFitResults();
      rows.push(['Shaft dia (mm)', s.dShaft]);
      rows.push(['Hub bore (mm)', s.dBore]);
      rows.push(['Hub OD (mm)', s.dHub]);
      rows.push(['Interference (mm)', s.interference.toFixed(4)]);
      rows.push(['dT required (degC)', s.dTReq.toFixed(2)]);
      rows.push(['Contact pressure (MPa)', s.pressure.toFixed(2)]);
      rows.push([]);
      rows.push(['Hub heating dT (degC)', 'Bore expansion (mm)', 'Effective bore (mm)', 'Assembles?']);
      for (dT = 0; dT <= 500; dT += 25) {
        var exp = m.alpha * s.dBore * dT;
        rows.push([dT, exp.toFixed(5), (s.dBore + exp).toFixed(5), (s.dBore + exp >= s.dShaft || s.interference <= 0) ? 'yes' : 'no']);
      }
    } else if (calcMode === 'bimetallic') {
      var b = getBimetallicResults();
      rows.push(['Material 2', b.m2.name]);
      rows.push(['Strip length (mm)', b.L]);
      rows.push(['t1 (mm)', b.t1]);
      rows.push(['t2 (mm)', b.t2]);
      rows.push([]);
      rows.push(['dT (degC)', 'curvature (1/mm)', 'radius (mm)', 'tip deflection (mm)']);
      var m1 = b.m1, m2 = b.m2;
      var mm = b.t1 / b.t2, n = m1.E / m2.E, h = b.t1 + b.t2;
      var dA = Math.abs(m2.alpha - m1.alpha);
      var den = h * (3 * (1 + mm) * (1 + mm) + (1 + mm * n) * (mm * mm + 1 / (mm * n)));
      for (dT = -200; dT <= 500; dT += 25) {
        var k = den !== 0 ? 6 * dA * dT * (1 + mm) * (1 + mm) / den : 0;
        var R = k !== 0 ? 1 / Math.abs(k) : Infinity;
        var defl = k !== 0 ? R - R * Math.cos(b.L * k) : 0;
        rows.push([dT, k.toExponential(4), isFinite(R) ? R.toFixed(2) : 'inf', defl.toFixed(4)]);
      }
    } else {
      var st = getStressResults();
      rows.push(['L0 (mm)', st.L0]);
      rows.push(['Area (mm2)', st.A]);
      rows.push(['E (MPa)', m.E]);
      rows.push([]);
      rows.push(['dT (degC)', 'stress (MPa)', 'wall force (kN)', 'suppressed dL (mm)']);
      for (dT = -200; dT <= 500; dT += 25) {
        var sg = m.E * m.alpha * dT;
        rows.push([dT, sg.toFixed(3), (sg * st.A / 1000).toFixed(3), (m.alpha * st.L0 * dT).toFixed(5)]);
      }
    }
    return rows.map(function (row) {
      return row.map(function (cell) { return csvEscape(String(cell)); }).join(',');
    }).join('\n');
  }

  function doExportCSV() {
    var blob = new Blob([buildCSV()], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'thermal-expansion-' + calcMode + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 500);
  }

  function doExportPNG() {
    var out = document.createElement('canvas');
    out.width = canvas.width;
    out.height = canvas.height;
    var octx = out.getContext('2d');
    octx.fillStyle = '#0d1117';
    octx.fillRect(0, 0, out.width, out.height);
    octx.drawImage(canvas, 0, 0);
    /* Watermark */
    var dpr = window.devicePixelRatio || 1;
    octx.save();
    octx.scale(dpr, dpr);
    octx.font = '600 12px ' + getFont();
    octx.fillStyle = 'rgba(139,157,195,0.55)';
    octx.textAlign = 'left';
    octx.fillText('NHIT VisualLab/tools/thermal-expansion', 12, 20);
    octx.restore();
    var a = document.createElement('a');
    a.download = 'thermal-expansion-' + calcMode + '.png';
    a.href = out.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (btnCSV) btnCSV.addEventListener('click', doExportCSV);
  if (btnPNG) btnPNG.addEventListener('click', doExportPNG);

  /* ══════════════════════════════════════════════════════════════
     18. RIGHT-CLICK CONTEXT MENU (canvas)
     ══════════════════════════════════════════════════════════════ */
  function copyResult() {
    var txt = '';
    var cells = document.querySelectorAll('#readout-panel .readout-cell');
    cells.forEach(function (c) {
      var l = c.querySelector('.ro-label').textContent;
      var v = c.querySelector('.ro-value').textContent;
      txt += l + ': ' + v + '\n';
    });
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt.trim());
    }
  }

  function hideCtxMenu() { if (ctxMenu) ctxMenu.classList.add('hidden'); }

  if (ctxMenu) {
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      ctxMenu.classList.remove('hidden');
      var mw = ctxMenu.offsetWidth || 180;
      var mh = ctxMenu.offsetHeight || 160;
      var x = Math.min(e.clientX, window.innerWidth - mw - 8);
      var y = Math.min(e.clientY, window.innerHeight - mh - 8);
      ctxMenu.style.left = x + 'px';
      ctxMenu.style.top = y + 'px';
    });
    document.addEventListener('click', hideCtxMenu);
    document.addEventListener('scroll', hideCtxMenu, true);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideCtxMenu(); });
    ctxMenu.addEventListener('click', function (e) {
      var act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      if (act === 'png') doExportPNG();
      else if (act === 'csv') doExportCSV();
      else if (act === 'copy') copyResult();
      else if (act === 'reset') resetInputs();
      hideCtxMenu();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     19. CUSTOM MATERIAL MODAL
     ══════════════════════════════════════════════════════════════ */
  var cmModal = document.getElementById('cm-modal');
  var cmName = document.getElementById('cm-name');
  var cmAlpha = document.getElementById('cm-alpha');
  var cmE = document.getElementById('cm-e');
  var cmNu = document.getElementById('cm-nu');
  var cmAlphaLbl = document.getElementById('cm-alpha-lbl');
  var cmELbl = document.getElementById('cm-e-lbl');
  var cmErr = document.getElementById('cm-err');
  var customCount = 0;

  function openCmModal() {
    if (!cmModal) return;
    cmAlphaLbl.textContent = '\u03B1 (\u00D710\u207B\u2076 per ' + tU() + ')';
    cmELbl.textContent = isImp() ? 'E (\u00D710\u2076 psi)' : 'E (GPa)';
    cmErr.classList.add('hidden');
    cmModal.classList.add('active');
    cmName.focus();
  }
  function closeCmModal() {
    if (cmModal) cmModal.classList.remove('active');
  }
  if (btnCustomMat) btnCustomMat.addEventListener('click', openCmModal);
  var cmClose = document.getElementById('cm-close');
  var cmCancel = document.getElementById('cm-cancel');
  var cmAdd = document.getElementById('cm-add');
  if (cmClose) cmClose.addEventListener('click', closeCmModal);
  if (cmCancel) cmCancel.addEventListener('click', closeCmModal);
  if (cmModal) cmModal.addEventListener('click', function (e) { if (e.target === cmModal) closeCmModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cmModal && cmModal.classList.contains('active')) closeCmModal();
  });

  if (cmAdd) cmAdd.addEventListener('click', function () {
    var name = (cmName.value || '').trim() || ('Custom ' + (customCount + 1));
    var aDisp = parseFloat(cmAlpha.value);
    var eDisp = parseFloat(cmE.value);
    var nu = parseFloat(cmNu.value);
    if (!isFinite(aDisp) || aDisp <= 0 || aDisp > 300) {
      cmErr.textContent = 'Enter \u03B1 between 0.1 and 300 (\u00D710\u207B\u2076 per ' + tU() + ').';
      cmErr.classList.remove('hidden');
      return;
    }
    if (!isFinite(eDisp) || eDisp <= 0) {
      cmErr.textContent = isImp() ? 'Enter E in \u00D710\u2076 psi (e.g. 29 for steel).' : 'Enter E in GPa (e.g. 200 for steel).';
      cmErr.classList.remove('hidden');
      return;
    }
    if (!isFinite(nu) || nu <= 0 || nu >= 0.5) nu = 0.3;
    /* Convert display → SI: α per °F ×1.8 → per °C; E Mpsi → MPa ×6894.76/1000 */
    var alphaSI = (isImp() ? aDisp * 1.8 : aDisp) * 1e-6;
    var eSI = isImp() ? eDisp * 6894.757 : eDisp * 1000;   /* MPa */
    MATERIALS.push({
      name: name, alpha: alphaSI, E: eSI, nu: nu,
      color: CUSTOM_COLORS[customCount % CUSTOM_COLORS.length]
    });
    customCount++;
    matIdx1 = MATERIALS.length - 1;
    rebuildMatButtons();
    closeCmModal();
    cmName.value = ''; cmAlpha.value = ''; cmE.value = ''; cmNu.value = '';
    triggerAnim();
  });

  /* ══════════════════════════════════════════════════════════════
     20. LEARNING PANELS  (Live equations + What-if coach, KaTeX)
     ══════════════════════════════════════════════════════════════ */
  var lpEqBody = document.getElementById('lp-eq-body');
  var lpCoachBody = document.getElementById('lp-coach-body');
  var _learnCache = { eq: '', coach: '' };

  function fmtN(x, dp) { return isFinite(x) ? (+x).toFixed(dp) : '\u221E'; }

  function updateLearnPanels() {
    if (!lpEqBody) return;
    var html = '';
    var coach = '';
    var m = MATERIALS[matIdx1];
    var aTx = (m.alpha * 1e6).toFixed(1);

    if (calcMode === 'linear') {
      var r = getLinearResults();
      html += '<div class="eq-line">\\[ \\Delta L = \\alpha \\cdot L_0 \\cdot \\Delta T \\]</div>';
      html += '<div class="eq-line">\\( \\Delta L = ' + aTx + ' \\times 10^{-6} \\cdot ' + fmtN(r.L0, 0) +
        '\\,\\mathrm{mm} \\cdot ' + fmtN(r.dT, 0) + '\\,\\mathrm{^\\circ C} = \\mathbf{' + fmtN(r.dL, 4) + '\\;\\mathrm{mm}} \\)</div>';
      html += '<div class="eq-line">\\( \\varepsilon_{th} = \\alpha \\cdot \\Delta T = ' + fmtN(r.strain * 1e6, 1) + '\\;\\mu\\varepsilon \\)</div>';

      var invar = MATERIALS[7];
      if (m.name !== invar.name && r.dT !== 0) {
        var ratio = m.alpha / invar.alpha;
        coach += '<li>Swap to <strong>Invar</strong> and the same bar would move only ' +
          formatDL(invar.alpha * r.L0 * r.dT) + ' \u2014 ' + ratio.toFixed(0) + '\u00D7 less.</li>';
      }
      if (Math.abs(r.dT) > 300) coach += '<li>Above ~300 \u00B0C swings, \u03B1 itself drifts with temperature \u2014 treat the constant-\u03B1 result as an estimate.</li>';
      coach += '<li>Free expansion produces <strong>zero stress</strong>. Constrain the bar (see the Thermal Stress tab) and this same \u0394T would create ' + formatStress(Math.abs(m.E * m.alpha * r.dT)) + '.</li>';
    } else if (calcMode === 'shrinkfit') {
      var s = getShrinkFitResults();
      html += '<div class="eq-line">\\[ \\Delta T_{req} = \\dfrac{\\delta}{\\alpha \\cdot d_{bore}} \\]</div>';
      if (s.interference > 0) {
        html += '<div class="eq-line">\\( \\Delta T_{req} = \\dfrac{' + fmtN(s.interference, 3) + '}{' + aTx +
          ' \\times 10^{-6} \\cdot ' + fmtN(s.dBore, 2) + '} = \\mathbf{' + fmtN(s.dTReq, 1) + '\\;\\mathrm{^\\circ C}} \\)</div>';
      } else {
        html += '<div class="eq-line">\\( \\delta \\le 0 \\;\\Rightarrow\\; \\text{clearance fit, no heating needed} \\)</div>';
      }
      html += '<div class="eq-line">\\[ p = \\dfrac{E\\,\\delta\\,(D^2 - d^2)}{2\\,d\\,D^2} \\]</div>';
      if (s.pressure > 0) html += '<div class="eq-line">\\( p = \\mathbf{' + fmtN(s.pressure, 1) + '\\;\\mathrm{MPa}} \\)</div>';

      if (s.interference > 0) {
        coach += '<li>Add a <strong>20\u201350 \u00B0C margin</strong> above \u0394T<sub>req</sub> = ' + dtD(s.dTReq).toFixed(0) + ' ' + tU() + ' so the hub slides on before it cools and grips mid-assembly.</li>';
        if (dtD(s.dTReq) > dtD(300)) coach += '<li>Required heating exceeds ' + Math.round(dtD(300)) + ' ' + tU() + ' \u2014 risky for heat-treated parts (tempering). Consider cooling the shaft in dry ice or liquid nitrogen instead.</li>';
      } else {
        coach += '<li>Bore is larger than the shaft \u2014 this is a clearance fit; no interference pressure develops.</li>';
      }
      if (!s.geomOK) coach += '<li><strong>Fix the geometry:</strong> hub OD must exceed both shaft and bore diameters.</li>';
    } else if (calcMode === 'bimetallic') {
      var b = getBimetallicResults();
      html += '<div class="eq-line">\\[ \\kappa = \\dfrac{6(\\alpha_2 - \\alpha_1)\\,\\Delta T\\,(1+m)^2}{h\\left[3(1+m)^2 + (1+mn)\\left(m^2 + \\tfrac{1}{mn}\\right)\\right]} \\]</div>';
      html += '<div class="eq-line">\\( m = t_1/t_2 = ' + fmtN(b.t1 / b.t2, 2) + ', \\; n = E_1/E_2 = ' + fmtN(b.m1.E / b.m2.E, 2) + ' \\)</div>';
      html += '<div class="eq-line">\\( \\kappa = ' + (b.kappa !== 0 ? b.kappa.toExponential(3).replace('e', ' \\times 10^{') + '}' : '0') + '\\;\\mathrm{mm^{-1}}, \\quad R = ' + (isFinite(b.radius) && b.radius < 1e6 ? '\\mathbf{' + fmtN(b.radius, 1) + '\\;\\mathrm{mm}}' : '\\infty') + ' \\)</div>';

      var dA6 = Math.abs(b.m2.alpha - b.m1.alpha) * 1e6;
      coach += '<li>Deflection scales with \u0394\u03B1 \u2014 this pair differs by ' + dA6.toFixed(1) + ' \u00D710\u207B\u2076/\u00B0C. Brass + Invar (17.8 apart) is the classic thermostat pairing.</li>';
      if (dA6 < 1) coach += '<li>These two materials expand almost identically \u2014 the strip barely bends. Pick materials farther apart in \u03B1.</li>';
      coach += '<li>Thinner strips bend more: curvature is inversely proportional to total thickness h.</li>';
    } else {
      var st = getStressResults();
      html += '<div class="eq-line">\\[ \\sigma = E \\cdot \\alpha \\cdot \\Delta T \\]</div>';
      html += '<div class="eq-line">\\( \\sigma = ' + fmtN(m.E, 0) + ' \\cdot ' + aTx + ' \\times 10^{-6} \\cdot ' + fmtN(st.dT, 0) +
        ' = \\mathbf{' + fmtN(Math.abs(st.stress), 1) + '\\;\\mathrm{MPa}} \\; \\text{(' + (st.dT > 0 ? 'compressive' : st.dT < 0 ? 'tensile' : '\u2014') + ')} \\)</div>';
      html += '<div class="eq-line">\\( F = \\sigma \\cdot A = ' + fmtN(Math.abs(st.force), 1) + '\\;\\mathrm{kN} \\)</div>';

      var pct = Math.abs(st.stress) / MILD_STEEL_YIELD * 100;
      if (m.name === 'Steel (carbon)') {
        coach += '<li>That is <strong>' + pct.toFixed(0) + '%</strong> of mild steel\u2019s ~250 MPa yield strength' + (pct > 100 ? ' \u2014 the bar yields or buckles!' : '.') + '</li>';
      }
      if (st.dT > 0) coach += '<li>Heated + constrained = <strong>compression</strong>; slender members buckle long before they crush. This is the railway \u201Csun kink\u201D mechanism.</li>';
      if (st.dT < 0) coach += '<li>Cooled + constrained = <strong>tension</strong> \u2014 this is why rigid pipe runs crack in winter.</li>';
      coach += '<li>Note \u03C3 does not depend on length \u2014 a 10 m pipe and a 10 cm stub see the same stress if fully constrained.</li>';
    }

    if (html !== _learnCache.eq) { lpEqBody.innerHTML = html; _learnCache.eq = html; }
    var coachHtml = '<ul class="coach-list">' + coach + '</ul>';
    if (lpCoachBody && coachHtml !== _learnCache.coach) { lpCoachBody.innerHTML = coachHtml; _learnCache.coach = coachHtml; }
  }

  function wireLearnPanels() {
    var expAll = document.getElementById('learn-expand-all');
    var colAll = document.getElementById('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () {
      cards.forEach(function (c) { c.open = true; });
    });
    if (colAll) colAll.addEventListener('click', function () {
      cards.forEach(function (c) { c.open = false; });
    });
  }

  /* ══════════════════════════════════════════════════════════════
     21. SHOW-CALCULATIONS MODAL (KaTeX)
     ══════════════════════════════════════════════════════════════ */
  function calcStep(num, title, formula, calculation, result) {
    var html = '<div class="cs-step">';
    html += '<div class="cs-step-hd">';
    html += '<span class="cs-num">Step ' + num + '</span>';
    html += '<span class="cs-title">' + title + '</span>';
    html += '</div>';
    if (formula) html += '<div class="cs-formula">' + formula + '</div>';
    if (calculation) html += '<div class="cs-calc">' + calculation.replace(/\n/g, '<br>') + '</div>';
    if (result != null) html += '<div class="cs-result">\u2192 <strong>' + result + '</strong></div>';
    html += '</div>';
    return html;
  }

  function givenBlock(pairs) {
    var html = '<div class="cs-inputs"><span class="cs-badge">Given \u2014 Current Simulation State</span><div class="cs-given">';
    pairs.forEach(function (p) { html += '<span>' + p + '</span>'; });
    html += '</div><p class="cs-si-note">&#9432; All calculations in SI (mm, \u00B0C, MPa). Displayed readouts follow the SI / Imperial toggle.</p></div>';
    return html;
  }

  function buildCalcSteps() {
    var html = '';
    var m = MATERIALS[matIdx1];
    var aTx = (m.alpha * 1e6).toFixed(1);

    if (calcMode === 'linear') {
      var r = getLinearResults();
      html += givenBlock([
        'Material: ' + m.name,
        '\u03B1 = ' + aTx + '\u00D710\u207B\u2076/\u00B0C',
        'L\u2080 = ' + r.L0.toFixed(1) + ' mm',
        '\u0394T = ' + r.dT.toFixed(0) + ' \u00B0C'
      ]);
      html += calcStep(1, 'Thermal strain',
        '\\[ \\varepsilon_{th} = \\alpha \\cdot \\Delta T \\]',
        '\\( \\varepsilon_{th} = ' + aTx + ' \\times 10^{-6} \\cdot ' + r.dT.toFixed(0) + ' \\)',
        (r.strain * 1e6).toFixed(2) + ' \u03BC\u03B5');
      html += calcStep(2, 'Length change',
        '\\[ \\Delta L = \\alpha \\cdot L_0 \\cdot \\Delta T \\]',
        '\\( \\Delta L = ' + aTx + ' \\times 10^{-6} \\cdot ' + r.L0.toFixed(0) + ' \\cdot ' + r.dT.toFixed(0) + ' \\)',
        formatDL(r.dL));
      html += calcStep(3, 'Final length',
        '\\[ L = L_0 + \\Delta L \\]',
        '\\( L = ' + r.L0.toFixed(2) + ' + ' + r.dL.toFixed(4) + ' \\)',
        fmtLen(r.Lf, isImp() ? 5 : 4) + ' ' + lenU());
      html += calcStep(4, 'Reality check',
        null,
        'Free expansion produces zero stress. If this bar were fully constrained, the suppressed strain would instead create \\( \\sigma = E\\alpha\\Delta T = ' + Math.abs(m.E * m.alpha * r.dT).toFixed(1) + '\\;\\mathrm{MPa} \\) \u2014 try the Thermal Stress tab.',
        null);
    } else if (calcMode === 'shrinkfit') {
      var s = getShrinkFitResults();
      html += givenBlock([
        'Material: ' + m.name,
        '\u03B1 = ' + aTx + '\u00D710\u207B\u2076/\u00B0C',
        'E = ' + (m.E / 1000).toFixed(0) + ' GPa',
        'Shaft \u00D8 = ' + s.dShaft.toFixed(2) + ' mm',
        'Bore \u00D8 = ' + s.dBore.toFixed(2) + ' mm',
        'Hub OD = ' + s.dHub.toFixed(1) + ' mm'
      ]);
      html += calcStep(1, 'Interference',
        '\\[ \\delta = d_{shaft} - d_{bore} \\]',
        '\\( \\delta = ' + s.dShaft.toFixed(2) + ' - ' + s.dBore.toFixed(2) + ' \\)',
        formatDL(s.interference));
      if (s.interference > 0) {
        html += calcStep(2, 'Required heating of the hub',
          '\\[ \\Delta T_{req} = \\dfrac{\\delta}{\\alpha \\cdot d_{bore}} \\]',
          '\\( \\Delta T_{req} = \\dfrac{' + s.interference.toFixed(3) + '}{' + aTx + ' \\times 10^{-6} \\cdot ' + s.dBore.toFixed(2) + '} \\)',
          dtD(s.dTReq).toFixed(1) + ' ' + tU());
        html += calcStep(3, 'Contact pressure after cooling (same-material shaft & hub)',
          '\\[ p = \\dfrac{E\\,\\delta\\,(D^2 - d^2)}{2\\,d\\,D^2} \\]',
          '\\( p = \\dfrac{' + m.E.toFixed(0) + ' \\cdot ' + s.interference.toFixed(3) + ' \\cdot (' + (s.dHub * s.dHub).toFixed(0) + ' - ' + (s.dShaft * s.dShaft).toFixed(0) + ')}{2 \\cdot ' + s.dShaft.toFixed(1) + ' \\cdot ' + (s.dHub * s.dHub).toFixed(0) + '} \\)',
          formatStress(s.pressure));
        html += calcStep(4, 'Workshop practice',
          null,
          'Heat the hub 20\u201350 \u00B0C beyond \u0394T\u2098\u1D62\u2099 so it slides on before gripping. Above ~300 \u00B0C, heat-treated steels start to temper \u2014 cool the shaft cryogenically instead.',
          null);
      } else {
        html += calcStep(2, 'Clearance fit',
          null,
          'The bore is larger than the shaft (\\( \\delta \\le 0 \\)) \u2014 the parts assemble at room temperature and no contact pressure develops.',
          null);
      }
    } else if (calcMode === 'bimetallic') {
      var b = getBimetallicResults();
      html += givenBlock([
        'Layer 1: ' + b.m1.name + ' (\u03B1\u2081 = ' + (b.m1.alpha * 1e6).toFixed(1) + ')',
        'Layer 2: ' + b.m2.name + ' (\u03B1\u2082 = ' + (b.m2.alpha * 1e6).toFixed(1) + ')',
        'L = ' + b.L.toFixed(0) + ' mm',
        't\u2081 = ' + b.t1.toFixed(2) + ' mm, t\u2082 = ' + b.t2.toFixed(2) + ' mm',
        '\u0394T = ' + b.dT.toFixed(0) + ' \u00B0C'
      ]);
      html += calcStep(1, 'Geometry & stiffness ratios',
        '\\[ m = \\dfrac{t_1}{t_2}, \\qquad n = \\dfrac{E_1}{E_2}, \\qquad h = t_1 + t_2 \\]',
        '\\( m = ' + (b.t1 / b.t2).toFixed(3) + ', \\; n = ' + (b.m1.E / b.m2.E).toFixed(3) + ', \\; h = ' + b.h.toFixed(2) + '\\,\\mathrm{mm} \\)',
        null);
      html += calcStep(2, 'Curvature (Timoshenko, 1925)',
        '\\[ \\kappa = \\dfrac{6(\\alpha_2 - \\alpha_1)\\Delta T (1+m)^2}{h\\left[3(1+m)^2 + (1+mn)\\left(m^2 + \\tfrac{1}{mn}\\right)\\right]} \\]',
        '\\( \\kappa = ' + (b.kappa !== 0 ? b.kappa.toExponential(4).replace('e', ' \\times 10^{') + '}' : '0') + '\\;\\mathrm{mm^{-1}} \\)',
        (b.kappa * 1e3).toFixed(4) + ' /m');
      html += calcStep(3, 'Radius of curvature',
        '\\[ R = \\dfrac{1}{|\\kappa|} \\]',
        null,
        isFinite(b.radius) && b.radius < 1e6 ? formatRadius(b.radius) : '\u221E (straight)');
      html += calcStep(4, 'Tip deflection (cantilever, fixed at one end)',
        '\\[ y_{tip} = R\\left(1 - \\cos\\tfrac{L}{R}\\right) \\]',
        null,
        formatDL(b.deflection));
      html += calcStep(5, 'Design note',
        null,
        'Thermostats exploit exactly this: the strip\u2019s bend opens or closes a contact at a set temperature. Maximise \\( \\alpha_2 - \\alpha_1 \\) (e.g. brass + Invar) and minimise h for the sharpest response.',
        null);
    } else {
      var st = getStressResults();
      html += givenBlock([
        'Material: ' + m.name,
        '\u03B1 = ' + aTx + '\u00D710\u207B\u2076/\u00B0C',
        'E = ' + (m.E / 1000).toFixed(0) + ' GPa',
        'L\u2080 = ' + st.L0.toFixed(0) + ' mm',
        'A = ' + st.A.toFixed(0) + ' mm\u00B2',
        '\u0394T = ' + st.dT.toFixed(0) + ' \u00B0C'
      ]);
      html += calcStep(1, 'Free expansion the walls deny',
        '\\[ \\Delta L_{free} = \\alpha \\cdot L_0 \\cdot \\Delta T \\]',
        '\\( \\Delta L_{free} = ' + aTx + ' \\times 10^{-6} \\cdot ' + st.L0.toFixed(0) + ' \\cdot ' + st.dT.toFixed(0) + ' \\)',
        formatDL(st.freeDL));
      html += calcStep(2, 'Suppressed strain',
        '\\[ \\varepsilon = \\dfrac{\\Delta L_{free}}{L_0} = \\alpha \\cdot \\Delta T \\]',
        '\\( \\varepsilon = ' + (st.strain * 1e6).toFixed(1) + '\\;\\mu\\varepsilon \\)',
        null);
      html += calcStep(3, 'Thermal stress',
        '\\[ \\sigma = E \\cdot \\varepsilon = E \\cdot \\alpha \\cdot \\Delta T \\]',
        '\\( \\sigma = ' + m.E.toFixed(0) + ' \\cdot ' + aTx + ' \\times 10^{-6} \\cdot ' + st.dT.toFixed(0) + ' \\)',
        formatStress(Math.abs(st.stress)) + (st.dT > 0 ? ' compressive' : st.dT < 0 ? ' tensile' : ''));
      html += calcStep(4, 'Force on the walls',
        '\\[ F = \\sigma \\cdot A \\]',
        '\\( F = ' + Math.abs(st.stress).toFixed(1) + ' \\cdot ' + st.A.toFixed(0) + '\\,\\mathrm{mm^2} \\)',
        forceD(Math.abs(st.force)).toFixed(1) + ' ' + forceU());
      html += calcStep(5, 'Context',
        null,
        'Mild steel yields at roughly 250 MPa \u2014 the current stress is ' + (Math.abs(st.stress) / MILD_STEEL_YIELD * 100).toFixed(0) + '% of that. Slender constrained members usually <em>buckle</em> in compression well before yielding, which is why pipe runs get expansion loops and concrete slabs get joints.',
        null);
    }
    return html;
  }

  function openCalcModal() {
    var modal = document.getElementById('calc-modal');
    var body = document.getElementById('calc-modal-body');
    if (!modal || !body) return;
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    var cb = document.getElementById('calc-modal-close'); if (cb) cb.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCalcModal() {
    var modal = document.getElementById('calc-modal'); if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    var b = document.getElementById('btn-calc'); if (b) b.focus();
  }
  var calcBtn = document.getElementById('btn-calc');
  if (calcBtn) calcBtn.addEventListener('click', openCalcModal);
  var calcClose = document.getElementById('calc-modal-close');
  if (calcClose) calcClose.addEventListener('click', closeCalcModal);
  var calcModalEl = document.getElementById('calc-modal');
  if (calcModalEl) calcModalEl.addEventListener('click', function (e) {
    if (e.target === calcModalEl) closeCalcModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && calcModalEl && calcModalEl.classList.contains('active')) closeCalcModal();
  });

  /* ══════════════════════════════════════════════════════════════
     22. EXPLORE MODE
     ══════════════════════════════════════════════════════════════ */
  var EXPLORE_DATA = {
    fundamentals: [
      {
        title: 'Coefficient of Thermal Expansion (\u03B1)',
        formula: '\u0394L = \u03B1 \u00D7 L\u2080 \u00D7 \u0394T',
        desc: 'The coefficient of linear thermal expansion (\u03B1) measures how much a material expands per degree of temperature change per unit length. It is expressed in units of 10\u207B\u2076/\u00B0C (or \u03BCm/m/\u00B0C). Higher \u03B1 means more expansion.',
        example: 'A 1 m aluminum bar (\u03B1 = 23.6) heated by 50\u00B0C expands by:\n\u0394L = 23.6\u00D710\u207B\u2076 \u00D7 1000 \u00D7 50 = 1.18 mm'
      },
      {
        title: 'Linear vs Area vs Volumetric Expansion',
        formula: '\u0394A = 2\u03B1\u00B7A\u2080\u00B7\u0394T  |  \u0394V = 3\u03B1\u00B7V\u2080\u00B7\u0394T',
        desc: 'Linear expansion applies to one dimension. For area expansion, use 2\u03B1 (surface coefficient). For volume expansion, use 3\u03B1 (volumetric coefficient). These approximations hold for small \u0394T values.',
        example: 'A 100 mm \u00D7 100 mm steel plate heated by 200\u00B0C:\n\u0394A = 2 \u00D7 12.0\u00D710\u207B\u2076 \u00D7 10000 \u00D7 200 = 48 mm\u00B2'
      },
      {
        title: 'Thermal Strain',
        formula: '\u03B5_thermal = \u03B1 \u00D7 \u0394T',
        desc: 'Thermal strain is dimensionless and represents the fractional change in length due to temperature change. Unlike mechanical strain, thermal strain does not produce stress in a free (unconstrained) body.',
        example: 'Copper heated by 100\u00B0C:\n\u03B5 = 16.5\u00D710\u207B\u2076 \u00D7 100 = 1650 \u03BC\u03B5 = 0.165%'
      },
      {
        title: 'Thermal Stress in Constrained Bodies',
        formula: '\u03C3 = E \u00D7 \u03B1 \u00D7 \u0394T',
        desc: 'When a material is prevented from expanding freely (e.g., a bar fixed between rigid walls), the suppressed expansion creates compressive stress. This thermal stress can be very large and cause buckling, cracking, or yielding. Try it live in the Thermal Stress tab of Simulate mode.',
        example: 'Steel bar constrained and heated by 100\u00B0C:\n\u03C3 = 200,000 \u00D7 12.0\u00D710\u207B\u2076 \u00D7 100 = 240 MPa'
      }
    ],
    materials: [
      {
        title: 'Aluminum \u2014 High Expansion',
        formula: '\u03B1 = 23.6 \u00D710\u207B\u2076/\u00B0C  |  E = 68.9 GPa',
        desc: 'Aluminum has one of the highest expansion coefficients among common engineering metals. This makes it challenging in precision assemblies but useful in bimetallic applications where large deflection is desired.',
        example: 'A 2 m aluminum beam on a bridge heated from 0\u00B0C to 40\u00B0C:\n\u0394L = 23.6\u00D710\u207B\u2076 \u00D7 2000 \u00D7 40 = 1.888 mm'
      },
      {
        title: 'Invar \u2014 Minimal Expansion',
        formula: '\u03B1 = 1.2 \u00D710\u207B\u2076/\u00B0C',
        desc: 'Invar (64% Fe, 36% Ni) was specifically developed for its near-zero thermal expansion. It is used in precision instruments, clock pendulums, shadow masks in CRT displays, and scientific apparatus where dimensional stability is critical.',
        example: 'Same 2 m bar in Invar heated by 40\u00B0C:\n\u0394L = 1.2\u00D710\u207B\u2076 \u00D7 2000 \u00D7 40 = 0.096 mm\n(20\u00D7 less than aluminum!)'
      },
      {
        title: 'Glass \u2014 Thermal Shock Risk',
        formula: '\u03B1 = 3.3 \u00D710\u207B\u2076/\u00B0C (borosilicate)',
        desc: 'Borosilicate glass (Pyrex) has low expansion and excellent thermal shock resistance. Soda-lime glass (\u03B1 \u2248 9) cracks easily because the surface cools faster than the interior, creating tensile stress. This is why Pyrex is used for laboratory and cookware.',
        example: 'Thermal shock failure temperature for soda-lime glass:\n\u0394T_max \u2248 \u03C3_tensile / (E \u00D7 \u03B1) \u2248 50 / (70,000 \u00D7 9\u00D710\u207B\u2076) \u2248 80\u00B0C'
      },
      {
        title: 'Thermal Expansion Comparison',
        formula: 'Ranked by \u03B1 (\u00D710\u207B\u2076/\u00B0C)',
        desc: 'From highest to lowest expansion: Aluminum (23.6), Brass (19.0), Stainless 304 (17.3), Copper (16.5), Steel & Concrete (12.0), Cast Iron (10.5), Titanium (8.6), Glass (3.3), Invar (1.2). The 20:1 range between Aluminum and Invar drives many engineering design decisions.',
        example: 'For a 1 m bar heated by 100\u00B0C:\nAluminum: 2.36 mm | Steel: 1.20 mm\nTitanium: 0.86 mm | Invar: 0.12 mm'
      }
    ],
    applications: [
      {
        title: 'Railroad Track Expansion Gaps',
        formula: 'Gap = \u03B1 \u00D7 L_rail \u00D7 \u0394T_max',
        desc: 'Railroad tracks are laid with small gaps between rails to allow for thermal expansion. Without gaps, heated rails buckle (sun kink). Modern continuously welded rail (CWR) is pre-stressed at the neutral temperature to minimize expansion forces.',
        example: 'A 25 m steel rail, \u0394T from -20\u00B0C to +60\u00B0C (80\u00B0C range):\nGap = 12.0\u00D710\u207B\u2076 \u00D7 25000 \u00D7 80 = 24 mm'
      },
      {
        title: 'Bridge Expansion Joints',
        formula: 'Joint movement = \u03B1 \u00D7 L_bridge \u00D7 \u0394T_annual',
        desc: 'Bridges use expansion joints (roller bearings, sliding plates, finger joints) to accommodate thermal movement. Steel bridges expand about 12 mm per 10 m per 100\u00B0C temperature range. Concrete bridges expand similarly.',
        example: 'A 200 m steel bridge, annual \u0394T of 60\u00B0C:\nMovement = 12.0\u00D710\u207B\u2076 \u00D7 200,000 \u00D7 60 = 144 mm'
      },
      {
        title: 'Bimetallic Thermostat',
        formula: 'Deflection \u221D (\u03B1\u2082 - \u03B1\u2081) \u00D7 \u0394T \u00D7 L\u00B2 / h',
        desc: 'Bimetallic thermostats use a coiled or straight bimetallic strip to open/close electrical contacts at set temperatures. Common pairs: brass/Invar (high deflection) or steel/copper. Used in room thermostats, circuit breakers, and automotive temperature gauges.',
        example: 'A brass/Invar strip (L=50 mm, h=1 mm, \u0394T=30\u00B0C):\nDeflection provides enough force to actuate a switch contact at the set temperature.'
      },
      {
        title: 'Thermal Stress in Piping Systems',
        formula: '\u03C3 = E \u00D7 \u03B1 \u00D7 \u0394T (if constrained)',
        desc: 'Steam and process piping undergoes large temperature swings. Expansion loops, bellows joints, and slip joints accommodate movement. Unrestrained expansion of a 100 m steam pipe at 200\u00B0C can exceed 400 mm. Piping flexibility analysis (ASME B31) is required for safety.',
        example: 'A 50 m steel steam pipe, \u0394T = 180\u00B0C:\n\u0394L = 12.0\u00D710\u207B\u2076 \u00D7 50,000 \u00D7 180 = 108 mm\nIf restrained: \u03C3 = 200,000 \u00D7 12\u00D710\u207B\u2076 \u00D7 180 = 432 MPa (exceeds yield!)'
      }
    ],
    design: [
      {
        title: 'Shrink Fit Design Principles',
        formula: '\u0394T_req = \u03B4 / (\u03B1 \u00D7 d)',
        desc: 'Shrink fitting creates a permanent joint by exploiting thermal expansion. The hub is heated (or shaft cooled) to create clearance for assembly. Upon cooling, the interference generates contact pressure that can transmit torque and axial loads without keys or fasteners.',
        example: 'Steel hub on 80 mm shaft, \u03B4 = 0.04 mm:\n\u0394T = 0.04 / (12.0\u00D710\u207B\u2076 \u00D7 80) = 41.7\u00B0C\nHeat hub to at least 62\u00B0C (from 20\u00B0C) + margin'
      },
      {
        title: 'Contact Pressure (Same-Material Shrink Fit)',
        formula: 'p = E\u00B7\u03B4\u00B7(D\u00B2\u2212d\u00B2) / (2\u00B7d\u00B7D\u00B2)',
        desc: 'The contact pressure between shaft and hub determines the joint strength. Combining the Lam\u00E9 thick-cylinder terms for the hub with the compression of the solid shaft, the Poisson terms cancel when both parts share one material, leaving this compact form. Higher D/d ratio gives more pressure for the same interference.',
        example: 'Steel, d=50 mm, D=100 mm, \u03B4=0.05 mm:\np = 200,000\u00D70.05\u00D7(10000\u22122500) / (2\u00D750\u00D710000)\np = 75 MPa'
      },
      {
        title: 'Thermal Compensation in Precision Design',
        formula: 'Use materials with matching \u03B1 or Invar',
        desc: 'Precision instruments and assemblies must minimize thermal drift. Strategies include: using Invar for critical dimensions, matching \u03B1 values for mating parts, symmetrical designs that cancel expansion, and active temperature control. Laser interferometers and coordinate measuring machines rely on these principles.',
        example: 'A steel gage block (25 mm) measured at 25\u00B0C vs calibration at 20\u00B0C:\nError = 12.0\u00D710\u207B\u2076 \u00D7 25 \u00D7 5 = 0.0015 mm = 1.5 \u03BCm\nThis exceeds Grade 0 tolerance!'
      },
      {
        title: 'Thermal Expansion in Composite Structures',
        formula: '\u03B1_composite depends on E and volume fraction',
        desc: 'Carbon fiber reinforced polymers (CFRP) can have near-zero or even negative \u03B1 in the fiber direction. By combining materials with positive and negative expansion, engineers create structures with tailored thermal properties for aerospace, satellites, and optical benches.',
        example: 'Carbon fiber: \u03B1 \u2248 -0.5 to +0.5 \u00D710\u207B\u2076/\u00B0C (longitudinal)\nEpoxy matrix: \u03B1 \u2248 50 \u00D710\u207B\u2076/\u00B0C\nLayup angle controls the composite \u03B1 from -1 to +30.'
      }
    ]
  };

  var currentExploreCat = 'fundamentals';

  exploreTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    currentExploreCat = e.target.dataset.value;
    exploreTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    renderExplore();
  });

  function renderExplore() {
    var cards = EXPLORE_DATA[currentExploreCat] || [];
    exploreCards.innerHTML = '';
    cards.forEach(function (c) {
      var div = document.createElement('div');
      div.className = 'explore-card';
      div.innerHTML =
        '<h3>' + c.title + '</h3>' +
        '<div class="ec-formula">' + c.formula + '</div>' +
        '<p>' + c.desc + '</p>' +
        '<div class="ec-example"><strong>Worked Example:</strong>\n' + c.example + '</div>';
      exploreCards.appendChild(div);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     23. PRACTICE MODE  (problems are stated & answered in SI)
     ══════════════════════════════════════════════════════════════ */
  var PRACTICE_GENERATORS = [
    function () {
      var m = MATERIALS[randInt(0, 9)];
      var L0 = randInt(100, 1500);
      var dT = randInt(20, 400);
      var dL = m.alpha * L0 * dT;
      return {
        text: 'A ' + L0 + ' mm ' + m.name + ' bar is heated by ' + dT + '\u00B0C. Calculate \u0394L.',
        answer: dL,
        unit: 'mm',
        tol: 0.001,
        solution: '\u0394L = \u03B1 \u00D7 L\u2080 \u00D7 \u0394T\n= ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + L0 + ' \u00D7 ' + dT + '\n= ' + dL.toFixed(4) + ' mm'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 5)];
      var L0 = randInt(200, 1000);
      var targetDL = (randInt(1, 20) * 0.1);
      var dT = targetDL / (m.alpha * L0);
      return {
        text: 'A ' + L0 + ' mm ' + m.name + ' bar must expand by ' + targetDL.toFixed(1) + ' mm. What \u0394T is needed?',
        answer: dT,
        unit: '\u00B0C',
        tol: 0.5,
        solution: '\u0394T = \u0394L / (\u03B1 \u00D7 L\u2080)\n= ' + targetDL.toFixed(1) + ' / (' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + L0 + ')\n= ' + dT.toFixed(1) + ' \u00B0C'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 6)];
      var dT = randInt(50, 300);
      var stress = m.E * m.alpha * dT;
      return {
        text: 'A constrained ' + m.name + ' bar is heated by ' + dT + '\u00B0C. What is the thermal stress? (E = ' + (m.E / 1000).toFixed(0) + ' GPa)',
        answer: stress,
        unit: 'MPa',
        tol: 1,
        solution: '\u03C3 = E \u00D7 \u03B1 \u00D7 \u0394T\n= ' + m.E + ' \u00D7 ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + dT + '\n= ' + stress.toFixed(1) + ' MPa'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 5)];
      var d = randInt(30, 100);
      var interf = (randInt(2, 8) * 0.01);
      var bore = d - interf;
      var dT = interf / (m.alpha * bore);
      return {
        text: 'A ' + m.name + ' hub (bore \u00D8' + bore.toFixed(2) + ' mm) must fit a \u00D8' + d + ' mm shaft. What \u0394T is needed for assembly?',
        answer: dT,
        unit: '\u00B0C',
        tol: 1,
        solution: 'Interference \u03B4 = ' + d + ' - ' + bore.toFixed(2) + ' = ' + interf.toFixed(2) + ' mm\n\u0394T = \u03B4 / (\u03B1 \u00D7 d_bore)\n= ' + interf.toFixed(2) + ' / (' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + bore.toFixed(2) + ')\n= ' + dT.toFixed(1) + ' \u00B0C'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 5)];
      var dT = randInt(50, 400);
      var strain = m.alpha * dT;
      return {
        text: 'Calculate the thermal strain in a ' + m.name + ' rod heated by ' + dT + '\u00B0C.',
        answer: strain * 1e6,
        unit: '\u03BC\u03B5',
        tol: 1,
        solution: '\u03B5 = \u03B1 \u00D7 \u0394T\n= ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + dT + '\n= ' + (strain * 1e6).toFixed(1) + ' \u03BC\u03B5'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 5)];
      var L0 = randInt(500, 2000);
      var dT = -randInt(20, 150);
      var dL = m.alpha * L0 * dT;
      return {
        text: 'A ' + L0 + ' mm ' + m.name + ' bar is cooled by ' + Math.abs(dT) + '\u00B0C. How much does it shrink?',
        answer: Math.abs(dL),
        unit: 'mm',
        tol: 0.001,
        solution: '\u0394L = \u03B1 \u00D7 L\u2080 \u00D7 \u0394T\n= ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + L0 + ' \u00D7 ' + dT + '\n= ' + dL.toFixed(4) + ' mm\nShrinkage = ' + Math.abs(dL).toFixed(4) + ' mm'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 6)];
      var d = randInt(30, 80);
      var D = d + randInt(20, 60);
      var interf = (randInt(3, 8) * 0.01);
      var p = (m.E * interf * (D * D - d * d)) / (2 * d * D * D);
      return {
        text: 'A ' + m.name + ' shrink fit (shaft and hub same material): shaft \u00D8' + d + ' mm, hub OD \u00D8' + D + ' mm, interference ' + interf.toFixed(2) + ' mm. Find contact pressure.',
        answer: p,
        unit: 'MPa',
        tol: 2,
        solution: 'p = E\u00B7\u03B4\u00B7(D\u00B2\u2212d\u00B2) / (2\u00B7d\u00B7D\u00B2)\n= ' + m.E + ' \u00D7 ' + interf.toFixed(2) + ' \u00D7 (' + (D * D) + '\u2212' + (d * d) + ') / (2 \u00D7 ' + d + ' \u00D7 ' + (D * D) + ')\n= ' + p.toFixed(1) + ' MPa'
      };
    },
    function () {
      var i1 = randInt(0, 4);
      var i2 = randInt(5, 9);
      var m1 = MATERIALS[i1], m2 = MATERIALS[i2];
      var L0 = randInt(50, 200);
      var dT = randInt(30, 150);
      var dL1 = m1.alpha * L0 * dT;
      var dL2 = m2.alpha * L0 * dT;
      var diff = Math.abs(dL1 - dL2);
      return {
        text: 'Two bars, each ' + L0 + ' mm long: ' + m1.name + ' and ' + m2.name + '. Both heated by ' + dT + '\u00B0C. What is the difference in expansion?',
        answer: diff,
        unit: 'mm',
        tol: 0.001,
        solution: m1.name + ': \u0394L = ' + (m1.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + L0 + ' \u00D7 ' + dT + ' = ' + dL1.toFixed(4) + ' mm\n' + m2.name + ': \u0394L = ' + (m2.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + L0 + ' \u00D7 ' + dT + ' = ' + dL2.toFixed(4) + ' mm\nDifference = ' + diff.toFixed(4) + ' mm'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 5)];
      var L = randInt(100, 500);
      var W = randInt(50, 200);
      var dT = randInt(50, 300);
      var dA = 2 * m.alpha * L * W * dT;
      return {
        text: 'A ' + L + ' mm \u00D7 ' + W + ' mm ' + m.name + ' plate is heated by ' + dT + '\u00B0C. Calculate the area expansion \u0394A.',
        answer: dA,
        unit: 'mm\u00B2',
        tol: 0.1,
        solution: '\u0394A = 2\u03B1 \u00D7 A\u2080 \u00D7 \u0394T\n= 2 \u00D7 ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + (L * W) + ' \u00D7 ' + dT + '\n= ' + dA.toFixed(2) + ' mm\u00B2'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 6)];
      var L0 = randInt(200, 1000);
      var Lf = L0 + (randInt(1, 30) * 0.01);
      var dL = Lf - L0;
      var dT = dL / (m.alpha * L0);
      return {
        text: 'A ' + m.name + ' bar (' + L0 + ' mm) expanded to ' + Lf.toFixed(2) + ' mm. What was the \u0394T?',
        answer: dT,
        unit: '\u00B0C',
        tol: 0.5,
        solution: '\u0394L = ' + Lf.toFixed(2) + ' - ' + L0 + ' = ' + dL.toFixed(2) + ' mm\n\u0394T = \u0394L / (\u03B1 \u00D7 L\u2080)\n= ' + dL.toFixed(2) + ' / (' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + L0 + ')\n= ' + dT.toFixed(1) + ' \u00B0C'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 5)];
      var side = randInt(20, 100);
      var dT = randInt(50, 300);
      var dV = 3 * m.alpha * side * side * side * dT;
      return {
        text: 'A ' + side + ' mm cube of ' + m.name + ' is heated by ' + dT + '\u00B0C. Calculate the volumetric expansion \u0394V.',
        answer: dV,
        unit: 'mm\u00B3',
        tol: 0.5,
        solution: 'V\u2080 = ' + side + '\u00B3 = ' + (side * side * side) + ' mm\u00B3\n\u0394V = 3\u03B1 \u00D7 V\u2080 \u00D7 \u0394T\n= 3 \u00D7 ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + (side * side * side) + ' \u00D7 ' + dT + '\n= ' + dV.toFixed(2) + ' mm\u00B3'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 5)];
      var L0 = randInt(500, 2000);
      var T1 = randInt(-10, 30);
      var T2 = randInt(60, 200);
      var dT = T2 - T1;
      var Lf = L0 * (1 + m.alpha * dT);
      return {
        text: 'A ' + L0 + ' mm ' + m.name + ' bar at ' + T1 + '\u00B0C is heated to ' + T2 + '\u00B0C. What is the final length?',
        answer: Lf,
        unit: 'mm',
        tol: 0.01,
        solution: '\u0394T = ' + T2 + ' - ' + T1 + ' = ' + dT + ' \u00B0C\nL = L\u2080 \u00D7 (1 + \u03B1\u00D7\u0394T)\n= ' + L0 + ' \u00D7 (1 + ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + dT + ')\n= ' + Lf.toFixed(4) + ' mm'
      };
    },
    function () {
      var m = MATERIALS[randInt(0, 6)];
      var A = randInt(2, 20) * 100;
      var dT = randInt(40, 250);
      var F = m.E * m.alpha * dT * A / 1000;
      return {
        text: 'A fully constrained ' + m.name + ' bar (cross-section ' + A + ' mm\u00B2) is heated by ' + dT + '\u00B0C. What force does it exert on its supports? (E = ' + (m.E / 1000).toFixed(0) + ' GPa)',
        answer: F,
        unit: 'kN',
        tol: 0.5,
        solution: '\u03C3 = E \u00D7 \u03B1 \u00D7 \u0394T = ' + m.E + ' \u00D7 ' + (m.alpha * 1e6).toFixed(1) + '\u00D710\u207B\u2076 \u00D7 ' + dT + ' = ' + (m.E * m.alpha * dT).toFixed(1) + ' MPa\nF = \u03C3 \u00D7 A = ' + (m.E * m.alpha * dT).toFixed(1) + ' \u00D7 ' + A + ' = ' + (m.E * m.alpha * dT * A).toFixed(0) + ' N = ' + F.toFixed(2) + ' kN'
      };
    }
  ];

  btnNewQ.addEventListener('click', function () {
    var gen = PRACTICE_GENERATORS[randInt(0, PRACTICE_GENERATORS.length - 1)];
    currentProblem = gen();
    pqText.textContent = currentProblem.text;
    pqUnit.textContent = currentProblem.unit;
    pqInput.value = '';
    pqInputRow.classList.remove('hidden');
    pqFeedback.classList.add('hidden');
    pqSolution.classList.add('hidden');
    pqInput.focus();
  });

  btnCheck.addEventListener('click', function () {
    if (!currentProblem) return;
    var userVal = parseFloat(pqInput.value);
    if (isNaN(userVal)) return;
    practiceTotal++;
    var correct = Math.abs(userVal - currentProblem.answer) <= currentProblem.tol + Math.abs(currentProblem.answer) * 0.02;
    if (correct) {
      practiceScore++;
      pqFeedback.textContent = 'Correct!';
      pqFeedback.className = 'feedback ok';
    } else {
      pqFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer.toFixed(4) + ' ' + currentProblem.unit;
      pqFeedback.className = 'feedback err';
    }
    pqFeedback.classList.remove('hidden');
    pScore.textContent = practiceScore;
    pTotal.textContent = practiceTotal;
  });

  btnShowSol.addEventListener('click', function () {
    if (!currentProblem) return;
    pqSolution.textContent = currentProblem.solution;
    pqSolution.classList.remove('hidden');
  });

  /* ══════════════════════════════════════════════════════════════
     24. QUIZ MODE
     ══════════════════════════════════════════════════════════════ */
  var QUIZ_POOL = [
    // MCQ questions
    function () {
      return {
        type: 'mcq',
        text: 'Which material has the highest coefficient of thermal expansion?',
        options: ['Steel (carbon)', 'Aluminum 6061', 'Copper', 'Titanium'],
        correct: 1,
        explanation: 'Aluminum 6061 has \u03B1 = 23.6 \u00D710\u207B\u2076/\u00B0C, the highest among these four materials.'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'What is the formula for linear thermal expansion?',
        options: ['\u0394L = \u03B1 / (L\u2080 \u00D7 \u0394T)', '\u0394L = \u03B1 \u00D7 L\u2080 \u00D7 \u0394T', '\u0394L = E \u00D7 \u03B1 \u00D7 \u0394T', '\u0394L = \u03B1 \u00D7 L\u2080 / \u0394T'],
        correct: 1,
        explanation: 'The linear thermal expansion formula is \u0394L = \u03B1 \u00D7 L\u2080 \u00D7 \u0394T.'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'Invar is known for its:',
        options: ['High thermal conductivity', 'Very low thermal expansion', 'High melting point', 'Corrosion resistance'],
        correct: 1,
        explanation: 'Invar (64% Fe, 36% Ni) has \u03B1 = 1.2 \u00D710\u207B\u2076/\u00B0C, nearly zero thermal expansion.'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'For volumetric expansion, the coefficient is approximately:',
        options: ['\u03B1', '2\u03B1', '3\u03B1', '\u03B1\u00B2'],
        correct: 2,
        explanation: 'The volumetric expansion coefficient \u03B2 \u2248 3\u03B1 for isotropic materials.'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'What causes thermal stress in a constrained bar?',
        options: ['Free expansion', 'Prevented expansion creating internal forces', 'Gravity', 'Friction'],
        correct: 1,
        explanation: 'When a bar cannot expand freely, the suppressed expansion creates compressive stress \u03C3 = E\u03B1\u0394T.'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'In a shrink fit, the hub is typically:',
        options: ['Cooled to contract', 'Heated to expand', 'Compressed mechanically', 'Machined larger'],
        correct: 1,
        explanation: 'The hub is heated so its bore expands enough to slide over the shaft. Upon cooling, it creates an interference fit.'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'A bimetallic strip bends because:',
        options: ['Both metals expand equally', 'The two metals have different \u03B1 values', 'The metals are magnetic', 'Temperature changes the crystal structure'],
        correct: 1,
        explanation: 'The metal with higher \u03B1 expands more, forcing the strip to curve toward the lower-expansion side.'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'Why does borosilicate glass resist thermal shock better than soda-lime glass?',
        options: ['Higher melting point', 'Lower coefficient of thermal expansion', 'Higher density', 'Better optical clarity'],
        correct: 1,
        explanation: 'Borosilicate glass (\u03B1 = 3.3) expands much less than soda-lime (\u03B1 \u2248 9), reducing thermal stress.'
      };
    },
    // Numeric questions
    function () {
      var L0 = 500, dT = 100;
      var m = MATERIALS[0]; // Steel
      var dL = m.alpha * L0 * dT;
      return {
        type: 'numeric',
        text: 'A 500 mm carbon steel bar (\u03B1 = 12.0 \u00D710\u207B\u2076/\u00B0C) is heated by 100\u00B0C. Calculate \u0394L in mm.',
        answer: dL,
        unit: 'mm',
        tol: 0.001,
        explanation: '\u0394L = 12.0\u00D710\u207B\u2076 \u00D7 500 \u00D7 100 = ' + dL.toFixed(4) + ' mm'
      };
    },
    function () {
      return {
        type: 'numeric',
        text: 'What \u0394T is needed to expand a 1000 mm aluminum bar (\u03B1 = 23.6 \u00D710\u207B\u2076/\u00B0C) by 0.5 mm?',
        answer: 0.5 / (23.6e-6 * 1000),
        unit: '\u00B0C',
        tol: 0.5,
        explanation: '\u0394T = \u0394L / (\u03B1 \u00D7 L\u2080) = 0.5 / (23.6\u00D710\u207B\u2076 \u00D7 1000) = ' + (0.5 / (23.6e-6 * 1000)).toFixed(1) + ' \u00B0C'
      };
    },
    function () {
      var stress = 200e3 * 12.0e-6 * 150;
      return {
        type: 'numeric',
        text: 'A constrained steel bar (E = 200 GPa, \u03B1 = 12.0 \u00D710\u207B\u2076/\u00B0C) is heated by 150\u00B0C. What is the thermal stress in MPa?',
        answer: stress,
        unit: 'MPa',
        tol: 1,
        explanation: '\u03C3 = E \u00D7 \u03B1 \u00D7 \u0394T = 200,000 \u00D7 12.0\u00D710\u207B\u2076 \u00D7 150 = ' + stress.toFixed(0) + ' MPa'
      };
    },
    function () {
      var interf = 0.06;
      var d = 60;
      var dT = interf / (12.0e-6 * d);
      return {
        type: 'numeric',
        text: 'A steel hub has 0.06 mm interference on a 60 mm shaft (\u03B1 = 12.0 \u00D710\u207B\u2076/\u00B0C). What \u0394T is required?',
        answer: dT,
        unit: '\u00B0C',
        tol: 1,
        explanation: '\u0394T = \u03B4 / (\u03B1 \u00D7 d) = 0.06 / (12.0\u00D710\u207B\u2076 \u00D7 60) = ' + dT.toFixed(1) + ' \u00B0C'
      };
    },
    function () {
      var strain = 17.3e-6 * 200 * 1e6;
      return {
        type: 'numeric',
        text: 'Calculate thermal strain (in \u03BC\u03B5) for Stainless 304 (\u03B1 = 17.3 \u00D710\u207B\u2076/\u00B0C) heated by 200\u00B0C.',
        answer: strain,
        unit: '\u03BC\u03B5',
        tol: 5,
        explanation: '\u03B5 = \u03B1 \u00D7 \u0394T = 17.3\u00D710\u207B\u2076 \u00D7 200 = ' + strain.toFixed(0) + ' \u03BC\u03B5'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'Railroad tracks are laid with gaps primarily to accommodate:',
        options: ['Seismic activity', 'Thermal expansion', 'Manufacturing tolerances', 'Drainage'],
        correct: 1,
        explanation: 'Rails expand in hot weather. Without gaps, the compressive force causes track buckling (sun kink).'
      };
    },
    function () {
      return {
        type: 'mcq',
        text: 'The thermal strain in a free (unconstrained) bar produces:',
        options: ['Compressive stress', 'Tensile stress', 'No stress', 'Shear stress'],
        correct: 2,
        explanation: 'A free bar can expand without resistance, so thermal strain produces zero stress.'
      };
    }
  ];

  btnStartQuiz.addEventListener('click', function () {
    startQuiz();
  });

  btnSubmitQ.addEventListener('click', function () {
    submitQuiz();
  });

  btnNextQ.addEventListener('click', function () {
    nextQuestion();
  });

  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    shuffle(pool);
    /* Shuffle each MCQ's OPTIONS too, not just the question order. */
    quizSet = pool.slice(0, QUIZ_SIZE).map(function (fn) {
      var q = fn();
      if (q.type === 'mcq' && q.options && q.options.length) {
        var order = q.options.map(function (opt, i) { return { opt: opt, i: i }; });
        shuffle(order);
        q.options = order.map(function (o) { return o.opt; });
        q.correct = order.findIndex(function (o) { return o.i === q.correct; });
      }
      return q;
    });
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizLocked = false;
    quizResultDiv.classList.add('hidden');
    btnStartQuiz.classList.add('hidden');
    btnSubmitQ.classList.remove('hidden');
    showQuizQuestion();
  }

  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    quizCounter.textContent = 'Q ' + (quizIdx + 1) + ' / ' + QUIZ_SIZE;
    qqText.textContent = q.text;
    qqFeedback.classList.add('hidden');
    btnSubmitQ.classList.remove('hidden');
    btnNextQ.classList.add('hidden');
    quizLocked = false;

    if (q.type === 'mcq') {
      qqOptions.classList.remove('hidden');
      qqInputRow.classList.add('hidden');
      qqOptions.innerHTML = '';
      q.options.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.className = 'qq-opt';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          if (quizLocked) return;
          qqOptions.querySelectorAll('.qq-opt').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          q.userAnswer = i;
        });
        qqOptions.appendChild(btn);
      });
    } else {
      qqOptions.classList.add('hidden');
      qqInputRow.classList.remove('hidden');
      qqUnit.textContent = q.unit;
      qqInput.value = '';
      qqInput.focus();
    }
  }

  function submitQuiz() {
    var q = quizSet[quizIdx];
    quizLocked = true;
    var correct = false;

    if (q.type === 'mcq') {
      if (q.userAnswer === undefined) return;
      correct = q.userAnswer === q.correct;
      var opts = qqOptions.querySelectorAll('.qq-opt');
      opts.forEach(function (b, i) {
        if (i === q.correct) b.classList.add('correct');
        if (i === q.userAnswer && !correct) b.classList.add('wrong');
      });
    } else {
      var userVal = parseFloat(qqInput.value);
      if (isNaN(userVal)) return;
      q.userAnswer = userVal;
      correct = Math.abs(userVal - q.answer) <= q.tol + Math.abs(q.answer) * 0.02;
    }

    if (correct) {
      quizScore++;
      qqFeedback.textContent = 'Correct! ' + q.explanation;
      qqFeedback.className = 'feedback ok';
    } else {
      var correctText = q.type === 'mcq' ? q.options[q.correct] : q.answer.toFixed(2) + ' ' + q.unit;
      qqFeedback.textContent = 'Incorrect. Answer: ' + correctText + '. ' + q.explanation;
      qqFeedback.className = 'feedback err';
    }
    qqFeedback.classList.remove('hidden');
    quizAnswers.push({ q: q, correct: correct });

    btnSubmitQ.classList.add('hidden');
    if (quizIdx < QUIZ_SIZE - 1) {
      btnNextQ.classList.remove('hidden');
    } else {
      setTimeout(showResult, 600);
    }
  }

  function nextQuestion() {
    quizIdx++;
    showQuizQuestion();
  }

  function showResult() {
    btnSubmitQ.classList.add('hidden');
    btnNextQ.classList.add('hidden');
    qqText.textContent = '';
    qqOptions.classList.add('hidden');
    qqInputRow.classList.add('hidden');
    qqFeedback.classList.add('hidden');

    var scoreClass = quizScore === QUIZ_SIZE ? 'perfect' : quizScore >= 3 ? 'good' : 'poor';
    var stars = quizScore === QUIZ_SIZE ? '\u2605\u2605\u2605' : quizScore >= 3 ? '\u2605\u2605' : '\u2605';

    var html = '<div class="qr-header">' +
      '<div class="qr-score ' + scoreClass + '">' + quizScore + ' / ' + QUIZ_SIZE + '</div>' +
      '<div class="qr-stars">' + stars + '</div></div>' +
      '<div class="qr-rows">';

    quizAnswers.forEach(function (a, i) {
      var q = a.q;
      var userText = q.type === 'mcq'
        ? (q.userAnswer !== undefined ? q.options[q.userAnswer] : 'No answer')
        : (q.userAnswer !== undefined ? q.userAnswer.toFixed(2) + ' ' + q.unit : 'No answer');
      var correctText = q.type === 'mcq' ? q.options[q.correct] : q.answer.toFixed(2) + ' ' + q.unit;
      html += '<div class="qr-row ' + (a.correct ? 'ok' : 'err') + '">' +
        '<strong>Q' + (i + 1) + ':</strong> ' + q.text + '<br>' +
        'Your answer: ' + userText + (a.correct ? ' \u2713' : ' \u2717 (Correct: ' + correctText + ')') +
        '</div>';
    });

    html += '</div><div style="text-align:center;margin-top:16px">' +
      '<button class="btn btn-primary" id="btn-new-quiz">New Quiz</button></div>';

    quizResultDiv.innerHTML = html;
    quizResultDiv.classList.remove('hidden');
    quizCounter.textContent = 'Score: ' + quizScore + '/' + QUIZ_SIZE;

    document.getElementById('btn-new-quiz').addEventListener('click', function () {
      quizResultDiv.classList.add('hidden');
      startQuiz();
    });

    btnStartQuiz.classList.remove('hidden');
    btnStartQuiz.textContent = 'Retry Quiz';
  }

  /* ══════════════════════════════════════════════════════════════
     25. UTILITIES
     ══════════════════════════════════════════════════════════════ */
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     26. WINDOW RESIZE
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('resize', function () {
    if (mode === 'simulate') draw();
  });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () {
      if (mode === 'simulate') draw();
    }).observe(canvas.parentElement);
  }

  /* ══════════════════════════════════════════════════════════════
     27. INIT
     ══════════════════════════════════════════════════════════════ */
  updateInputVisibility();
  updateInputLabels();
  buildPresetBtns();
  syncDeltaTDisplays();
  wireLearnPanels();
  draw();

})();
