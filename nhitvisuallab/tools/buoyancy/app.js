/* Buoyancy (Archimedes) Simulator — NHIT VisualLab
   Physics: F_b = rho_fluid * V_displaced * g  ; W = rho_obj * V * g
   Floats: V_sub/V = rho_obj/rho_fluid   Sinks: W_app = (rho_obj - rho_fluid) * V * g
   Internal SI base: kg/m^3, m^3, N, kg, m. Display converts on the fly.
*/
(function () {
  'use strict';

  var G = 9.81;
  var TANK_HEIGHT_M = 0.30;     // physical tank inside height (30 cm) — visual scale reference
  var $ = function (id) { return document.getElementById(id); };

  /* ── Material database ──────────────────────────────────────── */
  var OBJECTS = [
    { key: 'cork',     name: 'Cork',          rho: 250 },
    { key: 'wax',      name: 'Wax (paraffin)',rho: 900 },
    { key: 'wood',     name: 'Pine wood',     rho: 450 },
    { key: 'ice',      name: 'Ice',           rho: 917 },
    { key: 'plastic',  name: 'Plastic (PVC)', rho: 1380 },
    { key: 'aluminum', name: 'Aluminium',     rho: 2700 },
    { key: 'iron',     name: 'Iron / Steel',  rho: 7870 },
    { key: 'lead',     name: 'Lead',          rho: 11340 }
  ];
  var FLUIDS = [
    { key: 'alcohol',  name: 'Ethanol',       rho: 789,   color: '#9ad7c4' },
    { key: 'oil',      name: 'Vegetable Oil', rho: 920,   color: '#e6c64f' },
    { key: 'water',    name: 'Fresh Water',   rho: 1000,  color: '#4fc3f7' },
    { key: 'salt',     name: 'Sea Water',     rho: 1025,  color: '#7ed5e6' },
    { key: 'glycerin', name: 'Glycerin',      rho: 1260,  color: '#bdd2e6' },
    { key: 'mercury',  name: 'Mercury',       rho: 13534, color: '#c8c8d2' }
  ];

  var PRESETS = [
    { key: 'default',  name: 'Default',          obj: 'ice',     fl: 'water',   v: 1.0, sh: 'cube' },
    { key: 'iceberg',  name: 'Iceberg Tip',      obj: 'ice',     fl: 'salt',    v: 5.0, sh: 'cube' },
    { key: 'leadhg',   name: 'Lead on Mercury',  obj: 'lead',    fl: 'mercury', v: 1.0, sh: 'cube' },
    { key: 'steelsink',name: 'Steel Sinks',      obj: 'iron',    fl: 'water',   v: 0.5, sh: 'sphere' },
    { key: 'saltvfre', name: 'Salt vs Fresh',    obj: 'wood',    fl: 'salt',    v: 2.0, sh: 'cube' },
    { key: 'cork',     name: 'Cork Bobber',      obj: 'cork',    fl: 'water',   v: 0.3, sh: 'sphere' }
  ];

  /* ── State ──────────────────────────────────────────────────── */
  var state = {
    mode: 'simulate',
    unit: 'si',                  // 'si' | 'imp'
    objKey: 'ice',
    flKey:  'water',
    volume: 1.0,                 // litres (converted to m^3 internally as needed)
    fluidLevel: 0.90,            // 0.05–0.95 — leaves a small air gap so floating objects fit inside the tank
    shape:  'cube',              // cube | sphere | cyl
    customObjects: [],
    customFluids:  [],
    /* anim */
    yPos: 0,                     // current y of object (px from canvas top)
    vY: 0,
    settled: false,
    splash: [],
    waveT: 0,
    /* canvas toggles */
    showForces: true, showParticles: true, showEquation: true, showGrid: false, showWaterline: true,
    /* practice/quiz */
    pp: { problem: null, score: 0, total: 0 },
    qz: { idx: 0, q: null, answers: [], started: false },
    /* undo/redo */
    history: [], redoStack: [],
    /* audio */
    audioCtx: null,
    /* rAF */
    raf: 0
  };

  /* ── DOM refs ───────────────────────────────────────────────── */
  var canvas = $('sim-canvas');
  var ctx = canvas.getContext('2d');

  /* ── Unit helpers ───────────────────────────────────────────── */
  function isImp() { return state.unit === 'imp'; }
  function uLabel(kind) {
    var imp = isImp();
    switch (kind) {
      case 'rho':    return imp ? 'lb/ft³' : 'kg/m³';
      case 'force':  return imp ? 'lbf' : 'N';
      case 'mass':   return imp ? 'lb' : 'kg';
      case 'vol':    return imp ? 'gal' : 'L';
      case 'volBig': return imp ? 'ft³' : 'm³';
      default: return '';
    }
  }
  /* Conversions (SI -> display) */
  function toD(val, kind) {
    if (!isImp()) return val;
    switch (kind) {
      case 'rho':   return val * 0.062428;    // kg/m^3 -> lb/ft^3
      case 'force': return val * 0.224809;    // N -> lbf
      case 'mass':  return val * 2.204623;    // kg -> lb
      case 'vol':   return val * 0.264172;    // L -> US gal
      case 'volBig':return val * 35.3147;     // m^3 -> ft^3
    }
    return val;
  }
  function toSI(val, kind) {
    if (!isImp()) return val;
    switch (kind) {
      case 'rho':   return val / 0.062428;
      case 'force': return val / 0.224809;
      case 'mass':  return val / 2.204623;
      case 'vol':   return val / 0.264172;
      case 'volBig':return val / 35.3147;
    }
    return val;
  }
  function fmt(v, dp) { if (dp == null) dp = 2; if (!isFinite(v)) return '—'; return (Math.abs(v) >= 1000 ? v.toFixed(0) : v.toFixed(dp)); }

  /* ── Lookup helpers ─────────────────────────────────────────── */
  function getObj() {
    var all = OBJECTS.concat(state.customObjects);
    for (var i = 0; i < all.length; i++) if (all[i].key === state.objKey) return all[i];
    return OBJECTS[3];
  }
  function getFluid() {
    var all = FLUIDS.concat(state.customFluids);
    for (var i = 0; i < all.length; i++) if (all[i].key === state.flKey) return all[i];
    return FLUIDS[2];
  }

  /* ── Physics computation ────────────────────────────────────────
     Archimedes:  F_b = ρ_fluid · V_displaced · g
     Limited-fluid model:
       Object treated as a cube of side L = V^(1/3) (m).
       Fluid depth h_f = fluidLevel · TANK_HEIGHT_M.
       Floats naturally at h_sub_nat = L · (ρ_o / ρ_f) IF h_sub_nat ≤ h_f.
       Otherwise the object rests on the tank floor and is submerged
       only by h_sub = min(L, h_f) — this lowers V_displaced and F_b.
       For sinkers: h_sub = min(L, h_f); they always rest on the floor.
       W_app = max(0, W − F_b).
     This preserves Archimedes for every regime — F_b never exceeds
     ρ_f · V_object · g and never makes the object accelerate upward
     when there isn't enough fluid to support it. */
  function compute() {
    var obj = getObj(), fl = getFluid();
    var V_m3 = state.volume / 1000;          // L -> m^3
    var mass = obj.rho * V_m3;               // kg
    var W    = mass * G;                     // N

    var L_m   = Math.pow(V_m3, 1 / 3);        // cube side (m) — used for h_sub geometry
    var h_f_m = state.fluidLevel * TANK_HEIGHT_M;

    var floats, restingOnFloor, h_sub_m, fracSub, V_disp, F_b, W_app;

    if (obj.rho < fl.rho) {
      var h_nat = L_m * (obj.rho / fl.rho);   // natural floating submerged depth
      if (h_nat <= h_f_m) {
        /* Normal floating equilibrium */
        floats         = true;
        restingOnFloor = false;
        h_sub_m        = h_nat;
        fracSub        = obj.rho / fl.rho;
        V_disp         = V_m3 * fracSub;
        F_b            = fl.rho * V_disp * G;  // = W exactly
        W_app          = 0;
      } else {
        /* Tank too shallow to float — object rests on floor, partly submerged */
        floats         = false;
        restingOnFloor = true;
        h_sub_m        = Math.min(L_m, h_f_m);
        fracSub        = h_sub_m / L_m;
        V_disp         = V_m3 * fracSub;
        F_b            = fl.rho * V_disp * G;
        W_app          = Math.max(0, W - F_b);
      }
    } else {
      /* Sinks (ρ_o ≥ ρ_f) — always rests on floor */
      floats         = false;
      restingOnFloor = true;
      h_sub_m        = Math.min(L_m, h_f_m);
      fracSub        = h_sub_m / L_m;
      V_disp         = V_m3 * fracSub;
      F_b            = fl.rho * V_disp * G;
      W_app          = Math.max(0, W - F_b);
    }

    return {
      obj: obj, fl: fl, V_m3: V_m3, L_m: L_m, h_f_m: h_f_m,
      mass: mass, W: W, F_b: F_b, W_app: W_app,
      V_disp: V_disp, fracSub: fracSub, h_sub_m: h_sub_m,
      floats: floats, restingOnFloor: restingOnFloor
    };
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
  function playSplash()  { playTone(220, 0.1, 'sine', 0.06); setTimeout(function(){ playTone(140, 0.18, 'sine', 0.05); }, 80); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.08); setTimeout(function(){ playTone(1320, 0.16, 'sine', 0.08); }, 110); }
  function playError()   { playTone(220, 0.22, 'sawtooth', 0.05); }

  /* ── Draw canvas ────────────────────────────────────────────── */
  function sizeCanvas() {
    var W = canvas.parentElement.clientWidth - 16;
    var H = Math.max(360, Math.min(W * 0.62, 460));
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

    /* Background */
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, 0, W, H);

    if (state.showGrid) drawGrid(W, H);

    /* Tank dimensions */
    /* Tank geometry: tank inside-height represents TANK_HEIGHT_M physically.
       Tank sits in the lower portion of the canvas so arrow vectors above
       and below have room to render. */
    var tankX = 60, tankY = 70, tankW = W - 120, tankH = H - 110;
    var insidePad  = 4;
    var insideTop  = tankY + insidePad;
    var insideBot  = tankY + tankH - insidePad - 2;
    var insideH    = insideBot - insideTop;       // px representing TANK_HEIGHT_M
    var pxPerM     = insideH / TANK_HEIGHT_M;
    /* Waterline scales with fluid level slider */
    var fluidTopY  = insideBot - state.fluidLevel * insideH;
    var fluidBotY  = insideBot;

    /* Object size scaled to physical L (capped so it never exceeds the tank) */
    var capPx  = Math.min(insideH * 0.92, (tankW - 30) * 0.92);
    var objSize = Math.min(c.L_m * pxPerM, capPx);
    /* Floor very small minimum so 0.1 L is still visible */
    if (objSize < 24) objSize = 24;

    var objX  = tankX + tankW / 2;
    var halfH = objSize / 2;

    /* Equilibrium centre Y: */
    var eqCenterY;
    if (c.floats) {
      /* Floats freely — submerged fraction × objSize sits below waterline */
      eqCenterY = fluidTopY + (c.fracSub - 0.5) * objSize;
    } else if (c.restingOnFloor) {
      /* Sits on the floor of the tank — bottom of object = inside floor */
      eqCenterY = insideBot - halfH;
    } else {
      eqCenterY = insideBot - halfH;
    }

    /* Drop animation — initialise once, then advance with rAF.
       Converges within ~30 frames; bounce capped to avoid oscillation. */
    if (!state.settled) {
      if (state.yPos < 1) state.yPos = Math.max(halfH + 4, insideTop - halfH - 4);
      state.vY += 0.55;
      state.yPos += state.vY;

      /* Splash on first crossing of waterline */
      if (!state._splashed && state.yPos - halfH >= fluidTopY - 2 && state.fluidLevel > 0.05) {
        spawnSplash(objX, fluidTopY);
        state._splashed = true;
        playSplash();
        /* Drag — fluid resistance damps fall once submerged */
        state.vY *= 0.55;
      }

      /* Reach equilibrium */
      if (state.yPos >= eqCenterY) {
        state.yPos = eqCenterY;
        if (Math.abs(state.vY) > 1.2) {
          state.vY = -Math.min(5, state.vY * 0.28);
        } else {
          state.vY = 0;
          state.settled = true;
        }
      }
      requestDraw();
    }

    /* Tank glass + back */
    drawTank(tankX, tankY, tankW, tankH);

    /* Fluid (only as much depth as fluidLevel allows) */
    if (state.fluidLevel > 0.005) {
      drawFluid(c.fl, tankX + 4, fluidTopY, tankW - 8, fluidBotY - fluidTopY);
    }

    /* Waterline label */
    if (state.showWaterline) {
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(tankX - 6, fluidTopY);
      ctx.lineTo(tankX + tankW + 6, fluidTopY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '600 11px ' + 'Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('waterline', tankX + tankW + 8, fluidTopY + 4);
    }

    /* Splash particles */
    if (state.showParticles) drawSplash();

    /* Object */
    drawObject(objX, state.yPos, objSize, c.obj, c.floats);

    /* Force vectors (canvas H passed so arrows can self-clamp) */
    if (state.showForces && state.settled) drawForces(objX, state.yPos, objSize, c, H);

    /* Equation overlay */
    if (state.showEquation) drawEquation(W, c);

    /* Submerged fraction indicator (right side) */
    drawSubIndicator(tankX + tankW + 24, tankY + 60, 18, tankH - 80, c);
  }

  function drawGrid(W, H) {
    ctx.strokeStyle = 'rgba(139,157,195,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function drawTank(x, y, w, h) {
    /* Back wall */
    var grad = ctx.createLinearGradient(x, y, x + w, y);
    grad.addColorStop(0, 'rgba(40,55,90,0.35)');
    grad.addColorStop(1, 'rgba(20,30,55,0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    /* Glass border */
    ctx.strokeStyle = '#7ec8e3';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y);
    ctx.stroke();

    /* Bottom stand */
    ctx.fillStyle = '#1a2438';
    ctx.fillRect(x - 10, y + h, w + 20, 8);
  }

  function drawFluid(fl, x, y, w, h) {
    /* Body */
    var grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, hexToRgba(fl.color, 0.55));
    grad.addColorStop(1, hexToRgba(fl.color, 0.85));
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    /* Wavy top */
    state.waveT += 0.04;
    ctx.fillStyle = hexToRgba(fl.color, 0.85);
    ctx.beginPath();
    ctx.moveTo(x, y);
    var amp = 2.2, freq = 0.05;
    for (var px = 0; px <= w; px += 4) {
      var ny = y + Math.sin(px * freq + state.waveT) * amp + Math.sin(px * 0.11 + state.waveT * 0.7) * 1.2;
      ctx.lineTo(x + px, ny);
    }
    ctx.lineTo(x + w, y - 4);
    ctx.lineTo(x, y - 4);
    ctx.closePath();
    /* highlight */
    ctx.fillStyle = hexToRgba('#ffffff', 0.18);
    ctx.fill();

    requestDraw();

    /* Fluid label — only if fluid is tall enough */
    if (h > 24) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '700 12px Segoe UI, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(fl.name + '  ρ = ' + fmt(toD(fl.rho, 'rho'), 0) + ' ' + uLabel('rho'), x + 8, y + h - 10);
    }
  }

  function drawObject(cx, cy, size, obj, floats) {
    var col = colorForObject(obj.key);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    if (state.shape === 'cube') {
      ctx.fillStyle = col;
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
      /* highlight */
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(cx - size / 2 + 4, cy - size / 2 + 4, size * 0.3, 4);
    } else if (state.shape === 'sphere') {
      var r = size / 2;
      var g2 = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      g2.addColorStop(0, lighten(col, 0.35));
      g2.addColorStop(1, col);
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    } else {
      var w2 = size, h2 = size * 0.85;
      ctx.fillStyle = col;
      ctx.fillRect(cx - w2 / 2, cy - h2 / 2, w2, h2);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w2 / 2, cy - h2 / 2, w2, h2);
      /* end ellipses */
      ctx.fillStyle = lighten(col, 0.15);
      ctx.beginPath();
      ctx.ellipse(cx, cy - h2 / 2, w2 / 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    /* ── Object info labels ─────────────────────────────────
       Big cubes (≥ 60 px) → labels INSIDE the cube top with halo,
       so they never collide with external force-vector labels.
       Small cubes → outside above the cube. */
    var nameTxt = obj.name;
    var rhoTxt  = 'ρ = ' + fmt(toD(obj.rho, 'rho'), 0) + ' ' + uLabel('rho');
    ctx.save();
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.lineJoin  = 'round';
    if (size >= 60) {
      /* INSIDE cube top */
      var nameY = cy - size / 2 + 12;
      var rhoY  = nameY + 13;
      ctx.textBaseline = 'middle';
      ctx.font = '700 11px Segoe UI, sans-serif';
      ctx.strokeStyle = 'rgba(8,12,22,0.92)';
      ctx.strokeText(nameTxt, cx, nameY);
      ctx.fillStyle = '#fff';
      ctx.fillText(nameTxt, cx, nameY);
      ctx.font = '700 9px Courier New, monospace';
      ctx.strokeText(rhoTxt, cx, rhoY);
      ctx.fillStyle = '#dde3f0';
      ctx.fillText(rhoTxt, cx, rhoY);
    } else {
      /* OUTSIDE above cube — small cubes only */
      ctx.textBaseline = 'alphabetic';
      ctx.font = '700 11px Segoe UI, sans-serif';
      ctx.strokeStyle = 'rgba(8,12,22,0.92)';
      ctx.strokeText(nameTxt, cx, cy - size / 2 - 6);
      ctx.fillStyle = '#fff';
      ctx.fillText(nameTxt, cx, cy - size / 2 - 6);
      ctx.font = '600 10px Courier New, monospace';
      ctx.strokeText(rhoTxt, cx, cy - size / 2 - 20);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(rhoTxt, cx, cy - size / 2 - 20);
    }
    ctx.restore();
  }

  /* drawForces — adaptive placement so arrows + labels never collide.
     • Plenty of room outside cube → arrows extend OUT (W down below, Fb up above).
     • Tight space (object on floor or near top) → arrows draw INSIDE cube,
       starting at the cube edge and ending at cube centre.
     • W_a is rendered as a compact text label only (no arrow) — it is a
       derived quantity (W − Fₑ) and its arrow is the cause of the clutter. */
  function drawForces(cx, cy, size, c, canvasH) {
    var bigF = Math.max(c.W, c.F_b);
    if (bigF <= 0) return;

    var halfH     = size / 2;
    var cubeTopY  = cy - halfH;
    var cubeBotY  = cy + halfH;
    var labelPad  = 16;
    var roomAbove = cubeTopY - labelPad - 4;
    var roomBelow = canvasH - cubeBotY - labelPad - 4;
    var maxArrow  = 70;

    /* ── Buoyancy (cyan, up) ─────────────────────────────── */
    var fbScale = (c.F_b / bigF) * maxArrow;
    var fbStart, fbEnd, fbLabelX, fbLabelAnchor;
    if (roomAbove >= 22) {
      /* External: extends above cube */
      var len = Math.min(fbScale, roomAbove);
      fbStart = cubeTopY - 2;
      fbEnd   = cubeTopY - 2 - len;
      fbLabelX = cx + 14 + 6;
      fbLabelAnchor = 'left';
    } else {
      /* Internal: bottom of cube → centre, points up */
      var lenIn = Math.min(fbScale, halfH - 6);
      fbStart = cubeBotY - 4;
      fbEnd   = cubeBotY - 4 - lenIn;
      fbLabelX = cx + 14 + 6;
      fbLabelAnchor = 'left';
    }
    drawForceArrow(cx + 14, fbStart, cx + 14, fbEnd, '#4fc3f7',
      'Fₑ = ' + fmt(toD(c.F_b, 'force'), 2) + ' ' + uLabel('force'),
      fbLabelX, fbLabelAnchor, canvasH);

    /* ── Weight (red, down) ──────────────────────────────── */
    var wScale = (c.W / bigF) * maxArrow;
    var wStart, wEnd, wLabelX, wLabelAnchor;
    if (roomBelow >= 22) {
      /* External: extends below cube */
      var lenW = Math.min(wScale, roomBelow);
      wStart = cubeBotY + 2;
      wEnd   = cubeBotY + 2 + lenW;
      wLabelX = cx - 14 - 6;
      wLabelAnchor = 'right';
    } else {
      /* Internal: top of cube → centre, points down */
      var lenWIn = Math.min(wScale, halfH - 6);
      wStart = cubeTopY + 4;
      wEnd   = cubeTopY + 4 + lenWIn;
      wLabelX = cx - 14 - 6;
      wLabelAnchor = 'right';
    }
    drawForceArrow(cx - 14, wStart, cx - 14, wEnd, '#ff5555',
      'W = ' + fmt(toD(c.W, 'force'), 2) + ' ' + uLabel('force'),
      wLabelX, wLabelAnchor, canvasH);

    /* ── Apparent weight (compact label — no arrow) ──────── */
    if (!c.floats && c.W_app > 0.005 * Math.max(c.W, 1)) {
      ctx.save();
      ctx.font = '700 11px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var wappTxt = 'Wₐ = ' + fmt(toD(c.W_app, 'force'), 2) + ' ' + uLabel('force');
      var wappY = cubeBotY - 8;
      ctx.lineWidth   = 4;
      ctx.lineJoin    = 'round';
      ctx.strokeStyle = 'rgba(8,12,22,0.92)';
      ctx.strokeText(wappTxt, cx, wappY);
      ctx.fillStyle   = '#3ddc84';
      ctx.fillText(wappTxt, cx, wappY);
      ctx.restore();
    }
  }

  /* drawForceArrow — like drawArrow, but lets the caller pin the label
     to a specific x and anchor (left/right of arrow). Vertically the
     label sits next to the arrow midpoint, clamped inside the canvas. */
  function drawForceArrow(x1, y1, x2, y2, color, label, labelX, anchor, canvasH) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    /* arrowhead */
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var ah  = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ah * Math.cos(ang - Math.PI / 6), y2 - ah * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - ah * Math.cos(ang + Math.PI / 6), y2 - ah * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    /* Label — placed near the arrow TIP so it sits as far from the
       cube/cube-info as possible. Halo for contrast. Clamped to canvas. */
    ctx.font = '700 11px Courier New, monospace';
    ctx.textAlign = anchor === 'right' ? 'right' : 'left';
    ctx.textBaseline = 'middle';
    var arrowUp = y2 < y1;
    var labelY  = arrowUp ? (y2 - 8) : (y2 + 8);
    if (labelY < 12) labelY = 12;
    if (labelY > canvasH - 12) labelY = canvasH - 12;
    ctx.lineWidth   = 4;
    ctx.lineJoin    = 'round';
    ctx.strokeStyle = 'rgba(8,12,22,0.92)';
    ctx.strokeText(label, labelX, labelY);
    ctx.fillStyle   = color;
    ctx.fillText(label, labelX, labelY);
    ctx.restore();
  }

  function drawArrow(x1, y1, x2, y2, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    /* arrowhead */
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var ah = 8;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ah * Math.cos(ang - Math.PI / 6), y2 - ah * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - ah * Math.cos(ang + Math.PI / 6), y2 - ah * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    /* label */
    ctx.font = '700 10px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(label, x2 + 6, y2 + 4);
    ctx.restore();
  }

  function drawEquation(W, c) {
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,30,0.7)';
    ctx.fillRect(W - 230, 10, 220, 56);
    ctx.strokeStyle = 'rgba(2,136,209,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(W - 230, 10, 220, 56);
    ctx.fillStyle = '#7fdbff';
    ctx.font = '700 12px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Fₑ = ρₒ · V · g', W - 220, 28);
    ctx.fillStyle = '#dde3f0';
    ctx.font = '600 11px Courier New, monospace';
    ctx.fillText('= ' + fmt(toD(c.F_b, 'force'), 2) + ' ' + uLabel('force'), W - 220, 46);
    ctx.fillStyle = c.floats ? '#3ddc84' : '#ff5555';
    ctx.fillText(c.floats ? 'FLOATS' : 'SINKS', W - 80, 46);
    ctx.restore();
  }

  function drawSubIndicator(x, y, w, h, c) {
    ctx.save();
    ctx.strokeStyle = 'rgba(139,157,195,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    /* fill from bottom proportional to fracSub */
    var fillH = h * c.fracSub;
    ctx.fillStyle = hexToRgba(c.fl.color, 0.85);
    ctx.fillRect(x + 1, y + h - fillH + 1, w - 2, fillH - 2);
    /* label */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sub', x + w / 2, y - 4);
    ctx.fillText((c.fracSub * 100).toFixed(1) + '%', x + w / 2, y + h + 14);
    ctx.restore();
  }

  function spawnSplash(x, y) {
    for (var i = 0; i < 14; i++) {
      state.splash.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: -2 - Math.random() * 4,
        life: 0, max: 28
      });
    }
  }
  function drawSplash() {
    for (var i = state.splash.length - 1; i >= 0; i--) {
      var p = state.splash[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life++;
      if (p.life > p.max) { state.splash.splice(i, 1); continue; }
      ctx.fillStyle = 'rgba(127,219,255,' + (1 - p.life / p.max) + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    if (state.splash.length) requestDraw();
  }

  /* ── Helpers: colors ────────────────────────────────────────── */
  function hexToRgba(hex, a) {
    if (hex.indexOf('rgba') === 0) return hex;
    var m = hex.replace('#', '');
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    var r = parseInt(m.substring(0, 2), 16);
    var g = parseInt(m.substring(2, 4), 16);
    var b = parseInt(m.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function lighten(hex, amt) {
    var m = hex.replace('#', '');
    if (m.length === 3) m = m[0] + m[0] + m[1] + m[1] + m[2] + m[2];
    var r = Math.min(255, parseInt(m.substring(0, 2), 16) + Math.round(255 * amt));
    var g = Math.min(255, parseInt(m.substring(2, 4), 16) + Math.round(255 * amt));
    var b = Math.min(255, parseInt(m.substring(4, 6), 16) + Math.round(255 * amt));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function colorForObject(key) {
    var map = {
      cork: '#c9a169', wood: '#a06b3c', wax: '#e8d59a', ice: '#bfe7f5',
      plastic: '#e8e0d0', aluminum: '#bfc9d6', iron: '#5a6275', lead: '#3a3f4d'
    };
    return map[key] || '#888';
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
    $('r-rho-o').textContent  = fmt(toD(c.obj.rho, 'rho'), 0);
    $('r-rho-f').textContent  = fmt(toD(c.fl.rho, 'rho'), 0);
    $('r-mass').textContent   = fmt(toD(c.mass, 'mass'), 3);
    $('r-weight').textContent = fmt(toD(c.W, 'force'), 2);
    $('r-fb').textContent     = fmt(toD(c.F_b, 'force'), 2);
    $('r-wapp').textContent   = fmt(toD(c.W_app, 'force'), 2);
    $('r-sub').textContent    = (c.fracSub * 100).toFixed(1);
    $('r-vdisp').textContent  = fmt(toD(c.V_disp * 1000, 'vol'), 3);

    var u = uLabel('rho');
    $('r-unit-rho-o').textContent = ' ' + u;
    $('r-unit-rho-f').textContent = ' ' + u;
    $('r-unit-mass').textContent  = ' ' + uLabel('mass');
    $('r-unit-w').textContent     = ' ' + uLabel('force');
    $('r-unit-fb').textContent    = ' ' + uLabel('force');
    $('r-unit-wapp').textContent  = ' ' + uLabel('force');
    $('r-unit-vdisp').textContent = ' ' + uLabel('vol');
    $('badge-vol').textContent    = uLabel('vol');

    /* Badges */
    var badges = $('readout-badges');
    if (badges) badges.style.display = (state.mode === 'simulate') ? '' : 'none';
    $('rb-status').textContent = c.floats ? 'Floats' : 'Sinks';
    $('rb-status').style.color = c.floats ? '#3ddc84' : '#ff5555';
    $('rb-sub').textContent = (c.fracSub * 100).toFixed(1);
    $('rb-w').textContent  = fmt(toD(c.W, 'force'), 2);
    $('rb-fb').textContent = fmt(toD(c.F_b, 'force'), 2);
    $('rb-w-u').textContent  = uLabel('force');
    $('rb-fb-u').textContent = uLabel('force');

    updateLearnPanels(c);
  }

  /* ── Learning panels ────────────────────────────────────────── */
  var _learnCache = { eq: '', cmp: '', co: '' };
  function updateLearnPanels(c) {
    var eq = $('lp-eq-body'); if (!eq) return;
    var V_show = toD(c.V_m3 * 1000, 'vol');
    var rho_o = toD(c.obj.rho, 'rho'), rho_f = toD(c.fl.rho, 'rho');
    var html = '';
    var uF = isImp() ? '\\mathrm{lbf}' : '\\mathrm{N}';
    var uV = isImp() ? '\\mathrm{gal}' : '\\mathrm{L}';
    var uM = isImp() ? '\\mathrm{lb}' : '\\mathrm{kg}';
    var gStr = isImp() ? '32.17\\;\\mathrm{ft/s^2}' : '9.81\\;\\mathrm{m/s^2}';
    html += '<div class="eq-line">\\[ F_b = \\rho_{\\text{fluid}} \\cdot V_{\\text{disp}} \\cdot g \\]</div>';
    html += '<div class="eq-line">\\(F_b = ' + fmt(rho_f, 0) + ' \\cdot ' + fmt(toD(c.V_disp * 1000, 'vol'), 3) + '\\;' + uV + ' \\cdot ' + gStr + ' = \\mathbf{' + fmt(toD(c.F_b, 'force'), 2) + '\\;' + uF + '}\\)</div>';
    html += '<div class="eq-line">\\(W = m \\cdot g = ' + fmt(toD(c.mass, 'mass'), 3) + '\\;' + uM + ' \\cdot g = \\mathbf{' + fmt(toD(c.W, 'force'), 2) + '\\;' + uF + '}\\)</div>';
    if (c.floats) {
      html += '<div class="eq-line">Floats: \\(\\dfrac{V_{\\text{sub}}}{V} = \\dfrac{\\rho_{\\text{obj}}}{\\rho_{\\text{fluid}}} = \\dfrac{' + fmt(c.obj.rho, 0) + '}{' + fmt(c.fl.rho, 0) + '} = \\mathbf{' + (c.fracSub * 100).toFixed(1) + '\\%}\\)</div>';
    } else if (c.obj.rho < c.fl.rho && c.restingOnFloor) {
      html += '<div class="eq-line">Fluid too shallow to float — object rests on floor.</div>';
      html += '<div class="eq-line">\\(h_{\\text{sub}} = h_{\\text{fluid}} = ' + (c.h_f_m * 100).toFixed(1) + '\\;\\mathrm{cm} < L = ' + (c.L_m * 100).toFixed(1) + '\\;\\mathrm{cm}\\)</div>';
      html += '<div class="eq-line">\\(W_a = W - F_b = \\mathbf{' + fmt(toD(c.W_app, 'force'), 2) + '\\;' + uF + '}\\)</div>';
    } else {
      html += '<div class="eq-line">Sinks: \\(W_a = W - F_b = \\mathbf{' + fmt(toD(c.W_app, 'force'), 2) + '\\;' + uF + '}\\)</div>';
    }
    if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }

    /* Compare table */
    var cmp = $('lp-cmp-body');
    if (cmp) {
      var rows = '<table class="cmp-table"><thead><tr><th>Object</th><th>ρ (' + uLabel('rho') + ')</th><th>Result</th><th>Sub %</th></tr></thead><tbody>';
      for (var i = 0; i < OBJECTS.length; i++) {
        var o = OBJECTS[i];
        var f = o.rho < c.fl.rho;
        var sub = f ? (o.rho / c.fl.rho * 100).toFixed(1) + '%' : '100%';
        rows += '<tr><td>' + o.name + '</td><td>' + fmt(toD(o.rho, 'rho'), 0) + '</td>'
              + '<td class="' + (f ? 'cmp-float' : 'cmp-sink') + '">' + (f ? 'Floats' : 'Sinks') + '</td>'
              + '<td>' + sub + '</td></tr>';
      }
      rows += '</tbody></table>';
      if (rows !== _learnCache.cmp) { cmp.innerHTML = rows; _learnCache.cmp = rows; }
    }

    /* Coach */
    var co = $('lp-coach-body');
    if (co) {
      var tips = [];
      if (c.floats) {
        tips.push('Object density (' + fmt(rho_o, 0) + ') is less than fluid density (' + fmt(rho_f, 0) + '), so it floats.');
        tips.push('Submerged fraction = ρₒ/ρₑ = ' + (c.fracSub * 100).toFixed(1) + '%. Doubling the volume keeps this ratio identical.');
        var deltaRho = c.fl.rho - c.obj.rho;
        tips.push('To make it sink, increase object density by at least ' + fmt(toD(deltaRho, 'rho'), 0) + ' ' + uLabel('rho') + ', or lower the fluid level.');
      } else if (c.obj.rho < c.fl.rho && c.restingOnFloor) {
        tips.push('The object would naturally float, but the fluid is only ' + (c.h_f_m * 100).toFixed(1) + ' cm deep — less than the natural floating depth ' + (c.L_m * c.obj.rho / c.fl.rho * 100).toFixed(1) + ' cm. So it sits on the floor, partly submerged.');
        tips.push('Buoyant force = ρₑ · V_disp · g, with V_disp limited to the submerged portion = ' + (c.fracSub * 100).toFixed(1) + '% of V.');
        tips.push('Raise the fluid level above ' + (c.L_m * c.obj.rho / c.fl.rho * 100).toFixed(1) + ' cm to let the object float freely.');
      } else {
        tips.push('Object density (' + fmt(rho_o, 0) + ') exceeds fluid density (' + fmt(rho_f, 0) + '), so it sinks.');
        var supportPct = c.W > 0 ? (c.F_b / c.W * 100) : 0;
        tips.push('Apparent weight = W − Fₑ = ' + fmt(toD(c.W_app, 'force'), 2) + ' ' + uLabel('force') + ' — the fluid supports ' + supportPct.toFixed(1) + '% of the weight.');
        if (c.h_f_m < c.L_m) {
          tips.push('Note: fluid is only ' + (c.h_f_m * 100).toFixed(1) + ' cm deep, so only ' + (c.fracSub * 100).toFixed(1) + '% of the object is submerged. Fully submerge by raising the fluid level.');
        } else {
          tips.push('To make it float, switch to a denser fluid (e.g. mercury) or hollow out the object so its average density drops below ρₑ.');
        }
      }
      var html2 = '<ul class="coach-list">';
      for (var k = 0; k < tips.length; k++) html2 += '<li>' + tips[k] + '</li>';
      html2 += '</ul>';
      if (html2 !== _learnCache.co) { co.innerHTML = html2; _learnCache.co = html2; }
    }
  }

  /* ── Material selectors ─────────────────────────────────────── */
  function rebuildSelectors() {
    var so = $('sel-object'), sf = $('sel-fluid');
    so.innerHTML = ''; sf.innerHTML = '';
    var allO = OBJECTS.concat(state.customObjects);
    var allF = FLUIDS.concat(state.customFluids);
    for (var i = 0; i < allO.length; i++) {
      var o = allO[i];
      var op = document.createElement('option');
      op.value = o.key; op.textContent = o.name + ' (ρ = ' + fmt(toD(o.rho, 'rho'), 0) + ' ' + uLabel('rho') + ')';
      so.appendChild(op);
    }
    for (var j = 0; j < allF.length; j++) {
      var fl = allF[j];
      var op2 = document.createElement('option');
      op2.value = fl.key; op2.textContent = fl.name + ' (ρ = ' + fmt(toD(fl.rho, 'rho'), 0) + ' ' + uLabel('rho') + ')';
      sf.appendChild(op2);
    }
    so.value = state.objKey;
    sf.value = state.flKey;
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
    state.objKey = p.obj; state.flKey = p.fl; state.volume = p.v; state.shape = p.sh;
    syncControls();
    resetDrop();
    updateReadouts();
    requestDraw();
    /* highlight chip */
    var chips = document.querySelectorAll('.preset-chip');
    chips.forEach(function (c) { c.classList.toggle('active', c.textContent === p.name); });
  }

  /* ── Sync controls to state ─────────────────────────────────── */
  function syncControls() {
    $('sel-object').value = state.objKey;
    $('sel-fluid').value  = state.flKey;
    /* Volume slider in display units */
    var vDisp = toD(state.volume, 'vol');
    $('sl-vol').value = state.volume;
    $('in-vol').value = vDisp.toFixed(2);
    /* Fluid level slider (percent) */
    var pct = Math.round(state.fluidLevel * 100);
    $('sl-fl').value = pct;
    $('in-fl').value = pct;
    /* Shape pills */
    var pills = document.querySelectorAll('#shape-tabs .pill');
    pills.forEach(function (p) { p.classList.toggle('active', p.dataset.shape === state.shape); });
  }

  /* ── Reset drop animation ───────────────────────────────────── */
  function resetDrop() {
    state.yPos = 0;
    state.vY = 0;
    state.settled = false;
    state._splashed = false;
    state.splash = [];
  }

  /* ── History (undo/redo) ────────────────────────────────────── */
  function snapshot() {
    return {
      objKey: state.objKey, flKey: state.flKey, volume: state.volume,
      fluidLevel: state.fluidLevel, shape: state.shape, unit: state.unit
    };
  }
  function pushHistory() {
    state.history.push(snapshot());
    if (state.history.length > 30) state.history.shift();
    state.redoStack = [];
  }
  function applySnap(s) {
    state.objKey = s.objKey; state.flKey = s.flKey; state.volume = s.volume;
    state.shape = s.shape; state.unit = s.unit;
    if (typeof s.fluidLevel === 'number') state.fluidLevel = s.fluidLevel;
    syncControls();
    syncUnitTabs();
    rebuildSelectors();
    resetDrop();
    requestDraw();
  }
  function doUndo() {
    if (state.history.length === 0) return;
    state.redoStack.push(snapshot());
    applySnap(state.history.pop());
  }
  function doRedo() {
    if (state.redoStack.length === 0) return;
    state.history.push(snapshot());
    applySnap(state.redoStack.pop());
  }
  function syncUnitTabs() {
    var pills = document.querySelectorAll('#unit-tabs .pill');
    pills.forEach(function (p) { p.classList.toggle('active', p.dataset.unit === state.unit); });
  }

  /* ── Mode switching ─────────────────────────────────────────── */
  function setMode(m) {
    state.mode = m;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });
    var simBoxes = ['sim-panel', 'preset-row', 'learn-panels', 'canvas-action-bar'];
    /* simulate mode UI */
    $('sim-panel').style.display      = (m === 'simulate') ? '' : 'none';
    $('learn-panels').style.display   = (m === 'simulate') ? '' : 'none';
    /* explore */
    $('cat-row').style.display        = (m === 'explore') ? '' : 'none';
    $('item-selector').style.display  = (m === 'explore') ? '' : 'none';
    $('item-info').style.display      = (m === 'explore') ? '' : 'none';
    /* practice */
    $('practice-panel').style.display = (m === 'practice') ? '' : 'none';
    $('practice-bar').style.display   = (m === 'practice') ? '' : 'none';
    /* quiz */
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
      { title: 'Archimedes’ Principle', body: 'A fluid pushes up on any object placed in it with a force equal to the weight of the fluid the object pushes aside. Discovered c. 250 BC.', formula: 'Fₑ = ρ · V · g', note: 'The force acts upward through the centroid of the displaced volume.' },
      { title: 'What is Density?', body: 'Density (ρ) is mass per unit volume. Water = 1000 kg/m³ (or 1 g/cm³). Steel is 7.87× denser than water; cork is 4× less dense.', formula: 'ρ = m / V', note: 'Average density determines float-or-sink — a steel ship floats because hull + air has ρ < water.' },
      { title: 'Why Things Float', body: 'An object floats when its average density is less than the fluid’s. The submerged fraction equals the density ratio ρₒ / ρₑ.', formula: 'Vₛᵤᵇ / V = ρₒ / ρₑ', note: 'Ice / sea water = 917 / 1025 ≈ 0.895 — about 89.5% of an iceberg is below the surface.' },
      { title: 'Forces in Equilibrium', body: 'A floating object has W = Fₑ exactly. A sinking object has W > Fₑ, with the difference (apparent weight) carried by the supporting surface.', formula: 'Floats: W = Fₑ   Sinks: W > Fₑ', note: 'A scale under a fully-submerged object reads its apparent weight, not its true weight.' }
    ],
    formulas: [
      { title: 'Buoyant Force', body: 'The fundamental Archimedes equation. Note that the buoyant force depends only on fluid density, displaced volume, and g — not on the object’s material or shape.', formula: 'Fₑ = ρₑ · V_disp · g', note: 'For a 1 L cube fully submerged in water: Fₑ = 1000 × 0.001 × 9.81 = 9.81 N.' },
      { title: 'Submerged Fraction (Floating)', body: 'Equate weight and buoyancy when an object floats: ρₒ V g = ρₑ V_sub g. Cancelling V g gives the simple ratio.', formula: 'V_sub / V = ρₒ / ρₑ', note: 'Ice (917 kg/m³) in fresh water (1000 kg/m³) → 91.7% submerged.' },
      { title: 'Apparent Weight (Sinking)', body: 'Net downward force on a fully submerged sinking object. This is what a kitchen scale would read if the object sat on it underwater.', formula: 'Wₐ = (ρₒ − ρₑ) · V · g', note: 'A 0.5 L (0.0005 m³) steel cube in water: Wₐ = (7870 − 1000) × 0.0005 × 9.81 = 33.7 N.' },
      { title: 'Density from Buoyancy', body: 'Hydrometers exploit Archimedes to measure fluid density: a calibrated float sinks deeper in lighter fluids, and the visible scale reads density directly.', formula: 'ρₑ = m / V_sub', note: 'Wine, milk, and battery-acid testers all use this principle.' }
    ],
    applications: [
      { title: 'Steel Ships', body: 'A solid steel cube sinks because ρ = 7870 kg/m³ ≫ 1000. A ship floats because its hull is mostly air-filled; the average density of (steel + air + cargo) is below 1000.', formula: 'ρ_avg = M_total / V_hull', note: 'Maximum cargo is the additional weight that brings ρ_avg up to fluid density (Plimsoll line).' },
      { title: 'Submarines', body: 'A submarine controls depth by adjusting average density. Water in ballast tanks → sinks. Compressed air pushes water out → rises. At neutral buoyancy it hovers.', formula: 'ρ_sub adjusted via ballast', note: 'Neutral buoyancy: ρ_avg = ρₑ. The sub then needs only minor thrust to maintain depth.' },
      { title: 'Hot-Air Balloons', body: 'Heating air inside the envelope reduces its density below the surrounding cold air. The air-displaced weight exceeds the (basket + heated air + payload) weight — net upward force.', formula: 'Fₑ = ρ_air_cold · V · g', note: 'Heating air to 99°C reduces its density by ~25% relative to 20°C ambient.' },
      { title: 'Hydrometer', body: 'A weighted float used to measure liquid density. Used in brewing (specific gravity of wort), automotive (battery acid health), and dairy (milk fat content).', formula: 'reads ρₑ directly', note: 'Specific gravity = ρ_sample / ρ_water; pure water reads 1.000, denser liquids read above 1.' }
    ],
    errors: [
      { title: 'Mass vs Weight', body: 'Mass (kg) is the amount of matter — unchanged by gravity. Weight (N) = m · g — changes on the Moon. Use weight in force-balance problems, mass for momentum.', formula: 'W = m · g', note: '1 kg weighs 9.81 N on Earth, 1.62 N on the Moon. Buoyancy formulas use weight (N).' },
      { title: 'Volume Units Trap', body: '1 m³ = 1000 L = 1 000 000 cm³. Always convert to SI base (m³) before using ρ = kg/m³ in Fₑ = ρVg.', formula: '1 L = 0.001 m³', note: 'A common error: using V in L with ρ in kg/m³ gives a result 1000× too small.' },
      { title: 'Density vs Specific Gravity', body: 'Specific gravity (SG) is dimensionless: SG = ρ_sample / ρ_water. Water has SG = 1.000. Don’t confuse SG with density when plugging into formulas — always convert to absolute density first.', formula: 'SG = ρ / ρ_water', note: 'Mercury has ρ = 13534 kg/m³ and SG = 13.534.' },
      { title: 'Shape Doesn’t Matter (for uniform solids)', body: 'For a uniform solid, only the average density determines float-or-sink — not the shape. A cube and a sphere of the same material both float (or sink) the same way.', formula: 'Float ⇔ ρₒ < ρₑ', note: 'Shape DOES matter for non-uniform structures (boats, hollow containers) where average density depends on geometry.' }
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
  function randObj() { return OBJECTS[Math.floor(Math.random() * OBJECTS.length)]; }
  function randFluid() {
    /* exclude mercury most of the time */
    var pool = FLUIDS.filter(function (f) { return f.key !== 'mercury' || Math.random() < 0.15; });
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function newPractice() {
    var types = ['fb', 'sub', 'wapp', 'mass'];
    var t = types[Math.floor(Math.random() * types.length)];
    var o = randObj(), f = randFluid();
    var V_L = (Math.round((0.3 + Math.random() * 4) * 10) / 10);    // 0.3 - 4.3 L
    var V_m3 = V_L / 1000;
    var ans, prompt, unit;
    if (t === 'fb') {
      ans = f.rho * V_m3 * G;
      if (o.rho >= f.rho) {
        // sinking — F_b uses full V
      } else {
        ans = f.rho * (o.rho / f.rho) * V_m3 * G;  // = o.rho * V_m3 * G
      }
      prompt = 'A ' + V_L + ' L solid ' + o.name + ' (ρ = ' + o.rho + ' kg/m³) is placed in ' + f.name + ' (ρ = ' + f.rho + ' kg/m³). What is the buoyant force on the object?';
      unit = 'N'; ans = isImp() ? ans * 0.224809 : ans;
      if (isImp()) unit = 'lbf';
    } else if (t === 'sub') {
      if (o.rho >= f.rho) {
        // re-roll
        return newPractice();
      }
      ans = (o.rho / f.rho) * 100;
      prompt = 'A solid ' + o.name + ' (ρ = ' + o.rho + ' kg/m³) floats in ' + f.name + ' (ρ = ' + f.rho + ' kg/m³). What percentage of its volume is submerged?';
      unit = '%';
    } else if (t === 'wapp') {
      if (o.rho <= f.rho) return newPractice();
      ans = (o.rho - f.rho) * V_m3 * G;
      prompt = 'A ' + V_L + ' L block of ' + o.name + ' (ρ = ' + o.rho + ' kg/m³) is fully submerged in ' + f.name + ' (ρ = ' + f.rho + ' kg/m³). Calculate its apparent weight in the fluid.';
      unit = 'N'; ans = isImp() ? ans * 0.224809 : ans;
      if (isImp()) unit = 'lbf';
    } else {
      ans = o.rho * V_m3;
      prompt = 'Find the mass of a ' + V_L + ' L solid block of ' + o.name + ' (ρ = ' + o.rho + ' kg/m³).';
      unit = 'kg'; ans = isImp() ? ans * 2.204623 : ans;
      if (isImp()) unit = 'lb';
    }
    state.pp.problem = { type: t, ans: ans, unit: unit, V_L: V_L, V_m3: V_m3, o: o, f: f };
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
    var tol = Math.abs(p.ans) * 0.05 + 0.01;
    state.pp.total++;
    if (Math.abs(v - p.ans) <= tol) {
      state.pp.score++;
      $('pp-feedback').textContent = '✓ Correct! Answer = ' + fmt(p.ans, 3) + ' ' + p.unit;
      $('pp-feedback').className = 'feedback ok';
      playSuccess();
    } else {
      $('pp-feedback').textContent = '✗ Not quite. Correct answer: ' + fmt(p.ans, 3) + ' ' + p.unit;
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
    if (p.type === 'fb') {
      var Fb = p.f.rho * (p.o.rho < p.f.rho ? p.o.rho / p.f.rho : 1) * p.V_m3 * G;
      html += '<div class="sol-step">1. Convert volume: V = ' + p.V_L + ' L = <strong>' + p.V_m3 + ' m³</strong></div>';
      if (p.o.rho < p.f.rho) {
        html += '<div class="sol-step">2. Object floats (ρₒ < ρₑ). V_disp = (ρₒ/ρₑ) · V = ' + (p.o.rho / p.f.rho).toFixed(4) + ' · ' + p.V_m3 + ' = <strong>' + (p.o.rho / p.f.rho * p.V_m3).toFixed(5) + ' m³</strong></div>';
      } else {
        html += '<div class="sol-step">2. Object sinks (ρₒ ≥ ρₑ). V_disp = V = <strong>' + p.V_m3 + ' m³</strong></div>';
      }
      html += '<div class="sol-step">3. Fₑ = ρₑ · V_disp · g = ' + p.f.rho + ' · ' + (p.o.rho < p.f.rho ? (p.o.rho / p.f.rho * p.V_m3).toFixed(5) : p.V_m3) + ' · 9.81 = <strong>' + Fb.toFixed(2) + ' N</strong></div>';
      if (isImp()) html += '<div class="sol-step">4. Convert: ' + Fb.toFixed(2) + ' N × 0.2248 = <strong>' + (Fb * 0.224809).toFixed(2) + ' lbf</strong></div>';
    } else if (p.type === 'sub') {
      html += '<div class="sol-step">1. For floating: V_sub / V = ρₒ / ρₑ</div>';
      html += '<div class="sol-step">2. = ' + p.o.rho + ' / ' + p.f.rho + ' = <strong>' + (p.o.rho / p.f.rho).toFixed(4) + '</strong></div>';
      html += '<div class="sol-step">3. As %: <strong>' + (p.o.rho / p.f.rho * 100).toFixed(1) + '%</strong></div>';
    } else if (p.type === 'wapp') {
      var Wa = (p.o.rho - p.f.rho) * p.V_m3 * G;
      html += '<div class="sol-step">1. W = ρₒ · V · g = ' + p.o.rho + ' · ' + p.V_m3 + ' · 9.81 = <strong>' + (p.o.rho * p.V_m3 * G).toFixed(2) + ' N</strong></div>';
      html += '<div class="sol-step">2. Fₑ = ρₑ · V · g = ' + p.f.rho + ' · ' + p.V_m3 + ' · 9.81 = <strong>' + (p.f.rho * p.V_m3 * G).toFixed(2) + ' N</strong></div>';
      html += '<div class="sol-step">3. Wₐ = W − Fₑ = <strong>' + Wa.toFixed(2) + ' N</strong></div>';
      if (isImp()) html += '<div class="sol-step">4. Convert: ' + Wa.toFixed(2) + ' N × 0.2248 = <strong>' + (Wa * 0.224809).toFixed(2) + ' lbf</strong></div>';
    } else {
      var m = p.o.rho * p.V_m3;
      html += '<div class="sol-step">1. m = ρ · V = ' + p.o.rho + ' · ' + p.V_m3 + ' = <strong>' + m.toFixed(3) + ' kg</strong></div>';
      if (isImp()) html += '<div class="sol-step">2. Convert: ' + m.toFixed(3) + ' kg × 2.2046 = <strong>' + (m * 2.204623).toFixed(3) + ' lb</strong></div>';
    }
    var box = $('pp-solution');
    box.innerHTML = html;
    box.style.display = '';
  }

  /* ── Quiz ───────────────────────────────────────────────────── */
  function buildQuizQs() {
    return [
      {
        q: 'An ice cube (ρ = 917 kg/m³) floats in fresh water (ρ = 1000 kg/m³). What fraction of its volume is below the waterline?',
        opts: ['8.3%', '50%', '91.7%', '100%'],
        ans: 2,
        ex: 'V_sub/V = ρₒ/ρₑ = 917/1000 = 0.917 = 91.7%.'
      },
      {
        q: 'A solid lead block (ρ = 11340 kg/m³) is dropped into mercury (ρ = 13534 kg/m³). What happens?',
        opts: ['It sinks completely', 'It floats with about 84% submerged', 'It dissolves', 'It floats with 50% submerged'],
        ans: 1,
        ex: 'Lead is less dense than mercury, so it floats. V_sub/V = 11340/13534 ≈ 0.838.'
      },
      {
        q: 'What is the buoyant force on a 1 L (0.001 m³) cube fully submerged in fresh water? (g = 9.81 m/s²)',
        opts: ['0.981 N', '9.81 N', '98.1 N', '981 N'],
        ans: 1,
        ex: 'Fₑ = ρVg = 1000 × 0.001 × 9.81 = 9.81 N.'
      },
      {
        q: 'A boat that floats in fresh water is moved to the sea (salt water, ρ = 1025 kg/m³). What changes?',
        opts: ['The boat sinks deeper', 'The boat sits slightly higher', 'No change', 'The boat capsizes'],
        ans: 1,
        ex: 'Sea water is denser, so less volume needs to be displaced to support the same weight — the boat sits higher.'
      },
      {
        q: 'Two cubes of equal volume — aluminium (2700) and steel (7870) — are submerged in water. Which experiences the larger buoyant force?',
        opts: ['Aluminium', 'Steel', 'Equal', 'Depends on shape'],
        ans: 2,
        ex: 'Fₑ depends only on ρₑ, V_disp, and g. Both cubes displace equal volumes, so Fₑ is identical. (Their weights differ.)'
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
  var cmType = 'obj';
  function openCM(presetType) {
    $('cust-modal').classList.add('active');
    setCMType(presetType || 'obj');
    $('cm-name').value = ''; $('cm-rho').value = '';
    $('cm-err').style.display = 'none';
    setTimeout(function () { $('cm-name').focus(); }, 30);
  }
  function closeCM() { $('cust-modal').classList.remove('active'); }
  function setCMType(t) {
    cmType = t;
    $('cm-type-obj').classList.toggle('active', t === 'obj');
    $('cm-type-fluid').classList.toggle('active', t === 'fluid');
    $('cm-hint').textContent = t === 'obj'
      ? 'Object density. Range: 50–25 000 ' + uLabel('rho') + '.'
      : 'Fluid density. Range: 500–14 000 ' + uLabel('rho') + '.';
    $('cm-unit-label').innerHTML = 'ρ (' + uLabel('rho') + ')';
  }
  function addCustom() {
    var name = ($('cm-name').value || '').trim();
    var rhoDisp = parseFloat($('cm-rho').value);
    if (!name) return cmErr('Enter a name.');
    if (!isFinite(rhoDisp) || rhoDisp <= 0) return cmErr('Enter a positive density.');
    var rhoSI = isImp() ? rhoDisp / 0.062428 : rhoDisp;
    if (cmType === 'obj') {
      if (rhoSI < 50 || rhoSI > 25000) return cmErr('Object density must be 50–25 000 kg/m³.');
    } else {
      if (rhoSI < 500 || rhoSI > 14000) return cmErr('Fluid density must be 500–14 000 kg/m³.');
    }
    var key = 'custom_' + Date.now();
    if (cmType === 'obj') {
      state.customObjects.push({ key: key, name: name, rho: rhoSI });
      state.objKey = key;
    } else {
      state.customFluids.push({ key: key, name: name, rho: rhoSI, color: '#9aa0d4' });
      state.flKey = key;
    }
    rebuildSelectors();
    syncControls();
    resetDrop();
    updateReadouts();
    requestDraw();
    closeCM();
  }
  function cmErr(msg) {
    $('cm-err').textContent = msg;
    $('cm-err').style.display = '';
    playError();
  }

  /* ── Calc modal (Show Calculations) ─────────────────────────── */
  function openCalc() {
    var c = compute();
    var V_L = c.V_m3 * 1000;
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Inputs</span>';
    html += '<div class="cs-given">';
    html += '<span>Object: ' + c.obj.name + '</span>';
    html += '<span>\\(\\rho_{\\text{obj}} = ' + fmt(toD(c.obj.rho, 'rho'), 0) + '\\;\\mathrm{' + (isImp() ? 'lb/ft^3' : 'kg/m^3') + '}\\)</span>';
    html += '<span>Fluid: ' + c.fl.name + '</span>';
    html += '<span>\\(\\rho_{\\text{fluid}} = ' + fmt(toD(c.fl.rho, 'rho'), 0) + '\\;\\mathrm{' + (isImp() ? 'lb/ft^3' : 'kg/m^3') + '}\\)</span>';
    html += '<span>\\(V = ' + fmt(toD(V_L, 'vol'), 3) + '\\;\\mathrm{' + (isImp() ? 'gal' : 'L') + '}\\)</span>';
    html += '<span>\\(g = 9.81\\;\\mathrm{m/s^2}\\)</span>';
    html += '</div>';
    html += '<p class="cs-si-note">Calculations performed in SI base units (\\(\\mathrm{kg/m^3}, \\mathrm{m^3}, \\mathrm{N}\\)) and converted for display.</p>';
    html += '</div>';

    /* Step 1 */
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 1</span><span class="cs-title">Mass of object</span></div>';
    html += '<div class="cs-formula">\\[ m = \\rho_{\\text{obj}} \\cdot V \\]</div>';
    html += '<div class="cs-calc">\\(m = ' + c.obj.rho + '\\;\\mathrm{kg/m^3} \\cdot ' + (c.V_m3).toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^3}\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + fmt(toD(c.mass, 'mass'), 3) + '\\;\\mathrm{' + (isImp() ? 'lb' : 'kg') + '}}\\)</div></div>';

    /* Step 2 */
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 2</span><span class="cs-title">Weight</span></div>';
    html += '<div class="cs-formula">\\[ W = m \\cdot g \\]</div>';
    html += '<div class="cs-calc">\\(W = ' + c.mass.toFixed(4) + '\\;\\mathrm{kg} \\cdot 9.81\\;\\mathrm{m/s^2}\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + fmt(toD(c.W, 'force'), 2) + '\\;\\mathrm{' + (isImp() ? 'lbf' : 'N') + '}}\\)</div></div>';

    /* Step 3 */
    if (c.floats) {
      html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Float check &amp; submerged fraction</span></div>';
      html += '<div class="cs-formula">\\[ \\rho_{\\text{obj}} < \\rho_{\\text{fluid}} \\;\\&\\; h_{\\text{fluid}} \\ge L \\cdot \\dfrac{\\rho_{\\text{obj}}}{\\rho_{\\text{fluid}}} \\;\\Rightarrow\\; \\text{floats freely} \\]</div>';
      html += '<div class="cs-calc">\\(\\dfrac{V_{\\text{sub}}}{V} = \\dfrac{\\rho_{\\text{obj}}}{\\rho_{\\text{fluid}}} = \\dfrac{' + c.obj.rho + '}{' + c.fl.rho + '} = ' + (c.fracSub).toFixed(4) + '\\)</div>';
      html += '<div class="cs-result">\\(= \\mathbf{' + (c.fracSub * 100).toFixed(1) + '\\%}\\) submerged</div></div>';
    } else if (c.obj.rho < c.fl.rho && c.restingOnFloor) {
      html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Limited fluid — object on floor</span></div>';
      html += '<div class="cs-formula">\\[ h_{\\text{fluid}} < L \\cdot \\dfrac{\\rho_{\\text{obj}}}{\\rho_{\\text{fluid}}} \\;\\Rightarrow\\; \\text{rests on floor} \\]</div>';
      html += '<div class="cs-calc">\\(L = V^{1/3} = ' + (c.L_m * 100).toFixed(2) + '\\;\\mathrm{cm}, \\quad h_{\\text{fluid}} = ' + (c.h_f_m * 100).toFixed(2) + '\\;\\mathrm{cm}\\)</div>';
      html += '<div class="cs-calc">\\(h_{\\text{sub}} = \\min(L, h_{\\text{fluid}}) = ' + (c.h_sub_m * 100).toFixed(2) + '\\;\\mathrm{cm}\\)</div>';
      html += '<div class="cs-calc">\\(V_{\\text{disp}} = \\dfrac{h_{\\text{sub}}}{L} \\cdot V = ' + (c.fracSub).toFixed(4) + ' \\cdot ' + (c.V_m3).toExponential(3).replace('e', ' \\times 10^{') + '} = ' + (c.V_disp).toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^3}\\)</div>';
      html += '<div class="cs-result">Submerged: \\(\\mathbf{' + (c.fracSub * 100).toFixed(1) + '\\%}\\)</div></div>';
    } else {
      /* Sinks (ρ_o ≥ ρ_f) */
      var fullySub = c.fracSub >= 0.999;
      html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Sinks — submerged volume</span></div>';
      html += '<div class="cs-formula">\\[ \\rho_{\\text{obj}} \\ge \\rho_{\\text{fluid}} \\;\\Rightarrow\\; \\text{sinks};\\quad V_{\\text{disp}} = \\dfrac{h_{\\text{sub}}}{L} \\cdot V \\]</div>';
      if (fullySub) {
        html += '<div class="cs-calc">\\(h_{\\text{fluid}}\\,(' + (c.h_f_m * 100).toFixed(2) + '\\,\\mathrm{cm}) \\ge L\\,(' + (c.L_m * 100).toFixed(2) + '\\,\\mathrm{cm})\\) → fully submerged</div>';
        html += '<div class="cs-result">\\(V_{\\text{disp}} = V = \\mathbf{' + (c.V_m3).toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^3}}\\)</div></div>';
      } else {
        html += '<div class="cs-calc">\\(h_{\\text{fluid}}\\,(' + (c.h_f_m * 100).toFixed(2) + '\\,\\mathrm{cm}) < L\\,(' + (c.L_m * 100).toFixed(2) + '\\,\\mathrm{cm})\\) → only ' + (c.fracSub * 100).toFixed(1) + '% submerged</div>';
        html += '<div class="cs-result">\\(V_{\\text{disp}} = \\mathbf{' + (c.V_disp).toExponential(3).replace('e', ' \\times 10^{') + '}\\;\\mathrm{m^3}}\\)</div></div>';
      }
    }

    /* Step 4 */
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 4</span><span class="cs-title">Buoyant force</span></div>';
    html += '<div class="cs-formula">\\[ F_b = \\rho_{\\text{fluid}} \\cdot V_{\\text{disp}} \\cdot g \\]</div>';
    html += '<div class="cs-calc">\\(F_b = ' + c.fl.rho + ' \\cdot ' + (c.V_disp).toExponential(3).replace('e', ' \\times 10^{') + '} \\cdot 9.81\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + fmt(toD(c.F_b, 'force'), 2) + '\\;\\mathrm{' + (isImp() ? 'lbf' : 'N') + '}}\\)</div></div>';

    /* Step 5 */
    if (c.floats) {
      html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 5</span><span class="cs-title">Equilibrium</span></div>';
      html += '<div class="cs-formula">\\[ F_b = W \\quad (\\text{object floats}) \\]</div>';
      html += '<div class="cs-calc">\\(' + fmt(toD(c.F_b, 'force'), 2) + ' = ' + fmt(toD(c.W, 'force'), 2) + '\\;\\mathrm{' + (isImp() ? 'lbf' : 'N') + '}\\;\\checkmark\\)</div>';
      html += '<div class="cs-result">Apparent weight \\(= \\mathbf{0\\;\\mathrm{' + (isImp() ? 'lbf' : 'N') + '}}\\)</div></div>';
    } else {
      html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 5</span><span class="cs-title">Apparent weight</span></div>';
      html += '<div class="cs-formula">\\[ W_a = W - F_b \\]</div>';
      html += '<div class="cs-calc">\\(W_a = ' + c.W.toFixed(2) + ' - ' + c.F_b.toFixed(2) + ' = ' + c.W_app.toFixed(2) + '\\;\\mathrm{N}\\)</div>';
      html += '<div class="cs-result">\\(= \\mathbf{' + fmt(toD(c.W_app, 'force'), 2) + '\\;\\mathrm{' + (isImp() ? 'lbf' : 'N') + '}}\\)</div></div>';
    }

    $('calc-modal-body').innerHTML = html;
    $('calc-modal').classList.add('active');
  }

  /* ── Export CSV / PNG ───────────────────────────────────────── */
  function exportCSV() {
    var c = compute();
    var rows = [
      ['Field', 'Value', 'Unit'],
      ['Object', c.obj.name, ''],
      ['Object density', toD(c.obj.rho, 'rho').toFixed(2), uLabel('rho')],
      ['Fluid', c.fl.name, ''],
      ['Fluid density', toD(c.fl.rho, 'rho').toFixed(2), uLabel('rho')],
      ['Volume', toD(c.V_m3 * 1000, 'vol').toFixed(3), uLabel('vol')],
      ['Mass', toD(c.mass, 'mass').toFixed(3), uLabel('mass')],
      ['Weight', toD(c.W, 'force').toFixed(2), uLabel('force')],
      ['Buoyant Force', toD(c.F_b, 'force').toFixed(2), uLabel('force')],
      ['Apparent Weight', toD(c.W_app, 'force').toFixed(2), uLabel('force')],
      ['Submerged %', (c.fracSub * 100).toFixed(2), '%'],
      ['V displaced', toD(c.V_disp * 1000, 'vol').toFixed(3), uLabel('vol')],
      ['Status', c.floats ? 'Floats' : 'Sinks', '']
    ];
    var csv = rows.map(function (r) { return r.map(function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'buoyancy_' + c.obj.key + '_in_' + c.fl.key + '.csv';
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
    a.download = 'buoyancy.png';
    a.click();
  }
  function copyResult() {
    var c = compute();
    var s = c.obj.name + ' in ' + c.fl.name + ': '
          + (c.floats ? 'Floats, ' + (c.fracSub * 100).toFixed(1) + '% submerged' : 'Sinks, W_app = ' + fmt(toD(c.W_app, 'force'), 2) + ' ' + uLabel('force'))
          + '. F_b = ' + fmt(toD(c.F_b, 'force'), 2) + ' ' + uLabel('force')
          + ', W = ' + fmt(toD(c.W, 'force'), 2) + ' ' + uLabel('force');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s);
  }

  /* ── Drop button ────────────────────────────────────────────── */
  function dropObject() {
    resetDrop();
    requestDraw();
    playClick();
  }

  /* ── Wire events ────────────────────────────────────────────── */
  function wireEvents() {
    /* Mode tabs */
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () { setMode(p.dataset.mode); playClick(); });
    });
    /* Unit tabs */
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
    /* Object/Fluid selects */
    $('sel-object').addEventListener('change', function () {
      pushHistory();
      state.objKey = $('sel-object').value;
      resetDrop(); updateReadouts(); requestDraw();
    });
    $('sel-fluid').addEventListener('change', function () {
      pushHistory();
      state.flKey = $('sel-fluid').value;
      resetDrop(); updateReadouts(); requestDraw();
    });
    /* Volume slider */
    $('sl-vol').addEventListener('input', function () {
      state.volume = parseFloat($('sl-vol').value);
      $('in-vol').value = toD(state.volume, 'vol').toFixed(2);
      resetDrop(); updateReadouts(); requestDraw();
    });
    $('in-vol').addEventListener('change', function () {
      var vDisp = parseFloat($('in-vol').value);
      if (!isFinite(vDisp)) return;
      var vSI = isImp() ? vDisp / 0.264172 : vDisp;
      vSI = Math.min(20, Math.max(0.1, vSI));
      state.volume = vSI;
      $('sl-vol').value = vSI;
      $('in-vol').value = toD(vSI, 'vol').toFixed(2);
      resetDrop(); updateReadouts(); requestDraw();
    });
    /* Steppers (volume + fluid level) */
    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir  = parseInt(b.dataset.dir, 10);
        var kind = b.dataset.step;
        if (kind === 'vol') {
          state.volume = Math.min(20, Math.max(0.1, state.volume + dir * 0.1));
        } else if (kind === 'fl') {
          state.fluidLevel = Math.min(0.95, Math.max(0.05, state.fluidLevel + dir * 0.05));
        }
        syncControls();
        resetDrop(); updateReadouts(); requestDraw();
        playClick();
      });
    });
    /* Fluid level slider (clamp 5–95%) */
    $('sl-fl').addEventListener('input', function () {
      state.fluidLevel = Math.max(0.05, Math.min(0.95, parseFloat($('sl-fl').value) / 100));
      $('in-fl').value = Math.round(state.fluidLevel * 100);
      resetDrop(); updateReadouts(); requestDraw();
    });
    $('in-fl').addEventListener('change', function () {
      var pct = parseFloat($('in-fl').value);
      if (!isFinite(pct)) return;
      pct = Math.min(95, Math.max(5, pct));
      state.fluidLevel = pct / 100;
      $('sl-fl').value = pct;
      $('in-fl').value = pct;
      resetDrop(); updateReadouts(); requestDraw();
    });
    /* Shape pills */
    document.querySelectorAll('#shape-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        pushHistory();
        state.shape = p.dataset.shape;
        document.querySelectorAll('#shape-tabs .pill').forEach(function (x) { x.classList.toggle('active', x === p); });
        resetDrop(); requestDraw();
        playClick();
      });
    });
    /* Canvas toggles */
    $('chk-forces').addEventListener('change', function () { state.showForces = $('chk-forces').checked; requestDraw(); });
    $('chk-particles').addEventListener('change', function () { state.showParticles = $('chk-particles').checked; requestDraw(); });
    $('chk-equation').addEventListener('change', function () { state.showEquation = $('chk-equation').checked; requestDraw(); });
    $('chk-grid').addEventListener('change', function () { state.showGrid = $('chk-grid').checked; requestDraw(); });
    $('chk-waterline').addEventListener('change', function () { state.showWaterline = $('chk-waterline').checked; requestDraw(); });
    /* Action bar */
    $('btn-drop').addEventListener('click', dropObject);
    $('btn-reset').addEventListener('click', function () { resetDrop(); requestDraw(); playClick(); });
    $('btn-undo').addEventListener('click', function () { doUndo(); playClick(); });
    $('btn-redo').addEventListener('click', function () { doRedo(); playClick(); });
    $('btn-csv').addEventListener('click', function () { exportCSV(); playClick(); });
    $('btn-png').addEventListener('click', function () { exportPNG(); playClick(); });
    $('btn-calc').addEventListener('click', function () { openCalc(); playClick(); });
    $('calc-modal-close').addEventListener('click', function () { $('calc-modal').classList.remove('active'); });
    $('calc-modal').addEventListener('click', function (e) { if (e.target === $('calc-modal')) $('calc-modal').classList.remove('active'); });
    /* Custom modal — separate buttons for object and fluid */
    $('btn-custom-obj').addEventListener('click', function () { openCM('obj'); });
    $('btn-custom-fluid').addEventListener('click', function () { openCM('fluid'); });
    $('cust-modal-close').addEventListener('click', closeCM);
    $('cm-cancel').addEventListener('click', closeCM);
    $('cm-add').addEventListener('click', addCustom);
    $('cm-type-obj').addEventListener('click', function () { setCMType('obj'); });
    $('cm-type-fluid').addEventListener('click', function () { setCMType('fluid'); });
    $('cust-modal').addEventListener('click', function (e) { if (e.target === $('cust-modal')) closeCM(); });
    /* Learning panels */
    $('learn-expand-all').addEventListener('click', function () {
      document.querySelectorAll('.learn-card').forEach(function (c) { c.open = true; });
      playClick();
    });
    $('learn-collapse-all').addEventListener('click', function () {
      document.querySelectorAll('.learn-card').forEach(function (c) { c.open = false; });
      playClick();
    });
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
        else if (act === 'reset') { resetDrop(); requestDraw(); }
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
    /* Resize */
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
    /* Highlight default preset */
    var chips = document.querySelectorAll('.preset-chip');
    chips.forEach(function (c) { c.classList.toggle('active', c.textContent === 'Default'); });
    resetDrop();
    requestDraw();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
