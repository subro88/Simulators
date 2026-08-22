(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS (16 concepts, 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Fundamentals ──────────────────────────────────────────── */
    {
      id: 'emf-equation', name: 'EMF Equation', symbol: 'E\u2080 = NBA\u03C9',
      formula: 'E\u2080 = N \u00D7 B \u00D7 A \u00D7 \u03C9', unit: 'V (volts)',
      cat: 'fundamentals',
      desc: 'The peak EMF of an AC generator is the product of the number of turns (N), magnetic flux density (B in Tesla), coil area (A in m\u00B2), and angular velocity (\u03C9 in rad/s). This equation is derived from Faraday\'s law of electromagnetic induction. The instantaneous EMF varies sinusoidally as e(t) = E\u2080 \u00D7 sin(\u03C9t), reaching maximum when the coil plane is parallel to the magnetic field.',
      diagram: 'emfEquation',
      example: { problem: 'A coil has N = 200 turns, B = 0.5 T, A = 0.02 m\u00B2, rotates at 1500 RPM. Find peak EMF.', steps: ['\u03C9 = 2\u03C0 \u00D7 1500 / 60 = 157.08 rad/s', 'E\u2080 = N \u00D7 B \u00D7 A \u00D7 \u03C9', 'E\u2080 = 200 \u00D7 0.5 \u00D7 0.02 \u00D7 157.08', 'E\u2080 = 314.16 V'], answer: 314.16, unit: 'V' }
    },
    {
      id: 'faradays-law', name: 'Faraday\'s Law', symbol: 'e = -N d\u03A6/dt',
      formula: 'e = -N \u00D7 d\u03A6/dt', unit: 'V (volts)',
      cat: 'fundamentals',
      desc: 'Faraday\'s law states that the induced EMF in a coil is equal to the negative rate of change of magnetic flux linkage. For a coil rotating in a uniform magnetic field, the flux \u03A6 = BA cos(\u03C9t), and the induced EMF becomes e = NBA\u03C9 sin(\u03C9t). The negative sign indicates that the induced EMF opposes the change in flux (Lenz\'s law).',
      diagram: 'faradaysLaw',
      example: { problem: 'A coil has 100 turns. Flux changes from 0.05 Wb to 0 in 0.01 s. Find the induced EMF.', steps: ['e = -N \u00D7 \u0394\u03A6/\u0394t', 'e = -100 \u00D7 (0 - 0.05) / 0.01', 'e = -100 \u00D7 (-5)', 'e = 500 V'], answer: 500, unit: 'V' }
    },
    {
      id: 'lenz-law', name: 'Lenz\'s Law', symbol: 'Opposes change',
      formula: 'Direction opposes \u0394\u03A6', unit: '(direction rule)',
      cat: 'fundamentals',
      desc: 'Lenz\'s law states that the direction of the induced current (and EMF) is such that it opposes the change in magnetic flux that produced it. This is a consequence of conservation of energy. In an AC generator, the induced current creates a magnetic field that opposes the rotation of the coil, which is why mechanical energy must be continuously supplied to maintain rotation.',
      diagram: 'lenzLaw',
      example: { problem: 'A magnet moves towards a coil. In which direction does the induced current flow?', steps: ['Magnet approaching: flux through coil increases', 'Lenz\'s law: induced current opposes flux increase', 'Induced current creates field opposing the magnet', 'Current flows to repel the approaching magnet'], answer: 0, unit: '' }
    },
    {
      id: 'rms-value', name: 'RMS Value', symbol: 'E\u1D63\u2098\u209B = E\u2080/\u221A2',
      formula: 'E_rms = E\u2080 / \u221A2 \u2248 0.707 \u00D7 E\u2080', unit: 'V (volts)',
      cat: 'fundamentals',
      desc: 'The RMS (Root Mean Square) value of an alternating voltage is the equivalent DC voltage that would produce the same heating effect in a resistive load. For a sinusoidal waveform, E_rms = E\u2080 / \u221A2 = 0.7071 \u00D7 E\u2080. Similarly, I_rms = I\u2080 / \u221A2. The RMS value is what AC voltmeters and ammeters display, and is used in power calculations: P = E_rms\u00B2 / R.',
      diagram: 'rmsValue',
      example: { problem: 'Peak EMF is 325 V. Find the RMS voltage.', steps: ['E_rms = E\u2080 / \u221A2', 'E_rms = 325 / 1.4142', 'E_rms = 229.81 V', 'This is the standard mains voltage (\u2248230 V)'], answer: 229.81, unit: 'V' }
    },
    {
      id: 'frequency', name: 'Frequency', symbol: 'f = n/60',
      formula: 'f = n / 60 (2-pole)', unit: 'Hz',
      cat: 'fundamentals',
      desc: 'The frequency of the generated AC voltage depends on the rotational speed and the number of magnetic poles. For a 2-pole generator, f = n/60 where n is in RPM. For a P-pole generator, f = (P \u00D7 n) / 120. Standard power grid frequencies are 50 Hz (most of the world) and 60 Hz (Americas, Japan). The period T = 1/f is the time for one complete cycle.',
      diagram: 'frequency',
      example: { problem: 'A 4-pole alternator runs at 1500 RPM. Find the frequency.', steps: ['f = (P \u00D7 n) / 120', 'f = (4 \u00D7 1500) / 120', 'f = 6000 / 120', 'f = 50 Hz'], answer: 50, unit: 'Hz' }
    },
    {
      id: 'angular-velocity', name: 'Angular Velocity', symbol: '\u03C9 = 2\u03C0n/60',
      formula: '\u03C9 = 2\u03C0 \u00D7 n / 60', unit: 'rad/s',
      cat: 'fundamentals',
      desc: 'Angular velocity (\u03C9) is the rate of rotation in radians per second. It is related to rotational speed n (in RPM) by \u03C9 = 2\u03C0n/60. It can also be expressed in terms of frequency: \u03C9 = 2\u03C0f. Angular velocity determines both the peak EMF (E\u2080 = NBA\u03C9) and the frequency (f = \u03C9/2\u03C0) of the generated waveform.',
      diagram: 'angularVelocity',
      example: { problem: 'A generator runs at 3000 RPM. Find \u03C9.', steps: ['\u03C9 = 2\u03C0 \u00D7 n / 60', '\u03C9 = 2\u03C0 \u00D7 3000 / 60', '\u03C9 = 6000\u03C0 / 60', '\u03C9 = 314.16 rad/s'], answer: 314.16, unit: 'rad/s' }
    },

    /* ── Components ───────────────────────────────────────────── */
    {
      id: 'stator', name: 'Stator', symbol: 'Stationary part',
      formula: 'Provides magnetic field', unit: '',
      cat: 'components',
      desc: 'The stator is the stationary part of the AC generator that provides the magnetic field. In small generators, it consists of permanent magnets (N and S poles) mounted on the frame. In large alternators, the stator carries the armature winding (output coils) while the rotor provides the rotating magnetic field. The stator core is made of laminated silicon steel to reduce eddy current losses.',
      diagram: 'stator',
      example: { problem: 'A stator magnet produces B = 0.8 T across a 5 cm air gap, 20 cm pole length. Find the flux per pole.', steps: ['\u03A6 = B \u00D7 A', 'A = gap width \u00D7 pole length = 0.05 \u00D7 0.20 = 0.01 m\u00B2', '\u03A6 = 0.8 \u00D7 0.01', '\u03A6 = 0.008 Wb = 8 mWb'], answer: 0.008, unit: 'Wb' }
    },
    {
      id: 'rotor', name: 'Rotor', symbol: 'Rotating part',
      formula: 'Carries coil/winding', unit: '',
      cat: 'components',
      desc: 'The rotor is the rotating part of the AC generator. In a basic alternator, the rotor carries the rectangular coil (armature) that rotates inside the stator\'s magnetic field. In large synchronous generators, the rotor carries the field winding (electromagnet) excited by DC current, while the stator carries the armature winding. Rotors can be salient-pole type (for low-speed hydro generators) or cylindrical type (for high-speed turbo generators).',
      diagram: 'rotor',
      example: { problem: 'A rotor coil has 300 turns, area 0.015 m\u00B2 in a 0.6 T field at 1800 RPM. Find peak EMF.', steps: ['\u03C9 = 2\u03C0 \u00D7 1800/60 = 188.50 rad/s', 'E\u2080 = NBA\u03C9', 'E\u2080 = 300 \u00D7 0.6 \u00D7 0.015 \u00D7 188.50', 'E\u2080 = 508.94 V'], answer: 508.94, unit: 'V' }
    },
    {
      id: 'slip-rings', name: 'Slip Rings', symbol: 'Continuous rings',
      formula: 'AC output connection', unit: '',
      cat: 'components',
      desc: 'Slip rings are smooth, continuous metal rings mounted on the rotor shaft, insulated from each other and from the shaft. Each end of the rotor coil is connected to one slip ring. Carbon brushes press against the slip rings to maintain electrical contact with the external circuit. Unlike a DC generator\'s commutator (split rings), slip rings allow the alternating EMF to pass through unchanged, producing a true AC output.',
      diagram: 'slipRings',
      example: { problem: 'Why does an AC generator use slip rings instead of a commutator?', steps: ['Slip rings are continuous circular rings', 'Each coil end connects to one ring permanently', 'The alternating EMF passes through unchanged', 'Result: pure sinusoidal AC output (not rectified DC)'], answer: 0, unit: '' }
    },
    {
      id: 'brushes', name: 'Brushes', symbol: 'Carbon contacts',
      formula: 'Stationary contact', unit: '',
      cat: 'components',
      desc: 'Brushes are stationary conductors (usually carbon or graphite) that press against the rotating slip rings to maintain electrical contact between the rotating coil and the external circuit. They are spring-loaded to ensure consistent contact. Carbon is preferred because it is self-lubricating, has low friction, and forms a smooth contact surface. Brush wear is the main maintenance requirement in generators with slip rings.',
      diagram: 'brushes',
      example: { problem: 'A brush has contact resistance of 0.5 \u03A9 (2 brushes). Current is 20 A. Find brush power loss.', steps: ['Total brush resistance = 2 \u00D7 0.5 = 1.0 \u03A9', 'P_brush = I\u00B2 \u00D7 R_brush', 'P_brush = 20\u00B2 \u00D7 1.0', 'P_brush = 400 W'], answer: 400, unit: 'W' }
    },
    {
      id: 'field-winding', name: 'Field Winding', symbol: 'Creates B field',
      formula: 'B = \u03BC\u2080 \u00D7 N\u2092 \u00D7 I\u2092 / l', unit: 'T',
      cat: 'components',
      desc: 'In large alternators, the field winding is an electromagnet on the rotor that creates the magnetic field. It is excited by a small DC current from an exciter (a small DC generator on the same shaft, or a static rectifier). By varying the field current, the generator\'s output voltage can be controlled. The field winding requires much less current than the armature, which is why it is placed on the rotor to minimize slip ring current.',
      diagram: 'fieldWinding',
      example: { problem: 'Field current I_f = 5 A, field resistance R_f = 40 \u03A9. Find excitation power.', steps: ['V_f = I_f \u00D7 R_f = 5 \u00D7 40 = 200 V', 'P_excitation = V_f \u00D7 I_f', 'P_excitation = 200 \u00D7 5', 'P_excitation = 1000 W = 1 kW'], answer: 1000, unit: 'W' }
    },
    {
      id: 'armature-winding', name: 'Armature Winding', symbol: 'Output coil',
      formula: 'Carries load current', unit: '',
      cat: 'components',
      desc: 'The armature winding is the coil in which the EMF is induced. In small generators, it rotates (on the rotor). In large alternators, it is stationary (on the stator) for easier insulation and cooling. The armature winding consists of multiple coils connected in series or parallel, distributed across slots to improve the waveform shape. The armature carries the full load current, so it must be designed for adequate current-carrying capacity.',
      diagram: 'armatureWinding',
      example: { problem: 'An armature has 4 coils each with 50 turns, all in series. B = 0.5 T, A = 0.02 m\u00B2, \u03C9 = 100 rad/s. Find total peak EMF.', steps: ['Total turns N = 4 \u00D7 50 = 200', 'E\u2080 = N \u00D7 B \u00D7 A \u00D7 \u03C9', 'E\u2080 = 200 \u00D7 0.5 \u00D7 0.02 \u00D7 100', 'E\u2080 = 200 V'], answer: 200, unit: 'V' }
    },

    /* ── Applications ─────────────────────────────────────────── */
    {
      id: 'power-generation', name: 'Power Generation', symbol: 'P = E\u00B2/R',
      formula: 'P = E_rms\u00B2 / R', unit: 'W',
      cat: 'applications',
      desc: 'AC generators are the primary source of electrical power worldwide. Power plants use steam turbines, gas turbines, or water turbines to rotate the generator\'s rotor. The output power depends on the RMS voltage and load resistance: P = E_rms\u00B2 / R = E_rms \u00D7 I_rms. Large generators produce megawatts of power at high voltages (11 kV to 25 kV) to minimize transmission losses.',
      diagram: 'powerGeneration',
      example: { problem: 'E_rms = 230 V, R = 46 \u03A9. Find the power delivered.', steps: ['P = E_rms\u00B2 / R', 'P = 230\u00B2 / 46', 'P = 52900 / 46', 'P = 1150 W \u2248 1.15 kW'], answer: 1150, unit: 'W' }
    },
    {
      id: 'single-phase', name: 'Single Phase', symbol: 'v = V\u2098 sin(\u03C9t)',
      formula: 'v(t) = V_m \u00D7 sin(\u03C9t)', unit: 'V',
      cat: 'applications',
      desc: 'A single-phase AC generator produces one sinusoidal voltage waveform. It is the simplest form of AC generation and is used in small portable generators and domestic power supply. Single-phase power has a pulsating power delivery \u2014 the instantaneous power drops to zero twice per cycle. This makes it unsuitable for large motors and industrial loads, where three-phase power is preferred.',
      diagram: 'singlePhase',
      example: { problem: 'A single-phase generator produces 240 V RMS at 50 Hz. Find peak voltage and period.', steps: ['V_peak = V_rms \u00D7 \u221A2', 'V_peak = 240 \u00D7 1.4142 = 339.41 V', 'T = 1/f = 1/50', 'T = 0.02 s = 20 ms'], answer: 339.41, unit: 'V' }
    },
    {
      id: 'three-phase', name: 'Three Phase', symbol: '3\u03C6, 120\u00B0 apart',
      formula: 'P_total = \u221A3 \u00D7 V_L \u00D7 I_L \u00D7 cos\u03C6', unit: 'W',
      cat: 'applications',
      desc: 'A three-phase generator has three sets of armature windings displaced 120\u00B0 apart. It produces three sinusoidal voltages of equal magnitude but shifted by 120\u00B0 in phase. Three-phase power delivers constant total power (no zero crossings), is more efficient for transmission, and can produce a rotating magnetic field for motors. The line voltage is \u221A3 times the phase voltage in a star connection.',
      diagram: 'threePhase',
      example: { problem: 'A 3-phase generator: V_phase = 230 V, I_L = 10 A, pf = 0.8. Find total power.', steps: ['V_line = \u221A3 \u00D7 V_phase = \u221A3 \u00D7 230 = 398.37 V', 'P = \u221A3 \u00D7 V_L \u00D7 I_L \u00D7 cos\u03C6', 'P = \u221A3 \u00D7 398.37 \u00D7 10 \u00D7 0.8', 'P = 5520 W \u2248 5.52 kW'], answer: 5520, unit: 'W' }
    },
    {
      id: 'synchronous-generator', name: 'Synchronous Generator', symbol: 'N_s = 120f/P',
      formula: 'N_s = 120 \u00D7 f / P', unit: 'RPM',
      cat: 'applications',
      desc: 'A synchronous generator (alternator) runs at synchronous speed, which is determined by the desired frequency and the number of poles: N_s = 120f/P. For 50 Hz with 2 poles, N_s = 3000 RPM; with 4 poles, N_s = 1500 RPM. Large power station generators are synchronous machines. They can supply both active and reactive power, and voltage regulation is achieved by adjusting the field excitation current.',
      diagram: 'synchronousGen',
      example: { problem: 'A 6-pole synchronous generator must produce 60 Hz. Find the required speed.', steps: ['N_s = 120 \u00D7 f / P', 'N_s = 120 \u00D7 60 / 6', 'N_s = 7200 / 6', 'N_s = 1200 RPM'], answer: 1200, unit: 'RPM' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (12)
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }
  function round1(n) { return +(Math.round(n * 10) / 10).toFixed(1); }

  var PROBLEM_GEN = [
    /* 0 — Peak EMF from N, B, A, RPM */
    function () {
      var N = randInt(50, 400);
      var B = round2(randInt(20, 150) / 100);
      var A = round2(randInt(5, 80) / 1000);
      var rpm = randInt(5, 30) * 100;
      var w = round2(2 * Math.PI * rpm / 60);
      var E0 = round2(N * B * A * w);
      return { prompt: 'A coil has N = ' + N + ' turns, B = ' + B + ' T, A = ' + A + ' m\u00B2, rotating at ' + rpm + ' RPM. Find the peak EMF (V).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + ' / 60 = ' + w + ' rad/s', 'E\u2080 = N \u00D7 B \u00D7 A \u00D7 \u03C9', 'E\u2080 = ' + N + ' \u00D7 ' + B + ' \u00D7 ' + A + ' \u00D7 ' + w, 'E\u2080 = ' + E0 + ' V'], answer: E0, unit: 'V', tol: 2 };
    },
    /* 1 — RMS EMF from peak */
    function () {
      var E0 = randInt(50, 500);
      var Erms = round2(E0 / Math.sqrt(2));
      return { prompt: 'The peak EMF of an AC generator is ' + E0 + ' V. Find the RMS EMF (V).', steps: ['E_rms = E\u2080 / \u221A2', 'E_rms = ' + E0 + ' / 1.4142', 'E_rms = ' + Erms + ' V'], answer: Erms, unit: 'V', tol: 0.5 };
    },
    /* 2 — Frequency from RPM (2-pole) */
    function () {
      var rpm = randInt(5, 60) * 100;
      var f = round2(rpm / 60);
      return { prompt: 'A 2-pole AC generator runs at ' + rpm + ' RPM. Find the frequency (Hz).', steps: ['f = n / 60 (for 2 poles)', 'f = ' + rpm + ' / 60', 'f = ' + f + ' Hz'], answer: f, unit: 'Hz', tol: 0.5 };
    },
    /* 3 — RMS Current from E0 and R */
    function () {
      var E0 = randInt(100, 400);
      var R = randInt(10, 200);
      var Erms = round2(E0 / Math.sqrt(2));
      var Irms = round2(Erms / R);
      return { prompt: 'Peak EMF = ' + E0 + ' V, load R = ' + R + ' \u03A9. Find the RMS current (A).', steps: ['E_rms = E\u2080 / \u221A2 = ' + E0 + ' / 1.4142 = ' + Erms + ' V', 'I_rms = E_rms / R', 'I_rms = ' + Erms + ' / ' + R, 'I_rms = ' + Irms + ' A'], answer: Irms, unit: 'A', tol: 0.1 };
    },
    /* 4 — Power from E_rms and R */
    function () {
      var Erms = randInt(100, 240);
      var R = randInt(20, 200);
      var P = round2(Erms * Erms / R);
      return { prompt: 'E_rms = ' + Erms + ' V, load R = ' + R + ' \u03A9. Find the average power (W).', steps: ['P = E_rms\u00B2 / R', 'P = ' + Erms + '\u00B2 / ' + R, 'P = ' + (Erms * Erms) + ' / ' + R, 'P = ' + P + ' W'], answer: P, unit: 'W', tol: 2 };
    },
    /* 5 — Angular velocity from RPM */
    function () {
      var rpm = randInt(5, 40) * 100;
      var w = round2(2 * Math.PI * rpm / 60);
      return { prompt: 'A generator rotates at ' + rpm + ' RPM. Find the angular velocity \u03C9 (rad/s).', steps: ['\u03C9 = 2\u03C0 \u00D7 n / 60', '\u03C9 = 2\u03C0 \u00D7 ' + rpm + ' / 60', '\u03C9 = ' + round2(2 * Math.PI * rpm) + ' / 60', '\u03C9 = ' + w + ' rad/s'], answer: w, unit: 'rad/s', tol: 1 };
    },
    /* 6 — Period from frequency */
    function () {
      var f = randInt(20, 100);
      var T = round2(1000 / f);
      return { prompt: 'An AC generator has frequency f = ' + f + ' Hz. Find the period (ms).', steps: ['T = 1 / f', 'T = 1 / ' + f, 'T = ' + round2(1 / f) + ' s', 'T = ' + T + ' ms'], answer: T, unit: 'ms', tol: 0.5 };
    },
    /* 7 — Frequency from P-pole generator */
    function () {
      var P = [2, 4, 6, 8, 10, 12][randInt(0, 5)];
      var rpm = randInt(3, 30) * 100;
      var f = round2(P * rpm / 120);
      return { prompt: 'A ' + P + '-pole alternator runs at ' + rpm + ' RPM. Find the frequency (Hz).', steps: ['f = (P \u00D7 n) / 120', 'f = (' + P + ' \u00D7 ' + rpm + ') / 120', 'f = ' + (P * rpm) + ' / 120', 'f = ' + f + ' Hz'], answer: f, unit: 'Hz', tol: 0.5 };
    },
    /* 8 — Peak current from peak EMF and R */
    function () {
      var E0 = randInt(100, 500);
      var R = randInt(10, 200);
      var I0 = round2(E0 / R);
      return { prompt: 'Peak EMF = ' + E0 + ' V, R = ' + R + ' \u03A9. Find the peak current (A).', steps: ['I\u2080 = E\u2080 / R', 'I\u2080 = ' + E0 + ' / ' + R, 'I\u2080 = ' + I0 + ' A'], answer: I0, unit: 'A', tol: 0.1 };
    },
    /* 9 — Synchronous speed from f and P */
    function () {
      var f = [50, 60][randInt(0, 1)];
      var P = [2, 4, 6, 8][randInt(0, 3)];
      var Ns = round1(120 * f / P);
      return { prompt: 'Find synchronous speed for f = ' + f + ' Hz, P = ' + P + ' poles (RPM).', steps: ['N_s = 120 \u00D7 f / P', 'N_s = 120 \u00D7 ' + f + ' / ' + P, 'N_s = ' + (120 * f) + ' / ' + P, 'N_s = ' + Ns + ' RPM'], answer: Ns, unit: 'RPM', tol: 1 };
    },
    /* 10 — Peak EMF from RMS */
    function () {
      var Erms = randInt(100, 240);
      var E0 = round2(Erms * Math.sqrt(2));
      return { prompt: 'E_rms = ' + Erms + ' V. Find the peak EMF (V).', steps: ['E\u2080 = E_rms \u00D7 \u221A2', 'E\u2080 = ' + Erms + ' \u00D7 1.4142', 'E\u2080 = ' + E0 + ' V'], answer: E0, unit: 'V', tol: 0.5 };
    },
    /* 11 — Number of turns from peak EMF */
    function () {
      var B = round2(randInt(30, 100) / 100);
      var A = round2(randInt(10, 50) / 1000);
      var rpm = randInt(10, 30) * 100;
      var w = round2(2 * Math.PI * rpm / 60);
      var E0 = randInt(100, 600);
      var N = round1(E0 / (B * A * w));
      return { prompt: 'E\u2080 = ' + E0 + ' V, B = ' + B + ' T, A = ' + A + ' m\u00B2, speed = ' + rpm + ' RPM. Find number of turns N.', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + ' / 60 = ' + w + ' rad/s', 'N = E\u2080 / (B \u00D7 A \u00D7 \u03C9)', 'N = ' + E0 + ' / (' + B + ' \u00D7 ' + A + ' \u00D7 ' + w + ')', 'N = ' + E0 + ' / ' + round2(B * A * w) + ' = ' + N], answer: N, unit: 'turns', tol: 2 };
    }
  ];

  /* ================================================================
     QUIZ POOL (18 questions — mix of MCQ and numeric)
     ================================================================ */

  var QUIZ_POOL = [
    { type: 'mcq', prompt: 'What type of rings does an AC generator use to connect the rotating coil to the external circuit?', options: ['Split rings (commutator)', 'Slip rings', 'Ball bearings', 'Insulating rings'], correct: 1 },
    { type: 'mcq', prompt: 'What law states that the induced EMF opposes the change in magnetic flux?', options: ['Ohm\'s law', 'Faraday\'s law', 'Lenz\'s law', 'Kirchhoff\'s law'], correct: 2 },
    { type: 'mcq', prompt: 'The RMS value of a sinusoidal voltage is approximately what fraction of the peak value?', options: ['0.5', '0.637', '0.707', '0.866'], correct: 2 },
    { type: 'mcq', prompt: 'For a 2-pole AC generator, the frequency equals:', options: ['n \u00D7 60', 'n / 60', 'n / 120', '120 / n'], correct: 1 },
    { type: 'mcq', prompt: 'Which component is stationary in a basic AC generator?', options: ['Armature coil', 'Slip rings', 'Stator magnets', 'Brushes and stator'], correct: 3 },
    { type: 'mcq', prompt: 'As the coil rotates from 0\u00B0 to 90\u00B0, the induced EMF:', options: ['Decreases from maximum to zero', 'Increases from zero to maximum', 'Remains constant', 'Reverses direction'], correct: 1 },
    { type: 'mcq', prompt: 'Three-phase voltages are displaced by:', options: ['90\u00B0', '120\u00B0', '180\u00B0', '60\u00B0'], correct: 1 },
    { type: 'mcq', prompt: 'The synchronous speed formula is:', options: ['N_s = 60f/P', 'N_s = 120f/P', 'N_s = Pf/120', 'N_s = 2\u03C0f/P'], correct: 1 },
    { type: 'numeric', prompt: 'Peak EMF = 200 V. Find RMS voltage (V).', answer: 141.42, unit: 'V', tol: 1 },
    { type: 'numeric', prompt: 'A 2-pole generator at 3000 RPM. Find frequency (Hz).', answer: 50, unit: 'Hz', tol: 0.5 },
    { type: 'numeric', prompt: 'N = 100, B = 1 T, A = 0.01 m\u00B2, \u03C9 = 100 rad/s. Find peak EMF (V).', answer: 100, unit: 'V', tol: 1 },
    { type: 'numeric', prompt: 'E_rms = 230 V, R = 23 \u03A9. Find average power (W).', answer: 2300, unit: 'W', tol: 5 },
    { type: 'numeric', prompt: 'A 4-pole alternator at 1800 RPM. Find frequency (Hz).', answer: 60, unit: 'Hz', tol: 0.5 },
    { type: 'numeric', prompt: 'Generator speed = 1500 RPM. Find angular velocity (rad/s).', answer: 157.08, unit: 'rad/s', tol: 1 },
    { type: 'numeric', prompt: 'Frequency = 50 Hz. Find the period (ms).', answer: 20, unit: 'ms', tol: 0.5 },
    { type: 'numeric', prompt: 'E_rms = 120 V. Find the peak EMF (V).', answer: 169.71, unit: 'V', tol: 1 },
    { type: 'numeric', prompt: 'Find synchronous speed for f = 50 Hz, P = 6 poles (RPM).', answer: 1000, unit: 'RPM', tol: 1 },
    { type: 'numeric', prompt: 'Peak EMF = 340 V, R = 100 \u03A9. Find RMS current (A).', answer: 2.40, unit: 'A', tol: 0.1 }
  ];

  /* ================================================================
     DOM REFERENCES
     ================================================================ */

  var canvas = document.getElementById('sim-canvas');
  var ctx    = canvas.getContext('2d');

  /* Sliders */
  var nSlider   = document.getElementById('n-slider');
  var bSlider   = document.getElementById('b-slider');
  var aSlider   = document.getElementById('a-slider');
  var rpmSlider = document.getElementById('rpm-slider');
  var rSlider   = document.getElementById('r-slider');
  var playBtn   = document.getElementById('play-btn');

  /* Readouts */
  var rPeak   = document.getElementById('r-peak');
  var rRms    = document.getElementById('r-rms');
  var rFreq   = document.getElementById('r-freq');
  var rIrms   = document.getElementById('r-irms');
  var rPower  = document.getElementById('r-power');
  var rPeriod = document.getElementById('r-period');

  /* Panels */
  var simPanel      = document.getElementById('sim-panel');
  var catRow        = document.getElementById('cat-row');
  var itemSelector  = document.getElementById('item-selector');
  var itemInfo      = document.getElementById('item-info');
  var conceptGrid   = document.getElementById('concept-grid');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar   = document.getElementById('practice-bar');
  var quizPanel     = document.getElementById('quiz-panel');
  var quizBar       = document.getElementById('quiz-bar');
  var quizResult    = document.getElementById('quiz-result');

  /* Practice */
  var ppPrompt   = document.getElementById('pp-prompt');
  var ppInput    = document.getElementById('pp-input');
  var ppUnit     = document.getElementById('pp-unit');
  var ppCheck    = document.getElementById('pp-check');
  var ppNext     = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScore  = document.getElementById('pbar-score-val');

  /* Quiz */
  var qbarNum = document.getElementById('qbar-num');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var angle = 0;           /* current coil angle in radians */
  var playing = true;
  var animId = null;
  var lastTime = 0;
  var waveHistory = [];    /* store last ~2 cycles of EMF values */

  /* Simulation parameters (read from sliders) */
  var simN = 100, simB = 0.5, simA = 0.01, simRPM = 1500, simR = 100;

  /* Explore state */
  var exploreCat = 'fundamentals';
  var selectedConcept = null;

  /* Practice state */
  var practiceCorrect = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* ================================================================
     CANVAS SIZING
     ================================================================ */

  /* Logical (CSS) drawing dimensions; backing store is scaled by devicePixelRatio. */
  var CSS_W = 800, CSS_H = 420;

  function sizeCanvas() {
    var parentW = canvas.parentElement.clientWidth - 16;
    var cssW = parentW;
    var cssH = Math.min(440, Math.round(cssW * 0.52));
    if (cssW < 500) cssH = Math.round(cssW * 0.62);
    CSS_W = cssW; CSS_H = cssH;
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
  }
  sizeCanvas();
  window.addEventListener('resize', function () { sizeCanvas(); draw(); });

  /* ================================================================
     CALCULATIONS
     ================================================================ */

  function calcAll() {
    var w = 2 * Math.PI * simRPM / 60;
    var f = simRPM / 60;
    var E0 = simN * simB * simA * w;
    var Erms = E0 / Math.sqrt(2);
    var I0 = E0 / simR;
    var Irms = Erms / simR;
    var P = Erms * Erms / simR;
    var T = (f > 0) ? 1000 / f : 0;
    return { w: w, f: f, E0: E0, Erms: Erms, I0: I0, Irms: Irms, P: P, T: T };
  }

  function updateReadouts() {
    var c = calcAll();
    rPeak.textContent   = c.E0 < 1000 ? c.E0.toFixed(2) : c.E0.toFixed(0);
    rRms.textContent    = c.Erms < 1000 ? c.Erms.toFixed(2) : c.Erms.toFixed(0);
    rFreq.textContent   = c.f.toFixed(2);
    rIrms.textContent   = c.Irms < 100 ? c.Irms.toFixed(3) : c.Irms.toFixed(1);
    rPower.textContent  = c.P < 1000 ? c.P.toFixed(2) : c.P.toFixed(0);
    rPeriod.textContent = c.T.toFixed(2);
  }

  /* ================================================================
     DRAWING — SIMULATE MODE
     ================================================================ */

  function draw() {
    var W = CSS_W;
    var H = CSS_H;
    ctx.clearRect(0, 0, W, H);

    if (mode === 'simulate') {
      drawGenerator(W, H);
    } else if (mode === 'explore' && selectedConcept) {
      drawConceptDiagram(W, H, selectedConcept.diagram);
    }
  }

  function drawArrow(c, x1, y1, x2, y2, sz) {
    sz = sz || 7;
    var ang = Math.atan2(y2 - y1, x2 - x1);
    c.beginPath();
    c.moveTo(x1, y1); c.lineTo(x2, y2);
    c.moveTo(x2, y2);
    c.lineTo(x2 - sz * Math.cos(ang - 0.45), y2 - sz * Math.sin(ang - 0.45));
    c.moveTo(x2, y2);
    c.lineTo(x2 - sz * Math.cos(ang + 0.45), y2 - sz * Math.sin(ang + 0.45));
    c.stroke();
  }

  function drawGenerator(W, H) {
    var c = calcAll();

    var bgGrad = ctx.createRadialGradient(W * 0.3, H * 0.5, 20, W * 0.3, H * 0.5, Math.max(W, H));
    bgGrad.addColorStop(0, '#101728');
    bgGrad.addColorStop(1, '#070a14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(40,55,90,0.25)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 32) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    var leftPanelW = W * 0.46;
    var midX = leftPanelW * 0.5;
    var midY = H * 0.45;
    var genR = Math.min(leftPanelW * 0.30, H * 0.30);

    ctx.strokeStyle = 'rgba(120,140,180,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(leftPanelW, 16); ctx.lineTo(leftPanelW, H - 16); ctx.stroke();

    var magW = genR * 0.36;
    var magH = genR * 1.7;
    var magYTop = midY - magH / 2;

    var nGrad = ctx.createLinearGradient(midX - genR - magW, 0, midX - genR, 0);
    nGrad.addColorStop(0, '#0d47a1'); nGrad.addColorStop(0.5, '#1e88e5'); nGrad.addColorStop(1, '#42a5f5');
    ctx.fillStyle = nGrad;
    ctx.beginPath();
    ctx.moveTo(midX - genR - magW, magYTop + 8);
    ctx.arcTo(midX - genR - magW, magYTop, midX - genR - magW + 10, magYTop, 8);
    ctx.lineTo(midX - genR - 4, magYTop);
    ctx.quadraticCurveTo(midX - genR + genR * 0.18, midY, midX - genR - 4, magYTop + magH);
    ctx.lineTo(midX - genR - magW + 10, magYTop + magH);
    ctx.arcTo(midX - genR - magW, magYTop + magH, midX - genR - magW, magYTop + magH - 10, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(midX - genR - magW + 4, magYTop + 6, 3, magH - 12);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + Math.max(14, genR * 0.26) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 4;
    ctx.fillText('N', midX - genR - magW * 0.55, midY);
    ctx.shadowBlur = 0;

    var sGrad = ctx.createLinearGradient(midX + genR, 0, midX + genR + magW, 0);
    sGrad.addColorStop(0, '#b71c1c'); sGrad.addColorStop(0.5, '#e53935'); sGrad.addColorStop(1, '#ef5350');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.moveTo(midX + genR + 4, magYTop);
    ctx.lineTo(midX + genR + magW - 10, magYTop);
    ctx.arcTo(midX + genR + magW, magYTop, midX + genR + magW, magYTop + 10, 8);
    ctx.lineTo(midX + genR + magW, magYTop + magH - 10);
    ctx.arcTo(midX + genR + magW, magYTop + magH, midX + genR + magW - 10, magYTop + magH, 8);
    ctx.lineTo(midX + genR + 4, magYTop + magH);
    ctx.quadraticCurveTo(midX + genR - genR * 0.18, midY, midX + genR + 4, magYTop);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(midX + genR + magW - 7, magYTop + 6, 3, magH - 12);
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 4;
    ctx.fillText('S', midX + genR + magW * 0.55, midY);
    ctx.shadowBlur = 0;

    var nLines = 7;
    ctx.lineWidth = 1.1;
    for (var fl = 0; fl < nLines; fl++) {
      var tF = (fl - (nLines - 1) / 2) / ((nLines - 1) / 2);
      var bow = Math.abs(tF) * genR * 1.1;
      var signT = tF >= 0 ? 1 : -1;
      var startX = midX - genR + 2;
      var endX   = midX + genR - 2;
      var startY = midY + tF * magH * 0.32;
      var endY   = midY + tF * magH * 0.32;
      var ctrlY  = startY + signT * bow;
      var alpha = 0.45 - Math.abs(tF) * 0.22;
      ctx.strokeStyle = 'rgba(150,200,255,' + alpha + ')';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(midX, ctrlY, endX, endY);
      ctx.stroke();
      var midxA = midX;
      var midyA = startY * 0.25 + ctrlY * 0.5 + endY * 0.25;
      ctx.fillStyle = 'rgba(150,200,255,' + alpha + ')';
      ctx.beginPath();
      ctx.moveTo(midxA + 5, midyA);
      ctx.lineTo(midxA - 4, midyA - 4);
      ctx.lineTo(midxA - 4, midyA + 4);
      ctx.closePath(); ctx.fill();
    }

    ctx.strokeStyle = 'rgba(180,180,210,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.arc(midX, midY, genR * 0.55, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    var shaftGrad = ctx.createLinearGradient(midX - 5, 0, midX + 5, 0);
    shaftGrad.addColorStop(0, '#3a4258'); shaftGrad.addColorStop(0.5, '#7d8aa8'); shaftGrad.addColorStop(1, '#3a4258');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(midX - 4, midY - genR * 0.55 - 8, 8, 14);

    var coilW = genR * 0.85;
    var coilH = genR * 0.95;
    var sinA = Math.sin(angle);
    var instEMF01 = Math.abs(sinA);

    ctx.save();
    ctx.translate(midX, midY);
    ctx.rotate(angle);

    var turns = 5;
    for (var ti = 0; ti < turns; ti++) {
      var ox = (ti - (turns - 1) / 2) * 1.4;
      ctx.strokeStyle = 'rgba(186,104,200,' + (0.35 + 0.15 * (1 - ti / turns)) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(-coilW / 2 + ox, -coilH / 2, coilW, coilH);
      ctx.stroke();
    }

    var coilFill = ctx.createLinearGradient(-coilW / 2, 0, coilW / 2, 0);
    coilFill.addColorStop(0, 'rgba(123,31,162,0.14)');
    coilFill.addColorStop(0.5, 'rgba(186,104,200,0.05)');
    coilFill.addColorStop(1, 'rgba(123,31,162,0.14)');
    ctx.fillStyle = coilFill;
    ctx.beginPath();
    ctx.rect(-coilW / 2, -coilH / 2, coilW, coilH);
    ctx.fill();
    ctx.strokeStyle = '#ba68c8'; ctx.lineWidth = 2.5; ctx.stroke();

    var wireR = 9 + 4 * instEMF01;
    var leftColor  = sinA >= 0 ? '#3ddc84' : '#ff5555';
    var rightColor = sinA >= 0 ? '#ff5555' : '#3ddc84';

    var lwX = -coilW / 2;
    var lGrad = ctx.createRadialGradient(lwX, 0, 1, lwX, 0, wireR);
    lGrad.addColorStop(0, leftColor); lGrad.addColorStop(0.7, leftColor); lGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lGrad;
    ctx.beginPath(); ctx.arc(lwX, 0, wireR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sinA >= 0 ? '⊙' : '⊗', lwX, 0);

    var rwX = coilW / 2;
    var rGrad = ctx.createRadialGradient(rwX, 0, 1, rwX, 0, wireR);
    rGrad.addColorStop(0, rightColor); rGrad.addColorStop(0.7, rightColor); rGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rGrad;
    ctx.beginPath(); ctx.arc(rwX, 0, wireR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(sinA >= 0 ? '⊗' : '⊙', rwX, 0);

    ctx.strokeStyle = 'rgba(245,200,66,0.85)';
    ctx.lineWidth = 1.6;
    drawArrow(ctx, 0, 0, 0, -coilH * 0.55, 7);
    ctx.fillStyle = 'rgba(245,200,66,0.9)';
    ctx.font = 'italic bold 11px serif';
    ctx.textAlign = 'left';
    ctx.fillText('n', 8, -coilH * 0.55);

    ctx.restore();

    var protR = genR * 0.62;
    for (var tk = 0; tk < 12; tk++) {
      var tang = tk * Math.PI / 6;
      var tx1 = midX + protR * Math.cos(tang), ty1 = midY + protR * Math.sin(tang);
      var tlen = tk % 3 === 0 ? 6 : 3;
      var tx2 = midX + (protR + tlen) * Math.cos(tang);
      var ty2 = midY + (protR + tlen) * Math.sin(tang);
      ctx.strokeStyle = 'rgba(206,147,216,' + (tk % 3 === 0 ? 0.7 : 0.4) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke();
    }
    var dotX = midX + protR * Math.cos(-Math.PI / 2 + angle);
    var dotY = midY + protR * Math.sin(-Math.PI / 2 + angle);
    var glowG = ctx.createRadialGradient(dotX, dotY, 1, dotX, dotY, 12);
    glowG.addColorStop(0, '#ffd54f'); glowG.addColorStop(1, 'rgba(255,213,79,0)');
    ctx.fillStyle = glowG;
    ctx.beginPath(); ctx.arc(dotX, dotY, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd54f';
    ctx.beginPath(); ctx.arc(dotX, dotY, 4, 0, Math.PI * 2); ctx.fill();

    var angleDeg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    ctx.fillStyle = '#ce93d8';
    ctx.font = 'bold ' + Math.max(10, genR * 0.14) + 'px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('θ = ' + angleDeg.toFixed(0) + '°', midX, midY + genR + 14);

    var srY = midY + genR * 0.55 + 26;
    var srGap = 18;
    ctx.strokeStyle = '#5a6680'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(midX, midY + genR * 0.55); ctx.lineTo(midX, srY - 8); ctx.stroke();

    function drawSlipRing(cx, cy) {
      var srGrad = ctx.createLinearGradient(cx - 11, cy, cx + 11, cy);
      srGrad.addColorStop(0, '#4a148c'); srGrad.addColorStop(0.5, '#ce93d8'); srGrad.addColorStop(1, '#4a148c');
      ctx.fillStyle = srGrad;
      roundRect(ctx, cx - 11, cy - 6, 22, 12, 3); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1; ctx.stroke();
    }
    drawSlipRing(midX - srGap, srY);
    drawSlipRing(midX + srGap, srY);

    function drawBrush(cx, cy) {
      ctx.fillStyle = '#37474f';
      ctx.strokeStyle = '#263238'; ctx.lineWidth = 1;
      roundRect(ctx, cx - 5, cy + 8, 10, 14, 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (var sp = 0; sp < 5; sp++) {
        var y0 = cy + 22 + sp * 3;
        ctx.moveTo(cx - 3, y0); ctx.lineTo(cx + 3, y0 + 1.5);
      }
      ctx.stroke();
    }
    drawBrush(midX - srGap, srY);
    drawBrush(midX + srGap, srY);

    ctx.strokeStyle = 'rgba(186,104,200,0.55)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(midX - srGap, srY - 6); ctx.lineTo(midX, midY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(midX + srGap, srY - 6); ctx.lineTo(midX, midY); ctx.stroke();

    var circY = srY + 50;
    var loadW = 60;
    var loadX = midX - loadW / 2;
    ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(midX - srGap, srY + 22);
    ctx.lineTo(midX - srGap, circY);
    ctx.lineTo(loadX, circY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX + srGap, srY + 22);
    ctx.lineTo(midX + srGap, circY);
    ctx.lineTo(loadX + loadW, circY);
    ctx.stroke();

    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath();
    var zigN = 6;
    for (var zi = 0; zi <= zigN; zi++) {
      var zx = loadX + (loadW * zi / zigN);
      var zy = circY + (zi % 2 === 0 ? 0 : -7);
      if (zi === 0) ctx.moveTo(zx, zy); else ctx.lineTo(zx, zy);
    }
    ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('R = ' + simR + ' Ω', midX, circY + 14);

    var flowDir = sinA >= 0 ? 1 : -1;
    var flowT = (playing ? (Date.now() * 0.001 * (1 + simRPM / 800)) : 0);
    flowT = flowT - Math.floor(flowT);
    var flowAlpha = 0.4 + 0.6 * instEMF01;
    ctx.fillStyle = sinA >= 0 ? 'rgba(61,220,132,' + flowAlpha + ')' : 'rgba(255,85,85,' + flowAlpha + ')';

    function flowArrow(x, y, dx, dy) {
      var ang2 = Math.atan2(dy, dx);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang2);
      ctx.beginPath();
      ctx.moveTo(6, 0); ctx.lineTo(-4, -4); ctx.lineTo(-4, 4); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    var segs = [
      { x1: midX - srGap, y1: srY + 22, x2: midX - srGap, y2: circY },
      { x1: midX - srGap, y1: circY, x2: loadX, y2: circY },
      { x1: loadX + loadW, y1: circY, x2: midX + srGap, y2: circY },
      { x1: midX + srGap, y1: circY, x2: midX + srGap, y2: srY + 22 }
    ];
    var totalLen = 0;
    segs.forEach(function (s) { s.len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1); totalLen += s.len; });
    var arrowCount = 4;
    for (var ai = 0; ai < arrowCount; ai++) {
      var u = (flowT + ai / arrowCount) * (flowDir > 0 ? 1 : -1);
      u = ((u % 1) + 1) % 1;
      var travel = u * totalLen;
      var acc = 0;
      for (var si = 0; si < segs.length; si++) {
        if (travel <= acc + segs[si].len) {
          var localU = (travel - acc) / segs[si].len;
          var ax = segs[si].x1 + (segs[si].x2 - segs[si].x1) * localU;
          var ay = segs[si].y1 + (segs[si].y2 - segs[si].y1) * localU;
          var ddx = (segs[si].x2 - segs[si].x1) * flowDir;
          var ddy = (segs[si].y2 - segs[si].y1) * flowDir;
          flowArrow(ax, ay, ddx, ddy);
          break;
        }
        acc += segs[si].len;
      }
    }

    ctx.fillStyle = '#e0e7f5';
    ctx.font = 'bold ' + Math.max(12, W * 0.016) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('AC Generator', midX, 20);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = 'rgba(180,200,240,0.6)';
    ctx.fillText('Rotating coil in magnetic field', midX, 34);

    drawWaveform(leftPanelW + 14, 14, W - 14, H - 14, c);
  }

  function drawWaveform(graphL, graphT, graphR, graphB, c) {
    var graphW = graphR - graphL;
    var graphH = graphB - graphT;
    var sinA = Math.sin(angle);

    var cardGrad = ctx.createLinearGradient(0, graphT, 0, graphB);
    cardGrad.addColorStop(0, 'rgba(20,28,48,0.85)');
    cardGrad.addColorStop(1, 'rgba(10,15,28,0.85)');
    ctx.fillStyle = cardGrad;
    roundRect(ctx, graphL, graphT, graphW, graphH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,180,0.18)';
    ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = '#e0e7f5';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('EMF Waveform', graphL + 12, graphT + 8);
    ctx.fillStyle = 'rgba(180,200,240,0.55)';
    ctx.font = '10px sans-serif';
    ctx.fillText('e(t) = E₀ sin(ωt)   —   2 cycles', graphL + 12, graphT + 24);

    var plotL = graphL + 40;
    var plotR = graphR - 14;
    var plotT = graphT + 44;
    var plotB = graphB - 28;
    var plotW = plotR - plotL;
    var plotH = plotB - plotT;
    var midPY = plotT + plotH * 0.5;
    var ampPx = plotH * 0.42;

    ctx.strokeStyle = 'rgba(60,80,120,0.35)';
    ctx.lineWidth = 0.5;
    for (var vi = 0; vi <= 8; vi++) {
      var vx = plotL + plotW * vi / 8;
      ctx.beginPath(); ctx.moveTo(vx, plotT); ctx.lineTo(vx, plotB); ctx.stroke();
    }
    for (var hi = 0; hi <= 4; hi++) {
      var hy = plotT + plotH * hi / 4;
      ctx.beginPath(); ctx.moveTo(plotL, hy); ctx.lineTo(plotR, hy); ctx.stroke();
    }

    if (c.E0 > 0) {
      var rmsY = c.Erms / c.E0 * ampPx;
      ctx.fillStyle = 'rgba(61,220,132,0.08)';
      ctx.fillRect(plotL, midPY - rmsY, plotW, rmsY * 2);
      ctx.strokeStyle = 'rgba(61,220,132,0.55)';
      ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(plotL, midPY - rmsY); ctx.lineTo(plotR, midPY - rmsY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(plotL, midPY + rmsY); ctx.lineTo(plotR, midPY + rmsY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(61,220,132,0.85)';
      ctx.font = 'bold 9px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('+E_rms', plotL + 4, midPY - rmsY - 6);
      ctx.fillText('-E_rms', plotL + 4, midPY + rmsY + 6);
    }

    ctx.strokeStyle = 'rgba(180,200,240,0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(plotL, midPY); ctx.lineTo(plotR, midPY); ctx.stroke();

    ctx.fillStyle = 'rgba(180,200,240,0.7)';
    ctx.font = '9px monospace'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    if (c.E0 > 0) {
      ctx.fillText('+' + c.E0.toFixed(0), plotL - 4, plotT + (plotH * 0.5 - ampPx));
      ctx.fillText('-' + c.E0.toFixed(0), plotL - 4, plotT + (plotH * 0.5 + ampPx));
    }
    ctx.fillText('0', plotL - 4, midPY);
    ctx.save(); ctx.translate(plotL - 28, midPY); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(180,200,240,0.65)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('EMF (V)', 0, 0); ctx.restore();

    var phaseLabels = ['0', 'π/2', 'π', '3π/2', '2π', '5π/2', '3π', '7π/2', '4π'];
    ctx.fillStyle = 'rgba(180,200,240,0.55)';
    ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var li = 0; li <= 8; li++) {
      ctx.fillText(phaseLabels[li], plotL + plotW * li / 8, plotB + 4);
    }
    ctx.fillStyle = 'rgba(180,200,240,0.65)'; ctx.font = '10px sans-serif';
    ctx.fillText('ωt   (T = ' + c.T.toFixed(1) + ' ms)', (plotL + plotR) / 2, plotB + 16);

    if (c.E0 > 0) {
      var numPoints = 240;

      var fillGrad = ctx.createLinearGradient(0, plotT, 0, plotB);
      fillGrad.addColorStop(0, 'rgba(186,104,200,0.45)');
      fillGrad.addColorStop(0.5, 'rgba(123,31,162,0.05)');
      fillGrad.addColorStop(1, 'rgba(186,104,200,0.45)');
      ctx.fillStyle = fillGrad;
      ctx.beginPath();
      ctx.moveTo(plotL, midPY);
      for (var p = 0; p <= numPoints; p++) {
        var tt = p / numPoints;
        var phi = angle - (4 * Math.PI * (1 - tt));
        var emf = Math.sin(phi);
        var px = plotL + tt * plotW;
        var py = midPY - emf * ampPx;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(plotR, midPY);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = 'rgba(186,104,200,0.6)';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (var pp = 0; pp <= numPoints; pp++) {
        var ttp = pp / numPoints;
        var phi2 = angle - (4 * Math.PI * (1 - ttp));
        var emf2 = Math.sin(phi2);
        var px2 = plotL + ttp * plotW;
        var py2 = midPY - emf2 * ampPx;
        if (pp === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      var instEMF = c.E0 * sinA;
      var markerY = midPY - sinA * ampPx;
      ctx.strokeStyle = 'rgba(255,213,79,0.65)';
      ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(plotR, plotT); ctx.lineTo(plotR, plotB); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(plotL, markerY); ctx.lineTo(plotR, markerY); ctx.stroke();
      ctx.setLineDash([]);
      var mgrad = ctx.createRadialGradient(plotR, markerY, 1, plotR, markerY, 14);
      mgrad.addColorStop(0, '#ffd54f'); mgrad.addColorStop(1, 'rgba(255,213,79,0)');
      ctx.fillStyle = mgrad;
      ctx.beginPath(); ctx.arc(plotR, markerY, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath(); ctx.arc(plotR, markerY, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

      var badgeTxt = 'e = ' + instEMF.toFixed(1) + ' V';
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      var bw = ctx.measureText(badgeTxt).width + 16;
      var bx = plotR - bw - 4, by = plotT + 6;
      ctx.fillStyle = 'rgba(255,213,79,0.18)';
      roundRect(ctx, bx, by, bw, 18, 4); ctx.fill();
      ctx.strokeStyle = 'rgba(255,213,79,0.7)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffd54f';
      ctx.fillText(badgeTxt, bx + 8, by + 9);
    }

    var pcx = plotL + 38, pcy = plotT + 38;
    var pR = 24;
    ctx.fillStyle = 'rgba(13,17,30,0.85)';
    ctx.beginPath(); ctx.arc(pcx, pcy, pR + 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,180,0.3)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(pcx, pcy, pR, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,140,180,0.4)';
    ctx.beginPath(); ctx.moveTo(pcx - pR, pcy); ctx.lineTo(pcx + pR, pcy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pcx, pcy - pR); ctx.lineTo(pcx, pcy + pR); ctx.stroke();
    var pvx = pcx + pR * Math.cos(angle);
    var pvy = pcy - pR * Math.sin(angle);
    ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 2;
    drawArrow(ctx, pcx, pcy, pvx, pvy, 6);
    ctx.fillStyle = 'rgba(206,147,216,0.75)';
    ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('phasor', pcx, pcy + pR + 4);
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }

  /* ================================================================
     DRAWING — EXPLORE CONCEPT DIAGRAMS
     ================================================================ */

  function drawConceptDiagram(W, H, diagramId) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2;
    var cy = H / 2;
    var scale = Math.min(W, H) / 400;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    switch (diagramId) {
      case 'emfEquation':
        drawEMFDiagram();
        break;
      case 'faradaysLaw':
        drawFaradayDiagram();
        break;
      case 'lenzLaw':
        drawLenzDiagram();
        break;
      case 'rmsValue':
        drawRMSDiagram();
        break;
      case 'frequency':
        drawFrequencyDiagram();
        break;
      case 'angularVelocity':
        drawAngularVelDiagram();
        break;
      case 'stator':
      case 'rotor':
      case 'slipRings':
      case 'brushes':
      case 'fieldWinding':
      case 'armatureWinding':
        drawComponentDiagram(diagramId);
        break;
      case 'powerGeneration':
      case 'singlePhase':
      case 'threePhase':
      case 'synchronousGen':
        drawAppDiagram(diagramId);
        break;
    }

    ctx.restore();
  }

  function drawEMFDiagram() {
    /* Show the EMF equation with a coil and vector diagram */
    ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 3; ctx.fillStyle = 'rgba(123,31,162,0.1)';
    ctx.beginPath(); ctx.rect(-60, -50, 120, 100); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
    ctx.fillText('E\u2080 = NBA\u03C9', 0, -70);
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#6b7a99';
    ctx.fillText('N = turns', -100, 90); ctx.fillText('B = flux density (T)', 0, 110);
    ctx.fillText('A = area (m\u00B2)', 100, 90); ctx.fillText('\u03C9 = angular vel (rad/s)', 0, 130);
    /* Arrows indicating rotation */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 80, -0.5, 1.5); ctx.stroke();
    ctx.fillStyle = '#42a5f5';
    ctx.beginPath(); ctx.moveTo(80 * Math.cos(1.5), 80 * Math.sin(1.5));
    ctx.lineTo(80 * Math.cos(1.5) - 8, 80 * Math.sin(1.5) - 8);
    ctx.lineTo(80 * Math.cos(1.5) + 4, 80 * Math.sin(1.5) - 10); ctx.fill();
  }

  function drawFaradayDiagram() {
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
    ctx.fillText('e = -N \u00D7 d\u03A6/dt', 0, -80);
    /* Coil */
    ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 2.5;
    for (var i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.ellipse(-30 + i * 15, 0, 10, 40, 0, 0, Math.PI * 2); ctx.stroke();
    }
    /* Magnet approaching */
    ctx.fillStyle = '#1e88e5';
    roundRect(ctx, -140, -25, 50, 50, 5); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('N', -115, 5);
    /* Arrow */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-85, 0); ctx.lineTo(-50, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-58, -6); ctx.moveTo(-50, 0); ctx.lineTo(-58, 6); ctx.stroke();
    ctx.fillStyle = '#6b7a99'; ctx.font = '12px sans-serif';
    ctx.fillText('Changing flux induces EMF', 0, 70);
  }

  function drawLenzDiagram() {
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText('Lenz\'s Law: Opposes \u0394\u03A6', 0, -90);
    /* Coil */
    ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 60, 60, 0, 0, Math.PI * 2); ctx.stroke();
    /* Incoming flux (down arrow) */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -120); ctx.lineTo(0, -70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -70); ctx.lineTo(-6, -78); ctx.moveTo(0, -70); ctx.lineTo(6, -78); ctx.stroke();
    ctx.fillStyle = '#42a5f5'; ctx.font = '11px sans-serif';
    ctx.fillText('\u03A6 increasing', 50, -95);
    /* Opposing field (up arrow, inside coil) */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, -30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-6, -22); ctx.moveTo(0, -30); ctx.lineTo(6, -22); ctx.stroke();
    ctx.fillStyle = '#3ddc84'; ctx.font = '11px sans-serif';
    ctx.fillText('Induced B', 50, 0);
    ctx.fillText('(opposes)', 50, 14);
    ctx.fillStyle = '#6b7a99'; ctx.font = '12px sans-serif';
    ctx.fillText('Induced current opposes the change', 0, 90);
  }

  function drawRMSDiagram() {
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText('E_rms = E\u2080 / \u221A2 \u2248 0.707 \u00D7 E\u2080', 0, -100);
    /* Sine wave */
    ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var x = -150; x <= 150; x++) {
      var y = -60 * Math.sin(x * Math.PI / 75);
      if (x === -150) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    /* RMS line */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(-150, -42.4); ctx.lineTo(150, -42.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-150, 42.4); ctx.lineTo(150, 42.4); ctx.stroke();
    ctx.setLineDash([]);
    /* Labels */
    ctx.fillStyle = '#7b1fa2'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('E\u2080', 155, -56);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('E_rms', 155, -38);
    /* Zero line */
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(150, 0); ctx.stroke();
    ctx.fillStyle = '#6b7a99'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('RMS = DC equivalent for heating', 0, 90);
  }

  function drawFrequencyDiagram() {
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText('f = n/60 (2-pole) | f = Pn/120', 0, -100);
    /* One complete cycle */
    ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var x = -120; x <= 120; x++) {
      var y = -50 * Math.sin(x * Math.PI / 120);
      if (x === -120) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    /* Period markers */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(-120, -70); ctx.lineTo(-120, 70); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(120, -70); ctx.lineTo(120, 70); ctx.stroke();
    ctx.setLineDash([]);
    /* T label */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-120, 65); ctx.lineTo(120, 65); ctx.stroke();
    ctx.fillStyle = '#42a5f5'; ctx.font = '13px monospace';
    ctx.fillText('T = 1/f', 0, 80);
    ctx.fillStyle = '#6b7a99'; ctx.font = '12px sans-serif';
    ctx.fillText('One complete cycle', 0, -70);
  }

  function drawAngularVelDiagram() {
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center';
    ctx.fillText('\u03C9 = 2\u03C0n / 60 rad/s', 0, -100);
    /* Circular arrow */
    ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 60, 0.2, 5.8); ctx.stroke();
    /* Arrow head */
    ctx.fillStyle = '#7b1fa2';
    var ax = 60 * Math.cos(5.8), ay = 60 * Math.sin(5.8);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 10, ay + 2); ctx.lineTo(ax + 4, ay - 8); ctx.fill();
    /* Center dot */
    ctx.fillStyle = '#42a5f5';
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    /* Labels */
    ctx.fillStyle = '#dde3f0'; ctx.font = 'bold 14px monospace';
    ctx.fillText('\u03C9', 0, 5);
    ctx.fillStyle = '#6b7a99'; ctx.font = '12px sans-serif';
    ctx.fillText('Also: \u03C9 = 2\u03C0f', 0, 90);
  }

  function drawComponentDiagram(id) {
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    var labels = {
      stator: 'Stator (Stationary Part)',
      rotor: 'Rotor (Rotating Part)',
      slipRings: 'Slip Rings',
      brushes: 'Carbon Brushes',
      fieldWinding: 'Field Winding',
      armatureWinding: 'Armature Winding'
    };
    ctx.fillText(labels[id] || id, 0, -110);

    /* Generic generator cross-section */
    /* Outer circle (stator) */
    ctx.strokeStyle = id === 'stator' ? '#7b1fa2' : '#2a3050';
    ctx.lineWidth = id === 'stator' ? 4 : 2;
    ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.stroke();
    if (id === 'stator') {
      ctx.fillStyle = 'rgba(123,31,162,0.1)';
      ctx.beginPath(); ctx.arc(0, 0, 80, 0, Math.PI * 2); ctx.fill();
    }

    /* Inner circle (rotor) */
    ctx.strokeStyle = id === 'rotor' ? '#7b1fa2' : '#2a3050';
    ctx.lineWidth = id === 'rotor' ? 4 : 2;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.stroke();
    if (id === 'rotor') {
      ctx.fillStyle = 'rgba(123,31,162,0.1)';
      ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
    }

    /* Magnets on stator */
    ctx.fillStyle = '#1e88e5';
    roundRect(ctx, -90, -20, 15, 40, 3); ctx.fill();
    ctx.fillStyle = '#e53935';
    roundRect(ctx, 75, -20, 15, 40, 3); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif';
    ctx.fillText('N', -82, 4); ctx.fillText('S', 83, 4);

    /* Coil on rotor */
    ctx.strokeStyle = (id === 'armatureWinding' || id === 'fieldWinding') ? '#7b1fa2' : '#7b1fa2';
    ctx.lineWidth = (id === 'armatureWinding' || id === 'fieldWinding') ? 3 : 2;
    ctx.beginPath(); ctx.rect(-25, -30, 50, 60); ctx.stroke();

    /* Slip rings */
    if (id === 'slipRings') {
      ctx.fillStyle = '#7b1fa2';
      ctx.beginPath(); ctx.ellipse(-10, 60, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, 60, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ce93d8'; ctx.font = '10px sans-serif';
      ctx.fillText('Slip Ring 1', -10, 80); ctx.fillText('Slip Ring 2', 10, 92);
    }

    /* Brushes */
    if (id === 'brushes') {
      ctx.fillStyle = '#546e7a';
      ctx.fillRect(-18, 65, 12, 15);
      ctx.fillRect(6, 65, 12, 15);
      ctx.fillStyle = '#78909c'; ctx.font = '10px sans-serif';
      ctx.fillText('Brush', -12, 92); ctx.fillText('Brush', 12, 92);
    }

    ctx.fillStyle = '#6b7a99'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    var descs = {
      stator: 'Provides the magnetic field (outer frame)',
      rotor: 'Carries the rotating coil (inner shaft)',
      slipRings: 'Continuous rings for AC output',
      brushes: 'Spring-loaded carbon contacts',
      fieldWinding: 'Electromagnet creating B field',
      armatureWinding: 'Output coil where EMF is induced'
    };
    ctx.fillText(descs[id], 0, 120);
  }

  function drawAppDiagram(id) {
    ctx.fillStyle = '#ce93d8'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    var titles = {
      powerGeneration: 'Power Generation System',
      singlePhase: 'Single-Phase Waveform',
      threePhase: 'Three-Phase Waveforms (120\u00B0 apart)',
      synchronousGen: 'Synchronous Speed: N_s = 120f/P'
    };
    ctx.fillText(titles[id], 0, -110);

    if (id === 'singlePhase' || id === 'threePhase') {
      /* Draw waveforms */
      var colors = ['#7b1fa2', '#42a5f5', '#3ddc84'];
      var phases = id === 'threePhase' ? 3 : 1;
      for (var ph = 0; ph < phases; ph++) {
        ctx.strokeStyle = colors[ph]; ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (var x = -150; x <= 150; x++) {
          var y = -50 * Math.sin((x * Math.PI / 75) - (ph * 2 * Math.PI / 3));
          if (x === -150) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      /* Zero line */
      ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(150, 0); ctx.stroke();
      if (id === 'threePhase') {
        ctx.fillStyle = '#7b1fa2'; ctx.font = '11px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Phase A', 155, -40);
        ctx.fillStyle = '#42a5f5'; ctx.fillText('Phase B', 155, -20);
        ctx.fillStyle = '#3ddc84'; ctx.fillText('Phase C', 155, 0);
      }
    } else if (id === 'powerGeneration') {
      /* Turbine -> Generator -> Load */
      ctx.fillStyle = '#1e88e5';
      roundRect(ctx, -130, -30, 60, 60, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Turbine', -100, 5);
      ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-30, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-38, -5); ctx.moveTo(-30, 0); ctx.lineTo(-38, 5); ctx.stroke();
      ctx.fillStyle = '#7b1fa2';
      roundRect(ctx, -30, -30, 60, 60, 8); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillText('Generator', 0, -5); ctx.fillText('~', 0, 12);
      ctx.strokeStyle = '#6b7a99';
      ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(70, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(62, -5); ctx.moveTo(70, 0); ctx.lineTo(62, 5); ctx.stroke();
      ctx.fillStyle = '#f5c842';
      roundRect(ctx, 70, -30, 60, 60, 8); ctx.fill();
      ctx.fillStyle = '#0d1117'; ctx.fillText('Load', 100, 5);
    } else if (id === 'synchronousGen') {
      /* Table of synchronous speeds */
      ctx.fillStyle = '#dde3f0'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
      var data = [
        ['Poles', '50 Hz', '60 Hz'],
        ['2', '3000', '3600'],
        ['4', '1500', '1800'],
        ['6', '1000', '1200'],
        ['8', '750', '900']
      ];
      for (var row = 0; row < data.length; row++) {
        ctx.fillStyle = row === 0 ? '#7b1fa2' : '#dde3f0';
        ctx.font = row === 0 ? 'bold 12px monospace' : '12px monospace';
        for (var col = 0; col < 3; col++) {
          ctx.fillText(data[row][col], -60 + col * 60, -50 + row * 28);
        }
      }
    }

    ctx.fillStyle = '#6b7a99'; ctx.font = '11px sans-serif'; ctx.textAlign = 'center';
    var footers = {
      powerGeneration: 'Mechanical energy \u2192 Electrical energy',
      singlePhase: 'Power pulsates to zero twice per cycle',
      threePhase: 'Constant total power, efficient transmission',
      synchronousGen: 'N_s (RPM) for standard frequencies'
    };
    ctx.fillText(footers[id], 0, 110);
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate(timestamp) {
    if (!playing || mode !== 'simulate') return;
    if (!lastTime) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    var w = 2 * Math.PI * simRPM / 60;
    /* Scale animation speed: show at a visually pleasant rate */
    var visualSpeed = Math.min(w, 8); /* cap visual rotation speed */
    angle += visualSpeed * dt;
    if (angle > Math.PI * 100) angle -= Math.PI * 100; /* prevent overflow */

    draw();
    animId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    playing = true;
    lastTime = 0;
    playBtn.innerHTML = '&#9646;&#9646; Pause';
    animId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    playing = false;
    playBtn.innerHTML = '&#9654; Play';
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  /* ================================================================
     SLIDER HANDLERS
     ================================================================ */

  function updateSliderVals() {
    simN   = parseInt(nSlider.value, 10);
    simB   = parseFloat(bSlider.value);
    simA   = parseFloat(aSlider.value);
    simRPM = parseInt(rpmSlider.value, 10);
    simR   = parseInt(rSlider.value, 10);

    updateReadouts();
    if (!playing) draw();
  }

  [nSlider, bSlider, aSlider, rpmSlider, rSlider].forEach(function (sl) {
    sl.addEventListener('input', function () {
      updateSliderVals();
      if (typeof syncSteppersFromSliders === 'function') syncSteppersFromSliders();
    });
  });

  playBtn.addEventListener('click', function () {
    if (playing) stopAnimation(); else startAnimation();
  });

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.mode;
    if (newMode === mode) return;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;
    stopAnimation();

    /* Hide all panels */
    simPanel.style.display = 'none';
    catRow.style.display = 'none';
    itemSelector.style.display = 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';

    var canvasCard = canvas.parentElement;

    switch (m) {
      case 'simulate':
        simPanel.style.display = '';
        canvasCard.style.display = '';
        startAnimation();
        updateReadouts();
        break;
      case 'explore':
        canvasCard.style.display = '';
        catRow.style.display = '';
        itemSelector.style.display = '';
        buildConceptGrid();
        if (!selectedConcept) {
          var first = CONCEPTS.filter(function (c) { return c.cat === exploreCat; })[0];
          if (first) selectConcept(first);
        }
        draw();
        break;
      case 'practice':
        canvasCard.style.display = 'none';
        practicePanel.style.display = '';
        practiceBar.style.display = '';
        if (!currentProblem) newPractice();
        break;
      case 'quiz':
        canvasCard.style.display = 'none';
        startQuiz();
        break;
    }
  }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.cat === exploreCat);
    });
    selectedConcept = null;
    buildConceptGrid();
    var first = CONCEPTS.filter(function (c) { return c.cat === exploreCat; })[0];
    if (first) selectConcept(first);
  });

  function buildConceptGrid() {
    conceptGrid.innerHTML = '';
    var items = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    items.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept && selectedConcept.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () { selectConcept(c); });
      conceptGrid.appendChild(btn);
    });
  }

  function selectConcept(c) {
    selectedConcept = c;
    /* Update grid buttons */
    document.querySelectorAll('#concept-grid .is-btn').forEach(function (btn) {
      btn.classList.remove('active');
    });
    var btns = document.querySelectorAll('#concept-grid .is-btn');
    var items = CONCEPTS.filter(function (cc) { return cc.cat === exploreCat; });
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === c.id && btns[i]) btns[i].classList.add('active');
    }

    /* Show info panel */
    itemInfo.style.display = '';
    var catLabel = c.cat.charAt(0).toUpperCase() + c.cat.slice(1);
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + catLabel + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    if (c.formula) {
      html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>';
      if (c.unit) html += '<span class="fb-unit">' + c.unit + '</span>';
      html += '</div>';
    }
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step"><strong>' + s + '</strong></p>';
      });
      html += '</div>';
    }
    itemInfo.innerHTML = html;
    draw();
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function newPractice() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    currentProblem = gen();
    practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppSolution.innerHTML = '';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) { ppFeedback.textContent = 'Enter a number'; ppFeedback.className = 'feedback err'; return; }
    practiceAnswered = true;
    practiceTotal++;
    var tol = currentProblem.tol || (Math.abs(currentProblem.answer) * 0.02);
    var correct = Math.abs(userVal - currentProblem.answer) <= tol;
    if (correct) {
      practiceCorrect++;
      ppFeedback.textContent = '\u2713 Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '\u2717 Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback err';
    }
    pbarScore.textContent = practiceCorrect + ' / ' + practiceTotal;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';
    /* Show solution */
    ppSolution.style.display = '';
    var solHtml = '<h4>Solution</h4>';
    currentProblem.steps.forEach(function (s) { solHtml += '<p class="sol-step"><strong>' + s + '</strong></p>'; });
    ppSolution.innerHTML = solHtml;
  });

  ppNext.addEventListener('click', function () {
    newPractice();
  });

  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!practiceAnswered) ppCheck.click();
      else ppNext.click();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  function startQuiz() {
    /* Shuffle and pick 5 */
    var pool = QUIZ_POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    quizSet = pool.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    quizAnswers = [];
    quizPanel.style.display = '';
    quizBar.style.display = '';
    quizResult.style.display = 'none';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;
    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, idx) {
        html += '<button class="answer-btn" data-idx="' + idx + '">' + opt + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" type="number" step="any" placeholder="Answer">';
      html += '<span class="qi-unit">' + q.unit + '</span>';
      html += '<button class="btn btn-primary qi-submit">Submit</button>';
      html += '</div>';
    }
    html += '<div style="margin-top:10px;display:flex;gap:10px;align-items:center;">';
    html += '<span class="quiz-feedback" id="q-feedback"></span>';
    html += '<button class="btn btn-ghost qi-next" style="display:none;margin-left:auto;">Next \u2192</button>';
    html += '</div>';

    quizPanel.innerHTML = html;

    /* Bind events */
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { submitMCQ(parseInt(btn.dataset.idx, 10)); });
      });
    } else {
      var submitBtn = quizPanel.querySelector('.qi-submit');
      var inp = quizPanel.querySelector('.qi-input');
      submitBtn.addEventListener('click', function () { submitNumeric(inp); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitNumeric(inp); });
      inp.focus();
    }
    var nextBtn = quizPanel.querySelector('.qi-next');
    nextBtn.addEventListener('click', nextQuiz);
  }

  function submitMCQ(idx) {
    if (quizAnswered) return;
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var correct = idx === q.correct;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.prompt, correct: correct, given: q.options[idx], answer: q.options[q.correct] });

    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (btn, i) {
      btn.classList.add('locked');
      if (i === q.correct) btn.classList.add('correct');
      if (i === idx && !correct) btn.classList.add('wrong');
    });

    var fb = quizPanel.querySelector('#q-feedback');
    fb.textContent = correct ? '\u2713 Correct!' : '\u2717 Wrong! Answer: ' + q.options[q.correct];
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    quizPanel.querySelector('.qi-next').style.display = '';
  }

  function submitNumeric(inp) {
    if (quizAnswered) return;
    var val = parseFloat(inp.value);
    if (isNaN(val)) return;
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var tol = q.tol || (Math.abs(q.answer) * 0.02);
    var correct = Math.abs(val - q.answer) <= tol;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.prompt, correct: correct, given: val + ' ' + q.unit, answer: q.answer + ' ' + q.unit });

    inp.disabled = true;
    var submitBtn = quizPanel.querySelector('.qi-submit');
    if (submitBtn) submitBtn.disabled = true;
    var fb = quizPanel.querySelector('#q-feedback');
    fb.textContent = correct ? '\u2713 Correct!' : '\u2717 Wrong! Answer: ' + q.answer + ' ' + q.unit;
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    quizPanel.querySelector('.qi-next').style.display = '';
  }

  function nextQuiz() {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) {
      showQuizResult();
    } else {
      renderQuizQuestion();
    }
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var scoreClass = pct === 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct === 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605' : '\u2605';
    var verdict = pct === 1 ? 'Perfect Score!' : pct >= 0.6 ? 'Good Job!' : 'Keep Practicing';

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + scoreClass + '">' + quizScore + '/' + QUIZ_SIZE + '</span><div class="qr-verdict">' + verdict + '</div></div>';
    html += '</div>';
    html += '<div class="qr-rows">';
    quizAnswers.forEach(function (a, i) {
      var cls = a.correct ? 'ok' : 'err';
      html += '<div class="qr-row ' + cls + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail">' + (a.correct ? '<strong>Correct</strong>' : 'Your answer: <strong>' + a.given + '</strong> | Correct: <strong>' + a.answer + '</strong>') + '</span>';
      html += '<span class="qr-mark">' + (a.correct ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    });
    html += '</div>';
    html += '<button class="btn btn-primary" id="new-quiz-btn">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('new-quiz-btn').addEventListener('click', function () {
      quizResult.style.display = 'none';
      startQuiz();
    });
  }

  /* ================================================================
     STEPPER INPUTS (companion to sliders)
     ================================================================ */

  var stepperMap = {
    n:   { slider: nSlider,   input: document.getElementById('n-input'),   min: 1,     max: 500,  fmt: function (v) { return String(parseInt(v, 10)); } },
    b:   { slider: bSlider,   input: document.getElementById('b-input'),   min: 0.1,   max: 2.0,  fmt: function (v) { return (+v).toFixed(2); } },
    a:   { slider: aSlider,   input: document.getElementById('a-input'),   min: 0.001, max: 0.1,  fmt: function (v) { return (+v).toFixed(3); } },
    rpm: { slider: rpmSlider, input: document.getElementById('rpm-input'), min: 100,   max: 3600, fmt: function (v) { return String(parseInt(v, 10)); } },
    r:   { slider: rSlider,   input: document.getElementById('r-input'),   min: 1,     max: 1000, fmt: function (v) { return String(parseInt(v, 10)); } }
  };

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function setParam(key, val) {
    var m = stepperMap[key]; if (!m) return;
    val = clamp(+val, m.min, m.max);
    m.slider.value = val;
    m.input.value = m.fmt(val);
    updateSliderVals();
  }

  Object.keys(stepperMap).forEach(function (key) {
    var m = stepperMap[key];
    m.input.addEventListener('input', function () {
      var v = parseFloat(m.input.value);
      if (isNaN(v)) return;
      setParam(key, v);
    });
    m.input.addEventListener('blur', function () {
      var v = parseFloat(m.input.value);
      if (isNaN(v)) v = m.slider.value;
      m.input.value = m.fmt(clamp(v, m.min, m.max));
    });
  });

  /* Sync stepper input when slider moves */
  function syncSteppersFromSliders() {
    Object.keys(stepperMap).forEach(function (key) {
      var m = stepperMap[key];
      m.input.value = m.fmt(m.slider.value);
    });
  }

  /* Stepper [-]/[+] buttons */
  document.querySelectorAll('.stepper').forEach(function (st) {
    var key = st.dataset.target;
    st.querySelectorAll('.step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var delta = parseFloat(btn.dataset.step);
        var cur = parseFloat(stepperMap[key].slider.value);
        setParam(key, cur + delta);
      });
    });
  });

  /* ================================================================
     PRESETS
     ================================================================ */

  var PRESETS = {
    mains50:  { n: 150, b: 0.80, a: 0.030, rpm: 3000, r: 100, label: 'Mains 50 Hz' },
    mains60:  { n: 150, b: 0.80, a: 0.030, rpm: 3600, r: 100, label: 'Mains 60 Hz' },
    hydro:    { n: 300, b: 1.20, a: 0.080, rpm: 1500, r: 50,  label: 'Hydro Alternator' },
    auto:     { n: 80,  b: 0.60, a: 0.005, rpm: 4000, r: 12,  label: 'Auto Alternator' },
    'default':{ n: 100, b: 0.50, a: 0.010, rpm: 1500, r: 100, label: 'Default' }
  };

  function applyPreset(name) {
    var p = PRESETS[name]; if (!p) return;
    setParam('n', p.n); setParam('b', p.b); setParam('a', p.a);
    setParam('rpm', p.rpm); setParam('r', p.r);
    document.querySelectorAll('.preset-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.preset === name);
    });
  }

  document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { applyPreset(btn.dataset.preset); });
  });

  /* ================================================================
     EXPORT — CSV & PNG
     ================================================================ */

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  function exportCSV() {
    var c = calcAll();
    var rows = ['time_s,emf_V,current_A'];
    var samples = 400;
    var T = 1 / Math.max(c.f, 0.0001);
    var totalT = 2 * T;
    for (var i = 0; i <= samples; i++) {
      var t = i * totalT / samples;
      var e = c.E0 * Math.sin(c.w * t);
      var iVal = e / simR;
      rows.push(t.toFixed(6) + ',' + e.toFixed(4) + ',' + iVal.toFixed(4));
    }
    var blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'ac-generator-waveform.csv');
  }

  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tctx = tmp.getContext('2d');
    tctx.fillStyle = '#0d1117';
    tctx.fillRect(0, 0, tmp.width, tmp.height);
    tctx.drawImage(canvas, 0, 0);
    /* Watermark */
    tctx.fillStyle = 'rgba(123,31,162,0.55)';
    tctx.font = 'bold 12px sans-serif';
    tctx.textAlign = 'right';
    tctx.fillText('NHIT VisualLab / AC Generator', tmp.width - 10, tmp.height - 10);
    tmp.toBlob(function (blob) { if (blob) downloadBlob(blob, 'ac-generator-waveform.png'); });
  }

  document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
  document.getElementById('export-png-btn').addEventListener('click', exportPNG);

  /* ================================================================
     RIGHT-CLICK CONTEXT MENU
     ================================================================ */

  var ctxMenu = document.getElementById('ctx-menu');
  function showCtxMenu(x, y, items) {
    ctxMenu.innerHTML = '';
    items.forEach(function (it) {
      var b = document.createElement('button');
      b.textContent = it.label;
      b.addEventListener('click', function () { hideCtxMenu(); it.action(); });
      ctxMenu.appendChild(b);
    });
    ctxMenu.style.left = Math.min(x, window.innerWidth - 180) + 'px';
    ctxMenu.style.top  = Math.min(y, window.innerHeight - 140) + 'px';
    ctxMenu.classList.add('active');
    ctxMenu.setAttribute('aria-hidden', 'false');
  }
  function hideCtxMenu() {
    ctxMenu.classList.remove('active');
    ctxMenu.setAttribute('aria-hidden', 'true');
  }
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY, [
      { label: '⬇ Export PNG',  action: exportPNG },
      { label: '⬇ Export CSV',  action: exportCSV },
      { label: '↺ Reset Default', action: function () { applyPreset('default'); } }
    ]);
  });
  document.addEventListener('click', function (e) { if (!ctxMenu.contains(e.target)) hideCtxMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideCtxMenu(); });

  /* ================================================================
     SHOW CALCULATION — MODAL
     ================================================================ */

  function calcStep(num, title, formula, calculation, result) {
    var html = '<div class="cs-step">';
    html += '<div class="cs-step-hd"><span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula)     html += '<div class="cs-formula">' + formula + '</div>';
    if (calculation) html += '<div class="cs-calc">' + calculation + '</div>';
    if (result != null) html += '<div class="cs-result">→ <strong>' + result + '</strong></div>';
    html += '</div>';
    return html;
  }

  function buildCalcSteps() {
    var c = calcAll();
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Given &mdash; Current State</span>';
    html += '<div class="cs-given">';
    html += '<span>N = ' + simN + ' turns</span>';
    html += '<span>B = ' + simB.toFixed(2) + ' T</span>';
    html += '<span>A = ' + simA.toFixed(3) + ' m²</span>';
    html += '<span>n = ' + simRPM + ' RPM</span>';
    html += '<span>R = ' + simR + ' Ω</span>';
    html += '</div></div>';

    html += calcStep(1, 'Angular velocity ω',
      'ω = 2πn / 60',
      'ω = 2π × ' + simRPM + ' / 60\n   = ' + c.w.toFixed(3) + ' rad/s',
      c.w.toFixed(2) + ' rad/s');

    html += calcStep(2, 'Frequency f',
      'f = n / 60   (2-pole)',
      'f = ' + simRPM + ' / 60\n   = ' + c.f.toFixed(3) + ' Hz',
      c.f.toFixed(2) + ' Hz');

    html += calcStep(3, 'Period T',
      'T = 1 / f',
      'T = 1 / ' + c.f.toFixed(3) + '\n   = ' + (c.T / 1000).toFixed(5) + ' s = ' + c.T.toFixed(2) + ' ms',
      c.T.toFixed(2) + ' ms');

    html += calcStep(4, 'Peak EMF E₀',
      'E₀ = N × B × A × ω',
      'E₀ = ' + simN + ' × ' + simB.toFixed(2) + ' × ' + simA.toFixed(3) + ' × ' + c.w.toFixed(3) + '\n   = ' + c.E0.toFixed(3) + ' V',
      c.E0.toFixed(2) + ' V');

    html += calcStep(5, 'RMS EMF',
      'E_rms = E₀ / √2',
      'E_rms = ' + c.E0.toFixed(3) + ' / 1.4142\n      = ' + c.Erms.toFixed(3) + ' V',
      c.Erms.toFixed(2) + ' V');

    html += calcStep(6, 'RMS Current',
      'I_rms = E_rms / R',
      'I_rms = ' + c.Erms.toFixed(3) + ' / ' + simR + '\n      = ' + c.Irms.toFixed(4) + ' A',
      c.Irms.toFixed(3) + ' A');

    html += calcStep(7, 'Average Power',
      'P = E_rms² / R   (purely resistive load)',
      'P = ' + c.Erms.toFixed(3) + '² / ' + simR + '\n   = ' + c.P.toFixed(3) + ' W',
      c.P.toFixed(2) + ' W');

    /* Real-world context */
    var ctx = '';
    if (Math.abs(c.f - 50) < 1) ctx = 'This matches the European/Indian grid frequency (50 Hz). Standard for most of the world.';
    else if (Math.abs(c.f - 60) < 1) ctx = 'This matches the North American grid frequency (60 Hz). Standard for the Americas and Japan.';
    else if (c.f < 50) ctx = 'Below standard grid frequency. Useful for low-speed hydro or off-grid systems.';
    else ctx = 'Higher than standard grid frequency. Typical of aircraft (400 Hz) or specialized motor drives.';

    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Context</span><span class="cs-title">Real-world note</span></div><div class="cs-result">' + ctx + '</div></div>';
    return html;
  }

  function openCalcModal() {
    var modal = document.getElementById('calc-modal');
    var body  = document.getElementById('calc-modal-body');
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    var cb = document.getElementById('calc-modal-close'); if (cb) cb.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeCalcModal() {
    var modal = document.getElementById('calc-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  document.getElementById('btn-calc').addEventListener('click', openCalcModal);
  document.getElementById('calc-modal-close').addEventListener('click', closeCalcModal);
  var calcModalEl = document.getElementById('calc-modal');
  calcModalEl.addEventListener('click', function (e) { if (e.target === calcModalEl) closeCalcModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && calcModalEl.classList.contains('active')) closeCalcModal();
  });

  /* ================================================================
     LEARNING PANELS — live equations + what-if coach
     ================================================================ */

  var liveEqEl  = document.getElementById('live-eq');
  var coachEl   = document.getElementById('coach-list');

  function renderLiveEq() {
    if (!liveEqEl) return;
    var c = calcAll();
    var html = '';
    html += '<div class="leq"><span class="leq-label">Angular velocity:</span> ω = 2π × ' + simRPM + ' / 60 = <strong>' + c.w.toFixed(2) + '</strong> rad/s</div>';
    html += '<div class="leq"><span class="leq-label">Peak EMF:</span> E₀ = NBAω = ' + simN + ' × ' + simB.toFixed(2) + ' × ' + simA.toFixed(3) + ' × ' + c.w.toFixed(2) + ' = <strong>' + c.E0.toFixed(2) + '</strong> V</div>';
    html += '<div class="leq"><span class="leq-label">RMS EMF:</span> E_rms = E₀/√2 = <strong>' + c.Erms.toFixed(2) + '</strong> V</div>';
    html += '<div class="leq"><span class="leq-label">Frequency:</span> f = n/60 = <strong>' + c.f.toFixed(2) + '</strong> Hz, T = <strong>' + c.T.toFixed(2) + '</strong> ms</div>';
    html += '<div class="leq"><span class="leq-label">Power:</span> P = E_rms²/R = <strong>' + c.P.toFixed(2) + '</strong> W   (I_rms = <strong>' + c.Irms.toFixed(3) + '</strong> A)</div>';
    liveEqEl.innerHTML = html;
  }

  function renderCoach() {
    if (!coachEl) return;
    var c = calcAll();
    var tips = [];

    if (Math.abs(c.f - 50) < 0.5) tips.push('<strong>Grid match:</strong> At ' + simRPM + ' RPM your output is right on 50 Hz — European/Indian mains frequency.');
    else if (Math.abs(c.f - 60) < 0.5) tips.push('<strong>Grid match:</strong> At ' + simRPM + ' RPM your output is right on 60 Hz — American/Japanese mains frequency.');
    else tips.push('<strong>Frequency:</strong> ' + c.f.toFixed(1) + ' Hz — try 3000 RPM for 50 Hz or 3600 RPM for 60 Hz on a 2-pole machine.');

    if (c.E0 > 400) tips.push('<strong>High voltage:</strong> Peak EMF of ' + c.E0.toFixed(0) + ' V exceeds standard mains peak (≈325 V). Real generators step down via transformer.');
    else if (c.E0 < 50) tips.push('<strong>Low voltage:</strong> Peak EMF is only ' + c.E0.toFixed(1) + ' V. Increase N, B, A, or speed to raise voltage.');

    if (c.P > 1000) tips.push('<strong>High power:</strong> ' + (c.P / 1000).toFixed(2) + ' kW dissipated in the load — a real load would need cooling.');
    if (simR < 10)  tips.push('<strong>Low load resistance:</strong> R = ' + simR + ' Ω draws ' + c.Irms.toFixed(2) + ' A — risk of overheating the armature.');

    tips.push('<strong>Tip:</strong> Doubling N, B, or A doubles E₀ but leaves f unchanged. Doubling RPM doubles BOTH E₀ and f.');

    coachEl.innerHTML = tips.map(function (t) { return '<li>' + t + '</li>'; }).join('');
  }

  function refreshLearningPanels() { renderLiveEq(); renderCoach(); }

  /* Wire to slider/stepper changes */
  var _origUpdateReadouts = updateReadouts;
  updateReadouts = function () { _origUpdateReadouts(); refreshLearningPanels(); };

  /* Learn-panel expand/collapse */
  var expAll = document.getElementById('learn-expand-all');
  var colAll = document.getElementById('learn-collapse-all');
  var cards  = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
  if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
  if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });

  /* ================================================================
     KEYBOARD — Space toggles play/pause
     ================================================================ */

  document.addEventListener('keydown', function (e) {
    if (e.key === ' ' && mode === 'simulate' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'BUTTON') {
      e.preventDefault();
      playBtn.click();
    }
  });

  /* ================================================================
     INIT
     ================================================================ */

  syncSteppersFromSliders();
  updateSliderVals();
  refreshLearningPanels();
  startAnimation();

})();
