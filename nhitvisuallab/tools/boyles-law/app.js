(function () {
  'use strict';

  /* ================================================================
     DOM REFS
     ================================================================ */
  var canvas = document.getElementById('sim-canvas');
  var ctx    = canvas.getContext('2d');

  var slVolume  = document.getElementById('sl-volume');
  var svVolume  = document.getElementById('sv-volume');
  var slTemp    = document.getElementById('sl-temp');
  var svTemp    = document.getElementById('sv-temp');

  var rPressure = document.getElementById('r-pressure');
  var rVolume   = document.getElementById('r-volume');
  var rPV       = document.getElementById('r-pv');
  var rTemp     = document.getElementById('r-temp');
  var rGas      = document.getElementById('r-gas');

  var simPanel      = document.getElementById('sim-panel');
  var catRow        = document.getElementById('cat-row');
  var itemSelector  = document.getElementById('item-selector');
  var conceptGrid   = document.getElementById('concept-grid');
  var itemInfo      = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar   = document.getElementById('practice-bar');
  var ppPrompt      = document.getElementById('pp-prompt');
  var ppInput       = document.getElementById('pp-input');
  var ppUnit        = document.getElementById('pp-unit');
  var ppCheck       = document.getElementById('pp-check');
  var ppShow        = document.getElementById('pp-show');
  var ppNext        = document.getElementById('pp-next');
  var ppFeedback    = document.getElementById('pp-feedback');
  var ppSolution    = document.getElementById('pp-solution');
  var pbarScoreVal  = document.getElementById('pbar-score-val');
  var quizPanel     = document.getElementById('quiz-panel');
  var quizBar       = document.getElementById('quiz-bar');
  var qbarNum       = document.getElementById('qbar-num');
  var quizResult    = document.getElementById('quiz-result');

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var gasType = 'air';

  /* Gas species. For an IDEAL gas the amount n is fixed by P, V and T alone \u2014
     it does NOT depend on which gas is in the cylinder, so every species here
     shares the same n and therefore the same PV product. What genuinely differs
     between species is the MOLAR MASS M, which sets the root-mean-square
     molecular speed  v_rms = sqrt(3RT/M).  Light helium molecules move ~2.7x
     faster than air; heavy CO2 ~0.8x. That is the physically real difference
     and it is what the animation shows. */
  var M_REF = 28.97;                       // g/mol, air \u2014 speeds are drawn relative to this
  var GAS_DATA = {
    air:    { name: 'Air',    M: 28.97, color: '#4dd0e1' },
    helium: { name: 'Helium', M: 4.003, color: '#80deea' },
    co2:    { name: 'CO\u2082', M: 44.01, color: '#4db6ac' }
  };

  // Initial conditions
  var R_GAS = 8.314;      // L*kPa/(mol*K)  \u2014 numerically identical to J/(mol*K)
  var N_MOL = 0.040628;   // mol; = P1*V1/(R*T1) = 101.325*1.0/(8.314*300)
  var T  = 300;           // K \u2014 held constant while volume changes (Boyle)
  var T_PREV = null;      // previous isotherm, ghosted on the chart
  var PV_CONST = N_MOL * R_GAS * T;   // = 101.325 kPa*L at 300 K

  var volume   = 1.0;                 // L
  var pressure = PV_CONST / volume;   // kPa — 101.325 at the default isotherm

  // Gas particles
  var NUM_PARTICLES = 60;
  var particles = [];

  // P-V diagram trail
  var pvTrail = [];
  var MAX_TRAIL = 200;

  // Canvas sizing
  var W = 900, H = 480;
  var DPR = window.devicePixelRatio || 1;

  // Animation
  var animId = null;

  // Piston drag state
  var dragging = false;
  var hasDragged = false;

  /* ── Practice state ── */
  var practiceScore = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;

  /* ── Quiz state ── */
  var QUIZ_SIZE = 5;
  var quizPool = [];
  var quizSet = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* ── Explore state ── */
  var exploreCat = 'basics';
  var selectedConcept = null;

  /* ================================================================
     CONCEPTS (Explore mode)
     ================================================================ */
  var CONCEPTS = [
    /* ── Gas Laws Basics ── */
    { id: 'gas-pressure', name: 'Gas Pressure', symbol: 'P = F/A',
      formula: 'P = F/A', unit: 'Pa (N/m\u00B2)', cat: 'basics',
      desc: 'Gas pressure is the force per unit area exerted by gas molecules colliding with the walls of their container. At the molecular level, billions of molecules strike the container walls every second. The cumulative effect of these collisions creates a measurable macroscopic pressure. Standard atmospheric pressure is 101,325 Pa (101.325 kPa or 1 atm).',
      example: { problem: 'A gas exerts a total force of 5000 N on a container wall with area 0.05 m\u00B2. What is the pressure?', steps: ['P = F / A', 'P = 5000 / 0.05', 'P = 100,000 Pa', 'P = 100 kPa'], answer: 100 }
    },
    { id: 'temperature-ke', name: 'Temperature & KE', symbol: 'KE = \u00BEkT',
      formula: 'KE_avg = (3/2)k_B T', unit: 'J', cat: 'basics',
      desc: 'Temperature is a measure of the average kinetic energy of gas molecules. The relationship is KE_avg = (3/2)k_B T, where k_B = 1.381\u00D710\u207B\u00B2\u00B3 J/K is Boltzmann\'s constant and T is absolute temperature in Kelvin. Higher temperature means faster-moving molecules, which leads to more forceful and frequent collisions with container walls, increasing pressure.',
      example: { problem: 'What is the average kinetic energy of a gas molecule at 300 K? (k_B = 1.381\u00D710\u207B\u00B2\u00B3 J/K)', steps: ['KE = (3/2) \u00D7 k_B \u00D7 T', 'KE = 1.5 \u00D7 1.381\u00D710\u207B\u00B2\u00B3 \u00D7 300', 'KE = 1.5 \u00D7 4.143\u00D710\u207B\u00B2\u00B9', 'KE = 6.21\u00D710\u207B\u00B2\u00B9 J'], answer: 6.21e-21 }
    },
    { id: 'ideal-gas-assumptions', name: 'Ideal Gas Assumptions', symbol: 'PV = nRT',
      formula: 'PV = nRT', unit: 'various', cat: 'basics',
      desc: 'An ideal gas is a theoretical model where: (1) gas molecules have negligible volume compared to the container, (2) there are no intermolecular forces between molecules, (3) collisions are perfectly elastic, and (4) molecules are in constant random motion. Real gases approximate ideal behavior at high temperatures and low pressures.',
      example: { problem: 'Find the volume of 1 mol of ideal gas at 273 K and 101.325 kPa. (R = 8.314 J/mol\u00B7K)', steps: ['PV = nRT', 'V = nRT / P', 'V = 1 \u00D7 8.314 \u00D7 273 / 101325', 'V = 0.02241 m\u00B3 = 22.41 L'], answer: 22.41 }
    },
    { id: 'stp-conditions', name: 'STP Conditions', symbol: '0\u00B0C, 1 atm',
      formula: 'T = 273.15 K, P = 101.325 kPa', unit: 'K, kPa', cat: 'basics',
      desc: 'Standard Temperature and Pressure (STP) is defined as 0\u00B0C (273.15 K) and 1 atmosphere (101.325 kPa). At STP, one mole of an ideal gas occupies exactly 22.414 liters. STP provides a common reference point for comparing gas properties and performing calculations across different experimental conditions.',
      example: { problem: 'A gas occupies 5 L at STP. How many moles does it contain?', steps: ['At STP, 1 mol = 22.414 L', 'n = V / 22.414', 'n = 5 / 22.414', 'n = 0.223 mol'], answer: 0.223 }
    },

    /* ── Boyle's Law ── */
    { id: 'boyles-law-def', name: 'Boyle\'s Law Definition', symbol: 'PV = const',
      formula: 'P\u2081V\u2081 = P\u2082V\u2082 (at constant T)', unit: 'kPa\u00B7L', cat: 'boyles',
      desc: 'Boyle\'s Law states that for a fixed amount of gas at constant temperature, the pressure of the gas is inversely proportional to its volume: P \u221D 1/V. Mathematically, PV = constant, or P\u2081V\u2081 = P\u2082V\u2082. When volume decreases, pressure increases proportionally, and vice versa. This is because compressing the gas forces molecules into a smaller space, causing more frequent wall collisions.',
      example: { problem: 'A gas has P\u2081 = 100 kPa, V\u2081 = 2.0 L. Find P\u2082 when V\u2082 = 0.5 L (constant T).', steps: ['P\u2081V\u2081 = P\u2082V\u2082', '100 \u00D7 2.0 = P\u2082 \u00D7 0.5', '200 = 0.5 \u00D7 P\u2082', 'P\u2082 = 200 / 0.5 = 400 kPa'], answer: 400 }
    },
    { id: 'pv-diagram', name: 'P-V Diagram', symbol: 'Hyperbola',
      formula: 'P = k/V (rectangular hyperbola)', unit: 'kPa vs L', cat: 'boyles',
      desc: 'On a Pressure-Volume (P-V) diagram, Boyle\'s Law produces a rectangular hyperbola. Each curve, called an isotherm, represents all possible P-V states at a given temperature. The area under the curve between two volumes represents the work done by or on the gas during expansion or compression. Higher temperature isotherms lie further from the origin.',
      example: { problem: 'A gas at 300 K has PV = 200 kPa\u00B7L. What is P when V = 4.0 L?', steps: ['P = PV_constant / V', 'P = 200 / 4.0', 'P = 50 kPa', 'This point lies on the 300 K isotherm.'], answer: 50 }
    },
    { id: 'isothermal-process', name: 'Isothermal Process', symbol: '\u0394T = 0',
      formula: 'W = nRT ln(V\u2082/V\u2081) = P\u2081V\u2081 ln(V\u2082/V\u2081)', unit: 'J', cat: 'boyles',
      desc: 'An isothermal process occurs at constant temperature. For an ideal gas undergoing isothermal expansion or compression, the work done is W = nRT\u00B7ln(V\u2082/V\u2081). During isothermal expansion, the gas does positive work on the surroundings (W > 0). During isothermal compression, work is done on the gas (W < 0). Heat must be exchanged with the surroundings to maintain constant temperature.',
      example: { problem: 'A gas (PV = 101.325 kPa\u00B7L) expands isothermally from 1.0 L to 2.0 L. Find work done.', steps: ['W = P\u2081V\u2081 \u00D7 ln(V\u2082/V\u2081)', 'W = 101.325 \u00D7 ln(2.0/1.0)', 'W = 101.325 \u00D7 0.6931', 'W = 70.2 J (converting kPa\u00B7L to J)'], answer: 70.2 }
    },
    { id: 'inverse-proportion', name: 'Inverse Proportion', symbol: 'P \u221D 1/V',
      formula: 'P = k/V where k = nRT', unit: 'kPa', cat: 'boyles',
      desc: 'Boyle\'s Law describes an inverse proportion between pressure and volume. If you double the volume, the pressure halves. If you triple the volume, the pressure becomes one-third. Graphically, P vs V gives a hyperbola, while P vs 1/V gives a straight line through the origin with slope k = nRT. This linear relationship is often used to verify Boyle\'s Law experimentally.',
      example: { problem: 'A gas at 200 kPa occupies 3 L. What pressure is needed to compress it to 1 L?', steps: ['P\u2081V\u2081 = P\u2082V\u2082', '200 \u00D7 3 = P\u2082 \u00D7 1', '600 = P\u2082', 'P\u2082 = 600 kPa (3\u00D7 the original pressure)'], answer: 600 }
    },

    /* ── Applications ── */
    { id: 'scuba-diving', name: 'Scuba Diving', symbol: 'Depth \u2192 P',
      formula: 'P_total = P_atm + \u03C1gh', unit: 'kPa', cat: 'applications',
      desc: 'In scuba diving, water pressure increases by approximately 101.325 kPa (1 atm) for every 10 meters of depth. By Boyle\'s Law, the air in a diver\'s lungs compresses at depth and expands upon ascent. A diver at 30 m depth (4 atm total) has lung gas at 1/4 its surface volume. Ascending too quickly without exhaling can cause pulmonary barotrauma as the gas rapidly expands.',
      example: { problem: 'A diver\'s lungs hold 6 L of air at the surface (1 atm). What volume does the air occupy at 20 m depth (3 atm)?', steps: ['P\u2081V\u2081 = P\u2082V\u2082', '1 \u00D7 6 = 3 \u00D7 V\u2082', 'V\u2082 = 6 / 3', 'V\u2082 = 2 L (compressed to 1/3)'], answer: 2 }
    },
    { id: 'syringe', name: 'Syringe Mechanism', symbol: 'V\u2191 \u2192 P\u2193',
      formula: 'P_inside < P_outside \u2192 fluid drawn in', unit: 'kPa', cat: 'applications',
      desc: 'A syringe works directly on Boyle\'s Law. Pulling the plunger back increases the internal volume, which decreases the pressure inside the barrel below atmospheric pressure. This pressure difference forces fluid (medication, blood sample) into the syringe through the needle. Pushing the plunger decreases volume, increasing pressure, which forces fluid out.',
      example: { problem: 'A syringe barrel has 2 mL of air at 101.3 kPa. The plunger is pulled to 10 mL. What is the new pressure?', steps: ['P\u2081V\u2081 = P\u2082V\u2082', '101.3 \u00D7 2 = P\u2082 \u00D7 10', '202.6 = 10 P\u2082', 'P\u2082 = 20.26 kPa (vacuum created)'], answer: 20.26 }
    },
    { id: 'breathing', name: 'Human Breathing', symbol: 'Diaphragm',
      formula: 'V_lung\u2191 \u2192 P_lung\u2193 \u2192 inhalation', unit: 'kPa', cat: 'applications',
      desc: 'Breathing is a direct application of Boyle\'s Law. During inhalation, the diaphragm contracts and moves downward, increasing the thoracic cavity volume. By Boyle\'s Law, this decreases lung pressure below atmospheric pressure, causing air to flow in. During exhalation, the diaphragm relaxes, decreasing lung volume, increasing pressure above atmospheric, pushing air out.',
      example: { problem: 'Lung volume increases from 2.5 L to 3.0 L during inhalation. If initial lung pressure is 101.3 kPa, find the new pressure.', steps: ['P\u2081V\u2081 = P\u2082V\u2082', '101.3 \u00D7 2.5 = P\u2082 \u00D7 3.0', '253.25 = 3.0 P\u2082', 'P\u2082 = 84.4 kPa (below atmospheric)'], answer: 84.4 }
    },
    { id: 'hydraulic-press', name: 'Pneumatic Systems', symbol: 'Compressor',
      formula: 'P\u2082 = P\u2081V\u2081/V\u2082', unit: 'kPa', cat: 'applications',
      desc: 'Pneumatic systems (air brakes, nail guns, paint sprayers) compress air into small tanks at high pressure using Boyle\'s Law. A compressor reduces the volume of atmospheric air, dramatically increasing its pressure. When released through a valve, the compressed air expands rapidly, doing useful work. Air brakes on trucks use this principle for reliable stopping power.',
      example: { problem: 'An air compressor takes 50 L of air at 101 kPa and compresses it into a 5 L tank. What is the tank pressure?', steps: ['P\u2081V\u2081 = P\u2082V\u2082', '101 \u00D7 50 = P\u2082 \u00D7 5', '5050 = 5 P\u2082', 'P\u2082 = 1010 kPa (\u224810 atm)'], answer: 1010 }
    },

    /* ── Ideal Gas ── */
    { id: 'ideal-gas-law', name: 'Ideal Gas Law', symbol: 'PV = nRT',
      formula: 'PV = nRT (R = 8.314 J/mol\u00B7K)', unit: 'Pa\u00B7m\u00B3', cat: 'ideal',
      desc: 'The ideal gas law PV = nRT combines Boyle\'s Law (PV = const at fixed T), Charles\'s Law (V/T = const at fixed P), and Avogadro\'s Law (V/n = const at fixed T,P). R = 8.314 J/(mol\u00B7K) is the universal gas constant. When temperature is held constant (Boyle\'s Law), PV = nRT reduces to PV = constant since n, R, and T are all fixed.',
      example: { problem: 'Find the pressure of 0.5 mol of gas in a 10 L container at 350 K.', steps: ['PV = nRT', 'P = nRT / V', 'P = 0.5 \u00D7 8.314 \u00D7 350 / 0.01', 'P = 145,495 Pa = 145.5 kPa'], answer: 145.5 }
    },
    { id: 'gas-constant', name: 'Gas Constant R', symbol: 'R = 8.314',
      formula: 'R = 8.314 J/(mol\u00B7K)', unit: 'J/(mol\u00B7K)', cat: 'ideal',
      desc: 'The universal gas constant R = 8.314 J/(mol\u00B7K) appears in the ideal gas law PV = nRT. It can be expressed in different units: 8.314 J/(mol\u00B7K) = 8.314 Pa\u00B7m\u00B3/(mol\u00B7K) = 0.08314 L\u00B7bar/(mol\u00B7K) = 0.08206 L\u00B7atm/(mol\u00B7K). The value of R determines the relationship between the energy scale (joules) and the temperature scale (kelvin) for one mole of gas.',
      example: { problem: 'Convert R = 8.314 J/(mol\u00B7K) to L\u00B7kPa/(mol\u00B7K).', steps: ['1 J = 1 Pa\u00B7m\u00B3', '1 Pa\u00B7m\u00B3 = 0.001 kPa \u00D7 1000 L', '= 1 L\u00B7Pa = 0.001 L\u00B7kPa', 'R = 8.314 L\u00B7kPa/(mol\u00B7K)'], answer: 8.314 }
    },
    { id: 'real-gas-deviation', name: 'Real Gas Deviation', symbol: 'Z = PV/nRT',
      formula: 'Z = PV/(nRT), Z = 1 for ideal', unit: 'dimensionless', cat: 'ideal',
      desc: 'The compressibility factor Z = PV/(nRT) measures how much a real gas deviates from ideal behavior. For an ideal gas, Z = 1 exactly. At high pressures, Z > 1 (molecules have finite volume, hard to compress further). At moderate pressures with strong intermolecular forces, Z < 1 (attractions pull molecules together). Helium behaves most ideally; CO\u2082 deviates significantly near its critical point.',
      example: { problem: 'A gas has P = 500 kPa, V = 2 L, n = 0.5 mol, T = 300 K. Find Z. (R = 8.314 L\u00B7kPa/mol\u00B7K)', steps: ['Z = PV / (nRT)', 'Z = (500 \u00D7 2) / (0.5 \u00D7 8.314 \u00D7 300)', 'Z = 1000 / 1247.1', 'Z = 0.802 (below ideal)'], answer: 0.802 }
    },
    { id: 'daltons-law', name: 'Dalton\'s Law', symbol: 'P_total = \u03A3P_i',
      formula: 'P_total = P\u2081 + P\u2082 + ... + P_n', unit: 'kPa', cat: 'ideal',
      desc: 'Dalton\'s Law of Partial Pressures states that the total pressure of a gas mixture equals the sum of the partial pressures of each component gas. Each component gas behaves as if it alone occupies the entire volume. The partial pressure of gas i is P_i = x_i \u00D7 P_total, where x_i is the mole fraction. This law extends Boyle\'s Law to gas mixtures.',
      example: { problem: 'A container has 0.3 mol N\u2082 and 0.1 mol O\u2082 in 5 L at 300 K. Find total pressure (R = 8.314 L\u00B7kPa/mol\u00B7K).', steps: ['n_total = 0.3 + 0.1 = 0.4 mol', 'P = nRT/V', 'P = 0.4 \u00D7 8.314 \u00D7 300 / 5', 'P = 199.5 kPa'], answer: 199.5 }
    }
  ];

  /* ================================================================
     PRACTICE PROBLEMS (12 generators)
     ================================================================ */
  function randBetween(a, b) { return a + Math.random() * (b - a); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function r1(v) { return Math.round(v * 10) / 10; }
  function r3(v) { return Math.round(v * 1000) / 1000; }

  function generatePractice() {
    var generators = [
      // 1. Find P2 given P1, V1, V2
      function () {
        var p1 = r1(randBetween(50, 500));
        var v1 = r2(randBetween(0.5, 5));
        var v2 = r2(randBetween(0.3, 4));
        while (Math.abs(v1 - v2) < 0.2) v2 = r2(randBetween(0.3, 4));
        var p2 = r2(p1 * v1 / v2);
        return {
          prompt: 'A gas has P\u2081 = ' + p1 + ' kPa and V\u2081 = ' + v1 + ' L. If the volume changes to V\u2082 = ' + v2 + ' L at constant temperature, find P\u2082.',
          answer: p2, unit: 'kPa', tolerance: 1,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', p1 + ' \u00D7 ' + v1 + ' = P\u2082 \u00D7 ' + v2, 'P\u2082 = ' + r2(p1 * v1) + ' / ' + v2, 'P\u2082 = ' + p2 + ' kPa']
        };
      },
      // 2. Find V2 given P1, V1, P2
      function () {
        var p1 = r1(randBetween(50, 400));
        var v1 = r2(randBetween(1, 8));
        var p2 = r1(randBetween(60, 600));
        while (Math.abs(p1 - p2) < 20) p2 = r1(randBetween(60, 600));
        var v2 = r2(p1 * v1 / p2);
        return {
          prompt: 'A gas at P\u2081 = ' + p1 + ' kPa occupies V\u2081 = ' + v1 + ' L. What volume will it occupy at P\u2082 = ' + p2 + ' kPa? (constant T)',
          answer: v2, unit: 'L', tolerance: 0.05,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'V\u2082 = P\u2081V\u2081 / P\u2082', 'V\u2082 = ' + p1 + ' \u00D7 ' + v1 + ' / ' + p2, 'V\u2082 = ' + v2 + ' L']
        };
      },
      // 3. Find P1 given V1, P2, V2
      function () {
        var v1 = r2(randBetween(1, 6));
        var p2 = r1(randBetween(80, 500));
        var v2 = r2(randBetween(0.5, 5));
        while (Math.abs(v1 - v2) < 0.3) v2 = r2(randBetween(0.5, 5));
        var p1 = r2(p2 * v2 / v1);
        return {
          prompt: 'A gas is compressed from V\u2081 = ' + v1 + ' L to V\u2082 = ' + v2 + ' L. The final pressure is P\u2082 = ' + p2 + ' kPa. What was the initial pressure P\u2081?',
          answer: p1, unit: 'kPa', tolerance: 1,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'P\u2081 = P\u2082V\u2082 / V\u2081', 'P\u2081 = ' + p2 + ' \u00D7 ' + v2 + ' / ' + v1, 'P\u2081 = ' + p1 + ' kPa']
        };
      },
      // 4. Find V1 given P1, P2, V2
      function () {
        var p1 = r1(randBetween(80, 300));
        var p2 = r1(randBetween(100, 600));
        var v2 = r2(randBetween(0.5, 4));
        while (Math.abs(p1 - p2) < 20) p2 = r1(randBetween(100, 600));
        var v1 = r2(p2 * v2 / p1);
        return {
          prompt: 'A gas at P\u2081 = ' + p1 + ' kPa is compressed to P\u2082 = ' + p2 + ' kPa, giving V\u2082 = ' + v2 + ' L. What was V\u2081?',
          answer: v1, unit: 'L', tolerance: 0.05,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'V\u2081 = P\u2082V\u2082 / P\u2081', 'V\u2081 = ' + p2 + ' \u00D7 ' + v2 + ' / ' + p1, 'V\u2081 = ' + v1 + ' L']
        };
      },
      // 5. Scuba diving depth problem
      function () {
        var depth = Math.round(randBetween(10, 40));
        var surfaceVol = r1(randBetween(4, 8));
        var pSurface = 101.325;
        var pDepth = r1(pSurface + depth * 10.1325); // ~10.1 kPa per meter
        var vDepth = r2(pSurface * surfaceVol / pDepth);
        return {
          prompt: 'A scuba diver takes a breath of ' + surfaceVol + ' L at the surface (101.3 kPa). At ' + depth + ' m depth, the total pressure is ' + r1(pDepth) + ' kPa. What volume does the air occupy at depth?',
          answer: vDepth, unit: 'L', tolerance: 0.1,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'V\u2082 = P\u2081V\u2081 / P\u2082', 'V\u2082 = 101.3 \u00D7 ' + surfaceVol + ' / ' + r1(pDepth), 'V\u2082 = ' + vDepth + ' L']
        };
      },
      // 6. Syringe problem
      function () {
        var v1 = r1(randBetween(2, 5));
        var v2 = r1(randBetween(8, 20));
        var p1 = 101.3;
        var p2 = r2(p1 * v1 / v2);
        return {
          prompt: 'A syringe contains ' + v1 + ' mL of air at atmospheric pressure (101.3 kPa). The plunger is pulled back to ' + v2 + ' mL. What is the pressure inside the syringe?',
          answer: p2, unit: 'kPa', tolerance: 0.5,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'P\u2082 = P\u2081V\u2081 / V\u2082', 'P\u2082 = 101.3 \u00D7 ' + v1 + ' / ' + v2, 'P\u2082 = ' + p2 + ' kPa']
        };
      },
      // 7. Compressor problem
      function () {
        var v1 = Math.round(randBetween(20, 100));
        var v2 = r1(randBetween(2, 10));
        var p1 = 101.3;
        var p2 = r1(p1 * v1 / v2);
        return {
          prompt: 'An air compressor takes ' + v1 + ' L of air at 101.3 kPa and compresses it into a ' + v2 + ' L tank. What is the pressure in the tank?',
          answer: p2, unit: 'kPa', tolerance: 5,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'P\u2082 = P\u2081V\u2081 / V\u2082', 'P\u2082 = 101.3 \u00D7 ' + v1 + ' / ' + v2, 'P\u2082 = ' + p2 + ' kPa']
        };
      },
      // 8. PV product verification
      function () {
        var p1 = r1(randBetween(50, 300));
        var v1 = r2(randBetween(1, 5));
        var pv = r2(p1 * v1);
        var v2 = r2(randBetween(0.5, 4));
        while (Math.abs(v1 - v2) < 0.3) v2 = r2(randBetween(0.5, 4));
        var p2 = r2(pv / v2);
        return {
          prompt: 'The PV product of a gas is ' + pv + ' kPa\u00B7L (constant T). What pressure does the gas have at V = ' + v2 + ' L?',
          answer: p2, unit: 'kPa', tolerance: 1,
          steps: ['PV = constant = ' + pv, 'P = PV / V', 'P = ' + pv + ' / ' + v2, 'P = ' + p2 + ' kPa']
        };
      },
      // 9. Unit conversion: atm to kPa
      function () {
        var pAtm = r2(randBetween(0.5, 5));
        var v1 = r1(randBetween(1, 10));
        var p1kPa = r2(pAtm * 101.325);
        var v2 = r2(randBetween(0.5, 8));
        while (Math.abs(v1 - v2) < 0.3) v2 = r2(randBetween(0.5, 8));
        var p2kPa = r2(p1kPa * v1 / v2);
        return {
          prompt: 'A gas at ' + pAtm + ' atm occupies ' + v1 + ' L. Convert pressure to kPa and find P\u2082 when V\u2082 = ' + v2 + ' L. (1 atm = 101.325 kPa)',
          answer: p2kPa, unit: 'kPa', tolerance: 2,
          steps: ['P\u2081 = ' + pAtm + ' atm = ' + p1kPa + ' kPa', 'P\u2081V\u2081 = P\u2082V\u2082', 'P\u2082 = ' + p1kPa + ' \u00D7 ' + v1 + ' / ' + v2, 'P\u2082 = ' + p2kPa + ' kPa']
        };
      },
      // 10. Balloon problem
      function () {
        var v1 = r1(randBetween(2, 6));
        var p1 = r1(randBetween(110, 200));
        var p2 = 101.3;
        var v2 = r2(p1 * v1 / p2);
        return {
          prompt: 'A balloon contains ' + v1 + ' L of gas at ' + p1 + ' kPa inside a pressurized cabin. The balloon is taken outside where pressure is 101.3 kPa. What is its new volume?',
          answer: v2, unit: 'L', tolerance: 0.1,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'V\u2082 = P\u2081V\u2081 / P\u2082', 'V\u2082 = ' + p1 + ' \u00D7 ' + v1 + ' / 101.3', 'V\u2082 = ' + v2 + ' L']
        };
      },
      // 11. Volume ratio problem
      function () {
        var ratio = Math.round(randBetween(2, 8));
        var p1 = r1(randBetween(80, 300));
        var p2 = r1(p1 * ratio);
        return {
          prompt: 'A gas is compressed to 1/' + ratio + ' of its original volume at constant temperature. If the initial pressure was ' + p1 + ' kPa, what is the final pressure?',
          answer: p2, unit: 'kPa', tolerance: 1,
          steps: ['V\u2082 = V\u2081/' + ratio, 'P\u2081V\u2081 = P\u2082V\u2082', 'P\u2082 = P\u2081 \u00D7 V\u2081 / (V\u2081/' + ratio + ')', 'P\u2082 = ' + p1 + ' \u00D7 ' + ratio + ' = ' + p2 + ' kPa']
        };
      },
      // 12. Breathing / lung problem
      function () {
        var v1 = r2(randBetween(2, 3));
        var v2 = r2(randBetween(3, 4));
        while (v2 <= v1) v2 = r2(randBetween(3, 4));
        var p1 = 101.3;
        var p2 = r2(p1 * v1 / v2);
        return {
          prompt: 'During inhalation, lung volume increases from ' + v1 + ' L to ' + v2 + ' L. If initial lung pressure equals atmospheric (101.3 kPa), what is the new lung pressure?',
          answer: p2, unit: 'kPa', tolerance: 0.5,
          steps: ['P\u2081V\u2081 = P\u2082V\u2082', 'P\u2082 = P\u2081V\u2081 / V\u2082', 'P\u2082 = 101.3 \u00D7 ' + v1 + ' / ' + v2, 'P\u2082 = ' + p2 + ' kPa (below atmospheric \u2192 air flows in)']
        };
      }
    ];
    var idx = Math.floor(Math.random() * generators.length);
    return generators[idx]();
  }

  /* ================================================================
     QUIZ QUESTIONS (15 MCQ pool)
     ================================================================ */
  var QUIZ_POOL = [
    { q: 'Boyle\'s Law states that at constant temperature, PV equals:', options: ['A constant', 'Zero', 'nR', 'T/n'], correct: 0 },
    { q: 'If the volume of a gas is halved at constant temperature, the pressure:', options: ['Doubles', 'Halves', 'Stays the same', 'Quadruples'], correct: 0 },
    { q: 'The P-V curve for an isothermal process is a:', options: ['Rectangular hyperbola', 'Straight line', 'Parabola', 'Circle'], correct: 0 },
    { q: 'Which condition must remain constant for Boyle\'s Law to apply?', options: ['Temperature', 'Pressure', 'Volume', 'Density'], correct: 0 },
    { q: 'A gas at 200 kPa occupies 3 L. At constant T, what pressure gives 1 L?', options: ['600 kPa', '200 kPa', '66.7 kPa', '400 kPa'], correct: 0 },
    { q: 'Boyle\'s Law is expressed as:', options: ['P\u2081V\u2081 = P\u2082V\u2082', 'V\u2081/T\u2081 = V\u2082/T\u2082', 'PV = nRT', 'P\u2081/T\u2081 = P\u2082/T\u2082'], correct: 0 },
    { q: 'In a syringe, pulling the plunger back:', options: ['Increases volume, decreases pressure', 'Decreases volume, increases pressure', 'Increases both volume and pressure', 'Decreases both volume and pressure'], correct: 0 },
    { q: 'A scuba diver ascending from depth should:', options: ['Exhale to prevent lung overexpansion', 'Hold breath tightly', 'Inhale deeply', 'Breathe only through nose'], correct: 0 },
    { q: 'On a P-V diagram, different isotherms at higher temperatures are:', options: ['Further from the origin', 'Closer to the origin', 'Identical to lower temperature curves', 'Straight lines'], correct: 0 },
    { q: 'If PV = 500 kPa\u00B7L and V = 2.5 L, what is P?', options: ['200 kPa', '500 kPa', '1250 kPa', '100 kPa'], correct: 0 },
    { q: 'Which gas most closely follows Boyle\'s Law at room temperature?', options: ['Helium', 'Water vapor', 'Ammonia', 'Carbon dioxide'], correct: 0 },
    { q: 'The inverse relationship P \u221D 1/V means that a plot of P vs 1/V is:', options: ['A straight line through the origin', 'A hyperbola', 'An exponential curve', 'A horizontal line'], correct: 0 },
    { q: 'Boyle\'s Law fails at:', options: ['Very high pressures and low temperatures', 'Standard temperature and pressure', 'Moderate pressures', 'Any temperature above 0\u00B0C'], correct: 0 },
    { q: 'A balloon at sea level (1 atm) rises to altitude where pressure is 0.5 atm. Its volume:', options: ['Doubles', 'Halves', 'Stays the same', 'Triples'], correct: 0 },
    { q: 'The work done during isothermal expansion of an ideal gas is:', options: ['W = nRT ln(V\u2082/V\u2081)', 'W = P\u0394V', 'W = 0', 'W = nC\u1D65\u0394T'], correct: 0 }
  ];

  /* ================================================================
     PARTICLES INIT
     ================================================================ */
  function initParticles() {
    particles = [];
    for (var i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random(),   // normalized 0-1 within cylinder width
        y: Math.random(),   // normalized 0-1 within cylinder height
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
  }

  /* ================================================================
     CANVAS RESIZE
     ================================================================ */
  function resize() {
    DPR = window.devicePixelRatio || 1;   // re-read: it changes on zoom / monitor switch
    var rect = canvas.parentElement.getBoundingClientRect();
    W = Math.round(rect.width - 16);
    if (W < 40) W = 900;                  // never size the backing store off a pre-layout measurement
    // stacked layout needs a taller canvas to fit both panels
    H = Math.round(W < 860 ? W * 1.22 : W * 0.53);
    if (H < 300) H = 300;
    if (H > 760) H = 760;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ================================================================
     PHYSICS UPDATE
     ================================================================ */
  /* ── Single source of truth for scene geometry ──────────────────────
     draw(), drawPVDiagram(), the pointer gate and handleDrag ALL read this.
     Keeping one definition is what stops the drag hit-test from drifting away
     from the drawn piston when the layout changes.

     The side-by-side arrangement only clears when the piston handle stays left
     of the chart's rotated y-axis label:
         cylEnd + knob  <=  chartLeft - 34
         0.42W + 83     <=  0.55W - 34    =>   W >= 900
     Narrowing the barrel to 0.38W buys enough margin to drop that to ~860;
     below it the two panels stack instead. (At 720px the old side-by-side
     layout put the handle 17px INTO the axis caption.) */
  function geom() {
    var stacked = W < 860;
    var g = { stacked: stacked };
    if (stacked) {
      g.cylLeft   = 40;
      g.cylTop    = 34;
      g.cylWidth  = W - 40 - 48;          // leaves room for rod + knob
      g.cylHeight = Math.max(150, H * 0.42);
      g.chartLeft = 52;
      g.chartTop  = g.cylTop + g.cylHeight + 62;
      g.chartWidth  = W - 80;
      // leave clearance for the axis caption, the chart box border AND the
      // formula strip that draws at H-10
      g.chartHeight = H - g.chartTop - 60;
    } else {
      g.cylLeft   = 40;
      g.cylTop    = 40;
      g.cylWidth  = W * 0.38;
      g.cylHeight = H - 90;
      g.chartLeft = W * 0.55;
      g.chartTop  = 50;
      g.chartWidth  = W * 0.40;
      g.chartHeight = H - 110;
    }
    g.cylEnd = g.cylLeft + g.cylWidth + 20;   // open end, where the rod exits
    g.cylMidY = g.cylTop + g.cylHeight / 2;
    return g;
  }

  /* Drawn width of the gas chamber, in logical px, for a given volume.
     Shared by draw() and updatePhysics() so the molecular speed and the
     picture can never disagree. */
  function chamberWidth(vol) {
    return Math.max(12, geom().cylWidth * (vol / 2.0) - 8);
  }

  function updatePhysics() {
    /* Particle coordinates are NORMALISED (0..1) inside the chamber, and the
       chamber's drawn width is proportional to `volume`. An isothermal process
       holds the molecular SPEED constant (speed depends only on T and M), so
       the on-screen pixel speed must not change as the piston moves. Pixel
       speed = (normalised speed) x (chamber width), and chamber width is
       proportional to volRatio — therefore the normalised speed has to scale as
       1/volRatio to keep the real speed fixed.

       The consequence is exactly Boyle's Law made visible: same speed, shorter
       distance between the walls, so the wall-collision RATE rises as 1/V —
       which is the pressure rise. (The old law used 1/sqrt(volRatio), which
       both implied the gas heats up on compression and, in pixel terms, made
       the molecules visibly SLOW DOWN.)

       Only the chamber's WIDTH tracks the volume — its height is fixed — so the
       correction applies to x alone. Scaling y by it as well would reintroduce
       the same lie on the vertical axis.

       The correction is derived from the ACTUAL drawn chamber width rather than
       from volume directly, because the chamber carries a fixed 8px inset; a
       plain 1/volRatio law leaves a residual ~18% speed drift at full
       compression, whereas this is exact. */
    var thermalSpeed = Math.sqrt(T / 300) * Math.sqrt(M_REF / GAS_DATA[gasType].M);
    var sfx = thermalSpeed * chamberWidth(2.0) / chamberWidth(volume);
    var sfy = thermalSpeed;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx * 0.004 * sfx;
      p.y += p.vy * 0.004 * sfy;

      // Bounce off walls
      if (p.x < 0) { p.x = -p.x; p.vx = Math.abs(p.vx); }
      if (p.x > 1) { p.x = 2 - p.x; p.vx = -Math.abs(p.vx); }
      if (p.y < 0) { p.y = -p.y; p.vy = Math.abs(p.vy); }
      if (p.y > 1) { p.y = 2 - p.y; p.vy = -Math.abs(p.vy); }

      // Clamp
      if (p.x < 0) p.x = 0;
      if (p.x > 1) p.x = 1;
      if (p.y < 0) p.y = 0;
      if (p.y > 1) p.y = 1;
    }
  }

  /* ================================================================
     PV TRAIL
     ================================================================ */
  /* Record a trail point only when the state actually MOVED. Pushing every
     frame filled the buffer with 200 copies of the current point, so the trail
     could never show the path the student had traced. */
  function addTrailPoint() {
    var last = pvTrail[pvTrail.length - 1];
    if (last && Math.abs(last.v - volume) < 1e-4) return;
    pvTrail.push({ p: pressure, v: volume });
    if (pvTrail.length > MAX_TRAIL) pvTrail.shift();
  }

  /* ================================================================
     DRAW (pure render)
     ================================================================ */
  /* ── material helpers ─────────────────────────────────────────── */
  function shadeHex(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    var b = Math.min(255, Math.round((n & 255) * f));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  function rgbaHex(hex, f, a) {
    return shadeHex(hex, f).replace('rgb(', 'rgba(').replace(')', ',' + a + ')');
  }

  function contactShadow(x, y, rx, ry, a) {
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* Studio ground + a spotlight over the gas chamber, so the apparatus sits
     somewhere instead of floating on a flat void. The opaque fill also serves
     as the frame clear. */
  function drawSceneBackground(glowX, glowY) {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#10151f');
    bg.addColorStop(0.55, '#0b0f17');
    bg.addColorStop(1, '#070a10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    var sp = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(W, H) * 0.45);
    sp.addColorStop(0, 'rgba(0,172,193,0.11)');
    sp.addColorStop(1, 'rgba(0,172,193,0)');
    ctx.fillStyle = sp;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    if (mode !== 'simulate') {
      ctx.clearRect(0, 0, W, H);
      drawInactiveCanvas();
      return;
    }

    var g = geom();
    var cylLeft   = g.cylLeft;
    var cylTop    = g.cylTop;
    var cylWidth  = g.cylWidth;
    var cylHeight = g.cylHeight;
    var cylEnd    = g.cylEnd;
    var cylMidY   = g.cylMidY;

    // Volume fraction for piston position
    var volFraction = volume / 2.0;  // max volume = 2.0 L
    var pistonX = cylLeft + cylWidth * volFraction;

    drawSceneBackground(cylLeft + (pistonX - cylLeft) / 2, cylMidY);

    ctx.save();

    // ── grounding shadow under the barrel ──
    contactShadow((cylLeft + cylEnd) / 2, cylTop + cylHeight + 15, cylWidth * 0.65, 13, 0.55);

    // ── barrel bore (full tube; gas fills only the part left of the piston) ──
    var bore = ctx.createLinearGradient(0, cylTop, 0, cylTop + cylHeight);
    bore.addColorStop(0, '#161c27');
    bore.addColorStop(0.5, '#0a0e14');
    bore.addColorStop(1, '#131820');
    ctx.fillStyle = bore;
    ctx.fillRect(cylLeft, cylTop, cylEnd - cylLeft, cylHeight);

    /* ── gas body, lit by PRESSURE ──────────────────────────────────
       Alpha tracks P, so compressing the gas visibly densifies and brightens
       it. This is the one lighting cue that reinforces the law being taught
       instead of competing with it. */
    var gasCol = GAS_DATA[gasType].color;
    var gasA   = 0.10 + 0.32 * Math.min(1, pressure / 550);
    var gg = ctx.createLinearGradient(0, cylTop, 0, cylTop + cylHeight);
    gg.addColorStop(0,    rgbaHex(gasCol, 0.45, (gasA * 0.35).toFixed(3)));
    gg.addColorStop(0.5,  rgbaHex(gasCol, 0.60, gasA.toFixed(3)));
    gg.addColorStop(1,    rgbaHex(gasCol, 0.35, (gasA * 0.45).toFixed(3)));
    ctx.fillStyle = gg;
    ctx.fillRect(cylLeft, cylTop, pistonX - cylLeft, cylHeight);

    // ── Draw gas particles ──
    var particleR = Math.max(2.4, Math.min(4.6, 4 / Math.sqrt(volFraction)));
    var chamberW = chamberWidth(volume);
    var chamberH = cylHeight - 8;

    ctx.save();
    ctx.shadowColor = gasCol;
    ctx.shadowBlur = 7;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var px = cylLeft + 4 + p.x * chamberW;
      var py = cylTop + 4 + p.y * chamberH;

      var pg = ctx.createRadialGradient(px - particleR * 0.35, py - particleR * 0.35,
                                        particleR * 0.12, px, py, particleR);
      pg.addColorStop(0, shadeHex(gasCol, 1.55));
      pg.addColorStop(1, shadeHex(gasCol, 0.70));
      ctx.fillStyle = pg;
      ctx.beginPath();
      ctx.arc(px, py, particleR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── barrel walls: 3-layer steel (dark casing, body, inner rim) ──
    ctx.lineCap = 'butt';
    [[cylTop, 1], [cylTop + cylHeight, -1]].forEach(function (e) {
      var y = e[0], dir = e[1];
      ctx.beginPath(); ctx.moveTo(cylLeft - 10, y); ctx.lineTo(cylEnd, y);
      ctx.lineWidth = 9; ctx.strokeStyle = '#1e242e'; ctx.stroke();
      var mg = ctx.createLinearGradient(0, y - 4 * dir, 0, y + 4 * dir);
      mg.addColorStop(0, '#828da1'); mg.addColorStop(0.5, '#4c586b'); mg.addColorStop(1, '#2c3543');
      ctx.beginPath(); ctx.moveTo(cylLeft - 10, y); ctx.lineTo(cylEnd, y);
      ctx.lineWidth = 5; ctx.strokeStyle = mg; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cylLeft, y + 3.4 * dir); ctx.lineTo(cylEnd, y + 3.4 * dir);
      ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(190,205,230,0.20)'; ctx.stroke();
    });

    // ── closed left end cap ──
    var capG = ctx.createLinearGradient(cylLeft - 10, 0, cylLeft + 1, 0);
    capG.addColorStop(0, '#2c3543');
    capG.addColorStop(0.45, '#6d7789');
    capG.addColorStop(1, '#39424f');
    ctx.fillStyle = capG;
    ctx.fillRect(cylLeft - 10, cylTop - 4, 11, cylHeight + 8);
    ctx.strokeStyle = 'rgba(200,215,240,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cylLeft - 8.5, cylTop - 3);
    ctx.lineTo(cylLeft - 8.5, cylTop + cylHeight + 3);
    ctx.stroke();

    // ── Draw piston ──
    var pistonW = 14;
    var grad = ctx.createLinearGradient(pistonX - pistonW / 2, 0, pistonX + pistonW / 2, 0);
    grad.addColorStop(0, '#39424f');
    grad.addColorStop(0.35, '#9aa5b8');
    grad.addColorStop(0.65, '#6d7789');
    grad.addColorStop(1, '#3f4855');
    ctx.fillStyle = grad;
    ctx.fillRect(pistonX - pistonW / 2, cylTop, pistonW, cylHeight);

    // piston rings
    ctx.strokeStyle = 'rgba(14,19,27,0.75)';
    ctx.lineWidth = 2;
    for (var ri = 0; ri < 3; ri++) {
      var ry = cylTop + 16 + ri * (cylHeight - 32) / 2;
      ctx.beginPath();
      ctx.moveTo(pistonX - pistonW / 2, ry);
      ctx.lineTo(pistonX + pistonW / 2, ry);
      ctx.stroke();
    }
    // bright face on the gas side — the surface the molecules actually strike
    ctx.strokeStyle = 'rgba(210,228,252,0.38)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pistonX - pistonW / 2 + 0.8, cylTop);
    ctx.lineTo(pistonX - pistonW / 2 + 0.8, cylTop + cylHeight);
    ctx.stroke();

    // ── piston rod ──
    var rodG = ctx.createLinearGradient(0, cylMidY - 5, 0, cylMidY + 5);
    rodG.addColorStop(0, '#8c97ab');
    rodG.addColorStop(0.45, '#5b6678');
    rodG.addColorStop(1, '#333c49');
    ctx.strokeStyle = rodG;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(pistonX, cylMidY);
    ctx.lineTo(cylEnd + 6, cylMidY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(215,232,255,0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pistonX, cylMidY - 2.4);
    ctx.lineTo(cylEnd + 6, cylMidY - 2.4);
    ctx.stroke();

    // ── handle knob ──
    var kx = cylEnd + 12, kr = 11;
    var kg = ctx.createRadialGradient(kx - kr * 0.35, cylMidY - kr * 0.4, kr * 0.12, kx, cylMidY, kr);
    kg.addColorStop(0, '#5fe3f4');
    kg.addColorStop(0.55, '#00acc1');
    kg.addColorStop(1, '#04707f');
    ctx.fillStyle = kg;
    ctx.beginPath();
    ctx.arc(kx, cylMidY, kr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(8,14,20,0.85)';
    ctx.beginPath();
    ctx.arc(kx, cylMidY, 3.6, 0, Math.PI * 2);
    ctx.fill();

    // ── Labels on cylinder ──
    ctx.fillStyle = '#8b95b3';
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gas Chamber', cylLeft + (pistonX - cylLeft) / 2, cylTop + cylHeight + 22);

    // Drag hint \u2014 retired once the student has actually moved the piston
    if (!hasDragged) {
      ctx.fillStyle = '#5d6b86';
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('\u2190 drag piston \u2192', cylLeft + (pistonX - cylLeft) / 2, cylTop - 12);
    }

    ctx.restore();

    // ── Draw P-V diagram ──
    drawPVDiagram();

    // ── Draw formula ──
    ctx.fillStyle = '#00acc1';
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('P\u2081V\u2081 = P\u2082V\u2082', 50, H - 10);

    ctx.fillStyle = '#8b95b3';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('PV = ' + (pD(pressure) * vD(volume)).toFixed(isImp() ? 4 : 2) + ' ' + uPV() + '   v_rms = ' + Math.round(isImp() ? vRms() * 3.28084 : vRms()) + (isImp() ? ' ft/s' : ' m/s'),
                 150, H - 10);
  }

  function drawPVDiagram() {
    var g = geom();
    var chartLeft   = g.chartLeft;
    var chartTop    = g.chartTop;
    var chartWidth  = g.chartWidth;
    var chartHeight = g.chartHeight;
    var chartRight  = chartLeft + chartWidth;
    var chartBottom = chartTop + chartHeight;

    // Background
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(chartLeft - 5, chartTop - 5, chartWidth + 30, chartHeight + 30);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(chartLeft - 5, chartTop - 5, chartWidth + 30, chartHeight + 30);

    // Axis labels
    ctx.fillStyle = '#6b7a99';
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Volume (' + uV() + ')', chartLeft + chartWidth / 2, chartBottom + 22);

    ctx.save();
    ctx.translate(chartLeft - 28, chartTop + chartHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Pressure (' + uP() + ')', 0, 0);
    ctx.restore();

    // Title
    ctx.fillStyle = '#dde3f0';
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P-V Diagram (Isotherm at ' + T + ' K)', chartLeft + chartWidth / 2, chartTop - 12);

    // Grid lines
    ctx.strokeStyle = '#1a2030';
    ctx.lineWidth = 0.5;
    var vMin = 0.2, vMax = 2.2;
    var pMin = 0;

    /* The pressure axis has to follow the isotherm, not a hard-coded 550 kPa:
       at the top of the temperature range PV_CONST/vMin reaches ~840 kPa, which
       would run the curve and the state marker clean off the chart. Round the
       required ceiling up to a sensible 100 kPa step and derive the tick
       interval from it so the grid never crowds. */
    var pNeeded = Math.max(PV_CONST, T_PREV ? N_MOL * R_GAS * T_PREV : 0) / vMin;
    var pMax = Math.max(300, Math.ceil(pNeeded * 1.06 / 100) * 100);
    var pStep = pMax > 900 ? 200 : 100;

    // V axis ticks
    for (var v = 0.5; v <= 2.0; v += 0.5) {
      var x = chartLeft + ((v - vMin) / (vMax - vMin)) * chartWidth;
      ctx.beginPath();
      ctx.moveTo(x, chartTop);
      ctx.lineTo(x, chartBottom);
      ctx.stroke();
      ctx.fillStyle = '#6b7a99';
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(vD(v).toFixed(isImp() ? 3 : 1), x, chartBottom + 12);
    }

    // P axis ticks
    for (var pp = pStep; pp <= pMax - pStep * 0.5; pp += pStep) {
      var y = chartBottom - ((pp - pMin) / (pMax - pMin)) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
      ctx.fillStyle = '#6b7a99';
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(pD(pp).toFixed(isImp() ? 1 : 0), chartLeft - 5, y + 3);
    }

    // Axes
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(chartLeft, chartTop);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.lineTo(chartRight, chartBottom);
    ctx.stroke();

    /* ── Isotherms (PV = nRT) ──────────────────────────────────────
       Each curve is one temperature. Drawing the previous temperature ghosted
       behind the current one is what makes the textbook claim — "higher
       isotherms lie further from the origin" — directly observable, which it
       never was while the temperature slider was disabled. */
    function plotIsotherm(pvConst, stroke, width, dash) {
      ctx.save();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      var started = false;
      for (var vv = 0.2; vv <= 2.05; vv += 0.02) {
        var pp2 = pvConst / vv;
        if (pp2 > pMax) continue;
        var x2 = chartLeft + ((vv - vMin) / (vMax - vMin)) * chartWidth;
        var y2 = chartBottom - ((pp2 - pMin) / (pMax - pMin)) * chartHeight;
        if (!started) { ctx.moveTo(x2, y2); started = true; }
        else ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* Label the two isotherms at DIFFERENT volumes. Both curves converge toward
       the right of the chart, so labelling both at v = 1.6 made the ghost's
       caption land on top of the current one; the ghost is tagged out at low
       volume where the curves are still far apart. */
    function isothermLabel(pvConst, tK, color, labelV) {
      var labelX = chartLeft + ((labelV - vMin) / (vMax - vMin)) * chartWidth;
      var labelY = chartBottom - ((pvConst / labelV - pMin) / (pMax - pMin)) * chartHeight;
      ctx.fillStyle = color;
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('T = ' + tD(tK).toFixed(0) + ' ' + uT(), labelX + 5, labelY - 8);
    }

    if (T_PREV !== null && T_PREV !== T) {
      var pvPrev = N_MOL * R_GAS * T_PREV;
      plotIsotherm(pvPrev, 'rgba(139,149,179,0.55)', 1.4, [5, 4]);
      isothermLabel(pvPrev, T_PREV, 'rgba(150,160,190,0.85)', 0.62);
    }
    plotIsotherm(PV_CONST, '#00acc1', 2, null);
    isothermLabel(PV_CONST, T, '#00acc1', 1.6);

    // ── Trail points ──
    if (pvTrail.length > 1) {
      ctx.strokeStyle = 'rgba(0,172,193,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var t = 0; t < pvTrail.length; t++) {
        var pt = pvTrail[t];
        var tx = chartLeft + ((pt.v - vMin) / (vMax - vMin)) * chartWidth;
        var ty = chartBottom - ((pt.p - pMin) / (pMax - pMin)) * chartHeight;
        if (t === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
    }

    // ── Current state marker ──
    var markerX = chartLeft + ((volume - vMin) / (vMax - vMin)) * chartWidth;
    var markerY = chartBottom - ((pressure - pMin) / (pMax - pMin)) * chartHeight;

    // Glow
    ctx.beginPath();
    ctx.arc(markerX, markerY, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,172,193,0.2)';
    ctx.fill();

    // Dot
    ctx.beginPath();
    ctx.arc(markerX, markerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#00acc1';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // State label
    ctx.fillStyle = '#dde3f0';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'left';
    var lx = markerX + 10;
    var ly = markerY - 6;
    if (lx + 80 > chartRight) lx = markerX - 90;
    if (ly < chartTop + 10) ly = markerY + 16;
    ctx.fillText('P=' + pD(pressure).toFixed(1) + ' ' + uP(), lx, ly);
    ctx.fillText('V=' + vD(volume).toFixed(isImp() ? 4 : 3) + ' ' + uV(), lx, ly + 13);
  }

  function drawInactiveCanvas() {
    // Show a static informational canvas when not in Simulate mode
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#2a3050';
    ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Boyle\'s Law: P\u2081V\u2081 = P\u2082V\u2082', W / 2, H / 2 - 30);

    ctx.fillStyle = '#00acc1';
    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('PV = constant (at constant temperature)', W / 2, H / 2 + 5);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Switch to Simulate mode to interact with the piston-cylinder', W / 2, H / 2 + 35);

    // Draw mini hyperbola
    ctx.strokeStyle = 'rgba(0,172,193,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var vv = 0.3; vv <= 2.0; vv += 0.02) {
      var pp = 101.325 / vv;
      var x = W * 0.3 + (vv / 2.0) * W * 0.4;
      var y = H * 0.65 + (1 - pp / 350) * H * 0.25;
      if (vv === 0.3) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  /* ================================================================
     DISPLAY UNITS  (display only — Boyle's law is held in kPa·L)
     ================================================================ */
  var unitSys = 'si';
  function isImp() { return unitSys === 'imp'; }
  function pD(kPa) { return isImp() ? kPa * 0.1450377 : kPa; }   /* kPa → psi */
  function uP()    { return isImp() ? 'psi' : 'kPa'; }
  function vD(L)   { return isImp() ? L * 0.0353147 : L; }       /* L   → ft³ */
  function uV()    { return isImp() ? 'ft\u00b3' : 'L'; }
  function tD(K)   { return isImp() ? K * 1.8 : K; }             /* K   → °R  */
  function uT()    { return isImp() ? '\u00b0R' : 'K'; }
  function uPV()   { return isImp() ? 'psi\u00b7ft\u00b3' : 'kPa\u00b7L'; }

  /* Unit toggle — display only; Boyle's law is held in kPa·L */
  Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-unit');
      if (!u || u === unitSys) return;
      unitSys = u;
      Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (b) {
        b.classList.toggle('active', b === btn);
      });
      updateReadouts();
      if (typeof draw === 'function') draw();
    });
  });

  function updateReadouts() {
    pressure = PV_CONST / volume;
    rPressure.textContent = pD(pressure).toFixed(2);
    rVolume.textContent   = vD(volume).toFixed(isImp() ? 4 : 3);
    rPV.textContent       = (pD(pressure) * vD(volume)).toFixed(isImp() ? 4 : 2);
    rTemp.textContent     = tD(T).toFixed(0);
    rGas.textContent = GAS_DATA[gasType].name;
    svVolume.textContent = vD(volume).toFixed(isImp() ? 4 : 2) + ' ' + uV();
    svTemp.textContent   = tD(T).toFixed(0) + ' ' + uT();
    var caps = { 'u-pressure': uP(), 'u-volume': uV(), 'u-pv': uPV(), 'u-temp': uT() };
    Object.keys(caps).forEach(function (id) {
      var e = document.getElementById(id); if (e) e.textContent = ' ' + caps[id];
    });
  }

  /* v_rms = sqrt(3RT/M), in m/s. R = 8.314 J/(mol*K), M in kg/mol. */
  function vRms() {
    return Math.sqrt(3 * 8.314 * T / (GAS_DATA[gasType].M / 1000));
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    if (mode !== 'simulate') return;
    updatePhysics();
    addTrailPoint();
    draw();
    animId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (animId) cancelAnimationFrame(animId);
    animate();
  }

  function stopAnimation() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.mode;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;

    // Hide all panels
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

    stopAnimation();

    switch (m) {
      case 'simulate':
        simPanel.style.display = '';
        canvasCard.style.display = '';
        startAnimation();
        break;
      case 'explore':
        catRow.style.display = '';
        itemSelector.style.display = '';
        canvasCard.style.display = 'none';
        renderExplore();
        break;
      case 'practice':
        practicePanel.style.display = '';
        practiceBar.style.display = '';
        canvasCard.style.display = 'none';
        practiceScore = 0;
        practiceTotal = 0;
        pbarScoreVal.textContent = '0 / 0';
        newPracticeProblem();
        break;
      case 'quiz':
        quizBar.style.display = '';
        canvasCard.style.display = 'none';
        startQuiz();
        break;
    }

    draw();
  }

  /* ================================================================
     SIMULATE MODE — Slider & Drag
     ================================================================ */
  slVolume.addEventListener('input', function () {
    volume = parseFloat(this.value);
    updateReadouts();
  });

  // Gas type tabs
  document.getElementById('gas-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    gasType = e.target.dataset.gas;
    document.querySelectorAll('#gas-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.gas === gasType);
    });
    /* PV_CONST deliberately does NOT change with the gas: for an ideal gas the
       PV product at a given n and T is species-independent. Switching gas
       changes the molecular SPEED (via molar mass), which updatePhysics reads
       directly — so nothing to recompute here. */
    updateReadouts();
  });

  /* Temperature selects the ISOTHERM. Boyle's Law governs motion ALONG a curve
     (drag the volume slider, T fixed); moving this slider hops to a different
     curve, which is how the "higher isotherms sit further from the origin"
     statement in Explore, the quiz and the article becomes observable. The
     previous isotherm is ghosted behind the new one for comparison. */
  slTemp.addEventListener('input', function () {
    var newT = parseFloat(this.value);
    if (newT === T) return;
    T_PREV = T;
    T = newT;
    PV_CONST = N_MOL * R_GAS * T;
    svTemp.textContent = tD(T).toFixed(0) + ' ' + uT();
    pvTrail = [];
    updateReadouts();
  });

  // Piston drag
  canvas.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    /* Only start drag if touch is in the piston/cylinder area */
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (W / rect.width);
    var my = (e.clientY - rect.top) * (H / rect.height);
    var g = geom();
    if (mx >= g.cylLeft - 12 && mx <= g.cylEnd + 26 &&
        my >= g.cylTop - 10 && my <= g.cylTop + g.cylHeight + 10) {
      e.preventDefault();
      dragging = true;
      handleDrag(e);
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging || mode !== 'simulate') return;
    e.preventDefault();
    handleDrag(e);
  });
  canvas.addEventListener('pointerup', function () { dragging = false; });
  canvas.addEventListener('pointerleave', function () { dragging = false; });

  function handleDrag(e) {
    var rect = canvas.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (W / rect.width);

    var g = geom();

    // Convert mouse X to volume
    var frac = (mx - g.cylLeft) / g.cylWidth;
    frac = Math.max(0.1, Math.min(1, frac));
    volume = r3(frac * 2.0);
    if (volume < 0.2) volume = 0.2;
    if (volume > 2.0) volume = 2.0;

    hasDragged = true;
    slVolume.value = volume;
    updateReadouts();
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
    renderExplore();
  });

  function renderExplore() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    conceptGrid.innerHTML = '';

    filtered.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept && selectedConcept.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selectedConcept = c;
        renderExplore();
        renderConceptInfo(c);
      });
      conceptGrid.appendChild(btn);
    });

    if (selectedConcept && selectedConcept.cat === exploreCat) {
      renderConceptInfo(selectedConcept);
    } else {
      itemInfo.style.display = 'none';
    }
  }

  function renderConceptInfo(c) {
    itemInfo.style.display = '';
    var catLabels = { basics: 'Gas Laws Basics', boyles: 'Boyle\'s Law', applications: 'Applications', ideal: 'Ideal Gas' };
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + (catLabels[c.cat] || c.cat) + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step">\u2192 <strong>' + s + '</strong></p>';
      });
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function newPracticeProblem() {
    currentProblem = generatePractice();
    practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppCheck.style.display = '';
    ppShow.style.display = '';
    ppNext.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) { ppFeedback.textContent = 'Please enter a number.'; ppFeedback.className = 'feedback err'; return; }

    practiceAnswered = true;
    practiceTotal++;
    ppInput.disabled = true;

    var diff = Math.abs(userVal - currentProblem.answer);
    var tol = currentProblem.tolerance || 1;
    var correct = diff <= tol || (currentProblem.answer !== 0 && (diff / Math.abs(currentProblem.answer)) < 0.02);

    if (correct) {
      practiceScore++;
      ppFeedback.textContent = '\u2713 Correct! ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '\u2717 Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback err';
    }
    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;
    ppCheck.style.display = 'none';
    ppShow.style.display = 'none';
    ppNext.style.display = '';
    showSolution();
  });

  ppShow.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    practiceAnswered = true;
    practiceTotal++;
    ppInput.disabled = true;
    ppFeedback.textContent = 'Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
    ppFeedback.className = 'feedback err';
    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;
    ppCheck.style.display = 'none';
    ppShow.style.display = 'none';
    ppNext.style.display = '';
    showSolution();
  });

  function showSolution() {
    if (!currentProblem || !currentProblem.steps) return;
    ppSolution.style.display = '';
    var html = '<h4>Solution</h4>';
    currentProblem.steps.forEach(function (s) {
      html += '<p class="sol-step">\u2192 <strong>' + s + '</strong></p>';
    });
    ppSolution.innerHTML = html;
  }

  ppNext.addEventListener('click', function () {
    newPracticeProblem();
  });

  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') ppCheck.click();
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    // Shuffle and pick 5
    quizPool = QUIZ_POOL.slice();
    shuffle(quizPool);
    /* Every question in the pool is authored with its correct answer at index 0.
       Without this the right button was always the first one, so the quiz could
       be passed without reading the options. Shuffle each question's options
       and re-point `correct` at wherever the answer landed. */
    quizSet = quizPool.slice(0, QUIZ_SIZE).map(function (q) {
      var order = q.options.map(function (opt, i) { return { opt: opt, i: i }; });
      shuffle(order);
      return {
        q: q.q,
        options: order.map(function (o) { return o.opt; }),
        correct: order.findIndex(function (o) { return o.i === q.correct; })
      };
    });
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    quizAnswers = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    renderQuizQuestion();
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;
    }
  }

  function renderQuizQuestion() {
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.q + '</p>';
    html += '<div class="answer-grid">';
    q.options.forEach(function (opt, i) {
      html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px;display:flex;gap:10px;align-items:center;" id="quiz-action-row">';
    html += '<span class="quiz-feedback" id="quiz-fb"></span>';
    html += '<button class="btn btn-primary" id="quiz-next-btn" style="display:none;margin-left:auto;">Next \u2192</button>';
    html += '</div>';

    quizPanel.innerHTML = html;

    // Answer click handlers
    quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (quizAnswered) return;
        quizAnswered = true;
        var chosen = parseInt(btn.dataset.idx);
        var correct = q.correct;
        var isCorrect = chosen === correct;

        if (isCorrect) quizScore++;

        quizAnswers.push({
          question: q.q,
          chosen: q.options[chosen],
          correctAnswer: q.options[correct],
          isCorrect: isCorrect
        });

        // Mark buttons
        quizPanel.querySelectorAll('.answer-btn').forEach(function (b) {
          b.classList.add('locked');
          var idx = parseInt(b.dataset.idx);
          if (idx === correct) b.classList.add('correct');
          if (idx === chosen && !isCorrect) b.classList.add('wrong');
        });

        var fb = document.getElementById('quiz-fb');
        if (isCorrect) {
          fb.textContent = '\u2713 Correct!';
          fb.className = 'quiz-feedback ok';
        } else {
          fb.textContent = '\u2717 Incorrect. Answer: ' + q.options[correct];
          fb.className = 'quiz-feedback err';
        }

        var nextBtn = document.getElementById('quiz-next-btn');
        nextBtn.style.display = '';
        nextBtn.textContent = quizIdx < QUIZ_SIZE - 1 ? 'Next \u2192' : 'See Results';
        nextBtn.addEventListener('click', function () {
          quizIdx++;
          if (quizIdx < QUIZ_SIZE) {
            renderQuizQuestion();
          } else {
            showQuizResult();
          }
        });
      });
    });
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var scoreClass = pct >= 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct >= 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605' : '\u2605';
    var verdict = pct >= 1 ? 'Perfect Score!' : pct >= 0.6 ? 'Good Job!' : 'Keep Practicing!';

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + scoreClass + '">' + quizScore + '/' + QUIZ_SIZE + '</span><div class="qr-verdict">' + verdict + '</div></div>';
    html += '</div>';

    html += '<div class="qr-rows">';
    quizAnswers.forEach(function (a, i) {
      var cls = a.isCorrect ? 'ok' : 'err';
      var mark = a.isCorrect ? '\u2713' : '\u2717';
      html += '<div class="qr-row ' + cls + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail">' + a.question.substring(0, 60) + (a.question.length > 60 ? '...' : '') + ' <strong>' + a.correctAnswer + '</strong></span>';
      html += '<span class="qr-mark">' + mark + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="quiz-retry">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('quiz-retry').addEventListener('click', function () {
      quizResult.style.display = 'none';
      startQuiz();
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  initParticles();
  resize();
  updateReadouts();
  pvTrail = [];
  startAnimation();

  window.addEventListener('resize', function () {
    resize();
    if (mode === 'simulate') draw();
  });

})();
