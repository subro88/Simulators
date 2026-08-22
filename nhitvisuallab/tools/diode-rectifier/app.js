(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS (6 concepts, 2 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Basics ──────────────────────────────────────────────────── */
    {
      id: 'pn-junction', name: 'PN Junction Diode', symbol: 'I = Is(e^(V/Vt)-1)',
      formula: 'I = Is (e^(V/nVt) - 1)', unit: 'A, V',
      cat: 'basics',
      desc: 'A PN junction diode is formed when P-type and N-type semiconductor materials are joined together. At the junction, a depletion region forms that acts as a barrier to current flow. The depletion region width depends on the applied voltage. Silicon diodes have a forward voltage drop of approximately 0.7 V, while germanium diodes drop about 0.3 V. The Shockley diode equation describes the exponential relationship between current and voltage.',
      diagram: 'pnJunction',
      example: { problem: 'A silicon diode has Is = 10 nA and is forward biased at 0.65 V at 25\u00B0C (Vt = 26 mV). Find the diode current (assume n=1).', steps: ['I = Is(e^(V/Vt) - 1)', 'I = 10\u00D710\u207B\u2079 \u00D7 (e^(0.65/0.026) - 1)', 'I = 10\u00D710\u207B\u2079 \u00D7 (e^25 - 1)', 'I = 10\u00D710\u207B\u2079 \u00D7 7.2\u00D710\u00B9\u2070', 'I \u2248 72 mA'], answer: 72, unit: 'mA' }
    },
    {
      id: 'forward-reverse', name: 'Forward & Reverse Bias', symbol: 'Vf \u2248 0.7 V',
      formula: 'Forward: V_anode > V_cathode + 0.7 V \u2192 conducts', unit: 'V',
      cat: 'basics',
      desc: 'When the anode of a diode is connected to a higher potential than the cathode (forward bias), the depletion region narrows and current flows through the diode with a small voltage drop (0.7 V for Si). When the cathode is at a higher potential (reverse bias), the depletion region widens and essentially no current flows. If the reverse voltage exceeds the breakdown voltage, the diode conducts heavily in reverse (Zener effect or avalanche breakdown).',
      diagram: 'forwardReverse',
      example: { problem: 'A Si diode is in series with a 470 \u03A9 resistor and 5 V supply. Find the current.', steps: ['V_R = V_supply - V_diode', 'V_R = 5 - 0.7 = 4.3 V', 'I = V_R / R = 4.3 / 470', 'I = 9.15 mA'], answer: 9.15, unit: 'mA' }
    },
    {
      id: 'vi-characteristics', name: 'V-I Characteristics', symbol: 'I vs V curve',
      formula: 'I = Is \u00D7 e^(V/nVt) for V >> Vt', unit: 'A, V',
      cat: 'basics',
      desc: 'The voltage-current (V-I) characteristic curve of a diode shows three distinct regions: (1) Forward bias region where current increases exponentially beyond the knee voltage (~0.5-0.7 V for Si), (2) Reverse bias region where a tiny reverse saturation current (Is) flows, and (3) Breakdown region where current increases rapidly at the breakdown voltage. The curve is non-linear and temperature-dependent \u2014 forward voltage decreases by about 2 mV/\u00B0C.',
      diagram: 'viChar',
      example: { problem: 'A diode has Vf = 0.7 V at 25\u00B0C. What is Vf at 75\u00B0C? (temp coefficient = -2 mV/\u00B0C)', steps: ['\u0394T = 75 - 25 = 50\u00B0C', '\u0394V = -2 mV/\u00B0C \u00D7 50\u00B0C = -100 mV', 'Vf(75\u00B0C) = 0.7 - 0.1', 'Vf = 0.6 V'], answer: 0.6, unit: 'V' }
    },

    /* ── Circuits ─────────────────────────────────────────────────── */
    {
      id: 'half-wave', name: 'Half-Wave Rectifier', symbol: 'Vdc = Vp/\u03C0',
      formula: 'V_dc = V_p / \u03C0 \u2248 0.318 V_p', unit: 'V',
      cat: 'circuits',
      desc: 'A half-wave rectifier uses a single diode to pass only positive (or negative) half-cycles of an AC input signal. During the positive half-cycle, the diode is forward biased and conducts; during the negative half-cycle, the diode is reverse biased and blocks. The average DC output is Vp/\u03C0 (about 31.8% of peak voltage). The PIV rating of the diode must be at least Vp. Efficiency is 40.6% and ripple frequency equals the input frequency.',
      diagram: 'halfWave',
      example: { problem: 'AC input has Vp = 15 V. Find V_dc and PIV for a half-wave rectifier (Si diode).', steps: ['V_p_out = V_p - V_diode = 15 - 0.7 = 14.3 V', 'V_dc = V_p_out / \u03C0 = 14.3 / 3.1416', 'V_dc = 4.55 V', 'PIV = V_p = 15 V'], answer: 4.55, unit: 'V' }
    },
    {
      id: 'full-wave', name: 'Full-Wave Rectifier', symbol: 'Vdc = 2Vp/\u03C0',
      formula: 'V_dc = 2V_p / \u03C0 \u2248 0.637 V_p', unit: 'V',
      cat: 'circuits',
      desc: 'A full-wave centre-tap rectifier uses a centre-tapped transformer and two diodes to rectify both half-cycles of the AC input. During each half-cycle, one diode conducts while the other is reverse biased. The output has twice the ripple frequency of a half-wave rectifier, producing smoother DC. The average output is 2Vp/\u03C0, efficiency is 81.2%, but PIV = 2Vp because when one diode conducts the other sees twice the peak voltage across the transformer.',
      diagram: 'fullWave',
      example: { problem: 'Centre-tap transformer gives Vp = 12 V per half. Find V_dc and PIV (Si diodes).', steps: ['V_p_out = V_p - V_diode = 12 - 0.7 = 11.3 V', 'V_dc = 2 \u00D7 V_p_out / \u03C0 = 2 \u00D7 11.3 / 3.1416', 'V_dc = 7.19 V', 'PIV = 2 \u00D7 V_p = 2 \u00D7 12 = 24 V'], answer: 7.19, unit: 'V' }
    },
    {
      id: 'bridge-rect', name: 'Bridge Rectifier', symbol: 'Vdc = 2Vp/\u03C0 - 1.4',
      formula: 'V_dc = 2(V_p - 1.4) / \u03C0', unit: 'V',
      cat: 'circuits',
      desc: 'A bridge rectifier uses four diodes arranged in a bridge configuration to provide full-wave rectification without requiring a centre-tapped transformer. During each half-cycle, two diodes conduct in series, resulting in a total voltage drop of 2\u00D70.7 = 1.4 V for silicon diodes. The average output is 2(Vp - 1.4)/\u03C0, PIV = Vp (lower than centre-tap), and efficiency is approximately 81.2%. The bridge rectifier is the most widely used rectifier topology in practice.',
      diagram: 'bridge',
      example: { problem: 'AC input Vp = 20 V into a bridge rectifier. Find V_dc and PIV (Si diodes).', steps: ['V_p_out = V_p - 2\u00D7V_diode = 20 - 1.4 = 18.6 V', 'V_dc = 2 \u00D7 V_p_out / \u03C0 = 2 \u00D7 18.6 / 3.1416', 'V_dc = 11.84 V', 'PIV = V_p = 20 V'], answer: 11.84, unit: 'V' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (8)
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }

  var PROBLEM_GEN = [
    /* 0 — V_dc half-wave */
    function () {
      var Vp = randInt(5, 24);
      var Vpout = round2(Vp - 0.7);
      var Vdc = round2(Vpout / Math.PI);
      return { prompt: 'Half-wave rectifier with V_peak = ' + Vp + ' V (Si diode). Find V_dc (V).', steps: ['V_p_out = V_p - 0.7 = ' + Vp + ' - 0.7 = ' + Vpout + ' V', 'V_dc = V_p_out / \u03C0', 'V_dc = ' + Vpout + ' / 3.1416', 'V_dc = ' + Vdc + ' V'], answer: Vdc, unit: 'V', tol: 0.15 };
    },
    /* 1 — V_dc full-wave (centre-tap) */
    function () {
      var Vp = randInt(5, 20);
      var Vpout = round2(Vp - 0.7);
      var Vdc = round2(2 * Vpout / Math.PI);
      return { prompt: 'Full-wave centre-tap rectifier, V_p = ' + Vp + ' V per half (Si diodes). Find V_dc (V).', steps: ['V_p_out = V_p - 0.7 = ' + Vpout + ' V', 'V_dc = 2 \u00D7 V_p_out / \u03C0', 'V_dc = 2 \u00D7 ' + Vpout + ' / 3.1416', 'V_dc = ' + Vdc + ' V'], answer: Vdc, unit: 'V', tol: 0.15 };
    },
    /* 2 — V_dc bridge */
    function () {
      var Vp = randInt(8, 24);
      var Vpout = round2(Vp - 1.4);
      var Vdc = round2(2 * Vpout / Math.PI);
      return { prompt: 'Bridge rectifier with V_peak = ' + Vp + ' V (Si diodes). Find V_dc (V).', steps: ['V_p_out = V_p - 2\u00D70.7 = ' + Vp + ' - 1.4 = ' + Vpout + ' V', 'V_dc = 2 \u00D7 V_p_out / \u03C0', 'V_dc = 2 \u00D7 ' + Vpout + ' / 3.1416', 'V_dc = ' + Vdc + ' V'], answer: Vdc, unit: 'V', tol: 0.15 };
    },
    /* 3 — PIV calculation */
    function () {
      var types = ['half', 'center', 'bridge'];
      var ti = randInt(0, 2);
      var type = types[ti];
      var Vp = randInt(5, 24);
      var piv, label;
      if (type === 'half') { piv = Vp; label = 'half-wave'; }
      else if (type === 'center') { piv = 2 * Vp; label = 'full-wave centre-tap'; }
      else { piv = Vp; label = 'bridge'; }
      return { prompt: 'Find the PIV for a ' + label + ' rectifier with V_peak = ' + Vp + ' V.', steps: [type === 'center' ? 'PIV = 2 \u00D7 V_p = 2 \u00D7 ' + Vp : 'PIV = V_p = ' + Vp, 'PIV = ' + piv + ' V'], answer: piv, unit: 'V', tol: 0.1 };
    },
    /* 4 — Ripple voltage with capacitor (half-wave) */
    function () {
      var Vp = randInt(8, 20);
      var f = 50;
      var R = randInt(1, 10) * 100;
      var C = randInt(1, 10) * 100; /* uF */
      var Idc = round2((Vp - 0.7) / (Math.PI * R) * 1000); /* approx mA */
      var Vr = round2((Vp - 0.7) / (f * R * C * 1e-6));
      return { prompt: 'Half-wave rectifier: V_p = ' + Vp + ' V, f = ' + f + ' Hz, R = ' + R + ' \u03A9, C = ' + C + ' \u00B5F. Find V_ripple (V). Use V_rip = Vp/(fRC).', steps: ['V_p_out \u2248 ' + round2(Vp - 0.7) + ' V', 'V_ripple = V_p_out / (f \u00D7 R \u00D7 C)', 'V_ripple = ' + round2(Vp - 0.7) + ' / (' + f + ' \u00D7 ' + R + ' \u00D7 ' + C + '\u00D710\u207B\u2076)', 'V_ripple = ' + Vr + ' V'], answer: Vr, unit: 'V', tol: 0.3 };
    },
    /* 5 — Ripple voltage with capacitor (full-wave) */
    function () {
      var Vp = randInt(8, 20);
      var f = 50;
      var R = randInt(1, 10) * 100;
      var C = randInt(1, 10) * 100; /* uF */
      var Vr = round2((Vp - 0.7) / (2 * f * R * C * 1e-6));
      return { prompt: 'Full-wave rectifier: V_p = ' + Vp + ' V, f = ' + f + ' Hz, R = ' + R + ' \u03A9, C = ' + C + ' \u00B5F. Find V_ripple (V). Use V_rip = Vp/(2fRC).', steps: ['V_p_out \u2248 ' + round2(Vp - 0.7) + ' V', 'V_ripple = V_p_out / (2 \u00D7 f \u00D7 R \u00D7 C)', 'V_ripple = ' + round2(Vp - 0.7) + ' / (2 \u00D7 ' + f + ' \u00D7 ' + R + ' \u00D7 ' + C + '\u00D710\u207B\u2076)', 'V_ripple = ' + Vr + ' V'], answer: Vr, unit: 'V', tol: 0.3 };
    },
    /* 6 — Required capacitance for max ripple */
    function () {
      var Vp = randInt(10, 20);
      var f = 50;
      var R = randInt(1, 5) * 1000;
      var maxRip = randInt(1, 5) * 0.5;
      var Vpout = round2(Vp - 0.7);
      var C = round2(Vpout / (2 * f * R * maxRip) * 1e6);
      return { prompt: 'Full-wave rectifier: V_p = ' + Vp + ' V, f = ' + f + ' Hz, R = ' + R + ' \u03A9. Find the minimum C (\u00B5F) for ripple \u2264 ' + maxRip + ' V.', steps: ['V_rip = V_p_out / (2fRC)', 'C = V_p_out / (2 \u00D7 f \u00D7 R \u00D7 V_rip)', 'C = ' + Vpout + ' / (2 \u00D7 ' + f + ' \u00D7 ' + R + ' \u00D7 ' + maxRip + ')', 'C = ' + C + ' \u00B5F'], answer: C, unit: '\u00B5F', tol: 2 };
    },
    /* 7 — Efficiency */
    function () {
      var isHalf = Math.random() < 0.5;
      var eff = isHalf ? 40.6 : 81.2;
      var label = isHalf ? 'half-wave' : 'full-wave';
      var Vp = randInt(8, 24);
      var R = randInt(1, 10) * 100;
      var Vpout = isHalf ? round2(Vp - 0.7) : round2(Vp - 0.7);
      var Vdc = isHalf ? round2(Vpout / Math.PI) : round2(2 * Vpout / Math.PI);
      var Idc = round2(Vdc / R * 1000);
      var Pdc = round2(Vdc * Vdc / R);
      return { prompt: 'What is the theoretical maximum efficiency of a ' + label + ' rectifier? (in %)', steps: [isHalf ? 'Half-wave: \u03B7_max = 40.6%' : 'Full-wave: \u03B7_max = 81.2%', 'This is the ratio P_dc / P_ac (max)', '\u03B7 = ' + eff + '%'], answer: eff, unit: '%', tol: 1 };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15 questions: 10 MCQ + 5 numeric)
     ================================================================ */

  function genQuizPool() {
    var pool = [];

    /* --- 10 MCQ questions --- */
    pool.push({ type: 'mcq', prompt: 'A silicon diode has a forward voltage drop of approximately:', options: ['0.7 V', '0.3 V', '1.4 V', '1.0 V'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'In a half-wave rectifier, the output ripple frequency equals:', options: ['The input frequency f', '2f', 'f/2', '4f'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'In a full-wave rectifier, the output ripple frequency equals:', options: ['2f', 'f', 'f/2', '4f'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The PIV of a diode in a bridge rectifier is:', options: ['Vp', '2Vp', 'Vp/2', 'Vp - 0.7'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The PIV of a diode in a centre-tap full-wave rectifier is:', options: ['2Vp', 'Vp', 'Vp/2', 'Vp - 0.7'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'A bridge rectifier uses how many diodes?', options: ['4', '2', '1', '6'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Adding a smoothing capacitor to a rectifier:', options: ['Reduces ripple voltage', 'Increases ripple voltage', 'Has no effect on ripple', 'Reduces DC voltage to zero'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The maximum efficiency of a half-wave rectifier is:', options: ['40.6%', '81.2%', '50%', '100%'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'When a diode is reverse biased:', options: ['It blocks current (ideally zero current)', 'It conducts heavily', 'It has 0.7 V drop', 'It acts as a short circuit'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The average DC voltage of a full-wave rectifier (no diode drop) is:', options: ['2Vp/\u03C0', 'Vp/\u03C0', 'Vp/2', 'Vp'], correct: 0 });

    /* --- 5 numeric questions --- */
    var Vp1 = randInt(8, 20);
    pool.push({ type: 'numeric', prompt: 'Half-wave rectifier, Vp = ' + Vp1 + ' V (ideal diode). V_dc (V)?', answer: round2(Vp1 / Math.PI), unit: 'V', tol: 0.15 });

    var Vp2 = randInt(8, 20);
    pool.push({ type: 'numeric', prompt: 'Full-wave rectifier, Vp = ' + Vp2 + ' V (ideal diode). V_dc (V)?', answer: round2(2 * Vp2 / Math.PI), unit: 'V', tol: 0.15 });

    var Vp3 = randInt(10, 24);
    pool.push({ type: 'numeric', prompt: 'Bridge rectifier with Si diodes, Vp = ' + Vp3 + ' V. V_peak_out (V)?', answer: round2(Vp3 - 1.4), unit: 'V', tol: 0.1 });

    var Vp4 = randInt(8, 20);
    pool.push({ type: 'numeric', prompt: 'Centre-tap rectifier, Vp = ' + Vp4 + ' V. PIV of each diode (V)?', answer: 2 * Vp4, unit: 'V', tol: 0.1 });

    var Vp5 = randInt(10, 20);
    var R5 = randInt(1, 5) * 1000;
    var C5 = randInt(1, 10) * 100;
    var Vrip5 = round2((Vp5 - 0.7) / (2 * 50 * R5 * C5 * 1e-6));
    pool.push({ type: 'numeric', prompt: 'Full-wave, Vp=' + Vp5 + 'V, f=50Hz, R=' + R5 + '\u03A9, C=' + C5 + '\u00B5F. Ripple V?', answer: Vrip5, unit: 'V', tol: 0.3 });

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

  function resizeCanvas() {
    var rect = cvs.parentElement.getBoundingClientRect();
    W = Math.max(400, Math.floor(rect.width - 16)); /* subtract padding */
    H = Math.max(280, Math.floor(W * 0.53));
    fitCanvas();
    cvs.style.width = W + 'px';
    cvs.style.height = H + 'px';
  }
  resizeCanvas();
  window.addEventListener('resize', function () { resizeCanvas(); });

  var modeTabs = document.getElementById('mode-tabs');
  var circuitTabs = document.getElementById('circuit-tabs');
  var simPanel = document.getElementById('sim-panel');

  var vpSlider = document.getElementById('vp-slider');
  var freqSlider = document.getElementById('freq-slider');
  var rlSlider = document.getElementById('rl-slider');
  var cfSlider = document.getElementById('cf-slider');
  var vpValEl = document.getElementById('vp-val');
  var freqValEl = document.getElementById('freq-val');
  var rlValEl = document.getElementById('rl-val');
  var cfValEl = document.getElementById('cf-val');

  var chkCap = document.getElementById('chk-cap');
  var chkCurrent = document.getElementById('chk-current');

  /* Readout elements */
  var rVdc = document.getElementById('r-vdc');
  var rVrip = document.getElementById('r-vrip');
  var rVpk = document.getElementById('r-vpk');
  var rIdc = document.getElementById('r-idc');
  var rRf = document.getElementById('r-rf');
  var rEff = document.getElementById('r-eff');
  var rPiv = document.getElementById('r-piv');
  var rPower = document.getElementById('rPower');

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
  var rectType = 'half'; /* half, center, bridge */
  var Vpeak = 12;
  var freq = 50;
  var Rload = 1000;
  var Cfilter = 100; /* uF */
  var useCap = true;
  var showCurrentFlow = true;

  /* Diode type */
  var diodeType = 'si';
  var DIODE_VF = { si: 0.7, ge: 0.3, schottky: 0.2, led: 1.8 };

  /* Presets */
  var PRESETS = {
    usb:   { label: 'USB 5V Supply',   type: 'bridge', Vp: 7.5,  freq: 50,  R: 500,  C: 470,  diode: 'schottky' },
    audio: { label: '12V Audio Amp',   type: 'bridge', Vp: 15,   freq: 50,  R: 1000, C: 1000, diode: 'si' },
    led:   { label: 'LED Driver',      type: 'half',   Vp: 5,    freq: 50,  R: 220,  C: 100,  diode: 'si' },
    phone: { label: 'Phone Charger',   type: 'bridge', Vp: 8,    freq: 50,  R: 300,  C: 680,  diode: 'schottky' }
  };

  /* Animation state */
  var animFrame = null;
  var animTime = 0;

  /* Physics results */
  var phys = {};

  /* Practice state */
  var pScore = 0, pTotal = 0, curProblem = null, pAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 15;
  var quizPool = [], quizSet = [], quizIdx = 0, quizScore = 0, quizAnswered = false;
  var quizHistory = [];

  /* Explore state */
  var exploreCat = 'basics';
  var selectedConcept = null;

  /* ================================================================
     PHYSICS CALCULATIONS
     ================================================================ */

  function calcPhysics() {
    var Vf = DIODE_VF[diodeType] || 0.7;
    var VpOut, Vdc, Vrip, Idc, PIV, eff, ripFactor;
    var nDiodes; /* number of series diodes per path */
    var isFullWave = (rectType === 'center' || rectType === 'bridge');

    if (rectType === 'half') {
      nDiodes = 1;
      VpOut = Math.max(0, Vpeak - Vf);
      Vdc = VpOut / Math.PI;
      PIV = Vpeak;
      eff = 40.6;
    } else if (rectType === 'center') {
      nDiodes = 2; /* 2 diodes total, 1 conducts per half-cycle */
      VpOut = Math.max(0, Vpeak - Vf);
      Vdc = 2 * VpOut / Math.PI;
      PIV = 2 * Vpeak;
      eff = 81.2;
    } else { /* bridge */
      nDiodes = 2;
      VpOut = Math.max(0, Vpeak - 2 * Vf);
      Vdc = 2 * VpOut / Math.PI;
      PIV = Vpeak;
      eff = 81.2;
    }

    Idc = Vdc / Rload; /* amps */

    /* Ripple calculation */
    if (useCap && Cfilter > 0) {
      var Cf = Cfilter * 1e-6;
      if (isFullWave) {
        Vrip = VpOut / (2 * freq * Rload * Cf);
      } else {
        Vrip = VpOut / (freq * Rload * Cf);
      }
      /* With capacitor, Vdc is closer to Vpeak minus half ripple */
      Vdc = VpOut - Vrip / 2;
      if (Vdc < 0) Vdc = 0;
      Idc = Vdc / Rload;
    } else {
      /* Ripple without capacitor (using ideal formula) */
      if (isFullWave) {
        Vrip = VpOut * 0.483; /* r = 0.483 for full-wave */
      } else {
        Vrip = VpOut * 1.21; /* r = 1.21 for half-wave */
      }
    }

    ripFactor = Vdc > 0 ? Vrip / Vdc : 0;

    var power = Math.max(0, Vdc) * (Idc * 1000); /* mW: Vdc(V) * Idc(mA) */

    phys = {
      VpOut: VpOut,
      Vdc: Math.max(0, Vdc),
      Vrip: Math.max(0, Vrip),
      Idc: Idc,
      PIV: PIV,
      eff: eff,
      ripFactor: ripFactor,
      nDiodes: nDiodes,
      isFullWave: isFullWave,
      power: power
    };
  }

  function updateReadouts() {
    rVdc.textContent = phys.Vdc.toFixed(2);
    rVrip.textContent = phys.Vrip.toFixed(2);
    rVpk.textContent = phys.VpOut.toFixed(2);
    rIdc.textContent = (phys.Idc * 1000).toFixed(1);
    rRf.textContent = phys.ripFactor.toFixed(3);
    rEff.textContent = phys.eff.toFixed(1);
    rPiv.textContent = phys.PIV.toFixed(1);
    rPower.textContent = phys.power.toFixed(1);
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
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawWirePath(points, color) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.strokeStyle = color || '#42a5f5';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  /* Draw diode symbol: triangle with bar */
  function drawDiode(x, y, angle, conducting) {
    var size = 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    /* Triangle (anode side) */
    ctx.beginPath();
    ctx.moveTo(-size, -size * 0.7);
    ctx.lineTo(-size, size * 0.7);
    ctx.lineTo(size * 0.6, 0);
    ctx.closePath();
    ctx.fillStyle = conducting ? 'rgba(244,67,54,0.9)' : 'rgba(244,67,54,0.35)';
    ctx.fill();
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Bar (cathode side) */
    ctx.beginPath();
    ctx.moveTo(size * 0.6, -size * 0.7);
    ctx.lineTo(size * 0.6, size * 0.7);
    ctx.strokeStyle = '#f44336';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Connection lines */
    ctx.beginPath();
    ctx.moveTo(-size - 8, 0);
    ctx.lineTo(-size, 0);
    ctx.moveTo(size * 0.6, 0);
    ctx.lineTo(size * 0.6 + 8, 0);
    ctx.strokeStyle = conducting ? '#f44336' : 'rgba(244,67,54,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /* Draw AC source symbol */
  function drawACSource(x, y) {
    var r = 22;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Sine wave inside */
    ctx.beginPath();
    for (var i = -r + 4; i <= r - 4; i++) {
      var sx = x + i;
      var sy = y - Math.sin((i / (r - 4)) * Math.PI) * 8;
      if (i === -r + 4) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Label */
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'center';
    ctx.fillText('AC', x, y + r + 14);
    ctx.fillText(Vpeak.toFixed(1) + 'Vp', x, y + r + 26);
  }

  /* Draw resistor (horizontal) */
  function drawResistor(x, y, label) {
    var peaks = 5, amp = 10, segW = 7;
    var totalW = peaks * segW;

    ctx.beginPath();
    ctx.moveTo(x - totalW / 2 - 10, y);
    ctx.lineTo(x - totalW / 2, y);
    for (var i = 0; i < peaks; i++) {
      var px = x - totalW / 2 + i * segW + segW / 2;
      var py = (i % 2 === 0) ? y - amp : y + amp;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x + totalW / 2, y);
    ctx.lineTo(x + totalW / 2 + 10, y);

    ctx.strokeStyle = '#ffa726';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#ffa726';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - amp - 6);
  }

  /* Draw capacitor symbol */
  function drawCapacitor(x, y) {
    var gap = 5, plateH = 16;
    ctx.beginPath();
    ctx.moveTo(x - gap, y - plateH);
    ctx.lineTo(x - gap, y + plateH);
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + gap, y - plateH);
    ctx.lineTo(x + gap, y + plateH);
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 3;
    ctx.stroke();

    /* Connection lines */
    ctx.beginPath();
    ctx.moveTo(x - gap - 12, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + gap + 12, y);
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'center';
    ctx.fillText(Cfilter + '\u00B5F', x, y + plateH + 14);
  }

  /* Draw transformer symbol (for centre-tap) */
  function drawTransformer(x, y) {
    var coilR = 8, coils = 3;
    /* Primary */
    for (var i = 0; i < coils; i++) {
      ctx.beginPath();
      ctx.arc(x - 12, y - 20 + i * 20, coilR, -Math.PI / 2, Math.PI / 2);
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    /* Core lines */
    ctx.beginPath();
    ctx.moveTo(x - 2, y - 30);
    ctx.lineTo(x - 2, y + 30);
    ctx.moveTo(x + 2, y - 30);
    ctx.lineTo(x + 2, y + 30);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Secondary */
    for (var j = 0; j < coils; j++) {
      ctx.beginPath();
      ctx.arc(x + 12, y - 20 + j * 20, coilR, Math.PI / 2, -Math.PI / 2);
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    /* Centre tap dot */
    ctx.beginPath();
    ctx.arc(x + 22, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3ddc84';
    ctx.fill();
  }

  function drawNode(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#dde3f0';
    ctx.fill();
  }

  /* ================================================================
     DRAWING — WAVEFORMS (right half of canvas)
     ================================================================ */

  function drawWaveforms() {
    var wvX = Math.round(W * 0.522); /* left edge of waveform area */
    var wvW = W - wvX - Math.round(W * 0.022); /* width */
    var topY = Math.round(H * 0.0625);  /* top waveform top */
    var topH = Math.round(H * 0.375); /* height of top waveform box */
    var gap = Math.round(H * 0.083);
    var botY = topY + topH + gap; /* bottom waveform top */
    var botH = topH;
    var pad = 10;

    /* --- Background boxes --- */
    ctx.fillStyle = 'rgba(13,17,23,0.6)';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    /* Top box */
    ctx.fillRect(wvX, topY, wvW, topH);
    ctx.strokeRect(wvX, topY, wvW, topH);
    /* Bottom box */
    ctx.fillRect(wvX, botY, wvW, botH);
    ctx.strokeRect(wvX, botY, wvW, botH);

    /* --- Labels --- */
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'left';
    ctx.fillText('INPUT (AC)', wvX + 8, topY + 16);

    ctx.fillStyle = '#f44336';
    ctx.fillText('OUTPUT (DC)', wvX + 8, botY + 16);

    /* --- Grid lines --- */
    ctx.strokeStyle = 'rgba(42,48,80,0.5)';
    ctx.lineWidth = 0.5;
    /* Horizontal centre lines */
    var topMid = topY + topH / 2;
    var botMid = botY + botH / 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(wvX + pad, topMid);
    ctx.lineTo(wvX + wvW - pad, topMid);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wvX + pad, botMid + botH * 0.3);
    ctx.lineTo(wvX + wvW - pad, botMid + botH * 0.3);
    ctx.stroke();
    ctx.setLineDash([]);

    /* --- Axis labels --- */
    ctx.font = '9px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'right';
    ctx.fillText('+' + Vpeak.toFixed(0) + 'V', wvX + wvW - 4, topMid - topH * 0.3 + 4);
    ctx.fillText('-' + Vpeak.toFixed(0) + 'V', wvX + wvW - 4, topMid + topH * 0.3 + 4);
    ctx.fillText('0V', wvX + wvW - 4, topMid + 4);

    if (phys.VpOut > 0) {
      ctx.fillText('+' + phys.VpOut.toFixed(1) + 'V', wvX + wvW - 4, botMid - botH * 0.2);
    }

    /* --- Draw input AC waveform --- */
    var drawW = wvW - 2 * pad;
    var drawX = wvX + pad;
    var inputAmp = topH * 0.3;
    var periods = 3;

    ctx.beginPath();
    for (var i = 0; i <= drawW; i++) {
      var t = (i / drawW) * periods * 2 * Math.PI;
      var v = Math.sin(t + animTime * 0.03);
      var py = topMid - v * inputAmp;
      if (i === 0) ctx.moveTo(drawX + i, py);
      else ctx.lineTo(drawX + i, py);
    }
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* --- Draw output rectified waveform --- */
    var outAmp = botH * 0.3;
    var baseline = botMid + botH * 0.3; /* bottom baseline */
    var Vf = DIODE_VF[diodeType] || 0.7;
    var nDiodes = phys.nDiodes;
    var isFullWave = phys.isFullWave;

    /* Pre-compute output waveform points for capacitor smoothing */
    var outPoints = [];
    for (var i2 = 0; i2 <= drawW; i2++) {
      var t2 = (i2 / drawW) * periods * 2 * Math.PI;
      var vin = Math.sin(t2 + animTime * 0.03);
      var vout;

      if (isFullWave) {
        vout = Math.abs(vin);
      } else {
        vout = vin > 0 ? vin : 0;
      }

      /* Apply diode drops */
      if (vout > 0) {
        var diodeDrop = (rectType === 'bridge') ? 2 * Vf : Vf;
        vout = Math.max(0, vout * Vpeak - diodeDrop) / Vpeak;
      }

      outPoints.push(vout);
    }

    /* With capacitor: simulate RC discharge */
    if (useCap && Cfilter > 0) {
      var Cf = Cfilter * 1e-6;
      var tau = Rload * Cf;
      var dt = (periods / freq) / drawW; /* time per pixel */
      var capV = 0;

      var smoothed = [];
      for (var k = 0; k < outPoints.length; k++) {
        var rectV = outPoints[k] * phys.VpOut; /* actual voltage */
        if (rectV > capV) {
          capV = rectV; /* capacitor charges to peak */
        } else {
          capV = capV * Math.exp(-dt / tau); /* exponential discharge */
        }
        smoothed.push(capV / (phys.VpOut > 0 ? phys.VpOut : 1));
      }

      /* Draw unsmoothed (dimmed) */
      ctx.beginPath();
      for (var m = 0; m < outPoints.length; m++) {
        var py3 = baseline - outPoints[m] * outAmp;
        if (m === 0) ctx.moveTo(drawX + m, py3);
        else ctx.lineTo(drawX + m, py3);
      }
      ctx.strokeStyle = 'rgba(244,67,54,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* Draw smoothed */
      ctx.beginPath();
      for (var n = 0; n < smoothed.length; n++) {
        var py4 = baseline - smoothed[n] * outAmp;
        if (n === 0) ctx.moveTo(drawX + n, py4);
        else ctx.lineTo(drawX + n, py4);
      }
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      /* Draw raw rectified waveform */
      ctx.beginPath();
      for (var j = 0; j < outPoints.length; j++) {
        var py2 = baseline - outPoints[j] * outAmp;
        if (j === 0) ctx.moveTo(drawX + j, py2);
        else ctx.lineTo(drawX + j, py2);
      }
      ctx.strokeStyle = '#f44336';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    /* Draw average DC line (dashed) */
    if (phys.Vdc > 0 && phys.VpOut > 0) {
      var dcY = baseline - (phys.Vdc / phys.VpOut) * outAmp;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(drawX, dcY);
      ctx.lineTo(drawX + drawW, dcY);
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 10px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'left';
      ctx.fillText('Vdc=' + phys.Vdc.toFixed(2) + 'V', drawX + 4, dcY - 5);
    }
  }

  /* ================================================================
     DRAWING — CIRCUIT DIAGRAMS (left half)
     ================================================================ */

  var circuitDotPaths = [];

  /* Scale factors for circuit drawing area (designed at 450x480) */
  function sx(v) { return Math.round(v * (W * 0.505) / 450); }
  function sy(v) { return Math.round(v * H / 480); }

  function drawHalfWaveCircuit() {
    /* AC source at left */
    var acX = sx(60), acY = sy(200);
    var topW = sy(100), botW = sy(360);
    var dX = sx(160), dMid = sx(190), dEnd = sx(210), rX = sx(330);
    var rLblX = sx(345), capX = sx(400);
    drawACSource(acX, acY);

    /* Wires from AC source up and down */
    drawWire(acX, acY - 22, acX, topW, '#42a5f5');
    drawWire(acX, acY + 22, acX, botW, '#42a5f5');

    /* Top wire to diode */
    drawWire(acX, topW, dX, topW, '#42a5f5');

    /* Diode */
    var phase = Math.sin(animTime * 0.03);
    var conducting = phase > 0;
    drawDiode(dMid, topW, 0, conducting);

    /* Wire from diode to load area */
    drawWire(dEnd, topW, rX, topW, conducting ? '#f44336' : 'rgba(244,67,54,0.3)');

    /* Load resistor (vertical) */
    ctx.save();
    ctx.translate(rX, sy(200));
    ctx.rotate(Math.PI / 2);
    var peaks = 5, amp = 10, segW = 7;
    var totalRW = peaks * segW;
    ctx.beginPath();
    ctx.moveTo(-totalRW / 2 - 10, 0);
    ctx.lineTo(-totalRW / 2, 0);
    for (var i = 0; i < peaks; i++) {
      var px = -totalRW / 2 + i * segW + segW / 2;
      var py = (i % 2 === 0) ? -amp : amp;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(totalRW / 2, 0);
    ctx.lineTo(totalRW / 2 + 10, 0);
    ctx.strokeStyle = '#ffa726';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    /* R_load label */
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#ffa726';
    ctx.textAlign = 'left';
    ctx.fillText('R_L', rLblX, sy(200));
    ctx.fillText(Rload + '\u03A9', rLblX, sy(214));

    /* Wire from load to bottom */
    drawWire(rX, topW, rX, sy(130), '#f44336');
    drawWire(rX, sy(270), rX, botW, '#42a5f5');

    /* Bottom wire back to AC source */
    drawWire(acX, botW, rX, botW, '#42a5f5');

    /* Capacitor (if enabled) */
    if (useCap && Cfilter > 0) {
      drawWire(rX, topW, capX, topW, '#42a5f5');
      drawWire(capX, topW, capX, sy(170), '#42a5f5');
      drawCapacitor(capX, sy(200));
      drawWire(capX, sy(230), capX, botW, '#42a5f5');
      drawWire(rX, botW, capX, botW, '#42a5f5');
    }

    /* Ground symbol */
    var gndY = sy(370);
    drawWire(acX, botW, acX, gndY, '#6b7a99');
    ctx.beginPath();
    ctx.moveTo(acX - 12, gndY); ctx.lineTo(acX + 12, gndY);
    ctx.moveTo(acX - 8, gndY + 5); ctx.lineTo(acX + 8, gndY + 5);
    ctx.moveTo(acX - 4, gndY + 10); ctx.lineTo(acX + 4, gndY + 10);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* + / - output labels */
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f44336';
    ctx.textAlign = 'center';
    ctx.fillText('+', rX, sy(90));
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('\u2212', rX, sy(385));

    /* Dot paths for animation */
    if (conducting) {
      circuitDotPaths = [
        { points: [[acX, topW], [dX, topW], [dEnd, topW], [rX, topW], [rX, sy(130)], [rX, sy(270)], [rX, botW], [acX, botW], [acX, acY + 22]], current: phys.Idc }
      ];
    } else {
      circuitDotPaths = [];
    }
  }

  function drawCenterTapCircuit() {
    var acX = sx(40), acY = sy(200);
    var tY1 = sy(110), tY2 = sy(300), tX = sx(90), txfX = sx(110);
    var secX = sx(132), wX = sx(180), dStartX = sx(220), dMidX = sx(250), dEndX = sx(270);
    var jX = sx(320), rX = sx(370), rLblX = sx(385), capX = sx(430);
    var d1Y = sy(130), ctY = sy(200), d2Y = sy(270), topW = sy(100), botW = sy(360);
    drawACSource(acX, acY);

    /* Wires to transformer */
    drawWire(acX, acY - 22, acX, tY1, '#42a5f5');
    drawWire(acX, acY + 22, acX, tY2, '#42a5f5');
    drawWire(acX, tY1, tX, tY1, '#42a5f5');
    drawWire(acX, tY2, tX, tY2, '#42a5f5');

    /* Transformer */
    drawTransformer(txfX, ctY);

    /* Secondary winding outputs */
    drawWire(secX, d1Y, wX, d1Y, '#f44336');
    drawWire(secX, ctY, wX, ctY, '#3ddc84');
    drawWire(wX, ctY, wX, botW, '#3ddc84');
    drawWire(secX, d2Y, wX, d2Y, '#f44336');

    /* Diode D1 (top) */
    var phase = Math.sin(animTime * 0.03);
    var d1On = phase > 0;
    var d2On = phase < 0;
    drawWire(wX, d1Y, dStartX, d1Y, '#f44336');
    drawDiode(dMidX, d1Y, 0, d1On);
    drawWire(dEndX, d1Y, jX, d1Y, d1On ? '#f44336' : 'rgba(244,67,54,0.3)');

    /* Diode D2 (bottom) */
    drawWire(wX, d2Y, dStartX, d2Y, '#f44336');
    drawDiode(dMidX, d2Y, 0, d2On);
    drawWire(dEndX, d2Y, jX, d2Y, d2On ? '#f44336' : 'rgba(244,67,54,0.3)');

    /* Junction node */
    drawWire(jX, d1Y, jX, topW, '#f44336');
    drawWire(jX, d2Y, jX, topW, '#f44336');
    drawNode(jX, topW);

    /* Load resistor */
    drawWire(jX, topW, rX, topW, '#f44336');
    ctx.save();
    ctx.translate(rX, ctY);
    ctx.rotate(Math.PI / 2);
    var pk = 5, am = 10, sw = 7;
    var tw = pk * sw;
    ctx.beginPath();
    ctx.moveTo(-tw / 2 - 10, 0);
    ctx.lineTo(-tw / 2, 0);
    for (var i = 0; i < pk; i++) {
      var ppx = -tw / 2 + i * sw + sw / 2;
      var ppy = (i % 2 === 0) ? -am : am;
      ctx.lineTo(ppx, ppy);
    }
    ctx.lineTo(tw / 2, 0);
    ctx.lineTo(tw / 2 + 10, 0);
    ctx.strokeStyle = '#ffa726';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#ffa726';
    ctx.textAlign = 'left';
    ctx.fillText('R_L', rLblX, ctY);
    ctx.fillText(Rload + '\u03A9', rLblX, ctY + sy(14));

    drawWire(rX, topW, rX, sy(130), '#f44336');
    drawWire(rX, sy(270), rX, botW, '#42a5f5');
    drawWire(wX, botW, rX, botW, '#42a5f5');

    /* Capacitor */
    if (useCap && Cfilter > 0) {
      drawWire(rX, topW, capX, topW, '#42a5f5');
      drawWire(capX, topW, capX, sy(170), '#42a5f5');
      drawCapacitor(capX, ctY);
      drawWire(capX, sy(230), capX, botW, '#42a5f5');
      drawWire(rX, botW, capX, botW, '#42a5f5');
    }

    /* Labels */
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('D1', dMidX, d1Y - 12);
    ctx.fillText('D2', dMidX, d2Y - 12);
    ctx.fillText('CT', sx(155), ctY - 5);

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f44336';
    ctx.textAlign = 'center';
    ctx.fillText('+', rX, sy(88));
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('\u2212', rX, sy(385));

    circuitDotPaths = [];
    if (d1On) {
      circuitDotPaths.push({ points: [[wX, d1Y], [dStartX, d1Y], [dEndX, d1Y], [jX, d1Y], [jX, topW], [rX, topW], [rX, sy(130)], [rX, sy(270)], [rX, botW], [wX, botW], [wX, ctY]], current: phys.Idc });
    }
    if (d2On) {
      circuitDotPaths.push({ points: [[wX, d2Y], [dStartX, d2Y], [dEndX, d2Y], [jX, d2Y], [jX, topW], [rX, topW], [rX, sy(130)], [rX, sy(270)], [rX, botW], [wX, botW], [wX, ctY]], current: phys.Idc });
    }
  }

  function drawBridgeCircuit() {
    var acX = sx(40), acY = sy(200);

    var phase = Math.sin(animTime * 0.03);
    var posHalf = phase > 0;
    var d3On = !posHalf;
    var d4On = !posHalf;

    /* Clear circuit area for clean bridge */
    ctx.fillStyle = '#161b27';
    ctx.fillRect(sx(80), sy(70), sx(200), sy(290));

    /* Bridge layout: Nodes A(top-left), B(top-right), C(bottom-right), D(bottom-left) */
    var ax2 = sx(100), ay = sy(120);
    var bx2 = sx(260), by2 = sy(120);
    var cx2 = sx(260), cy2 = sy(280);
    var dx2 = sx(100), dy2 = sy(280);

    drawACSource(acX, acY);

    /* AC connects to A and D (left side) */
    drawWire(acX, acY - 22, acX, ay, '#42a5f5');
    drawWire(acX, ay, ax2, ay, '#42a5f5');
    drawWire(acX, acY + 22, acX, dy2, '#42a5f5');
    drawWire(acX, dy2, dx2, dy2, '#42a5f5');

    drawNode(ax2, ay);
    drawNode(bx2, by2);
    drawNode(cx2, cy2);
    drawNode(dx2, dy2);

    /* D1: A -> B (top) */
    drawDiode((ax2 + bx2) / 2, ay, 0, posHalf);
    drawWire(ax2, ay, (ax2 + bx2) / 2 - 22, ay, '#42a5f5');
    drawWire((ax2 + bx2) / 2 + 22, ay, bx2, ay, posHalf ? '#f44336' : 'rgba(244,67,54,0.3)');

    /* D2: D -> C (bottom) */
    drawDiode((dx2 + cx2) / 2, dy2, Math.PI, posHalf);
    drawWire(cx2, cy2, (dx2 + cx2) / 2 + 22, cy2, '#42a5f5');
    drawWire((dx2 + cx2) / 2 - 22, cy2, dx2, dy2, posHalf ? '#42a5f5' : 'rgba(66,165,245,0.3)');

    /* D3: C -> B (right side up) */
    drawDiode(cx2, (by2 + cy2) / 2, -Math.PI / 2, posHalf);
    drawWire(cx2, cy2, cx2, (by2 + cy2) / 2 + 22, '#42a5f5');
    drawWire(cx2, (by2 + cy2) / 2 - 22, bx2, by2, posHalf ? '#f44336' : 'rgba(244,67,54,0.3)');

    /* D4: D -> A (left side up) */
    drawDiode(ax2, (ay + dy2) / 2, -Math.PI / 2, d4On);
    drawWire(dx2, dy2, ax2, (ay + dy2) / 2 + 22, d4On ? '#42a5f5' : 'rgba(66,165,245,0.3)');
    drawWire(ax2, (ay + dy2) / 2 - 22, ax2, ay, d4On ? '#f44336' : 'rgba(244,67,54,0.3)');

    /* DC output wires */
    var outX = bx2 + sx(30);
    var rX = sx(360), rLblX = sx(375), capX = sx(420);
    var topW = sy(100), botW = sy(360);

    /* Top output (+) */
    drawWire(bx2, by2, outX, by2, '#f44336');
    drawWire(outX, by2, outX, topW, '#f44336');
    drawWire(outX, topW, rX, topW, '#f44336');

    /* Bottom output (-) */
    drawWire(cx2, cy2, outX, cy2, '#42a5f5');
    drawWire(outX, cy2, outX, botW, '#42a5f5');
    drawWire(outX, botW, rX, botW, '#42a5f5');

    /* Load resistor */
    ctx.save();
    ctx.translate(rX, sy(200));
    ctx.rotate(Math.PI / 2);
    var pk2 = 5, am2 = 10, sw2 = 7;
    var tw2 = pk2 * sw2;
    ctx.beginPath();
    ctx.moveTo(-tw2 / 2 - 10, 0);
    ctx.lineTo(-tw2 / 2, 0);
    for (var ii = 0; ii < pk2; ii++) {
      var ppx2 = -tw2 / 2 + ii * sw2 + sw2 / 2;
      var ppy2 = (ii % 2 === 0) ? -am2 : am2;
      ctx.lineTo(ppx2, ppy2);
    }
    ctx.lineTo(tw2 / 2, 0);
    ctx.lineTo(tw2 / 2 + 10, 0);
    ctx.strokeStyle = '#ffa726';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();

    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = '#ffa726';
    ctx.textAlign = 'left';
    ctx.fillText('R_L', rLblX, sy(200));
    ctx.fillText(Rload + '\u03A9', rLblX, sy(214));

    drawWire(rX, topW, rX, sy(130), '#f44336');
    drawWire(rX, sy(270), rX, botW, '#42a5f5');

    /* Capacitor */
    if (useCap && Cfilter > 0) {
      drawWire(rX, topW, capX, topW, '#42a5f5');
      drawWire(capX, topW, capX, sy(170), '#42a5f5');
      drawCapacitor(capX, sy(200));
      drawWire(capX, sy(230), capX, botW, '#42a5f5');
      drawWire(rX, botW, capX, botW, '#42a5f5');
    }

    /* Labels */
    ctx.font = 'bold 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('D1', (ax2 + bx2) / 2, ay - 14);
    ctx.fillText('D2', (dx2 + cx2) / 2, dy2 + 18);
    ctx.fillText('D3', cx2 + 14, (by2 + cy2) / 2);
    ctx.fillText('D4', ax2 - 14, (ay + dy2) / 2);

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f44336';
    ctx.fillText('+', rX, sy(88));
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('\u2212', rX, sy(385));

    circuitDotPaths = [];
    if (posHalf) {
      circuitDotPaths.push({
        points: [[ax2, ay], [(ax2 + bx2) / 2, ay], [bx2, ay], [outX, by2], [outX, topW], [rX, topW], [rX, sy(130)], [rX, sy(270)], [rX, botW], [outX, botW], [outX, cy2], [cx2, cy2], [(dx2 + cx2) / 2, dy2], [dx2, dy2], [acX, dy2], [acX, acY + 22]],
        current: phys.Idc
      });
    } else {
      circuitDotPaths.push({
        points: [[dx2, dy2], [ax2, (ay + dy2) / 2], [ax2, ay], [outX, by2], [outX, topW], [rX, topW], [rX, sy(130)], [rX, sy(270)], [rX, botW], [outX, botW], [cx2, cy2], [cx2, (by2 + cy2) / 2], [bx2, by2], [ax2, ay], [acX, ay], [acX, acY - 22]],
        current: phys.Idc
      });
    }
  }

  /* ================================================================
     DRAWING — CURRENT DOTS (animated)
     ================================================================ */

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
    var target = t * totalLen;
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

  function drawCurrentDots() {
    if (!showCurrentFlow) return;

    for (var p = 0; p < circuitDotPaths.length; p++) {
      var path = circuitDotPaths[p];
      var current = path.current;
      if (!current || current <= 0) continue;

      var pathLen = getPathLength(path.points);
      var numDots = Math.max(4, Math.min(16, Math.round(pathLen / 70)));
      var speed = 0.0008 * Math.min(current * 200, 6);

      for (var d = 0; d < numDots; d++) {
        var t = ((animTime * speed + d / numDots) % 1 + 1) % 1;
        var pt = getPointOnPath(path.points, t);

        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 3.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(61,220,132,0.8)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pt[0], pt[1], 1.5, 0, Math.PI * 2);
        ctx.fillStyle = '#3ddc84';
        ctx.fill();
      }
    }
  }

  /* ================================================================
     DRAWING — MAIN RENDER
     ================================================================ */

  function drawCircuit() {
    clearCanvas();

    /* Title on canvas */
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(244,67,54,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    var typeLabel = rectType === 'half' ? 'Half-Wave Rectifier' : rectType === 'center' ? 'Full-Wave Centre-Tap' : 'Bridge Rectifier';
    ctx.fillText(typeLabel, 20, 12);

    /* Divider line between circuit and waveform */
    var divX = Math.round(W * 0.505);
    ctx.beginPath();
    ctx.moveTo(divX, 20);
    ctx.lineTo(divX, H - 20);
    ctx.strokeStyle = 'rgba(42,48,80,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Draw circuit based on type */
    if (rectType === 'half') drawHalfWaveCircuit();
    else if (rectType === 'center') drawCenterTapCircuit();
    else drawBridgeCircuit();

    /* Draw current dots */
    drawCurrentDots();

    /* Draw waveforms */
    drawWaveforms();
  }

  function render() {
    calcPhysics();
    drawCircuit();
    if (mode === 'simulate') updateReadouts();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate() {
    animTime++;
    render();
    animFrame = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (!animFrame) animate();
  }

  function stopAnim() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
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

  function switchMode(m) {
    mode = m;
    hideAll();

    if (m === 'simulate') {
      simPanel.style.display = '';
      cvs.parentElement.style.display = '';
      startAnim();
    } else if (m === 'explore') {
      cvs.parentElement.style.display = 'none';
      catRow.style.display = '';
      itemSelector.style.display = '';
      buildConceptGrid();
      if (selectedConcept) showConceptInfo(selectedConcept);
      stopAnim();
    } else if (m === 'practice') {
      cvs.parentElement.style.display = 'none';
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      if (!curProblem) newPracticeProblem();
      stopAnim();
    } else if (m === 'quiz') {
      cvs.parentElement.style.display = 'none';
      quizBar.style.display = '';
      startQuiz();
      stopAnim();
    }
  }

  modeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    modeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(m);
  });

  /* ================================================================
     CIRCUIT TYPE SWITCHING
     ================================================================ */

  circuitTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    rectType = e.target.dataset.type;
    circuitTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    render();
  });

  /* ================================================================
     SLIDERS & TOGGLES
     ================================================================ */

  vpSlider.addEventListener('input', function () {
    Vpeak = parseFloat(this.value);
    vpValEl.textContent = Vpeak.toFixed(1) + ' V';
  });
  freqSlider.addEventListener('input', function () {
    freq = parseInt(this.value);
    freqValEl.textContent = freq + ' Hz';
  });
  rlSlider.addEventListener('input', function () {
    Rload = parseInt(this.value);
    rlValEl.innerHTML = Rload + ' &Omega;';
  });
  cfSlider.addEventListener('input', function () {
    Cfilter = parseInt(this.value);
    cfValEl.innerHTML = Cfilter + ' &micro;F';
  });

  chkCap.addEventListener('change', function () {
    useCap = this.checked;
    this.parentElement.classList.toggle('checked', this.checked);
    cfSlider.disabled = !useCap;
  });
  chkCurrent.addEventListener('change', function () {
    showCurrentFlow = this.checked;
    this.parentElement.classList.toggle('checked', this.checked);
  });

  /* ================================================================
     DIODE TYPE SELECTOR
     ================================================================ */

  var diodeTabs = document.getElementById('diode-tabs');
  if (diodeTabs) {
    diodeTabs.addEventListener('click', function (e) {
      if (!e.target.matches('.pill')) return;
      diodeType = e.target.dataset.diode;
      diodeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
      render();
    });
  }

  /* ================================================================
     PRESET SELECTOR
     ================================================================ */

  var presetTabs = document.getElementById('preset-tabs');
  if (presetTabs) {
    presetTabs.addEventListener('click', function (e) {
      if (!e.target.matches('.pill')) return;
      var key = e.target.dataset.preset;
      var p = PRESETS[key];
      if (!p) return;

      /* Highlight active preset pill */
      presetTabs.querySelectorAll('.pill').forEach(function (b) { b.classList.toggle('active', b === e.target); });

      /* Apply preset values */
      rectType = p.type;
      circuitTabs.querySelectorAll('.pill').forEach(function (b) { b.classList.toggle('active', b.dataset.type === p.type); });

      Vpeak = p.Vp;
      vpSlider.value = p.Vp;
      vpValEl.textContent = p.Vp.toFixed(1) + ' V';

      freq = p.freq;
      freqSlider.value = p.freq;
      freqValEl.textContent = p.freq + ' Hz';

      Rload = p.R;
      rlSlider.value = p.R;
      rlValEl.innerHTML = p.R + ' &Omega;';

      Cfilter = p.C;
      cfSlider.value = p.C;
      cfValEl.innerHTML = p.C + ' &micro;F';

      diodeType = p.diode;
      if (diodeTabs) {
        diodeTabs.querySelectorAll('.pill').forEach(function (b) { b.classList.toggle('active', b.dataset.diode === p.diode); });
      }

      render();
    });
  }

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
      });
      conceptGrid.appendChild(btn);
    });
  }

  function showConceptInfo(c) {
    itemInfo.style.display = '';
    var catLabels = { basics: 'Basics', circuits: 'Circuits' };
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + catLabels[c.cat] + '</span></div>';
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
    html += '<button class="btn btn-ghost" id="quiz-next" style="display:none;margin-left:auto;">Next &rarr;</button>';
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

  calcPhysics();
  updateReadouts();
  startAnim();

  window.addEventListener('resize', fitCanvas);

})();
