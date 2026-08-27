/* ══════════════════════════════════════════════════════════════════
   Escape Velocity Simulator — Newton's Cannonball
   Real inverse-square two-body gravity, integrated with RK4.
   Outcomes (falls back / orbit / escape) fall out of the physics.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── constants ──────────────────────────────────────────────── */
  var G = 6.674e-11;                       // N·m²/kg²  (for display only; μ = GM stored directly)
  var BALLISTIC_COEFF = 500;               // kg/m²  m/(Cd·A) for the drag model (blunt capsule)

  // μ = GM stored directly to avoid compounding rounding.
  var BODIES = {
    earth: { name: 'Earth', mu: 3.986004418e14, R: 6.371e6,  M: '5.972×10²⁴ kg', gp: 'gp-earth',
             rho0: 1.225,  H: 8500,  atmo: true,  color1: '#4a90d9', color2: '#0d2b52', land: '#2e7d46', atmCol: 'rgba(90,160,255,0.35)' },
    moon:  { name: 'Moon',  mu: 4.9048695e12, R: 1.7374e6, M: '7.342×10²² kg', gp: 'gp-moon',
             rho0: 0,      H: 1,     atmo: false, color1: '#c7ccd4', color2: '#4a4e57', land: '#8b9098', atmCol: 'rgba(180,190,210,0.10)' },
    mars:  { name: 'Mars',  mu: 4.282837e13,  R: 3.3895e6, M: '6.417×10²³ kg', gp: 'gp-mars',
             rho0: 0.020,  H: 11100, atmo: true,  color1: '#d97b4a', color2: '#5c2a17', land: '#a8472a', atmCol: 'rgba(230,150,110,0.20)' }
  };

  /* ── DOM helpers ────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

  var canvas = $('sim-canvas');
  var ctx = canvas.getContext('2d');

  /* ── state ──────────────────────────────────────────────────── */
  var state = {
    body: 'earth',
    speed: 7.91,        // km/s (display)  → internally *1000
    angle: 0,           // deg from local horizontal (0 = tangential, 90 = radial up)
    alt: 0,             // km launch altitude
    drag: false,
    mode: 'simulate',
    show: { stars: true, vector: true, markers: true, ghosts: true, rings: true },
    audioCtx: null
  };

  var view = { cx: 0, cy: 0, scale: 1, cssW: 0, cssH: 0, dpr: 1 };
  var path = null;       // { pts, status, ... } current trajectory
  var analytic = null;   // orbital params from launch state
  var ghosts = [];       // [{ pts:[{x,y}], color }]
  var stars = [];
  var launched = false;                 // has the current path been fired?
  var rocketEl = null;                  // CSS-animated rocket overlay element

  /* ══════════════════════════════════════════════════════════════
     PHYSICS
     ══════════════════════════════════════════════════════════════ */

  function B() { return BODIES[state.body]; }
  function r0() { return B().R + state.alt * 1000; }          // launch radius (m)
  function vEsc(r) { return Math.sqrt(2 * B().mu / r); }       // m/s
  function vCirc(r) { return Math.sqrt(B().mu / r); }          // m/s

  // acceleration at (x,y) with velocity (vx,vy): gravity + optional drag
  function accel(x, y, vx, vy, out) {
    var r = Math.sqrt(x * x + y * y);
    var ir3 = -B().mu / (r * r * r);
    var ax = ir3 * x, ay = ir3 * y;
    if (state.drag && B().rho0 > 0) {
      var alt = r - B().R;
      if (alt >= 0) {
        var rho = B().rho0 * Math.exp(-alt / B().H);
        if (rho > 1e-9) {
          var sp = Math.sqrt(vx * vx + vy * vy);
          // a_drag = -(1/(2B))·ρ·|v|·v_vec   (magnitude ½ρv²Cd A/m)
          var k = -(rho * sp) / (2 * BALLISTIC_COEFF);
          ax += k * vx; ay += k * vy;
        }
      }
    }
    out[0] = ax; out[1] = ay;
  }

  // RK4 one step; s = [x,y,vx,vy]
  function rk4(s, dt) {
    var a = [0, 0];
    accel(s[0], s[1], s[2], s[3], a);
    var k1 = [s[2], s[3], a[0], a[1]];
    accel(s[0] + 0.5 * dt * k1[0], s[1] + 0.5 * dt * k1[1], s[2] + 0.5 * dt * k1[2], s[3] + 0.5 * dt * k1[3], a);
    var k2 = [s[2] + 0.5 * dt * k1[2], s[3] + 0.5 * dt * k1[3], a[0], a[1]];
    accel(s[0] + 0.5 * dt * k2[0], s[1] + 0.5 * dt * k2[1], s[2] + 0.5 * dt * k2[2], s[3] + 0.5 * dt * k2[3], a);
    var k3 = [s[2] + 0.5 * dt * k2[2], s[3] + 0.5 * dt * k2[3], a[0], a[1]];
    accel(s[0] + dt * k3[0], s[1] + dt * k3[1], s[2] + dt * k3[2], s[3] + dt * k3[3], a);
    var k4 = [s[2] + dt * k3[2], s[3] + dt * k3[3], a[0], a[1]];
    s[0] += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    s[1] += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    s[2] += dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    s[3] += dt / 6 * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
  }

  // Analytic osculating orbit from the launch state (frictionless conic)
  function computeAnalytic() {
    var r = r0();
    var v = state.speed * 1000;
    var th = state.angle * Math.PI / 180;
    var mu = B().mu;
    var h = r * v * Math.cos(th);                 // specific angular momentum
    var eps = v * v / 2 - mu / r;                 // specific orbital energy
    var out = { r0: r, v: v, mu: mu, h: h, eps: eps, vEsc: vEsc(r), vCirc: vCirc(r) };
    if (eps >= -1e-3 * mu / r) {                  // parabolic / hyperbolic (escape)
      out.bound = false;
      out.e = (eps >= 0) ? Math.sqrt(1 + 2 * eps * h * h / (mu * mu)) : 1;
      out.a = Infinity; out.rApo = Infinity; out.rPeri = h * h / mu / (1 + out.e); out.period = Infinity;
    } else {
      out.bound = true;
      var a = -mu / (2 * eps);
      var e = Math.sqrt(Math.max(0, 1 + 2 * eps * h * h / (mu * mu)));
      out.a = a; out.e = e;
      out.rApo = a * (1 + e);
      out.rPeri = a * (1 - e);
      out.period = 2 * Math.PI * Math.sqrt(a * a * a / mu);
    }
    // frictionless classification — 100 m tolerance absorbs float noise in e
    // for grazing orbits (perigee exactly at the launch radius); 100 m is
    // invisible at planetary scale
    if (!out.bound) out.kind = 'escape';
    else if (out.rPeri >= B().R - 100) out.kind = 'orbit';
    else out.kind = 'crash';
    return out;
  }

  // Numerically integrate the true path (used for drawing + animation)
  function integratePath() {
    var r = r0();
    var v = state.speed * 1000;
    var th = state.angle * Math.PI / 180;
    var R = B().R, mu = B().mu;
    // launch at top of planet (0, r); tangent = +x, radial-out = +y
    var s = [0, r, v * Math.cos(th), v * Math.sin(th)];
    var dtNear = Math.sqrt(R * R * R / mu) * 0.004;   // fine step at surface scale
    var drawLimitR = 30 * R;                          // stop drawing this far out
    var maxSteps = 26000;
    var pts = [{ t: 0, x: s[0], y: s[1], r: r, v: v }];
    var t = 0;

    // Frictionless motion is an exact conic, so classify from the analytic
    // orbit (energy + perigee) — the integrator is only for drawing. This
    // avoids misreading huge-but-bound ellipses (apogee >> view) as escapes.
    // With drag on, energy changes, so classify dynamically instead.
    var status;
    if (!state.drag) status = analytic ? analytic.kind : 'orbit';
    else status = 'orbit';
    if (status === 'crash' && !state.drag && analytic && !analytic.bound) status = 'escape';

    for (var i = 0; i < maxSteps; i++) {
      var rNow = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
      // Adaptive step: scale with local orbital timescale so distant slow
      // arcs take big steps (a full 40-day ellipse costs only ~2k steps) while
      // atmosphere passes stay finely resolved.
      var dt = Math.sqrt(rNow * rNow * rNow / mu) * 0.004;
      if (state.drag && rNow < R + 6 * B().H) dt = dtNear;   // resolve drag layer
      rk4(s, dt);
      t += dt;
      var rr = Math.sqrt(s[0] * s[0] + s[1] * s[1]);
      var vv = Math.sqrt(s[2] * s[2] + s[3] * s[3]);
      if (i % 2 === 0) pts.push({ t: t, x: s[0], y: s[1], r: rr, v: vv });

      if (rr <= R) {                          // reached the surface
        pts.push({ t: t, x: s[0] / rr * R, y: s[1] / rr * R, r: R, v: vv });
        if (state.drag) status = 'crash';
        // frictionless grazing orbits (perigee == launch radius) may dip a few
        // metres under from numeric error — keep the analytic classification.
        else if (analytic && analytic.kind !== 'orbit') status = analytic.kind === 'escape' ? 'escape' : 'crash';
        break;
      }
      if (rr > drawLimitR) {
        // With drag, confirm escape from live energy once well outside the
        // atmosphere; frictionless status is already exact.
        if (state.drag) status = (vv * vv / 2 - mu / rr >= 0) ? 'escape' : 'orbit';
        break;
      }
      // frictionless stable orbit: stop after one full revolution
      if (!state.drag && status === 'orbit' && analytic &&
          analytic.period < Infinity && t > analytic.period * 1.02) break;
      // drag decay safety: if extremely slow near the ground, stop
      if (state.drag && vv < 5 && rr <= R + 100) { status = 'crash'; break; }
    }
    return { pts: pts, status: status };
  }

  /* ══════════════════════════════════════════════════════════════
     VIEW / TRANSFORM
     ══════════════════════════════════════════════════════════════ */
  function fitView() {
    if (!path) return;
    var R = B().R;
    var ext = R * 1.1;
    for (var i = 0; i < path.pts.length; i++) {
      var p = path.pts[i];
      var d = Math.max(Math.abs(p.x), Math.abs(p.y));
      if (d > ext) ext = d;
    }
    // Keep the planet a stable, comfortable size: clamp the fit radius to a
    // narrow band so changing speed never shrinks the planet to a dot. Large
    // orbits / escapes simply extend off-screen instead of zooming way out.
    var lo = R * 2.4, hi = R * 3.9;
    var maxR = Math.max(lo, Math.min(hi, ext));
    var half = Math.min(view.cssW, view.cssH) / 2;
    view.scale = (half * 0.94) / maxR;
    view.cx = view.cssW / 2;
    view.cy = view.cssH / 2;
  }

  function sx(x) { return view.cx + x * view.scale; }
  function sy(y) { return view.cy - y * view.scale; }

  /* ══════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════ */
  function makeStars() {
    stars = [];
    var n = Math.round(view.cssW * view.cssH / 5200);
    // deterministic scatter (no Math.random dependency for repeatability)
    var seed = 12345;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var i = 0; i < n; i++) {
      stars.push({ x: rnd() * view.cssW, y: rnd() * view.cssH, r: rnd() * 1.1 + 0.2, a: rnd() * 0.6 + 0.15 });
    }
  }

  // Procedural surface features per body (normalised coords, units of planet R)
  var SURFACE = {
    earth: {
      ocean1: '#2f7fd6', ocean2: '#123a6b', deep: '#0a2247',
      land: '#3f9b54', land2: '#2f7d42', sand: '#b8a05a',
      blobs: [
        [-0.42, -0.30, 0.24, 0], [-0.24, -0.14, 0.20, 0], [-0.46, 0.02, 0.15, 1],
        [0.10, -0.42, 0.15, 0], [0.26, -0.28, 0.18, 0], [0.18, -0.10, 0.13, 2],
        [0.30, 0.28, 0.20, 0], [0.46, 0.36, 0.14, 1], [0.16, 0.44, 0.16, 0],
        [-0.12, 0.34, 0.14, 0], [-0.02, 0.50, 0.10, 1], [-0.58, -0.10, 0.10, 0]
      ],
      clouds: [[-0.15, -0.45, 0.26], [0.35, -0.05, 0.22], [-0.30, 0.30, 0.24], [0.10, 0.55, 0.18]],
      caps: true
    },
    moon: {
      ocean1: '#c9cdd4', ocean2: '#7f858f', deep: '#4a4e57',
      land: '#9297a0', land2: '#787d87', sand: '#aeb3bb',
      blobs: [
        [-0.30, -0.28, 0.26, 3], [0.22, -0.10, 0.22, 3], [-0.10, 0.30, 0.24, 3],
        [0.34, 0.34, 0.16, 3], [-0.44, 0.18, 0.14, 3]
      ],
      craters: [[-0.35, -0.30, 0.12], [0.10, 0.12, 0.16], [0.40, -0.30, 0.09],
                [-0.10, 0.45, 0.10], [0.30, 0.42, 0.07], [-0.50, -0.05, 0.08], [0.15, -0.42, 0.06]],
      clouds: [], caps: false
    },
    mars: {
      ocean1: '#e08a54', ocean2: '#a8481f', deep: '#5c2410',
      land: '#b8542b', land2: '#8f3d1c', sand: '#d98b52',
      blobs: [
        [-0.34, -0.10, 0.28, 4], [0.24, -0.30, 0.20, 4], [0.30, 0.22, 0.24, 4],
        [-0.18, 0.34, 0.18, 4], [0.02, -0.02, 0.16, 5]
      ],
      clouds: [], caps: 'mars'
    }
  };

  function drawPlanet() {
    var b = B();
    var cx = view.cx, cy = view.cy, rp = b.R * view.scale;
    var S = SURFACE[state.body];
    var lx = cx - rp * 0.42, ly = cy - rp * 0.42;   // light direction (upper-left)

    // outer atmosphere halo
    if (b.atmo) {
      var ga = ctx.createRadialGradient(cx, cy, rp * 0.98, cx, cy, rp * 1.22);
      ga.addColorStop(0, b.atmCol);
      ga.addColorStop(0.5, b.atmCol);
      ga.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ga;
      ctx.beginPath(); ctx.arc(cx, cy, rp * 1.22, 0, 2 * Math.PI); ctx.fill();
    }

    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 2 * Math.PI); ctx.clip();

    // base surface (ocean / regolith) with lit gradient
    var g = ctx.createRadialGradient(lx, ly, rp * 0.15, cx, cy, rp * 1.25);
    g.addColorStop(0, S.ocean1); g.addColorStop(0.55, S.ocean2); g.addColorStop(1, S.deep);
    ctx.fillStyle = g;
    ctx.fillRect(cx - rp, cy - rp, rp * 2, rp * 2);

    // landmasses / maria (organic clusters of overlapping blobs)
    for (var i = 0; i < S.blobs.length; i++) {
      var bl = S.blobs[i];
      var col = (bl[3] === 1 || bl[3] === 5) ? S.land2 : (bl[3] === 2) ? S.sand : (bl[3] === 3) ? S.land2 : (bl[3] === 4) ? S.land : S.land;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx + bl[0] * rp, cy + bl[1] * rp, bl[2] * rp, 0, 2 * Math.PI);
      ctx.fill();
    }

    // craters (Moon) — ring + shadow
    if (S.craters) {
      for (var c = 0; c < S.craters.length; c++) {
        var cr = S.craters[c], ccx = cx + cr[0] * rp, ccy = cy + cr[1] * rp, crr = cr[2] * rp;
        ctx.fillStyle = 'rgba(60,63,70,0.55)';
        ctx.beginPath(); ctx.arc(ccx, ccy, crr, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(215,220,228,0.35)';
        ctx.beginPath(); ctx.arc(ccx - crr * 0.18, ccy - crr * 0.18, crr * 0.82, 0, 2 * Math.PI); ctx.fill();
        ctx.fillStyle = 'rgba(70,74,82,0.5)';
        ctx.beginPath(); ctx.arc(ccx, ccy, crr * 0.6, 0, 2 * Math.PI); ctx.fill();
      }
    }

    // polar ice caps
    if (S.caps) {
      ctx.fillStyle = S.caps === 'mars' ? 'rgba(238,235,228,0.9)' : 'rgba(240,246,255,0.85)';
      ctx.beginPath(); ctx.ellipse(cx, cy - rp * 0.92, rp * 0.5, rp * 0.22, 0, 0, 2 * Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, cy + rp * 0.92, rp * 0.42, rp * 0.18, 0, 0, 2 * Math.PI); ctx.fill();
    }

    // clouds (Earth) — soft white swirls
    for (var k = 0; S.clouds && k < S.clouds.length; k++) {
      var cl = S.clouds[k];
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.beginPath(); ctx.ellipse(cx + cl[0] * rp, cy + cl[1] * rp, cl[2] * rp, cl[2] * rp * 0.5, 0.5, 0, 2 * Math.PI); ctx.fill();
    }

    // specular highlight (sun glint)
    var sp = ctx.createRadialGradient(lx, ly, 0, lx, ly, rp * 0.9);
    sp.addColorStop(0, 'rgba(255,255,255,0.35)');
    sp.addColorStop(0.4, 'rgba(255,255,255,0.06)');
    sp.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sp;
    ctx.fillRect(cx - rp, cy - rp, rp * 2, rp * 2);

    // night-side terminator shadow (dark on the lower-right)
    var sh = ctx.createRadialGradient(lx, ly, rp * 0.35, cx + rp * 0.5, cy + rp * 0.5, rp * 1.7);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(0.55, 'rgba(0,0,0,0.05)');
    sh.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = sh;
    ctx.fillRect(cx - rp, cy - rp, rp * 2, rp * 2);

    ctx.restore(); // un-clip

    // atmospheric rim light on the day side
    if (b.atmo) {
      ctx.save();
      ctx.lineWidth = Math.max(1.5, rp * 0.03);
      var rim = ctx.createLinearGradient(cx - rp, cy - rp, cx + rp, cy + rp);
      rim.addColorStop(0, b.atmCol); rim.addColorStop(0.5, 'rgba(255,255,255,0)'); rim.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = rim;
      ctx.beginPath(); ctx.arc(cx, cy, rp - ctx.lineWidth * 0.5, 0, 2 * Math.PI); ctx.stroke();
      ctx.restore();
    }
    // crisp edge
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 2 * Math.PI); ctx.stroke();
  }

  function drawRings() {
    if (!state.show.rings) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(139,157,195,0.14)';
    ctx.setLineDash([4, 6]); ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(139,157,195,0.5)';
    ctx.font = '10px "Courier New", monospace';
    for (var m = 2; m <= 9; m++) {
      var rr = B().R * m * view.scale;
      if (rr > Math.max(view.cssW, view.cssH)) break;
      ctx.beginPath(); ctx.arc(view.cx, view.cy, rr, 0, 2 * Math.PI); ctx.stroke();
      ctx.fillText(m + 'R', view.cx + 3, view.cy - rr + 12);
    }
    ctx.restore();
  }

  function drawTrajectory(upto) {
    if (!path || path.pts.length < 2) return;
    var pts = path.pts;
    var end = (upto == null) ? pts.length : Math.min(upto, pts.length);
    // predicted (faint) full path
    ctx.save();
    ctx.lineWidth = 1.4; ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(170,180,255,0.28)';
    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (var i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    ctx.stroke();
    ctx.setLineDash([]);
    // solid revealed portion, colour-coded by outcome
    var col = path.status === 'escape' ? '#f5c842' : path.status === 'crash' ? '#ff6b6b' : '#3ddc84';
    ctx.lineWidth = 2.6; ctx.strokeStyle = col;
    ctx.shadowColor = col; ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (var j = 1; j < end; j++) ctx.lineTo(sx(pts[j].x), sy(pts[j].y));
    ctx.stroke();
    ctx.restore();
  }

  function drawMarkers() {
    if (!state.show.markers || !analytic) return;
    var b = B();
    // apogee/perigee positions lie along the line of apsides.
    // For a launch at top, apsides orientation isn't axis-aligned in general,
    // so mark the extremes found in the integrated path instead (robust & exact).
    if (!path) return;
    var apo = null, peri = null, dmax = -1, dmin = 1e30;
    for (var i = 0; i < path.pts.length; i++) {
      var p = path.pts[i];
      if (p.r > dmax) { dmax = p.r; apo = p; }
      if (p.r < dmin) { dmin = p.r; peri = p; }
    }
    ctx.save();
    ctx.font = '11px "Segoe UI", sans-serif';
    if (apo && analytic.bound) {
      ctx.fillStyle = '#f5c842';
      dot(sx(apo.x), sy(apo.y), 4, '#f5c842');
      label('Apogee', sx(apo.x), sy(apo.y) - 8, '#f5c842');
    }
    if (peri && peri.r > b.R + 1) {
      ctx.fillStyle = '#7fd4ff';
      dot(sx(peri.x), sy(peri.y), 4, '#7fd4ff');
      label('Perigee', sx(peri.x), sy(peri.y) + 16, '#7fd4ff');
    }
    ctx.restore();
  }

  function dot(x, y, r, c) { ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = c; ctx.fill(); }
  function label(txt, x, y, c) {
    ctx.font = '10px "Segoe UI", sans-serif';
    var w = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(13,17,30,0.7)';
    ctx.fillRect(x - w / 2 - 3, y - 10, w + 6, 13);
    ctx.fillStyle = c; ctx.textAlign = 'center';
    ctx.fillText(txt, x, y);
    ctx.textAlign = 'left';
  }

  function drawGhosts() {
    if (!state.show.ghosts) return;
    for (var g = 0; g < ghosts.length; g++) {
      var gp = ghosts[g].pts;
      if (gp.length < 2) continue;
      ctx.save();
      ctx.lineWidth = 1.4; ctx.strokeStyle = ghosts[g].color; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.moveTo(sx(gp[0].x), sy(gp[0].y));
      for (var i = 1; i < gp.length; i++) ctx.lineTo(sx(gp[i].x), sy(gp[i].y));
      ctx.stroke(); ctx.restore();
    }
  }

  function drawOutcomeBanner(launched) {
    if (!path) return;
    var txt, col;
    if (path.status === 'escape') { txt = '→ ESCAPES gravity'; col = '#f5c842'; }
    else if (path.status === 'crash') {
      txt = (state.drag && analytic && analytic.kind === 'orbit') ? 'Orbit decays → RE-ENTRY' : 'Falls back → IMPACT';
      col = '#ff6b6b';
    } else { txt = analytic && analytic.e < 0.01 ? 'CIRCULAR ORBIT' : 'STABLE ELLIPTICAL ORBIT'; col = '#3ddc84'; }
    // Before launch, frame it as a prediction with a call to action.
    if (!launched) txt = 'Prediction: ' + txt + '  —  press Launch ▶';
    ctx.save();
    ctx.font = '700 14px "Segoe UI", sans-serif';
    var w = ctx.measureText(txt).width;
    ctx.fillStyle = 'rgba(13,17,30,0.82)';
    ctx.fillRect(view.cssW / 2 - w / 2 - 12, 10, w + 24, 26);
    ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(view.cssW / 2 - w / 2 - 12, 10, w + 24, 26);
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, view.cssW / 2, 24);
    ctx.restore();
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function draw() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    // space background
    var bg = ctx.createLinearGradient(0, 0, 0, view.cssH);
    bg.addColorStop(0, '#070912'); bg.addColorStop(1, '#0d1117');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, view.cssW, view.cssH);
    if (state.show.stars) {
      for (var i = 0; i < stars.length; i++) {
        ctx.globalAlpha = stars[i].a;
        ctx.fillStyle = '#cdd6ff';
        ctx.beginPath(); ctx.arc(stars[i].x, stars[i].y, stars[i].r, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    drawRings();
    drawPlanet();
    drawGhosts();
    // Idle (before launch): faint dashed PREDICTION only.
    // Launched: full bright solid trail (drawn once). The moving rocket is a
    // CSS-animated DOM overlay (see setupRocket) so it keeps moving even when
    // JS timers / requestAnimationFrame are throttled by a hidden/embedded view.
    var solidEnd = (launched && path) ? path.pts.length : 0;
    drawTrajectory(solidEnd);
    if (launched) drawMarkers();
    // launch pad marker
    if (path) {
      var l = path.pts[0];
      dot(sx(l.x), sy(l.y), 3, '#6c7bff');
    }
    drawOutcomeBanner(launched);
  }

  /* ══════════════════════════════════════════════════════════════
     ANIMATION
     ══════════════════════════════════════════════════════════════ */
  function launch() {
    var hint = $('canvas-hint'); if (hint) hint.classList.add('hidden');  // dismiss the tip on first launch
    if (!path) recompute();
    // save current path as a ghost trail
    if (state.show.ghosts && path && path.pts.length > 2) {
      var col = path.status === 'escape' ? 'rgba(245,200,66,0.7)' : path.status === 'crash' ? 'rgba(255,107,107,0.7)' : 'rgba(61,220,132,0.7)';
      ghosts.push({ pts: path.pts.map(function (p) { return { x: p.x, y: p.y }; }), color: col });
      if (ghosts.length > 4) ghosts.shift();
    }
    recompute();               // fresh path (also clears launched + hides rocket)
    launched = true;
    playLaunch();
    draw();                    // draw the full bright trajectory once
    setupRocket();             // start the CSS motion-path animation
  }

  /* Build an SVG-path string from the trajectory (in canvas CSS px) and hand it
     to the rocket overlay's CSS `offset-path`. A CSS @keyframes animation then
     moves the rocket along it — this runs on the compositor and keeps moving
     even when JS timers are throttled (hidden tab / embedded preview pane). */
  function setupRocket() {
    if (!rocketEl || !path || path.pts.length < 2) return;
    // Subsample to ≤600 segments: keeps the CSS offset-path string small
    // without visible loss (the motion is interpolated along line segments).
    var n = path.pts.length;
    var stride = Math.max(1, Math.ceil(n / 600));
    var d = 'M' + sx(path.pts[0].x).toFixed(1) + ' ' + sy(path.pts[0].y).toFixed(1);
    for (var i = stride; i < n - 1; i += stride) {
      d += ' L' + sx(path.pts[i].x).toFixed(1) + ' ' + sy(path.pts[i].y).toFixed(1);
    }
    d += ' L' + sx(path.pts[n - 1].x).toFixed(1) + ' ' + sy(path.pts[n - 1].y).toFixed(1);
    var loop = (path.status === 'orbit');
    var dur = loop ? 6 : 5;
    // restart the animation cleanly
    rocketEl.style.display = 'block';
    rocketEl.style.animation = 'none';
    rocketEl.style.offsetPath = 'path("' + d + '")';
    rocketEl.style.webkitOffsetPath = 'path("' + d + '")';
    /* force reflow so the animation restarts from 0% */
    void rocketEl.offsetWidth;
    rocketEl.style.animation = 'ev-fly ' + dur + 's linear ' + (loop ? 'infinite' : '1 forwards');
  }
  function hideRocket() {
    if (rocketEl) { rocketEl.style.animation = 'none'; rocketEl.style.display = 'none'; }
  }

  /* ══════════════════════════════════════════════════════════════
     RECOMPUTE — analytics, path, readouts, panels
     ══════════════════════════════════════════════════════════════ */
  function recompute() {
    analytic = computeAnalytic();
    path = integratePath();
    fitView();
    // A parameter changed → return to the prediction view and hide the rocket.
    launched = false;
    hideRocket();
    updateReadouts();
    updateGauge();
    updateLearnPanels();
    draw();
  }

  function fmt(x, d) { return (x == null || !isFinite(x)) ? '—' : x.toFixed(d == null ? 2 : d); }
  function kmMps(v) { return v / 1000; }               // m/s → km/s

  function fmtTime(s) {
    if (!isFinite(s)) return '—';
    if (s < 90) return s.toFixed(0) + ' s';
    if (s < 5400) return (s / 60).toFixed(1) + ' min';
    if (s < 172800) return (s / 3600).toFixed(2) + ' h';
    return (s / 86400).toFixed(2) + ' d';
  }

  function updateReadouts() {
    var a = analytic, b = B();
    $('r-speed').textContent = fmt(state.speed, 2);
    $('r-esc').textContent = fmt(kmMps(a.vEsc), 2);
    $('r-circ').textContent = fmt(kmMps(a.vCirc), 2);
    // escape-velocity badge beside the planet icon — surface value (the
    // canonical "escape velocity of this planet"); the readout card shows the
    // altitude-adjusted current value.
    var gv = $('gp-vesc-val');
    if (gv) gv.textContent = fmt(kmMps(vEsc(b.R)), 2);

    var oc = $('r-outcome');
    oc.classList.remove('warn', 'ok', 'gold');
    if (path.status === 'escape') { oc.textContent = 'Escape'; oc.classList.add('gold'); }
    else if (path.status === 'crash') {
      oc.textContent = (state.drag && a.kind === 'orbit') ? 'Re-entry' : 'Falls Back';
      oc.classList.add('warn');
    } else { oc.textContent = (a.e < 0.01 ? 'Circular Orbit' : 'Elliptical Orbit'); oc.classList.add('ok'); }

    // apogee altitude
    var apoEl = $('r-apo'), periEl = $('r-peri'), eccEl = $('r-ecc'), perEl = $('r-period');
    if (!a.bound) {
      apoEl.textContent = '∞'; a && (a.rApo = Infinity);
    } else {
      apoEl.textContent = fmtKm(a.rApo - b.R);
    }
    // perigee — follow the analytic classification so a grazing orbit
    // (perigee == launch radius, float-noise below R) reads 0.0, not "impact"
    if (a.kind === 'crash') periEl.textContent = 'impact';
    else periEl.textContent = fmtKm(Math.max(0, a.rPeri - b.R));
    eccEl.textContent = a.e >= 1 ? fmt(a.e, 3) : fmt(a.e, 3);
    perEl.textContent = a.bound && a.kind === 'orbit' ? fmtTime(a.period) : (a.bound ? '(suborbital)' : '—');
    // period readout unit handling: it's text, drop the km unit sibling — but there's no unit span. fine.
  }

  function fmtKm(m) {
    var km = m / 1000;
    if (Math.abs(km) >= 100000) return (km / 1000).toFixed(0) + '×10³';
    if (Math.abs(km) >= 1000) return km.toFixed(0);
    return km.toFixed(1);
  }

  function updateGauge() {
    var a = analytic;
    var maxV = 16; // km/s slider max
    var sp = state.speed;
    var pct = Math.min(100, sp / maxV * 100);
    var circPct = Math.min(100, kmMps(a.vCirc) / maxV * 100);
    var escPct = Math.min(100, kmMps(a.vEsc) / maxV * 100);
    var fill = $('sg-fill');
    fill.style.width = pct + '%';
    fill.classList.remove('orbit', 'escape');
    if (path.status === 'escape') fill.classList.add('escape');
    else if (path.status === 'orbit') fill.classList.add('orbit');
    $('sg-tick-circ').style.left = circPct + '%';
    $('sg-tick-esc').style.left = escPct + '%';
    $('sg-marker').style.left = pct + '%';
  }

  /* ── Learning panels ─────────────────────────────────────────── */
  var _cache = { eq: '', en: '', co: '' };
  function updateLearnPanels() {
    var a = analytic, b = B();
    var r = a.r0, mu = a.mu;
    // Live equations (KaTeX)
    var esc = '\\[ v_{esc}=\\sqrt{\\dfrac{2GM}{r}}=\\sqrt{\\dfrac{2(' + mu.toExponential(3) + ')}{' + r.toExponential(3) + '}}=' + fmt(kmMps(a.vEsc), 2) + '\\;\\text{km/s} \\]';
    var cir = '\\[ v_{circ}=\\sqrt{\\dfrac{GM}{r}}=' + fmt(kmMps(a.vCirc), 2) + '\\;\\text{km/s} \\]';
    var vv;
    if (a.bound && a.kind === 'orbit') {
      vv = '\\[ \\varepsilon=\\dfrac{v^2}{2}-\\dfrac{GM}{r}=' + a.eps.toExponential(3) + '\\;\\text{J/kg},\\quad a=-\\dfrac{GM}{2\\varepsilon}=' + fmtKm(a.a) + '\\times10^3\\,\\text{m} \\]';
    } else {
      vv = '\\[ \\varepsilon=\\dfrac{v^2}{2}-\\dfrac{GM}{r}=' + a.eps.toExponential(3) + '\\;\\text{J/kg}\\;' + (a.eps >= 0 ? '\\ge 0\\Rightarrow\\text{escape}' : '<0') + ' \\]';
    }
    var eqHtml = '<div class="eq-line"><div class="eq-label">Escape velocity at launch radius r = R + altitude</div>' + esc + '</div>' +
                 '<div class="eq-line"><div class="eq-label">Circular orbital velocity at r</div>' + cir + '</div>' +
                 '<div class="eq-line"><div class="eq-label">Specific orbital energy &amp; semi-major axis</div>' + vv + '</div>';
    if (eqHtml !== _cache.eq) { $('lp-eq-body').innerHTML = eqHtml; _cache.eq = eqHtml; }

    // Energy budget bars (per kg)
    var v = a.v;
    var KE = 0.5 * v * v;               // J/kg
    var PEmag = mu / r;                 // |U|/m = GM/r  (binding energy magnitude per kg)
    var maxE = Math.max(KE, PEmag);
    var keW = maxE > 0 ? (KE / maxE * 100) : 0;
    var peW = maxE > 0 ? (PEmag / maxE * 100) : 0;
    var ratio = KE / PEmag;
    var enHtml =
      '<div class="energy-bars">' +
      '<div class="energy-bar-row"><span class="energy-bar-label">Kinetic ½v²</span>' +
        '<span class="energy-bar-track"><span class="energy-bar-fill" style="width:' + keW.toFixed(0) + '%;background:#6c7bff"></span></span>' +
        '<span class="energy-bar-val">' + KE.toExponential(2) + '</span></div>' +
      '<div class="energy-bar-row"><span class="energy-bar-label">Binding GM/r</span>' +
        '<span class="energy-bar-track"><span class="energy-bar-fill" style="width:' + peW.toFixed(0) + '%;background:#f5c842"></span></span>' +
        '<span class="energy-bar-val">' + PEmag.toExponential(2) + '</span></div>' +
      '</div>' +
      '<div class="coach-tip">To escape, kinetic energy must reach the binding energy GM/r. ' +
      'Here KE/binding = <strong>' + ratio.toFixed(3) + '</strong> ' +
      (ratio >= 1 ? '≥ 1 → the rocket escapes.' : '&lt; 1 → it stays bound (need ratio ≥ 1, i.e. v ≥ v_esc).') + '</div>';
    if (enHtml !== _cache.en) { $('lp-energy-body').innerHTML = enHtml; _cache.en = enHtml; }

    // Coach
    var tips = [];
    var vc = kmMps(a.vCirc), ve = kmMps(a.vEsc);
    if (path.status === 'escape') {
      tips.push('<div class="coach-tip">At <strong>' + fmt(state.speed, 2) + ' km/s</strong> you are at or above escape velocity (' + fmt(ve, 2) + ' km/s), so the path is ' + (Math.abs(state.speed - ve) < 0.05 ? 'a <strong>parabola</strong>' : 'a <strong>hyperbola</strong>') + ' — the rocket never returns.</div>');
    } else if (path.status === 'orbit') {
      tips.push('<div class="coach-tip">Your speed sits between circular (' + fmt(vc, 2) + ') and escape (' + fmt(ve, 2) + ' km/s), giving a <strong>' + (a.e < 0.01 ? 'circular' : 'stable elliptical') + '</strong> orbit with eccentricity ' + fmt(a.e, 3) + '.</div>');
    } else {
      if (state.angle > 60) tips.push('<div class="coach-tip">A near-vertical launch has almost no sideways speed, so the rocket rises to <strong>' + fmtKm(a.rApo - b.R) + ' km</strong> altitude then falls straight back.</div>');
      else tips.push('<div class="coach-tip">Below circular speed the launch point becomes the orbit’s <strong>apogee</strong>; its perigee lies inside the planet, so the rocket <strong>falls back</strong> to the surface.</div>');
    }
    if (state.alt > 0) tips.push('<div class="coach-tip">Launching from <strong>' + state.alt + ' km</strong> altitude lowers escape velocity to <strong>' + fmt(ve, 2) + ' km/s</strong> (it is easier to escape from higher up).</div>');
    if (state.drag && b.atmo) tips.push('<div class="coach-tip">Atmospheric drag is <strong>on</strong>: each pass through the atmosphere robs energy, so even a fast launch loses speed and can spiral in.</div>');
    if (state.drag && !b.atmo) tips.push('<div class="coach-tip">The ' + b.name + ' has essentially <strong>no atmosphere</strong>, so the drag toggle has no effect here.</div>');
    var coHtml = tips.join('');
    if (coHtml !== _cache.co) { $('lp-coach-body').innerHTML = coHtml; _cache.co = coHtml; }
  }

  /* ══════════════════════════════════════════════════════════════
     CONTROLS WIRING
     ══════════════════════════════════════════════════════════════ */
  function clampSpeed(v) { return Math.max(0.5, Math.min(16, v)); }
  function clampAngle(v) { return Math.max(0, Math.min(90, v)); }
  function clampAlt(v) { return Math.max(0, Math.min(2000, v)); }

  function syncInputs() {
    $('speed-slider').value = state.speed;
    $('speed-input').value = state.speed;
    $('angle-slider').value = state.angle;
    $('angle-input').value = state.angle;
    $('alt-slider').value = state.alt;
    $('alt-input').value = state.alt;
  }

  // A cleared/garbage number input parses to NaN — restore the previous value
  // instead of poisoning the state (NaN would corrupt every readout and the path).
  function setSpeed(v) { if (!isFinite(v)) { syncInputs(); return; } state.speed = Math.round(clampSpeed(v) * 100) / 100; syncInputs(); recompute(); }
  function setAngle(v) { if (!isFinite(v)) { syncInputs(); return; } state.angle = Math.round(clampAngle(v)); syncInputs(); recompute(); }
  function setAlt(v) { if (!isFinite(v)) { syncInputs(); return; } state.alt = Math.round(clampAlt(v)); syncInputs(); recompute(); }

  on($('speed-slider'), 'input', function () { setSpeed(parseFloat(this.value)); });
  on($('speed-input'), 'change', function () { setSpeed(parseFloat(this.value)); });
  on($('angle-slider'), 'input', function () { setAngle(parseFloat(this.value)); });
  on($('angle-input'), 'change', function () { setAngle(parseFloat(this.value)); });
  on($('alt-slider'), 'input', function () { setAlt(parseFloat(this.value)); });
  on($('alt-input'), 'change', function () { setAlt(parseFloat(this.value)); });

  var stepEls = document.querySelectorAll('.step-btn');
  for (var si = 0; si < stepEls.length; si++) {
    stepEls[si].addEventListener('click', function () {
      var k = this.getAttribute('data-step'), d = parseInt(this.getAttribute('data-dir'), 10);
      playClick();
      if (k === 'speed') setSpeed(state.speed + d * 0.1);
      else if (k === 'angle') setAngle(state.angle + d);
      else if (k === 'alt') setAlt(state.alt + d * 10);
    });
  }

  // set the active body (used by body tabs + presets)
  var bodyTabs = $('body-tabs');
  function setBody(name) {
    state.body = name;
    var pills = bodyTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.toggle('active', pills[i].getAttribute('data-body') === name);
    var gp = $('gravity-planet');
    gp.className = 'gravity-planet ' + B().gp + ' gp-notice';
    gp.title = B().name + ' selected';
    setTimeout(function () { gp.classList.remove('gp-notice'); }, 900);
    updateDragToggle();
  }

  // The Moon has no atmosphere, so drag can't apply — disable the toggle there.
  // Mars keeps drag (its thin atmosphere is far weaker than Earth's).
  function updateDragToggle() {
    var b = B(), lbl = $('drag-toggle'), chk = $('chk-drag');
    if (!b.atmo) {
      if (state.drag) { state.drag = false; }
      chk.checked = false; chk.disabled = true;
      lbl.classList.remove('checked'); lbl.classList.add('disabled');
      lbl.title = 'The ' + b.name + ' has no atmosphere — drag does not apply';
    } else {
      chk.disabled = false; lbl.classList.remove('disabled');
      lbl.title = (b.name === 'Mars')
        ? 'Thin Martian atmosphere (~1% of Earth’s) — drag is much weaker'
        : 'Toggle atmospheric drag (Earth sea-level density)';
    }
  }
  on(bodyTabs, 'click', function (e) {
    var btn = e.target.closest('.pill'); if (!btn) return;
    setBody(btn.getAttribute('data-body'));
    playClick(); ghosts = []; recompute();
  });

  // presets — each is a labelled scenario (body, altitude, angle, speed factor)
  //   k: 'vc' → factor × circular speed, 've' → factor × escape speed (at r0)
  var PRESETS = {
    ballistic:  { body: 'earth', alt: 0,    angle: 45, k: 'vc', mul: 0.92 },
    circular:   { body: 'earth', alt: 0,    angle: 0,  k: 'vc', mul: 1.00 },
    elliptical: { body: 'earth', alt: 400,  angle: 0,  k: 'vc', mul: 1.18 },
    polar:      { body: 'earth', alt: 1000, angle: 15, k: 'vc', mul: 1.25 },
    transfer:   { body: 'earth', alt: 400,  angle: 0,  k: 'vc', mul: 1.34 },
    escape:     { body: 'earth', alt: 0,    angle: 0,  k: 've', mul: 1.00 },
    hyper:      { body: 'earth', alt: 0,    angle: 0,  k: 've', mul: 1.30 },
    straightup: { body: 'earth', alt: 0,    angle: 90, k: 've', mul: 0.72 },
    moon:       { body: 'moon',  alt: 0,    angle: 0,  k: 've', mul: 1.06 },
    mars:       { body: 'mars',  alt: 0,    angle: 0,  k: 'vc', mul: 1.00 }
  };
  function applyPreset(key, autoLaunch) {
    var P = PRESETS[key]; if (!P) return;
    var pills = $('preset-btns').querySelectorAll('.preset-btn');
    for (var i = 0; i < pills.length; i++) pills[i].classList.toggle('active', pills[i].getAttribute('data-preset') === key);
    if (P.body !== state.body) { setBody(P.body); ghosts = []; }
    state.alt = P.alt; state.angle = P.angle;
    var base = P.k === 've' ? vEsc(r0()) : vCirc(r0());
    state.speed = clampSpeed(Math.round(kmMps(base * P.mul) * 100) / 100);
    syncInputs(); recompute();
    if (autoLaunch) setTimeout(launch, 60);
  }
  on($('preset-btns'), 'click', function (e) {
    var btn = e.target.closest('.preset-btn'); if (!btn) return;
    if (!PRESETS[btn.getAttribute('data-preset')]) return;
    playClick();
    applyPreset(btn.getAttribute('data-preset'), true);
  });

  // toolbar
  on($('btn-fire'), 'click', function () { launch(); });
  on($('chk-drag'), 'change', function () {
    state.drag = this.checked;
    $('drag-toggle').classList.toggle('checked', this.checked);
    ghosts = []; recompute();
  });
  on($('btn-clear'), 'click', function () { ghosts = []; draw(); });
  on($('btn-reset'), 'click', function () { resetAll(); });
  on($('btn-csv'), 'click', exportCSV);
  on($('btn-png'), 'click', exportPNG);
  on($('btn-calc'), 'click', openCalcModal);

  // display toggles
  on($('chk-stars'), 'change', function () { state.show.stars = this.checked; draw(); });
  on($('chk-markers'), 'change', function () { state.show.markers = this.checked; draw(); });
  on($('chk-ghosts'), 'change', function () { state.show.ghosts = this.checked; draw(); });
  on($('chk-rings'), 'change', function () { state.show.rings = this.checked; draw(); });

  // hint
  on($('hint-close'), 'click', function () { $('canvas-hint').classList.add('hidden'); });

  function resetAll() {
    state.body = 'earth'; state.speed = 7.91; state.angle = 0; state.alt = 0; state.drag = false;
    $('chk-drag').checked = false; $('drag-toggle').classList.remove('checked');
    var pills = bodyTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.toggle('active', pills[i].getAttribute('data-body') === 'earth');
    $('gravity-planet').className = 'gravity-planet gp-earth';
    var pb = $('preset-btns').querySelectorAll('.preset-btn');
    for (var j = 0; j < pb.length; j++) pb[j].classList.remove('active');
    updateDragToggle();
    ghosts = []; syncInputs(); recompute();
    playClick();
  }

  /* ── keyboard ───────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (state.mode !== 'simulate') return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); launch(); }
    else if (e.key === 'r' || e.key === 'R') { resetAll(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSpeed(state.speed + 0.1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSpeed(state.speed - 0.1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); setAngle(state.angle + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setAngle(state.angle - 1); }
  });

  /* ── canvas: click to (re)launch ────────────────────────────── */
  // (Drag-to-aim was removed — set speed/angle with the sliders, then Launch.)
  // Any click re-fires immediately, even mid-flight; launch() resets the run.
  on(canvas, 'click', function () {
    if (state.mode === 'simulate') launch();
  });

  /* ── context menu ───────────────────────────────────────────── */
  var ctxMenu = $('ctx-menu');
  on(canvas, 'contextmenu', function (e) {
    e.preventDefault();
    ctxMenu.classList.add('active');
    ctxMenu.style.left = e.clientX + 'px';
    ctxMenu.style.top = e.clientY + 'px';
  });
  document.addEventListener('click', function () { ctxMenu.classList.remove('active'); });
  on(ctxMenu, 'click', function (e) {
    var b = e.target.closest('.ctx-item'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'launch') launch();
    else if (act === 'csv') exportCSV();
    else if (act === 'png') exportPNG();
    else if (act === 'reset') resetAll();
  });

  /* ══════════════════════════════════════════════════════════════
     EXPORT
     ══════════════════════════════════════════════════════════════ */
  function exportCSV() {
    if (!path) return;
    var rows = ['t_s,x_m,y_m,altitude_km,speed_km_s'];
    for (var i = 0; i < path.pts.length; i++) {
      var p = path.pts[i];
      rows.push(p.t.toFixed(1) + ',' + p.x.toFixed(0) + ',' + p.y.toFixed(0) + ',' +
                ((p.r - B().R) / 1000).toFixed(2) + ',' + (p.v / 1000).toFixed(4));
    }
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'escape_velocity_' + state.body + '_' + state.speed + 'kms.csv';
    a.click();
    playClick();
  }

  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(canvas, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 12) fs = 12;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 14, tmp.height - 10);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'escape_velocity_' + state.body + '.png';
    a.click();
    playClick();
  }

  /* ══════════════════════════════════════════════════════════════
     CALCULATIONS MODAL
     ══════════════════════════════════════════════════════════════ */
  function openCalcModal() {
    var a = analytic, b = B();
    var r = a.r0, mu = b.mu;
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Given</span><div class="cs-given">' +
      '<span>Body = ' + b.name + '</span><span>M = ' + b.M + '</span><span>R = ' + (b.R / 1000).toFixed(0) + ' km</span>' +
      '<span>altitude = ' + state.alt + ' km</span><span>r = R + h = ' + (r / 1000).toFixed(0) + ' km</span>' +
      '<span>v = ' + state.speed + ' km/s</span><span>angle = ' + state.angle + '°</span></div>' +
      '<p class="cs-si-note">GM (μ) = ' + mu.toExponential(4) + ' m³/s². All steps in SI, then converted to km/s.</p></div>';

    html += step('1', 'Escape velocity', '\\[ v_{esc}=\\sqrt{\\dfrac{2GM}{r}} \\]',
      '= √(2 × ' + mu.toExponential(3) + ' / ' + r.toExponential(3) + ')',
      fmt(kmMps(a.vEsc), 3) + ' km/s');

    html += step('2', 'Circular orbital velocity', '\\[ v_{circ}=\\sqrt{\\dfrac{GM}{r}}=\\dfrac{v_{esc}}{\\sqrt2} \\]',
      '= √(' + mu.toExponential(3) + ' / ' + r.toExponential(3) + ')',
      fmt(kmMps(a.vCirc), 3) + ' km/s');

    html += step('3', 'Specific orbital energy', '\\[ \\varepsilon=\\dfrac{v^2}{2}-\\dfrac{GM}{r} \\]',
      '= (' + a.v.toExponential(3) + ')² / 2 − ' + mu.toExponential(3) + ' / ' + r.toExponential(3),
      a.eps.toExponential(3) + ' J/kg  ' + (a.eps >= 0 ? '(≥ 0 → escape)' : '(< 0 → bound)'));

    if (a.bound) {
      html += step('4', 'Semi-major axis & shape', '\\[ a=-\\dfrac{GM}{2\\varepsilon},\\quad e=\\sqrt{1+\\dfrac{2\\varepsilon h^2}{(GM)^2}} \\]',
        'h = r·v·cosθ = ' + a.h.toExponential(3) + ' m²/s',
        'a = ' + (a.a / 1000).toFixed(0) + ' km,  e = ' + fmt(a.e, 3));
      var apo = a.kind === 'orbit' ? (a.rApo - b.R) / 1000 : (a.rApo - b.R) / 1000;
      html += step('5', 'Apogee / perigee altitude', '\\[ r_{apo}=a(1+e),\\; r_{peri}=a(1-e) \\]',
        'apo alt = ' + apo.toFixed(0) + ' km,  peri alt = ' + ((a.rPeri - b.R) / 1000).toFixed(0) + ' km',
        a.rPeri < b.R ? 'perigee is below the surface → falls back' : 'stable orbit');
      if (a.kind === 'orbit')
        html += step('6', 'Orbital period', '\\[ T=2\\pi\\sqrt{\\dfrac{a^3}{GM}} \\]',
          '= 2π √(' + (a.a).toExponential(3) + '³ / ' + mu.toExponential(3) + ')',
          fmtTime(a.period));
    } else {
      html += step('4', 'Eccentricity', '\\[ e=\\sqrt{1+\\dfrac{2\\varepsilon h^2}{(GM)^2}}\\ge 1 \\]',
        'h = r·v·cosθ = ' + a.h.toExponential(3),
        'e = ' + fmt(a.e, 3) + (Math.abs(a.e - 1) < 0.01 ? ' (parabola)' : ' (hyperbola)'));
    }
    var verdict = path.status === 'escape' ? 'The rocket has enough energy to escape — it never returns.' :
                  path.status === 'crash' ? 'The trajectory dips below the surface — the rocket falls back.' :
                  'A stable orbit — the rocket circles the ' + b.name + '.';
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Result</span><span class="cs-title">Outcome</span></div><div class="cs-result">' + verdict + '</div></div>';

    $('calc-modal-body').innerHTML = html;
    $('calc-modal').classList.add('active');
  }
  function step(n, title, formula, calc, result) {
    return '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + n + '</span><span class="cs-title">' + title + '</span></div>' +
      '<div class="cs-formula">' + formula + '</div>' +
      '<div class="cs-calc">' + calc + '</div>' +
      '<div class="cs-result"><strong>' + result + '</strong></div></div>';
  }
  on($('calc-modal-close'), 'click', function () { $('calc-modal').classList.remove('active'); });
  on($('calc-modal'), 'click', function (e) { if (e.target === this) this.classList.remove('active'); });

  /* ── learn expand/collapse ──────────────────────────────────── */
  on($('learn-expand-all'), 'click', function () {
    document.querySelectorAll('.learn-card').forEach(function (c) { c.open = true; });
  });
  on($('learn-collapse-all'), 'click', function () {
    document.querySelectorAll('.learn-card').forEach(function (c) { c.open = false; });
  });

  /* ══════════════════════════════════════════════════════════════
     AUDIO
     ══════════════════════════════════════════════════════════════ */
  function actx() {
    if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    return state.audioCtx;
  }
  function tone(freq, dur, type, vol) {
    var c = actx(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.value = vol || 0.05; o.connect(g); g.connect(c.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  }
  function playClick() { tone(760, 0.05, 'square', 0.03); }
  function playLaunch() { tone(180, 0.5, 'sawtooth', 0.05); setTimeout(function () { tone(120, 0.4, 'sawtooth', 0.04); }, 100); }
  function playSuccess() { tone(660, 0.12, 'sine', 0.06); setTimeout(function () { tone(990, 0.16, 'sine', 0.06); }, 120); }
  function playEscape() { tone(520, 0.15, 'sine', 0.05); setTimeout(function () { tone(780, 0.15, 'sine', 0.05); }, 130); setTimeout(function () { tone(1040, 0.2, 'sine', 0.05); }, 260); }
  function playImpact() { tone(90, 0.35, 'triangle', 0.08); }

  /* ══════════════════════════════════════════════════════════════
     MODE SWITCHING
     ══════════════════════════════════════════════════════════════ */
  var SIM_ELS = ['sim-panel', 'learn-panels'];
  var EXPLORE_ELS = ['cat-row', 'item-selector', 'item-info'];
  var PRACTICE_ELS = ['practice-panel', 'practice-bar'];
  var QUIZ_ELS = ['quiz-panel', 'quiz-bar', 'quiz-result'];

  function showEls(ids, show) { ids.forEach(function (id) { var e = $(id); if (e) e.style.display = show ? '' : 'none'; }); }

  on($('mode-tabs'), 'click', function (e) {
    var btn = e.target.closest('.pill'); if (!btn) return;
    var pills = this.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    btn.classList.add('active');
    state.mode = btn.getAttribute('data-mode');
    playClick();
    applyMode();
  });

  function applyMode() {
    var m = state.mode;
    // stop any running orbit animation when leaving Simulate
    if (m !== 'simulate') { launched = false; hideRocket(); }
    // canvas + toolbar visible only in simulate
    document.querySelector('.canvas-card').style.display = m === 'simulate' ? '' : 'none';
    showEls(SIM_ELS, m === 'simulate');
    showEls(EXPLORE_ELS, m === 'explore');
    showEls(PRACTICE_ELS, m === 'practice');
    // quiz handled separately
    if (m === 'explore') buildExplore();
    if (m === 'practice') { $('practice-panel').style.display = ''; $('practice-bar').style.display = ''; newPractice(); }
    if (m === 'quiz') { startQuiz(); } else { showEls(QUIZ_ELS, false); }
  }

  /* ══════════════════════════════════════════════════════════════
     EXPLORE
     ══════════════════════════════════════════════════════════════ */
  var EXPLORE = {
    basics: [
      { name: 'Escape Velocity', sym: 'v_esc', desc: 'Escape velocity is the minimum speed needed to break free of a body’s gravity with no further propulsion. It comes from setting kinetic energy equal to the gravitational binding energy.', formula: 'v_esc = √(2GM/R)', unit: 'm/s',
        ex: ['Earth: GM = 3.986×10¹⁴, R = 6.371×10⁶ m', 'v_esc = √(2×3.986e14 / 6.371e6)', '= 11,187 m/s ≈ 11.2 km/s'] },
      { name: 'Newton’s Cannonball', sym: '—', desc: 'Newton imagined firing a cannon horizontally from a mountain above the air. Slow shots fall back; at ~7.9 km/s the ball orbits; at 11.2 km/s it escapes. Orbiting is falling while moving sideways fast enough to keep missing the ground.', formula: 'v_circ = √(GM/R)', unit: 'm/s',
        ex: ['At circular speed the ground curves away as fast as the ball falls', 'so the ball never lands — it is in orbit'] },
      { name: 'Why mass cancels', sym: 'm', desc: 'Both kinetic energy (½mv²) and gravitational potential energy (GMm/R) contain the object’s mass m. Setting them equal cancels m, so escape velocity is the same for a pebble or a spaceship.', formula: '½mv² = GMm/R ⇒ v = √(2GM/R)', unit: '',
        ex: ['Mass only changes the fuel needed', 'not the escape speed itself'] },
      { name: 'Orbit vs Escape', sym: '√2', desc: 'Escape velocity is exactly √2 (about 1.414) times the circular orbital velocity at the same radius. Reach v_circ and you orbit; reach v_esc and you leave.', formula: 'v_esc / v_circ = √2', unit: '',
        ex: ['Earth v_circ = 7.91 km/s', 'v_esc = 7.91 × 1.414 = 11.19 km/s'] }
    ],
    formulas: [
      { name: 'Vis-Viva Equation', sym: 'v', desc: 'The vis-viva equation gives the speed at any radius r in an orbit of semi-major axis a. It is the master equation of orbital mechanics.', formula: 'v² = GM(2/r − 1/a)', unit: 'm²/s²',
        ex: ['Circular orbit (r = a): v² = GM/r', 'Escape (a → ∞): v² = 2GM/r'] },
      { name: 'Specific Orbital Energy', sym: 'ε', desc: 'The total energy per kilogram of an orbit. Negative means bound (orbit or fall-back); zero means parabolic escape; positive means hyperbolic escape.', formula: 'ε = v²/2 − GM/r', unit: 'J/kg',
        ex: ['ε < 0 → ellipse', 'ε = 0 → parabola (escape)', 'ε > 0 → hyperbola'] },
      { name: 'Orbital Period', sym: 'T', desc: 'Kepler’s third law: the period of a closed orbit depends only on the semi-major axis and the central mass.', formula: 'T = 2π√(a³/GM)', unit: 's',
        ex: ['Low Earth orbit a ≈ 6,771 km', 'T ≈ 2π√(6.771e6³/3.986e14) ≈ 92 min'] },
      { name: 'Gravitational PE', sym: 'U', desc: 'Gravitational potential energy is negative and approaches zero at infinity. Its magnitude at radius r is the binding energy an object must overcome to escape.', formula: 'U = −GMm/r', unit: 'J',
        ex: ['At the surface U is most negative', 'Escape needs KE ≥ |U|'] }
    ],
    bodies: [
      { name: 'Earth', sym: '11.2 km/s', desc: 'Earth’s surface escape velocity is 11.2 km/s — about 33 times the speed of sound. Reaching orbit is a matter of speed, not altitude.', formula: 'v_esc = √(2GM/R)', unit: '',
        ex: ['M = 5.97×10²⁴ kg, R = 6,371 km', 'v_esc = 11.19 km/s, v_circ = 7.91 km/s'] },
      { name: 'The Moon', sym: '2.38 km/s', desc: 'The Moon’s low mass gives an escape velocity of just 2.38 km/s — which is why the Apollo lunar module could leave with a small ascent engine.', formula: 'v_esc = √(2GM/R)', unit: '',
        ex: ['M = 7.34×10²² kg, R = 1,737 km', 'v_esc = 2.38 km/s, v_circ = 1.68 km/s'] },
      { name: 'Mars', sym: '5.03 km/s', desc: 'Mars sits between Earth and the Moon: escape velocity 5.03 km/s. Its thin atmosphere provides some drag but far less than Earth’s.', formula: 'v_esc = √(2GM/R)', unit: '',
        ex: ['M = 6.42×10²³ kg, R = 3,390 km', 'v_esc = 5.03 km/s, v_circ = 3.55 km/s'] },
      { name: 'The Sun & Black Holes', sym: 'c', desc: 'The Sun’s surface escape velocity is 618 km/s. For a black hole the escape velocity at the event horizon equals the speed of light c — which is why not even light escapes.', formula: 'R_s = 2GM/c²', unit: '',
        ex: ['Set v_esc = c in √(2GM/R)', 'gives the Schwarzschild radius R_s = 2GM/c²'] }
    ],
    applications: [
      { name: 'Rocket Equation', sym: 'Δv', desc: 'Tsiolkovsky’s rocket equation sets how much propellant is needed to reach orbital or escape speed. It is why launch vehicles are almost entirely fuel.', formula: 'Δv = v_e · ln(m₀/m_f)', unit: 'm/s',
        ex: ['To gain 9.4 km/s to LEO with v_e = 4.5 km/s', 'm₀/m_f = e^(9.4/4.5) ≈ 8 → mostly fuel'] },
      { name: 'Satellite Orbits', sym: 'v_circ', desc: 'Satellites are placed at circular velocity for their altitude. Higher orbits are slower; geostationary satellites orbit once per day at 35,786 km.', formula: 'v_circ = √(GM/r)', unit: 'm/s',
        ex: ['LEO (400 km): v ≈ 7.67 km/s', 'GEO (35,786 km): v ≈ 3.07 km/s'] },
      { name: 'Atmospheric Retention', sym: 'v_th', desc: 'A planet keeps a gas only if the molecules’ thermal speed stays well below escape velocity. This is why the Moon has no air and Jupiter retains hydrogen.', formula: 'v_th = √(3kT/m)', unit: 'm/s',
        ex: ['If v_th approaches v_esc/6', 'the gas leaks away over geological time'] },
      { name: 'Re-entry & Aerobraking', sym: 'F_d', desc: 'Spacecraft use atmospheric drag to shed orbital energy without fuel. The drag toggle in this simulator models the same exponential-density physics.', formula: 'F_d = ½·ρ·v²·C_d·A', unit: 'N',
        ex: ['ρ falls exponentially with altitude', 'each perigee pass lowers the orbit'] }
    ]
  };
  var exploreCat = 'basics', exploreIdx = 0;

  on($('cat-tabs'), 'click', function (e) {
    var btn = e.target.closest('.pill'); if (!btn) return;
    var pills = this.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    btn.classList.add('active');
    exploreCat = btn.getAttribute('data-cat'); exploreIdx = 0;
    playClick(); buildExplore();
  });

  function buildExplore() {
    var list = EXPLORE[exploreCat];
    var grid = $('concept-grid'); grid.innerHTML = '';
    list.forEach(function (item, i) {
      var b = document.createElement('button');
      b.className = 'is-btn' + (i === exploreIdx ? ' active' : '');
      b.innerHTML = '<span class="is-btn-name">' + item.name + '</span><span class="is-btn-sym">' + item.sym + '</span>';
      b.addEventListener('click', function () { exploreIdx = i; playClick(); buildExplore(); });
      grid.appendChild(b);
    });
    var it = list[exploreIdx];
    var exHtml = it.ex.map(function (s) { return '<div class="ex-step">' + s + '</div>'; }).join('');
    $('item-info').innerHTML =
      '<div class="ii-top"><span class="ii-name">' + it.name + '</span><span class="ii-cat-badge">' + exploreCat + '</span></div>' +
      '<div class="ii-desc">' + it.desc + '</div>' +
      '<div class="formula-box"><span class="fb-formula">' + it.formula + '</span>' + (it.unit ? '<span class="fb-unit">[' + it.unit + ']</span>' : '') + '</div>' +
      '<div class="example-box"><h4>Worked Example</h4>' + exHtml + '</div>';
  }

  /* ══════════════════════════════════════════════════════════════
     PRACTICE
     ══════════════════════════════════════════════════════════════ */
  var pp = { answer: 0, tol: 0, unit: '', solved: false, score: 0, total: 0 };
  var PBODIES = [
    { n: 'Earth', mu: 3.986004418e14, R: 6.371e6 },
    { n: 'the Moon', mu: 4.9048695e12, R: 1.7374e6 },
    { n: 'Mars', mu: 4.282837e13, R: 3.3895e6 },
    { n: 'Jupiter', mu: 1.26686534e17, R: 6.9911e7 },
    { n: 'Venus', mu: 3.24859e14, R: 6.0518e6 }
  ];
  function pick(arr) { return arr[Math.floor(seededRand() * arr.length)]; }
  // simple LCG so we avoid Math.random (kept deterministic-ish per session but varied)
  var _pseed = 987654321;
  function seededRand() { _pseed = (_pseed * 1103515245 + 12345) & 0x7fffffff; return _pseed / 0x7fffffff; }

  function newPractice() {
    pp.solved = false;
    $('pp-feedback').textContent = ''; $('pp-feedback').className = 'feedback';
    $('pp-solution').style.display = 'none';
    $('pp-input').value = ''; $('pp-input').disabled = false;
    $('pp-check').style.display = ''; $('pp-next').style.display = 'none';

    var type = Math.floor(seededRand() * 4);
    var body = pick(PBODIES);
    var mu = body.mu, R = body.R;
    if (type === 0) {
      // escape velocity given mu, R
      var ve = Math.sqrt(2 * mu / R) / 1000;
      pp.answer = ve; pp.tol = ve * 0.02; pp.unit = 'km/s';
      $('pp-prompt').innerHTML = 'A body has GM = <strong>' + mu.toExponential(3) + '</strong> m³/s² and radius <strong>' + (R / 1000).toFixed(0) + ' km</strong>. Find its <strong>escape velocity</strong> (km/s).';
      pp.sol = ['v_esc = √(2GM/R)', '= √(2×' + mu.toExponential(3) + ' / ' + R.toExponential(3) + ')', '= <strong>' + ve.toFixed(2) + ' km/s</strong>'];
    } else if (type === 1) {
      var vc = Math.sqrt(mu / R) / 1000;
      pp.answer = vc; pp.tol = vc * 0.02; pp.unit = 'km/s';
      $('pp-prompt').innerHTML = 'For ' + body.n + ' (GM = <strong>' + mu.toExponential(3) + '</strong> m³/s², R = <strong>' + (R / 1000).toFixed(0) + ' km</strong>), find the <strong>circular orbital velocity</strong> at the surface (km/s).';
      pp.sol = ['v_circ = √(GM/R)', '= √(' + mu.toExponential(3) + ' / ' + R.toExponential(3) + ')', '= <strong>' + vc.toFixed(2) + ' km/s</strong>'];
    } else if (type === 2) {
      var vcirc = Math.sqrt(mu / R) / 1000;
      var ve2 = vcirc * Math.SQRT2;
      pp.answer = ve2; pp.tol = ve2 * 0.02; pp.unit = 'km/s';
      $('pp-prompt').innerHTML = 'A satellite orbits ' + body.n + ' at <strong>' + vcirc.toFixed(2) + ' km/s</strong> (circular). What speed would it need to <strong>escape</strong> from that same radius?';
      pp.sol = ['v_esc = √2 × v_circ', '= 1.414 × ' + vcirc.toFixed(2), '= <strong>' + ve2.toFixed(2) + ' km/s</strong>'];
    } else {
      // altitude escape velocity
      var h = (Math.floor(seededRand() * 20) + 1) * 100; // km
      var r = R + h * 1000;
      var veh = Math.sqrt(2 * mu / r) / 1000;
      pp.answer = veh; pp.tol = veh * 0.02; pp.unit = 'km/s';
      $('pp-prompt').innerHTML = 'Find the escape velocity from an altitude of <strong>' + h + ' km</strong> above ' + body.n + ' (GM = <strong>' + mu.toExponential(3) + '</strong>, R = <strong>' + (R / 1000).toFixed(0) + ' km</strong>).';
      pp.sol = ['r = R + h = ' + (r / 1000).toFixed(0) + ' km = ' + r.toExponential(3) + ' m', 'v_esc = √(2GM/r)', '= <strong>' + veh.toFixed(2) + ' km/s</strong>'];
    }
    $('pp-unit').textContent = pp.unit;
  }

  on($('pp-check'), 'click', function () {
    if (pp.solved) return;
    var val = parseFloat($('pp-input').value);
    if (isNaN(val)) { $('pp-feedback').textContent = 'Enter a number.'; $('pp-feedback').className = 'feedback err'; return; }
    pp.total++;
    var ok = Math.abs(val - pp.answer) <= pp.tol;
    if (ok) { pp.score++; $('pp-feedback').textContent = '✓ Correct!'; $('pp-feedback').className = 'feedback ok'; playSuccess(); }
    else { $('pp-feedback').textContent = '✗ Not quite — answer: ' + pp.answer.toFixed(2) + ' ' + pp.unit; $('pp-feedback').className = 'feedback err'; playImpact(); }
    var sol = '<h4>Solution</h4>' + pp.sol.map(function (s) { return '<div class="sol-step">' + s + '</div>'; }).join('');
    $('pp-solution').innerHTML = sol; $('pp-solution').style.display = '';
    $('pbar-score-val').textContent = pp.score + ' / ' + pp.total;
    pp.solved = true; $('pp-check').style.display = 'none'; $('pp-next').style.display = ''; $('pp-input').disabled = true;
  });
  on($('pp-next'), 'click', function () { playClick(); newPractice(); });
  on($('pp-input'), 'keydown', function (e) { if (e.key === 'Enter') { if (pp.solved) newPractice(); else $('pp-check').click(); } });

  /* ══════════════════════════════════════════════════════════════
     QUIZ
     ══════════════════════════════════════════════════════════════ */
  var QUIZ_BANK = [
    { q: 'What is Earth’s approximate escape velocity from the surface?', a: ['11.2 km/s', '7.9 km/s', '9.8 km/s', '25 km/s'], c: 0 },
    { q: 'Escape velocity is ___ times the circular orbital velocity at the same radius.', a: ['√2 (≈1.41)', '2', 'π', '1'], c: 0 },
    { q: 'How does escape velocity depend on the mass of the escaping object?', a: ['It does not — mass cancels', 'Directly proportional', 'Inversely proportional', 'Proportional to √m'], c: 0 },
    { q: 'In Newton’s cannonball, firing at exactly circular speed produces a...', a: ['Stable circular orbit', 'Immediate crash', 'Parabolic escape', 'Straight line'], c: 0 },
    { q: 'Which formula gives escape velocity?', a: ['√(2GM/R)', '√(GM/R)', 'GM/R²', '2π√(a³/GM)'], c: 0 },
    { q: 'Raising the launch altitude makes escape velocity...', a: ['Smaller', 'Larger', 'Unchanged', 'Zero'], c: 0 },
    { q: 'A launch speed giving specific orbital energy ε = 0 produces a...', a: ['Parabolic escape', 'Circular orbit', 'Hyperbola', 'Fall-back'], c: 0 },
    { q: 'Why can’t a single horizontal surface launch below circular speed reach a stable low orbit?', a: ['The launch point becomes the apogee; perigee is inside the planet', 'Air resistance always stops it', 'Escape velocity is too low', 'Gravity switches off'], c: 0 },
    { q: 'The Moon’s escape velocity (≈2.38 km/s) is lower than Earth’s mainly because the Moon has...', a: ['Much less mass', 'A thicker atmosphere', 'Faster rotation', 'A larger radius'], c: 0 },
    { q: 'At a black hole’s event horizon, the escape velocity equals...', a: ['The speed of light c', 'Earth’s escape velocity', 'Zero', 'The orbital velocity'], c: 0 },
    { q: 'Circular orbital velocity at radius r is given by...', a: ['√(GM/r)', '√(2GM/r)', 'GM/r', 'GMr'], c: 0 },
    { q: 'For a bound elliptical orbit, the specific orbital energy ε is...', a: ['Negative', 'Zero', 'Positive', 'Infinite'], c: 0 }
  ];
  var quiz = { qs: [], idx: 0, score: 0, answered: false, results: [] };

  function shuffleWithAnswer(item) {
    // shuffle options while tracking correct
    var opts = item.a.map(function (t, i) { return { t: t, correct: i === item.c }; });
    for (var i = opts.length - 1; i > 0; i--) { var j = Math.floor(seededRand() * (i + 1)); var tmp = opts[i]; opts[i] = opts[j]; opts[j] = tmp; }
    return { q: item.q, opts: opts };
  }
  function startQuiz() {
    showEls(QUIZ_ELS, false);
    $('quiz-panel').style.display = ''; $('quiz-bar').style.display = '';
    var bank = QUIZ_BANK.slice();
    for (var i = bank.length - 1; i > 0; i--) { var j = Math.floor(seededRand() * (i + 1)); var t = bank[i]; bank[i] = bank[j]; bank[j] = t; }
    quiz.qs = bank.slice(0, 5).map(shuffleWithAnswer);
    quiz.idx = 0; quiz.score = 0; quiz.results = [];
    renderQuiz();
  }
  function renderQuiz() {
    quiz.answered = false;
    var item = quiz.qs[quiz.idx];
    $('qbar-num').textContent = (quiz.idx + 1);
    var html = '<p class="qp-prompt">' + item.q + '</p><div class="answer-grid">';
    item.opts.forEach(function (o, i) { html += '<button class="answer-btn" data-i="' + i + '">' + o.t + '</button>'; });
    html += '</div>';
    $('quiz-panel').innerHTML = html;
    var btns = $('quiz-panel').querySelectorAll('.answer-btn');
    btns.forEach(function (b) { b.addEventListener('click', function () { answerQuiz(b, item, btns); }); });
  }
  function answerQuiz(btn, item, btns) {
    if (quiz.answered) return;
    quiz.answered = true;
    var i = parseInt(btn.getAttribute('data-i'), 10);
    var correct = item.opts[i].correct;
    btns.forEach(function (b) {
      b.classList.add('locked');
      var bi = parseInt(b.getAttribute('data-i'), 10);
      if (item.opts[bi].correct) b.classList.add('correct');
    });
    if (correct) { btn.classList.add('correct'); quiz.score++; playSuccess(); }
    else { btn.classList.add('wrong'); playImpact(); }
    quiz.results.push({ q: item.q, correct: correct });
    setTimeout(function () {
      quiz.idx++;
      if (quiz.idx >= quiz.qs.length) showQuizResult();
      else renderQuiz();
    }, 850);
  }
  function showQuizResult() {
    $('quiz-panel').style.display = 'none'; $('quiz-bar').style.display = 'none';
    var res = $('quiz-result'); res.style.display = '';
    var sc = quiz.score, n = quiz.qs.length;
    var stars = sc === n ? '★★★' : sc >= n * 0.6 ? '★★☆' : sc >= n * 0.4 ? '★☆☆' : '☆☆☆';
    var cls = sc === n ? 'perfect' : sc >= n * 0.6 ? 'good' : 'poor';
    var verdict = sc === n ? 'Perfect — you’ve escaped!' : sc >= n * 0.6 ? 'Good orbit, keep climbing.' : 'Suborbital — review and retry.';
    var rows = quiz.results.map(function (r, i) {
      return '<div class="qr-row ' + (r.correct ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span>' +
        '<span class="qr-detail">' + r.q + '</span><span class="qr-mark">' + (r.correct ? '✓' : '✗') + '</span></div>';
    }).join('');
    res.innerHTML =
      '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + sc + '/' + n + '</div><div class="qr-verdict">' + verdict + '</div></div></div>' +
      '<div class="qr-rows">' + rows + '</div>' +
      '<button class="btn btn-primary" id="quiz-retry" style="align-self:flex-start;">↺ Retry Quiz</button>';
    on($('quiz-retry'), 'click', function () { playClick(); startQuiz(); });
  }

  /* ══════════════════════════════════════════════════════════════
     RESIZE + INIT
     ══════════════════════════════════════════════════════════════ */
  function resize() {
    var raw = canvas.parentElement.clientWidth;
    // Container hidden or collapsed (background tab, mid-layout) — keep the
    // last good canvas size instead of shrinking to the floor and redrawing.
    if (raw < 50) return;
    var cssW = raw - 16; // padding
    if (cssW < 200) cssW = 200;
    var cssH = Math.round(Math.max(360, Math.min(520, cssW * 0.64)));
    var dpr = window.devicePixelRatio || 1;
    view.cssW = cssW; view.cssH = cssH; view.dpr = dpr;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    makeStars();
    if (path) { fitView(); draw(); if (launched) setupRocket(); }
  }
  window.addEventListener('resize', function () { clearTimeout(window._evrsz); window._evrsz = setTimeout(resize, 120); });
  // A window `resize` doesn't fire when only the container changes size
  // (ad slots loading, embedded panes, reader modes) — observe the card itself.
  if (window.ResizeObserver) {
    var _evLastW = 0;
    // Call resize() directly (no debounce): RO already coalesces per frame,
    // the 2px gate prevents feedback loops, and setTimeout can be suspended
    // in background/embedded panes, which would leave the canvas undrawn.
    new ResizeObserver(function (entries) {
      var w = entries[0].contentRect.width;
      if (Math.abs(w - _evLastW) < 2) return;   // ignore sub-pixel noise
      _evLastW = w;
      resize();
    }).observe(canvas.parentElement);
  }

  function init() {
    rocketEl = $('ev-rocket');
    resize();
    updateDragToggle();
    applyMode();
    // Load into the "Angled Launch" scenario by default (params + prediction).
    applyPreset('polar', false);
  }
  init();
})();
