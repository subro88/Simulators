(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randF(a, b) { return a + Math.random() * (b - a); }
  function shuffleArr(a) { var arr = a.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = randInt(0, i); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function round2(v) { return Math.round(v * 100) / 100; }
  function round3(v) { return Math.round(v * 1000) / 1000; }
  function round1(v) { return Math.round(v * 10) / 10; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmtR(v) { return v >= 1000 ? round1(v / 1000) + ' k\u03A9' : round1(v) + ' \u03A9'; }

  /* ================================================================
     DATA -- CONCEPTS (6, across 3 categories)
     ================================================================ */
  var CONCEPTS = [
    /* -- basics --------------------------------------------------- */
    {
      id: 'bridge-circuit', name: 'Bridge Circuit', symbol: 'R1-R2-R3-Rx',
      formula: 'Diamond: R1, R2, R3, Rx with Vs and Galvanometer', unit: '\u2014',
      cat: 'basics',
      desc: 'The Wheatstone bridge consists of four resistors arranged in a diamond (rhombus) configuration. A voltage source is connected across one pair of opposite nodes (top A and bottom D), and a sensitive galvanometer is connected across the other pair (left B and right C). The circuit forms two voltage dividers in parallel: R1\u2013R3 on the left arm and R2\u2013Rx on the right arm. The galvanometer detects the potential difference between the midpoints of these dividers.',
      diagram: 'bridgeDiagram',
      example: { problem: 'Draw the Wheatstone bridge with R1=1000\u03A9, R2=2000\u03A9, R3=1500\u03A9. What Rx balances it?', steps: ['Balance condition: R1 \u00D7 Rx = R2 \u00D7 R3', '1000 \u00D7 Rx = 2000 \u00D7 1500', 'Rx = 3,000,000 / 1000', 'Rx = 3000 \u03A9'], answer: 3000, unit: '\u03A9' }
    },
    {
      id: 'balance-condition', name: 'Balance Condition', symbol: 'R1\u00D7Rx = R2\u00D7R3',
      formula: 'R1 \u00D7 Rx = R2 \u00D7 R3  or  R1/R2 = R3/Rx', unit: '\u2014',
      cat: 'basics',
      desc: 'The bridge is balanced when the ratio of the two resistors in one arm equals the ratio in the other arm: R1/R2 = R3/Rx. Equivalently, the cross products are equal: R1\u00D7Rx = R2\u00D7R3. At balance, both midpoints are at the same potential, so no current flows through the galvanometer. This null condition allows precise measurement of the unknown Rx = R2\u00D7R3/R1, independent of the supply voltage or galvanometer sensitivity.',
      diagram: 'balanceDiagram',
      example: { problem: 'R1=500\u03A9, R2=1000\u03A9, R3=750\u03A9. Find Rx for balance.', steps: ['R1 \u00D7 Rx = R2 \u00D7 R3', '500 \u00D7 Rx = 1000 \u00D7 750', 'Rx = 750,000 / 500', 'Rx = 1500 \u03A9'], answer: 1500, unit: '\u03A9' }
    },
    {
      id: 'null-detection', name: 'Null Detection', symbol: 'Ig = 0',
      formula: 'At balance: V_B = V_C, I_g = 0', unit: 'A',
      cat: 'basics',
      desc: 'The null-detection method is the key advantage of the Wheatstone bridge. The galvanometer is used only to detect zero current, not to measure a specific value. This means accuracy does not depend on the galvanometer calibration, internal resistance, or linearity. Even a cheap galvanometer gives high accuracy because it only needs to distinguish zero from non-zero. The null condition also means no power is dissipated in the galvanometer branch at balance.',
      diagram: 'nullDiagram',
      example: { problem: 'Why is null detection more accurate than direct measurement?', steps: ['Direct: accuracy depends on meter calibration', 'Null: meter only detects zero (no calibration needed)', 'Result: accuracy depends only on known resistors R1, R2, R3', 'Typical accuracy: 0.01% or better'], answer: 0.01, unit: '%' }
    },
    /* -- analysis ------------------------------------------------- */
    {
      id: 'thevenin-equiv', name: 'Thevenin Equivalent', symbol: 'Vth, Rth',
      formula: 'Vth = Vs(R3/(R1+R3) - Rx/(R2+Rx)), Rth = R1||R3 + R2||Rx', unit: 'V, \u03A9',
      cat: 'analysis',
      desc: 'The Thevenin equivalent circuit seen by the galvanometer simplifies analysis of unbalanced bridges. The Thevenin voltage is Vth = Vs \u00D7 (R3/(R1+R3) \u2212 Rx/(R2+Rx)), which equals zero at balance. The Thevenin resistance is Rth = (R1\u00B7R3)/(R1+R3) + (R2\u00B7Rx)/(R2+Rx), the sum of the two parallel combinations. The galvanometer current is Ig = Vth / (Rth + Rg).',
      diagram: 'theveninDiagram',
      example: { problem: 'R1=R2=R3=1000\u03A9, Rx=1100\u03A9, Vs=12V, Rg=100\u03A9. Find Ig.', steps: ['Vth = 12 \u00D7 (1000/2000 \u2212 1100/2100)', 'Vth = 12 \u00D7 (0.5 \u2212 0.5238) = \u22120.286 V', 'Rth = 500 + 523.8 = 1023.8 \u03A9', 'Ig = \u22120.286 / (1023.8 + 100) = \u22120.255 mA'], answer: -0.255, unit: 'mA' }
    },
    {
      id: 'sensitivity', name: 'Bridge Sensitivity', symbol: 'S = dIg/dRx',
      formula: 'S = \u0394Ig / \u0394Rx (mA/\u03A9)', unit: 'mA/\u03A9',
      cat: 'analysis',
      desc: 'Sensitivity measures how much the galvanometer current changes per unit change in the unknown resistance. Maximum sensitivity occurs when all four arms have equal resistance (R1=R2=R3=Rx). Sensitivity also increases with higher supply voltage and lower galvanometer resistance. For strain gauge bridges, high sensitivity is critical because resistance changes are very small (\u0394R/R ~ 0.001 to 0.01).',
      diagram: 'sensitivityDiagram',
      example: { problem: 'All arms 350\u03A9, Vs=5V, Rg=50\u03A9. Find sensitivity at balance.', steps: ['At balance with equal arms:', 'S = Vs / (4R(R + Rg))', 'S = 5 / (4 \u00D7 350 \u00D7 400)', 'S = 8.93e-6 A/\u03A9 = 0.00893 mA/\u03A9'], answer: 0.00893, unit: 'mA/\u03A9' }
    },
    /* -- applications --------------------------------------------- */
    {
      id: 'strain-gauge', name: 'Strain Gauge Bridge', symbol: '\u0394R/R = GF\u00B7\u03B5',
      formula: 'Quarter bridge: Vout = Vs \u00D7 GF \u00D7 \u03B5 / 4', unit: 'V',
      cat: 'applications',
      desc: 'Strain gauges are the most common application of Wheatstone bridges. A strain gauge is a resistor whose resistance changes with mechanical strain: \u0394R/R = GF \u00D7 \u03B5, where GF is the gauge factor (~2 for metal foil) and \u03B5 is strain. In a quarter-bridge, one arm is a strain gauge (Rx = R + \u0394R) and the other three are fixed. Half and full bridge configurations use 2 or 4 active gauges for higher sensitivity and temperature compensation.',
      diagram: 'strainDiagram',
      example: { problem: 'Strain gauge: R=350\u03A9, GF=2, \u03B5=500\u03BC\u03B5, Vs=5V. Find Vout (quarter bridge).', steps: ['\u0394R = R \u00D7 GF \u00D7 \u03B5 = 350 \u00D7 2 \u00D7 0.0005 = 0.35\u03A9', 'Rx = 350 + 0.35 = 350.35 \u03A9', 'Vout \u2248 Vs \u00D7 GF \u00D7 \u03B5 / 4', 'Vout = 5 \u00D7 2 \u00D7 0.0005 / 4 = 1.25 mV'], answer: 1.25, unit: 'mV' }
    }
  ];

  /* ================================================================
     DATA -- PROBLEM GENERATORS (8)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0 - Find Rx given R1, R2, R3 (balanced) */
    function () {
      var r1 = randInt(1, 20) * 100;
      var r2 = randInt(1, 20) * 100;
      var r3 = randInt(1, 20) * 100;
      var rx = round2(r2 * r3 / r1);
      return {
        prompt: 'A Wheatstone bridge is balanced with R1 = ' + r1 + ' \u03A9, R2 = ' + r2 + ' \u03A9, R3 = ' + r3 + ' \u03A9. Find Rx.',
        answer: rx, unit: '\u03A9',
        steps: ['Balance: R1 \u00D7 Rx = R2 \u00D7 R3', 'Rx = R2 \u00D7 R3 / R1', 'Rx = ' + r2 + ' \u00D7 ' + r3 + ' / ' + r1, 'Rx = ' + rx + ' \u03A9']
      };
    },
    /* 1 - Find bridge voltage */
    function () {
      var r1 = randInt(5, 20) * 100;
      var r2 = randInt(5, 20) * 100;
      var r3 = randInt(5, 20) * 100;
      var rx = randInt(5, 20) * 100;
      var vs = randInt(2, 12) * 2;
      var vb = round3(vs * (r3 / (r1 + r3) - rx / (r2 + rx)));
      return {
        prompt: 'R1 = ' + r1 + ' \u03A9, R2 = ' + r2 + ' \u03A9, R3 = ' + r3 + ' \u03A9, Rx = ' + rx + ' \u03A9, Vs = ' + vs + ' V. Find bridge voltage Vb.',
        answer: round2(vb), unit: 'V',
        steps: ['Vb = Vs \u00D7 (R3/(R1+R3) \u2212 Rx/(R2+Rx))',
          'Vb = ' + vs + ' \u00D7 (' + r3 + '/' + (r1 + r3) + ' \u2212 ' + rx + '/' + (r2 + rx) + ')',
          'Vb = ' + vs + ' \u00D7 (' + round3(r3 / (r1 + r3)) + ' \u2212 ' + round3(rx / (r2 + rx)) + ')',
          'Vb = ' + round2(vb) + ' V']
      };
    },
    /* 2 - Find galvanometer current */
    function () {
      var vb = round2(randF(-2, 2));
      if (Math.abs(vb) < 0.05) vb = 0.5;
      var rg = randInt(1, 5) * 50;
      var ig = round3(vb / rg * 1000);
      return {
        prompt: 'The bridge voltage is ' + vb + ' V and the galvanometer resistance is ' + rg + ' \u03A9. Find the galvanometer current in mA (ignore Thevenin resistance).',
        answer: round2(ig), unit: 'mA',
        steps: ['Ig = Vbridge / Rg', 'Ig = ' + vb + ' / ' + rg, 'Ig = ' + round3(vb / rg) + ' A', 'Ig = ' + round2(ig) + ' mA']
      };
    },
    /* 3 - Is the bridge balanced? */
    function () {
      var r1 = randInt(5, 20) * 100;
      var r2 = randInt(5, 20) * 100;
      var r3 = randInt(5, 20) * 100;
      var balanced = Math.random() > 0.5;
      var rx;
      if (balanced) {
        rx = round2(r2 * r3 / r1);
      } else {
        rx = round2(r2 * r3 / r1 * (1 + randF(0.05, 0.3)));
      }
      var product1 = r1 * rx;
      var product2 = r2 * r3;
      var ratio = Math.abs(product1 - product2) / Math.max(product1, product2) * 100;
      var ans = ratio < 0.5 ? 1 : 0;
      return {
        prompt: 'R1=' + r1 + '\u03A9, R2=' + r2 + '\u03A9, R3=' + r3 + '\u03A9, Rx=' + rx + '\u03A9. Balanced? (1=Yes, 0=No, 0.5% tolerance)',
        answer: ans, unit: '',
        steps: ['R1 \u00D7 Rx = ' + round2(product1), 'R2 \u00D7 R3 = ' + round2(product2), 'Difference: ' + round2(ratio) + '%', (ans ? 'Within 0.5% \u2192 Balanced' : 'Exceeds 0.5% \u2192 Unbalanced')]
      };
    },
    /* 4 - Find R3 for balance */
    function () {
      var r1 = randInt(1, 20) * 100;
      var r2 = randInt(1, 20) * 100;
      var rx = randInt(1, 20) * 100;
      var r3 = round2(r1 * rx / r2);
      return {
        prompt: 'Find R3 for balance: R1 = ' + r1 + ' \u03A9, R2 = ' + r2 + ' \u03A9, Rx = ' + rx + ' \u03A9.',
        answer: r3, unit: '\u03A9',
        steps: ['Balance: R1 \u00D7 Rx = R2 \u00D7 R3', 'R3 = R1 \u00D7 Rx / R2', 'R3 = ' + r1 + ' \u00D7 ' + rx + ' / ' + r2, 'R3 = ' + r3 + ' \u03A9']
      };
    },
    /* 5 - Find supply voltage */
    function () {
      var r1 = randInt(5, 15) * 100;
      var r2 = randInt(5, 15) * 100;
      var r3 = randInt(5, 15) * 100;
      var rx = randInt(5, 15) * 100;
      var denom = r3 / (r1 + r3) - rx / (r2 + rx);
      if (Math.abs(denom) < 0.01) { r1 = 500; r2 = 1000; r3 = 700; rx = 1500; denom = r3 / (r1 + r3) - rx / (r2 + rx); }
      var vs = randInt(4, 20);
      var vbTarget = round3(vs * denom);
      return {
        prompt: 'R1=' + r1 + '\u03A9, R2=' + r2 + '\u03A9, R3=' + r3 + '\u03A9, Rx=' + rx + '\u03A9. Bridge voltage is ' + round2(vbTarget) + ' V. Find Vs.',
        answer: round2(vs), unit: 'V',
        steps: ['Vb = Vs \u00D7 (R3/(R1+R3) \u2212 Rx/(R2+Rx))',
          'Vs = Vb / (R3/(R1+R3) \u2212 Rx/(R2+Rx))',
          'Vs = ' + round2(vbTarget) + ' / ' + round3(denom),
          'Vs = ' + round2(vs) + ' V']
      };
    },
    /* 6 - Find ratio R1/R2 */
    function () {
      var r3 = randInt(1, 20) * 100;
      var rx = randInt(1, 20) * 100;
      var ratio = round3(r3 / rx);
      return {
        prompt: 'Balanced bridge has R3 = ' + r3 + ' \u03A9, Rx = ' + rx + ' \u03A9. Find R1/R2.',
        answer: round2(ratio), unit: '',
        steps: ['Balance: R1/R2 = R3/Rx', 'R1/R2 = ' + r3 + ' / ' + rx, 'R1/R2 = ' + round2(ratio)]
      };
    },
    /* 7 - Find sensitivity */
    function () {
      var r = randInt(1, 10) * 100;
      var vs = randInt(2, 12);
      var rg = randInt(1, 5) * 50;
      var sens = round3(vs / (4 * r * (r + rg)) * 1000);
      return {
        prompt: 'All arms = ' + r + ' \u03A9, Vs = ' + vs + ' V, Rg = ' + rg + ' \u03A9. Find sensitivity (mA/\u03A9) at balance.',
        answer: round3(sens), unit: 'mA/\u03A9',
        steps: ['Equal-arm bridge at balance:', 'S = Vs / (4R(R + Rg))', 'S = ' + vs + ' / (4 \u00D7 ' + r + ' \u00D7 ' + (r + rg) + ')',
          'S = ' + vs + ' / ' + (4 * r * (r + rg)),
          'S = ' + round3(sens) + ' mA/\u03A9']
      };
    }
  ];

  /* ================================================================
     DATA -- QUIZ POOL GENERATOR (10 MCQ + 5 numeric)
     ================================================================ */
  function genQuizPool() {
    var mcqs = [
      { type: 'mcq', prompt: 'The Wheatstone bridge is balanced when:', options: ['R1 + Rx = R2 + R3', 'R1 \u00D7 Rx = R2 \u00D7 R3', 'R1 / Rx = R2 / R3', 'R1 \u2212 Rx = R2 \u2212 R3'], correct: 1 },
      { type: 'mcq', prompt: 'At balance, the current through the galvanometer is:', options: ['Maximum', 'Equal to supply current', 'Zero', 'Equal to V/R'], correct: 2 },
      { type: 'mcq', prompt: 'The main advantage of null detection in a Wheatstone bridge is:', options: ['It uses less power', 'Accuracy is independent of meter calibration', 'It works only with DC', 'It measures voltage directly'], correct: 1 },
      { type: 'mcq', prompt: 'Maximum sensitivity of a Wheatstone bridge occurs when:', options: ['R1 >> R2', 'All four arms are equal', 'Supply voltage is minimum', 'Galvanometer resistance is very high'], correct: 1 },
      { type: 'mcq', prompt: 'A typical gauge factor for metal foil strain gauges is approximately:', options: ['0.1', '2', '50', '1000'], correct: 1 },
      { type: 'mcq', prompt: 'The Thevenin resistance seen by the galvanometer is:', options: ['R1 + R2 + R3 + Rx', '(R1||R3) + (R2||Rx)', 'R1 \u00D7 R2 / (R3 + Rx)', 'R1 + Rx'], correct: 1 },
      { type: 'mcq', prompt: 'If R1/R2 > R3/Rx in a Wheatstone bridge, which node is at higher potential?', options: ['B (left junction)', 'C (right junction)', 'Both equal', 'Cannot determine'], correct: 1 },
      { type: 'mcq', prompt: 'A Kelvin double bridge is used to measure:', options: ['Very high resistances', 'Very low resistances (< 1\u03A9)', 'Capacitance', 'Inductance'], correct: 1 },
      { type: 'mcq', prompt: 'In a quarter-bridge strain gauge configuration, how many arms contain active gauges?', options: ['1', '2', '3', '4'], correct: 0 },
      { type: 'mcq', prompt: 'Increasing the supply voltage of a Wheatstone bridge:', options: ['Changes the balance condition', 'Increases sensitivity without affecting balance point', 'Decreases accuracy', 'Makes the bridge less stable'], correct: 1 }
    ];
    var r1n = randInt(5, 15) * 100;
    var r2n = randInt(5, 15) * 100;
    var r3n = randInt(5, 15) * 100;
    var rxCalc = round2(r2n * r3n / r1n);
    var nums = [
      { type: 'numeric', prompt: 'R1 = ' + r1n + ' \u03A9, R2 = ' + r2n + ' \u03A9, R3 = ' + r3n + ' \u03A9. Find Rx (\u03A9) for balance.', answer: rxCalc, unit: '\u03A9' },
      { type: 'numeric', prompt: 'All four arms are 1000 \u03A9. What is the bridge voltage (V) when Vs = 10V?', answer: 0, unit: 'V' },
      { type: 'numeric', prompt: 'Bridge voltage is 0.5 V, galvanometer resistance is 100 \u03A9. Find galvanometer current in mA (ignore Rth).', answer: 5, unit: 'mA' },
      { type: 'numeric', prompt: 'R1=200\u03A9, R2=400\u03A9, R3=300\u03A9. What Rx (\u03A9) balances the bridge?', answer: 600, unit: '\u03A9' },
      { type: 'numeric', prompt: 'Balanced bridge: R3=500\u03A9, Rx=1000\u03A9. What is R1/R2?', answer: 0.5, unit: '' }
    ];
    return mcqs.concat(nums);
  }

  /* ================================================================
     DOM REFS & CANVAS
     ================================================================ */
  var cvs = $('#sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 800, H = 500;
  cvs.style.maxWidth = W + 'px';

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';

  /* Sim values */
  var R1 = 1000, R2 = 1000, R3 = 1000, Rx = 1000, Vs = 12;
  var showGalv = true, autoBalance = false;
  var RG = 100; /* galvanometer internal resistance */

  /* Animation */
  var animT = 0;
  var animRunning = false;
  var lastFrameTime = 0;

  /* Explore */
  var selCat = 'basics', selConcept = 0;

  /* Practice */
  var pProblem = null, pAnswered = false, pScore = 0, pTotal = 0;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* ================================================================
     PHYSICS CALCULATIONS
     ================================================================ */
  function calcBridgeVoltage() {
    return Vs * (R3 / (R1 + R3) - Rx / (R2 + Rx));
  }

  function calcTheveninR() {
    return (R1 * R3) / (R1 + R3) + (R2 * Rx) / (R2 + Rx);
  }

  function calcGalvCurrent() {
    var vb = calcBridgeVoltage();
    var rth = calcTheveninR();
    return vb / (rth + RG);
  }

  function calcBalancedRx() {
    return R2 * R3 / R1;
  }

  function isBalanced() {
    var product1 = R1 * Rx;
    var product2 = R2 * R3;
    return Math.abs(product1 - product2) / Math.max(product1, product2) < 0.005;
  }

  function calcSensitivity() {
    var origRx = Rx;
    Rx = origRx + 1;
    var ig1 = calcGalvCurrent();
    Rx = origRx - 1;
    var ig2 = calcGalvCurrent();
    Rx = origRx;
    return Math.abs(ig1 - ig2) / 2 * 1000; /* mA per ohm */
  }

  function calcBranchCurrents() {
    var ig = calcGalvCurrent();
    var iLeft = Vs / (R1 + R3);
    var iRight = Vs / (R2 + Rx);
    return { left: iLeft, right: iRight, galv: ig };
  }

  /* ================================================================
     READOUT & SLIDER UPDATES
     ================================================================ */
  function updateReadouts() {
    var rxCalc = calcBalancedRx();
    var vb = calcBridgeVoltage();
    var ig = calcGalvCurrent();
    var balanced = isBalanced();
    var sens = calcSensitivity();

    $('#r-rx').textContent = round1(rxCalc);
    $('#r-vb').textContent = round3(vb);
    $('#r-ig').textContent = round3(ig * 1000);
    var statusEl = $('#r-status');
    statusEl.textContent = balanced ? 'Balanced' : 'Unbalanced';
    statusEl.style.color = balanced ? '#3ddc84' : '#ff5555';
    $('#r-sens').textContent = round3(sens);
  }

  function updateSliderDisplays() {
    $('#r1-val').textContent = R1 + ' \u03A9';
    $('#r2-val').textContent = R2 + ' \u03A9';
    $('#r3-val').textContent = R3 + ' \u03A9';
    $('#rx-val').textContent = Rx + ' \u03A9';
    $('#vs-val').textContent = Vs.toFixed(1) + ' V';
  }

  /* ================================================================
     DRAWING HELPERS
     ================================================================ */
  function drawLabel(x, y, text, color, size) {
    ctx.font = '700 ' + (size || 12) + 'px "Segoe UI", sans-serif';
    ctx.fillStyle = color || '#dde3f0';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  /** Draw a resistor zigzag between two points */
  function drawZigzag(x1, y1, x2, y2, color, label, highlight) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    var nx = dx / len, ny = dy / len;
    var px = -ny, py = nx; /* perpendicular */
    var zigN = 6, bodyFrac = 0.55;
    var leadLen = len * (1 - bodyFrac) / 2;
    var bodyLen = len * bodyFrac;
    var zigStep = bodyLen / (zigN * 2);
    var zigAmp = 9;

    ctx.save();
    ctx.strokeStyle = color || '#26a69a';
    ctx.lineWidth = highlight ? 3 : 2;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    /* Lead in */
    var sx = x1 + nx * leadLen, sy = y1 + ny * leadLen;
    ctx.moveTo(x1, y1); ctx.lineTo(sx, sy);
    /* Zigzag */
    for (var i = 0; i < zigN * 2; i++) {
      var dir = (i % 2 === 0) ? 1 : -1;
      var zx = sx + nx * zigStep * (i + 1) + px * zigAmp * dir;
      var zy = sy + ny * zigStep * (i + 1) + py * zigAmp * dir;
      ctx.lineTo(zx, zy);
    }
    /* Lead out */
    var ex = x1 + nx * (leadLen + bodyLen), ey = y1 + ny * (leadLen + bodyLen);
    ctx.lineTo(ex, ey); ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    /* Label */
    if (label) {
      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2;
      ctx.save();
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillStyle = color || '#26a69a';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, mx + px * 20, my + py * 20);
      ctx.restore();
    }
  }

  /** Draw a galvanometer circle with needle */
  function drawGalvanometer(cx, cy, radius, deflection, showDefl) {
    ctx.save();
    /* Outer circle */
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(171,71,188,0.12)';
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    /* "G" label */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ab47bc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('G', cx, cy + 1);

    if (showDefl) {
      /* Scale marks */
      ctx.strokeStyle = 'rgba(221,227,240,0.25)'; ctx.lineWidth = 1;
      for (var a = -45; a <= 45; a += 15) {
        var ar = a * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx + Math.sin(ar) * (radius - 7), cy - Math.cos(ar) * (radius - 7));
        ctx.lineTo(cx + Math.sin(ar) * (radius - 2), cy - Math.cos(ar) * (radius - 2));
        ctx.stroke();
      }
      /* Needle */
      var angle = clamp(deflection, -45, 45) * Math.PI / 180;
      var nLen = radius - 5;
      var tipX = cx + Math.sin(angle) * nLen;
      var tipY = cy - Math.cos(angle) * nLen;
      ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(tipX, tipY); ctx.stroke();
      /* Tip dot */
      ctx.fillStyle = '#ff5555';
      ctx.beginPath(); ctx.arc(tipX, tipY, 3, 0, Math.PI * 2); ctx.fill();
      /* Pivot */
      ctx.fillStyle = '#dde3f0';
      ctx.beginPath(); ctx.arc(cx, cy + 4, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  /** Draw battery symbol between two points */
  function drawBattery(x1, y1, x2, y2, voltage) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    var nx = dx / len, ny = dy / len;
    var px = -ny, py = nx;

    ctx.save();
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    /* Leads */
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(mx - nx * 12, my - ny * 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx + nx * 12, my + ny * 12); ctx.lineTo(x2, y2); ctx.stroke();

    /* Long plate (+) */
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mx - nx * 6 + px * 10, my - ny * 6 + py * 10);
    ctx.lineTo(mx - nx * 6 - px * 10, my - ny * 6 - py * 10);
    ctx.stroke();
    /* Short plate (-) */
    ctx.beginPath();
    ctx.moveTo(mx + nx * 6 + px * 6, my + ny * 6 + py * 6);
    ctx.lineTo(mx + nx * 6 - px * 6, my + ny * 6 - py * 6);
    ctx.stroke();

    /* +/- labels */
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', mx - nx * 18 + px * 14, my - ny * 18 + py * 14);
    ctx.fillText('\u2212', mx + nx * 18 + px * 14, my + ny * 18 + py * 14);
    /* Voltage */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText(voltage.toFixed(1) + ' V', mx + px * 28, my + py * 28);
    ctx.restore();
  }

  /** Draw animated current-flow dots along a polyline path */
  function drawCurrentDots(path, speed, color, t) {
    if (Math.abs(speed) < 0.0001 || path.length < 2) return;
    var segments = [], totalLen = 0;
    for (var i = 1; i < path.length; i++) {
      var sdx = path[i][0] - path[i - 1][0];
      var sdy = path[i][1] - path[i - 1][1];
      var sLen = Math.sqrt(sdx * sdx + sdy * sdy);
      segments.push({ x1: path[i - 1][0], y1: path[i - 1][1], dx: sdx, dy: sdy, len: sLen, start: totalLen });
      totalLen += sLen;
    }
    if (totalLen < 1) return;
    var numDots = Math.max(2, Math.floor(totalLen / 28));
    ctx.fillStyle = color || 'rgba(245,200,66,0.8)';
    for (var d = 0; d < numDots; d++) {
      var dist = ((d / numDots + t * speed) % 1);
      if (dist < 0) dist += 1;
      dist *= totalLen;
      for (var s = 0; s < segments.length; s++) {
        var seg = segments[s];
        if (dist >= seg.start && dist < seg.start + seg.len) {
          var frac = (dist - seg.start) / seg.len;
          ctx.beginPath();
          ctx.arc(seg.x1 + seg.dx * frac, seg.y1 + seg.dy * frac, 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
      }
    }
  }

  /** Draw a wire with potential-based colour */
  function drawWire(x1, y1, x2, y2, potential) {
    var r = Math.round(80 + potential * 175);
    var g = Math.round(80 + (1 - Math.abs(potential - 0.5) * 2) * 80);
    var b = Math.round(80 + (1 - potential) * 175);
    ctx.strokeStyle = 'rgb(' + r + ',' + g + ',' + b + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  /** Draw a junction node */
  function drawNode(x, y, glow) {
    ctx.fillStyle = glow ? 'rgba(61,220,132,0.35)' : 'rgba(221,227,240,0.2)';
    ctx.beginPath(); ctx.arc(x, y, glow ? 8 : 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = glow ? '#3ddc84' : '#dde3f0';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  }

  /* ================================================================
     MAIN CIRCUIT DRAWING (simulate mode)
     ================================================================ */
  function drawCircuit() {
    var balanced = isBalanced();
    var vb = calcBridgeVoltage();
    var ig = calcGalvCurrent();
    var currents = calcBranchCurrents();

    /* ---- Node positions (diamond layout) ---- */
    var nA = { x: 400, y: 68 };   /* Top (+) */
    var nD = { x: 400, y: 432 };  /* Bottom (-) */
    var nB = { x: 140, y: 250 };  /* Left  (R1/R3 junction) */
    var nC = { x: 660, y: 250 };  /* Right (R2/Rx junction) */

    /* Normalised node potentials for wire colouring */
    var vBn = R3 / (R1 + R3); /* potential at B */
    var vCn = Rx / (R2 + Rx); /* potential at C */

    /* ---- Subtle background grid ---- */
    ctx.strokeStyle = 'rgba(107,122,153,0.06)'; ctx.lineWidth = 1;
    var gx, gy2;
    for (gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (gy2 = 0; gy2 < H; gy2 += 40) { ctx.beginPath(); ctx.moveTo(0, gy2); ctx.lineTo(W, gy2); ctx.stroke(); }

    /* ---- Wires (drawn first, behind components) ---- */
    drawWire(nA.x, nA.y, nB.x, nB.y, (1.0 + vBn) / 2);
    drawWire(nA.x, nA.y, nC.x, nC.y, (1.0 + vCn) / 2);
    drawWire(nB.x, nB.y, nD.x, nD.y, vBn / 2);
    drawWire(nC.x, nC.y, nD.x, nD.y, vCn / 2);
    drawWire(nB.x, nB.y, nC.x, nC.y, (vBn + vCn) / 2);

    /* ---- Resistors (zigzag symbols with labels) ---- */
    drawZigzag(nA.x, nA.y, nB.x, nB.y, '#26a69a', 'R1 = ' + fmtR(R1), false);
    drawZigzag(nA.x, nA.y, nC.x, nC.y, '#26a69a', 'R2 = ' + fmtR(R2), false);
    drawZigzag(nB.x, nB.y, nD.x, nD.y, '#26a69a', 'R3 = ' + fmtR(R3), false);
    drawZigzag(nC.x, nC.y, nD.x, nD.y, '#ffa000', 'Rx = ' + fmtR(Rx), true);

    /* ---- Galvanometer (centre of B-C bridge) ---- */
    var galvX = (nB.x + nC.x) / 2;
    var galvY = (nB.y + nC.y) / 2;
    var galvR = 28;
    var deflAngle = 0;
    if (showGalv && !balanced) {
      var maxIg = Vs / (RG + 10);
      deflAngle = clamp((ig / maxIg) * 90, -45, 45);
    }
    drawGalvanometer(galvX, galvY, galvR, deflAngle, showGalv);

    /* ---- Battery (left side, A down to D) ---- */
    var batX = nA.x - 65;
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(nA.x, nA.y); ctx.lineTo(batX, nA.y); ctx.lineTo(batX, nA.y + 65); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(batX, nD.y - 65); ctx.lineTo(batX, nD.y); ctx.lineTo(nD.x, nD.y); ctx.stroke();
    drawBattery(batX, nA.y + 65, batX, nD.y - 65, Vs);

    /* ---- Junction nodes ---- */
    drawNode(nA.x, nA.y, balanced);
    drawNode(nD.x, nD.y, balanced);
    drawNode(nB.x, nB.y, balanced);
    drawNode(nC.x, nC.y, balanced);

    /* Node labels */
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('A', nA.x + 18, nA.y - 10);
    ctx.fillText('D', nD.x + 18, nD.y + 12);
    ctx.fillText('B', nB.x - 16, nB.y);
    ctx.fillText('C', nC.x + 16, nC.y);

    /* ---- Animated current-flow dots ---- */
    var dotSpeed = 0.35;
    /* Left branch A -> B -> D */
    drawCurrentDots([[nA.x, nA.y], [nB.x, nB.y], [nD.x, nD.y]],
      dotSpeed * clamp(currents.left * 200, 0.1, 1.5), 'rgba(61,220,132,0.7)', animT);
    /* Right branch A -> C -> D */
    drawCurrentDots([[nA.x, nA.y], [nC.x, nC.y], [nD.x, nD.y]],
      dotSpeed * clamp(currents.right * 200, 0.1, 1.5), 'rgba(61,220,132,0.7)', animT);
    /* Battery return D -> bat -> A */
    drawCurrentDots([[nD.x, nD.y], [batX, nD.y], [batX, nA.y], [nA.x, nA.y]],
      dotSpeed * clamp((currents.left + currents.right) * 100, 0.1, 1.5), 'rgba(245,200,66,0.55)', animT);
    /* Galvanometer dots (only when unbalanced) */
    if (!balanced && Math.abs(ig) > 1e-6) {
      var gPath = ig > 0
        ? [[nB.x, nB.y], [galvX, galvY], [nC.x, nC.y]]
        : [[nC.x, nC.y], [galvX, galvY], [nB.x, nB.y]];
      drawCurrentDots(gPath, dotSpeed * clamp(Math.abs(ig) * 500, 0.1, 1.5), 'rgba(171,71,188,0.8)', animT);
    }

    /* ---- Status text ---- */
    if (balanced) {
      drawLabel(400, 22, 'Wheatstone Bridge \u2014 BALANCED', '#3ddc84', 16);
      ctx.fillStyle = 'rgba(61,220,132,0.08)';
      ctx.fillRect(200, 460, 400, 30);
      drawLabel(400, 475, 'R1 \u00D7 Rx = R2 \u00D7 R3  |  Ig = 0', 'rgba(61,220,132,0.8)', 12);
      drawLabel(400, 493, '\u2714 BALANCED', '#3ddc84', 14);
    } else {
      drawLabel(400, 22, 'Wheatstone Bridge \u2014 UNBALANCED', '#ff5555', 16);
      drawLabel(400, 472, 'Ig = ' + round3(ig * 1000) + ' mA  |  Rx(bal) = ' + round1(calcBalancedRx()) + ' \u03A9', 'rgba(255,85,85,0.8)', 11);
      drawLabel(400, 493, 'Vbridge = ' + round3(vb) + ' V', '#ff5555', 13);
    }
  }

  /* ================================================================
     EXPLORE MODE -- MINI DIAGRAMS (6)
     ================================================================ */
  function drawConceptDiagram(c) {
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText(c.name, W / 2, 32);

    var map = {
      bridgeDiagram: drawMiniBridge,
      balanceDiagram: drawMiniBalance,
      nullDiagram: drawMiniNull,
      theveninDiagram: drawMiniThevenin,
      sensitivityDiagram: drawMiniSensitivity,
      strainDiagram: drawMiniStrain
    };
    if (map[c.diagram]) map[c.diagram]();
  }

  /** Reusable mini diamond for explore diagrams */
  function miniDiamond(cx, cy, size, labels) {
    var top = { x: cx, y: cy - size };
    var bot = { x: cx, y: cy + size };
    var left = { x: cx - size * 1.2, y: cy };
    var right = { x: cx + size * 1.2, y: cy };
    drawZigzag(top.x, top.y, left.x, left.y, '#26a69a', labels ? labels[0] : '', false);
    drawZigzag(top.x, top.y, right.x, right.y, '#26a69a', labels ? labels[1] : '', false);
    drawZigzag(left.x, left.y, bot.x, bot.y, '#26a69a', labels ? labels[2] : '', false);
    drawZigzag(right.x, right.y, bot.x, bot.y, '#ffa000', labels ? labels[3] : '', true);
    drawGalvanometer(cx, cy, 18, 0, true);
    drawNode(top.x, top.y, false);
    drawNode(bot.x, bot.y, false);
    drawNode(left.x, left.y, false);
    drawNode(right.x, right.y, false);
    return { top: top, bot: bot, left: left, right: right };
  }

  function drawMiniBridge() {
    drawLabel(W / 2, 65, 'Four Resistors in Diamond Configuration', '#6b7a99', 12);
    var n = miniDiamond(W / 2, 240, 110, ['R1', 'R2', 'R3', 'Rx']);
    drawLabel(n.top.x + 16, n.top.y - 12, 'A (+)', '#f5c842', 11);
    drawLabel(n.bot.x + 16, n.bot.y + 14, 'D (\u2212)', '#f5c842', 11);
    drawLabel(n.left.x - 16, n.left.y, 'B', '#dde3f0', 11);
    drawLabel(n.right.x + 16, n.right.y, 'C', '#dde3f0', 11);
    drawLabel(W / 2, 400, 'Voltage source across A\u2013D, Galvanometer across B\u2013C', '#ab47bc', 12);
    drawLabel(W / 2, 425, 'Ig = 0 when bridge is balanced', '#3ddc84', 11);
  }

  function drawMiniBalance() {
    drawLabel(W / 2, 65, 'R1 \u00D7 Rx = R2 \u00D7 R3', '#ab47bc', 18);
    drawLabel(W / 2, 95, 'Equivalently: R1/R2 = R3/Rx', '#6b7a99', 13);
    miniDiamond(W / 2, 250, 100, ['R1', 'R2', 'R3', 'Rx']);
    drawLabel(W / 2, 395, 'At balance: V_B = V_C \u2192 No current through G', '#3ddc84', 12);
    drawLabel(W / 2, 420, 'Unknown: Rx = R2 \u00D7 R3 / R1', '#f5c842', 13);
    drawLabel(W / 2, 445, 'Result is independent of supply voltage', '#6b7a99', 11);
  }

  function drawMiniNull() {
    drawLabel(W / 2, 65, 'Null Detection Advantage', '#ab47bc', 16);
    /* Direct measurement box */
    ctx.fillStyle = 'rgba(255,85,85,0.12)'; ctx.strokeStyle = 'rgba(255,85,85,0.4)'; ctx.lineWidth = 1;
    ctx.fillRect(50, 110, 310, 105); ctx.strokeRect(50, 110, 310, 105);
    drawLabel(205, 130, 'Direct Measurement', '#ff5555', 13);
    drawLabel(205, 155, 'Accuracy depends on meter calibration', '#dde3f0', 11);
    drawLabel(205, 175, 'Limited by meter resolution', '#dde3f0', 11);
    drawLabel(205, 200, 'Error: ~1\u20135%', '#ff5555', 12);
    /* Null detection box */
    ctx.fillStyle = 'rgba(61,220,132,0.12)'; ctx.strokeStyle = 'rgba(61,220,132,0.4)';
    ctx.fillRect(440, 110, 310, 105); ctx.strokeRect(440, 110, 310, 105);
    drawLabel(595, 130, 'Null Detection (Bridge)', '#3ddc84', 13);
    drawLabel(595, 155, 'Meter only detects zero \u2014 no calibration', '#dde3f0', 11);
    drawLabel(595, 175, 'Accuracy set by known resistors', '#dde3f0', 11);
    drawLabel(595, 200, 'Error: < 0.01%', '#3ddc84', 12);
    /* Mini bridge */
    miniDiamond(W / 2, 330, 75, ['R1', 'R2', 'R3', 'Rx']);
    drawLabel(W / 2, 440, 'Zero-current detection = highest accuracy', '#f5c842', 13);
  }

  function drawMiniThevenin() {
    drawLabel(W / 2, 65, 'Thevenin Equivalent at Galvanometer', '#ab47bc', 15);
    /* Bridge on left */
    miniDiamond(190, 220, 75, ['R1', 'R2', 'R3', 'Rx']);
    /* Arrow */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(320, 220); ctx.lineTo(390, 220); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(385, 215); ctx.lineTo(395, 220); ctx.lineTo(385, 225); ctx.closePath();
    ctx.fillStyle = '#f5c842'; ctx.fill();
    /* Thevenin circuit on right */
    ctx.strokeStyle = '#26a69a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(460, 220, 14, 0, Math.PI * 2); ctx.stroke();
    drawLabel(460, 220, 'V', '#26a69a', 10);
    drawLabel(460, 248, 'Vth', '#26a69a', 10);
    drawZigzag(478, 220, 570, 220, '#26a69a', 'Rth', false);
    drawZigzag(580, 220, 680, 220, '#ab47bc', 'Rg', false);
    /* Formulas */
    drawLabel(W / 2, 340, 'Vth = Vs \u00D7 (R3/(R1+R3) \u2212 Rx/(R2+Rx))', '#dde3f0', 12);
    drawLabel(W / 2, 365, 'Rth = R1||R3 + R2||Rx', '#dde3f0', 12);
    drawLabel(W / 2, 395, 'Ig = Vth / (Rth + Rg)', '#f5c842', 14);
    drawLabel(W / 2, 425, 'where A||B = A\u00D7B/(A+B)', '#6b7a99', 11);
  }

  function drawMiniSensitivity() {
    drawLabel(W / 2, 65, 'Bridge Sensitivity Analysis', '#ab47bc', 15);
    /* Chart area */
    var chX = 100, chY = 110, chW = 600, chH = 200;
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(chX, chY); ctx.lineTo(chX, chY + chH); ctx.lineTo(chX + chW, chY + chH); ctx.stroke();
    drawLabel(chX + chW / 2, chY + chH + 22, 'Rx / R (ratio)', '#6b7a99', 11);
    drawLabel(chX - 35, chY + chH / 2, 'S', '#6b7a99', 12);
    /* Sensitivity curve */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var ratio = 0.1 + i * 0.038;
      var s = 1 / Math.pow(1 + ratio, 2);
      var px = chX + (i / 100) * chW;
      var py = chY + chH - s * chH * 3;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    /* Peak */
    drawLabel(chX + chW * 0.25, chY + 5, '\u2191 Maximum at equal arms', '#3ddc84', 11);
    /* Key points */
    drawLabel(W / 2, 370, 'S = Vs / (4R\u00B2) for equal arms (R1=R2=R3=Rx=R)', '#dde3f0', 12);
    drawLabel(W / 2, 400, 'Higher Vs \u2192 Higher sensitivity', '#f5c842', 12);
    drawLabel(W / 2, 425, 'Lower Rg \u2192 Higher sensitivity', '#f5c842', 12);
    drawLabel(W / 2, 455, 'Equal arms \u2192 Maximum sensitivity', '#3ddc84', 12);
  }

  function drawMiniStrain() {
    drawLabel(W / 2, 65, 'Strain Gauge Bridge Configurations', '#ab47bc', 15);
    /* Three config boxes */
    var boxes = [
      { x: 40, w: 220, title: 'Quarter Bridge', gauges: '1 active gauge', formula: 'Vout=Vs\u00B7GF\u00B7\u03B5/4', sens: '\u00D71', app: 'Stress analysis', color: '#26a69a' },
      { x: 290, w: 220, title: 'Half Bridge', gauges: '2 active gauges', formula: 'Vout=Vs\u00B7GF\u00B7\u03B5/2', sens: '\u00D72', app: 'Bending', color: '#ffa000' },
      { x: 540, w: 220, title: 'Full Bridge', gauges: '4 active gauges', formula: 'Vout=Vs\u00B7GF\u00B7\u03B5', sens: '\u00D74', app: 'Load cells / torque', color: '#ab47bc' }
    ];
    boxes.forEach(function (b) {
      var r = parseInt(b.color.slice(1, 3), 16);
      var g = parseInt(b.color.slice(3, 5), 16);
      var bl = parseInt(b.color.slice(5, 7), 16);
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + bl + ',0.12)';
      ctx.strokeStyle = 'rgba(' + r + ',' + g + ',' + bl + ',0.4)';
      ctx.lineWidth = 1;
      ctx.fillRect(b.x, 100, b.w, 135);
      ctx.strokeRect(b.x, 100, b.w, 135);
      var cx = b.x + b.w / 2;
      drawLabel(cx, 118, b.title, b.color, 13);
      drawLabel(cx, 143, b.gauges, '#dde3f0', 11);
      drawLabel(cx, 163, b.formula, '#f5c842', 11);
      drawLabel(cx, 183, 'Sensitivity: ' + b.sens, '#6b7a99', 10);
      drawLabel(cx, 208, b.app, '#6b7a99', 10);
    });
    /* Strain gauge info */
    drawLabel(W / 2, 270, '\u0394R/R = GF \u00D7 \u03B5', '#dde3f0', 14);
    drawLabel(W / 2, 295, 'GF \u2248 2 (metal foil)  |  GF \u2248 100\u2013200 (semiconductor)', '#6b7a99', 11);
    /* Mini strain gauge drawing */
    ctx.strokeStyle = '#ffa000'; ctx.lineWidth = 1.5;
    var sgX = 300, sgY = 320, sgW = 200, sgH = 70;
    ctx.strokeRect(sgX, sgY, sgW, sgH);
    for (var line = 0; line < 8; line++) {
      var lx = sgX + 15 + line * 22;
      ctx.beginPath(); ctx.moveTo(lx, sgY + 8); ctx.lineTo(lx, sgY + sgH - 8); ctx.stroke();
      if (line < 7) {
        var connectY = (line % 2 === 0) ? sgY + sgH - 8 : sgY + 8;
        ctx.beginPath(); ctx.moveTo(lx, connectY); ctx.lineTo(lx + 22, connectY); ctx.stroke();
      }
    }
    drawLabel(W / 2, 420, 'Typical R: 120\u03A9 or 350\u03A9  |  \u03B5 ~ 1\u201310,000 \u03BC\u03B5', '#6b7a99', 11);
    drawLabel(W / 2, 445, 'Applications: load cells, pressure transducers, accelerometers', '#6b7a99', 11);
  }

  /* ================================================================
     PRACTICE & QUIZ CANVAS BACKDROPS
     ================================================================ */
  function drawPracticeCanvas() {
    drawLabel(W / 2, 36, 'Practice Mode', '#dde3f0', 18);
    drawLabel(W / 2, 60, 'Solve the Wheatstone bridge problem below', '#f5c842', 12);
    miniDiamond(W / 2, 250, 110, ['R1', 'R2', 'R3', 'Rx']);
    drawLabel(W / 2, 415, 'Vb = Vs \u00D7 (R3/(R1+R3) \u2212 Rx/(R2+Rx))', '#6b7a99', 11);
    drawLabel(W / 2, 440, 'Balance: R1\u00D7Rx = R2\u00D7R3  \u2192  Rx = R2\u00D7R3/R1', '#6b7a99', 11);
  }

  function drawQuizCanvas() {
    drawLabel(W / 2, 36, 'Quiz Mode', '#dde3f0', 18);
    drawLabel(W / 2, 60, 'Answer the question below', '#f5c842', 12);
    miniDiamond(W / 2, 250, 110, ['R1', 'R2', 'R3', 'Rx']);
    drawLabel(W / 2, 415, 'Wheatstone Bridge Concepts', '#ab47bc', 13);
    drawLabel(W / 2, 440, 'Balance: R1 \u00D7 Rx = R2 \u00D7 R3', '#6b7a99', 11);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      drawCircuit();
    } else if (mode === 'explore') {
      var filtered = CONCEPTS.filter(function (c) { return c.cat === selCat; });
      if (filtered[selConcept]) drawConceptDiagram(filtered[selConcept]);
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    }
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate(timestamp) {
    if (!animRunning) return;
    if (!lastFrameTime) lastFrameTime = timestamp;
    var dt = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;
    animT += dt * 0.4;
    if (animT > 1000) animT -= 1000;
    render();
    requestAnimationFrame(animate);
  }

  function startAnim() {
    if (animRunning) return;
    animRunning = true; lastFrameTime = 0;
    requestAnimationFrame(animate);
  }
  function stopAnim() { animRunning = false; }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;
    $$('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });

    var simPanels = ['#sim-mode'];
    var explorePanels = ['#cat-row', '#item-selector', '#item-info'];
    var practicePanels = ['#practice-panel', '#practice-bar'];
    var quizPanels = ['#quiz-panel', '#quiz-bar', '#quiz-result'];

    simPanels.concat(explorePanels, practicePanels, quizPanels).forEach(function (s) { hide($(s)); });

    if (m === 'simulate') {
      simPanels.forEach(function (s) { show($(s)); });
      startAnim();
    } else {
      stopAnim();
    }
    if (m === 'explore') {
      explorePanels.forEach(function (s) { show($(s)); });
      buildConceptGrid();
    }
    if (m === 'practice') {
      practicePanels.forEach(function (s) { show($(s)); });
      newPractice();
    }
    if (m === 'quiz') {
      show($('#quiz-panel')); show($('#quiz-bar'));
      startQuiz();
    }
    render();
  }

  /* ================================================================
     EXPLORE MODE -- grid & info
     ================================================================ */
  function buildConceptGrid() {
    var grid = $('#concept-grid');
    grid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    filtered.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (i === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selConcept = i;
        $$('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo(c);
        render();
      });
      grid.appendChild(btn);
    });
    if (filtered[selConcept]) showConceptInfo(filtered[selConcept]);
  }

  function showConceptInfo(c) {
    var el = $('#item-info');
    el.innerHTML =
      '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">Unit: ' + c.unit + '</span></div>' +
      '<div class="example-box"><h4>Worked Example</h4><p class="ex-problem">' + c.example.problem + '</p>' +
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s + '</p>'; }).join('') +
      '</div>';
    show(el);
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function newPractice() {
    pAnswered = false;
    var fn = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    pProblem = fn();
    $('#pp-prompt').textContent = pProblem.prompt;
    $('#pp-unit').textContent = pProblem.unit;
    $('#pp-input').value = '';
    $('#pp-input').disabled = false;
    $('#pp-feedback').textContent = '';
    hide($('#pp-next'));
    hide($('#pp-solution'));
    render();
  }

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    quizScore = 0; quizIdx = 0; quizAnswered = false;
    quizQs = shuffleArr(genQuizPool()).slice(0, 5);
    hide($('#quiz-result'));
    show($('#quiz-panel')); show($('#quiz-bar'));
    showQuizQ();
  }

  function showQuizQ() {
    quizAnswered = false;
    var q = quizQs[quizIdx];
    $('#qbar-num').textContent = quizIdx + 1;
    var panel = $('#quiz-panel');

    if (q.type === 'mcq') {
      var opts = q.options.slice();
      var correctText = opts[q.correct];
      var shuffled = shuffleArr(opts);
      q._correctIdx = shuffled.indexOf(correctText);
      panel.innerHTML = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>' +
        '<div class="answer-grid">' +
        shuffled.map(function (o, i) {
          return '<button class="answer-btn" data-idx="' + i + '">' + o + '</button>';
        }).join('') + '</div>' +
        '<p class="quiz-feedback" id="qfb"></p>' +
        '<button class="btn btn-ghost" id="q-next" style="display:none;margin-top:10px;">Next \u2192</button>';
      panel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { submitMCQ(+btn.dataset.idx, q._correctIdx, panel); });
      });
    } else {
      panel.innerHTML = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>' +
        '<div class="quiz-input-row"><input class="qi-input" id="qi-val" type="number" step="any" placeholder="Your answer"><span class="qi-unit">' + (q.unit || '') + '</span>' +
        '<button class="btn btn-primary" id="q-submit">Submit</button></div>' +
        '<p class="quiz-feedback" id="qfb"></p>' +
        '<button class="btn btn-ghost" id="q-next" style="display:none;margin-top:10px;">Next \u2192</button>';
      panel.querySelector('#q-submit').addEventListener('click', function () { submitNumeric(q, panel); });
    }
    var nextBtn = panel.querySelector('#q-next');
    if (nextBtn) nextBtn.addEventListener('click', nextQuizQ);
    render();
  }

  function submitMCQ(chosen, correct, panel) {
    if (quizAnswered) return;
    quizAnswered = true;
    var btns = panel.querySelectorAll('.answer-btn');
    btns.forEach(function (b, i) {
      b.classList.add('locked');
      if (i === correct) b.classList.add('correct');
      if (i === chosen && i !== correct) b.classList.add('wrong');
    });
    var ok = chosen === correct;
    if (ok) quizScore++;
    quizQs[quizIdx]._given = btns[chosen].textContent;
    quizQs[quizIdx]._ok = ok;
    panel.querySelector('#qfb').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect';
    panel.querySelector('#qfb').className = 'quiz-feedback ' + (ok ? 'ok' : 'err');
    show(panel.querySelector('#q-next'));
  }

  function submitNumeric(q, panel) {
    if (quizAnswered) return;
    quizAnswered = true;
    var val = parseFloat(panel.querySelector('#qi-val').value);
    var tol = Math.max(Math.abs(q.answer) * 0.05, 0.5);
    var ok = !isNaN(val) && Math.abs(val - q.answer) <= tol;
    if (ok) quizScore++;
    q._given = isNaN(val) ? 'No answer' : val;
    q._ok = ok;
    panel.querySelector('#qfb').textContent = ok ? '\u2714 Correct!' : '\u2718 Answer: ' + q.answer + ' ' + (q.unit || '');
    panel.querySelector('#qfb').className = 'quiz-feedback ' + (ok ? 'ok' : 'err');
    panel.querySelector('#qi-val').disabled = true;
    panel.querySelector('#q-submit').disabled = true;
    show(panel.querySelector('#q-next'));
  }

  function nextQuizQ() {
    quizIdx++;
    if (quizIdx >= quizQs.length) { showQuizResult(); return; }
    showQuizQ();
  }

  function showQuizResult() {
    hide($('#quiz-panel')); hide($('#quiz-bar'));
    var el = $('#quiz-result');
    var pct = quizScore / quizQs.length;
    var cls = pct === 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct === 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605' : '\u2605';
    var verdict = pct === 1 ? 'Perfect Score!' : pct >= 0.6 ? 'Good Job!' : 'Keep Practising';

    el.innerHTML =
      '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + quizQs.length + '</span><div class="qr-verdict">' + verdict + '</div></div></div>' +
      '<div class="qr-rows">' +
      quizQs.map(function (q, i) {
        var rowCls = q._ok ? 'ok' : 'err';
        var mark = q._ok ? '\u2714' : '\u2718';
        var detail = q.type === 'mcq'
          ? '<strong>Your answer:</strong> ' + q._given
          : '<strong>Your answer:</strong> ' + q._given + ' &nbsp;|&nbsp; <strong>Correct:</strong> ' + q.answer + ' ' + (q.unit || '');
        return '<div class="qr-row ' + rowCls + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + detail + '</span><span class="qr-mark">' + mark + '</span></div>';
      }).join('') +
      '</div>' +
      '<button class="btn btn-primary" id="qr-retry" style="align-self:flex-start;">New Quiz</button>';
    el.querySelector('#qr-retry').addEventListener('click', startQuiz);
    show(el);
  }

  /* ================================================================
     EVENT LISTENERS -- MODE TABS
     ================================================================ */
  $('#mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    setMode(e.target.dataset.mode);
  });

  /* ================================================================
     EVENT LISTENERS -- CATEGORY TABS (Explore)
     ================================================================ */
  $('#cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    selCat = e.target.dataset.cat;
    selConcept = 0;
    $$('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildConceptGrid();
    render();
  });

  /* ================================================================
     EVENT LISTENERS -- PRACTICE
     ================================================================ */
  $('#pp-check').addEventListener('click', function () {
    if (pAnswered || !pProblem) return;
    pAnswered = true;
    pTotal++;
    var val = parseFloat($('#pp-input').value);
    var tol = Math.max(Math.abs(pProblem.answer) * 0.05, 0.5);
    var ok = !isNaN(val) && Math.abs(val - pProblem.answer) <= tol;
    if (ok) pScore++;
    $('#pp-feedback').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect \u2014 answer: ' + pProblem.answer + ' ' + pProblem.unit;
    $('#pp-feedback').className = 'feedback ' + (ok ? 'ok' : 'err');
    $('#pp-input').disabled = true;
    show($('#pp-next'));
    var solEl = $('#pp-solution');
    solEl.innerHTML = '<h4>Step-by-Step Solution</h4>' +
      pProblem.steps.map(function (s) { return '<p class="sol-step">' + s + '</p>'; }).join('');
    show(solEl);
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
  });

  $('#pp-next').addEventListener('click', newPractice);

  $('#pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!pAnswered) { $('#pp-check').click(); } else { $('#pp-next').click(); }
    }
  });

  /* ================================================================
     EVENT LISTENERS -- SLIDERS
     ================================================================ */
  function applyAutoBalance() {
    if (autoBalance) {
      Rx = Math.round(clamp(calcBalancedRx(), 1, 10000));
      $('#rx-slider').value = Rx;
    }
    updateSliderDisplays();
    updateReadouts();
  }

  $('#r1-slider').addEventListener('input', function () { R1 = +this.value; applyAutoBalance(); });
  $('#r2-slider').addEventListener('input', function () { R2 = +this.value; applyAutoBalance(); });
  $('#r3-slider').addEventListener('input', function () { R3 = +this.value; applyAutoBalance(); });
  $('#rx-slider').addEventListener('input', function () { Rx = +this.value; updateSliderDisplays(); updateReadouts(); });
  $('#vs-slider').addEventListener('input', function () { Vs = +this.value; updateSliderDisplays(); updateReadouts(); });

  /* ================================================================
     EVENT LISTENERS -- CHECKBOXES
     ================================================================ */
  $('#chk-galv').addEventListener('change', function () {
    showGalv = this.checked;
    this.parentElement.classList.toggle('checked', this.checked);
    render();
  });

  $('#chk-auto').addEventListener('change', function () {
    autoBalance = this.checked;
    this.parentElement.classList.toggle('checked', this.checked);
    if (autoBalance) {
      Rx = Math.round(clamp(calcBalancedRx(), 1, 10000));
      $('#rx-slider').value = Rx;
      updateSliderDisplays();
      updateReadouts();
    }
    $('#rx-slider').disabled = autoBalance;
    render();
  });

  /* ================================================================
     EVENT LISTENERS -- AUTO-BALANCE BUTTON
     ================================================================ */
  $('#btn-balance').addEventListener('click', function () {
    Rx = Math.round(clamp(calcBalancedRx(), 1, 10000));
    $('#rx-slider').value = Rx;
    updateSliderDisplays();
    updateReadouts();
    render();
  });

  /* ================================================================
     EVENT LISTENERS -- PRESETS
     ================================================================ */
  var PRESETS = {
    equal:      { r1: 1000, r2: 1000, r3: 1000, rx: 1000, vs: 12 },
    unbalanced: { r1: 1000, r2: 2000, r3: 1500, rx: 3500, vs: 12 },
    strain:     { r1: 350,  r2: 350,  r3: 350,  rx: 351,  vs: 5 },
    highv:      { r1: 100,  r2: 200,  r3: 300,  rx: 600,  vs: 24 }
  };

  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = PRESETS[btn.dataset.preset];
      if (!p) return;
      R1 = p.r1; R2 = p.r2; R3 = p.r3; Rx = p.rx; Vs = p.vs;
      $('#r1-slider').value = R1;
      $('#r2-slider').value = R2;
      $('#r3-slider').value = R3;
      $('#rx-slider').value = Rx;
      $('#vs-slider').value = Vs;
      updateSliderDisplays();
      updateReadouts();
      render();
    });
  });

  /* ================================================================
     RESPONSIVE CANVAS
     ================================================================ */
  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var rect = cvs.getBoundingClientRect();
    var drawW = rect.width;
    var aspect = H / W;
    var drawH = drawW * aspect;
    cvs.width = drawW * dpr;
    cvs.height = drawH * dpr;
    ctx.setTransform(dpr * drawW / W, 0, 0, dpr * drawH / H, 0, 0);
    render();
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeCanvas, 100);
  });

  /* ================================================================
     INIT
     ================================================================ */
  updateSliderDisplays();
  updateReadouts();
  resizeCanvas();
  setMode('simulate');

})();
