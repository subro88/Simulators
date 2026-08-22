/* ===================================================================
   Gyroscope / Spinning Top Simulator — app.js  (v2 – complete rewrite)
   Precession · Nutation · Angular Momentum · 4 Configs · 4 Modes
   Key fixes: config pills, real-time slider, impulse torque, 90° rule
   =================================================================== */
(function () {
  'use strict';

  /* ── S1 HELPERS ── */
  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randFloat(a, b) { return a + Math.random() * (b - a); }
  function shuffleArr(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  var PI  = Math.PI;
  var TWO_PI = 2 * PI;
  var DEG = PI / 180;
  var RAD_TO_DEG = 180 / PI;
  var g_accel = 9.81;
  var ACCENT = '#ff6f00';

  /* ── S2 CONFIGURATIONS (4) ── */
  var CONFIGS = [
    { id: 'free',       name: 'Free Spin',         desc: 'No torque — gyroscopic rigidity. Try Apply Torque to see axis respond!' },
    { id: 'precession', name: 'Steady Precession',  desc: 'Weight produces constant torque → axis sweeps a perfect cone.' },
    { id: 'nutation',   name: 'Nutation',           desc: 'Released from rest → axis wobbles then self-adjusts to steady precession.' },
    { id: 'forced',     name: 'Interactive Torque',  desc: 'Apply repeated torque impulses and watch resonance build up!' }
  ];

  /* ── S2b PRESETS (real-world applications) ── */
  var PRESETS = [
    { id: 'lab',     name: 'Lab Gyro',        ico: '⚙',  mass: 2.0, radius: 100, rpm: 3000, weight: 2.0, dist: 100 },
    { id: 'bike',    name: 'Bicycle Wheel',   ico: '🚲',  mass: 1.2, radius: 175, rpm: 2000, weight: 5.0, dist: 150 },
    { id: 'ship',    name: 'Ship Stabilizer', ico: '⚓',  mass: 5.0, radius: 200, rpm: 600,  weight: 8.0, dist: 80  },
    { id: 'heli',    name: 'Helicopter Rotor',ico: '🚁', mass: 4.0, radius: 200, rpm: 1200, weight: 3.0, dist: 120 },
    { id: 'mems',    name: 'MEMS Gyro',       ico: '📱', mass: 0.5, radius: 30,  rpm: 8000, weight: 0.5, dist: 30  },
    { id: 'top',     name: 'Spinning Top',    ico: '🎀', mass: 1.0, radius: 60,  rpm: 4500, weight: 1.5, dist: 50  }
  ];

  /* ── S3 PHYSICS HELPERS ── */
  function calcI(mass, radius) { return 0.5 * mass * radius * radius; }
  function calcL(I, omega) { return I * omega; }
  function calcTau(weight, dist) { return weight * dist; }
  function calcPrecRate(tau, L) { return L > 1e-6 ? tau / L : 0; }
  function rpmToRad(rpm) { return rpm * TWO_PI / 60; }
  function radToRpm(rad) { return rad * 60 / TWO_PI; }

  /* ── S4 CONCEPTS (12) ── */
  var CONCEPTS = [
    { id: 'angular-momentum', name: 'Angular Momentum', cat: 'Fundamentals',
      symbol: 'L', formula: 'L = I\u00b7\u03c9',
      desc: 'Angular momentum (L) is the rotational analogue of linear momentum. For a rigid body spinning about a fixed axis, L = I\u00b7\u03c9, where I is the moment of inertia and \u03c9 is the angular velocity. Angular momentum is a vector quantity pointing along the spin axis (right-hand rule). Conservation of angular momentum means that without external torque, both magnitude and direction of L remain constant — this is why a spinning gyroscope resists changes to its orientation.',
      example: { problem: 'A solid disc of mass 2 kg and radius 0.1 m spins at 3000 RPM. Calculate its angular momentum.', steps: ['I = 0.5 \u00d7 m \u00d7 R\u00b2 = 0.5 \u00d7 2 \u00d7 0.1\u00b2 = 0.01 kg\u00b7m\u00b2', '\u03c9 = 3000 \u00d7 2\u03c0/60 = 314.16 rad/s', 'L = I\u00b7\u03c9 = 0.01 \u00d7 314.16 = <strong>3.14 kg\u00b7m\u00b2/s</strong>'] }
    },
    { id: 'moment-of-inertia', name: 'Moment of Inertia', cat: 'Fundamentals',
      symbol: 'I', formula: 'I = \u00bdmR\u00b2 (disc)',
      desc: 'The moment of inertia (I) quantifies resistance to angular acceleration about a given axis. It depends on mass distribution: solid disc I = 0.5mR\u00b2, thin ring I = mR\u00b2, solid sphere I = 0.4mR\u00b2. The parallel-axis theorem I = I_cm + md\u00b2 shifts the axis. Larger I at same spin speed → larger L → stronger gyroscopic effects.',
      example: { problem: 'Compare I of a solid disc and thin ring, both m = 3 kg, R = 0.15 m.', steps: ['Disc: I = 0.5 \u00d7 3 \u00d7 0.15\u00b2 = <strong>0.0338 kg\u00b7m\u00b2</strong>', 'Ring: I = 3 \u00d7 0.15\u00b2 = <strong>0.0675 kg\u00b7m\u00b2</strong>', 'Ring has 2\u00d7 the I since all mass is at max radius.'] }
    },
    { id: 'torque-angular-accel', name: 'Torque & Angular Accel.', cat: 'Fundamentals',
      symbol: '\u03c4', formula: '\u03c4 = I\u03b1 = dL/dt',
      desc: 'Torque (\u03c4) is the rotational analogue of force. Newton\u2019s second law for rotation: \u03c4 = I\u03b1. More generally, \u03c4 = dL/dt — net torque equals rate of change of angular momentum. For a gyroscope, this is crucial: applied torque does NOT tilt the axis in the torque direction. Instead, L changes perpendicular to \u03c4, causing precession. This is the famous 90\u00b0 rule.',
      example: { problem: 'A torque of 0.5 N\u00b7m on a disc with I = 0.02 kg\u00b7m\u00b2. Find \u03b1.', steps: ['\u03c4 = I\u03b1', '\u03b1 = \u03c4/I = 0.5/0.02', '\u03b1 = <strong>25 rad/s\u00b2</strong>'] }
    },
    { id: 'precession', name: 'Precession', cat: 'Gyroscopic Effects',
      symbol: '\u03a9_p', formula: '\u03a9_p = \u03c4 / L',
      desc: 'Precession is the slow rotation of the spin axis around the vertical when torque is applied. Rate: \u03a9_p = \u03c4/L = \u03c4/(I\u03c9). Key insights: (1) faster spin → slower precession, (2) greater torque → faster precession, (3) direction follows from dL = \u03c4\u00b7dt — the axis moves perpendicular to both L and \u03c4. For a gravity-loaded gyroscope, the axis sweeps a cone at steady rate.',
      example: { problem: 'I = 0.01 kg\u00b7m\u00b2, 5000 RPM. Weight 2 N at 0.1 m. Find \u03a9_p.', steps: ['\u03c9 = 5000\u00d72\u03c0/60 = 523.6 rad/s', 'L = 0.01\u00d7523.6 = 5.236 kg\u00b7m\u00b2/s', '\u03c4 = 2\u00d70.1 = 0.2 N\u00b7m', '\u03a9_p = 0.2/5.236 = <strong>0.0382 rad/s</strong>'] }
    },
    { id: 'nutation-concept', name: 'Nutation', cat: 'Gyroscopic Effects',
      symbol: '\u03c9_n', formula: '\u03c9_n \u2248 L / I_support',
      desc: 'Nutation is a rapid wobble superimposed on precession. It occurs when a gyroscope is released from rest under torque — the axis initially dips, then oscillates. Frequency: \u03c9_n \u2248 L/I_support. It represents exchange between kinetic (precession) and potential (tilt) energy. Friction damps nutation, leaving smooth precession — the axis "self-adjusts" to its steady-state motion. Watch this happen in Nutation mode!',
      example: { problem: 'L = 5 kg\u00b7m\u00b2/s, I_support = 0.02 kg\u00b7m\u00b2. Nutation freq?', steps: ['\u03c9_n = L/I_support = 5/0.02 = 250 rad/s', 'f_n = 250/(2\u03c0) = <strong>39.8 Hz</strong>'] }
    },
    { id: 'gyroscopic-rigidity', name: 'Gyroscopic Rigidity', cat: 'Gyroscopic Effects',
      symbol: '', formula: 'Rigidity \u221d L = I\u03c9',
      desc: 'Gyroscopic rigidity is a spinning body\u2019s resistance to changing its spin-axis direction. Direct consequence of conservation of angular momentum. Greater L (higher spin or larger I) → more rigid. Exploited in gyroscopic instruments. A gyroscope on Earth appears to drift because Earth rotates beneath the fixed axis. Try Free Spin mode — the axis stays rock-steady!',
      example: { problem: 'Gyro spins at 10000 RPM with I = 0.005 kg\u00b7m\u00b2. L = ?', steps: ['\u03c9 = 10000\u00d72\u03c0/60 = 1047.2 rad/s', 'L = 0.005\u00d71047.2 = <strong>5.24 kg\u00b7m\u00b2/s</strong>', 'This large L resists orientation changes.'] }
    },
    { id: 'ship-stabilizers', name: 'Ship Stabilizers', cat: 'Applications',
      symbol: '', formula: 'C = I\u03c9\u03a9_p',
      desc: 'Ship gyroscopic stabilizers use large flywheels (up to 25 tonnes, 200+ RPM) to counteract wave-induced rolling. When the ship rolls, precession generates a reactive couple opposing the roll. Modern active systems (like Seakeeper) control precession to maximize the stabilizing couple, reducing roll by up to 95%.',
      example: { problem: 'Flywheel I = 500 kg\u00b7m\u00b2 at 600 RPM. Ship rolls at 0.1 rad/s. Couple?', steps: ['\u03c9 = 600\u00d72\u03c0/60 = 62.83 rad/s', 'C = 500\u00d762.83\u00d70.1 = <strong>3142 N\u00b7m \u2248 3.14 kN\u00b7m</strong>'] }
    },
    { id: 'aircraft-instruments', name: 'Aircraft Instruments', cat: 'Applications',
      symbol: '', formula: '',
      desc: 'Three flight instruments use gyroscopes: (1) Attitude Indicator — vertically spinning gyro shows pitch/bank. (2) Heading Indicator — horizontally spinning gyro provides stable heading reference. (3) Turn Coordinator — canted gyro detects yaw rate and bank. They exploit gyroscopic rigidity — the gyro maintains orientation while the aircraft moves around it.',
      example: { problem: 'Attitude indicator gyro: 15000 RPM, I = 0.001 kg\u00b7m\u00b2. L = ?', steps: ['\u03c9 = 15000\u00d72\u03c0/60 = 1570.8 rad/s', 'L = 0.001\u00d71570.8 = <strong>1.57 kg\u00b7m\u00b2/s</strong>'] }
    },
    { id: 'bicycle-stability', name: 'Bicycle Stability', cat: 'Applications',
      symbol: '', formula: '',
      desc: 'Spinning bicycle wheels act as gyroscopes. Angular momentum helps self-stability: when the bike leans, the wheel precesses (steers) into the lean. Counter-steering exploits this — pushing the right bar steers left, causing rightward lean via gyroscopic precession. Research shows trail, caster, and mass distribution also contribute, but the gyroscopic effect is a key factor.',
      example: { problem: 'Motorcycle wheel I = 0.8 kg\u00b7m\u00b2 at 120 km/h, R = 0.3 m. L = ?', steps: ['v = 33.33 m/s', '\u03c9 = v/R = 33.33/0.3 = 111.1 rad/s', 'L = 0.8\u00d7111.1 = <strong>88.9 kg\u00b7m\u00b2/s</strong>'] }
    },
    { id: 'euler-equations', name: "Euler's Equations", cat: 'Advanced',
      symbol: '', formula: 'I\u2081\u03c9\u0307\u2081 + (I\u2083\u2212I\u2082)\u03c9\u2082\u03c9\u2083 = M\u2081',
      desc: 'Euler\u2019s equations describe rigid body rotation in body-fixed coordinates. For principal axes: I\u2081\u03c9\u0307\u2081 + (I\u2083\u2212I\u2082)\u03c9\u2082\u03c9\u2083 = M\u2081 (with cyclic permutations). For an axially symmetric gyroscope (I\u2081 = I\u2082 \u2260 I\u2083), these simplify and yield precession/nutation solutions. The coupling terms cause motion perpendicular to applied torque — the mathematical origin of the 90\u00b0 rule.',
      example: { problem: 'I\u2081=I\u2082=0.02, I\u2083=0.01 kg\u00b7m\u00b2, \u03c9\u2082=10, \u03c9\u2083=500 rad/s. Coupling term?', steps: ['(I\u2083\u2212I\u2082)\u03c9\u2082\u03c9\u2083 = (0.01\u22120.02)\u00d710\u00d7500', '= <strong>\u221250 N\u00b7m</strong>', 'This cross-coupling produces gyroscopic precession.'] }
    },
    { id: 'gyroscopic-couple', name: 'Gyroscopic Couple', cat: 'Advanced',
      symbol: 'C', formula: 'C = I\u03c9\u03a9_p',
      desc: 'The gyroscopic couple C = I\u03c9\u03a9_p is the reactive couple when a spinning body is forced to precess. It acts perpendicular to both spin and precession axes. Engineers must account for it in bearing design, propeller shafts, and turbine rotors. When a ship turns, propeller rotors generate gyroscopic couples on bearings.',
      example: { problem: 'Aircraft propeller I = 50 kg\u00b7m\u00b2, 2400 RPM. Pitch rate 0.2 rad/s. C = ?', steps: ['\u03c9 = 2400\u00d72\u03c0/60 = 251.3 rad/s', 'C = 50\u00d7251.3\u00d70.2 = <strong>2513 N\u00b7m \u2248 2.51 kN\u00b7m</strong>'] }
    },
    { id: 'spinning-top-physics', name: 'Spinning Top Physics', cat: 'Advanced',
      symbol: '', formula: '',
      desc: 'Spinning tops demonstrate rich gyroscopic phenomena. A "sleeping" top is stable only above a critical speed. As friction slows it, it precesses and nutates, eventually falling. The tippe-top inverts due to friction-induced torque. Earth itself is a giant top: its axis precesses every 26000 years (precession of equinoxes) due to Sun/Moon torques on its equatorial bulge.',
      example: { problem: 'Earth I \u2248 8.04\u00d710\u00b3\u2077 kg\u00b7m\u00b2, \u03c9 = 7.27\u00d710\u207b\u2075 rad/s. Precession T = 25772 yr. \u03c4 = ?', steps: ['L = 8.04e37\u00d77.27e\u22125 = 5.85e33 kg\u00b7m\u00b2/s', '\u03a9_p = 2\u03c0/(25772\u00d7365.25\u00d786400) = 7.73e\u221212 rad/s', '\u03c4 = L\u03a9_p = <strong>4.52\u00d710\u00b2\u00b2 N\u00b7m</strong>'] }
    }
  ];

  /* ── S5 PROBLEM GENERATORS (12) ── */
  function generateProblem() {
    var pool = [genAngMom, genPrecRate, genMOI, genGyroCouple, genSpinForPrec, genKE,
                genTorqueWeight, genNutFreq, genPrecDir, genReqMass, genPrecPeriod, genBearingF];
    return pool[randInt(0, pool.length - 1)]();
  }
  function genAngMom() {
    var m = roundN(randFloat(0.5,5),1), R = randInt(50,200)/1000, rpm = randInt(1,100)*100;
    var I = 0.5*m*R*R, w = rpmToRad(rpm), L = I*w;
    return { prompt:'A solid disc (m='+m+' kg, R='+(R*1000)+' mm) spins at '+rpm+' RPM. Calculate angular momentum L.', answer:roundN(L,3), unit:'kg\u00b7m\u00b2/s', tol:0.05,
      solution:['I = 0.5\u00d7'+m+'\u00d7'+R+'\u00b2 = '+roundN(I,5)+' kg\u00b7m\u00b2', '\u03c9 = '+rpm+'\u00d72\u03c0/60 = '+roundN(w,2)+' rad/s', 'L = I\u03c9 = <strong>'+roundN(L,3)+' kg\u00b7m\u00b2/s</strong>'] };
  }
  function genPrecRate() {
    var W = roundN(randFloat(0.5,5),1), d = randInt(50,200)/1000, L = roundN(randFloat(1,10),2);
    var tau = W*d, op = tau/L;
    return { prompt:'L = '+L+' kg\u00b7m\u00b2/s. Weight '+W+' N at '+(d*1000)+' mm. Precession rate?', answer:roundN(op,4), unit:'rad/s', tol:0.005,
      solution:['\u03c4 = '+W+'\u00d7'+d+' = '+roundN(tau,3)+' N\u00b7m', '\u03a9_p = \u03c4/L = '+roundN(tau,3)+'/'+L+' = <strong>'+roundN(op,4)+' rad/s</strong>'] };
  }
  function genMOI() {
    var shapes = [{n:'solid disc',f:0.5},{n:'thin ring',f:1.0},{n:'solid sphere',f:0.4}];
    var s = shapes[randInt(0,2)], m = roundN(randFloat(1,8),1), R = randInt(50,200)/1000, I = s.f*m*R*R;
    return { prompt:'Moment of inertia of a '+s.n+' (m='+m+' kg, R='+(R*1000)+' mm)?', answer:roundN(I,5), unit:'kg\u00b7m\u00b2', tol:0.0005,
      solution:['I = '+s.f+'\u00d7'+m+'\u00d7'+R+'\u00b2 = '+s.f+'\u00d7'+m+'\u00d7'+roundN(R*R,5), '<strong>I = '+roundN(I,5)+' kg\u00b7m\u00b2</strong>'] };
  }
  function genGyroCouple() {
    var I = roundN(randFloat(0.01,0.1),3), rpm = randInt(10,100)*100, op = roundN(randFloat(0.01,1),2);
    var w = rpmToRad(rpm), C = I*w*op;
    return { prompt:'Flywheel I='+I+' kg\u00b7m\u00b2, '+rpm+' RPM, precesses at '+op+' rad/s. Gyroscopic couple?', answer:roundN(C,2), unit:'N\u00b7m', tol:0.1,
      solution:['\u03c9 = '+roundN(w,2)+' rad/s', 'C = I\u03c9\u03a9_p = '+I+'\u00d7'+roundN(w,2)+'\u00d7'+op+' = <strong>'+roundN(C,2)+' N\u00b7m</strong>'] };
  }
  function genSpinForPrec() {
    var m = roundN(randFloat(1,4),1), R = randInt(60,150)/1000, W = roundN(randFloat(0.5,3),1), d = randInt(50,150)/1000, dp = roundN(randFloat(0.05,0.5),2);
    var I = 0.5*m*R*R, tau = W*d, w = tau/(I*dp), rpm = radToRpm(w);
    return { prompt:'Disc (m='+m+' kg, R='+(R*1000)+' mm) must precess at '+dp+' rad/s under '+W+' N at '+(d*1000)+' mm. RPM needed?', answer:Math.round(rpm), unit:'RPM', tol:Math.round(rpm*0.05),
      solution:['I = '+roundN(I,5)+' kg\u00b7m\u00b2', '\u03c4 = '+roundN(tau,3)+' N\u00b7m', '\u03c9 = \u03c4/(I\u03a9_p) = '+roundN(tau,3)+'/('+roundN(I,5)+'\u00d7'+dp+') = '+roundN(w,1)+' rad/s', '<strong>RPM = '+Math.round(rpm)+'</strong>'] };
  }
  function genKE() {
    var m = roundN(randFloat(1,5),1), R = randInt(60,200)/1000, rpm = randInt(10,80)*100;
    var I = 0.5*m*R*R, w = rpmToRad(rpm), KE = 0.5*I*w*w;
    return { prompt:'Kinetic energy of disc (m='+m+' kg, R='+(R*1000)+' mm) at '+rpm+' RPM?', answer:roundN(KE,2), unit:'J', tol:Math.max(0.5,KE*0.03),
      solution:['I = '+roundN(I,5)+' kg\u00b7m\u00b2', '\u03c9 = '+roundN(w,2)+' rad/s', 'KE = \u00bdI\u03c9\u00b2 = <strong>'+roundN(KE,2)+' J</strong>'] };
  }
  function genTorqueWeight() {
    var W = roundN(randFloat(0.5,5),1), d = randInt(50,200)/1000, tau = W*d;
    return { prompt:'Weight '+W+' N at '+(d*1000)+' mm from pivot. Torque?', answer:roundN(tau,3), unit:'N\u00b7m', tol:0.005,
      solution:['\u03c4 = W\u00d7d = '+W+'\u00d7'+d+' = <strong>'+roundN(tau,3)+' N\u00b7m</strong>'] };
  }
  function genNutFreq() {
    var L = roundN(randFloat(1,10),2), Is = roundN(randFloat(0.01,0.1),3);
    var wn = L/Is, fn = wn/TWO_PI;
    return { prompt:'L = '+L+' kg\u00b7m\u00b2/s, I_support = '+Is+' kg\u00b7m\u00b2. Nutation freq (Hz)?', answer:roundN(fn,1), unit:'Hz', tol:1,
      solution:['\u03c9_n = L/I_s = '+L+'/'+Is+' = '+roundN(wn,1)+' rad/s', 'f = \u03c9_n/(2\u03c0) = <strong>'+roundN(fn,1)+' Hz</strong>'] };
  }
  function genPrecDir() {
    var sc = [{spin:'CCW from right',torque:'down-left',ans:'forward (away)',v:0},{spin:'CW from right',torque:'down-left',ans:'backward (toward)',v:1},
              {spin:'CCW from right',torque:'down-right',ans:'backward (toward)',v:1},{spin:'CW from right',torque:'down-right',ans:'forward (away)',v:0}];
    var s = sc[randInt(0,3)];
    return { prompt:'Disc spins '+s.spin+', gravity pulls '+s.torque+'. Precession direction? (0=forward, 1=backward)', answer:s.v, unit:'', tol:0,
      solution:['Spin: '+s.spin, 'Torque: '+s.torque, 'Right-hand rule → <strong>'+s.ans+'</strong>'] };
  }
  function genReqMass() {
    var R = randInt(50,150)/1000, rpm = randInt(20,80)*100, tL = roundN(randFloat(1,8),1);
    var w = rpmToRad(rpm), Ineeded = tL/w, m = Ineeded/(0.5*R*R);
    return { prompt:'Disc R='+(R*1000)+' mm at '+rpm+' RPM. Mass for L='+tL+' kg\u00b7m\u00b2/s?', answer:roundN(m,2), unit:'kg', tol:0.1,
      solution:['\u03c9 = '+roundN(w,2)+' rad/s', 'I = L/\u03c9 = '+roundN(Ineeded,5)+' kg\u00b7m\u00b2', 'm = 2I/R\u00b2 = <strong>'+roundN(m,2)+' kg</strong>'] };
  }
  function genPrecPeriod() {
    var m = roundN(randFloat(1,4),1), R = randInt(60,150)/1000, rpm = randInt(20,80)*100, W = roundN(randFloat(0.5,3),1), d = randInt(60,150)/1000;
    var I = 0.5*m*R*R, w = rpmToRad(rpm), L = I*w, tau = W*d, op = tau/L, T = TWO_PI/op;
    return { prompt:'Disc (m='+m+', R='+(R*1000)+'mm) at '+rpm+' RPM. Weight '+W+' N at '+(d*1000)+'mm. Precession period?', answer:roundN(T,1), unit:'s', tol:Math.max(1,T*0.05),
      solution:['I='+roundN(I,5)+', L='+roundN(L,3), '\u03c4='+roundN(tau,3)+' N\u00b7m', '\u03a9_p='+roundN(op,4)+' rad/s', 'T = 2\u03c0/\u03a9_p = <strong>'+roundN(T,1)+' s</strong>'] };
  }
  function genBearingF() {
    var I = roundN(randFloat(0.01,0.1),3), rpm = randInt(10,80)*100, op = roundN(randFloat(0.05,0.5),2), bd = randInt(50,200)/1000;
    var w = rpmToRad(rpm), C = I*w*op, F = C/bd;
    return { prompt:'Flywheel I='+I+', '+rpm+' RPM, prec '+op+' rad/s. Bearings '+(bd*1000)+'mm apart. Reaction force?', answer:roundN(F,1), unit:'N', tol:Math.max(0.5,F*0.05),
      solution:['C = I\u03c9\u03a9_p = '+roundN(C,2)+' N\u00b7m', 'F = C/d = '+roundN(C,2)+'/'+bd+' = <strong>'+roundN(F,1)+' N</strong>'] };
  }

  /* ── S6 QUIZ POOL (15) ── */
  var QUIZ_POOL = [
    { type:'mcq', q:'What causes a gyroscope to precess instead of tilting in the torque direction?', opts:['Angular momentum changes perpendicular to torque (dL/dt = \u03c4)','Friction at pivot','Air resistance on disc','Gravity pulls sideways'], ans:0 },
    { type:'mcq', q:'How does doubling spin speed affect precession rate (same torque)?', opts:['Halves the precession rate','Doubles it','No effect','Quadruples it'], ans:0 },
    { type:'mcq', q:'Moment of inertia of a solid disc about its spin axis?', opts:['I = 0.5mR\u00b2','I = mR\u00b2','I = 0.4mR\u00b2','I = 0.25mR\u00b2'], ans:0 },
    { type:'mcq', q:'Nutation is best described as:', opts:['Rapid wobble superimposed on precession','Same as precession but faster','Spin slowing due to friction','Tilt toward vertical'], ans:0 },
    { type:'mcq', q:'Gyroscopic rigidity refers to:', opts:["Spinning body's resistance to axis reorientation",'Frame stiffness','Pivot friction','Disc tensile strength'], ans:0 },
    { type:'mcq', q:'In a ship stabilizer, the gyroscopic couple is generated by:', opts:['Precession of flywheel when ship rolls','Direct motor thrust','Magnetic hull interaction','Aerodynamic lift'], ans:0 },
    { type:'mcq', q:'\u03a9_p = \u03c4/L shows precession is:', opts:['Inversely proportional to angular momentum','Directly proportional to L','Independent of torque','Independent of spin'], ans:0 },
    { type:'mcq', q:'Which instrument uses gyroscopic rigidity for pitch and bank?', opts:['Attitude Indicator','Altimeter','Airspeed Indicator','VSI'], ans:0 },
    { type:'mcq', q:'Angular momentum direction for a spinning disc is found by:', opts:['Right-hand rule: curl fingers in spin, thumb = L','Left-hand rule','Always upward','Points in torque direction'], ans:0 },
    { type:'mcq', q:'Counter-steering on a motorcycle works because:', opts:['Wheel gyroscopic precession causes lean in opposite direction','Wheels have no angular momentum','Friction skids wheel','Motor directly leans bike'], ans:0 },
    { type:'num', q:'Disc (m=2 kg, R=100 mm) at 3000 RPM. L = ? (I=\u00bdmR\u00b2)', ans:roundN(0.5*2*0.1*0.1*rpmToRad(3000),2), unit:'kg\u00b7m\u00b2/s', tol:0.1 },
    { type:'num', q:'L = 5 kg\u00b7m\u00b2/s, \u03c4 = 0.3 N\u00b7m. Precession rate?', ans:roundN(0.3/5,3), unit:'rad/s', tol:0.005 },
    { type:'num', q:'Solid disc m=4 kg, R=150 mm. I = ?', ans:roundN(0.5*4*0.15*0.15,4), unit:'kg\u00b7m\u00b2', tol:0.001 },
    { type:'num', q:'I=0.05 kg\u00b7m\u00b2, \u03c9=200 rad/s, \u03a9_p=0.5 rad/s. C = I\u03c9\u03a9_p = ?', ans:roundN(0.05*200*0.5,1), unit:'N\u00b7m', tol:0.1 },
    { type:'num', q:'Disc (I=0.02 kg\u00b7m\u00b2) at 5000 RPM. KE = ?', ans:roundN(0.5*0.02*Math.pow(rpmToRad(5000),2),1), unit:'J', tol:1 }
  ];

  /* ══════════════════════════════════════════════════════════════
     S7  DOM REFERENCES & STATE
     ══════════════════════════════════════════════════════════════ */
  var elSimWrapper      = $('sim-wrapper');
  var elExploreWrapper  = $('explore-wrapper');
  var elPracticeWrapper = $('practice-wrapper');
  var elQuizWrapper     = $('quiz-wrapper');
  var elModeTabs        = $('mode-tabs');
  var elConfigTabs      = $('config-tabs');
  var elPresetTabs      = $('preset-tabs');
  var elWeightControls  = $('weight-controls');

  /* Sliders */
  var elMassSlider   = $('mass-slider'),   elMassVal   = $('mass-val');
  var elRadiusSlider = $('radius-slider'), elRadiusVal = $('radius-val');
  var elSpinSlider   = $('spin-slider'),   elSpinVal   = $('spin-val');
  var elWeightSlider = $('weight-slider'), elWeightVal = $('weight-val');
  var elDistSlider   = $('dist-slider'),   elDistVal   = $('dist-val');

  /* Buttons */
  var elBtnSpin   = $('btn-spin');
  var elBtnTorque = $('btn-torque');
  var elBtnReset  = $('btn-reset');

  /* Explore */
  var elExploreCats = $('explore-cats');
  var elExploreGrid = $('explore-grid');
  var elExploreInfo = $('explore-info');

  /* Practice */
  var elPracticePrompt   = $('practice-prompt');
  var elPracticeInput    = $('practice-input');
  var elPracticeUnit     = $('practice-unit');
  var elPracticeFeedback = $('practice-feedback');
  var elPracticeSolution = $('practice-solution');
  var elPracticeScore    = $('practice-score');
  var elBtnCheck     = $('btn-check');
  var elBtnShowSol   = $('btn-show-sol');
  var elBtnNextProb  = $('btn-next-prob');

  /* Quiz */
  var elQuizPanel    = $('quiz-panel');
  var elQuizCounter  = $('quiz-counter');
  var elQuizPrompt   = $('quiz-prompt');
  var elQuizOptions  = $('quiz-options');
  var elQuizNumRow   = $('quiz-num-row');
  var elQuizNumInput = $('quiz-num-input');
  var elQuizNumUnit  = $('quiz-num-unit');
  var elBtnQuizSubmit = $('btn-quiz-submit');
  var elQuizFeedback = $('quiz-feedback');
  var elBtnQuizNext  = $('btn-quiz-next');
  var elQuizResult   = $('quiz-result');
  var elQRStars      = $('qr-stars');
  var elQRScore      = $('qr-score');
  var elQRTable      = $('qr-table');
  var elBtnNewQuiz   = $('btn-new-quiz');

  /* ── STATE ── */
  var state = {
    mode: 'simulate',
    configIdx: 0,
    /* Physical parameters */
    discMass: 2.0,        // kg
    discRadius: 0.1,      // m
    spinRPM: 3000,        // RPM
    appliedWeight: 2.0,   // N
    weightDist: 0.1,      // m
    /* Derived */
    I: 0, omegaSpin: 0, L: 0, tau: 0,
    omegaPrec: 0, nutFreq: 0,
    KE_spin: 0, KE_prec: 0, PE: 0, gyroCouple: 0,
    /* Animation */
    running: false,
    time: 0,
    spinAngle: 0,
    precAngle: 0,
    nutAngle: 0,
    nutPhase: 0,
    tiltBase: 0.25,       // base tilt from vertical (rad, ~14°)
    /* Impulse torque system */
    impulseActive: false,
    impulseFade: 0,       // 1→0 fade
    impulseStrength: 0,
    impulseDir: 0,        // angle on screen
    /* Forced mode accumulation */
    forcedPrecBoost: 0,
    forcedNutAmp: 0,
    /* Feature toggle flags */
    showVectors: true, showTrail: true, showGimbals: true, showLabels: true, showSweep: true,
    /* Unit system: 'si' or 'imp' (display only — physics is always SI) */
    units: 'si',
    /* Sound toggle */
    soundOn: true,
    /* Trail */
    trail: [],
    maxTrail: 400,
    /* Graph data */
    precHist: [],
    nutHist: [],
    maxHist: 300,
    /* Explore */
    expCat: 'Fundamentals', expIdx: 0,
    /* Practice */
    pProb: null, pScore: 0, pTotal: 0, pDone: false,
    /* Quiz */
    qSet: [], qIdx: 0, qScore: 0, qDone: false, qAnswered: false, qResults: [],
    /* Animation timing */
    animId: null, lastTime: 0
  };

  /* ══════════════════════════════════════════════════════════════
     S8  CANVAS SETUP (DPR-aware)
     ══════════════════════════════════════════════════════════════ */
  var mCanvas = $('machine-canvas');
  var gCanvas = $('graph-canvas');
  var eCanvas = $('explore-canvas');
  var mCtx = mCanvas.getContext('2d');
  var gCtx = gCanvas.getContext('2d');
  var eCtx = eCanvas.getContext('2d');
  var MW = 560, MH = 700, GW = 560, GH = 500, EW = 900, EH = 400;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function initCanvases() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    [
      [mCanvas, mCtx, MW, MH],
      [gCanvas, gCtx, GW, GH],
      [eCanvas, eCtx, EW, EH]
    ].forEach(function(arr) {
      arr[0].width  = arr[2] * dpr;
      arr[0].height = arr[3] * dpr;
      arr[0].style.width  = arr[2] + 'px';
      arr[0].style.height = arr[3] + 'px';
      arr[1].setTransform(dpr, 0, 0, dpr, 0, 0);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     S9  PHYSICS UPDATE
     ══════════════════════════════════════════════════════════════ */
  function updatePhysics() {
    var m = state.discMass, R = state.discRadius;
    state.I = calcI(m, R);
    state.omegaSpin = rpmToRad(state.spinRPM);
    state.L = calcL(state.I, state.omegaSpin);

    var cfg = CONFIGS[state.configIdx].id;
    if (cfg === 'free') {
      state.tau = 0;
      state.omegaPrec = 0;
      state.nutFreq = 0;
    } else {
      state.tau = calcTau(state.appliedWeight, state.weightDist);
      state.omegaPrec = calcPrecRate(state.tau, state.L);
      var I_sup = state.I + m * state.weightDist * state.weightDist;
      state.nutFreq = state.L > 1e-6 ? (state.L / I_sup) / TWO_PI : 0;
    }

    state.KE_spin = 0.5 * state.I * state.omegaSpin * state.omegaSpin;
    var I_eff = state.I + m * state.weightDist * state.weightDist;
    state.KE_prec = 0.5 * I_eff * state.omegaPrec * state.omegaPrec;
    state.PE = state.tau * Math.sin(state.tiltBase);
    state.gyroCouple = state.I * state.omegaSpin * state.omegaPrec;
  }

  /* Display-only unit conversion table. Declared up here because
     updateReadouts() runs during initial paint, long before the S23
     upgrade block further down would have assigned it. */
  var UNITS = {
    si:  { mass:'kg', massK:1,       len:'mm', lenK:1,      N:'N',   NK:1,
           Nm:'N\u00b7m',   NmK:1,
           L:'kg\u00b7m\u00b2/s', LK:1,
           I:'kg\u00b7m\u00b2',   IK:1,
           E:'J',        EK:1 },
    imp: { mass:'lb', massK:2.20462, len:'in', lenK:1/25.4, N:'lbf', NK:0.224809,
           Nm:'lbf\u00b7in', NmK:8.85075,
           L:'lb\u00b7ft\u00b2/s', LK:23.73036,
           I:'lb\u00b7ft\u00b2',   IK:23.73036,
           E:'ft\u00b7lbf',  EK:0.737562 }
  };
  function fmt(v, n) { return (Math.abs(v) >= 100 ? roundN(v,1) : roundN(v,n)); }

  /* This runs every animation frame, so it — not the toggle handler — is what
     decides the displayed unit system. RPM, rad/s and Hz are the same in both. */
  function updateReadouts() {
    var u = UNITS[state.units] || UNITS.si, el;
    el = $('res-angular-momentum'); if (el) el.textContent = roundN(state.L * u.LK, 3);
    el = $('res-spin-speed');       if (el) el.textContent = state.spinRPM;
    el = $('res-precession-rate');  if (el) el.textContent = roundN(state.omegaPrec, 4);
    el = $('res-nutation-freq');    if (el) el.textContent = roundN(state.nutFreq, 3);
    el = $('res-torque');           if (el) el.textContent = roundN(state.tau * u.NmK, 3);
    el = $('res-inertia');          if (el) el.textContent = roundN(state.I * u.IK, 5);
    el = $('res-kinetic-energy');   if (el) el.textContent = roundN(state.KE_spin * u.EK, 2);
    el = $('res-gyro-couple');      if (el) el.textContent = roundN(state.gyroCouple * u.NmK, 3);
    el = $('u-angular-momentum');   if (el) el.textContent = u.L;
    el = $('u-torque');             if (el) el.textContent = u.Nm;
    el = $('u-inertia');            if (el) el.textContent = u.I;
    el = $('u-kinetic-energy');     if (el) el.textContent = u.E;
    el = $('u-gyro-couple');        if (el) el.textContent = u.Nm;
  }

  function updateBadges() {
    var el;
    el = $('badge-spin'); if (el) el.textContent = roundN(state.omegaSpin, 1);
    el = $('badge-prec'); if (el) el.textContent = roundN(state.omegaPrec, 4);
    el = $('badge-L');    if (el) el.textContent = roundN(state.L, 3);
    el = $('badge-tau');  if (el) el.textContent = roundN(state.tau, 3);
  }

  /* ══════════════════════════════════════════════════════════════
     S10  3D PROJECTION HELPERS
     ══════════════════════════════════════════════════════════════ */
  var VIEW_YAW  = 0.5;   // ~28° rotation (mutable for orbit)
  var VIEW_PITCH = 0.35;  // ~20° tilt   (mutable for orbit)
  var cosY = Math.cos(VIEW_YAW), sinY = Math.sin(VIEW_YAW);
  var cosP = Math.cos(VIEW_PITCH), sinP = Math.sin(VIEW_PITCH);
  var CX = 280, CY = 360; // pivot center on canvas
  var SCALE = 180;         // pixels per unit
  var shakeX = 0, shakeY = 0; // canvas shake offset

  function refreshView() {
    cosY = Math.cos(VIEW_YAW); sinY = Math.sin(VIEW_YAW);
    cosP = Math.cos(VIEW_PITCH); sinP = Math.sin(VIEW_PITCH);
  }

  function project(x3, y3, z3) {
    /* Rotate around Y, then tilt (rotate around X) */
    var xr = x3 * cosY + z3 * sinY;
    var zr = -x3 * sinY + z3 * cosY;
    var yf = y3 * cosP - zr * sinP;
    /* Return projected pseudo-Z for depth tests */
    return { x: CX + xr * SCALE + shakeX, y: CY - yf * SCALE + shakeY, z: zr * cosP + y3 * sinP };
  }

  function cross(a, b) {
    return { x: a.y*b.z - a.z*b.y, y: a.z*b.x - a.x*b.z, z: a.x*b.y - a.y*b.x };
  }
  function normalize(v) {
    var len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
    if (len < 1e-8) return { x:0, y:1, z:0 };
    return { x:v.x/len, y:v.y/len, z:v.z/len };
  }

  /* Get the 3D axis direction from tilt + precession + nutation */
  function getAxisDir() {
    var tilt = state.tiltBase + state.nutAngle;
    return {
      x: Math.sin(tilt) * Math.cos(state.precAngle),
      y: Math.cos(tilt),
      z: Math.sin(tilt) * Math.sin(state.precAngle)
    };
  }

  /* ══════════════════════════════════════════════════════════════
     S11  MACHINE CANVAS DRAWING
     ══════════════════════════════════════════════════════════════ */
  function drawMachine() {
    /* Compute shake offset (decays with impulseFade) */
    if (state.impulseFade > 0.05) {
      var shakeAmp = state.impulseFade * 6;
      shakeX = (Math.random() - 0.5) * shakeAmp;
      shakeY = (Math.random() - 0.5) * shakeAmp;
    } else { shakeX = 0; shakeY = 0; }

    mCtx.clearRect(0, 0, MW, MH);
    drawMachineBackground();
    drawStand();
    drawPrecessionPath();
    if (state.showTrail) drawTrail();
    drawNutationEnvelope();
    drawGyroscope();
    if (state.showSweep) drawPrecessionSweep();
    if (state.showVectors) drawVectors();
    drawImpulseFlash();
    drawStatusPanel();
    drawMachineLabel();
  }

  function drawNutationEnvelope() {
    /* Visualize the damping envelope of nutation as a fading band around the trail */
    var cfg = CONFIGS[state.configIdx].id;
    if (cfg !== 'nutation' && cfg !== 'forced') return;
    if (state.trail.length < 4) return;

    var dampFactor;
    if (cfg === 'nutation') dampFactor = Math.exp(-0.25 * state.time);
    else dampFactor = state.forcedNutAmp / 0.25;
    if (dampFactor < 0.02) return;

    /* Draw fading halo around recent trail points */
    var len = state.trail.length;
    mCtx.strokeStyle = hexToRGBA('#ffab40', 0.18 * dampFactor);
    mCtx.lineWidth = 8 * dampFactor;
    mCtx.lineCap = 'round';
    mCtx.beginPath();
    for (var i = Math.max(0, len - 80); i < len; i++) {
      var t = state.trail[i];
      if (i === Math.max(0, len - 80)) mCtx.moveTo(t.x, t.y);
      else mCtx.lineTo(t.x, t.y);
    }
    mCtx.stroke();
    mCtx.lineCap = 'butt';
  }

  function drawPrecessionSweep() {
    /* Animated rotating arrow along the precession cone — shows direction */
    var cfg = CONFIGS[state.configIdx].id;
    if (cfg === 'free' && !state.impulseActive) return;
    if (state.omegaPrec < 1e-5 && state.forcedPrecBoost < 1e-4 && !state.impulseActive) return;

    var tilt = state.tiltBase;
    var sweepR = Math.sin(tilt) * 0.7;
    var sweepY = Math.cos(tilt) * 0.7;
    /* Place arrow at current precAngle plus some lead */
    var a = state.precAngle;
    var aLead = a + 0.18;
    var p1 = project(Math.cos(a) * sweepR, sweepY, Math.sin(a) * sweepR);
    var p2 = project(Math.cos(aLead) * sweepR, sweepY, Math.sin(aLead) * sweepR);

    mCtx.strokeStyle = '#3ddc84';
    mCtx.lineWidth = 3;
    mCtx.lineCap = 'round';
    mCtx.beginPath(); mCtx.moveTo(p1.x, p1.y); mCtx.lineTo(p2.x, p2.y); mCtx.stroke();
    mCtx.lineCap = 'butt';
    drawArrowHead(mCtx, p1.x, p1.y, p2.x, p2.y, '#3ddc84', 9);

    /* Label Ω_p near the arrow */
    mCtx.fillStyle = '#3ddc84';
    mCtx.font = 'bold 11px monospace';
    mCtx.textAlign = 'left';
    mCtx.fillText('Ω_p', p2.x + 10, p2.y + 3);
  }

  function drawMachineBackground() {
    /* Industrial workshop floor gradient */
    var bg = mCtx.createLinearGradient(0, 0, 0, MH);
    bg.addColorStop(0, '#0a1018');
    bg.addColorStop(0.55, '#0f1622');
    bg.addColorStop(1, '#1a2230');
    mCtx.fillStyle = bg;
    mCtx.fillRect(0, 0, MW, MH);

    /* Floor perspective lines (ISO style) */
    mCtx.strokeStyle = 'rgba(58,72,100,0.22)';
    mCtx.lineWidth = 0.6;
    var floorY = CY + 210;
    for (var i = -8; i <= 8; i++) {
      mCtx.beginPath();
      mCtx.moveTo(CX + i * 40, floorY);
      mCtx.lineTo(CX + i * 140, MH);
      mCtx.stroke();
    }
    /* Horizontal floor bands */
    for (var b = 0; b < 6; b++) {
      var fy = floorY + b * (28 + b * 6);
      mCtx.beginPath();
      mCtx.moveTo(0, fy);
      mCtx.lineTo(MW, fy);
      mCtx.stroke();
    }

    /* Radial vignette spotlight */
    var rg = mCtx.createRadialGradient(CX, CY - 30, 30, CX, CY, 380);
    rg.addColorStop(0, 'rgba(255,170,80,0.07)');
    rg.addColorStop(0.6, 'rgba(255,111,0,0.025)');
    rg.addColorStop(1, 'transparent');
    mCtx.fillStyle = rg;
    mCtx.fillRect(0, 0, MW, MH);

    /* ISO centerline (CAD-style dashed vertical) */
    mCtx.strokeStyle = 'rgba(120,140,180,0.18)';
    mCtx.lineWidth = 0.8;
    mCtx.setLineDash([8, 4, 2, 4]);
    mCtx.beginPath();
    mCtx.moveTo(CX, 50); mCtx.lineTo(CX, MH - 30);
    mCtx.stroke();
    mCtx.setLineDash([]);
  }

  function drawStand() {
    /* === Base plate (industrial brushed steel) === */
    var baseW = 230, baseH = 22;
    var baseY = CY + 195;
    var baseX = CX - baseW / 2;

    /* Cast shadow under base */
    mCtx.fillStyle = 'rgba(0,0,0,0.55)';
    mCtx.beginPath();
    mCtx.ellipse(CX, baseY + baseH + 6, baseW/2 + 10, 8, 0, 0, TWO_PI);
    mCtx.fill();

    /* Base body */
    var bg = mCtx.createLinearGradient(baseX, baseY, baseX, baseY + baseH);
    bg.addColorStop(0, '#7a8696'); bg.addColorStop(0.5, '#4a5562'); bg.addColorStop(1, '#2c333d');
    mCtx.fillStyle = bg;
    roundRect(mCtx, baseX, baseY, baseW, baseH, 5);
    mCtx.fill();
    /* Brushed metal striations */
    mCtx.strokeStyle = 'rgba(255,255,255,0.04)';
    mCtx.lineWidth = 0.5;
    for (var s = 0; s < 14; s++) {
      var sy = baseY + 2 + s * 1.4;
      mCtx.beginPath(); mCtx.moveTo(baseX + 3, sy); mCtx.lineTo(baseX + baseW - 3, sy); mCtx.stroke();
    }
    /* Top highlight */
    mCtx.strokeStyle = 'rgba(220,230,245,0.45)';
    mCtx.lineWidth = 1;
    mCtx.beginPath(); mCtx.moveTo(baseX + 4, baseY + 1); mCtx.lineTo(baseX + baseW - 4, baseY + 1); mCtx.stroke();
    /* Border */
    mCtx.strokeStyle = '#212830'; mCtx.lineWidth = 1.2;
    roundRect(mCtx, baseX, baseY, baseW, baseH, 5); mCtx.stroke();

    /* Mounting bolts (4 hex bolts) */
    [baseX + 22, baseX + 75, baseX + baseW - 75, baseX + baseW - 22].forEach(function(bx) {
      var by = baseY + baseH / 2;
      mCtx.fillStyle = '#1c2128';
      mCtx.beginPath(); mCtx.arc(bx, by, 4.2, 0, TWO_PI); mCtx.fill();
      mCtx.fillStyle = '#8b96a5';
      mCtx.beginPath();
      for (var k = 0; k < 6; k++) {
        var ha = k * Math.PI / 3;
        var hx = bx + Math.cos(ha) * 3, hy = by + Math.sin(ha) * 3;
        if (k === 0) mCtx.moveTo(hx, hy); else mCtx.lineTo(hx, hy);
      }
      mCtx.closePath(); mCtx.fill();
      mCtx.strokeStyle = '#2a3038'; mCtx.lineWidth = 0.5; mCtx.stroke();
      mCtx.fillStyle = 'rgba(255,255,255,0.35)';
      mCtx.beginPath(); mCtx.arc(bx - 0.8, by - 0.8, 0.9, 0, TWO_PI); mCtx.fill();
    });

    /* Brand plate */
    mCtx.fillStyle = 'rgba(0,0,0,0.5)';
    roundRect(mCtx, CX - 28, baseY + 6, 56, 9, 2); mCtx.fill();
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.85);
    mCtx.font = 'bold 6.5px monospace';
    mCtx.textAlign = 'center'; mCtx.textBaseline = 'middle';
    mCtx.fillText('GYR-100 ISO', CX, baseY + 10.5);

    /* === Vertical column (machined steel) === */
    var colW = 18, colH = 195;
    var colX = CX - colW/2, colY = baseY - colH;
    var cg = mCtx.createLinearGradient(colX, colY, colX + colW, colY);
    cg.addColorStop(0, '#2c333d');
    cg.addColorStop(0.35, '#8b96a5');
    cg.addColorStop(0.5, '#c8d1dc');
    cg.addColorStop(0.65, '#8b96a5');
    cg.addColorStop(1, '#2c333d');
    mCtx.fillStyle = cg;
    mCtx.fillRect(colX, colY, colW, colH);
    /* Column rivets */
    mCtx.fillStyle = '#1c2128';
    for (var r = 0; r < 4; r++) {
      var ry = colY + 30 + r * 45;
      mCtx.beginPath(); mCtx.arc(colX + 3, ry, 1.4, 0, TWO_PI); mCtx.fill();
      mCtx.beginPath(); mCtx.arc(colX + colW - 3, ry, 1.4, 0, TWO_PI); mCtx.fill();
    }
    /* Column edges */
    mCtx.strokeStyle = '#1a1f26'; mCtx.lineWidth = 0.8;
    mCtx.strokeRect(colX, colY, colW, colH);

    /* Column-to-base fillet */
    mCtx.fillStyle = '#3a434f';
    mCtx.beginPath();
    mCtx.moveTo(colX - 10, baseY);
    mCtx.lineTo(colX, colY + colH - 10);
    mCtx.lineTo(colX + colW, colY + colH - 10);
    mCtx.lineTo(colX + colW + 10, baseY);
    mCtx.closePath();
    mCtx.fill();

    /* === Pivot bracket === */
    var bktW = 44, bktH = 22;
    var bg2 = mCtx.createLinearGradient(0, colY - bktH/2, 0, colY + bktH/2);
    bg2.addColorStop(0, '#8b96a5'); bg2.addColorStop(1, '#3a434f');
    mCtx.fillStyle = bg2;
    roundRect(mCtx, CX - bktW/2, colY - bktH/2, bktW, bktH, 4);
    mCtx.fill();
    mCtx.strokeStyle = '#1c2128'; mCtx.lineWidth = 1;
    roundRect(mCtx, CX - bktW/2, colY - bktH/2, bktW, bktH, 4); mCtx.stroke();
    /* Bracket bolts */
    [-14, 14].forEach(function(dx) {
      mCtx.fillStyle = '#1c2128';
      mCtx.beginPath(); mCtx.arc(CX + dx, colY, 2.5, 0, TWO_PI); mCtx.fill();
      mCtx.fillStyle = '#a0aab8';
      mCtx.beginPath(); mCtx.arc(CX + dx, colY, 1.5, 0, TWO_PI); mCtx.fill();
    });

    /* === Pivot ball joint === */
    var pg = mCtx.createRadialGradient(CX - 3, CY - 3, 1, CX, CY, 10);
    pg.addColorStop(0, '#e6ecf4');
    pg.addColorStop(0.5, '#a0aab8');
    pg.addColorStop(1, '#3a434f');
    mCtx.fillStyle = pg;
    mCtx.beginPath(); mCtx.arc(CX, CY, 9, 0, TWO_PI); mCtx.fill();
    mCtx.strokeStyle = '#1c2128'; mCtx.lineWidth = 1;
    mCtx.beginPath(); mCtx.arc(CX, CY, 9, 0, TWO_PI); mCtx.stroke();
    /* Pivot accent ring */
    mCtx.strokeStyle = ACCENT; mCtx.lineWidth = 1.5;
    mCtx.beginPath(); mCtx.arc(CX, CY, 11, 0, TWO_PI); mCtx.stroke();
  }

  function drawPrecessionPath() {
    var cfg = CONFIGS[state.configIdx].id;
    if (cfg === 'free' && !state.impulseActive) return;
    if (state.omegaPrec < 1e-6 && state.forcedPrecBoost < 1e-4 && !state.impulseActive) return;

    /* Draw the cone path the axle tip traces */
    var tilt = state.tiltBase;
    var pathR = Math.sin(tilt);  // radius of cone in 3D units
    var axleLen = 0.7;

    mCtx.strokeStyle = hexToRGBA('#3ddc84', 0.25);
    mCtx.lineWidth = 1;
    mCtx.setLineDash([5, 4]);
    mCtx.beginPath();
    for (var i = 0; i <= 72; i++) {
      var a = (i / 72) * TWO_PI;
      var x3 = Math.sin(tilt) * Math.cos(a) * axleLen;
      var y3 = Math.cos(tilt) * axleLen;
      var z3 = Math.sin(tilt) * Math.sin(a) * axleLen;
      var p = project(x3, y3, z3);
      if (i === 0) mCtx.moveTo(p.x, p.y);
      else mCtx.lineTo(p.x, p.y);
    }
    mCtx.closePath();
    mCtx.stroke();
    mCtx.setLineDash([]);
  }

  function drawTrail() {
    if (state.trail.length < 2) return;
    var len = state.trail.length;
    for (var i = 1; i < len; i++) {
      var alpha = (i / len) * 0.6;
      mCtx.strokeStyle = hexToRGBA('#3ddc84', alpha);
      mCtx.lineWidth = 1.5 * (i / len);
      mCtx.beginPath();
      mCtx.moveTo(state.trail[i-1].x, state.trail[i-1].y);
      mCtx.lineTo(state.trail[i].x, state.trail[i].y);
      mCtx.stroke();
    }
    /* Tip glow */
    if (len > 0) {
      var last = state.trail[len - 1];
      mCtx.fillStyle = hexToRGBA('#3ddc84', 0.3);
      mCtx.beginPath(); mCtx.arc(last.x, last.y, 5, 0, TWO_PI); mCtx.fill();
    }
  }

  function drawGyroscope() {
    var axis = getAxisDir();
    var axleLen = 0.7; // 3D units

    /* Axle endpoints */
    var tip1 = project(axis.x * axleLen, axis.y * axleLen, axis.z * axleLen);
    var tip2 = project(-axis.x * axleLen * 0.4, -axis.y * axleLen * 0.4 + (axis.y > 0.5 ? 0 : 0), -axis.z * axleLen * 0.4);
    var pivot = project(0, 0, 0);

    /* ── Gimbal rings (orthogonal, depth-sorted) ── */
    if (state.showGimbals) {
      drawGimbalRingPlane(0.70, '#5a6573', 'horizontal', 0);                            // outer = horizontal (fixed)
      drawGimbalRingPlane(0.55, hexToRGBA(ACCENT, 0.75), 'vertical', state.precAngle);  // inner = rotates w/ precession
    }

    /* ── Axle rod ── */
    var ag = mCtx.createLinearGradient(tip2.x, tip2.y, tip1.x, tip1.y);
    ag.addColorStop(0, '#78909c');
    ag.addColorStop(0.5, '#b0bec5');
    ag.addColorStop(1, '#90a4ae');
    mCtx.strokeStyle = ag;
    mCtx.lineWidth = 5;
    mCtx.lineCap = 'round';
    mCtx.beginPath();
    mCtx.moveTo(tip2.x, tip2.y);
    mCtx.lineTo(tip1.x, tip1.y);
    mCtx.stroke();
    mCtx.lineCap = 'butt';

    /* Axle end caps */
    [tip1, tip2].forEach(function(p) {
      mCtx.fillStyle = '#607d8b';
      mCtx.beginPath(); mCtx.arc(p.x, p.y, 4, 0, TWO_PI); mCtx.fill();
      mCtx.fillStyle = '#90a4ae';
      mCtx.beginPath(); mCtx.arc(p.x, p.y, 2, 0, TWO_PI); mCtx.fill();
    });

    /* ── Spinning disc ── */
    drawDisc(axis, axleLen * 0.5);

    /* ── Applied weight (if not free mode) ── */
    var cfg = CONFIGS[state.configIdx].id;
    if (cfg !== 'free') {
      drawWeight(tip1);
    }
  }

  /* Draw a gimbal ring on either the horizontal plane (y=0) or vertical plane,
     with near/far halves drawn separately for depth shading. */
  function drawGimbalRingPlane(radius, color, plane, rotAngle) {
    var N = 96;
    var pts = [];
    for (var i = 0; i <= N; i++) {
      var a = (i / N) * TWO_PI + rotAngle;
      var x3, y3, z3;
      if (plane === 'horizontal') {
        x3 = Math.cos(a) * radius; y3 = 0; z3 = Math.sin(a) * radius;
      } else {
        /* Vertical ring rotating about Y axis (its plane normal is horizontal) */
        x3 = Math.cos(a) * radius * Math.cos(rotAngle); // simplified: produce a great circle perp to precession axis
        /* Actually: vertical ring with normal in xz-plane at angle rotAngle */
        x3 = Math.sin(a) * radius * Math.cos(rotAngle + PI/2);
        y3 = Math.cos(a) * radius;
        z3 = Math.sin(a) * radius * Math.sin(rotAngle + PI/2);
      }
      pts.push(project(x3, y3, z3));
    }

    /* Far half (drawn with reduced alpha) */
    mCtx.strokeStyle = hexToRGBA(color.indexOf('rgba') >= 0 ? '#5a6573' : color, 0.35);
    mCtx.lineWidth = 2;
    mCtx.beginPath();
    for (var j = 0; j < pts.length; j++) {
      if (pts[j].z < 0) {
        if (j === 0 || pts[j-1].z >= 0) mCtx.moveTo(pts[j].x, pts[j].y);
        else mCtx.lineTo(pts[j].x, pts[j].y);
      }
    }
    mCtx.stroke();

    /* Near half (bright) */
    mCtx.strokeStyle = color;
    mCtx.lineWidth = 2.5;
    mCtx.beginPath();
    for (var k = 0; k < pts.length; k++) {
      if (pts[k].z >= 0) {
        if (k === 0 || pts[k-1].z < 0) mCtx.moveTo(pts[k].x, pts[k].y);
        else mCtx.lineTo(pts[k].x, pts[k].y);
      }
    }
    mCtx.stroke();

    /* Tick marks every 30° */
    var tickCol = color.indexOf('rgba') >= 0 ? ACCENT : color;
    mCtx.strokeStyle = hexToRGBA(tickCol, 0.5);
    mCtx.lineWidth = 1;
    for (var t = 0; t < 12; t++) {
      var ta = (t / 12) * TWO_PI + rotAngle;
      var p1, p2;
      if (plane === 'horizontal') {
        p1 = project(Math.cos(ta) * (radius - 0.025), 0, Math.sin(ta) * (radius - 0.025));
        p2 = project(Math.cos(ta) * (radius + 0.025), 0, Math.sin(ta) * (radius + 0.025));
      } else {
        var nx = Math.cos(rotAngle + PI/2), nz = Math.sin(rotAngle + PI/2);
        p1 = project(Math.sin(ta) * (radius - 0.025) * nx, Math.cos(ta) * (radius - 0.025), Math.sin(ta) * (radius - 0.025) * nz);
        p2 = project(Math.sin(ta) * (radius + 0.025) * nx, Math.cos(ta) * (radius + 0.025), Math.sin(ta) * (radius + 0.025) * nz);
      }
      if (p1.z >= -0.1) {
        mCtx.beginPath(); mCtx.moveTo(p1.x, p1.y); mCtx.lineTo(p2.x, p2.y); mCtx.stroke();
      }
    }
  }

  function drawDisc(axis, distFromPivot) {
    /* === Setup disc-local frame === */
    var cx3 = axis.x * distFromPivot;
    var cy3 = axis.y * distFromPivot;
    var cz3 = axis.z * distFromPivot;
    var center = project(cx3, cy3, cz3);

    var up = { x: 0, y: 1, z: 0 };
    var u = cross(axis, up);
    var uLen = Math.sqrt(u.x*u.x + u.y*u.y + u.z*u.z);
    if (uLen < 0.01) { u = cross(axis, { x: 1, y: 0, z: 0 }); }
    u = normalize(u);
    var v = normalize(cross(axis, u));

    /* Disc parameters — scale radius with state.discRadius */
    var radiusFactor = 0.5 + (state.discRadius / 0.2) * 0.4; // 0.5–1.3 range
    var discR = 0.32 * radiusFactor;
    var thickness = 0.05 * Math.min(1.5, 0.6 + state.discMass / 5);
    var segments = 64;

    /* Compute back face (cz3 - axis*thickness/2) and front face centers */
    var bx3 = cx3 - axis.x * thickness * 0.5;
    var by3 = cy3 - axis.y * thickness * 0.5;
    var bz3 = cz3 - axis.z * thickness * 0.5;
    var fx3 = cx3 + axis.x * thickness * 0.5;
    var fy3 = cy3 + axis.y * thickness * 0.5;
    var fz3 = cz3 + axis.z * thickness * 0.5;
    var frontCenter = project(fx3, fy3, fz3);
    var backCenter  = project(bx3, by3, bz3);

    /* Determine which face is "front" (closer to camera) by comparing z */
    var frontIsFront = frontCenter.z >= backCenter.z;
    var nearC = frontIsFront ? { x:fx3, y:fy3, z:fz3, proj:frontCenter } : { x:bx3, y:by3, z:bz3, proj:backCenter };
    var farC  = frontIsFront ? { x:bx3, y:by3, z:bz3, proj:backCenter }  : { x:fx3, y:fy3, z:fz3, proj:frontCenter };

    /* === Far-face rim (drawn first, behind) === */
    mCtx.strokeStyle = '#2c333d';
    mCtx.lineWidth = 1.5;
    mCtx.beginPath();
    for (var i = 0; i <= segments; i++) {
      var a = (i / segments) * TWO_PI;
      var px = farC.x + u.x * Math.cos(a) * discR + v.x * Math.sin(a) * discR;
      var py = farC.y + u.y * Math.cos(a) * discR + v.y * Math.sin(a) * discR;
      var pz = farC.z + u.z * Math.cos(a) * discR + v.z * Math.sin(a) * discR;
      var p = project(px, py, pz);
      if (i === 0) mCtx.moveTo(p.x, p.y); else mCtx.lineTo(p.x, p.y);
    }
    mCtx.closePath(); mCtx.stroke();

    /* === Cylinder side band (connect near & far rims) === */
    /* Build points around both rims */
    var nearPts = [], farPts = [];
    for (var n = 0; n <= segments; n++) {
      var an = (n / segments) * TWO_PI;
      var npx = nearC.x + u.x * Math.cos(an) * discR + v.x * Math.sin(an) * discR;
      var npy = nearC.y + u.y * Math.cos(an) * discR + v.y * Math.sin(an) * discR;
      var npz = nearC.z + u.z * Math.cos(an) * discR + v.z * Math.sin(an) * discR;
      var fpx = farC.x  + u.x * Math.cos(an) * discR + v.x * Math.sin(an) * discR;
      var fpy = farC.y  + u.y * Math.cos(an) * discR + v.y * Math.sin(an) * discR;
      var fpz = farC.z  + u.z * Math.cos(an) * discR + v.z * Math.sin(an) * discR;
      nearPts.push(project(npx, npy, npz));
      farPts.push(project(fpx, fpy, fpz));
    }
    /* Fill cylinder side as quad strips (visible portion only) */
    var bandGrad = mCtx.createLinearGradient(center.x - 50, center.y, center.x + 50, center.y);
    bandGrad.addColorStop(0, '#2a313a');
    bandGrad.addColorStop(0.5, '#6b7686');
    bandGrad.addColorStop(1, '#2a313a');
    mCtx.fillStyle = bandGrad;
    mCtx.beginPath();
    mCtx.moveTo(nearPts[0].x, nearPts[0].y);
    for (var q = 1; q < nearPts.length; q++) mCtx.lineTo(nearPts[q].x, nearPts[q].y);
    for (var q2 = farPts.length - 1; q2 >= 0; q2--) mCtx.lineTo(farPts[q2].x, farPts[q2].y);
    mCtx.closePath();
    mCtx.fill();
    mCtx.strokeStyle = '#1c2128'; mCtx.lineWidth = 1; mCtx.stroke();

    /* === Near (front) face === */
    /* Disc face outline */
    mCtx.beginPath();
    for (var f = 0; f < nearPts.length; f++) {
      if (f === 0) mCtx.moveTo(nearPts[f].x, nearPts[f].y);
      else mCtx.lineTo(nearPts[f].x, nearPts[f].y);
    }
    mCtx.closePath();

    /* Brushed-steel radial gradient */
    var dg = mCtx.createRadialGradient(
      nearC.proj.x - 20, nearC.proj.y - 20, 4,
      nearC.proj.x, nearC.proj.y, discR * SCALE
    );
    dg.addColorStop(0, '#d4dde8');
    dg.addColorStop(0.35, '#8b96a5');
    dg.addColorStop(0.7, '#4a5562');
    dg.addColorStop(1, '#1c2128');
    mCtx.fillStyle = dg;
    mCtx.fill();
    mCtx.strokeStyle = '#0a0e14'; mCtx.lineWidth = 2; mCtx.stroke();

    /* === HIGH-CONTRAST SPIN MARKERS (the key fix for visible rotation) === */
    /* (1) Big colored wedge — sweeps with spin */
    var wedgeStart = state.spinAngle;
    var wedgeSpan = TWO_PI / 6; // 60° wedge
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.85);
    mCtx.beginPath();
    mCtx.moveTo(nearC.proj.x, nearC.proj.y);
    for (var w = 0; w <= 12; w++) {
      var wa = wedgeStart + (w / 12) * wedgeSpan;
      var wx = nearC.x + u.x * Math.cos(wa) * discR * 0.92 + v.x * Math.sin(wa) * discR * 0.92;
      var wy = nearC.y + u.y * Math.cos(wa) * discR * 0.92 + v.y * Math.sin(wa) * discR * 0.92;
      var wz = nearC.z + u.z * Math.cos(wa) * discR * 0.92 + v.z * Math.sin(wa) * discR * 0.92;
      var wp = project(wx, wy, wz);
      mCtx.lineTo(wp.x, wp.y);
    }
    mCtx.closePath();
    mCtx.fill();
    mCtx.strokeStyle = '#ffab40';
    mCtx.lineWidth = 1.5;
    mCtx.stroke();

    /* (2) Opposite-side red wedge (smaller) for color contrast */
    var wedge2 = state.spinAngle + PI;
    var wedge2Span = TWO_PI / 12;
    mCtx.fillStyle = '#ff3333';
    mCtx.beginPath();
    mCtx.moveTo(nearC.proj.x, nearC.proj.y);
    for (var w2 = 0; w2 <= 8; w2++) {
      var w2a = wedge2 + (w2 / 8) * wedge2Span;
      var w2x = nearC.x + u.x * Math.cos(w2a) * discR * 0.92 + v.x * Math.sin(w2a) * discR * 0.92;
      var w2y = nearC.y + u.y * Math.cos(w2a) * discR * 0.92 + v.y * Math.sin(w2a) * discR * 0.92;
      var w2z = nearC.z + u.z * Math.cos(w2a) * discR * 0.92 + v.z * Math.sin(w2a) * discR * 0.92;
      var w2p = project(w2x, w2y, w2z);
      mCtx.lineTo(w2p.x, w2p.y);
    }
    mCtx.closePath();
    mCtx.fill();

    /* (3) White bold tip-marker dot — orbits at outer rim */
    var dotA = state.spinAngle + wedgeSpan * 0.5;
    var dotR = discR * 0.78;
    var dotP = project(
      nearC.x + u.x * Math.cos(dotA) * dotR + v.x * Math.sin(dotA) * dotR,
      nearC.y + u.y * Math.cos(dotA) * dotR + v.y * Math.sin(dotA) * dotR,
      nearC.z + u.z * Math.cos(dotA) * dotR + v.z * Math.sin(dotA) * dotR
    );
    mCtx.fillStyle = '#ffffff';
    mCtx.beginPath(); mCtx.arc(dotP.x, dotP.y, 5, 0, TWO_PI); mCtx.fill();
    mCtx.strokeStyle = '#1c2128'; mCtx.lineWidth = 1.2;
    mCtx.stroke();

    /* (4) Motion-blur arc trail (only visible when spinning fast) */
    if (state.running && state.spinRPM > 500) {
      var blurAlpha = clamp((state.spinRPM - 500) / 2000, 0.15, 0.55);
      mCtx.strokeStyle = hexToRGBA(ACCENT, blurAlpha);
      mCtx.lineWidth = 7;
      mCtx.lineCap = 'round';
      mCtx.beginPath();
      var blurSpan = Math.min(TWO_PI * 0.7, clamp(state.spinRPM / 4000, 0.5, 4.5));
      for (var bi = 0; bi <= 24; bi++) {
        var ba = state.spinAngle - (bi / 24) * blurSpan;
        var bx = nearC.x + u.x * Math.cos(ba) * discR * 0.82 + v.x * Math.sin(ba) * discR * 0.82;
        var by = nearC.y + u.y * Math.cos(ba) * discR * 0.82 + v.y * Math.sin(ba) * discR * 0.82;
        var bz = nearC.z + u.z * Math.cos(ba) * discR * 0.82 + v.z * Math.sin(ba) * discR * 0.82;
        var bp = project(bx, by, bz);
        if (bi === 0) mCtx.moveTo(bp.x, bp.y); else mCtx.lineTo(bp.x, bp.y);
      }
      mCtx.stroke();
      mCtx.lineCap = 'butt';
    }

    /* (5) Radial spokes (every 45°) for additional rotation cue */
    mCtx.strokeStyle = 'rgba(220,230,245,0.55)';
    mCtx.lineWidth = 1.8;
    for (var sp = 0; sp < 4; sp++) {
      var spa = state.spinAngle + sp * (TWO_PI / 4) + TWO_PI / 8;
      var sp1 = project(
        nearC.x + u.x * Math.cos(spa) * 0.06 + v.x * Math.sin(spa) * 0.06,
        nearC.y + u.y * Math.cos(spa) * 0.06 + v.y * Math.sin(spa) * 0.06,
        nearC.z + u.z * Math.cos(spa) * 0.06 + v.z * Math.sin(spa) * 0.06
      );
      var sp2 = project(
        nearC.x + u.x * Math.cos(spa) * discR * 0.85 + v.x * Math.sin(spa) * discR * 0.85,
        nearC.y + u.y * Math.cos(spa) * discR * 0.85 + v.y * Math.sin(spa) * discR * 0.85,
        nearC.z + u.z * Math.cos(spa) * discR * 0.85 + v.z * Math.sin(spa) * discR * 0.85
      );
      mCtx.beginPath(); mCtx.moveTo(sp1.x, sp1.y); mCtx.lineTo(sp2.x, sp2.y); mCtx.stroke();
    }

    /* === Center hub (3D bolt) === */
    var hubGrad = mCtx.createRadialGradient(
      nearC.proj.x - 3, nearC.proj.y - 3, 1,
      nearC.proj.x, nearC.proj.y, 14
    );
    hubGrad.addColorStop(0, '#e6ecf4');
    hubGrad.addColorStop(0.6, '#5a6573');
    hubGrad.addColorStop(1, '#1c2128');
    mCtx.fillStyle = hubGrad;
    mCtx.beginPath(); mCtx.arc(nearC.proj.x, nearC.proj.y, 11, 0, TWO_PI); mCtx.fill();
    mCtx.strokeStyle = '#0a0e14'; mCtx.lineWidth = 1;
    mCtx.beginPath(); mCtx.arc(nearC.proj.x, nearC.proj.y, 11, 0, TWO_PI); mCtx.stroke();
    /* Hex bolt pattern */
    mCtx.fillStyle = '#2a313a';
    mCtx.beginPath();
    for (var hb = 0; hb < 6; hb++) {
      var hba = state.spinAngle + hb * (PI/3);
      var hx = nearC.proj.x + Math.cos(hba) * 5;
      var hy = nearC.proj.y + Math.sin(hba) * 5;
      if (hb === 0) mCtx.moveTo(hx, hy); else mCtx.lineTo(hx, hy);
    }
    mCtx.closePath();
    mCtx.fill();

    /* === Rim glow for very high RPM === */
    if (state.running && state.spinRPM > 3000) {
      var glowAlpha = clamp((state.spinRPM - 3000) / 7000, 0, 0.5);
      mCtx.strokeStyle = hexToRGBA('#ffab40', glowAlpha);
      mCtx.lineWidth = 5;
      mCtx.beginPath();
      for (var rg2 = 0; rg2 < nearPts.length; rg2++) {
        if (rg2 === 0) mCtx.moveTo(nearPts[rg2].x, nearPts[rg2].y);
        else mCtx.lineTo(nearPts[rg2].x, nearPts[rg2].y);
      }
      mCtx.closePath();
      mCtx.stroke();
    }
  }

  function drawWeight(tipPos) {
    /* Hanging weight at the axle tip */
    var wY = tipPos.y + 20;
    mCtx.strokeStyle = '#90a4ae';
    mCtx.lineWidth = 1.5;
    mCtx.beginPath(); mCtx.moveTo(tipPos.x, tipPos.y); mCtx.lineTo(tipPos.x, wY); mCtx.stroke();

    /* Weight block */
    var wSize = clamp(state.appliedWeight * 4, 10, 24);
    mCtx.fillStyle = ACCENT;
    roundRect(mCtx, tipPos.x - wSize/2, wY, wSize, wSize, 3);
    mCtx.fill();
    mCtx.strokeStyle = '#ffab40';
    mCtx.lineWidth = 1;
    roundRect(mCtx, tipPos.x - wSize/2, wY, wSize, wSize, 3);
    mCtx.stroke();

    /* Weight label */
    mCtx.fillStyle = '#fff';
    mCtx.font = 'bold 9px monospace';
    mCtx.textAlign = 'center';
    mCtx.textBaseline = 'middle';
    mCtx.fillText(state.appliedWeight.toFixed(1) + 'N', tipPos.x, wY + wSize/2);

    /* Gravity arrow */
    var arrY = wY + wSize + 5;
    mCtx.strokeStyle = '#ff5555';
    mCtx.lineWidth = 1.5;
    mCtx.beginPath(); mCtx.moveTo(tipPos.x, wY + wSize); mCtx.lineTo(tipPos.x, arrY + 10); mCtx.stroke();
    mCtx.fillStyle = '#ff5555';
    mCtx.beginPath();
    mCtx.moveTo(tipPos.x, arrY + 15);
    mCtx.lineTo(tipPos.x - 4, arrY + 8);
    mCtx.lineTo(tipPos.x + 4, arrY + 8);
    mCtx.closePath();
    mCtx.fill();
    mCtx.font = '8px monospace';
    mCtx.fillText('W', tipPos.x + 10, arrY + 10);
  }

  function drawVectors() {
    if (!state.running && state.spinAngle === 0) return;
    var axis = getAxisDir();
    var axleLen = 0.7;

    /* ── Angular Momentum vector L (yellow, beyond disc along axis) ── */
    var Lscale = clamp(state.L * 8, 0.30, 0.85);
    var Lstart = project(axis.x * 0.55, axis.y * 0.55, axis.z * 0.55);
    var Lend = project(axis.x * (0.55 + Lscale), axis.y * (0.55 + Lscale), axis.z * (0.55 + Lscale));

    /* Outer glow */
    mCtx.strokeStyle = hexToRGBA('#fdd835', 0.22);
    mCtx.lineWidth = 8;
    mCtx.lineCap = 'round';
    mCtx.beginPath(); mCtx.moveTo(Lstart.x, Lstart.y); mCtx.lineTo(Lend.x, Lend.y); mCtx.stroke();
    mCtx.strokeStyle = '#fdd835';
    mCtx.lineWidth = 3.5;
    mCtx.beginPath(); mCtx.moveTo(Lstart.x, Lstart.y); mCtx.lineTo(Lend.x, Lend.y); mCtx.stroke();
    mCtx.lineCap = 'butt';
    drawArrowHead(mCtx, Lstart.x, Lstart.y, Lend.x, Lend.y, '#fdd835', 12);

    /* L label with value */
    mCtx.fillStyle = '#fdd835';
    mCtx.font = 'bold 14px monospace';
    mCtx.textAlign = 'left';
    mCtx.fillText('L', Lend.x + 12, Lend.y - 7);
    mCtx.font = '9px monospace';
    mCtx.fillStyle = hexToRGBA('#fdd835', 0.8);
    mCtx.fillText(roundN(state.L, 2) + ' kg·m²/s', Lend.x + 12, Lend.y + 6);

    /* ── ω (spin) label with curved arrow ── */
    var omP = project(axis.x * 0.30, axis.y * 0.30, axis.z * 0.30);
    mCtx.strokeStyle = '#00bcd4';
    mCtx.lineWidth = 2;
    mCtx.beginPath();
    mCtx.arc(omP.x + 48, omP.y - 4, 11, -PI * 0.85, PI * 0.85);
    mCtx.stroke();
    drawArrowHead(mCtx,
      omP.x + 48 + 11*Math.cos(PI*0.70), omP.y - 4 + 11*Math.sin(PI*0.70),
      omP.x + 48 + 11*Math.cos(PI*0.85), omP.y - 4 + 11*Math.sin(PI*0.85),
      '#00bcd4', 7);
    mCtx.fillStyle = '#00bcd4';
    mCtx.font = 'bold 13px monospace';
    mCtx.textAlign = 'left';
    mCtx.fillText('ω', omP.x + 64, omP.y - 1);
    mCtx.font = '9px monospace';
    mCtx.fillStyle = hexToRGBA('#00bcd4', 0.8);
    mCtx.fillText(state.spinRPM + ' RPM', omP.x + 64, omP.y + 10);

    /* ── Torque vector τ (red, downward if weight applied) ── */
    var cfg = CONFIGS[state.configIdx].id;
    if (cfg !== 'free' || state.impulseActive) {
      /* τ direction in 3D: perpendicular to axis in horizontal plane (r × F, F = -y) */
      var tauX = -axis.z;
      var tauZ = axis.x;
      var tn = Math.sqrt(tauX*tauX + tauZ*tauZ);
      if (tn > 1e-6) { tauX /= tn; tauZ /= tn; }
      /* For gravity torque, τ = r × F, direction is horizontal */

      var tipS = project(axis.x * 0.7, axis.y * 0.7, axis.z * 0.7);
      var tEnd = project(axis.x * 0.7 + tauX * 0.32, axis.y * 0.7, axis.z * 0.7 + tauZ * 0.32);

      /* Outer glow */
      mCtx.strokeStyle = hexToRGBA('#ff3333', 0.25);
      mCtx.lineWidth = 8;
      mCtx.lineCap = 'round';
      mCtx.beginPath(); mCtx.moveTo(tipS.x, tipS.y); mCtx.lineTo(tEnd.x, tEnd.y); mCtx.stroke();
      /* Main */
      mCtx.strokeStyle = '#ff3333';
      mCtx.lineWidth = 3;
      mCtx.beginPath(); mCtx.moveTo(tipS.x, tipS.y); mCtx.lineTo(tEnd.x, tEnd.y); mCtx.stroke();
      mCtx.lineCap = 'butt';
      drawArrowHead(mCtx, tipS.x, tipS.y, tEnd.x, tEnd.y, '#ff3333', 11);

      mCtx.fillStyle = '#ff3333';
      mCtx.font = 'bold 14px monospace';
      mCtx.textAlign = 'left';
      mCtx.fillText('\u03c4', tEnd.x + 10, tEnd.y - 2);
      mCtx.font = '9px monospace';
      mCtx.fillStyle = hexToRGBA('#ff3333', 0.8);
      mCtx.fillText(roundN(state.tau, 2) + ' N\u00b7m', tEnd.x + 10, tEnd.y + 11);
    }

    /* ── dL/dt direction indicator (green, perpendicular to τ and L) ── */
    if (state.running && (state.omegaPrec > 1e-4 || state.impulseFade > 0)) {
      /* Show the 90° rule: dL is perpendicular to both L and τ */
      var precDir = {
        x: -Math.sin(state.precAngle),
        y: 0,
        z: Math.cos(state.precAngle)
      };
      var dLscale = 0.15;
      var dLstart = project(axis.x * 0.15, axis.y * 0.15, axis.z * 0.15);
      var dLend   = project(axis.x * 0.15 + precDir.x * dLscale, axis.y * 0.15, axis.z * 0.15 + precDir.z * dLscale);

      mCtx.strokeStyle = '#3ddc84';
      mCtx.lineWidth = 2;
      mCtx.setLineDash([4, 3]);
      mCtx.beginPath(); mCtx.moveTo(dLstart.x, dLstart.y); mCtx.lineTo(dLend.x, dLend.y); mCtx.stroke();
      mCtx.setLineDash([]);
      drawArrowHead(mCtx, dLstart.x, dLstart.y, dLend.x, dLend.y, '#3ddc84', 7);

      mCtx.fillStyle = '#3ddc84';
      mCtx.font = '10px monospace';
      mCtx.textAlign = 'left';
      mCtx.fillText('dL/dt', dLend.x + 8, dLend.y + 3);
    }
  }

  function drawImpulseFlash() {
    if (state.impulseFade <= 0) return;
    var alpha = state.impulseFade * 0.7;

    /* Flash ring around pivot */
    mCtx.strokeStyle = hexToRGBA('#ff5555', alpha);
    mCtx.lineWidth = 3 * state.impulseFade;
    mCtx.beginPath();
    mCtx.arc(CX, CY, 30 + (1 - state.impulseFade) * 40, 0, TWO_PI);
    mCtx.stroke();

    /* "90° RULE" annotation */
    if (state.impulseFade > 0.3) {
      mCtx.fillStyle = hexToRGBA('#3ddc84', (state.impulseFade - 0.3) * 1.4);
      mCtx.font = 'bold 13px monospace';
      mCtx.textAlign = 'center';
      mCtx.fillText('90\u00b0 RULE: \u0394L \u22a5 \u03c4', CX, CY - 160);
      mCtx.font = '10px monospace';
      mCtx.fillStyle = hexToRGBA('#ccc', (state.impulseFade - 0.3) * 1.4);
      mCtx.fillText('Axis moves perpendicular to applied torque', CX, CY - 145);
    }
  }

  function drawStatusPanel() {
    /* Top-right status panel */
    var px = 405, py = 25, pw = 140, ph = 110;
    mCtx.fillStyle = 'rgba(22,27,39,0.85)';
    roundRect(mCtx, px, py, pw, ph, 8);
    mCtx.fill();
    mCtx.strokeStyle = hexToRGBA(ACCENT, 0.4);
    mCtx.lineWidth = 1;
    roundRect(mCtx, px, py, pw, ph, 8);
    mCtx.stroke();

    /* Speed display */
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.7);
    mCtx.font = '9px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('SPIN SPEED', px + pw/2, py + 18);

    mCtx.fillStyle = ACCENT;
    mCtx.font = 'bold 24px monospace';
    mCtx.fillText(state.spinRPM, px + pw/2, py + 45);

    mCtx.fillStyle = hexToRGBA(ACCENT, 0.5);
    mCtx.font = '10px monospace';
    mCtx.fillText('RPM', px + pw/2, py + 58);

    /* Status readouts */
    mCtx.font = '9px monospace';
    mCtx.textAlign = 'left';
    var items = [
      ['PREC', (state.omegaPrec * RAD_TO_DEG).toFixed(1) + '\u00b0/s'],
      ['NUT', (state.nutAngle * RAD_TO_DEG).toFixed(1) + '\u00b0'],
      ['MODE', CONFIGS[state.configIdx].name.split(' ')[0]]
    ];
    items.forEach(function(item, i) {
      var iy = py + 72 + i * 13;
      mCtx.fillStyle = '#6b7a99';
      mCtx.textAlign = 'left';
      mCtx.fillText(item[0], px + 10, iy);
      mCtx.fillStyle = ACCENT;
      mCtx.textAlign = 'right';
      mCtx.fillText(item[1], px + pw - 10, iy);
    });

    /* Status LEDs */
    var leds = [
      { label: 'PWR', on: true },
      { label: 'SPIN', on: state.running },
      { label: 'PREC', on: state.running && state.omegaPrec > 1e-4 }
    ];
    leds.forEach(function(led, i) {
      var lx = 25 + i * 42, ly = 35;
      mCtx.fillStyle = led.on ? '#3ddc84' : '#37474f';
      mCtx.beginPath(); mCtx.arc(lx, ly, 5, 0, TWO_PI); mCtx.fill();
      if (led.on) {
        mCtx.fillStyle = hexToRGBA('#3ddc84', 0.2);
        mCtx.beginPath(); mCtx.arc(lx, ly, 9, 0, TWO_PI); mCtx.fill();
      }
      mCtx.fillStyle = '#6b7a99';
      mCtx.font = '7px monospace';
      mCtx.textAlign = 'center';
      mCtx.fillText(led.label, lx, ly + 14);
    });
  }

  function drawMachineLabel() {
    mCtx.fillStyle = hexToRGBA(ACCENT, 0.7);
    mCtx.font = 'bold 13px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText('NHIT VisualLab GYR-100', CX, 20);
    mCtx.fillStyle = '#6b7a99';
    mCtx.font = '10px monospace';
    mCtx.fillText('Gyroscope / Spinning Top Simulator', CX, 35);

    /* Config description at bottom */
    var cfg = CONFIGS[state.configIdx];
    mCtx.fillStyle = '#6b7a99';
    mCtx.font = '9px monospace';
    mCtx.textAlign = 'center';
    mCtx.fillText(cfg.desc, CX, MH - 15);
  }

  /* ── Helper: draw arrow head ── */
  function drawArrowHead(ctx, x1, y1, x2, y2, color, size) {
    var angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle - 0.4), y2 - size * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - size * Math.cos(angle + 0.4), y2 - size * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  /* ── Helper: rounded rectangle ── */
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ══════════════════════════════════════════════════════════════
     S12  GRAPH CANVAS
     ══════════════════════════════════════════════════════════════ */
  function drawGraph() {
    gCtx.clearRect(0, 0, GW, GH);
    gCtx.fillStyle = '#0d1117';
    gCtx.fillRect(0, 0, GW, GH);

    drawVectorDiagram();
    drawTimeSeries();
    drawEnergyBars();
  }

  function drawVectorDiagram() {
    /* Top section: L, τ, dL/dt relationship diagram */
    var ox = 140, oy = 95, boxW = 280, boxH = 140;

    /* Box */
    gCtx.fillStyle = 'rgba(22,27,39,0.6)';
    roundRect(gCtx, ox - boxW/2, oy - boxH/2 - 5, boxW, boxH, 8);
    gCtx.fill();
    gCtx.strokeStyle = 'rgba(42,48,80,0.5)';
    gCtx.lineWidth = 1;
    roundRect(gCtx, ox - boxW/2, oy - boxH/2 - 5, boxW, boxH, 8);
    gCtx.stroke();

    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '9px monospace';
    gCtx.textAlign = 'center';
    gCtx.fillText('VECTOR RELATIONSHIP', ox, oy - 55);

    /* Draw L vector (yellow, pointing right+up based on precession) */
    var Lmag = clamp(state.L * 8, 20, 60);
    var precA = state.precAngle;
    var Lx = Math.cos(precA) * Lmag;
    var Ly = -Math.sin(precA) * Lmag * 0.5 - 10;

    gCtx.strokeStyle = '#fdd835';
    gCtx.lineWidth = 2.5;
    gCtx.beginPath(); gCtx.moveTo(ox, oy); gCtx.lineTo(ox + Lx, oy + Ly); gCtx.stroke();
    drawArrowHead(gCtx, ox, oy, ox + Lx, oy + Ly, '#fdd835', 8);
    gCtx.fillStyle = '#fdd835';
    gCtx.font = 'bold 11px monospace';
    gCtx.textAlign = 'center';
    gCtx.fillText('L', ox + Lx + 12, oy + Ly - 5);

    /* Torque vector (red, downward) */
    if (state.tau > 0 || state.impulseActive) {
      var tauMag = clamp(state.tau * 100, 15, 40);
      gCtx.strokeStyle = '#ff5555';
      gCtx.lineWidth = 2;
      gCtx.beginPath(); gCtx.moveTo(ox, oy); gCtx.lineTo(ox, oy + tauMag); gCtx.stroke();
      drawArrowHead(gCtx, ox, oy, ox, oy + tauMag, '#ff5555', 7);
      gCtx.fillStyle = '#ff5555';
      gCtx.font = 'bold 10px monospace';
      gCtx.fillText('\u03c4', ox + 12, oy + tauMag);
    }

    /* dL/dt vector (green, perpendicular) */
    if (state.omegaPrec > 1e-5 || state.impulseFade > 0) {
      var dLmag = 25;
      var dLx = -Math.sin(precA) * dLmag;
      var dLy = -Math.cos(precA) * dLmag * 0.5;
      gCtx.strokeStyle = '#3ddc84';
      gCtx.lineWidth = 2;
      gCtx.setLineDash([3, 3]);
      gCtx.beginPath(); gCtx.moveTo(ox + Lx, oy + Ly); gCtx.lineTo(ox + Lx + dLx, oy + Ly + dLy); gCtx.stroke();
      gCtx.setLineDash([]);
      drawArrowHead(gCtx, ox + Lx, oy + Ly, ox + Lx + dLx, oy + Ly + dLy, '#3ddc84', 6);
      gCtx.fillStyle = '#3ddc84';
      gCtx.font = '9px monospace';
      gCtx.fillText('dL/dt', ox + Lx + dLx + 10, oy + Ly + dLy);
    }

    /* 90° angle marker */
    if (state.tau > 0 && state.omegaPrec > 1e-5) {
      gCtx.strokeStyle = hexToRGBA('#3ddc84', 0.5);
      gCtx.lineWidth = 1;
      gCtx.beginPath();
      gCtx.arc(ox, oy, 12, -PI/2, Math.atan2(Ly, Lx), Lx < 0);
      gCtx.stroke();
      gCtx.fillStyle = hexToRGBA('#3ddc84', 0.5);
      gCtx.font = '8px monospace';
      gCtx.fillText('90\u00b0', ox + 16, oy - 8);
    }

    /* ── Right side: Phase portrait ── */
    var ppx = 410, ppy = 95, ppr = 55;
    gCtx.fillStyle = 'rgba(22,27,39,0.6)';
    roundRect(gCtx, ppx - ppr - 10, ppy - ppr - 15, ppr*2 + 20, ppr*2 + 20, 8);
    gCtx.fill();
    gCtx.strokeStyle = 'rgba(42,48,80,0.5)';
    gCtx.lineWidth = 1;
    roundRect(gCtx, ppx - ppr - 10, ppy - ppr - 15, ppr*2 + 20, ppr*2 + 20, 8);
    gCtx.stroke();

    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '9px monospace';
    gCtx.textAlign = 'center';
    gCtx.fillText('AXIS TIP TRAJECTORY', ppx, ppy - ppr - 3);

    /* Axes */
    gCtx.strokeStyle = 'rgba(107,122,153,0.4)';
    gCtx.lineWidth = 0.5;
    gCtx.beginPath(); gCtx.moveTo(ppx - ppr, ppy); gCtx.lineTo(ppx + ppr, ppy); gCtx.stroke();
    gCtx.beginPath(); gCtx.moveTo(ppx, ppy - ppr); gCtx.lineTo(ppx, ppy + ppr); gCtx.stroke();

    /* Plot trail projected to top-down view */
    if (state.trail.length > 2) {
      var tLen = state.trail.length;
      for (var i = 1; i < tLen; i++) {
        var alpha = (i / tLen) * 0.8;
        gCtx.strokeStyle = hexToRGBA('#3ddc84', alpha);
        gCtx.lineWidth = 1.5 * (i / tLen);
        /* Convert 3D axis tip to top-down projection */
        var t = state.trail[i];
        var tPrev = state.trail[i-1];
        var sx = ppx + (t.ax || 0) * ppr * 2;
        var sy = ppy + (t.az || 0) * ppr * 2;
        var spx = ppx + (tPrev.ax || 0) * ppr * 2;
        var spy = ppy + (tPrev.az || 0) * ppr * 2;
        gCtx.beginPath(); gCtx.moveTo(spx, spy); gCtx.lineTo(sx, sy); gCtx.stroke();
      }
    }
  }

  function drawTimeSeries() {
    /* Middle section: Precession angle + Nutation angle vs time */
    var ox = 30, oy = 200, w = GW - 60, h = 130;

    /* Background */
    gCtx.fillStyle = 'rgba(22,27,39,0.5)';
    roundRect(gCtx, ox - 5, oy - 5, w + 10, h + 15, 8);
    gCtx.fill();

    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '9px monospace';
    gCtx.textAlign = 'center';
    gCtx.fillText('PRECESSION & NUTATION vs TIME', ox + w/2, oy + 5);

    /* Grid lines */
    gCtx.strokeStyle = 'rgba(42,48,80,0.3)';
    gCtx.lineWidth = 0.5;
    for (var i = 0; i <= 4; i++) {
      var gy = oy + 15 + i * ((h - 20) / 4);
      gCtx.beginPath(); gCtx.moveTo(ox, gy); gCtx.lineTo(ox + w, gy); gCtx.stroke();
    }

    /* Plot precession history */
    if (state.precHist.length > 1) {
      var len = state.precHist.length;
      var maxP = 360;
      gCtx.strokeStyle = '#3ddc84';
      gCtx.lineWidth = 1.5;
      gCtx.beginPath();
      for (var j = 0; j < len; j++) {
        var px = ox + (j / state.maxHist) * w;
        var pVal = state.precHist[j] % 360;
        var py = oy + 15 + (h - 20) / 2 - (pVal / maxP) * (h - 20) / 2;
        py = clamp(py, oy + 15, oy + h - 5);
        if (j === 0) gCtx.moveTo(px, py);
        else gCtx.lineTo(px, py);
      }
      gCtx.stroke();
    }

    /* Plot nutation history */
    if (state.nutHist.length > 1) {
      var nLen = state.nutHist.length;
      gCtx.strokeStyle = ACCENT;
      gCtx.lineWidth = 1.5;
      gCtx.beginPath();
      for (var k = 0; k < nLen; k++) {
        var nx = ox + (k / state.maxHist) * w;
        var nVal = state.nutHist[k];
        var ny = oy + 15 + (h - 20) / 2 - nVal * (h - 20) / 40;
        ny = clamp(ny, oy + 15, oy + h - 5);
        if (k === 0) gCtx.moveTo(nx, ny);
        else gCtx.lineTo(nx, ny);
      }
      gCtx.stroke();
    }

    /* Legend */
    gCtx.fillStyle = '#3ddc84';
    gCtx.fillRect(ox + 10, oy + h + 2, 12, 3);
    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '8px monospace';
    gCtx.textAlign = 'left';
    gCtx.fillText('Precession \u03b8', ox + 26, oy + h + 6);

    gCtx.fillStyle = ACCENT;
    gCtx.fillRect(ox + 110, oy + h + 2, 12, 3);
    gCtx.fillStyle = '#6b7a99';
    gCtx.fillText('Nutation \u03c6', ox + 126, oy + h + 6);
  }

  function drawEnergyBars() {
    /* Bottom section: Energy distribution */
    var ox = 30, oy = 365, w = GW - 60, h = 120;

    gCtx.fillStyle = 'rgba(22,27,39,0.5)';
    roundRect(gCtx, ox - 5, oy - 5, w + 10, h + 10, 8);
    gCtx.fill();

    gCtx.fillStyle = '#6b7a99';
    gCtx.font = '9px monospace';
    gCtx.textAlign = 'center';
    gCtx.fillText('ENERGY DISTRIBUTION', ox + w/2, oy + 8);

    var barW = 80, barMaxH = 70, barY = oy + h - 15;
    var maxE = Math.max(state.KE_spin, 1);

    var bars = [
      { label: 'KE (spin)', val: state.KE_spin, color: '#00bcd4' },
      { label: 'KE (prec)', val: state.KE_prec, color: '#3ddc84' },
      { label: 'PE (grav)', val: state.PE, color: '#ff5555' },
      { label: 'Gyro Couple', val: state.gyroCouple, color: '#fdd835' }
    ];

    bars.forEach(function(bar, i) {
      var bx = ox + 30 + i * (barW + 35);
      var bh = Math.max(2, (bar.val / maxE) * barMaxH);
      bh = Math.min(bh, barMaxH);

      /* Bar */
      gCtx.fillStyle = hexToRGBA(bar.color, 0.3);
      gCtx.fillRect(bx, barY - barMaxH, barW, barMaxH);
      gCtx.fillStyle = hexToRGBA(bar.color, 0.7);
      gCtx.fillRect(bx, barY - bh, barW, bh);

      /* Border */
      gCtx.strokeStyle = hexToRGBA(bar.color, 0.5);
      gCtx.lineWidth = 1;
      gCtx.strokeRect(bx, barY - barMaxH, barW, barMaxH);

      /* Value */
      gCtx.fillStyle = bar.color;
      gCtx.font = 'bold 10px monospace';
      gCtx.textAlign = 'center';
      gCtx.fillText(bar.val < 100 ? roundN(bar.val, 2) : roundN(bar.val, 0), bx + barW/2, barY - bh - 5);

      /* Label */
      gCtx.fillStyle = '#6b7a99';
      gCtx.font = '8px monospace';
      gCtx.fillText(bar.label, bx + barW/2, barY + 10);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     S13  ANIMATION LOOP
     ══════════════════════════════════════════════════════════════ */
  function startSim() {
    if (state.running) return;
    state.running = true;
    state.lastTime = performance.now();
    if (state.time === 0) {
      state.trail = [];
      state.precHist = [];
      state.nutHist = [];
    }
    elBtnSpin.textContent = '\u23f8 Pause';
    elBtnSpin.classList.add('running');
    animLoop();
  }

  function pauseSim() {
    state.running = false;
    if (state.animId) { cancelAnimationFrame(state.animId); state.animId = null; }
    elBtnSpin.textContent = '\u25b6 Resume';
    elBtnSpin.classList.remove('running');
  }

  function toggleSim() {
    if (state.running) { pauseSim(); }
    else {
      updatePhysics();
      startSim();
    }
  }

  function resetSim() {
    pauseSim();
    state.time = 0;
    state.spinAngle = 0;
    state.precAngle = 0;
    state.nutAngle = 0;
    state.nutPhase = 0;
    state.impulseActive = false;
    state.impulseFade = 0;
    state.forcedPrecBoost = 0;
    state.forcedNutAmp = 0;
    state.trail = [];
    state.precHist = [];
    state.nutHist = [];
    elBtnSpin.textContent = '\u25b6 Spin Up';
    elBtnSpin.classList.remove('running');
    updatePhysics();
    updateReadouts();
    updateBadges();
    drawMachine();
    drawGraph();
  }

  function animLoop() {
    if (!state.running) return;
    var now = performance.now();
    var dt = (now - state.lastTime) / 1000;
    state.lastTime = now;
    dt = Math.min(dt, 0.05); // cap for tab switch
    state.time += dt;

    /* ── Spin disc ── Visual cap so high RPM stays perceptible (not blurring out) */
    /* Physics omegaSpin (rad/s) can exceed 1000. At 60 FPS, ~17 rad/frame > full rotation per frame.
       Cap visual angular rate at ~14 rad/s so spin direction stays clear. */
    var visualOmega = Math.sign(state.omegaSpin) * Math.min(Math.abs(state.omegaSpin) * 0.06, 14);
    state.spinAngle += visualOmega * dt;
    if (state.spinAngle > TWO_PI) state.spinAngle -= TWO_PI;
    if (state.spinAngle < -TWO_PI) state.spinAngle += TWO_PI;

    /* ── Precession ── */
    var cfg = CONFIGS[state.configIdx].id;
    var effectivePrec = state.omegaPrec;

    /* Add impulse contribution */
    if (state.impulseFade > 0) {
      effectivePrec += state.impulseStrength * state.impulseFade;
      state.impulseFade -= dt * 1.5; // fade over ~0.67s
      if (state.impulseFade < 0) {
        state.impulseFade = 0;
        if (cfg === 'free') state.impulseActive = false;
      }
    }

    /* Add forced mode boost */
    if (cfg === 'forced' && state.forcedPrecBoost > 0) {
      effectivePrec += state.forcedPrecBoost;
      state.forcedPrecBoost *= (1 - 0.8 * dt); // decay
      if (state.forcedPrecBoost < 0.001) state.forcedPrecBoost = 0;
    }

    if (cfg !== 'free' || state.impulseActive || state.impulseFade > 0) {
      state.precAngle += effectivePrec * dt;
      if (state.precAngle > TWO_PI) state.precAngle -= TWO_PI;
    }

    /* ── Nutation ── */
    if (cfg === 'nutation') {
      /* Damped nutation: axis wobbles then self-adjusts to steady precession */
      var I_sup = state.I + state.discMass * state.weightDist * state.weightDist;
      var nutOmega = state.L > 1e-6 ? state.L / I_sup : 10;
      state.nutPhase += nutOmega * dt;
      var dampFactor = Math.exp(-0.25 * state.time); // damping rate
      state.nutAngle = 0.18 * dampFactor * Math.sin(state.nutPhase);
    } else if (cfg === 'forced') {
      /* Forced nutation from repeated impulses */
      var I_sup2 = state.I + state.discMass * state.weightDist * state.weightDist;
      var nutOmega2 = state.L > 1e-6 ? state.L / I_sup2 : 10;
      state.nutPhase += nutOmega2 * dt;
      state.nutAngle = state.forcedNutAmp * Math.sin(state.nutPhase);
      state.forcedNutAmp *= (1 - 0.3 * dt); // gradual decay
      if (state.forcedNutAmp < 0.001) state.forcedNutAmp = 0;
    } else if (cfg === 'free' && state.impulseActive) {
      /* Small wobble from impulse in free mode */
      state.nutPhase += 8 * dt;
      state.nutAngle = 0.03 * state.impulseFade * Math.sin(state.nutPhase);
    } else {
      state.nutAngle *= 0.92; // decay residual
    }

    /* ── Record trail (3D axis tip) ── */
    var axis = getAxisDir();
    var axleLen = 0.7;
    var tipP = project(axis.x * axleLen, axis.y * axleLen, axis.z * axleLen);
    state.trail.push({
      x: tipP.x, y: tipP.y,
      ax: axis.x * Math.sin(state.tiltBase + state.nutAngle),
      az: axis.z * Math.sin(state.tiltBase + state.nutAngle)
    });
    if (state.trail.length > state.maxTrail) state.trail.shift();

    /* ── Record graph data ── */
    state.precHist.push(state.precAngle * RAD_TO_DEG);
    state.nutHist.push(state.nutAngle * RAD_TO_DEG);
    if (state.precHist.length > state.maxHist) state.precHist.shift();
    if (state.nutHist.length > state.maxHist) state.nutHist.shift();

    /* ── Draw everything ── */
    updatePhysics(); // recalculate derived values
    drawMachine();
    drawGraph();
    updateReadouts();
    updateBadges();

    state.animId = requestAnimationFrame(animLoop);
  }

  /* ══════════════════════════════════════════════════════════════
     S14  APPLY TORQUE — works in ALL modes
     ══════════════════════════════════════════════════════════════ */
  function applyTorque() {
    /* Start simulation if not running */
    if (!state.running) {
      updatePhysics();
      startSim();
    }

    /* Impulse flash */
    state.impulseActive = true;
    state.impulseFade = 1.0;

    var cfg = CONFIGS[state.configIdx].id;

    if (cfg === 'free') {
      /* In free mode: torque causes visible precession (demonstrates 90° rule) */
      state.impulseStrength = 1.2;
    } else if (cfg === 'precession') {
      /* In precession mode: impulse perturbs the steady precession */
      state.impulseStrength = state.omegaPrec * 3;
      /* Add small nutation from impulse */
      state.nutPhase = 0;
      state.nutAngle = 0.08;
    } else if (cfg === 'nutation') {
      /* In nutation mode: adds energy, restarts nutation */
      state.time = 0; // reset damping
      state.nutPhase = 0;
      state.impulseStrength = state.omegaPrec * 2;
    } else if (cfg === 'forced') {
      /* In forced mode: accumulates precession and nutation */
      state.forcedPrecBoost += 0.5;
      state.forcedNutAmp = Math.min(state.forcedNutAmp + 0.04, 0.25);
      state.impulseStrength = 0.8;
    }
  }

  /* ══════════════════════════════════════════════════════════════
     S15  CONFIG PILLS — dynamically created (was missing!)
     ══════════════════════════════════════════════════════════════ */
  function buildConfigPills() {
    if (!elConfigTabs) return;
    elConfigTabs.innerHTML = '';
    CONFIGS.forEach(function(cfg, i) {
      var pill = document.createElement('button');
      pill.className = 'config-pill' + (i === state.configIdx ? ' active' : '');
      pill.textContent = cfg.name;
      pill.setAttribute('data-idx', i);
      elConfigTabs.appendChild(pill);
    });
    elConfigTabs.addEventListener('click', function(e) {
      var target = e.target;
      if (!target.matches('.config-pill')) return;
      var idx = parseInt(target.getAttribute('data-idx'));
      if (isNaN(idx)) return;
      setConfig(idx);
    });
  }

  function buildPresetPills() {
    if (!elPresetTabs) return;
    elPresetTabs.innerHTML = '';
    PRESETS.forEach(function(p, i) {
      var btn = document.createElement('button');
      btn.className = 'preset-pill' + (i === 0 ? ' active' : '');
      btn.innerHTML = '<span class="preset-ico">' + p.ico + '</span>' + p.name;
      btn.setAttribute('data-idx', i);
      btn.addEventListener('click', function() { applyPreset(i); });
      elPresetTabs.appendChild(btn);
    });
  }

  function applyPreset(idx) {
    var p = PRESETS[idx];
    if (!p) return;
    state.discMass = p.mass;
    state.discRadius = p.radius / 1000;
    state.spinRPM = p.rpm;
    state.appliedWeight = p.weight;
    state.weightDist = p.dist / 1000;
    /* Update slider UIs */
    if (elMassSlider)   { elMassSlider.value   = p.mass; }
    if (elRadiusSlider) { elRadiusSlider.value = p.radius; }
    if (elSpinSlider)   { elSpinSlider.value   = p.rpm;    elSpinVal.textContent   = p.rpm + ' RPM'; }
    if (elWeightSlider) { elWeightSlider.value = p.weight; }
    if (elDistSlider)   { elDistSlider.value   = p.dist; }
    syncSliderLabels();
    /* Highlight active pill */
    if (elPresetTabs) {
      elPresetTabs.querySelectorAll('.preset-pill').forEach(function(b, i2) {
        b.classList.toggle('active', i2 === idx);
      });
    }
    updatePhysics(); updateReadouts(); updateBadges();
    if (!state.running) { drawMachine(); drawGraph(); }
  }

  function setConfig(idx) {
    state.configIdx = idx;

    /* Update pill active states */
    var pills = elConfigTabs.querySelectorAll('.config-pill');
    pills.forEach(function(p, i) {
      p.classList.toggle('active', i === idx);
    });

    /* Show/hide weight controls */
    var cfg = CONFIGS[idx].id;
    if (elWeightControls) {
      elWeightControls.style.display = (cfg === 'free') ? 'none' : '';
    }

    /* Show Apply Torque in all modes */
    if (elBtnTorque) {
      show(elBtnTorque);
    }

    /* Reset animation state for clean transition */
    state.precAngle = 0;
    state.nutAngle = 0;
    state.nutPhase = 0;
    state.time = 0;
    state.impulseActive = false;
    state.impulseFade = 0;
    state.forcedPrecBoost = 0;
    state.forcedNutAmp = 0;
    state.trail = [];
    state.precHist = [];
    state.nutHist = [];

    updatePhysics();
    updateReadouts();
    updateBadges();

    if (!state.running) {
      drawMachine();
      drawGraph();
    }
  }

  /* ══════════════════════════════════════════════════════════════
     S16  SLIDER EVENTS — all work in real-time during animation!
     ══════════════════════════════════════════════════════════════ */
  function wireSliders() {
    if (elMassSlider) {
      elMassSlider.addEventListener('input', function() {
        state.discMass = parseFloat(this.value);
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        if (!state.running) { drawMachine(); drawGraph(); }
      });
    }
    if (elRadiusSlider) {
      elRadiusSlider.addEventListener('input', function() {
        state.discRadius = parseInt(this.value) / 1000;
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        if (!state.running) { drawMachine(); drawGraph(); }
      });
    }
    if (elSpinSlider) {
      elSpinSlider.addEventListener('input', function() {
        state.spinRPM = parseInt(this.value);
        elSpinVal.textContent = state.spinRPM + ' RPM';
        updatePhysics(); updateReadouts(); updateBadges();
        if (!state.running) { drawMachine(); drawGraph(); }
      });
    }
    if (elWeightSlider) {
      elWeightSlider.addEventListener('input', function() {
        state.appliedWeight = parseFloat(this.value);
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        if (!state.running) { drawMachine(); drawGraph(); }
      });
    }
    if (elDistSlider) {
      elDistSlider.addEventListener('input', function() {
        state.weightDist = parseInt(this.value) / 1000;
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        if (!state.running) { drawMachine(); drawGraph(); }
      });
    }
  }

  /* ══════════════════════════════════════════════════════════════
     S17  BUTTON EVENTS
     ══════════════════════════════════════════════════════════════ */
  function wireButtons() {
    if (elBtnSpin) {
      elBtnSpin.addEventListener('click', toggleSim);
    }
    if (elBtnTorque) {
      elBtnTorque.addEventListener('click', applyTorque);
    }
    if (elBtnReset) {
      elBtnReset.addEventListener('click', resetSim);
    }
  }

  /* ══════════════════════════════════════════════════════════════
     S18  MODE SWITCHING
     ══════════════════════════════════════════════════════════════ */
  function setMode(m) {
    state.mode = m;
    /* Update pill active states */
    if (elModeTabs) {
      elModeTabs.querySelectorAll('.pill').forEach(function(p) {
        p.classList.toggle('active', p.getAttribute('data-mode') === m);
      });
    }
    /* Show/hide panels */
    hide(elSimWrapper);
    hide(elExploreWrapper);
    hide(elPracticeWrapper);
    hide(elQuizWrapper);

    if (m === 'simulate') {
      show(elSimWrapper);
      updatePhysics(); updateReadouts(); updateBadges();
      drawMachine(); drawGraph();
    } else if (m === 'explore') {
      show(elExploreWrapper);
      if (!elExploreGrid.hasChildNodes()) buildExploreUI();
      drawExploreConcept();
    } else if (m === 'practice') {
      show(elPracticeWrapper);
      if (!state.pProb) newPractice();
    } else if (m === 'quiz') {
      show(elQuizWrapper);
      if (state.qSet.length === 0) startQuiz();
    }
  }

  if (elModeTabs) {
    elModeTabs.addEventListener('click', function(e) {
      if (!e.target.matches('.pill')) return;
      var m = e.target.getAttribute('data-mode');
      if (m) setMode(m);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     S19  EXPLORE MODE
     ══════════════════════════════════════════════════════════════ */
  function buildExploreUI() {
    /* Category pills */
    var cats = [];
    CONCEPTS.forEach(function(c) { if (cats.indexOf(c.cat) < 0) cats.push(c.cat); });
    elExploreCats.innerHTML = '';
    cats.forEach(function(cat) {
      var btn = document.createElement('button');
      btn.className = 'config-pill' + (cat === state.expCat ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', function() {
        state.expCat = cat;
        elExploreCats.querySelectorAll('.config-pill').forEach(function(p) {
          p.classList.toggle('active', p.textContent === cat);
        });
        buildConceptGrid();
      });
      elExploreCats.appendChild(btn);
    });
    buildConceptGrid();
  }

  function buildConceptGrid() {
    elExploreGrid.innerHTML = '';
    var filtered = CONCEPTS.filter(function(c) { return c.cat === state.expCat; });
    filtered.forEach(function(c, i) {
      var btn = document.createElement('button');
      btn.className = 'explore-btn';
      btn.textContent = (c.symbol ? c.symbol + ' ' : '') + c.name;
      btn.addEventListener('click', function() {
        state.expIdx = CONCEPTS.indexOf(c);
        elExploreGrid.querySelectorAll('.explore-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo(c);
        drawExploreConcept();
      });
      if (i === 0 && CONCEPTS.indexOf(c) === state.expIdx) btn.classList.add('active');
      elExploreGrid.appendChild(btn);
    });
    /* Select first by default */
    if (filtered.length > 0) {
      state.expIdx = CONCEPTS.indexOf(filtered[0]);
      showConceptInfo(filtered[0]);
    }
  }

  function showConceptInfo(c) {
    var html = '<h3>' + (c.symbol ? c.symbol + ' — ' : '') + c.name + '</h3>';
    html += '<p>' + c.desc + '</p>';
    if (c.formula) html += '<div class="formula-box">' + c.formula + '</div>';
    if (c.example) {
      html += '<div class="example-box"><strong>Example:</strong> ' + c.example.problem + '<br>';
      c.example.steps.forEach(function(s) { html += s + '<br>'; });
      html += '</div>';
    }
    elExploreInfo.innerHTML = html;
  }

  function drawExploreConcept() {
    if (!eCtx) return;
    eCtx.clearRect(0, 0, EW, EH);
    eCtx.fillStyle = '#0d1117';
    eCtx.fillRect(0, 0, EW, EH);

    var concept = CONCEPTS[state.expIdx];
    if (!concept) return;
    var cx = EW / 2, cy = EH / 2;

    /* Title */
    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 14px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText(concept.name, cx, 25);

    /* Draw concept-specific diagram */
    var id = concept.id;
    if (id === 'angular-momentum' || id === 'moment-of-inertia') {
      drawExploreDisc(cx, cy);
    } else if (id === 'torque-angular-accel') {
      drawExploreTorque(cx, cy);
    } else if (id === 'precession') {
      drawExplorePrecession(cx, cy);
    } else if (id === 'nutation-concept') {
      drawExploreNutation(cx, cy);
    } else if (id === 'gyroscopic-rigidity') {
      drawExploreRigidity(cx, cy);
    } else if (id === 'gyroscopic-couple') {
      drawExploreCouple(cx, cy);
    } else {
      drawExploreGeneric(cx, cy, concept);
    }
  }

  function drawExploreDisc(cx, cy) {
    /* Spinning disc with I and ω labels */
    eCtx.strokeStyle = '#607d8b';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.ellipse(cx, cy, 100, 40, 0, 0, TWO_PI); eCtx.stroke();
    eCtx.fillStyle = 'rgba(96,125,139,0.2)';
    eCtx.fill();
    /* Rotation arrow */
    eCtx.strokeStyle = ACCENT;
    eCtx.lineWidth = 2;
    eCtx.beginPath(); eCtx.arc(cx, cy, 110, -0.5, 1.5); eCtx.stroke();
    drawArrowHead(eCtx, cx + 110*Math.cos(1.3), cy + 110*Math.sin(1.3), cx + 110*Math.cos(1.5), cy + 110*Math.sin(1.5), ACCENT, 8);
    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 16px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('\u03c9', cx + 130, cy - 10);
    /* L vector */
    eCtx.strokeStyle = '#fdd835';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx, cy); eCtx.lineTo(cx, cy - 120); eCtx.stroke();
    drawArrowHead(eCtx, cx, cy, cx, cy - 120, '#fdd835', 10);
    eCtx.fillStyle = '#fdd835';
    eCtx.font = 'bold 16px monospace';
    eCtx.fillText('L = I\u00b7\u03c9', cx + 5, cy - 130);
    /* Labels */
    eCtx.fillStyle = '#90a4ae';
    eCtx.font = '12px monospace';
    eCtx.fillText('Disc: I = \u00bdmR\u00b2', cx, cy + 70);
    eCtx.fillText('Right-hand rule: curl fingers in spin direction', cx, cy + 90);
    eCtx.fillText('Thumb points along L', cx, cy + 108);
  }

  function drawExploreTorque(cx, cy) {
    /* Torque = dL/dt diagram */
    eCtx.strokeStyle = '#fdd835';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx - 100, cy); eCtx.lineTo(cx + 50, cy); eCtx.stroke();
    drawArrowHead(eCtx, cx - 100, cy, cx + 50, cy, '#fdd835', 10);
    eCtx.fillStyle = '#fdd835';
    eCtx.font = 'bold 14px monospace';
    eCtx.textAlign = 'left';
    eCtx.fillText('L', cx + 60, cy + 5);

    eCtx.strokeStyle = '#ff5555';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx - 100, cy); eCtx.lineTo(cx - 100, cy + 80); eCtx.stroke();
    drawArrowHead(eCtx, cx - 100, cy, cx - 100, cy + 80, '#ff5555', 10);
    eCtx.fillStyle = '#ff5555';
    eCtx.fillText('\u03c4', cx - 90, cy + 90);

    eCtx.strokeStyle = '#3ddc84';
    eCtx.lineWidth = 2;
    eCtx.setLineDash([5,3]);
    eCtx.beginPath(); eCtx.moveTo(cx + 50, cy); eCtx.lineTo(cx + 50 - 30, cy - 40); eCtx.stroke();
    eCtx.setLineDash([]);
    drawArrowHead(eCtx, cx + 50, cy, cx + 50 - 30, cy - 40, '#3ddc84', 8);
    eCtx.fillStyle = '#3ddc84';
    eCtx.fillText('dL = \u03c4\u00b7dt', cx + 60, cy - 40);

    eCtx.fillStyle = '#dde3f0';
    eCtx.font = '13px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('KEY INSIGHT: \u0394L is \u22a5 to \u03c4 → axis moves sideways, not down!', cx, cy + 140);
    eCtx.fillText('This is the 90\u00b0 rule of gyroscopic motion.', cx, cy + 160);
  }

  function drawExplorePrecession(cx, cy) {
    /* Top-down cone view */
    eCtx.strokeStyle = '#3ddc84';
    eCtx.lineWidth = 2;
    eCtx.setLineDash([5,4]);
    eCtx.beginPath(); eCtx.ellipse(cx, cy, 100, 40, 0, 0, TWO_PI); eCtx.stroke();
    eCtx.setLineDash([]);

    /* Axis at one position */
    var a = Date.now() / 3000;
    var tx = cx + 100 * Math.cos(a);
    var ty = cy + 40 * Math.sin(a);
    eCtx.strokeStyle = '#90a4ae';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx, cy + 50); eCtx.lineTo(tx, ty - 40); eCtx.stroke();

    /* L at tip */
    eCtx.strokeStyle = '#fdd835';
    eCtx.lineWidth = 2.5;
    eCtx.beginPath(); eCtx.moveTo(tx, ty - 40); eCtx.lineTo(tx, ty - 90); eCtx.stroke();
    drawArrowHead(eCtx, tx, ty - 40, tx, ty - 90, '#fdd835', 8);
    eCtx.fillStyle = '#fdd835';
    eCtx.font = 'bold 12px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('L', tx + 15, ty - 90);

    eCtx.fillStyle = '#3ddc84';
    eCtx.font = 'bold 12px monospace';
    eCtx.fillText('\u03a9_p = \u03c4/L', cx, cy + 100);

    eCtx.fillStyle = '#90a4ae';
    eCtx.font = '11px monospace';
    eCtx.fillText('Faster spin → Slower precession', cx, cy + 125);
    eCtx.fillText('Greater torque → Faster precession', cx, cy + 145);
  }

  function drawExploreNutation(cx, cy) {
    /* Wavy trail that damps to smooth circle */
    var t = Date.now() / 200;
    eCtx.strokeStyle = '#3ddc84';
    eCtx.lineWidth = 1.5;
    eCtx.beginPath();
    for (var i = 0; i < 200; i++) {
      var a = (i / 200) * TWO_PI * 3;
      var dampF = Math.exp(-i * 0.01);
      var r = 80 + 20 * dampF * Math.sin(a * 5 + t);
      var x = cx + r * Math.cos(a);
      var y = cy + r * Math.sin(a) * 0.4;
      if (i === 0) eCtx.moveTo(x, y);
      else eCtx.lineTo(x, y);
    }
    eCtx.stroke();

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 12px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('Nutation \u2192 damps to steady precession', cx, cy + 80);
    eCtx.fillStyle = '#90a4ae';
    eCtx.font = '11px monospace';
    eCtx.fillText('Axis "self-adjusts" as friction damps the wobble', cx, cy + 100);
    eCtx.fillText('\u03c9_n \u2248 L / I_support', cx, cy + 125);
  }

  function drawExploreRigidity(cx, cy) {
    /* Stable axis with push arrows deflected */
    eCtx.strokeStyle = '#90a4ae';
    eCtx.lineWidth = 4;
    eCtx.beginPath(); eCtx.moveTo(cx, cy + 60); eCtx.lineTo(cx, cy - 80); eCtx.stroke();

    /* L vector */
    eCtx.strokeStyle = '#fdd835';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx, cy - 80); eCtx.lineTo(cx, cy - 130); eCtx.stroke();
    drawArrowHead(eCtx, cx, cy - 80, cx, cy - 130, '#fdd835', 10);

    /* Push arrows (deflected) */
    eCtx.strokeStyle = '#ff5555';
    eCtx.lineWidth = 2;
    [-60, 60].forEach(function(offset) {
      eCtx.beginPath(); eCtx.moveTo(cx + offset * 2, cy); eCtx.lineTo(cx + offset * 0.8, cy); eCtx.stroke();
      drawArrowHead(eCtx, cx + offset * 2, cy, cx + offset * 0.8, cy, '#ff5555', 7);
    });

    /* Shield icon around axis */
    eCtx.strokeStyle = hexToRGBA(ACCENT, 0.4);
    eCtx.lineWidth = 2;
    eCtx.beginPath(); eCtx.arc(cx, cy - 20, 40, 0, TWO_PI); eCtx.stroke();

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 12px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('Rigidity \u221d L = I\u03c9', cx, cy + 100);
    eCtx.fillStyle = '#90a4ae';
    eCtx.font = '11px monospace';
    eCtx.fillText('Higher angular momentum = stronger resistance to reorientation', cx, cy + 125);
  }

  function drawExploreCouple(cx, cy) {
    /* Gyroscopic couple diagram */
    eCtx.strokeStyle = '#fdd835';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx - 80, cy); eCtx.lineTo(cx + 80, cy); eCtx.stroke();
    drawArrowHead(eCtx, cx - 80, cy, cx + 80, cy, '#fdd835', 10);
    eCtx.fillStyle = '#fdd835';
    eCtx.font = 'bold 12px monospace';
    eCtx.textAlign = 'left';
    eCtx.fillText('\u03c9 (spin)', cx + 90, cy + 5);

    /* Precession arrow (up) */
    eCtx.strokeStyle = '#3ddc84';
    eCtx.lineWidth = 2.5;
    eCtx.beginPath(); eCtx.moveTo(cx, cy); eCtx.lineTo(cx, cy - 70); eCtx.stroke();
    drawArrowHead(eCtx, cx, cy, cx, cy - 70, '#3ddc84', 8);
    eCtx.fillStyle = '#3ddc84';
    eCtx.fillText('\u03a9_p', cx + 10, cy - 75);

    /* Couple arrow (perpendicular) */
    eCtx.strokeStyle = '#ff5555';
    eCtx.lineWidth = 2.5;
    eCtx.beginPath(); eCtx.moveTo(cx, cy); eCtx.lineTo(cx - 50, cy + 50); eCtx.stroke();
    drawArrowHead(eCtx, cx, cy, cx - 50, cy + 50, '#ff5555', 8);
    eCtx.fillStyle = '#ff5555';
    eCtx.textAlign = 'right';
    eCtx.fillText('C = I\u03c9\u03a9_p', cx - 55, cy + 60);

    eCtx.fillStyle = '#90a4ae';
    eCtx.font = '11px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText('Couple acts \u22a5 to both spin and precession axes', cx, cy + 110);
  }

  function drawExploreGeneric(cx, cy, concept) {
    /* Generic concept diagram */
    eCtx.strokeStyle = hexToRGBA(ACCENT, 0.3);
    eCtx.lineWidth = 2;
    eCtx.beginPath(); eCtx.arc(cx, cy, 80, 0, TWO_PI); eCtx.stroke();

    eCtx.fillStyle = ACCENT;
    eCtx.font = 'bold 24px monospace';
    eCtx.textAlign = 'center';
    eCtx.fillText(concept.symbol || '\u2699', cx, cy + 8);

    eCtx.fillStyle = '#dde3f0';
    eCtx.font = '12px monospace';
    if (concept.formula) {
      eCtx.fillText(concept.formula, cx, cy + 110);
    }

    /* Draw a small gyroscope icon */
    eCtx.strokeStyle = '#607d8b';
    eCtx.lineWidth = 2;
    eCtx.beginPath(); eCtx.ellipse(cx, cy + 140, 40, 15, 0, 0, TWO_PI); eCtx.stroke();
    eCtx.strokeStyle = '#90a4ae';
    eCtx.lineWidth = 3;
    eCtx.beginPath(); eCtx.moveTo(cx, cy + 140); eCtx.lineTo(cx, cy + 100); eCtx.stroke();
  }

  /* ══════════════════════════════════════════════════════════════
     S20  PRACTICE MODE
     ══════════════════════════════════════════════════════════════ */
  function newPractice() {
    state.pProb = generateProblem();
    state.pDone = false;
    elPracticePrompt.innerHTML = state.pProb.prompt;
    elPracticeInput.value = '';
    elPracticeUnit.textContent = state.pProb.unit;
    elPracticeFeedback.textContent = '';
    elPracticeFeedback.className = 'practice-feedback';
    elPracticeSolution.style.display = 'none';
    elPracticeSolution.innerHTML = '';
    hide(elBtnShowSol);
  }

  function checkPractice() {
    if (state.pDone) return;
    var val = parseFloat(elPracticeInput.value);
    if (isNaN(val)) { elPracticeFeedback.textContent = 'Please enter a number.'; elPracticeFeedback.className = 'practice-feedback err'; return; }
    state.pTotal++;
    var diff = Math.abs(val - state.pProb.answer);
    if (diff <= state.pProb.tol) {
      state.pScore++;
      elPracticeFeedback.textContent = '\u2713 Correct! Answer: ' + state.pProb.answer + ' ' + state.pProb.unit;
      elPracticeFeedback.className = 'practice-feedback ok';
    } else {
      elPracticeFeedback.textContent = '\u2717 Incorrect. Your answer: ' + val + ', Expected: ' + state.pProb.answer + ' ' + state.pProb.unit;
      elPracticeFeedback.className = 'practice-feedback err';
    }
    state.pDone = true;
    show(elBtnShowSol);
    elPracticeScore.textContent = state.pScore + ' / ' + state.pTotal;
  }

  function showSolution() {
    elPracticeSolution.innerHTML = '<strong>Solution:</strong><br>' + state.pProb.solution.join('<br>');
    elPracticeSolution.style.display = 'block';
  }

  if (elBtnCheck) elBtnCheck.addEventListener('click', checkPractice);
  if (elBtnShowSol) elBtnShowSol.addEventListener('click', showSolution);
  if (elBtnNextProb) elBtnNextProb.addEventListener('click', newPractice);
  if (elPracticeInput) {
    elPracticeInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') checkPractice();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     S21  QUIZ MODE
     ══════════════════════════════════════════════════════════════ */
  function startQuiz() {
    /* Shuffle each MCQ's options as well as the question order, and re-point
       `ans` at wherever the answer landed. Every question in the pool is
       authored with its answer at index 0 and the options were rendered in
       authored order, so the correct button was always the first one — the quiz
       could be passed without reading it. Copy each question first so the pool
       itself is never mutated across runs. */
    state.qSet = shuffleArr(QUIZ_POOL.slice()).slice(0, 5).map(function (src) {
      var q = {};
      for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) q[k] = src[k];
      if (q.type === 'mcq' && q.opts && q.opts.length) {
        var order = q.opts.map(function (opt, oi) { return { opt: opt, i: oi }; });
        order = shuffleArr(order);
        q.opts = order.map(function (o) { return o.opt; });
        q.ans = order.findIndex(function (o) { return o.i === src.ans; });
      }
      return q;
    });
    state.qIdx = 0;
    state.qScore = 0;
    state.qDone = false;
    state.qResults = [];
    show(elQuizPanel);
    hide(elQuizResult);
    showQuizQ();
  }

  function showQuizQ() {
    var q = state.qSet[state.qIdx];
    state.qAnswered = false;
    elQuizCounter.textContent = 'Question ' + (state.qIdx + 1) + ' / ' + state.qSet.length;
    elQuizPrompt.textContent = q.q;
    elQuizFeedback.textContent = '';
    hide(elBtnQuizNext);

    if (q.type === 'mcq') {
      show(elQuizOptions);
      hide(elQuizNumRow);
      elQuizOptions.innerHTML = '';
      q.opts.forEach(function(opt, i) {
        var btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt;
        btn.addEventListener('click', function() { answerMCQ(i); });
        elQuizOptions.appendChild(btn);
      });
    } else {
      hide(elQuizOptions);
      show(elQuizNumRow);
      elQuizNumInput.value = '';
      elQuizNumUnit.textContent = q.unit || '';
    }
  }

  function answerMCQ(idx) {
    if (state.qAnswered) return;
    state.qAnswered = true;
    var q = state.qSet[state.qIdx];
    var correct = idx === q.ans;
    if (correct) state.qScore++;

    var opts = elQuizOptions.querySelectorAll('.quiz-opt');
    opts.forEach(function(o, i) {
      o.classList.add('disabled');
      if (i === q.ans) o.classList.add('correct');
      if (i === idx && !correct) o.classList.add('wrong');
    });

    elQuizFeedback.textContent = correct ? '\u2713 Correct!' : '\u2717 Incorrect.';
    elQuizFeedback.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    state.qResults.push({ q: q.q, ok: correct });
    show(elBtnQuizNext);
  }

  function answerNum() {
    if (state.qAnswered) return;
    state.qAnswered = true;
    var q = state.qSet[state.qIdx];
    var val = parseFloat(elQuizNumInput.value);
    if (isNaN(val)) { elQuizFeedback.textContent = 'Enter a number.'; elQuizFeedback.className = 'quiz-feedback err'; state.qAnswered = false; return; }
    var correct = Math.abs(val - q.ans) <= (q.tol || 0.1);
    if (correct) state.qScore++;
    elQuizFeedback.textContent = correct ? '\u2713 Correct! (' + q.ans + ' ' + (q.unit||'') + ')' : '\u2717 Expected ' + q.ans + ' ' + (q.unit||'') + '. You entered ' + val;
    elQuizFeedback.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    state.qResults.push({ q: q.q, ok: correct });
    show(elBtnQuizNext);
  }

  function nextQuizQ() {
    state.qIdx++;
    if (state.qIdx >= state.qSet.length) {
      showQuizResult();
    } else {
      showQuizQ();
    }
  }

  function showQuizResult() {
    hide(elQuizPanel);
    show(elQuizResult);
    elQuizResult.style.display = 'block';
    var pct = Math.round(state.qScore / state.qSet.length * 100);
    var stars = pct >= 90 ? '\u2b50\u2b50\u2b50' : pct >= 60 ? '\u2b50\u2b50' : pct >= 40 ? '\u2b50' : '';
    elQRStars.textContent = stars;
    elQRScore.textContent = state.qScore + ' / ' + state.qSet.length + ' (' + pct + '%)';
    elQRScore.className = 'qr-score ' + (pct >= 90 ? 'perfect' : pct >= 60 ? 'good' : 'poor');

    var tbody = elQRTable.querySelector('tbody');
    if (tbody) tbody.innerHTML = '';
    else { tbody = document.createElement('tbody'); elQRTable.appendChild(tbody); }
    state.qResults.forEach(function(r, i) {
      var tr = document.createElement('tr');
      tr.className = 'qr-row ' + (r.ok ? 'ok' : 'err');
      tr.innerHTML = '<td>' + (i+1) + '</td><td>' + r.q.substring(0,60) + (r.q.length > 60 ? '...' : '') + '</td><td>' + (r.ok ? '\u2713' : '\u2717') + '</td>';
      tbody.appendChild(tr);
    });
  }

  if (elBtnQuizSubmit) elBtnQuizSubmit.addEventListener('click', answerNum);
  if (elBtnQuizNext) elBtnQuizNext.addEventListener('click', nextQuizQ);
  if (elBtnNewQuiz) elBtnNewQuiz.addEventListener('click', startQuiz);
  if (elQuizNumInput) {
    elQuizNumInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') answerNum();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     S22  INIT
     ══════════════════════════════════════════════════════════════ */
  /* === Drag-to-orbit camera === */
  (function wireOrbit() {
    if (!mCanvas) return;
    var dragging = false, lastX = 0, lastY = 0;
    mCanvas.addEventListener('mousedown', function(e) {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      mCanvas.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', function() {
      dragging = false; mCanvas.style.cursor = 'grab';
    });
    window.addEventListener('mousemove', function(e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      VIEW_YAW   = (VIEW_YAW + dx * 0.012);
      VIEW_PITCH = clamp(VIEW_PITCH + dy * 0.012, -0.2, 1.0);
      refreshView();
      if (!state.running) drawMachine();
    });
    /* Touch support */
    mCanvas.addEventListener('touchstart', function(e) {
      if (e.touches.length === 1) { dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
    }, { passive: true });
    mCanvas.addEventListener('touchmove', function(e) {
      if (!dragging || e.touches.length !== 1) return;
      var dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
      VIEW_YAW = VIEW_YAW + dx * 0.012;
      VIEW_PITCH = clamp(VIEW_PITCH + dy * 0.012, -0.2, 1.0);
      refreshView();
      if (!state.running) drawMachine();
    }, { passive: true });
    mCanvas.addEventListener('touchend', function() { dragging = false; });
    /* Double-click resets camera */
    mCanvas.addEventListener('dblclick', function() {
      VIEW_YAW = 0.5; VIEW_PITCH = 0.35; refreshView();
      if (!state.running) drawMachine();
    });
    mCanvas.style.cursor = 'grab';
  })();

  initCanvases();
  buildConfigPills();
  buildPresetPills();
  setConfig(0); // sets initial config, shows/hides weight controls
  wireSliders();
  wireButtons();
  updatePhysics();
  updateReadouts();
  updateBadges();
  setMode('simulate');

  /* ══════════════════════════════════════════════════════════════
     S23  UPGRADE: unit toggle, feature toggles, sound, exports,
                   context menu, calc modal, learn-panels, keyboard,
                   resize, first-time hint
     ══════════════════════════════════════════════════════════════ */

  /* === Display-only unit conversion (physics stays SI internally) === */
  /* Single owner of the four unit-bearing slider captions. Every path that
     changes a slider calls this instead of writing an SI string itself. */
  function syncSliderLabels() {
    var u = UNITS[state.units] || UNITS.si;
    if (elMassVal)   elMassVal.textContent   = fmt(state.discMass * u.massK, 2) + ' ' + u.mass;
    if (elRadiusVal) elRadiusVal.textContent = roundN(state.discRadius * 1000 * u.lenK, u.lenK === 1 ? 0 : 2) + ' ' + u.len;
    if (elWeightVal) elWeightVal.textContent = fmt(state.appliedWeight * u.NK, 2) + ' ' + u.N;
    if (elDistVal)   elDistVal.textContent   = roundN(state.weightDist * 1000 * u.lenK, u.lenK === 1 ? 0 : 2) + ' ' + u.len;
  }

  function applyUnitDisplay() {
    syncSliderLabels();
    /* Readout cards + their unit captions are owned by updateReadouts(),
       which also runs on every frame — call it so the switch is immediate. */
    updateReadouts();
    updateLearnPanels();
  }
  var elUnitToggle = $('unit-toggle');
  if (elUnitToggle) {
    elUnitToggle.addEventListener('click', function(e) {
      if (!e.target.matches('.pill')) return;
      var u = e.target.getAttribute('data-unit');
      if (!u) return;
      state.units = u;
      elUnitToggle.querySelectorAll('.pill').forEach(function(p) {
        p.classList.toggle('active', p.getAttribute('data-unit') === u);
      });
      applyUnitDisplay();
      try { localStorage.setItem('gyro_units', u); } catch(_){}
    });
  }
  try {
    var stored = localStorage.getItem('gyro_units');
    if (stored === 'imp') {
      state.units = 'imp';
      elUnitToggle.querySelectorAll('.pill').forEach(function(p){p.classList.toggle('active', p.getAttribute('data-unit') === 'imp');});
    }
  } catch(_) {}

  /* === Feature toggles === */
  ['vectors','trail','gimbals','labels','sweep'].forEach(function(key) {
    var el = $('ft-' + key);
    if (!el) return;
    el.addEventListener('change', function() {
      var prop = 'show' + key.charAt(0).toUpperCase() + key.slice(1);
      state[prop] = el.checked;
      if (!state.running) drawMachine();
    });
  });

  /* === Web Audio impact sound === */
  var audioCtx = null;
  function audioInit() {
    if (audioCtx) return audioCtx;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(_) { audioCtx = null; }
    return audioCtx;
  }
  function playImpact() {
    if (!state.soundOn) return;
    var ctx = audioInit();
    if (!ctx) return;
    var now = ctx.currentTime;
    /* Low thud */
    var osc = ctx.createOscillator(); var gain = ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.25);
    /* High click overtone */
    var osc2 = ctx.createOscillator(); var g2 = ctx.createGain();
    osc2.type = 'triangle'; osc2.frequency.setValueAtTime(900, now);
    g2.gain.setValueAtTime(0.0001, now);
    g2.gain.exponentialRampToValueAtTime(0.12, now + 0.005);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    osc2.connect(g2).connect(ctx.destination);
    osc2.start(now); osc2.stop(now + 0.1);
  }
  var elSnd = $('chk-sound');
  if (elSnd) elSnd.addEventListener('change', function() { state.soundOn = elSnd.checked; });
  /* Hook into existing applyTorque */
  var _origApplyTorque = applyTorque;
  applyTorque = function() { _origApplyTorque(); playImpact(); };
  if (elBtnTorque) {
    elBtnTorque.removeEventListener('click', _origApplyTorque);
    elBtnTorque.addEventListener('click', applyTorque);
  }

  /* === Exports === */
  function exportPNG() {
    try {
      var url = mCanvas.toDataURL('image/png');
      var a = document.createElement('a');
      a.href = url;
      a.download = 'gyroscope_' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e) { alert('PNG export failed: ' + e.message); }
  }
  function exportCSV() {
    var rows = [['t_s','prec_deg','nut_deg','L_kgm2s','tau_Nm','omega_rad_s','omegaPrec_rad_s','KE_J']];
    var n = Math.min(state.precHist.length, state.nutHist.length);
    var dt = 1/60;
    for (var i = 0; i < n; i++) {
      rows.push([
        roundN(i * dt, 3),
        roundN(state.precHist[i], 3),
        roundN(state.nutHist[i], 3),
        roundN(state.L, 4),
        roundN(state.tau, 4),
        roundN(state.omegaSpin, 2),
        roundN(state.omegaPrec, 4),
        roundN(state.KE_spin, 2)
      ].join(','));
    }
    var csv = rows.map(function(r) { return Array.isArray(r) ? r.join(',') : r; }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'gyroscope_data_' + Date.now() + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 1500);
  }
  if ($('btn-export-png')) $('btn-export-png').addEventListener('click', exportPNG);
  if ($('btn-export-csv')) $('btn-export-csv').addEventListener('click', exportCSV);
  if ($('btn-reset-view')) $('btn-reset-view').addEventListener('click', function() {
    VIEW_YAW = 0.5; VIEW_PITCH = 0.35; refreshView();
    if (!state.running) drawMachine();
  });

  /* === Right-click context menu on machine canvas === */
  var elCtx = $('machine-ctx-menu');
  if (elCtx && mCanvas) {
    mCanvas.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      elCtx.style.display = 'block';
      var menuW = 220, menuH = 250;
      var x = Math.min(e.clientX, window.innerWidth - menuW - 10);
      var y = Math.min(e.clientY, window.innerHeight - menuH - 10);
      elCtx.style.left = x + 'px'; elCtx.style.top = y + 'px';
    });
    document.addEventListener('click', function(e) {
      if (!elCtx.contains(e.target)) elCtx.style.display = 'none';
    });
    elCtx.addEventListener('click', function(e) {
      var a = e.target.getAttribute('data-act'); if (!a) return;
      elCtx.style.display = 'none';
      if (a === 'export-png') exportPNG();
      else if (a === 'export-csv') exportCSV();
      else if (a === 'reset-view') { VIEW_YAW = 0.5; VIEW_PITCH = 0.35; refreshView(); if (!state.running) drawMachine(); }
      else if (a === 'reset-sim') resetSim();
      else if (a === 'toggle-vectors') { state.showVectors = !state.showVectors; var c = $('ft-vectors'); if (c) c.checked = state.showVectors; if (!state.running) drawMachine(); }
      else if (a === 'toggle-labels')  { state.showLabels  = !state.showLabels;  var c2= $('ft-labels');  if (c2) c2.checked = state.showLabels;  if (!state.running) drawMachine(); }
    });
  }

  /* === Show Calculation modal === */
  function buildCalcSteps() {
    var u = UNITS[state.units];
    var m = state.discMass, R = state.discRadius, rpm = state.spinRPM;
    var W = state.appliedWeight, d = state.weightDist;
    var I = 0.5 * m * R * R;
    var w = rpmToRad(rpm);
    var L = I * w;
    var tau = W * d;
    var op = L > 1e-6 ? tau / L : 0;
    var KE = 0.5 * I * w * w;
    var C  = I * w * op;

    var html = '';
    html += '<div class="cs-inputs">';
    html += '  <span class="cs-badge">Given</span>';
    html += '  <div class="cs-given">';
    html += '    <span>m = ' + fmt(m * u.massK, 2) + ' ' + u.mass + '</span>';
    html += '    <span>R = ' + Math.round(R*1000 * u.lenK) + ' ' + u.len + '</span>';
    html += '    <span>ω = ' + rpm + ' RPM</span>';
    html += '    <span>W = ' + fmt(W * u.NK, 2) + ' ' + u.N + '</span>';
    html += '    <span>d = ' + Math.round(d*1000 * u.lenK) + ' ' + u.len + '</span>';
    html += '  </div>';
    html += '</div>';

    function step(num, title, formula, calc, result) {
      return '<div class="cs-step">' +
        '<div class="cs-step-hd"><span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>' +
        '<div class="cs-formula">\\(' + formula + '\\)</div>' +
        '<div class="cs-calc">' + calc + '</div>' +
        '<div class="cs-result"><strong>' + result + '</strong></div>' +
      '</div>';
    }

    html += step(1, 'Moment of Inertia (solid disc)',
      'I = \\tfrac{1}{2} m R^2',
      '= 0.5 × ' + m + ' × (' + R + ')²',
      'I = ' + roundN(I, 5) + ' kg·m²');

    html += step(2, 'Angular velocity (RPM → rad/s)',
      '\\omega = \\dfrac{2\\pi \\cdot \\text{RPM}}{60}',
      '= 2π × ' + rpm + ' / 60',
      'ω = ' + roundN(w, 2) + ' rad/s');

    html += step(3, 'Angular momentum',
      'L = I \\cdot \\omega',
      '= ' + roundN(I, 5) + ' × ' + roundN(w, 2),
      'L = ' + roundN(L, 3) + ' kg·m²/s');

    html += step(4, 'Torque from applied weight',
      '\\tau = W \\cdot d',
      '= ' + W + ' × ' + d + ' m',
      'τ = ' + roundN(tau, 3) + ' N·m');

    html += step(5, 'Precession rate',
      '\\Omega_p = \\dfrac{\\tau}{L}',
      '= ' + roundN(tau, 3) + ' / ' + roundN(L, 3),
      'Ω_p = ' + roundN(op, 4) + ' rad/s   (' + roundN(op * RAD_TO_DEG, 2) + ' °/s)');

    html += step(6, 'Kinetic energy of spin',
      'KE = \\tfrac{1}{2} I \\omega^2',
      '= 0.5 × ' + roundN(I, 5) + ' × ' + roundN(w, 2) + '²',
      'KE = ' + roundN(KE, 2) + ' J');

    html += step(7, 'Gyroscopic couple',
      'C = I \\cdot \\omega \\cdot \\Omega_p',
      '= ' + roundN(I, 5) + ' × ' + roundN(w, 2) + ' × ' + roundN(op, 4),
      'C = ' + roundN(C, 3) + ' N·m');

    return html;
  }
  var elCalcModal = $('calc-modal'), elCalcBody = $('calc-modal-body');
  if ($('btn-show-calc')) $('btn-show-calc').addEventListener('click', function() {
    elCalcBody.innerHTML = buildCalcSteps();
    elCalcModal.classList.add('active');
  });
  if ($('calc-modal-close')) $('calc-modal-close').addEventListener('click', function() {
    elCalcModal.classList.remove('active');
  });
  if (elCalcModal) elCalcModal.addEventListener('click', function(e) {
    if (e.target === elCalcModal) elCalcModal.classList.remove('active');
  });

  /* === Live equations panel + coach === */
  var elEqBody = $('lp-eq-body'), elCoachBody = $('lp-coach-body');
  function updateLearnPanels() {
    if (!elEqBody) return;
    var u = UNITS[state.units];
    var w = state.omegaSpin;
    var lines = '';
    lines += '<div class="eq-line">\\(I = \\tfrac{1}{2} m R^2 = \\) <b>' + roundN(state.I, 5) + ' kg·m²</b></div>';
    lines += '<div class="eq-line">\\(L = I\\omega = \\) <b>' + roundN(state.L, 3) + ' kg·m²/s</b></div>';
    lines += '<div class="eq-line">\\(\\tau = W \\cdot d = \\) <b>' + roundN(state.tau, 3) + ' N·m</b></div>';
    lines += '<div class="eq-line">\\(\\Omega_p = \\tau / L = \\) <b>' + roundN(state.omegaPrec, 4) + ' rad/s</b> (' + roundN(state.omegaPrec*RAD_TO_DEG, 2) + ' °/s)</div>';
    lines += '<div class="eq-line">\\(KE = \\tfrac{1}{2}I\\omega^2 = \\) <b>' + roundN(state.KE_spin, 2) + ' J</b></div>';
    lines += '<div class="eq-line">\\(C = I\\omega\\Omega_p = \\) <b>' + roundN(state.gyroCouple, 3) + ' N·m</b></div>';
    elEqBody.innerHTML = lines;
    /* Coach */
    if (elCoachBody) {
      var tips = [];
      if (state.spinRPM < 500) tips.push('At ' + state.spinRPM + ' RPM, angular momentum L is small — precession is fast and unstable. Try ≥ 3000 RPM for a stable cone.');
      if (state.spinRPM > 7000) tips.push('Very high spin: L is large, so Ω_p slows dramatically. Faster spin = slower precession (Ω_p ∝ 1/L).');
      if (state.tau < 0.05 && CONFIGS[state.configIdx].id !== 'free') tips.push('Torque is tiny (' + roundN(state.tau, 3) + ' N·m). Increase Weight or Distance to drive a visible cone.');
      if (state.tau > 1.0) tips.push('Heavy torque: the wobble may dominate. Watch for nutation in the trail.');
      if (state.discRadius < 0.05) tips.push('Small radius — I = ½mR² scales with R², so increasing R is the most effective way to raise L.');
      if (tips.length === 0) tips.push('Steady parameters. Click <b>τ Apply Torque</b> to perturb the axis and watch the 90° rule.');
      elCoachBody.innerHTML = '<ul class="coach-list">' + tips.map(function(t){return '<li>'+t+'</li>';}).join('') + '</ul>';
    }
  }
  if ($('learn-expand-all')) $('learn-expand-all').addEventListener('click', function() {
    document.querySelectorAll('#learn-panels .learn-card').forEach(function(c){ c.open = true; });
  });
  if ($('learn-collapse-all')) $('learn-collapse-all').addEventListener('click', function() {
    document.querySelectorAll('#learn-panels .learn-card').forEach(function(c){ c.open = false; });
  });
  /* Hook updateReadouts to also update learn panels.
     It must NOT call applyUnitDisplay() — that now delegates back to
     updateReadouts(), which would recurse through this very wrapper. Unit
     conversion is handled inside updateReadouts itself. */
  var _origUpdateReadouts = updateReadouts;
  updateReadouts = function() { _origUpdateReadouts(); updateLearnPanels(); };

  /* === Keyboard shortcuts === */
  window.addEventListener('keydown', function(e) {
    /* Ignore when typing in inputs */
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.code === 'Space') { e.preventDefault(); toggleSim(); }
    else if (e.key === 'r' || e.key === 'R') { resetSim(); }
    else if (e.key === 't' || e.key === 'T') { applyTorque(); }
    else if (e.key === 'Escape') {
      if (elCalcModal && elCalcModal.classList.contains('active')) elCalcModal.classList.remove('active');
      if (elCtx) elCtx.style.display = 'none';
    }
  });

  /* === Window resize → reinit canvas DPR === */
  var _rsTimer = null;
  window.addEventListener('resize', function() {
    if (_rsTimer) clearTimeout(_rsTimer);
    _rsTimer = setTimeout(function() {
      initCanvases();
      drawMachine(); drawGraph();
      if (state.mode === 'explore') drawExploreConcept();
    }, 120);
  });

  /* === First-time hint === */
  try {
    if (!localStorage.getItem('gyro_hint_seen')) {
      var hint = $('hint-overlay');
      if (hint) {
        hint.style.display = 'flex';
        setTimeout(function() { if (hint) hint.style.display = 'none'; }, 6000);
      }
      localStorage.setItem('gyro_hint_seen', '1');
    }
  } catch(_) {}
  if ($('hint-close')) $('hint-close').addEventListener('click', function() {
    var h = $('hint-overlay'); if (h) h.style.display = 'none';
  });

  /* Initial population of learn panels + unit display */
  updateLearnPanels();
  applyUnitDisplay();

})();
