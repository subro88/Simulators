(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS (9 concepts, 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── AC Fundamentals ──────────────────────────────────────────── */
    {
      id: 'ac-voltage', name: 'AC Voltage & Current', symbol: 'v(t) = Vp\u00B7sin(\u03C9t)',
      formula: 'v(t) = Vp\u00B7sin(\u03C9t), Vrms = Vp / \u221A2', unit: 'V, A',
      cat: 'fundamentals',
      desc: 'In AC circuits, voltage and current vary sinusoidally with time. The peak value (Vp) is the maximum amplitude of the waveform, while the RMS (root-mean-square) value is Vp/\u221A2 \u2248 0.707\u00B7Vp. RMS values represent the DC equivalent that would deliver the same power to a resistive load. Most AC instruments display RMS values. A standard 120V mains supply has a peak voltage of about 170V.',
      diagram: 'acVoltage',
      example: { problem: 'An AC source has Vpeak = 20 V. Find the RMS voltage.', steps: ['Vrms = Vp / \u221A2', 'Vrms = 20 / 1.414', 'Vrms = 14.14 V'], answer: 14.14, unit: 'V' }
    },
    {
      id: 'frequency', name: 'Frequency & Period', symbol: 'f = 1/T',
      formula: '\u03C9 = 2\u03C0f, T = 1/f', unit: 'Hz, s, rad/s',
      cat: 'fundamentals',
      desc: 'Frequency (f) is the number of complete cycles per second, measured in hertz (Hz). The period (T) is the time for one complete cycle: T = 1/f. Angular frequency \u03C9 = 2\u03C0f is measured in radians per second and is used extensively in AC circuit calculations because it simplifies the mathematics of sinusoidal functions. A 50 Hz supply completes 50 cycles every second with a period of 20 ms.',
      diagram: 'frequency',
      example: { problem: 'A signal has frequency f = 200 Hz. Find the period and angular frequency.', steps: ['T = 1/f = 1/200', 'T = 0.005 s = 5 ms', '\u03C9 = 2\u03C0f = 2\u03C0 \u00D7 200', '\u03C9 = 1256.6 rad/s'], answer: 0.005, unit: 's' }
    },
    {
      id: 'phase-angle', name: 'Phase Angle', symbol: '\u03C6 = arctan((XL\u2212XC)/R)',
      formula: '\u03C6 = arctan((XL \u2212 XC) / R)', unit: 'degrees (\u00B0)',
      cat: 'fundamentals',
      desc: 'The phase angle \u03C6 describes the timing difference between voltage and current waveforms in an AC circuit. When the circuit is inductive (XL > XC), voltage leads current and \u03C6 is positive. When capacitive (XC > XL), current leads voltage and \u03C6 is negative. At resonance, XL = XC and \u03C6 = 0\u00B0, meaning voltage and current are perfectly in phase. Phase angle determines power factor and energy flow.',
      diagram: 'phaseAngle',
      example: { problem: 'R = 100 \u03A9, XL = 200 \u03A9, XC = 50 \u03A9. Find the phase angle.', steps: ['\u03C6 = arctan((XL \u2212 XC) / R)', '\u03C6 = arctan((200 \u2212 50) / 100)', '\u03C6 = arctan(1.5)', '\u03C6 = 56.31\u00B0'], answer: 56.31, unit: '\u00B0' }
    },

    /* ── Impedance & Reactance ─────────────────────────────────────── */
    {
      id: 'xl', name: 'Inductive Reactance', symbol: 'XL = 2\u03C0fL',
      formula: 'XL = 2\u03C0fL = \u03C9L', unit: '\u03A9 (ohms)',
      cat: 'impedance',
      desc: 'Inductive reactance (XL) is the opposition to AC current by an inductor. It increases linearly with frequency: at high frequencies the inductor strongly opposes current flow, while at DC (f = 0) XL = 0 and the inductor acts as a short circuit. Inductors cause current to lag behind voltage by 90\u00B0. This frequency-dependent behaviour makes inductors essential for filter circuits and energy storage.',
      diagram: 'inductiveReactance',
      example: { problem: 'L = 50 mH, f = 60 Hz. Find XL.', steps: ['XL = 2\u03C0fL', 'XL = 2\u03C0 \u00D7 60 \u00D7 0.050', 'XL = 18.85 \u03A9'], answer: 18.85, unit: '\u03A9' }
    },
    {
      id: 'xc', name: 'Capacitive Reactance', symbol: 'XC = 1/(2\u03C0fC)',
      formula: 'XC = 1 / (2\u03C0fC) = 1 / (\u03C9C)', unit: '\u03A9 (ohms)',
      cat: 'impedance',
      desc: 'Capacitive reactance (XC) is the opposition to AC current by a capacitor. Unlike inductive reactance, XC decreases with increasing frequency: at high frequencies the capacitor passes current readily, while at DC (f = 0) XC is infinite and the capacitor blocks current completely. Capacitors cause current to lead voltage by 90\u00B0. This inverse frequency relationship is the basis of capacitive filters and coupling circuits.',
      diagram: 'capacitiveReactance',
      example: { problem: 'C = 10 \u03BCF, f = 50 Hz. Find XC.', steps: ['XC = 1 / (2\u03C0fC)', 'XC = 1 / (2\u03C0 \u00D7 50 \u00D7 10\u00D710\u207B\u2076)', 'XC = 1 / 0.003142', 'XC = 318.31 \u03A9'], answer: 318.31, unit: '\u03A9' }
    },
    {
      id: 'impedance', name: 'Impedance', symbol: 'Z = \u221A(R\u00B2+(XL\u2212XC)\u00B2)',
      formula: 'Z = \u221A(R\u00B2 + (XL \u2212 XC)\u00B2)', unit: '\u03A9 (ohms)',
      cat: 'impedance',
      desc: 'Impedance (Z) is the total opposition to AC current in a circuit, combining resistance (R) and net reactance (XL \u2212 XC). It is the AC equivalent of DC resistance. In a series RLC circuit, Z = \u221A(R\u00B2 + (XL \u2212 XC)\u00B2). When XL = XC (at resonance), impedance drops to its minimum value Z = R. Impedance is a complex quantity with both magnitude and phase angle, represented as Z = R + j(XL \u2212 XC).',
      diagram: 'impedanceTriangle',
      example: { problem: 'R = 30 \u03A9, XL = 80 \u03A9, XC = 40 \u03A9. Find Z.', steps: ['Z = \u221A(R\u00B2 + (XL \u2212 XC)\u00B2)', 'Z = \u221A(30\u00B2 + (80 \u2212 40)\u00B2)', 'Z = \u221A(900 + 1600)', 'Z = \u221A2500 = 50 \u03A9'], answer: 50, unit: '\u03A9' }
    },

    /* ── Resonance & Power ─────────────────────────────────────────── */
    {
      id: 'resonance', name: 'Resonant Frequency', symbol: 'f\u2080 = 1/(2\u03C0\u221A(LC))',
      formula: 'f\u2080 = 1 / (2\u03C0\u221A(LC))', unit: 'Hz',
      cat: 'resonance',
      desc: 'Resonance occurs at the frequency where inductive reactance XL equals capacitive reactance XC. At this special frequency the reactances cancel, impedance drops to its minimum (Z = R for series RLC), current reaches maximum, and the phase angle is zero. The resonant frequency depends only on L and C, not on R. Resonance is the operating principle behind radio tuning, bandpass filters, oscillator circuits, and many sensor applications.',
      diagram: 'resonantFrequency',
      example: { problem: 'L = 10 mH, C = 10 \u03BCF. Find the resonant frequency.', steps: ['f\u2080 = 1 / (2\u03C0\u221A(LC))', 'f\u2080 = 1 / (2\u03C0\u221A(0.010 \u00D7 10\u00D710\u207B\u2076))', 'f\u2080 = 1 / (2\u03C0 \u00D7 3.162\u00D710\u207B\u2074)', 'f\u2080 = 503.3 Hz'], answer: 503.3, unit: 'Hz' }
    },
    {
      id: 'q-factor', name: 'Q Factor', symbol: 'Q = (1/R)\u221A(L/C)',
      formula: 'Q = (1/R)\u221A(L/C) = f\u2080/BW', unit: '(dimensionless)',
      cat: 'resonance',
      desc: 'The quality factor (Q) measures how sharply an RLC circuit resonates. A high-Q circuit resonates in a narrow frequency band with a tall, sharp peak; a low-Q circuit has a wide, flat response. Q equals the resonant frequency divided by the bandwidth between the half-power points: Q = f\u2080/BW. For a series RLC circuit, Q = (1/R)\u221A(L/C). Increasing R adds damping and reduces Q. Q factor is critical in filter selectivity and radio receiver design.',
      diagram: 'qFactor',
      example: { problem: 'R = 50 \u03A9, L = 100 mH, C = 1 \u03BCF. Find Q factor.', steps: ['Q = (1/R)\u221A(L/C)', 'Q = (1/50)\u221A(0.1/0.000001)', 'Q = 0.02 \u00D7 \u221A100000', 'Q = 0.02 \u00D7 316.23 = 6.32'], answer: 6.32, unit: '' }
    },
    {
      id: 'power-factor', name: 'Power Factor', symbol: 'PF = cos(\u03C6)',
      formula: 'PF = cos(\u03C6) = R / Z', unit: '(dimensionless)',
      cat: 'resonance',
      desc: 'Power factor is the cosine of the phase angle between voltage and current. It measures how effectively electrical power is converted to useful work. PF = 1 (at resonance) means all power is real (dissipated in R); PF = 0 means all power is reactive (stored and returned by L and C). Apparent power S = VI, real power P = S\u00B7cos(\u03C6), and reactive power Q = S\u00B7sin(\u03C6). Industrial power factor correction reduces energy waste and demand charges.',
      diagram: 'powerFactor',
      example: { problem: 'Phase angle \u03C6 = 30\u00B0. Find the power factor.', steps: ['PF = cos(\u03C6)', 'PF = cos(30\u00B0)', 'PF = 0.866'], answer: 0.866, unit: '' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (8)
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }

  var PI = Math.PI;
  var TWO_PI = 2 * PI;

  var PROBLEM_GEN = [
    /* 0 — Calculate XL given f and L */
    function () {
      var f = randInt(20, 500);
      var Lm = randInt(1, 100);
      var XL = round2(TWO_PI * f * (Lm / 1000));
      return { prompt: 'f = ' + f + ' Hz, L = ' + Lm + ' mH. Calculate the inductive reactance XL (\u03A9).', steps: ['XL = 2\u03C0fL', 'XL = 2\u03C0 \u00D7 ' + f + ' \u00D7 ' + round2(Lm / 1000), 'XL = ' + XL + ' \u03A9'], answer: XL, unit: '\u03A9', tol: 0.5 };
    },
    /* 1 — Calculate XC given f and C */
    function () {
      var f = randInt(20, 500);
      var Cu = randInt(1, 100);
      var XC = round2(1 / (TWO_PI * f * (Cu / 1e6)));
      return { prompt: 'f = ' + f + ' Hz, C = ' + Cu + ' \u03BCF. Calculate the capacitive reactance XC (\u03A9).', steps: ['XC = 1 / (2\u03C0fC)', 'XC = 1 / (2\u03C0 \u00D7 ' + f + ' \u00D7 ' + (Cu / 1e6) + ')', 'XC = ' + XC + ' \u03A9'], answer: XC, unit: '\u03A9', tol: 0.5 };
    },
    /* 2 — Calculate Z given R, XL, XC */
    function () {
      var Rv = randInt(10, 500);
      var XLv = randInt(20, 300);
      var XCv = randInt(20, 300);
      var Z = round2(Math.sqrt(Rv * Rv + (XLv - XCv) * (XLv - XCv)));
      return { prompt: 'R = ' + Rv + ' \u03A9, XL = ' + XLv + ' \u03A9, XC = ' + XCv + ' \u03A9. Find impedance Z (\u03A9).', steps: ['Z = \u221A(R\u00B2 + (XL \u2212 XC)\u00B2)', 'Z = \u221A(' + Rv + '\u00B2 + (' + XLv + ' \u2212 ' + XCv + ')\u00B2)', 'Z = \u221A(' + (Rv * Rv) + ' + ' + ((XLv - XCv) * (XLv - XCv)) + ')', 'Z = ' + Z + ' \u03A9'], answer: Z, unit: '\u03A9', tol: 1 };
    },
    /* 3 — Calculate phase angle given R, XL, XC */
    function () {
      var Rv = randInt(20, 300);
      var XLv = randInt(10, 400);
      var XCv = randInt(10, 400);
      var phi = round2(Math.atan((XLv - XCv) / Rv) * 180 / PI);
      return { prompt: 'R = ' + Rv + ' \u03A9, XL = ' + XLv + ' \u03A9, XC = ' + XCv + ' \u03A9. Find phase angle \u03C6 (\u00B0).', steps: ['\u03C6 = arctan((XL \u2212 XC) / R)', '\u03C6 = arctan((' + XLv + ' \u2212 ' + XCv + ') / ' + Rv + ')', '\u03C6 = arctan(' + round2((XLv - XCv) / Rv) + ')', '\u03C6 = ' + phi + '\u00B0'], answer: phi, unit: '\u00B0', tol: 1 };
    },
    /* 4 — Calculate resonant frequency given L and C */
    function () {
      var Lm = randInt(1, 100);
      var Cu = randInt(1, 100);
      var Lh = Lm / 1000;
      var Cf = Cu / 1e6;
      var f0 = round2(1 / (TWO_PI * Math.sqrt(Lh * Cf)));
      return { prompt: 'L = ' + Lm + ' mH, C = ' + Cu + ' \u03BCF. Find resonant frequency f\u2080 (Hz).', steps: ['f\u2080 = 1 / (2\u03C0\u221A(LC))', 'f\u2080 = 1 / (2\u03C0\u221A(' + Lh + ' \u00D7 ' + Cf + '))', 'f\u2080 = 1 / (2\u03C0 \u00D7 ' + round2(Math.sqrt(Lh * Cf)) + ')', 'f\u2080 = ' + f0 + ' Hz'], answer: f0, unit: 'Hz', tol: 1 };
    },
    /* 5 — Calculate Q factor given R, L, C */
    function () {
      var Rv = randInt(10, 200);
      var Lm = randInt(5, 100);
      var Cu = randInt(1, 50);
      var Lh = Lm / 1000;
      var Cf = Cu / 1e6;
      var Q = round2((1 / Rv) * Math.sqrt(Lh / Cf));
      return { prompt: 'R = ' + Rv + ' \u03A9, L = ' + Lm + ' mH, C = ' + Cu + ' \u03BCF. Find Q factor.', steps: ['Q = (1/R)\u221A(L/C)', 'Q = (1/' + Rv + ')\u221A(' + Lh + '/' + Cf + ')', 'Q = ' + round2(1 / Rv) + ' \u00D7 ' + round2(Math.sqrt(Lh / Cf)), 'Q = ' + Q], answer: Q, unit: '', tol: 0.2 };
    },
    /* 6 — Calculate Irms given Vpeak and Z */
    function () {
      var Vp = randInt(5, 24);
      var Zv = randInt(20, 500);
      var Vrms = round2(Vp / Math.sqrt(2));
      var Irms = round2(Vrms / Zv * 1000);
      return { prompt: 'Vpeak = ' + Vp + ' V, Z = ' + Zv + ' \u03A9. Find Irms (mA).', steps: ['Vrms = Vp / \u221A2 = ' + Vp + ' / 1.414 = ' + Vrms + ' V', 'Irms = Vrms / Z', 'Irms = ' + Vrms + ' / ' + Zv, 'Irms = ' + Irms + ' mA'], answer: Irms, unit: 'mA', tol: 0.5 };
    },
    /* 7 — Calculate power factor given phase angle */
    function () {
      var phi = randInt(5, 80);
      var pf = round2(Math.cos(phi * PI / 180));
      return { prompt: 'Phase angle \u03C6 = ' + phi + '\u00B0. Find the power factor.', steps: ['PF = cos(\u03C6)', 'PF = cos(' + phi + '\u00B0)', 'PF = ' + pf], answer: pf, unit: '', tol: 0.02 };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (10 MCQ + 5 numeric, pick 5)
     ================================================================ */

  function genQuizPool() {
    var pool = [];

    /* --- 10 MCQ questions --- */
    pool.push({ type: 'mcq', prompt: 'At resonance in a series RLC circuit, the impedance equals:', options: ['R (resistance only)', 'XL', 'XC', 'XL + XC'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Inductive reactance XL is proportional to:', options: ['Frequency', '1 / Frequency', 'Resistance', 'Capacitance'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Capacitive reactance XC is proportional to:', options: ['1 / Frequency', 'Frequency', 'Inductance', 'Resistance'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'When XL > XC in a series RLC circuit, the circuit behaves as:', options: ['Inductive (V leads I)', 'Capacitive (I leads V)', 'Purely resistive', 'At resonance'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The Q factor of a series RLC circuit increases when:', options: ['R decreases', 'R increases', 'Frequency doubles', 'Voltage increases'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Power factor equals 1 when:', options: ['Phase angle is 0\u00B0', 'Phase angle is 90\u00B0', 'XL is much greater than XC', 'Z equals zero'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'The RMS value of a sinusoidal voltage equals:', options: ['Vpeak / \u221A2', 'Vpeak \u00D7 \u221A2', 'Vpeak / 2', 'Vpeak \u00D7 2'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'At resonance, the phase angle between voltage and current is:', options: ['0\u00B0', '90\u00B0', '180\u00B0', '45\u00B0'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'In a parallel RLC circuit at resonance, the impedance is:', options: ['Maximum', 'Minimum', 'Zero', 'Equal to XL'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Angular frequency \u03C9 equals:', options: ['2\u03C0f', '\u03C0f', 'f / 2\u03C0', '2f'], correct: 0 });

    /* --- 5 numeric questions (random values each time) --- */
    var f1 = randInt(50, 500);
    var L1 = randInt(5, 50);
    pool.push({ type: 'numeric', prompt: 'XL = 2\u03C0fL. f = ' + f1 + ' Hz, L = ' + L1 + ' mH. Find XL (\u03A9).', answer: round2(TWO_PI * f1 * L1 / 1000), unit: '\u03A9', tol: 0.5 });

    var f2 = randInt(50, 400);
    var C2 = randInt(5, 50);
    pool.push({ type: 'numeric', prompt: 'XC = 1/(2\u03C0fC). f = ' + f2 + ' Hz, C = ' + C2 + ' \u03BCF. Find XC (\u03A9).', answer: round2(1 / (TWO_PI * f2 * C2 / 1e6)), unit: '\u03A9', tol: 0.5 });

    var R3 = randInt(20, 200);
    var XL3 = randInt(50, 300);
    var XC3 = randInt(50, 300);
    pool.push({ type: 'numeric', prompt: 'R = ' + R3 + ' \u03A9, XL = ' + XL3 + ' \u03A9, XC = ' + XC3 + ' \u03A9. Find Z (\u03A9).', answer: round2(Math.sqrt(R3 * R3 + (XL3 - XC3) * (XL3 - XC3))), unit: '\u03A9', tol: 1 });

    var L4 = randInt(5, 50);
    var C4 = randInt(5, 50);
    pool.push({ type: 'numeric', prompt: 'L = ' + L4 + ' mH, C = ' + C4 + ' \u03BCF. Find resonant frequency f\u2080 (Hz).', answer: round2(1 / (TWO_PI * Math.sqrt(L4 / 1000 * C4 / 1e6))), unit: 'Hz', tol: 1 });

    var phi5 = randInt(10, 75);
    pool.push({ type: 'numeric', prompt: '\u03C6 = ' + phi5 + '\u00B0. Find the power factor (cos \u03C6).', answer: round2(Math.cos(phi5 * PI / 180)), unit: '', tol: 0.02 });

    /* Shuffle the entire pool */
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
  var circuitTabs = document.getElementById('circuit-tabs');
  var simPanel = document.getElementById('sim-panel');

  var rSlider = document.getElementById('r-slider');
  var lSlider = document.getElementById('l-slider');
  var cSlider = document.getElementById('c-slider');
  var fSlider = document.getElementById('f-slider');
  var vpSlider = document.getElementById('vp-slider');

  var rValEl = document.getElementById('r-val');
  var lValEl = document.getElementById('l-val');
  var cValEl = document.getElementById('c-val');
  var fValEl = document.getElementById('f-val');
  var vpValEl = document.getElementById('vp-val');

  /* Readout elements */
  var roZ = document.getElementById('ro-z');
  var roPhi = document.getElementById('ro-phi');
  var roI = document.getElementById('ro-i');
  var roXL = document.getElementById('ro-xl');
  var roXC = document.getElementById('ro-xc');
  var roF0 = document.getElementById('ro-f0');
  var roPF = document.getElementById('ro-pf');
  var roQ = document.getElementById('ro-q');

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
  var circuitType = 'series';

  /* Component values */
  var R = 100;       /* Ohms */
  var L = 10;        /* mH */
  var C = 10;        /* uF */
  var freq = 50;     /* Hz */
  var Vpeak = 12;    /* V */

  /* Animation */
  var animFrame = null;
  var animTime = 0;
  var lastTimestamp = 0;

  /* Physics results */
  var phys = {};

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
     PHYSICS CALCULATIONS
     ================================================================ */

  function calcPhysics() {
    var Lh = L / 1000;           /* henrys */
    var Cf = C / 1e6;            /* farads */
    var omega = TWO_PI * freq;
    var XL = omega * Lh;
    var XC = (omega * Cf > 0) ? 1 / (omega * Cf) : 1e12;
    var f0 = (Lh > 0 && Cf > 0) ? 1 / (TWO_PI * Math.sqrt(Lh * Cf)) : 0;
    var Vrms = Vpeak / Math.sqrt(2);

    var Z, phi, Irms, Q, PF;

    if (circuitType === 'series') {
      /* Series RLC */
      Z = Math.sqrt(R * R + (XL - XC) * (XL - XC));
      phi = Math.atan2(XL - XC, R);
      Irms = (Z > 0) ? Vrms / Z : 0;
      Q = (R > 0 && Lh > 0 && Cf > 0) ? (1 / R) * Math.sqrt(Lh / Cf) : 0;
      PF = (Z > 0) ? R / Z : 1;
    } else {
      /* Parallel RLC — use admittance approach */
      var GL = 1 / R;                       /* conductance */
      var BL = (XL > 0) ? -1 / XL : 0;     /* inductive susceptance (negative) */
      var BC = (XC > 0) ? 1 / XC : 0;      /* capacitive susceptance (positive) */
      var BT = BL + BC;                     /* total susceptance */
      var Ytotal = Math.sqrt(GL * GL + BT * BT);
      Z = (Ytotal > 0) ? 1 / Ytotal : 1e12;
      phi = -Math.atan2(BT, GL);            /* negative because admittance phase is inverted */
      Irms = Vrms * Ytotal;
      Q = (R > 0 && Lh > 0 && Cf > 0) ? R * Math.sqrt(Cf / Lh) : 0;
      PF = (Ytotal > 0) ? GL / Ytotal : 1;
    }

    var phiDeg = phi * 180 / PI;
    var Ipeak = Irms * Math.sqrt(2);

    phys = {
      XL: XL,
      XC: XC,
      Z: Z,
      phi: phi,
      phiDeg: phiDeg,
      Irms: Irms,
      Ipeak: Ipeak,
      Vrms: Vrms,
      f0: f0,
      Q: Q,
      PF: PF,
      omega: omega,
      Lh: Lh,
      Cf: Cf
    };
  }

  function updateReadouts() {
    roZ.textContent = phys.Z < 10000 ? phys.Z.toFixed(1) : phys.Z.toExponential(1);
    roPhi.textContent = phys.phiDeg.toFixed(1);

    /* Display current with appropriate unit */
    var ImA = phys.Irms * 1000;
    if (ImA >= 1000) {
      roI.textContent = phys.Irms.toFixed(2);
      roI.nextElementSibling.innerHTML = ' A';
    } else {
      roI.textContent = ImA.toFixed(1);
      roI.nextElementSibling.innerHTML = ' mA';
    }

    roXL.textContent = phys.XL.toFixed(2);
    roXC.textContent = phys.XC < 100000 ? phys.XC.toFixed(2) : phys.XC.toExponential(1);
    roF0.textContent = phys.f0.toFixed(1);
    roPF.textContent = phys.PF.toFixed(3);
    roQ.textContent = phys.Q.toFixed(2);
  }

  /* ================================================================
     DRAWING — CLEAR CANVAS
     ================================================================ */

  function clearCanvas() {
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);
  }

  /* ================================================================
     DRAWING — ARROW HELPER
     ================================================================ */

  function drawArrow(fromX, fromY, toX, toY, color, label, lineW) {
    var dx = toX - fromX;
    var dy = toY - fromY;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;

    /* Shaft */
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW || 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* Arrowhead */
    var headLen = Math.min(12, len * 0.3);
    var angle = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - 0.35), toY - headLen * Math.sin(angle - 0.35));
    ctx.lineTo(toX - headLen * Math.cos(angle + 0.35), toY - headLen * Math.sin(angle + 0.35));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    /* Label at tip */
    if (label) {
      var labelDist = len + 16;
      var lx = fromX + (dx / len) * labelDist;
      var ly = fromY + (dy / len) * labelDist;
      /* Clamp label inside canvas */
      lx = Math.max(30, Math.min(W - 30, lx));
      ly = Math.max(16, Math.min(H - 10, ly));
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
    }
  }

  /* ================================================================
     DRAWING — PHASOR DIAGRAM (left half ~0-420 px)
     ================================================================ */

  function drawPhasorDiagram(t) {
    var cx = 200, cy = 245;
    var maxRadius = 140;

    /* Title */
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Phasor Diagram', cx, 12);

    /* Outer reference circle (dashed) */
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    /* Inner reference ring */
    ctx.save();
    ctx.setLineDash([2, 6]);
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.5, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.restore();

    /* Cross-hair axes */
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - maxRadius - 10, cy);
    ctx.lineTo(cx + maxRadius + 10, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - maxRadius - 10);
    ctx.lineTo(cx, cy + maxRadius + 10);
    ctx.stroke();
    ctx.restore();

    /* --- Compute phasor magnitudes --- */
    var IpNorm = phys.Ipeak;
    var VR = IpNorm * R;
    var VL = IpNorm * phys.XL;
    var VC = IpNorm * phys.XC;
    var maxMag = Math.max(Vpeak, VR, VL, VC, 0.001);
    var scale = (maxRadius - 10) / maxMag;

    var omega_t = t;  /* rotation angle */

    /* Voltage phasor V (red) — reference */
    var Vlen = Vpeak * scale;
    var Vx = cx + Vlen * Math.cos(omega_t);
    var Vy = cy - Vlen * Math.sin(omega_t);
    drawArrow(cx, cy, Vx, Vy, '#ff5555', 'V', 3);

    /* Current phasor I (green) — shifted by +phi */
    /* Scale current phasor to ~70% of V phasor for readability */
    var Ilen = Vlen * 0.7;
    if (IpNorm <= 0) Ilen = 0;
    var IAngle = omega_t + phys.phi;
    var Ix = cx + Ilen * Math.cos(IAngle);
    var Iy = cy - Ilen * Math.sin(IAngle);
    drawArrow(cx, cy, Ix, Iy, '#3ddc84', 'I', 3);

    /* VR phasor (yellow) — along current direction */
    var VRlen = VR * scale;
    var VRx = cx + VRlen * Math.cos(IAngle);
    var VRy = cy - VRlen * Math.sin(IAngle);
    drawArrow(cx, cy, VRx, VRy, '#ffa000', 'VR', 2);

    /* VL phasor (cyan) — 90 degrees ahead of current */
    var VLlen = VL * scale;
    var VLangle = IAngle + PI / 2;
    var VLx = cx + VLlen * Math.cos(VLangle);
    var VLy = cy - VLlen * Math.sin(VLangle);
    drawArrow(cx, cy, VLx, VLy, '#00bcd4', 'VL', 2);

    /* VC phasor (magenta) — 90 degrees behind current */
    var VClen = VC * scale;
    var VCangle = IAngle - PI / 2;
    var VCx = cx + VClen * Math.cos(VCangle);
    var VCy = cy - VClen * Math.sin(VCangle);
    drawArrow(cx, cy, VCx, VCy, '#e040fb', 'VC', 2);

    /* Phase angle arc between V and I */
    if (Math.abs(phys.phiDeg) > 0.5 && Vlen > 10 && Ilen > 10) {
      var arcR = 35;
      var startAngle, endAngle, antiClockwise;
      if (phys.phi > 0) {
        /* Inductive: V leads I, so I is behind V */
        startAngle = -IAngle;   /* canvas y-down: negate */
        endAngle = -omega_t;
        antiClockwise = false;
      } else {
        startAngle = -omega_t;
        endAngle = -IAngle;
        antiClockwise = false;
      }
      ctx.beginPath();
      ctx.arc(cx, cy, arcR, startAngle, endAngle, antiClockwise);
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Phi label at midpoint of arc */
      var midA = (omega_t + IAngle) / 2;
      var labelR2 = arcR + 14;
      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u03C6=' + Math.abs(phys.phiDeg).toFixed(1) + '\u00B0',
        cx + labelR2 * Math.cos(midA),
        cy - labelR2 * Math.sin(midA));
    }

    /* Legend (bottom-left of phasor area) */
    var legendX = 30, legendY = H - 95;
    var legItems = [
      { color: '#ff5555', label: 'V (source)' },
      { color: '#3ddc84', label: 'I (current)' },
      { color: '#ffa000', label: 'VR (resistor)' },
      { color: '#00bcd4', label: 'VL (inductor)' },
      { color: '#e040fb', label: 'VC (capacitor)' }
    ];
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (var li = 0; li < legItems.length; li++) {
      var lyPos = legendY + li * 15;
      ctx.fillStyle = legItems[li].color;
      ctx.fillRect(legendX, lyPos - 4, 12, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(legItems[li].label, legendX + 16, lyPos);
    }

    /* Circuit type label */
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText(circuitType === 'series' ? 'Series RLC' : 'Parallel RLC', cx, H - 14);
  }

  /* ================================================================
     DRAWING — WAVEFORM DISPLAY (right half ~440-880 px)
     ================================================================ */

  function drawWaveform(t) {
    var leftM = 450;
    var rightM = 880;
    var topM = 40;
    var botM = H - 30;
    var plotW = rightM - leftM;
    var plotH = botM - topM;
    var midY = topM + plotH / 2;
    var midX = leftM + plotW / 2;

    /* Title */
    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Waveform Display', midX, 12);

    /* Plot background */
    ctx.fillStyle = 'rgba(255,255,255,0.012)';
    ctx.fillRect(leftM, topM, plotW, plotH);

    /* Horizontal grid lines */
    var hLines = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 0.5;
    for (var hi = 0; hi <= hLines; hi++) {
      var gy = topM + (plotH / hLines) * hi;
      ctx.beginPath();
      ctx.moveTo(leftM, gy);
      ctx.lineTo(rightM, gy);
      ctx.stroke();
    }

    /* Vertical grid lines */
    var vLines = 12;
    for (var vi = 0; vi <= vLines; vi++) {
      var gx = leftM + (plotW / vLines) * vi;
      ctx.beginPath();
      ctx.moveTo(gx, topM);
      ctx.lineTo(gx, botM);
      ctx.stroke();
    }

    /* Zero line (center horizontal axis) */
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftM, midY);
    ctx.lineTo(rightM, midY);
    ctx.stroke();

    /* Waveform parameters */
    var numCycles = 2.5;
    var period = 1 / freq;
    var totalTime = numCycles * period;
    var timePerPixel = totalTime / plotW;
    var amplitude = plotH / 2 - 10;
    var scrollOffset = t;

    /* Voltage waveform v(t) = Vp * sin(wt) — RED */
    ctx.beginPath();
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    for (var px = 0; px <= plotW; px++) {
      var tSamp = px * timePerPixel;
      var ang = TWO_PI * freq * tSamp + scrollOffset;
      var val = Math.sin(ang);
      var sy = midY - val * amplitude;
      if (px === 0) ctx.moveTo(leftM + px, sy);
      else ctx.lineTo(leftM + px, sy);
    }
    ctx.stroke();

    /* Current waveform i(t) = Ip * sin(wt + phi) — GREEN (scaled to 70% amplitude) */
    ctx.beginPath();
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2;
    for (var px2 = 0; px2 <= plotW; px2++) {
      var tSamp2 = px2 * timePerPixel;
      var ang2 = TWO_PI * freq * tSamp2 + scrollOffset + phys.phi;
      var val2 = Math.sin(ang2);
      var sy2 = midY - val2 * amplitude * 0.7;
      if (px2 === 0) ctx.moveTo(leftM + px2, sy2);
      else ctx.lineTo(leftM + px2, sy2);
    }
    ctx.stroke();

    /* Animated vertical time marker */
    var markerPhase = ((t * 0.5) % (TWO_PI * numCycles) + TWO_PI * numCycles) % (TWO_PI * numCycles);
    var markerFrac = markerPhase / (TWO_PI * numCycles);
    var markerX = leftM + markerFrac * plotW;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(markerX, topM);
    ctx.lineTo(markerX, botM);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    /* Dots at marker intersection points */
    var mT = (markerX - leftM) * timePerPixel;
    var mAng = TWO_PI * freq * mT + scrollOffset;
    var vAtM = Math.sin(mAng);
    var iAtM = Math.sin(mAng + phys.phi);

    ctx.beginPath();
    ctx.arc(markerX, midY - vAtM * amplitude, 4, 0, TWO_PI);
    ctx.fillStyle = '#ff5555';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(markerX, midY - iAtM * amplitude * 0.7, 4, 0, TWO_PI);
    ctx.fillStyle = '#3ddc84';
    ctx.fill();

    /* Y-axis labels */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,85,85,0.5)';
    ctx.fillText('+Vp', leftM - 4, topM + 10);
    ctx.fillText('\u2212Vp', leftM - 4, botM - 10);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillText('0', leftM - 4, midY);

    /* X-axis label */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Time \u2192', midX, botM + 4);

    /* Waveform legend labels */
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('v(t)', rightM - 40, topM + 6);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('i(t)', rightM - 40, topM + 20);

    /* Frequency / period info */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('f = ' + freq + ' Hz, T = ' + (1000 / freq).toFixed(2) + ' ms', rightM, botM + 18);

    /* Phase shift annotation */
    if (Math.abs(phys.phiDeg) > 0.5) {
      var phaseLabel = phys.phiDeg > 0 ? 'V leads I by ' : 'I leads V by ';
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(phaseLabel + Math.abs(phys.phiDeg).toFixed(1) + '\u00B0', leftM + 4, botM + 18);
    }
  }

  /* ================================================================
     DRAWING — VERTICAL DIVIDER between phasor and waveform
     ================================================================ */

  function drawDivider() {
    ctx.save();
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(430, 30);
    ctx.lineTo(430, H - 20);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /* ================================================================
     DRAWING — EXPLORE MODE CONCEPT DIAGRAMS
     ================================================================ */

  function drawExploreCanvas() {
    clearCanvas();

    if (!selectedConcept) {
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Select a concept below to view its diagram', W / 2, H / 2);
      return;
    }

    var c = selectedConcept;
    var ccx = W / 2, ccy = H / 2;

    /* Title */
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(c.name, ccx, 15);

    /* Formula */
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255,160,0,0.55)';
    ctx.fillText(c.formula, ccx, 38);

    switch (c.diagram) {
      case 'acVoltage':           drawDiagAcVoltage(ccx, ccy); break;
      case 'frequency':           drawDiagFrequency(ccx, ccy); break;
      case 'phaseAngle':          drawDiagPhaseAngle(ccx, ccy); break;
      case 'inductiveReactance':  drawDiagXL(ccx, ccy); break;
      case 'capacitiveReactance': drawDiagXC(ccx, ccy); break;
      case 'impedanceTriangle':   drawDiagImpedance(ccx, ccy); break;
      case 'resonantFrequency':   drawDiagResonance(ccx, ccy); break;
      case 'qFactor':             drawDiagQFactor(ccx, ccy); break;
      case 'powerFactor':         drawDiagPowerFactor(ccx, ccy); break;
    }
  }

  /* --- AC Voltage & Current diagram --- */
  function drawDiagAcVoltage(cx, cy) {
    var left = 100, right = W - 100, plotW = right - left, amp = 140;

    /* Axes */
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(left, cy); ctx.lineTo(right, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, cy - amp - 20); ctx.lineTo(left, cy + amp + 20); ctx.stroke();

    /* Sine wave */
    ctx.beginPath();
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2.5;
    for (var px = 0; px <= plotW; px++) {
      var a = (px / plotW) * TWO_PI * 2;
      var y = cy - Math.sin(a) * amp;
      if (px === 0) ctx.moveTo(left + px, y); else ctx.lineTo(left + px, y);
    }
    ctx.stroke();

    /* Vp dashed lines */
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,85,85,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(left, cy - amp); ctx.lineTo(right, cy - amp); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, cy + amp); ctx.lineTo(right, cy + amp); ctx.stroke();
    ctx.restore();

    /* Vrms dashed lines */
    var rmsY = amp / Math.sqrt(2);
    ctx.save();
    ctx.setLineDash([6, 3]);
    ctx.strokeStyle = 'rgba(61,220,132,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(left, cy - rmsY); ctx.lineTo(right, cy - rmsY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, cy + rmsY); ctx.lineTo(right, cy + rmsY); ctx.stroke();
    ctx.restore();

    /* Labels */
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Vp', left - 8, cy - amp);
    ctx.fillText('\u2212Vp', left - 8, cy + amp);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Vrms', left - 8, cy - rmsY);

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Vrms = Vp / \u221A2 \u2248 0.707 \u00D7 Vp', cx, cy + amp + 45);
  }

  /* --- Frequency & Period diagram --- */
  function drawDiagFrequency(cx, cy) {
    var left = 100, right = W - 100, plotW = right - left, amp = 90;

    /* Low frequency wave */
    ctx.beginPath();
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;
    for (var px = 0; px <= plotW; px++) {
      var a = (px / plotW) * TWO_PI * 1.5;
      var y = cy - 70 - Math.sin(a) * amp;
      if (px === 0) ctx.moveTo(left + px, y); else ctx.lineTo(left + px, y);
    }
    ctx.stroke();

    /* High frequency wave */
    ctx.beginPath();
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
    for (var px2 = 0; px2 <= plotW; px2++) {
      var a2 = (px2 / plotW) * TWO_PI * 5;
      var y2 = cy + 70 - Math.sin(a2) * amp;
      if (px2 === 0) ctx.moveTo(left + px2, y2); else ctx.lineTo(left + px2, y2);
    }
    ctx.stroke();

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Low frequency (long period T)', left, cy - amp - 45);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('High frequency (short period T)', left, cy + 15);

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C9 = 2\u03C0f     T = 1/f     Higher f = more cycles per second', cx, cy + amp + 55);
  }

  /* --- Phase Angle diagram --- */
  function drawDiagPhaseAngle(cx, cy) {
    var left = 100, right = W - 100, plotW = right - left, amp = 120;
    var phaseShift = PI / 4;

    /* Voltage wave (reference) */
    ctx.beginPath();
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;
    for (var px = 0; px <= plotW; px++) {
      var a = (px / plotW) * TWO_PI * 2;
      var y = cy - Math.sin(a) * amp;
      if (px === 0) ctx.moveTo(left + px, y); else ctx.lineTo(left + px, y);
    }
    ctx.stroke();

    /* Current wave (lagging by 45 degrees) */
    ctx.beginPath();
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
    for (var px2 = 0; px2 <= plotW; px2++) {
      var a2 = (px2 / plotW) * TWO_PI * 2 - phaseShift;
      var y2 = cy - Math.sin(a2) * amp * 0.7;
      if (px2 === 0) ctx.moveTo(left + px2, y2); else ctx.lineTo(left + px2, y2);
    }
    ctx.stroke();

    /* Phase shift annotation */
    var shiftPx = (phaseShift / (TWO_PI * 2)) * plotW;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(left + plotW * 0.25, cy + amp + 15);
    ctx.lineTo(left + plotW * 0.25 + shiftPx, cy + amp + 15);
    ctx.stroke();
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C6', left + plotW * 0.25 + shiftPx / 2, cy + amp + 30);

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('V (reference)', right - 140, cy - amp + 10);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('I (lagging)', right - 140, cy - amp + 28);

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('Inductive: V leads I (\u03C6 > 0)  |  Capacitive: I leads V (\u03C6 < 0)  |  Resonance: \u03C6 = 0', cx, cy + amp + 50);
  }

  /* --- Inductive Reactance XL diagram --- */
  function drawDiagXL(cx, cy) {
    var left = 150, right = W - 100, top = 80, bot = H - 80;
    var plotW = right - left, plotH = bot - top;

    /* Axes */
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, bot); ctx.lineTo(right, bot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke();

    /* Linear line XL = 2*pi*f*L */
    ctx.beginPath();
    ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 3;
    ctx.moveTo(left, bot);
    ctx.lineTo(right, top);
    ctx.stroke();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#00bcd4'; ctx.textAlign = 'center';
    ctx.fillText('XL = 2\u03C0fL', cx + 80, top + 40);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'center';
    ctx.fillText('Frequency (f) \u2192', cx, bot + 30);
    ctx.save(); ctx.translate(left - 30, cy); ctx.rotate(-PI / 2);
    ctx.fillText('XL (\u03A9) \u2192', 0, 0); ctx.restore();

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
    ctx.fillText('XL increases linearly with frequency \u2014 inductors block high frequencies', cx, bot + 55);
  }

  /* --- Capacitive Reactance XC diagram --- */
  function drawDiagXC(cx, cy) {
    var left = 150, right = W - 100, top = 80, bot = H - 80;
    var plotW = right - left, plotH = bot - top;

    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, bot); ctx.lineTo(right, bot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke();

    /* Hyperbolic curve XC = 1/(2*pi*f*C) */
    ctx.beginPath();
    ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 3;
    for (var px = 1; px <= plotW; px++) {
      var fNorm = px / plotW;
      var xc = Math.min(1, 0.12 / fNorm);
      var y = bot - xc * plotH;
      if (px === 1) ctx.moveTo(left + px, y); else ctx.lineTo(left + px, y);
    }
    ctx.stroke();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#e040fb'; ctx.textAlign = 'left';
    ctx.fillText('XC = 1/(2\u03C0fC)', left + 20, top + 20);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'center';
    ctx.fillText('Frequency (f) \u2192', cx, bot + 30);
    ctx.save(); ctx.translate(left - 30, cy); ctx.rotate(-PI / 2);
    ctx.fillText('XC (\u03A9) \u2192', 0, 0); ctx.restore();

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
    ctx.fillText('XC decreases with frequency \u2014 capacitors block DC, pass high frequencies', cx, bot + 55);
  }

  /* --- Impedance Triangle diagram --- */
  function drawDiagImpedance(cx, cy) {
    var triW = 260, triH = 180;
    var ox = cx - triW / 2, oy = cy + triH / 3;

    /* R (horizontal base) */
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + triW, oy);
    ctx.strokeStyle = '#ffa000'; ctx.lineWidth = 3; ctx.stroke();

    /* X = XL - XC (vertical) */
    ctx.beginPath(); ctx.moveTo(ox + triW, oy); ctx.lineTo(ox + triW, oy - triH);
    ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 3; ctx.stroke();

    /* Z (hypotenuse) */
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + triW, oy - triH);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 3; ctx.stroke();

    /* Angle arc */
    ctx.beginPath();
    ctx.arc(ox, oy, 40, -Math.atan2(triH, triW), 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.font = 'bold 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffa000'; ctx.fillText('R', cx, oy + 8);

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00bcd4'; ctx.fillText('XL\u2212XC', ox + triW + 8, oy - triH / 2);

    ctx.save();
    ctx.translate(cx - 20, oy - triH / 2 - 20);
    ctx.rotate(-Math.atan2(triH, triW));
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('Z', 0, -10);
    ctx.restore();

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left'; ctx.fillText('\u03C6', ox + 48, oy - 10);

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center';
    ctx.fillText('Z = \u221A(R\u00B2 + (XL\u2212XC)\u00B2)    \u03C6 = arctan((XL\u2212XC)/R)', cx, oy + 60);
  }

  /* --- Resonant Frequency diagram --- */
  function drawDiagResonance(cx, cy) {
    var left = 150, right = W - 100, top = 80, bot = H - 80;
    var plotW = right - left, plotH = bot - top;

    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, bot); ctx.lineTo(right, bot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke();

    /* Resonance response curve (Lorentzian) */
    var f0Frac = 0.5;
    var QDemo = 8;
    ctx.beginPath();
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
    for (var px = 1; px <= plotW; px++) {
      var fNorm = (px / plotW) * 2;
      if (fNorm < 0.01) fNorm = 0.01;
      var ratio = fNorm / f0Frac;
      var resp = 1 / Math.sqrt(1 + QDemo * QDemo * (ratio - 1 / ratio) * (ratio - 1 / ratio));
      var y = bot - resp * plotH * 0.9;
      if (px === 1) ctx.moveTo(left + px, y); else ctx.lineTo(left + px, y);
    }
    ctx.stroke();

    /* f0 marker */
    var f0X = left + f0Frac / 2 * plotW;
    ctx.save(); ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,160,0,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(f0X, top); ctx.lineTo(f0X, bot); ctx.stroke();
    ctx.restore();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffa000'; ctx.textAlign = 'center';
    ctx.fillText('f\u2080', f0X, bot + 18);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'center';
    ctx.fillText('Frequency \u2192', cx, bot + 35);
    ctx.save(); ctx.translate(left - 30, cy); ctx.rotate(-PI / 2);
    ctx.fillText('Current \u2192', 0, 0); ctx.restore();

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('Imax at f\u2080', f0X + 90, top + 15);

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
    ctx.fillText('At resonance: XL = XC, Z = R (min), I = max, \u03C6 = 0\u00B0', cx, bot + 55);
  }

  /* --- Q Factor diagram --- */
  function drawDiagQFactor(cx, cy) {
    var left = 150, right = W - 100, top = 80, bot = H - 80;
    var plotW = right - left, plotH = bot - top;

    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(left, bot); ctx.lineTo(right, bot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, bot); ctx.stroke();

    var f0Frac = 0.5;

    /* High-Q curve (sharp peak) */
    ctx.beginPath();
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;
    for (var px = 1; px <= plotW; px++) {
      var fNorm = (px / plotW) * 2;
      if (fNorm < 0.01) fNorm = 0.01;
      var ratio = fNorm / f0Frac;
      var resp = 1 / Math.sqrt(1 + 225 * (ratio - 1 / ratio) * (ratio - 1 / ratio));
      var y = bot - resp * plotH * 0.9;
      if (px === 1) ctx.moveTo(left + px, y); else ctx.lineTo(left + px, y);
    }
    ctx.stroke();

    /* Low-Q curve (wide peak) */
    ctx.beginPath();
    ctx.strokeStyle = '#00bcd4'; ctx.lineWidth = 2.5;
    for (var px2 = 1; px2 <= plotW; px2++) {
      var fNorm2 = (px2 / plotW) * 2;
      if (fNorm2 < 0.01) fNorm2 = 0.01;
      var ratio2 = fNorm2 / f0Frac;
      var resp2 = 1 / Math.sqrt(1 + 9 * (ratio2 - 1 / ratio2) * (ratio2 - 1 / ratio2));
      var y2 = bot - resp2 * plotH * 0.9;
      if (px2 === 1) ctx.moveTo(left + px2, y2); else ctx.lineTo(left + px2, y2);
    }
    ctx.stroke();

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff5555'; ctx.fillText('High Q (narrow BW, sharp)', right - 230, top + 15);
    ctx.fillStyle = '#00bcd4'; ctx.fillText('Low Q (wide BW, broad)', right - 230, top + 35);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.textAlign = 'center';
    ctx.fillText('Frequency \u2192', cx, bot + 30);

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.textAlign = 'center';
    ctx.fillText('Q = f\u2080/BW = (1/R)\u221A(L/C)  |  Higher Q = sharper resonance, lower R', cx, bot + 55);
  }

  /* --- Power Factor (power triangle) diagram --- */
  function drawDiagPowerFactor(cx, cy) {
    var triW = 240, triH = 150;
    var ox = cx - triW / 2, oy = cy + triH / 3;

    /* Real power P (horizontal) */
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + triW, oy);
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3; ctx.stroke();

    /* Reactive power Q_var (vertical) */
    ctx.beginPath(); ctx.moveTo(ox + triW, oy); ctx.lineTo(ox + triW, oy - triH);
    ctx.strokeStyle = '#e040fb'; ctx.lineWidth = 3; ctx.stroke();

    /* Apparent power S (hypotenuse) */
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + triW, oy - triH);
    ctx.strokeStyle = '#ffa000'; ctx.lineWidth = 3; ctx.stroke();

    /* Angle arc */
    ctx.beginPath();
    ctx.arc(ox, oy, 35, -Math.atan2(triH, triW), 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.font = 'bold 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.fillStyle = '#3ddc84';
    ctx.fillText('P (Real Power, W)', cx, oy + 18);
    ctx.textAlign = 'left'; ctx.fillStyle = '#e040fb';
    ctx.fillText('Q (Reactive, VAR)', ox + triW + 8, oy - triH / 2);
    ctx.fillStyle = '#ffa000'; ctx.textAlign = 'right';
    ctx.fillText('S (Apparent, VA)', ox - 8, oy - triH / 2);

    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'left'; ctx.fillText('\u03C6', ox + 42, oy - 8);

    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.textAlign = 'center';
    ctx.fillText('PF = cos(\u03C6) = P/S = R/Z  |  PF = 1 at resonance (\u03C6 = 0)', cx, oy + 60);
  }

  /* ================================================================
     DRAWING — FORMULA REFERENCE (Practice/Quiz canvas)
     ================================================================ */

  function drawFormulaReference() {
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,160,0,0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('RLC Circuit \u2014 Formula Reference', W / 2, 20);

    var formulas = [
      { label: 'Inductive Reactance',  formula: 'XL = 2\u03C0fL',                    color: '#00bcd4' },
      { label: 'Capacitive Reactance', formula: 'XC = 1 / (2\u03C0fC)',               color: '#e040fb' },
      { label: 'Impedance (series)',    formula: 'Z = \u221A(R\u00B2 + (XL\u2212XC)\u00B2)', color: '#ff5555' },
      { label: 'Phase Angle',          formula: '\u03C6 = arctan((XL\u2212XC) / R)',   color: '#ffa000' },
      { label: 'Resonant Frequency',   formula: 'f\u2080 = 1 / (2\u03C0\u221A(LC))',  color: '#3ddc84' },
      { label: 'Q Factor',             formula: 'Q = (1/R)\u221A(L/C)',               color: '#42a5f5' },
      { label: 'Power Factor',         formula: 'PF = cos(\u03C6) = R/Z',             color: '#ffa000' },
      { label: 'Current (RMS)',        formula: 'Irms = Vrms / Z',                    color: '#3ddc84' }
    ];

    var startY = 65;
    var colW = 380;
    var col1X = W / 2 - colW / 2 - 30;
    var col2X = W / 2 + 30;

    for (var i = 0; i < formulas.length; i++) {
      var col = i < 4 ? 0 : 1;
      var row = i < 4 ? i : i - 4;
      var fx = col === 0 ? col1X : col2X;
      var fy = startY + row * 95;

      ctx.font = 'bold 11px "Segoe UI", sans-serif';
      ctx.fillStyle = formulas[i].color;
      ctx.textAlign = 'left';
      ctx.fillText(formulas[i].label, fx, fy);

      ctx.font = 'bold 15px "Courier New", monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText(formulas[i].formula, fx, fy + 20);

      /* Separator line */
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy + 50);
      ctx.lineTo(fx + colW - 40, fy + 50);
      ctx.stroke();
    }
  }

  /* ================================================================
     DRAWING — MAIN DRAW FUNCTION
     ================================================================ */

  function draw(t) {
    clearCanvas();

    if (mode === 'simulate') {
      drawPhasorDiagram(t);
      drawDivider();
      drawWaveform(t);
    } else if (mode === 'explore') {
      drawExploreCanvas();
    } else {
      /* Practice or Quiz — show formula reference */
      drawFormulaReference();
    }
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    var dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    /* Advance animation at a steady angular rate */
    var speed = TWO_PI * 0.5;  /* 0.5 revolutions per second */
    animTime += speed * dt;

    calcPhysics();
    draw(animTime);
    updateReadouts();

    animFrame = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (!animFrame) {
      lastTimestamp = 0;
      animFrame = requestAnimationFrame(animate);
    }
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

  function setMode(m) {
    mode = m;
    hideAll();

    if (m === 'simulate') {
      simPanel.style.display = '';
      cvs.parentElement.style.display = '';
      startAnim();
    } else if (m === 'explore') {
      cvs.parentElement.style.display = '';
      catRow.style.display = '';
      itemSelector.style.display = '';
      buildConceptGrid();
      if (selectedConcept) showConceptInfo(selectedConcept);
      stopAnim();
      calcPhysics();
      drawExploreCanvas();
    } else if (m === 'practice') {
      cvs.parentElement.style.display = '';
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      if (!curProblem) newPracticeProblem();
      stopAnim();
      calcPhysics();
      draw(0);
    } else if (m === 'quiz') {
      cvs.parentElement.style.display = '';
      quizBar.style.display = '';
      startQuiz();
      stopAnim();
      calcPhysics();
      draw(0);
    }
  }

  modeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    modeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    setMode(m);
  });

  /* ================================================================
     CIRCUIT TYPE SWITCHING
     ================================================================ */

  circuitTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    circuitType = e.target.dataset.type;
    circuitTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
  });

  /* ================================================================
     SLIDER EVENT LISTENERS
     ================================================================ */

  rSlider.addEventListener('input', function () {
    R = parseFloat(this.value);
    rValEl.innerHTML = R + ' &Omega;';
  });

  lSlider.addEventListener('input', function () {
    L = parseFloat(this.value);
    lValEl.textContent = L.toFixed(1) + ' mH';
  });

  cSlider.addEventListener('input', function () {
    C = parseFloat(this.value);
    cValEl.innerHTML = C.toFixed(1) + ' \u03BCF';
  });

  fSlider.addEventListener('input', function () {
    freq = parseFloat(this.value);
    fValEl.textContent = freq + ' Hz';
  });

  vpSlider.addEventListener('input', function () {
    Vpeak = parseFloat(this.value);
    vpValEl.textContent = Vpeak.toFixed(1) + ' V';
  });

  /* ================================================================
     PRESETS
     ================================================================ */

  var presets = {
    resonance: { r: 100, l: 10,  c: 10,  f: 0, vp: 12 },
    highq:     { r: 10,  l: 50,  c: 10,  f: 0, vp: 12 },
    lowpass:   { r: 1000, l: 100, c: 100, f: 50, vp: 12 },
    radio:     { r: 50,  l: 0.5, c: 1,   f: 0, vp: 12 }
  };

  /* Compute actual resonant frequencies for presets */
  presets.resonance.f = Math.round(1 / (TWO_PI * Math.sqrt((10 / 1000) * (10 / 1e6))));       /* ~503 Hz */
  presets.highq.f     = Math.round(1 / (TWO_PI * Math.sqrt((50 / 1000) * (10 / 1e6))));       /* ~225 Hz */
  presets.radio.f     = Math.min(1000, Math.round(1 / (TWO_PI * Math.sqrt((0.5 / 1000) * (1 / 1e6))))); /* ~7118 Hz, clamped to 1000 */

  document.querySelector('.preset-row').addEventListener('click', function (e) {
    var btn = e.target.closest('.preset-btn');
    if (!btn) return;
    var p = presets[btn.dataset.preset];
    if (!p) return;

    /* Highlight active preset */
    document.querySelectorAll('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    /* Apply values, clamping frequency to slider range */
    R = p.r;
    rSlider.value = p.r;
    rValEl.innerHTML = p.r + ' &Omega;';

    L = p.l;
    lSlider.value = p.l;
    lValEl.textContent = p.l.toFixed(1) + ' mH';

    C = p.c;
    cSlider.value = p.c;
    cValEl.innerHTML = p.c.toFixed(1) + ' \u03BCF';

    var fClamped = Math.min(1000, Math.max(1, p.f));
    freq = fClamped;
    fSlider.value = fClamped;
    fValEl.textContent = fClamped + ' Hz';

    Vpeak = p.vp;
    vpSlider.value = p.vp;
    vpValEl.textContent = p.vp.toFixed(1) + ' V';
  });

  /* ================================================================
     EXPLORE MODE — CATEGORY & CONCEPT GRID
     ================================================================ */

  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildConceptGrid();
    itemInfo.style.display = 'none';
    selectedConcept = null;
    if (mode === 'explore') drawExploreCanvas();
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
        if (mode === 'explore') drawExploreCanvas();
      });
      conceptGrid.appendChild(btn);
    });
  }

  function showConceptInfo(c) {
    itemInfo.style.display = '';
    var catLabels = {
      fundamentals: 'AC Fundamentals',
      impedance: 'Impedance & Reactance',
      resonance: 'Resonance & Power'
    };
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

    document.getElementById('quiz-next').addEventListener('click', function () { nextQuizQuestion(); });
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
  setMode('simulate');

})();
