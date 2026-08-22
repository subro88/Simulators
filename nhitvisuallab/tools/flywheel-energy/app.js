(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS
     ================================================================ */

  var CONCEPTS = [
    /* ── Basics ──────────────────────────────────────────────────── */
    {
      id: 'flywheel-def', name: 'Flywheel Definition', symbol: 'FW',
      formula: 'Rotating mass that stores kinetic energy', unit: '\u2014',
      cat: 'basics',
      desc: 'A flywheel is a heavy rotating mechanical device used to store rotational (kinetic) energy. It resists changes in rotational speed due to its moment of inertia. Flywheels have been used since antiquity in potter\'s wheels and spinning wheels, and today they serve in engines, power grids, UPS systems, and hybrid vehicles for energy smoothing and storage.',
      diagram: 'flywheelDef',
      example: { problem: 'A flywheel stores 500 kJ of energy and delivers it over 10 seconds. What is the average power output?', steps: ['Power = Energy / Time', 'P = 500,000 J / 10 s', 'P = 50,000 W', 'P = 50 kW'], answer: 50, unit: 'kW' }
    },
    {
      id: 'moment-of-inertia', name: 'Moment of Inertia', symbol: 'I',
      formula: 'I = \u00BDmr\u00B2 (disk) | I = \u00BDm(r\u2081\u00B2+r\u2082\u00B2) (ring)', unit: 'kg\u00B7m\u00B2',
      cat: 'basics',
      desc: 'The moment of inertia (I) measures a body\'s resistance to angular acceleration. It depends on the mass distribution relative to the rotation axis. For a solid disk: I = \u00BDmr\u00B2. For a hollow cylinder (ring): I = \u00BDm(r\u2081\u00B2 + r\u2082\u00B2), where r\u2081 is the inner radius and r\u2082 is the outer radius. Concentrating mass farther from the axis increases I, which is why rim-type flywheels are preferred for energy storage.',
      diagram: 'momentOfInertia',
      example: { problem: 'A solid disk flywheel has mass 50 kg and radius 0.4 m. Find its moment of inertia.', steps: ['I = \u00BDmr\u00B2', 'I = \u00BD \u00D7 50 \u00D7 0.4\u00B2', 'I = 0.5 \u00D7 50 \u00D7 0.16', 'I = 4.0 kg\u00B7m\u00B2'], answer: 4.0, unit: 'kg\u00B7m\u00B2' }
    },
    {
      id: 'angular-velocity', name: 'Angular Velocity', symbol: '\u03C9',
      formula: '\u03C9 = 2\u03C0N/60', unit: 'rad/s',
      cat: 'basics',
      desc: 'Angular velocity (\u03C9) is the rate of rotation measured in radians per second (rad/s). It is converted from RPM (revolutions per minute) using \u03C9 = 2\u03C0N/60, where N is the speed in RPM. Since kinetic energy scales with \u03C9\u00B2, doubling the angular velocity quadruples the stored energy \u2014 making speed the most powerful lever for increasing flywheel energy capacity.',
      diagram: 'angularVelocity',
      example: { problem: 'A flywheel spins at 6000 RPM. Find its angular velocity in rad/s.', steps: ['\u03C9 = 2\u03C0N/60', '\u03C9 = 2\u03C0 \u00D7 6000 / 60', '\u03C9 = 2\u03C0 \u00D7 100', '\u03C9 = 628.3 rad/s'], answer: 628.3, unit: 'rad/s' }
    },
    {
      id: 'kinetic-energy', name: 'Kinetic Energy', symbol: 'KE',
      formula: 'KE = \u00BDI\u03C9\u00B2', unit: 'J',
      cat: 'basics',
      desc: 'The kinetic energy stored in a rotating flywheel is KE = \u00BDI\u03C9\u00B2, where I is the moment of inertia and \u03C9 is the angular velocity. This is the rotational analogue of translational kinetic energy (\u00BDmv\u00B2). For a solid disk at speed N (RPM): KE = \u00BC m r\u00B2 (2\u03C0N/60)\u00B2. Typical flywheels store from a few kilojoules to several megajoules depending on size and speed.',
      diagram: 'kineticEnergy',
      example: { problem: 'A flywheel has I = 5 kg\u00B7m\u00B2 and spins at 3000 RPM. Find the stored kinetic energy.', steps: ['\u03C9 = 2\u03C0 \u00D7 3000/60 = 314.16 rad/s', 'KE = \u00BDI\u03C9\u00B2', 'KE = 0.5 \u00D7 5 \u00D7 314.16\u00B2', 'KE = 246,740 J \u2248 246.7 kJ'], answer: 246740, unit: 'J' }
    },

    /* ── Design ──────────────────────────────────────────────────── */
    {
      id: 'material-selection', name: 'Material Selection', symbol: '\u03C1, \u03C3_y',
      formula: 'Steel | Aluminium | Carbon Composite', unit: '\u2014',
      cat: 'design',
      desc: 'Material choice determines the maximum safe speed and energy density of a flywheel. Steel (\u03C1 \u2248 7850 kg/m\u00B3, \u03C3_y \u2248 400 MPa) is heavy but cheap and strong. Aluminium (\u03C1 \u2248 2700 kg/m\u00B3, \u03C3_y \u2248 270 MPa) is lighter but weaker. Carbon fibre composite (\u03C1 \u2248 1600 kg/m\u00B3, \u03C3_t \u2248 1800 MPa) has the best strength-to-density ratio, enabling the highest tip speeds and energy densities. The key metric is specific strength: \u03C3/\u03C1.',
      diagram: 'materialSelection',
      example: { problem: 'Steel has \u03C3_y = 400 MPa and \u03C1 = 7850 kg/m\u00B3. Carbon composite has \u03C3_t = 1800 MPa and \u03C1 = 1600 kg/m\u00B3. Compare their specific strengths.', steps: ['Steel: \u03C3/\u03C1 = 400\u00D710\u2076 / 7850', 'Steel: = 50,955 J/kg \u2248 51.0 kJ/kg', 'Composite: \u03C3/\u03C1 = 1800\u00D710\u2076 / 1600', 'Composite: = 1,125,000 J/kg \u2248 1125 kJ/kg'], answer: 1125, unit: 'kJ/kg' }
    },
    {
      id: 'shape-factor', name: 'Shape Factor', symbol: 'K',
      formula: 'K = I / (m\u00B7r\u00B2) \u2014 ranges 0.3 to 1.0', unit: '\u2014',
      cat: 'design',
      desc: 'The shape factor K describes how effectively a flywheel\'s geometry uses its material for energy storage. K = 1.0 for a thin rim (all mass at the outer radius), K = 0.5 for a solid disk, and K \u2248 0.3 for a solid sphere. For a hollow cylinder: K = \u00BD(1 + (r\u2081/r\u2082)\u00B2). Higher K means more energy per unit mass, which is why rim-type designs are preferred for high-performance applications.',
      diagram: 'shapeFactor',
      example: { problem: 'A flywheel has inner radius 0.3 m and outer radius 0.5 m. Find the shape factor K.', steps: ['K = \u00BD(1 + (r\u2081/r\u2082)\u00B2)', 'K = \u00BD(1 + (0.3/0.5)\u00B2)', 'K = \u00BD(1 + 0.36)', 'K = 0.68'], answer: 0.68, unit: '' }
    },
    {
      id: 'flywheel-types', name: 'Flywheel Types', symbol: 'Disk / Ring / Spoke',
      formula: 'Solid Disk | Hollow Ring | Spoke-Hub', unit: '\u2014',
      cat: 'design',
      desc: 'Solid disk flywheels are the simplest and cheapest \u2014 I = \u00BDmr\u00B2. Ring (hollow cylinder) flywheels concentrate mass at the rim for higher I per unit mass \u2014 I = \u00BDm(r\u2081\u00B2 + r\u2082\u00B2). Spoke-hub flywheels use a lightweight hub and spokes to support a heavy rim, combining high I with reduced total mass. Modern high-speed composite flywheels often use a wound-filament rim on a lightweight hub.',
      diagram: 'flywheelTypes',
      example: { problem: 'A 30 kg ring flywheel has inner radius 0.25 m and outer radius 0.40 m. Find I.', steps: ['I = \u00BDm(r\u2081\u00B2 + r\u2082\u00B2)', 'I = 0.5 \u00D7 30 \u00D7 (0.25\u00B2 + 0.40\u00B2)', 'I = 15 \u00D7 (0.0625 + 0.16)', 'I = 15 \u00D7 0.2225 = 3.34 kg\u00B7m\u00B2'], answer: 3.34, unit: 'kg\u00B7m\u00B2' }
    },

    /* ── Performance ─────────────────────────────────────────────── */
    {
      id: 'energy-density', name: 'Energy Density', symbol: 'e',
      formula: 'e = KE/m = K\u00B7\u03C3_max/\u03C1', unit: 'Wh/kg',
      cat: 'performance',
      desc: 'Energy density (specific energy) is the stored energy per unit mass, measured in Wh/kg or J/kg. For a flywheel operating at its stress limit: e = K\u00B7\u03C3_max/\u03C1, where K is the shape factor, \u03C3_max is the maximum allowable stress, and \u03C1 is the density. Steel flywheels typically achieve 5\u201320 Wh/kg, while carbon composite flywheels can reach 50\u2013100 Wh/kg.',
      diagram: 'energyDensity',
      example: { problem: 'A 25 kg flywheel stores 180 kJ. What is its energy density in Wh/kg?', steps: ['e = KE / m', 'e = 180,000 J / 25 kg', 'e = 7200 J/kg', 'e = 7200 / 3600 = 2.0 Wh/kg'], answer: 2.0, unit: 'Wh/kg' }
    },
    {
      id: 'hoop-stress', name: 'Hoop Stress', symbol: '\u03C3',
      formula: '\u03C3 = \u03C1\u03C9\u00B2r\u00B2', unit: 'MPa',
      cat: 'performance',
      desc: 'The maximum hoop (circumferential tensile) stress in a spinning flywheel rim is \u03C3 = \u03C1\u03C9\u00B2r\u00B2, where \u03C1 is the density, \u03C9 is the angular velocity, and r is the outer radius. This stress must remain below the material\'s yield strength (with a safety factor) to prevent catastrophic failure. The hoop stress equals \u03C1v\u00B2_tip, where v_tip = \u03C9r is the tip speed. This is the primary limiting factor for flywheel speed.',
      diagram: 'hoopStress',
      example: { problem: 'A steel flywheel (\u03C1 = 7850 kg/m\u00B3) has radius 0.3 m and spins at 5000 RPM. Find the hoop stress.', steps: ['\u03C9 = 2\u03C0 \u00D7 5000/60 = 523.6 rad/s', '\u03C3 = \u03C1\u03C9\u00B2r\u00B2', '\u03C3 = 7850 \u00D7 523.6\u00B2 \u00D7 0.3\u00B2', '\u03C3 = 7850 \u00D7 274,157 \u00D7 0.09 = 193.6 MPa'], answer: 193.6, unit: 'MPa' }
    },
    {
      id: 'efficiency', name: 'Round-Trip Efficiency', symbol: '\u03B7',
      formula: '\u03B7 = E_out / E_in \u00D7 100%', unit: '%',
      cat: 'performance',
      desc: 'Flywheel energy storage systems can achieve round-trip efficiencies of 85\u201395%. Losses come from bearing friction, windage (aerodynamic drag), and motor/generator conversion. Modern systems use magnetic bearings and vacuum enclosures to minimise friction and windage, enabling self-discharge rates below 1\u20132% per hour. High-speed flywheels in vacuum with magnetic bearings can maintain stored energy for many hours.',
      diagram: 'efficiency',
      example: { problem: 'A flywheel receives 100 kJ and delivers 90 kJ. Find the round-trip efficiency.', steps: ['\u03B7 = E_out / E_in \u00D7 100%', '\u03B7 = 90 / 100 \u00D7 100%', '\u03B7 = 90%', 'This is typical for modern flywheel systems'], answer: 90, unit: '%' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 — Moment of inertia solid disk */
    function () {
      var m = randInt(10, 80);
      var r = +(randInt(20, 60) / 100).toFixed(2);
      var I = +(0.5 * m * r * r).toFixed(3);
      return { prompt: 'A solid disk flywheel has mass ' + m + ' kg and radius ' + r + ' m. Find the moment of inertia (kg\u00B7m\u00B2).', steps: ['I = \u00BDmr\u00B2', 'I = 0.5 \u00D7 ' + m + ' \u00D7 ' + r + '\u00B2', 'I = 0.5 \u00D7 ' + m + ' \u00D7 ' + (r * r).toFixed(4), 'I = ' + I + ' kg\u00B7m\u00B2'], answer: I, unit: 'kg\u00B7m\u00B2' };
    },
    /* 1 — Moment of inertia ring */
    function () {
      var m = randInt(15, 60);
      var r2 = +(randInt(30, 60) / 100).toFixed(2);
      var r1 = +(randInt(10, Math.floor(r2 * 100) - 5) / 100).toFixed(2);
      var I = +(0.5 * m * (r1 * r1 + r2 * r2)).toFixed(3);
      return { prompt: 'A ring flywheel has mass ' + m + ' kg, inner radius ' + r1 + ' m, outer radius ' + r2 + ' m. Find I (kg\u00B7m\u00B2).', steps: ['I = \u00BDm(r\u2081\u00B2 + r\u2082\u00B2)', 'I = 0.5 \u00D7 ' + m + ' \u00D7 (' + r1 + '\u00B2 + ' + r2 + '\u00B2)', 'I = 0.5 \u00D7 ' + m + ' \u00D7 ' + (r1 * r1 + r2 * r2).toFixed(4), 'I = ' + I + ' kg\u00B7m\u00B2'], answer: I, unit: 'kg\u00B7m\u00B2' };
    },
    /* 2 — Angular velocity from RPM */
    function () {
      var N = randInt(1, 50) * 100;
      var omega = +(2 * Math.PI * N / 60).toFixed(1);
      return { prompt: 'A flywheel spins at ' + N + ' RPM. Find the angular velocity in rad/s.', steps: ['\u03C9 = 2\u03C0N/60', '\u03C9 = 2\u03C0 \u00D7 ' + N + ' / 60', '\u03C9 = ' + (2 * Math.PI * N).toFixed(1) + ' / 60', '\u03C9 = ' + omega + ' rad/s'], answer: omega, unit: 'rad/s' };
    },
    /* 3 — Kinetic energy */
    function () {
      var I = +(randInt(2, 10) + randInt(0, 9) / 10).toFixed(1);
      var N = randInt(10, 50) * 100;
      var omega = 2 * Math.PI * N / 60;
      var KE = +(0.5 * I * omega * omega).toFixed(0);
      return { prompt: 'A flywheel has I = ' + I + ' kg\u00B7m\u00B2 and spins at ' + N + ' RPM. Find the kinetic energy (J).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + N + '/60 = ' + omega.toFixed(2) + ' rad/s', 'KE = \u00BDI\u03C9\u00B2', 'KE = 0.5 \u00D7 ' + I + ' \u00D7 ' + omega.toFixed(2) + '\u00B2', 'KE = ' + KE + ' J'], answer: KE, unit: 'J' };
    },
    /* 4 — Hoop stress */
    function () {
      var rho = 7850;
      var r = +(randInt(20, 50) / 100).toFixed(2);
      var N = randInt(20, 60) * 100;
      var omega = 2 * Math.PI * N / 60;
      var sigma = +(rho * omega * omega * r * r / 1e6).toFixed(1);
      return { prompt: 'A steel flywheel (\u03C1 = 7850 kg/m\u00B3) has radius ' + r + ' m and spins at ' + N + ' RPM. Find the max hoop stress (MPa).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + N + '/60 = ' + omega.toFixed(2) + ' rad/s', '\u03C3 = \u03C1\u03C9\u00B2r\u00B2', '\u03C3 = 7850 \u00D7 ' + omega.toFixed(2) + '\u00B2 \u00D7 ' + r + '\u00B2', '\u03C3 = ' + sigma + ' MPa'], answer: sigma, unit: 'MPa' };
    },
    /* 5 — Energy density */
    function () {
      var m = randInt(15, 60);
      var KE = randInt(50, 500) * 1000;
      var dens = +(KE / m / 3600).toFixed(2);
      return { prompt: 'A ' + m + ' kg flywheel stores ' + (KE / 1000) + ' kJ. Find the energy density (Wh/kg).', steps: ['e = KE / m', 'e = ' + KE + ' J / ' + m + ' kg', 'e = ' + (KE / m).toFixed(1) + ' J/kg', 'e = ' + (KE / m).toFixed(1) + ' / 3600 = ' + dens + ' Wh/kg'], answer: dens, unit: 'Wh/kg' };
    },
    /* 6 — Tip speed */
    function () {
      var r = +(randInt(20, 60) / 100).toFixed(2);
      var N = randInt(10, 50) * 100;
      var omega = 2 * Math.PI * N / 60;
      var vtip = +(omega * r).toFixed(1);
      return { prompt: 'A flywheel has radius ' + r + ' m and spins at ' + N + ' RPM. Find the tip speed (m/s).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + N + '/60 = ' + omega.toFixed(2) + ' rad/s', 'v_tip = \u03C9 \u00D7 r', 'v_tip = ' + omega.toFixed(2) + ' \u00D7 ' + r, 'v_tip = ' + vtip + ' m/s'], answer: vtip, unit: 'm/s' };
    },
    /* 7 — Energy in kWh */
    function () {
      var I = +(randInt(5, 20)).toFixed(0);
      var N = randInt(20, 80) * 100;
      var omega = 2 * Math.PI * N / 60;
      var KE = 0.5 * I * omega * omega;
      var kWh = +(KE / 3.6e6).toFixed(4);
      return { prompt: 'A flywheel has I = ' + I + ' kg\u00B7m\u00B2 and spins at ' + N + ' RPM. Find energy stored in kWh (4 decimal places).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + N + '/60 = ' + omega.toFixed(2) + ' rad/s', 'KE = \u00BDI\u03C9\u00B2 = ' + KE.toFixed(0) + ' J', 'kWh = KE / 3,600,000', 'kWh = ' + kWh], answer: kWh, unit: 'kWh' };
    },
    /* 8 — Safety factor */
    function () {
      var sigmaYield = randInt(250, 500);
      var sigmaActual = randInt(50, Math.floor(sigmaYield * 0.8));
      var sf = +(sigmaYield / sigmaActual).toFixed(2);
      return { prompt: 'A flywheel material has yield strength ' + sigmaYield + ' MPa. The operating hoop stress is ' + sigmaActual + ' MPa. Find the safety factor.', steps: ['SF = \u03C3_yield / \u03C3_operating', 'SF = ' + sigmaYield + ' / ' + sigmaActual, 'SF = ' + sf, 'A safety factor > 2 is typical for flywheels'], answer: sf, unit: '' };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'The moment of inertia of a solid disk flywheel is:', options: ['I = \u00BDmr\u00B2', 'I = mr\u00B2', 'I = \u00BCmr\u00B2', 'I = 2mr\u00B2'], correct: 0 },
    { type: 'mcq', prompt: 'Doubling the angular velocity of a flywheel multiplies the stored energy by:', options: ['4 times', '2 times', '8 times', '16 times'], correct: 0 },
    { type: 'mcq', prompt: 'The hoop stress in a spinning flywheel is given by:', options: ['\u03C3 = \u03C1\u03C9\u00B2r\u00B2', '\u03C3 = \u00BD\u03C1\u03C9r', '\u03C3 = m\u03C9\u00B2r', '\u03C3 = EI/r'], correct: 0 },
    { type: 'mcq', prompt: 'Which material gives the highest flywheel energy density?', options: ['Carbon fibre composite', 'Steel', 'Aluminium', 'Cast iron'], correct: 0 },
    { type: 'mcq', prompt: 'The shape factor K for a solid disk flywheel is:', options: ['0.5', '1.0', '0.25', '0.75'], correct: 0 },
    { type: 'mcq', prompt: 'To convert RPM to rad/s, you multiply by:', options: ['2\u03C0/60', '60/2\u03C0', '\u03C0/30', '30/\u03C0'], correct: 0 },
    { type: 'mcq', prompt: 'A ring-type flywheel is preferred over a solid disk because:', options: ['Higher moment of inertia per unit mass', 'Easier to manufacture', 'Lower hoop stress', 'Lower angular velocity needed'], correct: 0 },
    { type: 'mcq', prompt: 'Flywheel energy storage systems typically achieve round-trip efficiency of:', options: ['85\u201395%', '50\u201360%', '30\u201340%', '99\u2013100%'], correct: 0 },
    { type: 'mcq', prompt: 'The tip speed of a flywheel is:', options: ['v = \u03C9r', 'v = \u03C9/r', 'v = \u03C9r\u00B2', 'v = 2\u03C0r'], correct: 0 },
    { type: 'mcq', prompt: 'The maximum speed of a flywheel is primarily limited by:', options: ['Hoop (tensile) stress in the material', 'The weight of the bearings', 'The colour of the material', 'The ambient temperature'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'A solid disk of mass 40 kg and radius 0.5 m. Find I (kg\u00B7m\u00B2).', answer: 5.0, unit: 'kg\u00B7m\u00B2', steps: ['I = \u00BDmr\u00B2 = 0.5\u00D740\u00D70.25', 'I = 5.0 kg\u00B7m\u00B2'] },
    { type: 'numeric', prompt: 'Find \u03C9 in rad/s for 1500 RPM.', answer: 157.1, unit: 'rad/s', steps: ['\u03C9 = 2\u03C0\u00D71500/60', '\u03C9 = 157.1 rad/s'] },
    { type: 'numeric', prompt: 'A flywheel with I = 8 kg\u00B7m\u00B2 at 2000 RPM. Find KE (kJ, round to nearest integer).', answer: 175, unit: 'kJ', steps: ['\u03C9 = 209.4 rad/s', 'KE = 0.5\u00D78\u00D7209.4\u00B2 \u2248 175,459 J \u2248 175 kJ'] },
    { type: 'numeric', prompt: 'A steel flywheel (\u03C1=7850) with r=0.4 m at 4000 RPM. Find hoop stress (MPa, 1 decimal).', answer: 219.5, unit: 'MPa', steps: ['\u03C9 = 418.9 rad/s', '\u03C3 = 7850\u00D7418.9\u00B2\u00D70.16 / 10\u2076 = 219.5 MPa'] },
    { type: 'numeric', prompt: 'A ring flywheel: m=50 kg, r\u2081=0.3 m, r\u2082=0.5 m. Find I (kg\u00B7m\u00B2).', answer: 8.5, unit: 'kg\u00B7m\u00B2', steps: ['I = 0.5\u00D750\u00D7(0.09+0.25)', 'I = 25\u00D70.34 = 8.5 kg\u00B7m\u00B2'] }
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

  /* Flywheel parameters */
  var fwType = 'solid-disk';   /* 'solid-disk' | 'ring' | 'spoke' */
  var fwMaterial = 'steel';
  var fwMass = 20;             /* kg */
  var fwOuterR = 0.40;         /* m */
  var fwInnerR = 0.00;         /* m — only for ring type */
  var fwRPM = 3000;

  /* Material database */
  var MATERIALS = {
    'steel':     { name: 'Steel',            rho: 7850, sigmaY: 400,  color: '#b0bec5' },
    'aluminium': { name: 'Aluminium',        rho: 2700, sigmaY: 270,  color: '#e0e0e0' },
    'composite': { name: 'Carbon Composite', rho: 1600, sigmaY: 1800, color: '#424242' }
  };

  /* Calculated values */
  var calc = { I: 0, omega: 0, KE: 0, kWh: 0, stress: 0, energyDens: 0, tipSpeed: 0, sf: 0 };

  /* Animation */
  var animAngle = 0;
  var animId = null;
  var lastTime = 0;

  /* Explore */
  var selCat = 'basics';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* ================================================================
     PHYSICS ENGINE
     ================================================================ */

  function calculateAll() {
    var mat = MATERIALS[fwMaterial];
    var r2 = fwOuterR;
    var r1 = (fwType === 'ring' || fwType === 'spoke') ? fwInnerR : 0;

    /* Moment of inertia */
    if (fwType === 'solid-disk') {
      calc.I = 0.5 * fwMass * r2 * r2;
    } else {
      /* Ring or spoke: I = ½m(r1² + r2²) */
      calc.I = 0.5 * fwMass * (r1 * r1 + r2 * r2);
    }

    /* Angular velocity */
    calc.omega = 2 * Math.PI * fwRPM / 60;

    /* Kinetic energy */
    calc.KE = 0.5 * calc.I * calc.omega * calc.omega;

    /* Energy in kWh */
    calc.kWh = calc.KE / 3.6e6;

    /* Max hoop stress: σ = ρω²r² */
    calc.stress = mat.rho * calc.omega * calc.omega * r2 * r2 / 1e6; /* MPa */

    /* Energy density (Wh/kg) */
    calc.energyDens = calc.KE / fwMass / 3600;

    /* Tip speed */
    calc.tipSpeed = calc.omega * r2;

    /* Safety factor */
    calc.sf = calc.stress > 0 ? mat.sigmaY / calc.stress : 999;
  }

  /* ================================================================
     DRAWING — SIMULATE MODE
     ================================================================ */

  var CX = 260;    /* flywheel center X */
  var CY = 240;    /* flywheel center Y */
  var MAX_VIS_R = 160; /* max visual radius on canvas */

  function drawSimulate() {
    var mat = MATERIALS[fwMaterial];
    var r2 = fwOuterR;
    var r1 = (fwType === 'ring' || fwType === 'spoke') ? fwInnerR : 0;

    /* Scale: map fwOuterR (max 1.0 m) to MAX_VIS_R pixels */
    var scale = MAX_VIS_R / 1.0;
    var visR2 = r2 * scale;
    var visR1 = r1 * scale;

    /* ── Title labels ── */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#558b2f';
    ctx.fillText('FLYWHEEL VIEW', 8, 8);
    ctx.fillStyle = '#7cb342';
    ctx.fillText('CROSS-SECTION', 540, 8);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('ENERGY GAUGE', 540, 260);

    /* ── Draw flywheel (front view) ── */
    drawFlywheelFront(visR2, visR1, mat);

    /* ── Draw cross-section ── */
    drawCrossSection(visR2, visR1, mat);

    /* ── Draw energy gauge ── */
    drawEnergyGauge();

    /* ── Draw info labels ── */
    drawInfoLabels();
  }

  function drawFlywheelFront(visR2, visR1, mat) {
    ctx.save();
    ctx.translate(CX, CY);
    ctx.rotate(animAngle);

    /* Outer disk/ring fill */
    if (fwType === 'solid-disk') {
      /* Solid disk */
      ctx.beginPath();
      ctx.arc(0, 0, visR2, 0, Math.PI * 2);
      ctx.closePath();
      var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, visR2);
      grad.addColorStop(0, 'rgba(85,139,47,0.15)');
      grad.addColorStop(0.7, 'rgba(85,139,47,0.25)');
      grad.addColorStop(1, 'rgba(85,139,47,0.35)');
      ctx.fillStyle = grad;
      ctx.fill();
    } else if (fwType === 'ring') {
      /* Ring — fill between r1 and r2 */
      ctx.beginPath();
      ctx.arc(0, 0, visR2, 0, Math.PI * 2);
      ctx.arc(0, 0, Math.max(visR1, 5), 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(85,139,47,0.30)';
      ctx.fill();
    } else {
      /* Spoke — rim ring + hub + spokes */
      var rimWidth = Math.max((visR2 - visR1) * 0.5, 8);
      ctx.beginPath();
      ctx.arc(0, 0, visR2, 0, Math.PI * 2);
      ctx.arc(0, 0, visR2 - rimWidth, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = 'rgba(85,139,47,0.35)';
      ctx.fill();

      /* Hub */
      var hubR = Math.max(visR2 * 0.15, 12);
      ctx.beginPath();
      ctx.arc(0, 0, hubR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(85,139,47,0.25)';
      ctx.fill();
      ctx.strokeStyle = '#558b2f';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      /* Spokes */
      ctx.strokeStyle = 'rgba(85,139,47,0.6)';
      ctx.lineWidth = 3;
      for (var s = 0; s < 6; s++) {
        var angle = s * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * hubR, Math.sin(angle) * hubR);
        ctx.lineTo(Math.cos(angle) * (visR2 - rimWidth), Math.sin(angle) * (visR2 - rimWidth));
        ctx.stroke();
      }
    }

    /* Outer ring stroke */
    ctx.beginPath();
    ctx.arc(0, 0, visR2, 0, Math.PI * 2);
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 3;
    ctx.stroke();

    /* Inner ring stroke (ring and spoke types) */
    if (fwType === 'ring' && visR1 > 2) {
      ctx.beginPath();
      ctx.arc(0, 0, visR1, 0, Math.PI * 2);
      ctx.strokeStyle = '#558b2f';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* Radial tick marks (rotating with the flywheel) */
    ctx.strokeStyle = 'rgba(85,139,47,0.5)';
    ctx.lineWidth = 1.5;
    for (var t = 0; t < 12; t++) {
      var a = t * Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (visR2 - 8), Math.sin(a) * (visR2 - 8));
      ctx.lineTo(Math.cos(a) * visR2, Math.sin(a) * visR2);
      ctx.stroke();
    }

    /* Center axle */
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#558b2f';
    ctx.fill();

    ctx.restore();

    /* Rotation direction arrow (static, outside the flywheel) */
    if (fwRPM > 0) {
      var arrowR = visR2 + 20;
      ctx.strokeStyle = '#7cb342';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(CX, CY, arrowR, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
      /* Arrow head */
      var headAngle = Math.PI * 0.3;
      var hx = CX + arrowR * Math.cos(headAngle);
      var hy = CY + arrowR * Math.sin(headAngle);
      ctx.fillStyle = '#7cb342';
      ctx.beginPath();
      ctx.moveTo(hx + 6, hy + 2);
      ctx.lineTo(hx - 4, hy - 6);
      ctx.lineTo(hx - 2, hy + 8);
      ctx.closePath();
      ctx.fill();

      /* RPM label */
      ctx.font = '700 12px "Courier New", monospace';
      ctx.fillStyle = '#7cb342';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(fwRPM + ' RPM', CX, CY + visR2 + 40);
    }

    /* Radius dimension */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(CX, CY);
    ctx.lineTo(CX + visR2, CY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('r = ' + fwOuterR.toFixed(2) + ' m', CX + visR2 / 2, CY + 4);
  }

  function drawCrossSection(visR2, visR1, mat) {
    var csX = 720;  /* center of cross-section */
    var csY = 140;
    var csScale = 0.6; /* smaller than front view */
    var r2 = visR2 * csScale;
    var r1 = visR1 * csScale;

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7cb342';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(fwType === 'solid-disk' ? 'Solid Disk' : fwType === 'ring' ? 'Hollow Ring' : 'Spoke-Hub', csX, 22);

    if (fwType === 'solid-disk') {
      /* Rectangle cross-section */
      var w = r2 * 2;
      var h = Math.max(r2 * 0.3, 12);
      ctx.fillStyle = 'rgba(85,139,47,0.3)';
      ctx.fillRect(csX - w / 2, csY - h / 2, w, h);
      ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 2;
      ctx.strokeRect(csX - w / 2, csY - h / 2, w, h);
      /* Axis */
      ctx.fillStyle = '#558b2f';
      ctx.beginPath(); ctx.arc(csX, csY, 3, 0, Math.PI * 2); ctx.fill();
      /* Dimension */
      ctx.font = '600 9px "Courier New", monospace';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('2r = ' + (fwOuterR * 2).toFixed(2) + ' m', csX, csY + h / 2 + 6);
    } else if (fwType === 'ring') {
      /* Hollow rectangle cross-section */
      var w2 = r2 * 2;
      var w1 = Math.max(r1 * 2, 4);
      var h2 = Math.max(r2 * 0.3, 12);
      ctx.fillStyle = 'rgba(85,139,47,0.3)';
      ctx.fillRect(csX - w2 / 2, csY - h2 / 2, w2, h2);
      /* Cut out inner */
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(csX - w1 / 2, csY - h2 / 2 + 2, w1, h2 - 4);
      /* Outline */
      ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 2;
      ctx.strokeRect(csX - w2 / 2, csY - h2 / 2, w2, h2);
      ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 1;
      ctx.strokeRect(csX - w1 / 2, csY - h2 / 2 + 2, w1, h2 - 4);
      ctx.fillStyle = '#558b2f';
      ctx.beginPath(); ctx.arc(csX, csY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = '600 9px "Courier New", monospace';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('r\u2081=' + fwInnerR.toFixed(2) + '  r\u2082=' + fwOuterR.toFixed(2) + ' m', csX, csY + h2 / 2 + 6);
    } else {
      /* Spoke cross-section: rim + hub + spokes */
      var w2s = r2 * 2;
      var rimW = Math.max((r2 - r1) * 0.4, 6);
      var h2s = Math.max(r2 * 0.3, 12);
      /* Left rim */
      ctx.fillStyle = 'rgba(85,139,47,0.35)';
      ctx.fillRect(csX - w2s / 2, csY - h2s / 2, rimW, h2s);
      /* Right rim */
      ctx.fillRect(csX + w2s / 2 - rimW, csY - h2s / 2, rimW, h2s);
      /* Hub */
      var hubW = Math.max(r2 * 0.2, 8);
      ctx.fillRect(csX - hubW / 2, csY - h2s / 2, hubW, h2s);
      /* Spokes (lines) */
      ctx.strokeStyle = 'rgba(85,139,47,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(csX - hubW / 2, csY);
      ctx.lineTo(csX - w2s / 2 + rimW, csY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(csX + hubW / 2, csY);
      ctx.lineTo(csX + w2s / 2 - rimW, csY);
      ctx.stroke();
      /* Outline */
      ctx.strokeStyle = '#558b2f'; ctx.lineWidth = 2;
      ctx.strokeRect(csX - w2s / 2, csY - h2s / 2, w2s, h2s);
      ctx.fillStyle = '#558b2f';
      ctx.beginPath(); ctx.arc(csX, csY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = '600 9px "Courier New", monospace';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('Spoke-Hub Design', csX, csY + h2s / 2 + 6);
    }

    /* Material label */
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = mat.color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(mat.name, csX, csY + 50);
    ctx.font = '600 9px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('\u03C1 = ' + mat.rho + ' kg/m\u00B3  |  \u03C3_y = ' + mat.sigmaY + ' MPa', csX, csY + 66);
  }

  function drawEnergyGauge() {
    var gX = 560;
    var gY = 290;
    var gW = 310;
    var gH = 28;
    var mat = MATERIALS[fwMaterial];

    /* Max possible energy for current config (at max RPM = 50000) */
    var omegaMax = 2 * Math.PI * 50000 / 60;
    var KEmax = 0.5 * calc.I * omegaMax * omegaMax;
    var frac = KEmax > 0 ? Math.min(calc.KE / KEmax, 1) : 0;

    /* Background bar */
    ctx.fillStyle = '#1f2535';
    ctx.beginPath();
    ctx.roundRect(gX, gY, gW, gH, 8);
    ctx.fill();
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.stroke();

    /* Filled portion */
    if (frac > 0.005) {
      var fillW = Math.max(frac * gW, 8);
      var grad = ctx.createLinearGradient(gX, 0, gX + fillW, 0);
      grad.addColorStop(0, 'rgba(85,139,47,0.6)');
      grad.addColorStop(1, '#7cb342');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(gX, gY, fillW, gH, 8);
      ctx.fill();
    }

    /* Energy text */
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var eText = calc.KE < 1000 ? calc.KE.toFixed(1) + ' J' :
                calc.KE < 1e6 ? (calc.KE / 1000).toFixed(2) + ' kJ' :
                (calc.KE / 1e6).toFixed(3) + ' MJ';
    ctx.fillText('KE = ' + eText, gX + gW / 2, gY + gH / 2);

    /* Stress bar below */
    var sY = gY + gH + 20;
    var stressFrac = Math.min(calc.stress / mat.sigmaY, 1);

    ctx.fillStyle = '#1f2535';
    ctx.beginPath();
    ctx.roundRect(gX, sY, gW, gH, 8);
    ctx.fill();
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (stressFrac > 0.005) {
      var sW = Math.max(stressFrac * gW, 8);
      var sColor = stressFrac < 0.5 ? '#3ddc84' : stressFrac < 0.8 ? '#f5c842' : '#ff5555';
      ctx.fillStyle = sColor;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(gX, sY, sW, gH, 8);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u03C3 = ' + calc.stress.toFixed(1) + ' / ' + mat.sigmaY + ' MPa', gX + gW / 2, sY + gH / 2);

    /* Stress label */
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('STRESS RATIO', gX, sY - 12);

    /* Safety factor indicator */
    var sfY = sY + gH + 18;
    ctx.font = '700 13px "Courier New", monospace';
    var sfColor = calc.sf >= 3 ? '#3ddc84' : calc.sf >= 1.5 ? '#f5c842' : '#ff5555';
    ctx.fillStyle = sfColor;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var sfText = calc.sf > 99 ? 'SF > 99' : 'SF = ' + calc.sf.toFixed(2);
    ctx.fillText(sfText, gX, sfY);

    var sfLabel = calc.sf >= 3 ? 'SAFE' : calc.sf >= 1.5 ? 'CAUTION' : 'DANGER';
    ctx.font = '700 10px "Segoe UI", sans-serif';
    ctx.fillText(sfLabel, gX + 130, sfY + 2);

    /* Formulas display */
    var fY = sfY + 30;
    ctx.font = '600 11px "Courier New", monospace';
    ctx.fillStyle = '#558b2f';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    if (fwType === 'solid-disk') {
      ctx.fillText('I = \u00BDmr\u00B2', gX, fY);
    } else {
      ctx.fillText('I = \u00BDm(r\u2081\u00B2+r\u2082\u00B2)', gX, fY);
    }
    ctx.fillText('KE = \u00BDI\u03C9\u00B2', gX, fY + 18);
    ctx.fillText('\u03C3 = \u03C1\u03C9\u00B2r\u00B2', gX, fY + 36);
    ctx.fillText('\u03C9 = 2\u03C0N/60', gX, fY + 54);
  }

  function drawInfoLabels() {
    /* Summary info in lower-left area */
    var iX = 30;
    var iY = CY + MAX_VIS_R + 60;

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';

    ctx.fillStyle = '#558b2f';
    ctx.fillText('TYPE: ' + (fwType === 'solid-disk' ? 'Solid Disk' : fwType === 'ring' ? 'Ring' : 'Spoke'), iX, iY);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Mass: ' + fwMass + ' kg  |  Tip Speed: ' + calc.tipSpeed.toFixed(1) + ' m/s', iX, iY + 16);
    ctx.fillText('\u03C9 = ' + calc.omega.toFixed(1) + ' rad/s  |  I = ' + calc.I.toFixed(4) + ' kg\u00B7m\u00B2', iX, iY + 32);
  }

  /* ================================================================
     DRAWING — EXPLORE MINI-DIAGRAMS
     ================================================================ */

  function drawConceptDiagram(concept) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var fn = {
      'flywheelDef': drawFlywheelDefDiag,
      'momentOfInertia': drawMomentOfInertiaDiag,
      'angularVelocity': drawAngularVelocityDiag,
      'kineticEnergy': drawKineticEnergyDiag,
      'materialSelection': drawMaterialSelectionDiag,
      'shapeFactor': drawShapeFactorDiag,
      'flywheelTypes': drawFlywheelTypesDiag,
      'energyDensity': drawEnergyDensityDiag,
      'hoopStress': drawHoopStressDiag,
      'efficiency': drawEfficiencyDiag
    };

    if (fn[concept.diagram]) fn[concept.diagram]();

    /* Formula at bottom */
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#558b2f';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(concept.formula, W / 2, H - 16);
  }

  function drawMiniFlywheelDisk(cx, cy, r, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = (color || '#558b2f') + '33';
    ctx.fill();
    ctx.strokeStyle = color || '#558b2f';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = color || '#558b2f'; ctx.fill();
  }

  function drawMiniFlywheelRing(cx, cy, r2, r1, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, r2, 0, Math.PI * 2);
    ctx.arc(cx, cy, r1, 0, Math.PI * 2, true);
    ctx.fillStyle = (color || '#558b2f') + '44';
    ctx.fill();
    ctx.strokeStyle = color || '#558b2f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r2, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fillStyle = color || '#558b2f'; ctx.fill();
  }

  function drawMiniArrowCurve(cx, cy, r, startA, endA, color) {
    ctx.strokeStyle = color || '#7cb342'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, startA, endA);
    ctx.stroke();
    var hx = cx + r * Math.cos(endA);
    var hy = cy + r * Math.sin(endA);
    ctx.fillStyle = color || '#7cb342';
    ctx.beginPath();
    ctx.moveTo(hx + 5, hy + 2);
    ctx.lineTo(hx - 3, hy - 5);
    ctx.lineTo(hx - 1, hy + 7);
    ctx.closePath();
    ctx.fill();
  }

  function drawFlywheelDefDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('What is a Flywheel?', W / 2, 35);

    drawMiniFlywheelDisk(300, 200, 90, '#558b2f');
    drawMiniArrowCurve(300, 200, 110, -0.5, 0.8, '#7cb342');

    /* Labels */
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7cb342';
    ctx.fillText('Rotating mass', 300, 320);
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('stores kinetic energy', 300, 340);

    /* Energy arrow */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(500, 180); ctx.lineTo(600, 180); ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.beginPath(); ctx.moveTo(605, 180); ctx.lineTo(595, 175); ctx.lineTo(595, 185); ctx.closePath(); ctx.fill();
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillText('Energy In/Out', 650, 170);

    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(600, 220); ctx.lineTo(500, 220); ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.beginPath(); ctx.moveTo(495, 220); ctx.lineTo(505, 215); ctx.lineTo(505, 225); ctx.closePath(); ctx.fill();

    /* Applications */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left';
    ctx.fillText('Applications:', 550, 260);
    ctx.fillText('\u2022 UPS / Grid storage', 555, 280);
    ctx.fillText('\u2022 Regenerative braking', 555, 296);
    ctx.fillText('\u2022 Engine smoothing', 555, 312);
    ctx.fillText('\u2022 Spacecraft attitude', 555, 328);
  }

  function drawMomentOfInertiaDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Moment of Inertia — Mass Distribution Matters', W / 2, 35);

    /* Solid disk */
    drawMiniFlywheelDisk(200, 180, 70, '#558b2f');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#558b2f'; ctx.textAlign = 'center';
    ctx.fillText('Solid Disk', 200, 270);
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillText('I = \u00BDmr\u00B2', 200, 290);

    /* Ring */
    drawMiniFlywheelRing(450, 180, 70, 45, '#7cb342');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7cb342';
    ctx.fillText('Ring', 450, 270);
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillText('I = \u00BDm(r\u2081\u00B2+r\u2082\u00B2)', 450, 290);

    /* Thin rim */
    drawMiniFlywheelRing(700, 180, 70, 64, '#f5c842');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Thin Rim', 700, 270);
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillText('I \u2248 mr\u00B2', 700, 290);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Mass farther from axis \u2192 Higher I \u2192 More energy per unit mass', W / 2, 350);
  }

  function drawAngularVelocityDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Angular Velocity: RPM to rad/s', W / 2, 35);

    drawMiniFlywheelDisk(300, 200, 80, '#558b2f');
    drawMiniArrowCurve(300, 200, 100, -0.8, 0.6, '#7cb342');

    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#7cb342'; ctx.textAlign = 'center';
    ctx.fillText('\u03C9', 420, 190);

    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#558b2f';
    ctx.fillText('\u03C9 = 2\u03C0N / 60', W / 2, 350);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('N = revolutions per minute (RPM)', W / 2, 380);
    ctx.fillText('\u03C9 = radians per second (rad/s)', W / 2, 400);

    /* Example conversion */
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Example: 3000 RPM \u2192 \u03C9 = 2\u03C0\u00D73000/60 = 314.2 rad/s', W / 2, 430);
  }

  function drawKineticEnergyDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Kinetic Energy Stored in a Flywheel', W / 2, 35);

    drawMiniFlywheelDisk(250, 200, 80, '#558b2f');
    drawMiniArrowCurve(250, 200, 100, -0.5, 0.5, '#7cb342');

    /* Energy equation */
    ctx.font = '700 20px "Courier New", monospace';
    ctx.fillStyle = '#558b2f';
    ctx.fillText('KE = \u00BDI\u03C9\u00B2', 600, 180);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left';
    ctx.fillText('I = moment of inertia (kg\u00B7m\u00B2)', 500, 220);
    ctx.fillText('\u03C9 = angular velocity (rad/s)', 500, 240);
    ctx.fillText('KE = kinetic energy (J)', 500, 260);

    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Energy scales with \u03C9\u00B2 \u2014 double speed = 4\u00D7 energy!', W / 2, 340);

    /* Comparison bars */
    ctx.fillStyle = 'rgba(85,139,47,0.4)';
    ctx.fillRect(200, 370, 100, 20);
    ctx.fillRect(200, 400, 400, 20);
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'left';
    ctx.fillText('\u03C9', 310, 378);
    ctx.fillText('2\u03C9 (4\u00D7 energy)', 610, 408);
  }

  function drawMaterialSelectionDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Material Comparison for Flywheels', W / 2, 35);

    /* Steel bar */
    var bY = 90;
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(180, bY, 200, 30);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'left';
    ctx.fillText('Steel', 100, bY + 10);
    ctx.font = '600 9px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('\u03C1=7850  \u03C3=400 MPa', 400, bY + 10);

    /* Aluminium bar */
    bY = 140;
    ctx.fillStyle = '#e0e0e0'; ctx.fillRect(180, bY, 130, 30);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Aluminium', 100, bY + 10);
    ctx.font = '600 9px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('\u03C1=2700  \u03C3=270 MPa', 400, bY + 10);

    /* Composite bar */
    bY = 190;
    ctx.fillStyle = '#558b2f'; ctx.fillRect(180, bY, 500, 30);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Carbon Composite', 100, bY + 10);
    ctx.font = '600 9px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('\u03C1=1600  \u03C3=1800 MPa', 700, bY + 10);

    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('Specific Strength (\u03C3/\u03C1) \u2192', W / 2, 250);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Higher specific strength = higher tip speed = more energy per kg', W / 2, 290);
  }

  function drawShapeFactorDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Shape Factor K', W / 2, 35);

    /* Solid disk K=0.5 */
    drawMiniFlywheelDisk(170, 180, 55, '#558b2f');
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#558b2f'; ctx.textAlign = 'center';
    ctx.fillText('K = 0.5', 170, 255);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Solid Disk', 170, 275);

    /* Ring K~0.6-0.8 */
    drawMiniFlywheelRing(390, 180, 55, 35, '#7cb342');
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#7cb342';
    ctx.fillText('K \u2248 0.7', 390, 255);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Hollow Ring', 390, 275);

    /* Thin rim K~1.0 */
    drawMiniFlywheelRing(610, 180, 55, 50, '#f5c842');
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('K \u2248 1.0', 610, 255);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Thin Rim', 610, 275);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('K = I / (m\u00B7r\u00B2) \u2014 Higher K = more energy per unit mass', W / 2, 340);
  }

  function drawFlywheelTypesDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Three Main Flywheel Types', W / 2, 35);

    /* Solid Disk */
    drawMiniFlywheelDisk(170, 180, 65, '#558b2f');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#558b2f';
    ctx.fillText('Solid Disk', 170, 270);
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Simple, cheap', 170, 290);
    ctx.fillText('I = \u00BDmr\u00B2', 170, 306);

    /* Ring */
    drawMiniFlywheelRing(450, 180, 65, 40, '#7cb342');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7cb342';
    ctx.fillText('Ring / Hollow', 450, 270);
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Higher I per mass', 450, 290);
    ctx.fillText('I = \u00BDm(r\u2081\u00B2+r\u2082\u00B2)', 450, 306);

    /* Spoke-Hub */
    var sx = 730, sy = 180;
    /* Rim */
    ctx.beginPath();
    ctx.arc(sx, sy, 65, 0, Math.PI * 2);
    ctx.arc(sx, sy, 55, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(245,200,66,0.3)';
    ctx.fill();
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, 65, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(sx, sy, 55, 0, Math.PI * 2); ctx.stroke();
    /* Hub */
    ctx.beginPath(); ctx.arc(sx, sy, 12, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245,200,66,0.2)'; ctx.fill();
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5; ctx.stroke();
    /* Spokes */
    ctx.strokeStyle = 'rgba(245,200,66,0.5)'; ctx.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(sx + 12 * Math.cos(a), sy + 12 * Math.sin(a));
      ctx.lineTo(sx + 55 * Math.cos(a), sy + 55 * Math.sin(a));
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#f5c842'; ctx.fill();

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Spoke-Hub', sx, 270);
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Best I/mass ratio', sx, 290);
    ctx.fillText('Light hub + heavy rim', sx, 306);
  }

  function drawEnergyDensityDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Energy Density Comparison', W / 2, 35);

    var bX = 120, bW = 600;
    /* Steel */
    ctx.fillStyle = '#b0bec5'; ctx.fillRect(bX, 80, bW * 0.15, 35);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'right';
    ctx.fillText('Steel', bX - 8, 100);
    ctx.textAlign = 'left';
    ctx.fillText('5\u201320 Wh/kg', bX + bW * 0.15 + 8, 100);

    /* Aluminium */
    ctx.fillStyle = '#e0e0e0'; ctx.fillRect(bX, 130, bW * 0.25, 35);
    ctx.textAlign = 'right';
    ctx.fillText('Aluminium', bX - 8, 150);
    ctx.textAlign = 'left';
    ctx.fillText('10\u201330 Wh/kg', bX + bW * 0.25 + 8, 150);

    /* Composite */
    ctx.fillStyle = '#558b2f'; ctx.fillRect(bX, 180, bW * 0.7, 35);
    ctx.textAlign = 'right';
    ctx.fillText('Carbon Composite', bX - 8, 200);
    ctx.textAlign = 'left';
    ctx.fillText('50\u2013100 Wh/kg', bX + bW * 0.7 + 8, 200);

    /* Li-ion comparison */
    ctx.fillStyle = '#42a5f5'; ctx.fillRect(bX, 240, bW * 1.0, 35);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Li-ion battery', bX - 8, 260);
    ctx.textAlign = 'left';
    ctx.fillText('150\u2013250 Wh/kg', bX + bW + 8, 260);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Flywheels trade energy density for power density and cycle life', W / 2, 320);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Flywheels: 100,000+ cycles  |  Li-ion: 1,000\u20135,000 cycles', W / 2, 345);
  }

  function drawHoopStressDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Hoop Stress in a Spinning Flywheel', W / 2, 35);

    /* Flywheel with stress arrows */
    var cx = 350, cy = 200, r = 80;
    drawMiniFlywheelRing(cx, cy, r, 55, '#558b2f');
    drawMiniArrowCurve(cx, cy, r + 15, -0.4, 0.4, '#7cb342');

    /* Outward arrows (centrifugal) */
    var colors = '#ff5555';
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      var x1 = cx + (r - 12) * Math.cos(a);
      var y1 = cy + (r - 12) * Math.sin(a);
      var x2 = cx + (r + 20) * Math.cos(a);
      var y2 = cy + (r + 20) * Math.sin(a);
      ctx.strokeStyle = colors; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = colors;
      ctx.beginPath();
      ctx.moveTo(x2 + 3 * Math.cos(a), y2 + 3 * Math.sin(a));
      ctx.lineTo(x2 - 4 * Math.sin(a), y2 + 4 * Math.cos(a));
      ctx.lineTo(x2 + 4 * Math.sin(a), y2 - 4 * Math.cos(a));
      ctx.closePath(); ctx.fill();
    }

    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('\u03C3 = \u03C1\u03C9\u00B2r\u00B2', cx, cy + r + 50);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('\u03C1 = density (kg/m\u00B3)', 650, 140);
    ctx.fillText('\u03C9 = angular velocity (rad/s)', 650, 160);
    ctx.fillText('r = outer radius (m)', 650, 180);

    ctx.fillStyle = '#f5c842';
    ctx.fillText('Stress \u221D v\u00B2_tip', 650, 220);
    ctx.fillText('Must stay below \u03C3_yield!', 650, 240);
  }

  function drawEfficiencyDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Flywheel Round-Trip Efficiency', W / 2, 35);

    /* Input arrow */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(100, 200); ctx.lineTo(250, 200); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(255, 200); ctx.lineTo(245, 195); ctx.lineTo(245, 205); ctx.closePath(); ctx.fill();
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('E_in = 100%', 175, 180);

    /* Flywheel */
    drawMiniFlywheelDisk(400, 200, 70, '#558b2f');
    drawMiniArrowCurve(400, 200, 85, -0.5, 0.5, '#7cb342');

    /* Output arrow */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(550, 200); ctx.lineTo(700, 200); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(705, 200); ctx.lineTo(695, 195); ctx.lineTo(695, 205); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('E_out = 85\u201395%', 625, 180);

    /* Losses */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(400, 280); ctx.lineTo(400, 340); ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.beginPath(); ctx.moveTo(400, 345); ctx.lineTo(395, 335); ctx.lineTo(405, 335); ctx.closePath(); ctx.fill();
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Losses: 5\u201315%', 400, 360);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Bearing friction', 400, 380);
    ctx.fillText('Windage / drag', 400, 396);
    ctx.fillText('Motor/generator', 400, 412);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      calculateAll();
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
    ctx.fillStyle = '#558b2f';
    ctx.fillText('Solve the flywheel problem below', W / 2, 65);

    /* Draw a sample flywheel */
    drawMiniFlywheelDisk(W / 2, 200, 80, '#558b2f');
    drawMiniArrowCurve(W / 2, 200, 100, -0.5, 0.5, '#7cb342');

    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#558b2f'; ctx.textAlign = 'center';
    ctx.fillText('KE = \u00BDI\u03C9\u00B2', W / 2, 330);
    ctx.fillStyle = '#7cb342';
    ctx.fillText('I = \u00BDmr\u00B2  |  \u03C9 = 2\u03C0N/60', W / 2, 355);
  }

  function drawQuizCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Quiz Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#558b2f';
    ctx.fillText('Answer the question below', W / 2, 65);

    drawMiniFlywheelRing(W / 2, 200, 80, 50, '#558b2f');
    drawMiniArrowCurve(W / 2, 200, 100, -0.6, 0.6, '#7cb342');

    /* Mini energy bar */
    ctx.fillStyle = '#1f2535';
    ctx.beginPath(); ctx.roundRect(W / 2 - 100, 330, 200, 20, 6); ctx.fill();
    ctx.fillStyle = 'rgba(85,139,47,0.5)';
    ctx.beginPath(); ctx.roundRect(W / 2 - 100, 330, 140, 20, 6); ctx.fill();
    ctx.font = '600 9px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Energy Stored', W / 2, 342);

    /* Formulas */
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#558b2f';
    ctx.fillText('\u03C3 = \u03C1\u03C9\u00B2r\u00B2', W / 2, 390);
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    $('#r-I').textContent = calc.I < 100 ? calc.I.toFixed(4) : calc.I.toFixed(1);
    $('#r-omega').textContent = calc.omega.toFixed(1);

    if (calc.KE < 1000) {
      $('#r-KE').textContent = calc.KE.toFixed(1);
      $('#r-KE').nextElementSibling.textContent = ' J';
    } else if (calc.KE < 1e6) {
      $('#r-KE').textContent = (calc.KE / 1000).toFixed(2);
      $('#r-KE').nextElementSibling.textContent = ' kJ';
    } else {
      $('#r-KE').textContent = (calc.KE / 1e6).toFixed(3);
      $('#r-KE').nextElementSibling.textContent = ' MJ';
    }

    $('#r-kWh').textContent = calc.kWh < 0.01 ? calc.kWh.toFixed(5) : calc.kWh.toFixed(4);
    $('#r-stress').textContent = calc.stress.toFixed(1);
    $('#r-dens').textContent = calc.energyDens.toFixed(2);
    $('#r-tip').textContent = calc.tipSpeed.toFixed(1);
    $('#r-sf').textContent = calc.sf > 99 ? '> 99' : calc.sf.toFixed(2);

    /* Color code safety factor */
    var sfEl = $('#r-sf');
    if (calc.sf >= 3) sfEl.style.color = '#3ddc84';
    else if (calc.sf >= 1.5) sfEl.style.color = '#f5c842';
    else sfEl.style.color = '#ff5555';
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000; /* seconds */
    lastTime = timestamp;

    if (mode === 'simulate') {
      /* Scale animation speed: at 50000 RPM the visual rotation is fast but capped for smoothness */
      var visualOmega = Math.min(calc.omega, 30); /* cap visual rad/s for smooth look */
      animAngle += visualOmega * dt;
      if (animAngle > Math.PI * 2) animAngle -= Math.PI * 2;
      render();
    }

    animId = requestAnimationFrame(animate);
  }

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
     UI — SIMULATE CONTROLS
     ================================================================ */

  /* Flywheel type tabs */
  $('#type-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    fwType = e.target.dataset.type;
    $$('#type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    /* Enable/disable inner radius slider */
    var innerSlider = $('#inner-slider');
    if (fwType === 'solid-disk') {
      innerSlider.disabled = true;
      fwInnerR = 0;
      innerSlider.value = 0;
      $('#inner-val').textContent = '0.00 m';
    } else {
      innerSlider.disabled = false;
      /* Ensure inner < outer */
      if (fwInnerR >= fwOuterR) {
        fwInnerR = +(fwOuterR * 0.5).toFixed(2);
        innerSlider.value = fwInnerR;
        $('#inner-val').textContent = fwInnerR.toFixed(2) + ' m';
      }
    }
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });

  /* Material tabs */
  $('#mat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    fwMaterial = e.target.dataset.mat;
    $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });

  /* Sliders */
  $('#mass-slider').addEventListener('input', function () {
    fwMass = +this.value;
    $('#mass-val').textContent = fwMass + ' kg';
  });
  $('#radius-slider').addEventListener('input', function () {
    fwOuterR = +parseFloat(this.value).toFixed(2);
    $('#radius-val').textContent = fwOuterR.toFixed(2) + ' m';
    /* Clamp inner radius */
    if (fwInnerR >= fwOuterR && fwType !== 'solid-disk') {
      fwInnerR = +(fwOuterR - 0.01).toFixed(2);
      if (fwInnerR < 0) fwInnerR = 0;
      $('#inner-slider').value = fwInnerR;
      $('#inner-val').textContent = fwInnerR.toFixed(2) + ' m';
    }
  });
  $('#inner-slider').addEventListener('input', function () {
    fwInnerR = +parseFloat(this.value).toFixed(2);
    /* Clamp to below outer radius */
    if (fwInnerR >= fwOuterR) {
      fwInnerR = +(fwOuterR - 0.01).toFixed(2);
      if (fwInnerR < 0) fwInnerR = 0;
      this.value = fwInnerR;
    }
    $('#inner-val').textContent = fwInnerR.toFixed(2) + ' m';
  });
  $('#rpm-slider').addEventListener('input', function () {
    fwRPM = +this.value;
    $('#rpm-val').textContent = fwRPM;
  });

  /* Presets */
  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var preset = btn.dataset.preset;
      if (!preset) return;
      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (preset === 'industrial') {
        setFWParams('solid-disk', 'steel', 80, 0.50, 0, 3000);
      } else if (preset === 'automotive') {
        setFWParams('solid-disk', 'steel', 15, 0.20, 0, 8000);
      } else if (preset === 'highspeed') {
        setFWParams('ring', 'composite', 10, 0.30, 0.20, 40000);
      } else if (preset === 'ups') {
        setFWParams('ring', 'steel', 50, 0.40, 0.25, 10000);
      }
      render();
    });
  });

  function setFWParams(type, mat, mass, r2, r1, rpm) {
    fwType = type;
    fwMaterial = mat;
    fwMass = mass;
    fwOuterR = r2;
    fwInnerR = r1;
    fwRPM = rpm;

    /* Update UI */
    $$('#type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.type === type); });
    $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mat === mat); });
    $('#mass-slider').value = mass;
    $('#mass-val').textContent = mass + ' kg';
    $('#radius-slider').value = r2;
    $('#radius-val').textContent = r2.toFixed(2) + ' m';
    $('#inner-slider').value = r1;
    $('#inner-val').textContent = r1.toFixed(2) + ' m';
    $('#inner-slider').disabled = (type === 'solid-disk');
    $('#rpm-slider').value = rpm;
    $('#rpm-val').textContent = rpm;
  }

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
    if (ok) pScore++;
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

  /* Enter key submits practice */
  $('#pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('#pp-check').click();
  });

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
      panel.querySelector('#qi-val').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') panel.querySelector('#q-submit').click();
      });
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
     INIT
     ================================================================ */
  setMode('simulate');
  animId = requestAnimationFrame(animate);

})();
