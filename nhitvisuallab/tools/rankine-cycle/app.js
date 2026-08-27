/* ═══════════════════════════════════════════════════════════════════════
   Rankine & Carnot Cycle Simulator — app.js
   Steam power cycle: schematic + T-s / P-v diagrams, thermal efficiency.
   Property model: embedded saturated + superheated steam tables (Cengel A-5/A-6),
   bilinear interpolation in (log P, T). Educational accuracy ±~1%.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };

  /* ═══════════ STEAM PROPERTY TABLES ═══════════════════════════════════
     SAT row: [P(kPa), Tsat(°C), hf, hg, sf, sg, vf, vg(m³/kg)]            */
  var SAT = [
    [5, 32.87, 137.75, 2560.7, 0.4763, 8.3938, 0.001005, 28.19],
    [10, 45.81, 191.81, 2583.9, 0.6492, 8.1501, 0.001010, 14.670],
    [20, 60.06, 251.40, 2609.7, 0.8320, 7.9085, 0.001017, 7.6490],
    [40, 75.87, 317.58, 2636.1, 1.0259, 7.6691, 0.001026, 3.9930],
    [50, 81.32, 340.49, 2645.2, 1.0912, 7.5931, 0.001030, 3.2400],
    [75, 91.76, 384.39, 2662.4, 1.2130, 7.4564, 0.001037, 2.2170],
    [100, 99.61, 417.46, 2675.0, 1.3026, 7.3589, 0.001043, 1.6941],
    [150, 111.35, 467.13, 2693.1, 1.4337, 7.2231, 0.001053, 1.1593],
    [200, 120.21, 504.70, 2706.3, 1.5301, 7.1271, 0.001061, 0.88578],
    [300, 133.52, 561.43, 2724.9, 1.6716, 6.9909, 0.001073, 0.60582],
    [400, 143.61, 604.74, 2738.1, 1.7766, 6.8955, 0.001084, 0.46242],
    [500, 151.83, 640.23, 2748.7, 1.8607, 6.8212, 0.001093, 0.37483],
    [600, 158.83, 670.56, 2756.8, 1.9312, 6.7600, 0.001101, 0.31560],
    [800, 170.41, 721.11, 2769.1, 2.0462, 6.6628, 0.001115, 0.24035],
    [1000, 179.88, 762.81, 2778.1, 2.1387, 6.5865, 0.001127, 0.19436],
    [1500, 198.29, 844.84, 2792.2, 2.3150, 6.4448, 0.001154, 0.13177],
    [2000, 212.38, 908.79, 2799.5, 2.4474, 6.3409, 0.001177, 0.099587],
    [2500, 223.95, 962.11, 2803.1, 2.5547, 6.2575, 0.001197, 0.079952],
    [3000, 233.85, 1008.4, 2804.2, 2.6457, 6.1869, 0.001217, 0.066664],
    [4000, 250.35, 1087.4, 2800.8, 2.7965, 6.0696, 0.001252, 0.049779],
    [5000, 263.94, 1154.5, 2794.3, 2.9207, 5.9737, 0.001286, 0.039448],
    [6000, 275.59, 1213.4, 2785.0, 3.0273, 5.8902, 0.001319, 0.032448],
    [8000, 295.06, 1316.6, 2758.7, 3.2076, 5.7450, 0.001384, 0.023525],
    [10000, 311.06, 1407.9, 2725.5, 3.3603, 5.6160, 0.001452, 0.018026],
    [15000, 342.16, 1610.3, 2610.5, 3.6848, 5.3098, 0.001658, 0.010337]
  ];

  /* Superheated steam: SUP[P_kPa] = [ [T°C, h(kJ/kg), s(kJ/kg·K)], ... ] */
  var SUP = {
    10:   [[100,2687.5,8.4489],[150,2783.0,8.6892],[200,2879.6,8.9049],[250,2977.5,9.1015],[300,3076.7,9.2827],[400,3280.0,9.6094],[500,3489.7,9.8998],[600,3706.3,10.1608]],
    50:   [[100,2682.4,7.6953],[150,2780.2,7.9413],[200,2877.8,8.1592],[250,2976.2,8.3568],[300,3075.8,8.5387],[400,3279.3,8.8659],[500,3489.3,9.1566],[600,3706.0,9.4178]],
    100:  [[150,2776.6,7.6147],[200,2875.5,7.8356],[250,2974.5,8.0346],[300,3074.5,8.2172],[400,3278.6,8.5452],[500,3488.7,8.8362],[600,3705.6,9.0976]],
    200:  [[150,2769.1,7.2810],[200,2870.7,7.5081],[250,2971.2,7.7100],[300,3072.1,7.8941],[400,3277.0,8.2236],[500,3487.7,8.5153],[600,3704.8,8.7770]],
    300:  [[200,2865.9,7.3132],[250,2967.9,7.5180],[300,3069.6,7.7037],[400,3275.5,8.0347],[500,3486.6,8.3271],[600,3704.0,8.5892]],
    500:  [[200,2855.8,7.0610],[250,2961.0,7.2725],[300,3064.6,7.4614],[350,3167.9,7.6346],[400,3272.3,7.7948],[500,3484.5,8.0879],[600,3702.5,8.3506]],
    700:  [[200,2845.3,6.8865],[250,2954.0,7.1053],[300,3059.5,7.2979],[400,3269.0,7.6362],[500,3482.3,7.9305],[600,3700.9,8.1937]],
    1000: [[200,2827.9,6.6940],[250,2942.6,6.9247],[300,3051.6,7.1229],[350,3158.2,7.3011],[400,3263.9,7.4651],[500,3478.5,7.7622],[600,3697.9,8.0290]],
    1500: [[250,2923.2,6.7090],[300,3037.6,6.9179],[350,3147.5,7.1025],[400,3255.8,7.2690],[500,3473.1,7.5698],[600,3694.0,7.8385]],
    2000: [[250,2902.5,6.5453],[300,3023.5,6.7664],[350,3137.0,6.9563],[400,3247.6,7.1271],[450,3357.5,7.2829],[500,3467.6,7.4317],[600,3690.1,7.7024]],
    3000: [[250,2855.8,6.2872],[300,2993.5,6.5390],[350,3115.3,6.7428],[400,3230.9,6.9212],[450,3344.0,7.0833],[500,3456.5,7.2338],[550,3569.1,7.3754],[600,3682.3,7.5085]],
    4000: [[300,2960.7,6.3615],[350,3092.5,6.5821],[400,3213.6,6.7690],[450,3330.3,6.9363],[500,3445.3,7.0901],[550,3559.9,7.2338],[600,3674.4,7.3688]],
    6000: [[300,2884.2,6.0674],[350,3043.0,6.3335],[400,3178.3,6.5408],[450,3302.9,6.7193],[500,3422.2,6.8803],[550,3540.0,7.0288],[600,3658.4,7.1685]],
    8000: [[300,2785.0,5.7937],[350,2988.1,6.1321],[400,3139.4,6.3658],[450,3273.3,6.5579],[500,3399.5,6.7266],[550,3521.8,6.8800],[600,3642.4,7.0221]],
    10000:[[350,2924.0,5.9460],[400,3097.5,6.2141],[450,3242.5,6.4219],[500,3375.1,6.5995],[550,3502.0,6.7585],[600,3625.8,6.9045]],
    15000:[[400,2975.7,5.8819],[450,3157.9,6.1434],[500,3310.8,6.3479],[550,3450.4,6.5230],[600,3583.3,6.6796]]
  };
  var SUP_P = Object.keys(SUP).map(Number).sort(function (a, b) { return a - b; });

  var TCRIT = 373.95, PCRIT = 22064; // critical point of water

  function lerp(a, b, t) { return a + (b - a) * t; }

  /* Saturated properties at pressure P(kPa), linear interpolation. */
  function satByP(P) {
    P = clamp(P, SAT[0][0], SAT[SAT.length - 1][0]);
    var i = 0;
    for (; i < SAT.length - 1; i++) { if (SAT[i + 1][0] >= P) break; }
    var a = SAT[i], b = SAT[Math.min(i + 1, SAT.length - 1)];
    var t = b[0] === a[0] ? 0 : (P - a[0]) / (b[0] - a[0]);
    return {
      P: P, T: lerp(a[1], b[1], t),
      hf: lerp(a[2], b[2], t), hg: lerp(a[3], b[3], t),
      sf: lerp(a[4], b[4], t), sg: lerp(a[5], b[5], t),
      vf: lerp(a[6], b[6], t), vg: lerp(a[7], b[7], t)
    };
  }

  /* Saturated properties at temperature T(°C) — used for dome sampling. */
  function satByT(T) {
    var lo = SAT[0], hi = SAT[SAT.length - 1];
    if (T <= lo[1]) return satByP(lo[0]);
    if (T >= hi[1]) return satByP(hi[0]);
    var i = 0;
    for (; i < SAT.length - 1; i++) { if (SAT[i + 1][1] >= T) break; }
    var a = SAT[i], b = SAT[i + 1];
    var t = (T - a[1]) / (b[1] - a[1]);
    return {
      P: lerp(a[0], b[0], t), T: T,
      hf: lerp(a[2], b[2], t), hg: lerp(a[3], b[3], t),
      sf: lerp(a[4], b[4], t), sg: lerp(a[5], b[5], t),
      vf: lerp(a[6], b[6], t), vg: lerp(a[7], b[7], t)
    };
  }

  /* Interp a superheated column (one pressure) at temperature T → {h,s}.
     Column gets the saturation anchor (Tsat,hg,sg) prepended for continuity. */
  function colInterp(P, rows, T) {
    var s = satByP(P);
    var pts = [[s.T, s.hg, s.sg]].concat(rows);
    if (T <= pts[0][0]) return { h: pts[0][1], s: pts[0][2] };
    var n = pts.length;
    if (T >= pts[n - 1][0]) {
      // extrapolate along last segment (constant-cp-ish)
      var p = pts[n - 2], q = pts[n - 1];
      var tt = (T - p[0]) / (q[0] - p[0]);
      return { h: lerp(p[1], q[1], tt), s: lerp(p[2], q[2], tt) };
    }
    for (var i = 0; i < n - 1; i++) {
      if (pts[i + 1][0] >= T) {
        var t = (T - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
        return { h: lerp(pts[i][1], pts[i + 1][1], t), s: lerp(pts[i][2], pts[i + 1][2], t) };
      }
    }
    return { h: pts[n - 1][1], s: pts[n - 1][2] };
  }

  /* Superheated properties at (P,T): bilinear in (log P, T). */
  function supProps(P, T) {
    P = clamp(P, SUP_P[0], SUP_P[SUP_P.length - 1]);
    var lo = SUP_P[0], hi = SUP_P[SUP_P.length - 1];
    for (var k = 0; k < SUP_P.length - 1; k++) {
      if (SUP_P[k] <= P && SUP_P[k + 1] >= P) { lo = SUP_P[k]; hi = SUP_P[k + 1]; break; }
    }
    var cLo = colInterp(lo, SUP[lo], T);
    if (lo === hi) { var v = 0.4615 * (T + 273.15) / P; return { h: cLo.h, s: cLo.s, v: v }; }
    var cHi = colInterp(hi, SUP[hi], T);
    var w = (Math.log(P) - Math.log(lo)) / (Math.log(hi) - Math.log(lo));
    var h = lerp(cLo.h, cHi.h, w), s = lerp(cLo.s, cHi.s, w);
    var vv = 0.4615 * (T + 273.15) / P; // ideal-gas estimate for superheated v
    return { h: h, s: s, v: vv };
  }

  /* Find superheated temperature (°C) at pressure P with given entropy s. */
  function tempFromPs(P, sTarget) {
    var lo = 50, hi = 700, fLo, fHi;
    fLo = supProps(P, lo).s; fHi = supProps(P, hi).s;
    if (sTarget <= fLo) return lo;
    if (sTarget >= fHi) return hi;
    for (var it = 0; it < 40; it++) {
      var mid = (lo + hi) / 2, fm = supProps(P, mid).s;
      if (fm < sTarget) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }
  function tempFromPh(P, hTarget) {
    var lo = 50, hi = 700;
    if (hTarget <= supProps(P, lo).h) return lo;
    if (hTarget >= supProps(P, hi).h) return hi;
    for (var it = 0; it < 40; it++) {
      var mid = (lo + hi) / 2;
      if (supProps(P, mid).h < hTarget) lo = mid; else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /* ═══════════ CYCLE COMPUTATION ═══════════════════════════════════════ */
  // Returns state points {p:kPa, T:°C, h:kJ/kg, s:kJ/kg·K, v:m³/kg, x:quality|null}
  function computeRankine(st) {
    var Ph = st.pHigh, Pl = st.pLow;
    var sLow = satByP(Pl), sHigh = satByP(Ph);
    var etaT = st.etaT / 100, etaP = st.etaP / 100;

    // State 1 — saturated liquid leaving condenser
    var s1 = { p: Pl, T: sLow.T, h: sLow.hf, s: sLow.sf, v: sLow.vf, x: 0 };
    // State 2 — after pump (compressed liquid)
    var wPumpS = s1.v * (Ph - Pl);          // kJ/kg, isentropic
    var wPump = wPumpS / etaP;
    var s2 = { p: Ph, T: sHigh.T < s1.T ? s1.T : s1.T + wPump / 4.18, h: s1.h + wPump, s: s1.s, v: s1.v, x: null };
    // State 3 — boiler exit
    var T3 = st.t3, s3;
    if (T3 <= sHigh.T + 0.5) {              // saturated / dry-saturated vapour
      s3 = { p: Ph, T: sHigh.T, h: sHigh.hg, s: sHigh.sg, v: sHigh.vg, x: 1 };
    } else {
      var p3 = supProps(Ph, T3);
      s3 = { p: Ph, T: T3, h: p3.h, s: p3.s, v: p3.v, x: null };
    }
    // State 4 — turbine exit at Pl
    var s4s_entropy = s3.s, h4s, x4s;
    if (s4s_entropy <= sLow.sg) {           // ends wet
      x4s = (s4s_entropy - sLow.sf) / (sLow.sg - sLow.sf);
      h4s = sLow.hf + x4s * (sLow.hg - sLow.hf);
    } else {                                // ends superheated
      var T4s = tempFromPs(Pl, s4s_entropy);
      h4s = supProps(Pl, T4s).h;
    }
    var h4 = s3.h - etaT * (s3.h - h4s);    // actual enthalpy with turbine η
    var s4, x4, T4, v4;
    if (h4 <= sLow.hg) {                     // wet exit
      x4 = clamp((h4 - sLow.hf) / (sLow.hg - sLow.hf), 0, 1);
      s4 = sLow.sf + x4 * (sLow.sg - sLow.sf);
      T4 = sLow.T; v4 = sLow.vf + x4 * (sLow.vg - sLow.vf);
    } else {                                 // superheated exit
      T4 = tempFromPh(Pl, h4); var p4 = supProps(Pl, T4);
      s4 = p4.s; x4 = null; v4 = p4.v;
    }
    var s4st = { p: Pl, T: T4, h: h4, s: s4, v: v4, x: x4 };

    var qIn = s3.h - s2.h;
    var qOut = s4st.h - s1.h;
    var wTurb = s3.h - s4st.h;
    var wNet = wTurb - wPump;
    var eta = wNet / qIn;
    var mdot = st.power > 0 ? (st.power * 1000 / wNet) : 0; // kg/s for target net power (MW→kW)
    /* The Carnot limit must be taken between the cycle's ACTUAL temperature
       extremes. This used the boiler SATURATION temperature as the hot
       reservoir, which ignores superheat entirely — so the displayed limit did
       not move when the turbine-inlet temperature slider did, and at low boiler
       pressure with high superheat the Rankine efficiency overtook it: at 2 bar
       and 646 °C the tool reported 25.7% efficiency against an 18.9% "Carnot
       Limit", which reads as a second-law violation.

       State 3 is the turbine inlet and therefore the peak cycle temperature;
       for a saturated cycle it equals the saturation temperature, so this
       reduces to the previous value whenever there is no superheat. */
    var THk = s3.T + 273.15, TLk = sLow.T + 273.15;
    var carnot = 1 - TLk / THk;

    return {
      type: 'rankine',
      states: [s1, s2, s3, s4st],
      qIn: qIn, qOut: qOut, wTurb: wTurb, wPump: wPump, wNet: wNet,
      eta: eta, carnot: carnot, mdot: mdot, bwr: wPump / wTurb,
      x4: x4, ssc: 3600 / wNet, sat: { low: sLow, high: sHigh }
    };
  }

  function computeCarnot(st) {
    var Ph = st.pHigh, Pl = st.pLow;
    var sHigh = satByP(Ph), sLow = satByP(Pl);
    var THk = sHigh.T + 273.15, TLk = sLow.T + 273.15;
    // Carnot vapour cycle inside the dome at boiler pressure:
    // 1: sat liquid @Ph, 2: sat vapour @Ph (isothermal heat in TH)
    // 3: wet @Pl (isentropic exp), 4: wet @Pl (isentropic comp back to s1)
    var s1 = { p: Ph, T: sHigh.T, h: sHigh.hf, s: sHigh.sf, v: sHigh.vf, x: 0 };
    var s2 = { p: Ph, T: sHigh.T, h: sHigh.hg, s: sHigh.sg, v: sHigh.vg, x: 1 };
    var x3 = (s2.s - sLow.sf) / (sLow.sg - sLow.sf);
    var s3 = { p: Pl, T: sLow.T, h: sLow.hf + x3 * (sLow.hg - sLow.hf), s: s2.s, v: sLow.vf + x3 * (sLow.vg - sLow.vf), x: clamp(x3, 0, 1) };
    var x4 = (s1.s - sLow.sf) / (sLow.sg - sLow.sf);
    var s4 = { p: Pl, T: sLow.T, h: sLow.hf + x4 * (sLow.hg - sLow.hf), s: s1.s, v: sLow.vf + x4 * (sLow.vg - sLow.vf), x: clamp(x4, 0, 1) };
    var qIn = s2.h - s1.h;
    var qOut = s3.h - s4.h;
    var wNet = qIn - qOut;
    var eta = 1 - TLk / THk;
    var mdot = st.power > 0 ? st.power * 1000 / wNet : 0;
    return {
      type: 'carnot',
      states: [s1, s2, s3, s4],
      qIn: qIn, qOut: qOut, wTurb: s2.h - s3.h, wPump: s1.h - s4.h, wNet: wNet,
      eta: eta, carnot: eta, mdot: mdot, bwr: (s1.h - s4.h) / (s2.h - s3.h),
      x4: s3.x, ssc: 3600 / wNet, sat: { low: sLow, high: sHigh }
    };
  }

  function compute(st) { return st.cycle === 'carnot' ? computeCarnot(st) : computeRankine(st); }

  /* ═══════════ STATE ═══════════════════════════════════════════════════ */
  var state = {
    cycle: 'rankine',
    pHigh: 8000,   // kPa (boiler)
    pLow: 10,      // kPa (condenser)
    t3: 480,       // °C (turbine inlet)
    etaT: 100,     // turbine isentropic efficiency %
    etaP: 100,     // pump isentropic efficiency %
    power: 100,    // target net power MW (for mass flow)
    diagram: 'ts', // 'ts' | 'pv'
    units: 'SI',
    running: false,
    buildMode: false,   // true while the cycle is being drawn stage-by-stage
    speed: 0.3,
    phase: 0,
    audioCtx: null,
    showLabels: true, showDome: true
  };
  var res = null; // last computed result

  var PRESETS = {
    subcritical: { cycle: 'rankine', pHigh: 8000, pLow: 10, t3: 480, etaT: 100, etaP: 100 },
    superheat:   { cycle: 'rankine', pHigh: 15000, pLow: 10, t3: 600, etaT: 100, etaP: 100 },
    lowpressure: { cycle: 'rankine', pHigh: 2000, pLow: 50, t3: 300, etaT: 100, etaP: 100 },
    actual:      { cycle: 'rankine', pHigh: 8000, pLow: 10, t3: 480, etaT: 85, etaP: 80 },
    carnot:      { cycle: 'carnot', pHigh: 8000, pLow: 10, t3: 295, etaT: 100, etaP: 100 }
  };

  /* ═══════════ UNITS ════════════════════════════════════════════════════ */
  var U = {
    P: function (kPa) { return state.units === 'SI' ? kPa / 100 : kPa * 0.145038; }, // bar | psi
    Pu: function () { return state.units === 'SI' ? 'bar' : 'psi'; },
    T: function (C) { return state.units === 'SI' ? C : C * 9 / 5 + 32; },
    Tu: function () { return state.units === 'SI' ? '°C' : '°F'; },
    h: function (kJkg) { return state.units === 'SI' ? kJkg : kJkg * 0.429923; },
    hu: function () { return state.units === 'SI' ? 'kJ/kg' : 'Btu/lb'; },
    s: function (v) { return state.units === 'SI' ? v : v * 0.238846; },
    su: function () { return state.units === 'SI' ? 'kJ/kg·K' : 'Btu/lb·R'; },
    pw: function (kW) { return state.units === 'SI' ? kW : kW * 1.34102; },
    pwu: function () { return state.units === 'SI' ? 'kW' : 'hp'; },
    m: function (kgs) { return state.units === 'SI' ? kgs : kgs * 2.20462; },
    mu: function () { return state.units === 'SI' ? 'kg/s' : 'lb/s'; }
  };
  function fmt(v, d) { if (v === null || v === undefined || !isFinite(v)) return '—'; return v.toFixed(d === undefined ? 1 : d); }

  /* Stepper boxes show display units while the range sliders stay on their
     native SI scale (bar / kPa / °C), so dragging behaves identically in both
     systems. %, and MW (the worldwide unit for plant output) are unchanged. */
  var CTRL_UNITS = {
    pHigh: { to: function (bar) { return bar * 14.50377; },   from: function (psi) { return psi / 14.50377; },
             si: 'bar', imp: 'psi', dec: 0 },
    pLow:  { to: function (kPa) { return kPa * 0.1450377; },  from: function (psi) { return psi / 0.1450377; },
             si: 'kPa', imp: 'psi', dec: 2 },
    t3:    { to: function (C) { return C * 9 / 5 + 32; },     from: function (F) { return (F - 32) * 5 / 9; },
             si: '°C',  imp: '°F',  dec: 0 }
  };
  function ctrlToDisp(key, v) {
    var c = CTRL_UNITS[key];
    return (c && state.units !== 'SI') ? c.to(v) : v;
  }
  function ctrlFromDisp(key, v) {
    var c = CTRL_UNITS[key];
    return (c && state.units !== 'SI') ? c.from(v) : v;
  }
  function ctrlDec(key, fallback) {
    var c = CTRL_UNITS[key];
    return (c && state.units !== 'SI') ? c.dec : fallback;
  }
  /* Preset option labels quote the pressure and temperature they load, so
     they are display surfaces too — rebuild them from the preset data rather
     than leaving the bar/°C text that was authored into the markup. */
  var PRESET_LABEL = { subcritical: 'Subcritical', superheat: 'High superheat', lowpressure: 'Low pressure' };
  function syncPresetLabels() {
    var sel = $('preset-select');
    if (!sel) return;
    Object.keys(PRESET_LABEL).forEach(function (key) {
      var opt = sel.querySelector('option[value="' + key + '"]');
      var pr = PRESETS[key];
      if (!opt || !pr) return;
      var pTxt = ctrlToDisp('pHigh', pr.pHigh / 100).toFixed(0) + ' ' + (state.units === 'SI' ? 'bar' : 'psi');
      var tTxt = ctrlToDisp('t3', pr.t3).toFixed(0) + ' ' + (state.units === 'SI' ? '\u00b0C' : '\u00b0F');
      opt.textContent = PRESET_LABEL[key] + ' (' + pTxt + ' / ' + tTxt + ')';
    });
  }

  /* Badge captions + stepper bounds for the three convertible controls. */
  function syncCtrlUnits() {
    Object.keys(CTRL_UNITS).forEach(function (key) {
      var c = CTRL_UNITS[key];
      var badge = $(key + '-unit');
      if (badge) badge.textContent = state.units === 'SI' ? c.si : c.imp;
      var sl = $(key + '-slider'), inp = $(key + '-num');
      if (!sl || !inp) return;
      var lo = ctrlToDisp(key, parseFloat(sl.min)), hi = ctrlToDisp(key, parseFloat(sl.max));
      inp.min = +lo.toFixed(2);
      inp.max = +hi.toFixed(2);
      inp.step = state.units === 'SI' ? (parseFloat(sl.step) || 1) : 'any';
    });
  }

  /* ═══════════ CANVAS SETUP (Hi-DPI) ════════════════════════════════════ */
  var machC = $('machine-canvas'), machX = machC.getContext('2d');
  var diaC = $('graph-canvas'), diaX = diaC.getContext('2d');
  var expC = $('explore-canvas'), expX = expC ? expC.getContext('2d') : null;
  var MW = 540, MH = 660, DW = 560, DH = 470, EW = 900, EH = 400;

  function fitCanvas(cv, ctx, w, h) {
    var dpr = window.devicePixelRatio || 1;
    var cssW = cv.clientWidth || w;     // actual displayed width (CSS px)
    var scale = cssW / w;               // map design units → displayed px
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(h * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }
  function fitAll() {
    fitCanvas(machC, machX, MW, MH);
    fitCanvas(diaC, diaX, DW, DH);
    if (expC) fitCanvas(expC, expX, EW, EH);
  }

  /* ═══════════ DIAGRAM DRAWING ══════════════════════════════════════════ */
  var COL = { accent: '#f4511e', accent2: '#ff8a65', dome: '#3a4470', grid: '#222a44', txt: '#dde3f0', dim: '#6b7a99', heat: '#ff7043', cool: '#42a5f5', work: '#3ddc84' };

  // colour helpers for material shading
  function hexRgb(h) { h = h.replace('#', ''); return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }; }
  function shade(o, f) { return { r: Math.min(255, o.r * f), g: Math.min(255, o.g * f), b: Math.min(255, o.b * f) }; }
  function rgbStr(o, a) { return 'rgba(' + (o.r | 0) + ',' + (o.g | 0) + ',' + (o.b | 0) + ',' + (a == null ? 1 : a) + ')'; }

  function plotter(x0, y0, w, h, xmin, xmax, ymin, ymax, logY, logX) {
    var mapX = function (v) { return logX ? x0 + (Math.log(v) - Math.log(xmin)) / (Math.log(xmax) - Math.log(xmin)) * w : x0 + (v - xmin) / (xmax - xmin) * w; };
    var mapY = function (v) { return logY ? y0 + h - (Math.log(v) - Math.log(ymin)) / (Math.log(ymax) - Math.log(ymin)) * h : y0 + h - (v - ymin) / (ymax - ymin) * h; };
    return { mx: mapX, my: mapY };
  }

  function drawDiagram() {
    var ctx = diaX; ctx.clearRect(0, 0, DW, DH);
    // panel bg — subtle vertical gradient (keep the plot crisp/legible)
    var bg = ctx.createLinearGradient(0, 0, 0, DH);
    bg.addColorStop(0, '#11151f'); bg.addColorStop(1, '#0a0d14');
    ctx.fillStyle = bg; roundRect(ctx, 0, 0, DW, DH, 8); ctx.fill();
    var pad = { l: 56, r: 16, t: 30, b: 42 };
    var x0 = pad.l, y0 = pad.t, w = DW - pad.l - pad.r, h = DH - pad.t - pad.b;

    if (state.diagram === 'ts') drawTS(ctx, x0, y0, w, h);
    else drawPV(ctx, x0, y0, w, h);
  }

  function drawTS(ctx, x0, y0, w, h) {
    var smin = 0, smax = 9.5, Tmin = 0, Tmax = 650;
    var P = plotter(x0, y0, w, h, smin, smax, Tmin, Tmax, false, false);
    drawAxes(ctx, x0, y0, w, h, 'Entropy  s  (kJ/kg·K)', 'Temperature  T  (°C)', smin, smax, 1, Tmin, Tmax, 100);

    // saturation dome
    if (state.showDome) {
      ctx.beginPath();
      var first = true;
      for (var T = 5; T <= TCRIT; T += 6) { var s = satByT(T); var px = P.mx(s.sf), py = P.my(T); if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py); }
      ctx.lineTo(P.mx(4.412), P.my(TCRIT));
      for (var T2 = TCRIT; T2 >= 5; T2 -= 6) { var s2 = satByT(T2); ctx.lineTo(P.mx(s2.sg), P.my(T2)); }
      ctx.closePath();
      ctx.fillStyle = 'rgba(58,68,112,.18)'; ctx.fill();
      ctx.strokeStyle = COL.dome; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = COL.dim; ctx.font = '10px ' + MONO;
      ctx.fillText('sat. liquid', P.mx(2.0) - 30, P.my(220));
      ctx.fillText('sat. vapour', P.mx(7.2), P.my(150));
    }
    if (!res) return;
    var s = res.states, pts = s.map(function (p) { return { x: P.mx(p.s), y: P.my(p.T) }; });
    drawCyclePath(ctx, P, 'ts');
    if (state.showLabels) labelStates(ctx, pts);
    diagramTitle(ctx, x0, y0, w, res.type === 'carnot' ? 'Carnot Cycle — T-s' : 'Rankine Cycle — T-s');
  }

  function drawPV(ctx, x0, y0, w, h) {
    var vmin = 0.0008, vmax = 60, Pmin = 3, Pmax = 20000;
    var P = plotter(x0, y0, w, h, vmin, vmax, Pmin, Pmax, true, true);
    drawAxesLog(ctx, x0, y0, w, h, 'Specific volume  v  (m³/kg)', 'Pressure  P  (kPa)', vmin, vmax, Pmin, Pmax);

    if (state.showDome) {
      ctx.beginPath(); var first = true;
      for (var i = 0; i < SAT.length; i++) { var r = SAT[i]; var px = P.mx(r[6]), py = P.my(r[0]); if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py); }
      ctx.lineTo(P.mx(0.003106), P.my(PCRIT));
      for (var j = SAT.length - 1; j >= 0; j--) { var r2 = SAT[j]; ctx.lineTo(P.mx(r2[7]), P.my(r2[0])); }
      ctx.closePath();
      ctx.fillStyle = 'rgba(58,68,112,.18)'; ctx.fill();
      ctx.strokeStyle = COL.dome; ctx.lineWidth = 1.5; ctx.stroke();
    }
    if (!res) return;
    drawCyclePath(ctx, P, 'pv');
    var s = res.states, pts = s.map(function (p) { return { x: P.mx(Math.max(p.v, vmin)), y: P.my(p.p) }; });
    if (state.showLabels) labelStates(ctx, pts);
    diagramTitle(ctx, x0, y0, w, res.type === 'carnot' ? 'Carnot Cycle — P-v' : 'Rankine Cycle — P-v');
  }

  // Build the cycle as FOUR process sub-polylines (one per stage), so the
  // animation can draw them progressively in step with the plant schematic.
  function cycleStages(mode) {
    var s = res.states;
    function pt(p) { return mode === 'ts' ? { x: p.s, y: p.T } : { x: Math.max(p.v, 0.0008), y: p.p }; }
    if (res.type === 'carnot') {
      return [[pt(s[0]), pt(s[1])], [pt(s[1]), pt(s[2])], [pt(s[2]), pt(s[3])], [pt(s[3]), pt(s[0])]];
    }
    // Rankine — stage 1→2 pump, 2→3 boiler, 3→4 turbine, 4→1 condenser
    var seg2 = [pt(s[1])];
    if (mode === 'ts') {
      var sh = res.sat.high, T2 = s[1].T, Tb = sh.T;
      for (var T = T2; T < Tb; T += Math.max(4, (Tb - T2) / 12)) { var ss = satByT(T); seg2.push({ x: ss.sf, y: T }); }
      seg2.push({ x: sh.sf, y: Tb });          // sat liquid @Ph
      seg2.push({ x: sh.sg, y: Tb });          // sat vapour @Ph (across dome)
      seg2.push(pt(s[2]));                       // superheat → 3
    } else {
      var sh2 = res.sat.high;
      seg2.push({ x: sh2.vf, y: sh2.P });
      seg2.push({ x: sh2.vg, y: sh2.P });
      seg2.push(pt(s[2]));
    }
    return [[pt(s[0]), pt(s[1])], seg2, [pt(s[2]), pt(s[3])], [pt(s[3]), pt(s[0])]];
  }

  // Build fraction 0..1 — partial while an animated build is in progress, full otherwise.
  function buildProgress() { return state.buildMode ? clamp(state.phase, 0, 1) : 1; }

  // Time weighting per process so the pen draws at a steady visual pace:
  // the pump step is geometrically tiny, the boiler step is long.
  var STAGE_W = [0.06, 0.40, 0.30, 0.24];   // pump, boiler, turbine, condenser
  // Map 0..1 build progress → 0..4 "stage units" (integer part = completed stages).
  function buildStageF() {
    var prog = buildProgress();
    if (prog >= 1) return 4;
    var c = 0;
    for (var i = 0; i < 4; i++) { if (prog < c + STAGE_W[i]) return i + (prog - c) / STAGE_W[i]; c += STAGE_W[i]; }
    return 4;
  }

  function drawCyclePath(ctx, P, mode) {
    var stages = cycleStages(mode);
    var stageF = buildStageF();         // 0..4 across the four processes
    ctx.strokeStyle = COL.accent; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(244,81,30,.5)'; ctx.shadowBlur = 6;
    var lead = null, started = false;
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var frac = clamp(stageF - i, 0, 1);     // portion of stage i to draw
      if (frac <= 0) break;
      var seg = stages[i].map(function (p) { return { x: P.mx(p.x), y: P.my(p.y) }; });
      var segLen = [], tot = 0;
      for (var k = 0; k < seg.length - 1; k++) { var d = Math.hypot(seg[k + 1].x - seg[k].x, seg[k + 1].y - seg[k].y); segLen.push(d); tot += d; }
      var target = frac * tot, acc = 0;
      if (!started) { ctx.moveTo(seg[0].x, seg[0].y); started = true; lead = seg[0]; }
      for (var m = 0; m < seg.length - 1; m++) {
        if (acc + segLen[m] <= target + 0.001) { ctx.lineTo(seg[m + 1].x, seg[m + 1].y); acc += segLen[m]; lead = seg[m + 1]; }
        else { var t = segLen[m] ? (target - acc) / segLen[m] : 0; var lx = lerp(seg[m].x, seg[m + 1].x, t), ly = lerp(seg[m].y, seg[m + 1].y, t); ctx.lineTo(lx, ly); lead = { x: lx, y: ly }; break; }
      }
    }
    if (started) ctx.stroke();
    ctx.shadowBlur = 0; ctx.lineCap = 'butt';
    // state dots for points reached so far
    var s = res.states;
    for (var n = 0; n < s.length; n++) {
      if (stageF < n - 0.001) continue;       // state n reached at stageF >= n
      var x = mode === 'ts' ? s[n].s : Math.max(s[n].v, 0.0008), y = mode === 'ts' ? s[n].T : s[n].p;
      ctx.beginPath(); ctx.arc(P.mx(x), P.my(y), 4.5, 0, 7); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.strokeStyle = COL.accent; ctx.lineWidth = 2; ctx.stroke();
    }
    // glowing "pen" at the leading edge while building
    if (state.buildMode && state.phase < 1 && lead) {
      ctx.beginPath(); ctx.arc(lead.x, lead.y, 6, 0, 7); ctx.fillStyle = COL.accent2; ctx.shadowColor = COL.accent2; ctx.shadowBlur = 14; ctx.fill(); ctx.shadowBlur = 0;
    }
  }

  function labelStates(ctx, pts) {
    var stageF = buildStageF();
    ctx.font = 'bold 12px ' + MONO;
    var off = [[8, -8], [-16, -8], [8, -8], [10, 12]];
    for (var i = 0; i < pts.length; i++) {
      if (stageF < i - 0.001) continue;       // only label reached states
      var lx = pts[i].x + (off[i] ? off[i][0] : 8), ly = pts[i].y + (off[i] ? off[i][1] : -8);
      ctx.fillStyle = COL.accent2; ctx.fillText((i + 1).toString(), lx, ly);
    }
  }

  function diagramTitle(ctx, x0, y0, w, t) {
    ctx.font = 'bold 12px ' + FONT; ctx.fillStyle = COL.dim; ctx.textAlign = 'right';
    ctx.fillText(t, x0 + w, 16); ctx.textAlign = 'left';
  }

  function drawAxes(ctx, x0, y0, w, h, xl, yl, xmin, xmax, xstep, ymin, ymax, ystep) {
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.fillStyle = COL.dim; ctx.font = '9px ' + MONO;
    ctx.textAlign = 'center';
    for (var xv = xmin; xv <= xmax + 1e-9; xv += xstep) { var px = x0 + (xv - xmin) / (xmax - xmin) * w; ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y0 + h); ctx.stroke(); ctx.fillText(xv.toFixed(0), px, y0 + h + 13); }
    ctx.textAlign = 'right';
    for (var yv = ymin; yv <= ymax + 1e-9; yv += ystep) { var py = y0 + h - (yv - ymin) / (ymax - ymin) * h; ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x0 + w, py); ctx.stroke(); ctx.fillText(yv.toFixed(0), x0 - 6, py + 3); }
    ctx.strokeStyle = COL.dim; ctx.lineWidth = 1.3; ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = COL.dim; ctx.font = '10px ' + FONT; ctx.textAlign = 'center';
    ctx.fillText(xl, x0 + w / 2, y0 + h + 30);
    ctx.save(); ctx.translate(14, y0 + h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yl, 0, 0); ctx.restore();
    ctx.textAlign = 'left';
  }

  function drawAxesLog(ctx, x0, y0, w, h, xl, yl, xmin, xmax, ymin, ymax) {
    ctx.strokeStyle = COL.grid; ctx.lineWidth = 1; ctx.fillStyle = COL.dim; ctx.font = '9px ' + MONO;
    var decX0 = Math.ceil(Math.log10(xmin)), decX1 = Math.floor(Math.log10(xmax));
    ctx.textAlign = 'center';
    for (var dx = decX0; dx <= decX1; dx++) { var v = Math.pow(10, dx); var px = x0 + (Math.log(v) - Math.log(xmin)) / (Math.log(xmax) - Math.log(xmin)) * w; ctx.beginPath(); ctx.moveTo(px, y0); ctx.lineTo(px, y0 + h); ctx.stroke(); ctx.fillText('1e' + dx, px, y0 + h + 13); }
    ctx.textAlign = 'right';
    var decY0 = Math.ceil(Math.log10(ymin)), decY1 = Math.floor(Math.log10(ymax));
    for (var dy = decY0; dy <= decY1; dy++) { var vy = Math.pow(10, dy); var py = y0 + h - (Math.log(vy) - Math.log(ymin)) / (Math.log(ymax) - Math.log(ymin)) * h; ctx.beginPath(); ctx.moveTo(x0, py); ctx.lineTo(x0 + w, py); ctx.stroke(); ctx.fillText('1e' + dy, x0 - 6, py + 3); }
    ctx.strokeStyle = COL.dim; ctx.lineWidth = 1.3; ctx.strokeRect(x0, y0, w, h);
    ctx.fillStyle = COL.dim; ctx.font = '10px ' + FONT; ctx.textAlign = 'center';
    ctx.fillText(xl, x0 + w / 2, y0 + h + 30);
    ctx.save(); ctx.translate(14, y0 + h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText(yl, 0, 0); ctx.restore();
    ctx.textAlign = 'left';
  }

  /* ═══════════ MACHINE SCHEMATIC ════════════════════════════════════════ */
  var FONT = "'Segoe UI', system-ui, sans-serif", MONO = "'Courier New', monospace";
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  function drawMachine() {
    var ctx = machX; ctx.clearRect(0, 0, MW, MH);
    drawMachineBg(ctx);
    if (!res) return;
    var carnot = res.type === 'carnot';

    // Component boxes (boiler top-left, turbine top-right, condenser bottom-right, pump bottom-left)
    var boiler = { x: 60, y: 70, w: 140, h: 110 };
    var turbine = { x: 330, y: 80, w: 150, h: 90 };
    var condenser = { x: 330, y: 430, w: 150, h: 110 };
    var pump = { x: 80, y: 450, w: 90, h: 70 };

    // Active component follows the staged build: 0 pump → 1 boiler → 2 turbine → 3 condenser.
    // Remapped to the legacy active codes used below (0 boiler,1 turbine,2 condenser,3 pump).
    var building = state.buildMode && state.phase < 1;
    var stage = building ? Math.min(3, Math.floor(buildStageF())) : -1;
    var active = stage >= 0 ? (stage + 3) % 4 : -1;

    // pipes — shaded steel tubes
    tubePipe(ctx, boiler.x + boiler.w, boiler.y + 30, turbine.x, turbine.y + 30);      // boiler→turbine (top)
    tubePipe(ctx, turbine.x + turbine.w / 2, turbine.y + turbine.h, condenser.x + condenser.w / 2, condenser.y); // turbine→condenser
    tubePipe(ctx, condenser.x, condenser.y + condenser.h / 2, pump.x + pump.w, pump.y + pump.h / 2);  // condenser→pump
    tubePipe(ctx, pump.x + pump.w / 2, pump.y, boiler.x + boiler.w / 2, boiler.y + boiler.h);   // pump→boiler

    // flowing particles
    if (state.running) {
      drawFlow(ctx, boiler.x + boiler.w, boiler.y + 30, turbine.x, turbine.y + 30, COL.heat, 0);
      drawFlow(ctx, turbine.x + turbine.w / 2, turbine.y + turbine.h, condenser.x + condenser.w / 2, condenser.y, '#ff8a65', 1);
      drawFlow(ctx, condenser.x, condenser.y + condenser.h / 2, pump.x + pump.w, pump.y + pump.h / 2, COL.cool, 2);
      drawFlow(ctx, pump.x + pump.w / 2, pump.y, boiler.x + boiler.w / 2, boiler.y + boiler.h, '#90caf9', 3);
    }

    // Boiler
    compBox(ctx, boiler, '#e64a19', active === 0, carnot ? 'Heat Source' : 'BOILER');
    // flame icon
    ctx.fillStyle = active === 0 ? '#ff7043' : '#5a3a2a';
    for (var f = 0; f < 4; f++) { var fx = boiler.x + 22 + f * 30; flame(ctx, fx, boiler.y + boiler.h - 6, active === 0); }
    heatArrow(ctx, boiler.x + boiler.w / 2, boiler.y - 4, true, 'Q', active === 0 ? COL.heat : '#5a3a2a');

    // Turbine (trapezoid) + generator
    drawTurbine(ctx, turbine, active === 1);
    // generator — domed sphere with specular highlight
    var gx = turbine.x + turbine.w + 28, gy = turbine.y + 30, gr = 22;
    var gRgb = active === 1 ? hexRgb(COL.work) : { r: 42, g: 58, b: 46 };
    var gGrad = ctx.createRadialGradient(gx - 7, gy - 8, 3, gx, gy, gr);
    gGrad.addColorStop(0, rgbStr(shade(gRgb, 1.35)));
    gGrad.addColorStop(0.55, rgbStr(gRgb));
    gGrad.addColorStop(1, rgbStr(shade(gRgb, 0.55)));
    if (active === 1) { ctx.save(); ctx.shadowColor = COL.work; ctx.shadowBlur = 16; }
    ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 7); ctx.fillStyle = gGrad; ctx.fill();
    if (active === 1) ctx.restore();
    ctx.strokeStyle = '#1a2a1e'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(gx - 6, gy - 7, 6, 4, -0.5, 0, 7); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
    ctx.fillStyle = active === 1 ? '#0d1117' : '#dce7df'; ctx.font = 'bold 13px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('G', gx, gy + 5);
    ctx.fillStyle = COL.work; ctx.font = '9px ' + FONT; ctx.fillText('W' , turbine.x + turbine.w + 28, turbine.y - 4);

    // Condenser
    compBox(ctx, condenser, '#0288d1', active === 2, 'CONDENSER');
    // cooling coils
    ctx.strokeStyle = active === 2 ? '#4fc3f7' : '#28435a'; ctx.lineWidth = 2.5;
    for (var c = 0; c < 3; c++) { var cy = condenser.y + 28 + c * 26; ctx.beginPath(); for (var xx = condenser.x + 14; xx <= condenser.x + condenser.w - 14; xx += 8) { ctx.lineTo(xx, cy + (Math.floor((xx) / 8) % 2 ? 6 : -6)); } ctx.stroke(); }
    heatArrow(ctx, condenser.x + condenser.w / 2, condenser.y + condenser.h + 16, false, 'Q', active === 2 ? COL.cool : '#28435a');

    // Pump
    compBox(ctx, pump, '#3ddc84', active === 3, 'PUMP');
    ctx.fillStyle = active === 3 ? '#0d1117' : '#1a2a1e'; ctx.font = 'bold 16px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('⊳', pump.x + pump.w / 2, pump.y + pump.h / 2 + 18);

    // State point markers on pipes
    var s = res.states;
    statePoint(ctx, boiler.x + boiler.w + (turbine.x - boiler.x - boiler.w) * 0.5, boiler.y + 30 - 16, '3', s[2]);
    statePoint(ctx, turbine.x + turbine.w / 2 + 22, (turbine.y + turbine.h + condenser.y) / 2, '4', s[3]);
    statePoint(ctx, (condenser.x + pump.x + pump.w) / 2, condenser.y + condenser.h / 2 - 16, '1', s[0]);
    statePoint(ctx, (pump.x + boiler.x) / 2 - 4, (pump.y + boiler.y + boiler.h) / 2, '2', s[1]);

    // efficiency banner — left-aligned so it clears the bottom-right playback overlay
    var bx = 26, bw = 290, bcx = bx + bw / 2;
    ctx.fillStyle = 'rgba(31,37,53,.92)'; roundRect(ctx, bx, MH - 70, bw, 52, 8); ctx.fill();
    ctx.strokeStyle = COL.accent; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = COL.accent; ctx.font = 'bold 19px ' + MONO; ctx.textAlign = 'center';
    ctx.fillText('η = ' + (res.eta * 100).toFixed(1) + ' %', bcx, MH - 42);
    ctx.fillStyle = COL.dim; ctx.font = '9.5px ' + FONT;
    ctx.fillText('Thermal efficiency  ·  Carnot ' + (res.carnot * 100).toFixed(1) + ' %', bcx, MH - 27);
    ctx.textAlign = 'left';
  }

  // ── grounded thermal background: warm over the boiler, cool over the condenser ──
  function drawMachineBg(ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, MH);
    g.addColorStop(0, '#10141d'); g.addColorStop(1, '#090c12');
    ctx.fillStyle = g; roundRect(ctx, 0, 0, MW, MH, 8); ctx.fill();
    ctx.save(); roundRect(ctx, 0, 0, MW, MH, 8); ctx.clip();
    var warm = ctx.createRadialGradient(130, 135, 20, 130, 135, 250);
    warm.addColorStop(0, 'rgba(255,90,40,0.10)'); warm.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = warm; ctx.fillRect(0, 0, MW, MH);
    var cool = ctx.createRadialGradient(405, 485, 20, 405, 485, 250);
    cool.addColorStop(0, 'rgba(40,140,255,0.10)'); cool.addColorStop(1, 'rgba(40,140,255,0)');
    ctx.fillStyle = cool; ctx.fillRect(0, 0, MW, MH);
    ctx.restore();
  }

  // ── shaded steel tube: dark base → mid body → thin offset highlight ──
  function tubePipe(ctx, x1, y1, x2, y2) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#161c2c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = '#3a4470'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var nx = (y2 - y1), ny = -(x2 - x1), L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L; // unit normal
    ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1 + nx * 1.4, y1 + ny * 1.4); ctx.lineTo(x2 + nx * 1.4, y2 + ny * 1.4); ctx.stroke();
  }

  function drawFlow(ctx, x1, y1, x2, y2, col, idx) {
    var n = 4;
    for (var i = 0; i < n; i++) {
      var t = ((state.phase * 1.5 + i / n) % 1);
      var px = lerp(x1, x2, t), py = lerp(y1, y2, t);
      ctx.save();
      ctx.beginPath(); ctx.arc(px, py, 3.2, 0, 7); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.globalAlpha = 0.9; ctx.fill();
      ctx.restore();
    }
  }
  function compBox(ctx, b, col, active, label) {
    var rgb = hexRgb(col);
    ctx.save();
    ctx.shadowColor = active ? col : 'rgba(0,0,0,0.55)'; ctx.shadowBlur = active ? 18 : 10; ctx.shadowOffsetY = active ? 0 : 4;
    var g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
    if (active) { g.addColorStop(0, rgbStr(shade(rgb, 1.3))); g.addColorStop(0.5, rgbStr(rgb)); g.addColorStop(1, rgbStr(shade(rgb, 0.65))); }
    else { g.addColorStop(0, '#2a3148'); g.addColorStop(1, '#191f2e'); }
    ctx.fillStyle = g; roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    ctx.restore();
    // top inner bevel highlight
    ctx.save(); roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.clip();
    var hi = ctx.createLinearGradient(b.x, b.y, b.x, b.y + 16);
    hi.addColorStop(0, 'rgba(255,255,255,0.20)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hi; ctx.fillRect(b.x, b.y, b.w, 16);
    ctx.restore();
    ctx.strokeStyle = col; ctx.lineWidth = 2; roundRect(ctx, b.x, b.y, b.w, b.h, 10); ctx.stroke();
    ctx.fillStyle = active ? '#0d1117' : col; ctx.font = 'bold 12px ' + FONT; ctx.textAlign = 'center';
    ctx.fillText(label, b.x + b.w / 2, b.y + 18);
    ctx.textAlign = 'left';
  }
  function drawTurbine(ctx, b, active) {
    var rgb = active ? hexRgb('#3ddc84') : { r: 42, g: 49, b: 72 };
    function path() { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + b.w, b.y - 14); ctx.lineTo(b.x + b.w, b.y + b.h + 14); ctx.lineTo(b.x, b.y + b.h); ctx.closePath(); }
    ctx.save();
    ctx.shadowColor = active ? '#3ddc84' : 'rgba(0,0,0,0.55)'; ctx.shadowBlur = active ? 18 : 10; ctx.shadowOffsetY = active ? 0 : 4;
    var g = ctx.createLinearGradient(b.x, b.y - 14, b.x + b.w, b.y + b.h + 14);
    g.addColorStop(0, rgbStr(shade(rgb, 1.3))); g.addColorStop(0.5, rgbStr(rgb)); g.addColorStop(1, rgbStr(shade(rgb, 0.6)));
    path(); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    path(); ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = active ? '#0d1117' : '#3ddc84'; ctx.font = 'bold 12px ' + FONT; ctx.textAlign = 'center'; ctx.fillText('TURBINE', b.x + b.w / 2, b.y + b.h / 2 + 4); ctx.textAlign = 'left';
  }
  function flame(ctx, x, y, on) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 7, y - 10, x, y - 20); ctx.quadraticCurveTo(x + 7, y - 10, x, y); ctx.fillStyle = on ? '#ff7043' : '#4a2e22'; ctx.fill(); }
  function heatArrow(ctx, x, y, up, label, col) {
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5;
    var d = up ? -1 : 1;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + d * 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + d * 28); ctx.lineTo(x - 5, y + d * 20); ctx.lineTo(x + 5, y + d * 20); ctx.closePath(); ctx.fill();
    ctx.font = '10px ' + MONO; ctx.textAlign = 'center'; ctx.fillText(label, x + 14, y + d * 14); ctx.textAlign = 'left';
  }
  function statePoint(ctx, x, y, n, sp) {
    ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = COL.accent; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 12px ' + MONO; ctx.textAlign = 'center'; ctx.fillText(n, x, y + 4); ctx.textAlign = 'left';
  }

  /* ═══════════ RENDER ═══════════════════════════════════════════════════ */
  // render() is called only by control changes / init — never the anim loop —
  // so reaching here means we should show the complete, updated cycle.
  function render() {
    state.buildMode = false;
    res = compute(state);
    drawMachine();
    drawDiagram();
    updateReadouts();
    updateStateTable();
    updateBadges();
    updateLiveEq();
  }
  var _raf = null;
  function loop() {
    if (!state.running) return;
    state.phase += 0.006 * state.speed;       // staged build advances 0 → 1
    if (state.phase >= 1) {                    // build complete → settle on full graph
      state.phase = 1; state.running = false;
      drawMachine(); drawDiagram();
      setStartButton('\u25B6', 'Replay'); $('btn-start').classList.remove('btn-paused');
      return;
    }
    drawMachine(); drawDiagram();
    _raf = requestAnimationFrame(loop);
  }
  // Run starts a fresh staged build of the cycle from process 1; pressing again pauses.
  function startAnim() {
    if (state.running) return;
    if (!state.buildMode || state.phase >= 1) { state.buildMode = true; state.phase = 0; }
    state.running = true;
    setStartButton('\u275A\u275A', 'Pause'); $('btn-start').classList.add('btn-paused');
    loop();
  }
  /* Keep the icon/label split intact in every state so the icon-only mobile
     variant never loses its glyph. */
  function setStartButton(icon, label) {
    var b = document.getElementById('btn-start');
    if (b) b.innerHTML = '<span class="ov-ico">' + icon + '</span><span class="ov-lbl">' + label + '</span>';
  }

  function pauseAnim() {
    state.running = false; setStartButton('\u25B6', 'Run'); $('btn-start').classList.remove('btn-paused');
    if (_raf) cancelAnimationFrame(_raf);
    drawMachine(); drawDiagram();
  }

  /* ═══════════ READOUTS / TABLE / BADGES ════════════════════════════════ */
  function updateReadouts() {
    if (!res) return;
    set('res-eta', (res.eta * 100).toFixed(1)); $('res-eta-unit').textContent = '%';
    set('res-wnet', fmt(U.h(res.wNet), 1)); $('res-wnet-unit').textContent = U.hu();
    set('res-qin', fmt(U.h(res.qIn), 1)); $('res-qin-unit').textContent = U.hu();
    set('res-power', fmt(U.pw(res.mdot * res.wNet), 0)); $('res-power-unit').textContent = U.pwu();
    set('res-mdot', fmt(U.m(res.mdot), 2)); $('res-mdot-unit').textContent = U.mu();
    set('res-x4', res.x4 === null ? 'sup.' : (res.x4 * 100).toFixed(1)); $('res-x4-unit').textContent = res.x4 === null ? '' : '%';
    set('res-bwr', (res.bwr * 100).toFixed(2)); $('res-bwr-unit').textContent = '%';
    set('res-carnot', (res.carnot * 100).toFixed(1)); $('res-carnot-unit').textContent = '%';
  }
  function set(id, v) { var e = $(id); if (e) e.textContent = v; }

  function updateStateTable() {
    if (!res) return;
    var tb = $('state-tbody'); if (!tb) return;
    var rows = '';
    var names = res.type === 'carnot' ? ['Sat. liquid (boiler)', 'Sat. vapour (boiler)', 'Wet vapour (cond.)', 'Wet vapour (cond.)'] : ['Pump inlet', 'Boiler inlet', 'Turbine inlet', 'Turbine exit'];
    for (var i = 0; i < res.states.length; i++) {
      var p = res.states[i];
      rows += '<tr><td class="st-pt">' + (i + 1) + '</td><td style="text-align:left;color:var(--text-dim)">' + names[i] + '</td>' +
        '<td>' + fmt(U.P(p.p), p.p < 100 ? 3 : 1) + '</td>' +
        '<td>' + fmt(U.T(p.T), 1) + '</td>' +
        '<td>' + fmt(U.h(p.h), 1) + '</td>' +
        '<td>' + fmt(U.s(p.s), 3) + '</td>' +
        '<td>' + (p.x === null ? '—' : (p.x * 100).toFixed(1) + '%') + '</td></tr>';
    }
    tb.innerHTML = rows;
    $('sth-p').textContent = 'P (' + U.Pu() + ')';
    $('sth-t').textContent = 'T (' + U.Tu() + ')';
    $('sth-h').textContent = 'h (' + U.hu() + ')';
    $('sth-s').textContent = 's (' + U.su() + ')';
  }

  function updateBadges() {
    if (!res) return;
    set('badge-eta', (res.eta * 100).toFixed(1) + '%');
    set('badge-wnet', fmt(U.h(res.wNet), 0)); set('badge-wnet-unit', U.hu());
    set('badge-x4', res.x4 === null ? 'sup' : (res.x4 * 100).toFixed(0) + '%');
    set('badge-carnot', (res.carnot * 100).toFixed(1) + '%');
  }

  function updateLiveEq() {
    var box = $('live-eq'); if (!box || !res) return;
    var html;
    /* The live equation is a display surface like any other — walk it through
       U.h()/U.hu() so it can't sit in kJ/kg while every card reads Btu/lb.
       Absolute temperatures go to Rankine when Imperial is selected. */
    var hu = U.hu();
    if (res.type === 'carnot') {
      var siLo = res.sat.low.T + 273.15, siHi = res.sat.high.T + 273.15;
      var imp = state.units !== 'SI';
      var lo = imp ? siLo * 1.8 : siLo, hi = imp ? siHi * 1.8 : siHi;
      html = 'η_Carnot = 1 − T_L/T_H = 1 − ' + lo.toFixed(1) + ' / ' + hi.toFixed(1) +
        ' ' + (imp ? '°R' : 'K') + ' = <b>' + (res.eta * 100).toFixed(1) + '%</b>';
    } else {
      html = 'w_net = w_turb − w_pump = ' + fmt(U.h(res.wTurb), 1) + ' − ' + fmt(U.h(res.wPump), 2) +
        ' = ' + fmt(U.h(res.wNet), 1) + ' ' + hu +
        '<br>η_th = w_net / q_in = ' + fmt(U.h(res.wNet), 1) + ' / ' + fmt(U.h(res.qIn), 1) +
        ' = <b>' + (res.eta * 100).toFixed(1) + '%</b>';
    }
    box.innerHTML = html;
  }

  /* ═══════════ CONTROLS ═════════════════════════════════════════════════ */
  function syncControls() {
    setSlider('pHigh', state.pHigh / 100, 1); // show bar
    setSlider('pLow', state.pLow, 0);
    setSlider('t3', state.t3, 0);
    setSlider('etaT', state.etaT, 0);
    setSlider('etaP', state.etaP, 0);
    setSlider('power', state.power, 0);
    // disable T3/η when carnot
    var carnot = state.cycle === 'carnot';
    grp('grp-t3', carnot); grp('grp-etaT', carnot); grp('grp-etaP', carnot);
    // clamp T3 ≥ Tsat(pHigh)
    var tsat = satByP(state.pHigh).T;
    var t3sl = $('t3-slider'); t3sl.min = Math.ceil(tsat);
    if (state.t3 < tsat) { state.t3 = Math.round(tsat); setSlider('t3', state.t3, 0); }
    syncCtrlUnits();
    syncPresetLabels();
  }
  function grp(id, dis) { var e = $(id); if (e) e.classList.toggle('disabled', dis); }
  function setSlider(key, val, dec) {
    var sl = $(key + '-slider'), inp = $(key + '-num');
    if (sl) sl.value = val;                       /* slider stays on the SI scale */
    if (inp && document.activeElement !== inp) {
      inp.value = (typeof val === 'number')
        ? ctrlToDisp(key, val).toFixed(ctrlDec(key, dec))
        : val;
    }
  }

  /* ═══════════ MODE SWITCHING ═══════════════════════════════════════════ */
  function switchMode(m) {
    if (m !== 'simulate' && state.running) pauseAnim();   // stop any running build
    state.mode = m;
    $('sim-wrapper').style.display = m === 'simulate' ? '' : 'none';
    $('explore-wrapper').style.display = m === 'explore' ? 'block' : 'none';
    $('practice-wrapper').style.display = m === 'practice' ? 'block' : 'none';
    $('quiz-wrapper').style.display = m === 'quiz' ? 'block' : 'none';
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === m); });
    // hide badges in practice/quiz
    var gb = $('graph-badges'); if (gb) gb.style.visibility = (m === 'simulate') ? 'visible' : 'visible';
    if (m === 'explore') renderExplore();
    if (m === 'practice') newProblem();
    if (m === 'quiz') resetQuiz();
    if (m === 'simulate') render();
  }

  /* ═══════════ EXPLORE ══════════════════════════════════════════════════ */
  var EXPLORE = {
    basics: {
      label: 'Basics', items: [
        { t: 'What is the Rankine cycle?', b: 'The Rankine cycle is the ideal thermodynamic cycle for a steam power plant. Water is pumped to high pressure, boiled into steam, expanded through a turbine to produce work, then condensed back to liquid. It is the basis of most of the world\'s electricity — coal, nuclear, biomass, geothermal, and concentrated-solar plants all run a Rankine cycle.', f: '', n: 'About 80% of global electricity comes from Rankine-cycle steam turbines.' },
        { t: 'The four processes', b: '1→2 Pump (isentropic compression of liquid), 2→3 Boiler (constant-pressure heat addition), 3→4 Turbine (isentropic expansion), 4→1 Condenser (constant-pressure heat rejection). Pumping a liquid takes far less work than compressing a gas, which is why the cycle is so efficient.', f: 'w_net = w_turbine − w_pump', n: 'Back-work ratio (pump/turbine work) is typically only 0.4–2%.' },
        { t: 'Why steam?', b: 'Water has a very high latent heat of vaporisation, is cheap, non-toxic, and chemically stable. The phase change lets the boiler add huge amounts of energy at constant temperature, and the turbine extract it across a large enthalpy drop.', f: '', n: 'Latent heat of water at 1 atm ≈ 2257 kJ/kg.' }
      ]
    },
    formulas: {
      label: 'Formulas', items: [
        { t: 'Thermal efficiency', b: 'The fraction of heat input converted to net work. Equivalently η = 1 − q_out/q_in.', f: 'η_th = w_net / q_in = (h₃−h₄ − (h₂−h₁)) / (h₃−h₂)', n: 'Modern supercritical plants reach 45–48%; older subcritical ≈ 35–40%.' },
        { t: 'Pump work', b: 'For an incompressible liquid the pump work is volume × pressure rise — small but not zero.', f: 'w_pump = v₁ (P₂ − P₁)', n: 'v₁ ≈ 0.001 m³/kg, so for a 10 MPa rise w_pump ≈ 10 kJ/kg.' },
        { t: 'Turbine work & quality', b: 'For the ideal cycle the turbine is isentropic: s₄ = s₃. The exit is usually wet; quality x₄ = (s₃ − s_f)/(s_g − s_f) at condenser pressure.', f: 'w_turbine = h₃ − h₄,   x₄ = (s₃−s_f)/(s_g−s_f)', n: 'Keep x₄ ≥ ~0.88 to avoid turbine blade erosion.' },
        { t: 'Carnot comparison', b: 'No cycle between the same two temperatures can beat the Carnot efficiency. The Rankine cycle falls short because heat is added over a range of temperatures, not all at T_max.', f: 'η_Carnot = 1 − T_L/T_H   (kelvin)', n: 'Raising boiler pressure & superheat pushes Rankine toward the Carnot limit.' }
      ]
    },
    improving: {
      label: 'Improving η', items: [
        { t: 'Increase boiler pressure', b: 'Raising boiler pressure raises the average temperature of heat addition, improving efficiency — but it lowers turbine-exit quality (more moisture). Modern plants combine high pressure with reheat to manage this.', f: '', n: 'Supercritical plants run above 22.06 MPa — no distinct boiling.' },
        { t: 'Superheat the steam', b: 'Heating steam well above saturation (e.g. to 540–600 °C) raises the average heat-addition temperature, increases work output, AND improves exit quality. The single most effective lever.', f: '', n: 'Metallurgy limits inlet temperature to ~600–620 °C in steel turbines.' },
        { t: 'Lower condenser pressure', b: 'Dropping condenser pressure (deeper vacuum) lowers T_L and the heat-rejection temperature, raising efficiency. Limited by the temperature of available cooling water.', f: '', n: 'Condensers run at 4–10 kPa (≈30–45 °C), far below atmospheric.' },
        { t: 'Reheat & regeneration', b: 'Reheat expands steam partway, returns it to the boiler, then expands again — raising η and quality. Regeneration uses bled steam to preheat feedwater. Real plants use both.', f: '', n: 'Reheat + regeneration add 5–10 efficiency points over the simple cycle.' }
      ]
    },
    applications: {
      label: 'Applications', items: [
        { t: 'Thermal power stations', b: 'Coal, gas (combined-cycle bottoming), nuclear, and biomass plants all use a steam Rankine cycle to drive the generator. A 1000 MW unit circulates hundreds of kg/s of steam.', f: '', n: 'A large nuclear plant rejects ~2× its electrical output as waste heat.' },
        { t: 'Organic Rankine Cycle (ORC)', b: 'For low-temperature heat (geothermal, solar, waste heat), water boils too high. ORC uses an organic working fluid (refrigerant, pentane) with a low boiling point to harvest heat at 80–300 °C.', f: '', n: 'ORC units recover waste heat from engines, kilns, and flares.' },
        { t: 'Combined-cycle plants', b: 'A gas turbine\'s hot exhaust (≈600 °C) boils water for a Rankine bottoming cycle. The two cycles together reach 60%+ efficiency — the highest of any heat engine.', f: '', n: 'Combined-cycle gas turbines (CCGT) are the efficiency benchmark.' }
      ]
    },
    standards: {
      label: 'Reference', items: [
        { t: 'Typical operating ranges', b: 'Boiler pressure 2–30 MPa; turbine inlet 400–600 °C; condenser 4–15 kPa. Subcritical < 22.06 MPa, supercritical above. Use the sliders to explore each region.', f: '', n: 'This simulator covers 0.2–15 MPa boiler, 5–100 kPa condenser.' },
        { t: 'Steam tables', b: 'All properties here come from standard saturated and superheated steam tables (Cengel A-5/A-6), interpolated. State 1 uses saturated-liquid data; state 3 uses superheated data; state 4 quality from condenser-pressure saturation values.', f: '', n: 'Results match textbook worked examples to ~1%.' },
        { t: 'Key references', b: 'Cengel & Boles, Thermodynamics: An Engineering Approach (Ch. 10). Moran, Shapiro — Fundamentals of Engineering Thermodynamics. Rogers & Mayhew steam tables.', f: '', n: 'The IAPWS-IF97 formulation is the modern industrial property standard.' }
      ]
    }
  };
  var exploreCat = 'basics';
  function renderExplore() {
    var cats = $('explore-cats'); cats.innerHTML = '';
    Object.keys(EXPLORE).forEach(function (k) {
      var b = document.createElement('button'); b.className = 'explore-btn' + (k === exploreCat ? ' active' : ''); b.textContent = EXPLORE[k].label;
      b.onclick = function () { exploreCat = k; playClick(); renderExplore(); };
      cats.appendChild(b);
    });
    var grid = $('explore-grid'); grid.innerHTML = '';
    EXPLORE[exploreCat].items.forEach(function (it, idx) {
      var b = document.createElement('button'); b.className = 'explore-btn' + (idx === 0 ? ' active' : ''); b.textContent = it.t;
      b.onclick = function () { showExplore(it); grid.querySelectorAll('.explore-btn').forEach(function (x) { x.classList.remove('active'); }); b.classList.add('active'); };
      grid.appendChild(b);
    });
    showExplore(EXPLORE[exploreCat].items[0]);
    drawExploreCanvas();
  }
  function showExplore(it) {
    var info = $('explore-info');
    info.innerHTML = '<h3>' + it.t + '</h3><p>' + it.b + '</p>' + (it.f ? '<div class="formula-box">' + it.f + '</div>' : '') + (it.n ? '<div class="example-box"><strong>Note:</strong> ' + it.n + '</div>' : '');
  }
  function drawExploreCanvas() {
    if (!expX) return;
    var ctx = expX; ctx.clearRect(0, 0, EW, EH);
    ctx.fillStyle = '#0d1117'; roundRect(ctx, 0, 0, EW, EH, 8); ctx.fill();
    // mini T-s with labelled processes
    var x0 = 70, y0 = 30, w = EW - 130, h = EH - 80;
    var P = plotter(x0, y0, w, h, 0, 9.5, 0, 650, false, false);
    drawAxes(ctx, x0, y0, w, h, 'Entropy s (kJ/kg·K)', 'Temperature T (°C)', 0, 9.5, 1, 0, 650, 100);
    ctx.beginPath(); var first = true;
    for (var T = 5; T <= TCRIT; T += 6) { var s = satByT(T); if (first) { ctx.moveTo(P.mx(s.sf), P.my(T)); first = false; } else ctx.lineTo(P.mx(s.sf), P.my(T)); }
    ctx.lineTo(P.mx(4.412), P.my(TCRIT));
    for (var T2 = TCRIT; T2 >= 5; T2 -= 6) { var s2 = satByT(T2); ctx.lineTo(P.mx(s2.sg), P.my(T2)); }
    ctx.closePath(); ctx.fillStyle = 'rgba(58,68,112,.18)'; ctx.fill(); ctx.strokeStyle = COL.dome; ctx.lineWidth = 1.5; ctx.stroke();
    var saved = res, savedBM = state.buildMode; state.buildMode = false;  // always full in preview
    res = computeRankine(state); drawCyclePath(ctx, P, 'ts');
    var pts = res.states.map(function (p) { return { x: P.mx(p.s), y: P.my(p.T) }; });
    labelStates(ctx, pts); res = saved; state.buildMode = savedBM;
    ctx.fillStyle = COL.dim; ctx.font = '11px ' + FONT; ctx.textAlign = 'left';
    ctx.fillText('Live preview of the current Rankine cycle — adjust it in Simulate mode.', x0, EH - 14);
  }

  /* ═══════════ PRACTICE ═════════════════════════════════════════════════ */
  var pScore = { c: 0, t: 0 }, pCur = null;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function newProblem() {
    $('practice-feedback').textContent = ''; $('practice-feedback').className = 'practice-feedback';
    $('practice-solution').style.display = 'none'; $('btn-show-sol').style.display = 'none'; $('practice-input').value = '';
    var type = pick(['eta', 'wnet', 'qin', 'carnot', 'x4']);
    var Ph = pick([3000, 4000, 6000, 8000, 10000]), Pl = pick([10, 15, 20, 50]), T3 = pick([400, 450, 500, 550, 600]);
    var r = computeRankine({ cycle: 'rankine', pHigh: Ph, pLow: Pl, t3: T3, etaT: 100, etaP: 100, power: 0 });
    var s = r.states, q, ans, unit, sol;
    if (type === 'eta') {
      q = 'An ideal Rankine cycle has q_in = ' + r.qIn.toFixed(0) + ' kJ/kg and net work w_net = ' + r.wNet.toFixed(0) + ' kJ/kg. Find the thermal efficiency.';
      ans = r.eta * 100; unit = '%'; sol = 'η = w_net / q_in = ' + r.wNet.toFixed(0) + ' / ' + r.qIn.toFixed(0) + ' = ' + ans.toFixed(1) + '%';
    } else if (type === 'wnet') {
      q = 'Turbine work is ' + r.wTurb.toFixed(0) + ' kJ/kg and pump work is ' + r.wPump.toFixed(1) + ' kJ/kg. Find the net work output.';
      ans = r.wNet; unit = 'kJ/kg'; sol = 'w_net = w_turb − w_pump = ' + r.wTurb.toFixed(0) + ' − ' + r.wPump.toFixed(1) + ' = ' + ans.toFixed(1) + ' kJ/kg';
    } else if (type === 'qin') {
      q = 'Boiler inlet enthalpy h₂ = ' + s[1].h.toFixed(0) + ' kJ/kg, turbine inlet h₃ = ' + s[2].h.toFixed(0) + ' kJ/kg. Find the heat added in the boiler.';
      ans = r.qIn; unit = 'kJ/kg'; sol = 'q_in = h₃ − h₂ = ' + s[2].h.toFixed(0) + ' − ' + s[1].h.toFixed(0) + ' = ' + ans.toFixed(0) + ' kJ/kg';
    } else if (type === 'carnot') {
      q = 'The cycle adds heat at T_H = ' + (r.sat.high.T).toFixed(0) + ' °C and rejects at T_L = ' + (r.sat.low.T).toFixed(0) + ' °C. Find the Carnot (maximum) efficiency.';
      ans = r.carnot * 100; unit = '%'; sol = 'η_Carnot = 1 − T_L/T_H = 1 − ' + (r.sat.low.T + 273.15).toFixed(0) + '/' + (r.sat.high.T + 273.15).toFixed(0) + ' = ' + ans.toFixed(1) + '%';
    } else {
      q = 'Turbine inlet entropy s₃ = ' + s[2].s.toFixed(3) + ' kJ/kg·K. At condenser pressure ' + (Pl / 100).toFixed(2) + ' bar, s_f = ' + r.sat.low.sf.toFixed(3) + ' and s_g = ' + r.sat.low.sg.toFixed(3) + '. Find the turbine-exit steam quality x₄.';
      ans = r.x4 === null ? 100 : r.x4 * 100; unit = '%'; sol = 'x₄ = (s₃ − s_f)/(s_g − s_f) = (' + s[2].s.toFixed(3) + ' − ' + r.sat.low.sf.toFixed(3) + ')/(' + r.sat.low.sg.toFixed(3) + ' − ' + r.sat.low.sf.toFixed(3) + ') = ' + (ans).toFixed(1) + '%';
    }
    pCur = { ans: ans, unit: unit, sol: sol };
    $('practice-prompt').textContent = q; $('practice-unit').textContent = unit;
  }
  function checkProblem() {
    if (!pCur) return; var v = parseFloat($('practice-input').value); if (isNaN(v)) return;
    pScore.t++; var tol = Math.max(Math.abs(pCur.ans) * 0.03, 0.5);
    var fb = $('practice-feedback');
    if (Math.abs(v - pCur.ans) <= tol) { pScore.c++; fb.textContent = '✓ Correct! ' + pCur.ans.toFixed(1) + ' ' + pCur.unit; fb.className = 'practice-feedback ok'; playSuccess(); }
    else { fb.textContent = '✗ Not quite. Correct: ' + pCur.ans.toFixed(1) + ' ' + pCur.unit; fb.className = 'practice-feedback err'; playError(); }
    $('practice-solution').innerHTML = '<strong>Solution:</strong> ' + pCur.sol; $('practice-solution').style.display = 'block';
    $('btn-show-sol').style.display = 'none';
    $('practice-score').textContent = pScore.c + ' / ' + pScore.t;
  }

  /* ═══════════ QUIZ ═════════════════════════════════════════════════════ */
  var QSIZE = 5, qIdx = 0, qScore = 0, qLog = [], qCur = null;
  var QBANK = [
    { q: 'Which process in the Rankine cycle produces the net work output?', o: ['Turbine expansion', 'Boiler heating', 'Condenser cooling', 'Pump compression'], a: 0 },
    { q: 'In the ideal Rankine cycle, the turbine expansion is assumed to be:', o: ['Isentropic (s constant)', 'Isothermal', 'Isobaric', 'Isenthalpic'], a: 0 },
    { q: 'Heat is added in the boiler at approximately constant:', o: ['Pressure', 'Volume', 'Entropy', 'Temperature only'], a: 0 },
    { q: 'Which change raises thermal efficiency AND improves turbine-exit quality?', o: ['Superheating the steam', 'Lowering boiler pressure', 'Raising condenser pressure', 'Reducing turbine size'], a: 0 },
    { q: 'The Rankine cycle is less efficient than a Carnot cycle between the same temperatures mainly because:', o: ['Heat is added over a range of temperatures', 'The pump uses too much work', 'Steam is incompressible', 'The condenser is too cold'], a: 0 },
    { q: 'Lowering the condenser pressure improves efficiency by:', o: ['Lowering the heat-rejection temperature', 'Raising pump work', 'Increasing boiler pressure', 'Reducing superheat'], a: 0 },
    { q: 'The back-work ratio of a Rankine cycle is small because:', o: ['Pumping a liquid takes little work', 'The turbine is inefficient', 'Steam has low density', 'The boiler is large'], a: 0 },
    { q: 'Turbine-exit moisture should be limited (x ≥ ~0.88) to prevent:', o: ['Blade erosion', 'Boiler scaling', 'Pump cavitation', 'Condenser flooding'], a: 0 },
    { q: 'A supercritical Rankine plant operates with boiler pressure above:', o: ['22.06 MPa', '1 MPa', '10 kPa', '101 kPa'], a: 0 },
    { q: 'The Organic Rankine Cycle (ORC) is used mainly to harvest:', o: ['Low-temperature heat', 'Nuclear fission heat', 'Supercritical steam', 'Compressed air energy'], a: 0 }
  ];
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function resetQuiz() {
    qIdx = 0; qScore = 0; qLog = []; $('quiz-result').style.display = 'none'; $('quiz-panel').style.display = 'block';
    quizBank = shuffle(QBANK).slice(0, QSIZE); nextQuiz();
  }
  var quizBank = [];
  function nextQuiz() {
    if (qIdx >= QSIZE) return showQuizResult();
    qCur = quizBank[qIdx];
    $('quiz-counter').textContent = 'Question ' + (qIdx + 1) + ' of ' + QSIZE;
    $('quiz-prompt').textContent = qCur.q;
    $('quiz-feedback').textContent = ''; $('btn-quiz-next').style.display = 'none';
    var opts = $('quiz-options'); opts.innerHTML = '';
    var order = shuffle(qCur.o.map(function (txt, i) { return { txt: txt, i: i }; }));
    order.forEach(function (op) {
      var b = document.createElement('button'); b.className = 'quiz-opt'; b.textContent = op.txt;
      b.onclick = function () { answerQuiz(op.i, b, opts); }; opts.appendChild(b);
    });
  }
  function answerQuiz(i, btn, opts) {
    var correct = i === qCur.a;
    opts.querySelectorAll('.quiz-opt').forEach(function (b) {
      b.classList.add('disabled');
      if (b.textContent === qCur.o[qCur.a]) b.classList.add('correct');
    });
    if (correct) { qScore++; btn.classList.add('correct'); $('quiz-feedback').textContent = '✓ Correct!'; $('quiz-feedback').className = 'quiz-feedback ok'; playSuccess(); }
    else { btn.classList.add('wrong'); $('quiz-feedback').textContent = '✗ Incorrect.'; $('quiz-feedback').className = 'quiz-feedback err'; playError(); }
    qLog.push({ q: qCur.q, ok: correct });
    $('btn-quiz-next').style.display = 'inline-block'; qIdx++;
  }
  function showQuizResult() {
    $('quiz-panel').style.display = 'none'; var r = $('quiz-result'); r.style.display = 'block';
    var pct = qScore / QSIZE;
    var stars = pct === 1 ? '★★★' : pct >= 0.6 ? '★★☆' : pct >= 0.4 ? '★☆☆' : '☆☆☆';
    $('qr-stars').textContent = stars;
    var sc = $('qr-score'); sc.textContent = qScore + ' / ' + QSIZE + ' correct';
    sc.className = 'qr-score ' + (pct === 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor');
    var tb = $('qr-table').querySelector('tbody'); tb.innerHTML = '';
    qLog.forEach(function (l, i) { tb.innerHTML += '<tr class="qr-row ' + (l.ok ? 'ok' : 'err') + '"><td>' + (i + 1) + '</td><td>' + l.q + '</td><td>' + (l.ok ? '✓' : '✗') + '</td></tr>'; });
  }

  /* ═══════════ SOUND ════════════════════════════════════════════════════ */
  function actx() { if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } return state.audioCtx; }
  function playTone(f, d, type, vol) { var c = actx(); if (!c) return; var o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(c.destination); o.start(); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d); o.stop(c.currentTime + d); }
  function playClick() { playTone(800, 0.05, 'square', 0.03); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.08); setTimeout(function () { playTone(1100, 0.15, 'sine', 0.08); }, 110); }
  function playError() { playTone(300, 0.2, 'sawtooth', 0.05); }

  /* ═══════════ EXPORT / CONTEXT MENU ════════════════════════════════════ */
  function exportPNG() {
    var tmp = document.createElement('canvas'); tmp.width = diaC.width; tmp.height = diaC.height;
    var tc = tmp.getContext('2d'); tc.fillStyle = '#0d1117'; tc.fillRect(0, 0, tmp.width, tmp.height); tc.drawImage(diaC, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 10) fs = 10;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif'; tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.28)'; tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a'); a.href = tmp.toDataURL('image/png'); a.download = 'rankine_' + state.diagram + '_diagram.png'; a.click();
  }
  function exportCSV() {
    if (!res) return;
    var rows = [['State', 'P_' + U.Pu(), 'T_' + U.Tu(), 'h_' + U.hu(), 's_' + U.su(), 'x']];
    res.states.forEach(function (p, i) { rows.push([i + 1, U.P(p.p).toFixed(2), U.T(p.T).toFixed(1), U.h(p.h).toFixed(1), U.s(p.s).toFixed(4), p.x === null ? 'superheated' : p.x.toFixed(3)]); });
    rows.push([]); rows.push(['Thermal efficiency', (res.eta * 100).toFixed(2) + '%']);
    rows.push(['Net work', U.h(res.wNet).toFixed(1) + ' ' + U.hu()]);
    rows.push(['Carnot efficiency', (res.carnot * 100).toFixed(2) + '%']);
    var csv = rows.map(function (r) { return r.join(','); }).join('\n');
    var a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'rankine_cycle_states.csv'; a.click();
  }
  function copyValues() {
    if (!res) return;
    var txt = 'Rankine/Carnot cycle — η = ' + (res.eta * 100).toFixed(1) + '%, w_net = ' + res.wNet.toFixed(1) + ' kJ/kg, q_in = ' + res.qIn.toFixed(1) + ' kJ/kg, x₄ = ' + (res.x4 === null ? 'superheated' : (res.x4 * 100).toFixed(1) + '%');
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
  }

  /* ═══════════ EVENTS ═══════════════════════════════════════════════════ */
  function bindSlider(key, mapToState) {
    var sl = $(key + '-slider'), inp = $(key + '-num');
    function commit(v) { mapToState(v); syncControls(); render(); }
    if (sl) sl.addEventListener('input', function () { commit(parseFloat(sl.value)); playClick(); });
    /* The box is in display units — bring it back to the slider's scale. */
    if (inp) inp.addEventListener('change', function () { commit(ctrlFromDisp(key, parseFloat(inp.value))); });
    document.querySelectorAll('.step-btn[data-for="' + key + '"]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseFloat(b.dataset.dir), step = parseFloat(sl.step) || 1;
        commit(parseFloat(sl.value) + dir * step); playClick();
      });
    });
  }

  function init() {
    fitAll();
    // mode tabs
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.addEventListener('click', function () { playClick(); switchMode(p.dataset.mode); }); });
    // cycle type
    document.querySelectorAll('#cycle-tabs .mat-pill').forEach(function (b) {
      b.addEventListener('click', function () {
        state.cycle = b.dataset.cycle; document.querySelectorAll('#cycle-tabs .mat-pill').forEach(function (x) { x.classList.toggle('active', x === b); });
        playClick(); syncControls(); render();
      });
    });
    // sliders
    bindSlider('pHigh', function (barVal) { state.pHigh = clamp(barVal * 100, 200, 15000); });
    bindSlider('pLow', function (v) { state.pLow = clamp(v, 5, 100); });
    bindSlider('t3', function (v) { state.t3 = clamp(v, 50, 650); });
    bindSlider('etaT', function (v) { state.etaT = clamp(v, 70, 100); });
    bindSlider('etaP', function (v) { state.etaP = clamp(v, 60, 100); });
    bindSlider('power', function (v) { state.power = clamp(v, 1, 1000); });
    // preset
    $('preset-select').addEventListener('change', function () {
      var p = PRESETS[this.value]; if (!p) return;
      Object.keys(p).forEach(function (k) { state[k] = p[k]; });
      document.querySelectorAll('#cycle-tabs .mat-pill').forEach(function (x) { x.classList.toggle('active', x.dataset.cycle === state.cycle); });
      syncControls(); render(); playClick();
    });
    // diagram toggle
    document.querySelectorAll('#diagram-toggle .unit-opt').forEach(function (b) {
      b.addEventListener('click', function () { state.diagram = b.dataset.dia; document.querySelectorAll('#diagram-toggle .unit-opt').forEach(function (x) { x.classList.toggle('active', x === b); }); playClick(); drawDiagram(); });
    });
    // units
    document.querySelectorAll('#unit-toggle .unit-opt').forEach(function (b) {
      b.addEventListener('click', function () { state.units = b.dataset.unit; document.querySelectorAll('#unit-toggle .unit-opt').forEach(function (x) { x.classList.toggle('active', x === b); }); playClick(); syncControls(); render(); });
    });
    // toggles
    $('chk-labels').addEventListener('change', function () { state.showLabels = this.checked; drawDiagram(); });
    $('chk-dome').addEventListener('change', function () { state.showDome = this.checked; drawDiagram(); });
    // action buttons
    $('btn-start').addEventListener('click', function () { actx(); state.running ? pauseAnim() : startAnim(); });
    $('btn-reset').addEventListener('click', function () { pauseAnim(); state.phase = 0; render(); playClick(); });
    $('btn-export-png').addEventListener('click', function () { exportPNG(); playClick(); });
    $('btn-export-csv').addEventListener('click', function () { exportCSV(); playClick(); });
    // speed
    $('speed-slider').addEventListener('input', function () { state.speed = parseFloat(this.value); $('speed-val').textContent = state.speed.toFixed(1) + '×'; });
    // practice
    $('btn-check').addEventListener('click', checkProblem);
    $('btn-next-prob').addEventListener('click', function () { newProblem(); playClick(); });
    $('practice-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') checkProblem(); });
    // quiz
    $('btn-quiz-next').addEventListener('click', function () { nextQuiz(); });
    $('btn-new-quiz').addEventListener('click', resetQuiz);
    // context menu
    var menu = $('ph-ctx-menu');
    diaC.addEventListener('contextmenu', function (e) { e.preventDefault(); menu.style.display = 'block'; menu.style.left = e.clientX + 'px'; menu.style.top = e.clientY + 'px'; });
    document.addEventListener('click', function () { menu.style.display = 'none'; });
    menu.querySelectorAll('.ctx-item').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.action;
        if (a === 'export-png') exportPNG(); else if (a === 'copy-values') copyValues();
        else if (a === 'toggle-dome') { state.showDome = !state.showDome; $('chk-dome').checked = state.showDome; drawDiagram(); }
        else if (a === 'reset') { pauseAnim(); state.phase = 0; render(); }
      });
    });
    window.addEventListener('resize', function () { fitAll(); render(); if (state.mode === 'explore') drawExploreCanvas(); });
    // default active cycle pill
    document.querySelectorAll('#cycle-tabs .mat-pill').forEach(function (x) { x.classList.toggle('active', x.dataset.cycle === state.cycle); });
    syncControls();
    state.mode = 'simulate';
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
