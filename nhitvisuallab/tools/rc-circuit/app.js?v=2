(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS (8 concepts, 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Fundamentals ─────────────────────────────────────────────── */
    {
      id: 'time-constant', name: 'RC Time Constant', symbol: '\u03C4 = RC',
      formula: '\u03C4 = R \u00D7 C', unit: 's (seconds)',
      cat: 'fundamentals',
      desc: 'The RC time constant (\u03C4) is the product of resistance and capacitance. It represents the time for the capacitor voltage to reach 63.2% of its final value during charging, or to drop to 36.8% during discharging. After 5\u03C4 the capacitor is considered fully charged or discharged (99.3%).',
      diagram: 'timeConstant',
      example: { problem: 'A circuit has R = 2200 \u03A9 and C = 47 \u03BCF. Find the time constant \u03C4.', steps: ['\u03C4 = R \u00D7 C', '\u03C4 = 2200 \u00D7 47\u00D710\u207B\u2076', '\u03C4 = 0.1034 s', '\u03C4 \u2248 103.4 ms'], answer: 0.1034, unit: 's' }
    },
    {
      id: 'capacitor-basics', name: 'Capacitor Basics', symbol: 'C = Q/V',
      formula: 'C = Q / V', unit: 'F (farads)',
      cat: 'fundamentals',
      desc: 'A capacitor stores energy in an electric field between two conductive plates separated by a dielectric. Capacitance (C) is the ratio of stored charge (Q) to voltage (V). The energy stored is E = \u00BDC V\u00B2. Larger capacitance stores more charge at a given voltage.',
      diagram: 'capacitorBasics',
      example: { problem: 'A 100 \u03BCF capacitor is charged to 12 V. Find the stored energy.', steps: ['E = \u00BDC V\u00B2', 'E = 0.5 \u00D7 100\u00D710\u207B\u2076 \u00D7 12\u00B2', 'E = 0.5 \u00D7 0.0001 \u00D7 144', 'E = 7.2 mJ'], answer: 7.2, unit: 'mJ' }
    },
    {
      id: 'exponential-functions', name: 'Exponential Functions', symbol: 'e\u207B\u1D57/\u1D40',
      formula: 'f(t) = e^(\u2212t/\u03C4)', unit: 'dimensionless',
      cat: 'fundamentals',
      desc: 'The exponential function e^(\u2212t/\u03C4) is the mathematical foundation of RC circuit behaviour. At t = \u03C4, the function equals 0.368 (36.8%). The complement 1 \u2212 e^(\u2212t/\u03C4) equals 0.632 (63.2%). These functions describe the smooth curves of capacitor voltage during charging and discharging.',
      diagram: 'exponentialFunc',
      example: { problem: 'Find the value of e^(\u22122) (at t = 2\u03C4).', steps: ['e^(\u2212t/\u03C4) where t = 2\u03C4', 'e^(\u22122) = 0.1353', 'So voltage drops to 13.5% during discharge', 'Or rises to 86.5% during charge (1 \u2212 0.1353)'], answer: 0.1353, unit: '' }
    },

    /* ── Response ─────────────────────────────────────────────────── */
    {
      id: 'charging-response', name: 'Charging Response', symbol: 'V\u2080(1\u2212e\u207B\u1D57/\u1D40)',
      formula: 'V(t) = V\u2080(1 \u2212 e^(\u2212t/\u03C4)),  I(t) = (V\u2080/R)e^(\u2212t/\u03C4)', unit: 'V, A',
      cat: 'response',
      desc: 'During charging, voltage across the capacitor rises exponentially from 0 toward the supply voltage V\u2080. Current starts at a maximum of I\u2080 = V\u2080/R and decays exponentially to zero. The rate of change is fastest at the start and slows as the capacitor approaches full charge.',
      diagram: 'chargingResponse',
      example: { problem: 'V\u2080 = 10V, R = 1000\u03A9, C = 100\u03BCF. Find V_c at t = 0.1s.', steps: ['\u03C4 = RC = 1000 \u00D7 100\u00D710\u207B\u2076 = 0.1 s', 'V(t) = 10(1 \u2212 e^(\u22120.1/0.1))', 'V(t) = 10(1 \u2212 e\u207B\u00B9)', 'V(t) = 10 \u00D7 0.6321 = 6.32 V'], answer: 6.32, unit: 'V' }
    },
    {
      id: 'discharging-response', name: 'Discharging Response', symbol: 'V\u2080\u00B7e\u207B\u1D57/\u1D40',
      formula: 'V(t) = V\u2080\u00B7e^(\u2212t/\u03C4),  I(t) = \u2212(V\u2080/R)e^(\u2212t/\u03C4)', unit: 'V, A',
      cat: 'response',
      desc: 'During discharging, the capacitor releases its stored energy through the resistor. Voltage decays exponentially from V\u2080 toward zero. Current flows in the reverse direction, also decaying exponentially. The energy is dissipated as heat in the resistor.',
      diagram: 'dischargingResponse',
      example: { problem: 'A capacitor charged to 24V discharges through 4700\u03A9 with C = 220\u03BCF. Find V at t = 1s.', steps: ['\u03C4 = RC = 4700 \u00D7 220\u00D710\u207B\u2076 = 1.034 s', 'V(t) = 24 \u00D7 e^(\u22121/1.034)', 'V(t) = 24 \u00D7 0.382', 'V(t) = 9.17 V'], answer: 9.17, unit: 'V' }
    },
    {
      id: 'time-analysis', name: 'Time Analysis', symbol: '5\u03C4 = 99.3%',
      formula: '\u03C4: 63.2%,  2\u03C4: 86.5%,  3\u03C4: 95.0%,  4\u03C4: 98.2%,  5\u03C4: 99.3%', unit: '%',
      cat: 'response',
      desc: 'At each successive time constant, the capacitor gets closer to its final value. After 1\u03C4 it reaches 63.2%, after 2\u03C4 it reaches 86.5%, after 3\u03C4 it is at 95.0%, after 4\u03C4 at 98.2%, and after 5\u03C4 the capacitor is at 99.3% \u2014 practically fully charged or discharged.',
      diagram: 'timeAnalysis',
      example: { problem: 'R = 5000\u03A9, C = 200\u03BCF. How long to reach 95% charge?', steps: ['\u03C4 = RC = 5000 \u00D7 200\u00D710\u207B\u2076 = 1 s', '95% is reached at 3\u03C4', 't = 3 \u00D7 1 = 3 s'], answer: 3, unit: 's' }
    },

    /* ── Applications ────────────────────────────────────────────── */
    {
      id: 'rc-filter', name: 'RC Low-Pass Filter', symbol: 'f\u2081 = 1/(2\u03C0RC)',
      formula: 'f_cutoff = 1 / (2\u03C0RC)', unit: 'Hz',
      cat: 'applications',
      desc: 'An RC low-pass filter passes signals below its cutoff frequency and attenuates higher frequencies. The cutoff frequency is f_c = 1/(2\u03C0RC), where the output is \u22123dB (70.7%) of the input. RC filters are used in audio tone controls, anti-aliasing, and power supply smoothing.',
      diagram: 'rcFilter',
      example: { problem: 'R = 1000\u03A9, C = 10\u03BCF. Find the cutoff frequency.', steps: ['f_c = 1 / (2\u03C0RC)', 'f_c = 1 / (2\u03C0 \u00D7 1000 \u00D7 10\u00D710\u207B\u2076)', 'f_c = 1 / 0.06283', 'f_c = 15.92 Hz'], answer: 15.92, unit: 'Hz' }
    },
    {
      id: 'energy-storage', name: 'Energy Storage', symbol: 'E = \u00BDCV\u00B2',
      formula: 'E = \u00BD \u00D7 C \u00D7 V\u00B2', unit: 'J (joules)',
      cat: 'applications',
      desc: 'The energy stored in a capacitor depends on its capacitance and the square of the voltage across it. Doubling the voltage quadruples the stored energy. This energy is released during discharging and is dissipated as heat in the resistor. Capacitors are used for energy storage in flash photography, defibrillators, and power conditioning.',
      diagram: 'energyStorage',
      example: { problem: 'A 470\u03BCF capacitor is charged to 16V. Find the stored energy.', steps: ['E = \u00BDC V\u00B2', 'E = 0.5 \u00D7 470\u00D710\u207B\u2076 \u00D7 16\u00B2', 'E = 0.5 \u00D7 0.00047 \u00D7 256', 'E = 60.16 mJ'], answer: 60.16, unit: 'mJ' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (8)
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }
  function round3(n) { return +(Math.round(n * 1000) / 1000).toFixed(3); }

  var PROBLEM_GEN = [
    /* 0 — Find time constant */
    function () {
      var R = randInt(1, 10) * 100;
      var C = randInt(1, 10) * 100;
      var tau = round3(R * C / 1e6);
      return { prompt: 'R = ' + R + ' \u03A9, C = ' + C + ' \u03BCF. Find the time constant \u03C4 (in seconds).', steps: ['\u03C4 = R \u00D7 C', '\u03C4 = ' + R + ' \u00D7 ' + C + '\u00D710\u207B\u2076', '\u03C4 = ' + tau + ' s'], answer: tau, unit: 's', tol: 0.005 };
    },
    /* 1 — Find initial charging current */
    function () {
      var V = randInt(3, 24);
      var R = randInt(1, 10) * 100;
      var I0 = round2(V / R * 1000);
      return { prompt: 'V\u2080 = ' + V + ' V, R = ' + R + ' \u03A9. Find the initial charging current I\u2080 (mA).', steps: ['I\u2080 = V\u2080 / R', 'I\u2080 = ' + V + ' / ' + R, 'I\u2080 = ' + round2(V / R) + ' A', 'I\u2080 = ' + I0 + ' mA'], answer: I0, unit: 'mA', tol: 0.5 };
    },
    /* 2 — Vc during charging */
    function () {
      var V0 = randInt(5, 20);
      var R = randInt(1, 10) * 1000;
      var C = randInt(10, 100) * 10;
      var tau = R * C / 1e6;
      var nTau = randInt(1, 3);
      var t = round3(nTau * tau);
      var Vc = round2(V0 * (1 - Math.exp(-nTau)));
      return { prompt: 'V\u2080 = ' + V0 + ' V, R = ' + R + ' \u03A9, C = ' + C + ' \u03BCF. Find V_c during charging at t = ' + t + ' s (V).', steps: ['\u03C4 = RC = ' + R + ' \u00D7 ' + C + '\u00D710\u207B\u2076 = ' + round3(tau) + ' s', 't/\u03C4 = ' + nTau, 'V(t) = ' + V0 + '(1 \u2212 e^(\u2212' + nTau + '))', 'V(t) = ' + V0 + ' \u00D7 ' + round2(1 - Math.exp(-nTau)), 'V(t) = ' + Vc + ' V'], answer: Vc, unit: 'V', tol: 0.2 };
    },
    /* 3 — Vc during discharging */
    function () {
      var V0 = randInt(5, 24);
      var R = randInt(1, 10) * 1000;
      var C = randInt(10, 100) * 10;
      var tau = R * C / 1e6;
      var nTau = randInt(1, 3);
      var t = round3(nTau * tau);
      var Vc = round2(V0 * Math.exp(-nTau));
      return { prompt: 'Capacitor charged to ' + V0 + ' V discharges through R = ' + R + ' \u03A9, C = ' + C + ' \u03BCF. Find V_c at t = ' + t + ' s (V).', steps: ['\u03C4 = RC = ' + round3(tau) + ' s', 't/\u03C4 = ' + nTau, 'V(t) = ' + V0 + ' \u00D7 e^(\u2212' + nTau + ')', 'V(t) = ' + V0 + ' \u00D7 ' + round2(Math.exp(-nTau)), 'V(t) = ' + Vc + ' V'], answer: Vc, unit: 'V', tol: 0.2 };
    },
    /* 4 — Energy stored */
    function () {
      var V = randInt(5, 24);
      var C = randInt(10, 500) * 10;
      var E = round2(0.5 * C * 1e-6 * V * V * 1000);
      return { prompt: 'C = ' + C + ' \u03BCF charged to ' + V + ' V. Find the stored energy (mJ).', steps: ['E = \u00BDCV\u00B2', 'E = 0.5 \u00D7 ' + C + '\u00D710\u207B\u2076 \u00D7 ' + V + '\u00B2', 'E = 0.5 \u00D7 ' + (C / 1e6) + ' \u00D7 ' + (V * V), 'E = ' + E + ' mJ'], answer: E, unit: 'mJ', tol: 0.5 };
    },
    /* 5 — Find C from tau and R */
    function () {
      var R = randInt(1, 10) * 1000;
      var C = randInt(10, 200) * 10;
      var tau = round3(R * C / 1e6);
      return { prompt: '\u03C4 = ' + tau + ' s, R = ' + R + ' \u03A9. Find C (\u03BCF).', steps: ['C = \u03C4 / R', 'C = ' + tau + ' / ' + R, 'C = ' + round2(tau / R * 1e6) + ' \u03BCF'], answer: round2(tau / R * 1e6), unit: '\u03BCF', tol: 1 };
    },
    /* 6 — Find R from tau and C */
    function () {
      var R = randInt(1, 10) * 1000;
      var C = randInt(10, 200) * 10;
      var tau = round3(R * C / 1e6);
      return { prompt: '\u03C4 = ' + tau + ' s, C = ' + C + ' \u03BCF. Find R (\u03A9).', steps: ['R = \u03C4 / C', 'R = ' + tau + ' / ' + C + '\u00D710\u207B\u2076', 'R = ' + round2(tau / (C / 1e6)) + ' \u03A9'], answer: round2(tau / (C / 1e6)), unit: '\u03A9', tol: 5 };
    },
    /* 7 — Find tau from time to 99.3% */
    function () {
      var tau = round2(randInt(1, 50) / 10);
      var t5 = round2(5 * tau);
      return { prompt: 'A capacitor reaches 99.3% charge in ' + t5 + ' s. Find the time constant \u03C4 (s).', steps: ['99.3% is reached at 5\u03C4', '5\u03C4 = ' + t5, '\u03C4 = ' + t5 + ' / 5', '\u03C4 = ' + tau + ' s'], answer: tau, unit: 's', tol: 0.05 };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (10 MCQ + 5 numeric, pick 5 per quiz)
     ================================================================ */

  function genQuizPool() {
    var pool = [];
    /* --- 10 MCQ questions --- */
    pool.push({ type: 'mcq', prompt: 'The RC time constant \u03C4 equals:', options: ['R \u00D7 C', 'R / C', 'R + C', 'R \u2212 C'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'After 1 time constant, a charging capacitor reaches approximately:', options: ['63.2% of V\u2080', '50% of V\u2080', '86.5% of V\u2080', '36.8% of V\u2080'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'A capacitor is considered fully charged after:', options: ['5\u03C4', '1\u03C4', '3\u03C4', '10\u03C4'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'During charging, the current in an RC circuit:', options: ['Starts at maximum and decays to zero', 'Starts at zero and increases', 'Remains constant', 'Oscillates'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The energy stored in a capacitor is:', options: ['E = \u00BDCV\u00B2', 'E = CV', 'E = CV\u00B2', 'E = \u00BDCV'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'During discharging, the capacitor voltage follows:', options: ['V\u2080 \u00B7 e^(\u2212t/\u03C4)', 'V\u2080(1 \u2212 e^(\u2212t/\u03C4))', 'V\u2080 \u00B7 t/\u03C4', 'V\u2080 / t'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'If resistance is doubled while capacitance stays the same, the time constant:', options: ['Doubles', 'Halves', 'Stays the same', 'Quadruples'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The initial charging current I\u2080 in an RC circuit equals:', options: ['V\u2080 / R', 'V\u2080 \u00D7 R', 'V\u2080 \u00D7 C', 'V\u2080 / C'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'After 3\u03C4, a charging capacitor has reached approximately:', options: ['95.0%', '63.2%', '86.5%', '99.3%'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The cutoff frequency of an RC low-pass filter is:', options: ['1/(2\u03C0RC)', '2\u03C0RC', 'RC', '1/RC'], correct: 0 });

    /* --- 5 numeric questions --- */
    var R1 = randInt(1, 10) * 100;
    var C1 = randInt(1, 10) * 100;
    pool.push({ type: 'numeric', prompt: 'R = ' + R1 + ' \u03A9, C = ' + C1 + ' \u03BCF. Time constant \u03C4 (s)?', answer: round3(R1 * C1 / 1e6), unit: 's', tol: 0.005 });

    var V2 = randInt(5, 20);
    var R2q = randInt(1, 5) * 1000;
    pool.push({ type: 'numeric', prompt: 'V\u2080 = ' + V2 + ' V, R = ' + R2q + ' \u03A9. Initial current I\u2080 (mA)?', answer: round2(V2 / R2q * 1000), unit: 'mA', tol: 0.5 });

    var V3 = randInt(5, 20);
    var C3 = randInt(1, 10) * 100;
    pool.push({ type: 'numeric', prompt: 'C = ' + C3 + ' \u03BCF charged to ' + V3 + ' V. Energy stored (mJ)?', answer: round2(0.5 * C3 * 1e-6 * V3 * V3 * 1000), unit: 'mJ', tol: 0.5 });

    var R4 = randInt(1, 10) * 1000;
    var C4 = randInt(1, 10) * 10;
    pool.push({ type: 'numeric', prompt: 'RC filter: R = ' + R4 + ' \u03A9, C = ' + C4 + ' \u03BCF. Cutoff freq (Hz)?', answer: round2(1 / (2 * Math.PI * R4 * C4 * 1e-6)), unit: 'Hz', tol: 0.5 });

    var tau5 = round2(randInt(1, 30) / 10);
    pool.push({ type: 'numeric', prompt: '99.3% charge reached in ' + round2(5 * tau5) + ' s. Time constant \u03C4 (s)?', answer: tau5, unit: 's', tol: 0.05 });

    /* Shuffle */
    for (var i = pool.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    return pool;
  }

  /* ================================================================
     DOM REFS
     ================================================================ */

  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 480;

  /* Hi-DPI. This canvas was backed in CSS pixels while the CSS stretches it to
     its card, so on a 2x display it presented an upscaled bitmap. Size the
     backing store to real device pixels and scale the context so the existing
     900x480 logical space is untouched — no drawing code changes. No canvas
     pointer interaction in this tool, so no hit-test moves. */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var dW = cvs.getBoundingClientRect().width;
    if (!(dW > 40)) dW = 900;
    cvs.width  = Math.round(dW * dpr);
    cvs.height = Math.round(dW * (480 / 900) * dpr);
    var sc = (dW * dpr) / 900;
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  cvs.style.maxWidth = W + 'px';

  var modeTabs = document.getElementById('mode-tabs');
  var simPanel = document.getElementById('sim-panel');

  var rSlider = document.getElementById('r-slider');
  var cSlider = document.getElementById('c-slider');
  var vSlider = document.getElementById('v-slider');
  var rValEl = document.getElementById('r-val');
  var cValEl = document.getElementById('c-val');
  var vValEl = document.getElementById('v-val');

  var chargeTabs = document.getElementById('charge-tabs');
  var btnReset = document.getElementById('btn-reset');

  /* Readouts */
  var rVc = document.getElementById('r-vc');
  var rTau = document.getElementById('r-tau');
  var rIc = document.getElementById('r-ic');
  var rEn = document.getElementById('r-en');
  var rPct = document.getElementById('r-pct');

  /* Explore */
  var catRow = document.getElementById('cat-row');
  var catTabs = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');

  /* Practice */
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  /* Quiz */
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');
  var qbarNum = document.getElementById('qbar-num');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var chargeMode = 'charge';
  var resistance = 1000;
  var capacitance = 100;
  var voltage = 12;

  /* Animation & simulation state */
  var animFrame = null;
  var simTime = 0;
  var simRunning = false;
  var dotPhase = 0;

  /* Computed */
  var tau = 0;
  var totalSimTime = 0;

  /* Practice state */
  var pScore = 0, pTotal = 0, curProblem = null, pAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizPool = [], quizSet = [], quizIdx = 0, quizScore = 0, quizAnswered = false;
  var quizHistory = [];

  /* Explore state */
  var exploreCat = 'fundamentals';
  var selectedConcept = null;

  /* ================================================================
     PHYSICS
     ================================================================ */

  function recalcTau() {
    tau = resistance * (capacitance / 1e6);
    totalSimTime = 5 * tau;
  }

  function getVc(t) {
    if (tau <= 0) return 0;
    if (chargeMode === 'charge') {
      return voltage * (1 - Math.exp(-t / tau));
    }
    return voltage * Math.exp(-t / tau);
  }

  function getCurrent(t) {
    if (tau <= 0 || resistance <= 0) return 0;
    if (chargeMode === 'charge') {
      return (voltage / resistance) * Math.exp(-t / tau);
    }
    return -(voltage / resistance) * Math.exp(-t / tau);
  }

  function getChargePct(t) {
    if (tau <= 0) return 0;
    if (chargeMode === 'charge') {
      return (1 - Math.exp(-t / tau)) * 100;
    }
    return Math.exp(-t / tau) * 100;
  }

  function getEnergy(vc) {
    return 0.5 * (capacitance / 1e6) * vc * vc;
  }

  function updateReadouts() {
    var t = simTime;
    var vc = getVc(t);
    var ic = getCurrent(t);
    var pct = getChargePct(t);
    var en = getEnergy(vc);

    rVc.textContent = vc.toFixed(2);
    if (tau >= 1) {
      rTau.textContent = tau.toFixed(3);
    } else {
      rTau.textContent = (tau * 1000).toFixed(1) + ' m';
    }
    rIc.textContent = (Math.abs(ic) * 1000).toFixed(2);
    rEn.textContent = (en * 1000).toFixed(2);
    rPct.textContent = pct.toFixed(1);
  }

  /* ================================================================
     DRAWING — HELPERS
     ================================================================ */

  function clearCanvas() {
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);
  }

  function drawWire(x1, y1, x2, y2, color) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color || '#42a5f5';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /* ================================================================
     DRAWING — CIRCUIT COMPONENTS
     ================================================================ */

  function drawBattery(x, y) {
    var gap = 8;
    /* Long plate (positive) */
    ctx.beginPath();
    ctx.moveTo(x - 14, y - gap); ctx.lineTo(x + 14, y - gap);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    /* Short plate */
    ctx.beginPath();
    ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y);
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 3; ctx.stroke();
    /* Long plate 2 */
    ctx.beginPath();
    ctx.moveTo(x - 14, y + gap); ctx.lineTo(x + 14, y + gap);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 4; ctx.stroke();
    /* Short plate 2 */
    ctx.beginPath();
    ctx.moveTo(x - 8, y + gap * 2); ctx.lineTo(x + 8, y + gap * 2);
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 3; ctx.stroke();

    /* Labels */
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5555';
    ctx.textAlign = 'left';
    ctx.fillText('+', x + 18, y - gap + 5);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('\u2212', x + 18, y + gap * 2 + 5);

    /* Voltage label */
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#ffa000';
    ctx.textAlign = 'center';
    ctx.fillText(voltage.toFixed(1) + ' V', x, y + gap * 2 + 22);
  }

  function drawResistor(x, y, orient) {
    var peaks = 6, amp = 12, segW = 7;
    var totalW = peaks * segW;

    ctx.save();
    ctx.translate(x, y);
    if (orient === 'v') ctx.rotate(Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(-totalW / 2 - 10, 0);
    ctx.lineTo(-totalW / 2, 0);
    for (var i = 0; i < peaks; i++) {
      var px = -totalW / 2 + i * segW + segW / 2;
      var py = (i % 2 === 0) ? -amp : amp;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(totalW / 2, 0);
    ctx.lineTo(totalW / 2 + 10, 0);

    ctx.strokeStyle = '#ffa000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    /* Label */
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#ffa000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var rLabel = resistance >= 1000 ? (resistance / 1000) + 'k\u03A9' : resistance + ' \u03A9';
    if (orient === 'v') {
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('R=' + rLabel, 28, 0);
    } else {
      ctx.fillText('R=' + rLabel, 0, -amp - 10);
    }
    ctx.restore();
  }

  function drawCapacitor(x, y, pct) {
    var plateH = 36;
    var gap = 10;

    /* Left plate */
    ctx.beginPath();
    ctx.moveTo(x - gap, y - plateH / 2);
    ctx.lineTo(x - gap, y + plateH / 2);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* Right plate */
    ctx.beginPath();
    ctx.moveTo(x + gap, y - plateH / 2);
    ctx.lineTo(x + gap, y + plateH / 2);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* Charge fill between plates */
    if (pct > 0) {
      var fillH = plateH * Math.min(pct / 100, 1);
      var alpha = 0.1 + 0.35 * Math.min(pct / 100, 1);
      ctx.fillStyle = 'rgba(61, 220, 132, ' + alpha + ')';
      ctx.fillRect(x - gap + 2, y + plateH / 2 - fillH, (gap - 2) * 2, fillH);
    }

    /* Label */
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('C=' + capacitance + ' \u03BCF', x, y + plateH / 2 + 8);
  }

  function drawSwitch(x1, y1, x2, y2, closed) {
    if (closed) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else {
      /* Pivot point */
      ctx.beginPath();
      ctx.arc(x1, y1, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#42a5f5';
      ctx.fill();
      /* Angled arm */
      var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + len * 0.8, y1 - 16);
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
      /* End point */
      ctx.beginPath();
      ctx.arc(x2, y2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#42a5f5';
      ctx.fill();
    }

    /* Label */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(closed ? 'CLOSED' : 'OPEN', (x1 + x2) / 2, y1 - 18);
  }

  /* ================================================================
     DRAWING — CURRENT DOT ANIMATION
     ================================================================ */

  var circuitPath = [];

  function getPathLength(points) {
    var len = 0;
    for (var i = 1; i < points.length; i++) {
      var dx = points[i][0] - points[i - 1][0];
      var dy = points[i][1] - points[i - 1][1];
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  function getPointOnPath(points, t) {
    var totalLen = getPathLength(points);
    var target = ((t % 1) + 1) % 1 * totalLen;
    var accu = 0;
    for (var i = 1; i < points.length; i++) {
      var dx = points[i][0] - points[i - 1][0];
      var dy = points[i][1] - points[i - 1][1];
      var seg = Math.sqrt(dx * dx + dy * dy);
      if (accu + seg >= target) {
        var frac = (target - accu) / seg;
        return [points[i - 1][0] + dx * frac, points[i - 1][1] + dy * frac];
      }
      accu += seg;
    }
    return [points[points.length - 1][0], points[points.length - 1][1]];
  }

  function drawCurrentDots(currentMag) {
    if (currentMag < 0.0001) return;

    var maxI = voltage / Math.max(resistance, 1);
    var fraction = Math.min(Math.abs(currentMag) / maxI, 1);
    var numDots = Math.max(4, Math.round(12 * fraction + 4));
    var speed = 0.0005 + 0.003 * fraction;

    var reverse = (chargeMode === 'discharge');

    for (var d = 0; d < numDots; d++) {
      var t;
      if (reverse) {
        t = (1 - ((dotPhase * speed + d / numDots) % 1) + 1) % 1;
      } else {
        t = ((dotPhase * speed + d / numDots) % 1 + 1) % 1;
      }
      var pt = getPointOnPath(circuitPath, t);

      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(61,220,132,' + (0.4 + 0.5 * fraction) + ')';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 2, 0, Math.PI * 2);
      ctx.fillStyle = '#3ddc84';
      ctx.fill();
    }
  }

  /* ================================================================
     DRAWING — CIRCUIT SCHEMATIC (left half of canvas)
     ================================================================ */

  function drawCircuitSchematic(t) {
    var vc = getVc(t);
    var ic = getCurrent(t);
    var pct = getChargePct(t);
    var isClosed = simRunning || t > 0;

    /* Layout coordinates */
    var bx = 80, by = 240;
    var topY = 110;
    var botY = 370;
    var leftX = 80;
    var rightX = 370;
    var swX1 = 120, swX2 = 180;
    var resX = 265;
    var capX = rightX;
    var capY = 240;

    /* Circuit path for dot animation */
    circuitPath = [
      [leftX, by - 40],
      [leftX, topY],
      [swX1, topY],
      [swX2, topY],
      [resX - 31, topY],
      [resX + 31, topY],
      [rightX, topY],
      [rightX, capY - 18],
      [rightX, capY + 18],
      [rightX, botY],
      [leftX, botY],
      [leftX, by + 40]
    ];

    /* Draw wires — top row (hot) */
    drawWire(leftX, by - 40, leftX, topY, '#ff5555');
    drawWire(leftX, topY, swX1, topY, '#ff5555');
    /* Switch */
    drawSwitch(swX1, topY, swX2, topY, isClosed);
    if (isClosed) {
      drawWire(swX2, topY, resX - 31, topY, '#ff5555');
    }
    /* After resistor to capacitor */
    drawWire(resX + 31, topY, rightX, topY, '#ff5555');
    drawWire(rightX, topY, rightX, capY - 28, '#ff5555');

    /* Draw wires — bottom row (cold) */
    drawWire(rightX, capY + 28, rightX, botY, '#42a5f5');
    drawWire(rightX, botY, leftX, botY, '#42a5f5');
    drawWire(leftX, botY, leftX, by + 40, '#42a5f5');

    /* Battery */
    drawBattery(leftX, by);

    /* Resistor */
    drawResistor(resX, topY, 'h');

    /* Capacitor */
    drawCapacitor(capX, capY, pct);

    /* Capacitor voltage label */
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Vc = ' + vc.toFixed(2) + ' V', capX + 28, capY - 10);

    /* Current label on bottom wire */
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(61,220,132,0.85)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('I = ' + (Math.abs(ic) * 1000).toFixed(1) + ' mA', (leftX + rightX) / 2, botY + 10);

    /* Current direction arrow */
    var arrowX = (leftX + rightX) / 2 - 50;
    if (Math.abs(ic) > 0.0001) {
      ctx.beginPath();
      if (chargeMode === 'charge') {
        ctx.moveTo(arrowX, botY);
        ctx.lineTo(arrowX + 10, botY - 6);
        ctx.lineTo(arrowX + 10, botY + 6);
      } else {
        ctx.moveTo(arrowX + 10, botY);
        ctx.lineTo(arrowX, botY - 6);
        ctx.lineTo(arrowX, botY + 6);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(61,220,132,0.6)';
      ctx.fill();
    }

    /* Animated current dots */
    if (isClosed && Math.abs(ic) > 0.0001) {
      drawCurrentDots(Math.abs(ic));
    }

    /* Tau display */
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255,160,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    var tauStr = tau >= 1 ? tau.toFixed(3) + ' s' : (tau * 1000).toFixed(1) + ' ms';
    ctx.fillText('\u03C4 = ' + tauStr, 225, botY - 5);
  }

  /* ================================================================
     DRAWING — VOLTAGE-TIME GRAPH (right half of canvas)
     ================================================================ */

  function drawGraph(t) {
    var gx = 455, gy = 40;
    var gw = 410, gh = 370;
    var gx2 = gx + gw, gy2 = gy + gh;

    /* Graph background */
    ctx.fillStyle = 'rgba(13, 17, 23, 0.6)';
    ctx.fillRect(gx - 5, gy - 5, gw + 10, gh + 30);

    /* Border */
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, gy, gw, gh);

    /* Title */
    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(chargeMode === 'charge' ? 'Charging Curve' : 'Discharging Curve', gx + gw / 2, gy - 8);

    /* Axes */
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy2);
    ctx.lineTo(gx2, gy2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Y-axis label */
    ctx.save();
    ctx.translate(gx - 32, gy + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Voltage (V)', 0, 0);
    ctx.restore();

    /* X-axis label */
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Time', gx + gw / 2, gy2 + 16);

    /* Y-axis ticks */
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    var yStep = Math.max(1, Math.ceil(voltage / 6));
    for (var yv = 0; yv <= voltage; yv += yStep) {
      var yy = gy2 - (yv / voltage) * gh;
      ctx.fillText(yv.toFixed(0), gx - 6, yy);
      /* Grid line */
      ctx.beginPath();
      ctx.moveTo(gx, yy);
      ctx.lineTo(gx2, yy);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* X-axis tau markers */
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var nTau = 1; nTau <= 5; nTau++) {
      var xx = gx + (nTau / 5) * gw;
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(nTau + '\u03C4', xx, gy2 + 3);
      /* Grid line */
      ctx.beginPath();
      ctx.moveTo(xx, gy);
      ctx.lineTo(xx, gy2);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* 63.2% and 36.8% dashed lines */
    var line632 = gy2 - 0.632 * gh;
    var line368 = gy2 - 0.368 * gh;

    ctx.save();
    ctx.setLineDash([6, 4]);

    /* 63.2% line */
    ctx.beginPath();
    ctx.moveTo(gx, line632);
    ctx.lineTo(gx2, line632);
    ctx.strokeStyle = 'rgba(255, 85, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* 36.8% line */
    ctx.beginPath();
    ctx.moveTo(gx, line368);
    ctx.lineTo(gx2, line368);
    ctx.strokeStyle = 'rgba(66, 165, 245, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    /* Dashed line labels */
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 85, 85, 0.6)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('63.2%', gx2 - 3, line632 - 2);
    ctx.fillStyle = 'rgba(66, 165, 245, 0.6)';
    ctx.textBaseline = 'top';
    ctx.fillText('36.8%', gx2 - 3, line368 + 2);

    /* Draw voltage curve */
    ctx.beginPath();
    var steps = 300;
    for (var i = 0; i <= steps; i++) {
      var st = (i / steps) * totalSimTime;
      var sv = getVc(st);
      var px = gx + (i / steps) * gw;
      var py = gy2 - (sv / voltage) * gh;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Draw current curve (scaled to max current) */
    var maxI = voltage / resistance;
    ctx.beginPath();
    for (var i2 = 0; i2 <= steps; i2++) {
      var st2 = (i2 / steps) * totalSimTime;
      var si = getCurrent(st2);
      var px2 = gx + (i2 / steps) * gw;
      var py2 = gy2 - (Math.abs(si) / maxI) * gh;
      if (i2 === 0) ctx.moveTo(px2, py2);
      else ctx.lineTo(px2, py2);
    }
    ctx.strokeStyle = 'rgba(255, 85, 85, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    /* Legend */
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    /* Voltage legend */
    ctx.fillStyle = '#3ddc84';
    ctx.fillRect(gx + 10, gy + 12, 16, 3);
    ctx.fillText('Vc(t)', gx + 30, gy + 14);
    /* Current legend */
    ctx.fillStyle = 'rgba(255, 85, 85, 0.8)';
    ctx.fillRect(gx + 10, gy + 28, 16, 3);
    ctx.fillText('I(t)', gx + 30, gy + 30);

    /* Animated time position marker */
    if (totalSimTime > 0 && t > 0) {
      var tFrac = Math.min(t / totalSimTime, 1);
      var markerX = gx + tFrac * gw;
      var markerVc = getVc(t);
      var markerY = gy2 - (markerVc / voltage) * gh;

      /* Vertical time line */
      ctx.beginPath();
      ctx.moveTo(markerX, gy);
      ctx.lineTo(markerX, gy2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* Dot on voltage curve */
      ctx.beginPath();
      ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#3ddc84';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(markerX, markerY, 7, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(61, 220, 132, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      /* Dot on current curve */
      var markerIc = getCurrent(t);
      var markerIcY = gy2 - (Math.abs(markerIc) / maxI) * gh;
      ctx.beginPath();
      ctx.arc(markerX, markerIcY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5555';
      ctx.fill();
    }
  }

  /* ================================================================
     DRAWING — EXPLORE DIAGRAMS
     ================================================================ */

  function drawCapacitorSymbol(x, y, halfH) {
    var gap = 8;
    ctx.beginPath();
    ctx.moveTo(x - gap, y - halfH);
    ctx.lineTo(x - gap, y + halfH);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + gap, y - halfH);
    ctx.lineTo(x + gap, y + halfH);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawExploreDiagram(key) {
    clearCanvas();

    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    if (key === 'timeConstant') {
      ctx.fillText('RC Time Constant \u2014 \u03C4 = RC', W / 2, 15);

      /* Simple RC circuit */
      var cx = 200, cy = 240;
      drawWire(cx - 80, 140, cx + 100, 140, '#ff5555');
      drawResistor(cx + 10, 140, 'h');
      drawWire(cx + 100, 140, cx + 100, 200, '#ff5555');
      drawCapacitorSymbol(cx + 100, 240, 30);
      drawWire(cx + 100, 280, cx + 100, 340, '#42a5f5');
      drawWire(cx + 100, 340, cx - 80, 340, '#42a5f5');
      drawWire(cx - 80, 340, cx - 80, 140, '#42a5f5');

      /* Formula */
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('\u03C4 = R \u00D7 C', 550, 120);

      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('At t = \u03C4, capacitor reaches 63.2%', 550, 185);
      ctx.fillText('At t = 5\u03C4, capacitor is 99.3% charged', 550, 215);

      /* Bar chart */
      var barX = 420, barY = 270, barW = 380, barH = 24;
      var pcts = [63.2, 86.5, 95.0, 98.2, 99.3];
      var labels = ['1\u03C4', '2\u03C4', '3\u03C4', '4\u03C4', '5\u03C4'];
      for (var i = 0; i < 5; i++) {
        var y = barY + i * (barH + 8);
        var w = (pcts[i] / 100) * barW;
        ctx.fillStyle = 'rgba(61, 220, 132, ' + (0.3 + i * 0.14) + ')';
        ctx.fillRect(barX, y, w, barH);
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i] + ': ' + pcts[i] + '%', barX + 8, y + barH / 2);
      }

    } else if (key === 'capacitorBasics') {
      ctx.fillText('Capacitor Basics \u2014 C = Q/V', W / 2, 15);

      /* Large capacitor symbol */
      drawCapacitorSymbol(200, 200, 60);
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('+ Q', 160, 200);
      ctx.fillText('\u2212 Q', 240, 200);

      /* Electric field lines */
      ctx.strokeStyle = 'rgba(61, 220, 132, 0.3)';
      ctx.lineWidth = 1;
      for (var ef = 0; ef < 5; ef++) {
        var ey = 170 + ef * 15;
        ctx.beginPath();
        ctx.moveTo(192, ey);
        ctx.lineTo(208, ey);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(205, ey);
        ctx.lineTo(202, ey - 3);
        ctx.lineTo(202, ey + 3);
        ctx.closePath();
        ctx.fillStyle = 'rgba(61, 220, 132, 0.3)';
        ctx.fill();
      }

      /* Formulas */
      ctx.font = 'bold 26px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('C = Q / V', 550, 120);
      ctx.fillText('E = \u00BDC V\u00B2', 550, 180);

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText('C = capacitance (farads)', 550, 240);
      ctx.fillText('Q = charge (coulombs)', 550, 268);
      ctx.fillText('V = voltage (volts)', 550, 296);
      ctx.fillText('E = energy (joules)', 550, 324);

      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffa000';
      ctx.textAlign = 'center';
      ctx.fillText('Common: 10\u03BCF, 100\u03BCF, 470\u03BCF, 1000\u03BCF', 250, 340);

    } else if (key === 'exponentialFunc') {
      ctx.fillText('Exponential Functions in RC Circuits', W / 2, 15);

      /* Draw e^(-t/tau) and 1-e^(-t/tau) curves */
      var egx = 80, egy = 60, egw = 350, egh = 300;
      ctx.beginPath();
      ctx.moveTo(egx, egy);
      ctx.lineTo(egx, egy + egh);
      ctx.lineTo(egx + egw, egy + egh);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Decay curve e^(-t/tau) */
      ctx.beginPath();
      for (var ei = 0; ei <= 200; ei++) {
        var ex = egx + (ei / 200) * egw;
        var ev = Math.exp(-ei / 200 * 5);
        var epy = egy + (1 - ev) * egh;
        if (ei === 0) ctx.moveTo(ex, epy);
        else ctx.lineTo(ex, epy);
      }
      ctx.strokeStyle = '#ff5555';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Growth curve 1 - e^(-t/tau) */
      ctx.beginPath();
      for (var gi = 0; gi <= 200; gi++) {
        var gxx = egx + (gi / 200) * egw;
        var gv = 1 - Math.exp(-gi / 200 * 5);
        var gpy = egy + (1 - gv) * egh;
        if (gi === 0) ctx.moveTo(gxx, gpy);
        else ctx.lineTo(gxx, gpy);
      }
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = '12px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'left';
      ctx.fillText('1 \u2212 e^(\u2212t/\u03C4)', egx + egw - 100, egy + 30);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('e^(\u2212t/\u03C4)', egx + egw - 80, egy + egh - 30);

      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('Charging: 1 \u2212 e^(\u2212t/\u03C4)', 660, 140);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('Discharging: e^(\u2212t/\u03C4)', 660, 200);

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('At t = \u03C4:  e^(\u22121) = 0.368', 660, 270);
      ctx.fillText('At t = 2\u03C4: e^(\u22122) = 0.135', 660, 296);
      ctx.fillText('At t = 3\u03C4: e^(\u22123) = 0.050', 660, 322);

    } else if (key === 'chargingResponse') {
      ctx.fillText('Charging Response \u2014 V(t) = V\u2080(1 \u2212 e^(\u2212t/\u03C4))', W / 2, 15);

      var gcx = 80, gcy = 60, gcw = 380, gch = 300;
      ctx.beginPath();
      ctx.moveTo(gcx, gcy);
      ctx.lineTo(gcx, gcy + gch);
      ctx.lineTo(gcx + gcw, gcy + gch);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Voltage curve */
      ctx.beginPath();
      for (var ci = 0; ci <= 200; ci++) {
        var cx2 = gcx + (ci / 200) * gcw;
        var cv = 1 - Math.exp(-ci / 200 * 5);
        var cpy = gcy + gch - cv * gch;
        if (ci === 0) ctx.moveTo(cx2, cpy);
        else ctx.lineTo(cx2, cpy);
      }
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Current curve */
      ctx.beginPath();
      for (var ci2 = 0; ci2 <= 200; ci2++) {
        var cx3 = gcx + (ci2 / 200) * gcw;
        var cI = Math.exp(-ci2 / 200 * 5);
        var cpI = gcy + gch - cI * gch;
        if (ci2 === 0) ctx.moveTo(cx3, cpI);
        else ctx.lineTo(cx3, cpI);
      }
      ctx.strokeStyle = 'rgba(255, 85, 85, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      /* Legend */
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'left';
      ctx.fillText('Vc(t)', gcx + gcw - 60, gcy + 20);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('I(t)', gcx + gcw - 60, gcy + gch - 50);

      /* Formulas */
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('V(t) = V\u2080(1 \u2212 e^(\u2212t/\u03C4))', 660, 120);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('I(t) = (V\u2080/R)\u00B7e^(\u2212t/\u03C4)', 660, 180);

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Voltage rises from 0 to V\u2080', 660, 250);
      ctx.fillText('Current starts at I\u2080 = V\u2080/R', 660, 278);
      ctx.fillText('Current decays to 0', 660, 306);

    } else if (key === 'dischargingResponse') {
      ctx.fillText('Discharging Response \u2014 V(t) = V\u2080\u00B7e^(\u2212t/\u03C4)', W / 2, 15);

      var gdx = 80, gdy = 60, gdw = 380, gdh = 300;
      ctx.beginPath();
      ctx.moveTo(gdx, gdy);
      ctx.lineTo(gdx, gdy + gdh);
      ctx.lineTo(gdx + gdw, gdy + gdh);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Voltage decay curve */
      ctx.beginPath();
      for (var di = 0; di <= 200; di++) {
        var dx2 = gdx + (di / 200) * gdw;
        var dv = Math.exp(-di / 200 * 5);
        var dpy = gdy + gdh - dv * gdh;
        if (di === 0) ctx.moveTo(dx2, dpy);
        else ctx.lineTo(dx2, dpy);
      }
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Current decay curve */
      ctx.beginPath();
      for (var di2 = 0; di2 <= 200; di2++) {
        var dx3 = gdx + (di2 / 200) * gdw;
        var dI = Math.exp(-di2 / 200 * 5);
        var dpI = gdy + gdh - dI * gdh;
        if (di2 === 0) ctx.moveTo(dx3, dpI);
        else ctx.lineTo(dx3, dpI);
      }
      ctx.strokeStyle = 'rgba(255, 85, 85, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();

      /* Legend */
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'left';
      ctx.fillText('Vc(t)', gdx + 10, gdy + 20);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('I(t)', gdx + 10, gdy + 40);

      /* Formulas */
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('V(t) = V\u2080\u00B7e^(\u2212t/\u03C4)', 660, 120);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('I(t) = \u2212(V\u2080/R)\u00B7e^(\u2212t/\u03C4)', 660, 180);

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Voltage decays from V\u2080 to 0', 660, 250);
      ctx.fillText('Current reverses direction', 660, 278);
      ctx.fillText('Energy dissipated as heat in R', 660, 306);

    } else if (key === 'timeAnalysis') {
      ctx.fillText('Time Analysis \u2014 Charge % at Each \u03C4', W / 2, 15);

      /* Table */
      var tblX = 100, tblY = 70, rowH = 44, colW = [70, 120, 140, 140];
      var headers = ['n\u03C4', 'Charge %', 'Charging V/V\u2080', 'Dischg V/V\u2080'];
      var rows = [
        ['1\u03C4', '63.21%', '0.6321', '0.3679'],
        ['2\u03C4', '86.47%', '0.8647', '0.1353'],
        ['3\u03C4', '95.02%', '0.9502', '0.0498'],
        ['4\u03C4', '98.17%', '0.9817', '0.0183'],
        ['5\u03C4', '99.33%', '0.9933', '0.0067']
      ];

      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ffa000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var xOff = tblX;
      for (var hi = 0; hi < headers.length; hi++) {
        ctx.fillText(headers[hi], xOff + colW[hi] / 2, tblY + rowH / 2);
        xOff += colW[hi];
      }

      ctx.font = '13px "Courier New", monospace';
      for (var ri = 0; ri < rows.length; ri++) {
        var ry = tblY + (ri + 1) * rowH;
        if (ri % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(tblX, ry, colW[0] + colW[1] + colW[2] + colW[3], rowH);
        }
        xOff = tblX;
        for (var ci = 0; ci < rows[ri].length; ci++) {
          ctx.fillStyle = ci === 0 ? '#ffa000' : '#dde3f0';
          ctx.textAlign = 'center';
          ctx.fillText(rows[ri][ci], xOff + colW[ci] / 2, ry + rowH / 2);
          xOff += colW[ci];
        }
      }

      /* Bar chart on right */
      var bcX = 580, bcY = 80, bcW = 250, bcH = 28;
      ctx.font = 'bold 12px "Courier New", monospace';
      for (var bi = 0; bi < 5; bi++) {
        var bPct = [63.21, 86.47, 95.02, 98.17, 99.33][bi];
        var by2 = bcY + bi * (bcH + 12);
        var bw = (bPct / 100) * bcW;
        ctx.fillStyle = 'rgba(61, 220, 132, ' + (0.25 + bi * 0.15) + ')';
        ctx.fillRect(bcX, by2, bw, bcH);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText((bi + 1) + '\u03C4 = ' + bPct + '%', bcX + 6, by2 + bcH / 2);
      }

    } else if (key === 'rcFilter') {
      ctx.fillText('RC Low-Pass Filter \u2014 f_c = 1/(2\u03C0RC)', W / 2, 15);

      /* Filter circuit */
      var fx = 120, fy = 180;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('V_in', fx - 30, fy - 10);

      drawWire(fx, fy, fx + 60, fy, '#ff5555');
      drawResistor(fx + 100, fy, 'h');
      drawWire(fx + 140, fy, fx + 200, fy, '#ff5555');

      /* Capacitor to ground */
      drawCapacitorSymbol(fx + 200, fy + 50, 24);
      drawWire(fx + 200, fy, fx + 200, fy + 26, '#3ddc84');
      drawWire(fx + 200, fy + 74, fx + 200, fy + 100, '#42a5f5');
      /* Ground */
      ctx.beginPath();
      ctx.moveTo(fx + 185, fy + 100);
      ctx.lineTo(fx + 215, fy + 100);
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('V_out', fx + 240, fy - 10);
      drawWire(fx + 200, fy, fx + 250, fy, '#3ddc84');

      /* Frequency response */
      var frx = 450, fry = 80, frw = 380, frh = 260;
      ctx.beginPath();
      ctx.moveTo(frx, fry);
      ctx.lineTo(frx, fry + frh);
      ctx.lineTo(frx + frw, fry + frh);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Bode plot */
      ctx.beginPath();
      for (var fi = 0; fi <= 200; fi++) {
        var fNorm = Math.pow(10, (fi / 200) * 3 - 1);
        var gain = 1 / Math.sqrt(1 + fNorm * fNorm);
        var fpx = frx + (fi / 200) * frw;
        var fpy = fry + frh - gain * frh;
        if (fi === 0) ctx.moveTo(fpx, fpy);
        else ctx.lineTo(fpx, fpy);
      }
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* -3dB line */
      ctx.save();
      ctx.setLineDash([5, 4]);
      var db3y = fry + frh - 0.707 * frh;
      ctx.beginPath();
      ctx.moveTo(frx, db3y);
      ctx.lineTo(frx + frw, db3y);
      ctx.strokeStyle = 'rgba(255, 85, 85, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = '#ff5555';
      ctx.textAlign = 'left';
      ctx.fillText('\u22123dB (70.7%)', frx + 5, db3y - 5);

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('Frequency \u2192', frx + frw / 2, fry + frh + 18);
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillStyle = '#ffa000';
      ctx.fillText('f_c = 1 / (2\u03C0RC)', frx + frw / 2, fry + frh + 45);

    } else if (key === 'energyStorage') {
      ctx.fillText('Energy Storage \u2014 E = \u00BDCV\u00B2', W / 2, 15);

      /* Capacitor with energy glow */
      drawCapacitorSymbol(200, 200, 50);
      var grad = ctx.createRadialGradient(200, 200, 5, 200, 200, 60);
      grad.addColorStop(0, 'rgba(61, 220, 132, 0.3)');
      grad.addColorStop(1, 'rgba(61, 220, 132, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(140, 140, 120, 120);

      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('E = \u00BDC V\u00B2', 550, 100);

      /* E vs V parabola */
      var evx = 420, evy = 170, evw = 300, evh = 220;
      ctx.beginPath();
      ctx.moveTo(evx, evy);
      ctx.lineTo(evx, evy + evh);
      ctx.lineTo(evx + evw, evy + evh);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      for (var vi = 0; vi <= 100; vi++) {
        var vNorm = vi / 100;
        var eNorm = vNorm * vNorm;
        var epx = evx + vNorm * evw;
        var epy = evy + evh - eNorm * evh;
        if (vi === 0) ctx.moveTo(epx, epy);
        else ctx.lineTo(epx, epy);
      }
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('Voltage \u2192', evx + evw / 2, evy + evh + 16);
      ctx.save();
      ctx.translate(evx - 20, evy + evh / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Energy \u2192', 0, 0);
      ctx.restore();

      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('Energy scales with V\u00B2 (quadratic)', 550, evy + evh + 45);
      ctx.fillText('Double voltage = 4\u00D7 energy', 550, evy + evh + 69);
    }
  }

  /* ================================================================
     DRAWING — MAIN SIMULATION RENDER
     ================================================================ */

  function drawSimulation() {
    clearCanvas();

    /* Title */
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('RC Circuit \u2014 ' + (chargeMode === 'charge' ? 'Charging' : 'Discharging'), 15, 10);

    /* Formula in corner */
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255,160,0,0.4)';
    ctx.textAlign = 'right';
    if (chargeMode === 'charge') {
      ctx.fillText('V(t) = V\u2080(1\u2212e^(\u2212t/\u03C4))', 435, 12);
    } else {
      ctx.fillText('V(t) = V\u2080\u00B7e^(\u2212t/\u03C4)', 435, 12);
    }

    /* Divider */
    ctx.beginPath();
    ctx.moveTo(440, 30);
    ctx.lineTo(440, H - 10);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    drawCircuitSchematic(simTime);
    drawGraph(simTime);
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  var lastFrameTime = 0;

  function animate(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    var dt = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;

    dotPhase++;

    if (simRunning) {
      simTime += dt;
      if (simTime >= totalSimTime) {
        simTime = totalSimTime;
        simRunning = false;
      }
    }

    drawSimulation();
    updateReadouts();

    if (mode === 'simulate') {
      animFrame = requestAnimationFrame(animate);
    }
  }

  function startAnim() {
    lastFrameTime = 0;
    if (!animFrame) {
      animFrame = requestAnimationFrame(animate);
    }
  }

  function stopAnim() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function resetSim() {
    simTime = 0;
    simRunning = true;
    dotPhase = 0;
    recalcTau();
    if (mode === 'simulate') startAnim();
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function hideAll() {
    simPanel.style.display = 'none';
    catRow.style.display = 'none';
    itemSelector.style.display = 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';
  }

  function setMode(m) {
    mode = m;
    hideAll();
    stopAnim();

    if (m === 'simulate') {
      simPanel.style.display = '';
      cvs.parentElement.style.display = '';
      startAnim();
    } else if (m === 'explore') {
      cvs.parentElement.style.display = '';
      catRow.style.display = '';
      itemSelector.style.display = '';
      buildConceptGrid();
      if (selectedConcept) {
        showConceptInfo(selectedConcept);
        drawExploreDiagram(selectedConcept.diagram);
      } else {
        clearCanvas();
        ctx.font = '16px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Select a concept to view its diagram', W / 2, H / 2);
      }
    } else if (m === 'practice') {
      cvs.parentElement.style.display = 'none';
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      if (!curProblem) newPracticeProblem();
    } else if (m === 'quiz') {
      cvs.parentElement.style.display = 'none';
      quizBar.style.display = '';
      startQuiz();
    }
  }

  modeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    modeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    setMode(m);
  });

  /* ================================================================
     CHARGE / DISCHARGE TABS
     ================================================================ */

  chargeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    chargeMode = e.target.dataset.charge;
    chargeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    resetSim();
  });

  /* ================================================================
     SLIDERS
     ================================================================ */

  rSlider.addEventListener('input', function () {
    resistance = parseInt(this.value);
    rValEl.innerHTML = resistance + ' &Omega;';
    resetSim();
  });

  cSlider.addEventListener('input', function () {
    capacitance = parseInt(this.value);
    cValEl.innerHTML = capacitance + ' &mu;F';
    resetSim();
  });

  vSlider.addEventListener('input', function () {
    voltage = parseFloat(this.value);
    vValEl.textContent = voltage.toFixed(1) + ' V';
    resetSim();
  });

  /* ================================================================
     RESET BUTTON
     ================================================================ */

  btnReset.addEventListener('click', function () {
    resetSim();
  });

  /* ================================================================
     PRESETS
     ================================================================ */

  var presets = {
    fast:     { r: 10,    c: 100,  v: 12 },
    standard: { r: 1000,  c: 100,  v: 12 },
    slow:     { r: 10000, c: 1000, v: 12 },
    filter:   { r: 1000,  c: 10,   v: 12 }
  };

  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = presets[btn.dataset.preset];
      if (!p) return;

      document.querySelectorAll('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      resistance = p.r; rSlider.value = p.r; rValEl.innerHTML = p.r + ' &Omega;';
      capacitance = p.c; cSlider.value = p.c; cValEl.innerHTML = p.c + ' &mu;F';
      voltage = p.v; vSlider.value = p.v; vValEl.textContent = p.v.toFixed(1) + ' V';

      resetSim();
    });
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildConceptGrid();
    itemInfo.style.display = 'none';
    selectedConcept = null;
    clearCanvas();
    ctx.font = '16px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Select a concept to view its diagram', W / 2, H / 2);
  });

  function buildConceptGrid() {
    conceptGrid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    filtered.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept && selectedConcept.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        conceptGrid.querySelectorAll('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        selectedConcept = c;
        showConceptInfo(c);
        drawExploreDiagram(c.diagram);
      });
      conceptGrid.appendChild(btn);
    });
  }

  function showConceptInfo(c) {
    itemInfo.style.display = '';
    var catLabels = { fundamentals: 'Fundamentals', response: 'Time Response', applications: 'Applications' };
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + (catLabels[c.cat] || c.cat) + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Example Calculation</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step">' + s + '</p>';
      });
      html += '</div>';
    }

    itemInfo.innerHTML = html;
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function newPracticeProblem() {
    var idx = randInt(0, PROBLEM_GEN.length - 1);
    curProblem = PROBLEM_GEN[idx]();
    pAnswered = false;

    ppPrompt.textContent = curProblem.prompt;
    ppUnit.textContent = curProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (pAnswered) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppInput.focus(); return; }

    pAnswered = true;
    pTotal++;
    var tol = curProblem.tol || 0.5;
    var correct = Math.abs(val - curProblem.answer) <= tol;

    if (correct) {
      pScore++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + curProblem.answer + ' ' + curProblem.unit;
      ppFeedback.className = 'feedback err';
    }

    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';
    pbarScoreVal.textContent = pScore + ' / ' + pTotal;

    /* Show solution steps */
    var solHtml = '<h4>Solution</h4>';
    curProblem.steps.forEach(function (s) {
      solHtml += '<p class="sol-step">' + s + '</p>';
    });
    ppSolution.innerHTML = solHtml;
    ppSolution.style.display = '';
  });

  ppNext.addEventListener('click', function () { newPracticeProblem(); });

  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!pAnswered) ppCheck.click();
      else ppNext.click();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  function startQuiz() {
    quizPool = genQuizPool();
    quizSet = quizPool.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    quizHistory = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    showQuizQuestion();
  }

  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, i) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer">';
      html += '<span class="qi-unit">' + q.unit + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
    }

    html += '<div style="margin-top:12px;display:flex;align-items:center;gap:10px;">';
    html += '<span class="quiz-feedback" id="quiz-fb"></span>';
    html += '<button class="btn btn-ghost" id="quiz-next" style="display:none;margin-left:auto;">Next \u2192</button>';
    html += '</div>';

    quizPanel.innerHTML = html;

    /* Bind events */
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          submitQuizMCQ(parseInt(btn.dataset.idx));
        });
      });
    } else {
      var qiSubmit = document.getElementById('qi-submit');
      var qiInput = document.getElementById('qi-input');
      qiSubmit.addEventListener('click', function () { submitQuizNumeric(); });
      qiInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitQuizNumeric(); });
      qiInput.focus();
    }

    var nextBtn = document.getElementById('quiz-next');
    nextBtn.addEventListener('click', function () { nextQuizQuestion(); });
  }

  function submitQuizMCQ(chosen) {
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var correct = chosen === q.correct;
    if (correct) quizScore++;

    quizHistory.push({ prompt: q.prompt, given: q.options[chosen], correct: q.options[q.correct], ok: correct });

    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b) {
      b.classList.add('locked');
      var idx = parseInt(b.dataset.idx);
      if (idx === q.correct) b.classList.add('correct');
      else if (idx === chosen && !correct) b.classList.add('wrong');
    });

    var fb = document.getElementById('quiz-fb');
    fb.textContent = correct ? 'Correct!' : 'Incorrect!';
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    document.getElementById('quiz-next').style.display = '';
  }

  function submitQuizNumeric() {
    if (quizAnswered) return;
    var q = quizSet[quizIdx];
    var input = document.getElementById('qi-input');
    var val = parseFloat(input.value);
    if (isNaN(val)) { input.focus(); return; }

    quizAnswered = true;
    var tol = q.tol || 0.5;
    var correct = Math.abs(val - q.answer) <= tol;
    if (correct) quizScore++;

    quizHistory.push({ prompt: q.prompt, given: val + ' ' + q.unit, correct: q.answer + ' ' + q.unit, ok: correct });

    var fb = document.getElementById('quiz-fb');
    if (correct) {
      fb.textContent = 'Correct!';
      fb.className = 'quiz-feedback ok';
    } else {
      fb.textContent = 'Incorrect. Answer: ' + q.answer + ' ' + q.unit;
      fb.className = 'quiz-feedback err';
    }

    input.disabled = true;
    document.getElementById('qi-submit').disabled = true;
    document.getElementById('quiz-next').style.display = '';
  }

  function nextQuizQuestion() {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) {
      showQuizResult();
    } else {
      showQuizQuestion();
    }
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var cls = pct === 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct === 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605\u2606' : '\u2605\u2606\u2606';
    var verdict = pct === 1 ? 'Perfect score!' : pct >= 0.6 ? 'Good work!' : 'Keep practising!';

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</span><span class="qr-verdict">' + verdict + '</span></div>';
    html += '</div>';

    html += '<div class="qr-rows">';
    quizHistory.forEach(function (h, i) {
      html += '<div class="qr-row ' + (h.ok ? 'ok' : 'err') + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + h.given + '</strong> \u2014 Correct: ' + h.correct + '</span>';
      html += '<span class="qr-mark">' + (h.ok ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="quiz-retry">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('quiz-retry').addEventListener('click', function () {
      quizResult.style.display = 'none';
      startQuiz();
    });
  }

  /* ================================================================
     INIT
     ================================================================ */

  recalcTau();
  simRunning = true;
  setMode('simulate');

})();
