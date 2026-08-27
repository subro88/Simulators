(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  var $ = function (id) { return document.getElementById(id); };
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }
  function round1(n) { return +(Math.round(n * 10) / 10).toFixed(1); }
  function round3(n) { return +(Math.round(n * 1000) / 1000).toFixed(3); }

  /* ================================================================
     DATA — CONCEPTS (Explore)
     ================================================================ */
  var CONCEPTS = [
    /* ── Fundamentals ── */
    {
      id: 'magnetic-flux', name: 'Magnetic Flux', symbol: 'Φ = BA cosθ', cat: 'fundamentals',
      formula: 'Φ = B × A × cosθ', unit: 'weber (Wb)',
      desc: 'Magnetic flux measures how much magnetic field passes through the area of the coil. It depends on the flux density B (tesla), the coil area A (m²) and the angle θ between the field and the coil’s normal. When the field is perpendicular to the coil face (θ = 0°), the flux is maximum; when the field is parallel to the coil face (θ = 90°), the flux is zero.',
      example: { problem: 'B = 0.6 T, A = 0.02 m², θ = 60°. Find the magnetic flux Φ.', steps: ['Φ = B × A × cosθ', 'Φ = 0.6 × 0.02 × cos60°', 'Φ = 0.6 × 0.02 × 0.5', 'Φ = 0.006 Wb = 6 mWb'], answer: 0.006, unit: 'Wb' }
    },
    {
      id: 'faradays-law', name: 'Faraday’s Law', symbol: 'e = −N dΦ/dt', cat: 'fundamentals',
      formula: 'e = −N × dΦ/dt', unit: 'volt (V)',
      desc: 'Faraday’s law states that the induced EMF equals the number of turns multiplied by the rate of change of magnetic flux. It is the rate of change that matters — a quickly changing flux induces a large EMF, while a steady flux induces none. This is the principle behind every generator, transformer and induction device.',
      example: { problem: 'A 200-turn coil’s flux changes from 0.05 Wb to 0.01 Wb in 0.1 s. Find the EMF.', steps: ['e = −N × ΔΦ/Δt', 'ΔΦ = 0.01 − 0.05 = −0.04 Wb', 'e = −200 × (−0.04 / 0.1)', 'e = −200 × (−0.4) = 80 V'], answer: 80, unit: 'V' }
    },
    {
      id: 'lenz-law', name: 'Lenz’s Law', symbol: 'Opposes change', cat: 'fundamentals',
      formula: 'direction opposes ΔΦ', unit: '(direction rule)',
      desc: 'Lenz’s law gives the direction of the induced current: it always flows so as to oppose the change in flux that produced it. As a magnet approaches, the coil pushes back; as it leaves, the coil pulls it back. This is the minus sign in Faraday’s law and is required by the conservation of energy — the work you do against this opposition becomes electrical energy.',
      example: { problem: 'A magnet’s north pole moves toward a coil. What does the near face of the coil become?', steps: ['Flux through the coil is increasing', 'Lenz: induced current opposes the increase', 'The near face becomes a north pole', 'It repels the approaching magnet'], answer: 0, unit: '' }
    },
    {
      id: 'flux-linkage', name: 'Flux Linkage', symbol: 'Λ = NΦ', cat: 'fundamentals',
      formula: 'Λ = N × Φ', unit: 'weber-turns (Wb)',
      desc: 'Flux linkage is the total flux “linked” by all the turns of a coil: each of the N turns experiences the flux Φ, so the linkage is NΦ. Faraday’s law is really the rate of change of flux linkage: e = −d(NΦ)/dt. This is why adding turns increases the induced EMF in direct proportion.',
      example: { problem: 'A coil of 150 turns sits in a flux of 0.004 Wb. Find the flux linkage.', steps: ['Λ = N × Φ', 'Λ = 150 × 0.004', 'Λ = 0.6 Wb-turns'], answer: 0.6, unit: 'Wb' }
    },
    /* ── Factors ── */
    {
      id: 'factor-strength', name: 'Magnet Strength', symbol: 'e ∝ B', cat: 'factors',
      formula: 'e ∝ B', unit: '—',
      desc: 'A stronger magnet produces a denser magnetic field, so more flux threads through the coil. Because the flux is proportional to B, the induced EMF is too. In the simulator, raising the Magnet B slider visibly increases both the field-line density and the height of the EMF graph.',
      example: { problem: 'Doubling the magnet’s flux density from 0.5 T to 1.0 T (all else equal) does what to the EMF?', steps: ['e ∝ B', 'B doubles (0.5 → 1.0 T)', 'EMF doubles', 'Twice the voltage for the same motion'], answer: 2, unit: '× ' }
    },
    {
      id: 'factor-speed', name: 'Speed of Motion', symbol: 'e ∝ dΦ/dt', cat: 'factors',
      formula: 'e ∝ rate of change', unit: '—',
      desc: 'The induced EMF depends on how fast the flux changes, not on the flux itself. Moving the magnet faster makes the flux change more quickly, raising the EMF. A magnet held still produces zero EMF no matter how strong it is — the single most important idea in Faraday’s law.',
      example: { problem: 'A magnet pushed through a coil in 0.1 s gives 4 V. What EMF if pushed through in 0.05 s?', steps: ['e ∝ 1/Δt for the same ΔΦ', 'Time halves (0.1 → 0.05 s)', 'EMF doubles', 'e = 8 V'], answer: 8, unit: 'V' }
    },
    {
      id: 'factor-turns', name: 'Number of Turns', symbol: 'e ∝ N', cat: 'factors',
      formula: 'e ∝ N', unit: '—',
      desc: 'Each turn of wire adds its own induced EMF, so the total EMF is proportional to the number of turns N. A coil with 200 turns gives ten times the EMF of a 20-turn coil for the same magnet motion. This is why real generators and transformers use many hundreds or thousands of turns.',
      example: { problem: 'A 50-turn coil gives 2 V. What EMF from a 250-turn coil under the same conditions?', steps: ['e ∝ N', 'N increases 5× (50 → 250)', 'EMF increases 5×', 'e = 10 V'], answer: 10, unit: 'V' }
    },
    {
      id: 'factor-area', name: 'Coil Area', symbol: 'e ∝ A', cat: 'factors',
      formula: 'e ∝ A', unit: '—',
      desc: 'A larger coil area captures more magnetic flux (Φ = BA cosθ), so the induced EMF rises with area. Doubling the cross-sectional area of the coil doubles the flux and therefore doubles the EMF, provided the field still passes through the whole coil.',
      example: { problem: 'Coil area increases from 20 cm² to 60 cm². EMF changes by what factor?', steps: ['e ∝ A', 'A increases 3× (20 → 60 cm²)', 'EMF increases 3×', '3 × the original voltage'], answer: 3, unit: '× ' }
    },
    {
      id: 'factor-angle', name: 'Angle θ', symbol: 'e ∝ cosθ', cat: 'factors',
      formula: 'Φ = BA cosθ', unit: '—',
      desc: 'The flux through a coil depends on the angle θ between the field and the coil’s normal. At θ = 0° the coil faces the field squarely and the flux is maximum; at θ = 90° the field skims past and the flux — and the EMF — drop to zero. This cosine relationship is what makes a rotating coil produce a sinusoidal voltage.',
      example: { problem: 'B = 0.8 T, A = 0.01 m². Find the flux at θ = 0° and θ = 90°.', steps: ['θ = 0°: Φ = 0.8 × 0.01 × cos0° = 0.008 Wb', 'θ = 90°: Φ = 0.8 × 0.01 × cos90° = 0 Wb', 'Edge-on coil links no flux', 'EMF is zero at 90°'], answer: 0.008, unit: 'Wb' }
    },
    /* ── Applications ── */
    {
      id: 'app-generator', name: 'Generator', symbol: 'AC / DC', cat: 'applications',
      formula: 'e = NBAω sin(ωt)', unit: 'V',
      desc: 'A generator spins a coil inside a magnetic field (or spins a magnet inside a coil). The continuously changing flux induces an alternating EMF. Power stations, car alternators and wind turbines all use this principle. The rotating-coil version of this simulator is the AC Generator tool.',
      example: { problem: 'Why does a faster-spinning generator produce a higher voltage?', steps: ['Faster rotation → flux changes faster', 'e ∝ dΦ/dt', 'Higher rate of change → higher EMF', 'Voltage rises with speed (and frequency)'], answer: 0, unit: '' }
    },
    {
      id: 'app-transformer', name: 'Transformer', symbol: 'Vs/Vp = Ns/Np', cat: 'applications',
      formula: 'Vs / Vp = Ns / Np', unit: '—',
      desc: 'A transformer uses mutual induction: an alternating current in the primary coil creates a changing flux in an iron core, which induces an EMF in the secondary coil. The voltage ratio equals the turns ratio. Transformers only work with AC because a steady DC flux induces no EMF.',
      example: { problem: 'Primary 1000 turns at 230 V, secondary 100 turns. Find the secondary voltage.', steps: ['Vs / Vp = Ns / Np', 'Vs = 230 × (100 / 1000)', 'Vs = 230 × 0.1', 'Vs = 23 V'], answer: 23, unit: 'V' }
    },
    {
      id: 'app-dynamo', name: 'Bicycle Dynamo', symbol: 'e ∝ speed', cat: 'applications',
      formula: 'e ∝ dΦ/dt', unit: 'V',
      desc: 'A bicycle dynamo presses a small magnet-and-coil generator against the tyre. As you pedal, the wheel spins the magnet, the flux through the coil changes and an EMF lights the lamp. Pedal faster and the lamp glows brighter because the EMF rises with speed.',
      example: { problem: 'Why does a bicycle lamp dim when you slow down?', steps: ['Slower wheel → slower flux change', 'e ∝ dΦ/dt', 'Lower rate of change → lower EMF', 'Less voltage → dimmer lamp'], answer: 0, unit: '' }
    },
    {
      id: 'app-cooktop', name: 'Induction Cooktop', symbol: 'eddy currents', cat: 'applications',
      formula: 'P = e² / R', unit: 'W',
      desc: 'An induction cooktop runs a high-frequency alternating current through a coil under the glass. The rapidly changing flux induces eddy currents directly in the steel pan, and the pan’s resistance turns that current into heat. The cooktop surface itself stays relatively cool.',
      example: { problem: 'Why does an induction hob need a magnetic (steel) pan, not aluminium?', steps: ['Heating needs strong induced eddy currents', 'Ferromagnetic steel concentrates the flux', 'More flux change → more induced current', 'Steel heats efficiently; some metals do not'], answer: 0, unit: '' }
    },
    {
      id: 'app-microphone', name: 'Dynamic Microphone', symbol: 'sound → EMF', cat: 'applications',
      formula: 'e = −N dΦ/dt', unit: 'V',
      desc: 'A dynamic microphone attaches a tiny coil to a diaphragm that sits near a magnet. Sound waves vibrate the diaphragm, moving the coil and changing the flux. The induced EMF is an electrical copy of the sound — Faraday’s law turning vibration into voltage.',
      example: { problem: 'A microphone coil moves faster for a louder sound. What happens to the signal voltage?', steps: ['Louder sound → larger, faster coil motion', 'Faster motion → faster flux change', 'e ∝ dΦ/dt', 'Signal voltage increases'], answer: 0, unit: '' }
    },
    {
      id: 'app-wireless', name: 'Wireless Charging', symbol: 'mutual induction', cat: 'applications',
      formula: 'e = −M dI/dt', unit: 'V',
      desc: 'A wireless phone charger sends an alternating current through a transmitter coil in the pad. The changing flux reaches a receiver coil in the phone and induces an EMF that charges the battery — energy crossing an air gap with no wires, all through electromagnetic induction.',
      example: { problem: 'Why does wireless charging stop if the phone is lifted off the pad?', steps: ['Coupling depends on shared flux', 'Lifting the phone increases the gap', 'Far less flux reaches the receiver coil', 'Induced EMF collapses → charging stops'], answer: 0, unit: '' }
    }
  ];

  /* ================================================================
     DATA — PRACTICE PROBLEM GENERATORS
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0 — EMF from N, ΔΦ, Δt */
    function () {
      var N = randInt(20, 400);
      var dPhi = round3(randInt(2, 80) / 1000);
      var dt = round2(randInt(5, 50) / 100);
      var e = round2(N * dPhi / dt);
      return { prompt: 'A coil of ' + N + ' turns has its magnetic flux change by ' + dPhi + ' Wb in ' + dt + ' s. Find the magnitude of the induced EMF (V).',
        steps: ['e = N × ΔΦ / Δt', 'e = ' + N + ' × ' + dPhi + ' / ' + dt, 'e = ' + round2(N * dPhi) + ' / ' + dt, 'e = ' + e + ' V'], answer: e, unit: 'V', tol: Math.max(0.2, e * 0.01) };
    },
    /* 1 — Flux from B, A, θ */
    function () {
      var B = round2(randInt(10, 200) / 100);
      var Acm = randInt(10, 150);
      var A = round3(Acm / 10000);
      var th = [0, 30, 45, 60][randInt(0, 3)];
      var phi = +(B * A * Math.cos(th * Math.PI / 180)).toFixed(5);
      var phiM = round2(phi * 1000);
      return { prompt: 'Find the magnetic flux through a coil with B = ' + B + ' T, A = ' + Acm + ' cm² and θ = ' + th + '°. Give the answer in mWb.',
        steps: ['Φ = B × A × cosθ', 'A = ' + Acm + ' cm² = ' + A + ' m²', 'Φ = ' + B + ' × ' + A + ' × cos' + th + '°', 'Φ = ' + phi + ' Wb = ' + phiM + ' mWb'], answer: phiM, unit: 'mWb', tol: Math.max(0.05, phiM * 0.02) };
    },
    /* 2 — Flux linkage NΦ */
    function () {
      var N = randInt(40, 500);
      var phiM = randInt(1, 20);
      var phi = round3(phiM / 1000);
      var link = round2(N * phi);
      return { prompt: 'A coil of ' + N + ' turns sits in a flux of ' + phiM + ' mWb. Find the flux linkage (Wb-turns).',
        steps: ['Λ = N × Φ', 'Φ = ' + phiM + ' mWb = ' + phi + ' Wb', 'Λ = ' + N + ' × ' + phi, 'Λ = ' + link + ' Wb-turns'], answer: link, unit: 'Wb', tol: Math.max(0.05, link * 0.02) };
    },
    /* 3 — ΔΦ from e, N, Δt */
    function () {
      var N = randInt(50, 300);
      var e = randInt(20, 200);
      var dt = round2(randInt(5, 40) / 100);
      var dPhi = round3(e * dt / N);
      return { prompt: 'An EMF of ' + e + ' V is induced in a ' + N + '-turn coil over ' + dt + ' s. Find the change in flux ΔΦ (Wb).',
        steps: ['e = N × ΔΦ / Δt  →  ΔΦ = e × Δt / N', 'ΔΦ = ' + e + ' × ' + dt + ' / ' + N, 'ΔΦ = ' + round2(e * dt) + ' / ' + N, 'ΔΦ = ' + dPhi + ' Wb'], answer: dPhi, unit: 'Wb', tol: Math.max(0.002, dPhi * 0.03) };
    },
    /* 4 — N from e, ΔΦ, Δt */
    function () {
      var dPhi = round3(randInt(5, 60) / 1000);
      var dt = round2(randInt(5, 40) / 100);
      var N = randInt(50, 400);
      var e = round2(N * dPhi / dt);
      return { prompt: 'A flux change of ' + dPhi + ' Wb in ' + dt + ' s induces ' + e + ' V. How many turns N does the coil have?',
        steps: ['e = N × ΔΦ / Δt  →  N = e × Δt / ΔΦ', 'N = ' + e + ' × ' + dt + ' / ' + dPhi, 'N = ' + round2(e * dt) + ' / ' + dPhi, 'N ≈ ' + N + ' turns'], answer: N, unit: 'turns', tol: Math.max(2, N * 0.03) };
    },
    /* 5 — EMF from B, A, change of B */
    function () {
      var N = randInt(30, 200);
      var Acm = randInt(20, 120);
      var A = round3(Acm / 10000);
      var dB = round2(randInt(20, 150) / 100);
      var dt = round2(randInt(5, 40) / 100);
      var e = round2(N * A * dB / dt);
      return { prompt: 'A ' + N + '-turn coil of area ' + Acm + ' cm² is in a field that changes by ' + dB + ' T in ' + dt + ' s (θ = 0°). Find the induced EMF (V).',
        steps: ['e = N × A × ΔB / Δt', 'A = ' + Acm + ' cm² = ' + A + ' m²', 'e = ' + N + ' × ' + A + ' × ' + dB + ' / ' + dt, 'e = ' + e + ' V'], answer: e, unit: 'V', tol: Math.max(0.1, e * 0.02) };
    },
    /* 6 — speed-scaling reasoning (numeric factor) */
    function () {
      var e1 = randInt(2, 12);
      var k = [2, 3, 4][randInt(0, 2)];
      var e2 = e1 * k;
      return { prompt: 'A magnet pushed through a coil induces ' + e1 + ' V. If it is pushed through ' + k + '× faster, what EMF is induced (V)?',
        steps: ['e ∝ speed (same ΔΦ, shorter Δt)', 'Speed ×' + k + '  →  EMF ×' + k, 'e = ' + e1 + ' × ' + k, 'e = ' + e2 + ' V'], answer: e2, unit: 'V', tol: 0.1 };
    },
    /* 7 — average EMF (signed) from flux 0.05→0 */
    function () {
      var N = randInt(50, 300);
      var phi1 = round3(randInt(20, 80) / 1000);
      var dt = round2(randInt(5, 30) / 100);
      var e = round2(N * phi1 / dt);
      return { prompt: 'The flux through a ' + N + '-turn coil collapses from ' + round2(phi1 * 1000) + ' mWb to 0 in ' + dt + ' s. Find the magnitude of the average EMF (V).',
        steps: ['e = N × ΔΦ / Δt', 'ΔΦ = ' + phi1 + ' − 0 = ' + phi1 + ' Wb', 'e = ' + N + ' × ' + phi1 + ' / ' + dt, 'e = ' + e + ' V'], answer: e, unit: 'V', tol: Math.max(0.2, e * 0.01) };
    }
  ];

  /* ================================================================
     QUIZ POOL (mix of MCQ + numeric)
     ================================================================ */
  var QUIZ_POOL = [
    { type: 'mcq', prompt: 'Faraday’s law says the induced EMF is proportional to:', options: ['The magnetic flux', 'The rate of change of flux', 'The coil resistance', 'The magnet’s mass'], correct: 1 },
    { type: 'mcq', prompt: 'A magnet held perfectly still inside a coil induces an EMF of:', options: ['Maximum', 'Half maximum', 'Zero', 'It depends on B'], correct: 2 },
    { type: 'mcq', prompt: 'Lenz’s law is a consequence of the conservation of:', options: ['Charge', 'Momentum', 'Energy', 'Mass'], correct: 2 },
    { type: 'mcq', prompt: 'As a magnet’s north pole approaches a coil, the near face of the coil becomes a:', options: ['North pole (repels it)', 'South pole (attracts it)', 'Neutral face', 'It alternates'], correct: 0 },
    { type: 'mcq', prompt: 'Which change does NOT increase the induced EMF?', options: ['Using a stronger magnet', 'Adding more turns', 'Moving the magnet faster', 'Holding the magnet still'], correct: 3 },
    { type: 'mcq', prompt: 'The magnetic flux through a coil is Φ =', options: ['B / A', 'B A cosθ', 'B A sinθ', 'N B A'], correct: 1 },
    { type: 'mcq', prompt: 'At what angle θ between the field and the coil’s normal is the flux zero?', options: ['0°', '45°', '60°', '90°'], correct: 3 },
    { type: 'mcq', prompt: 'A transformer does NOT work on steady DC because:', options: ['DC is too strong', 'DC flux does not change, so no EMF', 'DC has no current', 'The core melts'], correct: 1 },
    { type: 'numeric', prompt: 'A 100-turn coil’s flux changes by 0.02 Wb in 0.1 s. Find the EMF (V).', answer: 20, unit: 'V', tol: 0.5 },
    { type: 'numeric', prompt: 'B = 0.5 T, A = 0.04 m², θ = 0°. Find the flux Φ (mWb).', answer: 20, unit: 'mWb', tol: 0.5 },
    { type: 'numeric', prompt: 'A 200-turn coil, flux 0.03 Wb → 0 in 0.2 s. Find the EMF (V).', answer: 30, unit: 'V', tol: 0.5 },
    { type: 'numeric', prompt: 'A coil of 50 turns links a flux of 0.006 Wb. Find the flux linkage (Wb-turns).', answer: 0.3, unit: 'Wb', tol: 0.02 },
    { type: 'numeric', prompt: 'A magnet gives 3 V. Pushed through 4× faster, what EMF (V)?', answer: 12, unit: 'V', tol: 0.2 },
    { type: 'numeric', prompt: 'Find the flux: B = 0.8 T, A = 0.01 m², θ = 60° (mWb).', answer: 4, unit: 'mWb', tol: 0.2 },
    { type: 'numeric', prompt: 'EMF = 60 V in a 150-turn coil over 0.1 s. Find ΔΦ (Wb).', answer: 0.04, unit: 'Wb', tol: 0.005 }
  ];

  /* ================================================================
     DOM REFERENCES
     ================================================================ */
  var canvas = $('sim-canvas');
  var ctx = canvas.getContext('2d');

  var bSlider = $('b-slider'), nSlider = $('n-slider'), aSlider = $('a-slider'),
      vSlider = $('v-slider'), tSlider = $('t-slider');
  var bInput = $('b-input'), nInput = $('n-input'), aInput = $('a-input'),
      vInput = $('v-input'), tInput = $('t-input');

  var playBtn = $('play-btn'), resetBtn = $('reset-btn'), flipBtn = $('flip-btn');
  var motionHint = $('motion-hint');

  var rPos = $('r-pos'), rVel = $('r-vel'), rFlux = $('r-flux'),
      rDphi = $('r-dphi'), rEmf = $('r-emf'), rCur = $('r-cur');

  var chipTrend = $('chip-trend'), chipTrendTxt = $('chip-trend-txt');
  var chipLenz = $('chip-lenz'), chipLenzTxt = $('chip-lenz-txt');
  var chipPole = $('chip-pole'), chipPoleTxt = $('chip-pole-txt');

  var simPanel = $('sim-panel');
  var catRow = $('cat-row'), itemSelector = $('item-selector'), itemInfo = $('item-info'),
      conceptGrid = $('concept-grid');
  var practicePanel = $('practice-panel'), practiceBar = $('practice-bar');
  var quizPanel = $('quiz-panel'), quizBar = $('quiz-bar'), quizResult = $('quiz-result');

  var ppPrompt = $('pp-prompt'), ppInput = $('pp-input'), ppUnit = $('pp-unit'),
      ppCheck = $('pp-check'), ppNext = $('pp-next'), ppFeedback = $('pp-feedback'),
      ppSolution = $('pp-solution'), pbarScore = $('pbar-score-val');
  var qbarNum = $('qbar-num');

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var graphKind = 'emf';

  /* physical params */
  var simB = 0.80;   /* tesla */
  var simN = 120;    /* turns */
  var simAcm = 50;   /* coil area cm² */
  var simV = 40;     /* speed cm/s (for play / pass) */
  var simTheta = 0;  /* degrees */
  var flipped = false;

  /* magnet kinematics */
  var SIG = 0.035;        /* flux bell width (m) */
  var TRACK = 13;         /* magnet travel half-range (cm) */
  var AMP = 9.5;          /* oscillation amplitude (cm) */
  var mx = -7;            /* magnet position (cm), 0 = coil centre */
  var mv = 0;             /* magnet velocity (cm/s, signed) */
  var motionState = 'idle'; /* idle | osc | pass | drag */
  var passDir = 1;
  var oscPhase = 0;
  var dragging = false, dragLastMx = -7;

  /* derived */
  var cur = { phi: 0, dphidt: 0, emf: 0, current: 0 };
  var emfPeak = 1.5;      /* adaptive galvanometer full-scale */
  var flowPhase = 0;

  /* graph history */
  var history = [];       /* {t, x, phi, dphidt, emf} */
  var simT = 0;
  var GRAPH_WINDOW = 6;   /* seconds shown */

  /* explore / practice / quiz */
  var exploreCat = 'fundamentals', selectedConcept = null;
  var practiceCorrect = 0, practiceTotal = 0, currentProblem = null, practiceAnswered = false;
  var QUIZ_SIZE = 5, quizSet = [], quizIdx = 0, quizScore = 0, quizAnswered = false, quizAnswers = [];

  /* audio */
  var audioCtx = null;
  function getAudio() { if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return audioCtx; }
  function playTone(freq, dur, type, vol) {
    var a = getAudio(); if (!a) return;
    try {
      var o = a.createOscillator(), g = a.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.value = vol || 0.05; o.connect(g); g.connect(a.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
      o.stop(a.currentTime + dur);
    } catch (e) {}
  }
  function playClick() { playTone(760, 0.05, 'square', 0.035); }
  function playSuccess() { playTone(880, 0.12, 'sine', 0.09); setTimeout(function () { playTone(1180, 0.15, 'sine', 0.09); }, 110); }
  function playError() { playTone(280, 0.22, 'sawtooth', 0.05); }

  /* ================================================================
     CANVAS SIZING (Hi-DPI)
     ================================================================ */
  var CSS_W = 800, CSS_H = 460;
  function sizeCanvas() {
    var parentW = canvas.parentElement.clientWidth - 16;
    var cssW = parentW;
    var cssH = Math.min(480, Math.round(cssW * 0.60));
    if (cssW < 540) cssH = Math.round(cssW * 0.78);
    CSS_W = cssW; CSS_H = cssH;
    var dpr = window.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
  }
  sizeCanvas();
  window.addEventListener('resize', function () { sizeCanvas(); draw(); });

  /* ================================================================
     PHYSICS
     ================================================================ */
  function phiPeak() {
    /* signed peak flux (Wb): sign flips with magnet poles */
    var A = simAcm / 10000;
    return (flipped ? -1 : 1) * simB * A * Math.cos(simTheta * Math.PI / 180);
  }
  function fluxAt(xm) { return phiPeak() * Math.exp(-(xm * xm) / (2 * SIG * SIG)); }
  function dPhiDx(xm) { return phiPeak() * Math.exp(-(xm * xm) / (2 * SIG * SIG)) * (-xm / (SIG * SIG)); }

  function computePhysics() {
    var xm = mx / 100;          /* m */
    var vms = mv / 100;         /* m/s */
    var phi = fluxAt(xm);
    var dphidt = dPhiDx(xm) * vms;
    var emf = -simN * dphidt;
    var current = emf / 25;     /* A, circuit resistance ~25 Ω */
    cur.phi = phi; cur.dphidt = dphidt; cur.emf = emf; cur.current = current;
    var ae = Math.abs(emf);
    if (ae > emfPeak) emfPeak = ae; else emfPeak = Math.max(0.6, emfPeak * 0.992 + ae * 0.008);
    return cur;
  }

  /* ================================================================
     MOTION UPDATE
     ================================================================ */
  function updateMotion(dt) {
    if (motionState === 'osc') {
      var w = (simV / Math.max(1, AMP));           /* rad/s so peak speed ≈ simV cm/s */
      oscPhase += w * dt;
      var newx = AMP * Math.sin(oscPhase);
      mv = (newx - mx) / dt;
      mx = newx;
    } else if (motionState === 'pass') {
      mv = passDir * simV;
      mx += mv * dt;
      if (mx > TRACK || mx < -TRACK) {
        mx = clamp(mx, -TRACK, TRACK);
        mv = 0; motionState = 'idle';
        setPlayLabel(false);
        motionHint.textContent = 'Drag the magnet, or press Play to oscillate it';
      }
    } else if (motionState === 'drag') {
      var dx = mx - dragLastMx;
      mv = mv * 0.4 + (dx / Math.max(0.001, dt)) * 0.6;  /* smoothed */
      dragLastMx = mx;
    } else { /* idle */
      mv *= Math.pow(0.0001, dt);  /* fast decay to 0 */
      if (Math.abs(mv) < 0.05) mv = 0;
    }
  }

  /* ================================================================
     MAIN LOOP
     ================================================================ */
  var rafId = null, lastTs = 0, learnAccum = 0;
  function loop(ts) {
    if (mode !== 'simulate') { rafId = null; return; }
    if (!lastTs) lastTs = ts;
    var dt = clamp((ts - lastTs) / 1000, 0, 0.05);
    lastTs = ts;
    simT += dt;

    updateMotion(dt);
    computePhysics();

    /* record history */
    history.push({ t: simT, x: mx, phi: cur.phi, dphidt: cur.dphidt, emf: cur.emf });
    while (history.length && history[0].t < simT - GRAPH_WINDOW) history.shift();

    /* electron flow advances with current */
    flowPhase += dt * (0.6 + Math.min(6, Math.abs(cur.current) * 12)) * (cur.emf >= 0 ? 1 : -1);

    updateReadouts();
    updateStatus();
    learnAccum += dt;
    if (learnAccum > 0.15) { updateLearn(); learnAccum = 0; }

    draw();
    rafId = requestAnimationFrame(loop);
  }
  function startLoop() { if (!rafId && mode === 'simulate') { lastTs = 0; rafId = requestAnimationFrame(loop); } }
  function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  /* ================================================================
     READOUTS / STATUS / LEARNING
     ================================================================ */
  function fmtEmf(v) { var a = Math.abs(v); return a >= 100 ? v.toFixed(0) : a >= 10 ? v.toFixed(1) : v.toFixed(2); }
  function updateReadouts() {
    rPos.textContent = mx.toFixed(1);
    rVel.textContent = mv.toFixed(0);
    rFlux.textContent = (cur.phi * 1000).toFixed(2);
    rDphi.textContent = cur.dphidt.toFixed(3);
    rEmf.textContent = fmtEmf(cur.emf);
    rCur.textContent = (cur.current * 1000).toFixed(0);
  }

  function approaching() {
    /* magnet moving toward coil centre → flux magnitude rising */
    if (Math.abs(mv) < 0.5) return 0;
    return (mx * mv < 0) ? 1 : -1;
  }
  function updateStatus() {
    var ap = approaching();
    chipTrend.className = 'status-chip ' + (ap > 0 ? 'up' : ap < 0 ? 'down' : '');
    chipTrendTxt.textContent = ap > 0 ? 'Flux increasing ▲' : ap < 0 ? 'Flux decreasing ▼' : 'Flux steady';

    var emf = cur.emf;
    if (Math.abs(emf) < 0.02) {
      chipLenz.className = 'status-chip';
      chipLenzTxt.textContent = 'No induced current';
    } else if (emf >= 0) {
      chipLenz.className = 'status-chip cw';
      chipLenzTxt.textContent = 'Current ↻ clockwise';
    } else {
      chipLenz.className = 'status-chip ccw';
      chipLenzTxt.textContent = 'Current ↺ counter-clockwise';
    }

    /* pole nearest the coil */
    var nearRightEnd = mx < 0;                 /* magnet left of coil → right end faces coil */
    var rightIsN = flipped;                    /* default: left=N, right=S; flipped swaps */
    var facing = nearRightEnd ? (rightIsN ? 'N' : 'S') : (rightIsN ? 'S' : 'N');
    chipPole.className = 'status-chip ' + (facing === 'N' ? 'npole' : 'spole');
    chipPoleTxt.textContent = facing + ' pole facing coil';
  }

  var _learnCache = '';
  function updateLearn() {
    var A = simAcm / 10000;
    var phiM = (cur.phi * 1000).toFixed(2);
    var html =
      '<div class="leq"><span class="leq-label">Magnetic flux</span><br>Φ = B·A·cosθ = ' + simB.toFixed(2) + ' × ' + A.toFixed(4) + ' × cos' + simTheta + '° = <strong>' + phiM + ' mWb</strong></div>' +
      '<div class="leq"><span class="leq-label">Rate of change</span><br>dΦ/dt = <strong>' + cur.dphidt.toFixed(3) + ' Wb/s</strong> &nbsp;(from magnet speed ' + mv.toFixed(0) + ' cm/s)</div>' +
      '<div class="leq"><span class="leq-label">Faraday’s law</span><br>e = −N·dΦ/dt = −' + simN + ' × (' + cur.dphidt.toFixed(3) + ') = <strong>' + fmtEmf(cur.emf) + ' V</strong></div>' +
      '<div class="leq"><span class="leq-label">Induced current</span><br>I = e / R = ' + fmtEmf(cur.emf) + ' / 25 Ω = <strong>' + (cur.current * 1000).toFixed(0) + ' mA</strong></div>';
    if (html !== _learnCache) { $('live-eq').innerHTML = html; _learnCache = html; }
    updateCoach();
  }

  var _coachCache = '';
  function updateCoach() {
    var tips = [];
    if (Math.abs(cur.emf) < 0.02) {
      if (Math.abs(mv) < 0.5) tips.push('<strong>EMF is zero</strong> because the magnet is not moving — with no change in flux there is no induced EMF, however strong the magnet.');
      else if (simTheta >= 88 && simTheta <= 92) tips.push('<strong>EMF is zero</strong> because θ = 90°: the coil is edge-on, cosθ = 0, so no flux links it.');
      else tips.push('<strong>EMF is near zero</strong> — the magnet is centred, where the flux peaks and momentarily stops changing.');
    } else {
      var ap = approaching();
      tips.push('Flux is <strong>' + (ap > 0 ? 'increasing as the magnet approaches' : 'decreasing as the magnet leaves') + '</strong>, so the induced current flows to <strong>oppose</strong> that change (Lenz’s law).');
      tips.push('Right now e ∝ <strong>N·B·A·speed·cosθ</strong>. Raise any one — more turns, a stronger magnet, a bigger coil, faster motion — and the EMF rises in proportion.');
    }
    var html = tips.map(function (t) { return '<li>' + t + '</li>'; }).join('');
    if (html !== _coachCache) { $('coach-list').innerHTML = html; _coachCache = html; }
  }

  /* ================================================================
     DRAWING
     ================================================================ */
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
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

  /* layout cache for hit-testing the magnet */
  var layout = { cx: 0, coilY: 0, pxPerCm: 10, magW: 90, magH: 40, sceneH: 0 };

  function draw() {
    var W = CSS_W, H = CSS_H;
    ctx.clearRect(0, 0, W, H);

    /* background */
    var bg = ctx.createRadialGradient(W * 0.5, H * 0.32, 30, W * 0.5, H * 0.32, Math.max(W, H));
    bg.addColorStop(0, '#101728'); bg.addColorStop(1, '#070a14');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(40,55,90,0.22)'; ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 32) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 32) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    var sceneH = Math.round(H * 0.64);
    layout.sceneH = sceneH;
    var cx = W * 0.5;
    var coilY = sceneH * 0.38;
    var pxPerCm = clamp((W * 0.40) / TRACK, 6, 22);
    layout.cx = cx; layout.coilY = coilY; layout.pxPerCm = pxPerCm;
    layout.magW = Math.max(60, pxPerCm * 6.6);
    layout.magH = clamp(sceneH * 0.115, 20, 38);

    /* title */
    ctx.fillStyle = '#e0e7f5'; ctx.font = 'bold ' + Math.max(12, W * 0.016) + 'px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Faraday’s Law — magnet & coil', 12, 10);
    ctx.fillStyle = 'rgba(180,200,240,0.55)'; ctx.font = '10px sans-serif';
    ctx.fillText('Move the magnet to change the flux through the coil', 12, 26);

    drawFieldLines(cx, coilY, pxPerCm);
    computeCoilGeom(cx, coilY, sceneH);
    drawCoilHalf(cx, coilY, 'back');    /* far turns — behind the magnet */
    drawMagnet(cx, coilY, pxPerCm);     /* magnet sits inside the coil */
    drawCoilHalf(cx, coilY, 'front');   /* near turns — in front of the magnet */
    drawCoilOverlay(cx, coilY);         /* glow ring, angle indicator, label */
    drawCircuit(cx, coilY, sceneH, W);
    drawVoltmeter(W, sceneH);
    drawGraph(0, sceneH, W, H);

    /* idle hint (top-left, out of the way of the coil & meter) */
    if (motionState === 'idle' && Math.abs(cur.emf) < 0.02 && mode === 'simulate') {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 480);
      ctx.fillStyle = '#a5b4fc'; ctx.font = '600 11px sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('↔ Drag the magnet, or press Play', 12, 42);
      ctx.globalAlpha = 1;
    }
  }

  function drawFieldLines(cx, coilY, pxPerCm) {
    var magX = cx + mx * pxPerCm;
    var nLines = Math.round(3 + simB * 4);     /* density ∝ B */
    var halfLen = layout.magW / 2;
    /* poles: default left=N(red), right=S(blue); flip swaps emergence side */
    var nx = flipped ? magX + halfLen : magX - halfLen;  /* N pole x */
    var reach = (40 + simB * 38);
    ctx.lineWidth = 1.1;
    for (var i = 0; i < nLines; i++) {
      var frac = (i + 1) / (nLines + 1);
      var span = (frac - 0.5) * 2;               /* -1..1 */
      var arc = Math.abs(span) * reach + 14;
      var dir = flipped ? -1 : 1;                 /* field exits N toward S */
      var a = 0.5 - Math.abs(span) * 0.28;
      ctx.strokeStyle = 'rgba(255,150,120,' + a + ')';
      ctx.beginPath();
      ctx.moveTo(nx, coilY);
      ctx.bezierCurveTo(nx + dir * arc, coilY - span * reach, nx + dir * (halfLen * 2 + arc), coilY - span * reach, nx + dir * (halfLen * 2), coilY);
      ctx.stroke();
      /* arrowhead mid-line */
      var mxA = nx + dir * (halfLen + arc * 0.5);
      var myA = coilY - span * reach * 0.92;
      ctx.fillStyle = 'rgba(255,150,120,' + a + ')';
      ctx.save(); ctx.translate(mxA, myA); ctx.rotate(span > 0 ? (dir > 0 ? -0.5 : 0.5 + Math.PI) : (dir > 0 ? 0.5 : -0.5 + Math.PI));
      ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-4, 3.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  function computeCoilGeom(cx, coilY, sceneH) {
    var loops = clamp(Math.round(4 + simN / 28), 5, 15);
    var coilHalfW = clamp(layout.pxPerCm * 2.2, 26, 64);
    /* coil noticeably larger than the magnet */
    var ry = clamp(Math.sqrt(simAcm) * 3.1, sceneH * 0.12, sceneH * 0.26);
    var rx = clamp(ry * 0.30, 9, 26);
    layout.coilRx = rx; layout.coilRy = ry; layout.coilHalfW = coilHalfW;
    layout.coilLoops = loops; layout.coilAng = simTheta * Math.PI / 180;   /* 0° faces field, 90° edge-on */
    layout.coilMaxR = Math.max(ry, coilHalfW);
  }

  /* Draw the coil in two depth passes so the magnet threads THROUGH it:
       'back'  = far (top) half of each loop   → drawn BEFORE the magnet
       'front' = near (bottom) half of each loop → drawn AFTER the magnet */
  function drawCoilHalf(cx, coilY, which) {
    var loops = layout.coilLoops, coilHalfW = layout.coilHalfW,
        rx = layout.coilRx, ry = layout.coilRy, ang = layout.coilAng;
    var start = which === 'back' ? Math.PI : 0;
    var end = which === 'back' ? Math.PI * 2 : Math.PI;
    ctx.save();
    ctx.translate(cx, coilY);
    ctx.rotate(ang);
    var step = (coilHalfW * 2) / (loops - 1);
    for (var i = 0; i < loops; i++) {
      var lx = -coilHalfW + i * step;
      var depth = 0.45 + 0.55 * (i / (loops - 1));
      /* near (front) turns are brighter than far (back) turns */
      var base = which === 'front' ? 0.42 : 0.24;
      ctx.strokeStyle = 'rgba(205,212,235,' + (base + 0.45 * depth) + ')';
      ctx.lineWidth = which === 'front' ? 2.8 : 2.3;
      ctx.beginPath(); ctx.ellipse(lx, 0, rx, ry, 0, start, end); ctx.stroke();
      if (which === 'back') {
        ctx.strokeStyle = 'rgba(255,200,140,' + (0.10 + 0.18 * depth) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(lx, 0, rx, ry, 0, -2.4, -0.7); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawCoilOverlay(cx, coilY) {
    var rx = layout.coilRx, ry = layout.coilRy, ang = layout.coilAng, maxR = layout.coilMaxR;
    /* glow ring when EMF present (green = flux rising, red = falling) */
    if (Math.abs(cur.emf) > 0.03) {
      var trend = approaching();
      var glow = trend > 0 ? 'rgba(61,220,132,' : 'rgba(255,85,85,';
      ctx.save(); ctx.translate(cx, coilY); ctx.rotate(ang);
      ctx.strokeStyle = glow + (0.25 + Math.min(0.5, Math.abs(cur.emf) / Math.max(0.5, emfPeak) * 0.5)) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, 0, rx + 4, ry + 4, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
    /* angle indicator: field direction (dashed) vs coil normal (arrow) + θ arc */
    drawAngleIndicator(cx, coilY, ang, maxR);
    /* coil label — above the coil so the wires & meter below stay clear */
    ctx.fillStyle = 'rgba(205,212,235,0.85)'; ctx.font = '700 11px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Coil  N = ' + simN, cx, coilY - ry - 8);
  }

  function drawAngleIndicator(cx, coilY, ang, maxR) {
    var L = maxR + 24;
    /* field / motion reference — horizontal, dashed (the magnet's field direction) */
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(255,150,120,0.6)'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(cx, coilY); ctx.lineTo(cx + L, coilY); ctx.stroke();
    ctx.restore();
    /* coil normal — rotates with the coil */
    ctx.strokeStyle = 'rgba(165,180,252,0.95)'; ctx.lineWidth = 1.8;
    drawArrow(ctx, cx, coilY, cx + L * Math.cos(ang), coilY + L * Math.sin(ang), 6);
    /* θ arc + label */
    if (simTheta > 1) {
      ctx.strokeStyle = 'rgba(245,200,66,0.85)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, coilY, maxR + 14, 0, ang, false); ctx.stroke();
      var la = ang / 2;
      ctx.fillStyle = '#f5c842'; ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('θ=' + simTheta + '°', cx + (maxR + 20) * Math.cos(la) + 3, coilY + (maxR + 20) * Math.sin(la));
    }
  }

  function drawMagnet(cx, coilY, pxPerCm) {
    var magX = cx + mx * pxPerCm;
    var w = layout.magW, h = layout.magH;
    var x = magX - w / 2, y = coilY - h / 2;
    var r = Math.min(6, h / 2);
    var leftN = !flipped;                 /* default: N on the left tip, S on the right */
    var capW = Math.max(15, w * 0.24);    /* painted pole tip length */

    ctx.save();
    /* shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, x + 3, y + 5, w, h, r); ctx.fill();

    /* one continuous steel bar */
    var body = ctx.createLinearGradient(x, y, x, y + h);
    body.addColorStop(0, '#eef2f9'); body.addColorStop(0.2, '#c6cedb');
    body.addColorStop(0.5, '#9aa3b5'); body.addColorStop(0.82, '#6c7484');
    body.addColorStop(1, '#aeb6c6');
    ctx.fillStyle = body;
    roundRect(ctx, x, y, w, h, r); ctx.fill();

    /* painted pole tips (clipped to the bar so it stays one rounded piece) */
    ctx.save();
    roundRect(ctx, x, y, w, h, r); ctx.clip();
    function cap(cxx, isN) {
      var g = ctx.createLinearGradient(0, y, 0, y + h);
      if (isN) { g.addColorStop(0, '#ef5350'); g.addColorStop(0.5, '#c62828'); g.addColorStop(1, '#e53935'); }
      else { g.addColorStop(0, '#42a5f5'); g.addColorStop(0.5, '#1565c0'); g.addColorStop(1, '#1e88e5'); }
      ctx.fillStyle = g; ctx.fillRect(cxx, y, capW, h);
    }
    cap(x, leftN);
    cap(x + w - capW, !leftN);
    ctx.restore();

    /* top sheen across the whole bar */
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    roundRect(ctx, x + 4, y + 3, w - 8, Math.max(3, h * 0.18), 3); ctx.fill();

    /* single outline + faint tip seams */
    ctx.strokeStyle = 'rgba(18,24,38,0.55)'; ctx.lineWidth = 1.4;
    roundRect(ctx, x, y, w, h, r); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + capW, y + 1); ctx.lineTo(x + capW, y + h - 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w - capW, y + 1); ctx.lineTo(x + w - capW, y + h - 1); ctx.stroke();

    /* pole letters at the tips */
    ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.max(12, h * 0.55) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 3;
    ctx.fillText(leftN ? 'N' : 'S', x + capW / 2, y + h / 2);
    ctx.fillText(leftN ? 'S' : 'N', x + w - capW / 2, y + h / 2);
    ctx.shadowBlur = 0;

    /* velocity arrow */
    if (Math.abs(mv) > 1) {
      var dir = mv > 0 ? 1 : -1;
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.2;
      var ax = magX + dir * (w / 2 + 6), ay = y - 9;
      drawArrow(ctx, magX + dir * (w / 2 - 6), ay, ax + dir * 16, ay, 6);
      ctx.fillStyle = '#f5c842'; ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('v', magX + dir * (w / 2 + 6), ay - 4);
    }
    ctx.restore();
  }

  function drawCircuit(cx, coilY, sceneH, W) {
    var ang = layout.coilAng || 0, coilHalfW = layout.coilHalfW || 40, ry = layout.coilRy || 40;
    /* connection points follow the coil: bottom of the two END loops */
    function rot(lx, ly) { return { x: cx + lx * Math.cos(ang) - ly * Math.sin(ang), y: coilY + lx * Math.sin(ang) + ly * Math.cos(ang) }; }
    var leftEnd = rot(-coilHalfW, ry * 0.72);
    var rightEnd = rot(coilHalfW, ry * 0.72);

    /* galvanometer sits below the coil with clear spacing */
    var galW = clamp(W * 0.16, 92, 118), galH = clamp(sceneH * 0.17, 40, 54);
    var galBoxTop = coilY + ry + Math.max(46, sceneH * 0.16);
    galBoxTop = Math.min(galBoxTop, sceneH - galH - Math.max(20, sceneH * 0.055));
    var termL = cx - galW * 0.32, termR = cx + galW * 0.32;
    var busY = Math.min(Math.max(leftEnd.y, rightEnd.y) + 14, galBoxTop - 14);

    /* leads: coil end → down → horizontal bus → down into terminal */
    ctx.strokeStyle = '#8a93b5'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(leftEnd.x, leftEnd.y); ctx.lineTo(leftEnd.x, busY); ctx.lineTo(termL, busY); ctx.lineTo(termL, galBoxTop); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(rightEnd.x, rightEnd.y); ctx.lineTo(rightEnd.x, busY); ctx.lineTo(termR, busY); ctx.lineTo(termR, galBoxTop); ctx.stroke();
    /* solder joints at the coil ends + terminal screws on the meter */
    ctx.fillStyle = '#c2cbe0';
    ctx.beginPath(); ctx.arc(leftEnd.x, leftEnd.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(rightEnd.x, rightEnd.y, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a93b5';
    ctx.beginPath(); ctx.arc(termL, galBoxTop, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(termR, galBoxTop, 3, 0, Math.PI * 2); ctx.fill();

    /* electron flow around the visible loop */
    if (Math.abs(cur.emf) > 0.02) {
      var path = [
        { x: termL, y: galBoxTop }, { x: termL, y: busY }, { x: leftEnd.x, y: busY }, { x: leftEnd.x, y: leftEnd.y },
        { x: rightEnd.x, y: rightEnd.y }, { x: rightEnd.x, y: busY }, { x: termR, y: busY }, { x: termR, y: galBoxTop }
      ];
      var segs = [], total = 0;
      for (var i = 0; i < path.length - 1; i++) {
        var s = { a: path[i], b: path[i + 1] };
        s.len = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y); total += s.len; segs.push(s);
      }
      var n = 9, base = (flowPhase % 1 + 1) % 1;
      for (var k = 0; k < n; k++) {
        var u = (base + k / n) % 1, travel = u * total, acc = 0;
        for (var si = 0; si < segs.length; si++) {
          if (travel <= acc + segs[si].len) {
            var lu = (travel - acc) / segs[si].len;
            ctx.fillStyle = cur.emf >= 0 ? 'rgba(245,200,66,0.95)' : 'rgba(79,195,247,0.95)';
            ctx.beginPath();
            ctx.arc(segs[si].a.x + (segs[si].b.x - segs[si].a.x) * lu, segs[si].a.y + (segs[si].b.y - segs[si].a.y) * lu, 2.6, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
          acc += segs[si].len;
        }
      }
    }

    drawGalvanometer(cx, galBoxTop, galW, galH);
    /* meter label below the box */
    ctx.fillStyle = 'rgba(170,190,225,0.85)'; ctx.font = '700 10px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Galvanometer', cx, galBoxTop + galH + 5);
  }

  function drawGalvanometer(cx, cy, w, h) {
    /* body */
    ctx.fillStyle = '#11161f';
    roundRect(ctx, cx - w / 2, cy, w, h, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,180,0.4)'; ctx.lineWidth = 1.4;
    roundRect(ctx, cx - w / 2, cy, w, h, 8); ctx.stroke();
    /* dial */
    var dcx = cx, dcy = cy + h - 12, dr = h - 18;
    ctx.strokeStyle = 'rgba(150,170,210,0.5)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(dcx, dcy, dr, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    /* ticks */
    for (var t = 0; t <= 8; t++) {
      var a = Math.PI * 1.15 + (Math.PI * 0.70) * (t / 8);
      var r1 = dr - 4, r2 = dr;
      ctx.strokeStyle = (t === 4) ? 'rgba(245,200,66,0.9)' : 'rgba(150,170,210,0.45)';
      ctx.lineWidth = (t === 4) ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(dcx + r1 * Math.cos(a), dcy + r1 * Math.sin(a));
      ctx.lineTo(dcx + r2 * Math.cos(a), dcy + r2 * Math.sin(a));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(170,190,225,0.7)'; ctx.font = '8px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('−', dcx - dr * 0.78, cy + 4); ctx.fillText('0', dcx, cy + 2); ctx.fillText('+', dcx + dr * 0.78, cy + 4);
    /* needle */
    var defl = clamp(cur.emf / Math.max(0.6, emfPeak), -1, 1);
    var needleA = -Math.PI / 2 + defl * (Math.PI * 0.35);
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(dcx, dcy); ctx.lineTo(dcx + dr * 0.92 * Math.cos(needleA), dcy + dr * 0.92 * Math.sin(needleA)); ctx.stroke();
    ctx.fillStyle = '#cdd4eb'; ctx.beginPath(); ctx.arc(dcx, dcy, 2.6, 0, Math.PI * 2); ctx.fill();
  }

  function drawVoltmeter(W, sceneH) {
    var w = clamp(W * 0.18, 96, 150), h = 40;
    var x = W - w - 12, y = 40;
    ctx.fillStyle = '#0a0e16';
    roundRect(ctx, x, y, w, h, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(99,102,241,0.45)'; ctx.lineWidth = 1.2;
    roundRect(ctx, x, y, w, h, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(170,190,225,0.7)'; ctx.font = '8px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('VOLTMETER', x + 8, y + 5);
    ctx.fillStyle = Math.abs(cur.emf) < 0.02 ? 'rgba(120,200,150,0.6)' : (cur.emf >= 0 ? '#3ddc84' : '#ff7b7b');
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText(fmtEmf(cur.emf) + ' V', x + w - 8, y + h - 5);
  }

  function drawGraph(gx, gy, W, H) {
    var pad = 12;
    var L = gx + 44, R = W - 14, T = gy + 18, B = H - 22;
    var pw = R - L, ph = B - T;
    /* card */
    var grd = ctx.createLinearGradient(0, T, 0, B);
    grd.addColorStop(0, 'rgba(20,28,48,0.9)'); grd.addColorStop(1, 'rgba(10,15,28,0.9)');
    ctx.fillStyle = grd; roundRect(ctx, gx + 8, gy + 6, W - 16, H - gy - 12, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(120,140,180,0.18)'; ctx.lineWidth = 1;
    roundRect(ctx, gx + 8, gy + 6, W - 16, H - gy - 12, 10); ctx.stroke();

    var titleMap = { emf: 'Induced EMF vs Time', flux: 'Magnetic Flux vs Time', pos: 'Magnet Position vs Time' };
    var unitMap = { emf: 'e (V)', flux: 'Φ (mWb)', pos: 'x (cm)' };
    ctx.fillStyle = '#e0e7f5'; ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(titleMap[graphKind], gx + 16, gy + 12);

    /* gather series */
    var vals = history.map(function (s) {
      return graphKind === 'emf' ? s.emf : graphKind === 'flux' ? s.phi * 1000 : s.x;
    });
    var maxAbs = 0.001;
    for (var i = 0; i < vals.length; i++) maxAbs = Math.max(maxAbs, Math.abs(vals[i]));
    if (graphKind === 'pos') maxAbs = Math.max(maxAbs, TRACK);
    maxAbs *= 1.12;
    var midY = T + ph * 0.5;

    /* grid */
    ctx.strokeStyle = 'rgba(60,80,120,0.30)'; ctx.lineWidth = 0.5;
    for (var v = 0; v <= 4; v++) { var yy = T + ph * v / 4; ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(R, yy); ctx.stroke(); }
    for (var hh = 0; hh <= 6; hh++) { var xx = L + pw * hh / 6; ctx.beginPath(); ctx.moveTo(xx, T); ctx.lineTo(xx, B); ctx.stroke(); }
    /* zero axis */
    ctx.strokeStyle = 'rgba(180,200,240,0.45)'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(L, midY); ctx.lineTo(R, midY); ctx.stroke();

    /* axis labels */
    ctx.fillStyle = 'rgba(180,200,240,0.7)'; ctx.font = '9px monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('+' + maxAbs.toFixed(maxAbs < 10 ? 1 : 0), L - 4, T + 2);
    ctx.fillText('0', L - 4, midY);
    ctx.fillText('-' + maxAbs.toFixed(maxAbs < 10 ? 1 : 0), L - 4, B - 2);
    ctx.save(); ctx.translate(gx + 16, midY); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(180,200,240,0.65)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(unitMap[graphKind], 0, 0); ctx.restore();
    ctx.fillStyle = 'rgba(180,200,240,0.6)'; ctx.font = '9px sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('time →  (last ' + GRAPH_WINDOW + ' s)', R, B + 18);

    /* plot */
    if (history.length > 1) {
      var color = graphKind === 'emf' ? '#3ddc84' : graphKind === 'flux' ? '#ffb74d' : '#a5b4fc';
      ctx.strokeStyle = color; ctx.lineWidth = 2.2;
      ctx.shadowColor = color; ctx.shadowBlur = 5;
      ctx.beginPath();
      var t0 = simT - GRAPH_WINDOW;
      for (var p = 0; p < history.length; p++) {
        var s = history[p];
        var px = L + clamp((s.t - t0) / GRAPH_WINDOW, 0, 1) * pw;
        var val = graphKind === 'emf' ? s.emf : graphKind === 'flux' ? s.phi * 1000 : s.x;
        var py = midY - (val / maxAbs) * (ph * 0.5);
        if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.shadowBlur = 0;
      /* head dot */
      var last = history[history.length - 1];
      var hxv = graphKind === 'emf' ? last.emf : graphKind === 'flux' ? last.phi * 1000 : last.x;
      var hy = midY - (hxv / maxAbs) * (ph * 0.5);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(R, hy, 3.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ================================================================
     POINTER (drag the magnet)
     ================================================================ */
  function canvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (CSS_W / rect.width), y: (e.clientY - rect.top) * (CSS_H / rect.height) };
  }
  function magnetHit(px, py) {
    var magX = layout.cx + mx * layout.pxPerCm;
    return Math.abs(px - magX) < layout.magW / 2 + 8 && Math.abs(py - layout.coilY) < layout.magH / 2 + 14;
  }
  canvas.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    var p = canvasPos(e);
    if (magnetHit(p.x, p.y)) {
      e.preventDefault();
      dragging = true; motionState = 'drag';
      canvas.classList.add('grabbing');
      try { canvas.setPointerCapture(e.pointerId); } catch (er) {}
      mx = clamp((p.x - layout.cx) / layout.pxPerCm, -TRACK, TRACK);
      dragLastMx = mx; mv = 0;
      setPlayLabel(false);
      motionHint.textContent = 'Dragging — move left/right through the coil';
      getAudio();
      startLoop();
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    e.preventDefault();
    var p = canvasPos(e);
    mx = clamp((p.x - layout.cx) / layout.pxPerCm, -TRACK, TRACK);
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false; canvas.classList.remove('grabbing');
    if (motionState === 'drag') motionState = 'idle';
    motionHint.textContent = 'Drag the magnet, or press Play to oscillate it';
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', endDrag);

  /* ================================================================
     CONTROLS — sliders + steppers
     ================================================================ */
  function flashCard(card) {
    if (!card) return;
    card.classList.add('flash');
    setTimeout(function () { card.classList.remove('flash'); }, 600);
  }
  function syncInputs() {
    bSlider.value = simB; bInput.value = simB.toFixed(2);
    nSlider.value = simN; nInput.value = simN;
    aSlider.value = simAcm; aInput.value = simAcm;
    vSlider.value = simV; vInput.value = simV;
    tSlider.value = simTheta; tInput.value = simTheta;
  }
  function setParam(which, val) {
    if (which === 'b') simB = clamp(round2(val), 0.1, 2.0);
    else if (which === 'n') simN = clamp(Math.round(val), 1, 400);
    else if (which === 'a') simAcm = clamp(Math.round(val), 5, 200);
    else if (which === 'v') simV = clamp(Math.round(val), 2, 120);
    else if (which === 't') simTheta = clamp(Math.round(val), 0, 180);
    syncInputs();
    if (mode === 'simulate') { computePhysics(); updateReadouts(); updateStatus(); updateLearn(); draw(); }
  }
  var sliderMap = { b: bSlider, n: nSlider, a: aSlider, v: vSlider, t: tSlider };
  Object.keys(sliderMap).forEach(function (key) {
    sliderMap[key].addEventListener('input', function () { setParam(key, parseFloat(this.value)); });
  });
  [['b', bInput], ['n', nInput], ['a', aInput], ['v', vInput], ['t', tInput]].forEach(function (pair) {
    pair[1].addEventListener('input', function () { var v = parseFloat(this.value); if (!isNaN(v)) setParam(pair[0], v); });
  });
  document.querySelectorAll('.stepper').forEach(function (st) {
    var key = st.getAttribute('data-target');
    st.querySelectorAll('.step-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cur2 = key === 'b' ? simB : key === 'n' ? simN : key === 'a' ? simAcm : key === 'v' ? simV : simTheta;
        setParam(key, cur2 + parseFloat(btn.getAttribute('data-step')));
        playClick();
      });
    });
  });

  /* graph toggle */
  $('graph-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.pill'); if (!b) return;
    graphKind = b.getAttribute('data-graph');
    this.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === b); });
    playClick(); draw();
  });

  /* ================================================================
     MOTION BUTTONS
     ================================================================ */
  function setPlayLabel(playing) {
    playBtn.innerHTML = playing ? '&#10074;&#10074; Pause' : '&#9654; Play';
  }
  playBtn.addEventListener('click', function () {
    getAudio();
    if (motionState === 'osc') {
      motionState = 'idle'; setPlayLabel(false);
      motionHint.textContent = 'Paused — drag the magnet or press Play';
    } else {
      oscPhase = Math.asin(clamp(mx / AMP, -1, 1));
      motionState = 'osc'; setPlayLabel(true);
      motionHint.textContent = 'Oscillating — the magnet sweeps through the coil';
      startLoop();
    }
    playClick();
  });
  resetBtn.addEventListener('click', function () { resetSim(); playClick(); });
  flipBtn.addEventListener('click', function () {
    flipped = !flipped; playClick();
    motionHint.textContent = 'Poles flipped — induced current reverses';
    if (mode === 'simulate') { computePhysics(); updateReadouts(); updateStatus(); updateLearn(); draw(); }
  });
  function resetSim() {
    motionState = 'idle'; mx = -7; mv = 0; oscPhase = 0; simT = 0;
    history = []; emfPeak = 1.5; flowPhase = 0;
    setPlayLabel(false);
    motionHint.textContent = 'Drag the magnet, or press Play to oscillate it';
    computePhysics(); updateReadouts(); updateStatus(); updateLearn(); draw();
  }

  /* ================================================================
     PRESETS
     ================================================================ */
  var PRESETS = {
    enter:   function () { simB = 0.8; simN = 120; simAcm = 50; simV = 35; simTheta = 0; flipped = false; startPass(1, -TRACK); },
    leave:   function () { simB = 0.8; simN = 120; simAcm = 50; simV = 35; simTheta = 0; flipped = false; startPass(-1, TRACK); },
    strong:  function () { simB = 2.0; simN = 120; simAcm = 50; simV = 40; simTheta = 0; startOsc(); flashCard($('r-flux').closest('.readout-card')); },
    weak:    function () { simB = 0.2; simN = 120; simAcm = 50; simV = 40; simTheta = 0; startOsc(); flashCard($('r-flux').closest('.readout-card')); },
    fast:    function () { simV = 110; simB = 0.8; simN = 120; simAcm = 50; simTheta = 0; startOsc(); flashCard($('r-vel').closest('.readout-card')); },
    slow:    function () { simV = 10; simB = 0.8; simN = 120; simAcm = 50; simTheta = 0; startOsc(); flashCard($('r-vel').closest('.readout-card')); },
    many:    function () { simN = 380; simB = 0.8; simAcm = 50; simV = 40; simTheta = 0; startOsc(); flashCard($('r-emf').closest('.readout-card')); },
    few:     function () { simN = 10; simB = 0.8; simAcm = 50; simV = 40; simTheta = 0; startOsc(); flashCard($('r-emf').closest('.readout-card')); },
    tilt:    function () { simTheta = 90; simB = 0.8; simN = 120; simAcm = 50; simV = 40; startOsc(); flashCard($('r-flux').closest('.readout-card')); },
    'default': function () { simB = 0.80; simN = 120; simAcm = 50; simV = 40; simTheta = 0; flipped = false; resetSim(); }
  };
  function startOsc() {
    syncInputs();
    oscPhase = Math.asin(clamp(mx / AMP, -1, 1));
    motionState = 'osc'; setPlayLabel(true);
    motionHint.textContent = 'Oscillating — the magnet sweeps through the coil';
    startLoop();
  }
  function startPass(dir, fromCm) {
    syncInputs();
    mx = fromCm; mv = 0; passDir = dir;
    motionState = 'pass'; setPlayLabel(true);
    motionHint.textContent = dir > 0 ? 'Magnet passing in from the left…' : 'Magnet passing back from the right…';
    startLoop();
  }
  $('preset-row').addEventListener('click', function (e) {
    var b = e.target.closest('.preset-btn'); if (!b) return;
    getAudio(); playClick();
    var key = b.getAttribute('data-preset');
    if (PRESETS[key]) PRESETS[key]();
    document.querySelectorAll('.preset-btn').forEach(function (p) { p.classList.toggle('active', p === b && key !== 'default'); });
    if (mode === 'simulate') { computePhysics(); updateReadouts(); updateStatus(); updateLearn(); draw(); }
  });

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  $('mode-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.pill'); if (!b) return;
    var m = b.getAttribute('data-mode');
    this.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === b); });
    switchMode(m);
    playClick();
  });
  function show(el, on) { el.style.display = on ? '' : 'none'; }
  function switchMode(m) {
    mode = m;
    show(simPanel, m === 'simulate');
    show(catRow, m === 'explore');
    show(itemSelector, m === 'explore');
    show(itemInfo, m === 'explore');
    show(practicePanel, m === 'practice');
    show(practiceBar, m === 'practice');
    show(quizPanel, m === 'quiz');
    show(quizBar, m === 'quiz');
    show(quizResult, false);
    if (m === 'simulate') { startLoop(); }
    else {
      motionState = 'idle'; stopLoop();
      draw();  /* static frame */
    }
    if (m === 'explore') { if (!selectedConcept) selectConceptByCat(); renderConceptGrid(); }
    if (m === 'practice') newProblem();
    if (m === 'quiz') startQuiz();
  }

  /* ================================================================
     EXPLORE
     ================================================================ */
  $('cat-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('.pill'); if (!b) return;
    exploreCat = b.getAttribute('data-cat');
    this.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === b); });
    selectConceptByCat(); renderConceptGrid(); playClick();
  });
  function selectConceptByCat() {
    var list = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    selectedConcept = list[0] || CONCEPTS[0];
    renderConcept();
  }
  function renderConceptGrid() {
    var list = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    conceptGrid.innerHTML = list.map(function (c) {
      var on = selectedConcept && selectedConcept.id === c.id;
      return '<button class="is-btn' + (on ? ' active' : '') + '" data-id="' + c.id + '">' +
        '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span></button>';
    }).join('');
  }
  conceptGrid.addEventListener('click', function (e) {
    var b = e.target.closest('.is-btn'); if (!b) return;
    var id = b.getAttribute('data-id');
    selectedConcept = CONCEPTS.filter(function (c) { return c.id === id; })[0];
    renderConceptGrid(); renderConcept(); playClick();
  });
  function renderConcept() {
    var c = selectedConcept; if (!c) return;
    var ex = c.example;
    var exHtml = '';
    if (ex) {
      exHtml = '<div class="example-box"><h4>Worked Example</h4>' +
        '<div class="ex-problem">' + ex.problem + '</div>' +
        ex.steps.map(function (s) { return '<div class="ex-step">' + s + '</div>'; }).join('') +
        '</div>';
    }
    itemInfo.innerHTML =
      '<div class="ii-top"><span class="ii-name">' + c.name + '</span>' +
      '<span class="ii-cat-badge">' + c.cat + '</span></div>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' + exHtml;
  }

  /* ================================================================
     PRACTICE
     ================================================================ */
  function newProblem() {
    currentProblem = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)]();
    practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = ''; ppInput.disabled = false;
    ppFeedback.textContent = ''; ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppCheck.style.display = ''; ppNext.style.display = 'none';
    ppInput.focus();
  }
  function checkProblem() {
    if (practiceAnswered || !currentProblem) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Enter a number first.'; ppFeedback.className = 'feedback err'; return; }
    practiceAnswered = true; practiceTotal++;
    var ok = Math.abs(val - currentProblem.answer) <= currentProblem.tol;
    if (ok) { practiceCorrect++; ppFeedback.textContent = '✓ Correct!'; ppFeedback.className = 'feedback ok'; playSuccess(); }
    else { ppFeedback.textContent = '✗ Not quite — answer: ' + currentProblem.answer + ' ' + currentProblem.unit; ppFeedback.className = 'feedback err'; playError(); }
    pbarScore.textContent = practiceCorrect + ' / ' + practiceTotal;
    ppSolution.innerHTML = '<h4>Step-by-step Solution</h4>' +
      currentProblem.steps.map(function (s) { return '<div class="sol-step">' + s + '</div>'; }).join('');
    ppSolution.style.display = '';
    ppInput.disabled = true; ppCheck.style.display = 'none'; ppNext.style.display = '';
  }
  ppCheck.addEventListener('click', checkProblem);
  ppNext.addEventListener('click', newProblem);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { practiceAnswered ? newProblem() : checkProblem(); } });

  /* ================================================================
     QUIZ
     ================================================================ */
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startQuiz() {
    quizSet = shuffle(QUIZ_POOL).slice(0, QUIZ_SIZE);
    quizIdx = 0; quizScore = 0; quizAnswers = []; quizAnswered = false;
    show(quizResult, false); show(quizPanel, true); show(quizBar, true);
    renderQuiz();
  }
  function renderQuiz() {
    var q = quizSet[quizIdx];
    qbarNum.textContent = (quizIdx + 1);
    quizAnswered = false;
    var html = '<p class="qp-prompt">' + q.prompt + '</p>';
    if (q.type === 'mcq') {
      html += '<div class="answer-grid">' + q.options.map(function (o, i) {
        return '<button class="answer-btn" data-i="' + i + '">' + o + '</button>';
      }).join('') + '</div>';
    } else {
      html += '<div class="quiz-input-row"><input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer">' +
        '<span class="qi-unit">' + q.unit + '</span>' +
        '<button class="btn btn-primary" id="qi-submit">Submit</button></div>';
    }
    html += '<div class="quiz-feedback" id="quiz-fb"></div>';
    html += '<div style="margin-top:12px;"><button class="btn btn-ghost" id="quiz-next" style="display:none;">Next →</button></div>';
    quizPanel.innerHTML = html;
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (b) {
        b.addEventListener('click', function () { answerMcq(parseInt(b.getAttribute('data-i'), 10)); });
      });
    } else {
      $('qi-submit').addEventListener('click', answerNumeric);
      $('qi-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') answerNumeric(); });
      $('qi-input').focus();
    }
    var nb = $('quiz-next'); if (nb) nb.addEventListener('click', nextQuiz);
  }
  function answerMcq(i) {
    if (quizAnswered) return; quizAnswered = true;
    var q = quizSet[quizIdx];
    var ok = i === q.correct;
    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b, idx) {
      b.classList.add('locked');
      if (idx === q.correct) b.classList.add('correct');
      if (idx === i && !ok) b.classList.add('wrong');
    });
    finishQuizQ(ok, q.options[q.correct]);
  }
  function answerNumeric() {
    if (quizAnswered) return;
    var q = quizSet[quizIdx];
    var val = parseFloat($('qi-input').value);
    if (isNaN(val)) { $('quiz-fb').textContent = 'Enter a number first.'; $('quiz-fb').className = 'quiz-feedback err'; return; }
    quizAnswered = true;
    var ok = Math.abs(val - q.answer) <= q.tol;
    $('qi-input').disabled = true; $('qi-submit').disabled = true;
    finishQuizQ(ok, q.answer + ' ' + q.unit);
  }
  function finishQuizQ(ok, correctTxt) {
    var fb = $('quiz-fb');
    if (ok) { quizScore++; fb.textContent = '✓ Correct!'; fb.className = 'quiz-feedback ok'; playSuccess(); }
    else { fb.textContent = '✗ Correct answer: ' + correctTxt; fb.className = 'quiz-feedback err'; playError(); }
    quizAnswers.push({ q: quizSet[quizIdx].prompt, ok: ok, correct: correctTxt });
    var nb = $('quiz-next'); if (nb) nb.style.display = '';
  }
  function nextQuiz() {
    quizIdx++;
    if (quizIdx >= quizSet.length) showQuizResult();
    else renderQuiz();
  }
  function showQuizResult() {
    show(quizPanel, false); show(quizBar, false); show(quizResult, true);
    var pct = quizScore / QUIZ_SIZE;
    var stars = pct === 1 ? '★★★' : pct >= 0.6 ? '★★☆' : pct >= 0.4 ? '★☆☆' : '☆☆☆';
    var cls = pct === 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var verdict = pct === 1 ? 'Perfect! You’ve mastered Faraday’s law.' : pct >= 0.6 ? 'Good work — review the misses below.' : 'Keep practising — revisit Explore mode.';
    var rows = quizAnswers.map(function (a, i) {
      return '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '"><div class="qr-qnum">Q' + (i + 1) + '</div>' +
        '<div class="qr-detail">' + a.q + (a.ok ? '' : '<br><strong>Answer: ' + a.correct + '</strong>') + '</div>' +
        '<div class="qr-mark">' + (a.ok ? '✓' : '✗') + '</div></div>';
    }).join('');
    quizResult.innerHTML =
      '<div class="qr-header"><div class="qr-title-wrap"><div class="qr-title">Quiz Complete</div>' +
      '<div class="qr-stars ' + cls + '" style="color:' + (cls === 'perfect' ? 'var(--gold)' : cls === 'good' ? 'var(--green)' : 'var(--red)') + '">' + stars + '</div></div>' +
      '<div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</div>' +
      '<div class="qr-verdict">' + verdict + '</div></div></div>' +
      '<div class="qr-rows">' + rows + '</div>' +
      '<div><button class="btn btn-primary" id="quiz-retry">↺ New Quiz</button></div>';
    $('quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     CALC MODAL
     ================================================================ */
  function buildCalc() {
    var A = simAcm / 10000;
    var cosv = Math.cos(simTheta * Math.PI / 180);
    var html =
      '<div class="cs-inputs"><span class="cs-badge">Current State</span><div class="cs-given">' +
      '<span>B = ' + simB.toFixed(2) + ' T</span><span>N = ' + simN + '</span><span>A = ' + simAcm + ' cm² = ' + A.toFixed(4) + ' m²</span>' +
      '<span>θ = ' + simTheta + '°</span><span>x = ' + mx.toFixed(1) + ' cm</span><span>v = ' + mv.toFixed(0) + ' cm/s</span></div></div>' +
      step(1, 'Magnetic flux', 'Φ = B · A · cosθ',
        'Φ = ' + simB.toFixed(2) + ' × ' + A.toFixed(4) + ' × cos' + simTheta + '°\n  = ' + simB.toFixed(2) + ' × ' + A.toFixed(4) + ' × ' + cosv.toFixed(3),
        'Φ = ' + (cur.phi * 1000).toFixed(2) + ' mWb (peak at coil centre)') +
      step(2, 'Rate of change of flux', 'dΦ/dt  (from the magnet’s motion)',
        'magnet speed v = ' + mv.toFixed(0) + ' cm/s = ' + (mv / 100).toFixed(3) + ' m/s\nposition x = ' + (mx / 100).toFixed(3) + ' m',
        'dΦ/dt = ' + cur.dphidt.toFixed(3) + ' Wb/s') +
      step(3, 'Faraday’s law', 'e = −N · dΦ/dt',
        'e = −' + simN + ' × (' + cur.dphidt.toFixed(3) + ')',
        'e = ' + fmtEmf(cur.emf) + ' V') +
      step(4, 'Induced current', 'I = e / R   (R ≈ 25 Ω)',
        'I = ' + fmtEmf(cur.emf) + ' / 25',
        'I = ' + (cur.current * 1000).toFixed(0) + ' mA') +
      '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Note</span><span class="cs-title">Lenz’s law</span></div>' +
      '<div class="cs-result">The minus sign means the induced current opposes the change in flux. ' +
      (Math.abs(cur.emf) < 0.02 ? 'Right now the flux is not changing, so there is no induced EMF.' :
        'Right now the flux is ' + (approaching() > 0 ? 'increasing' : 'decreasing') + ', so the current flows to ' + (approaching() > 0 ? 'oppose the approaching magnet' : 'attract the leaving magnet') + '.') +
      '</div></div>';
    return html;
  }
  function step(n, title, formula, calc, result) {
    return '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + n + '</span><span class="cs-title">' + title + '</span></div>' +
      '<div class="cs-formula">' + formula + '</div>' +
      '<div class="cs-calc">' + calc + '</div>' +
      '<div class="cs-result"><strong>' + result + '</strong></div></div>';
  }
  function openCalc() { $('calc-modal-body').innerHTML = buildCalc(); $('calc-modal').classList.add('active'); }
  function closeCalc() { $('calc-modal').classList.remove('active'); }
  $('btn-calc').addEventListener('click', function () { getAudio(); openCalc(); playClick(); });
  $('calc-modal-close').addEventListener('click', closeCalc);
  $('calc-modal').addEventListener('click', function (e) { if (e.target === this) closeCalc(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCalc(); });

  /* ================================================================
     LEARNING PANEL TOGGLES
     ================================================================ */
  $('learn-expand-all').addEventListener('click', function () { document.querySelectorAll('.learn-card').forEach(function (c) { c.open = true; }); });
  $('learn-collapse-all').addEventListener('click', function () { document.querySelectorAll('.learn-card').forEach(function (c) { c.open = false; }); });

  /* ================================================================
     EXPORT (CSV / PNG) + CONTEXT MENU
     ================================================================ */
  function exportCSV() {
    var rows = [['time_s', 'position_cm', 'flux_Wb', 'dPhi_dt_Wb_per_s', 'emf_V']];
    history.forEach(function (s) { rows.push([s.t.toFixed(3), s.x.toFixed(2), s.phi.toFixed(6), s.dphidt.toFixed(5), s.emf.toFixed(4)]); });
    if (rows.length < 2) {
      /* synthesise one full oscillation if no history yet */
      var w = simV / AMP;
      for (var ph = 0; ph <= 2 * Math.PI; ph += 0.05) {
        var x = AMP * Math.sin(ph), v = AMP * w * Math.cos(ph);
        var xm = x / 100, vms = v / 100;
        var phi = fluxAt(xm), dphidt = dPhiDx(xm) * vms, emf = -simN * dphidt;
        rows.push([(ph / w).toFixed(3), x.toFixed(2), phi.toFixed(6), dphidt.toFixed(5), emf.toFixed(4)]);
      }
    }
    var csv = rows.map(function (r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'faradays_law_data.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 100);
  }
  function exportPNG() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d');
    tc.drawImage(canvas, 0, 0);
    var fs = Math.round(tmp.width * 0.022); if (fs < 12) fs = 12;
    tc.font = '600 ' + fs + 'px "Segoe UI", system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.25)';
    tc.fillText('NHIT VisualLab', tmp.width - 14, tmp.height - 10);
    var a = document.createElement('a');
    a.href = tmp.toDataURL('image/png');
    a.download = 'faradays_law.png';
    a.click();
  }
  $('csv-btn').addEventListener('click', function () { exportCSV(); playClick(); });
  $('png-btn').addEventListener('click', function () { exportPNG(); playClick(); });

  var ctxMenu = $('ctx-menu');
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    ctxMenu.innerHTML =
      '<button data-act="png">Export PNG</button>' +
      '<button data-act="csv">Export CSV</button>' +
      '<button data-act="reset">Reset</button>';
    ctxMenu.style.left = e.clientX + 'px';
    ctxMenu.style.top = e.clientY + 'px';
    ctxMenu.classList.add('active');
  });
  ctxMenu.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'png') exportPNG(); else if (act === 'csv') exportCSV(); else if (act === 'reset') resetSim();
    ctxMenu.classList.remove('active');
  });
  document.addEventListener('click', function () { ctxMenu.classList.remove('active'); });
  document.addEventListener('scroll', function () { ctxMenu.classList.remove('active'); }, true);

  /* ================================================================
     KEYBOARD
     ================================================================ */
  document.addEventListener('keydown', function (e) {
    if (mode !== 'simulate') return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.code === 'Space') { e.preventDefault(); playBtn.click(); }
    else if (e.key === 'r' || e.key === 'R') { resetSim(); }
  });

  /* ================================================================
     INIT
     ================================================================ */
  syncInputs();
  setPlayLabel(false);
  computePhysics();
  updateReadouts();
  updateStatus();
  updateLearn();
  draw();
  startLoop();
})();
