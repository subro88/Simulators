(function () {
  'use strict';

  /* ================================================================
     SECTION 1: CONSTANTS & HELPERS
     ================================================================ */
  var PI  = Math.PI;
  var TAU = 2 * PI;
  var DEG = 180 / PI;
  var RAD = PI / 180;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randFloat(lo, hi) { return lo + Math.random() * (hi - lo); }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function $(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  /* ================================================================
     SECTION 2: CONCEPTS (12 items, 3 categories)
     ================================================================ */
  var CONCEPTS = [
    /* ── Basics (4) ─────────────────────────────────────────────── */
    {
      id: 'slider-crank-mechanism', name: 'Slider-Crank Mechanism', symbol: '4-link chain',
      formula: 'DOF = 3(n\u22121) \u2212 2j\u2081 \u2212 j\u2082', unit: 'DOF',
      cat: 'basics',
      desc: 'A slider-crank mechanism is a four-link kinematic chain consisting of a crank (link 2), a connecting rod / coupler (link 3), a slider / piston (link 4), and the fixed frame (link 1). It has three revolute joints (at the crank pivot, crank pin, and wrist pin) and one prismatic joint (slider on the guide). With one degree of freedom, a single input (crank rotation) fully defines the motion of all links. This mechanism converts rotary motion to reciprocating linear motion (or vice versa) and is the basis of internal combustion engines, compressors, and pumps.',
      example: {
        problem: 'Calculate the DOF of a slider-crank mechanism using Grubler\'s equation.',
        steps: [
          'n = 4 links (crank, connecting rod, slider, ground/frame)',
          'j\u2081 = 3 revolute joints + 1 prismatic joint = 4 full joints',
          'j\u2082 = 0 half joints',
          'DOF = 3(n\u22121) \u2212 2j\u2081 \u2212 j\u2082',
          'DOF = 3(4\u22121) \u2212 2(4) \u2212 0 = 9 \u2212 8 = 1'
        ],
        answer: 1, unit: 'DOF'
      }
    },
    {
      id: 'crank-connecting-rod', name: 'Crank & Connecting Rod', symbol: 'n = l/r',
      formula: 'n = l / r', unit: '\u2014',
      cat: 'basics',
      desc: 'The crank (length r) rotates about a fixed pivot and drives the connecting rod (length l). The connecting rod ratio n = l/r is a critical design parameter. For automotive engines, n typically ranges from 2.5 to 5 (commonly 3 to 4). A higher ratio produces more sinusoidal piston motion with lower secondary accelerations, but requires a taller engine block. A lower ratio increases the second-harmonic contribution, creating asymmetric velocity and acceleration profiles. The ratio also affects side thrust on the cylinder walls.',
      example: {
        problem: 'A crank has radius r = 50 mm and the connecting rod length is l = 175 mm. Find the connecting rod ratio n.',
        steps: [
          'n = l / r',
          'n = 175 / 50',
          'n = 3.5'
        ],
        answer: 3.5, unit: ''
      }
    },
    {
      id: 'stroke-dead-centers', name: 'Stroke & Dead Centres', symbol: 'S = 2r',
      formula: 'S = 2r (inline)', unit: 'mm',
      cat: 'basics',
      desc: 'The stroke S is the total linear distance the piston travels between its two extreme positions. For an inline slider-crank (no offset), S = 2r where r is the crank radius. The extreme positions are called dead centres: Top Dead Centre (TDC) occurs at crank angle \u03b8 = 0\u00b0 when the crank and connecting rod are fully extended (piston farthest from crank pivot). Bottom Dead Centre (BDC) occurs at \u03b8 = 180\u00b0 when the crank folds back (piston closest to crank pivot). At dead centres, the piston velocity is momentarily zero and the mechanism is in a singular configuration.',
      example: {
        problem: 'A crank has radius r = 45 mm. Find the stroke for an inline slider-crank.',
        steps: [
          'For inline (e = 0): S = 2r',
          'S = 2 \u00d7 45',
          'S = 90 mm'
        ],
        answer: 90, unit: 'mm'
      }
    },
    {
      id: 'inversions', name: 'Four Inversions', symbol: 'Fix different links',
      formula: '4 links \u2192 4 inversions', unit: '\u2014',
      cat: 'basics',
      desc: 'A kinematic inversion is obtained by fixing a different link in the kinematic chain while allowing all others to move. The slider-crank chain has 4 inversions:\n\n1st Inversion (fix frame): The standard IC engine mechanism \u2014 crank rotates, piston reciprocates.\n\n2nd Inversion (fix crank): Whitworth quick-return mechanism (shaper machines) and rotary engine (Gnome engine in early aircraft).\n\n3rd Inversion (fix connecting rod): Oscillating cylinder engine \u2014 the cylinder oscillates about a fixed pivot as the crank rotates within it.\n\n4th Inversion (fix slider): Hand pump / pendulum pump \u2014 the guide is fixed, and the cylinder with crank oscillates about it.',
      example: {
        problem: 'Which inversion of the slider-crank is used in a Whitworth quick-return mechanism?',
        steps: [
          'In Whitworth quick-return, the crank link is fixed.',
          'The driving crank (what was the frame) rotates.',
          'This is achieved by fixing the link that was the crank.',
          'This is the 2nd inversion of the slider-crank chain.'
        ],
        answer: '2nd inversion', unit: ''
      }
    },

    /* ── Kinematics (4) ──────────────────────────────────────────── */
    {
      id: 'piston-displacement', name: 'Piston Displacement', symbol: 'x(\u03b8)',
      formula: 'x = r\u00b7cos\u03b8 + \u221a(l\u00b2 \u2212 r\u00b2sin\u00b2\u03b8)', unit: 'mm',
      cat: 'kinematics',
      desc: 'The instantaneous displacement of the piston from the crank pivot for an inline slider-crank is x = r\u00b7cos\u03b8 + \u221a(l\u00b2 \u2212 r\u00b2\u00b7sin\u00b2\u03b8). This expression comes from the geometric constraint that the connecting rod must close the triangle formed by the crank and the slider position. The displacement is maximum (x = r + l) at \u03b8 = 0\u00b0 (TDC) and minimum (x = l \u2212 r) at \u03b8 = 180\u00b0 (BDC). The motion is approximately sinusoidal but contains higher harmonics, especially the second harmonic term r/(4l) \u00d7 cos(2\u03b8).',
      example: {
        problem: 'Find the piston displacement when r = 40 mm, l = 120 mm, and \u03b8 = 60\u00b0.',
        steps: [
          'x = r\u00b7cos\u03b8 + \u221a(l\u00b2 \u2212 r\u00b2sin\u00b2\u03b8)',
          'cos 60\u00b0 = 0.5, sin 60\u00b0 = 0.8660',
          'r\u00b7cos\u03b8 = 40 \u00d7 0.5 = 20 mm',
          'l\u00b2 \u2212 r\u00b2sin\u00b2\u03b8 = 14400 \u2212 1600 \u00d7 0.75 = 14400 \u2212 1200 = 13200',
          '\u221a13200 = 114.89 mm',
          'x = 20 + 114.89 = 134.89 mm'
        ],
        answer: 134.89, unit: 'mm'
      }
    },
    {
      id: 'piston-velocity', name: 'Piston Velocity', symbol: 'v(\u03b8)',
      formula: 'v = \u2212r\u03c9(sin\u03b8 + r\u00b7sin2\u03b8/(2l))', unit: 'mm/s',
      cat: 'kinematics',
      desc: 'The piston velocity is obtained by differentiating the displacement with respect to time. The approximate formula (valid for moderate l/r) is v = \u2212r\u03c9[sin\u03b8 + r\u00b7sin(2\u03b8)/(2l)], where \u03c9 = 2\u03c0N/60 is the crank angular velocity in rad/s. The first term r\u03c9\u00b7sin\u03b8 is the fundamental (first harmonic) and produces maximum velocity at \u03b8 = 90\u00b0 and 270\u00b0. The second term r\u00b2\u03c9\u00b7sin(2\u03b8)/(2l) is the second harmonic, which shifts the maximum velocity slightly before 90\u00b0 (typically around 75\u201380\u00b0). The velocity is zero at TDC and BDC.',
      example: {
        problem: 'Find the piston velocity when r = 40 mm, l = 120 mm, \u03b8 = 90\u00b0, and \u03c9 = 20 rad/s.',
        steps: [
          'v = \u2212r\u03c9(sin\u03b8 + r\u00b7sin2\u03b8/(2l))',
          'sin 90\u00b0 = 1, sin 180\u00b0 = 0',
          'v = \u2212(40)(20)(1 + 40 \u00d7 0/(2 \u00d7 120))',
          'v = \u2212800(1 + 0)',
          'v = \u2212800 mm/s'
        ],
        answer: -800, unit: 'mm/s'
      }
    },
    {
      id: 'piston-acceleration', name: 'Piston Acceleration', symbol: 'a(\u03b8)',
      formula: 'a = \u2212r\u03c9\u00b2(cos\u03b8 + r\u00b7cos2\u03b8/l)', unit: 'mm/s\u00b2',
      cat: 'kinematics',
      desc: 'The piston acceleration is obtained by differentiating the velocity. The approximate formula is a = \u2212r\u03c9\u00b2[cos\u03b8 + r\u00b7cos(2\u03b8)/l]. The first term r\u03c9\u00b2cos\u03b8 is the primary (first-order) inertia force component. The second term r\u00b2\u03c9\u00b2cos(2\u03b8)/l is the secondary (second-order) component. Maximum acceleration occurs at TDC (\u03b8 = 0\u00b0): a_max = r\u03c9\u00b2(1 + r/l). At BDC (\u03b8 = 180\u00b0): a = r\u03c9\u00b2(\u22121 + r/l). The acceleration profile determines the inertia forces on the piston, critical for engine balancing and bearing loads.',
      example: {
        problem: 'Find the piston acceleration at TDC when r = 40 mm, l = 120 mm, \u03c9 = 20 rad/s.',
        steps: [
          'a = \u2212r\u03c9\u00b2(cos\u03b8 + r\u00b7cos2\u03b8/l)',
          'At TDC, \u03b8 = 0\u00b0: cos0 = 1, cos0 = 1',
          'a = \u221240 \u00d7 400 \u00d7 (1 + 40/120)',
          'a = \u221216000 \u00d7 (1 + 0.333)',
          'a = \u221216000 \u00d7 1.333 = \u221221333 mm/s\u00b2'
        ],
        answer: -21333, unit: 'mm/s\u00b2'
      }
    },
    {
      id: 'quick-return-ratio', name: 'Quick-Return Ratio', symbol: 'TR',
      formula: 'TR = (360\u00b0 \u2212 2\u03b1) / (2\u03b1)', unit: '\u2014',
      cat: 'kinematics',
      desc: 'The time ratio (or quick-return ratio) is the ratio of time for the forward (cutting) stroke to the return (idle) stroke. For an offset slider-crank: the crank rotates at constant speed, but the piston spends more time on one stroke than the other. For the Whitworth mechanism (2nd inversion), TR = (360\u00b0 \u2212 2\u03b1)/(2\u03b1) where \u03b1 = arcsin(d/l) relates the offset geometry. A higher TR means a faster return stroke, which is desirable in shaper machines to waste less time on the non-cutting return. Typical shaper machines have TR between 1.5 and 2.0.',
      example: {
        problem: 'In a Whitworth mechanism, the cutting stroke occupies 220\u00b0 of crank rotation. Find the time ratio.',
        steps: [
          'Cutting stroke angle = 220\u00b0',
          'Return stroke angle = 360\u00b0 \u2212 220\u00b0 = 140\u00b0',
          'TR = cutting / return',
          'TR = 220 / 140',
          'TR = 1.571'
        ],
        answer: 1.571, unit: ''
      }
    },

    /* ── Design & Applications (4) ──────────────────────────────── */
    {
      id: 'offset-slider-crank', name: 'Offset Slider-Crank', symbol: 'e \u2260 0',
      formula: 'x = r\u00b7cos\u03b8 + \u221a(l\u00b2 \u2212 (r\u00b7sin\u03b8 \u2212 e)\u00b2)', unit: 'mm',
      cat: 'design',
      desc: 'An offset (or eccentric) slider-crank has the slider path displaced by a distance e from the crank pivot axis. This eccentricity creates stroke asymmetry: the forward and return strokes cover different crank angles. The displacement becomes x = r\u00b7cos\u03b8 + \u221a(l\u00b2 \u2212 (r\u00b7sin\u03b8 \u2212 e)\u00b2). Effects of offset: (1) Unequal time for forward/return strokes, producing a quick-return effect; (2) Stroke length changes from 2r; (3) Different force distribution between strokes. Offset is used in some engine designs to reduce piston side thrust during the power stroke.',
      example: {
        problem: 'What effect does adding an offset e to a slider-crank have on the stroke?',
        steps: [
          'With offset, stroke \u2260 2r',
          'The slider path is shifted by e from the crank axis',
          'TDC and BDC positions change asymmetrically',
          'One stroke takes more crank rotation than the other',
          'This produces a quick-return effect'
        ],
        answer: 'Asymmetric stroke with quick-return effect', unit: ''
      }
    },
    {
      id: 'connecting-rod-ratio', name: 'Connecting Rod Ratio Effect', symbol: 'n = l/r',
      formula: 'Higher n \u2192 more sinusoidal motion', unit: '\u2014',
      cat: 'design',
      desc: 'The connecting rod ratio n = l/r profoundly affects the piston motion characteristics. As n increases: (1) The second-harmonic content decreases \u2014 displacement approaches a pure cosine wave; (2) Maximum piston velocity approaches r\u03c9 and occurs closer to \u03b8 = 90\u00b0; (3) Maximum acceleration decreases and becomes more symmetric between TDC and BDC; (4) The connecting rod angle \u03c6 decreases, reducing side thrust on cylinder walls. The trade-off is that a longer connecting rod requires a taller engine. In the limiting case n \u2192 \u221e, piston motion would be perfectly sinusoidal (simple harmonic motion).',
      example: {
        problem: 'Compare the second-harmonic amplitude for n = 2 versus n = 4.',
        steps: [
          'Second harmonic amplitude \u221d r/(4l) = 1/(4n)',
          'For n = 2: 1/(4 \u00d7 2) = 0.125 = 12.5% of fundamental',
          'For n = 4: 1/(4 \u00d7 4) = 0.0625 = 6.25% of fundamental',
          'n = 4 has half the second-harmonic distortion'
        ],
        answer: 'n=4 has half the harmonic distortion of n=2', unit: ''
      }
    },
    {
      id: 'ic-engine-app', name: 'IC Engine Application', symbol: 'Bore, Stroke, CR',
      formula: 'V_swept = (\u03c0/4) \u00d7 D\u00b2 \u00d7 S', unit: 'mm\u00b3',
      cat: 'design',
      desc: 'The slider-crank is the heart of every reciprocating internal combustion engine. Key parameters: Bore (D) is the cylinder diameter. Stroke (S = 2r) is the piston travel distance. Swept volume V_s = (\u03c0/4)D\u00b2S. Compression ratio CR = (V_s + V_c)/V_c where V_c is the clearance volume. An engine is called "square" when bore equals stroke, "over-square" when D > S (higher RPM capability), and "under-square" when D < S (higher torque). Modern automotive engines typically have compression ratios of 9:1 to 13:1 for petrol and 15:1 to 22:1 for diesel.',
      example: {
        problem: 'An engine has bore D = 80 mm and stroke S = 90 mm. Find the swept volume per cylinder.',
        steps: [
          'V_swept = (\u03c0/4) \u00d7 D\u00b2 \u00d7 S',
          'V_swept = (\u03c0/4) \u00d7 80\u00b2 \u00d7 90',
          'V_swept = 0.7854 \u00d7 6400 \u00d7 90',
          'V_swept = 452,389 mm\u00b3 \u2248 452.4 cm\u00b3'
        ],
        answer: 452389, unit: 'mm\u00b3'
      }
    },
    {
      id: 'other-applications', name: 'Other Applications', symbol: 'Shaper, Pump, etc.',
      formula: 'Various inversions \u2192 different machines', unit: '\u2014',
      cat: 'design',
      desc: 'Beyond IC engines, the slider-crank chain and its inversions appear in numerous machines:\n\n(1) Compressors & pumps: 1st inversion \u2014 motor drives crank, piston compresses gas/fluid.\n(2) Shaper machines: 2nd inversion (Whitworth quick-return) \u2014 the cutting tool advances slowly during the cutting stroke and returns quickly.\n(3) Rotary engines: 2nd inversion (Gnome rotary) \u2014 the crankshaft is fixed and the cylinder block rotates around it, used in WWI aircraft.\n(4) Oscillating cylinder steam engines: 3rd inversion \u2014 compact steam engines used in ships and early locomotives.\n(5) Hand pumps / pendulum pumps: 4th inversion \u2014 the guide is fixed, and the cylinder oscillates to pump water.',
      example: {
        problem: 'Which inversion of the slider-crank is used in a hand pump?',
        steps: [
          'In a hand pump, the slider guide is fixed.',
          'The cylinder oscillates about the fixed guide.',
          'The crank drives the oscillation.',
          'Fixing the slider (link 4) gives the 4th inversion.'
        ],
        answer: '4th inversion', unit: ''
      }
    }
  ];

  /* ================================================================
     SECTION 3: PROBLEM GENERATORS (12 functions)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0: Stroke from r */
    function () {
      var r = randInt(25, 60);
      var S = 2 * r;
      return {
        prompt: 'A slider-crank has crank radius r = ' + r + ' mm with no offset. Find the stroke S.',
        steps: [
          'For inline slider-crank (e = 0): S = 2r',
          'S = 2 \u00d7 ' + r,
          'S = ' + S + ' mm'
        ],
        answer: S, unit: 'mm', type: 'number'
      };
    },
    /* 1: Displacement at theta */
    function () {
      var r = randInt(30, 50);
      var l = randInt(100, 160);
      while (l / r < 2) l = randInt(100, 160);
      var angles = [30, 45, 60, 90, 120, 150];
      var thetaDeg = angles[randInt(0, angles.length - 1)];
      var theta = thetaDeg * RAD;
      var x = r * Math.cos(theta) + Math.sqrt(l * l - r * r * Math.sin(theta) * Math.sin(theta));
      x = Math.round(x * 100) / 100;
      return {
        prompt: 'Find the piston displacement x when r = ' + r + ' mm, l = ' + l + ' mm, \u03b8 = ' + thetaDeg + '\u00b0 (inline).',
        steps: [
          'x = r\u00b7cos\u03b8 + \u221a(l\u00b2 \u2212 r\u00b2sin\u00b2\u03b8)',
          'r\u00b7cos\u03b8 = ' + r + ' \u00d7 ' + (Math.cos(theta)).toFixed(4) + ' = ' + (r * Math.cos(theta)).toFixed(2),
          'l\u00b2 \u2212 r\u00b2sin\u00b2\u03b8 = ' + (l * l) + ' \u2212 ' + (r * r * Math.sin(theta) * Math.sin(theta)).toFixed(2) + ' = ' + (l * l - r * r * Math.sin(theta) * Math.sin(theta)).toFixed(2),
          '\u221a(' + (l * l - r * r * Math.sin(theta) * Math.sin(theta)).toFixed(2) + ') = ' + Math.sqrt(l * l - r * r * Math.sin(theta) * Math.sin(theta)).toFixed(2),
          'x = ' + x + ' mm'
        ],
        answer: x, unit: 'mm', type: 'number'
      };
    },
    /* 2: Connecting rod angle */
    function () {
      var r = randInt(30, 50);
      var l = randInt(100, 160);
      while (l / r < 2) l = randInt(100, 160);
      var angles = [30, 45, 60, 90, 120];
      var thetaDeg = angles[randInt(0, angles.length - 1)];
      var theta = thetaDeg * RAD;
      var sinPhi = r * Math.sin(theta) / l;
      var phi = Math.asin(sinPhi) * DEG;
      phi = Math.round(phi * 100) / 100;
      return {
        prompt: 'Find the connecting rod angle \u03c6 when r = ' + r + ' mm, l = ' + l + ' mm, \u03b8 = ' + thetaDeg + '\u00b0.',
        steps: [
          'sin\u03c6 = r\u00b7sin\u03b8 / l',
          'sin\u03c6 = ' + r + ' \u00d7 ' + Math.sin(theta).toFixed(4) + ' / ' + l,
          'sin\u03c6 = ' + sinPhi.toFixed(4),
          '\u03c6 = arcsin(' + sinPhi.toFixed(4) + ') = ' + phi + '\u00b0'
        ],
        answer: phi, unit: '\u00b0', type: 'number'
      };
    },
    /* 3: Velocity */
    function () {
      var r = randInt(30, 50);
      var l = randInt(100, 160);
      while (l / r < 2) l = randInt(100, 160);
      var angles = [30, 45, 60, 90, 120, 150];
      var thetaDeg = angles[randInt(0, angles.length - 1)];
      var theta = thetaDeg * RAD;
      var rpm = randInt(10, 40) * 5;
      var omega = rpm * TAU / 60;
      var v = -r * omega * (Math.sin(theta) + r * Math.sin(2 * theta) / (2 * l));
      v = Math.round(v * 100) / 100;
      return {
        prompt: 'Find piston velocity: r = ' + r + ' mm, l = ' + l + ' mm, \u03b8 = ' + thetaDeg + '\u00b0, N = ' + rpm + ' RPM.',
        steps: [
          '\u03c9 = 2\u03c0N/60 = 2\u03c0 \u00d7 ' + rpm + '/60 = ' + (omega).toFixed(3) + ' rad/s',
          'v = \u2212r\u03c9(sin\u03b8 + r\u00b7sin2\u03b8/(2l))',
          'sin\u03b8 = ' + Math.sin(theta).toFixed(4) + ', sin2\u03b8 = ' + Math.sin(2 * theta).toFixed(4),
          'v = \u2212' + r + ' \u00d7 ' + omega.toFixed(3) + ' \u00d7 (' + Math.sin(theta).toFixed(4) + ' + ' + r + ' \u00d7 ' + Math.sin(2 * theta).toFixed(4) + ' / (2 \u00d7 ' + l + '))',
          'v = ' + v + ' mm/s'
        ],
        answer: v, unit: 'mm/s', type: 'number'
      };
    },
    /* 4: Acceleration */
    function () {
      var r = randInt(30, 50);
      var l = randInt(100, 160);
      while (l / r < 2) l = randInt(100, 160);
      var angles = [0, 30, 60, 90, 120, 180];
      var thetaDeg = angles[randInt(0, angles.length - 1)];
      var theta = thetaDeg * RAD;
      var rpm = randInt(10, 40) * 5;
      var omega = rpm * TAU / 60;
      var a = -r * omega * omega * (Math.cos(theta) + r * Math.cos(2 * theta) / l);
      a = Math.round(a * 100) / 100;
      return {
        prompt: 'Find piston acceleration: r = ' + r + ' mm, l = ' + l + ' mm, \u03b8 = ' + thetaDeg + '\u00b0, N = ' + rpm + ' RPM.',
        steps: [
          '\u03c9 = 2\u03c0 \u00d7 ' + rpm + '/60 = ' + omega.toFixed(3) + ' rad/s',
          'a = \u2212r\u03c9\u00b2(cos\u03b8 + r\u00b7cos2\u03b8/l)',
          '\u03c9\u00b2 = ' + (omega * omega).toFixed(2),
          'cos\u03b8 = ' + Math.cos(theta).toFixed(4) + ', cos2\u03b8 = ' + Math.cos(2 * theta).toFixed(4),
          'a = \u2212' + r + ' \u00d7 ' + (omega * omega).toFixed(2) + ' \u00d7 (' + Math.cos(theta).toFixed(4) + ' + ' + r + ' \u00d7 ' + Math.cos(2 * theta).toFixed(4) + ' / ' + l + ')',
          'a = ' + a + ' mm/s\u00b2'
        ],
        answer: a, unit: 'mm/s\u00b2', type: 'number'
      };
    },
    /* 5: l/r ratio */
    function () {
      var r = randInt(25, 55);
      var l = randInt(80, 200);
      while (l / r < 2) l = randInt(100, 200);
      var n = Math.round((l / r) * 100) / 100;
      return {
        prompt: 'A slider-crank has crank radius r = ' + r + ' mm and connecting rod length l = ' + l + ' mm. Find the connecting rod ratio n.',
        steps: [
          'n = l / r',
          'n = ' + l + ' / ' + r,
          'n = ' + n
        ],
        answer: n, unit: '', type: 'number'
      };
    },
    /* 6: Dead centres */
    function () {
      return {
        prompt: 'At what crank angles (in degrees) do dead centres occur for an inline slider-crank?',
        steps: [
          'TDC: crank and connecting rod fully extended \u2192 \u03b8 = 0\u00b0',
          'BDC: crank folded back \u2192 \u03b8 = 180\u00b0',
          'Dead centres occur at 0\u00b0 and 180\u00b0'
        ],
        answer: '0 and 180', unit: '\u00b0', type: 'text'
      };
    },
    /* 7: Time ratio for offset */
    function () {
      var e = randInt(5, 20);
      var r = randInt(30, 50);
      var l = randInt(100, 150);
      while (l / r < 2.5) l = randInt(100, 150);
      var scanRes = scanForStroke(r, l, e);
      var TR = Math.round(scanRes.tr * 1000) / 1000;
      return {
        prompt: 'An offset slider-crank has r = ' + r + ' mm, l = ' + l + ' mm, e = ' + e + ' mm. Find the time ratio (forward angle / return angle).',
        steps: [
          'Scan crank angles to find TDC and BDC positions',
          'TDC occurs at \u03b8 \u2248 ' + (scanRes.thetaMax * DEG).toFixed(1) + '\u00b0',
          'BDC occurs at \u03b8 \u2248 ' + (scanRes.thetaMin * DEG).toFixed(1) + '\u00b0',
          'Forward stroke angle = ' + (scanRes.fwdAngle * DEG).toFixed(1) + '\u00b0',
          'Return stroke angle = ' + (scanRes.retAngle * DEG).toFixed(1) + '\u00b0',
          'TR = ' + (scanRes.fwdAngle * DEG).toFixed(1) + ' / ' + (scanRes.retAngle * DEG).toFixed(1) + ' = ' + TR
        ],
        answer: TR, unit: '', type: 'number'
      };
    },
    /* 8: Quick-return ratio from angle */
    function () {
      var cutAngle = randInt(200, 260);
      var retAngle = 360 - cutAngle;
      var TR = Math.round((cutAngle / retAngle) * 1000) / 1000;
      return {
        prompt: 'In a quick-return mechanism, the cutting stroke occupies ' + cutAngle + '\u00b0. Find the quick-return ratio.',
        steps: [
          'Return stroke angle = 360\u00b0 \u2212 ' + cutAngle + '\u00b0 = ' + retAngle + '\u00b0',
          'Quick-return ratio TR = cutting / return',
          'TR = ' + cutAngle + ' / ' + retAngle,
          'TR = ' + TR
        ],
        answer: TR, unit: '', type: 'number'
      };
    },
    /* 9: Identify inversion */
    function () {
      var inversions = [
        { desc: 'The crank rotates and the piston reciprocates in a fixed cylinder (as in an IC engine).', answer: '1st', num: 1 },
        { desc: 'The crank is fixed, and the slotted arm rotates around it, producing a quick-return motion (Whitworth mechanism).', answer: '2nd', num: 2 },
        { desc: 'The connecting rod is fixed, and the cylinder oscillates about a pivot while the piston slides inside (oscillating cylinder engine).', answer: '3rd', num: 3 },
        { desc: 'The slider guide is fixed, and the crank drives the cylinder to oscillate about it (hand pump / pendulum pump).', answer: '4th', num: 4 }
      ];
      var pick = inversions[randInt(0, 3)];
      return {
        prompt: 'Identify the inversion: ' + pick.desc,
        steps: [
          'Analyze which link is fixed:',
          pick.num === 1 ? 'Frame/ground is fixed \u2192 1st inversion' :
          pick.num === 2 ? 'Crank is fixed \u2192 2nd inversion' :
          pick.num === 3 ? 'Connecting rod is fixed \u2192 3rd inversion' :
          'Slider is fixed \u2192 4th inversion',
          'Answer: ' + pick.answer + ' inversion'
        ],
        answer: pick.answer, unit: 'inversion', type: 'text'
      };
    },
    /* 10: DOF */
    function () {
      return {
        prompt: 'A slider-crank has 4 links (including ground), 3 revolute joints and 1 prismatic joint. Using Grubler\'s equation, find the DOF.',
        steps: [
          'DOF = 3(n\u22121) \u2212 2j\u2081 \u2212 j\u2082',
          'n = 4, j\u2081 = 3 + 1 = 4 (revolute + prismatic), j\u2082 = 0',
          'DOF = 3(4\u22121) \u2212 2(4) \u2212 0',
          'DOF = 9 \u2212 8 = 1'
        ],
        answer: 1, unit: 'DOF', type: 'number'
      };
    },
    /* 11: Max velocity angle */
    function () {
      var r = randInt(30, 50);
      var l = randInt(100, 160);
      while (l / r < 2.5) l = randInt(100, 160);
      var n = l / r;
      var approxAngle = Math.round(Math.acos(-1 / (4 * n) + Math.sqrt(1 / (16 * n * n) + 0.5)) * DEG);
      if (approxAngle < 70) approxAngle = 75;
      if (approxAngle > 85) approxAngle = 80;
      return {
        prompt: 'For a slider-crank with r = ' + r + ' mm, l = ' + l + ' mm (n = ' + (n).toFixed(2) + '), at approximately what crank angle does maximum piston velocity occur?',
        steps: [
          'For an inline slider-crank, max velocity occurs slightly before \u03b8 = 90\u00b0',
          'The exact angle depends on n = l/r = ' + n.toFixed(2),
          'For n = ' + n.toFixed(2) + ', max velocity is near \u03b8 \u2248 ' + approxAngle + '\u00b0',
          'Higher n \u2192 max velocity moves closer to 90\u00b0'
        ],
        answer: approxAngle, unit: '\u00b0', type: 'number'
      };
    }
  ];

  /* Helper for problem gen #7 - scan for stroke parameters */
  function scanForStroke(r, l, e) {
    var maxX = -Infinity, minX = Infinity;
    var thetaAtMax = 0, thetaAtMin = 0;
    for (var i = 0; i <= 360; i++) {
      var th = i * RAD;
      var res = solveSliderCrank(r, l, e, th);
      if (!res) continue;
      if (res.Bx > maxX) { maxX = res.Bx; thetaAtMax = th; }
      if (res.Bx < minX) { minX = res.Bx; thetaAtMin = th; }
    }
    var fwdAngle, retAngle;
    if (thetaAtMin > thetaAtMax) {
      fwdAngle = thetaAtMin - thetaAtMax;
      retAngle = TAU - fwdAngle;
    } else {
      fwdAngle = thetaAtMin + TAU - thetaAtMax;
      retAngle = TAU - fwdAngle;
    }
    var tr = fwdAngle / retAngle;
    return { stroke: maxX - minX, thetaMax: thetaAtMax, thetaMin: thetaAtMin, fwdAngle: fwdAngle, retAngle: retAngle, tr: tr };
  }

  /* ================================================================
     SECTION 4: QUIZ POOL (15 MCQ questions)
     ================================================================ */
  var QUIZ_POOL = [
    {
      q: 'A slider-crank mechanism consists of how many links (including the frame)?',
      choices: ['3', '4', '5', '6'], correct: 1
    },
    {
      q: 'What is the degree of freedom of a slider-crank mechanism?',
      choices: ['0', '1', '2', '3'], correct: 1
    },
    {
      q: 'Which inversion of the slider-crank is used in an IC engine?',
      choices: ['1st inversion', '2nd inversion', '3rd inversion', '4th inversion'], correct: 0
    },
    {
      q: 'The Whitworth quick-return mechanism is obtained by fixing which link?',
      choices: ['Frame (ground)', 'Crank', 'Connecting rod', 'Slider'], correct: 1
    },
    {
      q: 'Which inversion gives the oscillating cylinder engine?',
      choices: ['1st inversion', '2nd inversion', '3rd inversion', '4th inversion'], correct: 2
    },
    {
      q: 'The hand pump uses which inversion of the slider-crank?',
      choices: ['1st inversion', '2nd inversion', '3rd inversion', '4th inversion'], correct: 3
    },
    {
      q: 'At what crank angles do dead centres occur for an inline slider-crank?',
      choices: ['0\u00b0 and 90\u00b0', '0\u00b0 and 180\u00b0', '90\u00b0 and 270\u00b0', '45\u00b0 and 225\u00b0'], correct: 1
    },
    {
      q: 'The stroke of an inline slider-crank (e = 0) is:',
      choices: ['S = r', 'S = 2r', 'S = r + l', 'S = 2l'], correct: 1
    },
    {
      q: 'At approximately what crank angle does maximum piston velocity occur?',
      choices: ['0\u00b0', '45\u00b0', '75\u201380\u00b0', '90\u00b0'], correct: 2
    },
    {
      q: 'Maximum piston acceleration in an inline slider-crank occurs at:',
      choices: ['TDC (\u03b8 = 0\u00b0)', 'BDC (\u03b8 = 180\u00b0)', '\u03b8 = 90\u00b0', '\u03b8 = 270\u00b0'], correct: 0
    },
    {
      q: 'A typical connecting rod ratio (n = l/r) for automotive engines is:',
      choices: ['1 to 2', '2.5 to 5', '6 to 10', '10 to 20'], correct: 1
    },
    {
      q: 'The quick-return ratio in a shaper machine is used to:',
      choices: [
        'Increase cutting force',
        'Reduce return stroke time',
        'Increase stroke length',
        'Reduce vibrations'
      ], correct: 1
    },
    {
      q: 'Adding an offset (eccentricity) to a slider-crank primarily:',
      choices: [
        'Increases DOF to 2',
        'Makes the stroke symmetric',
        'Creates unequal time for forward and return strokes',
        'Eliminates the connecting rod angle'
      ], correct: 2
    },
    {
      q: 'The turning moment on the crankshaft is proportional to:',
      choices: [
        'sin(\u03b8 + \u03c6) / cos(\u03c6)',
        'cos(\u03b8) only',
        'sin(\u03b8) / sin(\u03c6)',
        'constant value'
      ], correct: 0
    },
    {
      q: 'Grubler\'s equation for planar mechanisms is:',
      choices: [
        'DOF = n \u2212 j',
        'DOF = 2(n\u22121) \u2212 j',
        'DOF = 3(n\u22121) \u2212 2j\u2081 \u2212 j\u2082',
        'DOF = 3n \u2212 2j'
      ], correct: 2
    }
  ];

  /* ================================================================
     SECTION 5: KINEMATICS ENGINE
     ================================================================ */
  function solveSliderCrank(r, l, e, theta2) {
    var sinT = Math.sin(theta2);
    var cosT = Math.cos(theta2);
    var Ax = r * cosT;
    var Ay = r * sinT;
    var val = (Ay - e) / l;
    if (Math.abs(val) > 1) return null;
    var phi = Math.asin(val);
    var Bx = Ax + l * Math.cos(phi);
    var By = e;
    return { phi: phi, x: Bx, Ax: Ax, Ay: Ay, Bx: Bx, By: By };
  }

  function pistonVelocity(r, l, e, theta2, omega) {
    var h = 0.0001;
    var s1 = solveSliderCrank(r, l, e, theta2 - h);
    var s2 = solveSliderCrank(r, l, e, theta2 + h);
    if (!s1 || !s2) return 0;
    return (s2.Bx - s1.Bx) / (2 * h) * omega;
  }

  function pistonAcceleration(r, l, e, theta2, omega) {
    var h = 0.0001;
    var s0 = solveSliderCrank(r, l, e, theta2 - h);
    var s1 = solveSliderCrank(r, l, e, theta2);
    var s2 = solveSliderCrank(r, l, e, theta2 + h);
    if (!s0 || !s1 || !s2) return 0;
    return (s2.Bx - 2 * s1.Bx + s0.Bx) / (h * h) * omega * omega;
  }

  function strokeLength(r, l, e) {
    var maxX = -Infinity, minX = Infinity;
    for (var i = 0; i <= 360; i++) {
      var th = i * RAD;
      var res = solveSliderCrank(r, l, e, th);
      if (!res) continue;
      if (res.Bx > maxX) maxX = res.Bx;
      if (res.Bx < minX) minX = res.Bx;
    }
    return maxX - minX;
  }

  function timeRatio(r, l, e) {
    if (Math.abs(e) < 0.01) return 1.0;
    var res = scanForStroke(r, l, e);
    return res.tr;
  }

  /* ================================================================
     SECTION 6: CANVAS SETUP
     ================================================================ */
  var cvs = $('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;
  var DPR = Math.max(window.devicePixelRatio || 1, 1);

  function initCanvas() {
    cvs.width = W * DPR;
    cvs.height = H * DPR;
    cvs.style.width = W + 'px';
    cvs.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  initCanvas();

  var OX = 160, OY = 260;
  var SCALE = 2.0;
  var GRAPH_L = 470, GRAPH_R = 875, GRAPH_T = 55, GRAPH_B = 475;

  /* ================================================================
     SECTION 7: STATE OBJECT
     ================================================================ */
  var state = {
    mode: 'simulate',
    inversion: 1,
    r: 40, l: 120, e: 0,
    rpm: 20,
    theta2: 0,
    running: true,
    graphType: 'displacement',
    activePreset: 'ic-engine',
    exploreCat: 'basics', exploreItem: null,
    pracScore: 0, pracTotal: 0, pracCurrent: null, pracAnswered: false,
    quizQuestions: [], quizIdx: 0, quizScore: 0, quizAnswered: false, quizResults: []
  };

  /* ================================================================
     SECTION 8: PRESETS
     ================================================================ */
  var PRESETS = {
    'ic-engine':      { inv: 1, r: 40, l: 120, e: 0,  rpm: 20, theta2: 0 },
    'offset-engine':  { inv: 1, r: 40, l: 120, e: 15, rpm: 20, theta2: 0 },
    'quick-return':   { inv: 2, r: 30, l: 100, e: 0,  rpm: 15, theta2: 0 },
    'rotary-engine':  { inv: 2, r: 35, l: 110, e: 0,  rpm: 20, theta2: PI / 4 },
    'osc-cylinder':   { inv: 3, r: 30, l: 100, e: 0,  rpm: 15, theta2: PI / 6 },
    'hand-pump':      { inv: 4, r: 25, l: 90,  e: 0,  rpm: 10, theta2: 0 }
  };

  /* ================================================================
     SECTION 9: DRAWING FUNCTIONS
     ================================================================ */

  /* ---- Helper drawing functions ---- */
  function drawPivot(x, y, color, radius) {
    radius = radius || 5;
    ctx.save();
    /* base colour disc */
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = color;
    ctx.fill();
    /* domed metallic sheen — light from upper-left */
    var g = ctx.createRadialGradient(x - radius * 0.4, y - radius * 0.4, 0, x, y, radius);
    g.addColorStop(0,   'rgba(255,255,255,0.60)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    g.addColorStop(1,   'rgba(0,0,0,0.38)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.restore();
  }

  /* Cylindrical metal link: layered round-capped strokes (dark base → mid body →
     thin top highlight) give a steel-rod look while preserving exact endpoints. */
  function metalLink(x1, y1, x2, y2, w, lo, mid, hi) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = lo;  ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = mid; ctx.lineWidth = w * 0.74;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    /* highlight offset toward the light (perpendicular, upper side) */
    var nx = dy / L, ny = -dx / L, off = w * 0.24;
    ctx.strokeStyle = hi;  ctx.lineWidth = w * 0.26;
    ctx.beginPath();
    ctx.moveTo(x1 + nx * off, y1 + ny * off);
    ctx.lineTo(x2 + nx * off, y2 + ny * off);
    ctx.stroke();
    ctx.restore();
  }

  function drawHatch(cx, cy, w, side) {
    side = side || 'down';
    ctx.save();
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 1;
    var hatchW = w || 30;
    var hatchH = 8;
    ctx.beginPath();
    if (side === 'down') {
      ctx.moveTo(cx - hatchW / 2, cy);
      ctx.lineTo(cx + hatchW / 2, cy);
      ctx.stroke();
      for (var i = -hatchW / 2; i < hatchW / 2; i += 5) {
        ctx.beginPath();
        ctx.moveTo(cx + i + 5, cy);
        ctx.lineTo(cx + i, cy + hatchH);
        ctx.stroke();
      }
    } else if (side === 'up') {
      ctx.moveTo(cx - hatchW / 2, cy);
      ctx.lineTo(cx + hatchW / 2, cy);
      ctx.stroke();
      for (var j = -hatchW / 2; j < hatchW / 2; j += 5) {
        ctx.beginPath();
        ctx.moveTo(cx + j, cy);
        ctx.lineTo(cx + j + 5, cy - hatchH);
        ctx.stroke();
      }
    } else if (side === 'left') {
      ctx.moveTo(cx, cy - hatchW / 2);
      ctx.lineTo(cx, cy + hatchW / 2);
      ctx.stroke();
      for (var k = -hatchW / 2; k < hatchW / 2; k += 5) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + k);
        ctx.lineTo(cx - hatchH, cy + k + 5);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawDimensionLine(x1, y1, x2, y2, label, offset) {
    offset = offset || 20;
    ctx.save();
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) { ctx.restore(); return; }
    var nx = -dy / len, ny = dx / len;
    var ox1 = x1 + nx * offset, oy1 = y1 + ny * offset;
    var ox2 = x2 + nx * offset, oy2 = y2 + ny * offset;
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 0.8;
    ctx.setLineDash([]);
    /* extension lines */
    ctx.beginPath();
    ctx.moveTo(x1 + nx * 3, y1 + ny * 3);
    ctx.lineTo(ox1 + nx * 4, oy1 + ny * 4);
    ctx.moveTo(x2 + nx * 3, y2 + ny * 3);
    ctx.lineTo(ox2 + nx * 4, oy2 + ny * 4);
    ctx.stroke();
    /* dimension line */
    ctx.beginPath();
    ctx.moveTo(ox1, oy1);
    ctx.lineTo(ox2, oy2);
    ctx.stroke();
    /* arrows */
    var arrowLen = 6;
    var ang = Math.atan2(oy2 - oy1, ox2 - ox1);
    for (var s = 0; s < 2; s++) {
      var ax = s === 0 ? ox1 : ox2;
      var ay = s === 0 ? oy1 : oy2;
      var dir = s === 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + Math.cos(ang + dir * 0.4) * arrowLen, ay + Math.sin(ang + dir * 0.4) * arrowLen);
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + Math.cos(ang - dir * 0.4) * arrowLen, ay + Math.sin(ang - dir * 0.4) * arrowLen);
      ctx.stroke();
    }
    /* label */
    var mx = (ox1 + ox2) / 2, my = (oy1 + oy2) / 2;
    ctx.fillStyle = '#aabbcc';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, mx + nx * 10, my + ny * 10);
    ctx.restore();
  }

  function drawAngleArc(cx, cy, radius, startAngle, endAngle, color, label) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, -startAngle, -endAngle, endAngle > startAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    /* arrow at end */
    var tipAngle = -endAngle;
    var arrowLen = 6;
    var perpDir = endAngle > startAngle ? 1 : -1;
    var tx = cx + radius * Math.cos(tipAngle);
    var ty = cy + radius * Math.sin(tipAngle);
    var tangent = tipAngle + perpDir * PI / 2;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + Math.cos(tangent + 0.5) * arrowLen, ty + Math.sin(tangent + 0.5) * arrowLen);
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + Math.cos(tangent - 0.5) * arrowLen, ty + Math.sin(tangent - 0.5) * arrowLen);
    ctx.stroke();
    /* label */
    if (label) {
      var midAngle = -(startAngle + endAngle) / 2;
      var lx = cx + (radius + 14) * Math.cos(midAngle);
      var ly = cy + (radius + 14) * Math.sin(midAngle);
      ctx.fillStyle = color;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
    }
    ctx.restore();
  }

  /* ---- Grid ---- */
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(100,120,150,0.08)';
    ctx.lineWidth = 1;
    for (var x = 0; x <= 440; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (var y = 0; y <= H; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(440, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- Divider line ---- */
  function drawDivider() {
    ctx.save();
    ctx.strokeStyle = 'rgba(100,120,150,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(450, 10);
    ctx.lineTo(450, H - 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ---- 1st Inversion: Standard IC Engine ---- */
  function draw1stInversion() {
    var r = state.r, l = state.l, e = state.e;
    var theta2 = state.theta2;
    var sol = solveSliderCrank(r, l, e, theta2);
    if (!sol) { drawWarning(); return; }

    var S = SCALE;
    var ox = OX, oy = OY;
    /* crank pivot */
    var O2x = ox, O2y = oy;
    /* crank pin A */
    var Ax = ox + sol.Ax * S, Ay = oy - sol.Ay * S;
    /* piston B */
    var Bx = ox + sol.Bx * S, By = oy - sol.By * S;
    /* offset line */
    var sliderY = oy - e * S;

    /* TDC/BDC positions */
    var solTDC = solveSliderCrank(r, l, e, 0);
    var solBDC = null;
    var tdcX = solTDC ? ox + solTDC.Bx * S : ox + (r + l) * S;
    /* scan for BDC */
    var minXval = Infinity, minTheta = PI;
    for (var si = 0; si <= 360; si++) {
      var sres = solveSliderCrank(r, l, e, si * RAD);
      if (sres && sres.Bx < minXval) { minXval = sres.Bx; minTheta = si * RAD; }
    }
    var bdcX = ox + minXval * S;

    /* crosshead guides */
    ctx.save();
    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 2;
    var guideTop = sliderY - 18;
    var guideBot = sliderY + 18;
    var guideLeft = bdcX - 20;
    var guideRight = tdcX + 10;
    ctx.beginPath();
    ctx.moveTo(guideLeft, guideTop);
    ctx.lineTo(guideRight, guideTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guideLeft, guideBot);
    ctx.lineTo(guideRight, guideBot);
    ctx.stroke();
    ctx.restore();

    /* cylinder walls */
    ctx.save();
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 3;
    var cylLeft = Bx - 5;
    var cylRight = tdcX + 40;
    var cylTop = sliderY - 22;
    var cylBot = sliderY + 22;
    /* top wall */
    ctx.beginPath();
    ctx.moveTo(cylLeft - 25, cylTop);
    ctx.lineTo(cylRight, cylTop);
    ctx.stroke();
    /* bottom wall */
    ctx.beginPath();
    ctx.moveTo(cylLeft - 25, cylBot);
    ctx.lineTo(cylRight, cylBot);
    ctx.stroke();
    /* closed end */
    ctx.beginPath();
    ctx.moveTo(cylRight, cylTop);
    ctx.lineTo(cylRight, cylBot);
    ctx.stroke();
    ctx.restore();

    /* TDC / BDC dashed lines */
    ctx.save();
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(tdcX, sliderY - 40);
    ctx.lineTo(tdcX, sliderY + 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bdcX, sliderY - 40);
    ctx.lineTo(bdcX, sliderY + 40);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TDC', tdcX, sliderY - 44);
    ctx.fillText('BDC', bdcX, sliderY - 44);
    ctx.restore();

    /* offset line if e != 0 */
    if (Math.abs(e) > 0.5) {
      ctx.save();
      ctx.strokeStyle = '#4db6ac';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(O2x, O2y);
      ctx.lineTo(O2x + 60, O2y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(O2x + 50, O2y);
      ctx.lineTo(O2x + 50, sliderY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#4db6ac';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('e=' + e, O2x + 55, (O2y + sliderY) / 2 + 4);
      ctx.restore();
    }

    /* crank counterweight */
    ctx.save();
    var cwAngle = theta2 + PI;
    var cwR = r * S * 0.35;
    var cwX = O2x + Math.cos(-cwAngle) * r * S * 0.45;
    var cwY = O2y + Math.sin(-cwAngle) * r * S * 0.45;
    ctx.beginPath();
    ctx.arc(cwX, cwY, cwR, 0, TAU);
    ctx.fillStyle = 'rgba(230,81,0,0.25)';
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    /* crank arm O2 to A — steel rod, warm-steel tint */
    metalLink(O2x, O2y, Ax, Ay, 10, '#7a2c00', '#e8601a', '#ffb066');

    /* connecting rod A to B — brass/gold rod */
    metalLink(Ax, Ay, Bx, By, 8, '#7c5e10', '#e4ba36', '#ffe79a');

    /* piston — vertical gradient body + sheen + rings */
    ctx.save();
    var pistonW = 30, pistonH = 34;
    var px = Bx - 4;
    var py = By - pistonH / 2;
    var pg = ctx.createLinearGradient(0, py, 0, py + pistonH);
    pg.addColorStop(0,   '#ffb699');
    pg.addColorStop(0.18,'#ff9874');
    pg.addColorStop(0.5, '#ef7a52');
    pg.addColorStop(1,   '#b84d2e');
    ctx.fillStyle = pg;
    ctx.fillRect(px, py, pistonW, pistonH);
    /* top sheen band */
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(px, py + 2, pistonW, 3);
    ctx.strokeStyle = '#a8431f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, pistonW, pistonH);
    /* piston rings (engraved: dark groove + faint highlight below) */
    for (var pr = 0; pr < 2; pr++) {
      var ry = py + 6 + pr * 5;
      ctx.strokeStyle = 'rgba(90,30,15,0.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + 2, ry); ctx.lineTo(px + pistonW - 2, ry); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.moveTo(px + 2, ry + 1); ctx.lineTo(px + pistonW - 2, ry + 1); ctx.stroke();
    }
    ctx.restore();

    /* theta2 angle arc */
    if (Math.abs(theta2 % TAU) > 0.02) {
      drawAngleArc(O2x, O2y, 25, 0, theta2, '#3ddc84', '\u03b82');
    }

    /* phi angle arc at A */
    if (Math.abs(sol.phi) > 0.02) {
      var conrodAngle = Math.atan2(-(By - Ay), Bx - Ax);
      drawAngleArc(Ax, Ay, 20, 0, -sol.phi, '#4db6ac', '\u03c6');
    }

    /* dimension lines */
    drawDimensionLine(O2x, O2y, Ax, Ay, 'r=' + r, -18);
    drawDimensionLine(Ax, Ay, Bx, By, 'l=' + l, 22);

    /* joints */
    drawPivot(Ax, Ay, '#f5c842', 5);
    drawPivot(Bx, By, '#ff8a65', 4);
    drawPivot(O2x, O2y, '#e65100', 6);

    /* ground hatching at O2 */
    drawHatch(O2x, O2y + 6, 36, 'down');

    /* inversion label */
    ctx.save();
    ctx.fillStyle = 'rgba(200,210,230,0.7)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1st Inversion \u2014 IC Engine / Compressor', 10, 20);
    ctx.restore();

    /* joint labels */
    ctx.save();
    ctx.fillStyle = '#ccd0dd';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('O\u2082', O2x, O2y + 26);
    ctx.fillText('A', Ax - 10, Ay - 8);
    ctx.fillText('B', Bx + 20, By - 8);
    ctx.restore();
  }

  /* ---- 2nd Inversion: Whitworth Quick-Return ---- */
  function draw2ndInversion() {
    var r = state.r, l = state.l;
    var theta2 = state.theta2;
    var S = SCALE;
    var ox = 200, oy = OY;

    /* In 2nd inversion, the crank (link 2) is FIXED.
       A driving arm rotates around O4 (offset from O2).
       The slider rides on the driving arm and is pinned to the crank pin circle.
       An output slider moves horizontally. */

    var O2x = ox, O2y = oy;
    var d = r * 1.5; /* distance O2 to O4 */
    var O4x = ox - d * S, O4y = oy;

    /* Crank pin A moves on circle of radius r around O2 */
    var Ax = O2x + r * S * Math.cos(-theta2);
    var Ay = O2y + r * S * Math.sin(-theta2);

    /* Slotted arm: from O4 through A and beyond */
    var armAngle = Math.atan2(Ay - O4y, Ax - O4x);
    var armLen = l * S * 1.5;
    var armEndX = O4x + armLen * Math.cos(armAngle);
    var armEndY = O4y + armLen * Math.sin(armAngle);

    /* Output: project a point on the arm at a fixed distance from O4 to horizontal slider */
    var outputDist = l * S * 0.8;
    var outputX = O4x + outputDist * Math.cos(armAngle);
    var outputY = O4y + outputDist * Math.sin(armAngle);
    /* connect output point to a horizontal slider via a vertical link */
    var sliderY = oy + 90;
    var sliderX = outputX;

    /* Fixed crank link (double lines) */
    ctx.save();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(O2x, O2y);
    ctx.lineTo(O2x + r * S, O2y);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b34000';
    ctx.beginPath();
    ctx.moveTo(O2x, O2y);
    ctx.lineTo(O2x + r * S, O2y);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#e65100';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('fixed crank', O2x + r * S / 2, O2y - 12);
    ctx.restore();

    /* crank circle (path of A) */
    ctx.save();
    ctx.beginPath();
    ctx.arc(O2x, O2y, r * S, 0, TAU);
    ctx.strokeStyle = 'rgba(230,81,0,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* slotted arm from O4 */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(O4x, O4y);
    ctx.lineTo(armEndX, armEndY);
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* slider on arm at A */
    ctx.save();
    var slBlockW = 16, slBlockH = 12;
    ctx.translate(Ax, Ay);
    ctx.rotate(armAngle);
    ctx.fillStyle = '#4db6ac';
    ctx.fillRect(-slBlockW / 2, -slBlockH / 2, slBlockW, slBlockH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-slBlockW / 2, -slBlockH / 2, slBlockW, slBlockH);
    ctx.restore();

    /* output connecting link */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(outputX, outputY);
    ctx.lineTo(sliderX, sliderY);
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* output slider rail */
    ctx.save();
    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox - 180, sliderY - 10);
    ctx.lineTo(ox + 180, sliderY - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox - 180, sliderY + 10);
    ctx.lineTo(ox + 180, sliderY + 10);
    ctx.stroke();
    ctx.restore();

    /* output slider block */
    ctx.save();
    ctx.fillStyle = '#ff8a65';
    ctx.fillRect(sliderX - 12, sliderY - 8, 24, 16);
    ctx.strokeStyle = '#c75b39';
    ctx.lineWidth = 1;
    ctx.strokeRect(sliderX - 12, sliderY - 8, 24, 16);
    ctx.restore();

    /* ground hatching */
    drawHatch(O2x, O2y + 8, 30, 'down');
    drawHatch(O4x, O4y + 8, 30, 'down');

    /* pivots */
    drawPivot(O2x, O2y, '#e65100', 6);
    drawPivot(O4x, O4y, '#f5c842', 6);
    drawPivot(Ax, Ay, '#4db6ac', 4);
    drawPivot(outputX, outputY, '#8899aa', 4);
    drawPivot(sliderX, sliderY, '#ff8a65', 4);

    /* theta arc */
    drawAngleArc(O2x, O2y, 30, 0, theta2, '#3ddc84', '\u03b8');

    /* labels */
    ctx.save();
    ctx.fillStyle = '#ccd0dd';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('O\u2082', O2x, O2y + 28);
    ctx.fillText('O\u2084', O4x, O4y + 28);
    ctx.fillText('A', Ax + 12, Ay - 10);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(200,210,230,0.7)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('2nd Inversion \u2014 Whitworth Quick-Return', 10, 20);
    ctx.restore();
  }

  /* ---- 3rd Inversion: Oscillating Cylinder ---- */
  function draw3rdInversion() {
    var r = state.r, l = state.l;
    var theta2 = state.theta2;
    var S = SCALE;
    var ox = 180, oy = OY;

    /* In the 3rd inversion, the connecting rod is fixed.
       The crank rotates about one end (O2).
       The cylinder pivots about the other end (O4) and oscillates. */

    var O2x = ox, O2y = oy;
    var O4x = ox + l * S, O4y = oy;

    /* Crank pin A on circle of radius r about O2 */
    var Ax = O2x + r * S * Math.cos(-theta2);
    var Ay = O2y + r * S * Math.sin(-theta2);

    /* Cylinder oscillates at O4, pointing toward A.
       The piston slides inside the cylinder. The piston is pinned at A. */
    var cylAngle = Math.atan2(Ay - O4y, Ax - O4x);
    var distO4A = Math.sqrt((Ax - O4x) * (Ax - O4x) + (Ay - O4y) * (Ay - O4y));

    /* Fixed connecting rod (ground link) */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(O2x, O2y);
    ctx.lineTo(O4x, O4y);
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#667788';
    ctx.beginPath();
    ctx.moveTo(O2x, O2y);
    ctx.lineTo(O4x, O4y);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#8899aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('fixed connecting rod', (O2x + O4x) / 2, O2y + 20);
    ctx.restore();

    /* crank arm O2 to A */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(O2x, O2y);
    ctx.lineTo(Ax, Ay);
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* crank circle */
    ctx.save();
    ctx.beginPath();
    ctx.arc(O2x, O2y, r * S, 0, TAU);
    ctx.strokeStyle = 'rgba(230,81,0,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* oscillating cylinder */
    ctx.save();
    ctx.translate(O4x, O4y);
    ctx.rotate(cylAngle);
    var cylLen = (r + l) * S * 0.6;
    var cylW = 20;
    /* cylinder body */
    ctx.fillStyle = 'rgba(136,153,170,0.3)';
    ctx.fillRect(-cylLen - 10, -cylW / 2, cylLen + 10, cylW);
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 2;
    /* top and bottom walls */
    ctx.beginPath();
    ctx.moveTo(-cylLen - 10, -cylW / 2);
    ctx.lineTo(10, -cylW / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-cylLen - 10, cylW / 2);
    ctx.lineTo(10, cylW / 2);
    ctx.stroke();
    /* closed end */
    ctx.beginPath();
    ctx.moveTo(-cylLen - 10, -cylW / 2);
    ctx.lineTo(-cylLen - 10, cylW / 2);
    ctx.stroke();

    /* piston inside cylinder */
    var pistonPos = distO4A;
    var pistonLocalX = pistonPos - O4x; /* not quite right, use distO4A directly */
    /* Actually pistonLocalX is just -distO4A since we're in rotated frame from O4 */
    var px = -(distO4A) + (O4x - ox) / 1; /* need to correct... */
    /* Simpler: in the rotated frame centered at O4, A is at distance distO4A along the +x axis. But we rotated to cylAngle, so A is at (distO4A, 0) before rotation. But we are in the rotated frame, so A is at (-distO4A, 0) if we measure from O4 toward A... no. */
    /* Let me reconsider. After ctx.rotate(cylAngle), the +x axis points from O4 toward A. So the piston (at A) is at distance distO4A along +x from O4 (which is at origin). But the cylinder extends in the -x direction. Actually, the cylinder should enclose the piston. Let's say cylinder extends from O4 outward toward A and beyond. */
    ctx.restore();

    /* redraw cylinder properly */
    ctx.save();
    ctx.translate(O4x, O4y);
    ctx.rotate(cylAngle);
    var cylHalfLen = Math.max(distO4A + 30, l * S * 0.5);
    var cylW2 = 22;
    /* cylinder walls from O4 outward */
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-15, -cylW2 / 2);
    ctx.lineTo(cylHalfLen, -cylW2 / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, cylW2 / 2);
    ctx.lineTo(cylHalfLen, cylW2 / 2);
    ctx.stroke();
    /* closed end */
    ctx.beginPath();
    ctx.moveTo(cylHalfLen, -cylW2 / 2);
    ctx.lineTo(cylHalfLen, cylW2 / 2);
    ctx.stroke();

    /* piston */
    var pistonDist = distO4A;
    ctx.fillStyle = '#ff8a65';
    ctx.fillRect(pistonDist - 12, -cylW2 / 2 + 2, 20, cylW2 - 4);
    ctx.strokeStyle = '#c75b39';
    ctx.lineWidth = 1;
    ctx.strokeRect(pistonDist - 12, -cylW2 / 2 + 2, 20, cylW2 - 4);
    /* piston ring */
    ctx.beginPath();
    ctx.moveTo(pistonDist - 8, -cylW2 / 2 + 4);
    ctx.lineTo(pistonDist + 4, -cylW2 / 2 + 4);
    ctx.stroke();

    /* piston rod extending back toward O4 */
    ctx.beginPath();
    ctx.moveTo(pistonDist - 12, 0);
    ctx.lineTo(0, 0);
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    /* ground hatching */
    drawHatch(O2x, O2y + 8, 30, 'down');
    drawHatch(O4x, O4y + 8, 30, 'down');

    /* pivots */
    drawPivot(O2x, O2y, '#e65100', 6);
    drawPivot(O4x, O4y, '#8899aa', 6);
    drawPivot(Ax, Ay, '#f5c842', 5);

    /* angle arc */
    drawAngleArc(O2x, O2y, 25, 0, theta2, '#3ddc84', '\u03b82');
    /* oscillating angle at O4 */
    drawAngleArc(O4x, O4y, 30, 0, -cylAngle, '#4db6ac', '\u03c8');

    /* labels */
    ctx.save();
    ctx.fillStyle = '#ccd0dd';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('O\u2082', O2x, O2y + 28);
    ctx.fillText('O\u2084', O4x, O4y + 28);
    ctx.fillText('A', Ax + 10, Ay - 10);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(200,210,230,0.7)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('3rd Inversion \u2014 Oscillating Cylinder Engine', 10, 20);
    ctx.restore();
  }

  /* ---- 4th Inversion: Hand Pump ---- */
  function draw4thInversion() {
    var r = state.r, l = state.l;
    var theta2 = state.theta2;
    var S = SCALE;
    var ox = 200, oy = OY - 30;

    /* In the 4th inversion, the slider (guide) is fixed.
       The crank rotates about a pivot that is NOT fixed to ground -
       instead the crank pivot is on a link that can move.
       The cylinder oscillates. */

    /* Fixed slider rail (horizontal) */
    var railY = oy + 60;
    var railLeft = ox - 150, railRight = ox + 200;

    /* Crank pivot O2 - positioned above the rail */
    var O2x = ox, O2y = oy;

    /* Crank pin A */
    var Ax = O2x + r * S * Math.cos(-theta2);
    var Ay = O2y + r * S * Math.sin(-theta2);

    /* The connecting rod goes from A down to a point B on the slider rail.
       B slides along the fixed rail. */
    /* Solve: B is on the rail (y = railY), and |AB| = l*S */
    var dy = railY - Ay;
    var dxSq = l * S * l * S - dy * dy;
    if (dxSq < 0) { drawWarning(); return; }
    var dxVal = Math.sqrt(dxSq);
    var Bx = Ax + dxVal;
    var By = railY;

    /* cylinder: from O2 through B, the cylinder contains a piston attached at A.
       Actually in 4th inversion, the cylinder oscillates.
       Let's draw: crank at O2 rotating, connecting rod A-B, B on fixed rail. */

    /* Fixed slider rail */
    ctx.save();
    ctx.strokeStyle = '#556677';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(railLeft, railY - 10);
    ctx.lineTo(railRight, railY - 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(railLeft, railY + 10);
    ctx.lineTo(railRight, railY + 10);
    ctx.stroke();
    ctx.restore();
    /* ground hatching along rail */
    drawHatch((railLeft + railRight) / 2, railY + 10, railRight - railLeft, 'down');

    /* crank arm O2 to A */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(O2x, O2y);
    ctx.lineTo(Ax, Ay);
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* crank circle */
    ctx.save();
    ctx.beginPath();
    ctx.arc(O2x, O2y, r * S, 0, TAU);
    ctx.strokeStyle = 'rgba(230,81,0,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* connecting rod A to B */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(Ax, Ay);
    ctx.lineTo(Bx, By);
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    /* slider block at B */
    ctx.save();
    ctx.fillStyle = '#ff8a65';
    ctx.fillRect(Bx - 12, By - 8, 24, 16);
    ctx.strokeStyle = '#c75b39';
    ctx.lineWidth = 1;
    ctx.strokeRect(Bx - 12, By - 8, 24, 16);
    ctx.restore();

    /* Cylinder oscillating about O2, containing piston at A.
       Draw cylinder as a tube from O2 past A. */
    var cylAngle = Math.atan2(Ay - O2y, Ax - O2x);
    ctx.save();
    ctx.translate(O2x, O2y);
    ctx.rotate(cylAngle);
    var cylLen = r * S + 20;
    var cylW = 18;
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 2;
    /* cylinder walls */
    ctx.beginPath();
    ctx.moveTo(-10, -cylW / 2);
    ctx.lineTo(cylLen, -cylW / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10, cylW / 2);
    ctx.lineTo(cylLen, cylW / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cylLen, -cylW / 2);
    ctx.lineTo(cylLen, cylW / 2);
    ctx.stroke();
    /* piston inside */
    var pDist = r * S;
    ctx.fillStyle = 'rgba(255,138,101,0.6)';
    ctx.fillRect(pDist - 8, -cylW / 2 + 2, 14, cylW - 4);
    ctx.strokeStyle = '#c75b39';
    ctx.lineWidth = 1;
    ctx.strokeRect(pDist - 8, -cylW / 2 + 2, 14, cylW - 4);
    ctx.restore();

    /* ground hatching at O2 */
    drawHatch(O2x, O2y - 10, 30, 'up');

    /* pivots */
    drawPivot(O2x, O2y, '#e65100', 6);
    drawPivot(Ax, Ay, '#f5c842', 5);
    drawPivot(Bx, By, '#ff8a65', 4);

    /* angle arc */
    drawAngleArc(O2x, O2y, 25, 0, theta2, '#3ddc84', '\u03b82');

    /* labels */
    ctx.save();
    ctx.fillStyle = '#ccd0dd';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('O\u2082', O2x, O2y - 18);
    ctx.fillText('A', Ax + 12, Ay - 10);
    ctx.fillText('B', Bx, By + 24);
    ctx.fillText('fixed slider guide', (railLeft + railRight) / 2, railY + 30);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(200,210,230,0.7)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('4th Inversion \u2014 Hand Pump / Pendulum Pump', 10, 20);
    ctx.restore();
  }

  /* ---- Warning ---- */
  function drawWarning() {
    ctx.save();
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Mechanism locked \u2014 impossible geometry', 220, OY);
    ctx.restore();
    var warnEl = $('warn-msg');
    if (warnEl) warnEl.style.display = 'block';
  }

  /* ---- Graph drawing ---- */
  function drawGraph() {
    var gL = GRAPH_L, gR = GRAPH_R, gT = GRAPH_T, gB = GRAPH_B;
    var gW = gR - gL, gH = gB - gT;
    var r = state.r, l = state.l, e = state.e;
    var omega = state.rpm * TAU / 60;

    /* graph background */
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.6)';
    ctx.fillRect(gL - 10, gT - 20, gW + 30, gH + 40);
    ctx.restore();

    /* compute data */
    var data = [];
    var yMin = Infinity, yMax = -Infinity;
    for (var i = 0; i <= 360; i += 2) {
      var th = i * RAD;
      var sol = solveSliderCrank(r, l, e, th);
      var val = 0;
      if (sol) {
        if (state.graphType === 'displacement') {
          val = sol.Bx;
        } else if (state.graphType === 'velocity') {
          val = pistonVelocity(r, l, e, th, omega);
        } else if (state.graphType === 'acceleration') {
          val = pistonAcceleration(r, l, e, th, omega);
        } else if (state.graphType === 'torque') {
          /* normalized turning moment coefficient: sin(theta+phi)/cos(phi) */
          var phi = sol.phi;
          var cosPhi = Math.cos(phi);
          val = cosPhi !== 0 ? Math.sin(th + phi) / cosPhi : 0;
        }
      }
      data.push({ deg: i, val: val });
      if (val < yMin) yMin = val;
      if (val > yMax) yMax = val;
    }

    /* y-axis padding */
    var yRange = yMax - yMin;
    if (yRange < 0.001) { yRange = 1; yMin -= 0.5; yMax += 0.5; }
    yMin -= yRange * 0.08;
    yMax += yRange * 0.08;
    yRange = yMax - yMin;

    /* axes */
    ctx.save();
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    /* x-axis */
    ctx.beginPath();
    ctx.moveTo(gL, gB);
    ctx.lineTo(gR, gB);
    ctx.stroke();
    /* y-axis */
    ctx.beginPath();
    ctx.moveTo(gL, gT);
    ctx.lineTo(gL, gB);
    ctx.stroke();

    /* grid lines */
    ctx.strokeStyle = 'rgba(100,120,150,0.15)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx <= 360; gx += 90) {
      var px = gL + (gx / 360) * gW;
      ctx.beginPath();
      ctx.moveTo(px, gT);
      ctx.lineTo(px, gB);
      ctx.stroke();
    }
    /* horizontal grid - 5 lines */
    for (var gi = 0; gi <= 4; gi++) {
      var gy = gT + gi * (gH / 4);
      ctx.beginPath();
      ctx.moveTo(gL, gy);
      ctx.lineTo(gR, gy);
      ctx.stroke();
    }

    /* x-axis labels */
    ctx.fillStyle = '#8899aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var xl = 0; xl <= 360; xl += 90) {
      ctx.fillText(xl + '\u00b0', gL + (xl / 360) * gW, gB + 5);
    }
    ctx.fillText('Crank Angle \u03b82 (\u00b0)', (gL + gR) / 2, gB + 20);

    /* y-axis labels */
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var yi = 0; yi <= 4; yi++) {
      var yv = yMax - yi * (yRange / 4);
      var ypos = gT + yi * (gH / 4);
      /* Torque coefficient is dimensionless; the other three graphs plot a
         length, a velocity or an acceleration and follow the unit toggle. */
      var yLbl = (state.graphType === 'torque') ? yv.toFixed(1) : lD(yv).toFixed(isImp() ? 2 : 1);
      ctx.fillText(yLbl, gL - 5, ypos);
    }

    /* y-axis title */
    ctx.save();
    ctx.translate(gL - 45, (gT + gB) / 2);
    ctx.rotate(-PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8899aa';
    ctx.font = '10px monospace';
    var yTitle = state.graphType === 'displacement' ? 'Displacement (' + uLen() + ')' :
                 state.graphType === 'velocity' ? 'Velocity (' + uVel() + ')' :
                 state.graphType === 'acceleration' ? 'Acceleration (' + uAcc() + ')' :
                 'Torque Coefficient';
    ctx.fillText(yTitle, 0, 0);
    ctx.restore();

    /* graph title */
    ctx.fillStyle = '#ccd0dd';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    var gTitle = state.graphType === 'displacement' ? 'Piston Displacement vs Crank Angle' :
                 state.graphType === 'velocity' ? 'Piston Velocity vs Crank Angle' :
                 state.graphType === 'acceleration' ? 'Piston Acceleration vs Crank Angle' :
                 'Turning Moment Coefficient vs Crank Angle';
    ctx.fillText(gTitle, (gL + gR) / 2, gT - 5);

    /* curve */
    ctx.beginPath();
    var started = false;
    for (var ci = 0; ci < data.length; ci++) {
      var cx = gL + (data[ci].deg / 360) * gW;
      var cy = gT + ((yMax - data[ci].val) / yRange) * gH;
      if (!started) { ctx.moveTo(cx, cy); started = true; }
      else ctx.lineTo(cx, cy);
    }
    ctx.strokeStyle = state.graphType === 'displacement' ? '#3ddc84' :
                      state.graphType === 'velocity' ? '#42a5f5' :
                      state.graphType === 'acceleration' ? '#ef5350' : '#f5c842';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* animated dot at current theta */
    var curDeg = (state.theta2 * DEG) % 360;
    if (curDeg < 0) curDeg += 360;
    /* interpolate value */
    var idx = curDeg / 2;
    var idxFloor = Math.floor(idx);
    var idxCeil = Math.min(idxFloor + 1, data.length - 1);
    var frac = idx - idxFloor;
    var curVal = data[idxFloor].val * (1 - frac) + data[idxCeil].val * frac;
    var dotX = gL + (curDeg / 360) * gW;
    var dotY = gT + ((yMax - curVal) / yRange) * gH;

    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, TAU);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = ctx.strokeStyle; /* keep curve color */
    ctx.lineWidth = 2;
    ctx.stroke();

    /* value label next to dot */
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px monospace';
    ctx.textAlign = dotX > (gL + gR) / 2 ? 'right' : 'left';
    ctx.textBaseline = 'bottom';
    var valLabel = curVal.toFixed(1);
    ctx.fillText(valLabel, dotX + (dotX > (gL + gR) / 2 ? -10 : 10), dotY - 8);

    ctx.restore();
  }

  /* ---- Info Panel (translucent overlay on left half) ---- */
  function drawInfoPanel() {
    if (state.inversion !== 1) return; /* only full readouts for 1st inversion */
    var sol = solveSliderCrank(state.r, state.l, state.e, state.theta2);
    if (!sol) return;

    var omega = state.rpm * TAU / 60;
    var vel = pistonVelocity(state.r, state.l, state.e, state.theta2, omega);
    var acc = pistonAcceleration(state.r, state.l, state.e, state.theta2, omega);
    var sLen = strokeLength(state.r, state.l, state.e);

    var panelX = 280, panelY = 30, panelW = 155, panelH = 120;
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.75)';
    ctx.strokeStyle = 'rgba(100,120,150,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, panelX, panelY, panelW, panelH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ccd0dd';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    var lh = 16, startY = panelY + 16;
    ctx.fillText('\u03b82 = ' + (state.theta2 * DEG).toFixed(1) + '\u00b0', panelX + 10, startY);
    ctx.fillText('\u03c6  = ' + (sol.phi * DEG).toFixed(2) + '\u00b0', panelX + 10, startY + lh);
    ctx.fillText('x  = ' + lD(sol.Bx).toFixed(2) + ' ' + uLen(), panelX + 10, startY + lh * 2);
    ctx.fillText('v  = ' + lD(vel).toFixed(isImp() ? 2 : 1) + ' ' + uVel(), panelX + 10, startY + lh * 3);
    ctx.fillText('a  = ' + lD(acc).toFixed(isImp() ? 1 : 0) + ' ' + uAcc(), panelX + 10, startY + lh * 4);
    ctx.fillText('S  = ' + lD(sLen).toFixed(isImp() ? 2 : 1) + ' ' + uLen(), panelX + 10, startY + lh * 5);
    ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  /* ---- drawMechanism dispatcher ---- */
  function drawMechanism() {
    switch (state.inversion) {
      case 1: draw1stInversion(); break;
      case 2: draw2ndInversion(); break;
      case 3: draw3rdInversion(); break;
      case 4: draw4thInversion(); break;
    }
  }

  /* ---- Main draw ---- */
  function drawSceneBackground() {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,    '#10151f');
    bg.addColorStop(0.55, '#0d1117');
    bg.addColorStop(1,    '#090c11');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    /* spotlight over the mechanism region (left of the divider) */
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 450, H); ctx.clip();
    var glow = ctx.createRadialGradient(205, 235, 30, 205, 235, 300);
    glow.addColorStop(0, 'rgba(79,142,247,0.10)');
    glow.addColorStop(1, 'rgba(79,142,247,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 450, H);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawSceneBackground();

    drawGrid();
    drawDivider();
    drawMechanism();
    drawGraph();
    drawInfoPanel();
    updateReadouts();
    hideWarning();
  }

  function hideWarning() {
    var w = $('warn-msg');
    if (w) w.style.display = 'none';
  }

  /* ---- Update DOM readouts ---- */
  function updateReadouts() {
    var sol = solveSliderCrank(state.r, state.l, state.e, state.theta2);
    var omega = state.rpm * TAU / 60;
    var vel = 0, acc = 0, sLen = 0, tr = 1;

    if (sol) {
      vel = pistonVelocity(state.r, state.l, state.e, state.theta2, omega);
      acc = pistonAcceleration(state.r, state.l, state.e, state.theta2, omega);
    }
    sLen = strokeLength(state.r, state.l, state.e);
    tr = timeRatio(state.r, state.l, state.e);

    setText('r-theta2', (state.theta2 * DEG).toFixed(1) + '\u00b0');
    setText('r-phi', sol ? (sol.phi * DEG).toFixed(2) + '\u00b0' : '\u2014');
    /* The card captions carry the unit, so the values are bare numbers. */
    setText('r-disp', sol ? lD(sol.Bx).toFixed(2) : '\u2014');
    setText('r-vel', lD(vel).toFixed(isImp() ? 2 : 1));
    setText('r-acc', lD(acc).toFixed(isImp() ? 1 : 0));
    setText('r-stroke', lD(sLen).toFixed(isImp() ? 2 : 1));
    setText('r-ratio', (state.l / state.r).toFixed(2));
    setText('r-timeratio', tr.toFixed(3));
  }

  function setText(id, val) {
    var el = $(id);
    if (el) el.textContent = val;
  }

  /* ================================================================
     SECTION 10: ANIMATION LOOP
     ================================================================ */
  var animId = null, lastTime = 0;

  function animate(ts) {
    animId = requestAnimationFrame(animate);
    if (!state.running || state.mode !== 'simulate') {
      lastTime = ts;
      return;
    }
    var dt = lastTime ? (ts - lastTime) / 1000 : 0;
    lastTime = ts;
    if (dt > 0.1) dt = 0.016;
    var omega = state.rpm * TAU / 60;
    state.theta2 += omega * dt;
    if (state.theta2 >= TAU) state.theta2 -= TAU;
    if (state.theta2 < 0) state.theta2 += TAU;
    draw();
  }
  animId = requestAnimationFrame(animate);

  /* ================================================================
     SECTION 11: EVENT HANDLERS
     ================================================================ */

  /* ---- Mode tabs ---- */
  var modeTabs = $('mode-tabs');
  if (modeTabs) {
    modeTabs.addEventListener('pointerdown', function (ev) {
      var btn = ev.target.closest('[data-mode]');
      if (!btn) return;
      showMode(btn.getAttribute('data-mode'));
    });
  }

  /* ---- Inversion tabs ---- */
  var invTabs = $('inv-tabs');
  if (invTabs) {
    invTabs.addEventListener('pointerdown', function (ev) {
      var btn = ev.target.closest('[data-inv]');
      if (!btn) return;
      var inv = parseInt(btn.getAttribute('data-inv'), 10);
      state.inversion = inv;
      /* highlight active tab */
      qsa('#inv-tabs [data-inv]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      /* offset slider only for inversion 1 */
      var grp = $('grp-offset');
      if (grp) grp.style.display = inv === 1 ? '' : 'none';
      if (inv !== 1) state.e = 0;
      draw();
    });
  }

  /* ---- Graph tabs ---- */
  var graphTabs = $('graph-tabs');
  if (graphTabs) {
    graphTabs.addEventListener('pointerdown', function (ev) {
      var btn = ev.target.closest('[data-graph]');
      if (!btn) return;
      state.graphType = btn.getAttribute('data-graph');
      qsa('#graph-tabs [data-graph]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      draw();
    });
  }

  /* ---- Sliders ---- */
  /* ================================================================
     DISPLAY UNITS  (display only — the kinematics stay in mm)
     Crank/con-rod/offset are lengths, so velocity and acceleration follow
     with the same factor. RPM, angles and the ratio n = l/r are the same
     in both systems.
     ================================================================ */
  var unitSys = 'si';
  var MM_TO_IN = 0.0393701;
  function isImp()  { return unitSys === 'imp'; }
  function lD(mm)   { return isImp() ? mm * MM_TO_IN : mm; }
  function uLen()   { return isImp() ? 'in' : 'mm'; }
  function uVel()   { return isImp() ? 'in/s' : 'mm/s'; }
  function uAcc()   { return isImp() ? 'in/s\u00b2' : 'mm/s\u00b2'; }
  function lFix(mm, dSI, dImp) {
    return lD(mm).toFixed(isImp() ? (dImp == null ? 2 : dImp) : (dSI == null ? 0 : dSI));
  }

  /* Single owner of the four slider captions. onSlider() used to write the
     bare number, which dropped the unit the markup started with. */
  function syncSliderLabels() {
    setText('val-crank',  lFix(state.r) + ' ' + uLen());
    setText('val-conrod', lFix(state.l) + ' ' + uLen());
    setText('val-offset', lFix(state.e) + ' ' + uLen());
    setText('val-rpm',    state.rpm + ' RPM');
    /* Four readout captions carry their unit in the label text. */
    setText('rl-disp',   'x (' + uLen() + ')');
    setText('rl-vel',    'v (' + uVel() + ')');
    setText('rl-acc',    'a (' + uAcc() + ')');
    setText('rl-stroke', 'Stroke (' + uLen() + ')');
  }

  function onSlider(sliderId, valId, prop, parser) {
    var sl = $(sliderId);
    var val = $(valId);
    if (!sl) return;
    sl.addEventListener('input', function () {
      var v = parser ? parser(sl.value) : parseFloat(sl.value);
      state[prop] = v;
      syncSliderLabels();
      draw();
    });
  }
  /* Unit toggle — display only; the kinematics stay in mm */
  qsa('#unit-tabs .pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-unit');
      if (!u || u === unitSys) return;
      unitSys = u;
      qsa('#unit-tabs .pill').forEach(function (b) { b.classList.toggle('active', b === btn); });
      syncSliderLabels();
      draw();
    });
  });

  onSlider('sl-crank', 'val-crank', 'r', parseInt);
  onSlider('sl-conrod', 'val-conrod', 'l', parseInt);
  onSlider('sl-offset', 'val-offset', 'e', parseInt);
  onSlider('sl-rpm', 'val-rpm', 'rpm', parseInt);

  /* ---- Preset buttons ---- */
  qsa('.preset-btn').forEach(function (btn) {
    btn.addEventListener('pointerdown', function () {
      var name = btn.getAttribute('data-preset');
      if (name && PRESETS[name]) applyPreset(name);
    });
  });

  /* ---- Canvas click: toggle running ---- */
  cvs.addEventListener('pointerdown', function () {
    if (state.mode === 'simulate') {
      state.running = !state.running;
    }
  });

  /* ---- Keyboard ---- */
  document.addEventListener('keydown', function (ev) {
    if (state.mode !== 'simulate') return;
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
    if (ev.code === 'Space') {
      ev.preventDefault();
      state.running = !state.running;
    } else if (ev.code === 'ArrowRight') {
      ev.preventDefault();
      state.running = false;
      state.theta2 += 2 * RAD;
      if (state.theta2 >= TAU) state.theta2 -= TAU;
      draw();
    } else if (ev.code === 'ArrowLeft') {
      ev.preventDefault();
      state.running = false;
      state.theta2 -= 2 * RAD;
      if (state.theta2 < 0) state.theta2 += TAU;
      draw();
    }
  });

  /* ================================================================
     SECTION 12: MODE SWITCHING
     ================================================================ */
  function showMode(mode) {
    state.mode = mode;
    /* highlight mode tab */
    qsa('#mode-tabs [data-mode]').forEach(function (b) { b.classList.remove('active'); });
    var activeBtn = qs('#mode-tabs [data-mode="' + mode + '"]');
    if (activeBtn) activeBtn.classList.add('active');

    /* show/hide panels */
    var panels = {
      'sim-panel': mode === 'simulate',
      'cat-row': mode === 'explore',
      'cat-tabs': mode === 'explore',
      'concept-grid': mode === 'explore' && !state.exploreItem,
      'item-info': mode === 'explore' && !!state.exploreItem,
      'practice-panel': mode === 'practice',
      'practice-bar': mode === 'practice',
      'quiz-panel': mode === 'quiz',
      'quiz-bar': mode === 'quiz',
      'quiz-result': false
    };
    for (var pid in panels) {
      var el = $(pid);
      if (el) el.style.display = panels[pid] ? '' : 'none';
    }

    if (mode === 'simulate') {
      state.running = true;
      draw();
    } else {
      state.running = false;
      if (mode === 'explore') renderConceptGrid();
      if (mode === 'practice') {
        if (!state.pracCurrent) newPracticeProblem();
      }
      if (mode === 'quiz') {
        if (state.quizQuestions.length === 0) startQuiz();
      }
      draw();
    }
  }

  /* ================================================================
     SECTION 13: EXPLORE MODE
     ================================================================ */

  /* Category tabs */
  var catTabs = $('cat-tabs');
  if (catTabs) {
    catTabs.addEventListener('pointerdown', function (ev) {
      var btn = ev.target.closest('[data-cat]');
      if (!btn) return;
      state.exploreCat = btn.getAttribute('data-cat');
      state.exploreItem = null;
      qsa('#cat-tabs [data-cat]').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      renderConceptGrid();
      var infoEl = $('item-info');
      if (infoEl) infoEl.style.display = 'none';
      var gridEl = $('concept-grid');
      if (gridEl) gridEl.style.display = '';
    });
  }

  function renderConceptGrid() {
    var grid = $('concept-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === state.exploreCat; });
    filtered.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'concept-btn';
      btn.setAttribute('data-concept', c.id);
      btn.innerHTML = '<strong>' + c.symbol + '</strong><br><span>' + c.name + '</span>';
      btn.addEventListener('pointerdown', function () {
        showConceptInfo(c.id);
      });
      grid.appendChild(btn);
    });
  }

  function showConceptInfo(id) {
    state.exploreItem = id;
    var gridEl = $('concept-grid');
    var infoEl = $('item-info');
    if (gridEl) gridEl.style.display = 'none';
    if (!infoEl) return;
    infoEl.style.display = '';

    var concept = null;
    for (var i = 0; i < CONCEPTS.length; i++) {
      if (CONCEPTS[i].id === id) { concept = CONCEPTS[i]; break; }
    }
    if (!concept) return;

    var html = '<button class="back-btn" id="explore-back">\u2190 Back</button>';
    html += '<h3>' + concept.name + '</h3>';
    html += '<div class="formula-box"><strong>Formula:</strong> ' + concept.formula + '</div>';
    html += '<p>' + concept.desc.replace(/\n/g, '<br>') + '</p>';
    if (concept.example) {
      html += '<div class="example-box">';
      html += '<h4>Worked Example</h4>';
      html += '<p><strong>Problem:</strong> ' + concept.example.problem + '</p>';
      html += '<ol>';
      concept.example.steps.forEach(function (s) {
        html += '<li>' + s + '</li>';
      });
      html += '</ol>';
      html += '<p><strong>Answer:</strong> ' + concept.example.answer + ' ' + (concept.example.unit || '') + '</p>';
      html += '</div>';
    }
    html += '<div class="explore-canvas-wrap"><canvas id="explore-cvs" width="420" height="280"></canvas></div>';
    infoEl.innerHTML = html;

    /* back button */
    var backBtn = document.getElementById('explore-back');
    if (backBtn) {
      backBtn.addEventListener('pointerdown', function () {
        state.exploreItem = null;
        infoEl.style.display = 'none';
        if (gridEl) gridEl.style.display = '';
        renderConceptGrid();
      });
    }

    drawExploreDiagram(id);
  }

  function drawExploreDiagram(id) {
    var cvs2 = document.getElementById('explore-cvs');
    if (!cvs2) return;
    var c = cvs2.getContext('2d');
    var w = 420, h = 280;
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#0d1117';
    c.fillRect(0, 0, w, h);

    switch (id) {
      case 'slider-crank-mechanism': drawExplore_mechanism(c, w, h); break;
      case 'crank-connecting-rod': drawExplore_crankConrod(c, w, h); break;
      case 'stroke-dead-centers': drawExplore_strokeDC(c, w, h); break;
      case 'inversions': drawExplore_inversions(c, w, h); break;
      case 'piston-displacement': drawExplore_curve(c, w, h, 'displacement'); break;
      case 'piston-velocity': drawExplore_curve(c, w, h, 'velocity'); break;
      case 'piston-acceleration': drawExplore_curve(c, w, h, 'acceleration'); break;
      case 'quick-return-ratio': drawExplore_quickReturn(c, w, h); break;
      case 'offset-slider-crank': drawExplore_offset(c, w, h); break;
      case 'connecting-rod-ratio': drawExplore_nRatio(c, w, h); break;
      case 'ic-engine-app': drawExplore_engine(c, w, h); break;
      case 'other-applications': drawExplore_apps(c, w, h); break;
    }
  }

  /* --- Explore diagram helpers --- */
  function drawExplore_mechanism(c, w, h) {
    var ox = 120, oy = 150, sc = 1.5;
    var r = 40, l = 120;
    var theta = PI / 4;
    var Ax = ox + r * sc * Math.cos(theta);
    var Ay = oy - r * sc * Math.sin(theta);
    var sol = solveSliderCrank(r, l, 0, theta);
    if (!sol) return;
    var Bx = ox + sol.Bx * sc, By = oy;

    /* crank */
    c.beginPath(); c.moveTo(ox, oy); c.lineTo(Ax, Ay);
    c.strokeStyle = '#e65100'; c.lineWidth = 4; c.stroke();
    /* conrod */
    c.beginPath(); c.moveTo(Ax, Ay); c.lineTo(Bx, By);
    c.strokeStyle = '#f5c842'; c.lineWidth = 3; c.stroke();
    /* slider */
    c.fillStyle = '#ff8a65';
    c.fillRect(Bx - 10, By - 12, 20, 24);
    /* guide */
    c.strokeStyle = '#556677'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(ox - 20, oy - 14); c.lineTo(Bx + 60, oy - 14); c.stroke();
    c.beginPath(); c.moveTo(ox - 20, oy + 14); c.lineTo(Bx + 60, oy + 14); c.stroke();
    /* joints */
    drawPivotOn(c, ox, oy, '#e65100', 5);
    drawPivotOn(c, Ax, Ay, '#f5c842', 4);
    drawPivotOn(c, Bx, By, '#ff8a65', 3);
    /* labels */
    c.fillStyle = '#ccd0dd'; c.font = '11px monospace'; c.textAlign = 'center';
    c.fillText('O\u2082 (fixed pivot)', ox, oy + 30);
    c.fillText('A (crank pin)', Ax - 20, Ay - 12);
    c.fillText('B (wrist pin)', Bx + 5, By + 28);
    c.fillText('Link 1: Frame (ground)', 210, 30);
    c.fillText('Link 2: Crank (r)', 80, 50);
    c.fillText('Link 3: Con-rod (l)', 250, 100);
    c.fillText('Link 4: Slider', Bx + 5, By + 44);
  }

  function drawPivotOn(c, x, y, color, radius) {
    c.beginPath(); c.arc(x, y, radius, 0, TAU);
    c.fillStyle = color; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
  }

  function drawExplore_crankConrod(c, w, h) {
    var ox = 80, oy = 140, sc = 1.8;
    var r = 40, l = 120;
    c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + r * sc, oy);
    c.strokeStyle = '#e65100'; c.lineWidth = 5; c.stroke();
    c.beginPath(); c.moveTo(ox + r * sc, oy); c.lineTo(ox + (r + l) * sc, oy);
    c.strokeStyle = '#f5c842'; c.lineWidth = 4; c.stroke();
    /* dimension r */
    c.strokeStyle = '#6b7a99'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(ox, oy + 20); c.lineTo(ox + r * sc, oy + 20); c.stroke();
    c.fillStyle = '#3ddc84'; c.font = '12px monospace'; c.textAlign = 'center';
    c.fillText('r = crank radius', ox + r * sc / 2, oy + 36);
    /* dimension l */
    c.beginPath(); c.moveTo(ox + r * sc, oy + 20); c.lineTo(ox + (r + l) * sc, oy + 20); c.stroke();
    c.fillStyle = '#4db6ac';
    c.fillText('l = con-rod length', ox + r * sc + l * sc / 2, oy + 36);
    /* n */
    c.fillStyle = '#ffffff'; c.font = 'bold 14px monospace';
    c.fillText('n = l / r = ' + (l / r).toFixed(1), w / 2, 60);
    c.font = '11px monospace'; c.fillStyle = '#aabbcc';
    c.fillText('Typical: n = 2.5 to 5 for engines', w / 2, 80);
    drawPivotOn(c, ox, oy, '#e65100', 5);
    drawPivotOn(c, ox + r * sc, oy, '#f5c842', 4);
  }

  function drawExplore_strokeDC(c, w, h) {
    var ox = 100, oy = 140, sc = 1.4;
    var r = 40, l = 120;
    var tdcX = ox + (r + l) * sc, bdcX = ox + (l - r) * sc;
    /* TDC configuration */
    c.beginPath(); c.moveTo(ox, oy); c.lineTo(tdcX, oy);
    c.strokeStyle = '#e65100'; c.lineWidth = 3; c.setLineDash([5, 3]); c.stroke(); c.setLineDash([]);
    /* BDC configuration */
    c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox - r * sc, oy);
    c.strokeStyle = '#42a5f5'; c.lineWidth = 3; c.setLineDash([5, 3]); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(ox - r * sc, oy); c.lineTo(bdcX, oy);
    c.strokeStyle = '#42a5f5'; c.lineWidth = 2; c.setLineDash([5, 3]); c.stroke(); c.setLineDash([]);
    /* stroke dimension */
    c.strokeStyle = '#3ddc84'; c.lineWidth = 1; c.setLineDash([]);
    c.beginPath(); c.moveTo(bdcX, oy + 30); c.lineTo(tdcX, oy + 30); c.stroke();
    c.fillStyle = '#3ddc84'; c.font = '12px monospace'; c.textAlign = 'center';
    c.fillText('Stroke S = 2r', (bdcX + tdcX) / 2, oy + 48);
    /* labels */
    c.fillStyle = '#e65100'; c.fillText('TDC (\u03b8=0\u00b0)', tdcX, oy - 15);
    c.fillStyle = '#42a5f5'; c.fillText('BDC (\u03b8=180\u00b0)', bdcX, oy - 15);
    drawPivotOn(c, ox, oy, '#ffffff', 5);
    c.fillStyle = '#ccd0dd'; c.font = '10px monospace';
    c.fillText('O\u2082', ox, oy + 18);
  }

  function drawExplore_inversions(c, w, h) {
    var labels = ['1st: IC Engine', '2nd: Whitworth', '3rd: Osc. Cylinder', '4th: Hand Pump'];
    var colors = ['#e65100', '#f5c842', '#4db6ac', '#ff8a65'];
    for (var i = 0; i < 4; i++) {
      var col = i % 2, row = Math.floor(i / 2);
      var cx = 110 + col * 200, cy = 70 + row * 130;
      c.strokeStyle = colors[i]; c.lineWidth = 2;
      c.strokeRect(cx - 90, cy - 50, 180, 100);
      c.fillStyle = colors[i]; c.font = '11px monospace'; c.textAlign = 'center';
      c.fillText(labels[i], cx, cy - 30);
      /* mini mechanism sketch */
      c.strokeStyle = colors[i]; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx - 30, cy + 10); c.lineTo(cx, cy - 10); c.lineTo(cx + 40, cy + 10);
      c.stroke();
      drawPivotOn(c, cx - 30, cy + 10, colors[i], 3);
      drawPivotOn(c, cx, cy - 10, colors[i], 3);
      drawPivotOn(c, cx + 40, cy + 10, colors[i], 3);
      /* fixed indicator */
      c.fillStyle = '#8899aa'; c.font = '9px monospace';
      var fixedText = i === 0 ? 'frame fixed' : i === 1 ? 'crank fixed' : i === 2 ? 'con-rod fixed' : 'slider fixed';
      c.fillText(fixedText, cx, cy + 35);
    }
  }

  function drawExplore_curve(c, w, h, type) {
    var r = 40, l = 120, e = 0;
    var omega = 20;
    var gL = 50, gR = w - 30, gT = 40, gB = h - 30;
    var gW = gR - gL, gH = gB - gT;
    var data = [];
    var yMin = Infinity, yMax = -Infinity;
    for (var i = 0; i <= 360; i += 2) {
      var th = i * RAD;
      var sol = solveSliderCrank(r, l, e, th);
      var val = 0;
      if (sol) {
        if (type === 'displacement') val = sol.Bx;
        else if (type === 'velocity') val = pistonVelocity(r, l, e, th, omega);
        else val = pistonAcceleration(r, l, e, th, omega);
      }
      data.push(val);
      if (val < yMin) yMin = val;
      if (val > yMax) yMax = val;
    }
    var yRange = yMax - yMin || 1;
    yMin -= yRange * 0.05; yMax += yRange * 0.05;
    yRange = yMax - yMin;

    /* axes */
    c.strokeStyle = '#6b7a99'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(gL, gB); c.lineTo(gR, gB); c.stroke();
    c.beginPath(); c.moveTo(gL, gT); c.lineTo(gL, gB); c.stroke();
    /* curve */
    c.beginPath();
    for (var j = 0; j < data.length; j++) {
      var px = gL + (j * 2 / 360) * gW;
      var py = gT + ((yMax - data[j]) / yRange) * gH;
      if (j === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.strokeStyle = type === 'displacement' ? '#3ddc84' : type === 'velocity' ? '#42a5f5' : '#ef5350';
    c.lineWidth = 2; c.stroke();
    /* labels */
    c.fillStyle = '#ccd0dd'; c.font = '11px monospace'; c.textAlign = 'center';
    c.fillText(type.charAt(0).toUpperCase() + type.slice(1) + ' vs \u03b8', w / 2, 25);
    c.font = '9px monospace'; c.fillStyle = '#8899aa';
    c.fillText('0\u00b0', gL, gB + 12); c.fillText('180\u00b0', gL + gW / 2, gB + 12);
    c.fillText('360\u00b0', gR, gB + 12);
  }

  function drawExplore_quickReturn(c, w, h) {
    var cx = w / 2, cy = h / 2 + 10;
    /* circle representing crank rotation */
    var R = 80;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU);
    c.strokeStyle = '#6b7a99'; c.lineWidth = 1; c.stroke();
    /* cutting arc (larger) */
    var alpha = 35 * RAD;
    c.beginPath(); c.arc(cx, cy, R, -(PI - alpha), alpha);
    c.strokeStyle = '#3ddc84'; c.lineWidth = 4; c.stroke();
    /* return arc (smaller) */
    c.beginPath(); c.arc(cx, cy, R, alpha, -(PI - alpha));
    c.strokeStyle = '#ef5350'; c.lineWidth = 4; c.stroke();
    /* labels */
    c.fillStyle = '#3ddc84'; c.font = '11px monospace'; c.textAlign = 'center';
    c.fillText('Cutting (slow)', cx + R + 35, cy - 20);
    c.fillStyle = '#ef5350';
    c.fillText('Return (fast)', cx - R - 35, cy + 20);
    c.fillStyle = '#ffffff'; c.font = 'bold 12px monospace';
    c.fillText('TR = cutting angle / return angle', cx, 25);
    drawPivotOn(c, cx, cy, '#ffffff', 4);
  }

  function drawExplore_offset(c, w, h) {
    var ox1 = 110, ox2 = 310, oy = 140;
    /* inline */
    c.fillStyle = '#3ddc84'; c.font = '11px monospace'; c.textAlign = 'center';
    c.fillText('Inline (e=0)', ox1, 30);
    c.strokeStyle = '#6b7a99'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(ox1 - 60, oy); c.lineTo(ox1 + 60, oy); c.stroke();
    drawPivotOn(c, ox1, oy, '#e65100', 5);
    c.fillStyle = '#8899aa'; c.font = '9px monospace';
    c.fillText('S = 2r (symmetric)', ox1, oy + 50);

    /* offset */
    c.fillStyle = '#4db6ac'; c.font = '11px monospace'; c.textAlign = 'center';
    c.fillText('Offset (e > 0)', ox2, 30);
    c.strokeStyle = '#6b7a99'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(ox2 - 60, oy + 20); c.lineTo(ox2 + 60, oy + 20); c.stroke();
    c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(ox2, oy); c.lineTo(ox2, oy + 20); c.stroke();
    c.setLineDash([]);
    drawPivotOn(c, ox2, oy, '#e65100', 5);
    c.fillStyle = '#4db6ac'; c.font = '10px monospace';
    c.fillText('e', ox2 + 10, oy + 12);
    c.fillStyle = '#8899aa'; c.font = '9px monospace';
    c.fillText('S \u2260 2r (asymmetric)', ox2, oy + 60);
    c.fillText('Quick-return effect', ox2, oy + 75);
  }

  function drawExplore_nRatio(c, w, h) {
    /* overlay two displacement curves: n=2 and n=4 */
    var gL = 60, gR = w - 30, gT = 50, gB = h - 30;
    var gW = gR - gL, gH = gB - gT;
    var r = 40;
    var configs = [{ n: 2, l: 80, color: '#ef5350', label: 'n=2' }, { n: 4, l: 160, color: '#42a5f5', label: 'n=4' }];
    c.fillStyle = '#ffffff'; c.font = 'bold 11px monospace'; c.textAlign = 'center';
    c.fillText('Effect of n = l/r on displacement', w / 2, 20);

    configs.forEach(function (cfg) {
      var data = [];
      var yMin2 = Infinity, yMax2 = -Infinity;
      for (var i = 0; i <= 360; i += 2) {
        var sol = solveSliderCrank(r, cfg.l, 0, i * RAD);
        var val = sol ? sol.Bx : 0;
        data.push(val);
        if (val < yMin2) yMin2 = val;
        if (val > yMax2) yMax2 = val;
      }
      /* normalize to 0-1 */
      var rng = yMax2 - yMin2 || 1;
      c.beginPath();
      for (var j = 0; j < data.length; j++) {
        var px = gL + (j * 2 / 360) * gW;
        var py = gT + ((yMax2 - data[j]) / rng) * gH;
        if (j === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.strokeStyle = cfg.color; c.lineWidth = 2; c.stroke();
    });

    /* legend */
    c.fillStyle = '#ef5350'; c.font = '10px monospace'; c.textAlign = 'left';
    c.fillText('\u2014 n = 2 (more distorted)', gL + 10, gT + 15);
    c.fillStyle = '#42a5f5';
    c.fillText('\u2014 n = 4 (more sinusoidal)', gL + 10, gT + 30);

    /* axes */
    c.strokeStyle = '#6b7a99'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(gL, gB); c.lineTo(gR, gB); c.stroke();
    c.beginPath(); c.moveTo(gL, gT); c.lineTo(gL, gB); c.stroke();
  }

  function drawExplore_engine(c, w, h) {
    var cx = w / 2, cy = h / 2 + 20;
    /* simple engine cross-section */
    /* cylinder */
    c.strokeStyle = '#8899aa'; c.lineWidth = 3;
    c.strokeRect(cx - 40, cy - 80, 80, 120);
    /* piston */
    c.fillStyle = '#ff8a65';
    c.fillRect(cx - 35, cy - 20, 70, 20);
    c.strokeStyle = '#c75b39'; c.lineWidth = 1;
    c.strokeRect(cx - 35, cy - 20, 70, 20);
    /* bore dimension */
    c.strokeStyle = '#3ddc84'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx - 40, cy - 90); c.lineTo(cx + 40, cy - 90); c.stroke();
    c.fillStyle = '#3ddc84'; c.font = '10px monospace'; c.textAlign = 'center';
    c.fillText('Bore D', cx, cy - 95);
    /* stroke dimension */
    c.strokeStyle = '#42a5f5';
    c.beginPath(); c.moveTo(cx + 50, cy - 80); c.lineTo(cx + 50, cy + 40); c.stroke();
    c.fillStyle = '#42a5f5';
    c.save(); c.translate(cx + 60, cy - 20); c.rotate(-PI / 2);
    c.fillText('Stroke S', 0, 0); c.restore();
    /* formulas */
    c.fillStyle = '#ffffff'; c.font = '11px monospace'; c.textAlign = 'center';
    c.fillText('V_swept = (\u03c0/4) D\u00b2 S', cx, 30);
    c.fillText('CR = (V_s + V_c) / V_c', cx, 48);
  }

  function drawExplore_apps(c, w, h) {
    var apps = [
      { name: 'IC Engine', desc: '1st inv.', x: 80, y: 70 },
      { name: 'Compressor', desc: '1st inv.', x: 230, y: 70 },
      { name: 'Shaper', desc: '2nd inv.', x: 80, y: 170 },
      { name: 'Hand Pump', desc: '4th inv.', x: 230, y: 170 }
    ];
    var colors = ['#e65100', '#3ddc84', '#f5c842', '#42a5f5'];
    apps.forEach(function (app, i) {
      c.fillStyle = 'rgba(100,120,150,0.15)';
      roundRectOn(c, app.x - 60, app.y - 35, 120, 70, 6);
      c.fill();
      c.strokeStyle = colors[i]; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = colors[i]; c.font = 'bold 12px monospace'; c.textAlign = 'center';
      c.fillText(app.name, app.x, app.y - 5);
      c.fillStyle = '#8899aa'; c.font = '10px monospace';
      c.fillText(app.desc, app.x, app.y + 15);
    });
  }

  function roundRectOn(c, x, y, w2, h2, r2) {
    c.beginPath();
    c.moveTo(x + r2, y);
    c.lineTo(x + w2 - r2, y);
    c.quadraticCurveTo(x + w2, y, x + w2, y + r2);
    c.lineTo(x + w2, y + h2 - r2);
    c.quadraticCurveTo(x + w2, y + h2, x + w2 - r2, y + h2);
    c.lineTo(x + r2, y + h2);
    c.quadraticCurveTo(x, y + h2, x, y + h2 - r2);
    c.lineTo(x, y + r2);
    c.quadraticCurveTo(x, y, x + r2, y);
    c.closePath();
  }

  /* ================================================================
     SECTION 14: PRACTICE MODE
     ================================================================ */
  function newPracticeProblem() {
    var idx = randInt(0, PROBLEM_GEN.length - 1);
    var prob = PROBLEM_GEN[idx]();
    state.pracCurrent = prob;
    state.pracAnswered = false;

    var promptEl = $('pp-prompt');
    var inputEl = $('pp-input');
    var unitEl = $('pp-unit');
    var fbEl = $('pp-feedback');
    var solEl = $('pp-solution');
    var showSolBtn = $('pp-show-sol');
    var scoreEl = $('pp-score');

    if (promptEl) promptEl.textContent = prob.prompt;
    if (inputEl) { inputEl.value = ''; inputEl.disabled = false; inputEl.focus(); }
    if (unitEl) unitEl.textContent = prob.unit || '';
    if (fbEl) { fbEl.textContent = ''; fbEl.className = 'pp-feedback'; }
    if (solEl) solEl.style.display = 'none';
    if (showSolBtn) showSolBtn.style.display = 'none';
    if (scoreEl) scoreEl.textContent = state.pracScore + ' / ' + state.pracTotal;
  }

  function checkPracticeAnswer() {
    if (state.pracAnswered || !state.pracCurrent) return;
    var inputEl = $('pp-input');
    var fbEl = $('pp-feedback');
    var showSolBtn = $('pp-show-sol');
    if (!inputEl || !fbEl) return;

    var userVal = inputEl.value.trim();
    if (!userVal) return;

    var prob = state.pracCurrent;
    var correct = false;

    if (prob.type === 'text') {
      correct = userVal.toLowerCase().replace(/\s+/g, '') ===
                String(prob.answer).toLowerCase().replace(/\s+/g, '');
    } else {
      var num = parseFloat(userVal);
      if (!isNaN(num)) {
        var expected = parseFloat(prob.answer);
        var tol = Math.max(Math.abs(expected) * 0.05, 0.5);
        correct = Math.abs(num - expected) <= tol;
      }
    }

    state.pracAnswered = true;
    state.pracTotal++;
    if (correct) {
      state.pracScore++;
      fbEl.textContent = 'Correct!';
      fbEl.className = 'pp-feedback correct';
    } else {
      fbEl.textContent = 'Incorrect. Expected: ' + prob.answer + (prob.unit ? ' ' + prob.unit : '');
      fbEl.className = 'pp-feedback incorrect';
    }
    if (showSolBtn) showSolBtn.style.display = '';
    inputEl.disabled = true;
    var scoreEl = $('pp-score');
    if (scoreEl) scoreEl.textContent = state.pracScore + ' / ' + state.pracTotal;
  }

  function showPracticeSolution() {
    if (!state.pracCurrent) return;
    var solEl = $('pp-solution');
    var stepsEl = $('pp-sol-steps');
    if (!solEl || !stepsEl) return;
    solEl.style.display = '';
    stepsEl.innerHTML = '';
    state.pracCurrent.steps.forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s;
      stepsEl.appendChild(li);
    });
  }

  /* Practice event handlers */
  var checkBtn = $('pp-check');
  if (checkBtn) checkBtn.addEventListener('pointerdown', checkPracticeAnswer);

  var nextBtn = $('pp-next');
  if (nextBtn) nextBtn.addEventListener('pointerdown', newPracticeProblem);

  var showSolBtn2 = $('pp-show-sol');
  if (showSolBtn2) showSolBtn2.addEventListener('pointerdown', showPracticeSolution);

  /* Enter key to submit practice */
  var pracInput = $('pp-input');
  if (pracInput) {
    pracInput.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') {
        if (!state.pracAnswered) checkPracticeAnswer();
        else newPracticeProblem();
      }
    });
  }

  /* ================================================================
     SECTION 15: QUIZ MODE
     ================================================================ */
  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    shuffle(pool);
    state.quizQuestions = pool.slice(0, 5);
    state.quizIdx = 0;
    state.quizScore = 0;
    state.quizAnswered = false;
    state.quizResults = [];

    var resultEl = $('quiz-result');
    if (resultEl) resultEl.style.display = 'none';
    var panelEl = $('quiz-panel');
    if (panelEl) panelEl.style.display = '';
    var barEl = $('quiz-bar');
    if (barEl) barEl.style.display = '';

    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = state.quizQuestions[state.quizIdx];
    if (!q) return;

    var promptEl = $('qp-prompt');
    var answersEl = $('qp-answers');
    var fbEl = $('qp-feedback');
    var numEl = $('qbar-num');
    var totalEl = $('qbar-total');
    var submitBtn = $('q-submit');
    var nextBtnQ = $('q-next');

    if (promptEl) promptEl.textContent = q.q;
    if (fbEl) { fbEl.textContent = ''; fbEl.className = 'qp-feedback'; }
    if (numEl) numEl.textContent = state.quizIdx + 1;
    if (totalEl) totalEl.textContent = state.quizQuestions.length;
    if (submitBtn) submitBtn.style.display = '';
    if (nextBtnQ) nextBtnQ.style.display = 'none';
    state.quizAnswered = false;

    if (answersEl) {
      answersEl.innerHTML = '';
      q.choices.forEach(function (ch, ci) {
        var btn = document.createElement('button');
        btn.className = 'quiz-choice';
        btn.setAttribute('data-idx', ci);
        btn.textContent = ch;
        btn.addEventListener('pointerdown', function () {
          if (state.quizAnswered) return;
          qsa('.quiz-choice').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
        });
        answersEl.appendChild(btn);
      });
    }
  }

  function submitQuizAnswer() {
    if (state.quizAnswered) return;
    var selected = qs('.quiz-choice.selected');
    if (!selected) return;

    var idx = parseInt(selected.getAttribute('data-idx'), 10);
    var q = state.quizQuestions[state.quizIdx];
    var correct = idx === q.correct;

    state.quizAnswered = true;
    if (correct) state.quizScore++;
    state.quizResults.push({ q: q.q, chosen: q.choices[idx], correct: correct, answer: q.choices[q.correct] });

    /* highlight correct/incorrect */
    qsa('.quiz-choice').forEach(function (b) {
      var bidx = parseInt(b.getAttribute('data-idx'), 10);
      if (bidx === q.correct) b.classList.add('correct');
      if (bidx === idx && !correct) b.classList.add('incorrect');
      b.style.pointerEvents = 'none';
    });

    var fbEl = $('qp-feedback');
    if (fbEl) {
      fbEl.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.choices[q.correct];
      fbEl.className = 'qp-feedback ' + (correct ? 'correct' : 'incorrect');
    }
    var submitBtn = $('q-submit');
    var nextBtnQ = $('q-next');
    if (submitBtn) submitBtn.style.display = 'none';
    if (nextBtnQ) nextBtnQ.style.display = '';
  }

  function nextQuizQuestion() {
    state.quizIdx++;
    if (state.quizIdx >= state.quizQuestions.length) {
      showQuizResult();
      return;
    }
    renderQuizQuestion();
  }

  function showQuizResult() {
    var panelEl = $('quiz-panel');
    var barEl = $('quiz-bar');
    var resultEl = $('quiz-result');
    if (panelEl) panelEl.style.display = 'none';
    if (barEl) barEl.style.display = 'none';
    if (resultEl) resultEl.style.display = '';

    var scoreEl = $('qr-score');
    var starsEl = $('qr-stars');
    var verdictEl = $('qr-verdict');
    var rowsEl = $('qr-rows');

    var total = state.quizQuestions.length;
    var pct = state.quizScore / total;

    if (scoreEl) scoreEl.textContent = state.quizScore + ' / ' + total;
    if (starsEl) {
      var starCount = pct >= 0.8 ? 3 : pct >= 0.6 ? 2 : pct >= 0.4 ? 1 : 0;
      var starStr = '';
      for (var si = 0; si < 3; si++) starStr += si < starCount ? '\u2605' : '\u2606';
      starsEl.textContent = starStr;
    }
    if (verdictEl) {
      verdictEl.textContent = pct >= 0.8 ? 'Excellent! Strong understanding of slider-crank mechanisms.' :
                              pct >= 0.6 ? 'Good work! Review the concepts you missed.' :
                              pct >= 0.4 ? 'Fair. Spend more time exploring the concepts.' :
                              'Keep studying! Review all concept categories.';
    }
    if (rowsEl) {
      rowsEl.innerHTML = '';
      state.quizResults.forEach(function (res, ri) {
        var row = document.createElement('div');
        row.className = 'qr-row ' + (res.correct ? 'correct' : 'incorrect');
        row.innerHTML = '<span class="qr-num">' + (ri + 1) + '.</span> ' +
                        '<span class="qr-q">' + res.q + '</span> ' +
                        '<span class="qr-a">' + (res.correct ? 'Correct' : 'Your answer: ' + res.chosen + ' | Correct: ' + res.answer) + '</span>';
        rowsEl.appendChild(row);
      });
    }
  }

  /* Quiz event handlers */
  var submitBtnQ = $('q-submit');
  if (submitBtnQ) submitBtnQ.addEventListener('pointerdown', submitQuizAnswer);

  var nextBtnQ2 = $('q-next');
  if (nextBtnQ2) nextBtnQ2.addEventListener('pointerdown', nextQuizQuestion);

  var newQuizBtn = $('q-new-quiz');
  if (newQuizBtn) newQuizBtn.addEventListener('pointerdown', startQuiz);

  /* ================================================================
     SECTION 16: PRESET APPLICATION
     ================================================================ */
  function applyPreset(name) {
    var p = PRESETS[name];
    if (!p) return;

    state.inversion = p.inv;
    state.r = p.r;
    state.l = p.l;
    state.e = p.e;
    state.rpm = p.rpm;
    state.theta2 = p.theta2 || 0;
    state.activePreset = name;

    /* update sliders */
    var slR = $('sl-crank');  if (slR) slR.value = p.r;
    var slL = $('sl-conrod'); if (slL) slL.value = p.l;
    var slE = $('sl-offset'); if (slE) slE.value = p.e;
    var slN = $('sl-rpm');    if (slN) slN.value = p.rpm;
    syncSliderLabels();

    /* update inversion tabs */
    qsa('#inv-tabs [data-inv]').forEach(function (b) {
      b.classList.toggle('active', parseInt(b.getAttribute('data-inv'), 10) === p.inv);
    });

    /* offset group */
    var grp = $('grp-offset');
    if (grp) grp.style.display = p.inv === 1 ? '' : 'none';

    /* highlight preset btn */
    qsa('.preset-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-preset') === name);
    });

    draw();
  }

  /* ================================================================
     SECTION 17: INITIALIZATION
     ================================================================ */
  applyPreset('ic-engine');
  showMode('simulate');
  renderConceptGrid();

})();
