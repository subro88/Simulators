(function () {
  'use strict';

  /* ================================================================
     DATA
     ================================================================ */

  var CONCEPTS = [
    /* ── Laws ──────────────────────────────────────────────────────── */
    { id: 'first-law', name: 'First Law of Thermodynamics', symbol: 'ΔU = Q − W',
      formula: 'ΔU = Q − W', unit: 'J', cat: 'laws',
      desc: 'The First Law of Thermodynamics is the conservation of energy applied to thermal systems. The change in internal energy (ΔU) of a closed system equals the heat added (Q) minus the work done by the system (W). For a cyclic process, ΔU = 0, so the net work equals the net heat transfer.',
      diagram: 'firstLaw',
      example: { problem: 'A gas absorbs 500 J of heat and does 200 J of work. What is the change in internal energy?', steps: ['ΔU = Q − W', 'ΔU = 500 − 200', 'ΔU = 300 J', 'Internal energy increases by 300 J'], answer: 300, unit: 'J' } },
    { id: 'second-law', name: 'Second Law of Thermodynamics', symbol: 'ΔS ≥ 0',
      formula: 'ΔS_universe ≥ 0 (entropy always increases)', unit: 'J/K', cat: 'laws',
      desc: 'The Second Law states that heat flows spontaneously from hot to cold, never the reverse without external work. It establishes that no heat engine can be 100% efficient. The Carnot efficiency η = 1 − T_C/T_H sets the upper limit for any engine operating between two temperatures.',
      diagram: 'secondLaw',
      example: { problem: 'An engine operates between 600 K and 300 K. What is the maximum possible efficiency?', steps: ['η_max = 1 − T_C/T_H', 'η_max = 1 − 300/600', 'η_max = 1 − 0.5', 'η_max = 0.5 = 50%'], answer: 50, unit: '%' } },
    { id: 'entropy', name: 'Entropy', symbol: 'S = Q/T',
      formula: 'ΔS = Q_rev / T', unit: 'J/K', cat: 'laws',
      desc: 'Entropy is a measure of disorder or the unavailability of energy to do work. For a reversible process, the entropy change equals heat transferred divided by absolute temperature. In any real (irreversible) process, entropy of the universe increases. Entropy is a state function — its change depends only on initial and final states.',
      diagram: 'entropy',
      example: { problem: 'A system absorbs 1200 J of heat reversibly at 400 K. What is the entropy change?', steps: ['ΔS = Q_rev / T', 'ΔS = 1200 / 400', 'ΔS = 3 J/K', 'Entropy increases by 3 J/K'], answer: 3, unit: 'J/K' } },
    { id: 'reversibility', name: 'Reversibility', symbol: 'Ideal vs Real',
      formula: 'η_real < η_Carnot (always)', unit: '—', cat: 'laws',
      desc: 'A reversible process can be reversed without leaving any change in the surroundings. All ideal thermodynamic cycles assume reversible processes. Real processes involve friction, heat transfer across finite temperature differences, and other irreversibilities that reduce efficiency. The Carnot cycle is fully reversible and sets the theoretical maximum efficiency.',
      diagram: 'reversibility',
      example: { problem: 'A real engine between 800 K and 300 K has 40% efficiency. What fraction of Carnot efficiency does it achieve?', steps: ['η_Carnot = 1 − 300/800 = 0.625 = 62.5%', 'η_real = 40%', 'Fraction = 40/62.5', 'Fraction = 0.64 = 64% of Carnot'], answer: 64, unit: '%' } },
    /* ── Cycles ─────────────────────────────────────────────────────── */
    { id: 'carnot-cycle', name: 'Carnot Cycle', symbol: 'η = 1−T_C/T_H',
      formula: 'η = 1 − T_C / T_H', unit: '%', cat: 'cycles',
      desc: 'The Carnot cycle is the most efficient thermodynamic cycle possible between two temperature reservoirs. It consists of four reversible processes: (1) isothermal expansion at T_H, (2) adiabatic expansion, (3) isothermal compression at T_C, and (4) adiabatic compression back to the initial state. No real engine can exceed the Carnot efficiency.',
      diagram: 'carnotCycle',
      example: { problem: 'A Carnot engine operates between T_H = 1000 K and T_C = 350 K. Find its efficiency.', steps: ['η = 1 − T_C/T_H', 'η = 1 − 350/1000', 'η = 1 − 0.35', 'η = 0.65 = 65%'], answer: 65, unit: '%' } },
    { id: 'otto-cycle', name: 'Otto Cycle', symbol: 'η = 1−1/r^(γ−1)',
      formula: 'η = 1 − 1/r^(γ−1)', unit: '%', cat: 'cycles',
      desc: 'The Otto cycle is the ideal cycle for spark-ignition (petrol/gasoline) internal combustion engines. It consists of: (1→2) adiabatic compression, (2→3) constant-volume heat addition (combustion), (3→4) adiabatic expansion (power stroke), and (4→1) constant-volume heat rejection (exhaust). Efficiency depends only on the compression ratio r and the heat capacity ratio γ.',
      diagram: 'ottoCycle',
      example: { problem: 'An Otto cycle has compression ratio r = 10, γ = 1.4. Find its efficiency.', steps: ['η = 1 − 1/r^(γ−1)', 'η = 1 − 1/10^0.4', '10^0.4 = 2.5119', 'η = 1 − 0.3981 = 60.19%'], answer: 60.19, unit: '%' } },
    { id: 'diesel-cycle', name: 'Diesel Cycle', symbol: 'η = 1−(rc^γ−1)/(γ(rc−1)r^(γ−1))',
      formula: 'η = 1 − (1/r^(γ−1)) × ((rc^γ − 1)/(γ(rc − 1)))', unit: '%', cat: 'cycles',
      desc: 'The Diesel cycle models compression-ignition engines. Fuel is injected into compressed hot air, so combustion occurs at approximately constant pressure rather than constant volume. The four processes are: (1→2) adiabatic compression, (2→3) constant-pressure heat addition, (3→4) adiabatic expansion, (4→1) constant-volume heat rejection. Efficiency depends on compression ratio, cutoff ratio, and γ.',
      diagram: 'dieselCycle',
      example: { problem: 'Diesel cycle: r = 18, cutoff ratio rc = 2.5, γ = 1.4. Find efficiency.', steps: ['η = 1 − (1/18^0.4) × ((2.5^1.4 − 1)/(1.4×(2.5−1)))', '18^0.4 = 3.1781, 2.5^1.4 = 3.6067', 'Numerator = 3.6067 − 1 = 2.6067', 'η = 1 − (0.3147)(2.6067/2.1) = 1 − 0.3906 = 60.94%'], answer: 60.94, unit: '%' } },
    { id: 'brayton-cycle', name: 'Brayton Cycle', symbol: 'η = 1−1/rp^((γ−1)/γ)',
      formula: 'η = 1 − 1/rp^((γ−1)/γ)', unit: '%', cat: 'cycles',
      desc: 'The Brayton cycle is the ideal cycle for gas turbines and jet engines. It operates as an open cycle in practice, but is modelled as a closed cycle with: (1→2) adiabatic compression, (2→3) constant-pressure heat addition (combustion), (3→4) adiabatic expansion (through turbine), (4→1) constant-pressure heat rejection. Efficiency depends on the pressure ratio rp.',
      diagram: 'braytonCycle',
      example: { problem: 'A Brayton cycle has pressure ratio rp = 12, γ = 1.4. Find efficiency.', steps: ['η = 1 − 1/rp^((γ−1)/γ)', 'η = 1 − 1/12^(0.4/1.4)', '12^(0.2857) = 2.0340', 'η = 1 − 0.4917 = 50.83%'], answer: 50.83, unit: '%' } },
    /* ── Applications ───────────────────────────────────────────────── */
    { id: 'heat-engine', name: 'Heat Engine', symbol: 'Q_H → W + Q_C',
      formula: 'W_net = Q_H − Q_C,  η = W/Q_H', unit: 'J', cat: 'applications',
      desc: 'A heat engine converts thermal energy into mechanical work. It absorbs heat Q_H from a hot reservoir, converts part to work W, and rejects the remainder Q_C to a cold reservoir. By the first law, W = Q_H − Q_C. Thermal efficiency is the fraction of absorbed heat that becomes useful work.',
      diagram: 'heatEngine',
      example: { problem: 'A heat engine absorbs 1000 kJ from a hot source and rejects 400 kJ. Find W and η.', steps: ['W = Q_H − Q_C = 1000 − 400', 'W = 600 kJ', 'η = W/Q_H = 600/1000', 'η = 0.60 = 60%'], answer: 60, unit: '%' } },
    { id: 'refrigerator', name: 'Refrigerator & COP', symbol: 'COP = Q_C/W',
      formula: 'COP_ref = Q_C / W = T_C / (T_H − T_C)', unit: '—', cat: 'applications',
      desc: 'A refrigerator is a reversed heat engine that uses work to transfer heat from a cold space to a hot space. The Coefficient of Performance (COP) measures how effectively it does this. For a Carnot refrigerator, COP = T_C / (T_H − T_C). A higher COP means more cooling per unit of work input.',
      diagram: 'refrigerator',
      example: { problem: 'A Carnot refrigerator operates between 250 K (cold) and 310 K (hot). Find the COP.', steps: ['COP = T_C / (T_H − T_C)', 'COP = 250 / (310 − 250)', 'COP = 250 / 60', 'COP = 4.17'], answer: 4.17, unit: '' } },
    { id: 'compression-ratio', name: 'Compression Ratio', symbol: 'r = V₁/V₂',
      formula: 'r = V_max / V_min = V_1 / V_2', unit: '—', cat: 'applications',
      desc: 'The compression ratio is the ratio of the maximum volume to the minimum volume in a cylinder. For Otto and Diesel cycles, higher compression ratios lead to higher thermal efficiency. Typical values are 8–12 for petrol engines and 14–22 for diesel engines. The compression ratio is limited by engine knock in spark-ignition engines.',
      diagram: 'compressionRatio',
      example: { problem: 'A cylinder has V_max = 600 cm³ and V_min = 75 cm³. Find the compression ratio.', steps: ['r = V_max / V_min', 'r = 600 / 75', 'r = 8', 'Compression ratio is 8:1'], answer: 8, unit: '' } },
    { id: 'thermal-efficiency', name: 'Thermal Efficiency', symbol: 'η = W/Q_H',
      formula: 'η = W_net / Q_in = 1 − Q_out / Q_in', unit: '%', cat: 'applications',
      desc: 'Thermal efficiency is the ratio of net work output to heat input. It measures how well a cycle converts thermal energy to useful work. Thermal efficiency is always less than 100% due to the Second Law. The maximum possible efficiency is the Carnot efficiency, which depends only on the reservoir temperatures.',
      diagram: 'thermalEff',
      example: { problem: 'An engine produces 250 kJ of work from 600 kJ of heat input. Find the efficiency and Q_out.', steps: ['η = W/Q_in = 250/600', 'η = 0.4167 = 41.67%', 'Q_out = Q_in − W = 600 − 250', 'Q_out = 350 kJ'], answer: 41.67, unit: '%' } }
  ];

  var PROBLEM_GEN = [
    function () { var th = randInt(500, 1500); var tc = randInt(200, Math.min(th - 50, 500)); var eff = +((1 - tc / th) * 100).toFixed(2);
      return { prompt: 'A Carnot engine operates between T_H = ' + th + ' K and T_C = ' + tc + ' K. Calculate the thermal efficiency (η) in %.', steps: ['η = 1 − T_C/T_H', 'η = 1 − ' + tc + '/' + th, 'η = 1 − ' + (tc / th).toFixed(4), 'η = ' + eff + '%'], answer: eff, unit: '%', tol: 0.5 }; },
    function () { var r = randInt(6, 14); var g = 1.4; var eff = +((1 - 1 / Math.pow(r, g - 1)) * 100).toFixed(2);
      return { prompt: 'An Otto cycle has compression ratio r = ' + r + ' (γ = 1.4). Calculate the efficiency in %.', steps: ['η = 1 − 1/r^(γ−1)', 'η = 1 − 1/' + r + '^0.4', r + '^0.4 = ' + Math.pow(r, 0.4).toFixed(4), 'η = ' + eff + '%'], answer: eff, unit: '%', tol: 0.5 }; },
    function () { var r = randInt(14, 22); var rc = +(1.5 + Math.random() * 2.5).toFixed(1); var g = 1.4;
      var term = (1 / Math.pow(r, g - 1)) * ((Math.pow(rc, g) - 1) / (g * (rc - 1))); var eff = +((1 - term) * 100).toFixed(2);
      return { prompt: 'A Diesel cycle: r = ' + r + ', cutoff ratio rc = ' + rc + ', γ = 1.4. Find efficiency (η) in %.', steps: ['η = 1 − (1/r^(γ−1))((rc^γ − 1)/(γ(rc−1)))', '1/' + r + '^0.4 = ' + (1 / Math.pow(r, 0.4)).toFixed(4), 'rc^γ = ' + rc + '^1.4 = ' + Math.pow(rc, 1.4).toFixed(4), 'η = ' + eff + '%'], answer: eff, unit: '%', tol: 0.5 }; },
    function () { var qin = randInt(200, 2000); var eff = randInt(25, 65); var w = +(qin * eff / 100).toFixed(1);
      return { prompt: 'A heat engine has Q_in = ' + qin + ' kJ and efficiency η = ' + eff + '%. Calculate W_net in kJ.', steps: ['W = η × Q_in', 'W = ' + (eff / 100).toFixed(2) + ' × ' + qin, 'W = ' + w + ' kJ', ''], answer: w, unit: 'kJ', tol: 1 }; },
    function () { var qin = randInt(300, 2000); var eff = randInt(20, 60); var qout = +(qin * (1 - eff / 100)).toFixed(1);
      return { prompt: 'An engine absorbs Q_in = ' + qin + ' kJ with η = ' + eff + '%. How much heat is rejected (Q_out) in kJ?', steps: ['Q_out = Q_in(1 − η)', 'Q_out = ' + qin + ' × (1 − ' + (eff / 100).toFixed(2) + ')', 'Q_out = ' + qin + ' × ' + (1 - eff / 100).toFixed(2), 'Q_out = ' + qout + ' kJ'], answer: qout, unit: 'kJ', tol: 1 }; },
    function () { var tc = randInt(240, 280); var th = randInt(300, 340); var cop = +(tc / (th - tc)).toFixed(2);
      return { prompt: 'A Carnot refrigerator: T_C = ' + tc + ' K, T_H = ' + th + ' K. Calculate the COP.', steps: ['COP = T_C / (T_H − T_C)', 'COP = ' + tc + ' / (' + th + ' − ' + tc + ')', 'COP = ' + tc + ' / ' + (th - tc), 'COP = ' + cop], answer: cop, unit: '', tol: 0.05 }; },
    function () { var tc = randInt(260, 285); var th = randInt(300, 340); var cop = +(th / (th - tc)).toFixed(2);
      return { prompt: 'A Carnot heat pump: T_C = ' + tc + ' K, T_H = ' + th + ' K. Calculate the COP for heating.', steps: ['COP_HP = T_H / (T_H − T_C)', 'COP_HP = ' + th + ' / (' + th + ' − ' + tc + ')', 'COP_HP = ' + th + ' / ' + (th - tc), 'COP_HP = ' + cop], answer: cop, unit: '', tol: 0.05 }; },
    function () { var v2 = randInt(40, 100); var r = randInt(6, 18); var v1 = v2 * r;
      return { prompt: 'A cylinder has V_max = ' + v1 + ' cm³ and V_min = ' + v2 + ' cm³. Calculate the compression ratio.', steps: ['r = V_max / V_min', 'r = ' + v1 + ' / ' + v2, 'r = ' + r, ''], answer: r, unit: '', tol: 0.01 }; },
    function () { var p1 = randInt(90, 110); var rp = randInt(5, 15); var p2 = p1 * rp;
      return { prompt: 'Compressor inlet P₁ = ' + p1 + ' kPa, outlet P₂ = ' + p2 + ' kPa. Find the pressure ratio.', steps: ['rp = P₂ / P₁', 'rp = ' + p2 + ' / ' + p1, 'rp = ' + rp, ''], answer: rp, unit: '', tol: 0.01 }; },
    function () { var qin = randInt(500, 1500); var qout = randInt(100, qin - 100); var w = qin - qout;
      return { prompt: 'A cycle absorbs Q_in = ' + qin + ' kJ and rejects Q_out = ' + qout + ' kJ. Find W_net in kJ.', steps: ['For a cycle: ΔU = 0', 'W_net = Q_in − Q_out', 'W_net = ' + qin + ' − ' + qout, 'W_net = ' + w + ' kJ'], answer: w, unit: 'kJ', tol: 0.5 }; },
    function () { var q = randInt(200, 2000); var t = randInt(250, 800); var ds = +(q / t).toFixed(2);
      return { prompt: 'A system absorbs ' + q + ' J of heat reversibly at ' + t + ' K. Find the entropy change ΔS in J/K.', steps: ['ΔS = Q / T', 'ΔS = ' + q + ' / ' + t, 'ΔS = ' + ds + ' J/K', ''], answer: ds, unit: 'J/K', tol: 0.05 }; },
    function () { var rp = randInt(4, 15); var g = 1.4; var eff = +((1 - 1 / Math.pow(rp, (g - 1) / g)) * 100).toFixed(2);
      return { prompt: 'A Brayton cycle has pressure ratio rp = ' + rp + ' (γ = 1.4). Calculate efficiency in %.', steps: ['η = 1 − 1/rp^((γ−1)/γ)', 'η = 1 − 1/' + rp + '^(0.2857)', rp + '^0.2857 = ' + Math.pow(rp, (g - 1) / g).toFixed(4), 'η = ' + eff + '%'], answer: eff, unit: '%', tol: 0.5 }; }
  ];

  var QUIZ_POOL = [
    { q: 'Which cycle has the highest possible efficiency between two given temperatures?', opts: ['Otto', 'Diesel', 'Carnot', 'Brayton'], ans: 2 },
    { q: 'In an Otto cycle, heat is added at constant:', opts: ['Pressure', 'Volume', 'Temperature', 'Entropy'], ans: 1 },
    { q: 'The Brayton cycle is the ideal model for:', opts: ['Petrol engines', 'Diesel engines', 'Gas turbines & jets', 'Steam turbines'], ans: 2 },
    { q: 'What does the enclosed area on a PV diagram represent?', opts: ['Heat input', 'Heat output', 'Net work', 'Internal energy'], ans: 2 },
    { q: 'In a Diesel cycle, heat is added at constant:', opts: ['Volume', 'Pressure', 'Temperature', 'Entropy'], ans: 1 },
    { q: 'The Carnot cycle consists of:', opts: ['2 adiabats + 2 const-V', '2 isotherms + 2 adiabats', '2 isotherms + 2 const-P', '4 adiabats'], ans: 1 },
    { q: 'Increasing compression ratio in an Otto cycle will:', opts: ['Decrease efficiency', 'Increase efficiency', 'Have no effect', 'Decrease work output'], ans: 1 },
    { q: 'The Second Law implies that thermal efficiency is always:', opts: ['Equal to 100%', 'Greater than Carnot', 'Less than 100%', 'Exactly 50%'], ans: 2 },
    { q: 'COP of a Carnot refrigerator equals:', opts: ['T_H/T_C', 'T_C/(T_H−T_C)', '1−T_C/T_H', 'W/Q_H'], ans: 1 },
    { q: 'An adiabatic process means:', opts: ['No work done', 'No pressure change', 'No heat transfer', 'No temperature change'], ans: 2 },
    { q: 'Carnot engine: T_H=900 K, T_C=300 K. Efficiency (%) =', type: 'numeric', ans: 66.67, tol: 0.5, unit: '%' },
    { q: 'Otto cycle: r=8, γ=1.4. Efficiency (%) =', type: 'numeric', ans: 56.47, tol: 0.5, unit: '%' },
    { q: 'Heat engine: Q_in=800 kJ, Q_out=320 kJ. W_net (kJ) =', type: 'numeric', ans: 480, tol: 1, unit: 'kJ' },
    { q: 'Brayton cycle: rp=10, γ=1.4. Efficiency (%) =', type: 'numeric', ans: 48.22, tol: 0.5, unit: '%' },
    { q: 'Carnot refrigerator: T_C=270 K, T_H=330 K. COP =', type: 'numeric', ans: 4.5, tol: 0.1, unit: '' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */
  var $ = function (id) { return document.getElementById(id); };
  var cvs = $('sim-canvas');
  var ctx = cvs.getContext('2d');
  var tsCvs = $('ts-canvas'); var tsCtx = tsCvs.getContext('2d');

  /* Logical canvas dimensions (in CSS pixels). Actual drawing buffer is DPR-scaled. */
  var W = 900, H = 480;
  var dpr = 1;

  var modeTabs = $('mode-tabs');
  var unitTabs = $('unit-tabs');
  var cycleTabs = $('cycle-tabs');
  var simPanel = $('sim-panel');
  var catRow = $('cat-row');
  var catTabs = $('cat-tabs');
  var itemSelector = $('item-selector');
  var conceptGrid = $('concept-grid');
  var itemInfo = $('item-info');
  var practicePanel = $('practice-panel');
  var practiceBar = $('practice-bar');
  var quizPanel = $('quiz-panel');
  var quizBar = $('quiz-bar');
  var quizResult = $('quiz-result');

  var slThot = $('sl-thot'), numThot = $('num-thot');
  var slTcold = $('sl-tcold'), numTcold = $('num-tcold');
  var slCR = $('sl-cr'), numCR = $('num-cr');
  var slPR = $('sl-pr'), numPR = $('num-pr');
  var slRC = $('sl-rc'), numRC = $('num-rc');
  var grpCR = $('grp-cr'), grpPR = $('grp-pr'), grpRC = $('grp-rc'), grpThot = $('grp-thot');
  var chkLabels = $('chk-labels'), chkEnergy = $('chk-energy'),
      chkStates = $('chk-states'), chkEq = $('chk-eq');
  var btnPlay = $('btn-play'), btnReset = $('btn-reset');
  var slSpeed = $('sl-speed'), valSpeed = $('val-speed');
  var btnCSV = $('btn-csv'), btnPNG = $('btn-png');
  var btnCalc = $('btn-calc');
  var calcModal = $('calc-modal'), calcModalBody = $('calc-modal-body'), calcModalClose = $('calc-modal-close');
  var ctxMenu = $('ctx-menu');

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var units = 'si';                       // 'si' | 'imp'
  var cycleType = 'carnot';
  var Thot = 800, Tcold = 300;
  var compressionRatio = 8, pressureRatio = 8, cutoffRatio = 2.5;
  var gamma = 1.4;
  var phase = 0, phaseProgress = 0;
  var showLabels = true, showEnergy = true, showStates = true, showEq = true;
  var animRunning = true;
  var animSpeed = 0.5;
  var exploreCat = 'laws', exploreItem = null;
  var pCorrect = 0, pTotal = 0, currentProblem = null, pAnswered = false;
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizAnswers = [], quizLocked = false;
  var _learnCache = { eq: '', st: '', co: '' };

  /* Graphics state: trail + particles + crank angle */
  var pvTrail = [];
  var crankAngle = -Math.PI / 2;     // start at top dead centre
  var flywheelAngle = 0;
  var particles = [];
  var sparks = [];                    // combustion sparks
  function initParticles() {
    particles = [];
    for (var i = 0; i < 18; i++) {
      particles.push({
        x: 0.1 + Math.random() * 0.8,
        y: 0.1 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02
      });
    }
  }
  initParticles();

  /* ================================================================
     HELPERS
     ================================================================ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = randInt(0, i); var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; } return arr; }
  function isImp() { return units === 'imp'; }
  function K_to_F(K) { return (K - 273.15) * 9 / 5 + 32; }
  function kJ_to_BTU(kJ) { return kJ * 0.9478171; }
  function Pa_to_psi(Pa) { return Pa * 1.4503774e-4; }
  function m3_to_ft3(m3) { return m3 * 35.31467; }
  /* Axis captions for the P–V plot. The plot is normalised between
     Pmin/Pmax so only the captions and the state readouts change. */
  function uVol() { return isImp() ? 'ft\u00b3' : 'm\u00b3'; }
  function uPress() { return isImp() ? 'psi' : 'Pa'; }
  function fmt(v, d) { d = d == null ? 2 : d; if (!isFinite(v)) return '—'; return v.toFixed(d); }

  /* ================================================================
     DPR-AWARE RESIZE
     ================================================================ */
  function resizeCanvas() {
    var rect = cvs.getBoundingClientRect();
    if (!rect.width) return;
    dpr = window.devicePixelRatio || 1;
    var cssW = Math.min(rect.width, 900);
    var cssH = cssW * (H / 900);                // maintain 900:480 aspect (=1.875)
    cvs.style.height = cssH + 'px';
    cvs.width = Math.round(cssW * dpr);
    cvs.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr * (cssW / 900), 0, 0, dpr * (cssH / 480), 0, 0);
    // ts canvas
    if (tsCvs && tsCvs.parentNode) {
      var rect2 = tsCvs.getBoundingClientRect();
      if (rect2.width) {
        var tw = Math.min(rect2.width, 800);
        var th = tw * (320 / 800);
        tsCvs.style.height = th + 'px';
        tsCvs.width = Math.round(tw * dpr);
        tsCvs.height = Math.round(th * dpr);
        tsCtx.setTransform(dpr * (tw / 800), 0, 0, dpr * (th / 320), 0, 0);
      }
    }
    render();
    drawTSDiagram();
  }
  if (window.ResizeObserver) {
    new ResizeObserver(resizeCanvas).observe(cvs);
  } else {
    window.addEventListener('resize', resizeCanvas);
  }

  /* ================================================================
     CYCLE STATES & EFFICIENCY
     ================================================================ */
  var R = 8.314, n = 1;

  function getCarnotStates() {
    var V1 = 0.01;
    var P1 = n * R * Thot / V1;
    var V2 = V1 * compressionRatio;
    var P2 = n * R * Thot / V2;
    var V3 = V2 * Math.pow(Thot / Tcold, 1 / (gamma - 1));
    var P3 = n * R * Tcold / V3;
    var V4 = V1 * Math.pow(Thot / Tcold, 1 / (gamma - 1));
    var P4 = n * R * Tcold / V4;
    return [{ P: P1, V: V1, T: Thot }, { P: P2, V: V2, T: Thot }, { P: P3, V: V3, T: Tcold }, { P: P4, V: V4, T: Tcold }];
  }
  function getOttoStates() {
    var V1 = 0.06, P1 = 101325, T1 = Tcold;
    var V2 = V1 / compressionRatio;
    var T2 = T1 * Math.pow(compressionRatio, gamma - 1);
    var P2 = P1 * Math.pow(compressionRatio, gamma);
    var T3 = Thot;
    var P3 = P2 * (T3 / T2), V3 = V2;
    var T4 = T3 * Math.pow(1 / compressionRatio, gamma - 1);
    var P4 = P3 * Math.pow(1 / compressionRatio, gamma), V4 = V1;
    return [{ P: P1, V: V1, T: T1 }, { P: P2, V: V2, T: T2 }, { P: P3, V: V3, T: T3 }, { P: P4, V: V4, T: T4 }];
  }
  function getDieselStates() {
    var V1 = 0.06, P1 = 101325, T1 = Tcold;
    var V2 = V1 / compressionRatio;
    var T2 = T1 * Math.pow(compressionRatio, gamma - 1);
    var P2 = P1 * Math.pow(compressionRatio, gamma);
    var V3 = V2 * cutoffRatio, T3 = T2 * cutoffRatio, P3 = P2;
    var V4 = V1;
    var T4 = T3 * Math.pow(V3 / V4, gamma - 1);
    var P4 = P3 * Math.pow(V3 / V4, gamma);
    return [{ P: P1, V: V1, T: T1 }, { P: P2, V: V2, T: T2 }, { P: P3, V: V3, T: T3 }, { P: P4, V: V4, T: T4 }];
  }
  function getBraytonStates() {
    var P1 = 101325, T1 = Tcold;
    var V1 = n * R * T1 / P1;
    var P2 = P1 * pressureRatio;
    var T2 = T1 * Math.pow(pressureRatio, (gamma - 1) / gamma);
    var V2 = n * R * T2 / P2;
    var T3 = Thot, P3 = P2;
    var V3 = n * R * T3 / P3;
    var P4 = P1;
    var T4 = T3 * Math.pow(P4 / P3, (gamma - 1) / gamma);
    var V4 = n * R * T4 / P4;
    return [{ P: P1, V: V1, T: T1 }, { P: P2, V: V2, T: T2 }, { P: P3, V: V3, T: T3 }, { P: P4, V: V4, T: T4 }];
  }
  function getCycleStates() {
    if (cycleType === 'carnot') return getCarnotStates();
    if (cycleType === 'otto') return getOttoStates();
    if (cycleType === 'diesel') return getDieselStates();
    return getBraytonStates();
  }
  function getEfficiency() {
    if (cycleType === 'carnot') return 1 - Tcold / Thot;
    if (cycleType === 'otto') return 1 - 1 / Math.pow(compressionRatio, gamma - 1);
    if (cycleType === 'diesel') {
      var rc = cutoffRatio;
      if (Math.abs(rc - 1) < 1e-9) return 1 - 1 / Math.pow(compressionRatio, gamma - 1);
      return 1 - (1 / Math.pow(compressionRatio, gamma - 1)) * ((Math.pow(rc, gamma) - 1) / (gamma * (rc - 1)));
    }
    return 1 - 1 / Math.pow(pressureRatio, (gamma - 1) / gamma);
  }

  function processPoints(s1, s2, processType, steps) {
    var pts = []; steps = steps || 60;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, P, V;
      if (processType === 'isothermal') { V = lerp(s1.V, s2.V, t); P = s1.P * s1.V / V; }
      else if (processType === 'adiabatic') { V = lerp(s1.V, s2.V, t); P = s1.P * Math.pow(s1.V / V, gamma); }
      else if (processType === 'const-v') { V = s1.V; P = lerp(s1.P, s2.P, t); }
      else { P = s1.P; V = lerp(s1.V, s2.V, t); }
      pts.push({ P: P, V: V });
    }
    return pts;
  }
  function getCycleProcesses(states) {
    var s = states;
    if (cycleType === 'carnot') return [
      { pts: processPoints(s[0], s[1], 'isothermal'), type: 'isothermal', label: '1→2 Isothermal Exp.' },
      { pts: processPoints(s[1], s[2], 'adiabatic'), type: 'adiabatic', label: '2→3 Adiabatic Exp.' },
      { pts: processPoints(s[2], s[3], 'isothermal'), type: 'isothermal', label: '3→4 Isothermal Comp.' },
      { pts: processPoints(s[3], s[0], 'adiabatic'), type: 'adiabatic', label: '4→1 Adiabatic Comp.' }];
    if (cycleType === 'otto') return [
      { pts: processPoints(s[0], s[1], 'adiabatic'), type: 'adiabatic', label: '1→2 Adiabatic Comp.' },
      { pts: processPoints(s[1], s[2], 'const-v'), type: 'const-v', label: '2→3 Const-V Heat Add.' },
      { pts: processPoints(s[2], s[3], 'adiabatic'), type: 'adiabatic', label: '3→4 Adiabatic Exp.' },
      { pts: processPoints(s[3], s[0], 'const-v'), type: 'const-v', label: '4→1 Const-V Heat Rej.' }];
    if (cycleType === 'diesel') return [
      { pts: processPoints(s[0], s[1], 'adiabatic'), type: 'adiabatic', label: '1→2 Adiabatic Comp.' },
      { pts: processPoints(s[1], s[2], 'const-p'), type: 'const-p', label: '2→3 Const-P Heat Add.' },
      { pts: processPoints(s[2], s[3], 'adiabatic'), type: 'adiabatic', label: '3→4 Adiabatic Exp.' },
      { pts: processPoints(s[3], s[0], 'const-v'), type: 'const-v', label: '4→1 Const-V Heat Rej.' }];
    return [
      { pts: processPoints(s[0], s[1], 'adiabatic'), type: 'adiabatic', label: '1→2 Adiabatic Comp.' },
      { pts: processPoints(s[1], s[2], 'const-p'), type: 'const-p', label: '2→3 Const-P Heat Add.' },
      { pts: processPoints(s[2], s[3], 'adiabatic'), type: 'adiabatic', label: '3→4 Adiabatic Exp.' },
      { pts: processPoints(s[3], s[0], 'const-p'), type: 'const-p', label: '4→1 Const-P Heat Rej.' }];
  }

  /* ================================================================
     DRAWING — PV DIAGRAM
     ================================================================ */
  var PV_L = 30, PV_T = 30, PV_W = 500, PV_H = 420;
  var processColors = { 'isothermal': '#ff5555', 'adiabatic': '#42a5f5', 'const-v': '#3ddc84', 'const-p': '#f5c842' };

  function pvToCanvas(P, V, Pmin, Pmax, Vmin, Vmax) {
    var x = PV_L + 50 + ((V - Vmin) / (Vmax - Vmin)) * (PV_W - 70);
    var y = PV_T + PV_H - 40 - ((P - Pmin) / (Pmax - Pmin)) * (PV_H - 60);
    return { x: x, y: y };
  }

  function drawAxes(Pmin, Pmax, Vmin, Vmax) {
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(PV_L + 45, PV_T + PV_H - 35); ctx.lineTo(PV_L + PV_W - 10, PV_T + PV_H - 35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PV_L + 45, PV_T + PV_H - 35); ctx.lineTo(PV_L + 45, PV_T + 10); ctx.stroke();
    ctx.fillStyle = '#4a5578';
    ctx.beginPath(); ctx.moveTo(PV_L + PV_W - 10, PV_T + PV_H - 35); ctx.lineTo(PV_L + PV_W - 18, PV_T + PV_H - 40); ctx.lineTo(PV_L + PV_W - 18, PV_T + PV_H - 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(PV_L + 45, PV_T + 10); ctx.lineTo(PV_L + 40, PV_T + 18); ctx.lineTo(PV_L + 50, PV_T + 18); ctx.fill();
    ctx.font = 'bold 13px Segoe UI, sans-serif'; ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('V (' + uVol() + ')', PV_L + PV_W / 2, PV_T + PV_H - 5);
    ctx.save(); ctx.translate(PV_L + 10, PV_T + PV_H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('P (' + uPress() + ')', 0, 0); ctx.restore();
    ctx.strokeStyle = 'rgba(42,48,80,0.5)'; ctx.lineWidth = 0.5;
    for (var i = 1; i <= 4; i++) {
      var gy = PV_T + PV_H - 35 - i * (PV_H - 60) / 4;
      ctx.beginPath(); ctx.moveTo(PV_L + 46, gy); ctx.lineTo(PV_L + PV_W - 15, gy); ctx.stroke();
      var gx = PV_L + 50 + i * (PV_W - 70) / 4;
      ctx.beginPath(); ctx.moveTo(gx, PV_T + PV_H - 36); ctx.lineTo(gx, PV_T + 15); ctx.stroke();
    }
    ctx.font = '10px Courier New, monospace'; ctx.fillStyle = '#4a5578'; ctx.textAlign = 'right';
    for (var j = 0; j <= 4; j++) {
      var pVal = Pmin + j * (Pmax - Pmin) / 4;
      var ty = PV_T + PV_H - 35 - j * (PV_H - 60) / 4;
      var pLabel = pVal >= 1e6 ? (pVal / 1e6).toFixed(1) + 'M' : pVal >= 1e3 ? (pVal / 1e3).toFixed(0) + 'k' : pVal.toFixed(0);
      ctx.fillText(pLabel, PV_L + 42, ty + 4);
    }
    ctx.textAlign = 'center';
    for (var k = 0; k <= 4; k++) {
      var vVal = Vmin + k * (Vmax - Vmin) / 4;
      var tx = PV_L + 50 + k * (PV_W - 70) / 4;
      ctx.fillText(vVal.toFixed(3), tx, PV_T + PV_H - 20);
    }
  }

  function drawCycle(states, processes, Pmin, Pmax, Vmin, Vmax) {
    // Gradient fill for the work area
    var allPts = [];
    for (var p = 0; p < processes.length; p++) for (var i = 0; i < processes[p].pts.length; i++) allPts.push(processes[p].pts[i]);
    if (allPts.length > 0) {
      var grad = ctx.createLinearGradient(0, PV_T + 10, 0, PV_T + PV_H - 35);
      grad.addColorStop(0, 'rgba(255,85,85,0.42)');     // hot top
      grad.addColorStop(0.55, 'rgba(236,64,122,0.32)');
      grad.addColorStop(1, 'rgba(66,165,245,0.22)');    // cold bottom
      ctx.fillStyle = grad;
      ctx.beginPath();
      var first = pvToCanvas(allPts[0].P, allPts[0].V, Pmin, Pmax, Vmin, Vmax);
      ctx.moveTo(first.x, first.y);
      for (var a = 1; a < allPts.length; a++) {
        var c = pvToCanvas(allPts[a].P, allPts[a].V, Pmin, Pmax, Vmin, Vmax);
        ctx.lineTo(c.x, c.y);
      }
      ctx.closePath(); ctx.fill();
      // outline of work region
      ctx.strokeStyle = 'rgba(245,200,66,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (var pi = 0; pi < processes.length; pi++) {
      var proc = processes[pi], color = processColors[proc.type];
      var isCurrent = (pi === phase) && (mode === 'simulate');
      // Soft glow under each line
      if (isCurrent) {
        ctx.shadowColor = color; ctx.shadowBlur = 12;
        ctx.lineWidth = 4.5;
      } else {
        ctx.shadowBlur = 0;
        ctx.lineWidth = 2.5;
      }
      ctx.strokeStyle = color; ctx.beginPath();
      for (var j = 0; j < proc.pts.length; j++) {
        var cp = pvToCanvas(proc.pts[j].P, proc.pts[j].V, Pmin, Pmax, Vmin, Vmax);
        if (j === 0) ctx.moveTo(cp.x, cp.y); else ctx.lineTo(cp.x, cp.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      var mid = Math.floor(proc.pts.length / 2);
      var m1 = pvToCanvas(proc.pts[mid].P, proc.pts[mid].V, Pmin, Pmax, Vmin, Vmax);
      var m2idx = Math.min(mid + 3, proc.pts.length - 1);
      var m2 = pvToCanvas(proc.pts[m2idx].P, proc.pts[m2idx].V, Pmin, Pmax, Vmin, Vmax);
      var angle = Math.atan2(m2.y - m1.y, m2.x - m1.x);
      ctx.fillStyle = color; ctx.beginPath();
      ctx.moveTo(m1.x + 8 * Math.cos(angle), m1.y + 8 * Math.sin(angle));
      ctx.lineTo(m1.x + 8 * Math.cos(angle + 2.5), m1.y + 8 * Math.sin(angle + 2.5));
      ctx.lineTo(m1.x + 8 * Math.cos(angle - 2.5), m1.y + 8 * Math.sin(angle - 2.5));
      ctx.closePath(); ctx.fill();
      if (showLabels) {
        var lp = pvToCanvas(proc.pts[Math.floor(proc.pts.length * 0.35)].P, proc.pts[Math.floor(proc.pts.length * 0.35)].V, Pmin, Pmax, Vmin, Vmax);
        ctx.font = 'bold 9px Segoe UI, sans-serif'; ctx.fillStyle = color; ctx.textAlign = 'center';
        ctx.fillText(proc.label, lp.x, lp.y + (pi < 2 ? -12 : 16));
      }
    }
    var stateLabels = ['1', '2', '3', '4'];
    for (var si = 0; si < states.length; si++) {
      var sp = pvToCanvas(states[si].P, states[si].V, Pmin, Pmax, Vmin, Vmax);
      // Glow halo
      var hg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 14);
      hg.addColorStop(0, 'rgba(245,200,66,0.55)');
      hg.addColorStop(1, 'rgba(245,200,66,0)');
      ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(sp.x, sp.y, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ec407a'; ctx.beginPath(); ctx.arc(sp.x, sp.y, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.font = 'bold 12px Courier New, monospace'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText(stateLabels[si], sp.x + (si < 2 ? -10 : 10), sp.y + (si < 2 ? -10 : 14));
      // E3 — state values on canvas
      if (showStates) {
        var P = states[si].P, V = states[si].V, T = states[si].T;
        var tStr = isImp() ? fmt(K_to_F(T), 0) + '°F' : fmt(T, 0) + 'K';
        var pStr = isImp()
          ? fmt(Pa_to_psi(P), 1) + 'psi'
          : (P >= 1e6 ? fmt(P / 1e6, 2) + 'MPa' : fmt(P / 1e3, 0) + 'kPa');
        var vStr = isImp()
          ? fmt(m3_to_ft3(V) * 1728, 1) + 'in\u00b3'   /* ft³ → in³, readable at cylinder scale */
          : fmt(V * 1000, 2) + 'L';
        ctx.font = '9px Courier New, monospace';
        ctx.fillStyle = 'rgba(245,200,66,0.95)';
        ctx.textAlign = si < 2 ? 'right' : 'left';
        var lx = sp.x + (si < 2 ? -14 : 14);
        var ly = sp.y + (si === 1 || si === 2 ? -4 : 18);
        ctx.fillText('T=' + tStr, lx, ly);
        ctx.fillText('P=' + pStr, lx, ly + 11);
        ctx.fillText('V=' + vStr, lx, ly + 22);
      }
    }
    var eff = getEfficiency();
    ctx.font = 'bold 18px Segoe UI, sans-serif'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'left';
    ctx.fillText('η = ' + (eff * 100).toFixed(1) + '%', PV_L + 60, PV_T + 30);

    if (showEq) drawEquation(eff);

    if (showLabels) {
      var qinProc = cycleType === 'carnot' ? 0 : 1;
      var qinPt = pvToCanvas(processes[qinProc].pts[Math.floor(processes[qinProc].pts.length * 0.6)].P, processes[qinProc].pts[Math.floor(processes[qinProc].pts.length * 0.6)].V, Pmin, Pmax, Vmin, Vmax);
      ctx.font = 'bold 11px Segoe UI, sans-serif'; ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
      ctx.fillText('Qₕ', qinPt.x + 15, qinPt.y - 18);
      var qoutProc = cycleType === 'carnot' ? 2 : 3;
      var qoutPt = pvToCanvas(processes[qoutProc].pts[Math.floor(processes[qoutProc].pts.length * 0.5)].P, processes[qoutProc].pts[Math.floor(processes[qoutProc].pts.length * 0.5)].V, Pmin, Pmax, Vmin, Vmax);
      ctx.fillStyle = '#42a5f5'; ctx.fillText('Qₗ', qoutPt.x - 15, qoutPt.y + 20);
    }
  }

  /* §8-3 — Classical equation overlay on canvas with live values */
  function drawEquation(eff) {
    var eq, vals;
    if (cycleType === 'carnot') {
      eq = 'η = 1 − Tₜ / Tₕ';
      vals = '= 1 − ' + Tcold + '/' + Thot + ' = ' + (eff * 100).toFixed(1) + '%';
    } else if (cycleType === 'otto') {
      eq = 'η = 1 − 1/r^(γ−1)';
      vals = '= 1 − 1/' + compressionRatio.toFixed(1) + '^0.4 = ' + (eff * 100).toFixed(1) + '%';
    } else if (cycleType === 'diesel') {
      eq = 'η = 1 − (rₜ^γ − 1) / [γ(rₜ−1)·r^(γ−1)]';
      vals = '= ' + (eff * 100).toFixed(1) + '%  (r=' + compressionRatio.toFixed(1) + ', rₜ=' + cutoffRatio.toFixed(1) + ')';
    } else {
      eq = 'η = 1 − 1/rₚ^((γ−1)/γ)';
      vals = '= 1 − 1/' + pressureRatio.toFixed(1) + '^0.286 = ' + (eff * 100).toFixed(1) + '%';
    }
    /* Anchor in PV cycle's lower-right corner where most cycles have empty space */
    var ex = PV_L + PV_W - 230, ey = PV_T + 50;
    // background pill
    ctx.fillStyle = 'rgba(13,17,30,0.78)';
    ctx.fillRect(ex - 8, ey - 14, 230, 36);
    ctx.strokeStyle = 'rgba(245,200,66,0.35)'; ctx.lineWidth = 1;
    ctx.strokeRect(ex - 8, ey - 14, 230, 36);
    ctx.font = 'italic bold 12px Times New Roman, serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'left';
    ctx.fillText(eq, ex, ey);
    ctx.font = '11px Courier New, monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText(vals, ex, ey + 14);
  }

  /* ================================================================
     DRAWING — PISTON
     ================================================================ */
  var PIST_L = 580, PIST_T = 50, PIST_W = 280, PIST_H = 380;

  function drawPiston() {
    var cx = PIST_L + PIST_W / 2, cylW = 120, cylH = 230;
    var cylL = cx - cylW / 2, cylT = PIST_T + 30;
    ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillStyle = '#90caf9'; ctx.textAlign = 'center';
    ctx.fillText('Piston · Crank · Flywheel', cx, PIST_T + 12);

    /* Cylinder body with metallic gradient */
    var cylGrad = ctx.createLinearGradient(cylL, 0, cylL + cylW, 0);
    cylGrad.addColorStop(0, '#1f2535');
    cylGrad.addColorStop(0.15, '#3a4258');
    cylGrad.addColorStop(0.5, '#566275');
    cylGrad.addColorStop(0.85, '#3a4258');
    cylGrad.addColorStop(1, '#1f2535');
    ctx.fillStyle = cylGrad;
    ctx.fillRect(cylL - 4, cylT, cylW + 8, cylH);
    ctx.strokeStyle = '#1a1f30'; ctx.lineWidth = 2;
    ctx.strokeRect(cylL - 4, cylT, cylW + 8, cylH);

    /* Cylinder head with cooling fins */
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(cylL - 8, cylT - 14, cylW + 16, 14);
    ctx.strokeStyle = '#1a1f30';
    for (var f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.moveTo(cylL - 8, cylT - 14 + f * 3.5 + 1);
      ctx.lineTo(cylL + cylW + 8, cylT - 14 + f * 3.5 + 1);
      ctx.stroke();
    }

    var pistonTravel = cylH - 60;
    var pistonPos = getPistonPosition();
    var pistonY = cylT + 12 + pistonPos * pistonTravel;
    var gasTemp = getGasTemperature();
    var tempNorm = clamp((gasTemp - 0.2) / 0.6, 0, 1);

    /* Gas region — vertical thermal gradient */
    var gasTop = cylT + 4, gasBot = pistonY;
    var gasL = cylL + 2, gasR = cylL + cylW - 2;
    var gasGrad = ctx.createLinearGradient(0, gasTop, 0, gasBot);
    var hotR = Math.floor(lerp(140, 255, tempNorm));
    var hotG = Math.floor(lerp(180, 80, tempNorm));
    var hotB = Math.floor(lerp(255, 50, tempNorm));
    gasGrad.addColorStop(0, 'rgba(' + hotR + ',' + hotG + ',' + hotB + ',0.65)');
    gasGrad.addColorStop(1, 'rgba(' + Math.floor(hotR * 0.6) + ',' + Math.floor(hotG * 0.7) + ',' + Math.floor(hotB * 0.9) + ',0.35)');
    ctx.fillStyle = gasGrad;
    ctx.fillRect(gasL, gasTop, gasR - gasL, gasBot - gasTop);

    /* Gas particles — bounce inside chamber, speed scales with T */
    var pSpeed = 0.6 + tempNorm * 2.0;
    var gasH = gasBot - gasTop;
    if (gasH > 4) {
      for (var pi = 0; pi < particles.length; pi++) {
        var pr = particles[pi];
        pr.x += pr.vx * pSpeed;
        pr.y += pr.vy * pSpeed;
        if (pr.x < 0.04) { pr.x = 0.04; pr.vx = -pr.vx; }
        if (pr.x > 0.96) { pr.x = 0.96; pr.vx = -pr.vx; }
        if (pr.y < 0.05) { pr.y = 0.05; pr.vy = -pr.vy; }
        if (pr.y > 0.95) { pr.y = 0.95; pr.vy = -pr.vy; }
        var px = gasL + pr.x * (gasR - gasL);
        var py = gasTop + pr.y * gasH;
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + tempNorm * 0.5).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(px, py, 1.7, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* Combustion sparks during heat addition */
    if (isHeatAdditionPhase()) {
      // emit
      if (sparks.length < 28) {
        for (var es = 0; es < 3; es++) {
          sparks.push({
            x: gasL + Math.random() * (gasR - gasL),
            y: gasTop + 6 + Math.random() * 6,
            vx: (Math.random() - 0.5) * 0.8,
            vy: 0.4 + Math.random() * 1.2,
            life: 1.0
          });
        }
      }
    }
    // Update + draw sparks
    for (var si = sparks.length - 1; si >= 0; si--) {
      var sp = sparks[si];
      sp.x += sp.vx; sp.y += sp.vy; sp.life -= 0.025;
      if (sp.life <= 0 || sp.y > pistonY - 2 || sp.x < gasL || sp.x > gasR) {
        sparks.splice(si, 1); continue;
      }
      var sg = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 5);
      sg.addColorStop(0, 'rgba(255,220,80,' + sp.life.toFixed(2) + ')');
      sg.addColorStop(0.5, 'rgba(255,90,60,' + (sp.life * 0.7).toFixed(2) + ')');
      sg.addColorStop(1, 'rgba(255,40,40,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 5, 0, Math.PI * 2); ctx.fill();
    }

    /* Piston body — metallic gradient + rings */
    var pistonH = 32;
    var pGrad = ctx.createLinearGradient(cylL, pistonY, cylL + cylW, pistonY);
    pGrad.addColorStop(0, '#5a6878');
    pGrad.addColorStop(0.4, '#a8b5c4');
    pGrad.addColorStop(0.5, '#cbd5e0');
    pGrad.addColorStop(0.6, '#a8b5c4');
    pGrad.addColorStop(1, '#5a6878');
    ctx.fillStyle = pGrad;
    ctx.fillRect(cylL + 2, pistonY, cylW - 4, pistonH);
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1;
    ctx.strokeRect(cylL + 2, pistonY, cylW - 4, pistonH);
    // rings — three darker grooves
    ctx.strokeStyle = '#2c3a47'; ctx.lineWidth = 1.5;
    for (var rg = 0; rg < 3; rg++) {
      var ry = pistonY + 6 + rg * 6;
      ctx.beginPath(); ctx.moveTo(cylL + 4, ry); ctx.lineTo(cylL + cylW - 4, ry); ctx.stroke();
    }
    // wrist pin
    ctx.fillStyle = '#1a1f30';
    ctx.beginPath(); ctx.arc(cx, pistonY + pistonH - 6, 3.5, 0, Math.PI * 2); ctx.fill();

    /* Crankshaft + flywheel below cylinder */
    var crankCy = cylT + cylH + 50;
    var crankR = 24;
    // crank pivot
    var pivotGrad = ctx.createRadialGradient(cx, crankCy, 2, cx, crankCy, 14);
    pivotGrad.addColorStop(0, '#90a4ae'); pivotGrad.addColorStop(1, '#37474f');
    ctx.fillStyle = pivotGrad;
    ctx.beginPath(); ctx.arc(cx, crankCy, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1f30'; ctx.lineWidth = 1.5; ctx.stroke();

    // Crank pin position
    var pinX = cx + crankR * Math.cos(crankAngle);
    var pinY = crankCy + crankR * Math.sin(crankAngle);
    // crank arm
    ctx.strokeStyle = '#78909c'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, crankCy); ctx.lineTo(pinX, pinY); ctx.stroke();
    // connecting rod from piston pin to crank pin
    ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, pistonY + pistonH - 6); ctx.lineTo(pinX, pinY); ctx.stroke();
    ctx.strokeStyle = '#78909c'; ctx.lineWidth = 2;
    ctx.stroke();
    // crank pin
    ctx.fillStyle = '#eceff1';
    ctx.beginPath(); ctx.arc(pinX, pinY, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 1; ctx.stroke();

    /* Flywheel to the right */
    var fwX = cx + 60, fwY = crankCy, fwR = 28;
    var fwGrad = ctx.createRadialGradient(fwX - 6, fwY - 6, 2, fwX, fwY, fwR);
    fwGrad.addColorStop(0, '#90a4ae');
    fwGrad.addColorStop(0.6, '#546e7a');
    fwGrad.addColorStop(1, '#263238');
    ctx.fillStyle = fwGrad;
    ctx.beginPath(); ctx.arc(fwX, fwY, fwR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1a1f30'; ctx.lineWidth = 2; ctx.stroke();
    // spokes
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 2;
    for (var sk = 0; sk < 6; sk++) {
      var sa = flywheelAngle + sk * Math.PI / 3;
      ctx.beginPath();
      ctx.moveTo(fwX + Math.cos(sa) * 6, fwY + Math.sin(sa) * 6);
      ctx.lineTo(fwX + Math.cos(sa) * (fwR - 4), fwY + Math.sin(sa) * (fwR - 4));
      ctx.stroke();
    }
    // hub
    ctx.fillStyle = '#cfd8dc';
    ctx.beginPath(); ctx.arc(fwX, fwY, 5, 0, Math.PI * 2); ctx.fill();
    // small dot mark to read rotation
    ctx.fillStyle = '#f5c842';
    ctx.beginPath();
    ctx.arc(fwX + Math.cos(flywheelAngle) * (fwR - 8), fwY + Math.sin(flywheelAngle) * (fwR - 8), 2.5, 0, Math.PI * 2);
    ctx.fill();
    // axle line from crank to flywheel
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + 14, crankCy); ctx.lineTo(fwX - fwR, fwY); ctx.stroke();

    /* Phase label — placed just under cylinder, above crank assembly */
    var phaseNames = getPhaseNames();
    ctx.font = 'bold 11px Segoe UI, sans-serif'; ctx.fillStyle = '#ec407a'; ctx.textAlign = 'center';
    var phaseLabelY = cylT + cylH + 12;
    // background pill
    var plw = ctx.measureText(phaseNames[phase]).width + 14;
    ctx.fillStyle = 'rgba(236,64,122,0.18)';
    ctx.beginPath();
    ctx.rect(cx - plw / 2, phaseLabelY - 9, plw, 14);
    ctx.fill();
    ctx.fillStyle = '#ec407a';
    ctx.fillText(phaseNames[phase], cx, phaseLabelY + 2);

    /* Heat in/out flow arrows (animated flame above, exhaust below) */
    if (isHeatAdditionPhase()) {
      ctx.fillStyle = '#ff5555'; ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText('↑ Qₕ Heat In', cx, cylT - 22);
      // animated rising arrows
      for (var ar = 0; ar < 3; ar++) {
        var aoff = (phaseProgress * 20 + ar * 7) % 14;
        ctx.fillStyle = 'rgba(255,85,85,' + (0.6 - aoff / 24).toFixed(2) + ')';
        ctx.beginPath();
        ctx.moveTo(cylL - 14, cylT + 4 + aoff);
        ctx.lineTo(cylL - 10, cylT + 0 + aoff);
        ctx.lineTo(cylL - 6, cylT + 4 + aoff);
        ctx.closePath(); ctx.fill();
      }
    }
    if (isHeatRejectionPhase()) {
      ctx.fillStyle = '#42a5f5'; ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText('↓ Qₗ Heat Out', cx, cylT + cylH + 14);
    }

    if (showEnergy) drawEnergyFlow();
  }

  function getPhaseNames() {
    if (cycleType === 'carnot') return ['1→2 Iso. Expansion', '2→3 Adi. Expansion', '3→4 Iso. Compression', '4→1 Adi. Compression'];
    if (cycleType === 'otto') return ['1→2 Adi. Compression', '2→3 Const-V Heat Add.', '3→4 Adi. Expansion', '4→1 Const-V Heat Rej.'];
    if (cycleType === 'diesel') return ['1→2 Adi. Compression', '2→3 Const-P Heat Add.', '3→4 Adi. Expansion', '4→1 Const-V Heat Rej.'];
    return ['1→2 Adi. Compression', '2→3 Const-P Heat Add.', '3→4 Adi. Expansion', '4→1 Const-P Heat Rej.'];
  }
  function getPistonPosition() {
    if (cycleType === 'carnot') {
      if (phase === 0) return lerp(0.3, 0.6, phaseProgress);
      if (phase === 1) return lerp(0.6, 1.0, phaseProgress);
      if (phase === 2) return lerp(1.0, 0.5, phaseProgress);
      return lerp(0.5, 0.3, phaseProgress);
    }
    if (cycleType === 'otto') {
      if (phase === 0) return lerp(1.0, 0.1, phaseProgress);
      if (phase === 1) return 0.1;
      if (phase === 2) return lerp(0.1, 1.0, phaseProgress);
      return 1.0;
    }
    if (cycleType === 'diesel') {
      if (phase === 0) return lerp(1.0, 0.1, phaseProgress);
      if (phase === 1) return lerp(0.1, 0.3, phaseProgress);
      if (phase === 2) return lerp(0.3, 1.0, phaseProgress);
      return 1.0;
    }
    if (phase === 0) return lerp(1.0, 0.2, phaseProgress);
    if (phase === 1) return lerp(0.2, 0.4, phaseProgress);
    if (phase === 2) return lerp(0.4, 1.0, phaseProgress);
    return 1.0;
  }
  function getGasTemperature() {
    if (cycleType === 'carnot') {
      if (phase === 0) return 0.8;
      if (phase === 1) return lerp(0.8, 0.3, phaseProgress);
      if (phase === 2) return 0.3;
      return lerp(0.3, 0.8, phaseProgress);
    }
    if (phase === 0) return lerp(0.3, 0.6, phaseProgress);
    if (phase === 1) return lerp(0.6, 1.0, phaseProgress);
    if (phase === 2) return lerp(1.0, 0.5, phaseProgress);
    return lerp(0.5, 0.3, phaseProgress);
  }
  function isHeatAdditionPhase() { return cycleType === 'carnot' ? phase === 0 : phase === 1; }
  function isHeatRejectionPhase() { return cycleType === 'carnot' ? phase === 2 : phase === 3; }

  function drawEnergyFlow() {
    var bx = PIST_L + 10, by = PIST_T + 360;
    ctx.fillStyle = 'rgba(255,85,85,0.35)'; ctx.fillRect(bx, by, 60, 24);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 1; ctx.strokeRect(bx, by, 60, 24);
    ctx.font = 'bold 9px Segoe UI, sans-serif'; ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('Tₕ (Hot)', bx + 30, by + 15);
    ctx.fillStyle = 'rgba(236,64,122,0.35)'; ctx.fillRect(bx + 90, by, 60, 24);
    ctx.strokeStyle = '#ec407a'; ctx.strokeRect(bx + 90, by, 60, 24);
    ctx.fillStyle = '#ec407a'; ctx.fillText('Engine', bx + 120, by + 15);
    ctx.fillStyle = 'rgba(66,165,245,0.35)'; ctx.fillRect(bx + 180, by, 60, 24);
    ctx.strokeStyle = '#42a5f5'; ctx.strokeRect(bx + 180, by, 60, 24);
    ctx.fillStyle = '#42a5f5'; ctx.fillText('Tₗ (Cold)', bx + 210, by + 15);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx + 60, by + 12); ctx.lineTo(bx + 88, by + 12); ctx.stroke();
    ctx.fillStyle = '#ff5555'; ctx.beginPath(); ctx.moveTo(bx + 88, by + 12); ctx.lineTo(bx + 82, by + 8); ctx.lineTo(bx + 82, by + 16); ctx.fill();
    ctx.font = '8px Courier New, monospace'; ctx.textAlign = 'center'; ctx.fillText('Qₕ', bx + 74, by + 7);
    ctx.strokeStyle = '#42a5f5';
    ctx.beginPath(); ctx.moveTo(bx + 150, by + 12); ctx.lineTo(bx + 178, by + 12); ctx.stroke();
    ctx.fillStyle = '#42a5f5'; ctx.beginPath(); ctx.moveTo(bx + 178, by + 12); ctx.lineTo(bx + 172, by + 8); ctx.lineTo(bx + 172, by + 16); ctx.fill();
    ctx.fillText('Qₗ', bx + 164, by + 7);
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(bx + 120, by); ctx.lineTo(bx + 120, by - 16); ctx.stroke();
    ctx.fillStyle = '#f5c842'; ctx.beginPath(); ctx.moveTo(bx + 120, by - 16); ctx.lineTo(bx + 116, by - 10); ctx.lineTo(bx + 124, by - 10); ctx.fill();
    ctx.font = '8px Courier New, monospace'; ctx.fillText('W', bx + 132, by - 8);
  }

  function drawMovingDot(processes, Pmin, Pmax, Vmin, Vmax) {
    var proc = processes[phase]; if (!proc) return;
    var idx = clamp(Math.floor(phaseProgress * (proc.pts.length - 1)), 0, proc.pts.length - 1);
    var pt = proc.pts[idx];
    var cp = pvToCanvas(pt.P, pt.V, Pmin, Pmax, Vmin, Vmax);
    // Append to trail (deduped)
    if (!pvTrail.length || Math.hypot(pvTrail[pvTrail.length - 1].x - cp.x, pvTrail[pvTrail.length - 1].y - cp.y) > 1.5) {
      pvTrail.push({ x: cp.x, y: cp.y });
      if (pvTrail.length > 30) pvTrail.shift();
    }
    // Render trail as fading comet
    for (var t = 0; t < pvTrail.length; t++) {
      var alpha = (t + 1) / pvTrail.length;
      var r = 1 + alpha * 4;
      ctx.fillStyle = 'rgba(245,200,66,' + (alpha * 0.55).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(pvTrail[t].x, pvTrail[t].y, r, 0, Math.PI * 2); ctx.fill();
    }
    // Head: white halo + pink core + ring pulse
    var pulse = 8 + Math.sin(phaseProgress * Math.PI * 8) * 1.4;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cp.x, cp.y, pulse, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cp.x, cp.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ec407a'; ctx.beginPath(); ctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2); ctx.fill();
  }

  /* ================================================================
     T-s DIAGRAM
     ================================================================ */
  function getStateEntropies(states) {
    var Cv = (5 / 2) * R, Cp = (7 / 2) * R;
    var s = [0]; // reference s[0]=0
    for (var i = 1; i < states.length; i++) {
      var ds = Cp * Math.log(states[i].T / states[i - 1].T) - R * Math.log(states[i].P / states[i - 1].P);
      s.push(s[i - 1] + ds);
    }
    return s;
  }
  function drawTSDiagram() {
    if (!tsCtx) return;
    tsCtx.clearRect(0, 0, 800, 320);
    tsCtx.fillStyle = '#0d1117'; tsCtx.fillRect(0, 0, 800, 320);
    var states = getCycleStates();
    var sArr = getStateEntropies(states);
    /* Scale the temperature axis from the cycle's ACTUAL state temperatures,
       exactly as the P-v diagram already scales from its computed points.

       The axis used to be Tcold*0.8 .. Thot*1.1, which silently assumes T_hot
       is the peak temperature. That holds for Carnot, Otto and Brayton (where
       state 3 is set to T_hot) but NOT for Diesel, whose peak is derived:
       T3 = T2.rc = Tcold.r^(γ−1).rc, independent of T_hot. At the Diesel
       defaults T3 is 1723 K against an axis top of 880 K, so the entire top of
       the cycle was drawn off-chart — and it stayed off-chart even with T_hot
       pushed to its 1500 K maximum. */
    var allT = states.map(function (st) { return st.T; });
    var tLo = Math.min.apply(null, allT), tHi = Math.max.apply(null, allT);
    /* Pad proportionally to the SPAN, not multiplicatively. A 0.85x/1.10x pad
       collapses when the low state is small next to the peak — at r=20, rc=4
       Diesel spans 300..3976 K and the bottom state landed on the axis, with
       the stroke half-width poking through it. */
    var tSpan = Math.max(tHi - tLo, 1);
    var Tmin = tLo - tSpan * 0.06;
    var Tmax = tHi + tSpan * 0.08;
    var sMin = Math.min.apply(null, sArr), sMax = Math.max.apply(null, sArr);
    var pad = (sMax - sMin) * 0.1 || 1;
    sMin -= pad; sMax += pad;
    var L = 60, T = 30, Wp = 700, Hp = 250;
    function pt(s, Te) {
      return { x: L + ((s - sMin) / (sMax - sMin)) * Wp, y: T + Hp - ((Te - Tmin) / (Tmax - Tmin)) * Hp };
    }
    // axes
    tsCtx.strokeStyle = '#4a5578'; tsCtx.lineWidth = 2;
    tsCtx.beginPath(); tsCtx.moveTo(L, T); tsCtx.lineTo(L, T + Hp); tsCtx.lineTo(L + Wp, T + Hp); tsCtx.stroke();
    tsCtx.fillStyle = '#6b7a99'; tsCtx.font = 'bold 12px Segoe UI, sans-serif'; tsCtx.textAlign = 'center';
    tsCtx.fillText('Entropy s (J/K)', L + Wp / 2, T + Hp + 22);
    tsCtx.save(); tsCtx.translate(L - 38, T + Hp / 2); tsCtx.rotate(-Math.PI / 2); tsCtx.fillText('Temperature T (K)', 0, 0); tsCtx.restore();
    // cycle lines connecting 4 states (closed)
    var pts = states.map(function (st, i) { return pt(sArr[i], st.T); });
    pts.push(pts[0]);
    tsCtx.strokeStyle = '#ec407a'; tsCtx.lineWidth = 2.5; tsCtx.beginPath();
    tsCtx.moveTo(pts[0].x, pts[0].y);
    for (var k = 1; k < pts.length; k++) tsCtx.lineTo(pts[k].x, pts[k].y);
    tsCtx.stroke();
    // shaded area
    tsCtx.fillStyle = 'rgba(245,200,66,0.18)'; tsCtx.beginPath();
    tsCtx.moveTo(pts[0].x, pts[0].y);
    for (var k2 = 1; k2 < pts.length; k2++) tsCtx.lineTo(pts[k2].x, pts[k2].y);
    tsCtx.closePath(); tsCtx.fill();
    // state dots + labels
    var labels = ['1', '2', '3', '4'];
    for (var i = 0; i < states.length; i++) {
      tsCtx.fillStyle = '#f5c842'; tsCtx.beginPath(); tsCtx.arc(pts[i].x, pts[i].y, 5, 0, Math.PI * 2); tsCtx.fill();
      tsCtx.fillStyle = '#dde3f0'; tsCtx.font = 'bold 11px Courier New, monospace'; tsCtx.textAlign = 'center';
      tsCtx.fillText(labels[i], pts[i].x + 12, pts[i].y - 8);
    }
    tsCtx.fillStyle = '#6b7a99'; tsCtx.font = '11px Segoe UI, sans-serif'; tsCtx.textAlign = 'left';
    tsCtx.fillText('Area under curve = heat transfer; enclosed area = net work', L, T - 8);
  }

  /* ================================================================
     MINI DIAGRAMS (Explore)
     ================================================================ */
  function drawMiniDiagram(id) {
    ctx.clearRect(0, 0, 900, 480);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 900, 480);
    var cx = 450, cy = 240;
    if (id === 'firstLaw') { drawMiniBox(cx, cy, 'First Law', 'ΔU = Q − W', 'Energy In (Q) = Energy Stored (ΔU) + Work Out (W)'); drawThreeArrows(cx, cy); }
    else if (id === 'secondLaw') { drawMiniBox(cx, cy, 'Second Law', 'ΔS_universe ≥ 0', 'Heat flows hot → cold spontaneously. No perfect engine.'); drawHeatFlowArrow(cx, cy); }
    else if (id === 'entropy') { drawMiniBox(cx, cy, 'Entropy', 'ΔS = Q/T', 'Disorder always increases in isolated systems.'); }
    else if (id === 'reversibility') { drawMiniBox(cx, cy, 'Reversibility', 'η_real < η_Carnot', 'Real processes always have irreversibilities (friction, heat loss).'); }
    else if (id === 'carnotCycle') drawMiniCycle('carnot', cx, cy);
    else if (id === 'ottoCycle') drawMiniCycle('otto', cx, cy);
    else if (id === 'dieselCycle') drawMiniCycle('diesel', cx, cy);
    else if (id === 'braytonCycle') drawMiniCycle('brayton', cx, cy);
    else if (id === 'heatEngine') { drawMiniBox(cx, cy, 'Heat Engine', 'W = Q_H − Q_C', 'Converts heat to work between two reservoirs.'); drawThreeArrows(cx, cy); }
    else if (id === 'refrigerator') drawMiniBox(cx, cy, 'Refrigerator', 'COP = Q_C / W', 'Uses work to move heat from cold to hot.');
    else if (id === 'compressionRatio') drawMiniBox(cx, cy, 'Compression Ratio', 'r = V_max / V_min', 'Higher r → higher efficiency (limited by knock).');
    else if (id === 'thermalEff') drawMiniBox(cx, cy, 'Thermal Efficiency', 'η = W / Q_in', 'Fraction of heat converted to useful work.');
    else drawMiniBox(cx, cy, 'Concept', '', 'Select a concept to view.');
  }
  function drawMiniBox(cx, cy, title, formula, desc) {
    ctx.fillStyle = '#161b27'; ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 2;
    var bw = 500, bh = 200;
    ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh); ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
    ctx.font = 'bold 22px Segoe UI, sans-serif'; ctx.fillStyle = '#ec407a'; ctx.textAlign = 'center';
    ctx.fillText(title, cx, cy - 50);
    ctx.font = 'bold 28px Courier New, monospace'; ctx.fillStyle = '#f5c842';
    ctx.fillText(formula, cx, cy + 10);
    ctx.font = '14px Segoe UI, sans-serif'; ctx.fillStyle = '#6b7a99';
    ctx.fillText(desc, cx, cy + 55);
  }
  function drawThreeArrows(cx, cy) {
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 180, cy + 120); ctx.lineTo(cx - 80, cy + 120); ctx.stroke();
    ctx.fillStyle = '#ff5555'; ctx.beginPath(); ctx.moveTo(cx - 80, cy + 120); ctx.lineTo(cx - 88, cy + 115); ctx.lineTo(cx - 88, cy + 125); ctx.fill();
    ctx.font = 'bold 12px Courier New, monospace'; ctx.textAlign = 'center';
    ctx.fillText('Q_H', cx - 130, cy + 113);
    ctx.strokeStyle = '#f5c842';
    ctx.beginPath(); ctx.moveTo(cx, cy + 100); ctx.lineTo(cx, cy + 140); ctx.stroke();
    ctx.fillStyle = '#f5c842'; ctx.beginPath(); ctx.moveTo(cx, cy + 140); ctx.lineTo(cx - 5, cy + 133); ctx.lineTo(cx + 5, cy + 133); ctx.fill();
    ctx.fillText('W', cx + 15, cy + 130);
    ctx.strokeStyle = '#42a5f5';
    ctx.beginPath(); ctx.moveTo(cx + 80, cy + 120); ctx.lineTo(cx + 180, cy + 120); ctx.stroke();
    ctx.fillStyle = '#42a5f5'; ctx.beginPath(); ctx.moveTo(cx + 180, cy + 120); ctx.lineTo(cx + 172, cy + 115); ctx.lineTo(cx + 172, cy + 125); ctx.fill();
    ctx.fillText('Q_C', cx + 130, cy + 113);
  }
  function drawHeatFlowArrow(cx, cy) {
    ctx.strokeStyle = '#ec407a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 120, cy + 130); ctx.lineTo(cx + 120, cy + 130); ctx.stroke();
    ctx.fillStyle = '#ec407a'; ctx.beginPath(); ctx.moveTo(cx + 120, cy + 130); ctx.lineTo(cx + 110, cy + 123); ctx.lineTo(cx + 110, cy + 137); ctx.fill();
    ctx.font = 'bold 12px Segoe UI, sans-serif'; ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('HOT', cx - 120, cy + 155);
    ctx.fillStyle = '#42a5f5'; ctx.fillText('COLD', cx + 120, cy + 155);
  }
  function drawMiniCycle(type, cx, cy) {
    var saved = cycleType; cycleType = type;
    var states = getCycleStates();
    var processes = getCycleProcesses(states);
    cycleType = saved;
    var allP = states.map(function (s) { return s.P; });
    var allV = states.map(function (s) { return s.V; });
    var Pmin = Math.min.apply(null, allP) * 0.85, Pmax = Math.max.apply(null, allP) * 1.15;
    var Vmin = Math.min.apply(null, allV) * 0.85, Vmax = Math.max.apply(null, allV) * 1.15;
    ctx.font = 'bold 16px Segoe UI, sans-serif'; ctx.fillStyle = '#ec407a'; ctx.textAlign = 'center';
    ctx.fillText(type.charAt(0).toUpperCase() + type.slice(1) + ' Cycle — PV Diagram', cx, 30);
    var s1 = PV_L, s2 = PV_T, s3 = PV_W, s4 = PV_H;
    PV_L = 50; PV_T = 40; PV_W = 900 - 100; PV_H = 480 - 80;
    drawAxes(Pmin, Pmax, Vmin, Vmax);
    var savedLabels = showLabels, savedStates = showStates, savedEq = showEq;
    showLabels = true; showStates = false; showEq = false;
    drawCycle(states, processes, Pmin, Pmax, Vmin, Vmax);
    showLabels = savedLabels; showStates = savedStates; showEq = savedEq;
    PV_L = s1; PV_T = s2; PV_W = s3; PV_H = s4;
  }

  /* ================================================================
     MAIN RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, 900, 480);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 900, 480);
    if (mode !== 'simulate') return;
    var states = getCycleStates();
    var processes = getCycleProcesses(states);
    var allP = [], allV = [];
    for (var i = 0; i < processes.length; i++) for (var j = 0; j < processes[i].pts.length; j++) {
      allP.push(processes[i].pts[j].P); allV.push(processes[i].pts[j].V);
    }
    var Pmin = Math.min.apply(null, allP) * 0.9, Pmax = Math.max.apply(null, allP) * 1.1;
    var Vmin = Math.min.apply(null, allV) * 0.9, Vmax = Math.max.apply(null, allV) * 1.1;
    if (Pmin < 0) Pmin = 0; if (Vmin < 0) Vmin = 0;
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(560, 10); ctx.lineTo(560, 470); ctx.stroke();
    drawAxes(Pmin, Pmax, Vmin, Vmax);
    drawCycle(states, processes, Pmin, Pmax, Vmin, Vmax);
    drawMovingDot(processes, Pmin, Pmax, Vmin, Vmax);
    drawPiston();
  }

  /* ================================================================
     READOUTS (with unit toggle)
     ================================================================ */
  function computeEnergies() {
    var eff = getEfficiency();
    var Cv = (5 / 2) * R, Cp = (7 / 2) * R, qin;
    if (cycleType === 'carnot') {
      qin = n * R * Thot * Math.log(compressionRatio);
    } else if (cycleType === 'otto') {
      var s = getOttoStates(); qin = n * Cv * (s[2].T - s[1].T);
    } else if (cycleType === 'diesel') {
      var d = getDieselStates(); qin = n * Cp * (d[2].T - d[1].T);
    } else {
      var b = getBraytonStates(); qin = n * Cp * (b[2].T - b[1].T);
    }
    var wnet = qin * eff, qout = qin - wnet;
    return { eff: eff, qin: qin, wnet: wnet, qout: qout };
  }

  function updateReadouts() {
    var e = computeEnergies();
    var imp = isImp();
    var qinKJ = e.qin / 1000, wnetKJ = e.wnet / 1000, qoutKJ = e.qout / 1000;
    var eUnit = imp ? ' BTU' : ' kJ';
    var qIn = imp ? kJ_to_BTU(qinKJ) : qinKJ;
    var qOut = imp ? kJ_to_BTU(qoutKJ) : qoutKJ;
    var wN = imp ? kJ_to_BTU(wnetKJ) : wnetKJ;
    var tH = imp ? K_to_F(Thot) : Thot;
    var tC = imp ? K_to_F(Tcold) : Tcold;
    var tUnit = imp ? ' °F' : ' K';
    $('r-eff').textContent = (e.eff * 100).toFixed(1);
    $('r-wnet').textContent = wN.toFixed(1);
    $('r-qin').textContent = qIn.toFixed(1);
    $('r-qout').textContent = qOut.toFixed(1);
    $('u-wnet').textContent = eUnit;
    $('u-qin').textContent = eUnit;
    $('u-qout').textContent = eUnit;
    $('r-thot').textContent = tH.toFixed(imp ? 0 : 0);
    $('r-tcold').textContent = tC.toFixed(imp ? 0 : 0);
    $('u-thot-r').textContent = tUnit;
    $('u-tcold-r').textContent = tUnit;
    // A7 FIX — dynamic ratio label
    if (cycleType === 'brayton') {
      $('l-ratio').textContent = 'Press. Ratio';
      $('r-cr').textContent = pressureRatio.toFixed(1);
    } else if (cycleType === 'diesel') {
      $('l-ratio').textContent = 'Comp. Ratio';
      $('r-cr').textContent = compressionRatio.toFixed(1);
    } else {
      $('l-ratio').textContent = cycleType === 'carnot' ? 'Vol. Ratio' : 'Comp. Ratio';
      $('r-cr').textContent = compressionRatio.toFixed(1);
    }
    $('r-cop').textContent = (Tcold / Math.max(Thot - Tcold, 1)).toFixed(2);
    // Slider display units
    $('u-thot').textContent = tUnit.trim();
    $('u-tcold').textContent = tUnit.trim();
    // Number inputs reflect SI internal (so users always enter in SI for clarity)
    numThot.value = Thot; numTcold.value = Tcold;
    numCR.value = compressionRatio; numPR.value = pressureRatio; numRC.value = cutoffRatio;
    updateLearnPanels(e);
  }

  /* ================================================================
     LEARN PANELS (live equations, state table, coach)
     ================================================================ */
  function updateLearnPanels(e) {
    var eq = $('lp-eq-body'); if (!eq) return;
    var html = '';
    if (cycleType === 'carnot') {
      html += '<div class="eq-line">\\[ \\eta_{\\text{Carnot}} = 1 - \\dfrac{T_C}{T_H} \\]</div>';
      html += '<div class="eq-line">\\(\\eta = 1 - \\dfrac{' + Tcold + '}{' + Thot + '} = \\mathbf{' + (e.eff * 100).toFixed(2) + '\\%}\\)</div>';
    } else if (cycleType === 'otto') {
      html += '<div class="eq-line">\\[ \\eta_{\\text{Otto}} = 1 - \\dfrac{1}{r^{\\gamma-1}} \\]</div>';
      html += '<div class="eq-line">\\(\\eta = 1 - \\dfrac{1}{' + compressionRatio.toFixed(1) + '^{0.4}} = \\mathbf{' + (e.eff * 100).toFixed(2) + '\\%}\\)</div>';
    } else if (cycleType === 'diesel') {
      html += '<div class="eq-line">\\[ \\eta_{\\text{Diesel}} = 1 - \\dfrac{1}{r^{\\gamma-1}} \\cdot \\dfrac{r_c^{\\gamma}-1}{\\gamma(r_c-1)} \\]</div>';
      html += '<div class="eq-line">\\(\\eta = \\mathbf{' + (e.eff * 100).toFixed(2) + '\\%}\\;\\;(r=' + compressionRatio.toFixed(1) + ',\\; r_c=' + cutoffRatio.toFixed(1) + ')\\)</div>';
    } else {
      html += '<div class="eq-line">\\[ \\eta_{\\text{Brayton}} = 1 - \\dfrac{1}{r_p^{(\\gamma-1)/\\gamma}} \\]</div>';
      html += '<div class="eq-line">\\(\\eta = 1 - \\dfrac{1}{' + pressureRatio.toFixed(1) + '^{0.286}} = \\mathbf{' + (e.eff * 100).toFixed(2) + '\\%}\\)</div>';
    }
    var imp = isImp(), eU = imp ? '\\mathrm{BTU}' : '\\mathrm{kJ}';
    var qinD = imp ? kJ_to_BTU(e.qin / 1000) : e.qin / 1000;
    var wND = imp ? kJ_to_BTU(e.wnet / 1000) : e.wnet / 1000;
    html += '<div class="eq-line">\\(W_{\\text{net}} = \\eta \\cdot Q_{\\text{in}} = ' + (e.eff * 100).toFixed(1) + '\\% \\cdot ' + qinD.toFixed(2) + '\\;' + eU + ' = \\mathbf{' + wND.toFixed(2) + '\\;' + eU + '}\\)</div>';
    if (html !== _learnCache.eq) { eq.innerHTML = html; _learnCache.eq = html; }

    // State table
    var st = $('lp-states-body');
    if (st) {
      var states = getCycleStates();
      var sH = '<table class="state-table"><thead><tr><th>State</th><th>P</th><th>V (L)</th><th>T</th></tr></thead><tbody>';
      var tU = imp ? '°F' : 'K';
      for (var i = 0; i < states.length; i++) {
        var P = states[i].P, V = states[i].V * 1000;
        var T = imp ? K_to_F(states[i].T) : states[i].T;
        var pStr = P >= 1e6 ? (P / 1e6).toFixed(2) + ' MPa' : (P / 1e3).toFixed(1) + ' kPa';
        sH += '<tr><td>' + (i + 1) + '</td><td>' + pStr + '</td><td>' + V.toFixed(2) + '</td><td>' + T.toFixed(0) + ' ' + tU + '</td></tr>';
      }
      sH += '</tbody></table>';
      if (sH !== _learnCache.st) { st.innerHTML = sH; _learnCache.st = sH; }
    }

    // Coach
    var co = $('lp-coach-body');
    if (co) {
      var coachHTML = '<ul class="coach-list">';
      var carnotMax = 1 - Tcold / Thot;
      if (e.eff > carnotMax + 1e-6) {
        coachHTML += '<li class="coach-item err">⚠ Efficiency exceeds the Carnot bound (' + (carnotMax * 100).toFixed(1) + '%) — not physically possible.</li>';
      } else {
        coachHTML += '<li class="coach-item">Carnot limit between these temperatures: <strong>' + (carnotMax * 100).toFixed(1) + '%</strong>. Current cycle reaches ' + ((e.eff / carnotMax) * 100).toFixed(0) + '% of that bound.</li>';
      }
      if (cycleType === 'otto' && compressionRatio < 10) {
        coachHTML += '<li class="coach-item warn">Try raising compression ratio above 10 — η rises rapidly. Real engines limit r at ≈12 due to knock.</li>';
      }
      if (cycleType === 'diesel' && cutoffRatio > 3) {
        coachHTML += '<li class="coach-item warn">High cutoff ratio (' + cutoffRatio.toFixed(1) + ') reduces η. Real diesels run rₜ ≈ 2–3.</li>';
      }
      if (cycleType === 'brayton' && pressureRatio < 6) {
        coachHTML += '<li class="coach-item">Modern jet engines run rₚ = 30–40. Try increasing pressure ratio.</li>';
      }
      if (Thot - Tcold < 200) {
        coachHTML += '<li class="coach-item warn">Small ΔT — little work available. Heat engines need wide temperature spread.</li>';
      }
      coachHTML += '</ul>';
      if (coachHTML !== _learnCache.co) { co.innerHTML = coachHTML; _learnCache.co = coachHTML; }
    }
    drawTSDiagram();
  }

  /* ================================================================
     CALC MODAL
     ================================================================ */
  function buildCalcSteps() {
    var e = computeEnergies();
    var states = getCycleStates();
    var imp = isImp();
    var eU = imp ? '\\mathrm{BTU}' : '\\mathrm{kJ}';
    var qinD = imp ? kJ_to_BTU(e.qin / 1000) : e.qin / 1000;
    var qoutD = imp ? kJ_to_BTU(e.qout / 1000) : e.qout / 1000;
    var wND = imp ? kJ_to_BTU(e.wnet / 1000) : e.wnet / 1000;

    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Given (SI)</span><div class="cs-given">';
    html += '<span>T_H = ' + Thot + ' K</span><span>T_C = ' + Tcold + ' K</span>';
    if (cycleType === 'brayton') html += '<span>r_p = ' + pressureRatio.toFixed(1) + '</span>';
    else html += '<span>r = ' + compressionRatio.toFixed(1) + '</span>';
    if (cycleType === 'diesel') html += '<span>r_c = ' + cutoffRatio.toFixed(1) + '</span>';
    html += '<span>γ = 1.4</span><span>n = 1 mol</span></div></div>';

    // Step 1 — Efficiency
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 1</span><span class="cs-title">Thermal efficiency</span></div>';
    if (cycleType === 'carnot') {
      html += '<div class="cs-formula">\\[ \\eta = 1 - \\dfrac{T_C}{T_H} \\]</div>';
      html += '<div class="cs-calc">\\(\\eta = 1 - \\dfrac{' + Tcold + '}{' + Thot + '} = 1 - ' + (Tcold / Thot).toFixed(4) + '\\)</div>';
    } else if (cycleType === 'otto') {
      html += '<div class="cs-formula">\\[ \\eta = 1 - \\dfrac{1}{r^{\\gamma-1}} \\]</div>';
      html += '<div class="cs-calc">\\(\\eta = 1 - \\dfrac{1}{' + compressionRatio.toFixed(1) + '^{0.4}} = 1 - ' + (1 / Math.pow(compressionRatio, 0.4)).toFixed(4) + '\\)</div>';
    } else if (cycleType === 'diesel') {
      html += '<div class="cs-formula">\\[ \\eta = 1 - \\dfrac{1}{r^{\\gamma-1}} \\cdot \\dfrac{r_c^{\\gamma}-1}{\\gamma(r_c-1)} \\]</div>';
      var rcG = Math.pow(cutoffRatio, gamma);
      html += '<div class="cs-calc">\\(\\eta = 1 - \\dfrac{1}{' + Math.pow(compressionRatio, 0.4).toFixed(3) + '} \\cdot \\dfrac{' + rcG.toFixed(3) + '-1}{1.4(' + cutoffRatio.toFixed(1) + '-1)}\\)</div>';
    } else {
      html += '<div class="cs-formula">\\[ \\eta = 1 - \\dfrac{1}{r_p^{(\\gamma-1)/\\gamma}} \\]</div>';
      html += '<div class="cs-calc">\\(\\eta = 1 - \\dfrac{1}{' + pressureRatio.toFixed(1) + '^{0.286}} = 1 - ' + (1 / Math.pow(pressureRatio, 0.286)).toFixed(4) + '\\)</div>';
    }
    html += '<div class="cs-result">\\(= \\mathbf{' + (e.eff * 100).toFixed(2) + '\\%}\\)</div></div>';

    // Step 2 — Q_in
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 2</span><span class="cs-title">Heat input per cycle</span></div>';
    if (cycleType === 'carnot') {
      html += '<div class="cs-formula">\\[ Q_{\\text{in}} = nRT_H \\ln\\dfrac{V_2}{V_1} \\]</div>';
      html += '<div class="cs-calc">\\(Q_{\\text{in}} = 1 \\cdot 8.314 \\cdot ' + Thot + ' \\cdot \\ln(' + compressionRatio.toFixed(1) + ')\\)</div>';
    } else if (cycleType === 'otto') {
      html += '<div class="cs-formula">\\[ Q_{\\text{in}} = n\\,C_v\\,(T_3 - T_2) \\]</div>';
      html += '<div class="cs-calc">\\(Q_{\\text{in}} = 1 \\cdot \\tfrac{5}{2}R \\cdot (' + states[2].T.toFixed(0) + ' - ' + states[1].T.toFixed(0) + ')\\)</div>';
    } else {
      html += '<div class="cs-formula">\\[ Q_{\\text{in}} = n\\,C_p\\,(T_3 - T_2) \\]</div>';
      html += '<div class="cs-calc">\\(Q_{\\text{in}} = 1 \\cdot \\tfrac{7}{2}R \\cdot (' + states[2].T.toFixed(0) + ' - ' + states[1].T.toFixed(0) + ')\\)</div>';
    }
    html += '<div class="cs-result">\\(= \\mathbf{' + qinD.toFixed(2) + '\\;' + eU + '}\\)</div></div>';

    // Step 3 — W_net
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 3</span><span class="cs-title">Net work output</span></div>';
    html += '<div class="cs-formula">\\[ W_{\\text{net}} = \\eta \\cdot Q_{\\text{in}} \\]</div>';
    html += '<div class="cs-calc">\\(W_{\\text{net}} = ' + (e.eff * 100).toFixed(2) + '\\% \\cdot ' + qinD.toFixed(2) + '\\;' + eU + '\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + wND.toFixed(2) + '\\;' + eU + '}\\)</div></div>';

    // Step 4 — Q_out
    html += '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step 4</span><span class="cs-title">Heat rejected (First Law: ΔU=0 over a cycle)</span></div>';
    html += '<div class="cs-formula">\\[ Q_{\\text{out}} = Q_{\\text{in}} - W_{\\text{net}} \\]</div>';
    html += '<div class="cs-calc">\\(Q_{\\text{out}} = ' + qinD.toFixed(2) + ' - ' + wND.toFixed(2) + '\\;' + eU + '\\)</div>';
    html += '<div class="cs-result">\\(= \\mathbf{' + qoutD.toFixed(2) + '\\;' + eU + '}\\)</div></div>';

    return html;
  }
  function openCalc() {
    calcModalBody.innerHTML = buildCalcSteps();
    calcModal.classList.add('active');
  }
  function closeCalc() { calcModal.classList.remove('active'); }
  btnCalc.addEventListener('click', openCalc);
  calcModalClose.addEventListener('click', closeCalc);
  calcModal.addEventListener('click', function (e) { if (e.target === calcModal) closeCalc(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCalc(); });

  /* ================================================================
     ANIMATION
     ================================================================ */
  function animate() {
    if (animRunning && mode === 'simulate') {
      phaseProgress += 0.008 * animSpeed;
      if (phaseProgress >= 1) { phaseProgress = 0; phase = (phase + 1) % 4; }
      // Drive crank + flywheel
      crankAngle = -Math.PI / 2 + (phase + phaseProgress) * (Math.PI / 2);
      flywheelAngle += 0.06 * animSpeed;
      render();
    } else if (mode === 'simulate') {
      // paused but keep redraw for resize/state changes — render once is enough
    }
    requestAnimationFrame(animate);
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  modeTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    modeTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(m);
  });
  function switchMode(m) {
    mode = m;
    simPanel.style.display = m === 'simulate' ? '' : 'none';
    catRow.style.display = m === 'explore' ? '' : 'none';
    itemSelector.style.display = m === 'explore' ? '' : 'none';
    itemInfo.style.display = m === 'explore' && exploreItem ? '' : 'none';
    practicePanel.style.display = m === 'practice' ? '' : 'none';
    practiceBar.style.display = m === 'practice' ? '' : 'none';
    quizPanel.style.display = m === 'quiz' ? '' : 'none';
    quizBar.style.display = m === 'quiz' ? '' : 'none';
    quizResult.style.display = 'none';
    document.querySelector('.canvas-card').style.display = (m === 'simulate' || m === 'explore') ? '' : 'none';
    document.getElementById('learn-panels').style.display = m === 'simulate' ? '' : 'none';
    if (m === 'simulate') { render(); }
    else if (m === 'explore') {
      buildConceptGrid();
      if (exploreItem) showConceptInfo(exploreItem);
      else { ctx.clearRect(0, 0, 900, 480); ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, 900, 480); }
    } else if (m === 'practice') { newPracticeProblem(); }
    else if (m === 'quiz') { startQuiz(); }
  }

  /* ================================================================
     UNIT TOGGLE
     ================================================================ */
  unitTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    units = e.target.dataset.units;
    unitTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    _learnCache = { eq: '', st: '', co: '' };
    updateReadouts();
  });

  /* ================================================================
     CYCLE TYPE SWITCHING
     ================================================================ */
  cycleTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    cycleType = e.target.dataset.cycle;
    cycleTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    phase = 0; phaseProgress = 0; pvTrail = []; sparks = [];
    _learnCache = { eq: '', st: '', co: '' };
    updateSliderVisibility();
    updateReadouts();
  });
  function updateSliderVisibility() {
    grpCR.style.display = (cycleType === 'carnot' || cycleType === 'otto' || cycleType === 'diesel') ? '' : 'none';
    grpPR.style.display = cycleType === 'brayton' ? '' : 'none';
    grpRC.style.display = cycleType === 'diesel' ? '' : 'none';
    /* In the Diesel cycle the peak temperature is not an independent input:
       T3 = T2.rc is fixed by the compression and cutoff ratios. T_hot appears
       nowhere in getDieselStates() or its efficiency, so leaving the slider
       live there is a control that does nothing. Hide it for Diesel only. */
    if (grpThot) grpThot.style.display = cycleType === 'diesel' ? 'none' : '';
  }

  /* ================================================================
     SLIDERS + NUMERIC INPUTS (synced)
     ================================================================ */
  function clampToBounds() {
    /* B5/B6 — guard: Tcold must be < Thot, gas-temperature ratios sane */
    if (Tcold >= Thot) Tcold = Math.max(200, Thot - 50);
    if (Tcold < 200) Tcold = 200;
    if (Thot < Tcold + 50) Thot = Tcold + 50;
    slThot.value = Thot; slTcold.value = Tcold;
    numThot.value = Thot; numTcold.value = Tcold;
  }
  function bindPair(slider, num, getter, setter, fmtFn) {
    slider.addEventListener('input', function () { setter(+this.value); clampToBounds(); updateReadouts(); });
    num.addEventListener('change', function () {
      var v = +this.value;
      if (isNaN(v)) { this.value = getter(); return; }
      v = clamp(v, +slider.min, +slider.max);
      this.value = v; slider.value = v;
      setter(v); clampToBounds(); updateReadouts();
    });
  }
  bindPair(slThot, numThot, function () { return Thot; }, function (v) { Thot = v; });
  bindPair(slTcold, numTcold, function () { return Tcold; }, function (v) { Tcold = v; });
  bindPair(slCR, numCR, function () { return compressionRatio; }, function (v) { compressionRatio = v; });
  bindPair(slPR, numPR, function () { return pressureRatio; }, function (v) { pressureRatio = v; });
  bindPair(slRC, numRC, function () { return cutoffRatio; }, function (v) { cutoffRatio = v; });

  chkLabels.addEventListener('change', function () { showLabels = this.checked; this.parentElement.classList.toggle('checked', this.checked); });
  chkEnergy.addEventListener('change', function () { showEnergy = this.checked; this.parentElement.classList.toggle('checked', this.checked); });
  chkStates.addEventListener('change', function () { showStates = this.checked; this.parentElement.classList.toggle('checked', this.checked); });
  chkEq.addEventListener('change', function () { showEq = this.checked; this.parentElement.classList.toggle('checked', this.checked); });

  /* ================================================================
     ANIMATION CONTROLS
     ================================================================ */
  btnPlay.addEventListener('click', function () {
    animRunning = !animRunning;
    btnPlay.innerHTML = animRunning ? '❚❚' : '▶';
    btnPlay.classList.toggle('paused', !animRunning);
    btnPlay.title = animRunning ? 'Pause' : 'Play';
  });
  btnReset.addEventListener('click', function () {
    phase = 0; phaseProgress = 0; pvTrail = []; sparks = [];
    crankAngle = -Math.PI / 2; flywheelAngle = 0;
    render();
  });
  slSpeed.addEventListener('input', function () {
    animSpeed = +this.value;
    valSpeed.textContent = animSpeed.toFixed(1) + '×';
  });

  /* ================================================================
     EXPORT CSV / PNG
     ================================================================ */
  function exportCSV() {
    var states = getCycleStates();
    var e = computeEnergies();
    var lines = ['State,P_Pa,V_m3,T_K'];
    for (var i = 0; i < states.length; i++) {
      lines.push((i + 1) + ',' + states[i].P.toFixed(2) + ',' + states[i].V.toFixed(6) + ',' + states[i].T.toFixed(2));
    }
    lines.push('');
    lines.push('Cycle,' + cycleType);
    lines.push('Efficiency,' + (e.eff * 100).toFixed(3) + '%');
    lines.push('Q_in_J,' + e.qin.toFixed(2));
    lines.push('W_net_J,' + e.wnet.toFixed(2));
    lines.push('Q_out_J,' + e.qout.toFixed(2));
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'thermodynamics_' + cycleType + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function exportPNG() {
    // Watermark + export
    var ctxW = ctx; ctxW.save();
    ctxW.font = 'bold 10px Segoe UI, sans-serif'; ctxW.fillStyle = 'rgba(245,200,66,0.55)';
    ctxW.textAlign = 'right'; ctxW.fillText('NHIT VisualLab', 890, 472);
    ctxW.restore();
    var data = cvs.toDataURL('image/png');
    var a = document.createElement('a'); a.href = data; a.download = 'thermodynamics_' + cycleType + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    render();
  }
  btnCSV.addEventListener('click', exportCSV);
  btnPNG.addEventListener('click', exportPNG);

  /* ================================================================
     PRESETS
     ================================================================ */
  var PRESETS = {
    carnot: { cycle: 'carnot', thot: 800, tcold: 300, cr: 4, pr: 8, rc: 2.5 },
    otto:   { cycle: 'otto', thot: 1500, tcold: 300, cr: 10, pr: 8, rc: 2.5 },
    diesel: { cycle: 'diesel', thot: 1500, tcold: 300, cr: 18, pr: 8, rc: 2.5 },
    brayton:{ cycle: 'brayton', thot: 1400, tcold: 300, cr: 8, pr: 12, rc: 2.5 }
  };
  document.querySelector('.preset-row').addEventListener('click', function (e) {
    var btn = e.target.closest('.preset-btn'); if (!btn) return;
    var p = PRESETS[btn.dataset.preset]; if (!p) return;
    document.querySelectorAll('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    cycleType = p.cycle;
    cycleTabs.querySelectorAll('.pill').forEach(function (pill) {
      pill.classList.toggle('active', pill.dataset.cycle === p.cycle);
    });
    Thot = p.thot; Tcold = p.tcold;
    compressionRatio = p.cr; pressureRatio = p.pr; cutoffRatio = p.rc;
    slThot.value = p.thot; slTcold.value = p.tcold; slCR.value = p.cr; slPR.value = p.pr; slRC.value = p.rc;
    _learnCache = { eq: '', st: '', co: '' };
    updateSliderVisibility(); updateReadouts();
  });

  /* ================================================================
     EXPLORE
     ================================================================ */
  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildConceptGrid(); exploreItem = null; itemInfo.style.display = 'none';
  });
  function buildConceptGrid() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    conceptGrid.innerHTML = '';
    filtered.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (exploreItem && exploreItem.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        conceptGrid.querySelectorAll('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        exploreItem = c; showConceptInfo(c);
      });
      conceptGrid.appendChild(btn);
    });
  }
  function showConceptInfo(c) {
    itemInfo.style.display = '';
    itemInfo.innerHTML =
      '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>' +
      '<div class="example-box"><h4>Example</h4><p class="ex-problem">' + c.example.problem + '</p>' +
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s.replace(/([0-9.]+\s*(?:J|kJ|Pa|kPa|m\/s|N|%|K|J\/K|m³|cm³)?\s*$)/g, '<strong>$1</strong>') + '</p>'; }).join('') +
      '</div>';
    if (c.diagram) drawMiniDiagram(c.diagram);
  }

  /* ================================================================
     PRACTICE
     ================================================================ */
  var ppPrompt = $('pp-prompt'), ppInput = $('pp-input'), ppUnit = $('pp-unit'),
      ppCheck = $('pp-check'), ppNext = $('pp-next'), ppFeedback = $('pp-feedback'),
      ppSolution = $('pp-solution'), pbarScoreVal = $('pbar-score-val');
  function newPracticeProblem() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    currentProblem = gen();
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = ''; ppInput.disabled = false;
    ppFeedback.textContent = ''; ppFeedback.className = 'feedback';
    ppCheck.style.display = ''; ppNext.style.display = 'none';
    ppSolution.style.display = 'none'; pAnswered = false;
  }
  ppCheck.addEventListener('click', function () {
    if (pAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) { ppFeedback.textContent = 'Enter a number.'; ppFeedback.className = 'feedback err'; return; }
    pAnswered = true; pTotal++;
    var tol = currentProblem.tol || 0.5;
    var correct = Math.abs(userVal - currentProblem.answer) <= tol;
    if (correct) { pCorrect++; ppFeedback.textContent = 'Correct!'; ppFeedback.className = 'feedback ok'; }
    else { ppFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit; ppFeedback.className = 'feedback err'; }
    pbarScoreVal.textContent = pCorrect + ' / ' + pTotal;
    ppInput.disabled = true; ppCheck.style.display = 'none'; ppNext.style.display = '';
    ppSolution.style.display = '';
    ppSolution.innerHTML = '<h4>Solution</h4>' + currentProblem.steps.map(function (s) {
      return '<p class="sol-step">' + s.replace(/([0-9.]+\s*(?:J|kJ|Pa|kPa|m\/s|N|%|K|J\/K|m³|cm³)?\s*$)/g, '<strong>$1</strong>') + '</p>';
    }).join('');
  });
  ppNext.addEventListener('click', function () { newPracticeProblem(); });
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') ppCheck.click(); });

  /* ================================================================
     QUIZ
     ================================================================ */
  function startQuiz() {
    /* Shuffle each multiple-choice question's OPTIONS as well as the question
       order. Every authored MCQ places its answer at index 1 or 2 and never at
       0 or 3, so guessing between the two middle options gave a 50% baseline
       instead of 25%.

       Only entries carrying `opts` are touched: this pool mixes MCQ questions
       (where `ans` is an option index) with numeric ones (where `ans` is the
       value itself), and re-pointing the latter would corrupt them. Each
       question is copied rather than mutated so the pool survives a restart. */
    quizSet = shuffle(QUIZ_POOL.slice()).slice(0, QUIZ_SIZE).map(function (q) {
      if (!q.opts || !q.opts.length) return q;
      var order = q.opts.map(function (o, i) { return { o: o, i: i }; });
      shuffle(order);
      var copy = {};
      for (var k in q) if (Object.prototype.hasOwnProperty.call(q, k)) copy[k] = q[k];
      copy.opts = order.map(function (e) { return e.o; });
      copy.ans = order.findIndex(function (e) { return e.i === q.ans; });
      return copy;
    });
    quizIdx = 0; quizScore = 0; quizAnswers = []; quizLocked = false;
    quizResult.style.display = 'none';
    quizPanel.style.display = ''; quizBar.style.display = '';
    showQuizQuestion();
  }
  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    $('qbar-num').textContent = quizIdx + 1;
    var html = '<p class="qp-prompt">' + q.q + '</p>';
    if (q.type === 'numeric') {
      html += '<div class="quiz-input-row"><input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer"><span class="qi-unit">' + (q.unit || '') + '</span></div>';
      html += '<div style="display:flex;gap:10px;flex-wrap:wrap;"><button class="btn btn-primary" id="q-submit">Submit</button><button class="btn btn-ghost" id="q-next" style="display:none;">Next →</button></div>';
      html += '<p class="quiz-feedback" id="q-feedback"></p>';
    } else {
      var opts = q.opts.slice();
      html += '<div class="answer-grid">';
      for (var i = 0; i < opts.length; i++) html += '<button class="answer-btn" data-idx="' + i + '">' + opts[i] + '</button>';
      html += '</div>';
      html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;"><button class="btn btn-ghost" id="q-next" style="display:none;">Next →</button></div>';
      html += '<p class="quiz-feedback" id="q-feedback"></p>';
    }
    quizPanel.innerHTML = html; quizLocked = false;
    if (q.type === 'numeric') {
      $('q-submit').addEventListener('click', submitNumericQuiz);
      $('qi-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') submitNumericQuiz(); });
    } else {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { submitMCQQuiz(+btn.dataset.idx); });
      });
    }
    var nextBtn = $('q-next'); if (nextBtn) nextBtn.addEventListener('click', nextQuizQuestion);
  }
  function submitMCQQuiz(chosen) {
    if (quizLocked) return; quizLocked = true;
    var q = quizSet[quizIdx], correct = chosen === q.ans;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.q, given: q.opts[chosen], correct: q.opts[q.ans], ok: correct });
    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b) {
      var idx = +b.dataset.idx; b.classList.add('locked');
      if (idx === q.ans) b.classList.add('correct');
      else if (idx === chosen && !correct) b.classList.add('wrong');
    });
    var fb = $('q-feedback');
    fb.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.opts[q.ans];
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    $('q-next').style.display = '';
  }
  function submitNumericQuiz() {
    if (quizLocked) return;
    var inp = $('qi-input'); var val = parseFloat(inp.value);
    if (isNaN(val)) return;
    quizLocked = true;
    var q = quizSet[quizIdx]; var tol = q.tol || 0.5;
    var correct = Math.abs(val - q.ans) <= tol;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.q, given: val + ' ' + (q.unit || ''), correct: q.ans + ' ' + (q.unit || ''), ok: correct });
    var fb = $('q-feedback');
    fb.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.ans + ' ' + (q.unit || '');
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
    inp.disabled = true; $('q-submit').disabled = true; $('q-next').style.display = '';
  }
  function nextQuizQuestion() { quizIdx++; if (quizIdx >= QUIZ_SIZE) showQuizResult(); else showQuizQuestion(); }
  function showQuizResult() {
    quizPanel.style.display = 'none'; quizBar.style.display = 'none'; quizResult.style.display = '';
    var pct = quizScore / QUIZ_SIZE;
    var cls = pct >= 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct >= 1 ? '★★★' : pct >= 0.6 ? '★★' : '★';
    var verdict = pct >= 1 ? 'Perfect score!' : pct >= 0.6 ? 'Good work!' : 'Keep practising!';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</span><span class="qr-verdict">' + verdict + '</span></div></div>';
    html += '<div class="qr-rows">';
    for (var i = 0; i < quizAnswers.length; i++) {
      var a = quizAnswers[i];
      html += '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + a.q + ' — Your answer: <strong>' + a.given + '</strong>' + (a.ok ? '' : ' (Correct: ' + a.correct + ')') + '</span><span class="qr-mark">' + (a.ok ? '✓' : '✗') + '</span></div>';
    }
    html += '</div><button class="btn btn-primary" id="q-retry">New Quiz</button>';
    quizResult.innerHTML = html;
    $('q-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     CONTEXT MENU (right-click on canvas)
     ================================================================ */
  cvs.addEventListener('contextmenu', function (e) {
    if (mode !== 'simulate') return;
    e.preventDefault();
    var vw = window.innerWidth, vh = window.innerHeight;
    var mw = 220, mh = 220;
    var x = Math.min(e.clientX, vw - mw - 10);
    var y = Math.min(e.clientY, vh - mh - 10);
    ctxMenu.style.left = x + 'px'; ctxMenu.style.top = y + 'px';
    ctxMenu.style.display = 'block';
  });
  document.addEventListener('click', function (e) {
    if (!ctxMenu.contains(e.target)) ctxMenu.style.display = 'none';
  });
  ctxMenu.addEventListener('click', function (e) {
    var btn = e.target.closest('.ctx-item'); if (!btn) return;
    var act = btn.dataset.act;
    if (act === 'copy-eff') {
      var v = (getEfficiency() * 100).toFixed(2) + '%';
      if (navigator.clipboard) navigator.clipboard.writeText(v);
    } else if (act === 'csv') exportCSV();
    else if (act === 'png') exportPNG();
    else if (act === 'toggle-labels') { chkLabels.checked = !chkLabels.checked; chkLabels.dispatchEvent(new Event('change')); render(); }
    else if (act === 'reset') {
      Thot = 800; Tcold = 300; compressionRatio = 8; pressureRatio = 8; cutoffRatio = 2.5;
      slThot.value = 800; slTcold.value = 300; slCR.value = 8; slPR.value = 8; slRC.value = 2.5;
      phase = 0; phaseProgress = 0;
      _learnCache = { eq: '', st: '', co: '' };
      updateReadouts();
    }
    ctxMenu.style.display = 'none';
  });

  /* ================================================================
     LEARN-PANEL EXPAND/COLLAPSE
     ================================================================ */
  (function wireLearnPanels() {
    var expAll = $('learn-expand-all'), colAll = $('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () {
      cards.forEach(function (c) { c.open = true; });
      drawTSDiagram();
    });
    if (colAll) colAll.addEventListener('click', function () {
      cards.forEach(function (c) { c.open = false; });
    });
    var tsCard = $('lp-ts');
    if (tsCard) tsCard.addEventListener('toggle', function () { if (tsCard.open) drawTSDiagram(); });
  })();

  /* ================================================================
     INIT
     ================================================================ */
  updateSliderVisibility();
  resizeCanvas();
  updateReadouts();
  animate();

})();
