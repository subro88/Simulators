(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     Free Body Diagram & Force Resolver
     ═══════════════════════════════════════════════════════════════ */

  var $ = function (id) { return document.getElementById(id); };
  var TAU = Math.PI * 2;
  var DEG = 180 / Math.PI;
  var LBF = 4.4482216;            /* 1 lbf in N */

  var PALETTE = ['#3f8cff', '#ff5555', '#3ddc84', '#ffb74d', '#e040fb', '#26c6da', '#f5c842', '#ff8a65'];

  /* ── State (magnitudes stored in N internally) ── */
  var state = {
    forces: [],           /* {mag:N, ang:deg, color} */
    unit: 'N',
    show: { resultant: true, components: false, polygon: false, equilibrant: false, grid: true, axes: true, labels: true, angles: false },
    mode: 'simulate',
    soundOn: true,
    audioCtx: null,
    drag: null
  };

  var canvas = $('fbd-canvas');
  var ctx = canvas.getContext('2d');
  var O = { x: 0, y: 0 };          /* origin in css px */
  var scalePx = 1;                 /* px per N */
  var labelBoxes = [];             /* per-force label hit-boxes from the last draw */

  /* ═══════════════ Sound ═══════════════ */
  function getAudioCtx() {
    if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { state.audioCtx = null; } }
    return state.audioCtx;
  }
  function playTone(freq, dur, type, vol) {
    if (!state.soundOn) return;
    var ac = getAudioCtx(); if (!ac) return;
    try {
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'sine'; o.frequency.value = freq; g.gain.value = vol || 0.05;
      o.connect(g); g.connect(ac.destination);
      var t = ac.currentTime;
      g.gain.setValueAtTime(vol || 0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur);
    } catch (e) {}
  }
  function playClick()   { playTone(760, 0.05, 'square', 0.035); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.1); setTimeout(function(){ playTone(1100, 0.15, 'sine', 0.1); }, 110); }
  function playError()   { playTone(300, 0.2, 'sawtooth', 0.06); }

  /* ═══════════════ Units ═══════════════ */
  function toDisp(n) { return state.unit === 'lbf' ? n / LBF : n; }
  function toN(d) { return state.unit === 'lbf' ? d * LBF : d; }
  function uLabel() { return state.unit; }
  function fmt(n, dp) { dp = dp == null ? 1 : dp; return (Math.round(n * Math.pow(10, dp)) / Math.pow(10, dp)).toFixed(dp); }
  function trimNum(n, dp) { return fmt(n, dp).replace(/\.0+$/, ''); }
  /* magnitude → compact string with an SI prefix so large forces read as
     kN / MN / GN … instead of an unreadable run of digits (e.g. 10412N → 10.4 kN) */
  function fmtMag(magN, dp) {
    dp = dp == null ? 1 : dp;
    var v = toDisp(magN), a = Math.abs(v), unit = uLabel();
    if (unit === 'lbf') {
      /* Imperial convention: 1000 lbf = 1 kip (never "klbf") */
      if (a >= 1e3) { var kip = v / 1e3; return trimNum(kip, Math.abs(kip) >= 100 ? 0 : dp) + ' kip'; }
      return trimNum(v, dp) + ' ' + unit;
    }
    var px = [['T', 1e12], ['G', 1e9], ['M', 1e6], ['k', 1e3]];
    for (var i = 0; i < px.length; i++) {
      if (a >= px[i][1]) { var s = v / px[i][1]; return trimNum(s, Math.abs(s) >= 100 ? 0 : dp) + ' ' + px[i][0] + unit; }
    }
    return trimNum(v, dp) + ' ' + unit;
  }

  /* ═══════════════ Engine ═══════════════ */
  function components() {
    var rx = 0, ry = 0;
    state.forces.forEach(function (f) {
      rx += f.mag * Math.cos(f.ang / DEG);
      ry += f.mag * Math.sin(f.ang / DEG);
    });
    return { rx: rx, ry: ry };
  }
  function resultant() {
    var c = components();
    var mag = Math.hypot(c.rx, c.ry);
    var ang = Math.atan2(c.ry, c.rx) * DEG;
    if (ang < 0) ang += 360;
    return { mag: mag, ang: ang, rx: c.rx, ry: c.ry };
  }
  function maxMag() {
    var m = 1;
    state.forces.forEach(function (f) { if (f.mag > m) m = f.mag; });
    var r = resultant().mag; if (r > m) m = r;
    return m;
  }
  function isEquilibrium() {
    var c = components();
    var tol = Math.max(0.5, maxMag() * 0.01);
    return Math.abs(c.rx) < tol && Math.abs(c.ry) < tol;
  }

  /* ═══════════════ Canvas ═══════════════ */
  var _cv = { w: 0, h: 0, dpr: 0 };
  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth || canvas.parentElement.clientWidth;
    var h = Math.max(320, Math.min(460, Math.round(w * 0.55)));
    /* reallocate the backing store only when the size actually changed —
       draw() runs on every pointer-move / animation frame and reallocating
       the canvas each time churns memory for nothing */
    if (w !== _cv.w || h !== _cv.h || dpr !== _cv.dpr) {
      _cv.w = w; _cv.h = h; _cv.dpr = dpr;
      canvas.style.height = h + 'px';
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    O.x = w * 0.5; O.y = h * 0.52;
    var fit = Math.min(w, h) * 0.36;
    scalePx = fit / maxMag();
    return { w: w, h: h };
  }

  function vec(f) {       /* tip position in px for a force */
    return { x: O.x + f.mag * scalePx * Math.cos(f.ang / DEG), y: O.y - f.mag * scalePx * Math.sin(f.ang / DEG) };
  }

  function arrow(x1, y1, x2, y2, color, width, head, dash, glow) {
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
    ctx.lineCap = 'round';
    if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 9; }
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    var a = Math.atan2(y2 - y1, x2 - x1);
    var hl = head || 12;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(a - 0.4), y2 - hl * Math.sin(a - 0.4));
    ctx.lineTo(x2 - hl * Math.cos(a + 0.4), y2 - hl * Math.sin(a + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Studio background: vertical gradient + accent glow centred on the body +
     a soft vignette — pure, drawn first, respects no toggles (it IS the field) */
  function drawSceneBg(w, h) {
    var bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#10151f');
    bg.addColorStop(0.55, '#0b0f17');
    bg.addColorStop(1, '#080b10');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    var glow = ctx.createRadialGradient(O.x, O.y, 20, O.x, O.y, Math.max(w, h) * 0.55);
    glow.addColorStop(0, 'rgba(63,140,255,0.085)');
    glow.addColorStop(1, 'rgba(63,140,255,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  }

  /* The body at the origin: shaded node + ring; glows green in equilibrium */
  function drawBodyNode() {
    var eq = state.forces.length > 0 && isEquilibrium();
    if (eq) {
      var halo = ctx.createRadialGradient(O.x, O.y, 4, O.x, O.y, 46);
      halo.addColorStop(0, 'rgba(61,220,132,0.22)');
      halo.addColorStop(1, 'rgba(61,220,132,0)');
      ctx.save(); ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(O.x, O.y, 46, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = eq ? 'rgba(61,220,132,0.55)' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(O.x, O.y, 10, 0, TAU); ctx.stroke();
    var g = ctx.createRadialGradient(O.x - 2, O.y - 2, 1, O.x, O.y, 6.5);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#cfd8e3');
    g.addColorStop(1, '#8fa1b8');
    ctx.fillStyle = g; ctx.strokeStyle = '#0a0e14'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(O.x, O.y, 6, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function draw(opts) {
    opts = opts || {};
    /* hold the finished polygon-law frame (originals stay grayed) until the user acts */
    if (poly.done && state.mode === 'simulate' && state.show.polygon &&
        !opts.hideValues && !opts.hideLabels && !opts.hideResultant) {
      renderPoly(poly.total); return;
    }
    var dim = sizeCanvas();
    var w = dim.w, h = dim.h;
    ctx.clearRect(0, 0, w, h);
    drawSceneBg(w, h);

    /* grid */
    if (state.show.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
      var step = 28;
      for (var gx = O.x % step; gx < w; gx += step) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (var gy = O.y % step; gy < h; gy += step) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    }
    /* axes */
    if (state.show.axes) {
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, O.y); ctx.lineTo(w, O.y); ctx.moveTo(O.x, 0); ctx.lineTo(O.x, h); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('+x', w - 22, O.y - 10); ctx.fillText('+y', O.x + 8, 12);
    }

    /* angle arcs — traditional indicator of each force's angle from the +x axis */
    if (state.show.angles && !opts.hideValues && state.forces.length) {
      state.forces.forEach(function (f, i) {
        var r = 26 + i * 12, ang = f.ang;
        ctx.save();
        ctx.strokeStyle = f.color; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.95;
        ctx.beginPath();
        var steps = Math.max(2, Math.round(Math.abs(ang) / 4));
        for (var s = 0; s <= steps; s++) {
          var t = ang * s / steps;
          var ax = O.x + r * Math.cos(t / DEG), ay = O.y - r * Math.sin(t / DEG);
          if (s === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
        }
        ctx.stroke(); ctx.restore();
        /* angle value at the middle of the arc */
        var mt = ang / 2;
        var lx = O.x + (r + 13) * Math.cos(mt / DEG), ly = O.y - (r + 13) * Math.sin(mt / DEG);
        ctx.save();
        ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(8,12,20,0.85)'; ctx.lineJoin = 'round';
        ctx.strokeText(fmt(ang, 0) + '°', lx, ly);
        ctx.fillStyle = f.color; ctx.fillText(fmt(ang, 0) + '°', lx, ly);
        ctx.restore();
      });
    }

    var res = resultant();

    /* force polygon (tip-to-tail) */
    if (state.show.polygon && state.forces.length) {
      var px = O.x, py = O.y;
      ctx.save(); ctx.globalAlpha = 0.55;
      state.forces.forEach(function (f) {
        var nx = px + f.mag * scalePx * Math.cos(f.ang / DEG);
        var ny = py - f.mag * scalePx * Math.sin(f.ang / DEG);
        arrow(px, py, nx, ny, f.color, 2, 9, [5, 4]);
        px = nx; py = ny;
      });
      ctx.restore();
      /* closing line from last tip back to origin shows the resultant of the polygon */
      ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(O.x, O.y); ctx.stroke(); ctx.restore();
    }

    /* component rectangle of the resultant */
    if (state.show.components && res.mag > 0.01) {
      var tip = { x: O.x + res.rx * scalePx, y: O.y - res.ry * scalePx };
      arrow(O.x, O.y, O.x + res.rx * scalePx, O.y, '#3ddc84', 2, 9, [6, 4]);
      arrow(O.x, O.y, O.x, O.y - res.ry * scalePx, '#4fc3f7', 2, 9, [6, 4]);
      ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(O.x + res.rx * scalePx, O.y); ctx.lineTo(tip.x, tip.y);
      ctx.moveTo(O.x, O.y - res.ry * scalePx); ctx.lineTo(tip.x, tip.y); ctx.stroke(); ctx.restore();
    }

    /* force arrows */
    labelBoxes = [];
    state.forces.forEach(function (f, i) {
      var t = vec(f);
      arrow(O.x, O.y, t.x, t.y, f.color, 3.4, 14, null, true);
      if (!opts.hideLabels && state.show.labels) {
        ctx.save();
        ctx.font = '700 13px "Segoe UI", sans-serif';
        ctx.textBaseline = 'middle';
        var lbl = 'F' + (i + 1);
        if (!opts.hideValues) lbl += '  ' + fmtMag(f.mag, 0) + ' @' + fmt(f.ang, 0) + '°';
        /* offset the label clear of the arrow, then lift it perpendicular to the
           force so it never sits on the line or the handle. Grow the text toward the
           canvas interior (by tip position) so it never clips at an edge. */
        var ux = Math.cos(f.ang / DEG), uy = -Math.sin(f.ang / DEG);
        var perpX = -uy, perpY = ux;
        if (perpY > 0) { perpX = -perpX; perpY = -perpY; }   // keep the lift upward
        var align = t.x > w * 0.6 ? 'right' : (t.x < w * 0.4 ? 'left' : 'center');
        var lx, ly = t.y + perpY * 15;
        if (align === 'left')       { lx = t.x + 9 + perpX * 6; }
        else if (align === 'right') { lx = t.x - 9 + perpX * 6; }
        else                        { lx = t.x + ux * 13 + perpX * 15; ly = t.y + uy * 13 + perpY * 15; }
        ly = Math.max(12, ly);
        ctx.textAlign = align;
        /* record the label's hit-box so it can be right-clicked / clicked too */
        var lw = ctx.measureText(lbl).width, padB = 5;
        var bx0 = align === 'left' ? lx : (align === 'right' ? lx - lw : lx - lw / 2);
        labelBoxes.push({ i: i, x0: bx0 - padB, y0: ly - 7 - padB, x1: bx0 + lw + padB, y1: ly + 7 + padB });
        /* dark halo so the label stays legible over arrows and grid lines */
        ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(8,12,20,0.85)'; ctx.lineJoin = 'round';
        ctx.strokeText(lbl, lx, ly);
        ctx.fillStyle = f.color; ctx.fillText(lbl, lx, ly);
        ctx.restore();
        /* draggable handle — small sphere with a specular dot */
        ctx.save(); ctx.fillStyle = f.color; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.arc(t.x, t.y, 5, 0, TAU); ctx.fill();
        ctx.globalAlpha = 0.85; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(t.x - 1.5, t.y - 1.5, 1.4, 0, TAU); ctx.fill();
        ctx.restore();
      }
    });

    /* resultant */
    if (state.show.resultant && res.mag > 0.01 && !opts.hideResultant) {
      var rt = { x: O.x + res.rx * scalePx, y: O.y - res.ry * scalePx };
      arrow(O.x, O.y, rt.x, rt.y, '#ffffff', 4.5, 17, null, true);
      ctx.save(); ctx.font = '800 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(8,12,20,0.85)'; ctx.lineJoin = 'round';
      var rLbl = (!opts.hideValues) ? 'R ' + fmtMag(res.mag, 0) : 'R';
      var rDy = (!opts.hideValues) ? 16 : 14;
      ctx.strokeText(rLbl, rt.x, rt.y - rDy);
      ctx.fillStyle = '#fff'; ctx.fillText(rLbl, rt.x, rt.y - rDy);
      ctx.restore();
    }

    /* equilibrant (opposite the resultant) */
    if (state.show.equilibrant && res.mag > 0.01) {
      var et = { x: O.x - res.rx * scalePx, y: O.y + res.ry * scalePx };
      arrow(O.x, O.y, et.x, et.y, '#f5c842', 3, 14, [8, 5], true);
      ctx.save(); ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(8,12,20,0.85)'; ctx.lineJoin = 'round';
      ctx.strokeText('E', et.x - 12, et.y + 12);
      ctx.fillStyle = '#f5c842'; ctx.fillText('E', et.x - 12, et.y + 12); ctx.restore();
    }

    /* origin node (the body) */
    drawBodyNode();

    if (opts.hideValues && !opts.hideResultant) {
      ctx.save(); ctx.fillStyle = '#8b9dc3'; ctx.font = '600 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center'; ctx.fillText('Find the resultant force', w / 2, h - 14); ctx.restore();
    }
  }

  /* ═══════════════ Readouts ═══════════════ */
  function updateReadouts() {
    var r = resultant();
    $('rb-res').textContent = fmtMag(r.mag, 1);
    /* the direction of a (near-)zero resultant is numerical noise — show a dash */
    $('rb-dir').textContent = isEquilibrium() ? '—' : fmt(r.ang, 1) + '°';
    $('rb-fx').textContent = fmtMag(r.rx, 1);
    $('rb-fy').textContent = fmtMag(r.ry, 1);
    var eq = isEquilibrium();
    $('rb-status').textContent = eq ? 'Equilibrium' : 'Not balanced';
    $('rb-status-dot').style.background = eq ? 'var(--green)' : 'var(--red)';
    var sw = $('rb-status-wrap');
    if (sw) { sw.classList.toggle('is-eq', eq); sw.classList.toggle('is-noeq', !eq); }
  }

  /* ═══════════════ Forces editor UI ═══════════════ */
  function buildForcesList() {
    var list = $('forces-list');
    list.innerHTML = '';
    state.forces.forEach(function (f, i) {
      var row = document.createElement('div');
      row.className = 'force-row';
      row.innerHTML =
        '<span class="force-swatch" style="background:' + f.color + '"></span>' +
        '<span class="force-name">F' + (i + 1) + '</span>' +
        '<span class="force-field"><label>Mag</label><input class="force-input" data-i="' + i + '" data-k="mag" type="number" step="any" value="' + fmt(toDisp(f.mag), 1) + '"><span class="force-unit">' + uLabel() + '</span></span>' +
        '<span class="force-field"><label>Angle</label><input class="force-input" data-i="' + i + '" data-k="ang" type="number" step="any" value="' + fmt(f.ang, 1) + '"><span class="force-unit">°</span></span>' +
        '<button class="force-del" data-i="' + i + '" title="Remove force">&times;</button>';
      list.appendChild(row);
    });
    list.querySelectorAll('.force-input').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var i = +inp.getAttribute('data-i'), k = inp.getAttribute('data-k');
        var v = parseFloat(inp.value);
        if (isNaN(v)) return;
        if (k === 'mag') state.forces[i].mag = Math.max(0, toN(v));
        else state.forces[i].ang = ((v % 360) + 360) % 360;
        refresh();
      });
    });
    list.querySelectorAll('.force-del').forEach(function (b) {
      b.addEventListener('click', function () {
        state.forces.splice(+b.getAttribute('data-i'), 1);
        playClick(); refresh();
      });
    });
  }

  function refresh() {
    cancelPoly();        /* any real state change ends a running polygon animation */
    buildForcesList();
    updateReadouts();
    updateEquations();
    updatePolyBtn();
    draw();
  }

  /* ═══════════════ KaTeX live equations ═══════════════ */
  function renderMath(el) {
    if (el && window.renderMathInElement) {
      try {
        window.renderMathInElement(el, {
          delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }],
          throwOnError: false
        });
      } catch (e) {}
    }
  }
  var _eqCache = '';
  function updateEquations() {
    var eq = $('lp-eq-body'); if (!eq) return;
    var c = components(), r = resultant(), u = uLabel();
    var html = '';
    state.forces.forEach(function (f, i) {
      var fx = f.mag * Math.cos(f.ang / DEG), fy = f.mag * Math.sin(f.ang / DEG);
      html += '<div class="eq-line">\\(F_{' + (i + 1) + '} = ' + fmt(toDisp(f.mag), 1) + '\\,\\mathrm{' + u + '} \\angle ' + fmt(f.ang, 0) + '^\\circ \\Rightarrow F_x = ' + fmt(toDisp(fx), 1) + ',\\; F_y = ' + fmt(toDisp(fy), 1) + '\\)</div>';
    });
    html += '<div class="eq-line">\\[ \\Sigma F_x = ' + fmt(toDisp(c.rx), 1) + '\\,\\mathrm{' + u + '}, \\quad \\Sigma F_y = ' + fmt(toDisp(c.ry), 1) + '\\,\\mathrm{' + u + '} \\]</div>';
    html += '<div class="eq-line">\\[ R = \\sqrt{\\Sigma F_x^{2} + \\Sigma F_y^{2}} = \\mathbf{' + fmt(toDisp(r.mag), 1) + '\\,\\mathrm{' + u + '}} \\]</div>';
    html += '<div class="eq-line">\\( \\theta = \\operatorname{atan2}(\\Sigma F_y,\\, \\Sigma F_x) = \\mathbf{' + fmt(r.ang, 1) + '^\\circ} ' + (isEquilibrium() ? '\\;\\text{(equilibrium)}' : '') + '\\)</div>';
    if (html !== _eqCache) { eq.innerHTML = html; _eqCache = html; renderMath(eq); }
  }

  /* ═══════════════ Show-Calculations modal ═══════════════ */
  function openCalc() {
    var c = components(), r = resultant(), u = uLabel();
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">' + state.forces.length + ' forces</span><div class="cs-given">' +
      state.forces.map(function (f, i) { return '<span>\\(F_{' + (i + 1) + '} = ' + fmt(toDisp(f.mag), 1) + '\\,' + u + ' \\angle ' + fmt(f.ang, 0) + '^\\circ\\)</span>'; }).join('') +
      '</div><p class="cs-si-note">Sign convention: +x right, +y up; angles anticlockwise from +x.</p></div>';
    var rows = state.forces.map(function (f, i) {
      var fx = f.mag * Math.cos(f.ang / DEG), fy = f.mag * Math.sin(f.ang / DEG);
      return 'F_{' + (i + 1) + '} &: ' + fmt(toDisp(f.mag), 1) + '\\cos ' + fmt(f.ang, 0) + '^\\circ = ' + fmt(toDisp(fx), 1) + ',\\quad ' + fmt(toDisp(f.mag), 1) + '\\sin ' + fmt(f.ang, 0) + '^\\circ = ' + fmt(toDisp(fy), 1);
    }).join(' \\\\ ');
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 1</span><span class="cs-title">Resolve each force</span></div>' +
      '<div class="cs-formula">\\( F_x = F\\cos\\theta,\\; F_y = F\\sin\\theta \\)</div>' +
      '<div class="cs-calc">\\[ \\begin{aligned} ' + rows + ' \\end{aligned} \\]</div></div>';
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 2</span><span class="cs-title">Sum the components</span></div>' +
      '<div class="cs-calc">\\[ \\Sigma F_x = ' + fmt(toDisp(c.rx), 1) + '\\,' + u + ', \\quad \\Sigma F_y = ' + fmt(toDisp(c.ry), 1) + '\\,' + u + ' \\]</div></div>';
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Resultant magnitude</span></div>' +
      '<div class="cs-formula">\\[ R = \\sqrt{\\Sigma F_x^{2} + \\Sigma F_y^{2}} \\]</div>' +
      '<div class="cs-result">= <strong>' + fmt(toDisp(r.mag), 2) + ' ' + u + '</strong></div></div>';
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 4</span><span class="cs-title">Direction</span></div>' +
      '<div class="cs-formula">\\[ \\theta = \\operatorname{atan2}(\\Sigma F_y,\\, \\Sigma F_x) \\]</div>' +
      '<div class="cs-result">= <strong>' + fmt(r.ang, 1) + '&deg;</strong>' + (isEquilibrium() ? ' &mdash; system in equilibrium (R &approx; 0)' : '') + '</div></div>';
    $('calc-modal-body').innerHTML = html;
    $('calc-modal').classList.add('active');
    renderMath($('calc-modal-body'));
  }
  function closeCalc() { $('calc-modal').classList.remove('active'); }

  function addForce(mag, ang, color) {
    var i = state.forces.length;
    state.forces.push({ mag: mag != null ? mag : 50, ang: ang != null ? ang : (i * 60) % 360, color: color || PALETTE[i % PALETTE.length] });
  }

  /* ═══════════════ Presets ═══════════════ */
  var PRESETS = {
    two:      [{ m: 100, a: 0 }, { m: 100, a: 90 }],
    'three-eq': [{ m: 100, a: 90 }, { m: 100, a: 210 }, { m: 100, a: 330 }],
    hang:     [{ m: 100, a: 270 }, { m: 70.7, a: 45 }, { m: 70.7, a: 135 }],
    tug:      [{ m: 120, a: 0 }, { m: 90, a: 180 }],
    four:     [{ m: 80, a: 20 }, { m: 60, a: 110 }, { m: 100, a: 200 }, { m: 50, a: 300 }]
  };
  function loadPreset(key) {
    var p = PRESETS[key] || PRESETS.two;
    state.forces = p.map(function (f, i) { return { mag: f.m, ang: f.a, color: PALETTE[i % PALETTE.length] }; });
    refresh();
  }

  /* ═══════════════ Canvas dragging ═══════════════ */
  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  /* pointer hit-slop for grabbing a vector anywhere along its length (px).
     ~12px is a standard line/handle picking tolerance (≈half a 24px comfortable
     mouse target); a touch's larger contact gets a bit more. */
  var HIT_TOL = 12;
  function distToSeg(p, a, b) {
    var vx = b.x - a.x, vy = b.y - a.y, wx = p.x - a.x, wy = p.y - a.y;
    var c1 = vx * wx + vy * wy; if (c1 <= 0) return Math.hypot(wx, wy);
    var c2 = vx * vx + vy * vy; if (c2 <= c1) return Math.hypot(p.x - b.x, p.y - b.y);
    var t = c1 / c2; return Math.hypot(p.x - (a.x + t * vx), p.y - (a.y + t * vy));
  }
  function hitForce(p, tol) {
    tol = tol || HIT_TOL;
    if (Math.hypot(p.x - O.x, p.y - O.y) < 9) return -1;   // the body/origin isn't a grab handle
    var best = -1, bestD = tol;
    for (var i = state.forces.length - 1; i >= 0; i--) {
      var d = distToSeg(p, O, vec(state.forces[i]));
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  function hitResultant(p) {
    if (!state.show.resultant) return false;
    var res = resultant(); if (res.mag <= 0.01) return false;
    var rt = { x: O.x + res.rx * scalePx, y: O.y - res.ry * scalePx };
    return distToSeg(p, O, rt) < HIT_TOL;
  }
  function hitLabel(p) {
    for (var i = labelBoxes.length - 1; i >= 0; i--) {
      var b = labelBoxes[i];
      if (p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1) return b.i;
    }
    return -1;
  }
  var displayAutoCollapsed = false, pdown = null, forcePopIdx = null, ctxForceIdx = -1;
  function pointerDown(e) {
    if (state.mode !== 'simulate') return;
    if (poly.active) { cancelPoly(); draw(); return; }   /* a click stops the running animation */
    if (poly.done) { poly.done = false; draw(); }        /* and clears the held polygon result */
    /* on the user's first interaction with the canvas, tuck the Display panel
       away once — after that it only opens/closes via its own handle */
    if (!displayAutoCollapsed) {
      displayAutoCollapsed = true;
      var disp = $('canvas-display'), dispToggle = $('display-toggle');
      if (disp && dispToggle && disp.getAttribute('data-collapsed') !== 'true') {
        disp.setAttribute('data-collapsed', 'true');
        dispToggle.setAttribute('aria-expanded', 'false');
      }
    }
    var p = canvasPos(e);
    var i = hitForce(p, e.pointerType === 'touch' ? 18 : HIT_TOL);
    if (i >= 0) {
      state.drag = i; pdown = { i: i, x: p.x, y: p.y, moved: false };
      canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; playClick();
    } else if (hitResultant(p)) {
      /* the resultant shows a pointer cursor — clicking it opens the derivation */
      closeForcePop(); openCalc(); playClick();
    } else { closeForcePop(); }   /* tapping empty canvas dismisses the editor */
  }
  function pointerMove(e) {
    if (state.drag == null) {
      /* hover feedback: forces are draggable, the resultant is distinct */
      if (state.mode === 'simulate') {
        var hp = canvasPos(e);
        canvas.style.cursor = hitForce(hp) >= 0 ? 'grab' : (hitResultant(hp) ? 'pointer' : '');
      }
      return;
    }
    var p = canvasPos(e);
    /* below a small threshold treat it as a click (open the text editor), not a drag */
    if (pdown && !pdown.moved) {
      if (Math.hypot(p.x - pdown.x, p.y - pdown.y) < 4) return;
      pdown.moved = true; closeForcePop();
    }
    var dx = p.x - O.x, dy = O.y - p.y;
    var mag = Math.hypot(dx, dy) / scalePx;
    var ang = Math.atan2(dy, dx) * DEG; if (ang < 0) ang += 360;
    state.forces[state.drag].mag = Math.round(mag * 10) / 10;
    state.forces[state.drag].ang = Math.round(ang);
    updateReadouts(); buildForcesList(); draw();
  }
  function pointerUp() {
    if (state.drag == null) return;
    var clicked = pdown && !pdown.moved, idx = pdown ? pdown.i : -1;
    state.drag = null; pdown = null; canvas.style.cursor = 'grab';
    if (clicked && idx >= 0) openForcePop(idx);   /* click without drag → type exact values */
    else refresh();
  }

  /* ═══════════════ Inline force editor (click a force to type values) ═══════════════ */
  function openForcePop(i) {
    var f = state.forces[i]; if (!f) return;
    if (poly.done) { poly.done = false; draw(); }   /* leave the held polygon view to edit */
    forcePopIdx = i;
    var pop = $('force-pop'); if (!pop) return;
    $('fp-name').textContent = 'F' + (i + 1);
    $('fp-swatch').style.background = f.color;
    $('fp-unit').textContent = uLabel();
    $('fp-mag').value = trimNum(toDisp(f.mag), 1);
    $('fp-ang').value = trimNum(f.ang, 1);
    pop.style.display = 'block';
    /* anchor near the force tip, clamped inside the canvas card */
    var t = vec(f), card = canvas.parentElement;
    var pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.max(8, Math.min(t.x + 14, card.clientWidth - pw - 8));
    var top  = Math.max(8, Math.min(t.y + 14, card.clientHeight - ph - 8));
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
    $('fp-mag').focus(); $('fp-mag').select();
  }
  function closeForcePop() {
    forcePopIdx = null;
    var pop = $('force-pop'); if (pop) pop.style.display = 'none';
  }
  function applyForcePop() {
    if (forcePopIdx == null) return;
    poly.done = false;
    var f = state.forces[forcePopIdx]; if (!f) return;
    var mv = parseFloat($('fp-mag').value); if (!isNaN(mv) && mv >= 0) f.mag = toN(mv);
    var av = parseFloat($('fp-ang').value); if (!isNaN(av)) f.ang = ((av % 360) + 360) % 360;
    updateReadouts(); buildForcesList(); draw();
  }

  /* ═══════════════ Polygon-law build animation ═══════════════ */
  var poly = { active: false, done: false, raf: null, t0: 0, per: 720, res: 800, total: 0 };
  function nowMs() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function easeInOut(p) { return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function cancelPoly() { if (poly.raf) { cancelAnimationFrame(poly.raf); poly.raf = null; } poly.active = false; poly.done = false; }
  function playPoly() {
    if (state.mode !== 'simulate') return;
    var n = state.forces.length; if (n < 2) return;   /* polygon law needs at least two forces */
    cancelPoly(); closeForcePop();
    if (!state.show.polygon) { state.show.polygon = true; syncToggleChips(); }
    poly.active = true; poly.t0 = nowMs();
    poly.total = n * poly.per + poly.res;
    canvas.style.cursor = 'default'; playClick();
    poly.raf = requestAnimationFrame(polyStep);
  }
  function polyStep() {
    if (!poly.active) return;
    var t = nowMs() - poly.t0;
    renderPoly(t);
    if (t >= poly.total) { poly.active = false; poly.raf = null; poly.done = true; draw(); return; }
    poly.raf = requestAnimationFrame(polyStep);
  }
  function polyLabel(txt, x, y, color, big) {
    ctx.save();
    ctx.font = (big ? '800 13px' : '700 11px') + ' "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.5; ctx.strokeStyle = 'rgba(8,12,20,0.85)'; ctx.lineJoin = 'round';
    ctx.strokeText(txt, x, y); ctx.fillStyle = color; ctx.fillText(txt, x, y);
    ctx.restore();
  }
  function renderPoly(elapsed) {
    var dim = sizeCanvas(), w = dim.w, h = dim.h;
    ctx.clearRect(0, 0, w, h);
    drawSceneBg(w, h);
    /* grid + axes (respect the display toggles) */
    if (state.show.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; var step = 28;
      for (var gx = O.x % step; gx < w; gx += step) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
      for (var gy = O.y % step; gy < h; gy += step) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    }
    if (state.show.axes) {
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, O.y); ctx.lineTo(w, O.y); ctx.moveTo(O.x, 0); ctx.lineTo(O.x, h); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('+x', w - 22, O.y - 10); ctx.fillText('+y', O.x + 8, 12);
    }
    var fs = state.forces, n = fs.length;
    var vecs = fs.map(function (f) { return { x: f.mag * scalePx * Math.cos(f.ang / DEG), y: -f.mag * scalePx * Math.sin(f.ang / DEG), color: f.color }; });
    var chain = [{ x: O.x, y: O.y }];
    for (var i = 0; i < n; i++) chain.push({ x: chain[i].x + vecs[i].x, y: chain[i].y + vecs[i].y });
    /* grayed-out originals (all anchored at the origin) */
    for (var g = 0; g < n; g++) arrow(O.x, O.y, O.x + vecs[g].x, O.y + vecs[g].y, 'rgba(122,132,153,0.34)', 2.4, 11);
    /* tip-to-tail build */
    var buildEnd = n * poly.per, building = elapsed < buildEnd;
    var curIdx = building ? Math.min(n - 1, Math.floor(elapsed / poly.per)) : n;
    for (var k = 0; k < curIdx; k++) {
      arrow(chain[k].x, chain[k].y, chain[k + 1].x, chain[k + 1].y, vecs[k].color, 3.4, 13, null, true);
      polyLabel('F' + (k + 1), chain[k].x + vecs[k].x / 2, chain[k].y + vecs[k].y / 2, vecs[k].color);
    }
    if (building && curIdx < n) {
      var lp = easeInOut(clamp01((elapsed - curIdx * poly.per) / poly.per));
      var tx = O.x + (chain[curIdx].x - O.x) * lp, ty = O.y + (chain[curIdx].y - O.y) * lp;
      /* faint guide from the origin copy to where it is sliding */
      ctx.save(); ctx.setLineDash([3, 4]); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(O.x + vecs[curIdx].x, O.y + vecs[curIdx].y); ctx.lineTo(tx + vecs[curIdx].x, ty + vecs[curIdx].y); ctx.stroke(); ctx.restore();
      arrow(tx, ty, tx + vecs[curIdx].x, ty + vecs[curIdx].y, vecs[curIdx].color, 3.4, 13, null, true);
      polyLabel('F' + (curIdx + 1), tx + vecs[curIdx].x / 2, ty + vecs[curIdx].y / 2, vecs[curIdx].color);
    }
    /* resultant — the closing vector from origin to the final tip */
    if (!building) {
      var rp = easeInOut(clamp01((elapsed - buildEnd) / poly.res)), fin = chain[n];
      if (Math.hypot(fin.x - O.x, fin.y - O.y) < 3) {
        polyLabel('Closed polygon — equilibrium', O.x, O.y - 22, '#3ddc84', true);
      } else {
        var rtx = O.x + (fin.x - O.x) * rp, rty = O.y + (fin.y - O.y) * rp;
        ctx.save(); ctx.setLineDash([2, 3]); ctx.strokeStyle = 'rgba(255,255,255,.30)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(fin.x, fin.y); ctx.stroke(); ctx.restore();
        arrow(O.x, O.y, rtx, rty, '#ffffff', 4.5, 17, null, true);
        if (rp > 0.55) polyLabel('R ' + fmtMag(resultant().mag, 0), rtx, rty - 16, '#fff', true);
      }
    }
    /* origin node */
    drawBodyNode();
  }
  function syncToggleChips() {
    document.querySelectorAll('#view-toggles .toggle-chip[data-tg], #display-toggles .toggle-chip[data-tg]').forEach(function (c) {
      c.classList.toggle('active', !!state.show[c.getAttribute('data-tg')]);
    });
  }
  function updatePolyBtn() {
    var b = $('btn-poly-anim'); if (b) b.disabled = state.forces.length < 2;
  }

  /* ═══════════════ Mode switching ═══════════════ */
  function hideAll() {
    ['sim-panel','tool-bar','cat-row','item-selector','item-info',
     'practice-panel','practice-bar','quiz-panel','quiz-bar','quiz-result'].forEach(function (id) {
      var el = $(id); if (el) el.style.display = 'none';
    });
  }
  var SECTIONS = {
    simulate: ['sim-panel', 'tool-bar'],
    explore:  ['cat-row', 'item-selector', 'item-info'],
    practice: ['practice-panel', 'practice-bar'],
    quiz:     ['quiz-panel', 'quiz-bar']
  };
  var calcSnap = null;
  function syncUnitTabs() {
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-unit') === state.unit);
    });
  }
  function setMode(mode) {
    /* snapshot the whole Simulate setup — Practice/Quiz overwrite the forces,
       force the unit to N and clear the view toggles; restore all of it */
    if (state.mode === 'simulate' && mode !== 'simulate') {
      calcSnap = {
        forces: JSON.parse(JSON.stringify(state.forces)),
        unit: state.unit,
        show: JSON.parse(JSON.stringify(state.show))
      };
    }
    state.mode = mode;
    cancelPoly(); closeForcePop();
    hideAll();
    $('canvas-card').style.display = (mode === 'explore') ? 'none' : '';
    var dock = $('canvas-dock'); if (dock) dock.style.display = (mode === 'simulate') ? '' : 'none';
    var disp = $('canvas-display'); if (disp) disp.style.display = (mode === 'simulate') ? '' : 'none';
    (SECTIONS[mode] || []).forEach(function (id) { var el = $(id); if (el) el.style.display = ''; });
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-mode') === mode);
    });
    if (mode === 'simulate') {
      if (calcSnap) {
        state.forces = JSON.parse(JSON.stringify(calcSnap.forces));
        state.unit = calcSnap.unit;
        state.show = JSON.parse(JSON.stringify(calcSnap.show));
      }
      syncUnitTabs(); refresh(); syncToggleChips();
    }
    else if (mode === 'explore') renderExplore();
    else if (mode === 'practice') newPractice();
    else if (mode === 'quiz') startQuiz();
    /* Practice and Quiz force state.unit back to N so their problems are
       stated in SI — the pills have to follow, or the toggle sits on "lbf"
       while every value on screen is newtons. */
    syncUnitTabs();
    playClick();
  }

  /* ═══════════════ Explore ═══════════════ */
  var EXPLORE = {
    basics: [
      { name: 'What is a force?', body: 'A force is a push or pull with both a <strong>magnitude</strong> and a <strong>direction</strong> — it is a vector. Forces are measured in newtons (N). Because they have direction, forces cannot simply be added like ordinary numbers unless they act along the same line.', note: 'Weight, tension, friction and normal reaction are the forces you meet most often.' },
      { name: 'Free body diagram', body: 'A free body diagram isolates one body and shows <strong>every external force</strong> on it as an arrow, drawn from the body in the direction the force acts. It strips away everything else so you can apply the equations of equilibrium cleanly.', note: 'Draw the body as a dot for a particle, or a box for an extended body.' },
      { name: 'Concurrent forces', body: 'Forces are <strong>concurrent</strong> when their lines of action all pass through one point. This tool handles coplanar concurrent forces — the case where a single resultant (and a single equilibrant) fully describes the system.', note: 'Non-concurrent forces also produce a moment, handled by the Torque simulator.' }
    ],
    components: [
      { name: 'Resolving a force', body: 'Any force F at angle θ resolves into a horizontal and a vertical part. This lets you add forces axis-by-axis.', formula: 'Fx = F·cosθ    Fy = F·sinθ', note: '200 N @ 30°: Fx = 173.2 N, Fy = 100 N.' },
      { name: 'Sign convention', body: 'Pick directions and stick to them. Here +x points right, +y points up, and angles are measured anticlockwise from +x. A force pointing left has a negative Fx; one pointing down has a negative Fy.', note: 'Mixing conventions mid-problem is the most common beginner error.' },
      { name: 'Summing components', body: 'Add all the x-components to get Rx and all the y-components to get Ry. These two numbers contain everything about the resultant.', formula: 'Rx = ΣFx     Ry = ΣFy', note: 'Toggle Components on the diagram to see Rx and Ry drawn.' }
    ],
    resultant: [
      { name: 'Resultant from components', body: 'Once you have Rx and Ry, the resultant is found by Pythagoras and the arctangent.', formula: 'R = √(Rx² + Ry²)   θ = atan2(Ry, Rx)', note: 'Rx=60, Ry=80 → R = 100 N @ 53.1°.' },
      { name: 'Parallelogram law', body: 'For two forces separated by angle φ, the resultant follows directly from the parallelogram (cosine) law without resolving.', formula: 'R = √(F1² + F2² + 2·F1·F2·cosφ)', note: 'Two 100 N forces 90° apart → R = 141.4 N.' },
      { name: 'Polygon law', body: 'Draw the forces tip-to-tail; the line from the first tail to the last tip is the resultant. If the polygon <strong>closes</strong>, the resultant is zero.', note: 'Toggle Force Polygon to watch this build up.' }
    ],
    equilibrium: [
      { name: 'Conditions for equilibrium', body: 'A particle is in equilibrium when the net force is zero. For coplanar concurrent forces that means both component sums vanish.', formula: 'ΣFx = 0   and   ΣFy = 0', note: 'Equilibrium → at rest or constant velocity.' },
      { name: 'The equilibrant', body: 'The <strong>equilibrant</strong> is the single force that brings a system into equilibrium. It is equal in size and opposite in direction to the resultant.', formula: 'E = −R', note: 'Toggle Equilibrant to see it as a dashed gold arrow.' },
      { name: 'Lami’s theorem', body: 'For a body in equilibrium under exactly three concurrent forces, each force is proportional to the sine of the angle between the other two.', formula: 'F1/sinα = F2/sinβ = F3/sinγ', note: 'Perfect for a weight hung from two cables.' }
    ],
    applications: [
      { name: 'Hanging signs & cables', body: 'A sign hung from two cables is a three-force equilibrium problem. Resolve the weight and the two tensions, set ΣFx = ΣFy = 0, and solve — or use Lami’s theorem.', note: 'Load the “Hanging weight” preset.' },
      { name: 'Tug of war & collinear forces', body: 'When forces act along the same line, the resultant is just their algebraic sum. The bigger pull wins by the difference.', formula: 'R = F1 − F2 (opposite directions)', note: '120 N vs 90 N → 30 N net.' },
      { name: 'Before truss analysis', body: 'Every joint in a pin-jointed truss is a concurrent-force equilibrium problem. Mastering the FBD here is the prerequisite for the method of joints.', note: 'See the Truss Analysis simulator next.' }
    ]
  };
  var exploreCat = 'basics', exploreIdx = 0;
  function renderExplore() {
    var grid = $('concept-grid'); grid.innerHTML = '';
    EXPLORE[exploreCat].forEach(function (item, i) {
      var card = document.createElement('div');
      card.className = 'is-card' + (i === exploreIdx ? ' active' : '');
      card.innerHTML = '<div class="is-card-name">' + item.name + '</div>';
      card.addEventListener('click', function () { exploreIdx = i; renderExplore(); playClick(); });
      grid.appendChild(card);
    });
    var item = EXPLORE[exploreCat][exploreIdx];
    var html = '<h3>' + item.name + '</h3><p>' + item.body + '</p>';
    if (item.formula) html += '<div class="formula-box">' + item.formula + '</div>';
    if (item.note) html += '<div class="example-box"><div class="step">💡 ' + item.note + '</div></div>';
    $('item-info').innerHTML = html;
  }

  /* ═══════════════ Practice ═══════════════ */
  var practiceScore = { correct: 0, total: 0 };
  var pAnswer = 0;
  function randInt(n) { return Math.floor(Math.random() * n); }
  function genForces(n) {
    var arr = [];
    for (var i = 0; i < n; i++) arr.push({ mag: (randInt(18) + 3) * 10, ang: randInt(12) * 30, color: PALETTE[i % PALETTE.length] });
    return arr;
  }
  function newPractice() {
    state.unit = 'N';
    state.forces = genForces(2 + randInt(2));
    state.show.resultant = false; state.show.components = false; state.show.polygon = false; state.show.equilibrant = false;
    var r = resultant();
    pAnswer = r.mag;
    draw({ hideValues: true, hideResultant: true });
    $('pp-prompt').innerHTML = 'Compute the <strong>magnitude of the resultant</strong> of these ' + state.forces.length + ' forces (in N).';
    $('pp-unit').textContent = 'N';
    $('pp-input').value = ''; $('pp-input').disabled = false;
    $('pp-feedback').textContent = ''; $('pp-feedback').className = 'feedback';
    $('pp-solution').style.display = 'none';
    $('pp-check').style.display = ''; $('pp-next').style.display = 'none';
  }
  function checkPractice() {
    var v = parseFloat($('pp-input').value);
    if (isNaN(v)) { $('pp-feedback').textContent = 'Enter a number first.'; $('pp-feedback').className = 'feedback wrong'; return; }
    var ok = Math.abs(v - pAnswer) / (pAnswer || 1) < 0.02;
    practiceScore.total++;
    if (ok) { practiceScore.correct++; $('pp-feedback').textContent = '✓ Correct!'; $('pp-feedback').className = 'feedback correct'; playSuccess(); }
    else { $('pp-feedback').textContent = '✗ Not quite.'; $('pp-feedback').className = 'feedback wrong'; playError(); }
    $('pbar-score-val').textContent = practiceScore.correct + ' / ' + practiceScore.total;
    var c = components();
    var rows = state.forces.map(function (f, i) {
      return 'F' + (i + 1) + ' = ' + f.mag + ' N @ ' + f.ang + '° → Fx=' + fmt(f.mag * Math.cos(f.ang / DEG), 1) + ', Fy=' + fmt(f.mag * Math.sin(f.ang / DEG), 1);
    }).join('<br>');
    $('pp-solution').style.display = '';
    $('pp-solution').innerHTML = rows +
      '<br><strong>ΣFx = ' + fmt(c.rx, 1) + ' N, ΣFy = ' + fmt(c.ry, 1) + ' N</strong>' +
      '<br>R = √(' + fmt(c.rx, 1) + '² + ' + fmt(c.ry, 1) + '²) = <strong>' + fmt(pAnswer, 1) + ' N</strong> @ ' + fmt(resultant().ang, 1) + '°';
    $('pp-input').disabled = true; $('pp-check').style.display = 'none'; $('pp-next').style.display = '';
    state.show.resultant = true; state.show.components = true;
    draw();
  }

  /* ═══════════════ Quiz ═══════════════ */
  var QUIZ_SIZE = 5;
  var quiz = { qs: [], idx: 0, score: 0, answered: false };
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = randInt(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function buildQuizQuestion() {
    var type = randInt(4);
    if (type === 0) {
      /* resultant of 2 perpendicular forces (draw) */
      var a = (randInt(8) + 3) * 10, b = (randInt(8) + 3) * 10;
      var fs = [{ mag: a, ang: 0, color: PALETTE[0] }, { mag: b, ang: 90, color: PALETTE[1] }];
      var R = Math.hypot(a, b);
      var opts = [fmt(R, 1)];
      [a + b, Math.abs(a - b), fmt(R * 1.2, 1)].forEach(function (x) { var s = fmt(+x, 1); if (opts.indexOf(s) === -1) opts.push(s); });
      return { forces: fs, draw: true, prompt: 'What is the magnitude of the resultant of ' + a + ' N (→) and ' + b + ' N (↑)?',
               options: shuffle(opts).map(function (s) { return s + ' N'; }), answer: fmt(R, 1) + ' N', explain: 'R = √(' + a + '² + ' + b + '²) = ' + fmt(R, 1) + ' N.' };
    }
    if (type === 1) {
      /* component */
      var F = (randInt(8) + 3) * 10, ang = [30, 45, 60][randInt(3)];
      var fx = F * Math.cos(ang / DEG);
      var o = [fmt(fx, 1)];
      [F * Math.sin(ang / DEG), F, F * 0.5].forEach(function (x) { var s = fmt(+x, 1); if (o.indexOf(s) === -1) o.push(s); });
      return { forces: [{ mag: F, ang: ang, color: PALETTE[0] }], draw: true, prompt: 'What is the horizontal component Fx of ' + F + ' N at ' + ang + '°?',
               options: shuffle(o).map(function (s) { return s + ' N'; }), answer: fmt(fx, 1) + ' N', explain: 'Fx = F·cosθ = ' + F + '·cos' + ang + '° = ' + fmt(fx, 1) + ' N.' };
    }
    if (type === 2) {
      var pool = [
        { p: 'A particle is in equilibrium when…', a: 'ΣFx = 0 and ΣFy = 0', o: ['ΣFx = 0 and ΣFy = 0', 'ΣFx = ΣFy', 'the resultant is maximum', 'all forces are equal'], e: 'Equilibrium needs both component sums to be zero.' },
        { p: 'The equilibrant of a force system is…', a: 'equal and opposite to the resultant', o: ['equal and opposite to the resultant', 'equal to the resultant', 'always zero', 'the largest force'], e: 'E = −R brings the system to equilibrium.' },
        { p: 'A closed force polygon means…', a: 'the system is in equilibrium', o: ['the system is in equilibrium', 'the resultant is largest', 'there are exactly 3 forces', 'forces are parallel'], e: 'A closed polygon means the resultant is zero.' }
      ];
      var q = pool[randInt(pool.length)];
      return { forces: null, draw: false, prompt: q.p, options: shuffle(q.o.slice()), answer: q.a, explain: q.e };
    }
    /* Lami / collinear */
    var pool2 = [
      { p: 'Lami’s theorem applies to a body in equilibrium under how many concurrent forces?', a: '3', o: ['3', '2', '4', 'any number'], e: 'Lami’s theorem is for exactly three concurrent forces.' },
      { p: 'Two collinear forces 120 N and 90 N act in opposite directions. The resultant is…', a: '30 N', o: ['30 N', '210 N', '150 N', '0 N'], e: '120 − 90 = 30 N in the direction of the larger force.' },
      { p: 'Two equal forces act in exactly opposite directions. The resultant is…', a: '0 N', o: ['0 N', 'double one force', 'equal to one force', 'undefined'], e: 'Equal and opposite forces cancel: R = 0.' }
    ];
    var q2 = pool2[randInt(pool2.length)];
    return { forces: null, draw: false, prompt: q2.p, options: shuffle(q2.o.slice()), answer: q2.a, explain: q2.e };
  }

  function startQuiz() {
    quiz.qs = []; quiz.idx = 0; quiz.score = 0;
    for (var i = 0; i < QUIZ_SIZE; i++) quiz.qs.push(buildQuizQuestion());
    $('quiz-result').style.display = 'none'; $('quiz-panel').style.display = ''; $('quiz-bar').style.display = '';
    renderQuiz();
  }
  function renderQuiz() {
    var q = quiz.qs[quiz.idx]; quiz.answered = false;
    $('qbar-num').textContent = (quiz.idx + 1);
    var cc = $('canvas-card');
    if (q.draw && q.forces) { cc.style.display = ''; state.forces = q.forces; state.show.resultant = false; state.show.components = false; state.show.polygon = false; state.show.equilibrant = false; draw({ hideValues: true, hideResultant: true }); }
    else { cc.style.display = 'none'; }
    var html = '<p class="q-prompt">' + q.prompt + '</p><div class="q-options">';
    q.options.forEach(function (opt) { html += '<button class="q-opt" data-opt="' + String(opt).replace(/"/g, '&quot;') + '">' + opt + '</button>'; });
    html += '</div>';
    $('quiz-panel').innerHTML = html;
    $('quiz-panel').querySelectorAll('.q-opt').forEach(function (b) {
      b.addEventListener('click', function () { answerQuiz(b.getAttribute('data-opt'), b); });
    });
  }
  function answerQuiz(choice, btn) {
    if (quiz.answered) return; quiz.answered = true;
    var q = quiz.qs[quiz.idx]; var correct = String(q.answer);
    $('quiz-panel').querySelectorAll('.q-opt').forEach(function (b) {
      var v = b.getAttribute('data-opt');
      if (v === correct) b.classList.add('correct'); else if (b === btn) b.classList.add('wrong');
      b.style.pointerEvents = 'none';
    });
    if (choice === correct) { quiz.score++; playSuccess(); } else { playError(); }
    if (q.draw && q.forces) { state.show.resultant = true; draw(); }
    var exp = document.createElement('div'); exp.className = 'solution-panel'; exp.style.display = '';
    exp.innerHTML = (choice === correct ? '<strong style="color:var(--green)">Correct!</strong> ' : '<strong style="color:var(--red)">Not quite.</strong> ') + q.explain;
    $('quiz-panel').appendChild(exp);
    var next = document.createElement('button'); next.className = 'btn btn-primary'; next.style.marginTop = '12px';
    next.textContent = (quiz.idx < QUIZ_SIZE - 1) ? 'Next Question →' : 'See Results';
    next.addEventListener('click', function () { if (quiz.idx < QUIZ_SIZE - 1) { quiz.idx++; renderQuiz(); } else showQuizResult(); });
    $('quiz-panel').appendChild(next);
  }
  function showQuizResult() {
    $('quiz-panel').style.display = 'none'; $('quiz-bar').style.display = 'none'; $('canvas-card').style.display = '';
    var pct = quiz.score / QUIZ_SIZE;
    var stars = pct >= 1 ? 5 : pct >= 0.8 ? 4 : pct >= 0.6 ? 3 : pct >= 0.4 ? 2 : pct >= 0.2 ? 1 : 0;
    var s = ''; for (var i = 0; i < 5; i++) s += i < stars ? '★' : '☆';
    var msg = pct >= 0.8 ? 'Excellent — you’ve mastered force resolution!' : pct >= 0.6 ? 'Good work — review components and equilibrium.' : 'Revisit the Explore cards and try again.';
    var res = $('quiz-result'); res.style.display = '';
    res.innerHTML = '<h3>Quiz Complete</h3><div class="stars">' + s + '</div><div class="score">' + quiz.score + ' / ' + QUIZ_SIZE + '</div>' +
      '<p style="color:var(--text-dim);margin:8px 0 14px">' + msg + '</p><button class="btn btn-primary" id="quiz-retry">Try Again</button>';
    $('quiz-retry').addEventListener('click', startQuiz);
    playSuccess();
  }

  /* ═══════════════ Export / ctx ═══════════════ */
  function exportPNG() {
    var tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d'); tc.fillStyle = '#0a0e14'; tc.fillRect(0, 0, tmp.width, tmp.height); tc.drawImage(canvas, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 11) fs = 11;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom'; tc.fillStyle = 'rgba(255,255,255,0.28)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'free_body_diagram.png'; a.click();
  }
  function copyData() {
    var r = resultant();
    var txt = 'Resultant R = ' + fmt(toDisp(r.mag), 2) + ' ' + uLabel() + ' @ ' + fmt(r.ang, 1) + '°  (ΣFx=' + fmt(toDisp(r.rx), 2) + ', ΣFy=' + fmt(toDisp(r.ry), 2) + ')';
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
  }

  /* ═══════════════ Init ═══════════════ */
  function init() {
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () { setMode(p.getAttribute('data-mode')); });
    });
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        state.unit = p.getAttribute('data-unit');
        document.querySelectorAll('#unit-tabs .pill').forEach(function (q) { q.classList.remove('active'); });
        p.classList.add('active'); playClick(); refresh();
      });
    });
    document.querySelectorAll('#view-toggles .toggle-chip[data-tg], #display-toggles .toggle-chip[data-tg]').forEach(function (c) {
      c.addEventListener('click', function () {
        var k = c.getAttribute('data-tg');
        state.show[k] = !state.show[k];
        c.classList.toggle('active', state.show[k]);
        poly.done = false;                                   /* leave the held polygon view */
        if (k === 'polygon' && !state.show.polygon) cancelPoly();
        playClick(); draw();
      });
    });
    /* collapsible display panel (top-right) */
    var disp = $('canvas-display'), dispToggle = $('display-toggle');
    if (disp && dispToggle) {
      if (window.innerWidth < 700) { disp.setAttribute('data-collapsed', 'true'); dispToggle.setAttribute('aria-expanded', 'false'); }
      dispToggle.addEventListener('click', function () {
        var collapsed = disp.getAttribute('data-collapsed') === 'true';
        disp.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
        dispToggle.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
        playClick();
      });
    }
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        exploreCat = p.getAttribute('data-cat'); exploreIdx = 0;
        document.querySelectorAll('#cat-tabs .pill').forEach(function (q) { q.classList.remove('active'); });
        p.classList.add('active'); renderExplore(); playClick();
      });
    });
    $('preset-sel').addEventListener('change', function () { closeForcePop(); loadPreset($('preset-sel').value); playClick(); });
    $('btn-add-force').addEventListener('click', function () { if (state.forces.length < 8) { addForce(); playClick(); refresh(); } });
    /* inline force editor (opened by clicking a force on the canvas) */
    $('fp-mag').addEventListener('input', applyForcePop);
    $('fp-ang').addEventListener('input', applyForcePop);
    $('fp-mag').addEventListener('keydown', function (e) { if (e.key === 'Enter') closeForcePop(); });
    $('fp-ang').addEventListener('keydown', function (e) { if (e.key === 'Enter') closeForcePop(); });
    $('fp-close').addEventListener('click', closeForcePop);
    $('btn-calc').addEventListener('click', function () { openCalc(); playClick(); });
    $('btn-poly-anim').addEventListener('click', playPoly);
    $('calc-modal-close').addEventListener('click', closeCalc);
    $('calc-modal').addEventListener('click', function (e) { if (e.target === $('calc-modal')) closeCalc(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeCalc(); closeForcePop(); } });
    $('btn-sound').addEventListener('click', function () {
      state.soundOn = !state.soundOn;
      var ico = $('btn-sound').querySelector('.snd-ico');
      if (ico) ico.textContent = state.soundOn ? '🔊' : '🔇';
      $('btn-sound').classList.toggle('active', state.soundOn);
      $('btn-sound').setAttribute('aria-pressed', state.soundOn);
      if (state.soundOn) playClick();
    });
    $('pp-check').addEventListener('click', checkPractice);
    $('pp-next').addEventListener('click', newPractice);
    $('pp-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });

    /* canvas drag */
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);

    /* export + ctx menu */
    $('canvas-export-btn').addEventListener('click', exportPNG);
    var menu = $('ctx-menu');
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      /* if the right-click landed on a force arrow or its label, offer manual entry first */
      ctxForceIdx = -1;
      if (state.mode === 'simulate') {
        var p = canvasPos(e);
        ctxForceIdx = hitForce(p); if (ctxForceIdx < 0) ctxForceIdx = hitLabel(p);
      }
      var onForce = ctxForceIdx >= 0;
      $('ctx-edit').style.display = onForce ? '' : 'none';
      $('ctx-edit-sep').style.display = onForce ? '' : 'none';
      if (onForce) $('ctx-edit').textContent = '✎ Enter values for F' + (ctxForceIdx + 1) + '…';
      var rect = canvas.parentElement.getBoundingClientRect();
      menu.style.left = (e.clientX - rect.left) + 'px'; menu.style.top = (e.clientY - rect.top) + 'px';
      menu.style.display = 'block';
    });
    document.addEventListener('click', function () { menu.style.display = 'none'; });
    menu.querySelectorAll('.ctx-item').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        var act = b.getAttribute('data-action');
        if (act === 'edit-force') { if (ctxForceIdx >= 0) openForcePop(ctxForceIdx); }
        else if (act === 'save-img') exportPNG();
        else if (act === 'copy-data') copyData();
        else if (act === 'reset') { loadPreset('two'); }
        menu.style.display = 'none';
      });
    });

    window.addEventListener('resize', function () {
      closeForcePop();
      if (state.mode === 'simulate') draw();
      else if (state.mode === 'practice') draw({ hideValues: $('pp-input').disabled ? false : true, hideResultant: $('pp-input').disabled ? false : true });
      else if (state.mode === 'quiz') { var q = quiz.qs[quiz.idx]; if (q && q.draw) draw({ hideValues: !quiz.answered, hideResultant: !quiz.answered }); }
    });

    loadPreset('two');
    setMode('simulate');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
