(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS (8 concepts, 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── basics ────────────────────────────────────────────────────── */
    {
      id: 'em-induction', name: 'Electromagnetic Induction', symbol: '\u03B5 = -d\u03A6/dt',
      formula: '\u03B5 = -N \u00D7 d\u03A6/dt', unit: 'V (volts)',
      cat: 'basics',
      desc: "Faraday's law of electromagnetic induction states that a changing magnetic flux through a coil induces an electromotive force (EMF) proportional to the rate of change of flux. The negative sign (Lenz's law) indicates the induced EMF opposes the change that causes it. In a transformer, alternating current in the primary winding creates a time-varying magnetic flux in the iron core, which links to the secondary winding and induces an output voltage. The magnitude of the induced EMF depends on the number of turns and the rate of flux change.",
      diagram: 'emInduction',
      example: { problem: 'A coil of 200 turns experiences a flux change of 0.05 Wb in 0.01 s. Find the induced EMF.', steps: ['\u03B5 = N \u00D7 \u0394\u03A6/\u0394t', '\u03B5 = 200 \u00D7 0.05 / 0.01', '\u03B5 = 200 \u00D7 5', '\u03B5 = 1000 V'], answer: 1000, unit: 'V' }
    },
    {
      id: 'turns-ratio', name: 'Turns Ratio', symbol: 'a = N\u2082/N\u2081',
      formula: 'a = N\u2082/N\u2081 = V\u2082/V\u2081', unit: '(dimensionless)',
      cat: 'basics',
      desc: 'The turns ratio (a) is the most fundamental parameter of a transformer. It is defined as the ratio of secondary turns to primary turns: a = N\u2082/N\u2081. In an ideal transformer, this ratio also equals the voltage ratio: V\u2082/V\u2081 = N\u2082/N\u2081. The turns ratio determines whether the transformer steps voltage up (a > 1) or down (a < 1). If a = 1, the transformer is an isolation transformer with equal input and output voltage. The current ratio is the inverse: I\u2081/I\u2082 = N\u2082/N\u2081.',
      diagram: 'turnsRatio',
      example: { problem: 'A transformer has N\u2081 = 100 and N\u2082 = 400. Find the turns ratio and V\u2082 if V\u2081 = 120 V.', steps: ['a = N\u2082/N\u2081 = 400/100', 'a = 4 (step-up)', 'V\u2082 = a \u00D7 V\u2081 = 4 \u00D7 120', 'V\u2082 = 480 V'], answer: 480, unit: 'V' }
    },
    {
      id: 'step-types', name: 'Step-Up vs Step-Down', symbol: 'N\u2082 \u2277 N\u2081',
      formula: 'Step-Up: a > 1 | Step-Down: a < 1', unit: '',
      cat: 'basics',
      desc: 'A step-up transformer has more secondary turns than primary turns (N\u2082 > N\u2081), so a > 1 and V\u2082 > V\u2081. It increases voltage while proportionally decreasing current, keeping power constant. Step-up transformers are used at power stations to raise voltage for efficient long-distance transmission. A step-down transformer has fewer secondary turns (N\u2082 < N\u2081), so a < 1 and V\u2082 < V\u2081. It decreases voltage while increasing current. Step-down transformers are used near consumers to reduce transmission voltage to safe, usable levels (e.g. 240 V or 120 V).',
      diagram: 'stepTypes',
      example: { problem: 'A step-down transformer reduces 11 kV to 220 V with N\u2081 = 5000. Find N\u2082.', steps: ['a = V\u2082/V\u2081 = 220/11000 = 0.02', 'N\u2082 = a \u00D7 N\u2081', 'N\u2082 = 0.02 \u00D7 5000', 'N\u2082 = 100 turns'], answer: 100, unit: 'turns' }
    },

    /* ── losses ────────────────────────────────────────────────────── */
    {
      id: 'copper-loss', name: 'Copper Losses', symbol: 'P_cu = I\u00B2R',
      formula: 'P_cu = I\u2081\u00B2R_p + I\u2082\u00B2R_s', unit: 'W (watts)',
      cat: 'losses',
      desc: 'Copper losses (I\u00B2R losses) occur in the winding resistance of the transformer. Both the primary and secondary windings have finite resistance, so current flowing through them generates heat. Copper losses are proportional to the square of the current, which means they increase rapidly with load. To minimise copper losses, transformers use thick copper wire and keep winding lengths short. Copper losses are the dominant loss at high loads and are zero at no load.',
      diagram: 'copperLoss',
      example: { problem: 'Primary: R_p = 2 \u03A9, I\u2081 = 3 A. Secondary: R_s = 3 \u03A9, I\u2082 = 1.5 A. Find total copper loss.', steps: ['P_cu = I\u2081\u00B2R_p + I\u2082\u00B2R_s', 'P_cu = 3\u00B2 \u00D7 2 + 1.5\u00B2 \u00D7 3', 'P_cu = 18 + 6.75', 'P_cu = 24.75 W'], answer: 24.75, unit: 'W' }
    },
    {
      id: 'iron-loss', name: 'Iron / Core Losses', symbol: 'P_fe = P_h + P_e',
      formula: 'P_iron = P_hysteresis + P_eddy', unit: 'W (watts)',
      cat: 'losses',
      desc: 'Iron losses (core losses) occur in the transformer core and have two components. Hysteresis loss is energy wasted as magnetic domains in the core reverse direction each AC cycle \u2014 it depends on the core material and frequency. Eddy current loss is caused by circulating currents induced in the conductive core by the changing flux. Eddy currents are reduced by laminating the core into thin insulated sheets. Iron losses are approximately constant regardless of load, because the core flux depends on the applied voltage, not the load current.',
      diagram: 'ironLoss',
      example: { problem: 'A transformer has hysteresis loss of 3 W and eddy current loss of 2 W. Find total iron loss.', steps: ['P_iron = P_h + P_e', 'P_iron = 3 + 2', 'P_iron = 5 W'], answer: 5, unit: 'W' }
    },
    {
      id: 'efficiency', name: 'Transformer Efficiency', symbol: '\u03B7 = P_out/P_in',
      formula: '\u03B7 = (P_out / P_in) \u00D7 100%', unit: '%',
      cat: 'losses',
      desc: 'Transformer efficiency is the ratio of output power to input power, expressed as a percentage. In an ideal transformer, efficiency is 100%. In a real transformer, efficiency is reduced by copper losses and iron losses: \u03B7 = P_out / (P_out + P_cu + P_iron) \u00D7 100%. Well-designed power transformers achieve efficiencies of 95\u201399%. Maximum efficiency occurs when copper losses equal iron losses. Distribution transformers are designed for maximum efficiency at about 50\u201375% of full load.',
      diagram: 'efficiency',
      example: { problem: 'P_out = 950 W. Copper losses = 30 W, iron losses = 20 W. Find efficiency.', steps: ['P_in = P_out + P_cu + P_iron', 'P_in = 950 + 30 + 20 = 1000 W', '\u03B7 = P_out/P_in \u00D7 100', '\u03B7 = 950/1000 \u00D7 100 = 95%'], answer: 95, unit: '%' }
    },

    /* ── applications ──────────────────────────────────────────────── */
    {
      id: 'power-transmission', name: 'Power Transmission', symbol: 'P_loss = I\u00B2R',
      formula: 'P_loss = (P/V)\u00B2 \u00D7 R_line', unit: 'W',
      cat: 'applications',
      desc: 'Transformers are essential for efficient electrical power transmission. Power stations generate electricity at moderate voltages (11\u201325 kV). Step-up transformers raise this to very high voltages (110\u2013765 kV) for long-distance transmission. Since P = VI, raising voltage allows the same power to be transmitted with much less current, dramatically reducing I\u00B2R losses in the transmission lines. At the destination, step-down transformers reduce voltage in stages for distribution (33 kV, 11 kV) and finally to consumer voltage (240 V or 120 V).',
      diagram: 'powerTransmission',
      example: { problem: '100 kW transmitted at 10 kV vs 100 kV over 5 \u03A9 lines. Compare line losses.', steps: ['At 10 kV: I = 100000/10000 = 10 A', 'P_loss = 10\u00B2 \u00D7 5 = 500 W', 'At 100 kV: I = 100000/100000 = 1 A', 'P_loss = 1\u00B2 \u00D7 5 = 5 W (100\u00D7 less!)'], answer: 5, unit: 'W' }
    },
    {
      id: 'impedance-matching', name: 'Impedance Matching', symbol: "Z' = Z_L/a\u00B2",
      formula: "Z_reflected = Z_load / a\u00B2", unit: '\u03A9',
      cat: 'applications',
      desc: 'Transformers can match impedances between a source and a load for maximum power transfer. When a load impedance Z_L is connected to the secondary, it appears on the primary side as Z_reflected = Z_L / a\u00B2. By choosing the correct turns ratio, a transformer can make a low-impedance load appear as a high-impedance load, or vice versa. This is critical in audio amplifiers (matching speaker impedance to amplifier output), RF circuits (matching antenna impedance), and industrial power systems.',
      diagram: 'impedanceMatching',
      example: { problem: 'An 8 \u03A9 speaker must appear as 200 \u03A9 to an amplifier. Find the turns ratio.', steps: ["Z' = Z_L / a\u00B2", '200 = 8 / a\u00B2', 'a\u00B2 = 8/200 = 0.04', 'a = 0.2 (so N\u2082/N\u2081 = 1/5)'], answer: 0.2, unit: '' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (8)
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }
  function pick(arr) { return arr[randInt(0, arr.length - 1)]; }

  var PROBLEM_GEN = [
    /* 0 — Find turns ratio given N1 and N2 */
    function () {
      var N1 = randInt(2, 10) * 50;
      var N2 = randInt(2, 10) * 50;
      var a = round2(N2 / N1);
      return { prompt: 'N\u2081 = ' + N1 + ', N\u2082 = ' + N2 + '. Find the turns ratio a = N\u2082/N\u2081.', steps: ['a = N\u2082/N\u2081', 'a = ' + N2 + ' / ' + N1, 'a = ' + a], answer: a, unit: '', tol: 0.02 };
    },
    /* 1 — Find V2 given V1 and turns ratio */
    function () {
      var V1 = pick([60, 100, 110, 120, 220, 230, 240]);
      var N1 = randInt(2, 8) * 50;
      var N2 = randInt(2, 8) * 50;
      var a = N2 / N1;
      var V2 = round2(a * V1);
      return { prompt: 'V\u2081 = ' + V1 + ' V, N\u2081 = ' + N1 + ', N\u2082 = ' + N2 + '. Find V\u2082 (V).', steps: ['a = N\u2082/N\u2081 = ' + N2 + '/' + N1 + ' = ' + round2(a), 'V\u2082 = a \u00D7 V\u2081', 'V\u2082 = ' + round2(a) + ' \u00D7 ' + V1, 'V\u2082 = ' + V2 + ' V'], answer: V2, unit: 'V', tol: 0.5 };
    },
    /* 2 — Find I2 given V2 and RL */
    function () {
      var V2 = randInt(5, 50) * 10;
      var RL = randInt(5, 100) * 10;
      var I2 = round2(V2 / RL);
      return { prompt: 'V\u2082 = ' + V2 + ' V, R_L = ' + RL + ' \u03A9. Find I\u2082 (A).', steps: ['I\u2082 = V\u2082 / R_L', 'I\u2082 = ' + V2 + ' / ' + RL, 'I\u2082 = ' + I2 + ' A'], answer: I2, unit: 'A', tol: 0.02 };
    },
    /* 3 — Find I1 given I2 and turns ratio (ideal) */
    function () {
      var I2 = round2(randInt(10, 300) / 100);
      var N1 = randInt(2, 8) * 50;
      var N2 = randInt(2, 8) * 50;
      var a = N2 / N1;
      var I1 = round2(I2 * a);
      return { prompt: 'Ideal: I\u2082 = ' + I2 + ' A, N\u2081 = ' + N1 + ', N\u2082 = ' + N2 + '. Find I\u2081 (A). [I\u2081 = I\u2082 \u00D7 a]', steps: ['a = N\u2082/N\u2081 = ' + round2(a), 'Power: V\u2081I\u2081 = V\u2082I\u2082', 'I\u2081 = I\u2082 \u00D7 (N\u2082/N\u2081)', 'I\u2081 = ' + I2 + ' \u00D7 ' + round2(a) + ' = ' + I1 + ' A'], answer: I1, unit: 'A', tol: 0.05 };
    },
    /* 4 — Find Pout given V2 and I2 */
    function () {
      var V2 = randInt(10, 50) * 10;
      var I2 = round2(randInt(10, 300) / 100);
      var P = round2(V2 * I2);
      return { prompt: 'V\u2082 = ' + V2 + ' V, I\u2082 = ' + I2 + ' A. Find P_out (W).', steps: ['P_out = V\u2082 \u00D7 I\u2082', 'P_out = ' + V2 + ' \u00D7 ' + I2, 'P_out = ' + P + ' W'], answer: P, unit: 'W', tol: 0.5 };
    },
    /* 5 — Find efficiency given Pin and Pout */
    function () {
      var Pout = randInt(20, 200) * 10;
      var loss = randInt(5, 50);
      var Pin = Pout + loss;
      var eff = round2(Pout / Pin * 100);
      return { prompt: 'P_in = ' + Pin + ' W, P_out = ' + Pout + ' W. Find efficiency (%).', steps: ['\u03B7 = P_out / P_in \u00D7 100', '\u03B7 = ' + Pout + ' / ' + Pin + ' \u00D7 100', '\u03B7 = ' + eff + '%'], answer: eff, unit: '%', tol: 0.5 };
    },
    /* 6 — Find N2 given V1, V2, N1 */
    function () {
      var V1 = pick([100, 110, 120, 220, 230, 240]);
      var V2 = randInt(5, 50) * 10;
      var N1 = randInt(2, 10) * 50;
      var N2 = round2(N1 * V2 / V1);
      return { prompt: 'V\u2081 = ' + V1 + ' V, V\u2082 = ' + V2 + ' V, N\u2081 = ' + N1 + '. Find N\u2082.', steps: ['V\u2082/V\u2081 = N\u2082/N\u2081', 'N\u2082 = N\u2081 \u00D7 V\u2082/V\u2081', 'N\u2082 = ' + N1 + ' \u00D7 ' + V2 + '/' + V1, 'N\u2082 = ' + N2], answer: N2, unit: 'turns', tol: 1 };
    },
    /* 7 — Find copper loss given I and R */
    function () {
      var I = round2(randInt(10, 500) / 100);
      var R = randInt(1, 10);
      var Pcu = round2(I * I * R);
      return { prompt: 'I = ' + I + ' A, winding resistance R = ' + R + ' \u03A9. Find copper loss (W).', steps: ['P_cu = I\u00B2R', 'P_cu = ' + I + '\u00B2 \u00D7 ' + R, 'P_cu = ' + round2(I * I) + ' \u00D7 ' + R, 'P_cu = ' + Pcu + ' W'], answer: Pcu, unit: 'W', tol: 0.1 };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (10 MCQ + 5 numeric, pick 5)
     ================================================================ */

  function genQuizPool() {
    var pool = [];

    /* 10 MCQ */
    pool.push({ type: 'mcq', prompt: 'The turns ratio of a transformer is defined as:', options: ['a = N\u2082/N\u2081', 'a = N\u2081/N\u2082', 'a = V\u2081/V\u2082', 'a = I\u2081/I\u2082'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'A step-up transformer has:', options: ['More secondary turns than primary', 'Fewer secondary turns than primary', 'Equal turns on both sides', 'No magnetic core'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'In an ideal transformer, which quantity is conserved?', options: ['Power (P\u2081 = P\u2082)', 'Voltage (V\u2081 = V\u2082)', 'Current (I\u2081 = I\u2082)', 'Resistance'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Copper losses in a transformer are proportional to:', options: ['I\u00B2 (current squared)', 'V\u00B2 (voltage squared)', 'Frequency', 'Core area'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Iron losses in a transformer core are reduced by:', options: ['Laminating the core', 'Using thicker wire', 'Increasing turns count', 'Adding load resistance'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'A transformer works on the principle of:', options: ['Electromagnetic induction', 'Electrostatics', 'Thermoelectric effect', 'Piezoelectric effect'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'If a transformer has a turns ratio of 10, what is V\u2082 when V\u2081 = 12 V?', options: ['120 V', '1.2 V', '12 V', '1200 V'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Maximum efficiency of a transformer occurs when:', options: ['Copper losses = Iron losses', 'Load is maximum', 'Load is minimum', 'Voltage is maximum'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'Eddy current losses are a type of:', options: ['Iron / core loss', 'Copper loss', 'Stray loss', 'Dielectric loss'], correct: 0 });
    pool.push({ type: 'mcq', prompt: 'In a step-down transformer, the secondary current is:', options: ['Greater than primary current', 'Less than primary current', 'Equal to primary current', 'Zero'], correct: 0 });

    /* 5 numeric */
    var N1a = randInt(2, 8) * 50;
    var N2a = randInt(2, 8) * 50;
    pool.push({ type: 'numeric', prompt: 'N\u2081 = ' + N1a + ', N\u2082 = ' + N2a + '. Find the turns ratio a.', answer: round2(N2a / N1a), unit: '', tol: 0.02 });

    var V1b = pick([100, 120, 220, 230, 240]);
    var N1b = randInt(2, 5) * 100;
    var N2b = randInt(2, 5) * 100;
    pool.push({ type: 'numeric', prompt: 'V\u2081 = ' + V1b + ' V, N\u2081 = ' + N1b + ', N\u2082 = ' + N2b + '. V\u2082 (V)?', answer: round2(V1b * N2b / N1b), unit: 'V', tol: 0.5 });

    var V2c = randInt(10, 48) * 10;
    var RLc = randInt(5, 50) * 10;
    pool.push({ type: 'numeric', prompt: 'V\u2082 = ' + V2c + ' V, R_L = ' + RLc + ' \u03A9. I\u2082 (A)?', answer: round2(V2c / RLc), unit: 'A', tol: 0.02 });

    var Poutd = randInt(50, 500);
    var Pind = Poutd + randInt(10, 50);
    pool.push({ type: 'numeric', prompt: 'P_in = ' + Pind + ' W, P_out = ' + Poutd + ' W. Efficiency (%)?', answer: round2(Poutd / Pind * 100), unit: '%', tol: 0.5 });

    var Ie = round2(randInt(10, 400) / 100);
    var Re = randInt(1, 8);
    pool.push({ type: 'numeric', prompt: 'I = ' + Ie + ' A, R = ' + Re + ' \u03A9. Copper loss P_cu (W)?', answer: round2(Ie * Ie * Re), unit: 'W', tol: 0.2 });

    /* Shuffle entire pool */
    for (var i = pool.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    return pool;
  }

  /* ================================================================
     DOM REFS
     ================================================================ */

  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = cvs.width;   /* 900 set in HTML */
  var H = cvs.height;  /* 520 set in HTML */
  cvs.style.maxWidth = W + 'px';

  var simMode   = document.getElementById('sim-mode');
  var simPanel  = document.getElementById('sim-panel');
  var catRow    = document.getElementById('cat-row');
  var catTabs   = document.getElementById('cat-tabs');
  var itemSel   = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo  = document.getElementById('item-info');
  var practPanel = document.getElementById('practice-panel');
  var practBar  = document.getElementById('practice-bar');
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar   = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');

  var vSlider  = document.getElementById('v-slider');
  var n1Slider = document.getElementById('n1-slider');
  var n2Slider = document.getElementById('n2-slider');
  var rlSlider = document.getElementById('rl-slider');
  var chkReal  = document.getElementById('chk-real');
  var chkEq    = document.getElementById('chk-equation');
  var chkGrid  = document.getElementById('chk-grid');

  var vValEl  = document.getElementById('v-val');
  var n1ValEl = document.getElementById('n1-val');
  var n2ValEl = document.getElementById('n2-val');
  var rlValEl = document.getElementById('rl-val');

  var rRatio = document.getElementById('r-ratio');
  var rType  = document.getElementById('r-type');
  var rV2    = document.getElementById('r-v2');
  var rI1    = document.getElementById('r-i1');
  var rI2    = document.getElementById('r-i2');
  var rPin   = document.getElementById('r-pin');
  var rPout  = document.getElementById('r-pout');
  var rEff   = document.getElementById('r-eff');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var vPri = 120, nPri = 100, nSec = 200, rLoad = 500;
  var realMode = false;

  /* Canvas feature toggles (pedagogical aids) */
  var showEquation = true;
  var showGrid = false;

  /* Undo / redo */
  var undoStack = [], redoStack = [];

  /* Derived physics values */
  var ratio = 2, vSec = 240, iSec = 0.48, iPri = 0.96;
  var pIn = 115.2, pOut = 115.2, eff = 100;
  var copperLoss = 0, ironLoss = 0;
  var tType = 'Step-Up';

  /* Real transformer constants */
  var RP = 2;    /* primary winding resistance (\u03A9) */
  var RS = 3;    /* secondary winding resistance (\u03A9) */
  var PIRON = 5; /* fixed iron core loss (W) */

  /* Animation */
  var animTime = 0;
  var lastTS = 0;
  var animId = null;

  /* Practice */
  var pracScore = 0, pracTotal = 0, pracCur = null, pracDone = false;

  /* Quiz */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizHistory = [];
  var quizDone = false;

  /* Explore */
  var exploreCat = 'basics';
  var exploreItem = null;

  /* ================================================================
     PHYSICS
     ================================================================ */

  function calcPhysics() {
    vPri  = parseFloat(vSlider.value);
    nPri  = parseInt(n1Slider.value);
    nSec  = parseInt(n2Slider.value);
    rLoad = parseFloat(rlSlider.value);
    realMode = chkReal.checked;

    ratio = nSec / nPri;
    tType = ratio > 1.001 ? 'Step-Up' : ratio < 0.999 ? 'Step-Down' : '1:1';

    if (!realMode) {
      /* Ideal transformer */
      vSec = vPri * ratio;
      iSec = vSec / rLoad;
      iPri = iSec * ratio;  /* power conservation: V1*I1 = V2*I2 */
      pOut = vSec * iSec;
      pIn  = pOut;
      eff  = 100;
      copperLoss = 0;
      ironLoss   = 0;
    } else {
      /* Real transformer with losses */
      vSec = vPri * ratio;
      iSec = vSec / rLoad;
      iPri = iSec * ratio;
      copperLoss = iPri * iPri * RP + iSec * iSec * RS;
      ironLoss   = PIRON;
      pOut = vSec * iSec;
      pIn  = pOut + copperLoss + ironLoss;
      eff  = pIn > 0 ? (pOut / pIn) * 100 : 0;
    }
  }

  function setNum(el, val) {
    /* Mirror state into the companion number input without stomping typing. */
    if (el && document.activeElement !== el && el.value != val) el.value = val;
  }

  function updateReadouts() {
    setNum(vValEl, vPri);
    setNum(n1ValEl, nPri);
    setNum(n2ValEl, nSec);
    setNum(rlValEl, rLoad);

    rRatio.textContent = ratio.toFixed(2);
    rType.textContent  = tType;
    rV2.textContent    = vSec.toFixed(1);
    rI1.textContent    = iPri < 100 ? iPri.toFixed(3) : iPri.toFixed(1);
    rI2.textContent    = iSec < 100 ? iSec.toFixed(3) : iSec.toFixed(1);
    rPin.textContent   = pIn < 10000 ? pIn.toFixed(1) : (pIn / 1000).toFixed(2) + 'k';
    rPout.textContent  = pOut < 10000 ? pOut.toFixed(1) : (pOut / 1000).toFixed(2) + 'k';
    rEff.textContent   = eff.toFixed(1);

    if (typeof updateLearnPanels === 'function') updateLearnPanels();
    if (typeof updateCoach === 'function') updateCoach();
  }

  /* ================================================================
     DRAWING HELPERS
     ================================================================ */

  function clearCanvas() {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   '#1b2334');
    bg.addColorStop(0.5, '#141a28');
    bg.addColorStop(1,   '#0d121c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    /* warm spotlight behind the core (where the flux/energy lives) */
    var glow = ctx.createRadialGradient(W * 0.5, 185, 30, W * 0.5, 185, 260);
    glow.addColorStop(0, 'rgba(255,140,40,0.07)');
    glow.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  /* Path-length utilities for dot animation */
  function pathLen(pts) {
    var len = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0];
      var dy = pts[i][1] - pts[i - 1][1];
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  function ptOnPath(pts, t) {
    var total = pathLen(pts);
    var target = t * total;
    var acc = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i - 1][0];
      var dy = pts[i][1] - pts[i - 1][1];
      var seg = Math.sqrt(dx * dx + dy * dy);
      if (acc + seg >= target && seg > 0) {
        var f = (target - acc) / seg;
        return [pts[i - 1][0] + dx * f, pts[i - 1][1] + dy * f];
      }
      acc += seg;
    }
    return pts[pts.length - 1];
  }

  /* ================================================================
     DRAWING — IRON CORE
     ================================================================ */

  /* Rounded-rect path helper */
  function rr(x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawCoreWindow(x, y, w, h) {
    ctx.fillStyle = '#0d121c';
    ctx.fillRect(x, y, w, h);
    /* inner shadow — top */
    var t = ctx.createLinearGradient(x, y, x, y + 14);
    t.addColorStop(0, 'rgba(0,0,0,0.55)'); t.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = t; ctx.fillRect(x, y, w, 14);
    /* inner shadow — left */
    var l = ctx.createLinearGradient(x, y, x + 14, y);
    l.addColorStop(0, 'rgba(0,0,0,0.45)'); l.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = l; ctx.fillRect(x, y, 14, h);
  }

  function drawCore() {
    var cx = W * 0.5;
    var cy = 185;
    var cW = 210, cH = 190;
    var leg = 28;
    var cL = cx - cW / 2;
    var cT = cy - cH / 2;

    /* Grounding drop shadow */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 20; ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 9;
    ctx.fillStyle = '#222a3c';
    ctx.fillRect(cL, cT, cW, cH);
    ctx.restore();

    /* Laminated silicon-steel body — directional metallic gradient */
    var g = ctx.createLinearGradient(cL, cT, cL + cW, cT + cH);
    g.addColorStop(0,    '#7385a4');
    g.addColorStop(0.35, '#48526e');
    g.addColorStop(0.70, '#39425b');
    g.addColorStop(1,    '#2a3146');
    ctx.fillStyle = g;
    ctx.fillRect(cL, cT, cW, cH);

    /* Stacked-sheet laminations — fine alternating horizontal edges */
    ctx.save();
    ctx.beginPath(); ctx.rect(cL, cT, cW, cH); ctx.clip();
    var li = 0;
    for (var y = cT + 1; y < cT + cH; y += 3) {
      ctx.strokeStyle = (li % 2 === 0) ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.20)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cL, y + 0.5); ctx.lineTo(cL + cW, y + 0.5); ctx.stroke();
      li++;
    }
    ctx.restore();

    /* Windows (punch-outs with inner shadow) */
    drawCoreWindow(cL + leg, cT + leg, cW / 2 - leg * 1.5, cH - leg * 2);
    drawCoreWindow(cx + leg * 0.5, cT + leg, cW / 2 - leg * 1.5, cH - leg * 2);

    /* Bevel — top/left highlight, right/bottom shadow */
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.moveTo(cL + 0.75, cT + cH); ctx.lineTo(cL + 0.75, cT + 0.75); ctx.lineTo(cL + cW, cT + 0.75); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath(); ctx.moveTo(cL + cW - 0.75, cT); ctx.lineTo(cL + cW - 0.75, cT + cH - 0.75); ctx.lineTo(cL, cT + cH - 0.75); ctx.stroke();

    /* Label on the top yoke (clear of the windings and the N₁/N₂ labels) */
    ctx.fillStyle = 'rgba(210,222,245,0.5)';
    ctx.font = '8.5px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LAMINATED CORE', cx, cT + leg / 2);
  }

  /* ================================================================
     DRAWING — COIL WINDINGS
     ================================================================ */

  function drawCoils() {
    var cx = W * 0.5;
    var cy = 185;
    var cH = 190, leg = 28;
    var coilTop = cy - cH / 2 + leg + 6;
    var coilBot = cy + cH / 2 - leg - 6;
    var coilH = coilBot - coilTop;

    var priLoops = Math.max(4, Math.min(12, Math.round(nPri / 40)));
    var secLoops = Math.max(4, Math.min(12, Math.round(nSec / 40)));
    var priTermX = cx - leg / 2 - 4;   /* 432 \u2014 where the primary wires connect */
    var secTermX = cx + leg / 2 + 4;   /* 468 \u2014 where the secondary wires connect */

    /* Primary winding (copper) bulges left into the left window */
    drawCoilCylinder(priTermX, coilTop, coilH, priLoops, -1, '#ff6d00', '#7a3300', '#ffb673');
    /* Secondary winding bulges right into the right window */
    drawCoilCylinder(secTermX, coilTop, coilH, secLoops, 1, '#42a5f5', '#15466f', '#a9d9ff');

    /* Labels below coils */
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ff6d00';
    ctx.fillText('N\u2081 = ' + nPri, priTermX - 26, coilBot + 12);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('N\u2082 = ' + nSec, secTermX + 26, coilBot + 12);
  }

  /* 3-D wound coil: a shaded cylinder of stacked wire turns wrapping a core
     limb. `side` -1 = body extends left (primary), +1 = right (secondary).
     Connection terminals stay at termX so the external wires still meet them. */
  function drawCoilCylinder(termX, top, height, loops, side, base, lo, hi) {
    var bodyW = 50;
    var x0 = side < 0 ? termX - bodyW : termX;
    var cxBody = x0 + bodyW / 2;

    /* Cylinder body \u2014 horizontal gradient gives the round-bobbin shading */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.40)';
    ctx.shadowBlur = 8; ctx.shadowOffsetX = side * 3; ctx.shadowOffsetY = 4;
    var g = ctx.createLinearGradient(x0, 0, x0 + bodyW, 0);
    g.addColorStop(0, lo); g.addColorStop(0.5, hi); g.addColorStop(1, lo);
    ctx.fillStyle = g;
    rr(x0, top, bodyW, height, 8); ctx.fill();
    ctx.restore();

    /* Wire turns \u2014 sagging grooves + highlights read as wound wire */
    var turnH = height / loops;
    for (var i = 0; i < loops; i++) {
      var y = top + (i + 0.5) * turnH;
      ctx.strokeStyle = 'rgba(0,0,0,0.40)';
      ctx.lineWidth = Math.max(1.4, turnH * 0.34);
      ctx.beginPath();
      ctx.moveTo(x0 + 3, y);
      ctx.quadraticCurveTo(cxBody, y + turnH * 0.20, x0 + bodyW - 3, y);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.26)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x0 + 4, y - turnH * 0.30);
      ctx.quadraticCurveTo(cxBody, y - turnH * 0.10, x0 + bodyW - 4, y - turnH * 0.30);
      ctx.stroke();
    }

    /* Top rim ellipse (cylinder cap) */
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.ellipse(cxBody, top, bodyW / 2, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = hi; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cxBody, top, bodyW / 2, 5, 0, Math.PI, Math.PI * 2); ctx.stroke();

    /* Connection terminals at termX (top + bottom) \u2014 wires attach here */
    [top, top + height].forEach(function (ty) {
      ctx.fillStyle = base;
      ctx.beginPath(); ctx.arc(termX, ty, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(termX, ty, 4, 0, Math.PI * 2); ctx.stroke();
    });
  }

  /* ================================================================
     DRAWING — MAGNETIC FLUX ARROWS (animated)
     ================================================================ */

  function drawFlux() {
    var cx = W * 0.5;
    var cy = 185;
    var cW = 210, cH = 190, leg = 28;
    var cL = cx - cW / 2;
    var cT = cy - cH / 2;

    /* Speed proportional to voltage */
    var speed = 0.15 + vPri * 0.003;
    var t = (animTime * speed) % 1;

    /* Left window flux path (clockwise) */
    var pL = [
      [cL + leg / 2, cT + leg / 2],
      [cx - leg / 2, cT + leg / 2],
      [cx - leg / 2, cT + cH - leg / 2],
      [cL + leg / 2, cT + cH - leg / 2]
    ];
    /* Right window flux path (clockwise) */
    var pR = [
      [cx + leg / 2, cT + leg / 2],
      [cL + cW - leg / 2, cT + leg / 2],
      [cL + cW - leg / 2, cT + cH - leg / 2],
      [cx + leg / 2, cT + cH - leg / 2]
    ];

    /* Glowing flux ribbon in the iron (intensity ∝ primary voltage) */
    var intensity = Math.min(1, 0.25 + vPri * 0.004);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,170,40,' + (0.08 + 0.14 * intensity) + ')';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,170,40,0.55)';
    ctx.shadowBlur = 12;
    [pL, pR].forEach(function (pts) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      ctx.stroke();
    });
    ctx.restore();

    drawFluxLoop(pL, t);
    drawFluxLoop(pR, t);
  }

  function drawFluxLoop(pts, t) {
    var n = 5;
    /* Close the loop by appending first point */
    var closed = pts.concat([pts[0]]);
    for (var i = 0; i < n; i++) {
      var frac = ((t + i / n) % 1 + 1) % 1;
      var pos = ptOnPath(closed, frac);
      var pos2 = ptOnPath(closed, Math.min(frac + 0.015, 0.999));
      var angle = Math.atan2(pos2[1] - pos[1], pos2[0] - pos[0]);

      ctx.save();
      ctx.translate(pos[0], pos[1]);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.35 + 0.25 * Math.sin(frac * Math.PI * 2);
      ctx.fillStyle = '#ffa000';
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }

  /* ================================================================
     DRAWING — AC SOURCE
     ================================================================ */

  function drawACSource() {
    var x = 195, y = 185;

    /* Circle */
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Sine wave inside */
    ctx.beginPath();
    for (var i = -14; i <= 14; i++) {
      var px = x + i;
      var py = y - Math.sin(i / 14 * Math.PI) * 9;
      if (i === -14) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Labels */
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff6d00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('AC', x, y + 26);
    ctx.fillText(vPri + ' V', x, y + 40);
  }

  /* ================================================================
     DRAWING — LOAD RESISTOR (vertical zigzag)
     ================================================================ */

  function drawLoad() {
    var x = 710, y = 185;
    var peaks = 5, amp = 10, segH = 10;
    var totH = peaks * segH;

    ctx.beginPath();
    ctx.moveTo(x, y - totH / 2 - 12);
    ctx.lineTo(x, y - totH / 2);
    for (var i = 0; i < peaks; i++) {
      var py = y - totH / 2 + i * segH + segH / 2;
      var px = (i % 2 === 0) ? x + amp : x - amp;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x, y + totH / 2);
    ctx.lineTo(x, y + totH / 2 + 12);
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('R\u2097', x + 16, y - 8);
    ctx.fillText(rLoad + ' \u03A9', x + 16, y + 8);
  }

  /* ================================================================
     DRAWING — EXTERNAL WIRES + CURRENT DOTS
     ================================================================ */

  function drawExternalCircuit() {
    var cx = W * 0.5;
    var cy = 185;
    var cH = 190, leg = 28;
    var coilTop = cy - cH / 2 + leg + 6;
    var coilBot = cy + cH / 2 - leg - 6;

    var priLoops = Math.max(4, Math.min(12, Math.round(nPri / 40)));
    var secLoops = Math.max(4, Math.min(12, Math.round(nSec / 40)));

    var priX = cx - leg / 2 - 4;
    var secX = cx + leg / 2 + 4;
    var priTopY = coilTop;
    var priBotY = coilTop + priLoops * ((coilBot - coilTop) / priLoops);
    var secTopY = coilTop;
    var secBotY = coilTop + secLoops * ((coilBot - coilTop) / secLoops);

    var acX = 195, acY = 185;
    var ldX = 710, ldY = 185;

    /* Primary side wires */
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 2;

    /* AC top terminal -> coil top */
    ctx.beginPath();
    ctx.moveTo(acX, acY - 22);
    ctx.lineTo(acX, priTopY);
    ctx.lineTo(priX, priTopY);
    ctx.stroke();

    /* Coil bottom -> AC bottom terminal */
    ctx.beginPath();
    ctx.moveTo(priX, priBotY);
    ctx.lineTo(acX, priBotY);
    ctx.lineTo(acX, acY + 22);
    ctx.stroke();

    /* Secondary side wires */
    ctx.strokeStyle = '#42a5f5';

    /* Coil top -> load top */
    ctx.beginPath();
    ctx.moveTo(secX, secTopY);
    ctx.lineTo(ldX, secTopY);
    ctx.lineTo(ldX, ldY - 37);
    ctx.stroke();

    /* Coil bottom -> load bottom */
    ctx.beginPath();
    ctx.moveTo(secX, secBotY);
    ctx.lineTo(ldX, secBotY);
    ctx.lineTo(ldX, ldY + 37);
    ctx.stroke();

    /* V1 label */
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillStyle = '#ff6d00';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('V\u2081', acX - 28, cy);

    /* V2 and I labels */
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'left';
    ctx.fillText('V\u2082 = ' + vSec.toFixed(1) + ' V', ldX + 18, ldY + 40);

    /* Current labels */
    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('I\u2081 = ' + (iPri < 100 ? iPri.toFixed(3) : iPri.toFixed(1)) + ' A', acX, priBotY + 20);
    ctx.fillText('I\u2082 = ' + (iSec < 100 ? iSec.toFixed(3) : iSec.toFixed(1)) + ' A', ldX, secBotY + 20);

    /* Animated current dots */
    if (iPri > 0.0001) {
      var speed = Math.min(0.1 + iPri * 0.3, 1.5);
      var priPath = [
        [acX, acY - 22], [acX, priTopY], [priX, priTopY],
        [priX, priBotY],
        [acX, priBotY], [acX, acY + 22]
      ];
      drawDots(priPath, Math.max(4, Math.min(10, Math.round(iPri * 8))), speed, '#ff6d00');
    }

    if (iSec > 0.0001) {
      var sSpeed = Math.min(0.1 + iSec * 0.3, 1.5);
      var secPath = [
        [secX, secTopY], [ldX, secTopY], [ldX, ldY - 37],
        [ldX, ldY + 37],
        [ldX, secBotY], [secX, secBotY]
      ];
      drawDots(secPath, Math.max(4, Math.min(10, Math.round(iSec * 8))), sSpeed, '#42a5f5');
    }
  }

  function drawDots(pts, count, speed, color) {
    var t0 = (animTime * speed) % 1;
    for (var d = 0; d < count; d++) {
      var t = ((t0 + d / count) % 1 + 1) % 1;
      var p = ptOnPath(pts, t);
      ctx.beginPath();
      ctx.arc(p[0], p[1], 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.5;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /* ================================================================
     DRAWING — AC WAVEFORM COMPARISON
     ================================================================ */

  function drawWaveforms() {
    var wX = 55, wY = 425, wW = 350, wH = 70;

    /* Box */
    ctx.fillStyle = 'rgba(22,27,39,0.92)';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(wX - 8, wY - wH / 2 - 18, wW + 16, wH + 36);
    ctx.fill(); ctx.stroke();

    /* Title */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('AC Waveform Comparison', wX, wY - wH / 2 - 13);

    /* Zero line */
    ctx.beginPath();
    ctx.moveTo(wX, wY); ctx.lineTo(wX + wW, wY);
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1; ctx.stroke();

    /* Normalise */
    var maxV = Math.max(vPri, vSec, 1);
    var scaleP = (wH / 2 - 4) / maxV;
    var scaleS = (wH / 2 - 4) / maxV;
    var ampP = Math.min(vPri * scaleP, wH / 2 - 2);
    var ampS = Math.min(vSec * scaleS, wH / 2 - 2);
    var phase = animTime * 3;
    var phaseShift = realMode ? 0.12 : 0;

    /* Primary */
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= wW; i++) {
      var tVal = i / wW * Math.PI * 4 + phase;
      var yVal = wY - Math.sin(tVal) * ampP;
      if (i === 0) ctx.moveTo(wX + i, yVal); else ctx.lineTo(wX + i, yVal);
    }
    ctx.stroke();

    /* Secondary */
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var j = 0; j <= wW; j++) {
      var tVal2 = j / wW * Math.PI * 4 + phase - phaseShift;
      var yVal2 = wY - Math.sin(tVal2) * ampS;
      if (j === 0) ctx.moveTo(wX + j, yVal2); else ctx.lineTo(wX + j, yVal2);
    }
    ctx.stroke();

    /* Legend */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    var legX = wX + wW - 130;
    ctx.fillStyle = '#ff6d00';
    ctx.fillRect(legX, wY - wH / 2 - 10, 14, 3);
    ctx.fillText('V\u2081 = ' + vPri + ' V', legX + 18, wY - wH / 2 - 8);

    ctx.fillStyle = '#42a5f5';
    ctx.fillRect(legX, wY - wH / 2 + 2, 14, 3);
    ctx.fillText('V\u2082 = ' + vSec.toFixed(1) + ' V', legX + 18, wY - wH / 2 + 4);
  }

  /* ================================================================
     DRAWING — LOSS INFO PANEL (real mode only)
     ================================================================ */

  function drawLossPanel() {
    if (!realMode) return;

    var lX = 470, lY = 398, lW = 400, lH = 100;

    ctx.fillStyle = 'rgba(22,27,39,0.94)';
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(lX, lY, lW, lH);
    ctx.fill(); ctx.stroke();

    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('REAL TRANSFORMER LOSSES', lX + 10, lY + 8);

    ctx.font = '11px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Copper (I\u00B2R): ' + copperLoss.toFixed(2) + ' W', lX + 10, lY + 28);
    ctx.fillText('Iron (core):  ' + ironLoss.toFixed(2) + ' W', lX + 10, lY + 44);
    ctx.fillText('Total losses: ' + (copperLoss + ironLoss).toFixed(2) + ' W', lX + 10, lY + 60);

    ctx.fillStyle = eff >= 90 ? '#3ddc84' : eff >= 70 ? '#f5c842' : '#ff5555';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText('Efficiency: ' + eff.toFixed(1) + '%', lX + 10, lY + 80);

    /* Mini bars */
    var bX = lX + 220, bY = lY + 30, bW = 150, bH = 12;
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(bX, bY, bW, bH);
    ctx.fillRect(bX, bY + 20, bW, bH);

    var cuFr = pIn > 0 ? Math.min(copperLoss / pIn * 10, 1) : 0;
    ctx.fillStyle = '#ff7043';
    ctx.fillRect(bX, bY, bW * cuFr, bH);
    ctx.font = '9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Cu', bX + bW + 5, bY + bH / 2);

    var feFr = pIn > 0 ? Math.min(ironLoss / pIn * 10, 1) : 0;
    ctx.fillStyle = '#7e57c2';
    ctx.fillRect(bX, bY + 20, bW * feFr, bH);
    ctx.fillText('Fe', bX + bW + 5, bY + 20 + bH / 2);
  }

  /* ================================================================
     DRAWING — TYPE BADGE + INFO HEADER
     ================================================================ */

  function drawHeader() {
    ctx.font = 'bold 16px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (tType === 'Step-Up') {
      ctx.fillStyle = '#3ddc84';
      ctx.fillText('\u25B2 Step-Up Transformer', 18, 12);
    } else if (tType === 'Step-Down') {
      ctx.fillStyle = '#42a5f5';
      ctx.fillText('\u25BC Step-Down Transformer', 18, 12);
    } else {
      ctx.fillStyle = '#f5c842';
      ctx.fillText('\u25C6 1:1 Isolation Transformer', 18, 12);
    }

    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = 'rgba(221,227,240,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText('a = ' + ratio.toFixed(2), W - 18, 12);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = realMode ? '#ff5555' : '#3ddc84';
    ctx.fillText(realMode ? 'Real (with losses)' : 'Ideal (lossless)', W - 18, 32);
  }

  /* ================================================================
     DRAWING — BACKGROUND GRID (toggle)
     ================================================================ */

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(120,140,180,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x <= W; x += 30) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke();
    }
    for (var y = 0; y <= H; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
    }
    ctx.restore();
  }

  /* ================================================================
     DRAWING — CLASSICAL TURNS-RATIO EQUATION (toggle)
     Drawn near the top-centre gap; V₂/V₁ = N₂/N₁ = a, live values.
     ================================================================ */

  function drawEquation() {
    var cy = 62;                 /* centre Y in the free band above the core */
    var sVar = 16, sSub = 10, sVal = 12, sEq = 19;
    var C_V = '#ff8a65', C_N = '#42a5f5', C_A = '#f5c842', C_EQ = '#cdd6e6';

    var varFont = 'italic 700 ' + sVar + 'px "Cambria Math","Times New Roman",serif';
    var subFont =         '700 ' + sSub + 'px "Cambria Math","Times New Roman",serif';
    var valFont =         '700 ' + sVal + 'px "Courier New",monospace';
    var eqFont  =         '700 ' + sEq  + 'px "Cambria Math","Times New Roman",serif';

    ctx.save();
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

    var aTxt  = ratio.toFixed(2);
    var vrTxt = (vPri > 0 ? (vSec / vPri).toFixed(2) : '—');
    var nrTxt = nPri > 0 ? (nSec / nPri).toFixed(2) : '—';

    /* Measure a stacked fraction "X₂ / X₁ = ratio" */
    function fracWidth(letter, vtxt) {
      ctx.font = varFont; var wVar = ctx.measureText(letter).width;
      ctx.font = subFont; var wSub = ctx.measureText('2').width;
      ctx.font = valFont; var wVal = ctx.measureText(' = ' + vtxt).width;
      return wVar + wSub + wVal;
    }
    function wText(txt, font) { ctx.font = font; return ctx.measureText(txt).width; }

    var wFracV = fracWidth('V', vrTxt);
    var wFracN = fracWidth('N', nrTxt);
    var wEq    = wText(' = ', eqFont);
    var wA     = (function () {
      ctx.font = varFont; var a = ctx.measureText('a').width;
      ctx.font = valFont; var b = ctx.measureText(' = ' + aTxt).width;
      return a + b;
    })();
    var total = wFracV + wEq + wFracN + wEq + wA;
    var x = Math.round((W - total) / 2);

    var vSpan = Math.round(sVar * 0.62);

    function drawFrac(cx, letter, vtxt, vColor) {
      /* numerator letter+₂, denominator letter+₁, bar between, then = value */
      ctx.font = varFont; ctx.fillStyle = vColor;
      ctx.fillText(letter, cx, cy - vSpan);
      var wTop = ctx.measureText(letter).width;
      ctx.font = subFont; ctx.fillText('2', cx + wTop, cy - vSpan + Math.round(sVar * 0.22));

      ctx.font = varFont; ctx.fillStyle = vColor;
      ctx.fillText(letter, cx, cy + vSpan);
      ctx.font = subFont; ctx.fillText('1', cx + wTop, cy + vSpan + Math.round(sVar * 0.22));

      ctx.font = varFont; var letW = ctx.measureText(letter).width;
      ctx.font = subFont; var subW = ctx.measureText('1').width;
      var barW = letW + subW;
      ctx.strokeStyle = '#cdd6e6'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(cx - 2, cy); ctx.lineTo(cx + barW + 2, cy); ctx.stroke();

      ctx.font = valFont; ctx.fillStyle = '#e6edf6';
      ctx.fillText(' = ' + vtxt, cx + barW, cy);
    }

    drawFrac(x, 'V', vrTxt, C_V); x += wFracV;
    ctx.font = eqFont; ctx.fillStyle = C_EQ; ctx.fillText(' = ', x, cy); x += wEq;
    drawFrac(x, 'N', nrTxt, C_N); x += wFracN;
    ctx.font = eqFont; ctx.fillStyle = C_EQ; ctx.fillText(' = ', x, cy); x += wEq;
    ctx.font = varFont; ctx.fillStyle = C_A; ctx.fillText('a', x, cy);
    var wa = ctx.measureText('a').width;
    ctx.font = valFont; ctx.fillStyle = '#e6edf6'; ctx.fillText(' = ' + aTxt, x + wa, cy);

    ctx.restore();
  }

  /* ================================================================
     DRAWING — MAIN RENDER (pure, reads state only)
     ================================================================ */

  function draw() {
    clearCanvas();
    if (showGrid) drawGrid();
    drawHeader();
    drawCore();
    drawCoils();
    drawFlux();
    drawACSource();
    drawLoad();
    drawExternalCircuit();
    drawWaveforms();
    drawLossPanel();
    if (showEquation) drawEquation();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate(ts) {
    if (!lastTS) lastTS = ts;
    var dt = (ts - lastTS) / 1000;
    lastTS = ts;
    animTime += dt;

    if (mode === 'simulate') {
      calcPhysics();
      updateReadouts();
      draw();
    }
    animId = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (!animId) {
      lastTS = 0;
      animId = requestAnimationFrame(animate);
    }
  }

  function stopAnim() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function hideAll() {
    simMode.style.display = 'none';
    catRow.style.display = 'none';
    itemSel.style.display = 'none';
    itemInfo.style.display = 'none';
    practPanel.style.display = 'none';
    practBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';
  }

  function setMode(m) {
    mode = m;
    hideAll();

    if (m === 'simulate') {
      simMode.style.display = '';
      startAnim();
    } else {
      stopAnim();
    }

    if (m === 'explore') {
      catRow.style.display = '';
      itemSel.style.display = '';
      renderConceptGrid();
      if (exploreItem) renderConceptInfo();
    }

    if (m === 'practice') {
      practPanel.style.display = '';
      practBar.style.display = '';
      if (!pracCur) newPractice();
    }

    if (m === 'quiz') {
      startQuiz();
    }
  }

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    if (m === mode) return;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    setMode(m);
  });

  /* ================================================================
     INPUT BINDING — sliders + companion number steppers
     The slider is the source of truth; calcPhysics() reads slider.value.
     ================================================================ */

  function render() { if (mode === 'simulate') draw(); }

  function refresh() { calcPhysics(); updateReadouts(); updatePresetBtns(); render(); }

  function clampNum(el, val) {
    var lo = parseFloat(el.min), hi = parseFloat(el.max);
    if (isNaN(val)) return parseFloat(el.value) || lo;
    return Math.max(lo, Math.min(hi, val));
  }

  function bindPair(slider, numEl) {
    slider.addEventListener('input', function () {
      if (document.activeElement !== numEl) numEl.value = slider.value;
      refresh();
    });
    /* Commit AFTER state is recalculated (calcPhysics runs in refresh). */
    slider.addEventListener('change', function () { refresh(); commitUndo(); });
    numEl.addEventListener('change', function () {
      var v = clampNum(numEl, parseFloat(numEl.value));
      /* Snap to the slider's step so the thumb tracks the typed value. */
      var step = parseFloat(slider.step) || 1;
      v = Math.round(v / step) * step;
      numEl.value = v;
      slider.value = v;
      refresh();
      commitUndo();
    });
  }
  bindPair(vSlider, vValEl);
  bindPair(n1Slider, n1ValEl);
  bindPair(n2Slider, n2ValEl);
  bindPair(rlSlider, rlValEl);

  chkReal.addEventListener('change', function () { refresh(); commitUndo(); });
  chkEq.addEventListener('change', function () { showEquation = chkEq.checked; render(); commitUndo(); });
  chkGrid.addEventListener('change', function () { showGrid = chkGrid.checked; render(); commitUndo(); });

  /* ================================================================
     PRESETS
     ================================================================ */

  var PRESETS = {
    stepup:    { v: 120, n1: 100, n2: 200, rl: 500, real: false },
    stepdown:  { v: 230, n1: 200, n2: 100, rl: 100, real: false },
    isolation: { v: 120, n1: 150, n2: 150, rl: 500, real: false },
    real:      { v: 230, n1: 100, n2: 300, rl: 80,  real: true  },
    heavy:     { v: 120, n1: 100, n2: 200, rl: 20,  real: true  }
  };

  function applyValues(s) {
    vSlider.value  = s.v;  vValEl.value  = s.v;
    n1Slider.value = s.n1; n1ValEl.value = s.n1;
    n2Slider.value = s.n2; n2ValEl.value = s.n2;
    rlSlider.value = s.rl; rlValEl.value = s.rl;
    chkReal.checked = !!s.real;
    if (s.eq   !== undefined) { showEquation = !!s.eq;   chkEq.checked = showEquation; }
    if (s.grid !== undefined) { showGrid = !!s.grid;     chkGrid.checked = showGrid; }
  }

  function applyPreset(name) {
    var p = PRESETS[name]; if (!p) return;
    applyValues(p);
    refresh();
    commitUndo();
  }

  document.getElementById('preset-btns').addEventListener('click', function (e) {
    var btn = e.target.closest('.preset-btn');
    if (btn) applyPreset(btn.dataset.preset);
  });

  function updatePresetBtns() {
    document.querySelectorAll('.preset-btn').forEach(function (b) {
      var p = PRESETS[b.dataset.preset];
      var match = p && p.v === vPri && p.n1 === nPri && p.n2 === nSec && p.rl === rLoad && !!p.real === realMode;
      b.classList.toggle('active', !!match);
    });
  }

  /* ================================================================
     UNDO / REDO
     ================================================================ */

  function snap() {
    return { v: vPri, n1: nPri, n2: nSec, rl: rLoad, real: realMode, eq: showEquation, grid: showGrid };
  }
  var lastSnap = snap();

  function updateUndoBtns() {
    var u = document.getElementById('btn-undo'), r = document.getElementById('btn-redo');
    if (u) u.disabled = undoStack.length === 0;
    if (r) r.disabled = redoStack.length === 0;
  }

  function commitUndo() {
    var cur = snap();
    /* Only record when something actually changed since the last commit. */
    if (JSON.stringify(cur) === JSON.stringify(lastSnap)) return;
    undoStack.push(lastSnap);
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    lastSnap = cur;
    updateUndoBtns();
  }

  function performUndo() {
    if (!undoStack.length) return;
    redoStack.push(snap());
    var s = undoStack.pop();
    applyValues(s);
    refresh();
    lastSnap = snap();
    updateUndoBtns();
  }

  function performRedo() {
    if (!redoStack.length) return;
    undoStack.push(snap());
    var s = redoStack.pop();
    applyValues(s);
    refresh();
    lastSnap = snap();
    updateUndoBtns();
  }

  function resetAll() {
    applyValues({ v: 120, n1: 100, n2: 200, rl: 500, real: false, eq: true, grid: false });
    refresh();
    commitUndo();
  }

  document.getElementById('btn-undo').addEventListener('click', performUndo);
  document.getElementById('btn-redo').addEventListener('click', performRedo);
  document.getElementById('btn-reset').addEventListener('click', resetAll);

  document.addEventListener('keydown', function (e) {
    if (mode !== 'simulate') return;
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
    if (typing) return;
    if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (e.shiftKey) performRedo(); else performUndo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault(); performRedo();
    }
  });

  /* ================================================================
     LIVE EQUATIONS PANEL + WHAT-IF COACH (KaTeX, cached)
     ================================================================ */

  var _cache = { eq: '', coach: '' };

  function fmt(x, d) {
    if (!isFinite(x)) return '—';
    if (d === undefined) d = 2;
    return (Math.round(x * Math.pow(10, d)) / Math.pow(10, d)).toString();
  }

  function updateLearnPanels() {
    var eq = document.getElementById('lp-eq-body'); if (!eq) return;
    var html = '';
    html += '<div class="eq-line">\\[ a = \\dfrac{N_2}{N_1} = \\dfrac{' + nSec + '}{' + nPri + '} = ' + fmt(ratio) + ' \\]</div>';
    html += '<div class="eq-line">\\[ V_2 = a \\cdot V_1 = ' + fmt(ratio) + ' \\cdot ' + fmt(vPri, 0) + ' = \\mathbf{' + fmt(vSec, 1) + '\\;\\mathrm{V}} \\]</div>';
    html += '<div class="eq-line">\\[ I_2 = \\dfrac{V_2}{R_L} = \\dfrac{' + fmt(vSec, 1) + '}{' + fmt(rLoad, 0) + '} = \\mathbf{' + fmt(iSec, 3) + '\\;\\mathrm{A}} \\]</div>';
    html += '<div class="eq-line">\\[ I_1 = a \\cdot I_2 = ' + fmt(ratio) + ' \\cdot ' + fmt(iSec, 3) + ' = \\mathbf{' + fmt(iPri, 3) + '\\;\\mathrm{A}} \\]</div>';
    if (realMode) {
      html += '<div class="eq-line">\\[ P_{cu} = I_1^2 R_p + I_2^2 R_s = ' + fmt(copperLoss, 2) + '\\;\\mathrm{W},\\; P_{fe} = ' + fmt(ironLoss, 1) + '\\;\\mathrm{W} \\]</div>';
      html += '<div class="eq-line">\\[ \\eta = \\dfrac{P_{out}}{P_{out}+P_{cu}+P_{fe}} \\times 100 = \\mathbf{' + fmt(eff, 1) + '\\%} \\]</div>';
    } else {
      html += '<div class="eq-line">\\[ P_1 = V_1 I_1 = V_2 I_2 = P_2 = \\mathbf{' + fmt(pOut, 1) + '\\;\\mathrm{W}} \\quad (\\eta = 100\\%) \\]</div>';
    }
    if (html !== _cache.eq) {
      eq.innerHTML = html; _cache.eq = html;
      if (window.renderMathInElement) try { window.renderMathInElement(eq, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (err) {}
    }
  }

  function updateCoach() {
    var el = document.getElementById('lp-coach-body'); if (!el) return;
    var tips = [];
    if (tType === 'Step-Up') tips.push('<strong>Step-up (a = ' + fmt(ratio) + '):</strong> voltage rises to ' + fmt(vSec, 1) + ' V while primary current (' + fmt(iPri, 3) + ' A) exceeds secondary (' + fmt(iSec, 3) + ' A). High-voltage / low-current is how grids cut I&sup2;R line losses.');
    else if (tType === 'Step-Down') tips.push('<strong>Step-down (a = ' + fmt(ratio) + '):</strong> voltage drops to ' + fmt(vSec, 1) + ' V and secondary current (' + fmt(iSec, 3) + ' A) is larger than primary (' + fmt(iPri, 3) + ' A) &mdash; the LV cables must be thicker.');
    else tips.push('<strong>1:1 isolation:</strong> V&#8322; equals V&#8321; (' + fmt(vSec, 1) + ' V). No voltage change, but the windings are galvanically isolated for safety.');

    if (realMode) {
      if (copperLoss > ironLoss * 1.5) tips.push('<strong>Copper-dominated:</strong> at this load copper loss (' + fmt(copperLoss, 2) + ' W) far exceeds iron loss (' + fmt(ironLoss, 1) + ' W). Lower the load by raising R<sub>L</sub> to ease winding heating.');
      else if (ironLoss > copperLoss * 1.5) tips.push('<strong>Iron-dominated:</strong> light load makes constant iron loss (' + fmt(ironLoss, 1) + ' W) the main drain, so efficiency (' + fmt(eff, 1) + '%) is poor. Max efficiency is near where P_cu = P_fe.');
      else tips.push('<strong>Near peak efficiency:</strong> copper and iron losses are balanced &mdash; you are close to the transformer’s maximum-efficiency operating point (' + fmt(eff, 1) + '%).');
    } else {
      tips.push('<strong>Ideal mode:</strong> power is perfectly conserved (P&#8321; = P&#8322; = ' + fmt(pOut, 1) + ' W). Enable <em>Real Transformer</em> to see copper and iron losses pull efficiency below 100%.');
    }

    var html = tips.map(function (t) { return '<div class="coach-item">' + t + '</div>'; }).join('');
    if (html !== _cache.coach) { el.innerHTML = html; _cache.coach = html; }
  }

  /* Expand / collapse all learning cards */
  (function wireLearnPanels() {
    var exp = document.getElementById('learn-expand-all');
    var col = document.getElementById('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (exp) exp.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (col) col.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  })();

  /* ================================================================
     SHOW-CALCULATIONS MODAL
     ================================================================ */

  function calcStep(num, title, formula, calc, result) {
    var html = '<div class="cs-step"><div class="cs-step-hd">';
    html += '<span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula) html += '<div class="cs-formula">' + formula + '</div>';
    if (calc)    html += '<div class="cs-calc">' + calc + '</div>';
    if (result != null) html += '<div class="cs-result">→ ' + result + '</div>';
    return html + '</div>';
  }

  function buildCalcSteps() {
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Given &mdash; Current State</span>';
    html += '<div class="cs-given"><span>V₁ = ' + vPri + ' V</span><span>N₁ = ' + nPri + '</span><span>N₂ = ' + nSec + '</span><span>Rₗ = ' + rLoad + ' Ω</span><span>Mode: ' + (realMode ? 'Real (losses)' : 'Ideal') + '</span></div>';
    html += '<p class="cs-si-note">ⓘ All quantities in SI units (V, A, Ω, W).</p></div>';

    html += calcStep(1, 'Turns ratio',
      '\\( a = \\dfrac{N_2}{N_1} \\)',
      '\\( a = \\dfrac{' + nSec + '}{' + nPri + '} = ' + fmt(ratio) + ' \\)',
      '\\( a = \\mathbf{' + fmt(ratio) + '} \\) (' + tType + ')');

    html += calcStep(2, 'Secondary voltage',
      '\\( V_2 = a \\cdot V_1 \\)',
      '\\( V_2 = ' + fmt(ratio) + ' \\times ' + fmt(vPri, 0) + ' \\)',
      '\\( V_2 = \\mathbf{' + fmt(vSec, 1) + '\\;\\mathrm{V}} \\)');

    html += calcStep(3, 'Secondary current',
      '\\( I_2 = \\dfrac{V_2}{R_L} \\)',
      '\\( I_2 = \\dfrac{' + fmt(vSec, 1) + '}{' + fmt(rLoad, 0) + '} \\)',
      '\\( I_2 = \\mathbf{' + fmt(iSec, 3) + '\\;\\mathrm{A}} \\)');

    html += calcStep(4, 'Primary current',
      '\\( I_1 = a \\cdot I_2 \\quad (V_1 I_1 = V_2 I_2) \\)',
      '\\( I_1 = ' + fmt(ratio) + ' \\times ' + fmt(iSec, 3) + ' \\)',
      '\\( I_1 = \\mathbf{' + fmt(iPri, 3) + '\\;\\mathrm{A}} \\)');

    html += calcStep(5, 'Output power',
      '\\( P_{out} = V_2 I_2 \\)',
      '\\( P_{out} = ' + fmt(vSec, 1) + ' \\times ' + fmt(iSec, 3) + ' \\)',
      '\\( P_{out} = \\mathbf{' + fmt(pOut, 1) + '\\;\\mathrm{W}} \\)');

    if (realMode) {
      html += calcStep(6, 'Losses (R_p = ' + RP + ' Ω, R_s = ' + RS + ' Ω, P_fe = ' + PIRON + ' W)',
        '\\( P_{cu} = I_1^2 R_p + I_2^2 R_s \\)',
        '\\( P_{cu} = ' + fmt(iPri, 3) + '^2 (' + RP + ') + ' + fmt(iSec, 3) + '^2 (' + RS + ') = ' + fmt(copperLoss, 2) + '\\;\\mathrm{W} \\)',
        '\\( P_{loss} = P_{cu} + P_{fe} = \\mathbf{' + fmt(copperLoss + ironLoss, 2) + '\\;\\mathrm{W}} \\)');
      html += calcStep(7, 'Efficiency',
        '\\( \\eta = \\dfrac{P_{out}}{P_{out} + P_{cu} + P_{fe}} \\times 100 \\)',
        '\\( \\eta = \\dfrac{' + fmt(pOut, 1) + '}{' + fmt(pIn, 1) + '} \\times 100 \\)',
        '\\( \\eta = \\mathbf{' + fmt(eff, 1) + '\\%} \\) &mdash; real power transformers run 95–99%.');
    } else {
      html += calcStep(6, 'Efficiency (ideal)',
        '\\( \\eta = \\dfrac{P_{out}}{P_{in}} \\times 100,\\quad P_{in} = P_{out} \\)',
        '\\( \\eta = \\dfrac{' + fmt(pOut, 1) + '}{' + fmt(pOut, 1) + '} \\times 100 \\)',
        '\\( \\eta = \\mathbf{100\\%} \\) &mdash; an ideal transformer has no losses; enable Real mode to add them.');
    }
    return html;
  }

  function openCalcModal() {
    var modal = document.getElementById('calc-modal');
    var body = document.getElementById('calc-modal-body');
    if (!modal || !body) return;
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    if (window.renderMathInElement) try { window.renderMathInElement(body, { delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }], throwOnError: false }); } catch (err) {}
    var cb = document.getElementById('calc-modal-close'); if (cb) cb.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCalcModal() {
    var modal = document.getElementById('calc-modal'); if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    var b = document.getElementById('btn-calc'); if (b) b.focus();
  }
  document.getElementById('btn-calc').addEventListener('click', openCalcModal);
  document.getElementById('calc-modal-close').addEventListener('click', closeCalcModal);
  document.getElementById('calc-modal').addEventListener('click', function (e) {
    if (e.target === this) closeCalcModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var m = document.getElementById('calc-modal');
      if (m && m.classList.contains('active')) closeCalcModal();
      hideCtxMenu();
    }
  });

  /* ================================================================
     EXPORT — CSV (load sweep) + PNG
     ================================================================ */

  function exportCSV() {
    var rows = [['R_L (ohm)', 'V2 (V)', 'I2 (A)', 'I1 (A)', 'P_out (W)', 'P_in (W)', 'Efficiency (%)']];
    var a = nSec / nPri, v2 = vPri * a;
    for (var i = 0; i <= 50; i++) {
      var rl = 10 + i * (10000 - 10) / 50;
      var i2 = v2 / rl, i1 = i2 * a, po = v2 * i2;
      var pin, ef;
      if (realMode) {
        var cu = i1 * i1 * RP + i2 * i2 * RS;
        pin = po + cu + PIRON; ef = pin > 0 ? po / pin * 100 : 0;
      } else { pin = po; ef = 100; }
      rows.push([rl.toFixed(1), v2.toFixed(2), i2.toFixed(4), i1.toFixed(4), po.toFixed(2), pin.toFixed(2), ef.toFixed(2)]);
    }
    var csv = '# Transformer load sweep — V1=' + vPri + 'V, N1=' + nPri + ', N2=' + nSec + ', ' + (realMode ? 'Real' : 'Ideal') + '\n';
    csv += rows.map(function (r) { return r.join(','); }).join('\n');
    downloadBlob(csv, 'transformer-sweep.csv', 'text/csv');
  }

  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = cvs.width; tmp.height = cvs.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(cvs, 0, 0);
    tc.font = 'bold 16px "Segoe UI", sans-serif';
    tc.fillStyle = 'rgba(255,255,255,0.5)';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 10);
    tmp.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'transformer.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  function downloadBlob(text, name, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  document.getElementById('btn-csv').addEventListener('click', exportCSV);
  document.getElementById('btn-png').addEventListener('click', exportPNG);

  /* ================================================================
     CANVAS CONTEXT MENU
     ================================================================ */

  var ctxMenu = document.getElementById('ctx-menu');

  function showCtxMenu(x, y) {
    var items = [
      { label: '📷 Export PNG', act: exportPNG },
      { label: '💾 Export CSV', act: exportCSV },
      { label: '📋 Copy V₂ value', act: function () { copyText(fmt(vSec, 1) + ' V'); } },
      { sep: true },
      { label: (showGrid ? '✓ ' : '') + 'Toggle Grid', act: function () { chkGrid.checked = !showGrid; chkGrid.dispatchEvent(new Event('change')); } },
      { label: '↻ Reset', act: resetAll }
    ];
    ctxMenu.innerHTML = items.map(function (it) {
      return it.sep ? '<div class="ctx-sep"></div>' : '<div class="ctx-item">' + it.label + '</div>';
    }).join('');
    var nodes = ctxMenu.querySelectorAll('.ctx-item'); var k = 0;
    items.forEach(function (it) {
      if (it.sep) return;
      (function (act) { nodes[k++].addEventListener('click', function () { act(); hideCtxMenu(); }); })(it.act);
    });
    ctxMenu.classList.add('active');
    ctxMenu.setAttribute('aria-hidden', 'false');
    var mw = ctxMenu.offsetWidth || 180, mh = ctxMenu.offsetHeight || 200;
    ctxMenu.style.left = Math.min(x, window.innerWidth - mw - 8) + 'px';
    ctxMenu.style.top = Math.min(y, window.innerHeight - mh - 8) + 'px';
  }
  function hideCtxMenu() {
    if (!ctxMenu) return;
    ctxMenu.classList.remove('active');
    ctxMenu.setAttribute('aria-hidden', 'true');
  }
  function copyText(t) {
    if (navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {});
  }
  cvs.addEventListener('contextmenu', function (e) {
    if (mode !== 'simulate') return;
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY);
  });
  document.addEventListener('click', function (e) {
    if (ctxMenu && !ctxMenu.contains(e.target)) hideCtxMenu();
  });
  window.addEventListener('blur', hideCtxMenu);

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.cat === exploreCat);
    });
    exploreItem = null;
    itemInfo.style.display = 'none';
    renderConceptGrid();
  });

  function renderConceptGrid() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    var html = '';
    filtered.forEach(function (c) {
      var cls = exploreItem && exploreItem.id === c.id ? 'is-btn active' : 'is-btn';
      html += '<button class="' + cls + '" data-id="' + c.id + '">';
      html += '<span class="is-btn-name">' + c.name + '</span>';
      html += '<span class="is-btn-sym">' + c.symbol + '</span>';
      html += '</button>';
    });
    conceptGrid.innerHTML = html;
  }

  conceptGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.is-btn');
    if (!btn) return;
    var id = btn.dataset.id;
    exploreItem = CONCEPTS.find(function (c) { return c.id === id; }) || null;
    renderConceptGrid();
    renderConceptInfo();
  });

  function renderConceptInfo() {
    if (!exploreItem) { itemInfo.style.display = 'none'; return; }
    itemInfo.style.display = '';
    var c = exploreItem;
    var catName = c.cat === 'basics' ? 'Transformer Basics' : c.cat === 'losses' ? 'Losses & Efficiency' : 'Applications';

    var html = '<div class="ii-top">';
    html += '<span class="ii-name">' + c.name + '</span>';
    html += '<span class="ii-cat-badge">' + catName + '</span>';
    html += '</div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box">';
    html += '<span class="fb-formula">' + c.formula + '</span>';
    if (c.unit) html += '<span class="fb-unit">' + c.unit + '</span>';
    html += '</div>';

    /* Mini diagram canvas */
    html += '<div class="ii-diagram-wrap"><canvas id="concept-cvs" width="420" height="180" style="width:100%;max-width:420px;height:auto;border-radius:8px;background:#0d1117;"></canvas></div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step"><strong>' + s + '</strong></p>';
      });
      html += '</div>';
    }

    itemInfo.innerHTML = html;
    drawConceptDiagram(c);
  }

  /* ================================================================
     EXPLORE — CONCEPT MINI-DIAGRAMS
     ================================================================ */

  function drawConceptDiagram(c) {
    var el = document.getElementById('concept-cvs');
    if (!el) return;
    var dc = el.getContext('2d');
    var dW = 420, dH = 180;

    dc.fillStyle = '#0d1117';
    dc.fillRect(0, 0, dW, dH);

    switch (c.diagram) {
      case 'emInduction': diagramInduction(dc, dW, dH); break;
      case 'turnsRatio':  diagramTurns(dc, dW, dH); break;
      case 'stepTypes':   diagramSteps(dc, dW, dH); break;
      case 'copperLoss':  diagramCopper(dc, dW, dH); break;
      case 'ironLoss':    diagramIron(dc, dW, dH); break;
      case 'efficiency':  diagramEff(dc, dW, dH); break;
      case 'powerTransmission': diagramPower(dc, dW, dH); break;
      case 'impedanceMatching': diagramImpedance(dc, dW, dH); break;
    }
  }

  function diagramInduction(dc, w, h) {
    dc.font = 'bold 12px "Segoe UI", sans-serif';
    dc.fillStyle = '#ff6d00';
    dc.textAlign = 'center';
    dc.fillText('Changing Magnetic Flux \u2192 Induced EMF', w / 2, 20);

    /* Coil */
    dc.strokeStyle = '#ff6d00';
    dc.lineWidth = 2.5;
    for (var i = 0; i < 6; i++) {
      dc.beginPath();
      dc.ellipse(w / 2 - 40 + i * 16, h / 2 + 5, 8, 22, 0, -Math.PI * 0.5, Math.PI * 0.5);
      dc.stroke();
    }

    /* Flux arrows */
    dc.fillStyle = '#ffa000';
    for (var a = 0; a < 3; a++) {
      var ax = w / 2 - 50 + a * 35;
      dc.beginPath();
      dc.moveTo(ax + 10, h / 2 + 5);
      dc.lineTo(ax, h / 2); dc.lineTo(ax, h / 2 + 10);
      dc.closePath(); dc.fill();
    }

    dc.font = 'bold 14px "Courier New", monospace';
    dc.fillStyle = '#3ddc84';
    dc.fillText('\u03B5 = -N \u00D7 d\u03A6/dt', w / 2, h - 15);
  }

  function diagramTurns(dc, w, h) {
    dc.font = 'bold 11px "Segoe UI", sans-serif';

    /* Primary (fewer loops) */
    dc.strokeStyle = '#ff6d00'; dc.lineWidth = 2.5;
    for (var i = 0; i < 4; i++) {
      dc.beginPath();
      dc.ellipse(w * 0.25, 42 + i * 25, 14, 10, 0, 0, Math.PI * 2);
      dc.stroke();
    }
    dc.fillStyle = '#ff6d00'; dc.textAlign = 'center';
    dc.fillText('N\u2081 = 100', w * 0.25, h - 22);

    /* Secondary (more loops) */
    dc.strokeStyle = '#42a5f5';
    for (var j = 0; j < 8; j++) {
      dc.beginPath();
      dc.ellipse(w * 0.75, 35 + j * 15, 14, 6, 0, 0, Math.PI * 2);
      dc.stroke();
    }
    dc.fillStyle = '#42a5f5';
    dc.fillText('N\u2082 = 200', w * 0.75, h - 22);

    /* Arrow */
    dc.strokeStyle = '#dde3f0'; dc.lineWidth = 1;
    dc.beginPath(); dc.moveTo(w * 0.4, h / 2); dc.lineTo(w * 0.58, h / 2); dc.stroke();
    dc.fillStyle = '#dde3f0';
    dc.beginPath();
    dc.moveTo(w * 0.58, h / 2 - 4); dc.lineTo(w * 0.6, h / 2); dc.lineTo(w * 0.58, h / 2 + 4);
    dc.closePath(); dc.fill();

    dc.font = 'bold 14px "Courier New", monospace';
    dc.fillStyle = '#f5c842';
    dc.fillText('a = N\u2082/N\u2081 = 2', w / 2, h / 2 - 14);
  }

  function diagramSteps(dc, w, h) {
    /* Step-up side */
    dc.font = 'bold 11px "Segoe UI", sans-serif';
    dc.fillStyle = '#3ddc84'; dc.textAlign = 'center';
    dc.fillText('STEP-UP', w * 0.25, 18);

    dc.fillStyle = '#ff6d00'; dc.fillRect(w * 0.12, 38, 28, 22);
    dc.fillStyle = '#3ddc84'; dc.fillRect(w * 0.28, 30, 28, 38);

    dc.font = '9px "Segoe UI", sans-serif'; dc.fillStyle = '#fff';
    dc.fillText('V\u2081', w * 0.12 + 14, 52);
    dc.fillText('V\u2082', w * 0.28 + 14, 52);

    dc.font = '10px "Courier New", monospace'; dc.fillStyle = '#dde3f0';
    dc.fillText('N\u2082 > N\u2081', w * 0.25, 85);
    dc.fillText('V\u2082 > V\u2081', w * 0.25, 100);
    dc.fillText('I\u2082 < I\u2081', w * 0.25, 115);

    /* Step-down side */
    dc.font = 'bold 11px "Segoe UI", sans-serif';
    dc.fillStyle = '#42a5f5'; dc.textAlign = 'center';
    dc.fillText('STEP-DOWN', w * 0.75, 18);

    dc.fillStyle = '#ff6d00'; dc.fillRect(w * 0.62, 30, 28, 38);
    dc.fillStyle = '#42a5f5'; dc.fillRect(w * 0.78, 38, 28, 22);

    dc.fillStyle = '#fff'; dc.font = '9px "Segoe UI", sans-serif';
    dc.fillText('V\u2081', w * 0.62 + 14, 52);
    dc.fillText('V\u2082', w * 0.78 + 14, 52);

    dc.font = '10px "Courier New", monospace'; dc.fillStyle = '#dde3f0';
    dc.fillText('N\u2082 < N\u2081', w * 0.75, 85);
    dc.fillText('V\u2082 < V\u2081', w * 0.75, 100);
    dc.fillText('I\u2082 > I\u2081', w * 0.75, 115);

    /* Divider */
    dc.strokeStyle = '#2a3050'; dc.lineWidth = 1;
    dc.setLineDash([4, 4]);
    dc.beginPath(); dc.moveTo(w / 2, 12); dc.lineTo(w / 2, h - 10); dc.stroke();
    dc.setLineDash([]);

    dc.font = 'bold 12px "Courier New", monospace';
    dc.fillStyle = '#f5c842';
    dc.fillText('P\u2081 = P\u2082 (ideal)', w / 2, h - 15);
  }

  function diagramCopper(dc, w, h) {
    dc.font = 'bold 12px "Segoe UI", sans-serif';
    dc.fillStyle = '#ff7043'; dc.textAlign = 'center';
    dc.fillText('Copper Losses (I\u00B2R in windings)', w / 2, 18);

    /* Primary winding as zigzag */
    dc.strokeStyle = '#ff6d00'; dc.lineWidth = 2;
    dc.beginPath(); dc.moveTo(40, 60);
    for (var i = 0; i < 8; i++) dc.lineTo(60 + i * 22, 60 + ((i % 2 === 0) ? -10 : 10));
    dc.lineTo(240, 60); dc.stroke();

    dc.font = '11px "Courier New", monospace';
    dc.fillStyle = '#ff6d00'; dc.fillText('R_p: P = I\u2081\u00B2 \u00D7 R_p', 140, 88);

    /* Secondary */
    dc.strokeStyle = '#42a5f5';
    dc.beginPath(); dc.moveTo(40, 120);
    for (var j = 0; j < 8; j++) dc.lineTo(60 + j * 22, 120 + ((j % 2 === 0) ? -10 : 10));
    dc.lineTo(240, 120); dc.stroke();

    dc.fillStyle = '#42a5f5'; dc.fillText('R_s: P = I\u2082\u00B2 \u00D7 R_s', 140, 148);

    dc.fillStyle = '#ff5555'; dc.font = '16px serif';
    dc.textAlign = 'right';
    dc.fillText('\u2668 Heat', w - 30, 70);
    dc.fillText('\u2668 Heat', w - 30, 130);
  }

  function diagramIron(dc, w, h) {
    dc.font = 'bold 12px "Segoe UI", sans-serif';
    dc.fillStyle = '#7e57c2'; dc.textAlign = 'center';
    dc.fillText('Iron / Core Losses', w / 2, 18);

    /* Core shape */
    dc.fillStyle = '#3a4560';
    dc.fillRect(80, 40, 260, 90);
    dc.fillStyle = '#0d1117';
    dc.fillRect(105, 58, 90, 55);
    dc.fillRect(220, 58, 90, 55);

    /* Lamination lines */
    dc.strokeStyle = 'rgba(90,104,136,0.3)'; dc.lineWidth = 0.5;
    for (var y = 43; y < 127; y += 4) {
      dc.beginPath(); dc.moveTo(82, y); dc.lineTo(338, y); dc.stroke();
    }

    dc.font = '10px "Courier New", monospace'; dc.fillStyle = '#dde3f0';
    dc.textAlign = 'left';
    dc.fillText('Hysteresis: B-H loop energy loss', 20, h - 32);
    dc.fillText('Eddy currents: circulating I in core', 20, h - 16);

    dc.font = 'bold 10px "Segoe UI", sans-serif';
    dc.fillStyle = '#f5c842'; dc.textAlign = 'center';
    dc.fillText('Laminated core reduces eddy currents', w / 2, h - 2);
  }

  function diagramEff(dc, w, h) {
    dc.font = 'bold 12px "Segoe UI", sans-serif';
    dc.fillStyle = '#3ddc84'; dc.textAlign = 'center';
    dc.fillText('Transformer Power Flow', w / 2, 16);

    var y = 50;

    /* Input bar */
    dc.fillStyle = '#ff6d00'; dc.fillRect(15, y, 90, 45);
    dc.fillStyle = '#fff'; dc.font = 'bold 10px "Segoe UI", sans-serif';
    dc.textAlign = 'center';
    dc.fillText('P_in', 60, y + 18); dc.fillText('100%', 60, y + 34);

    /* Arrow */
    dc.fillStyle = '#dde3f0';
    dc.beginPath(); dc.moveTo(110, y + 22); dc.lineTo(135, y + 12); dc.lineTo(135, y + 32); dc.closePath(); dc.fill();

    /* Transformer box */
    dc.strokeStyle = '#6b7a99'; dc.lineWidth = 2;
    dc.strokeRect(140, y - 8, 110, 60);
    dc.fillStyle = '#6b7a99'; dc.font = '10px "Segoe UI", sans-serif';
    dc.fillText('Transformer', 195, y + 8);

    /* Loss arrow down */
    dc.fillStyle = '#ff5555';
    dc.beginPath(); dc.moveTo(195, y + 52); dc.lineTo(185, y + 40); dc.lineTo(205, y + 40); dc.closePath(); dc.fill();
    dc.font = '10px "Courier New", monospace';
    dc.fillText('Losses (Cu+Fe)', 195, y + 68);

    /* Arrow to output */
    dc.fillStyle = '#dde3f0';
    dc.beginPath(); dc.moveTo(255, y + 22); dc.lineTo(280, y + 12); dc.lineTo(280, y + 32); dc.closePath(); dc.fill();

    /* Output bar */
    dc.fillStyle = '#3ddc84'; dc.fillRect(285, y, 90, 45);
    dc.fillStyle = '#fff'; dc.font = 'bold 10px "Segoe UI", sans-serif';
    dc.fillText('P_out', 330, y + 18); dc.fillText('95-99%', 330, y + 34);

    dc.font = 'bold 13px "Courier New", monospace';
    dc.fillStyle = '#f5c842'; dc.textAlign = 'center';
    dc.fillText('\u03B7 = P_out / P_in \u00D7 100%', w / 2, h - 8);
  }

  function diagramPower(dc, w, h) {
    dc.font = 'bold 11px "Segoe UI", sans-serif';
    dc.fillStyle = '#dde3f0'; dc.textAlign = 'center';
    dc.fillText('Power Transmission System', w / 2, 14);

    var y = 55;
    /* Generator */
    dc.fillStyle = '#ff6d00'; dc.fillRect(8, y, 65, 40);
    dc.fillStyle = '#fff'; dc.font = '8px "Segoe UI", sans-serif';
    dc.textAlign = 'center';
    dc.fillText('Generator', 40, y + 15); dc.fillText('11 kV', 40, y + 30);

    /* Step-up */
    dc.fillStyle = '#3ddc84'; dc.fillRect(88, y - 5, 65, 50);
    dc.fillStyle = '#fff';
    dc.fillText('Step-Up', 120, y + 12); dc.fillText('400 kV', 120, y + 30);

    /* Lines */
    dc.strokeStyle = '#f5c842'; dc.lineWidth = 2;
    dc.beginPath(); dc.moveTo(158, y + 20); dc.lineTo(238, y + 20); dc.stroke();
    dc.fillStyle = '#f5c842'; dc.font = '8px "Segoe UI", sans-serif';
    dc.fillText('High V, Low I', 198, y + 10);

    /* Step-down */
    dc.fillStyle = '#42a5f5'; dc.fillRect(243, y - 5, 65, 50);
    dc.fillStyle = '#fff';
    dc.fillText('Step-Down', 275, y + 12); dc.fillText('240 V', 275, y + 30);

    /* Consumer */
    dc.fillStyle = '#7e57c2'; dc.fillRect(323, y, 65, 40);
    dc.fillStyle = '#fff';
    dc.fillText('Consumer', 355, y + 15); dc.fillText('240 V', 355, y + 30);

    dc.font = 'bold 11px "Courier New", monospace';
    dc.fillStyle = '#f5c842'; dc.textAlign = 'center';
    dc.fillText('Higher V \u2192 Lower I \u2192 Less I\u00B2R loss', w / 2, h - 12);
  }

  function diagramImpedance(dc, w, h) {
    dc.font = 'bold 12px "Segoe UI", sans-serif';
    dc.fillStyle = '#dde3f0'; dc.textAlign = 'center';
    dc.fillText('Impedance Matching', w / 2, 16);

    var y = 65;
    /* Source circle */
    dc.strokeStyle = '#ff6d00'; dc.lineWidth = 2;
    dc.beginPath(); dc.arc(55, y + 20, 18, 0, Math.PI * 2); dc.stroke();
    dc.fillStyle = '#ff6d00'; dc.font = '10px "Segoe UI", sans-serif';
    dc.fillText('Source', 55, y + 50); dc.fillText('Z_s', 55, y + 64);

    /* Transformer box */
    dc.strokeStyle = '#f5c842'; dc.lineWidth = 2;
    dc.strokeRect(130, y - 5, 120, 50);
    dc.fillStyle = '#f5c842'; dc.font = '10px "Segoe UI", sans-serif';
    dc.fillText('Transformer', 190, y + 14);
    dc.fillText('a = N\u2082/N\u2081', 190, y + 32);

    /* Wires */
    dc.strokeStyle = '#6b7a99'; dc.lineWidth = 1.5;
    dc.beginPath(); dc.moveTo(73, y + 20); dc.lineTo(130, y + 20); dc.stroke();
    dc.beginPath(); dc.moveTo(250, y + 20); dc.lineTo(310, y + 20); dc.stroke();

    /* Load zigzag */
    dc.strokeStyle = '#42a5f5'; dc.lineWidth = 2;
    var lx = 335;
    dc.beginPath(); dc.moveTo(lx, y);
    for (var i = 0; i < 5; i++) dc.lineTo(lx + ((i % 2 === 0) ? 10 : -10), y + 6 + i * 8);
    dc.lineTo(lx, y + 40); dc.stroke();

    dc.fillStyle = '#42a5f5'; dc.font = '10px "Segoe UI", sans-serif';
    dc.fillText('Z_L', lx, y + 56);

    dc.font = 'bold 13px "Courier New", monospace';
    dc.fillStyle = '#3ddc84'; dc.textAlign = 'center';
    dc.fillText("Z' = Z_L / a\u00B2", w / 2, h - 10);
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function newPractice() {
    var gen = pick(PROBLEM_GEN);
    pracCur = gen();
    pracDone = false;

    document.getElementById('pp-prompt').textContent = pracCur.prompt;
    document.getElementById('pp-unit').textContent = pracCur.unit;
    document.getElementById('pp-input').value = '';
    document.getElementById('pp-input').disabled = false;
    document.getElementById('pp-feedback').textContent = '';
    document.getElementById('pp-feedback').className = 'feedback';
    document.getElementById('pp-check').style.display = '';
    document.getElementById('pp-next').style.display = 'none';
    document.getElementById('pp-solution').style.display = 'none';
    document.getElementById('pp-input').focus();
  }

  function checkPractice() {
    if (pracDone || !pracCur) return;
    var input = document.getElementById('pp-input');
    var val = parseFloat(input.value);
    if (isNaN(val)) { input.focus(); return; }

    pracDone = true;
    pracTotal++;
    var tol = pracCur.tol || 0.5;
    var correct = Math.abs(val - pracCur.answer) <= tol;
    if (correct) pracScore++;

    var fb = document.getElementById('pp-feedback');
    if (correct) {
      fb.textContent = 'Correct!';
      fb.className = 'feedback ok';
    } else {
      fb.textContent = 'Incorrect. Answer: ' + pracCur.answer + ' ' + pracCur.unit;
      fb.className = 'feedback err';
    }

    input.disabled = true;
    document.getElementById('pp-check').style.display = 'none';
    document.getElementById('pp-next').style.display = '';
    document.getElementById('pbar-score-val').textContent = pracScore + ' / ' + pracTotal;

    /* Show solution */
    var sol = document.getElementById('pp-solution');
    sol.style.display = '';
    var solHtml = '<h4>Solution</h4>';
    pracCur.steps.forEach(function (s) {
      solHtml += '<p class="sol-step"><strong>' + s + '</strong></p>';
    });
    sol.innerHTML = solHtml;
  }

  document.getElementById('pp-check').addEventListener('click', checkPractice);
  document.getElementById('pp-next').addEventListener('click', newPractice);
  document.getElementById('pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!pracDone) checkPractice();
      else newPractice();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  function startQuiz() {
    var pool = genQuizPool();
    quizSet = pool.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizHistory = [];
    quizDone = false;
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    showQuizQ();
  }

  function showQuizQ() {
    var q = quizSet[quizIdx];
    document.getElementById('qbar-num').textContent = quizIdx + 1;
    quizDone = false;

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

    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizDone) return;
          quizMCQ(parseInt(btn.dataset.idx));
        });
      });
    } else {
      var sub = document.getElementById('qi-submit');
      var inp = document.getElementById('qi-input');
      sub.addEventListener('click', quizNumeric);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') quizNumeric(); });
      inp.focus();
    }

    document.getElementById('quiz-next').addEventListener('click', nextQuizQ);
  }

  function quizMCQ(chosen) {
    quizDone = true;
    var q = quizSet[quizIdx];
    var correct = chosen === q.correct;
    if (correct) quizScore++;
    quizHistory.push({ prompt: q.prompt, given: q.options[chosen], correct: q.options[q.correct], ok: correct });

    quizPanel.querySelectorAll('.answer-btn').forEach(function (b) {
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

  function quizNumeric() {
    if (quizDone) return;
    var q = quizSet[quizIdx];
    var inp = document.getElementById('qi-input');
    var val = parseFloat(inp.value);
    if (isNaN(val)) { inp.focus(); return; }

    quizDone = true;
    var tol = q.tol || 0.5;
    var correct = Math.abs(val - q.answer) <= tol;
    if (correct) quizScore++;
    quizHistory.push({ prompt: q.prompt, given: val + ' ' + q.unit, correct: q.answer + ' ' + q.unit, ok: correct });

    var fb = document.getElementById('quiz-fb');
    fb.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.answer + ' ' + q.unit;
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    inp.disabled = true;
    document.getElementById('qi-submit').disabled = true;
    document.getElementById('quiz-next').style.display = '';
  }

  function nextQuizQ() {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) showQuizResult();
    else showQuizQ();
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
     CANVAS POINTER INTERACTION
     ================================================================ */

  cvs.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    /* Reserved for future interactive features */
  });

  /* ================================================================
     RESIZE HANDLER
     ================================================================ */

  function resizeCanvas() {
    var parent = cvs.parentElement;
    if (!parent) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pw = parent.clientWidth - 16;
    var cssW = Math.min(pw, W);
    cvs.style.width = cssW + 'px';
    cvs.style.height = cssW * (H / W) + 'px';
    /* Hi-DPI backing store — draw in logical W×H, scale up for the device.
       W/H were captured from the HTML attrs (900×520) before this runs, so they
       stay logical even after we enlarge the bitmap. */
    cvs.width = Math.round(W * dpr);
    cvs.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resizeCanvas);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { resizeCanvas(); }).observe(cvs.parentElement || cvs);
  }
  resizeCanvas();

  /* ================================================================
     INIT
     ================================================================ */

  /* Sync toggle booleans from their checkbox defaults. */
  showEquation = chkEq ? chkEq.checked : true;
  showGrid = chkGrid ? chkGrid.checked : false;

  calcPhysics();
  updateReadouts();
  updatePresetBtns();
  updateUndoBtns();
  lastSnap = snap();
  startAnim();

})();
