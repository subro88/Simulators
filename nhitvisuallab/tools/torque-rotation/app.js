(function () {
  'use strict';

  /* ================================================================
     DATA — EXPLORE CONCEPTS (12 concepts in 3 categories)
     ================================================================ */
  var CONCEPTS = [
    /* ── Torque Basics ─────────────────────────────────────────── */
    {
      id: 'torque-moment', name: 'Torque (Moment of Force)', symbol: '\u03C4 = Fr sin\u03B8',
      formula: '\u03C4 = F \u00D7 r \u00D7 sin\u03B8', unit: 'N\u00B7m',
      cat: 'torque-basics',
      desc: 'Torque is the rotational equivalent of force. It measures the tendency of a force to cause rotation about a pivot point. Torque depends on three factors: the magnitude of the force (F), the distance from the pivot (r), and the angle between the force vector and the lever arm (\u03B8). Maximum torque occurs when \u03B8 = 90\u00B0 (force perpendicular to lever arm).',
      example: {
        problem: 'A 120 N force is applied at 0.30 m from the bolt at 90\u00B0. Find the torque.',
        steps: ['\u03C4 = F \u00D7 r \u00D7 sin\u03B8', '\u03C4 = 120 \u00D7 0.30 \u00D7 sin(90\u00B0)', '\u03C4 = 120 \u00D7 0.30 \u00D7 1.0', '\u03C4 = 36.0 N\u00B7m'],
        answer: 36.0, unit: 'N\u00B7m'
      }
    },
    {
      id: 'couple', name: 'Couple', symbol: '\u03C4 = F \u00D7 d',
      formula: '\u03C4 = F \u00D7 d (two equal opposite forces)', unit: 'N\u00B7m',
      cat: 'torque-basics',
      desc: 'A couple consists of two equal and opposite forces acting on a body but not along the same line. The torque produced by a couple is F \u00D7 d, where d is the perpendicular distance between the two forces. A couple produces pure rotation without translation. Steering wheels and screwdriver handles use couples.',
      example: {
        problem: 'Two 25 N forces act 0.4 m apart on a steering wheel. Find the couple torque.',
        steps: ['\u03C4 = F \u00D7 d', '\u03C4 = 25 \u00D7 0.4', '\u03C4 = 10.0 N\u00B7m'],
        answer: 10.0, unit: 'N\u00B7m'
      }
    },
    {
      id: 'moment-arm', name: 'Moment Arm', symbol: 'r\u22A5 = r sin\u03B8',
      formula: 'r\u22A5 = r \u00D7 sin\u03B8 (effective lever arm)', unit: 'm',
      cat: 'torque-basics',
      desc: 'The moment arm (or lever arm) is the perpendicular distance from the line of action of the force to the pivot point. When force is not perpendicular to the lever, the effective moment arm is r\u22A5 = r \u00D7 sin\u03B8. Longer moment arms produce greater torque for the same force. This is why door handles are placed far from the hinge.',
      example: {
        problem: 'A wrench is 0.40 m long. Force is applied at 60\u00B0. Find the effective moment arm.',
        steps: ['r\u22A5 = r \u00D7 sin\u03B8', 'r\u22A5 = 0.40 \u00D7 sin(60\u00B0)', 'r\u22A5 = 0.40 \u00D7 0.866', 'r\u22A5 = 0.346 m'],
        answer: 0.346, unit: 'm'
      }
    },
    {
      id: 'equilibrium', name: 'Equilibrium of Moments', symbol: '\u03A3\u03C4 = 0',
      formula: '\u03A3\u03C4_clockwise = \u03A3\u03C4_counter-clockwise', unit: '',
      cat: 'torque-basics',
      desc: 'Rotational equilibrium occurs when the sum of all torques about any point is zero. For a seesaw, this means m\u2081g \u00D7 d\u2081 = m\u2082g \u00D7 d\u2082. This principle is used in balance scales, levers, and structural analysis. A heavier person sits closer to the fulcrum to balance a lighter person on the other side.',
      example: {
        problem: 'A 30 kg child sits 2.0 m from the fulcrum. Where should a 20 kg child sit to balance?',
        steps: ['m\u2081 \u00D7 d\u2081 = m\u2082 \u00D7 d\u2082', '30 \u00D7 2.0 = 20 \u00D7 d\u2082', 'd\u2082 = 60 / 20', 'd\u2082 = 3.0 m'],
        answer: 3.0, unit: 'm'
      }
    },

    /* ── Rotational Dynamics ───────────────────────────────────── */
    {
      id: 'moment-of-inertia', name: 'Moment of Inertia', symbol: 'I = \u03A3mr\u00B2',
      formula: 'Disc: I = \u00BDmr\u00B2 | Ring: I = mr\u00B2 | Sphere: I = \u2154mr\u00B2', unit: 'kg\u00B7m\u00B2',
      cat: 'rotational-dynamics',
      desc: 'Moment of inertia is the rotational analogue of mass. It measures resistance to angular acceleration and depends on how mass is distributed relative to the rotation axis. A ring has all mass at the rim (I = mr\u00B2), while a solid disc distributes mass evenly (I = \u00BDmr\u00B2). Greater moment of inertia requires more torque for the same angular acceleration.',
      example: {
        problem: 'A solid disc has mass 4 kg and radius 0.30 m. Find its moment of inertia.',
        steps: ['I = \u00BDmr\u00B2', 'I = 0.5 \u00D7 4 \u00D7 0.30\u00B2', 'I = 0.5 \u00D7 4 \u00D7 0.09', 'I = 0.18 kg\u00B7m\u00B2'],
        answer: 0.18, unit: 'kg\u00B7m\u00B2'
      }
    },
    {
      id: 'angular-accel', name: 'Angular Acceleration', symbol: '\u03B1 = \u03C4/I',
      formula: '\u03B1 = \u03C4 / I', unit: 'rad/s\u00B2',
      cat: 'rotational-dynamics',
      desc: 'Angular acceleration (\u03B1) is the rate of change of angular velocity. Newton\'s second law for rotation states \u03C4 = I\u03B1, so \u03B1 = \u03C4/I. A larger torque or smaller moment of inertia produces greater angular acceleration. This is analogous to a = F/m for linear motion.',
      example: {
        problem: 'A torque of 15 N\u00B7m is applied to a disc with I = 0.5 kg\u00B7m\u00B2. Find \u03B1.',
        steps: ['\u03B1 = \u03C4 / I', '\u03B1 = 15 / 0.5', '\u03B1 = 30 rad/s\u00B2'],
        answer: 30, unit: 'rad/s\u00B2'
      }
    },
    {
      id: 'angular-momentum', name: 'Angular Momentum', symbol: 'L = I\u03C9',
      formula: 'L = I \u00D7 \u03C9 (conserved when \u03C4 = 0)', unit: 'kg\u00B7m\u00B2/s',
      cat: 'rotational-dynamics',
      desc: 'Angular momentum L = I\u03C9 is the rotational analogue of linear momentum. When no external torque acts, angular momentum is conserved. This is why a spinning figure skater speeds up when pulling arms in \u2014 reducing I increases \u03C9 to keep L constant. Angular momentum is also key to gyroscope stability.',
      example: {
        problem: 'A disc (I = 0.2 kg\u00B7m\u00B2) spins at 50 rad/s. Find its angular momentum.',
        steps: ['L = I \u00D7 \u03C9', 'L = 0.2 \u00D7 50', 'L = 10.0 kg\u00B7m\u00B2/s'],
        answer: 10.0, unit: 'kg\u00B7m\u00B2/s'
      }
    },
    {
      id: 'rotational-ke', name: 'Rotational KE', symbol: 'KE = \u00BDI\u03C9\u00B2',
      formula: 'KE_rot = \u00BD \u00D7 I \u00D7 \u03C9\u00B2', unit: 'J',
      cat: 'rotational-dynamics',
      desc: 'Rotational kinetic energy is the energy of a spinning object: KE = \u00BDI\u03C9\u00B2. For a rolling object, total KE = \u00BDmv\u00B2 + \u00BDI\u03C9\u00B2 (translational + rotational). Flywheels store energy in rotational form. The energy stored increases with the square of angular velocity, making high-speed flywheels very effective energy storage devices.',
      example: {
        problem: 'A flywheel (I = 2.0 kg\u00B7m\u00B2) spins at 100 rad/s. Find its rotational KE.',
        steps: ['KE = \u00BDI\u03C9\u00B2', 'KE = 0.5 \u00D7 2.0 \u00D7 100\u00B2', 'KE = 0.5 \u00D7 2.0 \u00D7 10000', 'KE = 10000 J = 10 kJ'],
        answer: 10000, unit: 'J'
      }
    },

    /* ── Applications ──────────────────────────────────────────── */
    {
      id: 'wrench-bolt', name: 'Wrench/Bolt Torque', symbol: '\u03C4_req for bolts',
      formula: '\u03C4_applied = F \u00D7 r \u00D7 sin\u03B8 \u2265 \u03C4_required', unit: 'N\u00B7m',
      cat: 'applications',
      desc: 'Bolt tightening requires a specific torque value that depends on the bolt size and grade. Common torque specs: M8 \u2248 18 N\u00B7m, M12 \u2248 45 N\u00B7m, M16 \u2248 90 N\u00B7m, M20 \u2248 150 N\u00B7m. A torque wrench measures applied torque and clicks or signals when the target is reached. Over-torquing can strip threads; under-torquing leads to joint failure.',
      example: {
        problem: 'An M16 bolt needs 90 N\u00B7m. Can a 200 N force on a 0.40 m wrench at 90\u00B0 tighten it?',
        steps: ['\u03C4 = F \u00D7 r \u00D7 sin\u03B8', '\u03C4 = 200 \u00D7 0.40 \u00D7 1.0', '\u03C4 = 80.0 N\u00B7m', '80 < 90 N\u00B7m \u2014 NOT enough torque!'],
        answer: 80.0, unit: 'N\u00B7m'
      }
    },
    {
      id: 'seesaw-lever', name: 'Seesaw / Lever', symbol: 'm\u2081d\u2081 = m\u2082d\u2082',
      formula: 'm\u2081 \u00D7 d\u2081 = m\u2082 \u00D7 d\u2082 (balance)', unit: '',
      cat: 'applications',
      desc: 'A seesaw is a first-class lever with the fulcrum between the effort and load. Balance occurs when clockwise torque equals counter-clockwise torque. Since g is constant, m\u2081d\u2081 = m\u2082d\u2082 is sufficient. This principle is used in beam balances, scales, and engineering for calculating reaction forces at supports.',
      example: {
        problem: 'A 15 kg child sits 2.5 m left. A 25 kg child sits 1.2 m right. Which way does it tilt?',
        steps: ['\u03C4_left = 15 \u00D7 9.81 \u00D7 2.5 = 367.9 N\u00B7m', '\u03C4_right = 25 \u00D7 9.81 \u00D7 1.2 = 294.3 N\u00B7m', '\u03C4_left > \u03C4_right', 'Tilts LEFT (counter-clockwise)'],
        answer: 367.9, unit: 'N\u00B7m (left torque)'
      }
    },
    {
      id: 'rolling-motion', name: 'Rolling Motion', symbol: 'a = g sin\u03B8/(1+I/mr\u00B2)',
      formula: 'a = g\u00B7sin\u03B8 / (1 + I/mr\u00B2)', unit: 'm/s\u00B2',
      cat: 'applications',
      desc: 'Rolling without slipping combines translation and rotation. The acceleration down an incline depends on the shape\'s moment of inertia ratio I/mr\u00B2. Solid sphere (0.4) rolls fastest, solid cylinder (0.5) is next, and hollow cylinder (1.0) is slowest. Remarkably, mass and radius cancel out \u2014 only the shape matters!',
      example: {
        problem: 'A solid cylinder rolls down a 30\u00B0 incline. Find its acceleration. (g = 9.81)',
        steps: ['I/mr\u00B2 = 0.5 for solid cylinder', 'a = g\u00B7sin\u03B8 / (1 + 0.5)', 'a = 9.81 \u00D7 sin(30\u00B0) / 1.5', 'a = 9.81 \u00D7 0.5 / 1.5 = 3.27 m/s\u00B2'],
        answer: 3.27, unit: 'm/s\u00B2'
      }
    },
    {
      id: 'flywheel', name: 'Flywheel', symbol: 'KE = \u00BDI\u03C9\u00B2',
      formula: 'Energy stored: KE = \u00BD \u00D7 I \u00D7 \u03C9\u00B2', unit: 'J',
      cat: 'applications',
      desc: 'Flywheels store rotational kinetic energy for later use. They smooth out power delivery in engines, store energy in hybrid vehicles, and provide backup power. Energy scales with \u03C9\u00B2, so doubling speed quadruples stored energy. Modern composite flywheels can spin at over 60,000 RPM and store megajoules of energy.',
      example: {
        problem: 'A flywheel (I = 5 kg\u00B7m\u00B2) spins at 3000 RPM. Find stored energy.',
        steps: ['\u03C9 = 3000 \u00D7 2\u03C0/60 = 314.16 rad/s', 'KE = \u00BDI\u03C9\u00B2', 'KE = 0.5 \u00D7 5 \u00D7 314.16\u00B2', 'KE = 246,740 J \u2248 246.7 kJ'],
        answer: 246740, unit: 'J'
      }
    }
  ];

  /* ================================================================
     DATA — PRACTICE GENERATORS (12)
     ================================================================ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function randF(a, b, d) { var v = a + Math.random() * (b - a); return +v.toFixed(d || 2); }

  var PRACTICE = [
    /* 0 — Torque = F \u00D7 r \u00D7 sin\u03B8 */
    function () {
      var F = randInt(50, 300);
      var r = randF(0.1, 0.5, 2);
      var theta = [30, 45, 60, 90][randInt(0, 3)];
      var tau = +(F * r * Math.sin(theta * Math.PI / 180)).toFixed(2);
      return {
        prompt: 'A ' + F + ' N force is applied at ' + r + ' m from a bolt at ' + theta + '\u00B0. Find the torque (N\u00B7m).',
        steps: ['\u03C4 = F \u00D7 r \u00D7 sin\u03B8', '\u03C4 = ' + F + ' \u00D7 ' + r + ' \u00D7 sin(' + theta + '\u00B0)', '\u03C4 = ' + F + ' \u00D7 ' + r + ' \u00D7 ' + Math.sin(theta * Math.PI / 180).toFixed(4), '\u03C4 = ' + tau + ' N\u00B7m'],
        answer: tau, unit: 'N\u00B7m'
      };
    },
    /* 1 — Moment arm calculation */
    function () {
      var r = randF(0.15, 0.55, 2);
      var theta = randInt(20, 80);
      var rPerp = +(r * Math.sin(theta * Math.PI / 180)).toFixed(3);
      return {
        prompt: 'A wrench is ' + r + ' m long and force is applied at ' + theta + '\u00B0. Find the effective moment arm (m).',
        steps: ['r\u22A5 = r \u00D7 sin\u03B8', 'r\u22A5 = ' + r + ' \u00D7 sin(' + theta + '\u00B0)', 'r\u22A5 = ' + r + ' \u00D7 ' + Math.sin(theta * Math.PI / 180).toFixed(4), 'r\u22A5 = ' + rPerp + ' m'],
        answer: +rPerp, unit: 'm'
      };
    },
    /* 2 — Torque for equilibrium (find unknown mass) */
    function () {
      var m1 = randInt(5, 40);
      var d1 = randF(1.0, 3.0, 1);
      var d2 = randF(1.0, 3.0, 1);
      var m2 = +(m1 * d1 / d2).toFixed(2);
      return {
        prompt: 'A ' + m1 + ' kg mass sits ' + d1 + ' m left of a fulcrum. What mass at ' + d2 + ' m right will balance it? (kg)',
        steps: ['m\u2081 \u00D7 d\u2081 = m\u2082 \u00D7 d\u2082', m1 + ' \u00D7 ' + d1 + ' = m\u2082 \u00D7 ' + d2, 'm\u2082 = ' + (m1 * d1).toFixed(1) + ' / ' + d2, 'm\u2082 = ' + m2 + ' kg'],
        answer: m2, unit: 'kg'
      };
    },
    /* 3 — Couple torque */
    function () {
      var F = randInt(10, 80);
      var d = randF(0.1, 0.8, 2);
      var tau = +(F * d).toFixed(2);
      return {
        prompt: 'Two ' + F + ' N forces act as a couple with ' + d + ' m separation. Find the torque (N\u00B7m).',
        steps: ['\u03C4 = F \u00D7 d', '\u03C4 = ' + F + ' \u00D7 ' + d, '\u03C4 = ' + tau + ' N\u00B7m'],
        answer: tau, unit: 'N\u00B7m'
      };
    },
    /* 4 — Moment of inertia (disc) */
    function () {
      var m = randInt(2, 15);
      var r = randF(0.1, 0.5, 2);
      var I = +(0.5 * m * r * r).toFixed(4);
      return {
        prompt: 'A solid disc has mass ' + m + ' kg and radius ' + r + ' m. Find I (kg\u00B7m\u00B2).',
        steps: ['I = \u00BDmr\u00B2', 'I = 0.5 \u00D7 ' + m + ' \u00D7 ' + r + '\u00B2', 'I = 0.5 \u00D7 ' + m + ' \u00D7 ' + (r * r).toFixed(4), 'I = ' + I + ' kg\u00B7m\u00B2'],
        answer: I, unit: 'kg\u00B7m\u00B2'
      };
    },
    /* 5 — Moment of inertia (ring) */
    function () {
      var m = randInt(2, 15);
      var r = randF(0.1, 0.5, 2);
      var I = +(m * r * r).toFixed(4);
      return {
        prompt: 'A thin ring has mass ' + m + ' kg and radius ' + r + ' m. Find I (kg\u00B7m\u00B2).',
        steps: ['I = mr\u00B2', 'I = ' + m + ' \u00D7 ' + r + '\u00B2', 'I = ' + m + ' \u00D7 ' + (r * r).toFixed(4), 'I = ' + I + ' kg\u00B7m\u00B2'],
        answer: I, unit: 'kg\u00B7m\u00B2'
      };
    },
    /* 6 — Angular acceleration from torque */
    function () {
      var tau = randInt(5, 40);
      var I = randF(0.1, 2.0, 2);
      var alpha = +(tau / I).toFixed(2);
      return {
        prompt: 'A torque of ' + tau + ' N\u00B7m acts on an object with I = ' + I + ' kg\u00B7m\u00B2. Find \u03B1 (rad/s\u00B2).',
        steps: ['\u03B1 = \u03C4 / I', '\u03B1 = ' + tau + ' / ' + I, '\u03B1 = ' + alpha + ' rad/s\u00B2'],
        answer: alpha, unit: 'rad/s\u00B2'
      };
    },
    /* 7 — Angular momentum */
    function () {
      var I = randF(0.1, 2.0, 2);
      var omega = randInt(10, 100);
      var L = +(I * omega).toFixed(2);
      return {
        prompt: 'A body with I = ' + I + ' kg\u00B7m\u00B2 spins at \u03C9 = ' + omega + ' rad/s. Find angular momentum L (kg\u00B7m\u00B2/s).',
        steps: ['L = I \u00D7 \u03C9', 'L = ' + I + ' \u00D7 ' + omega, 'L = ' + L + ' kg\u00B7m\u00B2/s'],
        answer: L, unit: 'kg\u00B7m\u00B2/s'
      };
    },
    /* 8 — Rotational kinetic energy */
    function () {
      var I = randF(0.5, 3.0, 1);
      var omega = randInt(10, 80);
      var KE = +(0.5 * I * omega * omega).toFixed(2);
      return {
        prompt: 'A flywheel with I = ' + I + ' kg\u00B7m\u00B2 spins at ' + omega + ' rad/s. Find rotational KE (J).',
        steps: ['KE = \u00BDI\u03C9\u00B2', 'KE = 0.5 \u00D7 ' + I + ' \u00D7 ' + omega + '\u00B2', 'KE = 0.5 \u00D7 ' + I + ' \u00D7 ' + (omega * omega), 'KE = ' + KE + ' J'],
        answer: KE, unit: 'J'
      };
    },
    /* 9 — Rolling acceleration down incline */
    function () {
      var angle = randInt(15, 45);
      var shapes = [
        { name: 'solid cylinder', k: 0.5 },
        { name: 'hollow cylinder', k: 1.0 },
        { name: 'solid sphere', k: 0.4 }
      ];
      var s = shapes[randInt(0, 2)];
      var a = +(9.81 * Math.sin(angle * Math.PI / 180) / (1 + s.k)).toFixed(2);
      return {
        prompt: 'A ' + s.name + ' (I/mr\u00B2 = ' + s.k + ') rolls down a ' + angle + '\u00B0 incline. Find acceleration (m/s\u00B2). (g = 9.81)',
        steps: ['a = g\u00B7sin\u03B8 / (1 + I/mr\u00B2)', 'a = 9.81 \u00D7 sin(' + angle + '\u00B0) / (1 + ' + s.k + ')', 'a = 9.81 \u00D7 ' + Math.sin(angle * Math.PI / 180).toFixed(4) + ' / ' + (1 + s.k), 'a = ' + a + ' m/s\u00B2'],
        answer: a, unit: 'm/s\u00B2'
      };
    },
    /* 10 — Bolt torque check */
    function () {
      var bolts = [{ name: 'M8', req: 18 }, { name: 'M12', req: 45 }, { name: 'M16', req: 90 }, { name: 'M20', req: 150 }];
      var b = bolts[randInt(0, 3)];
      var F = randInt(50, 400);
      var r = randF(0.15, 0.50, 2);
      var tau = +(F * r).toFixed(2);
      var pass = tau >= b.req;
      return {
        prompt: 'An ' + b.name + ' bolt needs ' + b.req + ' N\u00B7m. Force = ' + F + ' N at ' + r + ' m (\u03B8 = 90\u00B0). Applied torque? (N\u00B7m)',
        steps: ['\u03C4 = F \u00D7 r \u00D7 sin(90\u00B0)', '\u03C4 = ' + F + ' \u00D7 ' + r + ' \u00D7 1.0', '\u03C4 = ' + tau + ' N\u00B7m', tau + (pass ? ' \u2265 ' : ' < ') + b.req + ' \u2192 ' + (pass ? 'Bolt TURNS' : 'Won\'t turn')],
        answer: tau, unit: 'N\u00B7m'
      };
    },
    /* 11 — Seesaw balance (find unknown distance) */
    function () {
      var m1 = randInt(10, 50);
      var d1 = randF(1.0, 3.0, 1);
      var m2 = randInt(10, 50);
      var d2 = +(m1 * d1 / m2).toFixed(2);
      return {
        prompt: m1 + ' kg at ' + d1 + ' m left. Where should ' + m2 + ' kg sit on the right to balance? (m)',
        steps: ['m\u2081 \u00D7 d\u2081 = m\u2082 \u00D7 d\u2082', m1 + ' \u00D7 ' + d1 + ' = ' + m2 + ' \u00D7 d\u2082', 'd\u2082 = ' + (m1 * d1).toFixed(1) + ' / ' + m2, 'd\u2082 = ' + d2 + ' m'],
        answer: d2, unit: 'm'
      };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15)
     ================================================================ */
  var QUIZ_POOL = [
    { type: 'mcq', prompt: 'Torque is calculated as:', options: ['\u03C4 = F \u00D7 r \u00D7 sin\u03B8', '\u03C4 = F \u00D7 r \u00D7 cos\u03B8', '\u03C4 = F / r', '\u03C4 = m \u00D7 a'], correct: 0 },
    { type: 'mcq', prompt: 'Maximum torque from a wrench occurs when the angle is:', options: ['90\u00B0', '0\u00B0', '45\u00B0', '180\u00B0'], correct: 0 },
    { type: 'mcq', prompt: 'The moment of inertia of a solid disc is:', options: ['\u00BDmr\u00B2', 'mr\u00B2', '\u2154mr\u00B2', '\u00BCmr\u00B2'], correct: 0 },
    { type: 'mcq', prompt: 'A couple produces:', options: ['Pure rotation without translation', 'Pure translation without rotation', 'Both rotation and translation', 'Neither rotation nor translation'], correct: 0 },
    { type: 'mcq', prompt: 'For a seesaw to balance, which must be equal?', options: ['Torques on both sides', 'Masses on both sides', 'Distances on both sides', 'Heights on both sides'], correct: 0 },
    { type: 'mcq', prompt: 'Which shape rolls fastest down an incline?', options: ['Solid sphere', 'Solid cylinder', 'Hollow cylinder', 'All roll at the same speed'], correct: 0 },
    { type: 'mcq', prompt: 'Newton\'s second law for rotation is:', options: ['\u03C4 = I\u03B1', 'F = ma', 'L = I\u03C9', 'KE = \u00BDI\u03C9\u00B2'], correct: 0 },
    { type: 'mcq', prompt: 'Angular momentum is conserved when:', options: ['Net external torque is zero', 'Net force is zero', 'Velocity is constant', 'Mass is constant'], correct: 0 },
    { type: 'mcq', prompt: 'A hollow cylinder has I/mr\u00B2 =', options: ['1.0', '0.5', '0.4', '2.0'], correct: 0 },
    { type: 'mcq', prompt: 'Doubling the lever arm length:', options: ['Doubles the torque', 'Halves the torque', 'Quadruples the torque', 'Has no effect'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'Force = 100 N, lever arm = 0.40 m, angle = 90\u00B0. Find torque (N\u00B7m).', answer: 40.0, unit: 'N\u00B7m', steps: ['\u03C4 = 100 \u00D7 0.40 \u00D7 sin(90\u00B0)', '\u03C4 = 100 \u00D7 0.40 \u00D7 1.0 = 40.0 N\u00B7m'] },
    { type: 'numeric', prompt: 'Solid disc: m = 10 kg, r = 0.20 m. Find I (kg\u00B7m\u00B2). Round to 2 decimals.', answer: 0.20, unit: 'kg\u00B7m\u00B2', steps: ['I = \u00BDmr\u00B2 = 0.5 \u00D7 10 \u00D7 0.04', 'I = 0.20 kg\u00B7m\u00B2'] },
    { type: 'numeric', prompt: '20 kg at 2.0 m left. What mass at 2.5 m right balances? (kg)', answer: 16.0, unit: 'kg', steps: ['m\u2081d\u2081 = m\u2082d\u2082', '20 \u00D7 2.0 = m\u2082 \u00D7 2.5', 'm\u2082 = 40/2.5 = 16.0 kg'] },
    { type: 'numeric', prompt: '\u03C4 = 24 N\u00B7m, I = 0.6 kg\u00B7m\u00B2. Find \u03B1 (rad/s\u00B2).', answer: 40.0, unit: 'rad/s\u00B2', steps: ['\u03B1 = \u03C4/I = 24/0.6', '\u03B1 = 40.0 rad/s\u00B2'] },
    { type: 'numeric', prompt: 'Solid cylinder on 30\u00B0 incline. Find rolling acceleration (m/s\u00B2). (g=9.81)', answer: 3.27, unit: 'm/s\u00B2', steps: ['a = g\u00B7sin\u03B8/(1+0.5)', 'a = 9.81\u00D70.5/1.5 = 3.27 m/s\u00B2'] }
  ];

  /* ================================================================
     HELPERS
     ================================================================ */
  function shuffleArr(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function $(s) { return document.getElementById(s) || document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function degToRad(d) { return d * Math.PI / 180; }

  /* ================================================================
     CANVAS SETUP
     ================================================================ */
  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 500;
  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var rect = cvs.getBoundingClientRect();
    var cssW = rect.width || W;
    var targetH = cssW * (H / W);
    cvs.style.height = targetH + 'px';
    cvs.width  = Math.round(cssW * dpr);
    cvs.height = Math.round(targetH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(cvs.width / W, cvs.height / H);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
    if (typeof draw === 'function') draw();
  }

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var scenario = 'seesaw';
  var discShape = 'disc';
  var G = 9.81;

  /* Wrench params */
  var wForce = 80, wArm = 0.25, wAngle = 90, wBoltReq = 18;

  /* Seesaw params — balanced by default (20×1.5 = 30×1.0 = 30 kg·m) */
  var sM1 = 20, sD1 = 1.5, sM2 = 30, sD2 = 1.0;

  /* Disc params */
  var dTorque = 10, dMass = 5, dRadius = 0.20;

  /* Rolling params */
  var rollAngle = 30;

  /* Animation */
  var anim = { running: false, startTime: 0, t: 0, boltAngle: 0, seesawAngle: 0, discAngle: 0, solidPos: 0, hollowPos: 0, spherePos: 0, omegaCur: 0 };
  var animFrame = null;
  var simDone = false;
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  /* Explore */
  var selCat = 'torque-basics';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;
  var quizCorrectFlags = [];

  /* ================================================================
     PHYSICS CALCULATIONS
     ================================================================ */
  function calcWrench() {
    var tau = wForce * wArm * Math.sin(degToRad(wAngle));
    return { applied: tau, required: wBoltReq, turns: tau >= wBoltReq };
  }

  function calcSeesaw() {
    var tL = sM1 * G * sD1;
    var tR = sM2 * G * sD2;
    var ratio = Math.abs(tL - tR) / Math.max(tL, tR, 0.01);
    var balanced = ratio < 0.01;
    var tiltDir = balanced ? 'Balanced' : (tL > tR ? 'Tilts Left' : 'Tilts Right');
    return { tauL: tL, tauR: tR, balanced: balanced, tiltDir: tiltDir };
  }

  function getInertiaFactor() {
    if (discShape === 'disc') return 0.5;
    if (discShape === 'ring') return 1.0;
    return 0.4; /* sphere */
  }

  function calcDisc() {
    var k = getInertiaFactor();
    var I = k * dMass * dRadius * dRadius;
    var alpha = dTorque / I;
    var t2 = 2;
    var omega = alpha * t2;
    var theta = 0.5 * alpha * t2 * t2;
    return { I: I, alpha: alpha, omega: omega, theta: theta, shape: discShape };
  }

  function calcRolling() {
    var sinA = Math.sin(degToRad(rollAngle));
    var aSphere = G * sinA / 1.4; /* solid sphere I/mr² = 2/5 */
    var aSolid  = G * sinA / 1.5; /* solid cyl    I/mr² = 1/2 */
    var aHollow = G * sinA / 2.0; /* hollow cyl   I/mr² = 1   */
    return { aSphere: aSphere, aSolid: aSolid, aHollow: aHollow, angle: rollAngle, ratio: aSolid / aHollow };
  }

  /* ================================================================
     DRAWING HELPERS
     ================================================================ */
  /* Background grid + radial vignette (G20) */
  function drawBgScene() {
    /* Base */
    var g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#161d2e');
    g.addColorStop(1, '#0a0e16');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    /* Grid — subtle by default, bolder when toggled on via toolbar/context menu */
    var gridAlpha = (typeof showGrid !== 'undefined' && showGrid) ? 0.20 : 0.06;
    ctx.strokeStyle = 'rgba(139,157,195,' + gridAlpha + ')';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = 0; x <= W; x += 30) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); }
    for (var y = 0; y <= H; y += 30) { ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); }
    ctx.stroke();
  }

  /* Soft drop-shadow wrapper (G21) */
  function withShadow(blur, ox, oy, color, fn) {
    ctx.save();
    ctx.shadowBlur = blur; ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy;
    ctx.shadowColor = color || 'rgba(0,0,0,0.55)';
    fn();
    ctx.restore();
  }

  /* Halo text — italic serif math typography with subtle outline (G22) */
  function drawHaloText(text, x, y, opts) {
    opts = opts || {};
    var font = opts.font || 'italic 700 16px "Cambria Math","Times New Roman",serif';
    var fill = opts.fill || '#e6edf6';
    var halo = opts.halo || 'rgba(0,0,0,0.7)';
    var align = opts.align || 'center';
    var baseline = opts.baseline || 'middle';
    ctx.font = font; ctx.textAlign = align; ctx.textBaseline = baseline;
    ctx.lineWidth = 3; ctx.strokeStyle = halo;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
  }

  /* Straight arrow with proper triangular head (G6) */
  function drawArrow(x1, y1, x2, y2, color, headSize, thickness) {
    headSize = headSize || 10;
    thickness = thickness || 3;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    var ux = dx / len, uy = dy / len;
    ctx.save();
    ctx.shadowBlur = 6; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * headSize * 0.6, y2 - uy * headSize * 0.6);
    ctx.stroke();
    ctx.fillStyle = color; ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * headSize - uy * headSize * 0.55, y2 - uy * headSize + ux * headSize * 0.55);
    ctx.lineTo(x2 - ux * headSize + uy * headSize * 0.55, y2 - uy * headSize - ux * headSize * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Curved arrow that follows an arc (G5) */
  function drawCurvedArrow(cx, cy, r, a0, a1, color, thickness, headSize) {
    thickness = thickness || 3;
    headSize = headSize || 11;
    ctx.save();
    ctx.shadowBlur = 8; ctx.shadowColor = color;
    ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1, a1 < a0);
    ctx.stroke();
    /* Arrowhead at a1 — tangent direction */
    var dir = a1 > a0 ? 1 : -1;
    var tipX = cx + r * Math.cos(a1);
    var tipY = cy + r * Math.sin(a1);
    var tx = -Math.sin(a1) * dir; var ty = Math.cos(a1) * dir;   /* tangent */
    var nx = Math.cos(a1); var ny = Math.sin(a1);                /* normal outward */
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(tipX + tx * headSize * 0.6, tipY + ty * headSize * 0.6);
    ctx.lineTo(tipX - tx * headSize * 0.4 + nx * headSize * 0.55, tipY - ty * headSize * 0.4 + ny * headSize * 0.55);
    ctx.lineTo(tipX - tx * headSize * 0.4 - nx * headSize * 0.55, tipY - ty * headSize * 0.4 - ny * headSize * 0.55);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Readout badge with glow + frosted background */
  function drawBadge(x, y, w, h, title, value, valueColor) {
    var c = valueColor || '#42a5f5';
    ctx.save();
    ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = 'rgba(13,17,30,0.85)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.fill();
    ctx.restore();
    /* Left color stripe */
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.roundRect(x, y, 3, h, [9, 0, 0, 9]); ctx.fill();
    ctx.strokeStyle = 'rgba(139,157,195,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 9); ctx.stroke();
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#8b9dc3'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(title.toUpperCase(), x + 10, y + 5);
    ctx.font = '700 13px "JetBrains Mono","Courier New",monospace';
    ctx.fillStyle = c; ctx.textBaseline = 'middle';
    ctx.fillText(value, x + 10, y + h * 0.68);
  }

  /* Hex bolt with metallic gradient + recessed socket (G4) */
  function drawHexBolt(cx, cy, size, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    /* Shadow ring */
    ctx.save();
    ctx.shadowBlur = 10; ctx.shadowOffsetY = 3; ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.fillStyle = '#000';
    ctx.beginPath();
    for (var i0 = 0; i0 < 6; i0++) {
      var a0 = Math.PI / 3 * i0 - Math.PI / 6;
      var x0 = size * Math.cos(a0), y0 = size * Math.sin(a0);
      if (i0 === 0) ctx.moveTo(x0, y0); else ctx.lineTo(x0, y0);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
    /* Hex body — metallic gradient */
    var g = ctx.createLinearGradient(-size, -size, size, size);
    g.addColorStop(0, '#8d9bb8');
    g.addColorStop(0.5, '#5a6580');
    g.addColorStop(1, '#3a4258');
    ctx.fillStyle = g;
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 3 * i - Math.PI / 6;
      var x = size * Math.cos(a), y = size * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#252a3a'; ctx.lineWidth = 2; ctx.stroke();
    /* Inner highlight ring */
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var k = 0; k < 6; k++) {
      var ak = Math.PI / 3 * k - Math.PI / 6;
      var xk = size * 0.78 * Math.cos(ak), yk = size * 0.78 * Math.sin(ak);
      if (k === 0) ctx.moveTo(xk, yk); else ctx.lineTo(xk, yk);
    }
    ctx.closePath(); ctx.stroke();
    /* Recessed socket — radial gradient (dark center, lighter rim) */
    var sg = ctx.createRadialGradient(0, -size * 0.05, 1, 0, 0, size * 0.35);
    sg.addColorStop(0, '#0a0d14');
    sg.addColorStop(1, '#2a3142');
    ctx.fillStyle = sg;
    ctx.beginPath(); ctx.arc(0, 0, size * 0.32, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  /* Realistic ring (box-end) spanner that GRIPS the bolt — rotates with it (G3)
     pivX, pivY  : bolt center
     length      : full spanner length from bolt center to handle end
     angle       : world rotation of the whole spanner (same as bolt rotation)
     boltSize    : bolt circumradius — used to size the hex grip exactly */
  function drawWrenchTool(pivX, pivY, length, angle, boltSize) {
    boltSize = boltSize || 22;
    /* Geometry */
    var ringOuterR = boltSize * 1.55;     /* outer rim of the spanner ring */
    var ringInnerR = boltSize * 1.02;     /* inner contact radius — snug against bolt */
    var neckHalf   = boltSize * 0.65;     /* half-width of neck connecting ring to handle */
    var gripHalf   = boltSize * 0.45;     /* half-width of grip section */
    var gripStartX = ringOuterR * 0.96;   /* where grip starts after the ring */

    ctx.save();
    ctx.translate(pivX, pivY);
    ctx.rotate(angle);

    /* ── Body silhouette (single shape: ring + tapered neck + grip + rounded end) ── */
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowOffsetY = 5; ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    /* Top edge — start at ring top, go along outer arc, then down the neck, along top of grip, around end cap, back */
    /* Outer ring arc (right half — from top to bottom going right) */
    ctx.moveTo(0, -ringOuterR);
    ctx.arc(0, 0, ringOuterR, -Math.PI / 2, Math.PI / 2);   /* right half of ring */
    /* Bottom-left transition to grip: from ring bottom-right back along bottom */
    /* Actually we go: from ring top, around top-LEFT arc, then trace whole spanner outline.
       Restart cleanly: */
    ctx.closePath();
    ctx.beginPath();
    /* Trace outline clockwise from top of ring */
    ctx.moveTo(0, -ringOuterR);
    /* Top of ring -> top of neck transition (left half of ring upper part) */
    ctx.arc(0, 0, ringOuterR, -Math.PI / 2, -Math.PI, true);
    ctx.arc(0, 0, ringOuterR, Math.PI, Math.PI / 2, true);
    /* Now at bottom of ring. Travel right along bottom edge into grip. */
    /* Curve from ring rim outward into neck-top edge */
    /* Simpler approach: redraw with explicit path */
    ctx.closePath();

    /* SIMPLER reliable approach: draw three primitives stacked */
    ctx.restore();

    /* Body fill helpers — used twice (shadow pass + flat pass) */
    function fillBody(strokeOnly) {
      /* Grip rectangle (rounded right end) */
      ctx.beginPath();
      ctx.moveTo(gripStartX, -gripHalf);
      ctx.lineTo(length - gripHalf, -gripHalf);
      ctx.arc(length - gripHalf, 0, gripHalf, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(gripStartX, gripHalf);
      /* Neck taper back to ring */
      ctx.lineTo(ringOuterR * 0.55, neckHalf);
      ctx.lineTo(ringOuterR * 0.0,  neckHalf * 0.95);
      ctx.lineTo(ringOuterR * 0.0, -neckHalf * 0.95);
      ctx.lineTo(ringOuterR * 0.55, -neckHalf);
      ctx.closePath();
      if (strokeOnly) ctx.stroke(); else ctx.fill();
      /* Ring */
      ctx.beginPath();
      ctx.arc(0, 0, ringOuterR, 0, Math.PI * 2);
      if (strokeOnly) ctx.stroke(); else ctx.fill();
    }

    /* Drop shadow pass */
    ctx.save();
    ctx.shadowBlur = 14; ctx.shadowOffsetY = 5; ctx.shadowColor = 'rgba(0,0,0,0.6)';
    /* Base metallic gradient — diagonal */
    var bodyG = ctx.createLinearGradient(-ringOuterR, -ringOuterR, length, ringOuterR);
    bodyG.addColorStop(0, '#c5cad6');
    bodyG.addColorStop(0.35, '#8a92a8');
    bodyG.addColorStop(0.7, '#4a5168');
    bodyG.addColorStop(1, '#2a2f40');
    ctx.fillStyle = bodyG;
    fillBody(false);
    ctx.restore();

    /* Outline */
    ctx.strokeStyle = '#1a1f30'; ctx.lineWidth = 1.5;
    fillBody(true);

    /* Highlight strip along top of grip + neck */
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ringOuterR * 0.2, -neckHalf * 0.7);
    ctx.lineTo(gripStartX, -gripHalf * 0.55);
    ctx.lineTo(length - gripHalf - 6, -gripHalf * 0.55);
    ctx.stroke();

    /* Ring highlight crescent */
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, ringOuterR - 3, -Math.PI * 0.88, -Math.PI * 0.25);
    ctx.stroke();

    /* Knurled grip ridges */
    ctx.strokeStyle = 'rgba(15,20,35,0.6)'; ctx.lineWidth = 0.9;
    for (var r = gripStartX + 10; r < length - gripHalf - 4; r += 8) {
      ctx.beginPath();
      ctx.moveTo(r, -gripHalf * 0.85);
      ctx.lineTo(r, gripHalf * 0.85);
      ctx.stroke();
    }

    /* Cut the hex hole through the ring so the bolt sits flush */
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 3 * i - Math.PI / 6;
      var x = ringInnerR * Math.cos(a), y = ringInnerR * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();

    /* Inner hex edge — drawn AFTER the cutout so it traces the rim of the hole */
    ctx.strokeStyle = '#0a0e16'; ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (var i2 = 0; i2 < 6; i2++) {
      var a2 = Math.PI / 3 * i2 - Math.PI / 6;
      var x2 = ringInnerR * Math.cos(a2), y2 = ringInnerR * Math.sin(a2);
      if (i2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.closePath(); ctx.stroke();

    /* Brand stamp on grip */
    ctx.font = 'italic 700 9px "Segoe UI",sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('CrV', (gripStartX + length - gripHalf) / 2 - 30, 0);

    ctx.restore();
  }

  /* Cartoon human figure for seesaw (G8); size scales with mass */
  function drawPerson(cx, baseY, mass, color, dim) {
    var s = clamp(0.55 + mass * 0.018, 0.55, 1.4);   /* scale */
    var headR = 10 * s;
    var bodyH = 32 * s;
    var bodyW = 14 * s;
    ctx.save();
    /* Shadow under */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(cx, baseY + 2, bodyW * 1.1, 4, 0, 0, Math.PI * 2); ctx.fill();
    /* Body */
    var grd = ctx.createLinearGradient(cx - bodyW, baseY - bodyH, cx + bodyW, baseY);
    grd.addColorStop(0, color);
    grd.addColorStop(1, dim || '#222');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.roundRect(cx - bodyW / 2, baseY - bodyH, bodyW, bodyH, [bodyW / 2, bodyW / 2, 4, 4]);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    /* Arms (down) */
    ctx.strokeStyle = color; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - bodyW / 2, baseY - bodyH * 0.6);
    ctx.lineTo(cx - bodyW * 0.85, baseY - bodyH * 0.15);
    ctx.moveTo(cx + bodyW / 2, baseY - bodyH * 0.6);
    ctx.lineTo(cx + bodyW * 0.85, baseY - bodyH * 0.15);
    ctx.stroke();
    /* Head */
    ctx.fillStyle = '#f5d5b3';
    withShadow(6, 0, 2, 'rgba(0,0,0,0.5)', function () {
      ctx.beginPath(); ctx.arc(cx, baseY - bodyH - headR * 0.7, headR, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, baseY - bodyH - headR * 0.7, headR, 0, Math.PI * 2); ctx.stroke();
    /* Mass label */
    drawHaloText(mass + ' kg', cx, baseY - bodyH - headR * 2.0, {
      font: '700 11px "Segoe UI",sans-serif', fill: color, halo: 'rgba(0,0,0,0.85)'
    });
    ctx.restore();
  }

  /* ================================================================
     DRAWING — WRENCH SCENARIO
     ================================================================ */
  function drawWrench() {
    var c = calcWrench();
    var cx = W * 0.40, cy = H * 0.55;
    var boltSize = 32;
    var statusColor = c.turns ? '#3ddc84' : '#ff5555';

    /* Workpiece plate beneath the bolt */
    ctx.save();
    var pg = ctx.createLinearGradient(0, cy + 30, 0, cy + 130);
    pg.addColorStop(0, '#2a3142');
    pg.addColorStop(1, '#13182a');
    ctx.fillStyle = pg;
    ctx.beginPath(); ctx.roundRect(cx - 150, cy + 50, 300, 100, 10); ctx.fill();
    ctx.strokeStyle = '#0a0e16'; ctx.lineWidth = 1.5; ctx.stroke();
    /* Other bolts on the plate */
    ctx.fillStyle = '#0a0e16';
    [-110, 110].forEach(function (dx) {
      ctx.beginPath(); ctx.arc(cx + dx, cy + 110, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a4258'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx + dx, cy + 110, 11, 0, Math.PI * 2); ctx.stroke();
    });
    /* Plate label */
    ctx.font = '600 9px "Segoe UI",sans-serif';
    ctx.fillStyle = 'rgba(139,157,195,0.4)'; ctx.textAlign = 'center';
    ctx.fillText('STEEL FLANGE', cx, cy + 145);
    ctx.restore();

    /* Spanner geometry */
    var armPx = clamp(wArm * 540, 110, 320);

    /* Spanner + bolt rotate TOGETHER under tightening (or shake when failing).
       The bolt-rotation animation drives BOTH. Handle base direction is +x in the
       rotating frame, so the visible handle angle is just anim.boltAngle. */
    var spinAngle = anim.boltAngle;

    /* Draw the spanner (handle along +x in its local frame, rotated by spinAngle) */
    drawWrenchTool(cx, cy, armPx, spinAngle, boltSize);

    /* Draw the bolt on top, rotating with the same spinAngle so they look locked */
    drawHexBolt(cx, cy, boltSize, spinAngle);

    /* Handle end position in world coords (along +x in local, then rotated) */
    var handleEndX = cx + armPx * Math.cos(spinAngle);
    var handleEndY = cy + armPx * Math.sin(spinAngle);

    /* Lever-arm dimension line (subtle dashed) */
    ctx.save();
    ctx.strokeStyle = 'rgba(245,200,66,0.45)';
    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(handleEndX, handleEndY); ctx.stroke();
    ctx.setLineDash([]);
    /* r label offset perpendicular to the arm so it doesn't sit on the metal */
    var perpX = -Math.sin(spinAngle), perpY = Math.cos(spinAngle);
    var midX = cx + armPx * 0.5 * Math.cos(spinAngle) + perpX * 22;
    var midY = cy + armPx * 0.5 * Math.sin(spinAngle) + perpY * 22;
    drawHaloText('r = ' + wArm.toFixed(2) + ' m', midX, midY, {
      font: 'italic 700 12px "Cambria Math",serif', fill: '#f5c842'
    });
    ctx.restore();

    /* Force vector at handle end.
       Physics: wAngle is the angle between F and the lever arm.
       Direction (world frame): armDir + (90\u00B0 - wAngle) on the "pulling-down" side.
       That way wAngle=90\u00B0 \u2192 force \u22A5 arm (max torque); wAngle=0\u00B0 \u2192 force along arm. */
    var armDir = spinAngle;                       /* direction from bolt to handle end */
    var perpDir = armDir + Math.PI / 2;           /* perpendicular to arm */
    /* Blend: at \u03B8=90 force = perp; at \u03B8=0 force = along arm (pulling outward) */
    var thetaRad = degToRad(wAngle);
    /* Force pointing INTO handle (i.e., the user pulls the handle TOWARD the chosen direction).
       Easier visual: arrow starts away from handle end and ends AT handle end, showing the
       applied push direction. */
    var fDirX = Math.cos(armDir) * Math.cos(thetaRad) + Math.cos(perpDir) * Math.sin(thetaRad);
    var fDirY = Math.sin(armDir) * Math.cos(thetaRad) + Math.sin(perpDir) * Math.sin(thetaRad);
    var forceLen = clamp(wForce * 0.22, 36, 110);
    var fStartX = handleEndX - fDirX * forceLen;
    var fStartY = handleEndY - fDirY * forceLen;
    var fThick  = clamp(wForce * 0.02, 2.5, 6);
    /* Hand/grip dot at force application point */
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    withShadow(8, 0, 0, '#3ddc84', function () {
      ctx.beginPath(); ctx.arc(fStartX, fStartY, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    drawArrow(fStartX, fStartY, handleEndX, handleEndY, '#3ddc84', 14, fThick);
    /* Force label offset perpendicular */
    var fLabelX = fStartX - perpX * 16;
    var fLabelY = fStartY - perpY * 16;
    drawHaloText('F = ' + wForce + ' N', fLabelX, fLabelY, {
      font: '700 12px "Segoe UI",sans-serif', fill: '#3ddc84'
    });

    /* \u03B8 angle arc \u2014 between lever arm direction and force direction (at handle end) */
    if (wAngle > 1 && wAngle < 179) {
      ctx.save();
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
      var arcR2 = 30;
      /* Arc from arm direction (pointing back toward bolt, i.e. armDir+\u03C0) sweeping to force direction */
      var armBack = armDir + Math.PI;
      var forceDirAng = Math.atan2(-fDirY, -fDirX);  /* direction from handle end back to force start */
      ctx.beginPath();
      ctx.arc(handleEndX, handleEndY, arcR2, armBack, forceDirAng, true);
      ctx.stroke();
      var midA = (armBack + forceDirAng) / 2;
      drawHaloText('\u03B8 = ' + wAngle + '\u00B0',
        handleEndX + (arcR2 + 14) * Math.cos(midA),
        handleEndY + (arcR2 + 14) * Math.sin(midA),
        { font: 'italic 700 12px "Cambria Math",serif', fill: '#f5c842' });
      ctx.restore();
    }

    /* Torque arc around bolt \u2014 visualizes rotation direction (curved arrow) */
    var arcR = boltSize + 22;
    var arcStart = spinAngle - Math.PI * 0.65;
    var arcEnd   = spinAngle + Math.PI * (c.turns ? 0.85 : 0.3);
    drawCurvedArrow(cx, cy, arcR, arcStart, arcEnd, statusColor, 3, 14);
    drawHaloText('\u03C4', cx + (arcR + 18) * Math.cos(arcStart - 0.2),
                      cy + (arcR + 18) * Math.sin(arcStart - 0.2), {
      font: 'italic 700 18px "Cambria Math",serif', fill: statusColor
    });

    /* Badges (right side) */
    drawBadge(W - 178, 14, 168, 46, 'Applied \u03C4',   c.applied.toFixed(1) + ' N\u00B7m', statusColor);
    drawBadge(W - 178, 66, 168, 46, 'Required \u03C4',  c.required.toFixed(0) + ' N\u00B7m', '#f5c842');
    drawBadge(W - 178, 118, 168, 46, 'Moment arm', wArm.toFixed(2) + ' m', '#42a5f5');
    drawBadge(W - 178, 170, 168, 46, 'sin\u03B8',       Math.sin(thetaRad).toFixed(3), '#7dc8ff');

    /* Status banner */
    if (simDone || anim.running) {
      ctx.save();
      ctx.fillStyle = c.turns ? 'rgba(61,220,132,0.16)' : 'rgba(255,85,85,0.16)';
      ctx.beginPath(); ctx.roundRect(W / 2 - 120, H - 56, 240, 32, 8); ctx.fill();
      ctx.strokeStyle = statusColor; ctx.lineWidth = 1.5; ctx.stroke();
      drawHaloText(c.turns ? '\u2714  BOLT TIGHTENED' : '\u2718  WON\u2019T TURN', W / 2, H - 40, {
        font: '800 14px "Segoe UI",sans-serif', fill: statusColor
      });
      ctx.restore();
    }

    /* Equation on canvas (textbook style) */
    drawHaloText('\u03C4 = F \u00B7 r \u00B7 sin\u03B8', 30, 30, {
      font: 'italic 700 18px "Cambria Math",serif', fill: '#e6edf6', align: 'left'
    });
    drawHaloText('= ' + wForce + ' \u00D7 ' + wArm.toFixed(2) + ' \u00D7 ' + Math.sin(thetaRad).toFixed(2)
                 + ' = ' + c.applied.toFixed(1) + ' N\u00B7m',
                 30, 54, { font: '700 12px "JetBrains Mono",monospace', fill: '#8b9dc3', align: 'left' });
  }

  /* ================================================================
     DRAWING — SEESAW SCENARIO
     ================================================================ */
  function drawSeesaw() {
    var c = calcSeesaw();
    var pivotX = W / 2, pivotY = H * 0.66;
    var beamLen = 340;
    var angle = anim.seesawAngle;

    /* Ground with hatching */
    ctx.save();
    var grdG = ctx.createLinearGradient(0, pivotY + 60, 0, H);
    grdG.addColorStop(0, '#1d2336');
    grdG.addColorStop(1, '#0a0e16');
    ctx.fillStyle = grdG;
    ctx.fillRect(0, pivotY + 60, W, H - (pivotY + 60));
    ctx.strokeStyle = '#3a4258'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, pivotY + 60); ctx.lineTo(W, pivotY + 60); ctx.stroke();
    /* Hatching */
    ctx.strokeStyle = 'rgba(139,157,195,0.18)'; ctx.lineWidth = 1;
    for (var hx = 20; hx < W; hx += 18) {
      ctx.beginPath();
      ctx.moveTo(hx, pivotY + 60); ctx.lineTo(hx - 10, pivotY + 78);
      ctx.stroke();
    }
    ctx.restore();

    /* Beam shadow on ground */
    ctx.save();
    var shadowFade = 0.35 - Math.abs(angle) * 0.5;
    ctx.fillStyle = 'rgba(0,0,0,' + Math.max(0.1, shadowFade) + ')';
    ctx.beginPath();
    ctx.ellipse(pivotX, pivotY + 62, beamLen * 0.85, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Fulcrum \u2014 sturdy trapezoid + bolt */
    ctx.save();
    var fg = ctx.createLinearGradient(pivotX - 30, pivotY, pivotX + 30, pivotY + 60);
    fg.addColorStop(0, '#8d9bb8');
    fg.addColorStop(1, '#3a4258');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(pivotX - 6, pivotY - 4);
    ctx.lineTo(pivotX + 6, pivotY - 4);
    ctx.lineTo(pivotX + 38, pivotY + 60);
    ctx.lineTo(pivotX - 38, pivotY + 60);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#252a3a'; ctx.lineWidth = 1.5; ctx.stroke();
    /* Fulcrum bolt */
    ctx.fillStyle = '#f5c842';
    withShadow(8, 0, 2, 'rgba(245,200,66,0.6)', function () {
      ctx.beginPath(); ctx.arc(pivotX, pivotY - 2, 5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();

    /* Beam (wood plank look) */
    ctx.save();
    ctx.translate(pivotX, pivotY - 4);
    ctx.rotate(angle);
    var bH = 14;
    var bg = ctx.createLinearGradient(0, -bH / 2, 0, bH / 2);
    bg.addColorStop(0, '#a87456');
    bg.addColorStop(0.5, '#8d6e63');
    bg.addColorStop(1, '#5e4a3e');
    ctx.fillStyle = bg;
    withShadow(10, 0, 4, 'rgba(0,0,0,0.55)', function () {
      ctx.beginPath();
      ctx.roundRect(-beamLen, -bH / 2, beamLen * 2, bH, 4);
      ctx.fill();
    });
    /* Wood grain lines */
    ctx.strokeStyle = 'rgba(50,30,15,0.4)'; ctx.lineWidth = 0.6;
    for (var gx = -beamLen + 20; gx < beamLen; gx += 26) {
      ctx.beginPath();
      ctx.moveTo(gx, -bH / 2 + 2);
      ctx.bezierCurveTo(gx + 8, -2, gx + 14, 2, gx + 20, bH / 2 - 2);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(-beamLen, -bH / 2, beamLen * 2, bH);

    /* Distance markers along beam (every 0.5 m) */
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 0.8;
    for (var d = 0.5; d <= 3.0; d += 0.5) {
      var px = d / 3.0 * beamLen;
      [-px, px].forEach(function (xp) {
        ctx.beginPath(); ctx.moveTo(xp, -bH / 2); ctx.lineTo(xp, -bH / 2 + 3); ctx.stroke();
      });
    }

    /* People positions */
    var d1Px = clamp(sD1 / 3.0 * beamLen, 50, beamLen - 20);
    var d2Px = clamp(sD2 / 3.0 * beamLen, 50, beamLen - 20);

    /* Distance text below beam */
    drawHaloText('d\u2081 = ' + sD1.toFixed(1) + ' m', -d1Px, 24, {
      font: 'italic 700 11px "Cambria Math",serif', fill: '#3ddc84'
    });
    drawHaloText('d\u2082 = ' + sD2.toFixed(1) + ' m', d2Px, 24, {
      font: 'italic 700 11px "Cambria Math",serif', fill: '#ff5555'
    });

    /* Cartoon people */
    drawPerson(-d1Px, -bH / 2 + 1, sM1, '#3ddc84', '#0e3a20');
    drawPerson(d2Px, -bH / 2 + 1, sM2, '#ff5555', '#3a0e0e');

    /* Force arrows (weight vectors) */
    drawArrow(-d1Px, -bH / 2 - 70, -d1Px, -bH / 2 - 30, '#3ddc84', 8, 2);
    drawArrow(d2Px, -bH / 2 - 70, d2Px, -bH / 2 - 30, '#ff5555', 8, 2);

    /* Torque-direction indicators above each head — visible during Simulate.
       LEFT weight creates COUNTER-clockwise (CCW) moment about the pivot.
       RIGHT weight creates CLOCKWISE (CW) moment about the pivot.
       Drawn in the rotating beam frame so they tilt with the people. */
    if (anim.running || simDone) {
      var headTop = -bH / 2 - 92;      /* a bit above the head */
      var rArc = 22;
      ctx.save();
      ctx.globalAlpha = Math.min(1, anim.t * 2 + 0.2);

      /* LEFT — CCW: arc goes from a0 (right-bottom) to a1 (left-bottom) anticlockwise */
      drawCurvedArrow(-d1Px, headTop, rArc,
                      Math.PI * 0.25, -Math.PI * 1.25,   /* a0 > a1 → anticlockwise sweep */
                      '#3ddc84', 3, 13);
      drawHaloText('τ_L = ' + c.tauL.toFixed(0) + ' N·m',
                   -d1Px, headTop - rArc - 14, {
        font: 'italic 700 11px "Cambria Math",serif', fill: '#3ddc84'
      });
      drawHaloText('CCW ↺', -d1Px, headTop + rArc + 14, {
        font: '700 10px "Segoe UI",sans-serif', fill: '#3ddc84'
      });

      /* RIGHT — CW: arc from a0 (left) to a1 (right) clockwise (a0 < a1) */
      drawCurvedArrow(d2Px, headTop, rArc,
                      -Math.PI * 1.25, Math.PI * 0.25,
                      '#ff5555', 3, 13);
      drawHaloText('τ_R = ' + c.tauR.toFixed(0) + ' N·m',
                   d2Px, headTop - rArc - 14, {
        font: 'italic 700 11px "Cambria Math",serif', fill: '#ff5555'
      });
      drawHaloText('CW ↻', d2Px, headTop + rArc + 14, {
        font: '700 10px "Segoe UI",sans-serif', fill: '#ff5555'
      });

      ctx.restore();
    }

    ctx.restore();

    /* Badges */
    drawBadge(14, 14, 160, 46, '\u03C4 Left  (CCW)', c.tauL.toFixed(1) + ' N\u00B7m', '#3ddc84');
    drawBadge(14, 66, 160, 46, '\u03C4 Right (CW)', c.tauR.toFixed(1) + ' N\u00B7m', '#ff5555');
    drawBadge(W - 174, 14, 160, 46, 'm\u2081 \u00B7 d\u2081', (sM1 * sD1).toFixed(1) + ' kg\u00B7m', '#3ddc84');
    drawBadge(W - 174, 66, 160, 46, 'm\u2082 \u00B7 d\u2082', (sM2 * sD2).toFixed(1) + ' kg\u00B7m', '#ff5555');

    /* Status banner */
    var bColor = c.balanced ? '#3ddc84' : '#f5c842';
    ctx.save();
    ctx.fillStyle = c.balanced ? 'rgba(61,220,132,0.15)' : 'rgba(245,200,66,0.15)';
    ctx.beginPath(); ctx.roundRect(W / 2 - 110, 16, 220, 32, 8); ctx.fill();
    ctx.strokeStyle = bColor; ctx.lineWidth = 1.5; ctx.stroke();
    drawHaloText(c.balanced ? '\u2696  BALANCED' : c.tiltDir.toUpperCase(),
                 W / 2, 32, { font: '800 14px "Segoe UI",sans-serif', fill: bColor });
    ctx.restore();

    /* Equation */
    drawHaloText('\u03A3 \u03C4 = 0   \u2192   m\u2081 \u00B7 d\u2081 = m\u2082 \u00B7 d\u2082', W / 2, H - 18, {
      font: 'italic 700 14px "Cambria Math",serif', fill: '#e6edf6'
    });

    /* Drag hint (small, never obstructs) */
    drawHaloText('\u2194  Drag the figures along the beam to move them',
                 W / 2, H - 38, {
      font: '600 10px "Segoe UI",sans-serif', fill: '#8b9dc3'
    });
  }

  /* ================================================================
     DRAWING — SPINNING DISC SCENARIO
     ================================================================ */
  function drawDisc() {
    var c = calcDisc();
    var cx = W * 0.42, cy = H * 0.55;
    var discR = 120;
    var spinning = anim.running || simDone;

    /* Mounting shaft behind disc */
    ctx.save();
    var shaftG = ctx.createLinearGradient(cx - 18, cy, cx + 18, cy);
    shaftG.addColorStop(0, '#3a4258');
    shaftG.addColorStop(0.5, '#8d9bb8');
    shaftG.addColorStop(1, '#252a3a');
    ctx.fillStyle = shaftG;
    ctx.beginPath(); ctx.roundRect(cx - 18, cy - discR - 30, 36, discR * 2 + 60, 6); ctx.fill();
    ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    /* Motion blur trail when spinning fast */
    if (spinning && anim.t > 0.1) {
      ctx.save();
      ctx.globalAlpha = clamp(anim.t * 0.4, 0, 0.4);
      for (var b = 1; b <= 3; b++) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(anim.discAngle - b * 0.06);
        ctx.strokeStyle = 'rgba(66,165,245,' + (0.3 / b) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, discR * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    /* Draw shape with 3D-look radial gradient (G11) */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(anim.discAngle);
    var rg = ctx.createRadialGradient(-discR * 0.3, -discR * 0.3, discR * 0.1, 0, 0, discR);
    rg.addColorStop(0, '#7dc8ff');
    rg.addColorStop(0.45, '#42a5f5');
    rg.addColorStop(1, '#1565c0');

    if (discShape === 'ring') {
      /* Ring with shaded rim */
      withShadow(14, 0, 6, 'rgba(0,0,0,0.6)', function () {
        ctx.strokeStyle = 'rgba(66,165,245,0.2)'; ctx.lineWidth = 18;
        ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.strokeStyle = rg; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.stroke();
      /* Rim highlight + outline */
      ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, discR + 9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, discR - 9, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, discR + 4, -Math.PI * 0.85, -Math.PI * 0.3); ctx.stroke();
      /* Spin markers */
      for (var i = 0; i < 4; i++) {
        var a = Math.PI / 2 * i;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(discR * Math.cos(a), discR * Math.sin(a), 4, 0, Math.PI * 2); ctx.fill();
      }
    } else if (discShape === 'sphere') {
      /* Sphere \u2014 strong radial gradient + highlight */
      withShadow(20, 0, 8, 'rgba(0,0,0,0.65)', function () {
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.fill();
      });
      /* Specular highlight */
      var sg = ctx.createRadialGradient(-discR * 0.35, -discR * 0.4, 1, -discR * 0.35, -discR * 0.4, discR * 0.5);
      sg.addColorStop(0, 'rgba(255,255,255,0.55)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.fill();
      /* Equator + meridian */
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(0, 0, discR * 0.55, discR, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, discR, discR * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
      /* Outline */
      ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.stroke();
      for (var j = 0; j < 4; j++) {
        var a2 = Math.PI / 2 * j;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(discR * 0.7 * Math.cos(a2), discR * 0.7 * Math.sin(a2), 4, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      /* Solid disc */
      withShadow(18, 0, 7, 'rgba(0,0,0,0.6)', function () {
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.fill();
      });
      /* Highlight crescent */
      var hg = ctx.createLinearGradient(-discR, -discR, discR, discR);
      hg.addColorStop(0, 'rgba(255,255,255,0.45)');
      hg.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.fill();
      /* Outline */
      ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, discR, 0, Math.PI * 2); ctx.stroke();
      /* Spokes */
      ctx.strokeStyle = 'rgba(13,17,23,0.5)'; ctx.lineWidth = 3;
      for (var m = 0; m < 6; m++) {
        var a3 = Math.PI / 3 * m;
        ctx.beginPath();
        ctx.moveTo(discR * 0.1 * Math.cos(a3), discR * 0.1 * Math.sin(a3));
        ctx.lineTo(discR * 0.92 * Math.cos(a3), discR * 0.92 * Math.sin(a3));
        ctx.stroke();
      }
      /* Hub */
      var hubG = ctx.createRadialGradient(0, 0, 2, 0, 0, 18);
      hubG.addColorStop(0, '#fff');
      hubG.addColorStop(1, '#252a3a');
      ctx.fillStyle = hubG;
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    /* Torque arrow \u2014 large curved spiral with two arcs (G13) */
    drawCurvedArrow(cx, cy, discR + 24, -Math.PI * 0.7, Math.PI * 0.3, '#3ddc84', 4, 16);
    drawCurvedArrow(cx, cy, discR + 38, Math.PI * 0.35, Math.PI * 1.2, '#3ddc84', 3, 13);
    drawHaloText('\u03C4 = ' + dTorque.toFixed(1) + ' N\u00B7m', cx + discR + 50, cy - 6, {
      font: 'italic 700 14px "Cambria Math",serif', fill: '#3ddc84', align: 'left'
    });

    /* Shape label */
    var shapeLabel = discShape === 'disc' ? 'Solid Disc   I = \u00BDmr\u00B2' :
                     discShape === 'ring' ? 'Ring   I = mr\u00B2' :
                     'Solid Sphere   I = \u2156mr\u00B2';
    drawHaloText(shapeLabel, cx, 30, {
      font: 'italic 700 15px "Cambria Math",serif', fill: '#7dc8ff'
    });

    /* Ghost comparison cards \u2014 show other shapes \u03B1 (G12) */
    var k = getInertiaFactor();
    var alts = [
      { name: 'Disc',   sym: '\u00BDmr\u00B2', k: 0.5 },
      { name: 'Ring',   sym: 'mr\u00B2',  k: 1.0 },
      { name: 'Sphere', sym: '\u2156mr\u00B2', k: 0.4 }
    ];
    var cardY = 60;
    alts.forEach(function (alt, idx) {
      var altI = alt.k * dMass * dRadius * dRadius;
      var altA = dTorque / altI;
      var active = Math.abs(alt.k - k) < 0.01;
      var x0 = 14; var y0 = cardY + idx * 50;
      ctx.save();
      ctx.fillStyle = active ? 'rgba(125,200,255,0.18)' : 'rgba(13,17,30,0.7)';
      ctx.beginPath(); ctx.roundRect(x0, y0, 140, 42, 8); ctx.fill();
      ctx.strokeStyle = active ? '#7dc8ff' : 'rgba(139,157,195,0.2)';
      ctx.lineWidth = active ? 2 : 1; ctx.stroke();
      ctx.font = '700 10px "Segoe UI",sans-serif';
      ctx.fillStyle = active ? '#7dc8ff' : '#8b9dc3'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(alt.name + '  ' + alt.sym, x0 + 8, y0 + 5);
      ctx.font = '700 13px "JetBrains Mono",monospace';
      ctx.fillStyle = active ? '#7dc8ff' : '#e6edf6';
      ctx.fillText('\u03B1 = ' + altA.toFixed(1) + ' rad/s\u00B2', x0 + 8, y0 + 22);
      ctx.restore();
    });

    /* Badges */
    drawBadge(W - 178, 14, 168, 46, 'Inertia  I', c.I.toFixed(4) + ' kg\u00B7m\u00B2', '#42a5f5');
    drawBadge(W - 178, 66, 168, 46, 'Ang. accel \u03B1', c.alpha.toFixed(1) + ' rad/s\u00B2', '#f5c842');
    drawBadge(W - 178, 118, 168, 46, '\u03C9 (after 2s)', c.omega.toFixed(1) + ' rad/s', '#3ddc84');

    /* Equation */
    drawHaloText('\u03C4 = I \u03B1   \u2192   \u03B1 = \u03C4 / I = ' + dTorque + ' / ' + c.I.toFixed(4) + ' = ' + c.alpha.toFixed(1) + ' rad/s\u00B2',
                 W / 2, H - 18, { font: 'italic 700 13px "Cambria Math",serif', fill: '#e6edf6' });
  }

  /* ================================================================
     DRAWING — ROLLING RACE SCENARIO
     ================================================================ */
  function drawRolling() {
    var c = calcRolling();
    var theta = degToRad(rollAngle);

    /* Layout */
    var baseX = 80, baseY = H - 80;
    var rampLen = 620;
    var topX = baseX + rampLen * Math.cos(theta);
    var topY = baseY - rampLen * Math.sin(theta);

    /* Ground hatching */
    ctx.save();
    var grdG = ctx.createLinearGradient(0, baseY, 0, H);
    grdG.addColorStop(0, '#1d2336');
    grdG.addColorStop(1, '#0a0e16');
    ctx.fillStyle = grdG; ctx.fillRect(0, baseY, W, H - baseY);
    ctx.strokeStyle = '#3a4258'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, baseY); ctx.lineTo(W, baseY); ctx.stroke();
    ctx.strokeStyle = 'rgba(139,157,195,0.18)'; ctx.lineWidth = 1;
    for (var hxg = 20; hxg < W; hxg += 18) {
      ctx.beginPath();
      ctx.moveTo(hxg, baseY); ctx.lineTo(hxg - 10, baseY + 18);
      ctx.stroke();
    }
    ctx.restore();

    /* Ramp \u2014 wooden plank with shading */
    ctx.save();
    /* Wedge fill underneath */
    ctx.fillStyle = '#1a2034';
    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(topX, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(139,157,195,0.18)';
    ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(topX, topY); ctx.lineTo(topX, baseY); ctx.stroke();
    ctx.setLineDash([]);

    /* Plank along incline (rotated rectangle) */
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(-theta);
    var plankH = 14;
    var pg = ctx.createLinearGradient(0, -plankH, 0, 0);
    pg.addColorStop(0, '#a87456');
    pg.addColorStop(0.5, '#8d6e63');
    pg.addColorStop(1, '#5e4a3e');
    ctx.fillStyle = pg;
    withShadow(10, 0, 4, 'rgba(0,0,0,0.55)', function () {
      ctx.beginPath(); ctx.roundRect(0, -plankH, rampLen, plankH, 3); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
    ctx.strokeRect(0, -plankH, rampLen, plankH);
    /* Wood grain */
    ctx.strokeStyle = 'rgba(50,30,15,0.4)'; ctx.lineWidth = 0.6;
    for (var gxr = 25; gxr < rampLen; gxr += 32) {
      ctx.beginPath();
      ctx.moveTo(gxr, -plankH + 2);
      ctx.bezierCurveTo(gxr + 8, -2, gxr + 14, 2, gxr + 24, -2);
      ctx.stroke();
    }
    /* Finish line at bottom (start position is at top) */
    var fX = 8;
    ctx.fillStyle = '#fff';
    for (var ck = 0; ck < 4; ck++) {
      ctx.fillRect(fX + ck * 4, -plankH, 4, plankH);
    }
    ctx.fillStyle = '#000';
    for (var ck2 = 0; ck2 < 4; ck2++) {
      ctx.fillRect(fX + ck2 * 8, -plankH + (ck2 % 2 === 0 ? 0 : plankH / 2), 4, plankH / 2);
    }
    ctx.restore();
    ctx.restore();

    /* Angle arc */
    ctx.save();
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(baseX, baseY, 56, -theta, 0); ctx.stroke();
    drawHaloText(rollAngle + '\u00B0', baseX + 70, baseY - 14, {
      font: 'italic 700 13px "Cambria Math",serif', fill: '#f5c842', align: 'left'
    });
    ctx.restore();

    /* Shape data \u2014 3 shapes (G14) \u2014 racing from top to bottom */
    var shapes = [
      { name: 'Sphere',   color: '#7dc8ff', frac: anim.spherePos, a: c.aSphere, k: 0.4, lane: 0 },
      { name: 'Solid',    color: '#3ddc84', frac: anim.solidPos,  a: c.aSolid,  k: 0.5, lane: 1 },
      { name: 'Hollow',   color: '#ff5555', frac: anim.hollowPos, a: c.aHollow, k: 1.0, lane: 2 }
    ];
    var shapeR = 22;

    /* Lane spacing \u2014 perpendicular offset from ramp surface */
    var laneOffset = shapeR * 2.4;

    /* Helper: place shape at distance along ramp + lane offset */
    function placeOnRamp(dist, lane) {
      var rx = baseX + dist * Math.cos(theta);
      var ry = baseY - dist * Math.sin(theta);
      /* Perpendicular up from ramp surface */
      var px = -Math.sin(theta); var py = -Math.cos(theta);
      var off = shapeR + lane * laneOffset;
      return { x: rx + px * off, y: ry + py * off };
    }

    /* Draw each shape and its streak */
    shapes.forEach(function (s) {
      var dist = s.frac * (rampLen - 40) + 20;
      /* Start at top, roll down \u2192 at frac=0 \u2192 near top, frac=1 \u2192 near bottom */
      var distFromBottom = (rampLen - 40) - s.frac * (rampLen - 40) + 20;
      var pos = placeOnRamp(distFromBottom, s.lane);
      var sx = pos.x, sy = pos.y;
      var spin = s.frac * 18;

      /* Motion streak behind */
      if (s.frac > 0.05 && anim.running) {
        ctx.save();
        for (var sk = 1; sk <= 3; sk++) {
          var trailDist = distFromBottom + sk * 12;
          if (trailDist > rampLen - 20) continue;
          var trailPos = placeOnRamp(trailDist, s.lane);
          ctx.globalAlpha = 0.3 / sk;
          ctx.fillStyle = s.color;
          ctx.beginPath(); ctx.arc(trailPos.x, trailPos.y, shapeR * (1 - sk * 0.15), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      /* Shape body */
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(spin);

      var rg = ctx.createRadialGradient(-shapeR * 0.3, -shapeR * 0.3, 2, 0, 0, shapeR);
      if (s.name === 'Hollow') {
        /* Hollow ring */
        rg.addColorStop(0, '#ff9999');
        rg.addColorStop(1, '#7a1f1f');
        ctx.strokeStyle = rg; ctx.lineWidth = 6;
        withShadow(10, 0, 4, 'rgba(0,0,0,0.55)', function () {
          ctx.beginPath(); ctx.arc(0, 0, shapeR, 0, Math.PI * 2); ctx.stroke();
        });
        ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, shapeR + 3, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, shapeR - 3, 0, Math.PI * 2); ctx.stroke();
      } else if (s.name === 'Sphere') {
        rg.addColorStop(0, '#c5e8ff');
        rg.addColorStop(0.5, '#7dc8ff');
        rg.addColorStop(1, '#1c5a8a');
        withShadow(12, 0, 5, 'rgba(0,0,0,0.6)', function () {
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(0, 0, shapeR, 0, Math.PI * 2); ctx.fill();
        });
        /* Specular */
        var sgs = ctx.createRadialGradient(-shapeR * 0.4, -shapeR * 0.4, 0, -shapeR * 0.4, -shapeR * 0.4, shapeR * 0.5);
        sgs.addColorStop(0, 'rgba(255,255,255,0.6)');
        sgs.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sgs;
        ctx.beginPath(); ctx.arc(0, 0, shapeR, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, shapeR, 0, Math.PI * 2); ctx.stroke();
      } else {
        /* Solid cylinder */
        rg.addColorStop(0, '#a8f0c4');
        rg.addColorStop(0.5, '#3ddc84');
        rg.addColorStop(1, '#1a7848');
        withShadow(12, 0, 5, 'rgba(0,0,0,0.55)', function () {
          ctx.fillStyle = rg;
          ctx.beginPath(); ctx.arc(0, 0, shapeR, 0, Math.PI * 2); ctx.fill();
        });
        ctx.strokeStyle = '#0d1117'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, shapeR, 0, Math.PI * 2); ctx.stroke();
        /* Spokes */
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5;
        for (var sp = 0; sp < 4; sp++) {
          var ang = Math.PI / 2 * sp;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(shapeR * 0.9 * Math.cos(ang), shapeR * 0.9 * Math.sin(ang));
          ctx.stroke();
        }
      }
      /* Spin marker */
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(shapeR * 0.6, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      /* Label */
      drawHaloText(s.name, sx, sy - shapeR - 12, {
        font: '700 11px "Segoe UI",sans-serif', fill: s.color
      });
    });

    /* Race progress bar at top (G18) */
    var barX = W * 0.32, barY = 14, barW = 280;
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,30,0.85)';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, 60, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(139,157,195,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    drawHaloText('RACE PROGRESS', barX + 10, barY + 10, {
      font: '600 9px "Segoe UI",sans-serif', fill: '#8b9dc3', align: 'left', baseline: 'top'
    });
    shapes.forEach(function (s, i) {
      var ly = barY + 22 + i * 12;
      ctx.fillStyle = 'rgba(139,157,195,0.15)';
      ctx.beginPath(); ctx.roundRect(barX + 60, ly, barW - 75, 7, 3); ctx.fill();
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.roundRect(barX + 60, ly, (barW - 75) * s.frac, 7, 3); ctx.fill();
      ctx.font = '700 10px "Segoe UI",sans-serif';
      ctx.fillStyle = s.color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(s.name, barX + 10, ly + 4);
    });
    ctx.restore();

    /* Dynamic winner badge (G17) \u2014 sphere should always win when angle>0 */
    var winner = c.aSphere > c.aSolid ? 'Sphere' : c.aSolid > c.aHollow ? 'Solid' : 'Hollow';
    var winColor = winner === 'Sphere' ? '#7dc8ff' : winner === 'Solid' ? '#3ddc84' : '#ff5555';

    /* Badges */
    drawBadge(14, 90, 168, 42, 'a \u2014 Sphere',  c.aSphere.toFixed(2) + ' m/s\u00B2', '#7dc8ff');
    drawBadge(14, 138, 168, 42, 'a \u2014 Solid',  c.aSolid.toFixed(2) + ' m/s\u00B2', '#3ddc84');
    drawBadge(14, 186, 168, 42, 'a \u2014 Hollow', c.aHollow.toFixed(2) + ' m/s\u00B2', '#ff5555');
    drawBadge(W - 178, 90, 168, 56, '\u2605 Winner', winner, winColor);

    /* Equation */
    drawHaloText('a = g \u00B7 sin\u03B8 / (1 + I/mr\u00B2)', W / 2, H - 18, {
      font: 'italic 700 14px "Cambria Math",serif', fill: '#e6edf6'
    });
  }

  /* ================================================================
     DRAWING — EXPLORE MODE
     ================================================================ */
  function drawExploreCanvas() {
    var cats = CONCEPTS.filter(function (co) { return co.cat === selCat; });
    var c = cats[selConcept];
    if (!c) return;

    ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText(c.name, W / 2, 30);

    ctx.font = '700 16px "Courier New", monospace'; ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText(c.formula, W / 2, 60);

    /* Description wrap */
    ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#8b98b8'; ctx.textAlign = 'center';
    var words = c.desc.split(' ');
    var lines = []; var line = '';
    for (var i = 0; i < words.length; i++) {
      var test = line + words[i] + ' ';
      if (ctx.measureText(test).width > W - 80 && line.length > 0) {
        lines.push(line.trim());
        line = words[i] + ' ';
      } else {
        line = test;
      }
    }
    if (line.trim()) lines.push(line.trim());
    for (var j = 0; j < Math.min(lines.length, 6); j++) {
      ctx.fillText(lines[j], W / 2, 90 + j * 18);
    }

    /* Example box */
    if (c.example) {
      var exY = 240;
      ctx.fillStyle = 'rgba(66,165,245,0.08)';
      ctx.strokeStyle = 'rgba(66,165,245,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(40, exY, W - 80, 200, 8); ctx.fill(); ctx.stroke();

      ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'left';
      ctx.fillText('Worked Example', 60, exY + 20);
      ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0';
      ctx.fillText(c.example.problem, 60, exY + 40);

      ctx.font = '600 11px "Courier New", monospace'; ctx.fillStyle = '#8b98b8';
      for (var s = 0; s < c.example.steps.length; s++) {
        ctx.fillText(c.example.steps[s], 70, exY + 62 + s * 20);
      }
    }

    /* Unit */
    if (c.unit) {
      ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('Unit: ' + c.unit, W / 2, H - 15);
    }
  }

  /* ================================================================
     MAIN DRAW
     ================================================================ */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBgScene();

    if (mode === 'simulate') {
      switch (scenario) {
        case 'wrench': drawWrench(); break;
        case 'seesaw': drawSeesaw(); break;
        case 'disc': drawDisc(); break;
        case 'rolling': drawRolling(); break;
      }
    } else if (mode === 'explore') {
      drawExploreCanvas();
    } else {
      /* Practice / Quiz idle scene (G19) — richer composition */
      var cx = W / 2, cy = H / 2 - 30;
      /* Decorative spinning disc behind */
      var rg = ctx.createRadialGradient(cx - 50, cy + 50, 10, cx, cy + 60, 200);
      rg.addColorStop(0, 'rgba(125,200,255,0.18)');
      rg.addColorStop(1, 'rgba(125,200,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      /* Big hex bolt */
      drawHexBolt(cx - 90, cy + 60, 48, Math.PI * 0.05);
      /* Wrench tool angled */
      drawWrenchTool(cx - 90, cy + 60, 180, -Math.PI * 0.18, 28);
      drawHexBolt(cx - 90, cy + 60, 48, Math.PI * 0.05);

      drawHaloText('Torque & Rotational Motion', cx, cy - 60, {
        font: '800 22px "Segoe UI",sans-serif', fill: '#7dc8ff'
      });
      drawHaloText(mode === 'practice' ? 'Solve the problem below ↓' : 'Answer the quiz question below ↓',
                   cx, cy - 28, { font: '600 13px "Segoe UI",sans-serif', fill: '#8b9dc3' });
      drawHaloText('τ = F × r × sinθ', cx + 140, cy + 40, {
        font: 'italic 700 20px "Cambria Math",serif', fill: '#3ddc84'
      });
      drawHaloText('τ = I α', cx + 140, cy + 80, {
        font: 'italic 700 20px "Cambria Math",serif', fill: '#f5c842'
      });
    }
  }

  /* ================================================================
     READOUT UPDATE
     ================================================================ */
  function updateReadouts() {
    var l1 = $('r-label-1'), v1 = $('r-val-1'), u1 = $('r-unit-1');
    var l2 = $('r-label-2'), v2 = $('r-val-2'), u2 = $('r-unit-2');
    var l3 = $('r-label-3'), v3 = $('r-val-3'), u3 = $('r-unit-3');
    var l4 = $('r-label-4'), v4 = $('r-val-4'), u4 = $('r-unit-4');
    var l5 = $('r-label-5'), v5 = $('r-val-5'), u5 = $('r-unit-5');

    /* Helpers \u2014 split "value unit" \u2192 val and " unit" strings */
    function split(s) { var i = s.indexOf(' '); return i < 0 ? [s, ''] : [s.slice(0, i), s.slice(i)]; }
    /* Defensive: unit helpers exist only after unit-system block is initialized.
       Fall back to SI plain text on very first call. */
    var hasU = (typeof uTorque === 'function');

    if (scenario === 'wrench') {
      var cw = calcWrench();
      l1.textContent = 'Applied Torque';
      var a = hasU ? split(uTorque(cw.applied, 1)) : [cw.applied.toFixed(1), ' N\u00B7m'];
      v1.textContent = a[0]; u1.textContent = a[1];
      var b = hasU ? split(uTorque(cw.required, 1)) : [cw.required.toFixed(1), ' N\u00B7m'];
      l2.textContent = 'Required Torque'; v2.textContent = b[0]; u2.textContent = b[1];
      var c = hasU ? split(uLengthShort(wArm, 2)) : [wArm.toFixed(2), ' m'];
      l3.textContent = 'Moment Arm'; v3.textContent = c[0]; u3.textContent = c[1];
      l4.textContent = 'sin \u03B8'; v4.textContent = Math.sin(degToRad(wAngle)).toFixed(3); u4.textContent = '';
      l5.textContent = 'Status';
      if (cw.turns) { v5.textContent = 'TURNS'; v5.style.color = '#3ddc84'; }
      else { v5.textContent = "WON'T TURN"; v5.style.color = '#ff5555'; }
      u5.textContent = '';
    } else if (scenario === 'seesaw') {
      var cs = calcSeesaw();
      var d1 = hasU ? split(uTorque(cs.tauL, 1)) : [cs.tauL.toFixed(1), ' N\u00B7m'];
      var d2 = hasU ? split(uTorque(cs.tauR, 1)) : [cs.tauR.toFixed(1), ' N\u00B7m'];
      l1.textContent = 'Torque Left';  v1.textContent = d1[0]; u1.textContent = d1[1];
      l2.textContent = 'Torque Right'; v2.textContent = d2[0]; u2.textContent = d2[1];
      var e1 = hasU ? split(uMassMoment(sM1 * sD1, 1)) : [(sM1 * sD1).toFixed(1), ' kg\u00B7m'];
      var e2 = hasU ? split(uMassMoment(sM2 * sD2, 1)) : [(sM2 * sD2).toFixed(1), ' kg\u00B7m'];
      l3.textContent = 'm\u2081 \u00D7 d\u2081'; v3.textContent = e1[0]; u3.textContent = e1[1];
      l4.textContent = 'm\u2082 \u00D7 d\u2082'; v4.textContent = e2[0]; u4.textContent = e2[1];
      l5.textContent = 'Status'; v5.textContent = cs.tiltDir; u5.textContent = '';
      v5.style.color = cs.balanced ? '#3ddc84' : '#f5c842';
    } else if (scenario === 'disc') {
      var cd = calcDisc();
      var e1 = hasU ? split(uInertia(cd.I, 4)) : [cd.I.toFixed(4), ' kg\u00B7m\u00B2'];
      var e2 = hasU ? split(uTorque(dTorque, 1)) : [dTorque.toFixed(1), ' N\u00B7m'];
      l1.textContent = 'Inertia I'; v1.textContent = e1[0]; u1.textContent = e1[1];
      l2.textContent = 'Ang. Accel \u03B1'; v2.textContent = cd.alpha.toFixed(1); u2.textContent = ' rad/s\u00B2';
      l3.textContent = 'Torque \u03C4'; v3.textContent = e2[0]; u3.textContent = e2[1];
      l4.textContent = 'Final \u03C9 (2 s)'; v4.textContent = cd.omega.toFixed(1); u4.textContent = ' rad/s';
      var shapeNames = { disc: 'Solid Disc', ring: 'Ring', sphere: 'Sphere' };
      l5.textContent = 'Shape'; v5.textContent = shapeNames[discShape]; u5.textContent = '';
      v5.style.color = '#42a5f5';
    } else if (scenario === 'rolling') {
      var cr = calcRolling();
      var f1 = hasU ? split(uAccel(cr.aSphere, 2)) : [cr.aSphere.toFixed(2), ' m/s\u00B2'];
      var f2 = hasU ? split(uAccel(cr.aSolid, 2))  : [cr.aSolid.toFixed(2),  ' m/s\u00B2'];
      var f3 = hasU ? split(uAccel(cr.aHollow, 2)) : [cr.aHollow.toFixed(2), ' m/s\u00B2'];
      l1.textContent = 'a \u2014 Sphere'; v1.textContent = f1[0]; u1.textContent = f1[1];
      l2.textContent = 'a \u2014 Solid';  v2.textContent = f2[0]; u2.textContent = f2[1];
      l3.textContent = 'a \u2014 Hollow'; v3.textContent = f3[0]; u3.textContent = f3[1];
      l4.textContent = 'Angle'; v4.textContent = rollAngle; u4.textContent = '\u00B0';
      var winner = cr.aSphere >= cr.aSolid && cr.aSphere >= cr.aHollow ? 'Sphere'
                 : cr.aSolid  >= cr.aHollow ? 'Solid' : 'Hollow';
      var winColor = winner === 'Sphere' ? '#7dc8ff' : winner === 'Solid' ? '#3ddc84' : '#ff5555';
      l5.textContent = 'Winner'; v5.textContent = winner; u5.textContent = '';
      v5.style.color = winColor;
    }
  }

  /* ================================================================
     ANIMATION
     ================================================================ */
  function startSim() {
    if (anim.running || simDone) return;
    anim.running = true;
    anim.startTime = performance.now();
    anim.t = 0;
    var btn = $('btn-play');
    var status = $('play-status');
    btn.classList.add('playing');
    btn.innerHTML = '<span class="play-icon">&#9654;</span> Running...';

    if (scenario === 'wrench') {
      var cw = calcWrench();
      if (cw.turns) {
        status.textContent = '\u03C4 = ' + cw.applied.toFixed(1) + ' \u2265 ' + cw.required + ' N\u00B7m \u2014 bolt turns!';
        status.className = 'play-status active';
      } else {
        status.textContent = '\u03C4 = ' + cw.applied.toFixed(1) + ' < ' + cw.required + ' N\u00B7m \u2014 insufficient torque';
        status.className = 'play-status fail';
      }
    } else if (scenario === 'seesaw') {
      var cs = calcSeesaw();
      status.textContent = '\u03C4\u2097=' + cs.tauL.toFixed(1) + ' vs \u03C4\u1D63=' + cs.tauR.toFixed(1) + ' \u2014 ' + cs.tiltDir;
      status.className = 'play-status active';
    } else if (scenario === 'disc') {
      var cd = calcDisc();
      status.textContent = '\u03B1 = ' + cd.alpha.toFixed(1) + ' rad/s\u00B2, \u03C9 after 2s = ' + cd.omega.toFixed(1) + ' rad/s';
      status.className = 'play-status active';
    } else if (scenario === 'rolling') {
      var cr = calcRolling();
      status.textContent = 'Sphere ' + cr.aSphere.toFixed(2) + '  Solid ' + cr.aSolid.toFixed(2) + '  Hollow ' + cr.aHollow.toFixed(2) + ' m/s\u00B2 \u2014 Sphere wins!';
      status.className = 'play-status active';
    }

    animFrame = requestAnimationFrame(simLoop);
  }

  function simLoop() {
    if (!anim.running) return;
    var elapsed = (performance.now() - anim.startTime) / 1000;
    var duration = 2.5;
    anim.t = Math.min(elapsed / duration, 1);
    var e = easeOut(anim.t);

    if (scenario === 'wrench') {
      var cw = calcWrench();
      if (cw.turns) {
        anim.boltAngle = e * Math.PI;
      } else {
        /* Shake animation */
        var shake = Math.sin(anim.t * 30) * 0.08 * (1 - anim.t);
        anim.boltAngle = shake;
      }
    } else if (scenario === 'seesaw') {
      var cs = calcSeesaw();
      if (cs.balanced) {
        anim.seesawAngle = 0;
      } else {
        /* tL > tR → heavier left → left side must DIP DOWN.
           On a canvas (y-axis pointing down) that means rotating COUNTER-
           clockwise, i.e. a NEGATIVE rotation. So negate the imbalance. */
        var imbalance = (cs.tauL - cs.tauR) / Math.max(cs.tauL, cs.tauR);
        var maxTilt = clamp(imbalance * 0.5, -0.35, 0.35);
        anim.seesawAngle = -e * maxTilt;
      }
    } else if (scenario === 'disc') {
      var cd = calcDisc();
      /* Spin-up from rest: theta = 1/2 alpha t^2, so the simulated clock must be
         LINEAR in real time. Feeding the eased progress in made the disc sweep
         most of its angle immediately and then crawl. */
      var tSim = anim.t * 2;
      anim.discAngle = 0.5 * cd.alpha * tSim * tSim;
    } else if (scenario === 'rolling') {
      /* Sphere fastest, then solid cylinder, then hollow cylinder.

         All three are released from rest under constant acceleration, so the
         distance travelled goes as t^2 — they start slow and speed up. The
         positions used to be driven by easeOut(t), which starts FAST and
         decelerates: at a tenth of the way through the run the animated body
         had already covered 27% of the ramp where the real one covers 1%. The
         race finished in the right order, but every body visibly slowed down
         while rolling downhill.

         Using t^2 gives the correct accelerating motion, and because all three
         share the same clock the instantaneous separation between them still
         reflects the true acceleration ratios. */
      var cr = calcRolling();
      var p = anim.t * anim.t;
      anim.spherePos = Math.min(p, 1);
      anim.solidPos  = Math.min(p * (cr.aSolid  / cr.aSphere), 1);
      anim.hollowPos = Math.min(p * (cr.aHollow / cr.aSphere), 1);
    }

    draw();

    if (anim.t < 1) {
      animFrame = requestAnimationFrame(simLoop);
    } else {
      anim.running = false;
      simDone = true;
      var btn = $('btn-play');
      btn.classList.remove('playing');
      btn.innerHTML = '<span class="play-icon">\u2714</span> Done';
    }
  }

  function resetSim() {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    anim.running = false; anim.t = 0; simDone = false;
    anim.boltAngle = 0; anim.seesawAngle = 0; anim.discAngle = 0;
    anim.solidPos = 0; anim.hollowPos = 0; anim.spherePos = 0;
    var btn = $('btn-play');
    if (btn) { btn.classList.remove('playing'); btn.innerHTML = '<span class="play-icon">&#9654;</span> Simulate'; }
    var status = $('play-status');
    if (status) { status.textContent = 'Set up variables, then press Simulate'; status.className = 'play-status'; }
    updateReadouts();
    draw();
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;
    $$('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === m); });
    var simEls = [$('sim-panel')];
    var expEls = [$('cat-row'), $('item-selector'), $('item-info')];
    var pracEls = [$('practice-panel'), $('practice-bar')];
    var quizEls = [$('quiz-panel'), $('quiz-bar'), $('quiz-result')];
    simEls.forEach(function (el) { m === 'simulate' ? show(el) : hide(el); });
    expEls.forEach(function (el) { m === 'explore' ? show(el) : hide(el); });
    pracEls.forEach(function (el) { m === 'practice' ? show(el) : hide(el); });
    quizEls.forEach(function (el) { m === 'quiz' ? show(el) : hide(el); });

    if (m === 'explore') { buildExploreGrid(); showConceptInfo(); }
    if (m === 'practice') { genPractice(); }
    if (m === 'quiz') { startQuiz(); }
    if (m === 'simulate') { resetSim(); }
    draw();
  }

  /* ================================================================
     SCENARIO SWITCHING
     ================================================================ */
  function setScenario(s) {
    scenario = s;
    $$('#scenario-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.scenario === s); });

    /* Show/hide rows */
    var wrenchRows = [$('wrench-row-1'), $('wrench-row-2'), $('bolt-row')];
    var seesawRows = [$('seesaw-row-1'), $('seesaw-row-2'), $('seesaw-preset-row')];
    var discRows = [$('disc-row-1'), $('disc-row-2'), $('disc-shape-row'), $('disc-preset-row')];
    var rollingRows = [$('rolling-row-1'), $('rolling-preset-row')];

    wrenchRows.forEach(function (el) { s === 'wrench' ? show(el) : hide(el); });
    seesawRows.forEach(function (el) { s === 'seesaw' ? show(el) : hide(el); });
    discRows.forEach(function (el) { s === 'disc' ? show(el) : hide(el); });
    rollingRows.forEach(function (el) { s === 'rolling' ? show(el) : hide(el); });

    resetSim();
    if (typeof updateLearnPanels === 'function') updateLearnPanels();
  }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  function buildExploreGrid() {
    var grid = $('concept-grid');
    grid.innerHTML = '';
    var cats = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    cats.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (i === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () { selConcept = i; buildExploreGrid(); showConceptInfo(); draw(); });
      grid.appendChild(btn);
    });
  }

  function showConceptInfo() {
    var cats = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    var c = cats[selConcept];
    if (!c) return;
    var info = $('item-info');
    show(info);
    info.innerHTML =
      '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat.replace(/-/g, ' ') + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">Unit: ' + c.unit + '</span></div>' +
      '<div class="example-box"><h4>Worked Example</h4>' +
      '<p class="ex-problem">' + c.example.problem + '</p>' +
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s.replace(/= ([\d.]+)/g, '= <strong>$1</strong>') + '</p>'; }).join('') +
      '</div>';
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function genPractice() {
    var gen = PRACTICE[randInt(0, PRACTICE.length - 1)];
    pProblem = gen();
    pAnswered = false;
    $('pp-prompt').textContent = pProblem.prompt;
    $('pp-unit').textContent = pProblem.unit;
    $('pp-input').value = '';
    $('pp-feedback').textContent = '';
    $('pp-feedback').className = 'feedback';
    hide($('pp-solution'));
    hide($('pp-next'));
    show($('pp-check'));
    draw();
  }

  function checkPractice() {
    if (pAnswered) return;
    var ans = parseFloat($('pp-input').value);
    if (isNaN(ans)) { $('pp-feedback').textContent = 'Enter a number'; $('pp-feedback').className = 'feedback err'; return; }
    pAnswered = true; pTotal++;
    var tol = Math.max(Math.abs(pProblem.answer) * 0.02, 0.1);
    if (Math.abs(ans - pProblem.answer) <= tol) {
      pScore++;
      $('pp-feedback').textContent = 'Correct!';
      $('pp-feedback').className = 'feedback ok';
    } else {
      $('pp-feedback').textContent = 'Incorrect. Answer: ' + pProblem.answer + ' ' + pProblem.unit;
      $('pp-feedback').className = 'feedback err';
    }
    $('pbar-score-val').textContent = pScore + ' / ' + pTotal;
    var sol = $('pp-solution');
    show(sol);
    sol.innerHTML = '<h4>Solution</h4>' + pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([\d.\-]+)/g, '= <strong>$1</strong>') + '</p>'; }).join('');
    hide($('pp-check'));
    show($('pp-next'));
  }

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    var pool = shuffleArr(QUIZ_POOL);
    quizQs = pool.slice(0, 5);
    quizIdx = 0; quizScore = 0; quizAnswered = false;
    quizCorrectFlags = [];
    hide($('quiz-result'));
    show($('quiz-panel'));
    show($('quiz-bar'));
    renderQuiz();
    draw();
  }

  function renderQuiz() {
    var q = quizQs[quizIdx];
    var panel = $('quiz-panel');
    $('qbar-num').textContent = quizIdx + 1;

    if (q.type === 'mcq') {
      var opts = q.options.slice();
      var correctText = opts[q.correct];
      opts = shuffleArr(opts);
      var html = '<p class="qp-prompt">' + q.prompt + '</p><div class="answer-grid">';
      opts.forEach(function (o) {
        html += '<button class="answer-btn" data-val="' + o + '">' + o + '</button>';
      });
      html += '</div><p class="quiz-feedback" id="q-fb"></p>';
      panel.innerHTML = html;
      panel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var correct = btn.dataset.val === correctText;
          if (correct) quizScore++;
          quizCorrectFlags.push(correct);
          panel.querySelectorAll('.answer-btn').forEach(function (b) {
            b.classList.add('locked');
            if (b.dataset.val === correctText) b.classList.add('correct');
            else if (b === btn && !correct) b.classList.add('wrong');
          });
          $('q-fb').textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + correctText;
          $('q-fb').className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
          setTimeout(nextQuiz, 1200);
        });
      });
    } else {
      var html2 = '<p class="qp-prompt">' + q.prompt + '</p>' +
        '<div class="quiz-input-row"><input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer"><span class="qi-unit">' + q.unit + '</span>' +
        '<button class="btn btn-primary" id="qi-check">Submit</button></div>' +
        '<p class="quiz-feedback" id="q-fb"></p>';
      panel.innerHTML = html2;
      $('qi-check').addEventListener('click', function () {
        if (quizAnswered) return;
        var ans = parseFloat($('qi-input').value);
        if (isNaN(ans)) return;
        quizAnswered = true;
        var tol = Math.max(Math.abs(q.answer) * 0.02, 0.1);
        var correct = Math.abs(ans - q.answer) <= tol;
        if (correct) quizScore++;
        quizCorrectFlags.push(correct);
        $('q-fb').textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.answer + ' ' + q.unit;
        $('q-fb').className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
        if (q.steps) {
          var stepsHtml = '<div class="solution-panel"><h4>Solution</h4>' + q.steps.map(function (s) { return '<p class="sol-step">' + s + '</p>'; }).join('') + '</div>';
          panel.insertAdjacentHTML('beforeend', stepsHtml);
        }
        setTimeout(nextQuiz, 1800);
      });
    }
  }

  function nextQuiz() {
    quizIdx++;
    quizAnswered = false;
    if (quizIdx >= quizQs.length) { showQuizResult(); return; }
    renderQuiz();
  }

  function showQuizResult() {
    hide($('quiz-panel'));
    hide($('quiz-bar'));
    var res = $('quiz-result');
    show(res);
    var pct = Math.round(quizScore / quizQs.length * 100);
    var stars = '';
    for (var i = 0; i < 5; i++) stars += i < quizScore ? '\u2605' : '\u2606';
    var cls = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';
    var verdict = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Great job!' : pct >= 60 ? 'Good effort!' : 'Keep practising!';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + pct + '%</span><span class="qr-verdict">' + verdict + '</span></div></div>';
    html += '<div class="qr-rows">';
    quizQs.forEach(function (q, i) {
      var correct = quizCorrectFlags[i];
      html += '<div class="qr-row ' + (correct ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span>' +
        '<span class="qr-detail">' + q.prompt.substring(0, 60) + (q.prompt.length > 60 ? '...' : '') + '</span>' +
        '<span class="qr-mark">' + (correct ? '\u2713' : '\u2717') + '</span></div>';
    });
    html += '</div>';
    html += '<button class="btn btn-primary" id="quiz-retry">Retry Quiz</button>';
    res.innerHTML = html;
    $('quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     EVENT LISTENERS
     ================================================================ */

  /* Mode tabs */
  $$('#mode-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () { setMode(p.dataset.mode); });
  });

  /* Scenario tabs */
  $$('#scenario-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () { setScenario(p.dataset.scenario); });
  });

  /* Explore category tabs */
  $$('#cat-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      selCat = p.dataset.cat;
      selConcept = 0;
      $$('#cat-tabs .pill').forEach(function (b) { b.classList.toggle('active', b === p); });
      buildExploreGrid(); showConceptInfo(); draw();
    });
  });

  /* Shape tabs for disc scenario */
  $$('#shape-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      discShape = p.dataset.shape;
      $$('#shape-tabs .pill').forEach(function (b) { b.classList.toggle('active', b === p); });
      if (anim.running || simDone) resetSim();
      updateReadouts(); draw();
    });
  });

  /* Bolt presets */
  $$('.bolt-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.bolt-preset').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      wBoltReq = parseInt(btn.dataset.torque);
      if (anim.running || simDone) resetSim();
      updateReadouts(); draw();
    });
  });

  /* Slider bindings */
  function bindSlider(id, setter, valId, suffix) {
    var sl = document.getElementById(id);
    if (!sl) return;
    sl.addEventListener('input', function () {
      setter(sl.value);
      document.getElementById(valId).textContent = sl.value + suffix;
      if (anim.running || simDone) resetSim();
      else { updateReadouts(); draw(); }
    });
  }

  /* Wrench sliders */
  bindSlider('sl-force', function (v) { wForce = parseInt(v); }, 'val-force', ' N');
  bindSlider('sl-arm', function (v) { wArm = parseFloat(v); }, 'val-arm', ' m');
  bindSlider('sl-angle', function (v) { wAngle = parseInt(v); }, 'val-angle', '\u00B0');

  /* Seesaw sliders */
  bindSlider('sl-m1', function (v) { sM1 = parseInt(v); }, 'val-m1', ' kg');
  bindSlider('sl-d1', function (v) { sD1 = parseFloat(v); }, 'val-d1', ' m');
  bindSlider('sl-m2', function (v) { sM2 = parseInt(v); }, 'val-m2', ' kg');
  bindSlider('sl-d2', function (v) { sD2 = parseFloat(v); }, 'val-d2', ' m');

  /* Disc sliders */
  bindSlider('sl-torque', function (v) { dTorque = parseFloat(v); }, 'val-torque', ' N\u00B7m');
  bindSlider('sl-disc-mass', function (v) { dMass = parseFloat(v); }, 'val-disc-mass', ' kg');
  bindSlider('sl-radius', function (v) { dRadius = parseFloat(v); }, 'val-radius', ' m');

  /* Rolling slider */
  bindSlider('sl-roll-angle', function (v) { rollAngle = parseInt(v); }, 'val-roll-angle', '\u00B0');

  /* Practice buttons */
  $('pp-check').addEventListener('click', checkPractice);
  $('pp-next').addEventListener('click', genPractice);
  $('pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { if (pAnswered) genPractice(); else checkPractice(); }
  });

  /* Play / Reset buttons */
  $('btn-play').addEventListener('click', function () {
    if (anim.running || simDone) { resetSim(); } else { startSim(); }
  });
  $('btn-reset').addEventListener('click', function () { resetSim(); });

  /* ================================================================
     CANVAS DRAG INTERACTION — Seesaw weights (click & drag people)
     ================================================================ */
  var SEESAW_PIVOT_X = W / 2;
  var SEESAW_PIVOT_Y = H * 0.66 - 4;
  var SEESAW_BEAM_LEN = 340;
  var dragState = { target: null };   /* 'm1' | 'm2' | null */

  function canvasPoint(e) {
    var rect = cvs.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width  * W,
      y: (e.clientY - rect.top)  / rect.height * H
    };
  }

  /* Inverse-transform a canvas point into the rotating beam's local frame */
  function beamLocal(pt) {
    var dx = pt.x - SEESAW_PIVOT_X;
    var dy = pt.y - SEESAW_PIVOT_Y;
    var ang = anim.seesawAngle || 0;
    return {
      x:  dx * Math.cos(ang) + dy * Math.sin(ang),
      y: -dx * Math.sin(ang) + dy * Math.cos(ang)
    };
  }

  /* Returns 'm1', 'm2' or null based on whether pt lands on a person figure */
  function hitTestSeesaw(pt) {
    var local = beamLocal(pt);
    /* People sit ABOVE the beam top (local.y negative). Generous box: */
    if (local.y < -85 || local.y > 14) return null;
    var d1Px = clamp(sD1 / 3.0 * SEESAW_BEAM_LEN, 50, SEESAW_BEAM_LEN - 20);
    var d2Px = clamp(sD2 / 3.0 * SEESAW_BEAM_LEN, 50, SEESAW_BEAM_LEN - 20);
    /* 38 px half-width gives easy touch targets on mobile */
    if (Math.abs(local.x + d1Px) < 38) return 'm1';
    if (Math.abs(local.x - d2Px) < 38) return 'm2';
    return null;
  }

  function applyDragDistance(target, beamX) {
    /* beamX is local x relative to pivot; sign tells which side */
    var raw = Math.abs(beamX) * 3.0 / SEESAW_BEAM_LEN;
    var d = clamp(Math.round(raw * 10) / 10, 0.5, 3.0);   /* snap to 0.1 m (slider step) */
    if (target === 'm1') {
      sD1 = d;
      var sl1 = $('sl-d1'); if (sl1) sl1.value = d;
      var v1  = $('val-d1'); if (v1) v1.textContent = d.toFixed(1) + ' m';
    } else if (target === 'm2') {
      sD2 = d;
      var sl2 = $('sl-d2'); if (sl2) sl2.value = d;
      var v2  = $('val-d2'); if (v2) v2.textContent = d.toFixed(1) + ' m';
    }
  }

  cvs.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate' || scenario !== 'seesaw') {
      e.preventDefault();
      return;
    }
    var pt = canvasPoint(e);
    var hit = hitTestSeesaw(pt);
    if (!hit) { e.preventDefault(); return; }
    e.preventDefault();
    /* If a previous simulation finished, drag should reset it like the sliders do */
    if (anim.running || simDone) resetSim();
    try { cvs.setPointerCapture(e.pointerId); } catch (_) {}
    dragState.target = hit;
    cvs.style.cursor = 'grabbing';
    /* Apply immediately so first click pulls the person to the cursor */
    var local = beamLocal(pt);
    applyDragDistance(hit, local.x);
    updateReadouts();
    draw();
  });

  cvs.addEventListener('pointermove', function (e) {
    if (mode !== 'simulate' || scenario !== 'seesaw') return;
    var pt = canvasPoint(e);
    if (dragState.target) {
      var local = beamLocal(pt);
      applyDragDistance(dragState.target, local.x);
      updateReadouts();
      if (typeof syncStepperInputs === 'function') syncStepperInputs();
      if (typeof updateLearnPanels === 'function') updateLearnPanels();
      /* Slider visual sync */
      var sl1 = document.getElementById('sl-d1'), sl2 = document.getElementById('sl-d2');
      if (sl1) sl1.value = sD1;
      if (sl2) sl2.value = sD2;
      draw();
    } else {
      /* Hover cursor feedback */
      var hit = hitTestSeesaw(pt);
      cvs.style.cursor = hit ? 'grab' : 'pointer';
    }
  });

  function endDrag(e) {
    if (dragState.target) {
      try { cvs.releasePointerCapture(e.pointerId); } catch (_) {}
      dragState.target = null;
      cvs.style.cursor = 'pointer';
    }
  }
  cvs.addEventListener('pointerup', endDrag);
  cvs.addEventListener('pointercancel', endDrag);
  cvs.addEventListener('pointerleave', endDrag);

  /* ================================================================
     SI / IMPERIAL UNIT SYSTEM
     Internal state stays in SI. Displays convert on the fly.
     ================================================================ */
  var unitSys = 'si';
  var UC = {
    /* Conversion factors (SI -> Imperial) */
    N_to_lbf:   0.224809,
    Nm_to_ftlbf: 0.737562,
    m_to_ft:    3.28084,
    m_to_in:    39.3701,
    kg_to_lb:   2.20462,
    msq_to_ftsq: 10.7639,
    kgm2_to_lbft2: 23.7304
  };
  function isImp() { return unitSys === 'imp'; }
  function uForce(siN, digits) {
    return isImp()
      ? (siN * UC.N_to_lbf).toFixed(digits == null ? 1 : digits) + ' lbf'
      : siN.toFixed(digits == null ? 1 : digits) + ' N';
  }
  function uTorque(siNm, digits) {
    return isImp()
      ? (siNm * UC.Nm_to_ftlbf).toFixed(digits == null ? 1 : digits) + ' ft·lbf'
      : siNm.toFixed(digits == null ? 1 : digits) + ' N·m';
  }
  function uLength(siM, digits) {
    return isImp()
      ? (siM * UC.m_to_ft).toFixed(digits == null ? 2 : digits) + ' ft'
      : siM.toFixed(digits == null ? 2 : digits) + ' m';
  }
  function uLengthShort(siM, digits) {
    return isImp()
      ? (siM * UC.m_to_in).toFixed(digits == null ? 1 : digits) + ' in'
      : siM.toFixed(digits == null ? 2 : digits) + ' m';
  }
  function uMass(siKg, digits) {
    return isImp()
      ? (siKg * UC.kg_to_lb).toFixed(digits == null ? 1 : digits) + ' lb'
      : siKg.toFixed(digits == null ? 1 : digits) + ' kg';
  }
  function uInertia(siKgM2, digits) {
    return isImp()
      ? (siKgM2 * UC.kgm2_to_lbft2).toFixed(digits == null ? 3 : digits) + ' lb·ft²'
      : siKgM2.toFixed(digits == null ? 3 : digits) + ' kg·m²';
  }
  /* Mass-moment m×d shown on the seesaw cards (kg·m → lb·ft). */
  function uMassMoment(siKgM, digits) {
    return isImp()
      ? (siKgM * UC.kg_to_lb * UC.m_to_ft).toFixed(digits == null ? 1 : digits) + ' lb·ft'
      : siKgM.toFixed(digits == null ? 1 : digits) + ' kg·m';
  }
  function uAccel(siMsq, digits) {
    return isImp()
      ? (siMsq * UC.m_to_ft).toFixed(digits == null ? 2 : digits) + ' ft/s²'
      : siMsq.toFixed(digits == null ? 2 : digits) + ' m/s²';
  }
  /* Update inline unit labels in slider rows */
  function updateUnitLabels() {
    $$('.sim-unit').forEach(function (el) {
      var k = el.dataset.unit;
      if (!k) return;
      var map = isImp() ? {
        force: 'lbf', torque: 'ft·lbf',
        length: 'ft', 'length-s': 'in',
        mass: 'lb'
      } : {
        force: 'N', torque: 'N·m',
        length: 'm', 'length-s': 'm',
        mass: 'kg'
      };
      if (map[k]) el.innerHTML = map[k].replace('·', '&middot;');
    });
  }
  /* Convert stepper input values when switching units; keep SI internally */
  function syncStepperInputs() {
    /* Just refresh display from the underlying SI state vars */
    var n = function (id) { return document.getElementById(id); };
    if (n('val-force')) n('val-force').value = isImp() ? (wForce * UC.N_to_lbf).toFixed(1) : wForce;
    if (n('val-arm'))   n('val-arm').value   = isImp() ? (wArm * UC.m_to_in).toFixed(1) : wArm;
    if (n('val-angle')) n('val-angle').value = wAngle;
    if (n('val-m1'))    n('val-m1').value    = isImp() ? (sM1 * UC.kg_to_lb).toFixed(1) : sM1;
    if (n('val-d1'))    n('val-d1').value    = isImp() ? (sD1 * UC.m_to_ft).toFixed(2) : sD1;
    if (n('val-m2'))    n('val-m2').value    = isImp() ? (sM2 * UC.kg_to_lb).toFixed(1) : sM2;
    if (n('val-d2'))    n('val-d2').value    = isImp() ? (sD2 * UC.m_to_ft).toFixed(2) : sD2;
    if (n('val-torque'))    n('val-torque').value    = isImp() ? (dTorque * UC.Nm_to_ftlbf).toFixed(1) : dTorque;
    if (n('val-disc-mass')) n('val-disc-mass').value = isImp() ? (dMass * UC.kg_to_lb).toFixed(1) : dMass;
    if (n('val-radius'))    n('val-radius').value    = isImp() ? (dRadius * UC.m_to_in).toFixed(1) : dRadius;
    if (n('val-roll-angle')) n('val-roll-angle').value = rollAngle;
  }
  function setUnits(sys) {
    if (sys === unitSys) return;
    saveUndo();
    unitSys = sys;
    $$('#sim-toolbar .unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.unit === sys); });
    updateUnitLabels();
    syncStepperInputs();
    updateReadouts();
    updateLearnPanels();
    draw();
  }

  /* ================================================================
     UNDO / REDO
     ================================================================ */
  var undoStack = [], redoStack = [];
  var UNDO_LIMIT = 60;
  function snapState() {
    return {
      sc: scenario, sh: discShape,
      wF: wForce, wA: wArm, wAng: wAngle, wB: wBoltReq,
      m1: sM1, d1: sD1, m2: sM2, d2: sD2,
      dT: dTorque, dM: dMass, dR: dRadius,
      ra: rollAngle, u: unitSys, grid: showGrid
    };
  }
  function loadState(s) {
    if (!s) return;
    scenario = s.sc; discShape = s.sh;
    wForce = s.wF; wArm = s.wA; wAngle = s.wAng; wBoltReq = s.wB;
    sM1 = s.m1; sD1 = s.d1; sM2 = s.m2; sD2 = s.d2;
    dTorque = s.dT; dMass = s.dM; dRadius = s.dR;
    rollAngle = s.ra; unitSys = s.u || 'si';
    showGrid = !!s.grid;
    /* DOM resync */
    $$('#scenario-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.scenario === scenario); });
    $$('#shape-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.shape === discShape); });
    setScenario(scenario);   /* show/hide rows; will not run sim */
    syncSliders();
    syncStepperInputs();
    updateUnitLabels();
    var gridEl = $('chk-grid'); if (gridEl) gridEl.checked = showGrid;
    $$('#sim-toolbar .unit-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.unit === unitSys); });
    updateReadouts();
    updateLearnPanels();
    draw();
  }
  function syncSliders() {
    var pairs = [
      ['sl-force', wForce], ['sl-arm', wArm], ['sl-angle', wAngle],
      ['sl-m1', sM1], ['sl-d1', sD1], ['sl-m2', sM2], ['sl-d2', sD2],
      ['sl-torque', dTorque], ['sl-disc-mass', dMass], ['sl-radius', dRadius],
      ['sl-roll-angle', rollAngle]
    ];
    pairs.forEach(function (p) {
      var el = document.getElementById(p[0]);
      if (el) el.value = p[1];
    });
  }
  function saveUndo() {
    undoStack.push(snapState());
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
    redoStack = [];
    refreshUndoButtons();
  }
  function refreshUndoButtons() {
    var u = $('btn-undo'), r = $('btn-redo');
    if (u) u.disabled = undoStack.length === 0;
    if (r) r.disabled = redoStack.length === 0;
  }
  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(snapState());
    loadState(undoStack.pop());
    refreshUndoButtons();
  }
  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(snapState());
    loadState(redoStack.pop());
    refreshUndoButtons();
  }

  /* ================================================================
     GRID TOGGLE (used by drawBgScene)
     ================================================================ */
  var showGrid = false;
  function toggleGrid() {
    saveUndo();
    showGrid = !showGrid;
    var el = $('chk-grid'); if (el) el.checked = showGrid;
    draw();
  }

  /* ================================================================
     LIVE EQUATIONS PANEL (KaTeX-rendered)
     ================================================================ */
  function fmtSI(x, d) { return Number(x).toFixed(d == null ? 2 : d); }
  function updateLearnPanels() {
    var eq = $('lp-eq-body');
    var ins = $('lp-insights-body');
    if (!eq || !ins) return;

    var eqHtml = '', insHtml = '';
    if (scenario === 'wrench') {
      var c = calcWrench();
      var thetaR = degToRad(wAngle);
      var uTau = isImp() ? '\\,\\mathrm{ft\\cdot lbf}' : '\\,\\mathrm{N\\cdot m}';
      var uF   = isImp() ? '\\,\\mathrm{lbf}' : '\\,\\mathrm{N}';
      var uR   = isImp() ? '\\,\\mathrm{in}'  : '\\,\\mathrm{m}';
      var fDisp = isImp() ? (wForce * UC.N_to_lbf).toFixed(1) : wForce;
      var rDisp = isImp() ? (wArm * UC.m_to_in).toFixed(1) : wArm.toFixed(2);
      var tauDisp = isImp() ? (c.applied * UC.Nm_to_ftlbf).toFixed(2) : c.applied.toFixed(2);
      eqHtml += '<div class="eq-line">\\[ \\tau = F \\cdot r \\cdot \\sin\\theta \\]</div>';
      eqHtml += '<div class="eq-line">\\(\\tau = ' + fDisp + uF + ' \\cdot ' + rDisp + uR + ' \\cdot \\sin(' + wAngle + '^\\circ) = \\mathbf{' + tauDisp + uTau + '}\\)</div>';
      eqHtml += '<div class="eq-line">\\(\\sin\\theta = ' + Math.sin(thetaR).toFixed(3) + '\\)</div>';
      insHtml += '<p class="insight-line">Required for this bolt: <strong>' + uTorque(c.required) + '</strong></p>';
      insHtml += '<p class="insight-line">Applied vs required: <strong>' + uTorque(c.applied) + ' ' + (c.turns ? '≥' : '<') + ' ' + uTorque(c.required) + '</strong> &mdash; ' + (c.turns ? 'bolt tightens' : 'increase F, lever arm, or angle') + '.</p>';
      if (wAngle < 90) insHtml += '<p class="insight-line">At θ = 90° you would get <strong>' + uTorque(wForce * wArm) + '</strong> (' + (((wForce * wArm) / Math.max(c.applied, 0.01) - 1) * 100).toFixed(0) + '% more).</p>';
    } else if (scenario === 'seesaw') {
      var cs = calcSeesaw();
      var uM   = isImp() ? '\\,\\mathrm{lb}' : '\\,\\mathrm{kg}';
      var uD   = isImp() ? '\\,\\mathrm{ft}' : '\\,\\mathrm{m}';
      var m1D = isImp() ? (sM1 * UC.kg_to_lb).toFixed(1) : sM1;
      var d1D = isImp() ? (sD1 * UC.m_to_ft).toFixed(2) : sD1.toFixed(2);
      var m2D = isImp() ? (sM2 * UC.kg_to_lb).toFixed(1) : sM2;
      var d2D = isImp() ? (sD2 * UC.m_to_ft).toFixed(2) : sD2.toFixed(2);
      eqHtml += '<div class="eq-line">\\[ \\Sigma\\,\\tau = 0 \\quad\\Rightarrow\\quad m_1 \\cdot d_1 = m_2 \\cdot d_2 \\]</div>';
      eqHtml += '<div class="eq-line">\\(\\tau_L = m_1 g d_1 = ' + m1D + uM + ' \\cdot 9.81 \\cdot ' + d1D + uD + ' = \\mathbf{' + uTorque(cs.tauL) + '}\\)</div>';
      eqHtml += '<div class="eq-line">\\(\\tau_R = m_2 g d_2 = ' + m2D + uM + ' \\cdot 9.81 \\cdot ' + d2D + uD + ' = \\mathbf{' + uTorque(cs.tauR) + '}\\)</div>';
      var prod1 = sM1 * sD1, prod2 = sM2 * sD2;
      insHtml += '<p class="insight-line">m₁·d₁ = <strong>' + prod1.toFixed(2) + '</strong> ' + (isImp() ? 'lb·ft' : 'kg·m') + ', m₂·d₂ = <strong>' + prod2.toFixed(2) + '</strong></p>';
      if (cs.balanced) insHtml += '<p class="insight-line">&#9878; <strong>Balanced.</strong> Both sides produce equal torque about the pivot.</p>';
      else {
        var heavier = cs.tauL > cs.tauR ? 'left' : 'right';
        var fixSide = cs.tauL > cs.tauR ? 'm2 or move m2 farther' : 'm1 or move m1 farther';
        insHtml += '<p class="insight-line">Heavier side: <strong>' + heavier + '</strong>. To balance, increase ' + fixSide + '.</p>';
        var dNeeded = (cs.tauL > cs.tauR) ? (sM1 * sD1) / sM2 : (sM2 * sD2) / sM1;
        insHtml += '<p class="insight-line">Suggested distance to balance: <strong>' + uLength(dNeeded) + '</strong></p>';
      }
    } else if (scenario === 'disc') {
      var cd = calcDisc();
      var shapeFormula = discShape === 'disc' ? '\\tfrac{1}{2} m r^2' : discShape === 'ring' ? 'm r^2' : '\\tfrac{2}{5} m r^2';
      var k = getInertiaFactor();
      var uI = isImp() ? '\\,\\mathrm{lb\\cdot ft^2}' : '\\,\\mathrm{kg\\cdot m^2}';
      var mDisp = isImp() ? (dMass * UC.kg_to_lb).toFixed(1) : dMass.toFixed(1);
      var rDisp2 = isImp() ? (dRadius * UC.m_to_in).toFixed(1) : dRadius.toFixed(2);
      var iDisp = isImp() ? (cd.I * UC.kgm2_to_lbft2).toFixed(4) : cd.I.toFixed(4);
      eqHtml += '<div class="eq-line">\\[ I = ' + shapeFormula + ' = ' + iDisp + uI + ' \\]</div>';
      eqHtml += '<div class="eq-line">\\[ \\tau = I\\,\\alpha \\quad\\Rightarrow\\quad \\alpha = \\frac{\\tau}{I} \\]</div>';
      eqHtml += '<div class="eq-line">\\(\\alpha = \\dfrac{' + dTorque + '}{' + cd.I.toFixed(4) + '} = \\mathbf{' + cd.alpha.toFixed(1) + '\\,\\mathrm{rad/s^2}}\\)</div>';
      insHtml += '<p class="insight-line">After 2 s: ω = <strong>' + cd.omega.toFixed(1) + ' rad/s</strong>, θ = <strong>' + cd.theta.toFixed(1) + ' rad</strong>.</p>';
      insHtml += '<p class="insight-line">Doubling the radius gives <strong>4×</strong> the moment of inertia.</p>';
      insHtml += '<p class="insight-line">k (shape factor) = ' + k + '. Lower k means faster spin-up for the same torque.</p>';
    } else if (scenario === 'rolling') {
      var cr = calcRolling();
      eqHtml += '<div class="eq-line">\\[ a = \\dfrac{g\\,\\sin\\theta}{1 + I/mr^2} \\]</div>';
      eqHtml += '<div class="eq-line">\\(a_{\\text{sphere}} = \\dfrac{9.81\\,\\sin(' + rollAngle + '^\\circ)}{1 + 0.4} = \\mathbf{' + uAccel(cr.aSphere) + '}\\)</div>';
      eqHtml += '<div class="eq-line">\\(a_{\\text{solid}} = \\dfrac{9.81\\,\\sin(' + rollAngle + '^\\circ)}{1 + 0.5} = \\mathbf{' + uAccel(cr.aSolid) + '}\\)</div>';
      eqHtml += '<div class="eq-line">\\(a_{\\text{hollow}} = \\dfrac{9.81\\,\\sin(' + rollAngle + '^\\circ)}{1 + 1.0} = \\mathbf{' + uAccel(cr.aHollow) + '}\\)</div>';
      insHtml += '<p class="insight-line">Sphere/solid ratio: <strong>' + (cr.aSphere / cr.aSolid).toFixed(3) + '×</strong> faster.</p>';
      insHtml += '<p class="insight-line">Mass and radius <strong>cancel</strong>. Only the shape factor I/mr² determines the rank.</p>';
    }

    eq.innerHTML = eqHtml;
    ins.innerHTML = insHtml;
    if (window.renderMathInElement) {
      try { window.renderMathInElement(eq); } catch (e) {}
    }
  }
  function wireLearnPanels() {
    var expAll = $('learn-expand-all'), colAll = $('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  }

  /* ================================================================
     SHOW-CALCULATIONS MODAL
     ================================================================ */
  function calcStep(num, title, formula, calculation, result) {
    var h = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula) h += '<div class="cs-formula">' + formula + '</div>';
    if (calculation) h += '<div class="cs-calc">' + calculation + '</div>';
    if (result != null) h += '<div class="cs-result">→ <strong>' + result + '</strong></div>';
    return h + '</div>';
  }
  function buildCalcSteps() {
    var html = '<div class="cs-inputs"><span class="cs-badge">Given — Current State</span>';
    html += '<div class="cs-given">';
    if (scenario === 'wrench') {
      html += '<span>F = ' + uForce(wForce) + '</span>';
      html += '<span>r = ' + uLengthShort(wArm) + '</span>';
      html += '<span>θ = ' + wAngle + '°</span>';
      html += '<span>Bolt required τ = ' + uTorque(wBoltReq) + '</span>';
    } else if (scenario === 'seesaw') {
      html += '<span>m₁ = ' + uMass(sM1) + '</span>';
      html += '<span>d₁ = ' + uLength(sD1) + '</span>';
      html += '<span>m₂ = ' + uMass(sM2) + '</span>';
      html += '<span>d₂ = ' + uLength(sD2) + '</span>';
      html += '<span>g = 9.81 m/s²</span>';
    } else if (scenario === 'disc') {
      html += '<span>τ = ' + uTorque(dTorque) + '</span>';
      html += '<span>m = ' + uMass(dMass) + '</span>';
      html += '<span>r = ' + uLengthShort(dRadius) + '</span>';
      html += '<span>Shape: ' + discShape + '</span>';
    } else if (scenario === 'rolling') {
      html += '<span>θ = ' + rollAngle + '°</span>';
      html += '<span>g = 9.81 m/s²</span>';
    }
    html += '</div><p class="cs-si-note">&#9432; All steps computed in SI. Display follows the selected unit system.</p></div>';

    if (scenario === 'wrench') {
      var c = calcWrench();
      html += calcStep(1, 'Identify the formula',
        '\\[ \\tau = F \\cdot r \\cdot \\sin\\theta \\]',
        'Torque about the bolt centre depends on force, lever arm, and the angle between them.', null);
      html += calcStep(2, 'Substitute SI values',
        '\\[ \\tau = ' + wForce + '\\,\\mathrm{N} \\cdot ' + wArm.toFixed(2) + '\\,\\mathrm{m} \\cdot \\sin(' + wAngle + '^\\circ) \\]',
        '\\(\\sin(' + wAngle + '^\\circ) = ' + Math.sin(degToRad(wAngle)).toFixed(3) + '\\)', null);
      html += calcStep(3, 'Compute applied torque', null,
        '\\(\\tau = ' + (wForce * wArm * Math.sin(degToRad(wAngle))).toFixed(2) + '\\,\\mathrm{N\\cdot m}\\)',
        uTorque(c.applied));
      html += calcStep(4, 'Compare with bolt requirement', null,
        c.applied.toFixed(1) + ' N·m ' + (c.turns ? '≥' : '<') + ' ' + c.required + ' N·m',
        c.turns ? 'Bolt tightens ✔' : 'Insufficient torque ✘');
      html += calcStep(5, 'Real-world context', null,
        'M8 ≈ 18 N·m, M12 ≈ 45 N·m, M16 ≈ 90 N·m, M20 ≈ 150 N·m for typical class 8.8 steel bolts.', null);
    } else if (scenario === 'seesaw') {
      var cs = calcSeesaw();
      html += calcStep(1, 'Equilibrium condition',
        '\\[ \\Sigma\\,\\tau = 0 \\quad\\Rightarrow\\quad \\tau_L = \\tau_R \\]',
        'Sum of all torques about the pivot must be zero.', null);
      html += calcStep(2, 'Left torque (CCW)',
        '\\[ \\tau_L = m_1 \\cdot g \\cdot d_1 \\]',
        '\\(\\tau_L = ' + sM1 + ' \\cdot 9.81 \\cdot ' + sD1.toFixed(2) + ' = ' + cs.tauL.toFixed(2) + '\\,\\mathrm{N\\cdot m}\\)',
        uTorque(cs.tauL));
      html += calcStep(3, 'Right torque (CW)',
        '\\[ \\tau_R = m_2 \\cdot g \\cdot d_2 \\]',
        '\\(\\tau_R = ' + sM2 + ' \\cdot 9.81 \\cdot ' + sD2.toFixed(2) + ' = ' + cs.tauR.toFixed(2) + '\\,\\mathrm{N\\cdot m}\\)',
        uTorque(cs.tauR));
      html += calcStep(4, 'Compare', null,
        'τ_L = ' + cs.tauL.toFixed(2) + ' vs τ_R = ' + cs.tauR.toFixed(2),
        cs.balanced ? 'BALANCED' : (cs.tauL > cs.tauR ? 'Tilts LEFT (left side dips)' : 'Tilts RIGHT'));
      html += calcStep(5, 'Simplified balance rule', null,
        'Since g is constant on both sides: m₁d₁ = m₂d₂.', cs.balanced ? '✔ Holds' : '✘ Does not hold');
    } else if (scenario === 'disc') {
      var cd = calcDisc();
      var shapeF = discShape === 'disc' ? '\\tfrac{1}{2} m r^2' : discShape === 'ring' ? 'm r^2' : '\\tfrac{2}{5} m r^2';
      html += calcStep(1, 'Moment of inertia',
        '\\[ I = ' + shapeF + ' \\]',
        '\\(I = ' + dMass + ' \\cdot ' + dRadius.toFixed(2) + '^2 \\cdot k = ' + cd.I.toFixed(4) + '\\,\\mathrm{kg\\cdot m^2}\\)',
        uInertia(cd.I));
      html += calcStep(2, 'Newton’s 2nd law for rotation',
        '\\[ \\tau = I\\,\\alpha \\]',
        'Torque equals moment of inertia times angular acceleration.', null);
      html += calcStep(3, 'Solve for α',
        '\\[ \\alpha = \\dfrac{\\tau}{I} \\]',
        '\\(\\alpha = \\dfrac{' + dTorque + '}{' + cd.I.toFixed(4) + '} = ' + cd.alpha.toFixed(2) + '\\,\\mathrm{rad/s^2}\\)',
        cd.alpha.toFixed(2) + ' rad/s²');
      html += calcStep(4, 'Angular velocity after 2 s',
        '\\[ \\omega = \\alpha\\,t \\]',
        '\\(\\omega = ' + cd.alpha.toFixed(2) + ' \\cdot 2 = ' + cd.omega.toFixed(2) + '\\,\\mathrm{rad/s}\\)',
        cd.omega.toFixed(2) + ' rad/s ≈ ' + (cd.omega * 60 / (2 * Math.PI)).toFixed(1) + ' RPM');
      html += calcStep(5, 'Rotational KE stored', null,
        '\\(KE = \\tfrac{1}{2} I \\omega^2 = ' + (0.5 * cd.I * cd.omega * cd.omega).toFixed(2) + '\\,\\mathrm{J}\\)',
        (0.5 * cd.I * cd.omega * cd.omega).toFixed(2) + ' J');
    } else if (scenario === 'rolling') {
      var cr = calcRolling();
      html += calcStep(1, 'Rolling acceleration formula',
        '\\[ a = \\dfrac{g\\,\\sin\\theta}{1 + I/mr^2} \\]',
        'Energy conservation: gravitational PE → translational + rotational KE.', null);
      html += calcStep(2, 'Sphere (I/mr² = 0.4)', null,
        '\\(a = \\dfrac{9.81 \\cdot \\sin(' + rollAngle + '^\\circ)}{1.4} = ' + cr.aSphere.toFixed(2) + '\\,\\mathrm{m/s^2}\\)',
        uAccel(cr.aSphere));
      html += calcStep(3, 'Solid cylinder (I/mr² = 0.5)', null,
        '\\(a = \\dfrac{9.81 \\cdot \\sin(' + rollAngle + '^\\circ)}{1.5} = ' + cr.aSolid.toFixed(2) + '\\,\\mathrm{m/s^2}\\)',
        uAccel(cr.aSolid));
      html += calcStep(4, 'Hollow cylinder (I/mr² = 1.0)', null,
        '\\(a = \\dfrac{9.81 \\cdot \\sin(' + rollAngle + '^\\circ)}{2.0} = ' + cr.aHollow.toFixed(2) + '\\,\\mathrm{m/s^2}\\)',
        uAccel(cr.aHollow));
      html += calcStep(5, 'Why mass and radius cancel',
        '\\[ a = \\dfrac{g\\,\\sin\\theta}{1 + k} \\]',
        'In the denominator, I/mr² reduces to a pure shape constant k. Mass and radius drop out — only shape matters.', null);
    }
    return html;
  }
  function openCalcModal() {
    var m = $('calc-modal'); var b = $('calc-modal-body');
    if (!m || !b) return;
    b.innerHTML = buildCalcSteps();
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (window.renderMathInElement) {
      try { window.renderMathInElement(b); } catch (e) {}
    }
  }
  function closeCalcModal() {
    var m = $('calc-modal'); if (!m) return;
    m.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ================================================================
     EXPORTS — PNG / CSV
     ================================================================ */
  function exportPNG() {
    var link = document.createElement('a');
    link.download = 'torque-' + scenario + '-' + Date.now() + '.png';
    link.href = cvs.toDataURL('image/png');
    link.click();
  }
  function exportCSV() {
    var rows = [['parameter', 'value', 'unit']];
    rows.push(['scenario', scenario, '']);
    rows.push(['unit_system', unitSys, '']);
    if (scenario === 'wrench') {
      var c = calcWrench();
      rows.push(['force', wForce, 'N']);
      rows.push(['lever_arm', wArm, 'm']);
      rows.push(['angle', wAngle, 'deg']);
      rows.push(['bolt_required_torque', wBoltReq, 'N·m']);
      rows.push(['applied_torque', c.applied.toFixed(3), 'N·m']);
      rows.push(['turns', c.turns, '']);
    } else if (scenario === 'seesaw') {
      var cs = calcSeesaw();
      rows.push(['m1', sM1, 'kg']);
      rows.push(['d1', sD1, 'm']);
      rows.push(['m2', sM2, 'kg']);
      rows.push(['d2', sD2, 'm']);
      rows.push(['tau_left',  cs.tauL.toFixed(3), 'N·m']);
      rows.push(['tau_right', cs.tauR.toFixed(3), 'N·m']);
      rows.push(['balanced', cs.balanced, '']);
    } else if (scenario === 'disc') {
      var cd = calcDisc();
      rows.push(['torque', dTorque, 'N·m']);
      rows.push(['mass', dMass, 'kg']);
      rows.push(['radius', dRadius, 'm']);
      rows.push(['shape', discShape, '']);
      rows.push(['inertia', cd.I.toFixed(5), 'kg·m²']);
      rows.push(['alpha', cd.alpha.toFixed(3), 'rad/s²']);
      rows.push(['omega_2s', cd.omega.toFixed(3), 'rad/s']);
    } else if (scenario === 'rolling') {
      var cr = calcRolling();
      rows.push(['incline_angle', rollAngle, 'deg']);
      rows.push(['a_sphere',  cr.aSphere.toFixed(3), 'm/s²']);
      rows.push(['a_solid',   cr.aSolid.toFixed(3),  'm/s²']);
      rows.push(['a_hollow',  cr.aHollow.toFixed(3), 'm/s²']);
    }
    var csv = rows.map(function (r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.download = 'torque-' + scenario + '-state.csv';
    link.href = url;
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /* ================================================================
     RIGHT-CLICK CONTEXT MENU
     ================================================================ */
  var ctxMenu = $('canvas-ctx-menu');
  cvs.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (!ctxMenu) return;
    ctxMenu.classList.add('active');
    var maxX = window.innerWidth - 220;
    var maxY = window.innerHeight - 220;
    ctxMenu.style.left = Math.min(e.clientX, maxX) + 'px';
    ctxMenu.style.top  = Math.min(e.clientY, maxY) + 'px';
  });
  document.addEventListener('click', function (e) {
    if (!ctxMenu || !ctxMenu.classList.contains('active')) return;
    if (!ctxMenu.contains(e.target)) ctxMenu.classList.remove('active');
  });
  if (ctxMenu) {
    ctxMenu.querySelectorAll('.cm-item').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.dataset.action;
        ctxMenu.classList.remove('active');
        if (a === 'png') exportPNG();
        else if (a === 'csv') exportCSV();
        else if (a === 'grid') toggleGrid();
        else if (a === 'calc') openCalcModal();
        else if (a === 'reset') resetSim();
      });
    });
  }

  /* ================================================================
     STEPPER (number input) bindings
     ================================================================ */
  function bindStepper(id, sliderID, setterSI, fromImp, fromSI, valFormatter) {
    var inp = document.getElementById(id);
    var sl  = document.getElementById(sliderID);
    if (!inp || !sl) return;
    inp.addEventListener('change', function () {
      saveUndo();
      var raw = parseFloat(inp.value);
      if (isNaN(raw)) { syncStepperInputs(); return; }
      /* Convert displayed value back to SI */
      var siVal = isImp() && fromImp ? fromImp(raw) : raw;
      setterSI(siVal);
      /* Bring slider into range visually */
      sl.value = siVal;
      if (anim.running || simDone) resetSim();
      else { updateReadouts(); updateLearnPanels(); draw(); }
    });
  }
  bindStepper('val-force',     'sl-force',     function (v) { wForce = v; },   function (v) { return v / UC.N_to_lbf; });
  bindStepper('val-arm',       'sl-arm',       function (v) { wArm = v; },     function (v) { return v / UC.m_to_in; });
  bindStepper('val-angle',     'sl-angle',     function (v) { wAngle = v; });
  bindStepper('val-m1',        'sl-m1',        function (v) { sM1 = v; },      function (v) { return v / UC.kg_to_lb; });
  bindStepper('val-d1',        'sl-d1',        function (v) { sD1 = v; },      function (v) { return v / UC.m_to_ft; });
  bindStepper('val-m2',        'sl-m2',        function (v) { sM2 = v; },      function (v) { return v / UC.kg_to_lb; });
  bindStepper('val-d2',        'sl-d2',        function (v) { sD2 = v; },      function (v) { return v / UC.m_to_ft; });
  bindStepper('val-torque',    'sl-torque',    function (v) { dTorque = v; },  function (v) { return v / UC.Nm_to_ftlbf; });
  bindStepper('val-disc-mass', 'sl-disc-mass', function (v) { dMass = v; },    function (v) { return v / UC.kg_to_lb; });
  bindStepper('val-radius',    'sl-radius',    function (v) { dRadius = v; },  function (v) { return v / UC.m_to_in; });
  bindStepper('val-roll-angle','sl-roll-angle',function (v) { rollAngle = v; });

  /* Scenario presets */
  $$('.seesaw-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      saveUndo();
      $$('.seesaw-preset').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      sM1 = parseFloat(btn.dataset.m1);
      sD1 = parseFloat(btn.dataset.d1);
      sM2 = parseFloat(btn.dataset.m2);
      sD2 = parseFloat(btn.dataset.d2);
      syncSliders(); syncStepperInputs();
      resetSim(); updateReadouts(); updateLearnPanels(); draw();
    });
  });
  $$('.disc-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      saveUndo();
      $$('.disc-preset').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      dTorque = parseFloat(btn.dataset.torque);
      dMass   = parseFloat(btn.dataset.mass);
      dRadius = parseFloat(btn.dataset.radius);
      syncSliders(); syncStepperInputs();
      resetSim(); updateReadouts(); updateLearnPanels(); draw();
    });
  });
  $$('.rolling-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      saveUndo();
      $$('.rolling-preset').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      rollAngle = parseInt(btn.dataset.angle);
      syncSliders(); syncStepperInputs();
      resetSim(); updateReadouts(); updateLearnPanels(); draw();
    });
  });

  /* Toolbar wiring */
  $$('#sim-toolbar .unit-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () { setUnits(p.dataset.unit); });
  });
  if ($('btn-undo')) $('btn-undo').addEventListener('click', doUndo);
  if ($('btn-redo')) $('btn-redo').addEventListener('click', doRedo);
  if ($('btn-export-png')) $('btn-export-png').addEventListener('click', exportPNG);
  if ($('btn-export-csv')) $('btn-export-csv').addEventListener('click', exportCSV);
  if ($('chk-grid')) $('chk-grid').addEventListener('change', function () { saveUndo(); showGrid = this.checked; draw(); });

  /* Calc modal */
  if ($('btn-calc')) $('btn-calc').addEventListener('click', openCalcModal);
  if ($('calc-modal-close')) $('calc-modal-close').addEventListener('click', closeCalcModal);
  if ($('calc-modal')) $('calc-modal').addEventListener('click', function (e) { if (e.target === this) closeCalcModal(); });

  /* Keyboard: Ctrl+Z / Ctrl+Shift+Z / Esc */
  document.addEventListener('keydown', function (e) {
    var mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) doRedo(); else doUndo();
    } else if (e.key === 'Escape') {
      var m = $('calc-modal');
      if (m && m.classList.contains('active')) closeCalcModal();
      if (ctxMenu) ctxMenu.classList.remove('active');
    }
  });

  /* Hover-cursor + learning-panel + stepper-sync on seesaw drag */
  cvs.addEventListener('pointermove', function (e) {
    if (dragState && dragState.target) {
      /* Stepper + learn panel during drag (drag handler also updates these now) */
      syncStepperInputs(); updateLearnPanels();
    }
  });
  /* Push undo when a drag begins */
  cvs.addEventListener('pointerdown', function (e) {
    if (mode === 'simulate' && scenario === 'seesaw') {
      var pt = canvasPoint(e); var hit = hitTestSeesaw(pt);
      if (hit) saveUndo();
    }
  });

  /* Wire learning-panel expand/collapse */
  wireLearnPanels();

  /* Patch existing slider bindings to also call updateLearnPanels + push undo */
  (function patchSliders() {
    var sliderIds = ['sl-force','sl-arm','sl-angle','sl-m1','sl-d1','sl-m2','sl-d2',
                     'sl-torque','sl-disc-mass','sl-radius','sl-roll-angle'];
    sliderIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var lastVal = el.value;
      el.addEventListener('change', function () {       /* commit happens on mouseup */
        if (lastVal !== el.value) {
          /* Snapshot taken BEFORE the change in 'input' would be ideal but we
             record on 'change' (mouseup) — close enough for slider drags */
          undoStack.push(snapState());
          if (undoStack.length > UNDO_LIMIT) undoStack.shift();
          redoStack = [];
          refreshUndoButtons();
          lastVal = el.value;
        }
      });
      el.addEventListener('input', function () {
        updateLearnPanels();
        syncStepperInputs();
      });
    });
  })();

  /* Push undo when scenario/shape changes */
  $$('#scenario-tabs .pill').forEach(function (p) { p.addEventListener('click', saveUndo); });
  $$('#shape-tabs .pill').forEach(function (p) { p.addEventListener('click', saveUndo); });

  /* ================================================================
     INITIALISATION
     ================================================================ */
  /* Hide non-seesaw scenario rows initially (seesaw is the default scenario) */
  hide($('wrench-row-1')); hide($('wrench-row-2')); hide($('bolt-row'));
  hide($('disc-row-1')); hide($('disc-row-2')); hide($('disc-shape-row')); hide($('disc-preset-row'));
  hide($('rolling-row-1')); hide($('rolling-preset-row'));
  updateReadouts();
  updateUnitLabels();
  updateLearnPanels();
  refreshUndoButtons();
  /* HiDPI + responsive resize (G1) */
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resizeCanvas).observe(cvs);
  }
  draw();

})();
