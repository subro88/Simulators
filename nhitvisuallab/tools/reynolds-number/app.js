/* Reynolds Number Simulator — NHIT VisualLab
   Re = ρ · v · D / μ           (dimensionless)
   Regimes for circular pipe:
     Laminar     Re < 2300
     Transitional 2300 ≤ Re ≤ 4000
     Turbulent   Re > 4000
   Critical velocity (Re = 2300):  v_crit = 2300 · μ / (ρ · D)
   Volumetric flow:                 Q = A · v = π D²/4 · v
*/
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  var FLUIDS = [
    { key: 'air',      name: 'Air (20°C)',      rho: 1.20,  mu: 1.81e-5, color: '#cfe9ff' },
    { key: 'water',    name: 'Water (20°C)',    rho: 1000,  mu: 1.0e-3,  color: '#4fc3f7' },
    { key: 'mercury',  name: 'Mercury',         rho: 13534, mu: 1.55e-3, color: '#c8c8d2' },
    { key: 'oil',      name: 'Vegetable Oil',   rho: 920,   mu: 0.084,   color: '#e6c64f' },
    { key: 'glycerin', name: 'Glycerin',        rho: 1260,  mu: 1.412,   color: '#bdd2e6' },
    { key: 'honey',    name: 'Honey (20°C)',    rho: 1420,  mu: 10.0,    color: '#d4a534' }
  ];

  var PRESETS = [
    { key: 'tap',     name: 'Tap Water',       fl: 'water',    v: 2.0,  d: 4 },
    { key: 'blood',   name: 'Blood-like (water)', fl: 'water', v: 0.5,  d: 2 },
    { key: 'pipeline',name: 'Pipeline',        fl: 'water',    v: 3.0,  d: 30 },
    { key: 'air',     name: 'Air through duct',fl: 'air',      v: 5.0,  d: 20 },
    { key: 'honey',   name: 'Honey Pour',      fl: 'honey',    v: 1.0,  d: 5 },
    { key: 'lab',     name: 'Lab tube (laminar)', fl: 'glycerin', v: 0.3, d: 1 }
  ];

  var state = {
    mode: 'simulate',
    unit: 'si',
    flKey: 'water',
    v: 2.0,        // m/s
    D_m: 0.04,     // 4 cm
    running: true,
    flowT: 0,
    showStreamlines: true, showParticles: true, showEquation: true, showGrid: false, showRegime: true,
    customFluids: [],
    pp: { problem: null, score: 0, total: 0 },
    qz: { idx: 0, q: null, answers: [], started: false },
    history: [], redoStack: [],
    audioCtx: null, raf: 0,
    particles: []
  };
  var canvas = $('sim-canvas'); var ctx = canvas.getContext('2d');

  function isImp() { return state.unit === 'imp'; }
  function uLabel(kind) {
    var imp = isImp();
    switch (kind) {
      case 'v':    return imp ? 'ft/s' : 'm/s';
      case 'len':  return imp ? 'in' : 'cm';
      case 'rho':  return imp ? 'lb/ft³' : 'kg/m³';
      case 'mu':   return imp ? 'lb/(ft·s)' : 'Pa·s';
      case 'nu':   return imp ? 'ft²/s' : 'm²/s';
      case 'q':    return imp ? 'gal/s' : 'L/s';
    }
    return '';
  }
  function toD(val, kind) {
    if (!isImp()) return val;
    switch (kind) {
      case 'v':   return val * 3.28084;
      case 'len': return val / 2.54;
      case 'rho': return val * 0.062428;
      case 'mu':  return val * 0.6720;
      case 'nu':  return val * 10.7639;
      case 'q':   return val * 0.264172;
    }
    return val;
  }
  /* Fluid names carry their reference temperature ("Water (20°C)"), which is
     as much a displayed unit as ρ or μ. */
  function fluidName(f) {
    if (!isImp()) return f.name;
    return f.name.replace(/\((-?\d+(?:\.\d+)?)\s*°C\)/g, function (_, c) {
      return '(' + Math.round(+c * 9 / 5 + 32) + '°F)';
    });
  }
  function fmt(v, dp) {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 100000 || (a > 0 && a < 0.001)) return v.toExponential(2);
    if (a >= 100) return v.toFixed(0);
    if (dp == null) dp = a >= 10 ? 1 : a >= 1 ? 2 : 3;
    return v.toFixed(dp);
  }
  function getFluid() {
    var all = FLUIDS.concat(state.customFluids);
    for (var i = 0; i < all.length; i++) if (all[i].key === state.flKey) return all[i];
    return FLUIDS[1];
  }
  function compute() {
    var fl = getFluid();
    var Re = fl.rho * state.v * state.D_m / fl.mu;
    var nu = fl.mu / fl.rho;
    var A = Math.PI * Math.pow(state.D_m / 2, 2);
    var Q = A * state.v;
    var vCrit = 2300 * fl.mu / (fl.rho * state.D_m);
    var regime, regimeColor;
    if (Re < 2300) { regime = 'Laminar'; regimeColor = '#3ddc84'; }
    else if (Re <= 4000) { regime = 'Transitional'; regimeColor = '#f5c842'; }
    else { regime = 'Turbulent'; regimeColor = '#ff5555'; }
    /* Darcy friction factor */
    var f;
    if (Re < 2300) f = 64 / Math.max(Re, 1);
    else f = 0.316 / Math.pow(Re, 0.25);  // Blasius (smooth pipe, Re < 1e5)
    return { fl: fl, Re: Re, nu: nu, A: A, Q: Q, vCrit: vCrit, regime: regime, regimeColor: regimeColor, f: f };
  }

  /* Audio */
  function getAudio() { if (!state.audioCtx) try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } return state.audioCtx; }
  function playTone(f, d, t, v) { var ac = getAudio(); if (!ac) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = t || 'sine'; o.frequency.value = f; g.gain.value = v || 0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d); o.stop(ac.currentTime + d + 0.02); }
  function playClick() { playTone(700, 0.04, 'square', 0.04); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.08); setTimeout(function(){ playTone(1320, 0.16, 'sine', 0.08); }, 110); }
  function playError() { playTone(220, 0.22, 'sawtooth', 0.05); }

  /* ── Particles for flow visualization ───────────────────── */
  function spawnParticle(pipeY, pipeH, c) {
    var p = {
      x: -8,
      y: pipeY + pipeH / 2 + (Math.random() - 0.5) * pipeH * 0.85,
      baseY: 0,
      vy: 0,
      life: 0
    };
    p.baseY = p.y;
    state.particles.push(p);
  }

  function updateParticles(W, pipeY, pipeH, c) {
    /* Spawn rate proportional to velocity */
    var spawnRate = Math.min(6, Math.max(1, state.v * 1.5));
    var nSpawn = Math.floor(spawnRate);
    if (Math.random() < (spawnRate - nSpawn)) nSpawn++;
    for (var i = 0; i < nSpawn; i++) spawnParticle(pipeY, pipeH, c);
    /* Limit total — drop newest (back of array) so leading particles still reach the pipe end */
    if (state.particles.length > 800) state.particles.length = 800;

    /* Velocity scale for animation */
    var vis_v = Math.min(8, Math.max(1, state.v * 1.6));   // px per frame
    var Re = c.Re;
    /* Turbulence strength 0..1 based on Re (smooth blend through transition) */
    var turb;
    if (Re < 1500) turb = 0;
    else if (Re < 2300) turb = (Re - 1500) / 800 * 0.2;
    else if (Re < 4000) turb = 0.2 + (Re - 2300) / 1700 * 0.6;
    else turb = Math.min(1, 0.8 + (Re - 4000) / 6000 * 0.2);

    for (var j = state.particles.length - 1; j >= 0; j--) {
      var p = state.particles[j];
      p.x += vis_v;
      /* Profile: laminar = no transverse motion (streamlines), turbulent = strong transverse jiggle */
      if (turb > 0.01) {
        p.vy += (Math.random() - 0.5) * turb * 1.6;
        p.vy *= 0.92;
        p.y += p.vy;
        /* Bound within pipe */
        var top = pipeY + 4, bot = pipeY + pipeH - 4;
        if (p.y < top) { p.y = top; p.vy = Math.abs(p.vy) * 0.5; }
        if (p.y > bot) { p.y = bot; p.vy = -Math.abs(p.vy) * 0.5; }
      } else {
        /* Pure laminar — also apply parabolic profile (faster centre) */
      }
      p.life++;
      if (p.x > W + 10) state.particles.splice(j, 1);
    }
  }

  function drawParticles(c, pipeX, pipeY, pipeW, pipeH) {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      ctx.fillStyle = c.regimeColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      /* Trail */
      ctx.fillStyle = c.regimeColor + '55';
      ctx.beginPath();
      ctx.arc(p.x - 4, p.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ── Streamlines (laminar parabolic profile arrows) ─────── */
  function drawStreamlines(c, pipeX, pipeY, pipeW, pipeH) {
    var Re = c.Re;
    var fade = Re < 2300 ? 1 : Re < 4000 ? (4000 - Re) / 1700 : 0;
    if (fade <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.strokeStyle = c.fl.color;
    ctx.lineWidth = 1.5;
    var n = 7;
    for (var i = 1; i < n; i++) {
      var y = pipeY + (i / n) * pipeH;
      var prof = 1 - Math.pow(2 * (i - n / 2) / n, 2);   // parabolic
      ctx.globalAlpha = fade * (0.4 + 0.6 * prof);
      ctx.beginPath();
      ctx.moveTo(pipeX + 4, y);
      ctx.lineTo(pipeX + pipeW - 4, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── Regime gauge ───────────────────────────────────────── */
  function drawRegimeGauge(W, c) {
    var bx = W - 200, by = 8, bw = 190, bh = 50;
    ctx.fillStyle = 'rgba(13,17,30,0.7)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = c.regimeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = c.regimeColor;
    ctx.font = '700 14px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(c.regime.toUpperCase(), bx + 10, by + 22);
    ctx.fillStyle = '#dde3f0';
    ctx.font = '600 11px Courier New, monospace';
    ctx.fillText('Re = ' + fmt(c.Re), bx + 10, by + 42);

    /* Re scale bar */
    var sx = bx, sy = by + bh + 6, sw = bw, sh = 5;
    ctx.fillStyle = '#3ddc84';
    ctx.fillRect(sx, sy, sw * 0.32, sh);
    ctx.fillStyle = '#f5c842';
    ctx.fillRect(sx + sw * 0.32, sy, sw * 0.07, sh);
    ctx.fillStyle = '#ff5555';
    ctx.fillRect(sx + sw * 0.39, sy, sw * 0.61, sh);
    /* Marker */
    var rePos = Math.min(1, Math.log(Math.max(c.Re, 1)) / Math.log(1e5));
    ctx.fillStyle = '#fff';
    ctx.fillRect(sx + sw * rePos - 2, sy - 2, 4, sh + 4);
    /* Labels */
    ctx.fillStyle = '#8b9dc3';
    ctx.font = '600 9px Courier New, monospace';
    ctx.fillText('1', sx, sy + 16);
    ctx.fillText('2300', sx + sw * 0.32 - 14, sy + 16);
    ctx.fillText('4k', sx + sw * 0.39 - 4, sy + 16);
    ctx.fillText('100k', sx + sw - 22, sy + 16);
  }

  /* ── Equation overlay (bottom-left to avoid canvas toggles) ─ */
  function drawEquation(W, H, c) {
    var bw = 220, bh = 50;
    var bx = 8, by = H - bh - 8;
    ctx.fillStyle = 'rgba(13,17,30,0.78)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(3,155,229,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#7fdbff';
    ctx.font = '700 12px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Re = ρ · v · D / μ', bx + 10, by + 20);
    ctx.fillStyle = '#dde3f0';
    ctx.font = '600 11px Courier New, monospace';
    ctx.fillText('= ' + fmt(c.Re), bx + 10, by + 40);
  }

  /* ── Canvas drawing ─────────────────────────────────────── */
  function sizeCanvas() {
    var W = canvas.parentElement.clientWidth - 16;
    var H = Math.max(360, Math.min(W * 0.55, 460));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W: W, H: H };
  }

  function draw() {
    var dim = sizeCanvas();
    var W = dim.W, H = dim.H;
    var c = compute();

    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, W, H);
    if (state.showGrid) drawGrid(W, H);

    /* Pipe horizontal in middle */
    var pipeW = W - 60, pipeX = 30;
    var pipeH = Math.min(140, Math.max(50, state.D_m * 800));   /* visual D */
    var pipeY = (H - pipeH) / 2 + 20;

    /* Pipe walls */
    ctx.strokeStyle = '#7ec8e3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pipeX, pipeY); ctx.lineTo(pipeX + pipeW, pipeY);
    ctx.moveTo(pipeX, pipeY + pipeH); ctx.lineTo(pipeX + pipeW, pipeY + pipeH);
    ctx.stroke();

    /* Fluid background */
    ctx.fillStyle = c.fl.color + '33';
    ctx.fillRect(pipeX, pipeY, pipeW, pipeH);

    /* Streamlines (visible at low Re) */
    if (state.showStreamlines) drawStreamlines(c, pipeX, pipeY, pipeW, pipeH);

    /* Particles */
    if (state.running) updateParticles(W, pipeY, pipeH, c);
    if (state.showParticles) drawParticles(c, pipeX, pipeY, pipeW, pipeH);

    /* Pipe end labels */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 11px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('IN', pipeX + 4, pipeY - 8);
    ctx.textAlign = 'right';
    ctx.fillText('OUT', pipeX + pipeW - 4, pipeY - 8);

    /* Diameter label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 11px Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('D = ' + fmt(state.D_m * 100) + ' ' + uLabel('len'), pipeX - 4, pipeY + pipeH / 2 + 4);
    /* Velocity label inside pipe */
    ctx.fillStyle = '#fff';
    ctx.font = '700 12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    drawHaloText('v = ' + fmt(toD(state.v, 'v')) + ' ' + uLabel('v'), pipeX + pipeW / 2, pipeY + pipeH + 22, '#fff', 11, 'center');
    drawHaloText(fluidName(c.fl) + '  ρ = ' + fmt(toD(c.fl.rho, 'rho')) + ' ' + uLabel('rho') + '  μ = ' + toD(c.fl.mu, 'mu').toExponential(2) + ' ' + uLabel('mu'), pipeX + pipeW / 2, pipeY + pipeH + 42, '#dde3f0', 10, 'center');

    /* Equation + regime gauge */
    if (state.showEquation) drawEquation(W, H, c);
    if (state.showRegime) drawRegimeGauge(W, c);

    if (state.running) requestDraw();
  }

  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(139,157,195,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
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

  function requestDraw() {
    if (state.raf) return;
    state.raf = requestAnimationFrame(function () { state.raf = 0; draw(); updateReadouts(); });
  }

  /* ── Readouts ───────────────────────────────────────────── */
  function updateReadouts() {
    var c = compute();
    $('r-re').textContent = fmt(c.Re);
    $('r-regime').textContent = c.regime;
    $('r-regime').style.color = c.regimeColor;
    $('r-rho').textContent = fmt(toD(c.fl.rho, 'rho'));
    /* Both viscosities had their unit CAPTION converted but not their value,
       which is worse than leaving them SI — a Pa·s number labelled lb/(ft·s). */
    $('r-mu').textContent = toD(c.fl.mu, 'mu').toExponential(2);
    $('r-nu').textContent = toD(c.nu, 'nu').toExponential(2);
    $('r-q').textContent = fmt(toD(c.Q * 1000, 'q'));    /* m³/s → L/s ; *1000 */
    $('r-vcrit').textContent = fmt(toD(c.vCrit, 'v'));
    $('r-f').textContent = c.f.toFixed(4);

    $('r-unit-rho').textContent = ' ' + uLabel('rho');
    $('r-unit-mu').textContent = ' ' + uLabel('mu');
    $('r-unit-nu').textContent = ' ' + uLabel('nu');
    $('r-unit-q').textContent = ' ' + uLabel('q');
    $('r-unit-vcrit').textContent = ' ' + uLabel('v');
    $('badge-v').textContent = uLabel('v');
    $('badge-d').textContent = uLabel('len');

    var badges = $('readout-badges');
    if (badges) badges.style.display = state.mode === 'simulate' ? '' : 'none';
    $('rb-re').textContent = fmt(c.Re);
    $('rb-regime').textContent = c.regime;
    $('rb-rdot').style.background = c.regimeColor;
    $('rb-v').textContent = fmt(toD(state.v, 'v'));
    $('rb-d').textContent = fmt(toD(state.D_m * 100, 'len'));
    $('rb-v-u').textContent = uLabel('v');
    $('rb-d-u').textContent = uLabel('len');

    updateLearnPanels(c);
  }

  var _learnCache = { eq: '', cmp: '', co: '' };
  function updateLearnPanels(c) {
    var eq = $('lp-eq-body'); if (!eq) return;
    var html = '';
    html += '<div class="eq-line">\\[ Re = \\dfrac{\\rho \\cdot v \\cdot D}{\\mu} \\]</div>';
    html += '<div class="eq-line">\\(Re = \\dfrac{' + c.fl.rho + ' \\cdot ' + state.v + ' \\cdot ' + state.D_m + '}{' + c.fl.mu.toExponential(2).replace('e', ' \\times 10^{') + '}} = \\mathbf{' + fmt(c.Re) + '}\\) → <b style="color:' + c.regimeColor + '">' + c.regime + '</b></div>';
    html += '<div class="eq-line">\\(\\nu = \\dfrac{\\mu}{\\rho} = ' + c.nu.toExponential(2).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2/s}\\) — kinematic viscosity</div>';
    html += '<div class="eq-line">\\(v_{\\text{crit}} = \\dfrac{2300\\,\\mu}{\\rho \\cdot D} = ' + c.vCrit.toFixed(4) + '\\;\\mathrm{m/s}\\) — laminar/turbulent boundary</div>';
    html += '<div class="eq-line">\\(Q = A \\cdot v = \\dfrac{\\pi D^2}{4} \\cdot v = ' + (c.Q * 1000).toFixed(3) + '\\;\\mathrm{L/s}\\)</div>';
    var fForm = c.Re < 2300 ? '\\dfrac{64}{Re}' : '\\dfrac{0.316}{Re^{0.25}}';
    html += '<div class="eq-line">Friction: \\(f = ' + fForm + ' = \\mathbf{' + c.f.toFixed(4) + '}\\)</div>';
    if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }

    var cmp = $('lp-cmp-body');
    if (cmp) {
      var rows = '<table class="cmp-table"><thead><tr><th>Fluid</th><th>μ (Pa·s)</th><th>Re (current v,D)</th><th>Regime</th></tr></thead><tbody>';
      for (var i = 0; i < FLUIDS.length; i++) {
        var f = FLUIDS[i];
        var Re = f.rho * state.v * state.D_m / f.mu;
        var reg = Re < 2300 ? 'Laminar' : Re <= 4000 ? 'Transitional' : 'Turbulent';
        var cls = Re < 2300 ? 'cmp-float' : Re > 4000 ? 'cmp-sink' : '';
        rows += '<tr><td>' + f.name + '</td><td>' + f.mu.toExponential(1) + '</td>'
              + '<td>' + fmt(Re) + '</td>'
              + '<td class="' + cls + '">' + reg + '</td></tr>';
      }
      rows += '</tbody></table>';
      if (rows !== _learnCache.cmp) { cmp.innerHTML = rows; _learnCache.cmp = rows; }
    }

    var co = $('lp-coach-body');
    if (co) {
      var tips = [];
      if (c.Re < 2300) {
        tips.push('Re = ' + fmt(c.Re) + ' < 2300 → laminar. Particles trace smooth parallel streamlines. To make this turbulent: increase v, increase D, or switch to a less-viscous fluid.');
        tips.push('Critical velocity for transition: v_crit = ' + c.vCrit.toFixed(3) + ' m/s. Currently v = ' + state.v + ' m/s → ' + (state.v < c.vCrit ? 'below' : 'above') + ' threshold.');
      } else if (c.Re < 4000) {
        tips.push('Re = ' + fmt(c.Re) + ' is in the transitional band (2300–4000). Flow is intermittent — sometimes laminar, sometimes turbulent. Engineers usually avoid this range.');
      } else {
        tips.push('Re = ' + fmt(c.Re) + ' > 4000 → turbulent. Particles chaotically mix with eddies. Reducing v below ' + c.vCrit.toFixed(3) + ' m/s would make it laminar.');
        tips.push('Turbulent flow has higher friction loss but better heat & mass transfer than laminar.');
      }
      tips.push('Doubling v doubles Re. Doubling D doubles Re. Multiplying μ by 10 divides Re by 10.');
      var html2 = '<ul class="coach-list">';
      for (var k = 0; k < tips.length; k++) html2 += '<li>' + tips[k] + '</li>';
      html2 += '</ul>';
      if (html2 !== _learnCache.co) { co.innerHTML = html2; _learnCache.co = html2; }
    }
  }

  function rebuildSelectors() {
    var sf = $('sel-fluid'); sf.innerHTML = '';
    var all = FLUIDS.concat(state.customFluids);
    for (var i = 0; i < all.length; i++) {
      var f = all[i];
      var op = document.createElement('option');
      op.value = f.key;
      op.textContent = f.name + ' (μ = ' + f.mu.toExponential(1) + ' Pa·s)';
      sf.appendChild(op);
    }
    sf.value = state.flKey;
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
    state.flKey = p.fl; state.v = p.v; state.D_m = p.d / 100;
    state.particles = [];
    syncControls(); updateReadouts(); requestDraw();
    document.querySelectorAll('.preset-chip').forEach(function (c) { c.classList.toggle('active', c.textContent === p.name); });
  }
  function syncControls() {
    $('sel-fluid').value = state.flKey;
    $('sl-v').value = state.v;
    $('in-v').value = isImp() ? (state.v * 3.28084).toFixed(2) : state.v.toFixed(2);
    var D_cm = state.D_m * 100;
    $('sl-d').value = D_cm;
    $('in-d').value = isImp() ? (D_cm / 2.54).toFixed(2) : D_cm.toFixed(1);
  }

  function snapshot() { return { flKey: state.flKey, v: state.v, D_m: state.D_m, unit: state.unit }; }
  function pushHistory() { state.history.push(snapshot()); if (state.history.length > 30) state.history.shift(); state.redoStack = []; }
  function applySnap(s) { state.flKey = s.flKey; state.v = s.v; state.D_m = s.D_m; state.unit = s.unit; syncUnitTabs(); rebuildSelectors(); syncControls(); updateReadouts(); requestDraw(); }
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
      { title: 'What is Reynolds Number?', body: 'A dimensionless ratio of inertial forces to viscous forces. It tells you whether momentum or viscosity dominates the flow. Big Re → momentum wins → turbulent. Small Re → viscosity wins → laminar.', formula: 'Re = ρvD/μ', note: 'Named after Osborne Reynolds, who in 1883 first observed dye filaments transitioning from straight (laminar) to chaotic (turbulent) in a glass tube.' },
      { title: 'Laminar Flow', body: 'Fluid moves in smooth parallel layers — particles never cross between layers. The velocity profile is parabolic: maximum at the centre, zero at the wall.', formula: 'Re < 2300 (pipe)', note: 'Laminar flow has low friction and excellent predictability. Dye injected stays as a thin filament.' },
      { title: 'Turbulent Flow', body: 'Chaotic, unsteady, with eddies and swirls. Velocity profile is flatter (more uniform across cross-section). Very efficient mixing.', formula: 'Re > 4000 (pipe)', note: 'Turbulent flow has higher friction loss but ~10× better heat transfer than laminar.' },
      { title: 'The Transitional Range', body: 'For 2300 < Re < 4000, flow is intermittent — patches of laminar and turbulent coexist. Engineers usually design pipes to avoid this band, picking either solidly laminar or solidly turbulent.', formula: '', note: 'Roughness and inlet disturbances strongly influence the actual transition point.' }
    ],
    formulas: [
      { title: 'Reynolds Number', body: 'The fundamental equation. ρ in kg/m³, v in m/s, D in m, μ in Pa·s — and Re comes out dimensionless. The same number applies whether you compute it in SI, imperial, or Gaussian units.', formula: 'Re = ρvD/μ', note: 'Water at 1 m/s in a 10 cm pipe: Re = 1000·1·0.1/0.001 = 100 000 (deeply turbulent).' },
      { title: 'Kinematic Viscosity', body: 'Sometimes Re is written as Re = vD/ν where ν = μ/ρ is kinematic viscosity. This separates the geometry/velocity (vD) from the fluid property (ν).', formula: 'ν = μ/ρ  →  Re = vD/ν', note: 'Water has ν = 1×10⁻⁶ m²/s. Air has ν = 1.5×10⁻⁵ m²/s — air is actually more viscous than water by this measure!' },
      { title: 'Critical Velocity', body: 'For a given fluid and pipe diameter, the velocity at which Re = 2300. Below v_crit the flow is laminar.', formula: 'v_crit = 2300·μ / (ρ·D)', note: 'Water in 1 cm pipe: v_crit = 0.23 m/s. Most household water flows are above this — i.e. turbulent.' },
      { title: 'Friction Factor', body: 'The Darcy friction factor relates pressure drop to flow. For laminar pipe flow, f = 64/Re exactly. For turbulent, f ≈ 0.316/Re^0.25 (Blasius) for smooth pipes.', formula: 'Δp = f·(L/D)·(½ρv²)', note: 'Doubling Re from 1000 to 2000 halves f in laminar. In turbulent, f drops only slightly.' }
    ],
    applications: [
      { title: 'Pipelines', body: 'Oil and water pipelines run at Re of 10⁴ to 10⁷ — fully turbulent. The high friction is paid for in pumping cost, but turbulent flow ensures mixing of any chemicals or temperature differences.', formula: '', note: 'A 1 m diameter oil pipeline at 2 m/s: Re ≈ 2×10⁴ even with viscous oil — turbulent.' },
      { title: 'Blood Flow', body: 'In the human aorta (D ≈ 2.5 cm) at peak systole (v ≈ 1 m/s), Re ≈ 4000 — top of the transitional range. In capillaries (D ≈ 8 μm) Re ≈ 0.001 — perfectly laminar.', formula: '', note: 'Murmurs, bruits, and stenosis-related sounds happen when normally-laminar flow becomes turbulent due to plaque or constriction.' },
      { title: 'Aircraft Wings', body: 'Re based on chord length (~1 m) and cruise speed (~250 m/s) gives Re ≈ 10⁷. The boundary layer transitions from laminar (front of wing) to turbulent (rear). Designers tune the transition for minimum drag.', formula: '', note: 'Insects fly at Re ~ 100; airliners at Re ~ 10⁷; whales swim at Re ~ 10⁸. Each scale needs different design.' },
      { title: 'Microfluidics', body: 'Lab-on-chip channels are 10–100 μm. Even at high speeds, Re < 1. Mixing two streams is a major design challenge — engineers use serpentine channels, herringbone grooves, or chaotic geometries to force mixing.', formula: '', note: 'Microfluidic mixing is a hot research area precisely because turbulence is unavailable.' }
    ],
    errors: [
      { title: 'Unit Trap (Diameter)', body: 'D must be in metres, not cm or mm. A common mistake is plugging D in cm and getting Re 100× too small.', formula: 'D in m, not cm', note: '10 cm = 0.10 m. 1 mm = 0.001 m.' },
      { title: 'μ vs ν', body: 'Don\'t confuse dynamic viscosity μ (Pa·s) with kinematic viscosity ν (m²/s). They are related by ν = μ/ρ. The formula uses one or the other, never both.', formula: 'Re = ρvD/μ = vD/ν', note: 'If your textbook uses ν, divide vD by ν directly. If μ, you need ρ as well.' },
      { title: 'Re = 2300 is for Pipes Only', body: 'The 2300 threshold applies to fully-developed flow in a smooth circular pipe. For flow over a flat plate, transition is at Re_x ≈ 5×10⁵. For open channels, ~500.', formula: '', note: 'The "characteristic length" also changes: pipe diameter, plate length, hydraulic diameter, etc.' },
      { title: 'Turbulent ≠ Bad', body: 'Turbulence has higher friction, but it also gives much better heat and mass transfer. Heat exchangers, combustion chambers, and chemical reactors are deliberately designed for turbulent flow.', formula: '', note: 'Laminar flow in a heat exchanger would be 10× less effective.' }
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
    var types = ['re', 'regime', 'vcrit', 'velocity'];
    var t = types[Math.floor(Math.random() * types.length)];
    var f = FLUIDS[Math.floor(Math.random() * (FLUIDS.length - 1))];   // exclude honey often
    var v = (0.1 + Math.random() * 4).toFixed(2) - 0;
    var D = (1 + Math.random() * 19).toFixed(1) - 0;
    var ans, prompt, unit;
    if (t === 're') {
      ans = f.rho * v * (D / 100) / f.mu;
      prompt = 'Compute the Reynolds number for ' + f.name + ' flowing at v = ' + v + ' m/s through a pipe of diameter D = ' + D + ' cm.';
      unit = '';
    } else if (t === 'regime') {
      ans = f.rho * v * (D / 100) / f.mu;
      var reg = ans < 2300 ? 'Laminar' : ans <= 4000 ? 'Transitional' : 'Turbulent';
      prompt = '(Conceptual) ' + f.name + ' at v = ' + v + ' m/s, D = ' + D + ' cm. Re = ' + ans.toFixed(0) + '. What flow regime?\nEnter 1 for Laminar, 2 for Transitional, 3 for Turbulent.';
      unit = '(1/2/3)';
      ans = reg === 'Laminar' ? 1 : reg === 'Transitional' ? 2 : 3;
    } else if (t === 'vcrit') {
      ans = 2300 * f.mu / (f.rho * (D / 100));
      prompt = 'Find the critical velocity (Re = 2300) for ' + f.name + ' in a pipe of diameter D = ' + D + ' cm.';
      unit = 'm/s';
    } else {
      var Re_target = 5000;
      ans = Re_target * f.mu / (f.rho * (D / 100));
      prompt = 'What velocity gives Re = 5000 for ' + f.name + ' in a D = ' + D + ' cm pipe?';
      unit = 'm/s';
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
    var tol = p.type === 'regime' ? 0 : Math.abs(p.ans) * 0.05 + 0.001;
    state.pp.total++;
    var correct = p.type === 'regime' ? Math.round(v) === Math.round(p.ans) : Math.abs(v - p.ans) <= tol;
    if (correct) { state.pp.score++; $('pp-feedback').textContent = '✓ Correct!'; $('pp-feedback').className = 'feedback ok'; playSuccess(); }
    else { $('pp-feedback').textContent = '✗ Correct answer: ' + fmt(p.ans) + ' ' + p.unit; $('pp-feedback').className = 'feedback err'; playError(); }
    $('pbar-score-val').textContent = state.pp.score + ' / ' + state.pp.total;
    $('pp-next').style.display = ''; $('pp-check').disabled = true;
  }
  function showSolution() {
    var p = state.pp.problem; if (!p) return;
    var html = '<h4>Step-by-step solution</h4>';
    html += '<div class="sol-step">Apply Re = ρ·v·D/μ. Convert D to m. Read ρ and μ from the fluid table.</div>';
    html += '<div class="sol-step">Final answer: <strong>' + fmt(p.ans) + ' ' + p.unit + '</strong></div>';
    $('pp-solution').innerHTML = html; $('pp-solution').style.display = '';
  }

  /* Quiz */
  function buildQuizQs() {
    return [
      { q: 'For pipe flow, what Reynolds number range is laminar?', opts: ['Re < 2300', 'Re < 100', 'Re > 2300', 'Re > 10 000'], ans: 0, ex: 'Laminar pipe flow: Re < 2300. Above 4000 it is turbulent.' },
      { q: 'Water at 2 m/s in a 5 cm pipe (ρ=1000, μ=10⁻³). Find Re.', opts: ['10', '1000', '100 000', '10 000 000'], ans: 2, ex: 'Re = 1000 · 2 · 0.05 / 0.001 = 100 000.' },
      { q: 'Doubling pipe diameter while keeping velocity constant has what effect on Re?', opts: ['Halves Re', 'Doubles Re', 'No change', 'Quadruples Re'], ans: 1, ex: 'Re = ρvD/μ. Re ∝ D, so doubling D doubles Re.' },
      { q: 'Why does honey almost always flow laminar?', opts: ['Low density', 'Very high viscosity', 'High surface tension', 'It does not flow'], ans: 1, ex: 'Honey has μ ≈ 10 Pa·s — 10 000× water. Re becomes tiny even at high v.' },
      { q: 'Which is true of turbulent flow vs laminar?', opts: ['Lower friction', 'Better mixing', 'Smoother streamlines', 'Lower heat transfer'], ans: 1, ex: 'Turbulent flow has higher friction but much better mixing and heat/mass transfer.' }
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
    var verdict = ok === 5 ? 'Perfect!' : ok >= 4 ? 'Great work' : ok >= 3 ? 'Solid' : ok >= 2 ? 'Keep practising' : 'Review the basics';
    var cls = ok === 5 ? 'perfect' : ok >= 3 ? 'good' : 'poor';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Results</span><span class="qr-stars">' + stars + '</span></div><div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + ok + ' / 5</div><div class="qr-verdict">' + verdict + '</div></div></div><div class="qr-rows">';
    state.qz.answers.forEach(function (a, i) { html += '<div class="qr-row ' + (a.correct ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + a.q.q + '<br><strong>' + (a.correct ? 'Correct.' : 'Correct: ' + a.q.opts[a.q.ans]) + '</strong></span><span class="qr-mark">' + (a.correct ? '✓' : '✗') + '</span></div>'; });
    html += '</div><div style="text-align:center"><button class="btn btn-primary" id="qz-retry" type="button">Try Again</button></div>';
    $('quiz-result').innerHTML = html; $('quiz-result').style.display = '';
    $('quiz-panel').style.display = 'none';
    $('qz-retry').addEventListener('click', function () { $('quiz-panel').style.display = ''; startQuiz(); });
  }

  /* Custom modal */
  function openCM() { $('cust-modal').classList.add('active'); $('cm-name').value = ''; $('cm-rho').value = ''; $('cm-mu').value = ''; $('cm-err').style.display = 'none'; setTimeout(function () { $('cm-name').focus(); }, 30); }
  function closeCM() { $('cust-modal').classList.remove('active'); }
  function addCustom() {
    var name = ($('cm-name').value || '').trim();
    var rho = parseFloat($('cm-rho').value);
    var mu  = parseFloat($('cm-mu').value);
    if (!name) return cmErr('Enter a name.');
    if (!isFinite(rho) || rho < 100 || rho > 15000) return cmErr('Density must be 100–15 000 kg/m³.');
    if (!isFinite(mu)  || mu  < 1e-6 || mu > 100) return cmErr('Viscosity must be 1e-6 to 100 Pa·s.');
    var key = 'custom_' + Date.now();
    state.customFluids.push({ key: key, name: name, rho: rho, mu: mu, color: '#9aa0d4' });
    state.flKey = key;
    rebuildSelectors(); syncControls(); updateReadouts(); requestDraw(); closeCM();
  }
  function cmErr(msg) { $('cm-err').textContent = msg; $('cm-err').style.display = ''; playError(); }

  /* Calc modal */
  function openCalc() {
    var c = compute();
    var html = '<div class="cs-inputs"><span class="cs-badge">Inputs</span><div class="cs-given">';
    html += '<span>Fluid: ' + c.fl.name + '</span>';
    html += '<span>\\(\\rho = ' + c.fl.rho + '\\;\\mathrm{kg/m^3}\\)</span>';
    html += '<span>\\(\\mu = ' + c.fl.mu.toExponential(2).replace('e', ' \\times 10^{') + '}\\;\\mathrm{Pa \\cdot s}\\)</span>';
    html += '<span>\\(v = ' + state.v + '\\;\\mathrm{m/s}\\)</span>';
    html += '<span>\\(D = ' + (state.D_m * 100) + '\\;\\mathrm{cm} = ' + state.D_m + '\\;\\mathrm{m}\\)</span>';
    html += '</div><p class="cs-si-note">All in SI base units.</p></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 1</span><span class="cs-title">Apply Reynolds formula</span></div>';
    html += '<div class="cs-formula">\\[ Re = \\dfrac{\\rho \\cdot v \\cdot D}{\\mu} \\]</div>';
    html += '<div class="cs-calc">\\(Re = \\dfrac{' + c.fl.rho + ' \\cdot ' + state.v + ' \\cdot ' + state.D_m + '}{' + c.fl.mu + '}\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + fmt(c.Re) + '}\\)</div></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 2</span><span class="cs-title">Identify flow regime</span></div>';
    html += '<div class="cs-formula">\\[ \\begin{cases} Re < 2300 & \\text{laminar} \\\\ 2300 \\le Re \\le 4000 & \\text{transitional} \\\\ Re > 4000 & \\text{turbulent} \\end{cases} \\]</div>';
    html += '<div class="cs-result">→ <strong style="color:' + c.regimeColor + '">' + c.regime + '</strong></div></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Critical velocity</span></div>';
    html += '<div class="cs-formula">\\[ v_{\\text{crit}} = \\dfrac{2300 \\cdot \\mu}{\\rho \\cdot D} \\]</div>';
    html += '<div class="cs-calc">\\(v_{\\text{crit}} = \\dfrac{2300 \\cdot ' + c.fl.mu + '}{' + c.fl.rho + ' \\cdot ' + state.D_m + '}\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + c.vCrit.toFixed(4) + '\\;\\mathrm{m/s}}\\)</div></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 4</span><span class="cs-title">Volumetric flow rate</span></div>';
    html += '<div class="cs-formula">\\[ Q = A \\cdot v = \\dfrac{\\pi D^2}{4} \\cdot v \\]</div>';
    html += '<div class="cs-calc">\\(A = \\dfrac{\\pi \\cdot ' + state.D_m + '^2}{4} = ' + c.A.toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2}\\)</div>';
    html += '<div class="cs-result">\\(Q = A \\cdot v = \\mathbf{' + (c.Q * 1000).toFixed(3) + '\\;\\mathrm{L/s}}\\)</div></div>';

    $('calc-modal-body').innerHTML = html;
    $('calc-modal').classList.add('active');
  }

  function exportCSV() {
    var c = compute();
    var rows = [
      ['Field','Value','Unit'],
      ['Fluid', c.fl.name, ''],
      ['Density', c.fl.rho, 'kg/m³'],
      ['Viscosity μ', c.fl.mu, 'Pa·s'],
      ['Kinematic ν', c.nu.toExponential(3), 'm²/s'],
      ['Velocity', state.v, 'm/s'],
      ['Diameter', state.D_m * 100, 'cm'],
      ['Re', c.Re.toFixed(2), ''],
      ['Regime', c.regime, ''],
      ['Critical v (Re=2300)', c.vCrit.toFixed(4), 'm/s'],
      ['Q', (c.Q * 1000).toFixed(4), 'L/s'],
      ['Friction factor f', c.f.toFixed(5), '']
    ];
    var csv = rows.map(function (r) { return r.map(function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'reynolds_' + c.fl.key + '.csv'; a.click();
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
    var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'reynolds.png'; a.click();
  }
  function copyResult() {
    var c = compute();
    var s = c.fl.name + ' v=' + state.v + ' m/s D=' + (state.D_m * 100) + ' cm → Re=' + fmt(c.Re) + ' (' + c.regime + ')';
    if (navigator.clipboard) navigator.clipboard.writeText(s);
  }

  /* Wire events */
  function wireEvents() {
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.addEventListener('click', function () { setMode(p.dataset.mode); playClick(); }); });
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        if (state.unit === p.dataset.unit) return;
        pushHistory(); state.unit = p.dataset.unit;
        syncUnitTabs(); rebuildSelectors(); syncControls(); updateReadouts(); requestDraw(); playClick();
      });
    });
    $('sel-fluid').addEventListener('change', function () { pushHistory(); state.flKey = $('sel-fluid').value; state.particles = []; updateReadouts(); requestDraw(); });
    $('sl-v').addEventListener('input', function () {
      state.v = parseFloat($('sl-v').value);
      $('in-v').value = isImp() ? (state.v * 3.28084).toFixed(2) : state.v.toFixed(2);
      updateReadouts(); requestDraw();
    });
    $('sl-d').addEventListener('input', function () {
      var D_cm = parseFloat($('sl-d').value);
      state.D_m = D_cm / 100;
      $('in-d').value = isImp() ? (D_cm / 2.54).toFixed(2) : D_cm.toFixed(1);
      updateReadouts(); requestDraw();
    });
    $('in-v').addEventListener('change', function () {
      var v = parseFloat($('in-v').value); if (!isFinite(v)) return;
      state.v = isImp() ? v / 3.28084 : v;
      state.v = Math.max(0.01, Math.min(10, state.v));
      syncControls(); updateReadouts(); requestDraw();
    });
    $('in-d').addEventListener('change', function () {
      var v = parseFloat($('in-d').value); if (!isFinite(v)) return;
      var D_cm = isImp() ? v * 2.54 : v;
      D_cm = Math.max(0.1, Math.min(20, D_cm));
      state.D_m = D_cm / 100;
      syncControls(); updateReadouts(); requestDraw();
    });
    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.dataset.dir, 10);
        var kind = b.dataset.step;
        if (kind === 'v') state.v = Math.max(0.01, Math.min(10, state.v + dir * 0.1));
        if (kind === 'd') state.D_m = Math.max(0.001, Math.min(0.20, state.D_m + dir * 0.005));
        syncControls(); updateReadouts(); requestDraw(); playClick();
      });
    });
    $('chk-streamlines').addEventListener('change', function () { state.showStreamlines = $('chk-streamlines').checked; requestDraw(); });
    $('chk-particles').addEventListener('change', function () { state.showParticles = $('chk-particles').checked; requestDraw(); });
    $('chk-equation').addEventListener('change', function () { state.showEquation = $('chk-equation').checked; requestDraw(); });
    $('chk-grid').addEventListener('change', function () { state.showGrid = $('chk-grid').checked; requestDraw(); });
    $('chk-regime').addEventListener('change', function () { state.showRegime = $('chk-regime').checked; requestDraw(); });

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

    $('btn-custom').addEventListener('click', openCM);
    $('cust-modal-close').addEventListener('click', closeCM);
    $('cm-cancel').addEventListener('click', closeCM);
    $('cm-add').addEventListener('click', addCustom);
    $('cust-modal').addEventListener('click', function (e) { if (e.target === $('cust-modal')) closeCM(); });

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

    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault(); var menu = $('ctx-menu');
      menu.style.display = 'block'; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px';
    });
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
    rebuildSelectors(); rebuildPresets(); syncControls(); syncUnitTabs(); wireEvents();
    setMode('simulate');
    document.querySelectorAll('.preset-chip').forEach(function (c) { c.classList.toggle('active', c.textContent === 'Tap Water'); });
    requestDraw();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
