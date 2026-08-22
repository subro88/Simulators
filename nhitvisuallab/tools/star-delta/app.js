(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS (6 concepts, 2 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Basics ──────────────────────────────────────────────────── */
    {
      id: 'star-connection', name: 'Star (Y) Connection', symbol: 'V_L = \u221a3 \u00d7 V_ph',
      formula: 'V_L = \u221a3 \u00d7 V_ph ; I_L = I_ph', unit: 'V, A',
      cat: 'basics',
      desc: 'In a star (Y) connection, three impedances share a common neutral point. Each impedance is connected between a line terminal and the neutral. The line voltage is \u221a3 (1.732) times the phase voltage, while the line current equals the phase current. Star connections provide two voltage levels and are commonly used in power distribution systems. The neutral wire carries the unbalanced current in 3-phase 4-wire systems.',
      diagram: 'starConnection',
      example: { problem: 'A balanced star-connected load has a phase voltage of 230 V. Find the line voltage.', steps: ['V_L = \u221a3 \u00d7 V_ph', 'V_L = 1.732 \u00d7 230', 'V_L = 398.4 V'], answer: 398.4, unit: 'V' }
    },
    {
      id: 'delta-connection', name: 'Delta (\u0394) Connection', symbol: 'I_L = \u221a3 \u00d7 I_ph',
      formula: 'V_L = V_ph ; I_L = \u221a3 \u00d7 I_ph', unit: 'V, A',
      cat: 'basics',
      desc: 'In a delta (\u0394) connection, three impedances are connected in a closed triangle between line terminals. Each impedance is connected across two lines, so the phase voltage equals the line voltage. The line current is \u221a3 (1.732) times the phase current. Delta connections are used for motors and high-power loads since no neutral conductor is needed.',
      diagram: 'deltaConnection',
      example: { problem: 'A balanced delta-connected load has a phase current of 10 A. Find the line current.', steps: ['I_L = \u221a3 \u00d7 I_ph', 'I_L = 1.732 \u00d7 10', 'I_L = 17.32 A'], answer: 17.32, unit: 'A' }
    },
    {
      id: 'three-phase-power', name: '3-Phase Power', symbol: 'P = \u221a3 V_L I_L cos\u03c6',
      formula: 'P = \u221a3 \u00d7 V_L \u00d7 I_L \u00d7 cos(\u03c6)', unit: 'W (watts)',
      cat: 'basics',
      desc: 'Total 3-phase power is the same regardless of whether the load is star or delta connected. The formula P = \u221a3 \u00d7 V_L \u00d7 I_L \u00d7 cos(\u03c6) uses line values and the power factor. For a purely resistive load, cos(\u03c6) = 1. The reactive power is Q = \u221a3 \u00d7 V_L \u00d7 I_L \u00d7 sin(\u03c6) and the apparent power is S = \u221a3 \u00d7 V_L \u00d7 I_L.',
      diagram: 'threePhasePower',
      example: { problem: 'A 3-phase system has V_L = 400 V, I_L = 10 A, pf = 0.8. Find the total power.', steps: ['P = \u221a3 \u00d7 V_L \u00d7 I_L \u00d7 cos(\u03c6)', 'P = 1.732 \u00d7 400 \u00d7 10 \u00d7 0.8', 'P = 5542.6 W', 'P \u2248 5.54 kW'], answer: 5542.6, unit: 'W' }
    },

    /* ── Conversion ──────────────────────────────────────────────── */
    {
      id: 'y-delta-transform', name: 'Y-\u0394 Transform', symbol: 'Z_\u0394 = 3 \u00d7 Z_Y',
      formula: 'Z_\u0394 = 3 \u00d7 Z_Y (balanced)', unit: '\u03a9',
      cat: 'conversion',
      desc: 'For a balanced 3-phase load, the delta impedance is exactly 3 times the star impedance: Z_\u0394 = 3 \u00d7 Z_Y. This means switching from star to delta reduces the impedance per phase by a factor of 3, which increases the phase current by 3 and the line current by 3\u221a3, resulting in 3 times more power. This principle is used in star-delta motor starters to reduce inrush current.',
      diagram: 'yDeltaTransform',
      example: { problem: 'A balanced star load has Z_Y = 20 \u03a9. Find the equivalent delta impedance.', steps: ['Z_\u0394 = 3 \u00d7 Z_Y', 'Z_\u0394 = 3 \u00d7 20', 'Z_\u0394 = 60 \u03a9'], answer: 60, unit: '\u03a9' }
    },
    {
      id: 'balanced-unbalanced', name: 'Balanced vs Unbalanced', symbol: 'I_N = 0 (balanced)',
      formula: 'Balanced: Z_A = Z_B = Z_C', unit: '\u03a9',
      cat: 'conversion',
      desc: 'A balanced 3-phase load has equal impedances in all three phases. In a balanced star system, the neutral current is zero (I_N = 0) because the three phase currents cancel out. An unbalanced load has unequal impedances, causing a non-zero neutral current. For unbalanced Y-\u0394 conversion, the general formulas must be used: Z_AB = (Z_A\u00b7Z_B + Z_B\u00b7Z_C + Z_C\u00b7Z_A) / Z_C.',
      diagram: 'balancedUnbalanced',
      example: { problem: 'Three star impedances: Z_A = Z_B = Z_C = 30 \u03a9. Is the system balanced? Find Z_\u0394.', steps: ['All impedances are equal \u2192 Balanced system', 'Z_\u0394 = 3 \u00d7 Z_Y (balanced formula)', 'Z_\u0394 = 3 \u00d7 30 = 90 \u03a9', 'Neutral current I_N = 0 A'], answer: 90, unit: '\u03a9' }
    },
    {
      id: 'power-factor', name: 'Power Factor', symbol: 'pf = cos(\u03c6)',
      formula: 'pf = P / S = cos(\u03c6)', unit: '(dimensionless)',
      cat: 'conversion',
      desc: 'Power factor is the ratio of real power (P) to apparent power (S). It equals cos(\u03c6) where \u03c6 is the phase angle between voltage and current. A purely resistive load has pf = 1, while inductive loads (motors) have lagging pf < 1. Power factor correction using capacitors brings pf closer to unity, reducing line current and losses. In 3-phase systems, pf applies equally to star and delta configurations.',
      diagram: 'powerFactor',
      example: { problem: 'A 3-phase motor draws S = 10 kVA with P = 8 kW. Find the power factor.', steps: ['pf = P / S', 'pf = 8000 / 10000', 'pf = 0.8 lagging'], answer: 0.8, unit: '' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (8)
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }
  var SQRT3 = Math.sqrt(3);

  var PROBLEM_GEN = [
    /* 0 — Star: find V_line from V_phase */
    function () {
      var Vph = randInt(100, 250);
      var VL = round2(Vph * SQRT3);
      return { prompt: 'A balanced star-connected load has a phase voltage of ' + Vph + ' V. Find the line voltage (V).', steps: ['V_L = \u221a3 \u00d7 V_ph', 'V_L = 1.732 \u00d7 ' + Vph, 'V_L = ' + VL + ' V'], answer: VL, unit: 'V', tol: 1 };
    },
    /* 1 — Star: find V_phase from V_line */
    function () {
      var VL = randInt(200, 440);
      var Vph = round2(VL / SQRT3);
      return { prompt: 'A star-connected system has a line voltage of ' + VL + ' V. Find the phase voltage (V).', steps: ['V_ph = V_L / \u221a3', 'V_ph = ' + VL + ' / 1.732', 'V_ph = ' + Vph + ' V'], answer: Vph, unit: 'V', tol: 1 };
    },
    /* 2 — Delta: find I_line from I_phase */
    function () {
      var Iph = randInt(2, 50);
      var IL = round2(Iph * SQRT3);
      return { prompt: 'A balanced delta-connected load has a phase current of ' + Iph + ' A. Find the line current (A).', steps: ['I_L = \u221a3 \u00d7 I_ph', 'I_L = 1.732 \u00d7 ' + Iph, 'I_L = ' + IL + ' A'], answer: IL, unit: 'A', tol: 0.5 };
    },
    /* 3 — Delta: find I_phase from I_line */
    function () {
      var IL = randInt(5, 80);
      var Iph = round2(IL / SQRT3);
      return { prompt: 'A delta-connected motor draws a line current of ' + IL + ' A. Find the phase current (A).', steps: ['I_ph = I_L / \u221a3', 'I_ph = ' + IL + ' / 1.732', 'I_ph = ' + Iph + ' A'], answer: Iph, unit: 'A', tol: 0.5 };
    },
    /* 4 — 3-phase power calculation */
    function () {
      var VL = randInt(200, 440);
      var IL = randInt(5, 50);
      var pf = [0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1.0][randInt(0, 6)];
      var P = round2(SQRT3 * VL * IL * pf);
      return { prompt: 'V_L = ' + VL + ' V, I_L = ' + IL + ' A, power factor = ' + pf + '. Find the total 3-phase power (W).', steps: ['P = \u221a3 \u00d7 V_L \u00d7 I_L \u00d7 cos(\u03c6)', 'P = 1.732 \u00d7 ' + VL + ' \u00d7 ' + IL + ' \u00d7 ' + pf, 'P = ' + P + ' W'], answer: P, unit: 'W', tol: 5 };
    },
    /* 5 — Y-to-Delta impedance conversion */
    function () {
      var ZY = randInt(5, 200);
      var ZD = ZY * 3;
      return { prompt: 'A balanced star load has Z_Y = ' + ZY + ' \u03a9 per phase. Find the equivalent delta impedance Z_\u0394 (\u03a9).', steps: ['Z_\u0394 = 3 \u00d7 Z_Y', 'Z_\u0394 = 3 \u00d7 ' + ZY, 'Z_\u0394 = ' + ZD + ' \u03a9'], answer: ZD, unit: '\u03a9', tol: 0.5 };
    },
    /* 6 — Delta-to-Star impedance conversion */
    function () {
      var ZD = randInt(30, 600);
      var ZY = round2(ZD / 3);
      return { prompt: 'A balanced delta load has Z_\u0394 = ' + ZD + ' \u03a9 per phase. Find the equivalent star impedance Z_Y (\u03a9).', steps: ['Z_Y = Z_\u0394 / 3', 'Z_Y = ' + ZD + ' / 3', 'Z_Y = ' + ZY + ' \u03a9'], answer: ZY, unit: '\u03a9', tol: 0.5 };
    },
    /* 7 — Star: find phase current given V_L and Z */
    function () {
      var VL = randInt(200, 440);
      var Z = randInt(10, 200);
      var Vph = round2(VL / SQRT3);
      var Iph = round2(Vph / Z);
      return { prompt: 'Star load: V_L = ' + VL + ' V, Z = ' + Z + ' \u03a9 per phase. Find the phase current (A).', steps: ['V_ph = V_L / \u221a3 = ' + VL + ' / 1.732 = ' + Vph + ' V', 'I_ph = V_ph / Z = ' + Vph + ' / ' + Z, 'I_ph = ' + Iph + ' A'], answer: Iph, unit: 'A', tol: 0.2 };
    }
  ];

  /* ================================================================
     DATA — QUIZ BANK (15 questions)
     ================================================================ */

  var QUIZ_BANK = [
    { q: 'In a star (Y) connection, the line voltage is:', choices: ['\u221a3 times phase voltage', 'Equal to phase voltage', 'Half of phase voltage', '3 times phase voltage'], correct: 0 },
    { q: 'In a delta (\u0394) connection, the line current is:', choices: ['\u221a3 times phase current', 'Equal to phase current', 'Half of phase current', '3 times phase current'], correct: 0 },
    { q: 'In a star connection, the relationship between line current and phase current is:', choices: ['I_L = I_ph', 'I_L = \u221a3 \u00d7 I_ph', 'I_L = I_ph / \u221a3', 'I_L = 3 \u00d7 I_ph'], correct: 0 },
    { q: 'In a delta connection, the relationship between line voltage and phase voltage is:', choices: ['V_L = V_ph', 'V_L = \u221a3 \u00d7 V_ph', 'V_L = V_ph / \u221a3', 'V_L = 3 \u00d7 V_ph'], correct: 0 },
    { q: 'For a balanced load, the delta impedance equals:', choices: ['3 \u00d7 Z_star', 'Z_star / 3', '\u221a3 \u00d7 Z_star', 'Z_star / \u221a3'], correct: 0 },
    { q: 'The 3-phase power formula using line values is:', choices: ['P = \u221a3 \u00d7 V_L \u00d7 I_L \u00d7 cos(\u03c6)', 'P = 3 \u00d7 V_L \u00d7 I_L', 'P = V_L \u00d7 I_L \u00d7 cos(\u03c6)', 'P = V_L\u00b2 / Z'], correct: 0 },
    { q: 'A star-delta starter is used to:', choices: ['Reduce starting current in motors', 'Increase motor speed', 'Reverse motor direction', 'Improve power factor'], correct: 0 },
    { q: 'If V_L = 400 V in a star system, V_ph is approximately:', choices: ['231 V', '400 V', '693 V', '200 V'], correct: 0 },
    { q: 'If I_ph = 20 A in a delta system, I_L is approximately:', choices: ['34.64 A', '20 A', '11.55 A', '60 A'], correct: 0 },
    { q: 'In a balanced star system, the neutral current is:', choices: ['Zero', '\u221a3 times phase current', 'Equal to phase current', '3 times phase current'], correct: 0 },
    { q: 'Power factor of a purely resistive load is:', choices: ['1.0', '0.8', '0.0', '0.5'], correct: 0 },
    { q: 'Which connection provides access to two voltage levels?', choices: ['Star (Y)', 'Delta (\u0394)', 'Both equally', 'Neither'], correct: 0 },
    { q: 'When converting from star to delta, the power consumed:', choices: ['Remains the same', 'Increases by \u221a3', 'Triples', 'Is halved'], correct: 0 },
    { q: 'The phase angle between two adjacent phases in a 3-phase system is:', choices: ['120\u00b0', '90\u00b0', '180\u00b0', '60\u00b0'], correct: 0 },
    { q: 'Apparent power in a 3-phase system is measured in:', choices: ['VA (volt-amperes)', 'Watts', 'VAR', 'Joules'], correct: 0 }
  ];

  var QUIZ_SIZE = 5;

  /* ================================================================
     DOM REFS
     ================================================================ */

  var canvas   = document.getElementById('sim-canvas');
  var ctx      = canvas.getContext('2d');
  var CW = 900, CH = 480;

  /* Hi-DPI. Backing was a fixed 900x480 while the CSS stretches the canvas to
     its card (2.14x upscale on a 2x display). Size to real device pixels and
     scale the context so the 900x480 logical space is unchanged. No canvas
     pointer interaction here. */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var dW = canvas.getBoundingClientRect().width;
    if (!(dW > 40)) dW = CW;
    canvas.width  = Math.round(dW * dpr);
    canvas.height = Math.round(dW * (CH / CW) * dpr);
    var sc = (dW * dpr) / CW;
    ctx.setTransform(sc, 0, 0, sc, 0, 0);
  }
  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  /* Mode tabs */
  var modeTabs  = document.getElementById('mode-tabs');
  var simPanel  = document.getElementById('sim-panel');
  var catRow    = document.getElementById('cat-row');
  var itemSel   = document.getElementById('item-selector');
  var itemInfo  = document.getElementById('item-info');
  var practPanel = document.getElementById('practice-panel');
  var practBar  = document.getElementById('practice-bar');
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar   = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');
  var canvasCard = document.querySelector('.canvas-card');

  /* Sim controls */
  var configTabs = document.getElementById('config-tabs');
  var freqTabs   = document.getElementById('freq-tabs');
  var zSlider    = document.getElementById('z-slider');
  var zVal       = document.getElementById('z-val');
  var vlSlider   = document.getElementById('vl-slider');
  var vlVal      = document.getElementById('vl-val');
  var chkEq      = document.getElementById('chk-equations');
  var chkPhasors = document.getElementById('chk-phasors');

  /* Readouts */
  var rVl     = document.getElementById('r-vl');
  var rVph    = document.getElementById('r-vph');
  var rIl     = document.getElementById('r-il');
  var rIph    = document.getElementById('r-iph');
  var rPtot   = document.getElementById('r-ptot');
  var rZstar  = document.getElementById('r-zstar');
  var rZdelta = document.getElementById('r-zdelta');
  var rPf     = document.getElementById('r-pf');

  /* Practice */
  var ppPrompt  = document.getElementById('pp-prompt');
  var ppInput   = document.getElementById('pp-input');
  var ppUnit    = document.getElementById('pp-unit');
  var ppCheck   = document.getElementById('pp-check');
  var ppNext    = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  /* Quiz */
  var qbarNum = document.getElementById('qbar-num');

  /* ================================================================
     STATE
     ================================================================ */

  var mode       = 'simulate';
  var config     = 'star';     /* 'star' or 'delta' */
  var freq       = 50;
  var Z          = 100;
  var VL         = 400;
  var showEq     = true;
  var showPhasors = true;
  var animT      = 0;          /* animation time */
  var animId     = null;

  /* Explore */
  var exploreCat  = 'basics';
  var exploreConcept = null;

  /* Practice */
  var practCurrent = null;
  var practScore = 0;
  var practTotal = 0;
  var practAnswered = false;

  /* Quiz */
  var quizQuestions = [];
  var quizIdx = 0;
  var quizAnswers  = [];
  var quizLocked   = false;

  /* ================================================================
     HELPER: format number
     ================================================================ */

  function fmt(n, decimals) {
    if (decimals === undefined) decimals = 2;
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'k';
    return n.toFixed(decimals);
  }

  /* ================================================================
     PHYSICS — compute all values
     ================================================================ */

  function compute() {
    var Vph, Iph, IL;
    if (config === 'star') {
      Vph = VL / SQRT3;
      Iph = Vph / Z;
      IL  = Iph;
    } else {
      Vph = VL;
      Iph = Vph / Z;
      IL  = Iph * SQRT3;
    }
    var Ptot = SQRT3 * VL * IL * 1; /* cos(phi) = 1 for resistive */
    var Zstar  = config === 'star' ? Z : Z / 3;
    var Zdelta = config === 'star' ? Z * 3 : Z;
    return { Vph: Vph, Iph: Iph, IL: IL, Ptot: Ptot, Zstar: Zstar, Zdelta: Zdelta, pf: 1.0 };
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */

  function updateReadouts() {
    var v = compute();
    rVl.textContent     = fmt(VL, 0);
    rVph.textContent    = fmt(v.Vph, 1);
    rIl.textContent     = fmt(v.IL, 2);
    rIph.textContent    = fmt(v.Iph, 2);
    rPtot.textContent   = fmt(v.Ptot, 0);
    rZstar.textContent  = fmt(v.Zstar, 1);
    rZdelta.textContent = fmt(v.Zdelta, 1);
    rPf.textContent     = v.pf.toFixed(2);
  }

  /* ================================================================
     DRAW — pure render function (canvas)
     ================================================================ */

  function draw() {
    ctx.clearRect(0, 0, CW, CH);

    /* Background */
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, CW, CH);

    var v = compute();

    if (mode === 'simulate') {
      drawCircuit(v);
      if (showPhasors) drawPhasors(v);
      if (showEq) drawEquations(v);
    } else if (mode === 'explore') {
      drawExploreCanvas();
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    }
  }

  /* ── Draw Star Circuit ─────────────────────────────────────────── */

  function drawStarCircuit(cx, cy, v) {
    var r = 100;   /* radius for terminals */
    var nr = 0;    /* neutral center */
    var colors = ['#ff5555', '#f5c842', '#42a5f5'];
    var labels = ['R', 'Y', 'B'];
    var angles = [-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI / 3, -Math.PI / 2 + 4 * Math.PI / 3];

    /* Draw impedances from neutral to terminals */
    for (var i = 0; i < 3; i++) {
      var tx = cx + r * Math.cos(angles[i]);
      var ty = cy + r * Math.sin(angles[i]);

      /* Line from neutral to impedance midpoint */
      var mx = cx + (r * 0.45) * Math.cos(angles[i]);
      var my = cy + (r * 0.45) * Math.sin(angles[i]);
      var mx2 = cx + (r * 0.7) * Math.cos(angles[i]);
      var my2 = cy + (r * 0.7) * Math.sin(angles[i]);

      /* Wire from neutral to impedance */
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(mx, my);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Impedance block */
      drawImpedanceBlock(mx, my, mx2, my2, colors[i], 'Z');

      /* Wire from impedance to terminal */
      ctx.beginPath();
      ctx.moveTo(mx2, my2);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Terminal circle */
      ctx.beginPath();
      ctx.arc(tx, ty, 10, 0, Math.PI * 2);
      ctx.fillStyle = colors[i];
      ctx.fill();
      ctx.fillStyle = '#161b27';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], tx, ty);

      /* Current arrow */
      drawCurrentArrow(cx + (r * 0.3) * Math.cos(angles[i]), cy + (r * 0.3) * Math.sin(angles[i]), angles[i], colors[i]);

      /* Phase label */
      var lx = tx + 18 * Math.cos(angles[i]);
      var ly = ty + 18 * Math.sin(angles[i]);
      ctx.fillStyle = colors[i];
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }

    /* Neutral point */
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#dde3f0';
    ctx.fill();
    ctx.fillStyle = '#161b27';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', cx, cy);

    /* Title */
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Star (Y) Connection', cx, cy + r + 35);

    /* Voltage labels */
    ctx.fillStyle = '#ff5555';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('V_ph = ' + fmt(v.Vph, 1) + ' V', cx - r - 60, cy - r + 10);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('I_L = I_ph = ' + fmt(v.IL, 2) + ' A', cx - r - 60, cy - r + 28);
  }

  /* ── Draw Delta Circuit ────────────────────────────────────────── */

  function drawDeltaCircuit(cx, cy, v) {
    var r = 100;
    var colors = ['#ff5555', '#f5c842', '#42a5f5'];
    var labels = ['R', 'Y', 'B'];
    var angles = [-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI / 3, -Math.PI / 2 + 4 * Math.PI / 3];

    var pts = [];
    for (var i = 0; i < 3; i++) {
      pts.push({
        x: cx + r * Math.cos(angles[i]),
        y: cy + r * Math.sin(angles[i])
      });
    }

    /* Draw triangle sides with impedances */
    for (var j = 0; j < 3; j++) {
      var p1 = pts[j];
      var p2 = pts[(j + 1) % 3];
      var mx1x = p1.x + (p2.x - p1.x) * 0.3;
      var mx1y = p1.y + (p2.y - p1.y) * 0.3;
      var mx2x = p1.x + (p2.x - p1.x) * 0.7;
      var mx2y = p1.y + (p2.y - p1.y) * 0.7;

      /* Wire from p1 to impedance start */
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(mx1x, mx1y);
      ctx.strokeStyle = colors[j];
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Impedance block */
      drawImpedanceBlock(mx1x, mx1y, mx2x, mx2y, colors[j], 'Z');

      /* Wire from impedance end to p2 */
      ctx.beginPath();
      ctx.moveTo(mx2x, mx2y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = colors[j];
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Current arrow on the side */
      var ax = (mx1x + mx2x) / 2;
      var ay = (mx1y + mx2y) / 2;
      var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      drawCurrentArrow(ax + 12 * Math.cos(angle + Math.PI / 2), ay + 12 * Math.sin(angle + Math.PI / 2), angle, colors[j]);
    }

    /* Terminal circles */
    for (var k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.arc(pts[k].x, pts[k].y, 10, 0, Math.PI * 2);
      ctx.fillStyle = colors[k];
      ctx.fill();
      ctx.fillStyle = '#161b27';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[k], pts[k].x, pts[k].y);
    }

    /* Title */
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Delta (\u0394) Connection', cx, cy + r + 35);

    /* Voltage labels */
    ctx.fillStyle = '#ff5555';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('V_ph = V_L = ' + fmt(v.Vph, 1) + ' V', cx - r - 60, cy - r + 10);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('I_L = ' + fmt(v.IL, 2) + ' A', cx - r - 60, cy - r + 28);
    ctx.fillText('I_ph = ' + fmt(v.Iph, 2) + ' A', cx - r - 60, cy - r + 44);
  }

  /* ── Draw Impedance Block ──────────────────────────────────────── */

  function drawImpedanceBlock(x1, y1, x2, y2, color, label) {
    var mx = (x1 + x2) / 2;
    var my = (y1 + y2) / 2;
    var angle = Math.atan2(y2 - y1, x2 - x1);
    var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    var hw = Math.min(len / 2, 20);
    var hh = 8;

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(angle);

    /* Rectangle */
    ctx.fillStyle = color + '33';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(-hw, -hh, hw * 2, hh * 2);
    ctx.fill();
    ctx.stroke();

    /* Label */
    ctx.fillStyle = color;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 0, 0);

    ctx.restore();
  }

  /* ── Draw Current Arrow ────────────────────────────────────────── */

  function drawCurrentArrow(x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-4, -4);
    ctx.lineTo(-4, 4);
    ctx.closePath();
    ctx.fillStyle = '#3ddc84';
    ctx.fill();

    ctx.restore();
  }

  /* ── Draw full circuit ─────────────────────────────────────────── */

  function drawCircuit(v) {
    var circuitCx = showPhasors ? CW * 0.28 : CW * 0.35;
    var circuitCy = CH * 0.42;

    if (config === 'star') {
      drawStarCircuit(circuitCx, circuitCy, v);
    } else {
      drawDeltaCircuit(circuitCx, circuitCy, v);
    }

    /* Draw animated current dots */
    drawCurrentDots(circuitCx, circuitCy, v);
  }

  /* ── Animated current dots ─────────────────────────────────────── */

  function drawCurrentDots(cx, cy, v) {
    var r = 100;
    var angles = [-Math.PI / 2, -Math.PI / 2 + 2 * Math.PI / 3, -Math.PI / 2 + 4 * Math.PI / 3];
    var colors = ['#ff5555', '#f5c842', '#42a5f5'];
    var t = animT * 0.003;

    for (var i = 0; i < 3; i++) {
      var numDots = 4;
      for (var d = 0; d < numDots; d++) {
        var frac = ((t + d / numDots + i * 0.33) % 1);
        var dx, dy;
        if (config === 'star') {
          dx = cx + r * frac * Math.cos(angles[i]);
          dy = cy + r * frac * Math.sin(angles[i]);
        } else {
          var p1x = cx + r * Math.cos(angles[i]);
          var p1y = cy + r * Math.sin(angles[i]);
          var p2x = cx + r * Math.cos(angles[(i + 1) % 3]);
          var p2y = cy + r * Math.sin(angles[(i + 1) % 3]);
          dx = p1x + (p2x - p1x) * frac;
          dy = p1y + (p2y - p1y) * frac;
        }
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#3ddc84';
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  /* ── Draw Phasor Diagram ───────────────────────────────────────── */

  function drawPhasors(v) {
    var px = CW * 0.72;
    var py = CH * 0.36;
    var phasorR = 80;
    var colors = ['#ff5555', '#f5c842', '#42a5f5'];
    var labels = ['V_R', 'V_Y', 'V_B'];
    var phaseAngles = [0, -2 * Math.PI / 3, -4 * Math.PI / 3];

    /* Title */
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Phasor Diagram', px, py - phasorR - 20);

    /* Reference circle (dashed) */
    ctx.beginPath();
    ctx.arc(px, py, phasorR, 0, Math.PI * 2);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Center point */
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#6b7a99';
    ctx.fill();

    /* Animate phasors rotating */
    var rotAngle = animT * 0.002;

    for (var i = 0; i < 3; i++) {
      var a = phaseAngles[i] + rotAngle;
      var ex = px + phasorR * Math.cos(a);
      var ey = py - phasorR * Math.sin(a);

      /* Phasor line */
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2.5;
      ctx.stroke();

      /* Arrow head */
      var headLen = 10;
      var headAngle = Math.atan2(py - ey, ex - px);
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(headAngle - Math.PI / 6), ey + headLen * Math.sin(headAngle - Math.PI / 6));
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - headLen * Math.cos(headAngle + Math.PI / 6), ey + headLen * Math.sin(headAngle + Math.PI / 6));
      ctx.strokeStyle = colors[i];
      ctx.lineWidth = 2;
      ctx.stroke();

      /* Label */
      var lx = px + (phasorR + 18) * Math.cos(a);
      var ly = py - (phasorR + 18) * Math.sin(a);
      ctx.fillStyle = colors[i];
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }

    /* Comparison bar chart below phasor */
    var barY = py + phasorR + 30;
    var barW = 35;
    var barGap = 12;
    var barMaxH = 60;
    var maxVal = Math.max(v.Vph, VL);

    /* V_ph bar */
    var vphH = (v.Vph / maxVal) * barMaxH;
    ctx.fillStyle = '#ff5555' + '66';
    ctx.fillRect(px - barW - barGap / 2, barY + barMaxH - vphH, barW, vphH);
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - barW - barGap / 2, barY + barMaxH - vphH, barW, vphH);
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fmt(v.Vph, 0) + 'V', px - barW / 2 - barGap / 2, barY + barMaxH - vphH - 8);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px sans-serif';
    ctx.fillText('V_ph', px - barW / 2 - barGap / 2, barY + barMaxH + 14);

    /* V_L bar */
    var vlH = (VL / maxVal) * barMaxH;
    ctx.fillStyle = '#f5c842' + '66';
    ctx.fillRect(px + barGap / 2, barY + barMaxH - vlH, barW, vlH);
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + barGap / 2, barY + barMaxH - vlH, barW, vlH);
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(fmt(VL, 0) + 'V', px + barW / 2 + barGap / 2, barY + barMaxH - vlH - 8);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px sans-serif';
    ctx.fillText('V_L', px + barW / 2 + barGap / 2, barY + barMaxH + 14);
  }

  /* ── Draw Equations overlay ────────────────────────────────────── */

  function drawEquations(v) {
    var ex = CW * 0.72;
    var ey = CH - 55;

    ctx.fillStyle = '#1f2535';
    ctx.fillRect(ex - 120, ey - 18, 240, 50);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(ex - 120, ey - 18, 240, 50);

    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';

    if (config === 'star') {
      ctx.fillText('V_ph = V_L / \u221a3 = ' + fmt(v.Vph, 1) + ' V', ex, ey);
      ctx.fillText('I_L = I_ph = ' + fmt(v.IL, 2) + ' A', ex, ey + 16);
    } else {
      ctx.fillText('V_ph = V_L = ' + fmt(v.Vph, 1) + ' V', ex, ey);
      ctx.fillText('I_L = \u221a3 \u00d7 I_ph = ' + fmt(v.IL, 2) + ' A', ex, ey + 16);
    }
  }

  /* ── Draw Explore Canvas ───────────────────────────────────────── */

  function drawExploreCanvas() {
    ctx.fillStyle = '#6b7a99';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (!exploreConcept) {
      /* Draw both configurations side by side as overview */
      drawStarDeltaOverview();
      return;
    }

    /* Draw concept-specific diagram */
    var c = exploreConcept;
    if (c.diagram === 'starConnection') drawStarDiagram();
    else if (c.diagram === 'deltaConnection') drawDeltaDiagram();
    else if (c.diagram === 'threePhasePower') drawPowerTriangle();
    else if (c.diagram === 'yDeltaTransform') drawTransformDiagram();
    else if (c.diagram === 'balancedUnbalanced') drawBalancedDiagram();
    else if (c.diagram === 'powerFactor') drawPFDiagram();
    else drawStarDeltaOverview();
  }

  function drawStarDeltaOverview() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Star-Delta (Y-\u0394) Conversion', CW / 2, 35);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '13px sans-serif';
    ctx.fillText('Select a concept below to explore', CW / 2, 58);

    /* Draw both configurations */
    var leftCx = CW * 0.28, rightCx = CW * 0.72, cy = CH * 0.52;
    var dummyV = { Vph: 231, Iph: 2.31, IL: 2.31 };
    drawStarCircuit(leftCx, cy, dummyV);
    var dummyVd = { Vph: 400, Iph: 1.33, IL: 2.31 };
    drawDeltaCircuit(rightCx, cy, dummyVd);

    /* Double arrow between them */
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CW * 0.42, cy);
    ctx.lineTo(CW * 0.58, cy);
    ctx.stroke();
    /* Arrow heads */
    ctx.beginPath();
    ctx.moveTo(CW * 0.42, cy);
    ctx.lineTo(CW * 0.42 + 10, cy - 6);
    ctx.moveTo(CW * 0.42, cy);
    ctx.lineTo(CW * 0.42 + 10, cy + 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CW * 0.58, cy);
    ctx.lineTo(CW * 0.58 - 10, cy - 6);
    ctx.moveTo(CW * 0.58, cy);
    ctx.lineTo(CW * 0.58 - 10, cy + 6);
    ctx.stroke();

    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Z_\u0394 = 3 \u00d7 Z_Y', CW / 2, cy - 18);
  }

  function drawStarDiagram() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Star (Y) Connection', CW / 2, 35);

    var v = { Vph: 230, Iph: 2.3, IL: 2.3 };
    drawStarCircuit(CW / 2, CH * 0.42, v);

    ctx.fillStyle = '#dde3f0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('V_L = \u221a3 \u00d7 V_ph    |    I_L = I_ph', CW / 2, CH - 30);
  }

  function drawDeltaDiagram() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Delta (\u0394) Connection', CW / 2, 35);

    var v = { Vph: 400, Iph: 4, IL: 6.93 };
    drawDeltaCircuit(CW / 2, CH * 0.42, v);

    ctx.fillStyle = '#dde3f0';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('V_L = V_ph    |    I_L = \u221a3 \u00d7 I_ph', CW / 2, CH - 30);
  }

  function drawPowerTriangle() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('3-Phase Power', CW / 2, 35);

    var ox = CW * 0.35, oy = CH * 0.6;
    var pw = 220, ph = 120;

    /* Power triangle */
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox + pw, oy);
    ctx.lineTo(ox + pw, oy - ph);
    ctx.closePath();
    ctx.strokeStyle = '#dde3f0';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Labels */
    ctx.fillStyle = '#3ddc84';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P (Active)', ox + pw / 2, oy + 22);

    ctx.fillStyle = '#42a5f5';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Q (Reactive)', ox + pw + 10, oy - ph / 2);

    ctx.fillStyle = '#f5c842';
    ctx.save();
    ctx.translate(ox + pw / 2 - 30, oy - ph / 2 - 10);
    ctx.rotate(-Math.atan2(ph, pw));
    ctx.fillText('S (Apparent)', 0, 0);
    ctx.restore();

    /* Angle arc */
    ctx.beginPath();
    ctx.arc(ox, oy, 35, -Math.atan2(ph, pw), 0);
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ab47bc';
    ctx.font = '12px sans-serif';
    ctx.fillText('\u03c6', ox + 42, oy - 8);

    /* Formula */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P = \u221a3 \u00d7 V_L \u00d7 I_L \u00d7 cos(\u03c6)', CW / 2, CH - 30);
  }

  function drawTransformDiagram() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Y-\u0394 Impedance Transformation', CW / 2, 35);

    /* Star side */
    var ly = CH * 0.42;
    var v1 = { Vph: 231, Iph: 2.31, IL: 2.31 };
    drawStarCircuit(CW * 0.25, ly, v1);

    /* Arrow */
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CW * 0.42, ly);
    ctx.lineTo(CW * 0.56, ly);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CW * 0.56, ly);
    ctx.lineTo(CW * 0.56 - 12, ly - 7);
    ctx.moveTo(CW * 0.56, ly);
    ctx.lineTo(CW * 0.56 - 12, ly + 7);
    ctx.stroke();

    /* Delta side */
    var v2 = { Vph: 400, Iph: 1.33, IL: 2.31 };
    drawDeltaCircuit(CW * 0.75, ly, v2);

    /* Formula */
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Z_\u0394 = 3 \u00d7 Z_Y', CW / 2, ly - 5);
    ctx.fillStyle = '#dde3f0';
    ctx.font = '13px monospace';
    ctx.fillText('Z_Y = Z_\u0394 / 3', CW / 2, ly + 15);
  }

  function drawBalancedDiagram() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Balanced vs Unbalanced Loads', CW / 2, 35);

    /* Balanced star */
    ctx.fillStyle = '#3ddc84';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Balanced', CW * 0.25, 65);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '12px sans-serif';
    ctx.fillText('Z_A = Z_B = Z_C', CW * 0.25, 85);
    ctx.fillText('I_N = 0', CW * 0.25, 102);

    var v1 = { Vph: 231, Iph: 2.31, IL: 2.31 };
    drawStarCircuit(CW * 0.25, CH * 0.52, v1);

    /* Unbalanced star */
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Unbalanced', CW * 0.75, 65);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '12px sans-serif';
    ctx.fillText('Z_A \u2260 Z_B \u2260 Z_C', CW * 0.75, 85);
    ctx.fillText('I_N \u2260 0', CW * 0.75, 102);

    var v2 = { Vph: 231, Iph: 3.85, IL: 3.85 };
    drawStarCircuit(CW * 0.75, CH * 0.52, v2);
  }

  function drawPFDiagram() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Power Factor', CW / 2, 35);

    var cx = CW / 2, cy = CH * 0.45;
    var rad = 120;

    /* Semicircle */
    ctx.beginPath();
    ctx.arc(cx, cy, rad, -Math.PI, 0);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* pf = 1 line */
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + rad, cy);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('pf = 1.0 (resistive)', cx + rad + 8, cy + 4);

    /* pf = 0.8 line */
    var angle08 = Math.acos(0.8);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + rad * Math.cos(angle08), cy - rad * Math.sin(angle08));
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('pf = 0.8 (inductive)', cx + rad * Math.cos(angle08) + 8, cy - rad * Math.sin(angle08));

    /* pf = 0.5 line */
    var angle05 = Math.acos(0.5);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + rad * Math.cos(angle05), cy - rad * Math.sin(angle05));
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('pf = 0.5', cx + rad * Math.cos(angle05) + 8, cy - rad * Math.sin(angle05));

    /* Arc label */
    ctx.beginPath();
    ctx.arc(cx, cy, 40, -angle08, 0);
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ab47bc';
    ctx.font = '12px sans-serif';
    ctx.fillText('\u03c6', cx + 46, cy - 12);

    /* Formula */
    ctx.fillStyle = '#dde3f0';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('pf = cos(\u03c6) = P / S', CW / 2, CH - 30);
  }

  /* ── Draw Practice Canvas ──────────────────────────────────────── */

  function drawPracticeCanvas() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Practice Mode', CW / 2, 40);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '14px sans-serif';
    ctx.fillText('Solve star-delta conversion problems', CW / 2, 65);

    /* Score display */
    ctx.fillStyle = '#1f2535';
    ctx.fillRect(CW / 2 - 80, 85, 160, 45);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(CW / 2 - 80, 85, 160, 45);

    ctx.fillStyle = '#3ddc84';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(practScore + ' / ' + practTotal, CW / 2, 115);

    /* Draw both configs as reference */
    drawStarDeltaOverview();
  }

  /* ── Draw Quiz Canvas ──────────────────────────────────────────── */

  function drawQuizCanvas() {
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Quiz Mode', CW / 2, 40);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '14px sans-serif';
    ctx.fillText('Test your knowledge of star-delta conversion', CW / 2, 65);

    /* Progress */
    if (quizQuestions.length > 0) {
      var progress = (quizIdx + 1) + ' / ' + QUIZ_SIZE;
      ctx.fillStyle = '#1f2535';
      ctx.fillRect(CW / 2 - 60, 80, 120, 35);
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 1;
      ctx.strokeRect(CW / 2 - 60, 80, 120, 35);
      ctx.fillStyle = '#ab47bc';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(progress, CW / 2, 104);
    }

    /* Draw overview */
    drawStarDeltaOverview();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate() {
    animT += 16;
    draw();
    animId = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (!animId) animate();
  }

  function stopAnim() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function setMode(m) {
    mode = m;

    /* Update pill tabs */
    var pills = modeTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) {
      pills[i].classList.toggle('active', pills[i].getAttribute('data-mode') === m);
    }

    /* Show/hide panels */
    simPanel.style.display    = m === 'simulate' ? '' : 'none';
    canvasCard.style.display  = '';
    catRow.style.display      = m === 'explore' ? '' : 'none';
    itemSel.style.display     = m === 'explore' ? '' : 'none';
    itemInfo.style.display    = m === 'explore' && exploreConcept ? '' : 'none';
    practPanel.style.display  = m === 'practice' ? '' : 'none';
    practBar.style.display    = m === 'practice' ? '' : 'none';
    quizPanel.style.display   = m === 'quiz' ? '' : 'none';
    quizBar.style.display     = m === 'quiz' ? '' : 'none';
    quizResult.style.display  = 'none';

    if (m === 'simulate') {
      startAnim();
    } else {
      stopAnim();
      draw();
    }

    if (m === 'explore') buildExploreUI();
    if (m === 'practice') { if (!practCurrent) newPractice(); }
    if (m === 'quiz') { if (quizQuestions.length === 0) startQuiz(); }
  }

  modeTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (pill && pill.dataset.mode) setMode(pill.dataset.mode);
  });

  /* ================================================================
     SIMULATE CONTROLS
     ================================================================ */

  configTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.config) return;
    config = pill.dataset.config;
    var pills = configTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.toggle('active', pills[i].dataset.config === config);
    updateReadouts();
  });

  freqTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.freq) return;
    freq = parseInt(pill.dataset.freq);
    var pills = freqTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.toggle('active', pills[i].dataset.freq === String(freq));
  });

  zSlider.addEventListener('input', function () {
    Z = parseFloat(zSlider.value);
    zVal.textContent = Z + ' \u03a9';
    updateReadouts();
  });

  vlSlider.addEventListener('input', function () {
    VL = parseFloat(vlSlider.value);
    vlVal.textContent = VL + ' V';
    updateReadouts();
  });

  chkEq.addEventListener('change', function () {
    showEq = chkEq.checked;
    chkEq.parentElement.classList.toggle('checked', showEq);
  });

  chkPhasors.addEventListener('change', function () {
    showPhasors = chkPhasors.checked;
    chkPhasors.parentElement.classList.toggle('checked', showPhasors);
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  function buildExploreUI() {
    /* Category tabs */
    var catPills = document.getElementById('cat-tabs').querySelectorAll('.pill');
    for (var i = 0; i < catPills.length; i++) {
      catPills[i].classList.toggle('active', catPills[i].dataset.cat === exploreCat);
    }

    /* Build concept grid */
    var grid = document.getElementById('concept-grid');
    grid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    for (var j = 0; j < filtered.length; j++) {
      var c = filtered[j];
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (exploreConcept && exploreConcept.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.dataset.conceptId = c.id;
      grid.appendChild(btn);
    }

    if (exploreConcept) showConceptInfo(exploreConcept);
  }

  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.cat) return;
    exploreCat = pill.dataset.cat;
    exploreConcept = null;
    itemInfo.style.display = 'none';
    buildExploreUI();
    draw();
  });

  document.getElementById('concept-grid').addEventListener('click', function (e) {
    var btn = e.target.closest('.is-btn');
    if (!btn) return;
    var id = btn.dataset.conceptId;
    for (var i = 0; i < CONCEPTS.length; i++) {
      if (CONCEPTS[i].id === id) { exploreConcept = CONCEPTS[i]; break; }
    }
    buildExploreUI();
    draw();
  });

  function showConceptInfo(c) {
    itemInfo.style.display = '';
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span>' +
      '<span class="ii-cat-badge">' + c.cat + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>' +
      '<span class="fb-unit">' + c.unit + '</span></div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>' +
        '<p class="ex-problem">' + c.example.problem + '</p>';
      for (var i = 0; i < c.example.steps.length; i++) {
        html += '<div class="ex-step"><strong>' + c.example.steps[i] + '</strong></div>';
      }
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function newPractice() {
    var idx = randInt(0, PROBLEM_GEN.length - 1);
    practCurrent = PROBLEM_GEN[idx]();
    practAnswered = false;

    ppPrompt.textContent = practCurrent.prompt;
    ppUnit.textContent = practCurrent.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppInput.focus();
    draw();
  }

  ppCheck.addEventListener('click', function () {
    if (practAnswered) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Please enter a number.'; ppFeedback.className = 'feedback err'; return; }

    practAnswered = true;
    practTotal++;
    var tol = practCurrent.tol || 0.5;
    var diff = Math.abs(val - practCurrent.answer);
    var ok = diff <= tol || diff <= Math.abs(practCurrent.answer) * 0.02;

    if (ok) {
      practScore++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + practCurrent.answer + ' ' + practCurrent.unit;
      ppFeedback.className = 'feedback err';
    }

    pbarScoreVal.textContent = practScore + ' / ' + practTotal;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';

    /* Show solution steps */
    ppSolution.style.display = '';
    var solHtml = '<h4>Solution</h4>';
    for (var i = 0; i < practCurrent.steps.length; i++) {
      solHtml += '<div class="sol-step"><strong>' + practCurrent.steps[i] + '</strong></div>';
    }
    ppSolution.innerHTML = solHtml;
  });

  ppNext.addEventListener('click', function () { newPractice(); });

  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!practAnswered) ppCheck.click();
      else ppNext.click();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function startQuiz() {
    /* Pick QUIZ_SIZE random questions */
    var pool = QUIZ_BANK.slice();
    shuffleArray(pool);
    quizQuestions = pool.slice(0, QUIZ_SIZE);

    /* Shuffle choices for each question */
    for (var i = 0; i < quizQuestions.length; i++) {
      var q = quizQuestions[i];
      var correctText = q.choices[q.correct];
      var shuffled = q.choices.slice();
      shuffleArray(shuffled);
      q.shuffledChoices = shuffled;
      q.shuffledCorrect = shuffled.indexOf(correctText);
    }

    quizIdx = 0;
    quizAnswers = [];
    quizLocked = false;
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    showQuizQuestion();
    draw();
  }

  function showQuizQuestion() {
    if (quizIdx >= quizQuestions.length) { showQuizResult(); return; }

    var q = quizQuestions[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizLocked = false;

    var html = '<p class="qp-prompt">' + q.q + '</p><div class="answer-grid">';
    for (var i = 0; i < q.shuffledChoices.length; i++) {
      html += '<button class="answer-btn" data-idx="' + i + '">' + q.shuffledChoices[i] + '</button>';
    }
    html += '</div>';
    quizPanel.innerHTML = html;
  }

  quizPanel.addEventListener('click', function (e) {
    var btn = e.target.closest('.answer-btn');
    if (!btn || quizLocked) return;
    quizLocked = true;

    var picked = parseInt(btn.dataset.idx);
    var q = quizQuestions[quizIdx];
    var correct = q.shuffledCorrect;

    /* Mark buttons */
    var btns = quizPanel.querySelectorAll('.answer-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.add('locked');
      if (parseInt(btns[i].dataset.idx) === correct) btns[i].classList.add('correct');
      if (parseInt(btns[i].dataset.idx) === picked && picked !== correct) btns[i].classList.add('wrong');
    }

    quizAnswers.push({ picked: picked, correct: correct, ok: picked === correct });

    /* Move to next after delay */
    setTimeout(function () {
      quizIdx++;
      if (quizIdx >= quizQuestions.length) {
        showQuizResult();
      } else {
        showQuizQuestion();
      }
    }, 1200);
  });

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var score = 0;
    for (var i = 0; i < quizAnswers.length; i++) { if (quizAnswers[i].ok) score++; }
    var pct = Math.round(score / QUIZ_SIZE * 100);
    var stars = '';
    if (pct === 100) stars = '\u2b50\u2b50\u2b50\u2b50\u2b50';
    else if (pct >= 80) stars = '\u2b50\u2b50\u2b50\u2b50';
    else if (pct >= 60) stars = '\u2b50\u2b50\u2b50';
    else if (pct >= 40) stars = '\u2b50\u2b50';
    else stars = '\u2b50';

    var scoreClass = pct === 100 ? 'perfect' : (pct >= 60 ? 'good' : 'poor');
    var verdict = pct === 100 ? 'Perfect score!' : (pct >= 60 ? 'Good job!' : 'Keep practising!');

    var html = '<div class="qr-header"><div class="qr-title-wrap"><div class="qr-title">Quiz Complete</div>' +
      '<div class="qr-stars">' + stars + '</div></div>' +
      '<div class="qr-score-wrap"><div class="qr-score ' + scoreClass + '">' + pct + '%</div>' +
      '<div class="qr-verdict">' + verdict + '</div></div></div><div class="qr-rows">';

    for (var j = 0; j < quizAnswers.length; j++) {
      var a = quizAnswers[j];
      var q = quizQuestions[j];
      var rowClass = a.ok ? 'ok' : 'err';
      var mark = a.ok ? '\u2713' : '\u2717';
      html += '<div class="qr-row ' + rowClass + '">' +
        '<div class="qr-qnum">Q' + (j + 1) + '</div>' +
        '<div class="qr-detail"><strong>' + q.q + '</strong></div>' +
        '<div class="qr-mark">' + mark + '</div></div>';
    }

    html += '</div><button class="btn btn-primary" id="quiz-retry">Retry Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('quiz-retry').addEventListener('click', function () {
      quizQuestions = [];
      startQuiz();
    });
  }

  /* ================================================================
     INIT
     ================================================================ */

  updateReadouts();
  setMode('simulate');

})();
