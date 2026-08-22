(function () {
  'use strict';

  /* ================================================================
     CONSTANTS & HELPERS
     ================================================================ */
  var PI  = Math.PI;
  var TAU = 2 * PI;
  var DEG = 180 / PI;
  var RAD = PI / 180;
  var MM_PER_INCH = 25.4;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randFloat(lo, hi) { return lo + Math.random() * (hi - lo); }
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = randInt(0, i); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function $(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  /* ================================================================
     UNDO / REDO SYSTEM
     ================================================================ */
  var undoStack = [];
  var redoStack = [];
  var MAX_UNDO = 50;

  function captureState() {
    return { a: state.a, b: state.b, c: state.c, d: state.d, rpm: state.rpm, theta2: state.theta2,
             assemblyBranch: state.assemblyBranch, couplerU: state.couplerU, couplerV: state.couplerV };
  }

  function pushUndo() {
    undoStack.push(captureState());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  function doUndo() {
    if (undoStack.length === 0) return;
    redoStack.push(captureState());
    var s = undoStack.pop();
    restoreState(s);
  }

  function doRedo() {
    if (redoStack.length === 0) return;
    undoStack.push(captureState());
    var s = redoStack.pop();
    restoreState(s);
  }

  function restoreState(s) {
    state.a = s.a; state.b = s.b; state.c = s.c; state.d = s.d;
    state.rpm = s.rpm; state.theta2 = s.theta2;
    if (s.assemblyBranch !== undefined) state.assemblyBranch = s.assemblyBranch;
    if (s.couplerU !== undefined) state.couplerU = s.couplerU;
    if (s.couplerV !== undefined) state.couplerV = s.couplerV;
    state.couplerTrace = [];
    syncSlidersFromState();
    checkAssembly();
    draw();
  }

  /* ================================================================
     DATA - CONCEPTS (12 in 3 categories)
     ================================================================ */
  var CONCEPTS = [
    /* -- Linkage Basics (4) -- */
    {
      id: 'four-bar-mechanism', name: 'Four-Bar Mechanism', symbol: '4R Linkage',
      formula: 'Ground + Crank + Coupler + Follower', unit: '\u2014',
      cat: 'basics',
      desc: 'A four-bar linkage consists of four rigid links connected by four revolute (pin) joints forming a closed kinematic chain. One link is fixed (ground/frame), the input link (crank) is driven, the output link (follower/rocker) responds, and the coupler transmits motion between them. It is the simplest closed-loop mechanism with one degree of freedom. The four-bar linkage is the fundamental building block of planar mechanisms and appears in countless engineering applications.',
      example: { problem: 'A four-bar linkage has links a=100mm (ground), b=40mm (crank), c=90mm (coupler), d=70mm (follower). How many degrees of freedom does it have?', steps: ['Grubler\u2019s equation: DOF = 3(n\u22121) \u2212 2j', 'n = 4 links (including ground)', 'j = 4 revolute joints (each removes 2 DOF)', 'DOF = 3(4\u22121) \u2212 2(4) = 9 \u2212 8 = 1'], answer: 1, unit: 'DOF' }
    },
    {
      id: 'grashof-criterion', name: 'Grashof\u2019s Criterion', symbol: 's+l \u2264 p+q',
      formula: 's + l \u2264 p + q', unit: '\u2014',
      cat: 'basics',
      desc: 'Grashof\u2019s law determines whether at least one link in a four-bar mechanism can make a complete revolution. Let s = shortest link, l = longest link, p and q = remaining two links. If s + l \u2264 p + q, the mechanism is a Grashof linkage and at least one link can fully rotate. If s + l > p + q, no link can complete a full revolution, and the mechanism is a non-Grashof (triple-rocker) linkage. The equality case (s + l = p + q) produces a change-point mechanism.',
      example: { problem: 'Links are 30, 50, 60, 80 mm. Is it a Grashof mechanism?', steps: ['s = 30 (shortest), l = 80 (longest)', 'p = 50, q = 60 (remaining)', 's + l = 30 + 80 = 110', 'p + q = 50 + 60 = 110', '110 \u2264 110 \u2192 Yes, Grashof (change-point)'], answer: 'Yes', unit: '' }
    },
    {
      id: 'types-of-four-bar', name: 'Types of Four-Bar', symbol: 'CR / DC / DR',
      formula: 'Crank-Rocker / Double-Crank / Double-Rocker', unit: '\u2014',
      cat: 'basics',
      desc: 'For a Grashof linkage: if the shortest link is the crank (input), the mechanism is a Crank-Rocker (crank rotates fully, follower oscillates). If the shortest link is the ground (frame), both crank and follower can rotate \u2014 this is a Double-Crank (drag-link). If the shortest link is the coupler, it is a Grashof Double-Rocker \u2014 the coupler makes full revolutions relative to the others while neither side link does so relative to ground. For a non-Grashof linkage, no link can fully rotate — all three moving links oscillate, producing a Triple-Rocker. The parallelogram linkage (opposite links equal) is a special change-point Grashof case.',
      example: { problem: 'A mechanism has ground=100, crank=40, coupler=90, follower=70. Classify it.', steps: ['s = 40 (crank), l = 100 (ground)', 'p = 90 (coupler), q = 70 (follower)', 's + l = 40 + 100 = 140', 'p + q = 90 + 70 = 160', '140 \u2264 160 \u2192 Grashof', 'Shortest link is crank \u2192 Crank-Rocker'], answer: 'Crank-Rocker', unit: '' }
    },
    {
      id: 'degrees-of-freedom', name: 'Degrees of Freedom', symbol: 'DOF = 1',
      formula: 'DOF = 3(n\u22121) \u2212 2j', unit: 'DOF',
      cat: 'basics',
      desc: 'The degrees of freedom (mobility) of a mechanism determines how many independent inputs are needed to define its position. For planar mechanisms, Grubler\u2019s (Kutzbach) equation gives DOF = 3(n\u22121) \u2212 2j\u2081 \u2212 j\u2082, where n is the number of links (including ground), j\u2081 is the number of full joints (revolute, prismatic), and j\u2082 is the number of half joints. A four-bar linkage has n=4 links and j=4 revolute joints: DOF = 3(3) \u2212 2(4) = 1.',
      example: { problem: 'A mechanism has 6 links and 7 revolute joints. Find its DOF.', steps: ['DOF = 3(n\u22121) \u2212 2j', 'n = 6, j = 7', 'DOF = 3(6\u22121) \u2212 2(7)', 'DOF = 15 \u2212 14 = 1'], answer: 1, unit: 'DOF' }
    },

    /* -- Kinematics (4) -- */
    {
      id: 'position-analysis', name: 'Position Analysis', symbol: '\u03b82 \u2192 \u03b83, \u03b84',
      formula: '\u03b84 = 2\u00b7atan((\u2212B \u00b1 \u221a(B\u00b2\u2212C\u00b2+A\u00b2))/(C\u2212A))', unit: 'rad',
      cat: 'kinematics',
      desc: 'Position analysis of a four-bar linkage determines the angular positions of the coupler (\u03b83) and follower (\u03b84) given the crank angle (\u03b82). The loop-closure equation ae^{j\u03b81} + be^{j\u03b82} = ce^{j\u03b83} + de^{j\u03b84} is separated into real and imaginary parts. Using Freudenstein\u2019s substitution and the half-angle tangent formula, an analytical closed-form solution is obtained. Two solutions (assembly modes) exist corresponding to the \u00b1 sign, representing open and crossed configurations.',
      example: { problem: 'Why does the position analysis yield two solutions?', steps: ['The loop-closure equation is quadratic in tan(\u03b84/2)', 'Quadratic equations have two roots', 'These correspond to two assembly configurations:', 'Open configuration (links uncrossed)', 'Crossed configuration (links crossed)'], answer: 2, unit: 'solutions' }
    },
    {
      id: 'transmission-angle', name: 'Transmission Angle', symbol: '\u03bc',
      formula: '\u03bc = |angle between coupler and follower|', unit: '\u00b0',
      cat: 'kinematics',
      desc: 'The transmission angle (\u03bc) is the acute angle between the coupler and the follower at their connecting joint. It indicates the quality of force transmission through the mechanism. At \u03bc = 90\u00b0, force transmission is ideal. As \u03bc approaches 0\u00b0 or 180\u00b0, mechanical advantage drops dramatically. Design rule: keep \u03bc_min > 40\u00b0 for acceptable performance. The extreme values of \u03bc occur when the crank is aligned with the ground link (collinear with O2\u2013O4 line).',
      example: { problem: 'If the transmission angle is 25\u00b0, is the force transmission acceptable?', steps: ['Design rule: \u03bc_min should be > 40\u00b0', 'Given \u03bc = 25\u00b0', '25\u00b0 < 40\u00b0', 'Force transmission is POOR', 'Mechanism may jam or require excessive input force'], answer: 'No', unit: '' }
    },
    {
      id: 'coupler-curves', name: 'Coupler Curves', symbol: 'Path of P',
      formula: 'P(x,y) = f(\u03b82) for 0 \u2264 \u03b82 < 2\u03c0', unit: 'mm',
      cat: 'kinematics',
      desc: 'A coupler curve is the path traced by a point on the coupler link as the crank completes a full revolution. Different points on the coupler produce different curves. Coupler curves can approximate straight lines, circles, ellipses, figure-eights, and many other complex shapes. The Roberts-Chebyshev theorem states that up to three different four-bar linkages can produce the same coupler curve. Engineers use coupler curves for path generation \u2014 designing mechanisms where a tool or part must follow a specific trajectory.',
      example: { problem: 'How many different four-bar linkages can generate the same coupler curve (Roberts-Chebyshev)?', steps: ['Roberts-Chebyshev theorem:', 'For any coupler curve generated by a four-bar linkage,', 'there exist two other four-bar linkages (cognates)', 'that trace the identical curve.', 'Total: 3 linkages for one coupler curve'], answer: 3, unit: 'linkages' }
    },
    {
      id: 'instant-centre', name: 'Instantaneous Centre', symbol: 'I\u2081\u2083',
      formula: 'Aronhold-Kennedy: 3 ICs of 3 bodies are collinear', unit: '\u2014',
      cat: 'kinematics',
      desc: 'The instantaneous centre (IC) of two bodies in plane motion is the point at which the relative velocity is zero \u2014 i.e. the point about which one body appears to rotate with respect to the other at that instant. For an n-body system there are n(n\u22121)/2 ICs; for a four-bar linkage (n=4) that gives 6 ICs. The Aronhold-Kennedy theorem states that the three ICs of any three bodies in plane motion are collinear. For a four-bar, I\u2081\u2083 (coupler relative to ground) lies at the intersection of lines O\u2082A (extended) and O\u2084B (extended). The angular-velocity ratio \u03c9\u2084/\u03c9\u2082 = O\u2082I\u2081\u2083 / O\u2084I\u2081\u2083.',
      example: { problem: 'How many instantaneous centres exist in a four-bar linkage?', steps: ['Number of ICs = n(n\u22121)/2', 'n = 4 links', 'ICs = 4(3)/2 = 6'], answer: 6, unit: 'ICs' }
    },
    {
      id: 'velocity-analysis', name: 'Velocity Analysis', symbol: '\u03c93, \u03c94',
      formula: '\u03c94 = \u03c92 \u00b7 b\u00b7sin(\u03b82\u2212\u03b83) / (d\u00b7sin(\u03b84\u2212\u03b83))', unit: 'rad/s',
      cat: 'kinematics',
      desc: 'Velocity analysis determines the angular velocities of the coupler (\u03c93) and follower (\u03c94) given the crank angular velocity (\u03c92). Differentiating the loop-closure equation with respect to time yields two linear equations in \u03c93 and \u03c94. The follower angular velocity is \u03c94 = \u03c92 \u00b7 b\u00b7sin(\u03b82\u2212\u03b83) / (d\u00b7sin(\u03b84\u2212\u03b83)). Notice that when \u03b84 \u2212 \u03b83 approaches 0 or \u03c0, the denominator approaches zero \u2014 this corresponds to a toggle position where mechanical advantage becomes infinite.',
      example: { problem: 'A crank rotates at 10 rad/s. If b=40mm, \u03b82=60\u00b0, \u03b83=30\u00b0, d=70mm, \u03b84=120\u00b0, find \u03c94.', steps: ['\u03c94 = \u03c92 \u00b7 b\u00b7sin(\u03b82\u2212\u03b83) / (d\u00b7sin(\u03b84\u2212\u03b83))', '\u03c94 = 10 \u00d7 40\u00d7sin(60\u00b0\u221230\u00b0) / (70\u00d7sin(120\u00b0\u221230\u00b0))', '\u03c94 = 10 \u00d7 40\u00d70.5 / (70\u00d70.866)', '\u03c94 = 200 / 60.62 = 3.30 rad/s'], answer: 3.3, unit: 'rad/s' }
    },

    /* -- Design (4) -- */
    {
      id: 'freudenstein-equation', name: 'Freudenstein\u2019s Equation', symbol: 'K\u2081,K\u2082,K\u2083',
      formula: 'K\u2081cos\u03b84 \u2212 K\u2082cos\u03b82 + K\u2083 = cos(\u03b82\u2212\u03b84)', unit: '\u2014',
      cat: 'design',
      desc: 'Freudenstein\u2019s equation relates the input (\u03b82) and output (\u03b84) angles of a four-bar linkage through three constants. For the loop a + d\u00b7e^(j\u03b84) = b\u00b7e^(j\u03b82) + c\u00b7e^(j\u03b83) used in this simulator, eliminating \u03b83 gives: K\u2081 = a/b (ground/crank ratio), K\u2082 = a/d (ground/follower ratio), K\u2083 = (a\u00b2 + b\u00b2 + d\u00b2 \u2212 c\u00b2) / (2bd). This equation is fundamental to function generation \u2014 designing a four-bar mechanism where the output angle is a desired function of the input angle. Given three precision points (\u03b82,\u03b84 pairs), the three constants K\u2081, K\u2082, K\u2083 can be solved and link lengths determined.',
      example: { problem: 'For a=100, b=40, c=90, d=70, find Freudenstein constants K\u2081, K\u2082, K\u2083.', steps: ['K\u2081 = a/b = 100/40 = 2.500', 'K\u2082 = a/d = 100/70 = 1.429', 'K\u2083 = (a\u00b2+b\u00b2+d\u00b2\u2212c\u00b2)/(2bd)', 'K\u2083 = (10000+1600+4900\u22128100)/(2\u00d740\u00d770)', 'K\u2083 = 8400/5600 = 1.500'], answer: 1.500, unit: '' }
    },
    {
      id: 'dead-center', name: 'Dead-Center Positions', symbol: '\u03b82 at DC',
      formula: 'Crank collinear with ground (extended/folded)', unit: '\u00b0',
      cat: 'design',
      desc: 'Dead-center (or limit) positions occur in a crank-rocker mechanism when the crank and the follower are collinear with the ground link \u2014 specifically, when the crank is fully extended (O2A aligned with O2O4) or fully folded (O2A opposite to O2O4). At these positions, the follower reaches its extreme angular positions and momentarily stops before reversing direction. The transmission angle reaches its extreme (best or worst) values at or near dead-center positions.',
      example: { problem: 'In a crank-rocker with a=100, b=40, c=90, d=70, at what crank angles do dead centres occur?', steps: ['Dead centre when crank and ground are collinear', 'Extended: \u03b82 = 0\u00b0 (crank along +x from O2 toward O4)', 'Folded: \u03b82 = 180\u00b0 (crank along \u2212x from O2 away from O4)', 'At these positions, coupler and follower form a triangle with the extended/folded crank+ground'], answer: '0 and 180', unit: '\u00b0' }
    },
    {
      id: 'toggle-positions', name: 'Toggle Positions', symbol: '\u03b84\u2212\u03b83=0,\u03c0',
      formula: 'Coupler and follower collinear', unit: '\u00b0',
      cat: 'design',
      desc: 'A toggle position occurs when the coupler and follower become collinear (aligned). At a toggle, the mechanical advantage of the mechanism becomes theoretically infinite \u2014 a small input force can resist a large output force. Toggle mechanisms are used in clamps, presses, and stone-crusher mechanisms. In velocity analysis, the angular velocity of the follower has a singularity at toggle positions. The input crank cannot drive through a toggle using a four-bar alone; momentum or an additional mechanism is needed.',
      example: { problem: 'Why does the mechanical advantage become infinite at a toggle position?', steps: ['At toggle: coupler and follower are collinear', 'Force along coupler passes through follower pivot O4', 'Moment arm of the force about O4 = 0', 'No torque can be transmitted TO the follower', 'But any load ON the follower cannot back-drive the crank', 'Mechanical advantage = output/input \u2192 \u221e'], answer: 'Infinite', unit: '' }
    },
    {
      id: 'applications', name: 'Real-world Applications', symbol: 'Wipers, Pumps',
      formula: 'Wiper, pump jack, sewing machine, landing gear', unit: '\u2014',
      cat: 'design',
      desc: 'Four-bar linkages are ubiquitous in engineering: Windshield wipers use a crank-rocker to convert motor rotation to wiper oscillation. Oil pump jacks (nodding donkeys) use a crank-rocker to convert engine rotation into the up-down pumping motion. Sewing machines use a four-bar to drive the needle bar and fabric feed mechanism. Aircraft landing gear retraction mechanisms use four-bar linkages to fold gear into the fuselage. Bicycle suspension, car suspension (double-wishbone), and robotic arms all employ four-bar variants.',
      example: { problem: 'A car wiper oscillates through 120\u00b0. If the crank rotates at 45 RPM, what is the wiper oscillation frequency?', steps: ['Crank makes 1 full rotation per cycle', 'Wiper makes 1 complete oscillation (back and forth) per crank revolution', 'Frequency = crank RPM = 45 RPM', 'Frequency = 45/60 = 0.75 Hz', 'Period = 1/0.75 = 1.33 seconds per sweep cycle'], answer: 0.75, unit: 'Hz' }
    }
  ];

  /* ================================================================
     DATA - PROBLEM GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0 - Grashof yes/no */
    function () {
      var links = [randInt(30, 60), randInt(40, 80), randInt(50, 100), randInt(60, 120)];
      links.sort(function (a, b) { return a - b; });
      var s = links[0], l = links[3], p = links[1], q = links[2];
      var grashof = (s + l <= p + q);
      return { prompt: 'Link lengths: ' + links.join(', ') + ' mm. Is this a Grashof mechanism? (Answer: Yes or No)', steps: ['Sort links: s=' + s + ', p=' + p + ', q=' + q + ', l=' + l, 's + l = ' + s + ' + ' + l + ' = ' + (s + l), 'p + q = ' + p + ' + ' + q + ' = ' + (p + q), (s + l) + (grashof ? ' \u2264 ' : ' > ') + (p + q), 'Answer: ' + (grashof ? 'Yes (Grashof)' : 'No (Non-Grashof)')], answer: grashof ? 'Yes' : 'No', unit: '', type: 'text' };
    },
    /* 1 - Mechanism type */
    function () {
      var presets = [
        { a: 100, b: 40, c: 90, d: 70, type: 'Crank-Rocker' },
        { a: 50, b: 100, c: 80, d: 70, type: 'Double-Crank' },
        { a: 100, b: 80, c: 70, d: 60, type: 'Triple-Rocker' },
        { a: 100, b: 60, c: 100, d: 60, type: 'Parallelogram' }
      ];
      var p = presets[randInt(0, 3)];
      return { prompt: 'Ground=' + p.a + ', Crank=' + p.b + ', Coupler=' + p.c + ', Follower=' + p.d + ' mm. What is the mechanism type?', steps: ['Find shortest and longest links', 'Check Grashof: s+l vs p+q', 'Identify which link is shortest', 'Classify based on shortest link position', 'Type: ' + p.type], answer: p.type, unit: '', type: 'text' };
    },
    /* 2 - Shortest link (FIX: handle ties by scanning all) */
    function () {
      var a = randInt(50, 150), b = randInt(20, 100), c = randInt(30, 120), d = randInt(30, 120);
      var shortest = Math.min(a, b, c, d);
      var names = [];
      if (a === shortest) names.push('Ground');
      if (b === shortest) names.push('Crank');
      if (c === shortest) names.push('Coupler');
      if (d === shortest) names.push('Follower');
      var name = names[0];
      return { prompt: 'Ground=' + a + ', Crank=' + b + ', Coupler=' + c + ', Follower=' + d + ' mm. Which is the shortest link? (Ground/Crank/Coupler/Follower)', steps: ['Ground (a) = ' + a + ' mm', 'Crank (b) = ' + b + ' mm', 'Coupler (c) = ' + c + ' mm', 'Follower (d) = ' + d + ' mm', 'Shortest = ' + shortest + ' mm \u2192 ' + name], answer: name, unit: '', type: 'text' };
    },
    /* 3 - s+l vs p+q */
    function () {
      var links = [randInt(25, 55), randInt(45, 85), randInt(55, 105), randInt(65, 125)];
      links.sort(function (a, b) { return a - b; });
      var sl = links[0] + links[3], pq = links[1] + links[2];
      return { prompt: 'Links: ' + links.join(', ') + ' mm. Calculate s+l (shortest + longest).', steps: ['Sort: s=' + links[0] + ', l=' + links[3], 's + l = ' + links[0] + ' + ' + links[3], 's + l = ' + sl, '(For reference: p+q = ' + pq + ')'], answer: sl, unit: 'mm', type: 'number' };
    },
    /* 4 - DOF calculation */
    function () {
      var n = randInt(4, 8);
      var j = randInt(n, Math.floor(1.5 * n));
      var dof = 3 * (n - 1) - 2 * j;
      return { prompt: 'A planar mechanism has ' + n + ' links and ' + j + ' revolute joints. Find the degrees of freedom.', steps: ['DOF = 3(n\u22121) \u2212 2j', 'DOF = 3(' + n + '\u22121) \u2212 2(' + j + ')', 'DOF = ' + (3 * (n - 1)) + ' \u2212 ' + (2 * j), 'DOF = ' + dof], answer: dof, unit: 'DOF', type: 'number' };
    },
    /* 5 - Transmission angle at given position (varied geometry) */
    function () {
      var geos = [
        { a: 100, b: 40, c: 90, d: 70 },
        { a: 90,  b: 35, c: 85, d: 65 },
        { a: 110, b: 45, c: 95, d: 80 },
        { a: 80,  b: 30, c: 70, d: 60 }
      ];
      var g = geos[randInt(0, geos.length - 1)];
      var theta2Deg = randInt(1, 11) * 30;
      var theta2 = theta2Deg * RAD;
      var res = solvePosition(g.a, g.b, g.c, g.d, theta2, 1);
      if (!res) return PROBLEM_GEN[0]();
      var mu = transmissionAngle(res.theta3, res.theta4);
      var muDeg = +(mu * DEG).toFixed(1);
      return { prompt: 'Crank-Rocker: a=' + g.a + ', b=' + g.b + ', c=' + g.c + ', d=' + g.d + ' mm. At crank angle \u03b82=' + theta2Deg + '\u00b0, what is the transmission angle? (1 dp)', steps: ['Use loop-closure position analysis', 'Solve for \u03b83 and \u03b84 at \u03b82=' + theta2Deg + '\u00b0', 'Transmission angle \u03bc = acute angle between coupler and follower', '\u03bc = ' + muDeg + '\u00b0'], answer: muDeg, unit: '\u00b0', type: 'number' };
    },
    /* 6 - Longest link (FIX: handle ties by scanning all) */
    function () {
      var a = randInt(50, 150), b = randInt(20, 100), c = randInt(30, 120), d = randInt(30, 120);
      var longest = Math.max(a, b, c, d);
      var names = [];
      if (a === longest) names.push('Ground');
      if (b === longest) names.push('Crank');
      if (c === longest) names.push('Coupler');
      if (d === longest) names.push('Follower');
      var name = names[0];
      return { prompt: 'Ground=' + a + ', Crank=' + b + ', Coupler=' + c + ', Follower=' + d + ' mm. Which is the longest link?', steps: ['Ground (a) = ' + a + ' mm', 'Crank (b) = ' + b + ' mm', 'Coupler (c) = ' + c + ' mm', 'Follower (d) = ' + d + ' mm', 'Longest = ' + longest + ' mm \u2192 ' + name], answer: name, unit: '', type: 'text' };
    },
    /* 7 - Angular velocity of follower */
    function () {
      var omega2 = randInt(5, 20);
      var b = 40, d = 70;
      var t2 = randInt(1, 5) * 30;
      var t3 = t2 - randInt(10, 40);
      var t4 = t2 + randInt(30, 90);
      var num = b * Math.sin((t2 - t3) * RAD);
      var den = d * Math.sin((t4 - t3) * RAD);
      if (Math.abs(den) < 0.01) return PROBLEM_GEN[4]();
      var omega4 = +(omega2 * num / den).toFixed(2);
      return { prompt: 'Crank speed \u03c92=' + omega2 + ' rad/s, b=' + b + 'mm, d=' + d + 'mm, \u03b82=' + t2 + '\u00b0, \u03b83=' + t3 + '\u00b0, \u03b84=' + t4 + '\u00b0. Find \u03c94 (rad/s, 2 decimals).', steps: ['\u03c94 = \u03c92 \u00b7 b\u00b7sin(\u03b82\u2212\u03b83) / (d\u00b7sin(\u03b84\u2212\u03b83))', 'Numerator: ' + b + '\u00d7sin(' + (t2 - t3) + '\u00b0) = ' + num.toFixed(3), 'Denominator: ' + d + '\u00d7sin(' + (t4 - t3) + '\u00b0) = ' + den.toFixed(3), '\u03c94 = ' + omega2 + ' \u00d7 ' + num.toFixed(3) + ' / ' + den.toFixed(3) + ' = ' + omega4 + ' rad/s'], answer: omega4, unit: 'rad/s', type: 'number' };
    },
    /* 8 - Freudenstein K1 (a/b for our loop convention) */
    function () {
      var a = randInt(60, 150), b = randInt(20, 100);
      var K1 = +(a / b).toFixed(3);
      return { prompt: 'Ground a=' + a + ' mm, Crank b=' + b + ' mm. Find Freudenstein constant K\u2081 = a/b (3 decimals).', steps: ['K\u2081 = a / b', 'K\u2081 = ' + a + ' / ' + b, 'K\u2081 = ' + K1], answer: K1, unit: '', type: 'number' };
    },
    /* 9 - Is transmission angle acceptable? */
    function () {
      var mu = randInt(15, 85);
      var ok = mu >= 40;
      return { prompt: 'The minimum transmission angle of a mechanism is ' + mu + '\u00b0. Is the force transmission acceptable? (Yes/No, threshold = 40\u00b0)', steps: ['Design rule: \u03bc_min > 40\u00b0 for acceptable transmission', 'Given \u03bc_min = ' + mu + '\u00b0', mu + '\u00b0 ' + (ok ? '\u2265' : '<') + ' 40\u00b0', 'Answer: ' + (ok ? 'Yes (acceptable)' : 'No (poor, risk of jamming)')], answer: ok ? 'Yes' : 'No', unit: '', type: 'text' };
    },
    /* 10 - Grashof with change-point detection */
    function () {
      var s = randInt(20, 50);
      var factor = randInt(2, 4);
      var l = s * factor;
      var pq = s + l;
      var p = randInt(s + 5, pq - s - 2);
      var q = pq - p;
      return { prompt: 'Links: ' + s + ', ' + p + ', ' + q + ', ' + l + ' mm. Is this a change-point mechanism? (Yes/No)', steps: ['s = ' + s + ', l = ' + l, 'p = ' + p + ', q = ' + q, 's + l = ' + (s + l), 'p + q = ' + (p + q), (s + l) + ' = ' + (p + q) + ' \u2192 Yes, change-point!'], answer: 'Yes', unit: '', type: 'text' };
    },
    /* 11 - Wiper oscillation frequency */
    function () {
      var rpm = randInt(30, 80);
      var freq = +(rpm / 60).toFixed(2);
      return { prompt: 'A windshield wiper crank rotates at ' + rpm + ' RPM. What is the wiper oscillation frequency (Hz)?', steps: ['1 full crank revolution = 1 wiper cycle', 'Frequency = RPM / 60', 'Frequency = ' + rpm + ' / 60', 'Frequency = ' + freq + ' Hz'], answer: freq, unit: 'Hz', type: 'number' };
    },
    /* 12 - Minimum transmission angle over a full cycle */
    function () {
      var geos = [
        { a: 100, b: 40, c: 90, d: 70 },
        { a: 100, b: 30, c: 80, d: 70 },
        { a: 90,  b: 35, c: 85, d: 65 }
      ];
      var g = geos[randInt(0, geos.length - 1)];
      var muMin = 90;
      for (var t = 0; t < TAU; t += 0.01) {
        var r = solvePosition(g.a, g.b, g.c, g.d, t, 1);
        if (!r) continue;
        var m = transmissionAngle(r.theta3, r.theta4) * DEG;
        if (m < muMin) muMin = m;
      }
      muMin = +muMin.toFixed(1);
      return { prompt: 'For a Grashof crank-rocker (a=' + g.a + ', b=' + g.b + ', c=' + g.c + ', d=' + g.d + ' mm), find the minimum transmission angle μ_min over one crank revolution (1 dp).', steps: ['Sweep θ2 from 0 to 2π', 'For each θ2, solve position to get θ3, θ4', 'Compute μ = acute angle between coupler & follower', 'Track minimum value: μ_min = ' + muMin + '°', muMin >= 40 ? 'Acceptable (≥ 40°)' : 'Poor — redesign needed'], answer: muMin, unit: '°', type: 'number' };
    },
    /* 13 - Crank-rocker time ratio (advance/return) */
    function () {
      var alphaDeg = randInt(10, 30);
      var Q = +((180 + alphaDeg) / (180 - alphaDeg)).toFixed(3);
      return { prompt: 'In a crank-rocker mechanism, the angle between the two dead-centre crank positions (measured through the obtuse side) exceeds 180° by α = ' + alphaDeg + '°. Find the time ratio Q = t_forward / t_return (3 dp).', steps: ['Q = (180° + α) / (180° − α)', 'Q = (180 + ' + alphaDeg + ') / (180 − ' + alphaDeg + ')', 'Q = ' + (180 + alphaDeg) + ' / ' + (180 - alphaDeg), 'Q = ' + Q, 'Q > 1 → forward stroke slower than return (quick-return)'], answer: Q, unit: '', type: 'number' };
    }
  ];

  /* ================================================================
     DATA - QUIZ POOL (15 questions)
     ================================================================ */
  var QUIZ_POOL = [
    { q: 'The Grashof condition for a four-bar linkage is:', choices: ['s + l \u2264 p + q', 's + l \u2265 p + q', 's \u00d7 l = p \u00d7 q', 's / l = p / q'], correct: 0 },
    { q: 'In a crank-rocker mechanism, the shortest link is the:', choices: ['Ground (frame)', 'Coupler', 'Crank (input)', 'Follower (output)'], correct: 2 },
    { q: 'The transmission angle for best force transmission is closest to:', choices: ['0\u00b0', '45\u00b0', '90\u00b0', '180\u00b0'], correct: 2 },
    { q: 'A parallelogram linkage has the property that:', choices: ['Opposite links are equal in length', 'All links are equal', 'Adjacent links are equal', 'Diagonal links are equal'], correct: 0 },
    { q: 'A four-bar linkage has how many degrees of freedom?', choices: ['0', '1', '2', '3'], correct: 1 },
    { q: 'When the shortest link is the ground (frame) in a Grashof linkage, the mechanism is a:', choices: ['Crank-Rocker', 'Double-Rocker', 'Double-Crank (Drag Link)', 'Change-Point'], correct: 2 },
    { q: 'A non-Grashof four-bar linkage is classified as a:', choices: ['Crank-Rocker', 'Double-Crank', 'Triple-Rocker', 'Parallelogram'], correct: 2 },
    { q: 'The minimum acceptable transmission angle in practice is typically:', choices: ['10\u00b0', '25\u00b0', '40\u00b0', '60\u00b0'], correct: 2 },
    { q: 'Freudenstein\u2019s equation is used for:', choices: ['Stress analysis', 'Function generation design', 'Fatigue analysis', 'Thermal analysis'], correct: 1 },
    { q: 'At a toggle position, the mechanical advantage is:', choices: ['Zero', 'Unity (1)', 'Infinite', 'Negative'], correct: 2 },
    { q: 'Coupler curves of a four-bar linkage are used for:', choices: ['Stress analysis', 'Path generation', 'Balancing', 'Vibration analysis'], correct: 1 },
    { q: 'The Roberts-Chebyshev theorem states that a coupler curve can be generated by how many different four-bar linkages?', choices: ['1', '2', '3', '4'], correct: 2 },
    { q: 'The loop-closure equation for a four-bar linkage yields how many scalar equations?', choices: ['1', '2', '3', '4'], correct: 1 },
    { q: 'A windshield wiper mechanism is typically a:', choices: ['Double-Crank', 'Slider-Crank', 'Crank-Rocker', 'Double-Rocker'], correct: 2 },
    { q: 'Dead-center positions occur when the crank is:', choices: ['Perpendicular to ground', 'Collinear with ground', 'At 45\u00b0 to ground', 'At maximum transmission angle'], correct: 1 },
    { q: 'How many instantaneous centres does a four-bar linkage have?', choices: ['3', '4', '6', '8'], correct: 2 },
    { q: 'The Aronhold-Kennedy theorem states that:', choices: ['The 3 ICs of any 3 bodies are collinear', 'Two links can share at most one IC', 'ICs always lie on the ground link', 'ICs are stationary in the body frame'], correct: 0 }
  ];

  /* ================================================================
     KINEMATICS ENGINE
     ================================================================ */
  // branch: +1 = open (default), -1 = crossed
  function solvePosition(a, b, c, d, theta2, branch) {
    if (branch !== -1) branch = 1;
    var Ax = b * Math.cos(theta2);
    var Ay = b * Math.sin(theta2);
    var dx = Ax - a;
    var dy = Ay;
    var f = Math.sqrt(dx * dx + dy * dy);
    if (f > c + d || f < Math.abs(c - d) || f < 1e-10) return null;
    var beta = Math.atan2(dy, dx);
    var cosAlpha = (f * f + d * d - c * c) / (2 * f * d);
    cosAlpha = clamp(cosAlpha, -1, 1);
    var alpha = Math.acos(cosAlpha);
    var theta4 = beta + branch * alpha;
    var Bx = a + d * Math.cos(theta4);
    var By = d * Math.sin(theta4);
    var theta3 = Math.atan2(By - Ay, Bx - Ax);
    return { theta3: theta3, theta4: theta4, Ax: Ax, Ay: Ay, Bx: Bx, By: By };
  }

  // Raw signed angle between coupler & follower at joint B, in (-π, π].
  // Used by the on-canvas arc indicator so the drawn arc matches the displayed value.
  function couplerFollowerAngle(theta3, theta4) {
    var d = theta4 - theta3;
    while (d > PI) d -= TAU;
    while (d <= -PI) d += TAU;
    return d;
  }

  // Acute transmission angle in [0, π/2] — quality metric.
  function transmissionAngle(theta3, theta4) {
    var diff = Math.abs(couplerFollowerAngle(theta3, theta4));
    if (diff > PI / 2) diff = PI - diff;
    return diff;
  }

  /* ────────── Kinematic inversion helpers ────────── */
  // Cyclic chain L1-L2-L3-L4-L1. When inversion k (1..4) grounds Lk, the mechanism is
  // walked around the loop: a = Lk, b = L(k+1), c = L(k+2), d = L(k+3).
  function inversionMap(chain, k) {
    var n = chain.length, idx = (k - 1 + n) % n;
    return { a: chain[idx], b: chain[(idx + 1) % n], c: chain[(idx + 2) % n], d: chain[(idx + 3) % n] };
  }
  // For a given chain & inversion, return classification + which links can rotate fully.
  // Cyclic positions: ground (a) = pos1, crank (b) = pos2, coupler (c) = pos3, follower (d) = pos4.
  function inversionInfo(chain, k) {
    var m = inversionMap(chain, k);
    var cls = classifyMechanism(m.a, m.b, m.c, m.d);
    var sIdx = [m.a, m.b, m.c, m.d].indexOf(cls.s); // 0..3, position of shortest within current frame
    var posLabel = ['ground (a)', 'crank (b)', 'coupler (c)', 'follower (d)'][sIdx];
    var rotLinks;
    if (!cls.grashof) rotLinks = 'none';
    else if (sIdx === 0) rotLinks = 'crank (b) AND follower (d) — drag-link';
    else if (sIdx === 1 || sIdx === 3) rotLinks = sIdx === 1 ? 'crank (b) only' : 'follower (d) only';
    else rotLinks = 'coupler (c) — Grashof double-rocker';
    return { map: m, cls: cls, sPos: sIdx, posLabel: posLabel, rotLinks: rotLinks };
  }

  // Solve the 3-precision-point Freudenstein function-generation problem.
  // Inputs: arrays t2[3], t4[3] in radians.
  // Returns {ok, K1, K2, K3, a, b, c, d, msg}.
  function solveFunctionSynthesis(t2, t4) {
    // K1·cos θ4i − K2·cos θ2i + K3 = cos(θ2i − θ4i)
    var M = [
      [Math.cos(t4[0]), -Math.cos(t2[0]), 1],
      [Math.cos(t4[1]), -Math.cos(t2[1]), 1],
      [Math.cos(t4[2]), -Math.cos(t2[2]), 1]
    ];
    var rhs = [
      Math.cos(t2[0] - t4[0]),
      Math.cos(t2[1] - t4[1]),
      Math.cos(t2[2] - t4[2])
    ];
    function det3(m) {
      return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
           - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
           + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    }
    function withCol(m, col, vec) {
      return m.map(function (r, i) { return r.map(function (v, j) { return j === col ? vec[i] : v; }); });
    }
    var D = det3(M);
    if (Math.abs(D) < 1e-9) return { ok: false, msg: 'Precision-point matrix is singular — pick three distinct (θ2, θ4) pairs.' };
    var K1 = det3(withCol(M, 0, rhs)) / D;
    var K2 = det3(withCol(M, 1, rhs)) / D;
    var K3 = det3(withCol(M, 2, rhs)) / D;
    if (Math.abs(K1) < 1e-9 || Math.abs(K2) < 1e-9) return { ok: false, msg: 'K₁ or K₂ ≈ 0 — degenerate (link → ∞).' };
    // Inversion of K₁ = a/b, K₂ = a/d, K₃ = (a² + b² + d² − c²)/(2bd) with a := 1.
    var a = 1, b = a / K1, d = a / K2;
    var c2 = a * a + b * b + d * d - 2 * b * d * K3;
    if (c2 <= 0) return { ok: false, msg: 'No real solution (c² = ' + c2.toFixed(3) + ' < 0). Try different precision points.' };
    var c = Math.sqrt(c2);
    // Scale so the largest link is 100 mm for a friendly readout
    var scale = 100 / Math.max(a, Math.abs(b), c, Math.abs(d));
    return { ok: true, K1: K1, K2: K2, K3: K3,
             a: a * scale, b: Math.abs(b) * scale, c: c * scale, d: Math.abs(d) * scale };
  }

  function classifyMechanism(a, b, c, d) {
    var links = [a, b, c, d];
    var sorted = links.slice().sort(function (x, y) { return x - y; });
    var s = sorted[0], l = sorted[3], p = sorted[1], q = sorted[2];
    var sl = s + l, pq = p + q;
    // Tolerance for the change-point (s+l = p+q) test — exact float equality
    // never fires now that decimal link lengths are allowed.
    var EPS = 0.01;
    var grashof, type;
    if (sl > pq + EPS) {
      grashof = false;
      type = 'Triple-Rocker';
    } else {
      grashof = true;
      // Find ALL indices that match shortest, pick by priority: 1(crank) > 0(ground) > 3(follower) > 2(coupler)
      var shortestIndices = [];
      for (var i = 0; i < 4; i++) { if (links[i] === s) shortestIndices.push(i); }
      var shortestIdx = shortestIndices[0];
      if (Math.abs(sl - pq) <= EPS) {
        if (shortestIdx === 0) type = 'Change-Point (Double-Crank)';
        else if (shortestIdx === 1) type = 'Change-Point (Crank-Rocker)';
        else type = 'Change-Point';
      } else {
        if (shortestIdx === 0) type = 'Double-Crank';
        else if (shortestIdx === 1) type = 'Crank-Rocker';
        else if (shortestIdx === 2) type = 'Double-Rocker (Grashof)';
        else type = 'Crank-Rocker';
      }
      if (Math.abs(a - c) < 0.5 && Math.abs(b - d) < 0.5) type = 'Parallelogram';
    }
    return { grashof: grashof, type: type, s: s, l: l, p: p, q: q, sl: sl, pq: pq };
  }

  function canAssemble(a, b, c, d) {
    var maxSum = Math.max(a, b, c, d);
    var total = a + b + c + d;
    return maxSum < total - maxSum;
  }

  function followerOmega(omega2, b, d, theta2, theta3, theta4) {
    var den = d * Math.sin(theta4 - theta3);
    var num = omega2 * b * Math.sin(theta2 - theta3);
    // Near a toggle, |ω₄| → ∞. Cap at 50·|ω2| so the readout shows the spike instead of dropping to 0.
    var cap = Math.abs(omega2) * 50 + 1e-3;
    if (Math.abs(den) < Math.abs(num) / cap) {
      return num >= 0 ? cap * (den >= 0 ? 1 : -1) : -cap * (den >= 0 ? 1 : -1);
    }
    return num / den;
  }

  /* ================================================================
     CANVAS SETUP
     ================================================================ */
  var cvs = $('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;
  var DPR = Math.max(window.devicePixelRatio || 1, 1);

  function initCanvas() {
    cvs.width = W * DPR;
    cvs.height = H * DPR;
    cvs.style.maxWidth = W + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  initCanvas();

  /* ================================================================
     STATE
     ================================================================ */
  var state = {
    mode: 'simulate',
    a: 100, b: 40, c: 90, d: 70,
    rpm: 20,
    theta2: 0,
    crankDir: 1,
    running: true,
    showCouplerCurve: true,
    showVelocity: true,
    showTransArc: true,
    showPointP: true,
    showLabels: true,
    showLinkVals: true,
    showThetaArc: true,
    showInfoPanel: true,
    showGrid: true,
    couplerTrace: [],
    activePreset: 'crank-rocker',
    unitSystem: 'mm',  // 'mm' or 'inch'
    // Inversions feature
    invSub: 'grounds',                    // 'grounds' | 'equations' | 'synthesis'
    invGround: 1,                         // 1..4 (which link of invChain is grounded)
    invChain: [40, 70, 80, 100],          // canonical Grashof chain (s+l = 140 ≤ p+q = 150)
    synthSub: 'function',                 // 'function' | 'path' | 'motion'
    prevAnim: { a: 100, b: 40, c: 90, d: 70, theta2: 0 },  // restored when leaving inversions
    omega2Prev: 0,                        // for acceleration calc
    assemblyBranch: 1,    // +1 open, -1 crossed
    couplerU: 0.5,        // P along AB, 0=A, 1=B
    couplerV: 0,          // P perpendicular offset / coupler length
    velScale: 1,          // velocity arrow scale multiplier
    // Explore
    exploreCat: 'basics',
    exploreItem: null,
    // Practice
    pracScore: 0,
    pracTotal: 0,
    pracCurrent: null,
    pracAnswered: false,
    // Quiz
    quizQuestions: [],
    quizIdx: 0,
    quizScore: 0,
    quizAnswered: false,
    quizResults: [],
    // Drag
    draggingCrank: false
  };

  var animId = null;
  var lastTime = 0;

  /* ================================================================
     DOM REFERENCES
     ================================================================ */
  var modeTabs   = $('mode-tabs');
  var simPanel   = $('sim-panel');
  var catRow     = $('cat-row');
  var catTabs    = $('cat-tabs');
  var itemSel    = $('item-selector');
  var conceptGrid= $('concept-grid');
  var itemInfo   = $('item-info');
  var practicePanel = $('practice-panel');
  var practiceBar   = $('practice-bar');
  var quizPanel  = $('quiz-panel');
  var quizBar    = $('quiz-bar');
  var quizResult = $('quiz-result');
  var warnMsg    = $('warn-msg');
  var hintBanner = $('hint-banner');
  var ctxMenu    = $('ctx-menu');

  // Sliders
  var slGround  = $('sl-ground'),  valGround  = $('val-ground');
  var slCrank   = $('sl-crank'),   valCrank   = $('val-crank');
  var slCoupler = $('sl-coupler'), valCoupler = $('val-coupler');
  var slFollower= $('sl-follower'),valFollower= $('val-follower');
  var slRpm     = $('sl-rpm'),     valRpm     = $('val-rpm');
  // Display toggles (canvas-overlay checkboxes)
  var chkCouplerCurve = $('dt-coupler-curve');
  var chkVelocity     = $('dt-velocity');
  var chkTransArc     = $('dt-trans-arc');
  var chkPointP       = $('dt-point-p');
  var chkLabels       = $('dt-labels');
  var chkLinkVals     = $('dt-link-vals');
  var chkThetaArc     = $('dt-theta-arc');
  var chkInfoPanel    = $('dt-info-panel');
  var chkGrid         = $('dt-grid');

  // Stepper inputs
  var stepGround  = $('step-ground');
  var stepCrank   = $('step-crank');
  var stepCoupler = $('step-coupler');
  var stepFollower= $('step-follower');
  var stepRpm     = $('step-rpm');

  // HTML Mechanism Info overlay readouts (top-right canvas overlay)
  var mipType    = $('mip-type');
  var mipGrashof = $('mip-grashof');
  var mipSl      = $('mip-sl');
  var mipPq      = $('mip-pq');
  var mipTheta2  = $('mip-theta2');
  var mipMu      = $('mip-mu');
  var mipOmega4  = $('mip-omega4');

  // Bottom readout cards
  var rType   = $('r-type');
  var rGrashof= $('r-grashof');
  var rTheta2 = $('r-theta2');
  var rMu     = $('r-mu');
  var rTheta3 = $('r-theta3');
  var rOmega4 = $('r-omega4');

  /* ================================================================
     UNIT SYSTEM
     ================================================================ */
  function unitLabel() { return state.unitSystem === 'inch' ? ' in' : ' mm'; }
  function displayVal(mmVal) {
    if (state.unitSystem === 'inch') return (mmVal / MM_PER_INCH).toFixed(2);
    return String(mmVal);
  }

  function initUnitToggle() {
    var btnMm = $('unit-mm');
    var btnInch = $('unit-inch');
    btnMm.addEventListener('click', function () {
      if (state.unitSystem === 'mm') return;
      state.unitSystem = 'mm';
      btnMm.classList.add('active'); btnInch.classList.remove('active');
      syncSlidersFromState();
    });
    btnInch.addEventListener('click', function () {
      if (state.unitSystem === 'inch') return;
      state.unitSystem = 'inch';
      btnInch.classList.add('active'); btnMm.classList.remove('active');
      syncSlidersFromState();
    });
  }

  /* ================================================================
     PRESETS
     ================================================================ */
  var PRESETS = {
    'crank-rocker':      { a: 100, b: 40,  c: 90,  d: 70,  theta2: 0      },
    'double-crank':      { a: 40,  b: 100, c: 80,  d: 70,  theta2: 0      },
    'double-rocker':     { a: 100, b: 80,  c: 70,  d: 60,  theta2: PI / 3 },
    'parallelogram':     { a: 100, b: 60,  c: 100, d: 60,  theta2: PI / 2 },
    'antiparallelogram': { a: 100, b: 60,  c: 100, d: 60,  theta2: PI / 2, branch: -1 }
  };

  function applyPreset(name) {
    var p = PRESETS[name];
    if (!p) return;
    pushUndo();
    state.a = p.a; state.b = p.b; state.c = p.c; state.d = p.d;
    state.theta2 = p.theta2 !== undefined ? p.theta2 : 0;
    state.crankDir = 1;
    state.assemblyBranch = (p.branch !== undefined ? p.branch : 1);
    state.couplerTrace = [];
    state.activePreset = name;
    syncSlidersFromState();
    updatePresetBtns();
    checkAssembly();
  }

  function syncSlidersFromState() {
    slGround.value = state.a;   valGround.textContent  = displayVal(state.a) + unitLabel();
    slCrank.value = state.b;    valCrank.textContent   = displayVal(state.b) + unitLabel();
    slCoupler.value = state.c;  valCoupler.textContent  = displayVal(state.c) + unitLabel();
    slFollower.value = state.d; valFollower.textContent = displayVal(state.d) + unitLabel();
    slRpm.value = state.rpm;    valRpm.textContent     = state.rpm + ' RPM';
    // Stepper inputs
    stepGround.value = state.a;
    stepCrank.value = state.b;
    stepCoupler.value = state.c;
    stepFollower.value = state.d;
    stepRpm.value = state.rpm;
    var slU = $('sl-coupler-u'), vU = $('val-coupler-u');
    var slV = $('sl-coupler-v'), vV = $('val-coupler-v');
    var slVS = $('sl-vel-scale'), vVS = $('val-vel-scale');
    if (slU) { slU.value = state.couplerU; vU.textContent = state.couplerU.toFixed(2); }
    if (slV) { slV.value = state.couplerV; vV.textContent = state.couplerV.toFixed(2); }
    if (slVS) { slVS.value = state.velScale; vVS.textContent = state.velScale.toFixed(1) + '×'; }
    var bb = $('btn-branch');
    if (bb) bb.textContent = 'Branch: ' + (state.assemblyBranch === 1 ? 'Open' : 'Crossed');
  }

  function updatePresetBtns() {
    qsa('.preset-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.preset === state.activePreset);
    });
  }

  /* ================================================================
     SLIDER + STEPPER HANDLERS
     ================================================================ */
  function onSlider(slider, valEl, key, suffix, stepInput) {
    slider.addEventListener('input', function () {
      var v = +slider.value;
      state[key] = v;
      valEl.textContent = (suffix === ' RPM' ? v : displayVal(v)) + (suffix === ' RPM' ? suffix : unitLabel());
      if (stepInput) stepInput.value = v;
      state.couplerTrace = [];
      state.activePreset = '';
      updatePresetBtns();
      checkAssembly();
      if (!state.running) draw();
    });
    // Push undo on change (mouseup / touchend)
    slider.addEventListener('change', function () { pushUndo(); });
  }

  onSlider(slGround,  valGround,  'a', ' mm', stepGround);
  onSlider(slCrank,   valCrank,   'b', ' mm', stepCrank);
  onSlider(slCoupler, valCoupler, 'c', ' mm', stepCoupler);
  onSlider(slFollower,valFollower,'d', ' mm', stepFollower);
  onSlider(slRpm,     valRpm,    'rpm', ' RPM', stepRpm);

  // Stepper buttons — read the base value from the paired text input (holds
  // the un-snapped decimal), not the integer-step slider.
  qsa('.stepper-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var slider = $(btn.dataset.target);
      var input = btn.parentElement.querySelector('.stepper-input');
      if (!slider || !input) return;
      var dir = +btn.dataset.dir;
      var base = parseFloat(input.value);
      if (isNaN(base)) base = +slider.value;
      input.value = clamp(base + dir, +slider.min, +slider.max);
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  // Stepper text inputs — commit decimals straight to state; the slider is
  // display-only here (step="1" would snap 45.5 → 46 if state was read back
  // from slider.value).
  function onStepperInput(stepInput, slider, key) {
    stepInput.addEventListener('change', function () {
      var v = parseFloat(stepInput.value);
      if (isNaN(v)) { stepInput.value = state[key]; return; }
      v = Math.round(clamp(v, +slider.min, +slider.max) * 100) / 100;
      state[key] = v;
      state.couplerTrace = [];
      state.activePreset = '';
      updatePresetBtns();
      syncSlidersFromState();
      checkAssembly();
      if (!state.running) draw();
      pushUndo();
    });
  }
  onStepperInput(stepGround, slGround, 'a');
  onStepperInput(stepCrank, slCrank, 'b');
  onStepperInput(stepCoupler, slCoupler, 'c');
  onStepperInput(stepFollower, slFollower, 'd');
  onStepperInput(stepRpm, slRpm, 'rpm');

  function wireToggle(el, key, extra) {
    if (!el) return;
    el.addEventListener('change', function () {
      state[key] = el.checked;
      if (extra) extra(el.checked);
      draw();
    });
  }
  wireToggle(chkCouplerCurve, 'showCouplerCurve', function (on) { if (!on) state.couplerTrace = []; });
  wireToggle(chkVelocity,    'showVelocity');
  wireToggle(chkTransArc,    'showTransArc');
  wireToggle(chkPointP,      'showPointP');
  wireToggle(chkLabels,      'showLabels');
  wireToggle(chkLinkVals,    'showLinkVals');
  wireToggle(chkThetaArc,    'showThetaArc');
  wireToggle(chkInfoPanel,   'showInfoPanel');
  wireToggle(chkGrid,        'showGrid');

  // Coupler P offset sliders + velocity scale
  var slCouplerU = $('sl-coupler-u'), valCouplerU = $('val-coupler-u');
  var slCouplerV = $('sl-coupler-v'), valCouplerV = $('val-coupler-v');
  var slVelScale = $('sl-vel-scale'), valVelScale = $('val-vel-scale');
  if (slCouplerU) {
    slCouplerU.addEventListener('input', function () {
      state.couplerU = +slCouplerU.value;
      valCouplerU.textContent = state.couplerU.toFixed(2);
      state.couplerTrace = [];
    });
  }
  if (slCouplerV) {
    slCouplerV.addEventListener('input', function () {
      state.couplerV = +slCouplerV.value;
      valCouplerV.textContent = state.couplerV.toFixed(2);
      state.couplerTrace = [];
    });
  }
  if (slVelScale) {
    slVelScale.addEventListener('input', function () {
      state.velScale = +slVelScale.value;
      valVelScale.textContent = state.velScale.toFixed(1) + '×';
    });
  }

  // Branch toggle (open/crossed assembly)
  var btnBranch = $('btn-branch');
  if (btnBranch) {
    btnBranch.addEventListener('click', function () {
      pushUndo();
      state.assemblyBranch = -state.assemblyBranch;
      btnBranch.textContent = 'Branch: ' + (state.assemblyBranch === 1 ? 'Open' : 'Crossed');
      state.couplerTrace = [];
      // Verify reachability; if not, snap to a reachable theta
      if (!solvePosition(state.a, state.b, state.c, state.d, state.theta2, state.assemblyBranch)) {
        for (var t = 0; t < TAU; t += 0.05) {
          if (solvePosition(state.a, state.b, state.c, state.d, t, state.assemblyBranch)) {
            state.theta2 = t; break;
          }
        }
      }
      checkAssembly();
      draw();
    });
  }

  /* ================================================================
     ASSEMBLY CHECK
     ================================================================ */
  function checkAssembly() {
    if (!canAssemble(state.a, state.b, state.c, state.d)) {
      warnMsg.textContent = 'Invalid link lengths \u2014 mechanism cannot close. Adjust link lengths so the longest link is shorter than the sum of the other three.';
      warnMsg.style.display = 'block';
    } else {
      warnMsg.style.display = 'none';
    }
  }

  /* ================================================================
     FIRST-TIME HINT
     ================================================================ */
  function initHint() {
    var key = 'fbl_hint_dismissed';
    var dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      hintBanner.style.display = 'none';
      try { localStorage.setItem(key, '1'); } catch (e) {}
    }
    if (!localStorage.getItem(key)) {
      hintBanner.style.display = 'flex';
    } else {
      dismissed = true;
    }
    $('hint-dismiss').addEventListener('click', dismiss);
    // Auto-close once the user actually starts using the simulator.
    // Listen on canvas pointer, any slider input, mode-tab, preset, ground button, etc.
    var triggers = [
      cvs,
      $('mode-tabs'),
      $('inv-sub-tabs'),
      slGround, slCrank, slCoupler, slFollower, slRpm
    ];
    triggers.forEach(function (el) {
      if (!el) return;
      el.addEventListener('pointerdown', dismiss, { once: true });
      el.addEventListener('input', dismiss, { once: true });
    });
    // Preset / ground / branch buttons
    qsa('.preset-btn, .inv-ground-btn, #btn-branch, #canvas-play-btn, #canvas-step-back, #canvas-step-fwd').forEach(function (b) {
      b.addEventListener('click', dismiss, { once: true });
    });
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  modeTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var mode = pill.dataset.mode;
    if (!mode) return;
    state.mode = mode;
    modeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === pill); });
    showMode(mode);
  });

  function showMode(mode) {
    simPanel.style.display = 'none';
    catRow.style.display = 'none';
    itemSel.style.display = 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';
    warnMsg.style.display = 'none';
    var invPanel = $('inv-panel'); if (invPanel) invPanel.style.display = 'none';

    // Restore original sim values when leaving inversions mode
    if (mode !== 'inversions' && state._inInversions) {
      state.a = state.prevAnim.a; state.b = state.prevAnim.b; state.c = state.prevAnim.c; state.d = state.prevAnim.d;
      state.theta2 = state.prevAnim.theta2;
      syncSlidersFromState();
      state._inInversions = false;
    }

    if (mode === 'simulate') {
      simPanel.style.display = 'flex';
      checkAssembly();
      state.running = true;
    } else if (mode === 'explore') {
      catRow.style.display = 'flex';
      itemSel.style.display = 'block';
      renderConceptGrid();
      if (state.exploreItem) showConceptInfo(state.exploreItem);
      state.running = false;
    } else if (mode === 'inversions') {
      if (invPanel) invPanel.style.display = 'flex';
      // Save current sim values, switch to inversion chain
      if (!state._inInversions) {
        state.prevAnim = { a: state.a, b: state.b, c: state.c, d: state.d, theta2: state.theta2 };
        state._inInversions = true;
      }
      applyInversion(state.invGround);
      renderInvSubView();
      state.running = true;
    } else if (mode === 'practice') {
      practicePanel.style.display = 'block';
      practiceBar.style.display = 'flex';
      if (!state.pracCurrent) newPracticeProblem();
      state.running = false;
    } else if (mode === 'quiz') {
      if (state.quizQuestions.length === 0) startQuiz();
      else if (state.quizIdx >= state.quizQuestions.length) {
        quizResult.style.display = 'flex';
      } else {
        quizPanel.style.display = 'block';
        quizBar.style.display = 'flex';
      }
      state.running = false;
    }
    syncPlayBtn();
    drawStaticIfNeeded();
  }

  function drawStaticIfNeeded() {
    if (state.mode !== 'simulate') draw();
  }

  /* ================================================================
     DRAWING
     ================================================================ */
  var SCALE = 1.8;
  var OX = 250, OY = 300;

  // Auto-fit: recompute SCALE/OX/OY from the current geometry so extreme link
  // lengths (e.g. b = 250 mm) never draw off-canvas. Reachable extents:
  // crank pin A sweeps radius b about O2(0,0); follower pin B sweeps radius d
  // about O4(a,0). Coupler point P can extend past A/B by u/v offsets (× c).
  function updateViewTransform() {
    var a = state.a, b = state.b, c = state.c, d = state.d;
    var pPad = c * (Math.max(0, state.couplerU - 1, -state.couplerU) + Math.abs(state.couplerV));
    var xmin = Math.min(-b, a - d) - pPad;
    var xmax = Math.max(b, a + d) + pPad;
    var yext = Math.max(b, d) + pPad;
    // Margins: 40 px sides, 70 px top (title/legend), 70 px bottom (warning bar/buttons)
    var sx = (W - 80) / Math.max(xmax - xmin, 1);
    var sy = (H - 140) / Math.max(2 * yext, 1);
    SCALE = clamp(Math.min(sx, sy), 0.25, 1.8);
    OX = W / 2 - SCALE * (xmin + xmax) / 2;
    OY = H / 2 + 20; // ground pivots sit slightly below centre, like the original layout
  }

  function worldToCanvas(wx, wy) {
    return { x: OX + wx * SCALE, y: OY - wy * SCALE };
  }

  function canvasToWorld(cx, cy) {
    return { x: (cx - OX) / SCALE, y: (OY - cy) / SCALE };
  }

  function drawGround(o2, o4) {
    ctx.save();
    ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(o2.x, o2.y); ctx.lineTo(o4.x, o4.y); ctx.stroke();
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1;
    var hatchLen = 12;
    for (var i = -2; i <= 2; i++) {
      var hx = o2.x + i * 8;
      ctx.beginPath(); ctx.moveTo(hx, o2.y + 5); ctx.lineTo(hx - 6, o2.y + 5 + hatchLen); ctx.stroke();
    }
    for (var j = -2; j <= 2; j++) {
      var hx2 = o4.x + j * 8;
      ctx.beginPath(); ctx.moveTo(hx2, o4.y + 5); ctx.lineTo(hx2 - 6, o4.y + 5 + hatchLen); ctx.stroke();
    }
    ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(o2.x - 22, o2.y + 5); ctx.lineTo(o2.x + 22, o2.y + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o4.x - 22, o4.y + 5); ctx.lineTo(o4.x + 22, o4.y + 5); ctx.stroke();
    ctx.restore();
  }

  function drawLink(p1, p2, color, width) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width || 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.strokeStyle = color; ctx.globalAlpha = 0.15; ctx.lineWidth = (width || 4) + 8;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    ctx.restore();
  }

  function drawJoint(p, color, radius) {
    radius = radius || 7;
    ctx.save();
    ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, TAU);
    ctx.fillStyle = '#161b27'; ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, TAU);
    ctx.fillStyle = color; ctx.fill();
    ctx.restore();
  }

  function drawLabel(p, text, color, offX, offY) {
    ctx.save();
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, p.x + (offX || 0), p.y + (offY || -18));
    ctx.restore();
  }

  function drawAngleArc(center, startAngle, endAngle, radius, color, label) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, -startAngle, -endAngle, endAngle > startAngle);
    ctx.stroke();
    var midA = (startAngle + endAngle) / 2;
    var lx = center.x + (radius + 14) * Math.cos(midA);
    var ly = center.y - (radius + 14) * Math.sin(midA);
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, lx, ly);
    ctx.restore();
  }

  function drawCouplerTrace() {
    if (state.couplerTrace.length < 2) return;
    ctx.save();
    var len = state.couplerTrace.length;
    for (var i = 1; i < len; i++) {
      var pt = state.couplerTrace[i];
      var pp = state.couplerTrace[i - 1];
      // Back-compat: older entries may be canvas-pixel {x,y}. New entries are world {wx,wy}.
      var p1 = pt.wx !== undefined ? worldToCanvas(pt.wx, pt.wy) : pt;
      var p0 = pp.wx !== undefined ? worldToCanvas(pp.wx, pp.wy) : pp;
      var alpha = clamp(0.08 + 0.92 * (i / len), 0.08, 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawVelocityArrow(p, angle, magnitude, color) {
    if (Math.abs(magnitude) < 0.01) return;
    ctx.save();
    var scale = clamp(Math.abs(magnitude) * 3, 3, 140);
    var dir = magnitude >= 0 ? 1 : -1;
    var ex = p.x + scale * Math.cos(angle) * dir;
    var ey = p.y - scale * Math.sin(angle) * dir;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(ex, ey); ctx.stroke();
    var headLen = 8, headAngle = 0.4;
    var a1 = Math.atan2(p.y - ey, p.x - ex);
    ctx.beginPath();
    ctx.moveTo(ex, ey); ctx.lineTo(ex + headLen * Math.cos(a1 + headAngle), ey + headLen * Math.sin(a1 + headAngle));
    ctx.moveTo(ex, ey); ctx.lineTo(ex + headLen * Math.cos(a1 - headAngle), ey + headLen * Math.sin(a1 - headAngle));
    ctx.stroke();
    ctx.restore();
  }

  function drawRotationArrow(center, radius, color) {
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    var startA = -PI * 0.7, endA = -PI * 0.15;
    ctx.beginPath(); ctx.arc(center.x, center.y, radius, startA, endA); ctx.stroke();
    var ax = center.x + radius * Math.cos(endA);
    var ay = center.y + radius * Math.sin(endA);
    var tangent = endA + PI / 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(ax + 7 * Math.cos(tangent + 0.5), ay + 7 * Math.sin(tangent + 0.5));
    ctx.moveTo(ax, ay); ctx.lineTo(ax + 7 * Math.cos(tangent - 0.8), ay + 7 * Math.sin(tangent - 0.8));
    ctx.stroke();
    ctx.restore();
  }

  function drawTransmissionAngleIndicator(ptB, theta3, theta4, mu, poor) {
    var r = 25;
    var color = poor ? '#ff5555' : '#3ddc84';
    // Coupler direction at B points from A\u2192B = theta3. Follower direction at B points from O4\u2192B = theta4.
    // Reverse the coupler direction to point B\u2192A so both arrows leave joint B.
    var couplerOut = theta3 + PI;
    var followerOut = theta4;
    // Acute angle: pick whichever pairing gives the smaller arc (matches the numeric \u03bc readout).
    function norm(a) { while (a > PI) a -= TAU; while (a <= -PI) a += TAU; return a; }
    var d1 = Math.abs(norm(followerOut - couplerOut));
    var d2 = Math.abs(norm((followerOut + PI) - couplerOut));
    var fromA, toA;
    if (d1 <= d2) { fromA = couplerOut; toA = couplerOut + norm(followerOut - couplerOut); }
    else { fromA = couplerOut; toA = couplerOut + norm((followerOut + PI) - couplerOut); }
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
    ctx.beginPath();
    // Canvas y is flipped: arc with -fromA / -toA, anticlockwise = (toA > fromA)
    ctx.arc(ptB.x, ptB.y, r, -fromA, -toA, (toA > fromA));
    ctx.stroke();
    var muDeg = (mu * DEG).toFixed(1);
    var midA = (fromA + toA) / 2;
    var lx = ptB.x + (r + 18) * Math.cos(midA);
    var ly = ptB.y - (r + 18) * Math.sin(midA);
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText('\u03bc=' + muDeg + '\u00b0', lx, ly);
    ctx.restore();
  }

  function draw() {
    updateViewTransform();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    // Grid
    if (state.showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(42,48,80,0.3)'; ctx.lineWidth = 0.5;
      for (var gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.restore();
    }

    // Title
    ctx.save();
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#8b9dc3'; ctx.textAlign = 'left';
    ctx.fillText('Four-Bar Linkage Mechanism', 16, 24);
    ctx.restore();

    var a = state.a, b = state.b, c = state.c, d = state.d;

    if (!canAssemble(a, b, c, d)) {
      ctx.save();
      ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
      ctx.fillText('Cannot assemble \u2014 invalid link lengths', W / 2, H / 2);
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#8b9dc3';
      ctx.fillText('Longest link must be shorter than sum of other three', W / 2, H / 2 + 30);
      ctx.restore();
      return;
    }

    var result = solvePosition(a, b, c, d, state.theta2, state.assemblyBranch);
    if (!result) {
      ctx.save();
      ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
      ctx.fillText('Cannot assemble at this crank angle', W / 2, H / 2);
      ctx.restore();
      return;
    }

    var o2 = worldToCanvas(0, 0);
    var o4 = worldToCanvas(a, 0);
    var ptA = worldToCanvas(result.Ax, result.Ay);
    var ptB = worldToCanvas(result.Bx, result.By);

    // Coupler-point P in world coordinates: u along AB (0=A, 1=B), v perpendicular (× coupler length)
    var abx = result.Bx - result.Ax, aby = result.By - result.Ay;
    var couplerLen = Math.sqrt(abx * abx + aby * aby) || 1;
    var nx = -aby / couplerLen, ny = abx / couplerLen; // left-perpendicular
    var Pwx = result.Ax + state.couplerU * abx + state.couplerV * couplerLen * nx;
    var Pwy = result.Ay + state.couplerU * aby + state.couplerV * couplerLen * ny;
    var couplerP = worldToCanvas(Pwx, Pwy);

    // Coupler trace stored in world coords; projected at draw time so resize doesn't break it.
    if (state.showCouplerCurve && state.running) {
      state.couplerTrace.push({ wx: Pwx, wy: Pwy });
      if (state.couplerTrace.length > 720) state.couplerTrace = state.couplerTrace.slice(-720);
    }

    var classification = classifyMechanism(a, b, c, d);
    var mu = transmissionAngle(result.theta3, result.theta4);
    var muDeg = mu * DEG;
    var poorTransmission = muDeg < 40;
    var omega2 = state.crankDir * state.rpm * TAU / 60;
    var omega4 = followerOmega(omega2, b, d, state.theta2, result.theta3, result.theta4);

    if (state.showCouplerCurve) drawCouplerTrace();
    drawGround(o2, o4);
    drawLink(o2, ptA, '#00897b', 5);
    drawLink(ptA, ptB, '#f5c842', 4);
    drawLink(o4, ptB, '#b58bff', 5);
    if (state.showTransArc) drawTransmissionAngleIndicator(ptB, result.theta3, result.theta4, mu, poorTransmission);

    if (state.showVelocity) {
      var vScale = state.velScale * SCALE / 10;
      var vA_angle = state.theta2 + PI / 2;
      var vA_mag = omega2 * b * vScale;
      drawVelocityArrow(ptA, vA_angle, vA_mag, 'rgba(0,137,123,0.9)');
      var vB_angle = result.theta4 + PI / 2;
      var vB_mag = omega4 * d * vScale;
      drawVelocityArrow(ptB, vB_angle, vB_mag, 'rgba(181,139,255,0.9)');
      // Legend
      ctx.save();
      ctx.font = 'bold 11px "Courier New", monospace'; ctx.textAlign = 'left';
      // Legend top-left under title — keeps both bottom corners clear for the export & playback buttons.
      ctx.fillStyle = '#00897b'; ctx.fillText('— V_A (crank pin)', 16, 64);
      ctx.fillStyle = '#b58bff'; ctx.fillText('— V_B (follower pin)', 16, 80);
      ctx.restore();
    }

    drawJoint(o2, '#00897b', 8);
    drawJoint(o4, '#b58bff', 8);
    drawJoint(ptA, '#f5c842', 6);
    drawJoint(ptB, '#f5c842', 6);

    // Coupler tracing point P (only when off the AB segment OR when curve is shown)
    var pIsMidAB = (Math.abs(state.couplerU - 0.5) < 0.01 && Math.abs(state.couplerV) < 0.01);
    if (state.showPointP && (state.showCouplerCurve || !pIsMidAB)) {
      // Show triangle from A and B to P when P is offset from line AB
      if (Math.abs(state.couplerV) > 0.02) {
        ctx.save();
        ctx.strokeStyle = 'rgba(245,200,66,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(ptA.x, ptA.y); ctx.lineTo(couplerP.x, couplerP.y);
        ctx.lineTo(ptB.x, ptB.y); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
      }
      ctx.save();
      ctx.beginPath(); ctx.arc(couplerP.x, couplerP.y, 4.5, 0, TAU);
      ctx.fillStyle = '#ff5555'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();
      drawLabel(couplerP, 'P', '#ff5555', 0, -14);
    }

    if (state.showLabels) {
      drawLabel(o2, 'O\u2082', '#00897b', -20, 22);
      drawLabel(o4, 'O\u2084', '#b58bff', 20, 22);
      drawLabel(ptA, 'A', '#f5c842', 0, result.Ay >= 0 ? -18 : 22);
      drawLabel(ptB, 'B', '#f5c842', 0, result.By >= 0 ? -18 : 22);
    }
    drawRotationArrow(o2, 28, '#00897b');

    if (state.showThetaArc && state.theta2 > 0.05) {
      drawAngleArc(o2, 0, state.theta2 % TAU, 35, 'rgba(0,137,123,0.5)', '\u03b8\u2082');
    }

    // Link length labels
    if (state.showLinkVals) {
      ctx.save();
      ctx.font = '11px "Courier New", monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(136,153,170,0.7)';
      ctx.fillText('a=' + displayVal(a) + unitLabel(), (o2.x + o4.x) / 2, o2.y + 38);
      ctx.fillStyle = 'rgba(0,137,123,0.7)';
      ctx.fillText('b=' + displayVal(b) + unitLabel(), (o2.x + ptA.x) / 2 - 15, (o2.y + ptA.y) / 2);
      ctx.fillStyle = 'rgba(245,200,66,0.7)';
      ctx.fillText('c=' + displayVal(c) + unitLabel(), (ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2 - 12);
      ctx.fillStyle = 'rgba(181,139,255,0.7)';
      ctx.fillText('d=' + displayVal(d) + unitLabel(), (o4.x + ptB.x) / 2 + 15, (o4.y + ptB.y) / 2);
      ctx.restore();
    }

    // Mechanism Info — populated into the HTML overlay (#mech-info) instead of canvas-drawn.
    if (mipType) {
      mipType.textContent = classification.type;
      mipGrashof.textContent = classification.grashof ? 'Yes (s+l \u2264 p+q)' : 'No (s+l > p+q)';
      mipGrashof.className = 'mip-v ' + (classification.grashof ? 'ok' : 'no');
      mipSl.textContent = displayVal(+classification.sl.toFixed(2)) + unitLabel();
      mipPq.textContent = displayVal(+classification.pq.toFixed(2)) + unitLabel();
      mipTheta2.textContent = ((state.theta2 * DEG) % 360).toFixed(1) + '\u00b0';
      mipMu.textContent = muDeg.toFixed(1) + '\u00b0' + (poorTransmission ? ' (POOR)' : ' (OK)');
      mipMu.className = 'mip-v ' + (poorTransmission ? 'poor' : 'ok');
      mipOmega4.textContent = omega4.toFixed(2) + ' rad/s';
    }

    // Poor transmission warning bar
    var showWarningBar = poorTransmission && classification.type !== 'Triple-Rocker' && classification.type !== 'Parallelogram';
    if (showWarningBar) {
      ctx.save();
      // Reserve bottom-right (260px) for playback cluster and bottom-left (70px) for export icon.
      var _barX = 70, _barW = W - 260 - 70;
      ctx.fillStyle = 'rgba(255,85,85,0.12)'; ctx.fillRect(_barX, H - 30, _barW, 30);
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
      ctx.fillText('Warning: Poor transmission angle (\u03bc < 40\u00b0) \u2014 mechanism may jam', _barX + _barW / 2, H - 10);
      ctx.restore();
    }

    // Pause indicator
    if (!state.running && state.mode === 'simulate') {
      ctx.save();
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(245,200,66,0.8)'; ctx.textAlign = 'left';
      ctx.fillText('\u23F8 PAUSED \u2014 drag joint A or use \u23EE \u23ED buttons / arrow keys', 16, 44);
      ctx.restore();
    }

    // Readouts
    rType.textContent = classification.type;
    rGrashof.textContent = classification.grashof ? 'Yes' : 'No';
    rGrashof.style.color = classification.grashof ? '#3ddc84' : '#ff5555';
    rTheta2.textContent = ((state.theta2 * DEG) % 360).toFixed(1);
    rMu.textContent = muDeg.toFixed(1);
    rMu.style.color = poorTransmission ? '#ff5555' : '#00897b';
    rTheta3.textContent = ((result.theta3 * DEG + 360) % 360).toFixed(1);
    rOmega4.textContent = omega4.toFixed(2);

    updateEquationsPanel();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate(ts) {
    animId = requestAnimationFrame(animate);
    if (!state.running || (state.mode !== 'simulate' && state.mode !== 'inversions')) return;

    var dt = lastTime ? (ts - lastTime) / 1000 : 0;
    lastTime = ts;
    if (dt > 0.1) dt = 0.016;

    var omega2 = state.rpm * TAU / 60;
    var step = state.crankDir * omega2 * dt;
    var nextTheta = state.theta2 + step;
    var br = state.assemblyBranch;

    if (!solvePosition(state.a, state.b, state.c, state.d, nextTheta, br)) {
      // Reverse direction (oscillating non-Grashof input). Bisect back from boundary.
      state.crankDir *= -1;
      var probe = state.theta2;
      var trySteps = [0.25, 0.1, 0.04, 0.015];
      for (var ti = 0; ti < trySteps.length; ti++) {
        var t = state.theta2 + state.crankDir * trySteps[ti];
        if (solvePosition(state.a, state.b, state.c, state.d, t, br)) { probe = t; break; }
      }
      nextTheta = probe;
      if (nextTheta === state.theta2) { draw(); return; }
    }

    state.theta2 = nextTheta;

    // FIX: Wrap full rotation AND handle non-Grashof oscillating trace clearing
    if (state.theta2 >= TAU) {
      state.theta2 -= TAU;
      if (state.showCouplerCurve && state.couplerTrace.length > 300) {
        state.couplerTrace = state.couplerTrace.slice(-360);
      }
    } else if (state.theta2 < 0) {
      state.theta2 += TAU;
      if (state.showCouplerCurve && state.couplerTrace.length > 300) {
        state.couplerTrace = state.couplerTrace.slice(-360);
      }
    }

    draw();
  }

  animId = requestAnimationFrame(animate);

  /* ================================================================
     PRESETS — Event listeners
     ================================================================ */
  qsa('.preset-btn').forEach(function (btn) {
    btn.addEventListener('pointerdown', function () {
      applyPreset(btn.dataset.preset);
    });
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  catTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var cat = pill.dataset.cat;
    state.exploreCat = cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === pill); });
    state.exploreItem = null;
    itemInfo.style.display = 'none';
    renderConceptGrid();
  });

  function renderConceptGrid() {
    conceptGrid.innerHTML = '';
    CONCEPTS.forEach(function (c) {
      if (c.cat !== state.exploreCat) return;
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (state.exploreItem === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('pointerdown', function () {
        state.exploreItem = c.id;
        renderConceptGrid();
        showConceptInfo(c.id);
      });
      conceptGrid.appendChild(btn);
    });
    // Draw default diagram if no item selected
    if (state.mode === 'explore' && !state.exploreItem) {
      drawStaticMechanism(100, 40, 90, 70, PI / 4, 'Select a concept to explore');
    }
  }

  function showConceptInfo(id) {
    var c = CONCEPTS.filter(function (x) { return x.id === id; })[0];
    if (!c) { itemInfo.style.display = 'none'; return; }
    itemInfo.style.display = 'flex';

    var catName = c.cat === 'basics' ? 'Linkage Basics' : c.cat === 'kinematics' ? 'Kinematics' : 'Design';
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + catName + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>';
    if (c.unit !== '\u2014') html += '<span class="fb-unit">' + c.unit + '</span>';
    html += '</div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step">\u2192 <strong>' + s + '</strong></p>';
      });
      html += '</div>';
    }

    itemInfo.innerHTML = html;

    // Draw explore diagram
    if (state.mode === 'explore') drawExploreDiagram(id);
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  var ppPrompt   = $('pp-prompt');
  var ppInput    = $('pp-input');
  var ppUnit     = $('pp-unit');
  var ppCheck    = $('pp-check');
  var ppNext     = $('pp-next');
  var ppFeedback = $('pp-feedback');
  var ppSolution = $('pp-solution');
  var pbarScoreVal = $('pbar-score-val');

  function newPracticeProblem() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    state.pracCurrent = gen();
    state.pracAnswered = false;
    ppPrompt.textContent = state.pracCurrent.prompt;
    ppUnit.textContent = state.pracCurrent.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppInput.type = state.pracCurrent.type === 'text' ? 'text' : 'number';
    ppInput.placeholder = state.pracCurrent.type === 'text' ? 'Your answer' : '0';
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('pointerdown', function () {
    if (state.pracAnswered || !state.pracCurrent) return;
    var userVal = ppInput.value.trim();
    if (!userVal) return;
    state.pracAnswered = true;
    state.pracTotal++;
    ppInput.disabled = true;
    var correct = false;
    var expected = state.pracCurrent.answer;
    if (state.pracCurrent.type === 'text') {
      correct = userVal.toLowerCase().replace(/[^a-z0-9]/g, '') === String(expected).toLowerCase().replace(/[^a-z0-9]/g, '');
    } else {
      var num = parseFloat(userVal);
      if (!isNaN(num)) correct = Math.abs(num - expected) < Math.max(Math.abs(expected) * 0.05, 0.5);
    }
    if (correct) {
      state.pracScore++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + expected + (state.pracCurrent.unit ? ' ' + state.pracCurrent.unit : '');
      ppFeedback.className = 'feedback err';
    }
    pbarScoreVal.textContent = state.pracScore + ' / ' + state.pracTotal;
    ppNext.style.display = 'inline-block';
    var solHtml = '<h4>Solution</h4>';
    state.pracCurrent.steps.forEach(function (s) { solHtml += '<p class="sol-step">\u2192 <strong>' + s + '</strong></p>'; });
    ppSolution.innerHTML = solHtml;
    ppSolution.style.display = 'block';
  });

  ppNext.addEventListener('pointerdown', function () { newPracticeProblem(); });
  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (state.pracAnswered) newPracticeProblem();
      else ppCheck.click();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  var qbarNum = $('qbar-num');

  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    shuffle(pool);
    state.quizQuestions = pool.slice(0, 5);
    state.quizIdx = 0;
    state.quizScore = 0;
    state.quizAnswered = false;
    state.quizResults = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = 'block';
    quizBar.style.display = 'flex';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = state.quizQuestions[state.quizIdx];
    qbarNum.textContent = state.quizIdx + 1;
    state.quizAnswered = false;
    var html = '<p class="qp-prompt">Q' + (state.quizIdx + 1) + '. ' + q.q + '</p>';
    html += '<div class="answer-grid">';
    q.choices.forEach(function (ch, i) { html += '<button class="answer-btn" data-idx="' + i + '">' + ch + '</button>'; });
    html += '</div>';
    html += '<div style="margin-top:12px;display:flex;align-items:center;gap:12px;">';
    html += '<span class="quiz-feedback" id="quiz-fb"></span>';
    html += '<button class="btn btn-primary" id="quiz-next" style="display:none;">Next \u2192</button>';
    html += '</div>';
    quizPanel.innerHTML = html;

    quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
      btn.addEventListener('pointerdown', function () {
        if (state.quizAnswered) return;
        state.quizAnswered = true;
        var idx = +btn.dataset.idx;
        var correct = idx === q.correct;
        quizPanel.querySelectorAll('.answer-btn').forEach(function (b) {
          b.classList.add('locked');
          if (+b.dataset.idx === q.correct) b.classList.add('correct');
        });
        if (!correct) btn.classList.add('wrong');
        var fb = quizPanel.querySelector('#quiz-fb');
        if (correct) { state.quizScore++; fb.textContent = 'Correct!'; fb.className = 'quiz-feedback ok'; }
        else { fb.textContent = 'Incorrect. Answer: ' + q.choices[q.correct]; fb.className = 'quiz-feedback err'; }
        state.quizResults.push({ q: q.q, correct: correct, userChoice: q.choices[idx], correctChoice: q.choices[q.correct] });
        var nextBtn = quizPanel.querySelector('#quiz-next');
        nextBtn.style.display = 'inline-block';
        nextBtn.addEventListener('pointerdown', function () {
          state.quizIdx++;
          if (state.quizIdx >= state.quizQuestions.length) showQuizResult();
          else renderQuizQuestion();
        });
      });
    });
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'flex';
    var pct = Math.round(state.quizScore / state.quizQuestions.length * 100);
    var stars = '';
    for (var i = 0; i < 5; i++) stars += i < state.quizScore ? '\u2605' : '\u2606';
    var scoreClass = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';
    var verdict = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep studying!';
    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + scoreClass + '">' + pct + '%</span><p class="qr-verdict">' + verdict + '</p></div>';
    html += '</div>';
    html += '<div class="qr-rows">';
    state.quizResults.forEach(function (r, i) {
      var cls = r.correct ? 'ok' : 'err';
      html += '<div class="qr-row ' + cls + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + (r.correct ? r.correctChoice : r.userChoice) + '</strong>';
      if (!r.correct) html += ' \u2014 Correct: ' + r.correctChoice;
      html += '</span>';
      html += '<span class="qr-mark">' + (r.correct ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="action-row"><button class="btn btn-primary" id="quiz-retry">Retry Quiz</button></div>';
    quizResult.innerHTML = html;
    quizResult.querySelector('#quiz-retry').addEventListener('pointerdown', function () {
      startQuiz();
      quizResult.style.display = 'none';
    });
  }

  /* ================================================================
     EXPLORE MODE — CANVAS DIAGRAMS
     ================================================================ */
  function drawExploreDiagram(conceptId) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.strokeStyle = 'rgba(42,48,80,0.3)'; ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    ctx.restore();
    ctx.save();
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#8b9dc3'; ctx.textAlign = 'left';
    var concept = CONCEPTS.filter(function (c) { return c.id === conceptId; })[0];
    ctx.fillText(concept ? concept.name : 'Four-Bar Linkage', 16, 24);
    ctx.restore();

    if (conceptId === 'four-bar-mechanism' || conceptId === 'degrees-of-freedom') drawStaticMechanism(100, 40, 90, 70, PI / 4, 'Crank-Rocker (DOF = 1)');
    else if (conceptId === 'grashof-criterion') drawGrashofComparison();
    else if (conceptId === 'types-of-four-bar') drawTypeComparison();
    else if (conceptId === 'position-analysis' || conceptId === 'freudenstein-equation') drawPositionAnalysisDiagram();
    else if (conceptId === 'transmission-angle') drawTransmissionAngleDiagram();
    else if (conceptId === 'coupler-curves') drawCouplerCurveDiagram();
    else if (conceptId === 'velocity-analysis') drawVelocityDiagram();
    else if (conceptId === 'instant-centre') drawInstantCentreDiagram();
    else if (conceptId === 'dead-center') drawDeadCenterDiagram();
    else if (conceptId === 'toggle-positions') drawToggleDiagram();
    else if (conceptId === 'applications') drawApplicationsDiagram();
    else drawStaticMechanism(100, 40, 90, 70, PI / 3, concept ? concept.name : '');
  }

  function drawStaticMechanism(a, b, c, d, theta2, label) {
    var result = solvePosition(a, b, c, d, theta2);
    if (!result) return;
    var ox = 200, oy = 320, sc = 2.0;
    function wp(wx, wy) { return { x: ox + wx * sc, y: oy - wy * sc }; }
    var o2 = wp(0, 0), o4 = wp(a, 0), ptA = wp(result.Ax, result.Ay), ptB = wp(result.Bx, result.By);
    drawGround(o2, o4);
    drawLink(o2, ptA, '#00897b', 5); drawLink(ptA, ptB, '#f5c842', 4); drawLink(o4, ptB, '#b58bff', 5);
    drawJoint(o2, '#00897b', 8); drawJoint(o4, '#b58bff', 8); drawJoint(ptA, '#f5c842', 6); drawJoint(ptB, '#f5c842', 6);
    drawLabel(o2, 'O\u2082 (Ground)', '#00897b', 0, 35);
    drawLabel(o4, 'O\u2084 (Ground)', '#b58bff', 0, 35);
    drawLabel(ptA, 'A', '#f5c842', 0, -20); drawLabel(ptB, 'B', '#f5c842', 0, -20);
    ctx.save(); ctx.font = 'bold 12px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#00897b'; ctx.fillText('Crank (b=' + b + ')', (o2.x + ptA.x) / 2 - 35, (o2.y + ptA.y) / 2);
    ctx.fillStyle = '#f5c842'; ctx.fillText('Coupler (c=' + c + ')', (ptA.x + ptB.x) / 2, (ptA.y + ptB.y) / 2 - 15);
    ctx.fillStyle = '#b58bff'; ctx.fillText('Follower (d=' + d + ')', (o4.x + ptB.x) / 2 + 45, (o4.y + ptB.y) / 2);
    ctx.fillStyle = '#8899aa'; ctx.fillText('Ground (a=' + a + ')', (o2.x + o4.x) / 2, o2.y + 55);
    ctx.restore();
    if (label) {
      ctx.save(); ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.fillText(label, W / 2, 60); ctx.restore();
    }
  }

  function drawGrashofComparison() {
    ctx.save(); ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#3ddc84'; ctx.fillText('Grashof Mechanism', W * 0.25, 55);
    ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3';
    ctx.fillText('s + l \u2264 p + q \u2192 Full rotation possible', W * 0.25, 75);
    ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = '#ff5555';
    ctx.fillText('Non-Grashof Mechanism', W * 0.75, 55);
    ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3';
    ctx.fillText('s + l > p + q \u2192 No full rotation', W * 0.75, 75);
    ctx.restore();
    var r1 = solvePosition(100, 40, 90, 70, PI / 4);
    if (r1) {
      var ox1 = 100, oy1 = 310, sc1 = 1.5;
      function wp1(wx, wy) { return { x: ox1 + wx * sc1, y: oy1 - wy * sc1 }; }
      var la = wp1(0, 0), lb = wp1(100, 0), lc = wp1(r1.Ax, r1.Ay), ld = wp1(r1.Bx, r1.By);
      drawLink(la, lc, '#00897b', 4); drawLink(lc, ld, '#f5c842', 3);
      drawLink(lb, ld, '#b58bff', 4); drawLink(la, lb, '#8899aa', 2);
      drawJoint(la, '#00897b', 6); drawJoint(lb, '#b58bff', 6); drawJoint(lc, '#f5c842', 5); drawJoint(ld, '#f5c842', 5);
      ctx.save(); ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
      ctx.fillText('s=40 + l=100 = 140', W * 0.25, oy1 + 40);
      ctx.fillText('p=70 + q=90 = 160', W * 0.25, oy1 + 55);
      ctx.fillText('140 \u2264 160 \u2713', W * 0.25, oy1 + 70); ctx.restore();
    }
    var r2 = solvePosition(100, 80, 70, 60, PI / 4);
    if (r2) {
      var ox2 = 550, oy2 = 310, sc2 = 1.5;
      function wp2(wx, wy) { return { x: ox2 + wx * sc2, y: oy2 - wy * sc2 }; }
      var ra = wp2(0, 0), rb = wp2(100, 0), rc = wp2(r2.Ax, r2.Ay), rd = wp2(r2.Bx, r2.By);
      drawLink(ra, rc, '#00897b', 4); drawLink(rc, rd, '#f5c842', 3);
      drawLink(rb, rd, '#b58bff', 4); drawLink(ra, rb, '#8899aa', 2);
      drawJoint(ra, '#00897b', 6); drawJoint(rb, '#b58bff', 6); drawJoint(rc, '#f5c842', 5); drawJoint(rd, '#f5c842', 5);
      ctx.save(); ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
      ctx.fillText('s=60 + l=100 = 160', W * 0.75, oy2 + 40);
      ctx.fillText('p=70 + q=80 = 150', W * 0.75, oy2 + 55);
      ctx.fillText('160 > 150 \u2717', W * 0.75, oy2 + 70); ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(W / 2, 40); ctx.lineTo(W / 2, H - 30); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  function drawTypeComparison() {
    var configs = [
      { name: 'Crank-Rocker', a: 100, b: 40, c: 90, d: 70, note: 'Shortest = Crank', col: '#00897b' },
      { name: 'Double-Crank', a: 50, b: 100, c: 80, d: 70, note: 'Shortest = Ground', col: '#b58bff' },
      { name: 'Triple-Rocker', a: 100, b: 80, c: 70, d: 60, note: 'Non-Grashof', col: '#f5c842' },
      { name: 'Parallelogram', a: 100, b: 60, c: 100, d: 60, note: 'Opposite links equal', col: '#3ddc84' }
    ];
    configs.forEach(function (cfg, idx) {
      var col = idx % 2, row = Math.floor(idx / 2);
      var ox = 100 + col * 400, oy = 170 + row * 210, sc = 1.1;
      var res = solvePosition(cfg.a, cfg.b, cfg.c, cfg.d, PI / 4);
      if (!res) return;
      function wp(wx, wy) { return { x: ox + wx * sc, y: oy - wy * sc }; }
      var pa = wp(0, 0), pb = wp(cfg.a, 0), pc = wp(res.Ax, res.Ay), pd = wp(res.Bx, res.By);
      drawLink(pa, pc, '#00897b', 3); drawLink(pc, pd, '#f5c842', 2.5);
      drawLink(pb, pd, '#b58bff', 3); drawLink(pa, pb, '#8899aa', 2);
      drawJoint(pa, '#00897b', 4); drawJoint(pb, '#b58bff', 4); drawJoint(pc, '#f5c842', 3); drawJoint(pd, '#f5c842', 3);
      ctx.save(); ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = cfg.col; ctx.textAlign = 'center'; ctx.fillText(cfg.name, ox + cfg.a * sc / 2, oy - 100);
      ctx.font = '10px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3';
      ctx.fillText(cfg.note, ox + cfg.a * sc / 2, oy - 85);
      ctx.fillText('a=' + cfg.a + ' b=' + cfg.b + ' c=' + cfg.c + ' d=' + cfg.d, ox + cfg.a * sc / 2, oy + 30);
      ctx.restore();
    });
  }

  function drawPositionAnalysisDiagram() {
    var a = 100, b = 40, c = 90, d = 70, theta2 = PI / 3;
    var res = solvePosition(a, b, c, d, theta2);
    if (!res) return;
    var ox = 200, oy = 320, sc = 2.0;
    function wp(wx, wy) { return { x: ox + wx * sc, y: oy - wy * sc }; }
    var o2 = wp(0, 0), o4 = wp(a, 0), ptA = wp(res.Ax, res.Ay), ptB = wp(res.Bx, res.By);
    drawGround(o2, o4);
    drawLink(o2, ptA, '#00897b', 5); drawLink(ptA, ptB, '#f5c842', 4); drawLink(o4, ptB, '#b58bff', 5);
    drawJoint(o2, '#00897b', 8); drawJoint(o4, '#b58bff', 8); drawJoint(ptA, '#f5c842', 6); drawJoint(ptB, '#f5c842', 6);
    drawAngleArc(o2, 0, theta2, 40, '#00897b', '\u03b8\u2082');
    drawAngleArc(o4, 0, res.theta4, 35, '#b58bff', '\u03b8\u2084');
    ctx.save(); ctx.font = 'bold 12px "Courier New", monospace'; ctx.textAlign = 'center';
    ctx.fillStyle = '#dde3f0'; ctx.fillText('Loop-Closure Equation:', W / 2 + 150, 50);
    ctx.fillStyle = '#00897b'; ctx.fillText('b\u00b7e^(j\u03b82)', W / 2 + 150, 72);
    ctx.fillStyle = '#8b9dc3'; ctx.fillText('+', W / 2 + 215, 72);
    ctx.fillStyle = '#f5c842'; ctx.fillText('c\u00b7e^(j\u03b83)', W / 2 + 270, 72);
    ctx.fillStyle = '#8b9dc3'; ctx.fillText('=', W / 2 + 335, 72);
    ctx.fillStyle = '#8899aa'; ctx.fillText('a', W / 2 + 360, 72);
    ctx.fillStyle = '#8b9dc3'; ctx.fillText('+', W / 2 + 378, 72);
    ctx.fillStyle = '#b58bff'; ctx.fillText('d\u00b7e^(j\u03b84)', W / 2 + 430, 72);
    ctx.restore();
    drawLabel(o2, 'O\u2082', '#00897b', -20, 25); drawLabel(o4, 'O\u2084', '#b58bff', 20, 25);
    drawLabel(ptA, 'A', '#f5c842', 0, -20); drawLabel(ptB, 'B', '#f5c842', 0, -20);
  }

  function drawTransmissionAngleDiagram() {
    ctx.save(); ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#3ddc84'; ctx.fillText('Good Transmission (\u03bc \u2248 90\u00b0)', W * 0.25, 55);
    ctx.fillStyle = '#ff5555'; ctx.fillText('Poor Transmission (\u03bc < 40\u00b0)', W * 0.75, 55); ctx.restore();
    var a = 100, b = 40, c = 90, d = 70;
    var bestTheta = 0, bestMu = 0;
    for (var t = 0; t < TAU; t += 0.05) {
      var r = solvePosition(a, b, c, d, t);
      if (!r) continue;
      var m = transmissionAngle(r.theta3, r.theta4) * DEG;
      if (Math.abs(m - 90) < Math.abs(bestMu - 90)) { bestMu = m; bestTheta = t; }
    }
    var worstTheta = 0, worstMu = 90;
    for (var t2 = 0; t2 < TAU; t2 += 0.05) {
      var r2 = solvePosition(a, b, c, d, t2);
      if (!r2) continue;
      var m2 = transmissionAngle(r2.theta3, r2.theta4) * DEG;
      if (m2 < worstMu) { worstMu = m2; worstTheta = t2; }
    }
    var res1 = solvePosition(a, b, c, d, bestTheta);
    if (res1) {
      var ox1 = 80, oy1 = 310, sc1 = 1.5;
      function wg(wx, wy) { return { x: ox1 + wx * sc1, y: oy1 - wy * sc1 }; }
      var g1 = wg(0, 0), g2 = wg(a, 0), g3 = wg(res1.Ax, res1.Ay), g4 = wg(res1.Bx, res1.By);
      drawLink(g1, g3, '#00897b', 4); drawLink(g3, g4, '#f5c842', 3); drawLink(g2, g4, '#b58bff', 4); drawLink(g1, g2, '#8899aa', 2);
      drawJoint(g1, '#00897b', 5); drawJoint(g2, '#b58bff', 5); drawJoint(g3, '#f5c842', 4); drawJoint(g4, '#f5c842', 4);
      drawTransmissionAngleIndicator(g4, res1.theta3, res1.theta4, transmissionAngle(res1.theta3, res1.theta4), false);
    }
    var res2 = solvePosition(a, b, c, d, worstTheta);
    if (res2) {
      var ox2 = 530, oy2 = 310, sc2 = 1.5;
      function wb(wx, wy) { return { x: ox2 + wx * sc2, y: oy2 - wy * sc2 }; }
      var b1 = wb(0, 0), b2 = wb(a, 0), b3 = wb(res2.Ax, res2.Ay), b4 = wb(res2.Bx, res2.By);
      drawLink(b1, b3, '#00897b', 4); drawLink(b3, b4, '#f5c842', 3); drawLink(b2, b4, '#b58bff', 4); drawLink(b1, b2, '#8899aa', 2);
      drawJoint(b1, '#00897b', 5); drawJoint(b2, '#b58bff', 5); drawJoint(b3, '#f5c842', 4); drawJoint(b4, '#f5c842', 4);
      drawTransmissionAngleIndicator(b4, res2.theta3, res2.theta4, transmissionAngle(res2.theta3, res2.theta4), true);
    }
    ctx.save(); ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(W / 2, 40); ctx.lineTo(W / 2, H - 30); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    ctx.save(); ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3'; ctx.textAlign = 'center';
    ctx.fillText('Design Rule: Keep \u03bc_min > 40\u00b0 for acceptable force transmission', W / 2, H - 20); ctx.restore();
  }

  function drawCouplerCurveDiagram() {
    var a = 100, b = 40, c = 90, d = 70;
    var ox = 220, oy = 310, sc = 1.8;
    function wp(wx, wy) { return { x: ox + wx * sc, y: oy - wy * sc }; }
    var trace = [];
    for (var t = 0; t < TAU; t += 0.03) {
      var r = solvePosition(a, b, c, d, t);
      if (!r) continue;
      trace.push(wp((r.Ax + r.Bx) / 2, (r.Ay + r.By) / 2));
    }
    if (trace.length > 1) {
      ctx.save(); ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.moveTo(trace[0].x, trace[0].y);
      for (var i = 1; i < trace.length; i++) ctx.lineTo(trace[i].x, trace[i].y);
      ctx.closePath(); ctx.stroke();
      ctx.fillStyle = 'rgba(245, 200, 66, 0.08)'; ctx.fill(); ctx.restore();
    }
    var res = solvePosition(a, b, c, d, PI / 4);
    if (res) {
      var o2 = wp(0, 0), o4 = wp(a, 0), ptA = wp(res.Ax, res.Ay), ptB = wp(res.Bx, res.By);
      var mid = { x: (ptA.x + ptB.x) / 2, y: (ptA.y + ptB.y) / 2 };
      drawGround(o2, o4);
      drawLink(o2, ptA, '#00897b', 4); drawLink(ptA, ptB, '#f5c842', 3); drawLink(o4, ptB, '#b58bff', 4);
      drawJoint(o2, '#00897b', 6); drawJoint(o4, '#b58bff', 6); drawJoint(ptA, '#f5c842', 5); drawJoint(ptB, '#f5c842', 5);
      ctx.save(); ctx.beginPath(); ctx.arc(mid.x, mid.y, 5, 0, TAU);
      ctx.fillStyle = '#ff5555'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      drawLabel({ x: mid.x, y: mid.y }, 'P (traced point)', '#ff5555', 0, -16);
    }
    ctx.save(); ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Coupler Curve \u2014 Path of midpoint P', W / 2, 50);
    ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3';
    ctx.fillText('Different coupler points produce different curves', W / 2, H - 20); ctx.restore();
  }

  function drawVelocityDiagram() {
    var a = 100, b = 40, c = 90, d = 70, theta2 = PI / 3;
    var res = solvePosition(a, b, c, d, theta2);
    if (!res) return;
    var ox = 200, oy = 300, sc = 2.0;
    function wp(wx, wy) { return { x: ox + wx * sc, y: oy - wy * sc }; }
    var o2 = wp(0, 0), o4 = wp(a, 0), ptA = wp(res.Ax, res.Ay), ptB = wp(res.Bx, res.By);
    drawGround(o2, o4);
    drawLink(o2, ptA, '#00897b', 5); drawLink(ptA, ptB, '#f5c842', 4); drawLink(o4, ptB, '#b58bff', 5);
    drawJoint(o2, '#00897b', 7); drawJoint(o4, '#b58bff', 7); drawJoint(ptA, '#f5c842', 5); drawJoint(ptB, '#f5c842', 5);
    var omega2 = 10;
    var omega4v = followerOmega(omega2, b, d, theta2, res.theta3, res.theta4);
    drawVelocityArrow(ptA, theta2 + PI / 2, omega2 * b * sc / 25, '#00897b');
    drawVelocityArrow(ptB, res.theta4 + PI / 2, omega4v * d * sc / 25, '#b58bff');
    drawLabel(o2, 'O\u2082', '#00897b', -20, 25); drawLabel(o4, 'O\u2084', '#b58bff', 20, 25);
    drawLabel(ptA, 'V_A', '#00897b', -30, -30); drawLabel(ptB, 'V_B', '#b58bff', 30, -30);
    ctx.save(); ctx.font = 'bold 13px "Courier New", monospace'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('\u03c94 = \u03c92 \u00b7 b\u00b7sin(\u03b82\u2212\u03b83) / (d\u00b7sin(\u03b84\u2212\u03b83))', W / 2 + 150, H - 60);
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#00897b'; ctx.fillText('\u03c92 = ' + omega2 + ' rad/s', W / 2 + 150, H - 40);
    ctx.fillStyle = '#b58bff'; ctx.fillText('\u03c94 = ' + omega4v.toFixed(2) + ' rad/s', W / 2 + 150, H - 20); ctx.restore();
  }

  function drawInstantCentreDiagram() {
    var a = 100, b = 40, c = 90, d = 70, theta2 = PI / 3;
    var res = solvePosition(a, b, c, d, theta2, 1);
    if (!res) return;
    var ox = 240, oy = 350, sc = 1.7;
    function wp(wx, wy) { return { x: ox + wx * sc, y: oy - wy * sc }; }
    var o2 = wp(0, 0), o4 = wp(a, 0), ptA = wp(res.Ax, res.Ay), ptB = wp(res.Bx, res.By);
    // I13 = intersection of O2A extended and O4B extended (in world coords).
    function intersect(p1, p2, p3, p4) {
      var x1=p1.x,y1=p1.y,x2=p2.x,y2=p2.y,x3=p3.x,y3=p3.y,x4=p4.x,y4=p4.y;
      var den = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
      if (Math.abs(den) < 1e-6) return null;
      var t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / den;
      return { x: x1 + t*(x2-x1), y: y1 + t*(y2-y1) };
    }
    var ic = intersect({x:0,y:0}, {x:res.Ax,y:res.Ay}, {x:a,y:0}, {x:res.Bx,y:res.By});
    drawGround(o2, o4);
    drawLink(o2, ptA, '#00897b', 4); drawLink(ptA, ptB, '#f5c842', 3); drawLink(o4, ptB, '#b58bff', 4);
    drawJoint(o2, '#00897b', 7); drawJoint(o4, '#b58bff', 7); drawJoint(ptA, '#f5c842', 5); drawJoint(ptB, '#f5c842', 5);
    if (ic) {
      var icPt = wp(ic.x, ic.y);
      ctx.save(); ctx.strokeStyle = 'rgba(255,85,85,0.55)'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(o2.x, o2.y); ctx.lineTo(icPt.x, icPt.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(o4.x, o4.y); ctx.lineTo(icPt.x, icPt.y); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(icPt.x, icPt.y, 6, 0, TAU);
      ctx.fillStyle = '#ff5555'; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
      drawLabel(icPt, 'I₁₃', '#ff5555', 0, -16);
    }
    drawLabel(o2, 'O₂', '#00897b', -20, 25); drawLabel(o4, 'O₄', '#b58bff', 20, 25);
    drawLabel(ptA, 'A', '#f5c842', 0, -18); drawLabel(ptB, 'B', '#f5c842', 0, -18);
    ctx.save(); ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Aronhold-Kennedy: I₁₃ at intersection of O₂A and O₄B (extended)', W / 2, 50);
    ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3';
    ctx.fillText('ω₄ / ω₂ = O₂I₁₃ / O₄I₁₃', W / 2, H - 20); ctx.restore();
  }

  function drawDeadCenterDiagram() {
    var a = 100, b = 40, c = 90, d = 70;
    ctx.save(); ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5555'; ctx.fillText('Extended Dead-Center (\u03b82 = 0\u00b0)', W * 0.25, 55);
    ctx.fillStyle = '#f5c842'; ctx.fillText('Folded Dead-Center (\u03b82 = 180\u00b0)', W * 0.75, 55); ctx.restore();
    var r1 = solvePosition(a, b, c, d, 0);
    if (r1) {
      var ox1 = 80, oy1 = 290, sc1 = 1.4;
      function we(wx, wy) { return { x: ox1 + wx * sc1, y: oy1 - wy * sc1 }; }
      var e1 = we(0, 0), e2 = we(a, 0), e3 = we(r1.Ax, r1.Ay), e4 = we(r1.Bx, r1.By);
      drawLink(e1, e2, '#8899aa', 2); drawLink(e1, e3, '#00897b', 4); drawLink(e3, e4, '#f5c842', 3); drawLink(e2, e4, '#b58bff', 4);
      drawJoint(e1, '#00897b', 6); drawJoint(e2, '#b58bff', 6); drawJoint(e3, '#f5c842', 5); drawJoint(e4, '#f5c842', 5);
      ctx.save(); ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3'; ctx.textAlign = 'center';
      ctx.fillText('Crank extended along ground', W * 0.25, oy1 + 50);
      ctx.fillText('Follower at extreme position', W * 0.25, oy1 + 65); ctx.restore();
    }
    var r2 = solvePosition(a, b, c, d, PI);
    if (r2) {
      var ox2 = 530, oy2 = 290, sc2 = 1.4;
      function wf(wx, wy) { return { x: ox2 + wx * sc2, y: oy2 - wy * sc2 }; }
      var f1 = wf(0, 0), f2 = wf(a, 0), f3 = wf(r2.Ax, r2.Ay), f4 = wf(r2.Bx, r2.By);
      drawLink(f1, f2, '#8899aa', 2); drawLink(f1, f3, '#00897b', 4); drawLink(f3, f4, '#f5c842', 3); drawLink(f2, f4, '#b58bff', 4);
      drawJoint(f1, '#00897b', 6); drawJoint(f2, '#b58bff', 6); drawJoint(f3, '#f5c842', 5); drawJoint(f4, '#f5c842', 5);
      ctx.save(); ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3'; ctx.textAlign = 'center';
      ctx.fillText('Crank folded back', W * 0.75, oy2 + 50);
      ctx.fillText('Follower at other extreme', W * 0.75, oy2 + 65); ctx.restore();
    }
    ctx.save(); ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(W / 2, 40); ctx.lineTo(W / 2, H - 30); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
  }

  function drawToggleDiagram() {
    ctx.save(); ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Toggle Position \u2014 Coupler & Follower Collinear', W / 2, 55);
    ctx.font = '12px "Courier New", monospace'; ctx.fillStyle = '#8b9dc3';
    ctx.fillText('Mechanical advantage \u2192 \u221e (infinite)', W / 2, 80);
    ctx.fillText('Used in clamps, presses, stone crushers', W / 2, 98); ctx.restore();
    var a = 100, b = 40, c = 90, d = 70;
    var bestTheta = 0, minDiff = 999;
    for (var t = 0; t < TAU; t += 0.02) {
      var r = solvePosition(a, b, c, d, t);
      if (!r) continue;
      var diff = Math.abs(Math.sin(r.theta4 - r.theta3));
      if (diff < minDiff) { minDiff = diff; bestTheta = t; }
    }
    var res = solvePosition(a, b, c, d, bestTheta);
    if (res) {
      var ox = 220, oy = 340, sc = 2.2;
      function wt(wx, wy) { return { x: ox + wx * sc, y: oy - wy * sc }; }
      var t1 = wt(0, 0), t2 = wt(a, 0), t3 = wt(res.Ax, res.Ay), t4 = wt(res.Bx, res.By);
      drawGround(t1, t2);
      drawLink(t1, t3, '#00897b', 5); drawLink(t3, t4, '#f5c842', 4); drawLink(t2, t4, '#b58bff', 5);
      drawJoint(t1, '#00897b', 7); drawJoint(t2, '#b58bff', 7); drawJoint(t3, '#f5c842', 5); drawJoint(t4, '#f5c842', 5);
      ctx.save(); ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
      var ext = 50, dirX = t4.x - t3.x, dirY = t4.y - t3.y;
      var len = Math.sqrt(dirX * dirX + dirY * dirY);
      if (len > 0) {
        dirX /= len; dirY /= len;
        ctx.beginPath(); ctx.moveTo(t3.x - dirX * ext, t3.y - dirY * ext);
        ctx.lineTo(t4.x + dirX * ext, t4.y + dirY * ext); ctx.stroke();
      }
      ctx.setLineDash([]); ctx.restore();
      drawLabel(t1, 'O\u2082', '#00897b', -20, 25); drawLabel(t2, 'O\u2084', '#b58bff', 20, 25);
      drawLabel(t3, 'A', '#f5c842', 0, -20); drawLabel(t4, 'B', '#f5c842', 15, -20);
    }
  }

  function drawApplicationsDiagram() {
    ctx.save(); ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#00897b'; ctx.textAlign = 'center';
    ctx.fillText('Real-World Four-Bar Linkage Applications', W / 2, 45); ctx.restore();
    var apps = [
      { name: 'Windshield Wiper', type: 'Crank-Rocker', desc: 'Motor rotation \u2192 wiper oscillation', x: 120, y: 130, col: '#00897b' },
      { name: 'Oil Pump Jack', type: 'Crank-Rocker', desc: 'Engine rotation \u2192 pump up/down', x: 560, y: 130, col: '#b58bff' },
      { name: 'Sewing Machine', type: 'Crank-Rocker', desc: 'Motor \u2192 needle bar reciprocation', x: 120, y: 310, col: '#f5c842' },
      { name: 'Landing Gear', type: 'Four-Bar Variant', desc: 'Hydraulic \u2192 gear fold/extend', x: 560, y: 310, col: '#3ddc84' }
    ];
    apps.forEach(function (app) {
      ctx.save(); ctx.fillStyle = 'rgba(22,27,39,0.9)'; ctx.strokeStyle = app.col; ctx.lineWidth = 2;
      roundRect(ctx, app.x - 100, app.y - 30, 260, 120, 12); ctx.fill(); ctx.stroke();
      var miniA = 40, miniB = 16, miniC = 36, miniD = 28;
      var mRes = solvePosition(miniA, miniB, miniC, miniD, PI / 3);
      if (mRes) {
        var mox = app.x - 60, moy = app.y + 55, msc = 1.3;
        function mp(wx, wy) { return { x: mox + wx * msc, y: moy - wy * msc }; }
        var m1 = mp(0, 0), m2 = mp(miniA, 0), m3 = mp(mRes.Ax, mRes.Ay), m4 = mp(mRes.Bx, mRes.By);
        ctx.strokeStyle = app.col; ctx.lineWidth = 2; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m3.x, m3.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(m3.x, m3.y); ctx.lineTo(m4.x, m4.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(m2.x, m2.y); ctx.lineTo(m4.x, m4.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(m1.x, m1.y); ctx.lineTo(m2.x, m2.y); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = app.col; ctx.textAlign = 'left'; ctx.fillText(app.name, app.x - 10, app.y - 5);
      ctx.font = '11px "Courier New", monospace'; ctx.fillStyle = '#dde3f0'; ctx.fillText(app.type, app.x - 10, app.y + 14);
      ctx.font = '10px "Segoe UI", system-ui, sans-serif'; ctx.fillStyle = '#8b9dc3'; ctx.fillText(app.desc, app.x - 10, app.y + 32);
      ctx.restore();
    });
  }

  /* ================================================================
     POINTER / TOUCH — Canvas interaction
     ================================================================ */
  function getCanvasPos(e) {
    var rect = cvs.getBoundingClientRect();
    var scaleX = W / rect.width;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleX };
  }

  /* ── Play / Pause button (bottom-left of canvas) ────────────── */
  var playBtn = $('canvas-play-btn');

  function syncPlayBtn() {
    if (state.running) {
      playBtn.textContent = '\u23F8';  // ⏸
      playBtn.title = 'Pause';
      playBtn.classList.remove('is-paused');
    } else {
      playBtn.textContent = '\u25B6';  // ▶
      playBtn.title = 'Play';
      playBtn.classList.add('is-paused');
    }
  }

  function togglePlay() {
    state.running = !state.running;
    if (state.running) lastTime = 0;
    syncPlayBtn();
  }

  playBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    togglePlay();
  });

  // Step forward / backward buttons (yellow cluster)
  function nudgeCrank(deltaRad) {
    if (state.running) { state.running = false; syncPlayBtn(); }
    var t = state.theta2 + deltaRad;
    var br = state.assemblyBranch;
    if (solvePosition(state.a, state.b, state.c, state.d, t, br)) {
      state.theta2 = t;
      if (state.theta2 >= TAU) state.theta2 -= TAU;
      if (state.theta2 < 0) state.theta2 += TAU;
      draw();
    } else {
      // Bisect: find largest reachable sub-step in same direction
      var sign = deltaRad >= 0 ? 1 : -1;
      var mag = Math.abs(deltaRad);
      for (var i = 0; i < 6; i++) {
        mag *= 0.5;
        var t2 = state.theta2 + sign * mag;
        if (solvePosition(state.a, state.b, state.c, state.d, t2, br)) {
          state.theta2 = t2; draw(); return;
        }
      }
    }
  }
  var stepBack = $('canvas-step-back'), stepFwd = $('canvas-step-fwd');
  function stepDelta(e) { return e && e.shiftKey ? 0.005 : 0.05; }
  if (stepBack) stepBack.addEventListener('click', function (e) { e.stopPropagation(); nudgeCrank(-stepDelta(e)); });
  if (stepFwd)  stepFwd .addEventListener('click', function (e) { e.stopPropagation(); nudgeCrank( stepDelta(e)); });
  // Long-press auto-repeat
  function holdRepeat(btn, dirSign) {
    if (!btn) return;
    var timer = null, hold = null;
    function start(e) {
      e.stopPropagation();
      nudgeCrank(dirSign * stepDelta(e));
      hold = setTimeout(function () {
        timer = setInterval(function () { nudgeCrank(dirSign * 0.04); }, 60);
      }, 350);
    }
    function stop() { if (hold) { clearTimeout(hold); hold = null; } if (timer) { clearInterval(timer); timer = null; } }
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, stop); });
  }
  holdRepeat(stepBack, -1);
  holdRepeat(stepFwd,  +1);

  // Drag crank joint A (when paused, user can drag to set angle)
  // When paused: touch/click ANYWHERE on canvas and drag to rotate crank.
  // The crank angle follows the pointer direction relative to ground pivot O2.
  cvs.addEventListener('pointerdown', function (e) {
    if (e.button === 2) return; // right-click handled separately
    e.preventDefault();
    if (state.mode !== 'simulate') return;

    // Auto-pause on click so dragging the crank works mid-animation.
    if (state.running) {
      state.running = false;
      syncPlayBtn();
    }

    if (!state.running) {
      state.draggingCrank = true;
      cvs.setPointerCapture(e.pointerId);  // keeps receiving events even outside canvas (iPad)
      // Immediately set angle to pointer position
      var pos = getCanvasPos(e);
      var world = canvasToWorld(pos.x, pos.y);
      var newTheta = Math.atan2(world.y, world.x);
      if (newTheta < 0) newTheta += TAU;
      if (solvePosition(state.a, state.b, state.c, state.d, newTheta, state.assemblyBranch)) {
        state.theta2 = newTheta;
        state.couplerTrace = [];
        draw();
      }
    }
  });

  cvs.addEventListener('pointermove', function (e) {
    if (!state.draggingCrank) return;
    e.preventDefault();
    var pos = getCanvasPos(e);
    var world = canvasToWorld(pos.x, pos.y);
    var newTheta = Math.atan2(world.y, world.x);
    if (newTheta < 0) newTheta += TAU;
    if (solvePosition(state.a, state.b, state.c, state.d, newTheta, state.assemblyBranch)) {
      state.theta2 = newTheta;
      state.couplerTrace = [];
      draw();
    }
  });

  cvs.addEventListener('pointerup', function (e) {
    if (state.draggingCrank) {
      state.draggingCrank = false;
      pushUndo();
    }
  });

  cvs.addEventListener('pointerleave', function () {
    if (state.draggingCrank) {
      state.draggingCrank = false;
      pushUndo();
    }
  });

  /* ================================================================
     RIGHT-CLICK CONTEXT MENU
     ================================================================ */
  cvs.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    ctxMenu.style.display = 'block';
    // Reposition near edges so menu stays visible.
    var menuW = 180, menuH = 130;
    var x = e.clientX, y = e.clientY;
    var maxX = window.innerWidth - menuW - 8;
    var maxY = window.innerHeight - menuH - 8;
    if (x > maxX) x = maxX;
    if (y > maxY) y = maxY;
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top = y + 'px';
  });

  document.addEventListener('pointerdown', function (e) {
    if (!ctxMenu.contains(e.target)) ctxMenu.style.display = 'none';
  });

  $('ctx-export-png').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    exportPNG();
  });

  $('ctx-reset-view').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    pushUndo();
    applyPreset('crank-rocker');
  });

  $('ctx-copy-values').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    var classification = classifyMechanism(state.a, state.b, state.c, state.d);
    var result = solvePosition(state.a, state.b, state.c, state.d, state.theta2);
    var muStr = result ? (transmissionAngle(result.theta3, result.theta4) * DEG).toFixed(1) + '\u00b0' : 'N/A';
    var text = 'Four-Bar Linkage Values\n';
    text += 'Ground (a): ' + displayVal(state.a) + unitLabel() + '\n';
    text += 'Crank (b): ' + displayVal(state.b) + unitLabel() + '\n';
    text += 'Coupler (c): ' + displayVal(state.c) + unitLabel() + '\n';
    text += 'Follower (d): ' + displayVal(state.d) + unitLabel() + '\n';
    text += 'Type: ' + classification.type + '\n';
    text += 'Grashof: ' + (classification.grashof ? 'Yes' : 'No') + '\n';
    text += 'Crank Angle: ' + ((state.theta2 * DEG) % 360).toFixed(1) + '\u00b0\n';
    text += 'Transmission Angle: ' + muStr + '\n';
    text += 'RPM: ' + state.rpm;
    try { navigator.clipboard.writeText(text); } catch (err) {}
  });

  /* ================================================================
     EXPORT PNG
     ================================================================ */
  $('canvas-export-btn').addEventListener('click', function () { exportPNG(); });

  function exportPNG() {
    // Draw current frame then add watermark
    var wasPaused = !state.running;
    if (!wasPaused) { state.running = false; }
    draw();

    // Add watermark
    ctx.save();
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(139,157,195,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText('NHIT VisualLab', W - 12, H - 8);
    ctx.restore();

    // Export
    var link = document.createElement('a');
    link.download = 'four-bar-linkage.png';
    link.href = cvs.toDataURL('image/png');
    link.click();

    // Redraw without watermark
    draw();
    if (!wasPaused) { state.running = true; lastTime = 0; }
  }

  /* ================================================================
     WINDOW RESIZE
     ================================================================ */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      DPR = Math.max(window.devicePixelRatio || 1, 1);
      initCanvas();
      draw();
    }, 150);
  });

  /* ================================================================
     KEYBOARD
     ================================================================ */
  document.addEventListener('keydown', function (e) {
    // Undo/Redo — works in all modes
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      doUndo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      doRedo();
      return;
    }

    if (state.mode !== 'simulate') return;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (state.running) { state.running = false; syncPlayBtn(); }
      var delta = (e.key === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 0.005 : 0.05);
      var t = state.theta2 + delta;
      if (solvePosition(state.a, state.b, state.c, state.d, t, state.assemblyBranch)) {
        state.theta2 = t;
        if (state.theta2 >= TAU) state.theta2 -= TAU;
        if (state.theta2 < 0) state.theta2 += TAU;
        draw();
      }
    }
  });

  /* ================================================================
     INVERSIONS & SYNTHESIS — UI WIRING
     ================================================================ */
  function applyInversion(k) {
    state.invGround = k;
    var info = inversionInfo(state.invChain, k);
    state.a = info.map.a; state.b = info.map.b; state.c = info.map.c; state.d = info.map.d;
    state.assemblyBranch = 1;
    state.crankDir = 1;
    // Find a reachable starting θ₂ (some inversions can't assemble at 0°).
    var startT = 0;
    for (var t = 0; t < TAU; t += 0.05) {
      if (solvePosition(state.a, state.b, state.c, state.d, t, 1)) { startT = t; break; }
    }
    state.theta2 = startT;
    state.couplerTrace = [];
    syncSlidersFromState();
    // Reflect in the ground buttons
    qsa('.inv-ground-btn').forEach(function (btn) {
      btn.classList.toggle('active', +btn.dataset.ground === k);
    });
    renderInvTable();
    draw();
  }

  function renderInvTable() {
    var tbody = $('inv-table-body');
    if (!tbody) return;
    var rows = '';
    for (var k = 1; k <= 4; k++) {
      var info = inversionInfo(state.invChain, k);
      var active = (k === state.invGround);
      rows += '<tr class="' + (active ? 'active-row' : '') + '">'
            + '<td>' + k + '</td>'
            + '<td>L' + k + '</td>'
            + '<td>' + state.invChain[k - 1] + ' mm</td>'
            + '<td>' + info.posLabel + '</td>'
            + '<td>' + info.cls.type + '</td>'
            + '<td>' + info.rotLinks + '</td>'
            + '</tr>';
    }
    tbody.innerHTML = rows;
  }

  function renderInvSubView() {
    var subs = ['grounds', 'equations', 'synthesis'];
    subs.forEach(function (s) {
      var el = $('inv-' + s);
      if (el) el.style.display = (s === state.invSub) ? 'block' : 'none';
    });
    qsa('#inv-sub-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.inv === state.invSub);
    });
    if (state.invSub === 'grounds') renderInvTable();
    if (state.invSub === 'synthesis') {
      // Reset synth tab visibility
      ['function', 'path', 'motion'].forEach(function (s) {
        var el = $('synth-' + s);
        if (el) el.style.display = (s === state.synthSub) ? 'block' : 'none';
      });
      qsa('#synth-tabs .pill').forEach(function (p) {
        p.classList.toggle('active', p.dataset.synth === state.synthSub);
      });
      if (state.synthSub === 'path') drawCognateCurves();
    }
  }

  // Live equations panel — updated each frame from draw() via updateEquationsPanel()
  function updateEquationsPanel() {
    if (state.mode !== 'inversions' || state.invSub !== 'equations') return;
    var a = state.a, b = state.b, c = state.c, d = state.d;
    var t2 = state.theta2;
    var res = solvePosition(a, b, c, d, t2, state.assemblyBranch);
    if (!res) return;
    var t3 = res.theta3, t4 = res.theta4;
    var omega2 = state.crankDir * state.rpm * TAU / 60;
    var omega3den = c * Math.sin(t3 - t4); var omega3 = (Math.abs(omega3den) > 1e-6) ? omega2 * b * Math.sin(t4 - t2) / omega3den : NaN;
    var omega4 = followerOmega(omega2, b, d, t2, t3, t4);
    // Acceleration (α₂ = 0): α3, α4 from differentiating the loop equation twice.
    // Real/imag parts of −bω2²e^(jθ2) + (jα3−ω3²)c·e^(jθ3) − (jα4−ω4²)d·e^(jθ4) = 0 give:
    // [c sin t3, -d sin t4] [α3]   [−(b ω2² cos t2 + c ω3² cos t3 − d ω4² cos t4)]
    // [-c cos t3, d cos t4] [α4] = [−(b ω2² sin t2 + c ω3² sin t3 − d ω4² sin t4)]
    // (verified against finite-difference of θ3(θ2), θ4(θ2))
    var A11 = c * Math.sin(t3), A12 = -d * Math.sin(t4);
    var A21 = -c * Math.cos(t3), A22 = d * Math.cos(t4);
    var R1 = -(b * omega2 * omega2 * Math.cos(t2) + c * (omega3 || 0) * (omega3 || 0) * Math.cos(t3) - d * omega4 * omega4 * Math.cos(t4));
    var R2 = -(b * omega2 * omega2 * Math.sin(t2) + c * (omega3 || 0) * (omega3 || 0) * Math.sin(t3) - d * omega4 * omega4 * Math.sin(t4));
    var detA = A11 * A22 - A12 * A21;
    var alpha3 = NaN, alpha4 = NaN;
    if (Math.abs(detA) > 1e-6) {
      alpha3 = (R1 * A22 - R2 * A12) / detA;
      alpha4 = (A11 * R2 - A21 * R1) / detA;
    }
    // Freudenstein form for our loop a + d·e^(jθ₄) = b·e^(jθ₂) + c·e^(jθ₃) (eliminating θ₃):
    //   K₁·cos θ₄ − K₂·cos θ₂ + K₃ = cos(θ₂ − θ₄)
    //   K₁ = a/b,  K₂ = a/d,  K₃ = (a² + b² + d² − c²) / (2bd)
    var K1 = a / b, K2 = a / d, K3 = (a * a + b * b + d * d - c * c) / (2 * b * d);
    var mu = transmissionAngle(t3, t4) * DEG;
    var MA = (Math.abs(omega4) > 1e-6) ? (omega2 / omega4) : Infinity;

    function fmt(x, p) { if (!isFinite(x)) return '∞'; if (isNaN(x)) return 'NaN'; return x.toFixed(p); }
    function deg(x) { return ((x * DEG) % 360).toFixed(2) + '°'; }

    var elLoop = $('eq-loop-sub');
    if (elLoop) elLoop.innerHTML = '<span class="eq-num">' + a.toFixed(1) + ' + ' + b.toFixed(1) + '·e^(j ' + deg(t2) + ') = ' + c.toFixed(1) + '·e^(j ' + deg(t3) + ') + ' + d.toFixed(1) + '·e^(j ' + deg(t4) + ')</span>';

    var elFr = $('eq-freud-sub');
    if (elFr) elFr.innerHTML = 'K₁ = a/b = ' + a + '/' + b + ' = <span class="eq-num">' + fmt(K1, 4) + '</span>'
                              + '<br>K₂ = a/d = ' + a + '/' + d + ' = <span class="eq-num">' + fmt(K2, 4) + '</span>'
                              + '<br>K₃ = (' + (a*a) + ' + ' + (b*b) + ' + ' + (d*d) + ' − ' + (c*c) + ') / ' + (2*b*d) + ' = <span class="eq-num">' + fmt(K3, 4) + '</span>';

    var lhs = K1 * Math.cos(t4) - K2 * Math.cos(t2) + K3;
    var rhs = Math.cos(t2 - t4);
    var elPos = $('eq-pos-sub');
    if (elPos) elPos.innerHTML = 'LHS = ' + fmt(K1, 3) + '·cos(' + deg(t4) + ') − ' + fmt(K2, 3) + '·cos(' + deg(t2) + ') + ' + fmt(K3, 3) + ' = <span class="eq-num">' + fmt(lhs, 5) + '</span>'
                                + '<br>RHS = cos(' + deg(t2 - t4) + ') = <span class="eq-num">' + fmt(rhs, 5) + '</span>'
                                + '<br>Residual = <span class="eq-num">' + fmt(lhs - rhs, 6) + '</span> ✓';

    var elVel = $('eq-vel-sub');
    if (elVel) elVel.innerHTML = 'ω₂ = <span class="eq-num">' + fmt(omega2, 3) + '</span> rad/s'
                                + '<br>ω₃ = <span class="eq-num">' + fmt(omega3, 3) + '</span> rad/s'
                                + '<br>ω₄ = <span class="eq-num">' + fmt(omega4, 3) + '</span> rad/s';

    var elAcc = $('eq-acc-sub');
    if (elAcc) elAcc.innerHTML = 'α₂ = 0 (steady crank)'
                                + '<br>α₃ = <span class="eq-num">' + fmt(alpha3, 3) + '</span> rad/s²'
                                + '<br>α₄ = <span class="eq-num">' + fmt(alpha4, 3) + '</span> rad/s²';

    var elMa = $('eq-ma-sub');
    var maClass = (Math.abs(MA) < 0.5 || Math.abs(MA) > 50) ? 'eq-warn' : 'eq-num';
    if (elMa) elMa.innerHTML = 'μ = <span class="eq-num">' + fmt(mu, 2) + '°</span>'
                              + (mu < 40 ? '  <span class="eq-warn">(POOR)</span>' : '')
                              + '<br>MA = ω₂ / ω₄ = <span class="' + maClass + '">' + fmt(MA, 3) + '</span>';
  }

  // Cognate-curves canvas: draw coupler-midpoint curves of all 4 inversions.
  function drawCognateCurves() {
    var cnv = $('synth-curves-canvas');
    if (!cnv) return;
    var c2 = cnv.getContext('2d');
    var Wc = cnv.width, Hc = cnv.height;
    c2.fillStyle = '#0d1117'; c2.fillRect(0, 0, Wc, Hc);
    c2.strokeStyle = 'rgba(42,48,80,0.3)'; c2.lineWidth = 0.5;
    for (var gx = 0; gx < Wc; gx += 30) { c2.beginPath(); c2.moveTo(gx, 0); c2.lineTo(gx, Hc); c2.stroke(); }
    for (var gy = 0; gy < Hc; gy += 30) { c2.beginPath(); c2.moveTo(0, gy); c2.lineTo(Wc, gy); c2.stroke(); }
    var colors = ['#f5c842', '#3ddc84', '#b58bff', '#ff8c42'];
    var labels = ['Inv 1 (gnd L₁)', 'Inv 2 (gnd L₂)', 'Inv 3 (gnd L₃)', 'Inv 4 (gnd L₄)'];
    for (var k = 1; k <= 4; k++) {
      var m = inversionMap(state.invChain, k);
      var ox = (k - 1) * (Wc / 4) + Wc / 8;
      var oy = Hc * 0.55;
      var sc = 0.9;
      // ground baseline
      c2.strokeStyle = '#8899aa'; c2.lineWidth = 1.5;
      c2.beginPath(); c2.moveTo(ox - m.a * sc / 2, oy); c2.lineTo(ox + m.a * sc / 2, oy); c2.stroke();
      // Coupler trace
      c2.strokeStyle = colors[k - 1]; c2.lineWidth = 1.5;
      c2.beginPath();
      var first = true;
      for (var t = 0; t < TAU; t += 0.04) {
        var r = solvePosition(m.a, m.b, m.c, m.d, t, 1);
        if (!r) continue;
        var px = ox - m.a * sc / 2 + (r.Ax + r.Bx) / 2 * sc;
        var py = oy - (r.Ay + r.By) / 2 * sc;
        if (first) { c2.moveTo(px, py); first = false; } else c2.lineTo(px, py);
      }
      c2.stroke();
      // Label
      c2.fillStyle = colors[k - 1]; c2.font = 'bold 12px "Segoe UI", system-ui, sans-serif'; c2.textAlign = 'center';
      c2.fillText(labels[k - 1], ox, 24);
      c2.font = '10px "Courier New", monospace'; c2.fillStyle = '#8b9dc3';
      c2.fillText(m.a + '/' + m.b + '/' + m.c + '/' + m.d, ox, 40);
    }
  }

  // Wire inversions sub-tabs
  var invSubTabs = $('inv-sub-tabs');
  if (invSubTabs) invSubTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill'); if (!pill) return;
    state.invSub = pill.dataset.inv;
    renderInvSubView();
  });

  // Wire ground-link buttons
  qsa('.inv-ground-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { applyInversion(+btn.dataset.ground); });
  });

  // Wire synthesis sub-tabs
  var synthTabs = $('synth-tabs');
  if (synthTabs) synthTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill'); if (!pill) return;
    state.synthSub = pill.dataset.synth;
    renderInvSubView();
  });

  // Wire Solve & Synthesize button
  var synSolve = $('syn-solve');
  if (synSolve) synSolve.addEventListener('click', function () {
    var t2 = [+$('syn-t2-1').value, +$('syn-t2-2').value, +$('syn-t2-3').value].map(function (x) { return x * RAD; });
    var t4 = [+$('syn-t4-1').value, +$('syn-t4-2').value, +$('syn-t4-3').value].map(function (x) { return x * RAD; });
    var sol = solveFunctionSynthesis(t2, t4);
    var out = $('syn-result');
    if (!sol.ok) {
      out.className = 'synth-result err';
      out.textContent = sol.msg;
      return;
    }
    out.className = 'synth-result ok';
    out.innerHTML = '<h5>Freudenstein constants</h5>'
      + '<div class="sr-row"><span class="sr-key">K₁ = a/b</span><span class="sr-val">' + sol.K1.toFixed(5) + '</span></div>'
      + '<div class="sr-row"><span class="sr-key">K₂ = a/d</span><span class="sr-val">' + sol.K2.toFixed(5) + '</span></div>'
      + '<div class="sr-row"><span class="sr-key">K₃ = (a²+b²+d²−c²)/(2bd)</span><span class="sr-val">' + sol.K3.toFixed(5) + '</span></div>'
      + '<h5 style="margin-top:10px">Synthesized link lengths (scaled, l_max = 100 mm)</h5>'
      + '<div class="sr-row"><span class="sr-key">a (ground)</span><span class="sr-val">' + sol.a.toFixed(2) + ' mm</span></div>'
      + '<div class="sr-row"><span class="sr-key">b (crank)</span><span class="sr-val">' + sol.b.toFixed(2) + ' mm</span></div>'
      + '<div class="sr-row"><span class="sr-key">c (coupler)</span><span class="sr-val">' + sol.c.toFixed(2) + ' mm</span></div>'
      + '<div class="sr-row"><span class="sr-key">d (follower)</span><span class="sr-val">' + sol.d.toFixed(2) + ' mm</span></div>'
      + '<p style="margin-top:8px;font-size:0.78rem;color:var(--text-dim)">Click "Load into Simulate" to animate this synthesized mechanism.</p>';
    state._lastSynth = sol;
  });

  var synLoad = $('syn-load');
  if (synLoad) synLoad.addEventListener('click', function () {
    if (!state._lastSynth) return;
    pushUndo();
    var s = state._lastSynth;
    state.a = Math.round(s.a); state.b = Math.round(s.b); state.c = Math.round(s.c); state.d = Math.round(s.d);
    state.theta2 = 0; state.assemblyBranch = 1; state.couplerTrace = [];
    state._inInversions = false;
    state.mode = 'simulate';
    qsa('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === 'simulate'); });
    showMode('simulate');
    syncSlidersFromState();
    checkAssembly();
    draw();
  });

  // Debug hook for testing
  window.__fblDebug = function () { return { a: state.a, b: state.b, c: state.c, d: state.d, mode: state.mode, invGround: state.invGround, running: state.running, theta2: state.theta2 }; };

  /* ================================================================
     INITIAL SETUP
     ================================================================ */
  initUnitToggle();
  initHint();
  applyPreset('crank-rocker');
  showMode('simulate');
  syncPlayBtn();

  /* ================================================================
     SHAREABLE URL — the linkage geometry is encoded into the link (no backend).
     captureState() JSON → [flag] + deflate-raw|raw → base64url → '#c='
     ================================================================ */
  (function () {
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
    function flashShare(label, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=label; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900); }
    function shareLink(){
      try{
        var U=new TextEncoder().encode(JSON.stringify(captureState()));
        var canZip=(typeof CompressionStream!=='undefined');
        return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
          var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
          var enc=b64urlEncode(out);
          if(enc.length>SHARE_MAX){ flashShare('⚠ Too big',false); return; }
          var url=location.origin+location.pathname+'#c='+enc;
          try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(function(){ flashShare('✓ Link copied!',true); }, function(){ flashShare('↑ In address bar'); });
          } else { flashShare('↑ In address bar'); }
        }).catch(function(){ flashShare('✗ Failed',false); });
      }catch(e){ flashShare('✗ Failed',false); return Promise.resolve(); }
    }
    function loadFromHash(){
      var h=location.hash||''; if(h.indexOf('#c=')!==0) return;
      var enc=h.slice(3);
      Promise.resolve().then(function(){
        var final=b64urlDecode(enc), flag=final[0], body=final.subarray(1);
        return (flag===1)?inflateBytes(body):Promise.resolve(body);
      }).then(function(U){
        var d=JSON.parse(new TextDecoder().decode(U));
        if(!d || typeof d.a!=='number') return;   // shape mismatch → ignore
        restoreState(d);                            // reuse the tool's own restore
      }).catch(function(){});                       // corrupt link → keep the preset
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // after the synchronous boot above (rAF-free so it isn't throttled)
  })();

})();
