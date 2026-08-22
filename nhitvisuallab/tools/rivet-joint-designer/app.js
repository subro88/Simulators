/* ════════════════════════════════════════════════════════════════
   Rivet Joint Designer — app.js
   Design-bench UI. Internal state in SI (mm, N, MPa).
   Pure compute() + pure draw(). Display converts to mm/kN/MPa | in/kip/ksi.
   ════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var MM_PER_IN = 25.4;
  var KIP_PER_N = 0.000224809;   /* N → kip */
  var KSI_PER_MPA = 0.145037738; /* MPa → ksi */
  var STD_RIVET = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 42, 48];

  /* ── Material library — allowable stresses in MPa ── */
  var MATERIALS = {
    boiler:  { name: 'Boiler Steel',            st: 80,  tau: 60, sc: 120 },
    mild:    { name: 'Mild Steel (structural)', st: 100, tau: 75, sc: 150 },
    wrought: { name: 'Wrought Iron',            st: 70,  tau: 56, sc: 105 },
    ss304:   { name: 'Stainless 304',           st: 110, tau: 85, sc: 165 },
    al:      { name: 'Aluminium 2024',          st: 90,  tau: 62, sc: 140 },
    cu:      { name: 'Copper',                  st: 50,  tau: 40, sc: 90  }
  };
  var customMats = {};

  /* preset: [matKey, joint, rows, arrange, t, dMode, d, p, pb] (mm) */
  var PRESETS = [
    ['mild',   'lap',   1, 'chain',  10, 'auto', 20, 50, 30],
    ['boiler', 'lap',   2, 'zigzag', 12, 'auto', 22, 60, 30],
    ['mild',   'butt2', 3, 'chain',  16, 'auto', 24, 80, 40],
    ['boiler', 'butt2', 2, 'chain',  14, 'auto', 24, 70, 35]
  ];

  var state = {
    mode: 'simulate', unit: 'mm', matKey: 'boiler',
    joint: 'lap', rows: 2, arrange: 'zigzag',
    t: 12, dMode: 'auto', d: 22, p: 60, pb: 30,
    chartView: 'bars',
    toggles: { dims: true, center: true, load: true, section: true, hatch: true, grid: false },
    audioCtx: null, sim: null, lastTest: null,
    p_q: null, pScore: 0, pAttempts: 0, quiz: null
  };

  /* parameter config (ranges in mm) */
  var PARAMS = {
    t:  { slider: 'slider-t',  step: 'step-t',  min: 1,  max: 40,  stepMm: 0.5, stepIn: 0.02, dec: 1 },
    d:  { slider: 'slider-d',  step: 'step-d',  min: 6,  max: 48,  stepMm: 1,   stepIn: 0.05, dec: 0 },
    p:  { slider: 'slider-p',  step: 'step-p',  min: 10, max: 320, stepMm: 1,   stepIn: 0.05, dec: 0 },
    pb: { slider: 'slider-pb', step: 'step-pb', min: 10, max: 200, stepMm: 1,   stepIn: 0.05, dec: 0 }
  };

  /* IBR max-pitch coefficient C: by rivets-per-pitch and joint family */
  var C_LAP  = { 1: 1.31, 2: 2.62, 3: 3.47 };
  var C_BUTT = { 1: 1.53, 2: 3.06, 3: 4.05 };

  /* ── Unit helpers ── */
  function toLen(mm)  { return state.unit === 'in' ? mm / MM_PER_IN : mm; }
  function fromLen(v) { return state.unit === 'in' ? v * MM_PER_IN : v; }
  function uLen()     { return state.unit === 'in' ? 'in' : 'mm'; }
  function lp()       { return state.unit === 'in' ? 3 : 1; }
  function fmtLen(mm) { return toLen(mm).toFixed(lp()); }
  function fmtForce(N){ return state.unit === 'in' ? (N * KIP_PER_N).toFixed(2) : (N / 1000).toFixed(1); }
  function fromForceDisp(v){ return state.unit === 'in' ? v / KIP_PER_N : v * 1000; } /* display force → N */
  function uForce()   { return state.unit === 'in' ? 'kip' : 'kN'; }
  function fmtStress(mpa){ return state.unit === 'in' ? (mpa * KSI_PER_MPA).toFixed(1) : mpa.toFixed(0); }
  function uStress()  { return state.unit === 'in' ? 'ksi' : 'MPa'; }
  function mat() { return customMats[state.matKey] || MATERIALS[state.matKey]; }

  /* ── Rivet sizing ── */
  function unwinRaw(t) { return 6 * Math.sqrt(t); }
  function roundStd(v) {
    if (v <= STD_RIVET[0]) return STD_RIVET[0];
    for (var i = 0; i < STD_RIVET.length; i++) if (STD_RIVET[i] >= v - 1e-9) return STD_RIVET[i];
    return STD_RIVET[STD_RIVET.length - 1];
  }
  function ensureAutoD() { if (state.dMode === 'auto') state.d = roundStd(unwinRaw(state.t)); }

  /* ── PURE COMPUTE ── */
  function compute() {
    var t = state.t, d = state.d, p = state.p, pb = state.pb, m = mat(), n = state.rows;
    var dbl = (state.joint === 'butt2');
    var shearN = dbl ? 1.875 : 1;          /* double shear ≈ 1.875× (practical) */
    var As = Math.PI / 4 * d * d;
    var Pt = Math.max(p - d, 0) * t * m.st;          /* N */
    var Ps = n * shearN * As * m.tau;                /* N */
    var Pc = n * d * t * m.sc;                        /* N */
    var Psolid = p * t * m.st;                        /* N */
    var least = Math.min(Pt, Ps, Pc);
    var mode = (least === Pt) ? 'tearing' : (least === Ps) ? 'shearing' : 'crushing';
    var effT = Psolid > 0 ? Pt / Psolid * 100 : 0;   /* tearing efficiency */
    var effS = Psolid > 0 ? Ps / Psolid * 100 : 0;   /* shearing efficiency */
    var effC = Psolid > 0 ? Pc / Psolid * 100 : 0;   /* crushing efficiency */
    var eff = Math.min(effT, effS, effC);            /* joint efficiency = least */
    var margin = 1.5 * d;
    var pd = Math.sqrt(pb * pb + (p / 2) * (p / 2));
    var strap = (state.joint === 'butt1') ? 1.125 * t : (state.joint === 'butt2') ? 0.75 * t : 0;
    var Ctab = dbl ? C_BUTT : C_LAP;
    var C = Ctab[n] || Ctab[3];
    var pMax = C * t + 41.28;
    var pMin = 2 * d;
    var pOK = (p >= pMin - 1e-6) && (p <= pMax + 1e-6);
    return {
      d: d, dUnwin: unwinRaw(t), As: As, n: n, shearN: shearN, dbl: dbl,
      Pt: Pt, Ps: Ps, Pc: Pc, Psolid: Psolid, least: least, mode: mode,
      eff: eff, effT: effT, effS: effS, effC: effC,
      margin: margin, pd: pd, strap: strap, pMax: pMax, pMin: pMin, pOK: pOK, m: m
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
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -3); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function dimV(ctx, x, y0, y1, col, label) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    arrowHead(ctx, x, y0, -Math.PI / 2, col); arrowHead(ctx, x, y1, Math.PI / 2, col);
    ctx.restore();
    if (label) haloText(ctx, label, x + 6, (y0 + y1) / 2, '700 10px "Courier New", monospace', col, 'left');
  }
  function dimH(ctx, y, x0, x1, col, label, above) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    arrowHead(ctx, x0, y, Math.PI, col); arrowHead(ctx, x1, y, 0, col);
    ctx.restore();
    if (label) haloText(ctx, label, (x0 + x1) / 2, y + (above ? -8 : 10), '700 10px "Courier New", monospace', col);
  }
  function rivetHeadGrad(ctx, x, y, r) {
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.15, x, y, r);
    g.addColorStop(0, '#cfe0ee'); g.addColorStop(0.55, '#7f93ab'); g.addColorStop(1, '#4a5870');
    return g;
  }

  /* ════════════════════════════════════════════════════════════════
     LEFT CANVAS — joint plan + side section
     ════════════════════════════════════════════════════════════════ */
  function colXs(cx, c, sc) {
    /* returns array of column descriptors {x, side} (side: -1 left of seam, +1 right, 0 lap) */
    var rows = state.rows, pbpx = state.pb * sc, cols = [];
    if (state.joint === 'lap') {
      var span = (rows - 1) * pbpx, x0 = cx - span / 2, i;
      for (i = 0; i < rows; i++) cols.push({ x: x0 + i * pbpx, side: 0, ci: i });
    } else {
      var gapHalf = Math.max(state.d * 0.7 * sc, 10), j;
      for (j = 0; j < rows; j++) cols.push({ x: cx - gapHalf - j * pbpx, side: -1, ci: j });
      for (j = 0; j < rows; j++) cols.push({ x: cx + gapHalf + j * pbpx, side: 1, ci: j });
    }
    return cols;
  }

  function anchorCanvasControls(cv) {
    var simA = state.sim && state.sim.active;
    var _by = (cv.offsetTop + cv.clientHeight - 48) + 'px';
    var _top = (cv.offsetTop + 10) + 'px';
    var _rb = $('btn-reset'); if (_rb) { _rb.style.display = simA ? 'none' : ''; _rb.style.top = _by; _rb.style.bottom = 'auto'; }
    var _ut = $('unit-tabs'); if (_ut) _ut.style.display = simA ? 'none' : '';
    var _bl = $('canvas-bl'); if (_bl) _bl.style.top = simA ? _top : _by;
  }
  function drawJoint() {
    var cv = $('joint-canvas'); if (!cv || state.mode !== 'simulate') return;
    if (state.sim && state.sim.active) { anchorCanvasControls(cv); return; }
    var s0 = setupCanvas(cv, 420), ctx = s0.ctx, w = s0.w, h = s0.h;
    ctx.clearRect(0, 0, w, h);
    /* anchor floating controls inside the canvas bottom */
    anchorCanvasControls(cv);
    if (state.toggles.grid) drawGrid(ctx, w, h);

    var c = compute();
    var showSection = state.toggles.section;
    var planTop = 26, planBot = showSection ? h - 116 : h - 24;
    var planH = planBot - planTop, cx = w / 2, cyMid = (planTop + planBot) / 2;

    /* uniform scale (px/mm): fit a few pitches vertically and columns horizontally */
    var scV = (planH * 0.30) / Math.max(state.p, 1);
    var spanMM = (state.joint === 'lap')
      ? (state.rows - 1) * state.pb + 4 * c.margin
      : 2 * (state.d * 0.7 + (state.rows - 1) * state.pb) + 4 * c.margin;
    var scH = (w * 0.82) / Math.max(spanMM, 1);
    var sc = Math.max(0.25, Math.min(scV, scH, 7));
    var ppx = state.p * sc, rpx = Math.max((state.d / 2) * sc, 4);

    var cols = colXs(cx, c, sc);
    var leftX = Infinity, rightX = -Infinity, k;
    for (k = 0; k < cols.length; k++) { if (cols[k].x < leftX) leftX = cols[k].x; if (cols[k].x > rightX) rightX = cols[k].x; }
    var mpx = c.margin * sc;
    var plateL = Math.min(leftX - mpx - 6, w * 0.06);
    var plateR = Math.max(rightX + mpx + 6, w * 0.94);

    /* rivet Y positions (centre the pattern) */
    var nVis = Math.max(3, Math.floor((planH * 0.82) / ppx));
    if (nVis % 2 === 0) nVis += 1;
    var ys = [], y0 = cyMid - (nVis - 1) / 2 * ppx;
    for (k = 0; k < nVis; k++) ys.push(y0 + k * ppx);

    /* ── plate bodies ── */
    function plateBand(x0, x1, col1, col2) {
      var pgrad = ctx.createLinearGradient(0, planTop, 0, planBot);
      pgrad.addColorStop(0, col1); pgrad.addColorStop(1, col2);
      ctx.fillStyle = pgrad; ctx.fillRect(x0, planTop, x1 - x0, planH);
      ctx.strokeStyle = '#cdd6e3'; ctx.lineWidth = 1.3; ctx.strokeRect(x0, planTop, x1 - x0, planH);
    }
    if (state.joint === 'lap') {
      plateBand(plateL, plateR, '#8b97a8', '#5a6678');
      /* overlap shading in the middle */
      ctx.save(); ctx.fillStyle = 'rgba(77,143,176,0.16)';
      ctx.fillRect(leftX - mpx, planTop, (rightX + mpx) - (leftX - mpx), planH); ctx.restore();
    } else {
      plateBand(plateL, cx - 1, '#8b97a8', '#5a6678');
      plateBand(cx + 1, plateR, '#8b97a8', '#5a6678');
      /* cover strap band across the seam */
      var strapHalf = ((state.rows - 1) * state.pb + state.d * 0.7) * sc + mpx;
      ctx.save(); ctx.fillStyle = 'rgba(77,143,176,0.22)'; ctx.strokeStyle = 'rgba(77,143,176,0.7)'; ctx.lineWidth = 1.2;
      ctx.fillRect(cx - strapHalf, planTop, strapHalf * 2, planH);
      ctx.strokeRect(cx - strapHalf, planTop, strapHalf * 2, planH); ctx.restore();
      haloText(ctx, 'cover strap', cx, planTop + 11, '600 9px "Segoe UI", sans-serif', 'rgba(143,208,236,0.95)');
    }

    /* ── seam centre line ── */
    if (state.toggles.center) {
      ctx.save(); ctx.setLineDash([7, 5]); ctx.strokeStyle = 'rgba(159,178,200,0.6)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx, planTop - 4); ctx.lineTo(cx, planBot + 4); ctx.stroke(); ctx.restore();
    }

    /* ── rivets ── */
    function drawRivet(x, y) {
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, rpx, 0, 7); ctx.fillStyle = rivetHeadGrad(ctx, x, y, rpx); ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = '#3a4660'; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, Math.max(rpx * 0.5, 2), 0, 7); ctx.strokeStyle = 'rgba(20,26,40,0.55)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    for (k = 0; k < cols.length; k++) {
      var colx = cols[k].x, stag = (state.arrange === 'zigzag' && cols[k].ci % 2 === 1) ? ppx / 2 : 0;
      /* centre line through each column */
      if (state.toggles.center) {
        ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(77,143,176,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(colx, planTop); ctx.lineTo(colx, planBot); ctx.stroke(); ctx.restore();
      }
      for (var r = 0; r < ys.length; r++) {
        var ry = ys[r] + stag; if (ry < planTop + rpx || ry > planBot - rpx) continue;
        drawRivet(colx, ry);
      }
    }

    /* ── load arrows ── */
    if (state.toggles.load) {
      var ay = cyMid, alen = Math.min(40, plateL + 30);
      ctx.save(); ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(plateL + 2, ay); ctx.lineTo(plateL - alen, ay); ctx.stroke();
      arrowHead(ctx, plateL - alen, ay, Math.PI, '#ff7043');
      ctx.beginPath(); ctx.moveTo(plateR - 2, ay); ctx.lineTo(plateR + alen, ay); ctx.stroke();
      arrowHead(ctx, plateR + alen, ay, 0, '#ff7043'); ctx.restore();
      haloText(ctx, 'P', plateL - alen + 4, ay - 12, '700 12px "Courier New", monospace', '#ff7043', 'left');
      haloText(ctx, 'P', plateR + alen - 4, ay - 12, '700 12px "Courier New", monospace', '#ff7043', 'right');
    }

    /* ── dimensions ── */
    if (state.toggles.dims) {
      /* pitch: between two adjacent rivet centres of the reference column,
         with horizontal extension lines drawn out from each rivet centre */
      var refCol = cols[cols.length - 1], rcx = refCol.x;
      var rstag = (state.arrange === 'zigzag' && refCol.ci % 2 === 1) ? ppx / 2 : 0;
      var ry0 = null, ry1 = null;
      for (var pi = 0; pi < ys.length; pi++) { var yy = ys[pi] + rstag; if (yy < planTop + rpx || yy > planBot - rpx) continue; if (ry0 === null) ry0 = yy; else { ry1 = yy; break; } }
      if (ry0 !== null && ry1 !== null) {
        var dimX = Math.min(rcx + rpx + 34, w - 16);
        ctx.save(); ctx.strokeStyle = 'rgba(143,208,236,0.55)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(rcx, ry0); ctx.lineTo(dimX + 5, ry0); ctx.moveTo(rcx, ry1); ctx.lineTo(dimX + 5, ry1); ctx.stroke(); ctx.restore();
        dimV(ctx, dimX, ry0, ry1, '#8fd0ec', 'p ' + fmtLen(state.p));
      }
      /* back pitch between first two columns of one side */
      var twoCols = (state.joint === 'lap') ? [cols[0], cols[1]] : [cols[cols.length - 2], cols[cols.length - 1]];
      if (state.rows >= 2 && twoCols[0] && twoCols[1]) {
        var pby = planTop + 16;
        dimH(ctx, pby, twoCols[0].x, twoCols[1].x, '#f5c842', 'pb ' + fmtLen(state.pb), true);
      }
      /* margin from right edge to last column */
      dimH(ctx, planBot - 14, rightX, plateR, '#3ddc84', 'm ' + fmtLen(c.margin), true);
      /* rivet diameter callout on top-most rivet of first column */
      var d0 = cols[0], dy0 = ys[0] + ((state.arrange === 'zigzag' && d0.ci % 2 === 1) ? ppx / 2 : 0);
      if (dy0 > planTop + rpx) {
        ctx.save(); ctx.strokeStyle = '#4d8fb0'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(d0.x, dy0); ctx.lineTo(d0.x - rpx - 22, dy0 - rpx - 14); ctx.stroke(); ctx.restore();
        haloText(ctx, 'd ' + fmtLen(state.d), d0.x - rpx - 24, dy0 - rpx - 16, '700 10px "Courier New", monospace', '#8fd0ec', 'right');
      }
    }

    /* arrangement + joint label */
    var jl = (state.joint === 'lap' ? 'LAP' : state.joint === 'butt1' ? 'BUTT · 1 STRAP' : 'BUTT · 2 STRAP');
    var rl = (state.rows === 1 ? 'single' : state.rows === 2 ? 'double' : 'triple') + '-riveted · ' + state.arrange;
    haloText(ctx, jl, 10, 12, '700 10px "Segoe UI", sans-serif', 'rgba(159,178,200,0.85)', 'left');
    haloText(ctx, rl, w - 8, 12, '600 10px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'right');

    /* ── side section ── */
    if (showSection) drawSection(ctx, w, h, c);
  }

  function drawSection(ctx, w, h, c) {
    var top = h - 104, midY = top + 34, cx = w / 2;
    var t = state.t, d = state.d;
    /* scale section so plates are a sensible thickness */
    var sc = Math.min(18 / Math.max(t, 1), 4); if (sc < 1.2) sc = 1.2;
    var tpx = Math.max(t * sc, 8), dpx = Math.max(d * sc, 12);
    var spanHalf = Math.min(w * 0.40, 200);
    haloText(ctx, 'SIDE SECTION', 10, top - 4, '700 9px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'left');

    function hatchRect(x0, y0, ww, hh) {
      var g = ctx.createLinearGradient(0, y0, 0, y0 + hh);
      g.addColorStop(0, '#aeb9c9'); g.addColorStop(1, '#6b7686');
      ctx.fillStyle = g; ctx.fillRect(x0, y0, ww, hh);
      ctx.strokeStyle = '#cdd6e3'; ctx.lineWidth = 1.1; ctx.strokeRect(x0, y0, ww, hh);
      if (state.toggles.hatch) {
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, ww, hh); ctx.clip();
        ctx.strokeStyle = 'rgba(20,26,40,0.4)'; ctx.lineWidth = 1;
        for (var hx = x0 - hh; hx < x0 + ww; hx += 7) { ctx.beginPath(); ctx.moveTo(hx, y0 + hh); ctx.lineTo(hx + hh, y0); ctx.stroke(); }
        ctx.restore();
      }
    }

    if (state.joint === 'lap') {
      /* two plates overlapping: upper plate left, lower plate right, overlap in middle */
      var yUp = midY - tpx, yLo = midY;
      hatchRect(cx - spanHalf, yUp, spanHalf + dpx, tpx);              /* top plate (from left) */
      hatchRect(cx - dpx, yLo, spanHalf + dpx, tpx);                   /* bottom plate (to right) */
      drawRivetSection(ctx, cx - dpx * 0.2, yUp, yLo + tpx, dpx, true);
    } else {
      var yMain = midY - tpx / 2;
      hatchRect(cx - spanHalf, yMain, spanHalf - 4, tpx);             /* left main plate */
      hatchRect(cx + 4, yMain, spanHalf - 4, tpx);                    /* right main plate */
      var st = Math.max(c.strap * sc, 6);
      hatchRect(cx - spanHalf + 10, yMain - st, 2 * spanHalf - 20, st); /* top strap */
      var botStrap = (state.joint === 'butt2');
      if (botStrap) hatchRect(cx - spanHalf + 10, yMain + tpx, 2 * spanHalf - 20, st);
      drawRivetSection(ctx, cx + (state.d * 0.7 * 1.2), yMain - st, yMain + tpx + (botStrap ? st : 0), dpx, !botStrap);
      drawRivetSection(ctx, cx - (state.d * 0.7 * 1.2), yMain - st, yMain + tpx + (botStrap ? st : 0), dpx, !botStrap);
    }
    /* thickness dim */
    if (state.toggles.dims) {
      var tx = cx - spanHalf - 12, ty0 = midY - tpx, ty1 = midY + tpx;
      if (state.joint !== 'lap') { ty0 = midY - tpx / 2; ty1 = midY + tpx / 2; }
      dimV(ctx, tx, ty0, ty1, '#cdd6e3', 't ' + fmtLen(state.t));
    }
  }

  function drawRivetSection(ctx, x, yTop, yBot, dpx, headTop) {
    var r = dpx / 2, hh = Math.max(dpx * 0.32, 4);
    ctx.save();
    /* shank */
    var g = ctx.createLinearGradient(x - r, 0, x + r, 0);
    g.addColorStop(0, '#5a6b85'); g.addColorStop(0.5, '#9fb2c8'); g.addColorStop(1, '#5a6b85');
    ctx.fillStyle = g; ctx.fillRect(x - r, yTop, dpx, yBot - yTop);
    ctx.strokeStyle = '#33405c'; ctx.lineWidth = 1; ctx.strokeRect(x - r, yTop, dpx, yBot - yTop);
    /* heads (snap) */
    ctx.fillStyle = '#9fb2c8';
    function head(y, up) {
      ctx.beginPath();
      ctx.moveTo(x - r * 1.4, y);
      ctx.quadraticCurveTo(x, y + (up ? -hh * 2 : hh * 2), x + r * 1.4, y);
      ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#33405c'; ctx.stroke();
    }
    head(yTop, true); head(yBot, false);
    ctx.restore();
  }

  /* ════════════════════════════════════════════════════════════════
     RIGHT CANVAS — strength bars / failure modes
     ════════════════════════════════════════════════════════════════ */
  function drawChart() {
    var cv = $('chart-canvas'); if (!cv || state.mode !== 'simulate') return;
    if (state.chartView === 'fail') { drawFailModes(cv); return; }
    var s0 = setupCanvas(cv, 300), ctx = s0.ctx, w = s0.w, h = s0.h;
    ctx.clearRect(0, 0, w, h);
    if (state.toggles.grid) drawGrid(ctx, w, h);
    var c = compute();
    var bars = [
      { lab: 'Tearing', key: 'tearing', v: c.Pt, eff: c.effT, col: '#3ddc84' },
      { lab: 'Shearing', key: 'shearing', v: c.Ps, eff: c.effS, col: '#f5c842' },
      { lab: 'Crushing', key: 'crushing', v: c.Pc, eff: c.effC, col: '#c77dff' },
      { lab: 'Solid plate', key: 'solid', v: c.Psolid, eff: 100, col: '#4d8fb0' }
    ];
    var maxV = Math.max(c.Pt, c.Ps, c.Pc, c.Psolid, 1);
    var padL = 20, padR = 16, padT = 30, padB = 52;
    var plotW = w - padL - padR, plotH = h - padT - padB;
    var bw = plotW / bars.length * 0.6, gap = plotW / bars.length;
    haloText(ctx, 'STRENGTH PER PITCH', 10, 12, '700 10px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'left');
    haloText(ctx, 'η = ' + c.eff.toFixed(1) + '%', w - 10, 12, '700 12px "Courier New", monospace', '#8fd0ec', 'right');
    /* baseline */
    var baseY = padT + plotH;
    ctx.strokeStyle = 'rgba(159,178,200,0.4)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, baseY); ctx.lineTo(w - padR, baseY); ctx.stroke();
    bars.forEach(function (b, i) {
      var bx = padL + i * gap + (gap - bw) / 2, bh = (b.v / maxV) * plotH, by = baseY - bh;
      var governs = (b.key === c.mode);
      var grad = ctx.createLinearGradient(0, by, 0, baseY);
      grad.addColorStop(0, b.col); grad.addColorStop(1, 'rgba(20,26,40,0.2)');
      ctx.fillStyle = grad; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = governs ? '#ff5555' : b.col; ctx.lineWidth = governs ? 2.4 : 1.2; ctx.strokeRect(bx, by, bw, bh);
      if (governs) { ctx.save(); ctx.shadowColor = 'rgba(255,85,85,0.6)'; ctx.shadowBlur = 12; ctx.strokeRect(bx, by, bw, bh); ctx.restore(); }
      haloText(ctx, fmtForce(b.v) + ' ' + uForce(), bx + bw / 2, by - 9, '700 10px "Courier New", monospace', governs ? '#ff5555' : '#e1e7f3');
      /* efficiency for this mode, inside the bar near its top (light fill so the dark halo reads) */
      var effLab = (b.key === 'solid') ? '100%' : 'η ' + b.eff.toFixed(0) + '%';
      if (bh > 22) haloText(ctx, effLab, bx + bw / 2, by + 13, '800 11px "Courier New", monospace', governs ? '#ffd0d0' : '#ffffff');
      haloText(ctx, b.lab, bx + bw / 2, baseY + 14, '600 9.5px "Segoe UI", sans-serif', b.col);
      if (governs) haloText(ctx, '◄ governs', bx + bw / 2, baseY + 28, '700 9px "Segoe UI", sans-serif', '#ff5555');
    });
    haloText(ctx, 'η = Pₙ / P', w - 10, baseY + 28, '600 9px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'right');
  }

  function drawFailModes(cv) {
    var s0 = setupCanvas(cv, 300), ctx = s0.ctx, w = s0.w, h = s0.h;
    ctx.clearRect(0, 0, w, h);
    if (state.toggles.grid) drawGrid(ctx, w, h);
    var c = compute();
    haloText(ctx, 'FAILURE MODES', 10, 12, '700 10px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'left');
    var modes = [
      { key: 'tearing', lab: 'Tearing', v: c.Pt, eff: c.effT, col: '#3ddc84' },
      { key: 'shearing', lab: 'Shearing', v: c.Ps, eff: c.effS, col: '#f5c842' },
      { key: 'crushing', lab: 'Crushing', v: c.Pc, eff: c.effC, col: '#c77dff' }
    ];
    var rowH = (h - 30) / 3, y0 = 26;
    modes.forEach(function (mo, i) {
      var ry = y0 + i * rowH, governs = (mo.key === c.mode);
      ctx.save();
      ctx.fillStyle = governs ? 'rgba(255,85,85,0.07)' : 'rgba(255,255,255,0.02)';
      ctx.strokeStyle = governs ? '#ff5555' : 'var';
      ctx.fillRect(8, ry, w - 16, rowH - 8);
      ctx.strokeStyle = governs ? '#ff5555' : 'rgba(42,48,80,0.9)'; ctx.lineWidth = governs ? 2 : 1;
      ctx.strokeRect(8, ry, w - 16, rowH - 8);
      ctx.restore();
      var icx = 54, icy = ry + (rowH - 8) / 2;
      drawModeIcon(ctx, mo.key, icx, icy, mo.col, governs);
      haloText(ctx, mo.lab, 100, ry + 16, '700 12px "Segoe UI", sans-serif', mo.col, 'left');
      haloText(ctx, 'P = ' + fmtForce(mo.v) + ' ' + uForce(), 100, ry + 33, '600 11px "Courier New", monospace', '#e1e7f3', 'left');
      haloText(ctx, 'η = ' + mo.eff.toFixed(1) + '%', 100, ry + 49, '700 11px "Courier New", monospace', mo.col, 'left');
      if (governs) haloText(ctx, '◄ WEAKEST — governs', w - 16, icy, '700 10px "Segoe UI", sans-serif', '#ff5555', 'right');
    });
  }

  function drawModeIcon(ctx, key, x, y, col, governs) {
    ctx.save(); ctx.lineWidth = 2; ctx.strokeStyle = col; ctx.fillStyle = 'rgba(159,178,200,0.5)';
    if (key === 'tearing') {
      ctx.fillStyle = '#7d8a9c'; ctx.fillRect(x - 26, y - 12, 52, 24);
      ctx.strokeStyle = '#cdd6e3'; ctx.strokeRect(x - 26, y - 12, 52, 24);
      ctx.beginPath(); ctx.arc(x, y, 6, 0, 7); ctx.fillStyle = '#4a5870'; ctx.fill(); ctx.strokeStyle = '#33405c'; ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
      ctx.moveTo(x, y - 12); ctx.lineTo(x - 4, y - 6); ctx.lineTo(x + 3, y - 1);
      ctx.moveTo(x, y + 12); ctx.lineTo(x + 4, y + 6); ctx.lineTo(x - 3, y + 1); ctx.stroke();
    } else if (key === 'shearing') {
      ctx.fillStyle = '#9fb2c8'; ctx.fillRect(x - 22, y - 14, 44, 9);
      ctx.fillRect(x - 22, y + 5, 44, 9);
      ctx.strokeStyle = '#33405c'; ctx.strokeRect(x - 22, y - 14, 44, 9); ctx.strokeRect(x - 22, y + 5, 44, 9);
      ctx.strokeStyle = col; ctx.setLineDash([4, 3]); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x - 26, y); ctx.lineTo(x + 26, y); ctx.stroke(); ctx.setLineDash([]);
    } else {
      ctx.fillStyle = '#7d8a9c'; ctx.fillRect(x - 26, y - 12, 52, 24);
      ctx.strokeStyle = '#cdd6e3'; ctx.strokeRect(x - 26, y - 12, 52, 24);
      ctx.beginPath(); ctx.ellipse(x, y, 10, 7, 0, 0, 7); ctx.fillStyle = col; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  function render() { drawJoint(); drawChart(); updateResults(); updateLearnPanels(); }

  /* ════════════════════════════════════════════════════════════════
     LOAD TEST SIMULATION
     ════════════════════════════════════════════════════════════════ */
  function ease(x) { return 1 - (1 - x) * (1 - x); }
  function modeColor(m) { return m === 'tearing' ? '#3ddc84' : m === 'shearing' ? '#f5c842' : '#c77dff'; }

  function openLoadTest() {
    var c = compute(), uf = uForce();
    $('lt-err').textContent = '';
    $('lt-caps').innerHTML = 'Capacities per pitch &mdash; Tearing <b>' + fmtForce(c.Pt) + '</b>, Shearing <b>' + fmtForce(c.Ps) + '</b>, Crushing <b>' + fmtForce(c.Pc) + '</b> ' + uf + '.<br>Safe load = <b>' + fmtForce(c.least) + ' ' + uf + '</b> (governed by ' + c.mode + '). Enter a higher load to see it fail.';
    $('lt-load').value = ''; $('lt-load').placeholder = 'e.g. ' + fmtForce(c.least * 1.2);
    document.querySelectorAll('#lt-modal .u-force').forEach(function (e) { e.textContent = uf; });
    $('lt-modal').classList.add('active');
    setTimeout(function () { var i = $('lt-load'); if (i) i.focus(); }, 60);
  }
  function submitLoadTest() {
    var v = parseFloat($('lt-load').value);
    if (isNaN(v) || v <= 0) { $('lt-err').textContent = 'Enter a positive load.'; return; }
    $('lt-modal').classList.remove('active');
    runLoadTest(fromForceDisp(v));
  }
  function runLoadTest(N) {
    stopSim(true);
    var c = compute();
    state.sim = { active: true, applied: N, safe: c.least, mode: c.mode, fails: N > c.least + 1e-6, c: c, start: null, raf: null, done: false, snd: false };
    state.lastTest = { applied: N, safe: c.least, mode: c.mode, fails: N > c.least + 1e-6, fos: N > 0 ? c.least / N : 0, eff: c.eff, t: state.t, d: state.d, p: state.p };
    var btn = $('btn-loadtest'); if (btn) { btn.classList.add('testing'); btn.innerHTML = '&#9632; Stop Test'; }
    playClick();
    state.sim.raf = requestAnimationFrame(simStep);
  }
  function simStep(ts) {
    var s = state.sim; if (!s || !s.active) return;
    if (s.start == null) s.start = ts;
    drawSim((ts - s.start) / 1000);
  }
  function stopSim(silent) {
    var s = state.sim; if (!s) return;
    if (s.raf) cancelAnimationFrame(s.raf);
    state.sim = null;
    var btn = $('btn-loadtest'); if (btn) { btn.classList.remove('testing'); btn.classList.remove('done'); btn.innerHTML = '&#9889; Load Test'; }
    if (!silent && state.mode === 'simulate') render();
  }

  function drawSim(elapsed) {
    var cv = $('joint-canvas'); if (!cv) return;
    var s = state.sim; if (!s) return;
    var s0 = setupCanvas(cv, 420), ctx = s0.ctx, w = s0.w, h = s0.h;
    ctx.clearRect(0, 0, w, h);
    anchorCanvasControls(cv);
    if (state.toggles.grid) drawGrid(ctx, w, h);
    var loadDur = 1.0, failDur = 1.5;
    var crossFrac = s.fails ? Math.min(s.safe / Math.max(s.applied, 1e-6), 1) : 1;
    var tRamp = crossFrac * loadDur, phase, fp = 0, load;
    if (elapsed <= tRamp) { phase = 'load'; load = s.applied * Math.min(elapsed / loadDur, 1); }
    else if (s.fails) { phase = 'fail'; fp = Math.min((elapsed - tRamp) / failDur, 1); load = s.safe * (1 - 0.45 * ease(fp)); if (!s.snd) { s.snd = true; playCrack(); } }
    else { phase = 'hold'; load = s.applied; if (!s.snd) { s.snd = true; playSuccess(); } }
    drawSimScene(ctx, w, h, s, phase, fp, load);
    drawSimGauge(ctx, w, h, s, load, phase);
    drawSimBanner(ctx, w, h, s, phase, fp, load);
    var end = s.fails ? (tRamp + failDur + 0.6) : (loadDur + 1.0);
    if (elapsed < end) s.raf = requestAnimationFrame(simStep);
    else if (!s.done) { s.done = true; var b = $('btn-loadtest'); if (b) { b.classList.add('done'); b.innerHTML = '&#9632; Stop Test'; } }
  }

  /* ── elevation primitives ── */
  function simPlate(ctx, x, y, wd, ht) {
    var g = ctx.createLinearGradient(0, y, 0, y + ht);
    g.addColorStop(0, '#aeb9c9'); g.addColorStop(1, '#6b7686');
    ctx.fillStyle = g; ctx.fillRect(x, y, wd, ht);
    ctx.strokeStyle = '#cdd6e3'; ctx.lineWidth = 1.4; ctx.strokeRect(x, y, wd, ht);
    if (state.toggles.hatch) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, wd, ht); ctx.clip();
      ctx.strokeStyle = 'rgba(20,26,40,0.32)'; ctx.lineWidth = 1;
      for (var hx = x - ht; hx < x + wd; hx += 8) { ctx.beginPath(); ctx.moveTo(hx, y + ht); ctx.lineTo(hx + ht, y); ctx.stroke(); }
      ctx.restore();
    }
  }
  function simShank(ctx, x, y0, y1, r, ovx) {
    var g = ctx.createLinearGradient(x - r, 0, x + r, 0);
    g.addColorStop(0, '#5a6b85'); g.addColorStop(0.5, '#9fb2c8'); g.addColorStop(1, '#5a6b85');
    ctx.fillStyle = g; ctx.fillRect(x - r * ovx, y0, 2 * r * ovx, y1 - y0);
    ctx.strokeStyle = '#33405c'; ctx.lineWidth = 1; ctx.strokeRect(x - r * ovx, y0, 2 * r * ovx, y1 - y0);
  }
  function simHead(ctx, x, y, r, up) {
    ctx.fillStyle = '#9fb2c8'; ctx.beginPath(); ctx.moveTo(x - r * 1.5, y);
    ctx.quadraticCurveTo(x, y + (up ? -r * 1.4 : r * 1.4), x + r * 1.5, y);
    ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#33405c'; ctx.lineWidth = 1; ctx.stroke();
  }
  function simSeg(ctx, x, y0, y1, r, headTop, headBot, opt) {
    opt = opt || {}; var ovx = opt.ovx || 1, tilt = opt.tilt || 0;
    ctx.save();
    if (tilt) { var mid = (y0 + y1) / 2; ctx.translate(x, mid); ctx.rotate(tilt); ctx.translate(-x, -mid); }
    simShank(ctx, x, y0, y1, r, ovx);
    if (headTop) simHead(ctx, x, y0, r, true);
    if (headBot) simHead(ctx, x, y1, r, false);
    ctx.restore();
  }
  function cutMark(ctx, x, y, r) {
    ctx.save(); ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 2.4; ctx.beginPath();
    ctx.moveTo(x - r * 1.4, y - 2); ctx.lineTo(x - r * 0.4, y + 2); ctx.lineTo(x + r * 0.4, y - 2); ctx.lineTo(x + r * 1.4, y + 2); ctx.stroke();
    ctx.restore();
  }
  function jaggedEdge(ctx, x, y0, y1, dir, amp) {
    var n = 7, dy = (y1 - y0) / n; ctx.moveTo(x, y0);
    for (var i = 1; i <= n; i++) { var jx = x + (i % 2 ? dir * amp : 0); ctx.lineTo(jx, y0 + dy * i); }
  }
  function loadArrow(ctx, x, y, dir, len, lab) {
    ctx.save(); ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 2.6; ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + dir * len, y); ctx.stroke();
    arrowHead(ctx, x + dir * len, y, dir > 0 ? 0 : Math.PI, '#ff7043'); ctx.restore();
    if (lab) haloText(ctx, lab, x + dir * len, y - 12, '700 11px "Courier New", monospace', '#ff7043', dir > 0 ? 'right' : 'left');
  }

  function drawSimScene(ctx, w, h, s, phase, fp, load) {
    var c = s.c, mode = s.mode, dbl = c.dbl, n = c.n;
    var cx = w / 2, cy = 150, tpx = 26, r = Math.max(Math.min(tpx * 0.42, 11), 7);
    var plateLen = Math.min(w * 0.34, 240), ov = Math.min(w * 0.17, 92);
    var loadNorm = Math.min(load / Math.max(s.safe, 1), 1.2);
    var pull = 4 + 6 * loadNorm;
    var col = modeColor(mode);
    haloText(ctx, 'Load ' + fmtForce(load) + ' ' + uForce(), w - 10, 16, '700 14px "Courier New", monospace', phase === 'fail' ? '#ff5555' : phase === 'hold' ? '#3ddc84' : '#8fd0ec', 'right');
    var xs = (function () { var a = []; if (n <= 1) { a.push(cx); } else { var span = ov * 1.05; for (var i = 0; i < n; i++) a.push(cx - span / 2 + span * i / (n - 1)); } return a; })();

    if (mode === 'shearing') {
      var off = (phase === 'fail' ? 72 * ease(fp) : 0);   /* no slide until the rivets actually shear */
      if (dbl) {
        var sH = tpx * 0.66, mainY = cy - tpx / 2, topY = mainY - sH - 2, botY = mainY + tpx + 2;
        var sdx = -off * 0.5, mdx = off * 0.5;
        simPlate(ctx, cx - plateLen + sdx, topY, plateLen * 1.5, sH);          /* top strap (pulled left) */
        simPlate(ctx, cx - plateLen + sdx, botY, plateLen * 1.5, sH);          /* bottom strap */
        simPlate(ctx, cx - ov + mdx, mainY, plateLen * 1.2, tpx);             /* main plate (pulled right) */
        xs.forEach(function (x) {
          simShank(ctx, x + sdx, topY, mainY, r, 1); simHead(ctx, x + sdx, topY, r, true);
          simShank(ctx, x + mdx, mainY, mainY + tpx, r, 1);
          simShank(ctx, x + sdx, mainY + tpx, botY + sH, r, 1); simHead(ctx, x + sdx, botY + sH, r, false);
          if (phase === 'fail') { cutMark(ctx, x + (sdx + mdx) / 2, mainY, r); cutMark(ctx, x + (sdx + mdx) / 2, mainY + tpx, r); }
        });
        haloText(ctx, 'double shear — 2 planes', cx, mainY + tpx + sH + 22, '700 10px "Segoe UI", sans-serif', col);
      } else {
        var tY = cy - tpx, bY = cy;
        simPlate(ctx, cx - plateLen - off, tY, plateLen + ov, tpx);            /* top plate (pulled left) */
        simPlate(ctx, cx - ov, bY, plateLen + ov, tpx);                       /* bottom plate */
        xs.forEach(function (x) {
          simShank(ctx, x - off, tY, cy, r, 1); simHead(ctx, x - off, tY, r, true);
          simShank(ctx, x, cy, cy + tpx, r, 1); simHead(ctx, x, cy + tpx, r, false);
          if (phase === 'fail') cutMark(ctx, x - off / 2, cy, r);
        });
        haloText(ctx, 'single shear — 1 plane', cx, cy + tpx + 22, '700 10px "Segoe UI", sans-serif', col);
      }
      loadArrow(ctx, cx - plateLen - off - 6, cy, -1, 30 + 24 * loadNorm, 'P');
      loadArrow(ctx, cx + (dbl ? plateLen * 0.6 : plateLen) + 6, cy, 1, 30 + 24 * loadNorm, 'P');

    } else if (mode === 'tearing') {
      var open = phase === 'fail' ? 64 * ease(fp) : 0;
      var tY = cy - tpx, bY = cy;
      simPlate(ctx, cx - plateLen, tY, plateLen + ov, tpx);                  /* top plate (stays aligned) */
      var xLast = xs[xs.length - 1];
      /* bottom plate: left body up to the outer hole, right fragment torn away to the right on failure */
      simPlate(ctx, cx - ov, bY, (xLast - (cx - ov)) + r, tpx);
      simPlate(ctx, xLast + r + open, bY, (cx + plateLen) - xLast + 6, tpx);
      if (open > 0.5) {
        ctx.save(); ctx.strokeStyle = '#ff5555'; ctx.fillStyle = 'rgba(255,85,85,0.12)'; ctx.lineWidth = 2;
        ctx.beginPath(); jaggedEdge(ctx, xLast + r, bY, bY + tpx, 1, 5); ctx.stroke();
        ctx.beginPath(); jaggedEdge(ctx, xLast + r + open, bY, bY + tpx, -1, 5); ctx.stroke();
        ctx.restore();
        haloText(ctx, 'plate torn through hole line', cx, bY + tpx + 22, '700 10px "Segoe UI", sans-serif', col);
      }
      xs.forEach(function (x) { simSeg(ctx, x, tY, cy + tpx, r, true, true); });   /* intact rivet through both plates */
      loadArrow(ctx, cx - plateLen - 6, cy, -1, 30 + 24 * loadNorm, 'P');
      loadArrow(ctx, cx + plateLen + open + 6, cy, 1, 30 + 24 * loadNorm, 'P');

    } else { /* crushing */
      var def = phase === 'fail' ? ease(fp) : 0;
      var tY = cy - tpx, bY = cy;
      simPlate(ctx, cx - plateLen, tY, plateLen + ov, tpx);
      simPlate(ctx, cx - ov, bY, plateLen + ov, tpx);
      xs.forEach(function (x) {
        if (def > 0) { /* bearing pile-up wedge on the loaded (right) side of the hole */
          ctx.save(); ctx.fillStyle = 'rgba(199,125,255,' + (0.25 + 0.45 * def) + ')';
          ctx.beginPath(); ctx.moveTo(x + r, tY); ctx.lineTo(x + r + 12 * def, cy); ctx.lineTo(x + r, cy + tpx); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        simSeg(ctx, x, tY, cy + tpx, r, true, true, { ovx: 1 + 0.7 * def, tilt: 0.2 * def });
      });
      if (def > 0.05) haloText(ctx, 'rivet bears into / elongates the hole', cx, cy + tpx + 22, '700 10px "Segoe UI", sans-serif', col);
      loadArrow(ctx, cx - plateLen - 6, cy, -1, 30 + 24 * loadNorm, 'P');
      loadArrow(ctx, cx + plateLen + 6, cy, 1, 30 + 24 * loadNorm, 'P');
    }
  }

  function drawSimGauge(ctx, w, h, s, load, phase) {
    var c = s.c, gx = 26, gw = w - 52, gy = 300, gh = 14;
    var maxV = Math.max(s.applied, c.Pt, c.Ps, c.Pc) * 1.08;
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'var'; ctx.strokeStyle = 'rgba(159,178,200,0.3)'; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
    var fillW = gw * Math.min(load / maxV, 1);
    var fcol = phase === 'fail' ? '#ff5555' : phase === 'hold' ? '#3ddc84' : '#4d8fb0';
    ctx.fillStyle = fcol; ctx.fillRect(gx, gy, fillW, gh);
    ctx.restore();
    [['t', c.Pt, '#3ddc84'], ['s', c.Ps, '#f5c842'], ['c', c.Pc, '#c77dff']].forEach(function (m) {
      var mx = gx + gw * Math.min(m[1] / maxV, 1);
      var gov = (m[1] === s.safe);
      ctx.save(); ctx.strokeStyle = gov ? '#ff5555' : m[2]; ctx.lineWidth = gov ? 2.2 : 1.4;
      ctx.beginPath(); ctx.moveTo(mx, gy - 5); ctx.lineTo(mx, gy + gh + 5); ctx.stroke(); ctx.restore();
      haloText(ctx, 'P' + m[0], mx, gy - 11, '700 9px "Courier New", monospace', gov ? '#ff5555' : m[2]);
    });
    haloText(ctx, 'capacity gauge — markers Pt / Ps / Pc, fill = applied load', gx, gy + gh + 13, '600 9px "Segoe UI", sans-serif', 'rgba(159,178,200,0.7)', 'left');
  }

  function wrapText(ctx, txt, x, y, maxW, lh, font, fill) {
    ctx.save(); ctx.font = font; ctx.fillStyle = fill; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var words = txt.split(' '), line = '', yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + ' ';
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = words[i] + ' '; yy += lh; }
      else line = test;
    }
    ctx.fillText(line, x, yy); ctx.restore(); return yy + lh;
  }
  function drawSimBanner(ctx, w, h, s, phase, fp, load) {
    var c = s.c, uf = uForce(), by = 330, bh = h - by - 8, bx = 12, bw = w - 24;
    var failing = s.fails, settled = s.done || (phase === 'fail' && fp >= 1) || (phase === 'hold');
    var accent = !failing ? '#3ddc84' : modeColor(s.mode);
    ctx.save();
    ctx.fillStyle = failing ? 'rgba(255,85,85,0.08)' : 'rgba(61,220,132,0.08)';
    ctx.strokeStyle = failing ? 'rgba(255,85,85,0.5)' : 'rgba(61,220,132,0.5)';
    ctx.lineWidth = 1.4; ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke(); ctx.restore();
    var tx = bx + 12, ty = by + 10;
    if (phase === 'load') {
      haloText(ctx, '⏱ Ramping load… ' + fmtForce(load) + ' / ' + fmtForce(s.applied) + ' ' + uf, tx, ty + 6, '700 12px "Segoe UI", sans-serif', '#8fd0ec', 'left');
      return;
    }
    if (!failing) {
      var fos = s.applied > 0 ? s.safe / s.applied : 0;
      haloText(ctx, '✓ SAFE — the joint holds', tx, ty + 4, '800 13px "Segoe UI", sans-serif', '#3ddc84', 'left');
      wrapText(ctx, 'Applied ' + fmtForce(s.applied) + ' ' + uf + ' ≤ safe load ' + fmtForce(s.safe) + ' ' + uf + ' (governed by ' + s.mode + ', η = ' + c.eff.toFixed(1) + '%). Factor of safety = ' + fos.toFixed(2) + '.', tx, ty + 24, bw - 24, 15, '600 11px "Segoe UI", sans-serif', '#cdd6e3');
      return;
    }
    /* failure */
    var why = s.mode === 'tearing'
      ? 'The plate tore across the rivet-hole line: its net section (p−d)·t·σt had the lowest capacity, so it gave way before the rivets sheared or crushed.'
      : s.mode === 'shearing'
        ? 'The rivets sheared' + (c.dbl ? ' on two planes' : '') + ': the shear area ' + c.n + (c.dbl ? '×1.875' : '') + '·(π/4)d²·τ had the lowest capacity, failing before the plate tore or crushed.'
        : 'The rivets crushed the plate at the holes: the bearing area n·d·t·σc had the lowest capacity, failing before the plate tore or the rivets sheared.';
    haloText(ctx, '✕ ' + s.mode.toUpperCase() + ' FAILURE at ' + fmtForce(s.safe) + ' ' + uf, tx, ty + 4, '800 13px "Segoe UI", sans-serif', '#ff5555', 'left');
    var ny = wrapText(ctx, why, tx, ty + 24, bw - 24, 15, '600 11px "Segoe UI", sans-serif', '#e1e7f3');
    haloText(ctx, 'Applied ' + fmtForce(s.applied) + ' ' + uf + ' > safe ' + fmtForce(s.safe) + ' ' + uf + ' · weakest mode (η = ' + c.eff.toFixed(1) + '%).', tx, ny + 2, '600 10px "Courier New", monospace', modeColor(s.mode), 'left');
  }

  /* ════════════════════════════════════════════════════════════════
     DASHBOARD / BADGES / STEPS
     ════════════════════════════════════════════════════════════════ */
  function setTxt(id, v) { var e = $(id); if (e) e.textContent = v; }

  function updateResults() {
    var c = compute();
    document.querySelectorAll('.u-len').forEach(function (e) { e.textContent = uLen(); });
    document.querySelectorAll('.u-force').forEach(function (e) { e.textContent = uForce(); });
    document.querySelectorAll('.u-str').forEach(function (e) { e.textContent = uStress(); });
    var m = mat();
    setTxt('sc-st', fmtStress(m.st)); setTxt('sc-tau', fmtStress(m.tau)); setTxt('sc-sc', fmtStress(m.sc));
    setTxt('res-dun', fmtLen(c.dUnwin)); setTxt('res-n', c.n);
    setTxt('res-pt', fmtForce(c.Pt)); setTxt('res-ps', fmtForce(c.Ps)); setTxt('res-pc', fmtForce(c.Pc));
    setTxt('res-p', fmtForce(c.Psolid)); setTxt('res-eff', c.eff.toFixed(1));
    setTxt('res-efft', c.effT.toFixed(1)); setTxt('res-effs', c.effS.toFixed(1)); setTxt('res-effc', c.effC.toFixed(1));
    var effEls = { tearing: 'res-efft', shearing: 'res-effs', crushing: 'res-effc' };
    [['res-efft', 'mode-tearing'], ['res-effs', 'mode-shearing'], ['res-effc', 'mode-crushing']].forEach(function (p) {
      var e = $(p[0]); if (!e) return; e.className = 'readout-value ' + p[1];
      var card = e.closest('.readout-card'); if (card) card.classList.toggle('gov', effEls[c.mode] === p[0]);
    });
    setTxt('res-safe', fmtForce(c.least));
    setTxt('res-margin', fmtLen(c.margin)); setTxt('res-pd', fmtLen(c.pd));
    setTxt('res-pmax', fmtLen(c.pMax)); setTxt('res-shear', c.dbl ? 'double' : 'single');
    setTxt('res-strap', state.joint === 'lap' ? '—' : fmtLen(c.strap));
    var modeEl = $('res-mode'); if (modeEl) { modeEl.textContent = c.mode; modeEl.className = 'readout-value res-mode mode-' + c.mode; }
    var pdEl = $('res-pd').closest('.readout-card'); if (pdEl) pdEl.style.opacity = (state.arrange === 'zigzag') ? '1' : '0.45';
    /* badges */
    setTxt('rb-eff', c.eff.toFixed(1)); setTxt('rb-pt', fmtForce(c.Pt)); setTxt('rb-ps', fmtForce(c.Ps)); setTxt('rb-pc', fmtForce(c.Pc));
    setTxt('rb-pt-u', uForce()); setTxt('rb-ps-u', uForce()); setTxt('rb-pc-u', uForce());
    var sb = $('status-badge'); if (sb) { sb.textContent = c.mode; sb.className = 'graph-badge status-badge ' + (c.mode === 'tearing' ? 'ok' : c.mode === 'shearing' ? 'warn' : 'bad'); }
    /* pitch validity flag */
    var pGrp = $('slider-p') ? $('slider-p').closest('.sim-slider-group') : null;
    if (pGrp) pGrp.classList.toggle('danger', !c.pOK);
    var pFlag = $('p-min-flag');
    if (pFlag) {
      if (state.p < c.pMin - 1e-6) pFlag.textContent = '⚠ below min pitch ' + fmtLen(c.pMin) + ' ' + uLen() + ' (2d)';
      else if (state.p > c.pMax + 1e-6) pFlag.textContent = '⚠ above leak-tight max ' + fmtLen(c.pMax) + ' ' + uLen();
      else pFlag.textContent = '';
    }
    var sc = $('step-content'); if (sc) sc.innerHTML = buildSteps(c);
  }

  function step(n, title, text) {
    return '<div class="calc-step"><div class="cs-num">' + n + '</div><div class="cs-body"><div class="cs-title">' + title + '</div><div class="cs-text">' + text + '</div></div></div>';
  }
  function buildSteps(c) {
    var u = uLen(), uf = uForce(), us = uStress(), m = mat(), h = '';
    h += step(1, 'Inputs', 't = <code>' + fmtLen(state.t) + ' ' + u + '</code>, joint = <code>' + jointName() + '</code>, ' + rowsName() + ' ' + state.arrange + ', material = <code>' + m.name + '</code> (σt=' + fmtStress(m.st) + ', τ=' + fmtStress(m.tau) + ', σc=' + fmtStress(m.sc) + ' ' + us + ')');
    h += step(2, 'Rivet diameter (Unwin)', 'd = 6√t = 6√' + fmtLen(state.t) + ' = <code>' + fmtLen(c.dUnwin) + ' ' + u + '</code> → standard <code>' + fmtLen(state.d) + ' ' + u + '</code>' + (state.dMode === 'manual' ? ' (manual)' : ''));
    h += step(3, 'Tearing of plate', 'Pt = (p − d)·t·σt = (' + fmtLen(state.p) + ' − ' + fmtLen(state.d) + ')·' + fmtLen(state.t) + '·σt = <code>' + fmtForce(c.Pt) + ' ' + uf + '</code>');
    h += step(4, 'Shearing of rivets', 'Ps = n·' + (c.dbl ? '1.875·' : '') + '(π/4)d²·τ = ' + c.n + (c.dbl ? '·1.875' : '') + '·' + c.As.toFixed(0) + '·τ = <code>' + fmtForce(c.Ps) + ' ' + uf + '</code>' + (c.dbl ? ' (double shear)' : ''));
    h += step(5, 'Crushing of rivets', 'Pc = n·d·t·σc = ' + c.n + '·' + fmtLen(state.d) + '·' + fmtLen(state.t) + '·σc = <code>' + fmtForce(c.Pc) + ' ' + uf + '</code>');
    h += step(6, 'Efficiencies', 'P = p·t·σt = <code>' + fmtForce(c.Psolid) + ' ' + uf + '</code>. Per mode: η<sub>t</sub> = <code>' + c.effT.toFixed(1) + '%</code>, η<sub>s</sub> = <code>' + c.effS.toFixed(1) + '%</code>, η<sub>c</sub> = <code>' + c.effC.toFixed(1) + '%</code>. Joint η = least = <code>' + c.eff.toFixed(1) + '%</code> → governed by <strong>' + c.mode + '</strong>');
    return h;
  }
  function jointName() { return state.joint === 'lap' ? 'lap' : state.joint === 'butt1' ? 'butt (1 strap)' : 'butt (2 strap)'; }
  function rowsName() { return state.rows === 1 ? 'single-riveted' : state.rows === 2 ? 'double-riveted' : 'triple-riveted'; }

  /* ── KaTeX panels ── */
  var _cache = { eq: '', coach: '' };
  function updateLearnPanels() {
    var c = compute(), u = uLen(), uf = uForce(), m = mat();
    var shTerm = c.dbl ? '1.875\\,n\\,\\tfrac{\\pi}{4}d^2\\tau' : 'n\\,\\tfrac{\\pi}{4}d^2\\tau';
    var eq = ''
      + '<div class="eq-line">\\( P_t = (p - d)\\,t\\,\\sigma_t = ' + fmtForce(c.Pt) + '\\,\\mathrm{' + uf + '} \\)</div>'
      + '<div class="eq-line">\\( P_s = ' + shTerm + ' = ' + fmtForce(c.Ps) + '\\,\\mathrm{' + uf + '} \\)</div>'
      + '<div class="eq-line">\\( P_c = n\\,d\\,t\\,\\sigma_c = ' + fmtForce(c.Pc) + '\\,\\mathrm{' + uf + '} \\)</div>'
      + '<div class="eq-line">\\( P = p\\,t\\,\\sigma_t = ' + fmtForce(c.Psolid) + '\\,\\mathrm{' + uf + '} \\)</div>'
      + '<div class="eq-line">\\( \\eta_t = \\tfrac{P_t}{P} = ' + c.effT.toFixed(1) + '\\%,\\;\\; \\eta_s = \\tfrac{P_s}{P} = ' + c.effS.toFixed(1) + '\\%,\\;\\; \\eta_c = \\tfrac{P_c}{P} = ' + c.effC.toFixed(1) + '\\% \\)</div>'
      + '<div class="eq-line">\\( \\eta = \\min(\\eta_t,\\eta_s,\\eta_c) = ' + c.eff.toFixed(1) + '\\% \\)</div>';
    var eqEl = $('lp-eq-body'); if (eqEl && eq !== _cache.eq) { eqEl.innerHTML = eq; _cache.eq = eq; }

    var coach = '<ul class="coach-list">';
    coach += '<li><strong>Governing mode: ' + c.mode + '.</strong> ' + (c.mode === 'tearing' ? 'The plate is the weak link — increase pitch or reduce hole size to raise tearing strength.' : c.mode === 'shearing' ? 'The rivets shear first — add a row, enlarge d, or use a double-strap (double-shear) butt joint.' : 'The rivets crush the plate — increase plate thickness or rivet count.') + '</li>';
    var bal = Math.abs(c.Pt - c.Ps) / Math.max(c.Pt, c.Ps, 1) * 100;
    coach += '<li><strong>Tear / shear balance.</strong> Pt = ' + fmtForce(c.Pt) + ', Ps = ' + fmtForce(c.Ps) + ' ' + uf + ' (' + bal.toFixed(0) + '% apart). ' + (bal < 12 ? 'Well balanced — near the most efficient pitch.' : c.Pt > c.Ps ? 'Plate over-strong — pitch could be reduced, or add rivet area.' : 'Rivets over-strong — pitch can grow to lift efficiency.') + '</li>';
    coach += '<li><strong>Efficiency ' + c.eff.toFixed(1) + '%.</strong> Solid plate carries ' + fmtForce(c.Psolid) + ' ' + uf + ' per pitch; this joint carries ' + fmtForce(c.least) + ' ' + uf + '.</li>';
    coach += '<li><strong>Pitch window.</strong> Min ≈ 2d = ' + fmtLen(c.pMin) + ' ' + u + '; leak-tight max (IBR) = ' + fmtLen(c.pMax) + ' ' + u + '. ' + (c.pOK ? 'Current pitch is within limits.' : 'Current pitch is out of range.') + '</li>';
    coach += '<li><strong>Shear plane: ' + (c.dbl ? 'double' : 'single') + '.</strong> ' + (c.dbl ? 'Double-strap butt joint — each rivet shears on two planes (≈1.875×).' : 'Single shear — a double-strap butt joint would roughly double the shearing strength.') + '</li>';
    if (state.arrange === 'zigzag') coach += '<li><strong>Diagonal pitch ' + fmtLen(c.pd) + ' ' + u + '.</strong> Staggered rows give a longer tearing path than chain riveting.</li>';
    coach += '</ul>';
    var cEl = $('lp-coach-body'); if (cEl && coach !== _cache.coach) { cEl.innerHTML = coach; _cache.coach = coach; }
  }

  /* ════════════════════════════════════════════════════════════════
     CONTROL SYNC
     ════════════════════════════════════════════════════════════════ */
  function paramStepDisp(p) { return state.unit === 'in' ? p.stepIn : p.stepMm; }
  function paramDec(p) { return state.unit === 'in' ? 3 : p.dec; }
  function round6(v) { return Math.round(v * 1e6) / 1e6; }
  function setOneParam(key) {
    var p = PARAMS[key], sl = $(p.slider), si = $(p.step); if (!sl || !si) return;
    var dMin = toLen(p.min), dMax = toLen(p.max), dStep = paramStepDisp(p), dVal = toLen(state[key]), dec = paramDec(p);
    [sl, si].forEach(function (el) { el.min = round6(dMin); el.max = round6(dMax); el.step = dStep; });
    sl.value = round6(dVal); si.value = (+dVal).toFixed(dec);
    var dis = (key === 'd' && state.dMode === 'auto');
    sl.disabled = dis; si.disabled = dis;
  }
  function syncControls() {
    Object.keys(PARAMS).forEach(setOneParam);
    var ms = $('mat-sel'); if (ms) ms.value = state.matKey;
    var js = $('joint-sel'); if (js) js.value = state.joint;
    var rs = $('rows-sel'); if (rs) rs.value = state.rows;
    var as = $('arrange-sel'); if (as) as.value = state.arrange;
    var ds = $('d-mode-sel'); if (ds) ds.value = state.dMode;
    var df = $('d-mode-flag'); if (df) { df.className = 'r-min-flag info'; df.textContent = state.dMode === 'auto' ? 'Auto: d = 6√t rounded to standard' : ''; }
    document.querySelectorAll('.u-len').forEach(function (e) { e.textContent = uLen(); });
  }
  function clearPreset() { var ps = $('preset-sel'); if (ps) ps.value = ''; }

  function readParam(key, rawDisp) {
    var p = PARAMS[key], v = parseFloat(rawDisp); if (isNaN(v)) return;
    var mm = fromLen(v);
    mm = Math.max(p.min, Math.min(p.max, mm));
    state[key] = mm;
  }

  /* ════════════════════════════════════════════════════════════════
     MODE SWITCHING
     ════════════════════════════════════════════════════════════════ */
  function setMode(m) {
    if (state.sim) stopSim(true);
    state.mode = m;
    var map = { simulate: 'sim-wrapper', explore: 'explore-wrapper', practice: 'practice-wrapper', quiz: 'quiz-wrapper' };
    Object.keys(map).forEach(function (k) { var e = $(map[k]); if (e) e.style.display = (k === m ? '' : 'none'); });
    document.querySelectorAll('#mode-tabs .pill').forEach(function (b) { b.classList.toggle('active', b.dataset.mode === m); });
    if (m === 'practice' && !state.p_q) newPractice();
    if (m === 'quiz') startQuiz();
    if (m === 'simulate') render();
  }

  /* ════════════════════════════════════════════════════════════════
     EXPLORE CARDS
     ════════════════════════════════════════════════════════════════ */
  var EXPLORE = {
    basics: [
      { h: 'Parts of a rivet', p: 'A rivet has a head, a cylindrical shank (diameter d) and a tail that is hammered into a second head to clamp the plates. The shank carries the shear and bearing load.', note: 'Standard sizes: 12, 14, 16, 18, 20, 22, 24 mm…' },
      { h: 'Pitch terms', p: 'Pitch (p) is the spacing along a row; back pitch (pb) is the spacing between rows; diagonal pitch (pd) joins staggered rows; margin (m) is the edge distance.', formula: 'm = 1.5·d', note: 'These four spacings fully position the rivets.' },
      { h: 'Load path', p: 'Tension in one plate transfers through the rivets in shear (and bearing on the hole) into the other plate. The drilled holes weaken the plate in tension.', note: 'A joint is only as strong as its weakest of tear / shear / crush.' }
    ],
    types: [
      { h: 'Lap joint', p: 'The plates overlap and rivets pass through both. Simple but the load line is offset, so the joint tends to bend.', note: 'Single, double or triple rows of rivets in the overlap.' },
      { h: 'Butt joint', p: 'Plates meet edge to edge and one or two cover straps bridge the seam. A double strap keeps the load line straight.', note: 'Double-strap puts rivets in double shear.' },
      { h: 'Single / double / triple', p: 'Describes the number of rivet rows on each side of the seam. More rows raise the shearing and crushing strength.', note: 'Boiler joints often use triple-riveted double-strap butt joints.' },
      { h: 'Chain vs zigzag', p: 'Chain rows sit opposite each other; zigzag rows are staggered by half a pitch for a longer diagonal tearing path.', formula: 'pd = √(pb² + (p/2)²)', note: 'Zigzag gives a slightly higher efficiency.' }
    ],
    formulas: [
      { h: 'Tearing strength', p: 'Plate tears across the row through the holes. Only one hole is removed per pitch.', formula: 'Pt = (p − d)·t·σt', note: 'p=60, d=16, t=10, σt=80 → 35.2 kN.' },
      { h: 'Shearing strength', p: 'Rivets shear across their section. Multiply by ~1.875 for double shear.', formula: 'Ps = n·(π/4)d²·τ', note: 'n=2, d=16, τ=60 → 24.1 kN (single shear).' },
      { h: 'Crushing strength', p: 'The rivet bears on the plate edge of the hole over the projected area d·t.', formula: 'Pc = n·d·t·σc', note: 'n=2, d=16, t=10, σc=120 → 38.4 kN.' },
      { h: 'Efficiency', p: 'Ratio of the weakest joint strength to the solid-plate strength over one pitch.', formula: 'η = min(Pt,Ps,Pc) / (p·t·σt)', note: 'least 24.1 / 48 = 50.2%.' }
    ],
    design: [
      { h: "Unwin's formula", p: 'Sizes the rivet from plate thickness for plates over about 8 mm, then round up to a standard rivet.', formula: 'd = 6·√t  (mm)', note: 't=16 → d=24 mm.' },
      { h: 'Balancing the modes', p: 'Maximum efficiency comes from making the tearing strength of the plate equal to the shearing strength of the rivets.', note: 'Tune pitch until Pt ≈ Ps.' },
      { h: 'Pitch limits', p: 'Pitch must exceed about 2d so plate metal remains between holes, and stay below the leak-tight maximum.', formula: 'p(max) = C·t + 41.28 mm', note: 'C depends on rivets/pitch and joint type.' },
      { h: 'Margin', p: 'Keep the edge distance at about 1.5d so the plate does not shear out at the edge of the hole.', formula: 'm = 1.5·d', note: 'Too small a margin tears the edge.' }
    ],
    standards: [
      { h: 'Boiler codes', p: 'The Indian Boiler Regulations (IBR) and ASME BPVC set the allowable stresses, pitch limits and joint efficiencies for pressure vessels.', note: 'Efficiency drives the required plate thickness for a given pressure.' },
      { h: 'Caulking & fullering', p: 'Plate edges and rivet heads are burred over with a caulking or fullering tool to close gaps and make the joint leak-tight.', note: 'Used on steam boilers and tanks.' },
      { h: 'Hot vs cold riveting', p: 'Rivets up to ~10 mm may be driven cold; larger rivets are heated so they shrink on cooling and clamp the plates tightly.', note: 'Shrinkage adds friction grip to the joint.' }
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
  function randomJoint() {
    var mk = pick(Object.keys(MATERIALS));
    var joint = pick(['lap', 'butt1', 'butt2']);
    var rows = pick([1, 2, 3]);
    var t = pick([6, 8, 10, 12, 14, 16]);
    var d = roundStd(unwinRaw(t));
    var p = Math.round((pick([3.2, 3.6, 4, 4.5, 5]) * d) / 2) * 2;
    return { mk: mk, joint: joint, rows: rows, t: t, d: d, p: p, arrange: pick(['chain', 'zigzag']) };
  }
  function jointCompute(j) {
    var m = MATERIALS[j.mk], n = j.rows, dbl = (j.joint === 'butt2'), shearN = dbl ? 1.875 : 1;
    var As = Math.PI / 4 * j.d * j.d;
    var Pt = Math.max(j.p - j.d, 0) * j.t * m.st, Ps = n * shearN * As * m.tau, Pc = n * j.d * j.t * m.sc;
    var Psolid = j.p * j.t * m.st, least = Math.min(Pt, Ps, Pc);
    var mode = (least === Pt) ? 'tearing' : (least === Ps) ? 'shearing' : 'crushing';
    return { m: m, Pt: Pt, Ps: Ps, Pc: Pc, Psolid: Psolid, least: least, mode: mode, eff: Psolid > 0 ? least / Psolid * 100 : 0, dbl: dbl, n: n };
  }
  function newPractice() {
    state.p_q = randomJoint(); var pc = jointCompute(state.p_q), u = uLen(), us = uStress();
    var j = state.p_q;
    var q = $('p-question'); if (q) q.innerHTML = '<strong>' + pc.m.name + '</strong> (σt=' + fmtStress(pc.m.st) + ', τ=' + fmtStress(pc.m.tau) + ', σc=' + fmtStress(pc.m.sc) + ' ' + us + '). ' + jName(j.joint) + ', ' + (j.rows === 1 ? 'single' : j.rows === 2 ? 'double' : 'triple') + '-riveted ' + j.arrange + '. t = <strong>' + fmtLen(j.t) + ' ' + u + '</strong>, d = <strong>' + fmtLen(j.d) + ' ' + u + '</strong>, p = <strong>' + fmtLen(j.p) + ' ' + u + '</strong>.';
    ['p-pt', 'p-ps', 'p-pc', 'p-eff'].forEach(function (id) { var e = $(id); if (e) { e.value = ''; e.className = 'qi-input'; } });
    var sol = $('p-solution'); if (sol) sol.style.display = 'none';
    var fb = $('p-feedback'); if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
    document.querySelectorAll('.u-len').forEach(function (e) { e.textContent = uLen(); });
    document.querySelectorAll('.u-force').forEach(function (e) { e.textContent = uForce(); });
  }
  function jName(j) { return j === 'lap' ? 'Lap joint' : j === 'butt1' ? 'Butt (single strap)' : 'Butt (double strap)'; }
  function checkPractice() {
    if (!state.p_q) return;
    var pc = jointCompute(state.p_q), u = uLen(), uf = uForce();
    var tolF = state.unit === 'in' ? 0.3 : 1.2, tolE = 1.5;
    function nearF(id, valN) { var e = $(id); if (!e) return false; var v = parseFloat(e.value); var ok = !isNaN(v) && Math.abs(v - parseFloat(fmtForce(valN))) <= tolF; e.className = 'qi-input ' + (ok ? 'pi-ok' : 'pi-err'); return ok; }
    function nearE(id, val) { var e = $(id); if (!e) return false; var v = parseFloat(e.value); var ok = !isNaN(v) && Math.abs(v - val) <= tolE; e.className = 'qi-input ' + (ok ? 'pi-ok' : 'pi-err'); return ok; }
    var ok1 = nearF('p-pt', pc.Pt), ok2 = nearF('p-ps', pc.Ps), ok3 = nearF('p-pc', pc.Pc), ok4 = nearE('p-eff', pc.eff);
    var all = ok1 && ok2 && ok3 && ok4;
    state.pAttempts++; if (all) state.pScore++;
    setTxt('p-score', state.pScore); setTxt('p-attempts', state.pAttempts);
    var fb = $('p-feedback'); if (fb) { fb.className = 'feedback ' + (all ? 'ok' : 'err'); fb.textContent = all ? '✓ All correct — well designed!' : 'Some answers are off. See the worked solution.'; }
    all ? playSuccess() : playError();
    var sol = $('p-solution'), sc = $('p-solution-content');
    if (sol && sc) {
      sol.style.display = '';
      sc.innerHTML = row('Tearing Pt', fmtForce(pc.Pt) + ' ' + uf) + row('Shearing Ps', fmtForce(pc.Ps) + ' ' + uf) + row('Crushing Pc', fmtForce(pc.Pc) + ' ' + uf) + '<div class="sol-divider"></div>' + row('Solid plate P', fmtForce(pc.Psolid) + ' ' + uf) + row('Governing mode', pc.mode) + row('Efficiency η', pc.eff.toFixed(1) + ' %');
    }
  }
  function row(a, b) { return '<div class="sol-row"><span>' + a + '</span><span>' + b + '</span></div>'; }

  var QUIZ_SIZE = 5;
  function startQuiz() {
    if (state.quiz && !state.quiz.done) { showQuizQ(); return; }
    var qs = [];
    for (var i = 0; i < QUIZ_SIZE; i++) qs.push({ j: randomJoint(), askEff: Math.random() < 0.5, ansMode: null });
    state.quiz = { qs: qs, idx: 0, score: 0, done: false };
    $('quiz-result').style.display = 'none'; $('quiz-panel').style.display = ''; showQuizQ();
  }
  function showQuizQ() {
    var Q = state.quiz, q = Q.qs[Q.idx], u = uLen();
    setTxt('quiz-q-num', Q.idx + 1); setTxt('quiz-q-total', QUIZ_SIZE);
    var d = $('q-designation'); if (d) d.innerHTML = jShort(q.j.joint) + ' &middot; t' + fmtLen(q.j.t) + ' &middot; d' + fmtLen(q.j.d) + ' &middot; p' + fmtLen(q.j.p) + ' &middot; ' + q.j.rows + 'r';
    setTxt('q-value-label', (q.askEff ? 'Efficiency (%)' : 'Safe load / pitch (' + uForce() + ')'));
    var inp = $('q-value-input'); if (inp) { inp.value = ''; inp.disabled = false; }
    document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (b) { b.className = 'answer-opt q-fit-btn'; b.disabled = false; });
    q.ansMode = null;
    var fb = $('quiz-feedback'); if (fb) { fb.textContent = ''; fb.className = 'feedback'; }
    $('btn-quiz-submit').style.display = ''; $('btn-quiz-next').style.display = 'none';
  }
  function jShort(j) { return j === 'lap' ? 'Lap' : j === 'butt1' ? 'Butt-1' : 'Butt-2'; }
  function submitQuiz() {
    var Q = state.quiz, q = Q.qs[Q.idx], pc = jointCompute(q.j), inp = $('q-value-input');
    var want = q.askEff ? pc.eff : parseFloat(fmtForce(pc.least));
    var tol = q.askEff ? 1.5 : (state.unit === 'in' ? 0.3 : 1.2);
    var v = parseFloat(inp.value), okVal = !isNaN(v) && Math.abs(v - want) <= tol;
    var okMode = q.ansMode === pc.mode, pass = okVal && okMode;
    q.ansVal = v; q.correct = pass; q.wantVal = want; q.wantMode = pc.mode; if (pass) Q.score++;
    document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (b) { b.disabled = true; if (b.dataset.value === pc.mode) b.classList.add('q-ok'); else if (b.dataset.value === q.ansMode) b.classList.add('q-err'); });
    if (inp) inp.disabled = true;
    var fb = $('quiz-feedback'); if (fb) { fb.className = 'feedback ' + (pass ? 'ok' : 'err'); fb.innerHTML = (pass ? '✓ Correct! ' : '✗ ') + 'Governing mode: <strong>' + pc.mode + '</strong>; ' + (q.askEff ? 'η = ' + pc.eff.toFixed(1) + '%' : 'safe load = ' + fmtForce(pc.least) + ' ' + uForce()) + '.'; }
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
    $('qr-rows').innerHTML = Q.qs.map(function (q, i) {
      return '<div class="qr-row ' + (q.correct ? 'ok' : 'err') + '"><span class="qr-q">Q' + (i + 1) + '</span><span class="qr-desig">' + jShort(q.j.joint) + ' p' + fmtLen(q.j.p) + '</span><span class="qr-given">you: ' + (isNaN(q.ansVal) ? '—' : q.ansVal) + '</span><span class="qr-correct">ans: ' + (typeof q.wantVal === 'number' ? q.wantVal.toFixed(1) : q.wantVal) + ' (' + q.wantMode + ')</span><span class="qr-icon">' + (q.correct ? '✓' : '✗') + '</span></div>';
    }).join('');
  }

  /* ── Sound ── */
  function getCtx() { if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return state.audioCtx; }
  function playTone(freq, dur, type, vol) { var ac = getCtx(); if (!ac) return; var o = ac.createOscillator(), g = ac.createGain(); o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || 0.05; o.connect(g); g.connect(ac.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur); o.stop(ac.currentTime + dur); }
  function playClick() { playTone(620, 0.05, 'square', 0.03); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.08); setTimeout(function () { playTone(1180, 0.14, 'sine', 0.08); }, 110); }
  function playError() { playTone(280, 0.22, 'sawtooth', 0.05); }
  function playCrack() { playTone(150, 0.32, 'sawtooth', 0.11); setTimeout(function () { playTone(90, 0.28, 'square', 0.08); }, 70); }

  /* ── Exports ── */
  function exportPNG() {
    var src = $('joint-canvas'); var tmp = document.createElement('canvas'); tmp.width = src.width; tmp.height = src.height;
    var tc = tmp.getContext('2d'); tc.fillStyle = '#0d1117'; tc.fillRect(0, 0, tmp.width, tmp.height); tc.drawImage(src, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 12) fs = 12;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif'; tc.textAlign = 'right'; tc.textBaseline = 'bottom'; tc.fillStyle = 'rgba(255,255,255,0.28)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'rivet_joint_' + state.joint + '_t' + state.t + '.png'; a.click();
  }
  function exportCSV() {
    var c = compute(), u = uLen(), uf = uForce(), us = uStress(), m = mat();
    var rows = [['Parameter', 'Value', 'Unit'],
      ['Joint type', jointName(), ''], ['Rivet rows', state.rows, ''], ['Arrangement', state.arrange, ''],
      ['Material', m.name, ''], ['Allowable tensile', fmtStress(m.st), us], ['Allowable shear', fmtStress(m.tau), us], ['Allowable crushing', fmtStress(m.sc), us],
      ['Plate thickness t', fmtLen(state.t), u], ['Rivet diameter d', fmtLen(state.d), u], ['Unwin diameter', fmtLen(c.dUnwin), u],
      ['Pitch p', fmtLen(state.p), u], ['Back pitch pb', fmtLen(state.pb), u], ['Diagonal pitch pd', fmtLen(c.pd), u], ['Margin m', fmtLen(c.margin), u],
      ['Rivets per pitch n', c.n, ''], ['Shear mode', c.dbl ? 'double' : 'single', ''],
      ['Tearing Pt', fmtForce(c.Pt), uf], ['Shearing Ps', fmtForce(c.Ps), uf], ['Crushing Pc', fmtForce(c.Pc), uf],
      ['Solid plate P', fmtForce(c.Psolid), uf], ['Safe load / pitch', fmtForce(c.least), uf],
      ['Tearing efficiency', c.effT.toFixed(1), '%'], ['Shearing efficiency', c.effS.toFixed(1), '%'], ['Crushing efficiency', c.effC.toFixed(1), '%'],
      ['Governing mode', c.mode, ''], ['Joint efficiency', c.eff.toFixed(1), '%'],
      ['Strap thickness', state.joint === 'lap' ? '—' : fmtLen(c.strap), u], ['Max pitch (IBR)', fmtLen(c.pMax), u]];
    var blob = new Blob([rows.map(function (r) { return r.join(','); }).join('\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rivet_joint_results.csv'; a.click();
  }
  function copyResults() {
    var c = compute(), uf = uForce();
    var txt = 'Rivet joint: ' + jointName() + ' ' + state.rows + '-row ' + state.arrange + ' | t' + fmtLen(state.t) + ' d' + fmtLen(state.d) + ' p' + fmtLen(state.p) + ' ' + uLen() + ' | Pt=' + fmtForce(c.Pt) + ' Ps=' + fmtForce(c.Ps) + ' Pc=' + fmtForce(c.Pc) + ' ' + uf + ' | η=' + c.eff.toFixed(1) + '% (' + c.mode + ')';
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
  }

  /* ════════════════════════════════════════════════════════════════
     PDF TECHNICAL REPORT (print-window → Save as PDF)
     ════════════════════════════════════════════════════════════════ */
  function rptEsc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function rptKpi(label, val, unit, accent) {
    return '<div class="kpi' + (accent ? ' kpi-gov' : '') + '"><div class="lbl">' + label + '</div><div class="val">' + val + '<span class="unit"> ' + unit + '</span></div></div>';
  }

  /* Light-theme joint layout (plan) for clean printing */
  function buildJointImage() {
    var W = 720, H = 420, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    var c = compute(), cx = W / 2, top = 40, bot = H - 36, midY = (top + bot) / 2, planH = bot - top;
    var scV = (planH * 0.3) / Math.max(state.p, 1);
    var spanMM = (state.joint === 'lap') ? (state.rows - 1) * state.pb + 4 * c.margin : 2 * (state.d * 0.7 + (state.rows - 1) * state.pb) + 4 * c.margin;
    var scH = (W * 0.8) / Math.max(spanMM, 1), sc = Math.max(0.25, Math.min(scV, scH, 7));
    var ppx = state.p * sc, rpx = Math.max(state.d / 2 * sc, 4), pbpx = state.pb * sc;
    var cols = [];
    if (state.joint === 'lap') { var sp = (state.rows - 1) * pbpx, x0 = cx - sp / 2, i; for (i = 0; i < state.rows; i++) cols.push({ x: x0 + i * pbpx, ci: i }); }
    else { var gh = Math.max(state.d * 0.7 * sc, 10), j; for (j = 0; j < state.rows; j++) cols.push({ x: cx - gh - j * pbpx, ci: j }); for (j = 0; j < state.rows; j++) cols.push({ x: cx + gh + j * pbpx, ci: j }); }
    var leftX = Infinity, rightX = -Infinity, k; for (k = 0; k < cols.length; k++) { leftX = Math.min(leftX, cols[k].x); rightX = Math.max(rightX, cols[k].x); }
    var mpx = c.margin * sc, plateL = Math.min(leftX - mpx - 6, W * 0.06), plateR = Math.max(rightX + mpx + 6, W * 0.94);
    var nVis = Math.max(3, Math.floor(planH * 0.82 / ppx)); if (nVis % 2 === 0) nVis += 1;
    var ys = [], y0v = midY - (nVis - 1) / 2 * ppx; for (k = 0; k < nVis; k++) ys.push(y0v + k * ppx);
    /* plates */
    ctx.fillStyle = '#dfe5ee'; ctx.strokeStyle = '#7a8aa0'; ctx.lineWidth = 1.4;
    if (state.joint === 'lap') {
      ctx.fillRect(plateL, top, plateR - plateL, planH); ctx.strokeRect(plateL, top, plateR - plateL, planH);
      ctx.fillStyle = 'rgba(77,143,176,0.14)'; ctx.fillRect(leftX - mpx, top, (rightX + mpx) - (leftX - mpx), planH);
    } else {
      ctx.fillRect(plateL, top, (cx - 1) - plateL, planH); ctx.strokeRect(plateL, top, (cx - 1) - plateL, planH);
      ctx.fillRect(cx + 1, top, plateR - (cx + 1), planH); ctx.strokeRect(cx + 1, top, plateR - (cx + 1), planH);
      var sHalf = ((state.rows - 1) * state.pb + state.d * 0.7) * sc + mpx;
      ctx.fillStyle = 'rgba(77,143,176,0.16)'; ctx.strokeStyle = '#4d8fb0'; ctx.fillRect(cx - sHalf, top, sHalf * 2, planH); ctx.strokeRect(cx - sHalf, top, sHalf * 2, planH);
    }
    /* rivets */
    for (k = 0; k < cols.length; k++) {
      var colx = cols[k].x, stag = (state.arrange === 'zigzag' && cols[k].ci % 2 === 1) ? ppx / 2 : 0;
      for (var rI = 0; rI < ys.length; rI++) { var ry = ys[rI] + stag; if (ry < top + rpx || ry > bot - rpx) continue;
        ctx.beginPath(); ctx.arc(colx, ry, rpx, 0, 7); ctx.fillStyle = '#9fb0c6'; ctx.fill(); ctx.strokeStyle = '#5a6b85'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(colx, ry, Math.max(rpx * 0.45, 2), 0, 7); ctx.strokeStyle = '#41506b'; ctx.stroke(); }
    }
    /* dims */
    ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.textBaseline = 'middle';
    function dimv(x, ya, yb, col, lab) { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, ya); ctx.lineTo(x, yb); ctx.stroke(); ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(lab, x + 5, (ya + yb) / 2); }
    function dimh(y, xa, xb, col, lab) { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke(); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(lab, (xa + xb) / 2, y - 9); }
    var refC = cols[cols.length - 1], refX = Math.min(refC.x + rpx + 30, W - 12);
    var rst = (state.arrange === 'zigzag' && refC.ci % 2 === 1) ? ppx / 2 : 0, py0 = null, py1 = null;
    for (var pj = 0; pj < ys.length; pj++) { var yv = ys[pj] + rst; if (yv < top + rpx || yv > bot - rpx) continue; if (py0 === null) py0 = yv; else { py1 = yv; break; } }
    if (py0 !== null && py1 !== null) {
      ctx.save(); ctx.strokeStyle = 'rgba(43,108,176,0.5)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(refC.x, py0); ctx.lineTo(refX + 5, py0); ctx.moveTo(refC.x, py1); ctx.lineTo(refX + 5, py1); ctx.stroke(); ctx.restore();
      dimv(refX, py0, py1, '#2b6cb0', 'p ' + fmtLen(state.p) + ' ' + uLen());
    }
    if (state.rows >= 2) { var two = state.joint === 'lap' ? [cols[0], cols[1]] : [cols[cols.length - 2], cols[cols.length - 1]]; if (two[0] && two[1]) dimh(top + 16, two[0].x, two[1].x, '#b7791f', 'pb ' + fmtLen(state.pb)); }
    dimh(bot - 14, rightX, plateR, '#2f855a', 'm ' + fmtLen(c.margin));
    ctx.fillStyle = '#37474f'; ctx.font = '700 13px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.fillText('Joint layout (plan) — ' + jointName() + ', ' + rowsName() + ' ' + state.arrange, 10, 16);
    return cv.toDataURL('image/png');
  }

  /* Light-theme strength comparison bar chart */
  function buildBarsImage() {
    var W = 720, H = 420, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    var c = compute();
    var bars = [{ lab: 'Tearing', key: 'tearing', v: c.Pt, eff: c.effT, col: '#2f855a' }, { lab: 'Shearing', key: 'shearing', v: c.Ps, eff: c.effS, col: '#b7791f' }, { lab: 'Crushing', key: 'crushing', v: c.Pc, eff: c.effC, col: '#805ad5' }, { lab: 'Solid plate', key: 'solid', v: c.Psolid, eff: 100, col: '#2b6cb0' }];
    var maxV = Math.max(c.Pt, c.Ps, c.Pc, c.Psolid, 1), padL = 30, padR = 20, padT = 48, padB = 64;
    var plotH = H - padT - padB, gap = (W - padL - padR) / bars.length, bw = gap * 0.56, baseY = padT + plotH;
    ctx.fillStyle = '#37474f'; ctx.font = '700 13px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('Strength per pitch (' + uForce() + ') & per-mode efficiency', 10, 16);
    ctx.textAlign = 'right'; ctx.fillStyle = '#0d47a1'; ctx.font = '700 15px "Courier New", monospace';
    ctx.fillText('Joint η = ' + c.eff.toFixed(1) + '%', W - 12, 16);
    ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padL, baseY); ctx.lineTo(W - padR, baseY); ctx.stroke();
    bars.forEach(function (b, i) {
      var bx = padL + i * gap + (gap - bw) / 2, bh = b.v / maxV * plotH, by = baseY - bh, gov = (b.key === c.mode);
      ctx.fillStyle = b.col; ctx.globalAlpha = gov ? 1 : 0.82; ctx.fillRect(bx, by, bw, bh); ctx.globalAlpha = 1;
      if (gov) { ctx.strokeStyle = '#c53030'; ctx.lineWidth = 2.4; ctx.strokeRect(bx, by, bw, bh); }
      ctx.fillStyle = '#111'; ctx.font = '700 13px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(fmtForce(b.v) + ' ' + uForce(), bx + bw / 2, by - 6);
      ctx.fillStyle = '#fff'; ctx.textBaseline = 'top'; if (bh > 26) ctx.fillText((b.key === 'solid' ? '100%' : 'η ' + b.eff.toFixed(0) + '%'), bx + bw / 2, by + 6);
      ctx.fillStyle = b.col; ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.textBaseline = 'top'; ctx.fillText(b.lab, bx + bw / 2, baseY + 8);
      if (gov) { ctx.fillStyle = '#c53030'; ctx.fillText('◄ governs', bx + bw / 2, baseY + 26); }
    });
    return cv.toDataURL('image/png');
  }

  function exportReport() {
    var c = compute(), u = uLen(), uf = uForce(), us = uStress(), m = mat();
    var jointImg = buildJointImage(), barsImg = buildBarsImage();
    var now = new Date(), dateStr = now.toISOString().slice(0, 10), timeStr = now.toTimeString().slice(0, 5);
    var reportNo = 'RJD-' + dateStr.replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);
    var lt = state.lastTest;

    var ltSection;
    if (lt) {
      var outcome = lt.fails
        ? '<span style="color:#c53030;font-weight:700;">FAILED — ' + rptEsc(lt.mode) + '</span>'
        : '<span style="color:#2f855a;font-weight:700;">SAFE — joint holds</span>';
      var why = lt.fails
        ? (lt.mode === 'tearing' ? 'The plate tore across the rivet-hole line: net section (p−d)·t·σt had the lowest capacity.'
          : lt.mode === 'shearing' ? 'The rivets sheared' + (c.dbl ? ' on two planes' : '') + ': shear area ' + c.n + (c.dbl ? '×1.875' : '') + '·(π/4)d²·τ had the lowest capacity.'
          : 'The rivets crushed the plate at the holes: bearing area n·d·t·σc had the lowest capacity.')
        : 'Applied load is at or below the safe load, so the joint carries it with a positive factor of safety.';
      ltSection = '<h2>5. Load Test</h2><table>' +
        '<tr><th>Applied load (per pitch)</th><td>' + fmtForce(lt.applied) + ' ' + uf + '</td></tr>' +
        '<tr><th>Safe load (least capacity)</th><td>' + fmtForce(lt.safe) + ' ' + uf + ' (governed by ' + rptEsc(lt.mode) + ')</td></tr>' +
        '<tr><th>Outcome</th><td>' + outcome + '</td></tr>' +
        (lt.fails ? '<tr><th>Failure load</th><td>' + fmtForce(lt.safe) + ' ' + uf + '</td></tr>'
                  : '<tr><th>Factor of safety</th><td>' + lt.fos.toFixed(2) + '</td></tr>') +
        '<tr><th>Explanation</th><td>' + rptEsc(why) + '</td></tr></table>';
    } else {
      ltSection = '<h2>5. Load Test</h2><p style="color:#546e7a;font-size:10pt;">No load test was run for this configuration. The design safe load (least of the three capacities) is <b>' + fmtForce(c.least) + ' ' + uf + '</b>, governed by <b>' + rptEsc(c.mode) + '</b>. Use the Load Test button in the tool to simulate a specific applied load.</p>';
    }

    var govStyle = function (mode) { return mode === c.mode ? ' style="background:#fdecec;font-weight:700;"' : ''; };

    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<title>Rivet Joint Report — ' + reportNo + '</title><style>' +
      '@page { size: A4; margin: 14mm 16mm; }' +
      '* { box-sizing: border-box; }' +
      'body { font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:#111; margin:0; font-size:10.5pt; line-height:1.45; }' +
      '.report { max-width:190mm; margin:0 auto; }' +
      '.hd { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:3px solid #2b6cb0; padding-bottom:10px; margin-bottom:14px; }' +
      '.hd-l h1 { margin:0; font-size:18pt; color:#1a4f86; }' +
      '.hd-l .sub { margin-top:2px; font-size:9.5pt; color:#444; }' +
      '.hd-r { text-align:right; font-size:9pt; color:#333; }' +
      '.hd-r .rno { font-weight:700; color:#1a4f86; font-size:11pt; }' +
      'h2 { font-size:11pt; color:#1a4f86; margin:16px 0 6px; border-bottom:1px solid #b0bec5; padding-bottom:2px; text-transform:uppercase; letter-spacing:.4px; }' +
      'table { width:100%; border-collapse:collapse; margin-bottom:6px; font-size:10pt; }' +
      'th,td { text-align:left; padding:5px 9px; border-bottom:1px solid #e0e6ed; }' +
      'th { background:#eef2f7; color:#37474f; font-weight:600; width:46%; }' +
      'td { color:#111; font-variant-numeric:tabular-nums; }' +
      '.two-col { display:grid; grid-template-columns:1fr 1fr; gap:0 18px; }' +
      '.results-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:6px; }' +
      '.kpi { border:1px solid #cfd8dc; padding:8px 10px; border-radius:4px; background:#f5f7fa; }' +
      '.kpi-gov { border-color:#c53030; background:#fdecec; }' +
      '.kpi .lbl { font-size:8pt; color:#546e7a; text-transform:uppercase; letter-spacing:.5px; font-weight:600; }' +
      '.kpi .val { font-size:14pt; font-weight:700; color:#1a4f86; font-variant-numeric:tabular-nums; }' +
      '.kpi .unit { font-size:9pt; color:#37474f; margin-left:2px; }' +
      '.imgs { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:6px; }' +
      '.imgbox { border:1px solid #cfd8dc; padding:5px; background:#fff; }' +
      '.imgbox img { width:100%; height:auto; display:block; }' +
      '.calc li { margin:3px 0; font-size:9.7pt; }' +
      '.calc code { font-family:"Courier New",monospace; background:#eef2f7; padding:1px 5px; border-radius:3px; }' +
      '.verdict { margin-top:10px; padding:10px 14px; border-left:4px solid #2b6cb0; background:#eaf2fb; font-size:10pt; }' +
      '.sign-row { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:24px; }' +
      '.sign-box { border-top:1px solid #455a64; padding-top:4px; font-size:9pt; color:#37474f; }' +
      '.foot { margin-top:16px; padding-top:8px; border-top:1px solid #b0bec5; font-size:8.5pt; color:#546e7a; display:flex; justify-content:space-between; }' +
      '.bar { background:#1a4f86; color:#fff; padding:12px 18px; text-align:center; font-size:11pt; }' +
      '.bar button { background:#fff; color:#1a4f86; border:0; padding:7px 18px; font-weight:700; border-radius:4px; cursor:pointer; margin:0 6px; }' +
      '@media print { .no-print { display:none !important; } }' +
      '</style></head><body>' +
      '<div class="bar no-print">Use your browser&rsquo;s print dialog (Ctrl/Cmd + P) to <b>Save as PDF</b>.' +
      '<button onclick="window.print()">Print / Save as PDF</button><button onclick="window.close()">Close</button></div>' +
      '<div class="report">' +
      '<div class="hd"><div class="hd-l"><h1>Riveted Joint — Design &amp; Test Report</h1>' +
      '<div class="sub">' + rptEsc(jointName()) + ', ' + rptEsc(rowsName()) + ' ' + rptEsc(state.arrange) + ' &middot; per Unwin&rsquo;s formula &amp; boiler-code practice</div></div>' +
      '<div class="hd-r"><div class="rno">Report No. ' + reportNo + '</div><div>Date: ' + dateStr + '</div><div>Time: ' + timeStr + '</div><div>Lab: NHIT VisualLab Rivet Joint Designer</div></div></div>' +

      '<h2>1. Joint Configuration &amp; Conditions</h2><div class="two-col">' +
      '<table>' +
      '<tr><th>Joint type</th><td>' + rptEsc(jointName()) + '</td></tr>' +
      '<tr><th>Riveting</th><td>' + rptEsc(rowsName()) + '</td></tr>' +
      '<tr><th>Arrangement</th><td>' + rptEsc(state.arrange) + '</td></tr>' +
      '<tr><th>Shear mode</th><td>' + (c.dbl ? 'Double shear' : 'Single shear') + '</td></tr>' +
      '<tr><th>Material</th><td>' + rptEsc(m.name) + '</td></tr>' +
      '<tr><th>Allowable σt / τ / σc</th><td>' + fmtStress(m.st) + ' / ' + fmtStress(m.tau) + ' / ' + fmtStress(m.sc) + ' ' + us + '</td></tr>' +
      '</table><table>' +
      '<tr><th>Plate thickness (t)</th><td>' + fmtLen(state.t) + ' ' + u + '</td></tr>' +
      '<tr><th>Rivet diameter (d)</th><td>' + fmtLen(state.d) + ' ' + u + (state.dMode === 'auto' ? ' (Unwin)' : ' (manual)') + '</td></tr>' +
      '<tr><th>Unwin d = 6√t</th><td>' + fmtLen(c.dUnwin) + ' ' + u + '</td></tr>' +
      '<tr><th>Pitch (p)</th><td>' + fmtLen(state.p) + ' ' + u + '</td></tr>' +
      '<tr><th>Back pitch (pb)</th><td>' + fmtLen(state.pb) + ' ' + u + '</td></tr>' +
      '<tr><th>Margin (m) / Diagonal pitch (pd)</th><td>' + fmtLen(c.margin) + ' / ' + fmtLen(c.pd) + ' ' + u + '</td></tr>' +
      '<tr><th>Rivets per pitch (n) / Max pitch (IBR)</th><td>' + c.n + ' / ' + fmtLen(c.pMax) + ' ' + u + '</td></tr>' +
      '</table></div>' +

      '<h2>2. Results — Key Properties</h2><div class="results-grid">' +
      rptKpi('Tearing Pₜ', fmtForce(c.Pt), uf, c.mode === 'tearing') +
      rptKpi('Shearing Pₛ', fmtForce(c.Ps), uf, c.mode === 'shearing') +
      rptKpi('Crushing Pᴄ', fmtForce(c.Pc), uf, c.mode === 'crushing') +
      rptKpi('Solid plate P', fmtForce(c.Psolid), uf) +
      rptKpi('Joint efficiency', c.eff.toFixed(1), '%') +
      rptKpi('Governing mode', c.mode, '') +
      rptKpi('Safe load / pitch', fmtForce(c.least), uf) +
      rptKpi('Strap thickness', state.joint === 'lap' ? '—' : fmtLen(c.strap), state.joint === 'lap' ? '' : u) +
      '</div>' +

      '<h2>3. Failure Mode Efficiencies</h2><table>' +
      '<tr><th style="width:34%">Failure mode</th><th style="width:22%;background:#eef2f7">Strength (' + uf + ')</th><th style="width:22%;background:#eef2f7">Efficiency η</th><th style="background:#eef2f7">Status</th></tr>' +
      '<tr' + govStyle('tearing') + '><td>Tearing &nbsp; Pt = (p−d)·t·σt</td><td>' + fmtForce(c.Pt) + '</td><td>' + c.effT.toFixed(1) + '%</td><td>' + (c.mode === 'tearing' ? 'GOVERNS' : '—') + '</td></tr>' +
      '<tr' + govStyle('shearing') + '><td>Shearing &nbsp; Ps = ' + (c.dbl ? '1.875·' : '') + 'n·(π/4)d²·τ</td><td>' + fmtForce(c.Ps) + '</td><td>' + c.effS.toFixed(1) + '%</td><td>' + (c.mode === 'shearing' ? 'GOVERNS' : '—') + '</td></tr>' +
      '<tr' + govStyle('crushing') + '><td>Crushing &nbsp; Pc = n·d·t·σc</td><td>' + fmtForce(c.Pc) + '</td><td>' + c.effC.toFixed(1) + '%</td><td>' + (c.mode === 'crushing' ? 'GOVERNS' : '—') + '</td></tr>' +
      '</table>' +

      '<h2>4. Joint Layout &amp; Strength Comparison</h2><div class="imgs">' +
      '<div class="imgbox"><img src="' + jointImg + '" alt="Joint layout"></div>' +
      '<div class="imgbox"><img src="' + barsImg + '" alt="Strength comparison"></div></div>' +

      ltSection +

      '<h2>6. Design Calculations</h2><ol class="calc">' +
      '<li>Rivet diameter (Unwin): <code>d = 6√t = 6√' + fmtLen(state.t) + ' = ' + fmtLen(c.dUnwin) + ' ' + u + '</code> → standard <code>' + fmtLen(state.d) + ' ' + u + '</code></li>' +
      '<li>Tearing: <code>Pt = (' + fmtLen(state.p) + '−' + fmtLen(state.d) + ')·' + fmtLen(state.t) + '·σt = ' + fmtForce(c.Pt) + ' ' + uf + '</code></li>' +
      '<li>Shearing: <code>Ps = ' + c.n + (c.dbl ? '·1.875' : '') + '·(π/4)·' + fmtLen(state.d) + '²·τ = ' + fmtForce(c.Ps) + ' ' + uf + '</code></li>' +
      '<li>Crushing: <code>Pc = ' + c.n + '·' + fmtLen(state.d) + '·' + fmtLen(state.t) + '·σc = ' + fmtForce(c.Pc) + ' ' + uf + '</code></li>' +
      '<li>Solid plate: <code>P = ' + fmtLen(state.p) + '·' + fmtLen(state.t) + '·σt = ' + fmtForce(c.Psolid) + ' ' + uf + '</code></li>' +
      '<li>Efficiency: <code>η = min(Pt,Ps,Pc)/P = ' + fmtForce(c.least) + '/' + fmtForce(c.Psolid) + ' = ' + c.eff.toFixed(1) + '%</code></li></ol>' +

      '<div class="verdict"><b>Conclusion:</b> The joint efficiency is <b>' + c.eff.toFixed(1) + '%</b>, governed by <b>' + rptEsc(c.mode) + '</b> with a safe load of <b>' + fmtForce(c.least) + ' ' + uf + '</b> per pitch. ' +
      (c.pOK ? 'The pitch is within the recommended limits (2d to the leak-tight maximum).' : 'Note: the pitch is outside the recommended 2d–maximum window and should be revised.') + '</div>' +

      '<div class="sign-row"><div class="sign-box">Designed by ___________________________</div><div class="sign-box">Checked by ___________________________</div></div>' +
      '<div class="foot"><div>Generated by NHIT VisualLab Rivet Joint Designer &middot; NHIT VisualLab</div><div>Refs: Unwin&rsquo;s formula &middot; IBR &middot; ASME BPVC</div></div>' +
      '</div>' +
      '<script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},400);});</' + 'script>' +
      '</body></html>';

    var win = window.open('', '_blank', 'width=920,height=1100');
    if (!win) { alert('Pop-up blocked. Please allow pop-ups for this site to export the report.'); return; }
    win.document.open(); win.document.write(html); win.document.close();
  }

  /* ── Calc modal ── */
  function buildModal() {
    var c = compute(), u = uLen(), uf = uForce(), us = uStress(), m = mat();
    function s(pill, title, formula, calc, result) { return '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num-pill">' + pill + '</span><span class="cs-title">' + title + '</span></div><div class="cs-formula">' + formula + '</div>' + (calc ? '<div class="cs-calc">' + calc + '</div>' : '') + '<div class="cs-result">' + result + '</div></div>'; }
    var html = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num-pill">Given</span><span class="cs-title">' + m.name + ' — ' + jointName() + ', ' + rowsName() + ' ' + state.arrange + '</span></div><div class="cs-calc">t = ' + fmtLen(state.t) + ' ' + u + ', d = ' + fmtLen(state.d) + ' ' + u + ', p = ' + fmtLen(state.p) + ' ' + u + ', n = ' + c.n + ', σt = ' + fmtStress(m.st) + ', τ = ' + fmtStress(m.tau) + ', σc = ' + fmtStress(m.sc) + ' ' + us + '</div></div>';
    html += s('Step 1', "Rivet diameter (Unwin)", '\\[ d = 6\\sqrt{t} \\]', 'd = 6√' + fmtLen(state.t) + ' = ' + fmtLen(c.dUnwin) + ' ' + u + ' → standard ' + fmtLen(state.d) + ' ' + u, '<strong>d = ' + fmtLen(state.d) + ' ' + u + '</strong>');
    html += s('Step 2', 'Tearing of plate', '\\[ P_t = (p - d)\\,t\\,\\sigma_t \\]', 'Pt = (' + fmtLen(state.p) + ' − ' + fmtLen(state.d) + ')·' + fmtLen(state.t) + '·σt', '<strong>Pt = ' + fmtForce(c.Pt) + ' ' + uf + '</strong>');
    html += s('Step 3', 'Shearing of rivets', '\\[ P_s = ' + (c.dbl ? '1.875\\,' : '') + 'n\\,\\frac{\\pi}{4}d^2\\,\\tau \\]', 'Ps = ' + c.n + (c.dbl ? '·1.875' : '') + '·(π/4)·' + fmtLen(state.d) + '²·τ' + (c.dbl ? '  (double shear)' : ''), '<strong>Ps = ' + fmtForce(c.Ps) + ' ' + uf + '</strong>');
    html += s('Step 4', 'Crushing of rivets', '\\[ P_c = n\\,d\\,t\\,\\sigma_c \\]', 'Pc = ' + c.n + '·' + fmtLen(state.d) + '·' + fmtLen(state.t) + '·σc', '<strong>Pc = ' + fmtForce(c.Pc) + ' ' + uf + '</strong>');
    html += s('Step 5', 'Solid plate &amp; per-mode efficiency', '\\[ P = p\\,t\\,\\sigma_t,\\quad \\eta_t=\\tfrac{P_t}{P},\\;\\eta_s=\\tfrac{P_s}{P},\\;\\eta_c=\\tfrac{P_c}{P} \\]', 'P = ' + fmtLen(state.p) + '·' + fmtLen(state.t) + '·σt = ' + fmtForce(c.Psolid) + ' ' + uf, '<strong>η<sub>t</sub> = ' + c.effT.toFixed(1) + '%, η<sub>s</sub> = ' + c.effS.toFixed(1) + '%, η<sub>c</sub> = ' + c.effC.toFixed(1) + '%</strong>');
    html += s('Step 6', 'Joint efficiency', '\\[ \\eta = \\min(\\eta_t,\\eta_s,\\eta_c) \\]', 'η = least of ' + c.effT.toFixed(1) + ', ' + c.effS.toFixed(1) + ', ' + c.effC.toFixed(1) + '%', '<strong>η = ' + c.eff.toFixed(1) + '% — governed by ' + c.mode + '</strong>');
    html += s('Step 7', 'Spacings', '\\[ m = 1.5d,\\quad p_d = \\sqrt{p_b^2 + (p/2)^2} \\]', 'm = 1.5·' + fmtLen(state.d) + '; pd = √(' + fmtLen(state.pb) + '² + (' + fmtLen(state.p) + '/2)²)', '<strong>m = ' + fmtLen(c.margin) + ', pd = ' + fmtLen(c.pd) + ' ' + u + '</strong>');
    var body = $('calc-modal-body'); if (body) body.innerHTML = html;
    $('calc-modal').classList.add('active');
  }

  /* ── Custom material modal ── */
  function openCustom() { $('cm-err').textContent = ''; $('cm-modal').classList.add('active'); }
  function closeCustom() { $('cm-modal').classList.remove('active'); }
  function saveCustom() {
    var name = $('cm-name').value.trim(), st = parseFloat($('cm-st').value), tau = parseFloat($('cm-tau').value), sc = parseFloat($('cm-sc').value);
    var err = $('cm-err'); function bad(msg) { err.textContent = msg; return false; }
    if (!name) return bad('Enter a material name.');
    if (isNaN(st) || st < 20 || st > 250) return bad('Allowable tensile must be 20–250 MPa.');
    if (isNaN(tau) || tau < 15 || tau > 200) return bad('Allowable shear must be 15–200 MPa.');
    if (isNaN(sc) || sc < 30 || sc > 400) return bad('Allowable crushing must be 30–400 MPa.');
    var id = 'cust_' + Object.keys(customMats).length;
    customMats[id] = { name: name, st: st, tau: tau, sc: sc };
    var sel = $('mat-sel'), opt = document.createElement('option'); opt.value = id; opt.textContent = name;
    sel.insertBefore(opt, sel.querySelector('option[value="custom"]'));
    selectMat(id); closeCustom();
  }

  function selectMat(key) { if (state.sim) stopSim(true); state.matKey = key; clearPreset(); syncControls(); render(); playClick(); }

  function applyPreset(i) {
    if (state.sim) stopSim(true);
    var p = PRESETS[i]; state.matKey = p[0]; state.joint = p[1]; state.rows = p[2]; state.arrange = p[3];
    state.t = p[4]; state.dMode = p[5]; state.d = p[6]; state.p = p[7]; state.pb = p[8];
    ensureAutoD(); syncControls(); render();
  }

  /* ════════════════════════════════════════════════════════════════
     EVENT WIRING
     ════════════════════════════════════════════════════════════════ */
  function wire() {
    document.querySelectorAll('#mode-tabs .pill').forEach(function (b) { b.addEventListener('click', function () { playClick(); setMode(b.dataset.mode); }); });
    document.querySelectorAll('#unit-tabs .unit-opt').forEach(function (b) {
      b.addEventListener('click', function () {
          if (state.unit === b.dataset.unit) return; if (state.sim) stopSim(true); state.unit = b.dataset.unit; playClick();
        document.querySelectorAll('#unit-tabs .unit-opt').forEach(function (x) { x.classList.toggle('active', x === b); });
        syncControls();
        if (state.mode === 'practice') newPractice();
        if (state.mode === 'quiz') { state.quiz = null; startQuiz(); }
        render();
      });
    });
    $('mat-sel').addEventListener('change', function () { if (this.value === 'custom') { this.value = state.matKey; openCustom(); return; } selectMat(this.value); });
    $('joint-sel').addEventListener('change', function () { if (state.sim) stopSim(true); state.joint = this.value; clearPreset(); render(); playClick(); });
    $('rows-sel').addEventListener('change', function () { if (state.sim) stopSim(true); state.rows = parseInt(this.value, 10); clearPreset(); render(); playClick(); });
    $('arrange-sel').addEventListener('change', function () { if (state.sim) stopSim(true); state.arrange = this.value; clearPreset(); render(); playClick(); });
    $('d-mode-sel').addEventListener('change', function () { if (state.sim) stopSim(true); state.dMode = this.value; ensureAutoD(); syncControls(); render(); playClick(); });
    $('preset-sel').addEventListener('change', function () { if (this.value === '') return; applyPreset(parseInt(this.value, 10)); playClick(); });
    /* param sliders + steppers */
    Object.keys(PARAMS).forEach(function (key) {
      var p = PARAMS[key];
      $(p.slider).addEventListener('input', function () { if (state.sim) stopSim(true); readParam(key, this.value); if (key === 't') ensureAutoD(); $(p.step).value = (+this.value).toFixed(paramDec(p)); if (key === 't' && state.dMode === 'auto') setOneParam('d'); clearPreset(); render(); });
      $(p.step).addEventListener('input', function () { if (state.sim) stopSim(true); readParam(key, this.value); if (key === 't') ensureAutoD(); $(p.slider).value = round6(toLen(state[key])); if (key === 't' && state.dMode === 'auto') setOneParam('d'); clearPreset(); render(); });
    });
    document.querySelectorAll('.step-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.dataset.target, p = PARAMS[key]; if ($(p.slider).disabled) return; if (state.sim) stopSim(true);
        var dir = parseInt(b.dataset.dir, 10), disp = toLen(state[key]) + dir * paramStepDisp(p);
        readParam(key, disp); if (key === 't') ensureAutoD(); setOneParam(key); if (key === 't' && state.dMode === 'auto') setOneParam('d'); clearPreset(); render(); playClick();
      });
    });
    /* drawing toggles */
    var tg = { 'chk-dims': 'dims', 'chk-center': 'center', 'chk-load': 'load', 'chk-section': 'section', 'chk-hatch': 'hatch', 'chk-grid': 'grid' };
    Object.keys(tg).forEach(function (id) { var e = $(id); if (e) e.addEventListener('change', function () { state.toggles[tg[id]] = e.checked; render(); }); });
    /* chart tabs */
    document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (b) { b.addEventListener('click', function () { state.chartView = b.dataset.view; document.querySelectorAll('#chart-tabs .chart-tab').forEach(function (x) { x.classList.toggle('active', x === b); }); drawChart(); playClick(); }); });
    /* action bar */
    $('btn-calc').addEventListener('click', function () { buildModal(); playClick(); });
    $('btn-reset').addEventListener('click', function () { stopSim(true); applyPreset(1); $('preset-sel').value = '1'; playClick(); });
    /* load test */
    $('btn-loadtest').addEventListener('click', function () { if (state.sim && state.sim.active) { stopSim(); } else { openLoadTest(); } });
    $('lt-run').addEventListener('click', submitLoadTest);
    $('lt-cancel').addEventListener('click', function () { $('lt-modal').classList.remove('active'); });
    $('lt-modal-close').addEventListener('click', function () { $('lt-modal').classList.remove('active'); });
    $('lt-modal').addEventListener('click', function (e) { if (e.target === this) this.classList.remove('active'); });
    $('lt-load').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitLoadTest(); });
    $('btn-export-csv').addEventListener('click', exportCSV);
    $('btn-export-png').addEventListener('click', exportPNG);
    $('btn-report').addEventListener('click', function () { exportReport(); playClick(); });
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
    document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (b) { b.addEventListener('click', function () { if (b.disabled) return; state.quiz.qs[state.quiz.idx].ansMode = b.dataset.value; document.querySelectorAll('#quiz-panel .q-fit-btn').forEach(function (x) { x.classList.toggle('selected', x === b); }); playClick(); }); });
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
    [$('joint-canvas'), $('chart-canvas')].forEach(function (cv) { cv.addEventListener('contextmenu', function (e) { e.preventDefault(); menu.style.display = 'block'; var mw = menu.offsetWidth || 180, mh = menu.offsetHeight || 160; menu.style.left = Math.min(e.clientX, window.innerWidth - mw - 8) + 'px'; menu.style.top = Math.min(e.clientY, window.innerHeight - mh - 8) + 'px'; }); });
    document.addEventListener('click', function () { menu.style.display = 'none'; });
    menu.querySelectorAll('.ctx-item').forEach(function (it) { it.addEventListener('click', function () { var a = it.dataset.act; if (a === 'copy') copyResults(); else if (a === 'png') exportPNG(); else if (a === 'csv') exportCSV(); else if (a === 'reset') { applyPreset(1); $('preset-sel').value = '1'; } menu.style.display = 'none'; }); });
    /* drag on joint canvas → sweep pitch */
    var cv = $('joint-canvas'), dragging = false, lastY = 0;
    cv.addEventListener('pointerdown', function (e) { if (state.sim && state.sim.active) return; dragging = true; lastY = e.clientY; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', function (e) { if (!dragging) return; var dy = e.clientY - lastY; lastY = e.clientY; var p = PARAMS.p; state.p = Math.max(p.min, Math.min(p.max, state.p + dy * 0.6)); setOneParam('p'); clearPreset(); render(); });
    cv.addEventListener('pointerup', function () { dragging = false; });
    cv.addEventListener('pointercancel', function () { dragging = false; });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (state.mode === 'simulate') render(); }, 120); });
  }

  function init() {
    ensureAutoD();
    syncControls();
    wire();
    renderExploreCards('basics');
    setMode('simulate');
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
