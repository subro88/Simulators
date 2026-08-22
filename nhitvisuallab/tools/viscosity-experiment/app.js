/* Viscosity Experiment Virtual Lab — incline race + falling-ball viscometer */
(function () {
  'use strict';

  /* ── 1. Helpers & DOM refs ─────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  var G = 9.81;

  var canvas = $('sim-canvas');
  var ctx = canvas.getContext('2d');

  /* ── 2. Fluid & ball data (reference values at 20 °C) ──────── */
  /* mu20: dynamic viscosity Pa·s at 20 °C; b: exponential temperature
     coefficient (1/°C) fitted to published 20→40 °C values; rho kg/m³ */
  var FLUIDS = [
    { id: 'water',    name: 'Water',              mu20: 0.001002, b: 0.0214, rho: 998,  col: 'rgba(79,195,247,0.78)',  colHi: 'rgba(190,235,255,0.9)', nonNewt: false },
    { id: 'milk',     name: 'Milk (whole)',       mu20: 0.0021,   b: 0.025,  rho: 1030, col: 'rgba(245,243,235,0.92)', colHi: 'rgba(255,255,255,0.95)', nonNewt: false },
    { id: 'olive',    name: 'Olive oil',          mu20: 0.084,    b: 0.042,  rho: 911,  col: 'rgba(190,180,60,0.88)',  colHi: 'rgba(235,225,120,0.9)', nonNewt: false },
    { id: 'sae30',    name: 'Engine oil (SAE 30)', mu20: 0.29,    b: 0.053,  rho: 888,  col: 'rgba(140,95,35,0.9)',    colHi: 'rgba(205,160,80,0.9)',  nonNewt: false },
    { id: 'glycerin', name: 'Glycerin',           mu20: 1.412,    b: 0.080,  rho: 1261, col: 'rgba(215,225,230,0.55)', colHi: 'rgba(255,255,255,0.8)', nonNewt: false },
    { id: 'syrup',    name: 'Corn syrup',         mu20: 2.5,      b: 0.070,  rho: 1380, col: 'rgba(225,185,90,0.85)',  colHi: 'rgba(250,225,150,0.9)', nonNewt: false },
    { id: 'honey',    name: 'Honey',              mu20: 10.0,     b: 0.080,  rho: 1420, col: 'rgba(210,140,20,0.92)',  colHi: 'rgba(250,200,90,0.92)', nonNewt: false },
    { id: 'ketchup',  name: 'Ketchup',            mu20: 50.0,     b: 0.020,  rho: 1140, col: 'rgba(190,45,35,0.94)',   colHi: 'rgba(235,110,90,0.9)',  nonNewt: true }
  ];
  var BALLS = [
    { id: 'steel', name: 'Steel ball',     rho: 7850, col: '#9aa7b8' },
    { id: 'glass', name: 'Glass ball',     rho: 2500, col: '#bfe3d8' },
    { id: 'alu',   name: 'Aluminium ball', rho: 2700, col: '#c8ccd4' }
  ];
  var LANE_COLS = ['#4fc3f7', '#8bc34a', '#ce93d8', '#ffb74d'];

  function fluidById(id) { for (var i = 0; i < FLUIDS.length; i++) if (FLUIDS[i].id === id) return FLUIDS[i]; return null; }
  function muAt(f, T) { return f.mu20 * Math.exp(-f.b * (T - 20)); }

  /* ── 3. State ──────────────────────────────────────────────── */
  var state = {
    mode: 'simulate',           /* simulate | explore | practice | quiz */
    exp: 'ball',                /* ball (default — classic Stokes drop) | race */
    lanes: ['water', 'olive', 'glycerin', 'honey'],  /* '' = empty */
    angle: 30, lenCm: 50, filmMm: 1.0, temp: 20,
    speed: 'auto',
    ballFluids: ['glycerin', 'honey'],
    ballMat: 'steel', ballDia: 5.0,
    toggles: { timers: true, labels: true, equation: true, grid: false },
    audioCtx: null
  };

  /* Race runtime */
  var race = { running: false, done: false, simT: 0, lastTs: 0, mult: 1, results: null };
  /* Ball runtime */
  var ballRun = { running: false, done: false, simT: 0, lastTs: 0, mult: 1, results: null };

  /* ── 4. Physics ────────────────────────────────────────────── */
  /* Laminar gravity film on an incline: mean velocity v = ρ g h² sinθ / 3μ */
  function raceCalc() {
    var L = state.lenCm / 100, h = state.filmMm / 1000;
    var sinT = Math.sin(state.angle * Math.PI / 180);
    var out = [];
    for (var i = 0; i < 4; i++) {
      var id = state.lanes[i];
      if (!id) { out.push(null); continue; }
      var f = fluidById(id);
      var mu = muAt(f, state.temp);
      var v = f.rho * G * h * h * sinT / (3 * mu);
      var t = L / v;
      var Re = f.rho * v * h / mu;   /* film Reynolds number */
      out.push({ f: f, mu: mu, nu: mu / f.rho, v: v, t: t, Re: Re });
    }
    return out;
  }

  /* Falling ball: Stokes with Schiller–Naumann correction f = 1 + 0.15 Re^0.687 */
  function solveTerminal(mu, rhoF, rhoS, d) {
    var vtS = d * d * (rhoS - rhoF) * G / (18 * mu);   /* pure Stokes */
    var v = vtS;
    for (var i = 0; i < 60; i++) {
      var Re = rhoF * v * d / mu;
      var corr = (Re < 0.01) ? 1 : 1 + 0.15 * Math.pow(Re, 0.687);
      var vNew = vtS / corr;
      if (Math.abs(vNew - v) < 1e-9) { v = vNew; break; }
      v = 0.5 * (v + vNew);
    }
    return v;
  }
  var TUBE = { depth: 0.32, yA: 0.08, yB: 0.26 };  /* metres of fluid; timing marks */

  function ballCalc() {
    var mat = null, i;
    for (i = 0; i < BALLS.length; i++) if (BALLS[i].id === state.ballMat) mat = BALLS[i];
    var d = state.ballDia / 1000;
    var out = [];
    for (i = 0; i < 2; i++) {
      var f = fluidById(state.ballFluids[i]);
      var mu = muAt(f, state.temp);
      if (mat.rho <= f.rho) { out.push({ f: f, mu: mu, floats: true }); continue; }
      var vt = solveTerminal(mu, f.rho, mat.rho, d);
      var Re = f.rho * vt * d / mu;
      var m = mat.rho * Math.PI * d * d * d / 6;
      var corr = (Re < 0.01) ? 1 : 1 + 0.15 * Math.pow(Re, 0.687);
      var tau = m / (3 * Math.PI * mu * d * corr);   /* linearised response time */
      /* y(t) = vt·(t − τ(1 − e^(−t/τ)))  — analytic approach to terminal velocity */
      var yOf = (function (vtL, tauL) {
        return function (t) { return vtL * (t - tauL * (1 - Math.exp(-t / tauL))); };
      })(vt, tau);
      var tFor = function (y) {          /* invert y(t) by bisection */
        var lo = 0, hi = y / vt + 10 * tau;
        while (yOf(hi) < y) hi *= 2;
        for (var k = 0; k < 60; k++) { var mid = 0.5 * (lo + hi); if (yOf(mid) < y) lo = mid; else hi = mid; }
        return 0.5 * (lo + hi);
      };
      var tA = tFor(TUBE.yA), tB = tFor(TUBE.yB), tEnd = tFor(TUBE.depth);
      var muMeas = d * d * (mat.rho - f.rho) * G * (tB - tA) / (18 * (TUBE.yB - TUBE.yA));
      out.push({ f: f, mu: mu, mat: mat, d: d, vt: vt, Re: Re, tau: tau, yOf: yOf, tA: tA, tB: tB, tEnd: tEnd, muMeas: muMeas, floats: false });
    }
    return out;
  }

  /* ── 5. Formatting ─────────────────────────────────────────── */
  function fmt(v, dp) { return (typeof dp === 'number') ? v.toFixed(dp) : String(v); }
  function fmtSig(v) {
    if (!isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a >= 1000) return v.toFixed(0);
    if (a >= 100) return v.toFixed(1);
    if (a >= 1) return v.toFixed(2);
    if (a >= 0.01) return v.toFixed(3);
    return v.toExponential(2);
  }
  function fmtTime(t) {
    if (!isFinite(t)) return '—';
    if (t < 0.001) return (t * 1000).toFixed(2) + ' ms';
    if (t < 60) return t.toFixed(t < 1 ? 3 : 2) + ' s';
    if (t < 3600) return Math.floor(t / 60) + ' min ' + Math.round(t % 60) + ' s';
    return (t / 3600).toFixed(1) + ' h';
  }
  function fmtMu(mu) {   /* display in mPa·s (=cP) */
    var m = mu * 1000;
    if (m >= 1000) return (m / 1000).toFixed(m >= 10000 ? 1 : 2) + ' Pa·s';
    return fmtSig(m) + ' mPa·s';
  }

  /* ── 6. Canvas sizing (Hi-DPI) ─────────────────────────────── */
  var W = 760, H = 540, dpr = 1;
  /* Each experiment gets its own aspect ratio: the race is a wide scene,
     the cylinders are tall — one shared size letterboxed both. */
  function sizeCanvas() {
    if (state.exp === 'ball') { W = 760; H = 540; }
    else { W = 960; H = 500; }
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', function () { sizeCanvas(); requestDraw(); });

  /* ── 7. Drawing ────────────────────────────────────────────── */
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function haloText(txt, x, y, font, fill, align) {
    ctx.save();
    ctx.font = font; ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 5;
    ctx.fillStyle = fill; ctx.fillText(txt, x, y);
    ctx.restore();
  }

  function drawBackground() {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#101623'); bg.addColorStop(0.65, '#0d1117'); bg.addColorStop(1, '#0a0d13');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (state.toggles.grid) {
      ctx.strokeStyle = 'rgba(107,122,153,0.12)'; ctx.lineWidth = 1;
      for (var gx = 0; gx <= W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx + 0.5, 0); ctx.lineTo(gx + 0.5, H); ctx.stroke(); }
      for (var gy = 0; gy <= H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy + 0.5); ctx.lineTo(W, gy + 0.5); ctx.stroke(); }
    }
  }
  function drawBench(yBench) {
    var g = ctx.createLinearGradient(0, yBench, 0, H);
    g.addColorStop(0, '#3a2d20'); g.addColorStop(0.12, '#2c221a'); g.addColorStop(1, '#181008');
    ctx.fillStyle = g; ctx.fillRect(0, yBench, W, H - yBench);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0, yBench, W, 3);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    for (var i = 1; i < 5; i++) { var y = yBench + 8 + i * 14; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1; }
  }

  function drawRace(calc) {
    drawBackground();
    var yBench = H - 84;
    drawBench(yBench);

    var thetaV = state.angle * Math.PI / 180;
    var plateW = 176;                                   /* across lanes */
    var margin = 60;
    var Lpx = Math.min(620, (yBench - 90) / Math.sin(thetaV), (W - 300) / Math.cos(thetaV));
    var px = W - 118, py = yBench;                      /* pivot: low end on bench */

    /* Support stand under the high end */
    var topX = px - Lpx * Math.cos(thetaV), topY = py - Lpx * Math.sin(thetaV);
    ctx.strokeStyle = '#4a5570'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(topX + 6, topY + 8); ctx.lineTo(topX + 6, yBench); ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(topX + 6, yBench - 40); ctx.lineTo(topX + 44, yBench); ctx.stroke();
    ctx.fillStyle = '#39415c'; roundRect(ctx, topX - 22, yBench - 4, 60, 8, 3); ctx.fill();

    /* Protractor arc at pivot */
    ctx.strokeStyle = 'rgba(255,179,0,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, 46, -thetaV, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(221,227,240,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 60, py); ctx.stroke();
    haloText(state.angle + '°', px + 54, py - 22, '700 13px "Segoe UI", sans-serif', '#ffb300', 'left');

    /* Plate in rotated frame: x ∈ [−Lpx, 0] along slope, y ∈ [−plateW, 0] */
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(thetaV);   /* canvas y is down: +θ lifts the −x end above the bench */

    /* glass plate body */
    var pg = ctx.createLinearGradient(0, -plateW, 0, 0);
    pg.addColorStop(0, 'rgba(70,95,130,0.55)'); pg.addColorStop(0.5, 'rgba(45,60,90,0.55)'); pg.addColorStop(1, 'rgba(70,95,130,0.55)');
    ctx.fillStyle = pg; ctx.fillRect(-Lpx, -plateW, Lpx, plateW);
    /* glass sheen */
    var sheen = ctx.createLinearGradient(-Lpx, -plateW, 0, 0);
    sheen.addColorStop(0, 'rgba(255,255,255,0.10)'); sheen.addColorStop(0.35, 'rgba(255,255,255,0.02)');
    sheen.addColorStop(0.6, 'rgba(255,255,255,0.08)'); sheen.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = sheen; ctx.fillRect(-Lpx, -plateW, Lpx, plateW);
    /* plate edge (thickness) */
    ctx.fillStyle = 'rgba(120,160,200,0.5)'; ctx.fillRect(-Lpx, 0, Lpx, 5);
    ctx.strokeStyle = 'rgba(160,190,230,0.5)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-Lpx, -plateW, Lpx, plateW);

    var startX = -Lpx + 26, finishX = -34;
    var runPx = finishX - startX;
    var laneH = plateW / 4;

    /* start gate */
    ctx.strokeStyle = 'rgba(221,227,240,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(startX, -plateW); ctx.lineTo(startX, 0); ctx.stroke();
    /* finish line — checkered */
    for (var cy = 0; cy < plateW; cy += 8) {
      ctx.fillStyle = (Math.floor(cy / 8) % 2 === 0) ? 'rgba(240,240,240,0.85)' : 'rgba(20,22,30,0.85)';
      ctx.fillRect(finishX, -plateW + cy, 5, Math.min(8, plateW - cy));
      ctx.fillStyle = (Math.floor(cy / 8) % 2 === 0) ? 'rgba(20,22,30,0.85)' : 'rgba(240,240,240,0.85)';
      ctx.fillRect(finishX + 5, -plateW + cy, 5, Math.min(8, plateW - cy));
    }

    for (var i = 0; i < 4; i++) {
      var yTop = -plateW + i * laneH;
      /* lane divider */
      if (i > 0) { ctx.strokeStyle = 'rgba(160,190,230,0.28)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-Lpx, yTop); ctx.lineTo(0, yTop); ctx.stroke(); }
      var c = calc[i];
      if (!c) continue;
      var prog = race.done ? 1 : (race.running ? clamp(race.simT / c.t, 0, 1) : 0);
      var frontX = startX + prog * runPx;

      /* fluid streak: tail at start, glossy head at front */
      var yMid = yTop + laneH / 2;
      var thick = laneH * 0.52;
      if (prog > 0.001) {
        var grad = ctx.createLinearGradient(startX, 0, frontX, 0);
        grad.addColorStop(0, c.f.col.replace(/[\d.]+\)$/, '0.35)'));
        grad.addColorStop(0.8, c.f.col);
        grad.addColorStop(1, c.f.col);
        ctx.fillStyle = grad;
        roundRect(ctx, startX, yMid - thick / 2, Math.max(frontX - startX, 6), thick, thick / 2);
        ctx.fill();
        /* rounded bulging front */
        ctx.fillStyle = c.f.col;
        ctx.beginPath(); ctx.ellipse(frontX, yMid, thick * 0.62, thick * 0.58, 0, 0, Math.PI * 2); ctx.fill();
        /* specular highlight */
        ctx.fillStyle = c.f.colHi;
        ctx.globalAlpha = 0.55;
        ctx.beginPath(); ctx.ellipse(frontX - thick * 0.15, yMid - thick * 0.18, thick * 0.3, thick * 0.13, -0.35, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.3;
        roundRect(ctx, startX + 4, yMid - thick / 2 + 2, Math.max(frontX - startX - 10, 2), thick * 0.2, 3); ctx.fill();
        ctx.globalAlpha = 1;
      } else {
        /* waiting blob at the gate */
        ctx.fillStyle = c.f.col;
        ctx.beginPath(); ctx.ellipse(startX + 8, yMid, 10, thick * 0.55, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c.f.colHi; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.ellipse(startX + 5, yMid - 4, 4, 2.4, -0.4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();

    /* Lane labels + stopwatch chips (unrotated, right side) */
    if (state.toggles.timers || state.toggles.labels) {
      var chipX = 14, chipY = 96;
      for (var j = 0; j < 4; j++) {
        var cj = calc[j];
        if (!cj) continue;
        var t = race.done ? cj.t : (race.running ? Math.min(race.simT, cj.t) : 0);
        var finished = (race.done || (race.running && race.simT >= cj.t));
        var cw = 224, ch = 30;
        ctx.fillStyle = 'rgba(13,17,30,0.78)';
        roundRect(ctx, chipX, chipY, cw, ch, 8); ctx.fill();
        ctx.strokeStyle = finished ? 'rgba(61,220,132,0.7)' : 'rgba(139,157,195,0.3)';
        ctx.lineWidth = 1.5; roundRect(ctx, chipX, chipY, cw, ch, 8); ctx.stroke();
        ctx.fillStyle = LANE_COLS[j];
        ctx.beginPath(); ctx.arc(chipX + 15, chipY + ch / 2, 6, 0, Math.PI * 2); ctx.fill();
        if (state.toggles.labels) haloText(cj.f.name, chipX + 28, chipY + ch / 2, '600 11px "Segoe UI", sans-serif', '#dde3f0', 'left');
        if (state.toggles.timers) haloText(fmtTime(t), chipX + cw - 10, chipY + ch / 2, '700 12px "Courier New", monospace', finished ? '#3ddc84' : '#f5c842', 'right');
        chipY += ch + 6;
      }
    }

    /* equation overlay */
    if (state.toggles.equation) {
      haloText('t = 3μL / (ρgh²·sinθ)   —   laminar film model', 14, H - 56, '600 13px "Segoe UI", sans-serif', 'rgba(221,227,240,0.75)', 'left');
    }
    /* idle prompt */
    if (!race.running && !race.done) {
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(Date.now() / 500);
      haloText('▶ Press Start Race', W / 2, H - 26, '700 14px "Segoe UI", sans-serif', '#6b7a99', 'center');
      ctx.globalAlpha = 1;
    }
  }

  /* ── Shaded metal sphere ───────────────────────────────────
     Key light from the upper left, a bounce/rim light from the fluid on the
     lower right, then a specular dot — enough to read as a solid ball. */
  function hexMix(a, b, t) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var ar = pa >> 16, ag = (pa >> 8) & 255, ab = pa & 255;
    var br = pb >> 16, bg = (pb >> 8) & 255, bb = pb & 255;
    return 'rgb(' + Math.round(ar + (br - ar) * t) + ',' +
                    Math.round(ag + (bg - ag) * t) + ',' +
                    Math.round(ab + (bb - ab) * t) + ')';
  }
  function drawSphere(x, y, r, col) {
    ctx.save();
    /* body */
    var g = ctx.createRadialGradient(x - r * 0.36, y - r * 0.40, r * 0.05, x, y, r * 1.02);
    g.addColorStop(0.00, '#ffffff');
    g.addColorStop(0.13, hexMix(col, '#ffffff', 0.62));
    g.addColorStop(0.42, col);
    g.addColorStop(0.80, hexMix(col, '#0d1117', 0.52));
    g.addColorStop(1.00, hexMix(col, '#0d1117', 0.76));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    /* rim light bouncing up off the fluid */
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    var rim = ctx.createRadialGradient(x + r * 0.5, y + r * 0.55, r * 0.04, x + r * 0.35, y + r * 0.4, r * 1.0);
    rim.addColorStop(0, 'rgba(255,255,255,0.38)');
    rim.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rim; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    /* specular highlight */
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.33, y - r * 0.37, r * 0.21, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
    /* contact edge */
    ctx.strokeStyle = 'rgba(0,0,0,0.30)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r - 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function drawBall(calc) {
    drawBackground();
    var yBench = H - 40;
    drawBench(yBench);

    /* tubeTop leaves headroom for the resting sphere below the toggles overlay */
    var tubeW = 132, tubeH = 330, tubeTop = 100;
    var centers = [W / 2 - 155, W / 2 + 155];
    for (var i = 0; i < 2; i++) {
      var c = calc[i];
      var cx = centers[i], x0 = cx - tubeW / 2, y0 = tubeTop;
      var wall = 3.5;                         /* glass wall thickness */
      var mouthRy = 9;                        /* mouth ellipse minor radius */
      var floorY = y0 + tubeH;                /* inside floor of the cylinder */
      var fluidTop = y0 + 30;

      /* ── shadow on the bench ── */
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath(); ctx.ellipse(cx + 12, yBench + 6, tubeW * 0.56, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      /* ── glass body (back wall seen through the fluid) ── */
      var gg = ctx.createLinearGradient(x0, 0, x0 + tubeW, 0);
      gg.addColorStop(0.00, 'rgba(150,180,220,0.22)');
      gg.addColorStop(0.10, 'rgba(255,255,255,0.07)');
      gg.addColorStop(0.50, 'rgba(140,170,210,0.05)');
      gg.addColorStop(0.86, 'rgba(255,255,255,0.11)');
      gg.addColorStop(1.00, 'rgba(150,180,220,0.26)');
      ctx.fillStyle = gg; ctx.fillRect(x0, y0, tubeW, tubeH);

      /* ── fluid column ── */
      ctx.save();
      ctx.beginPath(); ctx.rect(x0 + wall, fluidTop, tubeW - wall * 2, floorY - fluidTop); ctx.clip();
      ctx.fillStyle = c.f.col;
      ctx.fillRect(x0 + wall, fluidTop, tubeW - wall * 2, floorY - fluidTop);
      /* cylinder curvature: dark at both edges, a bright band where light enters */
      var cyl = ctx.createLinearGradient(x0, 0, x0 + tubeW, 0);
      cyl.addColorStop(0.00, 'rgba(0,0,0,0.38)');
      cyl.addColorStop(0.16, 'rgba(0,0,0,0.05)');
      cyl.addColorStop(0.30, 'rgba(255,255,255,0.16)');
      cyl.addColorStop(0.55, 'rgba(0,0,0,0)');
      cyl.addColorStop(0.84, 'rgba(0,0,0,0.16)');
      cyl.addColorStop(1.00, 'rgba(0,0,0,0.42)');
      ctx.fillStyle = cyl; ctx.fillRect(x0, fluidTop, tubeW, floorY - fluidTop);
      /* depth: fluid darkens toward the floor */
      var dep = ctx.createLinearGradient(0, fluidTop, 0, floorY);
      dep.addColorStop(0, 'rgba(0,0,0,0)');
      dep.addColorStop(1, 'rgba(0,0,0,0.28)');
      ctx.fillStyle = dep; ctx.fillRect(x0, fluidTop, tubeW, floorY - fluidTop);
      ctx.restore();

      /* ── inside floor of the cylinder (ellipse = seen slightly from above) ── */
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(cx, floorY, tubeW / 2 - wall, mouthRy * 0.72, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(190,215,245,0.35)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, floorY, tubeW / 2 - wall, mouthRy * 0.72, 0, 0, Math.PI); ctx.stroke();
      ctx.restore();

      var fluidH = floorY - fluidTop;
      var yScale = fluidH / TUBE.depth;

      /* ── graduations etched on the glass ── */
      ctx.strokeStyle = 'rgba(232,240,255,0.42)'; ctx.lineWidth = 1;
      for (var d = 0.02; d < TUBE.depth; d += 0.02) {
        var yy = fluidTop + d * yScale;
        var major = (Math.round(d * 100) % 10 === 0);
        ctx.beginPath(); ctx.moveTo(x0 + wall + 1, yy); ctx.lineTo(x0 + wall + (major ? 20 : 11), yy); ctx.stroke();
        if (major) haloText((d * 100).toFixed(0), x0 + wall + 24, yy, '600 8.5px "Segoe UI", sans-serif', 'rgba(232,240,255,0.5)', 'left');
      }

      /* ── timing lines ── */
      var yA = fluidTop + TUBE.yA * yScale, yB = fluidTop + TUBE.yB * yScale;
      ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(61,220,132,0.85)';
      ctx.beginPath(); ctx.moveTo(x0 + 2, yA); ctx.lineTo(x0 + tubeW - 2, yA); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,85,85,0.85)';
      ctx.beginPath(); ctx.moveTo(x0 + 2, yB); ctx.lineTo(x0 + tubeW - 2, yB); ctx.stroke();
      ctx.setLineDash([]);
      if (i === 0) {
        haloText('Start line →', x0 - 8, yA, '600 11px "Segoe UI", sans-serif', '#3ddc84', 'right');
        haloText('End line →', x0 - 8, yB, '600 11px "Segoe UI", sans-serif', '#ff5555', 'right');
      } else {
        haloText('← Start line', x0 + tubeW + 8, yA, '600 11px "Segoe UI", sans-serif', '#3ddc84', 'left');
        haloText('← End line', x0 + tubeW + 8, yB, '600 11px "Segoe UI", sans-serif', '#ff5555', 'left');
        var bx = x0 + tubeW + 78;
        ctx.strokeStyle = 'rgba(221,227,240,0.45)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(bx, yA); ctx.lineTo(bx + 6, yA); ctx.lineTo(bx + 6, yB); ctx.lineTo(bx, yB); ctx.stroke();
        haloText(((TUBE.yB - TUBE.yA) * 100).toFixed(0) + ' cm', bx + 12, (yA + yB) / 2, '700 12px "Segoe UI", sans-serif', '#dde3f0', 'left');
      }

      /* ── the sphere ── */
      if (!c.floats) {
        /* Radius is mildly exaggerated so a 1 mm sphere still reads on screen */
        var rPx = Math.max(7, (state.ballDia / 2) * 4);
        /* The ball rests ON the floor — clamping the centre (not the surface)
           is what let it hang through the glass bottom. */
        var restY = floorY - rPx - 1;
        var by, moving = false;
        if (ballRun.running || ballRun.done) {
          var t = ballRun.done ? c.tEnd : Math.min(ballRun.simT, c.tEnd);
          by = Math.min(fluidTop + Math.min(c.yOf(t), TUBE.depth) * yScale, restY);
          moving = by < restY - 0.5;
        } else {
          by = y0 - rPx - 8;   /* waiting above the mouth */
          if (state.toggles.labels && i === 1) {
            haloText('Sphere is dropped from the top', cx, by - rPx - 14, '600 11px "Segoe UI", sans-serif', 'rgba(221,227,240,0.75)', 'center');
            ctx.strokeStyle = 'rgba(221,227,240,0.55)'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cx, by - rPx - 7); ctx.lineTo(cx, by - rPx - 1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx - 3.5, by - rPx - 5); ctx.lineTo(cx, by - rPx); ctx.lineTo(cx + 3.5, by - rPx - 5); ctx.stroke();
          }
        }

        /* viscous wake trailing above the sinking ball, clipped to the fluid */
        if (moving && by > fluidTop) {
          ctx.save();
          ctx.beginPath(); ctx.rect(x0 + wall, fluidTop, tubeW - wall * 2, floorY - fluidTop); ctx.clip();
          var wakeH = Math.min(rPx * 5, by - fluidTop);
          var wk = ctx.createLinearGradient(0, by - wakeH, 0, by);
          wk.addColorStop(0, 'rgba(255,255,255,0)');
          wk.addColorStop(1, 'rgba(255,255,255,0.13)');
          ctx.fillStyle = wk;
          ctx.beginPath();
          ctx.moveTo(cx - rPx * 0.22, by - wakeH);
          ctx.lineTo(cx + rPx * 0.22, by - wakeH);
          ctx.lineTo(cx + rPx * 0.72, by);
          ctx.lineTo(cx - rPx * 0.72, by);
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        /* soft shadow the ball casts on the floor once it is near the bottom */
        if (by > floorY - rPx * 5) {
          var prox = clamp((by - (floorY - rPx * 5)) / (rPx * 4), 0, 1);
          ctx.save();
          ctx.globalAlpha = 0.35 * prox;
          ctx.fillStyle = '#000';
          ctx.beginPath(); ctx.ellipse(cx, floorY - 1, rPx * 0.95, rPx * 0.32, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        drawSphere(cx, by, rPx, c.mat.col);
      }

      /* ── glass in front of the fluid: specular strips + rim ── */
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var sp = ctx.createLinearGradient(x0, 0, x0 + tubeW, 0);
      sp.addColorStop(0.00, 'rgba(255,255,255,0)');
      sp.addColorStop(0.13, 'rgba(255,255,255,0.16)');
      sp.addColorStop(0.20, 'rgba(255,255,255,0)');
      sp.addColorStop(0.88, 'rgba(255,255,255,0.09)');
      sp.addColorStop(1.00, 'rgba(255,255,255,0)');
      ctx.fillStyle = sp; ctx.fillRect(x0, y0, tubeW, tubeH);
      ctx.restore();

      /* meniscus — liquid climbs the wall, so the surface reads concave */
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.beginPath(); ctx.ellipse(cx, fluidTop, tubeW / 2 - wall, 6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.ellipse(cx, fluidTop, tubeW / 2 - wall, 6, 0, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.restore();

      /* glass walls + mouth */
      ctx.strokeStyle = 'rgba(200,222,250,0.62)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x0, floorY);
      ctx.moveTo(x0 + tubeW, y0); ctx.lineTo(x0 + tubeW, floorY);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,222,250,0.30)'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0 + wall, y0); ctx.lineTo(x0 + wall, floorY);
      ctx.moveTo(x0 + tubeW - wall, y0); ctx.lineTo(x0 + tubeW - wall, floorY);
      ctx.stroke();
      /* outer rim of the mouth, then the inner bore */
      ctx.strokeStyle = 'rgba(214,232,255,0.75)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, y0, tubeW / 2, mouthRy, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(214,232,255,0.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, y0, tubeW / 2 - wall, mouthRy * 0.78, 0, 0, Math.PI * 2); ctx.stroke();

      /* glass base slab */
      ctx.fillStyle = 'rgba(168,196,232,0.30)';
      roundRect(ctx, x0 - 7, floorY, tubeW + 14, 13, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(210,230,255,0.55)'; ctx.lineWidth = 1.5;
      roundRect(ctx, x0 - 7, floorY, tubeW + 14, 13, 3); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.20)';
      ctx.fillRect(x0 - 4, floorY + 3, tubeW + 8, 2);

      if (c.floats) {
        haloText('Ball floats! ρball ≤ ρfluid', cx, fluidTop + 44, '700 12px "Segoe UI", sans-serif', '#ff5555', 'center');
      }

      /* ── label + stopwatch chip ── */
      if (state.toggles.labels) {
        haloText('Tube ' + (i === 0 ? 'A' : 'B') + ' — ' + c.f.name, cx, floorY + 66, '700 13px "Segoe UI", sans-serif', '#dde3f0', 'center');
      }
      if (state.toggles.timers) {
        var t2 = ballRun.done ? (c.tB - c.tA) : (ballRun.running ? clamp(ballRun.simT - c.tA, 0, c.tB - c.tA) : 0);
        var chW = 150, chH = 28, chX = cx - chW / 2, chY = floorY + 22;
        ctx.fillStyle = 'rgba(13,17,30,0.85)'; roundRect(ctx, chX, chY, chW, chH, 8); ctx.fill();
        ctx.strokeStyle = 'rgba(139,157,195,0.32)'; ctx.lineWidth = 1.5; roundRect(ctx, chX, chY, chW, chH, 8); ctx.stroke();
        haloText('A→B', chX + 10, chY + chH / 2, '600 10px "Segoe UI", sans-serif', '#6b7a99', 'left');
        haloText(fmtTime(t2), chX + chW - 10, chY + chH / 2, '700 12px "Courier New", monospace', '#f5c842', 'right');
      }
    }

    if (state.toggles.equation) {
      haloText('μ = d²(ρs − ρf)g·t / (18·L)   —   Stokes’ law, valid Re < 1', 14, H - 18, '600 13px "Segoe UI", sans-serif', 'rgba(221,227,240,0.75)', 'left');
    }
    /* Idle prompt sits bottom-right, clear of the equation and the toggles */
    if (!ballRun.running && !ballRun.done) {
      ctx.globalAlpha = 0.55 + 0.3 * Math.sin(Date.now() / 500);
      haloText('▶ Press Drop Ball', W - 14, H - 18, '700 14px "Segoe UI", sans-serif', '#8b9dc3', 'right');
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (state.exp === 'race') drawRace(raceCalc());
    else drawBall(ballCalc());
  }

  /* rAF loop — runs while animating or when idle prompt pulses */
  var rafId = null;
  function requestDraw() { if (rafId === null) rafId = requestAnimationFrame(frame); }
  function frame(ts) {
    rafId = null;
    if (state.mode === 'simulate') {
      stepSim(ts);
      draw();
      requestDraw();   /* keep pulsing prompt + timers alive */
    }
  }

  function stepSim(ts) {
    if (state.exp === 'race' && race.running && !race.done) {
      if (!race.lastTs) race.lastTs = ts;
      var dt = Math.min((ts - race.lastTs) / 1000, 0.1);
      race.lastTs = ts;
      /* Auto mode: ramp the time-lapse up so slow fluids (honey: >30 min real
         time) still finish on screen within seconds, stopwatches stay honest */
      if (state.speed === 'auto') {
        var actA = activeLanes(raceCalc()), tMax = 0, aa;
        for (aa = 0; aa < actA.length; aa++) tMax = Math.max(tMax, actA[aa].t);
        race.mult = Math.min(race.mult * 1.05, Math.max(tMax / 5, race.mult));
      }
      race.simT += dt * race.mult;
      var calc = raceCalc(), allDone = true, i;
      for (i = 0; i < 4; i++) {
        if (!calc[i]) continue;
        if (race.simT < calc[i].t) allDone = false;
        else if (!race.results.finished[i]) { race.results.finished[i] = true; playTick(); }
      }
      if (allDone) { race.running = false; race.done = true; playSuccess(); updateAll(); }
      updateBadges();
    }
    if (state.exp === 'ball' && ballRun.running && !ballRun.done) {
      if (!ballRun.lastTs) ballRun.lastTs = ts;
      var dt2 = Math.min((ts - ballRun.lastTs) / 1000, 0.1);
      ballRun.lastTs = ts;
      if (state.speed === 'auto') {
        var bcA = ballCalc(), tMaxB = 0, bb;
        for (bb = 0; bb < 2; bb++) if (!bcA[bb].floats) tMaxB = Math.max(tMaxB, bcA[bb].tEnd);
        ballRun.mult = Math.min(ballRun.mult * 1.05, Math.max(tMaxB / 6, ballRun.mult));
      }
      ballRun.simT += dt2 * ballRun.mult;
      var bc = ballCalc(), done = true, j;
      for (j = 0; j < 2; j++) {
        if (bc[j].floats) continue;
        if (ballRun.simT < bc[j].tEnd) done = false;
      }
      if (done) { ballRun.running = false; ballRun.done = true; playSuccess(); updateAll(); }
      updateBadges();
    }
  }

  /* ── 8. Run control ────────────────────────────────────────── */
  function activeLanes(calc) { var out = []; for (var i = 0; i < 4; i++) if (calc[i]) out.push(calc[i]); return out; }

  function autoMult() {
    if (state.exp === 'race') {
      var act = activeLanes(raceCalc());
      if (!act.length) return 1;
      var tMin = Infinity;
      for (var i = 0; i < act.length; i++) tMin = Math.min(tMin, act[i].t);
      return Math.max(tMin / 4, 0.25);       /* fastest lane finishes in ~4 s */
    }
    var bc = ballCalc(), tMax = 0;
    for (var j = 0; j < 2; j++) if (!bc[j].floats) tMax = Math.max(tMax, bc[j].tEnd);
    if (!tMax) return 1;
    return Math.max(tMax / 6, 0.25);         /* slowest ball lands in ~6 s */
  }
  function currentMult() { return state.speed === 'auto' ? autoMult() : parseFloat(state.speed); }

  function startRun() {
    playClick();
    if (state.exp === 'race') {
      race.running = true; race.done = false; race.simT = 0; race.lastTs = 0;
      race.mult = currentMult();
      race.results = { finished: [false, false, false, false] };
    } else {
      ballRun.running = true; ballRun.done = false; ballRun.simT = 0; ballRun.lastTs = 0;
      ballRun.mult = currentMult();
    }
    updateAll();
  }
  function skipRun() {
    playClick();
    if (state.exp === 'race') {
      if (!race.results) race.results = { finished: [true, true, true, true] };
      race.running = false; race.done = true;
    } else { ballRun.running = false; ballRun.done = true; }
    updateAll();
  }
  function resetRun() {
    race.running = false; race.done = false; race.simT = 0; race.results = null;
    ballRun.running = false; ballRun.done = false; ballRun.simT = 0;
    updateAll();
  }

  /* ── 9. Sound ──────────────────────────────────────────────── */
  function audio() {
    if (!state.audioCtx) {
      try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    return state.audioCtx;
  }
  function playTone(freq, dur, type, vol) {
    var ac = audio(); if (!ac) return;
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  }
  function playClick() { playTone(800, 0.05, 'square', 0.04); }
  function playTick() { playTone(1200, 0.06, 'sine', 0.06); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.1); setTimeout(function () { playTone(1100, 0.15, 'sine', 0.1); }, 120); }
  function playError() { playTone(300, 0.2, 'sawtooth', 0.06); }

  /* ── 10. Readouts / badges / results table ─────────────────── */
  /* Status/terminal-velocity chips were removed — both values live in the
     results table. Only two things still need surfacing: the playback
     multiplier (so nobody reads a time-lapsed fall as real time) and a
     validity warning, which takes no layout space unless it fires. */
  function updateBadges() {
    var warn = '', i;
    if (state.exp === 'race') {
      var act = activeLanes(raceCalc());
      if (act.length) {
        var best = act[0];
        for (i = 1; i < act.length; i++) if (act[i].t < best.t) best = act[i];
        if (best.Re > 25) warn = 'Film Reynolds number is ' + fmtSig(best.Re) + ' — thin fluids ripple, so the laminar model is approximate here.';
        for (i = 0; i < act.length; i++) if (act[i].f.nonNewt) warn = act[i].f.name + ' is non-Newtonian — the lane uses an apparent viscosity, so its time is indicative only.';
      }
    } else {
      var bc = ballCalc();
      for (i = 0; i < 2; i++) {
        if (bc[i].floats) { warn = 'The ball floats in ' + bc[i].f.name + ' (\u03c1 ball \u2264 \u03c1 fluid) — pick a denser ball.'; continue; }
        if (bc[i].Re > 1) warn = 'Re = ' + fmtSig(bc[i].Re) + ' in ' + bc[i].f.name + ' — above 1, so Stokes\u2019 law no longer holds and the recovered \u03bc is too high.';
      }
    }
    var ws = $('warn-strip');
    if (ws) { ws.hidden = !warn; $('warn-text').textContent = warn; }

    var run = (state.exp === 'race') ? race : ballRun;
    var mult = run.running ? run.mult : currentMult();
    var el = $('ab-lapse');
    if (el) el.textContent = (mult >= 1.5 || mult <= 0.67) ? '\u00d7' + fmtSig(mult) + ' real time' : '';
  }

  function updateResults() {
    var head = $('results-head'), body = $('results-body'), html = '', i;
    if (state.exp === 'race') {
      head.innerHTML = '<tr><th>Lane · Fluid</th><th class="th-sym">μ(T)</th><th class="th-sym">ρ kg/m³</th><th class="th-sym">ν mm²/s</th><th>Speed</th><th>Time</th><th>#</th></tr>';
      var calc = raceCalc();
      var act = activeLanes(calc).slice().sort(function (a, b) { return a.t - b.t; });
      for (i = 0; i < 4; i++) {
        var c = calc[i];
        if (!c) continue;
        var rank = act.indexOf(c) + 1;
        var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank;
        html += '<tr' + (rank === 1 ? ' class="rt-win"' : '') + '><td><span style="color:' + LANE_COLS[i] + '">●</span> ' + c.f.name +
          (c.f.nonNewt ? ' <span class="rt-warn">non-Newtonian (apparent μ)</span>' : '') + '</td>' +
          '<td>' + fmtMu(c.mu) + '</td><td>' + c.f.rho + '</td><td>' + fmtSig(c.nu * 1e6) + '</td>' +
          '<td>' + fmtSig(c.v * 1000) + ' mm/s</td><td>' + fmtTime(c.t) + '</td>' +
          '<td class="rt-rank">' + medal + '</td></tr>';
      }
    } else {
      head.innerHTML = '<tr><th>Tube · Fluid</th><th class="th-sym">μ true</th><th class="th-sym">v term</th><th class="th-sym">Re</th><th class="th-sym">t A→B</th><th class="th-sym">μ Stokes</th><th>Valid</th></tr>';
      var bc = ballCalc();
      for (i = 0; i < 2; i++) {
        var b = bc[i], tube = i === 0 ? 'A' : 'B';
        if (b.floats) {
          html += '<tr><td>' + tube + ' · ' + b.f.name + '</td><td>' + fmtMu(b.mu) + '</td><td colspan="4">ball floats — ρ ball ≤ ρ fluid</td><td class="rt-warn">no fall</td></tr>';
          continue;
        }
        var ok = b.Re < 1;
        html += '<tr><td>' + tube + ' · ' + b.f.name + '</td><td>' + fmtMu(b.mu) + '</td>' +
          '<td>' + fmtSig(b.vt * 1000) + ' mm/s</td><td>' + fmtSig(b.Re) + '</td>' +
          '<td>' + fmtTime(b.tB - b.tA) + '</td><td>' + fmtMu(b.muMeas) + '</td>' +
          '<td>' + (ok ? '<span style="color:var(--green)">Re &lt; 1 ✓</span>' : '<span class="rt-warn">Re &gt; 1 — Stokes invalid</span>') + '</td></tr>';
      }
    }
    body.innerHTML = html;
  }

  /* ── 11. Learning panels (KaTeX) ───────────────────────────── */
  var _learnCache = { eq: '', cmp: '', co: '' };
  function updateLearn() {
    var eq = $('lp-eq-body'), cmp = $('lp-cmp-body'), co = $('lp-coach-body');
    if (!eq) return;
    var html = '', i;
    if (state.exp === 'race') {
      var calc = raceCalc(), c = null;
      for (i = 0; i < 4; i++) if (calc[i]) { c = calc[i]; break; }
      if (c) {
        var L = state.lenCm / 100, h = state.filmMm / 1000;
        html =
          '<p><strong>Newton\u2019s law of viscosity</strong> — the definition every result below builds on:</p>' +
          '<p>\\[ \\tau = \\mu \\frac{du}{dy} \\]</p>' +
          '<p><strong>Lane 1 — ' + c.f.name + '</strong> at ' + state.temp + ' °C: \\( \\mu = ' + fmtSig(c.mu * 1000) + '\\ \\mathrm{mPa\\cdot s} \\), \\( \\rho = ' + c.f.rho + '\\ \\mathrm{kg/m^3} \\).</p>' +
          '<p>Mean film speed: \\[ \\bar v = \\frac{\\rho g h^2 \\sin\\theta}{3\\mu} = \\frac{' + c.f.rho + ' \\times 9.81 \\times (' + fmtSig(h * 1000) + '\\,\\mathrm{mm})^2 \\sin ' + state.angle + '^\\circ}{3 \\times ' + fmtSig(c.mu) + '} = ' + fmtSig(c.v * 1000) + '\\ \\mathrm{mm/s} \\]</p>' +
          '<p>Time to finish: \\[ t = \\frac{L}{\\bar v} = \\frac{' + fmtSig(L) + '\\ \\mathrm{m}}{' + fmtSig(c.v) + '\\ \\mathrm{m/s}} = ' + fmtSig(c.t) + '\\ \\mathrm{s} \\]</p>';
      }
    } else {
      var bc = ballCalc(), b = bc[0].floats ? bc[1] : bc[0];
      if (b && !b.floats) {
        html =
          '<p><strong>Stokes\u2019 law</strong> for tube ' + (bc[0].floats ? 'B' : 'A') + ' — ' + b.f.name + ', ' + b.mat.name.toLowerCase() + ' d = ' + state.ballDia + ' mm:</p>' +
          '<p>\\[ v_t = \\frac{d^2(\\rho_s - \\rho_f)g}{18\\mu} = \\frac{(' + fmtSig(b.d * 1000) + '\\,\\mathrm{mm})^2 (' + b.mat.rho + ' - ' + b.f.rho + ') \\times 9.81}{18 \\times ' + fmtSig(b.mu) + '} = ' + fmtSig(b.vt * 1000) + '\\ \\mathrm{mm/s} \\]</p>' +
          '<p>Reynolds check: \\[ Re = \\frac{\\rho_f v_t d}{\\mu} = ' + fmtSig(b.Re) + (b.Re < 1 ? ' < 1 \\;\\checkmark \\]</p><p>Stokes\u2019 law is valid.' : ' > 1 \\]</p><p><strong>Stokes\u2019 law is NOT valid</strong> — the simulator integrates the corrected drag instead.') + '</p>' +
          '<p>Viscometer equation: \\[ \\mu = \\frac{d^2(\\rho_s - \\rho_f)\\,g\\,t_{AB}}{18\\,L_{AB}} = ' + fmtSig(b.muMeas * 1000) + '\\ \\mathrm{mPa\\cdot s} \\]</p>';
      }
    }
    if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }

    /* comparison table */
    var ch = '<table class="cmp-table"><tr><th>Fluid</th><th>μ at ' + state.temp + ' °C</th><th>μ at 20 °C</th><th>ρ (kg/m³)</th><th>ν (mm²/s)</th></tr>';
    for (i = 0; i < FLUIDS.length; i++) {
      var f = FLUIDS[i], m = muAt(f, state.temp);
      ch += '<tr><td>' + f.name + (f.nonNewt ? '*' : '') + '</td><td>' + fmtMu(m) + '</td><td>' + fmtMu(f.mu20) + '</td><td>' + f.rho + '</td><td>' + fmtSig(m / f.rho * 1e6) + '</td></tr>';
    }
    ch += '</table><p style="font-size:0.72rem;margin-top:6px;">*Non-Newtonian — value is an apparent viscosity at low shear. Temperature model: μ(T) = μ₂₀·e^(−b(T−20)), fitted to published data.</p>';
    if (ch !== _learnCache.cmp) { cmp.innerHTML = ch; _learnCache.cmp = ch; }

    /* coach */
    var tips = [];
    if (state.exp === 'race') {
      var rc = raceCalc(), act = activeLanes(rc);
      if (act.length >= 2) {
        var srt = act.slice().sort(function (a, b) { return a.t - b.t; });
        var ratio = srt[srt.length - 1].t / srt[0].t;
        tips.push('<strong>' + srt[0].f.name + '</strong> beats <strong>' + srt[srt.length - 1].f.name + '</strong> by a factor of ' + fmtSig(ratio) + ' — that ratio equals their kinematic-viscosity ratio ν₂/ν₁.');
      }
      tips.push('Doubling film thickness h makes every fluid 4× faster (t ∝ 1/h²) but does not change the finishing order.');
      tips.push('Warming from 20 °C to 40 °C leaves the plate geometry untouched yet speeds honey up ~5× — temperature is the strongest lever on liquid viscosity.');
      if (state.angle < 20) tips.push('At shallow angles the race takes longer but rankings stay identical: sinθ scales all lanes equally.');
    } else {
      var bl = ballCalc();
      for (i = 0; i < 2; i++) {
        if (bl[i].floats) tips.push('The ball floats in ' + bl[i].f.name + ' — pick a denser ball material.');
        else if (bl[i].Re > 1) tips.push('In ' + bl[i].f.name + ' the Reynolds number is ' + fmtSig(bl[i].Re) + ': the Stokes-formula viscosity (' + fmtMu(bl[i].muMeas) + ') overestimates the true ' + fmtMu(bl[i].mu) + '. Falling-ball viscometers need viscous fluids.');
      }
      tips.push('Terminal velocity scales with d²: doubling the ball diameter quadruples its speed.');
    }
    var coHtml = '<ul class="coach-list">';
    for (i = 0; i < tips.length; i++) coHtml += '<li>' + tips[i] + '</li>';
    coHtml += '</ul>';
    if (coHtml !== _learnCache.co) { co.innerHTML = coHtml; _learnCache.co = coHtml; }
  }

  /* ── 12. Calc modal ────────────────────────────────────────── */
  function buildCalcModal() {
    var html = '', i;
    if (state.exp === 'race') {
      var L = state.lenCm / 100, h = state.filmMm / 1000, sinT = Math.sin(state.angle * Math.PI / 180);
      html += '<div class="cs-inputs"><span class="cs-badge">Given — Incline Race</span><div class="cs-given">' +
        '<span>θ = ' + state.angle + '°</span><span>L = ' + state.lenCm + ' cm</span><span>h = ' + state.filmMm + ' mm</span><span>T = ' + state.temp + ' °C</span><span>g = 9.81 m/s²</span>' +
        '</div><p class="cs-si-note">Model: steady laminar film flowing down an inclined plate — \\( \\bar v = \\rho g h^2 \\sin\\theta / 3\\mu \\).</p></div>';
      var calc = raceCalc(), n = 0;
      for (i = 0; i < 4; i++) {
        var c = calc[i]; if (!c) continue; n++;
        html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Lane ' + (i + 1) + '</span><span class="cs-title">' + c.f.name + '</span></div>' +
          '<div class="cs-formula">\\( \\mu(' + state.temp + '^\\circ C) = ' + fmtSig(c.f.mu20 * 1000) + ' \\times e^{-' + c.f.b + '(' + state.temp + '-20)} = ' + fmtSig(c.mu * 1000) + '\\ \\mathrm{mPa\\cdot s} \\)</div>' +
          '<div class="cs-formula">\\( \\bar v = \\dfrac{' + c.f.rho + ' \\times 9.81 \\times (' + fmtSig(h) + ')^2 \\times ' + fmtSig(sinT) + '}{3 \\times ' + fmtSig(c.mu) + '} = ' + fmtSig(c.v) + '\\ \\mathrm{m/s} \\)</div>' +
          '<div class="cs-result">Time to finish: <strong>t = L / v̄ = ' + fmtSig(L) + ' / ' + fmtSig(c.v) + ' = ' + fmtTime(c.t) + '</strong>' + (c.f.nonNewt ? ' — apparent μ (non-Newtonian)' : '') + '</div></div>';
      }
      if (!n) html += '<div class="cs-step"><div class="cs-result">No lanes selected.</div></div>';
    } else {
      var bc = ballCalc();
      html += '<div class="cs-inputs"><span class="cs-badge">Given — Falling Ball</span><div class="cs-given">' +
        '<span>d = ' + state.ballDia + ' mm</span><span>ρs = ' + (function () { for (var k = 0; k < BALLS.length; k++) if (BALLS[k].id === state.ballMat) return BALLS[k].rho; })() + ' kg/m³</span><span>L(A→B) = ' + ((TUBE.yB - TUBE.yA) * 100).toFixed(0) + ' cm</span><span>T = ' + state.temp + ' °C</span>' +
        '</div><p class="cs-si-note">Stokes\u2019 drag \\( F_d = 3\\pi\\mu d v \\); valid for \\( Re < 1 \\). Above that the simulator applies the Schiller–Naumann correction.</p></div>';
      for (i = 0; i < 2; i++) {
        var b = bc[i];
        html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Tube ' + (i === 0 ? 'A' : 'B') + '</span><span class="cs-title">' + b.f.name + '</span></div>';
        if (b.floats) { html += '<div class="cs-result">ρ ball ≤ ρ fluid — the ball floats, no measurement possible.</div></div>'; continue; }
        html += '<div class="cs-formula">\\( v_t = \\dfrac{d^2(\\rho_s-\\rho_f)g}{18\\mu} \\Rightarrow ' + fmtSig(b.vt * 1000) + '\\ \\mathrm{mm/s} \\quad Re = ' + fmtSig(b.Re) + ' \\)</div>' +
          '<div class="cs-formula">\\( t_{AB} = ' + fmtSig(b.tB - b.tA) + '\\ \\mathrm{s} \\qquad \\mu_{meas} = \\dfrac{d^2(\\rho_s-\\rho_f)\\,g\\,t_{AB}}{18 L_{AB}} = ' + fmtSig(b.muMeas * 1000) + '\\ \\mathrm{mPa\\cdot s} \\)</div>' +
          '<div class="cs-result">True μ = <strong>' + fmtMu(b.mu) + '</strong> — ' + (b.Re < 1 ? 'measurement agrees (Re < 1 ✓)' : 'Stokes formula overestimates because Re > 1') + '</div></div>';
      }
    }
    $('calc-modal-body').innerHTML = html;
  }

  /* ── 13. Explore mode content ──────────────────────────────── */
  var EXPLORE = {
    basics: [
      { name: 'What Is Viscosity?', sym: 'μ', desc: 'Viscosity is a fluid\u2019s internal resistance to flow — the friction between adjacent layers of fluid sliding past each other. Honey pours slowly because its long sugar-molecule networks resist shearing; water\u2019s small molecules slip past each other easily. Viscosity is a real, measurable material property, tabulated for every industrial fluid.', formula: 'μ [Pa·s]', ex: { p: 'Water at 20 °C has μ = 1.002 mPa·s; honey ≈ 10 Pa·s. How many times more viscous is honey?', steps: ['Ratio = 10 / 0.001002', '≈ 10,000 × more viscous', 'That is why honey takes ~10,000× longer to flow down the same plate.'] } },
      { name: 'Dynamic vs Kinematic', sym: 'ν = μ/ρ', desc: 'Dynamic viscosity μ (Pa·s) is the stress-per-shear-rate in Newton\u2019s law. Kinematic viscosity ν = μ/ρ (m²/s) is momentum diffusivity — it governs gravity-driven flows, which is why the incline race ranks fluids by ν, not μ.', formula: 'ν = μ / ρ', ex: { p: 'Glycerin: μ = 1.412 Pa·s, ρ = 1261 kg/m³. Find ν in mm²/s.', steps: ['ν = 1.412 / 1261 = 1.12×10⁻³ m²/s', '1 m²/s = 10⁶ mm²/s', 'ν ≈ 1120 mm²/s (= 1120 cSt)'] } },
      { name: 'Units: Pa·s, Poise, cP', sym: '1 cP = 1 mPa·s', desc: 'The SI unit is the pascal-second. The CGS unit is the poise (P), named after Poiseuille; 1 Pa·s = 10 P = 1000 cP. Water at 20 °C is almost exactly 1 cP — a handy mental anchor. Kinematic viscosity uses the stokes (St): 1 cSt = 1 mm²/s.', formula: '1 Pa·s = 10 P = 1000 cP', ex: { p: 'Convert SAE 30 oil\u2019s 0.29 Pa·s to centipoise.', steps: ['0.29 Pa·s × 1000 = 290 cP', 'Or 2.9 poise.'] } },
      { name: 'Temperature Effect', sym: 'μ(T)', desc: 'Liquid viscosity falls roughly exponentially with temperature because thermal energy helps molecules escape their neighbours\u2019 cohesive grip. Gas viscosity rises with temperature instead — gas drag comes from molecular momentum exchange, which speeds up when hot.', formula: 'μ = μ₂₀·e^(−b(T−20))', ex: { p: 'Honey has μ ≈ 10 Pa·s at 20 °C and b ≈ 0.08 /°C. Estimate μ at 40 °C.', steps: ['μ = 10 × e^(−0.08×20)', '= 10 × e^(−1.6) = 10 × 0.202', '≈ 2 Pa·s — five times thinner.'] } }
    ],
    formulas: [
      { name: 'Newton\u2019s Law of Viscosity', sym: 'τ = μ·du/dy', desc: 'The defining equation: shear stress τ between fluid layers is proportional to the velocity gradient du/dy (shear rate). The proportionality constant is the dynamic viscosity. Fluids obeying this linear law — water, oils, glycerin, honey — are Newtonian.', formula: 'τ = μ (du/dy)', ex: { p: 'Oil (μ = 0.29 Pa·s) fills a 2 mm gap; the top plate moves at 1.5 m/s. Find τ.', steps: ['du/dy = 1.5 / 0.002 = 750 s⁻¹', 'τ = 0.29 × 750', 'τ = 217.5 Pa'] } },
      { name: 'Drag Force on a Plate', sym: 'F = μAv/y', desc: 'For a plate of area A sliding at speed v over a fluid film of thickness y, the viscous drag force is F = τA = μAv/y. This is how lubricated bearings, hydroplaning tyres and microscope slide films are analysed.', formula: 'F = μ A v / y', ex: { p: 'A 0.5 m² plate slides at 2 m/s on a 1 mm oil film (μ = 0.1 Pa·s). Find F.', steps: ['F = 0.1 × 0.5 × 2 / 0.001', 'F = 100 N'] } },
      { name: 'Film Flow Down an Incline', sym: 't = 3μL/ρgh²sinθ', desc: 'A thin laminar film of thickness h on a plate inclined at θ flows with mean velocity v̄ = ρgh²sinθ/3μ — the balance of gravity along the slope against viscous shear at the wall. This is the model behind the race experiment.', formula: 'v̄ = ρgh²sinθ / 3μ', ex: { p: 'Water film, h = 1 mm, θ = 30°, L = 0.5 m. Find the travel time.', steps: ['v̄ = 998×9.81×(0.001)²×0.5 / (3×0.001002)', 'v̄ = 1.63 m/s', 't = 0.5 / 1.63 ≈ 0.31 s'] } },
      { name: 'Stokes\u2019 Law', sym: 'F = 3πμdv', desc: 'For a sphere moving slowly (Re < 1) through a fluid, drag is F = 3πμdv. Setting drag + buoyancy equal to weight gives the terminal velocity — the basis of the falling-ball viscometer and of why fog droplets stay suspended.', formula: 'vt = d²(ρs−ρf)g / 18μ', ex: { p: 'Steel ball (ρ = 7850), d = 2 mm, in glycerin (μ = 1.412, ρ = 1261). Find vt.', steps: ['vt = (0.002)²(7850−1261)×9.81 / (18×1.412)', 'vt = 4×10⁻⁶ × 6589 × 9.81 / 25.4', 'vt ≈ 0.0102 m/s ≈ 10.2 mm/s'] } }
    ],
    measure: [
      { name: 'Falling-Ball Viscometer', sym: 'Höppler', desc: 'A sphere falls through the liquid in a graduated tube; timing it between two marks gives μ = d²(ρs−ρf)g·t/(18L). Standardised as ISO 12058-1. Only valid for Re < 1, so it suits oils, glycerin and syrups — never water.', formula: 'μ = d²(ρs−ρf)g·t / 18L', ex: { p: 'd = 2 mm steel ball falls 18 cm through syrup in 12.4 s (ρf = 1380). Find μ.', steps: ['μ = (0.002)²(7850−1380)×9.81×12.4 / (18×0.18)', 'μ = 4×10⁻⁶ × 6470 × 9.81 × 12.4 / 3.24', 'μ ≈ 0.97 Pa·s'] } },
      { name: 'Capillary Viscometer', sym: 'Ostwald', desc: 'Times how long a fixed volume takes to drain through a fine capillary under gravity — Poiseuille\u2019s law makes the time proportional to kinematic viscosity. The U-tube Ostwald and Ubbelohde types are the standard for transparent, low-viscosity liquids.', formula: 'ν = K·t (instrument constant K)', ex: { p: 'A capillary viscometer with K = 0.01 mm²/s² drains in 98 s with water. What ν does it report?', steps: ['ν = 0.01 × 98', 'ν = 0.98 mm²/s ≈ water\u2019s 1.0 mm²/s ✓'] } },
      { name: 'Rotational Viscometer', sym: 'Brookfield', desc: 'A spindle rotates in the fluid and the torque needed measures viscosity directly from Newton\u2019s law applied to the annular gap. Because shear rate is controlled, it is the tool of choice for non-Newtonian fluids — plot μ against shear rate to get the full flow curve.', formula: 'μ = τ / (du/dy)', ex: { p: 'A spindle applies τ = 25 Pa at a shear rate of 50 s⁻¹ in paint. Apparent viscosity?', steps: ['μ = 25 / 50', 'μ = 0.5 Pa·s = 500 cP'] } },
      { name: 'Flow Cups (Ford / Zahn)', sym: 'efflux time', desc: 'Industrial shops time how long a cup with a hole in the bottom takes to empty — the "efflux time" in seconds is quoted directly (e.g. "18 s Ford cup #4" for spray paint). Crude but fast, and perfect for viscosity checks on a production line.', formula: 'ν ≈ A·t − B/t', ex: { p: 'Why does a paint shop warm paint that measures 25 s in a Ford cup when the spec is 18 s?', steps: ['Warming lowers viscosity exponentially', 'Efflux time falls with ν', 'A few °C brings 25 s down to spec without thinner.'] } }
    ],
    advanced: [
      { name: 'Shear-Thinning Fluids', sym: 'ketchup', desc: 'Ketchup, blood, paint and shampoo get thinner the faster you shear them — their microstructure (particles, droplets, polymer chains) aligns with the flow. That is why ketchup refuses to pour until you shake the bottle: the shake raises the shear rate and collapses its apparent viscosity.', formula: 'μapp decreases as du/dy rises', ex: { p: 'Ketchup at rest: μapp ≈ 50 Pa·s. Shaken (high shear): μapp ≈ 1 Pa·s. Ratio?', steps: ['50 / 1 = 50×', 'A shake makes it flow ~50× more easily.'] } },
      { name: 'Shear-Thickening Fluids', sym: 'oobleck', desc: 'Cornstarch-in-water (oobleck) does the opposite — it becomes rigid under fast shear as particles jam together. Walk quickly across a pool of it and you stay on top; stand still and you sink. Used in liquid body armour research.', formula: 'μapp increases as du/dy rises', ex: { p: 'Why can you run on oobleck but not stand on it?', steps: ['Running = high shear rate → particles jam → solid-like', 'Standing = low shear rate → particles flow apart → liquid-like'] } },
      { name: 'Engine Oil Grades (SAE)', sym: '10W-30', desc: 'SAE numbers rank oil viscosity: SAE 30 is a summer-weight single grade. A multigrade 10W-30 behaves like thin SAE 10 when cold (W = winter, easy starting) but like SAE 30 at engine temperature — polymer additives fight the natural exponential thinning.', formula: 'higher SAE number = higher ν at 100 °C', ex: { p: 'Why not just use very thick oil for maximum protection?', steps: ['Thick oil at cold start barely flows', 'Bearings starve of lubricant for seconds', 'Most engine wear happens at start-up — hence the W rating.'] } },
      { name: 'Viscosity in Nature & Industry', sym: 'applications', desc: 'Viscosity sets how fast lava flows, how aerodynamic boundary layers grow, how quickly sediment settles in rivers (Stokes\u2019 law), how chocolate coats a bar, and how ink jets form droplets. Every pipeline pump on Earth is sized against the fluid\u2019s viscosity via the Reynolds number.', formula: 'Re = ρvD/μ', ex: { p: 'Crude oil (μ = 0.1 Pa·s, ρ = 870) flows at 1.5 m/s in a 0.3 m pipe. Laminar or turbulent?', steps: ['Re = 870×1.5×0.3 / 0.1', 'Re = 3915', 'Just above 2300 → transitional/turbulent.'] } }
    ]
  };
  var exploreCat = 'basics', exploreIdx = 0;
  function renderExplore() {
    var grid = $('concept-grid'), items = EXPLORE[exploreCat], html = '', i;
    for (i = 0; i < items.length; i++) {
      html += '<button class="is-btn' + (i === exploreIdx ? ' active' : '') + '" data-idx="' + i + '" type="button"><span class="is-btn-name">' + items[i].name + '</span><span class="is-btn-sym">' + items[i].sym + '</span></button>';
    }
    grid.innerHTML = html;
    var it = items[exploreIdx];
    var info = '<div class="ii-top"><span class="ii-name">' + it.name + '</span><span class="ii-cat-badge">' + exploreCat + '</span></div>' +
      '<p class="ii-desc">' + it.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + it.formula + '</span></div>' +
      '<div class="example-box"><h4>Worked Example</h4><p class="ex-problem">' + it.ex.p + '</p>';
    for (i = 0; i < it.ex.steps.length; i++) info += '<p class="ex-step">Step ' + (i + 1) + ': <strong>' + it.ex.steps[i] + '</strong></p>';
    info += '</div>';
    $('item-info').innerHTML = info;
  }

  /* ── 14. Practice mode ─────────────────────────────────────── */
  var practice = { q: null, score: 0, total: 0, answered: false };
  function rnd(lo, hi, step) {
    var n = Math.round((lo + Math.random() * (hi - lo)) / step) * step;
    return parseFloat(n.toFixed(6));
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var GENERATORS = [
    function () {   /* τ = μ du/dy */
      var mu = pick([0.001, 0.0021, 0.084, 0.29, 1.412]);
      var grad = rnd(50, 900, 10);
      return { prompt: 'A fluid with dynamic viscosity μ = ' + mu + ' Pa·s is sheared with a velocity gradient du/dy = ' + grad + ' s⁻¹. Using Newton\u2019s law of viscosity, find the shear stress τ.', unit: 'Pa', ans: mu * grad, sol: ['Newton\u2019s law: τ = μ (du/dy)', 'τ = ' + mu + ' × ' + grad, 'τ = ' + fmtSig(mu * grad) + ' Pa'] };
    },
    function () {   /* F = μAv/y */
      var mu = pick([0.05, 0.1, 0.29, 0.5]);
      var A = rnd(0.2, 1.5, 0.1), v = rnd(0.5, 4, 0.5), y = pick([0.5, 1, 2]) / 1000;
      var F = mu * A * v / y;
      return { prompt: 'A flat plate of area ' + A + ' m² slides at ' + v + ' m/s over a fixed surface separated by a ' + (y * 1000) + ' mm film of oil (μ = ' + mu + ' Pa·s). Find the viscous drag force.', unit: 'N', ans: F, sol: ['F = μ A v / y', 'F = ' + mu + ' × ' + A + ' × ' + v + ' / ' + y, 'F = ' + fmtSig(F) + ' N'] };
    },
    function () {   /* Pa·s → cP */
      var f = pick(FLUIDS.slice(2, 7));
      return { prompt: fluidName(f) + ' has a dynamic viscosity of ' + f.mu20 + ' Pa·s at 20 °C. Express this in centipoise (cP).', unit: 'cP', ans: f.mu20 * 1000, sol: ['1 Pa·s = 1000 cP', f.mu20 + ' × 1000 = ' + fmtSig(f.mu20 * 1000) + ' cP'] };
    },
    function () {   /* ν = μ/ρ */
      var f = pick([FLUIDS[2], FLUIDS[3], FLUIDS[4], FLUIDS[6]]);
      var nu = f.mu20 / f.rho * 1e6;
      return { prompt: fluidName(f) + ': μ = ' + f.mu20 + ' Pa·s and ρ = ' + f.rho + ' kg/m³ at 20 °C. Find the kinematic viscosity ν in mm²/s.', unit: 'mm²/s', ans: nu, sol: ['ν = μ / ρ = ' + f.mu20 + ' / ' + f.rho, '= ' + fmtSig(f.mu20 / f.rho) + ' m²/s', '× 10⁶ → ν = ' + fmtSig(nu) + ' mm²/s'] };
    },
    function () {   /* Stokes vt */
      var d = pick([1, 2, 3]) / 1000;
      var f = pick([FLUIDS[4], FLUIDS[5], FLUIDS[6]]);
      var vt = d * d * (7850 - f.rho) * G / (18 * f.mu20) * 1000;
      return { prompt: 'A steel ball (ρ = 7850 kg/m³) of diameter ' + (d * 1000) + ' mm falls through ' + fluidName(f).toLowerCase() + ' (μ = ' + f.mu20 + ' Pa·s, ρ = ' + f.rho + ' kg/m³). Using Stokes\u2019 law, find the terminal velocity in mm/s.', unit: 'mm/s', ans: vt, sol: ['vt = d²(ρs − ρf)g / 18μ', 'vt = (' + d + ')² × (7850 − ' + f.rho + ') × 9.81 / (18 × ' + f.mu20 + ')', 'vt = ' + fmtSig(vt / 1000) + ' m/s = ' + fmtSig(vt) + ' mm/s'] };
    },
    function () {   /* falling-ball viscometer μ from t */
      var d = 0.002, L = 0.18, f = pick([FLUIDS[4], FLUIDS[5]]);
      var vt = d * d * (7850 - f.rho) * G / (18 * f.mu20);
      var t = parseFloat((L / vt).toFixed(1));
      var mu = d * d * (7850 - f.rho) * G * t / (18 * L);
      return { prompt: 'In a falling-ball viscometer, a 2 mm steel ball (ρ = 7850 kg/m³) takes ' + t + ' s to fall the 18 cm between the marks in a liquid of density ' + f.rho + ' kg/m³. Calculate the dynamic viscosity in Pa·s.', unit: 'Pa·s', ans: mu, sol: ['μ = d²(ρs − ρf)g·t / (18L)', 'μ = (0.002)² × ' + (7850 - f.rho) + ' × 9.81 × ' + t + ' / (18 × 0.18)', 'μ = ' + fmtSig(mu) + ' Pa·s'] };
    }
  ];
  function fluidName(f) { return f.name; }

  function newPractice() {
    practice.q = pick(GENERATORS)();
    practice.answered = false;
    $('pp-prompt').textContent = practice.q.prompt;
    $('pp-unit').textContent = practice.q.unit;
    $('pp-input').value = '';
    $('pp-feedback').textContent = ''; $('pp-feedback').className = 'feedback';
    $('pp-solution').style.display = 'none';
    $('pp-next').style.display = 'none';
  }
  function checkPractice() {
    if (!practice.q || practice.answered) return;
    var v = parseFloat($('pp-input').value);
    if (isNaN(v)) { $('pp-feedback').textContent = 'Enter a number first.'; $('pp-feedback').className = 'feedback err'; return; }
    practice.answered = true; practice.total++;
    var ok = Math.abs(v - practice.q.ans) <= Math.abs(practice.q.ans) * 0.02 + 1e-9;
    if (ok) { practice.score++; playSuccess(); $('pp-feedback').textContent = '✔ Correct! ' + fmtSig(practice.q.ans) + ' ' + practice.q.unit; $('pp-feedback').className = 'feedback ok'; }
    else { playError(); $('pp-feedback').textContent = '✘ Not quite — correct answer: ' + fmtSig(practice.q.ans) + ' ' + practice.q.unit; $('pp-feedback').className = 'feedback err'; }
    $('pbar-score-val').textContent = practice.score + ' / ' + practice.total;
    $('pp-next').style.display = '';
  }
  function showSolution() {
    if (!practice.q) return;
    var html = '<h4>Step-by-step solution</h4>';
    for (var i = 0; i < practice.q.sol.length; i++) html += '<p class="sol-step">Step ' + (i + 1) + ': <strong>' + practice.q.sol[i] + '</strong></p>';
    $('pp-solution').innerHTML = html;
    $('pp-solution').style.display = '';
  }

  /* ── 15. Quiz mode ─────────────────────────────────────────── */
  var QUIZ_POOL = [
    { q: 'Which liquid is the most viscous at 20 °C?', opts: ['Water', 'Olive oil', 'Honey', 'Milk'], ans: 2 },
    { q: 'Newton\u2019s law of viscosity states that shear stress is proportional to…', opts: ['pressure', 'the velocity gradient du/dy', 'density', 'temperature'], ans: 1 },
    { q: 'The SI unit of dynamic viscosity is…', opts: ['Pa·s', 'N/m²', 'm²/s', 'poise'], ans: 0 },
    { q: '1 centipoise equals…', opts: ['1 Pa·s', '0.1 Pa·s', '1 mPa·s', '10 mPa·s'], ans: 2 },
    { q: 'Kinematic viscosity ν is defined as…', opts: ['μ·ρ', 'μ/ρ', 'ρ/μ', 'μ·g'], ans: 1 },
    { q: 'When a liquid is heated, its viscosity generally…', opts: ['increases', 'decreases', 'stays constant', 'first rises then falls'], ans: 1 },
    { q: 'When a gas is heated, its viscosity generally…', opts: ['increases', 'decreases', 'stays constant', 'becomes zero'], ans: 0 },
    { q: 'Stokes\u2019 law for the drag on a falling sphere is valid when…', opts: ['Re > 2300', 'Re < 1', 'Re > 4000', 'the fluid is a gas'], ans: 1 },
    { q: 'Ketchup flows more easily after shaking because it is…', opts: ['Newtonian', 'shear-thickening', 'shear-thinning', 'an ideal fluid'], ans: 2 },
    { q: 'In the incline race, the finishing order of the fluids is set by…', opts: ['dynamic viscosity μ alone', 'density ρ alone', 'kinematic viscosity ν = μ/ρ', 'surface tension'], ans: 2 },
    { q: 'Doubling the ball diameter in a falling-ball viscometer makes the terminal velocity…', opts: ['2× larger', '4× larger', 'half as large', 'unchanged'], ans: 1 },
    { q: 'Water at 20 °C has a dynamic viscosity of approximately…', opts: ['1 Pa·s', '1 cP', '100 cP', '0.001 cP'], ans: 1 },
    { q: 'A falling-ball viscometer is unsuitable for water because…', opts: ['water is too dense', 'the ball would float', 'the Reynolds number is far above 1', 'water is non-Newtonian'], ans: 2 },
    { q: 'Which instrument measures viscosity by timing drainage through a fine tube?', opts: ['Rotational viscometer', 'Capillary (Ostwald) viscometer', 'Pitot tube', 'Bourdon gauge'], ans: 1 },
    { q: 'Cornstarch in water (oobleck) hardens when struck. It is…', opts: ['shear-thinning', 'shear-thickening', 'Newtonian', 'inviscid'], ans: 1 },
    { num: true, q: 'A fluid with μ = 0.5 Pa·s is sheared at du/dy = 200 s⁻¹. Find the shear stress τ in Pa.', ans: 100, unit: 'Pa' },
    { num: true, q: 'Glycerin has μ = 1.412 Pa·s. Express this in centipoise (cP).', ans: 1412, unit: 'cP' },
    { num: true, q: 'Olive oil: μ = 0.084 Pa·s, ρ = 911 kg/m³. Find ν in mm²/s (1 decimal ok).', ans: 92.2, unit: 'mm²/s' }
  ];
  var quiz = { set: [], idx: 0, score: 0, answers: [] };
  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    quiz.set = [];
    for (var i = 0; i < 5; i++) quiz.set.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    quiz.idx = 0; quiz.score = 0; quiz.answers = [];
    $('quiz-result').style.display = 'none';
    $('quiz-panel').style.display = '';
    renderQuizQ();
  }
  function renderQuizQ() {
    var q = quiz.set[quiz.idx];
    $('qbar-num').textContent = quiz.idx + 1;
    var html = '<p class="qp-prompt">' + q.q + '</p>';
    if (q.num) {
      html += '<div class="pp-input-row"><input class="pp-input" id="qz-input" type="number" step="any" placeholder="Your answer"><span class="pp-unit">' + q.unit + '</span>' +
        '<button class="btn btn-primary" id="qz-submit" type="button">Submit</button></div><div class="pp-bottom"><span class="feedback" id="qz-feedback"></span></div>';
    } else {
      html += '<div class="answer-grid">';
      for (var i = 0; i < q.opts.length; i++) html += '<button class="answer-btn" data-opt="' + i + '" type="button">' + q.opts[i] + '</button>';
      html += '</div><div class="pp-bottom"><span class="feedback" id="qz-feedback"></span></div>';
    }
    $('quiz-panel').innerHTML = html;
    if (q.num) {
      $('qz-submit').addEventListener('click', submitQuizNum);
      $('qz-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitQuizNum(); });
    } else {
      var btns = $('quiz-panel').querySelectorAll('.answer-btn');
      for (var j = 0; j < btns.length; j++) btns[j].addEventListener('click', onQuizOpt);
    }
  }
  function afterQuizAnswer(ok, detail) {
    if (ok) { quiz.score++; playSuccess(); } else playError();
    quiz.answers.push({ ok: ok, detail: detail });
    var fb = $('qz-feedback');
    fb.textContent = ok ? '✔ Correct!' : '✘ ' + detail;
    fb.className = 'feedback ' + (ok ? 'ok' : 'err');
    setTimeout(function () {
      quiz.idx++;
      if (quiz.idx < 5) renderQuizQ(); else showQuizResult();
    }, 1200);
  }
  function onQuizOpt(e) {
    var q = quiz.set[quiz.idx];
    var sel = parseInt(e.currentTarget.dataset.opt, 10);
    var btns = $('quiz-panel').querySelectorAll('.answer-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.add('locked');
      if (i === q.ans) btns[i].classList.add('correct');
      else if (i === sel) btns[i].classList.add('wrong');
      btns[i].removeEventListener('click', onQuizOpt);
    }
    afterQuizAnswer(sel === q.ans, 'Correct answer: ' + q.opts[q.ans]);
  }
  function submitQuizNum() {
    var q = quiz.set[quiz.idx];
    var v = parseFloat($('qz-input').value);
    if (isNaN(v)) return;
    $('qz-submit').disabled = true;
    var ok = Math.abs(v - q.ans) <= Math.abs(q.ans) * 0.02;
    afterQuizAnswer(ok, 'Correct answer: ' + q.ans + ' ' + q.unit);
  }
  function showQuizResult() {
    $('quiz-panel').style.display = 'none';
    var cls = quiz.score === 5 ? 'perfect' : quiz.score >= 3 ? 'good' : 'poor';
    var stars = quiz.score === 5 ? '★★★' : quiz.score >= 3 ? '★★' : '★';
    var verdict = quiz.score === 5 ? 'Perfect — viscosity mastered!' : quiz.score >= 3 ? 'Good work — review the misses below.' : 'Keep practising — open Explore mode for the theory.';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars" style="color:var(--gold)">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + quiz.score + '/5</div><div class="qr-verdict">' + verdict + '</div></div></div><div class="qr-rows">';
    for (var i = 0; i < quiz.answers.length; i++) {
      var a = quiz.answers[i];
      html += '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + quiz.set[i].q + (a.ok ? '' : ' — <strong>' + a.detail + '</strong>') + '</span><span class="qr-mark">' + (a.ok ? '✔' : '✘') + '</span></div>';
    }
    html += '</div><button class="btn btn-primary" id="qz-again" type="button">New Quiz</button>';
    var qr = $('quiz-result');
    qr.innerHTML = html; qr.style.display = '';
    $('qz-again').addEventListener('click', function () { playClick(); startQuiz(); });
  }

  /* ── 16. Mode switching ────────────────────────────────────── */
  function show(id, on) { var el = $(id); if (el) el.style.display = on ? '' : 'none'; }
  function switchMode(m) {
    state.mode = m;
    var sim = (m === 'simulate');
    document.querySelector('.canvas-card').style.display = sim ? '' : 'none';
    show('sim-panel', sim); show('learn-panels', sim); show('exp-group', sim);
    show('cat-row', m === 'explore'); show('item-selector', m === 'explore'); show('item-info', m === 'explore');
    show('practice-panel', m === 'practice'); show('practice-bar', m === 'practice');
    show('quiz-bar', m === 'quiz');
    if (m !== 'quiz') { show('quiz-panel', false); show('quiz-result', false); }
    if (m === 'explore') renderExplore();
    if (m === 'practice') newPractice();
    if (m === 'quiz') startQuiz();
    if (sim) { updateAll(); requestDraw(); }
  }
  function switchExp(x) {
    state.exp = x;
    sizeCanvas();
    resetRun();
    show('race-controls', x === 'race');
    show('ball-controls', x === 'ball');
    $('btn-start').innerHTML = x === 'race' ? '&#9654; Start Race' : '&#9654; Drop Ball';
    updateAll();
  }

  /* ── 17. Export ────────────────────────────────────────────── */
  function exportCSV() {
    var rows = [], i;
    if (state.exp === 'race') {
      rows.push(['Fluid', 'mu_mPa_s_at_' + state.temp + 'C', 'rho_kg_m3', 'nu_mm2_s', 'mean_speed_mm_s', 'time_s', 'angle_deg', 'length_cm', 'film_mm'].join(','));
      var calc = raceCalc();
      for (i = 0; i < 4; i++) {
        var c = calc[i]; if (!c) continue;
        rows.push([c.f.name, (c.mu * 1000).toFixed(4), c.f.rho, (c.nu * 1e6).toFixed(2), (c.v * 1000).toFixed(3), c.t.toFixed(3), state.angle, state.lenCm, state.filmMm].join(','));
      }
    } else {
      rows.push(['Tube', 'Fluid', 'mu_true_mPa_s', 'vt_mm_s', 'Re', 't_AB_s', 'mu_stokes_mPa_s', 'ball', 'dia_mm', 'temp_C'].join(','));
      var bc = ballCalc();
      for (i = 0; i < 2; i++) {
        var b = bc[i];
        if (b.floats) { rows.push([(i === 0 ? 'A' : 'B'), b.f.name, (b.mu * 1000).toFixed(3), 'floats', '', '', '', state.ballMat, state.ballDia, state.temp].join(',')); continue; }
        rows.push([(i === 0 ? 'A' : 'B'), b.f.name, (b.mu * 1000).toFixed(3), (b.vt * 1000).toFixed(3), b.Re.toFixed(3), (b.tB - b.tA).toFixed(3), (b.muMeas * 1000).toFixed(3), state.ballMat, state.ballDia, state.temp].join(','));
      }
    }
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'viscosity_' + state.exp + '_results.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d');
    tc.fillStyle = '#0d1117'; tc.fillRect(0, 0, tmp.width, tmp.height);
    tc.drawImage(canvas, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 10) fs = 10;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'viscosity_' + state.exp + '.png';
    a.click();
  }
  function copyResult() {
    var txt, i;
    if (state.exp === 'race') {
      var parts = [], calc = raceCalc();
      for (i = 0; i < 4; i++) if (calc[i]) parts.push(calc[i].f.name + ': ' + fmtTime(calc[i].t));
      txt = 'Viscosity race (θ=' + state.angle + '°, L=' + state.lenCm + ' cm, h=' + state.filmMm + ' mm, T=' + state.temp + ' °C): ' + parts.join(' | ');
    } else {
      var bp = [], bc = ballCalc();
      for (i = 0; i < 2; i++) bp.push(bc[i].f.name + (bc[i].floats ? ': floats' : ': vt=' + fmtSig(bc[i].vt * 1000) + ' mm/s, μ(Stokes)=' + fmtMu(bc[i].muMeas)));
      txt = 'Falling-ball viscometer (d=' + state.ballDia + ' mm, T=' + state.temp + ' °C): ' + bp.join(' | ');
    }
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
  }

  /* ── 18. Wiring ────────────────────────────────────────────── */
  function updateAll() { updateBadges(); updateResults(); updateLearn(); }

  function fillSelect(sel, allowEmpty) {
    var html = allowEmpty ? '<option value="">— empty lane —</option>' : '';
    for (var i = 0; i < FLUIDS.length; i++) html += '<option value="' + FLUIDS[i].id + '">' + FLUIDS[i].name + '</option>';
    sel.innerHTML = html;
  }

  function bindRange(slId, inId, key, isFloat) {
    var sl = $(slId), inp = $(inId);
    function commit(v, fromSlider) {
      var lo = parseFloat(sl.min), hi = parseFloat(sl.max);
      v = clamp(v, lo, hi);
      if (!isFloat) v = Math.round(v);
      state[key] = v;
      if (!fromSlider) sl.value = v;
      inp.value = isFloat ? v.toFixed(1) : v;
      if (key === 'temp') { $('sl-temp').value = v; $('in-temp').value = v; $('sl-temp2').value = v; $('in-temp2').value = v; }
      resetRun();
    }
    sl.addEventListener('input', function () { commit(parseFloat(sl.value), true); });
    inp.addEventListener('change', function () { var v = parseFloat(inp.value); if (!isNaN(v)) commit(v, false); else inp.value = state[key]; });
  }

  function init() {
    sizeCanvas();

    /* selects */
    var i;
    for (i = 0; i < 4; i++) {
      var sel = $('sel-lane-' + i);
      fillSelect(sel, true);
      sel.value = state.lanes[i];
      (function (idx, s) {
        s.addEventListener('change', function () { state.lanes[idx] = s.value; resetRun(); });
      })(i, sel);
    }
    for (i = 0; i < 2; i++) {
      var bs = $('sel-ball-' + i);
      fillSelect(bs, false);
      bs.value = state.ballFluids[i];
      (function (idx, s) {
        s.addEventListener('change', function () { state.ballFluids[idx] = s.value; resetRun(); });
      })(i, bs);
    }
    var bm = $('sel-ball-mat'), bmHtml = '';
    for (i = 0; i < BALLS.length; i++) bmHtml += '<option value="' + BALLS[i].id + '">' + BALLS[i].name + ' (' + BALLS[i].rho + ' kg/m³)</option>';
    bm.innerHTML = bmHtml; bm.value = state.ballMat;
    bm.addEventListener('change', function () { state.ballMat = bm.value; resetRun(); });

    /* sliders + steppers */
    bindRange('sl-angle', 'in-angle', 'angle', false);
    bindRange('sl-len', 'in-len', 'lenCm', false);
    bindRange('sl-film', 'in-film', 'filmMm', true);
    bindRange('sl-temp', 'in-temp', 'temp', false);
    bindRange('sl-dia', 'in-dia', 'ballDia', true);
    bindRange('sl-temp2', 'in-temp2', 'temp', false);

    var stepBtns = document.querySelectorAll('.step-btn');
    var STEP_MAP = { angle: ['sl-angle', 'in-angle', 'angle', 1, false], len: ['sl-len', 'in-len', 'lenCm', 5, false], film: ['sl-film', 'in-film', 'filmMm', 0.1, true], temp: ['sl-temp', 'in-temp', 'temp', 1, false], dia: ['sl-dia', 'in-dia', 'ballDia', 0.5, true], temp2: ['sl-temp2', 'in-temp2', 'temp', 1, false] };
    for (i = 0; i < stepBtns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          var m = STEP_MAP[btn.dataset.step]; if (!m) return;
          var sl = $(m[0]), inp = $(m[1]);
          var v = state[m[2]] + m[3] * parseInt(btn.dataset.dir, 10);
          v = clamp(v, parseFloat(sl.min), parseFloat(sl.max));
          v = parseFloat(v.toFixed(2));
          state[m[2]] = v;
          sl.value = v; inp.value = m[4] ? v.toFixed(1) : v;
          if (m[2] === 'temp') { $('sl-temp').value = v; $('in-temp').value = v; $('sl-temp2').value = v; $('in-temp2').value = v; }
          playClick(); resetRun();
        });
      })(stepBtns[i]);
    }

    /* mode + experiment + speed pills */
    $('mode-tabs').addEventListener('click', function (e) {
      var p = e.target.closest('.pill'); if (!p) return;
      var ps = this.querySelectorAll('.pill');
      for (var k = 0; k < ps.length; k++) ps[k].classList.toggle('active', ps[k] === p);
      playClick(); switchMode(p.dataset.mode);
    });
    $('exp-tabs').addEventListener('click', function (e) {
      var p = e.target.closest('.pill'); if (!p) return;
      var ps = this.querySelectorAll('.pill');
      for (var k = 0; k < ps.length; k++) ps[k].classList.toggle('active', ps[k] === p);
      playClick(); switchExp(p.dataset.exp);
    });
    $('speed-tabs').addEventListener('click', function (e) {
      var p = e.target.closest('.pill'); if (!p) return;
      var ps = this.querySelectorAll('.pill');
      for (var k = 0; k < ps.length; k++) ps[k].classList.toggle('active', ps[k] === p);
      state.speed = p.dataset.speed;
      if (race.running) race.mult = currentMult();
      if (ballRun.running) ballRun.mult = currentMult();
      playClick(); updateBadges();
    });

    /* action bar */
    $('btn-start').addEventListener('click', startRun);
    $('btn-skip').addEventListener('click', skipRun);
    $('btn-reset').addEventListener('click', function () { playClick(); resetRun(); });
    $('btn-csv').addEventListener('click', exportCSV);
    $('btn-png').addEventListener('click', exportPNG);
    $('btn-calc').addEventListener('click', function () { buildCalcModal(); $('calc-modal').classList.add('active'); });
    $('calc-modal-close').addEventListener('click', function () { $('calc-modal').classList.remove('active'); });
    $('calc-modal').addEventListener('click', function (e) { if (e.target === this) this.classList.remove('active'); });

    /* toggles */
    var TOGS = [['chk-timers', 'timers'], ['chk-labels', 'labels'], ['chk-equation', 'equation'], ['chk-grid', 'grid']];
    for (i = 0; i < TOGS.length; i++) {
      (function (pair) {
        $(pair[0]).addEventListener('change', function () { state.toggles[pair[1]] = this.checked; });
      })(TOGS[i]);
    }

    /* learn expand/collapse */
    $('learn-expand-all').addEventListener('click', function () {
      var cards = document.querySelectorAll('.learn-card');
      for (var k = 0; k < cards.length; k++) cards[k].open = true;
    });
    $('learn-collapse-all').addEventListener('click', function () {
      var cards = document.querySelectorAll('.learn-card');
      for (var k = 0; k < cards.length; k++) cards[k].open = false;
    });

    /* explore */
    $('cat-tabs').addEventListener('click', function (e) {
      var p = e.target.closest('.pill'); if (!p) return;
      var ps = this.querySelectorAll('.pill');
      for (var k = 0; k < ps.length; k++) ps[k].classList.toggle('active', ps[k] === p);
      exploreCat = p.dataset.cat; exploreIdx = 0; playClick(); renderExplore();
    });
    $('concept-grid').addEventListener('click', function (e) {
      var b = e.target.closest('.is-btn'); if (!b) return;
      exploreIdx = parseInt(b.dataset.idx, 10); playClick(); renderExplore();
    });

    /* practice */
    $('pp-check').addEventListener('click', checkPractice);
    $('pp-show').addEventListener('click', showSolution);
    $('pp-next').addEventListener('click', function () { playClick(); newPractice(); });
    $('pp-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });

    /* context menu */
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var m = $('ctx-menu');
      m.style.display = 'block';
      var mw = 190, mh = 150;
      m.style.left = Math.min(e.clientX, window.innerWidth - mw) + 'px';
      m.style.top = Math.min(e.clientY, window.innerHeight - mh) + 'px';
    });
    document.addEventListener('click', function () { $('ctx-menu').style.display = 'none'; });
    $('ctx-menu').addEventListener('click', function (e) {
      var b = e.target.closest('.ctx-item'); if (!b) return;
      var a = b.dataset.ctx;
      if (a === 'copy-result') copyResult();
      else if (a === 'csv') exportCSV();
      else if (a === 'png') exportPNG();
      else if (a === 'reset') resetRun();
    });

    switchExp(state.exp);   /* ball is the default experiment */
    requestDraw();
  }

  init();
})();
