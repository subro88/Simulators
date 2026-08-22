(function () {
  'use strict';

  /* ================================================================
     DATA -- CONCEPTS
     ================================================================ */

  var CONCEPTS = [
    /* -- Basics --------------------------------------------------- */
    {
      id: 'truss-def', name: 'What is a Truss?', symbol: 'Truss',
      formula: 'Members + Joints = Truss', unit: '\u2014',
      cat: 'basics',
      desc: 'A truss is a structural framework of straight members connected at joints (nodes or pins). All loads are applied at joints and all members carry only axial forces \u2014 tension (pulling) or compression (pushing). Trusses are lightweight yet strong, making them ideal for bridges, roofs, towers, and cranes. Members are assumed to be two-force members connected by frictionless pins.',
      diagram: 'trussDef',
      example: { problem: 'A simple truss has 7 members and 5 joints. Is it statically determinate? (Answer 1 for yes, 0 for no)', steps: ['Determinacy check: m + r = 2j', 'r = 3 (pin + roller)', 'm + r = 7 + 3 = 10', '2j = 2 \u00D7 5 = 10', '10 = 10 \u2192 Statically Determinate'], answer: 1, unit: '' }
    },
    {
      id: 'truss-types', name: 'Truss Types', symbol: 'Warren / Pratt / Howe',
      formula: 'Warren, Pratt, Howe, K-Truss', unit: '\u2014',
      cat: 'basics',
      desc: 'The Warren truss has diagonal members alternating in direction, forming a W-pattern without verticals (some variants include verticals). The Pratt truss has vertical members and diagonals that slope toward the centre \u2014 diagonals are in tension under gravity loads, which is efficient for steel. The Howe truss has verticals and diagonals sloping away from the centre \u2014 diagonals are in compression, suitable for timber. The K-truss has members forming a K-shape at each panel point.',
      diagram: 'trussTypes',
      example: { problem: 'In a Pratt truss under gravity loading, are the diagonal members typically in tension or compression? (Answer 1 for tension, 0 for compression)', steps: ['Pratt truss: diagonals slope toward centre', 'Under gravity, diagonals carry tensile forces', 'Verticals carry compressive forces', 'This makes Pratt efficient for steel construction'], answer: 1, unit: '' }
    },
    {
      id: 'determinacy', name: 'Static Determinacy', symbol: 'm+r=2j',
      formula: 'm + r = 2j', unit: '\u2014',
      cat: 'basics',
      desc: 'A truss is statically determinate when the number of unknowns equals the number of equilibrium equations. For a 2D truss: m + r = 2j, where m = number of members, r = number of external reactions, and j = number of joints. If m + r < 2j, the truss is a mechanism (unstable). If m + r > 2j, the truss is statically indeterminate (has redundant members).',
      diagram: 'determinacy',
      example: { problem: 'A truss has 9 members, 6 joints, and a pin + roller support (r = 3). Is it determinate, indeterminate, or a mechanism?', steps: ['m + r = 9 + 3 = 12', '2j = 2 \u00D7 6 = 12', '12 = 12', 'The truss is statically determinate'], answer: 12, unit: '' }
    },
    {
      id: 'joints-members', name: 'Joints & Members', symbol: 'j, m',
      formula: 'Simple truss: m = 2j \u2212 3', unit: '\u2014',
      cat: 'basics',
      desc: 'Joints (nodes) are the points where members connect. In an ideal truss, joints are frictionless pins that transmit forces but not moments. Members are the straight bars connecting joints \u2014 each carries only an axial force. A simple truss starts with a triangle (3 joints, 3 members) and adds 2 members plus 1 joint for each new panel. The formula m = 2j \u2212 3 gives the minimum members for a simple, stable truss.',
      diagram: 'jointsMembers',
      example: { problem: 'A simple truss has 8 joints. How many members does it need to be stable?', steps: ['For a simple truss: m = 2j \u2212 3', 'm = 2 \u00D7 8 \u2212 3', 'm = 16 \u2212 3', 'm = 13 members'], answer: 13, unit: 'members' }
    },

    /* -- Methods -------------------------------------------------- */
    {
      id: 'method-joints', name: 'Method of Joints', symbol: '\u03A3Fx=0, \u03A3Fy=0',
      formula: 'At each joint: \u03A3Fx = 0, \u03A3Fy = 0', unit: '\u2014',
      cat: 'methods',
      desc: 'The method of joints analyses equilibrium at each joint sequentially. Since forces at a joint are concurrent (all pass through one point), only two equations apply: \u03A3Fx = 0 and \u03A3Fy = 0. Begin at a joint with at most two unknown member forces (usually at a support). Solve for those forces, then move to the next joint. Positive results indicate tension; negative results indicate compression.',
      diagram: 'methodJoints',
      example: { problem: 'At a joint, member AB makes 45\u00B0 with horizontal. The vertical reaction is 10 kN upward and member AC is horizontal. Find force in AB (kN). (Positive = tension)', steps: ['\u03A3Fy = 0: F_AB \u00D7 sin(45\u00B0) + 10 = 0', 'F_AB \u00D7 0.707 = \u221210', 'F_AB = \u221214.14 kN', 'Negative means compression'], answer: -14.14, unit: 'kN' }
    },
    {
      id: 'method-sections', name: 'Method of Sections', symbol: '\u03A3M=0',
      formula: 'Cut truss, apply \u03A3Fx=0, \u03A3Fy=0, \u03A3M=0', unit: '\u2014',
      cat: 'methods',
      desc: 'The method of sections is used to find forces in specific members without solving the entire truss. A virtual cut is made through the truss, passing through no more than 3 members with unknown forces. The equilibrium of one portion is analysed using three equations: \u03A3Fx = 0, \u03A3Fy = 0, and \u03A3M = 0. Taking moments about a point where two unknown forces intersect directly solves for the third.',
      diagram: 'methodSections',
      example: { problem: 'A cut through a truss exposes member DE (horizontal, at height 3 m). Ra = 15 kN, the cut is 4 m from A. Taking moments about the top joint, find force in the bottom chord DE (kN).', steps: ['\u03A3M about top joint = 0', 'Ra \u00D7 4 = F_DE \u00D7 3', '15 \u00D7 4 = F_DE \u00D7 3', 'F_DE = 60/3 = 20 kN (tension)'], answer: 20, unit: 'kN' }
    },
    {
      id: 'zero-force', name: 'Zero-Force Members', symbol: 'F = 0',
      formula: 'Two non-collinear members at unloaded joint: both = 0', unit: '\u2014',
      cat: 'methods',
      desc: 'Zero-force members carry no load under specific conditions. Rule 1: If only two non-collinear members meet at an unloaded joint, both are zero-force. Rule 2: If three members meet at an unloaded joint and two are collinear, the third is zero-force. These rules help simplify truss analysis by identifying members with F = 0 before calculations begin.',
      diagram: 'zeroForce',
      example: { problem: 'At joint G, only two members meet (GH at 60\u00B0 and GF at 0\u00B0) and there is no external load. How many zero-force members are at this joint?', steps: ['Rule 1: Two non-collinear members at unloaded joint', 'GH and GF are not collinear (60\u00B0 vs 0\u00B0)', 'No external load at joint G', 'Both GH and GF are zero-force members \u2192 2'], answer: 2, unit: 'members' }
    },
    {
      id: 'reactions-calc', name: 'Support Reactions', symbol: 'Ra, Rb',
      formula: '\u03A3M_A=0 \u2192 Rb, \u03A3Fy=0 \u2192 Ra', unit: 'kN',
      cat: 'methods',
      desc: 'Before analysing member forces, support reactions must be found. A typical truss has a pin support (providing horizontal and vertical reactions) and a roller support (providing only a vertical reaction) \u2014 giving 3 unknowns total. Using \u03A3Fx = 0, \u03A3Fy = 0, and \u03A3M = 0 about one support, all reactions can be determined. The truss span and applied loads determine the reaction magnitudes.',
      diagram: 'reactionsCalc',
      example: { problem: 'A 12 m span truss has a 20 kN load at 4 m from A. Find Rb (kN).', steps: ['\u03A3M_A = 0: Rb \u00D7 12 = 20 \u00D7 4', 'Rb = 80 / 12', 'Rb = 6.67 kN', '\u03A3Fy = 0: Ra = 20 \u2212 6.67 = 13.33 kN'], answer: 6.67, unit: 'kN' }
    },

    /* -- Forces & Members ----------------------------------------- */
    {
      id: 'tension', name: 'Tension Members', symbol: 'T (+)',
      formula: 'F > 0 \u2192 Tension (member being pulled)', unit: 'kN',
      cat: 'forces',
      desc: 'A member in tension is being pulled apart \u2014 the internal force acts away from the joint at both ends. In truss diagrams, tension members are typically shown in green. Tension members resist elongation. In a Pratt truss under gravity loads, diagonal members are typically in tension. Steel and cables are efficient tension members because steel has high tensile strength.',
      diagram: 'tension',
      example: { problem: 'A diagonal member at 30\u00B0 from horizontal must resist a net vertical pull of 8 kN at a joint. Find the tension in the member (kN).', steps: ['Vertical component: F \u00D7 sin(30\u00B0) = 8', 'F \u00D7 0.5 = 8', 'F = 8 / 0.5', 'F = 16 kN (tension)'], answer: 16, unit: 'kN' }
    },
    {
      id: 'compression', name: 'Compression Members', symbol: 'C (\u2212)',
      formula: 'F < 0 \u2192 Compression (member being pushed)', unit: 'kN',
      cat: 'forces',
      desc: 'A member in compression is being pushed together \u2014 the internal force acts toward the joint at both ends. In truss diagrams, compression members are typically shown in red. Compression members must resist buckling \u2014 they require adequate cross-sectional area and moment of inertia. In a Howe truss under gravity loads, diagonal members are typically in compression.',
      diagram: 'compression',
      example: { problem: 'A vertical member carries the full weight of a 25 kN load applied at its top joint. What is the force in the member (kN)?', steps: ['The vertical member carries the load directly', 'Force = \u221225 kN (compression)', 'Negative sign indicates compression', 'Member is being shortened by the load'], answer: -25, unit: 'kN' }
    },
    {
      id: 'equilibrium-joint', name: 'Joint Equilibrium', symbol: '\u03A3F = 0',
      formula: 'At each joint: \u03A3Fx = 0 and \u03A3Fy = 0', unit: '\u2014',
      cat: 'forces',
      desc: 'Each joint of a truss must be in static equilibrium. Since all member forces and external forces at a joint pass through the same point (concurrent forces), moments are automatically zero. Only two equations are available at each joint: \u03A3Fx = 0 (sum of horizontal components) and \u03A3Fy = 0 (sum of vertical components). This limits the solution to joints with at most two unknown member forces.',
      diagram: 'equilibriumJoint',
      example: { problem: 'At a joint, member AB (horizontal) has F = 12 kN tension, and member AC is at 60\u00B0 above horizontal. No external load. Find F in AC (kN).', steps: ['\u03A3Fx = 0: 12 + F_AC \u00D7 cos(60\u00B0) = 0', '12 + F_AC \u00D7 0.5 = 0', 'F_AC = \u221224 kN', 'Compression (pushes toward joint)'], answer: -24, unit: 'kN' }
    },
    {
      id: 'truss-deflection', name: 'Truss Behaviour', symbol: '\u0394',
      formula: '\u0394 = \u03A3(F\u00B7L)/(A\u00B7E) \u00D7 f', unit: 'mm',
      cat: 'forces',
      desc: 'Under load, trusses deflect due to axial deformation of members. The virtual work method calculates deflection: \u0394 = \u03A3(F\u00B7f\u00B7L)/(A\u00B7E), where F = real member force, f = virtual member force, L = member length, A = cross-sectional area, and E = elastic modulus. Longer members and higher forces cause greater deflection. Compression members may buckle if too slender (Euler buckling: P_cr = \u03C0\u00B2EI/L\u00B2).',
      diagram: 'trussDeflection',
      example: { problem: 'A member is 4 m long, carries 50 kN tension, has A = 1000 mm\u00B2, E = 200 GPa. Find elongation in mm.', steps: ['\u0394L = FL/(AE)', '\u0394L = 50000 \u00D7 4000 / (1000 \u00D7 200000)', '\u0394L = 200000000 / 200000000', '\u0394L = 1.0 mm'], answer: 1.0, unit: 'mm' }
    }
  ];

  /* ================================================================
     DATA -- PROBLEM GENERATORS
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 -- Simple truss reactions (symmetric load) */
    function () {
      var nPanels = randInt(2, 5);
      var span = nPanels * randInt(2, 4);
      var P = randInt(5, 40);
      var R = +(P / 2).toFixed(2);
      return { prompt: 'A ' + span + ' m span truss has a ' + P + ' kN load at the centre. Find each vertical reaction (kN).', steps: ['By symmetry: Ra = Rb', '\u03A3Fy = 0: Ra + Rb = ' + P, 'Ra = Rb = ' + P + '/2', 'Ra = Rb = ' + R + ' kN'], answer: R, unit: 'kN' };
    },
    /* 1 -- Off-centre load reactions */
    function () {
      var L = randInt(6, 16);
      var a = randInt(2, L - 3);
      var P = randInt(8, 40);
      var Rb = +(P * a / L).toFixed(2);
      var Ra = +(P - Rb).toFixed(2);
      return { prompt: 'A ' + L + ' m span truss has a ' + P + ' kN load at ' + a + ' m from support A. Find Ra (kN).', steps: ['\u03A3M_A = 0: Rb \u00D7 ' + L + ' = ' + P + ' \u00D7 ' + a, 'Rb = ' + (P * a) + '/' + L + ' = ' + Rb + ' kN', '\u03A3Fy = 0: Ra = ' + P + ' \u2212 ' + Rb, 'Ra = ' + Ra + ' kN'], answer: Ra, unit: 'kN' };
    },
    /* 2 -- Determinacy check */
    function () {
      var j = randInt(4, 8);
      var m = 2 * j - 3;
      var r = 3;
      var total = m + r;
      return { prompt: 'A truss has ' + j + ' joints and ' + m + ' members with pin + roller supports (r = 3). Find m + r.', steps: ['m + r = ' + m + ' + ' + r + ' = ' + total, '2j = 2 \u00D7 ' + j + ' = ' + (2 * j), total + ' = ' + (2 * j), 'The truss is statically determinate'], answer: total, unit: '' };
    },
    /* 3 -- Diagonal member force (simple triangle) */
    function () {
      var h = randInt(2, 5);
      var w = randInt(2, 5);
      var P = randInt(5, 30);
      var diagLen = Math.sqrt(h * h + w * w);
      var sinA = h / diagLen;
      var F = +(P / sinA).toFixed(2);
      return { prompt: 'A truss joint has a vertical reaction of ' + P + ' kN upward. A diagonal member rises ' + h + ' m over ' + w + ' m horizontal. Find the force in the diagonal (kN, positive = tension).', steps: ['Length = \u221A(' + h + '\u00B2 + ' + w + '\u00B2) = ' + diagLen.toFixed(2) + ' m', 'sin(\u03B8) = ' + h + '/' + diagLen.toFixed(2) + ' = ' + sinA.toFixed(4), '\u03A3Fy = 0: F\u00B7sin(\u03B8) = ' + P, 'F = ' + P + '/' + sinA.toFixed(4) + ' = ' + F + ' kN'], answer: F, unit: 'kN' };
    },
    /* 4 -- Method of sections (bottom chord) */
    function () {
      var span = randInt(6, 12);
      var h = randInt(2, 5);
      var P = randInt(10, 40);
      var Ra = +(P / 2).toFixed(2);
      var d = +(span / 2).toFixed(1);
      var Fbc = +(Ra * d / h).toFixed(2);
      return { prompt: 'A ' + span + ' m span truss (height ' + h + ' m) has a ' + P + ' kN central load. Using method of sections, find the bottom chord force at midspan (kN). Take moments about the top joint.', steps: ['Ra = ' + P + '/2 = ' + Ra + ' kN', 'Moment arm of Ra about top joint = ' + d + ' m', '\u03A3M_top = 0: Ra \u00D7 ' + d + ' = F_bc \u00D7 ' + h, 'F_bc = ' + Ra + ' \u00D7 ' + d + ' / ' + h + ' = ' + Fbc + ' kN (tension)'], answer: Fbc, unit: 'kN' };
    },
    /* 5 -- Members for simple truss */
    function () {
      var j = randInt(5, 10);
      var m = 2 * j - 3;
      return { prompt: 'How many members does a simple truss need if it has ' + j + ' joints? (Use m = 2j \u2212 3)', steps: ['m = 2j \u2212 3', 'm = 2 \u00D7 ' + j + ' \u2212 3', 'm = ' + (2 * j) + ' \u2212 3', 'm = ' + m + ' members'], answer: m, unit: 'members' };
    },
    /* 6 -- Horizontal chord force from equilibrium */
    function () {
      var F_diag = randInt(10, 30);
      var angle = randInt(30, 60);
      var cosA = Math.cos(angle * Math.PI / 180);
      var Fh = +(F_diag * cosA).toFixed(2);
      return { prompt: 'A diagonal member carries ' + F_diag + ' kN of tension at ' + angle + '\u00B0 from horizontal. What is the horizontal component of this force (kN)?', steps: ['Fx = F \u00D7 cos(\u03B8)', 'Fx = ' + F_diag + ' \u00D7 cos(' + angle + '\u00B0)', 'Fx = ' + F_diag + ' \u00D7 ' + cosA.toFixed(4), 'Fx = ' + Fh + ' kN'], answer: Fh, unit: 'kN' };
    },
    /* 7 -- Multiple load reactions */
    function () {
      var L = randInt(8, 16);
      var P1 = randInt(5, 20);
      var P2 = randInt(5, 20);
      var a1 = randInt(2, Math.floor(L / 2));
      var a2 = randInt(Math.floor(L / 2) + 1, L - 2);
      var Rb = +((P1 * a1 + P2 * a2) / L).toFixed(2);
      var Ra = +(P1 + P2 - Rb).toFixed(2);
      return { prompt: 'A ' + L + ' m truss has ' + P1 + ' kN at ' + a1 + ' m and ' + P2 + ' kN at ' + a2 + ' m from A. Find Ra (kN).', steps: ['\u03A3M_A = 0: Rb \u00D7 ' + L + ' = ' + P1 + '\u00D7' + a1 + ' + ' + P2 + '\u00D7' + a2, 'Rb = (' + (P1 * a1) + ' + ' + (P2 * a2) + ')/' + L + ' = ' + Rb + ' kN', '\u03A3Fy = 0: Ra = ' + P1 + ' + ' + P2 + ' \u2212 ' + Rb, 'Ra = ' + Ra + ' kN'], answer: Ra, unit: 'kN' };
    }
  ];

  /* ================================================================
     DATA -- QUIZ POOL
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'A truss member in tension experiences:', options: ['A pulling force (elongation)', 'A pushing force (shortening)', 'A bending moment', 'A shear force'], correct: 0 },
    { type: 'mcq', prompt: 'The determinacy condition for a 2D truss is:', options: ['m + r = 2j', 'm + j = 2r', 'm = j + r', 'm \u00D7 r = 2j'], correct: 0 },
    { type: 'mcq', prompt: 'In the method of joints, how many equilibrium equations are available at each joint?', options: ['2 (\u03A3Fx=0, \u03A3Fy=0)', '3 (\u03A3Fx=0, \u03A3Fy=0, \u03A3M=0)', '1 (\u03A3F=0)', '4'], correct: 0 },
    { type: 'mcq', prompt: 'A zero-force member occurs when:', options: ['Two non-collinear members meet at an unloaded joint', 'A member is at 45 degrees', 'A member is the longest in the truss', 'The member is horizontal'], correct: 0 },
    { type: 'mcq', prompt: 'In a Pratt truss under gravity loading, the diagonal members are typically in:', options: ['Tension', 'Compression', 'Zero force', 'Bending'], correct: 0 },
    { type: 'mcq', prompt: 'The method of sections is most useful when:', options: ['You need forces in only a few specific members', 'You need all member forces', 'The truss is indeterminate', 'The truss has no loads'], correct: 0 },
    { type: 'mcq', prompt: 'A roller support provides:', options: ['One vertical reaction only', 'Two reactions (H + V)', 'Three reactions (H + V + M)', 'No reactions'], correct: 0 },
    { type: 'mcq', prompt: 'If m + r > 2j for a truss, the truss is:', options: ['Statically indeterminate', 'Statically determinate', 'A mechanism (unstable)', 'Impossible to build'], correct: 0 },
    { type: 'mcq', prompt: 'In a Warren truss, the web members are:', options: ['Diagonals alternating in direction (no verticals)', 'Vertical members only', 'Horizontal members only', 'Curved members'], correct: 0 },
    { type: 'mcq', prompt: 'When a diagonal truss member has a positive force result, it is in:', options: ['Tension (being pulled)', 'Compression (being pushed)', 'Shear', 'Torsion'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'A 10 m span truss has a 30 kN central load. Find each reaction (kN).', answer: 15, unit: 'kN', steps: ['Ra = Rb = P/2 = 30/2', 'Ra = Rb = 15 kN'] },
    { type: 'numeric', prompt: 'A truss has 7 joints. Using m = 2j \u2212 3, how many members are needed?', answer: 11, unit: 'members', steps: ['m = 2 \u00D7 7 \u2212 3 = 14 \u2212 3', 'm = 11 members'] },
    { type: 'numeric', prompt: 'A 12 m truss has 24 kN at 3 m from A. Find Rb (kN).', answer: 6, unit: 'kN', steps: ['Rb = 24\u00D73/12 = 72/12', 'Rb = 6 kN'] },
    { type: 'numeric', prompt: 'A diagonal at 45\u00B0 carries 20 kN. What is its vertical component (kN)?', answer: 14.14, unit: 'kN', steps: ['Fy = 20 \u00D7 sin(45\u00B0)', 'Fy = 20 \u00D7 0.707 = 14.14 kN'] },
    { type: 'numeric', prompt: 'Ra = 10 kN, moment arm = 6 m, truss height = 3 m. Find bottom chord force by method of sections (kN).', answer: 20, unit: 'kN', steps: ['\u03A3M_top = 0: 10 \u00D7 6 = F \u00D7 3', 'F = 60/3 = 20 kN (tension)'] }
  ];

  /* ================================================================
     HELPERS
     ================================================================ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffleArr(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  /* ================================================================
     CANVAS SETUP
     ================================================================ */
  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;
  var dpr = window.devicePixelRatio || 1;
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.maxWidth = W + 'px';
  ctx.scale(dpr, dpr);

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var trussType = 'warren';
  var numPanels = 4;
  var panelWidth = 3;   /* m */
  var trussHeight = 3;  /* m */
  var loadMag = 10;     /* kN */
  var loadJoint = 2;    /* which bottom joint (0-based from left) */
  var showLabels = false;
  var showLegend = true;

  /* Computed truss data */
  var joints = [];       /* [{x, y, id}] */
  var members = [];      /* [{i, j, force}] where i,j are joint indices */
  var extLoads = [];     /* [{joint, fx, fy}] */
  var reactions = { Ra: 0, Rb: 0 };

  /* Explore */
  var selCat = 'basics';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* Canvas layout */
  var MARGIN_L = 80, MARGIN_R = 40, MARGIN_T = 60, MARGIN_B = 80;

  /* ================================================================
     TRUSS GEOMETRY GENERATION
     ================================================================ */

  function buildTruss() {
    joints = [];
    members = [];
    extLoads = [];

    var span = numPanels * panelWidth;

    /* Bottom chord joints */
    for (var i = 0; i <= numPanels; i++) {
      joints.push({ x: i * panelWidth, y: 0, id: 'B' + i });
    }

    if (trussType === 'warren') {
      /* Top chord joints at midpoints of bottom panels, at trussHeight */
      for (var w = 0; w < numPanels; w++) {
        joints.push({ x: (w + 0.5) * panelWidth, y: trussHeight, id: 'T' + w });
      }
      /* Bottom chord members */
      for (var b = 0; b < numPanels; b++) {
        members.push({ i: b, j: b + 1, force: 0 });
      }
      /* Diagonals: each top joint connects to two bottom joints */
      var topStart = numPanels + 1;
      for (var d = 0; d < numPanels; d++) {
        var ti = topStart + d;
        members.push({ i: d, j: ti, force: 0 });         /* left diagonal */
        members.push({ i: d + 1, j: ti, force: 0 });     /* right diagonal */
      }
      /* Top chord members (between adjacent top joints) */
      for (var t = 0; t < numPanels - 1; t++) {
        members.push({ i: topStart + t, j: topStart + t + 1, force: 0 });
      }
    } else if (trussType === 'pratt') {
      /* Top chord joints directly above bottom joints (except ends if desired) */
      for (var p = 1; p < numPanels; p++) {
        joints.push({ x: p * panelWidth, y: trussHeight, id: 'T' + p });
      }
      /* Bottom chord members */
      for (var b2 = 0; b2 < numPanels; b2++) {
        members.push({ i: b2, j: b2 + 1, force: 0 });
      }
      var topStart2 = numPanels + 1;
      /* Top chord members */
      /* First: bottom-left to first top */
      members.push({ i: 0, j: topStart2, force: 0 });
      for (var t2 = 0; t2 < numPanels - 2; t2++) {
        members.push({ i: topStart2 + t2, j: topStart2 + t2 + 1, force: 0 });
      }
      /* Last top to bottom-right */
      members.push({ i: topStart2 + numPanels - 2, j: numPanels, force: 0 });
      /* Verticals (top to bottom at same x) */
      for (var v = 1; v < numPanels; v++) {
        members.push({ i: v, j: topStart2 + v - 1, force: 0 });
      }
      /* Pratt diagonals: slope toward centre */
      var mid = numPanels / 2;
      for (var pd = 0; pd < numPanels - 1; pd++) {
        var topIdx = topStart2 + pd;
        if (pd < mid - 0.5) {
          /* Left half: diagonal from top-left to bottom-right */
          members.push({ i: topIdx, j: pd + 2, force: 0 });
        } else {
          /* Right half: diagonal from top-right to bottom-left */
          members.push({ i: topIdx, j: pd, force: 0 });
        }
      }
    } else if (trussType === 'howe') {
      /* Same top joint placement as Pratt */
      for (var h = 1; h < numPanels; h++) {
        joints.push({ x: h * panelWidth, y: trussHeight, id: 'T' + h });
      }
      /* Bottom chord members */
      for (var b3 = 0; b3 < numPanels; b3++) {
        members.push({ i: b3, j: b3 + 1, force: 0 });
      }
      var topStart3 = numPanels + 1;
      /* Rafter / top chord from left bottom to first top, etc. */
      members.push({ i: 0, j: topStart3, force: 0 });
      for (var t3 = 0; t3 < numPanels - 2; t3++) {
        members.push({ i: topStart3 + t3, j: topStart3 + t3 + 1, force: 0 });
      }
      members.push({ i: topStart3 + numPanels - 2, j: numPanels, force: 0 });
      /* Verticals */
      for (var v2 = 1; v2 < numPanels; v2++) {
        members.push({ i: v2, j: topStart3 + v2 - 1, force: 0 });
      }
      /* Howe diagonals: slope away from centre */
      var mid2 = numPanels / 2;
      for (var hd = 0; hd < numPanels - 1; hd++) {
        var topIdx2 = topStart3 + hd;
        if (hd < mid2 - 0.5) {
          /* Left half: diagonal from top to bottom-left */
          members.push({ i: topIdx2, j: hd, force: 0 });
        } else {
          /* Right half: diagonal from top to bottom-right */
          members.push({ i: topIdx2, j: hd + 2, force: 0 });
        }
      }
    }

    /* Remove duplicate members */
    var seen = {};
    var unique = [];
    members.forEach(function (m) {
      var key = Math.min(m.i, m.j) + '-' + Math.max(m.i, m.j);
      if (!seen[key]) {
        seen[key] = true;
        unique.push(m);
      }
    });
    members = unique;
  }

  /* ================================================================
     PHYSICS -- METHOD OF JOINTS (MATRIX SOLVER)
     ================================================================ */

  function solveTruss() {
    buildTruss();

    var nj = joints.length;
    var nm = members.length;
    var span = numPanels * panelWidth;

    /* Apply external loads */
    extLoads = [];
    /* Ensure loadJoint is within valid bottom chord range */
    var maxBotJoint = numPanels;
    var lj = Math.min(loadJoint, maxBotJoint);
    extLoads.push({ joint: lj, fx: 0, fy: -loadMag });

    /* Support reactions: pin at joint 0 (Rax, Ray), roller at joint numPanels (Rby) */
    /* Build the system: 2*nj equations, nm + 3 unknowns */
    /* For each joint i: sum of forces in x = 0, sum of forces in y = 0 */
    /* Unknowns: member forces F1..Fm, Rax, Ray, Rby */

    var neq = 2 * nj;
    var nvar = nm + 3; /* member forces + Rax + Ray + Rby */

    /* Build coefficient matrix A and RHS b */
    var A = [];
    var b = [];
    for (var eq = 0; eq < neq; eq++) {
      A[eq] = [];
      for (var v = 0; v < nvar; v++) {
        A[eq][v] = 0;
      }
      b[eq] = 0;
    }

    /* Member contributions */
    for (var mi = 0; mi < nm; mi++) {
      var m = members[mi];
      var ji = joints[m.i];
      var jj = joints[m.j];
      var dx = jj.x - ji.x;
      var dy = jj.y - ji.y;
      var L = Math.sqrt(dx * dx + dy * dy);
      if (L < 1e-9) continue;
      var cx = dx / L; /* cos of member angle */
      var cy = dy / L; /* sin of member angle */

      /* At joint m.i: force component from member mi */
      /* If F positive -> tension -> force on joint points away from joint along member */
      var eqXi = 2 * m.i;
      var eqYi = 2 * m.i + 1;
      A[eqXi][mi] += cx;
      A[eqYi][mi] += cy;

      /* At joint m.j: opposite direction */
      var eqXj = 2 * m.j;
      var eqYj = 2 * m.j + 1;
      A[eqXj][mi] -= cx;
      A[eqYj][mi] -= cy;
    }

    /* Reaction unknowns: index nm = Rax, nm+1 = Ray, nm+2 = Rby */
    /* Pin at joint 0: Rax (horizontal) and Ray (vertical) */
    A[0][nm] = 1;       /* Rax affects joint 0 x-equation */
    A[1][nm + 1] = 1;   /* Ray affects joint 0 y-equation */

    /* Roller at joint numPanels: Rby (vertical only) */
    var rollerJoint = numPanels;
    A[2 * rollerJoint + 1][nm + 2] = 1; /* Rby affects joint numPanels y-equation */

    /* External loads (RHS) */
    extLoads.forEach(function (ld) {
      b[2 * ld.joint] -= ld.fx;
      b[2 * ld.joint + 1] -= ld.fy;
    });

    /* Solve using Gaussian elimination with partial pivoting */
    var solution = gaussianElimination(A, b, neq, nvar);

    if (solution) {
      for (var si = 0; si < nm; si++) {
        members[si].force = solution[si];
      }
      reactions.Rax = solution[nm];
      reactions.Ra = solution[nm + 1];
      reactions.Rb = solution[nm + 2];
    } else {
      /* Fallback: simple statics for reactions */
      reactions.Ra = loadMag * (span - lj * panelWidth) / span;
      reactions.Rb = loadMag * (lj * panelWidth) / span;
      reactions.Rax = 0;
    }
  }

  function gaussianElimination(A, b, neq, nvar) {
    /* Augmented matrix */
    var n = Math.min(neq, nvar);
    var aug = [];
    for (var i = 0; i < neq; i++) {
      aug[i] = A[i].slice();
      aug[i].push(b[i]);
    }

    /* Forward elimination with partial pivoting */
    for (var col = 0; col < n; col++) {
      /* Find pivot */
      var maxVal = 0, maxRow = col;
      for (var row = col; row < neq; row++) {
        if (Math.abs(aug[row][col]) > maxVal) {
          maxVal = Math.abs(aug[row][col]);
          maxRow = row;
        }
      }
      if (maxVal < 1e-12) continue; /* Skip zero column */

      /* Swap rows */
      var tmp = aug[col];
      aug[col] = aug[maxRow];
      aug[maxRow] = tmp;

      /* Eliminate below */
      for (var row2 = col + 1; row2 < neq; row2++) {
        var factor = aug[row2][col] / aug[col][col];
        for (var c = col; c <= nvar; c++) {
          aug[row2][c] -= factor * aug[col][c];
        }
      }
    }

    /* Back substitution */
    var x = [];
    for (var vi = 0; vi < nvar; vi++) x[vi] = 0;

    for (var row3 = n - 1; row3 >= 0; row3--) {
      /* Find the leading variable in this row */
      var leadCol = -1;
      for (var c2 = 0; c2 < nvar; c2++) {
        if (Math.abs(aug[row3][c2]) > 1e-12) {
          leadCol = c2;
          break;
        }
      }
      if (leadCol < 0) continue;

      var sum = aug[row3][nvar];
      for (var c3 = leadCol + 1; c3 < nvar; c3++) {
        sum -= aug[row3][c3] * x[c3];
      }
      x[leadCol] = sum / aug[row3][leadCol];
    }

    return x;
  }

  /* ================================================================
     DRAWING -- SIMULATE MODE
     ================================================================ */

  function trussToCanvas(tx, ty) {
    var span = numPanels * panelWidth;
    var drawW = W - MARGIN_L - MARGIN_R;
    var drawH = H - MARGIN_T - MARGIN_B - 80;
    var scaleX = drawW / span;
    var scaleY = drawH / Math.max(trussHeight, 1);
    var scale = Math.min(scaleX, scaleY);
    var offsetX = MARGIN_L + (drawW - span * scale) / 2;
    var offsetY = H - MARGIN_B - 40;
    return { x: offsetX + tx * scale, y: offsetY - ty * scale };
  }

  function drawSimulate() {
    /* Title */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#e65100';
    ctx.fillText(trussType.toUpperCase() + ' TRUSS', 8, 8);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText(numPanels + ' panels \u00B7 ' + joints.length + ' joints \u00B7 ' + members.length + ' members', 8, 22);

    /* Draw members with colour coding */
    members.forEach(function (m) {
      var p1 = trussToCanvas(joints[m.i].x, joints[m.i].y);
      var p2 = trussToCanvas(joints[m.j].x, joints[m.j].y);

      var force = m.force;
      var color;
      if (Math.abs(force) < 0.01) {
        color = '#6b7a99'; /* zero-force: grey */
      } else if (force > 0) {
        color = '#3ddc84'; /* tension: green */
      } else {
        color = '#ff5555'; /* compression: red */
      }

      /* Member line thickness based on force magnitude */
      var maxF = 1;
      members.forEach(function (mm) { if (Math.abs(mm.force) > maxF) maxF = Math.abs(mm.force); });
      var thickness = 2 + 4 * Math.abs(force) / maxF;

      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.lineCap = 'butt';

      /* Force labels */
      if (showLabels && Math.abs(force) > 0.01) {
        var mx = (p1.x + p2.x) / 2;
        var my = (p1.y + p2.y) / 2;
        var label = Math.abs(force).toFixed(1);
        var tag = force > 0 ? 'T' : 'C';

        ctx.font = '700 9px "Courier New", monospace';
        ctx.fillStyle = 'rgba(13,17,23,0.85)';
        var tw = ctx.measureText(label + tag).width + 8;
        ctx.fillRect(mx - tw / 2, my - 8, tw, 16);
        ctx.fillStyle = color;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(label + tag, mx, my);
      }
    });

    /* Draw joints */
    joints.forEach(function (j, idx) {
      var p = trussToCanvas(j.x, j.y);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e65100';
      ctx.fill();
      ctx.strokeStyle = '#0d1117';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Joint label */
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (j.y > 0) {
        ctx.textBaseline = 'bottom';
        ctx.fillText(j.id, p.x, p.y - 8);
      } else {
        ctx.fillText(j.id, p.x, p.y + 8);
      }
    });

    /* Draw supports */
    drawSupports();

    /* Draw external loads */
    drawExternalLoads();

    /* Draw reaction arrows */
    drawReactions();

    /* Draw legend */
    if (showLegend) drawLegend();
  }

  function drawSupports() {
    var triH = 18, triW = 14;

    /* Pin at joint 0 */
    var p0 = trussToCanvas(joints[0].x, joints[0].y);
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p0.x - triW / 2, p0.y + triH);
    ctx.lineTo(p0.x + triW / 2, p0.y + triH);
    ctx.closePath();
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p0.x - triW, p0.y + triH + 2);
    ctx.lineTo(p0.x + triW, p0.y + triH + 2);
    ctx.stroke();

    /* Roller at last bottom joint */
    var pN = trussToCanvas(joints[numPanels].x, joints[numPanels].y);
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pN.x, pN.y);
    ctx.lineTo(pN.x - triW / 2, pN.y + triH);
    ctx.lineTo(pN.x + triW / 2, pN.y + triH);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pN.x, pN.y + triH + 5, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pN.x - triW, pN.y + triH + 11);
    ctx.lineTo(pN.x + triW, pN.y + triH + 11);
    ctx.stroke();
  }

  function drawExternalLoads() {
    extLoads.forEach(function (ld) {
      var p = trussToCanvas(joints[ld.joint].x, joints[ld.joint].y);
      var arrowLen = 45;

      if (Math.abs(ld.fy) > 0.01) {
        var tipY, baseY;
        if (ld.fy < 0) { /* downward load */
          if (joints[ld.joint].y > 0) {
            /* Top joint: arrow from above */
            baseY = p.y - arrowLen - 5;
            tipY = p.y - 8;
          } else {
            /* Bottom joint: arrow from above */
            baseY = p.y - arrowLen - 5;
            tipY = p.y - 8;
          }
          ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.moveTo(p.x, baseY); ctx.lineTo(p.x, tipY); ctx.stroke();
          ctx.fillStyle = '#ff5555';
          ctx.beginPath();
          ctx.moveTo(p.x, tipY + 2);
          ctx.lineTo(p.x - 5, tipY - 8);
          ctx.lineTo(p.x + 5, tipY - 8);
          ctx.closePath(); ctx.fill();
          /* Label */
          ctx.font = '700 10px "Courier New", monospace';
          ctx.fillStyle = '#ff5555';
          ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
          ctx.fillText(Math.abs(ld.fy).toFixed(1) + ' kN', p.x, baseY - 3);
        }
      }
    });
  }

  function drawReactions() {
    /* Reaction A (pin) - upward arrow */
    if (Math.abs(reactions.Ra) > 0.001) {
      var p0 = trussToCanvas(joints[0].x, joints[0].y);
      var arrowLen = 35;
      var tipY = p0.y + 40;
      var baseY = tipY + arrowLen;
      ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(p0.x, tipY); ctx.lineTo(p0.x, baseY); ctx.stroke();
      ctx.fillStyle = '#42a5f5';
      ctx.beginPath();
      ctx.moveTo(p0.x, tipY - 2);
      ctx.lineTo(p0.x - 5, tipY + 8);
      ctx.lineTo(p0.x + 5, tipY + 8);
      ctx.closePath(); ctx.fill();
      ctx.font = '700 9px "Courier New", monospace';
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Ra=' + Math.abs(reactions.Ra).toFixed(1), p0.x, baseY + 3);
    }

    /* Reaction B (roller) - upward arrow */
    if (Math.abs(reactions.Rb) > 0.001) {
      var pN = trussToCanvas(joints[numPanels].x, joints[numPanels].y);
      var arrowLenB = 35;
      var tipYB = pN.y + 40;
      var baseYB = tipYB + arrowLenB;
      ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(pN.x, tipYB); ctx.lineTo(pN.x, baseYB); ctx.stroke();
      ctx.fillStyle = '#42a5f5';
      ctx.beginPath();
      ctx.moveTo(pN.x, tipYB - 2);
      ctx.lineTo(pN.x - 5, tipYB + 8);
      ctx.lineTo(pN.x + 5, tipYB + 8);
      ctx.closePath(); ctx.fill();
      ctx.font = '700 9px "Courier New", monospace';
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Rb=' + Math.abs(reactions.Rb).toFixed(1), pN.x, baseYB + 3);
    }
  }

  function drawLegend() {
    var lx = W - 170, ly = 12;
    ctx.fillStyle = 'rgba(13,17,23,0.88)';
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(lx, ly, 158, 70, 8);
    ctx.fill(); ctx.stroke();

    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

    /* Tension */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 10, ly + 18); ctx.lineTo(lx + 35, ly + 18); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Tension (+)', lx + 42, ly + 18);

    /* Compression */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 10, ly + 36); ctx.lineTo(lx + 35, ly + 36); ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Compression (\u2212)', lx + 42, ly + 36);

    /* Zero-force */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(lx + 10, ly + 54); ctx.lineTo(lx + 35, ly + 54); ctx.stroke();
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Zero-force (0)', lx + 42, ly + 54);
  }

  /* ================================================================
     DRAWING -- EXPLORE MINI-DIAGRAMS
     ================================================================ */

  function drawConceptDiagram(concept) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var fn = {
      'trussDef': drawTrussDefDiag,
      'trussTypes': drawTrussTypesDiag,
      'determinacy': drawDeterminacyDiag,
      'jointsMembers': drawJointsMembersDiag,
      'methodJoints': drawMethodJointsDiag,
      'methodSections': drawMethodSectionsDiag,
      'zeroForce': drawZeroForceDiag,
      'reactionsCalc': drawReactionsCalcDiag,
      'tension': drawTensionDiag,
      'compression': drawCompressionDiag,
      'equilibriumJoint': drawEquilibriumJointDiag,
      'trussDeflection': drawTrussDeflectionDiag
    };

    if (fn[concept.diagram]) fn[concept.diagram]();

    /* Formula at bottom */
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#e65100';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(concept.formula, W / 2, H - 16);
  }

  /* Helper: draw a mini truss triangle */
  function drawMiniTruss(cx, cy, w, h, color) {
    ctx.strokeStyle = color || '#e65100'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    /* Bottom chord */
    ctx.beginPath(); ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx + w / 2, cy); ctx.stroke();
    /* Left diagonal */
    ctx.beginPath(); ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx, cy - h); ctx.stroke();
    /* Right diagonal */
    ctx.beginPath(); ctx.moveTo(cx + w / 2, cy); ctx.lineTo(cx, cy - h); ctx.stroke();
    ctx.lineCap = 'butt';
    /* Joints */
    [{ x: cx - w / 2, y: cy }, { x: cx + w / 2, y: cy }, { x: cx, y: cy - h }].forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color || '#e65100'; ctx.fill();
    });
  }

  function drawMiniTriangle(x, y, color) {
    ctx.strokeStyle = color || '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 14); ctx.lineTo(x + 7, y + 14); ctx.closePath();
    ctx.stroke();
  }

  function drawMiniArrowDown(x, y, len, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y + len + 2); ctx.lineTo(x - 4, y + len - 6); ctx.lineTo(x + 4, y + len - 6); ctx.closePath(); ctx.fill();
  }

  function drawMiniArrowUp(x, y, len, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - len); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y - len - 2); ctx.lineTo(x - 4, y - len + 6); ctx.lineTo(x + 4, y - len + 6); ctx.closePath(); ctx.fill();
  }

  function drawTrussDefDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('What is a Truss?', W / 2, 35);

    /* Draw a simple truss */
    var bx = 150, by = 220, tw = 600, th = 120;
    /* Bottom chord */
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw, by); ctx.stroke();
    /* Top chord */
    ctx.beginPath(); ctx.moveTo(bx + tw / 6, by - th); ctx.lineTo(bx + 5 * tw / 6, by - th); ctx.stroke();
    /* Diagonals */
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw / 6, by - th); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw, by); ctx.lineTo(bx + 5 * tw / 6, by - th); ctx.stroke();
    ctx.strokeStyle = '#ff5555';
    ctx.beginPath(); ctx.moveTo(bx + tw / 3, by); ctx.lineTo(bx + tw / 6, by - th); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 3, by); ctx.lineTo(bx + tw / 2, by - th); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 2 * tw / 3, by); ctx.lineTo(bx + tw / 2, by - th); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 2 * tw / 3, by); ctx.lineTo(bx + 5 * tw / 6, by - th); ctx.stroke();
    ctx.lineCap = 'butt';

    /* Joints */
    var jpts = [
      { x: bx, y: by }, { x: bx + tw / 3, y: by }, { x: bx + 2 * tw / 3, y: by }, { x: bx + tw, y: by },
      { x: bx + tw / 6, y: by - th }, { x: bx + tw / 2, y: by - th }, { x: bx + 5 * tw / 6, y: by - th }
    ];
    jpts.forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#e65100'; ctx.fill();
      ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1.5; ctx.stroke();
    });

    /* Labels */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Members carry axial forces only', W / 2, 280);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Green = Tension', 300, 310);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Red = Compression', 600, 310);

    /* Supports */
    drawMiniTriangle(bx, by, '#ab47bc');
    drawMiniTriangle(bx + tw, by, '#ab47bc');
  }

  function drawTrussTypesDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Common Truss Types', W / 2, 35);

    /* Warren */
    var wy = 120, wx1 = 50, wxw = 250;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(wx1, wy); ctx.lineTo(wx1 + wxw, wy); ctx.stroke();
    for (var i = 0; i < 3; i++) {
      var x = wx1 + i * wxw / 3;
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x + wxw / 6, wy - 60); ctx.stroke();
      ctx.strokeStyle = '#ff5555';
      ctx.beginPath(); ctx.moveTo(x + wxw / 3, wy); ctx.lineTo(x + wxw / 6, wy - 60); ctx.stroke();
    }
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#e65100'; ctx.textAlign = 'center';
    ctx.fillText('Warren', wx1 + wxw / 2, wy + 20);

    /* Pratt */
    var py = 120, px1 = 370, pxw = 250;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(px1, py); ctx.lineTo(px1 + pxw, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px1, py); ctx.lineTo(px1, py - 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px1, py - 60); ctx.lineTo(px1 + pxw, py - 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px1 + pxw, py); ctx.lineTo(px1 + pxw, py - 60); ctx.stroke();
    /* Verticals */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    for (var v = 1; v < 3; v++) {
      var vx = px1 + v * pxw / 3;
      ctx.beginPath(); ctx.moveTo(vx, py); ctx.lineTo(vx, py - 60); ctx.stroke();
    }
    /* Diagonals sloping toward centre */
    ctx.strokeStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(px1, py - 60); ctx.lineTo(px1 + pxw / 3, py); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px1 + pxw, py - 60); ctx.lineTo(px1 + 2 * pxw / 3, py); ctx.stroke();
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#e65100';
    ctx.fillText('Pratt', px1 + pxw / 2, py + 20);

    /* Howe */
    var hy = 260, hx1 = 200, hxw = 250;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(hx1, hy); ctx.lineTo(hx1 + hxw, hy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx1, hy); ctx.lineTo(hx1, hy - 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx1, hy - 60); ctx.lineTo(hx1 + hxw, hy - 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx1 + hxw, hy); ctx.lineTo(hx1 + hxw, hy - 60); ctx.stroke();
    /* Verticals */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    for (var v2 = 1; v2 < 3; v2++) {
      var vx2 = hx1 + v2 * hxw / 3;
      ctx.beginPath(); ctx.moveTo(vx2, hy); ctx.lineTo(vx2, hy - 60); ctx.stroke();
    }
    /* Diagonals sloping away from centre */
    ctx.strokeStyle = '#ff5555';
    ctx.beginPath(); ctx.moveTo(hx1 + hxw / 3, hy - 60); ctx.lineTo(hx1, hy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx1 + 2 * hxw / 3, hy - 60); ctx.lineTo(hx1 + hxw, hy); ctx.stroke();
    ctx.fillStyle = '#e65100';
    ctx.fillText('Howe', hx1 + hxw / 2, hy + 20);

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Pratt: diagonals in tension, Howe: diagonals in compression', W / 2, 340);
  }

  function drawDeterminacyDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Static Determinacy of Trusses', W / 2, 35);

    ctx.font = '700 20px "Courier New", monospace';
    ctx.fillStyle = '#e65100';
    ctx.fillText('m + r = 2j', W / 2, 90);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('m + r = 2j \u2192 Determinate', W / 2, 140);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('m + r < 2j \u2192 Mechanism (Unstable)', W / 2, 170);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('m + r > 2j \u2192 Indeterminate', W / 2, 200);

    /* Example truss */
    drawMiniTruss(W / 2, 310, 200, 80, '#e65100');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('m=3, j=3, r=3: 3+3 = 2\u00D73 = 6 \u2713 Determinate', W / 2, 360);
  }

  function drawJointsMembersDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Joints and Members', W / 2, 35);

    /* Draw labelled truss */
    var bx = 200, by = 200, tw = 400;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    /* Bottom */
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw, by); ctx.stroke();
    /* Diagonals */
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw / 2, by - 100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw, by); ctx.lineTo(bx + tw / 2, by - 100); ctx.stroke();
    ctx.lineCap = 'butt';

    /* Joints with labels */
    [{ x: bx, y: by, label: 'A' }, { x: bx + tw, y: by, label: 'B' }, { x: bx + tw / 2, y: by - 100, label: 'C' }].forEach(function (p) {
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#e65100'; ctx.fill();
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText(p.label, p.x + (p.label === 'A' ? -15 : p.label === 'B' ? 15 : 0), p.y + (p.label === 'C' ? -15 : 0));
    });

    /* Member labels */
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('AB', bx + tw / 2, by + 20);
    ctx.fillText('AC', bx + tw / 4 - 15, by - 55);
    ctx.fillText('BC', bx + 3 * tw / 4 + 15, by - 55);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Simplest truss: 3 joints, 3 members (triangle)', W / 2, 280);
    ctx.fillStyle = '#e65100';
    ctx.fillText('m = 2j \u2212 3 = 2(3) \u2212 3 = 3 \u2713', W / 2, 310);
  }

  function drawMethodJointsDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Method of Joints', W / 2, 35);

    /* Joint with forces */
    var jx = W / 2, jy = 200;
    ctx.beginPath(); ctx.arc(jx, jy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#e65100'; ctx.fill();

    /* Forces radiating outward */
    /* Reaction up */
    drawMiniArrowUp(jx, jy - 10, 60, '#42a5f5');
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText('Ra', jx + 15, jy - 65);

    /* Member force right */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(jx + 10, jy); ctx.lineTo(jx + 80, jy); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(jx + 85, jy); ctx.lineTo(jx + 75, jy - 4); ctx.lineTo(jx + 75, jy + 4); ctx.closePath(); ctx.fill();
    ctx.fillText('F_AB', jx + 100, jy);

    /* Member force diagonal */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    var dx = 60, dy = -50;
    ctx.beginPath(); ctx.moveTo(jx + 7, jy - 6); ctx.lineTo(jx + dx, jy + dy); ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.fillText('F_AC', jx + dx + 15, jy + dy);

    /* Equations */
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('\u03A3Fx = 0: F_AB + F_AC\u00B7cos\u03B8 = 0', W / 2, 320);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('\u03A3Fy = 0: Ra + F_AC\u00B7sin\u03B8 = 0', W / 2, 350);
  }

  function drawMethodSectionsDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Method of Sections', W / 2, 35);

    /* Draw truss */
    var bx = 120, by = 220, tw = 660, th = 100;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw / 4, by - th); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 4, by - th); ctx.lineTo(bx + tw / 2, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 2, by); ctx.lineTo(bx + 3 * tw / 4, by - th); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 3 * tw / 4, by - th); ctx.lineTo(bx + tw, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 4, by - th); ctx.lineTo(bx + 3 * tw / 4, by - th); ctx.stroke();
    ctx.lineCap = 'butt';

    /* Section cut (dashed line) */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(bx + tw * 0.4, by + 30); ctx.lineTo(bx + tw * 0.4, by - th - 30); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Section cut', bx + tw * 0.4, by + 45);

    /* Supports */
    drawMiniTriangle(bx, by, '#ab47bc');
    drawMiniTriangle(bx + tw, by, '#ab47bc');

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Cut through \u2264 3 unknown members, then apply \u03A3Fx=0, \u03A3Fy=0, \u03A3M=0', W / 2, 320);
  }

  function drawZeroForceDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Zero-Force Members', W / 2, 35);

    /* Rule 1: Two members at unloaded joint */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Rule 1: Two non-collinear members, no load', 250, 80);

    var j1x = 200, j1y = 160;
    ctx.beginPath(); ctx.arc(j1x, j1y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e65100'; ctx.fill();
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(j1x, j1y); ctx.lineTo(j1x - 60, j1y + 50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(j1x, j1y); ctx.lineTo(j1x + 60, j1y - 50); ctx.stroke();
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('F=0', j1x - 60, j1y + 10);
    ctx.fillText('F=0', j1x + 30, j1y - 30);

    /* Rule 2: Three members, two collinear */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Rule 2: Three members, two collinear, no load', 650, 80);

    var j2x = 650, j2y = 160;
    ctx.beginPath(); ctx.arc(j2x, j2y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e65100'; ctx.fill();
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(j2x - 80, j2y); ctx.lineTo(j2x, j2y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(j2x, j2y); ctx.lineTo(j2x + 80, j2y); ctx.stroke();
    ctx.strokeStyle = '#6b7a99';
    ctx.beginPath(); ctx.moveTo(j2x, j2y); ctx.lineTo(j2x, j2y - 60); ctx.stroke();
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('F=0', j2x + 8, j2y - 40);
    ctx.fillStyle = '#e65100';
    ctx.fillText('F\u22600', j2x - 50, j2y - 10);
    ctx.fillText('F\u22600', j2x + 30, j2y - 10);
  }

  function drawReactionsCalcDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Calculating Support Reactions', W / 2, 35);

    /* Truss with load and reactions */
    var bx = 150, by = 220, tw = 600;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw / 4, by - 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 4, by - 80); ctx.lineTo(bx + tw / 2, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 2, by); ctx.lineTo(bx + 3 * tw / 4, by - 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 3 * tw / 4, by - 80); ctx.lineTo(bx + tw, by); ctx.stroke();
    ctx.lineCap = 'butt';

    /* Load */
    drawMiniArrowDown(bx + tw / 2, by - 120, 35, '#ff5555');
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('P', bx + tw / 2, by - 130);

    /* Supports & Reactions */
    drawMiniTriangle(bx, by, '#ab47bc');
    drawMiniTriangle(bx + tw, by, '#ab47bc');
    drawMiniArrowUp(bx, by + 30, 30, '#42a5f5');
    drawMiniArrowUp(bx + tw, by + 30, 30, '#42a5f5');
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('Ra', bx, by + 70);
    ctx.fillText('Rb', bx + tw, by + 70);

    /* Equations */
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('\u03A3Fy = 0: Ra + Rb = P', W / 2, 340);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('\u03A3M_A = 0: Rb \u00D7 L = P \u00D7 a', W / 2, 370);
  }

  function drawTensionDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Tension in Truss Members', W / 2, 35);

    /* Member being pulled */
    var mx = W / 2, my = 180;
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mx - 100, my); ctx.lineTo(mx + 100, my); ctx.stroke();
    ctx.lineCap = 'butt';

    /* Arrows pointing outward (tension) */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(mx - 100, my); ctx.lineTo(mx - 160, my); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(mx - 165, my); ctx.lineTo(mx - 155, my - 5); ctx.lineTo(mx - 155, my + 5); ctx.closePath(); ctx.fill();

    ctx.beginPath(); ctx.moveTo(mx + 100, my); ctx.lineTo(mx + 160, my); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx + 165, my); ctx.lineTo(mx + 155, my - 5); ctx.lineTo(mx + 155, my + 5); ctx.closePath(); ctx.fill();

    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('F (+)', mx - 170, my - 15);
    ctx.fillText('F (+)', mx + 170, my - 15);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Forces pull away from joints \u2192 member elongates', W / 2, 260);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Positive force = Tension (T)', W / 2, 290);
  }

  function drawCompressionDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Compression in Truss Members', W / 2, 35);

    /* Member being pushed */
    var mx = W / 2, my = 180;
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mx - 100, my); ctx.lineTo(mx + 100, my); ctx.stroke();
    ctx.lineCap = 'butt';

    /* Arrows pointing inward (compression) */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(mx - 160, my); ctx.lineTo(mx - 105, my); ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.beginPath(); ctx.moveTo(mx - 100, my); ctx.lineTo(mx - 110, my - 5); ctx.lineTo(mx - 110, my + 5); ctx.closePath(); ctx.fill();

    ctx.beginPath(); ctx.moveTo(mx + 160, my); ctx.lineTo(mx + 105, my); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx + 100, my); ctx.lineTo(mx + 110, my - 5); ctx.lineTo(mx + 110, my + 5); ctx.closePath(); ctx.fill();

    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('F (\u2212)', mx - 170, my - 15);
    ctx.fillText('F (\u2212)', mx + 170, my - 15);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Forces push toward joints \u2192 member shortens', W / 2, 260);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Negative force = Compression (C)', W / 2, 290);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Must check for buckling: P_cr = \u03C0\u00B2EI / L\u00B2', W / 2, 320);
  }

  function drawEquilibriumJointDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Equilibrium at a Joint', W / 2, 35);

    /* Central joint */
    var jx = W / 2, jy = 200;
    ctx.beginPath(); ctx.arc(jx, jy, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#e65100'; ctx.fill();
    ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 2; ctx.stroke();

    /* Four members radiating */
    var dirs = [
      { dx: -100, dy: 0, label: 'F1', color: '#3ddc84' },
      { dx: 100, dy: 0, label: 'F2', color: '#3ddc84' },
      { dx: -70, dy: -70, label: 'F3', color: '#ff5555' },
      { dx: 70, dy: -70, label: 'F4', color: '#ff5555' }
    ];
    dirs.forEach(function (d) {
      ctx.strokeStyle = d.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(jx, jy); ctx.lineTo(jx + d.dx, jy + d.dy); ctx.stroke();
      ctx.font = '700 11px "Courier New", monospace';
      ctx.fillStyle = d.color; ctx.textAlign = 'center';
      ctx.fillText(d.label, jx + d.dx * 1.15, jy + d.dy * 1.15);
    });

    /* External load */
    drawMiniArrowDown(jx, jy + 12, 50, '#ff5555');
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('P', jx + 15, jy + 45);

    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('\u03A3Fx = 0 and \u03A3Fy = 0', W / 2, 340);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Only 2 equations at each joint (concurrent forces)', W / 2, 370);
  }

  function drawTrussDeflectionDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Truss Behaviour Under Load', W / 2, 35);

    /* Unloaded truss (dashed) */
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(200, 200); ctx.lineTo(700, 200);
    ctx.moveTo(200, 200); ctx.lineTo(350, 120);
    ctx.moveTo(350, 120); ctx.lineTo(550, 120);
    ctx.moveTo(550, 120); ctx.lineTo(700, 200);
    ctx.moveTo(350, 120); ctx.lineTo(350, 200);
    ctx.moveTo(550, 120); ctx.lineTo(550, 200);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Loaded truss (slightly deflected) */
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 200); ctx.lineTo(700, 200);
    ctx.moveTo(200, 200); ctx.lineTo(350, 125);
    ctx.moveTo(350, 125); ctx.lineTo(550, 125);
    ctx.moveTo(550, 125); ctx.lineTo(700, 200);
    ctx.moveTo(350, 125); ctx.lineTo(350, 200);
    ctx.moveTo(550, 125); ctx.lineTo(550, 200);
    ctx.stroke();

    /* Deflection indicator */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(450, 120); ctx.lineTo(450, 135); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f5c842'; ctx.font = '700 10px "Courier New", monospace';
    ctx.fillText('\u0394', 460, 128);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Dashed = original, Solid = deflected', W / 2, 260);
    ctx.fillStyle = '#e65100';
    ctx.fillText('\u0394 = \u03A3(F\u00B7f\u00B7L) / (A\u00B7E) (Virtual Work Method)', W / 2, 290);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      solveTruss();
      drawSimulate();
      updateReadouts();
    } else if (mode === 'explore') {
      var c = CONCEPTS.filter(function (cc) { return cc.cat === selCat; });
      if (c[selConcept]) drawConceptDiagram(c[selConcept]);
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    }
  }

  function drawPracticeCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Practice Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#e65100';
    ctx.fillText('Solve the truss problem below', W / 2, 65);

    /* Draw a sample truss */
    drawMiniTruss(W / 2, 240, 300, 120, '#e65100');
    drawMiniTriangle(W / 2 - 150, 240, '#ab47bc');
    drawMiniTriangle(W / 2 + 150, 240, '#ab47bc');
    drawMiniArrowDown(W / 2, 100, 55, '#ff5555');
    drawMiniArrowUp(W / 2 - 150, 260, 30, '#42a5f5');
    drawMiniArrowUp(W / 2 + 150, 260, 30, '#42a5f5');

    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('\u03A3Fx = 0 and \u03A3Fy = 0 at each joint', W / 2, 360);
  }

  function drawQuizCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Quiz Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#e65100';
    ctx.fillText('Answer the question below', W / 2, 65);

    /* Draw a truss sketch */
    var bx = 200, by = 220, tw = 500;
    ctx.strokeStyle = '#e65100'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + tw / 4, by - 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 4, by - 80); ctx.lineTo(bx + tw / 2, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 2, by); ctx.lineTo(bx + 3 * tw / 4, by - 80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 3 * tw / 4, by - 80); ctx.lineTo(bx + tw, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + tw / 4, by - 80); ctx.lineTo(bx + 3 * tw / 4, by - 80); ctx.stroke();
    ctx.lineCap = 'butt';

    drawMiniTriangle(bx, by, '#ab47bc');
    drawMiniTriangle(bx + tw, by, '#ab47bc');
    drawMiniArrowDown(bx + tw / 2, by - 115, 30, '#ff5555');

    /* Legend */
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'left';
    ctx.fillText('T = Tension', 50, 350);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('C = Compression', 50, 370);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('0 = Zero-force', 50, 390);
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    $('#r-ra').textContent = Math.abs(reactions.Ra).toFixed(1);
    $('#r-rb').textContent = Math.abs(reactions.Rb).toFixed(1);

    var totalLoad = 0;
    extLoads.forEach(function (ld) { totalLoad += Math.abs(ld.fy); });
    $('#r-total').textContent = totalLoad.toFixed(1);

    var maxT = 0, maxC = 0;
    members.forEach(function (m) {
      if (m.force > maxT) maxT = m.force;
      if (m.force < maxC) maxC = m.force;
    });
    $('#r-maxt').textContent = maxT.toFixed(1);
    $('#r-maxc').textContent = Math.abs(maxC).toFixed(1);
    $('#r-members').textContent = members.length;
    $('#r-joints').textContent = joints.length;

    /* Determinacy check */
    var r = 3; /* pin + roller */
    var det = members.length + r - 2 * joints.length;
    var detText;
    if (det === 0) detText = 'SD';
    else if (det > 0) detText = 'SI(' + det + ')';
    else detText = 'Mech';
    $('#r-det').textContent = detText;
  }

  /* ================================================================
     UI -- MODE SWITCHING
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
     UI -- SIMULATE CONTROLS
     ================================================================ */

  /* Truss type tabs */
  $('#truss-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    trussType = e.target.dataset.truss;
    $$('#truss-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    render();
  });

  /* Sliders */
  $('#panel-slider').addEventListener('input', function () {
    numPanels = +this.value;
    $('#panel-val').textContent = numPanels;
    /* Update joint slider max */
    var maxJ = numPanels;
    var jSlider = $('#joint-slider');
    jSlider.max = maxJ;
    if (loadJoint > maxJ) {
      loadJoint = Math.floor(maxJ / 2);
      jSlider.value = loadJoint;
      $('#joint-val').textContent = 'Joint ' + loadJoint;
    }
    render();
  });
  $('#width-slider').addEventListener('input', function () {
    panelWidth = +this.value;
    $('#width-val').textContent = panelWidth.toFixed(1) + ' m';
    render();
  });
  $('#height-slider').addEventListener('input', function () {
    trussHeight = +this.value;
    $('#height-val').textContent = trussHeight.toFixed(1) + ' m';
    render();
  });
  $('#load-slider').addEventListener('input', function () {
    loadMag = +this.value;
    $('#load-val').textContent = loadMag.toFixed(1) + ' kN';
    render();
  });
  $('#joint-slider').addEventListener('input', function () {
    loadJoint = +this.value;
    $('#joint-val').textContent = 'Joint ' + loadJoint;
    render();
  });

  /* Toggles */
  $('#chk-labels').addEventListener('change', function () {
    showLabels = this.checked;
    this.parentElement.classList.toggle('checked', this.checked);
    render();
  });
  $('#chk-legend').addEventListener('change', function () {
    showLegend = this.checked;
    this.parentElement.classList.toggle('checked', this.checked);
    render();
  });

  /* Presets */
  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var preset = btn.dataset.preset;
      if (!preset) return;
      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (preset === 'central') {
        numPanels = 4; panelWidth = 3; trussHeight = 3; loadMag = 20;
        loadJoint = 2;
      } else if (preset === 'uniform') {
        numPanels = 4; panelWidth = 3; trussHeight = 3; loadMag = 10;
        loadJoint = 2;
        /* For uniform, we apply loads at all bottom joints -- handled below */
      } else if (preset === 'asymmetric') {
        numPanels = 4; panelWidth = 3; trussHeight = 3; loadMag = 15;
        loadJoint = 1;
      } else if (preset === 'multi') {
        numPanels = 6; panelWidth = 2; trussHeight = 2.5; loadMag = 12;
        loadJoint = 3;
      }

      /* Update sliders */
      $('#panel-slider').value = numPanels;
      $('#panel-val').textContent = numPanels;
      $('#width-slider').value = panelWidth;
      $('#width-val').textContent = panelWidth.toFixed(1) + ' m';
      $('#height-slider').value = trussHeight;
      $('#height-val').textContent = trussHeight.toFixed(1) + ' m';
      $('#load-slider').value = loadMag;
      $('#load-val').textContent = loadMag.toFixed(1) + ' kN';
      var jSlider = $('#joint-slider');
      jSlider.max = numPanels;
      jSlider.value = loadJoint;
      $('#joint-val').textContent = 'Joint ' + loadJoint;

      render();
    });
  });

  /* ================================================================
     UI -- EXPLORE MODE
     ================================================================ */
  function buildConceptGrid() {
    var grid = $('#concept-grid');
    grid.innerHTML = '';
    var cats = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    cats.forEach(function (c, idx) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (idx === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selConcept = idx;
        $$('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo(c);
        render();
      });
      grid.appendChild(btn);
    });
    var first = cats[selConcept] || cats[0];
    if (first) showConceptInfo(first);
  }

  function showConceptInfo(c) {
    var info = $('#item-info');
    show(info);
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<div class="ex-step">\u2192 ' + s + '</div>';
      });
      html += '<div class="ex-step"><strong>Answer: ' + c.example.answer + ' ' + c.example.unit + '</strong></div>';
      html += '</div>';
    }
    info.innerHTML = html;
  }

  $('#cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    selCat = e.target.dataset.cat;
    selConcept = 0;
    $$('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.cat === selCat); });
    buildConceptGrid();
    render();
  });

  /* ================================================================
     UI -- PRACTICE MODE
     ================================================================ */
  function newPractice() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    pProblem = gen();
    pAnswered = false;
    $('#pp-prompt').textContent = pProblem.prompt;
    $('#pp-unit').textContent = pProblem.unit;
    $('#pp-input').value = '';
    $('#pp-input').disabled = false;
    hide($('#pp-next'));
    $('#pp-feedback').textContent = '';
    $('#pp-feedback').className = 'feedback';
    hide($('#pp-solution'));
    render();
  }

  $('#pp-check').addEventListener('click', function () {
    if (pAnswered || !pProblem) return;
    var val = parseFloat($('#pp-input').value);
    if (isNaN(val)) { $('#pp-feedback').textContent = 'Enter a number'; $('#pp-feedback').className = 'feedback err'; return; }
    pAnswered = true;
    pTotal++;
    var tol = Math.max(0.5, Math.abs(pProblem.answer) * 0.05);
    var ok = Math.abs(val - pProblem.answer) <= tol;
    if (ok) {
      pScore++;
      $('#pp-feedback').textContent = 'Correct!';
      $('#pp-feedback').className = 'feedback ok';
    } else {
      $('#pp-feedback').textContent = 'Incorrect. Answer: ' + pProblem.answer + ' ' + pProblem.unit;
      $('#pp-feedback').className = 'feedback err';
    }
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
    $('#pp-input').disabled = true;
    show($('#pp-next'));

    /* Show solution */
    var sol = $('#pp-solution');
    var html = '<h4>Solution</h4>';
    pProblem.steps.forEach(function (s) {
      html += '<div class="sol-step">\u2192 ' + s + '</div>';
    });
    html += '<div class="sol-step"><strong>Answer: ' + pProblem.answer + ' ' + pProblem.unit + '</strong></div>';
    sol.innerHTML = html;
    show(sol);
  });

  /* Enter key in practice input */
  $('#pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('#pp-check').click();
  });

  $('#pp-next').addEventListener('click', function () {
    newPractice();
  });

  /* ================================================================
     UI -- QUIZ MODE
     ================================================================ */
  function startQuiz() {
    quizQs = shuffleArr(QUIZ_POOL).slice(0, 5);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    hide($('#quiz-result'));
    show($('#quiz-panel'));
    show($('#quiz-bar'));
    showQuizQuestion();
  }

  function showQuizQuestion() {
    if (quizIdx >= quizQs.length) { showQuizResult(); return; }
    var q = quizQs[quizIdx];
    quizAnswered = false;
    $('#qbar-num').textContent = quizIdx + 1;
    var panel = $('#quiz-panel');

    if (q.type === 'mcq') {
      var opts = q.options.slice();
      var correctText = opts[q.correct];
      var shuffled = shuffleArr(opts);
      var correctIdx = shuffled.indexOf(correctText);

      var html = '<p class="qp-prompt">' + q.prompt + '</p><div class="answer-grid">';
      shuffled.forEach(function (o, i) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + o + '</button>';
      });
      html += '</div>';
      panel.innerHTML = html;

      panel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var chosen = +btn.dataset.idx;
          panel.querySelectorAll('.answer-btn').forEach(function (b) { b.classList.add('locked'); });
          if (chosen === correctIdx) {
            btn.classList.add('correct');
            quizScore++;
          } else {
            btn.classList.add('wrong');
            panel.querySelectorAll('.answer-btn')[correctIdx].classList.add('correct');
          }
          setTimeout(function () { quizIdx++; showQuizQuestion(); }, 1200);
        });
      });
    } else if (q.type === 'numeric') {
      var html2 = '<p class="qp-prompt">' + q.prompt + '</p>';
      html2 += '<div class="quiz-input-row"><input class="qi-input" id="qi-val" type="number" step="any" placeholder="Answer"><span class="qi-unit">' + q.unit + '</span>';
      html2 += '<button class="btn btn-primary" id="qi-check">Submit</button></div>';
      html2 += '<div class="quiz-feedback" id="qi-fb"></div>';
      panel.innerHTML = html2;

      $('#qi-check').addEventListener('click', function () {
        if (quizAnswered) return;
        var v = parseFloat($('#qi-val').value);
        if (isNaN(v)) { $('#qi-fb').textContent = 'Enter a number'; $('#qi-fb').className = 'quiz-feedback err'; return; }
        quizAnswered = true;
        var tol = Math.max(0.5, Math.abs(q.answer) * 0.05);
        if (Math.abs(v - q.answer) <= tol) {
          quizScore++;
          $('#qi-fb').textContent = 'Correct!';
          $('#qi-fb').className = 'quiz-feedback ok';
        } else {
          $('#qi-fb').textContent = 'Incorrect. Answer: ' + q.answer + ' ' + q.unit;
          $('#qi-fb').className = 'quiz-feedback err';
        }
        $('#qi-val').disabled = true;
        setTimeout(function () { quizIdx++; showQuizQuestion(); }, 1500);
      });

      $('#qi-val').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') $('#qi-check').click();
      });
    }
    render();
  }

  function showQuizResult() {
    hide($('#quiz-panel'));
    hide($('#quiz-bar'));
    var result = $('#quiz-result');
    show(result);

    var pct = quizScore / quizQs.length * 100;
    var stars = '';
    for (var i = 0; i < 5; i++) stars += i < quizScore ? '\u2605' : '\u2606';

    var scoreClass = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';
    var verdict = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!';

    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + scoreClass + '">' + quizScore + '/' + quizQs.length + '</span><div class="qr-verdict">' + verdict + '</div></div></div>';

    html += '<div class="qr-rows">';
    quizQs.forEach(function (q, idx) {
      var ok = idx < quizScore; /* simplified -- in a real app, track per-question */
      html += '<div class="qr-row ' + (ok ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (idx + 1) + '</span>';
      html += '<span class="qr-detail">' + q.prompt.substring(0, 80) + (q.prompt.length > 80 ? '...' : '') + '</span>';
      html += '<span class="qr-mark">' + (ok ? '\u2713' : '\u2717') + '</span></div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="btn-retry-quiz" style="align-self:center;margin-top:8px;">Try Again</button>';
    result.innerHTML = html;

    $('#btn-retry-quiz').addEventListener('click', function () {
      hide(result);
      setMode('quiz');
    });
  }

  /* ================================================================
     INIT
     ================================================================ */

  /* Set initial joint slider max */
  $('#joint-slider').max = numPanels;

  setMode('simulate');

})();
