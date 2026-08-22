/* ════════════════════════════════════════════════════════════════
   Sheet Metal Bend Radius Calculator — app.js
   Press-brake bench UI. Internal state in SI (mm, MPa, N).
   Pure compute() + pure draw(). Display converts to mm | in.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var DEG = Math.PI / 180;
  var MM_PER_IN = 25.4;

  /* ── Material library (UTS, Y in MPa · E in GPa · minR = ×T) ── */
  var MATERIALS = {
    mild:     { name: 'Mild Steel',           uts: 400, y: 250, e: 200, k: 0.44, minR: 1.0 },
    ss304:    { name: 'Stainless 304',        uts: 580, y: 250, e: 193, k: 0.45, minR: 1.0 },
    al5052:   { name: 'Aluminium 5052-H32',   uts: 228, y: 193, e: 70,  k: 0.40, minR: 0.5 },
    al6061:   { name: 'Aluminium 6061-T6',    uts: 310, y: 276, e: 69,  k: 0.41, minR: 1.5 },
    cu110:    { name: 'Copper C110',          uts: 220, y: 70,  e: 117, k: 0.38, minR: 0.5 },
    brass260: { name: 'Brass C260',           uts: 360, y: 130, e: 110, k: 0.41, minR: 0.5 },
    cr4130:   { name: '4130 Chromoly',        uts: 560, y: 460, e: 205, k: 0.44, minR: 1.5 },
    ti2:      { name: 'Titanium Grade 2',     uts: 345, y: 275, e: 105, k: 0.42, minR: 1.5 },
    g90:      { name: 'Galvanized Steel G90',  uts: 360, y: 280, e: 200, k: 0.44, minR: 1.0 }
  };

  /* preset: [matKey, T, R, angle, legA, legB, die]  (mm/deg) */
  var PRESETS = [
    ['mild',   1,   1,   90,  25, 25,  8],
    ['mild',   2,   3,   90,  30, 30, 16],
    ['al5052', 3,   4,   90,  40, 40, 24],
    ['ss304',  1.5, 2,   90,  25, 25, 12],
    ['mild',   2,   3,  135,  30, 30, 16],
    ['mild',   2,   3,   45,  30, 30, 16]
  ];

  var state = {
    mode: 'simulate', unit: 'mm', matKey: 'mild',
    T: 2, R: 3, angle: 90, legA: 30, legB: 30, die: 16,
    kMode: 'auto', kManual: 0.44, lay: 'left', chartView: 'flat',
    toggles: { dims: true, neutral: true, equation: true, hatch: true, spring: false, vdie: false, grid: false },
    audioCtx: null,
    p: null, pScore: 0, pAttempts: 0, quiz: null
  };
  var customMats = {};

  /* parameter config (ranges in mm / deg) */
  var PARAMS = {
    T:     { slider: 'slider-T', step: 'step-T', min: 0.1, max: 20, stepMm: 0.1, stepIn: 0.005, len: true, dec: 1 },
    R:     { slider: 'slider-R', step: 'step-R', min: 0, max: 200, stepMm: 0.1, stepIn: 0.005, len: true, dec: 1 },
    angle: { slider: 'slider-angle', step: 'step-angle', min: 1, max: 170, stepMm: 1, len: false, dec: 0 },
    legA:  { slider: 'slider-legA', step: 'step-legA', min: 0, max: 1000, stepMm: 1, stepIn: 0.05, len: true, dec: 0 },
    legB:  { slider: 'slider-legB', step: 'step-legB', min: 0, max: 1000, stepMm: 1, stepIn: 0.05, len: true, dec: 0 },
    die:   { slider: 'slider-die', step: 'step-die', min: 1, max: 400, stepMm: 1, stepIn: 0.05, len: true, dec: 0 }
  };

  /* ── Unit helpers ── */
  function toLen(mm)  { return state.unit === 'in' ? mm / MM_PER_IN : mm; }
  function fromLen(v) { return state.unit === 'in' ? v * MM_PER_IN : v; }
  function uLen()     { return state.unit === 'in' ? 'in' : 'mm'; }
  function lp()       { return state.unit === 'in' ? 3 : 2; }
  function fmtLen(mm) { return toLen(mm).toFixed(lp()); }
  function fmtForceVal(kNm) { return state.unit === 'in' ? (kNm * 0.034266).toFixed(2) : kNm.toFixed(0); }
  function forceUnit() { return state.unit === 'in' ? 't/ft' : 'kN/m'; }
  function mat() { return customMats[state.matKey] || MATERIALS[state.matKey]; }

  /* ── PURE COMPUTE ── */
  function kFactor() { return state.kMode === 'manual' ? state.kManual : mat().k; }

  function compute() {
    var T = state.T, R = state.R, A = state.angle, m = mat();
    var K = kFactor();
    var t = K * T;
    var rt = T > 0 ? R / T : 0;
    var BA = DEG * A * (R + K * T);
    var OSSB = Math.tan((A / 2) * DEG) * (R + T);
    var BD = 2 * OSSB - BA;
    var flat = state.legA + state.legB - BD;
    var Empa = m.e * 1000;
    var x = (R > 0 && T > 0) ? (R * m.y) / (Empa * T) : 0;
    var ratio = 4 * x * x * x - 3 * x + 1; if (ratio < 0.05) ratio = 0.05;
    var Rf = R / ratio;
    var Ks = (R + t) / (Rf + t);
    var Af = A * Ks, Aover = A / Ks;
    var minR = m.minR * T, minOK = R >= minR - 1e-6;
    var tonnage = (state.die > 0) ? (1.33 * m.uts * T * T) / state.die : 0;
    var rEff = 0.16 * state.die;
    var minFlange = 0.5 * state.die + T;
    var flangeOK = (state.legA >= minFlange - 1e-6) && (state.legB >= minFlange - 1e-6);
    return {
      K: K, t: t, rt: rt, BA: BA, OSSB: OSSB, BD: BD, flat: flat,
      Rf: Rf, Ks: Ks, Af: Af, Aover: Aover, x: x, ratio: ratio,
      minR: minR, minOK: minOK, tonnage: tonnage, rEff: rEff, minFlange: minFlange, flangeOK: flangeOK
    };
  }

  /* ════════════════════════════════════════════════════════════════
     CANVAS HELPERS
     ════════════════════════════════════════════════════════════════ */
  function setupCanvas(cv, cssH) {
    var dpr = window.devicePixelRatio || 1;
    var cssW = cv.clientWidth || (cv.parentElement && cv.parentElement.getBoundingClientRect().width) || 600;
    cssW = Math.max(260, Math.round(cssW));
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.height = cssH + 'px';
    var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: cssW, h: cssH };
  }
  function drawGrid(ctx, w, h) {
    ctx.save(); ctx.strokeStyle = 'rgba(139,157,195,0.10)'; ctx.lineWidth = 1;
    for (var x = 0; x <= w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (var y = 0; y <= h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.restore();
  }
  function haloText(ctx, txt, x, y, font, fill, align) {
    ctx.save(); ctx.font = font; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(10,13,20,0.92)'; ctx.lineJoin = 'round'; ctx.strokeText(txt, x, y);
    ctx.fillStyle = fill; ctx.fillText(txt, x, y); ctx.restore();
  }
  function arrowHead(ctx, x, y, ang, col) {
    ctx.save(); ctx.fillStyle = col; ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-7, -2.6); ctx.lineTo(-7, 2.6); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function addPt(p, q) { return { x: p.x + q.x, y: p.y + q.y }; }
  function scalePt(p, s) { return { x: p.x * s, y: p.y * s }; }
  function offsetAlong(p, factor) { return { x: p.x * factor, y: p.y * factor }; }

  /* ── Bend cross-section geometry ── */
  function bendGeometry() {
    var R = state.R, T = state.T, A = state.angle;
    var rin = Math.max(R, T * 0.06, 0.4), th = T, rout = rin + th;
    /* draw each flange at its real outside-leg length (clamped to a visible band)
       so changing Leg A / Leg B is reflected on the cross-section */
    var legLa = Math.max(6, Math.min(55, state.legA || 6));   /* dl side ← Leg A */
    var legLb = Math.max(6, Math.min(55, state.legB || 6));   /* dr side ← Leg B */
    var half = (A / 2) * DEG, nSeg = 28;
    var inPts = [], outPts = [], nPts = [], rn = rin + state._Kt, i, ha, aa;
    for (i = 0; i <= nSeg; i++) {
      ha = -half + (i / nSeg) * (2 * half); aa = -Math.PI / 2 + ha;
      inPts.push({ x: rin * Math.cos(aa), y: rin * Math.sin(aa) });
      outPts.push({ x: rout * Math.cos(aa), y: rout * Math.sin(aa) });
      nPts.push({ x: rn * Math.cos(aa), y: rn * Math.sin(aa) });
    }
    var Pl_in = inPts[inPts.length - 1], Pl_out = outPts[outPts.length - 1];
    var Pr_in = inPts[0], Pr_out = outPts[0];
    function legDir(pt) {
      var len = Math.hypot(pt.x, pt.y), rx = pt.x / len, ry = pt.y / len, tx = -ry, ty = rx;
      if (ty < 0) { tx = -tx; ty = -ty; } return { x: tx, y: ty };
    }
    return { rin: rin, rout: rout, rn: rn, th: th, half: half, legLa: legLa, legLb: legLb,
      inPts: inPts, outPts: outPts, nPts: nPts,
      Pl_in: Pl_in, Pl_out: Pl_out, Pr_in: Pr_in, Pr_out: Pr_out, dl: legDir(Pl_in), dr: legDir(Pr_in) };
  }

  function drawBend() {
    var cv = $('bend-canvas'); if (!cv || state.mode !== 'simulate') return;
    var s0 = setupCanvas(cv, 400), ctx = s0.ctx, w = s0.w, h = s0.h;
    ctx.clearRect(0, 0, w, h);
    /* keep the floating Reset button + unit toggle anchored inside the canvas bottom */
    var _by = (cv.offsetTop + cv.clientHeight - 48) + 'px';
    var _rb = $('btn-reset'); if (_rb) { _rb.style.top = _by; _rb.style.bottom = 'auto'; }
    var _ut = $('unit-tabs'); if (_ut) _ut.style.top = _by;
    if (state.toggles.grid) drawGrid(ctx, w, h);

    var c = compute(); state._Kt = c.t;
    var g = bendGeometry();

    var rot = (state.lay === 'right') ? -Math.atan2(g.dl.y, g.dl.x)
            : (state.lay === 'left')  ? (Math.PI - Math.atan2(g.dr.y, g.dr.x)) : 0;
    var _rc = Math.cos(rot), _rs = Math.sin(rot);
    function Rp(p) { return rot ? { x: p.x * _rc - p.y * _rs, y: p.x * _rs + p.y * _rc } : p; }
    function legEnd(p, d, L) { return { x: p.x + d.x * L, y: p.y + d.y * L }; }

    var wEff = w - 64;
    /* FIXED reference (not the actual legs) → thickness stays constant at every
       bend angle AND when the leg lengths change. */
    var legRef = 55;
    var refW = 2 * (legRef + g.rout), refH = legRef + g.rout + g.th;
    var s = Math.min((wEff - 60) / refW, (h - 110) / refH); s = Math.max(0.4, Math.min(s, 9));
    /* Pin the flat flange's OUTER (datum) corner so the datum plane stays locked
       at the bottom as the angle changes — only the free flange swings. */
    var anchorPt = (state.lay === 'left') ? g.Pr_out : (state.lay === 'right') ? g.Pl_out : { x: 0, y: -g.rin };
    var apex = Rp(anchorPt);
    var anchorX = (state.lay === 'left') ? wEff * 0.60 : (state.lay === 'right') ? wEff * 0.40 : wEff * 0.50;
    var showVDie = (state.lay === 'vee' && state.toggles.vdie);
    var anchorY = showVDie ? h - 104 : h - 58;   /* leave room for the V-die below when shown */
    function M(p0) { var p = Rp(p0); return { x: anchorX + (p.x - apex.x) * s, y: anchorY - (p.y - apex.y) * s }; }

    /* ── V-die illustration (Symmetric-V lay, toggle) — opening tracks the die slider ── */
    if (showVDie) {
      var outBot = M({ x: 0, y: -g.rout });
      var dieW = Math.min(state.die * s, w * 0.62), half = dieW / 2;
      var topY = outBot.y + 4, ext = 20;
      var depth = Math.min(half * 0.85, h - topY - 50), gx = outBot.x, botY = topY + depth + 14;
      ctx.save();
      ctx.fillStyle = '#212a3a'; ctx.strokeStyle = '#3a4660'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(gx - half - ext, topY); ctx.lineTo(gx - half, topY); ctx.lineTo(gx, topY + depth); ctx.lineTo(gx + half, topY); ctx.lineTo(gx + half + ext, topY);
      ctx.lineTo(gx + half + ext, botY); ctx.lineTo(gx - half - ext, botY); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#5b6a86'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx - half, topY); ctx.lineTo(gx, topY + depth); ctx.lineTo(gx + half, topY); ctx.stroke();
      ctx.restore();
      if (state.toggles.dims) {
        var ddy = botY + 8;
        ctx.save(); ctx.strokeStyle = '#7cc4ff'; ctx.lineWidth = 1; ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(gx - half, ddy); ctx.lineTo(gx + half, ddy); ctx.stroke();
        arrowHead(ctx, gx - half, ddy, Math.PI, '#7cc4ff'); arrowHead(ctx, gx + half, ddy, 0, '#7cc4ff');
        ctx.restore();
        haloText(ctx, 'V-die opening ' + fmtLen(state.die) + ' ' + uLen(), gx, ddy + 10, '700 10px "Courier New", monospace', '#7cc4ff');
      }
    }

    /* sheet polygon */
    var leftInEnd = legEnd(g.Pl_in, g.dl, g.legLa), leftOutEnd = legEnd(g.Pl_out, g.dl, g.legLa);
    var rightInEnd = legEnd(g.Pr_in, g.dr, g.legLb), rightOutEnd = legEnd(g.Pr_out, g.dr, g.legLb), i, q;
    ctx.beginPath();
    var p0 = M(leftInEnd); ctx.moveTo(p0.x, p0.y);
    var pt = M(g.Pl_in); ctx.lineTo(pt.x, pt.y);
    for (i = g.inPts.length - 1; i >= 0; i--) { q = M(g.inPts[i]); ctx.lineTo(q.x, q.y); }
    var pr = M(rightInEnd); ctx.lineTo(pr.x, pr.y);
    var pro = M(rightOutEnd); ctx.lineTo(pro.x, pro.y);
    var prot = M(g.Pr_out); ctx.lineTo(prot.x, prot.y);
    for (i = 0; i < g.outPts.length; i++) { q = M(g.outPts[i]); ctx.lineTo(q.x, q.y); }
    var plo = M(leftOutEnd); ctx.lineTo(plo.x, plo.y);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, h * 0.18, 0, h * 0.95);
    grad.addColorStop(0, '#aeb9c9'); grad.addColorStop(0.5, '#7d8a9c'); grad.addColorStop(1, '#586374');
    ctx.fillStyle = grad; ctx.fill();
    if (state.toggles.hatch) {
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(20,26,40,0.45)'; ctx.lineWidth = 1;
      for (var hx = -h; hx < w + h; hx += 8) { ctx.beginPath(); ctx.moveTo(hx, 0); ctx.lineTo(hx + h, h); ctx.stroke(); }
      ctx.restore();
    }
    ctx.lineJoin = 'round'; ctx.lineWidth = 1.6; ctx.strokeStyle = '#cdd6e3'; ctx.stroke();

    /* datum plane */
    if (state.lay !== 'vee') {
      var fa, fb;
      if (state.lay === 'right') { fa = M(g.Pl_out); fb = M(legEnd(g.Pl_out, g.dl, g.legLa)); }
      else { fa = M(g.Pr_out); fb = M(legEnd(g.Pr_out, g.dr, g.legLb)); }
      var gy = Math.max(fa.y, fb.y) + 7, gx0 = Math.min(fa.x, fb.x) - 16, gx1 = Math.max(fa.x, fb.x) + 16;
      ctx.save(); ctx.setLineDash([]); ctx.strokeStyle = 'rgba(159,178,200,0.55)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(gx0, gy); ctx.lineTo(gx1, gy); ctx.stroke();
      ctx.strokeStyle = 'rgba(159,178,200,0.32)'; ctx.lineWidth = 1;
      for (var gx = gx0 + 4; gx < gx1; gx += 9) { ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 6, gy + 6); ctx.stroke(); }
      ctx.restore();
      haloText(ctx, 'datum plane', gx1, gy + 12, '600 9px "Segoe UI", sans-serif', 'rgba(159,178,200,0.85)', 'right');
    }

    /* neutral axis */
    if (state.toggles.neutral) {
      ctx.save(); ctx.setLineDash([6, 4]); ctx.lineWidth = 1.4; ctx.strokeStyle = '#ffca28';
      var nl0 = M(offsetAlong(g.Pl_in, g.rn / g.rin)); ctx.beginPath(); ctx.moveTo(nl0.x, nl0.y);
      var nlEnd = M(legEnd(offsetAlong(g.Pl_in, g.rn / g.rin), g.dl, g.legLa)); ctx.lineTo(nlEnd.x, nlEnd.y); ctx.stroke();
      ctx.beginPath();
      for (i = 0; i < g.nPts.length; i++) { var np = M(g.nPts[i]); if (i === 0) ctx.moveTo(np.x, np.y); else ctx.lineTo(np.x, np.y); }
      ctx.stroke();
      var nr0 = M(offsetAlong(g.Pr_in, g.rn / g.rin)); ctx.beginPath(); ctx.moveTo(nr0.x, nr0.y);
      var nrEnd = M(legEnd(offsetAlong(g.Pr_in, g.rn / g.rin), g.dr, g.legLb)); ctx.lineTo(nrEnd.x, nrEnd.y); ctx.stroke();
      ctx.restore();
      var nLabPt = M(legEnd(offsetAlong(g.Pr_in, g.rn / g.rin), g.dr, g.legLb * 0.62));
      haloText(ctx, 'neutral axis', nLabPt.x - 10, nLabPt.y - 8, '600 10px "Segoe UI", sans-serif', '#ffca28', 'right');
    }

    /* springback ghost */
    if (state.toggles.spring) {
      var rotg = ((state.angle - c.Af) / 2) * DEG, pivot = { x: 0, y: -g.rin };
      function rotAbout(p, ang, sgn) { var dx = p.x - pivot.x, dy = p.y - pivot.y, a = sgn * ang;
        return { x: pivot.x + dx * Math.cos(a) - dy * Math.sin(a), y: pivot.y + dx * Math.sin(a) + dy * Math.cos(a) }; }
      ctx.save(); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6; ctx.strokeStyle = 'rgba(255,112,67,0.9)';
      var l1 = M(rotAbout(g.Pl_out, rotg, 1)), l2 = M(rotAbout(legEnd(g.Pl_out, g.dl, g.legLa), rotg, 1));
      ctx.beginPath(); ctx.moveTo(l1.x, l1.y); ctx.lineTo(l2.x, l2.y); ctx.stroke();
      var r1 = M(rotAbout(g.Pr_out, rotg, -1)), r2 = M(rotAbout(legEnd(g.Pr_out, g.dr, g.legLb), rotg, -1));
      ctx.beginPath(); ctx.moveTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.stroke(); ctx.restore();
    }

    /* dimensions */
    if (state.toggles.dims) {
      var Cc = M({ x: 0, y: 0 }), bottomIn = M({ x: 0, y: -g.rin });
      var rAng = Math.atan2(bottomIn.y - Cc.y, bottomIn.x - Cc.x);
      var rExt = 24;  /* extend the leader past the inside surface so "R" clears the angle marker */
      var exPt = { x: bottomIn.x + Math.cos(rAng) * rExt, y: bottomIn.y + Math.sin(rAng) * rExt };
      ctx.save(); ctx.strokeStyle = '#d4922a'; ctx.lineWidth = 1.2; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(Cc.x, Cc.y); ctx.lineTo(exPt.x, exPt.y); ctx.stroke();
      arrowHead(ctx, bottomIn.x, bottomIn.y, rAng, '#d4922a');
      ctx.fillStyle = '#d4922a'; ctx.beginPath(); ctx.arc(Cc.x, Cc.y, 2.4, 0, 7); ctx.fill(); ctx.restore();
      var rAlign = Math.cos(rAng) >= 0 ? 'left' : 'right';
      haloText(ctx, 'R ' + fmtLen(state.R), exPt.x + Math.cos(rAng) * 5, exPt.y + Math.sin(rAng) * 5, '700 11px "Courier New", monospace', '#e8b25a', rAlign);
      var stIn = (state.lay === 'right') ? g.Pr_in : g.Pl_in, stOut = (state.lay === 'right') ? g.Pr_out : g.Pl_out, stD = (state.lay === 'right') ? g.dr : g.dl, stL = (state.lay === 'right') ? g.legLb : g.legLa;
      var tInner = M(addPt(stIn, scalePt(stD, stL * 0.52))), tOuter = M(addPt(stOut, scalePt(stD, stL * 0.52)));
      ctx.save(); ctx.strokeStyle = '#9fb2c8'; ctx.lineWidth = 1.1; ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(tInner.x, tInner.y); ctx.lineTo(tOuter.x, tOuter.y); ctx.stroke(); ctx.restore();
      var tnx = tOuter.x - tInner.x, tny = tOuter.y - tInner.y, tnl = Math.hypot(tnx, tny) || 1;
      haloText(ctx, 'T ' + fmtLen(state.T), tOuter.x + (tnx / tnl) * 14, tOuter.y + (tny / tnl) * 14, '700 11px "Courier New", monospace', '#cdd6e3', 'left');
      var ar = 26, base = Math.PI / 2 - rot;
      ctx.save(); ctx.strokeStyle = '#7cc4ff'; ctx.lineWidth = 1.3; ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(Cc.x, Cc.y, ar, base - g.half, base + g.half, false); ctx.stroke(); ctx.restore();
      haloText(ctx, state.angle + '°', Cc.x + Math.cos(base) * (ar + 14), Cc.y + Math.sin(base) * (ar + 14), '700 11px "Courier New", monospace', '#7cc4ff');
    }

    haloText(ctx, 'CROSS-SECTION', w - 72, 14, '700 10px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'right');
  }

  /* ── Right panel: flat pattern OR springback gauge ── */
  function drawRight() {
    var cv = $('flat-canvas'); if (!cv || state.mode !== 'simulate') return;
    if (state.chartView === 'spring') { drawSpringGauge(cv); return; }
    var s0 = setupCanvas(cv, 188), ctx = s0.ctx, w = s0.w, h = s0.h;
    ctx.clearRect(0, 0, w, h);
    if (state.toggles.grid) drawGrid(ctx, w, h);
    var c = compute();
    var s1 = Math.max(state.legA - c.OSSB, 0.001), mid = Math.max(c.BA, 0.001), s3 = Math.max(state.legB - c.OSSB, 0.001);
    var total = s1 + mid + s3, pad = 46, availW = w - pad * 2, sc = availW / total, x0 = pad;
    var stripH = 30, yTop = h / 2 - stripH / 2 - 6;
    var w1 = s1 * sc, wm = mid * sc, w3 = s3 * sc;
    var mg = ctx.createLinearGradient(0, yTop, 0, yTop + stripH); mg.addColorStop(0, '#aeb9c9'); mg.addColorStop(1, '#6b7686');
    function seg(x, ww) { ctx.fillStyle = mg; ctx.fillRect(x, yTop, ww, stripH); ctx.strokeStyle = '#cdd6e3'; ctx.lineWidth = 1.2; ctx.strokeRect(x, yTop, ww, stripH); }
    seg(x0, w1);
    ctx.fillStyle = 'rgba(212,146,42,0.55)'; ctx.fillRect(x0 + w1, yTop, wm, stripH);
    ctx.strokeStyle = '#d4922a'; ctx.lineWidth = 1.2; ctx.strokeRect(x0 + w1, yTop, wm, stripH);
    seg(x0 + w1 + wm, w3);
    ctx.save(); ctx.setLineDash([4, 3]); ctx.strokeStyle = '#ffca28'; ctx.lineWidth = 1.2;
    var bl = x0 + w1 + wm / 2; ctx.beginPath(); ctx.moveTo(bl, yTop - 16); ctx.lineTo(bl, yTop + stripH + 8); ctx.stroke(); ctx.restore();
    haloText(ctx, 'bend line @ ' + fmtLen(s1 + mid / 2) + ' ' + uLen(), bl, yTop - 22, '600 9px "Segoe UI", sans-serif', '#ffca28');
    haloText(ctx, fmtLen(s1) + ' ' + uLen(), x0 + w1 / 2, yTop + stripH / 2, '700 9px "Courier New", monospace', '#1a2233');
    haloText(ctx, fmtLen(s3) + ' ' + uLen(), x0 + w1 + wm + w3 / 2, yTop + stripH / 2, '700 9px "Courier New", monospace', '#1a2233');
    var dy = yTop + stripH + 22; ctx.strokeStyle = '#d4922a'; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x0, dy); ctx.lineTo(x0 + availW, dy); ctx.stroke();
    arrowHead(ctx, x0, dy, Math.PI, '#d4922a'); arrowHead(ctx, x0 + availW, dy, 0, '#d4922a');
    haloText(ctx, 'Flat length = ' + fmtLen(c.flat) + ' ' + uLen(), w / 2, dy + 12, '700 11px "Courier New", monospace', '#f0c989');
    haloText(ctx, 'BA ' + fmtLen(c.BA), bl, yTop + stripH / 2 - 0.5, '700 9px "Courier New", monospace', '#fff');
    haloText(ctx, 'FLAT PATTERN', 8, 12, '700 10px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'left');
    if (!c.flangeOK) haloText(ctx, '⚠ flange < min (' + fmtLen(c.minFlange) + ' ' + uLen() + ')', w - 8, 12, '700 9px "Segoe UI", sans-serif', '#ff7043', 'right');
  }

  function drawSpringGauge(cv) {
    var s0 = setupCanvas(cv, 188), ctx = s0.ctx, w = s0.w, h = s0.h;
    ctx.clearRect(0, 0, w, h);
    if (state.toggles.grid) drawGrid(ctx, w, h);
    var c = compute();
    var cx = w / 2, cy = h - 34, rad = Math.min(w * 0.34, h - 64);
    /* baseline (datum) */
    ctx.strokeStyle = 'rgba(159,178,200,0.45)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - rad - 18, cy); ctx.lineTo(cx + rad + 18, cy); ctx.stroke();
    /* protractor arc */
    ctx.strokeStyle = 'rgba(139,157,195,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, rad, Math.PI, 0, false); ctx.stroke();
    function arm(angDeg, col, lab, lw) {
      var a = Math.PI - angDeg * DEG;  /* measured from +x baseline, CCW up */
      var ex = cx + Math.cos(a) * rad, ey = cy + Math.sin(a) * rad;
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.setLineDash(lw < 2 ? [5, 4] : []);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.setLineDash([]);
      haloText(ctx, lab, ex + Math.cos(a) * 16, ey + Math.sin(a) * 16, '700 10px "Courier New", monospace', col);
    }
    arm(state.angle, '#7cc4ff', 'formed ' + state.angle + '°', 2.4);
    arm(c.Af, 'rgba(255,112,67,0.95)', 'final ' + c.Af.toFixed(1) + '°', 1.6);
    ctx.fillStyle = '#d4922a'; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 7); ctx.fill();
    haloText(ctx, 'SPRINGBACK', 8, 12, '700 10px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'left');
    var dA = (state.angle - c.Af);
    haloText(ctx, 'Δθ = ' + dA.toFixed(1) + '°   →   overbend to ' + c.Aover.toFixed(1) + '°', cx, h - 14, '700 11px "Courier New", monospace', '#f0c989');
    haloText(ctx, 'Rf = ' + fmtLen(c.Rf) + ' ' + uLen(), cx, 26, '600 10px "Segoe UI", sans-serif', 'rgba(255,112,67,0.95)');
  }

  function render() { drawBend(); drawRight(); updateResults(); updateLearnPanels(); }

  /* ════════════════════════════════════════════════════════════════
     DASHBOARD / BADGES / STEPS
     ════════════════════════════════════════════════════════════════ */
  function setTxt(id, v) { var e = $(id); if (e) e.textContent = v; }
  function trim(v) { return (Math.round(v * 100) / 100).toString(); }

  function updateResults() {
    var c = compute();
    document.querySelectorAll('.u-len').forEach(function (e) { e.textContent = uLen(); });
    setTxt('res-k', c.K.toFixed(3)); setTxt('res-rt', c.rt.toFixed(2));
    setTxt('res-na', fmtLen(c.t)); setTxt('res-ba', fmtLen(c.BA)); setTxt('res-ossb', fmtLen(c.OSSB));
    setTxt('res-bd', fmtLen(c.BD)); setTxt('res-flat', fmtLen(c.flat)); setTxt('res-rf', fmtLen(c.Rf));
    setTxt('res-af', c.Af.toFixed(1)); setTxt('res-reff', fmtLen(c.rEff)); setTxt('res-over', c.Aover.toFixed(1));
    var minrEl = $('res-minr'); if (minrEl) { minrEl.textContent = fmtLen(c.minR); minrEl.className = 'readout-value' + (c.minOK ? '' : ' warn'); }
    var mfEl = $('res-minflange'); if (mfEl) { mfEl.textContent = fmtLen(c.minFlange); mfEl.className = 'readout-value' + (c.flangeOK ? '' : ' warn'); }
    setTxt('res-force', fmtForceVal(c.tonnage)); setTxt('res-force-u', forceUnit());
    /* badges */
    setTxt('rb-k', c.K.toFixed(2)); setTxt('rb-ba', fmtLen(c.BA)); setTxt('rb-bd', fmtLen(c.BD)); setTxt('rb-flat', fmtLen(c.flat));
    var sb = $('status-badge'); if (sb) { sb.textContent = c.minOK ? 'R OK' : 'R < min'; sb.className = 'graph-badge status-badge ' + (c.minOK ? 'ok' : 'bad'); }
    /* flag the radius slider itself when below the material minimum */
    var rSl = $('slider-R'), rGrp = rSl ? rSl.closest('.sim-slider-group') : null;
    if (rGrp) rGrp.classList.toggle('danger', !c.minOK);
    var rFlag = $('r-min-flag'); if (rFlag) rFlag.textContent = c.minOK ? '' : '⚠ below min radius ' + fmtLen(c.minR) + ' ' + uLen();
    var sc = $('step-content'); if (sc) sc.innerHTML = buildSteps(c);
    updateBendEq(c);
  }

  function step(n, title, text) {
    return '<div class="calc-step"><div class="cs-num">' + n + '</div><div class="cs-body"><div class="cs-title">' + title + '</div><div class="cs-text">' + text + '</div></div></div>';
  }
  function buildSteps(c) {
    var u = uLen(), h = '';
    h += step(1, 'Inputs', 'T = <code>' + fmtLen(state.T) + ' ' + u + '</code>, R = <code>' + fmtLen(state.R) + ' ' + u + '</code>, A = <code>' + state.angle + '°</code>, material = <code>' + mat().name + '</code>');
    h += step(2, 'K-factor &amp; neutral axis', 'K = <code>' + c.K.toFixed(3) + '</code> (' + state.kMode + '). t = K&middot;T = <code>' + fmtLen(c.t) + ' ' + u + '</code>, R/T = <code>' + c.rt.toFixed(2) + '</code>');
    h += step(3, 'Bend allowance', 'BA = (π/180)&middot;' + state.angle + '&middot;(' + fmtLen(state.R) + ' + ' + c.K.toFixed(2) + '&middot;' + fmtLen(state.T) + ') = <code>' + fmtLen(c.BA) + ' ' + u + '</code>');
    h += step(4, 'Setback &amp; deduction', 'OSSB = tan(A/2)&middot;(R+T) = <code>' + fmtLen(c.OSSB) + ' ' + u + '</code>; BD = 2&middot;OSSB &minus; BA = <code>' + fmtLen(c.BD) + ' ' + u + '</code>');
    h += step(5, 'Flat length', 'L = (' + fmtLen(state.legA) + ' + ' + fmtLen(state.legB) + ') &minus; ' + fmtLen(c.BD) + ' = <code>' + fmtLen(c.flat) + ' ' + u + '</code>');
    h += step(6, 'Springback', 'x = R&middot;Y/(E&middot;T) = <code>' + c.x.toFixed(4) + '</code>; R&fnof; = <code>' + fmtLen(c.Rf) + ' ' + u + '</code>; final ≈ <code>' + c.Af.toFixed(1) + '°</code> (overbend to ' + c.Aover.toFixed(1) + '°)');
    h += step(7, 'Min radius &amp; force', 'Min R = ' + mat().minR + '&times;T = <code>' + fmtLen(c.minR) + ' ' + u + '</code> &rarr; ' + (c.minOK ? '<span style="color:var(--green)">safe</span>' : '<span style="color:var(--red)">crack risk</span>') + '; F ≈ <code>' + fmtForceVal(c.tonnage) + ' ' + forceUnit() + '</code>');
    return h;
  }

  /* ── KaTeX panels ── */
  var _cache = { eq: '', coach: '' };
  function updateLearnPanels() {
    var c = compute(), u = uLen(), m = mat();
    var eq = ''
      + '<div class="eq-line">\\( BA = \\dfrac{\\pi}{180}\\,A\\,(R + K\\,T) = ' + fmtLen(c.BA) + '\\,\\mathrm{' + u + '} \\)</div>'
      + '<div class="eq-line">\\( OSSB = \\tan\\!\\dfrac{A}{2}\\,(R+T) = ' + fmtLen(c.OSSB) + '\\,\\mathrm{' + u + '} \\)</div>'
      + '<div class="eq-line">\\( BD = 2\\,OSSB - BA = ' + fmtLen(c.BD) + '\\,\\mathrm{' + u + '} \\)</div>'
      + '<div class="eq-line">\\( L_{flat} = (\\ell_A+\\ell_B) - BD = ' + fmtLen(c.flat) + '\\,\\mathrm{' + u + '} \\)</div>'
      + '<div class="eq-line">\\( \\dfrac{R_i}{R_f} = 4x^3 - 3x + 1,\\; x=\\dfrac{R\\,Y}{E\\,T} = ' + c.x.toFixed(4) + ' \\Rightarrow R_f = ' + fmtLen(c.Rf) + '\\,\\mathrm{' + u + '} \\)</div>';
    var eqEl = $('lp-eq-body'); if (eqEl && eq !== _cache.eq) { eqEl.innerHTML = eq; _cache.eq = eq; }
    var coach = '<ul class="coach-list">';
    coach += '<li><strong>R/T = ' + c.rt.toFixed(2) + '.</strong> ' + (c.rt < 1 ? 'Tight radius — neutral axis sits closer to the inside (K≈0.33); switch K to Manual to refine.' : c.rt > 3 ? 'Large radius — K approaches 0.5 and BA grows.' : 'Typical range — material K ≈ ' + m.k.toFixed(2) + ' is a good estimate.') + '</li>';
    coach += '<li><strong>Min radius ' + fmtLen(c.minR) + ' ' + u + '.</strong> ' + (c.minOK ? 'Safe for ' + m.name + '.' : 'Below minimum for ' + m.name + ' — expect cracking; open up R or anneal.') + '</li>';
    coach += '<li><strong>Springback.</strong> ' + m.name + ' (Y=' + m.y + ', E=' + m.e + ' GPa) relaxes a ' + state.angle + '° bend to ≈' + c.Af.toFixed(1) + '°. Overbend to ' + c.Aover.toFixed(1) + '°.</li>';
    coach += '<li><strong>Effective radius ≈ ' + fmtLen(c.rEff) + ' ' + u + '.</strong> Air-bend radius is set by the die (≈16% of the ' + fmtLen(state.die) + ' ' + u + ' opening)' + (Math.abs(state.R - c.rEff) > 0.4 ? ' — match R to the die or bottom/coin.' : ', close to your R.') + '</li>';
    coach += '<li><strong>Min. flange ' + fmtLen(c.minFlange) + ' ' + u + '.</strong> ' + (c.flangeOK ? 'Both legs clear the die shoulders.' : 'A leg is shorter than ≈½ die + T — it will slip into the die.') + '</li>';
    coach += '<li><strong>Tonnage ' + fmtForceVal(c.tonnage) + ' ' + forceUnit() + '.</strong> Air bend over a ' + fmtLen(state.die) + ' ' + u + ' V-die (≈' + (state.die / state.T).toFixed(1) + '×T). Wider die → less force, larger radius.</li>';
    coach += '</ul>';
    var cEl = $('lp-coach-body'); if (cEl && coach !== _cache.coach) { cEl.innerHTML = coach; _cache.coach = coach; }
  }

  var _bendEqCache = '';
  function renderBendEq(el) {
    if (window.renderMathInElement) { try { window.renderMathInElement(el, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (e) {} }
    else setTimeout(function () { renderBendEq(el); }, 200);
  }
  function updateBendEq(c) {
    var box = $('bend-eq'); if (!box) return;
    box.style.display = state.toggles.equation ? '' : 'none';
    if (!state.toggles.equation) return;
    var cv = $('bend-canvas'); if (cv) box.style.top = (cv.offsetTop + 12) + 'px';
    var math = $('bend-eq-math'); if (!math) return; var u = uLen();
    var A = '\\textcolor{#7cc4ff}{' + state.angle + '}', R = '\\textcolor{#e8b25a}{' + fmtLen(state.R) + '}', K = '\\textcolor{#5fd08a}{' + c.K.toFixed(2) + '}', T = '\\textcolor{#9fb2c8}{' + fmtLen(state.T) + '}';
    var tex = '\\[ \\textcolor{#f0c989}{BA} = \\frac{\\pi}{180}\\,\\textcolor{#7cc4ff}{A}\\,(\\textcolor{#e8b25a}{R} + \\textcolor{#5fd08a}{K}\\,\\textcolor{#9fb2c8}{T}) \\]'
      + '\\[ = \\frac{\\pi}{180}\\cdot' + A + '\\,(' + R + ' + ' + K + '\\cdot' + T + ') \\]'
      + '\\[ = \\textcolor{#f0c989}{' + fmtLen(c.BA) + '\\ \\text{' + u + '}} \\]';
    if (tex !== _bendEqCache) { math.innerHTML = tex; _bendEqCache = tex; renderBendEq(math); }
  }

  /* ════════════════════════════════════════════════════════════════
     CONTROL SYNC (state → controls)
     ════════════════════════════════════════════════════════════════ */
  function paramStepDisp(p) { return p.len ? (state.unit === 'in' ? p.stepIn : p.stepMm) : p.stepMm; }
  function paramDec(p) { return p.len ? lp() : p.dec; }
  function setOneParam(key) {
    var p = PARAMS[key], sl = $(p.slider), si = $(p.step); if (!sl || !si) return;
    var dMin = p.len ? toLen(p.min) : p.min, dMax = p.len ? toLen(p.max) : p.max, dStep = paramStepDisp(p);
    var dVal = p.len ? toLen(state[key]) : state[key];
    var dec = paramDec(p), vstr = (Math.round(dVal / dStep) * dStep);
    [sl, si].forEach(function (el) { el.min = round6(dMin); el.max = round6(dMax); el.step = dStep; });
    sl.value = round6(dVal); si.value = (+dVal).toFixed(dec);
  }
  function round6(v) { return Math.round(v * 1e6) / 1e6; }
  function syncControls() {
    Object.keys(PARAMS).forEach(setOneParam);
    var asl = $('angle-slider'); if (asl) asl.value = state.angle;
    setTxt('as-val', state.angle + '°');
    var ms = $('mat-sel'); if (ms) ms.value = state.matKey;
    var ks = $('k-mode-sel'); if (ks) ks.value = state.kMode;
    var ki = $('k-input'); if (ki) { ki.disabled = state.kMode !== 'manual'; ki.value = (state.kMode === 'manual' ? state.kManual : mat().k).toFixed(2); }
    var ls = $('lay-sel'); if (ls) ls.value = state.lay;
    document.querySelectorAll('.u-len').forEach(function (e) { e.textContent = uLen(); });
  }
  function clearPreset() { var ps = $('preset-sel'); if (ps) ps.value = ''; }

  function readParam(key, rawDisp) {
    var p = PARAMS[key], v = parseFloat(rawDisp); if (isNaN(v)) return;
    var mm = p.len ? fromLen(v) : v;
    mm = Math.max(p.min, Math.min(p.max, mm));
    if (key === 'angle') mm = Math.round(mm * 10) / 10;
    state[key] = mm;
  }

  /* ════════════════════════════════════════════════════════════════
     MODE SWITCHING
     ════════════════════════════════════════════════════════════════ */
  function setMode(m) {
    state.mode = m;
    var map = { simulate: 'sim-wrapper', explore: 'explore-wrapper', practice: 'practice-wrapper', quiz: 'quiz-wrapper' };
    Object.keys(map).forEach(function (k) { var e = $(map[k]); if (e) e.style.display = (k === m ? '' : 'none'); });
    document.querySelectorAll('#mode-tabs .pill').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === m); });
    if (m === 'practice' && !state.p) newPractice();
    if (m === 'quiz') startQuiz();
    if (m === 'simulate') render();
  }

  /* ════════════════════════════════════════════════════════════════
     EXPLORE CARDS
     ════════════════════════════════════════════════════════════════ */
  var EXPLORE = {
    basics: [
      { h: 'Neutral axis', p: 'The fibre that neither stretches nor compresses during bending. It shifts toward the inside because compression resists more than tension.', note: 'Its position drives every flat-pattern calculation.' },
      { h: 'K-factor', p: 'K = t/T, the neutral-axis distance from the inside surface as a fraction of thickness. Always less than 0.5.', formula: 'K = t / T', note: 'Mild steel ≈ 0.44, stainless ≈ 0.45, soft aluminium ≈ 0.40.' },
      { h: 'Bend terms', p: 'Inside radius (R), thickness (T), bend angle (A = degrees the sheet turns), flange/leg lengths and the V-die opening (W).', note: 'A 90° bend turns the sheet 90° from flat.' }
    ],
    formulas: [
      { h: 'Bend allowance', p: 'Arc length of the neutral axis through the bend.', formula: 'BA = (π/180)·A·(R + K·T)', note: 'A=90°, R=3, T=2, K=0.44 → 1.571·(3+0.88) = 6.09 mm.' },
      { h: 'Outside setback', p: 'Tangent-to-apex distance on the outside of the bend.', formula: 'OSSB = tan(A/2)·(R + T)', note: 'tan45°·(3+2) = 5.00 mm.' },
      { h: 'Bend deduction', p: 'Subtract from summed outside dimensions to get the flat length.', formula: 'BD = 2·OSSB − BA', note: '2·5.00 − 6.09 = 3.91 mm.' },
      { h: 'Flat length', p: 'The blank to cut before forming.', formula: 'L = (ℓA + ℓB) − BD', note: '30+30 − 3.91 = 56.09 mm.' }
    ],
    springforce: [
      { h: 'Springback', p: 'Elastic recovery opens the angle and enlarges the radius after release.', formula: 'Ri/Rf = 4x³ − 3x + 1,  x = R·Y/(E·T)', note: 'Higher yield and R/T → more springback; stiffer (higher E) → less.' },
      { h: 'Overbending', p: 'Bend past the target by the springback amount, then let it relax back.', note: 'High-strength alloys may need several degrees of overbend.' },
      { h: 'Air-bend tonnage', p: 'Force to air-bend over a V-die, per length of bend.', formula: 'F = k·UTS·L·T² / W   (k ≈ 1.33)', note: 'A wider die opening W lowers force but produces a larger radius.' }
    ],
    materials: [
      { h: 'Minimum bend radius', p: 'Tightest inside radius before the outer fibre cracks, as a multiple of T.', note: 'Soft Al/brass 0–0.5T · mild steel & annealed stainless 0.5–1T · copper 0–1T.' },
      { h: 'Grain direction', p: 'Bending across the rolling direction is safer; along the grain needs a larger radius.', note: 'Hard tempers crack more easily.' },
      { h: 'Material & springback', p: 'Stainless and high-strength aluminium spring back more than mild steel or copper.', note: 'Compensate with overbend or bottoming/coining.' }
    ],
    standards: [
      { h: 'Air vs bottom bending', p: 'Air bending leaves the radius set by the die; bottoming/coining press the radius to the punch for tighter tolerance and less springback.', note: 'Air bending is the most flexible and lowest-tonnage process.' },
      { h: 'Die selection', p: 'A common start is a V-die opening of about 8×T. The natural air-bend radius is roughly 0.16×W.', note: 'Match the die to the thickness, not the radius alone.' },
      { h: 'Best practice', p: 'Keep R ≥ minimum, allow for springback, account for grain direction, and confirm K against a test bend.', note: 'A measured K beats a table value every time.' }
    ]
  };
  function renderExploreCards(cat) {
    var wrap = $('explore-cards'); if (!wrap) return;
    wrap.innerHTML = (EXPLORE[cat] || []).map(function (c) {
      var s = '<div class="ex-card"><h4>' + c.h + '</h4><p>' + c.p + '</p>';
      if (c.formula) s += '<div class="ex-formula">' + c.formula + '</div>';
      if (c.note) s += '<div class="ex-note">' + c.note + '</div>';
      return s + '</div>';
    }).join('');
  }

  /* ════════════════════════════════════════════════════════════════
     PRACTICE / QUIZ
     ════════════════════════════════════════════════════════════════ */
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function randomPart() {
    var mk = pick(Object.keys(MATERIALS));
    var T = pick([0.8, 1, 1.2, 1.5, 2, 2.5, 3]);
    var R = Math.round(pick([0.6, 1, 1.5, 2, 3]) * T * 10) / 10;
    return { mk: mk, T: T, R: R, A: pick([30, 45, 60, 90, 120, 135]), legA: pick([20, 25, 30, 40, 50]), legB: pick([20, 25, 30, 40, 50]) };
  }
  function partCompute(pt) {
    var m = MATERIALS[pt.mk], K = m.k;
    var BA = DEG * pt.A * (pt.R + K * pt.T), OSSB = Math.tan((pt.A / 2) * DEG) * (pt.R + pt.T), BD = 2 * OSSB - BA;
    var flat = pt.legA + pt.legB - BD, minR = m.minR * pt.T;
    return { K: K, BA: BA, OSSB: OSSB, BD: BD, flat: flat, minR: minR, safe: pt.R >= minR - 1e-6, m: m };
  }
  function newPractice() {
    state.p = randomPart(); var pc = partCompute(state.p), u = uLen();
    var q = $('p-question'); if (q) q.innerHTML = 'Material <strong>' + pc.m.name + '</strong> (K = ' + pc.K.toFixed(2) + '). T = <strong>' + fmtLen(state.p.T) + ' ' + u + '</strong>, R = <strong>' + fmtLen(state.p.R) + ' ' + u + '</strong>, angle = <strong>' + state.p.A + '°</strong>, outside legs <strong>' + fmtLen(state.p.legA) + '</strong> &amp; <strong>' + fmtLen(state.p.legB) + ' ' + u + '</strong>.';
    ['p-ba', 'p-bd', 'p-flat'].forEach(function (id) { var e = $(id); if (e) { e.value = ''; e.className = 'qi-input'; } });
    var sel = $('p-safe'); if (sel) { sel.value = ''; sel.className = 'qi-input'; }
    var sol = $('p-solution'); if (sol) sol.style.display = 'none';
    var fb = $('p-feedback'); if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
    document.querySelectorAll('.u-len').forEach(function (e) { e.textContent = uLen(); });
  }
  function checkPractice() {
    if (!state.p) return;
    var pc = partCompute(state.p), u = uLen(), tol = state.unit === 'in' ? 0.01 : 0.25;
    function near(id, valMm) { var e = $(id); if (!e) return false; var v = parseFloat(e.value); var ok = !isNaN(v) && Math.abs(v - toLen(valMm)) <= tol; e.className = 'qi-input ' + (ok ? 'pi-ok' : 'pi-err'); return ok; }
    var ok1 = near('p-ba', pc.BA), ok2 = near('p-bd', pc.BD), ok3 = near('p-flat', pc.flat);
    var sel = $('p-safe'), want = pc.safe ? 'safe' : 'risk', ok4 = sel && sel.value === want;
    if (sel) sel.className = 'qi-input ' + (ok4 ? 'pi-ok' : 'pi-err');
    var all = ok1 && ok2 && ok3 && ok4;
    state.pAttempts++; if (all) state.pScore++;
    setTxt('p-score', state.pScore); setTxt('p-attempts', state.pAttempts);
    var fb = $('p-feedback'); if (fb) { fb.className = 'feedback ' + (all ? 'ok' : 'err'); fb.textContent = all ? '✓ All correct — well done!' : 'Some answers are off. See the worked solution.'; }
    all ? playSuccess() : playError();
    var sol = $('p-solution'), sc = $('p-solution-content');
    if (sol && sc) { sol.style.display = '';
      sc.innerHTML = row('K-factor', pc.K.toFixed(3)) + row('Bend allowance', fmtLen(pc.BA) + ' ' + u) + row('Outside setback', fmtLen(pc.OSSB) + ' ' + u) + row('Bend deduction', fmtLen(pc.BD) + ' ' + u) + '<div class="sol-divider"></div>' + row('Flat length', fmtLen(pc.flat) + ' ' + u) + row('Min radius', fmtLen(pc.minR) + ' ' + u + ' → ' + (pc.safe ? 'Safe' : 'Crack risk')); }
  }
  function row(a, b) { return '<div class="sol-row"><span>' + a + '</span><span>' + b + '</span></div>'; }

  var QUIZ_SIZE = 5;
  function startQuiz() {
    if (state.quiz && !state.quiz.done) { showQuizQ(); return; }
    var qs = [];
    for (var i = 0; i < QUIZ_SIZE; i++) qs.push({ pt: randomPart(), askFlat: Math.random() < 0.5, ansFit: null });
    state.quiz = { qs: qs, idx: 0, score: 0, done: false };
    $('quiz-result').style.display = 'none'; $('quiz-panel').style.display = ''; showQuizQ();
  }
  function showQuizQ() {
    var Q = state.quiz, q = Q.qs[Q.idx], pc = partCompute(q.pt), u = uLen();
    setTxt('quiz-q-num', Q.idx + 1); setTxt('quiz-q-total', QUIZ_SIZE);
    var d = $('q-designation'); if (d) d.innerHTML = pc.m.name + ' &middot; T' + trim(q.pt.T) + ' &middot; R' + trim(q.pt.R) + ' &middot; ' + q.pt.A + '°';
    setTxt('q-value-label', (q.askFlat ? 'Flat length' : 'Bend allowance') + ' (' + u + ')');
    var inp = $('q-value-input'); if (inp) { inp.value = ''; inp.disabled = false; }
    document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (b) { b.className = 'answer-opt q-fit-btn'; b.disabled = false; });
    q.ansFit = null;
    var fb = $('quiz-feedback'); if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
    $('btn-quiz-submit').style.display = ''; $('btn-quiz-next').style.display = 'none';
  }
  function submitQuiz() {
    var Q = state.quiz, q = Q.qs[Q.idx], pc = partCompute(q.pt), inp = $('q-value-input');
    var want = q.askFlat ? pc.flat : pc.BA, tol = state.unit === 'in' ? 0.012 : 0.3;
    var v = parseFloat(inp.value), okVal = !isNaN(v) && Math.abs(v - toLen(want)) <= tol;
    var wantFit = pc.safe ? 'safe' : 'risk', okFit = q.ansFit === wantFit, pass = okVal && okFit;
    q.ansVal = v; q.correct = pass; q.wantVal = want; if (pass) Q.score++;
    document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (b) { b.disabled = true; if (b.dataset.value === wantFit) b.classList.add('q-ok'); else if (b.dataset.value === q.ansFit) b.classList.add('q-err'); });
    if (inp) inp.disabled = true;
    var fb = $('quiz-feedback'); if (fb) { fb.className = 'feedback ' + (pass ? 'ok' : 'err'); fb.innerHTML = (pass ? '✓ Correct! ' : '✗ ') + 'Answer: ' + (q.askFlat ? 'flat length' : 'bend allowance') + ' = ' + fmtLen(want) + ' ' + uLen() + ', radius is ' + (pc.safe ? 'safe' : 'a crack risk') + '.'; }
    pass ? playSuccess() : playError();
    $('btn-quiz-submit').style.display = 'none'; $('btn-quiz-next').style.display = '';
  }
  function nextQuiz() { var Q = state.quiz; if (Q.idx < QUIZ_SIZE - 1) { Q.idx++; showQuizQ(); } else { Q.done = true; showQuizResult(); } }
  function showQuizResult() {
    var Q = state.quiz; $('quiz-panel').style.display = 'none'; var box = $('quiz-result'); box.style.display = '';
    var sc = Q.score; setTxt('qr-score', sc + ' / ' + QUIZ_SIZE);
    var stars = sc >= 5 ? 3 : sc >= 3 ? 2 : sc >= 1 ? 1 : 0;
    $('qr-score').className = 'qr-score ' + (sc === 5 ? 'perfect' : sc >= 3 ? 'good' : 'poor');
    setTxt('qr-stars', '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars));
    setTxt('qr-verdict', sc === 5 ? 'Perfect!' : sc >= 3 ? 'Good effort!' : 'Keep practising.');
    $('qr-rows').innerHTML = Q.qs.map(function (q, i) { var pc = partCompute(q.pt);
      return '<div class="qr-row ' + (q.correct ? 'ok' : 'err') + '"><span class="qr-q">Q' + (i + 1) + '</span><span class="qr-desig">' + pc.m.name.split(' ')[0] + ' R' + trim(q.pt.R) + ' ' + q.pt.A + '°</span><span class="qr-given">you: ' + (isNaN(q.ansVal) ? '—' : q.ansVal) + '</span><span class="qr-correct">ans: ' + fmtLen(q.wantVal) + '</span><span class="qr-icon">' + (q.correct ? '✓' : '✗') + '</span></div>';
    }).join('');
  }

  /* ── Sound ── */
  function getCtx() { if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return state.audioCtx; }
  function playTone(freq, dur, type, vol) { var ac = getCtx(); if (!ac) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || 0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur); o.stop(ac.currentTime + dur); }
  function playClick() { playTone(760, 0.05, 'square', 0.03); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.08); setTimeout(function () { playTone(1180, 0.14, 'sine', 0.08); }, 110); }
  function playError() { playTone(280, 0.22, 'sawtooth', 0.05); }

  /* ── Exports ── */
  function exportPNG() {
    var src = $('bend-canvas'); var tmp = document.createElement('canvas'); tmp.width = src.width; tmp.height = src.height;
    var tc = tmp.getContext('2d'); tc.fillStyle = '#0d1117'; tc.fillRect(0, 0, tmp.width, tmp.height); tc.drawImage(src, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 12) fs = 12;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif'; tc.textAlign = 'right'; tc.textBaseline = 'bottom'; tc.fillStyle = 'rgba(255,255,255,0.28)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'bend_radius_' + trim(state.T) + 'x' + trim(state.R) + '.png'; a.click();
  }
  function exportCSV() {
    var c = compute(), u = uLen();
    var rows = [['Parameter', 'Value', 'Unit'], ['Material', mat().name, ''], ['Thickness T', fmtLen(state.T), u], ['Inside radius R', fmtLen(state.R), u], ['Bend angle', state.angle, 'deg'], ['K-factor', c.K.toFixed(3), ''], ['Neutral axis t', fmtLen(c.t), u], ['R/T', c.rt.toFixed(2), ''], ['Bend allowance', fmtLen(c.BA), u], ['Outside setback', fmtLen(c.OSSB), u], ['Bend deduction', fmtLen(c.BD), u], ['Flat length', fmtLen(c.flat), u], ['Springback Rf', fmtLen(c.Rf), u], ['Final angle', c.Af.toFixed(1), 'deg'], ['Overbend to', c.Aover.toFixed(1), 'deg'], ['Min radius', fmtLen(c.minR), u], ['Eff radius (die)', fmtLen(c.rEff), u], ['Min flange', fmtLen(c.minFlange), u], ['Air-bend force', fmtForceVal(c.tonnage), forceUnit()]];
    var blob = new Blob([rows.map(function (r) { return r.join(','); }).join('\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bend_radius_results.csv'; a.click();
  }
  function copyResults() {
    var c = compute(), u = uLen();
    var txt = 'Bend: T' + fmtLen(state.T) + ' R' + fmtLen(state.R) + ' ' + state.angle + '° ' + mat().name + ' | K=' + c.K.toFixed(3) + ' | BA=' + fmtLen(c.BA) + u + ' | BD=' + fmtLen(c.BD) + u + ' | Flat=' + fmtLen(c.flat) + u + ' | Rf=' + fmtLen(c.Rf) + u + ' | F=' + fmtForceVal(c.tonnage) + forceUnit();
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
  }

  /* ── Calc modal ── */
  function buildModal() {
    var c = compute(), u = uLen(), m = mat();
    function s(pill, title, formula, calc, result) { return '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num-pill">' + pill + '</span><span class="cs-title">' + title + '</span></div><div class="cs-formula">' + formula + '</div>' + (calc ? '<div class="cs-calc">' + calc + '</div>' : '') + '<div class="cs-result">' + result + '</div></div>'; }
    var html = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num-pill">Given</span><span class="cs-title">' + m.name + '</span></div><div class="cs-calc">T = ' + fmtLen(state.T) + ' ' + u + ', R = ' + fmtLen(state.R) + ' ' + u + ', A = ' + state.angle + '°, K = ' + c.K.toFixed(3) + ' (' + state.kMode + '), Y = ' + m.y + ' MPa, E = ' + m.e + ' GPa</div></div>';
    html += s('Step 1', 'Bend allowance', '\\[ BA = \\frac{\\pi}{180}\\,A\\,(R + K\\,T) \\]', 'BA = (π/180)·' + state.angle + '·(' + fmtLen(state.R) + ' + ' + c.K.toFixed(2) + '·' + fmtLen(state.T) + ')', '<strong>BA = ' + fmtLen(c.BA) + ' ' + u + '</strong>');
    html += s('Step 2', 'Outside setback', '\\[ OSSB = \\tan\\!\\frac{A}{2}\\,(R + T) \\]', 'OSSB = tan(' + (state.angle / 2) + '°)·(' + fmtLen(state.R) + ' + ' + fmtLen(state.T) + ')', '<strong>OSSB = ' + fmtLen(c.OSSB) + ' ' + u + '</strong>');
    html += s('Step 3', 'Bend deduction', '\\[ BD = 2\\,OSSB - BA \\]', 'BD = 2·' + fmtLen(c.OSSB) + ' − ' + fmtLen(c.BA), '<strong>BD = ' + fmtLen(c.BD) + ' ' + u + '</strong>');
    html += s('Step 4', 'Flat / blank length', '\\[ L_{flat} = (\\ell_A + \\ell_B) - BD \\]', 'L = (' + fmtLen(state.legA) + ' + ' + fmtLen(state.legB) + ') − ' + fmtLen(c.BD), '<strong>L = ' + fmtLen(c.flat) + ' ' + u + '</strong>');
    html += s('Step 5', 'Springback (Kalpakjian)', '\\[ \\frac{R_i}{R_f} = 4x^3 - 3x + 1,\\quad x = \\frac{R\\,Y}{E\\,T} \\]', 'x = (' + fmtLen(state.R) + '·' + m.y + ')/(' + (m.e * 1000) + '·' + fmtLen(state.T) + ') = ' + c.x.toFixed(4), '<strong>R_f = ' + fmtLen(c.Rf) + ' ' + u + ', final ≈ ' + c.Af.toFixed(1) + '°</strong>');
    html += s('Step 6', 'Min radius &amp; tonnage', '\\[ R_{min} = n\\,T,\\quad F = \\frac{k\\,\\sigma_u\\,L\\,T^2}{W} \\]', 'R_min = ' + m.minR + '·' + fmtLen(state.T) + '; F = 1.33·' + m.uts + '·T²/W', '<strong>R_min = ' + fmtLen(c.minR) + ' ' + u + ' (' + (c.minOK ? 'safe' : 'crack risk') + '), F ≈ ' + fmtForceVal(c.tonnage) + ' ' + forceUnit() + '</strong>');
    var body = $('calc-modal-body'); if (body) body.innerHTML = html;
    $('calc-modal').classList.add('active');
  }

  /* ── Custom material modal ── */
  function openCustom() { $('cm-err').textContent = ''; $('cm-modal').classList.add('active'); }
  function closeCustom() { $('cm-modal').classList.remove('active'); }
  function saveCustom() {
    var name = $('cm-name').value.trim(), uts = parseFloat($('cm-uts').value), y = parseFloat($('cm-yield').value), e = parseFloat($('cm-e').value), k = parseFloat($('cm-k').value), mr = parseFloat($('cm-minr').value);
    var err = $('cm-err'); function bad(msg) { err.textContent = msg; return false; }
    if (!name) return bad('Enter a material name.');
    if (isNaN(uts) || uts < 60 || uts > 1500) return bad('Tensile strength must be 60–1500 MPa.');
    if (isNaN(y) || y < 30 || y > 1400) return bad('Yield strength must be 30–1400 MPa.');
    if (isNaN(e) || e < 40 || e > 250) return bad('Young\'s modulus must be 40–250 GPa.');
    if (isNaN(k) || k < 0.3 || k > 0.5) return bad('K-factor must be 0.30–0.50.');
    if (isNaN(mr) || mr < 0 || mr > 6) return bad('Min radius multiple must be 0–6.');
    var id = 'cust_' + Object.keys(customMats).length;
    customMats[id] = { name: name, uts: uts, y: y, e: e, k: k, minR: mr };
    var sel = $('mat-sel'), opt = document.createElement('option'); opt.value = id; opt.textContent = name;
    sel.insertBefore(opt, sel.querySelector('option[value="custom"]'));
    selectMat(id); closeCustom();
  }

  function selectMat(key) {
    state.matKey = key; clearPreset(); syncControls(); render(); playClick();
  }

  function applyPreset(i) {
    var p = PRESETS[i]; state.matKey = p[0]; state.T = p[1]; state.R = p[2]; state.angle = p[3]; state.legA = p[4]; state.legB = p[5]; state.die = p[6];
    state.kMode = 'auto'; syncControls(); render();
  }

  /* ════════════════════════════════════════════════════════════════
     EVENT WIRING
     ════════════════════════════════════════════════════════════════ */
  function wire() {
    document.querySelectorAll('#mode-tabs .pill').forEach(function (b) { b.addEventListener('click', function () { playClick(); setMode(b.dataset.mode); }); });
    document.querySelectorAll('#unit-tabs .unit-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        if (state.unit === b.dataset.unit) return; state.unit = b.dataset.unit; playClick();
        document.querySelectorAll('#unit-tabs .unit-opt').forEach(function (x) { x.classList.toggle('active', x === b); });
        syncControls();
        if (state.mode === 'practice') newPractice();
        if (state.mode === 'quiz') { state.quiz = null; startQuiz(); }
        render();
      });
    });
    /* material dropdown */
    $('mat-sel').addEventListener('change', function () {
      if (this.value === 'custom') { this.value = state.matKey; openCustom(); return; }
      selectMat(this.value);
    });
    /* k-factor + lay + preset */
    $('k-mode-sel').addEventListener('change', function () { state.kMode = this.value; syncControls(); render(); playClick(); });
    $('k-input').addEventListener('input', function () { var v = parseFloat(this.value); if (isNaN(v)) return; state.kManual = Math.max(0.1, Math.min(0.5, v)); if (state.kMode === 'manual') render(); });
    $('lay-sel').addEventListener('change', function () { state.lay = this.value; render(); playClick(); });
    $('preset-sel').addEventListener('change', function () { if (this.value === '') return; applyPreset(parseInt(this.value, 10)); this.value = arguments.length ? this.value : ''; playClick(); });
    /* param sliders + steppers */
    Object.keys(PARAMS).forEach(function (key) {
      var p = PARAMS[key];
      $(p.slider).addEventListener('input', function () { readParam(key, this.value); $(p.step).value = (+this.value).toFixed(paramDec(p)); syncAngleMirror(key); clearPreset(); render(); });
      $(p.step).addEventListener('input', function () { readParam(key, this.value); var disp = p.len ? toLen(state[key]) : state[key]; $(p.slider).value = round6(disp); syncAngleMirror(key); clearPreset(); render(); });
    });
    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.dataset.target, p = PARAMS[key], dir = parseInt(b.dataset.dir, 10);
        var disp = (p.len ? toLen(state[key]) : state[key]) + dir * paramStepDisp(p);
        readParam(key, disp); setOneParam(key); syncAngleMirror(key); clearPreset(); render(); playClick();
      });
    });
    /* vertical angle slider */
    $('angle-slider').addEventListener('input', function () { state.angle = Math.max(1, Math.min(170, Math.round(parseFloat(this.value)))); setOneParam('angle'); setTxt('as-val', state.angle + '°'); clearPreset(); render(); });
    /* drawing toggles */
    var tg = { 'chk-dims': 'dims', 'chk-neutral': 'neutral', 'chk-equation': 'equation', 'chk-hatch': 'hatch', 'chk-spring': 'spring', 'chk-vdie': 'vdie', 'chk-grid': 'grid' };
    Object.keys(tg).forEach(function (id) { var e = $(id); if (e) e.addEventListener('change', function () { state.toggles[tg[id]] = e.checked; render(); }); });
    /* chart tabs */
    document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (b) { b.addEventListener('click', function () { state.chartView = b.dataset.view; document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (x) { x.classList.toggle('active', x === b); }); drawRight(); playClick(); }); });
    /* action bar */
    $('btn-calc').addEventListener('click', function () { buildModal(); playClick(); });
    $('btn-reset').addEventListener('click', function () { applyPreset(1); $('preset-sel').value = '1'; playClick(); });
    $('btn-export-csv').addEventListener('click', exportCSV);
    $('btn-export-png').addEventListener('click', exportPNG);
    $('calc-modal-close').addEventListener('click', function () { $('calc-modal').classList.remove('active'); });
    $('calc-modal').addEventListener('click', function (e) { if (e.target === this) this.classList.remove('active'); });
    /* explore tabs */
    document.querySelectorAll('#explore-tabs .pill').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('#explore-tabs .pill').forEach(function (x) { x.classList.toggle('active', x === b); }); renderExploreCards(b.dataset.cat); playClick(); }); });
    /* learn panels */
    $('learn-expand-all').addEventListener('click', function () { document.querySelectorAll('.learn-card-collapsible').forEach(function (d) { d.open = true; }); });
    $('learn-collapse-all').addEventListener('click', function () { document.querySelectorAll('.learn-card-collapsible').forEach(function (d) { d.open = false; }); });
    /* practice */
    $('btn-p-check').addEventListener('click', checkPractice);
    $('btn-p-new').addEventListener('click', function () { newPractice(); playClick(); });
    /* quiz */
    document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (b) { b.addEventListener('click', function () { if (b.disabled) return; state.quiz.qs[state.quiz.idx].ansFit = b.dataset.value; document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (x) { x.classList.toggle('selected', x === b); }); playClick(); }); });
    $('btn-quiz-submit').addEventListener('click', submitQuiz);
    $('btn-quiz-next').addEventListener('click', nextQuiz);
    $('btn-quiz-retry').addEventListener('click', function () { state.quiz = null; startQuiz(); playClick(); });
    /* custom modal */
    $('cm-modal-close').addEventListener('click', closeCustom);
    $('cm-cancel').addEventListener('click', closeCustom);
    $('cm-modal').addEventListener('click', function (e) { if (e.target === this) closeCustom(); });
    $('cm-save').addEventListener('click', saveCustom);
    /* context menu */
    var menu = $('canvas-ctxmenu');
    [$('bend-canvas'), $('flat-canvas')].forEach(function (cv) { cv.addEventListener('contextmenu', function (e) { e.preventDefault(); menu.style.display = 'block'; var mw = menu.offsetWidth || 180, mh = menu.offsetHeight || 160; menu.style.left = Math.min(e.clientX, window.innerWidth - mw - 8) + 'px'; menu.style.top = Math.min(e.clientY, window.innerHeight - mh - 8) + 'px'; }); });
    document.addEventListener('click', function () { menu.style.display = 'none'; });
    menu.querySelectorAll('.ctx-item').forEach(function (it) { it.addEventListener('click', function () { var a = it.dataset.act; if (a === 'copy') copyResults(); else if (a === 'png') exportPNG(); else if (a === 'csv') exportCSV(); else if (a === 'reset') { applyPreset(1); $('preset-sel').value = '1'; } menu.style.display = 'none'; }); });
    /* drag on cross-section → sweep angle */
    var cv = $('bend-canvas'), dragging = false, lastX = 0;
    cv.addEventListener('pointerdown', function (e) { dragging = true; lastX = e.clientX; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!dragging) return; var dx = e.clientX - lastX; lastX = e.clientX; state.angle = Math.max(1, Math.min(170, Math.round((state.angle + dx * 0.4) * 10) / 10)); setOneParam('angle'); setTxt('as-val', state.angle + '°'); clearPreset(); render(); });
    cv.addEventListener('pointerup', function () { dragging = false; });
    cv.addEventListener('pointercancel', function () { dragging = false; });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (state.mode === 'simulate') render(); }, 120); });
  }
  function syncAngleMirror(key) { if (key === 'angle') { var asl = $('angle-slider'); if (asl) asl.value = state.angle; setTxt('as-val', state.angle + '°'); } }

  function init() {
    syncControls();
    wire();
    renderExploreCards('basics');
    setMode('simulate');
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();


/* ── Printable K-factor / minimum-bend-radius chart ───────────────────────
   Clones the two data tables into #print-chart, prints, then tears down.
   Self-contained (no app state), so appending after the main IIFE is safe. */
(function () {
  'use strict';
  function build() {
    var host = document.getElementById('print-chart');
    if (!host) return false;
    var tables = Array.prototype.slice
      .call(document.querySelectorAll('.seo-article table'))
      .filter(function (t) { return /K-factor|bend radius/i.test(t.textContent); });
    if (!tables.length) return false;
    host.innerHTML = '<h2>Sheet Metal Bending Reference &mdash; K-Factor &amp; Minimum Bend Radius</h2>';
    tables.forEach(function (t) { host.appendChild(t.cloneNode(true)); });
    var p = document.createElement('p');
    p.className = 'src';
    p.textContent = 'Typical published guidance only — confirm against your material supplier’s '
                  + 'data before committing to tooling. NHIT VisualLab/tools/bend-radius/';
    host.appendChild(p);
    return true;
  }
  function onClick() {
    if (!build()) return;
    document.body.classList.add('printing');
    var done = function () {
      document.body.classList.remove('printing');
      var h = document.getElementById('print-chart');
      if (h) h.innerHTML = '';
      window.removeEventListener('afterprint', done);
    };
    window.addEventListener('afterprint', done);
    setTimeout(function () { window.print(); }, 30);
    setTimeout(done, 8000);          // fallback if afterprint never fires
  }
  function init() {
    var b = document.getElementById('btn-print-chart');
    if (b) b.addEventListener('click', onClick);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
