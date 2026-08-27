/* Continuity Equation Simulator — NHIT VisualLab
   Mass conservation (incompressible, single pipe, no branches):
     A1 · V1 = A2 · V2  →  V2 = (A1/A2) · V1 = (D1/D2)² · V1
     Q = A · V (volumetric flow rate, conserved)
*/
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  var PRESETS = [
    { key: 'default', name: 'Default',           d1: 10,  d2: 5,    v1: 2.0 },
    { key: 'hose',    name: 'Garden Hose Nozzle',d1: 1.6, d2: 0.7,  v1: 1.5 },
    { key: 'fire',    name: 'Fire Hose',         d1: 6,   d2: 2,    v1: 3.0 },
    { key: 'aorta',   name: 'Aorta Section',     d1: 2.5, d2: 1.5,  v1: 0.3 },
    { key: 'river',   name: 'River Narrows',     d1: 30,  d2: 10,   v1: 0.5 },
    { key: 'wind',    name: 'Wind Tunnel Test',  d1: 25,  d2: 8,    v1: 4.0 }
  ];

  var state = {
    mode: 'simulate',
    unit: 'si',
    D1: 0.10, D2: 0.05,    // metres
    V1: 2.0,                // m/s
    running: true,
    showParticles: true, showEquation: true, showArrows: true, showGrid: false,
    pp: { problem: null, score: 0, total: 0 },
    qz: { idx: 0, q: null, answers: [], started: false },
    history: [], redoStack: [],
    audioCtx: null, raf: 0,
    particles: []
  };

  var canvas = $('sim-canvas'); var ctx = canvas.getContext('2d');

  function isImp() { return state.unit === 'imp'; }
  function uLabel(k) {
    var imp = isImp();
    switch (k) {
      case 'v':    return imp ? 'ft/s' : 'm/s';
      case 'len':  return imp ? 'in' : 'cm';
      case 'area': return imp ? 'in²' : 'cm²';
      case 'q':    return imp ? 'gal/s' : 'L/s';
    }
    return '';
  }
  function toD(v, k) {
    if (!isImp()) return v;
    switch (k) {
      case 'v':    return v * 3.28084;
      case 'len':  return v / 2.54;
      case 'area': return v / 6.4516;
      case 'q':    return v * 0.264172;
    }
    return v;
  }
  function fmt(v, dp) {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 100000 || (a > 0 && a < 0.001)) return v.toExponential(2);
    if (dp == null) dp = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
    return v.toFixed(dp);
  }

  function compute() {
    var A1 = Math.PI * Math.pow(state.D1 / 2, 2);
    var A2 = Math.PI * Math.pow(state.D2 / 2, 2);
    var V2 = (A1 / A2) * state.V1;
    var Q = A1 * state.V1;
    return {
      A1_m2: A1, A2_m2: A2, V1: state.V1, V2: V2, Q_m3: Q,
      ratioV: V2 / state.V1,
      ratioA: A2 / A1,
      ratioD: state.D2 / state.D1
    };
  }

  /* Audio */
  function getAudio() { if (!state.audioCtx) try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } return state.audioCtx; }
  function playTone(f, d, t, v) { var ac = getAudio(); if (!ac) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = t || 'sine'; o.frequency.value = f; g.gain.value = v || 0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.stop(ac.currentTime + d + 0.02); }
  function playClick() { playTone(700, 0.04, 'square', 0.04); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.08); setTimeout(function(){ playTone(1320, 0.16, 'sine', 0.08); }, 110); }
  function playError() { playTone(220, 0.22, 'sawtooth', 0.05); }

  /* Canvas */
  function sizeCanvas() {
    var W = canvas.parentElement.clientWidth - 16;
    var H = Math.max(360, Math.min(W * 0.55, 460));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W: W, H: H };
  }

  /* ── Particles flowing through pipe ─────────────────────── */
  function spawnParticle(c, pipe) {
    /* Spawn at left end of section 1, distributed across pipe height */
    var p = {
      x: pipe.x0 - 5,
      y: pipe.y_mid + (Math.random() - 0.5) * pipe.h1 * 0.85,
      v: state.V1 * 12          // base px/frame
    };
    state.particles.push(p);
  }

  function updateParticles(W, c, pipe) {
    var spawnRate = Math.min(6, Math.max(1.2, state.V1 * 1.2));
    var nSpawn = Math.floor(spawnRate);
    if (Math.random() < (spawnRate - nSpawn)) nSpawn++;
    for (var i = 0; i < nSpawn; i++) spawnParticle(c, pipe);
    if (state.particles.length > 250) state.particles.splice(0, state.particles.length - 250);

    for (var j = state.particles.length - 1; j >= 0; j--) {
      var p = state.particles[j];
      /* Determine current section based on x */
      var v_now;
      if (p.x < pipe.xTaperStart) {
        /* Section 1 */
        v_now = state.V1 * pipe.scaleFactor;
        /* Constrain y to section 1 */
        if (Math.abs(p.y - pipe.y_mid) > pipe.h1 / 2 - 4) p.y = pipe.y_mid + (p.y > pipe.y_mid ? 1 : -1) * (pipe.h1 / 2 - 4);
      } else if (p.x < pipe.xTaperEnd) {
        /* Tapering — interpolate velocity smoothly */
        var f = (p.x - pipe.xTaperStart) / (pipe.xTaperEnd - pipe.xTaperStart);
        var vSI_now = state.V1 + f * (c.V2 - state.V1);
        v_now = vSI_now * pipe.scaleFactor;
        /* Constrain y to taper profile */
        var halfNow = (pipe.h1 / 2) * (1 - f) + (pipe.h2 / 2) * f - 4;
        if (Math.abs(p.y - pipe.y_mid) > halfNow) p.y = pipe.y_mid + (p.y > pipe.y_mid ? 1 : -1) * halfNow;
      } else {
        /* Section 2 */
        v_now = c.V2 * pipe.scaleFactor;
        if (Math.abs(p.y - pipe.y_mid) > pipe.h2 / 2 - 4) p.y = pipe.y_mid + (p.y > pipe.y_mid ? 1 : -1) * (pipe.h2 / 2 - 4);
      }
      p.x += Math.max(0.5, v_now);
      if (p.x > W + 10) state.particles.splice(j, 1);
    }
  }

  function drawParticles() {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(79,195,247,0.4)';
      ctx.beginPath();
      ctx.arc(p.x - 4, p.y, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPipe(W, H, c) {
    var x0 = 30, x1 = W - 30;
    var pipeLen = x1 - x0;
    /* Section split: 38% wide / 22% taper / 40% narrow */
    var xTaperStart = x0 + pipeLen * 0.38;
    var xTaperEnd   = x0 + pipeLen * 0.60;
    var y_mid = H / 2 + 10;
    /* Visual heights — proportional to D, capped */
    var maxPipeH = H * 0.55;
    var dMax = Math.max(state.D1, state.D2);
    var scalePx = Math.min(maxPipeH / dMax, 600);
    var h1 = state.D1 * scalePx;
    var h2 = state.D2 * scalePx;
    /* Velocity scale factor for animation */
    var visualV1 = 14;  // px/frame for V1=1 m/s appears smooth
    var scaleFactor = 14 / Math.max(state.V1, 0.5) * 0.5;
    /* But keep visual roughly proportional to actual */
    scaleFactor = Math.min(8, Math.max(1.5, scaleFactor));

    /* Pipe outline */
    ctx.strokeStyle = '#7ec8e3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    /* Top wall */
    ctx.moveTo(x0, y_mid - h1 / 2);
    ctx.lineTo(xTaperStart, y_mid - h1 / 2);
    ctx.lineTo(xTaperEnd, y_mid - h2 / 2);
    ctx.lineTo(x1, y_mid - h2 / 2);
    /* Bottom wall */
    ctx.moveTo(x0, y_mid + h1 / 2);
    ctx.lineTo(xTaperStart, y_mid + h1 / 2);
    ctx.lineTo(xTaperEnd, y_mid + h2 / 2);
    ctx.lineTo(x1, y_mid + h2 / 2);
    ctx.stroke();

    /* Fluid fill */
    ctx.fillStyle = 'rgba(0,168,150,0.10)';
    ctx.beginPath();
    ctx.moveTo(x0, y_mid - h1 / 2);
    ctx.lineTo(xTaperStart, y_mid - h1 / 2);
    ctx.lineTo(xTaperEnd, y_mid - h2 / 2);
    ctx.lineTo(x1, y_mid - h2 / 2);
    ctx.lineTo(x1, y_mid + h2 / 2);
    ctx.lineTo(xTaperEnd, y_mid + h2 / 2);
    ctx.lineTo(xTaperStart, y_mid + h1 / 2);
    ctx.lineTo(x0, y_mid + h1 / 2);
    ctx.closePath();
    ctx.fill();

    /* Section labels */
    drawHaloText('Section 1', (x0 + xTaperStart) / 2, y_mid - h1 / 2 - 12, '#80deea', 11, 'center');
    drawHaloText('Section 2', (xTaperEnd + x1) / 2, y_mid - h2 / 2 - 12, '#80deea', 11, 'center');
    drawHaloText('D₁ = ' + fmt(toD(state.D1 * 100, 'len')) + ' ' + uLabel('len'), (x0 + xTaperStart) / 2, y_mid + h1 / 2 + 16, '#dde3f0', 10, 'center');
    drawHaloText('V₁ = ' + fmt(toD(state.V1, 'v')) + ' ' + uLabel('v'), (x0 + xTaperStart) / 2, y_mid + h1 / 2 + 30, '#fff', 11, 'center');
    drawHaloText('D₂ = ' + fmt(toD(state.D2 * 100, 'len')) + ' ' + uLabel('len'), (xTaperEnd + x1) / 2, y_mid + h2 / 2 + 16, '#dde3f0', 10, 'center');
    drawHaloText('V₂ = ' + fmt(toD(c.V2, 'v')) + ' ' + uLabel('v'), (xTaperEnd + x1) / 2, y_mid + h2 / 2 + 30, c.V2 > state.V1 ? '#ffb74d' : '#7fdbff', 11, 'center');

    /* Velocity arrows */
    if (state.showArrows) {
      drawVelArrow(x0 + 30, y_mid, 30 + Math.min(60, state.V1 * 12), '#7fdbff');
      drawVelArrow(x1 - 30, y_mid, -(30 + Math.min(60, c.V2 * 8)), '#ffb74d');
    }

    return { x0: x0, x1: x1, y_mid: y_mid, h1: h1, h2: h2, xTaperStart: xTaperStart, xTaperEnd: xTaperEnd, scaleFactor: scaleFactor };
  }

  function drawVelArrow(cx, cy, len, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
    var x2 = cx + len, y2 = cy;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(x2, y2); ctx.stroke();
    var ah = 7;
    var dir = len >= 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - dir * ah, y2 - 4);
    ctx.lineTo(x2 - dir * ah, y2 + 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHaloText(txt, x, y, color, size, anchor) {
    ctx.save();
    ctx.font = '700 ' + size + 'px ' + (size <= 10 ? 'Courier New, monospace' : 'Segoe UI, sans-serif');
    ctx.textAlign = anchor || 'left';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(8,12,22,0.92)';
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = color;
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  /* Equation overlay (bottom-left so it doesn't overlap canvas toggles) */
  function drawEquation(W, H, c) {
    var bw = 230, bh = 50;
    var bx = 8, by = H - bh - 8;
    ctx.fillStyle = 'rgba(13,17,30,0.78)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(0,168,150,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    drawHaloText('A₁V₁ = A₂V₂', bx + 10, by + 18, '#26a69a', 12, 'left');
    drawHaloText('V₂/V₁ = (D₁/D₂)² = ' + fmt(c.ratioV) + '×', bx + 10, by + 38, '#fff', 10, 'left');
  }

  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(139,157,195,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function draw() {
    var dim = sizeCanvas(); var W = dim.W, H = dim.H;
    var c = compute();
    ctx.fillStyle = '#0a0e18'; ctx.fillRect(0, 0, W, H);
    if (state.showGrid) drawGrid(W, H);
    var pipe = drawPipe(W, H, c);
    if (state.running) updateParticles(W, c, pipe);
    if (state.showParticles) drawParticles();
    if (state.showEquation) drawEquation(W, H, c);
    if (state.running) requestDraw();
  }

  function requestDraw() {
    if (state.raf) return;
    state.raf = requestAnimationFrame(function () { state.raf = 0; draw(); updateReadouts(); });
  }

  /* Readouts */
  function updateReadouts() {
    var c = compute();
    var A1_cm2 = c.A1_m2 * 1e4, A2_cm2 = c.A2_m2 * 1e4;
    $('r-a1').textContent = fmt(toD(A1_cm2, 'area'));
    $('r-a2').textContent = fmt(toD(A2_cm2, 'area'));
    $('r-v1').textContent = fmt(toD(state.V1, 'v'));
    $('r-v2').textContent = fmt(toD(c.V2, 'v'));
    $('r-q').textContent = fmt(toD(c.Q_m3 * 1000, 'q'));
    $('r-ratio').textContent = c.ratioV.toFixed(2);
    $('r-ar').textContent = c.ratioA.toFixed(3);
    $('r-dr').textContent = c.ratioD.toFixed(3);

    $('r-unit-a1').textContent = ' ' + uLabel('area');
    $('r-unit-a2').textContent = ' ' + uLabel('area');
    $('r-unit-v1').textContent = ' ' + uLabel('v');
    $('r-unit-v2').textContent = ' ' + uLabel('v');
    $('r-unit-q').textContent = ' ' + uLabel('q');
    $('badge-d1').textContent = uLabel('len');
    $('badge-d2').textContent = uLabel('len');
    $('badge-v1').textContent = uLabel('v');

    var badges = $('readout-badges');
    if (badges) badges.style.display = state.mode === 'simulate' ? '' : 'none';
    $('rb-v2').textContent = fmt(toD(c.V2, 'v'));
    $('rb-v2-u').textContent = uLabel('v');
    $('rb-ratio').textContent = c.ratioV.toFixed(2);
    $('rb-q').textContent = fmt(toD(c.Q_m3 * 1000, 'q'));
    $('rb-q-u').textContent = uLabel('q');
    $('rb-ar').textContent = c.ratioA.toFixed(3);

    updateLearnPanels(c);
  }

  var _learnCache = { eq: '', cmp: '', co: '' };
  function updateLearnPanels(c) {
    var eq = $('lp-eq-body'); if (!eq) return;
    var html = '';
    html += '<div class="eq-line">\\(A_1 = \\dfrac{\\pi D_1^2}{4} = \\dfrac{\\pi \\cdot ' + state.D1 + '^2}{4} = ' + (c.A1_m2).toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2}\\)</div>';
    html += '<div class="eq-line">\\(A_2 = \\dfrac{\\pi D_2^2}{4} = \\dfrac{\\pi \\cdot ' + state.D2 + '^2}{4} = ' + (c.A2_m2).toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2}\\)</div>';
    html += '<div class="eq-line">\\[ V_2 = \\dfrac{A_1}{A_2} \\cdot V_1 = ' + (c.A1_m2 / c.A2_m2).toFixed(3) + ' \\cdot ' + state.V1 + ' = \\mathbf{' + c.V2.toFixed(3) + '\\;\\mathrm{m/s}} \\]</div>';
    html += '<div class="eq-line">\\(Q = A_1 \\cdot V_1 = ' + (c.Q_m3 * 1000).toFixed(4) + '\\;\\mathrm{L/s}\\) (constant along pipe)</div>';
    html += '<div class="eq-line">\\(\\dfrac{V_2}{V_1} = \\left(\\dfrac{D_1}{D_2}\\right)^2 = \\left(\\dfrac{' + state.D1 + '}{' + state.D2 + '}\\right)^2 = \\mathbf{' + c.ratioV.toFixed(2) + '\\times}\\)</div>';
    if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }

    var cmp = $('lp-cmp-body');
    if (cmp) {
      var rows = '<table class="cmp-table"><thead><tr><th>Section</th><th>D (cm)</th><th>A (cm²)</th><th>V (m/s)</th><th>Q (L/s)</th></tr></thead><tbody>';
      rows += '<tr><td>1 (wide)</td><td>' + (state.D1 * 100).toFixed(1) + '</td><td>' + (c.A1_m2 * 1e4).toFixed(2) + '</td><td>' + state.V1.toFixed(2) + '</td><td>' + (c.Q_m3 * 1000).toFixed(3) + '</td></tr>';
      rows += '<tr><td>2 (narrow)</td><td>' + (state.D2 * 100).toFixed(1) + '</td><td>' + (c.A2_m2 * 1e4).toFixed(2) + '</td><td class="cmp-float">' + c.V2.toFixed(2) + '</td><td>' + (c.Q_m3 * 1000).toFixed(3) + '</td></tr>';
      rows += '</tbody></table>';
      rows += '<p style="margin-top:8px;color:#8b9dc3;font-size:.78rem">Note: Q is identical in both sections — that is exactly what continuity guarantees.</p>';
      if (rows !== _learnCache.cmp) { cmp.innerHTML = rows; _learnCache.cmp = rows; }
    }

    var co = $('lp-coach-body');
    if (co) {
      var tips = [];
      tips.push('Velocity at section 2 is <b>' + c.ratioV.toFixed(2) + '×</b> the velocity at section 1, because the area ratio is ' + c.ratioA.toFixed(3) + '.');
      tips.push('Halving the diameter (D₂/D₁ = 0.5) gives V₂/V₁ = 4× — velocity scales with the inverse <em>square</em> of diameter.');
      if (c.ratioV > 4) tips.push('Strong constriction! The narrowing here would cause a large pressure drop (Bernoulli effect) and possibly cavitation in real systems.');
      if (c.ratioV < 1) tips.push('Section 2 is wider than 1 — flow slows down. This is what happens in a venturi diffuser, or where blood enters the larger total area of capillaries.');
      var html2 = '<ul class="coach-list">';
      for (var k = 0; k < tips.length; k++) html2 += '<li>' + tips[k] + '</li>';
      html2 += '</ul>';
      if (html2 !== _learnCache.co) { co.innerHTML = html2; _learnCache.co = html2; }
    }
  }

  function rebuildPresets() {
    var box = $('preset-chips'); box.innerHTML = '';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'preset-chip'; b.type = 'button'; b.textContent = p.name;
      b.addEventListener('click', function () { applyPreset(p); playClick(); });
      box.appendChild(b);
    });
  }
  function applyPreset(p) {
    pushHistory();
    state.D1 = p.d1 / 100; state.D2 = p.d2 / 100; state.V1 = p.v1;
    state.particles = [];
    syncControls(); updateReadouts(); requestDraw();
    document.querySelectorAll('.preset-chip').forEach(function (c) { c.classList.toggle('active', c.textContent === p.name); });
  }
  function syncControls() {
    var D1cm = state.D1 * 100, D2cm = state.D2 * 100;
    $('sl-d1').value = D1cm; $('in-d1').value = isImp() ? (D1cm / 2.54).toFixed(2) : D1cm.toFixed(1);
    $('sl-d2').value = D2cm; $('in-d2').value = isImp() ? (D2cm / 2.54).toFixed(2) : D2cm.toFixed(1);
    $('sl-v1').value = state.V1;
    $('in-v1').value = isImp() ? (state.V1 * 3.28084).toFixed(2) : state.V1.toFixed(2);
  }

  function snapshot() { return { D1: state.D1, D2: state.D2, V1: state.V1, unit: state.unit }; }
  function pushHistory() { state.history.push(snapshot()); if (state.history.length > 30) state.history.shift(); state.redoStack = []; }
  function applySnap(s) { state.D1 = s.D1; state.D2 = s.D2; state.V1 = s.V1; state.unit = s.unit; syncUnitTabs(); syncControls(); updateReadouts(); requestDraw(); }
  function doUndo() { if (state.history.length === 0) return; state.redoStack.push(snapshot()); applySnap(state.history.pop()); }
  function doRedo() { if (state.redoStack.length === 0) return; state.history.push(snapshot()); applySnap(state.redoStack.pop()); }
  function syncUnitTabs() { document.querySelectorAll('#unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.unit === state.unit); }); }

  function setMode(m) {
    state.mode = m;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === m); });
    $('sim-panel').style.display = (m === 'simulate') ? '' : 'none';
    $('learn-panels').style.display = (m === 'simulate') ? '' : 'none';
    $('cat-row').style.display = (m === 'explore') ? '' : 'none';
    $('item-selector').style.display = (m === 'explore') ? '' : 'none';
    $('item-info').style.display = (m === 'explore') ? '' : 'none';
    $('practice-panel').style.display = (m === 'practice') ? '' : 'none';
    $('practice-bar').style.display = (m === 'practice') ? '' : 'none';
    $('quiz-panel').style.display = (m === 'quiz') ? '' : 'none';
    $('quiz-bar').style.display = (m === 'quiz') ? '' : 'none';
    $('quiz-result').style.display = 'none';
    if (m === 'explore') buildExplore();
    if (m === 'practice') startPractice();
    if (m === 'quiz') startQuiz();
    updateReadouts(); requestDraw();
  }

  /* Explore */
  var EXPLORE = {
    basics: [
      { title: 'Mass Conservation', body: 'In steady, incompressible flow, mass cannot be created or destroyed. The mass passing any cross-section per second must be the same — leading to A·V = constant for constant density.', formula: 'ρ·A·V = const', note: 'For incompressible flow, ρ cancels and we get A·V = const.' },
      { title: 'Volumetric Flow Rate Q', body: 'Q (in m³/s or L/s) is the volume of fluid passing a cross-section per second. Q = A·V. By continuity, Q is constant along a pipe with no branches.', formula: 'Q = A · V', note: 'A garden hose at 0.5 L/s delivers 30 L per minute — enough for a pot of water in 20 seconds.' },
      { title: 'Why Speed Up at a Constriction?', body: 'Because the same volume per second has to squeeze through less area. Halving the cross-section doubles the velocity. The fluid has nowhere else to go.', formula: 'V₂ = (A₁/A₂)·V₁', note: 'Pinch a hose end with your thumb to feel this.' },
      { title: 'Incompressible vs Compressible', body: 'Liquids and low-speed gases are incompressible — density doesn\'t change. Above ~Mach 0.3 (~100 m/s in air), gas density changes significantly and continuity is ρ·A·V = const, not just A·V = const.', formula: '', note: 'High-speed jet engines need the compressible form.' }
    ],
    formulas: [
      { title: 'Continuity (Incompressible)', body: 'The simple form. V₂ = (A₁/A₂)·V₁ = (D₁/D₂)²·V₁ for circular pipes.', formula: 'A₁V₁ = A₂V₂', note: 'D₁ = 10, D₂ = 5 → V₂ = 4·V₁.' },
      { title: 'Volumetric Flow Rate', body: 'Q is what plumbers and engineers care about. Q = A·V is conserved in a single pipe.', formula: 'Q = A·V (m³/s)', note: '1 m³/s = 1000 L/s. Common: a kitchen tap is 0.1 L/s; a fire hose 30 L/s.' },
      { title: 'Mass Flow Rate (compressible)', body: 'For gases at high speed: ρ·A·V is what stays constant. As gas density changes (e.g., compressed in a turbojet), V and A adjust accordingly.', formula: 'ṁ = ρ·A·V', note: 'In nozzle flow, decreasing area can either accelerate (subsonic) or decelerate (supersonic) the gas.' },
      { title: 'Branched Flow (Splitting)', body: 'When a pipe splits: Q_in = Q_out1 + Q_out2 + ... The total volumetric flow is conserved.', formula: 'A·V = Σ Aᵢ·Vᵢ', note: 'In a circulatory system: cardiac output = sum of capillary flows in all organs.' }
    ],
    applications: [
      { title: 'Garden Hose Nozzle', body: 'Reducing the nozzle area by 4× quadruples the exit velocity. This sends water further and atomises it for spray.', formula: '', note: 'A typical hose: 1.6 cm body, 0.7 cm nozzle → 5.2× speed-up.' },
      { title: 'Aorta to Capillaries', body: 'Aorta D ≈ 2.5 cm, blood v ≈ 30 cm/s. Total capillary cross-section ≈ 4500 cm² (billions in parallel) — flow drops to ~1 mm/s, ideal for diffusion.', formula: '', note: 'Velocity decreases from aorta to capillaries by 1000×.' },
      { title: 'Wind Tunnel Test Section', body: 'Wide intake → narrow test section to accelerate air uniformly over the model. Continuity guarantees the speed-up; the contraction ratio sets the test velocity.', formula: '', note: 'A 9:1 area contraction gives 9× speed-up.' },
      { title: 'Dam Spillway', body: 'Wide reservoir → narrow spillway throat. Water accelerates from ~0.1 m/s in the lake to >10 m/s through the gates by continuity.', formula: '', note: 'A small constriction is the only thing standing between calm reservoir and torrential flood.' }
    ],
    errors: [
      { title: 'Diameter vs Radius', body: 'A = πD²/4 if you use diameter; A = πr² if you use radius. Mixing them up gives a 4× error.', formula: 'A = πD²/4 = πr²', note: 'Always check which one your formula uses.' },
      { title: 'V scales with 1/D², not 1/D', body: 'Halving D quarters area, so V quadruples. Velocity scales with the inverse <em>square</em> of diameter, not directly inversely.', formula: 'V₂/V₁ = (D₁/D₂)²', note: 'Cutting D to one-third gives 9× speed-up, not 3×.' },
      { title: 'Compressible Trap', body: 'If your fluid is a fast gas (Mach > 0.3), simple A·V = const doesn\'t apply. Use mass flow rate ρ·A·V instead.', formula: '', note: 'Liquids are essentially always incompressible in everyday situations.' },
      { title: 'Branches', body: 'Continuity in a single pipe: A₁V₁ = A₂V₂. With branches: A·V = sum of branch flows. Don\'t apply the simple formula across a junction.', formula: '', note: 'A T-junction breaks the simple relation — track each branch.' }
    ]
  };
  function buildExplore() {
    var cat = document.querySelector('#cat-tabs .pill.active');
    var key = cat ? cat.dataset.cat : 'basics';
    var grid = $('concept-grid'); grid.innerHTML = '';
    EXPLORE[key].forEach(function (item, idx) {
      var b = document.createElement('button');
      b.className = 'is-btn' + (idx === 0 ? ' active' : ''); b.type = 'button';
      b.innerHTML = '<span class="is-btn-name">' + item.title + '</span>' + (item.formula ? '<span class="is-btn-sym">' + item.formula + '</span>' : '');
      b.addEventListener('click', function () {
        document.querySelectorAll('#concept-grid .is-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        showConcept(item, key);
      });
      grid.appendChild(b);
    });
    showConcept(EXPLORE[key][0], key);
  }
  function showConcept(item, cat) {
    var box = $('item-info');
    var html = '<div class="ii-top"><span class="ii-name">' + item.title + '</span><span class="ii-cat-badge">' + cat + '</span></div><p class="ii-desc">' + item.body + '</p>';
    if (item.formula) html += '<div class="formula-box"><span class="fb-formula">' + item.formula + '</span></div>';
    if (item.note) html += '<div class="example-box"><h4>Key Insight</h4><p class="ex-step">' + item.note + '</p></div>';
    box.innerHTML = html;
  }

  /* Practice */
  function startPractice() { state.pp.score = 0; state.pp.total = 0; $('pbar-score-val').textContent = '0 / 0'; newPractice(); }
  function newPractice() {
    var t = ['v2', 'd2', 'q', 'v1'][Math.floor(Math.random() * 4)];
    var D1 = +(2 + Math.random() * 18).toFixed(1);
    var D2 = +(0.5 + Math.random() * (D1 - 0.5)).toFixed(1);
    var V1 = +(0.2 + Math.random() * 5).toFixed(2);
    var A1 = Math.PI * Math.pow(D1 / 200, 2);
    var A2 = Math.PI * Math.pow(D2 / 200, 2);
    var V2 = A1 / A2 * V1;
    var Q = A1 * V1;
    var ans, prompt, unit;
    if (t === 'v2') {
      ans = V2; prompt = 'A pipe narrows from D₁ = ' + D1 + ' cm (V₁ = ' + V1 + ' m/s) to D₂ = ' + D2 + ' cm. Find V₂.'; unit = 'm/s';
    } else if (t === 'd2') {
      var V2t = V1 * 4;
      ans = D1 / 2;       /* (D1/D2)² = 4 → D2 = D1/2 */
      prompt = 'A pipe narrows from D₁ = ' + D1 + ' cm so velocity quadruples (V₂ = 4·V₁). Find D₂.'; unit = 'cm';
    } else if (t === 'q') {
      ans = Q * 1000; prompt = 'A pipe with D₁ = ' + D1 + ' cm carries fluid at V₁ = ' + V1 + ' m/s. Find the volumetric flow rate Q.'; unit = 'L/s';
    } else {
      ans = V1; prompt = 'A pipe with D₁ = ' + D1 + ' cm narrows to D₂ = ' + D2 + ' cm; the narrow section has V₂ = ' + V2.toFixed(2) + ' m/s. Find V₁.'; unit = 'm/s';
    }
    state.pp.problem = { type: t, ans: ans, unit: unit };
    $('pp-prompt').textContent = prompt;
    $('pp-input').value = ''; $('pp-unit').textContent = unit;
    $('pp-feedback').textContent = ''; $('pp-feedback').className = 'feedback';
    $('pp-solution').style.display = 'none'; $('pp-next').style.display = 'none';
    $('pp-check').disabled = false; $('pp-input').focus();
  }
  function checkPractice() {
    var p = state.pp.problem; if (!p) return;
    var v = parseFloat($('pp-input').value);
    if (!isFinite(v)) { $('pp-feedback').textContent = 'Enter a number'; $('pp-feedback').className = 'feedback err'; return; }
    var tol = Math.abs(p.ans) * 0.05 + 0.01;
    state.pp.total++;
    if (Math.abs(v - p.ans) <= tol) { state.pp.score++; $('pp-feedback').textContent = '✓ Correct! ' + fmt(p.ans) + ' ' + p.unit; $('pp-feedback').className = 'feedback ok'; playSuccess(); }
    else { $('pp-feedback').textContent = '✗ Correct: ' + fmt(p.ans) + ' ' + p.unit; $('pp-feedback').className = 'feedback err'; playError(); }
    $('pbar-score-val').textContent = state.pp.score + ' / ' + state.pp.total;
    $('pp-next').style.display = ''; $('pp-check').disabled = true;
  }
  function showSolution() {
    var p = state.pp.problem; if (!p) return;
    var html = '<h4>Step-by-step solution</h4>';
    html += '<div class="sol-step">Apply A₁V₁ = A₂V₂ with A = πD²/4. Convert all D to consistent units, then solve for the unknown.</div>';
    html += '<div class="sol-step">Final answer: <strong>' + fmt(p.ans) + ' ' + p.unit + '</strong></div>';
    $('pp-solution').innerHTML = html; $('pp-solution').style.display = '';
  }

  /* Quiz */
  function buildQuizQs() {
    return [
      { q: 'A pipe narrows from D = 10 cm to D = 5 cm. By what factor does velocity increase?', opts: ['2×', '4×', '8×', '16×'], ans: 1, ex: 'V₂/V₁ = (D₁/D₂)² = (10/5)² = 4×.' },
      { q: 'Which quantity is conserved by the continuity equation?', opts: ['Velocity', 'Volumetric flow rate Q', 'Pressure', 'Temperature'], ans: 1, ex: 'Q = A·V is conserved along a single pipe.' },
      { q: 'Continuity A·V = const requires which assumption?', opts: ['Compressible', 'Steady & incompressible', 'Inviscid', 'Adiabatic'], ans: 1, ex: 'For compressible flow you need ρ·A·V = const instead.' },
      { q: 'A garden hose 1 cm diameter has a 0.5 cm nozzle. If V₁ = 1 m/s, find V₂.', opts: ['2 m/s', '4 m/s', '8 m/s', '16 m/s'], ans: 1, ex: '(1/0.5)² = 4. V₂ = 4·1 = 4 m/s.' },
      { q: 'Why does blood velocity drop in capillaries vs the aorta?', opts: ['Heart slows down', 'Total cross-sectional area is much larger', 'Blood becomes thicker', 'Capillaries are more elastic'], ans: 1, ex: 'Billions of capillaries in parallel give total area ≈ 4500 cm² >> aorta\'s 5 cm². By continuity, V drops by ~1000×.' }
    ];
  }
  function startQuiz() { state.qz.idx = 0; state.qz.answers = []; state.qz.q = buildQuizQs(); state.qz.started = true; $('quiz-result').style.display = 'none'; showQuizQ(); }
  function showQuizQ() {
    var q = state.qz.q[state.qz.idx];
    $('qbar-num').textContent = (state.qz.idx + 1);
    var html = '<p class="qp-prompt">' + q.q + '</p><div class="answer-grid">';
    q.opts.forEach(function (o, i) { html += '<button class="answer-btn" data-i="' + i + '" type="button">' + o + '</button>'; });
    html += '</div><div class="quiz-feedback" id="qz-fb" style="margin-top:10px;"></div>';
    $('quiz-panel').innerHTML = html;
    document.querySelectorAll('#quiz-panel .answer-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('locked')) return;
        var i = parseInt(b.dataset.i, 10);
        document.querySelectorAll('#quiz-panel .answer-btn').forEach(function (x) { x.classList.add('locked'); });
        if (i === q.ans) { b.classList.add('correct'); playSuccess(); }
        else { b.classList.add('wrong'); var corr = document.querySelector('#quiz-panel .answer-btn[data-i="' + q.ans + '"]'); if (corr) corr.classList.add('correct'); playError(); }
        $('qz-fb').textContent = q.ex; $('qz-fb').className = 'quiz-feedback ' + (i === q.ans ? 'ok' : 'err');
        state.qz.answers.push({ i: i, correct: i === q.ans, q: q });
        setTimeout(function () { if (state.qz.idx < state.qz.q.length - 1) { state.qz.idx++; showQuizQ(); } else { showQuizResult(); } }, 1700);
      });
    });
  }
  function showQuizResult() {
    var ok = state.qz.answers.filter(function (a) { return a.correct; }).length;
    var stars = '★'.repeat(ok) + '☆'.repeat(5 - ok);
    var verdict = ok === 5 ? 'Perfect!' : ok >= 4 ? 'Great' : ok >= 3 ? 'Solid' : ok >= 2 ? 'Keep practising' : 'Review the basics';
    var cls = ok === 5 ? 'perfect' : ok >= 3 ? 'good' : 'poor';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Results</span><span class="qr-stars">' + stars + '</span></div><div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + ok + ' / 5</div><div class="qr-verdict">' + verdict + '</div></div></div><div class="qr-rows">';
    state.qz.answers.forEach(function (a, i) { html += '<div class="qr-row ' + (a.correct ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + a.q.q + '<br><strong>' + (a.correct ? 'Correct.' : 'Correct: ' + a.q.opts[a.q.ans]) + '</strong></span><span class="qr-mark">' + (a.correct ? '✓' : '✗') + '</span></div>'; });
    html += '</div><div style="text-align:center"><button class="btn btn-primary" id="qz-retry" type="button">Try Again</button></div>';
    $('quiz-result').innerHTML = html; $('quiz-result').style.display = '';
    $('quiz-panel').style.display = 'none';
    $('qz-retry').addEventListener('click', function () { $('quiz-panel').style.display = ''; startQuiz(); });
  }

  /* Calc modal */
  function openCalc() {
    var c = compute();
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Inputs</span><div class="cs-given">';
    html += '<span>\\(D_1 = ' + (state.D1 * 100) + '\\;\\mathrm{cm}\\)</span>';
    html += '<span>\\(D_2 = ' + (state.D2 * 100) + '\\;\\mathrm{cm}\\)</span>';
    html += '<span>\\(V_1 = ' + state.V1 + '\\;\\mathrm{m/s}\\)</span>';
    html += '</div></div>';
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 1</span><span class="cs-title">Compute cross-sectional areas</span></div>';
    html += '<div class="cs-formula">\\[ A = \\dfrac{\\pi D^2}{4} \\]</div>';
    html += '<div class="cs-calc">\\(A_1 = \\dfrac{\\pi \\cdot ' + state.D1 + '^2}{4} = ' + c.A1_m2.toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2}\\)</div>';
    html += '<div class="cs-calc">\\(A_2 = \\dfrac{\\pi \\cdot ' + state.D2 + '^2}{4} = ' + c.A2_m2.toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2}\\)</div>';
    html += '<div class="cs-result">Area ratio \\(\\dfrac{A_2}{A_1} = \\mathbf{' + c.ratioA.toFixed(4) + '}\\)</div></div>';
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 2</span><span class="cs-title">Apply continuity</span></div>';
    html += '<div class="cs-formula">\\[ A_1 V_1 = A_2 V_2 \\;\\;\\Rightarrow\\;\\; V_2 = \\dfrac{A_1}{A_2} \\cdot V_1 \\]</div>';
    html += '<div class="cs-calc">\\(V_2 = ' + (c.A1_m2 / c.A2_m2).toFixed(3) + ' \\cdot ' + state.V1 + '\\)</div>';
    html += '<div class="cs-result">\\(V_2 = \\mathbf{' + c.V2.toFixed(3) + '\\;\\mathrm{m/s}}\\) — ' + c.ratioV.toFixed(2) + '× faster</div></div>';
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Volumetric flow rate</span></div>';
    html += '<div class="cs-formula">\\[ Q = A \\cdot V \\quad (\\text{constant along pipe}) \\]</div>';
    html += '<div class="cs-calc">\\(Q = ' + c.A1_m2.toExponential(3).replace('e', ' \\times 10^{') + '} \\cdot ' + state.V1 + ' = ' + c.Q_m3.toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^3/s}\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + (c.Q_m3 * 1000).toFixed(3) + '\\;\\mathrm{L/s}}\\)</div></div>';
    $('calc-modal-body').innerHTML = html;
    $('calc-modal').classList.add('active');
  }

  function exportCSV() {
    var c = compute();
    var rows = [
      ['Field','Value','Unit'],
      ['D1', state.D1 * 100, 'cm'],
      ['D2', state.D2 * 100, 'cm'],
      ['A1', c.A1_m2 * 1e4, 'cm²'],
      ['A2', c.A2_m2 * 1e4, 'cm²'],
      ['V1', state.V1, 'm/s'],
      ['V2', c.V2.toFixed(4), 'm/s'],
      ['Q', (c.Q_m3 * 1000).toFixed(4), 'L/s'],
      ['V2/V1', c.ratioV.toFixed(4), '×'],
      ['A2/A1', c.ratioA.toFixed(4), '×']
    ];
    var csv = rows.map(function (r) { return r.map(function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'continuity.csv'; a.click();
    URL.revokeObjectURL(a.href);
  }
  function exportPNG() {
    var src = canvas; var tmp = document.createElement('canvas');
    tmp.width = src.width; tmp.height = src.height;
    var tc = tmp.getContext('2d'); tc.drawImage(src, 0, 0);
    var fs = Math.max(10, Math.round(tmp.width * 0.022));
    tc.font = '600 ' + fs + 'px Segoe UI'; tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'continuity.png'; a.click();
  }
  function copyResult() {
    var c = compute();
    if (navigator.clipboard) navigator.clipboard.writeText('D₁=' + state.D1 * 100 + 'cm V₁=' + state.V1 + ' m/s → V₂=' + c.V2.toFixed(2) + ' m/s (' + c.ratioV.toFixed(2) + '× speed-up)');
  }

  function wireEvents() {
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.addEventListener('click', function () { setMode(p.dataset.mode); playClick(); }); });
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        if (state.unit === p.dataset.unit) return;
        pushHistory(); state.unit = p.dataset.unit;
        syncUnitTabs(); syncControls(); updateReadouts(); requestDraw(); playClick();
      });
    });
    $('sl-d1').addEventListener('input', function () {
      var d = parseFloat($('sl-d1').value); state.D1 = d / 100;
      $('in-d1').value = isImp() ? (d / 2.54).toFixed(2) : d.toFixed(1);
      /* Ensure D2 ≤ D1 */
      if (state.D2 > state.D1) { state.D2 = state.D1; syncControls(); }
      state.particles = []; updateReadouts(); requestDraw();
    });
    $('sl-d2').addEventListener('input', function () {
      var d = parseFloat($('sl-d2').value); state.D2 = d / 100;
      $('in-d2').value = isImp() ? (d / 2.54).toFixed(2) : d.toFixed(1);
      state.particles = []; updateReadouts(); requestDraw();
    });
    $('sl-v1').addEventListener('input', function () {
      state.V1 = parseFloat($('sl-v1').value);
      $('in-v1').value = isImp() ? (state.V1 * 3.28084).toFixed(2) : state.V1.toFixed(2);
      updateReadouts(); requestDraw();
    });
    $('in-d1').addEventListener('change', function () { var v = parseFloat($('in-d1').value); if (!isFinite(v)) return; var dcm = isImp() ? v * 2.54 : v; state.D1 = Math.min(0.30, Math.max(0.02, dcm / 100)); syncControls(); updateReadouts(); requestDraw(); });
    $('in-d2').addEventListener('change', function () { var v = parseFloat($('in-d2').value); if (!isFinite(v)) return; var dcm = isImp() ? v * 2.54 : v; state.D2 = Math.min(0.30, Math.max(0.005, dcm / 100)); syncControls(); updateReadouts(); requestDraw(); });
    $('in-v1').addEventListener('change', function () { var v = parseFloat($('in-v1').value); if (!isFinite(v)) return; state.V1 = Math.min(10, Math.max(0.1, isImp() ? v / 3.28084 : v)); syncControls(); updateReadouts(); requestDraw(); });
    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.dataset.dir, 10);
        var k = b.dataset.step;
        if (k === 'd1') state.D1 = Math.min(0.30, Math.max(0.02, state.D1 + dir * 0.005));
        if (k === 'd2') state.D2 = Math.min(state.D1, Math.max(0.005, state.D2 + dir * 0.005));
        if (k === 'v1') state.V1 = Math.min(10, Math.max(0.1, state.V1 + dir * 0.1));
        syncControls(); updateReadouts(); requestDraw(); playClick();
      });
    });
    $('chk-particles').addEventListener('change', function () { state.showParticles = $('chk-particles').checked; requestDraw(); });
    $('chk-equation').addEventListener('change', function () { state.showEquation = $('chk-equation').checked; requestDraw(); });
    $('chk-arrows').addEventListener('change', function () { state.showArrows = $('chk-arrows').checked; requestDraw(); });
    $('chk-grid').addEventListener('change', function () { state.showGrid = $('chk-grid').checked; requestDraw(); });

    $('btn-run').addEventListener('click', function () { state.running = true; $('btn-run').disabled = true; $('btn-stop').disabled = false; requestDraw(); playClick(); });
    $('btn-stop').addEventListener('click', function () { state.running = false; $('btn-run').disabled = false; $('btn-stop').disabled = true; playClick(); });
    $('btn-reset').addEventListener('click', function () { state.particles = []; requestDraw(); playClick(); });
    $('btn-undo').addEventListener('click', function () { doUndo(); playClick(); });
    $('btn-redo').addEventListener('click', function () { doRedo(); playClick(); });
    $('btn-csv').addEventListener('click', function () { exportCSV(); playClick(); });
    $('btn-png').addEventListener('click', function () { exportPNG(); playClick(); });
    $('btn-calc').addEventListener('click', function () { openCalc(); playClick(); });
    $('calc-modal-close').addEventListener('click', function () { $('calc-modal').classList.remove('active'); });
    $('calc-modal').addEventListener('click', function (e) { if (e.target === $('calc-modal')) $('calc-modal').classList.remove('active'); });

    $('learn-expand-all').addEventListener('click', function () { document.querySelectorAll('.learn-card').forEach(function (c) { c.open = true; }); playClick(); });
    $('learn-collapse-all').addEventListener('click', function () { document.querySelectorAll('.learn-card').forEach(function (c) { c.open = false; }); playClick(); });
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) { p.addEventListener('click', function () { document.querySelectorAll('#cat-tabs .pill').forEach(function (x) { x.classList.toggle('active', x === p); }); buildExplore(); playClick(); }); });

    $('pp-check').addEventListener('click', checkPractice);
    $('pp-show').addEventListener('click', showSolution);
    $('pp-next').addEventListener('click', newPractice);
    $('pp-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (!$('pp-check').disabled) checkPractice();
        else if ($('pp-next').style.display !== 'none') newPractice();
      }
    });

    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); var menu = $('ctx-menu'); menu.style.display = 'block'; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; });
    document.addEventListener('click', function () { $('ctx-menu').style.display = 'none'; });
    document.querySelectorAll('#ctx-menu .ctx-item').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.dataset.ctx;
        if (act === 'copy-result') copyResult();
        else if (act === 'csv') exportCSV();
        else if (act === 'png') exportPNG();
        else if (act === 'reset') { state.particles = []; requestDraw(); }
        $('ctx-menu').style.display = 'none';
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo(); }
    });
    window.addEventListener('resize', requestDraw);
  }

  function init() {
    rebuildPresets(); syncControls(); syncUnitTabs(); wireEvents();
    setMode('simulate');
    document.querySelectorAll('.preset-chip').forEach(function (c) { c.classList.toggle('active', c.textContent === 'Default'); });
    requestDraw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
