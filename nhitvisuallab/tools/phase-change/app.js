(function () {
  'use strict';

  /* ── roundRect polyfill ──────────── */
  if (typeof CanvasRenderingContext2D.prototype.roundRect !== 'function') {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
      if (typeof radii === 'number') radii = [radii, radii, radii, radii];
      if (Array.isArray(radii)) { while (radii.length < 4) radii.push(radii[radii.length - 1] || 0); }
      var tl = radii[0], tr = radii[1], br = radii[2], bl = radii[3];
      this.moveTo(x + tl, y); this.lineTo(x + w - tr, y);
      this.quadraticCurveTo(x + w, y, x + w, y + tr);
      this.lineTo(x + w, y + h - br);
      this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
      this.lineTo(x + bl, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - bl);
      this.lineTo(x, y + tl);
      this.quadraticCurveTo(x, y, x + tl, y);
      this.closePath(); return this;
    };
  }

  var R_GAS = 8.314462618;   // J/(mol K)
  var P_ATM = 1.01325;       // bar — the reference pressure for tabulated Tm/Tb

  /* ================================================================
     MATERIALS
     Tm/Tb   °C at 1 atm          Lf/Lv/Lsub  kJ/kg
     cS/cL/cG  J/(kg K)           M  g/mol
     Ttp/Ptp   triple point (°C, bar)
     TbRef/PbRef  the (T,P) point the vaporization line is anchored to
     Tc        critical temperature °C (TcOk=false → poorly established)

     Handbook values (CRC Handbook / NIST Chemistry WebBook). Latent heats
     were cross-checked against the molar enthalpies: e.g. Al Lv = 294 kJ/mol
     / 26.98 g/mol = 10 900 kJ/kg, Cu Lv = 300.4/63.55 = 4726 kJ/kg.

     Lsub is the enthalpy of sublimation AT THE TRIPLE POINT, and it is
     deliberately NOT computed as Lf + Lv: the tabulated Lv is measured at the
     normal boiling point, which is warmer than the triple point, so Lv there
     is too small. For ice, Lf + Lv = 2594 kJ/kg but the true Lsub is
     2838 kJ/kg — using the wrong one shifts the predicted sublimation
     temperature by about 2 °C.
     ================================================================ */
  var BUILTIN_MATERIALS = [
    { name: 'Water', formula: 'H\u2082O', M: 18.015, floats: true,
      colorS: '#cfeeff', colorL: '#4fc3f7', colorG: '#b3e5fc',
      Tm: 0, Tb: 100, Lf: 334, Lv: 2260, Lsub: 2838,
      cS: 2090, cL: 4186, cG: 2010,
      Ttp: 0.01, Ptp: 0.0061166, TbRef: 100, PbRef: P_ATM, Tc: 373.95, TcOk: true },
    { name: 'Ethanol', formula: 'C\u2082H\u2085OH', M: 46.068,
      colorS: '#f8bbd0', colorL: '#f06292', colorG: '#fce4ec',
      Tm: -114.1, Tb: 78.4, Lf: 108, Lv: 855, Lsub: 1000,
      cS: 1200, cL: 2440, cG: 1430,
      Ttp: -114.1, Ptp: 4.3e-9, TbRef: 78.4, PbRef: P_ATM, Tc: 241.6, TcOk: true },
    { name: 'Ammonia', formula: 'NH\u2083', M: 17.031,
      colorS: '#e1bee7', colorL: '#ba68c8', colorG: '#f3e5f5',
      Tm: -77.7, Tb: -33.3, Lf: 332, Lv: 1371, Lsub: 1810,
      cS: 2090, cL: 4700, cG: 2200,
      Ttp: -77.75, Ptp: 0.06091, TbRef: -33.3, PbRef: P_ATM, Tc: 132.25, TcOk: true },
    { name: 'Carbon dioxide', formula: 'CO\u2082', M: 44.009,
      colorS: '#e0f7fa', colorL: '#80deea', colorG: '#b2ebf2',
      Tm: -56.6, Tb: -56.6, Lf: 205, Lv: 348, Lsub: 571,
      cS: 1200, cL: 2000, cG: 846,
      Ttp: -56.558, Ptp: 5.1795, TbRef: -56.558, PbRef: 5.1795, Tc: 30.98, TcOk: true },
    { name: 'Mercury', formula: 'Hg', M: 200.592,
      colorS: '#cfd8dc', colorL: '#90a4ae', colorG: '#eceff1',
      Tm: -38.8, Tb: 356.7, Lf: 11.4, Lv: 294, Lsub: 305,
      cS: 140, cL: 140, cG: 104,
      Ttp: -38.83, Ptp: 1.65e-12, TbRef: 356.7, PbRef: P_ATM, Tc: 1477, TcOk: true },
    { name: 'Lead', formula: 'Pb', M: 207.2,
      colorS: '#9fa8da', colorL: '#5c6bc0', colorG: '#c5cae9',
      Tm: 327.5, Tb: 1749, Lf: 23, Lv: 871, Lsub: 894,
      cS: 128, cL: 140, cG: 100,
      Ttp: 327.5, Ptp: 1e-12, TbRef: 1749, PbRef: P_ATM, Tc: 4530, TcOk: false },
    { name: 'Aluminium', formula: 'Al', M: 26.982,
      colorS: '#d6d6d6', colorL: '#9e9e9e', colorG: '#eeeeee',
      Tm: 660.3, Tb: 2519, Lf: 397, Lv: 10900, Lsub: 11300,
      cS: 897, cL: 1170, cG: 770,
      Ttp: 660.3, Ptp: 1e-12, TbRef: 2519, PbRef: P_ATM, Tc: 7730, TcOk: false },
    { name: 'Iron', formula: 'Fe', M: 55.845,
      colorS: '#b0bec5', colorL: '#ff8a65', colorG: '#cfd8dc',
      Tm: 1538, Tb: 2862, Lf: 247, Lv: 6340, Lsub: 6590,
      cS: 449, cL: 820, cG: 372,
      Ttp: 1538, Ptp: 1e-10, TbRef: 2862, PbRef: P_ATM, Tc: 8230, TcOk: false },
    { name: 'Copper', formula: 'Cu', M: 63.546,
      colorS: '#ffcc80', colorL: '#ff9800', colorG: '#ffe0b2',
      Tm: 1085, Tb: 2562, Lf: 209, Lv: 4726, Lsub: 4940,
      cS: 385, cL: 495, cG: 327,
      Ttp: 1085, Ptp: 1e-10, TbRef: 2562, PbRef: P_ATM, Tc: 8030, TcOk: false },
    { name: 'Nitrogen', formula: 'N\u2082', M: 28.014,
      colorS: '#b2ebf2', colorL: '#4dd0e1', colorG: '#e0f7fa',
      Tm: -210, Tb: -195.8, Lf: 25.7, Lv: 199, Lsub: 239,
      cS: 1000, cL: 2040, cG: 1040,
      Ttp: -210.0, Ptp: 0.1252, TbRef: -195.8, PbRef: P_ATM, Tc: -146.96, TcOk: true },
    { name: 'Oxygen', formula: 'O\u2082', M: 31.999,
      colorS: '#c5cae9', colorL: '#7986cb', colorG: '#e8eaf6',
      Tm: -218.8, Tb: -183, Lf: 13.9, Lv: 213, Lsub: 245,
      cS: 1700, cL: 1700, cG: 918,
      Ttp: -218.79, Ptp: 0.001463, TbRef: -183, PbRef: P_ATM, Tc: -118.57, TcOk: true }
  ];
  var MATERIALS = BUILTIN_MATERIALS.slice();

  /* ================================================================
     PHASE-TRANSITION METADATA
     ================================================================ */
  var TRANS = {
    melt:     { label: 'Melting',     Lname: 'L_f',   Lkey: 'Lf',   color: '#ffd54f', dirWord: 'absorbed', from: 'Solid',  to: 'Liquid', icon: '\u2744\uFE0F \u2192 \u{1F4A7}' },
    freeze:   { label: 'Freezing',    Lname: 'L_f',   Lkey: 'Lf',   color: '#4dd0e1', dirWord: 'released', from: 'Liquid', to: 'Solid',  icon: '\u{1F4A7} \u2192 \u2744\uFE0F' },
    boil:     { label: 'Boiling',     Lname: 'L_v',   Lkey: 'Lv',   color: '#ff7043', dirWord: 'absorbed', from: 'Liquid', to: 'Gas',    icon: '\u{1F4A7} \u2192 \u2601\uFE0F' },
    condense: { label: 'Condensing',  Lname: 'L_v',   Lkey: 'Lv',   color: '#9575cd', dirWord: 'released', from: 'Gas',    to: 'Liquid', icon: '\u2601\uFE0F \u2192 \u{1F4A7}' },
    sublime:  { label: 'Subliming',   Lname: 'L_sub', Lkey: 'Lsub', color: '#f06292', dirWord: 'absorbed', from: 'Solid',  to: 'Gas',    icon: '\u2744\uFE0F \u2192 \u2601\uFE0F' },
    deposit:  { label: 'Depositing',  Lname: 'L_sub', Lkey: 'Lsub', color: '#4db6ac', dirWord: 'released', from: 'Gas',    to: 'Solid',  icon: '\u2601\uFE0F \u2192 \u2744\uFE0F' }
  };
  function transOf(kind) { return TRANS[kind] || TRANS.melt; }
  function latentOf(mat, kind) {
    var t = transOf(kind);
    return t.Lkey === 'Lsub' ? (mat.Lsub || (mat.Lf + mat.Lv)) : mat[t.Lkey];
  }

  /* ================================================================
     PRESSURE-AWARE PHASE PHYSICS
     ================================================================ */

  /* Clausius–Clapeyron with constant latent heat:
       ln(P2/P1) = -(L_molar/R)(1/T2 - 1/T1)
     rearranged for T2. Accurate to roughly 1–2 °C over 0.01–10 bar, which is
     verified against steam tables in the tool's documentation.               */
  function ccTemp(T1_C, P1_bar, P2_bar, L_kJkg, M_gmol) {
    var T1 = T1_C + 273.15;
    var Lmol = L_kJkg * 1000 * (M_gmol / 1000);      // J/mol
    if (!(Lmol > 0) || !(P1_bar > 0) || !(P2_bar > 0)) return T1_C;
    var inv = 1 / T1 - (R_GAS / Lmol) * Math.log(P2_bar / P1_bar);
    if (inv <= 1e-6) return Infinity;
    return 1 / inv - 273.15;
  }

  /* Phase temperatures at pressure P (bar).
     Returns { mode:'melt-boil'|'sublime', Tm, Tb, Tsub, supercritical }. */
  function phaseTemps(mat, P) {
    var Lsub = mat.Lsub || (mat.Lf + mat.Lv);
    if (P < mat.Ptp) {
      return { mode: 'sublime', Tsub: ccTemp(mat.Ttp, mat.Ptp, P, Lsub, mat.M),
               Tm: mat.Tm, Tb: mat.Tb, supercritical: false };
    }
    var Tb = ccTemp(mat.TbRef, mat.PbRef, P, mat.Lv, mat.M);
    var sc = false;
    if (mat.TcOk && (Tb > mat.Tc || !isFinite(Tb))) { Tb = mat.Tc; sc = true; }
    // The melting line is near-vertical: dTm/dP is of order 0.01 K/bar, so over
    // the pressure range offered here Tm is left at its 1 atm value.
    //
    // Near the triple point the constant-L vapour line is slightly off (it is
    // anchored at the NORMAL BOILING POINT, where Lv is measured, which keeps
    // the 0.1–20 bar range accurate to about 1 °C). Extrapolated all the way
    // down it can dip a little below Tm, which would invert the phase order.
    // The physical limit is that Tb → the triple-point temperature as P → Ptp,
    // so clamp there. The switch to sublimation is then governed purely by the
    // tabulated triple-point pressure, and lands on it exactly.
    var Tfloor = Math.max(mat.Ttp, mat.Tm);
    if (Tb < Tfloor) Tb = Tfloor;
    return { mode: 'melt-boil', Tm: mat.Tm, Tb: Tb, Tsub: null, supercritical: sc };
  }

  // Extra °C of open-ended tail needed so the curve always covers qMax.
  function tailFor(qMax, qSoFar, m, c) {
    if (!qMax || qMax <= qSoFar || !(m > 0) || !(c > 0)) return 0;
    return ((qMax - qSoFar) * 1000) / (m * c) * 1.05;
  }

  /* Heating (dir=+1) or cooling (dir=-1) curve.
     q is always the magnitude of heat transferred, so the x-axis reads
     "heat added" when heating and "heat removed" when cooling.
     Returns { pts:[{q,T,phase,label}], pt:phaseTemps, dir }.                */
  function buildCurve(mat, m, T0, P, dir, qMax) {
    var pt = phaseTemps(mat, P);
    var pts = [];
    var q = 0;
    var startPhase;
    var Lsub = mat.Lsub || (mat.Lf + mat.Lv);

    if (pt.mode === 'sublime') startPhase = (T0 < pt.Tsub) ? 's' : 'g';
    else                       startPhase = (T0 < pt.Tm) ? 's' : (T0 < pt.Tb ? 'l' : 'g');
    pts.push({ q: 0, T: T0, phase: startPhase, label: 'start' });

    function seg(dq, T, phase, label) {
      if (!(dq > 0)) dq = 0;
      q += dq;
      pts.push({ q: q, T: T, phase: phase, label: label });
    }
    function lastT() { return pts[pts.length - 1].T; }

    if (dir > 0) {
      if (pt.mode === 'sublime') {
        if (startPhase === 's') {
          seg(m * mat.cS * (pt.Tsub - T0) / 1000, pt.Tsub, 's', 'reach Tsub');
          seg(m * Lsub, pt.Tsub, 'g', 'sublimed');
        }
      } else {
        if (startPhase === 's') {
          seg(m * mat.cS * (pt.Tm - T0) / 1000, pt.Tm, 's', 'reach Tm');
          seg(m * mat.Lf, pt.Tm, 'l', 'melted');
          startPhase = 'l';
        }
        if (startPhase === 'l') {
          seg(m * mat.cL * (pt.Tb - lastT()) / 1000, pt.Tb, 'l', 'reach Tb');
          seg(m * mat.Lv, pt.Tb, 'g', 'vaporized');
        }
      }
      var tailH = Math.max(300, tailFor(qMax, q, m, mat.cG));
      seg(m * mat.cG * tailH / 1000, lastT() + tailH, 'g', 'gas heating');
      return { pts: pts, pt: pt, dir: dir };
    }

    /* ── cooling ── */
    if (pt.mode === 'sublime') {
      if (startPhase === 'g') {
        seg(m * mat.cG * (T0 - pt.Tsub) / 1000, pt.Tsub, 'g', 'reach Tsub');
        seg(m * Lsub, pt.Tsub, 's', 'deposited');
      }
    } else {
      if (startPhase === 'g') {
        seg(m * mat.cG * (T0 - pt.Tb) / 1000, pt.Tb, 'g', 'reach Tb');
        seg(m * mat.Lv, pt.Tb, 'l', 'condensed');
        startPhase = 'l';
      }
      if (startPhase === 'l') {
        seg(m * mat.cL * (lastT() - pt.Tm) / 1000, pt.Tm, 'l', 'reach Tm');
        seg(m * mat.Lf, pt.Tm, 's', 'frozen');
      }
    }
    var tailC = Math.max(200, tailFor(qMax, q, m, mat.cS));
    var endC = Math.max(-273.15, lastT() - tailC);
    seg(m * mat.cS * (lastT() - endC) / 1000, endC, 's', 'solid cooling');
    return { pts: pts, pt: pt, dir: dir };
  }

  var LABEL_TO_KIND = {
    melted: 'melt', vaporized: 'boil', sublimed: 'sublime',
    frozen: 'freeze', condensed: 'condense', deposited: 'deposit'
  };

  // Given a curve and the heat transferred so far, return { T, phase, p, plateau }.
  function stateAt(curve, qNow) {
    var pts = curve.pts;
    if (qNow <= 0) return { T: pts[0].T, phase: pts[0].phase, p: 0, plateau: null };
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i];
      if (qNow <= b.q + 1e-9) {
        var span = b.q - a.q;
        var f = span > 0 ? (qNow - a.q) / span : 0;
        var plateau = null;
        if (Math.abs(a.T - b.T) < 1e-6 && span > 0 && LABEL_TO_KIND[b.label]) {
          plateau = { kind: LABEL_TO_KIND[b.label], progress: f };
        }
        return { T: a.T + f * (b.T - a.T), phase: f < 1 ? a.phase : b.phase, p: f, plateau: plateau };
      }
    }
    var last = pts[pts.length - 1];
    return { T: last.T, phase: last.phase, p: 1, plateau: null };
  }

  // Human name of each curve segment, derived from the segment itself so a
  // curve that starts in the liquid or gas region is never mislabelled.
  var SEG_NAME = {
    'reach Tm': 'Solid heating', 'melted': 'Fusion (melt)',
    'reach Tb': 'Liquid heating', 'vaporized': 'Vaporization (boil)',
    'gas heating': 'Gas heating', 'reach Tsub': 'Solid heating',
    'sublimed': 'Sublimation', 'condensed': 'Condensation',
    'frozen': 'Solidification (freeze)', 'deposited': 'Deposition',
    'solid cooling': 'Solid cooling'
  };
  function segName(curve, i) {
    var lbl = curve.pts[i].label;
    if (curve.dir < 0) {
      if (lbl === 'reach Tb') return 'Gas cooling';
      if (lbl === 'reach Tm') return 'Liquid cooling';
      if (lbl === 'reach Tsub') return 'Gas cooling';
    }
    return SEG_NAME[lbl] || 'Heating';
  }
  function segIsLatent(curve, i) { return !!LABEL_TO_KIND[curve.pts[i].label]; }

  /* Total heat to carry the sample through every transition, plus a short
     sensible tail so the last slope is visible. Used to auto-fit the Q range
     whenever material, mass, T0, pressure or direction changes.             */
  function fitQ(mat, m, T0, P, dir) {
    var c = buildCurve(mat, m, T0, P, dir, 0);
    var pts = c.pts;
    var lastTrans = pts.length >= 2 ? pts[pts.length - 2].q : 0;
    var cTail = dir > 0 ? mat.cG : mat.cS;
    var q = lastTrans + m * cTail * 50 / 1000;
    if (!(q > 0)) q = m * cTail * 100 / 1000;
    return Math.max(1, Math.ceil(q / 10) * 10);
  }

  /* ================================================================
     PRESETS
     ================================================================ */
  var PRESETS = [
    { id: 'ice-steam',  label: 'Ice to Steam',        a: 0, b: 4,  m: 1.0, t0: -20,  p: P_ATM,  dir: 1,  view: 'single' },
    { id: 'melt-lead',  label: 'Melting Lead',        a: 5, b: 0,  m: 1.0, t0: 25,   p: P_ATM,  dir: 1,  view: 'single' },
    { id: 'boil-eth',   label: 'Boiling Ethanol',     a: 1, b: 0,  m: 1.0, t0: 20,   p: P_ATM,  dir: 1,  view: 'single' },
    { id: 'dry-ice',    label: 'Dry Ice Sublimes',    a: 3, b: 0,  m: 0.5, t0: -100, p: P_ATM,  dir: 1,  view: 'single' },
    { id: 'cooker',     label: 'Pressure Cooker',     a: 0, b: 0,  m: 1.0, t0: 20,   p: 2.0,    dir: 1,  view: 'single' },
    { id: 'everest',    label: 'Boiling on Everest',  a: 0, b: 0,  m: 1.0, t0: 20,   p: 0.337,  dir: 1,  view: 'single' },
    { id: 'freeze-dry', label: 'Freeze-Drying',       a: 0, b: 0,  m: 0.5, t0: -40,  p: 0.004,  dir: 1,  view: 'single' },
    { id: 'liquid-n',   label: 'Liquid Nitrogen',     a: 9, b: 0,  m: 1.0, t0: -210, p: P_ATM,  dir: 1,  view: 'single' },
    { id: 'freeze-h2o', label: 'Freezing Water',      a: 0, b: 0,  m: 1.0, t0: 20,   p: P_ATM,  dir: -1, view: 'single' },
    { id: 'cond-steam', label: 'Condensing Steam',    a: 0, b: 0,  m: 1.0, t0: 140,  p: P_ATM,  dir: -1, view: 'single' },
    { id: 'foundry',    label: 'Iron Foundry',        a: 7, b: 5,  m: 1.0, t0: 25,   p: P_ATM,  dir: 1,  view: 'compare' },
    { id: 'ice-lead',   label: 'Ice vs Lead',         a: 0, b: 5,  m: 1.0, t0: -20,  p: P_ATM,  dir: 1,  view: 'compare' },
    { id: 'h2o-hg',     label: 'Water vs Mercury',    a: 0, b: 4,  m: 1.0, t0: 20,   p: P_ATM,  dir: 1,  view: 'compare' }
  ];

  var PRESSURE_NOTES = [
    { max: 0.0062,  txt: 'below water\u2019s triple point \u2014 ice sublimes (freeze-drying)' },
    { max: 0.35,    txt: 'near-vacuum / high altitude' },
    { max: 0.9,     txt: 'mountain altitude' },
    { max: 1.10,    txt: 'sea level (1 atm)' },
    { max: 3.5,     txt: 'pressure-cooker range' },
    { max: 1e9,     txt: 'industrial boiler range' }
  ];
  function pressureNote(P) {
    for (var i = 0; i < PRESSURE_NOTES.length; i++) if (P <= PRESSURE_NOTES[i].max) return PRESSURE_NOTES[i].txt;
    return '';
  }

  /* ================================================================
     CONCEPTS (Explore)
     ================================================================ */
  var CONCEPTS = [
    { id: 'states', name: 'Three States of Matter', symbol: 'S \u2194 L \u2194 G',
      formula: 'Solid \u2192 Liquid \u2192 Gas', unit: '\u2014', cat: 'basics',
      desc: 'Matter exists in three main states. In a solid, molecules are locked in a lattice and only vibrate. In a liquid, they move freely but stay close together. In a gas, they are far apart and move fast in all directions. Adding heat provides enough kinetic energy to break the bonds holding each phase together.',
      example: { problem: 'What changes when ice melts to water?', steps: ['Ice molecules vibrate in lattice', 'Adding L_f = 334 kJ/kg breaks hydrogen bonds', 'Molecules move freely \u2192 liquid water', 'Temperature stays at 0\u00B0C during the transition'], answer: 334, unit: 'kJ/kg' }
    },
    { id: 'melting', name: 'Melting & Freezing', symbol: 'Solid \u2194 Liquid',
      formula: 'T = T_m, Q = mL_f', unit: 'kJ/kg', cat: 'basics',
      desc: 'Melting is the transition from solid to liquid at the melting point T_m. Freezing is the exact reverse and happens at the same temperature, releasing the same L_f back to the surroundings. The melting point is a property of the material: 0 \u00B0C for water, 327 \u00B0C for lead, 1538 \u00B0C for iron. At exactly T_m, solid and liquid coexist.',
      example: { problem: 'Energy to melt 2 kg of ice at 0 \u00B0C?', steps: ['Q = mL_f', 'Q = 2 \u00D7 334', 'Q = 668 kJ'], answer: 668, unit: 'kJ' }
    },
    { id: 'boiling', name: 'Boiling & Condensing', symbol: 'Liquid \u2194 Gas',
      formula: 'T = T_b(P), Q = mL_v', unit: 'kJ/kg', cat: 'basics',
      desc: 'Boiling is the transition from liquid to gas at the boiling point T_b. Condensation is the reverse and releases the same L_v. Unlike the melting point, T_b depends strongly on pressure. L_v is almost always much larger than L_f because turning a liquid into a gas means pulling molecules apart completely, not just letting them slide past each other.',
      example: { problem: 'Energy to boil 1 kg of water at 100 \u00B0C?', steps: ['Q = mL_v', 'Q = 1 \u00D7 2260', 'Q = 2260 kJ'], answer: 2260, unit: 'kJ' }
    },
    { id: 'subl', name: 'Sublimation & Deposition', symbol: 'Solid \u2194 Gas',
      formula: 'Q = mL_sub', unit: 'kJ/kg', cat: 'basics',
      desc: 'Below the triple-point pressure there is no stable liquid, so a solid goes straight to gas. Dry ice (solid CO\u2082) sublimes at \u221278.5 \u00B0C because its triple point sits at 5.18 bar \u2014 far above atmospheric. Water does the same below 6.1 mbar, which is exactly how freeze-drying works. Set the pressure slider below the triple point and the simulator switches to a single sublimation plateau.',
      example: { problem: 'Why does dry ice not make a puddle?', steps: ['CO\u2082 triple point = \u221256.6 \u00B0C at 5.18 bar', 'At 1 atm the pressure is far below that', 'No liquid field exists \u2192 solid goes straight to gas', 'It sublimes at \u221278.5 \u00B0C, L_sub = 571 kJ/kg'], answer: 571, unit: 'kJ/kg' }
    },
    { id: 'triple', name: 'Triple Point & Phase Diagram', symbol: 'P\u2013T diagram',
      formula: 'Solid + Liquid + Gas coexist', unit: '\u2014', cat: 'basics',
      desc: 'The triple point is the single pressure and temperature at which all three phases coexist in equilibrium. Water\u2019s is 0.01 \u00B0C at 6.117 mbar; CO\u2082\u2019s is \u221256.6 \u00B0C at 5.18 bar. Above the triple-point pressure a heated solid melts then boils; below it, the liquid field has closed and the solid sublimes instead. Above the critical temperature liquid and gas become indistinguishable and there is no boiling plateau at all.',
      example: { problem: 'At what pressure does ice stop melting and start subliming?', steps: ['Water triple point = 611.7 Pa = 6.117 mbar', 'Below 6.117 mbar no liquid is stable', 'Ice sublimes directly to vapour', 'At 1 mbar it sublimes near \u221220 \u00B0C'], answer: 6.117, unit: 'mbar' }
    },
    { id: 'lf', name: 'Latent Heat of Fusion', symbol: 'L_f',
      formula: 'Q = mL_f', unit: 'kJ/kg', cat: 'latent',
      desc: 'L_f is the energy needed to melt 1 kg of a substance at its melting point without any temperature change. Water: 334 kJ/kg, lead: 23 kJ/kg, iron: 247 kJ/kg. It measures the strength of the bonds holding the solid lattice together. Freezing releases exactly the same amount.',
      example: { problem: '5 kg of ice at 0 \u00B0C. How much energy to melt it?', steps: ['Q = mL_f', 'Q = 5 \u00D7 334', 'Q = 1670 kJ = 1.67 MJ'], answer: 1670, unit: 'kJ' }
    },
    { id: 'lv', name: 'Latent Heat of Vaporization', symbol: 'L_v',
      formula: 'Q = mL_v', unit: 'kJ/kg', cat: 'latent',
      desc: 'L_v is the energy needed to boil 1 kg of liquid at its boiling point. Water: 2260 kJ/kg, ethanol: 855 kJ/kg, ammonia: 1371 kJ/kg. Large L_v values make evaporation a powerful cooling mechanism. L_v is not a constant: it falls as pressure and temperature rise, reaching zero at the critical point.',
      example: { problem: 'Energy to vaporize 0.5 kg of water at 100 \u00B0C?', steps: ['Q = mL_v', 'Q = 0.5 \u00D7 2260', 'Q = 1130 kJ'], answer: 1130, unit: 'kJ' }
    },
    { id: 'ratio', name: 'L_v vs L_f', symbol: 'L_v \u226B L_f',
      formula: 'L_v / L_f \u2248 6.8 (water)', unit: '\u2014', cat: 'latent',
      desc: 'For most substances, L_v is much larger than L_f. Water: L_v / L_f = 2260 / 334 \u2248 6.8. Turning a liquid to a gas requires separating molecules completely; melting a solid only requires letting them move. This is why vaporization plateaus are the longest feature of any heating curve.',
      example: { problem: 'How much more energy to boil 1 kg of water than to melt it?', steps: ['Melt: 334 kJ', 'Boil: 2260 kJ', 'Ratio: 2260/334 = 6.77', 'Boiling takes 6.77\u00D7 more energy'], answer: 6.77, unit: 'x' }
    },
    { id: 'evap-cool', name: 'Evaporative Cooling', symbol: 'Sweat, A/C',
      formula: 'Q_removed = mL_v', unit: 'kJ', cat: 'latent',
      desc: 'When a liquid evaporates, it absorbs L_v joules per kilogram from its surroundings. This is the physics of sweating, earthenware water coolers, swamp coolers, and every vapor-compression refrigeration system.',
      example: { problem: 'Evaporating 50 g of sweat cools you by how much?', steps: ['Q = 0.05 \u00D7 2260 = 113 kJ', 'Assuming 70 kg person, c \u2248 3500 J/(kg\u00B7K)', '\u0394T = 113000/(70\u00D73500) = 0.46 \u00B0C'], answer: 0.46, unit: '\u00B0C' }
    },
    { id: 'calorimetry', name: 'Measuring L in the Lab', symbol: 'Calorimetry',
      formula: 'L = Pt / m', unit: 'kJ/kg', cat: 'latent',
      desc: 'To measure a latent heat you supply a known electrical power P to a sample and time how long the temperature holds steady on the plateau. All that energy went into the phase change, so L = Pt/m. Set the heater power in the simulator and each plateau reports its own duration, which is exactly the quantity you would time with a stopwatch.',
      example: { problem: 'A 500 W heater holds 0.2 kg of ice at 0 \u00B0C for 134 s. Find L_f.', steps: ['Q = Pt = 500 \u00D7 134 = 67 000 J', 'L_f = Q/m = 67 000 / 0.2', 'L_f = 335 000 J/kg = 335 kJ/kg'], answer: 335, unit: 'kJ/kg' }
    },
    { id: 'curve', name: 'The Heating Curve', symbol: 'T vs Q',
      formula: 'Slope = 1/(mc), plateau = mL', unit: '\u2014', cat: 'curve',
      desc: 'A plot of temperature versus heat added forms a characteristic 5-segment curve: solid heating (slope = 1/(m\u00B7c_s)), melting plateau (flat at T_m), liquid heating, boiling plateau (flat at T_b), and gas heating. Plateau lengths scale with m\u00B7L.',
      example: { problem: 'Why is the boiling plateau longer than the melting plateau for water?', steps: ['Melt plateau length \u221D mL_f = 334m kJ', 'Boil plateau length \u221D mL_v = 2260m kJ', 'Ratio = 2260/334 = 6.77', 'Boil plateau is 6.77\u00D7 longer'], answer: 6.77, unit: 'x' }
    },
    { id: 'cooling', name: 'The Cooling Curve', symbol: 'Heat removed',
      formula: 'Same plateaus, energy out', unit: '\u2014', cat: 'curve',
      desc: 'Run the process backwards and you get the cooling curve. The plateaus sit at exactly the same temperatures, and the energy is identical \u2014 but now it is released to the surroundings rather than absorbed. Switch the simulator to Cool to watch steam condense and water freeze, with the latent heat flowing out.',
      example: { problem: 'Energy released freezing 2 kg of water at 0 \u00B0C?', steps: ['Freezing releases the fusion energy', 'Q = mL_f = 2 \u00D7 334', 'Q = 668 kJ released'], answer: 668, unit: 'kJ' }
    },
    { id: 'slopes', name: 'Slope Differences', symbol: '1/(mc)',
      formula: 'dT/dQ = 1/(mc)', unit: 'K/kJ', cat: 'curve',
      desc: 'The slope of each sloped region is 1/(m\u00B7c). Ice (c=2090) has slope 1/(m\u00B72090); liquid water (c=4186) has slope 1/(m\u00B74186), which is half as steep. Per joule of heat, ice warms about twice as fast as liquid water.',
      example: { problem: 'Slopes for 1 kg of water in each phase.', steps: ['Ice: 1/2090 = 4.78\u00D710\u207B\u2074 K/J', 'Water: 1/4186 = 2.39\u00D710\u207B\u2074 K/J', 'Steam: 1/2010 = 4.98\u00D710\u207B\u2074 K/J', 'Steam slope \u2248 ice slope'], answer: 4.78, unit: '\u00D710\u207B\u2074 K/J' }
    },
    { id: 'total-e', name: 'Total Energy', symbol: '\u03A3 Q',
      formula: 'Q = \u03A3 (mc\u0394T) + \u03A3 (mL)', unit: 'kJ', cat: 'curve',
      desc: 'To heat across multiple phases, add all five contributions: sensible solid heat, latent fusion, sensible liquid heat, latent vaporization, sensible gas heat.',
      example: { problem: 'Energy to heat 1 kg ice at \u221220 \u00B0C to steam at 120 \u00B0C.', steps: ['Q\u2081 = 1 \u00D7 2090 \u00D7 20 = 41.8 kJ', 'Q\u2082 = 1 \u00D7 334 = 334 kJ (melt)', 'Q\u2083 = 1 \u00D7 4186 \u00D7 100 = 418.6 kJ', 'Q\u2084 = 1 \u00D7 2260 = 2260 kJ (boil)', 'Q\u2085 = 1 \u00D7 2010 \u00D7 20 = 40.2 kJ', 'Total \u2248 3094.6 kJ'], answer: 3095, unit: 'kJ' }
    },
    { id: 'reading', name: 'Reading the Plateau', symbol: 'Length \u221D mL',
      formula: 'Q_plateau = mL', unit: 'kJ', cat: 'curve',
      desc: 'If you only have the graph, you can read L directly: measure the horizontal length of the plateau (in kJ) and divide by mass. If 1 kg melts over a 334 kJ-long plateau, L_f = 334 kJ/kg.',
      example: { problem: '0.4 kg substance melts over a 140 kJ plateau. Find L_f.', steps: ['L_f = Q_plateau / m', 'L_f = 140/0.4', 'L_f = 350 kJ/kg'], answer: 350, unit: 'kJ/kg' }
    },
    { id: 'pressure', name: 'Pressure & Boiling Point', symbol: 'T_b(P)',
      formula: 'ln(P\u2082/P\u2081) = \u2212(L_v M/R)(1/T\u2082 \u2212 1/T\u2081)', unit: '\u00B0C', cat: 'curve',
      desc: 'Boiling happens when the liquid\u2019s vapour pressure equals the surrounding pressure, so lowering the pressure lowers the boiling point. The Clausius\u2013Clapeyron relation quantifies it. Water boils at 100 \u00B0C at sea level, about 71 \u00B0C on Everest, and 120 \u00B0C in a 2 bar pressure cooker \u2014 which is why food cooks faster under pressure and slower at altitude.',
      example: { problem: 'Boiling point of water in a 2 bar pressure cooker?', steps: ['T\u2081 = 373.15 K, P\u2081 = 1.013 bar, L_v M = 40 714 J/mol', '1/T\u2082 = 1/373.15 \u2212 (8.314/40714) ln(2/1.013)', '1/T\u2082 = 0.0025410', 'T\u2082 = 393.5 K = 120.4 \u00B0C'], answer: 120.4, unit: '\u00B0C' }
    },
    { id: 'refrig', name: 'Refrigeration Cycle', symbol: 'Evap + Cond',
      formula: 'COP \u221D L_v', unit: '\u2014', cat: 'applications',
      desc: 'Refrigerators and air conditioners run a working fluid (R-134a, ammonia, CO\u2082) through a cycle: it evaporates inside a cold coil, absorbing L_v from the refrigerated space, and condenses in a hot coil outside, releasing L_v. The compressor exists to set the pressure on each side, which sets the boiling temperature on each side.',
      example: { problem: '2 kg/hr of R-134a (L_v \u2248 195 kJ/kg) evaporating cools at what rate?', steps: ['Q = mL_v per hour', 'Q = 2 \u00D7 195 = 390 kJ/hr', 'P = 390000/3600 = 108 W'], answer: 108, unit: 'W' }
    },
    { id: 'weather', name: 'Latent Heat in Weather', symbol: 'Hurricanes',
      formula: 'L_v drives storms', unit: 'TJ', cat: 'applications',
      desc: 'Hurricanes are enormous latent-heat engines. Warm ocean water evaporates, carrying L_v with it. When water vapor condenses as rain at altitude, it releases L_v into the atmosphere, heating and accelerating the air. This is why hurricanes weaken over cold water or land.',
      example: { problem: 'Energy released condensing 1 billion kg of water (small hurricane).', steps: ['Q = mL_v', 'Q = 10\u2079 \u00D7 2260', 'Q = 2.26 \u00D7 10\u00B9\u00B2 kJ = 2260 TJ', '\u2248 540 kilotons of TNT'], answer: 2260, unit: 'TJ' }
    },
    { id: 'casting', name: 'Metal Casting', symbol: 'Foundries',
      formula: 'Q = m(c_s\u0394T + L_f + c_l\u0394T)', unit: 'MJ', cat: 'applications',
      desc: 'Foundries melt metals to cast them into molds. The total energy to bring iron from room temperature to pouring temperature (\u22481600 \u00B0C) is dominated by the sensible heating; the melting latent heat adds a fixed extra chunk. On solidification that same L_f must be pulled back out through the mould.',
      example: { problem: 'Energy to melt 100 kg of iron starting at 25 \u00B0C, to 1600 \u00B0C.', steps: ['Solid heat: 100 \u00D7 449 \u00D7 (1538\u221225) = 67.9 MJ', 'Fusion: 100 \u00D7 247 = 24.7 MJ', 'Liquid heat: 100 \u00D7 820 \u00D7 62 = 5.1 MJ', 'Total: 97.7 MJ'], answer: 97.7, unit: 'MJ' }
    },
    { id: 'freezedry', name: 'Freeze-Drying', symbol: 'Lyophilisation',
      formula: 'P < P_triple \u2192 sublimation', unit: 'mbar', cat: 'applications',
      desc: 'Freeze-drying removes water from food, vaccines and biological samples without ever letting it turn liquid. The product is frozen, then the chamber is pumped down below water\u2019s triple-point pressure of 6.117 mbar, so the ice sublimes straight to vapour and is condensed on a cold trap. No liquid means no cell damage and no dissolved-solute migration.',
      example: { problem: 'What chamber pressure is needed to sublime ice?', steps: ['Water triple point = 6.117 mbar', 'Chamber must sit below that', 'Typical setpoint 0.5\u20132 mbar', 'At 1 mbar ice sublimes near \u221220 \u00B0C'], answer: 6.117, unit: 'mbar' }
    },
    { id: 'pcm', name: 'Phase-Change Materials', symbol: 'PCM',
      formula: 'Thermal storage', unit: 'kJ/kg', cat: 'applications',
      desc: 'PCMs (paraffins, salt hydrates) are designed to melt/freeze near room temperature. Embedded in walls or ceilings they buffer indoor temperature: melting absorbs heat during the day, freezing releases it at night. Much denser storage than sensible heat alone.',
      example: { problem: 'A wall PCM (L_f = 200 kJ/kg) stores how much energy per square metre at 10 kg/m\u00B2?', steps: ['Q = 10 \u00D7 200 = 2000 kJ/m\u00B2', 'Equivalent to \u22480.56 kWh per m\u00B2'], answer: 2000, unit: 'kJ/m\u00B2' }
    }
  ];

  /* ================================================================
     PROBLEM GENERATORS
     ================================================================ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function randFloat(a, b, d) { var v = a + Math.random() * (b - a); return +v.toFixed(d || 1); }
  function pickMat(filter) {
    var pool = filter ? BUILTIN_MATERIALS.filter(filter) : BUILTIN_MATERIALS;
    if (!pool.length) pool = BUILTIN_MATERIALS;
    return pool[randInt(0, pool.length - 1)];
  }
  // Materials that genuinely melt and boil at 1 atm (excludes CO2, which sublimes).
  function meltBoilAt1atm(M) { return M.Ptp < P_ATM; }

  var PROBLEM_GEN = [
    function () {
      var mat = pickMat(meltBoilAt1atm); var m = randFloat(0.5, 5, 1);
      var Q = +(m * mat.Lf).toFixed(1);
      return { prompt: 'Energy to melt ' + m + ' kg of ' + mat.name + ' at its melting point (L_f = ' + mat.Lf + ' kJ/kg)?',
        steps: ['Q = mL_f', 'Q = ' + m + ' \u00D7 ' + mat.Lf, 'Q = ' + Q + ' kJ'], answer: Q, unit: 'kJ', tol: 0.5 };
    },
    function () {
      var mat = pickMat(meltBoilAt1atm); var m = randFloat(0.5, 3, 1);
      var Q = +(m * mat.Lv).toFixed(1);
      return { prompt: 'Energy to fully vaporize ' + m + ' kg of ' + mat.name + ' at its boiling point (L_v = ' + mat.Lv + ' kJ/kg)?',
        steps: ['Q = mL_v', 'Q = ' + m + ' \u00D7 ' + mat.Lv, 'Q = ' + Q + ' kJ'], answer: Q, unit: 'kJ', tol: 0.5 };
    },
    function () {
      var m = randFloat(0.5, 3, 1); var Ti = -randInt(5, 30); var Tf = randInt(10, 50);
      var Q1 = m * 2090 * (0 - Ti) / 1000;
      var Q2 = m * 334;
      var Q3 = m * 4186 * (Tf - 0) / 1000;
      var Q = +(Q1 + Q2 + Q3).toFixed(1);
      return { prompt: 'Heat ' + m + ' kg of ice at ' + Ti + ' \u00B0C to water at ' + Tf + ' \u00B0C. Total energy (kJ)?',
        steps: ['Q\u2081 solid heat = ' + Q1.toFixed(1) + ' kJ', 'Q\u2082 melt = ' + Q2.toFixed(1) + ' kJ', 'Q\u2083 liquid heat = ' + Q3.toFixed(1) + ' kJ', 'Total = ' + Q + ' kJ'], answer: Q, unit: 'kJ', tol: 2 };
    },
    function () {
      // L_f from a plateau, kept inside the physically realistic 10–500 kJ/kg band.
      var m = randFloat(0.2, 2, 1);
      var Lf = randInt(20, 400);
      var Q = +(Lf * m).toFixed(1);
      return { prompt: Q + ' kJ fully melts ' + m + ' kg of a substance with no temperature change. Find L_f (kJ/kg).',
        steps: ['L_f = Q/m', 'L_f = ' + Q + '/' + m, 'L_f = ' + Lf + ' kJ/kg'], answer: Lf, unit: 'kJ/kg', tol: 2 };
    },
    function () {
      var mat = pickMat(meltBoilAt1atm); var m = randFloat(0.5, 2, 1); var t = randInt(3, 20);
      var Q = m * mat.Lv; var P = +(Q * 1000 / (t * 60)).toFixed(0);
      return { prompt: 'Vaporize ' + m + ' kg of ' + mat.name + ' (L_v = ' + mat.Lv + ' kJ/kg) in ' + t + ' min. Required power (W)?',
        steps: ['Q = mL_v = ' + (m * mat.Lv).toFixed(1) + ' kJ', 'P = Q/t = ' + (m * mat.Lv).toFixed(1) + '\u00D71000 / (' + t + '\u00D760)', 'P = ' + P + ' W'], answer: P, unit: 'W', tol: 2 };
    },
    function () {
      var m = randFloat(0.2, 2, 1);
      var Q = +(m * 2090 * 20 / 1000 + m * 334 + m * 4186 * 100 / 1000 + m * 2260 + m * 2010 * 20 / 1000).toFixed(1);
      return { prompt: m + ' kg of ice at \u221220 \u00B0C to steam at 120 \u00B0C. Total energy (kJ)?',
        steps: ['Solid warm: ' + (m * 2090 * 20 / 1000).toFixed(1) + ' kJ', 'Fusion: ' + (m * 334).toFixed(1) + ' kJ', 'Liquid warm: ' + (m * 4186 * 100 / 1000).toFixed(1) + ' kJ', 'Vaporize: ' + (m * 2260).toFixed(1) + ' kJ', 'Gas warm: ' + (m * 2010 * 20 / 1000).toFixed(1) + ' kJ', 'Total: ' + Q + ' kJ'], answer: Q, unit: 'kJ', tol: 5 };
    },
    function () {
      var m = randFloat(0.02, 0.2, 2); var Lv = randInt(800, 2400);
      var dT_body = +((m * Lv) / (70 * 3.5)).toFixed(2);
      return { prompt: 'Evaporating ' + m + ' kg of a fluid with L_v = ' + Lv + ' kJ/kg cools a 70 kg body (c \u2248 3500 J/(kg\u00B7K)) by how much?',
        steps: ['Q = mL_v = ' + (m * Lv).toFixed(1) + ' kJ', '\u0394T = Q/(mc) = ' + (m * Lv).toFixed(1) + '\u00D71000 / (70 \u00D7 3500)', '\u0394T = ' + dT_body + ' \u00B0C'], answer: dT_body, unit: '\u00B0C', tol: 0.05 };
    },
    function () {
      // Heat across the melting point only — restricted to materials with a
      // liquid range wider than the 100 °C span, so no boiling is hidden.
      var mat = pickMat(function (M) { return meltBoilAt1atm(M) && (M.Tb - M.Tm) > 110; });
      var m = randFloat(1, 5, 1);
      var Q_total = +(m * (mat.cS * 50 / 1000 + mat.Lf + mat.cL * 50 / 1000)).toFixed(1);
      return { prompt: m + ' kg of ' + mat.name + ' is heated from 50 \u00B0C below T_m (' + mat.Tm + ' \u00B0C) to 50 \u00B0C above it. Total energy (kJ)?',
        steps: ['Solid: m\u00B7c_s\u00B7\u0394T = ' + (m * mat.cS * 50 / 1000).toFixed(1) + ' kJ', 'Melt: m\u00B7L_f = ' + (m * mat.Lf).toFixed(1) + ' kJ', 'Liquid: m\u00B7c_l\u00B7\u0394T = ' + (m * mat.cL * 50 / 1000).toFixed(1) + ' kJ', 'Total = ' + Q_total + ' kJ'], answer: Q_total, unit: 'kJ', tol: 3 };
    },
    function () {
      var m = randFloat(0.5, 3, 1);
      var Q_melt = m * 334;
      return { prompt: 'To turn ' + m + ' kg of ice at 0 \u00B0C into water at 0 \u00B0C (no temp change), how much heat (kJ)?',
        steps: ['Pure phase change: Q = mL_f', 'Q = ' + m + ' \u00D7 334', 'Q = ' + Q_melt.toFixed(1) + ' kJ'], answer: +Q_melt.toFixed(1), unit: 'kJ', tol: 1 };
    },
    function () {
      var m = randFloat(1, 5, 1); var Ti = randInt(20, 90);
      var Q_1 = m * 4186 * (100 - Ti) / 1000; var Q_2 = m * 2260;
      var Q = +(Q_1 + Q_2).toFixed(1);
      return { prompt: m + ' kg of water at ' + Ti + ' \u00B0C is boiled into steam at 100 \u00B0C. Total energy (kJ)?',
        steps: ['Heat to boil: ' + Q_1.toFixed(1) + ' kJ', 'Vaporize: ' + Q_2.toFixed(1) + ' kJ', 'Total = ' + Q + ' kJ'], answer: Q, unit: 'kJ', tol: 3 };
    },
    function () {
      // Calorimetry: read L from heater power and plateau duration.
      var m = randFloat(0.1, 0.5, 2);
      var P = randInt(200, 900);
      var Lf = randInt(150, 400);
      var t = Math.round(m * Lf * 1000 / P);
      return { prompt: 'A ' + P + ' W heater holds ' + m + ' kg of a solid at its melting point for ' + t + ' s before it is fully melted. Find L_f (kJ/kg).',
        steps: ['Q = Pt = ' + P + ' \u00D7 ' + t + ' = ' + (P * t / 1000).toFixed(1) + ' kJ', 'L_f = Q/m = ' + (P * t / 1000).toFixed(1) + ' / ' + m, 'L_f \u2248 ' + Lf + ' kJ/kg'], answer: Lf, unit: 'kJ/kg', tol: Math.max(3, Lf * 0.02) };
    },
    function () {
      // Plateau duration from power — the classic lab question.
      var mat = pickMat(meltBoilAt1atm);
      var m = randFloat(0.2, 2, 1);
      var P = randInt(500, 3000);
      var t = +(m * mat.Lv * 1000 / P).toFixed(0);
      return { prompt: 'A ' + P + ' W heater boils ' + m + ' kg of ' + mat.name + ' (L_v = ' + mat.Lv + ' kJ/kg) that is already at its boiling point. How long does the boiling plateau last (s)?',
        steps: ['Q = mL_v = ' + (m * mat.Lv).toFixed(1) + ' kJ', 't = Q/P = ' + (m * mat.Lv).toFixed(1) + '\u00D71000 / ' + P, 't \u2248 ' + t + ' s'], answer: t, unit: 's', tol: Math.max(2, t * 0.02) };
    },
    function () {
      // Cooling / released energy.
      var m = randFloat(0.5, 4, 1); var Ti = randInt(20, 90);
      var Q1 = m * 4186 * Ti / 1000, Q2 = m * 334;
      var Q = +(Q1 + Q2).toFixed(1);
      return { prompt: m + ' kg of water at ' + Ti + ' \u00B0C is cooled and completely frozen to ice at 0 \u00B0C. How much energy must be REMOVED (kJ)?',
        steps: ['Cool to 0 \u00B0C: mc\u0394T = ' + Q1.toFixed(1) + ' kJ', 'Freeze: mL_f = ' + Q2.toFixed(1) + ' kJ', 'Total removed = ' + Q + ' kJ'], answer: Q, unit: 'kJ', tol: 3 };
    },
    function () {
      // Boiling point from pressure — Clausius–Clapeyron.
      var P = [0.5, 0.7, 2, 3, 5][randInt(0, 4)];
      var Tb = ccTemp(100, P_ATM, P, 2260, 18.015);
      return { prompt: 'Water is boiled at ' + P + ' bar. Estimate the boiling point (\u00B0C) using Clausius\u2013Clapeyron with L_v = 2260 kJ/kg, M = 18.0 g/mol.',
        steps: ['L_v\u00B7M = 2260\u00D710\u00B3 \u00D7 0.018015 = 40 714 J/mol',
                '1/T\u2082 = 1/373.15 \u2212 (8.314/40714) \u00D7 ln(' + P + '/1.013)',
                'T\u2082 = ' + (Tb + 273.15).toFixed(1) + ' K',
                'T\u2082 = ' + Tb.toFixed(1) + ' \u00B0C'], answer: +Tb.toFixed(1), unit: '\u00B0C', tol: 2.5 };
    }
  ];

  /* ================================================================
     QUIZ POOL
     ================================================================ */
  var QUIZ_POOL = [
    { q: 'Heat is supplied steadily to melting ice. Which quantity does NOT change?', opts: ['Internal energy', 'Entropy', 'Temperature', 'Liquid fraction'], correct: 2 },
    { q: 'Latent heat of fusion for water?', opts: ['334 kJ/kg', '2260 kJ/kg', '4186 J/(kg\u00B7K)', '100 kJ/kg'], correct: 0 },
    { q: 'Latent heat of vaporization for water?', opts: ['334 kJ/kg', '2260 kJ/kg', '855 kJ/kg', '1500 kJ/kg'], correct: 1 },
    { q: 'Why is L_v always larger than L_f?', opts: ['Gases are heavier', 'Breaking bonds fully takes more energy than loosening them', 'Boiling point is higher', 'Pure chance'], correct: 1 },
    { q: 'Evaporation cools the surroundings because\u2026', opts: ['It releases light', 'It absorbs L_v from the surroundings', 'It compresses air', 'It reflects radiation'], correct: 1 },
    { q: 'Which is the correct equation for latent heat?', opts: ['Q = mc\u0394T', 'Q = mL', 'Q = mv\u00B2', 'Q = nRT'], correct: 1 },
    { q: 'Sublimation is the transition from\u2026', opts: ['Liquid to gas', 'Solid to liquid', 'Solid to gas', 'Gas to liquid'], correct: 2 },
    { q: 'On a heating curve, the plateaus occur at\u2026', opts: ['Any temperature', 'Only at 0 and 100\u00B0C', 'The melting and boiling points', 'Absolute zero'], correct: 2 },
    { q: 'If L_f = 80 kJ/kg and m = 2 kg, Q to melt fully?', opts: ['40 kJ', '80 kJ', '160 kJ', '320 kJ'], correct: 2 },
    { q: 'Steam burns are worse than water burns because steam releases\u2026', opts: ['Toxic fumes', 'L_v when it condenses', 'More radiation', 'More force'], correct: 1 },
    { q: 'Mercury has a very low L_f (11 kJ/kg). This means\u2026', opts: ['It never freezes', 'Little energy is needed to melt it once at T_m', 'It has no phase change', 'It is always solid'], correct: 1 },
    { q: 'During melting, molecules\u2026', opts: ['Gain kinetic energy', 'Gain potential energy (break bonds)', 'Lose energy', 'Stop moving'], correct: 1 },
    { q: 'PCM (phase-change material) buildings use L_f to\u2026', opts: ['Conduct electricity', 'Buffer temperature swings', 'Generate power', 'Purify water'], correct: 1 },
    { q: 'The longest plateau on water\u2019s heating curve is\u2026', opts: ['Melting', 'Solid heating', 'Vaporization', 'Gas heating'], correct: 2 },
    { q: 'Why does a hurricane lose power over land?', opts: ['Friction', 'No ocean evaporation \u2192 no latent heat supply', 'Gravity', 'Magnetism'], correct: 1 },
    { q: 'Water boils at 71 \u00B0C on top of Everest because\u2026', opts: ['The air is colder', 'Atmospheric pressure is much lower', 'Gravity is weaker', 'The water is purer'], correct: 1 },
    { q: 'A pressure cooker at 2 bar cooks faster because\u2026', opts: ['Steam is hotter than the water', 'Water boils at about 120 \u00B0C instead of 100 \u00B0C', 'L_v becomes zero', 'Pressure adds chemical energy'], correct: 1 },
    { q: 'Dry ice sublimes at 1 atm instead of melting because\u2026', opts: ['CO\u2082 has no liquid phase at all', 'Its triple-point pressure (5.18 bar) is above atmospheric', 'It is too cold to melt', 'CO\u2082 has no latent heat'], correct: 1 },
    { q: 'At the triple point of a substance\u2026', opts: ['Only solid and gas exist', 'Solid, liquid and gas coexist in equilibrium', 'The substance becomes a plasma', 'Latent heat is zero'], correct: 1 },
    { q: 'Freezing 1 kg of water at 0 \u00B0C\u2026', opts: ['Absorbs 334 kJ', 'Releases 334 kJ', 'Neither absorbs nor releases heat', 'Releases 2260 kJ'], correct: 1 },
    { q: 'A 500 W heater holds 0.2 kg of a solid on its melting plateau for 100 s. L_f is\u2026', opts: ['100 kJ/kg', '250 kJ/kg', '500 kJ/kg', '50 kJ/kg'], correct: 1 },
    { q: 'Freeze-drying works by\u2026', opts: ['Boiling water off under high pressure', 'Pumping below the triple point so ice sublimes', 'Freezing and then melting slowly', 'Adding salt to lower the freezing point'], correct: 1 }
  ];

  /* ================================================================
     UNIT SYSTEM
     ================================================================ */
  var unitSystem = 'si';
  function U() {
    if (unitSystem === 'imp') return {
      sys: 'imp',
      tempLabel: '\u00B0F', dTempLabel: '\u00B0F', heatLabel: 'BTU', massLabel: 'lb',
      cLabel: 'BTU/(lb\u00B7\u00B0F)', LLabel: 'BTU/lb', pressLabel: 'psi', powerLabel: 'BTU/h',
      fromTempC: function (c) { return c * 1.8 + 32; },
      toTempC:   function (f) { return (f - 32) / 1.8; },
      fromDTempC:function (d) { return d * 1.8; },
      fromHeatKJ: function (kJ) { return kJ * 0.947817; },
      toHeatKJ:   function (v) { return v / 0.947817; },
      fromMassKg: function (kg) { return kg * 2.20462; },
      toMassKg:   function (v) { return v / 2.20462; },
      fromCSI:    function (c) { return c * 2.388459e-4; },
      fromLSI:    function (L) { return L * 0.429923; },
      fromPbar:   function (b) { return b * 14.503774; },
      toPbar:     function (v) { return v / 14.503774; },
      fromPowerW: function (w) { return w * 3.412142; },
      toPowerW:   function (v) { return v / 3.412142; },
      heatStep: 10, massStep: 0.2, tempStep: 5,
      hDigits: 0, mDigits: 2, tDigits: 1, dtDigits: 1, cDigits: 3, lDigits: 1, pDigits: 2, wDigits: 0
    };
    return {
      sys: 'si',
      tempLabel: '\u00B0C', dTempLabel: '\u00B0C', heatLabel: 'kJ', massLabel: 'kg',
      cLabel: 'J/(kg\u00B7K)', LLabel: 'kJ/kg', pressLabel: 'bar', powerLabel: 'W',
      fromTempC: function (c) { return c; },
      toTempC:   function (f) { return f; },
      fromDTempC:function (d) { return d; },
      fromHeatKJ: function (kJ) { return kJ; },
      toHeatKJ:   function (v) { return v; },
      fromMassKg: function (kg) { return kg; },
      toMassKg:   function (v) { return v; },
      fromCSI:    function (c) { return c; },
      fromLSI:    function (L) { return L; },
      fromPbar:   function (b) { return b; },
      toPbar:     function (v) { return v; },
      fromPowerW: function (w) { return w; },
      toPowerW:   function (v) { return v; },
      heatStep: 10, massStep: 0.1, tempStep: 5,
      hDigits: 1, mDigits: 1, tDigits: 1, dtDigits: 1, cDigits: 0, lDigits: 0, pDigits: 3, wDigits: 0
    };
  }
  function fmtHeat(kJ)  { var u = U(); return u.fromHeatKJ(kJ).toFixed(u.hDigits) + ' ' + u.heatLabel; }
  function fmtTemp(C)   { var u = U(); return u.fromTempC(C).toFixed(u.tDigits) + ' ' + u.tempLabel; }
  function fmtMass(kg)  { var u = U(); return u.fromMassKg(kg).toFixed(u.mDigits) + ' ' + u.massLabel; }
  function fmtL(L)      { var u = U(); return u.fromLSI(L).toFixed(u.lDigits) + ' ' + u.LLabel; }
  function fmtPress(b)  { var u = U(); return u.fromPbar(b).toFixed(u.pDigits) + ' ' + u.pressLabel; }
  function fmtPower(w)  {
    var u = U();
    if (u.sys === 'imp') return Math.round(u.fromPowerW(w)).toLocaleString() + ' BTU/h';
    return w >= 1000 ? (w / 1000).toFixed(2) + ' kW' : Math.round(w) + ' W';
  }
  function fmtTime(s) {
    if (!isFinite(s) || s < 0) return '\u2014';
    if (s < 90) return s.toFixed(s < 10 ? 1 : 0) + ' s';
    if (s < 3600) return Math.floor(s / 60) + ' m ' + Math.round(s % 60) + ' s';
    var h = Math.floor(s / 3600);
    return h + ' h ' + Math.round((s - h * 3600) / 60) + ' m';
  }

  /* ================================================================
     DOM REFS
     ================================================================ */
  var canvas = document.getElementById('sim-canvas');
  var ctx    = canvas.getContext('2d');
  var selMatA = document.getElementById('sel-mat-a');
  var selMatB = document.getElementById('sel-mat-b');
  var slHeat  = document.getElementById('sl-heat');
  var slMass  = document.getElementById('sl-mass');
  var slT0    = document.getElementById('sl-t0');
  var slPress = document.getElementById('sl-press');
  var slPower = document.getElementById('sl-power');
  var inHeat  = document.getElementById('in-heat');
  var inMass  = document.getElementById('in-mass');
  var inT0    = document.getElementById('in-t0');
  var inPress = document.getElementById('in-press');
  var inPower = document.getElementById('in-power');
  var badgeHeat = document.getElementById('badge-heat');
  var badgeMass = document.getElementById('badge-mass');
  var badgeT0   = document.getElementById('badge-t0');
  var badgePress = document.getElementById('badge-press');
  var badgePower = document.getElementById('badge-power');
  var pressNote = document.getElementById('press-note');
  var rTempA  = document.getElementById('r-temp-a');
  var rTempB  = document.getElementById('r-temp-b');
  var rPhaseA = document.getElementById('r-phase-a');
  var rPhaseB = document.getElementById('r-phase-b');
  var rHeat   = document.getElementById('r-heat');
  var rTime   = document.getElementById('r-time');
  var rTb     = document.getElementById('r-tb');
  var rUnitTa = document.getElementById('r-unit-ta');
  var rUnitTb = document.getElementById('r-unit-tb');
  var rUnitHeat = document.getElementById('r-unit-heat');
  var rUnitTbv  = document.getElementById('r-unit-tbv');
  var rLabelHeat = document.getElementById('r-label-heat');
  var rLabelTb   = document.getElementById('r-label-tb');
  var cardTempB  = document.getElementById('card-tempB');
  var cardPhaseB = document.getElementById('card-phaseB');
  var matBGroup  = document.getElementById('matB-group');

  var simPanel      = document.getElementById('sim-panel');
  var catRow        = document.getElementById('cat-row');
  var itemSelector  = document.getElementById('item-selector');
  var conceptGrid   = document.getElementById('concept-grid');
  var itemInfo      = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar   = document.getElementById('practice-bar');
  var ppPrompt      = document.getElementById('pp-prompt');
  var ppInput       = document.getElementById('pp-input');
  var ppUnit        = document.getElementById('pp-unit');
  var ppCheck       = document.getElementById('pp-check');
  var ppShow        = document.getElementById('pp-show');
  var ppNext        = document.getElementById('pp-next');
  var ppFeedback    = document.getElementById('pp-feedback');
  var ppSolution    = document.getElementById('pp-solution');
  var pbarScoreVal  = document.getElementById('pbar-score-val');
  var quizPanel     = document.getElementById('quiz-panel');
  var quizBar       = document.getElementById('quiz-bar');
  var qbarNum       = document.getElementById('qbar-num');
  var quizResult    = document.getElementById('quiz-result');
  var learnPanels   = document.getElementById('learn-panels');
  var canvasActionBar = document.getElementById('canvas-action-bar');

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var view = 'single';          // 'single' | 'compare'
  var direction = 1;            // +1 heating, -1 cooling
  var matAIdx = 0, matBIdx = 4;
  var heatInput = 3200;         // kJ transferred (added or removed)
  var mass = 1.0;               // kg
  var T0 = -20;                 // starting temperature °C
  var pressure = P_ATM;         // bar
  var power = 1500;             // W

  var showFlames = true, showParticles = true, showGraph = true, showEquation = true, showLabels = true;
  var keepTraces = false;
  var traces = [];
  var tracedThisRun = false;
  var hoverTrace = null;

  var SIM_DURATION_S = 12.0;
  var anim = { running: false, forceScale: 0, targetScale: 0, lastMs: 0, speed: 1.0 };
  var animId = null;
  var animTime = 0;
  var particlesA = [], particlesB = [];

  var W = 900, H = 580;
  var heatInputMax = 5000;

  var latentBanners = [];
  var prevPlateauA = null, prevPlateauB = null;

  /* ── Phase-transition audio (Web Audio API, no external files) ── */
  var _audioCtx = null;
  function _getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    return _audioCtx;
  }
  function playTransitionSound(kind) {
    var ac = _getAudioCtx(); if (!ac) return;
    if (ac.state === 'suspended') { ac.resume(); }
    var now = ac.currentTime;
    var osc = ac.createOscillator();
    var gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    // Absorbing transitions rise in pitch, releasing transitions fall.
    var absorbed = transOf(kind).dirWord === 'absorbed';
    var lo = kind === 'melt' || kind === 'freeze' ? 220 : 440;
    var hi = lo * 1.5;
    osc.type = kind === 'melt' || kind === 'freeze' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(absorbed ? lo : hi, now);
    osc.frequency.linearRampToValueAtTime(absorbed ? hi : lo, now + 0.32);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
    gain.gain.setValueAtTime(0.2, now + 0.26);
    gain.gain.linearRampToValueAtTime(0, now + 0.46);
    osc.start(now); osc.stop(now + 0.46);
  }

  var history = [], histIdx = -1, HIST_MAX = 50, pushTimer = null;

  var practiceScore = 0, practiceTotal = 0, currentProblem = null, practiceAnswered = false;
  var QUIZ_SIZE = 5, quizSet = [], quizIdx = 0, quizScore = 0, quizAnswered = false, quizAnswers = [];
  var exploreCat = 'basics', selectedConcept = null;

  var _exportFlag = false;

  /* ── Pressure slider mapping: logarithmic 0.001 → 20 bar ───────── */
  var P_MIN = 0.001, P_MAX = 20, P_TICKS = 1000;
  function sliderToP(v) { return P_MIN * Math.pow(P_MAX / P_MIN, v / P_TICKS); }
  function pToSlider(P) { return Math.round(P_TICKS * Math.log(P / P_MIN) / Math.log(P_MAX / P_MIN)); }

  /* ================================================================
     PHASE FRACTIONS — what the sample actually contains right now
     ================================================================ */
  function phaseFractions(st) {
    var f = { s: 0, l: 0, g: 0 };
    if (st.plateau) {
      var p = st.plateau.progress;
      switch (st.plateau.kind) {
        case 'melt':     f.s = 1 - p; f.l = p; break;
        case 'freeze':   f.l = 1 - p; f.s = p; break;
        case 'boil':     f.l = 1 - p; f.g = p; break;
        case 'condense': f.g = 1 - p; f.l = p; break;
        case 'sublime':  f.s = 1 - p; f.g = p; break;
        case 'deposit':  f.g = 1 - p; f.s = p; break;
      }
      return f;
    }
    f[st.phase] = 1;
    return f;
  }
  function phaseNameFromState(st) {
    if (st.plateau) return transOf(st.plateau.kind).label;
    if (st.phase === 's') return 'Solid';
    if (st.phase === 'l') return 'Liquid';
    return 'Gas';
  }

  /* ================================================================
     COLOUR HELPERS
     ================================================================ */
  function phaseColor(mat, phase, plateau) {
    if (plateau) {
      var f = phaseFractions({ phase: phase, plateau: plateau });
      // Blend the two phases actually present, weighted by their fractions.
      var cols = [];
      if (f.s > 0) cols.push([mat.colorS, f.s]);
      if (f.l > 0) cols.push([mat.colorL, f.l]);
      if (f.g > 0) cols.push([mat.colorG, f.g]);
      if (cols.length === 2) return blendHex(cols[0][0], cols[1][0], cols[1][1]);
      if (cols.length === 1) return cols[0][0];
    }
    if (phase === 's') return mat.colorS;
    if (phase === 'g') return mat.colorG;
    return mat.colorL;
  }
  function hexRgb(s) {
    if (s[0] !== '#') {
      var mm = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return mm ? [+mm[1], +mm[2], +mm[3]] : [204, 204, 204];
    }
    var h = parseInt(s.slice(1), 16);
    return [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  }
  function blendHex(a, b, t) {
    var A = hexRgb(a), B = hexRgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' +
                    Math.round(A[1] + (B[1] - A[1]) * t) + ',' +
                    Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function rgba(c, a) { var v = hexRgb(c); return 'rgba(' + v[0] + ',' + v[1] + ',' + v[2] + ',' + a + ')'; }
  function shade(c, k) {
    var v = hexRgb(c);
    function f(x) { return Math.max(0, Math.min(255, Math.round(k < 1 ? x * k : x + (255 - x) * (k - 1)))); }
    return 'rgb(' + f(v[0]) + ',' + f(v[1]) + ',' + f(v[2]) + ')';
  }

  /* ================================================================
     PARTICLES — three-phase visualisation
     ================================================================ */
  function initParticles(arr, cx, cy, w, h) {
    arr.length = 0;
    var cols = 6, rows = 6;
    var stepX = w / cols, stepY = h / rows;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var ax = cx - w / 2 + stepX * (c + 0.5);
        var ay = cy - h / 2 + stepY * (r + 0.5);
        arr.push({
          x: ax, y: ay, ax: ax, ay: ay,
          hx: ax, hy: ay,                       // home lattice site
          vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
          phX: Math.random() * Math.PI * 2, phY: Math.random() * Math.PI * 2,
          fX: 5 + Math.random() * 3, fY: 5 + Math.random() * 3,
          r: 2.4 + Math.random() * 0.7
        });
      }
    }
  }

  /* Particles live inside the *current* content box, which shrinks as liquid
     boils away, so they can never float above the visible surface.           */
  function updateParticles(arr, box, st, temp, mat) {
    var left = box.x, right = box.x + box.w, top = box.y, bottom = box.y + box.h;
    var fr = phaseFractions(st);
    var t = animTime;
    var gasFrac = fr.g;
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      var isGas = gasFrac > 0 && (i / arr.length) < gasFrac;
      if (isGas) {
        p.vy -= 0.05;
        p.vx += (Math.random() - 0.5) * 0.16;
        p.vx *= 0.94;
        p.vx = Math.max(-1.5, Math.min(1.5, p.vx));
        p.vy = Math.max(-3.2, Math.min(0, p.vy));
        p.ax += p.vx * 0.6; p.ay += p.vy * 0.9;
        var margin = 8;
        if (p.ax < left - margin)  { p.ax = left - margin;  p.vx = Math.abs(p.vx) * 0.4; }
        if (p.ax > right + margin) { p.ax = right + margin; p.vx = -Math.abs(p.vx) * 0.4; }
        if (p.ay < top - 130) {
          p.ax = left + Math.random() * (right - left);
          p.ay = top + 4 + Math.random() * 6;
          p.vx = (Math.random() - 0.5) * 0.8;
          p.vy = -Math.random() * 1.2 - 0.4;
        }
        p.x = p.ax; p.y = p.ay;
      } else if (fr.s >= fr.l && fr.s > 0) {
        // Locked lattice: vibrate about the home site, amplitude grows with T.
        p.phX += 0.06; p.phY += 0.07;
        var span = Math.max(1, (mat.Tm - (-273.15)));
        var amp = 1.0 + 2.0 * Math.max(0, Math.min(1, (temp + 273.15) / span));
        var hx = clamp(p.hx, left + p.r, right - p.r);
        var hy = clamp(p.hy, top + p.r, bottom - p.r);
        p.ax = hx; p.ay = hy;
        p.x = hx + Math.sin(p.phX * p.fX * 0.25) * amp;
        p.y = hy + Math.cos(p.phY * p.fY * 0.25) * amp;
      } else {
        // Free-flowing liquid.
        p.ax += p.vx * 0.6; p.ay += p.vy * 0.6;
        if (p.ax - p.r < left)   { p.ax = left   + p.r; p.vx =  Math.abs(p.vx); }
        if (p.ax + p.r > right)  { p.ax = right  - p.r; p.vx = -Math.abs(p.vx); }
        if (p.ay - p.r < top)    { p.ay = top    + p.r; p.vy =  Math.abs(p.vy); }
        if (p.ay + p.r > bottom) { p.ay = bottom - p.r; p.vy = -Math.abs(p.vy); }
        p.x = p.ax + Math.sin(t * 5 + p.phX) * 0.5;
        p.y = p.ay + Math.cos(t * 5.3 + p.phY) * 0.5;
      }
    }
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ================================================================
     CANVAS — HiDPI sizing
     Backing store is scaled by DPR; all drawing (and all hit-testing)
     happens in the logical W x H coordinate space.
     ================================================================ */
  function resizeCanvas() {
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    var rect = canvas.getBoundingClientRect();
    var cssW = rect.width || W;
    var cssH = cssW * (H / W);
    /* Deliberately do NOT pin canvas.style.height. The backing store is always
       written at the 900:580 ratio, and the stylesheet lays the element out as
       width:100%; height:auto — so the displayed box derives its height from
       that intrinsic ratio and stays correct even if a resize notification is
       missed (which happens when the tab is backgrounded). Pinning a pixel
       height instead leaves the canvas stretched until the next observation. */
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / W, canvas.height / H);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
  }

  /* ================================================================
     DRAW HELPERS — scene, apparatus, materials
     ================================================================ */
  function drawSceneBackground() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#131a29');
    g.addColorStop(0.55, '#0e1420');
    g.addColorStop(1, '#080b12');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Soft spotlight over the apparatus half of the bench.
    var spotX = view === 'single' ? 195 : 230;
    var r = ctx.createRadialGradient(spotX, 190, 20, spotX, 240, 330);
    r.addColorStop(0, 'rgba(90,150,190,0.11)');
    r.addColorStop(1, 'rgba(90,150,190,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, 420, H);
  }

  function drawBench(y, x0, x1) {
    var g = ctx.createLinearGradient(0, y, 0, y + 16);
    g.addColorStop(0, '#28303f');
    g.addColorStop(1, '#161b26');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x0, y, x1 - x0, 16, [3, 3, 5, 5]); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.09)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0 + 2, y + 0.5); ctx.lineTo(x1 - 2, y + 0.5); ctx.stroke();
  }

  function contactShadow(cx, y, w, alpha) {
    ctx.save();
    var g = ctx.createRadialGradient(cx, y, 1, cx, y, w * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,' + (alpha || 0.5) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, y, w * 0.62, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  /* Bunsen-style flame with a blue inner cone — the hottest part of a real
     flame — and a soft heat glow. Burns upward from (x, y); maxH caps the
     height so the tips lick the underside of the gauze instead of being drawn
     through the beaker. intensity 0..1.                                      */
  function drawFlame(x, y, w, intensity, maxH) {
    ctx.save();
    var glow = ctx.createRadialGradient(x, y - 14, 2, x, y - 14, w * 0.8);
    glow.addColorStop(0, 'rgba(255,150,40,' + (0.20 + intensity * 0.16) + ')');
    glow.addColorStop(0.55, 'rgba(255,90,10,' + (0.07 + intensity * 0.07) + ')');
    glow.addColorStop(1, 'rgba(255,90,10,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(x - w * 0.85, y - maxH - 12, w * 1.7, maxH + 24);

    var numFlames = 6, flameW = w / numFlames;
    for (var i = 0; i < numFlames; i++) {
      var fx = x - w / 2 + flameW * i + flameW / 2;
      var sway    = Math.sin(animTime * 2.4 + i * 0.8) * 2.5;
      var flicker = Math.sin(animTime * 12 + i * 1.7) * 2.2 + Math.sin(animTime * 19 + i * 2.3) * 1.1;
      var fh = maxH * (0.62 + intensity * 0.34) + flicker + Math.sin(animTime * 3 + i) * 2;
      fh = Math.max(8, Math.min(maxH, fh));
      var tipX = fx + sway + Math.sin(animTime * 8 + i * 2.1) * 1.5;
      var ctlL = fx - flameW * 0.55 - Math.sin(animTime * 3 + i) * 1.2;
      var ctlR = fx + flameW * 0.55 + Math.cos(animTime * 3 + i * 1.3) * 1.2;

      // Outer luminous envelope
      ctx.beginPath();
      ctx.moveTo(fx - flameW * 0.42, y);
      ctx.bezierCurveTo(ctlL, y - fh * 0.35, tipX - flameW * 0.12, y - fh * 0.8, tipX, y - fh);
      ctx.bezierCurveTo(tipX + flameW * 0.12, y - fh * 0.8, ctlR, y - fh * 0.35, fx + flameW * 0.42, y);
      var outer = ctx.createLinearGradient(fx, y, fx, y - fh);
      outer.addColorStop(0,   'rgba(255,' + Math.floor(70 + intensity * 40) + ',0,' + (0.9 + intensity * 0.08) + ')');
      outer.addColorStop(0.5, 'rgba(255,' + Math.floor(150 + intensity * 60) + ',20,' + (0.78 + intensity * 0.1) + ')');
      outer.addColorStop(1,   'rgba(255,205,60,' + (0.3 + intensity * 0.15) + ')');
      ctx.fillStyle = outer; ctx.fill();

      // Blue inner cone (unburnt gas / hottest region)
      var fh2 = fh * 0.5, tipX2 = fx + sway * 0.6;
      ctx.beginPath();
      ctx.moveTo(fx - flameW * 0.2, y);
      ctx.bezierCurveTo(fx - flameW * 0.24, y - fh2 * 0.45, tipX2 - flameW * 0.05, y - fh2 * 0.82, tipX2, y - fh2);
      ctx.bezierCurveTo(tipX2 + flameW * 0.05, y - fh2 * 0.82, fx + flameW * 0.24, y - fh2 * 0.45, fx + flameW * 0.2, y);
      var inner = ctx.createLinearGradient(fx, y, fx, y - fh2);
      inner.addColorStop(0, 'rgba(120,190,255,' + (0.72 + intensity * 0.2) + ')');
      inner.addColorStop(0.6, 'rgba(170,225,255,' + (0.5 + intensity * 0.2) + ')');
      inner.addColorStop(1, 'rgba(255,255,235,' + (0.35 + intensity * 0.2) + ')');
      ctx.fillStyle = inner; ctx.fill();
    }
    ctx.restore();
  }

  /* Brushed-steel gauze the beaker stands on, its tripod legs reaching the
     bench, and the burner barrel the flame issues from. gaugeY is the beaker's
     base; benchY is where the legs land.                                     */
  function drawBurnerRig(x, gauzeY, w, benchY) {
    ctx.save();
    // Legs first, so the gauze plate reads as sitting on top of them
    ctx.strokeStyle = '#616a77'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(x + s * (w / 2 - 10), gauzeY + 6);
      ctx.lineTo(x + s * (w / 2 + 2), benchY);
      ctx.stroke();
    });
    // Burner barrel, centred under the gauze
    var bw = 16, bTop = benchY - 26;
    var bg = ctx.createLinearGradient(x - bw / 2, 0, x + bw / 2, 0);
    bg.addColorStop(0, '#39404b'); bg.addColorStop(0.4, '#78828f'); bg.addColorStop(1, '#2c323b');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(x - bw / 2, bTop, bw, benchY - bTop, [2, 2, 0, 0]); ctx.fill();
    ctx.fillStyle = '#4a5460';
    ctx.beginPath(); ctx.roundRect(x - bw / 2 - 5, benchY - 7, bw + 10, 7, [2, 2, 0, 0]); ctx.fill();

    // Gauze / support plate
    var g = ctx.createLinearGradient(0, gauzeY, 0, gauzeY + 7);
    g.addColorStop(0, '#98a2b1'); g.addColorStop(0.5, '#5b6472'); g.addColorStop(1, '#3a414c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x - w / 2, gauzeY, w, 7, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.24)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - w / 2 + 2, gauzeY + 0.8); ctx.lineTo(x + w / 2 - 2, gauzeY + 0.8); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,24,32,0.55)'; ctx.lineWidth = 0.7;
    for (var i = 1; i < 11; i++) {
      var lx = x - w / 2 + (w * i / 11);
      ctx.beginPath(); ctx.moveTo(lx, gauzeY + 1); ctx.lineTo(lx, gauzeY + 6); ctx.stroke();
    }
    ctx.restore();
  }

  /* Cooling block used when the direction is Cool: a frosted chiller plate
     with cold vapour spilling downward instead of a flame.                  */
  function drawChiller(x, y, w, intensity, benchY) {
    ctx.save();
    // Stand, so the cold plate rests on the bench rather than floating
    ctx.strokeStyle = '#4d5a68'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    [-1, 1].forEach(function (s) {
      ctx.beginPath();
      ctx.moveTo(x + s * (w / 2 - 10), y + 14);
      ctx.lineTo(x + s * (w / 2 + 2), benchY);
      ctx.stroke();
    });
    var g = ctx.createLinearGradient(0, y, 0, y + 14);
    g.addColorStop(0, '#9fc7dd'); g.addColorStop(0.5, '#5f8095'); g.addColorStop(1, '#33475a');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y, w, 14, 4); ctx.fill();
    // Frost speckle
    ctx.fillStyle = 'rgba(230,248,255,0.75)';
    for (var i = 0; i < 26; i++) {
      var fx = x - w / 2 + 3 + ((i * 37) % (w - 6));
      var fy = y + 2 + ((i * 19) % 10);
      ctx.beginPath(); ctx.arc(fx, fy, 0.7 + (i % 3) * 0.3, 0, Math.PI * 2); ctx.fill();
    }
    // Cold fog sinking away from the plate
    for (var k = 0; k < 5; k++) {
      var t = animTime * 0.8 + k * 0.9;
      var sx = x + Math.sin(t + k) * w * 0.3;
      var fall = (t * 16 + k * 14) % 46;
      var a = Math.max(0, (0.3 - fall / 190)) * (0.5 + intensity * 0.5);
      var rr = 7 + fall / 5;
      var rg = ctx.createRadialGradient(sx, y + 16 + fall, 1, sx, y + 16 + fall, rr);
      rg.addColorStop(0, 'rgba(190,225,245,' + a + ')');
      rg.addColorStop(1, 'rgba(190,225,245,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(sx, y + 16 + fall, rr, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawThermometer(x, y, h, T, Tmin, Tmax, color) {
    ctx.save();
    var bulbR = 10, tubeW = 9, tubeH = h - bulbR * 2;
    var tubeTop = y, tubeBottom = y + tubeH;
    var range = Math.max(1, Tmax - Tmin);
    var fraction = clamp((T - Tmin) / range, 0, 1);
    var fillH = fraction * tubeH;

    // Glass tube
    var gg = ctx.createLinearGradient(x - tubeW / 2, 0, x + tubeW / 2, 0);
    gg.addColorStop(0, 'rgba(210,235,255,0.20)');
    gg.addColorStop(0.35, 'rgba(255,255,255,0.06)');
    gg.addColorStop(1, 'rgba(120,150,180,0.16)');
    ctx.fillStyle = '#10151f';
    ctx.beginPath(); ctx.roundRect(x - tubeW / 2, tubeTop, tubeW, tubeH + bulbR, [4, 4, 0, 0]); ctx.fill();
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.roundRect(x - tubeW / 2, tubeTop, tubeW, tubeH + bulbR, [4, 4, 0, 0]); ctx.fill();

    // Liquid column
    if (fillH > 0) {
      var cg = ctx.createLinearGradient(x - tubeW / 2, 0, x + tubeW / 2, 0);
      cg.addColorStop(0, shade(color, 0.7));
      cg.addColorStop(0.4, color);
      cg.addColorStop(1, shade(color, 0.6));
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.roundRect(x - tubeW / 2 + 2, tubeBottom - fillH, tubeW - 4, fillH + bulbR, [1.5, 1.5, 0, 0]); ctx.fill();
    }
    // Bulb
    var bg = ctx.createRadialGradient(x - 3, tubeBottom + bulbR - 3, 1, x, tubeBottom + bulbR, bulbR);
    bg.addColorStop(0, shade(color, 1.35));
    bg.addColorStop(1, shade(color, 0.75));
    ctx.beginPath(); ctx.arc(x, tubeBottom + bulbR, bulbR, 0, Math.PI * 2);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = 'rgba(200,225,245,0.35)'; ctx.lineWidth = 1; ctx.stroke();

    // Specular highlight down the glass
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.beginPath(); ctx.roundRect(x - tubeW / 2 + 1.4, tubeTop + 3, 1.8, tubeH - 8, 1); ctx.fill();

    // Ticks
    ctx.strokeStyle = 'rgba(190,208,230,0.5)'; ctx.lineWidth = 0.8;
    for (var i = 0; i <= 4; i++) {
      var my = tubeBottom - (tubeH * i / 4);
      var long = (i % 2 === 0);
      ctx.beginPath();
      ctx.moveTo(x + tubeW / 2 + 1.5, my);
      ctx.lineTo(x + tubeW / 2 + (long ? 7 : 4), my);
      ctx.stroke();
    }
    // Reading
    ctx.fillStyle = '#eef4ff'; ctx.font = 'bold 10px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(fmtTemp(T), x, tubeTop - 6);
    ctx.restore();
  }

  /* ── Glass beaker, drawn in two passes so the contents sit INSIDE ── */
  function beakerGeom(cx, cy, w, h) {
    return { x: cx - w / 2, y: cy - h / 2, w: w, h: h, cx: cx, cy: cy,
             inX: cx - w / 2 + 5, inY: cy - h / 2 + 6, inW: w - 10, inH: h - 12 };
  }
  function drawGlassBack(G) {
    ctx.save();
    // Rear wall tint — what you see through the front glass
    var g = ctx.createLinearGradient(G.x, 0, G.x + G.w, 0);
    g.addColorStop(0,   'rgba(150,190,225,0.16)');
    g.addColorStop(0.2, 'rgba(120,160,200,0.07)');
    g.addColorStop(0.8, 'rgba(120,160,200,0.07)');
    g.addColorStop(1,   'rgba(150,190,225,0.16)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.roundRect(G.x, G.y, G.w, G.h, [3, 3, 10, 10]); ctx.fill();
    // Inner floor shadow
    var f = ctx.createLinearGradient(0, G.y + G.h - 22, 0, G.y + G.h);
    f.addColorStop(0, 'rgba(0,0,0,0)');
    f.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = f;
    ctx.beginPath(); ctx.roundRect(G.x + 2, G.y + G.h - 24, G.w - 4, 22, [0, 0, 8, 8]); ctx.fill();
    ctx.restore();
  }
  function drawGlassFront(G) {
    ctx.save();
    // Body outline
    ctx.strokeStyle = 'rgba(190,222,248,0.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(G.x, G.y, G.w, G.h, [3, 3, 10, 10]); ctx.stroke();
    // Thin inner outline sells the wall thickness
    ctx.strokeStyle = 'rgba(140,180,215,0.28)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(G.x + 3.5, G.y + 2, G.w - 7, G.h - 6, [2, 2, 7, 7]); ctx.stroke();
    // Rim ellipse
    ctx.strokeStyle = 'rgba(215,240,255,0.75)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(G.cx, G.y + 2, G.w / 2, 5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(G.cx, G.y + 2, G.w / 2 - 4, 3.4, 0, 0, Math.PI * 2); ctx.stroke();
    // Pouring spout
    ctx.strokeStyle = 'rgba(205,235,255,0.6)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(G.x + G.w * 0.72, G.y + 1);
    ctx.quadraticCurveTo(G.x + G.w + 4, G.y - 2, G.x + G.w + 7, G.y + 6);
    ctx.stroke();
    // Specular bands
    var s1 = ctx.createLinearGradient(G.x + 8, 0, G.x + 20, 0);
    s1.addColorStop(0, 'rgba(255,255,255,0.02)');
    s1.addColorStop(0.5, 'rgba(255,255,255,0.26)');
    s1.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = s1;
    ctx.beginPath(); ctx.roundRect(G.x + 9, G.y + 10, 8, G.h - 30, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.beginPath(); ctx.roundRect(G.x + G.w - 14, G.y + 16, 4, G.h - 40, 2); ctx.fill();
    // Graduation marks
    ctx.strokeStyle = 'rgba(225,245,255,0.34)'; ctx.lineWidth = 1;
    ctx.font = '7px "Segoe UI", sans-serif'; ctx.fillStyle = 'rgba(225,245,255,0.40)';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (var i = 1; i <= 4; i++) {
      var gy = G.y + G.h - 10 - (G.h - 26) * i / 5;
      var len = (i % 2 === 0) ? 13 : 8;
      ctx.beginPath(); ctx.moveTo(G.x + G.w - 6 - len, gy); ctx.lineTo(G.x + G.w - 6, gy); ctx.stroke();
    }
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  /* Crystalline solid block — angular facets so a solid never looks like a
     tinted liquid. Occupies the given rect.                                 */
  function drawSolidBlock(x, y, w, h, color, seedPhase) {
    if (w <= 1 || h <= 1) return;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 3); ctx.clip();
    var g = ctx.createLinearGradient(x, y, x + w * 0.4, y + h);
    g.addColorStop(0, shade(color, 1.28));
    g.addColorStop(0.45, color);
    g.addColorStop(1, shade(color, 0.62));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    // Facet lines
    ctx.strokeStyle = 'rgba(255,255,255,0.24)'; ctx.lineWidth = 1;
    for (var i = -1; i < 5; i++) {
      var ox = x + (w / 3) * i + (seedPhase % 7);
      ctx.beginPath(); ctx.moveTo(ox, y + h); ctx.lineTo(ox + w * 0.55, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 1;
    for (var j = 1; j < 3; j++) {
      var oy = y + (h / 3) * j;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x + w, oy); ctx.stroke();
    }
    // Top-face highlight
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(x, y, w, Math.min(4, h * 0.16));
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.34)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 3); ctx.stroke();
  }

  /* Liquid with depth gradient, meniscus and a bright waterline. */
  function drawLiquid(x, topY, w, h, color, agitation) {
    if (h <= 1) return;
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, topY, w, h, [0, 0, 7, 7]); ctx.clip();
    var g = ctx.createLinearGradient(0, topY, 0, topY + h);
    g.addColorStop(0, rgba(color, 0.42));
    g.addColorStop(0.5, rgba(color, 0.58));
    g.addColorStop(1, rgba(shade(color, 0.6), 0.82));
    ctx.fillStyle = g; ctx.fillRect(x, topY, w, h);
    // Side darkening for roundness
    var sg = ctx.createLinearGradient(x, 0, x + w, 0);
    sg.addColorStop(0, 'rgba(0,0,0,0.22)');
    sg.addColorStop(0.25, 'rgba(0,0,0,0)');
    sg.addColorStop(0.75, 'rgba(0,0,0,0)');
    sg.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = sg; ctx.fillRect(x, topY, w, h);
    ctx.restore();

    // Surface wave + meniscus
    var amp = agitation * 3.2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, topY + 6);
    for (var i = 0; i <= w; i += 2) {
      var sy = topY + Math.sin(animTime * (2.6 + agitation * 3) + i * 0.055) * amp;
      ctx.lineTo(x + i, sy);
    }
    ctx.lineTo(x + w, topY + 6);
    ctx.closePath();
    var mg = ctx.createLinearGradient(0, topY - 3, 0, topY + 7);
    mg.addColorStop(0, rgba(shade(color, 1.4), 0.85));
    mg.addColorStop(1, rgba(color, 0.1));
    ctx.fillStyle = mg; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = rgba(shade(color, 1.5), 0.9); ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var k = 0; k <= w; k += 2) {
      var wy = topY + Math.sin(animTime * (2.6 + agitation * 3) + k * 0.055) * amp;
      if (k === 0) ctx.moveTo(x + k, wy); else ctx.lineTo(x + k, wy);
    }
    ctx.stroke();
    // Meniscus climbs the walls
    ctx.strokeStyle = rgba(shade(color, 1.5), 0.55); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, topY + 4); ctx.quadraticCurveTo(x + 1, topY, x + 6, topY - 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w, topY + 4); ctx.quadraticCurveTo(x + w - 1, topY, x + w - 6, topY - 0.5); ctx.stroke();
    ctx.restore();
  }

  function drawVapourWisps(cx, topY, w, color, strength) {
    var n = 5;
    for (var i = 0; i < n; i++) {
      var t = animTime + i * 0.7;
      var sx = cx + Math.sin(t * 0.8 + i) * w * 0.28 + (i - n / 2) * w * 0.12;
      var rise = (t * 22 + i * 18) % 85;
      var sy = topY - 8 - rise;
      var alpha = Math.max(0, (0.42 - rise / 210)) * strength;
      var r = 8 + rise / 6;
      var grd = ctx.createRadialGradient(sx, sy, 1, sx, sy, r);
      grd.addColorStop(0, rgba(shade(color, 1.4), alpha));
      grd.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawBubbles(x, y, w, h, progress) {
    if (h <= 4) return;
    var n = Math.floor(4 + progress * 10);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    for (var i = 0; i < n; i++) {
      var t = animTime * 2 + i * 1.3;
      var bx = x + 6 + ((t * 40 + i * 60) % Math.max(1, w - 12));
      var rise = (t * 34 + i * 21) % 100;
      var by = y + h - 4 - rise * (h / 100);
      var rr = 1.2 + Math.sin(t) * 0.6 + rise / 60;
      ctx.strokeStyle = 'rgba(255,255,255,0.62)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(bx, by, Math.max(0.6, rr), 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fill();
    }
    ctx.restore();
  }

  /* Everything inside the glass, driven purely by the phase fractions so the
     drawing can never disagree with the computed state.                     */
  function drawContents(G, mat, st) {
    var fr = phaseFractions(st);
    var maxFill = G.inH * 0.78;
    var condensed = fr.s + fr.l;                       // fraction still in the beaker
    var totalH = maxFill * clamp(condensed, 0, 1);
    var baseY = G.inY + G.inH;
    var contentTop = baseY - totalH;

    // Default particle box: the whole occupied column.
    var box = { x: G.inX + 2, y: contentTop + 2, w: G.inW - 4, h: Math.max(6, totalH - 4) };

    if (totalH > 1.5) {
      var solidShare = condensed > 0 ? fr.s / condensed : 0;
      var solidH = totalH * solidShare;
      var liquidH = totalH - solidH;
      var agitation = st.plateau && st.plateau.kind === 'boil' ? 1 : (fr.l > 0.5 ? 0.35 : 0.12);

      if (solidH > 0 && liquidH > 0 && mat.floats) {
        /* Water is the density anomaly: its solid is less dense, so the ice
           floats with roughly 90 % of its bulk below the surface. The block
           straddles the waterline instead of being stacked on top of a
           full-height column, which would over-fill the beaker. */
        var sub = 0.9;
        drawLiquid(G.inX, contentTop, G.inW, totalH, mat.colorL, agitation);
        var iceTop = contentTop - solidH * (1 - sub);
        drawSolidBlock(G.inX + 5, iceTop, G.inW - 10, solidH, mat.colorS, 3);
        // Liquid molecules belong below the floating block, not inside it.
        var iceBot = iceTop + solidH;
        box = { x: G.inX + 2, y: iceBot + 2, w: G.inW - 4, h: Math.max(6, baseY - iceBot - 4) };
      } else if (solidH > 0 && liquidH > 0) {
        // Denser solid sinks: liquid on top, solid resting on the floor.
        drawLiquid(G.inX, contentTop, G.inW, totalH, mat.colorL, agitation);
        drawSolidBlock(G.inX + 3, baseY - solidH, G.inW - 6, solidH, mat.colorS, 5);
        box = { x: G.inX + 2, y: contentTop + 2, w: G.inW - 4, h: Math.max(6, liquidH - 4) };
      } else if (solidH > 0) {
        drawSolidBlock(G.inX + 3, baseY - solidH, G.inW - 6, solidH, mat.colorS, 5);
        box = { x: G.inX + 5, y: baseY - solidH + 3, w: G.inW - 10, h: Math.max(6, solidH - 6) };
      } else {
        drawLiquid(G.inX, contentTop, G.inW, totalH, mat.colorL, agitation);
      }

      if (st.plateau && st.plateau.kind === 'boil' && liquidH > 4) {
        drawBubbles(G.inX, baseY - liquidH, G.inW, liquidH, st.plateau.progress);
      }
    }

    if (fr.g > 0.02) drawVapourWisps(G.cx, G.y, G.w, mat.colorG, Math.min(1, fr.g * 1.4));
    // Never let the box escape the glass.
    box.y = Math.max(G.inY, box.y);
    box.h = Math.max(6, Math.min(box.h, baseY - box.y - 2));
    return box;
  }

  function drawPhaseBadge(cx, y, st) {
    var label, color;
    if (st.plateau) {
      var t = transOf(st.plateau.kind);
      label = t.label + '  ' + t.icon;
      color = t.color;
    } else {
      label = st.phase === 's' ? 'Solid' : st.phase === 'l' ? 'Liquid' : 'Gas';
      color = st.phase === 's' ? '#9fd8f5' : st.phase === 'l' ? '#4fc3f7' : '#ffb74d';
    }
    ctx.save();
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    var w = ctx.measureText(label).width + 16;
    ctx.fillStyle = 'rgba(10,14,24,0.9)';
    ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    ctx.shadowColor = rgba(color, 0.45); ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.roundRect(cx - w / 2, y, w, 19, 9.5); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, y + 10);
    ctx.restore();
  }

  function drawMaterialLabel(cx, y, mat, label, st) {
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = phaseColor(mat, st.phase, st.plateau);
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillText(label + ': ' + mat.name, cx, y);
    ctx.fillStyle = '#ffd54f'; ctx.font = 'bold 15px "JetBrains Mono","Courier New",monospace';
    ctx.fillText('T = ' + fmtTemp(st.T), cx, y + 17);
    ctx.restore();
  }

  /* ================================================================
     HEATING-CURVE GRAPH
     ================================================================ */
  function drawGraphPanel(gx, gy, gw, gh, matA, matB, qA, qB, curveA, curveB) {
    var u = U();
    ctx.save();
    var pg = ctx.createLinearGradient(0, gy, 0, gy + gh);
    pg.addColorStop(0, '#141b2b'); pg.addColorStop(1, '#0d121d');
    ctx.fillStyle = pg; ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, 8); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#9fb0cf'; ctx.font = 'bold 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(direction > 0 ? 'Heating Curve \u2014 Temperature vs Heat Added'
                               : 'Cooling Curve \u2014 Temperature vs Heat Removed', gx + gw / 2, gy + 15);

    var pad = 48;
    var axLeft = gx + pad, axRight = gx + gw - 14;
    var axTop = gy + 44, axBot = gy + gh - 34;
    var plotW = axRight - axLeft, plotH = axBot - axTop;

    /* ── axis ranges ── */
    var maxQ = Math.max(heatInput, 10);
    var curves = [curveA]; if (curveB) curves.push(curveB);
    for (var ti = 0; ti < traces.length; ti++) curves.push(traces[ti].curve);

    var minT = Infinity, maxT = -Infinity;
    curves.forEach(function (c) {
      for (var s = 0; s <= 40; s++) {
        var T = stateAt(c, maxQ * s / 40).T;
        if (T < minT) minT = T;
        if (T > maxT) maxT = T;
      }
    });
    if (!isFinite(minT)) minT = 0;
    if (!isFinite(maxT)) maxT = 100;
    if (T0 < minT) minT = T0;
    if (T0 > maxT) maxT = T0;
    if (maxT - minT < 20) { var mid = (maxT + minT) / 2; minT = mid - 10; maxT = mid + 10; }
    var padT = (maxT - minT) * 0.09;
    minT -= padT; maxT += padT;

    function qxPos(q) { return axLeft + (q / maxQ) * plotW; }
    function tyPos(T) { return axBot - ((T - minT) / (maxT - minT)) * plotH; }

    /* ── grid + ticks ── */
    ctx.strokeStyle = '#212a4a'; ctx.lineWidth = 1;
    ctx.fillStyle = '#c9d5ea'; ctx.font = 'bold 10px "JetBrains Mono","Courier New",monospace';
    ctx.textAlign = 'right';
    for (var i2 = 0; i2 <= 5; i2++) {
      var tv = minT + (maxT - minT) * i2 / 5;
      var ty = axBot - plotH * i2 / 5;
      ctx.fillText(u.fromTempC(tv).toFixed(0), axLeft - 6, ty + 3);
      ctx.beginPath(); ctx.moveTo(axLeft, ty); ctx.lineTo(axRight, ty); ctx.stroke();
    }
    ctx.textAlign = 'center';
    for (var j = 0; j <= 5; j++) {
      var qv = maxQ * j / 5, qx = axLeft + plotW * j / 5;
      ctx.fillText(u.fromHeatKJ(qv).toFixed(u.hDigits), qx, axBot + 13);
      if (j) { ctx.beginPath(); ctx.moveTo(qx, axTop); ctx.lineTo(qx, axBot); ctx.stroke(); }
    }
    ctx.strokeStyle = '#48577e'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(axLeft, axTop); ctx.lineTo(axLeft, axBot); ctx.lineTo(axRight, axBot); ctx.stroke();

    ctx.save(); ctx.translate(gx + 13, (axTop + axBot) / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#bcc8df'; ctx.font = 'bold 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Temperature (' + u.tempLabel + ')', 0, 0); ctx.restore();
    ctx.fillStyle = '#bcc8df'; ctx.font = 'bold 11px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    ctx.fillText((direction > 0 ? 'Heat added (' : 'Heat removed (') + u.heatLabel + ')',
                 (axLeft + axRight) / 2, gy + gh - 6);

    /* ── historical traces ── */
    for (var tt = 0; tt < traces.length; tt++) {
      var TR = traces[tt]; TR.poly = [];
      var isHover = hoverTrace && hoverTrace.trace === TR;
      ctx.save();
      ctx.strokeStyle = TR.color;
      ctx.lineWidth = isHover ? 2.4 : 1.6;
      ctx.globalAlpha = isHover ? 0.95 : 0.35;
      ctx.setLineDash(isHover ? [] : [5, 3]);
      ctx.beginPath();
      var N = 120, started = false;
      for (var s2 = 0; s2 <= N; s2++) {
        var qs = TR.Q * s2 / N;
        var x = qxPos(qs), y = tyPos(stateAt(TR.curve, qs).T);
        TR.poly.push({ x: x, y: y });
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    /* ── the live curve, coloured per phase; plateaus use the transition
          colour so latent segments read at a glance ── */
    function drawCurve(curve, qActive, mat) {
      if (qActive <= 0) return;
      ctx.save();
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      var N = 260, prevX = null, prevY = null;
      for (var k = 0; k <= N; k++) {
        var qk = qActive * k / N;
        var st = stateAt(curve, qk);
        var x = qxPos(qk), y = tyPos(st.T);
        var segColor = st.plateau ? transOf(st.plateau.kind).color
                     : st.phase === 's' ? mat.colorS
                     : st.phase === 'l' ? mat.colorL : mat.colorG;
        if (prevX != null) {
          ctx.strokeStyle = segColor;
          ctx.beginPath(); ctx.moveTo(prevX, prevY); ctx.lineTo(x, y); ctx.stroke();
        }
        prevX = x; prevY = y;
      }
      ctx.restore();
    }
    drawCurve(curveA, qA, matA);
    if (curveB) drawCurve(curveB, qB, matB);

    /* ── breakpoint dots ── */
    function drawBreaks(curve, qCurrent, mat) {
      var pts = curve.pts;
      for (var i = 1; i < pts.length - 1; i++) {
        if (pts[i].q > qCurrent + 0.01) break;
        if (pts[i].q === pts[i - 1].q) continue;
        var x = qxPos(pts[i].q), y = tyPos(pts[i].T);
        var kind = LABEL_TO_KIND[pts[i].label];
        var dotColor = kind ? transOf(kind).color
                     : pts[i].phase === 's' ? mat.colorS
                     : pts[i].phase === 'l' ? mat.colorL : mat.colorG;
        ctx.fillStyle = dotColor; ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1; ctx.stroke();
      }
    }
    drawBreaks(curveA, qA, matA);
    if (curveB) drawBreaks(curveB, qB, matB);

    /* ── transition-temperature reference lines ── */
    var phaseLabels = [];
    function addPhaseLine(Tphase, mat, tag) {
      if (!isFinite(Tphase) || Tphase <= minT + 0.5 || Tphase >= maxT - 0.5) return;
      var py = tyPos(Tphase);
      ctx.save();
      ctx.strokeStyle = mat.colorL; ctx.globalAlpha = 0.3;
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(axLeft, py); ctx.lineTo(axRight, py); ctx.stroke();
      ctx.restore();
      phaseLabels.push({ y: py, color: mat.colorL,
        txt: tag + ' ' + mat.name + ' ' + u.fromTempC(Tphase).toFixed(0) + u.tempLabel });
    }
    var ptA = curveA.pt;
    if (ptA.mode === 'sublime') addPhaseLine(ptA.Tsub, matA, 'T_sub');
    else { addPhaseLine(ptA.Tm, matA, 'T_m'); addPhaseLine(ptA.Tb, matA, 'T_b'); }
    if (curveB && matBIdx !== matAIdx) {
      var ptB = curveB.pt;
      if (ptB.mode === 'sublime') addPhaseLine(ptB.Tsub, matB, 'T_sub');
      else { addPhaseLine(ptB.Tm, matB, 'T_m'); addPhaseLine(ptB.Tb, matB, 'T_b'); }
    }
    /* Work out where the end-state summary card will sit BEFORE placing the
       pills, so a pill is never hidden underneath it. */
    var cardRect = null;
    if (heatInput > 0 && anim.forceScale >= 0.98 && showLabels) {
      ctx.save();
      ctx.font = 'bold 10px "JetBrains Mono","Courier New",monospace';
      var nEnt = curveB ? 2 : 1, wMax = 0;
      wMax = Math.max(ctx.measureText('Tₑ = ' + fmtTemp(stateAt(curveA, qA).T) +
             ' (' + phaseNameFromState(stateAt(curveA, qA)) + ')').width, wMax);
      if (curveB) wMax = Math.max(ctx.measureText('Tₑ = ' + fmtTemp(stateAt(curveB, qB).T) +
             ' (' + phaseNameFromState(stateAt(curveB, qB)) + ')').width, wMax);
      ctx.restore();
      var cW = wMax + 20, cH = nEnt * 14 + 12;
      cardRect = { x: axRight - cW - 4, y: axTop + 4, w: cW, h: cH };
    }

    // Pills only once the run has settled, so growing curves stay unobstructed.
    if (showLabels && phaseLabels.length && anim.forceScale >= 0.98) {
      ctx.save();
      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      var pillH = 14, gap = 2;
      phaseLabels.sort(function (a, b) { return a.y - b.y; });
      for (var pi = 1; pi < phaseLabels.length; pi++) {
        if (phaseLabels[pi].y - phaseLabels[pi - 1].y < pillH + gap) {
          phaseLabels[pi].y = phaseLabels[pi - 1].y + pillH + gap;
        }
      }
      // Pushing pills apart can walk the stack off the bottom of the plot;
      // slide the whole stack back up so every pill stays inside the axes.
      var overflow = phaseLabels[phaseLabels.length - 1].y + pillH / 2 - axBot;
      if (overflow > 0) {
        var lift = Math.min(overflow, phaseLabels[0].y - pillH / 2 - axTop);
        if (lift > 0) phaseLabels.forEach(function (p) { p.y -= lift; });
      }
      phaseLabels.forEach(function (p) {
        var tw = ctx.measureText(p.txt).width;
        // A pill whose row collides with the end-state card flips to the left
        // edge of the plot instead of being drawn underneath it.
        var collide = cardRect &&
          p.y + pillH / 2 > cardRect.y - 3 && p.y - pillH / 2 < cardRect.y + cardRect.h + 3;
        var boxX = collide ? axLeft + 6 : axRight - tw - 18;
        ctx.fillStyle = 'rgba(10,14,24,0.9)'; ctx.strokeStyle = p.color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(boxX, p.y - pillH / 2, tw + 10, pillH, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = p.color;
        ctx.textAlign = 'right';
        ctx.fillText(p.txt, boxX + tw + 5, p.y);
      });
      ctx.restore();
    }

    /* ── rolling marker + end-state card ── */
    if (heatInput > 0) {
      var mx = qxPos(qA);
      ctx.save();
      ctx.strokeStyle = 'rgba(229,57,53,0.6)'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(mx, axTop); ctx.lineTo(mx, axBot); ctx.stroke();
      ctx.restore();
      function dotColorFor(mat, st) {
        return st.plateau ? transOf(st.plateau.kind).color
             : st.phase === 's' ? mat.colorS : st.phase === 'l' ? mat.colorL : mat.colorG;
      }
      var sA = stateAt(curveA, qA);
      ctx.fillStyle = dotColorFor(matA, sA);
      ctx.beginPath(); ctx.arc(mx, tyPos(sA.T), 4.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
      if (curveB) {
        var sB = stateAt(curveB, qB);
        ctx.fillStyle = dotColorFor(matB, sB);
        ctx.beginPath(); ctx.arc(qxPos(qB), tyPos(sB.T), 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      if (anim.forceScale >= 0.98 && showLabels) {
        ctx.save();
        ctx.font = 'bold 10px "JetBrains Mono","Courier New",monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        var entries = [];
        function entry(curve, q, mat, color) {
          var end = stateAt(curve, q);
          entries.push({ color: color, txt: 'T\u2091 = ' + fmtTemp(end.T) + ' (' + phaseNameFromState(end) + ')' });
        }
        entry(curveA, qA, matA, matA.colorL);
        if (curveB) entry(curveB, qB, matB, matB.colorL);
        var rowH = 14, bpad = 6, maxW = 0;
        entries.forEach(function (e) { maxW = Math.max(maxW, ctx.measureText(e.txt).width); });
        // Reuse the rect reserved earlier so the pill-avoidance logic and the
        // card that is actually painted can never disagree.
        var boxW = cardRect ? cardRect.w : maxW + 20;
        var boxH = cardRect ? cardRect.h : entries.length * rowH + bpad * 2;
        var bx = cardRect ? cardRect.x : axRight - boxW - 4;
        var by = cardRect ? cardRect.y : axTop + 4;
        ctx.fillStyle = 'rgba(10,14,24,0.93)'; ctx.strokeStyle = 'rgba(139,157,195,0.35)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 5); ctx.fill(); ctx.stroke();
        entries.forEach(function (e, i) {
          var ty2 = by + bpad + rowH * (i + 0.5);
          ctx.fillStyle = e.color; ctx.fillRect(bx + 7, ty2 - 2, 6, 4);
          ctx.fillText(e.txt, bx + 18, ty2 + 1);
        });
        ctx.restore();
      }
    }

    /* ── legend: one tri-swatch per material (solid | liquid | gas) ──
          The generic S/L/G colour key was removed: it used water's colours
          for every material, which was wrong for lead, copper and iron. */
    ctx.save();
    ctx.font = 'bold 10px "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var legY = gy + 31, segW = 7, segH = 7, swW = segW * 3, swGap = 6, nameGap = 16;
    function drawTriSwatch(x, y, mat) {
      ctx.fillStyle = mat.colorS; ctx.fillRect(x, y - segH / 2, segW, segH);
      ctx.fillStyle = mat.colorL; ctx.fillRect(x + segW, y - segH / 2, segW, segH);
      ctx.fillStyle = mat.colorG; ctx.fillRect(x + segW * 2, y - segH / 2, segW, segH);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.5;
      ctx.strokeRect(x + 0.25, y - segH / 2 + 0.25, swW - 0.5, segH - 0.5);
    }
    var wA = ctx.measureText(matA.name).width;
    var tail = '  (solid \u00B7 liquid \u00B7 gas)';
    var wTail = ctx.measureText(tail).width;
    if (curveB) {
      var wB = ctx.measureText(matB.name).width;
      var total = swW + swGap + wA + nameGap + swW + swGap + wB;
      var lx = gx + (gw - total) / 2;
      drawTriSwatch(lx, legY, matA);
      ctx.fillStyle = '#cfd8e8'; ctx.fillText(matA.name, lx + swW + swGap, legY);
      var lx2 = lx + swW + swGap + wA + nameGap;
      drawTriSwatch(lx2, legY, matB);
      ctx.fillStyle = '#cfd8e8'; ctx.fillText(matB.name, lx2 + swW + swGap, legY);
    } else {
      var lxA = gx + (gw - swW - swGap - wA - wTail) / 2;
      drawTriSwatch(lxA, legY, matA);
      ctx.fillStyle = '#cfd8e8'; ctx.fillText(matA.name, lxA + swW + swGap, legY);
      ctx.fillStyle = '#7d8aa6'; ctx.font = '9px "Segoe UI", sans-serif';
      ctx.fillText(tail, lxA + swW + swGap + wA, legY);
    }
    ctx.restore();

    if (keepTraces && traces.length) {
      // Inside the plot, bottom-left \u2014 the panel title owns the top strip.
      ctx.save();
      ctx.fillStyle = 'rgba(139,157,195,0.85)'; ctx.font = '9px "Segoe UI", sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('Traces: ' + traces.length + ' \u2014 hover to identify', axLeft + 5, axBot - 5);
      ctx.restore();
    }

    /* ── hover tooltip ── */
    if (hoverTrace && hoverTrace.trace) {
      var tr2 = hoverTrace.trace;
      var lines = [
        tr2.label,
        tr2.sub,
        'Q = ' + fmtHeat(tr2.Q) + ',  m = ' + fmtMass(tr2.m)
      ];
      ctx.save();
      ctx.font = 'bold 10px "Segoe UI", sans-serif';
      var lw = 0;
      for (var li = 0; li < lines.length; li++) lw = Math.max(lw, ctx.measureText(lines[li]).width);
      var pw = lw + 14, ph = lines.length * 13 + 9;
      var mx2 = hoverTrace.mx + 12, my2 = hoverTrace.my - ph - 6;
      if (mx2 + pw > gx + gw - 4) mx2 = hoverTrace.mx - pw - 12;
      if (my2 < gy + 4) my2 = hoverTrace.my + 14;
      ctx.fillStyle = 'rgba(10,14,24,0.96)';
      ctx.strokeStyle = tr2.color; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.roundRect(mx2, my2, pw, ph, 4); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = tr2.color; ctx.fillText(lines[0], mx2 + 7, my2 + 5);
      ctx.fillStyle = '#cfd8e8'; ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText(lines[1], mx2 + 7, my2 + 18);
      ctx.fillText(lines[2], mx2 + 7, my2 + 31);
      ctx.restore();
    }
    ctx.restore();
  }

  /* ── Latent-heat banner stack, below the graph ── */
  function drawLatentLivePanel(gx, gy, gw, bottomY) {
    if (!latentBanners.length) return;
    var N = latentBanners.length;
    var vPad = 8, hPad = 12;
    var availH = bottomY - gy;
    var rowH = Math.min(56, Math.max(28, Math.floor((availH - vPad * 2) / N)));
    var panH = N * rowH + vPad * 2;

    var borderCol = latentBanners[0].color;
    for (var bi = 0; bi < latentBanners.length; bi++) {
      if (!latentBanners[bi].completed) { borderCol = latentBanners[bi].color; break; }
    }

    ctx.save();
    ctx.fillStyle = 'rgba(9,13,23,0.96)';
    ctx.strokeStyle = borderCol; ctx.lineWidth = 1.4;
    ctx.shadowColor = rgba(borderCol, 0.5); ctx.shadowBlur = 7;
    ctx.beginPath(); ctx.roundRect(gx, gy, gw, panH, 7); ctx.fill();
    ctx.shadowBlur = 0; ctx.stroke();

    latentBanners.forEach(function (item, idx) {
      var ry = gy + vPad + idx * rowH;
      var rx = gx + hPad;
      var t = transOf(item.kind);
      var qTotal = item.m * item.L;
      var qNow   = qTotal * item.progress;
      var head   = t.icon + '  Latent heat \u2014 ' + t.label +
                   (item.label ? ' (' + item.label + ')' : '') +
                   (item.completed ? '  \u2713' : '');

      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = item.color; ctx.font = 'bold 10px "Segoe UI", sans-serif';
      var availT = gw - hPad * 2;
      var titles = [
        head + '\u2002\u2014\u2002T = ' + fmtTemp(item.T) + ' (constant), ' + t.dirWord,
        head + '\u2002\u2014\u2002T = ' + fmtTemp(item.T) + ', ' + t.dirWord,
        head + '\u2002\u2014\u2002' + fmtTemp(item.T),
        head
      ];
      var title = titles[titles.length - 1];
      for (var qi = 0; qi < titles.length; qi++) {
        if (ctx.measureText(titles[qi]).width <= availT) { title = titles[qi]; break; }
      }
      ctx.fillText(title, rx, ry);

      var barY = ry + 13;
      if (rowH >= 42) {
        ctx.fillStyle = '#d4dff5'; ctx.font = '10px "JetBrains Mono","Courier New",monospace';
        var avail = gw - hPad * 2;
        var tTxt = power > 0 ? '  \u2192  t = ' + fmtTime(qTotal * 1000 / power) : '';
        // Try the full substitution, then progressively shorter forms, so the
        // line never runs past the panel edge in the narrower compare layout.
        var forms = [
          'Q = m \u00D7 ' + t.Lname + ' = ' + fmtMass(item.m) + ' \u00D7 ' + fmtL(item.L) + ' = ' + fmtHeat(qTotal) + tTxt,
          'Q = m' + t.Lname + ' = ' + fmtMass(item.m) + ' \u00D7 ' + fmtL(item.L) + ' = ' + fmtHeat(qTotal) + tTxt,
          'Q = m' + t.Lname + ' = ' + fmtHeat(qTotal) + tTxt,
          'Q = ' + fmtHeat(qTotal) + tTxt
        ];
        var eq = forms[forms.length - 1];
        for (var fi = 0; fi < forms.length; fi++) {
          if (ctx.measureText(forms[fi]).width <= avail) { eq = forms[fi]; break; }
        }
        ctx.fillText(eq, rx, ry + 13);
        barY = ry + 27;
      }

      var barW = gw - hPad * 2 - 104;
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.roundRect(rx, barY, barW, 7, 3.5); ctx.fill();
      ctx.fillStyle = item.color; ctx.globalAlpha = item.completed ? 0.55 : 0.92;
      ctx.beginPath(); ctx.roundRect(rx, barY, Math.max(4, barW * item.progress), 7, 3.5); ctx.fill();
      ctx.globalAlpha = 1;

      ctx.textAlign = 'right'; ctx.fillStyle = item.color;
      ctx.font = 'bold 9px "JetBrains Mono","Courier New",monospace';
      ctx.fillText(item.completed ? fmtHeat(qTotal) + '  \u2713'
                                  : fmtHeat(qNow) + ' / ' + fmtHeat(qTotal) + '  ' + Math.round(item.progress * 100) + '%',
                   gx + gw - hPad, barY + 6);
      ctx.textAlign = 'left';

      if (idx < N - 1) {
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(gx + hPad, ry + rowH - 2); ctx.lineTo(gx + gw - hPad, ry + rowH - 2); ctx.stroke();
      }
    });
    ctx.restore();
  }

  /* ── Live-state card (equation + conditions + elapsed time) ── */
  function drawStateCard(fx, fy, fw, matA, matB, qA, qB, curveA, curveB) {
    var rows = curveB ? 2 : 1;
    var fh = 62 + rows * 17;
    ctx.save();
    var g = ctx.createLinearGradient(0, fy, 0, fy + fh);
    g.addColorStop(0, 'rgba(20,27,43,0.94)'); g.addColorStop(1, 'rgba(13,18,29,0.94)');
    ctx.fillStyle = g; ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(fx, fy, fw, fh, 8); ctx.fill(); ctx.stroke();

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var tx = fx + 12, ty = fy + 16;
    ctx.fillStyle = '#90caf9'; ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('Q = mc\u0394T + mL', tx, ty);
    ctx.fillStyle = direction > 0 ? '#ffb74d' : '#4dd0e1';
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.fillText(direction > 0 ? '\u25B2 HEATING' : '\u25BC COOLING', tx + 108, ty);

    // Conditions strip
    var pt = curveA.pt;
    var cond = fmtPress(pressure) + '  \u00B7  ' + fmtPower(power) + '  \u00B7  ';
    cond += pt.mode === 'sublime'
      ? 'T_sub = ' + fmtTemp(pt.Tsub)
      : 'T_m = ' + fmtTemp(pt.Tm) + ', T_b = ' + fmtTemp(pt.Tb);
    ctx.fillStyle = '#8fa2c2'; ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillText(cond, tx, ty + 17);
    if (pt.supercritical) {
      ctx.fillStyle = '#ff8a65';
      ctx.fillText('\u26A0 above critical pressure \u2014 no distinct boiling', tx, ty + 32);
    } else {
      var el = power > 0 ? qA * 1000 / power : 0;
      ctx.fillStyle = '#8fa2c2';
      ctx.fillText('Elapsed t = Q/P = ' + fmtTime(el) + '  of  ' + fmtTime(heatInput * 1000 / power), tx, ty + 32);
    }

    function row(y, label, mat, q, curve, color) {
      var st = stateAt(curve, q);
      ctx.fillStyle = '#ffd54f'; ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillText(label + ':', tx, y);
      ctx.fillStyle = color; ctx.font = 'italic 700 12px "Cambria Math",serif';
      var xCur = tx + 22;
      ctx.fillText(mat.name, xCur, y);
      xCur += ctx.measureText(mat.name).width + 8;
      ctx.fillStyle = '#e6edf6'; ctx.font = '700 11px "JetBrains Mono","Courier New",monospace';
      ctx.fillText('Q=' + fmtHeat(q) + ', T=' + fmtTemp(st.T), xCur, y);
      ctx.fillStyle = st.plateau ? transOf(st.plateau.kind).color : '#3ddc84';
      ctx.textAlign = 'right';
      ctx.fillText('[' + phaseNameFromState(st).toLowerCase() + ']', fx + fw - 12, y);
      ctx.textAlign = 'left';
    }
    row(ty + 52, 'A', matA, qA, curveA, matA.colorL);
    if (curveB) row(ty + 69, 'B', matB, qB, curveB, matB.colorL);
    ctx.restore();
  }

  /* ================================================================
     MAIN RENDER — pure function of state, no side effects on scheduling
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    drawSceneBackground();

    if (mode !== 'simulate') { drawStaticIllustration(); return; }

    var matA = MATERIALS[matAIdx] || MATERIALS[0];
    var matB = MATERIALS[matBIdx] || MATERIALS[0];
    var rolling = clamp(anim.forceScale, 0, 1);
    var curveA = buildCurve(matA, mass, T0, pressure, direction, heatInput);
    var curveB = (view === 'compare') ? buildCurve(matB, mass, T0, pressure, direction, heatInput) : null;
    var qA = heatInput * rolling;
    var qB = heatInput * rolling;
    var stA = stateAt(curveA, qA);
    var stB = curveB ? stateAt(curveB, qB) : null;

    if (rolling > 0) {
      prevPlateauA = trackBanner(stA, matA, 'A', curveB ? 'A' : null, prevPlateauA);
      if (stB) prevPlateauB = trackBanner(stB, matB, 'B', 'B', prevPlateauB);
    }

    /* ── layout ──
       The beaker stands ON the gauze; the flame burns in the gap between the
       gauze and the burner barrel, so no flame is ever drawn inside the glass. */
    var contW, contH, contAX, contBX, contY;
    if (view === 'single') {
      contW = 168; contH = 182; contAX = 178; contBX = -9999; contY = 196;
    } else {
      contW = 124; contH = 152; contAX = 122; contBX = 320; contY = 192;
    }
    var gauzeY = contY + contH / 2;          // underside of the beaker
    var FLAME_GAP = 50;                      // clear air the flame burns through
    var benchY = gauzeY + FLAME_GAP + 22;
    drawBench(benchY, 12, 404);

    var GA = beakerGeom(contAX, contY, contW, contH);
    var GB = curveB ? beakerGeom(contBX, contY, contW, contH) : null;

    contactShadow(contAX, benchY + 3, contW, 0.55);
    if (GB) contactShadow(contBX, benchY + 3, contW, 0.55);

    /* ── heat source ── */
    var intensity = clamp(power / 6000, 0.12, 1);
    var active = anim.running || rolling > 0.001;
    if (direction > 0) {
      drawBurnerRig(contAX, gauzeY, contW + 14, benchY);
      if (GB) drawBurnerRig(contBX, gauzeY, contW + 14, benchY);
      if (showFlames && active) {
        var fi = intensity * (anim.running ? Math.max(0.35, rolling) : 0.9);
        drawFlame(contAX, gauzeY + FLAME_GAP, contW * 0.8, fi, FLAME_GAP);
        if (GB) drawFlame(contBX, gauzeY + FLAME_GAP, contW * 0.8, fi, FLAME_GAP);
      }
    } else {
      drawChiller(contAX, gauzeY + 2, contW + 14, showFlames && active ? intensity : 0.2, benchY);
      if (GB) drawChiller(contBX, gauzeY + 2, contW + 14, showFlames && active ? intensity : 0.2, benchY);
    }

    /* ── beaker + contents ── */
    drawGlassBack(GA);
    var boxA = drawContents(GA, matA, stA);
    if (GB) { drawGlassBack(GB); var boxB = drawContents(GB, matB, stB); }

    if (showParticles) {
      updateParticles(particlesA, boxA, stA, stA.T, matA);
      drawParticlesClipped(particlesA, phaseColor(matA, stA.phase, stA.plateau), stA, GA);
      if (GB) {
        updateParticles(particlesB, boxB, stB, stB.T, matB);
        drawParticlesClipped(particlesB, phaseColor(matB, stB.phase, stB.plateau), stB, GB);
      }
    }
    drawGlassFront(GA);
    if (GB) drawGlassFront(GB);

    /* ── instrumentation ── */
    var spanA = thermoSpan(curveA, stA);
    drawThermometer(GA.x + GA.w + 22, GA.y + 14, contH - 22, stA.T, spanA[0], spanA[1],
                    phaseColor(matA, stA.phase, stA.plateau));
    if (GB) {
      var spanB = thermoSpan(curveB, stB);
      drawThermometer(GB.x + GB.w + 22, GB.y + 14, contH - 22, stB.T, spanB[0], spanB[1],
                      phaseColor(matB, stB.phase, stB.plateau));
    }

    drawPhaseBadge(contAX, GA.y - 26, stA);
    if (GB) drawPhaseBadge(contBX, GB.y - 26, stB);
    drawMaterialLabel(contAX, benchY + 22, matA, view === 'compare' ? 'A' : 'Material', stA);
    if (GB) drawMaterialLabel(contBX, benchY + 22, matB, 'B', stB);

    /* ── graph + panels ── */
    if (showGraph) {
      var gx = view === 'single' ? 418 : 470;
      var gw = view === 'single' ? 468 : 416;
      drawGraphPanel(gx, 52, gw, 292, matA, matB, qA, qB, curveA, curveB);
      drawLatentLivePanel(gx, 352, gw, 566);
    }
    if (showEquation) drawStateCard(16, 452, view === 'single' ? 384 : 440, matA, matB, qA, qB, curveA, curveB);

    /* ── first-run hint (animated by the main tick loop, never self-scheduled) ── */
    if (rolling === 0 && !anim.running && traces.length === 0) {
      var hintX = view === 'single' ? 200 : 220;
      var hintY = 424;
      ctx.save();
      ctx.textAlign = 'center';
      var pulse = 0.55 + 0.45 * Math.sin(animTime * 1.8);
      ctx.shadowColor = 'rgba(38,198,218,' + (0.25 * pulse) + ')';
      ctx.shadowBlur = 18 * pulse;
      ctx.beginPath(); ctx.roundRect(hintX - 112, hintY - 15, 224, 30, 8);
      ctx.fillStyle = 'rgba(13,17,23,0.85)'; ctx.fill();
      ctx.strokeStyle = 'rgba(38,198,218,' + (0.45 * pulse) + ')'; ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(38,198,218,' + (0.7 + 0.3 * pulse) + ')';
      ctx.fillText((direction > 0 ? '\uD83D\uDD25' : '\u2744\uFE0F') + '  Press ' +
                   (direction > 0 ? 'Heat' : 'Cool') + ' to begin', hintX, hintY + 4);
      ctx.restore();
    }

    if (_exportFlag) {
      ctx.save();
      ctx.fillStyle = 'rgba(38,198,218,0.6)';
      ctx.font = 'bold 11px "Segoe UI", sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('NHIT VisualLab \u00B7 Phase Change & Latent Heat', W - 12, H - 8);
      ctx.restore();
    }
  }

  // Thermometer span: always brackets the transitions and the current reading.
  function thermoSpan(curve, st) {
    var pt = curve.pt;
    var lo, hi;
    if (pt.mode === 'sublime') { lo = pt.Tsub - 40; hi = pt.Tsub + 60; }
    else { lo = pt.Tm - 40; hi = pt.Tb + 50; }
    lo = Math.min(lo, T0 - 10, st.T - 10);
    hi = Math.max(hi, T0 + 10, st.T + 10);
    if (hi - lo < 40) hi = lo + 40;
    return [lo, hi];
  }

  function trackBanner(st, mat, slotKey, label, prevKind) {
    if (st.plateau) {
      var kind = st.plateau.kind;
      var id = slotKey + '-' + kind;
      var found = null;
      for (var i = 0; i < latentBanners.length; i++) {
        if (latentBanners[i].id === id) { found = latentBanners[i]; break; }
      }
      if (!found) {
        latentBanners.push({ id: id, kind: kind, mat: mat, m: mass, T: st.T,
          L: latentOf(mat, kind), color: transOf(kind).color, label: label,
          completed: false, progress: st.plateau.progress });
        playTransitionSound(kind);
      } else if (!found.completed) {
        found.progress = st.plateau.progress;
      }
      return kind;
    }
    if (prevKind) {
      var doneId = slotKey + '-' + prevKind;
      for (var j = 0; j < latentBanners.length; j++) {
        if (latentBanners[j].id === doneId && !latentBanners[j].completed) {
          latentBanners[j].completed = true; latentBanners[j].progress = 1; break;
        }
      }
    }
    return null;
  }

  function drawParticlesClipped(arr, color, st, G) {
    ctx.save();
    var fr = phaseFractions(st);
    if (fr.g > 0.02) {
      // Vapour rises out of the neck; clip to a column above the beaker.
      ctx.beginPath(); ctx.rect(G.x - 10, G.y - 145, G.w + 20, G.h + 145); ctx.clip();
    } else {
      ctx.beginPath(); ctx.rect(G.inX, G.inY, G.inW, G.inH); ctx.clip();
    }
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      var g = ctx.createRadialGradient(p.x - p.r * 0.35, p.y - p.r * 0.35, 0.4, p.x, p.y, p.r);
      g.addColorStop(0, rgba(shade(color, 1.5), 0.95));
      g.addColorStop(1, rgba(shade(color, 0.75), 0.75));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawStaticIllustration() {
    ctx.save();
    ctx.fillStyle = 'rgba(17,24,38,0.85)';
    ctx.beginPath(); ctx.roundRect(20, 20, W - 40, H - 40, 12); ctx.fill();
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#26c6da'; ctx.font = 'bold 30px "Courier New",monospace'; ctx.textAlign = 'center';
    ctx.fillText('Q = mc\u0394T + mL', W / 2, H / 2 - 70);
    ctx.fillStyle = '#80deea'; ctx.font = 'bold 16px "Segoe UI",sans-serif';
    ctx.fillText('Phase Change & Latent Heat', W / 2, H / 2 - 42);

    var x0 = W / 2 - 180, y0 = H / 2 + 20, w = 360, h = 120;
    ctx.strokeStyle = '#3a4a6a'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    var segs = [[0, 90], [50, 90], [80, 60], [200, 60], [230, 20], [290, 20], [340, 0]];
    var cols = ['#9fd8f5', '#ffd54f', '#4fc3f7', '#ff7043', '#b3e5fc', '#b3e5fc'];
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (var i = 1; i < segs.length; i++) {
      ctx.strokeStyle = cols[i - 1] || '#b3e5fc';
      ctx.beginPath();
      ctx.moveTo(x0 + segs[i - 1][0], y0 + segs[i - 1][1]);
      ctx.lineTo(x0 + segs[i][0], y0 + segs[i][1]);
      ctx.stroke();
    }
    ctx.fillStyle = '#8b9dc3'; ctx.font = '10px "Segoe UI",sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Solid', x0 + 12, y0 + 112);
    ctx.fillText('Melt', x0 + 55, y0 + 80);
    ctx.fillText('Liquid', x0 + 130, y0 + 55);
    ctx.fillText('Boil', x0 + 205, y0 + 45);
    ctx.fillText('Gas', x0 + 295, y0 + 15);
    ctx.fillStyle = '#6b7a99'; ctx.font = '11px "Segoe UI",sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Temperature \u2192', x0 - 22, y0 - 8);
    ctx.fillText('Heat added \u2192', x0 + w / 2, y0 + h + 22);
    ctx.restore();
  }

  /* ================================================================
     READOUTS + LEARNING PANELS
     ================================================================ */
  function currentCurves() {
    var matA = MATERIALS[matAIdx] || MATERIALS[0];
    var matB = MATERIALS[matBIdx] || MATERIALS[0];
    return {
      matA: matA, matB: matB,
      curveA: buildCurve(matA, mass, T0, pressure, direction, heatInput),
      curveB: buildCurve(matB, mass, T0, pressure, direction, heatInput)
    };
  }

  function updateReadouts() {
    var C = currentCurves();
    var rolling = clamp(anim.forceScale, 0, 1);
    var sA = stateAt(C.curveA, heatInput * rolling);
    var sB = stateAt(C.curveB, heatInput * rolling);
    var u = U();

    rTempA.textContent = u.fromTempC(sA.T).toFixed(u.tDigits);
    rTempB.textContent = u.fromTempC(sB.T).toFixed(u.tDigits);
    rPhaseA.textContent = phaseNameFromState(sA);
    rPhaseB.textContent = phaseNameFromState(sB);
    rHeat.textContent = u.fromHeatKJ(heatInput).toFixed(u.hDigits);
    rUnitTa.textContent = ' ' + u.tempLabel;
    rUnitTb.textContent = ' ' + u.tempLabel;
    rUnitHeat.textContent = ' ' + u.heatLabel;
    rLabelHeat.textContent = direction > 0 ? 'Heat Added' : 'Heat Removed';

    // Transition temperature at the current pressure
    var ptA = C.curveA.pt;
    if (ptA.mode === 'sublime') {
      rLabelTb.textContent = 'Sublimes at';
      rTb.textContent = u.fromTempC(ptA.Tsub).toFixed(u.tDigits);
    } else {
      rLabelTb.textContent = 'Boils at (' + fmtPress(pressure) + ')';
      rTb.textContent = u.fromTempC(ptA.Tb).toFixed(u.tDigits);
    }
    rUnitTbv.textContent = ' ' + u.tempLabel;

    rTime.textContent = power > 0 ? fmtTime(heatInput * 1000 / power) : '\u2014';

    badgeHeat.textContent = u.heatLabel;
    badgeMass.textContent = u.massLabel;
    badgeT0.textContent = u.tempLabel;
    badgePress.textContent = u.pressLabel;
    badgePower.textContent = u.sys === 'imp' ? 'BTU/h' : 'W';
    if (pressNote) pressNote.textContent = pressureNote(pressure);

    if (document.activeElement !== inHeat)  inHeat.value  = u.fromHeatKJ(heatInput).toFixed(u.hDigits);
    if (document.activeElement !== inMass)  inMass.value  = u.fromMassKg(mass).toFixed(u.mDigits);
    if (document.activeElement !== inT0)    inT0.value    = u.fromTempC(T0).toFixed(u.tDigits);
    if (document.activeElement !== inPress) inPress.value = u.fromPbar(pressure).toFixed(u.pDigits);
    if (document.activeElement !== inPower) inPower.value = Math.round(u.fromPowerW(power));

    cardTempB.style.display  = (view === 'compare') ? '' : 'none';
    cardPhaseB.style.display = (view === 'compare') ? '' : 'none';
    matBGroup.style.display  = (view === 'compare') ? '' : 'none';
    var lblA = document.getElementById('r-label-temp-a');
    if (lblA) lblA.textContent = (view === 'compare') ? 'Temp (A)' : 'Temperature';
  }

  function describeCurve(label, mat, curve, st) {
    var out = '<div class="eq-line"><b>' + label + ' &mdash; ' + mat.name + ':</b> start ' +
      fmtTemp(T0) + ' \u2192 now ' + fmtTemp(st.T) + ' (' + phaseNameFromState(st) + ')</div>';
    for (var i = 1; i < curve.pts.length; i++) {
      var q = curve.pts[i].q - curve.pts[i - 1].q;
      if (q <= 0.01) continue;
      var latent = segIsLatent(curve, i);
      out += '<div class="eq-line' + (latent ? ' eq-latent' : '') + '">&nbsp;&nbsp;' +
        segName(curve, i) + ' = ' + fmtHeat(q) +
        ' <span class="eq-cum">(cum ' + fmtHeat(curve.pts[i].q) +
        (power > 0 ? ', t = ' + fmtTime(curve.pts[i].q * 1000 / power) : '') + ')</span></div>';
    }
    return out;
  }

  function updateLearningPanels() {
    if (mode !== 'simulate') return;
    var C = currentCurves();
    var u = U();
    var sA = stateAt(C.curveA, heatInput);
    var sB = stateAt(C.curveB, heatInput);
    var ptA = C.curveA.pt;

    var eqBody = document.getElementById('lp-eq-body');
    if (eqBody) {
      var html = '<div class="eq-line">Full energy budget: \\[ Q = m c_s \\Delta T + m L_f + m c_l \\Delta T + m L_v + m c_g \\Delta T \\]</div>';
      html += '<div class="eq-line">Boiling point from Clausius&ndash;Clapeyron: ' +
              '\\[ \\frac{1}{T_b} = \\frac{1}{T_{b,0}} - \\frac{R}{L_v M}\\ln\\!\\left(\\frac{P}{P_0}\\right) \\]</div>';
      html += '<div class="eq-line eq-note">At ' + fmtPress(pressure) + ', ' + C.matA.name + ' ' +
              (ptA.mode === 'sublime'
                 ? 'has no stable liquid &mdash; it sublimes at ' + fmtTemp(ptA.Tsub) + '.'
                 : 'melts at ' + fmtTemp(ptA.Tm) + ' and boils at ' + fmtTemp(ptA.Tb) + '.') + '</div>';
      html += describeCurve('A', C.matA, C.curveA, sA);
      if (view === 'compare') html += describeCurve('B', C.matB, C.curveB, sB);
      if (eqBody._lastHtml !== html) { eqBody.innerHTML = html; eqBody._lastHtml = html; }
    }

    var cmp = document.getElementById('lp-cmp-body');
    if (cmp) {
      var h2 = '<div class="cmp-scroll"><table class="cmp-table"><thead><tr>' +
        '<th>Material</th><th>M<br><span>g/mol</span></th>' +
        '<th>T<sub>m</sub><br><span>' + u.tempLabel + '</span></th>' +
        '<th>T<sub>b</sub> @1atm<br><span>' + u.tempLabel + '</span></th>' +
        '<th>L<sub>f</sub><br><span>' + u.LLabel + '</span></th>' +
        '<th>L<sub>v</sub><br><span>' + u.LLabel + '</span></th>' +
        '<th>L<sub>v</sub>/L<sub>f</sub></th>' +
        '<th>c<sub>s</sub><br><span>' + u.cLabel + '</span></th>' +
        '<th>c<sub>l</sub><br><span>' + u.cLabel + '</span></th>' +
        '<th>c<sub>g</sub><br><span>' + u.cLabel + '</span></th>' +
        '</tr></thead><tbody>';
      MATERIALS.forEach(function (Mt, i) {
        var subl = Mt.Ptp > P_ATM;
        h2 += '<tr' + (i === matAIdx ? ' class="cmp-hot"' : '') + '><td>' + Mt.name + '</td>' +
              '<td>' + (Mt.M ? Mt.M.toFixed(2) : '\u2014') + '</td>' +
              '<td>' + u.fromTempC(Mt.Tm).toFixed(0) + '</td>' +
              '<td>' + (subl ? '<em title="No liquid at 1 atm">sublimes ' + u.fromTempC(phaseTemps(Mt, P_ATM).Tsub).toFixed(0) + '</em>' : u.fromTempC(Mt.Tb).toFixed(0)) + '</td>' +
              '<td>' + u.fromLSI(Mt.Lf).toFixed(u.lDigits) + '</td>' +
              '<td>' + u.fromLSI(Mt.Lv).toFixed(u.lDigits) + '</td>' +
              '<td>' + (Mt.Lv / Mt.Lf).toFixed(1) + '</td>' +
              '<td>' + u.fromCSI(Mt.cS).toFixed(u.cDigits) + '</td>' +
              '<td>' + u.fromCSI(Mt.cL).toFixed(u.cDigits) + '</td>' +
              '<td>' + u.fromCSI(Mt.cG).toFixed(u.cDigits) + '</td></tr>';
      });
      h2 += '</tbody></table></div>';
      h2 += '<p class="cmp-foot">L<sub>v</sub> is nearly always larger than L<sub>f</sub> &mdash; vaporization breaks intermolecular bonds completely, whereas melting only loosens them. ' +
            'T<sub>b</sub> is quoted at 1 atm; the simulator recomputes it for the pressure you set. ' +
            'Carbon dioxide has no liquid phase at 1 atm because its triple point sits at 5.18 bar.</p>';
      cmp.innerHTML = h2;
    }

    var coach = document.getElementById('lp-coach-body');
    if (coach) {
      var tips = [];
      var full = fitQ(C.matA, mass, T0, pressure, direction);
      if (heatInput < full * 0.3) {
        tips.push('At ' + fmtHeat(heatInput) + ' the sample only reaches <b>' + phaseNameFromState(sA) +
          '</b>. About ' + fmtHeat(full) + ' is needed to complete every transition.');
      } else {
        tips.push('Final state of material A: <b>' + phaseNameFromState(sA) + '</b> at ' + fmtTemp(sA.T) + '.');
      }
      if (ptA.mode === 'sublime') {
        tips.push('At ' + fmtPress(pressure) + ' you are <b>below the triple point</b> (' +
          fmtPress(C.matA.Ptp) + '), so no liquid can exist &mdash; the solid sublimes straight to gas, absorbing L<sub>sub</sub> = ' +
          fmtL(C.matA.Lsub || (C.matA.Lf + C.matA.Lv)) + '.');
      } else {
        var dTb = ptA.Tb - C.matA.Tb;
        if (Math.abs(dTb) > 0.5) {
          tips.push('Pressure has shifted the boiling point by <b>' + (dTb > 0 ? '+' : '') +
            U().fromDTempC(dTb).toFixed(1) + ' ' + u.dTempLabel + '</b> to ' + fmtTemp(ptA.Tb) +
            ' &mdash; the melting point barely moves, because the fusion line on a P&ndash;T diagram is almost vertical.');
        }
      }
      tips.push('For ' + C.matA.name + ', L<sub>v</sub>/L<sub>f</sub> = ' + (C.matA.Lv / C.matA.Lf).toFixed(1) +
        '. The boiling plateau is that many times longer than the melting plateau.');
      if (power > 0) {
        tips.push('At ' + fmtPower(power) + ', transferring ' + fmtHeat(heatInput) + ' takes <b>' +
          fmtTime(heatInput * 1000 / power) + '</b>. Timing a plateau this way is exactly how L is measured in the lab: L = Pt/m.');
      }
      if (direction < 0) {
        tips.push('Cooling releases the same latent heat that heating absorbs &mdash; the plateaus sit at identical temperatures, but the energy flows out of the sample.');
      }
      if (view === 'compare' && matAIdx !== matBIdx) {
        tips.push(sA.phase !== sB.phase
          ? 'A and B are in different phases &mdash; A is <b>' + phaseNameFromState(sA) + '</b> while B is <b>' + phaseNameFromState(sB) + '</b>.'
          : 'Both A and B ended in the ' + phaseNameFromState(sA).toLowerCase() + ' phase.');
      }
      var h3 = '<ul class="coach-list">';
      tips.forEach(function (t) { h3 += '<li>' + t + '</li>'; });
      h3 += '</ul>';
      coach.innerHTML = h3;
    }
  }

  /* ================================================================
     CALC MODAL
     ================================================================ */
  function calcStep(num, title, formula, calc, result) {
    var h = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula) h += '<div class="cs-formula">' + formula + '</div>';
    if (calc)    h += '<div class="cs-calc">' + calc.replace(/\n/g, '<br>') + '</div>';
    if (result != null) h += '<div class="cs-result">\u2192 <strong>' + result + '</strong></div>';
    h += '</div>'; return h;
  }
  function buildCalcSteps() {
    var C = currentCurves();
    var u = U();
    var ptA = C.curveA.pt;
    var html = '<div class="cs-inputs"><span class="cs-badge">Given</span>';
    html += '<div class="cs-given">';
    html += '<span>Q = ' + fmtHeat(heatInput) + ' = ' + (heatInput * 1000).toFixed(0) + ' J</span>';
    html += '<span>m = ' + fmtMass(mass) + ' = ' + mass.toFixed(3) + ' kg</span>';
    html += '<span>T\u2080 = ' + fmtTemp(T0) + '</span>';
    html += '<span>P = ' + fmtPress(pressure) + ' = ' + (pressure * 100).toFixed(2) + ' kPa</span>';
    html += '<span>Heater power = ' + fmtPower(power) + '</span>';
    html += '<span>Direction: ' + (direction > 0 ? 'heating (energy in)' : 'cooling (energy out)') + '</span>';
    html += '<span>Material A: ' + C.matA.name + ' (' + C.matA.formula + ', M = ' + C.matA.M + ' g/mol)</span>';
    if (view === 'compare') html += '<span>Material B: ' + C.matB.name + '</span>';
    html += '</div><p class="cs-si-note">\u2139 All calculations run in SI. Displayed units follow the SI / Imperial toggle.</p></div>';

    html += calcStep(1, 'Identify the governing equation',
      'Q = m&middot;c&middot;&Delta;T &nbsp;+&nbsp; m&middot;L',
      'Sensible heat changes temperature within one phase. Latent heat (Q = mL) is exchanged at constant temperature during a phase transition. The total is the sum of every segment the sample crosses.',
      'Total = sensible heats + latent heats across all traversed phases');

    var n = 2;
    html += calcStep(n++, 'Fix the transition temperatures at this pressure',
      '1/T\u2082 = 1/T\u2081 \u2212 (R / L M) \u00B7 ln(P\u2082/P\u2081)',
      'Pressure P = ' + fmtPress(pressure) + '  (1 atm = 1.01325 bar)\n' +
      'Triple point of ' + C.matA.name + ' = ' + fmtTemp(C.matA.Ttp) + ' at ' + fmtPress(C.matA.Ptp) + '\n' +
      (ptA.mode === 'sublime'
        ? 'P is BELOW the triple-point pressure, so no liquid phase is stable.\nThe solid sublimes directly to gas.'
        : 'P is above the triple-point pressure, so the sample melts and then boils.\n' +
          'The fusion line is near-vertical, so T_m stays at its 1 atm value.'),
      ptA.mode === 'sublime'
        ? 'T_sub = ' + fmtTemp(ptA.Tsub) + ',  L_sub = ' + fmtL(C.matA.Lsub || (C.matA.Lf + C.matA.Lv))
        : 'T_m = ' + fmtTemp(ptA.Tm) + ',  T_b = ' + fmtTemp(ptA.Tb) +
          (Math.abs(ptA.Tb - C.matA.Tb) > 0.5 ? '  (shifted from ' + fmtTemp(C.matA.Tb) + ' at 1 atm)' : ''));

    function derive(name, mat, curve, num) {
      var st = stateAt(curve, heatInput);
      var txt = 'Starting at ' + fmtTemp(T0) + ', ' + (direction > 0 ? 'adding ' : 'removing ') + fmtHeat(heatInput) + '.\n';
      for (var i = 1; i < curve.pts.length; i++) {
        var segQ = curve.pts[i].q - curve.pts[i - 1].q;
        if (segQ <= 0.01) continue;
        var cum = curve.pts[i].q;
        var nm = segName(curve, i);
        if (cum <= heatInput + 0.01) {
          txt += nm + ': ' + fmtHeat(segQ) + '  (cum ' + fmtHeat(cum) + ')' +
                 (power > 0 ? '  \u2192 t = ' + fmtTime(cum * 1000 / power) : '') + ' \u2713\n';
        } else {
          txt += nm + ': needs ' + fmtHeat(segQ) + ' \u2014 only ' +
                 fmtHeat(heatInput - curve.pts[i - 1].q) + ' supplied \u2192 partial\n';
          break;
        }
      }
      var phaseName = st.plateau
        ? transOf(st.plateau.kind).label + ' (' + (st.plateau.progress * 100).toFixed(0) + '% ' +
          (transOf(st.plateau.kind).to.toLowerCase()) + ')'
        : phaseNameFromState(st);
      return calcStep(num, 'Material ' + name + ' (' + mat.name + ') \u2014 walk the curve segment by segment',
        'Each segment is either m&middot;c&middot;&Delta;T (sloped) or m&middot;L (flat).',
        txt,
        'Final T = ' + fmtTemp(st.T) + ' &nbsp;&nbsp; Phase: ' + phaseName);
    }
    html += derive('A', C.matA, C.curveA, n++);
    if (view === 'compare') html += derive('B', C.matB, C.curveB, n++);

    if (power > 0) {
      html += calcStep(n++, 'Convert energy into time',
        't = Q / P',
        'Q = ' + (heatInput * 1000).toFixed(0) + ' J,  P = ' + power.toFixed(0) + ' W\n' +
        't = ' + (heatInput * 1000).toFixed(0) + ' / ' + power.toFixed(0) + ' = ' + (heatInput * 1000 / power).toFixed(1) + ' s',
        'Total process time = ' + fmtTime(heatInput * 1000 / power) +
        '. Inverting this (L = Pt/m) is exactly how latent heat is measured in a school calorimetry experiment.');
    }

    html += calcStep(n, 'Engineering interpretation',
      'What the state means in practice',
      'If the sample ends in the solid phase, all the energy went into warming or partially melting it. If it ends as a gas, the latent heat of vaporization has been fully paid \u2014 usually the largest single term. These calculations size refrigeration plant, boilers, autoclaves, freeze-dryers and foundry furnaces.',
      null);
    return html;
  }
  function openCalcModal() {
    var modal = document.getElementById('calc-modal');
    var body  = document.getElementById('calc-modal-body');
    if (!modal || !body) return;
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    var cb = document.getElementById('calc-modal-close'); if (cb) cb.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCalcModal() {
    var modal = document.getElementById('calc-modal'); if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    var b = document.getElementById('btn-calc'); if (b) b.focus();
  }

  /* ================================================================
     UNDO/REDO
     ================================================================ */
  function snapState() {
    return { a: matAIdx, b: matBIdx, q: heatInput, qm: heatInputMax, m: mass, t0: T0,
      pr: pressure, pw: power, dir: direction, view: view,
      sf: showFlames, sp: showParticles, sg: showGraph, se: showEquation, sl: showLabels, tr: keepTraces,
      cust: MATERIALS.slice(BUILTIN_MATERIALS.length) };
  }
  function loadState(s) {
    if (!s) return;
    if (s.cust && s.cust.length) { MATERIALS = BUILTIN_MATERIALS.concat(s.cust); rebuildMaterialSelects(); }
    matAIdx = Math.min(s.a, MATERIALS.length - 1);
    matBIdx = Math.min(s.b, MATERIALS.length - 1);
    heatInput = s.q; heatInputMax = s.qm || heatInput * 1.2; mass = s.m; T0 = s.t0;
    pressure = s.pr || P_ATM; power = s.pw || 1500; direction = s.dir || 1;
    view = s.view || 'single';
    showFlames = s.sf !== false; showParticles = s.sp !== false;
    showGraph = s.sg !== false; showEquation = s.se !== false;
    showLabels = s.sl !== false;
    keepTraces = !!s.tr;
    slHeat.max = heatInputMax;
    syncTabs();
    syncInputs(); updateReadouts(); updateLearningPanels(); invalidateOutput(); resyncParticles(); render();
  }
  function syncTabs() {
    document.querySelectorAll('#view-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.view === view); });
    document.querySelectorAll('#dir-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.dir === direction); });
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.unit === unitSystem); });
    setChk('chk-flames', showFlames); setChk('chk-particles', showParticles);
    setChk('chk-graph', showGraph); setChk('chk-equation', showEquation);
    setChk('chk-labels', showLabels); setChk('chk-traces', keepTraces);
    var bh = document.getElementById('btn-heat');
    if (bh) bh.innerHTML = direction > 0 ? '\uD83D\uDD25 Heat' : '\u2744\uFE0F Cool';
  }
  function setChk(id, v) { var e = document.getElementById(id); if (e) e.checked = v; }
  function pushHistory(immediate) {
    if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; }
    function doPush() {
      history = history.slice(0, histIdx + 1);
      history.push(snapState());
      if (history.length > HIST_MAX) history.shift();
      histIdx = history.length - 1;
    }
    if (immediate) doPush(); else pushTimer = setTimeout(doPush, 220);
  }
  function undo() { if (histIdx > 0) { histIdx--; loadState(history[histIdx]); } }
  function redo() { if (histIdx < history.length - 1) { histIdx++; loadState(history[histIdx]); } }

  /* ================================================================
     ANIMATION
     ================================================================ */
  function invalidateOutput() {
    if (anim.running) return;
    anim.forceScale = 0;
    tracedThisRun = false;
    latentBanners = []; prevPlateauA = null; prevPlateauB = null;
  }
  function pushCurrentTraces() {
    var C = currentCurves();
    var stamp = Math.floor(traces.length / (view === 'compare' ? 2 : 1)) + 1;
    function tr(mat, curve, tag) {
      var pt = curve.pt;
      traces.push({
        label: mat.name + ' (run ' + stamp + (tag ? ' \u00B7 ' + tag : '') + ')',
        sub: (pt.mode === 'sublime' ? 'T_sub = ' + fmtTemp(pt.Tsub) : 'T_m = ' + fmtTemp(pt.Tm) + ',  T_b = ' + fmtTemp(pt.Tb)) +
             '  @ ' + fmtPress(pressure),
        color: mat.colorL, curve: curve, Q: heatInput, m: mass, poly: []
      });
    }
    tr(C.matA, C.curveA, view === 'compare' ? 'A' : '');
    if (view === 'compare') tr(C.matB, C.curveB, 'B');
    while (traces.length > 12) traces.shift();
  }
  function tick(nowMs) {
    if (!nowMs) nowMs = performance.now();
    var dt = anim.lastMs ? Math.min(0.1, (nowMs - anim.lastMs) / 1000) : 0.016;
    anim.lastMs = nowMs; animTime += dt;
    if (anim.running) {
      var step = (dt / SIM_DURATION_S) * anim.speed;
      if (anim.forceScale < anim.targetScale) anim.forceScale = Math.min(anim.targetScale, anim.forceScale + step);
      if (anim.forceScale >= anim.targetScale - 0.0005) {
        anim.forceScale = anim.targetScale; anim.running = false;
        setRunButtons(false);
        if (keepTraces && !tracedThisRun && heatInput > 0) { pushCurrentTraces(); tracedThisRun = true; }
      }
      updateReadouts(); updateLearningPanels();
    }
    render();
    animId = requestAnimationFrame(tick);
  }
  function setRunButtons(running) {
    var btnHeat = document.getElementById('btn-heat'), btnStop = document.getElementById('btn-stop');
    if (btnHeat) btnHeat.disabled = running;
    if (btnStop) btnStop.disabled = !running;
  }
  function startHeating() {
    latentBanners = []; prevPlateauA = null; prevPlateauB = null;
    if (anim.forceScale >= 0.999) anim.forceScale = 0;
    anim.running = true; anim.targetScale = 1; anim.lastMs = 0;
    setRunButtons(true);
  }
  function stopHeating() { anim.running = false; setRunButtons(false); }

  function resetState() {
    matAIdx = 0; matBIdx = 4; mass = 1.0; T0 = -20; view = 'single';
    pressure = P_ATM; power = 1500; direction = 1;
    unitSystem = 'si';
    showFlames = showParticles = showGraph = showEquation = showLabels = true;
    keepTraces = false;
    traces = []; tracedThisRun = false; hoverTrace = null;
    slPress.value = pToSlider(pressure);
    slPower.value = power;
    rescaleEnergy();
    syncTabs();
    stopHeating(); invalidateOutput(); resyncParticles();
    syncInputs(); updateReadouts(); updateLearningPanels(); render(); pushHistory(true);
  }

  /* ================================================================
     INPUT RANGES
     ================================================================ */
  /* Refit the heat range whenever ANY parameter that changes the energy
     budget changes — material, mass, T0, pressure or direction. Without this
     the slider ceiling stays sized for the old configuration and larger
     masses simply cannot be driven through their transitions.               */
  function rescaleEnergy() {
    var matA = MATERIALS[matAIdx] || MATERIALS[0];
    var matB = (view === 'compare') ? (MATERIALS[matBIdx] || MATERIALS[0]) : null;
    var qA = fitQ(matA, mass, T0, pressure, direction);
    var q = matB ? Math.max(qA, fitQ(matB, mass, T0, pressure, direction)) : qA;
    var stepQ = q > 20000 ? 1000 : q > 2000 ? 100 : q > 200 ? 10 : 1;
    heatInputMax = Math.ceil(q * 1.2 / stepQ) * stepQ;
    slHeat.max = heatInputMax;
    slHeat.step = Math.max(0.1, stepQ / 10);
    inHeat.step = Math.max(0.1, stepQ / 10);
    heatInput = q;
    slHeat.value = heatInput;
    rescaleT0();
  }
  function rescaleT0() {
    var matA = MATERIALS[matAIdx] || MATERIALS[0];
    var matB = (view === 'compare') ? (MATERIALS[matBIdx] || MATERIALS[0]) : null;
    var ptA = phaseTemps(matA, pressure);
    var lo = ptA.mode === 'sublime' ? ptA.Tsub - 80 : ptA.Tm - 60;
    var hi = ptA.mode === 'sublime' ? ptA.Tsub + 120 : ptA.Tb + 60;
    if (matB) {
      var ptB = phaseTemps(matB, pressure);
      lo = Math.min(lo, (ptB.mode === 'sublime' ? ptB.Tsub - 80 : ptB.Tm - 60));
      hi = Math.max(hi, (ptB.mode === 'sublime' ? ptB.Tsub + 120 : ptB.Tb + 60));
    }
    var t0Min = Math.max(-273, Math.floor(lo / 10) * 10);
    var t0Max = Math.ceil(hi / 10) * 10;
    slT0.min = t0Min; slT0.max = t0Max;
    if (T0 < t0Min) T0 = t0Min;
    else if (T0 > t0Max) T0 = t0Max;
    slT0.value = T0;
  }

  function syncInputs() {
    selMatA.value = matAIdx; selMatB.value = matBIdx;
    var u = U();
    slHeat.value = heatInput; slMass.value = mass; slT0.value = T0;
    slPress.value = pToSlider(pressure); slPower.value = power;
    if (document.activeElement !== inHeat)  inHeat.value  = u.fromHeatKJ(heatInput).toFixed(u.hDigits);
    if (document.activeElement !== inMass)  inMass.value  = u.fromMassKg(mass).toFixed(u.mDigits);
    if (document.activeElement !== inT0)    inT0.value    = u.fromTempC(T0).toFixed(u.tDigits);
    if (document.activeElement !== inPress) inPress.value = u.fromPbar(pressure).toFixed(u.pDigits);
    if (document.activeElement !== inPower) inPower.value = Math.round(u.fromPowerW(power));
    updatePresetChips();
  }
  function updatePresetChips() {
    document.querySelectorAll('.preset-chip').forEach(function (c) {
      var id = c.dataset.preset;
      var p = PRESETS.filter(function (pp) { return pp.id === id; })[0];
      var match = !!p && p.a === matAIdx && (p.view !== 'compare' || p.b === matBIdx) &&
                  Math.abs(p.m - mass) < 0.05 && Math.abs(p.t0 - T0) < 1 &&
                  Math.abs(p.p - pressure) / p.p < 0.02 &&
                  p.dir === direction && p.view === view;
      c.classList.toggle('active', match);
    });
  }
  function rebuildMaterialSelects() {
    function opts(sel, selectedIdx) {
      sel.innerHTML = '';
      MATERIALS.forEach(function (Mt, i) {
        var o = document.createElement('option');
        o.value = i;
        o.textContent = Mt.name + (Mt.Ptp > P_ATM ? ' (sublimes at 1 atm)' : ' (T_m ' + Mt.Tm + ', T_b ' + Mt.Tb + ' \u00B0C)');
        if (i === selectedIdx) o.selected = true;
        sel.appendChild(o);
      });
    }
    opts(selMatA, matAIdx); opts(selMatB, matBIdx);
  }
  function buildPresetChips() {
    var host = document.getElementById('preset-chips');
    host.innerHTML = '';
    PRESETS.forEach(function (p) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'preset-chip'; b.dataset.preset = p.id;
      b.textContent = p.label;
      b.addEventListener('click', function () {
        matAIdx = p.a; matBIdx = p.b; mass = p.m; T0 = p.t0;
        pressure = p.p; direction = p.dir; view = p.view;
        slPress.value = pToSlider(pressure);
        rescaleEnergy();
        syncTabs();
        resyncParticles(); stopHeating(); invalidateOutput();
        syncInputs(); updateReadouts(); updateLearningPanels(); render(); pushHistory(true);
      });
      host.appendChild(b);
    });
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.mode;
    if (newMode === mode) return;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(newMode);
  });
  function switchMode(m) {
    mode = m;
    simPanel.style.display = 'none'; catRow.style.display = 'none';
    itemSelector.style.display = 'none'; itemInfo.style.display = 'none';
    practicePanel.style.display = 'none'; practiceBar.style.display = 'none';
    quizPanel.style.display = 'none'; quizBar.style.display = 'none';
    quizResult.style.display = 'none'; learnPanels.style.display = 'none';
    document.getElementById('canvas-toggles').style.display = (m === 'simulate' ? '' : 'none');
    if (canvasActionBar) canvasActionBar.style.display = (m === 'simulate' ? '' : 'none');
    var dirGroup = document.getElementById('dir-group');
    var cmpGroup = document.getElementById('compare-group');
    if (dirGroup) dirGroup.style.display = (m === 'simulate' ? '' : 'none');
    if (cmpGroup) cmpGroup.style.display = (m === 'simulate' ? '' : 'none');
    if (m === 'simulate') { simPanel.style.display = ''; learnPanels.style.display = ''; updateReadouts(); updateLearningPanels(); }
    else if (m === 'explore') { catRow.style.display = ''; itemSelector.style.display = ''; buildExploreGrid(); }
    else if (m === 'practice') { practicePanel.style.display = ''; practiceBar.style.display = ''; newPractice(); }
    else if (m === 'quiz') { startQuiz(); }
    render();
  }

  /* ================================================================
     EXPLORE
     ================================================================ */
  function buildExploreGrid() {
    conceptGrid.innerHTML = '';
    CONCEPTS.filter(function (c) { return c.cat === exploreCat; }).forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept && selectedConcept.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () { selectConcept(c); });
      conceptGrid.appendChild(btn);
    });
  }
  function selectConcept(c) {
    selectedConcept = c; buildExploreGrid();
    itemInfo.style.display = '';
    var catNames = { basics: 'Phase Basics', latent: 'Latent Heat', curve: 'Curves & Pressure', applications: 'Applications' };
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span>' +
      '<span class="ii-cat-badge">' + (catNames[c.cat] || c.cat) + '</span></div>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>' +
      '<span class="fb-unit">' + c.unit + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s, i) {
        var isLast = i === c.example.steps.length - 1;
        html += '<div class="ex-step">' + (isLast ? '<strong>' + s + '</strong>' : s) + '</div>';
      });
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }
  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    selectedConcept = null; itemInfo.style.display = 'none'; buildExploreGrid();
  });

  /* ================================================================
     PRACTICE + QUIZ
     ================================================================ */
  function newPractice() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    currentProblem = gen(); practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = ''; ppInput.disabled = false;
    ppFeedback.textContent = ''; ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppCheck.style.display = ''; ppShow.style.display = ''; ppNext.style.display = 'none';
    ppInput.focus();
  }
  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Enter a number'; ppFeedback.className = 'feedback err'; return; }
    practiceAnswered = true; practiceTotal++;
    var tol = currentProblem.tol || (Math.abs(currentProblem.answer) * 0.05);
    if (Math.abs(val - currentProblem.answer) <= tol) {
      practiceScore++; ppFeedback.textContent = '\u2714 Correct!'; ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '\u2718 Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback err';
    }
    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;
    ppInput.disabled = true; ppCheck.style.display = 'none'; ppShow.style.display = 'none'; ppNext.style.display = '';
    showSolution();
  });
  ppShow.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    practiceAnswered = true; practiceTotal++;
    ppFeedback.textContent = 'Solution revealed'; ppFeedback.className = 'feedback err';
    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;
    ppInput.disabled = true; ppCheck.style.display = 'none'; ppShow.style.display = 'none'; ppNext.style.display = '';
    showSolution();
  });
  ppNext.addEventListener('click', newPractice);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') ppCheck.click(); });
  function showSolution() {
    if (!currentProblem) return;
    ppSolution.style.display = '';
    var html = '<h4>Solution</h4>';
    currentProblem.steps.forEach(function (s, i) {
      var isLast = i === currentProblem.steps.length - 1;
      html += '<div class="sol-step">' + (isLast ? '<strong>' + s + '</strong>' : s) + '</div>';
    });
    ppSolution.innerHTML = html;
  }
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = randInt(0, i); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function startQuiz() {
    quizScore = 0; quizIdx = 0; quizAnswered = false; quizAnswers = [];
    var pool = QUIZ_POOL.slice(); shuffle(pool); quizSet = pool.slice(0, QUIZ_SIZE);
    quizPanel.style.display = ''; quizBar.style.display = ''; quizResult.style.display = 'none';
    showQuizQuestion();
  }
  function showQuizQuestion() {
    var q = quizSet[quizIdx]; qbarNum.textContent = (quizIdx + 1); quizAnswered = false;
    var html = '<p class="qp-prompt">' + (quizIdx + 1) + '. ' + q.q + '</p><div class="answer-grid">';
    q.opts.forEach(function (opt, i) { html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>'; });
    html += '</div><div style="margin-top:12px;display:flex;align-items:center;gap:10px;">';
    html += '<span class="quiz-feedback" id="qfb"></span>';
    html += '<button class="btn btn-primary" id="q-next" style="display:none;margin-left:auto;">Next \u2192</button></div>';
    quizPanel.innerHTML = html;
    quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { submitQuizAnswer(parseInt(btn.dataset.idx)); });
    });
    document.getElementById('q-next').addEventListener('click', nextQuizQuestion);
  }
  function submitQuizAnswer(idx) {
    if (quizAnswered) return; quizAnswered = true;
    var q = quizSet[quizIdx]; var ok = idx === q.correct;
    if (ok) quizScore++;
    quizAnswers.push({ q: q.q, given: q.opts[idx], correct: q.opts[q.correct], ok: ok });
    quizPanel.querySelectorAll('.answer-btn').forEach(function (btn, i) {
      btn.classList.add('locked');
      if (i === q.correct) btn.classList.add('correct');
      if (i === idx && !ok) btn.classList.add('wrong');
    });
    var qfb = document.getElementById('qfb');
    qfb.textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect';
    qfb.className = 'quiz-feedback ' + (ok ? 'ok' : 'err');
    document.getElementById('q-next').style.display = '';
  }
  function nextQuizQuestion() { quizIdx++; if (quizIdx >= QUIZ_SIZE) showQuizResult(); else showQuizQuestion(); }
  function showQuizResult() {
    quizPanel.style.display = 'none'; quizBar.style.display = 'none'; quizResult.style.display = '';
    var pct = quizScore / QUIZ_SIZE;
    var cls = pct >= 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct >= 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605' : '\u2605';
    var verdict = pct >= 1 ? 'Perfect Score!' : pct >= 0.6 ? 'Good Job!' : 'Keep Practicing!';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><div class="qr-title">Quiz Complete</div><div class="qr-stars">' + stars + '</div></div>';
    html += '<div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</div><div class="qr-verdict">' + verdict + '</div></div></div>';
    html += '<div class="qr-rows">';
    quizAnswers.forEach(function (a, i) {
      html += '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '"><div class="qr-qnum">Q' + (i + 1) + '</div>';
      html += '<div class="qr-detail"><strong>' + a.q + '</strong><br>Your answer: ' + a.given + (a.ok ? '' : '<br>Correct: ' + a.correct) + '</div>';
      html += '<div class="qr-mark">' + (a.ok ? '\u2714' : '\u2718') + '</div></div>';
    });
    html += '</div><button class="btn btn-primary" id="q-retry">New Quiz</button>';
    quizResult.innerHTML = html;
    document.getElementById('q-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     EXPORT
     ================================================================ */
  function exportCSV() {
    var C = currentCurves();
    var u = U();
    var curveB = view === 'compare' ? C.curveB : null;
    var ptA = C.curveA.pt;
    var lines = [];
    lines.push('# Phase Change & Latent Heat Simulator export');
    lines.push('# NHIT VisualLab/tools/phase-change');
    lines.push('# direction = ' + (direction > 0 ? 'heating' : 'cooling'));
    lines.push('# m = ' + fmtMass(mass) + ', T0 = ' + fmtTemp(T0) + ', Q = ' + fmtHeat(heatInput) +
               ', P = ' + fmtPress(pressure) + ', heater = ' + fmtPower(power));
    lines.push('# Material A = ' + C.matA.name + ' (' + C.matA.formula + ')');
    lines.push('# ' + (ptA.mode === 'sublime'
      ? 'sublimation point at this pressure = ' + fmtTemp(ptA.Tsub)
      : 'T_m = ' + fmtTemp(ptA.Tm) + ', T_b at this pressure = ' + fmtTemp(ptA.Tb)));
    if (curveB) lines.push('# Material B = ' + C.matB.name);
    lines.push((direction > 0 ? 'Q_added_' : 'Q_removed_') + u.heatLabel +
               ',time_s,T_A_' + u.tempLabel + ',Phase_A' +
               (curveB ? ',T_B_' + u.tempLabel + ',Phase_B' : ''));
    var N = 100;
    for (var i = 0; i <= N; i++) {
      var q = heatInput * i / N;
      var sA = stateAt(C.curveA, q);
      var t = power > 0 ? (q * 1000 / power) : 0;
      var row = u.fromHeatKJ(q).toFixed(3) + ',' + t.toFixed(1) + ',' +
                u.fromTempC(sA.T).toFixed(3) + ',' + phaseNameFromState(sA);
      if (curveB) { var sB = stateAt(curveB, q); row += ',' + u.fromTempC(sB.T).toFixed(3) + ',' + phaseNameFromState(sB); }
      lines.push(row);
    }
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'phase-change-' + C.matA.name.replace(/\s+/g, '-') + (curveB ? '-vs-' + C.matB.name.replace(/\s+/g, '-') : '') + '.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  }
  function exportPNG() {
    _exportFlag = true; render();
    try {
      var data = canvas.toDataURL('image/png');
      var a = document.createElement('a'); a.href = data; a.download = 'phase-change.png';
      document.body.appendChild(a); a.click();
      setTimeout(function () { a.remove(); }, 100);
    } catch (e) { alert('Export failed: ' + e.message); }
    _exportFlag = false; render();
  }

  /* ================================================================
     CONTEXT MENU + HOVER
     ================================================================ */
  function canvasCoord(e) {
    var rect = canvas.getBoundingClientRect();
    // Map from CSS pixels to the LOGICAL canvas space the drawing uses.
    return { x: (e.clientX - rect.left) * (W / rect.width),
             y: (e.clientY - rect.top)  * (H / rect.height) };
  }
  function distToSeg(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
    if (len2 === 0) { dx = px - ax; dy = py - ay; return Math.sqrt(dx * dx + dy * dy); }
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    var qx = ax + t * dx, qy = ay + t * dy;
    return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
  }
  canvas.addEventListener('mousemove', function (e) {
    if (mode !== 'simulate' || !keepTraces || !traces.length || !showGraph) {
      if (hoverTrace) { hoverTrace = null; canvas.style.cursor = ''; }
      return;
    }
    var c = canvasCoord(e); var best = null, bestD = 6;
    for (var i = 0; i < traces.length; i++) {
      var poly = traces[i].poly;
      if (!poly || poly.length < 2) continue;
      for (var j = 1; j < poly.length; j++) {
        var d = distToSeg(c.x, c.y, poly[j - 1].x, poly[j - 1].y, poly[j].x, poly[j].y);
        if (d < bestD) { bestD = d; best = traces[i]; }
      }
    }
    if (best) { hoverTrace = { trace: best, mx: c.x, my: c.y }; canvas.style.cursor = 'pointer'; }
    else if (hoverTrace) { hoverTrace = null; canvas.style.cursor = ''; }
  });
  canvas.addEventListener('mouseleave', function () {
    if (hoverTrace) { hoverTrace = null; canvas.style.cursor = ''; }
  });

  var ctxMenu = document.getElementById('ctx-menu');
  canvas.addEventListener('contextmenu', function (e) {
    if (mode !== 'simulate') return;
    e.preventDefault();
    var vx = Math.min(e.clientX, window.innerWidth - 210);
    var vy = Math.min(e.clientY, window.innerHeight - 250);
    ctxMenu.style.left = Math.max(4, vx) + 'px'; ctxMenu.style.top = Math.max(4, vy) + 'px';
    ctxMenu.style.display = 'block';
  });
  document.addEventListener('click', function (e) {
    if (ctxMenu.style.display === 'block' && !ctxMenu.contains(e.target)) ctxMenu.style.display = 'none';
  });
  ctxMenu.addEventListener('click', function (e) {
    var t = e.target.closest('.ctx-item'); if (!t) return;
    var C = currentCurves();
    var sA = stateAt(C.curveA, heatInput), sB = stateAt(C.curveB, heatInput);
    switch (t.dataset.ctx) {
      case 'copy-a': copyText(fmtTemp(sA.T) + ' (' + phaseNameFromState(sA) + ')'); break;
      case 'copy-b': copyText(fmtTemp(sB.T) + ' (' + phaseNameFromState(sB) + ')'); break;
      case 'csv': exportCSV(); break;
      case 'png': exportPNG(); break;
      case 'traces':
        keepTraces = !keepTraces;
        setChk('chk-traces', keepTraces);
        if (!keepTraces) { traces = []; hoverTrace = null; }
        render(); pushHistory(true); break;
      case 'clear-traces': traces = []; hoverTrace = null; render(); break;
      case 'reset': resetState(); break;
    }
    ctxMenu.style.display = 'none';
  });
  function copyText(s) { if (navigator.clipboard) navigator.clipboard.writeText(s); }

  /* ================================================================
     CUSTOM MATERIAL MODAL
     ================================================================ */
  var custModal = document.getElementById('cust-modal');
  function openCust() {
    ['cm-name', 'cm-tm', 'cm-tb', 'cm-cs', 'cm-cl', 'cm-cg', 'cm-lf', 'cm-lv', 'cm-mm'].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('cm-err').style.display = 'none';
    custModal.classList.add('active'); document.body.style.overflow = 'hidden';
    setTimeout(function () { document.getElementById('cm-name').focus(); }, 50);
  }
  function closeCust() { custModal.classList.remove('active'); document.body.style.overflow = ''; }
  document.getElementById('btn-custom').addEventListener('click', openCust);
  document.getElementById('cust-modal-close').addEventListener('click', closeCust);
  document.getElementById('cm-cancel').addEventListener('click', closeCust);
  custModal.addEventListener('click', function (e) { if (e.target === custModal) closeCust(); });
  document.getElementById('cm-add').addEventListener('click', function () {
    var name = (document.getElementById('cm-name').value || '').trim();
    var Tm = parseFloat(document.getElementById('cm-tm').value);
    var Tb = parseFloat(document.getElementById('cm-tb').value);
    var cS = parseFloat(document.getElementById('cm-cs').value);
    var cL = parseFloat(document.getElementById('cm-cl').value);
    var cG = parseFloat(document.getElementById('cm-cg').value);
    var Lf = parseFloat(document.getElementById('cm-lf').value);
    var Lv = parseFloat(document.getElementById('cm-lv').value);
    var MM = parseFloat(document.getElementById('cm-mm').value);
    var err = document.getElementById('cm-err');
    function bad(msg) { err.textContent = msg; err.style.display = ''; return null; }
    if (!name) return bad('Enter a material name.');
    if (!isFinite(Tm) || Tm < -273 || Tm > 4000) return bad('Melting point must be between \u2212273 and 4000 \u00B0C.');
    if (!isFinite(Tb) || Tb <= Tm || Tb > 4500)   return bad('Boiling point must exceed the melting point and be \u2264 4500 \u00B0C.');
    if (!isFinite(cS) || cS < 50 || cS > 10000)   return bad('c_solid must be 50\u201310000 J/(kg\u00B7K).');
    if (!isFinite(cL) || cL < 50 || cL > 10000)   return bad('c_liquid must be 50\u201310000 J/(kg\u00B7K).');
    if (!isFinite(cG) || cG < 50 || cG > 10000)   return bad('c_gas must be 50\u201310000 J/(kg\u00B7K).');
    if (!isFinite(Lf) || Lf < 1 || Lf > 1000)     return bad('L_f must be 1\u20131000 kJ/kg.');
    if (!isFinite(Lv) || Lv < 10 || Lv > 15000)   return bad('L_v must be 10\u201315000 kJ/kg.');
    if (!isFinite(MM) || MM < 1 || MM > 400)      return bad('Molar mass must be 1\u2013400 g/mol (needed for the pressure model).');
    var palette = [['#b2ebf2', '#26c6da', '#e0f7fa'], ['#fff59d', '#ffee58', '#fffde7'],
                   ['#e1bee7', '#ab47bc', '#f3e5f5'], ['#b2dfdb', '#26a69a', '#e0f2f1'],
                   ['#ffcdd2', '#ef5350', '#ffebee'], ['#c5cae9', '#5c6bc0', '#e8eaf6']];
    var c = palette[MATERIALS.length % palette.length];
    MATERIALS.push({ name: name, formula: '\u2014', M: MM,
      colorS: c[0], colorL: c[1], colorG: c[2],
      Tm: Tm, Tb: Tb, cS: cS, cL: cL, cG: cG, Lf: Lf, Lv: Lv, Lsub: Lf + Lv,
      Ttp: Tm, Ptp: 1e-9, TbRef: Tb, PbRef: P_ATM, Tc: Tb + 500, TcOk: false });
    rebuildMaterialSelects();
    matAIdx = MATERIALS.length - 1;
    rescaleEnergy();
    syncInputs(); updateReadouts(); updateLearningPanels(); invalidateOutput(); resyncParticles(); render(); pushHistory(true);
    closeCust();
  });

  /* ================================================================
     WIRING
     ================================================================ */
  function afterParamChange(refit, immediate) {
    if (refit) rescaleEnergy();
    stopHeating(); invalidateOutput();
    syncInputs(); updateReadouts(); updateLearningPanels(); render(); pushHistory(immediate);
  }

  slHeat.addEventListener('input', function () {
    heatInput = clamp(parseFloat(slHeat.value) || 0, 0, heatInputMax);
    afterParamChange(false, false);
  });
  slMass.addEventListener('input', function () {
    mass = clamp(parseFloat(slMass.value) || 0.1, 0.1, 20);
    resyncParticles();
    afterParamChange(true, false);
  });
  slT0.addEventListener('input', function () {
    T0 = clamp(parseFloat(slT0.value) || 0, parseFloat(slT0.min), parseFloat(slT0.max));
    afterParamChange(true, false);
  });
  slPress.addEventListener('input', function () {
    pressure = sliderToP(clamp(parseFloat(slPress.value) || 0, 0, P_TICKS));
    afterParamChange(true, false);
  });
  slPower.addEventListener('input', function () {
    power = clamp(parseFloat(slPower.value) || 100, 50, 20000);
    afterParamChange(false, false);
  });

  inHeat.addEventListener('input', function () {
    var u = U(); var v = parseFloat(inHeat.value); if (!isFinite(v)) return;
    heatInput = clamp(u.toHeatKJ(v), 0, heatInputMax); slHeat.value = heatInput;
    afterParamChange(false, false);
  });
  inMass.addEventListener('input', function () {
    var u = U(); var v = parseFloat(inMass.value); if (!isFinite(v)) return;
    mass = clamp(u.toMassKg(v), 0.1, 20); slMass.value = mass;
    resyncParticles();
    afterParamChange(true, false);
  });
  inT0.addEventListener('input', function () {
    var u = U(); var v = parseFloat(inT0.value); if (!isFinite(v)) return;
    T0 = clamp(u.toTempC(v), parseFloat(slT0.min) || -273, parseFloat(slT0.max) || 4000); slT0.value = T0;
    afterParamChange(true, false);
  });
  inPress.addEventListener('input', function () {
    var u = U(); var v = parseFloat(inPress.value); if (!isFinite(v)) return;
    pressure = clamp(u.toPbar(v), P_MIN, P_MAX); slPress.value = pToSlider(pressure);
    afterParamChange(true, false);
  });
  inPower.addEventListener('input', function () {
    var u = U(); var v = parseFloat(inPower.value); if (!isFinite(v)) return;
    power = clamp(u.toPowerW(v), 50, 20000); slPower.value = power;
    afterParamChange(false, false);
  });

  // Stepper increments follow the DISPLAYED unit, so "+" in Imperial adds a
  // round Imperial amount rather than a round SI one.
  document.querySelectorAll('.step-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var dir = parseInt(b.dataset.dir), what = b.dataset.step;
      var u = U();
      var refit = true;
      if (what === 'heat') {
        heatInput = clamp(u.toHeatKJ(u.fromHeatKJ(heatInput) + dir * u.heatStep), 0, heatInputMax);
        refit = false;
      } else if (what === 'mass') {
        mass = clamp(u.toMassKg(u.fromMassKg(mass) + dir * u.massStep), 0.1, 20);
        resyncParticles();
      } else if (what === 't0') {
        T0 = clamp(u.toTempC(u.fromTempC(T0) + dir * u.tempStep), parseFloat(slT0.min) || -273, parseFloat(slT0.max) || 4000);
      } else if (what === 'press') {
        pressure = clamp(pressure * (dir > 0 ? 1.25 : 0.8), P_MIN, P_MAX);
      } else if (what === 'power') {
        power = clamp(power + dir * 100, 50, 20000);
        refit = false;
      }
      afterParamChange(refit, true);
    });
  });

  function resyncParticles() {
    var layout = view === 'single'
      ? { ax: 178, ay: 222, bx: -9999, w: 150, h: 116 }
      : { ax: 122, ay: 216, bx: 320, w: 108, h: 96 };
    initParticles(particlesA, layout.ax, layout.ay, layout.w, layout.h);
    initParticles(particlesB, layout.bx === -9999 ? layout.ax : layout.bx, layout.ay, layout.w, layout.h);
  }
  selMatA.addEventListener('change', function () {
    matAIdx = parseInt(selMatA.value);
    resyncParticles();
    afterParamChange(true, true);
  });
  selMatB.addEventListener('change', function () {
    matBIdx = parseInt(selMatB.value);
    resyncParticles();
    afterParamChange(true, true);
  });
  function wireToggle(id, setter) {
    var el = document.getElementById(id); if (!el) return;
    el.addEventListener('change', function () { setter(!!el.checked); render(); pushHistory(true); });
  }
  wireToggle('chk-flames',    function (v) { showFlames = v; });
  wireToggle('chk-particles', function (v) { showParticles = v; });
  wireToggle('chk-graph',     function (v) { showGraph = v; });
  wireToggle('chk-equation',  function (v) { showEquation = v; });
  wireToggle('chk-labels',    function (v) { showLabels = v; });
  wireToggle('chk-traces',    function (v) { keepTraces = v; if (!v) { traces = []; hoverTrace = null; } });

  document.getElementById('unit-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    unitSystem = e.target.dataset.unit;
    document.querySelectorAll('#unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    syncInputs(); updateReadouts(); updateLearningPanels(); render();
  });
  document.getElementById('view-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newView = e.target.dataset.view;
    if (newView === view) return;
    view = newView;
    document.querySelectorAll('#view-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    resyncParticles();
    afterParamChange(true, true);
  });
  document.getElementById('dir-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var d = parseInt(e.target.dataset.dir);
    if (d === direction) return;
    direction = d;
    document.querySelectorAll('#dir-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    // Start from the far end so the reverse run has somewhere to go.
    var mat = MATERIALS[matAIdx] || MATERIALS[0];
    var pt = phaseTemps(mat, pressure);
    if (direction < 0) T0 = Math.round((pt.mode === 'sublime' ? pt.Tsub + 60 : pt.Tb + 40));
    else               T0 = Math.round((pt.mode === 'sublime' ? pt.Tsub - 60 : pt.Tm - 20));
    syncTabs();
    resyncParticles();
    afterParamChange(true, true);
  });

  document.getElementById('btn-heat').addEventListener('click', startHeating);
  document.getElementById('btn-stop').addEventListener('click', stopHeating);
  document.getElementById('btn-reset').addEventListener('click', resetState);
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-redo').addEventListener('click', redo);
  document.getElementById('btn-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-png').addEventListener('click', exportPNG);
  document.getElementById('btn-calc').addEventListener('click', openCalcModal);
  document.getElementById('calc-modal-close').addEventListener('click', closeCalcModal);
  document.getElementById('calc-modal').addEventListener('click', function (e) {
    if (e.target === document.getElementById('calc-modal')) closeCalcModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (document.getElementById('calc-modal').classList.contains('active')) { closeCalcModal(); return; }
      if (custModal.classList.contains('active')) { closeCust(); return; }
      if (ctxMenu.style.display === 'block') { ctxMenu.style.display = 'none'; return; }
    }
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
  });

  function wireLearnPanels() {
    var expAll = document.getElementById('learn-expand-all');
    var colAll = document.getElementById('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  }

  window.addEventListener('resize', function () { resizeCanvas(); render(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(function () { resizeCanvas(); render(); }).observe(canvas);

  /* ================================================================
     INIT
     ================================================================ */
  rebuildMaterialSelects();
  buildPresetChips();
  wireLearnPanels();
  resizeCanvas();
  resyncParticles();
  slPress.value = pToSlider(pressure);
  slPower.value = power;
  rescaleEnergy();
  syncTabs();
  syncInputs();
  updateReadouts();
  updateLearningPanels();
  pushHistory(true);
  if (!animId) tick();

})();
