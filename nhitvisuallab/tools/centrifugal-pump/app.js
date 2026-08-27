/* ═══════════════════════════════════════════════════════════════════════
   CENTRIFUGAL PUMP TEST RIG SIMULATOR — NHIT VisualLab
   Vanilla JS, Canvas 2D. Plots H–Q / power / efficiency characteristic
   curves, BEP, affinity laws, system curve & duty point, and NPSH.
   All physics computed in SI; display converts to SI or US units.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2;
  var G = 9.81;            /* m/s² */
  var RHO = 1000;          /* kg/m³ (water) */
  var ATM_HEAD = 10.33;    /* m of water — atmospheric pressure head at sea level */
  var PVAP_HEAD = 0.24;    /* m of water — vapour pressure head of water at ~20 °C */
  var MOTOR_ETA = 0.88;    /* electrical motor + transmission efficiency */

  /* ── Pump presets (defined at their rated speed) ──────────────────────
     h0  = shut-off head (m, total, all stages) at rated speed n0 & imp0
     qbep= best-efficiency-point discharge (L/s)
     eta = peak (BEP) pump efficiency (fraction)
     n0  = rated speed (rpm), imp0 = impeller outer diameter (mm)             */
  var PUMPS = {
    p05: { name: '0.5 HP Monoblock', h0: 18, qbep: 0.6, eta: 0.45, n0: 2900, imp0: 98,  stages: 1 },
    p1:  { name: '1 HP Centrifugal',  h0: 22, qbep: 1.1, eta: 0.52, n0: 2900, imp0: 110, stages: 1 },
    p3:  { name: '3 HP Centrifugal',  h0: 30, qbep: 3.0, eta: 0.62, n0: 2900, imp0: 140, stages: 1 },
    p5:  { name: '5 HP Centrifugal',  h0: 36, qbep: 5.0, eta: 0.68, n0: 2900, imp0: 160, stages: 1 },
    t2:  { name: '5 HP Two-Stage',    h0: 60, qbep: 3.0, eta: 0.64, n0: 2900, imp0: 140, stages: 2 },
    sub: { name: '7.5 HP Submersible',h0: 80, qbep: 4.0, eta: 0.66, n0: 2900, imp0: 130, stages: 4 }
  };

  /* ── State ──────────────────────────────────────────────────────────── */
  var state = {
    mode: 'simulate',
    units: 'si',
    pumpKey: 'p3',
    N: 2900,             /* operating speed (rpm) */
    valve: 60,           /* delivery valve % open (default near BEP) */
    /* editable geometry (init from p3) */
    imp: 140, stages: 1, ratedN: 2900, lift: 3.0,
    running: false,
    phase: 'Stopped',
    crankAngle: 0,
    tankLevel: 0.05,
    audioCtx: null,
    chartMode: 'hq',
    autoTest: null,      /* {procId, procName, std, steps, stepIdx, stepStart, durMs, cancelled} */
    lastTest: null,
    curveData: { cs: [], family: [], affinity: [], system: null, npsh: [], cavIdx: -1 }
  };

  function curPump() { return PUMPS[state.pumpKey]; }

  /* ── Unit helpers ─────────────────────────────────────────────────────
     Internal SI: head m, discharge L/s, power kW, pressure bar.            */
  function isImp() { return state.units === 'imperial'; }
  function uLabel(kind) {
    if (kind === 'head')     return isImp() ? 'ft'  : 'm';
    if (kind === 'flow')     return isImp() ? 'gpm' : 'L/s';
    if (kind === 'power')    return isImp() ? 'hp'  : 'kW';
    if (kind === 'pressure') return isImp() ? 'psi' : 'bar';
    if (kind === 'len')      return isImp() ? 'in'  : 'mm';
    return '';
  }
  function toD(val, kind) {
    if (val == null || isNaN(val)) return val;
    if (!isImp()) return val;
    if (kind === 'head')     return val * 3.28084;     /* m → ft */
    if (kind === 'flow')     return val * 15.8503;     /* L/s → US gpm */
    if (kind === 'power')    return val * 1.34102;     /* kW → hp */
    if (kind === 'pressure') return val * 14.50377;    /* bar → psi */
    if (kind === 'len')      return val * 0.0393701;   /* mm → in */
    return val;
  }
  function fmt(v, d) { if (v == null || isNaN(v)) return '—'; return (+v).toFixed(d == null ? 2 : d); }

  /* ═══════════════════════════════════════════════════════════════════════
     ENGINEERING — pump characteristic model
     ═══════════════════════════════════════════════════════════════════════ */

  /* Rated-curve parameters from preset + setup geometry. The shut-off head
     scales with stages and impeller diameter squared and (rated) speed²; the
     BEP flow scales with impeller diameter and speed (stages do not add flow). */
  function ratedParams() {
    var p = curPump();
    var fImp   = (state.imp / p.imp0) * (state.imp / p.imp0);   /* (D/D0)² */
    var fStage = state.stages / p.stages;
    var fNh    = (state.ratedN / p.n0) * (state.ratedN / p.n0); /* (Nr/N0)² */
    var fNq    = state.ratedN / p.n0;
    var h0r = p.h0 * fStage * fImp * fNh;            /* shut-off head at rated speed (m) */
    var qbepr = p.qbep * (state.imp / p.imp0) * fNq; /* BEP discharge at rated speed (L/s) */
    var hbepr = 0.70 * h0r;                          /* head at BEP (30 % droop) */
    var kr = (h0r - hbepr) / (qbepr * qbepr);        /* m per (L/s)² — speed-independent */
    var npshrBep = Math.max(2, Math.min(8, 0.10 * h0r));
    var cr = npshrBep / (qbepr * qbepr);             /* NPSHr = cr·Q² */
    var ksuc = 0.5 / Math.max(qbepr * qbepr, 0.01);  /* suction friction → ~0.5 m at BEP */
    return { h0r: h0r, qbepr: qbepr, kr: kr, eta: p.eta, cr: cr, ksuc: ksuc, ratedN: state.ratedN, stages: state.stages };
  }

  /* Total head (m) developed at discharge Q (L/s) and speed N (rpm). */
  function headAt(Q, N) {
    var rp = ratedParams();
    var sr = N / rp.ratedN;
    var h0N = sr * sr * rp.h0r;
    return Math.max(0, h0N - rp.kr * Q * Q);
  }
  /* Free-delivery discharge (L/s) where head → 0, at speed N. */
  function qFree(N) {
    var rp = ratedParams();
    var sr = N / rp.ratedN;
    return Math.sqrt(Math.max(0, sr * sr * rp.h0r) / rp.kr);
  }
  /* BEP discharge (L/s) at speed N. */
  function qbepAt(N) { var rp = ratedParams(); return rp.qbepr * (N / rp.ratedN); }

  /* Pump efficiency (fraction) at discharge Q & speed N. Parabola through the
     origin peaking at the BEP: η = ηmax·(2r − r²), r = Q/Qbep. */
  function etaPumpAt(Q, N) {
    var rp = ratedParams();
    var qb = qbepAt(N);
    if (qb <= 0) return 0;
    var r = Q / qb;
    var e = rp.eta * (2 * r - r * r);
    return Math.max(0, e);
  }
  /* Water (output) power kW. Q in L/s, H in m. */
  function waterPower(Q, H) { return RHO * G * (Q / 1000) * H / 1000; }
  /* Shaft (brake) power kW. Near shut-off η→0 but P stays finite (limit). */
  function shaftPower(Q, N) {
    var H = headAt(Q, N);
    var Pw = waterPower(Q, H);
    var rp = ratedParams();
    var qb = qbepAt(N);
    var r = Math.max(0.02, qb > 0 ? Q / qb : 0.02);
    var eta = Math.max(0.04, rp.eta * (2 * r - r * r));
    return Pw / eta;
  }
  function inputPower(Q, N) { return shaftPower(Q, N) / MOTOR_ETA; }

  /* Suction lift shown on the vacuum gauge (m): static lift + friction. */
  function suctionLift(Q) { var rp = ratedParams(); return state.lift + rp.ksuc * Q * Q; }
  function npshAvail(Q) { return ATM_HEAD - PVAP_HEAD - suctionLift(Q); }
  function npshReq(Q) { var rp = ratedParams(); return rp.cr * Q * Q; }

  /* Specific speed Ns = N·√Q / H^0.75 (per stage), at the BEP. */
  function specificSpeed() {
    var rp = ratedParams();
    var qb = rp.qbepr;                       /* L/s at rated */
    var hbepPerStage = (0.70 * rp.h0r) / rp.stages;
    var Qm3s = qb / 1000;
    if (hbepPerStage <= 0) return 0;
    return state.ratedN * Math.sqrt(Qm3s) / Math.pow(hbepPerStage, 0.75);
  }

  /* Live operating point from the valve setting (manual mode). Valve % maps
     linearly to discharge from shut-off (0) to free delivery (100 %). */
  function liveQ() { return qFree(state.N) * (state.valve / 100); }

  function liveState() {
    var N = state.running ? state.N : 0;
    var Q = state.running ? liveQ() : 0;
    var H = state.running ? headAt(Q, state.N) : 0;
    var Pw = waterPower(Q, H);
    var Psh = state.running && Q > 0 ? shaftPower(Q, state.N) : (state.running ? shaftPower(0.001, state.N) : 0);
    var etaP = state.running ? etaPumpAt(Q, state.N) : 0;
    var hs = state.running ? suctionLift(Q) : 0;
    var hd = Math.max(0, H - hs);
    return {
      N: N, Q: Q, H: H, Pw: Pw, Psh: Psh, Pin: Psh / MOTOR_ETA,
      etaP: etaP, etaO: etaP * MOTOR_ETA, hs: hs, hd: hd,
      npa: npshAvail(Q), npr: npshReq(Q), ns: specificSpeed()
    };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CANVAS SETUP (Hi-DPI)
     ═══════════════════════════════════════════════════════════════════════ */
  var pumpCv = $('pump-canvas'), pumpCtx = pumpCv.getContext('2d');
  var resCv = $('results-canvas'), resCtx = resCv.getContext('2d');
  var DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  function setupHiDPI(c) { c._lw = c.width; c._lh = c.height; c.width = Math.round(c._lw * DPR); c.height = Math.round(c._lh * DPR); }
  setupHiDPI(pumpCv); setupHiDPI(resCv);
  function beginFrame(ctx, c) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, c._lw, c._lh); ctx.textBaseline = 'alphabetic'; return { W: c._lw, H: c._lh }; }

  var COL = { accent: '#29b6f6', water: '#2196f3', waterLo: '#0d47a1', metal: '#5a6478', dark: '#0d1117' };

  /* ═══════════════════════════════════════════════════════════════════════
     DRAW — pump test rig (left canvas)
     ═══════════════════════════════════════════════════════════════════════ */
  function drawPump() {
    var f = beginFrame(pumpCtx, pumpCv), W = f.W, H = f.H, ctx = pumpCtx;
    var p = curPump();
    /* background */
    ctx.fillStyle = '#0a0e16'; ctx.fillRect(0, 0, W, H);
    drawTitleBar(ctx, W, p);

    var ls = liveState();
    var qf = qFree(state.N) || 1;
    var flow = state.running ? Math.min(1, ls.Q / qf) : 0;   /* 0..1 flow fraction */

    /* ── layout coordinates ── */
    var sumpX = 40, sumpY = H - 120, sumpW = 150, sumpH = 88;        /* sump bottom-left */
    var pumpCx = 250, pumpCy = sumpY - 30, pumpR = 46;               /* pump casing */
    var tankX = W - 150, tankY = 90, tankW = 120, tankH = H - 220;   /* collecting tank right */

    drawSump(ctx, sumpX, sumpY, sumpW, sumpH);
    /* suction pipe: from sump up to pump eye */
    drawPipe(ctx, [[sumpX + 40, sumpY], [sumpX + 40, pumpCy + 70], [pumpCx - pumpR, pumpCy + 70], [pumpCx - pumpR, pumpCy]], 13, flow, false);
    drawFootValve(ctx, sumpX + 40, sumpY + 30);

    /* delivery pipe: pump top → up → across → down into tank */
    var dvX = pumpCx + 4, dvTop = 150;
    drawPipe(ctx, [[dvX, pumpCy - pumpR], [dvX, dvTop], [tankX + tankW / 2, dvTop], [tankX + tankW / 2, tankY - 6]], 13, flow, true);

    drawTank(ctx, tankX, tankY, tankW, tankH, flow);
    drawValve(ctx, dvX, dvTop - 2, state.valve);
    drawPumpCasing(ctx, pumpCx, pumpCy, pumpR, flow);
    drawMotor(ctx, pumpCx, pumpCy - pumpR - 54);
    drawGauges(ctx, pumpCx, pumpCy, ls);
    drawStatusPanel(ctx, W - 178, 56, ls);

    if (state.autoTest) drawAutoOverlay(ctx, W, H);
  }

  function drawTitleBar(ctx, W, p) {
    var g = ctx.createLinearGradient(0, 0, 0, 44);
    g.addColorStop(0, '#11203a'); g.addColorStop(1, '#0a0e16');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 44);
    ctx.strokeStyle = COL.accent; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 44); ctx.lineTo(W, 44); ctx.stroke();
    ctx.fillStyle = COL.accent; ctx.font = 'bold 13px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('◉ PUMP RIG', 14, 18);
    ctx.fillStyle = '#6b7a99'; ctx.font = '11px Courier New, monospace'; ctx.textAlign = 'right';
    ctx.fillText('N = ' + (state.running ? state.N : 0) + ' rpm', W - 14, 18);
    ctx.fillStyle = '#dde3f0'; ctx.font = '10.5px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(p.name.toUpperCase() + '  •  ⌀ ' + fmt(toD(state.imp, 'len'), isImp() ? 2 : 0) + ' ' + uLabel('len') + '  •  ' +
      state.stages + '-STAGE  •  RATED ' + state.ratedN + ' rpm', W / 2, 36);
  }

  function drawSump(ctx, x, y, w, h) {
    ctx.fillStyle = '#1a2436'; ctx.strokeStyle = COL.metal; ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    /* water */
    var wy = y + 14;
    var g = ctx.createLinearGradient(0, wy, 0, y + h);
    g.addColorStop(0, '#2196f3'); g.addColorStop(1, '#0d47a1');
    ctx.fillStyle = g; ctx.fillRect(x + 2, wy, w - 4, h - wy + y - 2);
    /* ripple */
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i <= w; i += 6) { var yy = wy + Math.sin((i + state.crankAngle * 30) * 0.15) * 1.5; if (i === 0) ctx.moveTo(x + i, yy); else ctx.lineTo(x + i, yy); }
    ctx.stroke();
    ctx.fillStyle = '#6b7a99'; ctx.font = '9px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('SUMP', x + w / 2, y + h - 6);
  }

  function drawFootValve(ctx, x, y) {
    ctx.fillStyle = COL.metal; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0d1117'; ctx.beginPath(); ctx.arc(x, y, 3.5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('foot valve', x + 10, y + 3);
  }

  /* poly = array of [x,y]; flow 0..1 animates particles */
  function drawPipe(ctx, poly, width, flow, isDelivery) {
    ctx.strokeStyle = '#3a4663'; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]);
    for (var i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
    ctx.stroke();
    /* inner water */
    ctx.strokeStyle = flow > 0.01 ? (isDelivery ? '#42a5f5' : '#1e88e5') : '#15233b';
    ctx.lineWidth = width - 6;
    ctx.beginPath(); ctx.moveTo(poly[0][0], poly[0][1]);
    for (var j = 1; j < poly.length; j++) ctx.lineTo(poly[j][0], poly[j][1]);
    ctx.stroke();
    /* flow particles */
    if (flow > 0.02) {
      var total = 0, segs = [];
      for (var k = 1; k < poly.length; k++) { var dx = poly[k][0] - poly[k - 1][0], dy = poly[k][1] - poly[k - 1][1]; var L = Math.hypot(dx, dy); segs.push({ x0: poly[k - 1][0], y0: poly[k - 1][1], dx: dx, dy: dy, L: L, s: total }); total += L; }
      var nP = Math.round(total / 26);
      var dir = isDelivery ? 1 : -1;
      var off = ((state.crankAngle * 60 * flow) % 26);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (var m = 0; m < nP; m++) {
        var d = (m * 26 + off * dir + total) % total;
        for (var s = 0; s < segs.length; s++) { var sg = segs[s]; if (d >= sg.s && d <= sg.s + sg.L) { var t = (d - sg.s) / sg.L; ctx.beginPath(); ctx.arc(sg.x0 + sg.dx * t, sg.y0 + sg.dy * t, 2, 0, TAU); ctx.fill(); break; } }
      }
    }
  }

  function drawPumpCasing(ctx, cx, cy, r, flow) {
    /* volute spiral casing */
    var g = ctx.createRadialGradient(cx, cy, 6, cx, cy, r);
    g.addColorStop(0, '#37474f'); g.addColorStop(1, '#0d1117');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = COL.metal; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    /* casing bolts */
    for (var i = 0; i < 8; i++) { var a = i / 8 * TAU; ctx.fillStyle = '#2a3550'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (r - 5), cy + Math.sin(a) * (r - 5), 2.5, 0, TAU); ctx.fill(); }
    /* impeller — curved vanes rotating */
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(state.running ? state.crankAngle : 0);
    ctx.strokeStyle = flow > 0 ? '#4fc3f7' : '#78909c'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    var nV = 6;
    for (var v = 0; v < nV; v++) {
      ctx.save(); ctx.rotate(v / nV * TAU);
      ctx.beginPath(); ctx.moveTo(8, 0);
      ctx.quadraticCurveTo(r * 0.55, r * 0.18, r - 8, r * 0.30);
      ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = COL.accent; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#80d8ff'; ctx.font = '9px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('VOLUTE PUMP', cx, cy + r + 14);
  }

  function drawMotor(ctx, cx, cy) {
    ctx.fillStyle = '#263238'; ctx.strokeStyle = COL.metal; ctx.lineWidth = 2;
    var w = 70, h = 40;
    roundRect(ctx, cx - w / 2, cy - h / 2, w, h, 6); ctx.fill(); ctx.stroke();
    /* cooling fins */
    ctx.strokeStyle = '#1a2230'; ctx.lineWidth = 1;
    for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 12, cy - h / 2 + 3); ctx.lineTo(cx + i * 12, cy + h / 2 - 3); ctx.stroke(); }
    /* shaft to pump */
    ctx.strokeStyle = COL.metal; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy + h / 2); ctx.lineTo(cx, cy + h / 2 + 14); ctx.stroke();
    /* spinning fan indicator */
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(state.running ? state.crankAngle * 0.8 : 0);
    ctx.strokeStyle = state.running ? COL.accent : '#546e7a'; ctx.lineWidth = 2;
    for (var f = 0; f < 4; f++) { ctx.save(); ctx.rotate(f / 4 * TAU); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, 0); ctx.stroke(); ctx.restore(); }
    ctx.restore();
    ctx.fillStyle = '#6b7a99'; ctx.font = '9px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('MOTOR', cx, cy - h / 2 - 5);
    /* energy meter chip */
    ctx.fillStyle = '#0d1117'; roundRect(ctx, cx + w / 2 + 6, cy - 12, 52, 24, 4); ctx.fill();
    ctx.strokeStyle = '#ffc857'; ctx.lineWidth = 1; roundRect(ctx, cx + w / 2 + 6, cy - 12, 52, 24, 4); ctx.stroke();
    var ls = liveState();
    ctx.fillStyle = '#ffc857'; ctx.font = 'bold 10px Courier New, monospace'; ctx.textAlign = 'center';
    ctx.fillText(fmt(toD(ls.Pin, 'power'), 2), cx + w / 2 + 32, cy + 1);
    ctx.fillStyle = '#6b7a99'; ctx.font = '7px Segoe UI, sans-serif';
    ctx.fillText('INPUT ' + uLabel('power'), cx + w / 2 + 32, cy + 9);
  }

  function drawValve(ctx, x, y, open) {
    /* gate valve body on the delivery pipe */
    ctx.fillStyle = '#37474f'; ctx.strokeStyle = COL.metal; ctx.lineWidth = 2;
    roundRect(ctx, x - 12, y - 10, 24, 20, 3); ctx.fill(); ctx.stroke();
    /* handwheel — rotation shows opening */
    ctx.save(); ctx.translate(x, y - 18); ctx.rotate(open / 100 * Math.PI);
    ctx.strokeStyle = open > 5 ? COL.accent : '#ef5350'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x, y - 18); ctx.strokeStyle = COL.metal; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('VALVE ' + Math.round(open) + '%', x, y + 22);
  }

  function drawTank(ctx, x, y, w, h, flow) {
    ctx.fillStyle = '#11192b'; ctx.strokeStyle = COL.metal; ctx.lineWidth = 2;
    ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    /* water level */
    var lv = state.tankLevel; var wy = y + h - lv * (h - 6);
    var g = ctx.createLinearGradient(0, wy, 0, y + h);
    g.addColorStop(0, '#42a5f5'); g.addColorStop(1, '#0d47a1');
    ctx.fillStyle = g; ctx.fillRect(x + 2, wy, w - 4, y + h - wy - 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i <= w; i += 6) { var yy = wy + Math.sin((i + state.crankAngle * 40) * 0.2) * 1.5; if (i === 0) ctx.moveTo(x + i, yy); else ctx.lineTo(x + i, yy); }
    ctx.stroke();
    /* graduations */
    ctx.strokeStyle = '#9ba6c4'; ctx.fillStyle = '#9ba6c4'; ctx.font = '7px Courier New, monospace'; ctx.textAlign = 'left';
    for (var t = 0; t <= 5; t++) { var ty = y + h - (t / 5) * (h - 6) - 3; ctx.beginPath(); ctx.moveTo(x + w, ty); ctx.lineTo(x + w + 5, ty); ctx.stroke(); ctx.fillText((t * 20) + '', x + w + 7, ty + 2); }
    ctx.fillStyle = '#80d8ff'; ctx.font = '9px Segoe UI, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('COLLECTING', x + w / 2, y - 14);
    ctx.fillText('TANK (L)', x + w / 2, y - 4);
  }

  function drawCircGauge(ctx, cx, cy, r, frac, color, label, valTxt) {
    ctx.fillStyle = '#0d1117'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
    /* arc scale */
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r - 4, Math.PI * 0.75, Math.PI * 0.75 + Math.max(0, Math.min(1, frac)) * Math.PI * 1.5); ctx.stroke();
    /* needle */
    var a = Math.PI * 0.75 + Math.max(0, Math.min(1, frac)) * Math.PI * 1.5;
    ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 7), cy + Math.sin(a) * (r - 7)); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#dde3f0'; ctx.font = 'bold 9px Courier New, monospace'; ctx.textAlign = 'center';
    ctx.fillText(valTxt, cx, cy + r + 11);
    ctx.fillStyle = '#6b7a99'; ctx.font = '7px Segoe UI, sans-serif';
    ctx.fillText(label, cx, cy + r + 20);
  }

  function drawGauges(ctx, pumpCx, pumpCy, ls) {
    /* suction (vacuum) gauge near pump inlet */
    var psBar = ls.hs * RHO * G / 1e5;
    drawCircGauge(ctx, pumpCx - 78, pumpCy - 8, 18, Math.min(1, ls.hs / 8), '#ef5350', 'VACUUM ' + uLabel('pressure'),
      fmt(toD(psBar, 'pressure'), 2));
    /* delivery (pressure) gauge near pump outlet */
    var pdBar = ls.hd * RHO * G / 1e5;
    var rp = ratedParams();
    drawCircGauge(ctx, pumpCx + 78, pumpCy - 20, 18, Math.min(1, ls.hd / (rp.h0r * 1.05 || 1)), '#42a5f5', 'PRESSURE ' + uLabel('pressure'),
      fmt(toD(pdBar, 'pressure'), 2));
  }

  function drawStatusPanel(ctx, x, y, ls) {
    ctx.fillStyle = 'rgba(13,17,23,0.92)'; ctx.strokeStyle = COL.accent; ctx.lineWidth = 1;
    roundRect(ctx, x, y, 168, 64, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = state.running ? '#3ddc84' : '#ef5350';
    ctx.beginPath(); ctx.arc(x + 12, y + 14, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = '#dde3f0'; ctx.font = 'bold 11px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(state.running ? 'RUNNING' : 'STOPPED', x + 24, y + 18);
    ctx.fillStyle = '#9ba6c4'; ctx.font = '9px Segoe UI, sans-serif';
    ctx.fillText('Phase: ' + state.phase, x + 10, y + 34);
    /* throttle bar */
    ctx.fillStyle = '#1a2436'; roundRect(ctx, x + 10, y + 42, 120, 8, 4); ctx.fill();
    var g = ctx.createLinearGradient(x + 10, 0, x + 130, 0); g.addColorStop(0, '#ef5350'); g.addColorStop(1, '#3ddc84');
    ctx.fillStyle = g; roundRect(ctx, x + 10, y + 42, 120 * state.valve / 100, 8, 4); ctx.fill();
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Courier New, monospace'; ctx.textAlign = 'right';
    ctx.fillText('valve ' + Math.round(state.valve) + '%', x + 158, y + 50);
  }

  function drawAutoOverlay(ctx, W, H) {
    var at = state.autoTest; var step = at.steps[at.stepIdx]; if (!step) return;
    var by = H - 30;
    ctx.fillStyle = 'rgba(2,119,189,0.92)'; ctx.fillRect(0, by, W, 30);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(at.procName + ' — step ' + (at.stepIdx + 1) + '/' + at.steps.length + ': ' + step.label, 12, by + 19);
    /* progress */
    var prog = (at.stepIdx + 1) / at.steps.length;
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, by, W * prog, 3);
    ctx.fillStyle = '#fff'; ctx.font = '10px Segoe UI'; ctx.textAlign = 'right';
    ctx.fillText('× CANCEL', W - 12, by + 19);
  }

  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  /* ═══════════════════════════════════════════════════════════════════════
     DRAW — instrument cluster + charts (right canvas)
     ═══════════════════════════════════════════════════════════════════════ */
  function drawResults() {
    var f = beginFrame(resCtx, resCv), W = f.W, H = f.H, ctx = resCtx;
    ctx.fillStyle = '#0a0e16'; ctx.fillRect(0, 0, W, H);
    var clusterH = 116;
    drawCluster(ctx, W, clusterH);
    var y0 = clusterH + 8, h = H - clusterH - 16;
    var m = state.chartMode;
    if (m === 'hq') drawChartHQ(ctx, W, y0, h);
    else if (m === 'power') drawChartPower(ctx, W, y0, h);
    else if (m === 'eff') drawChartEff(ctx, W, y0, h);
    else if (m === 'combined') drawChartCombined(ctx, W, y0, h);
    else if (m === 'system') drawChartSystem(ctx, W, y0, h);
    else if (m === 'affinity') drawChartAffinity(ctx, W, y0, h);
    else if (m === 'npsh') drawChartNPSH(ctx, W, y0, h);
  }

  function ledCell(ctx, x, y, w, h, label, val, unit, color) {
    ctx.fillStyle = '#0d1117'; roundRect(ctx, x, y, w, h, 4); ctx.fill();
    ctx.strokeStyle = '#1f2a40'; ctx.lineWidth = 1; roundRect(ctx, x, y, w, h, 4); ctx.stroke();
    ctx.fillStyle = '#6b7a99'; ctx.font = '7.5px Segoe UI, sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(label, x + 6, y + 12);
    ctx.font = '8px Segoe UI, sans-serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#6b7a99';
    var uw = ctx.measureText(unit).width;
    ctx.fillText(unit, x + w - 5, y + h - 6);
    var fs = 15; ctx.font = 'bold ' + fs + 'px Courier New, monospace';
    var avail = w - 10 - uw - 4;
    while (fs > 9 && ctx.measureText(val).width > avail) { fs -= 1; ctx.font = 'bold ' + fs + 'px Courier New, monospace'; }
    ctx.fillStyle = color; ctx.textAlign = 'right';
    ctx.fillText(val, x + w - 6 - uw - 4, y + h - 6);
  }

  function drawCluster(ctx, W, h) {
    ctx.fillStyle = '#11192b'; ctx.fillRect(0, 0, W, h);
    ctx.strokeStyle = COL.accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(W, h); ctx.stroke();
    ctx.fillStyle = COL.accent; ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText('▣ INSTRUMENT CLUSTER', 12, 16);
    ctx.fillStyle = '#6b7a99'; ctx.font = '9px Courier New'; ctx.textAlign = 'right';
    ctx.fillText('PUMP TEST CONSOLE', W - 12, 16);
    var ls = liveState();
    var cells = [
      { l: 'DISCHARGE Q', v: fmt(toD(ls.Q, 'flow'), 2), u: uLabel('flow'), c: '#ffc857' },
      { l: 'TOTAL HEAD H', v: fmt(toD(ls.H, 'head'), 2), u: uLabel('head'), c: '#3ddc84' },
      { l: 'SHAFT POWER', v: fmt(toD(ls.Psh, 'power'), 2), u: uLabel('power'), c: '#ce93d8' },
      { l: 'PUMP η', v: state.running ? fmt(ls.etaP * 100, 1) : '—', u: '%', c: '#4fc3f7' },
      { l: 'DELIVERY HEAD', v: fmt(toD(ls.hd, 'head'), 2), u: uLabel('head'), c: '#42a5f5' },
      { l: 'SUCTION LIFT', v: fmt(toD(ls.hs, 'head'), 2), u: uLabel('head'), c: '#ef9a9a' },
      { l: 'INPUT POWER', v: fmt(toD(ls.Pin, 'power'), 2), u: uLabel('power'), c: '#ffd180' },
      { l: 'OVERALL η', v: state.running ? fmt(ls.etaO * 100, 1) : '—', u: '%', c: '#80cbc4' }
    ];
    var cols = 4, cw = (W - 24 - (cols - 1) * 6) / cols, ch = 38;
    for (var i = 0; i < cells.length; i++) {
      var cx = 12 + (i % cols) * (cw + 6), cy = 24 + Math.floor(i / cols) * (ch + 6);
      ledCell(ctx, cx, cy, cw, ch, cells[i].l, cells[i].v, cells[i].u, cells[i].c);
    }
  }

  /* generic axis frame; returns map functions */
  function axisFrame(ctx, W, y0, h, xMax, yMax, xLabel, yLabel, title) {
    var pad = { l: 52, r: 18, t: 22, b: 34 };
    var pw = W - pad.l - pad.r, ph = h - pad.t - pad.b;
    var x0 = pad.l, py0 = y0 + pad.t;
    ctx.fillStyle = '#80d8ff'; ctx.font = 'bold 10px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText(title, x0, y0 + 12);
    ctx.strokeStyle = '#2a3550'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, py0); ctx.lineTo(x0, py0 + ph); ctx.lineTo(x0 + pw, py0 + ph); ctx.stroke();
    function mx(v) { return x0 + v / xMax * pw; }
    function my(v) { return py0 + ph - v / yMax * ph; }
    ctx.fillStyle = '#6b7a99'; ctx.font = '8px Courier New'; ctx.textAlign = 'center';
    for (var t = 0; t <= 5; t++) { var xv = xMax * t / 5; ctx.fillText(fmt(xv, xv < 10 ? 1 : 0), mx(xv), py0 + ph + 12); }
    ctx.textAlign = 'right';
    for (var k = 0; k <= 4; k++) { var yv = yMax * k / 4; ctx.fillText(fmt(yv, yv < 10 ? 1 : 0), x0 - 5, my(yv) + 3); }
    ctx.fillStyle = '#9ba6c4'; ctx.font = '8.5px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText(xLabel, x0 + pw / 2, py0 + ph + 26);
    ctx.save(); ctx.translate(12, py0 + ph / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yLabel, 0, 0); ctx.restore();
    return { mx: mx, my: my, x0: x0, py0: py0, pw: pw, ph: ph };
  }

  /* Sample the current pump curve into [{Q,H,Pw,Psh,eta}] for live charts. */
  function sampleCurve(N, n) {
    n = n || 26; var out = [], qf = qFree(N);
    for (var i = 0; i <= n; i++) { var Q = qf * i / n; out.push({ Q: Q, H: headAt(Q, N), Pw: waterPower(Q, headAt(Q, N)), Psh: shaftPower(Math.max(0.001, Q), N), eta: etaPumpAt(Q, N) }); }
    return out;
  }
  function noteEmpty(ctx, W, y0, h, msg) {
    ctx.fillStyle = '#6b7a99'; ctx.font = '11px Segoe UI'; ctx.textAlign = 'center';
    ctx.fillText(msg, W / 2, y0 + h / 2);
  }

  function curvePts() { return state.curveData.cs.length ? state.curveData.cs : sampleCurve(state.N); }

  function drawChartHQ(ctx, W, y0, h) {
    var pts = curvePts();
    var xMax = toD(Math.max.apply(null, pts.map(function (p) { return p.Q; })) * 1.1 || 1, 'flow');
    var yMax = toD(Math.max.apply(null, pts.map(function (p) { return p.H; })) * 1.15 || 1, 'head');
    var ax = axisFrame(ctx, W, y0, h, xMax, yMax, 'Discharge Q (' + uLabel('flow') + ')', 'Head H (' + uLabel('head') + ')', 'HEAD–CAPACITY (H–Q) CURVE');
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.H, 'head'); }, '#42a5f5', true);
    markLive(ctx, ax, 'flow', 'head');
  }
  function drawChartPower(ctx, W, y0, h) {
    var pts = curvePts();
    var xMax = toD(Math.max.apply(null, pts.map(function (p) { return p.Q; })) * 1.1 || 1, 'flow');
    var yMax = toD(Math.max.apply(null, pts.map(function (p) { return p.Psh; })) * 1.2 || 1, 'power');
    var ax = axisFrame(ctx, W, y0, h, xMax, yMax, 'Discharge Q (' + uLabel('flow') + ')', 'Shaft Power (' + uLabel('power') + ')', 'SHAFT POWER vs DISCHARGE');
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.Psh, 'power'); }, '#ce93d8', true);
  }
  function drawChartEff(ctx, W, y0, h) {
    var pts = curvePts();
    var xMax = toD(Math.max.apply(null, pts.map(function (p) { return p.Q; })) * 1.1 || 1, 'flow');
    var ax = axisFrame(ctx, W, y0, h, xMax, 100, 'Discharge Q (' + uLabel('flow') + ')', 'Efficiency η (%)', 'EFFICIENCY vs DISCHARGE (BEP)');
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return p.eta * 100; }, '#4fc3f7', true);
    /* BEP marker */
    var best = pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, pts[0]);
    if (best) {
      var bx = ax.mx(toD(best.Q, 'flow')), by = ax.my(best.eta * 100);
      ctx.strokeStyle = '#3ddc84'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, ax.py0 + ax.ph); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#3ddc84'; ctx.beginPath(); ctx.arc(bx, by, 5, 0, TAU); ctx.fill();
      ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'left';
      ctx.fillText('BEP ' + fmt(best.eta * 100, 1) + '% @ ' + fmt(toD(best.Q, 'flow'), 2) + ' ' + uLabel('flow'), bx + 7, by - 5);
    }
  }
  function drawChartCombined(ctx, W, y0, h) {
    var pts = curvePts();
    var xMax = toD(Math.max.apply(null, pts.map(function (p) { return p.Q; })) * 1.1 || 1, 'flow');
    var Hmax = toD(Math.max.apply(null, pts.map(function (p) { return p.H; })) * 1.15 || 1, 'head');
    var ax = axisFrame(ctx, W, y0, h, xMax, Hmax, 'Discharge Q (' + uLabel('flow') + ')', 'Head (' + uLabel('head') + ')', 'COMBINED CHARACTERISTICS');
    var Pmax = Math.max.apply(null, pts.map(function (p) { return p.Psh; })) * 1.2 || 1;
    /* H curve (scaled to Hmax axis), P & eta scaled to same axis height */
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.H, 'head'); }, '#42a5f5', false);
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return p.Psh / Pmax * Hmax; }, '#ce93d8', false);
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return p.eta * 100 / 100 * Hmax; }, '#4fc3f7', false);
    /* legend */
    ctx.font = '8px Segoe UI'; ctx.textAlign = 'left';
    var lx = ax.x0 + 8, ly = ax.py0 + 4;
    ctx.fillStyle = '#42a5f5'; ctx.fillText('— H', lx, ly + 8);
    ctx.fillStyle = '#ce93d8'; ctx.fillText('— Power', lx + 36, ly + 8);
    ctx.fillStyle = '#4fc3f7'; ctx.fillText('— η', lx + 96, ly + 8);
  }
  function drawChartSystem(ctx, W, y0, h) {
    var sys = state.curveData.system;
    var pts = sampleCurve(state.N);
    var xMax = toD(Math.max.apply(null, pts.map(function (p) { return p.Q; })) * 1.1 || 1, 'flow');
    var yMax = toD(Math.max.apply(null, pts.map(function (p) { return p.H; })) * 1.15 || 1, 'head');
    var ax = axisFrame(ctx, W, y0, h, xMax, yMax, 'Discharge Q (' + uLabel('flow') + ')', 'Head H (' + uLabel('head') + ')', 'SYSTEM CURVE & DUTY POINT');
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.H, 'head'); }, '#42a5f5', false);
    /* system curve: H = Hstatic + k Q² */
    var stat = state.lift + 4;                 /* static head: lift + delivery static */
    var qf = qFree(state.N) || 1;
    var Hf = headAt(qf * 0.78, state.N);
    var ksys = sys ? sys.k : Math.max(0.0001, (Hf - stat) / Math.pow(qf * 0.78, 2));
    var sysPts = [];
    for (var i = 0; i <= 26; i++) { var Q = qf * i / 26; sysPts.push({ Q: Q, H: stat + ksys * Q * Q }); }
    plotLine(ctx, ax, sysPts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.H, 'head'); }, '#ffc857', false);
    /* duty point — intersection */
    var dQ = 0; for (var j = 0; j < 200; j++) { var q = qf * j / 200; if (headAt(q, state.N) <= stat + ksys * q * q) { dQ = q; break; } }
    var dH = headAt(dQ, state.N);
    var dx = ax.mx(toD(dQ, 'flow')), dy = ax.my(toD(dH, 'head'));
    ctx.fillStyle = '#3ddc84'; ctx.beginPath(); ctx.arc(dx, dy, 6, 0, TAU); ctx.fill();
    ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText('Duty: ' + fmt(toD(dQ, 'flow'), 2) + ' ' + uLabel('flow') + ' @ ' + fmt(toD(dH, 'head'), 1) + ' ' + uLabel('head'), dx + 8, dy - 4);
    ctx.font = '8px Segoe UI'; ctx.fillStyle = '#ffc857'; ctx.fillText('— system  Hₛₜ + kQ²', ax.x0 + 8, ax.py0 + 10);
    ctx.fillStyle = '#42a5f5'; ctx.fillText('— pump', ax.x0 + 8, ax.py0 + 20);
  }
  function drawChartAffinity(ctx, W, y0, h) {
    var speeds = state.curveData.family.length ? state.curveData.family.map(function (f) { return f.N; }) : [state.ratedN, state.ratedN * 0.85, state.ratedN * 0.7];
    var allQ = 0, allH = 0;
    var fam = speeds.map(function (N) { var pts = sampleCurve(N, 20); allQ = Math.max(allQ, pts[pts.length - 1].Q); allH = Math.max(allH, pts[0].H); return { N: N, pts: pts }; });
    var xMax = toD(allQ * 1.1 || 1, 'flow'), yMax = toD(allH * 1.12 || 1, 'head');
    var ax = axisFrame(ctx, W, y0, h, xMax, yMax, 'Discharge Q (' + uLabel('flow') + ')', 'Head H (' + uLabel('head') + ')', 'AFFINITY LAWS — H–Q AT SEVERAL SPEEDS');
    var cols = ['#42a5f5', '#4fc3f7', '#80d8ff', '#b3e5fc'];
    fam.forEach(function (fm, i) {
      plotLine(ctx, ax, fm.pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.H, 'head'); }, cols[i % cols.length], false);
      var p0 = fm.pts[3]; ctx.fillStyle = cols[i % cols.length]; ctx.font = '8px Segoe UI'; ctx.textAlign = 'left';
      ctx.fillText(Math.round(fm.N) + ' rpm', ax.mx(toD(p0.Q, 'flow')) + 4, ax.my(toD(p0.H, 'head')) - 2);
    });
  }
  function drawChartNPSH(ctx, W, y0, h) {
    var qf = qFree(state.N) || 1;
    var pts = []; for (var i = 0; i <= 26; i++) { var Q = qf * i / 26; pts.push({ Q: Q, npa: npshAvail(Q), npr: npshReq(Q) }); }
    var yMax = toD(Math.max(ATM_HEAD, Math.max.apply(null, pts.map(function (p) { return p.npr; }))) * 1.1, 'head');
    var xMax = toD(qf * 1.05, 'flow');
    var ax = axisFrame(ctx, W, y0, h, xMax, yMax, 'Discharge Q (' + uLabel('flow') + ')', 'NPSH (' + uLabel('head') + ')', 'NPSH AVAILABLE vs REQUIRED');
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.npa, 'head'); }, '#3ddc84', false);
    plotLine(ctx, ax, pts, function (p) { return toD(p.Q, 'flow'); }, function (p) { return toD(p.npr, 'head'); }, '#ef5350', false);
    /* cavitation onset where npa = npr */
    var cavQ = -1; for (var j = 1; j < pts.length; j++) { if (pts[j].npa <= pts[j].npr) { cavQ = pts[j].Q; break; } }
    if (cavQ > 0) { var cx = ax.mx(toD(cavQ, 'flow')); ctx.strokeStyle = '#ff8a65'; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(cx, ax.py0); ctx.lineTo(cx, ax.py0 + ax.ph); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ff8a65'; ctx.font = 'bold 8.5px Segoe UI'; ctx.textAlign = 'center'; ctx.fillText('⚠ cavitation', cx, ax.py0 + 9); }
    ctx.font = '8px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillStyle = '#3ddc84'; ctx.fillText('— NPSH available', ax.x0 + 8, ax.py0 + 10);
    ctx.fillStyle = '#ef5350'; ctx.fillText('— NPSH required', ax.x0 + 8, ax.py0 + 20);
  }

  function plotLine(ctx, ax, pts, fx, fy, color, dots) {
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath(); var st = false;
    pts.forEach(function (p) { var X = ax.mx(fx(p)), Y = ax.my(fy(p)); if (isNaN(X) || isNaN(Y)) return; if (!st) { ctx.moveTo(X, Y); st = true; } else ctx.lineTo(X, Y); });
    ctx.stroke();
    if (dots) pts.forEach(function (p, i) { if (i % 3 !== 0) return; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(ax.mx(fx(p)), ax.my(fy(p)), 2.5, 0, TAU); ctx.fill(); });
  }
  function markLive(ctx, ax, qk, hk) {
    if (!state.running) return;
    var ls = liveState();
    var x = ax.mx(toD(ls.Q, qk)), y = ax.my(toD(ls.H, hk));
    ctx.fillStyle = '#ffc857'; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,87,0.5)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, ax.py0 + ax.ph); ctx.moveTo(x, y); ctx.lineTo(ax.x0, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#ffc857'; ctx.font = 'bold 9px Segoe UI'; ctx.textAlign = 'left';
    ctx.fillText('operating point', x + 7, y - 5);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     DOM updates
     ═══════════════════════════════════════════════════════════════════════ */
  function setText(id, t) { var e = $(id); if (e) e.textContent = t; }
  function updateBadges() {
    var ls = liveState();
    setText('rb-n', state.running ? state.N : 0); setText('rb-n-u', 'rpm');
    setText('rb-q', fmt(toD(ls.Q, 'flow'), 2)); setText('rb-q-u', uLabel('flow'));
    setText('rb-h', fmt(toD(ls.H, 'head'), 1)); setText('rb-h-u', uLabel('head'));
    setText('rb-p', fmt(toD(ls.Psh, 'power'), 2)); setText('rb-p-u', uLabel('power'));
    setText('rb-eta', state.running ? fmt(ls.etaO * 100, 1) : 0);
  }
  function updateResultCards() {
    var ls = liveState();
    setText('res-q', state.running ? fmt(toD(ls.Q, 'flow'), 2) : '—'); setText('res-q-u', uLabel('flow'));
    setText('res-h', state.running ? fmt(toD(ls.H, 'head'), 2) : '—'); setText('res-h-u', uLabel('head'));
    setText('res-wp', state.running ? fmt(toD(ls.Pw, 'power'), 3) : '—'); setText('res-wp-u', uLabel('power'));
    setText('res-sp', state.running ? fmt(toD(ls.Psh, 'power'), 3) : '—'); setText('res-sp-u', uLabel('power'));
    setText('res-etap', state.running ? fmt(ls.etaP * 100, 1) : '—');
    setText('res-etao', state.running ? fmt(ls.etaO * 100, 1) : '—');
    setText('res-hd', state.running ? fmt(toD(ls.hd, 'head'), 2) : '—'); setText('res-hd-u', uLabel('head'));
    setText('res-hs', state.running ? fmt(toD(ls.hs, 'head'), 2) : '—'); setText('res-hs-u', uLabel('head'));
    setText('res-ns', fmt(specificSpeed(), 0));
    setText('res-npsh', state.running ? fmt(toD(ls.npa, 'head'), 2) : '—'); setText('res-npsh-u', uLabel('head'));
  }
  function updateLabels() {
    setText('lbl-n', 'Speed N (rpm)'); setText('val-n', state.N);
    setText('lbl-valve', 'Delivery valve (% open)'); setText('val-valve', Math.round(state.valve));
    if ($('slider-n') && document.activeElement !== $('slider-n')) $('slider-n').value = state.N;
    if ($('slider-valve') && document.activeElement !== $('slider-valve')) $('slider-valve').value = state.valve;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     LAB STEP CHIPS
     ═══════════════════════════════════════════════════════════════════════ */
  function buildLabSteps() {
    var steps = ['Select pump', 'Prime & start', 'Throttle valve / Run test', 'Read curves & report'];
    var cur = !state.running ? 0 : (state.lastTest ? 3 : (state.autoTest ? 2 : 1));
    var html = '';
    steps.forEach(function (s, i) {
      html += '<div class="lab-step ' + (i === cur ? 'active' : (i < cur ? 'done' : '')) + '"><span class="lab-step-num">' + (i + 1) + '</span>' + s + '</div>';
    });
    var el = $('lab-steps'); if (el) el.innerHTML = html;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SOUND
     ═══════════════════════════════════════════════════════════════════════ */
  function actx() { if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } return state.audioCtx; }
  function tone(freq, dur, type, vol) { var c = actx(); if (!c) return; var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || 0.05; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur); o.stop(c.currentTime + dur); }
  function playClick() { tone(760, 0.05, 'square', 0.04); }
  function playSuccess() { tone(880, 0.12, 'sine', 0.09); setTimeout(function () { tone(1180, 0.15, 'sine', 0.09); }, 110); }
  function playError() { tone(280, 0.22, 'sawtooth', 0.06); }
  function playPrime() { tone(320, 0.18, 'sine', 0.06); setTimeout(function () { tone(520, 0.2, 'sine', 0.05); }, 160); }

  /* ═══════════════════════════════════════════════════════════════════════
     CONTROLS
     ═══════════════════════════════════════════════════════════════════════ */
  function flash(msg) { state.phase = msg; }
  function startPump() { state.running = true; state.phase = 'Running'; playPrime(); buildLabSteps(); }
  function stopPump() { state.running = false; state.phase = 'Stopped'; buildLabSteps(); }

  $('btn-start').addEventListener('click', function () { if (state.running) stopPump(); else startPump(); this.querySelector('.cp-icon').innerHTML = state.running ? '&#9632;' : '&#9654;'; this.childNodes[1] && (this.lastChild.textContent = state.running ? ' Stop Pump' : ' Prime & Start'); updateAll(); });
  $('btn-reset').addEventListener('click', function () { resetRig(); playClick(); });
  function resetRig() {
    state.running = false; state.phase = 'Stopped'; state.valve = 60; state.tankLevel = 0.05;
    state.curveData = { cs: [], family: [], affinity: [], system: null, npsh: [], cavIdx: -1 };
    state.lastTest = null; state.autoTest = null;
    setReportEnabled(false);
    var b = $('btn-start'); b.querySelector('.cp-icon').innerHTML = '&#9654;'; b.lastChild.textContent = ' Prime & Start';
    updateAll();
  }
  function setReportEnabled(on) { $('btn-report').disabled = !on; $('btn-calc').disabled = !on; }

  $('slider-n').addEventListener('input', function (e) { state.N = +e.target.value; setText('val-n', state.N); updateAll(); });
  $('slider-valve').addEventListener('input', function (e) { state.valve = +e.target.value; setText('val-valve', Math.round(state.valve)); updateAll(); });

  /* preset chips */
  document.querySelectorAll('#pump-tabs .mat-pill').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#pump-tabs .mat-pill').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); state.pumpKey = b.dataset.value;
      var p = curPump(); state.imp = p.imp0; state.stages = p.stages; state.ratedN = p.n0; state.N = p.n0;
      resetRig(); playClick();
    });
  });

  /* chart tabs */
  document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); state.chartMode = b.dataset.value; playClick(); drawResults();
    });
  });

  function updateAll() { updateLabels(); updateBadges(); updateResultCards(); buildLabSteps(); drawPump(); drawResults(); }

  /* ═══════════════════════════════════════════════════════════════════════
     PUMP SETUP MODAL
     ═══════════════════════════════════════════════════════════════════════ */
  var setupDraft = { imp: 140, stages: 1, rated: 2900, lift: 3 };
  function openSetup() {
    if (state.autoTest) { flash('Cancel the running test first'); return; }
    setupDraft = { imp: state.imp, stages: state.stages, rated: state.ratedN, lift: state.lift };
    $('setup-imp').value = setupDraft.imp; $('setup-imp-num').value = setupDraft.imp;
    $('setup-stages').value = setupDraft.stages; $('setup-stages-num').value = setupDraft.stages;
    $('setup-rated').value = setupDraft.rated; $('setup-rated-num').value = setupDraft.rated;
    $('setup-lift').value = setupDraft.lift; $('setup-lift-num').value = setupDraft.lift;
    updateSetupPreview(); $('setup-modal').style.display = 'flex';
  }
  function closeSetup() { $('setup-modal').style.display = 'none'; }
  function updateSetupPreview() {
    /* preview uses draft values without committing */
    var saved = { imp: state.imp, stages: state.stages, ratedN: state.ratedN, lift: state.lift };
    state.imp = setupDraft.imp; state.stages = setupDraft.stages; state.ratedN = setupDraft.rated; state.lift = setupDraft.lift;
    var rp = ratedParams();
    setText('prev-h0', fmt(toD(rp.h0r, 'head'), 1) + ' ' + uLabel('head'));
    setText('prev-qbep', fmt(toD(rp.qbepr, 'flow'), 2) + ' ' + uLabel('flow'));
    setText('prev-hbep', fmt(toD(0.70 * rp.h0r, 'head'), 1) + ' ' + uLabel('head'));
    setText('prev-eta', fmt(rp.eta * 100, 0) + ' %');
    setText('prev-ns', fmt(specificSpeed(), 0) + ' rpm');
    setText('prev-npsh', fmt(toD(npshAvail(rp.qbepr), 'head'), 1) + ' ' + uLabel('head'));
    state.imp = saved.imp; state.stages = saved.stages; state.ratedN = saved.ratedN; state.lift = saved.lift;
  }
  function bindPair(slider, num, key, isFloat) {
    function commit(v) { var lo = +slider.min, hi = +slider.max; v = Math.max(lo, Math.min(hi, isFloat ? parseFloat(v) : Math.round(v))); if (isNaN(v)) return; setupDraft[key] = v; slider.value = v; num.value = v; updateSetupPreview(); }
    slider.addEventListener('input', function () { commit(+slider.value); });
    num.addEventListener('input', function () { if (num.value !== '') commit(+num.value); });
    num.addEventListener('blur', function () { commit(+num.value); });
  }
  bindPair($('setup-imp'), $('setup-imp-num'), 'imp', false);
  bindPair($('setup-stages'), $('setup-stages-num'), 'stages', false);
  bindPair($('setup-rated'), $('setup-rated-num'), 'rated', false);
  bindPair($('setup-lift'), $('setup-lift-num'), 'lift', true);
  $('btn-setup').addEventListener('click', function () { openSetup(); playClick(); });
  $('setup-modal-close').addEventListener('click', function () { closeSetup(); playClick(); });
  $('setup-modal-backdrop').addEventListener('click', closeSetup);
  $('setup-reset').addEventListener('click', function () {
    var p = curPump(); setupDraft = { imp: p.imp0, stages: p.stages, rated: p.n0, lift: 3 };
    $('setup-imp').value = p.imp0; $('setup-imp-num').value = p.imp0;
    $('setup-stages').value = p.stages; $('setup-stages-num').value = p.stages;
    $('setup-rated').value = p.n0; $('setup-rated-num').value = p.n0;
    $('setup-lift').value = 3; $('setup-lift-num').value = 3;
    updateSetupPreview(); playClick();
  });
  $('setup-apply').addEventListener('click', function () {
    state.imp = setupDraft.imp; state.stages = setupDraft.stages; state.ratedN = setupDraft.rated; state.lift = setupDraft.lift;
    if (state.N > 3500) state.N = 3500; state.N = Math.min(state.N, state.ratedN);
    $('slider-n').value = state.N;
    state.curveData = { cs: [], family: [], affinity: [], system: null, npsh: [], cavIdx: -1 };
    state.lastTest = null; setReportEnabled(false);
    closeSetup(); playSuccess(); updateAll();
  });

  /* ═══════════════════════════════════════════════════════════════════════
     AUTO TEST PROCEDURES
     ═══════════════════════════════════════════════════════════════════════ */
  var PROCS = [
    { id: 'cs', name: 'Constant-Speed Characteristic', std: 'IS 9137 / ISO 9906', dur: '~34 s', chart: 'hq',
      desc: 'At rated speed, throttles the delivery valve from shut-off to full flow in standard steps, recording head, discharge and power to build the H–Q, power and efficiency curves and locate the BEP.',
      out: 'H–Q · power · efficiency · BEP' },
    { id: 'combined', name: 'Combined Characteristic', std: 'Lab standard', dur: '~34 s', chart: 'combined',
      desc: 'The same constant-speed sweep presented as the classic combined chart with head, power and efficiency plotted against discharge on one set of axes.',
      out: 'H, P, η vs Q combined' },
    { id: 'affinity', name: 'Variable-Speed (Affinity)', std: 'Affinity laws', dur: '~28 s', chart: 'affinity',
      desc: 'At a fixed valve opening, varies the pump speed and demonstrates the affinity laws Q ∝ N, H ∝ N² and P ∝ N³.',
      out: 'Q∝N · H∝N² · P∝N³' },
    { id: 'family', name: 'Multi-Speed H–Q Family', std: 'Affinity scaling', dur: '~30 s', chart: 'affinity',
      desc: 'Runs the constant-speed sweep at several speeds and overlays the H–Q curves to show how the whole characteristic scales by the affinity laws.',
      out: 'H–Q family at 3 speeds' },
    { id: 'system', name: 'System Curve & Duty Point', std: 'Operating point', dur: '~26 s', chart: 'system',
      desc: 'Builds the system resistance curve (static lift + friction ∝ Q²) and finds the duty point where it meets the pump curve.',
      out: 'system curve · duty point' },
    { id: 'npsh', name: 'NPSH / Cavitation Test', std: 'Cavitation', dur: '~24 s', chart: 'npsh',
      desc: 'Increases the discharge and plots NPSH available against NPSH required, flagging the onset of cavitation when the suction margin is lost.',
      out: 'NPSHa vs NPSHr · cavitation' }
  ];
  function buildProcGrid() {
    var html = '';
    PROCS.forEach(function (p) {
      html += '<div class="proc-card"><div class="proc-card-head"><span class="proc-card-title">' + p.name + '</span>' +
        '<span class="proc-card-std">' + p.std + ' · ' + p.dur + '</span></div>' +
        '<p class="proc-card-desc">' + p.desc + '</p>' +
        '<div class="proc-card-out">' + p.out + '</div>' +
        '<button class="proc-card-run" data-proc="' + p.id + '">▶ Run Test</button></div>';
    });
    var g = $('auto-modal-grid'); if (g) g.innerHTML = html;
    g.querySelectorAll('.proc-card-run').forEach(function (b) { b.addEventListener('click', function () { startProc(b.dataset.proc); }); });
  }
  function openAuto() {
    if (!state.running) { flash('Prime & start the pump first'); playError(); return; }
    if (state.autoTest) return;
    $('auto-modal').style.display = 'flex';
  }
  function closeAuto() { $('auto-modal').style.display = 'none'; }
  $('btn-auto').addEventListener('click', function () { openAuto(); playClick(); });
  $('auto-modal-close').addEventListener('click', function () { closeAuto(); playClick(); });
  $('auto-modal-backdrop').addEventListener('click', closeAuto);

  function startProc(id) {
    var proc = PROCS.filter(function (p) { return p.id === id; })[0]; if (!proc) return;
    closeAuto();
    state.curveData = { cs: [], family: [], affinity: [], system: null, npsh: [], cavIdx: -1 };
    state.chartMode = proc.chart;
    document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (x) { x.classList.toggle('active', x.dataset.value === proc.chart); });
    var steps = buildProcSteps(id);
    state.autoTest = { procId: id, procName: proc.name, std: proc.std, steps: steps, stepIdx: 0, stepStart: Date.now() };
    state.phase = 'Auto-test'; setReportEnabled(false);
    startAutoTicker();
  }
  function buildProcSteps(id) {
    var steps = [];
    if (id === 'cs' || id === 'combined') {
      [0, 10, 20, 30, 40, 50, 65, 80, 100].forEach(function (v) { steps.push({ label: 'Valve ' + (100 - v) + '% → throttle', valve: 100 - v, kind: 'cs' }); });
    } else if (id === 'affinity') {
      [100, 90, 80, 70, 60].forEach(function (pc) { steps.push({ label: 'Speed ' + Math.round(state.ratedN * pc / 100) + ' rpm', N: state.ratedN * pc / 100, valve: 80, kind: 'aff' }); });
    } else if (id === 'family') {
      [100, 85, 70].forEach(function (pc) { steps.push({ label: 'Sweep @ ' + Math.round(state.ratedN * pc / 100) + ' rpm', N: state.ratedN * pc / 100, kind: 'fam' }); });
    } else if (id === 'system') {
      [10, 20, 35, 50, 65, 80, 100].forEach(function (v) { steps.push({ label: 'Build system point ' + v + '%', valve: v, kind: 'sys' }); });
    } else if (id === 'npsh') {
      [20, 35, 50, 65, 80, 90, 100].forEach(function (v) { steps.push({ label: 'Lift discharge to ' + v + '%', valve: v, kind: 'npsh' }); });
    }
    return steps;
  }
  function startAutoTicker() { if (state._ticker) clearInterval(state._ticker); state.autoTest.stepStart = Date.now(); state._ticker = setInterval(tickAuto, 90); }
  function stopAutoTicker() { if (state._ticker) { clearInterval(state._ticker); state._ticker = null; } }
  function tickAuto() {
    var at = state.autoTest; if (!at) { stopAutoTicker(); return; }
    var step = at.steps[at.stepIdx];
    var elapsed = Date.now() - at.stepStart;
    var dwell = 950;
    if (step.valve != null) state.valve = step.valve + (state.valve - step.valve) * Math.max(0, 1 - elapsed / dwell); /* ease */
    if (step.N != null) state.N = step.N;
    if (elapsed >= dwell) {
      /* record */
      if (step.valve != null) state.valve = step.valve;
      recordAuto(step);
      at.stepIdx++; at.stepStart = Date.now();
      if (at.stepIdx >= at.steps.length) finishAuto();
    }
    updateAll();
  }
  function recordAuto(step) {
    var N = step.N != null ? step.N : state.N;
    var Q = liveQ(); var H = headAt(Q, N);
    var rec = { Q: Q, H: H, Pw: waterPower(Q, H), Psh: shaftPower(Math.max(0.001, Q), N), eta: etaPumpAt(Q, N), etaO: etaPumpAt(Q, N) * MOTOR_ETA, N: N, valve: state.valve, npa: npshAvail(Q), npr: npshReq(Q) };
    if (step.kind === 'cs' || step.kind === 'sys') state.curveData.cs.push(rec);
    if (step.kind === 'aff') state.curveData.affinity.push(rec);
    if (step.kind === 'fam') { /* sample whole curve at this speed */ state.curveData.family.push({ N: N, pts: sampleCurve(N, 20) }); }
    if (step.kind === 'npsh') state.curveData.npsh.push(rec);
  }
  function finishAuto() {
    var at = state.autoTest;
    stopAutoTicker();
    /* system curve params */
    if (at.procId === 'system') {
      var qf = qFree(state.N) || 1; var stat = state.lift + 4; var Hf = headAt(qf * 0.78, state.N);
      state.curveData.system = { stat: stat, k: Math.max(0.0001, (Hf - stat) / Math.pow(qf * 0.78, 2)) };
    }
    state.lastTest = { procId: at.procId, procName: at.procName, std: at.std, finishedAt: new Date() };
    state.autoTest = null; state.valve = 60; if ($('slider-valve')) $('slider-valve').value = 60;
    state.phase = 'Test complete'; setReportEnabled(true);
    playSuccess(); buildLabSteps(); updateAll();
  }

  /* ═══════════════════════════════════════════════════════════════════════
     SHOW CALCULATIONS
     ═══════════════════════════════════════════════════════════════════════ */
  function openCalc() {
    if (!state.lastTest) return;
    $('calc-modal-body').innerHTML = buildCalc();
    $('calc-modal').classList.add('active');
  }
  function closeCalc() { $('calc-modal').classList.remove('active'); }
  $('btn-calc').addEventListener('click', function () { openCalc(); playClick(); });
  $('calc-modal-close').addEventListener('click', function () { closeCalc(); playClick(); });
  $('calc-modal').addEventListener('click', function (e) { if (e.target === $('calc-modal')) closeCalc(); });
  function calcStep(n, title, eq, res) {
    var h = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + n + '</span><span class="cs-title">' + title + '</span></div>';
    if (eq) h += '<div class="cs-formula">' + eq + '</div>';
    if (res != null) h += '<div class="cs-result">→ <strong>' + res + '</strong></div>';
    return h + '</div>';
  }
  function buildCalc() {
    var lt = state.lastTest; var rp = ratedParams();
    var pts = state.curveData.cs.length ? state.curveData.cs : sampleCurve(state.N);
    var best = pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, pts[0]);
    var uH = uLabel('head'), uQ = uLabel('flow'), uP = uLabel('power');
    var html = '<div class="cs-intro"><strong>' + lt.procName + '</strong> — ' + lt.std + '. Pump: ' + curPump().name +
      ', impeller ⌀' + fmt(toD(state.imp, 'len'), isImp() ? 2 : 0) + ' ' + uLabel('len') + ', ' + state.stages + '-stage, rated ' + state.ratedN + ' rpm. Values in the active unit system (' + (isImp() ? 'US' : 'SI') + ').</div>';
    html += calcStep(1, 'Total head from gauges', '\\( H = \\dfrac{p_d - p_s}{\\rho g} + \\dfrac{v_d^2 - v_s^2}{2g} + z \\)',
      'at BEP H = ' + fmt(toD(best.H, 'head'), 2) + ' ' + uH);
    html += calcStep(2, 'Water (output) power', '\\( P_o = \\rho\\, g\\, Q\\, H \\)',
      fmt(toD(best.Pw, 'power'), 3) + ' ' + uP + ' at Q = ' + fmt(toD(best.Q, 'flow'), 2) + ' ' + uQ);
    html += calcStep(3, 'Shaft power & pump efficiency', '\\( \\eta_{pump} = \\dfrac{P_o}{P_{shaft}} \\)',
      fmt(best.eta * 100, 1) + ' % (P_shaft = ' + fmt(toD(best.Psh, 'power'), 3) + ' ' + uP + ')');
    html += calcStep(4, 'Overall efficiency', '\\( \\eta_o = \\eta_{pump}\\times\\eta_{motor} \\)',
      fmt(best.eta * MOTOR_ETA * 100, 1) + ' %');
    html += calcStep(5, 'Best efficiency point (BEP)', '\\( \\eta = \\eta_{max}(2r - r^2),\\; r = Q/Q_{bep} \\)',
      'BEP at Q = ' + fmt(toD(best.Q, 'flow'), 2) + ' ' + uQ + ', H = ' + fmt(toD(best.H, 'head'), 1) + ' ' + uH + ', η = ' + fmt(best.eta * 100, 1) + ' %');
    html += calcStep(6, 'Specific speed', '\\( N_s = \\dfrac{N\\sqrt{Q}}{H^{3/4}} \\)', fmt(specificSpeed(), 0) + ' rpm');
    if (lt.procId === 'affinity') html += calcStep(7, 'Affinity laws', '\\( \\dfrac{Q_2}{Q_1}=\\dfrac{N_2}{N_1},\\; \\dfrac{H_2}{H_1}=\\Big(\\dfrac{N_2}{N_1}\\Big)^2,\\; \\dfrac{P_2}{P_1}=\\Big(\\dfrac{N_2}{N_1}\\Big)^3 \\)', 'verified across the speed sweep');
    if (lt.procId === 'npsh') html += calcStep(7, 'NPSH available', '\\( NPSH_a = \\dfrac{p_{atm}-p_v}{\\rho g} - h_{lift} - h_f \\)', fmt(toD(npshAvail(rp.qbepr), 'head'), 2) + ' ' + uH + ' at BEP');
    return html;
  }

  /* ═══════════════════════════════════════════════════════════════════════
     EXPORTS — CSV, PNG, PDF report
     ═══════════════════════════════════════════════════════════════════════ */
  $('btn-csv').addEventListener('click', function () {
    var pts = state.curveData.cs.length ? state.curveData.cs : (state.curveData.affinity.length ? state.curveData.affinity : state.curveData.npsh);
    if (!pts || !pts.length) { flash('Run a test first'); playError(); return; }
    var uH = uLabel('head'), uQ = uLabel('flow'), uP = uLabel('power');
    var rows = ['Point,Speed (rpm),Discharge (' + uQ + '),Head (' + uH + '),Water Power (' + uP + '),Shaft Power (' + uP + '),Pump Eff (%),Overall Eff (%),NPSHa (' + uH + ')'];
    pts.forEach(function (r, i) {
      rows.push([i + 1, Math.round(r.N), fmt(toD(r.Q, 'flow'), 3), fmt(toD(r.H, 'head'), 2), fmt(toD(r.Pw, 'power'), 3), fmt(toD(r.Psh, 'power'), 3), fmt(r.eta * 100, 1), fmt(r.eta * MOTOR_ETA * 100, 1), fmt(toD(r.npa != null ? r.npa : npshAvail(r.Q), 'head'), 2)].join(','));
    });
    rows.push(''); rows.push('Pump,' + curPump().name); rows.push('Impeller (mm),' + state.imp); rows.push('Stages,' + state.stages);
    rows.push('Rated speed (rpm),' + state.ratedN); rows.push('Specific speed,' + fmt(specificSpeed(), 0));
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pump_test_' + state.pumpKey + '.csv'; a.click(); playClick();
  });
  $('btn-png').addEventListener('click', function () {
    var tmp = document.createElement('canvas'); tmp.width = resCv.width; tmp.height = resCv.height;
    var tc = tmp.getContext('2d'); tc.drawImage(resCv, 0, 0);
    var fs = Math.max(10, Math.round(tmp.width * 0.02)); tc.font = '600 ' + fs + 'px Segoe UI, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom'; tc.fillStyle = 'rgba(255,255,255,0.3)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'pump_characteristics.png'; a.click(); playClick();
  });

  $('btn-report').addEventListener('click', function () { exportReport(); playClick(); });
  function exportReport() {
    if (!state.lastTest) { flash('Run a test first'); return; }
    var lt = state.lastTest, p = curPump();
    var now = lt.finishedAt || new Date();
    var dateStr = now.toISOString().slice(0, 10), timeStr = now.toTimeString().slice(0, 5);
    var reportNo = 'CPT-' + dateStr.replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);
    var uH = uLabel('head'), uQ = uLabel('flow'), uP = uLabel('power');
    var pts = state.curveData.cs.length ? state.curveData.cs : sampleCurve(state.N);
    var best = pts.reduce(function (a, b) { return b.eta > a.eta ? b : a; }, pts[0]);
    var rows = '<tr><th>Pt</th><th>Q (' + uQ + ')</th><th>H (' + uH + ')</th><th>P&#8338; (' + uP + ')</th><th>P&#8347;&#8341; (' + uP + ')</th><th>&eta;&#8345; (%)</th></tr>';
    pts.forEach(function (r, i) { rows += '<tr><td>' + (i + 1) + '</td><td>' + fmt(toD(r.Q, 'flow'), 2) + '</td><td>' + fmt(toD(r.H, 'head'), 1) + '</td><td>' + fmt(toD(r.Pw, 'power'), 3) + '</td><td>' + fmt(toD(r.Psh, 'power'), 3) + '</td><td>' + fmt(r.eta * 100, 1) + '</td></tr>'; });
    var chart = buildReportChart(pts);
    var css = '@page{size:A4;margin:14mm 16mm;}*{box-sizing:border-box;}body{font-family:"Segoe UI",Arial,sans-serif;color:#111;margin:0;font-size:10.5pt;line-height:1.45;}' +
      '.hd{display:flex;justify-content:space-between;border-bottom:3px solid #0277bd;padding-bottom:10px;margin-bottom:14px;}.hd h1{margin:0;font-size:17pt;color:#01579b;}.hd .sub{font-size:9.5pt;color:#444;}' +
      '.hd-r{text-align:right;font-size:9pt;}.rno{font-weight:700;color:#0277bd;font-size:11pt;}h2{font-size:11pt;color:#01579b;border-bottom:1px solid #b0bec5;padding-bottom:2px;margin:16px 0 6px;text-transform:uppercase;letter-spacing:.4px;}' +
      'table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-bottom:6px;}th,td{border-bottom:1px solid #e0e6ed;padding:4px 8px;text-align:center;}th{background:#e1f5fe;color:#37474f;}' +
      '.two-col{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:6px 0;}.kpi{border:1px solid #cfd8dc;border-radius:4px;padding:8px;background:#f1f8fd;}.kpi .l{font-size:8pt;color:#546e7a;text-transform:uppercase;}.kpi .v{font-size:13pt;font-weight:700;color:#01579b;}' +
      '.curve{border:1px solid #cfd8dc;padding:6px;margin-top:8px;}.curve img{width:100%;display:block;}.verdict{margin-top:10px;padding:10px 14px;border-left:4px solid #0277bd;background:#e1f5fe;}.sign{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-top:22px;}.sb{border-top:1px solid #455a64;padding-top:4px;font-size:9pt;}.foot{margin-top:16px;border-top:1px solid #b0bec5;padding-top:8px;font-size:8.5pt;color:#546e7a;display:flex;justify-content:space-between;}' +
      '.bar{background:#0277bd;color:#fff;padding:12px 16px;text-align:center;}.bar button{background:#fff;color:#0277bd;border:0;padding:7px 16px;font-weight:700;border-radius:4px;margin:0 6px;cursor:pointer;}@media print{.no-print{display:none!important;}}';
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Pump Test Report ' + reportNo + '</title><style>' + css + '</style></head><body>' +
      '<div class="bar no-print">Use your browser&rsquo;s print dialog (Ctrl/Cmd+P) to <b>Save as PDF</b>. <button onclick="window.print()">Print / Save PDF</button><button onclick="window.close()">Close</button></div>' +
      '<div class="hd"><div><h1>Centrifugal Pump Performance Test Report</h1><div class="sub">' + lt.procName + ' &mdash; ' + lt.std + '</div></div>' +
      '<div class="hd-r"><div class="rno">Report No. ' + reportNo + '</div><div>Date: ' + dateStr + '</div><div>Time: ' + timeStr + '</div><div>Lab: NHIT VisualLab Virtual Pump Rig</div></div></div>' +
      '<h2>1. Pump Specification</h2><div class="two-col"><table><tr><th>Pump</th><td>' + p.name + '</td></tr><tr><th>Impeller dia</th><td>' + fmt(toD(state.imp, 'len'), isImp() ? 2 : 0) + ' ' + uLabel('len') + '</td></tr><tr><th>Stages</th><td>' + state.stages + '</td></tr></table>' +
      '<table><tr><th>Rated speed</th><td>' + state.ratedN + ' rpm</td></tr><tr><th>Static suction lift</th><td>' + fmt(toD(state.lift, 'head'), 1) + ' ' + uH + '</td></tr><tr><th>Specific speed N&#8347;</th><td>' + fmt(specificSpeed(), 0) + '</td></tr></table></div>' +
      '<h2>2. Best Efficiency Point</h2><div class="kpis">' +
      '<div class="kpi"><div class="l">BEP discharge</div><div class="v">' + fmt(toD(best.Q, 'flow'), 2) + ' ' + uQ + '</div></div>' +
      '<div class="kpi"><div class="l">BEP head</div><div class="v">' + fmt(toD(best.H, 'head'), 1) + ' ' + uH + '</div></div>' +
      '<div class="kpi"><div class="l">Pump efficiency</div><div class="v">' + fmt(best.eta * 100, 1) + ' %</div></div>' +
      '<div class="kpi"><div class="l">Shaft power</div><div class="v">' + fmt(toD(best.Psh, 'power'), 2) + ' ' + uP + '</div></div></div>' +
      '<h2>3. Test Readings</h2><table>' + rows + '</table>' +
      '<h2>4. Characteristic Curves</h2><div class="curve"><img src="' + chart + '" alt="characteristic curves"></div>' +
      '<div class="verdict"><b>Conclusion:</b> The pump develops a shut-off head of ' + fmt(toD(pts[0].H, 'head'), 1) + ' ' + uH + ' and reaches its best efficiency of ' + fmt(best.eta * 100, 1) + ' % at ' + fmt(toD(best.Q, 'flow'), 2) + ' ' + uQ + ' (' + fmt(toD(best.H, 'head'), 1) + ' ' + uH + '). Operate near this duty for lowest energy cost and least wear.</div>' +
      '<div class="sign"><div class="sb">Tested by ___________________________</div><div class="sb">Reviewed by ___________________________</div></div>' +
      '<div class="foot"><div>Generated by NHIT VisualLab Virtual Pump Test Rig &middot; NHIT VisualLab</div><div>Ref: IS 9137, ISO 9906</div></div>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},400);});</' + 'script></body></html>';
    var win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) { flash('Pop-up blocked'); return; }
    win.document.open(); win.document.write(html); win.document.close();
  }
  function buildReportChart(pts) {
    var W = 1000, H = 460, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    var pad = { l: 70, r: 70, t: 30, b: 55 }, pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    var qMax = toD(pts[pts.length - 1].Q, 'flow') || 1, hMax = toD(pts[0].H, 'head') * 1.15 || 1;
    var pMax = Math.max.apply(null, pts.map(function (p) { return p.Psh; })) * 1.2 || 1;
    x.strokeStyle = '#90a4ae'; x.lineWidth = 1; x.beginPath(); x.moveTo(pad.l, pad.t); x.lineTo(pad.l, pad.t + ph); x.lineTo(pad.l + pw, pad.t + ph); x.stroke();
    function mx(v) { return pad.l + v / qMax * pw; } function myH(v) { return pad.t + ph - v / hMax * ph; }
    x.fillStyle = '#546e7a'; x.font = '12px Courier New'; x.textAlign = 'center';
    for (var t = 0; t <= 5; t++) { var q = qMax * t / 5; x.fillText(q.toFixed(1), mx(q), pad.t + ph + 18); }
    x.textAlign = 'right'; for (var k = 0; k <= 4; k++) { var hv = hMax * k / 4; x.fillText(hv.toFixed(0), pad.l - 6, myH(hv) + 4); }
    x.fillStyle = '#01579b'; x.font = 'bold 13px Segoe UI'; x.textAlign = 'center';
    x.fillText('Discharge Q (' + uLabel('flow') + ')', pad.l + pw / 2, pad.t + ph + 42);
    function line(fy, col) { x.strokeStyle = col; x.lineWidth = 2.5; x.beginPath(); pts.forEach(function (p, i) { var X = mx(toD(p.Q, 'flow')), Y = fy(p); if (i === 0) x.moveTo(X, Y); else x.lineTo(X, Y); }); x.stroke(); pts.forEach(function (p) { x.fillStyle = col; x.beginPath(); x.arc(mx(toD(p.Q, 'flow')), fy(p), 3, 0, TAU); x.fill(); }); }
    line(function (p) { return myH(toD(p.H, 'head')); }, '#1565c0');
    line(function (p) { return pad.t + ph - p.Psh / pMax * ph; }, '#8e24aa');
    line(function (p) { return pad.t + ph - p.eta * ph; }, '#0097a7'); /* η as fraction of plot height (0..1) */
    x.font = '12px Segoe UI'; x.textAlign = 'left';
    x.fillStyle = '#1565c0'; x.fillText('— Head', pad.l + 8, pad.t + 14);
    x.fillStyle = '#8e24aa'; x.fillText('— Shaft power', pad.l + 70, pad.t + 14);
    x.fillStyle = '#0097a7'; x.fillText('— Efficiency', pad.l + 180, pad.t + 14);
    x.fillStyle = 'rgba(2,119,189,0.4)'; x.font = '600 16px Segoe UI'; x.textAlign = 'right'; x.textBaseline = 'bottom';
    x.fillText('NHIT VisualLab', W - 10, H - 8);
    return c.toDataURL('image/png');
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CONTEXT MENU
     ═══════════════════════════════════════════════════════════════════════ */
  pumpCv.addEventListener('contextmenu', function (e) {
    e.preventDefault(); var menu = $('ctx-menu'); var rect = pumpCv.parentElement.getBoundingClientRect();
    menu.style.left = (e.clientX - rect.left) + 'px'; menu.style.top = (e.clientY - rect.top) + 'px'; menu.style.display = 'block';
  });
  document.addEventListener('click', function () { $('ctx-menu').style.display = 'none'; });
  $('ctx-menu').addEventListener('click', function (e) {
    var a = e.target.dataset.action;
    if (a === 'save-img') { pumpCv.toBlob(function (b) { var u = URL.createObjectURL(b); var l = document.createElement('a'); l.href = u; l.download = 'pump_rig.png'; l.click(); }); }
    else if (a === 'copy-data') { var ls = liveState(); navigator.clipboard && navigator.clipboard.writeText('Pump ' + curPump().name + ' | N=' + state.N + ' rpm | Q=' + fmt(toD(ls.Q, 'flow'), 2) + ' ' + uLabel('flow') + ' | H=' + fmt(toD(ls.H, 'head'), 2) + ' ' + uLabel('head') + ' | eta=' + fmt(ls.etaO * 100, 1) + '%'); }
    else if (a === 'reset') resetRig();
  });

  /* ═══════════════════════════════════════════════════════════════════════
     UNIT TOGGLE & MODE SWITCHING
     ═══════════════════════════════════════════════════════════════════════ */
  document.querySelectorAll('#unit-toggle .pill').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#unit-toggle .pill').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active'); b.setAttribute('aria-pressed', 'true'); state.units = b.dataset.value;
      playClick(); updateAll();
      if (state.mode === 'explore') renderExplore(); if (state.mode === 'practice') { /* keep */ }
    });
  });
  var WRAPS = { simulate: 'sim-wrapper', explore: 'explore-wrapper', practice: 'practice-wrapper', quiz: 'quiz-wrapper' };
  document.querySelectorAll('#mode-tabs .pill').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('#mode-tabs .pill').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active'); state.mode = b.dataset.value;
      Object.keys(WRAPS).forEach(function (k) { var el = $(WRAPS[k]); if (el) el.style.display = (k === state.mode) ? '' : 'none'; });
      playClick();
      if (state.mode === 'explore') renderExplore();
      if (state.mode === 'practice') newPractice();
      if (state.mode === 'quiz') resetQuiz();
    });
  });

  /* ═══════════════════════════════════════════════════════════════════════
     EXPLORE
     ═══════════════════════════════════════════════════════════════════════ */
  var EXPLORE = {
    basics: [
      { title: 'What a centrifugal pump does', body: 'A rotating impeller adds energy to the liquid: the eye draws fluid in axially, the vanes fling it outward by centrifugal action, and the volute casing converts that velocity into pressure (head). It is a rotodynamic machine — continuous, not positive-displacement.', note: 'Head is energy per unit weight, expressed in metres of the liquid pumped.' },
      { title: 'Parts of the test rig', body: 'Sump → foot valve & strainer → suction pipe → impeller eye → volute → delivery pipe → gate (delivery) valve → collecting tank. A vacuum gauge reads the suction side, a pressure gauge the delivery side, and an energy meter the motor input.', note: 'The pump must be primed (filled) before starting — it cannot pump air.' },
      { title: 'Why throttle the delivery valve?', body: 'Closing the valve adds system resistance, raising the head and reducing the discharge; opening it lowers the head and increases the flow. Stepping the valve from shut-off to full flow traces the whole characteristic curve at constant speed.', note: 'Never throttle the suction valve — it lowers NPSH and invites cavitation.' }
    ],
    procedure: [
      { title: 'Constant-speed test', body: 'Prime and start the pump at rated speed. Fully close the delivery valve and record the shut-off head. Open the valve in steps, and at each steady step record the suction & delivery gauges (head), the discharge (by the collecting-tank rise / time), and the motor input power.', note: 'Allow the readings to stabilise before recording each point.' },
      { title: 'Measuring discharge', body: 'Q is found from the collecting tank: time the rise of a known volume, Q = volume / time. Alternatively a venturi/orifice meter or a calibrated weir is used. The rig reports Q directly in L/s (or gpm).', note: '1 L/s = 3.6 m³/h = 15.85 US gpm.' },
      { title: 'Computing the results', body: 'Total head H from the gauges; water power Pₒ = ρgQH; pump efficiency ηₚ = Pₒ/P_shaft; overall efficiency ηₒ = Pₒ/P_input. Plot H, P and η against Q to get the characteristic curves and the BEP.', note: 'Report the BEP head, flow and efficiency — the pump is rated there.' }
    ],
    formulas: [
      { title: 'Total head', body: 'From the gauges plus datum and velocity head.', formula: 'H = (p_d − p_s)/ρg + (v_d² − v_s²)/2g + z', note: 'Suction reads vacuum (negative gauge) for a lift installation.' },
      { title: 'Water power & efficiency', body: 'Output power to the fluid and the efficiency chain.', formula: 'Pₒ = ρgQH ;  ηₚ = Pₒ/P_shaft ;  ηₒ = ηₚ·η_motor', note: 'Example: Q=5 L/s, H=24 m → Pₒ=1.18 kW; if P_shaft=1.85 kW, ηₚ=63.7 %.' },
      { title: 'Specific speed', body: 'Classifies the impeller and lets pumps be compared.', formula: 'Nₛ = N√Q / H^(3/4)  (at BEP, per stage)', note: 'Low Nₛ → radial (high head); high Nₛ → axial (high flow).' }
    ],
    characteristics: [
      { title: 'Head-capacity (H–Q) curve', body: 'Head falls as discharge rises, from the shut-off head at Q = 0 to zero head at free delivery. A steep curve gives nearly constant flow as head varies; a flat curve gives nearly constant head as flow varies.', note: 'The operating point is fixed by where this curve meets the system curve.' },
      { title: 'Power & efficiency curves', body: 'Shaft power rises with discharge from a finite shut-off value. Efficiency rises to a peak at the BEP then falls — zero at shut-off (no flow work) and zero at free delivery (no head).', note: 'Run within roughly 70–120 % of BEP flow for good efficiency and low vibration.' },
      { title: 'Combined characteristics', body: 'Plotting H, P and η against Q on one chart is the standard way to present a pump test. The BEP is read where the efficiency curve peaks; the corresponding H and Q define the rated duty.', note: 'Manufacturers publish these curves for each impeller trim and speed.' }
    ],
    affinity: [
      { title: 'The affinity laws', body: 'For a fixed impeller, performance scales with speed: discharge with N, head with N², power with N³. So a 10 % speed cut gives 10 % less flow, 19 % less head and 27 % less power — the basis of energy-saving variable-speed drives.', formula: 'Q∝N ;  H∝N² ;  P∝N³', note: 'Efficiency stays roughly constant along homologous (corresponding) points.' },
      { title: 'Impeller diameter scaling', body: 'Trimming the impeller diameter D acts like the speed laws: Q∝D, H∝D², P∝D³ (approximately, for modest trims). It is how a pump is matched to a duty without changing the motor.', note: 'Large trims depart from the simple cube law because efficiency drops.' },
      { title: 'Why the H–Q curve scales cleanly', body: 'Writing the curve as H = s²H₀ − kQ² (s = N/N_rated), the resistance term kQ² is speed-independent, so every point moves along a parabola through the origin — exactly the affinity family shown in the Affinity chart.', note: 'This is why one measured curve predicts all speeds.' }
    ],
    cavitation: [
      { title: 'What cavitation is', body: 'If the pressure at the impeller eye falls to the liquid’s vapour pressure, vapour bubbles form and then collapse violently as pressure recovers, eroding the impeller, making a gravelly noise and dropping head and efficiency sharply.', note: 'A 3 % head drop is the standard definition of cavitation onset for NPSHr.' },
      { title: 'NPSH available vs required', body: 'NPSH available is the suction-side margin above vapour pressure; NPSH required is what the pump needs and rises with Q². Cavitation occurs when NPSHa < NPSHr.', formula: 'NPSHₐ = (p_atm − p_v)/ρg − h_lift − h_f', note: 'Keep a margin of ~0.5–1 m (or 10 %) of NPSHa over NPSHr.' },
      { title: 'Avoiding cavitation', body: 'Lower the static suction lift, shorten/enlarge the suction pipe (less friction), reduce the flow, or lower the liquid temperature (lower vapour pressure). Raising the suction lift in Pump Setup pushes NPSHa down toward NPSHr.', note: 'Submersible and flooded-suction installations have high NPSHa by design.' }
    ]
  };
  function renderMath(el) {
    try { if (window.renderMathInElement) window.renderMathInElement(el, { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }] }); } catch (e) { }
  }
  function renderExplore() {
    var cat = document.querySelector('#cat-tabs .pill.active').dataset.value;
    var cards = EXPLORE[cat] || [];
    var host = $('explore-cards'); host.innerHTML = '';
    cards.forEach(function (c) {
      var div = document.createElement('div'); div.className = 'explore-card';
      var html = '<div class="explore-card-title">' + c.title + '</div><div class="explore-card-body">' + c.body + '</div>';
      if (c.formula) html += '<code class="explore-card-formula">' + c.formula + '</code>';
      if (c.note) html += '<div class="explore-card-note">💡 ' + c.note + '</div>';
      div.innerHTML = html; host.appendChild(div);
    });
    renderMath(host);
  }
  document.querySelectorAll('#cat-tabs .pill').forEach(function (b) {
    b.addEventListener('click', function () { document.querySelectorAll('#cat-tabs .pill').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); renderExplore(); playClick(); });
  });

  /* ═══════════════════════════════════════════════════════════════════════
     PRACTICE
     ═══════════════════════════════════════════════════════════════════════ */
  var pState = { correct: 0, total: 0, ans: 0, unit: '', sol: '' };
  function rnd(a, b, d) { var v = a + Math.random() * (b - a); return d != null ? +v.toFixed(d) : v; }
  function newPractice() {
    var t = Math.floor(Math.random() * 5);
    var q = '', ans = 0, unit = '', sol = '';
    if (t === 0) { /* water power */
      var Q = rnd(2, 12, 1), Hh = rnd(15, 45, 0);
      q = 'A pump delivers Q = ' + Q + ' L/s against a total head of H = ' + Hh + ' m. Calculate the water (output) power in kW.';
      ans = RHO * G * (Q / 1000) * Hh / 1000; unit = 'kW';
      sol = 'Pₒ = ρgQH = 1000 × 9.81 × ' + (Q / 1000).toFixed(3) + ' × ' + Hh + ' = ' + ans.toFixed(2) + ' kW';
    } else if (t === 1) { /* pump efficiency */
      var Qx = rnd(3, 10, 1), Hx = rnd(20, 40, 0), Psh = rnd(2, 6, 2);
      var Pw = RHO * G * (Qx / 1000) * Hx / 1000;
      q = 'A pump delivers Q = ' + Qx + ' L/s at H = ' + Hx + ' m and draws a shaft power of ' + Psh + ' kW. Find the pump efficiency (%).';
      ans = Pw / Psh * 100; unit = '%';
      sol = 'Pₒ = ρgQH = ' + Pw.toFixed(2) + ' kW; ηₚ = Pₒ/P_shaft = ' + Pw.toFixed(2) + '/' + Psh + ' = ' + ans.toFixed(1) + ' %';
    } else if (t === 2) { /* affinity flow */
      var N1 = 1450, N2 = rnd(2000, 2900, 0), Q1 = rnd(3, 8, 1);
      q = 'At ' + N1 + ' rpm a pump delivers ' + Q1 + ' L/s. Using the affinity laws, what discharge does it give at ' + N2 + ' rpm?';
      ans = Q1 * N2 / N1; unit = 'L/s';
      sol = 'Q₂ = Q₁×(N₂/N₁) = ' + Q1 + '×(' + N2 + '/' + N1 + ') = ' + ans.toFixed(2) + ' L/s';
    } else if (t === 3) { /* affinity head */
      var Na = 1450, Nb = rnd(2000, 2900, 0), H1 = rnd(15, 35, 0);
      q = 'At ' + Na + ' rpm the head is ' + H1 + ' m. By the affinity laws, what head is developed at ' + Nb + ' rpm?';
      ans = H1 * (Nb / Na) * (Nb / Na); unit = 'm';
      sol = 'H₂ = H₁×(N₂/N₁)² = ' + H1 + '×(' + Nb + '/' + Na + ')² = ' + ans.toFixed(1) + ' m';
    } else { /* NPSH available */
      var lift = rnd(2, 6, 1), hf = rnd(0.3, 1.5, 1);
      q = 'Atmospheric head = 10.3 m, vapour-pressure head = 0.24 m. For a suction lift of ' + lift + ' m and suction friction of ' + hf + ' m, find the NPSH available (m).';
      ans = 10.3 - 0.24 - lift - hf; unit = 'm';
      sol = 'NPSHₐ = 10.3 − 0.24 − ' + lift + ' − ' + hf + ' = ' + ans.toFixed(2) + ' m';
    }
    pState.ans = ans; pState.unit = unit; pState.sol = sol;
    $('pp-prompt').textContent = q; $('pp-unit').textContent = unit; $('pp-input').value = '';
    $('prac-feedback').textContent = ''; $('prac-feedback').className = 'feedback'; $('solution-panel').style.display = 'none';
  }
  $('btn-check').addEventListener('click', function () {
    var v = parseFloat($('pp-input').value); if (isNaN(v)) return;
    pState.total++;
    var tol = Math.max(0.02 * Math.abs(pState.ans), 0.05);
    var fb = $('prac-feedback');
    if (Math.abs(v - pState.ans) <= tol) { pState.correct++; fb.textContent = '✓ Correct! Answer ≈ ' + pState.ans.toFixed(2) + ' ' + pState.unit; fb.className = 'feedback ok'; playSuccess(); }
    else { fb.textContent = '✗ Not quite. Correct answer ≈ ' + pState.ans.toFixed(2) + ' ' + pState.unit; fb.className = 'feedback bad'; playError(); }
    $('p-score').textContent = pState.correct; $('p-total').textContent = pState.total;
  });
  $('btn-show-sol').addEventListener('click', function () { var s = $('solution-panel'); s.style.display = 'block'; s.innerHTML = '<strong>Solution:</strong> ' + pState.sol; });
  $('btn-next-p').addEventListener('click', function () { newPractice(); playClick(); });

  /* ═══════════════════════════════════════════════════════════════════════
     QUIZ
     ═══════════════════════════════════════════════════════════════════════ */
  var QUIZ = [
    { q: 'On a centrifugal pump’s H–Q curve, as the discharge increases the head…', o: ['rises', 'falls', 'stays constant', 'rises then falls'], a: 1 },
    { q: 'The best efficiency point (BEP) is where…', o: ['the head is maximum', 'the discharge is maximum', 'the efficiency is maximum', 'the power is minimum'], a: 2 },
    { q: 'By the affinity laws, doubling the pump speed multiplies the power by about…', o: ['2', '4', '8', 'no change'], a: 2 },
    { q: 'Cavitation in a centrifugal pump occurs when…', o: ['NPSH available exceeds NPSH required', 'NPSH available falls below NPSH required', 'the delivery valve is fully open', 'the speed is below rated'], a: 1 },
    { q: 'The water (output) power of a pump is given by…', o: ['ρgQH', 'QH/ρg', 'ρQ/H', 'gH/Q'], a: 0 },
    { q: 'The operating (duty) point of a pump is found where…', o: ['the efficiency is zero', 'the pump curve meets the system curve', 'the head is shut-off head', 'the speed is maximum'], a: 1 },
    { q: 'Specific speed Nₛ = N√Q/H^(3/4) is used to…', o: ['measure cavitation', 'classify the impeller type', 'find the motor power', 'set the valve opening'], a: 1 },
    { q: 'Pump efficiency ηₚ is defined as…', o: ['shaft power / water power', 'water power / shaft power', 'input power / water power', 'head / discharge'], a: 1 }
  ];
  var qState = { order: [], idx: 0, score: 0, answered: false };
  function resetQuiz() { $('quiz-result').style.display = 'none'; document.querySelector('.question-panel').style.display = ''; $('btn-quiz-next').style.display = 'none'; qState = { order: shuffle(QUIZ.slice()).slice(0, 5), idx: 0, score: 0, answered: false }; renderQuiz(); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function renderQuiz() {
    var q = qState.order[qState.idx]; qState.answered = false;
    $('q-num').textContent = qState.idx + 1; $('q-total').textContent = qState.order.length;
    $('qp-prompt').textContent = q.q; $('quiz-feedback').textContent = ''; $('btn-quiz-next').style.display = 'none';
    var html = ''; q.o.forEach(function (opt, i) { html += '<button class="answer-opt" data-i="' + i + '">' + opt + '</button>'; });
    $('quiz-answers').innerHTML = html;
    $('quiz-answers').querySelectorAll('.answer-opt').forEach(function (b) { b.addEventListener('click', function () { answerQuiz(+b.dataset.i, b); }); });
  }
  function answerQuiz(i, btn) {
    if (qState.answered) return; qState.answered = true;
    var q = qState.order[qState.idx];
    var btns = $('quiz-answers').querySelectorAll('.answer-opt');
    btns.forEach(function (b, j) { b.disabled = true; if (j === q.a) b.classList.add('correct'); });
    if (i === q.a) { qState.score++; $('quiz-feedback').textContent = '✓ Correct'; $('quiz-feedback').className = 'feedback ok'; playSuccess(); }
    else { btn.classList.add('wrong'); $('quiz-feedback').textContent = '✗ Correct answer highlighted'; $('quiz-feedback').className = 'feedback bad'; playError(); }
    $('btn-quiz-next').style.display = '';
    $('btn-quiz-next').textContent = qState.idx < qState.order.length - 1 ? 'Next →' : 'See Result';
  }
  $('btn-quiz-next').addEventListener('click', function () {
    if (qState.idx < qState.order.length - 1) { qState.idx++; renderQuiz(); }
    else showQuizResult();
    playClick();
  });
  function showQuizResult() {
    document.querySelector('.question-panel').style.display = 'none'; $('btn-quiz-next').style.display = 'none';
    var res = $('quiz-result'); res.style.display = '';
    var n = qState.order.length, s = qState.score, stars = Math.round(s / n * 5);
    $('qr-score').textContent = s + ' / ' + n;
    $('qr-stars').textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    $('qr-verdict').textContent = s === n ? 'Perfect — pump expert!' : s >= n * 0.6 ? 'Good work — review the curves you missed.' : 'Keep practising — try Explore mode.';
  }
  $('btn-new-quiz').addEventListener('click', function () { resetQuiz(); playClick(); });

  /* ═══════════════════════════════════════════════════════════════════════
     ANIMATION LOOP
     ═══════════════════════════════════════════════════════════════════════ */
  function loop() {
    if (state.running) {
      state.crankAngle += (state.N / 60) * TAU * (1 / 60) * 0.10;
      var qf = qFree(state.N) || 1; var flow = Math.min(1, liveQ() / qf);
      state.tankLevel = Math.min(1, state.tankLevel + flow * 0.0016);
      if (state.tankLevel >= 1) state.tankLevel = 0.05;
    }
    if (state.mode === 'simulate') { drawPump(); drawResults(); updateBadges(); }
    requestAnimationFrame(loop);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════════ */
  (function init() {
    var p = curPump(); state.imp = p.imp0; state.stages = p.stages; state.ratedN = p.n0; state.N = p.n0;
    $('slider-n').value = state.N; $('slider-valve').value = state.valve;
    buildProcGrid(); buildLabSteps(); updateLabels(); updateBadges(); updateResultCards();
    renderExplore();
    drawPump(); drawResults();
    loop();
  })();
})();
