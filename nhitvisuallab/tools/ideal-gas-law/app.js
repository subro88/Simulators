/* ── Ideal Gas Law Simulator — app.js v=11 ──────────────────
   PV = nRT  |  Simulate · Explore · Practice · Quiz
   v10: hover tooltip · process path trail · ghost dots ·
        process type badge · formula flash · isotherm hover ·
        smooth axis animation · keyboard shortcut (Space) ·
        sessionStorage practice score · PNG export + watermark
   ──────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════
     1. CONSTANTS & DOM REFS
  ═══════════════════════════════════════════════════════ */
  var R_CONST = 8.314; // J/(mol·K)

  function calcP(n, T, V) { return (n * R_CONST * T) / V; }   // kPa (V in L)
  function calcV(n, T, P) { return (n * R_CONST * T) / P; }   // L
  function calcT(n, P, V) { return (P * V) / (n * R_CONST); } // K
  function calcN(P, V, T) { return (P * V) / (R_CONST * T); } // mol

  var canvas = document.getElementById('sim-canvas');
  var ctx    = canvas.getContext('2d');

  var modeTabs = document.querySelectorAll('#mode-tabs .pill');
  var sections = {
    simulate: document.getElementById('sim-section'),
    explore:  document.getElementById('explore-section'),
    practice: document.getElementById('practice-section'),
    quiz:     document.getElementById('quiz-section')
  };

  var lockTabs = document.querySelectorAll('#lock-tabs .pill');

  var slN = document.getElementById('sl-n');
  var slT = document.getElementById('sl-T');
  var slV = document.getElementById('sl-V');
  var slP = document.getElementById('sl-P');
  var outN = document.getElementById('out-n');
  var outT = document.getElementById('out-T');
  var outV = document.getElementById('out-V');
  var outP = document.getElementById('out-P');

  var dispP = document.getElementById('disp-P');
  var dispV = document.getElementById('disp-V');
  var dispN = document.getElementById('disp-n');
  var dispT = document.getElementById('disp-T');
  var fpP = document.getElementById('hdr-P');
  var fpV = document.getElementById('hdr-V');
  var fpN = document.getElementById('hdr-n');
  var fpT = document.getElementById('hdr-T');

  var rowN = document.getElementById('row-n');
  var rowT = document.getElementById('row-T');
  var rowV = document.getElementById('row-V');
  var rowP = document.getElementById('row-P');
  var badgeP = document.getElementById('badge-P');
  var badgeV = document.getElementById('badge-V');
  var badgeT = document.getElementById('badge-T');
  var badgeN = document.getElementById('badge-n');

  var lockedToast     = document.getElementById('locked-toast');
  var lockedToastText = document.getElementById('locked-toast-text');
  var dotTooltip      = document.getElementById('dot-tooltip');

  var gasTabs = document.querySelectorAll('#gas-tabs .pill');

  /* ══════════════════════════════════════════════════════
     2. STATE
  ═══════════════════════════════════════════════════════ */
  var mode   = 'simulate';
  var solved = 'P';
  var gas    = 'air';

  var gasColors = {
    air:      ['#90caf9', '#64b5f6', '#ffa726', '#ef5350'],
    helium:   ['#80deea', '#26c6da', '#ffe082', '#ff7043'],
    co2:      ['#a5d6a7', '#66bb6a', '#ffcc02', '#e53935'],
    nitrogen: ['#ce93d8', '#ab47bc', '#ff8a65', '#f44336']
  };

  /* ================================================================
     DISPLAY UNITS  (display only — PV = nRT is solved in kPa, L, K)
     US practice states gas problems in psi, cubic feet and °F. Amount of
     substance is in moles in both systems (the mole is SI and universal).
     ================================================================ */
  var unitSys = 'si';
  function isImp() { return unitSys === 'imp'; }
  function pD(kPa) { return isImp() ? kPa * 0.1450377 : kPa; }        /* kPa → psi  */
  function pS(psi) { return isImp() ? psi / 0.1450377 : psi; }
  function uP()    { return isImp() ? 'psi' : 'kPa'; }
  function vD(L)   { return isImp() ? L * 0.0353147 : L; }            /* L   → ft³  */
  function vS(ft3) { return isImp() ? ft3 / 0.0353147 : ft3; }
  function uV()    { return isImp() ? 'ft\u00b3' : 'L'; }
  function tD(K)   { return isImp() ? (K - 273.15) * 9 / 5 + 32 : K; }/* K   → °F   */
  function uT()    { return isImp() ? '\u00b0F' : 'K'; }
  /* absolute temperature in the display system, for the secondary reading */
  function tAbsD(K){ return isImp() ? K * 1.8 : K; }                  /* K   → °R   */
  function uTAbs() { return isImp() ? '\u00b0R' : 'K'; }

  var state = { n: 0.10, T: 243, V: 2.0, P: 0 };
  state.P = calcP(state.n, state.T, state.V);

  var particles    = [];
  var MAX_PARTICLES = 80;
  var animFrame    = null;
  var lastTime     = 0;

  // Canvas logical dimensions (CSS pixels)
  var canvasLogW = 0, canvasLogH = 0;

  // Projection lines
  var projActive   = false;
  var projProgress = 0;

  // ── NEW v10 state ──────────────────────────────────────
  // Path trail & ghost dots
  var pathHistory = [];
  var MAX_HISTORY = 60;

  // Process type detection
  var lastMovedSlider   = null;  // 'P'|'V'|'T'|'n'
  var processType       = '';    // 'isothermal'|'isobaric'|'isochoric'|''
  var formulaFlashTimer = null;

  // Smooth axis animation (lerped each frame toward target)
  var axisAnim = { Vmin: 0.3, Vmax: 10, Pmin: 5, Pmax: 1000 };

  // Isotherm hover: -1=none, 0=T/2, 1=T, 2=2T
  var hoveredIso = -1;

  /* ══════════════════════════════════════════════════════
     3. PARTICLE SYSTEM
  ═══════════════════════════════════════════════════════ */
  function makeParticle(W, H) {
    var angle = Math.random() * Math.PI * 2;
    var speed = 60 + Math.random() * 40;
    return {
      x: 20 + Math.random() * (W - 40),
      y: 20 + Math.random() * (H - 40),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 3 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2
    };
  }

  function syncParticles(W, H) {
    var target = Math.round(Math.min(MAX_PARTICLES, Math.max(2, state.n * 16)));
    while (particles.length < target) particles.push(makeParticle(W, H));
    while (particles.length > target) particles.pop();
  }

  function particleColor(T) {
    var cols = gasColors[gas] || gasColors.air;
    var t = (T - 100) / 700;
    t = Math.max(0, Math.min(1, t));
    var idx, f;
    if (t < 0.33)      { idx = 0; f = t / 0.33; }
    else if (t < 0.66) { idx = 1; f = (t - 0.33) / 0.33; }
    else               { idx = 2; f = (t - 0.66) / 0.34; }
    return lerpColor(cols[idx], cols[idx + 1], f);
  }

  function lerpColor(a, b, t) {
    var ar = parseInt(a.slice(1,3),16), ag = parseInt(a.slice(3,5),16), ab = parseInt(a.slice(5,7),16);
    var br = parseInt(b.slice(1,3),16), bg = parseInt(b.slice(3,5),16), bb = parseInt(b.slice(5,7),16);
    var r  = Math.round(ar + (br-ar)*t).toString(16).padStart(2,'0');
    var g  = Math.round(ag + (bg-ag)*t).toString(16).padStart(2,'0');
    var bh = Math.round(ab + (bb-ab)*t).toString(16).padStart(2,'0');
    return '#' + r + g + bh;
  }

  function updateParticles(dt, W, H) {
    var speedScale = Math.sqrt(state.T / 300);
    particles.forEach(function (p) {
      p.x += p.vx * speedScale * dt;
      p.y += p.vy * speedScale * dt;
      p.phase += dt * 3;
      if (p.x - p.r < 0)  { p.x = p.r;     p.vx =  Math.abs(p.vx); }
      if (p.x + p.r > W)  { p.x = W - p.r;  p.vx = -Math.abs(p.vx); }
      if (p.y - p.r < 0)  { p.y = p.r;     p.vy =  Math.abs(p.vy); }
      if (p.y + p.r > H)  { p.y = H - p.r;  p.vy = -Math.abs(p.vy); }
    });
  }

  /* ══════════════════════════════════════════════════════
     4. CANVAS DRAW
  ═══════════════════════════════════════════════════════ */
  function sizeCanvas() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.parentElement.clientWidth - 20;
    var h = Math.round(w * 0.42);
    canvasLogW = w; canvasLogH = h;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(ts) {
    if (!ts) ts = 0;
    var dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    // Advance projection animation (400 ms total)
    if (projActive && projProgress < 1) {
      projProgress = Math.min(1, projProgress + dt / 0.4);
    }

    // ── Smooth axis bounds animation ──────────────────────
    var _Vmin = 0.3,  _Vmax = 10;
    var _Pmin = 5,    _Pmax = 1000;
    if (state.V >= _Vmax) _Vmax = state.V * 1.3;
    if (state.V <= _Vmin) _Vmin = Math.max(0.05, state.V * 0.75);
    if (state.P >= _Pmax) _Pmax = state.P * 1.3;
    if (state.P <= _Pmin) _Pmin = Math.max(0.5, state.P * 0.75);
    var lf = Math.min(1, dt * 8); // converges in ~300 ms
    axisAnim.Vmin += (_Vmin - axisAnim.Vmin) * lf;
    axisAnim.Vmax += (_Vmax - axisAnim.Vmax) * lf;
    axisAnim.Pmin += (_Pmin - axisAnim.Pmin) * lf;
    axisAnim.Pmax += (_Pmax - axisAnim.Pmax) * lf;

    var W = canvasLogW, H = canvasLogH;
    var contW  = Math.round(W * 0.45);
    var graphX = contW + 20;
    var graphW = W - graphX - 10;
    var graphH = H - 20;
    var graphY = 10;

    ctx.clearRect(0, 0, W, H);

    // ── Gas container ─────────────────────────────────────
    // Scale relative to axis Vmax so container never overflows its panel.
    // Use a dynamic reference: max(10, current Vmax target) so proportion
    // still feels meaningful even when V is large.
    var contVmax = Math.max(10, axisAnim.Vmax);
    var volFrac  = Math.min(1.0, state.V / contVmax);
    /* The container width is a claim about the volume, so it must stay
       proportional to V over as much of the slider as possible.

       The old guard floored volFrac at 0.10 of the panel, which on a desktop
       canvas meant every volume from the slider minimum (0.5 L) up to 1.0 L
       drew an identical container — a dead zone across the bottom of the range,
       and precisely where the pressure is highest and the demonstration most
       vivid. Flooring in PIXELS instead keeps the mapping proportional from
       ~0.55 L upward while still guaranteeing an interior wide enough to hold
       a particle (the floor only binds on narrow phone canvases). */
    var cx       = Math.round((contW - 8) * volFrac); // -8 leaves a gap from panel edge
    cx           = Math.max(24, cx);                  // ~14px usable interior
    var cxOff    = Math.round((contW - cx) / 2);

    ctx.fillStyle = '#1a2038';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    roundRect(ctx, cxOff, 10, cx, H - 20, 8);
    ctx.fill();
    ctx.stroke();

    // Piston
    ctx.fillStyle = '#334';
    roundRect(ctx, cxOff + cx - 6, 10, 6, H - 20, 2);
    ctx.fill();
    ctx.fillStyle = '#7c6fa0';
    ctx.fillRect(cxOff + cx - 6, 10, 2, H - 20);

    // Pressure glow
    var pglow = Math.min(1, (state.P - 10) / 990);
    if (pglow > 0.05) {
      ctx.save();
      var grad = ctx.createRadialGradient(cxOff + cx/2, H/2, 0, cxOff + cx/2, H/2, cx/2);
      grad.addColorStop(0, 'rgba(156,39,176,' + (pglow * 0.18) + ')');
      grad.addColorStop(1, 'rgba(156,39,176,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(cxOff, 10, cx, H - 20);
      ctx.restore();
    }

    // Particles
    syncParticles(cx - 10, H - 30);
    if (dt > 0) updateParticles(dt, cx - 10, H - 30);
    var pColor = particleColor(state.T);
    particles.forEach(function (p) {
      var glow = Math.sin(p.phase) * 0.4 + 0.6;
      ctx.save();
      ctx.translate(cxOff + 5 + p.x, 15 + p.y);
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = hexToRgba(pColor, glow * 0.35);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, Math.PI * 2);
      ctx.fillStyle = pColor;
      ctx.globalAlpha = 0.85 + glow * 0.15;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    });

    // Container labels
    ctx.fillStyle = '#9aaac8';
    ctx.font = '12px ' + "'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('V = ' + vD(state.V).toFixed(isImp() ? 3 : 1) + ' ' + uV(), cxOff + cx/2, H - 2);
    ctx.fillText('T = ' + (isImp() ? tD(state.T).toFixed(0) : Math.round(state.T)) + ' ' + uT(), cxOff + cx/2, H - 16);

    // ── PV Diagram ─────────────────────────────────────────
    drawPVGraph(ctx, graphX, graphY, graphW, graphH);

    animFrame = requestAnimationFrame(draw);
  }

  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1,3),16);
    var g = parseInt(hex.slice(3,5),16);
    var b = parseInt(hex.slice(5,7),16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(2) + ')';
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

  function niceTicks(min, max, targetCount) {
    var range = max - min;
    if (range <= 0) return [];
    var rough = range / targetCount;
    var mag   = Math.pow(10, Math.floor(Math.log10(rough)));
    var norm  = rough / mag;
    var step  = norm < 1.5 ? mag : norm < 3.5 ? 2*mag : norm < 7.5 ? 5*mag : 10*mag;
    var ticks = [];
    var start = Math.ceil((min + step * 0.01) / step) * step;
    for (var t = start; t < max - step * 0.01; t += step) {
      ticks.push(parseFloat(t.toFixed(10)));
    }
    return ticks;
  }

  function drawPVGraph(ctx, gx, gy, gw, gh) {
    var padL = 52, padT = 14, padR = 6, padB = 24;
    var x0 = gx + padL, y0 = gy + padT;
    var xw = gw - padL - padR;
    var yh = gh - padT - padB;

    // Use animated axis bounds
    var Vmin = axisAnim.Vmin, Vmax = axisAnim.Vmax;
    var Pmin = axisAnim.Pmin, Pmax = axisAnim.Pmax;
    var Vcur = state.V, Pcur = state.P;

    function toScreen(V, P) {
      return {
        sx: x0 + (V - Vmin) / (Vmax - Vmin) * xw,
        sy: y0 + yh - (P - Pmin) / (Pmax - Pmin) * yh
      };
    }

    // ── Axes ──────────────────────────────────────────────
    ctx.strokeStyle = '#4a5878';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + yh);
    ctx.lineTo(x0 + xw, y0 + yh);
    ctx.stroke();

    // ── Grid + tick labels ─────────────────────────────────
    ctx.font = '11px sans-serif';
    niceTicks(Pmin, Pmax, 5).forEach(function (p) {
      var sy = y0 + yh - (p - Pmin) / (Pmax - Pmin) * yh;
      ctx.strokeStyle = '#28334e'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(x0 + 1, sy); ctx.lineTo(x0 + xw, sy); ctx.stroke();
      ctx.fillStyle = '#8898b8'; ctx.textAlign = 'right';
      var pd = pD(p);
      var label = pd >= 1000 ? (pd/1000).toFixed(1)+'k' : (isImp() ? pd.toFixed(1) : (pd % 1 === 0 ? pd : pd.toFixed(1)));
      ctx.fillText(label, x0 - 5, sy + 4);
    });
    niceTicks(Vmin, Vmax, 5).forEach(function (v) {
      var sx = x0 + (v - Vmin) / (Vmax - Vmin) * xw;
      ctx.strokeStyle = '#28334e'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(sx, y0); ctx.lineTo(sx, y0 + yh - 1); ctx.stroke();
      ctx.fillStyle = '#8898b8'; ctx.textAlign = 'center';
      var vd = vD(v);
      var label = isImp() ? vd.toFixed(3) : (vd % 1 === 0 ? vd : vd.toFixed(1));
      ctx.fillText(label, sx, y0 + yh + 15);
    });

    // ── Axis labels ────────────────────────────────────────
    ctx.fillStyle = '#a0b0cc'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('V (' + uV() + ')', x0 + xw / 2, y0 + yh + padB - 2);
    ctx.save();
    ctx.translate(gx + 11, y0 + yh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('P (' + uP() + ')', 0, 0);
    ctx.restore();

    // ── Isotherms at T/2, T, 2T (with hover highlighting) ──
    var accentRGB = '156,39,176';
    var isoConfigs = [
      { T: state.T / 2, alpha: 0.40, lw: 1, label: 'T/2', idx: 0 },
      { T: state.T,     alpha: 0.90, lw: 2, label: 'T',   idx: 1 },
      { T: state.T * 2, alpha: 0.40, lw: 1, label: '2T',  idx: 2 }
    ];

    isoConfigs.forEach(function (iso) {
      if (iso.T <= 0) return;
      var isHov  = (hoveredIso === iso.idx);
      var alpha  = isHov ? Math.min(1, iso.alpha + 0.45) : iso.alpha;
      var lw     = isHov ? iso.lw + 1.5 : iso.lw;

      ctx.beginPath();
      var first = true;
      for (var v = Vmin; v <= Vmax; v += 0.05) {
        var p = calcP(state.n, iso.T, v);
        if (p < Pmin || p > Pmax) { first = true; continue; }
        var pt = toScreen(v, p);
        if (first) { ctx.moveTo(pt.sx, pt.sy); first = false; }
        else ctx.lineTo(pt.sx, pt.sy);
      }
      ctx.strokeStyle = 'rgba(' + accentRGB + ',' + alpha + ')';
      ctx.lineWidth = lw;
      ctx.stroke();

      // Regular short label near left edge
      var lV = Math.max(Vmin + (Vmax - Vmin) * 0.1, 0.5);
      var lP = calcP(state.n, iso.T, lV);
      if (lP > Pmin && lP < Pmax) {
        var lpt = toScreen(lV, lP);
        ctx.fillStyle = 'rgba(' + accentRGB + ',' + Math.min(1, alpha + 0.1) + ')';
        ctx.font = isHov ? 'bold 11px sans-serif' : 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(iso.label, lpt.sx + 3, lpt.sy - 4);
      }

      // Hovered: show "T = ___ K" pill in centre of curve
      if (isHov) {
        var hvV = Vmin + (Vmax - Vmin) * 0.55;
        var hvP = calcP(state.n, iso.T, hvV);
        if (hvP > Pmin && hvP < Pmax) {
          var hvPt = toScreen(hvV, hvP);
          var tStr = 'T = ' + Math.round(iso.T) + ' K';
          ctx.font = 'bold 11px sans-serif';
          var tw = ctx.measureText(tStr).width;
          // Background pill
          ctx.fillStyle = 'rgba(22,27,39,0.90)';
          ctx.fillRect(hvPt.sx - tw/2 - 6, hvPt.sy - 17, tw + 12, 15);
          ctx.strokeStyle = 'rgba(' + accentRGB + ',0.7)';
          ctx.lineWidth = 1;
          ctx.strokeRect(hvPt.sx - tw/2 - 6, hvPt.sy - 17, tw + 12, 15);
          ctx.fillStyle = 'rgba(' + accentRGB + ',1)';
          ctx.textAlign = 'center';
          ctx.fillText(tStr, hvPt.sx, hvPt.sy - 6);
        }
      }
    });

    // ── Path trail (dashed line through history) ───────────
    if (pathHistory.length > 1) {
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = 'rgba(206,147,216,0.28)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var trFirst = true;
      pathHistory.forEach(function (pt) {
        if (pt.V < Vmin || pt.V > Vmax || pt.P < Pmin || pt.P > Pmax) {
          trFirst = true; return;
        }
        var sp = toScreen(pt.V, pt.P);
        if (trFirst) { ctx.moveTo(sp.sx, sp.sy); trFirst = false; }
        else          ctx.lineTo(sp.sx, sp.sy);
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Ghost dots — last 3 positions before current
      var ghostCount = Math.min(3, pathHistory.length - 1);
      for (var gi = pathHistory.length - 1 - ghostCount; gi < pathHistory.length - 1; gi++) {
        var gpt = pathHistory[gi];
        if (gpt.V < Vmin || gpt.V > Vmax || gpt.P < Pmin || gpt.P > Pmax) continue;
        var age    = (pathHistory.length - 1 - gi) / ghostCount; // 1=oldest, 0=newest-1
        var gAlpha = 0.10 + (1 - age) * 0.28;
        var gRad   = 2.5  + (1 - age) * 1.5;
        var gs = toScreen(gpt.V, gpt.P);
        ctx.beginPath();
        ctx.arc(gs.sx, gs.sy, gRad, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(206,147,216,' + gAlpha.toFixed(2) + ')';
        ctx.fill();
      }
    }

    // ── State dot position ─────────────────────────────────
    var cur = toScreen(Vcur, Pcur);

    // ── Projection lines (drawn BEFORE dot so dot is on top) ─
    if (projActive && projProgress > 0) {
      var eased = 1 - Math.pow(1 - projProgress, 3); // ease-out cubic
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(206,147,216,0.7)';
      ctx.lineWidth = 1.5;
      // Vertical to X axis
      ctx.beginPath();
      ctx.moveTo(cur.sx, cur.sy);
      ctx.lineTo(cur.sx, cur.sy + (y0 + yh - cur.sy) * eased);
      ctx.stroke();
      // Horizontal to Y axis
      ctx.beginPath();
      ctx.moveTo(cur.sx, cur.sy);
      ctx.lineTo(cur.sx - (cur.sx - x0) * eased, cur.sy);
      ctx.stroke();
      ctx.setLineDash([]);
      // Axis ticks + value labels fade in as lines reach targets
      if (eased > 0.8) {
        var tAlpha = Math.min(1, (eased - 0.8) / 0.2);
        ctx.strokeStyle = 'rgba(206,147,216,' + tAlpha + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cur.sx, y0 + yh - 5); ctx.lineTo(cur.sx, y0 + yh + 5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x0 - 5, cur.sy); ctx.lineTo(x0 + 5, cur.sy); ctx.stroke();
        ctx.fillStyle = 'rgba(206,147,216,' + tAlpha + ')';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(vD(Vcur).toFixed(isImp() ? 4 : 2) + ' ' + uV(), cur.sx, y0 + yh + 20);
        ctx.textAlign = 'right';
        ctx.fillText(pD(Pcur).toFixed(isImp() ? 2 : 1) + ' ' + uP(), x0 - 7, cur.sy + 4);
      }
      ctx.restore();
    }

    // ── Current state dot (pulsing) ────────────────────────
    var pulse = (Math.sin(Date.now() / 300) + 1) / 2;
    // Halo
    ctx.beginPath();
    ctx.arc(cur.sx, cur.sy, 10 + pulse * 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + accentRGB + ',' + (0.18 + pulse * 0.12) + ')';
    ctx.fill();
    // Dot
    ctx.beginPath();
    ctx.arc(cur.sx, cur.sy, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ce93d8';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Coord label (guarded against all four edges)
    ctx.fillStyle = '#e4eaff';
    ctx.font = 'bold 11px sans-serif';
    var coordLabel = '(' + vD(Vcur).toFixed(isImp() ? 4 : 2) + ' ' + uV() + ',  ' + pD(Pcur).toFixed(isImp() ? 2 : 1) + ' ' + uP() + ')';
    var lx = cur.sx + 10, ly = cur.sy - 10;
    if (lx + 130 > x0 + xw) lx = cur.sx - 135;
    if (lx < x0)            lx = x0 + 2;
    if (ly < y0 + 12)       ly = cur.sy + 20;
    if (ly > y0 + yh - 4)   ly = cur.sy - 14;
    ctx.textAlign = 'left';
    ctx.fillText(coordLabel, lx, ly);

    // ── Process type badge (top-right of graph) ────────────
    if (processType) {
      var procText = processType === 'isothermal' ? 'Isothermal \u00b7 T\u00a0=\u00a0' + Math.round(state.T) + '\u00a0K'
                   : processType === 'isobaric'   ? 'Isobaric \u00b7 P\u00a0=\u00a0' + state.P.toFixed(1) + '\u00a0kPa'
                   : processType === 'isochoric'  ? 'Isochoric \u00b7 V\u00a0=\u00a0' + state.V.toFixed(2) + '\u00a0L'
                   : '';
      if (procText) {
        ctx.save();
        ctx.font = 'bold 10px sans-serif';
        var ptw = ctx.measureText(procText).width;
        var bx = x0 + xw - ptw - 14, by = y0 + 2, bw = ptw + 10, bh = 15;
        ctx.fillStyle = 'rgba(22,27,39,0.88)';
        roundRect(ctx, bx, by, bw, bh, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(156,39,176,0.55)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#ce93d8';
        ctx.textAlign = 'right';
        ctx.fillText(procText, x0 + xw - 7, by + 10);
        ctx.restore();
      }
    }

    // ── Title ──────────────────────────────────────────────
    ctx.fillStyle = '#8898b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('P-V Diagram  (n = ' + state.n.toFixed(2) + ' mol)', x0, gy + 10);
  }

  /* ══════════════════════════════════════════════════════
     5. STATE UPDATE & UI SYNC
  ═══════════════════════════════════════════════════════ */
  function computeProcessType() {
    if (!lastMovedSlider) { processType = ''; return; }
    var key = solved + '-' + lastMovedSlider;
    var map = {
      'P-V': 'isothermal', 'P-T': 'isochoric', 'P-n': '',
      'V-P': 'isothermal', 'V-T': 'isobaric',  'V-n': '',
      'T-V': 'isobaric',   'T-P': 'isochoric', 'T-n': '',
      'n-P': '',           'n-V': '',           'n-T': ''
    };
    processType = map[key] !== undefined ? map[key] : '';
  }

  function flashFormula(movedKey) {
    var elMap = { P: fpP, V: fpV, T: fpT, n: fpN };
    clearTimeout(formulaFlashTimer);
    [fpP, fpV, fpT, fpN].forEach(function (el) { el.classList.remove('flashing'); });
    void fpP.offsetWidth; // reflow to restart CSS animation
    if (elMap[movedKey]) elMap[movedKey].classList.add('flashing');
    if (elMap[solved] && solved !== movedKey) elMap[solved].classList.add('flashing');
    formulaFlashTimer = setTimeout(function () {
      [fpP, fpV, fpT, fpN].forEach(function (el) { el.classList.remove('flashing'); });
    }, 700);
  }

  function updateState() {
    var n = parseFloat(slN.value);
    var T = parseFloat(slT.value);
    var V = parseFloat(slV.value);
    var P = parseFloat(slP.value);

    switch (solved) {
      case 'P': P = calcP(n, T, V); break;
      case 'V': V = calcV(n, T, P); V = Math.max(0.1, Math.min(20, V)); break;
      case 'T': T = calcT(n, P, V); T = Math.max(1, Math.min(2000, T)); break;
      case 'n': n = calcN(P, V, T); n = Math.max(0.01, Math.min(20, n)); break;
    }

    state.n = n; state.T = T; state.V = V; state.P = P;

    // Dismiss projection when any variable changes
    projActive = false; projProgress = 0;

    // Push to path history
    pathHistory.push({ V: state.V, P: state.P });
    if (pathHistory.length > MAX_HISTORY) pathHistory.shift();

    // Recompute process type
    computeProcessType();

    // Outputs
    outN.textContent = n.toFixed(2) + ' mol';
    outT.textContent = isImp()
      ? tD(T).toFixed(1) + '\u00b0F (' + tAbsD(T).toFixed(0) + ' \u00b0R)'
      : Math.round(T) + ' K (' + (T - 273.15).toFixed(1) + '\u00b0C)';
    outV.textContent = vD(V).toFixed(isImp() ? 4 : 2) + ' ' + uV();
    outP.textContent = isImp()
      ? pD(P).toFixed(2) + ' psi (' + (P / 101.325).toFixed(3) + ' atm)'
      : P.toFixed(1) + ' kPa (' + (P / 101.325).toFixed(3) + ' atm)';

    dispP.textContent = pD(P).toFixed(isImp() ? 2 : 1);
    dispV.textContent = vD(V).toFixed(isImp() ? 4 : 2);
    dispN.textContent = n.toFixed(2);
    dispT.textContent = isImp() ? tD(T).toFixed(0) : Math.round(T);
    var hu = { 'hu-P': uP(), 'hu-V': uV(), 'hu-T': uT() };
    Object.keys(hu).forEach(function (id) {
      var e = document.getElementById(id); if (e) e.textContent = hu[id];
    });

    [fpP, fpV, fpN, fpT].forEach(function (el) { el.classList.remove('solved'); });
    var fmap = { P: fpP, V: fpV, n: fpN, T: fpT };
    if (fmap[solved]) fmap[solved].classList.add('solved');
  }

  function showSolvedRow() {
    [slP, slN, slV, slT].forEach(function (s) { s.disabled = false; });
    var slMap = { P: slP, V: slV, T: slT, n: slN };
    if (slMap[solved]) slMap[solved].disabled = true;

    slP.value = Math.max(10,  Math.min(1000, state.P));
    slN.value = Math.max(0.1, Math.min(5.0,  state.n));
    slV.value = Math.max(0.5, Math.min(10.0, state.V));
    slT.value = Math.max(100, Math.min(800,  state.T));

    var rowMap   = { P: rowP, V: rowV, T: rowT, n: rowN };
    var badgeMap = { P: badgeP, V: badgeV, T: badgeT, n: badgeN };
    Object.keys(rowMap).forEach(function (k) {
      rowMap[k].classList.toggle('solved-row', k === solved);
      badgeMap[k].classList.toggle('hidden', k !== solved);
    });
  }

  /* ══════════════════════════════════════════════════════
     6. MODE SWITCHING
  ═══════════════════════════════════════════════════════ */
  function switchMode(m) {
    mode = m;
    Object.keys(sections).forEach(function (k) {
      sections[k].classList.toggle('hidden', k !== m);
    });
    if (m === 'simulate') {
      if (!animFrame) animFrame = requestAnimationFrame(draw);
    } else {
      if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    }
    if (m === 'explore')  renderExplore(currentExpTab);
    if (m === 'practice') {
      // Restore practice score from sessionStorage
      try {
        var saved = sessionStorage.getItem('igPracScore');
        if (saved) {
          var sc = JSON.parse(saved);
          pracCorrect = sc.correct || 0;
          pracTotal   = sc.total   || 0;
          document.getElementById('prac-correct').textContent = pracCorrect;
          document.getElementById('prac-total').textContent   = pracTotal;
        }
      } catch (e) {}
      newProblem();
    }
    if (m === 'quiz') startQuiz();
  }

  modeTabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      modeTabs.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      switchMode(btn.dataset.value);
    });
  });

  /* ══════════════════════════════════════════════════════
     7. LOCK TABS (solve for)
  ═══════════════════════════════════════════════════════ */
  lockTabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      lockTabs.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      solved = btn.dataset.lock;
      lastMovedSlider = null;
      processType     = '';
      pathHistory     = []; // clear trail when solve target changes
      updateState();
      showSolvedRow();
    });
  });

  /* ══════════════════════════════════════════════════════
     8. CANVAS MOUSE — projection, hover tooltip, isotherm
  ═══════════════════════════════════════════════════════ */
  function hitTestDot(ex, ey) {
    var W = canvasLogW, H = canvasLogH;
    var contW = Math.round(W * 0.45);
    var gx = contW + 20;
    var gw = W - gx - 10, gh = H - 20;
    var padL = 52, padT = 14, padR = 6, padB = 24;
    var x0 = gx + padL, y0 = 10 + padT;
    var xw = gw - padL - padR, yh = gh - padT - padB;
    var dotX = x0 + (state.V - axisAnim.Vmin) / (axisAnim.Vmax - axisAnim.Vmin) * xw;
    var dotY = y0 + yh - (state.P - axisAnim.Pmin) / (axisAnim.Pmax - axisAnim.Pmin) * yh;
    var dx = ex - dotX, dy = ey - dotY;
    return Math.sqrt(dx * dx + dy * dy) < 20;
  }

  function getGraphGeom() {
    var W = canvasLogW, H = canvasLogH;
    var contW = Math.round(W * 0.45);
    var gx = contW + 20;
    var gw = W - gx - 10, gh = H - 20;
    return {
      x0: gx + 52, y0: 10 + 14,
      xw: gw - 52 - 6,
      yh: gh - 14 - 24
    };
  }

  canvas.addEventListener('mousemove', function (e) {
    if (mode !== 'simulate') {
      canvas.style.cursor = '';
      dotTooltip.classList.add('hidden');
      return;
    }
    var ex = e.offsetX, ey = e.offsetY;
    var onDot = hitTestDot(ex, ey);
    canvas.style.cursor = onDot ? 'pointer' : 'default';

    // Dot hover tooltip
    if (onDot) {
      dotTooltip.textContent = 'V\u00a0=\u00a0' + state.V.toFixed(2) + ' L\u2002\u00b7\u2002P\u00a0=\u00a0' + state.P.toFixed(1) + ' kPa';
      dotTooltip.style.left = (e.clientX + 14) + 'px';
      dotTooltip.style.top  = (e.clientY - 38) + 'px';
      dotTooltip.classList.remove('hidden');
    } else {
      dotTooltip.classList.add('hidden');
    }

    // Isotherm hover detection
    var g = getGraphGeom();
    hoveredIso = -1;
    if (ex >= g.x0 && ex <= g.x0 + g.xw && ey >= g.y0 && ey <= g.y0 + g.yh) {
      var v = axisAnim.Vmin + (ex - g.x0) / g.xw * (axisAnim.Vmax - axisAnim.Vmin);
      var isoTs = [state.T / 2, state.T, state.T * 2];
      for (var i = 0; i < isoTs.length; i++) {
        var isoP = calcP(state.n, isoTs[i], v);
        var isoY = g.y0 + g.yh - (isoP - axisAnim.Pmin) / (axisAnim.Pmax - axisAnim.Pmin) * g.yh;
        if (isoP >= axisAnim.Pmin && isoP <= axisAnim.Pmax && Math.abs(ey - isoY) < 12) {
          hoveredIso = i;
          break;
        }
      }
    }
  });

  canvas.addEventListener('mouseleave', function () {
    canvas.style.cursor = '';
    dotTooltip.classList.add('hidden');
    hoveredIso = -1;
  });

  canvas.addEventListener('click', function (e) {
    if (mode !== 'simulate') return;
    if (hitTestDot(e.offsetX, e.offsetY)) {
      projActive   = true;
      projProgress = 0;
    } else {
      projActive   = false;
      projProgress = 0;
    }
  });

  /* ══════════════════════════════════════════════════════
     9. KEYBOARD SHORTCUT — Space/Enter toggles projection
  ═══════════════════════════════════════════════════════ */
  document.addEventListener('keydown', function (e) {
    if (mode !== 'simulate') return;
    var tag = document.activeElement ? document.activeElement.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      projActive = !projActive;
      if (projActive) projProgress = 0;
    }
  });

  /* ══════════════════════════════════════════════════════
     10. SLIDER EVENTS + LOCKED TOAST
  ═══════════════════════════════════════════════════════ */
  [slN, slT, slV, slP].forEach(function (sl) {
    var key = sl === slP ? 'P' : sl === slV ? 'V' : sl === slT ? 'T' : 'n';
    sl.addEventListener('input', function () {
      lastMovedSlider = key;
      flashFormula(key);
      updateState();
      showSolvedRow();
    });
  });

  var toastTimer = null;
  var slMap2  = { P: slP, V: slV, T: slT, n: slN };
  var rowMap2 = { P: rowP, V: rowV, T: rowT, n: rowN };
  var varNames = { P: 'Pressure P', V: 'Volume V', T: 'Temperature T', n: 'Moles n' };

  function showLockedToast(key, triggerEl) {
    var rect = triggerEl.getBoundingClientRect();
    lockedToastText.textContent = 'Solving for ' + varNames[key] + ' \u2014 adjust other variables';
    lockedToast.style.left      = Math.round(rect.left + rect.width / 2) + 'px';
    lockedToast.style.top       = Math.round(rect.bottom + 8) + 'px';
    lockedToast.style.transform = 'translateX(-50%)';
    lockedToast.classList.remove('visible', 'blink');
    void lockedToast.offsetWidth;
    lockedToast.classList.add('visible', 'blink');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      lockedToast.classList.remove('visible', 'blink');
    }, 2500);
  }

  Object.keys(slMap2).forEach(function (key) {
    rowMap2[key].addEventListener('mousedown', function () {
      if (slMap2[key].disabled) showLockedToast(key, rowMap2[key]);
    });
    rowMap2[key].addEventListener('touchstart', function () {
      if (slMap2[key].disabled) showLockedToast(key, rowMap2[key]);
    }, { passive: true });
  });

  /* ══════════════════════════════════════════════════════
     11. GAS TABS
  ═══════════════════════════════════════════════════════ */
  gasTabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      gasTabs.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      gas          = btn.dataset.gas;
      particles    = [];
      pathHistory  = []; // clear trail on gas change
      processType  = '';
      lastMovedSlider = null;
    });
  });

  /* ══════════════════════════════════════════════════════
     12. PNG EXPORT (with NHIT VisualLab watermark)
  ═══════════════════════════════════════════════════════ */
  function saveGraph() {
    var dpr  = Math.min(window.devicePixelRatio || 1, 2);
    var oc   = document.createElement('canvas');
    oc.width  = canvas.width;
    oc.height = canvas.height;
    var octx  = oc.getContext('2d');
    // Copy main canvas
    octx.drawImage(canvas, 0, 0);
    // Watermark in logical coordinates (DPR-matched transform)
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.font      = 'bold 12px "Segoe UI", system-ui, sans-serif';
    octx.textAlign = 'right';
    octx.shadowColor = '#000';
    octx.shadowBlur  = 5;
    octx.fillStyle   = 'rgba(255,255,255,0.50)';
    octx.fillText('NHIT VisualLab', canvasLogW - 8, canvasLogH - 7);
    octx.shadowBlur  = 0;
    // Trigger download
    var link    = document.createElement('a');
    link.download = 'pv-diagram-nhitvisuallab.png';
    link.href     = oc.toDataURL('image/png');
    link.click();
  }

  document.getElementById('btn-export-png').addEventListener('click', saveGraph);

  /* ══════════════════════════════════════════════════════
     13. EXPLORE MODE
  ═══════════════════════════════════════════════════════ */
  var currentExpTab = 'laws';

  var CONCEPTS = {
    laws: [
      { name: "Boyle's Law",    formula: "PV = k",   unit: "T, n constant",
        desc: "At constant temperature and amount of gas, pressure and volume are inversely proportional. Doubling volume halves the pressure.",
        example: "<strong>Example:</strong> A gas occupies 4 L at 200 kPa. At 400 kPa (same T): V\u2082 = P\u2081V\u2081/P\u2082 = (200\u00d74)/400 = 2 L" },
      { name: "Charles' Law",   formula: "V/T = k",  unit: "P, n constant",
        desc: "At constant pressure, volume is directly proportional to absolute temperature. Volume increases linearly from absolute zero.",
        example: "<strong>Example:</strong> Gas at 300 K occupies 3 L. At 600 K (same P): V\u2082 = V\u2081\u00d7T\u2082/T\u2081 = 3\u00d7600/300 = 6 L" },
      { name: "Gay-Lussac's Law", formula: "P/T = k", unit: "V, n constant",
        desc: "At constant volume, pressure is directly proportional to absolute temperature. This explains why car tyres are harder in summer.",
        example: "<strong>Example:</strong> Tyre at 280 K, 220 kPa. At 320 K: P\u2082 = 220\u00d7320/280 = 251.4 kPa" },
      { name: "Avogadro's Law", formula: "V/n = k",  unit: "P, T constant",
        desc: "Equal volumes of gases at the same T and P contain equal numbers of molecules. Adding more gas proportionally increases volume.",
        example: "<strong>Example:</strong> 2 mol at 10 L. Add 1 mol (same T, P): V\u2082 = 10\u00d73/2 = 15 L" }
    ],
    equation: [
      { name: "Ideal Gas Law",  formula: "PV = nRT", unit: "",
        desc: "The master equation relating all four gas variables. Valid for low-density gases where intermolecular forces are negligible.",
        example: "<strong>Example:</strong> Find P: n=0.5 mol, V=2 L, T=300 K \u2192 P = nRT/V = 0.5\u00d78.314\u00d7300/2 = 623.6 kPa" },
      { name: "Gas Constant R", formula: "R = 8.314", unit: "J/(mol\u00b7K)",
        desc: "The universal gas constant R = 8.314 J/(mol\u00b7K) = 0.08206 L\u00b7atm/(mol\u00b7K). It appears in thermodynamics, kinetic theory, and electrostatics.",
        example: "<strong>Alternative form:</strong> Using R = 0.08206 L\u00b7atm/(mol\u00b7K) \u2192 P in atm, V in litres, n in mol, T in Kelvin" },
      { name: "Molar Volume (STP)", formula: "V = 22.4 L/mol", unit: "at 0\u00b0C, 101.3 kPa",
        desc: "At STP (273.15 K, 101.325 kPa), one mole of any ideal gas occupies exactly 22.414 litres \u2014 confirmed by PV = nRT.",
        example: "<strong>Verify:</strong> V = nRT/P = 1\u00d78.314\u00d7273.15/101325 = 0.02241 m\u00b3 = 22.41 L \u2713" },
      { name: "Mole Fraction",  formula: "\u03c7\u1d62 = n\u1d62/n\u209c\u2092\u209c", unit: "dimensionless",
        desc: "In a mixture of gases, the mole fraction is the ratio of moles of one component to total moles. Mole fractions sum to 1.",
        example: "<strong>Example:</strong> Air: 78% N\u2082, 21% O\u2082, 1% Ar by mole fraction. \u03c7(N\u2082) = 0.78" }
    ],
    combined: [
      { name: "Combined Gas Law", formula: "P\u2081V\u2081/T\u2081 = P\u2082V\u2082/T\u2082", unit: "n constant",
        desc: "Combines Boyle's and Charles' Laws for a fixed amount of gas undergoing a change of state. Use when P, V, and T all change.",
        example: "<strong>Example:</strong> Gas at 1 atm, 2 L, 300 K \u2192 compressed to 0.5 L at 400 K: P\u2082 = 1\u00d72\u00d7400/(0.5\u00d7300) = 5.33 atm" },
      { name: "Dalton's Law", formula: "P\u209c\u2092\u209c = \u03a3 P\u1d62", unit: "partial pressures",
        desc: "The total pressure of a gas mixture equals the sum of the partial pressures of each component. Each gas behaves as if alone.",
        example: "<strong>Example:</strong> O\u2082 at 30 kPa + N\u2082 at 70 kPa = total 100 kPa. P(O\u2082) = \u03c7(O\u2082)\u00d7P\u209c\u2092\u209c" },
      { name: "Isothermal Process", formula: "P\u2081V\u2081 = P\u2082V\u2082", unit: "T, n constant",
        desc: "A process at constant temperature. Work done equals the heat absorbed. Gas follows a hyperbolic path on the P-V diagram.",
        example: "<strong>Example:</strong> Syringe: gas at 2 L, 100 kPa. Push to 1 L: P\u2082 = 100\u00d72/1 = 200 kPa" },
      { name: "Isobaric & Isochoric", formula: "V\u221dT | P\u221dT", unit: "const P or V",
        desc: "Isobaric: constant pressure (P\u2081=P\u2082), so V/T = const (Charles' Law). Isochoric: constant volume (V\u2081=V\u2082), so P/T = const (Gay-Lussac's).",
        example: "<strong>Isochoric:</strong> Sealed can at 300 K, 100 kPa. Heat to 450 K: P\u2082 = 100\u00d7450/300 = 150 kPa" }
    ],
    applications: [
      { name: "Tyre Pressure", formula: "P\u2082 = P\u2081T\u2082/T\u2081", unit: "isochoric",
        desc: "A car tyre is a sealed container (fixed V, fixed n). As temperature rises in summer, pressure increases by Gay-Lussac's Law.",
        example: "<strong>Example:</strong> Tyre at 20\u00b0C (293 K), 220 kPa. At 40\u00b0C (313 K): P\u2082 = 220\u00d7313/293 = 235 kPa (+7%)" },
      { name: "Scuba Tank", formula: "n = PV/RT", unit: "find moles",
        desc: "A 12-litre scuba tank at 200 bar contains about 2400 L of air at surface pressure \u2014 all described by the ideal gas law.",
        example: "<strong>Example:</strong> n = PV/RT = (200\u00d7101.3\u00d70.012)/(8.314\u00d7293) = 99.4 mol of air" },
      { name: "Balloon / Blimp", formula: "\u03c1 \u221d PM/(RT)", unit: "lighter gas lifts",
        desc: "Helium in a balloon has lower molar mass than air, so at same T and P it is less dense. The buoyancy force lifts the balloon.",
        example: "<strong>Density ratio:</strong> \u03c1(He)/\u03c1(air) = M(He)/M(air) = 4/29 \u2248 0.14 \u2014 helium is 86% lighter than air" },
      { name: "Atmospheric Lapse", formula: "T drops 6.5 K/km", unit: "dry adiabatic",
        desc: "Rising air parcel expands as pressure falls, cooling adiabatically at ~10 K/km (dry) or ~6.5 K/km (moist). Drives weather and clouds.",
        example: "<strong>Example:</strong> Air at 15\u00b0C (288 K) at sea level. At 3 km: T \u2248 288 \u2212 3\u00d76.5 = 268.5 K (\u22124.5\u00b0C)" }
    ]
  };

  function renderExplore(tab) {
    var grid  = document.getElementById('concept-grid');
    var cards = CONCEPTS[tab] || [];
    grid.innerHTML = cards.map(function (c) {
      return '<div class="concept-card">' +
        '<div class="cc-name">'    + c.name    + '</div>' +
        '<div class="cc-formula">' + c.formula + '</div>' +
        '<div class="cc-unit">'    + c.unit    + '</div>' +
        '<div class="cc-desc">'    + c.desc    + '</div>' +
        '<div class="cc-example">' + c.example + '</div>' +
      '</div>';
    }).join('');
  }

  var expTabBtns = document.querySelectorAll('.exp-tab');
  expTabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      expTabBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentExpTab = btn.dataset.exp;
      renderExplore(currentExpTab);
    });
  });

  /* ══════════════════════════════════════════════════════
     14. PRACTICE MODE
  ═══════════════════════════════════════════════════════ */
  var pracCorrect = 0, pracTotal = 0;

  // Restore score from sessionStorage on load
  try {
    var _s = sessionStorage.getItem('igPracScore');
    if (_s) { var _sc = JSON.parse(_s); pracCorrect = _sc.correct||0; pracTotal = _sc.total||0; }
  } catch(e) {}

  function rnd(min, max, dp) {
    return parseFloat((min + Math.random() * (max - min)).toFixed(dp));
  }

  var PROBLEMS = [
    function () {
      var n = rnd(0.1,3,2), T = rnd(200,600,0), V = rnd(1,8,1);
      var P = parseFloat(calcP(n,T,V).toFixed(1));
      return { q:'A sample of <strong>'+n+' mol</strong> of ideal gas occupies <strong>'+V+' L</strong> at <strong>'+T+' K</strong>. Calculate the pressure.',
        ans:P, unit:'kPa', dp:1, sol:'P = nRT/V = '+n+' \u00d7 8.314 \u00d7 '+T+' / '+V+'\n  = '+P+' kPa' };
    },
    function () {
      var n = rnd(0.1,2,2), T = rnd(200,600,0), P = rnd(50,400,0);
      var V = parseFloat(calcV(n,T,P).toFixed(2));
      return { q:'Find the volume of <strong>'+n+' mol</strong> of gas at <strong>'+T+' K</strong> and <strong>'+P+' kPa</strong>.',
        ans:V, unit:'L', dp:2, sol:'V = nRT/P = '+n+' \u00d7 8.314 \u00d7 '+T+' / '+P+'\n  = '+V+' L' };
    },
    function () {
      var n = rnd(0.1,2,2), P = rnd(50,500,0), V = rnd(1,8,1);
      var T = parseFloat(calcT(n,P,V).toFixed(1));
      return { q:'<strong>'+n+' mol</strong> of gas exerts <strong>'+P+' kPa</strong> in a container of <strong>'+V+' L</strong>. What is the temperature?',
        ans:T, unit:'K', dp:1, sol:'T = PV/(nR) = '+P+' \u00d7 '+V+' / ('+n+' \u00d7 8.314)\n  = '+T+' K' };
    },
    function () {
      var P = rnd(50,400,0), V = rnd(1,8,1), T = rnd(200,600,0);
      var n = parseFloat(calcN(P,V,T).toFixed(3));
      return { q:'Gas at <strong>'+P+' kPa</strong> occupies <strong>'+V+' L</strong> at <strong>'+T+' K</strong>. How many moles are present?',
        ans:n, unit:'mol', dp:3, sol:'n = PV/(RT) = '+P+' \u00d7 '+V+' / (8.314 \u00d7 '+T+')\n  = '+n+' mol' };
    },
    function () {
      var V1=rnd(2,8,1), P1=rnd(50,300,0), V2=rnd(1,V1-0.5,1);
      var P2=parseFloat((P1*V1/V2).toFixed(1));
      return { q:'A gas at <strong>'+P1+' kPa</strong> occupies <strong>'+V1+' L</strong>. Volume is reduced to <strong>'+V2+' L</strong> at the same temperature. Find the new pressure.',
        ans:P2, unit:'kPa', dp:1, sol:"Boyle's Law: P\u2081V\u2081 = P\u2082V\u2082\nP\u2082 = P\u2081V\u2081/V\u2082 = "+P1+'\u00d7'+V1+'/'+V2+'\n   = '+P2+' kPa' };
    },
    function () {
      var V1=rnd(2,6,1), T1=rnd(250,400,0), T2=rnd(T1+50,600,0);
      var V2=parseFloat((V1*T2/T1).toFixed(2));
      return { q:'Gas at <strong>'+T1+' K</strong> occupies <strong>'+V1+' L</strong>. It is heated to <strong>'+T2+' K</strong> at constant pressure. Find the new volume.',
        ans:V2, unit:'L', dp:2, sol:"Charles' Law: V\u2081/T\u2081 = V\u2082/T\u2082\nV\u2082 = V\u2081\u00d7T\u2082/T\u2081 = "+V1+'\u00d7'+T2+'/'+T1+'\n   = '+V2+' L' };
    },
    function () {
      var P1=rnd(100,300,0), T1=rnd(250,350,0), T2=rnd(T1+50,500,0);
      var P2=parseFloat((P1*T2/T1).toFixed(1));
      return { q:'A sealed container at <strong>'+T1+' K</strong> has gas pressure <strong>'+P1+' kPa</strong>. It is heated to <strong>'+T2+' K</strong>. Find the new pressure.',
        ans:P2, unit:'kPa', dp:1, sol:"Gay-Lussac's Law: P\u2081/T\u2081 = P\u2082/T\u2082\nP\u2082 = P\u2081\u00d7T\u2082/T\u2081 = "+P1+'\u00d7'+T2+'/'+T1+'\n   = '+P2+' kPa' };
    },
    function () {
      var P1=rnd(100,300,0), V1=rnd(3,8,1), T1=rnd(250,400,0), V2=rnd(1,V1-0.5,1), T2=rnd(T1-50,T1+100,0);
      var P2=parseFloat((P1*V1*T2/(T1*V2)).toFixed(1));
      return { q:'Gas at <strong>'+P1+' kPa</strong>, <strong>'+V1+' L</strong>, <strong>'+T1+' K</strong> is changed to <strong>'+V2+' L</strong> at <strong>'+T2+' K</strong>. Find P\u2082.',
        ans:P2, unit:'kPa', dp:1, sol:'Combined: P\u2081V\u2081/T\u2081 = P\u2082V\u2082/T\u2082\nP\u2082 = P\u2081V\u2081T\u2082/(T\u2081V\u2082) = '+P1+'\u00d7'+V1+'\u00d7'+T2+'/('+T1+'\u00d7'+V2+')\n   = '+P2+' kPa' };
    },
    function () {
      var P_bar=rnd(100,250,0), P_kPa=P_bar*100, V=rnd(8,15,0);
      var n=parseFloat(calcN(P_kPa,V,293).toFixed(1));
      return { q:'A scuba tank holds <strong>'+V+' L</strong> of gas at <strong>'+P_bar+' bar ('+P_kPa+' kPa)</strong> and 20\u00b0C (293 K). How many moles of gas does it contain?',
        ans:n, unit:'mol', dp:1, sol:'n = PV/RT = '+P_kPa+'\u00d7'+V+'/(8.314\u00d7293)\n  = '+n+' mol' };
    },
    function () {
      var P1=rnd(180,250,0), T1_C=rnd(5,20,0), T2_C=rnd(35,50,0);
      var T1=T1_C+273, T2=T2_C+273;
      var P2=parseFloat((P1*T2/T1).toFixed(1));
      return { q:'A car tyre at <strong>'+T1_C+'\u00b0C ('+T1+' K)</strong> has pressure <strong>'+P1+' kPa</strong>. The tyre heats to <strong>'+T2_C+'\u00b0C ('+T2+' K)</strong>. Find the new pressure.',
        ans:P2, unit:'kPa', dp:1, sol:"Fixed volume \u2192 Gay-Lussac's: P\u2082 = P\u2081T\u2082/T\u2081\n  = "+P1+'\u00d7'+T2+'/'+T1+' = '+P2+' kPa' };
    },
    function () {
      var V1=rnd(3,8,1), T1=rnd(250,400,0), T2_C=rnd(-200,-100,0), T2=T2_C+273.15;
      var V2=parseFloat((V1*T2/T1).toFixed(2));
      return { q:'Gas at <strong>'+T1+' K</strong> occupies <strong>'+V1+' L</strong>. It is cooled to <strong>'+T2_C+'\u00b0C ('+T2.toFixed(1)+' K)</strong> at constant P. Find the volume.',
        ans:V2, unit:'L', dp:2, sol:'V\u2082 = V\u2081\u00d7T\u2082/T\u2081 = '+V1+'\u00d7'+T2.toFixed(1)+'/'+T1+'\n   = '+V2+' L' };
    },
    function () {
      var Ptot=rnd(100,400,0), chi=rnd(0.20,0.80,2), Pi=parseFloat((chi*Ptot).toFixed(1));
      return { q:'A gas mixture has total pressure <strong>'+Ptot+' kPa</strong>. One component has mole fraction <strong>'+chi+'</strong>. What is its partial pressure?',
        ans:Pi, unit:'kPa', dp:1, sol:"Dalton's Law: P\u1d62 = \u03c7\u1d62 \u00d7 P\u209c\u2092\u209c\n  = "+chi+' \u00d7 '+Ptot+' = '+Pi+' kPa' };
    }
  ];

  var currentProblem = null;

  function newProblem() {
    currentProblem = PROBLEMS[Math.floor(Math.random() * PROBLEMS.length)]();
    document.getElementById('prac-question').innerHTML = currentProblem.q;
    document.getElementById('prac-unit').textContent   = currentProblem.unit;
    document.getElementById('prac-input').value        = '';
    document.getElementById('prac-feedback').textContent = '';
    document.getElementById('prac-feedback').className   = 'feedback';
    document.getElementById('prac-solution-box').classList.add('hidden');
    document.getElementById('prac-solution-box').textContent = '';
  }

  document.getElementById('prac-new').addEventListener('click', newProblem);

  document.getElementById('prac-check').addEventListener('click', function () {
    if (!currentProblem) return;
    var val = parseFloat(document.getElementById('prac-input').value);
    if (isNaN(val)) {
      document.getElementById('prac-feedback').textContent = 'Please enter a numeric answer.';
      document.getElementById('prac-feedback').className   = 'feedback err';
      return;
    }
    var tol = Math.max(0.01, Math.abs(currentProblem.ans) * 0.02);
    pracTotal++;
    document.getElementById('prac-total').textContent = pracTotal;
    if (Math.abs(val - currentProblem.ans) <= tol) {
      document.getElementById('prac-feedback').textContent = '\u2713 Correct! ' + currentProblem.ans.toFixed(currentProblem.dp) + ' ' + currentProblem.unit;
      document.getElementById('prac-feedback').className   = 'feedback ok';
      pracCorrect++;
      document.getElementById('prac-correct').textContent = pracCorrect;
    } else {
      document.getElementById('prac-feedback').textContent = '\u2717 Incorrect. Correct answer: ' + currentProblem.ans.toFixed(currentProblem.dp) + ' ' + currentProblem.unit;
      document.getElementById('prac-feedback').className   = 'feedback err';
    }
    // Persist to sessionStorage
    try { sessionStorage.setItem('igPracScore', JSON.stringify({ correct: pracCorrect, total: pracTotal })); } catch(e) {}
  });

  document.getElementById('prac-solution').addEventListener('click', function () {
    if (!currentProblem) return;
    var box = document.getElementById('prac-solution-box');
    box.textContent = 'Solution:\n' + currentProblem.sol;
    box.classList.remove('hidden');
  });

  /* ══════════════════════════════════════════════════════
     15. QUIZ MODE
  ═══════════════════════════════════════════════════════ */
  var QUIZ_POOL = [
    { q: 'What does R represent in PV = nRT?', opts: ['Universal gas constant (8.314 J/mol\u00b7K)', 'Radius of gas molecule', 'Rate of reaction', 'Relative pressure'], ans: 0,
      exp: 'R = 8.314 J/(mol\u00b7K) is the universal gas constant relating energy to temperature per mole.' },
    { q: 'A gas at 4 L and 200 kPa is compressed to 2 L at the same temperature. New pressure?', opts: ['100 kPa', '400 kPa', '50 kPa', '800 kPa'], ans: 1,
      exp: "Boyle's Law: P\u2082 = P\u2081V\u2081/V\u2082 = 200\u00d74/2 = 400 kPa." },
    { q: 'Which law states that V \u221d T at constant pressure?', opts: ["Boyle's Law", "Charles' Law", "Gay-Lussac's Law", "Avogadro's Law"], ans: 1,
      exp: "Charles' Law: V/T = constant at fixed P and n." },
    { q: 'What is the molar volume of an ideal gas at STP (0\u00b0C, 101.3 kPa)?', opts: ['22.4 L/mol', '11.2 L/mol', '24.5 L/mol', '44.8 L/mol'], ans: 0,
      exp: 'V = nRT/P = 1\u00d78.314\u00d7273.15/101325 = 0.02241 m\u00b3 = 22.41 L/mol.' },
    { q: 'A sealed can at 300 K has 150 kPa pressure. Heated to 600 K \u2014 new pressure?', opts: ['75 kPa', '300 kPa', '450 kPa', '600 kPa'], ans: 1,
      exp: "Gay-Lussac's: P\u2082 = P\u2081T\u2082/T\u2081 = 150\u00d7600/300 = 300 kPa." },
    { q: 'Which variable is held constant in an isothermal process?', opts: ['Pressure', 'Volume', 'Temperature', 'Moles'], ans: 2,
      exp: 'Isothermal means constant temperature (iso = same, thermal = temperature).' },
    { q: 'A gas at 3 L, 270 K, 100 kPa is compressed to 1 L at 540 K. New pressure?', opts: ['50 kPa', '200 kPa', '300 kPa', '600 kPa'], ans: 3,
      exp: 'P\u2082 = P\u2081V\u2081T\u2082/(T\u2081V\u2082) = 100\u00d73\u00d7540/(270\u00d71) = 600 kPa.' },
    { q: "Dalton's Law of partial pressures states:", opts: ['P_total = product of partial pressures', 'P_total = sum of partial pressures', 'All gases have equal partial pressure', 'Partial pressure equals mole fraction squared'], ans: 1,
      exp: "Dalton's Law: P_total = P\u2081 + P\u2082 + ... Each gas exerts the pressure it would exert alone." },
    { q: '1 mol of gas at 300 K in 4 L \u2014 pressure?', opts: ['623.6 kPa', '311.8 kPa', '1247 kPa', '207.9 kPa'], ans: 0,
      exp: 'P = nRT/V = 1\u00d78.314\u00d7300/4 = 2494.2/4 = 623.55 \u2248 623.6 kPa.' },
    { q: '0.2 mol of gas in 2 L at 300 K \u2014 pressure?', opts: ['249.4 kPa', '124.7 kPa', '498.8 kPa', '62.4 kPa'], ans: 0,
      exp: 'P = nRT/V = 0.2\u00d78.314\u00d7300/2 = 499.0/2 \u2248 249.4 kPa.' },
    { q: 'Gas at 500 K occupies 5 L. Cooled to 250 K at constant P \u2014 new volume?', opts: ['10 L', '2.5 L', '1.25 L', '20 L'], ans: 1,
      exp: "Charles' Law: V\u2082 = V\u2081T\u2082/T\u2081 = 5\u00d7250/500 = 2.5 L." },
    { q: 'Which process keeps pressure constant?', opts: ['Isothermal', 'Isochoric', 'Isobaric', 'Adiabatic'], ans: 2,
      exp: "Isobaric: iso = same, baric = pressure. Charles' Law applies." },
    { q: 'Temperature at which an ideal gas has zero pressure?', opts: ['0\u00b0C', '\u2212100\u00b0C', '\u2212273.15\u00b0C', '\u2212373.15\u00b0C'], ans: 2,
      exp: 'Absolute zero = 0 K = \u2212273.15\u00b0C. At this T, P = nRT/V = 0 in the ideal gas model.' },
    { q: 'Scuba tank: 12 L at 200 bar (20\u202f000 kPa), 20\u00b0C. Approximate moles of air?', opts: ['10 mol', '49 mol', '98 mol', '196 mol'], ans: 2,
      exp: 'n = PV/RT = 20000\u00d712/(8.314\u00d7293) = 240000/2436 \u2248 98.5 mol.' },
    { q: 'If volume is doubled at constant T and n, pressure:', opts: ['Doubles', 'Halves', 'Stays same', 'Quadruples'], ans: 1,
      exp: "Boyle's Law: PV = const \u2192 P\u2082 = P\u2081V\u2081/V\u2082 = P\u2081/2. Pressure halves." }
  ];

  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswered = false;
  var quizHistory  = [];

  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    quizSet = pool.slice(0, QUIZ_SIZE);
    quizIdx = 0; quizScore = 0; quizHistory = [];
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-score-live').textContent = '0';
    renderQuestion();
  }

  function renderQuestion() {
    var q = quizSet[quizIdx];
    quizAnswered = false;
    document.getElementById('quiz-counter').textContent = (quizIdx + 1) + ' / ' + QUIZ_SIZE;
    document.getElementById('quiz-q').innerHTML = q.q;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-feedback').className   = 'feedback';
    document.getElementById('quiz-submit').classList.remove('hidden');
    document.getElementById('quiz-next').classList.add('hidden');
    document.getElementById('quiz-submit').disabled = true;

    var optsDiv = document.getElementById('quiz-opts');
    optsDiv.innerHTML = '';
    q.opts.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.className   = 'quiz-opt';
      btn.textContent = opt;
      btn.dataset.idx = i;
      btn.addEventListener('click', function () {
        if (quizAnswered) return;
        optsDiv.querySelectorAll('.quiz-opt').forEach(function (b) {
          b.style.borderColor = '';
          b.removeAttribute('data-selected');
        });
        btn.style.borderColor = 'var(--accent)';
        btn.dataset.selected  = 'true';
        document.getElementById('quiz-submit').disabled = false;
      });
      optsDiv.appendChild(btn);
    });
  }

  document.getElementById('quiz-submit').addEventListener('click', function () {
    if (quizAnswered) return;
    var q        = quizSet[quizIdx];
    var selected = document.querySelector('.quiz-opt[data-selected="true"]');
    if (!selected) return;
    var chosenIdx = parseInt(selected.dataset.idx);
    var correct   = q.ans;
    quizAnswered  = true;

    document.querySelectorAll('.quiz-opt').forEach(function (b) {
      b.disabled = true;
      b.style.borderColor = '';
      if (parseInt(b.dataset.idx) === correct)   b.classList.add('correct');
      else if (parseInt(b.dataset.idx) === chosenIdx) b.classList.add('wrong');
    });

    var isRight = (chosenIdx === correct);
    if (isRight) { quizScore++; document.getElementById('quiz-score-live').textContent = quizScore; }
    document.getElementById('quiz-feedback').textContent = (isRight ? '\u2713 Correct! ' : '\u2717 Wrong. ') + (q.exp || '');
    document.getElementById('quiz-feedback').className   = 'feedback ' + (isRight ? 'ok' : 'err');
    document.getElementById('quiz-submit').classList.add('hidden');
    document.getElementById('quiz-next').classList.remove('hidden');
    quizHistory.push({ q: q.q, chosen: q.opts[chosenIdx], correct: q.opts[correct], ok: isRight });
  });

  document.getElementById('quiz-next').addEventListener('click', function () {
    quizIdx++;
    if (quizIdx < QUIZ_SIZE) renderQuestion();
    else showQuizResult();
  });

  document.getElementById('quiz-restart').addEventListener('click', startQuiz);

  function showQuizResult() {
    document.getElementById('quiz-result').classList.remove('hidden');
    document.getElementById('quiz-q').textContent      = '';
    document.getElementById('quiz-opts').innerHTML     = '';
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-submit').classList.add('hidden');
    document.getElementById('quiz-next').classList.add('hidden');

    var pct     = quizScore / QUIZ_SIZE;
    var scoreEl = document.getElementById('qr-score');
    scoreEl.textContent = quizScore + ' / ' + QUIZ_SIZE;
    scoreEl.className   = 'qr-score ' + (pct === 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor');
    document.getElementById('qr-stars').textContent = pct === 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605\u2606' : '\u2605\u2606\u2606';

    var breakdown = document.getElementById('qr-breakdown');
    breakdown.innerHTML = quizHistory.map(function (h, i) {
      return '<div class="qr-row ' + (h.ok ? 'ok' : 'err') + '">' +
        '<strong>Q' + (i+1) + ':</strong> ' + (h.ok ? '\u2713' : '\u2717') +
        ' Your answer: ' + h.chosen +
        (h.ok ? '' : ' | Correct: ' + h.correct) +
      '</div>';
    }).join('');
  }

  /* ══════════════════════════════════════════════════════
     16. RESIZE
  ═══════════════════════════════════════════════════════ */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sizeCanvas, 150);
  });

  /* ══════════════════════════════════════════════════════
     17. INIT
  ═══════════════════════════════════════════════════════ */
  sizeCanvas();
  /* ── Unit toggle — display only; PV = nRT is solved in kPa, L, K ── */
  Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-unit');
      if (!u || u === unitSys) return;
      unitSys = u;
      Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (b) {
        b.classList.toggle('active', b === btn);
      });
      updateState();     /* re-renders outputs, header strip and both canvases */
    });
  });

  updateState();
  showSolvedRow();
  renderExplore(currentExpTab);
  // Sync practice score display (may have been restored from sessionStorage)
  document.getElementById('prac-correct').textContent = pracCorrect;
  document.getElementById('prac-total').textContent   = pracTotal;
  /* Paint the first frame synchronously rather than waiting on the first
     animation frame — draw() schedules the loop itself, so this both gives an
     immediate first paint (the canvas was blank until rAF first fired, which a
     backgrounded or throttled tab can defer indefinitely) and keeps exactly one
     rAF loop running. */
  draw(0);

})();
