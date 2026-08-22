(function () {
  'use strict';

  /* ================================================================
     POWER SCREW CALCULATOR — app.js
     ACME, Square, Buttress, Trapezoidal thread forms
     ================================================================ */

  /* ── 1. DOM refs ── */
  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');

  var modeTabs = document.getElementById('mode-tabs');
  var threadTabs = document.getElementById('thread-tabs');

  var slDiameter = document.getElementById('sl-diameter');
  var slPitch = document.getElementById('sl-pitch');
  var slStarts = document.getElementById('sl-starts');
  var slLoad = document.getElementById('sl-load');
  var slMuThread = document.getElementById('sl-mu-thread');
  var slMuCollar = document.getElementById('sl-mu-collar');
  var slCollarDia = document.getElementById('sl-collar-dia');

  var svDiameter = document.getElementById('sv-diameter');
  var svPitch = document.getElementById('sv-pitch');
  var svStarts = document.getElementById('sv-starts');
  var svLoad = document.getElementById('sv-load');
  var svMuThread = document.getElementById('sv-mu-thread');
  var svMuCollar = document.getElementById('sv-mu-collar');
  var svCollarDia = document.getElementById('sv-collar-dia');

  var rTraise = document.getElementById('r-traise');
  var rTlower = document.getElementById('r-tlower');
  var rEff = document.getElementById('r-eff');
  var rAlpha = document.getElementById('r-alpha');
  var rLead = document.getElementById('r-lead');
  var rDm = document.getElementById('r-dm');
  var rSelflock = document.getElementById('r-selflock');
  var rTheta = document.getElementById('r-theta');
  var rcSelflock = document.getElementById('rc-selflock');
  var warningBox = document.getElementById('warning-box');
  var btnRunSim = document.getElementById('btn-run-sim');

  var simPanel = document.getElementById('sim-panel');
  var catRow = document.getElementById('cat-row');
  var catTabs = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');

  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppShow = document.getElementById('pp-show');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var qbarNum = document.getElementById('qbar-num');
  var quizResult = document.getElementById('quiz-result');

  /* ── 2. State ── */
  var mode = 'simulate';
  var threadType = 'square';
  var animAngle = 0;
  var animating = false;
  var animId = null;

  /* Thread angle lookup (half-angle in degrees) */
  var THREAD_ANGLES = {
    square: 0,
    acme: 14.5,
    buttress: 22.5,
    trapezoidal: 15
  };

  var THREAD_NAMES = {
    square: 'Square',
    acme: 'ACME 29\u00B0',
    buttress: 'Buttress 45\u00B0',
    trapezoidal: 'Trapezoidal 30\u00B0'
  };

  /* Practice state */
  var pCorrect = 0, pTotal = 0;
  var pAnswer = 0, pTolerance = 0;
  var pChecked = false;
  var pSolutionSteps = [];

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizAnswers = [];
  var quizSubmitted = false;

  /* ── 3. Engineering calculations ── */
  function calcPowerScrew(d, p, n, W_kN, muT, muC, dc) {
    var W = W_kN * 1000; // convert kN to N
    var L = n * p;       // lead (mm)
    var dm = d - p / 2;  // mean diameter (mm)
    var thetaDeg = THREAD_ANGLES[threadType];
    var theta = thetaDeg * Math.PI / 180;
    var cosTheta = Math.cos(theta);
    var alpha = Math.atan(L / (Math.PI * dm)); // lead angle (rad)
    var alphaDeg = alpha * 180 / Math.PI;

    // Torque to RAISE load (N·mm)
    var numR = muT * Math.PI * dm + L * cosTheta;
    var denR = Math.PI * dm * cosTheta - muT * L;
    var T_thread_raise = (W * dm / 2) * (numR / denR);
    var T_collar = W * muC * dc / 2;
    var T_raise = T_thread_raise + T_collar;

    // Torque to LOWER load (N·mm)
    var numL = muT * Math.PI * dm - L * cosTheta;
    var denL = Math.PI * dm * cosTheta + muT * L;
    var T_thread_lower = (W * dm / 2) * (numL / denL);
    var T_lower = T_thread_lower + T_collar;

    // Efficiency
    var eff = (W * L) / (2 * Math.PI * T_raise) * 100;

    // Self-locking: μ >= L·cos(θ)/(π·dm)  i.e. T_lower > 0
    var selfLocking = T_lower > 0;

    return {
      L: L, dm: dm, alpha: alphaDeg, thetaDeg: thetaDeg,
      T_raise: T_raise, T_lower: T_lower, eff: eff,
      selfLocking: selfLocking, W: W
    };
  }

  function getSliderValues() {
    return {
      d: parseFloat(slDiameter.value),
      p: parseFloat(slPitch.value),
      n: parseInt(slStarts.value),
      W: parseFloat(slLoad.value),
      muT: parseFloat(slMuThread.value),
      muC: parseFloat(slMuCollar.value),
      dc: parseFloat(slCollarDia.value)
    };
  }

  /* ================================================================
     DISPLAY UNITS  (display only — the screw model stays in mm / kN)
     US practice: diameters and lead in inches, load in lbf, torque in
     lbf·in. Efficiency, lead angle, thread angle, number of starts and the
     friction coefficients are dimensionless or angular, so unchanged.
     ================================================================ */
  var unitSys = 'si';
  function isImp()  { return unitSys === 'imp'; }
  function lD(mm)   { return isImp() ? mm * 0.0393701 : mm; }        /* mm    → in     */
  function lS(inch) { return isImp() ? inch / 0.0393701 : inch; }
  function uL()     { return isImp() ? 'in' : 'mm'; }
  function wD(kN)   { return isImp() ? kN * 224.8089 : kN; }         /* kN    → lbf    */
  function uW()     { return isImp() ? 'lbf' : 'kN'; }
  function tqD(Nmm) { return isImp() ? Nmm * 0.00885075 : Nmm; }     /* N·mm  → lbf·in */
  function uTq()    { return isImp() ? 'lbf\u00b7in' : 'N\u00b7mm'; }
  function lFix(mm, dSI, dImp) {
    return lD(mm).toFixed(isImp() ? (dImp == null ? 3 : dImp) : (dSI == null ? 1 : dSI));
  }
  function tqFix(Nmm) {
    return isImp() ? tqD(Nmm).toFixed(1) : Math.round(Nmm).toLocaleString();
  }

  function updateReadouts() {
    var v = getSliderValues();
    var r = calcPowerScrew(v.d, v.p, v.n, v.W, v.muT, v.muC, v.dc);

    rTraise.textContent = tqFix(r.T_raise);
    rTlower.textContent = tqFix(r.T_lower);
    rEff.textContent = r.eff.toFixed(1);
    rAlpha.textContent = r.alpha.toFixed(2);
    rLead.textContent = lFix(r.L, 1, 3);
    rDm.textContent = lFix(r.dm, 1, 3);
    var caps = { 'u-traise': uTq(), 'u-tlower': uTq(), 'u-lead': uL(), 'u-dm': uL() };
    Object.keys(caps).forEach(function (id) {
      var e = document.getElementById(id); if (e) e.textContent = ' ' + caps[id];
    });
    syncSliderLabels();
    rTheta.textContent = r.thetaDeg.toFixed(1);

    if (r.selfLocking) {
      rSelflock.innerHTML = '<span class="badge-yes">YES</span>';
      warningBox.style.display = 'none';
    } else {
      rSelflock.innerHTML = '<span class="badge-no">NO</span>';
      warningBox.style.display = 'flex';
    }
  }

  /* ── 4. Canvas drawing ── */
  var LOGW = 900, LOGH = 420;   /* logical drawing size in CSS px */
  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = Math.floor(rect.width - 16);
    var h = Math.min(420, Math.floor(w * 0.55));
    /* Hi-DPI: back the canvas with real device pixels and scale the context so
       the drawing code keeps working in CSS-pixel units (w x h). Previously the
       backing store was sized in CSS pixels, giving a 2.00x upscale on a retina
       display. No canvas pointer interaction here, so no hit-test to move. */
    var dpr = window.devicePixelRatio || 1;
    LOGW = w; LOGH = h;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width  = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    resizeCanvas();
    var W = LOGW, H = LOGH;   /* logical CSS-pixel space; backing is DPR-scaled */
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      drawScrew(W, H);
    } else if (mode === 'explore') {
      drawExploreCanvas(W, H);
    } else if (mode === 'practice') {
      drawPracticeCanvas(W, H);
    } else if (mode === 'quiz') {
      drawQuizCanvas(W, H);
    }
  }

  function drawScrew(W, H) {
    var v = getSliderValues();
    var r = calcPowerScrew(v.d, v.p, v.n, v.W, v.muT, v.muC, v.dc);

    var cx = W * 0.32;
    var cy = H * 0.5;
    var screwLen = H * 0.65;
    var screwW = Math.min(W * 0.08, 50);

    ctx.save();

    // Draw support base
    var baseY = cy + screwLen / 2 + 20;
    ctx.fillStyle = '#1f2535';
    ctx.fillRect(cx - screwW * 1.8, baseY, screwW * 3.6, 14);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - screwW * 1.8, baseY, screwW * 3.6, 14);

    // Ground hatching
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    for (var i = 0; i < 8; i++) {
      var hx = cx - screwW * 1.5 + i * screwW * 0.45;
      ctx.beginPath();
      ctx.moveTo(hx, baseY + 14);
      ctx.lineTo(hx - 8, baseY + 22);
      ctx.stroke();
    }

    // Collar
    var collarY = baseY - 12;
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(cx - screwW * 1.2, collarY, screwW * 2.4, 12);
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - screwW * 1.2, collarY, screwW * 2.4, 12);

    // Label collar
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('Collar (dc=' + lFix(v.dc, 0, 2) + uL() + ')', cx + screwW * 1.3, collarY + 9);

    // Screw body
    var screwTop = cy - screwLen / 2;
    var screwBottom = collarY;
    ctx.fillStyle = '#1f2535';
    ctx.fillRect(cx - screwW, screwTop, screwW * 2, screwBottom - screwTop);
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - screwW, screwTop, screwW * 2, screwBottom - screwTop);

    // Thread grooves
    var pitch_px = (screwBottom - screwTop) / (v.d / v.p);
    if (pitch_px < 4) pitch_px = 4;
    var nThreads = Math.floor((screwBottom - screwTop) / pitch_px);
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 1;

    for (var t = 0; t < nThreads; t++) {
      var ty = screwTop + t * pitch_px + ((animAngle * pitch_px / (2 * Math.PI)) % pitch_px);
      if (ty < screwTop || ty > screwBottom) continue;

      // Thread profile based on type
      ctx.globalAlpha = 0.6;
      if (threadType === 'square') {
        ctx.fillStyle = '#ff9100';
        ctx.fillRect(cx - screwW - 4, ty, 4, pitch_px * 0.5);
        ctx.fillRect(cx + screwW, ty, 4, pitch_px * 0.5);
      } else if (threadType === 'acme' || threadType === 'trapezoidal') {
        // Trapezoidal profile
        ctx.beginPath();
        ctx.moveTo(cx - screwW, ty);
        ctx.lineTo(cx - screwW - 6, ty + pitch_px * 0.15);
        ctx.lineTo(cx - screwW - 6, ty + pitch_px * 0.35);
        ctx.lineTo(cx - screwW, ty + pitch_px * 0.5);
        ctx.fillStyle = '#ff9100';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + screwW, ty);
        ctx.lineTo(cx + screwW + 6, ty + pitch_px * 0.15);
        ctx.lineTo(cx + screwW + 6, ty + pitch_px * 0.35);
        ctx.lineTo(cx + screwW, ty + pitch_px * 0.5);
        ctx.fill();
      } else { // buttress
        ctx.beginPath();
        ctx.moveTo(cx - screwW, ty);
        ctx.lineTo(cx - screwW - 6, ty + pitch_px * 0.05);
        ctx.lineTo(cx - screwW - 6, ty + pitch_px * 0.4);
        ctx.lineTo(cx - screwW, ty + pitch_px * 0.5);
        ctx.fillStyle = '#ff9100';
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + screwW, ty);
        ctx.lineTo(cx + screwW + 6, ty + pitch_px * 0.05);
        ctx.lineTo(cx + screwW + 6, ty + pitch_px * 0.4);
        ctx.lineTo(cx + screwW, ty + pitch_px * 0.5);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Horizontal thread lines
      ctx.beginPath();
      ctx.moveTo(cx - screwW - 6, ty);
      ctx.lineTo(cx + screwW + 6, ty);
      ctx.strokeStyle = 'rgba(255,145,0,0.3)';
      ctx.stroke();
    }

    // Load arrow on top
    var arrowTop = screwTop - 35;
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, arrowTop);
    ctx.lineTo(cx, screwTop);
    ctx.stroke();
    // Arrowhead
    ctx.fillStyle = '#ff5555';
    ctx.beginPath();
    ctx.moveTo(cx - 8, screwTop - 10);
    ctx.lineTo(cx, screwTop);
    ctx.lineTo(cx + 8, screwTop - 10);
    ctx.closePath();
    ctx.fill();
    // Label
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 13px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('W = ' + (isImp() ? wD(v.W).toFixed(0) : v.W) + ' ' + uW(), cx, arrowTop - 5);

    // Rotation arrow (curved)
    if (animating) {
      ctx.save();
      ctx.translate(cx, screwTop + 30);
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, screwW + 18, -0.5, Math.PI * 1.2, false);
      ctx.stroke();
      // Arrowhead on arc
      var ax = (screwW + 18) * Math.cos(Math.PI * 1.2);
      var ay = (screwW + 18) * Math.sin(Math.PI * 1.2);
      ctx.fillStyle = '#3ddc84';
      ctx.beginPath();
      ctx.moveTo(ax + 5, ay - 8);
      ctx.lineTo(ax, ay);
      ctx.lineTo(ax - 8, ay - 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Dimension labels
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'left';

    // Major diameter dimension
    var dimX = cx + screwW + 20;
    ctx.beginPath();
    ctx.moveTo(cx - screwW, screwTop + 20);
    ctx.lineTo(dimX, screwTop + 20);
    ctx.moveTo(cx + screwW, screwTop + 40);
    ctx.lineTo(dimX, screwTop + 40);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillText('d = ' + lFix(v.d, 0, 3) + ' ' + uL(), dimX + 5, screwTop + 33);

    // Pitch
    if (nThreads > 1) {
      var py1 = screwTop + pitch_px;
      var py2 = screwTop + pitch_px * 2;
      ctx.beginPath();
      ctx.moveTo(cx + screwW + 10, py1);
      ctx.lineTo(cx + screwW + 10, py2);
      ctx.strokeStyle = '#ff9100';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#ff9100';
      ctx.font = '9px ' + "'Segoe UI', sans-serif";
      ctx.fillText('p=' + lFix(v.p, 0, 3) + uL(), cx + screwW + 14, (py1 + py2) / 2 + 3);
    }

    // Right side: Results panel
    var panelX = W * 0.58;
    var panelY = 20;
    var panelW = W * 0.38;

    ctx.fillStyle = '#161b27';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    roundRect(ctx, panelX, panelY, panelW, H - 40, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ff9100';
    ctx.font = 'bold 14px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('Results', panelX + 14, panelY + 25);

    ctx.font = '11px ' + "'Segoe UI', sans-serif";
    var items = [
      ['Thread Form:', THREAD_NAMES[threadType]],
      ['Lead (L):', lFix(r.L, 1, 3) + ' ' + uL()],
      ['Mean Dia (dm):', lFix(r.dm, 1, 3) + ' ' + uL()],
      ['Lead Angle (\u03B1):', r.alpha.toFixed(2) + '\u00B0'],
      ['Thread Angle (\u03B8):', r.thetaDeg.toFixed(1) + '\u00B0'],
      ['', ''],
      ['T raise:', tqFix(r.T_raise) + ' ' + uTq()],
      ['T lower:', tqFix(r.T_lower) + ' ' + uTq()],
      ['Efficiency:', r.eff.toFixed(1) + '%'],
      ['Self-locking:', r.selfLocking ? 'YES' : 'NO']
    ];

    var ly = panelY + 48;
    for (var i = 0; i < items.length; i++) {
      if (items[i][0] === '') { ly += 6; continue; }
      ctx.fillStyle = '#6b7a99';
      ctx.fillText(items[i][0], panelX + 14, ly);
      ctx.fillStyle = items[i][0] === 'Self-locking:' ? (r.selfLocking ? '#3ddc84' : '#ff5555') : '#dde3f0';
      ctx.font = 'bold 11px ' + "'Segoe UI', sans-serif";
      ctx.fillText(items[i][1], panelX + panelW * 0.52, ly);
      ctx.font = '11px ' + "'Segoe UI', sans-serif";
      ly += 22;
    }

    // Efficiency bar
    ly += 10;
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px ' + "'Segoe UI', sans-serif";
    ctx.fillText('Efficiency:', panelX + 14, ly);
    ly += 10;
    var barW = panelW - 28;
    ctx.fillStyle = '#0d1117';
    roundRect(ctx, panelX + 14, ly, barW, 14, 4);
    ctx.fill();
    var effW = Math.max(0, Math.min(barW, barW * r.eff / 100));
    var effColor = r.eff > 50 ? '#3ddc84' : r.eff > 30 ? '#f5c842' : '#ff5555';
    ctx.fillStyle = effColor;
    roundRect(ctx, panelX + 14, ly, effW, 14, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(r.eff.toFixed(1) + '%', panelX + 14 + barW / 2, ly + 11);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  function drawExploreCanvas(W, H) {
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff9100';
    ctx.font = 'bold 16px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Power Screw Reference', W / 2, 30);

    // Draw a comparison of thread profiles
    var profiles = ['square', 'acme', 'buttress', 'trapezoidal'];
    var names = ['Square (0\u00B0)', 'ACME (14.5\u00B0)', 'Buttress (22.5\u00B0)', 'Trapezoidal (15\u00B0)'];
    var pw = W / 4;
    var py = 60;
    var ph = H - 80;

    for (var i = 0; i < 4; i++) {
      var px = i * pw + pw / 2;

      ctx.fillStyle = '#6b7a99';
      ctx.font = '11px ' + "'Segoe UI', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(names[i], px, py);

      // Draw profile
      ctx.strokeStyle = '#ff9100';
      ctx.lineWidth = 2;
      var tpy = py + 20;
      var tph = ph - 30;
      var toothH = tph / 5;

      for (var j = 0; j < 5; j++) {
        var ty = tpy + j * toothH;
        drawThreadProfile(ctx, px, ty, toothH, 20, profiles[i]);
      }
    }
  }

  function drawThreadProfile(ctx, cx, y, h, w, type) {
    ctx.beginPath();
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 1.5;

    if (type === 'square') {
      ctx.moveTo(cx - w, y);
      ctx.lineTo(cx - w, y + h * 0.5);
      ctx.lineTo(cx - w * 0.5, y + h * 0.5);
      ctx.lineTo(cx - w * 0.5, y + h);
      ctx.moveTo(cx + w, y);
      ctx.lineTo(cx + w, y + h * 0.5);
      ctx.lineTo(cx + w * 0.5, y + h * 0.5);
      ctx.lineTo(cx + w * 0.5, y + h);
    } else if (type === 'acme') {
      ctx.moveTo(cx - w, y);
      ctx.lineTo(cx - w * 0.7, y + h * 0.5);
      ctx.lineTo(cx - w * 0.7, y + h * 0.5);
      ctx.lineTo(cx - w * 0.4, y + h);
      ctx.moveTo(cx + w, y);
      ctx.lineTo(cx + w * 0.7, y + h * 0.5);
      ctx.lineTo(cx + w * 0.4, y + h);
    } else if (type === 'buttress') {
      ctx.moveTo(cx - w, y);
      ctx.lineTo(cx - w * 0.95, y + h * 0.5);
      ctx.lineTo(cx - w * 0.4, y + h);
      ctx.moveTo(cx + w, y);
      ctx.lineTo(cx + w * 0.95, y + h * 0.5);
      ctx.lineTo(cx + w * 0.4, y + h);
    } else { // trapezoidal
      ctx.moveTo(cx - w, y);
      ctx.lineTo(cx - w * 0.75, y + h * 0.5);
      ctx.lineTo(cx - w * 0.45, y + h);
      ctx.moveTo(cx + w, y);
      ctx.lineTo(cx + w * 0.75, y + h * 0.5);
      ctx.lineTo(cx + w * 0.45, y + h);
    }
    ctx.stroke();
  }

  function drawPracticeCanvas(W, H) {
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff9100';
    ctx.font = 'bold 16px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Power Screw \u2014 Practice Mode', W / 2, 30);

    // Draw a simple screw diagram
    drawSimpleScrew(W / 2, H / 2 + 20, W, H);
  }

  function drawQuizCanvas(W, H) {
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff9100';
    ctx.font = 'bold 16px ' + "'Segoe UI', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('Power Screw \u2014 Quiz Mode', W / 2, 30);

    drawSimpleScrew(W / 2, H / 2 + 20, W, H);
  }

  function drawSimpleScrew(cx, cy, W, H) {
    var sw = 30;
    var sh = H * 0.5;
    var top = cy - sh / 2;

    ctx.fillStyle = '#1f2535';
    ctx.fillRect(cx - sw, top, sw * 2, sh);
    ctx.strokeStyle = '#ff9100';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - sw, top, sw * 2, sh);

    // Thread lines
    for (var i = 0; i < 8; i++) {
      var ty = top + i * (sh / 8);
      ctx.beginPath();
      ctx.moveTo(cx - sw - 4, ty);
      ctx.lineTo(cx + sw + 4, ty);
      ctx.strokeStyle = 'rgba(255,145,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Load arrow
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, top - 25);
    ctx.lineTo(cx, top);
    ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.beginPath();
    ctx.moveTo(cx - 6, top - 8);
    ctx.lineTo(cx, top);
    ctx.lineTo(cx + 6, top - 8);
    ctx.closePath();
    ctx.fill();
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('W', cx, top - 30);

    // Base
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(cx - sw * 1.5, top + sh + 5, sw * 3, 10);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ── 5. Animation ── */
  function startAnimation() {
    if (animating) return;
    animating = true;
    btnRunSim.textContent = 'Stop Simulation';
    animate();
  }

  function stopAnimation() {
    animating = false;
    btnRunSim.textContent = 'Run Simulation';
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function animate() {
    if (!animating) return;
    animAngle += 0.06;
    draw();
    animId = requestAnimationFrame(animate);
  }

  /* ── 6. Mode switching ── */
  modeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.mode;
    if (!newMode) return;
    modeTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;
    stopAnimation();

    // Show/hide panels
    simPanel.style.display = m === 'simulate' ? '' : 'none';
    canvas.parentElement.style.display = (m === 'simulate' || m === 'explore' || m === 'practice' || m === 'quiz') ? '' : 'none';

    catRow.style.display = m === 'explore' ? '' : 'none';
    itemSelector.style.display = m === 'explore' ? '' : 'none';
    itemInfo.style.display = 'none';

    practicePanel.style.display = m === 'practice' ? '' : 'none';
    practiceBar.style.display = m === 'practice' ? '' : 'none';

    quizPanel.style.display = m === 'quiz' ? '' : 'none';
    quizBar.style.display = m === 'quiz' ? '' : 'none';
    quizResult.style.display = 'none';

    if (m === 'explore') {
      buildExplore();
    } else if (m === 'practice') {
      newPracticeQuestion();
    } else if (m === 'quiz') {
      startQuiz();
    }

    draw();
  }

  /* ── 7. Explore mode ── */
  var CONCEPTS = [
    /* Fundamentals */
    {
      id: 'lead-pitch', name: 'Lead vs Pitch', symbol: 'L = n \u00D7 p', cat: 'fundamentals',
      formula: 'L = n \u00D7 p', unit: 'mm',
      desc: 'The lead (L) is the axial distance the nut advances per one complete revolution of the screw. For a single-start screw, lead equals pitch. For a multi-start screw (n starts), L = n \u00D7 p. Lead determines the linear speed and mechanical advantage.',
      example: { problem: 'A double-start ACME screw has a pitch of 4 mm. What is the lead?', steps: ['L = n \u00D7 p', 'L = 2 \u00D7 4', 'L = 8 mm'], answer: 8, unit: 'mm' }
    },
    {
      id: 'mean-diameter', name: 'Mean Diameter', symbol: 'dm = d \u2212 p/2', cat: 'fundamentals',
      formula: 'dm = d \u2212 p/2', unit: 'mm',
      desc: 'The mean diameter (dm) is the average of the major and minor diameters of the screw thread. It is the effective diameter used in all torque and efficiency calculations. For a screw with major diameter d and pitch p: dm = d \u2212 p/2.',
      example: { problem: 'A power screw has a major diameter of 40 mm and a pitch of 8 mm. Find dm.', steps: ['dm = d \u2212 p/2', 'dm = 40 \u2212 8/2', 'dm = 40 \u2212 4 = 36 mm'], answer: 36, unit: 'mm' }
    },
    {
      id: 'lead-angle', name: 'Lead Angle', symbol: '\u03B1 = atan(L/\u03C0dm)', cat: 'fundamentals',
      formula: '\u03B1 = atan(L / (\u03C0 \u00D7 dm))', unit: '\u00B0',
      desc: 'The lead angle (\u03B1) is the angle between the thread helix and a plane perpendicular to the screw axis. It determines the mechanical advantage and self-locking behavior. Small lead angles (< 5\u00B0) favor self-locking; larger angles increase efficiency but may overhaul.',
      example: { problem: 'Find the lead angle for a single-start screw with d = 30 mm, p = 6 mm.', steps: ['dm = 30 \u2212 6/2 = 27 mm', 'L = 1 \u00D7 6 = 6 mm', '\u03B1 = atan(6 / (\u03C0 \u00D7 27))', '\u03B1 = atan(0.0707) = 4.05\u00B0'], answer: 4.05, unit: '\u00B0' }
    },

    /* Thread Forms */
    {
      id: 'square-thread', name: 'Square Thread', symbol: '\u03B8 = 0\u00B0', cat: 'threads',
      formula: 'T = (Wdm/2)(\u03BCL + L)/(\u03C0dm \u2212 \u03BCL) + W\u03BCcdc/2', unit: 'N\u00B7mm',
      desc: 'Square threads have a thread angle of 0\u00B0, giving the highest mechanical efficiency of all power screw thread forms. The thread flanks are perpendicular to the axis, so there is no wedging component that increases friction. However, square threads are difficult and expensive to manufacture with standard tooling, cannot be compensated for wear, and are weaker than trapezoidal profiles.',
      example: { problem: 'A square thread screw: d=30mm, p=6mm, n=1, W=10kN, \u03BC=0.15, \u03BCc=0.12, dc=45mm. Find T_raise.', steps: ['dm = 30 \u2212 3 = 27 mm, L = 6 mm', 'T_thread = (10000\u00D727/2)\u00D7(0.15\u00D7\u03C0\u00D727 + 6)/((\u03C0\u00D727) \u2212 0.15\u00D76)', 'T_thread = 135000 \u00D7 (12.723 + 6)/(84.823 \u2212 0.9)', 'T_thread = 135000 \u00D7 18.723/83.923 = 30,100 N\u00B7mm', 'T_collar = 10000 \u00D7 0.12 \u00D7 45/2 = 27,000', 'T_raise = 30,100 + 27,000 = 57,100 N\u00B7mm'], answer: 57100, unit: 'N\u00B7mm' }
    },
    {
      id: 'acme-thread', name: 'ACME Thread', symbol: '\u03B8 = 14.5\u00B0', cat: 'threads',
      formula: 'cos\u03B8 = cos(14.5\u00B0) = 0.9686', unit: '\u2014',
      desc: 'ACME threads have a 29\u00B0 included angle (14.5\u00B0 half-angle). They are the most common power screw thread form in industry. The angled flanks make them easier to manufacture than square threads and allow for split-nut engagement to compensate for wear. The thread angle increases friction slightly, reducing efficiency compared to square threads by 2\u20135%.',
      example: { problem: 'How does ACME thread angle affect the torque formula compared to square threads?', steps: ['For ACME: \u03B8 = 14.5\u00B0, cos(\u03B8) = 0.9686', 'This factor appears in: T = (Wdm/2)(\u03BC\u03C0dm + Lcos\u03B8)/(\u03C0dmcos\u03B8 \u2212 \u03BCL)', 'The cos\u03B8 < 1 increases the effective friction', 'Efficiency drops by about 2\u20135% compared to square'], answer: 0.9686, unit: '' }
    },
    {
      id: 'buttress-thread', name: 'Buttress Thread', symbol: '\u03B8 = 22.5\u00B0', cat: 'threads',
      formula: 'cos\u03B8 = cos(22.5\u00B0) = 0.9239', unit: '\u2014',
      desc: 'Buttress threads have a 45\u00B0 included angle (22.5\u00B0 half-angle on the load side and nearly 0\u00B0 on the back side). They are designed for heavy loads in one direction only. The near-flat load flank efficiently transmits axial force, while the angled back flank allows easy disengagement. Used in presses, vises, and artillery.',
      example: { problem: 'Why is buttress thread preferred for a screw press?', steps: ['Load is always in one direction (compression)', 'The flat load flank (7\u00B0) gives near-square efficiency for load bearing', 'The 45\u00B0 back flank allows easy manufacturing', 'Combined: high load capacity with good manufacturability'], answer: 0.9239, unit: '' }
    },
    {
      id: 'trapezoidal-thread', name: 'Trapezoidal Thread', symbol: '\u03B8 = 15\u00B0', cat: 'threads',
      formula: 'cos\u03B8 = cos(15\u00B0) = 0.9659', unit: '\u2014',
      desc: 'Trapezoidal threads (ISO metric, DIN 103) have a 30\u00B0 included angle (15\u00B0 half-angle). They are the metric equivalent of ACME threads and are widely used in Europe and ISO-standard countries. Performance is very similar to ACME threads, with slightly different thread geometry (deeper profile, different root radius).',
      example: { problem: 'Compare the cos(\u03B8) factor for all four thread types.', steps: ['Square: cos(0\u00B0) = 1.0000 (highest efficiency)', 'ACME: cos(14.5\u00B0) = 0.9686', 'Trapezoidal: cos(15\u00B0) = 0.9659', 'Buttress: cos(22.5\u00B0) = 0.9239 (lowest efficiency)'], answer: 0.9659, unit: '' }
    },

    /* Design */
    {
      id: 'self-locking', name: 'Self-Locking', symbol: '\u03BC \u2265 Lcos\u03B8/(\u03C0dm)', cat: 'design',
      formula: '\u03BC \u2265 L\u00B7cos(\u03B8) / (\u03C0\u00B7dm)', unit: '\u2014',
      desc: 'A power screw is self-locking when friction is large enough to prevent back-driving. The condition is \u03BC \u2265 L\u00B7cos(\u03B8)/(\u03C0\u00B7dm). When self-locking, T_lower > 0 (external torque is needed to lower the load). This is essential for safety in screw jacks, vises, and clamps.',
      example: { problem: 'Is a square screw self-locking? d=30, p=6, n=1, \u03BC=0.15.', steps: ['dm = 27 mm, L = 6 mm, \u03B8 = 0\u00B0', 'Threshold: Lcos\u03B8/(\u03C0dm) = 6\u00D71/(27\u03C0)', '= 6/84.82 = 0.0707', '\u03BC = 0.15 > 0.0707 \u2192 Self-locking: YES'], answer: 0.0707, unit: '' }
    },
    {
      id: 'overhauling', name: 'Overhauling', symbol: 'T_lower < 0', cat: 'design',
      formula: 'Overhauls when \u03BC < L\u00B7cos(\u03B8) / (\u03C0\u00B7dm)', unit: '\u2014',
      desc: 'Overhauling (back-driving) occurs when the load can drive the screw without any applied torque. This happens when T_lower < 0, meaning the thread friction is insufficient to hold the load. Overhauling screws need a brake mechanism. Some applications (e.g., auto-feed mechanisms) intentionally use overhauling screws.',
      example: { problem: 'A triple-start screw: d=40mm, p=8mm, \u03BC=0.10. Will it overhaul?', steps: ['dm = 40 \u2212 4 = 36 mm, L = 3\u00D78 = 24 mm', 'Threshold: 24\u00D71/(\u03C0\u00D736) = 24/113.1 = 0.2122', '\u03BC = 0.10 < 0.2122', 'YES \u2014 screw will overhaul (back-drive)'], answer: 0.2122, unit: '' }
    },
    {
      id: 'efficiency', name: 'Efficiency', symbol: '\u03B7 = WL/(2\u03C0T)', cat: 'design',
      formula: '\u03B7 = (W \u00D7 L) / (2\u03C0 \u00D7 T_raise) \u00D7 100%', unit: '%',
      desc: 'The efficiency of a power screw is the ratio of useful work output (W \u00D7 L per revolution) to the input work (2\u03C0 \u00D7 T_raise per revolution). Typical efficiencies: square threads 30\u201370%, ACME threads 25\u201365%. Self-locking screws always have efficiency below 50%. Higher efficiency means less input torque for the same load.',
      example: { problem: 'W=10kN, L=6mm, T_raise=57100 N\u00B7mm. Find efficiency.', steps: ['\u03B7 = (W \u00D7 L) / (2\u03C0 \u00D7 T_raise) \u00D7 100', '\u03B7 = (10000 \u00D7 6) / (2\u03C0 \u00D7 57100) \u00D7 100', '\u03B7 = 60000 / 358,761 \u00D7 100', '\u03B7 = 16.7%'], answer: 16.7, unit: '%' }
    },
    {
      id: 'collar-friction', name: 'Collar Friction', symbol: 'Tc = W\u03BCcdc/2', cat: 'design',
      formula: 'T_collar = W \u00D7 \u03BCc \u00D7 dc / 2', unit: 'N\u00B7mm',
      desc: 'The collar (thrust bearing) friction adds a significant torque component. T_collar = W \u00D7 \u03BCc \u00D7 dc / 2, where \u03BCc is the collar friction coefficient and dc is the mean collar diameter. This torque is the same for both raising and lowering. Using a thrust bearing (\u03BCc \u2248 0.01\u20130.02) instead of sliding contact (\u03BCc \u2248 0.10\u20130.20) greatly reduces total torque.',
      example: { problem: 'W=15kN, \u03BCc=0.12, dc=50mm. Find collar torque.', steps: ['T_collar = W \u00D7 \u03BCc \u00D7 dc / 2', 'T_collar = 15000 \u00D7 0.12 \u00D7 50 / 2', 'T_collar = 45,000 N\u00B7mm'], answer: 45000, unit: 'N\u00B7mm' }
    },

    /* Applications */
    {
      id: 'screw-jack', name: 'Screw Jack', symbol: 'Lifting device', cat: 'applications',
      formula: 'T = (Wdm/2)(raise formula) + collar torque', unit: 'N\u00B7mm',
      desc: 'A screw jack is the classic power screw application. It uses a large-diameter, single-start, self-locking screw to lift heavy loads. The operator applies torque with a handle bar. Typical features: square or ACME thread, single start for self-locking, handle length provides mechanical advantage. Common in automotive, construction, and machine leveling.',
      example: { problem: 'A screw jack lifts 20 kN. Handle = 400 mm. d=36mm, p=6mm, \u03BC=0.15, \u03BCc=0.12, dc=50mm. Find handle force.', steps: ['dm = 36\u22123 = 33mm, L = 6mm, \u03B8=0\u00B0', 'T_thread = (20000\u00D733/2)(0.15\u03C033+6)/(\u03C033\u22120.15\u00D76)', '= 330000 \u00D7 21.56/102.77 = 69,236', 'T_collar = 20000\u00D70.12\u00D750/2 = 60,000', 'T_total = 129,236 N\u00B7mm', 'F = T/handle = 129236/400 = 323 N'], answer: 323, unit: 'N' }
    },
    {
      id: 'c-clamp', name: 'C-Clamp / Vise', symbol: 'Clamping', cat: 'applications',
      formula: 'Self-locking required for safety', unit: '\u2014',
      desc: 'C-clamps and vises use power screws to apply and hold clamping force. Self-locking is essential so the workpiece stays clamped without continuous torque. ACME threads are common because they offer good strength, allow split-nut adjustment for wear, and are self-locking at typical friction values. The T-handle or lever provides the input torque.',
      example: { problem: 'Why must a vise screw be self-locking?', steps: ['If not self-locking, the workpiece would push the screw open', 'The vise would lose clamping force without applied torque', 'Self-locking ensures \u03BC \u2265 Lcos\u03B8/(\u03C0dm)', 'Single-start, small pitch ensures self-locking'], answer: 0, unit: '' }
    },
    {
      id: 'press', name: 'Press / Linear Actuator', symbol: 'Force multiplication', cat: 'applications',
      formula: 'MA = 2\u03C0R / (L \u00D7 \u03B7)', unit: '\u2014',
      desc: 'Presses and linear actuators use power screws to convert rotary motion into large linear forces. The mechanical advantage equals 2\u03C0R/(L\u00D7\u03B7), where R is the handle length and \u03B7 is efficiency. Hydraulic presses have largely replaced screw presses for high-force applications, but screw actuators remain common for precision positioning and moderate forces.',
      example: { problem: 'A press screw: L=8mm, handle=500mm, \u03B7=35%. Find mechanical advantage.', steps: ['MA = 2\u03C0R / (L \u00D7 \u03B7)', 'MA = 2\u03C0 \u00D7 500 / (8 \u00D7 0.35)', 'MA = 3141.6 / 2.8', 'MA = 1122 (force multiplication)'], answer: 1122, unit: '' }
    }
  ];

  var exploreCat = 'fundamentals';

  function buildExplore() {
    buildConceptGrid();
  }

  function buildConceptGrid() {
    conceptGrid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    filtered.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn';
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        conceptGrid.querySelectorAll('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo(c);
      });
      conceptGrid.appendChild(btn);
    });
  }

  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var cat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    exploreCat = cat;
    buildConceptGrid();
    itemInfo.style.display = 'none';
  });

  function showConceptInfo(c) {
    itemInfo.style.display = '';
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step">\u2192 <strong>' + s + '</strong></p>';
      });
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  /* ── 8. Practice mode ── */
  var practiceGenerators = [
    // 0: Calculate lead
    function () {
      var n = randInt(1, 4);
      var p = randChoice([2, 3, 4, 5, 6, 8, 10]);
      var L = n * p;
      return {
        prompt: 'A ' + n + '-start power screw has a pitch of ' + p + ' mm. Calculate the lead (L).',
        answer: L, unit: 'mm', tolerance: 0.1,
        steps: ['L = n \u00D7 p', 'L = ' + n + ' \u00D7 ' + p, 'L = ' + L + ' mm']
      };
    },
    // 1: Calculate mean diameter
    function () {
      var d = randChoice([20, 24, 30, 36, 40, 50]);
      var p = randChoice([3, 4, 5, 6, 8]);
      var dm = d - p / 2;
      return {
        prompt: 'A power screw has major diameter d = ' + d + ' mm and pitch p = ' + p + ' mm. Calculate the mean diameter (dm).',
        answer: dm, unit: 'mm', tolerance: 0.1,
        steps: ['dm = d \u2212 p/2', 'dm = ' + d + ' \u2212 ' + p + '/2', 'dm = ' + d + ' \u2212 ' + (p / 2).toFixed(1), 'dm = ' + dm.toFixed(1) + ' mm']
      };
    },
    // 2: Calculate lead angle
    function () {
      var d = randChoice([24, 30, 36, 40, 50]);
      var p = randChoice([4, 5, 6, 8]);
      var n = randInt(1, 3);
      var L = n * p;
      var dm = d - p / 2;
      var alpha = Math.atan(L / (Math.PI * dm)) * 180 / Math.PI;
      return {
        prompt: 'Find the lead angle for a ' + n + '-start screw with d = ' + d + ' mm and p = ' + p + ' mm.',
        answer: round2(alpha), unit: '\u00B0', tolerance: 0.2,
        steps: ['dm = ' + d + ' \u2212 ' + (p / 2).toFixed(1) + ' = ' + dm.toFixed(1) + ' mm', 'L = ' + n + ' \u00D7 ' + p + ' = ' + L + ' mm', '\u03B1 = atan(L / (\u03C0 \u00D7 dm))', '\u03B1 = atan(' + L + ' / (' + (Math.PI * dm).toFixed(2) + '))', '\u03B1 = ' + alpha.toFixed(2) + '\u00B0']
      };
    },
    // 3: Calculate torque to raise (square thread, no collar)
    function () {
      var d = randChoice([24, 30, 36, 40]);
      var p = randChoice([4, 5, 6]);
      var W_kN = randChoice([5, 8, 10, 12, 15, 20]);
      var mu = randChoice([0.10, 0.12, 0.15, 0.18]);
      var W = W_kN * 1000;
      var dm = d - p / 2;
      var L = p; // single start
      var num = mu * Math.PI * dm + L;
      var den = Math.PI * dm - mu * L;
      var T = (W * dm / 2) * (num / den);
      return {
        prompt: 'Square thread (single start): d = ' + d + ' mm, p = ' + p + ' mm, W = ' + W_kN + ' kN, \u03BC_thread = ' + mu + '. Calculate thread torque to raise (no collar). Round to nearest N\u00B7mm.',
        answer: Math.round(T), unit: 'N\u00B7mm', tolerance: Math.max(50, Math.round(T) * 0.02),
        steps: ['dm = ' + dm.toFixed(1) + ' mm, L = ' + L + ' mm', 'T = (W\u00D7dm/2) \u00D7 (\u03BC\u03C0dm + L) / (\u03C0dm \u2212 \u03BCL)', 'Numerator: ' + mu + '\u00D7\u03C0\u00D7' + dm.toFixed(1) + ' + ' + L + ' = ' + num.toFixed(2), 'Denominator: \u03C0\u00D7' + dm.toFixed(1) + ' \u2212 ' + mu + '\u00D7' + L + ' = ' + den.toFixed(2), 'T = (' + W + '\u00D7' + dm.toFixed(1) + '/2) \u00D7 (' + num.toFixed(2) + '/' + den.toFixed(2) + ')', 'T = ' + Math.round(T) + ' N\u00B7mm']
      };
    },
    // 4: Calculate collar torque
    function () {
      var W_kN = randChoice([5, 8, 10, 15, 20, 25]);
      var muC = randChoice([0.08, 0.10, 0.12, 0.15]);
      var dc = randChoice([30, 40, 45, 50, 60]);
      var W = W_kN * 1000;
      var Tc = W * muC * dc / 2;
      return {
        prompt: 'Calculate the collar torque. W = ' + W_kN + ' kN, \u03BC_collar = ' + muC + ', mean collar diameter dc = ' + dc + ' mm.',
        answer: Math.round(Tc), unit: 'N\u00B7mm', tolerance: Math.max(10, Math.round(Tc) * 0.02),
        steps: ['T_collar = W \u00D7 \u03BCc \u00D7 dc / 2', 'T_collar = ' + W + ' \u00D7 ' + muC + ' \u00D7 ' + dc + ' / 2', 'T_collar = ' + Math.round(Tc) + ' N\u00B7mm']
      };
    },
    // 5: Calculate efficiency
    function () {
      var d = randChoice([24, 30, 36, 40]);
      var p = randChoice([4, 5, 6, 8]);
      var W_kN = randChoice([5, 10, 15, 20]);
      var mu = randChoice([0.10, 0.12, 0.15]);
      var muC = randChoice([0.10, 0.12]);
      var dc = randChoice([40, 45, 50]);
      var W = W_kN * 1000;
      var dm = d - p / 2;
      var L = p;
      var num = mu * Math.PI * dm + L;
      var den = Math.PI * dm - mu * L;
      var Tt = (W * dm / 2) * (num / den);
      var Tc = W * muC * dc / 2;
      var T = Tt + Tc;
      var eff = (W * L) / (2 * Math.PI * T) * 100;
      return {
        prompt: 'Square thread: d=' + d + 'mm, p=' + p + 'mm, n=1, W=' + W_kN + 'kN, \u03BC=' + mu + ', \u03BCc=' + muC + ', dc=' + dc + 'mm. Calculate overall efficiency (%).',
        answer: round1(eff), unit: '%', tolerance: 1,
        steps: ['dm = ' + dm.toFixed(1) + ' mm, L = ' + L + ' mm', 'T_thread = ' + Math.round(Tt) + ' N\u00B7mm', 'T_collar = ' + Math.round(Tc) + ' N\u00B7mm', 'T_raise = ' + Math.round(T) + ' N\u00B7mm', '\u03B7 = (WL)/(2\u03C0T) \u00D7 100', '\u03B7 = (' + W + '\u00D7' + L + ')/(2\u03C0\u00D7' + Math.round(T) + ') \u00D7 100', '\u03B7 = ' + eff.toFixed(1) + '%']
      };
    },
    // 6: Self-locking check
    function () {
      var d = randChoice([24, 30, 36, 40, 50]);
      var p = randChoice([4, 5, 6, 8, 10]);
      var n = randInt(1, 3);
      var mu = randChoice([0.08, 0.10, 0.12, 0.15, 0.20]);
      var type = randChoice(['square', 'acme', 'trapezoidal']);
      var theta = THREAD_ANGLES[type] * Math.PI / 180;
      var L = n * p;
      var dm = d - p / 2;
      var threshold = L * Math.cos(theta) / (Math.PI * dm);
      var selfLocking = mu >= threshold;
      return {
        prompt: THREAD_NAMES[type] + ' thread: d=' + d + 'mm, p=' + p + 'mm, n=' + n + ', \u03BC=' + mu + '. Calculate the self-locking threshold (\u03BC_min). Round to 4 decimal places.',
        answer: round4(threshold), unit: '', tolerance: 0.001,
        steps: ['dm = ' + dm.toFixed(1) + ' mm, L = ' + L + ' mm', '\u03B8 = ' + THREAD_ANGLES[type] + '\u00B0, cos\u03B8 = ' + Math.cos(theta).toFixed(4), '\u03BC_min = L\u00B7cos\u03B8 / (\u03C0\u00B7dm)', '\u03BC_min = ' + L + '\u00D7' + Math.cos(theta).toFixed(4) + ' / (\u03C0\u00D7' + dm.toFixed(1) + ')', '\u03BC_min = ' + threshold.toFixed(4), '\u03BC = ' + mu + (selfLocking ? ' \u2265 ' : ' < ') + threshold.toFixed(4) + ' \u2192 ' + (selfLocking ? 'Self-locking' : 'Overhauling')]
      };
    },
    // 7: ACME torque to raise
    function () {
      var d = randChoice([30, 36, 40, 50]);
      var p = randChoice([5, 6, 8]);
      var W_kN = randChoice([8, 10, 15, 20]);
      var mu = randChoice([0.12, 0.15, 0.18]);
      var muC = randChoice([0.10, 0.12]);
      var dc = randChoice([40, 50, 60]);
      var W = W_kN * 1000;
      var dm = d - p / 2;
      var L = p;
      var cosT = Math.cos(14.5 * Math.PI / 180);
      var num = mu * Math.PI * dm + L * cosT;
      var den = Math.PI * dm * cosT - mu * L;
      var Tt = (W * dm / 2) * (num / den);
      var Tc = W * muC * dc / 2;
      var T = Tt + Tc;
      return {
        prompt: 'ACME thread (single start): d=' + d + 'mm, p=' + p + 'mm, W=' + W_kN + 'kN, \u03BC=' + mu + ', \u03BCc=' + muC + ', dc=' + dc + 'mm. Find total T_raise.',
        answer: Math.round(T), unit: 'N\u00B7mm', tolerance: Math.max(100, Math.round(T) * 0.03),
        steps: ['dm = ' + dm.toFixed(1) + ' mm, L = ' + L + ' mm', 'cos(14.5\u00B0) = ' + cosT.toFixed(4), 'T_thread = (W\u00D7dm/2)(\u03BC\u03C0dm + Lcos\u03B8)/(\u03C0dmcos\u03B8 \u2212 \u03BCL)', 'T_thread = ' + Math.round(Tt) + ' N\u00B7mm', 'T_collar = ' + Math.round(Tc) + ' N\u00B7mm', 'T_raise = ' + Math.round(T) + ' N\u00B7mm']
      };
    },
    // 8: Torque to lower
    function () {
      var d = randChoice([30, 36, 40]);
      var p = randChoice([4, 5, 6]);
      var W_kN = randChoice([8, 10, 15]);
      var mu = randChoice([0.12, 0.15]);
      var muC = randChoice([0.10, 0.12]);
      var dc = randChoice([40, 45, 50]);
      var W = W_kN * 1000;
      var dm = d - p / 2;
      var L = p;
      var numL = mu * Math.PI * dm - L;
      var denL = Math.PI * dm + mu * L;
      var Tt = (W * dm / 2) * (numL / denL);
      var Tc = W * muC * dc / 2;
      var T = Tt + Tc;
      return {
        prompt: 'Square thread (single start): d=' + d + 'mm, p=' + p + 'mm, W=' + W_kN + 'kN, \u03BC=' + mu + ', \u03BCc=' + muC + ', dc=' + dc + 'mm. Find total T_lower.',
        answer: Math.round(T), unit: 'N\u00B7mm', tolerance: Math.max(50, Math.abs(Math.round(T)) * 0.03),
        steps: ['dm = ' + dm.toFixed(1) + ' mm, L = ' + L + ' mm', 'T_thread_lower = (W\u00D7dm/2)(\u03BC\u03C0dm \u2212 L)/(\u03C0dm + \u03BCL)', 'Numerator: ' + mu + '\u00D7\u03C0\u00D7' + dm.toFixed(1) + ' \u2212 ' + L + ' = ' + numL.toFixed(2), 'Denominator: \u03C0\u00D7' + dm.toFixed(1) + ' + ' + mu + '\u00D7' + L + ' = ' + denL.toFixed(2), 'T_thread = ' + Math.round(Tt) + ' N\u00B7mm', 'T_collar = ' + Math.round(Tc) + ' N\u00B7mm', 'T_lower = ' + Math.round(T) + ' N\u00B7mm']
      };
    },
    // 9: Lead for multi-start
    function () {
      var n = randChoice([2, 3, 4]);
      var p = randChoice([3, 4, 5, 6, 8]);
      var L = n * p;
      return {
        prompt: 'A ' + n + '-start power screw has a pitch of ' + p + ' mm. What is the lead? How far does the nut travel per revolution?',
        answer: L, unit: 'mm', tolerance: 0.1,
        steps: ['L = n \u00D7 p', 'L = ' + n + ' \u00D7 ' + p, 'L = ' + L + ' mm', 'The nut advances ' + L + ' mm per revolution']
      };
    },
    // 10: Handle force for screw jack
    function () {
      var d = randChoice([30, 36, 40]);
      var p = randChoice([5, 6, 8]);
      var W_kN = randChoice([10, 15, 20, 25]);
      var mu = 0.15;
      var muC = 0.12;
      var dc = randChoice([40, 45, 50]);
      var handle = randChoice([300, 400, 500]);
      var W = W_kN * 1000;
      var dm = d - p / 2;
      var L = p;
      var num = mu * Math.PI * dm + L;
      var den = Math.PI * dm - mu * L;
      var Tt = (W * dm / 2) * (num / den);
      var Tc = W * muC * dc / 2;
      var T = Tt + Tc;
      var F = T / handle;
      return {
        prompt: 'Screw jack: square thread d=' + d + 'mm, p=' + p + 'mm, W=' + W_kN + 'kN, \u03BC=0.15, \u03BCc=0.12, dc=' + dc + 'mm, handle=' + handle + 'mm. Find the force at the handle end (N).',
        answer: round1(F), unit: 'N', tolerance: Math.max(2, F * 0.03),
        steps: ['dm = ' + dm.toFixed(1) + ' mm, L = ' + L + ' mm', 'T_thread = ' + Math.round(Tt) + ' N\u00B7mm', 'T_collar = ' + Math.round(Tc) + ' N\u00B7mm', 'T_raise = ' + Math.round(T) + ' N\u00B7mm', 'F = T / handle = ' + Math.round(T) + ' / ' + handle, 'F = ' + F.toFixed(1) + ' N']
      };
    },
    // 11: Mechanical advantage
    function () {
      var L = randChoice([4, 5, 6, 8, 10]);
      var handle = randChoice([300, 400, 500, 600]);
      var eff = randChoice([25, 30, 35, 40, 45]);
      var MA = 2 * Math.PI * handle / (L * eff / 100);
      return {
        prompt: 'A power screw has L = ' + L + ' mm, handle length = ' + handle + ' mm, efficiency = ' + eff + '%. Calculate the mechanical advantage (force multiplication ratio).',
        answer: Math.round(MA), unit: '', tolerance: Math.max(5, MA * 0.02),
        steps: ['MA = 2\u03C0R / (L \u00D7 \u03B7)', 'MA = 2\u03C0 \u00D7 ' + handle + ' / (' + L + ' \u00D7 ' + (eff / 100).toFixed(2) + ')', 'MA = ' + (2 * Math.PI * handle).toFixed(1) + ' / ' + (L * eff / 100).toFixed(2), 'MA = ' + Math.round(MA)]
      };
    }
  ];

  function newPracticeQuestion() {
    pChecked = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppNext.style.display = 'none';
    ppCheck.style.display = '';
    ppShow.style.display = '';
    ppInput.value = '';
    ppInput.disabled = false;

    var gen = practiceGenerators[randInt(0, practiceGenerators.length - 1)];
    var q = gen();
    ppPrompt.textContent = q.prompt;
    ppUnit.textContent = q.unit;
    pAnswer = q.answer;
    pTolerance = q.tolerance;
    pSolutionSteps = q.steps;

    draw();
  }

  ppCheck.addEventListener('click', function () {
    if (pChecked) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Enter a number.'; ppFeedback.className = 'feedback err'; return; }
    pChecked = true;
    pTotal++;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppShow.style.display = 'none';
    ppNext.style.display = '';

    if (Math.abs(val - pAnswer) <= pTolerance) {
      pCorrect++;
      ppFeedback.textContent = '\u2713 Correct! Answer: ' + pAnswer;
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '\u2717 Incorrect. Correct answer: ' + pAnswer;
      ppFeedback.className = 'feedback err';
    }
    pbarScoreVal.textContent = pCorrect + ' / ' + pTotal;
    showSolution();
  });

  ppShow.addEventListener('click', function () {
    showSolution();
  });

  ppNext.addEventListener('click', function () {
    newPracticeQuestion();
  });

  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') ppCheck.click();
  });

  function showSolution() {
    ppSolution.style.display = '';
    var html = '<h4>Solution</h4>';
    pSolutionSteps.forEach(function (s) {
      html += '<p class="sol-step">\u2192 <strong>' + s + '</strong></p>';
    });
    ppSolution.innerHTML = html;
  }

  /* ── 9. Quiz mode ── */
  var QUIZ_POOL = [
    /* MCQ questions (type: 'mcq') */
    { type: 'mcq', prompt: 'Which thread form has the highest mechanical efficiency?', options: ['ACME', 'Square', 'Buttress', 'Trapezoidal'], correct: 1 },
    { type: 'mcq', prompt: 'What is the thread half-angle for ACME threads?', options: ['0\u00B0', '14.5\u00B0', '15\u00B0', '22.5\u00B0'], correct: 1 },
    { type: 'mcq', prompt: 'A self-locking screw has an efficiency:', options: ['Greater than 50%', 'Less than 50%', 'Exactly 50%', 'Greater than 75%'], correct: 1 },
    { type: 'mcq', prompt: 'The lead of a triple-start screw with 4 mm pitch is:', options: ['4 mm', '8 mm', '12 mm', '16 mm'], correct: 2 },
    { type: 'mcq', prompt: 'Which thread form is best for heavy loads in one direction?', options: ['Square', 'ACME', 'Buttress', 'Trapezoidal'], correct: 2 },
    { type: 'mcq', prompt: 'Overhauling occurs when:', options: ['The screw is self-locking', 'T_lower > 0', 'T_lower < 0 (load back-drives the screw)', 'Efficiency > 75%'], correct: 2 },
    { type: 'mcq', prompt: 'The collar torque component depends on:', options: ['Thread angle and pitch', 'Load, collar friction, and collar diameter', 'Lead angle only', 'Number of starts'], correct: 1 },
    { type: 'mcq', prompt: 'Trapezoidal threads are the metric equivalent of:', options: ['Square threads', 'ACME threads', 'Buttress threads', 'V-threads'], correct: 1 },

    /* Numeric questions (type: 'numeric') */
    { type: 'numeric', prompt: 'Calculate the mean diameter (mm) for d = 40 mm, p = 8 mm.', answer: 36, unit: 'mm', tolerance: 0.1 },
    { type: 'numeric', prompt: 'Lead for a double-start screw with p = 5 mm? (mm)', answer: 10, unit: 'mm', tolerance: 0.1 },
    { type: 'numeric', prompt: 'cos(14.5\u00B0) = ? (to 4 decimal places)', answer: 0.9686, unit: '', tolerance: 0.001 },
    { type: 'numeric', prompt: 'Collar torque for W=10kN, \u03BCc=0.12, dc=50mm? (N\u00B7mm)', answer: 30000, unit: 'N\u00B7mm', tolerance: 100 },
    { type: 'numeric', prompt: 'Lead angle (\u00B0) for dm=27mm, L=6mm? Round to 2 decimal places.', answer: round2(Math.atan(6 / (Math.PI * 27)) * 180 / Math.PI), unit: '\u00B0', tolerance: 0.15 },
    { type: 'numeric', prompt: 'Self-locking threshold \u03BC_min for square thread dm=33mm, L=6mm? (4 decimal places)', answer: round4(6 / (Math.PI * 33)), unit: '', tolerance: 0.001 },
    { type: 'numeric', prompt: 'Efficiency if W=10kN, L=6mm, T_raise=50,000 N\u00B7mm? (%)', answer: round1(10000 * 6 / (2 * Math.PI * 50000) * 100), unit: '%', tolerance: 0.5 }
  ];

  function startQuiz() {
    quizSet = shuffle(QUIZ_POOL.slice()).slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizSubmitted = false;
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIdx >= QUIZ_SIZE) {
      showQuizResult();
      return;
    }
    qbarNum.textContent = quizIdx + 1;
    var q = quizSet[quizIdx];
    quizSubmitted = false;
    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, i) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row"><input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer"><span class="qi-unit">' + q.unit + '</span></div>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
    }
    html += '<div class="quiz-feedback" id="quiz-fb" style="margin-top:10px;"></div>';
    html += '<button class="btn btn-ghost" id="qi-next" style="display:none;margin-top:8px;">Next \u2192</button>';

    quizPanel.innerHTML = html;

    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizSubmitted) return;
          quizSubmitted = true;
          var idx = parseInt(btn.dataset.idx);
          var correct = idx === q.correct;
          if (correct) quizScore++;
          quizAnswers.push({ q: q, given: q.options[idx], correct: correct, correctAnswer: q.options[q.correct] });

          quizPanel.querySelectorAll('.answer-btn').forEach(function (b, bi) {
            b.classList.add('locked');
            if (bi === q.correct) b.classList.add('correct');
            if (bi === idx && !correct) b.classList.add('wrong');
          });
          var fb = document.getElementById('quiz-fb');
          fb.textContent = correct ? '\u2713 Correct!' : '\u2717 Incorrect. Answer: ' + q.options[q.correct];
          fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
          document.getElementById('qi-next').style.display = '';
        });
      });
    } else {
      document.getElementById('qi-submit').addEventListener('click', function () {
        if (quizSubmitted) return;
        var inp = document.getElementById('qi-input');
        var val = parseFloat(inp.value);
        if (isNaN(val)) return;
        quizSubmitted = true;
        var correct = Math.abs(val - q.answer) <= q.tolerance;
        if (correct) quizScore++;
        quizAnswers.push({ q: q, given: val + ' ' + q.unit, correct: correct, correctAnswer: q.answer + ' ' + q.unit });

        inp.disabled = true;
        this.disabled = true;
        var fb = document.getElementById('quiz-fb');
        fb.textContent = correct ? '\u2713 Correct!' : '\u2717 Incorrect. Answer: ' + q.answer + ' ' + q.unit;
        fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
        document.getElementById('qi-next').style.display = '';
      });

      document.getElementById('qi-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') document.getElementById('qi-submit').click();
      });
    }

    document.getElementById('qi-next').addEventListener('click', function () {
      quizIdx++;
      renderQuizQuestion();
    });
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var scoreClass = pct >= 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct >= 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605' : '\u2605';
    var verdict = pct >= 1 ? 'Perfect score!' : pct >= 0.6 ? 'Good job!' : 'Keep practicing!';

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + scoreClass + '">' + quizScore + '/' + QUIZ_SIZE + '</span><div class="qr-verdict">' + verdict + '</div></div>';
    html += '</div>';

    html += '<div class="qr-rows">';
    quizAnswers.forEach(function (a, i) {
      var cls = a.correct ? 'ok' : 'err';
      html += '<div class="qr-row ' + cls + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail">Your answer: <strong>' + a.given + '</strong>' + (a.correct ? '' : ' \u2014 Correct: <strong>' + a.correctAnswer + '</strong>') + '</span>';
      html += '<span class="qr-mark">' + (a.correct ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="qr-retry">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('qr-retry').addEventListener('click', function () {
      startQuiz();
    });
  }

  /* ── 10. Slider events ── */
  function bindSlider(sl, sv, suffix, decimals) {
    sl.addEventListener('input', function () {
      syncSliderLabels();
      if (mode === 'simulate') {
        updateReadouts();
        draw();
      }
    });
  }
  /* Single owner of the slider captions, so a drag and the unit toggle can
     never disagree. Starts and the two friction coefficients are unitless. */
  function syncSliderLabels() {
    svDiameter.textContent   = lFix(+slDiameter.value, 0, 3) + ' ' + uL();
    svPitch.textContent      = lFix(+slPitch.value, 0, 3) + ' ' + uL();
    svStarts.textContent     = slStarts.value;
    svLoad.textContent       = (isImp() ? wD(+slLoad.value).toFixed(0) : slLoad.value) + ' ' + uW();
    svMuThread.textContent   = (+slMuThread.value).toFixed(2);
    svMuCollar.textContent   = (+slMuCollar.value).toFixed(2);
    svCollarDia.textContent  = lFix(+slCollarDia.value, 0, 3) + ' ' + uL();
  }

  /* Unit toggle — display only; the screw model stays in mm / kN */
  Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-unit');
      if (!u || u === unitSys) return;
      unitSys = u;
      Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (b) {
        b.classList.toggle('active', b === btn);
      });
      syncSliderLabels();
      updateReadouts();
      draw();
    });
  });

  bindSlider(slDiameter, svDiameter, ' mm');
  bindSlider(slPitch, svPitch, ' mm');
  bindSlider(slStarts, svStarts, '');
  bindSlider(slLoad, svLoad, ' kN');
  bindSlider(slMuThread, svMuThread, '', 2);
  bindSlider(slMuCollar, svMuCollar, '', 2);
  bindSlider(slCollarDia, svCollarDia, ' mm');

  /* Thread type tabs */
  threadTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var type = e.target.dataset.thread;
    if (!type) return;
    threadTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    threadType = type;
    updateReadouts();
    draw();
  });

  /* Run simulation button */
  btnRunSim.addEventListener('click', function () {
    if (animating) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  /* ── 11. Utilities ── */
  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randChoice(arr) { return arr[randInt(0, arr.length - 1)]; }
  function round1(v) { return Math.round(v * 10) / 10; }
  function round2(v) { return Math.round(v * 100) / 100; }
  function round4(v) { return Math.round(v * 10000) / 10000; }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ── 12. Resize handler ── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { draw(); }, 100);
  });

  /* ── 13. Init ── */
  updateReadouts();
  draw();

})();
