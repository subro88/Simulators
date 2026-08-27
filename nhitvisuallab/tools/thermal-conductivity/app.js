/* Thermal Conductivity Simulator — NHIT VisualLab
   Fourier's law:    Q/t = k · A · ΔT / L           (steady-state heat rate, W)
   Diffusivity:      α = k / (ρ · c)                (m²/s — controls travel speed)
   Diffusion time:   τ ≈ L² / α                     (characteristic time)
   Internal SI: k in W/(m·K), L in m, A in m², T in °C (ΔT in K = ΔT in °C).
*/
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  /* ── Material database ──────────────────────────────────────── */
  var MATERIALS = [
    { key: 'copper',    name: 'Copper',          k: 401,  rho: 8960, c: 385,  color: '#d27a3a' },
    { key: 'aluminum',  name: 'Aluminium',       k: 237,  rho: 2700, c: 897,  color: '#bfc9d6' },
    { key: 'brass',     name: 'Brass',           k: 109,  rho: 8530, c: 380,  color: '#d4ad58' },
    { key: 'iron',      name: 'Iron / Steel',    k: 80,   rho: 7870, c: 449,  color: '#7a8190' },
    { key: 'stainless', name: 'Stainless Steel', k: 16,   rho: 8000, c: 500,  color: '#a8b0c0' },
    { key: 'concrete',  name: 'Concrete',        k: 1.4,  rho: 2400, c: 880,  color: '#9ea4ad' },
    { key: 'glass',     name: 'Glass',           k: 0.96, rho: 2500, c: 840,  color: '#9ad7e6' },
    { key: 'brick',     name: 'Brick',           k: 0.72, rho: 1700, c: 840,  color: '#b56142' },
    { key: 'plastic',   name: 'Plastic (PVC)',   k: 0.19, rho: 1380, c: 1000, color: '#e0d8ce' },
    { key: 'wood',      name: 'Pine wood',       k: 0.13, rho: 600,  c: 1700, color: '#a06b3c' }
  ];

  var PRESETS = [
    { key: 'default', name: 'Default',           a: 'copper',    b: 'glass',     th: 100, tc: 20, len: 20, area: 4 },
    { key: 'metals',  name: 'Metals Race',       a: 'copper',    b: 'iron',      th: 150, tc: 20, len: 25, area: 4 },
    { key: 'cookware',name: 'Cookware',          a: 'aluminum',  b: 'stainless', th: 200, tc: 25, len: 5,  area: 16 },
    { key: 'walls',   name: 'Wall Materials',    a: 'concrete',  b: 'brick',     th: 25,  tc: 0,  len: 15, area: 100 },
    { key: 'insul',   name: 'Conductor vs Insulator', a: 'aluminum', b: 'wood',  th: 100, tc: 20, len: 20, area: 4 },
    { key: 'cpu',     name: 'CPU heat path',     a: 'aluminum',  b: 'plastic',   th: 80,  tc: 25, len: 2,  area: 9 }
  ];

  /* ── State ──────────────────────────────────────────────────── */
  var state = {
    mode: 'simulate',
    unit: 'si',
    matA: 'copper',
    matB: 'glass',
    /* Inputs (SI internal) */
    Th: 100,        // °C
    Tc: 20,         // °C
    L_m: 0.20,      // m
    A_m2: 4e-4,     // m² (4 cm² = 4e-4 m²)
    /* Animation */
    running: false,
    t: 0,
    /* Toggles */
    showFlame: true, showParticles: true, showEquation: true, showArrow: true, showGrid: false,
    /* Custom */
    customMats: [],
    /* Practice/Quiz */
    pp: { problem: null, score: 0, total: 0 },
    qz: { idx: 0, q: null, answers: [], started: false },
    history: [], redoStack: [],
    audioCtx: null,
    raf: 0
  };

  var canvas = $('sim-canvas');
  var ctx = canvas.getContext('2d');

  /* ── Unit helpers ───────────────────────────────────────────── */
  function isImp() { return state.unit === 'imp'; }
  function uLabel(kind) {
    var imp = isImp();
    switch (kind) {
      case 'k':     return imp ? 'BTU/(hr·ft·°F)' : 'W/(m·K)';
      case 'pow':   return imp ? 'BTU/hr' : 'W';
      case 'len':   return imp ? 'in' : 'cm';
      case 'lenM':  return imp ? 'ft' : 'm';
      case 'area':  return imp ? 'in²' : 'cm²';
      case 'temp':  return imp ? '°F' : '°C';
      case 'alpha': return imp ? 'ft²/s' : 'm²/s';
      case 'time':  return 's';
      case 'rho':   return imp ? 'lb/ft³' : 'kg/m³';
      case 'spec':  return imp ? 'BTU/(lb·°F)' : 'J/(kg·K)';
    }
    return '';
  }
  /* SI → display */
  function toD(val, kind) {
    if (!isImp()) return val;
    switch (kind) {
      case 'k':     return val * 0.5778;
      case 'pow':   return val * 3.41214;
      case 'len':   return val / 2.54;             // cm → in (val in cm)
      case 'lenM':  return val * 3.28084;          // m → ft
      case 'area':  return val / 6.4516;           // cm² → in²
      case 'temp':  return val * 1.8 + 32;         // °C → °F (absolute)
      case 'tempD': return val * 1.8;              // ΔT
      case 'alpha': return val * 10.7639;          // m²/s → ft²/s
      case 'rho':   return val * 0.062428;
      case 'spec':  return val * 2.388e-4;
    }
    return val;
  }
  function fromD(val, kind) {
    if (!isImp()) return val;
    switch (kind) {
      case 'len':  return val * 2.54;
      case 'lenM': return val / 3.28084;
      case 'area': return val * 6.4516;
      case 'temp': return (val - 32) / 1.8;
      case 'k':    return val / 0.5778;
    }
    return val;
  }
  function fmt(v, dp) {
    if (!isFinite(v)) return '—';
    if (v === 0) return '0';
    var a = Math.abs(v);
    if (a >= 100000 || (a > 0 && a < 0.01)) return v.toExponential(2);
    if (a >= 100) return v.toFixed(0);
    if (dp == null) dp = a >= 10 ? 1 : a >= 1 ? 2 : 3;
    return v.toFixed(dp);
  }

  /* ── Lookup ────────────────────────────────────────────────── */
  function getMat(key) {
    var all = MATERIALS.concat(state.customMats);
    for (var i = 0; i < all.length; i++) if (all[i].key === key) return all[i];
    return MATERIALS[0];
  }

  /* ── Physics ────────────────────────────────────────────────── */
  function computeOne(mat) {
    var dT = state.Th - state.Tc;                      // K (= °C diff)
    var P = mat.k * state.A_m2 * dT / state.L_m;       // W
    var alpha = mat.rho && mat.c ? mat.k / (mat.rho * mat.c) : null; // m²/s
    var tauHalf = alpha ? Math.pow(state.L_m / 2, 2) / alpha : null; // time to mid (rough)
    return { mat: mat, dT: dT, P: P, alpha: alpha, tauHalf: tauHalf };
  }
  function compute() {
    var a = computeOne(getMat(state.matA));
    var b = computeOne(getMat(state.matB));
    var ratio = b.P > 0 ? a.P / b.P : Infinity;
    return { a: a, b: b, ratio: ratio };
  }

  /* Transient cold-end temperature (insulated cold end model).
     During the Start-Heating animation we model the rod as having
     T_H clamped at the hot end and the cold end thermally INSULATED
     (no heat sink). Heat diffuses in and the cold end warms toward
     T_H exponentially with time-constant τ ≈ 4L²/(π²α).
     A 100× speed-up factor compresses the (often very long) physical
     time onto an animation that students can watch. */
  var TRANSIENT_SPEEDUP = 100;
  function getTransientTc(res) {
    if (!res.alpha || state.t <= 0) return state.Tc;
    var t_eff = state.t * TRANSIENT_SPEEDUP;
    var tau = 0.405 * state.L_m * state.L_m / res.alpha;
    return state.Th - (state.Th - state.Tc) * Math.exp(-t_eff / tau);
  }

  /* ── Audio ──────────────────────────────────────────────────── */
  function getAudio() {
    if (!state.audioCtx) {
      try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    return state.audioCtx;
  }
  function playTone(freq, dur, type, vol) {
    var ac = getAudio(); if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.value = vol || 0.06;
    o.connect(g); g.connect(ac.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.stop(ac.currentTime + dur + 0.02);
  }
  function playClick()   { playTone(700, 0.04, 'square', 0.04); }
  function playStart()   { playTone(440, 0.08, 'sine', 0.06); setTimeout(function(){ playTone(660, 0.10, 'sine', 0.06); }, 90); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.08); setTimeout(function(){ playTone(1320, 0.16, 'sine', 0.08); }, 110); }
  function playError()   { playTone(220, 0.22, 'sawtooth', 0.05); }

  /* ── Canvas drawing ─────────────────────────────────────────── */
  function sizeCanvas() {
    var W = canvas.parentElement.clientWidth - 16;
    var H = Math.max(380, Math.min(W * 0.66, 480));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { W: W, H: H };
  }

  function draw() {
    var dim = sizeCanvas();
    var W = dim.W, H = dim.H;
    var c = compute();

    /* Bg */
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, W, H);
    if (state.showGrid) drawGrid(W, H);

    /* Layout: two horizontal rods stacked */
    var marginX = 90, marginRight = 50;
    var rodTopY = 70, rodBotY = H - 80;
    var rodSpacing = 24;
    var availH = rodBotY - rodTopY - rodSpacing;
    var rodH = Math.min(availH / 2, 110);
    var rodW = W - marginX - marginRight;
    if (rodW < 200) rodW = 200;
    var rodAY = rodTopY;
    var rodBY = rodTopY + rodH + rodSpacing;

    drawRod('A', marginX, rodAY, rodW, rodH, c.a);
    drawRod('B', marginX, rodBY, rodW, rodH, c.b);

    /* Equation overlay */
    if (state.showEquation) drawEquation(W, c);

    /* Animation tick */
    if (state.running) {
      state.t += 0.016;
      requestDraw();
    }
  }

  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(139,157,195,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawRod(letter, x, y, w, h, res) {
    var mat = res.mat;
    /* During the heating animation the cold end is insulated and warms
       up over time. When idle/reset, it shows the steady-state T_C. */
    var Tc_now = state.running ? getTransientTc(res) : state.Tc;

    /* ── Hot end / Flame ───────────────────────────────────── */
    if (state.showFlame) drawFlame(x - 24, y + h / 2, h * 0.6);
    /* ── Cold end fin ──────────────────────────────────────── */
    drawColdFin(x + w + 4, y, h);

    /* ── Rod body — temperature gradient ───────────────────── */
    /* Linear gradient from Th (left) to Tc_now (right). When running,
       Tc_now rises asymptotically toward Th so the rod gradually turns
       red end-to-end as heat propagates through it. */
    var grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, tempToColor(state.Th));
    grad.addColorStop(1, tempToColor(Tc_now));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    /* Rod border */
    ctx.strokeStyle = mat.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, w, h);
    /* Material colour stripe along top */
    ctx.fillStyle = mat.color;
    ctx.fillRect(x, y, w, 4);
    ctx.fillRect(x, y + h - 4, w, 4);

    /* ── Animated thermal wavefront ────────────────────────── */
    if (res.alpha) {
      /* Wavefront travels distance sqrt(α t) — visualise progress */
      var distM = Math.sqrt(res.alpha * state.t * 4);   // factor 4 visual amplification
      var distFrac = Math.min(1, distM / state.L_m);
      var frontX = x + distFrac * w;
      if (state.t > 0 && distFrac < 1.0) {
        var grd2 = ctx.createLinearGradient(frontX - 30, 0, frontX + 4, 0);
        grd2.addColorStop(0, 'rgba(255,255,255,0.0)');
        grd2.addColorStop(1, 'rgba(255,255,255,0.55)');
        ctx.fillStyle = grd2;
        ctx.fillRect(Math.max(x, frontX - 30), y + 4, Math.min(34, frontX - x + 4), h - 8);
      }
    }

    /* ── Particles vibrating ───────────────────────────────── */
    if (state.showParticles) drawParticles(x, y, w, h);

    /* ── Heat-flow arrow ───────────────────────────────────── */
    if (state.showArrow) drawHeatArrow(x + 12, y + h / 2, x + w - 12, y + h / 2, res);

    /* ── Labels ────────────────────────────────────────────── */
    /* Material name + k inside rod (with halo) */
    drawHaloText(letter + ': ' + mat.name, x + 10, y + 16, '#fff', 11, 'left');
    drawHaloText('k = ' + fmt(toD(mat.k, 'k')) + ' ' + uLabel('k'), x + 10, y + 30, '#ffd699', 10, 'left');

    /* Temp labels at ends — cold end shows transient T_C(t) while
       heating, with colour shifting cyan → amber as it warms. */
    drawHaloText(fmt(toD(state.Th, 'temp'), 0) + ' ' + uLabel('temp'), x + 4, y - 6, '#ff8a65', 10, 'left');
    var dT_init = Math.max(0.001, state.Th - state.Tc);
    var dT_now  = state.Th - Tc_now;
    var warmFrac = state.running && res.alpha ? Math.max(0, Math.min(1, 1 - dT_now / dT_init)) : 0;
    var coldColor = warmFrac > 0
      ? interpRGB([127, 219, 255], [255, 138, 101], warmFrac)
      : '#7fdbff';
    drawHaloText(fmt(toD(Tc_now, 'temp'), 0) + ' ' + uLabel('temp'), x + w - 4, y - 6, coldColor, 10, 'right');
    if (state.running && res.alpha && warmFrac < 0.999) {
      /* Small "% warmed" badge inside rod near cold end */
      drawHaloText((warmFrac * 100).toFixed(0) + '% warmed', x + w - 8, y + h - 22, '#ffd699', 9, 'right');
    } else if (state.running && warmFrac >= 0.999) {
      drawHaloText('equilibrated ✓', x + w - 8, y + h - 22, '#3ddc84', 9, 'right');
    }

    /* Rate at far right */
    drawHaloText('P = ' + fmt(toD(res.P, 'pow')) + ' ' + uLabel('pow'), x + w - 6, y + h - 8, '#ffb74d', 11, 'right');
  }

  function drawFlame(cx, cy, size) {
    ctx.save();
    var t = performance.now() * 0.005;
    var flicker = 1 + Math.sin(t) * 0.08;
    var w = size * 0.7 * flicker, h = size * flicker;
    var grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, w);
    grad.addColorStop(0, '#fff7c0');
    grad.addColorStop(0.4, '#ff9800');
    grad.addColorStop(1, 'rgba(255,87,34,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    /* base flame */
    ctx.fillStyle = '#e65100';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, cy + h * 0.3);
    ctx.quadraticCurveTo(cx, cy - h * 0.5, cx + w * 0.5, cy + h * 0.3);
    ctx.quadraticCurveTo(cx, cy + h * 0.4, cx - w * 0.5, cy + h * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function drawColdFin(x, y, h) {
    ctx.save();
    ctx.fillStyle = '#1a3050';
    ctx.fillRect(x, y, 20, h);
    /* fins */
    ctx.fillStyle = '#7fdbff';
    for (var i = 0; i < 5; i++) {
      ctx.fillRect(x + 2, y + 4 + i * (h / 5), 16, 2);
    }
    ctx.strokeStyle = '#7fdbff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 20, h);
    ctx.restore();
  }

  function drawParticles(x, y, w, h) {
    var t = performance.now() * 0.002;
    var n = Math.max(8, Math.floor(w / 18));
    for (var i = 0; i < n; i++) {
      var px = x + (i + 0.5) * (w / n);
      /* Hot left → vibrant fast jiggle; cold right → small slow */
      var heatFrac = 1 - (px - x) / w;
      var amp = 1 + heatFrac * 4;
      var py = y + h / 2 + Math.sin(t * (3 + heatFrac * 4) + i) * amp;
      var pAlpha = 0.5 + heatFrac * 0.4;
      ctx.fillStyle = 'rgba(255,255,255,' + pAlpha + ')';
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHeatArrow(x1, y, x2, y2, res) {
    /* Arrow length scales with heat-rate magnitude relative to a reference */
    var c = compute();
    var maxP = Math.max(c.a.P, c.b.P, 0.01);
    var scale = res.P / maxP;
    var len = Math.max(40, scale * (x2 - x1) * 0.85);
    var sx = x1, sy = y, ex = x1 + len, ey = y2;
    ctx.save();
    ctx.strokeStyle = '#ffb74d';
    ctx.fillStyle   = '#ffb74d';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    var ah = 8;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - ah, ey - ah * 0.5);
    ctx.lineTo(ex - ah, ey + ah * 0.5);
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

  function drawEquation(W, c) {
    var bx = W - 250, by = 8, bw = 240, bh = 50;
    ctx.fillStyle = 'rgba(13,17,30,0.7)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(251,140,0,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    drawHaloText('Q/t = k · A · ΔT / L', bx + 10, by + 16, '#ffb74d', 11, 'left');
    drawHaloText('Ratio A/B = ' + fmt(c.ratio) + '×', bx + 10, by + 35, '#fff', 10, 'left');
  }

  function tempToColor(T) {
    /* Map −50..500 °C to color */
    var t = Math.max(0, Math.min(1, (T - (-50)) / (500 - (-50))));
    /* Blue → cyan → yellow → red gradient */
    if (t < 0.33) {
      var u = t / 0.33;
      return interpRGB([30, 80, 200], [70, 180, 230], u);
    } else if (t < 0.66) {
      var u2 = (t - 0.33) / 0.33;
      return interpRGB([70, 180, 230], [255, 200, 80], u2);
    } else {
      var u3 = (t - 0.66) / 0.34;
      return interpRGB([255, 200, 80], [220, 60, 30], u3);
    }
  }
  function interpRGB(a, b, t) {
    var r = Math.round(a[0] + (b[0] - a[0]) * t);
    var g = Math.round(a[1] + (b[1] - a[1]) * t);
    var bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  /* ── Render scheduling ──────────────────────────────────────── */
  function requestDraw() {
    if (state.raf) return;
    state.raf = requestAnimationFrame(function () {
      state.raf = 0;
      draw();
      updateReadouts();
    });
  }

  /* ── Readouts ───────────────────────────────────────────────── */
  function updateReadouts() {
    var c = compute();
    $('r-ka').textContent = fmt(toD(c.a.mat.k, 'k'));
    $('r-kb').textContent = fmt(toD(c.b.mat.k, 'k'));
    $('r-pa').textContent = fmt(toD(c.a.P, 'pow'));
    $('r-pb').textContent = fmt(toD(c.b.P, 'pow'));
    $('r-aa').textContent = c.a.alpha ? toD(c.a.alpha, 'alpha').toExponential(2) : '—';
    $('r-ab').textContent = c.b.alpha ? toD(c.b.alpha, 'alpha').toExponential(2) : '—';
    $('r-ta').textContent = c.a.tauHalf ? fmt(c.a.tauHalf) : '—';
    $('r-tb').textContent = c.b.tauHalf ? fmt(c.b.tauHalf) : '—';

    var u_k = uLabel('k'), u_p = uLabel('pow'), u_a = uLabel('alpha');
    $('r-unit-ka').textContent = ' ' + u_k;
    $('r-unit-kb').textContent = ' ' + u_k;
    $('r-unit-pa').textContent = ' ' + u_p;
    $('r-unit-pb').textContent = ' ' + u_p;
    $('r-unit-aa').textContent = ' ' + u_a;
    $('r-unit-ab').textContent = ' ' + u_a;

    /* Slider unit badges */
    $('badge-th').textContent = uLabel('temp');
    $('badge-tc').textContent = uLabel('temp');
    $('badge-len').textContent = uLabel('len');
    $('badge-area').textContent = uLabel('area');

    /* Readout badges */
    var badges = $('readout-badges');
    if (badges) badges.style.display = state.mode === 'simulate' ? '' : 'none';
    $('rb-pa').textContent = fmt(toD(c.a.P, 'pow'));
    $('rb-pb').textContent = fmt(toD(c.b.P, 'pow'));
    $('rb-pa-u').textContent = u_p;
    $('rb-pb-u').textContent = u_p;
    $('rb-ratio').textContent = fmt(c.ratio);
    $('rb-dt').textContent = fmt(toD(c.a.dT, 'tempD'));
    $('rb-dt-u').textContent = uLabel('temp');

    updateLearnPanels(c);
  }

  /* ── Learning panels (LaTeX rendered via shared/latex-auto.js) ─ */
  var _learnCache = { eq: '', cmp: '', co: '' };
  function updateLearnPanels(c) {
    var eq = $('lp-eq-body'); if (!eq) return;
    var uP = isImp() ? '\\mathrm{BTU/hr}' : '\\mathrm{W}';
    var html = '';
    html += '<div class="eq-line">\\[ \\dfrac{Q}{t} = k \\cdot A \\cdot \\dfrac{\\Delta T}{L} \\]</div>';
    html += '<div class="eq-line">A: \\(P = ' + fmt(toD(c.a.mat.k, 'k')) + ' \\cdot ' + fmt(state.A_m2, 4) + '\\;\\mathrm{m^2} \\cdot ' + fmt(c.a.dT) + '\\;\\mathrm{K} / ' + fmt(state.L_m) + '\\;\\mathrm{m} = \\mathbf{' + fmt(toD(c.a.P, 'pow')) + '\\;' + uP + '}\\)</div>';
    html += '<div class="eq-line">B: \\(P = ' + fmt(toD(c.b.mat.k, 'k')) + ' \\cdot ' + fmt(state.A_m2, 4) + '\\;\\mathrm{m^2} \\cdot ' + fmt(c.b.dT) + '\\;\\mathrm{K} / ' + fmt(state.L_m) + '\\;\\mathrm{m} = \\mathbf{' + fmt(toD(c.b.P, 'pow')) + '\\;' + uP + '}\\)</div>';
    html += '<div class="eq-line">Ratio: \\(\\dfrac{P_A}{P_B} = \\mathbf{' + fmt(c.ratio) + '\\times}\\) — heat flows through ' + c.a.mat.name + ' that much faster</div>';
    if (c.a.alpha && c.b.alpha) {
      html += '<div class="eq-line">\\(\\alpha = \\dfrac{k}{\\rho \\cdot c}: \\quad \\alpha_A = ' + c.a.alpha.toExponential(2).replace('e', ' \\times 10^{') + '},\\; \\alpha_B = ' + c.b.alpha.toExponential(2).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2/s}\\)</div>';
      html += '<div class="eq-line">\\(\\tau = \\dfrac{L^2}{4\\alpha}: \\quad \\tau_A = ' + fmt(c.a.tauHalf) + '\\;\\mathrm{s},\\; \\tau_B = ' + fmt(c.b.tauHalf) + '\\;\\mathrm{s}\\)</div>';
    }
    if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }

    /* Compare table */
    var cmp = $('lp-cmp-body');
    if (cmp) {
      var rows = '<table class="cmp-table"><thead><tr><th>Material</th><th>k</th><th>P</th><th>α</th></tr></thead><tbody>';
      for (var i = 0; i < MATERIALS.length; i++) {
        var m = MATERIALS[i];
        var P = m.k * state.A_m2 * c.a.dT / state.L_m;
        var alpha = m.k / (m.rho * m.c);
        var cls = m.k > 50 ? 'cmp-float' : (m.k < 5 ? 'cmp-sink' : '');
        rows += '<tr><td>' + m.name + '</td><td>' + fmt(toD(m.k, 'k')) + '</td>'
              + '<td class="' + cls + '">' + fmt(toD(P, 'pow')) + '</td>'
              + '<td>' + alpha.toExponential(1) + '</td></tr>';
      }
      rows += '</tbody></table>';
      if (rows !== _learnCache.cmp) { cmp.innerHTML = rows; _learnCache.cmp = rows; }
    }

    /* Coach */
    var co = $('lp-coach-body');
    if (co) {
      var tips = [];
      var ratio = c.ratio;
      if (ratio > 10) {
        tips.push(c.a.mat.name + ' conducts ' + fmt(ratio) + '× more heat than ' + c.b.mat.name + ' for the same ΔT, area, and length. Pick A for heat sinks; pick B for insulation.');
      } else if (ratio > 0.1 && ratio < 10) {
        tips.push('A and B differ by less than 10× — both are similar conductors. Try a more extreme pair (e.g. Copper vs Wood) for a stronger contrast.');
      } else {
        tips.push(c.b.mat.name + ' carries more heat than ' + c.a.mat.name + ' for this geometry — swap them to put the conductor on top.');
      }
      tips.push('Doubling ΔT or A doubles P. Doubling L halves P. Verify by sliding any one parameter.');
      if (c.a.alpha && c.b.alpha) {
        var ratA = c.a.alpha / c.b.alpha;
        tips.push('Heat travels ' + fmt(ratA) + '× faster through A than B (by α). High α means a hot pulse reaches the cold end quickly.');
      }
      var html2 = '<ul class="coach-list">';
      for (var k = 0; k < tips.length; k++) html2 += '<li>' + tips[k] + '</li>';
      html2 += '</ul>';
      if (html2 !== _learnCache.co) { co.innerHTML = html2; _learnCache.co = html2; }
    }
  }

  /* ── Selectors / Presets ────────────────────────────────────── */
  function rebuildSelectors() {
    var sa = $('sel-mat-a'), sb = $('sel-mat-b');
    sa.innerHTML = ''; sb.innerHTML = '';
    var all = MATERIALS.concat(state.customMats);
    for (var i = 0; i < all.length; i++) {
      var m = all[i];
      var lbl = m.name + ' (k = ' + fmt(toD(m.k, 'k')) + ' ' + uLabel('k') + ')';
      var oa = document.createElement('option'); oa.value = m.key; oa.textContent = lbl; sa.appendChild(oa);
      var ob = document.createElement('option'); ob.value = m.key; ob.textContent = lbl; sb.appendChild(ob);
    }
    sa.value = state.matA;
    sb.value = state.matB;
  }
  function rebuildPresets() {
    var box = $('preset-chips');
    box.innerHTML = '';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.className = 'preset-chip';
      b.type = 'button';
      b.textContent = p.name;
      b.addEventListener('click', function () {
        applyPreset(p);
        playClick();
      });
      box.appendChild(b);
    });
  }
  function applyPreset(p) {
    pushHistory();
    state.matA = p.a; state.matB = p.b;
    state.Th = p.th; state.Tc = p.tc;
    state.L_m = p.len / 100;
    state.A_m2 = p.area / 1e4;
    state.t = 0;
    syncControls();
    updateReadouts();
    requestDraw();
    document.querySelectorAll('.preset-chip').forEach(function (c) { c.classList.toggle('active', c.textContent === p.name); });
  }

  /* ── Sync controls ──────────────────────────────────────────── */
  function syncControls() {
    $('sel-mat-a').value = state.matA;
    $('sel-mat-b').value = state.matB;
    /* Sliders work in display units */
    $('sl-th').value = state.Th;
    $('in-th').value = isImp() ? Math.round(state.Th * 1.8 + 32) : Math.round(state.Th);
    $('sl-tc').value = state.Tc;
    $('in-tc').value = isImp() ? Math.round(state.Tc * 1.8 + 32) : Math.round(state.Tc);
    /* Length: SI cm internal; display cm or in */
    var L_cm = state.L_m * 100;
    $('sl-len').value = L_cm;
    $('in-len').value = isImp() ? (L_cm / 2.54).toFixed(1) : L_cm.toFixed(0);
    /* Area: SI cm² internal; display cm² or in² */
    var A_cm2 = state.A_m2 * 1e4;
    $('sl-area').value = A_cm2;
    $('in-area').value = isImp() ? (A_cm2 / 6.4516).toFixed(2) : A_cm2.toFixed(1);
  }

  /* ── History ────────────────────────────────────────────────── */
  function snapshot() {
    return { matA: state.matA, matB: state.matB, Th: state.Th, Tc: state.Tc, L_m: state.L_m, A_m2: state.A_m2, unit: state.unit };
  }
  function pushHistory() {
    state.history.push(snapshot());
    if (state.history.length > 30) state.history.shift();
    state.redoStack = [];
  }
  function applySnap(s) {
    state.matA = s.matA; state.matB = s.matB;
    state.Th = s.Th; state.Tc = s.Tc;
    state.L_m = s.L_m; state.A_m2 = s.A_m2; state.unit = s.unit;
    syncUnitTabs();
    rebuildSelectors();
    syncControls();
    updateReadouts();
    requestDraw();
  }
  function doUndo() { if (state.history.length === 0) return; state.redoStack.push(snapshot()); applySnap(state.history.pop()); }
  function doRedo() { if (state.redoStack.length === 0) return; state.history.push(snapshot()); applySnap(state.redoStack.pop()); }
  function syncUnitTabs() {
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.unit === state.unit);
    });
  }

  /* ── Mode switching ─────────────────────────────────────────── */
  function setMode(m) {
    state.mode = m;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === m); });
    $('sim-panel').style.display      = (m === 'simulate') ? '' : 'none';
    $('learn-panels').style.display   = (m === 'simulate') ? '' : 'none';
    $('cat-row').style.display        = (m === 'explore') ? '' : 'none';
    $('item-selector').style.display  = (m === 'explore') ? '' : 'none';
    $('item-info').style.display      = (m === 'explore') ? '' : 'none';
    $('practice-panel').style.display = (m === 'practice') ? '' : 'none';
    $('practice-bar').style.display   = (m === 'practice') ? '' : 'none';
    $('quiz-panel').style.display     = (m === 'quiz') ? '' : 'none';
    $('quiz-bar').style.display       = (m === 'quiz') ? '' : 'none';
    $('quiz-result').style.display    = 'none';
    if (m === 'explore') buildExplore();
    if (m === 'practice') startPractice();
    if (m === 'quiz') startQuiz();
    updateReadouts();
    requestDraw();
  }

  /* ── Explore content ────────────────────────────────────────── */
  var EXPLORE = {
    basics: [
      { title: 'What is Thermal Conductivity?', body: 'Thermal conductivity (k) measures how readily a material transports heat. It is the constant of proportionality in Fourier\'s law and is given in W/(m·K). Big k → fast heat flow. Small k → insulator.', formula: 'k = (Q · L) / (A · ΔT · t)', note: 'Diamond has k ≈ 2200 W/(m·K) — even higher than copper!' },
      { title: 'Conductors vs Insulators', body: 'Metals (Cu, Al, Fe, brass) are conductors — k > 10 W/(m·K). Glass, brick, wood, plastic are insulators — k < 5. Air at rest is an excellent insulator with k = 0.026, which is why double-glazing traps still air.', formula: '', note: 'Stainless steel is a metal but a poor metal conductor (k = 16) due to alloy disorder.' },
      { title: 'Why Metals Conduct Best', body: 'Metals have a "free electron gas" — mobile electrons that carry kinetic energy from hot to cold regions very efficiently. In insulators heat travels only through lattice vibrations (phonons), which scatter much faster.', formula: 'Wiedemann-Franz: k/σT ≈ const', note: 'The same property that makes copper a great electrical conductor makes it a great thermal conductor.' },
      { title: 'Steady State vs Transient', body: 'In steady state, every point of the rod has reached its final temperature and the heat rate is constant: Q/t = k·A·ΔT/L. Before steady state, the rod is still warming up — temperature changes with time and depends on thermal diffusivity α = k/(ρc).', formula: '', note: 'Diffusion time τ ≈ L²/α tells you how long until the rod reaches steady state.' }
    ],
    formulas: [
      { title: 'Fourier\'s Law', body: 'The fundamental equation of conduction. Says heat flows from hot to cold, proportional to k, A, and ΔT, inversely proportional to L. The minus sign in the differential form indicates direction.', formula: 'Q/t = k · A · ΔT / L  (steady state)', note: '20 cm copper rod, 4 cm², ΔT = 80°C: P = 401·4e-4·80/0.20 = 64 W' },
      { title: 'Thermal Diffusivity', body: 'Combines conductivity, density, and specific heat into one number that controls how fast a temperature change propagates through the material. Big α → quick response. Small α → sluggish.', formula: 'α = k / (ρ · c)', note: 'Copper: α ≈ 1.16×10⁻⁴ m²/s. Glass: α ≈ 4.6×10⁻⁷ m²/s — 250× slower.' },
      { title: 'Thermal Resistance', body: 'In analogy to electrical Ohm\'s law (V = IR), conduction obeys ΔT = P · R_th where R_th = L / (k · A). Useful for stacking layers (composite walls): total R is the sum of layer R values.', formula: 'R_th = L / (k · A)  (K/W)', note: 'Insulation R-value (US imperial) is hr·ft²·°F/BTU, computed per unit area.' },
      { title: 'Heat Flux', body: 'Heat flux q is heat rate per unit area: q = k · ΔT / L (W/m²). Independent of area — depends only on the material and the temperature gradient. Useful for sizing heat sinks.', formula: 'q = k · dT/dx', note: 'A 1 mm copper film with ΔT = 1 K across has q = 401 kW/m² — huge!' }
    ],
    applications: [
      { title: 'Heat Sinks (Electronics)', body: 'Aluminium fins on CPU coolers maximise surface area for convection while their high k (237) carries heat from the chip out to the fins. Copper is sometimes used for the contact base for even higher k.', formula: '', note: 'Modern desktop CPUs dump 100+ W through a heat sink — without one, the chip would melt in seconds.' },
      { title: 'Cookware', body: 'Cookware bottoms use thick aluminium or copper for even heat distribution (high k → no hot spots), with a thin stainless steel or non-stick top layer for hardness, food contact, and corrosion resistance.', formula: '', note: 'Cast iron has lower k (~50) than aluminium but high thermal mass (ρ·c) — slow to heat but holds heat steadily.' },
      { title: 'Building Insulation', body: 'Insulation traps small still-air pockets, exploiting air\'s tiny k = 0.026. Fibreglass and foam achieve effective k around 0.04. Walls are rated by R-value (the higher, the better the insulation).', formula: '', note: 'A typical house wall has R-13 to R-21 insulation; ceilings R-30 to R-49.' },
      { title: 'Thermos / Vacuum Flask', body: 'A double-walled flask with a vacuum gap eliminates conduction (k of vacuum = 0) and convection. The shiny silver coating also blocks radiation. The lid is made of low-k plastic.', formula: '', note: 'A good thermos can keep coffee hot for 12+ hours.' }
    ],
    errors: [
      { title: 'k vs Specific Heat (c)', body: 'Thermal conductivity (k) and specific heat capacity (c) are different! k is about how fast heat moves; c is about how much energy it takes to raise temperature. Copper has high k AND low c. Water has low k AND high c.', formula: 'k ≠ c (different units!)', note: 'k in W/(m·K). c in J/(kg·K). They combine in α = k/(ρc).' },
      { title: 'Unit Trap', body: 'Always use SI base units: k in W/(m·K), L in m (not cm!), A in m² (not cm²), ΔT in K. Common mistake: leaving L in cm gives an answer 100× too small for heat rate.', formula: '', note: '1 cm = 0.01 m. 1 cm² = 10⁻⁴ m². 1 mm = 10⁻³ m.' },
      { title: 'ΔT in K vs °F', body: 'Temperature differences (ΔT) are the same value in K and °C. To convert ΔT in °F to °C, divide by 1.8. Always check whether your ΔT is absolute or relative.', formula: 'ΔT(°C) = ΔT(K). ΔT(°F) = 1.8 × ΔT(°C)', note: 'ΔT = 80 K = 80 °C = 144 °F.' },
      { title: 'Steady-State Assumption', body: 'Q/t = k·A·ΔT/L only applies once the rod has reached steady state — when temperatures everywhere are constant in time. Before that, the diffusion equation governs and α matters.', formula: 'τ_steady ≈ L²/α', note: 'For a 20 cm copper rod, steady state takes only ~0.7 s. For a 20 cm glass rod, ~3 hours.' }
    ]
  };

  function buildExplore() {
    var cat = document.querySelector('#cat-tabs .pill.active');
    var key = cat ? cat.dataset.cat : 'basics';
    var grid = $('concept-grid');
    grid.innerHTML = '';
    EXPLORE[key].forEach(function (item, idx) {
      var b = document.createElement('button');
      b.className = 'is-btn' + (idx === 0 ? ' active' : '');
      b.type = 'button';
      b.innerHTML = '<span class="is-btn-name">' + item.title + '</span>'
                  + (item.formula ? '<span class="is-btn-sym">' + item.formula + '</span>' : '');
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
    var html = '<div class="ii-top"><span class="ii-name">' + item.title + '</span>'
             + '<span class="ii-cat-badge">' + cat + '</span></div>'
             + '<p class="ii-desc">' + item.body + '</p>';
    if (item.formula) html += '<div class="formula-box"><span class="fb-formula">' + item.formula + '</span></div>';
    if (item.note) html += '<div class="example-box"><h4>Key Insight</h4><p class="ex-step">' + item.note + '</p></div>';
    box.innerHTML = html;
  }

  /* ── Practice ───────────────────────────────────────────────── */
  function startPractice() {
    state.pp.score = 0; state.pp.total = 0;
    $('pbar-score-val').textContent = '0 / 0';
    newPractice();
  }
  function randMat() { return MATERIALS[Math.floor(Math.random() * MATERIALS.length)]; }
  function newPractice() {
    var types = ['heatRate', 'conductivity', 'deltaT', 'thickness'];
    var t = types[Math.floor(Math.random() * types.length)];
    var m = randMat();
    var L_cm = 10 + Math.floor(Math.random() * 40);                  // 10..49 cm
    var A_cm2 = 2 + Math.floor(Math.random() * 18);                  // 2..19 cm²
    var dT = 20 + Math.floor(Math.random() * 80);                    // 20..99 K
    var ans, prompt, unit;
    if (t === 'heatRate') {
      ans = m.k * (A_cm2 / 1e4) * dT / (L_cm / 100);
      prompt = 'A ' + L_cm + ' cm long ' + m.name + ' rod (k = ' + m.k + ' W/(m·K)) has cross-section ' + A_cm2 + ' cm². Hot end at T_H, cold end at T_C with ΔT = ' + dT + ' K. Find the steady-state heat rate Q/t.';
      unit = 'W';
      if (isImp()) { ans = ans * 3.41214; unit = 'BTU/hr'; }
    } else if (t === 'conductivity') {
      var P = m.k * (A_cm2 / 1e4) * dT / (L_cm / 100);
      ans = m.k;
      prompt = 'A ' + L_cm + ' cm rod with cross-section ' + A_cm2 + ' cm² conducts ' + P.toFixed(2) + ' W of heat at steady state with ΔT = ' + dT + ' K. Find the thermal conductivity k.';
      unit = 'W/(m·K)';
      if (isImp()) { ans = ans * 0.5778; unit = 'BTU/(hr·ft·°F)'; }
    } else if (t === 'deltaT') {
      var Pset = m.k * (A_cm2 / 1e4) * 50 / (L_cm / 100);
      ans = 50;
      prompt = 'A ' + L_cm + ' cm ' + m.name + ' rod (k = ' + m.k + ') with ' + A_cm2 + ' cm² cross-section conducts ' + Pset.toFixed(2) + ' W. Find ΔT.';
      unit = 'K (or °C)';
      if (isImp()) { ans = ans * 1.8; unit = '°F'; }
    } else {
      var Lset = L_cm / 100;
      var Pl = m.k * (A_cm2 / 1e4) * dT / Lset;
      ans = L_cm;
      prompt = 'A ' + m.name + ' rod (k = ' + m.k + ') with ' + A_cm2 + ' cm² cross-section conducts ' + Pl.toFixed(2) + ' W with ΔT = ' + dT + ' K. Find the rod length in cm.';
      unit = 'cm';
      if (isImp()) { ans = ans / 2.54; unit = 'in'; }
    }
    state.pp.problem = { type: t, ans: ans, unit: unit, m: m, L_cm: L_cm, A_cm2: A_cm2, dT: dT };
    $('pp-prompt').textContent = prompt;
    $('pp-input').value = '';
    $('pp-unit').textContent = unit;
    $('pp-feedback').textContent = '';
    $('pp-feedback').className = 'feedback';
    $('pp-solution').style.display = 'none';
    $('pp-next').style.display = 'none';
    $('pp-check').disabled = false;
    $('pp-input').focus();
  }
  function checkPractice() {
    var p = state.pp.problem; if (!p) return;
    var v = parseFloat($('pp-input').value);
    if (!isFinite(v)) { $('pp-feedback').textContent = 'Enter a number'; $('pp-feedback').className = 'feedback err'; return; }
    var tol = Math.abs(p.ans) * 0.05 + 0.001;
    state.pp.total++;
    if (Math.abs(v - p.ans) <= tol) {
      state.pp.score++;
      $('pp-feedback').textContent = '✓ Correct! Answer = ' + fmt(p.ans) + ' ' + p.unit;
      $('pp-feedback').className = 'feedback ok';
      playSuccess();
    } else {
      $('pp-feedback').textContent = '✗ Not quite. Correct: ' + fmt(p.ans) + ' ' + p.unit;
      $('pp-feedback').className = 'feedback err';
      playError();
    }
    $('pbar-score-val').textContent = state.pp.score + ' / ' + state.pp.total;
    $('pp-next').style.display = '';
    $('pp-check').disabled = true;
  }
  function showSolution() {
    var p = state.pp.problem; if (!p) return;
    var html = '<h4>Step-by-step solution</h4>';
    html += '<div class="sol-step">1. Convert to SI: L = ' + p.L_cm + ' cm = <strong>' + (p.L_cm/100) + ' m</strong>; A = ' + p.A_cm2 + ' cm² = <strong>' + (p.A_cm2/1e4).toExponential(1) + ' m²</strong></div>';
    if (p.type === 'heatRate') {
      var P_SI = p.m.k * (p.A_cm2/1e4) * p.dT / (p.L_cm/100);
      html += '<div class="sol-step">2. Apply Fourier: P = k·A·ΔT/L = ' + p.m.k + ' · ' + (p.A_cm2/1e4).toExponential(1) + ' · ' + p.dT + ' / ' + (p.L_cm/100) + '</div>';
      html += '<div class="sol-step">3. = <strong>' + P_SI.toFixed(3) + ' W</strong></div>';
      if (isImp()) html += '<div class="sol-step">4. Convert: ' + P_SI.toFixed(3) + ' W × 3.412 = <strong>' + (P_SI*3.41214).toFixed(2) + ' BTU/hr</strong></div>';
    } else if (p.type === 'conductivity') {
      html += '<div class="sol-step">2. Rearrange Fourier: k = P · L / (A · ΔT)</div>';
      html += '<div class="sol-step">3. = ' + p.m.k + ' W/(m·K) <strong>(direct material lookup)</strong></div>';
    } else if (p.type === 'deltaT') {
      html += '<div class="sol-step">2. Rearrange: ΔT = P · L / (k · A) = <strong>50 K</strong></div>';
    } else {
      html += '<div class="sol-step">2. Rearrange: L = k · A · ΔT / P = <strong>' + p.L_cm + ' cm</strong></div>';
    }
    var box = $('pp-solution');
    box.innerHTML = html;
    box.style.display = '';
  }

  /* ── Quiz ───────────────────────────────────────────────────── */
  function buildQuizQs() {
    return [
      {
        q: 'Two rods of the same length and cross-section have the same hot/cold ends. Which carries more heat — copper (k = 401) or glass (k = 0.96)?',
        opts: ['Copper', 'Glass', 'Equal', 'Depends on length'],
        ans: 0,
        ex: 'Higher k = more heat for the same geometry. Copper conducts ~400× more than glass.'
      },
      {
        q: 'A 20 cm long aluminium rod (k = 237) with 4 cm² cross-section has ΔT = 80 K across it. Find the steady-state heat rate.',
        opts: ['9.5 W', '37.9 W', '189 W', '1894 W'],
        ans: 1,
        ex: 'P = k·A·ΔT/L = 237·4e-4·80/0.20 = 37.9 W.'
      },
      {
        q: 'If you double the length of a rod while keeping ΔT and area the same, what happens to the heat rate?',
        opts: ['Doubles', 'Halves', 'Stays the same', 'Quadruples'],
        ans: 1,
        ex: 'P ∝ 1/L. Doubling L halves the heat rate.'
      },
      {
        q: 'Why does a metal spoon feel colder than a wooden spoon at the same room temperature?',
        opts: [
          'The metal is at a lower temperature',
          'Wood holds more heat',
          'Metal conducts heat away from your skin faster',
          'Wood reflects body heat'
        ],
        ans: 2,
        ex: 'Higher k of metal drains heat from your hand quickly. Both objects start at room temperature; perception differs because of conduction rate, not actual temperature.'
      },
      {
        q: 'Which property determines how FAST a temperature change propagates through a material?',
        opts: [
          'Thermal conductivity k alone',
          'Specific heat c alone',
          'Thermal diffusivity α = k/(ρc)',
          'Density ρ alone'
        ],
        ans: 2,
        ex: 'α = k/(ρc) governs transient heat flow — how quickly a change propagates. k alone gives the steady-state heat rate.'
      }
    ];
  }
  function startQuiz() {
    state.qz.idx = 0;
    state.qz.answers = [];
    state.qz.q = buildQuizQs();
    state.qz.started = true;
    $('quiz-result').style.display = 'none';
    showQuizQ();
  }
  function showQuizQ() {
    var q = state.qz.q[state.qz.idx];
    $('qbar-num').textContent = (state.qz.idx + 1);
    var html = '<p class="qp-prompt">' + q.q + '</p><div class="answer-grid">';
    q.opts.forEach(function (o, i) {
      html += '<button class="answer-btn" data-i="' + i + '" type="button">' + o + '</button>';
    });
    html += '</div><div class="quiz-feedback" id="qz-fb" style="margin-top:10px;"></div>';
    $('quiz-panel').innerHTML = html;
    document.querySelectorAll('#quiz-panel .answer-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.classList.contains('locked')) return;
        var i = parseInt(b.dataset.i, 10);
        document.querySelectorAll('#quiz-panel .answer-btn').forEach(function (x) { x.classList.add('locked'); });
        if (i === q.ans) { b.classList.add('correct'); playSuccess(); }
        else {
          b.classList.add('wrong');
          var corr = document.querySelector('#quiz-panel .answer-btn[data-i="' + q.ans + '"]');
          if (corr) corr.classList.add('correct');
          playError();
        }
        $('qz-fb').textContent = q.ex;
        $('qz-fb').className = 'quiz-feedback ' + (i === q.ans ? 'ok' : 'err');
        state.qz.answers.push({ i: i, correct: i === q.ans, q: q });
        setTimeout(function () {
          if (state.qz.idx < state.qz.q.length - 1) {
            state.qz.idx++;
            showQuizQ();
          } else {
            showQuizResult();
          }
        }, 1700);
      });
    });
  }
  function showQuizResult() {
    var ok = state.qz.answers.filter(function (a) { return a.correct; }).length;
    var stars = '★'.repeat(ok) + '☆'.repeat(5 - ok);
    var verdict = ok === 5 ? 'Perfect!' : ok >= 4 ? 'Great work' : ok >= 3 ? 'Solid' : ok >= 2 ? 'Keep practising' : 'Review the basics';
    var cls = ok === 5 ? 'perfect' : ok >= 3 ? 'good' : 'poor';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Results</span><span class="qr-stars">' + stars + '</span></div><div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + ok + ' / 5</div><div class="qr-verdict">' + verdict + '</div></div></div><div class="qr-rows">';
    state.qz.answers.forEach(function (a, i) {
      html += '<div class="qr-row ' + (a.correct ? 'ok' : 'err') + '">'
            + '<span class="qr-qnum">Q' + (i + 1) + '</span>'
            + '<span class="qr-detail">' + a.q.q + '<br><strong>' + (a.correct ? 'Correct.' : 'Correct: ' + a.q.opts[a.q.ans]) + '</strong></span>'
            + '<span class="qr-mark">' + (a.correct ? '✓' : '✗') + '</span></div>';
    });
    html += '</div><div style="text-align:center"><button class="btn btn-primary" id="qz-retry" type="button">Try Again</button></div>';
    $('quiz-result').innerHTML = html;
    $('quiz-result').style.display = '';
    $('quiz-panel').style.display = 'none';
    $('qz-retry').addEventListener('click', function () {
      $('quiz-panel').style.display = '';
      startQuiz();
    });
  }

  /* ── Custom material modal ──────────────────────────────────── */
  function openCM() {
    $('cust-modal').classList.add('active');
    $('cm-name').value = ''; $('cm-k').value = ''; $('cm-rho').value = ''; $('cm-c').value = '';
    $('cm-err').style.display = 'none';
    setTimeout(function () { $('cm-name').focus(); }, 30);
  }
  function closeCM() { $('cust-modal').classList.remove('active'); }
  function addCustom() {
    var name = ($('cm-name').value || '').trim();
    var k_disp = parseFloat($('cm-k').value);
    var rho = parseFloat($('cm-rho').value);
    var c   = parseFloat($('cm-c').value);
    if (!name) return cmErr('Enter a name.');
    if (!isFinite(k_disp) || k_disp <= 0) return cmErr('Enter a positive thermal conductivity.');
    var k_SI = isImp() ? k_disp / 0.5778 : k_disp;
    if (k_SI < 0.01 || k_SI > 3000) return cmErr('Conductivity must be 0.01–3000 W/(m·K).');
    var key = 'custom_' + Date.now();
    var mat = { key: key, name: name, k: k_SI, color: '#ce93d8' };
    if (isFinite(rho) && rho > 0) mat.rho = rho;
    if (isFinite(c)   && c   > 0) mat.c   = c;
    state.customMats.push(mat);
    state.matA = key;
    rebuildSelectors();
    syncControls();
    updateReadouts();
    requestDraw();
    closeCM();
  }
  function cmErr(msg) {
    $('cm-err').textContent = msg;
    $('cm-err').style.display = '';
    playError();
  }

  /* ── Calc modal ─────────────────────────────────────────────── */
  function openCalc() {
    var c = compute();
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Inputs</span>';
    html += '<div class="cs-given">';
    var uP = isImp() ? '\\mathrm{BTU/hr}' : '\\mathrm{W}';
    html += '<span>Material A: ' + c.a.mat.name + '</span>';
    html += '<span>\\(k_A = ' + fmt(toD(c.a.mat.k, 'k')) + '\\;' + (isImp() ? '\\mathrm{BTU/(hr\\,ft\\,°F)}' : '\\mathrm{W/(m \\cdot K)}') + '\\)</span>';
    html += '<span>Material B: ' + c.b.mat.name + '</span>';
    html += '<span>\\(k_B = ' + fmt(toD(c.b.mat.k, 'k')) + '\\;' + (isImp() ? '\\mathrm{BTU/(hr\\,ft\\,°F)}' : '\\mathrm{W/(m \\cdot K)}') + '\\)</span>';
    html += '<span>\\(L = ' + fmt(state.L_m * 100) + '\\;\\mathrm{cm}\\)</span>';
    html += '<span>\\(A = ' + fmt(state.A_m2 * 1e4) + '\\;\\mathrm{cm^2}\\)</span>';
    html += '<span>\\(\\Delta T = ' + fmt(c.a.dT) + '\\;\\mathrm{K}\\)</span>';
    html += '</div><p class="cs-si-note">All calculations performed in SI base units (\\(\\mathrm{W/(m \\cdot K),\\,m,\\,m^2,\\,K}\\)) and converted for display.</p></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 1</span><span class="cs-title">Convert to SI</span></div>';
    html += '<div class="cs-formula">\\[ L_m = \\dfrac{L_{cm}}{100},\\quad A_{m^2} = \\dfrac{A_{cm^2}}{10\\,000} \\]</div>';
    html += '<div class="cs-calc">\\(L = ' + state.L_m.toFixed(4) + '\\;\\mathrm{m},\\quad A = ' + state.A_m2.toExponential(2).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2}\\)</div>';
    html += '<div class="cs-result">\\(\\Delta T = T_H - T_C = ' + state.Th + ' - ' + state.Tc + ' = \\mathbf{' + c.a.dT + '\\;\\mathrm{K}}\\)</div></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 2</span><span class="cs-title">Heat rate — Material A</span></div>';
    html += '<div class="cs-formula">\\[ P_A = k_A \\cdot A \\cdot \\dfrac{\\Delta T}{L} \\]</div>';
    html += '<div class="cs-calc">\\(P_A = ' + c.a.mat.k + ' \\cdot ' + state.A_m2.toExponential(2).replace('e', ' \\times 10^{') + '} \\cdot ' + c.a.dT + ' / ' + state.L_m.toFixed(4) + '\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + fmt(toD(c.a.P, 'pow')) + '\\;' + uP + '}\\)</div></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Heat rate — Material B</span></div>';
    html += '<div class="cs-formula">\\[ P_B = k_B \\cdot A \\cdot \\dfrac{\\Delta T}{L} \\]</div>';
    html += '<div class="cs-calc">\\(P_B = ' + c.b.mat.k + ' \\cdot ' + state.A_m2.toExponential(2).replace('e', ' \\times 10^{') + '} \\cdot ' + c.b.dT + ' / ' + state.L_m.toFixed(4) + '\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + fmt(toD(c.b.P, 'pow')) + '\\;' + uP + '}\\)</div></div>';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 4</span><span class="cs-title">Comparison</span></div>';
    html += '<div class="cs-formula">\\[ \\text{Ratio} = \\dfrac{P_A}{P_B} = \\dfrac{k_A}{k_B} \\quad (\\text{geometry cancels}) \\]</div>';
    html += '<div class="cs-calc">\\(\\dfrac{' + c.a.mat.k + '}{' + c.b.mat.k + '} = ' + fmt(c.ratio) + '\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + fmt(c.ratio) + '\\times}\\) more heat through ' + c.a.mat.name + '</div></div>';

    if (c.a.alpha && c.b.alpha) {
      html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 5</span><span class="cs-title">Travel speed — diffusivity</span></div>';
      html += '<div class="cs-formula">\\[ \\alpha = \\dfrac{k}{\\rho \\cdot c} \\]</div>';
      html += '<div class="cs-calc">\\(\\alpha_A = ' + c.a.mat.k + ' / (' + c.a.mat.rho + ' \\cdot ' + c.a.mat.c + ') = ' + c.a.alpha.toExponential(2).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2/s}\\)</div>';
      html += '<div class="cs-calc">\\(\\alpha_B = ' + c.b.mat.k + ' / (' + c.b.mat.rho + ' \\cdot ' + c.b.mat.c + ') = ' + c.b.alpha.toExponential(2).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^2/s}\\)</div>';
      html += '<div class="cs-result">\\(\\tau_A = \\dfrac{L^2}{4\\alpha_A} = \\mathbf{' + fmt(c.a.tauHalf) + '\\;\\mathrm{s}};\\quad \\tau_B = \\mathbf{' + fmt(c.b.tauHalf) + '\\;\\mathrm{s}}\\)</div></div>';
    }

    $('calc-modal-body').innerHTML = html;
    $('calc-modal').classList.add('active');
  }

  /* ── Export ─────────────────────────────────────────────────── */
  function exportCSV() {
    var c = compute();
    var rows = [
      ['Field', 'Value', 'Unit'],
      ['Material A', c.a.mat.name, ''],
      ['k_A', toD(c.a.mat.k, 'k').toFixed(3), uLabel('k')],
      ['Material B', c.b.mat.name, ''],
      ['k_B', toD(c.b.mat.k, 'k').toFixed(3), uLabel('k')],
      ['Length', (state.L_m * 100).toFixed(2), 'cm'],
      ['Area', (state.A_m2 * 1e4).toFixed(2), 'cm²'],
      ['T_H', state.Th, '°C'],
      ['T_C', state.Tc, '°C'],
      ['ΔT', c.a.dT, 'K'],
      ['P_A', toD(c.a.P, 'pow').toFixed(4), uLabel('pow')],
      ['P_B', toD(c.b.P, 'pow').toFixed(4), uLabel('pow')],
      ['Ratio A/B', c.ratio.toFixed(3), '×'],
      ['α_A', c.a.alpha ? c.a.alpha.toExponential(3) : 'n/a', 'm²/s'],
      ['α_B', c.b.alpha ? c.b.alpha.toExponential(3) : 'n/a', 'm²/s']
    ];
    var csv = rows.map(function (r) { return r.map(function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'thermal_conductivity_' + c.a.mat.key + '_vs_' + c.b.mat.key + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function exportPNG() {
    var src = canvas;
    var tmp = document.createElement('canvas');
    tmp.width = src.width; tmp.height = src.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(src, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 10) fs = 10;
    tc.font = '600 ' + fs + 'px Segoe UI, system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'thermal_conductivity.png';
    a.click();
  }
  function copyResult() {
    var c = compute();
    var s = c.a.mat.name + ' vs ' + c.b.mat.name + ': P_A = ' + fmt(toD(c.a.P, 'pow')) + ' ' + uLabel('pow')
          + ', P_B = ' + fmt(toD(c.b.P, 'pow')) + ' ' + uLabel('pow')
          + ', ratio ' + fmt(c.ratio) + '×';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s);
  }

  /* ── Run/Stop ───────────────────────────────────────────────── */
  function startSim() {
    if (state.running) return;
    state.running = true;
    state.t = 0;
    $('btn-run').disabled = true;
    $('btn-stop').disabled = false;
    playStart();
    requestDraw();
  }
  function stopSim() {
    state.running = false;
    $('btn-run').disabled = false;
    $('btn-stop').disabled = true;
  }
  function resetSim() {
    stopSim();
    state.t = 0;
    requestDraw();
  }

  /* ── Wire events ────────────────────────────────────────────── */
  function wireEvents() {
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () { setMode(p.dataset.mode); playClick(); });
    });
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        if (state.unit === p.dataset.unit) return;
        pushHistory();
        state.unit = p.dataset.unit;
        syncUnitTabs();
        rebuildSelectors();
        syncControls();
        updateReadouts();
        requestDraw();
        playClick();
      });
    });
    $('sel-mat-a').addEventListener('change', function () { pushHistory(); state.matA = $('sel-mat-a').value; updateReadouts(); requestDraw(); });
    $('sel-mat-b').addEventListener('change', function () { pushHistory(); state.matB = $('sel-mat-b').value; updateReadouts(); requestDraw(); });

    /* Sliders */
    $('sl-th').addEventListener('input', function () {
      state.Th = parseFloat($('sl-th').value);
      $('in-th').value = isImp() ? Math.round(state.Th * 1.8 + 32) : Math.round(state.Th);
      updateReadouts(); requestDraw();
    });
    $('sl-tc').addEventListener('input', function () {
      state.Tc = parseFloat($('sl-tc').value);
      $('in-tc').value = isImp() ? Math.round(state.Tc * 1.8 + 32) : Math.round(state.Tc);
      updateReadouts(); requestDraw();
    });
    $('sl-len').addEventListener('input', function () {
      var L_cm = parseFloat($('sl-len').value);
      state.L_m = L_cm / 100;
      $('in-len').value = isImp() ? (L_cm / 2.54).toFixed(1) : L_cm.toFixed(0);
      updateReadouts(); requestDraw();
    });
    $('sl-area').addEventListener('input', function () {
      var A_cm2 = parseFloat($('sl-area').value);
      state.A_m2 = A_cm2 / 1e4;
      $('in-area').value = isImp() ? (A_cm2 / 6.4516).toFixed(2) : A_cm2.toFixed(1);
      updateReadouts(); requestDraw();
    });

    /* Stepper text inputs (commit on change) */
    $('in-th').addEventListener('change', function () {
      var v = parseFloat($('in-th').value);
      if (!isFinite(v)) return;
      state.Th = isImp() ? (v - 32) / 1.8 : v;
      state.Th = Math.min(500, Math.max(20, state.Th));
      syncControls(); updateReadouts(); requestDraw();
    });
    $('in-tc').addEventListener('change', function () {
      var v = parseFloat($('in-tc').value);
      if (!isFinite(v)) return;
      state.Tc = isImp() ? (v - 32) / 1.8 : v;
      state.Tc = Math.min(100, Math.max(-50, state.Tc));
      syncControls(); updateReadouts(); requestDraw();
    });
    $('in-len').addEventListener('change', function () {
      var v = parseFloat($('in-len').value);
      if (!isFinite(v)) return;
      var L_cm = isImp() ? v * 2.54 : v;
      L_cm = Math.min(100, Math.max(2, L_cm));
      state.L_m = L_cm / 100;
      syncControls(); updateReadouts(); requestDraw();
    });
    $('in-area').addEventListener('change', function () {
      var v = parseFloat($('in-area').value);
      if (!isFinite(v)) return;
      var A_cm2 = isImp() ? v * 6.4516 : v;
      A_cm2 = Math.min(50, Math.max(0.5, A_cm2));
      state.A_m2 = A_cm2 / 1e4;
      syncControls(); updateReadouts(); requestDraw();
    });

    /* Steppers */
    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.dataset.dir, 10);
        var kind = b.dataset.step;
        if (kind === 'th') state.Th = Math.min(500, Math.max(20, state.Th + dir * 5));
        if (kind === 'tc') state.Tc = Math.min(100, Math.max(-50, state.Tc + dir * 5));
        if (kind === 'len') state.L_m = Math.min(1.00, Math.max(0.02, state.L_m + dir * 0.01));
        if (kind === 'area') state.A_m2 = Math.min(50e-4, Math.max(0.5e-4, state.A_m2 + dir * 0.5e-4));
        syncControls(); updateReadouts(); requestDraw();
        playClick();
      });
    });

    /* Toggles */
    $('chk-flame').addEventListener('change', function () { state.showFlame = $('chk-flame').checked; requestDraw(); });
    $('chk-particles').addEventListener('change', function () { state.showParticles = $('chk-particles').checked; requestDraw(); });
    $('chk-equation').addEventListener('change', function () { state.showEquation = $('chk-equation').checked; requestDraw(); });
    $('chk-arrow').addEventListener('change', function () { state.showArrow = $('chk-arrow').checked; requestDraw(); });
    $('chk-grid').addEventListener('change', function () { state.showGrid = $('chk-grid').checked; requestDraw(); });

    /* Action bar */
    $('btn-run').addEventListener('click', startSim);
    $('btn-stop').addEventListener('click', function () { stopSim(); playClick(); });
    $('btn-reset').addEventListener('click', function () { resetSim(); playClick(); });
    $('btn-undo').addEventListener('click', function () { doUndo(); playClick(); });
    $('btn-redo').addEventListener('click', function () { doRedo(); playClick(); });
    $('btn-csv').addEventListener('click', function () { exportCSV(); playClick(); });
    $('btn-png').addEventListener('click', function () { exportPNG(); playClick(); });
    $('btn-calc').addEventListener('click', function () { openCalc(); playClick(); });
    $('calc-modal-close').addEventListener('click', function () { $('calc-modal').classList.remove('active'); });
    $('calc-modal').addEventListener('click', function (e) { if (e.target === $('calc-modal')) $('calc-modal').classList.remove('active'); });

    /* Custom modal */
    $('btn-custom').addEventListener('click', openCM);
    $('cust-modal-close').addEventListener('click', closeCM);
    $('cm-cancel').addEventListener('click', closeCM);
    $('cm-add').addEventListener('click', addCustom);
    $('cust-modal').addEventListener('click', function (e) { if (e.target === $('cust-modal')) closeCM(); });

    /* Learning panels */
    $('learn-expand-all').addEventListener('click', function () { document.querySelectorAll('.learn-card').forEach(function (c) { c.open = true; }); playClick(); });
    $('learn-collapse-all').addEventListener('click', function () { document.querySelectorAll('.learn-card').forEach(function (c) { c.open = false; }); playClick(); });

    /* Explore */
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        document.querySelectorAll('#cat-tabs .pill').forEach(function (x) { x.classList.toggle('active', x === p); });
        buildExplore();
        playClick();
      });
    });

    /* Practice */
    $('pp-check').addEventListener('click', checkPractice);
    $('pp-show').addEventListener('click', showSolution);
    $('pp-next').addEventListener('click', newPractice);
    $('pp-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (!$('pp-check').disabled) checkPractice();
        else if ($('pp-next').style.display !== 'none') newPractice();
      }
    });

    /* Right-click menu */
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var menu = $('ctx-menu');
      menu.style.display = 'block';
      menu.style.left = e.clientX + 'px';
      menu.style.top  = e.clientY + 'px';
    });
    document.addEventListener('click', function () { $('ctx-menu').style.display = 'none'; });
    document.querySelectorAll('#ctx-menu .ctx-item').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.dataset.ctx;
        if (act === 'copy-result') copyResult();
        else if (act === 'csv') exportCSV();
        else if (act === 'png') exportPNG();
        else if (act === 'reset') resetSim();
        $('ctx-menu').style.display = 'none';
      });
    });

    /* Keyboard shortcuts */
    document.addEventListener('keydown', function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) doRedo(); else doUndo();
      }
    });
    window.addEventListener('resize', requestDraw);
  }

  /* ── Init ───────────────────────────────────────────────────── */
  function init() {
    rebuildSelectors();
    rebuildPresets();
    syncControls();
    syncUnitTabs();
    wireEvents();
    setMode('simulate');
    document.querySelectorAll('.preset-chip').forEach(function (c) { c.classList.toggle('active', c.textContent === 'Default'); });
    requestDraw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
