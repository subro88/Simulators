/* ═══════════════════════════════════════════════════════════════
   Refraction of Light Simulator — NHIT VisualLab
   Optical-bench virtual lab: semicircular block, rectangular slab,
   prism and apparent-depth tank. Snell's law, critical angle and
   total internal reflection, lateral displacement, dispersion and
   real/apparent depth, with a live sin i – sin r graph.
   Vanilla JS, no dependencies. IIFE, strict mode.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. DOM refs ───────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  var canvas = $('main-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  /* ── 2. Optical data ───────────────────────────────────────── */

  var C0 = 2.99792458e8;          /* speed of light in vacuum, m/s */
  var LAM_D = 0.5893;             /* sodium D line, µm — the wavelength every
                                     quoted refractive index refers to */
  var LAM_F = 0.4861, LAM_C = 0.6563;   /* hydrogen F and C lines */

  /* Cauchy's two-term dispersion, n(λ) = A + B/λ².
     A and B are derived from the quoted n_D and the Abbe number V_d
     rather than tabulated separately, because
        V_d = (n_D − 1) / (n_F − n_C)  and  n_F − n_C = B(1/λ_F² − 1/λ_C²)
     fixes B, and n_D then fixes A. For borosilicate crown this returns
     A = 1.5047, B = 0.00422 µm², matching the published BK7 constants. */
  var DK = 1 / (LAM_F * LAM_F) - 1 / (LAM_C * LAM_C);   /* = 1.9105 µm⁻² */

  var MEDIA = [
    { id: 'vacuum',   name: 'Vacuum',            nd: 1.0000, V: null, kind: 'gas',
      tint: [140, 170, 200], a: 0.03, note: 'n = 1 exactly, by definition.' },
    { id: 'air',      name: 'Air',               nd: 1.0003, V: 89,   kind: 'gas',
      tint: [150, 185, 215], a: 0.04, note: 'Treated as 1.00 in school work.' },
    { id: 'ice',      name: 'Ice',               nd: 1.310,  V: 71,   kind: 'solid',
      tint: [170, 215, 240], a: 0.24, note: 'Slightly less dense optically than liquid water.' },
    { id: 'water',    name: 'Water',             nd: 1.333,  V: 55.6, kind: 'liquid',
      tint: [ 70, 165, 215], a: 0.34, note: 'The standard liquid of school optics.' },
    { id: 'ethanol',  name: 'Ethanol',           nd: 1.361,  V: 60.6, kind: 'liquid',
      tint: [130, 190, 210], a: 0.26, note: 'Less dense than water, yet optically denser.' },
    { id: 'quartz',   name: 'Fused quartz',      nd: 1.4585, V: 67.8, kind: 'solid',
      tint: [190, 220, 235], a: 0.20, note: 'Low dispersion — used for lenses and fibre.' },
    { id: 'glycerol', name: 'Glycerol',          nd: 1.473,  V: 57,   kind: 'liquid',
      tint: [200, 205, 170], a: 0.28, note: 'Close to crown glass — used in index matching.' },
    { id: 'perspex',  name: 'Perspex (acrylic)', nd: 1.491,  V: 57.2, kind: 'solid',
      tint: [175, 215, 225], a: 0.22, note: 'The plastic block used in most school kits.' },
    { id: 'crown',    name: 'Crown glass',       nd: 1.517,  V: 64.2, kind: 'solid',
      tint: [165, 210, 225], a: 0.24, note: 'The classic optical glass, n ≈ 1.5.' },
    { id: 'flint',    name: 'Flint glass',       nd: 1.620,  V: 36.4, kind: 'solid',
      tint: [185, 200, 235], a: 0.27, note: 'High dispersion — the prism glass of choice.' },
    { id: 'sapphire', name: 'Sapphire',          nd: 1.768,  V: 72.2, kind: 'solid',
      tint: [150, 190, 245], a: 0.30, note: 'Hard, scratch-proof watch and sensor windows.' },
    { id: 'diamond',  name: 'Diamond',           nd: 2.417,  V: 32.2, kind: 'solid',
      tint: [210, 230, 250], a: 0.30, note: 'Highest common n — critical angle only 24.4°.' },
    { id: 'custom',   name: 'Custom medium',     nd: 1.600,  V: null, kind: 'solid',
      tint: [190, 200, 220], a: 0.25, note: 'Type any refractive index from 1.00 to 3.00.' }
  ];

  /* A block is a solid, a tank holds a liquid, and the thing above a tank is a
     gas. Offering ethanol as a prism, or diamond as the air above a beaker,
     is not a choice a student should ever be given. Custom is always offered
     as the escape hatch for any index you like. */
  function mediaFor(slot) {
    var app = state.app, out = [], i, m;
    for (i = 0; i < MEDIA.length; i++) {
      m = MEDIA[i];
      if (m.id === 'custom') { out.push(m); continue; }
      if (slot === 'm2') {
        /* the specimen: a liquid for the tank, a solid for every block */
        if (app === 'depth' ? m.kind === 'liquid' : m.kind === 'solid') out.push(m);
      } else {
        /* what surrounds it: a gas above a tank, a gas or a liquid around a
           block, because immersing a block is a real and instructive setup */
        if (app === 'depth' ? m.kind === 'gas' : (m.kind === 'gas' || m.kind === 'liquid')) out.push(m);
      }
    }
    return out;
  }

  function defaultMedium(slot) {
    if (slot === 'm1') return 'air';
    if (state.app === 'depth') return 'water';
    if (state.app === 'prism') return 'flint';      /* the classic prism glass */
    return 'crown';
  }

  function medium(id) {
    for (var i = 0; i < MEDIA.length; i++) if (MEDIA[i].id === id) return MEDIA[i];
    return MEDIA[1];
  }

  /* Refractive index of a medium at wavelength λ (nm). */
  function nOf(id, wlNm) {
    var m = medium(id);
    var nd = (id === 'custom') ? state.customN : m.nd;
    if (!m.V) return nd;                                  /* non-dispersive here */
    var B = (nd - 1) / (m.V * DK);
    var A = nd - B / (LAM_D * LAM_D);
    var l = (wlNm || 589.3) / 1000;                       /* nm → µm */
    return A + B / (l * l);
  }

  /* ── 3. Refraction engine ──────────────────────────────────── */

  var DEG = Math.PI / 180;
  function rad(d) { return d * DEG; }
  function deg(r) { return r / DEG; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* Snell's law. Returns the refraction angle in radians, or null when the
     ray is totally internally reflected. */
  function refractAngle(n1, n2, thetaI) {
    var s = n1 * Math.sin(thetaI) / n2;
    if (s > 1 || s < -1) return null;
    return Math.asin(s);
  }

  /* Critical angle exists only going from optically denser to rarer. */
  function critical(n1, n2) {
    if (n1 <= n2) return null;
    return Math.asin(n2 / n1);
  }

  /* Fresnel reflectance for unpolarised light — the fraction of the incident
     intensity reflected at the boundary. Refraction never happens alone:
     a few per cent always comes straight back, rising to 100% at the
     critical angle. */
  function reflectance(n1, n2, thetaI) {
    var t = refractAngle(n1, n2, thetaI);
    if (t === null) return 1;
    var ci = Math.cos(thetaI), ct = Math.cos(t);
    var rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
    var rp = (n1 * ct - n2 * ci) / (n1 * ct + n2 * ci);
    return clamp((rs * rs + rp * rp) / 2, 0, 1);
  }

  /* Brewster angle — the incidence at which the reflected ray is completely
     plane polarised. */
  function brewster(n1, n2) { return Math.atan(n2 / n1); }

  /* ── 4. State ──────────────────────────────────────────────── */

  var state = {
    mode: 'simulate',
    app: 'prism',           /* prism | semi | slab | depth */
    dir: 'in',              /* semi: 'in' = medium 1 → block, 'out' = block → medium 1 */
    m1: 'air',              /* the surrounding medium */
    m2: 'flint',            /* the block / liquid — flint disperses most */
    customN: 1.60,
    /* The angle control is shared but means a different thing on each bench and
       has a different useful range, so each remembers its own setting. Carrying
       50° over to the tank lands past the critical angle of every liquid, and
       carrying 35° back to the prism lands below its emergence limit — both
       give a blank-looking first frame for no reason. */
    angFor: { prism: 50, semi: 40, slab: 50, depth: 35 },
    ang: 50,                /* angle of incidence, or viewing angle in depth mode.
                               50° puts a 60° flint prism within a degree of its
                               minimum deviation, which is the symmetric, and by
                               far the most legible, passage to open on. */
    thick: 40,              /* slab thickness, mm */
    apex: 60,               /* prism apex angle, ° */
    realDepth: 80,          /* apparent-depth tank, mm */
    wl: 650,                /* wavelength, nm — a 650 nm red laser diode, the
                               source in almost every school optics kit */
    white: false,           /* white light — swaps the laser for a ray box and
                               shows dispersion */
    graph: 'sinsin',
    rows: [],               /* recorded (i, r) readings */
    unknown: false,
    trueUnknown: null,      /* concealed n of the sealed block */
    sweep: false,
    fired: false,           /* is the lamp switched on? */
    fireT0: 0,              /* when it was switched on — drives the beam travel */
    sound: true,
    show: {
      grid: true, protractor: true, normal: true, arcs: true,
      labels: true, reflect: true, waves: false, pins: false, screen: true
    },
    audioCtx: null
  };

  /* ── 5. Sound ──────────────────────────────────────────────── */

  function audio() {
    if (!state.audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      state.audioCtx = new AC();
    }
    if (state.audioCtx.state === 'suspended') state.audioCtx.resume();
    return state.audioCtx;
  }

  function playTone(freq, dur, type, vol) {
    if (!state.sound) return;
    var ac = audio(); if (!ac) return;
    var osc = ac.createOscillator(), g = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, ac.currentTime + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(g); g.connect(ac.destination);
    osc.start(); osc.stop(ac.currentTime + dur + 0.02);
  }

  function playClick()   { playTone(800, 0.05, 'square', 0.035); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.09); setTimeout(function () { playTone(1100, 0.15, 'sine', 0.09); }, 120); }
  function playError()   { playTone(300, 0.20, 'sawtooth', 0.055); }
  function playTIR()     { playTone(220, 0.16, 'triangle', 0.07); setTimeout(function () { playTone(330, 0.20, 'triangle', 0.055); }, 130); }
  function playRecord()  { playTone(620, 0.07, 'sine', 0.05); setTimeout(function () { playTone(930, 0.09, 'sine', 0.045); }, 80); }
  function playFire()    { playTone(1400, 0.06, 'sine', 0.045); setTimeout(function () { playTone(1900, 0.10, 'sine', 0.035); }, 55); }

  /* ── 6. Solution — one object shared by drawing and readouts ── */

  /* Which medium the light starts in, and which it crosses into, depends on
     the apparatus and (for the semicircular block) which way round it is. */
  function incidentMedia() {
    if (state.app === 'depth') return { a: state.m2, b: state.m1 };   /* liquid → air */
    if (state.app === 'semi' && state.dir === 'out') return { a: state.m2, b: state.m1 };
    return { a: state.m1, b: state.m2 };
  }

  var sol = {};

  function solve() {
    /* White light has no single wavelength, so every quoted angle, index and
       speed is referred to the sodium D line — the wavelength every published
       refractive index is measured at. Otherwise the readouts would silently
       follow whatever the (disabled) wavelength slider last held. */
    var wl = state.white ? 589.3 : state.wl;
    var mm = incidentMedia();
    var n1 = nOf(mm.a, wl), n2 = nOf(mm.b, wl);
    var i = rad(state.ang);
    var r = refractAngle(n1, n2, i);

    sol.wl = wl;
    sol.idA = mm.a; sol.idB = mm.b;
    sol.n1 = n1; sol.n2 = n2;
    sol.nRel = n2 / n1;
    sol.i = i;
    sol.r = r;
    sol.tir = (r === null);
    sol.C = critical(n1, n2);
    sol.R = reflectance(n1, n2, i);
    sol.T = 1 - sol.R;
    sol.brew = brewster(n1, n2);
    sol.v1 = C0 / n1; sol.v2 = C0 / n2;
    sol.lam1 = wl / n1; sol.lam2 = wl / n2;
    sol.freq = C0 / (wl * 1e-9) / n1 * n1;                 /* λ₀ fixes f; unchanged */

    /* apparatus-specific quantities */
    sol.lateral = null; sol.dev = null; sol.devMin = null; sol.r2s = null; sol.i2s = null;
    sol.apparent = null; sol.paraxial = null; sol.shift = null;
    sol.exitAngle = null; sol.tirFace2 = false;

    sol.trace = null;
    if (state.app === 'slab') {
      sol.trace = traceSlab(wl);
      /* the textbook formula only describes a ray that crosses the two
         parallel faces; at extreme angles the ray leaves through a side and
         there is no lateral displacement to quote */
      if (sol.trace.ok && sol.trace.exitEdge === 2 && r !== null) {
        sol.lateral = state.thick * Math.sin(i - r) / Math.cos(r);
        sol.exitAngle = sol.trace.i2;
      }
    } else if (state.app === 'prism') {
      var A = rad(state.apex);
      sol.apex = A;
      sol.trace = tracePrism(wl);
      var tp = sol.trace;
      /* A ray that bounced inside did not leave through the second refracting
         face, so D = i1 + i2 - A no longer describes it — whatever angle it
         finally emerged at, quoting it as "the deviation" would be wrong. */
      sol.tirInside = tp.tirCount > 0;
      if (tp.ok && !sol.tirInside) {
        sol.dev = tp.dev; sol.exitAngle = tp.i2; sol.r2 = tp.r2;
        /* r₁ + r₂ = A is a SIGNED statement. Once r₁ exceeds the apex angle the
           ray meets the second face on the far side of its normal and r₂ turns
           negative; the tracer only returns a magnitude, so "r₂ = A − r₁" was
           printing 30° − 30.3° = 0.3° instead of −0.3°. Take the signed values
           from the definition — their magnitudes match the trace, and the
           identity then reads correctly at every apex angle. */
        if (r !== null) {
          sol.r2s = A - r;
          var s2s = (n2 / n1) * Math.sin(sol.r2s);
          sol.i2s = (Math.abs(s2s) <= 1) ? Math.asin(s2s) : null;
        }
      } else {
        sol.tirFace2 = true;
      }
      var sMin = (n2 / n1) * Math.sin(A / 2);
      sol.devMin = (sMin <= 1) ? (2 * Math.asin(sMin) - A) : null;
      /* The smallest angle of incidence at which light still emerges through
         the second face: r2 must not exceed the critical angle, and
         r1 = A - r2, so i1min = asin(n sin(A - C)). */
      var Cp = critical(n2, n1);
      sol.iMin = null;
      if (Cp !== null) {
        var sMinI = (n2 / n1) * Math.sin(A - Cp);
        sol.iMin = (sMinI <= 1 && sMinI >= -1) ? Math.asin(sMinI) : null;
        if (A - Cp <= 0) sol.iMin = 0;
      }
    } else if (state.app === 'depth') {
      /* n1 here is the liquid, n2 the medium above (air). The paraxial result
         is the textbook one; the drawn geometry gives the true value for the
         finite viewing angle actually used. */
      sol.paraxial = state.realDepth * n2 / n1;
      if (r !== null && i > 1e-6) {
        sol.apparent = state.realDepth * Math.tan(i) / Math.tan(r);
      } else {
        sol.apparent = sol.paraxial;
      }
      sol.shift = state.realDepth - sol.apparent;
    }
    return sol;
  }

  /* ── 7. Vector geometry (used by the prism tracer) ─────────── */

  function vsub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function vlen(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1]); }
  function vnorm(a) { var l = vlen(a) || 1; return [a[0] / l, a[1] / l]; }
  function vdot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function vadd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function vmul(a, k) { return [a[0] * k, a[1] * k]; }
  function vang(a) { return Math.atan2(a[1], a[0]); }
  function fromAng(t) { return [Math.cos(t), Math.sin(t)]; }

  /* Vector form of Snell's law. n must point against the incident ray.
     eta = n_from / n_to. Returns null on total internal reflection. */
  function refractVec(d, nrm, eta) {
    var ci = -vdot(nrm, d);
    var k = 1 - eta * eta * (1 - ci * ci);
    if (k < 0) return null;
    var s = eta * ci - Math.sqrt(k);
    return vnorm([eta * d[0] + s * nrm[0], eta * d[1] + s * nrm[1]]);
  }

  function reflectVec(d, nrm) {
    var dt = vdot(d, nrm);
    return [d[0] - 2 * dt * nrm[0], d[1] - 2 * dt * nrm[1]];
  }

  /* Nearest forward hit of a ray on the edges of a closed polygon.
     Returns { p, nrm (outward), edge, t } or null. */
  function polyHit(org, dir, poly) {
    var best = null, i;
    for (i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length];
      var e = vsub(b, a);
      var den = dir[0] * (-e[1]) + dir[1] * e[0];
      if (Math.abs(den) < 1e-9) continue;
      var rel = vsub(a, org);
      var t = (rel[0] * (-e[1]) + rel[1] * e[0]) / den;
      var u = (rel[0] * (-dir[1]) + rel[1] * dir[0]) / den;
      if (t > 1e-4 && u >= -1e-6 && u <= 1 + 1e-6) {
        if (!best || t < best.t) {
          /* polygon is wound clockwise on screen, so (e_y, −e_x) points out */
          var nn = vnorm([e[1], -e[0]]);
          best = { p: vadd(org, vmul(dir, t)), nrm: nn, edge: i, t: t, u: u };
        }
      }
    }
    return best;
  }

  /* ── 8. Colour of light ────────────────────────────────────── */

  /* A serviceable visible-spectrum approximation (Bruton's algorithm),
     used both for the ray colour and the dispersion fan. */
  function wlRGB(nm) {
    var r = 0, g = 0, b = 0, f = 1;
    if (nm >= 380 && nm < 440)      { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490)              { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510)              { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580)              { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645)              { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780)             { r = 1; }
    if (nm >= 380 && nm < 420) f = 0.3 + 0.7 * (nm - 380) / 40;
    else if (nm > 700 && nm <= 780) f = 0.3 + 0.7 * (780 - nm) / 80;
    var lift = 0.28;                    /* keep deep violet/red visible on black */
    return [
      Math.round(255 * Math.min(1, Math.pow(r * f, 0.8) + lift * r)),
      Math.round(255 * Math.min(1, Math.pow(g * f, 0.8) + lift * g)),
      Math.round(255 * Math.min(1, Math.pow(b * f, 0.8) + lift * b))
    ];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function rayColour() { return state.white ? [255, 250, 235] : wlRGB(state.wl); }

  /* Enough samples that the fan reads as a continuous spectrum rather than a
     handful of separate lines. Each is traced independently — the spread is
     the real difference in refractive index, not a painted gradient. */
  var SPECTRUM = (function () {
    var a = [], w;
    for (w = 680; w >= 405; w -= 11) a.push(w);
    return a;
  })();

  /* ── 9. Canvas sizing (Hi-DPI) ─────────────────────────────── */

  /* The optical bench is always drawn into a fixed 610 x 560 design box and
     placed with a transform, so its drawing code never changes between the
     side-by-side desktop layout and the stacked phone layout. */
  var APP_W = 610, APP_H = 560;
  var W = 980, H = 560;
  var GX = 676, GY = 76, GW = 272, GH = 272;
  var appTX = 0, appTY = 0, appScale = 1;
  var portrait = false;

  function layout(cssW) {
    portrait = cssW < 660;
    if (portrait) {
      W = 610; H = 1010;
      appScale = 1; appTX = 0; appTY = 0;
      GX = 92; GY = 654; GW = 452; GH = 300;
    } else {
      W = 980; H = 560;
      appScale = 1; appTX = 0; appTY = 0;
      GX = 676; GY = 76; GW = 272; GH = 272;
    }
  }

  /* The action dock floats over the bottom of the canvas and has a FIXED css
     height, so the narrower the canvas the bigger the share of the design box
     it hides — and it grows again when its buttons wrap to a second row. A
     hard-coded bottom margin is therefore wrong at every width but one, so the
     covered strip is measured. Below 720px the dock becomes a static block
     under the canvas and hides nothing. */
  var dockTopDesign = H;

  function measureChrome() {
    dockTopDesign = H;
    var dock = $('canvas-dock');
    if (!dock) return;
    if (window.getComputedStyle(dock).position !== 'absolute') return;
    var cr = canvas.getBoundingClientRect(), dr = dock.getBoundingClientRect();
    if (cr.height < 20) return;
    dockTopDesign = (dr.top - cr.top) / cr.height * H;
  }

  /* Lowest design-y a label may use and still be read. */
  function safeBottom(pad) {
    var q = pad == null ? 12 : pad;
    return Math.min(PAPER.y + PAPER.h - q, dockTopDesign - q);
  }

  /* Measured once per resize, never inside draw() — a getBoundingClientRect()
     per animation frame forces layout every frame. A ResizeObserver refits the
     moment the real layout size arrives, and a <40px reading is rejected so a
     pre-layout measurement can never size the backing store. */
  var fitScale = 1, cssWCache = 0;

  function fitCanvas() {
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width >= 40 ? rect.width : (cssWCache || 980);
    cssWCache = cssW;
    layout(cssW);
    var dpr = window.devicePixelRatio || 1;
    var pxW = Math.round(cssW * dpr);
    var pxH = Math.round(cssW * (H / W) * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW; canvas.height = pxH;
    }
    fitScale = pxW / W;
    measureChrome();
    return fitScale;
  }

  /* ── 10. Drawing helpers ───────────────────────────────────── */

  function roundRect(c, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  /* Labels sit on two very different grounds — the dark bench and the white
     sheet of paper — so the halo colour is a parameter, not a constant. A
     dark halo under dark text on white paper would be unreadable. */
  function haloText(txt, x, y, col, size, weight, align, baseline, halo) {
    ctx.save();
    ctx.font = (weight || 700) + ' ' + (size || 12) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = align || 'left';
    ctx.textBaseline = baseline || 'alphabetic';
    ctx.lineWidth = 3.4; ctx.lineJoin = 'round';
    ctx.strokeStyle = halo || 'rgba(4,7,12,0.82)';
    ctx.strokeText(txt, x, y);
    ctx.fillStyle = col;
    ctx.fillText(txt, x, y);
    ctx.restore();
  }

  var PAPER_HALO = 'rgba(255,255,255,0.92)';
  var INK = '#152a44';
  function paperText(txt, x, y, size, align, baseline, col) {
    haloText(txt, x, y, col || INK, size || 11.5, 700, align, baseline, PAPER_HALO);
  }

  /* A light ray: soft bloom under a bright core, with an optional arrowhead
     part-way along so the direction of travel is unambiguous. */
  function ray(x1, y1, x2, y2, col, alpha, width, arrowAt) {
    if (alpha <= 0.012) return;
    ctx.save();
    ctx.lineCap = 'round';
    /* a dark contrast stroke first — the bench is dark but the sheet of paper
       is white, and a pure bloom disappears against it */
    ctx.strokeStyle = 'rgba(20,26,40,' + (alpha * 0.30) + ')';
    ctx.lineWidth = (width || 2.4) * 2.1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = rgba(col, alpha * 0.20);
    ctx.lineWidth = (width || 2.4) * 3.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = rgba(col, alpha * 0.42);
    ctx.lineWidth = (width || 2.4) * 1.9;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = rgba([Math.min(255, col[0] + 60), Math.min(255, col[1] + 60), Math.min(255, col[2] + 60)], alpha);
    ctx.lineWidth = width || 2.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
    if (arrowAt != null) arrowHead(x1, y1, x2, y2, arrowAt, col, alpha);
  }

  /* Two strokes instead of four. With two dozen wavelengths on screen the full
     bloom treatment is wasted work, and the fan reads better slightly leaner. */
  function rayThin(x1, y1, x2, y2, col, alpha, width) {
    if (alpha <= 0.012) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(col, alpha * 0.30);
    ctx.lineWidth = (width || 2) * 2.6;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = rgba([Math.min(255, col[0] + 55), Math.min(255, col[1] + 55), Math.min(255, col[2] + 55)], alpha);
    ctx.lineWidth = width || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  function arrowHead(x1, y1, x2, y2, at, col, alpha) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy);
    if (L < 14) return;
    var ux = dx / L, uy = dy / L;
    var px = x1 + ux * L * at, py = y1 + uy * L * at;
    var s = 9;
    ctx.save();
    ctx.fillStyle = rgba([Math.min(255, col[0] + 50), Math.min(255, col[1] + 50), Math.min(255, col[2] + 50)], alpha);
    ctx.beginPath();
    ctx.moveTo(px + ux * s, py + uy * s);
    ctx.lineTo(px - ux * s * 0.55 - uy * s * 0.55, py - uy * s * 0.55 + ux * s * 0.55);
    ctx.lineTo(px - ux * s * 0.55 + uy * s * 0.55, py - uy * s * 0.55 - ux * s * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function dashLine(x1, y1, x2, y2, col, wd, pattern) {
    ctx.save();
    ctx.setLineDash(pattern || [6, 5]);
    ctx.strokeStyle = col; ctx.lineWidth = wd || 1.3;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  }

  /* An angle arc between two directions measured from a vertex, with the
     value written on the bisector — the way it is marked up in a textbook. */
  function angleArc(cx, cy, a0, a1, r, col, label) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 1.6;
    ctx.beginPath();
    var ccw = false;
    var d = a1 - a0;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    if (d < 0) ccw = true;
    ctx.arc(cx, cy, r, a0, a1, ccw);
    ctx.stroke();
    ctx.restore();
    if (label) {
      var mid = a0 + d / 2;
      haloText(label, cx + Math.cos(mid) * (r + 15), cy + Math.sin(mid) * (r + 15),
        col, 12.5, 700, 'center', 'middle');
    }
  }

  /* ── 11. Scene geometry ────────────────────────────────────── */

  var PAPER = { x: 26, y: 26, w: 558, h: 508 };
  var OX = 300, OY = 300;            /* point of incidence, semicircular block */
  var RB = 132;                      /* radius of the semicircular block */
  var PROT_R = 176;                  /* protractor radius */
  var MM = 2.4;                      /* px per mm for the slab */
  var MMD = 1.7;                     /* px per mm for the depth tank */

  function slabPoly() {
    var h = clamp(state.thick * MM, 20, 220);
    var y0 = OY - h / 2, y1 = OY + h / 2;
    return [[170, y0], [430, y0], [430, y1], [170, y1]];
  }

  function prismPoly() {
    var a = rad(state.apex) / 2;
    var hb = 260 * Math.tan(a);
    return [[300, 170], [300 + hb, 430], [300 - hb, 430]];
  }

  /* Trace a ray from `start` along `dir` through a solid polygon immersed in a
     surrounding medium. Refracts in, bounces on total internal reflection and
     refracts out, returning every segment for drawing plus the angles a
     student would measure. */
  function traceSolid(poly, start, dir, nOut, nIn) {
    var segs = [], res = { segs: segs, ok: false, tirCount: 0, dir0: dir, start: start, tirPts: [] };
    var hit = polyHit(start, dir, poly);
    if (!hit) { segs.push({ a: start, b: vadd(start, vmul(dir, 400)), inside: false }); return res; }

    segs.push({ a: start, b: hit.p, inside: false });
    res.entry = hit.p; res.entryNrm = hit.nrm; res.entryEdge = hit.edge;
    res.i1 = Math.acos(clamp(-vdot(dir, hit.nrm), -1, 1));

    var d = refractVec(dir, hit.nrm, nOut / nIn);
    if (!d) {                                   /* denser outside — reflects off */
      var rf = reflectVec(dir, hit.nrm);
      segs.push({ a: hit.p, b: vadd(hit.p, vmul(rf, 260)), inside: false, reflected: true });
      res.entryTIR = true;
      return res;
    }
    res.r1 = Math.acos(clamp(-vdot(d, hit.nrm), -1, 1));

    var p = hit.p, guard = 0;
    while (guard++ < 7) {
      var h2 = polyHit(p, d, poly);
      if (!h2) break;
      segs.push({ a: p, b: h2.p, inside: true });
      var inward = vmul(h2.nrm, -1);
      var out = refractVec(d, inward, nIn / nOut);
      res.r2 = Math.acos(clamp(vdot(d, h2.nrm), -1, 1));
      if (!out) {                               /* total internal reflection */
        res.tirCount++;
        res.tirPts.push({ p: h2.p, ang: res.r2, nrm: h2.nrm });
        d = reflectVec(d, h2.nrm);
        p = h2.p;
        continue;
      }
      res.i2 = Math.acos(clamp(vdot(out, h2.nrm), -1, 1));
      res.exit = h2.p; res.exitEdge = h2.edge; res.exitNrm = h2.nrm;
      res.innerDir = d;                    /* the ray inside, arriving at the exit */
      /* partial reflection back inside, drawn faintly */
      var back = reflectVec(d, h2.nrm);
      res.internalR = reflectance(nIn, nOut, res.r2);
      segs.push({ a: h2.p, b: vadd(h2.p, vmul(back, 90)), inside: true, reflected: true,
                  alpha: res.internalR });
      segs.push({ a: h2.p, b: vadd(h2.p, vmul(out, 330)), inside: false, emergent: true });
      res.outDir = out; res.inDir = dir;
      var dv = Math.acos(clamp(vdot(dir, out), -1, 1));
      res.dev = dv;
      res.ok = true;
      return res;
    }
    return res;
  }

  /* ── 11b. The beam ─────────────────────────────────────────────
     The lamp is off until it is fired, and any change to the setup
     switches it off again — you cannot read a ray that is not there.
     When it fires the light travels: the path is drawn out from the
     lamp over ~380 ms rather than appearing whole.
     ─────────────────────────────────────────────────────────────── */

  var TRAVEL_MS = 380;

  function litFrac() {
    if (!state.fired) return 0;
    if (state.sweep) return 1;                 /* sweeping: no re-travel per frame */
    var t = (performance.now() - state.fireT0) / TRAVEL_MS;
    return t >= 1 ? 1 : t;
  }
  function travelling() {
    return state.fired && !state.sweep && (performance.now() - state.fireT0) < TRAVEL_MS + 40;
  }

  /* Each item carries d0, the distance along the path at which it begins, so a
     branch (a reflected ray) starts only once the light has reached it. */
  function beamItem(a, b, col, alpha, w, arrow, d0) {
    return { a: a, b: b, col: col, alpha: alpha, w: w, arrow: arrow,
             d0: d0 || 0, len: vlen(vsub(b, a)) };
  }

  function drawBeam(items, frac) {
    var total = 0, k;
    for (k = 0; k < items.length; k++) total = Math.max(total, items[k].d0 + items[k].len);
    var reach = total * frac;
    for (k = 0; k < items.length; k++) {
      var it = items[k];
      var local = reach - it.d0;
      if (local <= 0 || it.len < 0.5) continue;
      var f = local >= it.len ? 1 : local / it.len;
      var dir = vnorm(vsub(it.b, it.a));
      var end = vadd(it.a, vmul(dir, it.len * f));
      ray(it.a[0], it.a[1], end[0], end[1], it.col, it.alpha, it.w, f > 0.985 ? it.arrow : null);
    }
  }

  /* Where the lamp is pointing, drawn while it is switched off so the angle of
     incidence can still be set before firing — exactly how you aim a ray box. */
  function aimLine(from, to) {
    dashLine(from[0], from[1], to[0], to[1], 'rgba(90,110,140,0.60)', 1.4, [5, 6]);
  }

  function offHint(x, y) {
    haloText('Lamp off — press  \u25B6 Fire ray', x, y, '#3a5478', 11.5, 700, 'center', 'middle', PAPER_HALO);
  }

  /* ── 12. Scene painting ────────────────────────────────────── */

  function drawBench() {
    /* lab bench */
    var g = ctx.createLinearGradient(0, 0, 0, APP_H);
    g.addColorStop(0, '#171d29'); g.addColorStop(0.6, '#111621'); g.addColorStop(1, '#0a0e15');
    ctx.fillStyle = g; ctx.fillRect(0, 0, APP_W, APP_H);

    /* soft overhead pool of light */
    var sp = ctx.createRadialGradient(300, 250, 30, 300, 280, 400);
    sp.addColorStop(0, 'rgba(120,170,210,0.10)');
    sp.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sp; ctx.fillRect(0, 0, APP_W, APP_H);

    /* the sheet of drawing paper the apparatus is set up on */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 7;
    var pg = ctx.createLinearGradient(0, PAPER.y, 0, PAPER.y + PAPER.h);
    pg.addColorStop(0, '#e9edf3'); pg.addColorStop(1, '#cdd5e0');
    ctx.fillStyle = pg;
    roundRect(ctx, PAPER.x, PAPER.y, PAPER.w, PAPER.h, 6);
    ctx.fill();
    ctx.restore();

    /* faint paper tooth so it does not read as flat white */
    ctx.save();
    ctx.globalAlpha = 0.05; ctx.strokeStyle = '#5b6a86'; ctx.lineWidth = 1;
    for (var y = PAPER.y + 14; y < PAPER.y + PAPER.h; y += 22) {
      ctx.beginPath(); ctx.moveTo(PAPER.x + 6, y); ctx.lineTo(PAPER.x + PAPER.w - 6, y); ctx.stroke();
    }
    ctx.restore();
  }

  /* When the surrounding medium is not air the apparatus is immersed, so the
     whole sheet is washed with that medium's tint. */
  function drawSurround() {
    var m = medium(state.m1);
    if (m.id === 'air' || m.id === 'vacuum') return;
    ctx.save();
    roundRect(ctx, PAPER.x, PAPER.y, PAPER.w, PAPER.h, 6); ctx.clip();
    ctx.fillStyle = rgba(m.tint, m.a * 0.55);
    ctx.fillRect(PAPER.x, PAPER.y, PAPER.w, PAPER.h);
    ctx.restore();
  }

  /* Glass body. The block sits on WHITE paper, so the polished edge has to be
     a dark bevel with a light highlight inside it — a white edge on white
     paper is invisible, which is what the first draft looked like. */
  function glassBody(pathFn, m) {
    ctx.save();
    ctx.shadowColor = 'rgba(25,45,70,0.30)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
    pathFn();
    ctx.fillStyle = rgba(m.tint, Math.min(0.72, m.a + 0.26));
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.save(); pathFn(); ctx.clip();
    var hg = ctx.createLinearGradient(120, 140, 480, 460);
    hg.addColorStop(0, 'rgba(255,255,255,0.48)');
    hg.addColorStop(0.32, 'rgba(255,255,255,0.05)');
    hg.addColorStop(0.62, 'rgba(255,255,255,0.30)');
    hg.addColorStop(1, 'rgba(255,255,255,0.04)');
    ctx.fillStyle = hg; ctx.fillRect(0, 0, APP_W, APP_H);
    ctx.restore();

    pathFn();
    ctx.strokeStyle = 'rgba(18,48,74,0.55)'; ctx.lineWidth = 3.2;
    ctx.stroke();
    pathFn();
    ctx.strokeStyle = 'rgba(255,255,255,0.70)'; ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  /* A 180° protractor laid on the paper, read from the normal. This is what
     the angles are actually measured against in the school experiment. */
  function drawProtractor(cx, cy, R) {
    ctx.save();
    ctx.strokeStyle = 'rgba(40,60,90,0.30)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R - 30, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(40,60,90,0.16)'; ctx.stroke();

    for (var a = 0; a <= 90; a += 5) {
      for (var q = 0; q < 4; q++) {
        var sgn = (q === 0 || q === 3) ? 1 : -1;          /* left / right of normal */
        var up = (q < 2) ? -1 : 1;
        var th = Math.atan2(up * Math.cos(rad(a)), sgn * Math.sin(rad(a)));
        var long = (a % 10 === 0);
        var r0 = R - (long ? 13 : 7);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(th) * r0, cy + Math.sin(th) * r0);
        ctx.lineTo(cx + Math.cos(th) * R, cy + Math.sin(th) * R);
        ctx.strokeStyle = long ? 'rgba(30,50,80,0.55)' : 'rgba(30,50,80,0.28)';
        ctx.lineWidth = long ? 1.2 : 0.8;
        ctx.stroke();
        if (long && a % 20 === 0 && a > 0) {
          ctx.fillStyle = 'rgba(30,50,80,0.62)';
          ctx.font = '600 9.5px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(a), cx + Math.cos(th) * (R - 21), cy + Math.sin(th) * (R - 21));
        }
      }
    }
    ctx.restore();
  }

  /* The source, and the handle you drag to aim it. Recorded every frame so the
     pointer code can hit-test the thing the user can actually see. */
  var srcHandle = null;
  var srcHover = false;

  /* A laser pointer: knurled barrel, tapered nose, a lens that lights up in the
     beam colour. Monochromatic by nature, which is why white light swaps it for
     the ray box below — you cannot buy a white laser. */
  function drawLaserTorch(x, y, ang, col, lit) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);

    /* shadow on the paper */
    ctx.fillStyle = 'rgba(20,34,54,0.26)';
    roundRect(ctx, -62, -8 + 7, 66, 16, 8); ctx.fill();

    /* barrel */
    var bg = ctx.createLinearGradient(0, -9, 0, 9);
    bg.addColorStop(0.00, '#8a94a8');
    bg.addColorStop(0.28, '#e3e9f2');
    bg.addColorStop(0.55, '#6f7a90');
    bg.addColorStop(1.00, '#2d3444');
    ctx.fillStyle = bg;
    roundRect(ctx, -62, -9, 58, 18, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(12,20,34,0.55)'; ctx.lineWidth = 1;
    roundRect(ctx, -62, -9, 58, 18, 5); ctx.stroke();

    /* knurled grip */
    ctx.strokeStyle = 'rgba(20,30,48,0.34)'; ctx.lineWidth = 1;
    for (var k = -50; k <= -26; k += 4) {
      ctx.beginPath(); ctx.moveTo(k, -8); ctx.lineTo(k + 2, 8); ctx.stroke();
    }
    /* tail cap and press switch */
    ctx.fillStyle = '#39425a';
    roundRect(ctx, -68, -6, 8, 12, 2); ctx.fill();
    ctx.fillStyle = lit ? '#ff5555' : '#5b6478';
    ctx.beginPath(); ctx.arc(-22, -9.5, 2.6, 0, Math.PI * 2); ctx.fill();

    /* tapered nose */
    ctx.fillStyle = '#4c556b';
    ctx.beginPath();
    ctx.moveTo(-4, -9); ctx.lineTo(6, -6.5); ctx.lineTo(6, 6.5); ctx.lineTo(-4, 9);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(12,20,34,0.5)'; ctx.stroke();

    /* aperture */
    if (lit) {
      var g = ctx.createRadialGradient(7, 0, 0.5, 7, 0, 13);
      g.addColorStop(0, rgba(col, 0.95));
      g.addColorStop(1, rgba(col, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(7, 0, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba([255, 255, 255], 0.9);
      ctx.beginPath(); ctx.arc(6.5, 0, 2.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#1b2230';
      ctx.beginPath(); ctx.arc(6.5, 0, 3, 0, Math.PI * 2); ctx.fill();
    }

    /* grab affordance */
    if (srcHover) {
      ctx.strokeStyle = 'rgba(34,211,238,0.95)'; ctx.lineWidth = 2;
      roundRect(ctx, -70, -13, 80, 26, 8); ctx.stroke();
    }
    ctx.restore();
  }

  /* Ray box — the slit lamp that produces the single narrow beam. */
  function drawRayBox(x, y, ang, col) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    var bg = ctx.createLinearGradient(0, -17, 0, 17);
    bg.addColorStop(0, '#4d5769'); bg.addColorStop(0.45, '#333c4c'); bg.addColorStop(1, '#1e2531');
    ctx.fillStyle = bg;
    roundRect(ctx, -52, -17, 56, 34, 6); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.20)'; ctx.lineWidth = 1;
    roundRect(ctx, -52, -17, 56, 34, 6); ctx.stroke();
    /* slit */
    ctx.fillStyle = rgba(col, 0.95);
    ctx.fillRect(2, -6, 5, 12);
    ctx.fillStyle = rgba(col, 0.28);
    ctx.fillRect(-2, -9, 9, 18);
    /* vent lines */
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    for (var k = -34; k <= -12; k += 7) {
      ctx.beginPath(); ctx.moveTo(k, -11); ctx.lineTo(k, 11); ctx.stroke();
    }
    if (srcHover) {
      ctx.strokeStyle = 'rgba(34,211,238,0.95)'; ctx.lineWidth = 2;
      roundRect(ctx, -58, -23, 68, 46, 8); ctx.stroke();
    }
    ctx.restore();
  }

  /* One entry point for both sources, so the draggable region is registered
     in exactly one place and can never drift from what is drawn. */
  function drawSource(x, y, ang, col, lit) {
    srcHandle = { p: [x, y], ang: ang, back: state.white ? 60 : 72, fwd: 16, hw: state.white ? 22 : 15 };
    if (state.white) drawRayBox(x, y, ang, lit ? col : [70, 82, 100]);
    else drawLaserTorch(x, y, ang, col, lit);
  }

  /* Is the pointer on the source? Generous by a finger's width so it is
     grabbable on a phone as well as with a mouse. */
  function onSource(p, pad) {
    if (!srcHandle) return false;
    var dx = p[0] - srcHandle.p[0], dy = p[1] - srcHandle.p[1];
    var ca = Math.cos(srcHandle.ang), sa = Math.sin(srcHandle.ang);
    var lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
    /* 610 design px map to ~340 CSS px on a phone, so the barrel is only about
       26 CSS px across — under a fingertip. Touch gets a much larger pad. */
    var q = pad == null ? 8 : pad;
    return lx > -srcHandle.back - q && lx < srcHandle.fwd + q && Math.abs(ly) < srcHandle.hw + q;
  }

  /* Optical pins — the sighting method used when no ray box is available. */
  function drawPin(x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(20,30,45,0.28)';
    ctx.beginPath(); ctx.ellipse(x + 3, y + 3, 5.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    var g = ctx.createRadialGradient(x - 1.6, y - 1.8, 0.5, x, y, 5.5);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#cfd8e6'); g.addColorStop(1, '#5c6b85');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(20,30,45,0.45)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.restore();
  }

  /* Wavefronts — the reason refraction happens at all. Crest spacing is
     λ/n, so the fronts crowd together in the denser medium and the ray must
     bend to keep them continuous across the boundary. */
  function drawWavefronts(x0, y0, dirAng, len, spacing, halfW, col, alpha, phase) {
    ctx.save();
    ctx.translate(x0, y0); ctx.rotate(dirAng);
    ctx.strokeStyle = 'rgba(16,40,66,' + (alpha + 0.30) + ')';
    ctx.lineWidth = 1.9;
    var off = phase % spacing;
    for (var s = off; s < len; s += spacing) {
      ctx.beginPath(); ctx.moveTo(s, -halfW); ctx.lineTo(s, halfW); ctx.stroke();
    }
    ctx.restore();
  }

  /* ── 13. Ray tracing per apparatus ─────────────────────────── */

  /* How far back from the point of incidence the laser sits. Pulled in until
     its tail is inside the bench, so the barrel is never sliced off by the
     edge of the canvas at a steep angle. */
  function standoff(anchor, d, want, minL) {
    var back = (state.white ? 60 : 72) + 14;
    var L = want;
    while (L > minL) {
      var t = vsub(anchor, vmul(d, L + back));
      if (t[0] > 12 && t[0] < APP_W - 12 && t[1] > 12 && t[1] < APP_H - 12) break;
      L -= 6;
    }
    return L;
  }

  function traceSlab(wl) {
    var poly = slabPoly();
    var n1 = nOf(state.m1, wl), n2 = nOf(state.m2, wl);
    var d = fromAng(Math.PI / 2 - rad(state.ang));
    var M = [poly[0][0] + 0.20 * (poly[1][0] - poly[0][0]), poly[0][1]];
    var start = vsub(M, vmul(d, standoff(M, d, 190, 112)));
    return traceSolid(poly, start, d, n1, n2);
  }

  /* Where the lamp is aimed on the first face is not a free choice if the
     picture is to stay legible: a fixed entry point sends the beam out through
     the base at some apex angles and clips the apex at others. So the entry is
     back-traced — pick the middle of the second face, refract backwards to find
     which point on the first face feeds it, and aim there. The beam then
     crosses both refracting faces at every apex angle the slider allows, which
     is exactly what an experimenter achieves by sliding the ray box. */
  function prismEntry(poly, d, n1, n2) {
    var T = poly[0], BR = poly[1], BL = poly[2];
    var nL = vnorm([-260, -(BR[0] - 300)]);              /* left-face outward normal */
    nL = vnorm([BL[1] - T[1], -(BL[0] - T[0])]);
    if (vdot(nL, d) > 0) nL = vmul(nL, -1);              /* must oppose the ray */
    var u = 0.45;
    var v = refractVec(d, nL, n1 / n2);
    if (v) {
      var N = [(T[0] + BR[0]) / 2, (T[1] + BR[1]) / 2];  /* aim for mid second face */
      var E = vsub(T, BL);
      var det = E[0] * v[1] - E[1] * v[0];
      if (Math.abs(det) > 1e-6) {
        var rx = N[0] - BL[0], ry = N[1] - BL[1];
        var uu = (rx * v[1] - ry * v[0]) / det;
        var tt = (E[0] * ry - E[1] * rx) / det;
        if (tt > 0) u = clamp(uu, 0.18, 0.86);
      }
    }
    return vadd(BL, vmul(vsub(T, BL), u));
  }

  function tracePrism(wl) {
    var poly = prismPoly();
    var a = rad(state.apex) / 2;
    var n1 = nOf(state.m1, wl), n2 = nOf(state.m2, wl);
    var d = fromAng(a - rad(state.ang));
    var M = prismEntry(poly, d, n1, n2);
    var start = vsub(M, vmul(d, standoff(M, d, 175, 104)));
    return traceSolid(poly, start, d, n1, n2);
  }

  /* Where two infinite lines cross. A prism's deviation is the angle between
     the incident ray PRODUCED and the emergent ray, and its vertex is where
     those two lines actually meet — not the exit face, which is where a hurried
     diagram tends to put it. */
  function lineCross(a, u, b, v) {
    var den = u[0] * v[1] - u[1] * v[0];
    if (Math.abs(den) < 1e-6) return null;
    var w = vsub(b, a);
    return vadd(a, vmul(u, (w[0] * v[1] - w[1] * v[0]) / den));
  }

  /* Perpendicular distance from a point to an infinite line — the lateral
     displacement is measured exactly this way on the paper. */
  function pointLineDist(p, a, dir) {
    var v = vsub(p, a);
    return Math.abs(v[0] * dir[1] - v[1] * dir[0]);
  }

  /* ── 14. The four scenes ───────────────────────────────────── */

  function drawSemi(now) {
    var above = (state.dir === 'out');
    var mB = medium(state.m2), mS = medium(state.m1);
    var col = rayColour();
    var i = sol.i, r = sol.r;
    var dIn = [Math.sin(i), Math.cos(i)];

    /* paper construction lines */
    dashLine(PAPER.x + 16, OY, PAPER.x + PAPER.w - 16, OY, 'rgba(35,55,88,0.32)', 1.3, [9, 6]);
    if (state.show.normal) {
      dashLine(OX, OY - PROT_R - 22, OX, OY + PROT_R + 22, 'rgba(25,45,80,0.65)', 1.6, [8, 6]);
      ctx.save();
      ctx.strokeStyle = 'rgba(25,45,80,0.55)'; ctx.lineWidth = 1.3;
      ctx.strokeRect(OX + 3, OY - 17, 14, 14);
      ctx.restore();
      if (state.show.labels) paperText('90°', OX + 22, OY - 10, 10, 'left', 'middle');
    }
    if (state.show.protractor) drawProtractor(OX, OY, PROT_R);

    /* the semicircular block */
    glassBody(function () {
      ctx.beginPath();
      if (above) ctx.arc(OX, OY, RB, Math.PI, Math.PI * 2, false);
      else ctx.arc(OX, OY, RB, 0, Math.PI, false);
      ctx.closePath();
    }, mB);
    ctx.save();
    ctx.strokeStyle = 'rgba(16,44,70,0.72)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(OX - RB, OY); ctx.lineTo(OX + RB, OY); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(OX - RB, OY); ctx.lineTo(OX + RB, OY); ctx.stroke();
    ctx.restore();

    var lit = state.fired, frac = litFrac();

    /* wavefronts explain the bend before any label does */
    if (state.show.waves && lit && !sol.tir) {
      var SP = 21, T0 = 900;
      var sp1 = SP, sp2 = SP * sol.n1 / sol.n2;
      var ph1 = ((now % T0) / T0) * sp1, ph2 = ((now % T0) / T0) * sp2;
      drawWavefronts(OX - dIn[0] * 200, OY - dIn[1] * 200, vang(dIn), 200, sp1, 15,
        col, 0.42, ph1);
      if (r !== null) {
        var dT0 = [Math.sin(r), Math.cos(r)];
        drawWavefronts(OX, OY, vang(dT0), above ? 200 : RB, sp2, 15, col, 0.42, ph2);
      }
    }

    /* incident ray */
    var Lin = standoff([OX, OY], dIn, 208, 132);
    var Pst = [OX - dIn[0] * Lin, OY - dIn[1] * Lin];
    var O = [OX, OY];
    var beam = [];

    if (lit) {
      if (above) {
        var Q = [OX - dIn[0] * RB, OY - dIn[1] * RB];
        beam.push(beamItem(Pst, Q, col, 0.95, 2.6, 0.55, 0));
        beam.push(beamItem(Q, O, col, 0.95, 2.6, null, Lin - RB));
      } else {
        beam.push(beamItem(Pst, O, col, 0.95, 2.6, 0.6, 0));
      }

      /* refracted ray */
      if (r !== null) {
        var dT = [Math.sin(r), Math.cos(r)];
        var tAlpha = Math.max(0.18, sol.T);
        if (above) {
          beam.push(beamItem(O, [OX + dT[0] * 214, OY + dT[1] * 214], col, tAlpha, 2.6, 0.55, Lin));
        } else {
          var E = [OX + dT[0] * RB, OY + dT[1] * RB];
          beam.push(beamItem(O, E, col, tAlpha, 2.6, 0.55, Lin));
          beam.push(beamItem(E, [E[0] + dT[0] * 92, E[1] + dT[1] * 92], col, tAlpha * 0.75, 2.2, null, Lin + RB));
        }
      }

      /* partially reflected ray — always there, 100% beyond the critical angle */
      if (state.show.reflect || sol.tir) {
        var dR = [Math.sin(i), -Math.cos(i)];
        var rAlpha = sol.tir ? 0.95 : Math.max(0.10, sol.R);
        beam.push(beamItem(O, [OX + dR[0] * 196, OY + dR[1] * 196], col, rAlpha,
          sol.tir ? 2.6 : 2.1, sol.tir ? 0.55 : null, Lin));
      }
      drawBeam(beam, frac);
    } else {
      aimLine(Pst, O);
    }

    /* angle marks */
    if (state.show.arcs) {
      var aNormUp = -Math.PI / 2, aNormDn = Math.PI / 2;
      var aInc = vang([-dIn[0], -dIn[1]]);
      angleArc(OX, OY, aNormUp, aInc, 58, '#0b63b8', 'i = ' + state.ang.toFixed(1) + '°');
      if (lit && r !== null) {
        angleArc(OX, OY, aNormDn, vang([Math.sin(r), Math.cos(r)]), 46, '#b8360b',
          'r = ' + deg(r).toFixed(1) + '°');
      }
      if (lit && sol.tir) {
        angleArc(OX, OY, aNormUp, vang([Math.sin(i), -Math.cos(i)]), 44, '#7a2fb0',
          state.ang.toFixed(1) + '°');
      }
    }

    /* point of incidence */
    ctx.save();
    ctx.fillStyle = '#12233b';
    ctx.beginPath(); ctx.arc(OX, OY, 3.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    drawSource(Pst[0], Pst[1], vang(dIn), col, lit);

    if (state.show.labels) {
      var upName = above ? mB.name : mS.name;
      var dnName = above ? mS.name : mB.name;
      var upN = above ? sol.n1 : nOf(state.m1, sol.wl);
      var dnN = above ? nOf(state.m1, sol.wl) : sol.n2;
      if (!above) { upN = sol.n1; dnN = sol.n2; } else { upN = sol.n1; dnN = sol.n2; }
      paperText('Medium 1: ' + upName + '   n₁ = ' + upN.toFixed(3), PAPER.x + 20, OY - 12, 11.5, 'left', 'bottom');
      paperText('Medium 2: ' + dnName + '   n₂ = ' + dnN.toFixed(3), PAPER.x + 20, OY + 16, 11.5, 'left', 'top');
      paperText('Boundary', PAPER.x + PAPER.w - 20, OY - 8, 10.5, 'right', 'bottom', '#3a5478');
      paperText('Normal', OX - 8, OY - PROT_R - 26, 11, 'right', 'bottom');
      paperText('O', OX + 8, OY + 15, 11, 'left', 'top', '#12233b');
      if (!lit) offHint(OX, PAPER.y + 34);
      haloText(lit ? 'Incident ray' : 'lamp aimed here', Pst[0] + dIn[0] * 62 + 14, Pst[1] + dIn[1] * 62 - 12,
        '#12233b', 11.5, 700, 'left', 'bottom', PAPER_HALO);
      if (lit && r !== null) {
        var lx = OX + Math.sin(r) * 128, ly = OY + Math.cos(r) * 128;
        haloText('Refracted ray', lx + 12, ly + 6, '#12233b', 11.5, 700, 'left', 'middle', PAPER_HALO);
      }
      if (lit && sol.tir) {
        haloText('TOTAL INTERNAL REFLECTION', OX + Math.sin(i) * 120 + 12, OY - Math.cos(i) * 120 - 8,
          '#7a2fb0', 12.5, 800, 'left', 'bottom', PAPER_HALO);
      } else if (lit && state.show.reflect) {
        haloText('Partially reflected ray  (' + (sol.R * 100).toFixed(1) + '%)',
          OX + Math.sin(i) * 118 + 12, OY - Math.cos(i) * 118 - 6,
          '#6b4a86', 10.5, 700, 'left', 'bottom', PAPER_HALO);
      }
      if (above) {
        /* sits on the far side of the beam so it cannot collide with the
           "Incident ray" label, which hugs the ray box */
        var qx = OX - Math.sin(i) * (RB + 8), qy = OY - Math.cos(i) * (RB + 8);
        /* right-aligned, so the anchor must stay far enough from the left edge
           of the sheet for the whole caption to fit on the paper */
        var lxr = Math.max(PAPER.x + 116, qx - 74);
        paperText('enters along a radius —', lxr, qy + 6, 9.6, 'right', 'middle', '#3a5478');
        paperText('no bending at this face', lxr, qy + 18, 9.6, 'right', 'middle', '#3a5478');
      }
    }
  }

  /* Convert a polygon trace into an ordered beam, so the light travels through
     the solid in the order it physically does and a reflected branch only
     appears once the light has reached the face it bounces off. */
  function traceBeam(tr, col) {
    var out = [], run = 0, k;
    for (k = 0; k < tr.segs.length; k++) {
      var sg = tr.segs[k], L = vlen(vsub(sg.b, sg.a));
      if (sg.reflected) {
        if (state.show.reflect) {
          out.push(beamItem(sg.a, sg.b, col, Math.max(0.10, sg.alpha == null ? sol.R : sg.alpha),
            2.0, null, run));
        }
        continue;                     /* a branch: does not advance the main run */
      }
      out.push(beamItem(sg.a, sg.b, col, 0.95, 2.6, 0.55, run));
      run += L;
    }
    return out;
  }

  function drawSlab(now) {
    var poly = slabPoly();
    var mB = medium(state.m2);
    var col = rayColour();
    var tr = sol.trace;
    var x0 = poly[0][0], x1 = poly[1][0], y0 = poly[0][1], y1 = poly[2][1];

    glassBody(function () {
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1); ctx.lineTo(x0, y1);
      ctx.closePath();
    }, mB);

    /* the two parallel faces the whole effect depends on */
    ctx.save();
    ctx.strokeStyle = 'rgba(16,44,70,0.62)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0);
    ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.restore();

    if (!tr) return;
    var lit = state.fired, frac = litFrac();

    /* normals at the two refracting points */
    if (state.show.normal && tr.entry) {
      dashLine(tr.entry[0], tr.entry[1] - 74, tr.entry[0], tr.entry[1] + 74, 'rgba(25,45,80,0.62)', 1.5, [7, 5]);
      if (tr.exit) dashLine(tr.exit[0], tr.exit[1] - 74, tr.exit[0], tr.exit[1] + 74, 'rgba(25,45,80,0.62)', 1.5, [7, 5]);
    }

    /* the undeviated path, for comparison */
    if (tr.entry && lit) {
      var far = vadd(tr.entry, vmul(tr.dir0, 400));
      dashLine(tr.entry[0], tr.entry[1], far[0], far[1], 'rgba(90,110,140,0.75)', 1.4, [7, 6]);
    }

    /* wavefronts inside and outside */
    if (state.show.waves && lit && tr.entry && tr.segs.length > 1) {
      var SP = 21, T0 = 900;
      var sp1 = SP, sp2 = SP * sol.n1 / sol.n2;
      var ph1 = ((now % T0) / T0) * sp1, ph2 = ((now % T0) / T0) * sp2;
      drawWavefronts(tr.start[0], tr.start[1], vang(tr.dir0), 190, sp1, 14, col, 0.38, ph1);
      var seg = tr.segs[1];
      var dd = vnorm(vsub(seg.b, seg.a));
      drawWavefronts(seg.a[0], seg.a[1], vang(dd), vlen(vsub(seg.b, seg.a)), sp2, 14, col, 0.38, ph2);
    }

    /* every traced segment */
    if (lit) drawBeam(traceBeam(tr, col), frac);
    else if (tr.entry) aimLine(tr.start, tr.entry);

    if (tr.entry) drawSource(tr.start[0], tr.start[1], vang(tr.dir0), col, lit);

    /* lateral displacement, measured exactly as it is on the paper */
    if (lit && tr.ok && sol.lateral != null) {
      var A = tr.entry, u = tr.dir0, E = tr.exit;
      var t = vdot(vsub(E, A), u);
      var F = vadd(A, vmul(u, t));
      ctx.save();
      ctx.strokeStyle = '#0b8f5e'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(F[0], F[1]); ctx.lineTo(E[0], E[1]); ctx.stroke();
      ctx.restore();
      arrowHead(F[0], F[1], E[0], E[1], 0.94, [16, 190, 130], 1);
      arrowHead(E[0], E[1], F[0], F[1], 0.94, [16, 190, 130], 1);
      if (state.show.labels) {
        haloText('d = ' + sol.lateral.toFixed(1) + ' mm',
          (F[0] + E[0]) / 2 + 12, (F[1] + E[1]) / 2, '#0b7a50', 11.5, 700, 'left', 'middle', PAPER_HALO);
      }
    }

    /* optical pins — the no-ray-box method */
    if (state.show.pins && lit && tr.entry) {
      drawPin(tr.start[0] + tr.dir0[0] * 40, tr.start[1] + tr.dir0[1] * 40);
      drawPin(tr.start[0] + tr.dir0[0] * 120, tr.start[1] + tr.dir0[1] * 120);
      if (tr.ok) {
        var oe = tr.outDir;
        drawPin(tr.exit[0] + oe[0] * 90, tr.exit[1] + oe[1] * 90);
        drawPin(tr.exit[0] + oe[0] * 175, tr.exit[1] + oe[1] * 175);
      }
    }

    if (state.show.arcs && tr.entry) {
      var nUp = vang(vmul(tr.entryNrm, 1));
      angleArc(tr.entry[0], tr.entry[1], nUp, vang(vmul(tr.dir0, -1)), 46, '#0b63b8',
        'i = ' + state.ang.toFixed(1) + '°');
      if (lit && tr.segs.length > 1 && tr.r1 != null) {
        var din = vnorm(vsub(tr.segs[1].b, tr.segs[1].a));
        angleArc(tr.entry[0], tr.entry[1], vang(vmul(tr.entryNrm, -1)), vang(din), 40, '#b8360b',
          'r = ' + deg(tr.r1).toFixed(1) + '°');
      }
      if (lit && tr.ok) {
        angleArc(tr.exit[0], tr.exit[1], vang(tr.exitNrm), vang(tr.outDir), 44, '#0b63b8',
          'e = ' + deg(tr.i2).toFixed(1) + '°');
      }
    }

    if (state.show.labels) {
      paperText('Medium 1: ' + medium(state.m1).name + '   n₁ = ' + sol.n1.toFixed(3),
        PAPER.x + 20, y0 - 16, 11.5, 'left', 'bottom');
      paperText(mB.name + '   n₂ = ' + sol.n2.toFixed(3) + '   t = ' + state.thick + ' mm',
        x0 + 12, (y0 + y1) / 2, 11.5, 'left', 'middle');
      if (!lit) offHint(300, PAPER.y + 34);
      if (lit && tr.entryTIR) {
        var fy = safeBottom(6);
        haloText('The surrounding medium is the denser one, so the light never gets in',
          300, fy, '#5a3a94', 10.5, 700, 'center', 'bottom', PAPER_HALO);
        haloText('Total internal reflection at the first face', 300, fy - 19,
          '#7a2fb0', 12.5, 800, 'center', 'bottom', PAPER_HALO);
        haloText('Inside a parallel-sided block TIR is impossible: r₁ ≤ C at the second face, always',
          300, fy - 40, '#3a5478', 9.8, 700, 'center', 'bottom', PAPER_HALO);
      }
      if (tr.entry) {
        haloText(lit ? 'Incident ray' : 'aimed here', tr.start[0] + tr.dir0[0] * 54 + 8,
          tr.start[1] + tr.dir0[1] * 54 - 12, '#12233b', 11.5, 700, 'left', 'bottom', PAPER_HALO);
      }
      if (lit && tr.ok) {
        haloText('Emergent ray — parallel to the incident ray',
          tr.exit[0] + tr.outDir[0] * 130, tr.exit[1] + tr.outDir[1] * 130 + 20,
          '#12233b', 11, 700, 'center', 'top', PAPER_HALO);
      }
    }
  }

  /* ── Prism glass ───────────────────────────────────────────────
     A prism sitting on white paper reads as glass only if the edges
     are bevelled and the body carries a specular streak — a flat
     tinted triangle looks like coloured paper. */
  function prismGlass(poly, m) {
    var T = poly[0], BR = poly[1], BL = poly[2];
    var cx = (T[0] + BR[0] + BL[0]) / 3, cy = (T[1] + BR[1] + BL[1]) / 3;

    function path(inset) {
      ctx.beginPath();
      for (var k = 0; k < 3; k++) {
        var p = poly[k];
        var d = vnorm([p[0] - cx, p[1] - cy]);
        var q = [p[0] - d[0] * (inset || 0), p[1] - d[1] * (inset || 0)];
        if (k === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      }
      ctx.closePath();
    }

    /* contact shadow where the base meets the paper */
    ctx.save();
    ctx.fillStyle = 'rgba(22,40,64,0.26)';
    ctx.beginPath();
    ctx.ellipse((BL[0] + BR[0]) / 2, BR[1] + 6, (BR[0] - BL[0]) / 2 + 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* body — denser towards the base, the way a real prism looks */
    ctx.save();
    path(0);
    var bg = ctx.createLinearGradient(0, T[1], 0, BR[1]);
    bg.addColorStop(0, rgba(m.tint, Math.min(0.62, m.a + 0.16)));
    bg.addColorStop(1, rgba(m.tint, Math.min(0.86, m.a + 0.40)));
    ctx.fillStyle = bg;
    ctx.fill();

    /* specular streak, clipped to the body */
    ctx.save(); path(0); ctx.clip();
    var sg = ctx.createLinearGradient(BL[0], T[1], BR[0], BR[1]);
    sg.addColorStop(0.00, 'rgba(255,255,255,0.00)');
    sg.addColorStop(0.22, 'rgba(255,255,255,0.42)');
    sg.addColorStop(0.34, 'rgba(255,255,255,0.05)');
    sg.addColorStop(0.62, 'rgba(255,255,255,0.30)');
    sg.addColorStop(0.78, 'rgba(255,255,255,0.02)');
    sg.addColorStop(1.00, 'rgba(255,255,255,0.16)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, APP_W, APP_H);
    ctx.restore();

    /* inner bevel — the chamfer that catches the light on real optics */
    path(7);
    ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = 1.3;
    ctx.stroke();

    /* polished edges: dark seat, bright highlight, faint chromatic fringe */
    path(0);
    ctx.strokeStyle = 'rgba(16,44,72,0.62)'; ctx.lineWidth = 3.4; ctx.stroke();
    path(0);
    ctx.strokeStyle = 'rgba(255,255,255,0.78)'; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.30; ctx.lineWidth = 1;
    ctx.strokeStyle = '#7f5bff';
    ctx.beginPath(); ctx.moveTo(T[0] - 1.5, T[1]); ctx.lineTo(BL[0] - 1.5, BL[1]); ctx.stroke();
    ctx.strokeStyle = '#ff6b4a';
    ctx.beginPath(); ctx.moveTo(T[0] + 1.5, T[1]); ctx.lineTo(BR[0] + 1.5, BR[1]); ctx.stroke();
    ctx.restore();

    /* ground base, as on a real prism */
    ctx.save();
    ctx.strokeStyle = 'rgba(120,150,180,0.55)'; ctx.lineWidth = 4;
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(BL[0] + 4, BL[1] - 2); ctx.lineTo(BR[0] - 4, BR[1] - 2); ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  /* ── Projection screen ─────────────────────────────────────────
     Newton's card. Placed square-on to the mean emergent beam and
     pulled in until it fits on the bench, which is exactly what you
     do with a real screen. */
  function makeScreen(dirs, exits) {
    var k, sum = [0, 0];
    for (k = 0; k < dirs.length; k++) { sum[0] += dirs[k][0]; sum[1] += dirs[k][1]; }
    var u = vnorm(sum);
    var org = exits[Math.floor(exits.length / 2)];
    var half = 82, L;
    /* the lower bound is whatever the dock leaves visible, not the design box:
       after a total internal reflection the beam leaves through the base and
       heads straight down into the dock's strip */
    var floorY = Math.min(APP_H - 34, safeBottom(16));
    for (L = 234; L >= 74; L -= 8) {
      var c = vadd(org, vmul(u, L));
      var ax = [-u[1], u[0]];
      var e1 = vadd(c, vmul(ax, half)), e2 = vsub(c, vmul(ax, half));
      if (Math.min(e1[0], e2[0]) > 34 && Math.max(e1[0], e2[0]) < APP_W - 34 &&
          Math.min(e1[1], e2[1]) > 34 && Math.max(e1[1], e2[1]) < floorY) break;
    }
    var C = vadd(org, vmul(u, L));
    return { c: C, u: u, ax: [-u[1], u[0]], half: half };
  }

  function drawScreenCard(sc) {
    var a = vadd(sc.c, vmul(sc.ax, sc.half)), b = vsub(sc.c, vmul(sc.ax, sc.half));
    ctx.save();
    ctx.translate(sc.c[0], sc.c[1]);
    ctx.rotate(vang(sc.ax));
    ctx.shadowColor = 'rgba(0,0,0,0.42)'; ctx.shadowBlur = 12; ctx.shadowOffsetX = 4;
    var g = ctx.createLinearGradient(0, -7, 0, 7);
    g.addColorStop(0, '#f6f8fb'); g.addColorStop(1, '#c9d2de');
    ctx.fillStyle = g;
    roundRect(ctx, -sc.half, -7, sc.half * 2, 14, 3); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(30,50,80,0.45)'; ctx.lineWidth = 1;
    roundRect(ctx, -sc.half, -7, sc.half * 2, 14, 3); ctx.stroke();
    ctx.restore();
    return { a: a, b: b };
  }

  /* Where each emergent ray meets the screen plane. */
  function screenHit(sc, org, dir) {
    var den = vdot(dir, sc.u);
    if (Math.abs(den) < 1e-6) return null;
    var t = vdot(vsub(sc.c, org), sc.u) / den;
    if (t <= 0) return null;
    return { p: vadd(org, vmul(dir, t)), t: t };
  }

  /* The angular spread of a spectrum from a 60° flint prism is about 1.7°.
     Over the length of a bench that is a band a dozen pixels wide — which is
     the truth, and also unreadable. So the band is drawn at its real size
     where it lands AND repeated enlarged in the corner, captioned and with the
     actual angular spread quoted, rather than exaggerating the geometry. */
  function drawSpectrumDetail(band, spreadDeg) {
    var x = PAPER.x + 18, y = PAPER.y + 14, w = 198, h = 82;
    var bx = x + 10, by = y + 26, bw = w - 20, bh = 24;
    ctx.save();
    ctx.fillStyle = 'rgba(18,32,52,0.90)';
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 7); ctx.fill(); ctx.stroke();
    var n = band.length, k;
    for (k = 0; k < n; k++) {
      ctx.fillStyle = rgba(band[k].c, 0.96);
      ctx.fillRect(bx + bw * (k / n), by, bw / n + 1, bh);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.restore();

    haloText('Spectrum on the screen — enlarged', x + w / 2, y + 14, '#cfe9f2', 10, 700, 'center', 'middle');
    haloText('red', bx + 1, by + bh + 10, '#e0533f', 9.5, 700, 'left', 'middle');
    haloText('violet', bx + bw - 1, by + bh + 10, '#9b7cf0', 9.5, 700, 'right', 'middle');
    if (spreadDeg != null) {
      haloText('true angular spread ' + spreadDeg.toFixed(2) + '°',
        x + w / 2, by + bh + 24, '#8fa4c4', 9.5, 600, 'center', 'middle');
    }
  }

  function drawPrism(now) {
    var poly = prismPoly();
    var mB = medium(state.m2);
    var T = poly[0], BR = poly[1], BL = poly[2];
    var A = rad(state.apex);

    prismGlass(poly, mB);

    /* apex angle */
    if (state.show.arcs) {
      var uL = vnorm(vsub(BL, T)), uR = vnorm(vsub(BR, T));
      angleArc(T[0], T[1], vang(uL), vang(uR), 40, '#7a2fb0', 'A = ' + state.apex + '°');
    }

    var tr = sol.trace;
    if (!tr) return;
    var lit = state.fired, frac = litFrac();

    /* normals at the refracting faces */
    if (state.show.normal && tr.entry) {
      var n1v = vmul(tr.entryNrm, 62);
      dashLine(tr.entry[0] - n1v[0], tr.entry[1] - n1v[1], tr.entry[0] + n1v[0], tr.entry[1] + n1v[1],
        'rgba(25,45,80,0.62)', 1.5, [7, 5]);
      if (tr.exit) {
        var n2v = vmul(tr.exitNrm, 62);
        dashLine(tr.exit[0] - n2v[0], tr.exit[1] - n2v[1], tr.exit[0] + n2v[0], tr.exit[1] + n2v[1],
          'rgba(25,45,80,0.62)', 1.5, [7, 5]);
      }
    }

    if (!lit) {
      if (tr.entry) {
        aimLine(tr.start, tr.entry);
        drawSource(tr.start[0], tr.start[1], vang(tr.dir0), rayColour(), false);
      }
      if (state.show.labels) {
        offHint(300, PAPER.y + 34);
        paperText(mB.name + '   n = ' + sol.n2.toFixed(3), 300, safeBottom(6), 11.5, 'center', 'bottom');
      }
      return;
    }

    /* the undeviated path, for comparison */
    if (tr.entry) {
      var far = vadd(tr.entry, vmul(tr.dir0, 330));
      dashLine(tr.entry[0], tr.entry[1], far[0], far[1], 'rgba(90,110,140,0.72)', 1.4, [7, 6]);
    }

    /* trace every wavelength that is actually in the beam */
    var samples = state.white ? SPECTRUM : [state.wl];
    var traces = [], dirs = [], exits = [], q, tw;
    for (q = 0; q < samples.length; q++) {
      tw = tracePrism(samples[q]);
      traces.push(tw);
      if (tw.ok) { dirs.push(tw.outDir); exits.push(tw.exit); }
    }

    var sc = (state.show.screen && dirs.length) ? makeScreen(dirs, exits) : null;
    if (sc) drawScreenCard(sc);

    /* the beam itself */
    var white = [255, 250, 235];
    var beam = [], run0 = 0;
    if (tr.segs.length) {
      run0 = vlen(vsub(tr.segs[0].b, tr.segs[0].a));
      beam.push(beamItem(tr.segs[0].a, tr.segs[0].b, state.white ? white : rayColour(),
        0.95, state.white ? 3.2 : 2.6, 0.55, 0));
    }
    drawBeam(beam, frac);

    /* every colour, from the first face onward. Drawn straight rather than
       through drawBeam so the whole fan shares one travel budget. */
    var totalLen = 0;
    for (q = 0; q < traces.length; q++) {
      var t2 = traces[q], acc = run0, z;
      for (z = 1; z < t2.segs.length; z++) {
        if (t2.segs[z].reflected) continue;
        acc += vlen(vsub(t2.segs[z].b, t2.segs[z].a));
      }
      if (acc > totalLen) totalLen = acc;
    }
    var reach = Math.max(totalLen, run0 + 1) * frac;

    for (q = 0; q < traces.length; q++) {
      var t3 = traces[q];
      var cw = state.white ? wlRGB(samples[q]) : rayColour();
      var runw = run0, z2;
      for (z2 = 1; z2 < t3.segs.length; z2++) {
        var sg = t3.segs[z2];
        if (sg.reflected) {
          if (state.show.reflect && !state.white) {
            var la = reach - runw;
            if (la > 0) ray(sg.a[0], sg.a[1], sg.b[0], sg.b[1], cw,
              Math.max(0.10, sg.alpha == null ? sol.R : sg.alpha), 2.0, null);
          }
          continue;
        }
        var A2 = sg.a, B2 = sg.b;
        /* the emergent ray should stop on the screen, not in mid-air */
        if (sg.emergent && sc) {
          var hit = screenHit(sc, sg.a, vnorm(vsub(sg.b, sg.a)));
          if (hit) B2 = hit.p;
        }
        var len = vlen(vsub(B2, A2));
        var local = reach - runw;
        if (local > 0 && len > 0.5) {
          var f = local >= len ? 1 : local / len;
          var end = vadd(A2, vmul(vnorm(vsub(B2, A2)), len * f));
          if (state.white) rayThin(A2[0], A2[1], end[0], end[1], cw, 0.88, 2.2);
          else ray(A2[0], A2[1], end[0], end[1], cw, 0.95, 2.6, f > 0.985 ? 0.55 : null);
        }
        runw += len;
      }
    }

    /* the spectrum where it lands */
    if (sc && frac > 0.97) {
      var band = [];
      for (q = 0; q < traces.length; q++) {
        if (!traces[q].ok) continue;
        var h2 = screenHit(sc, traces[q].exit, traces[q].outDir);
        if (h2) band.push({ s: vdot(vsub(h2.p, sc.c), sc.ax), c: state.white ? wlRGB(samples[q]) : rayColour() });
      }
      if (band.length) {
        ctx.save();
        ctx.translate(sc.c[0], sc.c[1]); ctx.rotate(vang(sc.ax));
        var spread = band.length > 1 ? Math.abs(band[0].s - band[band.length - 1].s) : 0;
        var w = Math.max(3, spread / Math.max(1, band.length - 1) + 2.2);
        for (q = 0; q < band.length; q++) {
          ctx.fillStyle = rgba(band[q].c, 0.95);
          ctx.fillRect(band[q].s - w / 2, -6, w, 12);
        }
        ctx.restore();
        if (state.show.labels) {
          /* the caption sits past the card along the beam, and after an internal
             bounce the beam heads down through the base — straight into the
             dock's strip. Clamp it the same way the foot labels are clamped. */
          haloText('screen', sc.c[0] + sc.u[0] * 26,
            Math.min(sc.c[1] + sc.u[1] * 26, safeBottom(8)),
            '#12233b', 10.5, 700, 'center', 'middle', PAPER_HALO);
          if (state.white && band.length > 1 && !sol.tirInside) {
            var dR = traces[0].ok ? traces[0].outDir : null;
            var dV = traces[traces.length - 1].ok ? traces[traces.length - 1].outDir : null;
            var spread = (dR && dV) ? deg(Math.acos(clamp(vdot(dR, dV), -1, 1))) : null;
            drawSpectrumDetail(band, spread);
          }
        }
      }
    }

    if (tr.entry) drawSource(tr.start[0], tr.start[1], vang(tr.dir0), state.white ? [255, 250, 235] : rayColour(), true);

    if (state.show.arcs && tr.entry) {
      angleArc(tr.entry[0], tr.entry[1], vang(tr.entryNrm), vang(vmul(tr.dir0, -1)), 40, '#0b63b8',
        'i₁ = ' + state.ang.toFixed(1) + '°');
      if (tr.segs.length > 1 && tr.r1 != null) {
        var dinP = vnorm(vsub(tr.segs[1].b, tr.segs[1].a));
        angleArc(tr.entry[0], tr.entry[1], vang(vmul(tr.entryNrm, -1)), vang(dinP), 34, '#b8360b',
          'r₁ = ' + deg(tr.r1).toFixed(1) + '°');
      }
      /* The beam DOES leave the prism after an internal bounce — through the
         base — which reads as a contradiction next to a label saying "total
         internal reflection" unless the picture says where each thing happens.
         So mark the bounce itself, and mark the face it finally escapes from. */
      if (lit && sol.tirInside && tr.tirPts && tr.tirPts.length) {
        var tp0 = tr.tirPts[0];
        ctx.save();
        ctx.fillStyle = '#7a2fb0';
        ctx.beginPath(); ctx.arc(tp0.p[0], tp0.p[1], 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
        var away = vmul(tp0.nrm, 26);
        haloText('T.I.R. here', tp0.p[0] + away[0], tp0.p[1] + away[1],
          '#7a2fb0', 10.5, 800, 'left', 'middle', PAPER_HALO);
        haloText(deg(tp0.ang).toFixed(1) + '° > C', tp0.p[0] + away[0], tp0.p[1] + away[1] + 13,
          '#7a2fb0', 9.8, 700, 'left', 'middle', PAPER_HALO);
        if (tr.ok) {
          angleArc(tr.exit[0], tr.exit[1], vang(tr.exitNrm), vang(tr.outDir), 40, '#0b8f5e',
            deg(tr.i2).toFixed(1) + '°');
          haloText('escapes through the base', tr.exit[0] + 14, tr.exit[1] + 26,
            '#0b7a50', 10, 700, 'left', 'middle', PAPER_HALO);
        }
      }

      if (tr.ok && !sol.tirInside) {
        /* r₂ — the ray inside the glass striking the second face. It is the
           partner to r₁ and the angle the whole r₁ + r₂ = A relation turns on;
           without it the exit face looked unmarked beside the entry face. */
        if (tr.innerDir && tr.r2 != null) {
          angleArc(tr.exit[0], tr.exit[1], vang(vmul(tr.exitNrm, -1)), vang(vmul(tr.innerDir, -1)),
            34, '#b8360b', 'r₂ = ' + (sol.r2s != null ? deg(sol.r2s) : deg(tr.r2)).toFixed(1) + '°');
        }
        angleArc(tr.exit[0], tr.exit[1], vang(tr.exitNrm), vang(tr.outDir), 52, '#0b63b8',
          'i₂ = ' + (sol.i2s != null ? deg(sol.i2s) : deg(tr.i2)).toFixed(1) + '°');
        var V = lineCross(tr.entry, tr.dir0, tr.exit, tr.outDir);
        if (V && V[0] > 24 && V[0] < APP_W - 24 && V[1] > 24 && V[1] < APP_H - 24) {
          dashLine(V[0], V[1], tr.exit[0], tr.exit[1], 'rgba(11,143,94,0.45)', 1.2, [4, 4]);
          angleArc(V[0], V[1], vang(tr.dir0), vang(tr.outDir), 44, '#0b8f5e',
            'D = ' + deg(tr.dev).toFixed(1) + '°');
          ctx.save();
          ctx.fillStyle = '#0b8f5e';
          ctx.beginPath(); ctx.arc(V[0], V[1], 2.8, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        } else {
          angleArc(tr.exit[0], tr.exit[1], vang(tr.dir0), vang(tr.outDir), 96, '#0b8f5e',
            'D = ' + deg(tr.dev).toFixed(1) + '°');
        }
      }
    }

    if (state.show.labels) {
      /* Everything along the foot of the sheet is stacked UPWARD from the last
         line the dock leaves visible, so a narrow canvas (where the dock covers
         a bigger share) pushes the text up instead of hiding it. */
      var fy = safeBottom(6);
      if (sol.tirInside) {
        haloText(sol.iMin != null
            ? 'Raise i₁ above ' + deg(sol.iMin).toFixed(1) + '° to make it emerge through the second face instead'
            : 'No light leaves the second face at this angle',
          300, fy, '#5a3a94', 10.2, 700, 'center', 'bottom', PAPER_HALO);
        fy -= 18;
        var tpa = (tr.tirPts && tr.tirPts.length) ? deg(tr.tirPts[0].ang).toFixed(1) : '—';
        var Cg = critical(sol.n2, sol.n1);
        haloText('r₂ = ' + tpa + '° exceeds C = ' + (Cg === null ? '—' : deg(Cg).toFixed(1)) +
          '°, so the beam reflects inside and leaves through the base',
          300, fy, '#5a3a94', 10.2, 700, 'center', 'bottom', PAPER_HALO);
        fy -= 19;
        haloText('Total internal reflection at the second face', 300, fy, '#7a2fb0', 12.5, 800, 'center', 'bottom', PAPER_HALO);
        fy -= 21;
      }
      paperText(mB.name + '   n = ' + sol.n2.toFixed(3) +
        (state.white ? '   (n varies with colour)' : ''), 300, fy, 11.5, 'center', 'bottom');
      if (state.white && tr.entry) {
        haloText('white light in', tr.start[0] + tr.dir0[0] * 46, tr.start[1] + tr.dir0[1] * 46 - 14,
          '#12233b', 11, 700, 'left', 'bottom', PAPER_HALO);
      }
    }
  }

  function drawDepth(now) {
    var mL = medium(state.m2), mA = medium(state.m1);
    var col = rayColour();
    var TX0 = 96, TX1 = 524, TY0 = 228, TY1 = 478, WALL = 9;
    var IX0 = TX0 + WALL, IX1 = TX1 - WALL, IY1 = TY1 - 12;
    var dpx = clamp(state.realDepth * 1.55, 30, 190);
    var surf = IY1 - dpx;
    var CX = 236;
    var i = sol.i, r = sol.r;

    /* the tank */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
    ctx.fillStyle = 'rgba(150,180,205,0.14)';
    roundRect(ctx, TX0, TY0, TX1 - TX0, TY1 - TY0, 5); ctx.fill();
    ctx.restore();

    /* the liquid */
    ctx.save();
    ctx.beginPath(); ctx.rect(IX0, surf, IX1 - IX0, IY1 - surf); ctx.clip();
    var lg = ctx.createLinearGradient(0, surf, 0, IY1);
    lg.addColorStop(0, rgba(mL.tint, mL.a + 0.16));
    lg.addColorStop(1, rgba(mL.tint, mL.a + 0.34));
    ctx.fillStyle = lg; ctx.fillRect(IX0, surf, IX1 - IX0, IY1 - surf);
    ctx.restore();

    /* the coin on the floor of the tank */
    ctx.save();
    ctx.fillStyle = 'rgba(20,35,55,0.30)';
    ctx.beginPath(); ctx.ellipse(CX + 4, IY1 - 2, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    var cg = ctx.createLinearGradient(CX - 22, IY1 - 12, CX + 22, IY1 + 2);
    cg.addColorStop(0, '#f6d67a'); cg.addColorStop(0.5, '#c99b31'); cg.addColorStop(1, '#8e6a15');
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.ellipse(CX, IY1 - 5, 23, 7.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,190,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(CX, IY1 - 5, 17, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    var C0p = [CX, IY1 - 6];

    /* surface, walls and rim */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.68)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(IX0, surf); ctx.lineTo(IX1, surf); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,215,235,0.55)'; ctx.lineWidth = WALL;
    ctx.beginPath();
    ctx.moveTo(TX0 + WALL / 2, TY0); ctx.lineTo(TX0 + WALL / 2, TY1 - WALL / 2);
    ctx.lineTo(TX1 - WALL / 2, TY1 - WALL / 2); ctx.lineTo(TX1 - WALL / 2, TY0);
    ctx.stroke();
    ctx.restore();

    /* normal at the point where the ray leaves the liquid */
    var Sx = CX + dpx * Math.tan(i);
    Sx = Math.min(Sx, IX1 - 8);
    var S = [Sx, surf];
    if (state.show.normal) {
      dashLine(S[0], surf - 130, S[0], surf + 90, 'rgba(25,45,80,0.62)', 1.5, [7, 5]);
      dashLine(CX, TY0 - 6, CX, IY1, 'rgba(25,45,80,0.35)', 1.2, [6, 6]);
    }

    var lit = state.fired, frac = litFrac();

    /* the two rays that let an eye judge the depth */
    var yImg = null;
    if (!lit) {
      aimLine(C0p, [CX, surf]);
      aimLine(C0p, S);
      if (state.show.labels) offHint(300, PAPER.y + 26);
      var dPre = (r !== null) ? [Math.sin(r), -Math.cos(r)] : [Math.sin(i), -Math.cos(i)];
      drawEye(S[0] + dPre[0] * 186, S[1] + dPre[1] * 186, vang(dPre));
    } else {
    var dLen = vlen(vsub(S, C0p));
    var db = [
      beamItem(C0p, [CX, surf], col, 0.9, 2.4, 0.6, 0),
      beamItem([CX, surf], [CX, surf - 132], col, 0.9, 2.4, 0.55, vlen(vsub([CX, surf], C0p))),
      beamItem(C0p, S, col, 0.9, 2.4, 0.6, 0)
    ];
    if (r !== null) {
      var dOut = [Math.sin(r), -Math.cos(r)];
      db.push(beamItem(S, [S[0] + dOut[0] * 168, S[1] + dOut[1] * 168], col,
        Math.max(0.25, sol.T), 2.4, 0.6, dLen));
    } else {
      var dRefV = [Math.sin(i), Math.cos(i)];
      db.push(beamItem(S, [S[0] + dRefV[0] * 120, S[1] + dRefV[1] * 120], col, 0.95, 2.4, 0.55, dLen));
    }
    drawBeam(db, frac);

    if (r !== null) {
      var dOut2 = [Math.sin(r), -Math.cos(r)];
      /* backward extension — where the eye judges the coin to be */
      yImg = surf + dpx * Math.tan(i) / (Math.tan(r) || 1e-6);
      dashLine(S[0], S[1], CX, yImg, 'rgba(120,90,180,0.85)', 1.5, [6, 5]);
      dashLine(CX, surf, CX, yImg, 'rgba(120,90,180,0.45)', 1.2, [4, 4]);
      /* the virtual image of the coin */
      ctx.save();
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = '#d9b45e';
      ctx.beginPath(); ctx.ellipse(CX, yImg, 23, 7.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,110,220,0.9)'; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.ellipse(CX, yImg, 23, 7.5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      drawEye(S[0] + dOut2[0] * 186, S[1] + dOut2[1] * 186, vang(dOut2));
    } else if (state.show.labels) {
      haloText('Beyond the critical angle — no light escapes here',
        S[0] + 10, surf - 22, '#7a2fb0', 12, 800, 'center', 'bottom', PAPER_HALO);
    }
    }

    if (state.show.arcs) {
      angleArc(S[0], S[1], Math.PI / 2, vang(vnorm(vsub(S, C0p))), 44, '#0b63b8',
        'i = ' + state.ang.toFixed(1) + '°');
      if (lit && r !== null) {
        angleArc(S[0], S[1], -Math.PI / 2, vang([Math.sin(r), -Math.cos(r)]), 52, '#b8360b',
          'r = ' + deg(r).toFixed(1) + '°');
      }
    }

    /* dimension lines */
    dimV(552, surf, IY1 - 6, '#0b63b8', 'Real depth  ' + state.realDepth + ' mm');
    if (lit && yImg != null) dimV(64, surf, yImg, '#7a2fb0', 'Apparent  ' + (sol.apparent).toFixed(1) + ' mm');

    if (state.show.labels) {
      paperText(mA.name + '   n = ' + sol.n2.toFixed(3), TX0 + 16, surf - 14, 11.5, 'left', 'bottom');
      paperText(mL.name + '   n = ' + sol.n1.toFixed(3), TX0 + 16, surf + 16, 11.5, 'left', 'top');
      paperText('Surface — the refracting boundary', IX1 - 10, surf - 10, 10, 'right', 'bottom', '#3a5478');
      /* the coin sits at the very bottom of the tank, which is exactly where a
         wrapped dock reaches on a mid-width screen */
      paperText('object (real)', CX + 32, Math.min(IY1 - 6, safeBottom(8)), 10.5, 'left', 'middle', '#12233b');
      if (lit && yImg != null) paperText('image (virtual, raised)', CX + 32, yImg, 10.5, 'left', 'middle', '#5a3a94');
    }
  }

  /* a simple eye symbol, so it is obvious who is doing the looking. In the tank
     arrangement the light starts at the coin, so the EYE is what you drag. */
  function drawEye(x, y, ang) {
    srcHandle = { p: [x, y], ang: ang, back: 20, fwd: 20, hw: 16 };
    ctx.save();
    if (srcHover) {
      ctx.strokeStyle = 'rgba(34,211,238,0.95)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.translate(x, y); ctx.rotate(ang + Math.PI);
    ctx.fillStyle = '#eef3fa'; ctx.strokeStyle = '#243a58'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-16, 0); ctx.quadraticCurveTo(0, -12, 16, 0);
    ctx.quadraticCurveTo(0, 12, -16, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#243a58';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-1.6, -1.6, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* vertical dimension line with end ticks */
  function dimV(x, y0, y1, col, label) {
    ctx.save();
    ctx.strokeStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y0); ctx.lineTo(x, y1);
    ctx.moveTo(x - 7, y0); ctx.lineTo(x + 7, y0);
    ctx.moveTo(x - 7, y1); ctx.lineTo(x + 7, y1);
    ctx.stroke();
    ctx.restore();
    arrowHead(x, y0, x, y1, 0.97, [90, 130, 200], 1);
    arrowHead(x, y1, x, y0, 0.97, [90, 130, 200], 1);
    ctx.save();
    ctx.translate(x - 12, (y0 + y1) / 2); ctx.rotate(-Math.PI / 2);
    haloText(label, 0, 0, col, 11, 700, 'center', 'bottom', PAPER_HALO);
    ctx.restore();
  }

  /* ── 15. Graph panel ───────────────────────────────────────── */

  var AX = { x0: 0, x1: 1, y0: 0, y1: 1 };
  function GXf(v) { return GX + (v - AX.x0) / (AX.x1 - AX.x0) * GW; }
  function GYf(v) { return GY + GH - (v - AX.y0) / (AX.y1 - AX.y0) * GH; }

  function plotFrame(title, xlab, ylab, x0, x1, y0, y1, xs, ys, dp) {
    AX.x0 = x0; AX.x1 = x1; AX.y0 = y0; AX.y1 = y1;
    var v;
    ctx.save();
    /* card */
    ctx.fillStyle = 'rgba(18,24,36,0.92)';
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1;
    roundRect(ctx, GX - 54, GY - 42, GW + 80, GH + 92, 12);
    ctx.fill(); ctx.stroke();

    haloText(title, GX + GW / 2 - 7, GY - 22, '#e6f7fb', 12.5, 700, 'center', 'middle');

    /* grid */
    if (state.show.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
      for (v = x0; v <= x1 + 1e-9; v += xs) {
        ctx.beginPath(); ctx.moveTo(GXf(v), GY); ctx.lineTo(GXf(v), GY + GH); ctx.stroke();
      }
      for (v = y0; v <= y1 + 1e-9; v += ys) {
        ctx.beginPath(); ctx.moveTo(GX, GYf(v)); ctx.lineTo(GX + GW, GYf(v)); ctx.stroke();
      }
    }

    /* axes */
    ctx.strokeStyle = 'rgba(200,225,240,0.62)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(GX, GY); ctx.lineTo(GX, GY + GH); ctx.lineTo(GX + GW, GY + GH);
    ctx.stroke();

    ctx.fillStyle = 'rgba(180,205,225,0.85)';
    ctx.font = '600 10px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (v = x0; v <= x1 + 1e-9; v += xs) ctx.fillText(fmtAx(v, dp), GXf(v), GY + GH + 7);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (v = y0; v <= y1 + 1e-9; v += ys) ctx.fillText(fmtAx(v, dp), GX - 7, GYf(v));
    ctx.restore();

    haloText(xlab, GX + GW / 2, GY + GH + 30, '#9fd8e6', 11, 700, 'center', 'top');
    ctx.save();
    ctx.translate(GX - 40, GY + GH / 2); ctx.rotate(-Math.PI / 2);
    haloText(ylab, 0, 0, '#9fd8e6', 11, 700, 'center', 'middle');
    ctx.restore();
  }

  function fmtAx(v, dp) {
    if (dp === 0) return String(Math.round(v));
    return v.toFixed(dp == null ? 1 : dp);
  }

  function plotLine(fn, x0, x1, col, wd, dash) {
    var n = 220, k, started = false;
    ctx.save();
    if (dash) ctx.setLineDash(dash);
    ctx.strokeStyle = col; ctx.lineWidth = wd || 2.2;
    ctx.lineJoin = 'round'; ctx.beginPath();
    for (k = 0; k <= n; k++) {
      var x = x0 + (x1 - x0) * k / n;
      var y = fn(x);
      /* out of range means the curve has left the plot — break the path.
         Clamping instead would draw a false horizontal line along the frame. */
      if (y == null || !isFinite(y) || y < AX.y0 || y > AX.y1) { started = false; continue; }
      if (!started) { ctx.moveTo(GXf(x), GYf(y)); started = true; }
      else ctx.lineTo(GXf(x), GYf(y));
    }
    ctx.stroke(); ctx.restore();
  }

  function drawGraph() {
    var m = state.graph;
    if (m === 'sinsin') return graphSinSin();
    if (m === 'intensity') return graphIntensity();
    return graphCurve();
  }

  /* The graph the school experiment actually produces: sin i against sin r.
     Snell's law says the points lie on a straight line through the origin
     whose gradient is the refractive index. */
  function graphSinSin() {
    plotFrame('sin i  against  sin r', 'sin r', 'sin i', 0, 1, 0, 1, 0.2, 0.2, 1);

    /* the theoretical line */
    var nR = sol.nRel;
    plotLine(function (x) { return nR * x; }, 0, 1, 'rgba(34,211,238,0.45)', 1.8, [7, 5]);

    /* recorded readings */
    var xs = 0, xy = 0, cnt = 0, k;
    for (k = 0; k < state.rows.length; k++) {
      var row = state.rows[k];
      if (row.tir) continue;
      var x = Math.sin(rad(row.r)), y = Math.sin(rad(row.i));
      xs += x * x; xy += x * y; cnt++;
      ctx.save();
      ctx.fillStyle = '#f5c842';
      ctx.beginPath(); ctx.arc(GXf(x), GYf(y), 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(10,14,22,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
    }

    /* least-squares gradient forced through the origin — the physically
       correct fit, because zero incidence must give zero refraction */
    if (cnt >= 2 && xs > 1e-9) {
      var mFit = xy / xs;
      plotLine(function (x) { return mFit * x; }, 0, 1, '#3ddc84', 2.2, null);
      haloText('best fit  n = ' + mFit.toFixed(3), GX + 10, GY + 16, '#3ddc84', 12, 700, 'left', 'top');
    }

    /* the live point */
    if (!sol.tir && sol.r !== null) {
      var cx = GXf(Math.sin(sol.r)), cy = GYf(Math.sin(sol.i));
      ctx.save();
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(34,211,238,0.35)'; ctx.fill();
      ctx.restore();
    }
    /* bottom-right of the plot — the top-left corner is where the best-fit
       caption goes, and the sin i / sin r line never reaches down here */
    haloText(state.rows.length + ' reading' + (state.rows.length === 1 ? '' : 's') + ' recorded',
      GX + GW - 10, GY + GH - 10, '#6b7a99', 10.5, 600, 'right', 'bottom');
  }

  /* The continuous relation behind the readings — different for each apparatus. */
  function graphCurve() {
    var app = state.app;
    if (app === 'prism') {
      var A = rad(state.apex), n1 = sol.n1, n2 = sol.n2;
      plotFrame('Deviation D against angle of incidence i₁', 'i₁  (degrees)', 'D  (degrees)',
        0, 80, 0, 80, 20, 20, 0);
      plotLine(function (x) {
        var r1 = refractAngle(n1, n2, rad(x));
        if (r1 === null) return null;
        var r2 = A - r1;
        var e = refractAngle(n2, n1, r2);
        if (e === null) return null;
        return deg(rad(x) + e - A);
      }, 0, 80, '#22d3ee', 2.4, null);
      if (sol.devMin != null) {
        var dm = deg(sol.devMin);
        var iMin = deg(refractAngle(n2, n1, A / 2) || 0);
        plotLine(function () { return dm; }, 0, 80, 'rgba(61,220,132,0.55)', 1.5, [6, 4]);
        haloText('D min = ' + dm.toFixed(1) + '° at i₁ = ' + iMin.toFixed(1) + '°',
          GX + 8, GYf(dm) - 8, '#3ddc84', 10.5, 700, 'left', 'bottom');
      }
      if (sol.trace && sol.trace.ok) markPoint(state.ang, deg(sol.trace.dev));
      return;
    }
    if (app === 'depth') {
      plotFrame('Apparent depth against viewing angle', 'viewing angle  (degrees)', 'apparent depth  (mm)',
        0, 50, 0, Math.max(20, state.realDepth), 10, Math.max(5, Math.round(state.realDepth / 4)), 0);
      var d0 = state.realDepth, na = sol.n1, nb = sol.n2;
      plotLine(function (x) {
        if (x < 0.4) return d0 * nb / na;
        var rr = refractAngle(na, nb, rad(x));
        if (rr === null) return null;
        return d0 * Math.tan(rad(x)) / Math.tan(rr);
      }, 0, 50, '#22d3ee', 2.4, null);
      plotLine(function () { return sol.paraxial; }, 0, 50, 'rgba(61,220,132,0.55)', 1.5, [6, 4]);
      haloText('paraxial  d/n = ' + sol.paraxial.toFixed(1) + ' mm', GX + 8, GYf(sol.paraxial) - 8,
        '#3ddc84', 10.5, 700, 'left', 'bottom');
      if (sol.apparent != null) markPoint(state.ang, sol.apparent);
      return;
    }
    /* semicircular block and slab: r against i */
    plotFrame('Angle of refraction against angle of incidence', 'i  (degrees)', 'r  (degrees)',
      0, 90, 0, 90, 15, 15, 0);
    var na2 = sol.n1, nb2 = sol.n2;
    plotLine(function (x) {
      var rr = refractAngle(na2, nb2, rad(x));
      return rr === null ? null : deg(rr);
    }, 0, 90, '#22d3ee', 2.4, null);
    plotLine(function (x) { return x; }, 0, 90, 'rgba(255,255,255,0.16)', 1.2, [5, 5]);
    if (sol.C != null) {
      var cDeg = deg(sol.C);
      ctx.save();
      ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(245,200,66,0.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(GXf(cDeg), GY); ctx.lineTo(GXf(cDeg), GY + GH); ctx.stroke();
      ctx.restore();
      haloText('C = ' + cDeg.toFixed(1) + '°', GXf(cDeg) + 6, GY + 12, '#f5c842', 11, 700, 'left', 'top');
      haloText('total internal reflection', GXf(cDeg) + 6, GY + 28, '#f5c842', 9.5, 600, 'left', 'top');
    }
    if (sol.r !== null) markPoint(state.ang, deg(sol.r));
  }

  function markPoint(x, y) {
    if (y == null || !isFinite(y)) return;
    var cx = GXf(clamp(x, AX.x0, AX.x1)), cy = GYf(clamp(y, AX.y0, AX.y1));
    ctx.save();
    ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(34,211,238,0.35)'; ctx.fill();
    ctx.restore();
  }

  /* How the incident energy actually splits — refraction is never the whole
     story, and at the critical angle reflection takes all of it. */
  function graphIntensity() {
    plotFrame('Reflected and transmitted share of the beam', 'angle of incidence  (degrees)',
      'percentage of intensity', 0, 90, 0, 100, 15, 20, 0);
    var n1 = sol.n1, n2 = sol.n2;
    plotLine(function (x) { return reflectance(n1, n2, rad(x)) * 100; }, 0, 90, '#f5c842', 2.4, null);
    plotLine(function (x) { return (1 - reflectance(n1, n2, rad(x))) * 100; }, 0, 90, '#22d3ee', 2.4, null);
    haloText('reflected', GX + 10, GY + 14, '#f5c842', 11, 700, 'left', 'top');
    haloText('refracted (transmitted)', GX + 10, GY + 30, '#22d3ee', 11, 700, 'left', 'top');
    if (sol.C != null) {
      var cDeg = deg(sol.C);
      dashLine(GXf(cDeg), GY, GXf(cDeg), GY + GH, 'rgba(245,200,66,0.7)', 1.5, [6, 4]);
      haloText('C = ' + cDeg.toFixed(1) + '°', GXf(cDeg) - 6, GY + GH - 12, '#f5c842', 10.5, 700, 'right', 'bottom');
    } else {
      var bDeg = deg(sol.brew);
      dashLine(GXf(bDeg), GY, GXf(bDeg), GY + GH, 'rgba(160,120,220,0.7)', 1.5, [6, 4]);
      haloText('Brewster ' + bDeg.toFixed(1) + '°', GXf(bDeg) + 6, GY + GH - 12, '#b18cf0', 10.5, 700, 'left', 'bottom');
    }
    markPoint(state.ang, sol.R * 100);
  }

  /* ── 16. Main render ───────────────────────────────────────── */

  function draw() {
    var now = performance.now();
    srcHandle = null;
    ctx.setTransform(fitScale, 0, 0, fitScale, 0, 0);

    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#101725'); bg.addColorStop(0.55, '#0b1018'); bg.addColorStop(1, '#070a10');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(appTX, appTY); ctx.scale(appScale, appScale);
    ctx.beginPath(); ctx.rect(0, 0, APP_W, APP_H); ctx.clip();
    drawBench();
    ctx.save();
    roundRect(ctx, PAPER.x, PAPER.y, PAPER.w, PAPER.h, 6); ctx.clip();
    drawSurround();
    ctx.restore();
    if (state.app === 'semi') drawSemi(now);
    else if (state.app === 'slab') drawSlab(now);
    else if (state.app === 'prism') drawPrism(now);
    else drawDepth(now);
    ctx.restore();

    drawGraph();
    if (!portrait) drawEqPanel();
  }

  /* Snell's law with the current numbers, large enough to read from the back
     of a classroom. Landscape only — in portrait the graph already reaches
     the foot of the canvas. */
  function drawEqPanel() {
    var px = GX - 54, py = GY + GH + 56, pw = GW + 80, ph = 88;
    ctx.save();
    ctx.fillStyle = 'rgba(18,24,36,0.92)';
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1;
    roundRect(ctx, px, py, pw, ph, 12); ctx.fill(); ctx.stroke();
    ctx.restore();

    var cx = px + pw / 2;
    haloText('n₁ sin i  =  n₂ sin r', cx, py + 20, '#9fd8e6', 13, 700, 'center', 'middle');

    if (!state.fired) {
      haloText('lamp off', cx, py + 47, '#6b7a99', 12.5, 700, 'center', 'middle');
      haloText('press  \u25B6 Fire ray', cx, py + 70, '#22d3ee', 13.5, 800, 'center', 'middle');
      return;
    }
    if (sol.tir) {
      haloText('sin r would be ' + (sol.n1 * Math.sin(sol.i) / sol.n2).toFixed(3) + '  —  impossible',
        cx, py + 45, '#f5c842', 12.5, 700, 'center', 'middle');
      haloText('TOTAL INTERNAL REFLECTION', cx, py + 69, '#f5c842', 14, 800, 'center', 'middle');
      return;
    }
    var hid = state.unknown;
    haloText(sol.n1.toFixed(3) + ' × sin ' + state.ang.toFixed(1) + '°   =   ' +
      (hid ? 'n₂' : sol.n2.toFixed(3)) + ' × sin ' + deg(sol.r).toFixed(1) + '°',
      cx, py + 45, '#e6f7fb', 13.5, 700, 'center', 'middle');
    haloText((sol.n1 * Math.sin(sol.i)).toFixed(4) + '   =   ' +
      (hid ? '?' : (sol.n2 * Math.sin(sol.r)).toFixed(4)),
      cx, py + 70, '#22d3ee', 15, 800, 'center', 'middle');
  }

  /* ── 17. Readouts & live equations ─────────────────────────── */

  function fmtDeg(r) { return r === null ? '—' : deg(r).toFixed(1) + '°'; }
  function q(v) { return state.unknown ? '?' : v; }

  function mediumLabel(id) {
    if (state.unknown && id === state.m2) return 'Unknown block';
    return medium(id).name;
  }

  function updateReadouts() {
    solve();
    checkPairChange();
    var s = state, hid = state.unknown;

    $('ro-i').textContent = s.ang.toFixed(1) + '°';

    /* r, the ray-derived quantities and the intensity split are OBSERVATIONS —
       there is nothing to observe until the lamp is fired. n, C, v and λ are
       properties of the media you picked from the menu, so they stay. */
    var lit = state.fired;
    var rEl = $('ro-r');
    if (!lit) { rEl.textContent = '—'; rEl.className = 'ro-value'; }
    else if (sol.tir) { rEl.textContent = 'T.I.R.'; rEl.className = 'ro-value warn'; }
    else { rEl.textContent = fmtDeg(sol.r); rEl.className = 'ro-value'; }

    $('ro-n').textContent = hid ? '?' : sol.nRel.toFixed(3);
    $('ro-c').textContent = hid ? '?' : (sol.C === null ? 'none' : deg(sol.C).toFixed(1) + '°');
    $('ro-v').textContent = hid ? '?' : (sol.v2 / 1e8).toFixed(3) + '×10⁸ m/s';
    $('ro-lam').textContent = hid ? '?' : sol.lam2.toFixed(0) + ' nm';
    $('ro-split').textContent = !lit ? '—'
      : hid ? '?' : (sol.R * 100).toFixed(1) + '% / ' + (sol.T * 100).toFixed(1) + '%';

    /* the apparatus-specific cell */
    var lab = $('ro-ex-label'), val = $('ro-ex');
    val.className = 'ro-value';
    if (!lit) {
      lab.textContent = s.app === 'slab' ? 'Lateral displacement'
        : s.app === 'prism' ? 'Deviation D'
        : s.app === 'depth' ? 'Apparent depth' : 'sin i / sin r';
      val.textContent = '—';
    } else if (s.app === 'slab') {
      lab.textContent = 'Lateral displacement';
      val.textContent = sol.lateral == null ? '—' : sol.lateral.toFixed(2) + ' mm';
    } else if (s.app === 'prism') {
      lab.textContent = 'Deviation D';
      if (sol.dev != null) {
        val.textContent = deg(sol.dev).toFixed(1) + '°';
      } else {
        val.textContent = 'T.I.R. inside';
        val.className = 'ro-value warn';
      }
    } else if (s.app === 'depth') {
      lab.textContent = 'Apparent depth';
      if (sol.tir) { val.textContent = 'no ray escapes'; val.className = 'ro-value warn'; }
      else val.textContent = sol.apparent == null ? '—' : sol.apparent.toFixed(1) + ' mm';
    } else {
      lab.textContent = 'sin i / sin r';
      val.textContent = (sol.r === null || Math.sin(sol.r) < 1e-6)
        ? '—' : (Math.sin(sol.i) / Math.sin(sol.r)).toFixed(3);
    }

    /* index tags beside the medium selectors */
    $('m1-n').textContent = 'n = ' + nOf(s.m1, sol.wl).toFixed(3);
    $('m2-n').textContent = hid ? 'n = ?' : 'n = ' + nOf(s.m2, sol.wl).toFixed(3);
    $('m1-sw').style.background = 'rgb(' + medium(s.m1).tint.join(',') + ')';
    $('m2-sw').style.background = hid ? '#39415a' : 'rgb(' + medium(s.m2).tint.join(',') + ')';

    updateEquations();
    updateReportBtns();
  }

  /* KaTeX is written only when the markup actually changes — the wavefront
     animation redraws every frame and would otherwise re-typeset continuously. */
  var eqCache = '';

  function setMath(el, html) {
    el.innerHTML = html;
    var tries = 0;
    (function go() {
      if (window.MMLatex && window.renderMathInElement) { window.MMLatex.render(el); return; }
      if (tries++ < 60) setTimeout(go, 120);
    })();
  }

  function updateEquations() {
    var s = state, h = '', hid = s.unknown;
    if (!s.fired) {
      h = '<div class="eq-line">\\[ n_1 \\sin i = n_2 \\sin r \\]</div>' +
          '<p class="eq-note">The lamp is off. Aim it with the <strong>angle of incidence</strong> control or by ' +
          'dragging on the bench, then press <strong>&#9654; Fire ray</strong> to send light through the apparatus. ' +
          'The path stays on screen until you change something &mdash; changing the setup switches the lamp off ' +
          'again, ready for the next run.</p>';
      if (h !== eqCache) { eqCache = h; setMath($('lp-eq-body'), h); }
      return;
    }
    var n1 = sol.n1, n2 = sol.n2;
    var iD = s.ang.toFixed(1), rD = sol.r === null ? null : deg(sol.r).toFixed(1);
    var n1s = n1.toFixed(4), n2s = hid ? 'n_2' : n2.toFixed(4);

    h += '<div class="eq-line">\\[ n_1 \\sin i = n_2 \\sin r \\]</div>';
    if (sol.tir) {
      h += '<p class="eq-note">At ' + iD + '° the value of \\(\;n_1\\sin i / n_2\;\\) exceeds 1, so no angle \\(r\\) satisfies the equation. ' +
           'There is no refracted ray at all &mdash; the light is <strong>totally internally reflected</strong>.</p>';
    } else {
      h += '<div class="eq-line">\\[ ' + n1s + ' \\times \\sin ' + iD + '^\\circ = ' + n2s +
           ' \\times \\sin ' + rD + '^\\circ \\]</div>';
      h += '<div class="eq-line">\\[ ' + (n1 * Math.sin(sol.i)).toFixed(4) + ' = ' +
           (hid ? '?' : (n2 * Math.sin(sol.r)).toFixed(4)) + ' \\]</div>';
      h += '<p class="eq-note">Both sides are equal, which is all Snell&rsquo;s law asserts: the quantity \\(n\\sin\\theta\\) is unchanged across the boundary.</p>';
    }

    if (!hid) {
      h += '<div class="eq-line">\\[ {}_1n_2 = \\frac{n_2}{n_1} = \\frac{\\sin i}{\\sin r} = \\frac{v_1}{v_2} = ' +
           sol.nRel.toFixed(4) + ' \\]</div>';
      h += '<div class="eq-line">\\[ v_2 = \\frac{c}{n_2} = \\frac{3.00\\times10^{8}}{' + n2.toFixed(4) +
           '} = ' + (sol.v2 / 1e8).toFixed(3) + '\\times10^{8}\\ \\mathrm{m\\,s^{-1}} \\]</div>';
      h += '<div class="eq-line">\\[ \\lambda_2 = \\frac{\\lambda_0}{n_2} = \\frac{' + sol.wl.toFixed(0) + '}{' +
           n2.toFixed(4) + '} = ' + sol.lam2.toFixed(1) + '\\ \\mathrm{nm} \\quad (f\\ \\text{unchanged}) \\]</div>';
      if (s.white) {
        h += '<p class="eq-note">White light has no single wavelength, so the figures above are quoted at the ' +
             '<strong>sodium D line, 589 nm</strong> &mdash; the wavelength every published refractive index refers to. ' +
             'Each colour in the beam has its own slightly different index, which is what spreads it.</p>';
      }
      if (sol.C !== null) {
        h += '<div class="eq-line">\\[ \\sin C = \\frac{n_2}{n_1} = \\frac{' + n2.toFixed(4) + '}{' +
             n1.toFixed(4) + '} \;\\Rightarrow\; C = ' + deg(sol.C).toFixed(2) + '^\\circ \\]</div>';
      } else {
        h += '<p class="eq-note">There is no critical angle here: light is passing into the <em>optically denser</em> medium, and a ray bending <em>towards</em> the normal can never reach 90&deg;.</p>';
      }
    }

    if (s.app === 'slab' && sol.lateral != null) {
      h += '<div class="eq-line">\\[ d = \\frac{t\\,\\sin(i-r)}{\\cos r} = \\frac{' + s.thick +
           '\\sin(' + iD + '^\\circ - ' + rD + '^\\circ)}{\\cos ' + rD + '^\\circ} = ' +
           sol.lateral.toFixed(2) + '\\ \\mathrm{mm} \\]</div>';
      h += '<p class="eq-note">The emergent ray leaves at ' + iD + '&deg;, exactly the angle it arrived at &mdash; a parallel-sided block shifts a ray sideways but never turns it.</p>';
    }
    if (s.app === 'prism') {
      h += '<div class="eq-line">\\[ r_1 + r_2 = A \\qquad D = i_1 + i_2 - A \\]</div>';
      if (sol.trace && sol.trace.ok && sol.r2s != null && !sol.tirInside) {
        h += '<div class="eq-line">\\[ r_2 = A - r_1 = ' + s.apex + '^\\circ - ' +
             deg(sol.trace.r1).toFixed(1) + '^\\circ = ' + deg(sol.r2s).toFixed(1) + '^\\circ \\]</div>';
        if (sol.i2s != null) {
          h += '<div class="eq-line">\\[ i_2 = \\sin^{-1}(n \\sin r_2) = ' +
               deg(sol.i2s).toFixed(1) + '^\\circ \\]</div>';
        }
        if (sol.r2s < 0) {
          h += '<p class="eq-note">r&#8322; is negative because r&#8321; is larger than the apex angle: the ray ' +
               'meets the second face on the <em>other</em> side of its normal. Both r&#8321;&nbsp;+&nbsp;r&#8322;&nbsp;=&nbsp;A ' +
               'and D&nbsp;=&nbsp;i&#8321;&nbsp;+&nbsp;i&#8322;&nbsp;&minus;&nbsp;A still hold, so long as the angles carry their sign.</p>';
        }
      }
      if (sol.dev != null && sol.trace && sol.trace.ok) {
        h += '<div class="eq-line">\\[ D = ' + iD + '^\\circ + ' + deg(sol.trace.i2).toFixed(1) +
             '^\\circ - ' + s.apex + '^\\circ = ' + deg(sol.dev).toFixed(1) + '^\\circ \\]</div>';
      } else if (sol.tirInside) {
        h += '<p class="eq-note"><strong>The ray never reaches the second face at a small enough angle to leave it.</strong> ' +
             'Because \\(r_1 + r_2 = A\\), a small \\(r_1\\) forces a large \\(r_2\\); here \\(r_2\\) exceeds the ' +
             'critical angle of ' + (sol.C === null ? '—' : deg(critical(sol.n2, sol.n1)).toFixed(1)) +
             '&deg; and the light is totally internally reflected inside the prism instead of emerging. ' +
             'The formula D = i₁ + i₂ &minus; A does not apply.</p>';
        if (sol.iMin != null) {
          h += '<div class="eq-line">\\[ i_{1,\\min} = \\sin^{-1}\\!\\left(n\\sin(A - C)\\right) = ' +
               deg(sol.iMin).toFixed(1) + '^\\circ \\]</div>';
          h += '<p class="eq-note">Light emerges through the second face only for \\(i_1 \\ge ' +
               deg(sol.iMin).toFixed(1) + '^\\circ\\). Raise the angle of incidence past that and the spectrum reappears.</p>';
        }
      }
      if (sol.devMin != null && !hid) {
        h += '<div class="eq-line">\\[ n = \\frac{\\sin\\!\\left(\\frac{A + D_{min}}{2}\\right)}{\\sin\\!\\left(\\frac{A}{2}\\right)}' +
             ' \\quad D_{min} = ' + deg(sol.devMin).toFixed(2) + '^\\circ \\]</div>';
      }
    }
    if (s.app === 'depth') {
      h += '<div class="eq-line">\\[ n = \\frac{\\text{real depth}}{\\text{apparent depth}} \\quad\\Rightarrow\\quad ' +
           'd_{app} = \\frac{d_{real}}{n} = \\frac{' + s.realDepth + '}{' + (hid ? 'n' : (n1 / n2).toFixed(4)) +
           '} = ' + (hid ? '?' : sol.paraxial.toFixed(1)) + '\\ \\mathrm{mm} \\]</div>';
      h += '<p class="eq-note">That formula assumes you look almost straight down. At the ' + iD +
           '&deg; used here the geometry gives ' + (sol.apparent == null ? '&mdash;' : sol.apparent.toFixed(1) + ' mm') +
           ' &mdash; the coin appears to rise further the more obliquely you view it.</p>';
    }

    if (h !== eqCache) { eqCache = h; setMath($('lp-eq-body'), h); }
  }

  /* ── 18. Step-by-step calculation modal ────────────────────── */

  function buildCalcModal() {
    var s = state, h = '';
    var n1 = sol.n1, n2 = sol.n2;
    h += '<h4>1. What is on the bench</h4><p>Light travelling in <strong>' + mediumLabel(sol.idA) +
         '</strong> (n₁ = ' + n1.toFixed(4) + ') meets <strong>' + mediumLabel(sol.idB) + '</strong> (n₂ = ' +
         (s.unknown ? '?' : n2.toFixed(4)) + ') at an angle of incidence of <strong>' + s.ang.toFixed(1) +
         '°</strong>, measured from the normal. Wavelength in vacuum λ₀ = ' + sol.wl + ' nm.</p>';

    h += '<h4>2. Apply Snell&rsquo;s law</h4>';
    h += '<div class="eq-line">\\[ \\sin r = \\frac{n_1 \\sin i}{n_2} = \\frac{' + n1.toFixed(4) +
         ' \\times ' + Math.sin(sol.i).toFixed(4) + '}{' + (s.unknown ? 'n_2' : n2.toFixed(4)) + '}' +
         (s.unknown ? '' : ' = ' + (n1 * Math.sin(sol.i) / n2).toFixed(4)) + ' \\]</div>';
    if (sol.tir) {
      h += '<p>The right-hand side is greater than 1. No angle has a sine above 1, so there is no refracted ray: ' +
           'all of the light is reflected back into ' + mediumLabel(sol.idA) + '. This is total internal reflection.</p>';
    } else {
      h += '<p>r = sin⁻¹(' + (n1 * Math.sin(sol.i) / n2).toFixed(4) + ') = <strong>' + deg(sol.r).toFixed(2) +
           '°</strong>, measured from the normal on the far side of the boundary.</p>';
    }

    h += '<h4>3. Critical angle</h4>';
    if (sol.C === null) {
      h += '<p>None. A critical angle exists only when light travels from the optically denser medium into the rarer one. ' +
           'Here n₂ ≥ n₁, so the ray always bends towards the normal and can never emerge along the surface.</p>';
    } else {
      h += '<div class="eq-line">\\[ \\sin C = \\frac{n_2}{n_1} = ' + (n2 / n1).toFixed(4) +
           ' \;\\Rightarrow\; C = ' + deg(sol.C).toFixed(2) + '^\\circ \\]</div>';
      h += '<p>Beyond ' + deg(sol.C).toFixed(2) + '° the beam is totally internally reflected.</p>';
    }

    h += '<h4>4. What changes and what does not</h4>';
    h += '<div class="eq-line">\\[ v_2 = c/n_2 = ' + (sol.v2 / 1e8).toFixed(3) + '\\times10^{8}\\ \\mathrm{m\\,s^{-1}}' +
         ' \\qquad \\lambda_2 = \\lambda_0/n_2 = ' + sol.lam2.toFixed(1) + '\\ \\mathrm{nm} \\]</div>';
    h += '<p>Frequency is fixed by the source and is the same in both media: f = c/λ₀ = ' +
         (C0 / (sol.wl * 1e-9) / 1e14).toFixed(3) + '×10¹⁴ Hz. Speed and wavelength both fall by the factor n; ' +
         'colour, which the eye reads from frequency, does not change.</p>';

    h += '<h4>5. How the beam divides</h4>';
    h += '<p>Refraction never happens alone. At this angle <strong>' + (sol.R * 100).toFixed(1) +
         '%</strong> of the intensity is reflected and <strong>' + (sol.T * 100).toFixed(1) +
         '%</strong> is transmitted' + (sol.tir ? ' — or rather, none of it is.' : '.') +
         (sol.C === null ? ' The reflected fraction falls to a minimum of zero at the Brewster angle, ' +
          deg(sol.brew).toFixed(1) + '°, where the reflection is completely plane polarised.' : '') + '</p>';

    if (s.app === 'slab' && sol.lateral != null) {
      h += '<h4>6. Lateral displacement through the block</h4>';
      h += '<div class="eq-line">\\[ d = \\frac{t\\sin(i-r)}{\\cos r} = ' + sol.lateral.toFixed(3) + '\\ \\mathrm{mm} \\]</div>';
      h += '<p>The ray emerges parallel to its original direction but shifted sideways by ' +
           sol.lateral.toFixed(2) + ' mm. The two refractions are equal and opposite, so the direction is restored; ' +
           'only the position is not.</p>';
    }
    /* r2 = A - r1 describes a ray that crosses the two REFRACTING faces. After a
       total internal reflection the light leaves through the base instead, and
       the relation no longer holds — printing it anyway was quietly wrong. */
    if (s.app === 'prism' && sol.tirInside) {
      h += '<h4>6. The ray does not get out of the second face</h4>';
      var tpr = (sol.trace && sol.trace.tirPts && sol.trace.tirPts.length)
        ? deg(sol.trace.tirPts[0].ang).toFixed(2) + '°' : 'too steep an angle';
      h += '<p>Inside the glass the ray meets the second face at ' + tpr +
           ' to the normal there. Because r₁ + r₂ = A, a small r₁ forces a large r₂, and once r₂ passes the ' +
           'critical angle of ' + (critical(sol.n2, sol.n1) === null ? '—' : deg(critical(sol.n2, sol.n1)).toFixed(2) + '°') +
           ' the light is totally internally reflected there. It does not stay trapped, though: the reflected ray ' +
           'meets the <strong>base</strong> at ' +
           (sol.trace && sol.trace.r2 != null ? deg(sol.trace.r2).toFixed(2) + '°' : '—') +
           ', which is <em>below</em> the critical angle, so it refracts out through the base at ' +
           (sol.trace && sol.trace.i2 != null ? deg(sol.trace.i2).toFixed(2) + '°' : '—') +
           '. That is why you still see a beam leaving the prism. Because it never crossed the second ' +
           'refracting face, D = i₁ + i₂ − A does not describe its deviation.</p>';
      if (sol.iMin != null) {
        h += '<div class="eq-line">\\[ i_{1,\\min} = \\sin^{-1}\\!\\left(n\\sin(A - C)\\right) = ' +
             deg(sol.iMin).toFixed(2) + '^\\circ \\]</div>';
        h += '<p>Raise the angle of incidence to ' + deg(sol.iMin).toFixed(1) +
             '° or more and the beam emerges through the second face again.</p>';
      }
    } else if (s.app === 'prism' && sol.trace && sol.trace.ok) {
      h += '<h4>6. Passage through the prism</h4>';
      var r2m = (sol.r2s != null ? deg(sol.r2s) : deg(sol.trace.r2));
      var i2m = (sol.i2s != null ? deg(sol.i2s) : deg(sol.trace.i2));
      h += '<div class="eq-line">\\[ r_1 = ' + deg(sol.trace.r1).toFixed(2) + '^\\circ,\\quad r_2 = A - r_1 = ' +
           r2m.toFixed(2) + '^\\circ,\\quad i_2 = ' + i2m.toFixed(2) + '^\\circ \\]</div>';
      if (r2m < 0) {
        h += '<p>r&#8322; is negative because r&#8321; is larger than the apex angle: the ray meets the ' +
             'second face on the <em>other</em> side of its normal. Both r&#8321; + r&#8322; = A and ' +
             'D = i&#8321; + i&#8322; &minus; A still hold, provided the angles carry their sign.</p>';
      }
      h += '<div class="eq-line">\\[ D = i_1 + i_2 - A = ' + deg(sol.dev).toFixed(2) + '^\\circ \\]</div>';
      if (sol.devMin != null) {
        h += '<p>The minimum deviation for this prism is ' + deg(sol.devMin).toFixed(2) +
             '°, reached when the ray passes symmetrically (r₁ = r₂ = A/2). Measuring D<sub>min</sub> is the standard ' +
             'spectrometer method of finding a refractive index.</p>';
      }
    }
    if (s.app === 'depth') {
      h += '<h4>6. Real and apparent depth</h4>';
      h += '<div class="eq-line">\\[ n = \\frac{d_{real}}{d_{app}} \;\\Rightarrow\; d_{app} = \\frac{' +
           s.realDepth + '}{' + (n1 / n2).toFixed(4) + '} = ' + sol.paraxial.toFixed(2) + '\\ \\mathrm{mm} \\]</div>';
      h += '<p>Viewed at ' + s.ang.toFixed(1) + '° rather than straight down, the two rays actually drawn cross at ' +
           (sol.apparent == null ? '—' : sol.apparent.toFixed(2) + ' mm') +
           '. The near-normal formula is an approximation, and this is by how much.</p>';
    }

    setMath($('calc-modal-body'), h);
  }

  /* ── 19. Readings table ────────────────────────────────────── */

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rnd(a, b, dp) { var v = a + Math.random() * (b - a); return parseFloat(v.toFixed(dp == null ? 0 : dp)); }

  function bestFitN() {
    var xs = 0, xy = 0, cnt = 0, k;
    for (k = 0; k < state.rows.length; k++) {
      var row = state.rows[k];
      if (row.tir) continue;
      var x = Math.sin(rad(row.r)), y = Math.sin(rad(row.i));
      xs += x * x; xy += x * y; cnt++;
    }
    if (cnt < 2 || xs < 1e-9) return null;
    return { n: xy / xs, count: cnt };
  }

  /* A protractor is read to the nearest half-degree, not to four decimal
     places. Recording the exact computed angle would give a perfect fit every
     time and teach nothing about experimental error, so readings are
     quantised the way the instrument actually quantises them. */
  var PROTRACTOR_LC = 0.5;
  function readOff(d) { return Math.round(d / PROTRACTOR_LC) * PROTRACTOR_LC; }

  function recordReading() {
    if (!state.fired) { playError(); return; }
    if (state.rows.length >= 24) { playError(); return; }
    state.rows.push({
      i: readOff(state.ang),
      r: sol.r === null ? null : readOff(deg(sol.r)),
      tir: sol.tir,
      app: state.app
    });
    playRecord();
    renderRows(); refresh();
  }

  function renderRows() {
    var tb = $('data-rows'), sum = $('data-summary'), h = '', k;
    if (!state.rows.length) {
      tb.innerHTML = '<tr><td colspan="7" class="data-empty">No readings yet. Set an angle of incidence, then press ' +
        '<strong>Record reading</strong> on the bench. Six or seven angles spread from 10° to 80° give a good straight line.</td></tr>';
      sum.innerHTML = '';
      return;
    }
    for (k = 0; k < state.rows.length; k++) {
      var row = state.rows[k];
      var si = Math.sin(rad(row.i));
      if (row.tir) {
        h += '<tr class="tir"><td>' + (k + 1) + '</td><td>' + row.i.toFixed(1) + '</td>' +
             '<td colspan="4">total internal reflection — no refracted ray</td>' +
             '<td><button class="row-del" data-del="' + k + '" aria-label="Delete reading ' + (k + 1) + '">&times;</button></td></tr>';
      } else {
        var sr = Math.sin(rad(row.r));
        h += '<tr><td>' + (k + 1) + '</td><td>' + row.i.toFixed(1) + '</td><td>' + row.r.toFixed(1) + '</td>' +
             '<td>' + si.toFixed(4) + '</td><td>' + sr.toFixed(4) + '</td>' +
             '<td>' + (sr > 1e-6 ? (si / sr).toFixed(3) : '—') + '</td>' +
             '<td><button class="row-del" data-del="' + k + '" aria-label="Delete reading ' + (k + 1) + '">&times;</button></td></tr>';
      }
    }
    tb.innerHTML = h;

    var fit = bestFitN();
    if (!fit) {
      sum.innerHTML = '<strong>' + state.rows.length + '</strong> reading' + (state.rows.length === 1 ? '' : 's') +
        ' recorded. At least two usable readings are needed before a gradient can be fitted.' +
        '<br>Angles are logged to the nearest ' + PROTRACTOR_LC.toFixed(1) + '&deg;, the precision a school protractor can be read to.';
    } else {
      var trueN = sol.nRel;
      var err = (fit.n - trueN) / trueN * 100;
      sum.innerHTML =
        'Gradient of the best straight line through the origin &mdash; the refractive index you have measured:<br>' +
        '<span class="mean">n = ' + fit.n.toFixed(4) + '</span> &nbsp;from ' + fit.count + ' usable reading' +
        (fit.count === 1 ? '' : 's') + '.' +
        (state.unknown ? ' <em>The accepted value is concealed while the sample is sealed.</em>'
          : '<br>Accepted value for this pair of media: <strong>' + trueN.toFixed(4) + '</strong> &mdash; your line is out by ' +
            (err >= 0 ? '+' : '−') + Math.abs(err).toFixed(2) + '%.') +
        '<br><span style="font-size:0.8rem">Angles are logged to the nearest ' + PROTRACTOR_LC.toFixed(1) +
        '&deg;, the precision a school protractor can be read to &mdash; which is where the scatter in your points comes from.</span>';
    }
    if (state.unknown) buildUnknownMaterials();
  }

  /* ── 19b. Total internal reflection preset ─────────────────────
     TIR is reachable on three of the four benches, but only if you already know
     which way to turn the block, which liquid is denser, or that a prism stops
     transmitting BELOW a certain angle. One button sets each bench up for it.

     The fourth case is the interesting one. Inside a parallel-sided block TIR
     is impossible whatever the media: entry gives sin r₁ = (n₁/n₂) sin i, so
     r₁ ≤ asin(n₁/n₂) = C₂, and the internal ray can never exceed the critical
     angle of the second face. The only total internal reflection a slab can
     show is at the FIRST face, with the surrounding denser than the block —
     the light bounces off instead of entering. */

  var TIR_SETUPS = {
    semi:  { dir: 'out', m1: 'air',      m2: 'crown', note: 'glass \u2192 air at the flat face' },
    slab:  { dir: 'in',  m1: 'glycerol', m2: 'ice',   note: 'denser liquid outside a rarer block' },
    prism: { dir: 'in',  m1: 'air',      m2: 'flint', apex: 60, note: 'trapped at the second face' },
    depth: { dir: 'in',  m1: 'air',      m2: 'water', note: 'the edge of Snell\u2019s window' }
  };

  function applyTIR() {
    if (state.unknown) { playError(); return; }
    var cfg = TIR_SETUPS[state.app];
    if (!cfg) { playError(); return; }
    state.dir = cfg.dir;
    state.m1 = cfg.m1;
    state.m2 = cfg.m2;
    if (cfg.apex) state.apex = cfg.apex;
    refreshMediaSelects();

    /* pick the angle from the geometry rather than hard-coding it, so it stays
       right if the media or the apex angle are edited afterwards */
    solve();
    var a = angSpec(), v;
    if (state.app === 'prism') {
      /* a prism stops transmitting BELOW i1min, not above it */
      v = (sol.iMin != null) ? deg(sol.iMin) - 12 : 20;
    } else {
      v = (sol.C != null) ? deg(sol.C) + 6 : a.max;
    }
    state.ang = parseFloat(clamp(v, a.min, a.max).toFixed(1));
    state.angFor[state.app] = state.ang;
    state.rows = [];
    syncControls();
    renderRows();
    setFired(true);
    playTIR();
  }

  /* ── 20. Unknown block — the experiment done properly ──────── */

  /* The sealed sample is a block sitting on the bench, so it can only be a
     solid — handing a student an unlabelled block of ethanol makes no sense. */
  var UNKNOWN_POOL = ['ice', 'quartz', 'perspex', 'crown', 'flint', 'sapphire', 'diamond'];

  function buildUnknownMaterials() {
    var sel = $('unk-material');
    if (sel.options.length > 1) return;
    var h = '<option value="">— choose a material —</option>', k;
    var sorted = UNKNOWN_POOL.slice().sort(function (a, b) { return medium(a).nd - medium(b).nd; });
    for (k = 0; k < sorted.length; k++) {
      h += '<option value="' + sorted[k] + '">' + medium(sorted[k]).name + '</option>';
    }
    sel.innerHTML = h;
  }

  function setUnknown(on) {
    state.unknown = !!on;
    if (on) {
      state.m1 = 'air';
      state.m2 = pick(UNKNOWN_POOL);
      state.trueUnknown = state.m2;
      if (state.app === 'depth') state.app = 'semi';
      $('unk-answer').value = '';
      $('unk-material').value = '';
      $('unk-feedback').textContent = '';
      $('unk-feedback').className = 'unk-feedback';
    } else {
      state.trueUnknown = null;
    }
    state.rows = [];
    state.fired = false; state.sweep = false;
    $('btn-unknown').classList.toggle('active', state.unknown);
    $('btn-unknown').setAttribute('aria-pressed', state.unknown ? 'true' : 'false');
    $('unknown-hint').classList.toggle('hidden', !state.unknown);
    $('unknown-box').classList.toggle('hidden', !state.unknown);
    buildUnknownMaterials();
    syncControls();
    renderRows();
    refresh();
  }

  function checkUnknown() {
    var fb = $('unk-feedback');
    var guess = parseFloat($('unk-answer').value);
    var matGuess = $('unk-material').value;
    if (isNaN(guess) || guess <= 0) {
      fb.className = 'unk-feedback err';
      fb.textContent = 'Enter the refractive index you measured from the gradient of your graph first.';
      playError();
      return;
    }
    var trueN = nOf(state.trueUnknown, 589.3);
    var err = (guess - trueN) / trueN * 100, mag = Math.abs(err);
    var cls = mag <= 1 ? 'ok' : mag <= 3 ? 'close' : 'err';
    var msg = (mag <= 1 ? '✓ ' : mag <= 3 ? '≈ ' : '✗ ') +
      'You measured <strong>n = ' + guess.toFixed(4) + '</strong>. The block was <strong>' +
      medium(state.trueUnknown).name + '</strong>, n = <strong>' + trueN.toFixed(4) + '</strong> — an error of ' +
      (err >= 0 ? '+' : '−') + mag.toFixed(2) + '%.';
    if (mag <= 1) msg += ' That is the precision a careful set of readings on a protractor can deliver.';
    else if (mag <= 3) msg += ' Close. Reading the protractor to the nearest degree is worth about 2% on a single point — take more angles and fit the line.';
    else msg += ' Well outside experimental error. The usual causes are measuring the angle from the surface instead of the normal, or plotting sin i against i.';
    if (matGuess) {
      msg += matGuess === state.trueUnknown
        ? ' <br>You identified the material correctly.'
        : ' <br>You named it as ' + medium(matGuess).name + ' (n = ' + medium(matGuess).nd.toFixed(3) + ').';
    }
    fb.className = 'unk-feedback ' + cls;
    fb.innerHTML = msg;
    if (mag <= 1) playSuccess(); else playError();
  }

  /* ── 21. Explore content ───────────────────────────────────── */

  var EXPLORE = {
    basics: [
      { t: 'What refraction is',
        b: 'Refraction is the change in direction of a wave when it crosses from one transparent medium into another. It happens because the wave travels at a different speed in each medium. Light slows down in glass or water, and the part of the wavefront that enters first is held back, swinging the whole front — and therefore the ray — round to a new direction.',
        f: 'v = c / n',
        e: 'Light travels at 3.00 × 10⁸ m/s in a vacuum but only 2.00 × 10⁸ m/s in crown glass (n = 1.50). Nothing about the light changes except its speed — and that is enough to bend it.' },
      { t: 'The words you must use precisely',
        b: '<strong>Normal</strong> — the construction line drawn perpendicular to the surface at the point where the ray strikes it. Every angle in optics is measured from this line, never from the surface. <strong>Angle of incidence (i)</strong> — between the incident ray and the normal. <strong>Angle of refraction (r)</strong> — between the refracted ray and the normal. <strong>Point of incidence</strong> — where the ray meets the boundary. <strong>Boundary</strong> or <strong>interface</strong> — the surface between the two media. <strong>Emergent ray</strong> — the ray after it has left the second medium.',
        e: 'The commonest single mistake in an optics exam is measuring an angle from the glass surface instead of from the normal. An angle of 30° from the surface is an angle of incidence of 60°.' },
      { t: 'Which way does the ray bend?',
        b: 'Into a denser medium (air → glass) the ray slows and bends <em>towards</em> the normal, so r &lt; i. Into a rarer medium (glass → air) it speeds up and bends <em>away</em> from the normal, so r &gt; i. A ray arriving along the normal (i = 0) is not bent at all, because no part of the wavefront reaches the boundary before any other — though it does still slow down.',
        e: 'Air → glass at 50°: r = 31.2°, bent towards the normal. Glass → air at 31.2°: r = 50°, bent away. Refraction is reversible — the path is identical in both directions.' },
      { t: 'Optical density is not mass density',
        b: 'A medium is <em>optically</em> denser when light travels more slowly through it, which is what a large refractive index means. It has nothing to do with how heavy the substance is. Ethanol is far less massive than water per unit volume, yet it is optically denser (n = 1.361 against 1.333) and bends light more.',
        e: 'Ice floats on water because it is less massive, yet it is also optically rarer, n = 1.31 against 1.333 — the two properties happen to agree here, but they need not.' }
    ],
    snell: [
      { t: 'Snell’s law',
        b: 'For any two media, the ratio sin i / sin r is a constant, and that constant is the relative refractive index. Written symmetrically, the quantity n sin θ has the same value on both sides of the boundary. This is the whole of refraction in one line, and it works in either direction.',
        f: 'n₁ sin i = n₂ sin r',
        e: 'Light in air (n₁ = 1.00) strikes water (n₂ = 1.333) at i = 40°. sin r = 1.00 × sin 40° / 1.333 = 0.482, so r = 28.8°.' },
      { t: 'Absolute and relative refractive index',
        b: 'The <strong>absolute</strong> refractive index of a medium is measured from a vacuum: n = c/v. The <strong>relative</strong> index for a pair of media is the ratio of their absolute indices, written ₁n₂ = n₂/n₁. Because air has n = 1.0003, an index measured from air is taken as absolute in school work.',
        f: '₁n₂ = n₂ / n₁ = v₁ / v₂ = λ₁ / λ₂ = sin i / sin r',
        e: 'Water to glass: ₁n₂ = 1.517 / 1.333 = 1.138. Light entering glass from water is bent much less than it would be entering from air.' },
      { t: 'The reversibility of light',
        b: 'Snell’s law is symmetric in the two media, so a ray retraces its own path exactly if it is sent back along the emergent direction. This is why ₁n₂ × ₂n₁ = 1, and why the same block gives the same index whichever face the light enters.',
        f: '₁n₂ = 1 / ₂n₁',
        e: 'Air to glass gives 1.50; glass to air gives 1/1.50 = 0.667. The reciprocal relationship is a useful check on a calculation.' },
      { t: 'What changes and what does not',
        b: 'Crossing a boundary, the <strong>speed</strong> and the <strong>wavelength</strong> both fall by the factor n. The <strong>frequency</strong> does not change — it is set by the source, and the boundary cannot create or destroy wave crests. Since the eye judges colour from frequency, a red laser stays red underwater.',
        f: 'f = v₁/λ₁ = v₂/λ₂   (unchanged)',
        e: '589 nm sodium light in water (n = 1.333) has λ = 442 nm — a wavelength the eye would call blue in air — yet it still looks yellow, because its frequency of 5.09 × 10¹⁴ Hz never changed.' }
    ],
    tir: [
      { t: 'The critical angle',
        b: 'Going from a denser to a rarer medium, the refracted ray bends away from the normal. As i grows, r reaches 90° first — the refracted ray grazes along the surface. The angle of incidence at which this happens is the <strong>critical angle</strong> C. Put r = 90° into Snell’s law and it drops straight out.',
        f: 'sin C = n₂ / n₁    (for n₁ > n₂)',
        e: 'Water to air: sin C = 1.00/1.333 = 0.750, so C = 48.6°. Crown glass to air: C = 41.3°. Diamond to air: C = 24.4°, which is why a cut diamond traps and returns so much light.' },
      { t: 'Total internal reflection',
        b: 'Beyond the critical angle Snell’s law has no solution: sin r would have to exceed 1. No light is transmitted at all and the boundary behaves as a perfect mirror. Two conditions must both hold — the light must be travelling in the denser medium, and the angle of incidence must exceed the critical angle.',
        e: 'Set the semicircular block to Glass → Air in the simulator and sweep the angle. The refracted ray dims and swings towards the surface, vanishes at 41.3°, and from then on the reflected ray carries all the energy.' },
      { t: 'Where it is used',
        b: 'Optical fibres guide light for kilometres by keeping every internal reflection beyond the critical angle of the core–cladding boundary. 45°–45°–90° prisms replace mirrors in binoculars and periscopes because total internal reflection loses no light to an imperfect silvered surface. Endoscopes, bicycle reflectors and the brilliance of a cut diamond all rely on it.',
        e: 'A silica fibre core (n = 1.4681) in cladding (n = 1.4629) has a critical angle of 85.2° — light must stay within 4.8° of the axis, which is why fibres are so thin.' },
      { t: 'Mirages and Snell’s window',
        b: 'Air near a hot road is less dense and optically rarer, so a nearly horizontal ray from the sky is refracted more and more until it is totally internally reflected upward — the observer sees sky on the road and reads it as water. Looking up from under water, the whole 180° of the sky is compressed into a bright cone of half-angle 48.6°; outside that cone the surface looks like a mirror. That cone is Snell’s window.',
        e: 'The apparent-depth apparatus shows the edge of Snell’s window directly: raise the viewing angle past 48.6° in water and the ray from the coin stops escaping.' }
    ],
    apparatus: [
      { t: 'The semicircular block',
        b: 'Its curved face is a circular arc centred on the mid-point of the flat face, so a ray aimed at that centre crosses the curved surface <em>along a radius</em> — at normal incidence — and is not bent there at all. Every bend happens at the flat face, at a single known point. That is why this block, and not a rectangular one, is used to measure a refractive index or a critical angle.',
        e: 'Flat face towards the lamp measures air → glass. Turn it round so the curved face faces the lamp and the same block measures glass → air, and shows the critical angle.' },
      { t: 'The rectangular block and lateral displacement',
        b: 'A parallel-sided block refracts the ray twice, towards the normal on the way in and away from it by the same amount on the way out. The emergent ray is therefore <strong>parallel to the incident ray</strong> but displaced sideways. The displacement grows with the thickness of the block and with the angle of incidence.',
        f: 'd = t sin(i − r) / cos r',
        e: 'A 40 mm crown-glass block at i = 60°: r = 34.8°, so d = 40 × sin(25.2°)/cos(34.8°) = 20.7 mm. At normal incidence d = 0 — no bend, no shift.' },
      { t: 'The prism and dispersion',
        b: 'A prism has two refracting faces inclined at the apex angle A, so the two bends add instead of cancelling and the ray is <strong>deviated</strong>. Because the refractive index of glass is slightly larger for short wavelengths, violet is deviated more than red and white light is spread into a spectrum. This is dispersion.',
        f: 'r₁ + r₂ = A,  D = i₁ + i₂ − A',
        e: 'Flint glass has n = 1.632 for violet and 1.615 for red. Through a 60° prism at minimum deviation that difference spreads the spectrum by about 1.7° — small, but enough to separate the colours completely a metre away.' },
      { t: 'Minimum deviation',
        b: 'As the angle of incidence on a prism is increased the deviation first falls, reaches a minimum, then rises again. At the minimum the ray passes symmetrically through the prism, with r₁ = r₂ = A/2. Measuring A and D<sub>min</sub> on a spectrometer is the most accurate laboratory method of finding a refractive index.',
        f: 'n = sin((A + D_min)/2) / sin(A/2)',
        e: 'A 60° prism with D_min = 38.9°: n = sin(49.45°)/sin(30°) = 0.760/0.500 = 1.520. Switch the graph to "Deviation curve" and the minimum is plainly visible.' },
      { t: 'Real and apparent depth',
        b: 'Rays from an object under water bend away from the normal as they leave the surface, so they diverge more steeply than they really did. Traced back, they appear to come from a point nearer the surface — the object looks raised. For near-vertical viewing the ratio of the two depths is exactly the refractive index.',
        f: 'n = real depth / apparent depth',
        e: 'A coin 80 mm down in water appears 80/1.333 = 60 mm down — raised by 20 mm. Viewed obliquely it rises further still, which is why a pool looks shallower from the side than from directly above.' }
    ],
    real: [
      { t: 'Why a pencil looks broken',
        b: 'Light from the submerged part of the pencil is refracted away from the normal as it leaves the water, so that part appears raised and shifted relative to the part in air. The eye receives two sets of rays that no longer line up, and reads the join as a break.',
        e: 'The effect vanishes if you look straight down the pencil along the normal, because then there is no bend at all.' },
      { t: 'Lenses are refraction, curved',
        b: 'A lens is a piece of glass whose two surfaces are curved, so that the angle of incidence — and therefore the amount of bending — is different at every height. A converging lens is thickest in the middle, deviating outer rays more than central ones and bringing them to a focus. Every lens formula rests on Snell’s law applied twice.',
        e: 'The lensmaker’s equation, 1/f = (n − 1)(1/R₁ − 1/R₂), contains the refractive index directly: put the same lens in water and its focal length lengthens, which is why swimming without goggles blurs vision.' },
      { t: 'Atmospheric refraction',
        b: 'Air density falls with altitude, so a ray from a star bends continuously as it descends. Everything in the sky appears slightly higher than it truly is, by about half a degree at the horizon. The Sun is fully below the horizon at the moment you see it set, and the same refraction is what makes stars twinkle as turbulent pockets of air act as moving lenses.',
        e: 'The angular diameter of the Sun is also about half a degree, so at sunset you see a Sun that is geometrically one full diameter below the horizon.' },
      { t: 'Rainbows',
        b: 'A raindrop refracts sunlight on entry, totally internally reflects it once at the back, and refracts it again on the way out. The combination gives a maximum concentration of light at 42° from the antisolar point, and because the refractive index of water depends on wavelength, that angle is 42.4° for red and 40.6° for violet. Hence the ordered arc of colours.',
        e: 'The fainter secondary bow, at 51°, involves two internal reflections — which is why its colours run the other way round.' },
      { t: 'Refractometry — measuring what is dissolved',
        b: 'The refractive index of a solution rises steadily with its concentration, so a hand refractometer that reads a critical angle can measure sugar in fruit juice, salinity in seawater, or the strength of engine coolant in seconds. The same principle grades honey, checks blood plasma protein and monitors cutting fluid on a machine shop floor.',
        e: 'A 20% sucrose solution has n = 1.3639 against 1.3330 for pure water — a difference of only 0.03, yet a refractometer reads it to three decimal places from the position of a shadow line.' }
    ]
  };

  function renderExplore(cat) {
    var list = EXPLORE[cat] || EXPLORE.basics, h = '', k;
    for (k = 0; k < list.length; k++) {
      var c = list[k];
      h += '<div class="explore-card"><h3>' + c.t + '</h3><p>' + c.b + '</p>';
      if (c.f) h += '<div class="ec-formula">' + c.f + '</div>';
      if (c.e) h += '<div class="ec-example"><strong>Worked example:</strong> ' + c.e + '</div>';
      h += '</div>';
    }
    $('explore-cards').innerHTML = h;
  }

  /* ── 22. Practice mode ─────────────────────────────────────── */

  var practice = { q: null, score: 0, total: 0, answered: false, sel: -1 };

  /* A question about "a block of ethanol" or "a prism of water" reads as
     careless even when the arithmetic is right, so each question type draws
     from the pool that physically fits the apparatus it describes. */
  var PRAC_SOLIDS  = ['ice', 'quartz', 'perspex', 'crown', 'flint', 'sapphire', 'diamond'];
  var PRAC_LIQUIDS = ['water', 'ethanol', 'glycerol'];
  var PRAC_PRISM   = ['quartz', 'perspex', 'crown', 'flint', 'sapphire'];
  var PRAC_ANY     = PRAC_SOLIDS.concat(PRAC_LIQUIDS);

  var PRAC_POOL = {
    snell_r: PRAC_SOLIDS,     /* "strikes a block of…" */
    snell_n: PRAC_SOLIDS,     /* "enters a transparent block" */
    lateral: PRAC_SOLIDS,     /* "a parallel-sided block" */
    prism:   PRAC_PRISM,      /* prisms are ground from optical glass */
    depth:   PRAC_LIQUIDS,    /* "a tank of…" */
    critical: PRAC_ANY,       /* any medium into air */
    speed:    PRAC_ANY,
    lambda:   PRAC_ANY,
    mcq_bend: PRAC_ANY,
    mcq_tir:  PRAC_ANY
  };

  function makeProblem() {
    var type = pick(['snell_r', 'snell_n', 'critical', 'speed', 'depth', 'lateral', 'lambda', 'prism', 'mcq_bend', 'mcq_tir']);
    var mId = pick(PRAC_POOL[type] || PRAC_ANY), m = medium(mId), n = m.nd;
    var i, r, t, d;

    if (type === 'snell_r') {
      i = rnd(15, 70, 0);
      r = deg(Math.asin(Math.sin(rad(i)) / n));
      return {
        text: 'A ray of light travelling in air strikes a block of <strong>' + m.name + '</strong> (n = ' +
          n.toFixed(3) + ') at an angle of incidence of <strong>' + i + '°</strong>. Calculate the angle of refraction.',
        ans: r, unit: '°', tol: 0.35,
        sol: 'n₁ sin i = n₂ sin r\n1.000 × sin ' + i + '° = ' + n.toFixed(3) + ' × sin r\n' +
          'sin r = ' + Math.sin(rad(i)).toFixed(4) + ' / ' + n.toFixed(3) + ' = ' + (Math.sin(rad(i)) / n).toFixed(4) + '\n' +
          'r = ' + r.toFixed(2) + '°\n\nThe ray bends towards the normal because it is entering an optically denser medium.'
      };
    }
    if (type === 'snell_n') {
      i = rnd(30, 75, 0);
      r = deg(Math.asin(Math.sin(rad(i)) / n));
      return {
        text: 'In a refraction experiment a ray enters a transparent block from air at an angle of incidence of <strong>' +
          i + '°</strong> and is refracted at <strong>' + r.toFixed(1) + '°</strong>. Calculate the refractive index of the block.',
        ans: n, unit: '', tol: 0.02,
        sol: 'n = sin i / sin r\nn = sin ' + i + '° / sin ' + r.toFixed(1) + '°\n' +
          'n = ' + Math.sin(rad(i)).toFixed(4) + ' / ' + Math.sin(rad(r)).toFixed(4) + ' = ' + n.toFixed(3) +
          '\n\nThe material is ' + m.name + '. Note that the index is a ratio and has no unit.'
      };
    }
    if (type === 'critical') {
      var C = deg(Math.asin(1 / n));
      return {
        text: 'Calculate the critical angle for light passing from <strong>' + m.name + '</strong> (n = ' +
          n.toFixed(3) + ') into air.',
        ans: C, unit: '°', tol: 0.35,
        sol: 'sin C = n₂ / n₁ = 1.000 / ' + n.toFixed(3) + ' = ' + (1 / n).toFixed(4) + '\n' +
          'C = ' + C.toFixed(2) + '°\n\nBeyond this angle the light is totally internally reflected. ' +
          'Remember that a critical angle exists only when the light starts in the denser medium.'
      };
    }
    if (type === 'speed') {
      var v = C0 / n / 1e8;
      return {
        text: 'The refractive index of <strong>' + m.name + '</strong> is ' + n.toFixed(3) +
          '. Calculate the speed of light in it, in units of 10⁸ m/s. (c = 3.00 × 10⁸ m/s)',
        ans: 3.00 / n, unit: '× 10⁸ m/s', tol: 0.02,
        sol: 'n = c / v, so v = c / n\nv = 3.00 × 10⁸ / ' + n.toFixed(3) + '\n' +
          'v = ' + (3.00 / n).toFixed(3) + ' × 10⁸ m/s\n\n' +
          'Light never travels faster than c; a refractive index below 1 for a transparent medium is impossible.'
      };
    }
    if (type === 'depth') {
      d = rnd(40, 150, 0);
      return {
        text: 'A coin lies at the bottom of a tank of <strong>' + m.name.toLowerCase() + '</strong> (n = ' + n.toFixed(3) +
          ') at a real depth of <strong>' + d + ' mm</strong>. Viewed from almost directly above, at what depth does it appear to be?',
        ans: d / n, unit: 'mm', tol: 1.0,
        sol: 'n = real depth / apparent depth\napparent = real / n = ' + d + ' / ' + n.toFixed(3) + '\n' +
          'apparent = ' + (d / n).toFixed(1) + ' mm\n\nThe coin appears raised by ' + (d - d / n).toFixed(1) +
          ' mm. The formula holds only for near-normal viewing.'
      };
    }
    if (type === 'lateral') {
      t = rnd(20, 70, 0);
      i = rnd(30, 70, 0);
      r = Math.asin(Math.sin(rad(i)) / n);
      d = t * Math.sin(rad(i) - r) / Math.cos(r);
      return {
        text: 'A ray strikes a parallel-sided block of <strong>' + m.name + '</strong> (n = ' + n.toFixed(3) +
          '), thickness <strong>' + t + ' mm</strong>, at an angle of incidence of <strong>' + i +
          '°</strong>. Calculate the lateral displacement of the emergent ray.',
        ans: d, unit: 'mm', tol: 0.7,
        sol: 'First find r:  sin r = sin ' + i + '° / ' + n.toFixed(3) + ' = ' + (Math.sin(rad(i)) / n).toFixed(4) +
          ',  r = ' + deg(r).toFixed(2) + '°\n' +
          'd = t sin(i − r) / cos r\n' +
          'd = ' + t + ' × sin(' + (i - deg(r)).toFixed(2) + '°) / cos(' + deg(r).toFixed(2) + '°)\n' +
          'd = ' + d.toFixed(2) + ' mm\n\nThe emergent ray is parallel to the incident ray — only its position has changed.'
      };
    }
    if (type === 'lambda') {
      var l0 = pick([450, 486, 546, 589, 633, 656]);
      return {
        text: 'Light of wavelength <strong>' + l0 + ' nm</strong> in air enters <strong>' + m.name +
          '</strong> (n = ' + n.toFixed(3) + '). Calculate its wavelength inside the medium.',
        ans: l0 / n, unit: 'nm', tol: 2.0,
        sol: 'The frequency is fixed by the source and does not change at a boundary.\n' +
          'v = fλ, and v falls by the factor n, so λ must fall by the same factor.\n' +
          'λ₂ = λ₀ / n = ' + l0 + ' / ' + n.toFixed(3) + ' = ' + (l0 / n).toFixed(1) + ' nm\n\n' +
          'The colour you see is unchanged, because the eye responds to frequency, not to wavelength in the medium.'
      };
    }
    if (type === 'prism') {
      var A = pick([45, 50, 55, 60, 65]);
      var i1 = rnd(35, 60, 0);
      var r1 = Math.asin(Math.sin(rad(i1)) / n);
      var r2 = rad(A) - r1;
      var s2 = n * Math.sin(r2);
      if (s2 > 1) { return makeProblem(); }
      var i2 = Math.asin(s2);
      var D = i1 + deg(i2) - A;
      return {
        text: 'A ray enters a <strong>' + A + '°</strong> prism made of <strong>' + m.name + '</strong> (n = ' +
          n.toFixed(3) + ') at an angle of incidence of <strong>' + i1 +
          '°</strong>. Calculate the angle of deviation D.',
        ans: D, unit: '°', tol: 0.6,
        sol: 'r₁ = sin⁻¹(sin ' + i1 + '° / ' + n.toFixed(3) + ') = ' + deg(r1).toFixed(2) + '°\n' +
          'r₂ = A − r₁ = ' + A + '° − ' + deg(r1).toFixed(2) + '° = ' + deg(r2).toFixed(2) + '°\n' +
          'i₂ = sin⁻¹(' + n.toFixed(3) + ' × sin ' + deg(r2).toFixed(2) + '°) = ' + deg(i2).toFixed(2) + '°\n' +
          'D = i₁ + i₂ − A = ' + i1 + '° + ' + deg(i2).toFixed(2) + '° − ' + A + '° = ' + D.toFixed(2) + '°\n\n' +
          'The identity r₁ + r₂ = A follows from the geometry of the triangle, not from Snell’s law.'
      };
    }
    if (type === 'mcq_bend') {
      var m2 = pick(PRAC_ANY.filter(function (x) { return x !== mId; }));
      var denser = medium(m2).nd > n;
      return {
        text: 'A ray of light travels from <strong>' + m.name + '</strong> (n = ' + n.toFixed(3) + ') into <strong>' +
          medium(m2).name + '</strong> (n = ' + medium(m2).nd.toFixed(3) + '). What happens to the ray at the boundary?',
        opts: [
          'It bends towards the normal and slows down',
          'It bends away from the normal and speeds up',
          'It bends towards the normal and speeds up',
          'It continues without bending at any angle of incidence'
        ],
        correct: denser ? 0 : 1,
        sol: medium(m2).name + ' is optically ' + (denser ? 'denser' : 'rarer') + ' than ' + m.name +
          ', so light ' + (denser ? 'slows down and bends towards' : 'speeds up and bends away from') +
          ' the normal.\n\nSpeed and bending direction always go together: slower means towards the normal, faster means away from it.'
      };
    }
    return {
      text: 'Under which conditions does <strong>total internal reflection</strong> occur?',
      opts: [
        'Light travels from a denser to a rarer medium and i exceeds the critical angle',
        'Light travels from a rarer to a denser medium and i exceeds the critical angle',
        'Light strikes any boundary at exactly 90° to the surface',
        'Light travels from a denser to a rarer medium at any angle of incidence'
      ],
      correct: 0,
      sol: 'Two conditions must hold together: the light must already be in the optically denser medium, and the angle of incidence must be greater than the critical angle.\n\n' +
        'Going the other way — rarer into denser — the ray bends towards the normal and can never reach 90°, so no critical angle exists at all.'
    };
  }

  function newProblem() {
    practice.q = makeProblem();
    practice.answered = false;
    practice.sel = -1;
    $('pq-text').innerHTML = practice.q.text;
    $('pq-feedback').className = 'feedback hidden';
    $('pq-solution').className = 'solution hidden';
    $('pq-solution').textContent = '';
    var isMcq = !!practice.q.opts;
    $('pq-input-row').className = isMcq ? 'pq-input-row hidden' : 'pq-input-row';
    $('pq-mcq').className = isMcq ? 'pq-mcq' : 'pq-mcq hidden';
    if (isMcq) {
      var h = '', k;
      for (k = 0; k < practice.q.opts.length; k++) {
        h += '<button class="pq-opt" data-opt="' + k + '">' + practice.q.opts[k] + '</button>';
      }
      $('pq-mcq').innerHTML = h;
    } else {
      $('pq-input').value = '';
      $('pq-unit').textContent = practice.q.unit || '';
      $('pq-input').focus();
    }
    playClick();
  }

  function checkProblem() {
    var p = practice.q, fb = $('pq-feedback');
    if (!p || practice.answered) return;
    var ok;
    if (p.opts) {
      if (practice.sel < 0) {
        fb.className = 'feedback err'; fb.textContent = 'Choose an option first.'; return;
      }
      ok = practice.sel === p.correct;
      var btns = $('pq-mcq').querySelectorAll('.pq-opt'), k;
      for (k = 0; k < btns.length; k++) {
        if (k === p.correct) btns[k].classList.add('correct');
        else if (k === practice.sel) btns[k].classList.add('wrong');
      }
    } else {
      var v = parseFloat($('pq-input').value);
      if (isNaN(v)) { fb.className = 'feedback err'; fb.textContent = 'Enter a number first.'; return; }
      ok = Math.abs(v - p.ans) <= p.tol;
    }
    practice.answered = true;
    practice.total++;
    if (ok) practice.score++;
    fb.className = 'feedback ' + (ok ? 'ok' : 'err');
    fb.textContent = ok ? '✓ Correct.'
      : '✗ Not quite — the answer is ' + (p.opts ? p.opts[p.correct]
        : p.ans.toFixed(p.unit === '' ? 3 : 2) + ' ' + p.unit) + '.';
    $('p-score').textContent = practice.score;
    $('p-total').textContent = practice.total;
    if (ok) playSuccess(); else playError();
    if (!ok) showSolution();
  }

  function showSolution() {
    if (!practice.q) return;
    $('pq-solution').className = 'solution';
    $('pq-solution').textContent = practice.q.sol;
  }

  /* ── 23. Quiz mode ─────────────────────────────────────────── */

  var QUIZ_SIZE = 5;
  var QUIZ_POOL = [
    { q: 'From which line is the angle of incidence always measured?',
      o: ['The normal to the surface', 'The refracting surface itself', 'The horizontal', 'The refracted ray'],
      a: 0, e: 'Every angle in refraction — incidence, reflection and refraction — is measured from the normal, the line drawn perpendicular to the surface at the point of incidence.' },
    { q: 'A ray passes from air into glass. Which statement is correct?',
      o: ['It slows down and bends towards the normal', 'It slows down and bends away from the normal',
          'It speeds up and bends towards the normal', 'Its frequency falls and its speed rises'],
      a: 0, e: 'Glass is optically denser, so the wave slows. A wave that slows on entering always bends towards the normal.' },
    { q: 'Which quantity is unchanged when light passes from air into water?',
      o: ['Frequency', 'Speed', 'Wavelength', 'Direction'],
      a: 0, e: 'Frequency is set by the source; the boundary cannot create or destroy wave crests. Speed and wavelength both fall by the factor n.' },
    { q: 'The critical angle for a glass–air boundary is 42°. What is the refractive index of the glass?',
      o: ['1.49', '0.67', '1.33', '2.24'],
      a: 0, e: 'sin C = 1/n, so n = 1/sin 42° = 1/0.669 = 1.49.' },
    { q: 'Total internal reflection can occur only when light travels…',
      o: ['from a denser to a rarer medium', 'from a rarer to a denser medium',
          'along the normal', 'through a vacuum'],
      a: 0, e: 'Going from rarer to denser the ray bends towards the normal and can never graze the surface, so no critical angle exists.' },
    { q: 'Light strikes a glass block along the normal (i = 0°). What happens?',
      o: ['It slows down but is not bent', 'It is bent towards the normal', 'It is totally internally reflected', 'It stops'],
      a: 0, e: 'At normal incidence every part of the wavefront reaches the boundary at the same instant, so there is nothing to swing the front round. The speed still falls.' },
    { q: 'A ray emerges from a rectangular glass block. Compared with the incident ray, the emergent ray is…',
      o: ['parallel but displaced sideways', 'deviated towards the base', 'reversed in direction', 'unchanged in position'],
      a: 0, e: 'The two refractions at parallel faces are equal and opposite, so the direction is restored. Only the position changes — the lateral displacement.' },
    { q: 'Which colour of white light is deviated most by a glass prism?',
      o: ['Violet', 'Red', 'Green', 'All are deviated equally'],
      a: 0, e: 'Refractive index rises as wavelength falls, so violet has the largest n and is bent most. Red has the smallest n and is bent least.' },
    { q: 'A coin at a real depth of 12 cm in water (n = 1.33) appears to be at a depth of…',
      o: ['9.0 cm', '16.0 cm', '12.0 cm', '6.0 cm'],
      a: 0, e: 'apparent = real / n = 12 / 1.33 = 9.0 cm. The coin appears raised by 3 cm.' },
    { q: 'Why is a semicircular block, rather than a rectangular one, used to measure a critical angle?',
      o: ['The ray crosses the curved face along a radius, so it is not refracted there',
          'The curved face reflects more light', 'It is easier to hold', 'It has a higher refractive index'],
      a: 0, e: 'A ray aimed at the centre of the flat face meets the curved surface at normal incidence, so all the bending happens at one known point.' },
    { q: 'The refractive index of a medium is 1.5. The speed of light in it is…',
      o: ['2.0 × 10⁸ m/s', '4.5 × 10⁸ m/s', '3.0 × 10⁸ m/s', '1.5 × 10⁸ m/s'],
      a: 0, e: 'v = c/n = 3.0 × 10⁸ / 1.5 = 2.0 × 10⁸ m/s. Light in a medium is always slower than in a vacuum.' },
    { q: 'Ethanol (n = 1.361) is much less massive per litre than water (n = 1.333). Which bends light more?',
      o: ['Ethanol, because it is optically denser', 'Water, because it is denser in mass',
          'Both bend light equally', 'Neither bends light'],
      a: 0, e: 'Optical density means a low speed of light, not a high mass density. The two properties are independent.' },
    { q: 'In an experiment, sin i is plotted against sin r for a glass block. The graph is…',
      o: ['a straight line through the origin whose gradient is n', 'a curve through the origin',
          'a straight line with a positive intercept', 'a horizontal line'],
      a: 0, e: 'Snell’s law, sin i = n sin r, has the form y = mx. The gradient is the refractive index and the line must pass through the origin.' },
    { q: 'Optical fibres carry light over long distances mainly by…',
      o: ['total internal reflection at the core–cladding boundary', 'reflection from a silvered outer coating',
          'dispersion', 'diffraction around the fibre'],
      a: 0, e: 'The core has a slightly higher index than the cladding, so light striking the boundary beyond the critical angle is reflected with no loss at all.' },
    { q: 'The Sun appears above the horizon when it is geometrically below it. This is because…',
      o: ['light from it is refracted by air of increasing density', 'the Sun is very large',
          'light is reflected by clouds', 'the atmosphere disperses sunlight'],
      a: 0, e: 'Air density rises towards the ground, so a ray from the Sun bends continuously downwards and appears to come from a higher point.' },
    { q: 'For a prism, the relationship between the internal angles and the apex angle is…',
      o: ['r₁ + r₂ = A', 'r₁ − r₂ = A', 'i₁ + i₂ = A', 'r₁ + r₂ = 2A'],
      a: 0, e: 'It follows from the geometry of the quadrilateral formed by the two normals and the two faces, and is independent of the refractive index.' }
  ];

  var quiz = { qs: [], idx: 0, score: 0, sel: -1, answered: false, log: [] };

  function shuffle(a) {
    var arr = a.slice(), i, j, t;
    for (i = arr.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* Options are shuffled per round so the correct answer is not always first. */
  function prepQuestion(src) {
    var order = shuffle([0, 1, 2, 3]), opts = [], k, correct = 0;
    for (k = 0; k < order.length; k++) {
      opts.push(src.o[order[k]]);
      if (order[k] === src.a) correct = k;
    }
    return { q: src.q, o: opts, a: correct, e: src.e };
  }

  function startQuiz() {
    quiz.qs = shuffle(QUIZ_POOL).slice(0, QUIZ_SIZE).map(prepQuestion);
    quiz.idx = 0; quiz.score = 0; quiz.log = [];
    $('quiz-result').className = 'quiz-result hidden';
    $('btn-start-quiz').className = 'btn btn-primary hidden';
    $('btn-submit-q').className = 'btn btn-primary';
    $('btn-next-q').className = 'btn btn-primary hidden';
    showQuizQuestion();
    playClick();
  }

  function showQuizQuestion() {
    var q = quiz.qs[quiz.idx], h = '', k;
    quiz.sel = -1; quiz.answered = false;
    $('qq-text').innerHTML = q.q;
    for (k = 0; k < q.o.length; k++) h += '<button class="qq-opt" data-opt="' + k + '">' + q.o[k] + '</button>';
    $('qq-options').innerHTML = h;
    $('qq-options').className = 'qq-options';
    $('qq-feedback').className = 'feedback hidden';
    $('quiz-counter').textContent = 'Question ' + (quiz.idx + 1) + ' of ' + QUIZ_SIZE;
    $('btn-submit-q').className = 'btn btn-primary';
    $('btn-next-q').className = 'btn btn-primary hidden';
  }

  function submitQuiz() {
    if (quiz.answered) return;
    var q = quiz.qs[quiz.idx], fb = $('qq-feedback');
    if (quiz.sel < 0) { fb.className = 'feedback err'; fb.textContent = 'Choose an option first.'; return; }
    quiz.answered = true;
    var ok = quiz.sel === q.a;
    if (ok) quiz.score++;
    quiz.log.push({ q: q.q, ok: ok, got: q.o[quiz.sel], right: q.o[q.a], why: q.e });
    var btns = $('qq-options').querySelectorAll('.qq-opt'), k;
    for (k = 0; k < btns.length; k++) {
      if (k === q.a) btns[k].classList.add('correct');
      else if (k === quiz.sel) btns[k].classList.add('wrong');
    }
    fb.className = 'feedback ' + (ok ? 'ok' : 'err');
    fb.textContent = (ok ? '✓ Correct. ' : '✗ Incorrect. ') + q.e;
    $('btn-submit-q').className = 'btn btn-primary hidden';
    $('btn-next-q').className = 'btn btn-primary';
    $('btn-next-q').textContent = (quiz.idx === QUIZ_SIZE - 1) ? 'See result' : 'Next';
    if (ok) playSuccess(); else playError();
  }

  function nextQuiz() {
    if (quiz.idx === QUIZ_SIZE - 1) { showQuizResult(); return; }
    quiz.idx++;
    showQuizQuestion();
  }

  function showQuizResult() {
    var pct = quiz.score / QUIZ_SIZE, stars = Math.max(1, Math.round(pct * 5));
    var cls = quiz.score === QUIZ_SIZE ? 'perfect' : quiz.score >= 3 ? 'good' : 'poor';
    var h = '<div class="qr-header"><div class="qr-score ' + cls + '">' + quiz.score + ' / ' + QUIZ_SIZE + '</div>' +
      '<div class="qr-stars">' + new Array(stars + 1).join('★') + new Array(6 - stars).join('☆') + '</div></div>' +
      '<div class="qr-rows">';
    var k;
    for (k = 0; k < quiz.log.length; k++) {
      var L = quiz.log[k];
      h += '<div class="qr-row ' + (L.ok ? 'ok' : 'err') + '"><strong>' + (k + 1) + '. ' + L.q + '</strong><br>' +
        (L.ok ? 'Correct — ' : 'You chose: ' + L.got + '<br>Correct answer: ' + L.right + '<br>') + L.why + '</div>';
    }
    h += '</div>';
    $('quiz-result').innerHTML = h;
    $('quiz-result').className = 'quiz-result';
    $('qq-options').className = 'qq-options hidden';
    $('qq-text').textContent = 'Round complete. Press Start Quiz for five new questions.';
    $('qq-feedback').className = 'feedback hidden';
    $('btn-next-q').className = 'btn btn-primary hidden';
    $('btn-start-quiz').className = 'btn btn-primary';
    $('quiz-counter').textContent = '5 questions per round';
    if (quiz.score === QUIZ_SIZE) playSuccess();
  }

  /* ─────────────────────────────────────────────────────────────
     24. Calculate mode — the arithmetic a student actually has to
     do after the experiment. Kept on this page so one URL owns
     both the simulator and the calculator intent.
     ───────────────────────────────────────────────────────────── */

  var CALC_FORMS = {
    snell: {
      intro: 'Snell\u2019s law solved for the angle of refraction. Enter the two refractive indices and the angle of incidence \u2014 both angles measured from the normal.',
      fields: [
        { k: 'n1', label: 'Refractive index of medium 1 (where the ray starts)', unit: '', def: 1.000 },
        { k: 'n2', label: 'Refractive index of medium 2', unit: '', def: 1.517 },
        { k: 'i',  label: 'Angle of incidence', unit: '\u00b0', def: 45 }
      ]
    },
    index: {
      intro: 'The experiment in reverse: you measured i and r on the protractor, and want the refractive index. This is what the gradient of a sin i against sin r graph gives you.',
      fields: [
        { k: 'n1', label: 'Refractive index of medium 1 (air = 1.000)', unit: '', def: 1.000 },
        { k: 'i',  label: 'Angle of incidence', unit: '\u00b0', def: 50 },
        { k: 'r',  label: 'Angle of refraction', unit: '\u00b0', def: 30.7 }
      ]
    },
    critical: {
      intro: 'The critical angle exists only when light travels from the optically denser medium into the rarer one. Enter the two indices with the denser one first.',
      fields: [
        { k: 'n1', label: 'Refractive index of the denser medium', unit: '', def: 1.517 },
        { k: 'n2', label: 'Refractive index of the rarer medium (air = 1.000)', unit: '', def: 1.000 }
      ]
    },
    depth: {
      intro: 'An object under a transparent medium appears raised. For near-vertical viewing the ratio of the real to the apparent depth is exactly the refractive index.',
      fields: [
        { k: 'n2',  label: 'Refractive index of the medium', unit: '', def: 1.333 },
        { k: 'dre', label: 'Real depth of the object', unit: 'mm', def: 80 }
      ]
    },
    lateral: {
      intro: 'A parallel-sided block returns the ray to its original direction but shifts it sideways. The shift grows with thickness and with the angle of incidence.',
      fields: [
        { k: 'n1', label: 'Refractive index outside the block', unit: '', def: 1.000 },
        { k: 'n2', label: 'Refractive index of the block', unit: '', def: 1.517 },
        { k: 'i',  label: 'Angle of incidence', unit: '\u00b0', def: 60 },
        { k: 't',  label: 'Thickness of the block', unit: 'mm', def: 40 }
      ]
    },
    prism: {
      intro: 'The spectrometer method: rotate the prism until the deviation is least, measure that angle, and the refractive index follows. This is the most accurate laboratory determination of n.',
      fields: [
        { k: 'A',  label: 'Apex (refracting) angle of the prism', unit: '\u00b0', def: 60 },
        { k: 'dm', label: 'Angle of minimum deviation', unit: '\u00b0', def: 38.9 }
      ]
    }
  };

  var calcState = { form: 'snell', vals: {} };

  function renderCalc() {
    var f = CALC_FORMS[calcState.form], h = '', k;
    $('calc-intro').textContent = f.intro;
    for (k = 0; k < f.fields.length; k++) {
      var fd = f.fields[k];
      var v = calcState.vals[calcState.form + '.' + fd.k];
      if (v === undefined) v = fd.def;
      h += '<div class="calc-field"><label for="cf-' + fd.k + '">' + fd.label + '</label>' +
        '<div class="cf-wrap"><input type="number" step="any" inputmode="decimal" id="cf-' + fd.k +
        '" data-k="' + fd.k + '" value="' + v + '">' +
        (fd.unit ? '<span class="cf-unit">' + fd.unit + '</span>' : '') + '</div></div>';
    }
    $('calc-inputs').innerHTML = h;
    var inputs = $('calc-inputs').querySelectorAll('input');
    for (k = 0; k < inputs.length; k++) {
      inputs[k].addEventListener('input', function () {
        calcState.vals[calcState.form + '.' + this.getAttribute('data-k')] = this.value;
        computeCalc();
      });
    }
    computeCalc();
  }

  function computeCalc() {
    var f = CALC_FORMS[calcState.form], v = {}, k;
    for (k = 0; k < f.fields.length; k++) {
      var el = $('cf-' + f.fields[k].k);
      v[f.fields[k].k] = el ? parseFloat(el.value) : NaN;
    }

    function fail(msg) {
      $('calc-result').innerHTML = '<div class="cr-label">Result</div><div class="cr-value bad">' + msg + '</div>';
      setMath($('calc-modal-body-2'), '<p>' + msg + '</p>');
    }
    function show(label, value, sub, steps) {
      $('calc-result').innerHTML = '<div class="cr-label">' + label + '</div><div class="cr-value">' + value +
        '</div>' + (sub ? '<div class="cr-sub">' + sub + '</div>' : '');
      setMath($('calc-modal-body-2'), steps);
    }

    if (calcState.form === 'snell') {
      if (!(v.n1 > 0) || !(v.n2 > 0)) return fail('Refractive indices must be positive.');
      if (!(v.i >= 0 && v.i <= 90)) return fail('The angle of incidence must be between 0° and 90°.');
      var sr = v.n1 * Math.sin(rad(v.i)) / v.n2;
      if (sr > 1) {
        return show('Angle of refraction', 'No refracted ray',
          'sin r would have to be ' + sr.toFixed(4) + ', which is impossible. The light is totally internally reflected. ' +
          'The critical angle here is ' + deg(Math.asin(v.n2 / v.n1)).toFixed(2) + '°.',
          '<div class="eq-line">\\[ \\sin r = \\frac{n_1\\sin i}{n_2} = ' + sr.toFixed(4) + ' > 1 \\]</div>' +
          '<p>No angle has a sine greater than 1, so Snell\u2019s law has no solution and total internal reflection occurs.</p>');
      }
      var rr = deg(Math.asin(sr));
      return show('Angle of refraction', rr.toFixed(2) + '°',
        (rr < v.i ? 'The ray bends towards the normal — medium 2 is optically denser.'
                  : 'The ray bends away from the normal — medium 2 is optically rarer.') +
        ' Relative index ₁n₂ = ' + (v.n2 / v.n1).toFixed(4) + '.',
        '<div class="eq-line">\\[ n_1 \\sin i = n_2 \\sin r \\]</div>' +
        '<div class="eq-line">\\[ \\sin r = \\frac{' + v.n1 + ' \\times \\sin ' + v.i + '^\\circ}{' + v.n2 + '} = ' +
        sr.toFixed(4) + ' \\]</div>' +
        '<div class="eq-line">\\[ r = \\sin^{-1}(' + sr.toFixed(4) + ') = ' + rr.toFixed(2) + '^\\circ \\]</div>');
    }

    if (calcState.form === 'index') {
      if (!(v.n1 > 0)) return fail('The first refractive index must be positive.');
      if (!(v.i > 0 && v.i < 90) || !(v.r > 0 && v.r < 90)) return fail('Both angles must be between 0° and 90°.');
      var n2 = v.n1 * Math.sin(rad(v.i)) / Math.sin(rad(v.r));
      var vel = C0 / n2;
      return show('Refractive index of medium 2', n2.toFixed(4),
        'Speed of light in it: ' + (vel / 1e8).toFixed(3) + ' × 10⁸ m/s. ' +
        'A 589 nm wave shortens to ' + (589 / n2).toFixed(1) + ' nm inside it.' +
        (n2 < 1 ? ' A value below 1 means you have the two angles the wrong way round.' : ''),
        '<div class="eq-line">\\[ n_2 = \\frac{n_1 \\sin i}{\\sin r} = \\frac{' + v.n1 + ' \\times \\sin ' + v.i +
        '^\\circ}{\\sin ' + v.r + '^\\circ} \\]</div>' +
        '<div class="eq-line">\\[ n_2 = \\frac{' + (v.n1 * Math.sin(rad(v.i))).toFixed(4) + '}{' +
        Math.sin(rad(v.r)).toFixed(4) + '} = ' + n2.toFixed(4) + ' \\]</div>' +
        '<div class="eq-line">\\[ v = \\frac{c}{n_2} = ' + (vel / 1e8).toFixed(3) + '\\times10^{8}\\ \\mathrm{m\\,s^{-1}} \\]</div>' +
        '<p>In the experiment this number is the gradient of the sin i against sin r graph, which uses every reading rather than just one pair.</p>');
    }

    if (calcState.form === 'critical') {
      if (!(v.n1 > 0) || !(v.n2 > 0)) return fail('Refractive indices must be positive.');
      if (v.n2 >= v.n1) {
        return show('Critical angle', 'None exists',
          'The second medium is not optically rarer than the first, so the ray always bends towards the normal ' +
          'and can never emerge along the surface. Swap the two values if you meant light leaving the denser medium.',
          '<p>A critical angle requires n₁ &gt; n₂. Here n₁ = ' + v.n1 + ' and n₂ = ' + v.n2 + '.</p>');
      }
      var C = deg(Math.asin(v.n2 / v.n1));
      return show('Critical angle C', C.toFixed(2) + '°',
        'At any angle of incidence greater than ' + C.toFixed(2) + '° the light is totally internally reflected ' +
        'and none of it crosses the boundary.',
        '<div class="eq-line">\\[ \\sin C = \\frac{n_2}{n_1} = \\frac{' + v.n2 + '}{' + v.n1 + '} = ' +
        (v.n2 / v.n1).toFixed(4) + ' \\]</div>' +
        '<div class="eq-line">\\[ C = \\sin^{-1}(' + (v.n2 / v.n1).toFixed(4) + ') = ' + C.toFixed(2) + '^\\circ \\]</div>' +
        '<p>Setting r = 90° in Snell\u2019s law is the whole derivation: n₁ sin C = n₂ sin 90° = n₂.</p>');
    }

    if (calcState.form === 'depth') {
      if (!(v.n2 > 0)) return fail('The refractive index must be positive.');
      if (!(v.dre > 0)) return fail('The real depth must be positive.');
      var dap = v.dre / v.n2;
      return show('Apparent depth', dap.toFixed(2) + ' mm',
        'The object appears raised by ' + (v.dre - dap).toFixed(2) + ' mm. ' +
        'This near-normal result is what the standard formula gives; viewed obliquely the object rises further still.',
        '<div class="eq-line">\\[ n = \\frac{\\text{real depth}}{\\text{apparent depth}} \\]</div>' +
        '<div class="eq-line">\\[ d_{app} = \\frac{d_{real}}{n} = \\frac{' + v.dre + '}{' + v.n2 + '} = ' +
        dap.toFixed(2) + '\\ \\mathrm{mm} \\]</div>' +
        '<div class="eq-line">\\[ \\text{apparent shift} = d_{real}\\left(1 - \\frac{1}{n}\\right) = ' +
        (v.dre - dap).toFixed(2) + '\\ \\mathrm{mm} \\]</div>');
    }

    if (calcState.form === 'lateral') {
      if (!(v.n1 > 0) || !(v.n2 > 0)) return fail('Refractive indices must be positive.');
      if (!(v.i >= 0 && v.i < 90)) return fail('The angle of incidence must be between 0° and 90°.');
      if (!(v.t > 0)) return fail('The thickness must be positive.');
      var srl = v.n1 * Math.sin(rad(v.i)) / v.n2;
      if (srl > 1) return fail('The ray cannot enter the block at this angle — it is totally internally reflected.');
      var rl = Math.asin(srl);
      var d = v.t * Math.sin(rad(v.i) - rl) / Math.cos(rl);
      return show('Lateral displacement d', d.toFixed(3) + ' mm',
        'Angle of refraction inside the block: ' + deg(rl).toFixed(2) + '°. The emergent ray leaves at ' + v.i +
        '° — the same as the incident ray — so the direction is restored and only the position has moved.',
        '<div class="eq-line">\\[ \\sin r = \\frac{' + v.n1 + '\\sin ' + v.i + '^\\circ}{' + v.n2 + '} = ' +
        srl.toFixed(4) + ',\\quad r = ' + deg(rl).toFixed(2) + '^\\circ \\]</div>' +
        '<div class="eq-line">\\[ d = \\frac{t\\,\\sin(i-r)}{\\cos r} = \\frac{' + v.t + '\\sin(' +
        (v.i - deg(rl)).toFixed(2) + '^\\circ)}{\\cos ' + deg(rl).toFixed(2) + '^\\circ} \\]</div>' +
        '<div class="eq-line">\\[ d = ' + d.toFixed(3) + '\\ \\mathrm{mm} \\]</div>');
    }

    /* prism minimum deviation */
    if (!(v.A > 0 && v.A < 90)) return fail('The apex angle must be between 0° and 90°.');
    if (!(v.dm >= 0)) return fail('The minimum deviation must be zero or more.');
    var num = Math.sin(rad((v.A + v.dm) / 2)), den = Math.sin(rad(v.A / 2));
    if (den < 1e-9) return fail('The apex angle is too small.');
    var np = num / den;
    return show('Refractive index of the prism', np.toFixed(4),
      'At minimum deviation the ray passes symmetrically, so r₁ = r₂ = A/2 = ' + (v.A / 2).toFixed(1) + '° and ' +
      'i₁ = i₂ = (A + D)/2 = ' + ((v.A + v.dm) / 2).toFixed(2) + '°. Speed of light inside: ' +
      (C0 / np / 1e8).toFixed(3) + ' × 10⁸ m/s.',
      '<div class="eq-line">\\[ n = \\frac{\\sin\\!\\left(\\dfrac{A + D_{min}}{2}\\right)}{\\sin\\!\\left(\\dfrac{A}{2}\\right)} \\]</div>' +
      '<div class="eq-line">\\[ n = \\frac{\\sin ' + ((v.A + v.dm) / 2).toFixed(2) + '^\\circ}{\\sin ' +
      (v.A / 2).toFixed(2) + '^\\circ} = \\frac{' + num.toFixed(4) + '}{' + den.toFixed(4) + '} = ' + np.toFixed(4) + ' \\]</div>' +
      '<p>Because the passage is symmetric, small errors in aligning the prism cancel to first order &mdash; which is exactly why this method is so accurate.</p>');
  }

  /* ── 25. Export ────────────────────────────────────────────── */

  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(canvas, 0, 0);
    var fs = Math.round(tmp.width * 0.018); if (fs < 11) fs = 11;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.28)';
    tc.fillText('NHIT VisualLab', tmp.width - 14, tmp.height - 10);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'refraction_' + state.app + '_' + state.m2 + '.png';
    a.click();
  }

  function exportCSV() {
    var rows = ['Reading,Angle of incidence i (deg),Angle of refraction r (deg),sin i,sin r,sin i / sin r,Note'];
    var k;
    for (k = 0; k < state.rows.length; k++) {
      var row = state.rows[k];
      if (row.tir) { rows.push((k + 1) + ',' + row.i.toFixed(1) + ',,,,,total internal reflection'); continue; }
      var si = Math.sin(rad(row.i)), sr = Math.sin(rad(row.r));
      rows.push((k + 1) + ',' + row.i.toFixed(1) + ',' + row.r.toFixed(1) + ',' + si.toFixed(5) + ',' +
        sr.toFixed(5) + ',' + (sr > 1e-6 ? (si / sr).toFixed(4) : '') + ',' + row.app);
    }
    if (!state.rows.length) {
      rows.push('1,' + state.ang.toFixed(1) + ',' + (sol.r === null ? '' : deg(sol.r).toFixed(1)) +
        ',,,,current reading (not recorded)');
    }
    var fit = bestFitN();
    rows.push('');
    rows.push('Medium 1,' + medium(state.m1).name + ',n,' + sol.n1.toFixed(4));
    rows.push('Medium 2,' + mediumLabel(state.m2) + ',n,' + (state.unknown ? 'concealed' : sol.n2.toFixed(4)));
    rows.push('Wavelength (nm),' + sol.wl);
    if (fit) rows.push('Best-fit gradient (measured n),' + fit.n.toFixed(4));
    var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a2 = document.createElement('a');
    a2.href = url; a2.download = 'refraction_readings.csv'; a2.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ── 26. Printable lab report ──────────────────────────────── */

  function hasExperiment() { return state.rows.length > 0; }

  function updateReportBtns() {
    var on = hasExperiment(), k;
    var btns = [$('btn-report'), $('btn-report-dock')];
    for (k = 0; k < btns.length; k++) {
      if (!btns[k]) continue;
      btns[k].disabled = !on;
      btns[k].title = on ? 'Export a printable A4 lab report and save it as PDF'
        : 'Record at least one reading before exporting a report';
    }
  }

  function escapeHtml(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* The on-screen graph is dark and prints as a black slab. Re-render the
     sin i / sin r plot light, on a private canvas. */
  function buildReportGraph() {
    var Wr = 900, Hr = 640, k;
    var c = document.createElement('canvas');
    c.width = Wr; c.height = Hr;
    var x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, Wr, Hr);
    var pad = { l: 92, r: 40, t: 58, b: 72 };
    var pw = Wr - pad.l - pad.r, ph = Hr - pad.t - pad.b;
    var PX = function (v) { return pad.l + v * pw; };
    var PY = function (v) { return pad.t + ph - v * ph; };

    x.fillStyle = '#0d47a1';
    x.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    x.textAlign = 'center';
    x.fillText('sin i against sin r', Wr / 2, 30);
    x.fillStyle = '#37474f'; x.font = '13px "Segoe UI", system-ui, sans-serif';
    x.fillText(medium(state.m1).name + '  →  ' + mediumLabel(state.m2) + '   ·   λ₀ = ' + sol.wl + ' nm', Wr / 2, 50);

    x.strokeStyle = '#cfd8dc'; x.lineWidth = 0.8;
    x.fillStyle = '#455a64'; x.font = '12px "Courier New", monospace';
    for (k = 0; k <= 10; k++) {
      var t = k / 10;
      x.beginPath(); x.moveTo(PX(t), pad.t); x.lineTo(PX(t), pad.t + ph); x.stroke();
      x.beginPath(); x.moveTo(pad.l, PY(t)); x.lineTo(pad.l + pw, PY(t)); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'top';
      x.fillText(t.toFixed(1), PX(t), pad.t + ph + 8);
      x.textAlign = 'right'; x.textBaseline = 'middle';
      x.fillText(t.toFixed(1), pad.l - 10, PY(t));
    }
    x.strokeStyle = '#37474f'; x.lineWidth = 1.4;
    x.beginPath();
    x.moveTo(pad.l, pad.t); x.lineTo(pad.l, pad.t + ph); x.lineTo(pad.l + pw, pad.t + ph); x.stroke();
    x.fillStyle = '#37474f'; x.font = '600 14px "Segoe UI", system-ui, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.fillText('sin r', pad.l + pw / 2, Hr - 22);
    x.save(); x.translate(28, pad.t + ph / 2); x.rotate(-Math.PI / 2);
    x.textBaseline = 'middle'; x.fillText('sin i', 0, 0); x.restore();

    var fit = bestFitN();
    if (fit) {
      var xe = Math.min(1, 1 / fit.n);
      x.strokeStyle = '#2e7d32'; x.lineWidth = 2.4;
      x.beginPath(); x.moveTo(PX(0), PY(0)); x.lineTo(PX(xe), PY(fit.n * xe)); x.stroke();
      x.fillStyle = '#2e7d32'; x.font = '600 14px "Segoe UI", system-ui, sans-serif';
      x.textAlign = 'left';
      x.fillText('best-fit gradient  n = ' + fit.n.toFixed(4), pad.l + 18, pad.t + 26);
    }
    for (k = 0; k < state.rows.length; k++) {
      var row = state.rows[k];
      if (row.tir) continue;
      var px = PX(Math.sin(rad(row.r))), py = PY(Math.sin(rad(row.i)));
      x.fillStyle = '#c62828';
      x.beginPath(); x.arc(px, py, 5, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#7f0000'; x.lineWidth = 1; x.stroke();
    }
    x.strokeStyle = '#b0bec5'; x.lineWidth = 1;
    x.strokeRect(pad.l, pad.t, pw, ph);
    return c.toDataURL('image/png');
  }

  function exportReport() {
    if (!hasExperiment()) { playError(); return; }
    var now = new Date();
    var dateStr = now.toISOString().slice(0, 10), timeStr = now.toTimeString().slice(0, 5);
    var reportNo = 'REF-' + dateStr.replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);
    var fit = bestFitN();
    var trueN = sol.nRel;
    var err = fit ? (fit.n - trueN) / trueN * 100 : null;

    var rowsHtml = '', k;
    for (k = 0; k < state.rows.length; k++) {
      var row = state.rows[k];
      if (row.tir) {
        rowsHtml += '<tr><td>' + (k + 1) + '</td><td>' + row.i.toFixed(1) +
          '</td><td colspan="4">total internal reflection — no refracted ray</td></tr>';
      } else {
        var si = Math.sin(rad(row.i)), sr = Math.sin(rad(row.r));
        rowsHtml += '<tr><td>' + (k + 1) + '</td><td>' + row.i.toFixed(1) + '</td><td>' + row.r.toFixed(1) +
          '</td><td>' + si.toFixed(4) + '</td><td>' + sr.toFixed(4) + '</td><td><b>' +
          (sr > 1e-6 ? (si / sr).toFixed(3) : '—') + '</b></td></tr>';
      }
    }

    var verdict, vClass;
    if (!fit) {
      verdict = 'Fewer than two usable readings were recorded, so no gradient could be fitted. ' +
        'Take readings at six or seven angles spread from 10° to 80°.';
      vClass = 'neutral';
    } else if (Math.abs(err) <= 1) {
      verdict = 'The measured index of ' + fit.n.toFixed(4) + ' agrees with the accepted value of ' +
        trueN.toFixed(4) + ' to within ' + Math.abs(err).toFixed(2) + '%. This is the precision a careful ' +
        'protractor measurement can deliver.'; vClass = 'ok';
    } else if (Math.abs(err) <= 3) {
      verdict = 'The measured index of ' + fit.n.toFixed(4) + ' differs from the accepted value of ' +
        trueN.toFixed(4) + ' by ' + Math.abs(err).toFixed(2) + '%. Reading an angle to the nearest degree is ' +
        'worth roughly 2% on a single point; more readings would tighten the fit.'; vClass = 'warn';
    } else {
      verdict = 'The measured index of ' + fit.n.toFixed(4) + ' differs from the accepted value of ' +
        trueN.toFixed(4) + ' by ' + Math.abs(err).toFixed(2) + '%, which is outside normal experimental error. ' +
        'The usual causes are measuring an angle from the surface instead of the normal, or fitting a line ' +
        'that does not pass through the origin.'; vClass = 'bad';
    }

    var img = buildReportGraph();
    var APPN = { semi: 'Semicircular block', slab: 'Rectangular (parallel-sided) block',
                 prism: 'Triangular prism', depth: 'Real and apparent depth' };

    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<title>Refraction Report — ' + reportNo + '</title><style>' +
      '@page { size: A4; margin: 14mm 16mm; }' +
      '* { box-sizing: border-box; }' +
      'body { font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif; color:#111; margin:0; font-size:10.5pt; line-height:1.45; }' +
      '.report { max-width:190mm; margin:0 auto; }' +
      '.hd { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:3px solid #0e7490; padding-bottom:10px; margin-bottom:14px; }' +
      '.hd-l h1 { margin:0; font-size:18pt; color:#0e5567; letter-spacing:.3px; }' +
      '.hd-l .sub { margin-top:2px; font-size:9.5pt; color:#444; }' +
      '.hd-r { text-align:right; font-size:9pt; color:#333; }' +
      '.hd-r .rno { font-weight:700; color:#0e5567; font-size:11pt; }' +
      'h2 { font-size:11pt; color:#0e5567; margin:16px 0 6px; border-bottom:1px solid #b0bec5; padding-bottom:2px; text-transform:uppercase; letter-spacing:.4px; }' +
      'table { width:100%; border-collapse:collapse; margin-bottom:6px; font-size:10pt; }' +
      'th,td { text-align:left; padding:5px 9px; border-bottom:1px solid #e0e6ed; }' +
      'th { background:#eceff1; color:#37474f; font-weight:600; }' +
      '.kv th { width:46%; }' +
      'td { font-variant-numeric:tabular-nums; }' +
      '.two-col { display:grid; grid-template-columns:1fr 1fr; gap:0 18px; }' +
      '.results-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:6px; }' +
      '.kpi { border:1px solid #cfd8dc; padding:8px 10px; border-radius:4px; background:#f5f7fa; }' +
      '.kpi .lbl { font-size:8pt; color:#546e7a; text-transform:uppercase; letter-spacing:.5px; font-weight:600; }' +
      '.kpi .val { font-size:13.5pt; font-weight:700; color:#0e5567; font-variant-numeric:tabular-nums; }' +
      '.kpi .unit { font-size:9pt; color:#37474f; margin-left:2px; }' +
      '.curve-wrap { margin-top:8px; border:1px solid #cfd8dc; padding:6px; background:#fafbfc; }' +
      '.curve-wrap img { width:100%; height:auto; display:block; }' +
      '.verdict { margin-top:10px; padding:10px 14px; font-size:10pt; border-left:4px solid #0e7490; background:#e0f7fa; }' +
      '.verdict.ok { border-left-color:#2e7d32; background:#e8f5e9; }' +
      '.verdict.warn { border-left-color:#ef6c00; background:#fff3e0; }' +
      '.verdict.bad { border-left-color:#c62828; background:#ffebee; }' +
      '.calc { background:#fafbfc; border:1px solid #e0e6ed; border-radius:4px; padding:10px 14px; font-family:"Courier New",monospace; font-size:9.5pt; line-height:1.9; }' +
      '.note { font-size:9pt; color:#546e7a; margin-top:6px; }' +
      '.sign-row { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:22px; }' +
      '.sign-box { border-top:1px solid #455a64; padding-top:4px; font-size:9pt; color:#37474f; }' +
      '.foot { margin-top:16px; padding-top:8px; border-top:1px solid #b0bec5; font-size:8.5pt; color:#546e7a; display:flex; justify-content:space-between; }' +
      '.bar { background:#0e5567; color:#fff; padding:14px 18px; text-align:center; font-size:11pt; }' +
      '.bar button { background:#fff; color:#0e5567; border:0; padding:7px 18px; font-weight:700; border-radius:4px; cursor:pointer; margin:0 6px; }' +
      '@media print { .no-print { display:none !important; } }' +
      '</style></head><body>' +
      '<div class="bar no-print">Use your browser&rsquo;s print dialog (Ctrl/Cmd + P) to <b>Save as PDF</b>.' +
      '<button onclick="window.print()">Print / Save as PDF</button>' +
      '<button onclick="window.close()">Close</button></div>' +
      '<div class="report">' +
      '<div class="hd"><div class="hd-l"><h1>Refraction of Light &mdash; Laboratory Report</h1>' +
      '<div class="sub">Determination of refractive index by measurement of angles of incidence and refraction</div></div>' +
      '<div class="hd-r"><div class="rno">Report No. ' + reportNo + '</div><div>Date: ' + dateStr +
      '</div><div>Time: ' + timeStr + '</div><div>Lab: NHIT VisualLab Virtual Optics</div></div></div>' +

      '<h2>1. Apparatus &amp; Conditions</h2><div class="two-col">' +
      '<table class="kv">' +
      '<tr><th>Arrangement</th><td>' + escapeHtml(APPN[state.app] || state.app) + '</td></tr>' +
      '<tr><th>Medium 1 (incident side)</th><td>' + escapeHtml(medium(sol.idA).name) + ', n = ' + sol.n1.toFixed(4) + '</td></tr>' +
      '<tr><th>Medium 2 (refracting into)</th><td>' + escapeHtml(mediumLabel(sol.idB)) + ', n = ' +
        (state.unknown ? '<b>concealed</b>' : sol.n2.toFixed(4)) + '</td></tr>' +
      '</table><table class="kv">' +
      '<tr><th>Wavelength in vacuum</th><td>' + sol.wl + ' nm</td></tr>' +
      '<tr><th>Accepted relative index ₁n₂</th><td>' + (state.unknown ? '<b>to be determined</b>' : trueN.toFixed(4)) + '</td></tr>' +
      '<tr><th>Critical angle (medium 2 → 1)</th><td>' +
        (state.unknown ? '?' : (critical(sol.n2, sol.n1) === null ? 'none' : deg(critical(sol.n2, sol.n1)).toFixed(2) + '°')) + '</td></tr>' +
      '</table></div>' +

      '<h2>2. Readings</h2>' +
      '<table><thead><tr><th>No.</th><th>i / °</th><th>r / °</th><th>sin i</th><th>sin r</th><th>sin i / sin r</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody></table>' +
      '<div class="note">Angles are measured from the normal to the refracting surface. A protractor read to the nearest ' +
      'degree carries an uncertainty of about ±0.5°, which is why the index is taken from the gradient of a graph ' +
      'rather than from any single pair of readings.</div>' +

      '<h2>3. Results</h2><div class="results-grid">' +
      '<div class="kpi"><div class="lbl">Readings taken</div><div class="val">' + state.rows.length + '</div></div>' +
      '<div class="kpi"><div class="lbl">Usable points</div><div class="val">' + (fit ? fit.count : 0) + '</div></div>' +
      '<div class="kpi"><div class="lbl">Measured n</div><div class="val">' + (fit ? fit.n.toFixed(4) : '—') + '</div></div>' +
      '<div class="kpi"><div class="lbl">Deviation</div><div class="val">' +
        (err == null ? '—' : (err >= 0 ? '+' : '−') + Math.abs(err).toFixed(2)) + '<span class="unit">%</span></div></div>' +
      '</div>' +

      '<h2>4. Analysis</h2><div class="calc">' +
      'Snell&rsquo;s law:  n₁ sin i = n₂ sin r<br>' +
      'Rearranged for a graph:  sin i = (n₂/n₁) × sin r&nbsp;&nbsp;&mdash; of the form y = mx<br>' +
      'Gradient m fitted through the origin:  m = Σ(x·y) / Σ(x²), with x = sin r and y = sin i<br>' +
      '<b>Measured refractive index ₁n₂ = ' + (fit ? fit.n.toFixed(4) : '—') + '</b><br>' +
      (fit ? 'Speed of light in medium 2:  v = c/n = ' + (C0 / (fit.n * sol.n1) / 1e8).toFixed(3) + ' × 10⁸ m/s' : '') +
      '</div>' +
      '<div class="note">The line is forced through the origin because zero incidence must give zero refraction; ' +
      'a fitted intercept would be a systematic error in the protractor, not physics.</div>' +

      '<h2>5. Graph</h2><div class="curve-wrap"><img src="' + img + '" alt="sin i against sin r"></div>' +

      '<h2>6. Conclusion</h2>' +
      '<div class="verdict ' + vClass + '">' + escapeHtml(verdict) + '</div>' +
      '<div class="note">Model assumptions: monochromatic light at ' + sol.wl + ' nm, dispersion from a two-term Cauchy fit, ' +
      'plane boundaries, and no absorption. Reflection at each surface follows the Fresnel equations for unpolarised light.</div>' +

      '<div class="sign-row"><div class="sign-box">Student ___________________________</div>' +
      '<div class="sign-box">Checked by ___________________________</div></div>' +

      '<div class="foot"><div>Generated by NHIT VisualLab Virtual Optics &middot; NHIT VisualLab</div>' +
      '<div>Refractive indices quoted at the sodium D line, 589.3 nm</div></div>' +
      '</div>' +
      '<' + 'script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},400);});</' + 'script>' +
      '</body></html>';

    var win = window.open('', '_blank', 'width=920,height=1100');
    if (!win) { alert('Pop-up blocked. Allow pop-ups for this site to export the report.'); return; }
    win.document.open(); win.document.write(html); win.document.close();
  }

  /* ── 27. Control synchronisation ───────────────────────────── */

  function angSpec() {
    /* 55° clears water's 48.6° critical angle with room to spare, and still
       keeps the emerging ray inside the tank at the deepest setting. */
    if (state.app === 'depth') return { label: 'Viewing angle', min: 0, max: 55, unit: '°' };
    if (state.app === 'prism') return { label: 'Angle of incidence', min: 0, max: 80, unit: '°' };
    return { label: 'Angle of incidence', min: 0, max: 89, unit: '°' };
  }

  function auxSpec() {
    if (state.app === 'slab') return { key: 'thick', label: 'Block thickness', min: 10, max: 90, step: 1, unit: 'mm' };
    if (state.app === 'prism') return { key: 'apex', label: 'Apex angle A', min: 30, max: 75, step: 1, unit: '°' };
    if (state.app === 'depth') return { key: 'realDepth', label: 'Real depth', min: 20, max: 120, step: 1, unit: 'mm' };
    return null;
  }

  function setPills(id, value) {
    var box = $(id); if (!box) return;
    var ps = box.querySelectorAll('.pill'), k;
    for (k = 0; k < ps.length; k++) {
      ps[k].classList.toggle('active', ps[k].getAttribute('data-value') === value);
    }
  }

  var KIND_LABEL = { gas: 'Gases', liquid: 'Liquids', solid: 'Solids' };

  function fillSelect(sel, list, value) {
    var h = '', k, group = null;
    for (k = 0; k < list.length; k++) {
      var m = list[k];
      if (m.id === 'custom') continue;
      if (m.kind !== group) {
        if (group) h += '</optgroup>';
        group = m.kind;
        h += '<optgroup label="' + KIND_LABEL[group] + '">';
      }
      h += '<option value="' + m.id + '">' + m.name + '  (n = ' + m.nd.toFixed(3) + ')</option>';
    }
    if (group) h += '</optgroup>';
    h += '<option value="custom">Custom medium\u2026</option>';
    sel.innerHTML = h;
    sel.value = value;
  }

  /* Rebuilt whenever the apparatus changes, snapping the selection to a
     sensible default if what was chosen is no longer a legal material. */
  function refreshMediaSelects() {
    ['m1', 'm2'].forEach(function (slot) {
      var list = mediaFor(slot), sel = $(slot + '-sel'), k, ok = false;
      for (k = 0; k < list.length; k++) if (list[k].id === state[slot]) { ok = true; break; }
      if (!ok) state[slot] = defaultMedium(slot);
      var sig = list.map(function (m) { return m.id; }).join(',');
      if (sel.getAttribute('data-sig') !== sig) {
        fillSelect(sel, list, state[slot]);
        sel.setAttribute('data-sig', sig);
      }
      sel.value = state[slot];
    });
  }

  function syncControls() {
    var s = state;
    setPills('app-tabs', s.app);
    setPills('dir-tabs', s.dir);

    $('dir-group').classList.toggle('hidden', s.app !== 'semi');

    /* angle of incidence */
    var a = angSpec();
    $('ang-label').textContent = a.label;
    $('ang-slider').min = a.min; $('ang-slider').max = a.max;
    $('ang-step').min = a.min; $('ang-step').max = a.max;
    s.ang = clamp(s.ang, a.min, a.max);
    $('ang-slider').value = s.ang;
    $('ang-step').value = s.ang;
    $('ang-val').textContent = s.ang.toFixed(1) + a.unit;

    /* the apparatus-specific second control */
    var x = auxSpec();
    $('aux-group').classList.toggle('hidden', !x);
    if (x) {
      $('aux-label').textContent = x.label;
      $('aux-slider').min = x.min; $('aux-slider').max = x.max; $('aux-slider').step = x.step;
      $('aux-step').min = x.min; $('aux-step').max = x.max;
      s[x.key] = clamp(s[x.key], x.min, x.max);
      $('aux-slider').value = s[x.key];
      $('aux-step').value = s[x.key];
      $('aux-val').textContent = s[x.key] + ' ' + x.unit;
    }

    /* wavelength */
    $('wl-slider').value = s.wl;
    $('wl-step').value = s.wl;
    $('wl-val').textContent = s.wl + ' nm';
    $('wl-slider').disabled = s.white;
    $('wl-step').disabled = s.white;
    $('wl-group').classList.toggle('locked', s.white);
    $('btn-white').classList.toggle('active', s.white);
    $('btn-white').setAttribute('aria-pressed', s.white ? 'true' : 'false');

    /* media */
    refreshMediaSelects();
    $('m1-sel').disabled = s.unknown;
    $('m2-sel').disabled = s.unknown;
    $('btn-tir').disabled = s.unknown;
    $('btn-tir').title = s.unknown
      ? 'Unseal the sample first — the preset has to choose the media'
      : 'Set this bench up to show total internal reflection: ' + (TIR_SETUPS[s.app] || {}).note;
    $('custom-group').classList.toggle('hidden', !(s.m1 === 'custom' || s.m2 === 'custom') || s.unknown);
    $('custom-n').value = s.customN;
    $('m2-label').textContent = s.app === 'depth' ? 'Liquid'
      : s.app === 'prism' ? 'Prism' : 'Block';
    $('m1-label').textContent = s.app === 'depth' ? 'Above' : 'Surrounding';

    /* display + graph chips */
    var chips = document.querySelectorAll('#display-toggles [data-tg]'), k;
    for (k = 0; k < chips.length; k++) {
      chips[k].classList.toggle('active', !!s.show[chips[k].getAttribute('data-tg')]);
    }
    var gchips = document.querySelectorAll('#graph-chips [data-g]');
    for (k = 0; k < gchips.length; k++) {
      gchips[k].classList.toggle('active', gchips[k].getAttribute('data-g') === s.graph);
    }
    $('btn-sound').classList.toggle('active', s.sound);
    $('btn-sound').setAttribute('aria-pressed', s.sound ? 'true' : 'false');
    $('btn-sweep').classList.toggle('running', s.sweep);
    $('btn-sweep').innerHTML = s.sweep ? '&#10073;&#10073; Pause sweep' : '&#8635; Sweep';

    var fb = $('btn-fire');
    fb.classList.toggle('lit', s.fired);
    fb.innerHTML = s.fired ? '&#128161; Ray on &mdash; switch off' : '&#9654; Fire ray';
    fb.title = s.fired
      ? 'The lamp is on and the path is locked on screen. Changing any setting switches it off again.'
      : 'Switch the lamp on and send a ray through the apparatus';

    /* you cannot record an angle you are not looking at */
    $('btn-record').disabled = !s.fired;
    $('btn-record').title = s.fired
      ? 'Record this pair of angles in the readings table'
      : 'Fire the ray first — there is no refracted ray to measure while the lamp is off';
  }

  /* Media pairs change the index, so old readings no longer belong on the
     same graph. Detected by signature rather than wired to every control. */
  var lastPair = '';
  function checkPairChange() {
    var mm = incidentMedia();
    var sig = mm.a + '>' + mm.b + '@' + state.customN;
    if (sig !== lastPair) {
      if (lastPair && state.rows.length) { state.rows = []; renderRows(); }
      lastPair = sig;
    }
  }

  /* ── 28. Animation loop ────────────────────────────────────── */

  var rafId = null, sweepDir = 1;

  function needsLoop() {
    if (state.mode !== 'simulate') return false;
    return state.sweep || (state.show.waves && state.fired) || travelling();
  }
  function schedule() { if (rafId == null) rafId = requestAnimationFrame(tick); }

  function tick() {
    rafId = null;
    if (state.sweep) {
      var a = angSpec();
      state.ang = parseFloat((state.ang + sweepDir * 0.55).toFixed(2));
      if (state.ang >= a.max) { state.ang = a.max; sweepDir = -1; }
      else if (state.ang <= a.min) { state.ang = a.min; sweepDir = 1; }
      $('ang-slider').value = state.ang;
      $('ang-step').value = state.ang.toFixed(1);
      $('ang-val').textContent = state.ang.toFixed(1) + '°';
      updateReadouts();
    }
    draw();
    if (needsLoop()) schedule();
  }

  function refresh() {
    measureChrome();
    updateReadouts();
    draw();
    if (needsLoop()) schedule();
  }

  /* Firing the lamp. Sweep implies a lit lamp — you cannot watch a ray change
     continuously if there is no ray. */
  function setFired(on) {
    if (on && !state.fired) { state.fireT0 = performance.now(); playFire(); }
    state.fired = !!on;
    if (!state.fired) state.sweep = false;
    syncControls();
    refresh();
  }

  /* Any change to the setup invalidates the run on screen, so the lamp goes
     out and the bench is ready for the next one. View-only toggles do not. */
  function unfire() {
    if (!state.fired && !state.sweep) return;
    state.fired = false; state.sweep = false;
    syncControls();
  }

  /* ── 29. Events ────────────────────────────────────────────── */

  function bindQuantity(sliderId, inputId, valId, get, set, dp, unitFn) {
    var sl = $(sliderId), inp = $(inputId), val = $(valId);
    function apply(v) {
      if (isNaN(v)) { inp.value = get(); return; }
      var lo = parseFloat(sl.min), hi = parseFloat(sl.max);
      v = parseFloat(clamp(v, lo, hi).toFixed(dp));
      if (v !== get()) unfire();          /* a changed setting invalidates the run */
      set(v);
      sl.value = v; inp.value = v;
      val.textContent = (dp ? v.toFixed(dp) : v) + (unitFn ? unitFn() : '');
      refresh();
    }
    sl.addEventListener('input', function () { apply(parseFloat(sl.value)); });
    inp.addEventListener('change', function () { apply(parseFloat(inp.value)); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') inp.blur();
    });
    return apply;
  }

  function wireEvents() {
    /* mode tabs */
    $('mode-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      setMode(b.getAttribute('data-value'));
      playClick();
    });

    /* apparatus */
    $('app-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      var v = b.getAttribute('data-value');
      if (state.unknown && v === 'depth') { playError(); return; }
      state.angFor[state.app] = state.ang;        /* leave this bench as it was */
      state.app = v;
      state.ang = state.angFor[v];                /* pick the next one up where it was */
      unfire();
      if (v !== 'semi') state.dir = 'in';
      if (v === 'depth' && state.graph === 'intensity') state.graph = 'curve';
      syncControls(); refresh(); playClick();
    });

    $('dir-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      state.dir = b.getAttribute('data-value');
      unfire();
      syncControls(); refresh(); playClick();
    });

    /* media */
    $('m1-sel').addEventListener('change', function () { state.m1 = this.value; unfire(); syncControls(); refresh(); });
    $('m2-sel').addEventListener('change', function () { state.m2 = this.value; unfire(); syncControls(); refresh(); });
    $('custom-n').addEventListener('change', function () {
      var v = parseFloat(this.value);
      state.customN = isNaN(v) ? 1.6 : parseFloat(clamp(v, 1.0, 3.0).toFixed(4));
      this.value = state.customN;
      unfire(); syncControls(); refresh();
    });

    /* quantities */
    bindQuantity('ang-slider', 'ang-step', 'ang-val',
      function () { return state.ang; }, function (v) { state.ang = v; }, 1, function () { return '°'; });
    bindQuantity('aux-slider', 'aux-step', 'aux-val',
      function () { var x = auxSpec(); return x ? state[x.key] : 0; },
      function (v) { var x = auxSpec(); if (x) state[x.key] = v; }, 0,
      function () { var x = auxSpec(); return x ? ' ' + x.unit : ''; });
    bindQuantity('wl-slider', 'wl-step', 'wl-val',
      function () { return state.wl; }, function (v) { state.wl = v; }, 0, function () { return ' nm'; });

    $('btn-white').addEventListener('click', function () {
      state.white = !state.white;
      unfire();
      if (state.white && state.app !== 'prism') state.app = 'prism';
      syncControls(); refresh(); playClick();
    });

    /* display panel */
    $('display-toggle').addEventListener('click', function () {
      var panel = $('canvas-display');
      var c = panel.getAttribute('data-collapsed') === 'true';
      panel.setAttribute('data-collapsed', c ? 'false' : 'true');
      this.setAttribute('aria-expanded', c ? 'true' : 'false');
    });
    $('display-toggles').addEventListener('click', function (e) {
      var b = e.target.closest('[data-tg]');
      if (b) {
        var key = b.getAttribute('data-tg');
        state.show[key] = !state.show[key];
        syncControls(); refresh(); playClick();
        return;
      }
      if (e.target.closest('#btn-sound')) {
        state.sound = !state.sound;
        syncControls();
        if (state.sound) playClick();
      }
    });
    $('graph-chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (!b) return;
      state.graph = b.getAttribute('data-g');
      syncControls(); refresh(); playClick();
    });

    /* dock */
    $('btn-fire').addEventListener('click', function () { setFired(!state.fired); });

    $('btn-sweep').addEventListener('click', function () {
      state.sweep = !state.sweep;
      if (state.sweep && !state.fired) { state.fired = true; state.fireT0 = performance.now(); }
      syncControls();
      if (state.sweep) schedule(); else refresh();
      playClick();
    });
    $('btn-record').addEventListener('click', recordReading);
    $('btn-reset').addEventListener('click', function () {
      state.ang = 40; state.sweep = false; state.fired = false; state.rows = [];
      syncControls(); renderRows(); refresh(); playClick();
    });
    $('btn-calc').addEventListener('click', function () {
      buildCalcModal();
      $('calc-modal').className = 'calc-modal';
      playClick();
    });
    $('calc-close').addEventListener('click', function () { $('calc-modal').className = 'calc-modal hidden'; });
    $('calc-modal').addEventListener('click', function (e) {
      if (e.target === this) this.className = 'calc-modal hidden';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $('calc-modal').className = 'calc-modal hidden';
    });
    $('btn-report-dock').addEventListener('click', exportReport);
    $('btn-report').addEventListener('click', exportReport);
    $('btn-clear-rows').addEventListener('click', function () {
      state.rows = []; renderRows(); refresh(); playClick();
    });
    $('data-rows').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]'); if (!b) return;
      state.rows.splice(parseInt(b.getAttribute('data-del'), 10), 1);
      renderRows(); refresh();
    });

    /* unknown block */
    $('btn-tir').addEventListener('click', applyTIR);
    $('btn-unknown').addEventListener('click', function () { setUnknown(!state.unknown); playClick(); });
    $('btn-check-unknown').addEventListener('click', checkUnknown);

    /* explore */
    $('explore-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      setPills('explore-tabs', b.getAttribute('data-value'));
      renderExplore(b.getAttribute('data-value'));
      playClick();
    });

    /* calculate */
    $('calc-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      calcState.form = b.getAttribute('data-value');
      setPills('calc-tabs', calcState.form);
      renderCalc(); playClick();
    });

    /* practice */
    $('btn-new-q').addEventListener('click', newProblem);
    $('btn-check').addEventListener('click', checkProblem);
    $('btn-show-sol').addEventListener('click', showSolution);
    $('pq-mcq').addEventListener('click', function (e) {
      var b = e.target.closest('.pq-opt'); if (!b || practice.answered) return;
      var opts = this.querySelectorAll('.pq-opt'), k;
      for (k = 0; k < opts.length; k++) opts[k].classList.remove('selected');
      b.classList.add('selected');
      practice.sel = parseInt(b.getAttribute('data-opt'), 10);
    });
    $('pq-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkProblem(); });

    /* quiz */
    $('btn-start-quiz').addEventListener('click', startQuiz);
    $('btn-submit-q').addEventListener('click', submitQuiz);
    $('btn-next-q').addEventListener('click', nextQuiz);
    $('qq-options').addEventListener('click', function (e) {
      var b = e.target.closest('.qq-opt'); if (!b || quiz.answered) return;
      var opts = this.querySelectorAll('.qq-opt'), k;
      for (k = 0; k < opts.length; k++) opts[k].classList.remove('selected');
      b.classList.add('selected');
      quiz.sel = parseInt(b.getAttribute('data-opt'), 10);
    });

    /* Canvas dragging. The laser itself is the handle: grab it and it swings
       about the point of incidence without jumping, because the offset between
       where you took hold and where it was pointing is preserved. Dragging
       anywhere else still aims it directly, which is quicker for a big change. */
    var dragging = false, grabOffset = 0;

    function toDesign(e) {
      var rect = canvas.getBoundingClientRect();
      var k = W / rect.width;
      var x = (e.clientX - rect.left) * k, y = (e.clientY - rect.top) * k;
      return [(x - appTX) / appScale, (y - appTY) / appScale];
    }
    function angleFromUp(p, o) {
      return deg(Math.atan2(Math.abs(p[0] - o[0]), -(p[1] - o[1])));
    }
    /* the raw angle the pointer is asking for, before any grab offset */
    function pointerAngle(p) {
      if (state.app === 'prism') {
        var piv = (sol.trace && sol.trace.entry) ? sol.trace.entry : [230, 300];
        return deg(rad(state.apex) / 2 - vang(vnorm(vsub(piv, p))));
      }
      if (state.app === 'slab') {
        var pe = (sol.trace && sol.trace.entry) ? sol.trace.entry : [222, OY];
        return angleFromUp(p, pe);
      }
      if (state.app === 'depth') return angleFromUp(p, [236, 460]);
      return angleFromUp(p, [OX, OY]);
    }
    function setAngle(v) {
      var a = angSpec();
      if (isNaN(v)) return;
      v = parseFloat(clamp(v, a.min, a.max).toFixed(1));
      if (v === state.ang) return;
      unfire();
      state.ang = v;
      $('ang-slider').value = state.ang;
      $('ang-step').value = state.ang.toFixed(1);
      $('ang-val').textContent = state.ang.toFixed(1) + '°';
      refresh();
    }
    function inBox(p) { return p[0] >= 0 && p[1] >= 0 && p[0] <= APP_W && p[1] <= APP_H; }

    canvas.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      var p = toDesign(e);
      if (!inBox(p)) return;
      dragging = true; state.sweep = false; syncControls();
      canvas.setPointerCapture(e.pointerId);
      if (onSource(p, e.pointerType === 'touch' ? 24 : 8)) {
        grabOffset = state.ang - pointerAngle(p);   /* take hold, do not snap */
        srcHover = true;
      } else {
        grabOffset = 0;
        setAngle(pointerAngle(p));                  /* aim straight at the pointer */
      }
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', function (e) {
      var p = toDesign(e);
      if (!dragging) {
        /* hover feedback so the laser reads as something you can pick up */
        var over = inBox(p) && onSource(p);
        if (over !== srcHover) {
          srcHover = over;
          canvas.style.cursor = over ? 'grab' : 'crosshair';
          draw();
        }
        return;
      }
      setAngle(pointerAngle(p) + grabOffset);
      e.preventDefault();
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false; grabOffset = 0;
      canvas.style.cursor = srcHover ? 'grab' : 'crosshair';
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('pointerleave', function () {
      if (dragging) return;
      if (srcHover) { srcHover = false; draw(); }
      canvas.style.cursor = 'crosshair';
    });

    /* right-click menu */
    var menu = $('canvas-ctx-menu');
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      menu.className = 'ctx-menu';
      var mw = 180, mh = 168;
      menu.style.left = Math.min(e.clientX, window.innerWidth - mw - 8) + 'px';
      menu.style.top = Math.min(e.clientY, window.innerHeight - mh - 8) + 'px';
    });
    document.addEventListener('click', function () { menu.className = 'ctx-menu hidden'; });
    $('ctx-export-png').addEventListener('click', exportPNG);
    $('ctx-export-csv').addEventListener('click', exportCSV);
    $('ctx-record').addEventListener('click', recordReading);
    $('ctx-reset').addEventListener('click', function () {
      state.ang = 40; state.rows = []; state.sweep = false; state.fired = false;
      syncControls(); renderRows(); refresh();
    });

    /* resize */
    window.addEventListener('resize', function () { fitCanvas(); draw(); });
    if (window.ResizeObserver) {
      new ResizeObserver(function () { fitCanvas(); draw(); }).observe(canvas.parentElement);
      /* the dock grows when its buttons wrap, which changes what it covers */
      var dk = $('canvas-dock');
      if (dk) new ResizeObserver(function () { measureChrome(); draw(); }).observe(dk);
    }
  }

  /* ── 30. Mode switching ────────────────────────────────────── */

  function setMode(m) {
    state.mode = m;
    $('sec-simulate').className = m === 'simulate' ? '' : 'hidden';
    $('sec-calculate').className = m === 'calculate' ? '' : 'hidden';
    $('sec-explore').className = m === 'explore' ? '' : 'hidden';
    $('sec-practice').className = m === 'practice' ? '' : 'hidden';
    $('sec-quiz').className = m === 'quiz' ? '' : 'hidden';
    setPills('mode-tabs', m);
    if (m === 'calculate') renderCalc();
    if (m === 'explore') {
      var act = document.querySelector('#explore-tabs .pill.active');
      renderExplore(act ? act.getAttribute('data-value') : 'basics');
    }
    if (m === 'simulate') { fitCanvas(); refresh(); }
  }

  /* ── 31. Init ──────────────────────────────────────────────── */

  function init() {
    refreshMediaSelects();
    buildUnknownMaterials();
    syncControls();
    wireEvents();
    renderRows();
    fitCanvas();
    var mm = incidentMedia();
    lastPair = mm.a + '>' + mm.b + '@' + state.customN;
    refresh();
    setMode('simulate');

    /* The first measurement of the dock is taken before the browser has settled
       the layout, so labels anchored to it land too low. Re-measure once the
       frame is done, and again after fonts and the ad slots have resolved. */
    requestAnimationFrame(function () { measureChrome(); draw(); });
    setTimeout(function () { measureChrome(); draw(); }, 400);
    window.addEventListener('load', function () { fitCanvas(); draw(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
