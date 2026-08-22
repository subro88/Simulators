/* ═══════════════════════════════════════════════════════════════
   SHM Simulator — app.js
   Simple Harmonic Motion: Spring-Mass & Pendulum
   Modes: Simulate | Explore | Practice | Quiz
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. DOM REFS
     ────────────────────────────────────────────────────────── */
  var canvas  = document.getElementById('sim-canvas');
  var ctx     = canvas.getContext('2d');
  var ciCanvas = document.getElementById('ci-canvas');
  var ciCtx    = ciCanvas.getContext('2d');

  // Mode tabs
  var modeTabs = document.getElementById('mode-tabs');
  var panels   = {
    simulate: document.getElementById('panel-simulate'),
    explore:  document.getElementById('panel-explore'),
    practice: document.getElementById('panel-practice'),
    quiz:     document.getElementById('panel-quiz')
  };

  // System & graph tabs
  var sysTabs   = document.getElementById('sys-tabs');
  var graphTabs = document.getElementById('graph-tabs');

  // Sliders
  var slMass      = document.getElementById('sl-mass');
  var slSpring    = document.getElementById('sl-spring');
  var slLength    = document.getElementById('sl-length');
  var slAmplitude = document.getElementById('sl-amplitude');
  var valMass     = document.getElementById('val-mass');
  var valSpring   = document.getElementById('val-spring');
  var valLength   = document.getElementById('val-length');
  var valAmplitude= document.getElementById('val-amplitude');

  var grpSpring = document.getElementById('grp-spring');
  var grpLength = document.getElementById('grp-length');

  // Readouts
  var roOmega  = document.getElementById('ro-omega');
  var roFreq   = document.getElementById('ro-freq');
  var roPeriod = document.getElementById('ro-period');
  var roDisp   = document.getElementById('ro-disp');
  var roVel    = document.getElementById('ro-vel');
  var roAcc    = document.getElementById('ro-acc');

  // Practice
  var pracPrompt   = document.getElementById('prac-prompt');
  var pracInput    = document.getElementById('prac-input');
  var pracUnit     = document.getElementById('prac-unit');
  var pracFeedback = document.getElementById('prac-feedback');
  var pracSolution = document.getElementById('prac-solution');
  var solSteps     = document.getElementById('sol-steps');
  var pracScoreEl  = document.getElementById('prac-score');
  var btnCheck     = document.getElementById('btn-check');
  var btnNextPrac  = document.getElementById('btn-next-prac');
  var btnShowSol   = document.getElementById('btn-show-sol');

  // Quiz
  var quizPanel    = document.getElementById('quiz-panel');
  var quizQuestion = document.getElementById('quiz-question');
  var quizOptions  = document.getElementById('quiz-options');
  var quizInputRow = document.getElementById('quiz-input-row');
  var quizInput    = document.getElementById('quiz-input');
  var quizUnitEl   = document.getElementById('quiz-unit');
  var quizFeedback = document.getElementById('quiz-feedback');
  var quizCounter  = document.getElementById('quiz-counter');
  var quizResult   = document.getElementById('quiz-result');
  var qrScore      = document.getElementById('qr-score');
  var qrStars      = document.getElementById('qr-stars');
  var qrBreakdown  = document.getElementById('qr-breakdown');
  var btnSubmitQuiz= document.getElementById('btn-submit-quiz');
  var btnNextQuiz  = document.getElementById('btn-next-quiz');
  var btnNewQuiz   = document.getElementById('btn-new-quiz');

  // Explore
  var exploreTabs  = document.getElementById('explore-tabs');
  var conceptGrid  = document.getElementById('concept-grid');
  var conceptInfo  = document.getElementById('concept-info');
  var ciName       = document.getElementById('ci-name');
  var ciSymbol     = document.getElementById('ci-symbol');
  var ciFormula    = document.getElementById('ci-formula');
  var ciUnit       = document.getElementById('ci-unit');
  var ciDesc       = document.getElementById('ci-desc');
  var ciSteps      = document.getElementById('ci-steps');
  var ciAnswer     = document.getElementById('ci-answer');

  /* ──────────────────────────────────────────────────────────
     2. STATE
     ────────────────────────────────────────────────────────── */
  var mode      = 'simulate';
  var sysType   = 'spring';      // 'spring' | 'pendulum'
  var graphType = 'displacement'; // 'displacement' | 'velocity' | 'acceleration' | 'energy'

  var mass      = 2.0;   // kg
  var springK   = 50;    // N/m
  var pendulumL = 1.0;   // m
  var amplitude = 0.2;   // m

  var G = 9.81;

  var simTime = 0;
  var waveHistory = [];
  var animRunning = true;
  var lastTimestamp = 0;

  // Practice state
  var currentProblem = null;
  var pracCorrect = 0;
  var pracTotal   = 0;
  var pracAnswered = false;

  // Quiz state
  var QUIZ_SIZE  = 5;
  var quizSet    = [];
  var quizIdx    = 0;
  var quizScore  = 0;
  var quizAnswered = false;

  // Explore state
  var exploreCat = 'fundamentals';
  var activeConcept = null;

  /* ──────────────────────────────────────────────────────────
     3. PHYSICS
     ────────────────────────────────────────────────────────── */
  function getOmega() {
    return sysType === 'spring'
      ? Math.sqrt(springK / mass)
      : Math.sqrt(G / pendulumL);
  }
  function getFrequency() { return getOmega() / (2 * Math.PI); }
  function getPeriod()    { return 1 / getFrequency(); }

  function displacement(t) { return amplitude * Math.cos(getOmega() * t); }
  function velocity(t)     { return -amplitude * getOmega() * Math.sin(getOmega() * t); }
  function acceleration(t) { return -amplitude * getOmega() * getOmega() * Math.cos(getOmega() * t); }

  function kineticEnergy(t) {
    var v = velocity(t);
    return 0.5 * mass * v * v;
  }
  function potentialEnergy(t) {
    var x = displacement(t);
    if (sysType === 'spring') return 0.5 * springK * x * x;
    return 0.5 * mass * G / pendulumL * x * x;
  }
  function totalEnergy() {
    if (sysType === 'spring') return 0.5 * springK * amplitude * amplitude;
    return 0.5 * mass * (getOmega() * getOmega()) * amplitude * amplitude;
  }

  /* ──────────────────────────────────────────────────────────
     4. CONCEPTS DATA (Explore mode)
     ────────────────────────────────────────────────────────── */
  var CONCEPTS = [
    // ── Fundamentals ──
    {
      id: 'displacement', name: 'Displacement', symbol: 'x(t)',
      formula: 'x(t) = A cos(\u03c9t + \u03c6)', unit: 'm',
      cat: 'fundamentals',
      desc: 'Displacement in SHM is the distance and direction of the oscillating body from its equilibrium position at any instant. It varies sinusoidally with time, reaching maximum values of +A and \u2212A at the extremes of motion.',
      example: {
        text: 'A 2 kg mass on a spring (k = 50 N/m) is released from 0.1 m. Find displacement at t = 0.5 s.',
        steps: [
          '\u03c9 = \u221a(k/m) = \u221a(50/2) = 5.00 rad/s',
          'x(0.5) = 0.1 \u00d7 cos(5.00 \u00d7 0.5)',
          'x(0.5) = 0.1 \u00d7 cos(2.50)',
          'x(0.5) = 0.1 \u00d7 (\u22120.801) = \u22120.0801 m'
        ],
        answer: 'x = \u22120.080 m'
      }
    },
    {
      id: 'velocity', name: 'Velocity', symbol: 'v(t)',
      formula: 'v(t) = \u2212A\u03c9 sin(\u03c9t + \u03c6)', unit: 'm/s',
      cat: 'fundamentals',
      desc: 'Velocity in SHM is the rate of change of displacement. It leads displacement by 90\u00b0 (or \u03c0/2 radians). Maximum velocity v_max = A\u03c9 occurs at the equilibrium position where displacement is zero.',
      example: {
        text: 'For A = 0.2 m, \u03c9 = 4 rad/s, find the maximum velocity.',
        steps: [
          'v_max = A\u03c9',
          'v_max = 0.2 \u00d7 4',
          'v_max = 0.8 m/s'
        ],
        answer: 'v_max = 0.80 m/s'
      }
    },
    {
      id: 'acceleration', name: 'Acceleration', symbol: 'a(t)',
      formula: 'a(t) = \u2212\u03c9\u00b2x(t) = \u2212A\u03c9\u00b2 cos(\u03c9t)', unit: 'm/s\u00b2',
      cat: 'fundamentals',
      desc: 'Acceleration in SHM is always proportional to displacement and directed towards the equilibrium position. This is the defining characteristic of SHM: a = \u2212\u03c9\u00b2x. Maximum acceleration a_max = A\u03c9\u00b2 occurs at maximum displacement.',
      example: {
        text: 'A = 0.15 m, k = 80 N/m, m = 2 kg. Find maximum acceleration.',
        steps: [
          '\u03c9 = \u221a(k/m) = \u221a(80/2) = \u221a40 = 6.32 rad/s',
          'a_max = A\u03c9\u00b2 = 0.15 \u00d7 40',
          'a_max = 6.00 m/s\u00b2'
        ],
        answer: 'a_max = 6.00 m/s\u00b2'
      }
    },
    {
      id: 'angular-freq', name: 'Angular Frequency', symbol: '\u03c9',
      formula: '\u03c9 = \u221a(k/m)  or  \u03c9 = \u221a(g/L)', unit: 'rad/s',
      cat: 'fundamentals',
      desc: 'Angular frequency \u03c9 determines how quickly the oscillation repeats. For a spring-mass system, \u03c9 = \u221a(k/m), depending on spring stiffness and mass. For a simple pendulum, \u03c9 = \u221a(g/L), depending only on length and gravity.',
      example: {
        text: 'A pendulum has length L = 0.5 m. Find angular frequency (g = 9.81 m/s\u00b2).',
        steps: [
          '\u03c9 = \u221a(g/L)',
          '\u03c9 = \u221a(9.81/0.5)',
          '\u03c9 = \u221a19.62 = 4.43 rad/s'
        ],
        answer: '\u03c9 = 4.43 rad/s'
      }
    },
    {
      id: 'period', name: 'Period', symbol: 'T',
      formula: 'T = 2\u03c0/\u03c9 = 2\u03c0\u221a(m/k)', unit: 's',
      cat: 'fundamentals',
      desc: 'The period T is the time for one complete oscillation cycle. For a spring-mass system, T = 2\u03c0\u221a(m/k). For a simple pendulum, T = 2\u03c0\u221a(L/g). Period is independent of amplitude in ideal SHM.',
      example: {
        text: 'Find the period of a 3 kg mass on a spring with k = 75 N/m.',
        steps: [
          'T = 2\u03c0\u221a(m/k)',
          'T = 2\u03c0\u221a(3/75)',
          'T = 2\u03c0\u221a(0.04)',
          'T = 2\u03c0 \u00d7 0.2 = 1.257 s'
        ],
        answer: 'T = 1.26 s'
      }
    },
    // ── Energy ──
    {
      id: 'kinetic', name: 'Kinetic Energy', symbol: 'KE',
      formula: 'KE = \u00bdmv\u00b2 = \u00bdm\u03c9\u00b2(A\u00b2 \u2212 x\u00b2)', unit: 'J',
      cat: 'energy',
      desc: 'Kinetic energy in SHM is maximum at the equilibrium position (x = 0) where velocity is greatest, and zero at the extreme positions where the mass momentarily stops. KE_max = \u00bdmA\u00b2\u03c9\u00b2.',
      example: {
        text: 'm = 2 kg, k = 50 N/m, A = 0.2 m. Find maximum kinetic energy.',
        steps: [
          'KE_max = \u00bdkA\u00b2',
          'KE_max = \u00bd \u00d7 50 \u00d7 0.2\u00b2',
          'KE_max = \u00bd \u00d7 50 \u00d7 0.04',
          'KE_max = 1.00 J'
        ],
        answer: 'KE_max = 1.00 J'
      }
    },
    {
      id: 'potential', name: 'Potential Energy', symbol: 'PE',
      formula: 'PE = \u00bdkx\u00b2', unit: 'J',
      cat: 'energy',
      desc: 'Potential energy in SHM is stored in the spring (elastic PE) or as gravitational PE in a pendulum. It is maximum at extreme displacement and zero at equilibrium. PE_max = \u00bdkA\u00b2 equals the total energy.',
      example: {
        text: 'k = 100 N/m, x = 0.05 m. Find PE at this displacement.',
        steps: [
          'PE = \u00bdkx\u00b2',
          'PE = \u00bd \u00d7 100 \u00d7 0.05\u00b2',
          'PE = \u00bd \u00d7 100 \u00d7 0.0025',
          'PE = 0.125 J'
        ],
        answer: 'PE = 0.125 J'
      }
    },
    {
      id: 'total-energy', name: 'Total Energy', symbol: 'E',
      formula: 'E = \u00bdkA\u00b2 = \u00bdm\u03c9\u00b2A\u00b2', unit: 'J',
      cat: 'energy',
      desc: 'In ideal SHM (no friction or damping), total mechanical energy is conserved. E = KE + PE = \u00bdkA\u00b2 remains constant. Total energy depends on amplitude squared — doubling amplitude quadruples the energy.',
      example: {
        text: 'A spring-mass system: k = 200 N/m, A = 0.1 m. Find total energy.',
        steps: [
          'E = \u00bdkA\u00b2',
          'E = \u00bd \u00d7 200 \u00d7 0.1\u00b2',
          'E = \u00bd \u00d7 200 \u00d7 0.01',
          'E = 1.00 J'
        ],
        answer: 'E = 1.00 J'
      }
    },
    {
      id: 'energy-conservation', name: 'Energy Conservation', symbol: 'KE + PE = E',
      formula: '\u00bdmv\u00b2 + \u00bdkx\u00b2 = \u00bdkA\u00b2', unit: 'J',
      cat: 'energy',
      desc: 'At any point during SHM, kinetic and potential energy continuously interchange while their sum remains constant. This allows us to find velocity at any displacement: v = \u03c9\u221a(A\u00b2 \u2212 x\u00b2).',
      example: {
        text: 'k = 50 N/m, m = 2 kg, A = 0.2 m. Find velocity at x = 0.1 m.',
        steps: [
          '\u03c9 = \u221a(k/m) = \u221a(50/2) = 5.00 rad/s',
          'v = \u03c9\u221a(A\u00b2 \u2212 x\u00b2)',
          'v = 5 \u00d7 \u221a(0.04 \u2212 0.01)',
          'v = 5 \u00d7 \u221a0.03 = 5 \u00d7 0.1732',
          'v = 0.866 m/s'
        ],
        answer: 'v = 0.87 m/s'
      }
    },
    // ── Applications ──
    {
      id: 'spring-mass', name: 'Spring-Mass System', symbol: 'k, m',
      formula: 'T = 2\u03c0\u221a(m/k)', unit: 's',
      cat: 'applications',
      desc: 'The spring-mass system is the most fundamental SHM system. When displaced from equilibrium, the spring\'s restoring force F = \u2212kx causes oscillation. Period depends only on mass and spring constant, not amplitude.',
      example: {
        text: 'Two springs in parallel (k\u2081 = 30 N/m, k\u2082 = 20 N/m) support a 1 kg mass. Find the period.',
        steps: [
          'k_eff = k\u2081 + k\u2082 = 30 + 20 = 50 N/m (parallel)',
          'T = 2\u03c0\u221a(m/k_eff)',
          'T = 2\u03c0\u221a(1/50)',
          'T = 2\u03c0 \u00d7 0.1414 = 0.889 s'
        ],
        answer: 'T = 0.89 s'
      }
    },
    {
      id: 'simple-pendulum', name: 'Simple Pendulum', symbol: 'L, g',
      formula: 'T = 2\u03c0\u221a(L/g)', unit: 's',
      cat: 'applications',
      desc: 'A simple pendulum exhibits SHM for small angles (\u03b8 < 15\u00b0). The period depends only on length and gravitational acceleration, not mass or amplitude. This makes pendulums ideal for timekeeping.',
      example: {
        text: 'Find the length of a pendulum with period T = 2 s (g = 9.81 m/s\u00b2).',
        steps: [
          'T = 2\u03c0\u221a(L/g)',
          'T\u00b2 = 4\u03c0\u00b2(L/g)',
          'L = gT\u00b2/(4\u03c0\u00b2)',
          'L = 9.81 \u00d7 4 / (4 \u00d7 9.8696)',
          'L = 39.24 / 39.478 = 0.994 m'
        ],
        answer: 'L = 0.99 m'
      }
    },
    {
      id: 'phase-relationship', name: 'Phase Relationships', symbol: '\u03c6',
      formula: 'v leads x by 90\u00b0; a leads x by 180\u00b0', unit: 'rad',
      cat: 'applications',
      desc: 'In SHM, velocity leads displacement by \u03c0/2 radians (90\u00b0), and acceleration leads displacement by \u03c0 radians (180\u00b0). When displacement is maximum, velocity is zero and acceleration is maximum in the opposite direction.',
      example: {
        text: 'At t = 0, x = A (max displacement). What are v and a?',
        steps: [
          'x(0) = A cos(0) = A (maximum positive)',
          'v(0) = \u2212A\u03c9 sin(0) = 0 (zero — changing direction)',
          'a(0) = \u2212A\u03c9\u00b2 cos(0) = \u2212A\u03c9\u00b2 (max negative)',
          'Velocity is zero at extremes; acceleration opposes displacement'
        ],
        answer: 'v = 0, a = \u2212A\u03c9\u00b2 (max, towards equilibrium)'
      }
    }
  ];

  /* ──────────────────────────────────────────────────────────
     5. PRACTICE PROBLEM GENERATORS
     ────────────────────────────────────────────────────────── */
  function randBetween(lo, hi) { return lo + Math.random() * (hi - lo); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function r3(v) { return Math.round(v * 1000) / 1000; }

  var PROBLEM_GENS = [
    // 1. Angular frequency from spring & mass
    function () {
      var m = r2(randBetween(0.5, 8));
      var k = r2(randBetween(10, 200));
      var w = Math.sqrt(k / m);
      return {
        prompt: 'A spring has k = ' + k + ' N/m with a mass of ' + m + ' kg. Find the angular frequency \u03c9.',
        steps: ['\u03c9 = \u221a(k/m) = \u221a(' + k + '/' + m + ')', '\u03c9 = \u221a(' + r3(k/m) + ')', '\u03c9 = ' + r2(w) + ' rad/s'],
        answer: r2(w), unit: 'rad/s', tol: 0.05
      };
    },
    // 2. Period of spring-mass
    function () {
      var m = r2(randBetween(1, 10));
      var k = r2(randBetween(20, 150));
      var T = 2 * Math.PI * Math.sqrt(m / k);
      return {
        prompt: 'Find the period of oscillation: m = ' + m + ' kg, k = ' + k + ' N/m.',
        steps: ['T = 2\u03c0\u221a(m/k)', 'T = 2\u03c0\u221a(' + m + '/' + k + ')', 'T = 2\u03c0 \u00d7 ' + r3(Math.sqrt(m/k)), 'T = ' + r2(T) + ' s'],
        answer: r2(T), unit: 's', tol: 0.05
      };
    },
    // 3. Frequency from period
    function () {
      var T = r2(randBetween(0.3, 4));
      var f = 1 / T;
      return {
        prompt: 'An oscillating system has period T = ' + T + ' s. Find the frequency f.',
        steps: ['f = 1/T', 'f = 1/' + T, 'f = ' + r2(f) + ' Hz'],
        answer: r2(f), unit: 'Hz', tol: 0.05
      };
    },
    // 4. Maximum velocity
    function () {
      var A = r2(randBetween(0.05, 0.5));
      var w = r2(randBetween(2, 12));
      var vmax = A * w;
      return {
        prompt: 'A = ' + A + ' m, \u03c9 = ' + w + ' rad/s. Find the maximum velocity.',
        steps: ['v_max = A\u03c9', 'v_max = ' + A + ' \u00d7 ' + w, 'v_max = ' + r2(vmax) + ' m/s'],
        answer: r2(vmax), unit: 'm/s', tol: 0.05
      };
    },
    // 5. Maximum acceleration
    function () {
      var A = r2(randBetween(0.05, 0.4));
      var w = r2(randBetween(2, 10));
      var amax = A * w * w;
      return {
        prompt: 'A = ' + A + ' m, \u03c9 = ' + w + ' rad/s. Find the maximum acceleration.',
        steps: ['a_max = A\u03c9\u00b2', 'a_max = ' + A + ' \u00d7 ' + w + '\u00b2', 'a_max = ' + A + ' \u00d7 ' + r2(w*w), 'a_max = ' + r2(amax) + ' m/s\u00b2'],
        answer: r2(amax), unit: 'm/s\u00b2', tol: 0.1
      };
    },
    // 6. Total energy
    function () {
      var k = r2(randBetween(20, 200));
      var A = r2(randBetween(0.05, 0.3));
      var E = 0.5 * k * A * A;
      return {
        prompt: 'k = ' + k + ' N/m, A = ' + A + ' m. Find the total energy of the system.',
        steps: ['E = \u00bdkA\u00b2', 'E = \u00bd \u00d7 ' + k + ' \u00d7 ' + A + '\u00b2', 'E = \u00bd \u00d7 ' + k + ' \u00d7 ' + r3(A*A), 'E = ' + r3(E) + ' J'],
        answer: r3(E), unit: 'J', tol: 0.01
      };
    },
    // 7. Velocity at given displacement (energy method)
    function () {
      var k = r2(randBetween(30, 150));
      var m = r2(randBetween(1, 5));
      var A = r2(randBetween(0.1, 0.4));
      var x = r2(randBetween(0.02, A * 0.8));
      var w = Math.sqrt(k / m);
      var v = w * Math.sqrt(A * A - x * x);
      return {
        prompt: 'k = ' + k + ' N/m, m = ' + m + ' kg, A = ' + A + ' m. Find velocity at x = ' + x + ' m.',
        steps: ['\u03c9 = \u221a(' + k + '/' + m + ') = ' + r2(w) + ' rad/s', 'v = \u03c9\u221a(A\u00b2 \u2212 x\u00b2)', 'v = ' + r2(w) + ' \u00d7 \u221a(' + r3(A*A) + ' \u2212 ' + r3(x*x) + ')', 'v = ' + r2(v) + ' m/s'],
        answer: r2(v), unit: 'm/s', tol: 0.1
      };
    },
    // 8. Pendulum period
    function () {
      var L = r2(randBetween(0.3, 3));
      var T = 2 * Math.PI * Math.sqrt(L / G);
      return {
        prompt: 'A simple pendulum has length L = ' + L + ' m. Find its period (g = 9.81 m/s\u00b2).',
        steps: ['T = 2\u03c0\u221a(L/g)', 'T = 2\u03c0\u221a(' + L + '/9.81)', 'T = 2\u03c0 \u00d7 ' + r3(Math.sqrt(L/G)), 'T = ' + r2(T) + ' s'],
        answer: r2(T), unit: 's', tol: 0.05
      };
    },
    // 9. Find mass from period and spring constant
    function () {
      var T = r2(randBetween(0.5, 3));
      var k = r2(randBetween(20, 150));
      var m = k * T * T / (4 * Math.PI * Math.PI);
      return {
        prompt: 'T = ' + T + ' s, k = ' + k + ' N/m. Find the mass.',
        steps: ['T = 2\u03c0\u221a(m/k)', 'm = kT\u00b2/(4\u03c0\u00b2)', 'm = ' + k + ' \u00d7 ' + r3(T*T) + ' / ' + r2(4*Math.PI*Math.PI), 'm = ' + r2(m) + ' kg'],
        answer: r2(m), unit: 'kg', tol: 0.1
      };
    },
    // 10. Displacement at given time
    function () {
      var A = r2(randBetween(0.1, 0.4));
      var w = r2(randBetween(2, 8));
      var t = r2(randBetween(0.2, 2));
      var x = A * Math.cos(w * t);
      return {
        prompt: 'A = ' + A + ' m, \u03c9 = ' + w + ' rad/s. Find displacement at t = ' + t + ' s.',
        steps: ['x = A cos(\u03c9t)', 'x = ' + A + ' \u00d7 cos(' + w + ' \u00d7 ' + t + ')', 'x = ' + A + ' \u00d7 cos(' + r2(w*t) + ')', 'x = ' + A + ' \u00d7 ' + r3(Math.cos(w*t)), 'x = ' + r3(x) + ' m'],
        answer: r3(x), unit: 'm', tol: 0.02
      };
    },
    // 11. Spring constant from frequency
    function () {
      var f = r2(randBetween(0.5, 5));
      var m = r2(randBetween(0.5, 5));
      var w = 2 * Math.PI * f;
      var k = m * w * w;
      return {
        prompt: 'A ' + m + ' kg mass oscillates at f = ' + f + ' Hz. Find the spring constant k.',
        steps: ['\u03c9 = 2\u03c0f = 2\u03c0 \u00d7 ' + f + ' = ' + r2(w) + ' rad/s', 'k = m\u03c9\u00b2', 'k = ' + m + ' \u00d7 ' + r2(w) + '\u00b2', 'k = ' + r2(k) + ' N/m'],
        answer: r2(k), unit: 'N/m', tol: 1
      };
    },
    // 12. KE at given displacement
    function () {
      var k = r2(randBetween(30, 150));
      var A = r2(randBetween(0.1, 0.3));
      var x = r2(randBetween(0.02, A * 0.7));
      var E = 0.5 * k * A * A;
      var PE = 0.5 * k * x * x;
      var KE = E - PE;
      return {
        prompt: 'k = ' + k + ' N/m, A = ' + A + ' m. Find KE at x = ' + x + ' m.',
        steps: ['E_total = \u00bdkA\u00b2 = \u00bd \u00d7 ' + k + ' \u00d7 ' + r3(A*A) + ' = ' + r3(E) + ' J', 'PE = \u00bdkx\u00b2 = \u00bd \u00d7 ' + k + ' \u00d7 ' + r3(x*x) + ' = ' + r3(PE) + ' J', 'KE = E \u2212 PE = ' + r3(E) + ' \u2212 ' + r3(PE), 'KE = ' + r3(KE) + ' J'],
        answer: r3(KE), unit: 'J', tol: 0.02
      };
    }
  ];

  /* ──────────────────────────────────────────────────────────
     6. QUIZ QUESTION POOL
     ────────────────────────────────────────────────────────── */
  var QUIZ_POOL = [
    // MCQ questions
    function () {
      return {
        type: 'mcq',
        question: 'In SHM, acceleration is always:',
        options: [
          'Proportional to displacement and directed towards equilibrium',
          'Proportional to velocity and directed away from equilibrium',
          'Constant throughout the motion',
          'Zero at maximum displacement'
        ],
        correct: 0,
        shortQ: 'SHM acceleration direction'
      };
    },
    function () {
      return {
        type: 'mcq',
        question: 'At the equilibrium position in SHM:',
        options: [
          'Velocity is maximum and acceleration is zero',
          'Both velocity and acceleration are maximum',
          'Velocity is zero and acceleration is maximum',
          'Both velocity and acceleration are zero'
        ],
        correct: 0,
        shortQ: 'At equilibrium position'
      };
    },
    function () {
      return {
        type: 'mcq',
        question: 'The period of a simple pendulum depends on:',
        options: [
          'Length and gravitational acceleration only',
          'Mass and length only',
          'Amplitude and mass only',
          'Spring constant and mass only'
        ],
        correct: 0,
        shortQ: 'Pendulum period depends on'
      };
    },
    function () {
      return {
        type: 'mcq',
        question: 'If the amplitude of SHM is doubled, the total energy:',
        options: [
          'Becomes 4 times',
          'Becomes 2 times',
          'Remains the same',
          'Becomes 8 times'
        ],
        correct: 0,
        shortQ: 'Energy vs amplitude'
      };
    },
    function () {
      return {
        type: 'mcq',
        question: 'Velocity in SHM leads displacement by:',
        options: [
          '90\u00b0 (\u03c0/2 radians)',
          '180\u00b0 (\u03c0 radians)',
          '45\u00b0 (\u03c0/4 radians)',
          '270\u00b0 (3\u03c0/2 radians)'
        ],
        correct: 0,
        shortQ: 'Phase lead of velocity'
      };
    },
    function () {
      return {
        type: 'mcq',
        question: 'For a spring-mass system, doubling the mass will:',
        options: [
          'Increase the period by a factor of \u221a2',
          'Double the period',
          'Halve the period',
          'Not change the period'
        ],
        correct: 0,
        shortQ: 'Effect of doubling mass'
      };
    },
    function () {
      return {
        type: 'mcq',
        question: 'The restoring force in SHM is given by:',
        options: [
          'F = \u2212kx',
          'F = kx',
          'F = \u2212kx\u00b2',
          'F = ma + kx'
        ],
        correct: 0,
        shortQ: 'Restoring force formula'
      };
    },
    // Numeric questions
    function () {
      var m = r2(randBetween(1, 6));
      var k = r2(randBetween(20, 120));
      var w = Math.sqrt(k / m);
      return {
        type: 'numeric',
        question: 'Find \u03c9 for m = ' + m + ' kg, k = ' + k + ' N/m.',
        answer: r2(w), unit: 'rad/s', tol: 0.05,
        shortQ: '\u03c9 for m=' + m + ', k=' + k
      };
    },
    function () {
      var L = r2(randBetween(0.4, 2.5));
      var T = 2 * Math.PI * Math.sqrt(L / G);
      return {
        type: 'numeric',
        question: 'Find the period of a pendulum with L = ' + L + ' m (g = 9.81 m/s\u00b2).',
        answer: r2(T), unit: 's', tol: 0.05,
        shortQ: 'T for L=' + L + 'm'
      };
    },
    function () {
      var A = r2(randBetween(0.05, 0.3));
      var w = r2(randBetween(3, 10));
      var vmax = A * w;
      return {
        type: 'numeric',
        question: 'A = ' + A + ' m, \u03c9 = ' + w + ' rad/s. Find v_max.',
        answer: r2(vmax), unit: 'm/s', tol: 0.05,
        shortQ: 'v_max for A=' + A + ', \u03c9=' + w
      };
    },
    function () {
      var k = r2(randBetween(30, 180));
      var A = r2(randBetween(0.05, 0.25));
      var E = 0.5 * k * A * A;
      return {
        type: 'numeric',
        question: 'k = ' + k + ' N/m, A = ' + A + ' m. Find total energy E.',
        answer: r3(E), unit: 'J', tol: 0.02,
        shortQ: 'E for k=' + k + ', A=' + A
      };
    },
    function () {
      var m = r2(randBetween(1, 5));
      var k = r2(randBetween(20, 120));
      var T = 2 * Math.PI * Math.sqrt(m / k);
      var f = 1 / T;
      return {
        type: 'numeric',
        question: 'm = ' + m + ' kg, k = ' + k + ' N/m. Find frequency f in Hz.',
        answer: r2(f), unit: 'Hz', tol: 0.05,
        shortQ: 'f for m=' + m + ', k=' + k
      };
    },
    function () {
      var A = r2(randBetween(0.1, 0.3));
      var w = r2(randBetween(3, 8));
      var amax = A * w * w;
      return {
        type: 'numeric',
        question: 'A = ' + A + ' m, \u03c9 = ' + w + ' rad/s. Find maximum acceleration a_max.',
        answer: r2(amax), unit: 'm/s\u00b2', tol: 0.1,
        shortQ: 'a_max for A=' + A + ', \u03c9=' + w
      };
    },
    function () {
      var m = r2(randBetween(1, 4));
      var T = r2(randBetween(0.5, 3));
      var k = m * 4 * Math.PI * Math.PI / (T * T);
      return {
        type: 'numeric',
        question: 'm = ' + m + ' kg, T = ' + T + ' s. Find spring constant k.',
        answer: r2(k), unit: 'N/m', tol: 1,
        shortQ: 'k for m=' + m + ', T=' + T
      };
    }
  ];

  /* ──────────────────────────────────────────────────────────
     7. DRAWING — MAIN CANVAS
     ────────────────────────────────────────────────────────── */
  var W, H;
  var dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = rect.width - 20;
    var aspect = 440 / 900;
    var h = w * aspect;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    W = canvas.width;
    H = canvas.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Layout constants (in CSS pixels, scaled by ctx transform)
  var SYS_CX   = 170;
  var SYS_EQ_Y = 230;
  var MASS_W   = 70;
  var MASS_H   = 50;
  var DISP_SCALE = 400;
  var CHART_L, CHART_R, CHART_T, CHART_B;

  function computeChartBounds() {
    var cw = W / dpr;
    CHART_L = 360;
    CHART_R = cw - 20;
    CHART_T = 30;
    CHART_B = H / dpr - 30;
  }

  /* ── Draw spring ── */
  function drawSpring(x, y1, y2) {
    var coils = 10;
    var segH = (y2 - y1) / (coils * 2);
    var spread = 18;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    for (var i = 0; i < coils * 2; i++) {
      var ny = y1 + segH * (i + 1);
      var nx = (i % 2 === 0) ? x - spread : x + spread;
      ctx.lineTo(nx, ny);
    }
    ctx.lineTo(x, y2);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  /* ── Draw fixed wall (top) ── */
  function drawFixedWall() {
    var y = 30;
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(SYS_CX - 60, y, 120, 8);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    for (var i = 0; i < 8; i++) {
      var lx = SYS_CX - 55 + i * 15;
      ctx.beginPath();
      ctx.moveTo(lx, y);
      ctx.lineTo(lx - 6, y + 8);
      ctx.stroke();
    }
  }

  /* ── Draw pendulum ── */
  function drawPendulum(angle) {
    var pivotX = SYS_CX;
    var pivotY = 50;
    // Scale rod length visually: 1 m → 100 px, clamped so bob stays inside canvas
    var maxRod = (H / dpr) - pivotY - 70;   // leave room for bob (r=22) + label
    var rodLen = Math.min(maxRod, Math.max(55, pendulumL * 100));
    var bobX = pivotX + rodLen * Math.sin(angle);
    var bobY = pivotY + rodLen * Math.cos(angle);

    // Pivot
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(pivotX - 50, pivotY - 5, 100, 8);
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#6b7a99';
    ctx.fill();

    // Rod
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Bob
    ctx.beginPath();
    ctx.arc(bobX, bobY, 22, 0, Math.PI * 2);
    var grad = ctx.createRadialGradient(bobX - 5, bobY - 5, 2, bobX, bobY, 22);
    grad.addColorStop(0, '#00e5c4');
    grad.addColorStop(1, '#00897b');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#004d40';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText(mass.toFixed(1) + ' kg', bobX, bobY + 4);

    // Dashed equilibrium line
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(pivotX, pivotY + rodLen + 30);
    ctx.strokeStyle = 'rgba(107,122,153,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  /* ── Draw spring-mass system ── */
  function drawSpringMass(disp) {
    var massY = SYS_EQ_Y + disp * DISP_SCALE;
    drawFixedWall();
    drawSpring(SYS_CX, 38, massY - MASS_H / 2);

    // Mass block
    var mx = SYS_CX - MASS_W / 2;
    var my = massY - MASS_H / 2;
    var grad = ctx.createLinearGradient(mx, my, mx + MASS_W, my + MASS_H);
    grad.addColorStop(0, '#00e5c4');
    grad.addColorStop(1, '#00897b');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(mx, my, MASS_W, MASS_H, 6);
    ctx.fill();
    ctx.strokeStyle = '#004d40';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = '12px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText(mass.toFixed(1) + ' kg', SYS_CX, massY + 4);

    // Equilibrium line
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(SYS_CX - 50, SYS_EQ_Y);
    ctx.lineTo(SYS_CX + 50, SYS_EQ_Y);
    ctx.strokeStyle = 'rgba(107,122,153,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Displacement arrow
    if (Math.abs(disp) > 0.005) {
      var arrowDir = disp > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(SYS_CX + 55, SYS_EQ_Y);
      ctx.lineTo(SYS_CX + 55, massY);
      ctx.strokeStyle = '#ff5555';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(SYS_CX + 55, massY);
      ctx.lineTo(SYS_CX + 50, massY - arrowDir * 8);
      ctx.lineTo(SYS_CX + 60, massY - arrowDir * 8);
      ctx.closePath();
      ctx.fillStyle = '#ff5555';
      ctx.fill();
      // Label
      ctx.fillStyle = '#ff5555';
      ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'left';
      ctx.fillText('x=' + disp.toFixed(3) + 'm', SYS_CX + 65, (SYS_EQ_Y + massY) / 2 + 4);
    }
  }

  /* ── Draw waveform chart ── */
  function drawChart() {
    computeChartBounds();
    var cw = CHART_R - CHART_L;
    var ch = CHART_B - CHART_T;
    var cx = CHART_L;
    var cy = CHART_T;

    // Background
    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.roundRect(cx, cy, cw, ch, 8);
    ctx.fill();

    // Grid
    ctx.strokeStyle = 'rgba(107,122,153,0.15)';
    ctx.lineWidth = 0.5;
    for (var i = 1; i < 4; i++) {
      var gy = cy + ch * i / 4;
      ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx + cw, gy); ctx.stroke();
    }
    for (var j = 1; j < 8; j++) {
      var gx = cx + cw * j / 8;
      ctx.beginPath(); ctx.moveTo(gx, cy); ctx.lineTo(gx, cy + ch); ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'right';

    var yLabel, maxVal;
    if (graphType === 'displacement') {
      yLabel = 'x (m)';
      maxVal = amplitude * 1.3;
    } else if (graphType === 'velocity') {
      yLabel = 'v (m/s)';
      maxVal = amplitude * getOmega() * 1.3;
    } else if (graphType === 'acceleration') {
      yLabel = 'a (m/s\u00b2)';
      maxVal = amplitude * getOmega() * getOmega() * 1.3;
    } else {
      yLabel = 'E (J)';
      maxVal = totalEnergy() * 1.3;
    }
    if (maxVal < 0.001) maxVal = 1;

    ctx.fillText(yLabel, cx - 4, cy + 12);

    // +max / -max labels
    if (graphType !== 'energy') {
      ctx.textAlign = 'right';
      ctx.fillText('+' + (maxVal / 1.3).toFixed(2), cx - 4, cy + 18);
      ctx.fillText('-' + (maxVal / 1.3).toFixed(2), cx - 4, cy + ch - 4);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText((maxVal / 1.3).toFixed(3), cx - 4, cy + 18);
      ctx.fillText('0', cx - 4, cy + ch - 4);
    }

    // Zero line (center for x/v/a, bottom for energy)
    var zeroY = graphType === 'energy' ? cy + ch : cy + ch / 2;
    ctx.strokeStyle = 'rgba(107,122,153,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, zeroY); ctx.lineTo(cx + cw, zeroY); ctx.stroke();

    // Time axis label
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('t (s)', cx + cw / 2, cy + ch + 16);

    // Waveform trace
    if (waveHistory.length < 2) return;

    var timeWindow = Math.max(getPeriod() * 3, 3);
    var tEnd = waveHistory[waveHistory.length - 1].t;
    var tStart = tEnd - timeWindow;

    function getYVal(entry) {
      if (graphType === 'displacement') return entry.x;
      if (graphType === 'velocity')     return entry.v;
      if (graphType === 'acceleration') return entry.a;
      return null; // energy handled separately
    }

    if (graphType === 'energy') {
      // KE trace (blue)
      ctx.beginPath();
      var first = true;
      for (var e = 0; e < waveHistory.length; e++) {
        var pt = waveHistory[e];
        if (pt.t < tStart) continue;
        var px = cx + ((pt.t - tStart) / timeWindow) * cw;
        var pyKE = zeroY - (pt.ke / maxVal) * ch;
        if (first) { ctx.moveTo(px, pyKE); first = false; }
        else ctx.lineTo(px, pyKE);
      }
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 2;
      ctx.stroke();

      // PE trace (red)
      ctx.beginPath();
      first = true;
      for (e = 0; e < waveHistory.length; e++) {
        pt = waveHistory[e];
        if (pt.t < tStart) continue;
        px = cx + ((pt.t - tStart) / timeWindow) * cw;
        var pyPE = zeroY - (pt.pe / maxVal) * ch;
        if (first) { ctx.moveTo(px, pyPE); first = false; }
        else ctx.lineTo(px, pyPE);
      }
      ctx.strokeStyle = '#ff5555';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Total trace (gold, dashed)
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      first = true;
      for (e = 0; e < waveHistory.length; e++) {
        pt = waveHistory[e];
        if (pt.t < tStart) continue;
        px = cx + ((pt.t - tStart) / timeWindow) * cw;
        var pyE = zeroY - ((pt.ke + pt.pe) / maxVal) * ch;
        if (first) { ctx.moveTo(px, pyE); first = false; }
        else ctx.lineTo(px, pyE);
      }
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Legend
      ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#42a5f5';
      ctx.fillText('KE', cx + 8, cy + 16);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('PE', cx + 34, cy + 16);
      ctx.fillStyle = '#f5c842';
      ctx.fillText('Total', cx + 58, cy + 16);
    } else {
      // Single trace with glow
      ctx.save();
      ctx.shadowColor = '#00bfa5';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      var started = false;
      for (var k = 0; k < waveHistory.length; k++) {
        var p = waveHistory[k];
        if (p.t < tStart) continue;
        var px2 = cx + ((p.t - tStart) / timeWindow) * cw;
        var yv = getYVal(p);
        var py2 = zeroY - (yv / maxVal) * (ch / 2);
        if (!started) { ctx.moveTo(px2, py2); started = true; }
        else ctx.lineTo(px2, py2);
      }
      ctx.strokeStyle = '#00bfa5';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── Main draw ── */
  function draw() {
    var cw = W / dpr;
    var ch = H / dpr;
    ctx.clearRect(0, 0, cw, ch);

    // Background
    ctx.fillStyle = '#161b27';
    ctx.beginPath();
    ctx.roundRect(0, 0, cw, ch, 0);
    ctx.fill();

    // Divider
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(340, 10);
    ctx.lineTo(340, ch - 10);
    ctx.stroke();

    // System
    var x = displacement(simTime);
    if (sysType === 'spring') {
      drawSpringMass(x);
    } else {
      // Convert linear displacement to angle (small angle approx)
      var angle = x / pendulumL;
      drawPendulum(angle);
    }

    // Chart
    drawChart();

    // System label
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText(sysType === 'spring' ? 'Spring-Mass System' : 'Simple Pendulum', SYS_CX, ch - 10);
  }

  /* ──────────────────────────────────────────────────────────
     8. READOUTS
     ────────────────────────────────────────────────────────── */
  function updateReadouts() {
    var w = getOmega();
    var f = getFrequency();
    var T = getPeriod();
    var x = displacement(simTime);
    var v = velocity(simTime);
    var a = acceleration(simTime);

    roOmega.textContent  = w.toFixed(2);
    roFreq.textContent   = f.toFixed(2);
    roPeriod.textContent = T.toFixed(3);
    roDisp.textContent   = x.toFixed(3);
    roVel.textContent    = v.toFixed(3);
    roAcc.textContent    = a.toFixed(2);
  }

  /* ──────────────────────────────────────────────────────────
     9. ANIMATION LOOP
     ────────────────────────────────────────────────────────── */
  function tick(timestamp) {
    if (!animRunning) return;
    if (lastTimestamp === 0) lastTimestamp = timestamp;
    var dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (dt > 0.1) dt = 0.1; // cap for tab-switch

    if (mode === 'simulate') {
      simTime += dt;
      var x = displacement(simTime);
      var v = velocity(simTime);
      var a = acceleration(simTime);
      var ke = kineticEnergy(simTime);
      var pe = potentialEnergy(simTime);
      waveHistory.push({ t: simTime, x: x, v: v, a: a, ke: ke, pe: pe });

      // Trim history
      var timeWindow = Math.max(getPeriod() * 3, 3);
      while (waveHistory.length > 0 && waveHistory[0].t < simTime - timeWindow - 1) {
        waveHistory.shift();
      }

      draw();
      updateReadouts();
    }

    requestAnimationFrame(tick);
  }

  /* ──────────────────────────────────────────────────────────
     10. MODE SWITCHING
     ────────────────────────────────────────────────────────── */
  modeTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var newMode = pill.dataset.mode;
    modeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === pill); });
    setMode(newMode);
  });

  function setMode(m) {
    mode = m;
    Object.keys(panels).forEach(function (k) {
      panels[k].style.display = k === m ? '' : 'none';
    });

    if (m === 'simulate') {
      animRunning = true;
      lastTimestamp = 0;
      requestAnimationFrame(tick);
    } else {
      animRunning = false;
    }

    if (m === 'explore') buildConceptGrid();
    if (m === 'practice') newPractice();
    if (m === 'quiz') startQuiz();
  }

  /* ──────────────────────────────────────────────────────────
     11. SYSTEM & GRAPH TABS
     ────────────────────────────────────────────────────────── */
  sysTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    sysType = pill.dataset.sys;
    sysTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === pill); });

    // Show/hide relevant sliders
    grpSpring.style.display = sysType === 'spring' ? '' : 'none';
    grpLength.style.display = sysType === 'pendulum' ? '' : 'none';

    resetSim();
  });

  graphTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    graphType = pill.dataset.graph;
    graphTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === pill); });
  });

  /* ──────────────────────────────────────────────────────────
     12. SLIDERS
     ────────────────────────────────────────────────────────── */
  function syncSliders() {
    mass      = parseFloat(slMass.value);
    springK   = parseFloat(slSpring.value);
    pendulumL = parseFloat(slLength.value);
    amplitude = parseFloat(slAmplitude.value);

    valMass.textContent      = mass.toFixed(1) + ' kg';
    valSpring.textContent    = springK + ' N/m';
    valLength.textContent    = pendulumL.toFixed(1) + ' m';
    valAmplitude.textContent = amplitude.toFixed(2) + ' m';

    updateReadouts();
  }

  slMass.addEventListener('input', syncSliders);
  slSpring.addEventListener('input', syncSliders);
  slLength.addEventListener('input', syncSliders);
  slAmplitude.addEventListener('input', syncSliders);

  /* ──────────────────────────────────────────────────────────
     13. RESET & PRESETS
     ────────────────────────────────────────────────────────── */
  function resetSim() {
    simTime = 0;
    waveHistory = [];
    lastTimestamp = 0;
    updateReadouts();
    if (mode === 'simulate') {
      animRunning = true;
      requestAnimationFrame(tick);
    }
  }

  document.getElementById('btn-reset').addEventListener('click', resetSim);

  // Presets
  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = btn.dataset.preset;
      if (p === 'clock') {
        // Seconds pendulum: T = 2s, L ≈ 0.994 m
        sysType = 'pendulum';
        slLength.value = 1.0;
        slMass.value = 0.5;
        slAmplitude.value = 0.1;
        sysTabs.querySelectorAll('.pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.sys === 'pendulum'); });
        grpSpring.style.display = 'none';
        grpLength.style.display = '';
      } else if (p === 'car') {
        sysType = 'spring';
        slMass.value = 8;
        slSpring.value = 50;
        slAmplitude.value = 0.15;
        sysTabs.querySelectorAll('.pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.sys === 'spring'); });
        grpSpring.style.display = '';
        grpLength.style.display = 'none';
      } else if (p === 'tuning') {
        sysType = 'spring';
        slMass.value = 0.5;
        slSpring.value = 197;
        slAmplitude.value = 0.05;
        sysTabs.querySelectorAll('.pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.sys === 'spring'); });
        grpSpring.style.display = '';
        grpLength.style.display = 'none';
      } else if (p === 'heavy') {
        sysType = 'spring';
        slMass.value = 10;
        slSpring.value = 20;
        slAmplitude.value = 0.4;
        sysTabs.querySelectorAll('.pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.sys === 'spring'); });
        grpSpring.style.display = '';
        grpLength.style.display = 'none';
      }
      syncSliders();
      resetSim();
    });
  });

  /* ──────────────────────────────────────────────────────────
     14. EXPLORE MODE
     ────────────────────────────────────────────────────────── */
  exploreTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    exploreCat = pill.dataset.cat;
    exploreTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === pill); });
    buildConceptGrid();
    conceptInfo.style.display = 'none';
    activeConcept = null;
  });

  function buildConceptGrid() {
    conceptGrid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    filtered.forEach(function (c) {
      var card = document.createElement('div');
      card.className = 'concept-card';
      card.dataset.id = c.id;
      card.innerHTML = '<div class="concept-card-name">' + c.name + '</div>' +
                        '<div class="concept-card-symbol">' + c.symbol + '</div>';
      card.addEventListener('click', function () { showConcept(c); });
      conceptGrid.appendChild(card);
    });
  }

  function showConcept(c) {
    activeConcept = c;
    conceptInfo.style.display = '';
    ciName.textContent    = c.name;
    ciSymbol.textContent  = c.symbol;
    ciFormula.textContent = c.formula;
    ciUnit.textContent    = '(' + c.unit + ')';
    ciDesc.textContent    = c.desc;

    // Steps
    ciSteps.innerHTML = '';
    c.example.steps.forEach(function (s) {
      var div = document.createElement('div');
      div.className = 'step';
      div.textContent = s;
      ciSteps.appendChild(div);
    });
    ciAnswer.textContent = c.example.answer;

    // Mini diagram
    drawConceptDiagram(c);

    // Highlight card
    conceptGrid.querySelectorAll('.concept-card').forEach(function (card) {
      card.classList.toggle('active', card.dataset.id === c.id);
    });
  }

  document.getElementById('btn-close-concept').addEventListener('click', function () {
    conceptInfo.style.display = 'none';
    activeConcept = null;
    conceptGrid.querySelectorAll('.concept-card').forEach(function (card) { card.classList.remove('active'); });
  });

  /* ── Concept mini-diagrams ── */
  function drawConceptDiagram(c) {
    var w = 400, h = 200;
    ciCanvas.width = w * dpr;
    ciCanvas.height = h * dpr;
    ciCanvas.style.width = w + 'px';
    ciCanvas.style.height = h + 'px';
    ciCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ciCtx.clearRect(0, 0, w, h);
    ciCtx.fillStyle = '#0d1117';
    ciCtx.fillRect(0, 0, w, h);

    var mid = h / 2;

    if (c.id === 'displacement' || c.id === 'velocity' || c.id === 'acceleration') {
      // Draw sinusoidal wave
      ciCtx.strokeStyle = '#2a3050';
      ciCtx.lineWidth = 1;
      ciCtx.beginPath(); ciCtx.moveTo(20, mid); ciCtx.lineTo(w - 20, mid); ciCtx.stroke();

      ciCtx.beginPath();
      for (var x = 20; x <= w - 20; x++) {
        var t = (x - 20) / (w - 40) * 4 * Math.PI;
        var y;
        if (c.id === 'displacement') y = mid - 60 * Math.cos(t);
        else if (c.id === 'velocity') y = mid + 60 * Math.sin(t);
        else y = mid + 60 * Math.cos(t);
        if (x === 20) ciCtx.moveTo(x, y);
        else ciCtx.lineTo(x, y);
      }
      ciCtx.strokeStyle = c.id === 'displacement' ? '#00bfa5' : c.id === 'velocity' ? '#42a5f5' : '#ff5555';
      ciCtx.lineWidth = 2.5;
      ciCtx.stroke();

      // Labels
      ciCtx.fillStyle = ciCtx.strokeStyle;
      ciCtx.font = '12px ' + getComputedStyle(document.body).fontFamily;
      ciCtx.textAlign = 'left';
      ciCtx.fillText(c.symbol, 24, 24);
      ciCtx.fillStyle = '#6b7a99';
      ciCtx.textAlign = 'center';
      ciCtx.fillText('t', w / 2, h - 8);
    } else if (c.id === 'angular-freq' || c.id === 'period') {
      // Draw wave with period markers
      ciCtx.strokeStyle = '#2a3050';
      ciCtx.lineWidth = 1;
      ciCtx.beginPath(); ciCtx.moveTo(20, mid); ciCtx.lineTo(w - 20, mid); ciCtx.stroke();

      ciCtx.beginPath();
      for (var x2 = 20; x2 <= w - 20; x2++) {
        var t2 = (x2 - 20) / (w - 40) * 4 * Math.PI;
        var y2 = mid - 55 * Math.cos(t2);
        if (x2 === 20) ciCtx.moveTo(x2, y2);
        else ciCtx.lineTo(x2, y2);
      }
      ciCtx.strokeStyle = '#00bfa5';
      ciCtx.lineWidth = 2;
      ciCtx.stroke();

      // Period markers
      var periodPx = (w - 40) / 2;
      ciCtx.save();
      ciCtx.setLineDash([3, 3]);
      ciCtx.strokeStyle = '#f5c842';
      ciCtx.lineWidth = 1.5;
      ciCtx.beginPath(); ciCtx.moveTo(20, 20); ciCtx.lineTo(20, h - 20); ciCtx.stroke();
      ciCtx.beginPath(); ciCtx.moveTo(20 + periodPx, 20); ciCtx.lineTo(20 + periodPx, h - 20); ciCtx.stroke();
      ciCtx.restore();

      // T arrow
      ciCtx.strokeStyle = '#f5c842';
      ciCtx.lineWidth = 1.5;
      ciCtx.beginPath(); ciCtx.moveTo(30, 30); ciCtx.lineTo(10 + periodPx, 30); ciCtx.stroke();
      ciCtx.fillStyle = '#f5c842';
      ciCtx.font = '13px ' + getComputedStyle(document.body).fontFamily;
      ciCtx.textAlign = 'center';
      ciCtx.fillText('T', 20 + periodPx / 2, 24);
    } else if (c.id === 'kinetic' || c.id === 'potential' || c.id === 'total-energy' || c.id === 'energy-conservation') {
      // Energy curves
      ciCtx.strokeStyle = '#2a3050';
      ciCtx.lineWidth = 1;
      ciCtx.beginPath(); ciCtx.moveTo(20, h - 30); ciCtx.lineTo(w - 20, h - 30); ciCtx.stroke();

      var eH = h - 60;
      // KE
      ciCtx.beginPath();
      for (var x3 = 20; x3 <= w - 20; x3++) {
        var t3 = (x3 - 20) / (w - 40) * 4 * Math.PI;
        var ke = 0.5 * (1 - Math.cos(2 * t3));
        var y3 = (h - 30) - ke * eH;
        if (x3 === 20) ciCtx.moveTo(x3, y3); else ciCtx.lineTo(x3, y3);
      }
      ciCtx.strokeStyle = '#42a5f5';
      ciCtx.lineWidth = 2;
      ciCtx.stroke();

      // PE
      ciCtx.beginPath();
      for (var x4 = 20; x4 <= w - 20; x4++) {
        var t4 = (x4 - 20) / (w - 40) * 4 * Math.PI;
        var pe = 0.5 * (1 + Math.cos(2 * t4));
        var y4 = (h - 30) - pe * eH;
        if (x4 === 20) ciCtx.moveTo(x4, y4); else ciCtx.lineTo(x4, y4);
      }
      ciCtx.strokeStyle = '#ff5555';
      ciCtx.lineWidth = 2;
      ciCtx.stroke();

      // Total E line
      ciCtx.save();
      ciCtx.setLineDash([4, 3]);
      ciCtx.strokeStyle = '#f5c842';
      ciCtx.lineWidth = 1.5;
      ciCtx.beginPath();
      ciCtx.moveTo(20, (h - 30) - eH);
      ciCtx.lineTo(w - 20, (h - 30) - eH);
      ciCtx.stroke();
      ciCtx.restore();

      // Legend
      ciCtx.font = '11px ' + getComputedStyle(document.body).fontFamily;
      ciCtx.textAlign = 'left';
      ciCtx.fillStyle = '#42a5f5'; ciCtx.fillText('KE', 24, 20);
      ciCtx.fillStyle = '#ff5555'; ciCtx.fillText('PE', 52, 20);
      ciCtx.fillStyle = '#f5c842'; ciCtx.fillText('E (total)', 80, 20);
    } else if (c.id === 'spring-mass') {
      drawMiniSpringMass(ciCtx, w, h);
    } else if (c.id === 'simple-pendulum') {
      drawMiniPendulum(ciCtx, w, h);
    } else if (c.id === 'phase-relationship') {
      drawPhaseRelationship(ciCtx, w, h);
    }
  }

  function drawMiniSpringMass(c, w, h) {
    var cx = w / 2;
    // Wall
    c.fillStyle = '#2a3050';
    c.fillRect(cx - 40, 15, 80, 6);
    // Spring
    var coils = 8;
    var y1 = 21, y2 = h / 2 - 15;
    var segH = (y2 - y1) / (coils * 2);
    c.beginPath(); c.moveTo(cx, y1);
    for (var i = 0; i < coils * 2; i++) {
      c.lineTo((i % 2 === 0) ? cx - 14 : cx + 14, y1 + segH * (i + 1));
    }
    c.lineTo(cx, y2);
    c.strokeStyle = '#6b7a99'; c.lineWidth = 2; c.stroke();
    // Mass
    c.fillStyle = '#00bfa5';
    c.beginPath(); c.roundRect(cx - 25, y2, 50, 35, 4); c.fill();
    c.fillStyle = '#fff'; c.font = '11px sans-serif'; c.textAlign = 'center';
    c.fillText('m', cx, y2 + 22);
    // Labels
    c.fillStyle = '#6b7a99'; c.font = '10px sans-serif'; c.textAlign = 'left';
    c.fillText('k', cx + 20, (y1 + y2) / 2);
    c.fillStyle = '#00bfa5';
    c.fillText('F = \u2212kx', cx - 50, h - 15);
    c.fillText('T = 2\u03c0\u221a(m/k)', cx - 50, h - 2);
  }

  function drawMiniPendulum(c, w, h) {
    var px = w / 2, py = 25;
    var rodLen = 100;
    var angle = 0.3;
    var bx = px + rodLen * Math.sin(angle);
    var by = py + rodLen * Math.cos(angle);
    // Pivot
    c.fillStyle = '#2a3050'; c.fillRect(px - 30, py - 4, 60, 6);
    c.beginPath(); c.arc(px, py, 4, 0, Math.PI * 2); c.fillStyle = '#6b7a99'; c.fill();
    // Rod
    c.beginPath(); c.moveTo(px, py); c.lineTo(bx, by); c.strokeStyle = '#6b7a99'; c.lineWidth = 2; c.stroke();
    // Bob
    c.beginPath(); c.arc(bx, by, 16, 0, Math.PI * 2); c.fillStyle = '#00bfa5'; c.fill();
    c.fillStyle = '#fff'; c.font = '10px sans-serif'; c.textAlign = 'center'; c.fillText('m', bx, by + 4);
    // Dashed vertical
    c.save(); c.setLineDash([3, 3]); c.strokeStyle = 'rgba(107,122,153,0.4)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + rodLen + 20); c.stroke(); c.restore();
    // Arc
    c.beginPath(); c.arc(px, py, 40, Math.PI / 2 - angle, Math.PI / 2, false);
    c.strokeStyle = '#f5c842'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#f5c842'; c.font = '11px sans-serif'; c.textAlign = 'center';
    c.fillText('\u03b8', px + 25, py + 48);
    // Formulas
    c.fillStyle = '#00bfa5'; c.font = '10px sans-serif'; c.textAlign = 'left';
    c.fillText('T = 2\u03c0\u221a(L/g)', 15, h - 10);
    c.fillText('L', px - 30, py + rodLen / 2);
  }

  function drawPhaseRelationship(c, w, h) {
    var mid = h / 2;
    // Zero line
    c.strokeStyle = '#2a3050'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(30, mid); c.lineTo(w - 10, mid); c.stroke();

    // x(t) - green
    c.beginPath();
    for (var x = 30; x <= w - 10; x++) {
      var t = (x - 30) / (w - 40) * 4 * Math.PI;
      var y = mid - 40 * Math.cos(t);
      if (x === 30) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.strokeStyle = '#00bfa5'; c.lineWidth = 2; c.stroke();

    // v(t) - blue
    c.beginPath();
    for (var x2 = 30; x2 <= w - 10; x2++) {
      var t2 = (x2 - 30) / (w - 40) * 4 * Math.PI;
      var y2 = mid + 40 * Math.sin(t2);
      if (x2 === 30) c.moveTo(x2, y2); else c.lineTo(x2, y2);
    }
    c.strokeStyle = '#42a5f5'; c.lineWidth = 2; c.stroke();

    // a(t) - red
    c.beginPath();
    for (var x3 = 30; x3 <= w - 10; x3++) {
      var t3 = (x3 - 30) / (w - 40) * 4 * Math.PI;
      var y3 = mid + 40 * Math.cos(t3);
      if (x3 === 30) c.moveTo(x3, y3); else c.lineTo(x3, y3);
    }
    c.strokeStyle = '#ff5555'; c.lineWidth = 2; c.stroke();

    // Legend
    c.font = '11px sans-serif'; c.textAlign = 'left';
    c.fillStyle = '#00bfa5'; c.fillText('x(t)', 34, 18);
    c.fillStyle = '#42a5f5'; c.fillText('v(t)', 74, 18);
    c.fillStyle = '#ff5555'; c.fillText('a(t)', 114, 18);
    c.fillStyle = '#6b7a99'; c.textAlign = 'center'; c.fillText('90\u00b0 phase shift between each', w / 2, h - 8);
  }

  /* ──────────────────────────────────────────────────────────
     15. PRACTICE MODE
     ────────────────────────────────────────────────────────── */
  function newPractice() {
    var gen = PROBLEM_GENS[Math.floor(Math.random() * PROBLEM_GENS.length)];
    currentProblem = gen();
    pracPrompt.textContent = currentProblem.prompt;
    pracUnit.textContent = currentProblem.unit;
    pracInput.value = '';
    pracInput.disabled = false;
    pracFeedback.textContent = '';
    pracFeedback.className = 'feedback';
    pracSolution.style.display = 'none';
    pracAnswered = false;
    btnCheck.disabled = false;
  }

  btnCheck.addEventListener('click', function () {
    if (pracAnswered || !currentProblem) return;
    var userVal = parseFloat(pracInput.value);
    if (isNaN(userVal)) { pracFeedback.textContent = 'Please enter a number.'; pracFeedback.className = 'feedback err'; return; }

    pracAnswered = true;
    pracTotal++;
    var diff = Math.abs(userVal - currentProblem.answer);
    if (diff <= currentProblem.tol) {
      pracCorrect++;
      pracFeedback.textContent = '\u2705 Correct! ' + currentProblem.answer + ' ' + currentProblem.unit;
      pracFeedback.className = 'feedback ok';
    } else {
      pracFeedback.textContent = '\u274c Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      pracFeedback.className = 'feedback err';
    }
    pracScoreEl.textContent = pracCorrect + ' / ' + pracTotal;
    pracInput.disabled = true;
    btnCheck.disabled = true;
  });

  btnNextPrac.addEventListener('click', newPractice);

  btnShowSol.addEventListener('click', function () {
    if (!currentProblem) return;
    pracSolution.style.display = '';
    solSteps.innerHTML = '';
    currentProblem.steps.forEach(function (s) {
      var div = document.createElement('div');
      div.className = 'step';
      div.textContent = s;
      solSteps.appendChild(div);
    });
  });

  /* ──────────────────────────────────────────────────────────
     16. QUIZ MODE
     ────────────────────────────────────────────────────────── */
  function startQuiz() {
    quizScore = 0;
    quizIdx = 0;
    quizAnswered = false;
    quizResult.style.display = 'none';
    quizPanel.style.display = '';

    // Build 5 random questions
    var pool = QUIZ_POOL.slice();
    shuffle(pool);
    quizSet = [];
    for (var i = 0; i < QUIZ_SIZE && i < pool.length; i++) {
      var q = pool[i]();
      /* Shuffle each MCQ's options and re-point `correct` at wherever the
         answer landed. Every question in the pool is authored with its answer
         at index 0 and the options were rendered in authored order, so the
         correct button was always the first one — the quiz could be passed
         without reading it. */
      if (q.type === 'mcq' && q.options && q.options.length) {
        var order = q.options.map(function (opt, oi) { return { opt: opt, i: oi }; });
        shuffle(order);
        q.options = order.map(function (o) { return o.opt; });
        q.correct = order.findIndex(function (o) { return o.i === q.correct; });
      }
      quizSet.push(q);
    }
    showQuizQuestion();
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    quizCounter.textContent = 'Q ' + (quizIdx + 1) + ' / ' + QUIZ_SIZE;
    quizQuestion.textContent = q.question;
    quizFeedback.textContent = '';
    quizFeedback.className = 'feedback';
    btnSubmitQuiz.disabled = false;
    btnNextQuiz.disabled = true;
    quizAnswered = false;

    if (q.type === 'mcq') {
      quizInputRow.style.display = 'none';
      quizOptions.style.display = '';
      quizOptions.innerHTML = '';
      q.options.forEach(function (opt, idx) {
        var btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          quizOptions.querySelectorAll('.quiz-opt').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
          q._selected = idx;
        });
        quizOptions.appendChild(btn);
      });
      q._selected = -1;
    } else {
      quizOptions.style.display = 'none';
      quizInputRow.style.display = 'flex';
      quizInput.value = '';
      quizInput.disabled = false;
      quizUnitEl.textContent = q.unit;
    }
  }

  btnSubmitQuiz.addEventListener('click', function () {
    if (quizAnswered) return;
    var q = quizSet[quizIdx];

    if (q.type === 'mcq') {
      if (q._selected === undefined || q._selected < 0) {
        quizFeedback.textContent = 'Please select an answer.';
        quizFeedback.className = 'feedback err';
        return;
      }
      quizAnswered = true;
      var btns = quizOptions.querySelectorAll('.quiz-opt');
      btns.forEach(function (b) { b.classList.add('disabled'); });
      btns[q.correct].classList.add('correct');
      if (q._selected === q.correct) {
        quizScore++;
        quizFeedback.textContent = '\u2705 Correct!';
        quizFeedback.className = 'feedback ok';
        q._ok = true;
      } else {
        btns[q._selected].classList.add('wrong');
        quizFeedback.textContent = '\u274c Incorrect. Answer: ' + q.options[q.correct];
        quizFeedback.className = 'feedback err';
        q._ok = false;
      }
      q._given = q.options[q._selected];
      q._correctText = q.options[q.correct];
    } else {
      var userVal = parseFloat(quizInput.value);
      if (isNaN(userVal)) { quizFeedback.textContent = 'Enter a number.'; quizFeedback.className = 'feedback err'; return; }
      quizAnswered = true;
      quizInput.disabled = true;
      var diff = Math.abs(userVal - q.answer);
      if (diff <= q.tol) {
        quizScore++;
        quizFeedback.textContent = '\u2705 Correct! ' + q.answer + ' ' + q.unit;
        quizFeedback.className = 'feedback ok';
        q._ok = true;
      } else {
        quizFeedback.textContent = '\u274c Incorrect. Answer: ' + q.answer + ' ' + q.unit;
        quizFeedback.className = 'feedback err';
        q._ok = false;
      }
      q._given = userVal;
      q._correctText = q.answer + ' ' + q.unit;
    }

    btnSubmitQuiz.disabled = true;
    btnNextQuiz.disabled = false;
  });

  btnNextQuiz.addEventListener('click', function () {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) {
      showQuizResult();
    } else {
      showQuizQuestion();
    }
  });

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizResult.style.display = '';

    // Score
    var cls = quizScore === QUIZ_SIZE ? 'perfect' : quizScore >= 3 ? 'good' : 'poor';
    qrScore.textContent = quizScore + ' / ' + QUIZ_SIZE;
    qrScore.className = 'qr-score ' + cls;

    // Stars
    var stars = quizScore === QUIZ_SIZE ? '\u2605\u2605\u2605' : quizScore >= 3 ? '\u2605\u2605' : '\u2605';
    qrStars.textContent = stars;

    // Breakdown
    qrBreakdown.innerHTML = '';
    quizSet.forEach(function (q, i) {
      var row = document.createElement('div');
      row.className = 'qr-row ' + (q._ok ? 'ok' : 'err');
      row.innerHTML = '<span class="qr-num">' + (i + 1) + '.</span>' +
                      '<span class="qr-q">' + (q.shortQ || q.question.substring(0, 40)) + '</span>' +
                      '<span class="qr-a">' + q._correctText + '</span>' +
                      '<span class="qr-icon">' + (q._ok ? '\u2713' : '\u2717') + '</span>';
      qrBreakdown.appendChild(row);
    });
  }

  btnNewQuiz.addEventListener('click', startQuiz);

  /* ──────────────────────────────────────────────────────────
     17. INIT
     ────────────────────────────────────────────────────────── */
  // Hide pendulum slider initially
  grpLength.style.display = 'none';

  resizeCanvas();
  window.addEventListener('resize', function () { resizeCanvas(); draw(); });
  syncSliders();
  updateReadouts();
  animRunning = true;
  requestAnimationFrame(tick);

})();
