(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }

  /* ================================================================
     DATA — CONCEPTS (12)
     ================================================================ */
  var CONCEPTS = [
    /* ── Basics ─────────────────────────────────────────────────── */
    {
      id: 'gear-ratio', name: 'Gear Ratio', symbol: 'GR = Nb/Na',
      formula: 'GR = N_B / N_A', unit: ':1',
      cat: 'basics',
      desc: 'The gear ratio is the ratio of the number of teeth on the driven gear (B) to the driver gear (A). It determines how speed and torque are exchanged. A ratio greater than 1 reduces speed but increases torque (speed reducer). A ratio less than 1 increases speed but reduces torque (speed multiplier).',
      diagram: 'gearRatio',
      example: { problem: 'A driver gear has 20 teeth and the driven gear has 60 teeth. Find the gear ratio.', steps: ['GR = N_B / N_A', 'GR = 60 / 20', 'GR = 3'], answer: 3, unit: ':1' }
    },
    {
      id: 'module', name: 'Module', symbol: 'm = d / N',
      formula: 'm = d / N', unit: 'mm',
      cat: 'basics',
      desc: 'The module (m) is the ratio of the pitch circle diameter (d) to the number of teeth (N). It is the fundamental parameter defining tooth size in the metric system. Two gears must have the same module to mesh correctly. Common modules range from 0.5 mm to 10 mm.',
      diagram: 'moduleDiag',
      example: { problem: 'A gear has 30 teeth and a pitch circle diameter of 90 mm. Find the module.', steps: ['m = d / N', 'm = 90 / 30', 'm = 3 mm'], answer: 3, unit: 'mm' }
    },
    {
      id: 'circular-pitch', name: 'Circular Pitch', symbol: 'p = pi * m',
      formula: 'p = \u03C0 \u00D7 m', unit: 'mm',
      cat: 'basics',
      desc: 'Circular pitch (p) is the distance measured along the pitch circle from one tooth to the corresponding point on the adjacent tooth. It equals pi times the module. All meshing gears must have the same circular pitch. It can also be calculated as p = \u03C0d / N.',
      diagram: 'circularPitch',
      example: { problem: 'A gear has module m = 4 mm. Find the circular pitch.', steps: ['p = \u03C0 \u00D7 m', 'p = 3.1416 \u00D7 4', 'p = 12.57 mm'], answer: 12.57, unit: 'mm' }
    },
    {
      id: 'diametral-pitch', name: 'Diametral Pitch', symbol: 'P = N / d',
      formula: 'P = N / d', unit: 'teeth/inch',
      cat: 'basics',
      desc: 'Diametral pitch (P) is the ratio of the number of teeth to the pitch circle diameter in inches. It is the Imperial counterpart of the metric module. A higher diametral pitch means smaller teeth. The relationship between module and diametral pitch is: m = 25.4 / P.',
      diagram: 'diametralPitch',
      example: { problem: 'A gear has 40 teeth and a pitch circle diameter of 5 inches. Find the diametral pitch.', steps: ['P = N / d', 'P = 40 / 5', 'P = 8 teeth/inch'], answer: 8, unit: 'teeth/inch' }
    },

    /* ── Types ──────────────────────────────────────────────────── */
    {
      id: 'spur-gears', name: 'Spur Gears', symbol: 'Spur',
      formula: 'Straight teeth, parallel axes', unit: '\u2014',
      cat: 'types',
      desc: 'Spur gears are the most common type of gear. They have straight teeth that run parallel to the shaft axis. They transmit motion between parallel shafts and are the simplest and most economical to manufacture. However, they can be noisy at high speeds due to sudden tooth engagement.',
      diagram: 'spurGears',
      example: { problem: 'Two spur gears mesh with N_A = 25 and N_B = 50. Input RPM = 1200. Find output RPM.', steps: ['GR = N_B / N_A = 50 / 25 = 2', 'RPM_out = RPM_in / GR', 'RPM_out = 1200 / 2', 'RPM_out = 600 rpm'], answer: 600, unit: 'rpm' }
    },
    {
      id: 'helical-gears', name: 'Helical Gears', symbol: 'Helical',
      formula: 'Angled teeth, smoother mesh', unit: '\u2014',
      cat: 'types',
      desc: 'Helical gears have teeth cut at an angle (helix angle) to the gear axis. This allows gradual tooth engagement, resulting in smoother and quieter operation than spur gears. They can transmit motion between parallel or non-parallel shafts. The downside is they generate axial thrust loads requiring thrust bearings.',
      diagram: 'helicalGears',
      example: { problem: 'A helical gear pair has N_A = 18, N_B = 36, input RPM = 900. Find output RPM.', steps: ['GR = N_B / N_A = 36 / 18 = 2', 'RPM_out = RPM_in / GR', 'RPM_out = 900 / 2', 'RPM_out = 450 rpm'], answer: 450, unit: 'rpm' }
    },
    {
      id: 'bevel-gears', name: 'Bevel Gears', symbol: 'Bevel',
      formula: 'Conical, intersecting axes', unit: '\u2014',
      cat: 'types',
      desc: 'Bevel gears have teeth on a conical surface and transmit motion between intersecting shafts, typically at 90 degrees. Straight bevel gears are the simplest form. Spiral bevel gears have curved teeth for smoother operation. They are widely used in automotive differentials and hand drills.',
      diagram: 'bevelGears',
      example: { problem: 'Bevel gears: N_A = 20, N_B = 40. Input torque = 10 Nm. Find output torque (100% efficiency).', steps: ['GR = N_B / N_A = 40 / 20 = 2', 'T_out = T_in \u00D7 GR', 'T_out = 10 \u00D7 2', 'T_out = 20 Nm'], answer: 20, unit: 'Nm' }
    },
    {
      id: 'worm-gears', name: 'Worm Gears', symbol: 'Worm',
      formula: 'GR = N_wheel / N_starts', unit: ':1',
      cat: 'types',
      desc: 'A worm gear set consists of a worm (screw) and a worm wheel (gear). The worm has one or more starts (threads). The gear ratio equals the number of wheel teeth divided by the number of worm starts. Very high ratios (20:1 to 100:1) are achievable in a single stage. Most worm drives are self-locking.',
      diagram: 'wormGears',
      example: { problem: 'A single-start worm meshes with a 40-tooth wheel. Input RPM = 1800. Find output RPM.', steps: ['GR = N_wheel / N_starts = 40 / 1 = 40', 'RPM_out = RPM_in / GR', 'RPM_out = 1800 / 40', 'RPM_out = 45 rpm'], answer: 45, unit: 'rpm' }
    },

    /* ── Applications ──────────────────────────────────────────── */
    {
      id: 'speed-reducers', name: 'Speed Reducers', symbol: 'GR > 1',
      formula: 'RPM_out = RPM_in / GR', unit: 'rpm',
      cat: 'applications',
      desc: 'Speed reducers (gear reducers) use a gear ratio greater than 1 to decrease output speed while proportionally increasing torque. They are essential in applications where motors run at high speed but the driven equipment requires low speed and high torque, such as conveyor belts, mixers, and winches.',
      diagram: 'speedReducer',
      example: { problem: 'A motor runs at 1800 RPM. A 4:1 gear reducer is used. Find the output RPM and torque if input torque is 5 Nm.', steps: ['RPM_out = 1800 / 4 = 450 rpm', 'T_out = T_in \u00D7 GR', 'T_out = 5 \u00D7 4', 'T_out = 20 Nm'], answer: 450, unit: 'rpm' }
    },
    {
      id: 'compound-trains', name: 'Compound Trains', symbol: 'GR = GR1 x GR2',
      formula: 'GR = (N_B/N_A) \u00D7 (N_D/N_C)', unit: ':1',
      cat: 'applications',
      desc: 'Compound gear trains have multiple stages where an intermediate shaft carries two gears of different sizes. The overall gear ratio is the product of individual stage ratios. This allows very large or very small ratios in a compact package. Clock mechanisms and automotive gearboxes use compound trains extensively.',
      diagram: 'compoundTrain',
      example: { problem: 'Compound train: N_A=12, N_B=48, N_C=10, N_D=40. Input RPM=720. Find output RPM.', steps: ['GR1 = N_B/N_A = 48/12 = 4', 'GR2 = N_D/N_C = 40/10 = 4', 'GR_total = 4 \u00D7 4 = 16', 'RPM_out = 720 / 16 = 45 rpm'], answer: 45, unit: 'rpm' }
    },
    {
      id: 'planetary-gears', name: 'Planetary Gears', symbol: 'Epicyclic',
      formula: 'GR = 1 + N_ring / N_sun', unit: ':1',
      cat: 'applications',
      desc: 'Planetary (epicyclic) gear systems have a central sun gear, planet gears on a carrier, and an outer ring (annulus) gear. They provide high gear ratios in a compact, coaxial arrangement. The ratio depends on which component is fixed. They are used in automatic transmissions, turbine engines, and electric screwdrivers.',
      diagram: 'planetaryGears',
      example: { problem: 'A planetary set has N_sun = 20, N_ring = 60. Ring is fixed. Find gear ratio (sun to carrier).', steps: ['GR = 1 + N_ring / N_sun', 'GR = 1 + 60/20', 'GR = 1 + 3', 'GR = 4:1'], answer: 4, unit: ':1' }
    },
    {
      id: 'rack-pinion', name: 'Rack & Pinion', symbol: 'Linear',
      formula: 'Travel = \u03C0 \u00D7 m \u00D7 N \u00D7 rev', unit: 'mm',
      cat: 'applications',
      desc: 'A rack and pinion converts rotational motion to linear motion (or vice versa). The rack is a flat bar with teeth and the pinion is a small gear. One full revolution of the pinion moves the rack by a distance equal to the pitch circle circumference (\u03C0 \u00D7 d). This mechanism is used in steering systems, CNC machines, and sliding gates.',
      diagram: 'rackPinion',
      example: { problem: 'A pinion has 20 teeth with module 3 mm. How far does the rack travel in one revolution?', steps: ['d = m \u00D7 N = 3 \u00D7 20 = 60 mm', 'Travel per rev = \u03C0 \u00D7 d', 'Travel = 3.1416 \u00D7 60', 'Travel = 188.5 mm'], answer: 188.5, unit: 'mm' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0 — Gear ratio from teeth */
    function () {
      var na = randInt(10, 50); var nb = randInt(15, 60);
      var gr = roundN(nb / na, 2);
      return { prompt: 'A driver gear has ' + na + ' teeth and the driven gear has ' + nb + ' teeth. Calculate the gear ratio (N_B / N_A).', answer: gr, unit: ':1',
        steps: ['GR = N_B / N_A', 'GR = ' + nb + ' / ' + na, 'GR = ' + gr] };
    },
    /* 1 — Output RPM */
    function () {
      var na = randInt(10, 40); var nb = randInt(20, 60);
      var rpm = randInt(3, 30) * 100;
      var gr = nb / na; var out = roundN(rpm / gr, 1);
      return { prompt: 'N_A = ' + na + ', N_B = ' + nb + ', Input RPM = ' + rpm + '. Find the output RPM.', answer: out, unit: 'rpm',
        steps: ['GR = N_B/N_A = ' + nb + '/' + na + ' = ' + roundN(gr, 3), 'RPM_out = RPM_in / GR', 'RPM_out = ' + rpm + ' / ' + roundN(gr, 3), 'RPM_out = ' + out + ' rpm'] };
    },
    /* 2 — Input torque (from power and RPM) */
    function () {
      var rpm = randInt(5, 30) * 100;
      var power = randInt(1, 20) * 0.5; // kW
      var torque = roundN((power * 1000) / (2 * Math.PI * rpm / 60), 2);
      return { prompt: 'A motor delivers ' + power + ' kW at ' + rpm + ' RPM. Calculate the input torque in Nm. (T = P / omega, omega = 2*pi*n/60)', answer: torque, unit: 'Nm',
        steps: ['omega = 2\u03C0 \u00D7 ' + rpm + ' / 60 = ' + roundN(2 * Math.PI * rpm / 60, 2) + ' rad/s', 'T = P / omega', 'T = ' + (power * 1000) + ' / ' + roundN(2 * Math.PI * rpm / 60, 2), 'T = ' + torque + ' Nm'] };
    },
    /* 3 — Output torque */
    function () {
      var na = randInt(10, 30); var nb = randInt(30, 60);
      var tin = randInt(2, 20);
      var gr = nb / na; var tout = roundN(tin * gr, 2);
      return { prompt: 'N_A = ' + na + ', N_B = ' + nb + '. Input torque = ' + tin + ' Nm. Find the output torque (100% efficiency).', answer: tout, unit: 'Nm',
        steps: ['GR = N_B/N_A = ' + nb + '/' + na + ' = ' + roundN(gr, 3), 'T_out = T_in \u00D7 GR', 'T_out = ' + tin + ' \u00D7 ' + roundN(gr, 3), 'T_out = ' + tout + ' Nm'] };
    },
    /* 4 — Module from teeth & diameter */
    function () {
      var m = randInt(1, 8); var n = randInt(12, 50);
      var d = m * n;
      return { prompt: 'A gear has ' + n + ' teeth and a pitch circle diameter of ' + d + ' mm. Find the module.', answer: m, unit: 'mm',
        steps: ['m = d / N', 'm = ' + d + ' / ' + n, 'm = ' + m + ' mm'] };
    },
    /* 5 — Circular pitch */
    function () {
      var m = randInt(1, 8);
      var p = roundN(Math.PI * m, 2);
      return { prompt: 'A gear has module m = ' + m + ' mm. Calculate the circular pitch.', answer: p, unit: 'mm',
        steps: ['p = \u03C0 \u00D7 m', 'p = 3.1416 \u00D7 ' + m, 'p = ' + p + ' mm'] };
    },
    /* 6 — Compound gear ratio */
    function () {
      var na = randInt(10, 25); var nb = randInt(30, 50);
      var nc = randInt(10, 20); var nd = randInt(30, 50);
      var gr = roundN((nb / na) * (nd / nc), 2);
      return { prompt: 'Compound train: N_A=' + na + ', N_B=' + nb + ', N_C=' + nc + ', N_D=' + nd + '. Find overall gear ratio.', answer: gr, unit: ':1',
        steps: ['GR1 = N_B/N_A = ' + nb + '/' + na + ' = ' + roundN(nb / na, 3), 'GR2 = N_D/N_C = ' + nd + '/' + nc + ' = ' + roundN(nd / nc, 3), 'GR = GR1 \u00D7 GR2 = ' + roundN(nb / na, 3) + ' \u00D7 ' + roundN(nd / nc, 3), 'GR = ' + gr] };
    },
    /* 7 — Worm gear ratio */
    function () {
      var starts = randInt(1, 4);
      var nw = randInt(20, 60);
      var gr = roundN(nw / starts, 2);
      return { prompt: 'A worm with ' + starts + ' start(s) meshes with a ' + nw + '-tooth worm wheel. Find the gear ratio.', answer: gr, unit: ':1',
        steps: ['GR = N_wheel / N_starts', 'GR = ' + nw + ' / ' + starts, 'GR = ' + gr] };
    },
    /* 8 — Pitch circle diameter */
    function () {
      var m = randInt(2, 6); var n = randInt(15, 50);
      var d = m * n;
      return { prompt: 'A gear has module m = ' + m + ' mm and ' + n + ' teeth. Find the pitch circle diameter.', answer: d, unit: 'mm',
        steps: ['d = m \u00D7 N', 'd = ' + m + ' \u00D7 ' + n, 'd = ' + d + ' mm'] };
    },
    /* 9 — Centre distance */
    function () {
      var m = randInt(2, 5); var na = randInt(15, 35); var nb = randInt(25, 55);
      var da = m * na; var db = m * nb;
      var cd = roundN((da + db) / 2, 1);
      return { prompt: 'Two spur gears have module ' + m + ' mm, N_A = ' + na + ', N_B = ' + nb + '. Find the centre distance.', answer: cd, unit: 'mm',
        steps: ['d_A = m \u00D7 N_A = ' + m + ' \u00D7 ' + na + ' = ' + da + ' mm', 'd_B = m \u00D7 N_B = ' + m + ' \u00D7 ' + nb + ' = ' + db + ' mm', 'Centre dist = (d_A + d_B) / 2', 'Centre dist = (' + da + ' + ' + db + ') / 2 = ' + cd + ' mm'] };
    },
    /* 10 — Speed of driven gear */
    function () {
      var na = randInt(12, 40); var nb = randInt(20, 60);
      var rpma = randInt(5, 30) * 100;
      var rpmb = roundN(rpma * na / nb, 1);
      return { prompt: 'Driver gear: ' + na + ' teeth at ' + rpma + ' RPM. Driven gear: ' + nb + ' teeth. Find the driven RPM.', answer: rpmb, unit: 'rpm',
        steps: ['N_A \u00D7 RPM_A = N_B \u00D7 RPM_B', rpma + ' \u00D7 ' + na + ' = ' + nb + ' \u00D7 RPM_B', 'RPM_B = ' + (rpma * na) + ' / ' + nb, 'RPM_B = ' + rpmb + ' rpm'] };
    },
    /* 11 — Torque relationship */
    function () {
      var na = randInt(12, 30); var nb = randInt(30, 60);
      var tout = randInt(10, 100);
      var gr = nb / na;
      var tin = roundN(tout / gr, 2);
      return { prompt: 'N_A = ' + na + ', N_B = ' + nb + '. Output torque = ' + tout + ' Nm. Find input torque (100% efficiency).', answer: tin, unit: 'Nm',
        steps: ['GR = N_B/N_A = ' + nb + '/' + na + ' = ' + roundN(gr, 3), 'T_in = T_out / GR', 'T_in = ' + tout + ' / ' + roundN(gr, 3), 'T_in = ' + tin + ' Nm'] };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15)
     ================================================================ */
  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'What does the gear ratio determine in a gear train?', options: ['The speed and torque exchange between shafts', 'The material strength of the gears', 'The lubrication requirements', 'The noise level of the gearbox'], correct: 0 },
    { type: 'mcq', prompt: 'Two gears must have the same ___ to mesh correctly.', options: ['Module', 'Number of teeth', 'Shaft diameter', 'Rotational speed'], correct: 0 },
    { type: 'mcq', prompt: 'Which gear type is best for very high ratios (40:1+) in a single stage?', options: ['Worm gear', 'Spur gear', 'Helical gear', 'Bevel gear'], correct: 0 },
    { type: 'mcq', prompt: 'In a speed reducer with GR = 5:1, how does the output torque compare to input?', options: ['5 times greater', '5 times smaller', 'Same', 'Depends on module'], correct: 0 },
    { type: 'mcq', prompt: 'What is the circular pitch if the module is 5 mm?', options: ['15.71 mm', '10.00 mm', '5.00 mm', '25.00 mm'], correct: 0 },
    { type: 'mcq', prompt: 'Spur gears transmit motion between which type of shafts?', options: ['Parallel shafts', 'Intersecting shafts', 'Non-parallel non-intersecting', 'Any orientation'], correct: 0 },
    { type: 'mcq', prompt: 'In a compound gear train, the overall ratio is calculated by:', options: ['Multiplying individual stage ratios', 'Adding individual stage ratios', 'Taking the average', 'Using only the last stage ratio'], correct: 0 },
    { type: 'mcq', prompt: 'Bevel gears are primarily used for:', options: ['Intersecting shafts at an angle', 'Parallel shafts only', 'Converting rotary to linear motion', 'Self-locking applications'], correct: 0 },
    { type: 'mcq', prompt: 'The formula for pitch circle diameter is:', options: ['d = m \u00D7 N', 'd = N / m', 'd = m / N', 'd = 2\u03C0m'], correct: 0 },
    { type: 'mcq', prompt: 'A rack and pinion converts:', options: ['Rotary motion to linear motion', 'Linear motion to oscillating motion', 'High speed to low speed only', 'Torque to pressure'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'N_A = 15, N_B = 45. Find the gear ratio.', answer: 3, unit: ':1' },
    { type: 'numeric', prompt: 'A gear has 24 teeth and module 4 mm. Find the pitch circle diameter in mm.', answer: 96, unit: 'mm' },
    { type: 'numeric', prompt: 'Input RPM = 1200, gear ratio = 3:1. Find the output RPM.', answer: 400, unit: 'rpm' },
    { type: 'numeric', prompt: 'Input torque = 8 Nm, gear ratio = 5:1. Find output torque in Nm (100% efficiency).', answer: 40, unit: 'Nm' },
    { type: 'numeric', prompt: 'Compound train: N_A=10, N_B=40, N_C=10, N_D=50. Find overall gear ratio.', answer: 20, unit: ':1' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */
  var cvs = $('#sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 480;
  /* High-DPI: draw to a bitmap sized at devicePixelRatio × CSS size, then scale the
     context so all subsequent draw calls stay in the same 900×480 logical grid.
     The CSS keeps width:100% / height:auto, so strokes and text stay razor-sharp. */
  var DPR = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  cvs.width = W * DPR;
  cvs.height = H * DPR;
  cvs.style.maxWidth = W + 'px';
  cvs.style.aspectRatio = W + ' / ' + H;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var trainType = 'simple';
  var teethA = 20, teethB = 40, teethC = 15, teethD = 45;
  var teethIdler = 25;
  var wormStarts = 1; // explicit worm starts (1-4)
  var inputRPM = 600;
  var gearModule = 3;
  var inputPower = 2000; // W (2 kW default)
  var wormEff = 0.70;    // 70% default efficiency
  var speedScale = 0.1;
  var angle = 0;
  var running = true;
  var animFrame = null;
  var showPitch = true, showDims = true, showArrows = true, showLabels = true, showGrid = true;
  var unitSys = 'si'; // 'si' | 'imp'

  /* ================================================================
     UNIT CONVERSION (display-only; internal state always SI)
     ================================================================ */
  var MM_PER_IN = 25.4;
  var NM_PER_LBFT = 1.35582;
  function fmtLen(mm) {
    if (unitSys === 'imp') return roundN(mm / MM_PER_IN, 3) + ' in';
    return roundN(mm, 2) + ' mm';
  }
  function fmtTorque(nm) {
    if (unitSys === 'imp') return roundN(nm / NM_PER_LBFT, 2) + ' lbf·ft';
    return roundN(nm, 2) + ' Nm';
  }
  function fmtLenValOnly(mm) {
    if (unitSys === 'imp') return roundN(mm / MM_PER_IN, 3);
    return roundN(mm, 2);
  }
  function unitLen() { return unitSys === 'imp' ? 'in' : 'mm'; }
  function unitTorque() { return unitSys === 'imp' ? 'lbf·ft' : 'Nm'; }

  /* Explore state */
  var selCat = 'basics';
  var selConcept = 0;

  /* Practice state */
  var pProblem = null, pAnswered = false, pScore = 0, pTotal = 0;

  /* Quiz state */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* ================================================================
     PHYSICS
     ================================================================ */
  function gearRatio() {
    if (trainType === 'simple') return teethB / teethA;
    if (trainType === 'idler') return teethB / teethA; // idler doesn't change magnitude
    if (trainType === 'compound') return (teethB / teethA) * (teethD / teethC);
    if (trainType === 'worm') return teethB / Math.max(1, wormStarts);
    return 1;
  }

  function outputRPM() { return inputRPM / gearRatio(); }

  function inputTorque() {
    var omega = (2 * Math.PI * inputRPM) / 60;
    return omega > 0 ? inputPower / omega : 0;
  }

  function outputTorque() {
    var eff = (trainType === 'worm') ? wormEff : 0.97; // spur/compound realistic 97%
    return inputTorque() * gearRatio() * eff;
  }

  /* Undercut / warning detection */
  function warnings() {
    var w = [];
    var gears = [{ n: teethA, name: 'A' }, { n: teethB, name: 'B' }];
    if (trainType === 'compound') { gears.push({ n: teethC, name: 'C' }); gears.push({ n: teethD, name: 'D' }); }
    if (trainType === 'idler') gears.push({ n: teethIdler, name: 'Idler' });
    if (trainType !== 'worm') {
      gears.forEach(function (g) {
        if (g.n < 17) w.push({ text: 'Undercut risk on gear ' + g.name + ' (' + g.n + 'T < 17)', kind: 'warn' });
      });
    }
    if (trainType === 'worm' && wormStarts >= 3) {
      w.push({ text: 'May not be self-locking (' + wormStarts + ' starts)', kind: 'warn' });
    }
    return w;
  }

  function pitchCircleD(teeth) {
    return teeth * gearModule;
  }

  function centerDistance() {
    if (trainType === 'worm') return (pitchCircleD(teethB) + 20) / 2; // approximate for worm
    return (pitchCircleD(teethA) + pitchCircleD(teethB)) / 2;
  }

  /* Color helper */
  function hexToRGB(hex) {
    var rr = parseInt(hex.slice(1, 3), 16);
    var gg = parseInt(hex.slice(3, 5), 16);
    var bb = parseInt(hex.slice(5, 7), 16);
    return [rr, gg, bb];
  }
  function rgba(hex, a) {
    var c = hexToRGB(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function lighten(hex, amt) {
    var c = hexToRGB(hex);
    var r = Math.min(255, c[0] + amt), g = Math.min(255, c[1] + amt), b = Math.min(255, c[2] + amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function darken(hex, amt) {
    var c = hexToRGB(hex);
    var r = Math.max(0, c[0] - amt), g = Math.max(0, c[1] - amt), b = Math.max(0, c[2] - amt);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* ================================================================
     CANVAS — GEAR DRAWING
     ================================================================ */
  function drawGear(cx, cy, numTeeth, mod, ang, fillColor, strokeColor, label) {
    var r = (numTeeth * mod) / 2;          // pitch circle radius
    var addendum = mod;                     // standard: a = m
    var dedendum = mod * 1.25;              // standard: b = 1.25 m
    var outerR = r + addendum;
    var rootR = Math.max(4, r - dedendum);
    var toothAngle = (2 * Math.PI) / numTeeth;

    /* Half-angles along the tooth, chosen so the flank crosses the pitch
       circle at the theoretically-correct half-tooth width (toothAngle / 4).
       With hRoot=0.34 and hTip=0.18 (as fractions of toothAngle) and a linear
       flank between root and tip, the interpolated half-angle at r is
         (hRoot · m + hTip · 1.25 m) / (2.25 m) = (0.34 + 0.225) / 2.25 ≈ 0.251
       which equals toothAngle/4 = 0.25 — so meshing geometry is correct. */
    var hRoot = toothAngle * 0.34;
    var hTip  = toothAngle * 0.18;

    ctx.save();
    ctx.translate(cx, cy);

    /* Soft drop shadow under the whole gear disc */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(0,0,0,0.001)';
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.rotate(ang);

    /* === Tooth profile: straight flanks + outer-tip arc + root-gap arc.
           Strictly bounded by rootR..outerR, so gears with matching modules
           interlock without overlap or gaps at the pitch circle. === */
    ctx.beginPath();
    for (var i = 0; i < numTeeth; i++) {
      var a = i * toothAngle;                // tooth centreline
      var aLR = a - hRoot;                   // left  flank at root
      var aLT = a - hTip;                    // left  flank at tip
      var aRT = a + hTip;                    // right flank at tip
      var aRR = a + hRoot;                   // right flank at root
      var aNextLR = ((i + 1) * toothAngle) - hRoot; // root-gap arc end

      if (i === 0) {
        ctx.moveTo(rootR * Math.cos(aLR), rootR * Math.sin(aLR));
      }
      /* Left flank — straight line from root up to tip */
      ctx.lineTo(outerR * Math.cos(aLT), outerR * Math.sin(aLT));
      /* Tip — short CW arc at outerR from left tip to right tip */
      ctx.arc(0, 0, outerR, aLT, aRT, false);
      /* Right flank — straight line from tip back down to root */
      ctx.lineTo(rootR * Math.cos(aRR), rootR * Math.sin(aRR));
      /* Root gap — CW arc at rootR over to next tooth's left root */
      ctx.arc(0, 0, rootR, aRR, aNextLR, false);
    }
    ctx.closePath();

    /* Radial gradient fill — rim highlight → hub shadow */
    var grad = ctx.createRadialGradient(-outerR * 0.25, -outerR * 0.25, rootR * 0.2, 0, 0, outerR);
    grad.addColorStop(0, lighten(strokeColor, 70));
    grad.addColorStop(0.55, strokeColor);
    grad.addColorStop(1, darken(strokeColor, 60));
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = darken(strokeColor, 30);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* Subtle inner highlight ring to fake 3D bevel */
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, rootR - 2, Math.PI * 0.9, Math.PI * 1.9);
    ctx.stroke();

    /* Solid web (no spokes/holes — keeps high-speed rotation readable) */
    var hubR = Math.max(mod * 2.2, 10);
    var axleR = Math.max(mod * 1.1, 5);

    /* Hub with radial gradient */
    var hubGrad = ctx.createRadialGradient(-hubR * 0.3, -hubR * 0.3, 1, 0, 0, hubR);
    hubGrad.addColorStop(0, lighten(strokeColor, 40));
    hubGrad.addColorStop(1, darken(strokeColor, 40));
    ctx.fillStyle = hubGrad;
    ctx.beginPath();
    ctx.arc(0, 0, hubR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darken(strokeColor, 50);
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Axle hole + keyway */
    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.arc(0, 0, axleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    /* Keyway notch */
    ctx.fillStyle = '#0d1117';
    var kw = Math.max(1.5, axleR * 0.35);
    ctx.fillRect(-kw / 2, -axleR - kw * 0.6, kw, kw * 1.1);

    ctx.restore();

    /* Pitch circle (toggleable) */
    if (showPitch) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = rgba(strokeColor, 0.45);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    /* Label */
    if (showLabels && label) {
      ctx.font = '800 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(label, cx, cy);
      ctx.fillText(label, cx, cy);
    }
  }

  /* Mesh contact glow where two pitch circles touch (on line connecting centres) */
  function drawMeshGlow(cx1, cy1, r1, cx2, cy2, r2) {
    var dx = cx2 - cx1, dy = cy2 - cy1;
    var d = Math.sqrt(dx * dx + dy * dy); if (d < 1) return;
    var mx = cx1 + (dx / d) * r1;
    var my = cy1 + (dy / d) * r1;
    var g = ctx.createRadialGradient(mx, my, 0, mx, my, 16);
    g.addColorStop(0, 'rgba(255,235,160,0.85)');
    g.addColorStop(1, 'rgba(255,235,160,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.fill();
  }

  /* FIXED rotation arrow — short arc + tangent-correct arrowhead */
  function drawRotationArrow(cx, cy, r, clockwise, color) {
    if (!showArrows) return;
    var arrowR = r + 14;
    var startAngle, endAngle, counter, tangentAngle;
    if (clockwise) {
      startAngle = -Math.PI * 0.75;
      endAngle = -Math.PI * 0.15;
      counter = false; // canvas CW = angle increasing
      tangentAngle = endAngle + Math.PI / 2;
    } else {
      startAngle = -Math.PI * 0.15;
      endAngle = -Math.PI * 0.75;
      counter = true; // canvas CCW = angle decreasing
      tangentAngle = endAngle - Math.PI / 2;
    }
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.shadowColor = rgba(color, 0.6);
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, arrowR, startAngle, endAngle, counter);
    ctx.stroke();
    ctx.restore();

    /* Arrowhead tip at endAngle, pointing along tangent direction of motion */
    var ax = cx + arrowR * Math.cos(endAngle);
    var ay = cy + arrowR * Math.sin(endAngle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ax + 9 * Math.cos(tangentAngle), ay + 9 * Math.sin(tangentAngle));
    ctx.lineTo(ax + 6 * Math.cos(tangentAngle + 2.4), ay + 6 * Math.sin(tangentAngle + 2.4));
    ctx.lineTo(ax + 6 * Math.cos(tangentAngle - 2.4), ay + 6 * Math.sin(tangentAngle - 2.4));
    ctx.closePath();
    ctx.fill();
  }

  /* Subtle workshop grid background */
  function drawBackground() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    if (!showGrid) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(107,122,153,0.09)';
    ctx.lineWidth = 1;
    var step = 24;
    for (var x = 0; x <= W; x += step) {
      ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke();
    }
    for (var y = 0; y <= H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke();
    }
    /* Vignette */
    var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawRPMLabel(cx, cy, r, rpmVal, color) {
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(roundN(rpmVal, 0) + ' rpm', cx, cy + r + 32);
  }

  function drawDimensionLine(x1, y1, x2, y2, label) {
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    /* End ticks */
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 5); ctx.lineTo(x1, y1 + 5);
    ctx.moveTo(x2, y2 - 5); ctx.lineTo(x2, y2 + 5);
    ctx.stroke();
    /* Label */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText(label, (x1 + x2) / 2, y1 - 10);
  }

  /* ================================================================
     CANVAS — SIMULATE MODE DRAWING
     ================================================================ */
  var SCALE = 1.8; // visual scale for gears

  function drawSimulate() {
    var gr = gearRatio();
    var outRPM = outputRPM();

    if (trainType === 'simple') {
      drawSimpleGears(gr, outRPM);
    } else if (trainType === 'idler') {
      drawIdlerGears(gr, outRPM);
    } else if (trainType === 'compound') {
      drawCompoundGears(gr, outRPM);
    } else if (trainType === 'worm') {
      drawWormGears(gr, outRPM);
    }

    /* === Speed-ratio equation + metadata (merged, top-right) === */
    drawRatioOverlay();
  }

  /* Render a stacked fraction at (cx, cy) where cy is the y of the bar.
     numColor / denColor can be different so each side of the fraction is
     coloured by its variable's identity (gear colour). */
  function drawFrac(cx, cy, numText, denText, fontPx, numColor, denColor, measureOnly) {
    var fontStack = '"Cambria Math", "STIX Two Math", "Times New Roman", Georgia, serif';
    ctx.font = '700 ' + fontPx + 'px ' + fontStack;
    var nw = ctx.measureText(numText).width;
    var dw = ctx.measureText(denText).width;
    var barW = Math.max(nw, dw) + 10;
    if (measureOnly) return barW;
    ctx.strokeStyle = numColor || '#dde3f0';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - barW / 2, cy);
    ctx.lineTo(cx + barW / 2, cy);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = numColor || '#dde3f0';
    ctx.fillText(numText, cx, cy - fontPx * 0.62);
    ctx.fillStyle = denColor || numColor || '#dde3f0';
    ctx.fillText(denText, cx, cy + fontPx * 0.62);
    return barW;
  }

  /* Render a stacked fraction at (cx, cy) where cy is the y of the bar.
     Returns the bar width. Pass measureOnly=true to compute width only. */
  function drawFrac(cx, cy, numText, denText, fontPx, numColor, denColor, measureOnly) {
    var fontStack = 'ui-monospace, "SF Mono", "Cambria Math", "Courier New", monospace';
    ctx.font = '700 ' + fontPx + 'px ' + fontStack;
    var nw = ctx.measureText(numText).width;
    var dw = ctx.measureText(denText).width;
    var barW = Math.max(nw, dw) + 12;
    if (measureOnly) return barW;
    ctx.strokeStyle = numColor || '#dde3f0';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - barW / 2, cy);
    ctx.lineTo(cx + barW / 2, cy);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = numColor || '#dde3f0';
    ctx.fillText(numText, cx, cy - fontPx * 0.62);
    ctx.fillStyle = denColor || numColor || '#dde3f0';
    ctx.fillText(denText, cx, cy + fontPx * 0.62);
    return barW;
  }

  /* Bottom-anchored speed-ratio equation in classical stacked-fraction
     notation, with current values written into each variable so the
     equation reads like:
        n1=600     T2=40
        ──────  = ──────  =  2 : 1
        n2=300     T1=20
     Variables coloured by gear, result in gold. Auto-shrinks if the
     three fractions would overflow the canvas width. */
  function drawRatioOverlay() {
    var gr = gearRatio();
    var nIn = inputRPM, nOut = roundN(outputRPM(), 0);

    var COL = {
      n: '#e8edf6',
      T1: '#ff8a8a', T2: '#7ec1ff', T3: '#8ee6b4', T4: '#ffd96b',
      Tw: '#7ec1ff', Ts: '#ff8a8a',
      eq: '#a9b4cd',
      rslt: '#f5c842'
    };

    /* Build the two stacked fractions per train type. Each frac is
       {num, den, nC, dC} (text + colours). */
    var f1, f2, rslt;
    if (trainType === 'simple' || trainType === 'idler') {
      f1 = { num: 'n₁=' + nIn,  den: 'n₂=' + nOut, nC: COL.n,  dC: COL.n };
      f2 = { num: 'T₂=' + teethB, den: 'T₁=' + teethA, nC: COL.T2, dC: COL.T1 };
    } else if (trainType === 'compound') {
      f1 = { num: 'n₁=' + nIn, den: 'n₄=' + nOut, nC: COL.n, dC: COL.n };
      f2 = {
        num: 'T₂·T₄=' + teethB + '·' + teethD,
        den: 'T₁·T₃=' + teethA + '·' + teethC,
        nC: COL.T2, dC: COL.T1
      };
    } else { /* worm */
      f1 = { num: 'n₁=' + nIn, den: 'n₂=' + nOut, nC: COL.n, dC: COL.n };
      f2 = { num: 'Tₘ=' + teethB, den: 'Tₛ=' + wormStarts, nC: COL.Tw, dC: COL.Ts };
    }
    rslt = roundN(gr, 2) + ' : 1';

    /* Auto-fit the whole row to the canvas */
    var fontPx = 16;
    var fontEq = 18;
    var fontR = 20;
    var maxW = W - 40;
    function widths() {
      var w1 = drawFrac(0, 0, f1.num, f1.den, fontPx, '', '', true);
      var w2 = drawFrac(0, 0, f2.num, f2.den, fontPx, '', '', true);
      ctx.font = '700 ' + fontEq + 'px "Cambria Math", serif';
      var weq = ctx.measureText('=').width;
      ctx.font = '700 ' + fontR + 'px ui-monospace, "SF Mono", "Courier New", monospace';
      var wR = ctx.measureText(rslt).width;
      var gap = 14;
      return { w1: w1, w2: w2, weq: weq, wR: wR, gap: gap, total: w1 + gap + weq + gap + w2 + gap + weq + gap + wR };
    }
    var W_ = widths();
    while (W_.total > maxW && fontPx > 11) {
      fontPx -= 1; fontEq -= 1; fontR -= 1;
      W_ = widths();
    }

    /* Position: centred horizontally, anchored at the bottom of the canvas */
    var cy = H - 28;             // bar of each fraction sits here
    var x = 24;   /* left-aligned with a small padding from the canvas edge */

    ctx.save();
    /* Subtle dimming band so the equation stays legible over busy gears */
    ctx.fillStyle = 'rgba(13,17,30,0.55)';
    ctx.fillRect(0, cy - fontPx - 8, W, fontPx * 2 + 16);

    /* First fraction */
    drawFrac(x + W_.w1 / 2, cy, f1.num, f1.den, fontPx, f1.nC, f1.dC);
    x += W_.w1 + W_.gap;
    /* "=" */
    ctx.font = '700 ' + fontEq + 'px "Cambria Math", "Times New Roman", serif';
    ctx.fillStyle = COL.eq;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('=', x + W_.weq / 2, cy);
    x += W_.weq + W_.gap;
    /* Second fraction */
    drawFrac(x + W_.w2 / 2, cy, f2.num, f2.den, fontPx, f2.nC, f2.dC);
    x += W_.w2 + W_.gap;
    /* "=" */
    ctx.font = '700 ' + fontEq + 'px "Cambria Math", "Times New Roman", serif';
    ctx.fillStyle = COL.eq;
    ctx.fillText('=', x + W_.weq / 2, cy);
    x += W_.weq + W_.gap;
    /* Result (gold) */
    ctx.font = '700 ' + fontR + 'px ui-monospace, "SF Mono", "Courier New", monospace';
    ctx.fillStyle = COL.rslt;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(rslt, x, cy);
    ctx.restore();
  }

  function drawSimpleGears(gr, outRPM) {
    var rA = (teethA * gearModule * SCALE) / 2;
    var rB = (teethB * gearModule * SCALE) / 2;
    var maxSpace = W - 120;
    var totalWidth = rA * 2 + rB * 2;
    var scale = SCALE;
    if (totalWidth > maxSpace) {
      scale *= maxSpace / totalWidth;
      rA = (teethA * gearModule * scale) / 2;
      rB = (teethB * gearModule * scale) / 2;
    }
    var cy = H / 2 - 5;
    var cxA = W / 2 - (rA + rB) / 2;
    var cxB = cxA + rA + rB;

    var angleB = -angle * (teethA / teethB);

    drawMeshGlow(cxA, cy, rA, cxB, cy, rB);
    drawGear(cxA, cy, teethA, gearModule * scale, angle, '#c62828', '#c62828', 'A');
    drawGear(cxB, cy, teethB, gearModule * scale, angleB + Math.PI / teethB, '#42a5f5', '#42a5f5', 'B');

    drawRotationArrow(cxA, cy, rA + 4, true, '#f5c842');
    drawRotationArrow(cxB, cy, rB + 4, false, '#f5c842');

    drawRPMLabel(cxA, cy, rA + 8, inputRPM, '#ff8a8a');
    drawRPMLabel(cxB, cy, rB + 8, outRPM, '#7ec1ff');

    if (showDims) {
      drawDimensionLine(cxA, cy - Math.max(rA, rB) - 30, cxB, cy - Math.max(rA, rB) - 30, fmtLen(centerDistance()));
    }

    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Simple Gear Train', W / 2, 30);
  }

  function drawIdlerGears(gr, outRPM) {
    var rA = (teethA * gearModule * SCALE) / 2;
    var rI = (teethIdler * gearModule * SCALE) / 2;
    var rB = (teethB * gearModule * SCALE) / 2;
    var maxSpace = W - 120;
    var totalWidth = rA * 2 + rI * 2 + rB * 2;
    var scale = SCALE;
    if (totalWidth > maxSpace) {
      scale *= maxSpace / totalWidth;
      rA = (teethA * gearModule * scale) / 2;
      rI = (teethIdler * gearModule * scale) / 2;
      rB = (teethB * gearModule * scale) / 2;
    }
    var cy = H / 2 - 5;
    var cxA = W / 2 - (rA + rI * 2 + rB) / 2 + rA;
    var cxI = cxA + rA + rI;
    var cxB = cxI + rI + rB;

    var angleI = -angle * (teethA / teethIdler);
    var angleB = -angleI * (teethIdler / teethB); // same direction as A

    drawMeshGlow(cxA, cy, rA, cxI, cy, rI);
    drawMeshGlow(cxI, cy, rI, cxB, cy, rB);
    drawGear(cxA, cy, teethA, gearModule * scale, angle, '#c62828', '#c62828', 'A');
    drawGear(cxI, cy, teethIdler, gearModule * scale, angleI + Math.PI / teethIdler, '#3ddc84', '#3ddc84', 'I');
    drawGear(cxB, cy, teethB, gearModule * scale, angleB + Math.PI / teethB, '#42a5f5', '#42a5f5', 'B');

    drawRotationArrow(cxA, cy, rA + 4, true, '#f5c842');
    drawRotationArrow(cxI, cy, rI + 4, false, '#f5c842');
    drawRotationArrow(cxB, cy, rB + 4, true, '#f5c842');

    var idlerRPM = inputRPM * (teethA / teethIdler);
    drawRPMLabel(cxA, cy, rA + 8, inputRPM, '#ff8a8a');
    drawRPMLabel(cxI, cy, rI + 8, idlerRPM, '#8ee6b4');
    drawRPMLabel(cxB, cy, rB + 8, outRPM, '#7ec1ff');

    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Simple Train with Idler', W / 2, 30);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Idler changes direction only, not ratio', W / 2, 52);
  }

  function drawCompoundGears(gr, outRPM) {
    var scale = SCALE;
    var rA = (teethA * gearModule * scale) / 2;
    var rB = (teethB * gearModule * scale) / 2;
    var rC = (teethC * gearModule * scale) / 2;
    var rD = (teethD * gearModule * scale) / 2;
    var totalWidth = rA + rB + rB + rD + 100;
    if (totalWidth > W - 80) {
      scale *= (W - 80) / totalWidth;
      rA = (teethA * gearModule * scale) / 2;
      rB = (teethB * gearModule * scale) / 2;
      rC = (teethC * gearModule * scale) / 2;
      rD = (teethD * gearModule * scale) / 2;
    }

    var cy = H / 2 - 5;
    var cxA = 80 + rA;
    var cxB = cxA + rA + rB;
    var cxC = cxB; // same shaft as B
    var cxD = cxC + rC + rD;

    var angleB = -angle * (teethA / teethB);
    var angleC = angleB;
    var angleD = -angleC * (teethC / teethD);

    /* Shared shaft (drawn behind gears) */
    ctx.save();
    ctx.strokeStyle = 'rgba(180,190,215,0.4)';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(cxB, cy - Math.max(rB, rC) - 18);
    ctx.lineTo(cxB, cy + Math.max(rB, rC) + 18);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    drawMeshGlow(cxA, cy, rA, cxB, cy, rB);
    drawMeshGlow(cxC, cy, rC, cxD, cy, rD);

    drawGear(cxA, cy, teethA, gearModule * scale, angle, '#c62828', '#c62828', 'A');
    drawGear(cxB, cy, teethB, gearModule * scale, angleB + Math.PI / teethB, '#42a5f5', '#42a5f5', 'B');
    drawGear(cxC, cy, teethC, gearModule * scale, angleC, '#3ddc84', '#3ddc84', 'C');
    drawGear(cxD, cy, teethD, gearModule * scale, angleD + Math.PI / teethD, '#f5c842', '#f5c842', 'D');

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#b5c0d8';
    ctx.textAlign = 'center';
    ctx.fillText('Shared shaft', cxB, cy + Math.max(rB, rC) + 34);

    /* RPM labels on ALL four gears */
    var midRPM = inputRPM * (teethA / teethB); // B and C share shaft
    drawRPMLabel(cxA, cy, rA + 8, inputRPM, '#ff8a8a');
    drawRPMLabel(cxB, cy, rB + 8, midRPM, '#7ec1ff');
    drawRPMLabel(cxC, cy, rC + 8, midRPM, '#8ee6b4');
    drawRPMLabel(cxD, cy, rD + 8, outRPM, '#ffd96b');

    /* Arrows on all four — physically: A=CW, B=CCW, C=CCW (same shaft), D=CW */
    drawRotationArrow(cxA, cy, rA + 4, true, '#f5c842');
    drawRotationArrow(cxB, cy, rB + 4, false, '#f5c842');
    drawRotationArrow(cxC, cy, rC + 4, false, '#f5c842');
    drawRotationArrow(cxD, cy, rD + 4, true, '#f5c842');

    if (showDims) {
      drawDimensionLine(cxA, cy - Math.max(rA, rB) - 34, cxB, cy - Math.max(rA, rB) - 34, fmtLen((pitchCircleD(teethA) + pitchCircleD(teethB)) / 2));
      drawDimensionLine(cxC, cy + Math.max(rC, rD) + 34, cxD, cy + Math.max(rC, rD) + 34, fmtLen((pitchCircleD(teethC) + pitchCircleD(teethD)) / 2));
    }

    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Compound Gear Train', W / 2, 30);
  }

  function drawWormGears(gr, outRPM) {
    /* Layout: worm horizontal at the bottom, wheel mounted above it with
       its axis perpendicular (out-of-screen). The wheel's bottom teeth
       engage the worm's top threads — classic orthogonal worm drive. */
    var wormR = 26;                       // worm pitch radius (for display)
    var wormLen = 340;                    // axial length
    var wormCx = W / 2;
    var wormCy = H - 110;                 // bottom zone
    var wormTopY = wormCy - wormR;

    /* Wheel sizing — scale to fit between title area (60px) and worm top */
    var wheelMod = gearModule * 2.0;      // visual module scale
    var wheelR = (teethB * wheelMod) / 2;
    var maxWheelR = wormTopY - 80;        // leave room for title
    if (wheelR > maxWheelR) {
      wheelMod *= maxWheelR / wheelR;
      wheelR = (teethB * wheelMod) / 2;
    }
    if (wheelR < 55) { wheelMod *= 55 / wheelR; wheelR = 55; } // minimum
    var wheelCx = W / 2;
    /* Wheel outerR at bottom should just touch (or slightly overlap) the
       worm's thread crest on top. outerR = wheelR + wheelMod (addendum). */
    var wheelCy = wormTopY - (wheelR + wheelMod) + 6;   // 6px visual overlap for throat wrap
    var angleW = -angle / Math.max(0.1, gr);

    /* === Draw shadow cast by wheel onto worm (subtle ellipse) === */
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(wheelCx, wormTopY + 2, wheelR * 0.55, 5, 0, 0, Math.PI * 2);
    ctx.filter = 'blur(6px)';
    ctx.fill();
    ctx.filter = 'none';
    ctx.restore();

    /* === Worm body (horizontal cylinder with helical threads) === */
    ctx.save();
    ctx.translate(wormCx, wormCy);

    /* Capsule-shaped body */
    var bx = -wormLen / 2;
    var cg = ctx.createLinearGradient(0, -wormR, 0, wormR);
    cg.addColorStop(0, '#4a0f0f');
    cg.addColorStop(0.3, '#a62121');
    cg.addColorStop(0.55, '#e05050');
    cg.addColorStop(0.85, '#8a1616');
    cg.addColorStop(1, '#340707');
    ctx.fillStyle = cg;
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    ctx.beginPath();
    ctx.moveTo(bx, -wormR);
    ctx.lineTo(bx + wormLen, -wormR);
    ctx.arc(bx + wormLen, 0, wormR, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(bx, wormR);
    ctx.arc(bx, 0, wormR, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    /* Dark end-cap ellipses for 3D illusion */
    ctx.fillStyle = '#2a0505';
    ctx.beginPath();
    ctx.ellipse(bx, 0, 4, wormR - 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = darken('#c62828', 25);
    ctx.beginPath();
    ctx.ellipse(bx + wormLen, 0, 4, wormR - 1, 0, 0, Math.PI * 2);
    ctx.fill();

    /* Helical threads — sinusoidal V-shape, animated by shaft rotation.
       Axial pitch = π · m  (standard for 1-start worm; scales with starts). */
    var axialPitch = Math.max(18, Math.PI * wheelMod * 0.9);
    var threadOffset = (angle * axialPitch / (Math.PI * 2)) * wormStarts;
    var numSegs = 220;
    /* Shaded thread valleys — multiple sinusoid passes at different phases
       to give the impression of V-shaped flutes. */
    function drawThreadSine(yScale, yShift, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (var k = 0; k <= numSegs; k++) {
        var xi = bx + (k / numSegs) * wormLen;
        var yi = -wormR * yScale * Math.sin((xi - threadOffset) * (Math.PI * 2) / axialPitch) + yShift;
        /* Clamp to capsule interior */
        yi = Math.max(-wormR + 2, Math.min(wormR - 2, yi));
        if (k === 0) ctx.moveTo(xi, yi);
        else ctx.lineTo(xi, yi);
      }
      ctx.stroke();
    }
    /* Dark valley line */
    drawThreadSine(0.85, 0, 'rgba(0,0,0,0.55)', 2.2);
    /* Mid-tone shade slightly below */
    drawThreadSine(0.85, 3, 'rgba(80,15,15,0.7)', 1.4);
    /* Bright top highlight */
    drawThreadSine(0.85, -2, 'rgba(255,210,195,0.35)', 1.2);

    /* End-shaft stubs with keys */
    ctx.strokeStyle = '#9aa3b8';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(bx - 46, 0); ctx.lineTo(bx, 0);
    ctx.moveTo(bx + wormLen, 0); ctx.lineTo(bx + wormLen + 46, 0);
    ctx.stroke();

    /* Bearing support blocks at each end (dark grey) */
    ctx.fillStyle = '#3a4256';
    ctx.strokeStyle = '#1a2033';
    ctx.lineWidth = 1.5;
    var bbW = 24, bbH = wormR * 2 + 20;
    ctx.fillRect(bx - 70, -bbH / 2, bbW, bbH);
    ctx.strokeRect(bx - 70, -bbH / 2, bbW, bbH);
    ctx.fillRect(bx + wormLen + 46, -bbH / 2, bbW, bbH);
    ctx.strokeRect(bx + wormLen + 46, -bbH / 2, bbW, bbH);
    /* Bearing bolt-dots */
    ctx.fillStyle = '#1a2033';
    [-bbH / 2 + 6, bbH / 2 - 6].forEach(function (yy) {
      ctx.beginPath(); ctx.arc(bx - 58, yy, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(bx + wormLen + 58, yy, 2, 0, Math.PI * 2); ctx.fill();
    });

    ctx.restore();

    /* === Engagement strip: a bright horizontal thread "crest" band at
           the wheel's tip level, drawn BEFORE the wheel so the wheel's
           teeth cover it where they exist, and the crest shows through
           in each tooth gap — producing a true interleaved mesh look. === */
    var outerRW = wheelR + wheelMod;
    var tipY = wheelCy + outerRW;        // absolute y of wheel's tip touching worm
    var stripL = wormCx - wormLen / 2 + 20;
    var stripR = wormCx + wormLen / 2 - 20;

    ctx.save();
    /* Clip to a narrow horizontal band around the mesh line so stray
       thread re-draw stays local to the contact. */
    ctx.beginPath();
    ctx.rect(stripL, tipY - wheelMod * 1.4, stripR - stripL, wheelMod * 2.6);
    ctx.clip();
    /* Bright thread crest line inside the clip, at tipY. Re-use the same
       sinusoid but at a very high amplitude clamp so the crest reads as
       a continuous bright edge where exposed between teeth. */
    var brightCrestColor = '#ff6a5a';
    ctx.strokeStyle = brightCrestColor;
    ctx.lineWidth = wheelMod * 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var k = 0; k <= 250; k++) {
      var xi3 = wormCx - wormLen / 2 + (k / 250) * wormLen;
      var yiBase = wormCy - wormR * 0.88 * Math.sin((xi3 - wormCx - threadOffset) * (Math.PI * 2) / axialPitch);
      /* Lift the crest up to the tooth-tip mesh line */
      var yi3 = Math.min(yiBase, tipY - wheelMod * 0.2);
      if (k === 0) ctx.moveTo(xi3, yi3);
      else ctx.lineTo(xi3, yi3);
    }
    ctx.stroke();
    /* Dark thread valley line to define each thread's V shape within the strip */
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (var kk = 0; kk <= 250; kk++) {
      var xi4 = wormCx - wormLen / 2 + (kk / 250) * wormLen;
      var yi4 = tipY + wheelMod * 0.2 * Math.cos((xi4 - wormCx - threadOffset) * (Math.PI * 2) / axialPitch);
      if (kk === 0) ctx.moveTo(xi4, yi4);
      else ctx.lineTo(xi4, yi4);
    }
    ctx.stroke();
    ctx.restore();

    /* === Worm wheel (circular face view) — drawn LAST so its teeth
           occlude the crest strip wherever a tooth exists, exposing the
           bright red thread only through the tooth gaps. === */
    drawGear(wheelCx, wheelCy, teethB, wheelMod, angleW, '#42a5f5', '#42a5f5', 'B');

    /* Subtle throat darkening — shallow dim at the lower rim only (keeps
       the interleave visible). */
    ctx.save();
    ctx.translate(wheelCx, wheelCy);
    var throatGrad = ctx.createRadialGradient(0, wheelR * 0.95, wheelR * 0.15,
                                              0, wheelR * 0.95, wheelR * 0.55);
    throatGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
    throatGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = throatGrad;
    ctx.beginPath();
    ctx.arc(0, 0, wheelR + wheelMod + 1, Math.PI * 0.35, Math.PI * 0.65);
    ctx.arc(0, 0, wheelR + wheelMod * 0.1, Math.PI * 0.65, Math.PI * 0.35, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    /* Mesh glow directly at the engagement point (bottom of wheel). */
    ctx.save();
    var meshX = wheelCx, meshY = wheelCy + wheelR + wheelMod * 0.3;
    var mg = ctx.createRadialGradient(meshX, meshY, 0, meshX, meshY, 30);
    mg.addColorStop(0, 'rgba(255,245,190,0.95)');
    mg.addColorStop(1, 'rgba(255,245,190,0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(meshX, meshY, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* === Rotation arrows === */
    if (showArrows) {
      /* Wheel arrow (around its outer rim) */
      drawRotationArrow(wheelCx, wheelCy, wheelR + 4, false, '#f5c842');

      /* Worm axial-rotation arrow — curled arrow wrapping around the left
         end of the worm shaft to indicate the driving spin direction */
      ctx.save();
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(245,200,66,0.6)';
      ctx.shadowBlur = 6;
      var arrCx = wormCx - wormLen / 2 - 12;
      var arrCy = wormCy;
      var arrR = wormR + 10;
      ctx.beginPath();
      ctx.arc(arrCx, arrCy, arrR, Math.PI * 0.35, Math.PI * 1.65, false);
      ctx.stroke();
      ctx.restore();
      /* Arrowhead at end */
      var aEnd = Math.PI * 1.65;
      var atx = arrCx + arrR * Math.cos(aEnd);
      var aty = arrCy + arrR * Math.sin(aEnd);
      var tang = aEnd + Math.PI / 2;
      ctx.fillStyle = '#f5c842';
      ctx.beginPath();
      ctx.moveTo(atx + 9 * Math.cos(tang), aty + 9 * Math.sin(tang));
      ctx.lineTo(atx + 6 * Math.cos(tang + 2.4), aty + 6 * Math.sin(tang + 2.4));
      ctx.lineTo(atx + 6 * Math.cos(tang - 2.4), aty + 6 * Math.sin(tang - 2.4));
      ctx.closePath(); ctx.fill();
    }

    /* === Labels === */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8a8a';
    ctx.fillText('Worm (' + wormStarts + ' start' + (wormStarts > 1 ? 's' : '') + ')', wormCx, wormCy + wormR + 30);
    ctx.fillText(inputRPM + ' rpm', wormCx, wormCy + wormR + 46);
    ctx.fillStyle = '#7ec1ff';
    ctx.fillText('Wheel (' + teethB + 'T)', wheelCx + wheelR + 54, wheelCy - 4);
    ctx.fillText(roundN(outRPM, 1) + ' rpm', wheelCx + wheelR + 54, wheelCy + 12);

    /* === Title, ratio + efficiency, self-locking === */
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Worm Gear Drive', W / 2, 30);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Eff: ' + Math.round(wormEff * 100) + '%   ·   Self-locking: ' + (wormStarts <= 2 ? 'Yes' : 'Usually no'), W / 2, 52);
  }

  /* ================================================================
     CANVAS — EXPLORE MINI-DIAGRAMS
     ================================================================ */
  var DIAGRAM_MAP = {
    gearRatio: drawGearRatioDiag,
    moduleDiag: drawModuleDiag,
    circularPitch: drawCircularPitchDiag,
    diametralPitch: drawDiametralPitchDiag,
    spurGears: drawSpurGearsDiag,
    helicalGears: drawHelicalGearsDiag,
    bevelGears: drawBevelGearsDiag,
    wormGears: drawWormGearsDiag,
    speedReducer: drawSpeedReducerDiag,
    compoundTrain: drawCompoundTrainDiag,
    planetaryGears: drawPlanetaryGearsDiag,
    rackPinion: drawRackPinionDiag
  };

  function drawConceptDiagram(concept) {
    var fn = DIAGRAM_MAP[concept.diagram];
    if (fn) fn();
  }

  function drawGearRatioDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Gear Ratio = N_B / N_A', W / 2, 40);
    drawGear(300, 240, 20, 5, 0, '#c62828', '#c62828', 'A(20T)');
    drawGear(520, 240, 40, 5, 0, '#42a5f5', '#42a5f5', 'B(40T)');
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('GR = 40/20 = 2:1', W / 2, H - 50);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Speed halves, Torque doubles', W / 2, H - 28);
  }

  function drawModuleDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Module m = d / N', W / 2, 40);
    drawGear(W / 2, 230, 30, 4.5, 0, '#c62828', '#c62828', '');
    var r = 30 * 4.5 / 2;
    /* Pitch circle label */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('d (pitch circle)', W / 2, 230 - r - 15);
    /* Dimension arrow */
    drawDimensionLine(W / 2 - r, 230 - r - 8, W / 2 + r, 230 - r - 8, roundN(30 * 4.5, 0) + ' mm');
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('m = d / N = 135 / 30 = 4.5 mm', W / 2, H - 40);
  }

  function drawCircularPitchDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Circular Pitch p = pi x m', W / 2, 40);
    drawGear(W / 2, 240, 16, 8, 0, '#c62828', '#c62828', '');
    /* Highlight one tooth gap */
    var r = 16 * 8 / 2;
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, 240, r, -0.1, 0.3);
    ctx.stroke();
    ctx.fillStyle = '#3ddc84'; ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillText('p (circular pitch)', W / 2 + r + 30, 220);
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('p = pi x 8 = 25.13 mm', W / 2, H - 40);
  }

  function drawDiametralPitchDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Diametral Pitch P = N / d (Imperial)', W / 2, 40);
    drawGear(W / 2, 240, 24, 5, 0, '#42a5f5', '#42a5f5', '24T');
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Imperial system (teeth per inch)', W / 2, 80);
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('P = N / d  |  m = 25.4 / P', W / 2, H - 40);
  }

  function drawSpurGearsDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Spur Gears — Parallel Shafts', W / 2, 40);
    drawGear(330, 240, 20, 5, 0, '#c62828', '#c62828', '');
    drawGear(530, 240, 30, 5, Math.PI / 30, '#42a5f5', '#42a5f5', '');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Straight teeth | Simple | Economical | Noisy at high speed', W / 2, H - 35);
  }

  function drawHelicalGearsDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Helical Gears — Angled Teeth', W / 2, 40);
    /* Draw two elongated ellipses to represent helical gears */
    drawGear(330, 240, 20, 5, 0.15, '#c62828', '#c62828', '');
    drawGear(530, 240, 30, 5, -0.1 + Math.PI / 30, '#42a5f5', '#42a5f5', '');
    /* Angled lines on teeth to show helix */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(290, 200); ctx.lineTo(310, 280); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(510, 200); ctx.lineTo(530, 280); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f5c842'; ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('Helix angle', 270, 195);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Smoother | Quieter | Axial thrust | Parallel or crossed shafts', W / 2, H - 35);
  }

  function drawBevelGearsDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Bevel Gears — Intersecting Axes (90 deg)', W / 2, 40);
    /* Simplified bevel gear view */
    ctx.save();
    ctx.translate(W / 2, 240);
    /* Gear A - horizontal axis */
    ctx.fillStyle = 'rgba(198,40,40,0.4)'; ctx.strokeStyle = '#c62828'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-80, 0); ctx.lineTo(0, -40); ctx.lineTo(0, 40); ctx.closePath();
    ctx.fill(); ctx.stroke();
    /* Gear B - vertical axis */
    ctx.fillStyle = 'rgba(66,165,245,0.4)'; ctx.strokeStyle = '#42a5f5';
    ctx.beginPath();
    ctx.moveTo(0, -80); ctx.lineTo(-40, 0); ctx.lineTo(40, 0); ctx.closePath();
    ctx.fill(); ctx.stroke();
    /* Axes */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-120, 0); ctx.lineTo(80, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(0, 60); ctx.stroke();
    /* 90 deg arc */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, 25, -Math.PI / 2, 0); ctx.stroke();
    ctx.fillStyle = '#f5c842'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('90\u00B0', 15, -15);
    ctx.restore();
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Differentials | Hand drills | Right-angle drives', W / 2, H - 35);
  }

  function drawWormGearsDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Worm Gear — Very High Ratios', W / 2, 40);
    /* Worm */
    ctx.fillStyle = 'rgba(198,40,40,0.35)'; ctx.strokeStyle = '#c62828'; ctx.lineWidth = 2;
    ctx.fillRect(200, 220, 150, 40);
    ctx.strokeRect(200, 220, 150, 40);
    for (var i = 0; i < 7; i++) {
      var lx = 210 + i * 20;
      ctx.beginPath(); ctx.moveTo(lx, 220); ctx.lineTo(lx + 10, 260); ctx.stroke();
    }
    ctx.fillStyle = '#c62828'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('Worm (1 start)', 275, 212);
    /* Wheel */
    drawGear(530, 240, 30, 4, 0, '#42a5f5', '#42a5f5', '30T');
    ctx.fillStyle = '#42a5f5'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('Worm Wheel', 530, 340);
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('GR = 30/1 = 30:1  |  Self-locking', W / 2, H - 40);
  }

  function drawSpeedReducerDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Speed Reducer — GR > 1', W / 2, 40);
    drawGear(300, 240, 15, 5.5, 0, '#c62828', '#c62828', 'Small');
    drawGear(520, 240, 40, 5.5, Math.PI / 40, '#42a5f5', '#42a5f5', 'Large');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#c62828'; ctx.fillText('High Speed', 300, 350);
    ctx.fillStyle = '#42a5f5'; ctx.fillText('Low Speed', 520, 370);
    ctx.fillStyle = '#3ddc84'; ctx.fillText('High Torque', 520, 385);
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('RPM decreases, Torque increases', W / 2, H - 35);
  }

  function drawCompoundTrainDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Compound Gear Train — GR = GR1 x GR2', W / 2, 40);
    drawGear(150, 250, 12, 4.5, 0, '#c62828', '#c62828', 'A');
    drawGear(290, 250, 30, 4.5, Math.PI / 30, '#42a5f5', '#42a5f5', 'B');
    drawGear(290, 250, 10, 4.5, 0, '#3ddc84', '#3ddc84', 'C');
    drawGear(430, 250, 30, 4.5, Math.PI / 30, '#f5c842', '#f5c842', 'D');
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(290, 150); ctx.lineTo(290, 350); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.fillText('Shared shaft', 290, 370);
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('GR = (30/12) x (30/10) = 7.5:1', W / 2, H - 35);
  }

  function drawPlanetaryGearsDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Planetary (Epicyclic) Gear System', W / 2, 40);
    var cx = W / 2, cy = 250;
    /* Ring gear */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 100, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.fillText('Ring Gear', cx + 85, cy - 80);
    /* Sun gear */
    drawGear(cx, cy, 12, 3, 0, '#c62828', '#c62828', 'Sun');
    /* Planet gears */
    var pR = 40;
    for (var i = 0; i < 3; i++) {
      var pa = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      var px = cx + (pR + 30) * Math.cos(pa);
      var py = cy + (pR + 30) * Math.sin(pa);
      drawGear(px, py, 8, 2.5, 0, '#42a5f5', '#42a5f5', 'P');
    }
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('GR = 1 + N_ring / N_sun', W / 2, H - 35);
  }

  function drawRackPinionDiag() {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Rack & Pinion — Rotary to Linear', W / 2, 40);
    /* Rack */
    ctx.fillStyle = 'rgba(66,165,245,0.35)'; ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.fillRect(150, 290, 600, 30);
    ctx.strokeRect(150, 290, 600, 30);
    /* Teeth on rack */
    for (var i = 0; i < 25; i++) {
      var rx = 160 + i * 24;
      ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(rx, 290); ctx.lineTo(rx, 278); ctx.lineTo(rx + 12, 278); ctx.lineTo(rx + 12, 290); ctx.stroke();
    }
    /* Pinion */
    drawGear(W / 2, 240, 16, 4, 0, '#c62828', '#c62828', '');
    /* Arrow showing travel */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(300, 340); ctx.lineTo(600, 340); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(600, 340); ctx.lineTo(590, 335); ctx.lineTo(590, 345); ctx.closePath(); ctx.fill();
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('Linear travel = pi x d per revolution', W / 2, 360);
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Steering | CNC machines | Sliding gates', W / 2, H - 35);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();

    if (mode === 'simulate') {
      drawSimulate();
    } else if (mode === 'explore') {
      var c = CONCEPTS.filter(function (cc) { return cc.cat === selCat; });
      if (c[selConcept]) drawConceptDiagram(c[selConcept]);
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    }
  }

  function drawQuizCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Quiz Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#c62828';
    ctx.fillText('Answer the question below', W / 2, 65);
    drawGear(300, 280, 20, 4, 0, '#c62828', '#c62828', 'A');
    drawGear(480, 280, 35, 4, Math.PI / 35, '#42a5f5', '#42a5f5', 'B');
  }

  function drawPracticeCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Practice Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#c62828';
    ctx.fillText('Solve the problem below', W / 2, 65);
    drawGear(350, 280, 25, 4, 0, '#c62828', '#c62828', '');
    drawGear(530, 280, 40, 4, Math.PI / 40, '#42a5f5', '#42a5f5', '');
  }

  /* ================================================================
     ANIMATION
     ================================================================ */
  function animate() {
    if (mode !== 'simulate') return;
    if (running) {
      /* Decoupled visual speed: the RPM readout stays exact, but the on-screen
         rotation is driven by the 0-1 Animation Speed slider. At speedScale=1.0
         with 1200 rpm we get ~1.2 rev/s (teeth still discernible); at the
         default 0.1 we get ~0.12 rev/s (slow enough to study meshing). */
      var rps = inputRPM * speedScale * 0.06 / 60; // = rpm * speed * 0.001 rev/s
      angle += (rps * Math.PI * 2) / 60;
      if (angle > 1e6) angle = 0;
    }
    render();
    updateReadouts();
    animFrame = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animFrame) cancelAnimationFrame(animFrame);
    animate();
  }

  function stopAnimation() {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    var gr = gearRatio();
    var outRPM = outputRPM();
    var tIn = inputTorque();
    var tOut = outputTorque();
    var pcdA = pitchCircleD(teethA);

    $('#r-ratio').textContent = roundN(gr, 2);
    $('#r-rpm-out').textContent = roundN(outRPM, 1);
    $('#r-torque-in').textContent = unitSys === 'imp' ? roundN(tIn / NM_PER_LBFT, 2) : roundN(tIn, 2);
    $('#r-torque-out').textContent = unitSys === 'imp' ? roundN(tOut / NM_PER_LBFT, 2) : roundN(tOut, 2);
    $('#r-teeth-a').textContent = (trainType === 'worm') ? wormStarts : teethA;
    $('#r-teeth-b').textContent = teethB;
    $('#r-module').textContent = fmtLenValOnly(gearModule);
    $('#r-pcd').textContent = fmtLenValOnly(pcdA);
    /* Update readout-card units based on unit system */
    var lu = unitLen(), tu = unitTorque();
    var ur = document.querySelectorAll('.readout-card .readout-unit');
    if (ur.length >= 8) {
      ur[2].textContent = ' ' + tu;       // input torque
      ur[3].textContent = ' ' + tu;       // output torque
      ur[6].textContent = ' ' + lu;       // module
      ur[7].textContent = ' ' + lu;       // PCD
    }

    /* Badges */
    $('#rb-rpm-a').textContent = inputRPM + ' rpm';
    $('#rb-rpm-b').textContent = roundN(outRPM, 0) + ' rpm';
    $('#rb-ratio').textContent = roundN(gr, 2);
    $('#rb-torque').textContent = fmtTorque(tOut);

    /* Warnings */
    var wb = $('#warning-badges');
    if (wb) {
      var wl = warnings();
      wb.innerHTML = wl.map(function (w) {
        return '<span class="warn-badge ' + (w.kind === 'err' ? 'err' : '') + '">&#9888; ' + w.text + '</span>';
      }).join('');
    }

    /* Learning panels: live content updates */
    if (typeof updateLearningPanels === 'function') updateLearningPanels();
  }

  /* ================================================================
     LEARNING PANELS — Live equations / Power flow / History / Coach
     ================================================================ */
  function tag(cls, text) { return '<span class="' + cls + '">' + text + '</span>'; }

  function buildEqLines() {
    var gr = gearRatio();
    var nOut = outputRPM();
    var omega = 2 * Math.PI * inputRPM / 60;
    var tIn  = inputTorque();
    var eff = (trainType === 'worm') ? wormEff : 0.97;
    var tOut = outputTorque();

    var vrLine;
    if (trainType === 'simple' || trainType === 'idler') {
      vrLine = 'GR = ' + tag('v-T2', 'T₂') + ' / ' + tag('v-T1', 'T₁') +
               ' = ' + tag('v-T2', teethB) + ' / ' + tag('v-T1', teethA) +
               ' = ' + tag('v-rslt', roundN(gr, 3) + ' : 1');
    } else if (trainType === 'compound') {
      vrLine = 'GR = (' + tag('v-T2', 'T₂') + '·' + tag('v-T4', 'T₄') + ') / (' +
               tag('v-T1', 'T₁') + '·' + tag('v-T3', 'T₃') + ')<br>' +
               '&nbsp;&nbsp;&nbsp;= (' + tag('v-T2', teethB) + '·' + tag('v-T4', teethD) + ') / (' +
               tag('v-T1', teethA) + '·' + tag('v-T3', teethC) + ')' +
               ' = ' + tag('v-rslt', roundN(gr, 3) + ' : 1');
    } else {
      vrLine = 'GR = ' + tag('v-Tw', 'Tₘ') + ' / ' + tag('v-Ts', 'Tₛ') +
               ' = ' + tag('v-Tw', teethB) + ' / ' + tag('v-Ts', wormStarts) +
               ' = ' + tag('v-rslt', roundN(gr, 3) + ' : 1');
    }
    if ($('#eq-vr')) $('#eq-vr').innerHTML = vrLine;

    if ($('#eq-rpm')) $('#eq-rpm').innerHTML =
      'n_out = n_in / GR = ' + inputRPM + ' / ' + roundN(gr, 3) +
      ' = ' + tag('v-rslt', roundN(nOut, 2) + ' rpm');

    if ($('#eq-tin')) $('#eq-tin').innerHTML =
      'ω = 2π·n / 60 = ' + roundN(omega, 3) + ' rad/s<br>' +
      'T_in = P / ω = ' + inputPower + ' / ' + roundN(omega, 3) +
      ' = ' + tag('v-rslt', roundN(tIn, 3) + ' Nm');

    if ($('#eq-tout')) $('#eq-tout').innerHTML =
      'η = ' + Math.round(eff * 100) + ' %' +
      ' (' + (trainType === 'worm' ? 'worm, slider' : 'spur/compound typical') + ')<br>' +
      'T_out = T_in · GR · η = ' + roundN(tIn, 2) + ' · ' + roundN(gr, 3) + ' · ' + roundN(eff, 2) +
      ' = ' + tag('v-rslt', roundN(tOut, 2) + ' Nm');

    var pcdA = pitchCircleD(teethA), pcdB = pitchCircleD(teethB);
    var geom = 'm = ' + fmtLen(gearModule) + '<br>';
    if (trainType !== 'worm') {
      geom += 'PCD₁ = m · T₁ = ' + fmtLen(pcdA) + '<br>';
      geom += 'PCD₂ = m · T₂ = ' + fmtLen(pcdB) + '<br>';
      geom += 'Centre dist = (PCD₁ + PCD₂) / 2 = ' + tag('v-rslt', fmtLen(centerDistance()));
    } else {
      geom += 'PCD_wheel = m · Tₘ = ' + fmtLen(pcdB) + '<br>';
      geom += tag('v-dim', 'Worm centre distance ≈ (PCD_wheel + worm_dia) / 2');
    }
    if ($('#eq-geom')) $('#eq-geom').innerHTML = geom;
  }

  function buildPowerBars() {
    var tIn = inputTorque(), tOut = outputTorque();
    var omegaIn = 2 * Math.PI * inputRPM / 60;
    var omegaOut = 2 * Math.PI * outputRPM() / 60;
    var pIn = tIn * omegaIn;
    var pOut = tOut * omegaOut;
    var eff = pIn > 0 ? pOut / pIn : 0;

    var maxRPM = Math.max(inputRPM, outputRPM(), 1);
    var maxT = Math.max(tIn, tOut, 1);
    var rows = [
      { lbl: 'Input speed',   v: inputRPM,    u: 'rpm', max: maxRPM, cls: 'in' },
      { lbl: 'Output speed',  v: outputRPM(), u: 'rpm', max: maxRPM, cls: 'out' },
      { lbl: 'Input torque',  v: tIn,         u: 'Nm',  max: maxT,   cls: 'in' },
      { lbl: 'Output torque', v: tOut,        u: 'Nm',  max: maxT,   cls: 'out' },
      { lbl: 'Efficiency',    v: eff * 100,   u: '%',   max: 100,    cls: 'eff' }
    ];
    var html = rows.map(function (r) {
      var pct = Math.max(0, Math.min(100, (r.v / r.max) * 100));
      return '<div class="pb-row">' +
        '<span class="pb-label">' + r.lbl + '</span>' +
        '<span class="pb-track"><span class="pb-fill ' + r.cls + '" style="width:' + pct + '%"></span></span>' +
        '<span class="pb-val">' + roundN(r.v, 2) + ' ' + r.u + '</span>' +
        '</div>';
    }).join('');
    if ($('#power-bars')) $('#power-bars').innerHTML = html;
    if ($('#power-note')) {
      var note = 'Power balance: P_in × η = P_out  →  ' +
                 roundN(pIn, 1) + ' W × ' + roundN(eff, 2) + ' = ' + roundN(pOut, 1) + ' W. ';
      note += (trainType === 'worm')
        ? 'Worm friction is the dominant loss in this train type.'
        : 'Spur/compound trains keep ~97 % of input power as mechanical output.';
      $('#power-note').textContent = note;
    }
  }

  /* Time-history rolling chart */
  var hist = { rpm: [], torque: [], maxLen: 240 };
  var histCanvas = null, histCtx = null;
  function pushHistory() {
    hist.rpm.push(outputRPM());
    hist.torque.push(outputTorque());
    if (hist.rpm.length > hist.maxLen) { hist.rpm.shift(); hist.torque.shift(); }
  }
  function drawHistory() {
    if (!histCanvas) histCanvas = document.getElementById('history-canvas');
    if (!histCanvas) return;
    if (!histCtx) histCtx = histCanvas.getContext('2d');
    var hC = histCanvas, hX = histCtx;
    /* Hi-DPI, matching what the main sim canvas already does. This one kept its
       fixed 720x160 attributes while the CSS stretches it to the card, so on a
       2x display it was a 2.00x upscale — the only soft canvas in this category.
       Logical space stays 720x160, so every draw call below is unchanged. */
    var w = 720, h = 160;
    var needW = Math.round(w * DPR), needH = Math.round(h * DPR);
    if (hC.width !== needW || hC.height !== needH) {
      hC.width = needW; hC.height = needH;
      hC.style.aspectRatio = w + ' / ' + h;
    }
    hX.setTransform(DPR, 0, 0, DPR, 0, 0);
    hX.clearRect(0, 0, w, h);
    hX.fillStyle = 'rgba(255,255,255,0.02)';
    hX.fillRect(0, 0, w, h);
    hX.strokeStyle = 'rgba(139,157,195,0.18)';
    hX.lineWidth = 1;
    for (var i = 1; i < 4; i++) {
      var y = (i / 4) * h;
      hX.beginPath(); hX.moveTo(0, y); hX.lineTo(w, y); hX.stroke();
    }
    if (hist.rpm.length < 2) {
      hX.fillStyle = '#8b9dc3'; hX.font = '12px "Segoe UI"'; hX.textAlign = 'center';
      hX.fillText('Adjust controls to see live history…', w / 2, h / 2);
      return;
    }
    var maxR = Math.max.apply(null, hist.rpm) || 1;
    var maxT = Math.max.apply(null, hist.torque) || 1;
    var draw = function (arr, color, max) {
      hX.strokeStyle = color; hX.lineWidth = 2;
      hX.beginPath();
      arr.forEach(function (v, k) {
        var px = (k / (hist.maxLen - 1)) * w;
        var py = h - (v / max) * h * 0.85 - h * 0.05;
        if (k === 0) hX.moveTo(px, py); else hX.lineTo(px, py);
      });
      hX.stroke();
    };
    draw(hist.rpm, '#42a5f5', maxR);
    draw(hist.torque, '#3ddc84', maxT);
    hX.font = '600 11px "Segoe UI"';
    hX.textAlign = 'left';
    hX.fillStyle = '#42a5f5';
    hX.fillText('● Output RPM (' + roundN(hist.rpm[hist.rpm.length - 1], 1) + ')', 10, 16);
    hX.fillStyle = '#3ddc84';
    hX.fillText('● Output torque (' + roundN(hist.torque[hist.torque.length - 1], 1) + ' Nm)', 220, 16);
  }

  function buildCoach() {
    var gr = gearRatio(), nOut = outputRPM(), tOut = outputTorque();
    var insights = [];
    if (gr > 1.05) {
      insights.push({ k: 'tip', i: '🐢',
        html: '<strong>Speed reducer.</strong> Output spins ' + roundN(gr, 2) + '× slower than input but torque is ~' + roundN(gr, 2) + '× larger.' });
    } else if (gr < 0.95) {
      insights.push({ k: 'tip', i: '🚀',
        html: '<strong>Speed multiplier.</strong> Output spins ' + roundN(1 / gr, 2) + '× faster than input — output torque drops to ' + Math.round(gr * 100) + ' %.' });
    } else {
      insights.push({ k: 'ok', i: '➡️', html: '<strong>Direct drive.</strong> Ratio ≈ 1:1; the stage transmits power without speed/torque trade.' });
    }
    var underT = [];
    if (trainType !== 'worm') {
      [['T₁', teethA], ['T₂', teethB]].forEach(function (p) { if (p[1] < 17) underT.push(p[0] + '=' + p[1]); });
      if (trainType === 'compound') {
        [['T₃', teethC], ['T₄', teethD]].forEach(function (p) { if (p[1] < 17) underT.push(p[0] + '=' + p[1]); });
      }
      if (trainType === 'idler' && teethIdler < 17) underT.push('T_idler=' + teethIdler);
    }
    if (underT.length) {
      insights.push({ k: 'warn', i: '⚠️',
        html: '<strong>Undercut risk on:</strong> ' + underT.join(', ') + '. At a 20° pressure angle, gears with fewer than 17 teeth need profile-shifting.' });
    }
    if (trainType === 'worm') {
      insights.push({ k: wormStarts <= 2 ? 'ok' : 'warn', i: wormStarts <= 2 ? '🔒' : '🔓',
        html: wormStarts <= 2
          ? '<strong>Self-locking.</strong> ' + wormStarts + '-start worms cannot be back-driven — ideal for hoists and conveyor brakes.'
          : '<strong>Probably back-drivable.</strong> ' + wormStarts + '-start worms with steep lead angles often lose self-locking.' });
      insights.push({ k: 'tip', i: '🔥',
        html: 'Increase worm <em>starts</em> to raise efficiency, or use a bronze-on-steel pair to manage frictional heat.' });
    }
    if (trainType === 'idler') {
      insights.push({ k: 'tip', i: '🔄',
        html: '<strong>Idler reverses direction.</strong> Magnitude unchanged: T_idler/T₁ × T₂/T_idler cancels.' });
    }
    if (trainType === 'compound') {
      insights.push({ k: 'tip', i: '🧮',
        html: 'Split a target ratio R into two stages: GR = (T₂/T₁) × (T₄/T₃). Equal-stage splits keep gear sizes balanced.' });
    }
    if (tOut > 500) {
      insights.push({ k: 'warn', i: '💪',
        html: '<strong>High output torque (' + roundN(tOut, 0) + ' Nm).</strong> Verify shaft, key, and tooth-bending stresses — a larger module reduces tooth stress.' });
    }
    if (nOut < 5 && trainType !== 'worm') {
      insights.push({ k: 'tip', i: '🐌',
        html: 'Output speed below 5 rpm. For continuous duty consider a worm or planetary stage — fewer parts, more compact.' });
    }
    if ($('#coach-list')) {
      $('#coach-list').innerHTML = insights.map(function (it) {
        return '<li class="coach-item ' + it.k + '">' +
          '<span class="ci-icon">' + it.i + '</span><span>' + it.html + '</span></li>';
      }).join('');
    }
  }

  var lastHistTick = 0;
  function updateLearningPanels() {
    if ($('#lp-equations') && $('#lp-equations').open) buildEqLines();
    if ($('#lp-power') && $('#lp-power').open) buildPowerBars();
    if ($('#lp-coach') && $('#lp-coach').open) buildCoach();
    var now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    if (now - lastHistTick > 200) {
      pushHistory();
      lastHistTick = now;
      if ($('#lp-history') && $('#lp-history').open) drawHistory();
    }
  }
  function wireLearnPanels() {
    var expAll = $('#learn-expand-all'), colAll = $('#learn-collapse-all');
    var cards = Array.prototype.slice.call($$('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () {
      cards.forEach(function (c) { c.open = true; });
      drawHistory(); buildEqLines(); buildPowerBars(); buildCoach();
    });
    if (colAll) colAll.addEventListener('click', function () {
      cards.forEach(function (c) { c.open = false; });
    });
    var pairs = [
      ['#lp-equations', buildEqLines],
      ['#lp-power', buildPowerBars],
      ['#lp-coach', buildCoach],
      ['#lp-history', drawHistory]
    ];
    pairs.forEach(function (p) {
      var el = $(p[0]);
      if (el) el.addEventListener('toggle', function () { if (el.open) p[1](); });
    });
  }
  wireLearnPanels();

  /* ================================================================
     UI — MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;
    $$('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });
    var simPanels = ['#sim-panel'];
    var explorePanels = ['#cat-row', '#item-selector', '#item-info'];
    var practicePanels = ['#practice-panel', '#practice-bar'];
    var quizPanels = ['#quiz-panel', '#quiz-bar', '#quiz-result'];

    simPanels.concat(explorePanels, practicePanels, quizPanels).forEach(function (s) { hide($(s)); });

    if (m === 'simulate') {
      simPanels.forEach(function (s) { show($(s)); });
      startAnimation();
    } else {
      stopAnimation();
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

  $('#mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    setMode(e.target.dataset.mode);
  });

  /* ================================================================
     UI — TRAIN TYPE SWITCHING
     ================================================================ */
  function applyTrainTypeUI() {
    $('#compound-row').style.display = (trainType === 'compound') ? '' : 'none';
    $('#idler-row').style.display = (trainType === 'idler') ? '' : 'none';
    $('#worm-eff-group').style.display = (trainType === 'worm') ? '' : 'none';
    var tal = $('#teeth-a-label');
    var taS = $('#teeth-a-slider');
    var taN = $('#teeth-a-num');
    if (trainType === 'worm') {
      tal.textContent = 'Worm Starts';
      taS.min = 1; taS.max = 4; taS.step = 1;
      taN.min = 1; taN.max = 4; taN.step = 1;
      if (wormStarts < 1) wormStarts = 1;
      taS.value = wormStarts; taN.value = wormStarts;
    } else {
      tal.textContent = 'Teeth A';
      taS.min = 10; taS.max = 60; taS.step = 1;
      taN.min = 10; taN.max = 60; taN.step = 1;
      if (teethA < 10) teethA = 20;
      taS.value = teethA; taN.value = teethA;
    }
  }

  $('#train-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    trainType = e.target.dataset.train;
    $$('#train-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    applyTrainTypeUI();
    updateReadouts();
  });

  /* ================================================================
     UI — PAIRED SLIDER + NUMBER INPUTS
     ================================================================ */
  function pair(sliderId, numId, setter) {
    var s = $(sliderId), n = $(numId);
    function commit(v) {
      var lo = +s.min, hi = +s.max;
      if (isNaN(v)) return;
      v = Math.min(hi, Math.max(lo, v));
      s.value = v; n.value = v;
      setter(v);
      updateReadouts();
    }
    s.addEventListener('input', function () { commit(+s.value); });
    n.addEventListener('input', function () {
      var v = parseFloat(n.value); if (!isNaN(v)) { s.value = v; setter(Math.min(+s.max, Math.max(+s.min, v))); updateReadouts(); }
    });
    n.addEventListener('blur', function () { commit(parseFloat(n.value)); });
  }

  pair('#teeth-a-slider', '#teeth-a-num', function (v) {
    if (trainType === 'worm') wormStarts = v | 0; else teethA = v | 0;
  });
  pair('#teeth-b-slider', '#teeth-b-num', function (v) { teethB = v | 0; });
  pair('#teeth-c-slider', '#teeth-c-num', function (v) { teethC = v | 0; });
  pair('#teeth-d-slider', '#teeth-d-num', function (v) { teethD = v | 0; });
  pair('#idler-slider', '#idler-num', function (v) { teethIdler = v | 0; });
  pair('#rpm-slider', '#rpm-num', function (v) { inputRPM = v | 0; });
  pair('#power-slider', '#power-num', function (v) { inputPower = v * 1000; });
  pair('#module-slider', '#module-num', function (v) { gearModule = v; });
  pair('#eff-slider', '#eff-num', function (v) { wormEff = v / 100; });

  /* Stepper ± buttons — look up the matching slider by data-step and nudge by step value */
  var STEP_MAP = {
    'teeth-a': '#teeth-a-slider', 'teeth-b': '#teeth-b-slider',
    'teeth-c': '#teeth-c-slider', 'teeth-d': '#teeth-d-slider',
    'idler': '#idler-slider', 'rpm': '#rpm-slider',
    'power': '#power-slider', 'module': '#module-slider', 'eff': '#eff-slider'
  };
  $$('.step-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var sel = STEP_MAP[btn.dataset.step]; if (!sel) return;
      var slider = $(sel);
      var step = parseFloat(slider.step) || 1;
      var dir = parseFloat(btn.dataset.dir) || 1;
      var cur = parseFloat(slider.value);
      var next = cur + dir * step;
      var lo = parseFloat(slider.min), hi = parseFloat(slider.max);
      next = Math.min(hi, Math.max(lo, next));
      /* Round to step precision to avoid float drift */
      if (step < 1) next = Math.round(next / step) * step;
      slider.value = next;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  /* Play/Pause */
  $('#play-pause').addEventListener('click', function () {
    running = !running;
    this.textContent = running ? '\u2590\u2590 Pause' : '\u25B6 Play';
    this.classList.toggle('playing', !running);
  });

  /* Speed scale */
  $('#speed-slider').addEventListener('input', function () {
    speedScale = +this.value;
    $('#speed-val').textContent = speedScale.toFixed(2) + 'x';
  });

  /* Ensure num/label show current default */
  $('#speed-slider').value = speedScale;
  $('#speed-val').textContent = speedScale.toFixed(2) + 'x';

  /* Display toggles */
  function bindToggle(id, setter) {
    $(id).addEventListener('change', function () { setter(this.checked); render(); });
  }
  bindToggle('#tg-pitch', function (v) { showPitch = v; });
  bindToggle('#tg-dims', function (v) { showDims = v; });
  bindToggle('#tg-arrows', function (v) { showArrows = v; });
  bindToggle('#tg-labels', function (v) { showLabels = v; });
  bindToggle('#tg-grid', function (v) { showGrid = v; });

  /* ================================================================
     UI — PRESETS
     ================================================================ */
  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.dataset.type;
      trainType = type;
      if (type === 'worm') {
        wormStarts = +btn.dataset.a;
      } else {
        teethA = +btn.dataset.a;
      }
      teethB = +btn.dataset.b;
      inputRPM = +btn.dataset.rpm;
      teethC = +btn.dataset.c;
      teethD = +btn.dataset.d;

      $$('#train-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.train === type); });
      applyTrainTypeUI();

      /* Update all paired controls */
      $('#teeth-b-slider').value = teethB; $('#teeth-b-num').value = teethB;
      $('#rpm-slider').value = inputRPM;   $('#rpm-num').value = inputRPM;
      $('#teeth-c-slider').value = teethC; $('#teeth-c-num').value = teethC;
      $('#teeth-d-slider').value = teethD; $('#teeth-d-num').value = teethD;

      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      updateReadouts();
    });
  });

  /* ================================================================
     CANVAS POINTER — click gear to highlight
     ================================================================ */
  cvs.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    /* No dragging logic needed for gear simulator */
  });

  /* ================================================================
     EXPLORE MODE
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

  $('#cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    selCat = e.target.dataset.cat;
    selConcept = 0;
    $$('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildConceptGrid();
    render();
  });

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

  $('#pp-check').addEventListener('click', function () {
    if (pAnswered || !pProblem) return;
    pAnswered = true;
    pTotal++;
    var val = parseFloat($('#pp-input').value);
    var tol = Math.max(Math.abs(pProblem.answer) * 0.02, 0.5);
    var ok = !isNaN(val) && Math.abs(val - pProblem.answer) <= tol;
    if (ok) { pScore++; }
    $('#pp-feedback').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect \u2014 answer: ' + pProblem.answer + ' ' + pProblem.unit;
    $('#pp-feedback').className = 'feedback ' + (ok ? 'ok' : 'err');
    $('#pp-input').disabled = true;
    show($('#pp-next'));
    /* Show solution */
    var solEl = $('#pp-solution');
    solEl.innerHTML = '<h4>Step-by-Step Solution</h4>' +
      pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([0-9.]+)/, '= <strong>$1</strong>') + '</p>'; }).join('');
    show(solEl);
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
  });

  $('#pp-next').addEventListener('click', newPractice);

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    quizScore = 0; quizIdx = 0; quizAnswered = false;
    quizQs = shuffleArr(QUIZ_POOL).slice(0, 5);
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
        '<div class="quiz-input-row"><input class="qi-input" id="qi-val" type="number" step="any" placeholder="Your answer"><span class="qi-unit">' + q.unit + '</span>' +
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
    var tol = Math.max(Math.abs(q.answer) * 0.02, 0.5);
    var ok = !isNaN(val) && Math.abs(val - q.answer) <= tol;
    if (ok) quizScore++;
    q._given = isNaN(val) ? 'No answer' : val;
    q._ok = ok;
    panel.querySelector('#qfb').textContent = ok ? '\u2714 Correct!' : '\u2718 Answer: ' + q.answer + ' ' + q.unit;
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
          : '<strong>Your answer:</strong> ' + q._given + ' &nbsp;|&nbsp; <strong>Correct:</strong> ' + q.answer + ' ' + q.unit;
        return '<div class="qr-row ' + rowCls + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + detail + '</span><span class="qr-mark">' + mark + '</span></div>';
      }).join('') +
      '</div>' +
      '<button class="btn btn-primary" id="qr-retry" style="align-self:flex-start;">New Quiz</button>';
    el.querySelector('#qr-retry').addEventListener('click', startQuiz);
    show(el);
  }

  /* ================================================================
     UNIT TOGGLE
     ================================================================ */
  $('#unit-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    unitSys = e.target.dataset.unit;
    $$('#unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    updateReadouts();
    render();
  });

  /* ================================================================
     CALC MODAL — step-by-step derivations
     ================================================================ */
  function buildCalcHTML() {
    var gr = gearRatio();
    var outRPM_ = outputRPM();
    var omega = (2 * Math.PI * inputRPM) / 60;
    var tIn = inputTorque();
    var eff = (trainType === 'worm') ? wormEff : 0.97;
    var tOut = outputTorque();
    var rows = [];

    rows.push('<h4>1. Gear Ratio (GR)</h4>');
    if (trainType === 'simple') {
      rows.push('<div class="calc-step">\\[ GR = \\dfrac{N_B}{N_A} \\]</div>');
      rows.push('<div class="calc-step">GR = ' + teethB + ' / ' + teethA + ' = <strong>' + roundN(gr, 3) + ':1</strong></div>');
    } else if (trainType === 'idler') {
      rows.push('<div class="calc-step">Idler changes direction only, not magnitude.</div>');
      rows.push('<div class="calc-step">GR = N<sub>B</sub> / N<sub>A</sub> = ' + teethB + ' / ' + teethA + ' = <strong>' + roundN(gr, 3) + ':1</strong></div>');
    } else if (trainType === 'compound') {
      rows.push('<div class="calc-step">GR<sub>1</sub> = N<sub>B</sub>/N<sub>A</sub> = ' + teethB + '/' + teethA + ' = ' + roundN(teethB / teethA, 3) + '</div>');
      rows.push('<div class="calc-step">GR<sub>2</sub> = N<sub>D</sub>/N<sub>C</sub> = ' + teethD + '/' + teethC + ' = ' + roundN(teethD / teethC, 3) + '</div>');
      rows.push('<div class="calc-step">GR = GR<sub>1</sub> × GR<sub>2</sub> = <strong>' + roundN(gr, 3) + ':1</strong></div>');
    } else if (trainType === 'worm') {
      rows.push('<div class="calc-step">\\[ GR = \\dfrac{N_{\\text{wheel}}}{N_{\\text{starts}}} \\]</div>');
      rows.push('<div class="calc-step">GR = ' + teethB + ' / ' + wormStarts + ' = <strong>' + roundN(gr, 3) + ':1</strong></div>');
    }

    rows.push('<h4>2. Output RPM</h4>');
    rows.push('<div class="calc-step">\\[ \\text{RPM}_{\\text{out}} = \\dfrac{\\text{RPM}_{\\text{in}}}{GR} \\]</div>');
    rows.push('<div class="calc-step">RPM<sub>out</sub> = RPM<sub>in</sub> / GR = ' + inputRPM + ' / ' + roundN(gr, 3) + ' = <strong>' + roundN(outRPM_, 2) + ' rpm</strong></div>');

    rows.push('<h4>3. Input Torque from Power</h4>');
    rows.push('<div class="calc-step">\\[ \\omega = \\dfrac{2\\pi \\cdot n}{60},\\quad T_{\\text{in}} = \\dfrac{P}{\\omega} \\]</div>');
    rows.push('<div class="calc-step">ω = 2π·n/60 = 2π × ' + inputRPM + ' / 60 = ' + roundN(omega, 3) + ' rad/s</div>');
    rows.push('<div class="calc-step">T<sub>in</sub> = P / ω = ' + inputPower + ' / ' + roundN(omega, 3) + ' = <strong>' + roundN(tIn, 2) + ' Nm</strong>' + (unitSys === 'imp' ? ' &nbsp;(' + roundN(tIn / NM_PER_LBFT, 2) + ' lbf·ft)' : '') + '</div>');

    rows.push('<h4>4. Output Torque (with efficiency)</h4>');
    rows.push('<div class="calc-step">\\[ T_{\\text{out}} = T_{\\text{in}} \\cdot GR \\cdot \\eta \\]</div>');
    rows.push('<div class="calc-step">η (' + (trainType === 'worm' ? 'worm, adjustable' : 'spur/compound typical') + ') = ' + roundN(eff * 100, 0) + ' %</div>');
    rows.push('<div class="calc-step">T<sub>out</sub> = T<sub>in</sub> × GR × η = ' + roundN(tIn, 2) + ' × ' + roundN(gr, 3) + ' × ' + roundN(eff, 2) + ' = <strong>' + roundN(tOut, 2) + ' Nm</strong>' + (unitSys === 'imp' ? ' &nbsp;(' + roundN(tOut / NM_PER_LBFT, 2) + ' lbf·ft)' : '') + '</div>');

    rows.push('<h4>5. Geometry</h4>');
    rows.push('<div class="calc-step">Module m = ' + fmtLen(gearModule) + '</div>');
    rows.push('<div class="calc-step">PCD<sub>A</sub> = m × N<sub>A</sub> = ' + (trainType === 'worm' ? '(worm)' : fmtLen(gearModule * teethA)) + '</div>');
    rows.push('<div class="calc-step">PCD<sub>B</sub> = m × N<sub>B</sub> = ' + fmtLen(gearModule * teethB) + '</div>');
    if (trainType !== 'worm') {
      rows.push('<div class="calc-step">Centre distance = (PCD<sub>A</sub> + PCD<sub>B</sub>) / 2 = <strong>' + fmtLen(centerDistance()) + '</strong></div>');
    }

    var ws = warnings();
    if (ws.length) {
      rows.push('<h4>Warnings</h4>');
      ws.forEach(function (w) { rows.push('<div class="calc-note">⚠ ' + w.text + '</div>'); });
    }
    return rows.join('');
  }
  function openCalcModal() {
    $('#calc-modal-body').innerHTML = buildCalcHTML();
    $('#calc-modal').classList.add('open');
    $('#calc-modal').setAttribute('aria-hidden', 'false');
  }
  function closeCalcModal() {
    $('#calc-modal').classList.remove('open');
    $('#calc-modal').setAttribute('aria-hidden', 'true');
  }
  $('#btn-calc').addEventListener('click', openCalcModal);
  $('#calc-modal-close').addEventListener('click', closeCalcModal);
  $('#calc-modal').addEventListener('click', function (e) { if (e.target === this) closeCalcModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeCalcModal(); hideCtx(); }
  });

  /* ================================================================
     EXPORTS — PNG (canvas) and CSV (readouts)
     ================================================================ */
  function exportPNG() {
    var link = document.createElement('a');
    link.download = 'gear-train_' + trainType + '_' + Date.now() + '.png';
    link.href = cvs.toDataURL('image/png');
    link.click();
  }
  function csvRows() {
    var gr = gearRatio(), tIn = inputTorque(), tOut = outputTorque();
    var lu = unitLen(), tu = unitTorque();
    var rows = [
      ['Parameter', 'Value', 'Unit'],
      ['Train Type', trainType, ''],
      ['Gear Ratio', roundN(gr, 3), ':1'],
      ['Input RPM', inputRPM, 'rpm'],
      ['Output RPM', roundN(outputRPM(), 2), 'rpm'],
      ['Input Power', inputPower / 1000, 'kW'],
      ['Input Torque', unitSys === 'imp' ? roundN(tIn / NM_PER_LBFT, 3) : roundN(tIn, 3), tu],
      ['Output Torque', unitSys === 'imp' ? roundN(tOut / NM_PER_LBFT, 3) : roundN(tOut, 3), tu],
      ['Module', fmtLenValOnly(gearModule), lu],
      ['Teeth A / Starts', (trainType === 'worm' ? wormStarts : teethA), 'T'],
      ['Teeth B', teethB, 'T']
    ];
    if (trainType === 'compound') {
      rows.push(['Teeth C', teethC, 'T']);
      rows.push(['Teeth D', teethD, 'T']);
    }
    if (trainType === 'idler') rows.push(['Idler Teeth', teethIdler, 'T']);
    if (trainType === 'worm') rows.push(['Efficiency', Math.round(wormEff * 100), '%']);
    rows.push(['PCD (Gear B)', fmtLenValOnly(pitchCircleD(teethB)), lu]);
    if (trainType !== 'worm') rows.push(['Centre Distance', fmtLenValOnly(centerDistance()), lu]);
    return rows;
  }
  function exportCSV() {
    var csv = csvRows().map(function (r) {
      return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.download = 'gear-train_' + trainType + '_' + Date.now() + '.csv';
    link.href = url;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 100);
  }
  function copyReadouts() {
    var txt = csvRows().map(function (r) { return r.join('\t'); }).join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
  }
  $('#btn-export-png').addEventListener('click', exportPNG);
  $('#btn-export-csv').addEventListener('click', exportCSV);

  /* ================================================================
     CONTEXT MENU (right-click / long-press on canvas)
     ================================================================ */
  function showCtx(x, y) {
    var m = $('#ctx-menu');
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    var mw = m.offsetWidth, mh = m.offsetHeight;
    var vw = window.innerWidth, vh = window.innerHeight;
    m.style.left = Math.min(x, vw - mw - 8) + 'px';
    m.style.top = Math.min(y, vh - mh - 8) + 'px';
  }
  function hideCtx() {
    $('#ctx-menu').classList.remove('open');
    $('#ctx-menu').setAttribute('aria-hidden', 'true');
  }
  cvs.addEventListener('contextmenu', function (e) {
    if (mode !== 'simulate') return;
    e.preventDefault();
    showCtx(e.clientX, e.clientY);
  });
  /* Touch long-press */
  var lpTimer = null;
  cvs.addEventListener('touchstart', function (e) {
    if (mode !== 'simulate' || e.touches.length !== 1) return;
    var t = e.touches[0];
    lpTimer = setTimeout(function () { showCtx(t.clientX, t.clientY); }, 600);
  }, { passive: true });
  cvs.addEventListener('touchend', function () { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });
  cvs.addEventListener('touchmove', function () { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; } });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#ctx-menu') && !e.target.closest('#sim-canvas')) hideCtx();
  });

  function resetToDefault() {
    trainType = 'simple';
    teethA = 20; teethB = 40; teethC = 15; teethD = 45; teethIdler = 25; wormStarts = 1;
    inputRPM = 600; inputPower = 2000; gearModule = 3; wormEff = 0.70; speedScale = 0.1;
    showPitch = showDims = showArrows = showLabels = showGrid = true;
    running = true;
    $('#teeth-a-slider').value = 20; $('#teeth-a-num').value = 20;
    $('#teeth-b-slider').value = 40; $('#teeth-b-num').value = 40;
    $('#teeth-c-slider').value = 15; $('#teeth-c-num').value = 15;
    $('#teeth-d-slider').value = 45; $('#teeth-d-num').value = 45;
    $('#idler-slider').value = 25; $('#idler-num').value = 25;
    $('#rpm-slider').value = 600; $('#rpm-num').value = 600;
    $('#power-slider').value = 2; $('#power-num').value = 2;
    $('#module-slider').value = 3; $('#module-num').value = 3;
    $('#eff-slider').value = 70; $('#eff-num').value = 70;
    $('#speed-slider').value = 0.1; $('#speed-val').textContent = '0.10x';
    ['#tg-pitch', '#tg-dims', '#tg-arrows', '#tg-labels', '#tg-grid'].forEach(function (id) { $(id).checked = true; });
    $('#play-pause').textContent = '▐▐ Pause'; $('#play-pause').classList.remove('playing');
    $$('#train-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.train === 'simple'); });
    applyTrainTypeUI();
    updateReadouts();
  }

  $('#ctx-menu').addEventListener('click', function (e) {
    if (!e.target.matches('.ctx-item')) return;
    var act = e.target.dataset.ctx;
    hideCtx();
    if (act === 'png') exportPNG();
    else if (act === 'csv') exportCSV();
    else if (act === 'copy') copyReadouts();
    else if (act === 'calc') openCalcModal();
    else if (act === 'toggle-grid') { showGrid = !showGrid; $('#tg-grid').checked = showGrid; render(); }
    else if (act === 'reset') resetToDefault();
  });

  /* Action-bar Reset button */
  $('#btn-reset').addEventListener('click', resetToDefault);

  /* ================================================================
     INIT
     ================================================================ */
  updateReadouts();
  setMode('simulate');

})();
