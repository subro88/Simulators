/* ═══════════════════════════════════════════════════════════════════════
   HYDRAULIC TURBINE TEST RIG SIMULATOR — NHIT VisualLab
   Pelton (impulse), Francis & Kaplan (reaction). Constant-head main
   characteristic, operating characteristic, gate family, unit quantities,
   variable head and specific-speed tests. SI internally; SI/US display.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2;
  var G = 9.81, RHO = 1000;

  /* ── Turbine presets ─────────────────────────────────────────────────
     Hr = rated net head (m), Qr = full-gate discharge at Hr (L/s),
     Nr = rated/design speed (rpm), eta = peak efficiency, D = runner dia (mm) */
  var TURBINES = {
    pelton:  { name: 'Pelton Wheel (1-jet)', type: 'pelton',  Hr: 40, Qr: 10, Nr: 1000, eta: 0.85, D: 220, jets: 1 },
    pelton2: { name: 'Pelton Wheel (2-jet)', type: 'pelton',  Hr: 40, Qr: 20, Nr: 1000, eta: 0.86, D: 220, jets: 2 },
    francis: { name: 'Francis Turbine',      type: 'francis', Hr: 15, Qr: 30, Nr: 1000, eta: 0.88, D: 250, jets: 0 },
    kaplan:  { name: 'Kaplan Turbine',       type: 'kaplan',  Hr: 4,  Qr: 90, Nr: 1000, eta: 0.86, D: 300, jets: 0 }
  };

  var state = {
    mode: 'simulate', units: 'si', turbKey: 'pelton',
    N: 1000, gate: 100,
    head: 40, D: 220, ratedN: 1000, brakeR: 150,  /* editable rig (init pelton) */
    running: false, phase: 'Stopped', crankAngle: 0,
    audioCtx: null, chartMode: 'eta',
    autoTest: null, lastTest: null,
    curveData: { cs: [], operating: [], family: [], unit: [], vhead: [] },
    jetPart: 0
  };
  function curTurb() { return TURBINES[state.turbKey]; }

  /* ── Units ──────────────────────────────────────────────────────────── */
  function isImp() { return state.units === 'imperial'; }
  function uLabel(kind) {
    if (kind === 'head')   return isImp() ? 'ft'      : 'm';
    if (kind === 'flow')   return isImp() ? 'gpm'     : 'L/s';
    if (kind === 'power')  return isImp() ? 'hp'      : 'kW';
    if (kind === 'torque') return isImp() ? 'ft·lbf'  : 'N·m';
    if (kind === 'len')    return isImp() ? 'in'      : 'mm';
    return '';
  }
  function toD(v, kind) {
    if (v == null || isNaN(v)) return v;
    if (!isImp()) return v;
    if (kind === 'head')   return v * 3.28084;
    if (kind === 'flow')   return v * 15.8503;
    if (kind === 'power')  return v * 1.34102;
    if (kind === 'torque') return v * 0.737562;
    if (kind === 'len')    return v * 0.0393701;      /* mm → in */
    return v;
  }
  function fmt(v, d) { if (v == null || isNaN(v)) return '—'; return (+v).toFixed(d == null ? 2 : d); }

  /* ═══════════════════════════════════════════════════════════════════════
     ENGINEERING — turbine model
     η(n) = ηmax·(2n − n²) (peak at design speed n=1, zero at standstill &
     runaway n=2). Torque T(n)=Tmax(1−n/2) linear; power P = T·ω = η·ρgQH.
     ═══════════════════════════════════════════════════════════════════════ */
  function p() { return curTurb(); }
  function Qfull() { return p().Qr * Math.sqrt(state.head / p().Hr); }       /* L/s at 100 % gate */
  function Qgate() { return Qfull() * (state.gate / 100); }
  function Ndesign() { return state.ratedN * Math.sqrt(state.head / p().Hr); }
  function gatePenalty() { return 1 - 0.25 * (1 - state.gate / 100); }       /* part-gate efficiency drop */
  function waterPowerAt(Q, H) { return RHO * G * (Q / 1000) * H / 1000; }    /* kW */

  /* full operating-point solve at speed N (rpm) and current gate/head */
  function solve(N) {
    var H = state.head, Q = Qgate(), Pin = waterPowerAt(Q, H);
    var Ndes = Ndesign(), n = Ndes > 0 ? N / Ndes : 0;
    var etaEff = p().eta * gatePenalty();
    var eta = Math.max(0, etaEff * (2 * n - n * n));
    var wDes = TAU * Ndes / 60;
    var Tmax = wDes > 0 ? 2 * etaEff * Pin * 1000 / wDes : 0;               /* N·m at standstill */
    var T = Math.max(0, Tmax * (1 - n / 2));
    var w = TAU * N / 60;
    var Po = T * w / 1000;                                                   /* kW shaft */
    return { N: N, H: H, Q: Q, Pin: Pin, Po: Po, T: T, eta: eta,
             Nu: H > 0 ? N / Math.sqrt(H) : 0, Qu: H > 0 ? Q / Math.sqrt(H) : 0,
             Pu: H > 0 ? Po / Math.pow(H, 1.5) : 0, n: n, runaway: 2 * Ndes };
  }
  function specificSpeed() {
    /* at design point (n=1, full gate) */
    var H = state.head, Q = Qfull(), Pin = waterPowerAt(Q, H);
    var Po = p().eta * Pin;                                                  /* design shaft power kW */
    return state.ratedN * Math.sqrt(Po) / Math.pow(H, 1.25);
  }
  function turbineClass(ns) {
    if (ns < 35) return 'Impulse (Pelton)';
    if (ns < 270) return 'Reaction (Francis)';
    return 'Reaction (Kaplan)';
  }
  function liveState() {
    if (!state.running) return { N: 0, H: state.head, Q: 0, Pin: 0, Po: 0, T: 0, eta: 0, Nu: 0, Qu: 0, Pu: 0, n: 0, runaway: 2 * Ndesign() };
    return solve(state.N);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CANVAS SETUP
     ═══════════════════════════════════════════════════════════════════════ */
  var pumpCv = $('pump-canvas'), pumpCtx = pumpCv.getContext('2d');
  var resCv = $('results-canvas'), resCtx = resCv.getContext('2d');
  var DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  function setupHiDPI(c) { c._lw = c.width; c._lh = c.height; c.width = Math.round(c._lw * DPR); c.height = Math.round(c._lh * DPR); }
  setupHiDPI(pumpCv); setupHiDPI(resCv);
  function beginFrame(ctx, c) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, c._lw, c._lh); ctx.textBaseline = 'alphabetic'; return { W: c._lw, H: c._lh }; }
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  var COL = { accent: '#26c6da', water: '#29b6f6', metal: '#5a6478' };

  /* ═══════════════════════════════════════════════════════════════════════
     DRAW — turbine rig (type-specific)
     ═══════════════════════════════════════════════════════════════════════ */
  function drawPump() {
    var f = beginFrame(pumpCtx, pumpCv), W = f.W, H = f.H, ctx = pumpCtx;
    ctx.fillStyle = '#0a0e16'; ctx.fillRect(0, 0, W, H);
    drawTitleBar(ctx, W);
    var ls = liveState();
    var flow = state.running ? Math.min(1, state.gate / 100) : 0;
    var t = p().type;
    if (t === 'pelton') drawPeltonRig(ctx, W, H, flow, ls);
    else if (t === 'francis') drawFrancisRig(ctx, W, H, flow, ls);
    else drawKaplanRig(ctx, W, H, flow, ls);
    drawBrake(ctx, brakeCx, brakeCy, ls);
    drawGauges(ctx, W, ls);
    drawStatusPanel(ctx, W - 178, 56, ls);
    if (state.autoTest) drawAutoOverlay(ctx, W, H);
  }
  var brakeCx = 0, brakeCy = 0;   /* set by each rig so brake sits on the shaft */

  function drawTitleBar(ctx, W) {
    var g = ctx.createLinearGradient(0, 0, 0, 44); g.addColorStop(0, '#0e2a2e'); g.addColorStop(1, '#0a0e16');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 44);
    ctx.strokeStyle = COL.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 44); ctx.stroke();
    ctx.fillStyle = COL.accent; ctx.font = 'bold 13px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('◉ TURBINE RIG', 14, 18);
    ctx.fillStyle = '#6b7a99'; ctx.font = '11px Courier New, monospace'; ctx.textAlign = 'right';
    ctx.fillText('N = ' + (state.running ? state.N : 0) + ' rpm', W - 14, 18);
    ctx.fillStyle = '#dde3f0'; ctx.font = '10.5px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p().name.toUpperCase() + '  •  H = ' + fmt(toD(state.head, 'head'), isImp() ? 1 : 0) + ' ' + uLabel('head') + '  •  ⌀ ' + fmt(toD(state.D, 'len'), isImp() ? 2 : 0) + ' ' + uLabel('len') + '  •  DESIGN ' + Math.round(Ndesign()) + ' rpm', W / 2, 36);
  }

  /* ───────── realistic drawing helpers ───────── */
  function strokePoly(ctx, poly) { ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]); for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]); ctx.stroke(); }
  /* 3D-looking penstock with flowing water (animated dashes) */
  function flowPipe(ctx, poly, width, flow) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0c111b'; ctx.lineWidth = width + 4; strokePoly(ctx, poly);
    ctx.strokeStyle = '#39435c'; ctx.lineWidth = width; strokePoly(ctx, poly);
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = width * 0.30; strokePoly(ctx, poly);   /* sheen */
    ctx.strokeStyle = flow > 0.01 ? '#0e3f7e' : '#101a2c'; ctx.lineWidth = width - 7; strokePoly(ctx, poly);
    if (flow > 0.02) { ctx.save(); ctx.strokeStyle = 'rgba(120,196,255,0.7)'; ctx.lineWidth = width - 9; ctx.setLineDash([8, 16]); ctx.lineDashOffset = -state.jetPart * 2.4; strokePoly(ctx, poly); ctx.setLineDash([]); ctx.restore(); }
  }
  function reservoir(ctx, x, y, w, h) {
    ctx.fillStyle = '#0c1a2c'; roundRect(ctx, x, y, w, h, 4); ctx.fill();
    var wy = y + 7; ctx.save(); roundRect(ctx, x + 2, wy, w - 4, h - 9, 3); ctx.clip();
    var g = ctx.createLinearGradient(0, wy, 0, y + h); g.addColorStop(0, '#3aa0e8'); g.addColorStop(1, '#0a3a78'); ctx.fillStyle = g; ctx.fillRect(x, wy, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1;
    for (var k = 0; k < 3; k++) { ctx.beginPath(); for (var i = 0; i <= w; i += 5) { var yy = wy + 4 + k * 7 + Math.sin((i + state.crankAngle * 16 + k * 30) * 0.22) * 1.5; if (i === 0) ctx.moveTo(x + i, yy); else ctx.lineTo(x + i, yy); } ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = '#5a6478'; ctx.lineWidth = 2; roundRect(ctx, x, y, w, h, 4); ctx.stroke();
    ctx.fillStyle = '#80d8ff'; ctx.font = '8.5px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('HEADWATER', x + w / 2, y - 4);
  }
  function tailrace(ctx, x, y, w) {
    var g = ctx.createLinearGradient(0, y, 0, y + 16); g.addColorStop(0, '#1565c0'); g.addColorStop(1, '#072a55');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, 16);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath();
    for (var i = 0; i <= w; i += 5) { var yy = y + 4 + Math.sin((i + state.crankAngle * 22) * 0.25) * 1.6; if (i === 0) ctx.moveTo(x + i, yy); else ctx.lineTo(x + i, yy); } ctx.stroke();
  }
  /* deterministic droplet burst (no per-frame random → no flicker) */
  function burst(ctx, x, y, n, a0, a1, reach, color) {
    if (!state.running) return; ctx.fillStyle = color;
    for (var i = 0; i < n; i++) {
      var ph = (state.jetPart * 0.5 + i * 13.7) % 1; var ang = a0 + (a1 - a0) * (i / (n - 1));
      var d = (0.25 + ph * 0.85) * reach; var rad = 2.2 * (1 - ph) + 0.6;
      ctx.globalAlpha = (1 - ph) * 0.9; ctx.beginPath(); ctx.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d - 0.4 * d * ph, rad, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function foundation(ctx, x, w, topY) { var g = ctx.createLinearGradient(0, topY, 0, topY + 26); g.addColorStop(0, '#222a38'); g.addColorStop(1, '#11151f'); ctx.fillStyle = g; ctx.fillRect(x, topY, w, 26); ctx.fillStyle = '#2c3645'; for (var b = x + 6; b < x + w - 6; b += 18) { ctx.fillRect(b, topY + 5, 12, 4); ctx.fillRect(b + 6, topY + 14, 12, 4); } }

  /* ── PELTON: penstock → nozzle/spear → jet → split-bucket wheel ── */
  function drawPeltonRig(ctx, W, H, flow, ls) {
    var wheelCx = 290, wheelCy = 322, r = 80;
    reservoir(ctx, 28, 64, 74, 46);
    flowPipe(ctx, [[64, 110], [64, wheelCy], [150, wheelCy]], 16, flow);
    foundation(ctx, wheelCx - 116, 250, wheelCy + r + 6);
    /* casing housing behind wheel */
    ctx.fillStyle = 'rgba(40,52,70,0.5)'; ctx.beginPath(); ctx.arc(wheelCx, wheelCy, r + 16, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2c3645'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(wheelCx, wheelCy, r + 14, Math.PI * 0.15, Math.PI * 1.85); ctx.stroke();
    /* nozzle (converging) + spear needle */
    var nx = 150, ny = wheelCy, jetW = 2.5 + (state.gate / 100) * 6.5;
    var ng = ctx.createLinearGradient(0, ny - 12, 0, ny + 12); ng.addColorStop(0, '#2a3340'); ng.addColorStop(0.5, '#9aa6ba'); ng.addColorStop(1, '#1a2230');
    ctx.fillStyle = ng; ctx.beginPath(); ctx.moveTo(nx - 6, ny - 13); ctx.lineTo(nx + 34, ny - jetW / 2 - 2); ctx.lineTo(nx + 34, ny + jetW / 2 + 2); ctx.lineTo(nx - 6, ny + 13); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0c111b'; ctx.lineWidth = 1; ctx.stroke();
    var spear = nx + 14 + (1 - state.gate / 100) * 16;   /* needle retracts as gate opens */
    ctx.fillStyle = '#cfd8dc'; ctx.beginPath(); ctx.moveTo(nx - 6, ny); ctx.lineTo(spear, ny - 3); ctx.lineTo(spear + 6, ny); ctx.lineTo(spear, ny + 3); ctx.closePath(); ctx.fill();
    /* jet — tapered translucent stream + bright core + streaks */
    var jx0 = nx + 34, jx1 = wheelCx - r + 6;
    if (flow > 0.02) {
      var jg = ctx.createLinearGradient(jx0, 0, jx1, 0); jg.addColorStop(0, 'rgba(150,220,255,0.85)'); jg.addColorStop(1, 'rgba(110,190,255,0.6)');
      ctx.fillStyle = jg; ctx.beginPath(); ctx.moveTo(jx0, ny - jetW / 2); ctx.lineTo(jx1, ny - jetW / 2 - 1.5); ctx.lineTo(jx1, ny + jetW / 2 + 1.5); ctx.lineTo(jx0, ny + jetW / 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, jetW * 0.3); ctx.setLineDash([7, 9]); ctx.lineDashOffset = -state.jetPart * 6; ctx.beginPath(); ctx.moveTo(jx0, ny); ctx.lineTo(jx1, ny); ctx.stroke(); ctx.setLineDash([]);
      burst(ctx, jx0, ny, 5, Math.PI * 0.7, Math.PI * 1.3, 12, 'rgba(160,220,255,0.8)');   /* nozzle spray */
      /* impact splash fan at wheel */
      burst(ctx, jx1, ny, 9, -Math.PI * 0.95, -Math.PI * 0.05, 30, 'rgba(220,245,255,0.9)');
      burst(ctx, jx1, ny, 7, Math.PI * 0.05, Math.PI * 0.95, 26, 'rgba(200,235,255,0.8)');
    }
    /* wheel: disc + rim + split buckets (+ motion blur) */
    ctx.save(); ctx.translate(wheelCx, wheelCy);
    var disc = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 8, 0, 0, r); disc.addColorStop(0, '#5b6b7e'); disc.addColorStop(0.6, '#2b3543'); disc.addColorStop(1, '#0d1117');
    ctx.fillStyle = disc; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7d8ca3'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r - 3, 0, TAU); ctx.stroke();
    var fast = state.running && state.N > 400;
    var ang = state.running ? state.crankAngle : 0, nB = 20;
    if (fast) { ctx.globalAlpha = 0.25; ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, r - 3, 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.rotate(ang);
    for (var b = 0; b < nB; b++) {
      ctx.save(); ctx.rotate(b / nB * TAU); ctx.translate(0, -r + 2);
      ctx.fillStyle = '#aeb9c9'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 6, 0, 0, TAU); ctx.fill();          /* bucket outer */
      ctx.fillStyle = '#3e4a5a'; ctx.beginPath(); ctx.ellipse(-2.5, 0, 4, 5, 0, 0, TAU); ctx.ellipse(2.5, 0, 4, 5, 0, 0, TAU); ctx.fill();   /* twin cups */
      ctx.strokeStyle = '#dfe6ef'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -5.5); ctx.lineTo(0, 5.5); ctx.stroke();                 /* splitter */
      ctx.restore();
    }
    /* hub + bolts */
    var hub = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14); hub.addColorStop(0, '#aeb9c9'); hub.addColorStop(1, '#3a4658');
    ctx.fillStyle = hub; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a2230'; for (var hb = 0; hb < 6; hb++) { ctx.beginPath(); ctx.arc(Math.cos(hb / 6 * TAU) * 9, Math.sin(hb / 6 * TAU) * 9, 1.6, 0, TAU); ctx.fill(); }
    ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    ctx.restore();
    tailrace(ctx, wheelCx - 70, wheelCy + r + 6, 150);
    ctx.fillStyle = '#80d8ff'; ctx.font = '9px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('PELTON WHEEL', wheelCx, wheelCy + r + 34);
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText('NOZZLE + SPEAR', nx - 6, ny + 30);
    brakeCx = wheelCx + r + 72; brakeCy = wheelCy;
    drawShaft(ctx, wheelCx + r - 6, wheelCy, brakeCx - 26);
  }

  /* ── FRANCIS: shaded spiral volute + guide vanes + twisted runner + draft tube ── */
  function drawFrancisRig(ctx, W, H, flow, ls) {
    var cx = 262, cy = 296, r = 72;
    reservoir(ctx, 28, 60, 70, 42);
    flowPipe(ctx, [[60, 102], [60, 232], [cx - r - 34, 232], [cx - r - 34, cy]], 17, flow);
    foundation(ctx, cx - 120, 240, cy + r + 30);
    /* spiral volute — filled, shaded, narrowing */
    ctx.save();
    var seg = 70;
    for (var pass = 0; pass < 2; pass++) {
      ctx.beginPath();
      for (var s = 0; s <= seg; s++) { var a = s / seg * TAU * 1.0; var rr = (r + 30) - (a / TAU) * 18; var xx = cx + Math.cos(a - Math.PI * 0.5) * rr, yy = cy + Math.sin(a - Math.PI * 0.5) * rr; if (s === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
      if (pass === 0) { ctx.strokeStyle = '#0c111b'; ctx.lineWidth = 26; } else { ctx.strokeStyle = '#3a4658'; ctx.lineWidth = 22; } ctx.lineCap = 'round'; ctx.stroke();
    }
    /* water inside volute */
    ctx.beginPath(); for (var s2 = 0; s2 <= seg; s2++) { var a2 = s2 / seg * TAU; var rr2 = (r + 30) - (a2 / TAU) * 18; var xx2 = cx + Math.cos(a2 - Math.PI * 0.5) * rr2, yy2 = cy + Math.sin(a2 - Math.PI * 0.5) * rr2; if (s2 === 0) ctx.moveTo(xx2, yy2); else ctx.lineTo(xx2, yy2); }
    ctx.strokeStyle = flow > 0.01 ? '#1565c0' : '#15233b'; ctx.lineWidth = 13; ctx.stroke();
    if (flow > 0.02) { ctx.strokeStyle = 'rgba(120,196,255,0.6)'; ctx.lineWidth = 6; ctx.setLineDash([8, 14]); ctx.lineDashOffset = -state.jetPart * 2; ctx.beginPath(); for (var s3 = 0; s3 <= seg; s3++) { var a3 = s3 / seg * TAU; var rr3 = (r + 30) - (a3 / TAU) * 18; var xx3 = cx + Math.cos(a3 - Math.PI * 0.5) * rr3, yy3 = cy + Math.sin(a3 - Math.PI * 0.5) * rr3; if (s3 === 0) ctx.moveTo(xx3, yy3); else ctx.lineTo(xx3, yy3); } ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
    /* guide vanes (wicket gates) — airfoils */
    for (var gv = 0; gv < 16; gv++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(gv / 16 * TAU); ctx.fillStyle = '#8794a8'; ctx.beginPath(); ctx.ellipse(r - 12, 0, 7, 2.6, 0.5, 0, TAU); ctx.fill(); ctx.restore(); }
    /* runner: crown disc + twisted vanes (+ motion blur) */
    var rr0 = r - 22;
    ctx.save(); ctx.translate(cx, cy);
    var fast = state.running && state.N > 400;
    if (fast) { ctx.globalAlpha = 0.22; ctx.fillStyle = '#4dd0e1'; ctx.beginPath(); ctx.arc(0, 0, rr0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.rotate(state.running ? state.crankAngle : 0);
    var cg = ctx.createRadialGradient(-rr0 * 0.3, -rr0 * 0.3, 4, 0, 0, rr0); cg.addColorStop(0, '#4a5970'); cg.addColorStop(1, '#161d2b');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, rr0, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
    for (var v = 0; v < 13; v++) { ctx.save(); ctx.rotate(v / 13 * TAU); ctx.strokeStyle = '#aeb9c9'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(5, 0); ctx.quadraticCurveTo(rr0 * 0.62, rr0 * 0.30, rr0 - 2, rr0 * 0.42); ctx.stroke(); ctx.strokeStyle = flow > 0 ? 'rgba(120,210,230,0.5)' : 'rgba(120,140,160,0.3)'; ctx.lineWidth = 1.4; ctx.stroke(); ctx.restore(); }
    var fh = ctx.createRadialGradient(-2, -2, 1, 0, 0, 9); fh.addColorStop(0, '#cfd8dc'); fh.addColorStop(1, '#3a4658'); ctx.fillStyle = fh; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill();
    ctx.restore();
    /* draft tube — curved diverging, with water + bubbles */
    var dtY = cy + rr0;
    ctx.fillStyle = '#222a38'; ctx.beginPath(); ctx.moveTo(cx - 16, dtY); ctx.lineTo(cx + 16, dtY); ctx.lineTo(cx + 34, dtY + 64); ctx.lineTo(cx - 34, dtY + 64); ctx.closePath(); ctx.fill();
    ctx.fillStyle = flow > 0.01 ? 'rgba(21,101,192,0.6)' : 'rgba(20,35,59,0.6)'; ctx.beginPath(); ctx.moveTo(cx - 12, dtY); ctx.lineTo(cx + 12, dtY); ctx.lineTo(cx + 28, dtY + 62); ctx.lineTo(cx - 28, dtY + 62); ctx.closePath(); ctx.fill();
    if (flow > 0.02) { ctx.fillStyle = 'rgba(170,220,255,0.6)'; for (var d = 0; d < 6; d++) { var t = ((state.jetPart * 1.5 + d * 11) % 62) / 62; ctx.beginPath(); ctx.arc(cx + Math.sin(d * 2 + state.crankAngle) * (10 + t * 16), dtY + t * 60, 1.8, 0, TAU); ctx.fill(); } }
    tailrace(ctx, cx - 40, dtY + 64, 80);
    ctx.fillStyle = '#80d8ff'; ctx.font = '9px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('FRANCIS RUNNER', cx, cy - r - 24);
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Segoe UI'; ctx.fillText('SPIRAL CASING · GUIDE VANES', cx, cy - r - 12); ctx.fillText('DRAFT TUBE', cx, dtY + 78);
    brakeCx = cx + r + 70; brakeCy = cy;
    drawShaft(ctx, cx + r - 16, cy, brakeCx - 26);
  }

  /* ── KAPLAN: shaded bore + front-view propeller (airfoil blades) + draft tube ── */
  function drawKaplanRig(ctx, W, H, flow, ls) {
    var cx = 262, cy = 300, r = 62;
    reservoir(ctx, 30, 58, 78, 40);
    flowPipe(ctx, [[69, 98], [69, 196], [cx, 196], [cx, cy - r - 6]], 24, flow);
    foundation(ctx, cx - 120, 250, cy + r + 60);
    /* cylindrical bore (shaded tube) */
    var bg = ctx.createLinearGradient(cx - r - 10, 0, cx + r + 10, 0); bg.addColorStop(0, '#2a3340'); bg.addColorStop(0.5, '#3e4a5a'); bg.addColorStop(1, '#161d2b');
    ctx.fillStyle = bg; ctx.fillRect(cx - r - 10, cy - r - 4, (r + 10) * 2, (r + 4) * 2);
    ctx.fillStyle = flow > 0.01 ? 'rgba(21,101,192,0.4)' : 'rgba(20,35,59,0.5)'; ctx.fillRect(cx - r - 4, cy - r, (r + 4) * 2, r * 2);
    ctx.strokeStyle = '#0c111b'; ctx.lineWidth = 3; ctx.strokeRect(cx - r - 10, cy - r - 4, (r + 10) * 2, (r + 4) * 2);
    /* axial water bubbles streaming down through the bore */
    if (flow > 0.02) { ctx.fillStyle = 'rgba(150,210,255,0.55)'; for (var d = 0; d < 10; d++) { var t = ((state.jetPart * 2 + d * 9) % (2 * r)) ; var bx = cx - r + 8 + (d * 13 % (2 * r - 16)); ctx.beginPath(); ctx.arc(bx, cy - r + t, 1.8 + (d % 3) * 0.5, 0, TAU); ctx.fill(); } }
    /* front-view propeller: hub + twisted airfoil blades (+ motion blur) */
    ctx.save(); ctx.translate(cx, cy);
    var fast = state.running && state.N > 400;
    if (fast) { ctx.globalAlpha = 0.2; ctx.fillStyle = '#4dd0e1'; ctx.beginPath(); ctx.arc(0, 0, r - 6, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.rotate(state.running ? state.crankAngle : 0);
    for (var bl = 0; bl < 4; bl++) {
      ctx.save(); ctx.rotate(bl / 4 * TAU);
      var bg2 = ctx.createLinearGradient(0, -10, 0, -(r - 8)); bg2.addColorStop(0, '#8794a8'); bg2.addColorStop(1, '#cfd8dc');
      ctx.fillStyle = bg2; ctx.beginPath(); ctx.moveTo(-4, -10); ctx.quadraticCurveTo(-15, -(r - 22), -3, -(r - 8)); ctx.quadraticCurveTo(13, -(r - 24), 6, -12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    var kh = ctx.createRadialGradient(-4, -4, 2, 0, 0, 15); kh.addColorStop(0, '#cfd8dc'); kh.addColorStop(1, '#37455a'); ctx.fillStyle = kh; ctx.beginPath(); ctx.arc(0, 0, 15, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
    ctx.restore();
    /* diverging draft tube */
    ctx.fillStyle = '#222a38'; ctx.beginPath(); ctx.moveTo(cx - r, cy + r); ctx.lineTo(cx + r, cy + r); ctx.lineTo(cx + r + 26, cy + r + 56); ctx.lineTo(cx - r - 26, cy + r + 56); ctx.closePath(); ctx.fill();
    ctx.fillStyle = flow > 0.01 ? 'rgba(21,101,192,0.55)' : 'rgba(20,35,59,0.6)'; ctx.beginPath(); ctx.moveTo(cx - r + 4, cy + r); ctx.lineTo(cx + r - 4, cy + r); ctx.lineTo(cx + r + 20, cy + r + 54); ctx.lineTo(cx - r - 20, cy + r + 54); ctx.closePath(); ctx.fill();
    tailrace(ctx, cx - r - 26, cy + r + 56, (r + 26) * 2);
    ctx.fillStyle = '#80d8ff'; ctx.font = '9px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('KAPLAN RUNNER (axial)', cx, cy - r - 14);
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Segoe UI'; ctx.fillText('DRAFT TUBE', cx, cy + r + 70);
    brakeCx = cx + r + 82; brakeCy = cy;
    drawShaft(ctx, cx + r + 10, cy, brakeCx - 26);
  }

  function drawShaft(ctx, x0, cy, x1) {
    var g = ctx.createLinearGradient(0, cy - 4, 0, cy + 4); g.addColorStop(0, '#3a4658'); g.addColorStop(0.5, '#aeb9c9'); g.addColorStop(1, '#2a3340');
    ctx.fillStyle = g; ctx.fillRect(x0, cy - 4, x1 - x0, 8);
    ctx.fillStyle = '#11151f'; ctx.fillRect(x0 + (x1 - x0) / 2 - 4, cy - 7, 8, 14);   /* bearing pedestal */
  }

  /* ── Brake (rope) dynamometer — drum + wound rope + weight stack + spring dial ── */
  function drawBrake(ctx, cx, cy, ls) {
    var dr = 28;
    /* drum with metallic shading + cooling-water collar */
    ctx.save(); ctx.translate(cx, cy);
    if (state.running && state.N > 400) { ctx.globalAlpha = 0.22; ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.arc(0, 0, dr, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.rotate(state.running ? state.crankAngle : 0);
    var g = ctx.createRadialGradient(-dr * 0.3, -dr * 0.3, 3, 0, 0, dr); g.addColorStop(0, '#6b7a90'); g.addColorStop(0.7, '#39435c'); g.addColorStop(1, '#161d2b');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, dr, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#7d8ca3'; ctx.lineWidth = 2; for (var i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i / 8 * TAU); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dr - 4, 0); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = '#aeb9c9'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
    ctx.restore();
    /* rope wrapped over the drum */
    ctx.strokeStyle = '#a1887f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, dr + 2.5, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, dr + 2.5, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
    /* weight side (down-left) — stack of weights */
    var wx = cx - dr - 2.5; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(wx, cy); ctx.lineTo(wx, cy + 48); ctx.stroke();
    var hung = ls.T;   /* visual weight grows a touch with torque (just cosmetic) */
    for (var wgt = 0; wgt < 3; wgt++) { var ww = 26 - wgt * 3; ctx.fillStyle = wgt === 1 ? '#455a64' : '#37474f'; roundRect(ctx, wx - ww / 2, cy + 48 + wgt * 11, ww, 10, 2); ctx.fill(); ctx.strokeStyle = '#0c111b'; ctx.lineWidth = 1; roundRect(ctx, wx - ww / 2, cy + 48 + wgt * 11, ww, 10, 2); ctx.stroke(); }
    ctx.fillStyle = '#90a4ae'; ctx.font = '7px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('W', wx, cy + 48 + 3 * 11 + 8);
    /* spring-balance side (up-right) — coil + dial */
    var sx = cx + dr + 2.5; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx, cy); ctx.lineTo(sx, cy - 18); ctx.stroke();
    ctx.strokeStyle = '#26c6da'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx, cy - 18); for (var s = 0; s <= 9; s++) { ctx.lineTo(sx + (s % 2 ? 5 : -5), cy - 18 - 3 - s * 3); } ctx.lineTo(sx, cy - 50); ctx.stroke();
    drawCircGauge(ctx, sx, cy - 66, 15, Math.min(1, ls.T / (ls.T + 30 || 1)), '#26c6da', 'SPRING ' + uLabel('torque'), fmt(toD(ls.T, 'torque'), 1));
    ctx.fillStyle = '#80d8ff'; ctx.font = '9px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('ROPE-BRAKE DYNO', cx, cy + dr + 16);
  }

  function drawCircGauge(ctx, cx, cy, r, frac, color, label, valTxt) {
    ctx.fillStyle = '#0d1117'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r - 4, Math.PI * 0.75, Math.PI * 0.75 + Math.max(0, Math.min(1, frac)) * Math.PI * 1.5); ctx.stroke();
    var a = Math.PI * 0.75 + Math.max(0, Math.min(1, frac)) * Math.PI * 1.5;
    ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7)); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#dde3f0'; ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.fillText(valTxt, cx, cy + r + 11);
    ctx.fillStyle = '#6b7a99'; ctx.font = '7px Segoe UI'; ctx.fillText(label, cx, cy + r + 20);
  }
  function drawGauges(ctx, W, ls) {
    /* head pressure gauge + tachometer near the supply/penstock */
    drawCircGauge(ctx, 70, 180, 18, Math.min(1, ls.H / 120), '#42a5f5', 'HEAD ' + uLabel('head'), fmt(toD(ls.H, 'head'), 0));
    drawCircGauge(ctx, 150, 110, 18, Math.min(1, state.N / 2200), '#26c6da', 'SPEED rpm', state.running ? state.N : 0);
  }
  function drawStatusPanel(ctx, x, y, ls) {
    ctx.fillStyle = 'rgba(13,17,23,0.92)'; ctx.strokeStyle = COL.accent; ctx.lineWidth = 1; roundRect(ctx, x, y, 168, 64, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = state.running ? '#3ddc84' : '#ef5350'; ctx.beginPath(); ctx.arc(x + 12, y + 14, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#dde3f0'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(state.running ? 'RUNNING' : 'STOPPED', x + 24, y + 18);
    ctx.fillStyle = '#9ba6c4'; ctx.font = '9px Segoe UI'; ctx.fillText('Phase: ' + state.phase, x + 10, y + 34);
    ctx.fillStyle = '#1a2436'; roundRect(ctx, x + 10, y + 42, 120, 8, 4); ctx.fill();
    var g = ctx.createLinearGradient(x + 10, 0, x + 130, 0); g.addColorStop(0, '#ef5350'); g.addColorStop(1, '#3ddc84');
    ctx.fillStyle = g; roundRect(ctx, x + 10, y + 42, 120 * state.gate / 100, 8, 4); ctx.fill();
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Courier New'; ctx.textAlign = 'right'; ctx.fillText('gate ' + Math.round(state.gate) + '%', x + 158, y + 50);
  }
  function drawAutoOverlay(ctx, W, H) {
    var at = state.autoTest; var step = at.steps[at.stepIdx]; if (!step) return;
    var by = H - 30; ctx.fillStyle = 'rgba(0,131,143,0.92)'; ctx.fillRect(0, by, W, 30);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText(at.procName + ' — step ' + (at.stepIdx + 1) + '/' + at.steps.length + ': ' + step.label, 12, by + 19);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, by, W * (at.stepIdx + 1) / at.steps.length, 3);
    ctx.fillStyle = '#fff'; ctx.font = '10px Segoe UI'; ctx.textAlign = 'right'; ctx.fillText('× CANCEL', W - 12, by + 19);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DRAW — cluster + charts
     ═══════════════════════════════════════════════════════════════════════ */
  function drawResults() {
    var f = beginFrame(resCtx, resCv), W = f.W, H = f.H, ctx = resCtx;
    ctx.fillStyle = '#0a0e16'; ctx.fillRect(0, 0, W, H);
    var clusterH = 116; drawCluster(ctx, W, clusterH);
    var y0 = clusterH + 8, h = H - clusterH - 16, m = state.chartMode;
    if (m === 'eta') drawChartEta(ctx, W, y0, h);
    else if (m === 'power') drawChartPower(ctx, W, y0, h);
    else if (m === 'torque') drawChartTorque(ctx, W, y0, h);
    else if (m === 'operating') drawChartOperating(ctx, W, y0, h);
    else if (m === 'unit') drawChartUnit(ctx, W, y0, h);
    else if (m === 'type') drawChartType(ctx, W, y0, h);
    else if (m === 'family') drawChartFamily(ctx, W, y0, h);
  }
  function ledCell(ctx, x, y, w, h, label, val, unit, color) {
    ctx.fillStyle = '#0d1117'; roundRect(ctx, x, y, w, h, 4); ctx.fill(); ctx.strokeStyle = '#1f2a40'; ctx.lineWidth = 1; roundRect(ctx, x, y, w, h, 4); ctx.stroke();
    ctx.fillStyle = '#6b7a99'; ctx.font = '7.5px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(label, x + 6, y + 12);
    ctx.font = '8px Segoe UI'; ctx.textAlign = 'right'; ctx.fillStyle = '#6b7a99'; var uw = ctx.measureText(unit).width; ctx.fillText(unit, x + w - 5, y + h - 6);
    var fs = 15; ctx.font = 'bold ' + fs + 'px Courier New'; var avail = w - 10 - uw - 4;
    while (fs > 9 && ctx.measureText(val).width > avail) { fs -= 1; ctx.font = 'bold ' + fs + 'px Courier New'; }
    ctx.fillStyle = color; ctx.textAlign = 'right'; ctx.fillText(val, x + w - 6 - uw - 4, y + h - 6);
  }
  function drawCluster(ctx, W, h) {
    ctx.fillStyle = '#0e2026'; ctx.fillRect(0, 0, W, h); ctx.strokeStyle = COL.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(W, h); ctx.stroke();
    ctx.fillStyle = COL.accent; ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText('▣ INSTRUMENT CLUSTER', 12, 16);
    ctx.fillStyle = '#6b7a99'; ctx.font = '9px Courier New'; ctx.textAlign = 'right'; ctx.fillText('TURBINE TEST CONSOLE', W - 12, 16);
    var ls = liveState();
    var cells = [
      { l: 'HEAD H', v: fmt(toD(ls.H, 'head'), 1), u: uLabel('head'), c: '#42a5f5' },
      { l: 'DISCHARGE Q', v: fmt(toD(ls.Q, 'flow'), 2), u: uLabel('flow'), c: '#ffc857' },
      { l: 'SHAFT POWER', v: fmt(toD(ls.Po, 'power'), 2), u: uLabel('power'), c: '#ce93d8' },
      { l: 'OVERALL η', v: state.running ? fmt(ls.eta * 100, 1) : '—', u: '%', c: '#26c6da' },
      { l: 'BRAKE TORQUE', v: fmt(toD(ls.T, 'torque'), 1), u: uLabel('torque'), c: '#80cbc4' },
      { l: 'WATER POWER', v: fmt(toD(ls.Pin, 'power'), 2), u: uLabel('power'), c: '#4fc3f7' },
      { l: 'UNIT SPEED Nᵤ', v: state.running ? fmt(ls.Nu, 1) : '—', u: '', c: '#ffd180' },
      { l: 'SPECIFIC Nₛ', v: fmt(specificSpeed(), 0), u: '', c: '#a5d6a7' }
    ];
    var cols = 4, cw = (W - 24 - (cols - 1) * 6) / cols, ch = 38;
    for (var i = 0; i < cells.length; i++) { var cx = 12 + (i % cols) * (cw + 6), cy = 24 + Math.floor(i / cols) * (ch + 6); ledCell(ctx, cx, cy, cw, ch, cells[i].l, cells[i].v, cells[i].u, cells[i].c); }
  }
  function axisFrame(ctx, W, y0, h, xMax, yMax, xLabel, yLabel, title) {
    var pad = { l: 52, r: 18, t: 22, b: 34 }, pw = W - pad.l - pad.r, ph = h - pad.t - pad.b, x0 = pad.l, py0 = y0 + pad.t;
    ctx.fillStyle = '#80d8ff'; ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(title, x0, y0 + 12);
    ctx.strokeStyle = '#2a3550'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x0, py0); ctx.lineTo(x0, py0 + ph); ctx.lineTo(x0 + pw, py0 + ph); ctx.stroke();
    function mx(v) { return x0 + v / xMax * pw; } function my(v) { return py0 + ph - v / yMax * ph; }
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Courier New'; ctx.textAlign = 'center';
    for (var t = 0; t <= 5; t++) { var xv = xMax * t / 5; ctx.fillText(fmt(xv, xv < 10 ? 1 : 0), mx(xv), py0 + ph + 12); }
    ctx.textAlign = 'right'; for (var k = 0; k <= 4; k++) { var yv = yMax * k / 4; ctx.fillText(fmt(yv, yv < 10 ? 1 : 0), x0 - 5, my(yv) + 3); }
    ctx.fillStyle = '#9ba6c4'; ctx.font = '8.5px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(xLabel, x0 + pw / 2, py0 + ph + 26);
    ctx.save(); ctx.translate(12, py0 + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore();
    return { mx: mx, my: my, x0: x0, py0: py0, pw: pw, ph: ph };
  }
  function sampleSpeed(gate, nPts) {
    nPts = nPts || 24; var savedG = state.gate, savedN = state.N; state.gate = gate;
    var out = [], runaway = 2 * Ndesign();
    for (var i = 0; i <= nPts; i++) { var N = runaway * i / nPts; out.push(solve(N)); }
    state.gate = savedG; state.N = savedN; return out;
  }
  function csPts() { return state.curveData.cs.length ? state.curveData.cs : sampleSpeed(100); }
  function plotLine(ctx, ax, pts, fx, fy, color, dots) {
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath(); var st = false;
    pts.forEach(function (q) { var X = ax.mx(fx(q)), Y = ax.my(fy(q)); if (isNaN(X) || isNaN(Y)) return; if (!st) { ctx.moveTo(X, Y); st = true; } else ctx.lineTo(X, Y); }); ctx.stroke();
    if (dots) pts.forEach(function (q, i) { if (i % 3 !== 0) return; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(ax.mx(fx(q)), ax.my(fy(q)), 2.4, 0, TAU); ctx.fill(); });
  }
  function markLiveN(ctx, ax, fy) {
    if (!state.running) return; var ls = liveState(); var x = ax.mx(state.N), y = ax.my(fy(ls));
    ctx.fillStyle = '#ffc857'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,87,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ax.py0 + ax.ph); ctx.stroke(); ctx.setLineDash([]);
  }
  function drawChartEta(ctx, W, y0, h) {
    var pts = csPts(); var xMax = 2 * Ndesign() * 1.02 || 1;
    var ax = axisFrame(ctx, W, y0, h, xMax, 100, 'Speed N (rpm)', 'Efficiency η (%)', 'EFFICIENCY vs SPEED (CONSTANT HEAD)');
    plotLine(ctx, ax, pts, function (q) { return q.N; }, function (q) { return q.eta * 100; }, '#26c6da', true);
    var best = pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, pts[0]);
    if (best) { var bx = ax.mx(best.N), by = ax.my(best.eta * 100); ctx.strokeStyle = '#3ddc84'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, ax.py0 + ax.ph); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#3ddc84'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, TAU); ctx.fill(); ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText('Design ' + fmt(best.eta * 100, 1) + '% @ ' + Math.round(best.N) + ' rpm', bx + 7, by - 5); }
    markLiveN(ctx, ax, function (q) { return q.eta * 100; });
  }
  function drawChartPower(ctx, W, y0, h) {
    var pts = csPts(); var xMax = 2 * Ndesign() * 1.02 || 1; var yMax = toD(Math.max.apply(null, pts.map(function (q) { return q.Po; })) * 1.2 || 1, 'power');
    var ax = axisFrame(ctx, W, y0, h, xMax, yMax, 'Speed N (rpm)', 'Shaft Power (' + uLabel('power') + ')', 'SHAFT POWER vs SPEED');
    plotLine(ctx, ax, pts, function (q) { return q.N; }, function (q) { return toD(q.Po, 'power'); }, '#ce93d8', true);
    markLiveN(ctx, ax, function (q) { return toD(q.Po, 'power'); });
  }
  function drawChartTorque(ctx, W, y0, h) {
    var pts = csPts(); var xMax = 2 * Ndesign() * 1.02 || 1;
    var Tmax = toD(Math.max.apply(null, pts.map(function (q) { return q.T; })) * 1.15 || 1, 'torque');
    var ax = axisFrame(ctx, W, y0, h, xMax, Tmax, 'Speed N (rpm)', 'Torque (' + uLabel('torque') + ')', 'TORQUE & DISCHARGE vs SPEED');
    plotLine(ctx, ax, pts, function (q) { return q.N; }, function (q) { return toD(q.T, 'torque'); }, '#ef9a9a', false);
    /* discharge ~ constant: plot as fraction of Tmax-axis using its own scale (right) */
    var Qref = toD(pts[0].Q, 'flow') || 1;
    plotLine(ctx, ax, pts, function (q) { return q.N; }, function (q) { return toD(q.Q, 'flow') / Qref * Tmax * 0.9; }, '#ffc857', false);
    ctx.font = '8px Segoe UI'; ctx.textAlign = 'left'; ctx.fillStyle = '#ef9a9a'; ctx.fillText('— Torque', ax.x0 + 8, ax.py0 + 10); ctx.fillStyle = '#ffc857'; ctx.fillText('— Discharge (≈const)', ax.x0 + 8, ax.py0 + 20);
  }
  function drawChartOperating(ctx, W, y0, h) {
    var data = state.curveData.operating.length ? state.curveData.operating : synthOperating();
    var ax = axisFrame(ctx, W, y0, h, 110, 100, 'Load (% of full gate)', 'Efficiency η (%)', 'OPERATING CHARACTERISTIC (CONST SPEED)');
    plotLine(ctx, ax, data, function (q) { return q.load; }, function (q) { return q.eta * 100; }, '#26c6da', true);
  }
  function synthOperating() {
    var out = [], savedG = state.gate, Ndes = Ndesign();
    [20, 35, 50, 65, 80, 90, 100].forEach(function (g) { state.gate = g; var s = solve(Ndes); out.push({ load: g, eta: s.eta, Po: s.Po }); });
    state.gate = savedG; return out;
  }
  function drawChartUnit(ctx, W, y0, h) {
    var ls = state.running ? liveState() : solve(Ndesign());
    var ax = axisFrame(ctx, W, y0, h, 3, Math.max(ls.Nu, ls.Qu, ls.Pu * 50) * 1.3 || 1, 'Quantity', 'Value', 'UNIT QUANTITIES (per √H, per H^1.5)');
    var bars = [{ l: 'Nᵤ=N/√H', v: ls.Nu, c: '#26c6da' }, { l: 'Qᵤ=Q/√H', v: ls.Qu, c: '#ffc857' }, { l: 'Pᵤ=P/H^1.5', v: ls.Pu * 50, raw: ls.Pu, c: '#ce93d8' }];
    var bw = ax.pw / 3 * 0.5;
    bars.forEach(function (b, i) { var cx = ax.x0 + (i + 0.5) * ax.pw / 3; var by = ax.my(b.v); ctx.fillStyle = b.c; ctx.fillRect(cx - bw / 2, by, bw, ax.py0 + ax.ph - by); ctx.fillStyle = '#dde3f0'; ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.fillText(fmt(b.raw != null ? b.raw : b.v, 2), cx, by - 5); ctx.fillStyle = '#9ba6c4'; ctx.font = '8px Segoe UI'; ctx.fillText(b.l, cx, ax.py0 + ax.ph + 12); });
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText('Constant for a given turbine & gate as H varies (Pᵤ ×50 for scale)', ax.x0 + 4, ax.py0 + ax.ph + 26);
  }
  function drawChartType(ctx, W, y0, h) {
    var ns = specificSpeed();
    var pad = { l: 20, r: 20, t: 40, b: 40 }, pw = W - pad.l - pad.r, x0 = pad.l, midY = y0 + h / 2;
    ctx.fillStyle = '#80d8ff'; ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText('SPECIFIC SPEED & TURBINE TYPE', x0, y0 + 12);
    /* log scale 8..1000 */
    var lmin = Math.log10(8), lmax = Math.log10(1000);
    function mx(v) { return x0 + (Math.log10(Math.max(8, Math.min(1000, v))) - lmin) / (lmax - lmin) * pw; }
    var bands = [{ a: 8, b: 35, c: '#42a5f5', n: 'PELTON' }, { a: 35, b: 270, c: '#26c6da', n: 'FRANCIS' }, { a: 270, b: 1000, c: '#66bb6a', n: 'KAPLAN' }];
    bands.forEach(function (bd) { ctx.fillStyle = bd.c + '44'; ctx.fillRect(mx(bd.a), midY - 22, mx(bd.b) - mx(bd.a), 44); ctx.strokeStyle = bd.c; ctx.strokeRect(mx(bd.a), midY - 22, mx(bd.b) - mx(bd.a), 44); ctx.fillStyle = bd.c; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText(bd.n, (mx(bd.a) + mx(bd.b)) / 2, midY + 4); });
    [8, 30, 100, 300, 1000].forEach(function (t) { ctx.fillStyle = '#6b7a99'; ctx.font = '8px Courier New'; ctx.textAlign = 'center'; ctx.fillText(t, mx(t), midY + 36); });
    ctx.fillStyle = '#9ba6c4'; ctx.font = '8.5px Segoe UI'; ctx.fillText('Specific speed Nₛ = N√P / H^1.25', x0 + pw / 2, midY + 52);
    /* marker */
    var mxv = mx(ns); ctx.fillStyle = '#ffc857'; ctx.beginPath(); ctx.moveTo(mxv, midY - 30); ctx.lineTo(mxv - 6, midY - 40); ctx.lineTo(mxv + 6, midY - 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffc857'; ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('Nₛ = ' + fmt(ns, 0) + '  →  ' + turbineClass(ns), mxv, midY - 46);
  }
  function drawChartFamily(ctx, W, y0, h) {
    var fam = state.curveData.family.length ? state.curveData.family : [{ gate: 100, pts: sampleSpeed(100, 18) }, { gate: 70, pts: sampleSpeed(70, 18) }, { gate: 45, pts: sampleSpeed(45, 18) }];
    var xMax = 2 * Ndesign() * 1.02 || 1;
    var ax = axisFrame(ctx, W, y0, h, xMax, 100, 'Speed N (rpm)', 'Efficiency η (%)', 'MAIN CHARACTERISTICS — GATE FAMILY');
    var cols = ['#26c6da', '#4dd0e1', '#80deea'];
    fam.forEach(function (fm, i) { plotLine(ctx, ax, fm.pts, function (q) { return q.N; }, function (q) { return q.eta * 100; }, cols[i % 3], false); var pk = fm.pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, fm.pts[0]); ctx.fillStyle = cols[i % 3]; ctx.font = '8px Segoe UI'; ctx.textAlign = 'left'; ctx.fillText(fm.gate + '% gate', ax.mx(pk.N) + 4, ax.my(pk.eta * 100) - 2); });
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DOM
     ═══════════════════════════════════════════════════════════════════════ */
  function setText(id, t) { var e = $(id); if (e) e.textContent = t; }
  function updateBadges() {
    var ls = liveState();
    setText('rb-n', state.running ? state.N : 0); setText('rb-n-u', 'rpm');
    setText('rb-q', fmt(toD(ls.Q, 'flow'), 2)); setText('rb-q-u', uLabel('flow'));
    setText('rb-h', fmt(toD(ls.H, 'head'), 1)); setText('rb-h-u', uLabel('head'));
    setText('rb-p', fmt(toD(ls.Po, 'power'), 2)); setText('rb-p-u', uLabel('power'));
    setText('rb-eta', state.running ? fmt(ls.eta * 100, 1) : 0);
  }
  function updateResultCards() {
    var ls = liveState();
    setText('res-q', state.running ? state.N : '—');
    setText('res-h', fmt(toD(ls.H, 'head'), 1)); setText('res-h-u', uLabel('head'));
    setText('res-qd', state.running ? fmt(toD(ls.Q, 'flow'), 2) : '—'); setText('res-qd-u', uLabel('flow'));
    setText('res-wp', state.running ? fmt(toD(ls.Pin, 'power'), 3) : '—'); setText('res-wp-u', uLabel('power'));
    setText('res-sp', state.running ? fmt(toD(ls.Po, 'power'), 3) : '—'); setText('res-sp-u', uLabel('power'));
    setText('res-etao', state.running ? fmt(ls.eta * 100, 1) : '—');
    setText('res-hd', state.running ? fmt(toD(ls.T, 'torque'), 1) : '—'); setText('res-hd-u', uLabel('torque'));
    setText('res-hs', state.running ? fmt(ls.Nu, 1) : '—');
    setText('res-etap', state.running ? fmt(ls.Pu, 3) : '—');
    setText('res-ns', fmt(specificSpeed(), 0));
  }
  function updateLabels() {
    setText('lbl-n', 'Speed N (rpm)'); setText('val-n', state.N);
    setText('lbl-valve', 'Gate / nozzle (% open)'); setText('val-valve', Math.round(state.gate));
    if ($('slider-n') && document.activeElement !== $('slider-n')) $('slider-n').value = state.N;
    if ($('slider-valve') && document.activeElement !== $('slider-valve')) $('slider-valve').value = state.gate;
  }
  function buildLabSteps() {
    var steps = ['Select turbine', 'Open gate & start', 'Load / Run test', 'Read curves & report'];
    var cur = !state.running ? 0 : (state.lastTest ? 3 : (state.autoTest ? 2 : 1));
    var html = ''; steps.forEach(function (s, i) { html += '<div class="lab-step ' + (i === cur ? 'active' : (i < cur ? 'done' : '')) + '"><span class="lab-step-num">' + (i + 1) + '</span>' + s + '</div>'; });
    var el = $('lab-steps'); if (el) el.innerHTML = html;
  }

  /* ── sound ── */
  function actx() { if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } return state.audioCtx; }
  function tone(freq, dur, type, vol) { var c = actx(); if (!c) return; var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || 0.05; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur); o.stop(c.currentTime + dur); }
  function playClick() { tone(740, 0.05, 'square', 0.04); }
  function playSuccess() { tone(880, 0.12, 'sine', 0.09); setTimeout(function () { tone(1180, 0.15, 'sine', 0.09); }, 110); }
  function playError() { tone(280, 0.22, 'sawtooth', 0.06); }
  function playStart() { tone(300, 0.18, 'sine', 0.06); setTimeout(function () { tone(560, 0.22, 'sine', 0.05); }, 150); }

  /* ── controls ── */
  function flash(m) { state.phase = m; }
  function startTurb() { state.running = true; state.phase = 'Running'; playStart(); }
  function stopTurb() { state.running = false; state.phase = 'Stopped'; }
  $('btn-start').addEventListener('click', function () { if (state.running) stopTurb(); else startTurb(); this.querySelector('.cp-icon').innerHTML = state.running ? '&#9632;' : '&#9654;'; this.lastChild.textContent = state.running ? ' Stop Turbine' : ' Open Gate & Start'; updateAll(); });
  $('btn-reset').addEventListener('click', function () { resetRig(); playClick(); });
  function resetRig() {
    state.running = false; state.phase = 'Stopped'; state.gate = 100;
    state.curveData = { cs: [], operating: [], family: [], unit: [], vhead: [] }; state.lastTest = null; state.autoTest = null;
    setReportEnabled(false);
    var b = $('btn-start'); b.querySelector('.cp-icon').innerHTML = '&#9654;'; b.lastChild.textContent = ' Open Gate & Start';
    state.N = Math.round(Ndesign()); updateAll();
  }
  function setReportEnabled(on) { $('btn-report').disabled = !on; $('btn-calc').disabled = !on; }
  $('slider-n').addEventListener('input', function (e) { state.N = +e.target.value; setText('val-n', state.N); updateAll(); });
  $('slider-valve').addEventListener('input', function (e) { state.gate = +e.target.value; setText('val-valve', Math.round(state.gate)); updateAll(); });
  document.querySelectorAll('#pump-tabs .mat-pill').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#pump-tabs .mat-pill').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); state.turbKey = b.dataset.value; var t = curTurb();
      state.head = t.Hr; state.D = t.D; state.ratedN = t.Nr; state.N = t.Nr; state.gate = 100;
      resetRig(); playClick();
    });
  });
  document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (b) {
    b.addEventListener('click', function () { document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); state.chartMode = b.dataset.value; playClick(); drawResults(); });
  });
  function updateAll() { updateLabels(); updateBadges(); updateResultCards(); buildLabSteps(); drawPump(); drawResults(); }

  /* ── setup modal ── */
  var setupDraft = { head: 40, D: 220, rated: 1000, brakeR: 150 };
  function openSetup() { if (state.autoTest) { flash('Cancel the running test first'); return; } setupDraft = { head: state.head, D: state.D, rated: state.ratedN, brakeR: state.brakeR }; $('setup-imp').value = setupDraft.head; $('setup-imp-num').value = setupDraft.head; $('setup-stages').value = setupDraft.D; $('setup-stages-num').value = setupDraft.D; $('setup-rated').value = setupDraft.rated; $('setup-rated-num').value = setupDraft.rated; $('setup-lift').value = setupDraft.brakeR; $('setup-lift-num').value = setupDraft.brakeR; updateSetupPreview(); $('setup-modal').style.display = 'flex'; }
  function closeSetup() { $('setup-modal').style.display = 'none'; }
  function updateSetupPreview() {
    var saved = { head: state.head, D: state.D, ratedN: state.ratedN, brakeR: state.brakeR };
    state.head = setupDraft.head; state.D = setupDraft.D; state.ratedN = setupDraft.rated; state.brakeR = setupDraft.brakeR;
    var Qd = Qfull(), Pin = waterPowerAt(Qd, state.head), Pd = p().eta * Pin, ns = specificSpeed();
    setText('prev-h0', fmt(toD(Qd, 'flow'), 2) + ' ' + uLabel('flow'));
    setText('prev-qbep', fmt(toD(Pin, 'power'), 2) + ' ' + uLabel('power'));
    setText('prev-hbep', fmt(toD(Pd, 'power'), 2) + ' ' + uLabel('power'));
    setText('prev-eta', fmt(p().eta * 100, 0) + ' %');
    setText('prev-ns', fmt(ns, 0));
    setText('prev-npsh', turbineClass(ns));
    state.head = saved.head; state.D = saved.D; state.ratedN = saved.ratedN; state.brakeR = saved.brakeR;
  }
  function bindPair(slider, num, key, isFloat) { function commit(v) { var lo = +slider.min, hi = +slider.max; v = Math.max(lo, Math.min(hi, isFloat ? parseFloat(v) : Math.round(v))); if (isNaN(v)) return; setupDraft[key] = v; slider.value = v; num.value = v; updateSetupPreview(); } slider.addEventListener('input', function () { commit(+slider.value); }); num.addEventListener('input', function () { if (num.value !== '') commit(+num.value); }); num.addEventListener('blur', function () { commit(+num.value); }); }
  bindPair($('setup-imp'), $('setup-imp-num'), 'head', false);
  bindPair($('setup-stages'), $('setup-stages-num'), 'D', false);
  bindPair($('setup-rated'), $('setup-rated-num'), 'rated', false);
  bindPair($('setup-lift'), $('setup-lift-num'), 'brakeR', false);
  $('btn-setup').addEventListener('click', function () { openSetup(); playClick(); });
  $('setup-modal-close').addEventListener('click', function () { closeSetup(); playClick(); });
  $('setup-modal-backdrop').addEventListener('click', closeSetup);
  $('setup-reset').addEventListener('click', function () { var t = curTurb(); setupDraft = { head: t.Hr, D: t.D, rated: t.Nr, brakeR: 150 }; $('setup-imp').value = t.Hr; $('setup-imp-num').value = t.Hr; $('setup-stages').value = t.D; $('setup-stages-num').value = t.D; $('setup-rated').value = t.Nr; $('setup-rated-num').value = t.Nr; $('setup-lift').value = 150; $('setup-lift-num').value = 150; updateSetupPreview(); playClick(); });
  $('setup-apply').addEventListener('click', function () { state.head = setupDraft.head; state.D = setupDraft.D; state.ratedN = setupDraft.rated; state.brakeR = setupDraft.brakeR; state.N = Math.round(Ndesign()); if (state.N > 2200) state.N = 2200; $('slider-n').value = state.N; state.curveData = { cs: [], operating: [], family: [], unit: [], vhead: [] }; state.lastTest = null; setReportEnabled(false); closeSetup(); playSuccess(); updateAll(); });

  /* ── auto-test ── */
  var PROCS = [
    { id: 'cs', name: 'Constant-Head Main Characteristic', std: 'Main characteristics', dur: '~30 s', chart: 'eta', desc: 'At constant head and full gate, varies the brake load to sweep the speed from standstill toward runaway, recording efficiency, power, torque and discharge to build the main characteristic curves and find the design speed.', out: 'η–N · P–N · T–N · design point' },
    { id: 'operating', name: 'Operating Characteristic', std: 'Part-load', dur: '~24 s', chart: 'operating', desc: 'At constant head and constant (design) speed, varies the gate / load and plots efficiency against percentage load.', out: 'η vs load' },
    { id: 'family', name: 'Gate-Opening Family', std: 'Main characteristics', dur: '~28 s', chart: 'family', desc: 'Repeats the speed sweep at several gate openings and overlays the efficiency curves.', out: 'η–N family at 3 gates' },
    { id: 'unit', name: 'Unit-Quantity Test', std: 'Similarity', dur: '~24 s', chart: 'unit', desc: 'Varies the head and confirms that unit speed, unit power and unit discharge stay constant for a given turbine and gate.', out: 'Nᵤ · Pᵤ · Qᵤ constancy' },
    { id: 'type', name: 'Specific-Speed / Type', std: 'Selection', dur: '~6 s', chart: 'type', desc: 'Computes the specific speed at the design point and places the turbine on the Pelton–Francis–Kaplan classification chart.', out: 'Nₛ · turbine class' }
  ];
  function buildProcGrid() { var html = ''; PROCS.forEach(function (pr) { html += '<div class="proc-card"><div class="proc-card-head"><span class="proc-card-title">' + pr.name + '</span><span class="proc-card-std">' + pr.std + ' · ' + pr.dur + '</span></div><p class="proc-card-desc">' + pr.desc + '</p><div class="proc-card-out">' + pr.out + '</div><button class="proc-card-run" data-proc="' + pr.id + '">▶ Run Test</button></div>'; }); var g = $('auto-modal-grid'); if (g) { g.innerHTML = html; g.querySelectorAll('.proc-card-run').forEach(function (b) { b.addEventListener('click', function () { startProc(b.dataset.proc); }); }); } }
  function openAuto() { if (!state.running) { flash('Open the gate & start the turbine first'); playError(); return; } if (state.autoTest) return; $('auto-modal').style.display = 'flex'; }
  function closeAuto() { $('auto-modal').style.display = 'none'; }
  $('btn-auto').addEventListener('click', function () { openAuto(); playClick(); });
  $('auto-modal-close').addEventListener('click', function () { closeAuto(); playClick(); });
  $('auto-modal-backdrop').addEventListener('click', closeAuto);
  function startProc(id) {
    var proc = PROCS.filter(function (x) { return x.id === id; })[0]; if (!proc) return; closeAuto();
    state.curveData = { cs: [], operating: [], family: [], unit: [], vhead: [] }; state.chartMode = proc.chart;
    document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (x) { x.classList.toggle('active', x.dataset.value === proc.chart); });
    state.autoTest = { procId: id, procName: proc.name, std: proc.std, steps: buildProcSteps(id), stepIdx: 0, stepStart: Date.now() };
    state.phase = 'Auto-test'; setReportEnabled(false); startAutoTicker();
  }
  function buildProcSteps(id) {
    var steps = [], Ndes = Ndesign(), runaway = 2 * Ndes;
    if (id === 'cs') { for (var i = 1; i <= 9; i++) { var N = runaway * (0.15 + 0.8 * (i - 1) / 8); steps.push({ label: 'Brake load → N ' + Math.round(N) + ' rpm', N: N, gate: 100, kind: 'cs' }); } }
    else if (id === 'operating') {[20, 35, 50, 65, 80, 90, 100].forEach(function (g) { steps.push({ label: 'Gate ' + g + '% (load)', gate: g, N: Ndes, kind: 'op' }); }); }
    else if (id === 'family') {[100, 70, 45].forEach(function (g) { steps.push({ label: 'Sweep @ gate ' + g + '%', gate: g, kind: 'fam' }); }); }
    else if (id === 'unit') {[0.5, 0.7, 1.0, 1.3].forEach(function (hf) { steps.push({ label: 'Head ' + Math.round(curTurb().Hr * hf) + ' m', headMul: hf, kind: 'unit' }); }); }
    else if (id === 'type') { steps.push({ label: 'Compute specific speed', kind: 'type' }); }
    return steps;
  }
  function startAutoTicker() { if (state._ticker) clearInterval(state._ticker); state.autoTest.stepStart = Date.now(); state._ticker = setInterval(tickAuto, 90); }
  function stopAutoTicker() { if (state._ticker) { clearInterval(state._ticker); state._ticker = null; } }
  function tickAuto() {
    var at = state.autoTest; if (!at) { stopAutoTicker(); return; }
    var step = at.steps[at.stepIdx], elapsed = Date.now() - at.stepStart, dwell = step.kind === 'type' ? 800 : 950;
    if (step.N != null) state.N = Math.round(step.N);
    if (step.gate != null) state.gate = step.gate;
    if (step.headMul != null) state.head = Math.round(curTurb().Hr * step.headMul);
    if (elapsed >= dwell) { recordAuto(step); at.stepIdx++; at.stepStart = Date.now(); if (at.stepIdx >= at.steps.length) finishAuto(); }
    updateAll();
  }
  function recordAuto(step) {
    if (step.kind === 'cs') state.curveData.cs.push(solve(state.N));
    else if (step.kind === 'op') { var s = solve(state.N); state.curveData.operating.push({ load: step.gate, eta: s.eta, Po: s.Po }); }
    else if (step.kind === 'fam') state.curveData.family.push({ gate: step.gate, pts: sampleSpeed(step.gate, 18) });
    else if (step.kind === 'unit') { var su = solve(Math.round(Ndesign())); state.curveData.unit.push({ H: state.head, Nu: su.Nu, Qu: su.Qu, Pu: su.Pu }); }
  }
  function finishAuto() {
    var at = state.autoTest; stopAutoTicker();
    state.head = curTurb().Hr;   /* restore head after unit/vhead tests */
    state.lastTest = { procId: at.procId, procName: at.procName, std: at.std, finishedAt: new Date() };
    state.autoTest = null; state.gate = 100; if ($('slider-valve')) $('slider-valve').value = 100; state.N = Math.round(Ndesign()); if ($('slider-n')) $('slider-n').value = state.N;
    state.phase = 'Test complete'; setReportEnabled(true); playSuccess(); buildLabSteps(); updateAll();
  }

  /* ── show calculations ── */
  function openCalc() { if (!state.lastTest) return; $('calc-modal-body').innerHTML = buildCalc(); $('calc-modal').classList.add('active'); }
  function closeCalc() { $('calc-modal').classList.remove('active'); }
  $('btn-calc').addEventListener('click', function () { openCalc(); playClick(); });
  $('calc-modal-close').addEventListener('click', function () { closeCalc(); playClick(); });
  $('calc-modal').addEventListener('click', function (e) { if (e.target === $('calc-modal')) closeCalc(); });
  function calcStep(n, title, eq, res) { var h = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + n + '</span><span class="cs-title">' + title + '</span></div>'; if (eq) h += '<div class="cs-formula">' + eq + '</div>'; if (res != null) h += '<div class="cs-result">→ <strong>' + res + '</strong></div>'; return h + '</div>'; }
  function buildCalc() {
    var lt = state.lastTest, uH = uLabel('head'), uQ = uLabel('flow'), uP = uLabel('power'), uT = uLabel('torque');
    var pts = csPts(); var best = pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, pts[0]);
    var html = '<div class="cs-intro"><strong>' + lt.procName + '</strong> — ' + lt.std + '. Turbine: ' + curTurb().name + ', H = ' + fmt(toD(state.head, 'head'), isImp() ? 1 : 0) + ' ' + uLabel('head') + ', ⌀' + fmt(toD(state.D, 'len'), isImp() ? 2 : 0) + ' ' + uLabel('len') + ', design ' + Math.round(Ndesign()) + ' rpm. Values in the active unit system (' + (isImp() ? 'US' : 'SI') + ').</div>';
    html += calcStep(1, 'Water (input) power', '\\( P_{in} = \\rho\\, g\\, Q\\, H \\)', fmt(toD(best.Pin, 'power'), 3) + ' ' + uP + ' (Q = ' + fmt(toD(best.Q, 'flow'), 2) + ' ' + uQ + ', H = ' + fmt(toD(best.H, 'head'), 1) + ' ' + uH + ')');
    html += calcStep(2, 'Brake torque', '\\( T = (W - S)\\,R \\)', fmt(toD(best.T, 'torque'), 1) + ' ' + uT);
    html += calcStep(3, 'Shaft (output) power', '\\( P = \\dfrac{2\\pi N T}{60} \\)', fmt(toD(best.Po, 'power'), 3) + ' ' + uP + ' at ' + Math.round(best.N) + ' rpm');
    html += calcStep(4, 'Overall efficiency', '\\( \\eta = \\dfrac{P}{P_{in}} \\)', fmt(best.eta * 100, 1) + ' % (design point)');
    html += calcStep(5, 'Unit quantities', '\\( N_u = \\dfrac{N}{\\sqrt H},\\; P_u = \\dfrac{P}{H^{1.5}},\\; Q_u = \\dfrac{Q}{\\sqrt H} \\)', 'Nᵤ = ' + fmt(best.Nu, 1) + ', Pᵤ = ' + fmt(best.Pu, 3) + ', Qᵤ = ' + fmt(best.Qu, 2));
    html += calcStep(6, 'Specific speed & type', '\\( N_s = \\dfrac{N\\sqrt P}{H^{1.25}} \\)', fmt(specificSpeed(), 0) + ' → ' + turbineClass(specificSpeed()));
    return html;
  }

  /* ── exports ── */
  $('btn-csv').addEventListener('click', function () {
    var pts = state.curveData.cs.length ? state.curveData.cs : (state.curveData.operating.length ? null : csPts());
    if (state.curveData.operating.length) {
      var rows0 = ['Load (%),Efficiency (%),Shaft Power (' + uLabel('power') + ')'];
      state.curveData.operating.forEach(function (r) { rows0.push([r.load, fmt(r.eta * 100, 1), fmt(toD(r.Po, 'power'), 3)].join(',')); });
      return dl(rows0, 'turbine_operating_' + state.turbKey + '.csv');
    }
    if (!pts || !pts.length) { flash('Run a test first'); playError(); return; }
    var uH = uLabel('head'), uQ = uLabel('flow'), uP = uLabel('power'), uT = uLabel('torque');
    var rows = ['Speed (rpm),Head (' + uH + '),Discharge (' + uQ + '),Water Power (' + uP + '),Shaft Power (' + uP + '),Torque (' + uT + '),Efficiency (%),Unit Speed,Unit Power'];
    pts.forEach(function (r) { rows.push([Math.round(r.N), fmt(toD(r.H, 'head'), 1), fmt(toD(r.Q, 'flow'), 2), fmt(toD(r.Pin, 'power'), 3), fmt(toD(r.Po, 'power'), 3), fmt(toD(r.T, 'torque'), 1), fmt(r.eta * 100, 1), fmt(r.Nu, 1), fmt(r.Pu, 3)].join(',')); });
    rows.push(''); rows.push('Turbine,' + curTurb().name); rows.push('Head (m),' + state.head); rows.push('Runner dia (mm),' + state.D); rows.push('Specific speed,' + fmt(specificSpeed(), 0));
    dl(rows, 'turbine_test_' + state.turbKey + '.csv');
  });
  function dl(rows, name) { var blob = new Blob([rows.join('\n')], { type: 'text/csv' }); var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); playClick(); }
  $('btn-png').addEventListener('click', function () { var tmp = document.createElement('canvas'); tmp.width = resCv.width; tmp.height = resCv.height; var tc = tmp.getContext('2d'); tc.drawImage(resCv, 0, 0); var fs = Math.max(10, Math.round(tmp.width * 0.02)); tc.font = '600 ' + fs + 'px Segoe UI'; tc.textAlign = 'right'; tc.textBaseline = 'bottom'; tc.fillStyle = 'rgba(255,255,255,0.3)'; tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8); var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'turbine_characteristics.png'; a.click(); playClick(); });
  $('btn-report').addEventListener('click', function () { exportReport(); playClick(); });
  function exportReport() {
    if (!state.lastTest) { flash('Run a test first'); return; }
    var lt = state.lastTest, t = curTurb(), now = lt.finishedAt || new Date();
    var dateStr = now.toISOString().slice(0, 10), timeStr = now.toTimeString().slice(0, 5), reportNo = 'HTR-' + dateStr.replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);
    var uH = uLabel('head'), uQ = uLabel('flow'), uP = uLabel('power'), uT = uLabel('torque');
    var pts = csPts(); var best = pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, pts[0]); var ns = specificSpeed();
    var rows = '<tr><th>N (rpm)</th><th>Q (' + uQ + ')</th><th>T (' + uT + ')</th><th>P (' + uP + ')</th><th>η (%)</th></tr>';
    pts.forEach(function (r) { rows += '<tr><td>' + Math.round(r.N) + '</td><td>' + fmt(toD(r.Q, 'flow'), 2) + '</td><td>' + fmt(toD(r.T, 'torque'), 1) + '</td><td>' + fmt(toD(r.Po, 'power'), 3) + '</td><td>' + fmt(r.eta * 100, 1) + '</td></tr>'; });
    var charts = [
      { t: 'Main Characteristics — Efficiency, Power &amp; Torque vs Speed', img: buildReportChart(pts) },
      { t: 'Operating Characteristic — Efficiency vs Load', img: reportOperating() },
      { t: 'Gate-Opening Family — Efficiency vs Speed', img: reportFamily() },
      { t: 'Specific Speed &amp; Turbine Classification', img: reportType() }
    ];
    var chartsHtml = charts.map(function (ch) { return '<div class="curve"><div class="cap">' + ch.t + '</div><img src="' + ch.img + '" alt="' + ch.t + '"></div>'; }).join('');
    var css = '@page{size:A4;margin:14mm 16mm;}*{box-sizing:border-box;}body{font-family:"Segoe UI",Arial,sans-serif;color:#111;margin:0;font-size:10.5pt;line-height:1.45;}.hd{display:flex;justify-content:space-between;border-bottom:3px solid #00838f;padding-bottom:10px;margin-bottom:14px;}.hd h1{margin:0;font-size:17pt;color:#006064;}.hd .sub{font-size:9.5pt;color:#444;}.hd-r{text-align:right;font-size:9pt;}.rno{font-weight:700;color:#00838f;font-size:11pt;}h2{font-size:11pt;color:#006064;border-bottom:1px solid #b0bec5;padding-bottom:2px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.4px;}table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-bottom:6px;}th,td{border-bottom:1px solid #e0e6ed;padding:4px 8px;text-align:center;}th{background:#e0f7fa;color:#37474f;}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0;}.kpi{border:1px solid #cfd8dc;border-radius:4px;padding:8px;background:#f0fbfd;}.kpi .l{font-size:8pt;color:#546e7a;text-transform:uppercase;}.kpi .v{font-size:13pt;font-weight:700;color:#006064;}.curve{border:1px solid #cfd8dc;padding:6px;margin-top:10px;break-inside:avoid;}.curve .cap{font-size:9pt;font-weight:700;color:#006064;margin-bottom:4px;}.curve img{width:100%;display:block;}.verdict{margin-top:10px;padding:10px 14px;border-left:4px solid #00838f;background:#e0f7fa;}.sign{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:22px;}.sb{border-top:1px solid #455a64;padding-top:4px;font-size:9pt;}.foot{margin-top:16px;border-top:1px solid #b0bec5;padding-top:8px;font-size:8.5pt;color:#546e7a;display:flex;justify-content:space-between;}.bar{background:#00838f;color:#fff;padding:12px 16px;text-align:center;}.bar button{background:#fff;color:#00838f;border:0;padding:7px 16px;font-weight:700;border-radius:4px;margin:0 6px;cursor:pointer;}@media print{.no-print{display:none!important;}}';
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Turbine Test Report ' + reportNo + '</title><style>' + css + '</style></head><body>' +
      '<div class="bar no-print">Use your browser&rsquo;s print dialog (Ctrl/Cmd+P) to <b>Save as PDF</b>. <button onclick="window.print()">Print / Save PDF</button><button onclick="window.close()">Close</button></div>' +
      '<div class="hd"><div><h1>Hydraulic Turbine Performance Test Report</h1><div class="sub">' + lt.procName + ' &mdash; ' + lt.std + '</div></div><div class="hd-r"><div class="rno">Report No. ' + reportNo + '</div><div>Date: ' + dateStr + '</div><div>Time: ' + timeStr + '</div><div>Lab: NHIT VisualLab Virtual Turbine Rig</div></div></div>' +
      '<h2>1. Turbine Specification</h2><div class="two-col"><table><tr><th>Turbine</th><td>' + t.name + '</td></tr><tr><th>Runner diameter</th><td>' + fmt(toD(state.D, 'len'), isImp() ? 2 : 0) + ' ' + uLabel('len') + '</td></tr><tr><th>Net head</th><td>' + fmt(toD(state.head, 'head'), 1) + ' ' + uH + '</td></tr></table><table><tr><th>Design speed</th><td>' + Math.round(Ndesign()) + ' rpm</td></tr><tr><th>Specific speed N&#8347;</th><td>' + fmt(ns, 0) + '</td></tr><tr><th>Classification</th><td>' + turbineClass(ns) + '</td></tr></table></div>' +
      '<h2>2. Design Point</h2><div class="kpis"><div class="kpi"><div class="l">Design speed</div><div class="v">' + Math.round(best.N) + ' rpm</div></div><div class="kpi"><div class="l">Shaft power</div><div class="v">' + fmt(toD(best.Po, 'power'), 2) + ' ' + uP + '</div></div><div class="kpi"><div class="l">Max efficiency</div><div class="v">' + fmt(best.eta * 100, 1) + ' %</div></div><div class="kpi"><div class="l">Discharge</div><div class="v">' + fmt(toD(best.Q, 'flow'), 2) + ' ' + uQ + '</div></div></div>' +
      '<h2>3. Test Readings</h2><table>' + rows + '</table>' +
      '<h2>4. Characteristic Curves</h2>' + chartsHtml +
      '<div class="verdict"><b>Conclusion:</b> The turbine reaches its peak efficiency of ' + fmt(best.eta * 100, 1) + ' % at the design speed of ' + Math.round(best.N) + ' rpm under ' + fmt(toD(state.head, 'head'), 1) + ' ' + uH + ' head. The specific speed of ' + fmt(ns, 0) + ' classifies it as a ' + turbineClass(ns) + ' machine.</div>' +
      '<div class="sign"><div class="sb">Tested by ___________________________</div><div class="sb">Reviewed by ___________________________</div></div>' +
      '<div class="foot"><div>Generated by NHIT VisualLab Virtual Turbine Test Rig &middot; NHIT VisualLab</div><div>Ref: IS 12800, IEC 60193</div></div>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},400);});</' + 'script></body></html>';
    var win = window.open('', '_blank', 'width=900,height=1100'); if (!win) { flash('Pop-up blocked'); return; } win.document.open(); win.document.write(html); win.document.close();
  }
  function buildReportChart(pts) {
    var W = 1000, H = 460, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); var pad = { l: 70, r: 70, t: 30, b: 55 }, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    var nMax = pts[pts.length - 1].N || 1, pMax = Math.max.apply(null, pts.map(function (q) { return q.Po; })) * 1.2 || 1;
    x.strokeStyle = '#90a4ae'; x.lineWidth = 1; x.beginPath(); x.moveTo(pad.l, pad.t); x.lineTo(pad.l, pad.t + ph); x.lineTo(pad.l + pw, pad.t + ph); x.stroke();
    function mx(v) { return pad.l + v / nMax * pw; }
    x.fillStyle = '#546e7a'; x.font = '12px Courier New'; x.textAlign = 'center'; for (var t = 0; t <= 5; t++) { var nn = nMax * t / 5; x.fillText(Math.round(nn), mx(nn), pad.t + ph + 18); }
    x.fillStyle = '#006064'; x.font = 'bold 13px Segoe UI'; x.fillText('Speed N (rpm)', pad.l + pw / 2, pad.t + ph + 42);
    function line(fy, col) { x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); pts.forEach(function (q, i) { var X = mx(q.N), Y = fy(q); if (i === 0) x.moveTo(X, Y); else x.lineTo(X, Y); }); x.stroke(); pts.forEach(function (q) { x.fillStyle = col; x.beginPath(); x.arc(mx(q.N), fy(q), 3, 0, TAU); x.fill(); }); }
    line(function (q) { return pad.t + ph - q.eta * ph; }, '#0097a7');
    line(function (q) { return pad.t + ph - q.Po / pMax * ph; }, '#8e24aa');
    line(function (q) { return pad.t + ph - q.T / (pts[0].T || 1) * ph; }, '#ef6c00');
    x.font = '12px Segoe UI'; x.textAlign = 'left'; x.fillStyle = '#0097a7'; x.fillText('— Efficiency', pad.l + 8, pad.t + 14); x.fillStyle = '#8e24aa'; x.fillText('— Power', pad.l + 110, pad.t + 14); x.fillStyle = '#ef6c00'; x.fillText('— Torque', pad.l + 190, pad.t + 14);
    x.fillStyle = 'rgba(0,131,143,0.4)'; x.font = '600 16px Segoe UI'; x.textAlign = 'right'; x.textBaseline = 'bottom'; x.fillText('NHIT VisualLab', W - 10, H - 8);
    return c.toDataURL('image/png');
  }
  /* light-theme report canvas + axis helper */
  function rcv(W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); return { c: c, x: x }; }
  function rcAxis(x, W, H, xMax, yMax, xl, yl, title, fmtX) {
    var pad = { l: 64, r: 24, t: 30, b: 48 }, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    x.fillStyle = '#006064'; x.font = 'bold 14px Segoe UI'; x.textAlign = 'left'; x.fillText(title, pad.l, 20);
    x.strokeStyle = '#90a4ae'; x.lineWidth = 1; x.beginPath(); x.moveTo(pad.l, pad.t); x.lineTo(pad.l, pad.t + ph); x.lineTo(pad.l + pw, pad.t + ph); x.stroke();
    x.fillStyle = '#546e7a'; x.font = '11px Courier New'; x.textAlign = 'center';
    for (var t = 0; t <= 5; t++) { var xv = xMax * t / 5; x.fillText(fmtX ? fmtX(xv) : (xv < 10 ? xv.toFixed(1) : Math.round(xv)), pad.l + xv / xMax * pw, pad.t + ph + 16); }
    x.textAlign = 'right'; for (var k = 0; k <= 4; k++) { var yv = yMax * k / 4; x.fillText(yv < 10 ? yv.toFixed(1) : Math.round(yv), pad.l - 5, pad.t + ph - yv / yMax * ph + 4); }
    x.fillStyle = '#37474f'; x.font = '12px Segoe UI'; x.textAlign = 'center'; x.fillText(xl, pad.l + pw / 2, pad.t + ph + 34);
    x.save(); x.translate(16, pad.t + ph / 2); x.rotate(-Math.PI / 2); x.fillText(yl, 0, 0); x.restore();
    return { mx: function (v) { return pad.l + v / xMax * pw; }, my: function (v) { return pad.t + ph - v / yMax * ph; }, pad: pad, pw: pw, ph: ph };
  }
  function rcWatermark(x, W, H) { x.fillStyle = 'rgba(0,131,143,0.4)'; x.font = '600 14px Segoe UI'; x.textAlign = 'right'; x.textBaseline = 'bottom'; x.fillText('NHIT VisualLab', W - 10, H - 6); }
  function rcLine(x, ax, pts, fx, fy, col) { x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); pts.forEach(function (q, i) { var X = ax.mx(fx(q)), Y = ax.my(fy(q)); if (i === 0) x.moveTo(X, Y); else x.lineTo(X, Y); }); x.stroke(); pts.forEach(function (q) { x.fillStyle = col; x.beginPath(); x.arc(ax.mx(fx(q)), ax.my(fy(q)), 2.6, 0, TAU); x.fill(); }); }
  /* operating characteristic — η vs % load */
  function reportOperating() {
    var data = state.curveData.operating.length ? state.curveData.operating : synthOperating();
    var o = rcv(940, 360), x = o.x; var ax = rcAxis(x, 940, 360, 110, 100, 'Load (% of full gate)', 'Efficiency η (%)', 'Operating Characteristic — Efficiency vs Load');
    rcLine(x, ax, data, function (q) { return q.load; }, function (q) { return q.eta * 100; }, '#0097a7');
    rcWatermark(x, 940, 360); return o.c.toDataURL('image/png');
  }
  /* gate-opening family — η vs N at several gates */
  function reportFamily() {
    var fam = state.curveData.family.length ? state.curveData.family : [{ gate: 100, pts: sampleSpeed(100, 18) }, { gate: 70, pts: sampleSpeed(70, 18) }, { gate: 45, pts: sampleSpeed(45, 18) }];
    var o = rcv(940, 360), x = o.x; var nMax = 2 * Ndesign() * 1.02 || 1;
    var ax = rcAxis(x, 940, 360, nMax, 100, 'Speed N (rpm)', 'Efficiency η (%)', 'Gate-Opening Family — Efficiency vs Speed');
    var cols = ['#006064', '#0097a7', '#4dd0e1'];
    fam.forEach(function (fm, i) { rcLine(x, ax, fm.pts, function (q) { return q.N; }, function (q) { return q.eta * 100; }, cols[i % 3]); var pk = fm.pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, fm.pts[0]); x.fillStyle = cols[i % 3]; x.font = '11px Segoe UI'; x.textAlign = 'left'; x.fillText(fm.gate + '% gate', ax.mx(pk.N) + 4, ax.my(pk.eta * 100) - 3); });
    rcWatermark(x, 940, 360); return o.c.toDataURL('image/png');
  }
  /* specific speed classification band */
  function reportType() {
    var o = rcv(940, 300), x = o.x, ns = specificSpeed(); var W = 940, pad = 40, pw = W - pad * 2, x0 = pad, midY = 150;
    x.fillStyle = '#006064'; x.font = 'bold 14px Segoe UI'; x.textAlign = 'left'; x.fillText('Specific Speed & Turbine Classification', pad, 24);
    var lmin = Math.log10(8), lmax = Math.log10(1000);
    function mx(v) { return x0 + (Math.log10(Math.max(8, Math.min(1000, v))) - lmin) / (lmax - lmin) * pw; }
    var bands = [{ a: 8, b: 35, c: '#1565c0', n: 'PELTON' }, { a: 35, b: 270, c: '#00838f', n: 'FRANCIS' }, { a: 270, b: 1000, c: '#2e7d32', n: 'KAPLAN' }];
    bands.forEach(function (bd) { x.fillStyle = bd.c + '33'; x.fillRect(mx(bd.a), midY - 26, mx(bd.b) - mx(bd.a), 52); x.strokeStyle = bd.c; x.lineWidth = 1.5; x.strokeRect(mx(bd.a), midY - 26, mx(bd.b) - mx(bd.a), 52); x.fillStyle = bd.c; x.font = 'bold 13px Segoe UI'; x.textAlign = 'center'; x.fillText(bd.n, (mx(bd.a) + mx(bd.b)) / 2, midY + 5); });
    [8, 30, 100, 300, 1000].forEach(function (t) { x.fillStyle = '#546e7a'; x.font = '11px Courier New'; x.textAlign = 'center'; x.fillText(t, mx(t), midY + 44); });
    x.fillStyle = '#37474f'; x.font = '12px Segoe UI'; x.fillText('Specific speed  Nₛ = N√P / H^1.25', W / 2, midY + 64);
    var mxv = mx(ns); x.fillStyle = '#ef6c00'; x.beginPath(); x.moveTo(mxv, midY - 34); x.lineTo(mxv - 7, midY - 46); x.lineTo(mxv + 7, midY - 46); x.closePath(); x.fill();
    x.fillStyle = '#ef6c00'; x.font = 'bold 13px Segoe UI'; x.textAlign = 'center'; x.fillText('Nₛ = ' + fmt(ns, 0) + '  →  ' + turbineClass(ns), mxv, midY - 52);
    rcWatermark(x, 940, 300); return o.c.toDataURL('image/png');
  }

  /* ── context menu ── */
  pumpCv.addEventListener('contextmenu', function (e) { e.preventDefault(); var menu = $('ctx-menu'); var rect = pumpCv.parentElement.getBoundingClientRect(); menu.style.left = (e.clientX - rect.left) + 'px'; menu.style.top = (e.clientY - rect.top) + 'px'; menu.style.display = 'block'; });
  document.addEventListener('click', function () { $('ctx-menu').style.display = 'none'; });
  $('ctx-menu').addEventListener('click', function (e) { var a = e.target.dataset.action; if (a === 'save-img') { pumpCv.toBlob(function (b) { var u = URL.createObjectURL(b); var l = document.createElement('a'); l.href = u; l.download = 'turbine_rig.png'; l.click(); }); } else if (a === 'copy-data') { var ls = liveState(); navigator.clipboard && navigator.clipboard.writeText(curTurb().name + ' | N=' + state.N + ' rpm | H=' + fmt(toD(ls.H, 'head'), 1) + ' ' + uLabel('head') + ' | Q=' + fmt(toD(ls.Q, 'flow'), 2) + ' ' + uLabel('flow') + ' | P=' + fmt(toD(ls.Po, 'power'), 2) + ' ' + uLabel('power') + ' | η=' + fmt(ls.eta * 100, 1) + '%'); } else if (a === 'reset') resetRig(); });

  /* ── unit + mode switching ── */
  document.querySelectorAll('#unit-toggle .pill').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('#unit-toggle .pill').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); }); b.classList.add('active'); b.setAttribute('aria-pressed', 'true'); state.units = b.dataset.value; playClick(); updateAll(); if (state.mode === 'explore') renderExplore(); }); });
  var WRAPS = { simulate: 'sim-wrapper', explore: 'explore-wrapper', practice: 'practice-wrapper', quiz: 'quiz-wrapper' };
  document.querySelectorAll('#mode-tabs .pill').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('#mode-tabs .pill').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); state.mode = b.dataset.value; Object.keys(WRAPS).forEach(function (k) { var el = $(WRAPS[k]); if (el) el.style.display = (k === state.mode) ? '' : 'none'; }); playClick(); if (state.mode === 'explore') renderExplore(); if (state.mode === 'practice') newPractice(); if (state.mode === 'quiz') resetQuiz(); }); });

  /* ── explore ── */
  var EXPLORE = {
    basics: [
      { title: 'Turbine = pump in reverse', body: 'A hydraulic turbine extracts energy from flowing water and delivers it as shaft work to a generator. Water enters at high energy (head) and leaves at low energy; the runner converts the change into torque and rotation. It is the prime mover of every hydro-power station.', note: 'Output is shaft power; input is the water power ρgQH.' },
      { title: 'Impulse vs reaction', body: 'In an impulse turbine (Pelton) the whole head becomes a free jet that strikes the runner at atmospheric pressure. In a reaction turbine (Francis, Kaplan) the runner is fully immersed and develops power from both a pressure drop and momentum change across the blades.', note: 'Impulse → high head, low flow; reaction → lower head, higher flow.' },
      { title: 'Parts of the test rig', body: 'A pump or overhead tank supplies a constant head through a penstock. The runner drives a shaft carrying a brake dynamometer; a pressure gauge reads the head, a tachometer the speed, and the rope-brake load gives the torque. A draft tube (reaction turbines) recovers exit kinetic energy.', note: 'The brake load sets the operating speed — more load, lower speed.' }
    ],
    procedure: [
      { title: 'Constant-head main characteristic', body: 'Hold the head and gate fixed. Vary the brake load to change the speed from near standstill toward runaway. At each steady speed record the head, discharge, speed and brake torque, then compute power and efficiency.', note: 'Plot efficiency, power, torque and discharge against speed.' },
      { title: 'Operating characteristic', body: 'Hold the head and speed constant (as in a real generator on the grid). Vary the gate opening to change the load, and plot efficiency against percentage of full load.', note: 'Shows how efficiency falls at part load.' },
      { title: 'Computing the results', body: 'Water power Pin = ρgQH; brake torque T = (W − S)R; shaft power P = 2πNT/60; efficiency η = P/Pin. Reduce to unit quantities and specific speed to compare turbines.', note: 'Discharge is measured by a venturi, notch or collecting tank.' }
    ],
    formulas: [
      { title: 'Power and efficiency', body: 'Input water power, output shaft power and overall efficiency.', formula: 'Pin = ρgQH ;  P = 2πNT/60 ;  η = P/Pin', note: 'Example: N=1000 rpm, T=28 N·m → P=2π·1000·28/60=2.93 kW.' },
      { title: 'Unit quantities', body: 'Reduce performance to unit head for comparison.', formula: 'Nu = N/√H ,  Qu = Q/√H ,  Pu = P/H^1.5', note: 'Constant for a given turbine & gate as H changes.' },
      { title: 'Specific speed', body: 'The master selection parameter.', formula: 'Ns = N√P / H^1.25  (P in kW, H in m)', note: 'Pelton 8–30, Francis 50–250, Kaplan 300–1000.' }
    ],
    characteristics: [
      { title: 'Efficiency vs speed', body: 'At constant head and gate, efficiency is zero at standstill (no rotation, no work), rises to a maximum at the design speed where the runner blade speed matches the flow, and falls back to zero at the runaway speed where the turbine spins freely under no load.', note: 'For a Pelton wheel the peak is near a bucket speed of 0.46 × jet speed.' },
      { title: 'Power and torque vs speed', body: 'Shaft power is a hump — zero at standstill and at runaway, peak near the design speed. Brake torque is greatest at standstill and falls roughly linearly to zero at runaway. Discharge is nearly constant with speed for an impulse turbine.', note: 'Runaway speed is about twice the design speed.' },
      { title: 'Main vs operating characteristics', body: 'Main characteristics vary the speed at constant head (often at several gate openings — the Muschel or iso-efficiency family). Operating characteristics vary the load at constant speed, as a turbine actually runs on the grid.', note: 'Both are required to fully describe a turbine.' }
    ],
    types: [
      { title: 'Pelton wheel (impulse)', body: 'A nozzle converts the head to a high-speed jet that strikes split buckets on the runner rim; a spear valve regulates the flow. Used for very high heads (hundreds of metres) and low flows, e.g. mountain hydro schemes.', note: 'Low specific speed; one to six jets.' },
      { title: 'Francis turbine (reaction)', body: 'Water enters a spiral casing, passes through adjustable guide vanes and flows radially inward then axially through the curved runner into a draft tube. The most widely used turbine, for medium heads (10–300 m) and medium flows.', note: 'Mixed-flow; medium specific speed.' },
      { title: 'Kaplan turbine (reaction)', body: 'An axial-flow propeller runner with adjustable blades sits in a tube, like a ship propeller. Used for low heads (2–40 m) and very high flows, e.g. run-of-river plants. Blade and guide-vane adjustment keeps efficiency high over a wide load range.', note: 'High specific speed; double-regulated.' }
    ],
    selection: [
      { title: 'Selecting by specific speed', body: 'For a site with a known head and flow, compute the required specific speed. Low Ns demands a Pelton wheel; medium Ns a Francis; high Ns a Kaplan. Specific speed captures the trade-off between head and flow in one number.', formula: 'Ns = N√P / H^1.25', note: 'High head → low Ns → Pelton; low head → high Ns → Kaplan.' },
      { title: 'Runaway and overspeed', body: 'If the electrical load is suddenly lost, the turbine accelerates to its runaway speed — about 1.8–2× design for Francis, up to 2.8× for Kaplan. The shaft and generator must be designed to survive it.', note: 'Governors close the gate to prevent dangerous overspeed.' },
      { title: 'Cavitation in reaction turbines', body: 'Low pressure at the runner exit (especially Kaplan/Francis) can drop to vapour pressure and cause cavitation, eroding the blades. The draft tube and a limit on the setting height above tailwater (Thoma’s cavitation factor σ) keep it in check.', note: 'Impulse turbines run at atmospheric pressure — no cavitation.' }
    ]
  };
  function renderMath(el) { try { if (window.renderMathInElement) window.renderMathInElement(el, { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }] }); } catch (e) { } }
  function renderExplore() {
    var cat = document.querySelector('#cat-tabs .pill.active').dataset.value, cards = EXPLORE[cat] || [], host = $('explore-cards'); host.innerHTML = '';
    cards.forEach(function (c) { var div = document.createElement('div'); div.className = 'explore-card'; var html = '<div class="explore-card-title">' + c.title + '</div><div class="explore-card-body">' + c.body + '</div>'; if (c.formula) html += '<code class="explore-card-formula">' + c.formula + '</code>'; if (c.note) html += '<div class="explore-card-note">💡 ' + c.note + '</div>'; div.innerHTML = html; host.appendChild(div); });
    renderMath(host);
  }
  document.querySelectorAll('#cat-tabs .pill').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('#cat-tabs .pill').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); renderExplore(); playClick(); }); });

  /* ── practice ── */
  var pState = { correct: 0, total: 0, ans: 0, unit: '', sol: '' };
  function newPractice() {
    var t = Math.floor(Math.random() * 5), q = '', ans = 0, unit = '', sol = '';
    if (t === 0) { var Q = (5 + Math.random() * 40).toFixed(1), Hh = (5 + Math.random() * 80).toFixed(0); q = 'A turbine passes Q = ' + Q + ' L/s under a net head H = ' + Hh + ' m. Calculate the water (input) power in kW.'; ans = RHO * G * (Q / 1000) * Hh / 1000; unit = 'kW'; sol = 'Pin = ρgQH = 1000×9.81×' + (Q / 1000).toFixed(3) + '×' + Hh + ' = ' + ans.toFixed(2) + ' kW'; }
    else if (t === 1) { var N = (500 + Math.random() * 1000).toFixed(0), T = (10 + Math.random() * 60).toFixed(1); q = 'A turbine runs at N = ' + N + ' rpm with a brake torque T = ' + T + ' N·m. Calculate the shaft power in kW.'; ans = TAU * N * T / 60 / 1000; unit = 'kW'; sol = 'P = 2πNT/60 = 2π×' + N + '×' + T + '/60 = ' + (ans * 1000).toFixed(0) + ' W = ' + ans.toFixed(2) + ' kW'; }
    else if (t === 2) { var Po = (1 + Math.random() * 5).toFixed(2), Hx = (5 + Math.random() * 60).toFixed(0), Qx = (5 + Math.random() * 30).toFixed(1); var Pin = RHO * G * (Qx / 1000) * Hx / 1000; q = 'A turbine develops a shaft power of ' + Po + ' kW from Q = ' + Qx + ' L/s under H = ' + Hx + ' m. Find the overall efficiency (%).'; ans = Po / Pin * 100; unit = '%'; sol = 'Pin = ρgQH = ' + Pin.toFixed(2) + ' kW; η = P/Pin = ' + Po + '/' + Pin.toFixed(2) + ' = ' + ans.toFixed(1) + ' %'; }
    else if (t === 3) { var Nu0 = (20 + Math.random() * 60).toFixed(0), H1 = (4 + Math.random() * 60).toFixed(0); q = 'A turbine has a unit speed Nu = ' + Nu0 + '. What actual speed (rpm) will it run at under a head of ' + H1 + ' m?'; ans = Nu0 * Math.sqrt(H1); unit = 'rpm'; sol = 'N = Nu×√H = ' + Nu0 + '×√' + H1 + ' = ' + ans.toFixed(0) + ' rpm'; }
    else { var Nn = (300 + Math.random() * 800).toFixed(0), Pp = (1 + Math.random() * 6).toFixed(1), Hn = (5 + Math.random() * 60).toFixed(0); q = 'Calculate the specific speed Ns = N√P/H^1.25 for N = ' + Nn + ' rpm, P = ' + Pp + ' kW, H = ' + Hn + ' m.'; ans = Nn * Math.sqrt(Pp) / Math.pow(Hn, 1.25); unit = ''; sol = 'Ns = ' + Nn + '×√' + Pp + '/' + Hn + '^1.25 = ' + ans.toFixed(0); }
    pState.ans = ans; pState.unit = unit; pState.sol = sol;
    $('pp-prompt').textContent = q; $('pp-unit').textContent = unit; $('pp-input').value = ''; $('prac-feedback').textContent = ''; $('prac-feedback').className = 'feedback'; $('solution-panel').style.display = 'none';
  }
  $('btn-check').addEventListener('click', function () { var v = parseFloat($('pp-input').value); if (isNaN(v)) return; pState.total++; var tol = Math.max(0.02 * Math.abs(pState.ans), 0.05); var fb = $('prac-feedback'); if (Math.abs(v - pState.ans) <= tol) { pState.correct++; fb.textContent = '✓ Correct! ≈ ' + pState.ans.toFixed(2) + ' ' + pState.unit; fb.className = 'feedback ok'; playSuccess(); } else { fb.textContent = '✗ Not quite. Correct ≈ ' + pState.ans.toFixed(2) + ' ' + pState.unit; fb.className = 'feedback bad'; playError(); } $('p-score').textContent = pState.correct; $('p-total').textContent = pState.total; });
  $('btn-show-sol').addEventListener('click', function () { var s = $('solution-panel'); s.style.display = 'block'; s.innerHTML = '<strong>Solution:</strong> ' + pState.sol; });
  $('btn-next-p').addEventListener('click', function () { newPractice(); playClick(); });

  /* ── quiz ── */
  var QUIZ = [
    { q: 'Which turbine is an impulse turbine for high head and low flow?', o: ['Francis', 'Kaplan', 'Pelton', 'Centrifugal'], a: 2 },
    { q: 'Which turbine suits low head and very high flow?', o: ['Pelton', 'Kaplan', 'Francis', 'Turgo'], a: 1 },
    { q: 'The overall efficiency of a turbine is…', o: ['water power / shaft power', 'shaft power / water power', 'torque / speed', 'head / discharge'], a: 1 },
    { q: 'Shaft power from a brake dynamometer is P =', o: ['ρgQH', '2πNT/60', 'N√P', 'Q/√H'], a: 1 },
    { q: 'Efficiency vs speed at constant head is…', o: ['constant', 'maximum at runaway', 'maximum at the design speed', 'maximum at standstill'], a: 2 },
    { q: 'Specific speed Ns = N√P/H^1.25 of a Pelton wheel is typically…', o: ['8–30 (low)', '50–250 (medium)', '300–1000 (high)', 'negative'], a: 0 },
    { q: 'Unit speed is defined as…', o: ['N·√H', 'N/√H', 'N/H', 'N·H'], a: 1 },
    { q: 'At the runaway speed of a turbine the…', o: ['torque is maximum', 'power is maximum', 'torque and power are zero', 'efficiency is maximum'], a: 2 }
  ];
  var qState = { order: [], idx: 0, score: 0, answered: false };
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function resetQuiz() { $('quiz-result').style.display = 'none'; document.querySelector('.question-panel').style.display = ''; $('btn-quiz-next').style.display = 'none'; qState = { order: shuffle(QUIZ.slice()).slice(0, 5), idx: 0, score: 0, answered: false }; renderQuiz(); }
  function renderQuiz() { var q = qState.order[qState.idx]; qState.answered = false; $('q-num').textContent = qState.idx + 1; $('q-total').textContent = qState.order.length; $('qp-prompt').textContent = q.q; $('quiz-feedback').textContent = ''; $('btn-quiz-next').style.display = 'none'; var html = ''; q.o.forEach(function (opt, i) { html += '<button class="answer-opt" data-i="' + i + '">' + opt + '</button>'; }); $('quiz-answers').innerHTML = html; $('quiz-answers').querySelectorAll('.answer-opt').forEach(function (b) { b.addEventListener('click', function () { answerQuiz(+b.dataset.i, b); }); }); }
  function answerQuiz(i, btn) { if (qState.answered) return; qState.answered = true; var q = qState.order[qState.idx]; var btns = $('quiz-answers').querySelectorAll('.answer-opt'); btns.forEach(function (b, j) { b.disabled = true; if (j === q.a) b.classList.add('correct'); }); if (i === q.a) { qState.score++; $('quiz-feedback').textContent = '✓ Correct'; $('quiz-feedback').className = 'feedback ok'; playSuccess(); } else { btn.classList.add('wrong'); $('quiz-feedback').textContent = '✗ Correct answer highlighted'; $('quiz-feedback').className = 'feedback bad'; playError(); } $('btn-quiz-next').style.display = ''; $('btn-quiz-next').textContent = qState.idx < qState.order.length - 1 ? 'Next →' : 'See Result'; }
  $('btn-quiz-next').addEventListener('click', function () { if (qState.idx < qState.order.length - 1) { qState.idx++; renderQuiz(); } else showQuizResult(); playClick(); });
  function showQuizResult() { document.querySelector('.question-panel').style.display = 'none'; $('btn-quiz-next').style.display = 'none'; var res = $('quiz-result'); res.style.display = ''; var n = qState.order.length, s = qState.score, stars = Math.round(s / n * 5); $('qr-score').textContent = s + ' / ' + n; $('qr-stars').textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars); $('qr-verdict').textContent = s === n ? 'Perfect — turbine expert!' : s >= n * 0.6 ? 'Good work — review the curves you missed.' : 'Keep practising — try Explore mode.'; }
  $('btn-new-quiz').addEventListener('click', function () { resetQuiz(); playClick(); });

  /* ── loop ── */
  function loop() {
    if (state.running) { state.crankAngle += (state.N / 60) * TAU * (1 / 60) * 0.12; state.jetPart += state.gate / 100 * 3; }
    if (state.mode === 'simulate') { drawPump(); drawResults(); updateBadges(); }
    requestAnimationFrame(loop);
  }

  /* ── init ── */
  (function init() {
    var t = curTurb(); state.head = t.Hr; state.D = t.D; state.ratedN = t.Nr; state.N = t.Nr; state.gate = 100;
    $('slider-n').value = state.N; $('slider-valve').value = state.gate;
    buildProcGrid(); buildLabSteps(); updateLabels(); updateBadges(); updateResultCards(); renderExplore(); drawPump(); drawResults(); loop();
  })();
})();
