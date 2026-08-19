(function () {
  'use strict';

  /* ================================================================
     DATA — EXPLORE CONCEPTS (12 in 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Free Vibrations (4) ──────────────────────────────────────── */
    {
      id: 'natural-frequency',
      name: 'Natural Frequency',
      symbol: '\u03C9n = \u221A(k/m)',
      formula: '\u03C9n = \u221A(k/m)',
      unit: 'rad/s',
      cat: 'free',
      desc: 'The natural frequency \u03C9n is the frequency at which a system oscillates when displaced from equilibrium and released, with no external forcing and no damping. It depends only on the stiffness (k) and mass (m) of the system. Higher stiffness or lower mass increases the natural frequency. The natural frequency in Hz is fn = \u03C9n/(2\u03C0). Natural frequency is a fundamental property of every vibrating system and determines how the system responds to external excitation.',
      example: {
        problem: 'A spring-mass system has k = 400 N/m and m = 4 kg. Find the natural frequency \u03C9n.',
        steps: ['\u03C9n = \u221A(k/m)', '\u03C9n = \u221A(400/4)', '\u03C9n = \u221A100', '\u03C9n = 10 rad/s'],
        answer: 10, unit: 'rad/s'
      }
    },
    {
      id: 'damping-ratio',
      name: 'Damping Ratio',
      symbol: '\u03B6 = c/(2\u221A(km))',
      formula: '\u03B6 = c / (2\u221A(km)) = c / (2m\u03C9n)',
      unit: '\u2014',
      cat: 'free',
      desc: 'The damping ratio \u03B6 (zeta) is a dimensionless number that describes how oscillations decay after an initial disturbance. \u03B6 < 1 means underdamped (oscillatory decay), \u03B6 = 1 means critically damped (fastest non-oscillatory return), and \u03B6 > 1 means overdamped (slow non-oscillatory return). The critical damping coefficient is cc = 2\u221A(km) = 2m\u03C9n. Damping ratio is the primary parameter for classifying system behaviour.',
      example: {
        problem: 'System: m = 2 kg, k = 200 N/m, c = 12 Ns/m. Find the damping ratio \u03B6.',
        steps: ['\u03B6 = c / (2\u221A(km))', '\u03B6 = 12 / (2\u221A(200\u00D72))', '\u03B6 = 12 / (2\u00D720)', '\u03B6 = 12/40 = 0.30'],
        answer: 0.30, unit: ''
      }
    },
    {
      id: 'damped-response',
      name: 'Under/Critical/Overdamped',
      symbol: '\u03B6 < 1, = 1, > 1',
      formula: 'x(t) = A\u00B7e^(\u2212\u03B6\u03C9n\u00B7t)\u00B7cos(\u03C9d\u00B7t + \u03C6)',
      unit: 'm',
      cat: 'free',
      desc: 'The response of a damped system depends on the damping ratio. Underdamped (\u03B6 < 1): oscillatory motion with exponentially decaying amplitude, oscillating at the damped frequency \u03C9d = \u03C9n\u221A(1\u2212\u03B6\u00B2). Critically damped (\u03B6 = 1): returns to equilibrium in minimum time without oscillation \u2014 used in door closers and instrument needles. Overdamped (\u03B6 > 1): returns slowly to equilibrium without oscillation, with two real exponential decay rates.',
      example: {
        problem: 'System: \u03C9n = 8 rad/s, \u03B6 = 0.4. Find the damped natural frequency \u03C9d.',
        steps: ['\u03C9d = \u03C9n\u221A(1 \u2212 \u03B6\u00B2)', '\u03C9d = 8\u221A(1 \u2212 0.16)', '\u03C9d = 8\u221A0.84', '\u03C9d = 8 \u00D7 0.9165 = 7.33 rad/s'],
        answer: 7.33, unit: 'rad/s'
      }
    },
    {
      id: 'log-decrement',
      name: 'Logarithmic Decrement',
      symbol: '\u03B4 = ln(xn/xn+1)',
      formula: '\u03B4 = 2\u03C0\u03B6 / \u221A(1 \u2212 \u03B6\u00B2)',
      unit: '\u2014',
      cat: 'free',
      desc: 'The logarithmic decrement \u03B4 is the natural logarithm of the ratio of successive peak amplitudes in an underdamped free vibration. It is a convenient way to measure damping experimentally. From \u03B4, one can find \u03B6 = \u03B4 / \u221A(4\u03C0\u00B2 + \u03B4\u00B2). Over n cycles, \u03B4 = (1/n) ln(x1/xn+1). This is widely used in vibration testing of structures and machinery.',
      example: {
        problem: 'Successive peaks: x1 = 5.0 mm, x2 = 4.2 mm. Find \u03B4 and \u03B6.',
        steps: ['\u03B4 = ln(x1/x2) = ln(5.0/4.2)', '\u03B4 = ln(1.1905) = 0.1744', '\u03B6 = \u03B4/\u221A(4\u03C0\u00B2 + \u03B4\u00B2)', '\u03B6 = 0.1744/\u221A(39.478 + 0.0304) = 0.0278'],
        answer: 0.0278, unit: ''
      }
    },

    /* ── Forced Vibrations (4) ────────────────────────────────────── */
    {
      id: 'frequency-response',
      name: 'Frequency Response',
      symbol: 'X/Xst vs r',
      formula: 'M = 1/\u221A((1\u2212r\u00B2)\u00B2 + (2\u03B6r)\u00B2)',
      unit: '\u2014',
      cat: 'forced',
      desc: 'The frequency response (magnification factor M) describes how the steady-state amplitude varies with forcing frequency ratio r = \u03C9/\u03C9n. At low frequencies (r << 1), M \u2248 1 \u2014 the response follows the force quasi-statically. At resonance (r = 1), M = 1/(2\u03B6) which can be very large for lightly damped systems. At high frequencies (r >> 1), M \u2192 0 as the mass cannot follow the rapid forcing. The shape and peak of the frequency response curve depend on the damping ratio \u03B6.',
      example: {
        problem: 'System: \u03B6 = 0.2, frequency ratio r = 1.0 (resonance). Find M.',
        steps: ['M = 1/\u221A((1\u22121)\u00B2 + (2\u00D70.2\u00D71)\u00B2)', 'M = 1/\u221A(0 + 0.16)', 'M = 1/0.4', 'M = 2.5'],
        answer: 2.5, unit: ''
      }
    },
    {
      id: 'resonance',
      name: 'Resonance',
      symbol: '\u03C9 \u2248 \u03C9n',
      formula: 'At resonance: X = F0/(c\u03C9n) = F0/(2\u03B6k)',
      unit: 'm',
      cat: 'forced',
      desc: 'Resonance occurs when the forcing frequency \u03C9 approaches the natural frequency \u03C9n (r \u2248 1). At resonance, the amplitude is limited only by damping: X = F0/(c\u03C9n) = F0/(2\u03B6k). With zero damping, the amplitude grows without bound \u2014 a dangerous condition. The Tacoma Narrows Bridge collapse (1940) is a famous example. The Millennium Bridge in London wobbled due to pedestrian-induced resonance. Engineers must design systems to either avoid resonance or provide sufficient damping.',
      example: {
        problem: 'System: k = 500 N/m, \u03B6 = 0.1, F0 = 25 N. Find peak amplitude at resonance.',
        steps: ['At resonance: X = F0/(2\u03B6k)', 'X = 25/(2 \u00D7 0.1 \u00D7 500)', 'X = 25/100', 'X = 0.25 m'],
        answer: 0.25, unit: 'm'
      }
    },
    {
      id: 'transmissibility',
      name: 'Transmissibility',
      symbol: 'TR = Ft/F0',
      formula: 'TR = \u221A((1+(2\u03B6r)\u00B2)/((1\u2212r\u00B2)\u00B2+(2\u03B6r)\u00B2))',
      unit: '\u2014',
      cat: 'forced',
      desc: 'Force transmissibility (TR) is the ratio of force transmitted to the foundation versus the applied force. When r < \u221A2, TR > 1 (amplification \u2014 more force reaches the foundation). When r > \u221A2, TR < 1 (isolation \u2014 less force is transmitted). For effective vibration isolation, the system should operate at r > \u221A2. Paradoxically, higher damping actually increases TR in the isolation range (r > \u221A2), so isolation mounts should have low damping.',
      example: {
        problem: 'System: \u03B6 = 0.15, r = 2.0. Find transmissibility TR.',
        steps: ['TR = \u221A((1+(2\u00D70.15\u00D72)\u00B2)/((1\u22124)\u00B2+(2\u00D70.15\u00D72)\u00B2))', 'Numerator: 1 + 0.36 = 1.36', 'Denominator: 9 + 0.36 = 9.36', 'TR = \u221A(1.36/9.36) = \u221A0.1453 = 0.381'],
        answer: 0.381, unit: ''
      }
    },
    {
      id: 'phase-angle',
      name: 'Phase Angle',
      symbol: '\u03C6 = atan(2\u03B6r/(1\u2212r\u00B2))',
      formula: '\u03C6 = arctan(2\u03B6r / (1 \u2212 r\u00B2))',
      unit: '\u00B0',
      cat: 'forced',
      desc: 'The phase angle \u03C6 is the lag between the forcing function and the system response. At r << 1, \u03C6 \u2248 0 (response in phase with force). At r = 1 (resonance), \u03C6 = 90\u00B0 regardless of damping \u2014 the response lags the force by a quarter cycle. At r >> 1, \u03C6 \u2192 180\u00B0 (response out of phase with force). The rapid transition of phase through 90\u00B0 at resonance is used in vibration testing to identify natural frequencies.',
      example: {
        problem: 'System: \u03B6 = 0.25, r = 1.0. Find phase angle \u03C6.',
        steps: ['\u03C6 = arctan(2\u03B6r/(1\u2212r\u00B2))', '\u03C6 = arctan(2\u00D70.25\u00D71/(1\u22121))', '\u03C6 = arctan(0.5/0) = arctan(\u221E)', '\u03C6 = 90\u00B0'],
        answer: 90, unit: '\u00B0'
      }
    },

    /* ── Applications (4) ─────────────────────────────────────────── */
    {
      id: 'vibration-isolation',
      name: 'Vibration Isolation',
      symbol: 'r > \u221A2',
      formula: 'Isolation when TR < 1, i.e., r > \u221A2 \u2248 1.414',
      unit: '\u2014',
      cat: 'applications',
      desc: 'Vibration isolation prevents unwanted vibrations from being transmitted from a source to a receiver (or vice versa). For effective isolation, the natural frequency of the mount must be much lower than the excitation frequency (r > \u221A2). Rubber mounts, air springs, and elastomeric pads are common isolators. The trade-off: softer mounts (lower \u03C9n) give better isolation but larger static deflection. Vibration isolation is critical for sensitive equipment like electron microscopes and MRI machines.',
      example: {
        problem: 'A machine runs at 3000 RPM. What max natural frequency gives isolation (r > \u221A2)?',
        steps: ['\u03C9 = 2\u03C0 \u00D7 3000/60 = 314.16 rad/s', 'For isolation: r > \u221A2', '\u03C9n < \u03C9/\u221A2 = 314.16/1.414', '\u03C9n < 222.1 rad/s (fn < 35.4 Hz)'],
        answer: 222.1, unit: 'rad/s'
      }
    },
    {
      id: 'seismic-design',
      name: 'Seismic Design',
      symbol: 'Base isolation',
      formula: 'fn,building << fn,earthquake \u2192 TR << 1',
      unit: '\u2014',
      cat: 'applications',
      desc: 'Seismic design uses vibration principles to protect buildings from earthquake damage. Base isolation decouples the building from ground motion using flexible bearings (lead-rubber, friction pendulum). Tuned mass dampers (TMDs) are large pendulums at the top of tall buildings (Taipei 101\'s 730-tonne TMD) that absorb energy at the building\'s natural frequency. The goal is to avoid resonance with earthquake frequencies (typically 0.5\u201310 Hz) and dissipate energy through damping.',
      example: {
        problem: 'A building has fn = 2 Hz. An earthquake has dominant frequency 2.1 Hz. What is r?',
        steps: ['r = f_earthquake / f_building', 'r = 2.1 / 2.0', 'r = 1.05', 'Very close to resonance \u2014 dangerous!'],
        answer: 1.05, unit: ''
      }
    },
    {
      id: 'musical-instruments',
      name: 'Musical Instruments',
      symbol: 'fn = (n/2L)\u221A(T/\u03BC)',
      formula: 'fn = (n/2L)\u221A(T/\u03BC), n = 1,2,3...',
      unit: 'Hz',
      cat: 'applications',
      desc: 'Musical instruments rely on vibrations to produce sound. Strings vibrate at natural frequencies determined by length (L), tension (T), and mass per unit length (\u03BC). Wind instruments use standing waves in air columns. Percussion instruments vibrate in complex two-dimensional modes. Each instrument\'s timbre comes from the unique combination of fundamental frequency and harmonics. Tuning adjusts the natural frequency to match standard pitch (A4 = 440 Hz).',
      example: {
        problem: 'Guitar string: L = 0.65 m, T = 70 N, \u03BC = 0.001 kg/m. Find fundamental frequency.',
        steps: ['f1 = (1/2L)\u221A(T/\u03BC)', 'f1 = (1/1.30)\u221A(70/0.001)', 'f1 = 0.769 \u00D7 264.6', 'f1 = 203.5 Hz'],
        answer: 203.5, unit: 'Hz'
      }
    },
    {
      id: 'machinery-balancing',
      name: 'Machinery Balancing',
      symbol: 'F = m\u03C9\u00B2e',
      formula: 'Unbalance force F = m\u03C9\u00B2e',
      unit: 'N',
      cat: 'applications',
      desc: 'Rotating machinery (engines, turbines, pumps) generates vibrations from mass unbalance. The unbalance force F = m\u03C9\u00B2e increases with the square of rotational speed, where e is the eccentricity (distance of mass centre from rotation axis). Balancing involves adding or removing mass to align the centre of gravity with the rotation axis. Static balancing corrects in one plane; dynamic balancing requires corrections in two planes for long rotors.',
      example: {
        problem: 'Rotor: mass 50 kg, eccentricity e = 0.1 mm, speed 3000 RPM. Find unbalance force.',
        steps: ['\u03C9 = 2\u03C0 \u00D7 3000/60 = 314.16 rad/s', 'e = 0.1 mm = 0.0001 m', 'F = m\u03C9\u00B2e = 50 \u00D7 314.16\u00B2 \u00D7 0.0001', 'F = 50 \u00D7 98696 \u00D7 0.0001 = 493.5 N'],
        answer: 493.5, unit: 'N'
      }
    }
  ];

  /* ================================================================
     DATA — PRACTICE GENERATORS (12)
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 — Natural frequency */
    function () {
      var k = randInt(50, 500);
      var m = +(1 + Math.random() * 19).toFixed(1);
      var wn = +Math.sqrt(k / m).toFixed(2);
      return {
        prompt: 'A spring-mass system has k = ' + k + ' N/m and m = ' + m + ' kg. Calculate the natural frequency \u03C9n in rad/s.',
        steps: [
          '\u03C9n = \u221A(k/m)',
          '\u03C9n = \u221A(' + k + '/' + m + ')',
          '\u03C9n = \u221A(' + (k / m).toFixed(3) + ')',
          '\u03C9n = ' + wn + ' rad/s'
        ],
        answer: wn, unit: 'rad/s', tol: 0.1
      };
    },
    /* 1 — Damping ratio */
    function () {
      var k = randInt(100, 500);
      var m = +(2 + Math.random() * 8).toFixed(1);
      var c = +(1 + Math.random() * 40).toFixed(1);
      var cc = 2 * Math.sqrt(k * m);
      var zeta = +(c / cc).toFixed(3);
      return {
        prompt: 'System: m = ' + m + ' kg, k = ' + k + ' N/m, c = ' + c + ' Ns/m. Calculate the damping ratio \u03B6.',
        steps: [
          '\u03B6 = c / (2\u221A(km))',
          'cc = 2\u221A(' + k + '\u00D7' + m + ') = ' + cc.toFixed(2),
          '\u03B6 = ' + c + ' / ' + cc.toFixed(2),
          '\u03B6 = ' + zeta
        ],
        answer: zeta, unit: '', tol: 0.01
      };
    },
    /* 2 — Damped natural frequency */
    function () {
      var wn = +(5 + Math.random() * 15).toFixed(1);
      var zeta = +(0.05 + Math.random() * 0.85).toFixed(2);
      var wd = +(wn * Math.sqrt(1 - zeta * zeta)).toFixed(2);
      return {
        prompt: 'System: \u03C9n = ' + wn + ' rad/s, \u03B6 = ' + zeta + '. Calculate the damped natural frequency \u03C9d in rad/s.',
        steps: [
          '\u03C9d = \u03C9n\u221A(1 \u2212 \u03B6\u00B2)',
          '\u03C9d = ' + wn + '\u221A(1 \u2212 ' + (zeta * zeta).toFixed(4) + ')',
          '\u03C9d = ' + wn + ' \u00D7 ' + Math.sqrt(1 - zeta * zeta).toFixed(4),
          '\u03C9d = ' + wd + ' rad/s'
        ],
        answer: wd, unit: 'rad/s', tol: 0.1
      };
    },
    /* 3 — Period from natural frequency */
    function () {
      var k = randInt(50, 400);
      var m = +(1 + Math.random() * 10).toFixed(1);
      var wn = Math.sqrt(k / m);
      var T = +(2 * Math.PI / wn).toFixed(3);
      return {
        prompt: 'System: k = ' + k + ' N/m, m = ' + m + ' kg. Calculate the natural period T in seconds.',
        steps: [
          '\u03C9n = \u221A(k/m) = \u221A(' + k + '/' + m + ') = ' + wn.toFixed(3) + ' rad/s',
          'T = 2\u03C0/\u03C9n',
          'T = 2\u03C0/' + wn.toFixed(3),
          'T = ' + T + ' s'
        ],
        answer: +T, unit: 's', tol: 0.01
      };
    },
    /* 4 — Damped amplitude at time t */
    function () {
      var A0 = +(0.1 + Math.random() * 0.9).toFixed(2);
      var wn = +(5 + Math.random() * 15).toFixed(1);
      var zeta = +(0.05 + Math.random() * 0.4).toFixed(2);
      var t = +(0.5 + Math.random() * 3).toFixed(1);
      var amp = +(A0 * Math.exp(-zeta * wn * t)).toFixed(4);
      return {
        prompt: 'Free damped vibration: A0 = ' + A0 + ' m, \u03C9n = ' + wn + ' rad/s, \u03B6 = ' + zeta + '. Find the amplitude envelope at t = ' + t + ' s.',
        steps: [
          'A(t) = A0\u00B7e^(\u2212\u03B6\u03C9n\u00B7t)',
          'A(' + t + ') = ' + A0 + '\u00B7e^(\u2212' + zeta + '\u00D7' + wn + '\u00D7' + t + ')',
          'Exponent = \u2212' + (zeta * wn * t).toFixed(3),
          'A(' + t + ') = ' + amp + ' m'
        ],
        answer: amp, unit: 'm', tol: 0.005
      };
    },
    /* 5 — Frequency ratio */
    function () {
      var k = randInt(100, 500);
      var m = +(1 + Math.random() * 10).toFixed(1);
      var wn = Math.sqrt(k / m);
      var wf = +(1 + Math.random() * 15).toFixed(1);
      var r = +(wf / wn).toFixed(3);
      return {
        prompt: 'System: k = ' + k + ' N/m, m = ' + m + ' kg. Forcing frequency \u03C9 = ' + wf + ' rad/s. Find frequency ratio r.',
        steps: [
          '\u03C9n = \u221A(' + k + '/' + m + ') = ' + wn.toFixed(3) + ' rad/s',
          'r = \u03C9/\u03C9n',
          'r = ' + wf + '/' + wn.toFixed(3),
          'r = ' + r
        ],
        answer: +r, unit: '', tol: 0.02
      };
    },
    /* 6 — Magnification factor */
    function () {
      var zeta = +(0.1 + Math.random() * 0.5).toFixed(2);
      var r = +(0.5 + Math.random() * 1.5).toFixed(2);
      var denom = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
      var M = +(1 / denom).toFixed(3);
      return {
        prompt: 'System: \u03B6 = ' + zeta + ', frequency ratio r = ' + r + '. Calculate the magnification factor M.',
        steps: [
          'M = 1/\u221A((1\u2212r\u00B2)\u00B2 + (2\u03B6r)\u00B2)',
          '1 \u2212 r\u00B2 = ' + (1 - r * r).toFixed(4),
          '(2\u03B6r)\u00B2 = ' + Math.pow(2 * zeta * r, 2).toFixed(4),
          'M = ' + M
        ],
        answer: +M, unit: '', tol: 0.05
      };
    },
    /* 7 — Phase angle */
    function () {
      var zeta = +(0.1 + Math.random() * 0.5).toFixed(2);
      var r = +(0.3 + Math.random() * 1.6).toFixed(2);
      var num = 2 * zeta * r;
      var den = 1 - r * r;
      var phi;
      if (Math.abs(den) < 0.001) {
        phi = 90;
      } else {
        phi = Math.atan2(num, den) * 180 / Math.PI;
        if (phi < 0) phi += 180;
        phi = +phi.toFixed(1);
      }
      return {
        prompt: 'System: \u03B6 = ' + zeta + ', r = ' + r + '. Calculate the phase angle \u03C6 in degrees.',
        steps: [
          '\u03C6 = arctan(2\u03B6r / (1 \u2212 r\u00B2))',
          '2\u03B6r = ' + num.toFixed(4),
          '1 \u2212 r\u00B2 = ' + den.toFixed(4),
          '\u03C6 = ' + phi + '\u00B0'
        ],
        answer: +phi, unit: '\u00B0', tol: 2
      };
    },
    /* 8 — Peak displacement forced vibration */
    function () {
      var k = randInt(100, 500);
      var F0 = randInt(5, 50);
      var zeta = +(0.05 + Math.random() * 0.5).toFixed(2);
      var r = +(0.5 + Math.random() * 1.5).toFixed(2);
      var Xst = F0 / k;
      var denom = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
      var X = +(Xst / denom).toFixed(4);
      return {
        prompt: 'System: k = ' + k + ' N/m, F0 = ' + F0 + ' N, \u03B6 = ' + zeta + ', r = ' + r + '. Find steady-state amplitude X in m.',
        steps: [
          'Xst = F0/k = ' + F0 + '/' + k + ' = ' + Xst.toFixed(4) + ' m',
          'M = 1/\u221A((1\u2212' + (r * r).toFixed(3) + ')\u00B2 + (2\u00D7' + zeta + '\u00D7' + r + ')\u00B2) = ' + (1 / denom).toFixed(3),
          'X = Xst \u00D7 M',
          'X = ' + X + ' m'
        ],
        answer: +X, unit: 'm', tol: 0.005
      };
    },
    /* 9 — Logarithmic decrement */
    function () {
      var zeta = +(0.02 + Math.random() * 0.3).toFixed(3);
      var delta = +(2 * Math.PI * zeta / Math.sqrt(1 - zeta * zeta)).toFixed(4);
      return {
        prompt: 'A system has damping ratio \u03B6 = ' + zeta + '. Calculate the logarithmic decrement \u03B4.',
        steps: [
          '\u03B4 = 2\u03C0\u03B6 / \u221A(1 \u2212 \u03B6\u00B2)',
          '\u03B4 = 2\u03C0\u00D7' + zeta + ' / \u221A(1 \u2212 ' + (zeta * zeta).toFixed(6) + ')',
          '\u03B4 = ' + (2 * Math.PI * zeta).toFixed(4) + ' / ' + Math.sqrt(1 - zeta * zeta).toFixed(4),
          '\u03B4 = ' + delta
        ],
        answer: +delta, unit: '', tol: 0.01
      };
    },
    /* 10 — Critical damping coefficient */
    function () {
      var k = randInt(100, 500);
      var m = +(1 + Math.random() * 15).toFixed(1);
      var cc = +(2 * Math.sqrt(k * m)).toFixed(2);
      return {
        prompt: 'System: k = ' + k + ' N/m, m = ' + m + ' kg. Calculate the critical damping coefficient cc in Ns/m.',
        steps: [
          'cc = 2\u221A(km)',
          'cc = 2\u221A(' + k + '\u00D7' + m + ')',
          'cc = 2\u00D7' + Math.sqrt(k * m).toFixed(2),
          'cc = ' + cc + ' Ns/m'
        ],
        answer: +cc, unit: 'Ns/m', tol: 0.5
      };
    },
    /* 11 — Transmissibility */
    function () {
      var zeta = +(0.05 + Math.random() * 0.4).toFixed(2);
      var r = +(1.5 + Math.random() * 2).toFixed(2);
      var num = Math.sqrt(1 + Math.pow(2 * zeta * r, 2));
      var den = Math.sqrt(Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2));
      var TR = +(num / den).toFixed(4);
      return {
        prompt: 'System: \u03B6 = ' + zeta + ', r = ' + r + '. Calculate force transmissibility TR.',
        steps: [
          'TR = \u221A((1+(2\u03B6r)\u00B2)/((1\u2212r\u00B2)\u00B2+(2\u03B6r)\u00B2))',
          'Numerator\u00B2 = 1 + ' + Math.pow(2 * zeta * r, 2).toFixed(4),
          'Denominator\u00B2 = ' + (Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2)).toFixed(4),
          'TR = ' + TR
        ],
        answer: +TR, unit: '', tol: 0.01
      };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15)
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    {
      q: 'What is the critical damping ratio?',
      opts: ['\u03B6 = 0.5', '\u03B6 = 1', '\u03B6 = 2', '\u03B6 = \u221A2'],
      ans: 1
    },
    {
      q: 'Resonance occurs when:',
      opts: ['Damping is zero', 'Forcing frequency equals natural frequency', 'Mass equals spring constant', 'Phase angle is zero'],
      ans: 1
    },
    {
      q: 'Increasing damping in a forced vibration system:',
      opts: ['Increases resonance peak', 'Decreases resonance peak', 'Has no effect on amplitude', 'Increases natural frequency'],
      ans: 1
    },
    {
      q: 'Natural frequency depends on:',
      opts: ['Damping and mass', 'Spring constant and mass', 'Forcing frequency only', 'Initial displacement'],
      ans: 1
    },
    {
      q: 'An overdamped system (\u03B6 > 1) will:',
      opts: ['Oscillate indefinitely', 'Oscillate with decay', 'Return without oscillation (slowly)', 'Not return to equilibrium'],
      ans: 2
    },
    {
      q: 'For vibration isolation, the frequency ratio r must be:',
      opts: ['r < 1', 'r = 1', 'r > \u221A2', 'r = 0'],
      ans: 2
    },
    {
      q: 'The phase angle at resonance (r = 1) is always:',
      opts: ['0\u00B0', '45\u00B0', '90\u00B0', '180\u00B0'],
      ans: 2
    },
    {
      q: 'The logarithmic decrement measures:',
      opts: ['Natural frequency', 'Rate of amplitude decay', 'Phase angle', 'Forcing amplitude'],
      ans: 1
    },
    {
      q: 'The damped natural frequency \u03C9d is:',
      opts: ['Always greater than \u03C9n', 'Always less than \u03C9n (for \u03B6 < 1)', 'Equal to \u03C9n when \u03B6 = 1', 'Independent of damping'],
      ans: 1
    },
    {
      q: 'A tuned mass damper (TMD) works by:',
      opts: ['Increasing structural stiffness', 'Absorbing vibration energy at target frequency', 'Reducing building mass', 'Eliminating all frequencies'],
      ans: 1
    },
    /* Numeric 10-14 */
    {
      q: 'System: k = 400 N/m, m = 4 kg. Natural frequency \u03C9n (rad/s) =',
      type: 'numeric', ans: 10, tol: 0.1, unit: 'rad/s'
    },
    {
      q: 'System: m = 2 kg, k = 200 N/m, c = 8 Ns/m. Damping ratio \u03B6 =',
      type: 'numeric', ans: 0.2, tol: 0.01, unit: ''
    },
    {
      q: '\u03C9n = 10 rad/s, \u03B6 = 0.6. Damped frequency \u03C9d (rad/s) =',
      type: 'numeric', ans: 8, tol: 0.1, unit: 'rad/s'
    },
    {
      q: 'System: \u03B6 = 0.1, r = 1. Magnification factor M =',
      type: 'numeric', ans: 5, tol: 0.1, unit: ''
    },
    {
      q: 'k = 500 N/m, m = 5 kg. Period T (s) =',
      type: 'numeric', ans: 0.628, tol: 0.01, unit: 's'
    }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */

  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;

  /* DPR-aware canvas setup */
  var dpr = window.devicePixelRatio || 1;
  cvs.width = W * dpr;
  cvs.height = H * dpr;
  cvs.style.maxWidth = W + 'px';
  ctx.scale(dpr, dpr);

  var modeTabs = document.getElementById('mode-tabs');
  var vibTabs = document.getElementById('vib-tabs');
  var simPanel = document.getElementById('sim-panel');
  var catRow = document.getElementById('cat-row');
  var catTabs = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');

  var slMass = document.getElementById('sl-mass');
  var slK = document.getElementById('sl-k');
  var slC = document.getElementById('sl-c');
  var slWf = document.getElementById('sl-wf');
  var slF0 = document.getElementById('sl-f0');
  var slX0 = document.getElementById('sl-x0');
  var valMass = document.getElementById('val-mass');
  var valK = document.getElementById('val-k');
  var valC = document.getElementById('val-c');
  var valWf = document.getElementById('val-wf');
  var valF0 = document.getElementById('val-f0');
  var valX0 = document.getElementById('val-x0');

  var grpC = document.getElementById('grp-c');
  var grpWf = document.getElementById('grp-wf');
  var grpF0 = document.getElementById('grp-f0');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var vibType = 'free-undamped';
  var mass = 5, springK = 200, dampC = 5;
  var forcingW = 5, forceF0 = 20, initX0 = 0.5;
  var simTime = 0;
  var animRunning = true;
  var lastTimestamp = 0;
  var exploreCat = 'free', exploreItem = null;

  /* Waveform history buffer */
  var WAVE_SECONDS = 5;
  var waveHistory = [];

  /* Practice state */
  var pCorrect = 0, pTotal = 0, currentProblem = null, pAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswers = [], quizLocked = false;

  /* ================================================================
     HELPERS
     ================================================================ */

  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /* ================================================================
     PHYSICS — VIBRATION CALCULATIONS
     ================================================================ */

  function getWn() {
    return Math.sqrt(springK / mass);
  }

  function getZeta() {
    return dampC / (2 * Math.sqrt(springK * mass));
  }

  function getWd() {
    var z = getZeta();
    return z < 1 ? getWn() * Math.sqrt(1 - z * z) : 0;
  }

  function getFreqRatio() {
    var wn = getWn();
    return wn > 0 ? (forcingW * 2 * Math.PI) / wn : 0;
  }

  function getCriticalDamping() {
    return 2 * Math.sqrt(springK * mass);
  }

  function getMagnificationFactor() {
    var r = getFreqRatio();
    var z = getZeta();
    var denom = Math.sqrt(
      Math.pow(1 - r * r, 2) + Math.pow(2 * z * r, 2)
    );
    return denom > 0.001 ? 1 / denom : 500;
  }

  function getPhaseAngle() {
    var r = getFreqRatio();
    var z = getZeta();
    var num = 2 * z * r;
    var den = 1 - r * r;
    if (Math.abs(den) < 0.001) return 90;
    var phi = Math.atan2(num, den) * 180 / Math.PI;
    if (phi < 0) phi += 180;
    return phi;
  }

  /**
   * Calculate displacement at time t based on current vibration type.
   * Returns displacement in metres.
   */
  function displacement(t) {
    var wn = getWn();
    var zeta = getZeta();
    var A = initX0;

    if (vibType === 'free-undamped') {
      /* x(t) = A cos(\u03C9n t) */
      return A * Math.cos(wn * t);
    }

    if (vibType === 'free-damped') {
      if (zeta < 0.999) {
        /* Underdamped: x(t) = A e^(-\u03B6\u03C9n t) cos(\u03C9d t) */
        var wd = wn * Math.sqrt(1 - zeta * zeta);
        return A * Math.exp(-zeta * wn * t) * Math.cos(wd * t);
      } else if (zeta < 1.001) {
        /* Critically damped: x(t) = A(1 + \u03C9n t) e^(-\u03C9n t) */
        return A * (1 + wn * t) * Math.exp(-wn * t);
      } else {
        /* Overdamped: x(t) = C1 e^(s1 t) + C2 e^(s2 t) */
        var disc = Math.sqrt(zeta * zeta - 1);
        var s1 = wn * (-zeta + disc);
        var s2 = wn * (-zeta - disc);
        var C1 = A * s2 / (s2 - s1);
        var C2 = -A * s1 / (s2 - s1);
        return C1 * Math.exp(s1 * t) + C2 * Math.exp(s2 * t);
      }
    }

    if (vibType === 'forced') {
      /* Forced undamped */
      var w = forcingW * 2 * Math.PI;
      var r = wn > 0 ? w / wn : 0;
      var Xst = forceF0 / springK;

      if (Math.abs(1 - r * r) < 0.02) {
        /* Near resonance — growing oscillation (beat phenomenon) */
        var Xr = Xst * (wn * t / 2) * Math.sin(wn * t);
        return clamp(Xr, -2, 2);
      }

      var X = Xst / Math.abs(1 - r * r);
      X = Math.min(X, 2);

      /* Total response = particular + homogeneous (for initial conditions) */
      var xParticular = X * Math.cos(w * t);
      var xHomogeneous = (A - X) * Math.cos(wn * t);
      return xParticular + xHomogeneous;
    }

    if (vibType === 'forced-damped') {
      /* Forced damped — steady state + transient */
      var w2 = forcingW * 2 * Math.PI;
      var r2 = wn > 0 ? w2 / wn : 0;
      var Xst2 = forceF0 / springK;
      var denom = Math.sqrt(
        Math.pow(1 - r2 * r2, 2) + Math.pow(2 * zeta * r2, 2)
      );
      var X2 = denom > 0.001 ? Xst2 / denom : Xst2 * 50;
      X2 = Math.min(X2, 2);
      var phi = Math.atan2(2 * zeta * r2, 1 - r2 * r2);

      /* Steady-state */
      var xSS = X2 * Math.cos(w2 * t - phi);

      /* Transient (decays with damping) */
      var xTrans = 0;
      if (zeta < 0.999) {
        var wd2 = wn * Math.sqrt(1 - zeta * zeta);
        xTrans = A * Math.exp(-zeta * wn * t) * Math.cos(wd2 * t);
      }

      return xSS + xTrans;
    }

    return 0;
  }

  /**
   * Get the exponential decay envelope for damped vibrations.
   */
  function getEnvelope(t) {
    var wn = getWn();
    var zeta = getZeta();
    if (vibType === 'free-damped' && zeta < 1) {
      return initX0 * Math.exp(-zeta * wn * t);
    }
    return null;
  }

  /**
   * Detect resonance condition.
   */
  function isResonance() {
    if (vibType !== 'forced' && vibType !== 'forced-damped') return false;
    var wn = getWn();
    var w = forcingW * 2 * Math.PI;
    return wn > 0 && Math.abs(w / wn - 1) < 0.15;
  }

  /**
   * Get damping classification label.
   */
  function getDampingLabel() {
    var z = getZeta();
    if (vibType !== 'free-damped' && vibType !== 'forced-damped') return '';
    if (z < 0.999) return 'Underdamped (\u03B6 < 1)';
    if (z < 1.001) return 'Critically Damped (\u03B6 = 1)';
    return 'Overdamped (\u03B6 > 1)';
  }

  /* ================================================================
     READOUT UPDATES
     ================================================================ */

  function updateReadouts() {
    var wn = getWn();
    var zeta = getZeta();
    var T = wn > 0 ? 2 * Math.PI / wn : Infinity;
    var r = getFreqRatio();

    document.getElementById('r-wn').textContent = wn.toFixed(2);
    document.getElementById('r-zeta').textContent = zeta.toFixed(3);
    document.getElementById('r-period').textContent = T < 999 ? T.toFixed(3) : '\u221E';

    /* Amplitude calculation */
    var amp = initX0;
    if (vibType === 'forced' || vibType === 'forced-damped') {
      var Xst = forceF0 / springK;
      if (vibType === 'forced') {
        amp = Math.abs(1 - r * r) > 0.01
          ? Xst / Math.abs(1 - r * r)
          : Xst * 50;
      } else {
        var denom = Math.sqrt(
          Math.pow(1 - r * r, 2) + Math.pow(2 * zeta * r, 2)
        );
        amp = denom > 0.001 ? Xst / denom : Xst * 50;
      }
      amp = Math.min(amp, 10);
    }
    document.getElementById('r-amp').textContent = amp.toFixed(4);

    /* Phase angle */
    var phi = 0;
    if (vibType === 'forced-damped') {
      phi = getPhaseAngle();
    } else if (vibType === 'forced') {
      phi = r > 1 ? 180 : 0;
    }
    document.getElementById('r-phase').textContent = phi.toFixed(1);

    /* Frequency ratio */
    document.getElementById('r-ratio').textContent = r.toFixed(3);
  }

  /* ================================================================
     SLIDER SYNCHRONISATION
     ================================================================ */

  function syncSliders() {
    valMass.textContent = (+slMass.value).toFixed(1) + ' kg';
    valK.textContent = slK.value + ' N/m';
    valC.textContent = (+slC.value).toFixed(1) + ' Ns/m';
    valWf.textContent = (+slWf.value).toFixed(1) + ' Hz';
    valF0.textContent = (+slF0.value).toFixed(1) + ' N';
    valX0.textContent = (+slX0.value).toFixed(2) + ' m';

    mass = +slMass.value;
    springK = +slK.value;
    dampC = +slC.value;
    forcingW = +slWf.value;
    forceF0 = +slF0.value;
    initX0 = +slX0.value;

    resetSim();
    updateReadouts();
  }

  function resetSim() {
    simTime = 0;
    waveHistory = [];
  }

  function showHideSliders() {
    var hasDamping = vibType === 'free-damped' || vibType === 'forced-damped';
    var hasForcing = vibType === 'forced' || vibType === 'forced-damped';

    grpC.style.display = hasDamping ? 'flex' : 'none';
    grpWf.style.display = hasForcing ? 'flex' : 'none';
    grpF0.style.display = hasForcing ? 'flex' : 'none';
  }

  [slMass, slK, slC, slWf, slF0, slX0].forEach(function (sl) {
    sl.addEventListener('input', syncSliders);
  });

  /* ================================================================
     DRAWING — CONSTANTS & LAYOUT
     ================================================================ */

  var SYS_X = 180;        /* Centre X of the spring-mass system */
  var SYS_TOP = 50;       /* Top of fixed wall */
  var SYS_EQ_Y = 260;     /* Equilibrium Y position of mass centre */
  var MASS_W = 80;        /* Mass block width */
  var MASS_H = 50;        /* Mass block height */
  var SPRING_X = SYS_X - 22;   /* Spring centre X */
  var DAMPER_X = SYS_X + 22;   /* Damper centre X */
  var DISP_SCALE = 150;   /* Pixels per metre of displacement */

  /* Waveform chart region */
  var CHART_L = 340;
  var CHART_R = 875;
  var CHART_T = 60;
  var CHART_B = 460;
  var CHART_W_PX = CHART_R - CHART_L;
  var CHART_H_PX = CHART_B - CHART_T;
  var CHART_MID = CHART_T + CHART_H_PX / 2;

  /* ================================================================
     DRAWING — FIXED WALL / CEILING
     ================================================================ */

  function drawFixedWall() {
    var ww = 130;
    var x0 = SYS_X - ww / 2;
    var y0 = SYS_TOP - 8;

    /* Wall block */
    ctx.fillStyle = '#4a5578';
    ctx.fillRect(x0, y0, ww, 8);

    /* Hatch lines (cross-hatching above wall) */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var lx = x0 + 6 + i * 13;
      ctx.moveTo(lx, y0);
      ctx.lineTo(lx - 7, y0 - 10);
    }
    ctx.stroke();

    /* Wall bottom edge highlight */
    ctx.strokeStyle = '#5a6888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, SYS_TOP);
    ctx.lineTo(x0 + ww, SYS_TOP);
    ctx.stroke();
  }

  /* ================================================================
     DRAWING — ZIGZAG SPRING
     ================================================================ */

  function drawSpring(x, y1, y2) {
    var coils = 8;
    var len = y2 - y1;
    if (len < 20) len = 20;
    var segH = len / (coils * 2 + 2);
    var halfW = 16;

    ctx.beginPath();
    ctx.moveTo(x, y1);
    /* Lead-in segment */
    ctx.lineTo(x, y1 + segH);
    /* Zigzag coils */
    for (var i = 0; i < coils; i++) {
      var cy = y1 + segH + i * 2 * segH;
      var dir = (i % 2 === 0) ? 1 : -1;
      ctx.lineTo(x + dir * halfW, cy + segH);
      ctx.lineTo(x - dir * halfW, cy + 2 * segH);
    }
    /* Lead-out segment */
    ctx.lineTo(x, y2 - segH);
    ctx.lineTo(x, y2);

    ctx.strokeStyle = '#0288d1';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  /* ================================================================
     DRAWING — DASHPOT / DAMPER SYMBOL
     ================================================================ */

  function drawDamper(x, y1, y2) {
    var midY = (y1 + y2) / 2;
    var cylH = Math.min(45, (y2 - y1) * 0.35);
    var cylW = 22;
    var halfCyl = cylW / 2;

    /* Upper rod (wall to cylinder) */
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, midY - cylH / 2);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Cylinder body */
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      x - halfCyl,
      midY - cylH / 2,
      cylW,
      cylH
    );

    /* Fill cylinder slightly for depth */
    ctx.fillStyle = 'rgba(79,195,247,0.08)';
    ctx.fillRect(
      x - halfCyl,
      midY - cylH / 2,
      cylW,
      cylH
    );

    /* Piston head inside cylinder */
    var pistonFrac = clamp(
      (y2 - y1 - 80) / 200, 0.15, 0.85
    );
    var pistonY = midY - cylH / 2 + pistonFrac * cylH;
    pistonY = clamp(
      pistonY,
      midY - cylH / 2 + 4,
      midY + cylH / 2 - 4
    );
    ctx.beginPath();
    ctx.moveTo(x - halfCyl + 3, pistonY);
    ctx.lineTo(x + halfCyl - 3, pistonY);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    /* Lower rod (cylinder to mass) */
    ctx.beginPath();
    ctx.moveTo(x, midY + cylH / 2);
    ctx.lineTo(x, y2);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.lineCap = 'butt';
    ctx.stroke();
  }

  /* ================================================================
     DRAWING — MASS BLOCK
     ================================================================ */

  function drawMass(cx, cy) {
    var hw = MASS_W / 2;
    var hh = MASS_H / 2;

    /* Shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.roundRect(cx - hw + 3, cy - hh + 3, MASS_W, MASS_H, 6);
    ctx.fill();

    /* Main block */
    ctx.fillStyle = 'rgba(2,136,209,0.85)';
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - hw, cy - hh, MASS_W, MASS_H, 6);
    ctx.fill();
    ctx.stroke();

    /* Gradient overlay for 3D effect */
    var grad = ctx.createLinearGradient(
      cx - hw, cy - hh, cx - hw, cy + hh
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.12)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(cx - hw, cy - hh, MASS_W, MASS_H, 6);
    ctx.fill();

    /* Label */
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('m', cx, cy);
  }

  /* ================================================================
     DRAWING — EQUILIBRIUM LINE & DISPLACEMENT ARROW
     ================================================================ */

  function drawEquilibriumLine() {
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SYS_X - 95, SYS_EQ_Y);
    ctx.lineTo(SYS_X + 95, SYS_EQ_Y);
    ctx.stroke();
    ctx.restore();

    /* Label */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Eq.', SYS_X + 60, SYS_EQ_Y - 8);
  }

  function drawDisplacementArrow(massY) {
    var dy = massY - SYS_EQ_Y;
    if (Math.abs(dy) < 3) return;

    var arrowX = SYS_X + MASS_W / 2 + 22;

    /* Vertical line */
    ctx.beginPath();
    ctx.moveTo(arrowX, SYS_EQ_Y);
    ctx.lineTo(arrowX, massY);
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Arrow head */
    var dir = dy > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(arrowX, massY);
    ctx.lineTo(arrowX - 4, massY - dir * 8);
    ctx.lineTo(arrowX + 4, massY - dir * 8);
    ctx.closePath();
    ctx.fillStyle = '#ff5555';
    ctx.fill();

    /* Label */
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('x', arrowX + 8, (SYS_EQ_Y + massY) / 2);
  }

  /* ================================================================
     DRAWING — FORCE ARROW (FOR FORCED VIBRATIONS)
     ================================================================ */

  function drawForceArrow(massY) {
    if (vibType !== 'forced' && vibType !== 'forced-damped') return;

    var t = simTime;
    var w = forcingW * 2 * Math.PI;
    var f = forceF0 * Math.cos(w * t);
    if (Math.abs(f) < 0.5) return;

    var arrowX = SYS_X;
    var arrowLen = clamp(f * 1.5, -60, 60);
    var startY = massY + MASS_H / 2 + 5;
    var endY = startY + arrowLen;

    /* Arrow shaft */
    ctx.beginPath();
    ctx.moveTo(arrowX, startY);
    ctx.lineTo(arrowX, endY);
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Arrow head */
    var dir = arrowLen > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(arrowX, endY);
    ctx.lineTo(arrowX - 5, endY - dir * 9);
    ctx.lineTo(arrowX + 5, endY - dir * 9);
    ctx.closePath();
    ctx.fillStyle = '#f5c842';
    ctx.fill();

    /* Label */
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('F(t)', arrowX, endY + dir * 4);
  }

  /* ================================================================
     DRAWING — COMPLETE SPRING-MASS-DAMPER SYSTEM
     ================================================================ */

  function drawSystem() {
    var x = displacement(simTime);
    var massY = SYS_EQ_Y + clamp(x * DISP_SCALE, -170, 170);
    var topY = SYS_TOP;
    var botY = massY - MASS_H / 2;

    /* Fixed wall */
    drawFixedWall();

    /* Equilibrium reference */
    drawEquilibriumLine();

    /* Spring (left side) */
    drawSpring(SPRING_X, topY, botY);

    /* Damper or guide rod (right side) */
    if (vibType === 'free-damped' || vibType === 'forced-damped') {
      drawDamper(DAMPER_X, topY, botY);
    } else {
      /* Faint guide rod */
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(DAMPER_X, topY);
      ctx.lineTo(DAMPER_X, botY);
      ctx.stroke();
      ctx.restore();
    }

    /* Mass block */
    drawMass(SYS_X, massY);

    /* Displacement arrow */
    drawDisplacementArrow(massY);

    /* Force arrow */
    drawForceArrow(massY);

    /* Connection lines from spring/damper to mass */
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(SPRING_X, botY);
    ctx.lineTo(SYS_X - MASS_W / 2, massY - MASS_H / 2);
    ctx.stroke();
    if (vibType === 'free-damped' || vibType === 'forced-damped') {
      ctx.beginPath();
      ctx.moveTo(DAMPER_X, botY);
      ctx.lineTo(SYS_X + MASS_W / 2, massY - MASS_H / 2);
      ctx.stroke();
    }

    /* Component labels */
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0288d1';
    ctx.fillText('k', SPRING_X - 20, (topY + botY) / 2);

    if (vibType === 'free-damped' || vibType === 'forced-damped') {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4fc3f7';
      ctx.fillText('c', DAMPER_X + 22, (topY + botY) / 2);
    }

    /* Vibration type title */
    ctx.fillStyle = '#0288d1';
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var label = vibType.split('-').map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join(' ');
    ctx.fillText(label, SYS_X, CHART_B + 10);

    /* Damping classification */
    var dampLabel = getDampingLabel();
    if (dampLabel) {
      ctx.fillStyle = '#4fc3f7';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.fillText(dampLabel, SYS_X, CHART_B + 28);
    }

    /* Resonance warning */
    if (isResonance()) {
      var alpha = 0.4 + 0.6 * Math.abs(Math.sin(simTime * 6));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ff5555';
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('\u26A0 RESONANCE', SYS_X, SYS_TOP - 30);
      ctx.globalAlpha = 1;

      /* Red glow around mass */
      ctx.save();
      ctx.shadowColor = '#ff5555';
      ctx.shadowBlur = 15 + 10 * Math.sin(simTime * 8);
      ctx.strokeStyle = 'rgba(255,85,85,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        SYS_X - MASS_W / 2 - 4,
        massY - MASS_H / 2 - 4,
        MASS_W + 8,
        MASS_H + 8,
        8
      );
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ================================================================
     DRAWING — WAVEFORM CHART (RIGHT SIDE)
     ================================================================ */

  function drawWaveformBackground() {
    /* Chart background */
    ctx.fillStyle = 'rgba(13,17,23,0.55)';
    ctx.beginPath();
    ctx.roundRect(CHART_L - 15, CHART_T - 28, CHART_W_PX + 40, CHART_H_PX + 65, 10);
    ctx.fill();

    /* Border */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(CHART_L - 15, CHART_T - 28, CHART_W_PX + 40, CHART_H_PX + 65, 10);
    ctx.stroke();
  }

  function drawWaveformGrid() {
    /* Horizontal grid lines */
    ctx.strokeStyle = 'rgba(42,48,80,0.6)';
    ctx.lineWidth = 0.5;
    for (var gy = 0; gy <= 4; gy++) {
      var yy = CHART_T + gy * CHART_H_PX / 4;
      ctx.beginPath();
      ctx.moveTo(CHART_L, yy);
      ctx.lineTo(CHART_R, yy);
      ctx.stroke();
    }

    /* Vertical grid lines */
    for (var gx = 0; gx <= 5; gx++) {
      var xx = CHART_L + gx * CHART_W_PX / 5;
      ctx.beginPath();
      ctx.moveTo(xx, CHART_T);
      ctx.lineTo(xx, CHART_B);
      ctx.stroke();
    }
  }

  function drawWaveformAxes() {
    /* Y axis line */
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(CHART_L, CHART_T - 5);
    ctx.lineTo(CHART_L, CHART_B + 5);
    ctx.stroke();

    /* Zero / equilibrium line */
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CHART_L, CHART_MID);
    ctx.lineTo(CHART_R, CHART_MID);
    ctx.stroke();
    ctx.restore();

    /* Axis labels */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '11px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Time (s)', (CHART_L + CHART_R) / 2, CHART_B + 22);

    /* Y axis label (rotated) */
    ctx.save();
    ctx.translate(CHART_L - 35, CHART_MID);
    ctx.rotate(-Math.PI / 2);
    ctx.textBaseline = 'middle';
    ctx.fillText('x (m)', 0, 0);
    ctx.restore();

    /* Title */
    ctx.fillStyle = '#0288d1';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Displacement vs Time', (CHART_L + CHART_R) / 2, CHART_T - 10);
  }

  function drawEnvelopeCurves(tStart, maxVal) {
    if (vibType !== 'free-damped' || getZeta() >= 1) return;
    if (waveHistory.length < 2) return;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(79,195,247,0.5)';
    ctx.lineWidth = 1.2;

    /* Upper envelope (+) */
    ctx.beginPath();
    var started = false;
    for (var i = 0; i < waveHistory.length; i++) {
      var et = waveHistory[i].t;
      var env = getEnvelope(et);
      if (env === null) continue;
      var relT = (et - tStart) / WAVE_SECONDS;
      if (relT < 0 || relT > 1) continue;
      var ex = CHART_L + relT * CHART_W_PX;
      var ey = CHART_MID - (env / maxVal) * (CHART_H_PX / 2);
      if (!started) { ctx.moveTo(ex, ey); started = true; }
      else { ctx.lineTo(ex, ey); }
    }
    ctx.stroke();

    /* Lower envelope (-) */
    ctx.beginPath();
    started = false;
    for (var j = 0; j < waveHistory.length; j++) {
      var et2 = waveHistory[j].t;
      var env2 = getEnvelope(et2);
      if (env2 === null) continue;
      var relT2 = (et2 - tStart) / WAVE_SECONDS;
      if (relT2 < 0 || relT2 > 1) continue;
      var ex2 = CHART_L + relT2 * CHART_W_PX;
      var ey2 = CHART_MID + (env2 / maxVal) * (CHART_H_PX / 2);
      if (!started) { ctx.moveTo(ex2, ey2); started = true; }
      else { ctx.lineTo(ex2, ey2); }
    }
    ctx.stroke();

    ctx.restore();
  }

  function drawPeriodMarkers(tStart) {
    var wn = getWn();
    if (wn <= 0) return;
    if (vibType !== 'free-undamped'
      && !(vibType === 'free-damped' && getZeta() < 1)) return;

    var freq = vibType === 'free-damped' ? getWd() : wn;
    if (freq <= 0) return;
    var period = 2 * Math.PI / freq;
    if (period <= 0) return;

    ctx.save();
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = 'rgba(245,200,66,0.25)';
    ctx.lineWidth = 1;

    var firstT = Math.ceil(tStart / period) * period;
    for (var pt = firstT; pt <= tStart + WAVE_SECONDS; pt += period) {
      var rel = (pt - tStart) / WAVE_SECONDS;
      if (rel < 0 || rel > 1) continue;
      var px = CHART_L + rel * CHART_W_PX;
      ctx.beginPath();
      ctx.moveTo(px, CHART_T);
      ctx.lineTo(px, CHART_B);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWaveformTrace(tStart, maxVal) {
    if (waveHistory.length < 2) return;

    /* Glow layer */
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(2,136,209,0.35)';
    ctx.lineWidth = 5;
    var first = true;
    for (var g = 0; g < waveHistory.length; g++) {
      var wp = waveHistory[g];
      var rel = (wp.t - tStart) / WAVE_SECONDS;
      if (rel < 0 || rel > 1) continue;
      var gx = CHART_L + rel * CHART_W_PX;
      var gy = CHART_MID - (wp.y / maxVal) * (CHART_H_PX / 2);
      gy = clamp(gy, CHART_T, CHART_B);
      if (first) { ctx.moveTo(gx, gy); first = false; }
      else { ctx.lineTo(gx, gy); }
    }
    ctx.stroke();

    /* Main trace */
    ctx.beginPath();
    ctx.strokeStyle = '#0288d1';
    ctx.lineWidth = 2;
    first = true;
    for (var i = 0; i < waveHistory.length; i++) {
      var wp2 = waveHistory[i];
      var rel2 = (wp2.t - tStart) / WAVE_SECONDS;
      if (rel2 < 0 || rel2 > 1) continue;
      var wx = CHART_L + rel2 * CHART_W_PX;
      var wy = CHART_MID - (wp2.y / maxVal) * (CHART_H_PX / 2);
      wy = clamp(wy, CHART_T, CHART_B);
      if (first) { ctx.moveTo(wx, wy); first = false; }
      else { ctx.lineTo(wx, wy); }
    }
    ctx.stroke();
  }

  function drawWaveformLabels(tStart, maxVal) {
    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px Courier New, monospace';

    /* Y scale labels */
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('+' + maxVal.toFixed(2), CHART_L - 5, CHART_T + 6);
    ctx.fillText('-' + maxVal.toFixed(2), CHART_L - 5, CHART_B - 2);
    ctx.fillText('0', CHART_L - 5, CHART_MID);

    /* Time labels along X axis */
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    var tEnd = tStart + WAVE_SECONDS;
    for (var ti = 0; ti <= 5; ti++) {
      var tVal = tStart + ti * WAVE_SECONDS / 5;
      if (tVal < 0) continue;
      var tx = CHART_L + ti * CHART_W_PX / 5;
      ctx.fillText(tVal.toFixed(1), tx, CHART_B + 4);
    }
  }

  function drawWaveformChart() {
    drawWaveformBackground();
    drawWaveformGrid();
    drawWaveformAxes();

    if (waveHistory.length < 2) return;

    /* Determine Y scale from history */
    var maxVal = 0.01;
    for (var i = 0; i < waveHistory.length; i++) {
      var av = Math.abs(waveHistory[i].y);
      if (av > maxVal) maxVal = av;
    }
    maxVal *= 1.25; /* Add 25% headroom */

    var tEnd = waveHistory[waveHistory.length - 1].t;
    var tStart = tEnd - WAVE_SECONDS;

    drawWaveformLabels(tStart, maxVal);
    drawEnvelopeCurves(tStart, maxVal);
    drawPeriodMarkers(tStart);
    drawWaveformTrace(tStart, maxVal);
  }

  /* ================================================================
     MAIN DRAW FUNCTION (pure render, no state mutation)
     ================================================================ */

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Background fill */
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    /* Vertical divider */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(315, 25);
    ctx.lineTo(315, H - 25);
    ctx.stroke();

    /* Left: animated system */
    drawSystem();

    /* Right: waveform chart */
    drawWaveformChart();
  }

  /* ================================================================
     ANIMATION LOOP (requestAnimationFrame)
     ================================================================ */

  function tick(timestamp) {
    if (!animRunning) {
      requestAnimationFrame(tick);
      return;
    }

    if (lastTimestamp === 0) lastTimestamp = timestamp;
    var dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    /* Cap deltaTime to avoid huge jumps */
    if (dt > 0.1) dt = 0.016;

    if (mode === 'simulate') {
      simTime += dt;

      /* Sample displacement and push to waveform buffer */
      var y = displacement(simTime);
      waveHistory.push({ t: simTime, y: y });

      /* Trim old data outside visible window */
      var cutoff = simTime - WAVE_SECONDS - 0.5;
      while (waveHistory.length > 0 && waveHistory[0].t < cutoff) {
        waveHistory.shift();
      }

      draw();
      updateReadouts();
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function setMode(newMode) {
    mode = newMode;

    /* Update tab active state */
    modeTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === mode);
    });

    /* Show/hide panels */
    simPanel.style.display = mode === 'simulate' ? '' : 'none';
    catRow.style.display = mode === 'explore' ? '' : 'none';
    itemSelector.style.display = mode === 'explore' ? '' : 'none';
    itemInfo.style.display = (mode === 'explore' && exploreItem) ? '' : 'none';
    practicePanel.style.display = mode === 'practice' ? '' : 'none';
    practiceBar.style.display = mode === 'practice' ? '' : 'none';
    quizPanel.style.display = mode === 'quiz' ? '' : 'none';
    quizBar.style.display = mode === 'quiz' ? '' : 'none';
    quizResult.style.display = 'none';

    /* Mode-specific initialisation */
    if (mode === 'explore') buildConceptGrid();
    if (mode === 'practice' && !currentProblem) generateProblem();
    if (mode === 'quiz' && quizSet.length === 0) startQuiz();
    if (mode === 'simulate') resetSim();
  }

  modeTabs.addEventListener('click', function (e) {
    var p = e.target.closest('.pill');
    if (p && p.dataset.mode) setMode(p.dataset.mode);
  });

  /* ================================================================
     VIBRATION TYPE TABS
     ================================================================ */

  vibTabs.addEventListener('click', function (e) {
    var p = e.target.closest('.pill');
    if (!p || !p.dataset.vib) return;

    vibType = p.dataset.vib;
    vibTabs.querySelectorAll('.pill').forEach(function (b) {
      b.classList.toggle('active', b.dataset.vib === vibType);
    });

    showHideSliders();
    resetSim();
    updateReadouts();
  });

  /* ================================================================
     PRESETS
     ================================================================ */

  var PRESETS = {
    car: {
      m: 20, k: 500, c: 50, wf: 2, f0: 50, x0: 0.1,
      vib: 'forced-damped', label: 'Car Suspension'
    },
    bridge: {
      m: 20, k: 200, c: 1, wf: 0, f0: 50, x0: 0.5,
      vib: 'forced', label: 'Bridge Resonance'
    },
    fork: {
      m: 0.5, k: 500, c: 0.1, wf: 0, f0: 0, x0: 0.2,
      vib: 'free-damped', label: 'Tuning Fork'
    },
    quake: {
      m: 20, k: 100, c: 50, wf: 1, f0: 80, x0: 0.3,
      vib: 'forced-damped', label: 'Earthquake Damper'
    }
  };

  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.preset;
      var p = PRESETS[key];
      if (!p) return;

      /* Apply preset values to sliders */
      slMass.value = p.m;
      slK.value = p.k;
      slC.value = p.c;
      slWf.value = p.wf;
      slF0.value = p.f0;
      slX0.value = p.x0;

      /* Set vibration type */
      vibType = p.vib;
      vibTabs.querySelectorAll('.pill').forEach(function (b) {
        b.classList.toggle('active', b.dataset.vib === vibType);
      });

      /* Highlight active preset */
      document.querySelectorAll('.preset-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      showHideSliders();
      syncSliders();

      /* Special: Bridge Resonance sets forcing freq to natural freq */
      if (key === 'bridge') {
        var wn = getWn();
        var fHz = wn / (2 * Math.PI);
        slWf.value = fHz.toFixed(1);
        syncSliders();
      }
    });
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  function buildConceptGrid() {
    var items = CONCEPTS.filter(function (c) {
      return c.cat === exploreCat;
    });

    conceptGrid.innerHTML = '';
    items.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (exploreItem && exploreItem.id === c.id ? ' active' : '');
      btn.innerHTML =
        '<span class="is-btn-name">' + c.name + '</span>' +
        '<span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selectConcept(c);
      });
      conceptGrid.appendChild(btn);
    });
  }

  function selectConcept(c) {
    exploreItem = c;
    buildConceptGrid();

    itemInfo.style.display = '';
    var html = '';
    html += '<div class="ii-top">';
    html += '<span class="ii-name">' + c.name + '</span>';
    html += '<span class="ii-cat-badge">' + c.cat + '</span>';
    html += '</div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box">';
    html += '<span class="fb-formula">' + c.formula + '</span>';
    html += '<span class="fb-unit">' + c.unit + '</span>';
    html += '</div>';

    if (c.example) {
      html += '<div class="example-box">';
      html += '<h4>Example Calculation</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step"><strong>' + s + '</strong></p>';
      });
      html += '</div>';
    }

    itemInfo.innerHTML = html;
  }

  catTabs.addEventListener('click', function (e) {
    var p = e.target.closest('.pill');
    if (!p || !p.dataset.cat) return;

    exploreCat = p.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (b) {
      b.classList.toggle('active', b.dataset.cat === exploreCat);
    });

    exploreItem = null;
    itemInfo.style.display = 'none';
    buildConceptGrid();
  });

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function generateProblem() {
    pAnswered = false;
    var idx = randInt(0, PROBLEM_GEN.length - 1);
    currentProblem = PROBLEM_GEN[idx]();

    document.getElementById('pp-prompt').textContent = currentProblem.prompt;
    document.getElementById('pp-unit').textContent = currentProblem.unit;
    document.getElementById('pp-input').value = '';
    document.getElementById('pp-feedback').textContent = '';
    document.getElementById('pp-feedback').className = 'feedback';
    document.getElementById('pp-solution').style.display = 'none';
    document.getElementById('pp-next').style.display = 'none';
  }

  document.getElementById('pp-check').addEventListener('click', function () {
    if (pAnswered || !currentProblem) return;
    pAnswered = true;
    pTotal++;

    var val = parseFloat(document.getElementById('pp-input').value);
    var fb = document.getElementById('pp-feedback');
    var tol = currentProblem.tol || 0.5;
    var correct = !isNaN(val) && Math.abs(val - currentProblem.answer) <= tol;

    if (correct) {
      pCorrect++;
      fb.textContent = '\u2713 Correct!';
      fb.className = 'feedback ok';
    } else {
      fb.textContent = '\u2717 Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      fb.className = 'feedback err';
    }

    document.getElementById('pbar-score-val').textContent = pCorrect + ' / ' + pTotal;

    /* Show step-by-step solution */
    var sol = document.getElementById('pp-solution');
    sol.style.display = '';
    sol.innerHTML = '<h4>Solution</h4>' +
      currentProblem.steps
        .filter(function (s) { return s; })
        .map(function (s) {
          return '<p class="sol-step"><strong>' + s + '</strong></p>';
        }).join('');

    document.getElementById('pp-next').style.display = '';
  });

  document.getElementById('pp-next').addEventListener('click', generateProblem);

  document.getElementById('pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (pAnswered) generateProblem();
      else document.getElementById('pp-check').click();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  function startQuiz() {
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizLocked = false;
    quizSet = shuffle(QUIZ_POOL.slice()).slice(0, QUIZ_SIZE);
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    renderQuizQ();
  }

  function renderQuizQ() {
    if (quizIdx >= quizSet.length) {
      showQuizResult();
      return;
    }

    var q = quizSet[quizIdx];
    document.getElementById('qbar-num').textContent = quizIdx + 1;
    quizLocked = false;

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.q + '</p>';

    if (q.type === 'numeric') {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer">';
      html += '<span class="qi-unit">' + (q.unit || '') + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
      html += '<p class="quiz-feedback" id="qi-fb"></p>';
    } else {
      html += '<div class="answer-grid">';
      q.opts.forEach(function (opt, i) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>';
      });
      html += '</div>';
    }

    quizPanel.innerHTML = html;

    /* Bind events for this question */
    if (q.type === 'numeric') {
      var submitBtn = document.getElementById('qi-submit');
      var inputEl = document.getElementById('qi-input');

      submitBtn.addEventListener('click', function () {
        if (quizLocked) return;
        quizLocked = true;

        var val = parseFloat(inputEl.value);
        var correct = !isNaN(val) && Math.abs(val - q.ans) <= (q.tol || 0.5);
        var fb = document.getElementById('qi-fb');

        if (correct) {
          quizScore++;
          fb.textContent = '\u2713 Correct!';
          fb.className = 'quiz-feedback ok';
        } else {
          fb.textContent = '\u2717 Answer: ' + q.ans + ' ' + (q.unit || '');
          fb.className = 'quiz-feedback err';
        }

        quizAnswers.push({
          q: q.q, correct: correct,
          given: val, answer: q.ans
        });

        setTimeout(function () {
          quizIdx++;
          renderQuizQ();
        }, 1200);
      });

      inputEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitBtn.click();
      });
    } else {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizLocked) return;
          quizLocked = true;

          var chosen = +btn.dataset.idx;
          var correct = chosen === q.ans;

          if (correct) {
            quizScore++;
            btn.classList.add('correct');
          } else {
            btn.classList.add('wrong');
            quizPanel.querySelectorAll('.answer-btn')[q.ans]
              .classList.add('correct');
          }

          quizPanel.querySelectorAll('.answer-btn').forEach(function (b) {
            b.classList.add('locked');
          });

          quizAnswers.push({
            q: q.q, correct: correct,
            given: q.opts[chosen], answer: q.opts[q.ans]
          });

          setTimeout(function () {
            quizIdx++;
            renderQuizQ();
          }, 1200);
        });
      });
    }
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = Math.round(quizScore / QUIZ_SIZE * 100);
    var grade = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';

    /* Star rating */
    var starCount = Math.round(quizScore / QUIZ_SIZE * 5);
    var stars = '';
    for (var s = 0; s < 5; s++) {
      stars += s < starCount ? '\u2605' : '\u2606';
    }

    var verdict = pct === 100 ? 'Flawless!'
      : pct >= 80 ? 'Excellent work!'
      : pct >= 60 ? 'Good effort!'
      : 'Keep practising!';

    var html = '';
    html += '<div class="qr-header">';
    html += '<div class="qr-title-wrap">';
    html += '<span class="qr-title">Quiz Complete</span>';
    html += '<span class="qr-stars">' + stars + '</span>';
    html += '</div>';
    html += '<div class="qr-score-wrap">';
    html += '<span class="qr-score ' + grade + '">' + pct + '%</span>';
    html += '<p class="qr-verdict">' + verdict + '</p>';
    html += '</div></div>';

    html += '<div class="qr-rows">';
    quizAnswers.forEach(function (a, i) {
      var cls = a.correct ? 'ok' : 'err';
      var mark = a.correct ? '\u2713' : '\u2717';
      html += '<div class="qr-row ' + cls + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + a.q + '</strong></span>';
      html += '<span class="qr-mark">' + mark + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="quiz-retry">Retry Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     CANVAS POINTER EVENTS
     ================================================================ */

  cvs.addEventListener('pointerdown', function (e) {
    e.preventDefault();
  });

  cvs.addEventListener('touchstart', function (e) {
    e.preventDefault();
  }, { passive: false });

  /* ================================================================
     INITIALISATION
     ================================================================ */

  showHideSliders();
  syncSliders();
  updateReadouts();
  setMode('simulate');

})();
