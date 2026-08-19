(function () {
  'use strict';

  /* ================================================================
     DATA \u2014 CONCEPTS  (12 concepts, 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* \u2500\u2500 Energy Basics \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    {
      id: 'kinetic-energy', name: 'Kinetic Energy (\u00bdI\u03c9\u00b2)', symbol: 'E = \u00bdI\u03c9\u00b2',
      formula: 'E = \u00bd I \u03c9\u00b2', unit: 'J',
      cat: 'energy',
      desc: 'The kinetic energy stored in a rotating flywheel is E = \u00bdI\u03c9\u00b2, where I is the moment of inertia (kg\u00b7m\u00b2) and \u03c9 is the angular velocity (rad/s). This is the rotational analogue of \u00bdmv\u00b2 for linear motion. Higher moment of inertia and higher speed both increase stored energy, but energy scales with the square of angular velocity \u2014 doubling the speed quadruples the energy.',
      diagram: 'kineticEnergy',
      example: { problem: 'A flywheel has I = 20 kg\u00b7m\u00b2 and rotates at 600 RPM. Find the kinetic energy stored.', steps: ['\u03c9 = 2\u03c0N/60 = 2\u03c0(600)/60 = 62.83 rad/s', 'E = \u00bdI\u03c9\u00b2', 'E = \u00bd \u00d7 20 \u00d7 62.83\u00b2', 'E = \u00bd \u00d7 20 \u00d7 3947.8 = 39478 J'], answer: 39478, unit: 'J' }
    },
    {
      id: 'moment-of-inertia', name: 'Moment of Inertia', symbol: 'I = \u00bdmr\u00b2 or mr\u00b2',
      formula: 'I_disc = \u00bdmr\u00b2, I_rim = mr\u00b2', unit: 'kg\u00b7m\u00b2',
      cat: 'energy',
      desc: 'Moment of inertia (I) is the rotational equivalent of mass. For a solid disc flywheel, I = \u00bdmr\u00b2. For a rim-type flywheel where most mass is concentrated at the outer radius, I \u2248 mr\u00b2. The moment of inertia determines how much energy the flywheel can store at a given speed and how much torque is needed to change its angular velocity.',
      diagram: 'momentOfInertia',
      example: { problem: 'A solid disc flywheel has mass 100 kg and radius 0.5 m. Find the moment of inertia.', steps: ['I = \u00bdmr\u00b2', 'I = \u00bd \u00d7 100 \u00d7 0.5\u00b2', 'I = \u00bd \u00d7 100 \u00d7 0.25', 'I = 12.5 kg\u00b7m\u00b2'], answer: 12.5, unit: 'kg\u00b7m\u00b2' }
    },
    {
      id: 'angular-velocity', name: 'Angular Velocity', symbol: '\u03c9 = 2\u03c0N/60',
      formula: '\u03c9 = 2\u03c0N/60', unit: 'rad/s',
      cat: 'energy',
      desc: 'Angular velocity (\u03c9) is the rate of rotation measured in radians per second. It is related to rotational speed N (in RPM) by the formula \u03c9 = 2\u03c0N/60. In flywheel calculations, angular velocity is preferred over RPM because it integrates directly into the kinetic energy equation. A flywheel spinning at 3000 RPM has \u03c9 = 314.16 rad/s.',
      diagram: 'angularVelocity',
      example: { problem: 'Convert 1500 RPM to angular velocity in rad/s.', steps: ['\u03c9 = 2\u03c0N/60', '\u03c9 = 2\u03c0(1500)/60', '\u03c9 = 9424.78/60', '\u03c9 = 157.08 rad/s'], answer: 157.08, unit: 'rad/s' }
    },
    {
      id: 'energy-capacity', name: 'Energy Storage Capacity', symbol: '\u0394E = I\u03c9\u00b2C_s',
      formula: '\u0394E = I \u03c9\u00b2 C_s', unit: 'J',
      cat: 'energy',
      desc: 'The useful energy storage capacity of a flywheel is not its total kinetic energy but the energy that can be exchanged during speed fluctuation. This is given by \u0394E = I\u03c9\u00b2C_s, where C_s is the coefficient of fluctuation. For a flywheel operating between \u03c9_max and \u03c9_min, the energy exchanged is \u0394E = \u00bdI(\u03c9_max\u00b2 \u2212 \u03c9_min\u00b2).',
      diagram: 'energyCapacity',
      example: { problem: 'A flywheel with I = 50 kg\u00b7m\u00b2 operates at mean \u03c9 = 100 rad/s with C_s = 0.04. Find the energy fluctuation.', steps: ['\u0394E = I\u03c9\u00b2C_s', '\u0394E = 50 \u00d7 100\u00b2 \u00d7 0.04', '\u0394E = 50 \u00d7 10000 \u00d7 0.04', '\u0394E = 20000 J = 20 kJ'], answer: 20000, unit: 'J' }
    },

    /* \u2500\u2500 Fluctuation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    {
      id: 'turning-moment', name: 'Turning Moment Diagram', symbol: 'T vs \u03b8',
      formula: 'T(\u03b8) = F \u00d7 r \u00d7 sin(\u03b8 + \u03c6)', unit: 'N\u00b7m',
      cat: 'fluctuation',
      desc: 'A turning moment diagram plots the instantaneous torque output from an engine or machine against the crank angle (\u03b8). For a single-cylinder four-stroke engine, the cycle spans 720\u00b0. The torque varies widely \u2014 peaking during the power stroke and dropping to negative values during compression. The diagram is the basis for calculating energy surplus, deficit, and flywheel requirements.',
      diagram: 'turningMoment',
      example: { problem: 'An engine produces a peak torque of 400 N\u00b7m at \u03b8 = 45\u00b0. The torque follows T = 400 sin(\u03b8). Find T at \u03b8 = 30\u00b0.', steps: ['T = 400 sin(\u03b8)', 'T = 400 \u00d7 sin(30\u00b0)', 'T = 400 \u00d7 0.5', 'T = 200 N\u00b7m'], answer: 200, unit: 'N\u00b7m' }
    },
    {
      id: 'coeff-fluctuation', name: 'Coefficient of Fluctuation', symbol: 'C_s = \u0394\u03c9/\u03c9_mean',
      formula: 'C_s = (\u03c9_max \u2212 \u03c9_min) / \u03c9_mean', unit: '\u2014',
      cat: 'fluctuation',
      desc: 'The coefficient of fluctuation of speed (C_s) measures how much the flywheel speed varies during one cycle. C_s = (N_max \u2212 N_min)/N_mean. Typical values: spinning/weaving (0.01\u20130.02), machine tools (0.02\u20130.03), pumps (0.03\u20130.05), engines (0.02\u20130.03), punch presses (0.10\u20130.15), crushing machines (0.15\u20130.20). A smaller C_s requires a heavier flywheel.',
      diagram: 'coeffFluctuation',
      example: { problem: 'A flywheel has N_max = 210 RPM and N_min = 190 RPM. Find the coefficient of fluctuation.', steps: ['N_mean = (N_max + N_min)/2 = (210+190)/2 = 200', 'C_s = (N_max \u2212 N_min)/N_mean', 'C_s = (210 \u2212 190)/200', 'C_s = 20/200 = 0.10'], answer: 0.10, unit: '' }
    },
    {
      id: 'mean-torque', name: 'Mean Torque', symbol: 'T_mean = P/\u03c9',
      formula: 'T_mean = P / \u03c9 = Work per cycle / (2\u03c0 or 4\u03c0)', unit: 'N\u00b7m',
      cat: 'fluctuation',
      desc: 'Mean torque (T_mean) is the average resistance torque over one complete cycle. It equals the power divided by the mean angular velocity: T_mean = P/\u03c9. On the turning moment diagram, the mean torque line divides the area equally \u2014 total surplus area above equals total deficit area below. For a four-stroke engine, T_mean = Work per cycle / 4\u03c0.',
      diagram: 'meanTorque',
      example: { problem: 'An engine delivers 50 kW at 1500 RPM. Find the mean torque.', steps: ['\u03c9 = 2\u03c0(1500)/60 = 157.08 rad/s', 'T_mean = P/\u03c9', 'T_mean = 50000/157.08', 'T_mean = 318.3 N\u00b7m'], answer: 318.3, unit: 'N\u00b7m' }
    },
    {
      id: 'energy-surplus-deficit', name: 'Energy Surplus & Deficit', symbol: '\u0394E = \u222bT d\u03b8',
      formula: '\u0394E = \u222b(T \u2212 T_mean) d\u03b8', unit: 'J',
      cat: 'fluctuation',
      desc: 'Energy surplus occurs when instantaneous torque exceeds the mean torque \u2014 the flywheel absorbs energy and speeds up. Energy deficit occurs when torque falls below the mean \u2014 the flywheel releases energy and slows down. The maximum fluctuation of energy (\u0394E_max) is the algebraic difference between the highest and lowest cumulative energy levels, and determines the required flywheel size.',
      diagram: 'energySurplusDeficit',
      example: { problem: 'A turning moment diagram has surplus areas of 5000 J and 3000 J, and deficit areas of 4000 J and 4000 J. Find the maximum energy fluctuation.', steps: ['Cumulative: 0, +5000, +1000, +4000, 0', 'Max cumulative = 5000 J', 'Min cumulative = 0 J', '\u0394E_max = 5000 \u2212 0 = 5000 J'], answer: 5000, unit: 'J' }
    },

    /* \u2500\u2500 Design \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
    {
      id: 'flywheel-types', name: 'Flywheel Types (Disc/Rim)', symbol: 'Disc vs Rim',
      formula: 'Disc: I=\u00bdmr\u00b2, Rim: I=mr\u00b2', unit: 'kg\u00b7m\u00b2',
      cat: 'design',
      desc: 'There are two main flywheel types: disc-type and rim-type (also called arm/spoke type). A solid disc flywheel is simpler and has I = \u00bdmr\u00b2. A rim-type flywheel concentrates mass at the outer radius connected by arms/spokes, giving I \u2248 mr\u00b2 (nearly double the disc for the same mass). Rim-type flywheels are more efficient for energy storage but experience higher hoop stresses at the rim.',
      diagram: 'flywheelTypes',
      example: { problem: 'Compare I for a 200 kg, 0.6 m radius flywheel as disc vs rim type.', steps: ['Disc: I = \u00bdmr\u00b2 = \u00bd(200)(0.6\u00b2) = 36 kg\u00b7m\u00b2', 'Rim: I = mr\u00b2 = 200(0.6\u00b2) = 72 kg\u00b7m\u00b2', 'Ratio: Rim/Disc = 72/36 = 2', 'Rim type stores twice the energy at same speed'], answer: 72, unit: 'kg\u00b7m\u00b2' }
    },
    {
      id: 'material-selection', name: 'Material Selection', symbol: '\u03c3 = \u03c1v\u00b2',
      formula: '\u03c3_hoop = \u03c1 v\u00b2 = \u03c1 \u03c9\u00b2 r\u00b2', unit: 'Pa',
      cat: 'design',
      desc: 'Material selection for flywheels involves balancing strength, density, and cost. The hoop stress in a rotating rim is \u03c3 = \u03c1v\u00b2 where v is the rim velocity. Common materials include cast iron (\u03c1=7200 kg/m\u00b3, \u03c3_allow=20 MPa), steel (\u03c1=7800, \u03c3=150 MPa), and carbon fibre composites (\u03c1=1600, \u03c3=1000 MPa). The maximum tip speed is limited by v_max = \u221a(\u03c3_allow/\u03c1).',
      diagram: 'materialSelection',
      example: { problem: 'A steel rim flywheel (r=0.4 m) spins at 3000 RPM (\u03c1=7800 kg/m\u00b3). Find the hoop stress.', steps: ['v = \u03c9r = (2\u03c0\u00d73000/60)(0.4) = 125.66 m/s', '\u03c3 = \u03c1v\u00b2', '\u03c3 = 7800 \u00d7 125.66\u00b2', '\u03c3 = 7800 \u00d7 15790.4 = 123.2 MPa'], answer: 123.2, unit: 'MPa' }
    },
    {
      id: 'stress-analysis', name: 'Stress Analysis', symbol: '\u03c3 = \u03c1\u03c9\u00b2r\u00b2',
      formula: '\u03c3_max = \u03c1 \u03c9\u00b2 r\u00b2 (rim), \u03c3_disc = \u03c1\u03c9\u00b2r\u00b2(3+\u03bd)/8', unit: 'Pa',
      cat: 'design',
      desc: 'For a thin rotating rim, the hoop (tangential) stress is uniform: \u03c3 = \u03c1\u03c9\u00b2r\u00b2. For a solid disc, the maximum stress occurs at the centre: \u03c3_max = \u03c1\u03c9\u00b2r\u00b2(3+\u03bd)/8, where \u03bd is Poisson\'s ratio (\u22480.3 for steel). The bursting speed occurs when stress equals the material\'s ultimate tensile strength. A safety factor of 3\u20134 is typically used.',
      diagram: 'stressAnalysis',
      example: { problem: 'A rim flywheel: r=0.3 m, \u03c9=200 rad/s, \u03c1=7200 kg/m\u00b3. Find the hoop stress in MPa.', steps: ['\u03c3 = \u03c1\u03c9\u00b2r\u00b2', '\u03c3 = 7200 \u00d7 200\u00b2 \u00d7 0.3\u00b2', '\u03c3 = 7200 \u00d7 40000 \u00d7 0.09', '\u03c3 = 25920000 Pa = 25.92 MPa'], answer: 25.92, unit: 'MPa' }
    },
    {
      id: 'applications', name: 'Applications', symbol: 'Engine / Press / Wind',
      formula: 'I = \u0394E / (\u03c9\u00b2 C_s)', unit: 'kg\u00b7m\u00b2',
      cat: 'design',
      desc: 'Flywheels are used in diverse applications: (1) IC engines \u2014 smooth pulsating torque from combustion cycles. (2) Punch presses \u2014 store energy between punches, deliver it in milliseconds. (3) Wind energy \u2014 buffer variable wind input against steady generator load. (4) Regenerative braking \u2014 capture braking kinetic energy for later use. Each application has different C_s requirements and design constraints.',
      diagram: 'applications',
      example: { problem: 'A punch press needs \u0394E = 10 kJ with C_s = 0.15 at 300 RPM. Find the required I.', steps: ['\u03c9 = 2\u03c0(300)/60 = 31.42 rad/s', 'I = \u0394E / (\u03c9\u00b2 C_s)', 'I = 10000 / (31.42\u00b2 \u00d7 0.15)', 'I = 10000 / 148.1 = 67.53 kg\u00b7m\u00b2'], answer: 67.53, unit: 'kg\u00b7m\u00b2' }
    }
  ];

  /* ================================================================
     DATA \u2014 PROBLEM GENERATORS (12)
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 \u2014 Kinetic energy from I and RPM */
    function () {
      var I = randInt(5, 80);
      var N = randInt(200, 2000);
      var w = 2 * Math.PI * N / 60;
      var E = +(0.5 * I * w * w).toFixed(1);
      return { prompt: 'A flywheel has I = ' + I + ' kg\u00b7m\u00b2 and rotates at ' + N + ' RPM. Find the kinetic energy stored (J).', steps: ['\u03c9 = 2\u03c0(' + N + ')/60 = ' + w.toFixed(2) + ' rad/s', 'E = \u00bdI\u03c9\u00b2', 'E = 0.5 \u00d7 ' + I + ' \u00d7 ' + w.toFixed(2) + '\u00b2', 'E = ' + E + ' J'], answer: E, unit: 'J', tol: 5 };
    },
    /* 1 \u2014 Moment of inertia (disc) */
    function () {
      var m = randInt(20, 300);
      var r = +(0.2 + Math.random() * 1.0).toFixed(2);
      var I = +(0.5 * m * r * r).toFixed(2);
      return { prompt: 'A solid disc flywheel: mass = ' + m + ' kg, radius = ' + r + ' m. Find I (kg\u00b7m\u00b2).', steps: ['I = \u00bdmr\u00b2', 'I = 0.5 \u00d7 ' + m + ' \u00d7 ' + r + '\u00b2', 'I = 0.5 \u00d7 ' + m + ' \u00d7 ' + (r * r).toFixed(4), 'I = ' + I + ' kg\u00b7m\u00b2'], answer: I, unit: 'kg\u00b7m\u00b2', tol: 0.1 };
    },
    /* 2 \u2014 Coefficient of fluctuation */
    function () {
      var Nmax = randInt(300, 1000);
      var diff = randInt(5, Math.max(6, Math.floor(Nmax * 0.15)));
      var Nmin = Nmax - diff;
      var Nmean = (Nmax + Nmin) / 2;
      var Cs = +((Nmax - Nmin) / Nmean).toFixed(4);
      return { prompt: 'N_max = ' + Nmax + ' RPM, N_min = ' + Nmin + ' RPM. Find the coefficient of fluctuation C_s.', steps: ['N_mean = (' + Nmax + '+' + Nmin + ')/2 = ' + Nmean.toFixed(1), 'C_s = (N_max \u2212 N_min)/N_mean', 'C_s = ' + diff + '/' + Nmean.toFixed(1), 'C_s = ' + Cs], answer: Cs, unit: '', tol: 0.002 };
    },
    /* 3 \u2014 Mean torque from power and RPM */
    function () {
      var P = randInt(5, 200);
      var N = randInt(300, 3000);
      var w = 2 * Math.PI * N / 60;
      var T = +(P * 1000 / w).toFixed(1);
      return { prompt: 'An engine delivers ' + P + ' kW at ' + N + ' RPM. Find the mean torque (N\u00b7m).', steps: ['\u03c9 = 2\u03c0(' + N + ')/60 = ' + w.toFixed(2) + ' rad/s', 'T_mean = P/\u03c9', 'T_mean = ' + (P * 1000) + '/' + w.toFixed(2), 'T_mean = ' + T + ' N\u00b7m'], answer: T, unit: 'N\u00b7m', tol: 1 };
    },
    /* 4 \u2014 Energy stored (fluctuation) */
    function () {
      var I = randInt(10, 100);
      var N = randInt(300, 1500);
      var w = 2 * Math.PI * N / 60;
      var Cs = +(0.02 + Math.random() * 0.13).toFixed(2);
      var dE = +(I * w * w * Cs).toFixed(1);
      return { prompt: 'Flywheel: I = ' + I + ' kg\u00b7m\u00b2, N_mean = ' + N + ' RPM, C_s = ' + Cs + '. Find \u0394E (J).', steps: ['\u03c9 = 2\u03c0(' + N + ')/60 = ' + w.toFixed(2) + ' rad/s', '\u0394E = I\u03c9\u00b2C_s', '\u0394E = ' + I + ' \u00d7 ' + (w * w).toFixed(1) + ' \u00d7 ' + Cs, '\u0394E = ' + dE + ' J'], answer: dE, unit: 'J', tol: 5 };
    },
    /* 5 \u2014 Maximum speed from energy */
    function () {
      var I = randInt(10, 60);
      var E = randInt(5000, 80000);
      var w = Math.sqrt(2 * E / I);
      var N = +(w * 60 / (2 * Math.PI)).toFixed(1);
      return { prompt: 'A flywheel (I = ' + I + ' kg\u00b7m\u00b2) stores ' + E + ' J. What is the rotational speed in RPM?', steps: ['E = \u00bdI\u03c9\u00b2 \u2192 \u03c9 = \u221a(2E/I)', '\u03c9 = \u221a(2\u00d7' + E + '/' + I + ') = ' + w.toFixed(2) + ' rad/s', 'N = \u03c9\u00d760/(2\u03c0)', 'N = ' + N + ' RPM'], answer: N, unit: 'RPM', tol: 1 };
    },
    /* 6 \u2014 Mass from energy requirement */
    function () {
      var r = +(0.3 + Math.random() * 0.7).toFixed(2);
      var N = randInt(300, 1500);
      var w = 2 * Math.PI * N / 60;
      var dE = randInt(2000, 30000);
      var Cs = +(0.02 + Math.random() * 0.08).toFixed(2);
      var I = dE / (w * w * Cs);
      var m = +(2 * I / (r * r)).toFixed(1);
      return { prompt: 'A disc flywheel (r=' + r + ' m) at ' + N + ' RPM needs \u0394E = ' + dE + ' J with C_s = ' + Cs + '. Find the mass (kg).', steps: ['\u03c9 = 2\u03c0(' + N + ')/60 = ' + w.toFixed(2) + ' rad/s', 'I = \u0394E/(\u03c9\u00b2C_s) = ' + dE + '/(' + (w * w).toFixed(1) + '\u00d7' + Cs + ') = ' + I.toFixed(2) + ' kg\u00b7m\u00b2', 'm = 2I/r\u00b2 = 2\u00d7' + I.toFixed(2) + '/' + (r * r).toFixed(4), 'm = ' + m + ' kg'], answer: m, unit: 'kg', tol: 2 };
    },
    /* 7 \u2014 Angular velocity conversion */
    function () {
      var N = randInt(100, 5000);
      var w = +(2 * Math.PI * N / 60).toFixed(2);
      return { prompt: 'Convert ' + N + ' RPM to rad/s.', steps: ['\u03c9 = 2\u03c0N/60', '\u03c9 = 2\u03c0(' + N + ')/60', '\u03c9 = ' + (2 * Math.PI * N).toFixed(2) + '/60', '\u03c9 = ' + w + ' rad/s'], answer: +w, unit: 'rad/s', tol: 0.1 };
    },
    /* 8 \u2014 Rim stress */
    function () {
      var rho = [7200, 7800][randInt(0, 1)];
      var mat = rho === 7200 ? 'cast iron' : 'steel';
      var r = +(0.2 + Math.random() * 0.6).toFixed(2);
      var N = randInt(500, 3000);
      var w = 2 * Math.PI * N / 60;
      var sigma = +(rho * w * w * r * r / 1e6).toFixed(2);
      return { prompt: 'A ' + mat + ' rim flywheel (\u03c1=' + rho + ' kg/m\u00b3, r=' + r + ' m) at ' + N + ' RPM. Find hoop stress (MPa).', steps: ['\u03c9 = 2\u03c0(' + N + ')/60 = ' + w.toFixed(2) + ' rad/s', '\u03c3 = \u03c1\u03c9\u00b2r\u00b2', '\u03c3 = ' + rho + ' \u00d7 ' + (w * w).toFixed(1) + ' \u00d7 ' + (r * r).toFixed(4), '\u03c3 = ' + sigma + ' MPa'], answer: sigma, unit: 'MPa', tol: 0.5 };
    },
    /* 9 \u2014 Flywheel sizing (I from \u0394E) */
    function () {
      var dE = randInt(3000, 50000);
      var N = randInt(300, 1500);
      var w = 2 * Math.PI * N / 60;
      var Cs = +(0.02 + Math.random() * 0.13).toFixed(2);
      var I = +(dE / (w * w * Cs)).toFixed(2);
      return { prompt: 'Find the required I for \u0394E = ' + dE + ' J at ' + N + ' RPM with C_s = ' + Cs + ' (kg\u00b7m\u00b2).', steps: ['\u03c9 = 2\u03c0(' + N + ')/60 = ' + w.toFixed(2) + ' rad/s', 'I = \u0394E/(\u03c9\u00b2C_s)', 'I = ' + dE + '/(' + (w * w).toFixed(1) + ' \u00d7 ' + Cs + ')', 'I = ' + I + ' kg\u00b7m\u00b2'], answer: I, unit: 'kg\u00b7m\u00b2', tol: 0.5 };
    },
    /* 10 \u2014 Energy surplus calculation */
    function () {
      var Tmax = randInt(200, 800);
      var Tmean = randInt(50, Math.floor(Tmax * 0.6));
      var span = randInt(30, 120);
      var spanRad = +(span * Math.PI / 180).toFixed(3);
      var surplus = +((Tmax - Tmean) * spanRad / 2).toFixed(1);
      return { prompt: 'Peak torque = ' + Tmax + ' N\u00b7m, mean torque = ' + Tmean + ' N\u00b7m. Surplus spans ' + span + '\u00b0 (triangular). Find surplus energy (J).', steps: ['Span in radians = ' + span + '\u00b0 \u00d7 \u03c0/180 = ' + spanRad + ' rad', 'Surplus area = \u00bd(T_max \u2212 T_mean)(\u03b8)', 'Surplus = 0.5 \u00d7 ' + (Tmax - Tmean) + ' \u00d7 ' + spanRad, 'Surplus = ' + surplus + ' J'], answer: surplus, unit: 'J', tol: 1 };
    },
    /* 11 \u2014 Speed range from C_s */
    function () {
      var Nmean = randInt(300, 2000);
      var Cs = +(0.02 + Math.random() * 0.13).toFixed(2);
      var Nmax = +(Nmean * (1 + Cs / 2)).toFixed(1);
      var Nmin = +(Nmean * (1 - Cs / 2)).toFixed(1);
      return { prompt: 'N_mean = ' + Nmean + ' RPM, C_s = ' + Cs + '. Find N_max (RPM).', steps: ['N_max = N_mean(1 + C_s/2)', 'N_max = ' + Nmean + '(1 + ' + (Cs / 2).toFixed(3) + ')', 'N_max = ' + Nmean + ' \u00d7 ' + (1 + Cs / 2).toFixed(4), 'N_max = ' + Nmax + ' RPM'], answer: Nmax, unit: 'RPM', tol: 1 };
    }
  ];

  /* ================================================================
     DATA \u2014 QUIZ POOL (15 = 10 MCQ + 5 numeric)
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0\u20139 */
    { q: 'The kinetic energy stored in a flywheel is proportional to:', opts: ['\u03c9', '\u03c9\u00b2', '\u03c9\u00b3', '1/\u03c9'], ans: 1 },
    { q: 'For a solid disc flywheel, the moment of inertia equals:', opts: ['mr\u00b2', '\u00bcmr\u00b2', '\u00bdmr\u00b2', '2mr\u00b2'], ans: 2 },
    { q: 'The coefficient of fluctuation (C_s) for a spinning machine is typically:', opts: ['0.15\u20130.20', '0.10\u20130.15', '0.01\u20130.02', '0.50\u20131.00'], ans: 2 },
    { q: 'On a turning moment diagram, areas above the mean torque line represent:', opts: ['Energy deficit', 'Energy surplus', 'Constant speed', 'Braking'], ans: 1 },
    { q: 'A rim-type flywheel has I equal to:', opts: ['\u00bdmr\u00b2', '\u00bcmr\u00b2', '2mr\u00b2', 'mr\u00b2'], ans: 3 },
    { q: 'The hoop stress in a rotating thin rim is:', opts: ['\u03c1\u03c9r', '\u03c1\u03c9\u00b2r\u00b2', '\u03c1\u03c9\u00b2r', 'mr\u03c9\u00b2'], ans: 1 },
    { q: 'Doubling the angular velocity of a flywheel increases stored energy by a factor of:', opts: ['2', '4', '8', '\u221a2'], ans: 1 },
    { q: 'Which application typically requires the highest C_s?', opts: ['Spinning machines', 'Engine crankshaft', 'Punch press', 'Precision lathe'], ans: 2 },
    { q: 'The turning moment diagram for a 4-stroke engine spans:', opts: ['180\u00b0', '360\u00b0', '540\u00b0', '720\u00b0'], ans: 3 },
    { q: 'In flywheel design, the maximum energy fluctuation determines:', opts: ['Material type', 'Shaft diameter', 'Required moment of inertia', 'Number of cylinders'], ans: 2 },
    /* Numeric 10\u201314 */
    { q: 'A flywheel (I=30 kg\u00b7m\u00b2) at 500 RPM. KE (J) =', type: 'numeric', ans: 41123.4, tol: 10, unit: 'J' },
    { q: 'Disc flywheel: m=150 kg, r=0.4 m. I (kg\u00b7m\u00b2) =', type: 'numeric', ans: 12, tol: 0.1, unit: 'kg\u00b7m\u00b2' },
    { q: 'N_max=520 RPM, N_min=480 RPM. C_s =', type: 'numeric', ans: 0.08, tol: 0.005, unit: '' },
    { q: '\u0394E=8000 J, N=600 RPM, C_s=0.05. Required I (kg\u00b7m\u00b2) =', type: 'numeric', ans: 40.53, tol: 0.5, unit: 'kg\u00b7m\u00b2' },
    { q: 'Engine: 75 kW at 1200 RPM. Mean torque (N\u00b7m) =', type: 'numeric', ans: 596.83, tol: 1, unit: 'N\u00b7m' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */

  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;
  var DPR = Math.max(window.devicePixelRatio || 1, 1);
  cvs.width = W * DPR; cvs.height = H * DPR;
  cvs.style.maxWidth = W + 'px';
  ctx.scale(DPR, DPR);

  var modeTabs    = document.getElementById('mode-tabs');
  var simPanel    = document.getElementById('sim-panel');
  var catRow      = document.getElementById('cat-row');
  var catTabs     = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo    = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var quizPanel   = document.getElementById('quiz-panel');
  var quizBar     = document.getElementById('quiz-bar');
  var quizResult  = document.getElementById('quiz-result');

  var appTabs     = document.getElementById('app-tabs');
  var slMass      = document.getElementById('sl-mass');
  var slRadius    = document.getElementById('sl-radius');
  var slRpm       = document.getElementById('sl-rpm');
  var slLoad      = document.getElementById('sl-load');
  var valMass     = document.getElementById('val-mass');
  var valRadius   = document.getElementById('val-radius');
  var valRpm      = document.getElementById('val-rpm');
  var valLoad     = document.getElementById('val-load');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var appType = 'engine';
  var mass = 80, radius = 0.5, rpm = 600, loadVar = 30;
  var flyAngle = 0;
  var animRunning = true;
  var animId = null;
  var exploreCat = 'energy', exploreItem = null;

  /* Practice state */
  var pCorrect = 0, pTotal = 0, currentProblem = null, pAnswered = false;
  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizAnswers = [], quizLocked = false;

  /* ================================================================
     HELPERS
     ================================================================ */

  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = randInt(0, i); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } return arr; }
  function fmt(v, d) { return Number(v).toFixed(d === undefined ? 2 : d); }

  /* ================================================================
     PHYSICS
     ================================================================ */

  function omega() { return 2 * Math.PI * rpm / 60; }
  function momentOfInertia() { return 0.5 * mass * radius * radius; }
  function kineticEnergy() { var w = omega(); return 0.5 * momentOfInertia() * w * w; }

  /* Torque profile generators: return array of {angle, torque} */
  function engineTorqueProfile() {
    // 4-stroke engine: 720 degrees, sinusoidal power stroke with compression resistance
    var pts = [];
    var meanT = kineticEnergy() > 0 ? (loadVar / 100) * 500 + 50 : 100;
    var peakT = meanT * (1 + loadVar / 40);
    for (var deg = 0; deg <= 720; deg += 2) {
      var rad = deg * Math.PI / 180;
      var t = 0;
      if (deg <= 180) {
        // Power stroke
        t = peakT * Math.sin(rad) * 1.2;
      } else if (deg <= 360) {
        // Compression
        t = -meanT * 0.3 * Math.sin(rad - Math.PI);
      } else if (deg <= 540) {
        // Exhaust (small resistance)
        t = -meanT * 0.15 * Math.sin(rad - 2 * Math.PI);
      } else {
        // Intake (small negative)
        t = -meanT * 0.1 * Math.sin(rad - 3 * Math.PI);
      }
      pts.push({ angle: deg, torque: t });
    }
    return pts;
  }

  function punchPressTorqueProfile() {
    // Sudden load spike between 80-120 degrees
    var pts = [];
    var meanT = (loadVar / 100) * 300 + 30;
    var peakT = meanT * (2 + loadVar / 20);
    for (var deg = 0; deg <= 360; deg += 2) {
      var t = meanT * 0.1;
      if (deg >= 80 && deg <= 120) {
        var fraction = (deg - 80) / 40;
        t = peakT * Math.sin(fraction * Math.PI);
      }
      pts.push({ angle: deg, torque: t });
    }
    return pts;
  }

  function windEnergyTorqueProfile() {
    // Variable input torque, constant output line
    var pts = [];
    var meanT = (loadVar / 100) * 200 + 40;
    for (var deg = 0; deg <= 360; deg += 2) {
      var rad = deg * Math.PI / 180;
      var t = meanT * (1 + 0.5 * Math.sin(rad) + 0.3 * Math.sin(3 * rad) + 0.15 * Math.cos(2 * rad));
      pts.push({ angle: deg, torque: Math.max(t, 0) });
    }
    return pts;
  }

  function brakingTorqueProfile() {
    // Energy absorption: starts high, decays exponentially
    var pts = [];
    var peakT = (loadVar / 100) * 600 + 100;
    for (var deg = 0; deg <= 360; deg += 2) {
      var fraction = deg / 360;
      var t = peakT * Math.exp(-3 * fraction) * (1 + 0.2 * Math.sin(8 * fraction * Math.PI));
      pts.push({ angle: deg, torque: Math.max(t, 0) });
    }
    return pts;
  }

  function getTorqueProfile() {
    if (appType === 'engine') return engineTorqueProfile();
    if (appType === 'punch-press') return punchPressTorqueProfile();
    if (appType === 'wind-energy') return windEnergyTorqueProfile();
    return brakingTorqueProfile();
  }

  function getTotalAngle() {
    return appType === 'engine' ? 720 : 360;
  }

  function computeMeanTorque(profile) {
    var sum = 0;
    for (var i = 0; i < profile.length; i++) sum += profile[i].torque;
    return sum / profile.length;
  }

  function computeMaxTorque(profile) {
    var mx = -Infinity;
    for (var i = 0; i < profile.length; i++) if (profile[i].torque > mx) mx = profile[i].torque;
    return mx;
  }

  function computeEnergySurplus(profile, meanT) {
    var maxSurplus = 0;
    var cumulative = 0;
    var minCum = 0;
    var step = profile.length > 1 ? (profile[1].angle - profile[0].angle) * Math.PI / 180 : 0;
    for (var i = 0; i < profile.length; i++) {
      cumulative += (profile[i].torque - meanT) * step;
      if (cumulative > maxSurplus) maxSurplus = cumulative;
      if (cumulative < minCum) minCum = cumulative;
    }
    return maxSurplus - minCum;
  }

  function computeCs() {
    var profile = getTorqueProfile();
    var meanT = computeMeanTorque(profile);
    var dE = computeEnergySurplus(profile, meanT);
    var w = omega();
    var I = momentOfInertia();
    if (I * w * w < 1) return 0;
    return dE / (I * w * w);
  }

  /* ================================================================
     DRAWING \u2014 FLYWHEEL ANIMATION (left half of canvas)
     ================================================================ */

  var FW_CX = 200, FW_CY = 260, FW_R = 140;

  function drawFlywheel() {
    var w = omega();
    var I = momentOfInertia();
    var E = kineticEnergy();
    var Cs = computeCs();

    // Determine energy state color
    var stateColor;
    var profile = getTorqueProfile();
    var meanT = computeMeanTorque(profile);
    var totalAngle = getTotalAngle();
    var currentAngleDeg = ((flyAngle * 180 / Math.PI) % totalAngle + totalAngle) % totalAngle;
    var currentTorque = 0;
    for (var i = 0; i < profile.length; i++) {
      if (profile[i].angle >= currentAngleDeg) {
        currentTorque = profile[i].torque;
        break;
      }
    }
    if (currentTorque > meanT * 1.1) {
      stateColor = '#3ddc84'; // green = storing
    } else if (currentTorque < meanT * 0.9) {
      stateColor = '#ff5555'; // red = releasing
    } else {
      stateColor = '#f5c842'; // gold = steady
    }

    // Title
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Flywheel Animation', FW_CX, 22);

    // Outer rim
    ctx.beginPath();
    ctx.arc(FW_CX, FW_CY, FW_R, 0, 2 * Math.PI);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#2a3050';
    ctx.stroke();

    // Energy level arc (partial circle showing stored energy as fraction of max)
    var maxE = 0.5 * I * (2 * Math.PI * 3000 / 60) * (2 * Math.PI * 3000 / 60);
    var fraction = maxE > 0 ? clamp(E / maxE, 0, 1) : 0;
    var arcEnd = -Math.PI / 2 + fraction * 2 * Math.PI;
    ctx.beginPath();
    ctx.arc(FW_CX, FW_CY, FW_R, -Math.PI / 2, arcEnd);
    ctx.lineWidth = 12;
    ctx.strokeStyle = stateColor;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Inner rim circle
    ctx.beginPath();
    ctx.arc(FW_CX, FW_CY, FW_R - 10, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#2a3050';
    ctx.stroke();

    // Rim thickness fill
    ctx.beginPath();
    ctx.arc(FW_CX, FW_CY, FW_R - 1, 0, 2 * Math.PI);
    ctx.arc(FW_CX, FW_CY, FW_R - 10, 0, 2 * Math.PI, true);
    ctx.fillStyle = 'rgba(85,139,47,0.12)';
    ctx.fill();

    // Spokes (6 lines rotating with flyAngle)
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(85,139,47,0.6)';
    for (var s = 0; s < 6; s++) {
      var spokeAngle = flyAngle + s * Math.PI / 3;
      var x1 = FW_CX + 18 * Math.cos(spokeAngle);
      var y1 = FW_CY + 18 * Math.sin(spokeAngle);
      var x2 = FW_CX + (FW_R - 14) * Math.cos(spokeAngle);
      var y2 = FW_CY + (FW_R - 14) * Math.sin(spokeAngle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Hub
    ctx.beginPath();
    ctx.arc(FW_CX, FW_CY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2535';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#558b2f';
    ctx.stroke();

    // Hub centre dot
    ctx.beginPath();
    ctx.arc(FW_CX, FW_CY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#8bc34a';
    ctx.fill();

    // Angular velocity indicator arc
    var velArcSpan = clamp(w / (2 * Math.PI * 3000 / 60), 0, 1) * 1.5 * Math.PI;
    if (velArcSpan > 0.05) {
      ctx.beginPath();
      ctx.arc(FW_CX, FW_CY, FW_R + 18, -Math.PI / 2, -Math.PI / 2 + velArcSpan);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#8bc34a';
      ctx.stroke();

      // Arrow at end of velocity arc
      var arrowAngle = -Math.PI / 2 + velArcSpan;
      var ax = FW_CX + (FW_R + 18) * Math.cos(arrowAngle);
      var ay = FW_CY + (FW_R + 18) * Math.sin(arrowAngle);
      ctx.beginPath();
      ctx.arc(ax, ay, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#8bc34a';
      ctx.fill();
    }

    // State text
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.fillStyle = stateColor;
    ctx.textAlign = 'center';
    var stateText = currentTorque > meanT * 1.1 ? 'STORING' : currentTorque < meanT * 0.9 ? 'RELEASING' : 'STEADY';
    ctx.fillText(stateText, FW_CX, FW_CY + FW_R + 40);

    // RPM text
    ctx.font = 'bold 13px Courier New, monospace';
    ctx.fillStyle = '#558b2f';
    ctx.fillText(rpm + ' RPM', FW_CX, FW_CY - FW_R - 24);

    // Energy text
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    var eText = E >= 1e6 ? fmt(E / 1e6, 1) + ' MJ' : E >= 1000 ? fmt(E / 1000, 1) + ' kJ' : fmt(E, 0) + ' J';
    ctx.fillText('E = ' + eText, FW_CX, FW_CY - FW_R - 10);
  }

  /* ================================================================
     DRAWING \u2014 TURNING MOMENT DIAGRAM (right half of canvas)
     ================================================================ */

  var TM_L = 430, TM_T = 40, TM_W = 440, TM_H = 420;

  function drawTurningMomentDiagram() {
    var profile = getTorqueProfile();
    var meanT = computeMeanTorque(profile);
    var maxT = computeMaxTorque(profile);
    var minT = Infinity;
    for (var i = 0; i < profile.length; i++) {
      if (profile[i].torque < minT) minT = profile[i].torque;
    }
    var totalAngle = getTotalAngle();

    // Padding
    var pL = 55, pR = 15, pT = 30, pB = 45;
    var plotW = TM_W - pL - pR;
    var plotH = TM_H - pT - pB;

    // Range
    var yMin = Math.min(minT, 0) * 1.1;
    var yMax = maxT * 1.15;
    if (yMax - yMin < 10) { yMax = 10; yMin = -2; }

    function toX(angle) { return TM_L + pL + (angle / totalAngle) * plotW; }
    function toY(torque) { return TM_T + pT + plotH - ((torque - yMin) / (yMax - yMin)) * plotH; }

    // Title
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Turning Moment Diagram', TM_L + TM_W / 2, TM_T + 10);

    // Axes
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;
    // X-axis
    ctx.beginPath();
    ctx.moveTo(TM_L + pL, TM_T + pT + plotH);
    ctx.lineTo(TM_L + pL + plotW + 5, TM_T + pT + plotH);
    ctx.stroke();
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(TM_L + pL, TM_T + pT + plotH);
    ctx.lineTo(TM_L + pL, TM_T + pT - 5);
    ctx.stroke();

    // Zero line (if yMin < 0)
    if (yMin < 0) {
      ctx.strokeStyle = '#4a5578';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(TM_L + pL, toY(0));
      ctx.lineTo(TM_L + pL + plotW, toY(0));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Axis labels
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Crank Angle (\u00b0)', TM_L + pL + plotW / 2, TM_T + TM_H - 5);
    ctx.save();
    ctx.translate(TM_L + 12, TM_T + pT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Torque (N\u00b7m)', 0, 0);
    ctx.restore();

    // X-axis tick marks
    ctx.font = '10px Courier New, monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    var xStep = totalAngle === 720 ? 180 : 90;
    for (var xa = 0; xa <= totalAngle; xa += xStep) {
      var xx = toX(xa);
      ctx.fillText(xa + '\u00b0', xx, TM_T + pT + plotH + 16);
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xx, TM_T + pT + plotH);
      ctx.lineTo(xx, TM_T + pT + plotH + 4);
      ctx.stroke();
    }

    // Y-axis tick marks
    ctx.textAlign = 'right';
    var ySteps = 5;
    var yRange = yMax - yMin;
    var yStepVal = yRange / ySteps;
    for (var yi = 0; yi <= ySteps; yi++) {
      var yv = yMin + yi * yStepVal;
      var yy = toY(yv);
      ctx.fillText(fmt(yv, 0), TM_L + pL - 6, yy + 4);
      // Grid line
      ctx.strokeStyle = '#1f2535';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(TM_L + pL, yy);
      ctx.lineTo(TM_L + pL + plotW, yy);
      ctx.stroke();
    }

    // Mean torque dashed line
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(TM_L + pL, toY(meanT));
    ctx.lineTo(TM_L + pL + plotW, toY(meanT));
    ctx.stroke();
    ctx.setLineDash([]);

    // Mean torque label
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'left';
    ctx.fillText('T_mean = ' + fmt(meanT, 1), TM_L + pL + plotW - 100, toY(meanT) - 6);

    // Shaded surplus (green) and deficit (red) areas
    var meanY = toY(meanT);
    for (var si = 0; si < profile.length - 1; si++) {
      var x1s = toX(profile[si].angle);
      var x2s = toX(profile[si + 1].angle);
      var y1s = toY(profile[si].torque);
      var y2s = toY(profile[si + 1].torque);

      if (profile[si].torque > meanT || profile[si + 1].torque > meanT) {
        // Surplus area (above mean)
        ctx.fillStyle = 'rgba(61,220,132,0.35)';
        ctx.beginPath();
        ctx.moveTo(x1s, Math.min(y1s, meanY));
        ctx.lineTo(x2s, Math.min(y2s, meanY));
        ctx.lineTo(x2s, meanY);
        ctx.lineTo(x1s, meanY);
        ctx.closePath();
        ctx.fill();
      }
      if (profile[si].torque < meanT || profile[si + 1].torque < meanT) {
        // Deficit area (below mean)
        ctx.fillStyle = 'rgba(255,85,85,0.35)';
        ctx.beginPath();
        ctx.moveTo(x1s, Math.max(y1s, meanY));
        ctx.lineTo(x2s, Math.max(y2s, meanY));
        ctx.lineTo(x2s, meanY);
        ctx.lineTo(x1s, meanY);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Torque curve
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var pi = 0; pi < profile.length; pi++) {
      var px = toX(profile[pi].angle);
      var py = toY(profile[pi].torque);
      if (pi === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Live marker tracking current angle
    var currentAngleDeg = ((flyAngle * 180 / Math.PI) % totalAngle + totalAngle) % totalAngle;
    var markerX = toX(currentAngleDeg);
    // Find torque at current angle
    var markerTorque = 0;
    for (var mi = 0; mi < profile.length; mi++) {
      if (profile[mi].angle >= currentAngleDeg) {
        markerTorque = profile[mi].torque;
        break;
      }
    }
    var markerY = toY(markerTorque);

    // Vertical tracking line
    ctx.strokeStyle = 'rgba(139,195,74,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(markerX, TM_T + pT);
    ctx.lineTo(markerX, TM_T + pT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Marker dot
    ctx.beginPath();
    ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#8bc34a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // Cs display
    var Cs = computeCs();
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.fillStyle = '#558b2f';
    ctx.textAlign = 'left';
    ctx.fillText('C_s = ' + fmt(Cs, 4), TM_L + pL + 5, TM_T + pT + 18);

    // Legend
    var legY = TM_T + pT + plotH + 30;
    ctx.font = '10px Segoe UI, sans-serif';

    ctx.fillStyle = 'rgba(61,220,132,0.6)';
    ctx.fillRect(TM_L + pL, legY - 8, 12, 10);
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'left';
    ctx.fillText('Surplus', TM_L + pL + 16, legY);

    ctx.fillStyle = 'rgba(255,85,85,0.6)';
    ctx.fillRect(TM_L + pL + 80, legY - 8, 12, 10);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Deficit', TM_L + pL + 96, legY);

    ctx.fillStyle = '#f5c842';
    ctx.fillRect(TM_L + pL + 155, legY - 8, 12, 10);
    ctx.fillText('Mean Torque', TM_L + pL + 171, legY);
  }

  /* ================================================================
     DRAWING \u2014 EXPLORE MODE DIAGRAMS
     ================================================================ */

  function drawExploreDiagram(conceptId) {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;

    switch (conceptId) {
      case 'kinetic-energy':
        drawConceptFlywheel(cx, cy - 30, 120);
        ctx.font = 'bold 22px Courier New, monospace';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('E = \u00bd I \u03c9\u00b2', cx, cy + 140);
        ctx.font = '14px Segoe UI, sans-serif';
        ctx.fillStyle = '#6b7a99';
        ctx.fillText('Kinetic energy scales with the square of angular velocity', cx, cy + 170);
        // Energy vs omega curve
        drawEnergyVsOmegaCurve(cx, cy + 230, 300, 80);
        break;

      case 'moment-of-inertia':
        // Draw disc vs rim comparison
        drawConceptDisc(cx - 160, cy - 20, 90);
        drawConceptRim(cx + 160, cy - 20, 90);
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('Solid Disc', cx - 160, cy + 100);
        ctx.fillText('Rim Type', cx + 160, cy + 100);
        ctx.font = 'bold 16px Courier New, monospace';
        ctx.fillStyle = '#8bc34a';
        ctx.fillText('I = \u00bdmr\u00b2', cx - 160, cy + 125);
        ctx.fillText('I = mr\u00b2', cx + 160, cy + 125);
        ctx.font = '13px Segoe UI, sans-serif';
        ctx.fillStyle = '#6b7a99';
        ctx.fillText('Rim type has 2\u00d7 the moment of inertia for the same mass and radius', cx, cy + 165);
        break;

      case 'angular-velocity':
        ctx.font = 'bold 24px Courier New, monospace';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('\u03c9 = 2\u03c0N / 60', cx, cy - 80);
        drawConceptFlywheel(cx, cy + 50, 100);
        // Draw arrow around it
        ctx.beginPath();
        ctx.arc(cx, cy + 50, 130, -0.3, Math.PI * 1.5);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#8bc34a';
        ctx.stroke();
        // Arrow tip
        var tipAngle = Math.PI * 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + 130 * Math.cos(tipAngle), cy + 50 + 130 * Math.sin(tipAngle));
        ctx.lineTo(cx + 130 * Math.cos(tipAngle) + 8, cy + 50 + 130 * Math.sin(tipAngle) + 10);
        ctx.lineTo(cx + 130 * Math.cos(tipAngle) - 8, cy + 50 + 130 * Math.sin(tipAngle) + 10);
        ctx.fillStyle = '#8bc34a';
        ctx.fill();
        ctx.font = '14px Segoe UI, sans-serif';
        ctx.fillStyle = '#6b7a99';
        ctx.fillText('RPM \u2192 rad/s conversion', cx, cy + 220);
        break;

      case 'energy-capacity':
        ctx.font = 'bold 20px Courier New, monospace';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('\u0394E = I \u03c9\u00b2 C_s', cx, 60);
        ctx.font = '14px Segoe UI, sans-serif';
        ctx.fillStyle = '#6b7a99';
        ctx.fillText('Useful energy = total KE \u00d7 coefficient of fluctuation', cx, 90);
        drawEnergyBandDiagram(cx, cy + 40, 350, 200);
        break;

      case 'turning-moment':
        drawConceptTMD(cx, cy, 380, 300);
        break;

      case 'coeff-fluctuation':
        ctx.font = 'bold 20px Courier New, monospace';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('C_s = (\u03c9_max \u2212 \u03c9_min) / \u03c9_mean', cx, 60);
        drawCsSpeedDiagram(cx, cy + 40, 380, 240);
        break;

      case 'mean-torque':
        ctx.font = 'bold 20px Courier New, monospace';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('T_mean = P / \u03c9', cx, 60);
        drawMeanTorqueDiagram(cx, cy + 30, 380, 260);
        break;

      case 'energy-surplus-deficit':
        drawSurplusDeficitDiagram(cx, cy, 400, 320);
        break;

      case 'flywheel-types':
        drawConceptDisc(cx - 180, cy - 20, 100);
        drawConceptRim(cx + 180, cy - 20, 100);
        ctx.font = 'bold 16px Segoe UI, sans-serif';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('Disc Type', cx - 180, cy - 150);
        ctx.fillText('Rim / Arm Type', cx + 180, cy - 150);
        ctx.font = '13px Segoe UI, sans-serif';
        ctx.fillStyle = '#6b7a99';
        ctx.fillText('Simple, lower I', cx - 180, cy + 120);
        ctx.fillText('Higher I, higher stress', cx + 180, cy + 120);
        ctx.font = 'bold 18px Courier New, monospace';
        ctx.fillStyle = '#8bc34a';
        ctx.fillText('I = \u00bdmr\u00b2', cx - 180, cy + 150);
        ctx.fillText('I \u2248 mr\u00b2', cx + 180, cy + 150);
        break;

      case 'material-selection':
        drawMaterialComparisonChart(cx, cy, 500, 320);
        break;

      case 'stress-analysis':
        ctx.font = 'bold 20px Courier New, monospace';
        ctx.fillStyle = '#558b2f';
        ctx.textAlign = 'center';
        ctx.fillText('\u03c3_hoop = \u03c1 \u03c9\u00b2 r\u00b2', cx, 55);
        drawStressDiagram(cx, cy + 40, 300, 250);
        break;

      case 'applications':
        drawApplicationsDiagram(cx, cy, 600, 350);
        break;

      default:
        ctx.font = 'bold 18px Segoe UI, sans-serif';
        ctx.fillStyle = '#6b7a99';
        ctx.textAlign = 'center';
        ctx.fillText('Select a concept to view its diagram', cx, cy);
    }
  }

  /* Concept helper: simple flywheel drawing */
  function drawConceptFlywheel(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#558b2f';
    ctx.stroke();
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(cx + 15 * Math.cos(a), cy + 15 * Math.sin(a));
      ctx.lineTo(cx + (r - 10) * Math.cos(a), cy + (r - 10) * Math.sin(a));
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(85,139,47,0.5)';
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2535';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#558b2f';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#8bc34a';
    ctx.fill();
  }

  function drawConceptDisc(cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(85,139,47,0.35)';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#558b2f';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2535';
    ctx.fill();
    ctx.strokeStyle = '#8bc34a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawConceptRim(cx, cy, r) {
    // Outer rim
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(85,139,47,0.55)';
    ctx.stroke();
    // Spokes
    for (var i = 0; i < 6; i++) {
      var a = i * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(cx + 12 * Math.cos(a), cy + 12 * Math.sin(a));
      ctx.lineTo(cx + (r - 8) * Math.cos(a), cy + (r - 8) * Math.sin(a));
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(85,139,47,0.4)';
      ctx.stroke();
    }
    // Hub
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#1f2535';
    ctx.fill();
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawEnergyVsOmegaCurve(cx, cy, w, h) {
    var pL = 40, pR = 10, pT = 5, pB = 20;
    var pw = w - pL - pR, ph = h - pT - pB;
    var x0 = cx - w / 2 + pL, y0 = cy - h / 2 + pT;
    // Axes
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0 + ph); ctx.lineTo(x0 + pw, y0 + ph); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0 + ph); ctx.lineTo(x0, y0); ctx.stroke();
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('\u03c9 (rad/s)', cx, y0 + ph + 16);
    ctx.save();
    ctx.translate(cx - w / 2 + 10, cy);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('E (J)', 0, 0);
    ctx.restore();
    // Parabolic curve
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 50; i++) {
      var t = i / 50;
      var xx = x0 + t * pw;
      var yy = y0 + ph - t * t * ph;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.fillStyle = '#8bc34a';
    ctx.fillText('E \u221d \u03c9\u00b2', x0 + pw - 40, y0 + 20);
  }

  function drawEnergyBandDiagram(cx, cy, w, h) {
    var x0 = cx - w / 2, y0 = cy - h / 2;
    // Draw speed vs time with bands
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0, y0); ctx.stroke();
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Time', cx, y0 + h + 16);
    // Mean speed line
    var yMean = y0 + h * 0.5;
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath(); ctx.moveTo(x0, yMean); ctx.lineTo(x0 + w, yMean); ctx.stroke();
    ctx.setLineDash([]);
    // Max and min bands
    var yMax = y0 + h * 0.3;
    var yMin = y0 + h * 0.7;
    ctx.fillStyle = 'rgba(85,139,47,0.15)';
    ctx.fillRect(x0, yMax, w, yMin - yMax);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(x0, yMax); ctx.lineTo(x0 + w, yMax); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, yMin); ctx.lineTo(x0 + w, yMin); ctx.stroke();
    ctx.setLineDash([]);
    // Labels
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('\u03c9_max', x0 + w + 5, yMax + 4);
    ctx.fillText('\u03c9_min', x0 + w + 5, yMin + 4);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('\u03c9_mean', x0 + w + 5, yMean + 4);
    // Delta E annotation
    ctx.fillStyle = '#558b2f';
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u0394E = I\u03c9\u00b2C_s', cx, y0 + h * 0.15);
    // Speed curve (sinusoidal)
    ctx.strokeStyle = '#8bc34a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var xx = x0 + t * w;
      var yy = yMean + (yMax - yMean) * Math.sin(t * 6 * Math.PI);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }

  function drawConceptTMD(cx, cy, w, h) {
    var x0 = cx - w / 2, y0 = cy - h / 2;
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Turning Moment Diagram (4-stroke engine)', cx, y0 + 10);
    var pL = 50, pR = 10, pT = 30, pB = 35;
    var pw = w - pL - pR, ph = h - pT - pB;
    var ox = x0 + pL, oy = y0 + pT;
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy + ph); ctx.lineTo(ox + pw, oy + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy + ph); ctx.lineTo(ox, oy); ctx.stroke();
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Crank Angle \u03b8 (0\u00b0 \u2014 720\u00b0)', cx, oy + ph + 20);
    // Sinusoidal curve
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2;
    var meanLine = oy + ph * 0.65;
    ctx.beginPath();
    for (var i = 0; i <= 200; i++) {
      var t = i / 200;
      var angle = t * 720;
      var torque;
      if (angle <= 180) torque = Math.sin(angle * Math.PI / 180) * ph * 0.55;
      else if (angle <= 360) torque = -Math.sin((angle - 180) * Math.PI / 180) * ph * 0.15;
      else if (angle <= 540) torque = -Math.sin((angle - 360) * Math.PI / 180) * ph * 0.08;
      else torque = -Math.sin((angle - 540) * Math.PI / 180) * ph * 0.05;
      var yy = meanLine - torque;
      var xx = ox + t * pw;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    // Mean line
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(ox, meanLine);
    ctx.lineTo(ox + pw, meanLine);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'left';
    ctx.fillText('T_mean', ox + pw + 3, meanLine + 4);
  }

  function drawCsSpeedDiagram(cx, cy, w, h) {
    var x0 = cx - w / 2, y0 = cy - h / 2;
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + 40, y0 + h - 25); ctx.lineTo(x0 + w, y0 + h - 25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + 40, y0 + h - 25); ctx.lineTo(x0 + 40, y0); ctx.stroke();
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Time / Crank Angle', cx, y0 + h - 5);
    // Speed oscillation
    var yMid = y0 + h * 0.4;
    var amp = h * 0.2;
    ctx.strokeStyle = '#8bc34a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var xx = x0 + 40 + t * (w - 50);
      var yy = yMid + amp * Math.sin(t * 4 * Math.PI);
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    // Max, min, mean lines
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(x0 + 40, yMid - amp); ctx.lineTo(x0 + w, yMid - amp); ctx.stroke();
    ctx.strokeStyle = '#ff5555';
    ctx.beginPath(); ctx.moveTo(x0 + 40, yMid + amp); ctx.lineTo(x0 + w, yMid + amp); ctx.stroke();
    ctx.strokeStyle = '#f5c842';
    ctx.beginPath(); ctx.moveTo(x0 + 40, yMid); ctx.lineTo(x0 + w, yMid); ctx.stroke();
    ctx.setLineDash([]);
    // Labels
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#3ddc84'; ctx.fillText('\u03c9_max', x0 + 38, yMid - amp + 4);
    ctx.fillStyle = '#ff5555'; ctx.fillText('\u03c9_min', x0 + 38, yMid + amp + 4);
    ctx.fillStyle = '#f5c842'; ctx.fillText('\u03c9_mean', x0 + 38, yMid + 4);
    // Bracket for C_s
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2;
    var bx = x0 + w - 20;
    ctx.beginPath(); ctx.moveTo(bx, yMid - amp); ctx.lineTo(bx + 10, yMid - amp); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + 5, yMid - amp); ctx.lineTo(bx + 5, yMid + amp); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx, yMid + amp); ctx.lineTo(bx + 10, yMid + amp); ctx.stroke();
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.fillStyle = '#558b2f';
    ctx.textAlign = 'left';
    ctx.fillText('C_s', bx + 14, yMid + 4);
  }

  function drawMeanTorqueDiagram(cx, cy, w, h) {
    var x0 = cx - w / 2, y0 = cy - h / 2;
    var pL = 50, pB = 30;
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + pL, y0 + h - pB); ctx.lineTo(x0 + w, y0 + h - pB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + pL, y0 + h - pB); ctx.lineTo(x0 + pL, y0); ctx.stroke();
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Crank Angle', cx, y0 + h - 5);
    // Torque curve
    var plotH = h - pB - 20;
    var baseY = y0 + h - pB;
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var torque = 0.3 + 0.6 * Math.sin(t * 2 * Math.PI) * Math.sin(t * 2 * Math.PI) + 0.1 * Math.sin(t * 6 * Math.PI);
      var xx = x0 + pL + t * (w - pL - 10);
      var yy = baseY - torque * plotH;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
    // Mean line
    var meanY = baseY - 0.45 * plotH;
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath(); ctx.moveTo(x0 + pL, meanY); ctx.lineTo(x0 + w - 10, meanY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'left';
    ctx.fillText('T_mean = P/\u03c9', x0 + w - 130, meanY - 8);
  }

  function drawSurplusDeficitDiagram(cx, cy, w, h) {
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Energy Surplus & Deficit', cx, cy - h / 2 + 15);
    var x0 = cx - w / 2, y0 = cy - h / 2 + 30;
    var pL = 50, pB = 35;
    var pw = w - pL - 10, ph = h - 60 - pB;
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0 + pL, y0 + ph); ctx.lineTo(x0 + pL + pw, y0 + ph); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + pL, y0 + ph); ctx.lineTo(x0 + pL, y0); ctx.stroke();
    var meanY = y0 + ph * 0.55;
    // Sinusoidal torque
    var prevX, prevY;
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var torque = Math.sin(t * 2 * Math.PI) * ph * 0.4 + 0.2 * Math.sin(t * 4 * Math.PI) * ph * 0.15;
      var xx = x0 + pL + t * pw;
      var yy = meanY - torque;
      if (i > 0) {
        // Shade surplus / deficit
        if (yy < meanY || prevY < meanY) {
          ctx.fillStyle = 'rgba(61,220,132,0.35)';
          ctx.beginPath();
          ctx.moveTo(prevX, Math.min(prevY, meanY));
          ctx.lineTo(xx, Math.min(yy, meanY));
          ctx.lineTo(xx, meanY);
          ctx.lineTo(prevX, meanY);
          ctx.fill();
        }
        if (yy > meanY || prevY > meanY) {
          ctx.fillStyle = 'rgba(255,85,85,0.35)';
          ctx.beginPath();
          ctx.moveTo(prevX, Math.max(prevY, meanY));
          ctx.lineTo(xx, Math.max(yy, meanY));
          ctx.lineTo(xx, meanY);
          ctx.lineTo(prevX, meanY);
          ctx.fill();
        }
      }
      prevX = xx;
      prevY = yy;
    }
    // Curve
    ctx.strokeStyle = '#558b2f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var j = 0; j <= 100; j++) {
      var t2 = j / 100;
      var torque2 = Math.sin(t2 * 2 * Math.PI) * ph * 0.4 + 0.2 * Math.sin(t2 * 4 * Math.PI) * ph * 0.15;
      var xx2 = x0 + pL + t2 * pw;
      var yy2 = meanY - torque2;
      if (j === 0) ctx.moveTo(xx2, yy2); else ctx.lineTo(xx2, yy2);
    }
    ctx.stroke();
    // Mean line
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 3]);
    ctx.beginPath(); ctx.moveTo(x0 + pL, meanY); ctx.lineTo(x0 + pL + pw, meanY); ctx.stroke();
    ctx.setLineDash([]);
    // Legend
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3ddc84'; ctx.fillText('Surplus (above T_mean)', x0 + pL, y0 + ph + 20);
    ctx.fillStyle = '#ff5555'; ctx.fillText('Deficit (below T_mean)', x0 + pL + 180, y0 + ph + 20);
  }

  function drawMaterialComparisonChart(cx, cy, w, h) {
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Material Comparison for Flywheels', cx, cy - h / 2 + 15);
    var materials = [
      { name: 'Cast Iron', strength: 20, density: 7200, color: '#6b7a99' },
      { name: 'Steel', strength: 150, density: 7800, color: '#42a5f5' },
      { name: 'Aluminium', strength: 70, density: 2700, color: '#f5c842' },
      { name: 'Carbon Fibre', strength: 1000, density: 1600, color: '#3ddc84' }
    ];
    var barW = 80, gap = 30;
    var startX = cx - (materials.length * (barW + gap) - gap) / 2;
    var barMaxH = h - 100;
    var y0 = cy + h / 2 - 30;
    for (var i = 0; i < materials.length; i++) {
      var m = materials[i];
      var bh = (m.strength / 1000) * barMaxH;
      var x = startX + i * (barW + gap);
      ctx.fillStyle = m.color;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(x, y0 - bh, barW, bh);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y0 - bh, barW, bh);
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.fillStyle = m.color;
      ctx.textAlign = 'center';
      ctx.fillText(m.name, x + barW / 2, y0 + 16);
      ctx.font = '9px Courier New, monospace';
      ctx.fillStyle = '#dde3f0';
      ctx.fillText(m.strength + ' MPa', x + barW / 2, y0 - bh - 5);
    }
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Allowable Stress (MPa) \u2014 higher is better for high-speed flywheels', cx, y0 + 35);
  }

  function drawStressDiagram(cx, cy, w, h) {
    // Show hoop stress arrows on a rim cross-section
    var rimR = 80;
    ctx.beginPath();
    ctx.arc(cx, cy, rimR, 0, 2 * Math.PI);
    ctx.lineWidth = 20;
    ctx.strokeStyle = 'rgba(85,139,47,0.4)';
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#558b2f';
    ctx.stroke();
    // Arrows pointing outward (centrifugal)
    ctx.strokeStyle = '#ff5555';
    ctx.fillStyle = '#ff5555';
    ctx.lineWidth = 2;
    for (var i = 0; i < 8; i++) {
      var a = i * Math.PI / 4;
      var x1 = cx + rimR * Math.cos(a);
      var y1 = cy + rimR * Math.sin(a);
      var x2 = cx + (rimR + 25) * Math.cos(a);
      var y2 = cy + (rimR + 25) * Math.sin(a);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 5 * Math.cos(a - 0.4), y2 - 5 * Math.sin(a - 0.4));
      ctx.lineTo(x2 - 5 * Math.cos(a + 0.4), y2 - 5 * Math.sin(a + 0.4));
      ctx.fill();
    }
    // Hoop stress arrows (tangential)
    ctx.strokeStyle = '#f5c842';
    ctx.fillStyle = '#f5c842';
    for (var j = 0; j < 4; j++) {
      var aH = j * Math.PI / 2 + Math.PI / 8;
      var mx = cx + rimR * Math.cos(aH);
      var my = cy + rimR * Math.sin(aH);
      var tx = -Math.sin(aH);
      var ty = Math.cos(aH);
      ctx.beginPath();
      ctx.moveTo(mx - tx * 15, my - ty * 15);
      ctx.lineTo(mx + tx * 15, my + ty * 15);
      ctx.stroke();
    }
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Centrifugal force', cx, cy + rimR + 55);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Hoop stress (\u03c3)', cx, cy + rimR + 72);
  }

  function drawApplicationsDiagram(cx, cy, w, h) {
    var apps = [
      { name: 'IC Engine', cs: '0.02\u20130.03', desc: 'Smooth pulsating torque', y: -130 },
      { name: 'Punch Press', cs: '0.10\u20130.15', desc: 'Store energy, burst delivery', y: -40 },
      { name: 'Wind Turbine', cs: '0.03\u20130.05', desc: 'Buffer variable wind input', y: 50 },
      { name: 'Regen. Braking', cs: '0.03\u20130.05', desc: 'Capture braking energy', y: 140 }
    ];
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Flywheel Applications & Typical C_s', cx, cy - 170);
    for (var i = 0; i < apps.length; i++) {
      var a = apps[i];
      var bx = cx - 200, by = cy + a.y - 15;
      ctx.fillStyle = 'rgba(85,139,47,0.12)';
      ctx.strokeStyle = '#558b2f';
      ctx.lineWidth = 1.5;
      var bw = 400, bh = 55;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.font = 'bold 13px Segoe UI, sans-serif';
      ctx.fillStyle = '#558b2f';
      ctx.textAlign = 'left';
      ctx.fillText(a.name, bx + 14, by + 22);
      ctx.font = '11px Courier New, monospace';
      ctx.fillStyle = '#8bc34a';
      ctx.fillText('C_s = ' + a.cs, bx + 14, by + 42);
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'right';
      ctx.fillText(a.desc, bx + bw - 14, by + 32);
    }
  }

  /* ================================================================
     MAIN DRAW FUNCTION
     ================================================================ */

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      drawFlywheel();
      drawTurningMomentDiagram();
    } else if (mode === 'explore' && exploreItem) {
      drawExploreDiagram(exploreItem.id);
    } else if (mode === 'explore') {
      ctx.font = 'bold 18px Segoe UI, sans-serif';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'center';
      ctx.fillText('Select a concept to explore', W / 2, H / 2);
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    }
  }

  function drawPracticeCanvas() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    drawConceptFlywheel(W / 2, H / 2 - 20, 150);
    ctx.font = 'bold 16px Segoe UI, sans-serif';
    ctx.fillStyle = '#558b2f';
    ctx.textAlign = 'center';
    ctx.fillText('Practice Mode', W / 2, 40);
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Solve flywheel energy storage problems below', W / 2, 65);
    ctx.font = 'bold 14px Courier New, monospace';
    ctx.fillStyle = '#8bc34a';
    ctx.fillText('E = \u00bdI\u03c9\u00b2   |   \u0394E = I\u03c9\u00b2C_s   |   I = \u00bdmr\u00b2', W / 2, H - 40);
  }

  function drawQuizCanvas() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    drawConceptFlywheel(W / 2, H / 2 - 20, 150);
    ctx.font = 'bold 16px Segoe UI, sans-serif';
    ctx.fillStyle = '#558b2f';
    ctx.textAlign = 'center';
    ctx.fillText('Quiz Mode', W / 2, 40);
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Test your flywheel knowledge', W / 2, 65);
  }

  /* ================================================================
     READOUT UPDATES
     ================================================================ */

  function updateReadouts() {
    var w = omega();
    var I = momentOfInertia();
    var E = kineticEnergy();
    var profile = getTorqueProfile();
    var meanT = computeMeanTorque(profile);
    var maxT = computeMaxTorque(profile);
    var dE = computeEnergySurplus(profile, meanT);
    var Cs = computeCs();
    var Nmax = rpm * (1 + Cs / 2);

    document.getElementById('r-ke').textContent = E >= 1e6 ? fmt(E / 1e6, 2) + ' M' : E >= 1000 ? fmt(E / 1000, 1) + ' k' : fmt(E, 0);
    document.getElementById('r-moi').textContent = fmt(I, 2);
    document.getElementById('r-omega').textContent = fmt(w, 2);
    document.getElementById('r-cs').textContent = fmt(Cs, 4);
    document.getElementById('r-tmean').textContent = fmt(meanT, 1);
    document.getElementById('r-tmax').textContent = fmt(maxT, 1);
    document.getElementById('r-esurplus').textContent = dE >= 1000 ? fmt(dE / 1000, 1) + ' k' : fmt(dE, 0);
    document.getElementById('r-nmax').textContent = fmt(Nmax, 0);
  }

  /* ================================================================
     SLIDER HANDLERS
     ================================================================ */

  function syncSliders() {
    mass = +slMass.value;
    radius = +slRadius.value;
    rpm = +slRpm.value;
    loadVar = +slLoad.value;
    valMass.textContent = mass + ' kg';
    valRadius.textContent = fmt(radius, 2) + ' m';
    valRpm.textContent = rpm;
    valLoad.textContent = loadVar + ' %';
    updateReadouts();
  }

  slMass.addEventListener('input', syncSliders);
  slRadius.addEventListener('input', syncSliders);
  slRpm.addEventListener('input', syncSliders);
  slLoad.addEventListener('input', syncSliders);

  /* ================================================================
     APPLICATION PRESET TABS
     ================================================================ */

  appTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.preset-btn');
    if (!btn) return;
    var btns = appTabs.querySelectorAll('.preset-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
    btn.classList.add('active');
    appType = btn.dataset.app;

    // Set default slider values per application
    if (appType === 'engine') {
      slMass.value = 80; slRadius.value = 0.5; slRpm.value = 600; slLoad.value = 30;
    } else if (appType === 'punch-press') {
      slMass.value = 200; slRadius.value = 0.8; slRpm.value = 300; slLoad.value = 70;
    } else if (appType === 'wind-energy') {
      slMass.value = 150; slRadius.value = 1.0; slRpm.value = 200; slLoad.value = 40;
    } else if (appType === 'braking') {
      slMass.value = 30; slRadius.value = 0.3; slRpm.value = 2000; slLoad.value = 60;
    }
    syncSliders();
  });

  /* ================================================================
     MODE TABS
     ================================================================ */

  modeTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.pill');
    if (!btn) return;
    var pills = modeTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    btn.classList.add('active');
    mode = btn.dataset.mode;
    switchMode();
  });

  function switchMode() {
    simPanel.style.display = mode === 'simulate' ? '' : 'none';
    catRow.style.display = mode === 'explore' ? '' : 'none';
    itemSelector.style.display = mode === 'explore' ? '' : 'none';
    itemInfo.style.display = (mode === 'explore' && exploreItem) ? '' : 'none';
    practicePanel.style.display = mode === 'practice' ? '' : 'none';
    practiceBar.style.display = mode === 'practice' ? '' : 'none';
    quizPanel.style.display = mode === 'quiz' ? '' : 'none';
    quizBar.style.display = mode === 'quiz' ? '' : 'none';
    quizResult.style.display = 'none';

    if (mode === 'explore') {
      buildConceptGrid();
    } else if (mode === 'practice') {
      if (!currentProblem) nextProblem();
    } else if (mode === 'quiz') {
      if (quizSet.length === 0) startQuiz();
    }
    draw();
  }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  catTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.pill');
    if (!btn) return;
    var pills = catTabs.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    btn.classList.add('active');
    exploreCat = btn.dataset.cat;
    exploreItem = null;
    itemInfo.style.display = 'none';
    buildConceptGrid();
    draw();
  });

  function buildConceptGrid() {
    conceptGrid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (exploreItem && exploreItem.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.dataset.idx = i;
      btn.addEventListener('click', (function (concept) {
        return function () {
          exploreItem = concept;
          buildConceptGrid();
          showConceptInfo(concept);
          draw();
        };
      })(c));
      conceptGrid.appendChild(btn);
    }
  }

  function showConceptInfo(c) {
    itemInfo.style.display = '';
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      for (var i = 0; i < c.example.steps.length; i++) {
        html += '<div class="ex-step">' + c.example.steps[i] + '</div>';
      }
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  function nextProblem() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    currentProblem = gen();
    pAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit || '';
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    ppInput.focus();
    draw();
  }

  ppCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });

  function checkPractice() {
    if (pAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) { ppFeedback.textContent = 'Enter a number.'; ppFeedback.className = 'feedback err'; return; }
    pAnswered = true;
    pTotal++;
    var tol = currentProblem.tol || Math.abs(currentProblem.answer) * 0.02 + 0.5;
    var correct = Math.abs(userVal - currentProblem.answer) <= tol;
    if (correct) {
      pCorrect++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer + ' ' + (currentProblem.unit || '');
      ppFeedback.className = 'feedback err';
    }
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';
    pbarScoreVal.textContent = pCorrect + ' / ' + pTotal;

    // Show solution
    ppSolution.style.display = '';
    var solHtml = '<h4>Solution</h4>';
    for (var i = 0; i < currentProblem.steps.length; i++) {
      if (currentProblem.steps[i]) {
        solHtml += '<div class="sol-step">' + currentProblem.steps[i] + '</div>';
      }
    }
    ppSolution.innerHTML = solHtml;
  }

  ppNext.addEventListener('click', nextProblem);

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  var qbarNum = document.getElementById('qbar-num');

  function startQuiz() {
    quizSet = shuffle(QUIZ_POOL.slice()).slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizLocked = false;
    quizResult.style.display = 'none';
    quizBar.style.display = '';
    quizPanel.style.display = '';
    showQuizQuestion();
    draw();
  }

  function showQuizQuestion() {
    if (quizIdx >= QUIZ_SIZE) { showQuizResult(); return; }
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizLocked = false;
    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.q + '</p>';
    if (q.type === 'numeric') {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-input" type="number" step="any" placeholder="Your answer">';
      html += '<span class="qi-unit">' + (q.unit || '') + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
      html += '<div class="quiz-feedback" id="quiz-fb"></div>';
    } else {
      html += '<div class="answer-grid">';
      for (var i = 0; i < q.opts.length; i++) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + q.opts[i] + '</button>';
      }
      html += '</div>';
      html += '<div class="quiz-feedback" id="quiz-fb"></div>';
    }
    quizPanel.innerHTML = html;

    // Bind events
    if (q.type === 'numeric') {
      var qiInput = document.getElementById('qi-input');
      var qiSubmit = document.getElementById('qi-submit');
      qiSubmit.addEventListener('click', function () { submitNumericQuiz(q, qiInput); });
      qiInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitNumericQuiz(q, qiInput); });
      qiInput.focus();
    } else {
      var btns = quizPanel.querySelectorAll('.answer-btn');
      for (var b = 0; b < btns.length; b++) {
        btns[b].addEventListener('click', (function (idx) {
          return function () { submitMCQQuiz(q, idx); };
        })(+btns[b].dataset.idx));
      }
    }
  }

  function submitMCQQuiz(q, idx) {
    if (quizLocked) return;
    quizLocked = true;
    var btns = quizPanel.querySelectorAll('.answer-btn');
    var correct = idx === q.ans;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.q, correct: correct, userAnswer: q.opts[idx], correctAnswer: q.opts[q.ans] });

    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.add('locked');
      if (i === q.ans) btns[i].classList.add('correct');
      if (i === idx && !correct) btns[i].classList.add('wrong');
    }

    var fb = document.getElementById('quiz-fb');
    fb.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.opts[q.ans];
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');

    setTimeout(function () { quizIdx++; showQuizQuestion(); }, 1500);
  }

  function submitNumericQuiz(q, input) {
    if (quizLocked) return;
    var val = parseFloat(input.value);
    if (isNaN(val)) return;
    quizLocked = true;
    var tol = q.tol || 0.5;
    var correct = Math.abs(val - q.ans) <= tol;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.q, correct: correct, userAnswer: val, correctAnswer: q.ans });

    input.disabled = true;
    var fb = document.getElementById('quiz-fb');
    fb.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.ans + ' ' + (q.unit || '');
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');

    setTimeout(function () { quizIdx++; showQuizQuestion(); }, 1500);
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = Math.round(quizScore / QUIZ_SIZE * 100);
    var scoreClass = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';
    var stars = '';
    for (var s = 0; s < 5; s++) stars += s < Math.round(quizScore / QUIZ_SIZE * 5) ? '\u2605' : '\u2606';
    var verdict = pct === 100 ? 'Flawless!' : pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!';

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + scoreClass + '">' + pct + '%</span><div class="qr-verdict">' + verdict + '</div></div>';
    html += '</div><div class="qr-rows">';
    for (var i = 0; i < quizAnswers.length; i++) {
      var a = quizAnswers[i];
      var cls = a.correct ? 'ok' : 'err';
      html += '<div class="qr-row ' + cls + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + a.q + '</strong><br>Your answer: ' + a.userAnswer + ' | Correct: ' + a.correctAnswer + '</span>';
      html += '<span class="qr-mark">' + (a.correct ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn btn-primary" id="btn-retake" style="align-self:center;margin-top:8px;">Retake Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('btn-retake').addEventListener('click', function () {
      quizSet = [];
      startQuiz();
    });
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  var lastTime = 0;

  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    if (mode === 'simulate' && animRunning) {
      // Rotate flywheel at speed proportional to RPM (scaled for visibility)
      var visualSpeed = (rpm / 600) * 2;
      flyAngle += visualSpeed * dt;
      if (flyAngle > 200 * Math.PI) flyAngle -= 200 * Math.PI;
    }

    draw();
    animId = requestAnimationFrame(animate);
  }

  /* ================================================================
     POINTER EVENTS (canvas interaction)
     ================================================================ */

  cvs.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    // In simulate mode, clicking the flywheel area could toggle pause
    if (mode !== 'simulate') return;
    var rect = cvs.getBoundingClientRect();
    var scaleX = W / rect.width;
    var px = (e.clientX - rect.left) * scaleX;
    var py = (e.clientY - rect.top) * scaleX;
    var dx = px - FW_CX;
    var dy = py - FW_CY;
    if (dx * dx + dy * dy < FW_R * FW_R) {
      animRunning = !animRunning;
    }
  });

  /* ================================================================
     INIT
     ================================================================ */

  syncSliders();
  switchMode();
  animId = requestAnimationFrame(animate);

})();
