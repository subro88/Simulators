/* ══════════════════════════════════════════════════════════════════════════
   Collision & Momentum Simulator — NHIT VisualLab
   Five rigs on one engine: air track (1D), air table (2D), ballistic
   pendulum, Newton's cradle, crash-test sled.

   Physics conventions used throughout
   ───────────────────────────────────
   • Everything internal is SI: kg, m, m/s, N, J, kg·m/s. Only display converts.
   • +x is to the right. Velocities are signed, never speeds.
   • A collision is resolved with the coefficient of restitution e, defined
     along the line of impact as  e = −(v₂−v₁)/(u₂−u₁).
       v₁' = (m₁u₁ + m₂u₂ + m₂·e·(u₂−u₁)) / (m₁+m₂)
       v₂' = (m₁u₁ + m₂u₂ + m₁·e·(u₁−u₂)) / (m₁+m₂)
     which reduces to the elastic pair at e=1 and to v_cm at e=0.
   • Energy lost:  ΔKE = ½·μ·v_rel²·(1−e²),  μ = m₁m₂/(m₁+m₂).
   • The contact itself is integrated as a linear spring–dashpot so the F–t
     curve is a real pulse of finite width, then the velocities are SNAPPED to
     the analytic result at separation. That keeps the picture honest (a real
     contact takes time) without letting integrator drift creep into the
     numbers the student reads. See makeContact() / resolvePair().
   ══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────── §1  Helpers ─────────────────────────── */

  var $ = function (id) { return document.getElementById(id); };
  var G = 9.80665;                       // m/s², standard gravity

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function sgn(v) { return v < 0 ? -1 : (v > 0 ? 1 : 0); }
  function near(a, b, tol) { return Math.abs(a - b) <= (tol == null ? 1e-9 : tol); }

  /* Significant-figure formatter that never shows "-0" and never shows
     scientific notation for the ranges this tool works in. */
  function fmt(v, dp) {
    if (v == null || !isFinite(v)) return '—';
    if (dp == null) dp = 2;
    var s = Math.abs(v) < Math.pow(10, -dp) / 2 ? 0 : v;
    return s.toFixed(dp);
  }
  function fmtSmart(v) {
    if (v == null || !isFinite(v)) return '—';
    var a = Math.abs(v);
    if (a === 0) return '0';
    if (a >= 1000) return v.toFixed(0);
    if (a >= 100) return v.toFixed(1);
    if (a >= 1) return v.toFixed(2);
    if (a >= 0.01) return v.toFixed(3);
    return v.toExponential(2);
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ─────────────────────────── §2  Units ───────────────────────────
     Internal state is SI. These convert SI → the active display system.
     Imperial uses the engineering set students actually meet: pounds for
     mass, feet per second for velocity, pounds-force, foot-pounds, and
     slug·ft/s for momentum (the coherent imperial momentum unit). Vehicle
     speeds get mph because nobody quotes a crash in ft/s. */

  var U = {
    si: {
      mass: { f: 1, u: 'kg' }, vel: { f: 1, u: 'm/s' }, len: { f: 1, u: 'm' },
      force: { f: 1, u: 'N' }, energy: { f: 1, u: 'J' }, mom: { f: 1, u: 'kg·m/s' },
      time: { f: 1000, u: 'ms' }, speedBig: { f: 3.6, u: 'km/h' }, lenSmall: { f: 100, u: 'cm' },
      forceBig: { f: 0.001, u: 'kN' }
    },
    imp: {
      mass: { f: 2.2046226, u: 'lb' }, vel: { f: 3.2808399, u: 'ft/s' }, len: { f: 3.2808399, u: 'ft' },
      force: { f: 0.22480894, u: 'lbf' }, energy: { f: 0.73756215, u: 'ft·lbf' },
      mom: { f: 0.22480894, u: 'slug·ft/s' },
      time: { f: 1000, u: 'ms' }, speedBig: { f: 2.2369363, u: 'mph' }, lenSmall: { f: 39.370079, u: 'in' },
      forceBig: { f: 0.00011240447, u: 'kip' }
    }
  };

  function uf(kind) { return U[S.units][kind].f; }
  function uL(kind) { return U[S.units][kind].u; }
  function toD(v, kind) { return v * uf(kind); }          // SI  → display
  function toSI(v, kind) { return v / uf(kind); }         // display → SI
  function dv(v, kind, dp) { return fmt(toD(v, kind), dp); }
  function dvu(v, kind, dp) { return fmt(toD(v, kind), dp) + ' ' + uL(kind); }

  /* ─────────────────────────── §3  State ─────────────────────────── */

  var S = {
    mode: 'simulate',
    appa: 'track',
    type: 'elastic',
    units: 'si',
    graph: 'bars',
    sound: true,
    speed: 1,
    running: false,
    finished: false,
    t: 0,
    /* Momentum and the centre of mass are on by default: seeing p and v
       side by side is the point of the tool, and the CM marker gliding
       straight through the collision is its best single lesson. */
    flags: { vel: true, mom: true, cm: true, values: true, path: false, ke: false, grid: true, cmframe: false },

    /* Air track — a 2.00 m track, gliders float on air */
    tr: { m1: 0.250, m2: 0.250, u1: 0.60, u2: 0.00, e: 1.00, friction: false, spring: 0.50 },
    /* Air table — 2D, b is the impact parameter (offset of centres) */
    tb: { m1: 0.200, m2: 0.200, u1: 0.70, u2: 0.00, e: 1.00, b: 0.00, walls: true },
    /* Ballistic pendulum */
    pd: { mb: 0.0100, vb: 180, M: 1.500, L: 0.900 },
    /* Newton's cradle */
    cr: { n: 5, lift: 1, ang: 32, e: 0.98, m: 0.100, L: 0.300 },
    /* Crash test */
    cs: { m1: 1400, v1: 14.0, crumple: 0.60, target: 'barrier', m2: 1400, v2: 0, e: 0.15, restraint: 'airbag' },

    bodies: [],        // live simulation bodies
    before: null,      // snapshot taken the instant before first contact
    after: null,       // snapshot taken the instant after last contact
    contact: null,     // active contact model (spring–dashpot)
    trace: [],         // {t, v1, v2, p1, p2, F} timeline for the graphs
    paths: [[], []],   // trail points per body
    hits: 0,
    log: [],
    lastImpulse: 0,
    lastDt: 0,
    lastFpk: 0
  };

  /* ─────────────────────────── §4  Collision core ─────────────────────────── */

  /* Reduced mass — the effective mass of the relative motion. */
  function reducedMass(m1, m2) { return (m1 * m2) / (m1 + m2); }

  /* Exact 1D post-collision velocities for any e. */
  function resolve1D(m1, u1, m2, u2, e) {
    var M = m1 + m2;
    return {
      v1: (m1 * u1 + m2 * u2 + m2 * e * (u2 - u1)) / M,
      v2: (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / M
    };
  }

  /* Energy lost in a collision — depends on relative velocity only, which is
     why every observer agrees on it. */
  function keLost(m1, u1, m2, u2, e) {
    var mu = reducedMass(m1, m2), vr = u1 - u2;
    return 0.5 * mu * vr * vr * (1 - e * e);
  }

  /* Impulse delivered to body 1 (negative of that on body 2). */
  function impulseOn1(m1, u1, m2, u2, e) {
    return reducedMass(m1, m2) * (1 + e) * (u2 - u1);
  }

  function kinetic(bodies) {
    var k = 0;
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      k += 0.5 * b.m * (b.vx * b.vx + b.vy * b.vy);
    }
    return k;
  }
  function momentum(bodies) {
    var px = 0, py = 0;
    for (var i = 0; i < bodies.length; i++) { px += bodies[i].m * bodies[i].vx; py += bodies[i].m * bodies[i].vy; }
    return { x: px, y: py, mag: Math.hypot(px, py) };
  }
  function totalMass(bodies) {
    var m = 0; for (var i = 0; i < bodies.length; i++) m += bodies[i].m; return m;
  }
  function comPos(bodies) {
    var mx = 0, my = 0, m = totalMass(bodies);
    for (var i = 0; i < bodies.length; i++) { mx += bodies[i].m * bodies[i].x; my += bodies[i].m * bodies[i].y; }
    return { x: mx / m, y: my / m };
  }
  function comVel(bodies) {
    var p = momentum(bodies), m = totalMass(bodies);
    return { x: p.x / m, y: p.y / m };
  }

  /* ── Contact model ──
     A linear spring–dashpot between the pair. Given a target restitution e
     and a target contact duration Δt, the damping ratio and stiffness follow
     in closed form from the single-degree-of-freedom contact oscillator whose
     mass is the reduced mass μ:

        ζ  = −ln e / √(π² + ln²e)          (ζ→0 as e→1, ζ→1 as e→0)
        ω_d = π/Δt,   ω_n = ω_d/√(1−ζ²)
        k  = μ ω_n²,  c = 2ζ√(k μ)

     That means the *shape* of the F–t pulse is genuinely produced by a spring
     that would give this e — not a decorative bump drawn over the answer. */
  function makeContact(m1, m2, vrel, e, dt) {
    var mu = reducedMass(m1, m2);
    var ee = clamp(e, 0.0001, 0.9999);
    var le = Math.log(ee);
    var z = -le / Math.sqrt(Math.PI * Math.PI + le * le);
    var wd = Math.PI / dt;
    var wn = wd / Math.sqrt(Math.max(1e-6, 1 - z * z));
    var k = mu * wn * wn;
    var c = 2 * z * Math.sqrt(k * mu);
    return { k: k, c: c, mu: mu, dt: dt, t0: 0, samples: [], vrel0: vrel };
  }

  /* ─────────────────────────── §5  Snapshots ─────────────────────────── */

  function snapshot(bodies) {
    var arr = [];
    for (var i = 0; i < bodies.length; i++) {
      var b = bodies[i];
      arr.push({ m: b.m, vx: b.vx, vy: b.vy, v: Math.hypot(b.vx, b.vy), x: b.x, y: b.y });
    }
    return { bodies: arr, p: momentum(bodies), ke: kinetic(bodies), vcm: comVel(bodies), t: S.t };
  }

  /* ─────────────────────────── §6  Apparatus setup ───────────────────────────
     Each rig builds its own body list and geometry in SI. Rendering maps
     metres → pixels later, so nothing here knows about the canvas. */

  var TRACK_LEN = 2.00;      // m, usable air-track length
  var TABLE_W = 1.60, TABLE_H = 0.90;   // m, air-table playing area
  var GATE_A = 0.45, GATE_B = 1.55;     // m, photogate positions on the track

  /* Glider/puck radius from mass, at constant density and thickness.
     A disc of fixed thickness has r ∝ √m, which is why the pucks grow
     slowly — doubling the mass only makes them 41 % wider. */
  function radiusFor(m, base, baseM) { return base * Math.sqrt(m / baseM); }

  function activeE() {
    if (S.type === 'elastic') return 1;
    if (S.type === 'inelastic') return 0;
    if (S.appa === 'table') return S.tb.e;
    if (S.appa === 'cradle') return S.cr.e;
    if (S.appa === 'crash') return S.cs.e;
    return S.tr.e;
  }

  function buildTrack() {
    var p = S.tr, e = activeE();
    var r1 = radiusFor(p.m1, 0.075, 0.25), r2 = radiusFor(p.m2, 0.075, 0.25);
    var b1, b2;
    if (S.type === 'explosion') {
      /* Both gliders start at rest, touching, with a compressed spring
         between them. Total momentum is zero and stays zero; the kinetic
         energy is created out of stored elastic energy. */
      var xc = TRACK_LEN * 0.45;
      b1 = { m: p.m1, r: r1, x: xc - r1, y: 0, vx: 0, vy: 0, id: 1 };
      b2 = { m: p.m2, r: r2, x: xc + r2, y: 0, vx: 0, vy: 0, id: 2 };
    } else {
      b1 = { m: p.m1, r: r1, x: 0.30, y: 0, vx: p.u1, vy: 0, id: 1 };
      b2 = { m: p.m2, r: r2, x: 1.30, y: 0, vx: p.u2, vy: 0, id: 2 };
    }
    S.bodies = [b1, b2];
    S.exploded = false;
  }

  function buildTable() {
    var p = S.tb;
    var r1 = radiusFor(p.m1, 0.055, 0.20), r2 = radiusFor(p.m2, 0.055, 0.20);
    /* b is the perpendicular offset of the target's centre from the line of
       the incoming puck. b = 0 is head-on; b = r₁+r₂ is a graze. */
    var bmax = r1 + r2;
    var off = clamp(p.b, -1, 1) * bmax;
    S.bodies = [
      { m: p.m1, r: r1, x: 0.28, y: TABLE_H / 2, vx: p.u1, vy: 0, id: 1 },
      { m: p.m2, r: r2, x: 1.05, y: TABLE_H / 2 + off, vx: p.u2, vy: 0, id: 2 }
    ];
  }

  function buildPendulum() {
    var p = S.pd;
    S.pdState = {
      phase: 'ready',      // ready → flying → swinging → hanging
      bx: -0.55,           // bullet x relative to block rest position
      theta: 0, omega: 0, thetaMax: 0, V: 0, fired: false
    };
    S.bodies = [
      { m: p.mb, r: 0.012, x: -0.55, y: 0, vx: 0, vy: 0, id: 1 },
      { m: p.M, r: 0.075, x: 0, y: 0, vx: 0, vy: 0, id: 2 }
    ];
  }

  function buildCradle() {
    var p = S.cr, n = Math.round(p.n), lift = Math.min(Math.round(p.lift), n - 1);
    var r = 0.026, balls = [];
    var a = p.ang * Math.PI / 180;
    for (var i = 0; i < n; i++) {
      /* Balls hang in a row touching. The lifted ones are pulled back to the
         left by the release angle; the rest hang plumb. */
      var th = (i < lift) ? -a : 0;
      balls.push({ m: p.m, r: r, th: th, om: 0, i: i, rest: (i - (n - 1) / 2) * 2 * r });
    }
    S.cradle = { balls: balls, n: n, lift: lift, L: p.L, r: r, released: false };
    S.bodies = [];
  }

  function buildCrash() {
    var p = S.cs;
    S.crash = {
      phase: 'ready', x1: 0, x2: 0, v1: p.v1, v2: p.v2,
      crushed1: 0, crushed2: 0, t: 0, done: false,
      dt: 0, Fpk: 0, Favg: 0, Fdrv: 0, gForce: 0, dOcc: 0, dv1: 0, dv2: 0
    };
    S.bodies = [];
    prepCrash();
  }

  /* The crash is solved analytically up front — the animation then plays
     that solution back. Impact force is what matters here, and it comes
     entirely from how long the stop takes. */
  function prepCrash() {
    var p = S.cs, c = S.crash;
    var v1 = p.v1, v2 = (p.target === 'car') ? p.v2 : 0;
    var dv1, dv2 = 0;

    if (p.target === 'barrier') {
      /* Rigid barrier = infinite mass. v' = −e·v. */
      var vf = -p.e * v1;
      dv1 = Math.abs(vf - v1);
    } else {
      var r = resolve1D(p.m1, v1, p.m2, v2, p.e);
      dv1 = Math.abs(r.v1 - v1);
      dv2 = Math.abs(r.v2 - v2);
      c.vf1 = r.v1; c.vf2 = r.v2;
    }

    /* Δt = 2d/Δv for a symmetric stop: the vehicle covers the crumple
       distance at an average of half the closing speed. */
    var d = Math.max(0.02, p.crumple);
    var dt = 2 * d / Math.max(0.1, dv1);
    var Favg = p.m1 * dv1 / dt;
    var Fpk = Math.PI / 2 * Favg;        // half-sine pulse peak

    /* The occupant is a separate collision. Belts and airbags do nothing to
       the car's stopping distance — they lengthen the *occupant's*. */
    var mo = 70;
    var extra = p.restraint === 'none' ? 0.05 : (p.restraint === 'belt' ? 0.15 : 0.35);
    var dOcc = (p.restraint === 'none') ? extra : d + extra;
    var Focc = mo * dv1 * dv1 / (2 * dOcc);

    c.dv1 = dv1; c.dv2 = dv2; c.dt = dt; c.Favg = Favg; c.Fpk = Fpk;
    c.dOcc = dOcc; c.Focc = Focc; c.gOcc = Focc / (mo * G);
    c.gCar = Favg / (p.m1 * G);
    c.J = p.m1 * dv1;
    c.keAbs = 0.5 * p.m1 * v1 * v1 - 0.5 * p.m1 * (p.target === 'barrier' ? (p.e * v1) * (p.e * v1) : c.vf1 * c.vf1)
            + (p.target === 'car' ? (0.5 * p.m2 * v2 * v2 - 0.5 * p.m2 * c.vf2 * c.vf2) : 0);
  }

  function buildApparatus() {
    S.t = 0; S.trace = []; S.paths = [[], []]; S.hits = 0;
    S.before = null; S.after = null; S.contact = null; S.finished = false;
    S.lastImpulse = 0; S.lastDt = 0; S.lastFpk = 0;
    if (S.appa === 'track') buildTrack();
    else if (S.appa === 'table') buildTable();
    else if (S.appa === 'pendulum') buildPendulum();
    else if (S.appa === 'cradle') buildCradle();
    else buildCrash();
    if (S.bodies.length) S.before = snapshot(S.bodies);
  }

  /* ─────────────────────────── §7  Time stepping ─────────────────────────── */

  var SUB = 8;               // physics sub-steps per frame — keeps contact smooth
  var CONTACT_DT = 0.022;    // s, nominal bumper contact time on the bench rigs

  function step(dt) {
    if (S.appa === 'track') stepTrack(dt);
    else if (S.appa === 'table') stepTable(dt);
    else if (S.appa === 'pendulum') stepPendulum(dt);
    else if (S.appa === 'cradle') stepCradle(dt);
    else stepCrash(dt);
    S.t += dt;
    recordTrace();
  }

  function recordTrace() {
    var F = S.contact ? S.contact.lastF : 0;
    if (S.appa === 'crash') F = S.crash.Fnow || 0;
    var b = S.bodies;
    var row = { t: S.t, F: F };
    if (b.length >= 2) {
      row.v1 = b[0].vx; row.v2 = b[1].vx;
      row.p1 = b[0].m * b[0].vx; row.p2 = b[1].m * b[1].vx;
      row.pt = row.p1 + row.p2; row.ke = kinetic(b);
    } else if (S.appa === 'crash') {
      row.v1 = S.crash.v1; row.v2 = S.crash.v2;
      row.p1 = S.cs.m1 * S.crash.v1; row.p2 = (S.cs.target === 'car' ? S.cs.m2 * S.crash.v2 : 0);
      row.pt = row.p1 + row.p2; row.ke = 0.5 * S.cs.m1 * S.crash.v1 * S.crash.v1 +
        (S.cs.target === 'car' ? 0.5 * S.cs.m2 * S.crash.v2 * S.crash.v2 : 0);
    } else if (S.appa === 'cradle' && S.cradle) {
      var bb = S.cradle.balls, p = 0, k = 0;
      for (var i = 0; i < bb.length; i++) {
        var v = bb[i].om * S.cradle.L;
        p += bb[i].m * v; k += 0.5 * bb[i].m * v * v;
      }
      row.pt = p; row.ke = k; row.v1 = bb[0].om * S.cradle.L; row.v2 = bb[bb.length - 1].om * S.cradle.L;
      row.p1 = bb[0].m * row.v1; row.p2 = bb[bb.length - 1].m * row.v2;
    }
    S.trace.push(row);
    if (S.trace.length > 4000) S.trace.shift();
  }

  /* ── Air track ── */
  function stepTrack(dt) {
    var b = S.bodies, b1 = b[0], b2 = b[1], p = S.tr;
    var h = dt / SUB;

    for (var s = 0; s < SUB; s++) {
      /* Explosion: the spring pushes until the gliders separate. */
      if (S.type === 'explosion' && !S.exploded) {
        var Es = p.spring;                       // J stored in the spring
        var mu = reducedMass(b1.m, b2.m);
        var vrel = Math.sqrt(2 * Es / mu);       // separation speed
        b1.vx = -vrel * b2.m / (b1.m + b2.m);
        b2.vx = +vrel * b1.m / (b1.m + b2.m);
        S.exploded = true;
        S.before = { bodies: [{ m: b1.m, vx: 0, vy: 0, v: 0 }, { m: b2.m, vx: 0, vy: 0, v: 0 }],
                     p: { x: 0, y: 0, mag: 0 }, ke: 0, vcm: { x: 0, y: 0 }, t: 0 };
        S.after = snapshot(b);
        S.hits = 1;
        S.lastImpulse = b2.m * b2.vx;
        S.lastDt = CONTACT_DT;
        S.lastFpk = Math.PI / 2 * Math.abs(S.lastImpulse) / CONTACT_DT;
        playThud(0.5);
      }

      /* Friction — the air pump off. This is an EXTERNAL force, so momentum
         stops being conserved. Showing that is the point of the toggle. */
      if (p.friction) {
        /* Light sliding friction. It has to be small enough that the glider
           still REACHES its partner across the 0.85 m gap — at mu = 0.22 it
           stopped dead after 8 cm and no collision ever happened, which made
           the whole toggle useless. At 0.015 the glider arrives at about
           0.33 m/s from a 0.60 m/s launch, so the collision still occurs and
           the momentum loss on the way in is large and obvious. */
        var muK = 0.015;
        [b1, b2].forEach(function (bd) {
          if (Math.abs(bd.vx) < 1e-4) { bd.vx = 0; return; }
          var a = -sgn(bd.vx) * muK * G;
          var nv = bd.vx + a * h;
          bd.vx = (sgn(nv) !== sgn(bd.vx)) ? 0 : nv;
        });
      }

      b1.x += b1.vx * h;
      b2.x += b2.vx * h;

      if (!(S.type === 'explosion')) handlePair(b1, b2, h);

      /* End stops: sprung buffers at each end of the track. They reverse a
         glider, which also takes momentum out of the two-glider system. */
      if (S.stuck) {
        /* Locked together after a perfectly inelastic collision, so they must
           meet the buffer as ONE body. Bouncing them individually and then
           averaging to a common velocity destroys almost all the momentum in
           a single hit — the pair would grind to a halt at the end stop. */
        var vc = (b1.m * b1.vx + b2.m * b2.vx) / (b1.m + b2.m);
        b1.vx = b2.vx = vc;
        b2.x = b1.x + b1.r + b2.r;
        bounceStuck(b1, b2);
      } else {
        bounceWall(b1, 0, TRACK_LEN);
        bounceWall(b2, 0, TRACK_LEN);
      }
    }
    if (S.flags.path) { pushPath(0, b1.x, 0); pushPath(1, b2.x, 0); }
  }

  /* One buffer impact for a glued pair: shift both, reverse the shared velocity. */
  function bounceStuck(b1, b2) {
    if (b1.x - b1.r < 0 && b1.vx < 0) {
      var d = -(b1.x - b1.r); b1.x += d; b2.x += d;
      b1.vx = b2.vx = -b1.vx * 0.92; S.wallHit = S.t; playTick();
    } else if (b2.x + b2.r > TRACK_LEN && b2.vx > 0) {
      var d2 = (b2.x + b2.r) - TRACK_LEN; b1.x -= d2; b2.x -= d2;
      b1.vx = b2.vx = -b2.vx * 0.92; S.wallHit = S.t; playTick();
    }
  }

  function bounceWall(bd, lo, hi) {
    if (bd.x - bd.r < lo && bd.vx < 0) { bd.x = lo + bd.r; bd.vx = -bd.vx * 0.92; S.wallHit = S.t; playTick(); }
    if (bd.x + bd.r > hi && bd.vx > 0) { bd.x = hi - bd.r; bd.vx = -bd.vx * 0.92; S.wallHit = S.t; playTick(); }
  }

  function pushPath(i, x, y) {
    var arr = S.paths[i];
    var last = arr[arr.length - 1];
    if (!last || Math.hypot(last.x - x, last.y - y) > 0.004) arr.push({ x: x, y: y });
    if (arr.length > 900) arr.shift();
  }

  /* Contact between a 1D pair, integrated through a spring–dashpot so the
     F–t pulse has real width, then snapped to the exact analytic result. */
  function handlePair(b1, b2, h) {
    var gap = (b2.x - b1.x) - (b1.r + b2.r);
    var e = activeE();

    if (!S.contact && gap <= 0 && (b1.vx - b2.vx) > 0) {
      var u1 = b1.vx, u2 = b2.vx;
      /* The FIRST collision is the measurement. Later ones — after a glider
         has rebounded off an end stop — are real and are still simulated, but
         they must not overwrite the ledger, or it would silently describe a
         rebound the student never set up. See S.latched. */
      if (!S.latched) S.before = snapshot(S.bodies);
      S.contact = makeContact(b1.m, b2.m, u1 - u2, e, CONTACT_DT);
      S.contact.u1 = u1; S.contact.u2 = u2;
      var r = resolve1D(b1.m, u1, b2.m, u2, e);
      S.contact.v1 = r.v1; S.contact.v2 = r.v2;
      S.contact.elapsed = 0;
      S.contact.lastF = 0;
      S.contact.area = 0;
      if (!S.latched) {
        S.lastImpulse = impulseOn1(b1.m, u1, b2.m, u2, e);
        S.lastDt = CONTACT_DT;
        S.lastVrelN = u1 - u2;          // head-on: the line of impact is x
        S.lastMu = reducedMass(b1.m, b2.m);
      }
      playThud(Math.min(1, Math.abs(u1 - u2) / 2));
    }

    if (S.contact) {
      var c = S.contact;
      var delta = -((b2.x - b1.x) - (b1.r + b2.r));       // overlap, ≥0
      var dvel = b1.vx - b2.vx;                            // approach speed
      var F = c.k * Math.max(0, delta) + c.c * dvel;
      if (F < 0) F = 0;                                    // no pulling
      c.lastF = F;
      c.area += F * h;
      c.elapsed += h;
      b1.vx -= (F / b1.m) * h;
      b2.vx += (F / b2.m) * h;

      /* Run the full modelled pulse. Terminating early on "they are no longer
         approaching" looks reasonable but is wrong at low e: a heavily damped
         contact never separates, so the pulse would be cut to a fraction of
         its width and the F–t graph would report a contact eight times too
         short. The half-period of the contact oscillator IS c.dt by
         construction, so that is the right end point for every e. */
      if (c.elapsed >= c.dt) {
        b1.vx = c.v1; b2.vx = c.v2;
        if (delta > 0) {                                   // un-overlap cleanly
          b1.x -= delta * (b2.m / (b1.m + b2.m));
          b2.x += delta * (b1.m / (b1.m + b2.m));
        }
        S.hits++;
        if (!S.latched) {
          S.lastFpk = c.area > 0 ? Math.PI / 2 * Math.abs(S.lastImpulse) / c.elapsed : 0;
          S.lastDt = c.elapsed;
          S.after = snapshot(S.bodies);
          S.firstPulseEnd = S.t;
          S.latched = true;
        }
        S.contact = null;
        S.stuck = (e <= 0.0001);
        if (S.stuck) { b2.x = b1.x + b1.r + b2.r; }
      }
    }
  }

  /* ── Air table (2D) ──
     Off-centre impacts are handled by resolving along the line of centres.
     The normal components collide one-dimensionally with e; the tangential
     components pass through untouched, because smooth pucks cannot exert a
     sideways force on one another. */
  function stepTable(dt) {
    var b = S.bodies, b1 = b[0], b2 = b[1];
    var h = dt / SUB;
    for (var s = 0; s < SUB; s++) {
      b1.x += b1.vx * h; b1.y += b1.vy * h;
      b2.x += b2.vx * h; b2.y += b2.vy * h;
      handlePair2D(b1, b2, h);
      if (S.tb.walls) {
        if (S.stuck2) bounceRectPair(b1, b2);   /* glued pucks rebound as one */
        else { bounceRect(b1); bounceRect(b2); }
      }
    }
    if (S.flags.path) { pushPath(0, b1.x, b1.y); pushPath(1, b2.x, b2.y); }
  }

  function bounceRect(bd) {
    if (bd.x - bd.r < 0 && bd.vx < 0) { bd.x = bd.r; bd.vx = -bd.vx * 0.95; playTick(); }
    if (bd.x + bd.r > TABLE_W && bd.vx > 0) { bd.x = TABLE_W - bd.r; bd.vx = -bd.vx * 0.95; playTick(); }
    if (bd.y - bd.r < 0 && bd.vy < 0) { bd.y = bd.r; bd.vy = -bd.vy * 0.95; playTick(); }
    if (bd.y + bd.r > TABLE_H && bd.vy > 0) { bd.y = TABLE_H - bd.r; bd.vy = -bd.vy * 0.95; playTick(); }
  }

  /* Glued pucks meet a rail as a single rigid body: whichever one is past the
     rail decides, both are shifted back, and the shared velocity component is
     reversed once. */
  function bounceRectPair(b1, b2) {
    var vx = (b1.m * b1.vx + b2.m * b2.vx) / (b1.m + b2.m);
    var vy = (b1.m * b1.vy + b2.m * b2.vy) / (b1.m + b2.m);
    var dx = 0, dy = 0, hit = false;
    [b1, b2].forEach(function (bd) {
      if (bd.x - bd.r < 0 && vx < 0) { dx = Math.max(dx, bd.r - bd.x); hit = 'x'; }
      if (bd.x + bd.r > TABLE_W && vx > 0) { dx = Math.min(dx, TABLE_W - bd.r - bd.x); hit = 'x'; }
      if (bd.y - bd.r < 0 && vy < 0) { dy = Math.max(dy, bd.r - bd.y); hit = hit || 'y'; }
      if (bd.y + bd.r > TABLE_H && vy > 0) { dy = Math.min(dy, TABLE_H - bd.r - bd.y); hit = hit || 'y'; }
    });
    if (!hit) { b1.vx = b2.vx = vx; b1.vy = b2.vy = vy; return; }
    b1.x += dx; b2.x += dx; b1.y += dy; b2.y += dy;
    if (dx !== 0) vx = -vx * 0.95;
    if (dy !== 0) vy = -vy * 0.95;
    b1.vx = b2.vx = vx; b1.vy = b2.vy = vy;
    playTick();
  }

  function handlePair2D(b1, b2, h) {
    var nx = b2.x - b1.x, ny = b2.y - b1.y;
    var d = Math.hypot(nx, ny) || 1e-9;
    nx /= d; ny /= d;
    var sep = d - (b1.r + b2.r);
    var un1 = b1.vx * nx + b1.vy * ny;      // normal components
    var un2 = b2.vx * nx + b2.vy * ny;
    var e = activeE();

    if (!S.contact && sep <= 0 && (un1 - un2) > 0) {
      if (!S.latched) S.before = snapshot(S.bodies);
      S.contact = makeContact(b1.m, b2.m, un1 - un2, e, CONTACT_DT);
      var r = resolve1D(b1.m, un1, b2.m, un2, e);
      S.contact.vn1 = r.v1; S.contact.vn2 = r.v2;
      S.contact.nx = nx; S.contact.ny = ny;
      S.contact.elapsed = 0; S.contact.lastF = 0;
      if (!S.latched) {
        S.lastImpulse = impulseOn1(b1.m, un1, b2.m, un2, e);
        S.lastDt = CONTACT_DT;
        /* Only the NORMAL component collides, so only it appears in the energy
           loss. Using the full relative speed (or worse, its x-component) here
           over-states the loss on every off-centre impact. */
        S.lastVrelN = un1 - un2;
        S.lastMu = reducedMass(b1.m, b2.m);
      }
      playThud(Math.min(1, Math.abs(un1 - un2) / 2));
    }

    if (S.contact) {
      var c = S.contact;
      var over = -sep;
      var approach = un1 - un2;
      var F = c.k * Math.max(0, over) + c.c * approach;
      if (F < 0) F = 0;
      c.lastF = F; c.elapsed += h;
      b1.vx -= (F / b1.m) * h * c.nx; b1.vy -= (F / b1.m) * h * c.ny;
      b2.vx += (F / b2.m) * h * c.nx; b2.vy += (F / b2.m) * h * c.ny;

      if (c.elapsed >= c.dt) {
        /* Snap the normal components to the exact answer, leave the
           tangential components exactly as they were. */
        var t1x = b1.vx - (b1.vx * c.nx + b1.vy * c.ny) * c.nx;
        var t1y = b1.vy - (b1.vx * c.nx + b1.vy * c.ny) * c.ny;
        var t2x = b2.vx - (b2.vx * c.nx + b2.vy * c.ny) * c.nx;
        var t2y = b2.vy - (b2.vx * c.nx + b2.vy * c.ny) * c.ny;
        b1.vx = t1x + c.vn1 * c.nx; b1.vy = t1y + c.vn1 * c.ny;
        b2.vx = t2x + c.vn2 * c.nx; b2.vy = t2y + c.vn2 * c.ny;
        if (over > 0) {
          b1.x -= over * c.nx * (b2.m / (b1.m + b2.m));
          b1.y -= over * c.ny * (b2.m / (b1.m + b2.m));
          b2.x += over * c.nx * (b1.m / (b1.m + b2.m));
          b2.y += over * c.ny * (b1.m / (b1.m + b2.m));
        }
        S.hits++;
        if (!S.latched) {
          S.lastDt = c.elapsed;
          S.lastFpk = Math.PI / 2 * Math.abs(S.lastImpulse) / Math.max(1e-6, c.elapsed);
          S.after = snapshot(S.bodies);
          S.firstPulseEnd = S.t;
          S.latched = true;
        }
        S.contact = null;
        if (e <= 0.0001) S.stuck2 = true;
      }
    }
    /* Perfectly inelastic pucks travel as one rigid body afterwards. */
    if (S.stuck2) {
      var vcx = (b1.m * b1.vx + b2.m * b2.vx) / (b1.m + b2.m);
      var vcy = (b1.m * b1.vy + b2.m * b2.vy) / (b1.m + b2.m);
      b1.vx = b2.vx = vcx; b1.vy = b2.vy = vcy;
    }
  }

  /* ── Ballistic pendulum ──
     Two conservation laws, one after the other, and getting the order right
     is the whole exam question. Momentum (not energy) carries you through the
     embedding; energy (not momentum) carries the block up the swing. */
  function stepPendulum(dt) {
    var p = S.pd, st = S.pdState, b = S.bodies;
    var h = dt / SUB;
    for (var s = 0; s < SUB; s++) {
      if (st.phase === 'flying') {
        b[0].x += p.vb * h;
        if (b[0].x >= -b[1].r) {
          /* Embedding: perfectly inelastic, so momentum alone survives. */
          st.V = p.mb * p.vb / (p.mb + p.M);
          st.omega = st.V / p.L;
          st.theta = 0;
          st.phase = 'swinging';
          S.before = { bodies: [{ m: p.mb, vx: p.vb, vy: 0, v: p.vb }, { m: p.M, vx: 0, vy: 0, v: 0 }],
                       p: { x: p.mb * p.vb, y: 0, mag: p.mb * p.vb },
                       ke: 0.5 * p.mb * p.vb * p.vb, vcm: { x: st.V, y: 0 }, t: S.t };
          S.after = { bodies: [{ m: p.mb + p.M, vx: st.V, vy: 0, v: st.V }],
                      p: { x: (p.mb + p.M) * st.V, y: 0, mag: (p.mb + p.M) * st.V },
                      ke: 0.5 * (p.mb + p.M) * st.V * st.V, vcm: { x: st.V, y: 0 }, t: S.t };
          S.hits = 1;
          S.lastImpulse = p.M * st.V;
          S.lastDt = 0.004;
          S.lastFpk = Math.PI / 2 * S.lastImpulse / S.lastDt;
          playThud(1);
        }
      } else if (st.phase === 'swinging') {
        /* Full nonlinear pendulum — no small-angle shortcut, because the
           swing angle here is routinely 30–60°. */
        var alpha = -(G / p.L) * Math.sin(st.theta);
        st.omega += alpha * h;
        st.theta += st.omega * h;
        if (st.omega <= 0 && st.theta > st.thetaMax) st.thetaMax = st.theta;
        if (st.omega < 0 && st.thetaMax === 0) st.thetaMax = st.theta;
        if (st.theta > st.thetaMax) st.thetaMax = st.theta;
        if (st.omega < 0 && st.theta <= 0) { /* fell back through the bottom */ }
      }
    }
  }

  /* ── Newton's cradle ──
     Each ball is its own pendulum. When neighbours meet, a 1D collision with
     e is applied to their tangential velocities, resolved left to right and
     repeated until no pair is still approaching. Nothing about "n in, n out"
     is hard-coded — it falls out of momentum plus energy. */
  function stepCradle(dt) {
    var C = S.cradle;
    if (!C) return;
    /* e is exactly 1 on the elastic setting so the chain transfers cleanly:
       equal masses at e = 1 swap velocities exactly, which is what makes
       "n in, n out" come out of the physics instead of being hard-coded. */
    var h = dt / SUB, e = S.type === 'elastic' ? 1 : (S.type === 'inelastic' ? 0 : S.cr.e);
    for (var s = 0; s < SUB; s++) {
      var i;
      for (i = 0; i < C.n; i++) {
        var bl = C.balls[i];
        bl.om += -(G / C.L) * Math.sin(bl.th) * h;
        bl.th += bl.om * h;
      }
      /* Resolve contacts repeatedly — a five-ball chain needs several passes
         within a single sub-step for the impulse to travel the whole row. */
      for (var pass = 0; pass < C.n + 2; pass++) {
        var any = false;
        for (i = 0; i < C.n - 1; i++) {
          var a = C.balls[i], bq = C.balls[i + 1];
          if (a.th >= bq.th && (a.om - bq.om) > 1e-6) {
            var va = a.om * C.L, vb = bq.om * C.L;
            var r = resolve1D(a.m, va, bq.m, vb, e);
            a.om = r.v1 / C.L; bq.om = r.v2 / C.L;
            var mid = (a.th + bq.th) / 2;
            a.th = Math.min(a.th, mid); bq.th = Math.max(bq.th, mid);
            any = true;
            if (!C.clicked || S.t - C.clicked > 0.05) { C.clicked = S.t; playTick(0.5); }
          }
        }
        if (!any) break;
      }
    }
    if (!S.after && S.t > 0.05) S.after = null;
  }

  /* ── Crash test ──
     The solution is computed analytically in prepCrash(); this plays it back
     with a half-sine force pulse so the F–t curve has the right shape, the
     right peak and — most importantly — the right area. */
  function stepCrash(dt) {
    var c = S.crash, p = S.cs;
    if (c.phase === 'approach') {
      c.x1 += c.v1 * dt;
      if (p.target === 'car') c.x2 += c.v2 * dt;
      var gap = (p.target === 'barrier') ? (CRASH_RUN - c.x1) : (CRASH_RUN - c.x1 + c.x2);
      if (gap <= 0) { c.phase = 'impact'; c.t = 0; S.before = crashSnapBefore(); playThud(1); }
    } else if (c.phase === 'impact') {
      c.t += dt;
      var tau = clamp(c.t / c.dt, 0, 1);
      var F = c.Fpk * Math.sin(Math.PI * tau);
      c.Fnow = F;
      /* Integrate the pulse so the on-screen crush and the velocity agree
         with the force actually being plotted. */
      c.v1 -= (F / p.m1) * dt * sgn(p.v1 || 1);
      if (p.target === 'car') c.v2 += (F / p.m2) * dt * sgn(p.v1 || 1);
      c.crushed1 = clamp(c.crushed1 + Math.abs(c.v1) * dt, 0, p.crumple);
      if (c.t >= c.dt) {
        c.phase = 'after'; c.Fnow = 0;
        c.v1 = (p.target === 'barrier') ? -p.e * p.v1 : c.vf1;
        if (p.target === 'car') c.v2 = c.vf2;
        S.after = crashSnapAfter();
        S.hits = 1;
        S.lastImpulse = c.J; S.lastDt = c.dt; S.lastFpk = c.Fpk;
      }
    } else if (c.phase === 'after') {
      c.x1 += c.v1 * dt;
      if (p.target === 'car') c.x2 += c.v2 * dt;
      if (S.t > 4) S.finished = true;
    }
  }
  var CRASH_RUN = 9.0;   // m of approach road before the barrier

  function crashSnapBefore() {
    var p = S.cs;
    var arr = [{ m: p.m1, vx: p.v1, vy: 0, v: Math.abs(p.v1) }];
    if (p.target === 'car') arr.push({ m: p.m2, vx: p.v2, vy: 0, v: Math.abs(p.v2) });
    var px = p.m1 * p.v1 + (p.target === 'car' ? p.m2 * p.v2 : 0);
    var ke = 0.5 * p.m1 * p.v1 * p.v1 + (p.target === 'car' ? 0.5 * p.m2 * p.v2 * p.v2 : 0);
    return { bodies: arr, p: { x: px, y: 0, mag: Math.abs(px) }, ke: ke,
             vcm: { x: px / (p.m1 + (p.target === 'car' ? p.m2 : 0)), y: 0 }, t: 0 };
  }
  function crashSnapAfter() {
    var p = S.cs, c = S.crash;
    var v1 = (p.target === 'barrier') ? -p.e * p.v1 : c.vf1;
    var arr = [{ m: p.m1, vx: v1, vy: 0, v: Math.abs(v1) }];
    if (p.target === 'car') arr.push({ m: p.m2, vx: c.vf2, vy: 0, v: Math.abs(c.vf2) });
    var px = p.m1 * v1 + (p.target === 'car' ? p.m2 * c.vf2 : 0);
    var ke = 0.5 * p.m1 * v1 * v1 + (p.target === 'car' ? 0.5 * p.m2 * c.vf2 * c.vf2 : 0);
    return { bodies: arr, p: { x: px, y: 0, mag: Math.abs(px) }, ke: ke,
             vcm: { x: px / (p.m1 + (p.target === 'car' ? p.m2 : 0)), y: 0 }, t: 0,
             external: p.target === 'barrier' };
  }

  /* ═══════════════════════ §8  Canvas & drawing kit ═══════════════════════
     Convention A throughout: the backing store is CW·DPR × CH·DPR, the
     transform is set to (DPR,0,0,DPR,0,0), and every draw call and every
     pointer mapping works in logical CW × CH units. */

  var CW = 980, CH = 470, DPR = 1;
  /* Each rig has its own natural aspect: the pendulum is tall, the track is
     wide and shallow. Sizing the canvas per rig avoids a lake of empty sky
     above the air track and a cropped pendulum. */
  var CH_MAP = { track: 470, table: 565, pendulum: 560, cradle: 525, crash: 445 };
  var GW = 980, GH = 250, GDPR = 1;
  var cvs, ctx, gcvs, gctx;

  var COL = {
    accent: '#ff4081', accentRGB: '255,64,129',
    b1: '#ff4081', b1d: '#c2185b', b1l: '#ff94b8',
    b2: '#f5c842', b2d: '#c9a01f', b2l: '#ffe28a',
    green: '#3ddc84', red: '#ff5555', gold: '#f5c842',
    text: '#dde3f0', dim: '#7d8ba8', line: '#2a3050'
  };

  function setupCanvas() {
    layout();
    DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    cvs.width = Math.round(CW * DPR);
    cvs.height = Math.round(CH * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    GDPR = DPR;
    gcvs.width = Math.round(GW * GDPR);
    gcvs.height = Math.round(GH * GDPR);
    gctx.setTransform(GDPR, 0, 0, GDPR, 0, 0);
  }

  /* Pointer → logical canvas coordinates. Uses CW (logical), never
     cvs.width (device) — mixing the two is the classic off-by-DPR bug. */
  function toCanvas(ev) {
    var r = cvs.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * (CW / r.width), y: (ev.clientY - r.top) * (CH / r.height) };
  }

  function rr(c, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* Studio background: vertical gradient + an accent spotlight behind the
     subject. Drawn first, pure, and the single biggest lift-off-the-page win. */
  function sceneBg(c, W, H, gx, gy, rgb) {
    var base = c.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, '#11151f'); base.addColorStop(0.62, '#0b0e15'); base.addColorStop(1, '#080a10');
    c.fillStyle = base; c.fillRect(0, 0, W, H);
    var glow = c.createRadialGradient(gx, gy, 20, gx, gy, Math.max(W, H) * 0.52);
    glow.addColorStop(0, 'rgba(' + (rgb || COL.accentRGB) + ',0.11)');
    glow.addColorStop(1, 'rgba(' + (rgb || COL.accentRGB) + ',0)');
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
  }

  /* Squashed radial ellipse on the surface — without one, objects float. */
  function contactShadow(c, cx, cy, rx, ry, alpha) {
    c.save();
    var g = c.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, 'rgba(0,0,0,' + (alpha || 0.5) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.translate(cx, cy); c.scale(1, ry / rx); c.translate(-cx, -cy);
    c.fillStyle = g;
    c.beginPath(); c.arc(cx, cy, rx, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  /* Brushed / anodised metal fill for a horizontal body. */
  function metalFill(c, x, y, w, h, dark, mid, light) {
    var g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0.00, light);
    g.addColorStop(0.18, mid);
    g.addColorStop(0.52, dark);
    g.addColorStop(0.80, mid);
    g.addColorStop(1.00, dark);
    c.fillStyle = g;
  }

  /* A sphere/knob with the light coming from the upper-left, consistently
     with every other highlight in the scene. */
  function sphere(c, cx, cy, r, base, light, dark) {
    var g = c.createRadialGradient(cx - r * 0.38, cy - r * 0.42, r * 0.08, cx, cy, r * 1.06);
    g.addColorStop(0, light); g.addColorStop(0.42, base); g.addColorStop(1, dark);
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1; c.stroke();
    /* tight specular — broad white reads as plastic */
    c.beginPath();
    c.ellipse(cx - r * 0.36, cy - r * 0.40, r * 0.26, r * 0.17, -0.6, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fill();
  }

  /* Text with a dark halo so labels stay readable over any background. */
  function halo(c, txt, x, y, font, fill, align, base) {
    c.save();
    c.font = font || '600 13px "Segoe UI", system-ui, sans-serif';
    c.textAlign = align || 'center';
    c.textBaseline = base || 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 4;
    c.strokeStyle = 'rgba(4,6,12,0.85)';
    c.strokeText(txt, x, y);
    c.fillStyle = fill || COL.text;
    c.fillText(txt, x, y);
    c.restore();
  }

  /* Arrow with a proper solid head; length is always proportional to the
     quantity it represents (never a fixed decorative glyph). */
  function arrow(c, x, y, dx, dy, col, width, headScale) {
    var len = Math.hypot(dx, dy);
    if (len < 1.2) return;
    var hs = Math.min(len * 0.42, (headScale || 11) + (width || 3) * 1.4);
    var ux = dx / len, uy = dy / len;
    var bx = x + dx - ux * hs, by = y + dy - uy * hs;
    c.save();
    c.strokeStyle = col; c.lineWidth = width || 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.lineTo(bx, by); c.stroke();
    var px = -uy, py = ux, hw = hs * 0.46;
    c.beginPath();
    c.moveTo(x + dx, y + dy);
    c.lineTo(bx + px * hw, by + py * hw);
    c.lineTo(bx - px * hw, by - py * hw);
    c.closePath();
    c.fillStyle = col; c.fill();
    c.restore();
  }

  /* The centre-of-mass marker: the standard black/white quartered disc. */
  function comMarker(c, cx, cy, r) {
    c.save();
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = '#f2f5ff'; c.fill();
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r, -Math.PI / 2, 0); c.closePath();
    c.fillStyle = '#11151f'; c.fill();
    c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r, Math.PI / 2, Math.PI); c.closePath();
    c.fillStyle = '#11151f'; c.fill();
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.4; c.stroke();
    c.restore();
  }

  function dashLine(c, x1, y1, x2, y2, col, w, pat) {
    c.save(); c.setLineDash(pat || [5, 5]); c.strokeStyle = col; c.lineWidth = w || 1;
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore();
  }

  /* ═══════════════════════ §9  Rig 1 — the air track ═══════════════════════ */

  var TX0 = 66, TX1 = 914, TY = 330, TBENCH = 400;   // track surface & bench top
  var TSC = (TX1 - TX0) / TRACK_LEN;                 // px per metre

  /* Recomputes the canvas height and any geometry derived from it. Called
     from setupCanvas(), so every rig change re-sizes the backing store once
     — never per frame. */
  function layout() {
    CH = CH_MAP[S.appa] || 520;
    TBENCH = CH - 70;
    TY = TBENCH - 70;
  }
  /* Track coordinate → pixels. frameDX() is zero in the lab frame; in the
     centre-of-mass frame it slides the WHOLE bench so the centre of mass
     stays pinned, which is what changing frame actually means. */
  function tx(x) { return TX0 + (x + frameDX()) * TSC; }

  function drawTrack() {
    var c = ctx, b = S.bodies, b1 = b[0], b2 = b[1];
    sceneBg(c, CW, CH, CW / 2, 330, COL.accentRGB);

    drawBench(c, TBENCH);
    drawTrackRail(c);
    drawPhotogates(c);

    /* Shadows first so both gliders sit on the rail, then the bodies. */
    contactShadow(c, tx(b1.x), TY + 5, b1.r * TSC * 1.15, 8, 0.55);
    contactShadow(c, tx(b2.x), TY + 5, b2.r * TSC * 1.15, 8, 0.55);
    drawGlider(c, b1, COL.b1, COL.b1d, COL.b1l, '1');
    drawGlider(c, b2, COL.b2, COL.b2d, COL.b2l, '2');

    /* The spring flash of an explosion, drawn between the gliders. */
    if (S.type === 'explosion' && S.exploded && S.t < 0.25) {
      var mid = (tx(b1.x) + tx(b2.x)) / 2;
      var a = 1 - S.t / 0.25;
      c.save(); c.globalAlpha = a;
      var fg = c.createRadialGradient(mid, TY - 22, 2, mid, TY - 22, 60);
      fg.addColorStop(0, 'rgba(255,236,180,0.9)'); fg.addColorStop(1, 'rgba(255,150,40,0)');
      c.fillStyle = fg; c.beginPath(); c.arc(mid, TY - 22, 60, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    if (S.flags.grid) drawTrackScale(c);
    drawOverlays1D();
    drawTitleStrip('1D collision · air track ' + fmt(TRACK_LEN, 2) + ' m' +
                   (S.tr.friction ? ' · FRICTION ON (external force)' : ' · frictionless'),
                   S.tr.friction ? COL.gold : COL.dim);
  }

  /* A laboratory bench: laminate top with a warm front edge and a soft
     gradient into shadow underneath. Cheap, and it grounds the whole scene. */
  function drawBench(c, y) {
    var g = c.createLinearGradient(0, y, 0, y + 90);
    g.addColorStop(0, '#2a2f3d'); g.addColorStop(0.12, '#1e2330'); g.addColorStop(1, '#12151d');
    c.fillStyle = g; c.fillRect(0, y, CW, CH - y);
    c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(0, y, CW, 1.5);
    c.save(); c.globalAlpha = 0.16;
    for (var i = 0; i < 26; i++) {
      var yy = y + 8 + i * 3.4;
      c.strokeStyle = i % 3 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.05)';
      c.lineWidth = 1; c.beginPath(); c.moveTo(0, yy); c.lineTo(CW, yy); c.stroke();
    }
    c.restore();
  }

  /* The rail itself: an extruded aluminium triangular section seen slightly
     from above, so it reads as a solid object rather than a line. */
  function drawTrackRail(c) {
    var topH = 12, faceH = 30;
    /* legs */
    [tx(0) + 40, tx(TRACK_LEN / 2), tx(TRACK_LEN) - 40].forEach(function (lx) {
      c.fillStyle = '#171b26';
      c.fillRect(lx - 7, TY + faceH + topH - 4, 14, TBENCH - (TY + faceH + topH) + 4);
      c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(lx - 7, TY + faceH + topH - 4, 2, TBENCH - (TY + faceH + topH) + 4);
      contactShadow(c, lx, TBENCH + 1, 26, 6, 0.5);
    });
    var RX0 = tx(0), RX1 = tx(TRACK_LEN), RW = RX1 - RX0;
    /* top running surface */
    metalFill(c, RX0, TY - topH, RW, topH, '#5a6479', '#8d97ad', '#c3cbdb');
    c.fillRect(RX0, TY - topH, RW, topH);
    /* front face, darker, with the air holes */
    var fg = c.createLinearGradient(0, TY, 0, TY + faceH);
    fg.addColorStop(0, '#78829a'); fg.addColorStop(0.35, '#4e5768'); fg.addColorStop(1, '#2b3140');
    c.fillStyle = fg; c.fillRect(RX0, TY, RW, faceH);
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(RX0, TY + 0.5); c.lineTo(RX1, TY + 0.5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.20)'; c.fillRect(RX0, TY - topH, RW, 1.5);

    /* air holes — and, when the pump is on, a faint plume above each */
    var on = !S.tr.friction;
    var T = perfNow() / 1000;
    for (var x = RX0 + 14; x < RX1 - 8; x += 16) {
      c.beginPath(); c.arc(x, TY + 13, 2.1, 0, Math.PI * 2);
      c.fillStyle = '#151922'; c.fill();
      c.beginPath(); c.arc(x, TY + 12.3, 2.1, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,255,255,0.10)'; c.fill();
      if (on) {
        var ph = ((T * 0.9 + x * 0.013) % 1);
        c.save(); c.globalAlpha = 0.10 * (1 - ph);
        c.fillStyle = '#bcd4ff';
        c.beginPath(); c.ellipse(x, TY + 12 - ph * 9, 1.6, 3 + ph * 3, 0, 0, Math.PI * 2); c.fill();
        c.restore();
      }
    }
    /* sprung end stops */
    drawEndStop(c, RX0, 1); drawEndStop(c, RX1, -1);
  }

  function drawEndStop(c, x, dir) {
    c.save();
    var w = 12, h = 46;
    metalFill(c, x - (dir > 0 ? w : 0), TY - h, w, h, '#3e4657', '#69748c', '#9aa4bb');
    c.fillRect(x - (dir > 0 ? w : 0), TY - h, w, h + 30);
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1;
    c.strokeRect(x - (dir > 0 ? w : 0) + 0.5, TY - h + 0.5, w, h + 30);
    /* the rubber buffer face */
    c.fillStyle = '#8c3040';
    c.fillRect(x + (dir > 0 ? 0 : -4), TY - h + 6, 4, h - 10);
    c.restore();
  }

  function drawTrackScale(c) {
    /* Sits between the rail and the action dock; +44 put the caption under
       the dock at the shortest canvas height. */
    var y = TY + 36;
    c.save();
    c.strokeStyle = 'rgba(220,230,255,0.28)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(TX0, y + 0.5); c.lineTo(TX1, y + 0.5); c.stroke();
    for (var i = 0; i <= 20; i++) {
      var x = tx(i * 0.1), maj = i % 5 === 0;
      c.beginPath(); c.moveTo(x + 0.5, y); c.lineTo(x + 0.5, y + (maj ? 9 : 5)); c.stroke();
      if (maj) halo(c, dv(i * 0.1, 'len', 1), x, y + 18, '600 11px "Segoe UI", system-ui, sans-serif', COL.dim);
    }
    halo(c, 'position (' + uL('len') + ')', (TX0 + TX1) / 2, y + 32, '600 11px "Segoe UI", system-ui, sans-serif', COL.dim);
    c.restore();
  }

  function drawPhotogates(c) {
    [GATE_A, GATE_B].forEach(function (gx, i) {
      var x = tx(gx);
      var lit = gateBlocked(gx);
      c.save();
      /* post */
      c.fillStyle = '#1b2130'; c.fillRect(x - 4, TY - 100, 8, 66);
      c.fillStyle = 'rgba(255,255,255,0.07)'; c.fillRect(x - 4, TY - 100, 2, 66);
      /* the U-shaped gate head straddling the rail */
      c.fillStyle = '#242b3d';
      rr(c, x - 26, TY - 116, 52, 20, 4); c.fill();
      c.strokeStyle = '#39425c'; c.lineWidth = 1; c.stroke();
      /* LED */
      c.beginPath(); c.arc(x, TY - 106, 4, 0, Math.PI * 2);
      c.fillStyle = lit ? COL.red : '#2f3648'; c.fill();
      if (lit) {
        var gl = c.createRadialGradient(x, TY - 106, 1, x, TY - 106, 16);
        gl.addColorStop(0, 'rgba(255,85,85,0.5)'); gl.addColorStop(1, 'rgba(255,85,85,0)');
        c.fillStyle = gl; c.beginPath(); c.arc(x, TY - 106, 16, 0, Math.PI * 2); c.fill();
      }
      /* the beam across the track */
      c.save();
      c.globalAlpha = lit ? 0.15 : 0.42;
      c.strokeStyle = '#ff6b6b'; c.lineWidth = 1.4; c.setLineDash([3, 4]);
      c.beginPath(); c.moveTo(x, TY - 96); c.lineTo(x, TY - 6); c.stroke();
      c.restore();
      halo(c, 'GATE ' + (i ? 'B' : 'A'), x, TY - 128, '700 10px "Segoe UI", system-ui, sans-serif', COL.dim);
      var g = S.gateRead && S.gateRead[i];
      if (g != null) halo(c, dv(g, 'vel', 2) + ' ' + uL('vel'), x, TY - 141,
                          '700 11px "Segoe UI", system-ui, sans-serif', COL.green);
      c.restore();
    });
  }

  function gateBlocked(gx) {
    for (var i = 0; i < S.bodies.length; i++) {
      var b = S.bodies[i];
      if (Math.abs(b.x - gx) < b.r) return true;
    }
    return false;
  }

  /* A glider: the inverted-V aluminium body that rides the rail, with a
     coloured top plate so it can be told apart from its partner, a card
     "sail", and whichever bumper the collision type calls for. */
  function drawGlider(c, b, base, dark, light, tag) {
    var x = tx(b.x), hw = b.r * TSC, h = 40;
    var top = TY - 12 - h;
    c.save();

    /* body — trapezoid, wider at the bottom where it wraps the rail */
    c.beginPath();
    c.moveTo(x - hw * 0.72, top);
    c.lineTo(x + hw * 0.72, top);
    c.lineTo(x + hw, TY - 2);
    c.lineTo(x - hw, TY - 2);
    c.closePath();
    var g = c.createLinearGradient(0, top, 0, TY);
    g.addColorStop(0, '#aab4c8'); g.addColorStop(0.20, '#7c86a0');
    g.addColorStop(0.55, '#525c73'); g.addColorStop(1, '#343c4e');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.stroke();
    /* brushed streaks */
    c.save(); c.clip(); c.globalAlpha = 0.10;
    for (var i = 0; i < 7; i++) {
      c.strokeStyle = i % 2 ? '#fff' : '#000'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x - hw, top + 4 + i * 5.2); c.lineTo(x + hw, top + 4 + i * 5.2); c.stroke();
    }
    c.restore();

    /* coloured identity plate on top */
    rr(c, x - hw * 0.74, top - 9, hw * 1.48, 12, 3);
    var pg = c.createLinearGradient(0, top - 9, 0, top + 3);
    pg.addColorStop(0, light); pg.addColorStop(0.5, base); pg.addColorStop(1, dark);
    c.fillStyle = pg; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();

    /* the card sail, with the glider number on it */
    var sw = 26, sh = 30;
    c.fillStyle = '#e8edf7';
    c.fillRect(x - sw / 2, top - 9 - sh, sw, sh);
    c.strokeStyle = 'rgba(0,0,0,0.35)'; c.strokeRect(x - sw / 2 + 0.5, top - 9 - sh + 0.5, sw, sh);
    c.fillStyle = dark; c.fillRect(x - sw / 2, top - 9 - sh, sw, 7);
    halo(c, tag, x, top - 9 - sh / 2 + 3, '800 15px "Segoe UI", system-ui, sans-serif', '#1a1f2c');

    drawBumper(c, x, hw, top, TY, base, tag === '1' ? 1 : -1);
    c.restore();
  }

  /* Elastic → a real steel spring. Perfectly inelastic → a velcro pad.
     Partly elastic → a rubber block. The bumper is the physics, so it
     should be visibly different in each case. */
  function drawBumper(c, x, hw, top, ty, base, dir) {
    var by = (top + ty) / 2 + 2;
    var xe = x + dir * hw;
    var e = activeE();
    c.save();
    if (S.type === 'inelastic' || e <= 0.001) {
      c.fillStyle = '#4a3b2c';
      c.fillRect(dir > 0 ? xe : xe - 7, by - 9, 7, 18);
      c.save(); c.globalAlpha = 0.6;
      for (var i = 0; i < 9; i++) {
        var yy = by - 8 + i * 2;
        c.strokeStyle = '#8a7050'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(dir > 0 ? xe : xe - 7, yy); c.lineTo(dir > 0 ? xe + 7 : xe, yy); c.stroke();
      }
      c.restore();
    } else if (e > 0.94) {
      /* helical spring drawn as a coil */
      c.strokeStyle = '#c9d2e4'; c.lineWidth = 2; c.lineJoin = 'round';
      c.beginPath();
      var L = 13, turns = 4;
      for (var t = 0; t <= 1.001; t += 0.02) {
        var px = xe + dir * t * L;
        var py = by + Math.sin(t * turns * Math.PI * 2) * 7;
        if (t === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 0.8; c.stroke();
    } else {
      var rg = c.createLinearGradient(0, by - 9, 0, by + 9);
      rg.addColorStop(0, '#5b6272'); rg.addColorStop(0.5, '#2f3542'); rg.addColorStop(1, '#1d2230');
      c.fillStyle = rg;
      rr(c, dir > 0 ? xe : xe - 9, by - 9, 9, 18, 3); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1; c.stroke();
    }
    c.restore();
  }

  /* ═══════════════════════ §10  Shared overlays ═══════════════════════ */

  function perfNow() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  /* Arrow scaling. Fixed px-per-unit so that two arrows on screen are
     genuinely comparable — a momentum arrow twice as long IS twice the
     momentum. Never auto-fit, or the comparison silently lies. */
  var VSC = 105;      // px per (m/s)
  var PSC = 230;      // px per (kg·m/s) — re-scaled per set-up, see setArrowScale()

  /* Momentum and velocity have different units, so their px-per-unit scales
     are a free choice. Pinning them so that EQUAL masses give equal-length
     arrows is the choice that teaches: the two sets of arrows then coincide
     until you change a mass, and the difference you see afterwards is exactly
     the mass ratio. Fixed at reset, never per frame, so lengths stay
     comparable throughout a run. */
  function setArrowScale() {
    var m = 0, n = 0, i;
    if (S.bodies.length) {
      for (i = 0; i < S.bodies.length; i++) { m += S.bodies[i].m; n++; }
    } else if (S.appa === 'cradle' && S.cradle) { m = S.cr.m; n = 1; }
    else if (S.appa === 'crash') { m = S.cs.m1; n = 1; }
    else { m = 1; n = 1; }
    PSC = VSC / Math.max(1e-6, m / n);
  }

  /* Velocity seen from whichever frame is selected. */
  function vShown(b) {
    if (!S.flags.cmframe) return { x: b.vx, y: b.vy };
    var v = comVel(S.bodies);
    return { x: b.vx - v.x, y: b.vy - v.y };
  }
  function frameDX() {
    if (!S.flags.cmframe || S.cmRef == null || !S.bodies.length) return 0;
    return S.cmRef - comPos(S.bodies).x;
  }

  function drawTitleStrip(txt, col) {
    halo(ctx, txt, 18, 22, '700 12px "Segoe UI", system-ui, sans-serif', col || COL.dim, 'left');
    if (S.flags.cmframe) {
      halo(ctx, 'CENTRE-OF-MASS FRAME', 18, 40, '800 11px "Segoe UI", system-ui, sans-serif', COL.accent, 'left');
    }
  }

  function drawOverlays1D() {
    var c = ctx, b = S.bodies;
    if (b.length < 2) return;
    var y1 = TY - 74, cols = [COL.b1, COL.b2];

    /* trail */
    if (S.flags.path) {
      for (var i = 0; i < 2; i++) {
        var arr = S.paths[i];
        if (arr.length < 2) continue;
        c.save(); c.globalAlpha = 0.5; c.strokeStyle = cols[i]; c.lineWidth = 2;
        c.setLineDash([2, 4]);
        c.beginPath();
        for (var j = 0; j < arr.length; j++) {
          var px = tx(arr[j].x);
          if (j === 0) c.moveTo(px, TY + 34); else c.lineTo(px, TY + 34);
        }
        c.stroke(); c.restore();
      }
    }

    for (var k = 0; k < 2; k++) {
      var bd = b[k], x = tx(bd.x), v = vShown(bd);
      var ay = TY - 96 - k * 26;
      if (S.flags.vel) {
        arrow(c, x, ay, v.x * VSC, 0, cols[k], 3.4);
        if (S.flags.values && Math.abs(v.x) > 0.02) {
          halo(c, 'v=' + dv(v.x, 'vel', 2), x + v.x * VSC / 2, ay - 12,
               '700 11px "Segoe UI", system-ui, sans-serif', cols[k]);
        }
      }
      if (S.flags.mom) {
        var p = bd.m * v.x;
        arrow(c, x, ay + 13, p * PSC, 0, k ? '#ffd76b' : '#ff8ab4', 5.2, 13);
        if (S.flags.values && Math.abs(p) > 0.005) {
          halo(c, 'p=' + dv(p, 'mom', 2), x + p * PSC / 2, ay + 25,
               '700 11px "Segoe UI", system-ui, sans-serif', k ? '#ffd76b' : '#ff8ab4');
        }
      }
      if (S.flags.values) {
        halo(c, dv(bd.m, 'mass', 3) + ' ' + uL('mass'), x, TY + 22,
             '700 11px "Segoe UI", system-ui, sans-serif', cols[k]);
      }
    }

    if (S.flags.cm) drawCM1D();
    if (S.flags.ke) drawEnergyBars(c, 18, 62);
    drawLegend(c);
  }

  function drawCM1D() {
    var c = ctx, cm = comPos(S.bodies), v = comVel(S.bodies);
    var x = tx(cm.x);
    dashLine(c, x, TY - 160, x, TY + 40, 'rgba(255,255,255,0.35)', 1.2, [4, 5]);
    comMarker(c, x, TY - 150, 8);
    if (!S.flags.cmframe) {
      arrow(c, x, TY - 168, v.x * VSC, 0, '#e8edf7', 2.6, 9);
      halo(c, 'v_cm = ' + dv(v.x, 'vel', 3) + ' ' + uL('vel'), x, TY - 184,
           '700 11px "Segoe UI", system-ui, sans-serif', '#e8edf7');
    } else {
      halo(c, 'v_cm = 0 in this frame', x, TY - 168, '700 11px "Segoe UI", system-ui, sans-serif', '#e8edf7');
    }
  }

  /* Kinetic-energy column chart. Height maps linearly from the value, and
     the scale is pinned to the initial total so the columns visibly shrink
     when energy is lost rather than silently rescaling. */
  function drawEnergyBars(c, x, y) {
    var b = S.bodies;
    if (!b.length) return;
    var k1 = 0.5 * b[0].m * (b[0].vx * b[0].vx + b[0].vy * b[0].vy);
    var k2 = b[1] ? 0.5 * b[1].m * (b[1].vx * b[1].vx + b[1].vy * b[1].vy) : 0;
    var kt = k1 + k2;
    var ref = S.keRef || Math.max(kt, 1e-6);
    var H = 108, W = 22;
    c.save();
    c.fillStyle = 'rgba(12,16,25,0.62)';
    rr(c, x - 8, y - 20, 128, H + 46, 9); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; c.stroke();
    halo(c, 'KINETIC ENERGY', x + 52, y - 8, '800 10px "Segoe UI", system-ui, sans-serif', COL.dim);
    var items = [{ v: k1, col: COL.b1, l: '1' }, { v: k2, col: COL.b2, l: '2' }, { v: kt, col: '#8fa0c0', l: 'Σ' }];
    for (var i = 0; i < items.length; i++) {
      var bx = x + 8 + i * 36, h = Math.max(1, Math.min(1, items[i].v / ref) * H);
      c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(bx, y, W, H);
      var g = c.createLinearGradient(0, y + H - h, 0, y + H);
      g.addColorStop(0, items[i].col); g.addColorStop(1, 'rgba(0,0,0,0.35)');
      c.fillStyle = g; c.fillRect(bx, y + H - h, W, h);
      halo(c, items[i].l, bx + W / 2, y + H + 11, '700 10px "Segoe UI", system-ui, sans-serif', COL.dim);
      halo(c, fmtSmart(toD(items[i].v, 'energy')), bx + W / 2, y + H + 24,
           '700 10px "Segoe UI", system-ui, sans-serif', items[i].col);
    }
    halo(c, uL('energy'), x + 52, y + H + 37, '600 10px "Segoe UI", system-ui, sans-serif', COL.dim);
    c.restore();
  }

  function drawLegend(c) {
    if (!S.flags.vel && !S.flags.mom) return;
    /* sits under the display panel, which is collapsed by default */
    var x = CW - 168, y = 104;
    c.save();
    c.fillStyle = 'rgba(12,16,25,0.6)';
    rr(c, x - 10, y - 12, 158, (S.flags.vel ? 18 : 0) + (S.flags.mom ? 18 : 0) + 20, 8); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.stroke();
    var yy = y + 2;
    if (S.flags.vel) {
      arrow(c, x, yy, 30, 0, COL.b1, 3);
      halo(c, dv(1 / VSC * 30, 'vel', 2) + ' ' + uL('vel'), x + 38, yy, '600 11px "Segoe UI", system-ui, sans-serif', COL.dim, 'left');
      yy += 18;
    }
    if (S.flags.mom) {
      arrow(c, x, yy, 30, 0, '#ff8ab4', 5, 12);
      halo(c, dv(1 / PSC * 30, 'mom', 2) + ' ' + uL('mom'), x + 38, yy, '600 11px "Segoe UI", system-ui, sans-serif', COL.dim, 'left');
    }
    c.restore();
  }

  /* ═══════════════════════ §11  Rig 2 — the air table (2D) ═══════════════════════ */

  var TBSC = 470, TBX0 = 114, TBY0 = 78;
  function bx(x) { return TBX0 + x * TBSC; }
  function by(y) { return TBY0 + y * TBSC; }

  function drawTable() {
    var c = ctx, b = S.bodies, b1 = b[0], b2 = b[1];
    sceneBg(c, CW, CH, CW / 2, CH / 2, COL.accentRGB);

    var X = bx(0), Y = by(0), W = TABLE_W * TBSC, H = TABLE_H * TBSC;

    /* cushioned rail frame */
    c.save();
    rr(c, X - 16, Y - 16, W + 32, H + 32, 14);
    var fg = c.createLinearGradient(0, Y - 16, 0, Y + H + 16);
    fg.addColorStop(0, '#3a4256'); fg.addColorStop(0.5, '#232a3a'); fg.addColorStop(1, '#161b27');
    c.fillStyle = fg; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1; c.stroke();
    c.restore();

    /* playing surface, with a subtle vignette so it reads as a physical bed */
    c.save();
    rr(c, X, Y, W, H, 5); c.clip();
    var sg = c.createLinearGradient(0, Y, 0, Y + H);
    sg.addColorStop(0, '#14314a'); sg.addColorStop(0.55, '#0f2438'); sg.addColorStop(1, '#0b1a29');
    c.fillStyle = sg; c.fillRect(X, Y, W, H);
    /* perforations */
    c.globalAlpha = 0.5;
    for (var px2 = X + 12; px2 < X + W; px2 += 17) {
      for (var py2 = Y + 12; py2 < Y + H; py2 += 17) {
        c.beginPath(); c.arc(px2, py2, 1.15, 0, Math.PI * 2);
        c.fillStyle = '#06121d'; c.fill();
        c.beginPath(); c.arc(px2, py2 - 0.5, 1.15, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,0.06)'; c.fill();
      }
    }
    c.globalAlpha = 1;

    if (S.flags.grid) {
      c.strokeStyle = 'rgba(150,190,240,0.14)'; c.lineWidth = 1;
      for (var gx2 = 0; gx2 <= TABLE_W + 1e-6; gx2 += 0.2) {
        c.beginPath(); c.moveTo(bx(gx2) + 0.5, Y); c.lineTo(bx(gx2) + 0.5, Y + H); c.stroke();
      }
      for (var gy2 = 0; gy2 <= TABLE_H + 1e-6; gy2 += 0.2) {
        c.beginPath(); c.moveTo(X, by(gy2) + 0.5); c.lineTo(X + W, by(gy2) + 0.5); c.stroke();
      }
      halo(c, '0.20 ' + uL('len') + ' grid', X + 8, Y + H - 10, '600 10px "Segoe UI", system-ui, sans-serif', 'rgba(190,215,245,0.55)', 'left');
    }

    /* the line of the incoming puck and the impact parameter b */
    if (S.hits === 0) {
      dashLine(c, bx(b1.x), by(b1.y), X + W, by(b1.y), 'rgba(255,64,129,0.35)', 1.4, [6, 6]);
      if (Math.abs(b2.y - b1.y) > 1e-4) {
        var xb = bx(b2.x);
        dashLine(c, xb, by(b1.y), xb, by(b2.y), 'rgba(255,255,255,0.45)', 1.4, [3, 4]);
        halo(c, 'b = ' + dv(Math.abs(b2.y - b1.y), 'lenSmall', 1) + ' ' + uL('lenSmall'),
             xb + 8, (by(b1.y) + by(b2.y)) / 2, '700 11px "Segoe UI", system-ui, sans-serif', '#e8edf7', 'left');
      }
    }

    /* trails */
    if (S.flags.path) {
      for (var i = 0; i < 2; i++) {
        var arr = S.paths[i];
        if (arr.length < 2) continue;
        c.save(); c.globalAlpha = 0.55; c.strokeStyle = i ? COL.b2 : COL.b1; c.lineWidth = 2;
        c.beginPath();
        for (var j = 0; j < arr.length; j++) {
          if (j === 0) c.moveTo(bx(arr[j].x), by(arr[j].y)); else c.lineTo(bx(arr[j].x), by(arr[j].y));
        }
        c.stroke(); c.restore();
      }
    }
    c.restore();

    drawPuck(c, b1, COL.b1, COL.b1l, COL.b1d, '1');
    drawPuck(c, b2, COL.b2, COL.b2l, COL.b2d, '2');

    drawOverlays2D();
    drawTitleStrip('2D collision · air table ' + fmt(TABLE_W, 2) + ' × ' + fmt(TABLE_H, 2) + ' m · frictionless pucks', COL.dim);
  }

  function drawPuck(c, b, base, light, dark, tag) {
    var x = bx(b.x), y = by(b.y), r = b.r * TBSC;
    contactShadow(c, x + 4, y + 6, r * 1.25, r * 0.55, 0.55);
    c.save();
    /* bevelled body */
    sphere(c, x, y, r, base, light, dark);
    /* flat top face so it reads as a disc, not a ball */
    var tg = c.createLinearGradient(0, y - r * 0.75, 0, y + r * 0.4);
    tg.addColorStop(0, light); tg.addColorStop(1, base);
    c.beginPath(); c.arc(x, y, r * 0.72, 0, Math.PI * 2); c.fillStyle = tg; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; c.stroke();
    /* centre dot marks the centre of mass of the puck */
    c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fillStyle = 'rgba(20,24,34,0.8)'; c.fill();
    halo(c, tag, x, y - r * 0.34, '800 14px "Segoe UI", system-ui, sans-serif', '#1c2130');
    c.restore();
  }

  function drawOverlays2D() {
    var c = ctx, b = S.bodies, cols = [COL.b1, COL.b2];
    for (var k = 0; k < 2; k++) {
      var bd = b[k], x = bx(bd.x), y = by(bd.y), v = vShown(bd);
      if (S.flags.vel) {
        arrow(c, x, y, v.x * VSC, v.y * VSC, cols[k], 3.4);
        if (S.flags.values && Math.hypot(v.x, v.y) > 0.02) {
          halo(c, fmt(toD(Math.hypot(v.x, v.y), 'vel'), 2) + ' ' + uL('vel'),
               x + v.x * VSC * 0.55, y + v.y * VSC * 0.55 - 12,
               '700 11px "Segoe UI", system-ui, sans-serif', cols[k]);
        }
      }
      if (S.flags.mom) {
        arrow(c, x, y, bd.m * v.x * PSC, bd.m * v.y * PSC, k ? '#ffd76b' : '#ff8ab4', 5.2, 13);
      }
      if (S.flags.values) {
        halo(c, dv(bd.m, 'mass', 3) + ' ' + uL('mass'), x, y + bd.r * TBSC + 14,
             '700 11px "Segoe UI", system-ui, sans-serif', cols[k]);
      }
    }

    /* separation angle — the headline result of a 2D collision */
    if (S.hits > 0) {
      var v1 = b[0], v2 = b[1];
      var s1 = Math.hypot(v1.vx, v1.vy), s2 = Math.hypot(v2.vx, v2.vy);
      if (s1 > 1e-3 && s2 > 1e-3) {
        var dot = (v1.vx * v2.vx + v1.vy * v2.vy) / (s1 * s2);
        var ang = Math.acos(clamp(dot, -1, 1)) * 180 / Math.PI;
        var good = Math.abs(ang - 90) < 0.6;
        halo(c, 'separation angle = ' + fmt(ang, 1) + '°' + (good ? '   ✓ 90° rule' : ''),
             CW / 2, 26, '800 14px "Segoe UI", system-ui, sans-serif',
             good ? COL.green : COL.text);
      }
    }

    if (S.flags.cm) {
      var cm = comPos(S.bodies), vc = comVel(S.bodies);
      var cx = bx(cm.x), cy = by(cm.y);
      comMarker(c, cx, cy, 8);
      if (!S.flags.cmframe) arrow(c, cx, cy, vc.x * VSC, vc.y * VSC, '#e8edf7', 2.4, 9);
      halo(c, 'CM', cx, cy - 17, '700 11px "Segoe UI", system-ui, sans-serif', '#e8edf7');
    }
    if (S.flags.ke) drawEnergyBars(c, 18, 62);
    drawLegend(c);
  }

  /* ═══════════════════════ §12  Rig 3 — ballistic pendulum ═══════════════════════ */

  var PSCL = 320;                       // px per metre
  var PIVX = 640, PIVY = 96;

  function drawPendulum() {
    var c = ctx, p = S.pd, st = S.pdState;
    sceneBg(c, CW, CH, PIVX - 60, 300, COL.accentRGB);
    drawBench(c, 486);

    var L = p.L * PSCL;
    var th = st.theta;
    var bxp = PIVX + Math.sin(th) * L, byp = PIVY + Math.cos(th) * L;

    /* stand */
    c.fillStyle = '#1b2130';
    c.fillRect(PIVX + 150, PIVY - 16, 16, 486 - PIVY + 16);
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(PIVX + 150, PIVY - 16, 3, 486 - PIVY + 16);
    c.fillStyle = '#232a3a'; rr(c, PIVX - 16, PIVY - 22, 208, 14, 4); c.fill();  /* cantilever arm reaching the pivot */
    c.fillStyle = '#141924'; rr(c, PIVX + 96, 478, 150, 12, 4); c.fill();
    contactShadow(c, PIVX + 170, 492, 110, 12, 0.55);

    /* protractor scale — a real one, reading the maximum swing */
    drawSwingScale(c, PIVX, PIVY, L, st);

    /* bifilar suspension */
    c.strokeStyle = '#9aa6c0'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(PIVX - 3, PIVY); c.lineTo(bxp - 3, byp); c.stroke();
    c.beginPath(); c.moveTo(PIVX + 3, PIVY); c.lineTo(bxp + 3, byp); c.stroke();
    c.beginPath(); c.arc(PIVX, PIVY, 5, 0, Math.PI * 2); c.fillStyle = '#c3cbdb'; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1; c.stroke();

    /* wooden block */
    var bw = 74, bh = 62;
    c.save();
    c.translate(bxp, byp); c.rotate(th);
    var wg = c.createLinearGradient(-bw / 2, 0, bw / 2, 0);
    wg.addColorStop(0, '#6b4a2c'); wg.addColorStop(0.35, '#8b6238'); wg.addColorStop(1, '#563a22');
    rr(c, -bw / 2, 0, bw, bh, 4); c.fillStyle = wg; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1; c.stroke();
    c.save(); c.clip(); c.globalAlpha = 0.22;
    for (var i = 0; i < 7; i++) {
      c.strokeStyle = i % 2 ? '#3a2717' : '#a87c4a'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(-bw / 2, 6 + i * 8); c.lineTo(bw / 2, 6 + i * 8 + (i % 3) - 1); c.stroke();
    }
    c.restore();
    /* the embedded bullet, once it is in */
    if (st.phase === 'swinging' || st.phase === 'hanging') {
      c.beginPath(); c.arc(-bw / 2 + 14, bh / 2, 5, 0, Math.PI * 2);
      c.fillStyle = '#2a1a10'; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.6)'; c.stroke();
    }
    halo(c, dv(p.M, 'mass', 2) + ' ' + uL('mass'), 0, bh / 2, '800 13px "Segoe UI", system-ui, sans-serif', '#f4e3cc');
    c.restore();

    /* gun */
    drawGun(c, PIVX - L * 0.02 - 300, PIVY + L, st);

    /* bullet in flight */
    if (st.phase === 'flying') {
      var bulletX = PIVX + S.bodies[0].x * PSCL;
      c.save();
      c.beginPath(); c.ellipse(bulletX, PIVY + L + 30, 8, 3.4, 0, 0, Math.PI * 2);
      var bg = c.createLinearGradient(bulletX - 8, 0, bulletX + 8, 0);
      bg.addColorStop(0, '#5c4630'); bg.addColorStop(0.6, '#d9b483'); bg.addColorStop(1, '#8a6b47');
      c.fillStyle = bg; c.fill();
      c.globalAlpha = 0.35; c.strokeStyle = '#ffd9a0'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(bulletX - 40, PIVY + L + 30); c.lineTo(bulletX - 9, PIVY + L + 30); c.stroke();
      c.restore();
      halo(c, dv(p.vb, 'vel', 0) + ' ' + uL('vel'), bulletX, PIVY + L + 14,
           '800 13px "Segoe UI", system-ui, sans-serif', COL.b1);
    }

    /* the height gained, drawn as a real measurement */
    if (st.phase === 'swinging' || st.phase === 'hanging') {
      var h = p.L * (1 - Math.cos(st.thetaMax));
      var yTop = PIVY + Math.cos(st.thetaMax) * L;
      dashLine(c, PIVX - 250, PIVY + L, PIVX + 240, PIVY + L, 'rgba(255,255,255,0.25)', 1, [5, 5]);
      dashLine(c, PIVX - 250, yTop, PIVX + 240, yTop, 'rgba(61,220,132,0.45)', 1.2, [5, 5]);
      var hx = PIVX - 232;
      arrow(c, hx, PIVY + L, 0, -(PIVY + L - yTop), COL.green, 2.2, 9);
      halo(c, 'h = ' + dv(h, 'lenSmall', 1) + ' ' + uL('lenSmall'), hx + 8, (PIVY + L + yTop) / 2,
           '800 13px "Segoe UI", system-ui, sans-serif', COL.green, 'left');
      halo(c, 'θmax = ' + fmt(st.thetaMax * 180 / Math.PI, 1) + '°', PIVX + 10, PIVY + 30,
           '800 13px "Segoe UI", system-ui, sans-serif', COL.gold, 'left');
    }

    drawTitleStrip('Ballistic pendulum · momentum through the impact, energy up the swing', COL.dim);
  }

  function drawSwingScale(c, px, py, L, st) {
    c.save();
    c.strokeStyle = 'rgba(220,230,255,0.22)'; c.lineWidth = 1;
    var R = L + 46;
    c.beginPath(); c.arc(px, py, R, Math.PI / 2 - 1.2, Math.PI / 2 + 0.06); c.stroke();
    for (var d = 0; d <= 70; d += 5) {
      var a = Math.PI / 2 - d * Math.PI / 180;
      var maj = d % 10 === 0;
      c.beginPath();
      c.moveTo(px + Math.cos(a) * R, py + Math.sin(a) * R);
      c.lineTo(px + Math.cos(a) * (R + (maj ? 10 : 5)), py + Math.sin(a) * (R + (maj ? 10 : 5)));
      c.strokeStyle = 'rgba(220,230,255,' + (maj ? 0.5 : 0.25) + ')';
      c.stroke();
      if (maj && d > 0) {
        halo(c, d + '°', px + Math.cos(a) * (R + 22), py + Math.sin(a) * (R + 22),
             '600 10px "Segoe UI", system-ui, sans-serif', COL.dim);
      }
    }
    /* the pawl that a real ballistic pendulum uses to hold the maximum */
    if (st.thetaMax > 0) {
      var am = Math.PI / 2 - st.thetaMax;
      c.strokeStyle = COL.gold; c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(px + Math.cos(am) * (R - 8), py + Math.sin(am) * (R - 8));
      c.lineTo(px + Math.cos(am) * (R + 12), py + Math.sin(am) * (R + 12));
      c.stroke();
    }
    c.restore();
  }

  function drawGun(c, x, y, st) {
    c.save();
    /* barrel */
    metalFill(c, x, y - 12, 130, 24, '#2b3140', '#4d5566', '#848ea4');
    rr(c, x, y - 12, 130, 24, 4); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#0b0e14';
    c.beginPath(); c.ellipse(x + 130, y, 4, 10, 0, 0, Math.PI * 2); c.fill();
    /* breech + mount */
    c.fillStyle = '#1b2130'; rr(c, x - 34, y - 20, 40, 40, 5); c.fill();
    c.fillStyle = '#161b27'; c.fillRect(x - 20, y + 18, 14, 486 - y - 18);
    contactShadow(c, x - 13, 490, 42, 8, 0.5);
    /* muzzle flash */
    if (st.phase === 'flying' && S.t < 0.05) {
      var fg2 = c.createRadialGradient(x + 134, y, 2, x + 134, y, 46);
      fg2.addColorStop(0, 'rgba(255,240,190,0.95)'); fg2.addColorStop(1, 'rgba(255,140,40,0)');
      c.fillStyle = fg2; c.beginPath(); c.arc(x + 134, y, 46, 0, Math.PI * 2); c.fill();
    }
    halo(c, 'm = ' + fmtSmart(toD(S.pd.mb, 'mass')) + ' ' + uL('mass'), x + 64, y - 30,
         '700 12px "Segoe UI", system-ui, sans-serif', COL.b1);
    c.restore();
  }

  /* ═══════════════════════ §13  Rig 4 — Newton's cradle ═══════════════════════ */

  function drawCradle() {
    var c = ctx, C = S.cradle;
    sceneBg(c, CW, CH, CW / 2, 300, COL.accentRGB);
    drawBench(c, 486);
    if (!C) return;

    var pivY = 132, Lp = 250, R = 25;
    var spacing = R * 2 + 0.6;
    var x0 = CW / 2 - (C.n - 1) * spacing / 2;

    /* chrome frame */
    var fx0 = x0 - 74, fx1 = x0 + (C.n - 1) * spacing + 74;
    c.save();
    /* the two upright chrome posts */
    [fx0, fx1].forEach(function (fx) {
      var g = c.createLinearGradient(fx - 7, 0, fx + 7, 0);
      g.addColorStop(0, '#39404f'); g.addColorStop(0.32, '#c1c9da');
      g.addColorStop(0.60, '#6c7688'); g.addColorStop(1, '#2c323f');
      c.fillStyle = g; c.fillRect(fx - 7, pivY - 46, 14, 486 - pivY + 46);
      c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1;
      c.strokeRect(fx - 7.5, pivY - 46.5, 15, 486 - pivY + 46);
      contactShadow(c, fx, 489, 34, 7, 0.55);
    });
    /* two suspension bars, front and back, so the V-strings read correctly */
    [-16, 16].forEach(function (dz) {
      var g2 = c.createLinearGradient(0, pivY + dz - 4, 0, pivY + dz + 4);
      g2.addColorStop(0, '#cdd5e6'); g2.addColorStop(0.45, '#8992a6'); g2.addColorStop(1, '#39404f');
      c.fillStyle = g2;
      rr(c, fx0, pivY + dz - 4, fx1 - fx0, 8, 3); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(fx0, pivY + dz - 4, fx1 - fx0, 1.6);
    });
    /* base plate */
    c.fillStyle = '#171c28'; rr(c, fx0 - 22, 478, fx1 - fx0 + 44, 14, 4); c.fill();
    c.restore();

    for (var i = 0; i < C.n; i++) {
      var b = C.balls[i];
      var hx = x0 + i * spacing;
      var cx = hx + Math.sin(b.th) * Lp, cy = pivY + Math.cos(b.th) * Lp;
      /* V strings to both bars */
      c.strokeStyle = 'rgba(210,220,240,0.55)'; c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(hx, pivY - 16); c.lineTo(cx, cy); c.stroke();
      c.beginPath(); c.moveTo(hx, pivY + 16); c.lineTo(cx, cy); c.stroke();
      contactShadow(c, cx + 3, 486, R * 1.1, 8, 0.35);
      /* polished steel ball */
      sphere(c, cx, cy, R, '#9aa4b8', '#f2f6ff', '#2b3140');
      /* a horizon reflection line is what makes chrome look like chrome */
      c.save();
      c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.10)';
      c.fillRect(cx - R, cy + R * 0.18, R * 2, R * 0.30);
      c.fillStyle = 'rgba(0,0,0,0.28)';
      c.fillRect(cx - R, cy + R * 0.48, R * 2, R * 0.6);
      c.restore();
      if (S.flags.vel || S.flags.mom) {
        var v = b.om * C.L;
        if (S.flags.vel) arrow(c, cx, cy, v * VSC * 0.6, 0, COL.accent, 3);
        if (S.flags.mom) arrow(c, cx, cy + 12, b.m * v * PSC * 0.6, 0, '#ffd76b', 4.6, 12);
      }
      if (S.flags.values) {
        halo(c, String(i + 1), cx, cy, '800 13px "Segoe UI", system-ui, sans-serif', 'rgba(20,24,34,0.75)');
      }
    }

    if (S.flags.ke) drawEnergyBars(c, 18, 62);
    var tot = 0, ke = 0;
    for (var q = 0; q < C.n; q++) { var vv = C.balls[q].om * C.L; tot += C.balls[q].m * vv; ke += 0.5 * C.balls[q].m * vv * vv; }
    halo(c, 'Σp = ' + dv(tot, 'mom', 3) + ' ' + uL('mom') + '     ΣKE = ' + fmtSmart(toD(ke, 'energy')) + ' ' + uL('energy'),
         CW / 2, CH - 24, '700 13px "Segoe UI", system-ui, sans-serif', COL.text);
    drawTitleStrip('Newton’s cradle · ' + C.n + ' balls · lift ' + C.lift +
                   ' · e = ' + fmt(activeE(), 3), COL.dim);
  }

  /* ═══════════════════════ §14  Rig 5 — crash test ═══════════════════════ */

  var CSCL = 74, ROADY = 342;             // px per metre, road surface

  function drawCrash() {
    var c = ctx, p = S.cs, cr = S.crash;
    sceneBg(c, CW, CH, 300, 300, '255,110,64');

    /* road */
    var rg = c.createLinearGradient(0, ROADY, 0, CH);
    rg.addColorStop(0, '#2a2f3b'); rg.addColorStop(0.1, '#1d222c'); rg.addColorStop(1, '#12161e');
    c.fillStyle = rg; c.fillRect(0, ROADY, CW, CH - ROADY);
    c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(0, ROADY, CW, 1.5);
    c.save(); c.globalAlpha = 0.35;
    for (var d = -((cr.x1 * CSCL) % 60); d < CW; d += 60) {
      c.fillStyle = '#7a8296'; c.fillRect(d, ROADY + 44, 30, 3);
    }
    c.restore();

    var barrierX = CW - 150;
    var carX = barrierX - 150 - (CRASH_RUN - cr.x1) * CSCL * 0.32;
    carX = clamp(carX, 60, barrierX - 150 + cr.crushed1 * CSCL * 1.6);

    if (p.target === 'barrier') drawBarrier(c, barrierX);
    else {
      var car2X = barrierX - 40;
      drawCar(c, car2X, ROADY, -1, COL.b2, cr.crushed2, p.m2, false);
    }

    drawCar(c, carX, ROADY, 1, COL.b1, cr.crushed1, p.m1, true);

    /* impact flash + debris */
    if (cr.phase === 'impact') {
      var tau = clamp(cr.t / cr.dt, 0, 1);
      var ix = carX + 150, iy = ROADY - 40;
      c.save(); c.globalAlpha = Math.sin(Math.PI * tau) * 0.85;
      var fg3 = c.createRadialGradient(ix, iy, 4, ix, iy, 90);
      fg3.addColorStop(0, 'rgba(255,245,210,0.9)'); fg3.addColorStop(0.4, 'rgba(255,150,50,0.5)');
      fg3.addColorStop(1, 'rgba(255,90,30,0)');
      c.fillStyle = fg3; c.beginPath(); c.arc(ix, iy, 90, 0, Math.PI * 2); c.fill();
      c.restore();
      for (var k2 = 0; k2 < 14; k2++) {
        var a2 = (k2 / 14) * Math.PI * 2 + 0.4, rr2 = 20 + tau * 110 * (0.5 + (k2 % 5) / 6);
        c.save(); c.globalAlpha = (1 - tau) * 0.8;
        c.fillStyle = k2 % 3 ? '#c9d2e4' : '#ffb072';
        c.fillRect(ix + Math.cos(a2) * rr2, iy + Math.sin(a2) * rr2 * 0.7, 3, 3);
        c.restore();
      }
    }

    drawForceGauge(c);
    drawTitleStrip('Crash rig · ' + (p.target === 'barrier' ? 'rigid barrier' : 'vehicle-to-vehicle') +
                   ' · crumple ' + dv(p.crumple, 'lenSmall', 0) + ' ' + uL('lenSmall'), COL.dim);
  }

  function drawBarrier(c, x) {
    c.save();
    var g = c.createLinearGradient(x, 0, x + 60, 0);
    g.addColorStop(0, '#6b7284'); g.addColorStop(0.25, '#464e5f'); g.addColorStop(1, '#262c38');
    c.fillStyle = g; c.fillRect(x, ROADY - 190, 60, 190);
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1; c.strokeRect(x + 0.5, ROADY - 190.5, 60, 190);
    /* hazard chevrons */
    c.save(); c.beginPath(); c.rect(x, ROADY - 190, 60, 190); c.clip();
    for (var i = -6; i < 14; i++) {
      c.fillStyle = i % 2 ? '#f5c842' : '#1b2130';
      c.beginPath();
      c.moveTo(x - 20 + i * 22, ROADY);
      c.lineTo(x - 20 + i * 22 + 22, ROADY);
      c.lineTo(x - 20 + i * 22 + 22 + 60, ROADY - 190);
      c.lineTo(x - 20 + i * 22 + 60, ROADY - 190);
      c.closePath(); c.fill();
    }
    c.restore();
    c.globalAlpha = 0.25; c.fillStyle = '#000'; c.fillRect(x, ROADY - 190, 60, 190);
    c.restore();
    halo(c, 'RIGID BARRIER', x + 30, ROADY - 202, '800 11px "Segoe UI", system-ui, sans-serif', COL.dim);
  }

  /* Side elevation. The nose shortens by the crush distance and the bonnet
     buckles — the crumple is drawn from the same number the physics uses. */
  function drawCar(c, x, gy, dir, col, crush, mass, showOcc) {
    var L = 150, H = 62, wheelR = 17;
    var crushPx = crush * CSCL;
    c.save();
    if (dir < 0) { c.translate(x + L, 0); c.scale(-1, 1); c.translate(-x, 0); }

    contactShadow(c, x + L / 2, gy + 4, L * 0.55, 10, 0.6);

    var nose = x + L - crushPx;
    /* body */
    c.beginPath();
    c.moveTo(x + 6, gy - 6);
    c.lineTo(x + 2, gy - 32);
    c.lineTo(x + 34, gy - 38);
    c.lineTo(x + 54, gy - H);
    c.lineTo(x + 104 - crushPx * 0.25, gy - H);
    c.lineTo(nose - 6, gy - 34 + crushPx * 0.10);
    c.lineTo(nose, gy - 26 + crushPx * 0.16);
    c.lineTo(nose - 2, gy - 6);
    c.closePath();
    var bg = c.createLinearGradient(0, gy - H, 0, gy);
    bg.addColorStop(0, shadeHex(col, 1.45)); bg.addColorStop(0.32, col);
    bg.addColorStop(0.72, shadeHex(col, 0.62)); bg.addColorStop(1, shadeHex(col, 0.4));
    c.fillStyle = bg; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.2; c.stroke();
    /* long specular streak along the flank */
    c.save(); c.clip();
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.fillRect(x, gy - H + 12, L, 4);
    /* buckle lines appear as the nose crushes */
    if (crushPx > 3) {
      c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1.4;
      for (var i = 0; i < 5; i++) {
        var bxx = nose - 8 - i * 9;
        c.beginPath();
        c.moveTo(bxx, gy - 34);
        c.lineTo(bxx + 5, gy - 22);
        c.lineTo(bxx, gy - 8);
        c.stroke();
      }
    }
    c.restore();
    /* glass */
    c.beginPath();
    c.moveTo(x + 40, gy - 38); c.lineTo(x + 58, gy - H + 5);
    c.lineTo(x + 100 - crushPx * 0.25, gy - H + 5); c.lineTo(x + 100 - crushPx * 0.25, gy - 38);
    c.closePath();
    var gg = c.createLinearGradient(0, gy - H, 0, gy - 38);
    gg.addColorStop(0, 'rgba(180,215,255,0.42)'); gg.addColorStop(1, 'rgba(90,130,180,0.20)');
    c.fillStyle = gg; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 1; c.stroke();

    /* occupant + restraint */
    if (showOcc) {
      var ox = x + 74, oy = gy - 46;
      c.save();
      if (S.crash.phase === 'impact' || S.crash.phase === 'after') {
        var lean = S.cs.restraint === 'none' ? 16 : (S.cs.restraint === 'belt' ? 7 : 4);
        var tau2 = clamp(S.crash.t / S.crash.dt, 0, 1);
        c.translate(lean * Math.sin(Math.PI * tau2 * 0.5), 0);
      }
      c.beginPath(); c.arc(ox, oy, 7, 0, Math.PI * 2);
      c.fillStyle = '#e8d5b8'; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.stroke();
      c.fillStyle = '#39415a'; rr(c, ox - 6, oy + 6, 12, 20, 3); c.fill();
      if (S.cs.restraint !== 'none') {
        c.strokeStyle = '#d8dfee'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(ox - 6, oy + 24); c.lineTo(ox + 7, oy + 7); c.stroke();
      }
      c.restore();
      if (S.cs.restraint === 'airbag' && (S.crash.phase === 'impact' || S.crash.phase === 'after')) {
        var infl = clamp(S.crash.t / (S.crash.dt * 0.45), 0, 1);
        c.save(); c.globalAlpha = 0.9;
        c.beginPath(); c.ellipse(ox + 20, oy + 4, 20 * infl, 16 * infl, 0, 0, Math.PI * 2);
        var ag = c.createRadialGradient(ox + 14, oy - 2, 2, ox + 20, oy + 4, 22 * infl);
        ag.addColorStop(0, 'rgba(255,255,255,0.95)'); ag.addColorStop(1, 'rgba(200,215,240,0.55)');
        c.fillStyle = ag; c.fill();
        c.restore();
      }
    }

    /* wheels */
    [x + 34, x + L - 34 - crushPx * 0.35].forEach(function (wx) {
      c.beginPath(); c.arc(wx, gy - wheelR + 2, wheelR, 0, Math.PI * 2);
      c.fillStyle = '#12151d'; c.fill();
      c.strokeStyle = '#2b3140'; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.arc(wx, gy - wheelR + 2, wheelR * 0.5, 0, Math.PI * 2);
      c.fillStyle = '#727c92'; c.fill();
    });
    c.restore();
    halo(c, dv(mass, 'mass', 0) + ' ' + uL('mass'), x + L / 2, gy - H - 14,
         '800 12px "Segoe UI", system-ui, sans-serif', col);
  }

  function shadeHex(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = clamp(Math.round(((n >> 16) & 255) * f), 0, 255);
    var g = clamp(Math.round(((n >> 8) & 255) * f), 0, 255);
    var b = clamp(Math.round((n & 255) * f), 0, 255);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* A live force gauge: peak force so far and the g-force on the occupant.
     This is the readout a crash lab actually watches. */
  function drawForceGauge(c) {
    var cr = S.crash;
    var x = 24, y = 40, w = 250, h = 122;
    c.save();
    c.fillStyle = 'rgba(12,16,25,0.66)';
    rr(c, x, y, w, h, 10); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1; c.stroke();
    halo(c, 'IMPACT MONITOR', x + w / 2, y + 15, '800 10px "Segoe UI", system-ui, sans-serif', COL.dim);
    var F = cr.Fnow || 0;
    var frac = cr.Fpk ? clamp(F / cr.Fpk, 0, 1) : 0;
    /* peak-hold bar */
    c.fillStyle = 'rgba(255,255,255,0.06)'; rr(c, x + 16, y + 26, w - 32, 14, 7); c.fill();
    var bg2 = c.createLinearGradient(x + 16, 0, x + w - 16, 0);
    bg2.addColorStop(0, COL.green); bg2.addColorStop(0.55, COL.gold); bg2.addColorStop(1, COL.red);
    c.save(); rr(c, x + 16, y + 26, Math.max(2, (w - 32) * frac), 14, 7); c.clip();
    c.fillStyle = bg2; c.fillRect(x + 16, y + 26, w - 32, 14); c.restore();
    var rows = [
      ['Peak force', dvu(cr.Fpk || 0, 'forceBig', 1)],
      ['Average force', dvu(cr.Favg || 0, 'forceBig', 1)],
      ['Contact time', fmt((cr.dt || 0) * 1000, 0) + ' ms'],
      ['Occupant load', fmt(cr.gOcc || 0, 0) + ' g']
    ];
    for (var i = 0; i < rows.length; i++) {
      halo(c, rows[i][0], x + 16, y + 56 + i * 16, '600 11px "Segoe UI", system-ui, sans-serif', COL.dim, 'left');
      var danger = (i === 3 && (cr.gOcc || 0) > 60);
      halo(c, rows[i][1], x + w - 16, y + 56 + i * 16, '700 11px "Segoe UI", system-ui, sans-serif',
           danger ? COL.red : COL.text, 'right');
    }
    c.restore();
  }

  /* ═══════════════════════ §15  The graph canvas ═══════════════════════ */

  var GPAD = { l: 62, r: 18, t: 34, b: 30 };

  function gAxes(c, xlab, ylab, xmin, xmax, ymin, ymax) {
    var x0 = GPAD.l, x1 = GW - GPAD.r, y0 = GPAD.t, y1 = GH - GPAD.b;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1;
    for (var i = 0; i <= 4; i++) {
      var y = y0 + (y1 - y0) * i / 4;
      c.beginPath(); c.moveTo(x0, y + 0.5); c.lineTo(x1, y + 0.5); c.stroke();
      var v = ymax - (ymax - ymin) * i / 4;
      halo(c, fmtSmart(v), x0 - 8, y, '600 10px "Segoe UI", system-ui, sans-serif', COL.dim, 'right');
    }
    c.strokeStyle = 'rgba(255,255,255,0.22)';
    c.beginPath(); c.moveTo(x0 + 0.5, y0); c.lineTo(x0 + 0.5, y1); c.lineTo(x1, y1); c.stroke();
    /* zero line, if the range straddles it */
    if (ymin < 0 && ymax > 0) {
      var yz = y1 - (0 - ymin) / (ymax - ymin) * (y1 - y0);
      dashLine(c, x0, yz, x1, yz, 'rgba(255,255,255,0.30)', 1, [4, 4]);
    }
    for (var k = 0; k <= 4; k++) {
      var x = x0 + (x1 - x0) * k / 4;
      halo(c, fmt(xmin + (xmax - xmin) * k / 4, 2), x, y1 + 12, '600 10px "Segoe UI", system-ui, sans-serif', COL.dim);
    }
    halo(c, xlab, (x0 + x1) / 2, GH - 6, '700 10px "Segoe UI", system-ui, sans-serif', COL.dim);
    halo(c, ylab, x0 - 4, y0 - 16, '700 11px "Segoe UI", system-ui, sans-serif', COL.dim, 'left');
    c.restore();
    return { x0: x0, x1: x1, y0: y0, y1: y1, xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax };
  }
  function gx_(A, v) { return A.x0 + (v - A.xmin) / (A.xmax - A.xmin || 1) * (A.x1 - A.x0); }
  function gy_(A, v) { return A.y1 - (v - A.ymin) / (A.ymax - A.ymin || 1) * (A.y1 - A.y0); }

  function drawGraph() {
    var c = gctx;
    c.clearRect(0, 0, GW, GH);
    var bgg = c.createLinearGradient(0, 0, 0, GH);
    bgg.addColorStop(0, '#0e121b'); bgg.addColorStop(1, '#080b11');
    c.fillStyle = bgg; c.fillRect(0, 0, GW, GH);

    if (S.graph === 'bars') drawGraphBars(c);
    else if (S.graph === 'ft') drawGraphFt(c);
    else drawGraphSeries(c, S.graph);
  }

  /* Before/after comparison. Momentum bars always match; energy bars only
     match at e = 1. Seeing the two pairs side by side is the whole lesson. */
  function drawGraphBars(c) {
    var B = S.before, A = S.after;
    if (!B) { halo(c, 'Run a collision to fill this chart', GW / 2, GH / 2, '600 13px "Segoe UI", system-ui, sans-serif', COL.dim); return; }
    var pB = toD(B.p.x, 'mom'), pA = A ? toD(A.p.x, 'mom') : null;
    var kB = toD(B.ke, 'energy'), kA = A ? toD(A.ke, 'energy') : null;

    var pMax = Math.max(Math.abs(pB), Math.abs(pA || 0), 1e-9);
    var kMax = Math.max(kB, kA || 0, 1e-9);

    var groups = [
      { title: 'Total momentum  (' + uL('mom') + ')', x: GW * 0.06, w: GW * 0.40,
        vals: [{ l: 'before', v: pB, c: COL.accent }, { l: 'after', v: pA, c: '#ff8ab4' }],
        max: pMax, signed: true,
        ok: A ? Math.abs(pA - pB) <= Math.max(1e-6, Math.abs(pB) * 0.005) : null },
      { title: 'Total kinetic energy  (' + uL('energy') + ')', x: GW * 0.54, w: GW * 0.40,
        vals: [{ l: 'before', v: kB, c: COL.gold }, { l: 'after', v: kA, c: '#ffe28a' }],
        max: kMax, signed: false,
        ok: A ? Math.abs(kA - kB) <= Math.max(1e-9, kB * 0.005) : null }
    ];

    for (var g = 0; g < groups.length; g++) {
      var G0 = groups[g];
      halo(c, G0.title, G0.x + G0.w / 2, 20, '700 12px "Segoe UI", system-ui, sans-serif', COL.text);
      var baseY = G0.signed ? GH - 62 : GH - 34;
      var H = G0.signed ? 70 : 100;
      c.save();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(G0.x, baseY + 0.5); c.lineTo(G0.x + G0.w, baseY + 0.5); c.stroke();
      c.restore();
      for (var i = 0; i < G0.vals.length; i++) {
        var vv = G0.vals[i];
        if (vv.v == null) continue;
        var bw = G0.w * 0.26, bxp = G0.x + G0.w * (0.16 + i * 0.44);
        var h = Math.abs(vv.v) / G0.max * H;
        var top = vv.v >= 0 ? baseY - h : baseY;
        var gr = c.createLinearGradient(0, top, 0, top + h);
        gr.addColorStop(0, vv.c); gr.addColorStop(1, 'rgba(0,0,0,0.35)');
        c.fillStyle = gr; c.fillRect(bxp, top, bw, Math.max(1, h));
        c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1; c.strokeRect(bxp + 0.5, top + 0.5, bw, Math.max(1, h));
        halo(c, fmtSmart(vv.v), bxp + bw / 2, vv.v >= 0 ? top - 10 : top + h + 10,
             '700 12px "Segoe UI", system-ui, sans-serif', vv.c);
        halo(c, vv.l, bxp + bw / 2, GH - 12, '600 11px "Segoe UI", system-ui, sans-serif', COL.dim);
      }
      if (G0.ok != null) {
        halo(c, G0.ok ? '✓ conserved' : '✗ not conserved', G0.x + G0.w / 2, 36,
             '800 11px "Segoe UI", system-ui, sans-serif', G0.ok ? COL.green : COL.red);
      }
    }
  }

  var WINDOW_S = 6;    // seconds of history shown on the rolling series plots

  function drawGraphSeries(c, kind) {
    var all = S.trace;
    if (all.length < 2) { halo(c, 'Press Run to plot', GW / 2, GH / 2, '600 13px "Segoe UI", system-ui, sans-serif', COL.dim); return; }
    /* A long run (the cradle swings for many seconds) would otherwise
       compress hundreds of cycles into a solid block of ink. Show a rolling
       window instead, and say so on the axis. */
    var tEnd = all[all.length - 1].t;
    var tStart = Math.max(0, tEnd - WINDOW_S);
    var tr = tStart > 0 ? all.filter(function (r) { return r.t >= tStart; }) : all;
    if (tr.length < 2) tr = all;

    var isV = kind === 'vt';
    var keys = isV ? ['v1', 'v2'] : ['p1', 'p2', 'pt'];
    var unit = isV ? 'vel' : 'mom';
    var lo = 0, hi = 0;
    for (var i = 0; i < tr.length; i++) {
      for (var k = 0; k < keys.length; k++) {
        var v = tr[i][keys[k]];
        if (v == null) continue;
        v = toD(v, unit);
        if (v < lo) lo = v; if (v > hi) hi = v;
      }
    }
    var pad = (hi - lo) * 0.15 || 1;
    var A = gAxes(c, 'time (s)' + (tStart > 0 ? ' — last ' + WINDOW_S + ' s' : ''),
                  (isV ? 'velocity (' + uL('vel') + ')' : 'momentum (' + uL('mom') + ')'),
                  tr[0].t, Math.max(tr[0].t + 0.4, tEnd), lo - pad, hi + pad);
    var cols = isV ? [COL.b1, COL.b2] : [COL.b1, COL.b2, '#9fb0d0'];
    var names = isV ? ['v₁', 'v₂'] : ['p₁', 'p₂', 'p total'];
    for (var s2 = 0; s2 < keys.length; s2++) {
      c.save();
      c.strokeStyle = cols[s2]; c.lineWidth = s2 === 2 ? 2.6 : 2;
      if (s2 === 2) c.setLineDash([6, 4]);
      c.beginPath();
      var started = false;
      for (var j = 0; j < tr.length; j++) {
        var y = tr[j][keys[s2]];
        if (y == null) continue;
        var X = gx_(A, tr[j].t), Y = gy_(A, toD(y, unit));
        if (!started) { c.moveTo(X, Y); started = true; } else c.lineTo(X, Y);
      }
      c.stroke(); c.restore();
    }
    /* boxed key, so the labels never sit on top of the traces */
    c.save();
    var lw = 78, lh = 8 + keys.length * 15;
    c.fillStyle = 'rgba(10,14,22,0.82)';
    rr(c, GW - GPAD.r - lw, GPAD.t + 4, lw, lh, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.10)'; c.lineWidth = 1; c.stroke();
    for (var q = 0; q < keys.length; q++) {
      var yy = GPAD.t + 16 + q * 15;
      c.strokeStyle = cols[q]; c.lineWidth = q === 2 ? 2.6 : 2;
      if (q === 2) c.setLineDash([5, 3]); else c.setLineDash([]);
      c.beginPath(); c.moveTo(GW - GPAD.r - lw + 8, yy); c.lineTo(GW - GPAD.r - lw + 28, yy); c.stroke();
      c.setLineDash([]);
      halo(c, names[q], GW - GPAD.r - lw + 34, yy, '700 11px "Segoe UI", system-ui, sans-serif', cols[q], 'left');
    }
    c.restore();
  }

  /* The impulse curve. The shaded area IS the impulse, and it is printed
     next to the momentum change so the student can see they are equal. */
  function drawGraphFt(c) {
    /* Only the FIRST contact pulse. Scanning to the last F>0 sample in the
       whole trace would span a rebound collision too, and the plot would show
       two spikes separated by a second of nothing. */
    var tr = S.trace, has = false, fmax = 0, t0 = 0, t1 = 0;
    for (var i = 0; i < tr.length; i++) {
      if (tr[i].F > 0) { if (!has) { t0 = tr[i].t; has = true; } t1 = tr[i].t; if (tr[i].F > fmax) fmax = tr[i].F; }
      else if (has) break;                       // pulse over
    }
    if (!has) {
      halo(c, 'Run a collision — the contact force appears here', GW / 2, GH / 2 - 8, '600 13px "Segoe UI", system-ui, sans-serif', COL.dim);
      halo(c, 'area under the curve = impulse = change in momentum', GW / 2, GH / 2 + 12, '600 11px "Segoe UI", system-ui, sans-serif', COL.dim);
      return;
    }
    var span = Math.max(t1 - t0, 1e-4);
    /* Plot in kN (or kip): a crash peaks near half a million newtons and the
       raw axis labels are unreadable. */
    var fk = 'forceBig';
    var A = gAxes(c, 'time (ms, from first contact)', 'contact force (' + uL(fk) + ')',
                  0, span * 1000, 0, toD(fmax, fk) * 1.2);
    c.save();
    c.beginPath();
    c.moveTo(gx_(A, 0), gy_(A, 0));
    for (var j = 0; j < tr.length; j++) {
      if (tr[j].t < t0 - 1e-9 || tr[j].t > t1 + 1e-9) continue;
      c.lineTo(gx_(A, (tr[j].t - t0) * 1000), gy_(A, toD(tr[j].F, fk)));
    }
    c.lineTo(gx_(A, span * 1000), gy_(A, 0));
    c.closePath();
    var fg = c.createLinearGradient(0, A.y0, 0, A.y1);
    fg.addColorStop(0, 'rgba(255,64,129,0.45)'); fg.addColorStop(1, 'rgba(255,64,129,0.06)');
    c.fillStyle = fg; c.fill();
    c.strokeStyle = COL.accent; c.lineWidth = 2.2; c.stroke();
    c.restore();
    /* On the crash rig the impulse and pulse width are known from the start,
       so show them while the pulse is still being drawn rather than 0. */
    var J = Math.abs(S.lastImpulse), Jdt = S.lastDt || 0;
    if (S.appa === 'crash' && S.crash) { J = S.crash.J || J; Jdt = S.crash.dt || Jdt; }
    halo(c, 'area = J = ' + fmtSmart(toD(J, 'mom')) + ' ' + uL('mom') +
            '   ·   Δt = ' + fmt(Jdt * 1000, 1) + ' ms' +
            '   ·   F peak = ' + fmtSmart(toD(fmax, fk)) + ' ' + uL(fk),
         GW / 2, 16, '700 12px "Segoe UI", system-ui, sans-serif', COL.text);
  }

  /* ═══════════════════════ §16  draw() — pure render ═══════════════════════ */

  function draw() {
    ctx.clearRect(0, 0, CW, CH);
    if (S.appa === 'track') drawTrack();
    else if (S.appa === 'table') drawTable();
    else if (S.appa === 'pendulum') drawPendulum();
    else if (S.appa === 'cradle') drawCradle();
    else drawCrash();
    drawGraph();
  }

  /* ═══════════════════════ §17  Control specifications ═══════════════════════
     Every slider is declared once here: where its value lives, its SI range,
     and which unit kind it displays in. The row builder does the rest, so
     adding a control to a rig never means touching the HTML. */

  function SPEC() {
    var e = S.type === 'partial';
    if (S.appa === 'track') {
      var rows = [
        { get: 'tr.m1', lab: 'Mass m₁', min: 0.05, max: 1.5, step: 0.005, kind: 'mass', dp: 3, sw: 'b1' },
        { get: 'tr.u1', lab: 'Velocity u₁', min: -2.5, max: 2.5, step: 0.01, kind: 'vel', dp: 2, sw: 'b1',
          hide: S.type === 'explosion' },
        { get: 'tr.m2', lab: 'Mass m₂', min: 0.05, max: 1.5, step: 0.005, kind: 'mass', dp: 3, sw: 'b2' },
        { get: 'tr.u2', lab: 'Velocity u₂', min: -2.5, max: 2.5, step: 0.01, kind: 'vel', dp: 2, sw: 'b2',
          hide: S.type === 'explosion' }
      ];
      if (e) rows.push({ get: 'tr.e', lab: 'Restitution e', min: 0, max: 1, step: 0.01, kind: null, dp: 2 });
      if (S.type === 'explosion') rows.push({ get: 'tr.spring', lab: 'Spring energy', min: 0.02, max: 3, step: 0.01, kind: 'energy', dp: 2 });
      /* Friction lives on the canvas dock, not down here — it is something you
         flip mid-experiment, and "air pump off" meant nothing to anyone who
         had not met an air track before. */
      return { rows: rows, chips: [] };
    }
    if (S.appa === 'table') {
      var r2 = [
        { get: 'tb.m1', lab: 'Mass m₁', min: 0.05, max: 1.2, step: 0.005, kind: 'mass', dp: 3, sw: 'b1' },
        { get: 'tb.u1', lab: 'Speed u₁', min: 0.05, max: 2.0, step: 0.01, kind: 'vel', dp: 2, sw: 'b1' },
        { get: 'tb.m2', lab: 'Mass m₂', min: 0.05, max: 1.2, step: 0.005, kind: 'mass', dp: 3, sw: 'b2' },
        { get: 'tb.u2', lab: 'Velocity u₂', min: -1.5, max: 1.5, step: 0.01, kind: 'vel', dp: 2, sw: 'b2' },
        { get: 'tb.b', lab: 'Impact parameter', min: -1, max: 1, step: 0.01, kind: null, dp: 2,
          note: '0 = head-on, ±1 = a graze' }
      ];
      if (e) r2.push({ get: 'tb.e', lab: 'Restitution e', min: 0, max: 1, step: 0.01, kind: null, dp: 2 });
      return { rows: r2, chips: [{ flag: 'tb.walls', lab: 'Reflecting rails' }] };
    }
    if (S.appa === 'pendulum') {
      return {
        rows: [
          { get: 'pd.mb', lab: 'Bullet mass m', min: 0.002, max: 0.060, step: 0.001, kind: 'mass', dp: 4, sw: 'b1' },
          { get: 'pd.vb', lab: 'Muzzle speed v', min: 20, max: 450, step: 1, kind: 'vel', dp: 0, sw: 'b1' },
          { get: 'pd.M', lab: 'Block mass M', min: 0.20, max: 5.0, step: 0.01, kind: 'mass', dp: 2, sw: 'b2' },
          { get: 'pd.L', lab: 'Pendulum length L', min: 0.30, max: 1.20, step: 0.01, kind: 'len', dp: 2 }
        ], chips: []
      };
    }
    if (S.appa === 'cradle') {
      var r3 = [
        { get: 'cr.n', lab: 'Number of balls', min: 3, max: 7, step: 1, kind: null, dp: 0, int: true },
        { get: 'cr.lift', lab: 'Balls lifted', min: 1, max: 4, step: 1, kind: null, dp: 0, int: true },
        { get: 'cr.ang', lab: 'Release angle', min: 8, max: 55, step: 1, kind: null, dp: 0, suffix: '°' },
        { get: 'cr.m', lab: 'Ball mass', min: 0.02, max: 0.4, step: 0.005, kind: 'mass', dp: 3 }
      ];
      if (e) r3.push({ get: 'cr.e', lab: 'Restitution e', min: 0.5, max: 1, step: 0.005, kind: null, dp: 3 });
      return { rows: r3, chips: [] };
    }
    /* crash */
    var r4 = [
      { get: 'cs.m1', lab: 'Vehicle mass', min: 600, max: 3500, step: 10, kind: 'mass', dp: 0, sw: 'b1' },
      { get: 'cs.v1', lab: 'Impact speed', min: 2, max: 40, step: 0.5, kind: 'speedBig', dp: 1, sw: 'b1' },
      { get: 'cs.crumple', lab: 'Crumple distance', min: 0.05, max: 1.5, step: 0.01, kind: 'lenSmall', dp: 0 }
    ];
    if (S.cs.target === 'car') {
      r4.push({ get: 'cs.m2', lab: 'Other vehicle mass', min: 600, max: 3500, step: 10, kind: 'mass', dp: 0, sw: 'b2' });
      r4.push({ get: 'cs.v2', lab: 'Other vehicle speed', min: -30, max: 30, step: 0.5, kind: 'speedBig', dp: 1, sw: 'b2' });
    }
    if (e) r4.push({ get: 'cs.e', lab: 'Restitution e', min: 0, max: 0.6, step: 0.01, kind: null, dp: 2 });
    return { rows: r4, chips: [] };
  }

  function getPath(p) { var a = p.split('.'); return S[a[0]][a[1]]; }
  function setPath(p, v) { var a = p.split('.'); S[a[0]][a[1]] = v; }

  function buildControls() {
    var host = $('slider-host');
    host.innerHTML = '';
    var spec = SPEC();
    var row = null;
    spec.rows.forEach(function (r, i) {
      if (r.hide) return;
      if (i % 2 === 0 || !row) { row = document.createElement('div'); row.className = 'sim-row'; host.appendChild(row); }
      row.appendChild(sliderGroup(r));
    });
    if (spec.chips.length) {
      var cr = document.createElement('div'); cr.className = 'sim-row';
      spec.chips.forEach(function (ch) {
        var btn = document.createElement('button');
        btn.className = 'toggle-chip' + (getPath(ch.flag) ? ' active' : '');
        btn.textContent = ch.lab;
        if (ch.title) btn.title = ch.title;
        btn.addEventListener('click', function () {
          setPath(ch.flag, !getPath(ch.flag));
          btn.classList.toggle('active');
          playClick(); resetRun();
        });
        cr.appendChild(btn);
      });
      /* the crash rig picks its target and its restraint here */
      if (S.appa === 'crash') {
        cr.appendChild(segmented('Target', [['barrier', 'Rigid barrier'], ['car', 'Another vehicle']],
          S.cs.target, function (v) { S.cs.target = v; buildControls(); resetRun(); }));
        cr.appendChild(segmented('Occupant', [['none', 'Unrestrained'], ['belt', 'Seat belt'], ['airbag', 'Belt + airbag']],
          S.cs.restraint, function (v) { S.cs.restraint = v; prepCrash(); refreshAll(); }));
      }
      host.appendChild(cr);
    } else if (S.appa === 'crash') {
      var cr2 = document.createElement('div'); cr2.className = 'sim-row';
      cr2.appendChild(segmented('Target', [['barrier', 'Rigid barrier'], ['car', 'Another vehicle']],
        S.cs.target, function (v) { S.cs.target = v; buildControls(); resetRun(); }));
      cr2.appendChild(segmented('Occupant', [['none', 'Unrestrained'], ['belt', 'Seat belt'], ['airbag', 'Belt + airbag']],
        S.cs.restraint, function (v) { S.cs.restraint = v; prepCrash(); refreshAll(); }));
      host.appendChild(cr2);
    }
    buildPresets();
  }

  function segmented(label, opts, cur, onPick) {
    var wrap = document.createElement('div');
    wrap.className = 'ctrl-group';
    var l = document.createElement('span'); l.className = 'ctrl-label'; l.textContent = label;
    wrap.appendChild(l);
    var tabs = document.createElement('div'); tabs.className = 'pill-tabs';
    opts.forEach(function (o) {
      var b = document.createElement('button');
      b.className = 'pill' + (o[0] === cur ? ' active' : '');
      b.textContent = o[1];
      b.addEventListener('click', function () { playClick(); onPick(o[0]); });
      tabs.appendChild(b);
    });
    wrap.appendChild(tabs);
    return wrap;
  }

  function sliderGroup(r) {
    var g = document.createElement('div');
    g.className = 'sim-slider-group';
    var id = 'sl-' + r.get.replace('.', '-');

    var lab = document.createElement('label');
    lab.className = 'sim-slider-label';
    lab.setAttribute('for', id);
    lab.innerHTML = (r.sw ? '<span class="body-swatch ' + r.sw + '"></span>' : '') + esc(r.lab);
    g.appendChild(lab);

    var sl = document.createElement('input');
    sl.type = 'range'; sl.className = 'sim-slider'; sl.id = id;
    sl.min = r.min; sl.max = r.max; sl.step = r.step; sl.value = getPath(r.get);
    sl.setAttribute('aria-label', r.lab);
    g.appendChild(sl);

    var wrap = document.createElement('div');
    wrap.className = 'stepper-wrap';
    var minus = document.createElement('button');
    minus.className = 'stepper-btn'; minus.innerHTML = '&minus;'; minus.setAttribute('aria-label', 'Decrease ' + r.lab);
    var inp = document.createElement('input');
    inp.className = 'stepper-input'; inp.type = 'number'; inp.step = 'any';
    inp.setAttribute('inputmode', 'decimal'); inp.setAttribute('aria-label', r.lab);
    var plus = document.createElement('button');
    plus.className = 'stepper-btn'; plus.textContent = '+'; plus.setAttribute('aria-label', 'Increase ' + r.lab);
    var unit = document.createElement('span');
    unit.className = 'stepper-unit';
    wrap.appendChild(minus); wrap.appendChild(inp); wrap.appendChild(plus); wrap.appendChild(unit);
    g.appendChild(wrap);

    function show() {
      var si = getPath(r.get);
      inp.value = r.kind ? fmt(toD(si, r.kind), r.dp) : fmt(si, r.dp);
      unit.textContent = r.kind ? uL(r.kind) : (r.suffix || '');
      sl.value = si;
      sl.style.setProperty('--pct', ((si - r.min) / (r.max - r.min) * 100) + '%');
    }
    function commit(si) {
      si = clamp(si, r.min, r.max);
      if (r.int) si = Math.round(si);
      setPath(r.get, si);
      show(); resetRun();
    }
    sl.addEventListener('input', function () { commit(parseFloat(sl.value)); });
    inp.addEventListener('change', function () {
      var d = parseFloat(inp.value);
      if (!isFinite(d)) { show(); return; }
      commit(r.kind ? toSI(d, r.kind) : d);
    });
    minus.addEventListener('click', function () { playClick(); commit(getPath(r.get) - r.step * (r.int ? 1 : 5)); });
    plus.addEventListener('click', function () { playClick(); commit(getPath(r.get) + r.step * (r.int ? 1 : 5)); });
    g._show = show;
    show();
    return g;
  }

  function refreshSliders() {
    var host = $('slider-host');
    var kids = host.querySelectorAll('.sim-slider-group');
    for (var i = 0; i < kids.length; i++) if (kids[i]._show) kids[i]._show();
  }

  /* ── Preset scenarios ── */
  var PRESETS = {
    track: [
      { n: 'Equal masses, head-on', f: function () { S.tr.m1 = 0.25; S.tr.m2 = 0.25; S.tr.u1 = 0.8; S.tr.u2 = -0.8; S.type = 'elastic'; } },
      { n: 'Equal masses, one at rest', f: function () { S.tr.m1 = 0.25; S.tr.m2 = 0.25; S.tr.u1 = 0.9; S.tr.u2 = 0; S.type = 'elastic'; } },
      { n: 'Heavy into light', f: function () { S.tr.m1 = 1.0; S.tr.m2 = 0.1; S.tr.u1 = 0.7; S.tr.u2 = 0; S.type = 'elastic'; } },
      { n: 'Light into heavy', f: function () { S.tr.m1 = 0.1; S.tr.m2 = 1.0; S.tr.u1 = 1.2; S.tr.u2 = 0; S.type = 'elastic'; } },
      { n: 'Catch-up collision', f: function () { S.tr.m1 = 0.5; S.tr.m2 = 0.25; S.tr.u1 = 1.0; S.tr.u2 = 0.35; S.type = 'elastic'; } },
      { n: 'Sticky (e = 0)', f: function () { S.tr.m1 = 0.4; S.tr.m2 = 0.2; S.tr.u1 = 0.9; S.tr.u2 = 0; S.type = 'inelastic'; } },
      { n: 'Explosion from rest', f: function () { S.tr.m1 = 0.6; S.tr.m2 = 0.2; S.tr.spring = 0.4; S.type = 'explosion'; } }
    ],
    table: [
      { n: 'The 90° rule', f: function () { S.tb.m1 = 0.2; S.tb.m2 = 0.2; S.tb.u1 = 0.8; S.tb.u2 = 0; S.tb.b = 0.45; S.type = 'elastic'; } },
      { n: 'Head-on, 2D', f: function () { S.tb.m1 = 0.2; S.tb.m2 = 0.2; S.tb.u1 = 0.8; S.tb.u2 = 0; S.tb.b = 0; S.type = 'elastic'; } },
      { n: 'Thin cut (graze)', f: function () { S.tb.m1 = 0.2; S.tb.m2 = 0.2; S.tb.u1 = 1.0; S.tb.u2 = 0; S.tb.b = 0.92; S.type = 'elastic'; } },
      { n: 'Unequal masses', f: function () { S.tb.m1 = 0.5; S.tb.m2 = 0.15; S.tb.u1 = 0.8; S.tb.u2 = 0; S.tb.b = 0.4; S.type = 'elastic'; } },
      { n: 'Sticky pucks', f: function () { S.tb.m1 = 0.25; S.tb.m2 = 0.25; S.tb.u1 = 0.9; S.tb.u2 = 0; S.tb.b = 0.5; S.type = 'inelastic'; } }
    ],
    pendulum: [
      { n: 'Rifle bullet', f: function () { S.pd.mb = 0.0040; S.pd.vb = 380; S.pd.M = 2.5; S.pd.L = 1.0; } },
      { n: 'Air-rifle pellet', f: function () { S.pd.mb = 0.0005 * 10; S.pd.vb = 170; S.pd.M = 0.6; S.pd.L = 0.8; } },
      { n: 'Classic lab set-up', f: function () { S.pd.mb = 0.010; S.pd.vb = 180; S.pd.M = 1.5; S.pd.L = 0.9; } },
      { n: 'Heavy block', f: function () { S.pd.mb = 0.012; S.pd.vb = 300; S.pd.M = 4.5; S.pd.L = 1.1; } }
    ],
    cradle: [
      { n: 'Lift one', f: function () { S.cr.n = 5; S.cr.lift = 1; S.cr.ang = 32; } },
      { n: 'Lift two', f: function () { S.cr.n = 5; S.cr.lift = 2; S.cr.ang = 32; } },
      { n: 'Lift three', f: function () { S.cr.n = 5; S.cr.lift = 3; S.cr.ang = 30; } },
      { n: 'Lossy cradle', f: function () { S.cr.n = 5; S.cr.lift = 1; S.cr.ang = 40; S.type = 'partial'; S.cr.e = 0.80; } }
    ],
    crash: [
      { n: 'Family car @ 50 km/h', f: function () { S.cs.m1 = 1400; S.cs.v1 = 13.9; S.cs.crumple = 0.6; S.cs.target = 'barrier'; S.cs.restraint = 'airbag'; } },
      { n: 'No crumple zone', f: function () { S.cs.m1 = 1400; S.cs.v1 = 13.9; S.cs.crumple = 0.06; S.cs.target = 'barrier'; S.cs.restraint = 'none'; } },
      { n: 'Motorway @ 100 km/h', f: function () { S.cs.m1 = 1500; S.cs.v1 = 27.8; S.cs.crumple = 0.8; S.cs.target = 'barrier'; S.cs.restraint = 'airbag'; } },
      { n: 'SUV meets hatchback', f: function () { S.cs.target = 'car'; S.cs.m1 = 2400; S.cs.v1 = 14; S.cs.m2 = 900; S.cs.v2 = -14; S.cs.crumple = 0.6; } }
    ]
  };

  /* Presets live in a dropdown rather than a row of chips: there are up to
     seven per rig and the chip row alone cost three lines of vertical space
     above the fold. The select is rebuilt whenever the rig changes, and
     resets to its placeholder so it never claims a scenario is loaded when
     the sliders have since been moved by hand. */
  function buildPresets() {
    var sel = $('preset-select');
    var list = PRESETS[S.appa] || [];
    sel.innerHTML = '<option value="">Choose a scenario&hellip;</option>' +
      list.map(function (p, i) { return '<option value="' + i + '">' + esc(p.n) + '</option>'; }).join('');
    sel.value = '';
  }

  function applyPreset(i) {
    var p = (PRESETS[S.appa] || [])[i];
    if (!p) return;
    playClick();
    p.f();
    syncTypeTabs();
    buildControls();          // rebuilds the select too, clearing the choice
    resetRun();
  }

  /* ═══════════════════════ §18  Readouts, badges & ledger ═══════════════════════ */

  function readoutSpec() {
    var b = S.bodies, B = S.before, A = S.after, e = activeE();

    if (S.appa === 'pendulum') {
      var p = S.pd, st = S.pdState;
      var V = st.V || (p.mb * p.vb / (p.mb + p.M));
      var h = st.thetaMax ? p.L * (1 - Math.cos(st.thetaMax)) : V * V / (2 * G);
      var thPred = Math.acos(clamp(1 - V * V / (2 * G * p.L), -1, 1));
      var keB = 0.5 * p.mb * p.vb * p.vb, keA = 0.5 * (p.mb + p.M) * V * V;
      return [
        { l: 'Common velocity V', v: dvu(V, 'vel', 3), hero: true },
        { l: 'Swing angle θ', v: fmt((st.thetaMax || thPred) * 180 / Math.PI, 1) + '°' },
        { l: 'Rise height h', v: dvu(h, 'lenSmall', 2) },
        { l: 'Momentum (conserved)', v: dvu(p.mb * p.vb, 'mom', 3) },
        { l: 'KE before', v: dvu(keB, 'energy', 1) },
        { l: 'KE after impact', v: dvu(keA, 'energy', 2) },
        { l: 'KE retained', v: fmt(100 * p.mb / (p.mb + p.M), 2) + ' %', cls: 'bad' },
        { l: 'Impulse on block', v: dvu(p.M * V, 'mom', 3) }
      ];
    }

    if (S.appa === 'cradle') {
      var C = S.cradle, pT = 0, kT = 0, moving = 0;
      if (C) for (var i = 0; i < C.n; i++) {
        var v = C.balls[i].om * C.L;
        pT += C.balls[i].m * v; kT += 0.5 * C.balls[i].m * v * v;
        if (Math.abs(C.balls[i].th) > 0.02) moving++;
      }
      return [
        { l: 'Balls', v: C ? String(C.n) : '—' },
        { l: 'Lifted', v: C ? String(C.lift) : '—' },
        { l: 'Σ momentum', v: dvu(pT, 'mom', 3), hero: true },
        { l: 'Σ kinetic energy', v: dvu(kT, 'energy', 3) },
        { l: 'Restitution e', v: fmt(S.type === 'elastic' ? 1 : activeE(), 3) },
        { l: 'Pendulum period', v: C ? fmt(2 * Math.PI * Math.sqrt(C.L / G), 2) + ' s' : '—' },
        { l: 'Release angle', v: fmt(S.cr.ang, 0) + '°' },
        { l: 'Swing height', v: C ? dvu(C.L * (1 - Math.cos(S.cr.ang * Math.PI / 180)), 'lenSmall', 2) : '—' }
      ];
    }

    if (S.appa === 'crash') {
      var c = S.crash, cp = S.cs;
      return [
        { l: 'Peak force', v: dvu(c.Fpk || 0, 'forceBig', 1), hero: true },
        { l: 'Average force', v: dvu(c.Favg || 0, 'forceBig', 1) },
        { l: 'Contact time', v: fmt((c.dt || 0) * 1000, 1) + ' ms' },
        { l: 'Impulse on vehicle', v: dvu(c.J || 0, 'mom', 0) },
        { l: 'Change in speed Δv', v: dvu(c.dv1 || 0, 'speedBig', 1) },
        { l: 'Vehicle deceleration', v: fmt(c.gCar || 0, 1) + ' g' },
        { l: 'Occupant load', v: fmt(c.gOcc || 0, 0) + ' g', cls: (c.gOcc > 60 ? 'bad' : (c.gOcc > 35 ? 'warn' : 'ok')) },
        { l: 'Energy absorbed', v: dvu(c.keAbs || 0, 'energy', 0) }
      ];
    }

    /* track and table share one readout set */
    var v1 = b[0] ? (S.appa === 'table' ? Math.hypot(b[0].vx, b[0].vy) : b[0].vx) : 0;
    var v2 = b[1] ? (S.appa === 'table' ? Math.hypot(b[1].vx, b[1].vy) : b[1].vx) : 0;
    var pT2 = momentum(b), keNow = kinetic(b);
    var lost = (B && A) ? (B.ke - A.ke) : (B ? B.ke - keNow : 0);
    var vc = comVel(b);
    var extra = [];
    if (S.appa === 'table' && S.hits > 0 && b[0] && b[1]) {
      var s1 = Math.hypot(b[0].vx, b[0].vy), s2 = Math.hypot(b[1].vx, b[1].vy);
      if (s1 > 1e-3 && s2 > 1e-3) {
        var dot = (b[0].vx * b[1].vx + b[0].vy * b[1].vy) / (s1 * s2);
        extra.push({ l: 'Separation angle', v: fmt(Math.acos(clamp(dot, -1, 1)) * 180 / Math.PI, 1) + '°',
                     cls: Math.abs(Math.acos(clamp(dot, -1, 1)) * 180 / Math.PI - 90) < 0.6 ? 'ok' : '' });
      }
    }
    return [
      { l: (S.appa === 'table' ? 'Speed 1' : 'Velocity v₁'), v: dvu(v1, 'vel', 3) },
      { l: (S.appa === 'table' ? 'Speed 2' : 'Velocity v₂'), v: dvu(v2, 'vel', 3) },
      { l: 'Total momentum', v: dvu(S.appa === 'table' ? pT2.mag : pT2.x, 'mom', 3), hero: true },
      { l: 'Total kinetic energy', v: dvu(keNow, 'energy', 3) },
      { l: 'Kinetic energy lost', v: dvu(Math.max(0, lost), 'energy', 3), cls: lost > 1e-9 ? 'bad' : 'ok' },
      { l: 'Restitution e', v: fmt(e, 3) },
      { l: 'Impulse |J|', v: dvu(Math.abs(S.lastImpulse), 'mom', 3) },
      { l: 'v of centre of mass', v: dvu(S.appa === 'table' ? Math.hypot(vc.x, vc.y) : vc.x, 'vel', 3) }
    ].concat(extra);
  }

  function renderReadouts() {
    var host = $('readout-panel');
    var spec = readoutSpec();
    var html = '';
    for (var i = 0; i < spec.length; i++) {
      html += '<div class="readout-cell"><span class="ro-label">' + spec[i].l + '</span>' +
              '<span class="ro-value' + (spec[i].hero ? ' ro-hero' : '') +
              (spec[i].cls ? ' ' + spec[i].cls : '') + '">' + spec[i].v + '</span></div>';
    }
    host.innerHTML = html;
  }

  function renderBadges() {
    var host = $('readout-badges');
    if (S.mode === 'practice' || S.mode === 'quiz') { host.style.display = 'none'; return; }
    host.style.display = '';
    var spec = readoutSpec().slice(0, 5);
    var dots = [COL.accent, COL.b2, COL.green, COL.gold, COL.red];
    var html = '';
    for (var i = 0; i < spec.length; i++) {
      html += '<span class="readout-badge"><span class="rb-dot" style="background:' + dots[i] + '"></span>' +
              spec[i].l + ' <strong>' + spec[i].v + '</strong></span>';
    }
    host.innerHTML = html;
  }

  /* ── The conservation ledger ──
     Before | After | Change | verdict, for momentum and kinetic energy. */
  function renderLedger() {
    var B = S.before, A = S.after, body = $('ledger-body');
    if (!B) {
      body.innerHTML = '<tr><td colspan="5" style="color:var(--text-dim);text-align:left;padding:14px 10px">' +
        'Run the apparatus — the before and after columns fill themselves the instant the bodies touch.</td></tr>';
      return;
    }
    var rows = [];
    var head = '<tr><th>Quantity</th><th>Before</th><th>After</th><th>Change</th><th>Verdict</th></tr>';
    var extraHits = (S.appa === 'track' || S.appa === 'table') ? Math.max(0, S.hits - 1) : 0;

    function line(name, bV, aV, kind, dp, tol, note) {
      var d = (aV == null) ? null : aV - bV;
      var ok = (d == null) ? null : Math.abs(d) <= Math.max(tol, Math.abs(bV) * 0.005);
      var vd = (ok == null) ? '<span class="verdict warn">pending</span>'
        : (ok ? '<span class="verdict ok">conserved</span>' : '<span class="verdict bad">not conserved</span>');
      if (note) vd = note;
      rows.push('<tr class="hero"><td>' + name + '</td><td>' + dvu(bV, kind, dp) + '</td><td>' +
        (aV == null ? '—' : dvu(aV, kind, dp)) + '</td><td class="' + (ok === false ? 'lg-loss' : 'lg-ok') + '">' +
        (d == null ? '—' : (d >= 0 ? '+' : '−') + dvu(Math.abs(d), kind, dp)) + '</td><td>' + vd + '</td></tr>');
    }

    var external = (S.appa === 'crash' && S.cs.target === 'barrier');
    line('Total momentum', B.p.x, A ? A.p.x : null, 'mom', 3, 1e-6,
         external ? '<span class="verdict warn">barrier is external</span>' : null);
    line('Total kinetic energy', B.ke, A ? A.ke : null, 'energy', 3, 1e-9);

    if (A) {
      var lost = B.ke - A.ke;
      var pct = B.ke > 0 ? 100 * lost / B.ke : 0;
      rows.push('<tr><td>Energy lost to heat, sound &amp; deformation</td><td colspan="2">' +
        dvu(Math.max(0, lost), 'energy', 4) + '</td><td class="lg-loss">' + fmt(pct, 1) + ' %</td>' +
        '<td><span class="verdict ' + (pct < 0.5 ? 'ok' : (pct < 60 ? 'warn' : 'bad')) + '">' +
        (pct < 0.5 ? 'elastic' : (pct < 99.5 ? 'inelastic' : 'maximum loss')) + '</span></td></tr>');

      if ((S.appa === 'track' || S.appa === 'table') && S.lastMu) {
        var mu = S.lastMu;
        var vrel = Math.abs(S.lastVrelN || 0);
        var e = activeE();
        var closed = 0.5 * mu * vrel * vrel * (1 - e * e);
        /* Compare it to the measured loss rather than asserting agreement —
           an assertion here would hide exactly the kind of error it exists to
           catch. */
        var agree = Math.abs(closed - lost) <= Math.max(1e-9, Math.abs(lost) * 0.02 + 1e-6);
        rows.push('<tr><td>Closed form ½·μ·v<sub>rel</sub>²(1−e²)' +
          (S.appa === 'table' ? '<br><span style="font-size:0.72rem">v<sub>rel</sub> taken along the line of centres</span>' : '') +
          '</td><td colspan="2">μ = ' + dvu(mu, 'mass', 4) + ', v<sub>rel</sub> = ' + dvu(vrel, 'vel', 3) +
          '</td><td>' + dvu(closed, 'energy', 4) + '</td>' +
          '<td><span class="verdict ' + (agree ? 'ok">matches' : 'bad">disagrees') + '</span></td></tr>');
      }
      rows.push('<tr><td>Impulse on each body (equal &amp; opposite)</td><td colspan="2">|J| = ' +
        dvu(Math.abs(S.lastImpulse), 'mom', 4) + '</td><td>Δt = ' + fmt((S.lastDt || 0) * 1000, 1) +
        ' ms</td><td>F<sub>avg</sub> = ' + dvu(S.lastDt ? Math.abs(S.lastImpulse) / S.lastDt : 0, 'force', 1) + '</td></tr>');
    }
    /* Once a glider rebounds off an end stop the pair can meet again. Those
       later collisions are real and are still simulated — but this table stays
       on the one that was set up, so say so rather than silently swapping it. */
    if (extraHits > 0) {
      rows.push('<tr><td colspan="5" style="text-align:left;color:var(--text-dim);font-family:var(--font);font-size:0.78rem;padding:10px">' +
        'Showing the <strong>first</strong> collision. The gliders have met ' + extraHits +
        ' more time' + (extraHits > 1 ? 's' : '') + ' since, after rebounding off an end stop — press ' +
        '<strong>Reset</strong> to measure a fresh run.</td></tr>');
    }
    body.innerHTML = head + rows.join('');
  }

  /* ── Live equations, rendered by KaTeX ── */
  var _eqCache = '';
  function renderEquations() {
    var html = '';
    var e = activeE();

    if (S.appa === 'pendulum') {
      var p = S.pd, V = S.pdState.V || (p.mb * p.vb / (p.mb + p.M));
      var th = S.pdState.thetaMax || Math.acos(clamp(1 - V * V / (2 * G * p.L), -1, 1));
      html =
        '<div class="eq-line">\\[ \\text{Stage 1 — momentum: } \\; m v = (m+M)V \\]</div>' +
        '<div class="eq-line">\\[ V = \\frac{m v}{m+M} = \\frac{' + fmt(p.mb, 4) + ' \\times ' + fmt(p.vb, 1) +
        '}{' + fmt(p.mb, 4) + ' + ' + fmt(p.M, 3) + '} = ' + fmt(V, 4) + '\\ \\mathrm{m/s} \\]</div>' +
        '<div class="eq-line">\\[ \\text{Stage 2 — energy: } \\; \\tfrac12 (m+M)V^2 = (m+M)g h \\]</div>' +
        '<div class="eq-line">\\[ h = \\frac{V^2}{2g} = \\frac{' + fmt(V, 4) + '^2}{2 \\times 9.807} = ' +
        fmt(V * V / (2 * G), 4) + '\\ \\mathrm{m}, \\quad \\theta = \\cos^{-1}\\!\\left(1-\\frac{h}{L}\\right) = ' +
        fmt(th * 180 / Math.PI, 1) + '^\\circ \\]</div>' +
        '<div class="eq-note">Momentum carries you through the impact; energy carries the block up the swing. Using energy for stage 1 is the classic error — ' +
        fmt(100 * (1 - p.mb / (p.mb + p.M)), 2) + '&nbsp;% of the kinetic energy is destroyed as the bullet embeds.</div>';
    } else if (S.appa === 'crash') {
      var c = S.crash, cp = S.cs;
      html =
        '<div class="eq-line">\\[ J = \\Delta p = m\\,\\Delta v = ' + fmt(cp.m1, 0) + ' \\times ' + fmt(c.dv1 || 0, 2) +
        ' = ' + fmt(c.J || 0, 0) + '\\ \\mathrm{kg\\,m/s} \\]</div>' +
        '<div class="eq-line">\\[ \\Delta t = \\frac{2d}{\\Delta v} = \\frac{2 \\times ' + fmt(cp.crumple, 2) + '}{' +
        fmt(c.dv1 || 0, 2) + '} = ' + fmt((c.dt || 0) * 1000, 1) + '\\ \\mathrm{ms} \\]</div>' +
        '<div class="eq-line">\\[ F_{\\mathrm{avg}} = \\frac{J}{\\Delta t} = ' + fmt((c.Favg || 0) / 1000, 1) +
        '\\ \\mathrm{kN}, \\qquad F_{\\mathrm{peak}} = \\tfrac{\\pi}{2}F_{\\mathrm{avg}} = ' +
        fmt((c.Fpk || 0) / 1000, 1) + '\\ \\mathrm{kN} \\]</div>' +
        '<div class="eq-note">Δp is fixed by the speed; the only free variable is Δt. Ten times the crumple distance is ten times the time and one tenth of the force. The step Δt = 2d/Δv treats the crush as a steady deceleration, so the average speed through it is half the closing speed — the standard textbook estimate. A real pulse is closer to a half-sine, whose peak is π/2 ≈ 1.57 times the average.</div>';
    } else if (S.appa === 'cradle') {
      html =
        '<div class="eq-line">\\[ \\sum m u = \\sum m v \\qquad \\text{and} \\qquad \\sum \\tfrac12 m u^2 = \\sum \\tfrac12 m v^2 \\]</div>' +
        '<div class="eq-note">For identical balls those two equations together have only one solution: the same number of balls that went in must come out, at the same speed. Momentum alone would allow two balls to leave at half speed — energy conservation forbids it.</div>';
    } else {
      var b = S.bodies, B = S.before;
      var m1 = b[0].m, m2 = b[1].m;
      var u1 = B ? B.bodies[0].vx : b[0].vx, u2 = B ? B.bodies[1].vx : b[1].vx;
      var r = resolve1D(m1, u1, m2, u2, e);
      var mu = reducedMass(m1, m2);
      html =
        '<div class="eq-line">\\[ m_1u_1 + m_2u_2 = m_1v_1 + m_2v_2 \\qquad e = -\\frac{v_2-v_1}{u_2-u_1} = ' + fmt(e, 3) + ' \\]</div>' +
        '<div class="eq-line">\\[ v_1 = \\frac{m_1u_1+m_2u_2+m_2e(u_2-u_1)}{m_1+m_2} = ' + fmt(r.v1, 3) + '\\ \\mathrm{m/s} \\]</div>' +
        '<div class="eq-line">\\[ v_2 = \\frac{m_1u_1+m_2u_2+m_1e(u_1-u_2)}{m_1+m_2} = ' + fmt(r.v2, 3) + '\\ \\mathrm{m/s} \\]</div>' +
        '<div class="eq-line">\\[ \\Delta KE = \\tfrac12 \\mu\\, v_{\\mathrm{rel}}^2 (1-e^2), \\quad \\mu = ' + fmt(mu, 4) +
        '\\ \\mathrm{kg}, \\quad \\Delta KE = ' + fmt(keLost(m1, u1, m2, u2, e), 4) + '\\ \\mathrm{J} \\]</div>' +
        '<div class="eq-line">\\[ v_{\\mathrm{cm}} = \\frac{m_1u_1+m_2u_2}{m_1+m_2} = ' +
        fmt((m1 * u1 + m2 * u2) / (m1 + m2), 4) + '\\ \\mathrm{m/s} \\;\\text{(unchanged by the collision)} \\]</div>';
    }
    if (html !== _eqCache) { $('lp-eq-body').innerHTML = html; _eqCache = html; }
  }

  /* ═══════════════════════ §19  Sound ═══════════════════════ */

  var _ac = null;
  function ac() {
    if (!_ac) { var C = window.AudioContext || window.webkitAudioContext; if (C) _ac = new C(); }
    return _ac;
  }
  function tone(freq, dur, type, vol) {
    if (!S.sound) return;
    var a = ac(); if (!a) return;
    if (a.state === 'suspended') a.resume();
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.05, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + dur + 0.02);
  }
  function playClick() { tone(800, 0.05, 'square', 0.035); }
  function playTick(v) { tone(1200, 0.04, 'triangle', 0.025 * (v == null ? 1 : v)); }
  function playSuccess() { tone(880, 0.12, 'sine', 0.09); setTimeout(function () { tone(1320, 0.16, 'sine', 0.08); }, 110); }
  function playError() { tone(240, 0.22, 'sawtooth', 0.055); }
  /* impact: a low thud whose pitch and loudness track the closing speed */
  function playThud(strength) {
    var s = clamp(strength == null ? 0.6 : strength, 0.05, 1);
    tone(90 + 70 * s, 0.16 + 0.1 * s, 'triangle', 0.05 + 0.09 * s);
    setTimeout(function () { tone(180 + 140 * s, 0.07, 'square', 0.02 + 0.03 * s); }, 12);
  }

  /* ═══════════════════════ §20  Run loop ═══════════════════════ */

  var raf = null, lastTs = 0;

  /* Slow motion where the physics is too fast to see. A bullet crosses the
     gap in 3 ms and a car crash is over in 80 ms — played at wall-clock speed
     they would both be a single frame. */
  function timeScale() {
    if (S.appa === 'pendulum') {
      return S.pdState && S.pdState.phase === 'flying' ? Math.max(0.004, 0.55 / (S.pd.vb * 1.1)) : 1;
    }
    if (S.appa === 'crash') return S.crash.phase === 'impact' ? 0.06 : 1;
    return 1;
  }

  function loop(ts) {
    if (!S.running) { raf = null; return; }
    if (!lastTs) lastTs = ts;
    var real = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    var dt = real * S.speed * timeScale();
    if (dt > 0) { step(dt); readGates(); }
    if (autoStop()) { setRunning(false); }
    draw(); refreshPanels();
    raf = S.running ? requestAnimationFrame(loop) : null;
  }

  /* Every loop needs a terminal condition, or the tab burns CPU for ever. */
  function autoStop() {
    if (S.appa === 'track') {
      var b = S.bodies;
      var still = Math.abs(b[0].vx) < 1e-3 && Math.abs(b[1].vx) < 1e-3;
      return (S.hits > 0 && (still || S.t > 12)) || S.t > 18;
    }
    if (S.appa === 'table') return S.t > 16;
    if (S.appa === 'pendulum') return S.pdState.phase === 'swinging' && S.pdState.omega < 0 && S.pdState.theta < 0.002 && S.t > 0.3;
    if (S.appa === 'cradle') return S.t > 14;
    if (S.appa === 'crash') return S.crash.phase === 'after' && S.t > 2.2;
    return false;
  }

  function setRunning(on) {
    S.running = on;
    var btn = $('btn-run');
    btn.innerHTML = on ? '❚❚ Pause' : (S.hits > 0 || S.t > 0 ? '▶ Resume' : '▶ Run');
    btn.classList.toggle('lit', on);
    if (on) {
      if (S.appa === 'pendulum' && S.pdState.phase === 'ready') { S.pdState.phase = 'flying'; }
      if (S.appa === 'crash' && S.crash.phase === 'ready') { S.crash.phase = 'approach'; }
      if (S.appa === 'cradle' && S.cradle) S.cradle.released = true;
      if (!S.keRef) S.keRef = Math.max(1e-9, currentKE());
      lastTs = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    } else if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  function currentKE() {
    if (S.appa === 'cradle' && S.cradle) {
      var k = 0, C = S.cradle;
      for (var i = 0; i < C.n; i++) { var v = C.balls[i].om * C.L; k += 0.5 * C.balls[i].m * v * v; }
      /* the lifted balls start with potential energy, so use that as the reference */
      return Math.max(k, C.lift * S.cr.m * G * C.L * (1 - Math.cos(S.cr.ang * Math.PI / 180)));
    }
    if (S.appa === 'crash') return 0.5 * S.cs.m1 * S.cs.v1 * S.cs.v1;
    if (S.appa === 'pendulum') return 0.5 * S.pd.mb * S.pd.vb * S.pd.vb;
    return kinetic(S.bodies);
  }

  function resetRun() {
    setRunning(false);
    /* buildCrash() creates S.crash and calls prepCrash() itself — calling it
       here as well ran before the object existed and threw on the first
       switch to the crash rig. */
    buildApparatus();
    S.cmRef = S.bodies.length ? comPos(S.bodies).x : null;
    S.keRef = Math.max(1e-9, currentKE());
    S.gateRead = [null, null];
    S.gatePrev = [false, false];
    setArrowScale();
    S.stuck = false; S.stuck2 = false;
    S.latched = false; S.firstPulseEnd = null; S.wallHit = null;
    S.lastVrelN = 0; S.lastMu = 0;
    S.t = 0;
    draw(); refreshPanels();
  }

  /* Photogates behave like real ones: they time the card through the beam
     and report a velocity the moment the glider clears. */
  function readGates() {
    if (S.appa !== 'track') return;
    if (!S.gateRead) { S.gateRead = [null, null]; S.gatePrev = [false, false]; }
    [GATE_A, GATE_B].forEach(function (gx, i) {
      var blocked = gateBlocked(gx);
      if (blocked && !S.gatePrev[i]) {
        for (var k = 0; k < S.bodies.length; k++) {
          if (Math.abs(S.bodies[k].x - gx) < S.bodies[k].r) { S.gateRead[i] = S.bodies[k].vx; break; }
        }
      }
      S.gatePrev[i] = blocked;
    });
  }

  function refreshPanels() {
    renderReadouts(); renderBadges(); renderLedger(); renderEquations();
  }
  function refreshAll() { draw(); refreshPanels(); }

  /* ═══════════════════════ §21  Readings log & export ═══════════════════════ */

  function logColumns() {
    if (S.appa === 'pendulum') return ['m (' + uL('mass') + ')', 'v (' + uL('vel') + ')', 'M (' + uL('mass') + ')',
      'L (' + uL('len') + ')', 'V (' + uL('vel') + ')', 'θ (°)', 'h (' + uL('lenSmall') + ')', 'KE lost (%)'];
    if (S.appa === 'crash') return ['m (' + uL('mass') + ')', 'v (' + uL('speedBig') + ')', 'd (' + uL('lenSmall') + ')',
      'Δt (ms)', 'F avg (' + uL('forceBig') + ')', 'F peak (' + uL('forceBig') + ')', 'Occupant (g)', 'Restraint'];
    if (S.appa === 'cradle') return ['n', 'lifted', 'angle (°)', 'e', 'Σp (' + uL('mom') + ')', 'ΣKE (' + uL('energy') + ')'];
    return ['m₁ (' + uL('mass') + ')', 'u₁ (' + uL('vel') + ')', 'm₂ (' + uL('mass') + ')', 'u₂ (' + uL('vel') + ')',
      'e', 'v₁ (' + uL('vel') + ')', 'v₂ (' + uL('vel') + ')', 'p (' + uL('mom') + ')', 'ΔKE (' + uL('energy') + ')'];
  }

  function logRow() {
    var B = S.before, A = S.after;
    if (S.appa === 'pendulum') {
      var p = S.pd, st = S.pdState;
      if (!st.V) return null;
      return [dv(p.mb, 'mass', 4), dv(p.vb, 'vel', 1), dv(p.M, 'mass', 3), dv(p.L, 'len', 2),
        dv(st.V, 'vel', 4), fmt(st.thetaMax * 180 / Math.PI, 1), dv(p.L * (1 - Math.cos(st.thetaMax)), 'lenSmall', 2),
        fmt(100 * (1 - p.mb / (p.mb + p.M)), 2)];
    }
    if (S.appa === 'crash') {
      var c = S.crash, cp = S.cs;
      return [dv(cp.m1, 'mass', 0), dv(cp.v1, 'speedBig', 1), dv(cp.crumple, 'lenSmall', 0),
        fmt(c.dt * 1000, 1), dv(c.Favg, 'forceBig', 2), dv(c.Fpk, 'forceBig', 2), fmt(c.gOcc, 0), cp.restraint];
    }
    if (S.appa === 'cradle') {
      var C = S.cradle, pT = 0, kT = 0;
      for (var i = 0; i < C.n; i++) { var v = C.balls[i].om * C.L; pT += C.balls[i].m * v; kT += 0.5 * C.balls[i].m * v * v; }
      return [String(C.n), String(C.lift), fmt(S.cr.ang, 0), fmt(activeE(), 3), dv(pT, 'mom', 4), dv(kT, 'energy', 4)];
    }
    if (!B || !A) return null;
    return [dv(B.bodies[0].m, 'mass', 3), dv(B.bodies[0].vx, 'vel', 3),
      dv(B.bodies[1].m, 'mass', 3), dv(B.bodies[1].vx, 'vel', 3), fmt(activeE(), 3),
      dv(A.bodies[0].vx, 'vel', 3), dv(A.bodies[1].vx, 'vel', 3),
      dv(A.p.x, 'mom', 4), dv(Math.max(0, B.ke - A.ke), 'energy', 4)];
  }

  function recordRun() {
    var row = logRow();
    if (!row) { flash('Run the collision first — there is nothing to record yet.'); playError(); return; }
    S.log.push({ appa: S.appa, cols: logColumns(), row: row });
    renderLog(); playSuccess();
    $('data-card').open = true;
  }

  function renderLog() {
    var head = $('log-head'), body = $('log-body'), empty = $('log-empty');
    var mine = S.log.filter(function (r) { return r.appa === S.appa; });
    if (!mine.length) { head.innerHTML = ''; body.innerHTML = ''; empty.style.display = ''; return; }
    empty.style.display = 'none';
    head.innerHTML = '<tr><th>#</th>' + mine[0].cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
    body.innerHTML = mine.map(function (r, i) {
      return '<tr><td>' + (i + 1) + '</td>' + r.row.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>';
    }).join('');
  }

  function exportCSV() {
    var mine = S.log.filter(function (r) { return r.appa === S.appa; });
    if (!mine.length) { flash('Record at least one run first.'); playError(); return; }
    var lines = ['#,' + mine[0].cols.join(',')];
    mine.forEach(function (r, i) { lines.push((i + 1) + ',' + r.row.join(',')); });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'collision_' + S.appa + '_' + S.units + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    playClick();
  }

  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = cvs.width; tmp.height = cvs.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(cvs, 0, 0);
    var fs = Math.max(10, Math.round(tmp.width * 0.020));
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 14, tmp.height - 10);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'collision_' + S.appa + '.png';
    a.click();
    playClick();
  }

  function copyReadings() {
    var spec = readoutSpec();
    var txt = 'Collision & Momentum Simulator — ' + S.appa + '\n' +
      spec.map(function (s) { return s.l + ': ' + s.v; }).join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
    flash('Readings copied to the clipboard.');
    playClick();
  }

  var _flashT = null;
  function flash(msg) {
    var el = $('flash-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'flash-msg';
      el.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:999;' +
        'background:#1f2535;border:1px solid #2a3050;color:#dde3f0;padding:10px 18px;border-radius:10px;' +
        'font:600 0.85rem "Segoe UI",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.5);max-width:90vw;text-align:center';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(_flashT);
    _flashT = setTimeout(function () { el.style.display = 'none'; }, 2600);
  }

  /* ═══════════════════════ §22  Calculate mode ═══════════════════════
     Seven solvers. Each declares its fields (with a unit kind so the boxes
     follow the SI/Imperial toggle) and returns a headline result plus the
     full substituted working. */

  var CALC = {
    elastic: {
      title: 'Elastic collision in one dimension',
      intro: 'Both momentum and kinetic energy are conserved (e = 1). Enter the two masses and the two initial velocities; a velocity to the left is negative.',
      f: [
        { k: 'm1', l: 'Mass m₁', u: 'mass', d: 2 }, { k: 'u1', l: 'Initial velocity u₁', u: 'vel', d: 3 },
        { k: 'm2', l: 'Mass m₂', u: 'mass', d: 2 }, { k: 'u2', l: 'Initial velocity u₂', u: 'vel', d: 0 }
      ],
      run: function (v) {
        var r = resolve1D(v.m1, v.u1, v.m2, v.u2, 1);
        var pB = v.m1 * v.u1 + v.m2 * v.u2, kB = 0.5 * v.m1 * v.u1 * v.u1 + 0.5 * v.m2 * v.u2 * v.u2;
        var kA = 0.5 * v.m1 * r.v1 * r.v1 + 0.5 * v.m2 * r.v2 * r.v2;
        return {
          head: 'v₁ = ' + dvu(r.v1, 'vel', 4) + '   ·   v₂ = ' + dvu(r.v2, 'vel', 4),
          sub: 'Relative velocity reverses exactly: (v₂ − v₁) = −(u₂ − u₁)',
          steps:
            '<h4>Conservation statements</h4>' +
            '<div class="eq-line">\\[ m_1u_1+m_2u_2 = m_1v_1+m_2v_2 \\qquad \\tfrac12m_1u_1^2+\\tfrac12m_2u_2^2 = \\tfrac12m_1v_1^2+\\tfrac12m_2v_2^2 \\]</div>' +
            '<h4>Solved together</h4>' +
            '<div class="eq-line">\\[ v_1=\\frac{(m_1-m_2)u_1+2m_2u_2}{m_1+m_2}=\\frac{(' + fmt(v.m1, 3) + '-' + fmt(v.m2, 3) + ')(' + fmt(v.u1, 3) + ')+2(' + fmt(v.m2, 3) + ')(' + fmt(v.u2, 3) + ')}{' + fmt(v.m1 + v.m2, 3) + '}=' + fmt(r.v1, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<div class="eq-line">\\[ v_2=\\frac{(m_2-m_1)u_2+2m_1u_1}{m_1+m_2}=' + fmt(r.v2, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<h4>Check</h4>' +
            '<div class="eq-note">Momentum before ' + fmt(pB, 4) + ' kg m/s, after ' + fmt(v.m1 * r.v1 + v.m2 * r.v2, 4) +
            ' kg m/s. Kinetic energy before ' + fmt(kB, 4) + ' J, after ' + fmt(kA, 4) + ' J. Both match, as they must at e = 1.</div>'
        };
      }
    },

    general: {
      title: 'One-dimensional collision with any coefficient of restitution',
      intro: 'The general case. e = 1 is elastic, e = 0 is perfectly inelastic, and everything real sits in between. Momentum is conserved whatever e is.',
      f: [
        { k: 'm1', l: 'Mass m₁', u: 'mass', d: 2 }, { k: 'u1', l: 'Initial velocity u₁', u: 'vel', d: 4 },
        { k: 'm2', l: 'Mass m₂', u: 'mass', d: 1 }, { k: 'u2', l: 'Initial velocity u₂', u: 'vel', d: 0 },
        { k: 'e', l: 'Coefficient of restitution e', u: null, d: 0.6, min: 0, max: 1 }
      ],
      run: function (v) {
        var r = resolve1D(v.m1, v.u1, v.m2, v.u2, v.e);
        var mu = reducedMass(v.m1, v.m2), dke = keLost(v.m1, v.u1, v.m2, v.u2, v.e);
        var J = impulseOn1(v.m1, v.u1, v.m2, v.u2, v.e);
        return {
          head: 'v₁ = ' + dvu(r.v1, 'vel', 4) + '   ·   v₂ = ' + dvu(r.v2, 'vel', 4),
          sub: 'Energy lost ' + dvu(dke, 'energy', 4) + '   ·   impulse |J| = ' + dvu(Math.abs(J), 'mom', 4),
          steps:
            '<h4>Definition of e</h4>' +
            '<div class="eq-line">\\[ e=-\\frac{v_2-v_1}{u_2-u_1}=' + fmt(v.e, 3) + ' \\]</div>' +
            '<h4>Solving with momentum conservation</h4>' +
            '<div class="eq-line">\\[ v_1=\\frac{m_1u_1+m_2u_2+m_2e(u_2-u_1)}{m_1+m_2}=' + fmt(r.v1, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<div class="eq-line">\\[ v_2=\\frac{m_1u_1+m_2u_2+m_1e(u_1-u_2)}{m_1+m_2}=' + fmt(r.v2, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<h4>Energy lost</h4>' +
            '<div class="eq-line">\\[ \\mu=\\frac{m_1m_2}{m_1+m_2}=' + fmt(mu, 4) + '\\ \\mathrm{kg},\\qquad \\Delta KE=\\tfrac12\\mu v_{rel}^2(1-e^2)=' + fmt(dke, 5) + '\\ \\mathrm{J} \\]</div>' +
            '<div class="eq-note">The loss depends only on the <em>relative</em> velocity, so every observer agrees on it however fast they are moving.</div>'
        };
      }
    },

    stick: {
      title: 'Perfectly inelastic collision (the bodies stick together)',
      intro: 'e = 0. The two bodies leave with one common velocity, which is always the velocity of the centre of mass. This is the largest energy loss possible for the given masses and speeds.',
      f: [
        { k: 'm1', l: 'Mass m₁', u: 'mass', d: 1500 }, { k: 'u1', l: 'Initial velocity u₁', u: 'vel', d: 20 },
        { k: 'm2', l: 'Mass m₂', u: 'mass', d: 1000 }, { k: 'u2', l: 'Initial velocity u₂', u: 'vel', d: 0 }
      ],
      run: function (v) {
        var V = (v.m1 * v.u1 + v.m2 * v.u2) / (v.m1 + v.m2);
        var kB = 0.5 * v.m1 * v.u1 * v.u1 + 0.5 * v.m2 * v.u2 * v.u2;
        var kA = 0.5 * (v.m1 + v.m2) * V * V;
        var pct = kB > 0 ? 100 * (kB - kA) / kB : 0;
        return {
          head: 'V = ' + dvu(V, 'vel', 4),
          sub: 'Kinetic energy lost ' + dvu(kB - kA, 'energy', 3) + '  (' + fmt(pct, 1) + ' % of the original)',
          steps:
            '<div class="eq-line">\\[ m_1u_1+m_2u_2=(m_1+m_2)V \\]</div>' +
            '<div class="eq-line">\\[ V=\\frac{' + fmt(v.m1, 2) + '\\times' + fmt(v.u1, 3) + '+' + fmt(v.m2, 2) + '\\times' + fmt(v.u2, 3) + '}{' + fmt(v.m1 + v.m2, 2) + '}=' + fmt(V, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<h4>Energy audit</h4>' +
            '<div class="eq-line">\\[ KE_i=' + fmt(kB, 3) + '\\ \\mathrm{J},\\qquad KE_f=\\tfrac12(m_1+m_2)V^2=' + fmt(kA, 3) + '\\ \\mathrm{J} \\]</div>' +
            '<div class="eq-line">\\[ \\text{fraction lost}=1-\\frac{KE_f}{KE_i}=' + fmt(pct, 2) + '\\% \\]</div>' +
            '<div class="eq-note">If the second body starts at rest, the fraction of kinetic energy that survives is exactly m₁/(m₁+m₂) — which is why a bullet embedding in a heavy block loses almost all of its energy while its momentum passes through untouched.</div>'
        };
      }
    },

    impulse: {
      title: 'Impulse, contact time and average force',
      intro: 'The impulse–momentum theorem. Give the mass and the velocity change, then either the contact time or the stopping distance — the solver works out the other.',
      /* NB: `d` is the default value in SI, not in the display unit. */
      f: [
        { k: 'm', l: 'Mass', u: 'mass', d: 70 },
        { k: 'u', l: 'Velocity before', u: 'vel', d: 13.9 },
        { k: 'v', l: 'Velocity after', u: 'vel', d: 0 },
        { k: 'd', l: 'Stopping distance', u: 'lenSmall', d: 0.50 }   /* SI: 0.50 m = 50 cm */
      ],
      run: function (v) {
        var dvv = v.u - v.v;
        var J = v.m * dvv;
        var d = Math.max(1e-4, v.d);
        var dt = 2 * d / Math.max(1e-6, Math.abs(dvv));
        var Favg = Math.abs(J) / dt;
        var Fpk = Math.PI / 2 * Favg;
        var a = Math.abs(dvv) / dt;
        return {
          head: 'F average = ' + dvu(Favg, 'forceBig', 2),
          sub: 'J = ' + dvu(Math.abs(J), 'mom', 2) + '  ·  Δt = ' + fmt(dt * 1000, 1) + ' ms  ·  ' +
               fmt(a / G, 1) + ' g  ·  peak (half-sine) ' + dvu(Fpk, 'forceBig', 2),
          steps:
            '<div class="eq-line">\\[ J=\\Delta p=m\\Delta v=' + fmt(v.m, 2) + '\\times' + fmt(dvv, 3) + '=' + fmt(J, 2) + '\\ \\mathrm{kg\\,m/s} \\]</div>' +
            '<div class="eq-line">\\[ \\Delta t=\\frac{2d}{\\Delta v}=\\frac{2\\times' + fmt(d, 3) + '}{' + fmt(Math.abs(dvv), 3) + '}=' + fmt(dt, 5) + '\\ \\mathrm{s} \\]</div>' +
            '<div class="eq-line">\\[ F_{avg}=\\frac{J}{\\Delta t}=' + fmt(Favg, 1) + '\\ \\mathrm{N}=' + fmt(Favg / 1000, 2) + '\\ \\mathrm{kN} \\]</div>' +
            '<div class="eq-note">Δt = 2d/Δv assumes a steady stop, so the average speed during the stop is half the initial speed. A real force pulse is closer to a half-sine, whose peak is π/2 ≈ 1.57 times the average — that is the number quoted above.</div>'
        };
      }
    },

    ballistic: {
      title: 'Ballistic pendulum',
      intro: 'The classic two-stage problem. Momentum is conserved through the embedding; mechanical energy is conserved on the swing up. Enter the measured swing angle to recover the muzzle speed.',
      f: [
        { k: 'm', l: 'Projectile mass m', u: 'mass', d: 0.010 },
        { k: 'M', l: 'Block mass M', u: 'mass', d: 1.5 },
        { k: 'L', l: 'Pendulum length L', u: 'len', d: 0.9 },
        { k: 'th', l: 'Measured swing angle', u: null, d: 42, suffix: '°' }
      ],
      run: function (v) {
        var h = v.L * (1 - Math.cos(v.th * Math.PI / 180));
        var V = Math.sqrt(2 * G * h);
        var u = (v.m + v.M) / v.m * V;
        var kB = 0.5 * v.m * u * u, kA = 0.5 * (v.m + v.M) * V * V;
        return {
          head: 'Muzzle speed v = ' + dvu(u, 'vel', 1),
          sub: 'h = ' + dvu(h, 'lenSmall', 2) + '  ·  V = ' + dvu(V, 'vel', 4) + '  ·  ' +
               fmt(100 * (1 - kA / kB), 2) + ' % of the kinetic energy is lost in the embedding',
          steps:
            '<h4>Stage 2 first — the swing (energy)</h4>' +
            '<div class="eq-line">\\[ h=L(1-\\cos\\theta)=' + fmt(v.L, 3) + '(1-\\cos ' + fmt(v.th, 1) + '^\\circ)=' + fmt(h, 5) + '\\ \\mathrm{m} \\]</div>' +
            '<div class="eq-line">\\[ \\tfrac12(m+M)V^2=(m+M)gh \\;\\Rightarrow\\; V=\\sqrt{2gh}=' + fmt(V, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<h4>Stage 1 — the embedding (momentum)</h4>' +
            '<div class="eq-line">\\[ mv=(m+M)V \\;\\Rightarrow\\; v=\\frac{m+M}{m}V=\\frac{' + fmt(v.m + v.M, 4) + '}{' + fmt(v.m, 4) + '}\\times' + fmt(V, 4) + '=' + fmt(u, 1) + '\\ \\mathrm{m/s} \\]</div>' +
            '<div class="eq-note">The order matters. Using energy conservation across the embedding is the standard mistake and it gives an answer ' +
            fmt(Math.sqrt((v.m + v.M) / v.m), 2) + '× too small, because most of the kinetic energy is destroyed as the projectile buries itself.</div>'
        };
      }
    },

    cor: {
      title: 'Coefficient of restitution from a bounce test',
      intro: 'Drop a ball from a measured height onto a rigid floor and measure the rebound height. Because the floor does not move, e follows from the two heights alone.',
      f: [
        { k: 'h0', l: 'Drop height', u: 'lenSmall', d: 1.00 },   /* SI: 1.00 m = 100 cm */
        { k: 'h1', l: 'Rebound height', u: 'lenSmall', d: 0.64 }
      ],
      run: function (v) {
        var h0 = Math.max(1e-6, v.h0), h1 = clamp(v.h1, 0, h0);
        var e = Math.sqrt(h1 / h0);
        var vin = Math.sqrt(2 * G * h0), vout = Math.sqrt(2 * G * h1);
        return {
          head: 'e = ' + fmt(e, 4),
          sub: 'Impact ' + dvu(vin, 'vel', 3) + ' → rebound ' + dvu(vout, 'vel', 3) +
               '  ·  ' + fmt(100 * (1 - e * e), 1) + ' % of the kinetic energy is lost per bounce',
          steps:
            '<div class="eq-line">\\[ v_{in}=\\sqrt{2gh_0}=' + fmt(vin, 4) + '\\ \\mathrm{m/s},\\qquad v_{out}=\\sqrt{2gh_1}=' + fmt(vout, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<div class="eq-line">\\[ e=\\frac{v_{out}}{v_{in}}=\\sqrt{\\frac{h_1}{h_0}}=\\sqrt{\\frac{' + fmt(v.h1, 3) + '}{' + fmt(v.h0, 3) + '}}=' + fmt(e, 4) + ' \\]</div>' +
            '<div class="eq-line">\\[ \\frac{KE_{out}}{KE_{in}}=e^2=' + fmt(e * e, 4) + ' \\]</div>' +
            '<div class="eq-note">e is not a material constant. It falls as the impact speed rises, changes with temperature, and belongs to the <em>pair</em> of surfaces — a ball is not "an e = 0.8 ball" except against the particular floor it was tested on.</div>'
        };
      }
    },

    oblique: {
      title: 'Oblique (two-dimensional) collision',
      intro: 'A moving body strikes a stationary one off-centre. Resolve along the line of centres: those components collide in one dimension with e, and the perpendicular components pass through unchanged.',
      f: [
        { k: 'm1', l: 'Mass m₁', u: 'mass', d: 0.2 },
        { k: 'u1', l: 'Speed u₁', u: 'vel', d: 1 },
        { k: 'm2', l: 'Mass m₂ (at rest)', u: 'mass', d: 0.2 },
        { k: 'phi', l: 'Line-of-centres angle', u: null, d: 30, suffix: '°' },
        { k: 'e', l: 'Coefficient of restitution e', u: null, d: 1, min: 0, max: 1 }
      ],
      run: function (v) {
        /* n is the unit vector along the line of centres at contact; it makes
           angle φ with the incoming direction, where sin φ = b/(r₁+r₂).
           t is perpendicular to it. */
        var ph = v.phi * Math.PI / 180;
        var cs = Math.cos(ph), sn = Math.sin(ph);
        var u1n = v.u1 * cs;                 // along n
        var u1t = -v.u1 * sn;                // along t
        var r = resolve1D(v.m1, u1n, v.m2, 0, v.e);

        /* back to lab axes: vector = v_n·n + v_t·t */
        var v1x = r.v1 * cs - u1t * sn, v1y = r.v1 * sn + u1t * cs;
        var v2x = r.v2 * cs, v2y = r.v2 * sn;
        var s1 = Math.hypot(v1x, v1y), s2 = Math.hypot(v2x, v2y);
        var th1 = Math.atan2(v1y, v1x) * 180 / Math.PI;
        var th2 = Math.atan2(v2y, v2x) * 180 / Math.PI;
        var sep = Math.abs(th2 - th1);
        var right = Math.abs(sep - 90) < 0.05;
        return {
          head: 'Body 1: ' + dvu(s1, 'vel', 4) + ' at ' + fmt(th1, 1) + '°   ·   Body 2: ' + dvu(s2, 'vel', 4) + ' at ' + fmt(th2, 1) + '°',
          sub: 'Angles are measured from the original direction of travel. Separation angle ' +
               fmt(sep, 1) + '°' + (right ? '  ✓ the 90° rule holds here' : ''),
          steps:
            '<h4>Resolve along and across the line of centres</h4>' +
            '<div class="eq-line">\\[ \\sin\\phi=\\frac{b}{r_1+r_2},\\qquad u_{1n}=u_1\\cos\\phi=' + fmt(u1n, 4) +
            ',\\qquad u_{1t}=-u_1\\sin\\phi=' + fmt(u1t, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<h4>The normal components collide in one dimension</h4>' +
            '<div class="eq-line">\\[ v_{1n}=' + fmt(r.v1, 4) + ',\\qquad v_{2n}=' + fmt(r.v2, 4) + '\\ \\mathrm{m/s} \\]</div>' +
            '<h4>The tangential components pass through untouched</h4>' +
            '<div class="eq-line">\\[ v_{1t}=u_{1t}=' + fmt(u1t, 4) + ',\\qquad v_{2t}=0 \\]</div>' +
            '<h4>Recombine</h4>' +
            '<div class="eq-line">\\[ |v_1|=\\sqrt{v_{1n}^2+v_{1t}^2}=' + fmt(s1, 4) +
            '\\ \\mathrm{m/s}\\ \\text{at}\\ ' + fmt(th1, 1) + '^\\circ,\\qquad |v_2|=' + fmt(s2, 4) +
            '\\ \\mathrm{m/s}\\ \\text{at}\\ ' + fmt(th2, 1) + '^\\circ \\]</div>' +
            '<div class="eq-note">Body 2 always leaves along the line of centres, because that is the only direction in which it was pushed. With equal masses and e = 1 the whole normal component transfers, leaving body 1 with nothing but its tangential component \u2014 perpendicular to body 2. That is the 90\u00b0 rule.</div>'
        };
      }
    }
  };

  var calcKey = 'elastic', calcVals = {};

  function buildCalc() {
    var def = CALC[calcKey];
    $('calc-intro').textContent = def.intro;
    var host = $('calc-inputs');
    host.innerHTML = '';
    def.f.forEach(function (f) {
      if (calcVals[calcKey] == null) calcVals[calcKey] = {};
      if (calcVals[calcKey][f.k] == null) calcVals[calcKey][f.k] = f.d;
      var w = document.createElement('div');
      w.className = 'calc-field';
      var lab = document.createElement('label');
      lab.textContent = f.l;
      var wrap = document.createElement('div'); wrap.className = 'cf-wrap';
      var inp = document.createElement('input');
      inp.type = 'number'; inp.step = 'any'; inp.setAttribute('inputmode', 'decimal');
      inp.setAttribute('aria-label', f.l);
      inp.value = f.u ? fmt(toD(calcVals[calcKey][f.k], f.u), 4).replace(/\.?0+$/, '') : calcVals[calcKey][f.k];
      var un = document.createElement('span'); un.className = 'cf-unit';
      un.textContent = f.u ? uL(f.u) : (f.suffix || '');
      inp.addEventListener('input', function () {
        var d = parseFloat(inp.value);
        if (!isFinite(d)) return;
        var si = f.u ? toSI(d, f.u) : d;
        if (f.min != null) si = Math.max(f.min, si);
        if (f.max != null) si = Math.min(f.max, si);
        calcVals[calcKey][f.k] = si;
        runCalc();
      });
      wrap.appendChild(inp); wrap.appendChild(un);
      w.appendChild(lab); w.appendChild(wrap);
      host.appendChild(w);
    });
    runCalc();
  }

  function runCalc() {
    var def = CALC[calcKey];
    var out;
    try { out = def.run(calcVals[calcKey]); }
    catch (err) { out = { head: '—', sub: 'Check the inputs', steps: '' }; }
    $('calc-result').innerHTML =
      '<div class="cr-label">' + def.title + '</div>' +
      '<div class="cr-value">' + out.head + '</div>' +
      '<div class="cr-sub">' + out.sub + '</div>';
    $('calc-steps-body').innerHTML = out.steps;
  }

  /* ═══════════════════════ §23  Explore content ═══════════════════════ */

  var EXPLORE = {
    basics: [
      { t: 'What momentum actually is',
        b: 'Momentum is mass times velocity, <code>p = mv</code>. It is a <strong>vector</strong>, so direction is part of the value and momenta pointing opposite ways subtract. Its unit, kg·m/s, has no special name — it is simply "the amount of motion" a body carries, and it is the quantity a force changes: Newton\'s second law in its original form reads <code>F = dp/dt</code>.',
        n: 'Two 1 kg trolleys, one going right at 3 m/s and one going left at 3 m/s, have total momentum zero and total kinetic energy 9 J. Momentum can cancel; energy never can.' },
      { t: 'Why momentum is conserved',
        b: 'During contact, body 1 pushes body 2 with force <em>F</em> and body 2 pushes back with <em>−F</em>, for exactly the same length of time. The impulses are equal and opposite, so one body gains exactly what the other loses. Nothing in that argument depends on how hard, hot or sticky the bodies are — which is why momentum conservation is unconditional, provided no <strong>external</strong> horizontal force acts.',
        f: 'Σp<sub>before</sub> = Σp<sub>after</sub>   (isolated system)',
        n: 'Switch the air pump off on the air track. Friction is external, momentum stops being conserved, and the ledger says so.' },
      { t: 'Elastic, inelastic, perfectly inelastic',
        b: 'All three conserve momentum. They differ only in what happens to kinetic energy. <strong>Elastic</strong> gives every joule back (e = 1). <strong>Inelastic</strong> keeps some as heat, sound and permanent deformation (0 &lt; e &lt; 1). <strong>Perfectly inelastic</strong> means the bodies leave together (e = 0), and that is the largest loss possible for those masses and speeds — not a total loss, because the combined body still has to carry the original momentum.',
        n: 'A perfectly inelastic collision cannot lose all the kinetic energy unless the total momentum is zero. Momentum must be conserved, and moving mass always carries energy.' },
      { t: 'The coefficient of restitution',
        b: 'Defined along the line of impact as <code>e = −(v₂−v₁)/(u₂−u₁)</code>: the ratio of separation speed to approach speed. It is the single number that closes the collision problem — momentum conservation gives one equation, e gives the second, and two equations solve for two unknown final velocities.',
        f: 'e = separation speed ÷ approach speed',
        n: 'e is not a material constant. It falls as impact speed rises, changes with temperature, and belongs to the pair of surfaces, not to one object.' },
      { t: 'The centre of mass',
        b: 'The centre of mass of the system moves as though the whole mass were concentrated there and only external forces acted. Collision forces are internal, so the centre of mass sails straight through a collision without so much as a flinch — however violent the collision was.',
        f: 'v<sub>cm</sub> = (m₁u₁ + m₂u₂)/(m₁ + m₂)',
        n: 'Turn on "Centre of mass" and watch the marker during a run. In the centre-of-mass frame the total momentum is zero, before and after, always.' }
    ],

    formulas: [
      { t: 'General one-dimensional collision',
        b: 'The complete solution for any coefficient of restitution. Set e = 1 for elastic and e = 0 for perfectly inelastic and the familiar special cases drop straight out.',
        f: 'v₁ = [m₁u₁ + m₂u₂ + m₂e(u₂−u₁)] / (m₁+m₂)<br>v₂ = [m₁u₁ + m₂u₂ + m₁e(u₁−u₂)] / (m₁+m₂)',
        n: 'Worked: m₁ = 2 kg at 3 m/s hits m₂ = 1 kg at rest, e = 1. v₁ = (6 + 1·1·(0−3))/3 = 1 m/s, v₂ = (6 + 2·1·3)/3 = 4 m/s. Check: 2(1)+1(4) = 6 ✓ and ½·2·1 + ½·1·16 = 9 J = ½·2·9 ✓.' },
      { t: 'Elastic special cases worth memorising',
        b: 'With body 2 at rest and e = 1: equal masses swap velocities exactly; a very light body bounces back at almost its incoming speed; a very heavy body carries on almost unchanged and gives the light one almost twice its speed.',
        f: 'v₁ = (m₁−m₂)u₁/(m₁+m₂),  v₂ = 2m₁u₁/(m₁+m₂)',
        n: 'The 2u limit is why a ping-pong ball on a basketball flies off so fast, and why a neutron loses energy fastest against hydrogen — equal masses, complete transfer. That is why reactor moderators are made of light atoms.' },
      { t: 'Energy lost, in one line',
        b: 'The energy that disappears in a collision depends only on the relative velocity and the reduced mass, never on the frame of reference. That is why every observer, however fast they are moving, agrees on how much heat was produced.',
        f: 'ΔKE = ½·μ·v<sub>rel</sub>²·(1−e²),  μ = m₁m₂/(m₁+m₂)',
        n: 'Worked: 2 kg at 3 m/s into 1 kg at rest, e = 0. μ = 2/3 kg, v_rel = 3 m/s, ΔKE = ½(0.667)(9)(1) = 3 J out of 9 J — exactly one third lost.' },
      { t: 'Impulse and average force',
        b: 'Impulse is the area under the force–time graph, and it equals the change in momentum. This is the equation behind every piece of impact protection ever designed.',
        f: 'J = ∫F dt = F<sub>avg</sub>·Δt = Δp = m(v−u)',
        n: 'Worked: a 70 kg occupant stopping from 13.9 m/s needs J = 973 kg·m/s. Over 0.05 m the stop takes 7.2 ms and needs 135 kN; over 0.50 m it takes 72 ms and needs 13.5 kN.' },
      { t: 'Ballistic pendulum',
        b: 'Two stages, two different conservation laws, and using the wrong one for the wrong stage is the classic error. Momentum for the embedding; energy for the swing.',
        f: 'V = mv/(m+M)  then  h = V²/2g,  so  v = ((m+M)/m)·√(2gL(1−cos θ))',
        n: 'Worked: m = 10 g, M = 1.5 kg, L = 0.9 m, θ = 42°. h = 0.9(1−cos42°) = 0.231 m, V = √(2·9.81·0.231) = 2.13 m/s, v = (1.51/0.010)(2.13) = 322 m/s.' },
      { t: 'Two-dimensional collisions',
        b: 'Resolve along the line joining the centres at the instant of contact. The normal components collide one-dimensionally with e; the tangential components pass through untouched for smooth bodies. Everything from the 1D case transfers, one axis at a time.',
        f: 'sin φ = b/(r₁+r₂);  normal: 1D with e;  tangential: unchanged',
        n: 'For equal masses, e = 1 and one body at rest, momentum gives u⃗ = v⃗₁ + v⃗₂ and energy gives u² = v₁² + v₂². Together they are Pythagoras — hence exactly 90° between the outgoing paths.' }
    ],

    data: [
      { t: 'Coefficient of restitution — measured values', wide: true,
        b: 'Values from standard drop or impact tests against a rigid surface. e is <strong>not</strong> a material constant: it falls as impact speed rises, varies with temperature and inflation, and belongs to the pair of surfaces. The three sports-ball rows are set by the governing bodies and are the most reliable numbers in the table because the test conditions are specified exactly.',
        table: {
          head: ['Body / pair', 'e (approx.)', 'Test condition'],
          rows: [
            ['Tennis ball on concrete', '0.73 – 0.76', 'ITF: drop 254 cm, rebound 134.6–147.3 cm'],
            ['Baseball on solid ash', '0.51 – 0.58', 'MLB/ASTM: impact at 85 ft/s (58 mph); spec 0.546 ± 0.032'],
            ['Basketball on hardwood', '0.75 – 0.85', 'NBA drop test; sensitive to inflation and to how rebound is measured'],
            ['Superball (high-bounce rubber)', '0.85 – 0.92', 'Low-speed drop on a rigid slab'],
            ['Billiard ball on billiard ball', '0.92 – 0.96', 'Ball-to-ball; ball-to-cushion is much lower, ≈ 0.6–0.75'],
            ['Hardened steel on steel', '0.90 – 0.95', 'Low-speed drop; falls sharply once the impact yields the surface'],
            ['Glass marble on glass', '0.85 – 0.95', 'Low-speed drop'],
            ['Golf ball on rigid plate', '0.78 – 0.83', 'Low speed; the USGA limit on driver-face COR is 0.83'],
            ['Wooden ball on wood', '0.40 – 0.60', 'Highly variable with grain and moisture'],
            ['Squash ball (cold)', '0.25 – 0.40', 'Rises substantially as the ball warms in play'],
            ['Modelling clay / putty', '≈ 0', 'Perfectly inelastic for practical purposes']
          ]
        },
        src: 'Sports-ball rows from the ITF technical specification, MLB/ASTM baseball specification and NBA ball rule; the remainder are typical low-speed laboratory ranges. Always quote the impact speed with a value of e.' },
      { t: 'Typical contact times and impact forces', wide: true,
        b: 'Orders of magnitude for real impacts. Notice how far apart the contact times are — five orders of magnitude between a golf strike and a car crash — and that this, not the momentum change, is what sets the force.',
        table: {
          head: ['Impact', 'Contact time', 'Why it matters'],
          rows: [
            ['Golf club on ball', '≈ 0.5 ms', 'Peak force of order 10 kN on a 46 g ball'],
            ['Bat on baseball', '≈ 0.7 – 1 ms', 'Peak force of order 8 kN; the ball flattens to about half its diameter'],
            ['Hammer on nail', '≈ 1 ms', 'Short time is the point — a large force is what drives the nail'],
            ['Tennis racket on ball', '≈ 4 – 5 ms', 'Strings stretch, lengthening the contact and lowering peak force'],
            ['Foot strike, running shoe', '≈ 20 – 50 ms', 'Midsole foam exists purely to stretch Δt'],
            ['Head into an airbag', '≈ 40 – 60 ms', 'The bag must be fully inflated and already venting on contact'],
            ['Car into a rigid barrier at 50 km/h', '≈ 80 – 150 ms', 'Set by the crumple length, typically 0.5–0.9 m'],
            ['Rail buffer / shunt', '≈ 0.3 – 1 s', 'Long stroke draw-gear keeps forces inside the coupler rating']
          ]
        },
        src: 'Representative orders of magnitude for teaching purposes; exact values depend on speed, materials and geometry.' },
      { t: 'Momentum of everyday things', wide: true,
        b: 'A sense of scale. Momentum is a product, so a slow heavy thing and a fast light thing can carry the same amount of motion — and stopping either of them needs the same impulse.',
        table: {
          head: ['Object', 'Mass', 'Speed', 'Momentum'],
          rows: [
            ['Rifle bullet', '4 g', '900 m/s', '3.6 kg·m/s'],
            ['Tennis serve', '58 g', '55 m/s', '3.2 kg·m/s'],
            ['Football (kicked)', '0.43 kg', '25 m/s', '10.8 kg·m/s'],
            ['Sprinter', '75 kg', '10 m/s', '750 kg·m/s'],
            ['Family car at 50 km/h', '1400 kg', '13.9 m/s', '19 500 kg·m/s'],
            ['Loaded lorry at 90 km/h', '40 000 kg', '25 m/s', '1 000 000 kg·m/s'],
            ['Container ship at 12 knots', '1.0 × 10⁸ kg', '6.2 m/s', '6.2 × 10⁸ kg·m/s']
          ]
        },
        src: 'A bullet and a tennis serve carry almost identical momentum — which is why both are stopped by roughly the same impulse, and why the bullet is dangerous only because it delivers that impulse over a millimetre instead of a metre.' }
    ],

    applications: [
      { t: 'Crumple zones, airbags and belts',
        b: 'A car cannot reduce the momentum change of a crash — that is fixed by the speed. It can only stretch the time. A crumple zone collapses progressively over half a metre or more, an airbag lets the head decelerate over another third of a metre, and a belt keeps the occupant coupled to the car so they use the crumple zone at all. Together they turn a lethal 100 g pulse into a survivable 30 g one.',
        n: 'The rigid passenger cell and the soft nose are not a contradiction: the cell must not deform, precisely so the nose can.' },
      { t: 'Rocket propulsion and recoil',
        b: 'A rocket is an explosion in slow motion. Exhaust gas leaves backwards carrying momentum, so the rocket gains exactly the same momentum forwards, and no air to push against is required. Gun recoil, a squid, a garden sprinkler and a person stepping off a boat are all the same calculation.',
        f: 'thrust = ṁ·v<sub>e</sub>   (momentum flow per second)',
        n: 'Try the Explosion collision type on the air track: total momentum stays zero while kinetic energy climbs from nothing. The energy came from the spring, not from the motion.' },
      { t: 'Snooker, billiards and the 90° rule',
        b: 'A cut shot is a nearly elastic collision between equal masses, so the cue ball and object ball always separate at close to 90°. Players use this constantly to predict where the cue ball finishes. The angle closes below 90° when the shot is played with follow or screw, because spin makes the collision effectively inelastic along the tangent.',
        n: 'Set two equal masses on the air table, e = 1, and drag the impact parameter through its whole range. The separation angle stays pinned at 90° while the split of speed changes completely.' },
      { t: 'Pile driving and forging',
        b: 'Here you <em>want</em> an inelastic collision. A pile driver transfers momentum to the pile and the lost kinetic energy does the useful work of pushing it into the ground. A forging hammer is chosen heavy and slow rather than light and fast for the same momentum, because a heavier ram loses a smaller fraction of its energy on impact.',
        n: 'The fraction of kinetic energy that survives a perfectly inelastic hit is m/(m+M) — small hammer, big workpiece, most of the energy goes into deformation. Exactly what a smith wants.' },
      { t: 'Particle physics and the moderator problem',
        b: 'Collision kinematics scales all the way down. Rutherford deduced the atomic nucleus from the scattering angles of alpha particles — the occasional backward bounce could only mean a target far heavier and far smaller than expected. And a nuclear reactor slows neutrons fastest with light nuclei, because equal masses transfer energy completely, which is why water and graphite are moderators and lead is not.',
        n: 'The centre-of-mass frame is the physicist\'s default here. In that frame the total momentum is zero and a two-body collision is completely described by one scattering angle.' }
    ],

    errors: [
      { t: '"Momentum is lost in an inelastic collision"',
        b: 'It is not. <strong>Kinetic energy</strong> is lost; momentum is conserved in every collision with no external force. The word "inelastic" says nothing whatever about momentum. Keeping these two statements apart resolves most of the confusion in this topic.',
        n: 'If the ledger ever reports momentum as not conserved, look for the external force — friction on the track, or a barrier bolted to the ground.' },
      { t: 'Adding speeds instead of signed velocities',
        b: 'Momentum is a vector. A 2 kg body at 3 m/s right and a 2 kg body at 3 m/s left have total momentum <em>zero</em>, not 12 kg·m/s. Choose a positive direction, write every velocity with its sign, and keep the sign all the way through.',
        n: 'This single error accounts for more lost marks in momentum questions than every other mistake combined.' },
      { t: 'Using energy conservation across an inelastic stage',
        b: 'In the ballistic pendulum, applying ½mv² = ½(m+M)V² to the embedding gives an answer that is too small by a factor of √((m+M)/m) — often ten-fold. Momentum survives the embedding; kinetic energy does not. Use momentum for the collision and energy only for the swing.',
        n: 'Rule of thumb: if the bodies deform, stick or make a noise, momentum is your equation, not energy.' },
      { t: 'Assuming e is a property of one object',
        b: 'A ball does not "have" a coefficient of restitution. e belongs to the pair of surfaces and to the impact speed. The same ball gives one value on concrete, another on a wooden floor, and a lower value at every increase in speed because more of the deformation goes plastic.',
        n: 'Always quote the impact speed and the surface alongside any value of e.' },
      { t: 'Forgetting that the 90° rule has three conditions',
        b: 'Equal masses, perfectly elastic, and one body initially at rest. Break any one and the separation angle is no longer 90°: unequal masses open it or close it, and any energy loss closes it. Testing this on the air table takes about ten seconds and makes the condition permanent.',
        n: 'A heavier incoming body gives a separation angle below 90°; a lighter one gives more than 90°.' }
    ]
  };

  var exploreCat = 'basics';
  function renderExplore() {
    var host = $('explore-cards');
    var cards = EXPLORE[exploreCat] || [];
    host.innerHTML = cards.map(function (c) {
      var h = '<div class="explore-card' + (c.wide ? ' wide' : '') + '"><h3>' + c.t + '</h3>';
      if (c.f) h += '<div class="ec-formula">' + c.f + '</div>';
      h += '<p>' + c.b + '</p>';
      if (c.table) {
        h += '<div class="ref-scroll"><table class="ref-table"><thead><tr>' +
          c.table.head.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr></thead><tbody>' +
          c.table.rows.map(function (r) {
            return '<tr>' + r.map(function (x) { return '<td>' + x + '</td>'; }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>';
      }
      if (c.src) h += '<p class="ref-src">' + c.src + '</p>';
      if (c.n) h += '<div class="ec-example">' + c.n + '</div>';
      return h + '</div>';
    }).join('');
  }

  /* ═══════════════════════ §24  Practice ═══════════════════════
     Numbers are randomised each time, so the same question can be worked
     repeatedly without memorising an answer. Every generator returns the
     exact answer plus the full worked solution. */

  function rnd(lo, hi, dp) {
    var v = lo + Math.random() * (hi - lo);
    var f = Math.pow(10, dp == null ? 1 : dp);
    return Math.round(v * f) / f;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var PRACTICE = [
    function () {              /* perfectly inelastic common velocity */
      var m1 = rnd(1, 6, 1), u1 = rnd(2, 9, 1), m2 = rnd(1, 6, 1);
      var V = m1 * u1 / (m1 + m2);
      return {
        q: 'A trolley of mass ' + m1 + ' kg moving at ' + u1 + ' m/s collides with a stationary trolley of mass ' +
           m2 + ' kg. They lock together. Find their common velocity.',
        a: V, u: 'm/s', tol: 0.02,
        s: 'Momentum is conserved: m₁u₁ = (m₁+m₂)V<br>' +
           m1 + ' × ' + u1 + ' = (' + m1 + ' + ' + m2 + ') V<br>' +
           'V = ' + fmt(m1 * u1, 2) + ' / ' + fmt(m1 + m2, 2) + ' = <strong>' + fmt(V, 3) + ' m/s</strong>'
      };
    },
    function () {              /* elastic, equal masses */
      var m = rnd(0.5, 4, 1), u = rnd(1, 8, 1);
      return {
        q: 'A ball of mass ' + m + ' kg moving at ' + u + ' m/s makes a head-on <em>elastic</em> collision with an identical stationary ball. What is the velocity of the first ball afterwards?',
        a: 0, u: 'm/s', tol: 0.02,
        s: 'For equal masses in an elastic collision the velocities are exchanged.<br>' +
           'v₁ = (m₁−m₂)u₁/(m₁+m₂) = 0 × ' + u + ' / ' + fmt(2 * m, 2) + ' = <strong>0 m/s</strong><br>' +
           'The first ball stops dead and the second moves off at ' + u + ' m/s. This is the Newton\'s-cradle result.'
      };
    },
    function () {              /* impulse → average force */
      var m = rnd(40, 90, 0), u = rnd(8, 25, 1), t = rnd(0.02, 0.5, 2);
      var F = m * u / t;
      return {
        q: 'A ' + m + ' kg body moving at ' + u + ' m/s is brought to rest in ' + t + ' s. Find the average force required.',
        a: F, u: 'N', tol: Math.max(1, F * 0.01),
        s: 'J = Δp = mΔv = ' + m + ' × ' + u + ' = ' + fmt(m * u, 1) + ' kg·m/s<br>' +
           'F<sub>avg</sub> = J/Δt = ' + fmt(m * u, 1) + ' / ' + t + ' = <strong>' + fmt(F, 0) + ' N</strong> (' + fmt(F / 1000, 2) + ' kN)'
      };
    },
    function () {              /* restitution from heights */
      var h0 = rnd(0.8, 2.5, 2), e = rnd(0.5, 0.9, 2);
      var h1 = Math.round(h0 * e * e * 1000) / 1000;
      var eAns = Math.sqrt(h1 / h0);
      return {
        q: 'A ball dropped from ' + h0 + ' m rebounds to ' + h1 + ' m. Find the coefficient of restitution.',
        a: eAns, u: '', tol: 0.01,
        s: 'e = √(h<sub>rebound</sub> / h<sub>drop</sub>) = √(' + h1 + ' / ' + h0 + ') = <strong>' + fmt(eAns, 3) + '</strong><br>' +
           'It also loses 1 − e² = ' + fmt(100 * (1 - eAns * eAns), 1) + ' % of its kinetic energy in the bounce.'
      };
    },
    function () {              /* energy lost, perfectly inelastic */
      var m1 = rnd(1, 5, 1), u1 = rnd(2, 8, 1), m2 = rnd(1, 5, 1);
      var V = m1 * u1 / (m1 + m2);
      var lost = 0.5 * m1 * u1 * u1 - 0.5 * (m1 + m2) * V * V;
      return {
        q: 'A ' + m1 + ' kg body at ' + u1 + ' m/s strikes a stationary ' + m2 + ' kg body and they move off together. How much kinetic energy is lost?',
        a: lost, u: 'J', tol: Math.max(0.02, lost * 0.01),
        s: 'V = m₁u₁/(m₁+m₂) = ' + fmt(V, 4) + ' m/s<br>' +
           'KE before = ½ × ' + m1 + ' × ' + u1 + '² = ' + fmt(0.5 * m1 * u1 * u1, 3) + ' J<br>' +
           'KE after = ½ × ' + fmt(m1 + m2, 2) + ' × ' + fmt(V, 4) + '² = ' + fmt(0.5 * (m1 + m2) * V * V, 3) + ' J<br>' +
           'Lost = <strong>' + fmt(lost, 3) + ' J</strong><br>' +
           'Check with ½μv<sub>rel</sub>²: μ = ' + fmt(reducedMass(m1, m2), 4) + ' kg, ½ × ' + fmt(reducedMass(m1, m2), 4) +
           ' × ' + u1 + '² = ' + fmt(0.5 * reducedMass(m1, m2) * u1 * u1, 3) + ' J ✓'
      };
    },
    function () {              /* recoil */
      var M = rnd(2, 6, 1), m = rnd(0.005, 0.03, 3), v = rnd(200, 500, 0);
      var V = m * v / M;
      return {
        q: 'A rifle of mass ' + M + ' kg fires a ' + (m * 1000).toFixed(1) + ' g bullet at ' + v + ' m/s. Find the recoil speed of the rifle.',
        a: V, u: 'm/s', tol: Math.max(0.01, V * 0.01),
        s: 'Total momentum before firing is zero, so 0 = mv − MV<br>' +
           'V = mv/M = (' + fmt(m, 4) + ' × ' + v + ') / ' + M + ' = <strong>' + fmt(V, 3) + ' m/s</strong><br>' +
           'The momenta are equal and opposite, but the kinetic energies are not: the bullet gets M/m ≈ ' +
           fmt(M / m, 0) + ' times as much.'
      };
    },
    function () {              /* ballistic pendulum */
      var m = rnd(8, 20, 0) / 1000, M = rnd(0.8, 3, 1), L = rnd(0.6, 1.2, 1), th = rnd(20, 55, 0);
      var h = L * (1 - Math.cos(th * Math.PI / 180));
      var V = Math.sqrt(2 * G * h);
      var v = (m + M) / m * V;
      return {
        q: 'A ' + (m * 1000).toFixed(0) + ' g bullet embeds in a ' + M + ' kg block hanging on a ' + L +
           ' m string. The block swings up to ' + th + '°. Find the speed of the bullet.',
        a: v, u: 'm/s', tol: Math.max(1, v * 0.015),
        s: 'h = L(1 − cos θ) = ' + L + '(1 − cos ' + th + '°) = ' + fmt(h, 4) + ' m<br>' +
           'V = √(2gh) = √(2 × 9.81 × ' + fmt(h, 4) + ') = ' + fmt(V, 4) + ' m/s<br>' +
           'mv = (m+M)V → v = (' + fmt(m + M, 4) + ' / ' + fmt(m, 4) + ') × ' + fmt(V, 4) +
           ' = <strong>' + fmt(v, 1) + ' m/s</strong>'
      };
    },
    function () {              /* general e, 1D */
      var m1 = rnd(1, 4, 1), m2 = rnd(1, 4, 1), u1 = rnd(3, 9, 1), e = rnd(0.3, 0.9, 1);
      var r = resolve1D(m1, u1, m2, 0, e);
      return {
        q: 'A ' + m1 + ' kg body at ' + u1 + ' m/s strikes a stationary ' + m2 + ' kg body. The coefficient of restitution is ' +
           e + '. Find the velocity of the <strong>second</strong> body after the collision.',
        a: r.v2, u: 'm/s', tol: Math.max(0.02, Math.abs(r.v2) * 0.01),
        s: 'v₂ = [m₁u₁ + m₂u₂ + m₁e(u₁−u₂)] / (m₁+m₂)<br>' +
           'v₂ = [' + fmt(m1 * u1, 2) + ' + 0 + ' + m1 + ' × ' + e + ' × ' + u1 + '] / ' + fmt(m1 + m2, 2) +
           ' = <strong>' + fmt(r.v2, 3) + ' m/s</strong><br>' +
           'And v₁ = ' + fmt(r.v1, 3) + ' m/s. Check the separation speed: ' + fmt(r.v2 - r.v1, 3) +
           ' = e × approach speed = ' + e + ' × ' + u1 + ' = ' + fmt(e * u1, 3) + ' ✓'
      };
    },
    function () {              /* crumple zone force comparison */
      var m = rnd(1000, 1800, 0), v = rnd(11, 28, 1), d = pick([0.05, 0.1, 0.4, 0.6, 0.9]);
      var F = m * v * v / (2 * d);
      return {
        q: 'A ' + m + ' kg car travelling at ' + v + ' m/s hits a rigid barrier and stops in a crumple distance of ' +
           d + ' m. Find the average force on the car.',
        a: F, u: 'N', tol: F * 0.01,
        s: 'Δt = 2d/v = 2 × ' + d + ' / ' + v + ' = ' + fmt(2 * d / v, 5) + ' s<br>' +
           'J = mv = ' + fmt(m * v, 0) + ' kg·m/s<br>' +
           'F = J/Δt = <strong>' + fmt(F, 0) + ' N</strong> = ' + fmt(F / 1000, 1) + ' kN = ' + fmt(F / (m * G), 1) + ' g<br>' +
           'Equivalently F = mv²/2d — double the crumple distance and the force halves.'
      };
    },
    function () {              /* 2D, 90 degree rule */
      var th = rnd(20, 70, 0);
      return {
        q: 'On a frictionless table a puck strikes an identical stationary puck in a perfectly elastic, off-centre collision. ' +
           'The struck puck leaves at ' + th + '° to the original direction. At what angle to the original direction does the first puck leave?',
        a: 90 - th, u: '°', tol: 0.5,
        s: 'For equal masses, e = 1 and one body at rest, momentum and energy conservation together require the two ' +
           'outgoing velocities to be perpendicular.<br>' +
           'θ₁ + θ₂ = 90° → θ₁ = 90° − ' + th + '° = <strong>' + (90 - th) + '°</strong> (on the other side of the line).<br>' +
           'Momentum gives u⃗ = v⃗₁ + v⃗₂ and energy gives u² = v₁² + v₂² — Pythagoras, so the triangle is right-angled.'
      };
    }
  ];

  var pq = null, pScore = { c: 0, n: 0 };

  function newPractice() {
    pq = PRACTICE[Math.floor(Math.random() * PRACTICE.length)]();
    $('pq-text').innerHTML = pq.q;
    $('pq-input-row').classList.remove('hidden');
    $('pq-answer').value = '';
    $('pq-unit').textContent = pq.u;
    $('pq-feedback').textContent = '';
    $('pq-feedback').className = 'feedback';
    $('pq-solution').classList.add('hidden');
    $('pq-answer').focus();
  }
  function checkPractice() {
    if (!pq) return;
    var v = parseFloat($('pq-answer').value);
    if (!isFinite(v)) { $('pq-feedback').textContent = 'Type a number first.'; return; }
    var ok = Math.abs(v - pq.a) <= pq.tol;
    pScore.n++; if (ok) pScore.c++;
    $('p-score').textContent = pScore.c + ' / ' + pScore.n;
    var fb = $('pq-feedback');
    fb.className = 'feedback ' + (ok ? 'ok' : 'err');
    fb.textContent = ok ? '✓ Correct — ' + fmt(pq.a, 3) + ' ' + pq.u
                        : '✗ Not quite. The answer is ' + fmt(pq.a, 3) + ' ' + pq.u + '. Open the solution to see why.';
    if (ok) playSuccess(); else playError();
  }
  function revealPractice() {
    if (!pq) return;
    var el = $('pq-solution');
    el.innerHTML = pq.s;
    el.classList.remove('hidden');
  }

  /* ═══════════════════════ §25  Quiz ═══════════════════════ */

  var QBANK = [
    { q: 'In which type of collision is momentum conserved?',
      o: ['Elastic collisions only', 'Inelastic collisions only', 'Every collision, provided no external force acts', 'Only when the two masses are equal'],
      a: 2, e: 'Momentum is conserved in every collision. Kinetic energy is the quantity that distinguishes elastic from inelastic.' },
    { q: 'Two identical trolleys approach each other at the same speed and stick together on impact. What happens?',
      o: ['They stop dead; all the kinetic energy is lost', 'They move off together at half the original speed', 'They rebound at the same speed', 'Momentum is destroyed'],
      a: 0, e: 'The total momentum was zero, so it must stay zero — they must be at rest. This is the one case where a collision can destroy all of the kinetic energy.' },
    { q: 'A ball is dropped from 2.0 m and rebounds to 1.28 m. What is the coefficient of restitution?',
      o: ['0.64', '0.80', '0.36', '1.56'],
      a: 1, e: 'e = √(h_rebound/h_drop) = √(1.28/2.0) = √0.64 = 0.80. Taking the ratio of the heights instead of its square root is the standard trap.' },
    { q: 'Why does an airbag reduce the force on a driver?',
      o: ['It reduces the change in momentum', 'It absorbs the momentum', 'It increases the time over which the momentum change occurs', 'It reverses the direction of the impulse'],
      a: 2, e: 'Δp is fixed by the speed of the crash. Since F = Δp/Δt, the only way to lower F is to raise Δt.' },
    { q: 'A 2 kg body at 4 m/s strikes a stationary 2 kg body elastically and head-on. What are the final velocities?',
      o: ['Both move at 2 m/s', 'First stops, second moves at 4 m/s', 'Both move at 4 m/s', 'First rebounds at 4 m/s, second stays still'],
      a: 1, e: 'Equal masses in an elastic head-on collision exchange velocities exactly. Both bodies moving at 2 m/s would conserve momentum but would lose half the kinetic energy, so it cannot be elastic.' },
    { q: 'During a collision, where is the centre of mass of the two-body system?',
      o: ['It stops during the contact', 'It accelerates towards the heavier body', 'It carries on at constant velocity', 'It reverses direction'],
      a: 2, e: 'Collision forces are internal to the system, so they cannot accelerate the centre of mass. Only an external force could.' },
    { q: 'A 10 g bullet embeds in a 1.99 kg block. What fraction of the kinetic energy survives?',
      o: ['About 99.5 %', 'About 50 %', 'About 0.5 %', 'None — it is a perfectly inelastic collision'],
      a: 2, e: 'The surviving fraction is m/(m+M) = 0.010/2.00 = 0.005, or 0.5 %. Momentum passes through untouched, but almost all the energy goes into heat and deformation.' },
    { q: 'Two pucks of equal mass collide elastically and off-centre, one initially at rest. The angle between their outgoing paths is:',
      o: ['Always 90°', 'Always 45°', 'Equal to the impact parameter', 'It depends on the speed'],
      a: 0, e: 'Momentum gives u⃗ = v⃗₁ + v⃗₂ and energy gives u² = v₁² + v₂². Together they are Pythagoras, so the angle must be 90°. It needs equal masses, e = 1 and one body at rest.' },
    { q: 'The area under a force–time graph for a collision represents:',
      o: ['The work done', 'The impulse, equal to the momentum change', 'The kinetic energy lost', 'The average force'],
      a: 1, e: 'J = ∫F dt = Δp. Work is the area under a force–<em>distance</em> graph, which is a different quantity entirely.' },
    { q: 'Two gliders are pushed apart from rest by a spring. Which statement is true?',
      o: ['Both momentum and kinetic energy increase', 'Total momentum stays zero; kinetic energy increases', 'Both stay constant', 'Momentum increases; kinetic energy stays zero'],
      a: 1, e: 'No external force acts, so the total momentum stays at zero — the two momenta are equal and opposite. The kinetic energy comes out of the spring, so it rises from nothing.' },
    { q: 'Increasing the crumple distance of a car from 0.05 m to 0.50 m changes the average impact force by a factor of about:',
      o: ['10 times smaller', '10 times larger', '100 times smaller', 'No change — the momentum change is the same'],
      a: 0, e: 'F = mv²/2d, so ten times the distance is one tenth of the force. The momentum change really is unchanged — that is exactly why the time has to do the work.' },
    { q: 'The coefficient of restitution of a tennis ball is quoted as 0.75. This value:',
      o: ['Is a fixed property of the rubber', 'Applies at any impact speed', 'Depends on the surface struck and the impact speed', 'Is the fraction of kinetic energy retained'],
      a: 2, e: 'e belongs to the pair of surfaces and falls as impact speed rises. The fraction of kinetic energy retained is e², not e — here 0.56.' }
  ];

  var quiz = { list: [], i: 0, sel: null, answers: [] };
  var QUIZ_SIZE = 5;

  function startQuiz() {
    var pool = QBANK.slice();
    quiz.list = [];
    for (var i = 0; i < QUIZ_SIZE && pool.length; i++) quiz.list.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    quiz.i = 0; quiz.answers = []; quiz.sel = null;
    $('quiz-result').classList.add('hidden');
    $('btn-quiz-submit').disabled = false;
    $('btn-quiz-next').disabled = true;
    showQuestion();
  }
  function showQuestion() {
    var q = quiz.list[quiz.i];
    $('qq-text').innerHTML = q.q;
    $('q-index').textContent = (quiz.i + 1) + ' / ' + quiz.list.length;
    var host = $('qq-options');
    host.classList.remove('hidden');
    host.innerHTML = q.o.map(function (o, i) { return '<button class="qq-opt" data-i="' + i + '">' + o + '</button>'; }).join('');
    quiz.sel = null;
    $('qq-feedback').textContent = '';
    $('qq-feedback').className = 'feedback';
    $('btn-quiz-submit').disabled = false;
    $('btn-quiz-next').disabled = true;
  }
  function submitQuiz() {
    if (quiz.sel == null) { $('qq-feedback').textContent = 'Choose an option first.'; return; }
    var q = quiz.list[quiz.i], ok = quiz.sel === q.a;
    quiz.answers.push(ok);
    var opts = $('qq-options').querySelectorAll('.qq-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].disabled = true;
      if (i === q.a) opts[i].classList.add('correct');
      else if (i === quiz.sel) opts[i].classList.add('wrong');
    }
    var fb = $('qq-feedback');
    fb.className = 'feedback ' + (ok ? 'ok' : 'err');
    fb.innerHTML = (ok ? '✓ Correct. ' : '✗ Not quite. ') + q.e;
    if (ok) playSuccess(); else playError();
    $('btn-quiz-submit').disabled = true;
    $('btn-quiz-next').disabled = false;
  }
  function nextQuiz() {
    quiz.i++;
    if (quiz.i >= quiz.list.length) { showQuizResult(); return; }
    showQuestion();
  }
  function showQuizResult() {
    var c = quiz.answers.filter(Boolean).length, n = quiz.list.length;
    var stars = c === n ? 5 : (c >= 4 ? 4 : (c >= 3 ? 3 : (c >= 2 ? 2 : 1)));
    var cls = c === n ? 'perfect' : (c >= 3 ? 'good' : 'poor');
    $('qq-options').classList.add('hidden');
    $('qq-text').textContent = 'Quiz complete.';
    $('qq-feedback').textContent = '';
    var el = $('quiz-result');
    el.classList.remove('hidden');
    el.innerHTML = '<div class="qr-header"><span class="qr-score ' + cls + '">' + c + ' / ' + n + '</span>' +
      '<span class="qr-stars">' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</span></div>' +
      '<div class="qr-rows">' + quiz.list.map(function (q, i) {
        return '<div class="qr-row ' + (quiz.answers[i] ? 'ok' : 'err') + '">' +
          (quiz.answers[i] ? '✓' : '✗') + ' ' + q.q + '</div>';
      }).join('') + '</div>';
    $('btn-quiz-submit').disabled = true;
    $('btn-quiz-next').disabled = true;
    if (c === n) playSuccess();
  }

  function setGraph(k) {
    S.graph = k;
    var tabs = $('graph-tabs').querySelectorAll('.pill');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i].dataset.graph === k);
    drawGraph();
  }

  /* ═══════════════════════ §26  Mode switching ═══════════════════════ */

  var SECTIONS = { simulate: 'sec-simulate', calculate: 'sec-calculate', explore: 'sec-explore', practice: 'sec-practice', quiz: 'sec-quiz' };

  function setMode(m) {
    S.mode = m;
    Object.keys(SECTIONS).forEach(function (k) {
      $(SECTIONS[k]).classList.toggle('hidden', k !== m);
    });
    var tabs = $('mode-tabs').querySelectorAll('.pill');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i].dataset.mode === m);
    if (m !== 'simulate') setRunning(false);
    renderBadges();
    if (m === 'explore') renderExplore();
    if (m === 'calculate') buildCalc();
  }

  /* Only the 1D track models friction, so the button hides elsewhere rather
     than sitting there doing nothing. */
  function syncFriction() {
    var b = $('btn-friction');
    var on = !!S.tr.friction;
    b.style.display = (S.appa === 'track') ? '' : 'none';
    b.innerHTML = '\u25A8 Friction: ' + (on ? 'on' : 'off');
    b.classList.toggle('dock-btn-warn', on);
  }

  function syncTypeTabs() {
    var tabs = $('type-tabs').querySelectorAll('.pill');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i].dataset.type === S.type);
    /* the explosion set-up only makes sense on the linear track */
    $('type-tabs').querySelector('[data-type="explosion"]').style.display = (S.appa === 'track') ? '' : 'none';
    $('type-group').style.display = (S.appa === 'pendulum') ? 'none' : '';
  }

  /* ═══════════════════════ §27  Canvas interaction ═══════════════════════
     Bodies can be dragged to a new starting position, and their velocity
     arrows can be grabbed by the tip and pulled to set the initial velocity —
     the same gesture the physics itself uses. */

  var drag = null;

  function bodyScreen(i) {
    var b = S.bodies[i];
    if (!b) return null;
    if (S.appa === 'track') return { x: tx(b.x), y: TY - 26, r: b.r * TSC };
    if (S.appa === 'table') return { x: bx(b.x), y: by(b.y), r: b.r * TBSC };
    return null;
  }

  function onPointerDown(ev) {
    if (S.mode !== 'simulate') return;
    if (S.appa !== 'track' && S.appa !== 'table') return;
    var p = toCanvas(ev);
    for (var i = 0; i < S.bodies.length; i++) {
      var sc = bodyScreen(i);
      if (!sc) continue;
      var b = S.bodies[i], v = vShown(b);
      /* the arrow tip first — it sits outside the body */
      if (S.flags.vel) {
        var ax = sc.x + v.x * VSC, ay = (S.appa === 'track' ? TY - 96 - i * 26 : sc.y) + (S.appa === 'table' ? v.y * VSC : 0);
        if (Math.hypot(p.x - ax, p.y - ay) < 20) {
          drag = { i: i, kind: 'vel' }; cvs.setPointerCapture(ev.pointerId); playClick(); return;
        }
      }
      if (Math.hypot(p.x - sc.x, p.y - sc.y) < Math.max(24, sc.r + 8)) {
        drag = { i: i, kind: 'pos' }; cvs.setPointerCapture(ev.pointerId); playClick(); return;
      }
    }
  }

  function onPointerMove(ev) {
    if (!drag) {
      if (S.mode === 'simulate' && (S.appa === 'track' || S.appa === 'table')) {
        var p0 = toCanvas(ev), over = false;
        for (var k = 0; k < S.bodies.length; k++) {
          var s0 = bodyScreen(k);
          if (s0 && Math.hypot(p0.x - s0.x, p0.y - s0.y) < Math.max(24, s0.r + 8)) over = true;
        }
        cvs.style.cursor = over ? 'grab' : 'default';
      }
      return;
    }
    var p = toCanvas(ev), b = S.bodies[drag.i];
    setRunning(false);
    if (drag.kind === 'pos') {
      if (S.appa === 'track') {
        b.x = clamp((p.x - TX0) / TSC - frameDX(), b.r, TRACK_LEN - b.r);
      } else {
        b.x = clamp((p.x - TBX0) / TBSC, b.r, TABLE_W - b.r);
        b.y = clamp((p.y - TBY0) / TBSC, b.r, TABLE_H - b.r);
        if (drag.i === 1) S.tb.b = clamp((b.y - S.bodies[0].y) / (S.bodies[0].r + b.r), -1, 1);
      }
    } else {
      var sc = bodyScreen(drag.i);
      if (S.appa === 'track') {
        var nv = clamp((p.x - sc.x) / VSC, -2.5, 2.5);
        b.vx = nv; if (drag.i === 0) S.tr.u1 = nv; else S.tr.u2 = nv;
      } else {
        b.vx = clamp((p.x - sc.x) / VSC, -2.5, 2.5);
        b.vy = clamp((p.y - sc.y) / VSC, -2.5, 2.5);
        if (drag.i === 0) S.tb.u1 = Math.hypot(b.vx, b.vy); else S.tb.u2 = b.vx;
      }
      refreshSliders();
    }
    S.before = snapshot(S.bodies);
    S.cmRef = comPos(S.bodies).x;
    S.keRef = Math.max(1e-9, kinetic(S.bodies));
    refreshAll();
  }

  function onPointerUp(ev) {
    if (drag) { try { cvs.releasePointerCapture(ev.pointerId); } catch (e) {} }
    drag = null;
  }

  /* ═══════════════════════ §28  Wiring ═══════════════════════ */

  function wire() {
    /* mode */
    $('mode-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      playClick(); setMode(b.dataset.mode);
    });

    /* apparatus */
    $('appa-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      playClick();
      S.appa = b.dataset.appa;
      var tabs = $('appa-tabs').querySelectorAll('.pill');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === b);
      if (S.type === 'explosion' && S.appa !== 'track') S.type = 'elastic';
      if (S.appa === 'cradle' && S.type === 'inelastic') S.type = 'partial';
      setupCanvas();                     // each rig has its own canvas height
      syncFriction();
      /* The before/after bars are meaningless on the cradle (a chain of many
         collisions) and the crash rig is all about the force pulse, so each
         rig opens on the view that says something. */
      setGraph(S.appa === 'cradle' ? 'pt' : (S.appa === 'crash' ? 'ft' : 'bars'));
      syncTypeTabs(); buildControls(); resetRun(); renderLog();
      $('graph-tabs').querySelector('[data-graph="ft"]').style.display = '';
    });

    /* collision type */
    $('type-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      playClick(); S.type = b.dataset.type;
      syncTypeTabs(); buildControls(); resetRun();
    });

    /* units */
    $('unit-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      playClick(); S.units = b.dataset.unit;
      var tabs = $('unit-tabs').querySelectorAll('.pill');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === b);
      refreshSliders(); refreshAll(); renderLog(); if (S.mode === 'calculate') buildCalc();
    });

    /* graph view */
    $('graph-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      playClick(); setGraph(b.dataset.graph);
    });

    /* display panel */
    $('cd-handle').addEventListener('click', function () {
      var p = $('canvas-display');
      var col = p.dataset.collapsed === 'true';
      p.dataset.collapsed = col ? 'false' : 'true';
      $('cd-handle').setAttribute('aria-expanded', col ? 'true' : 'false');
      playClick();
    });
    $('display-toggles').addEventListener('click', function (e) {
      var b = e.target.closest('.toggle-chip'); if (!b) return;
      playClick();
      if (b.id === 'btn-sound') {
        S.sound = !S.sound;
        b.classList.toggle('active', S.sound);
        b.querySelector('.snd-ico').textContent = S.sound ? '🔊' : '🔇';
        return;
      }
      var f = b.dataset.flag;
      S.flags[f] = !S.flags[f];
      b.classList.toggle('active', S.flags[f]);
      if (f === 'cmframe' && S.flags.cmframe && S.bodies.length) S.cmRef = comPos(S.bodies).x;
      if (f === 'path') S.paths = [[], []];
      refreshAll();
    });

    /* dock */
    $('btn-run').addEventListener('click', function () { playClick(); setRunning(!S.running); });
    $('btn-step').addEventListener('click', function () {
      playClick(); setRunning(false);
      if (S.appa === 'pendulum' && S.pdState.phase === 'ready') S.pdState.phase = 'flying';
      if (S.appa === 'crash' && S.crash.phase === 'ready') S.crash.phase = 'approach';
      step(0.012 * timeScale() * 4); readGates(); refreshAll();
    });
    $('btn-friction').addEventListener('click', function () {
      playClick();
      S.tr.friction = !S.tr.friction;
      syncFriction();
      resetRun();
    });
    $('btn-reset').addEventListener('click', function () { playClick(); resetRun(); });
    $('btn-record').addEventListener('click', function () { recordRun(); });
    $('btn-speed').addEventListener('click', function () {
      playClick();
      var order = [0.25, 0.5, 1, 2];
      S.speed = order[(order.indexOf(S.speed) + 1) % order.length];
      $('btn-speed').innerHTML = '⏱ ' + (S.speed === 0.25 ? '¼' : S.speed === 0.5 ? '½' : S.speed) + '×';
    });

    /* preset dropdown */
    $('preset-select').addEventListener('change', function () {
      var v = $('preset-select').value;
      if (v !== '') applyPreset(parseInt(v, 10));
    });

    /* readings table actions */
    $('btn-csv').addEventListener('click', exportCSV);
    $('btn-png').addEventListener('click', exportPNG);
    $('btn-clearlog').addEventListener('click', function () {
      S.log = S.log.filter(function (r) { return r.appa !== S.appa; });
      renderLog(); playClick();
    });

    /* canvas context menu */
    var menu = $('canvas-ctx-menu');
    cvs.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var r = $('canvas-card').getBoundingClientRect();
      menu.style.left = (e.clientX - r.left) + 'px';
      menu.style.top = (e.clientY - r.top) + 'px';
      menu.classList.remove('hidden');
    });
    document.addEventListener('click', function () { menu.classList.add('hidden'); });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      var a = b.dataset.act;
      if (a === 'save') exportPNG();
      else if (a === 'copy') copyReadings();
      else if (a === 'record') recordRun();
      else if (a === 'reset') resetRun();
      menu.classList.add('hidden');
    });

    /* canvas pointer */
    cvs.addEventListener('pointerdown', onPointerDown);
    cvs.addEventListener('pointermove', onPointerMove);
    cvs.addEventListener('pointerup', onPointerUp);
    cvs.addEventListener('pointercancel', onPointerUp);

    /* calculate */
    $('calc-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      playClick(); calcKey = b.dataset.calc;
      var tabs = $('calc-tabs').querySelectorAll('.pill');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === b);
      buildCalc();
    });

    /* explore */
    $('explore-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      playClick(); exploreCat = b.dataset.cat;
      var tabs = $('explore-tabs').querySelectorAll('.pill');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('active', tabs[i] === b);
      renderExplore();
    });

    /* practice + quiz */
    $('btn-new-q').addEventListener('click', function () { playClick(); newPractice(); });
    $('btn-check').addEventListener('click', function () { checkPractice(); });
    $('btn-reveal').addEventListener('click', function () { playClick(); revealPractice(); });
    $('pq-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });
    $('btn-quiz-start').addEventListener('click', function () { playClick(); startQuiz(); });
    $('btn-quiz-submit').addEventListener('click', function () { submitQuiz(); });
    $('btn-quiz-next').addEventListener('click', function () { playClick(); nextQuiz(); });
    $('qq-options').addEventListener('click', function (e) {
      var b = e.target.closest('.qq-opt'); if (!b || b.disabled) return;
      quiz.sel = parseInt(b.dataset.i, 10);
      var opts = $('qq-options').querySelectorAll('.qq-opt');
      for (var i = 0; i < opts.length; i++) opts[i].classList.toggle('selected', opts[i] === b);
      playClick();
    });

    /* keyboard shortcuts on the simulate canvas */
    document.addEventListener('keydown', function (e) {
      if (S.mode !== 'simulate') return;
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); setRunning(!S.running); }
      else if (e.key === 'r' || e.key === 'R') resetRun();
    });

    window.addEventListener('resize', function () { setupCanvas(); draw(); });
  }

  /* ═══════════════════════ §29  Init ═══════════════════════ */

  function init() {
    cvs = $('main-canvas'); ctx = cvs.getContext('2d');
    gcvs = $('graph-canvas'); gctx = gcvs.getContext('2d');
    setupCanvas();
    syncTypeTabs();
    syncFriction();
    buildControls();
    resetRun();
    renderExplore();
    buildCalc();
    renderLog();
    wire();
    setMode('simulate');
    draw();
    refreshPanels();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
