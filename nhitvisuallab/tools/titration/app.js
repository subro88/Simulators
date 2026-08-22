/* ═══════════════════════════════════════════════════════════════
   Titration Simulator — NHIT VisualLab
   pH is solved from the exact charge-balance equation of the
   mixture at every volume, so buffer regions, hydrolysed
   equivalence points and diprotic double end points all emerge
   from the chemistry rather than being hard-coded.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. DOM refs ───────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }

  var canvas   = $('main-canvas');
  var ctx      = canvas.getContext('2d');
  var analyteSel = $('analyte-sel');
  var titrantSel = $('titrant-sel');
  var indSel     = $('ind-sel');

  /* ── 2. Chemistry data ─────────────────────────────────────── */

  var KW = 1.0e-14;                       /* water autoprotolysis at 25 °C */
  var STRONG_PKA = -6;                    /* stand-in for "fully dissociated" */

  /* A reagent is:
       spec — spectator ion charge carried per formula unit (Na⁺ = +1, …)
       sys  — the polyprotic acid system it introduces, or null
              z0  = charge of the FULLY PROTONATED form
              pKa = ascending list, one per ionisable proton
       eq   — equivalents (protons donated or accepted) per formula unit
     The protonation state a reagent is added in is encoded entirely by
     `spec`: Na₂CO₃, NaHCO₃ and H₂CO₃ share one acid system and differ
     only in spectator charge. */
  var REAGENTS = [
    /* ── acids ── */
    { id: 'hcl',     name: 'Hydrochloric acid',        formula: 'HCl',      kind: 'acid', eq: 1,
      spec: 0,  sys: { z0: 0, pKa: [STRONG_PKA] }, strong: true },
    { id: 'hno3',    name: 'Nitric acid',              formula: 'HNO\u2083', kind: 'acid', eq: 1,
      spec: 0,  sys: { z0: 0, pKa: [STRONG_PKA] }, strong: true },
    { id: 'ch3cooh', name: 'Ethanoic (acetic) acid',   formula: 'CH\u2083COOH', kind: 'acid', eq: 1,
      spec: 0,  sys: { z0: 0, pKa: [4.76] }, strong: false },
    { id: 'hcooh',   name: 'Methanoic (formic) acid',  formula: 'HCOOH',    kind: 'acid', eq: 1,
      spec: 0,  sys: { z0: 0, pKa: [3.75] }, strong: false },
    { id: 'h2so4',   name: 'Sulfuric acid',            formula: 'H\u2082SO\u2084', kind: 'acid', eq: 2,
      spec: 0,  sys: { z0: 0, pKa: [-3, 1.99] }, strong: true },
    { id: 'h2c2o4',  name: 'Ethanedioic (oxalic) acid', formula: 'H\u2082C\u2082O\u2084', kind: 'acid', eq: 2,
      spec: 0,  sys: { z0: 0, pKa: [1.25, 4.27] }, strong: false },
    /* ── bases ── */
    { id: 'naoh',    name: 'Sodium hydroxide',         formula: 'NaOH',     kind: 'base', eq: 1,
      spec: 1,  sys: null, strong: true },
    { id: 'koh',     name: 'Potassium hydroxide',      formula: 'KOH',      kind: 'base', eq: 1,
      spec: 1,  sys: null, strong: true },
    { id: 'nh3',     name: 'Ammonia',                  formula: 'NH\u2083', kind: 'base', eq: 1,
      spec: 0,  sys: { z0: 1, pKa: [9.25] }, strong: false },
    { id: 'na2co3',  name: 'Sodium carbonate',         formula: 'Na\u2082CO\u2083', kind: 'base', eq: 2,
      spec: 2,  sys: { z0: 0, pKa: [6.35, 10.33] }, strong: false },
    { id: 'nahco3',  name: 'Sodium hydrogencarbonate', formula: 'NaHCO\u2083', kind: 'base', eq: 1,
      spec: 1,  sys: { z0: 0, pKa: [6.35, 10.33] }, strong: false }
  ];

  function reagent(id) {
    for (var i = 0; i < REAGENTS.length; i++) if (REAGENTS[i].id === id) return REAGENTS[i];
    return REAGENTS[0];
  }

  /* Indicators — transition ranges from standard analytical tables.
     cLo = colour of the acid form, cHi = colour of the base form.
     alpha 0 marks a genuinely colourless form (phenolphthalein). */
  var INDICATORS = [
    { id: 'none',   name: 'None (no indicator)',  lo: 0,   hi: 0,   pK: 7,
      cLo: [150, 196, 232, 0.10], cHi: [150, 196, 232, 0.10] },
    { id: 'mo',     name: 'Methyl orange',        lo: 3.1, hi: 4.4, pK: 3.47,
      cLo: [214, 48, 49, 0.85],   cHi: [255, 205, 66, 0.85] },
    { id: 'mr',     name: 'Methyl red',           lo: 4.4, hi: 6.2, pK: 5.05,
      cLo: [211, 47, 47, 0.85],   cHi: [255, 238, 88, 0.85] },
    { id: 'btb',    name: 'Bromothymol blue',     lo: 6.0, hi: 7.6, pK: 7.10,
      cLo: [253, 216, 53, 0.85],  cHi: [30, 136, 229, 0.85] },
    { id: 'pr',     name: 'Phenol red',           lo: 6.8, hi: 8.4, pK: 7.90,
      cLo: [255, 202, 40, 0.85],  cHi: [216, 27, 96, 0.85] },
    { id: 'pp',     name: 'Phenolphthalein',      lo: 8.3, hi: 10.0, pK: 9.40, fade: 12.5,
      cLo: [150, 196, 232, 0.10], cHi: [236, 64, 122, 0.85] },
    { id: 'tp',     name: 'Thymolphthalein',      lo: 9.3, hi: 10.5, pK: 9.90, fade: 13.0,
      cLo: [150, 196, 232, 0.10], cHi: [57, 73, 171, 0.85] }
  ];

  function indicator(id) {
    for (var i = 0; i < INDICATORS.length; i++) if (INDICATORS[i].id === id) return INDICATORS[i];
    return INDICATORS[0];
  }

  /* ── 3. Chemistry engine ───────────────────────────────────── */

  /* Average number of protons released by a polyprotic system at [H⁺] = h.
     For Ka list [K1…Kn]:  D = Σ_j β_j h^(n−j),  β_j = Π_{i≤j} Ki
     n̄ = Σ_j j·β_j·h^(n−j) / D                                    */
  function nBar(kas, h) {
    var n = kas.length, beta = 1, D = 0, num = 0, j;
    for (j = 0; j <= n; j++) {
      if (j > 0) beta *= kas[j - 1];
      var term = beta * Math.pow(h, n - j);
      D += term;
      num += j * term;
    }
    return D > 0 ? num / D : 0;
  }

  /* Net charge imbalance of the mixture. Strictly increasing in h, so a
     bisection on pH is guaranteed to find the single root.
     mix = [{ F, spec, sys }] — F is the FORMAL concentration after dilution. */
  function chargeBalance(mix, h) {
    var f = h - KW / h, i;
    for (i = 0; i < mix.length; i++) {
      var m = mix[i];
      if (m.F <= 0) continue;
      f += m.F * m.spec;
      if (m.sys) f += m.F * (m.sys.z0 - nBar(m.sys.kas, h));
    }
    return f;
  }

  function precompute(rg) {
    if (!rg.sys) return null;
    var kas = [], i;
    for (i = 0; i < rg.sys.pKa.length; i++) kas.push(Math.pow(10, -rg.sys.pKa[i]));
    return { z0: rg.sys.z0, kas: kas };
  }

  /* Solve for pH by bisection on the pH axis (60 halvings of an 18-unit
     bracket ⇒ far below display precision). */
  function solvePH(mix) {
    var lo = -3, hi = 17, mid, i;
    for (i = 0; i < 60; i++) {
      mid = (lo + hi) / 2;
      if (chargeBalance(mix, Math.pow(10, -mid)) > 0) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* Build the mixture present after Vb mL of titrant has entered Va mL of analyte. */
  function mixtureAt(vb) {
    var s = state, V = s.va + vb;
    if (V <= 0) V = 1e-9;
    return [
      { F: s.ca * s.va / V, spec: s.aR.spec, sys: s.aSys },
      { F: s.ct * vb / V,   spec: s.tR.spec, sys: s.tSys }
    ];
  }

  function phAt(vb) { return solvePH(mixtureAt(vb)); }

  /* Equivalence volumes — one per proton transferred. */
  function equivVolumes() {
    var s = state, out = [], k;
    var per = (s.ca * s.va) / (s.ct * s.tR.eq);   /* mL of titrant per equivalent */
    for (k = 1; k <= s.aR.eq; k++) out.push(k * per);
    return out;
  }

  /* Volume at which the curve first reaches a target pH. pH(V) is monotonic
     for a single-direction titration, so bisection is safe. Returns null if
     the target lies outside the deliverable range. */
  function volumeAtPH(target) {
    var lo = 0, hi = state.vmaxDeliver, mid, i;
    var pLo = phAt(lo), pHi = phAt(hi);
    var rising = pHi > pLo;
    if (rising ? (target <= pLo || target >= pHi) : (target >= pLo || target <= pHi)) return null;
    for (i = 0; i < 50; i++) {
      mid = (lo + hi) / 2;
      var p = phAt(mid);
      if (rising ? (p < target) : (p > target)) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ── 4. State ──────────────────────────────────────────────── */

  var VMAX_DELIVER = 100;      /* mL — burette is refilled once at 50 mL */
  var BURETTE_CAP  = 50;

  var state = {
    mode: 'simulate',
    analyte: 'ch3cooh', titrant: 'naoh', ind: 'pp',
    ca: 0.1, va: 25, ct: 0.1,
    v: 0,                       /* volume delivered, mL */
    running: false,
    aR: null, tR: null, aSys: null, tSys: null,
    curve: [], deriv: [], veqs: [], phEq: 7, vmax: 50,
    vmaxDeliver: VMAX_DELIVER,
    endV: null, errPct: null, errRef: 0, veqSharp: [],
    show: { grid: true, equiv: true, band: true, deriv: false, halfeq: false, labels: true, stirrer: false },
    sound: true, audioCtx: null,
    drops: [], splashes: [], flashes: [], scrubV: null,
    burStart: 0, titres: [], unknown: false,
    runOvershoot: 0.12, runHitCap: false,
    pScore: 0, pTotal: 0, pQ: null,
    qIdx: 0, qList: [], qAns: [], qSel: null
  };

  /* ── 5. Sound ──────────────────────────────────────────────── */

  function audio() {
    if (!state.audioCtx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      state.audioCtx = new AC();
    }
    return state.audioCtx;
  }
  function playTone(freq, dur, type, vol) {
    if (!state.sound) return;
    var ac = audio(); if (!ac) return;
    try {
      var osc = ac.createOscillator(), g = ac.createGain();
      osc.type = type || 'sine'; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol || 0.05, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
      osc.connect(g); g.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + dur);
    } catch (e) { /* audio unavailable — silent */ }
  }
  function playDrip()    { playTone(620 + Math.random() * 90, 0.06, 'sine', 0.028); }
  function playClick()   { playTone(800, 0.05, 'square', 0.04); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.09); setTimeout(function () { playTone(1100, 0.15, 'sine', 0.09); }, 120); }
  function playError()   { playTone(300, 0.20, 'sawtooth', 0.055); }
  function playEnd()     { playTone(520, 0.18, 'triangle', 0.07); setTimeout(function () { playTone(780, 0.22, 'triangle', 0.06); }, 150); }

  /* ── 6. Setup recomputation ────────────────────────────────── */

  function rebuild() {
    var s = state;
    s.aR = reagent(s.analyte);
    s.tR = reagent(s.titrant);
    s.aSys = precompute(s.aR);
    s.tSys = precompute(s.tR);

    s.veqs = equivVolumes();
    s.veqSharp = s.veqs.map(function (v) {
      /* A stoichiometric equivalence point is only a usable END POINT if the
         curve actually steps there. Two protons separate cleanly only when
         their pKa values differ by roughly 4 or more; H2SO4 (first proton
         strong) and oxalic acid (dpKa 3.0) show no first step at all, and the
         carbonate first point is genuinely gradual. Marking those identically
         to a sharp point taught something false. */
      var w = Math.max(v * 0.01, 0.02);
      if (v - w < 0 || v + w > s.vmaxDeliver) return 0;
      var jump = Math.abs(phAt(v + w) - phAt(v - w));
      return jump >= 2 ? 2 : jump >= 0.8 ? 1 : 0;   /* sharp | gradual | none */
    });
    var last = s.veqs[s.veqs.length - 1];
    s.vmaxDeliver = VMAX_DELIVER;
    s.vmax = Math.max(5, Math.min(VMAX_DELIVER, Math.ceil(last * 1.5 / 5) * 5));
    if (!isFinite(s.vmax) || s.vmax <= 0) s.vmax = 50;

    s.phEq = phAt(Math.min(last, s.vmaxDeliver));
    buildCurve();
    computeEndPoint();
  }

  /* Uniform sampling plus a dense cluster around each equivalence point, so
     the near-vertical section renders as a smooth curve rather than a step. */
  function buildCurve() {
    var s = state, pts = [], i, k;
    var N = 420;
    for (i = 0; i <= N; i++) pts.push(s.vmax * i / N);
    for (k = 0; k < s.veqs.length; k++) {
      var ve = s.veqs[k];
      if (ve > s.vmax) continue;
      for (i = -60; i <= 60; i++) {
        var v = ve + ve * 0.03 * (i / 60) * Math.abs(i / 60);
        if (v >= 0 && v <= s.vmax) pts.push(v);
      }
    }
    pts.sort(function (a, b) { return a - b; });

    var curve = [];
    for (i = 0; i < pts.length; i++) {
      if (i > 0 && pts[i] - pts[i - 1] < 1e-9) continue;
      curve.push({ v: pts[i], ph: phAt(pts[i]) });
    }
    s.curve = curve;

    var deriv = [];
    for (i = 1; i < curve.length; i++) {
      var dv = curve[i].v - curve[i - 1].v;
      if (dv <= 0) continue;
      deriv.push({ v: (curve[i].v + curve[i - 1].v) / 2, d: Math.abs((curve[i].ph - curve[i - 1].ph) / dv) });
    }
    s.deriv = deriv;
  }

  /* End point = volume at the midpoint of the indicator's transition range.
     Error is referenced to the NEAREST equivalence point, which is the
     correct comparison for a diprotic double end point. */
  function computeEndPoint() {
    var s = state, ind = indicator(s.ind);
    if (ind.id === 'none') { s.endV = null; s.errPct = null; return; }
    var mid = ind.pK;              /* half-converted — the perceived colour change */
    var v = volumeAtPH(mid);
    s.endV = v;
    if (v == null) { s.errPct = null; return; }
    var best = 0, bd = Infinity, k;
    for (k = 0; k < s.veqs.length; k++) {
      var d = Math.abs(s.veqs[k] - v);
      if (d < bd) { bd = d; best = k; }
    }
    s.errRef = best;
    var ve = s.veqs[best];
    s.errPct = ve > 0 ? (v - ve) / ve * 100 : null;
  }

  /* ── 7. Colour helpers ─────────────────────────────────────── */

  function smoothstep(a, b, x) {
    if (b <= a) return x < a ? 0 : 1;
    var t = (x - a) / (b - a);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    return t * t * (3 - 2 * t);
  }
  function flaskColour(ph) {
    var ind = indicator(state.ind);
    if (ind.id === 'none') return 'rgba(210,235,245,0.20)';
    var t = smoothstep(ind.lo, ind.hi, ph);
    var c = [], i;
    for (i = 0; i < 3; i++) c.push(Math.round(ind.cLo[i] + (ind.cHi[i] - ind.cLo[i]) * t));
    var a = ind.cLo[3] + (ind.cHi[3] - ind.cLo[3]) * t;
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a.toFixed(3) + ')';
  }

  /* ── 8. Canvas sizing (Hi-DPI) ─────────────────────────────── */

  /* Two layouts. Side by side on a wide screen; stacked on a phone, where a
     528 px graph squeezed into half of a 340 px canvas is unreadable.
     The apparatus is always drawn into a fixed 372 x 560 design box and
     placed with a transform, so its drawing code never changes. */
  var APP_W = 372, APP_H = 560;
  var W = 960, H = 560;                        /* logical drawing units */
  var GX = 402, GY = 56, GW = 528, GH = 404;   /* graph plot rectangle */
  var appTX = 0, appTY = 0, appScale = 1;      /* apparatus placement */
  var portrait = false;

  function layout(cssW) {
    portrait = cssW < 620;
    if (portrait) {
      W = 600; H = 880;
      appScale = 0.80;
      appTX = (W - APP_W * appScale) / 2;
      appTY = 4;
      GX = 58; GY = 500; GW = 500; GH = 310;
    } else {
      W = 960; H = 560;
      appScale = 1; appTX = 0; appTY = 0;
      GX = 402; GY = 56; GW = 528; GH = 404;
    }
  }

  /* Measured once per resize, not per frame — a getBoundingClientRect() inside
     draw() forces layout on every animation frame. A ResizeObserver refits the
     moment the real layout size arrives, and a <40px reading is rejected so a
     pre-layout measurement can never size the backing store. */
  var fitScale = 1, cssWCache = 0;

  function fitCanvas() {
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width >= 40 ? rect.width : (cssWCache || 960);
    cssWCache = cssW;
    layout(cssW);
    var dpr = window.devicePixelRatio || 1;
    var pxW = Math.round(cssW * dpr);
    var pxH = Math.round(cssW * (H / W) * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW; canvas.height = pxH;
      /* height is NEVER pinned in px — the CSS is height:auto and the backing
         store already carries the aspect ratio, so the element derives it. */
    }
    fitScale = pxW / W;
    return fitScale;
  }

  /* ── 9. Rendering ──────────────────────────────────────────── */

  function vx(v) { return GX + (v / state.vmax) * GW; }
  function py(p) { return GY + GH - (p / 14) * GH; }

  function draw() {
    ctx.setTransform(fitScale, 0, 0, fitScale, 0, 0);

    /* One opaque full-canvas paint is both the frame clear and the background. */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#111826'); bg.addColorStop(0.55, '#0c1119'); bg.addColorStop(1, '#080b11');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(appTX, appTY);
    ctx.scale(appScale, appScale);
    drawApparatus();
    ctx.restore();

    drawGraph();
  }

  /* ── Colour helpers ── */
  function shadeRGB(c, f) {
    return [
      Math.max(0, Math.min(255, Math.round(c[0] * f))),
      Math.max(0, Math.min(255, Math.round(c[1] * f))),
      Math.max(0, Math.min(255, Math.round(c[2] * f)))
    ];
  }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }

  /* Solution colour as a component object so gradients can be built from it. */
  /* Fraction present as the coloured basic form. An indicator is a weak acid,
     so this is its dissociation curve, not a ramp: at the low end of the quoted
     range it is already ~10% converted (a visible tinge) and at the high end
     still ~10% short of full colour. A smoothstep clamped to 0 and 100% at the
     range edges, which is where it was wrong by up to 20 percentage points. */
  function indFraction(ind, ph) {
    if (ind.id === 'none') return 0;
    var t = 1 / (1 + Math.pow(10, ind.pK - ph));
    /* Phenolphthalein and thymolphthalein revert to a colourless carbinol in
       strong alkali — the pink genuinely fades again past about pH 12.5. */
    if (ind.fade) t *= 1 - smoothstep(ind.fade, ind.fade + 1.6, ph);
    return t;
  }

  function flaskRGBA(ph) {
    var ind = indicator(state.ind);
    var t = indFraction(ind, ph);
    var c = [], i;
    for (i = 0; i < 3; i++) c.push(Math.round(ind.cLo[i] + (ind.cHi[i] - ind.cLo[i]) * t));
    return { c: c, a: ind.cLo[3] + (ind.cHi[3] - ind.cLo[3]) * t, t: t };
  }

  /* ── Apparatus geometry (fixed 372 x 560 design box) ── */
  var CXA = 178;                              /* apparatus centre line */
  var BUR = { x: CXA - 16, w: 32, top: 74, bot: 286, cap: 50 };
  var JET_Y = 326;                            /* burette tip — just above the lip */
  var FLK = { base: 494, mouth: 352, hw: 68, neck: 16, lip: 22 };  /* lip at 330 */

  function flaskPath(c, inset) {
    var i = inset || 0;
    var b = FLK.base - i, m = FLK.mouth + i * 0.4, hw = FLK.hw - i, nk = FLK.neck - i * 0.6;
    c.beginPath();
    c.moveTo(CXA - nk, m - FLK.lip);
    c.lineTo(CXA - nk, m);
    c.lineTo(CXA - hw, b - 10);
    c.quadraticCurveTo(CXA - hw, b, CXA - hw + 10, b);
    c.lineTo(CXA + hw - 10, b);
    c.quadraticCurveTo(CXA + hw, b, CXA + hw, b - 10);
    c.lineTo(CXA + nk, m);
    c.lineTo(CXA + nk, m - FLK.lip);
    c.closePath();
  }

  /* Width of the flask interior at a given height — the solution surface is an
     ellipse whose radius must match the cone, or the liquid reads as floating. */
  function flaskHalfWidthAt(y) {
    if (y <= FLK.mouth) return FLK.neck - 2;
    var f = (y - FLK.mouth) / (FLK.base - FLK.mouth);
    return (FLK.neck - 2) + ((FLK.hw - 3) - (FLK.neck - 2)) * f;
  }

  /* Liquid surface height for a given volume in mL. Cone volume grows as the
     cube of height, so a linear map would lie; this inverts the cone. */
  function solutionTopY(mL) {
    var vMax = 250, f = Math.max(0, Math.min(1, mL / vMax));
    var h = Math.pow(f, 1 / 2.4);                 /* invert the taper */
    return FLK.base - (FLK.base - FLK.mouth - 6) * h;
  }

  function contactShadow(c, x, y, rx, ry, a) {
    var g = c.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, rx, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function drawApparatus() {
    var s = state, ph = phAt(s.v);
    var now = performance.now();

    drawBench();
    drawStand();
    drawBurette(ph, now);
    drawFlask(ph, now);
    if (state.show.stirrer) drawStirrer(now); else drawWhiteTile();
    drawApparatusLabels(ph);
  }

  /* ── Scene: spotlight on the flask + bench ──
     The bench must span the whole canvas, not just the 372-wide design box.
     In portrait the box is scaled and centred, so a fixed 0..372 fill leaves a
     hard-edged rectangle floating in the middle of the canvas. These bounds are
     the design-space coordinates that map onto the full canvas width. */
  function drawBench() {
    var benchY = 500;
    var x0 = -appTX / appScale;
    var x1 = (W - appTX) / appScale;
    var w = x1 - x0;

    var glow = ctx.createRadialGradient(CXA, 430, 20, CXA, 430, 320);
    glow.addColorStop(0, 'rgba(240,98,146,0.13)');
    glow.addColorStop(1, 'rgba(240,98,146,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x0, -appTY / appScale, w, (H - appTY) / appScale);

    var bg = ctx.createLinearGradient(0, benchY, 0, 560);
    bg.addColorStop(0, '#2c3348'); bg.addColorStop(0.10, '#232a3c'); bg.addColorStop(1, '#161b28');
    ctx.fillStyle = bg; ctx.fillRect(x0, benchY, w, 62);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x0, benchY + 0.5); ctx.lineTo(x1, benchY + 0.5); ctx.stroke();

    if (!portrait) {                        /* pane divider — landscape only */
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(371.5, 0); ctx.lineTo(371.5, 560); ctx.stroke();
    }
  }

  /* ── Retort stand + burette clamps ── */
  function metalRect(x, y, w, h, base) {
    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0.00, rgba(shadeRGB(base, 0.55), 1));
    g.addColorStop(0.28, rgba(shadeRGB(base, 1.30), 1));
    g.addColorStop(0.55, rgba(base, 1));
    g.addColorStop(1.00, rgba(shadeRGB(base, 0.48), 1));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }

  function drawStand() {
    var steel = [92, 104, 132];
    contactShadow(ctx, 74, 502, 52, 9, 0.5);
    metalRect(46, 484, 58, 17, steel);           /* foot */
    ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(46, 484, 58, 2);
    metalRect(66, 96, 13, 392, steel);           /* upright */

    /* Two clamps. The boss reaches from the rod to the barrel and the jaws
       close around it — a clamp drawn stopping short of the glass is a claim
       that the burette is unsupported. */
    [188, 268].forEach(function (cy) {
      metalRect(79, cy - 5, BUR.x - 73, 11, [110, 122, 152]);
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(79, cy - 5, BUR.x - 73, 1.6);
      /* jaw plate sits BEHIND the barrel — the translucent glass lets it show
         through faintly, which is what a real clamp looks like from the front */
      metalRect(BUR.x - 5, cy - 7, BUR.w + 10, 14, [122, 134, 164]);
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      ctx.fillRect(BUR.x - 5, cy - 7, BUR.w + 10, 1.5);
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(BUR.x - 5, cy + 5.5, BUR.w + 10, 1.5);
      ctx.fillStyle = '#39425c';
      ctx.beginPath(); ctx.arc(88, cy, 5.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.arc(86.6, cy - 1.4, 2, 0, Math.PI * 2); ctx.fill();
    });
  }

  /* ── Burette: back glass → liquid → graduations → front glass ── */
  function drawBurette(ph, now) {
    var s = state, b = BUR;
    var refills = Math.floor(s.v / b.cap);
    var used = s.v - refills * b.cap;
    var inBur = b.cap - used;
    if (inBur <= 0.0001) inBur = b.cap;
    var liqTop = b.bot - (b.bot - b.top) * (inBur / b.cap);

    /* back glass body */
    var body = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
    body.addColorStop(0.00, 'rgba(150,190,230,0.16)');
    body.addColorStop(0.45, 'rgba(160,195,235,0.05)');
    body.addColorStop(1.00, 'rgba(120,160,205,0.16)');
    ctx.fillStyle = body; ctx.fillRect(b.x, b.top, b.w, b.bot - b.top);

    /* The drained section is empty glass. Left unlit it reads as black liquid
       and a student cannot tell which end of the burette is full. */
    var air = ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
    air.addColorStop(0.00, 'rgba(214,232,252,0.14)');
    air.addColorStop(0.35, 'rgba(226,240,255,0.05)');
    air.addColorStop(1.00, 'rgba(180,205,238,0.13)');
    ctx.fillStyle = air; ctx.fillRect(b.x + 1.5, b.top, b.w - 3, liqTop - b.top);

    /* titrant body */
    var lg = ctx.createLinearGradient(b.x, liqTop, b.x + b.w, b.bot);
    lg.addColorStop(0.00, 'rgba(168,216,246,0.62)');
    lg.addColorStop(0.35, 'rgba(126,186,226,0.74)');
    lg.addColorStop(1.00, 'rgba(74,136,184,0.66)');
    ctx.fillStyle = lg; ctx.fillRect(b.x + 1.5, liqTop, b.w - 3, b.bot - liqTop);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(b.x + 4, liqTop, 4.5, b.bot - liqTop);

    /* meniscus — concave, with a bright waterline */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(b.x + 1.5, liqTop - 4);
    ctx.quadraticCurveTo(CXA, liqTop + 7, b.x + b.w - 1.5, liqTop - 4);
    ctx.lineTo(b.x + b.w - 1.5, liqTop + 8); ctx.lineTo(b.x + 1.5, liqTop + 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(150,205,240,0.55)'; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(210,240,255,0.92)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x + 1.5, liqTop - 4);
    ctx.quadraticCurveTo(CXA, liqTop + 7, b.x + b.w - 1.5, liqTop - 4);
    ctx.stroke();

    /* graduations — 0 at the top, as on a real burette */
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var g = 0; g <= 50; g++) {
      var gy = b.top + (b.bot - b.top) * (g / 50);
      var major = (g % 5 === 0);
      ctx.strokeStyle = 'rgba(222,240,255,' + (major ? 0.80 : 0.30) + ')';
      ctx.lineWidth = major ? 1.2 : 0.8;
      ctx.beginPath();
      ctx.moveTo(b.x, gy); ctx.lineTo(b.x + (major ? 12 : 6), gy); ctx.stroke();
      if (g % 10 === 0) {
        ctx.fillStyle = 'rgba(205,225,248,0.85)';
        ctx.font = '600 9px "Segoe UI", system-ui, sans-serif';
        ctx.fillText(String(g), b.x - 3, gy);
      }
    }

    /* front glass: rim, specular streaks, rounded shoulders */
    ctx.strokeStyle = 'rgba(205,232,255,0.62)'; ctx.lineWidth = 1.7;
    ctx.strokeRect(b.x, b.top, b.w, b.bot - b.top);
    ctx.fillStyle = 'rgba(255,255,255,0.20)'; ctx.fillRect(b.x + 3.5, b.top + 2, 4, b.bot - b.top - 4);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(b.x + b.w - 7, b.top + 2, 2.6, b.bot - b.top - 4);

    /* stopcock — glass barrel with a PTFE key turned side-on */
    var open = state.running;
    var scy = b.bot + 11;
    var barrel = ctx.createLinearGradient(CXA - 12, 0, CXA + 12, 0);
    barrel.addColorStop(0, 'rgba(150,190,230,0.30)');
    barrel.addColorStop(0.4, 'rgba(190,220,250,0.16)');
    barrel.addColorStop(1, 'rgba(120,160,205,0.30)');
    ctx.fillStyle = barrel;
    roundRect(ctx, CXA - 12, scy - 9, 24, 18, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(205,232,255,0.6)'; ctx.lineWidth = 1.5;
    roundRect(ctx, CXA - 12, scy - 9, 24, 18, 4); ctx.stroke();

    var kg = ctx.createLinearGradient(0, scy - 7, 0, scy + 7);
    kg.addColorStop(0, open ? '#7ef2b4' : '#cfd7e6');
    kg.addColorStop(1, open ? '#2fbf72' : '#8792ad');
    ctx.fillStyle = kg;
    roundRect(ctx, CXA + 9, scy - 4.5, 17, 9, 3); ctx.fill();     /* key stem */
    ctx.beginPath(); ctx.arc(CXA + 28, scy, 6.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = open ? 'rgba(61,220,132,0.9)' : 'rgba(120,132,160,0.9)';
    ctx.beginPath(); ctx.arc(CXA + 28, scy, 2.2, 0, Math.PI * 2); ctx.fill();

    /* jet — slim, tapered, glass */
    ctx.fillStyle = 'rgba(150,190,230,0.22)';
    ctx.beginPath();
    ctx.moveTo(CXA - 4.5, scy + 9); ctx.lineTo(CXA - 1.5, JET_Y);
    ctx.lineTo(CXA + 1.5, JET_Y); ctx.lineTo(CXA + 4.5, scy + 9);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(205,232,255,0.55)'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(CXA - 4.5, scy + 9); ctx.lineTo(CXA - 1.5, JET_Y);
    ctx.moveTo(CXA + 4.5, scy + 9); ctx.lineTo(CXA + 1.5, JET_Y);
    ctx.stroke();

    /* a bead of titrant hanging at the tip while the stopcock is open */
    if (open) {
      ctx.fillStyle = 'rgba(178,222,250,0.85)';
      ctx.beginPath(); ctx.ellipse(CXA, JET_Y + 2.5, 2.6, 3.4, 0, 0, Math.PI * 2); ctx.fill();
    }

    if (refills > 0) {
      ctx.fillStyle = '#f5c842';
      ctx.font = '600 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('refilled ×' + refills, b.x + b.w + 10, b.top + 26);
    }
  }

  /* ── Falling drops ── */
  function drawDrops() {
    var i;
    for (i = 0; i < state.drops.length; i++) {
      var d = state.drops[i];
      var stretch = 1 + Math.min(0.85, d.vy / 14);
      ctx.fillStyle = 'rgba(186,228,252,0.92)';
      ctx.beginPath();
      ctx.ellipse(CXA, d.y, 3.1 / stretch, 4.2 * stretch, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.ellipse(CXA - 1, d.y - 1.5, 0.9, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ── Conical flask: shadow → back glass → solution → front glass ── */
  function drawFlask(ph, now) {
    var s = state, col = flaskRGBA(ph);
    var totalV = s.va + s.v;
    var topY = solutionTopY(totalV);
    var hwTop = flaskHalfWidthAt(topY);

    contactShadow(ctx, CXA, FLK.base + 3, 84, 12, 0.55);

    /* back glass body — this is what was missing; without it the vessel has no
       substance and a colourless solution leaves nothing on screen at all. */
    ctx.save();
    flaskPath(ctx, 0);
    ctx.clip();
    var gb = ctx.createLinearGradient(CXA - FLK.hw, 0, CXA + FLK.hw, 0);
    gb.addColorStop(0.00, 'rgba(158,196,234,0.20)');
    gb.addColorStop(0.42, 'rgba(172,206,240,0.06)');
    gb.addColorStop(1.00, 'rgba(120,160,205,0.20)');
    ctx.fillStyle = gb;
    ctx.fillRect(CXA - FLK.hw - 2, FLK.mouth - FLK.lip - 2, FLK.hw * 2 + 4, FLK.base - FLK.mouth + FLK.lip + 6);

    /* ── solution ── */
    /* A watery base tint first, so even a colourless indicator form reads as a
       body of liquid rather than empty glass. */
    ctx.fillStyle = 'rgba(146,186,220,0.16)';
    ctx.fillRect(CXA - FLK.hw - 2, topY, FLK.hw * 2 + 4, FLK.base - topY + 2);

    var lg = ctx.createLinearGradient(0, topY, 0, FLK.base);
    lg.addColorStop(0.00, rgba(shadeRGB(col.c, 1.18), Math.min(1, col.a + 0.10)));
    lg.addColorStop(0.55, rgba(col.c, Math.min(1, col.a + 0.20)));
    lg.addColorStop(1.00, rgba(shadeRGB(col.c, 0.68), Math.min(1, col.a + 0.34)));
    ctx.fillStyle = lg;
    ctx.fillRect(CXA - FLK.hw - 2, topY, FLK.hw * 2 + 4, FLK.base - topY + 2);

    /* transient colour flash where a drop lands — the streak of pink that
       appears and swirls away is the most recognisable moment of a real
       titration, and it lingers longer as the end point approaches. */
    var f;
    for (f = 0; f < s.flashes.length; f++) {
      var fl = s.flashes[f];
      var age = (now - fl.t) / fl.life;
      if (age >= 1) continue;
      var fade = (1 - age) * (1 - age);
      var ind = indicator(s.ind);
      var hot = ind.id === 'none' ? col.c : ind.cHi.slice(0, 3);
      var r = 12 + 46 * age;
      var rg = ctx.createRadialGradient(CXA, topY + 14, 0, CXA, topY + 14, r);
      rg.addColorStop(0, rgba(hot, 0.68 * fade * fl.k));
      rg.addColorStop(1, rgba(hot, 0));
      ctx.fillStyle = rg;
      ctx.fillRect(CXA - FLK.hw - 2, topY, FLK.hw * 2 + 4, FLK.base - topY + 2);
    }

    /* swirl — only while the stirrer is actually running */
    if (s.running) {
      ctx.strokeStyle = 'rgba(255,255,255,0.11)'; ctx.lineWidth = 1.2;
      var t = now / 300;
      for (var r2 = 1; r2 <= 3; r2++) {
        ctx.beginPath();
        ctx.ellipse(CXA, FLK.base - 16, 12 * r2, 3.6 * r2, Math.sin(t + r2) * 0.14, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    /* surface ellipse — radius follows the cone at that height */
    ctx.beginPath();
    ctx.ellipse(CXA, topY, hwTop, Math.max(3, hwTop * 0.17), 0, 0, Math.PI * 2);
    ctx.fillStyle = rgba(shadeRGB(col.c, 1.22), Math.min(1, col.a + 0.10));
    ctx.fill();
    ctx.strokeStyle = 'rgba(226,244,255,0.62)'; ctx.lineWidth = 1.2; ctx.stroke();

    /* splash rings from a landed drop */
    for (f = 0; f < s.splashes.length; f++) {
      var sp = s.splashes[f];
      var sa = (now - sp.t) / 460;
      if (sa >= 1) continue;
      ctx.strokeStyle = 'rgba(232,246,255,' + (0.5 * (1 - sa)) + ')';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.ellipse(CXA, topY, 4 + hwTop * 0.85 * sa, (4 + hwTop * 0.85 * sa) * 0.17, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    /* stir bar — only present when the magnetic stirrer is being used */
    if (s.show.stirrer) {
      ctx.save();
      ctx.translate(CXA, FLK.base - 8);
      ctx.rotate(s.running ? now / 70 : 0.5);
      var sg = ctx.createLinearGradient(-13, 0, 13, 0);
      sg.addColorStop(0, '#b9c2d4'); sg.addColorStop(0.45, '#f2f6fc'); sg.addColorStop(1, '#98a3bb');
      ctx.fillStyle = sg;
      roundRect(ctx, -13, -3, 26, 6, 3); ctx.fill();
      ctx.restore();
    }

    /* front glass: rim, specular streaks, graduation */
    ctx.strokeStyle = 'rgba(212,236,255,0.72)'; ctx.lineWidth = 2;
    flaskPath(ctx, 0); ctx.stroke();

    ctx.save();
    flaskPath(ctx, 0); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(CXA - 30, FLK.mouth + 12); ctx.lineTo(CXA - 46, FLK.base - 34); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(CXA + 38, FLK.mouth + 18); ctx.lineTo(CXA + 50, FLK.base - 30); ctx.stroke();
    ctx.restore();

    /* neck rim */
    ctx.strokeStyle = 'rgba(225,242,255,0.8)'; ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(CXA - FLK.neck - 2.5, FLK.mouth - FLK.lip);
    ctx.lineTo(CXA + FLK.neck + 2.5, FLK.mouth - FLK.lip);
    ctx.stroke();

    drawDrops();
  }

  /* ── White tile ──
     Standard teaching-lab practice: the flask is swirled by hand over a white
     tile so the first permanent colour change is easy to judge. Its absence is
     a marked-down omission in practical exams, so it is the default here. */
  function drawWhiteTile() {
    var top = FLK.base - 3, w = 176, th = 11;
    contactShadow(ctx, CXA, top + th + 3, 104, 9, 0.5);

    /* front edge (thickness) */
    var edge = ctx.createLinearGradient(0, top + 3, 0, top + th);
    edge.addColorStop(0, '#c8cedb'); edge.addColorStop(1, '#8e97aa');
    ctx.fillStyle = edge;
    roundRect(ctx, CXA - w / 2, top + 3, w, th - 1, 3); ctx.fill();

    /* top face — glazed ceramic */
    var face = ctx.createLinearGradient(CXA - w / 2, 0, CXA + w / 2, 0);
    face.addColorStop(0.00, '#dfe4ee');
    face.addColorStop(0.38, '#f7f9fd');
    face.addColorStop(1.00, '#ccd3e0');
    ctx.fillStyle = face;
    roundRect(ctx, CXA - w / 2, top - 4, w, 9, 3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(CXA - w / 2 + 5, top - 3.5, w - 10, 1.6);
  }

  /* ── Magnetic stirrer plate ── */
  function drawStirrer(now) {
    var y = FLK.base + 2, w = 168, h = 30;
    contactShadow(ctx, CXA, y + h + 1, 96, 8, 0.45);
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#39425c'); g.addColorStop(0.16, '#2b3348'); g.addColorStop(1, '#1c2231');
    ctx.fillStyle = g;
    roundRect(ctx, CXA - w / 2, y, w, h, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(CXA - w / 2 + 4, y + 1.5, w - 8, 1.6);

    /* speed dial */
    ctx.save();
    ctx.translate(CXA + 58, y + 15);
    ctx.fillStyle = '#4a5570';
    ctx.beginPath(); ctx.arc(0, 0, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.rotate(state.running ? 0.9 : -0.7);
    ctx.strokeStyle = '#dde3f0'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -5.5); ctx.stroke();
    ctx.restore();

    /* power LED */
    var lit = state.running;
    ctx.fillStyle = lit ? '#3ddc84' : '#2c5c42';
    ctx.beginPath(); ctx.arc(CXA - 58, y + 15, 4, 0, Math.PI * 2); ctx.fill();
    if (lit) {
      var lgl = ctx.createRadialGradient(CXA - 58, y + 15, 0, CXA - 58, y + 15, 12);
      lgl.addColorStop(0, 'rgba(61,220,132,0.5)'); lgl.addColorStop(1, 'rgba(61,220,132,0)');
      ctx.fillStyle = lgl;
      ctx.beginPath(); ctx.arc(CXA - 58, y + 15, 12, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(160,175,205,0.75)';
    ctx.font = '600 7.5px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STIRRER', CXA, y + 19);
  }

  /* ── Labels + live pH badge ── */
  function drawApparatusLabels(ph) {
    var s = state;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#9aa5c2';
    ctx.font = '600 10.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(s.tR.formula + '  ' + s.ct.toFixed(2) + ' M', 296, BUR.top + 14);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '9.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('titrant in burette', 296, BUR.top + 27);

    /* The analyte caption used to sit at y 546/558, but the canvas dock covers
       y 502-551, so one line was under the toolbar and the other squeezed into
       the sliver below it. It now rides on the flask itself, like a written
       label on the glass, on a plate dark enough to stay legible over a deep
       pink solution or over clear glass. */
    /* Sized to sit INSIDE the glass: the flask is 100 px wide at y = 452, so
       the plate is 100. The volume added is deliberately not repeated here —
       it already appears on the burette graduations and in the readout panel;
       this label carries only what belongs to the flask. */
    var lw = 100, lx = CXA - lw / 2, ly = 452, lh = 32;
    ctx.fillStyle = 'rgba(10,14,20,0.68)';
    roundRect(ctx, lx, ly, lw, lh, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(226,240,255,0.18)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = s.unknown ? '#f5c842' : '#cfd8ea';
    ctx.font = '700 9.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(s.aR.formula + '  ' + (s.unknown ? '? M' : s.ca.toFixed(2) + ' M'), CXA, ly + 11);

    ctx.fillStyle = 'rgba(160,175,205,0.9)';
    ctx.font = '8.5px "Segoe UI", system-ui, sans-serif';
    ctx.fillText(s.va.toFixed(1) + ' mL aliquot', CXA, ly + 22);
    ctx.textBaseline = 'alphabetic';

    /* live pH badge — beside the flask, clear of the burette and the jet */
    var bx = 259, by = 392;
    ctx.fillStyle = 'rgba(10,14,20,0.86)';
    roundRect(ctx, bx, by, 94, 32, 9); ctx.fill();
    ctx.strokeStyle = 'rgba(240,98,146,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#f06292';
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillText('pH ' + ph.toFixed(2), bx + 47, by + 22);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  function drawGraph() {
    var s = state, i, ind = indicator(s.ind);

    /* plot background */
    ctx.fillStyle = '#0b1018';
    roundRect(ctx, GX - 10, GY - 12, GW + 30, GH + 56, 10); ctx.fill();

    /* indicator transition band */
    if (s.show.band && ind.id !== 'none') {
      var yA = py(ind.hi), yB = py(ind.lo);
      ctx.fillStyle = 'rgba(240,98,146,0.13)';
      ctx.fillRect(GX, yA, GW, yB - yA);
      ctx.strokeStyle = 'rgba(240,98,146,0.34)';
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(GX, yA); ctx.lineTo(GX + GW, yA);
      ctx.moveTo(GX, yB); ctx.lineTo(GX + GW, yB); ctx.stroke();
      ctx.setLineDash([]);
      if (s.show.labels) {
        ctx.fillStyle = 'rgba(240,98,146,0.8)';
        ctx.font = '600 9.5px "Segoe UI", system-ui, sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(ind.name + '  ' + ind.lo.toFixed(1) + '\u2013' + ind.hi.toFixed(1), GX + 6, (yA + yB) / 2);
      }
    }

    /* grid */
    if (s.show.grid) {
      ctx.strokeStyle = 'rgba(255,255,255,0.055)'; ctx.lineWidth = 1;
      for (i = 0; i <= 14; i += 2) {
        ctx.beginPath(); ctx.moveTo(GX, py(i)); ctx.lineTo(GX + GW, py(i)); ctx.stroke();
      }
      var step = s.vmax <= 10 ? 1 : s.vmax <= 30 ? 5 : 10;
      for (i = 0; i <= s.vmax + 1e-6; i += step) {
        ctx.beginPath(); ctx.moveTo(vx(i), GY); ctx.lineTo(vx(i), GY + GH); ctx.stroke();
      }
    }

    /* neutral line */
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(GX, py(7)); ctx.lineTo(GX + GW, py(7)); ctx.stroke();
    ctx.setLineDash([]);

    /* axes */
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(GX, GY); ctx.lineTo(GX, GY + GH); ctx.lineTo(GX + GW, GY + GH);
    ctx.stroke();

    if (s.show.labels) {
      ctx.fillStyle = '#6b7a99';
      ctx.font = '600 9.5px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (i = 0; i <= 14; i += 2) ctx.fillText(String(i), GX - 6, py(i));
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      var st = s.vmax <= 10 ? 1 : s.vmax <= 30 ? 5 : 10;
      for (i = 0; i <= s.vmax + 1e-6; i += st) ctx.fillText(String(i), vx(i), GY + GH + 6);
      ctx.fillStyle = '#8b95b3';
      ctx.font = '600 10.5px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('Volume of ' + s.tR.formula + ' added  (mL)', GX + GW / 2, GY + GH + 26);
      ctx.save();
      ctx.translate(GX - 30, GY + GH / 2); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('pH', 0, 0);
      ctx.restore();
    }

    var reveal = hasExperiment() && !s.unknown;

    /* equivalence markers */
    if (s.show.equiv && reveal) {
      for (i = 0; i < s.veqs.length; i++) {
        var ve = s.veqs[i];
        if (ve > s.vmax) continue;
        var pe = phAt(ve);
        var sharp = s.veqSharp[i] === undefined ? 2 : s.veqSharp[i];
        var col = sharp === 2 ? '61,220,132' : sharp === 1 ? '245,200,66' : '120,134,166';
        ctx.strokeStyle = 'rgba(' + col + ',' + (sharp ? 0.5 : 0.3) + ')';
        ctx.setLineDash(sharp === 2 ? [5, 4] : [2, 5]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(vx(ve), GY); ctx.lineTo(vx(ve), GY + GH); ctx.stroke();
        if (sharp === 2) { ctx.beginPath(); ctx.moveTo(GX, py(pe)); ctx.lineTo(GX + GW, py(pe)); ctx.stroke(); }
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgb(' + col + ')';
        ctx.beginPath();
        ctx.arc(vx(ve), py(pe), sharp === 2 ? 4.2 : 3.2, 0, Math.PI * 2);
        if (sharp) ctx.fill(); else { ctx.lineWidth = 1.3; ctx.strokeStyle = 'rgb(' + col + ')'; ctx.stroke(); }
        if (s.show.labels) {
          ctx.font = '600 9.5px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          var lbl = s.veqs.length > 1 ? ('eq ' + (i + 1)) : 'equivalence';
          var tag = sharp === 2 ? '' : sharp === 1 ? '  (gradual)' : '  (no step)';
          ctx.fillText(lbl + '  ' + ve.toFixed(2) + ' mL' + tag, vx(ve), GY + GH - 8);
        }
      }
    }

    /* half-equivalence marker */
    if (s.show.halfeq && reveal && s.veqs.length) {
      var vh = s.veqs[0] / 2;
      if (vh <= s.vmax) {
        var phh = phAt(vh);
        ctx.strokeStyle = 'rgba(245,200,66,0.55)';
        ctx.setLineDash([4, 4]); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(vx(vh), py(phh)); ctx.lineTo(vx(vh), GY + GH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(GX, py(phh)); ctx.lineTo(vx(vh), py(phh)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f5c842';
        ctx.beginPath(); ctx.arc(vx(vh), py(phh), 3.6, 0, Math.PI * 2); ctx.fill();
        if (s.show.labels) {
          ctx.font = '600 9.5px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
          ctx.fillText('\u00bd eq \u2014 pH ' + phh.toFixed(2), vx(vh) + 6, py(phh) - 5);
        }
      }
    }

    /* derivative overlay */
    if (s.show.deriv && s.deriv.length) {
      var dmax = 0;
      for (i = 0; i < s.deriv.length; i++) if (s.deriv[i].d > dmax) dmax = s.deriv[i].d;
      if (dmax > 0) {
        ctx.strokeStyle = 'rgba(255,171,64,0.75)'; ctx.lineWidth = 1.4;
        ctx.beginPath();
        var started = false;
        for (i = 0; i < s.deriv.length; i++) {
          var dpt = s.deriv[i];
          if (dpt.v > s.vmax) break;
          var dy = GY + GH - (dpt.d / dmax) * GH * 0.92;
          if (!started) { ctx.moveTo(vx(dpt.v), dy); started = true; }
          else ctx.lineTo(vx(dpt.v), dy);
        }
        ctx.stroke();
        if (s.show.labels) {
          ctx.fillStyle = 'rgba(255,171,64,0.9)';
          ctx.font = '600 9.5px "Segoe UI", system-ui, sans-serif';
          ctx.textAlign = 'right'; ctx.textBaseline = 'top';
          ctx.fillText('dpH/dV (scaled)', GX + GW - 6, GY + 4);
        }
      }
    }

    /* The curve — solid up to the current volume, ghosted beyond. The ghost is
       the shape you are about to trace, which is a teaching aid mid-run but
       hands over the whole answer before a single drop, so it waits until the
       titration has actually started. */
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (hasExperiment() && !s.unknown) {
      ctx.strokeStyle = 'rgba(240,98,146,0.22)'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (i = 0; i < s.curve.length; i++) {
        var c = s.curve[i];
        if (c.v > s.vmax) break;
        if (i === 0) ctx.moveTo(vx(c.v), py(c.ph)); else ctx.lineTo(vx(c.v), py(c.ph));
      }
      ctx.stroke();
    }

    ctx.strokeStyle = '#f06292'; ctx.lineWidth = 2.4;
    ctx.beginPath();
    var drawn = false;
    for (i = 0; i < s.curve.length; i++) {
      var cc = s.curve[i];
      if (cc.v > s.v + 1e-9 || cc.v > s.vmax) break;
      if (!drawn) { ctx.moveTo(vx(cc.v), py(cc.ph)); drawn = true; }
      else ctx.lineTo(vx(cc.v), py(cc.ph));
    }
    if (s.v <= s.vmax) ctx.lineTo(vx(s.v), py(phAt(s.v)));
    ctx.stroke();

    /* current point */
    if (s.v <= s.vmax) {
      var cxp = vx(s.v), cyp = py(phAt(s.v));
      ctx.fillStyle = 'rgba(240,98,146,0.25)';
      ctx.beginPath(); ctx.arc(cxp, cyp, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cxp, cyp, 4, 0, Math.PI * 2); ctx.fill();
    }

    /* scrub cursor */
    if (s.scrubV != null && s.scrubV >= 0 && s.scrubV <= s.vmax) {
      var sph = phAt(s.scrubV);
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(vx(s.scrubV), GY); ctx.lineTo(vx(s.scrubV), GY + GH); ctx.stroke();
      ctx.setLineDash([]);
      var tw = 92, tx = Math.min(GX + GW - tw, Math.max(GX, vx(s.scrubV) - tw / 2));
      ctx.fillStyle = 'rgba(13,17,23,0.9)';
      roundRect(ctx, tx, GY + 4, tw, 32, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#dde3f0';
      ctx.font = '600 9.5px "Courier New", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(s.scrubV.toFixed(2) + ' mL', tx + tw / 2, GY + 8);
      ctx.fillStyle = '#f06292';
      ctx.fillText('pH ' + sph.toFixed(2), tx + tw / 2, GY + 21);
    }

    if (!hasExperiment()) {
      ctx.fillStyle = 'rgba(150,163,192,0.75)';
      ctx.font = '600 12.5px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Deliver titrant to trace the curve', GX + GW / 2, GY + GH * 0.42);
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(150,163,192,0.55)';
      ctx.fillText('equivalence volume and indicator error appear once the titration starts',
                   GX + GW / 2, GY + GH * 0.42 + 20);
    }

    /* title */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '700 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(s.aR.formula + '  titrated with  ' + s.tR.formula, GX, GY - 20);
  }

  /* ── 10. Readouts & live equations ─────────────────────────── */

  var eqCache = { eq: '', calc: '' };

  function updateReadouts() {
    var s = state, ph = phAt(s.v);
    $('ro-vol').textContent = s.v.toFixed(2) + ' mL';
    $('ro-read').textContent = (s.burStart + s.v).toFixed(2) + ' mL';
    updateReportBtns();
    $('ro-ph').textContent  = ph.toFixed(2);
    var last = s.veqs[s.veqs.length - 1];
    /* In unknown-sample mode every readout computed FROM the analyte
       concentration is hidden — otherwise the answer is on screen and the
       titration is decorative. What stays is what an experimenter can actually
       observe: the burette, the titre and the pH. */
    if (s.unknown || !hasExperiment()) {
      var mark = s.unknown ? '?' : '\u2014';
      $('ro-veq').textContent = mark;   $('ro-veq').className = 'ro-value';
      $('ro-pheq').textContent = mark;
      $('ro-end').textContent = mark;   $('ro-end').className = 'ro-value';
      $('ro-err').textContent = mark;   $('ro-err').className = 'ro-value';
      updateEquations();
      return;
    }
    var veqEl = $('ro-veq');
    veqEl.textContent = s.veqs.length > 1
      ? s.veqs.map(function (x) { return x.toFixed(2); }).join(' / ') + ' mL'
      : last.toFixed(2) + ' mL';
    /* An equivalence volume the burette cannot deliver, or one smaller than a
       single drop, is a real experimental-design failure — say so rather than
       printing a number the apparatus can never reach. */
    veqEl.className = 'ro-value';
    veqEl.title = '';
    if (last > s.vmaxDeliver) {
      veqEl.className = 'ro-value bad';
      veqEl.textContent = last.toFixed(0) + ' mL \u2014 exceeds burette';
      veqEl.title = 'The titrant is too dilute: ' + last.toFixed(0) +
        ' mL cannot be delivered from a 50 mL burette. Use a more concentrated titrant or less analyte.';
    } else if (last < 0.5) {
      veqEl.className = 'ro-value warn';
      veqEl.title = 'The titrant is far more concentrated than the analyte — the whole titration is under one drop, so the end point cannot be found accurately.';
    }
    $('ro-pheq').textContent = phAt(Math.min(last, s.vmaxDeliver)).toFixed(2);

    var endEl = $('ro-end'), errEl = $('ro-err');
    endEl.className = 'ro-value'; errEl.className = 'ro-value';
    if (s.endV == null) {
      endEl.textContent = indicator(s.ind).id === 'none' ? 'no indicator' : 'not reached';
      errEl.textContent = '\u2014';
    } else {
      endEl.textContent = s.endV.toFixed(2) + ' mL';
      var e = s.errPct;
      var mag = Math.abs(e);
      errEl.textContent = (e >= 0 ? '+' : '\u2212') + mag.toFixed(2) + ' %';
      errEl.className = 'ro-value ' + (mag <= 0.5 ? 'ok' : mag <= 2 ? 'warn' : 'bad');
    }
    updateEquations();
  }

  function updateEquations() {
    var s = state, ph = phAt(s.v);
    if (s.unknown) {
      var uh = '<div class="eq-note">The analyte concentration is hidden. Titrate to a reproducible end point, record concordant titres, then work it out:</div>' +
               '<div class="eq-line">\\[ c_a = \\frac{c_t \\, V_t}{V_a} \\times \\frac{z_t}{z_a} \\]</div>' +
               '<div class="eq-note">where \\( z_a \\) and \\( z_t \\) are the protons transferred per formula unit \u2014 here ' +
               s.aR.formula + ' gives \\( z_a = ' + s.aR.eq + ' \\) and ' + s.tR.formula + ' gives \\( z_t = ' + s.tR.eq + ' \\), so the factor is ' +
               s.tR.eq + '/' + s.aR.eq + '.</div>' +
               '<div class="eq-note">Known: titrant ' + s.tR.formula + ' at ' + s.ct.toFixed(4) +
               ' mol dm\u207b\u00b3 \u00b7 aliquot ' + s.va.toFixed(2) + ' mL. Use \\( V_t \\) = your mean concordant titre.</div>';
      if (uh !== eqCache.eq) { $('lp-eq-body').innerHTML = uh; eqCache.eq = uh; }
      return;
    }
    var nA = s.ca * s.va / 1000, nT = s.ct * s.v / 1000;
    var last = s.veqs[s.veqs.length - 1];
    var ind = indicator(s.ind);

    var html = '';
    html += '<div class="eq-line">\\[ n_{\\text{analyte}} = c_a V_a = ' + s.ca.toFixed(3) +
            ' \\times ' + (s.va / 1000).toFixed(4) + ' = ' + nA.toExponential(3) + '\\ \\text{mol} \\]</div>';
    html += '<div class="eq-line">\\[ n_{\\text{titrant}} = c_t V_t = ' + s.ct.toFixed(3) +
            ' \\times ' + (s.v / 1000).toFixed(4) + ' = ' + nT.toExponential(3) + '\\ \\text{mol} \\]</div>';
    html += '<div class="eq-line">\\[ V_{eq} = \\frac{c_a V_a \\cdot z_a}{c_t \\cdot z_t} = \\frac{' +
            s.ca.toFixed(3) + ' \\times ' + s.va.toFixed(1) + ' \\times ' + s.aR.eq + '}{' +
            s.ct.toFixed(3) + ' \\times ' + s.tR.eq + '} = ' + last.toFixed(2) + '\\ \\text{mL} \\]</div>';

    if (s.aSys && !s.aR.strong && s.aR.kind === 'acid') {
      html += '<div class="eq-note">Weak acid \u2014 in the buffer region the Henderson\u2013Hasselbalch equation applies:</div>';
      html += '<div class="eq-line">\\[ \\text{pH} = \\text{p}K_a + \\log\\frac{[\\text{A}^-]}{[\\text{HA}]} ' +
              '\\quad\\Rightarrow\\quad \\text{pH}\\big|_{V=\\frac{1}{2}V_{eq}} = \\text{p}K_a = ' +
              s.aR.sys.pKa[0].toFixed(2) + ' \\]</div>';
    }

    html += '<div class="eq-note">pH itself is solved from the charge balance of the mixture, not from a piecewise approximation:</div>';
    html += '<div class="eq-line">\\[ [\\text{H}^+] - \\frac{K_w}{[\\text{H}^+]} + \\sum_i F_i\\left(z_i - \\bar{n}_i\\right) = 0 ' +
            '\\quad\\Rightarrow\\quad \\text{pH} = ' + ph.toFixed(2) + ' \\]</div>';

    if (ind.id !== 'none' && s.endV != null) {
      html += '<div class="eq-line">\\[ \\text{error} = \\frac{V_{end} - V_{eq}}{V_{eq}} \\times 100 = \\frac{' +
              s.endV.toFixed(2) + ' - ' + s.veqs[s.errRef].toFixed(2) + '}{' + s.veqs[s.errRef].toFixed(2) +
              '} \\times 100 = ' + s.errPct.toFixed(2) + '\\,\\% \\]</div>';
    }

    if (html !== eqCache.eq) { $('lp-eq-body').innerHTML = html; eqCache.eq = html; }
  }

  function buildCalcModal() {
    var s = state, ph = phAt(s.v);
    var nA = s.ca * s.va / 1000, nT = s.ct * s.v / 1000;
    var last = s.veqs[s.veqs.length - 1];
    var ratio = s.aR.eq + ' : ' + s.tR.eq;
    var h = '';

    h += '<h4>1. What is in the flask</h4>';
    h += '<p>' + s.va.toFixed(1) + ' mL of ' + s.ca.toFixed(3) + ' M ' + s.aR.name +
         ' (' + s.aR.formula + '), a ' + (s.aR.strong ? 'strong' : 'weak') + ' ' + s.aR.kind +
         ' donating/accepting ' + s.aR.eq + ' proton' + (s.aR.eq > 1 ? 's' : '') + ' per formula unit.</p>';
    h += '<div class="eq-line">\\[ n_a = c_a V_a = ' + s.ca.toFixed(3) + '\\ \\text{mol L}^{-1} \\times ' +
         (s.va / 1000).toFixed(4) + '\\ \\text{L} = ' + nA.toExponential(3) + '\\ \\text{mol} \\]</div>';

    h += '<h4>2. Reaction stoichiometry</h4>';
    h += '<p>Mole ratio analyte : titrant is ' + ratio + '.</p>';

    h += '<h4>3. Equivalence volume</h4>';
    h += '<div class="eq-line">\\[ V_{eq} = \\frac{n_a \\cdot z_a}{c_t \\cdot z_t} = \\frac{' +
         nA.toExponential(3) + ' \\times ' + s.aR.eq + '}{' + s.ct.toFixed(3) + ' \\times ' + s.tR.eq +
         '} = ' + (last / 1000).toExponential(3) + '\\ \\text{L} = ' + last.toFixed(2) + '\\ \\text{mL} \\]</div>';
    if (s.veqs.length > 1) {
      h += '<p>Because ' + s.aR.formula + ' transfers ' + s.aR.eq + ' protons there are ' + s.veqs.length +
           ' equivalence points, at ' + s.veqs.map(function (x) { return x.toFixed(2) + ' mL'; }).join(' and ') + '.</p>';
    }

    h += '<h4>4. Current state</h4>';
    h += '<div class="eq-line">\\[ n_t = c_t V_t = ' + s.ct.toFixed(3) + ' \\times ' + (s.v / 1000).toFixed(4) +
         ' = ' + nT.toExponential(3) + '\\ \\text{mol} \\]</div>';
    h += '<p>Delivered ' + s.v.toFixed(2) + ' mL of ' + s.tR.formula + ', which is ' +
         (last > 0 ? (s.v / last * 100).toFixed(1) : '0') + '% of the way to the final equivalence point. ' +
         'Total volume in the flask is ' + (s.va + s.v).toFixed(2) + ' mL.</p>';
    h += '<div class="eq-line">\\[ \\text{pH} = ' + ph.toFixed(2) + ' \\]</div>';

    h += '<h4>5. Indicator</h4>';
    var ind = indicator(s.ind);
    if (ind.id === 'none') {
      h += '<p>No indicator selected. The equivalence point can still be located from the peak of the dpH/dV curve \u2014 switch that layer on in the Display panel.</p>';
    } else if (s.endV == null) {
      h += '<p>' + ind.name + ' changes over pH ' + ind.lo.toFixed(1) + '\u2013' + ind.hi.toFixed(1) +
           ', which this titration never reaches. The indicator would not change colour at all.</p>';
    } else {
      var mag = Math.abs(s.errPct);
      var verdict = mag <= 0.5 ? 'Suitable \u2014 the error is within the 0.5% normally accepted for volumetric analysis.'
        : mag <= 2 ? 'Marginal \u2014 usable for a rough titration but it will bias the result.'
        : 'Unsuitable \u2014 the colour change happens well away from the equivalence point.';
      h += '<p>' + ind.name + ' changes over pH ' + ind.lo.toFixed(1) + '\u2013' + ind.hi.toFixed(1) +
           ', reaching its midpoint (pH ' + ((ind.lo + ind.hi) / 2).toFixed(2) + ') at ' + s.endV.toFixed(2) + ' mL.</p>';
      h += '<div class="eq-line">\\[ \\text{titration error} = \\frac{' + s.endV.toFixed(2) + ' - ' +
           s.veqs[s.errRef].toFixed(2) + '}{' + s.veqs[s.errRef].toFixed(2) + '} \\times 100 = ' +
           s.errPct.toFixed(2) + '\\,\\% \\]</div>';
      h += '<p><strong>' + verdict + '</strong></p>';
    }

    if (h !== eqCache.calc) { $('calc-modal-body').innerHTML = h; eqCache.calc = h; }
  }

  /* ── 11. Titrant delivery ──────────────────────────────────── */

  var lastDripAt = 0, crossedEnd = false;

  function spawnDrop() {
    if (state.drops.length < 6) state.drops.push({ y: JET_Y + 4, vy: 1.4 });
  }

  function deliver(ml) {
    var s = state;
    s.v = Math.min(s.vmaxDeliver, s.v + ml);
    spawnDrop();
    var now = performance.now();
    if (now - lastDripAt > 70) { playDrip(); lastDripAt = now; }
    if (!crossedEnd && s.endV != null && s.v >= s.endV) { crossedEnd = true; playEnd(); }
    refresh();
  }

  function resetTitration() {
    state.v = 0; state.drops = []; state.splashes = []; state.flashes = []; crossedEnd = false;
    state.burStart = Math.round(Math.random() * 12) * 0.05;   /* 0.00–0.60, to 0.05 */
    state.running = false;
    $('btn-run').classList.remove('running');
    $('btn-run').innerHTML = '\u25b6 Run';
    refresh();
  }

  /* ── 12. Animation loop ────────────────────────────────────── */

  var rafId = null;

  function tick() {
    rafId = null;
    var s = state, now = performance.now(), i;
    var surfaceY = solutionTopY(s.va + s.v);

    /* drops accelerate under gravity and land ON the liquid surface */
    for (i = s.drops.length - 1; i >= 0; i--) {
      var d = s.drops[i];
      d.vy += 0.55;
      d.y += d.vy;
      if (d.y >= surfaceY) {
        s.drops.splice(i, 1);
        s.splashes.push({ t: now });
        /* Close to the end point the local excess is nearly enough to flip the
           indicator, so the flash is stronger and takes longer to swirl out. */
        var k = 0;
        if (s.endV != null && s.endV > 0) {
          var d2 = Math.abs(s.v - s.endV) / s.endV;
          k = Math.max(0, 1 - d2 / 0.08);
        }
        if (k > 0.02) s.flashes.push({ t: now, k: k, life: 380 + 900 * k });
      }
    }
    while (s.splashes.length && now - s.splashes[0].t > 460) s.splashes.shift();
    while (s.flashes.length && now - s.flashes[0].t > s.flashes[0].life) s.flashes.shift();

    if (s.running) {
      /* slow the flow where the curve is steep, so the end point is visible */
      var slope = Math.abs(phAt(s.v + 0.05) - phAt(s.v)) / 0.05;
      var rate = slope > 4 ? 0.012 : slope > 1 ? 0.05 : 0.22;
      deliverQuiet(rate);
      if (now - lastDripAt > 110) { playDrip(); lastDripAt = now; spawnDrop(); }
      /* A real titration stops when the colour changes, not when the burette
         empties. Without this, Run always delivered the full 100 mL and every
         recorded titre was 100.00 or wherever the user happened to hit pause. */
      var stopAt = s.endV != null ? s.endV
                 : (s.veqs.length ? s.veqs[s.veqs.length - 1] : null);
      var done = false;
      if (stopAt != null && stopAt <= s.vmaxDeliver && s.v >= stopAt + s.runOvershoot) {
        done = true; s.runHitCap = false;
      } else if (s.v >= s.vmaxDeliver - 1e-9) {
        done = true; s.runHitCap = true;      /* end point never reached */
      }
      if (done) {
        s.running = false;
        $('btn-run').classList.remove('running');
        $('btn-run').innerHTML = '\u25b6 Run';
      }
    }

    updateReadouts();
    draw();
    if (s.running || s.drops.length || s.splashes.length || s.flashes.length) schedule();
  }

  function deliverQuiet(ml) {
    var s = state;
    s.v = Math.min(s.vmaxDeliver, s.v + ml);
    if (!crossedEnd && s.endV != null && s.v >= s.endV) { crossedEnd = true; playEnd(); }
  }

  function schedule() { if (rafId == null) rafId = requestAnimationFrame(tick); }

  function refresh() { updateReadouts(); draw(); schedule(); }

  /* ── 13. Explore content ───────────────────────────────────── */

  var EXPLORE = {
    basics: [
      { title: 'What a titration actually measures',
        body: 'A titration finds an unknown concentration by reacting it with a solution of accurately known concentration \u2014 the standard solution. Titrant is delivered from a burette into a fixed volume of analyte in a conical flask until the reaction is exactly complete. Each burette reading carries an uncertainty of about \u00b10.05 mL, and a titre is the difference of two readings, so a typical 25 mL titre is good to roughly \u00b10.10 mL \u2014 about 0.4%. Repeating and averaging concordant titres improves the precision, but not that underlying reading uncertainty.',
        formula: 'n = c \u00d7 V',
        note: 'The volume delivered at the end point is called the titre. Three titres agreeing within 0.10 mL are described as concordant, and only those are averaged.' },
      { title: 'The apparatus and why each piece matters',
        body: 'The burette delivers a measured, variable volume. The pipette delivers one fixed, accurate volume of analyte (the aliquot). The conical flask is used rather than a beaker because it can be swirled vigorously without splashing \u2014 hand-swirling is the standard school method. The white tile underneath makes the first permanent colour change easy to judge, and leaving it out costs marks in practical assessments.',
        formula: 'burette + pipette + conical flask + white tile',
        note: 'A magnetic stirrer (the Stirrer chip in the Display panel) replaces hand-swirling in potentiometric and automated titrations, where both hands are needed and the mixing rate must be reproducible. It is not the usual school setup, which is why the white tile is the default here.' },
      { title: 'End point versus equivalence point',
        body: 'The equivalence point is where the moles balance stoichiometrically \u2014 a calculated quantity. The end point is where the indicator changes colour \u2014 an observed quantity. They are not the same thing, and the difference between them is the titration error. Choosing an indicator is the act of making that error negligible.',
        formula: 'error % = (V_end \u2212 V_eq) / V_eq \u00d7 100',
        note: 'Volumetric analysis normally accepts an error below 0.5%. The readout panel colours the error green, amber or red against that threshold.' },
      { title: 'The four curve types',
        body: 'Strong acid with strong base gives a symmetrical curve with equivalence at pH 7 and a steep section spanning roughly pH 3 to 11. Weak acid with strong base starts higher, has a buffer plateau, and reaches equivalence in the basic region. Strong acid with weak base is the mirror image, reaching equivalence in the acidic region. Weak with weak has almost no steep section at all.',
        note: 'Load each combination in Simulate mode and watch the steep section shrink as the reagents get weaker. That shrinkage is exactly why weak\u2013weak titrations are not done.' }
    ],
    curves: [
      { title: 'Why the curve is steep at the equivalence point',
        body: 'Approaching equivalence, almost all the analyte has reacted, so each additional drop changes the ratio of what remains enormously. One drop \u2014 about 0.05 mL \u2014 can take the solution from a large excess of acid to a large excess of base, swinging the pH by five or six units. Away from equivalence the same drop changes the ratio only slightly, so the curve is flat.',
        note: 'Turn on the dpH/dV layer: its sharp peak is the mathematical statement of that steepness, and its position is the equivalence point.' },
      { title: 'The buffer region and half-equivalence',
        body: 'Between the start and the equivalence point of a weak acid titration, the flask contains both the weak acid and its conjugate base \u2014 a buffer. The pH changes only slowly here. At exactly half the equivalence volume the two are present in equal concentration, so the log term in the Henderson\u2013Hasselbalch equation vanishes and the pH equals the pKa.',
        formula: 'pH = pK\u2090 + log([A\u207b]/[HA])  \u2192  pH = pK\u2090 at \u00bdV_eq',
        note: 'This is the standard laboratory method for measuring an unknown pKa: titrate, then read the pH at half the titre.' },
      { title: 'Why equivalence is rarely pH 7',
        body: 'At equivalence the flask contains only the salt. If that salt comes from a weak acid, its anion is a base and hydrolyses water to give hydroxide, so the pH is above 7. If it comes from a weak base, the cation is an acid and the pH falls below 7. Only a salt of a strong acid and a strong base is genuinely neutral \u2014 and even then \u201cneutral = pH 7\u201d holds only at 25 \u00b0C, because K\u1d65 itself changes with temperature.',
        formula: '0.1 M CH\u2083COOH + NaOH \u2192 equivalence at pH \u2248 8.7',
        note: 'The weaker the parent acid or base, the further equivalence is displaced. Titrate methanoic acid (pK\u2090 3.75) and then ethanoic acid (pK\u2090 4.76) and compare.' },
      { title: 'Diprotic acids and double end points',
        body: 'An acid with two ionisable protons has two equivalence points, the second at exactly twice the volume of the first \u2014 but a stoichiometric equivalence point is only a usable END POINT if the curve actually steps there. The two protons separate cleanly only when their pK\u2090 values differ by roughly 4 or more. Sodium carbonate (pK\u2090 6.35 and 10.33, a difference of 3.98) just manages it, which is why its first end point is real but notoriously gradual.',
        formula: 'CO\u2083\u00b2\u207b \u2192 HCO\u2083\u207b \u2192 H\u2082CO\u2083   \u00b7   \u0394pK\u2090 \u2273 4 for a separate end point',
        note: 'The simulator measures the pH step at each equivalence point and marks it accordingly: a filled green marker for a sharp end point, amber for a gradual one, and a hollow grey marker labelled \u201cno step\u201d where the stoichiometry is real but nothing is detectable. Load Na\u2082CO\u2083 against HCl and compare its two markers.' },
      { title: 'When the first equivalence point cannot be seen',
        body: 'Sulfuric acid and ethanedioic (oxalic) acid both have two protons, yet each gives only one usable end point. Sulfuric acid\u2019s first proton is strong, so it is already gone before the titration begins and no step forms at the halfway volume. Oxalic acid\u2019s pK\u2090 values are 1.25 and 4.27, a gap of only 3.0, so the two ionisations overlap and the first point washes out. In both cases the titre you can actually measure corresponds to BOTH protons.',
        formula: 'H\u2082SO\u2084: no first step \u00b7 H\u2082C\u2082O\u2084: \u0394pK\u2090 = 3.0, first point lost',
        note: 'Load either against NaOH and watch the first marker render hollow and grey. The mole ratio for the calculation is therefore 1 : 2, not 1 : 1 \u2014 a very common exam slip.' },
      { title: 'What dilution does to the curve',
        body: 'Diluting both solutions by the same factor leaves the equivalence volume unchanged \u2014 the mole ratio is untouched. What shrinks is the steep section, from both ends: the starting pH is closer to neutral and the excess after equivalence is smaller. For a strong acid against a strong base, a single 0.05 mL drop at the equivalence point swings the pH by about 5.4 units at 0.1 M, but only about 3.4 units at 0.01 M and under 1.5 units at 0.001 M \u2014 by then no indicator can give a sharp end point.',
        formula: '0.1 M \u2192 5.4 pH units per drop \u00b7 0.01 M \u2192 3.4 \u00b7 0.001 M \u2192 1.4',
        note: 'Drag both concentration sliders down to their 0.01 M minimum and compare the dpH/dV peak height with the same run at 0.1 M. Fewer indicators stay inside the steep section as it flattens.' }
    ],
    indicators: [
      { title: 'How an indicator works',
        body: 'An indicator is itself a weak acid whose protonated form (HIn) and deprotonated form (In\u207b) are different colours. Adding acid pushes the equilibrium towards HIn, adding base towards In\u207b. The eye perceives the change when the ratio of the two forms passes roughly ten to one in each direction, which corresponds to pK_In \u00b1 1 \u2014 hence the roughly two-unit transition range.',
        formula: 'HIn \u21cc H\u207a + In\u207b,  pH = pK_In + log([In\u207b]/[HIn])',
        note: 'Only a drop or two of indicator is added. More would consume a measurable amount of titrant and shift the end point.' },
      { title: 'Choosing the right indicator',
        body: 'The rule is that the transition range must lie inside the steep section of the curve. Because that section is traversed in a fraction of a drop, any indicator satisfying the condition marks the end point to within a few tenths of a percent \u2014 for 0.1 M strong acid against strong base five of the six indicators here land inside \u00b10.2%, and only methyl orange drifts to \u22120.68%. An indicator changing colour outside the steep section instead changes gradually over several millilitres, giving both a vague end point and a large systematic error.',
        note: 'Switch on the indicator band layer. If the shaded strip crosses the near-vertical part of the curve, the indicator is right \u2014 and the error readout will confirm it in numbers.' },
      { title: 'Transition ranges worth memorising',
        body: 'Methyl orange changes red to yellow over pH 3.1\u20134.4 and suits strong acid with weak base. Methyl red is red to yellow over 4.4\u20136.2. Bromothymol blue is yellow to blue over 6.0\u20137.6 and is ideal for strong with strong. Phenolphthalein is colourless to pink over 8.3\u201310.0 and suits weak acid with strong base. Thymolphthalein is colourless to blue over 9.3\u201310.5.',
        note: 'For strong acid against strong base the steep section spans roughly pH 3 to 11, so every indicator in this simulator lands inside it \u2014 the largest error of the six is methyl orange at only \u22120.36%. That is the one case where the choice genuinely does not matter.' },
      { title: 'Why phenolphthalein for weak acid and strong base',
        body: 'Ethanoic acid neutralised by sodium hydroxide gives sodium ethanoate, which hydrolyses to about pH 8.7. The steep section runs roughly pH 7 to 11, entirely in the basic region. Phenolphthalein sits inside it. Methyl orange would change colour around pH 3.7, at which point the titration is barely started and a large volume of acid remains unreacted.',
        note: 'Set up ethanoic acid against NaOH, select methyl orange, and read the titration error \u2014 it is a large negative number, meaning the end point arrives far too early.' }
    ],
    calcs: [
      { title: 'Finding an unknown concentration',
        body: 'Convert the titre to moles of titrant, apply the mole ratio from the balanced equation, then divide by the analyte volume. For a one-to-one reaction this collapses to the familiar cross-multiplication.',
        formula: 'c\u2090V\u2090 = c_b V_b   (1:1 only)',
        note: 'Worked example: 25.0 mL of NaOH needs 22.4 mL of 0.100 M HCl. n(HCl) = 0.100 \u00d7 0.0224 = 2.24 \u00d7 10\u207b\u00b3 mol, so n(NaOH) = 2.24 \u00d7 10\u207b\u00b3 mol and c = 2.24 \u00d7 10\u207b\u00b3 / 0.0250 = 0.0896 M.' },
      { title: 'When the ratio is not one to one',
        body: 'Sulfuric acid supplies two protons per molecule, so one mole reacts with two moles of sodium hydroxide. The moles of titrant must be divided by two before being used as moles of acid. Getting this ratio wrong is the single most common calculation error in titration questions.',
        formula: 'H\u2082SO\u2084 + 2NaOH \u2192 Na\u2082SO\u2084 + 2H\u2082O',
        note: 'Worked example: 25.0 mL of H\u2082SO\u2084 needs 30.0 mL of 0.100 M NaOH. n(NaOH) = 3.00 \u00d7 10\u207b\u00b3 mol, so n(H\u2082SO\u2084) = 1.50 \u00d7 10\u207b\u00b3 mol and c = 1.50 \u00d7 10\u207b\u00b3 / 0.0250 = 0.0600 M.' },
      { title: 'Percentage purity',
        body: 'Titrate a weighed impure sample, find the moles of the active substance, convert to mass using the molar mass, and express that as a percentage of the mass weighed out. The impurity is assumed not to react with the titrant.',
        formula: 'purity % = (m_found / m_weighed) \u00d7 100',
        note: 'Worked example: 1.50 g of impure Na\u2082CO\u2083 needs 24.0 mL of 0.500 M HCl. n(HCl) = 0.0120 mol, so n(Na\u2082CO\u2083) = 0.00600 mol, mass = 0.00600 \u00d7 106 = 0.636 g, purity = 42.4%.' },
      { title: 'Back titration',
        body: 'When the analyte is insoluble, slow to react, or volatile, add a known excess of reagent, let it react completely, then titrate the leftover excess. The amount consumed by the analyte is the difference between what was added and what was left.',
        formula: 'n_reacted = n_added \u2212 n_leftover',
        note: 'This is how the calcium carbonate content of an eggshell or an antacid tablet is measured: dissolve in excess standard HCl, then titrate the unreacted HCl with standard NaOH.' }
    ],
    technique: [
      { title: 'What this model assumes',
        body: 'The pH here is the exact solution of the charge-balance equation, but that equation itself rests on four idealisations, all standard at school and introductory-undergraduate level. Concentrations are used in place of activities, so no ionic-strength correction is applied \u2014 at 0.1 M this shifts a real pH by roughly 0.1 unit. Everything is at 25 \u00b0C, where K\u1d65 = 1.0 \u00d7 10\u207b\u00b9\u2074; at 50 \u00b0C neutral water is nearer pH 6.6. No carbon dioxide is absorbed from the air, which in a real lab slowly degrades standard sodium hydroxide. And the indicator is treated as a spectator, though being a weak acid itself it does consume a trace of titrant.',
        formula: 'activities \u2248 concentrations \u00b7 25 \u00b0C \u00b7 CO\u2082-free \u00b7 indicator not consumed',
        note: 'These are the same assumptions your textbook makes when it derives pH = pK\u2090 at half-equivalence. They are why a measured curve sits a little off a calculated one, and why real analytical work quotes ionic strength alongside pK values.' },
      { title: 'The rough-then-accurate method',
        body: 'The first titration is run quickly to find the approximate titre. Subsequent runs are then delivered fast to within about one millilitre of that value and dropwise thereafter. This is the only practical way to get a precise end point without wasting a whole afternoon, and it is what the Drop button in this simulator reproduces.',
        note: 'Run the titration once with Run to find the titre, then Reset and use +1 mL followed by Drop to land on the end point exactly.' },
      { title: 'Two real effects this model leaves out',
        body: 'The carbonate second end point is sharpened in a real laboratory by boiling the solution near the end point to drive off dissolved carbon dioxide, then cooling and completing the titration; without that step the buffering by carbonic acid keeps the change gradual, which is what you see here. Standard sodium hydroxide also absorbs carbon dioxide from the air over time, forming carbonate and slowly lowering its effective concentration \u2014 the reason it is restandardised and kept stoppered.',
        note: 'Neither is simulated. The first would make the Na\u2082CO\u2083 second end point sharper than shown; the second would make a bench bottle of NaOH read slightly weak than its label.' },
      { title: 'Common sources of error',
        body: 'Reading the burette from above or below eye level introduces parallax error \u2014 the eye must be level with the bottom of the meniscus. An air bubble in the burette tip escapes during the titration and inflates the apparent titre. Failing to wash the flask walls down before the end point leaves splashed analyte unreacted. Overshooting by even one drop past a sharp end point is an unrecoverable error on that run.',
        note: 'Systematic errors like an uncalibrated burette shift every result the same way and are not revealed by repeating the titration. Only random errors are averaged out.' },
      { title: 'Why concordant titres matter',
        body: 'A single titre proves nothing about precision. Repeat until three consecutive results agree within 0.10 mL, then average only those three. A result that disagrees is discarded rather than averaged in \u2014 including it would drag the mean towards a known mistake.',
        note: 'The rough first titration is never included in the average, even if it happens to agree.' },
      { title: 'Reading the burette correctly',
        body: 'A burette is graduated from zero at the top downwards, so the titre is the final reading minus the initial reading. Both readings are recorded to two decimal places, the second decimal being an estimate between the 0.1 mL graduations. The uncertainty in each reading is about \u00b10.05 mL, so the uncertainty in the titre is about \u00b10.10 mL.',
        formula: 'titre = final reading \u2212 initial reading',
        note: 'Percentage uncertainty falls as the titre grows, which is why titres are designed to fall in the 20\u201330 mL range rather than at 5 mL.' }
    ]
  };

  function renderExplore(cat) {
    var cards = EXPLORE[cat] || [], html = '', i;
    for (i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<div class="explore-card"><h3>' + c.title + '</h3>';
      html += '<p>' + c.body + '</p>';
      if (c.formula) html += '<div class="ec-formula">' + c.formula + '</div>';
      if (c.note) html += '<div class="ec-example">' + c.note + '</div>';
      html += '</div>';
    }
    $('explore-cards').innerHTML = html;
  }

  /* ── 14. Practice mode ─────────────────────────────────────── */

  function rnd(a, b, dp) {
    var v = a + Math.random() * (b - a);
    return dp == null ? v : parseFloat(v.toFixed(dp));
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function makeProblem() {
    var type = Math.floor(Math.random() * 8);
    var ca, cb, va, vb, n, q;

    if (type === 0) {                              /* unknown concentration, 1:1 */
      cb = rnd(0.05, 0.25, 3); va = rnd(20, 25, 1); vb = rnd(18, 32, 2);
      ca = cb * vb / va;
      return { kind: 'num', unit: 'M', tol: 0.002,
        text: va.toFixed(1) + ' mL of a hydrochloric acid solution of unknown concentration required ' +
              vb.toFixed(2) + ' mL of ' + cb.toFixed(3) + ' M sodium hydroxide to reach the end point. ' +
              'Calculate the concentration of the acid.',
        ans: ca,
        sol: 'HCl + NaOH \u2192 NaCl + H\u2082O, so the ratio is 1 : 1.\n' +
             'n(NaOH) = ' + cb.toFixed(3) + ' \u00d7 ' + (vb / 1000).toFixed(5) + ' = ' + (cb * vb / 1000).toExponential(3) + ' mol\n' +
             'n(HCl) = same = ' + (cb * vb / 1000).toExponential(3) + ' mol\n' +
             'c(HCl) = n / V = ' + (cb * vb / 1000).toExponential(3) + ' / ' + (va / 1000).toFixed(4) + ' = ' + ca.toFixed(4) + ' M' };
    }

    if (type === 1) {                              /* 1:2 ratio */
      cb = rnd(0.08, 0.20, 3); va = 25.0; vb = rnd(20, 36, 2);
      ca = cb * vb / (2 * va);
      return { kind: 'num', unit: 'M', tol: 0.002,
        text: va.toFixed(1) + ' mL of sulfuric acid required ' + vb.toFixed(2) + ' mL of ' + cb.toFixed(3) +
              ' M sodium hydroxide for complete neutralisation. Calculate the concentration of the sulfuric acid.',
        ans: ca,
        sol: 'H\u2082SO\u2084 + 2NaOH \u2192 Na\u2082SO\u2084 + 2H\u2082O, so the ratio is 1 : 2.\n' +
             'n(NaOH) = ' + cb.toFixed(3) + ' \u00d7 ' + (vb / 1000).toFixed(5) + ' = ' + (cb * vb / 1000).toExponential(3) + ' mol\n' +
             'n(H\u2082SO\u2084) = n(NaOH) / 2 = ' + (cb * vb / 2000).toExponential(3) + ' mol\n' +
             'c = ' + (cb * vb / 2000).toExponential(3) + ' / ' + (va / 1000).toFixed(4) + ' = ' + ca.toFixed(4) + ' M\n' +
             'Forgetting to halve is the most common error in this question.' };
    }

    if (type === 2) {                              /* equivalence volume */
      ca = rnd(0.05, 0.30, 3); va = rnd(20, 30, 1); cb = rnd(0.05, 0.30, 3);
      vb = ca * va / cb;
      return { kind: 'num', unit: 'mL', tol: 0.15,
        text: 'What volume of ' + cb.toFixed(3) + ' M NaOH is needed to reach the equivalence point when titrating ' +
              va.toFixed(1) + ' mL of ' + ca.toFixed(3) + ' M HCl?',
        ans: vb,
        sol: 'n(HCl) = ' + ca.toFixed(3) + ' \u00d7 ' + (va / 1000).toFixed(4) + ' = ' + (ca * va / 1000).toExponential(3) + ' mol\n' +
             'Ratio is 1 : 1, so n(NaOH) = ' + (ca * va / 1000).toExponential(3) + ' mol\n' +
             'V = n / c = ' + (ca * va / 1000).toExponential(3) + ' / ' + cb.toFixed(3) + ' = ' + (vb / 1000).toExponential(3) + ' L = ' + vb.toFixed(2) + ' mL' };
    }

    if (type === 3) {                              /* pKa from half-equivalence */
      var pka = rnd(3.2, 5.6, 2);
      vb = rnd(18, 30, 1);
      return { kind: 'num', unit: '', tol: 0.06,
        text: 'A weak monoprotic acid is titrated with NaOH. The equivalence point occurs at ' + vb.toFixed(1) +
              ' mL, and the pH measured when ' + (vb / 2).toFixed(2) + ' mL had been added was ' + pka.toFixed(2) +
              '. What is the pK\u2090 of the acid?',
        ans: pka,
        sol: 'At half the equivalence volume, [HA] = [A\u207b].\n' +
             'pH = pK\u2090 + log([A\u207b]/[HA]) = pK\u2090 + log(1) = pK\u2090\n' +
             'So pK\u2090 = ' + pka.toFixed(2) + ' exactly \u2014 no calculation needed beyond recognising the half-equivalence point.' };
    }

    if (type === 4) {                              /* indicator choice */
      var scen = pick([
        { t: 'ethanoic acid (weak) titrated with sodium hydroxide (strong)', a: 'Phenolphthalein',
          why: 'Equivalence is basic (\u2248 pH 8.7) because ethanoate hydrolyses. Phenolphthalein changes over 8.3\u201310.0, inside the steep section.' },
        { t: 'ammonia (weak) titrated with hydrochloric acid (strong)', a: 'Methyl orange',
          why: 'Equivalence is acidic (\u2248 pH 5.3) because ammonium is a weak acid. Methyl orange changes over 3.1\u20134.4, inside the steep section.' },
        { t: 'hydrochloric acid (strong) titrated with sodium hydroxide (strong)', a: 'Any of them',
          why: 'The steep section spans roughly pH 3 to 11, so every common indicator changes colour within it.' },
        { t: 'ethanoic acid (weak) titrated with ammonia (weak)', a: 'None is suitable',
          why: 'There is no steep section \u2014 the pH drifts slowly through the equivalence region, so no indicator gives a sharp colour change.' }
      ]);
      return { kind: 'mcq', text: 'Which indicator is most appropriate for ' + scen.t + '?',
        opts: ['Phenolphthalein', 'Methyl orange', 'Any of them', 'None is suitable'],
        ans: scen.a, sol: scen.why };
    }

    if (type === 5) {                              /* pH at equivalence — conceptual */
      var sc = pick([
        { t: 'a strong acid with a strong base', a: 'Exactly 7', why: 'The salt formed is neutral \u2014 neither ion hydrolyses.' },
        { t: 'a weak acid with a strong base', a: 'Greater than 7', why: 'The conjugate base of the weak acid hydrolyses water, releasing hydroxide.' },
        { t: 'a weak base with a strong acid', a: 'Less than 7', why: 'The conjugate acid of the weak base donates a proton to water.' }
      ]);
      return { kind: 'mcq', text: 'What is the pH at the equivalence point when titrating ' + sc.t + '?',
        opts: ['Exactly 7', 'Greater than 7', 'Less than 7', 'It depends on the indicator'],
        ans: sc.a, sol: sc.why + ' The indicator has no effect on the equivalence pH \u2014 it only affects where you observe the end point.' };
    }

    if (type === 6) {                              /* percentage purity */
      var m = rnd(1.0, 2.5, 2), cH = rnd(0.4, 0.6, 3), vH = rnd(20, 30, 1);
      var nH = cH * vH / 1000, nC = nH / 2, mC = nC * 106.0;
      var pur = mC / m * 100;
      return { kind: 'num', unit: '%', tol: 0.6,
        text: m.toFixed(2) + ' g of impure sodium carbonate was dissolved and titrated with ' + cH.toFixed(3) +
              ' M hydrochloric acid, requiring ' + vH.toFixed(1) + ' mL to reach the methyl orange end point. ' +
              'Calculate the percentage purity. (M\u1d63 of Na\u2082CO\u2083 = 106.0)',
        ans: pur,
        sol: 'Na\u2082CO\u2083 + 2HCl \u2192 2NaCl + H\u2082O + CO\u2082, so the ratio is 1 : 2.\n' +
             'n(HCl) = ' + cH.toFixed(3) + ' \u00d7 ' + (vH / 1000).toFixed(4) + ' = ' + nH.toExponential(3) + ' mol\n' +
             'n(Na\u2082CO\u2083) = n(HCl) / 2 = ' + nC.toExponential(3) + ' mol\n' +
             'mass = ' + nC.toExponential(3) + ' \u00d7 106.0 = ' + mC.toFixed(3) + ' g\n' +
             'purity = ' + mC.toFixed(3) + ' / ' + m.toFixed(2) + ' \u00d7 100 = ' + pur.toFixed(1) + ' %' };
    }

    /* type 7 — titration error */
    var veq = rnd(22, 28, 2), vend = veq + rnd(-1.2, 1.2, 2);
    var err = (vend - veq) / veq * 100;
    return { kind: 'num', unit: '%', tol: 0.25,
      text: 'A titration has a calculated equivalence volume of ' + veq.toFixed(2) +
            ' mL, but the chosen indicator changed colour at ' + vend.toFixed(2) +
            ' mL. Calculate the percentage titration error (a negative answer means the end point came early).',
      ans: err,
      sol: 'error = (V_end \u2212 V_eq) / V_eq \u00d7 100\n' +
           '= (' + vend.toFixed(2) + ' \u2212 ' + veq.toFixed(2) + ') / ' + veq.toFixed(2) + ' \u00d7 100\n' +
           '= ' + err.toFixed(2) + ' %\n' +
           (Math.abs(err) <= 0.5 ? 'This is within the 0.5% normally accepted for volumetric analysis.'
                                 : 'This exceeds the 0.5% normally accepted \u2014 a better indicator is needed.') };
  }

  function newProblem() {
    var p = makeProblem();
    state.pQ = p; state.pSel = null;
    $('pq-text').textContent = p.text;
    $('pq-feedback').className = 'feedback hidden';
    $('pq-solution').className = 'solution hidden';

    if (p.kind === 'num') {
      $('pq-input-row').className = 'pq-input-row';
      $('pq-mcq').className = 'pq-mcq hidden';
      $('pq-input').value = '';
      $('pq-unit').textContent = p.unit;
    } else {
      $('pq-input-row').className = 'pq-input-row hidden';
      $('pq-mcq').className = 'pq-mcq';
      var html = '', i;
      var opts = shuffle(p.opts);
      for (i = 0; i < opts.length; i++) html += '<button class="pq-opt" data-opt="' + opts[i] + '">' + opts[i] + '</button>';
      $('pq-mcq').innerHTML = html;
    }
    playClick();
  }

  function checkProblem() {
    var p = state.pQ; if (!p) return;
    var fb = $('pq-feedback'), ok;

    if (p.kind === 'num') {
      var val = parseFloat($('pq-input').value);
      if (isNaN(val)) { fb.className = 'feedback err'; fb.textContent = 'Enter a numerical answer first.'; return; }
      ok = Math.abs(val - p.ans) <= p.tol;
    } else {
      if (state.pSel == null) { fb.className = 'feedback err'; fb.textContent = 'Select an option first.'; return; }
      ok = state.pSel === p.ans;
      var btns = $('pq-mcq').querySelectorAll('.pq-opt'), i;
      for (i = 0; i < btns.length; i++) {
        var t = btns[i].getAttribute('data-opt');
        if (t === p.ans) btns[i].className = 'pq-opt correct';
        else if (t === state.pSel) btns[i].className = 'pq-opt wrong';
      }
    }

    state.pTotal++; if (ok) state.pScore++;
    $('p-score').textContent = state.pScore;
    $('p-total').textContent = state.pTotal;
    fb.className = 'feedback ' + (ok ? 'ok' : 'err');
    fb.textContent = ok ? '\u2713 Correct.'
      : '\u2717 Not quite \u2014 the answer is ' + (p.kind === 'num' ? p.ans.toFixed(p.unit === 'M' ? 4 : 2) + ' ' + p.unit : p.ans) + '.';
    if (ok) playSuccess(); else playError();
  }

  function showSolution() {
    var p = state.pQ; if (!p) return;
    $('pq-solution').className = 'solution';
    $('pq-solution').textContent = p.sol;
  }

  /* ── 15. Quiz mode ─────────────────────────────────────────── */

  var QUIZ_POOL = [
    { q: 'What is the pH at the equivalence point of a strong acid \u2013 strong base titration at 25 \u00b0C?',
      o: ['Exactly 7', 'About 5.3', 'About 8.7', 'It depends on the indicator'], a: 0,
      e: 'The salt formed is neutral, so neither ion hydrolyses and the pH is exactly 7.' },
    { q: 'At the half-equivalence point of a weak acid titration, the pH is equal to:',
      o: ['pK\u2090 of the acid', '7', 'pK_w \u2212 pK\u2090', 'Half the equivalence pH'], a: 0,
      e: 'Half the acid has been converted to its conjugate base, so [HA] = [A\u207b] and the log term in Henderson\u2013Hasselbalch is zero.' },
    { q: 'Which indicator is most suitable for titrating ethanoic acid with sodium hydroxide?',
      o: ['Phenolphthalein', 'Methyl orange', 'Methyl red', 'Bromocresol green'], a: 0,
      e: 'Equivalence is basic (\u2248 pH 8.7). Phenolphthalein changes over 8.3\u201310.0, inside the steep section.' },
    { q: 'Why is the conical flask rinsed with distilled water rather than with the analyte?',
      o: ['Rinsing with analyte would add extra unmeasured moles', 'Distilled water is cheaper', 'Analyte would stain the glass', 'It makes the indicator work better'], a: 0,
      e: 'The aliquot is measured accurately by pipette. Residual analyte on the walls would add moles that were never measured, inflating the titre.' },
    { q: 'One mole of sulfuric acid reacts completely with how many moles of sodium hydroxide?',
      o: ['2', '1', '0.5', '4'], a: 0,
      e: 'H\u2082SO\u2084 + 2NaOH \u2192 Na\u2082SO\u2084 + 2H\u2082O \u2014 sulfuric acid is diprotic.' },
    { q: 'An air bubble escapes from the burette tip during a titration. What is the effect on the titre?',
      o: ['The titre is too large', 'The titre is too small', 'No effect', 'The end point becomes gradual'], a: 0,
      e: 'The bubble volume is recorded as delivered liquid, so the apparent titre exceeds the true volume of titrant.' },
    { q: 'Sodium carbonate titrated with hydrochloric acid shows two end points. The second occurs at what volume relative to the first?',
      o: ['Twice the first', 'The same', 'Half the first', 'Three times the first'], a: 0,
      e: 'Carbonate accepts two protons in sequence, CO\u2083\u00b2\u207b \u2192 HCO\u2083\u207b \u2192 H\u2082CO\u2083, so the second equivalence needs twice the acid of the first.' },
    { q: 'Why is a weak acid \u2013 weak base titration not performed in practice?',
      o: ['There is no steep section, so no indicator gives a sharp end point', 'The reaction does not go to completion', 'The products are unstable', 'The pH never reaches 7'], a: 0,
      e: 'The pH drifts slowly through equivalence, so no indicator changes colour sharply enough to locate it.' },
    { q: 'What does the peak of the dpH/dV curve identify?',
      o: ['The equivalence point', 'The half-equivalence point', 'The buffer region', 'The indicator end point'], a: 0,
      e: 'The curve is steepest at equivalence, so its first derivative peaks there. This is how end points are found in potentiometric titration with no indicator.' },
    { q: 'Diluting both the analyte and titrant tenfold has what effect on the equivalence volume?',
      o: ['No change', 'It is ten times larger', 'It is ten times smaller', 'It doubles'], a: 0,
      e: 'The mole ratio is unchanged, so the volume is unchanged. What shrinks is the height of the steep section.' },
    { q: 'Which titres should be averaged to give the final result?',
      o: ['Three concordant titres, excluding the rough one', 'All titres including the rough one', 'The single smallest titre', 'The first and last only'], a: 0,
      e: 'Only concordant titres \u2014 agreeing within 0.10 mL \u2014 are averaged. The rough titration is always excluded.' },
    { q: 'A burette is read with the eye above the meniscus. The recorded reading is:',
      o: ['Too small, because the meniscus lines up with a graduation higher up the tube',
          'Too large, because the meniscus appears lower down the tube',
          'Unaffected, because the meniscus is in the centre of the tube',
          'Too small, because liquid clings to the glass'], a: 0,
      e: 'A burette is numbered from zero at the TOP downwards. Looking down, the line of sight crosses the front graduations above the true meniscus level, so you read a graduation higher up the tube \u2014 which is a smaller number. Viewing from below does the reverse. Note the subtlety: if both the initial and final readings are taken from the same wrong angle the error largely cancels in the titre, which is why consistent eye level matters as much as correct eye level.' },
    { q: 'The equivalence point of ammonia titrated with hydrochloric acid is:',
      o: ['Below pH 7', 'Exactly pH 7', 'Above pH 7', 'Above pH 10'], a: 0,
      e: 'The ammonium ion formed is a weak acid and donates a proton to water, so the solution is acidic at equivalence.' },
    { q: 'What is the titre if the initial burette reading is 1.20 mL and the final reading is 26.55 mL?',
      o: ['25.35 mL', '27.75 mL', '26.55 mL', '24.15 mL'], a: 0,
      e: 'A burette reads from zero at the top downwards, so the titre is final minus initial: 26.55 \u2212 1.20 = 25.35 mL.' },
    { q: 'Only two drops of indicator are added to the flask. Why not more?',
      o: ['The indicator is itself a weak acid and would consume titrant', 'It would be too dark to see', 'It would react with the analyte', 'It would change the equivalence volume of the salt'], a: 0,
      e: 'Indicator is a weak acid; a large amount would consume a measurable quantity of titrant and shift the observed end point.' }
  ];

  function shuffle(arr) {
    var a = arr.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Every entry in the pool is authored with the correct answer first, so the
     options must be shuffled per question — otherwise the first option is
     always right and the quiz is trivially gameable. */
  function shuffleOptions(q) {
    var order = shuffle([0, 1, 2, 3].slice(0, q.o.length)), i;
    var opts = [], ans = 0;
    for (i = 0; i < order.length; i++) {
      opts.push(q.o[order[i]]);
      if (order[i] === q.a) ans = i;
    }
    return { q: q.q, o: opts, a: ans, e: q.e };
  }

  function startQuiz() {
    var pool = shuffle(QUIZ_POOL), i;
    state.qList = [];
    for (i = 0; i < 5; i++) state.qList.push(shuffleOptions(pool[i]));
    state.qIdx = 0; state.qAns = []; state.qSel = null;
    $('quiz-result').className = 'quiz-result hidden';
    $('btn-start-quiz').className = 'btn btn-primary hidden';
    $('btn-submit-q').className = 'btn btn-primary';
    $('btn-next-q').className = 'btn btn-primary hidden';
    showQuizQuestion();
    playClick();
  }

  function showQuizQuestion() {
    var q = state.qList[state.qIdx], html = '', i;
    state.qSel = null;
    $('qq-text').textContent = 'Q' + (state.qIdx + 1) + '. ' + q.q;
    for (i = 0; i < q.o.length; i++) html += '<button class="qq-opt" data-i="' + i + '">' + q.o[i] + '</button>';
    $('qq-options').innerHTML = html;
    $('qq-options').className = 'qq-options';
    $('qq-feedback').className = 'feedback hidden';
    $('quiz-counter').textContent = 'Question ' + (state.qIdx + 1) + ' of 5';
  }

  function submitQuiz() {
    if (state.qSel == null) {
      var fb = $('qq-feedback');
      fb.className = 'feedback err'; fb.textContent = 'Select an answer first.';
      return;
    }
    var q = state.qList[state.qIdx];
    var ok = state.qSel === q.a;
    state.qAns.push({ q: q, sel: state.qSel, ok: ok });

    var btns = $('qq-options').querySelectorAll('.qq-opt'), i;
    for (i = 0; i < btns.length; i++) {
      if (i === q.a) btns[i].className = 'qq-opt correct';
      else if (i === state.qSel) btns[i].className = 'qq-opt wrong';
    }
    var f = $('qq-feedback');
    f.className = 'feedback ' + (ok ? 'ok' : 'err');
    f.textContent = (ok ? '\u2713 Correct. ' : '\u2717 Incorrect. ') + q.e;
    if (ok) playSuccess(); else playError();

    $('btn-submit-q').className = 'btn btn-primary hidden';
    $('btn-next-q').className = 'btn btn-primary';
    $('btn-next-q').textContent = state.qIdx === 4 ? 'See Result' : 'Next';
  }

  function nextQuiz() {
    if (state.qIdx === 4) { showQuizResult(); return; }
    state.qIdx++;
    $('btn-next-q').className = 'btn btn-primary hidden';
    $('btn-submit-q').className = 'btn btn-primary';
    showQuizQuestion();
  }

  function showQuizResult() {
    var score = 0, i;
    for (i = 0; i < state.qAns.length; i++) if (state.qAns[i].ok) score++;
    var cls = score === 5 ? 'perfect' : score >= 3 ? 'good' : 'poor';
    var stars = '', k;
    for (k = 0; k < 5; k++) stars += (k < score ? '\u2605' : '\u2606');

    var html = '<div class="qr-header"><div class="qr-score ' + cls + '">' + score + ' / 5</div>' +
               '<div class="qr-stars ' + cls + '">' + stars + '</div></div><div class="qr-rows">';
    for (i = 0; i < state.qAns.length; i++) {
      var a = state.qAns[i];
      html += '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '"><strong>Q' + (i + 1) + '.</strong> ' + a.q.q +
              '<br><em>' + (a.ok ? 'Correct' : 'You chose: ' + a.q.o[a.sel] + ' \u2014 answer: ' + a.q.o[a.q.a]) +
              '</em><br>' + a.q.e + '</div>';
    }
    html += '</div>';
    $('quiz-result').innerHTML = html;
    $('quiz-result').className = 'quiz-result';
    $('qq-text').textContent = 'Round complete.';
    $('qq-options').className = 'qq-options hidden';
    $('qq-feedback').className = 'feedback hidden';
    $('btn-next-q').className = 'btn btn-primary hidden';
    $('btn-start-quiz').className = 'btn btn-primary';
    $('btn-start-quiz').textContent = 'Retake Quiz';
    $('quiz-counter').textContent = 'Scored ' + score + ' of 5';
    if (score === 5) playSuccess();
  }

  /* ── 16. Export ────────────────────────────────────────────── */

  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(canvas, 0, 0);
    var fs = Math.round(tmp.width * 0.018); if (fs < 10) fs = 10;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'titration_' + state.aR.id + '_vs_' + state.tR.id + '.png';
    a.click();
  }

  function exportCSV() {
    var s = state, rows = ['Volume_mL,pH'], i;
    for (i = 0; i < s.curve.length; i++) rows.push(s.curve[i].v.toFixed(4) + ',' + s.curve[i].ph.toFixed(4));
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'titration_curve_' + s.aR.id + '_vs_' + s.tR.id + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ── 17. Reagent select population ─────────────────────────── */

  function fillSelect(sel, list, value) {
    var html = '', i;
    for (i = 0; i < list.length; i++) {
      html += '<option value="' + list[i].id + '">' + list[i].name + ' (' + list[i].formula + ')' +
              (list[i].strong ? '' : ' \u2014 weak') + '</option>';
    }
    sel.innerHTML = html;
    sel.value = value;
  }

  function populateSelects(keepTitrant) {
    var acids = [], bases = [], i;
    for (i = 0; i < REAGENTS.length; i++) (REAGENTS[i].kind === 'acid' ? acids : bases).push(REAGENTS[i]);

    fillSelect(analyteSel, acids.concat(bases), state.analyte);

    var aKind = reagent(state.analyte).kind;
    var opposite = aKind === 'acid' ? bases : acids;
    if (!keepTitrant || reagent(state.titrant).kind === aKind) {
      state.titrant = opposite[0].id;
    }
    fillSelect(titrantSel, opposite, state.titrant);

    var ih = '', k;
    for (k = 0; k < INDICATORS.length; k++) {
      var ind = INDICATORS[k];
      ih += '<option value="' + ind.id + '">' + ind.name +
            (ind.id === 'none' ? '' : '  (' + ind.lo.toFixed(1) + '\u2013' + ind.hi.toFixed(1) + ')') + '</option>';
    }
    indSel.innerHTML = ih;
    indSel.value = state.ind;
  }

  /* ── 18. Events ────────────────────────────────────────────── */

  function clampNum(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  /* toFixed, not Math.round(v*10^n)/10^n — the latter mis-rounds binary
     fractions (0.0875 * 1000 is 87.49999…, which rounds DOWN to 0.087). */
  function roundTo(v, dp) { return parseFloat(v.toFixed(dp)); }

  var PREC = 4;                    /* stored precision — 4 sf covers standard
                                      solutions quoted like 0.1035 M */

  /* Show dp decimals, but never misreport what is actually stored: if the
     rounded string is not the stored value, show the digits that are. */
  function fmtVal(v, dp) {
    var t = v.toFixed(dp);
    if (parseFloat(t) !== v) {
      t = v.toFixed(PREC).replace(/0+$/, '').replace(/\.$/, '');
    }
    return t;
  }

  /* One control = slider + read-only value + typed decimal input, all kept in
     sync from a single apply(). The slider is DISPLAY ONLY: its step would
     otherwise snap a typed 0.125 M back to 0.13 the moment state was re-read
     from slider.value. State always holds what the user actually typed. */
  function bindQuantity(sliderId, inputId, valId, key, dp, unit) {
    var sl = $(sliderId), inp = $(inputId), val = $(valId);
    var lo = parseFloat(sl.min), hi = parseFloat(sl.max);

    function apply(v, fromInput) {
      if (state.unknown && (key === 'ca' || key === 'va' || key === 'ct')) {
        sl.value = state[key]; inp.value = state[key];       /* sealed — refuse */
        return;
      }
      if (isNaN(v)) { inp.value = state[key]; return; }
      v = roundTo(clampNum(v, lo, hi), PREC);
      state[key] = v;
      val.textContent = fmtVal(v, dp) + ' ' + unit;
      sl.value = v;
      if (!fromInput) inp.value = v;
      rebuild(); resetTitration();
    }

    sl.addEventListener('input', function () { apply(parseFloat(sl.value), false); });
    inp.addEventListener('change', function () { apply(parseFloat(inp.value), true); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { inp.blur(); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        var step = e.shiftKey ? 10 : 1;
        var incAttr = inp.parentElement.querySelector('.stepper-btn');
        var inc = parseFloat(incAttr && incAttr.getAttribute('data-inc')) || 1;
        var base = parseFloat(inp.value);
        if (isNaN(base)) base = state[key];
        apply(base + (e.key === 'ArrowUp' ? 1 : -1) * inc * step, true);
        inp.value = state[key];
      }
    });
    /* keep the label formatted on load */
    val.textContent = fmtVal(state[key], dp) + ' ' + unit;
    inp.value = state[key];
    sl.value = state[key];
  }

  /* Press-and-hold delivery. A real titration needs dozens of drops near the
     end point, so holding the button keeps the stopcock open and the rate
     accelerates the longer it is held. Releasing, sliding off, or hitting the
     burette limit all stop it. */
  function bindHold(btn, step, rates) {
    var timer = null, count = 0, lastPointerAt = -1e9;

    function stop() {
      if (timer) { clearTimeout(timer); timer = null; }
      btn.classList.remove('holding');
    }

    function repeat() {
      if (state.v >= state.vmaxDeliver - 1e-9) { stop(); return; }
      deliver(step);
      count++;
      var d = count < 6 ? rates[0] : count < 18 ? rates[1] : rates[2];
      timer = setTimeout(repeat, d);
    }

    btn.addEventListener('pointerdown', function (e) {
      if (e.button != null && e.button !== 0) return;
      /* preventDefault only for mouse (stops text-drag). On touch it would
         swallow the pan gesture; pointercancel handles that case instead. */
      if (e.pointerType !== 'touch') e.preventDefault();
      lastPointerAt = performance.now();
      stop();
      count = 0;
      deliver(step);                       /* immediate response to the press */
      btn.classList.add('holding');
      timer = setTimeout(repeat, 420);     /* hold threshold before repeating */
    });

    /* A plain click still works for keyboard (Enter/Space) and programmatic
       calls. Suppress only a click that genuinely follows this press — a
       boolean flag would go stale when a press is cancelled by sliding off
       (no click ever arrives) and would then swallow the next real click. */
    btn.addEventListener('click', function () {
      if (performance.now() - lastPointerAt < 900) return;
      deliver(step);
    });

    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
  }


  /* ─────────────────────────────────────────────────────────────
     Calculate mode — the arithmetic a student actually has to do
     after running the titration. Kept on this page so one URL owns
     both the simulator and the calculator intent.
     ───────────────────────────────────────────────────────────── */

  var CALC_FORMS = {
    conc: {
      intro: 'A known volume of analyte was titrated against a standard solution. Enter the titre and the standard\u2019s concentration to find the unknown concentration.',
      unknown: 'ca',
      fields: [
        { k: 'va', label: 'Volume of analyte (pipetted)', unit: 'mL', def: 25 },
        { k: 'ct', label: 'Concentration of titrant (standard)', unit: 'M', def: 0.1 },
        { k: 'vt', label: 'Titre \u2014 volume of titrant used', unit: 'mL', def: 23.4 }
      ]
    },
    vol: {
      intro: 'Predict the titre before you run the titration \u2014 useful for choosing a sensible burette range.',
      unknown: 'vt',
      fields: [
        { k: 'ca', label: 'Concentration of analyte', unit: 'M', def: 0.1 },
        { k: 'va', label: 'Volume of analyte', unit: 'mL', def: 25 },
        { k: 'ct', label: 'Concentration of titrant', unit: 'M', def: 0.1 }
      ]
    },
    purity: {
      intro: 'An impure solid was dissolved and titrated. Enter the mass weighed out and its molar mass to find the percentage purity.',
      unknown: 'purity',
      fields: [
        { k: 'mass', label: 'Mass of impure sample weighed', unit: 'g', def: 1.5 },
        { k: 'mr',   label: 'Molar mass of the pure substance', unit: 'g/mol', def: 106.0 },
        { k: 'ct',   label: 'Concentration of titrant', unit: 'M', def: 0.5 },
        { k: 'vt',   label: 'Titre \u2014 volume of titrant used', unit: 'mL', def: 24.0 }
      ]
    },
    back: {
      intro: 'A known EXCESS of reagent was added and left to react; the leftover excess was then titrated. The amount consumed by the sample is the difference. Two mole ratios are involved \u2014 set both below.',
      unknown: 'back',
      fields: [
        { k: 'cx', label: 'Concentration of excess reagent added', unit: 'M', def: 1.0 },
        { k: 'vx', label: 'Volume of excess reagent added', unit: 'mL', def: 50 },
        { k: 'ct', label: 'Concentration of back-titrant', unit: 'M', def: 0.5 },
        { k: 'vt', label: 'Titre of back-titrant', unit: 'mL', def: 22.0 },
        { k: 'mass', label: 'Mass of sample (optional, for purity)', unit: 'g', def: 1.2 },
        { k: 'mr',   label: 'Molar mass of sample (optional)', unit: 'g/mol', def: 100.1 }
      ]
    }
  };

  var calcState = { form: 'conc', vals: {}, ra: 1, rb: 1, rx: 1, ry: 1 };

  function setMath(el, html) {
    el.innerHTML = html;
    var tries = 0;
    (function go() {
      if (window.MMLatex && window.renderMathInElement) { window.MMLatex.render(el); return; }
      if (tries++ < 60) setTimeout(go, 120);        /* KaTeX loads deferred */
    })();
  }

  function renderCalc() {
    var f = CALC_FORMS[calcState.form], html = '', i;
    $('calc-intro').textContent = f.intro;
    for (i = 0; i < f.fields.length; i++) {
      var fd = f.fields[i];
      if (calcState.vals[fd.k] == null) calcState.vals[fd.k] = fd.def;
      html += '<div class="calc-field"><label for="cf-' + fd.k + '">' + fd.label + '</label>' +
              '<div class="cf-wrap"><input type="number" step="any" inputmode="decimal" id="cf-' + fd.k + '" ' +
              'value="' + calcState.vals[fd.k] + '"><span class="cf-unit">' + fd.unit + '</span></div></div>';
    }
    $('calc-inputs').innerHTML = html;
    $('bt-ratio-row').className = 'calc-ratio-row' + (calcState.form === 'back' ? '' : ' hidden');
    for (i = 0; i < f.fields.length; i++) {
      (function (key) {
        var el = $('cf-' + key);
        el.addEventListener('input', function () {
          var v = parseFloat(el.value);
          calcState.vals[key] = isNaN(v) ? null : v;
          computeCalc();
        });
      })(f.fields[i].k);
    }
    computeCalc();
  }

  function ratioHint(a, b) {
    if (a === 1 && b === 1) return '1 : 1 \u2014 e.g. HCl + NaOH';
    if (a === 1 && b === 2) return '1 : 2 \u2014 e.g. H\u2082SO\u2084 + 2NaOH, or Na\u2082CO\u2083 + 2HCl';
    if (a === 2 && b === 1) return '2 : 1 \u2014 two moles of analyte per mole of titrant';
    if (a === 1 && b === 3) return '1 : 3 \u2014 e.g. H\u2083PO\u2084 fully neutralised';
    return a + ' : ' + b + ' \u2014 from your balanced equation';
  }

  function computeCalc() {
    var v = calcState.vals, ra = calcState.ra, rb = calcState.rb;
    var form = calcState.form;
    var res = $('calc-result'), body = $('calc-modal-body-2');
    var num = function (x) { return typeof x === 'number' && isFinite(x); };

    function fail(msg) {
      res.innerHTML = '<div class="cr-label">Result</div><div class="cr-value bad">' + msg + '</div>';
      body.innerHTML = '<p>Fill in every field with a positive number to see the working.</p>';
    }


    /* Arithmetic can be right and still describe an impossible experiment.
       Saturated NaOH is about 19 M and concentrated HCl about 12 M; no burette
       delivers a litre. Flag rather than block — a wrong unit is the usual cause. */
    function sanity() {
      var w = [];
      var vols = [['analyte volume', v.va], ['titre', v.vt], ['excess reagent volume', v.vx]];
      var concs = [['analyte', v.ca], ['titrant', v.ct], ['excess reagent', v.cx]];
      var i;
      for (i = 0; i < vols.length; i++) {
        if (typeof vols[i][1] === 'number' && vols[i][1] > 1000) {
          w.push('The ' + vols[i][0] + ' is over 1000 mL \u2014 check the units; volumes here are in mL, not litres.');
        }
      }
      for (i = 0; i < concs.length; i++) {
        if (typeof concs[i][1] === 'number' && concs[i][1] > 20) {
          w.push('The ' + concs[i][0] + ' concentration exceeds 20 mol dm\u207b\u00b3 \u2014 higher than saturated sodium hydroxide (about 19 M), so it is not an achievable solution.');
        }
      }
      return w.length ? '<span style="color:var(--gold)">' + w.join(' ') + '</span>' : '';
    }

    function show(label, value, sub, steps) {
      var warn = sanity();
      var subHtml = [sub, warn].filter(Boolean).join('<br>');
      res.innerHTML = '<div class="cr-label">' + label + '</div><div class="cr-value">' + value + '</div>' +
                      (subHtml ? '<div class="cr-sub">' + subHtml + '</div>' : '');
      setMath(body, steps);
    }

    if (form === 'conc') {
      if (!num(v.va) || !num(v.ct) || !num(v.vt) || v.va <= 0 || v.ct <= 0 || v.vt <= 0) return fail('Enter positive values');
      var nT = v.ct * v.vt / 1000;
      var nA = nT * ra / rb;
      var ca = nA / (v.va / 1000);
      show('Concentration of the analyte', ca.toFixed(4) + ' M',
        'That is ' + nA.toExponential(3) + ' mol in ' + v.va + ' mL.',
        '<div class="eq-line">\\[ n_{\\text{titrant}} = c_t V_t = ' + v.ct + ' \\times ' + (v.vt / 1000).toFixed(5) + ' = ' + nT.toExponential(4) + '\\ \\text{mol} \\]</div>' +
        '<div class="eq-note">Apply the mole ratio ' + ra + ' : ' + rb + ' from the balanced equation.</div>' +
        '<div class="eq-line">\\[ n_{\\text{analyte}} = ' + nT.toExponential(4) + ' \\times \\frac{' + ra + '}{' + rb + '} = ' + nA.toExponential(4) + '\\ \\text{mol} \\]</div>' +
        '<div class="eq-line">\\[ c_a = \\frac{n_a}{V_a} = \\frac{' + nA.toExponential(4) + '}{' + (v.va / 1000).toFixed(5) + '} = ' + ca.toFixed(4) + '\\ \\text{mol dm}^{-3} \\]</div>');
      return;
    }

    if (form === 'vol') {
      if (!num(v.ca) || !num(v.va) || !num(v.ct) || v.ca <= 0 || v.va <= 0 || v.ct <= 0) return fail('Enter positive values');
      var nA2 = v.ca * v.va / 1000;
      var nT2 = nA2 * rb / ra;
      var vt = nT2 / v.ct * 1000;
      show('Titre required', vt.toFixed(2) + ' mL',
        vt > 50 ? 'This exceeds a 50 mL burette \u2014 use a more concentrated titrant or a smaller aliquot.'
                : 'A titre of 20\u201330 mL gives the lowest percentage uncertainty.',
        '<div class="eq-line">\\[ n_{\\text{analyte}} = c_a V_a = ' + v.ca + ' \\times ' + (v.va / 1000).toFixed(5) + ' = ' + nA2.toExponential(4) + '\\ \\text{mol} \\]</div>' +
        '<div class="eq-line">\\[ n_{\\text{titrant}} = ' + nA2.toExponential(4) + ' \\times \\frac{' + rb + '}{' + ra + '} = ' + nT2.toExponential(4) + '\\ \\text{mol} \\]</div>' +
        '<div class="eq-line">\\[ V_t = \\frac{n_t}{c_t} = \\frac{' + nT2.toExponential(4) + '}{' + v.ct + '} = ' + (vt / 1000).toExponential(4) + '\\ \\text{L} = ' + vt.toFixed(2) + '\\ \\text{mL} \\]</div>');
      return;
    }

    if (form === 'purity') {
      if (!num(v.mass) || !num(v.mr) || !num(v.ct) || !num(v.vt) || v.mass <= 0 || v.mr <= 0 || v.ct <= 0 || v.vt <= 0) return fail('Enter positive values');
      var nT3 = v.ct * v.vt / 1000;
      var nA3 = nT3 * ra / rb;
      var m3 = nA3 * v.mr;
      var pur = m3 / v.mass * 100;
      show('Percentage purity', pur.toFixed(2) + ' %',
        pur > 100 ? 'Above 100% \u2014 check the mole ratio and the molar mass; something is inconsistent.'
                  : m3.toFixed(4) + ' g of pure substance in a ' + v.mass + ' g sample.',
        '<div class="eq-line">\\[ n_{\\text{titrant}} = ' + v.ct + ' \\times ' + (v.vt / 1000).toFixed(5) + ' = ' + nT3.toExponential(4) + '\\ \\text{mol} \\]</div>' +
        '<div class="eq-line">\\[ n_{\\text{substance}} = ' + nT3.toExponential(4) + ' \\times \\frac{' + ra + '}{' + rb + '} = ' + nA3.toExponential(4) + '\\ \\text{mol} \\]</div>' +
        '<div class="eq-line">\\[ m = n M_r = ' + nA3.toExponential(4) + ' \\times ' + v.mr + ' = ' + m3.toFixed(4) + '\\ \\text{g} \\]</div>' +
        '<div class="eq-line">\\[ \\text{purity} = \\frac{' + m3.toFixed(4) + '}{' + v.mass + '} \\times 100 = ' + pur.toFixed(2) + '\\,\\% \\]</div>');
      return;
    }

    /* back titration */
    if (!num(v.cx) || !num(v.vx) || !num(v.ct) || !num(v.vt) || v.cx <= 0 || v.vx <= 0 || v.ct <= 0 || v.vt <= 0) return fail('Enter positive values');
    var nAdded = v.cx * v.vx / 1000;
    var nLeft = (v.ct * v.vt / 1000) * (calcState.rx / calcState.ry);
    var nUsed = nAdded - nLeft;
    if (nUsed <= 0) {
      return fail('Leftover \u2265 added \u2014 nothing reacted');
    }
    var nSample = nUsed * ra / rb;
    var sub = nSample.toExponential(4) + ' mol of sample reacted.';
    var steps =
      '<div class="eq-line">\\[ n_{\\text{added}} = ' + v.cx + ' \\times ' + (v.vx / 1000).toFixed(5) + ' = ' + nAdded.toExponential(4) + '\\ \\text{mol} \\]</div>' +
      '<div class="eq-line">\\[ n_{\\text{back-titrant}} = ' + v.ct + ' \\times ' + (v.vt / 1000).toFixed(5) + ' = ' + (v.ct * v.vt / 1000).toExponential(4) + '\\ \\text{mol} \\]</div>' +
      '<div class="eq-line">\\[ n_{\\text{leftover excess}} = ' + (v.ct * v.vt / 1000).toExponential(4) + ' \\times \\frac{' + calcState.rx + '}{' + calcState.ry + '} = ' + nLeft.toExponential(4) + '\\ \\text{mol} \\]</div>' +
      '<div class="eq-note">The sample consumed the difference \u2014 this is the whole idea of a back titration.</div>' +
      '<div class="eq-line">\\[ n_{\\text{reacted}} = ' + nAdded.toExponential(4) + ' - ' + nLeft.toExponential(4) + ' = ' + nUsed.toExponential(4) + '\\ \\text{mol} \\]</div>' +
      '<div class="eq-line">\\[ n_{\\text{sample}} = ' + nUsed.toExponential(4) + ' \\times \\frac{' + ra + '}{' + rb + '} = ' + nSample.toExponential(4) + '\\ \\text{mol} \\]</div>';
    var headline = nSample.toExponential(3) + ' mol';
    if (num(v.mass) && num(v.mr) && v.mass > 0 && v.mr > 0) {
      var mB = nSample * v.mr, purB = mB / v.mass * 100;
      headline = purB.toFixed(2) + ' %';
      sub = purB > 100
        ? 'Above 100% \u2014 impossible, so an input is inconsistent. Check the mole ratio, the molar mass, and that the excess reagent really was in excess.'
        : mB.toFixed(4) + ' g of active substance in a ' + v.mass + ' g sample (' + nSample.toExponential(3) + ' mol).';
      steps += '<div class="eq-line">\\[ m = ' + nSample.toExponential(4) + ' \\times ' + v.mr + ' = ' + mB.toFixed(4) + '\\ \\text{g} \\]</div>' +
               '<div class="eq-line">\\[ \\text{purity} = \\frac{' + mB.toFixed(4) + '}{' + v.mass + '} \\times 100 = ' + purB.toFixed(2) + '\\,\\% \\]</div>';
      show('Percentage purity', headline, sub, steps);
    } else {
      show('Moles of sample', headline, sub, steps);
    }
  }

  function wireCalc() {
    $('calc-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      var tabs = this.querySelectorAll('.pill'), i;
      for (i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
      b.classList.add('active');
      calcState.form = b.getAttribute('data-value');
      playClick();
      renderCalc();
    });
    ['cf-ra', 'cf-rb', 'cf-rx', 'cf-ry'].forEach(function (id) {
      $(id).addEventListener('input', function () {
        var a = parseInt($('cf-ra').value, 10), b = parseInt($('cf-rb').value, 10);
        var x = parseInt($('cf-rx').value, 10), y = parseInt($('cf-ry').value, 10);
        calcState.ra = a > 0 ? a : 1;
        calcState.rb = b > 0 ? b : 1;
        calcState.rx = x > 0 ? x : 1;
        calcState.ry = y > 0 ? y : 1;
        $('cf-ratio-hint').textContent = ratioHint(calcState.ra, calcState.rb);
        computeCalc();
      });
    });
  }


  /* ─────────────────────────────────────────────────────────────
     Results table. The number a student is actually marked on is
     not one titre — it is the mean of three concordant titres with
     the rough run discarded, carrying the burette's uncertainty.
     ───────────────────────────────────────────────────────────── */

  var BURETTE_UNC = 0.05;            /* uncertainty in ONE reading, mL */
  var CONCORDANT = 0.10;             /* titres agreeing within this are concordant */

  function recordTitre() {
    var s = state;
    if (s.v <= 0) { playError(); return; }
    s.titres.push({
      init: s.burStart,
      fin: s.burStart + s.v,
      titre: s.v,
      rough: s.titres.length === 0        /* the first run is always the rough one */
    });
    playSuccess();
    renderTitres();
    resetTitration();                     /* refill the burette for the next run */
  }

  /* Largest cluster of non-rough titres that all agree within CONCORDANT. */
  function concordantSet(list) {
    var usable = [], i, j;
    for (i = 0; i < list.length; i++) if (!list[i].rough) usable.push(i);
    if (usable.length < 2) return [];
    var best = [];
    for (i = 0; i < usable.length; i++) {
      var group = [usable[i]];
      for (j = 0; j < usable.length; j++) {
        if (i === j) continue;
        if (Math.abs(list[usable[j]].titre - list[usable[i]].titre) <= CONCORDANT) group.push(usable[j]);
      }
      if (group.length > best.length) best = group;
    }
    return best.length >= 2 ? best : [];
  }

  function renderTitres() {
    var s = state, rows = $('titre-rows'), i;
    updateReportBtns();
    if (!s.titres.length) {
      rows.innerHTML = '<tr><td colspan="5" class="titre-empty">No titres recorded yet. Run a titration, then press <strong>Record titre</strong> on the canvas.</td></tr>';
      $('titre-summary').innerHTML = '';
      $('titre-sub').textContent = 'record your titres and average the concordant ones';
      $('unknown-box').className = 'unknown-box hidden';
      return;
    }
    var good = concordantSet(s.titres);
    var html = '';
    for (i = 0; i < s.titres.length; i++) {
      var t = s.titres[i];
      var isGood = good.indexOf(i) !== -1;
      var cls = t.rough ? 'rough' : isGood ? 'concordant' : 'outlier';
      var tag = t.rough ? '<span class="titre-tag rough">rough</span>'
              : isGood ? '<span class="titre-tag ok">concordant</span>'
              : '<span class="titre-tag out">discard</span>';
      html += '<tr class="' + cls + '"><td>' + (i + 1) + '</td><td>' + t.init.toFixed(2) +
              '</td><td>' + t.fin.toFixed(2) + '</td><td>' + t.titre.toFixed(2) + '</td><td>' + tag + '</td></tr>';
    }
    rows.innerHTML = html;

    var sum = $('titre-summary');
    if (!good.length) {
      sum.innerHTML = '<p>The first run is the <strong>rough</strong> titration and is never averaged. Run at least two more and keep going until three agree within ' +
                      CONCORDANT.toFixed(2) + ' mL.</p>';
      $('titre-sub').textContent = s.titres.length + ' recorded \u2014 no concordant set yet';
      $('unknown-box').className = 'unknown-box hidden';
      return;
    }
    var tot = 0;
    for (i = 0; i < good.length; i++) tot += s.titres[good[i]].titre;
    var mean = tot / good.length;
    /* Each titre is a difference of two readings, so the absolute
       uncertainty is twice a single reading's. */
    var absU = 2 * BURETTE_UNC;
    var pctU = mean > 0 ? absU / mean * 100 : 0;
    var enough = good.length >= 3;

    sum.innerHTML =
      '<p><strong>Mean titre</strong> (' + good.length + ' concordant run' + (good.length === 1 ? '' : 's') +
      ', rough discarded): <span class="mean">' + mean.toFixed(2) + ' ± ' + absU.toFixed(2) + ' mL</span></p>' +
      '<p>Percentage uncertainty = 2 × ' + BURETTE_UNC.toFixed(2) + ' / ' + mean.toFixed(2) + ' × 100 = <strong>' +
      pctU.toFixed(2) + '%</strong>' +
      (mean < 15 ? ' — this titre is small, so the percentage uncertainty is high. Use a smaller aliquot or a more dilute titrant to bring the titre into the 20–30 mL range.'
                 : ' — a titre in the 20–30 mL range keeps this comfortably low.') + '</p>' +
      (enough ? '' : '<p style="color:var(--gold)">Only ' + good.length + ' concordant titre' + (good.length === 1 ? '' : 's') +
                     ' so far &mdash; standard practice is to repeat until <strong>three</strong> agree within ' + CONCORDANT.toFixed(2) + ' mL.</p>');
    $('titre-sub').textContent = 'mean ' + mean.toFixed(2) + ' mL from ' + good.length + ' concordant';
    if (s.unknown) $('unknown-box').className = 'unknown-box';
  }


  /* ─────────────────────────────────────────────────────────────
     Unknown-sample mode. A titration exists to measure something
     you do not know; with the concentration on a slider the whole
     exercise is circular. This hides it and grades the answer.
     ───────────────────────────────────────────────────────────── */

  function setUnknown(on) {
    var s = state, btn = $('btn-unknown');
    s.unknown = on;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.textContent = on ? 'Unknown sample ✓' : 'Unknown sample';

    if (on) {
      /* a value that gives a titre in the sensible 15-40 mL window */
      var lo = s.ct * 15 * s.tR.eq / (s.va * s.aR.eq);
      var hi = s.ct * 40 * s.tR.eq / (s.va * s.aR.eq);
      lo = Math.max(0.01, lo); hi = Math.min(1, hi);
      if (hi <= lo) { lo = 0.02; hi = 0.5; }
      s.ca = roundTo(lo + Math.random() * (hi - lo), 4);
    }
    /* Lock every input the sealed sample depends on. Leaving the flask
       reagent live let the analyte be swapped while the hidden concentration
       stayed behind, which silently pushed the titre outside the burette. The
       indicator stays free — changing it cannot invalidate the sample, and
       choosing it is part of the exercise. */
    var LOCK = ['analyte-sel', 'ca-slider', 'ca-step', 'va-slider', 'va-step',
                'titrant-sel', 'ct-slider', 'ct-step'];
    for (var li = 0; li < LOCK.length; li++) {
      var el = $(LOCK[li]);
      if (el) el.disabled = on;
    }
    var groups = document.querySelectorAll('.setup-sliders .sim-slider-group, .setup-bar .ctrl-group');
    for (var gi = 0; gi < groups.length; gi++) {
      var hasLocked = groups[gi].querySelector('#analyte-sel, #ca-slider, #va-slider, #titrant-sel, #ct-slider');
      groups[gi].classList.toggle('locked', on && !!hasLocked);
      var wrap = groups[gi].querySelector('.stepper-wrap');
      if (wrap) wrap.classList.toggle('locked', on && !!hasLocked);
    }
    $('unknown-hint').className = on ? 'unknown-hint' : 'unknown-hint hidden';

    /* Working an unknown means recording titre after titre, so the Results
       Table moves directly under the canvas — record, check concordance and
       enter the answer without scrolling past the setup you can no longer
       touch. Moving the element keeps its listeners; it is not re-created. */
    var card = $('titre-card');
    if (card) {
      (on ? $('canvas-card') : $('readout-panel')).insertAdjacentElement('afterend', card);
      card.open = true;
    }

    var sl = $('ca-slider'), inp = $('ca-step'), val = $('ca-val');
    val.textContent = on ? '? M' : fmtVal(s.ca, 3) + ' M';
    if (!on) { sl.value = s.ca; inp.value = s.ca; sl.style.opacity = inp.style.opacity = ''; }

    s.titres = [];
    $('unk-feedback').textContent = '';
    $('unk-feedback').className = 'unk-feedback';
    $('unk-answer').value = '';
    rebuild(); resetTitration(); renderTitres();
  }

  function checkUnknown() {
    var s = state, fb = $('unk-feedback');
    var guess = parseFloat($('unk-answer').value);
    if (isNaN(guess) || guess <= 0) {
      fb.className = 'unk-feedback err';
      fb.textContent = 'Enter your calculated concentration first.';
      return;
    }
    var err = (guess - s.ca) / s.ca * 100;
    var mag = Math.abs(err);
    var cls = mag <= 1 ? 'ok' : mag <= 5 ? 'close' : 'err';
    fb.className = 'unk-feedback ' + cls;
    fb.innerHTML =
      (mag <= 1 ? '✓ ' : mag <= 5 ? '≈ ' : '✗ ') +
      'You determined <strong>' + guess.toFixed(4) + ' M</strong>. The true value was <strong>' +
      s.ca.toFixed(4) + ' M</strong> — an error of ' + (err >= 0 ? '+' : '−') + mag.toFixed(2) + '%.' +
      (mag <= 1 ? ' That is within the precision a careful titration can deliver.'
        : mag <= 5 ? ' Close. Check that you used the mean of the concordant titres and the right mole ratio.'
        : ' Well outside experimental error — the usual causes are the mole ratio (' + s.aR.eq + ' : ' + s.tR.eq +
          ' here) and forgetting to convert mL to litres.');
    if (mag <= 1) playSuccess(); else playError();
  }

  /* ================================================================
     EXPORT TEST REPORT (print-to-PDF, no dependencies)
     ================================================================
     Builds an A4 volumetric-analysis certificate from the recorded
     titres, the current setup and a light-theme render of the curve,
     then opens it for the browser's native Save-as-PDF. Mirrors the
     UTM simulator's report. */

  function escapeHtml(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function kpiCard(label, val, unit) {
    return '<div class="kpi"><div class="lbl">' + label + '</div><div class="val">' + val +
           (unit ? '<span class="unit"> ' + unit + '</span>' : '') + '</div></div>';
  }

  /* The on-screen curve is dark-themed and prints as a black slab.
     Re-render it light on a private canvas and return a PNG dataURL. */
  function buildReportCurve() {
    var s = state, W = 1100, H = 620, i;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var x = c.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);

    var pad = { l: 78, r: 34, t: 54, b: 62 };
    var pw = W - pad.l - pad.r, ph = H - pad.t - pad.b;
    var VX = function (v) { return pad.l + (v / s.vmax) * pw; };
    var PY = function (p) { return pad.t + ph - (p / 14) * ph; };

    x.fillStyle = '#0d47a1';
    x.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    x.textAlign = 'center';
    x.fillText('Titration Curve — pH against Volume of Titrant', W / 2, 26);
    x.fillStyle = '#37474f';
    x.font = '13px "Segoe UI", system-ui, sans-serif';
    x.fillText(s.aR.formula + ' titrated with ' + s.tR.formula +
      '   ·   indicator: ' + indicator(s.ind).name, W / 2, 46);

    /* indicator transition band */
    var ind = indicator(s.ind);
    if (ind.id !== 'none') {
      x.fillStyle = 'rgba(233,30,99,0.10)';
      x.fillRect(pad.l, PY(ind.hi), pw, PY(ind.lo) - PY(ind.hi));
      x.strokeStyle = 'rgba(233,30,99,0.45)'; x.lineWidth = 1;
      x.setLineDash([4, 3]);
      x.beginPath(); x.moveTo(pad.l, PY(ind.lo)); x.lineTo(pad.l + pw, PY(ind.lo));
      x.moveTo(pad.l, PY(ind.hi)); x.lineTo(pad.l + pw, PY(ind.hi)); x.stroke();
      x.setLineDash([]);
      x.fillStyle = '#ad1457';
      x.font = '600 11px "Segoe UI", system-ui, sans-serif';
      x.textAlign = 'left';
      x.fillText(ind.name + '  pH ' + ind.lo.toFixed(1) + '–' + ind.hi.toFixed(1),
                 pad.l + 8, (PY(ind.lo) + PY(ind.hi)) / 2 + 4);
    }

    /* grid + ticks */
    x.strokeStyle = '#cfd8dc'; x.lineWidth = 0.7;
    x.fillStyle = '#455a64';
    x.font = '11px "Courier New", monospace';
    x.textAlign = 'right'; x.textBaseline = 'middle';
    for (i = 0; i <= 14; i += 2) {
      x.beginPath(); x.moveTo(pad.l, PY(i)); x.lineTo(pad.l + pw, PY(i)); x.stroke();
      x.fillText(String(i), pad.l - 8, PY(i));
    }
    var step = s.vmax <= 10 ? 1 : s.vmax <= 30 ? 5 : 10;
    x.textAlign = 'center'; x.textBaseline = 'top';
    for (i = 0; i <= s.vmax + 1e-6; i += step) {
      x.beginPath(); x.moveTo(VX(i), pad.t); x.lineTo(VX(i), pad.t + ph); x.stroke();
      x.fillText(String(i), VX(i), pad.t + ph + 8);
    }

    /* neutral line */
    x.strokeStyle = '#90a4ae'; x.setLineDash([3, 4]); x.lineWidth = 1;
    x.beginPath(); x.moveTo(pad.l, PY(7)); x.lineTo(pad.l + pw, PY(7)); x.stroke();
    x.setLineDash([]);

    /* axes */
    x.strokeStyle = '#37474f'; x.lineWidth = 1.4;
    x.beginPath();
    x.moveTo(pad.l, pad.t); x.lineTo(pad.l, pad.t + ph); x.lineTo(pad.l + pw, pad.t + ph);
    x.stroke();
    x.fillStyle = '#37474f';
    x.font = '600 13px "Segoe UI", system-ui, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.fillText('Volume of ' + s.tR.formula + ' added  (mL)', pad.l + pw / 2, H - 16);
    x.save();
    x.translate(24, pad.t + ph / 2); x.rotate(-Math.PI / 2);
    x.textBaseline = 'middle';
    x.fillText('pH', 0, 0);
    x.restore();

    /* equivalence markers (suppressed while the sample is unknown) */
    if (!s.unknown) {
      for (i = 0; i < s.veqs.length; i++) {
        var ve = s.veqs[i];
        if (ve > s.vmax) continue;
        var pe = phAt(ve);
        x.strokeStyle = '#2e7d32'; x.setLineDash([6, 4]); x.lineWidth = 1.2;
        x.beginPath(); x.moveTo(VX(ve), pad.t); x.lineTo(VX(ve), pad.t + ph); x.stroke();
        x.setLineDash([]);
        x.fillStyle = '#2e7d32';
        x.beginPath(); x.arc(VX(ve), PY(pe), 5, 0, Math.PI * 2); x.fill();
        x.font = '600 11px "Segoe UI", system-ui, sans-serif';
        x.textAlign = 'center'; x.textBaseline = 'bottom';
        x.fillText((s.veqs.length > 1 ? 'eq ' + (i + 1) + '  ' : '') + ve.toFixed(2) + ' mL',
                   VX(ve), pad.t + ph - 8);
      }
    }

    /* the curve */
    x.strokeStyle = '#c2185b'; x.lineWidth = 2.4;
    x.lineJoin = 'round'; x.lineCap = 'round';
    x.beginPath();
    var started = false;
    for (i = 0; i < s.curve.length; i++) {
      var pt = s.curve[i];
      if (pt.v > s.vmax) break;
      if (!started) { x.moveTo(VX(pt.v), PY(pt.ph)); started = true; }
      else x.lineTo(VX(pt.v), PY(pt.ph));
    }
    x.stroke();

    x.strokeStyle = '#b0bec5'; x.lineWidth = 1;
    x.strokeRect(pad.l, pad.t, pw, ph);
    return c.toDataURL('image/png');
  }

  /* There is nothing to certify until titrant has been delivered. Enabled by
     either a recorded titre or a run currently on the bench. */
  function hasExperiment() {
    return state.titres.length > 0 || state.v > 0;
  }

  function updateReportBtns() {
    var on = hasExperiment(), i;
    var btns = [$('btn-report'), $('btn-report-dock')];
    for (i = 0; i < btns.length; i++) {
      if (!btns[i]) continue;
      btns[i].disabled = !on;
      btns[i].title = on
        ? 'Export a printable A4 test report and save it as PDF'
        : 'Run a titration first — deliver some titrant, or record a titre, before exporting a report';
    }
  }

  function exportReport() {
    var s = state;
    if (!hasExperiment()) { playError(); return; }
    var ind = indicator(s.ind);
    var good = concordantSet(s.titres);
    var meanTitre = null;
    if (good.length) {
      var tot = 0, j;
      for (j = 0; j < good.length; j++) tot += s.titres[good[j]].titre;
      meanTitre = tot / good.length;
    } else if (s.v > 0) {
      meanTitre = s.v;                 /* fall back to the run on the bench */
    }

    var now = new Date();
    var dateStr = now.toISOString().slice(0, 10);
    var timeStr = now.toTimeString().slice(0, 5);
    var reportNo = 'TIT-' + dateStr.replace(/-/g, '') + '-' + Math.floor(Math.random() * 9000 + 1000);

    var za = s.aR.eq, zt = s.tR.eq;
    var determined = meanTitre == null ? null
      : (s.ct * meanTitre / 1000) * (zt / za) / (s.va / 1000);
    var absU = meanTitre == null ? null : 2 * BURETTE_UNC;
    var pctU = (meanTitre && meanTitre > 0) ? absU / meanTitre * 100 : null;

    var veqLast = s.veqs[s.veqs.length - 1];
    var phEq = phAt(Math.min(veqLast, s.vmaxDeliver));

    var verdict, verdictClass;
    if (ind.id === 'none') {
      verdict = 'No indicator was used. The end point must be located from the peak of the first derivative dpH/dV, as in a potentiometric titration.';
      verdictClass = 'neutral';
    } else if (s.endV == null) {
      verdict = 'The chosen indicator (' + ind.name + ', pH ' + ind.lo.toFixed(1) + '–' + ind.hi.toFixed(1) +
                ') never reaches its transition range in this titration, so it would not change colour at all. It is unsuitable.';
      verdictClass = 'bad';
    } else {
      var mag = Math.abs(s.errPct);
      verdict = ind.name + ' reaches the midpoint of its transition range at ' + s.endV.toFixed(2) +
                ' mL against a calculated equivalence volume of ' + s.veqs[s.errRef].toFixed(2) +
                ' mL, a titration error of ' + (s.errPct >= 0 ? '+' : '−') + mag.toFixed(2) + '%. ';
      if (mag <= 0.5) { verdict += 'This is within the 0.5% normally accepted for volumetric analysis, so the indicator is suitable.'; verdictClass = 'ok'; }
      else if (mag <= 2) { verdict += 'This exceeds the 0.5% normally accepted; the indicator is marginal and will bias the result.'; verdictClass = 'warn'; }
      else { verdict += 'This is far outside acceptable limits — the colour change occurs well away from the equivalence point and the indicator is unsuitable.'; verdictClass = 'bad'; }
    }

    /* results table rows */
    var rowsHtml = '', k;
    if (s.titres.length) {
      for (k = 0; k < s.titres.length; k++) {
        var t = s.titres[k];
        var isGood = good.indexOf(k) !== -1;
        var tag = t.rough ? 'Rough — discarded' : isGood ? 'Concordant' : 'Discarded (outlier)';
        rowsHtml += '<tr' + (isGood ? ' class="hl"' : '') + '><td>' + (k + 1) + '</td><td>' +
                    t.init.toFixed(2) + '</td><td>' + t.fin.toFixed(2) + '</td><td><b>' +
                    t.titre.toFixed(2) + '</b></td><td>' + tag + '</td></tr>';
      }
    } else {
      rowsHtml = '<tr><td>1</td><td>' + s.burStart.toFixed(2) + '</td><td>' + (s.burStart + s.v).toFixed(2) +
                 '</td><td><b>' + s.v.toFixed(2) + '</b></td><td>Single run (not repeated)</td></tr>';
    }

    var curveImg = buildReportCurve();
    var f4 = function (v) { return v == null ? '—' : v.toFixed(4); };
    var f2 = function (v) { return v == null ? '—' : v.toFixed(2); };

    var html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<title>Titration Report — ' + reportNo + '</title><style>' +
      '@page { size: A4; margin: 14mm 16mm; }' +
      '* { box-sizing: border-box; }' +
      'body { font-family: "Segoe UI","Helvetica Neue",Arial,sans-serif; color:#111; margin:0; padding:0; font-size:10.5pt; line-height:1.45; }' +
      '.report { max-width:190mm; margin:0 auto; }' +
      '.hd { display:flex; align-items:flex-start; justify-content:space-between; border-bottom:3px solid #ad1457; padding-bottom:10px; margin-bottom:14px; }' +
      '.hd-l h1 { margin:0; font-size:18pt; color:#880e4f; letter-spacing:.3px; }' +
      '.hd-l .sub { margin-top:2px; font-size:9.5pt; color:#444; }' +
      '.hd-r { text-align:right; font-size:9pt; color:#333; }' +
      '.hd-r .rno { font-weight:700; color:#880e4f; font-size:11pt; }' +
      'h2 { font-size:11pt; color:#880e4f; margin:16px 0 6px; border-bottom:1px solid #b0bec5; padding-bottom:2px; letter-spacing:.4px; text-transform:uppercase; }' +
      'table { width:100%; border-collapse:collapse; margin-bottom:6px; font-size:10pt; }' +
      'th,td { text-align:left; padding:5px 9px; border-bottom:1px solid #e0e6ed; }' +
      'th { background:#eceff1; color:#37474f; font-weight:600; }' +
      '.kv th { width:42%; }' +
      'td { color:#111; font-variant-numeric:tabular-nums; }' +
      'tr.hl td { background:#e8f5e9; }' +
      '.two-col { display:grid; grid-template-columns:1fr 1fr; gap:0 18px; }' +
      '.curve-wrap { margin-top:8px; border:1px solid #cfd8dc; padding:6px; background:#fafbfc; }' +
      '.curve-wrap img { width:100%; height:auto; display:block; }' +
      '.results-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin-top:6px; }' +
      '.kpi { border:1px solid #cfd8dc; padding:8px 10px; border-radius:4px; background:#f5f7fa; }' +
      '.kpi .lbl { font-size:8pt; color:#546e7a; text-transform:uppercase; letter-spacing:.5px; font-weight:600; }' +
      '.kpi .val { font-size:13.5pt; font-weight:700; color:#880e4f; font-variant-numeric:tabular-nums; }' +
      '.kpi .unit { font-size:9pt; color:#37474f; margin-left:2px; }' +
      '.verdict { margin-top:10px; padding:10px 14px; font-size:10pt; border-left:4px solid #ad1457; background:#fce4ec; }' +
      '.verdict.ok { border-left-color:#2e7d32; background:#e8f5e9; }' +
      '.verdict.warn { border-left-color:#ef6c00; background:#fff3e0; }' +
      '.verdict.bad { border-left-color:#c62828; background:#ffebee; }' +
      '.calc { background:#fafbfc; border:1px solid #e0e6ed; border-radius:4px; padding:10px 14px; font-family:"Courier New",monospace; font-size:9.5pt; line-height:1.9; }' +
      '.note { font-size:9pt; color:#546e7a; margin-top:6px; }' +
      '.sign-row { display:grid; grid-template-columns:1fr 1fr; gap:30px; margin-top:22px; }' +
      '.sign-box { border-top:1px solid #455a64; padding-top:4px; font-size:9pt; color:#37474f; }' +
      '.foot { margin-top:16px; padding-top:8px; border-top:1px solid #b0bec5; font-size:8.5pt; color:#546e7a; display:flex; justify-content:space-between; }' +
      '.bar { background:#880e4f; color:#fff; padding:14px 18px; text-align:center; font-size:11pt; }' +
      '.bar button { background:#fff; color:#880e4f; border:0; padding:7px 18px; font-weight:700; border-radius:4px; cursor:pointer; margin:0 6px; }' +
      '@media print { .no-print { display:none !important; } body { font-size:10pt; } }' +
      '</style></head><body>' +
      '<div class="bar no-print">Use your browser&rsquo;s print dialog (Ctrl/Cmd + P) to <b>Save as PDF</b>.' +
      '<button onclick="window.print()">Print / Save as PDF</button>' +
      '<button onclick="window.close()">Close</button></div>' +
      '<div class="report">' +
      '<div class="hd"><div class="hd-l"><h1>Acid&ndash;Base Titration &mdash; Test Report</h1>' +
      '<div class="sub">Volumetric analysis by ' + escapeHtml(ind.id === 'none' ? 'potentiometric end-point detection' : ind.name + ' indicator') + '</div></div>' +
      '<div class="hd-r"><div class="rno">Report No. ' + reportNo + '</div><div>Date: ' + dateStr +
      '</div><div>Time: ' + timeStr + '</div><div>Lab: NHIT VisualLab Virtual Titration</div></div></div>' +

      '<h2>1. Method &amp; Reagents</h2><div class="two-col">' +
      '<table class="kv">' +
      '<tr><th>Analyte (in flask)</th><td>' + escapeHtml(s.aR.name) + ' (' + s.aR.formula + ')</td></tr>' +
      '<tr><th>Analyte type</th><td>' + (s.aR.strong ? 'Strong' : 'Weak') + ' ' + s.aR.kind +
        (s.aR.sys && !s.aR.strong ? ', pK<sub>a</sub> ' + s.aR.sys.pKa.join(', ') : '') + '</td></tr>' +
      '<tr><th>Aliquot volume (pipette)</th><td>' + s.va.toFixed(2) + ' mL</td></tr>' +
      '<tr><th>Analyte concentration</th><td>' + (s.unknown ? '<b>Unknown &mdash; to be determined</b>' : s.ca.toFixed(4) + ' mol dm<sup>&minus;3</sup>') + '</td></tr>' +
      '</table><table class="kv">' +
      '<tr><th>Titrant (in burette)</th><td>' + escapeHtml(s.tR.name) + ' (' + s.tR.formula + ')</td></tr>' +
      '<tr><th>Titrant concentration</th><td>' + s.ct.toFixed(4) + ' mol dm<sup>&minus;3</sup></td></tr>' +
      '<tr><th>Indicator</th><td>' + escapeHtml(ind.name) + (ind.id === 'none' ? '' : ' (pH ' + ind.lo.toFixed(1) + '&ndash;' + ind.hi.toFixed(1) + ')') + '</td></tr>' +
      '<tr><th>Stoichiometric ratio</th><td>' + za + ' mol analyte : ' + zt + ' mol titrant</td></tr>' +
      '</table></div>' +

      '<h2>2. Burette Readings</h2>' +
      '<table><thead><tr><th>Run</th><th>Initial / mL</th><th>Final / mL</th><th>Titre / mL</th><th>Status</th></tr></thead>' +
      '<tbody>' + rowsHtml + '</tbody></table>' +
      '<div class="note">Each burette reading carries an uncertainty of &plusmn;' + BURETTE_UNC.toFixed(2) +
      ' mL. A titre is the difference of two readings, so its absolute uncertainty is &plusmn;' + (2 * BURETTE_UNC).toFixed(2) +
      ' mL. Titres agreeing within ' + CONCORDANT.toFixed(2) + ' mL are concordant; the rough run is excluded from the mean.</div>' +

      '<h2>3. Results</h2><div class="results-grid">' +
      kpiCard('Mean titre', f2(meanTitre), 'mL') +
      kpiCard('Uncertainty', meanTitre == null ? '—' : '±' + absU.toFixed(2), 'mL') +
      kpiCard('Relative uncert.', pctU == null ? '—' : pctU.toFixed(2), '%') +
      kpiCard('Runs averaged', good.length ? String(good.length) : '—', '') +
      kpiCard(s.unknown ? 'Determined conc.' : 'Calculated conc.', f4(determined), 'M') +
      kpiCard('Equivalence vol.', s.unknown ? '—' : f2(veqLast), 'mL') +
      kpiCard('pH at equivalence', s.unknown ? '—' : phEq.toFixed(2), '') +
      kpiCard('Titration error', (s.unknown || s.errPct == null) ? '—' : (s.errPct >= 0 ? '+' : '−') + Math.abs(s.errPct).toFixed(2), '%') +
      '</div>' +

      '<h2>4. Calculation</h2><div class="calc">' +
      'n(titrant)  = c<sub>t</sub> &times; V<sub>t</sub> = ' + s.ct.toFixed(4) + ' &times; ' +
        (meanTitre == null ? '—' : (meanTitre / 1000).toFixed(5)) + ' L = ' +
        (meanTitre == null ? '—' : (s.ct * meanTitre / 1000).toExponential(4)) + ' mol<br>' +
      'n(analyte)  = n(titrant) &times; ' + za + '/' + zt + ' = ' +
        (meanTitre == null ? '—' : ((s.ct * meanTitre / 1000) * (za / zt)).toExponential(4)) + ' mol<br>' +
      'c(analyte)  = n(analyte) / V<sub>a</sub> = ' +
        (meanTitre == null ? '—' : ((s.ct * meanTitre / 1000) * (za / zt)).toExponential(4)) + ' / ' +
        (s.va / 1000).toFixed(5) + ' L<br>' +
      '<b>c(analyte) = ' + f4(determined) + ' mol dm<sup>&minus;3</sup></b>' +
      '</div>' +
      (s.unknown || determined == null || s.ca <= 0 ? '' :
        '<div class="note">Nominal (prepared) concentration was ' + s.ca.toFixed(4) +
        ' mol dm<sup>&minus;3</sup>; the titration recovered ' + f4(determined) + ' mol dm<sup>&minus;3</sup>, a deviation of ' +
        (((determined - s.ca) / s.ca * 100) >= 0 ? '+' : '−') +
        Math.abs((determined - s.ca) / s.ca * 100).toFixed(2) + '%.</div>') +

      '<h2>5. Titration Curve</h2><div class="curve-wrap"><img src="' + curveImg + '" alt="Titration curve"></div>' +

      '<h2>6. Observations &amp; Conclusion</h2>' +
      '<div class="verdict ' + verdictClass + '"><b>Indicator assessment:</b> ' + escapeHtml(verdict) + '</div>' +
      '<div class="note">pH values are computed by solving the exact charge-balance equation of the mixture at every volume. ' +
      'Model assumptions: concentrations used in place of activities, 25 &deg;C (K<sub>w</sub> = 1.0 &times; 10<sup>&minus;14</sup>), ' +
      'no absorbed atmospheric CO<sub>2</sub>, and the indicator treated as a spectator.</div>' +

      '<div class="sign-row"><div class="sign-box">Analyst ___________________________</div>' +
      '<div class="sign-box">Checked by ___________________________</div></div>' +

      '<div class="foot"><div>Generated by NHIT VisualLab Virtual Titration &middot; NHIT VisualLab</div>' +
      '<div>Apparatus per ISO 385 (burettes) &amp; ISO 648 (pipettes)</div></div>' +
      '</div>' +
      '<' + 'script>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},400);});</' + 'script>' +
      '</body></html>';

    var win = window.open('', '_blank', 'width=920,height=1100');
    if (!win) {
      alert('Pop-up blocked. Allow pop-ups for this site to export the report.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function setMode(m) {
    state.mode = m;
    $('sec-simulate').className  = m === 'simulate'  ? '' : 'hidden';
    $('sec-calculate').className = m === 'calculate' ? '' : 'hidden';
    $('sec-explore').className   = m === 'explore'   ? '' : 'hidden';
    $('sec-practice').className  = m === 'practice'  ? '' : 'hidden';
    $('sec-quiz').className      = m === 'quiz'      ? '' : 'hidden';
    if (m === 'calculate') renderCalc();
    if (m === 'simulate') refresh();
    if (m === 'explore') renderExplore(document.querySelector('#explore-tabs .pill.active').getAttribute('data-value'));
  }

  function wire() {
    /* mode tabs */
    $('mode-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      var tabs = this.querySelectorAll('.pill'), i;
      for (i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
      b.classList.add('active');
      playClick();
      setMode(b.getAttribute('data-value'));
    });

    /* explore tabs */
    $('explore-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.pill'); if (!b) return;
      var tabs = this.querySelectorAll('.pill'), i;
      for (i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
      b.classList.add('active');
      playClick();
      renderExplore(b.getAttribute('data-value'));
    });

    /* setup controls — any change refills the burette */
    analyteSel.addEventListener('change', function () {
      if (state.unknown) { this.value = state.analyte; return; }   /* sample is sealed */
      state.analyte = this.value;
      populateSelects(true);
      rebuild(); resetTitration();
    });
    titrantSel.addEventListener('change', function () {
      if (state.unknown) { this.value = state.titrant; return; }
      state.titrant = this.value; rebuild(); resetTitration();
    });
    indSel.addEventListener('change', function () {
      state.ind = this.value; computeEndPoint(); refresh();
    });

    bindQuantity('ca-slider', 'ca-step', 'ca-val', 'ca', 3, 'M');
    bindQuantity('va-slider', 'va-step', 'va-val', 'va', 1, 'mL');
    bindQuantity('ct-slider', 'ct-step', 'ct-val', 'ct', 3, 'M');

    /* Stepper buttons read the base from the TEXT input, which holds the
       un-snapped decimal — reading slider.value would round 0.125 to 0.13
       before incrementing and quietly destroy the typed precision. */
    var btns = document.querySelectorAll('.stepper-btn'), bi;
    for (bi = 0; bi < btns.length; bi++) {
      btns[bi].addEventListener('click', function () {
        var sl = $(this.getAttribute('data-target'));
        var wrap = this.parentElement;
        var inp = wrap.querySelector('.stepper-input');
        if (!sl || !inp) return;
        var inc = parseFloat(this.getAttribute('data-inc')) || 1;
        var dir = parseFloat(this.getAttribute('data-dir')) || 1;
        var base = parseFloat(inp.value);
        if (isNaN(base)) base = parseFloat(sl.value);
        inp.value = roundTo(clampNum(base + dir * inc, parseFloat(sl.min), parseFloat(sl.max)), PREC);
        inp.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    /* dock actions — hold to keep the tap open, like a real burette */
    bindHold($('btn-drop'), 0.05, [90, 55, 34]);
    bindHold($('btn-ml'), 1.0, [150, 95, 62]);
    $('btn-reset').addEventListener('click', function () { playClick(); resetTitration(); });
    $('btn-run').addEventListener('click', function () {
      if (!state.running) {
        /* human reaction time between seeing the colour and closing the tap */
        state.runOvershoot = 0.05 + Math.random() * 0.20;
        state.runHitCap = false;
      }
      state.running = !state.running;
      this.classList.toggle('running', state.running);
      this.innerHTML = state.running ? '\u23f8 Pause' : '\u25b6 Run';
      playClick();
      schedule();
    });
    $('btn-record').addEventListener('click', recordTitre);
    $('btn-unknown').addEventListener('click', function () { playClick(); setUnknown(!state.unknown); });
    $('btn-check-unknown').addEventListener('click', checkUnknown);
    $('unk-answer').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkUnknown(); });
    $('btn-report').addEventListener('click', function () { playClick(); exportReport(); });
    $('btn-report-dock').addEventListener('click', function () { playClick(); exportReport(); });
    $('btn-clear-titres').addEventListener('click', function () {
      state.titres = []; renderTitres(); playClick();
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

    /* display panel */
    $('display-toggle').addEventListener('click', function () {
      var p = $('canvas-display');
      var collapsed = p.getAttribute('data-collapsed') === 'true';
      p.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
      this.setAttribute('aria-expanded', collapsed ? 'true' : 'false');
    });
    $('display-toggles').addEventListener('click', function (e) {
      var b = e.target.closest('.toggle-chip'); if (!b) return;
      if (b.id === 'btn-sound') {
        state.sound = !state.sound;
        b.classList.toggle('active', state.sound);
        b.setAttribute('aria-pressed', state.sound ? 'true' : 'false');
        b.querySelector('.snd-ico').innerHTML = state.sound ? '&#128266;' : '&#128263;';
        return;
      }
      var key = b.getAttribute('data-tg'); if (!key) return;
      state.show[key] = !state.show[key];
      b.classList.toggle('active', state.show[key]);
      playClick();
      draw();
    });

    /* practice */
    $('btn-new-q').addEventListener('click', newProblem);
    $('btn-check').addEventListener('click', checkProblem);
    $('btn-show-sol').addEventListener('click', showSolution);
    $('pq-mcq').addEventListener('click', function (e) {
      var b = e.target.closest('.pq-opt'); if (!b) return;
      var all = this.querySelectorAll('.pq-opt'), i;
      for (i = 0; i < all.length; i++) all[i].className = 'pq-opt';
      b.className = 'pq-opt selected';
      state.pSel = b.getAttribute('data-opt');
    });
    $('pq-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkProblem(); });

    /* quiz */
    wireCalc();
    $('btn-start-quiz').addEventListener('click', startQuiz);
    $('btn-submit-q').addEventListener('click', submitQuiz);
    $('btn-next-q').addEventListener('click', nextQuiz);
    $('qq-options').addEventListener('click', function (e) {
      var b = e.target.closest('.qq-opt'); if (!b) return;
      var all = this.querySelectorAll('.qq-opt'), i;
      for (i = 0; i < all.length; i++) all[i].className = 'qq-opt';
      b.className = 'qq-opt selected';
      state.qSel = parseInt(b.getAttribute('data-i'), 10);
    });

    /* canvas scrub — hover the graph to read pH at any volume */
    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      var x = (e.clientX - r.left) * (W / r.width);
      var y = (e.clientY - r.top) * (H / r.height);
      var inPlot = x >= GX && x <= GX + GW && y >= GY && y <= GY + GH;
      var nv = inPlot ? ((x - GX) / GW) * state.vmax : null;
      if (nv !== state.scrubV) { state.scrubV = nv; draw(); }
    });
    canvas.addEventListener('pointerleave', function () {
      if (state.scrubV != null) { state.scrubV = null; draw(); }
    });

    /* context menu */
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var m = $('canvas-ctx-menu');
      m.className = 'ctx-menu';
      m.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
      m.style.top  = Math.min(e.clientY, window.innerHeight - 140) + 'px';
    });
    document.addEventListener('click', function () { $('canvas-ctx-menu').className = 'ctx-menu hidden'; });
    $('ctx-export-png').addEventListener('click', exportPNG);
    $('ctx-export-csv').addEventListener('click', exportCSV);
    $('ctx-reset').addEventListener('click', resetTitration);

    window.addEventListener('resize', function () { fitCanvas(); draw(); });
    if (window.ResizeObserver) {
      new ResizeObserver(function () { fitCanvas(); draw(); }).observe(canvas);
    }
  }

  /* ── 19. Init ──────────────────────────────────────────────── */

  function init() {
    populateSelects(false);
    state.burStart = Math.round(Math.random() * 12) * 0.05;   /* realistic on first load too */
    rebuild();
    fitCanvas();
    wire();
    renderTitres();
    updateReportBtns();
    renderExplore('basics');
    refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
