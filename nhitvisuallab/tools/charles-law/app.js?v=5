(function () {
  'use strict';

  /* ================================================================
     DOM REFS
     ================================================================ */
  var canvas = document.getElementById('sim-canvas');
  var ctx    = canvas.getContext('2d');

  var slTemp    = document.getElementById('sl-temp');
  var svTemp    = document.getElementById('sv-temp');

  var rVolume   = document.getElementById('r-volume');
  var rTemp     = document.getElementById('r-temp');
  var rTempC    = document.getElementById('r-temp-c');
  var rVT       = document.getElementById('r-vt');
  var rPressure = document.getElementById('r-pressure');

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

  // Charles' Law: V/T = constant at constant pressure
  // Initial conditions: V1 = 1.0 L, T1 = 300 K, P = 101.325 kPa
  var P_CONST = 101.325;  // kPa (constant pressure)
  var T1 = 300;           // K (reference temperature)
  var V1 = 1.0;           // L (reference volume)
  var VT_CONST = V1 / T1; // = V/T ratio = nR/P

  var temperature = T1;
  var volume = V1;

  // Gas particles
  var NUM_PARTICLES = 60;
  var particles = [];

  // V-T diagram trail
  var vtTrail = [];
  var MAX_TRAIL = 200;

  // Canvas sizing
  var W = 900, H = 480;
  var DPR = window.devicePixelRatio || 1;

  // Animation
  var animId = null;

  /* ── Practice state ── */
  var practiceScore = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;

  /* ── Quiz state ── */
  var QUIZ_SIZE = 5;
  var quizSet = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* ── Explore state ── */
  var exploreCat = 'basics';
  var selectedConcept = null;

  /* ================================================================
     CONCEPTS (Explore mode) - 16 concepts in 4 categories
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
      desc: 'Temperature is a measure of the average kinetic energy of gas molecules. The relationship is KE_avg = (3/2)k_B T, where k_B = 1.381\u00D710\u207B\u00B2\u00B3 J/K is Boltzmann\'s constant and T is absolute temperature in Kelvin. Higher temperature means faster-moving molecules, which leads to more forceful and frequent collisions with container walls.',
      example: { problem: 'What is the average kinetic energy of a gas molecule at 400 K? (k_B = 1.381\u00D710\u207B\u00B2\u00B3 J/K)', steps: ['KE = (3/2) \u00D7 k_B \u00D7 T', 'KE = 1.5 \u00D7 1.381\u00D710\u207B\u00B2\u00B3 \u00D7 400', 'KE = 1.5 \u00D7 5.524\u00D710\u207B\u00B2\u00B9', 'KE = 8.29\u00D710\u207B\u00B2\u00B9 J'], answer: 8.29e-21 }
    },
    { id: 'kelvin-scale', name: 'Kelvin Temperature Scale', symbol: 'T(K) = T(\u00B0C) + 273.15',
      formula: 'T(K) = T(\u00B0C) + 273.15', unit: 'K', cat: 'basics',
      desc: 'The Kelvin scale is the absolute temperature scale used in science and engineering. It starts at absolute zero (0 K = \u2212273.15\u00B0C) where molecular motion theoretically ceases. Unlike Celsius or Fahrenheit, Kelvin has no negative values. Gas law calculations MUST use Kelvin because the laws relate to absolute temperature. Water freezes at 273.15 K and boils at 373.15 K.',
      example: { problem: 'Convert 150\u00B0C to Kelvin.', steps: ['T(K) = T(\u00B0C) + 273.15', 'T(K) = 150 + 273.15', 'T(K) = 423.15 K', '\u2248 423 K'], answer: 423.15 }
    },
    { id: 'ideal-gas-law', name: 'Ideal Gas Law', symbol: 'PV = nRT',
      formula: 'PV = nRT (R = 8.314 J/mol\u00B7K)', unit: 'Pa\u00B7m\u00B3', cat: 'basics',
      desc: 'The ideal gas law PV = nRT unifies Boyle\'s Law (PV = const at fixed T), Charles\' Law (V/T = const at fixed P), and Avogadro\'s Law (V/n = const at fixed T,P). R = 8.314 J/(mol\u00B7K) is the universal gas constant. When pressure is held constant (Charles\' Law), PV = nRT rearranges to V = (nR/P)\u00B7T, showing V is directly proportional to T.',
      example: { problem: 'Find the volume of 0.5 mol of gas at 101.325 kPa and 350 K. (R = 8.314 L\u00B7kPa/mol\u00B7K)', steps: ['PV = nRT', 'V = nRT / P', 'V = 0.5 \u00D7 8.314 \u00D7 350 / 101.325', 'V = 14.36 L'], answer: 14.36 }
    },

    /* ── Charles' Law ── */
    { id: 'charles-law-def', name: 'Charles\' Law Definition', symbol: 'V/T = const',
      formula: 'V\u2081/T\u2081 = V\u2082/T\u2082 (at constant P)', unit: 'L/K', cat: 'charles',
      desc: 'Charles\' Law states that for a fixed amount of gas at constant pressure, the volume is directly proportional to the absolute temperature: V \u221D T. Mathematically, V/T = constant, or V\u2081/T\u2081 = V\u2082/T\u2082. When temperature increases, gas molecules move faster and push the piston outward to maintain constant pressure, so the volume increases proportionally.',
      example: { problem: 'A gas has V\u2081 = 2.0 L at T\u2081 = 300 K. Find V\u2082 when T\u2082 = 450 K (constant P).', steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', '2.0/300 = V\u2082/450', 'V\u2082 = 2.0 \u00D7 450/300', 'V\u2082 = 3.0 L'], answer: 3.0 }
    },
    { id: 'vt-diagram', name: 'V-T Diagram', symbol: 'Straight line',
      formula: 'V = (nR/P) \u00D7 T (linear through origin)', unit: 'L vs K', cat: 'charles',
      desc: 'On a Volume-Temperature (V-T) diagram using Kelvin, Charles\' Law produces a straight line passing through the origin. Each line, called an isobar, represents all possible V-T states at a given pressure. Higher pressure isobars have a smaller slope (less volume per kelvin). The slope of the line equals nR/P, where n is moles, R is the gas constant, and P is the constant pressure.',
      example: { problem: 'A gas at 101.325 kPa has V/T = 0.00333 L/K. What is V at 500 K?', steps: ['V = (V/T) \u00D7 T', 'V = 0.00333 \u00D7 500', 'V = 1.667 L', 'This point lies on the 101.325 kPa isobar.'], answer: 1.667 }
    },
    { id: 'isobaric-process', name: 'Isobaric Process', symbol: '\u0394P = 0',
      formula: 'W = P\u0394V = P(V\u2082 \u2212 V\u2081)', unit: 'J', cat: 'charles',
      desc: 'An isobaric process occurs at constant pressure. For an ideal gas undergoing isobaric expansion or compression, the work done is W = P\u0394V = P(V\u2082 \u2212 V\u2081). During isobaric expansion (heating), the gas does positive work on the surroundings as the piston moves outward. During isobaric compression (cooling), work is done on the gas as the piston moves inward. Heat must be added or removed to change the temperature.',
      example: { problem: 'A gas at 101.325 kPa expands from 1.0 L to 2.0 L at constant pressure. Find work done.', steps: ['W = P\u0394V', 'W = P(V\u2082 \u2212 V\u2081)', 'W = 101.325 \u00D7 (2.0 \u2212 1.0)', 'W = 101.325 J (converting kPa\u00B7L to J)'], answer: 101.325 }
    },
    { id: 'direct-proportion', name: 'Direct Proportion', symbol: 'V \u221D T',
      formula: 'V = kT where k = nR/P', unit: 'L', cat: 'charles',
      desc: 'Charles\' Law describes a direct proportion between volume and absolute temperature. If you double the Kelvin temperature, the volume doubles. If you triple the temperature, the volume triples. Graphically, V vs T gives a straight line through the origin, and the slope k = nR/P depends on the amount of gas and the constant pressure. This linear relationship is used to verify Charles\' Law experimentally.',
      example: { problem: 'A gas occupies 4 L at 200 K. What volume does it occupy at 600 K (same pressure)?', steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', '4/200 = V\u2082/600', 'V\u2082 = 4 \u00D7 600/200', 'V\u2082 = 12 L (tripled, since T tripled)'], answer: 12 }
    },

    /* ── Absolute Zero ── */
    { id: 'absolute-zero-def', name: 'Absolute Zero', symbol: '0 K = \u2212273.15\u00B0C',
      formula: 'T = 0 K = \u2212273.15\u00B0C', unit: 'K', cat: 'zero',
      desc: 'Absolute zero (0 K or \u2212273.15\u00B0C) is the lowest possible temperature, where molecular motion would theoretically cease and an ideal gas would have zero volume. It was discovered by extrapolating Charles\' Law: plotting V vs T and extending the line to V = 0 gives T = 0 K. No real substance can reach absolute zero (Third Law of Thermodynamics), but scientists have cooled atoms to within billionths of a degree above it.',
      example: { problem: 'A gas at 300 K has V = 3 L. At what temperature (K) would V = 0 L (extrapolation)?', steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', '3/300 = 0/T\u2082', 'For V\u2082 = 0, T\u2082 must be 0 K', 'T\u2082 = 0 K (\u2212273.15\u00B0C) = absolute zero'], answer: 0 }
    },
    { id: 'kelvin-origin', name: 'Origin of Kelvin Scale', symbol: 'Lord Kelvin',
      formula: '0 K defined by Charles\' Law extrapolation', unit: 'K', cat: 'zero',
      desc: 'Lord Kelvin (William Thomson) established the absolute temperature scale in 1848 by using Charles\' Law. He observed that all gases, regardless of type, showed the same extrapolated zero-volume temperature of \u2212273.15\u00B0C. This universal convergence point became the zero of the Kelvin scale. The Kelvin scale uses the same degree increment as Celsius but starts at absolute zero, making it ideal for thermodynamic calculations.',
      example: { problem: 'Convert \u221240\u00B0C to Kelvin.', steps: ['T(K) = T(\u00B0C) + 273.15', 'T(K) = \u221240 + 273.15', 'T(K) = 233.15 K', '\u2248 233 K'], answer: 233.15 }
    },
    { id: 'third-law', name: 'Third Law of Thermodynamics', symbol: 'S \u2192 0',
      formula: 'As T \u2192 0 K, S \u2192 0 (for perfect crystal)', unit: 'J/K', cat: 'zero',
      desc: 'The Third Law of Thermodynamics states that the entropy of a perfect crystal approaches zero as the temperature approaches absolute zero. This means absolute zero can never be physically reached in a finite number of steps. Charles\' Law\'s prediction of zero volume at 0 K is therefore a theoretical extrapolation \u2014 all real gases liquefy and then solidify well before reaching absolute zero.',
      example: { problem: 'Nitrogen gas liquefies at 77 K. At what Celsius temperature does this occur?', steps: ['T(\u00B0C) = T(K) \u2212 273.15', 'T(\u00B0C) = 77 \u2212 273.15', 'T(\u00B0C) = \u2212196.15\u00B0C', 'N\u2082 liquefies at \u2212196\u00B0C, far above 0 K'], answer: -196.15 }
    },
    { id: 'gas-liquefaction', name: 'Gas Liquefaction', symbol: 'T_c',
      formula: 'Below T_c, gas can be liquefied by pressure', unit: 'K', cat: 'zero',
      desc: 'Every gas has a critical temperature (T_c) above which it cannot be liquefied regardless of pressure. Below T_c, sufficient pressure will cause liquefaction. Charles\' Law only applies to the gas phase \u2014 once a gas liquefies, its volume no longer follows V \u221D T. Common critical temperatures: N\u2082 = 126 K, O\u2082 = 155 K, CO\u2082 = 304 K, H\u2082O = 647 K.',
      example: { problem: 'CO\u2082 has T_c = 304 K (31\u00B0C). Can CO\u2082 be liquefied at 25\u00B0C by increasing pressure?', steps: ['T = 25\u00B0C = 298 K', 'T_c = 304 K', 'Since 298 K < 304 K (T_c)', 'Yes, CO\u2082 can be liquefied at 25\u00B0C by applying \u226573 atm'], answer: 298 }
    },

    /* ── Applications ── */
    { id: 'hot-air-balloon', name: 'Hot Air Balloons', symbol: 'V\u2191 \u2192 \u03C1\u2193',
      formula: '\u03C1 = m/V; heating \u2192 V\u2191 \u2192 \u03C1\u2193 \u2192 buoyancy', unit: 'kg/m\u00B3', cat: 'applications',
      desc: 'Hot air balloons are the most iconic application of Charles\' Law. The burner heats the air inside the balloon envelope, causing it to expand (Charles\' Law). Since the balloon is open at the bottom, some air escapes, reducing the mass of air inside while the volume remains the same as the envelope. This makes the air inside less dense than the surrounding cool air, creating buoyant lift according to Archimedes\' principle.',
      example: { problem: 'Air at 20\u00B0C (293 K) has density 1.20 kg/m\u00B3. The balloon heater raises temperature to 100\u00B0C (373 K). Find the new density.', steps: ['\u03C1\u2082/\u03C1\u2081 = T\u2081/T\u2082 (from Charles\' Law)', '\u03C1\u2082 = 1.20 \u00D7 293/373', '\u03C1\u2082 = 1.20 \u00D7 0.7855', '\u03C1\u2082 = 0.943 kg/m\u00B3 (lighter than surrounding air)'], answer: 0.943 }
    },
    { id: 'tire-pressure', name: 'Tire Pressure & Temperature', symbol: 'T\u2191 \u2192 P\u2191',
      formula: 'At constant V: P\u2081/T\u2081 = P\u2082/T\u2082 (Gay-Lussac\'s)', unit: 'kPa', cat: 'applications',
      desc: 'Car tires have a fixed volume, so when temperature increases, the pressure increases (Gay-Lussac\'s Law, a related gas law). However, if the tire could expand (like a balloon), Charles\' Law would apply directly \u2014 the volume would increase with temperature at constant pressure. Tire manufacturers recommend checking pressure when tires are cold because driving heats them by 10-20\u00B0C, increasing pressure by about 5-10%.',
      example: { problem: 'A tire at 20\u00B0C (293 K) has pressure 220 kPa. After driving, temperature is 50\u00B0C (323 K). Find new pressure (constant V).', steps: ['P\u2081/T\u2081 = P\u2082/T\u2082', 'P\u2082 = P\u2081 \u00D7 T\u2082/T\u2081', 'P\u2082 = 220 \u00D7 323/293', 'P\u2082 = 242.5 kPa'], answer: 242.5 }
    },
    { id: 'baking-bread', name: 'Baking & Gas Expansion', symbol: 'CO\u2082 \u2191',
      formula: 'V_gas \u221D T_oven', unit: 'L', cat: 'applications',
      desc: 'When bread dough is placed in a hot oven, the CO\u2082 gas produced by yeast or baking powder expands according to Charles\' Law. The gas bubbles trapped in the dough enlarge as temperature rises from room temperature (~25\u00B0C = 298 K) to oven temperature (~200\u00B0C = 473 K), nearly doubling the volume of the gas pockets. This expansion, along with steam production, causes the bread to rise and creates the airy texture.',
      example: { problem: 'Gas bubbles in dough occupy 0.3 L at 25\u00B0C (298 K). What volume do they reach in a 200\u00B0C (473 K) oven?', steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'V\u2082 = V\u2081 \u00D7 T\u2082/T\u2081', 'V\u2082 = 0.3 \u00D7 473/298', 'V\u2082 = 0.476 L (59% increase)'], answer: 0.476 }
    },
    { id: 'weather-balloon', name: 'Weather Balloons', symbol: 'Altitude \u2192 V\u2191',
      formula: 'V increases as P and T both decrease with altitude', unit: 'L', cat: 'applications',
      desc: 'Weather balloons expand as they rise through the atmosphere because both pressure and temperature decrease with altitude. The combined effect of lower pressure (Boyle\'s Law) and lower temperature (Charles\' Law) determines the final volume. A typical weather balloon starts at about 1.5 m diameter and expands to over 6 m before bursting at altitudes around 30 km. Instruments carried by the balloon measure atmospheric conditions.',
      example: { problem: 'A weather balloon has V = 100 L at ground level (300 K, 101.3 kPa). At altitude: T = 220 K, P = 30 kPa. Find V.', steps: ['P\u2081V\u2081/T\u2081 = P\u2082V\u2082/T\u2082 (combined gas law)', 'V\u2082 = V\u2081 \u00D7 (P\u2081/P\u2082) \u00D7 (T\u2082/T\u2081)', 'V\u2082 = 100 \u00D7 (101.3/30) \u00D7 (220/300)', 'V\u2082 = 247.6 L'], answer: 247.6 }
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
      // 1. Find V2 given V1, T1, T2
      function () {
        var v1 = r2(randBetween(0.5, 5));
        var t1 = Math.round(randBetween(150, 500));
        var t2 = Math.round(randBetween(150, 600));
        while (Math.abs(t1 - t2) < 30) t2 = Math.round(randBetween(150, 600));
        var v2 = r3(v1 * t2 / t1);
        return {
          prompt: 'A gas has V\u2081 = ' + v1 + ' L at T\u2081 = ' + t1 + ' K. Find V\u2082 when T\u2082 = ' + t2 + ' K (constant P).',
          answer: v2, unit: 'L', tolerance: 0.02,
          steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'V\u2082 = V\u2081 \u00D7 T\u2082/T\u2081', 'V\u2082 = ' + v1 + ' \u00D7 ' + t2 + '/' + t1, 'V\u2082 = ' + v2 + ' L']
        };
      },
      // 2. Find T2 given V1, T1, V2
      function () {
        var v1 = r2(randBetween(1, 6));
        var t1 = Math.round(randBetween(200, 500));
        var v2 = r2(randBetween(0.5, 8));
        while (Math.abs(v1 - v2) < 0.3) v2 = r2(randBetween(0.5, 8));
        var t2 = r1(t1 * v2 / v1);
        return {
          prompt: 'A gas occupies V\u2081 = ' + v1 + ' L at T\u2081 = ' + t1 + ' K. What temperature is needed for V\u2082 = ' + v2 + ' L?',
          answer: t2, unit: 'K', tolerance: 2,
          steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'T\u2082 = T\u2081 \u00D7 V\u2082/V\u2081', 'T\u2082 = ' + t1 + ' \u00D7 ' + v2 + '/' + v1, 'T\u2082 = ' + t2 + ' K']
        };
      },
      // 3. Find V1 given T1, V2, T2
      function () {
        var t1 = Math.round(randBetween(150, 400));
        var v2 = r2(randBetween(1, 8));
        var t2 = Math.round(randBetween(200, 600));
        while (Math.abs(t1 - t2) < 30) t2 = Math.round(randBetween(200, 600));
        var v1 = r3(v2 * t1 / t2);
        return {
          prompt: 'A gas at T\u2081 = ' + t1 + ' K is heated to T\u2082 = ' + t2 + ' K, giving V\u2082 = ' + v2 + ' L. What was V\u2081?',
          answer: v1, unit: 'L', tolerance: 0.02,
          steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'V\u2081 = V\u2082 \u00D7 T\u2081/T\u2082', 'V\u2081 = ' + v2 + ' \u00D7 ' + t1 + '/' + t2, 'V\u2081 = ' + v1 + ' L']
        };
      },
      // 4. Find T1 given V1, V2, T2
      function () {
        var v1 = r2(randBetween(1, 5));
        var v2 = r2(randBetween(2, 8));
        while (Math.abs(v1 - v2) < 0.3) v2 = r2(randBetween(2, 8));
        var t2 = Math.round(randBetween(250, 600));
        var t1 = r1(t2 * v1 / v2);
        return {
          prompt: 'A gas expands from V\u2081 = ' + v1 + ' L to V\u2082 = ' + v2 + ' L. If T\u2082 = ' + t2 + ' K, what was T\u2081?',
          answer: t1, unit: 'K', tolerance: 2,
          steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'T\u2081 = T\u2082 \u00D7 V\u2081/V\u2082', 'T\u2081 = ' + t2 + ' \u00D7 ' + v1 + '/' + v2, 'T\u2081 = ' + t1 + ' K']
        };
      },
      // 5. Celsius to Kelvin conversion then Charles' Law
      function () {
        var tC1 = Math.round(randBetween(-20, 200));
        var tC2 = Math.round(randBetween(50, 400));
        while (Math.abs(tC1 - tC2) < 30) tC2 = Math.round(randBetween(50, 400));
        var t1k = r2(tC1 + 273.15);
        var t2k = r2(tC2 + 273.15);
        var v1 = r2(randBetween(1, 5));
        var v2 = r3(v1 * t2k / t1k);
        return {
          prompt: 'A gas has V\u2081 = ' + v1 + ' L at ' + tC1 + '\u00B0C. What is V\u2082 at ' + tC2 + '\u00B0C? (Convert to Kelvin first!)',
          answer: v2, unit: 'L', tolerance: 0.02,
          steps: ['T\u2081 = ' + tC1 + ' + 273.15 = ' + t1k + ' K', 'T\u2082 = ' + tC2 + ' + 273.15 = ' + t2k + ' K', 'V\u2082 = ' + v1 + ' \u00D7 ' + t2k + '/' + t1k, 'V\u2082 = ' + v2 + ' L']
        };
      },
      // 6. Hot air balloon problem
      function () {
        var tC1 = Math.round(randBetween(10, 30));
        var tC2 = Math.round(randBetween(80, 150));
        var t1k = r2(tC1 + 273.15);
        var t2k = r2(tC2 + 273.15);
        var v1 = Math.round(randBetween(2000, 5000));
        var v2 = Math.round(v1 * t2k / t1k);
        return {
          prompt: 'A hot air balloon contains ' + v1 + ' L of air at ' + tC1 + '\u00B0C (' + t1k + ' K). The burner heats it to ' + tC2 + '\u00B0C (' + t2k + ' K). Find the new volume.',
          answer: v2, unit: 'L', tolerance: 20,
          steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'V\u2082 = V\u2081 \u00D7 T\u2082/T\u2081', 'V\u2082 = ' + v1 + ' \u00D7 ' + t2k + '/' + t1k, 'V\u2082 = ' + v2 + ' L']
        };
      },
      // 7. V/T ratio problem
      function () {
        var v1 = r2(randBetween(1, 5));
        var t1 = Math.round(randBetween(200, 500));
        var vtRatio = r3(v1 / t1 * 1000); // mL/K
        var t2 = Math.round(randBetween(150, 600));
        while (Math.abs(t1 - t2) < 30) t2 = Math.round(randBetween(150, 600));
        var v2 = r3(vtRatio * t2 / 1000);
        return {
          prompt: 'The V/T ratio of a gas is ' + vtRatio + ' mL/K (constant P). What is V at T = ' + t2 + ' K?',
          answer: v2, unit: 'L', tolerance: 0.02,
          steps: ['V/T = ' + vtRatio + ' mL/K = ' + r3(vtRatio / 1000) + ' L/K', 'V = (V/T) \u00D7 T', 'V = ' + r3(vtRatio / 1000) + ' \u00D7 ' + t2, 'V = ' + v2 + ' L']
        };
      },
      // 8. Volume doubling/tripling
      function () {
        var factor = Math.round(randBetween(2, 5));
        var t1 = Math.round(randBetween(150, 300));
        var t2 = t1 * factor;
        return {
          prompt: 'A gas at ' + t1 + ' K is heated until its volume is ' + factor + ' times the original. What is the final temperature?',
          answer: t2, unit: 'K', tolerance: 1,
          steps: ['V\u2082 = ' + factor + ' \u00D7 V\u2081', 'V\u2081/T\u2081 = V\u2082/T\u2082', 'T\u2082 = T\u2081 \u00D7 V\u2082/V\u2081 = T\u2081 \u00D7 ' + factor, 'T\u2082 = ' + t1 + ' \u00D7 ' + factor + ' = ' + t2 + ' K']
        };
      },
      // 9. Absolute zero extrapolation
      function () {
        var v1 = r2(randBetween(2, 6));
        var t1 = Math.round(randBetween(250, 400));
        var vtSlope = r3(v1 / t1);
        var tTarget = Math.round(randBetween(100, 200));
        var vTarget = r3(vtSlope * tTarget);
        return {
          prompt: 'A gas has V = ' + v1 + ' L at ' + t1 + ' K. Using Charles\' Law (linear V-T), what volume would it have at ' + tTarget + ' K?',
          answer: vTarget, unit: 'L', tolerance: 0.02,
          steps: ['V/T = ' + v1 + '/' + t1 + ' = ' + vtSlope + ' L/K', 'V at ' + tTarget + ' K = ' + vtSlope + ' \u00D7 ' + tTarget, 'V = ' + vTarget + ' L', '(Extrapolating toward absolute zero at 0 K where V \u2192 0)']
        };
      },
      // 10. Baking/oven problem
      function () {
        var tC1 = Math.round(randBetween(20, 30));
        var tC2 = Math.round(randBetween(150, 250));
        var t1k = r2(tC1 + 273.15);
        var t2k = r2(tC2 + 273.15);
        var v1 = r2(randBetween(0.1, 0.5));
        var v2 = r3(v1 * t2k / t1k);
        return {
          prompt: 'CO\u2082 bubbles in bread dough occupy ' + v1 + ' L at ' + tC1 + '\u00B0C (' + t1k + ' K). In the oven at ' + tC2 + '\u00B0C (' + t2k + ' K), what volume do they reach?',
          answer: v2, unit: 'L', tolerance: 0.01,
          steps: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'V\u2082 = ' + v1 + ' \u00D7 ' + t2k + '/' + t1k, 'V\u2082 = ' + v2 + ' L', '(' + r1((v2 / v1 - 1) * 100) + '% volume increase)']
        };
      },
      // 11. Work done in isobaric process
      function () {
        var P = r1(randBetween(80, 200));
        var v1 = r2(randBetween(1, 3));
        var t1 = Math.round(randBetween(200, 400));
        var t2 = Math.round(randBetween(300, 600));
        while (t2 <= t1) t2 = Math.round(randBetween(300, 600));
        var v2 = r3(v1 * t2 / t1);
        var work = r2(P * (v2 - v1));
        return {
          prompt: 'A gas at ' + P + ' kPa expands from V\u2081 = ' + v1 + ' L (T\u2081 = ' + t1 + ' K) to T\u2082 = ' + t2 + ' K at constant P. Find the work done (in kPa\u00B7L).',
          answer: work, unit: 'kPa\u00B7L', tolerance: 1,
          steps: ['V\u2082 = V\u2081 \u00D7 T\u2082/T\u2081 = ' + v1 + ' \u00D7 ' + t2 + '/' + t1 + ' = ' + v2 + ' L', 'W = P\u0394V = P(V\u2082 \u2212 V\u2081)', 'W = ' + P + ' \u00D7 (' + v2 + ' \u2212 ' + v1 + ')', 'W = ' + work + ' kPa\u00B7L']
        };
      },
      // 12. Combined: temperature in Celsius
      function () {
        var v1 = r2(randBetween(2, 6));
        var tC1 = Math.round(randBetween(0, 100));
        var v2 = r2(randBetween(3, 10));
        while (v2 <= v1) v2 = r2(randBetween(3, 10));
        var t1k = r2(tC1 + 273.15);
        var t2k = r1(t1k * v2 / v1);
        var tC2 = r1(t2k - 273.15);
        return {
          prompt: 'A gas at ' + tC1 + '\u00B0C has V\u2081 = ' + v1 + ' L. What temperature (\u00B0C) is needed for V\u2082 = ' + v2 + ' L?',
          answer: tC2, unit: '\u00B0C', tolerance: 2,
          steps: ['T\u2081 = ' + tC1 + ' + 273.15 = ' + t1k + ' K', 'T\u2082 = T\u2081 \u00D7 V\u2082/V\u2081 = ' + t1k + ' \u00D7 ' + v2 + '/' + v1, 'T\u2082 = ' + t2k + ' K', 'T\u2082 = ' + t2k + ' \u2212 273.15 = ' + tC2 + '\u00B0C']
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
    { q: 'Charles\' Law states that at constant pressure, volume is directly proportional to:', options: ['Absolute temperature', 'Pressure', 'Mass', 'Density'], correct: 0 },
    { q: 'If the Kelvin temperature of a gas is doubled at constant pressure, the volume:', options: ['Doubles', 'Halves', 'Stays the same', 'Quadruples'], correct: 0 },
    { q: 'The V-T graph for Charles\' Law (in Kelvin) is a:', options: ['Straight line through the origin', 'Hyperbola', 'Parabola', 'Exponential curve'], correct: 0 },
    { q: 'Which condition must remain constant for Charles\' Law to apply?', options: ['Pressure', 'Temperature', 'Volume', 'Density'], correct: 0 },
    { q: 'A gas at 200 K occupies 4 L. At 400 K (constant P), its volume is:', options: ['8 L', '2 L', '4 L', '16 L'], correct: 0 },
    { q: 'Charles\' Law is expressed as:', options: ['V\u2081/T\u2081 = V\u2082/T\u2082', 'P\u2081V\u2081 = P\u2082V\u2082', 'PV = nRT', 'P\u2081/T\u2081 = P\u2082/T\u2082'], correct: 0 },
    { q: 'Absolute zero on the Kelvin scale is:', options: ['0 K (\u2212273.15\u00B0C)', '0\u00B0C (273 K)', '\u2212100\u00B0C (173 K)', '\u2212460\u00B0F (233 K)'], correct: 0 },
    { q: 'Hot air balloons work because heated air:', options: ['Expands and becomes less dense', 'Contracts and becomes heavier', 'Changes its chemical composition', 'Increases in pressure'], correct: 0 },
    { q: 'Why must Charles\' Law calculations use Kelvin, not Celsius?', options: ['Kelvin starts at absolute zero giving true proportions', 'Celsius is too complicated', 'Kelvin gives larger numbers', 'There is no difference'], correct: 0 },
    { q: 'At absolute zero, the theoretical volume of an ideal gas would be:', options: ['Zero', 'Infinite', '1 liter', 'Unchanged'], correct: 0 },
    { q: 'An isobaric process is one that occurs at constant:', options: ['Pressure', 'Temperature', 'Volume', 'Entropy'], correct: 0 },
    { q: 'A gas at 300 K has V = 6 L. At what temperature will V = 2 L?', options: ['100 K', '300 K', '900 K', '150 K'], correct: 0 },
    { q: 'Who first observed the volume-temperature relationship in gases?', options: ['Jacques Charles', 'Robert Boyle', 'Isaac Newton', 'Amedeo Avogadro'], correct: 0 },
    { q: 'Car tire pressure increases on hot days because:', options: ['Gas molecules move faster at higher temperature', 'The tire material shrinks', 'Atmospheric pressure increases', 'The tire absorbs moisture'], correct: 0 },
    { q: 'The slope of a V-T line (in Kelvin) at constant pressure equals:', options: ['nR/P', 'PV', 'nRT', '1/P'], correct: 0 }
  ];

  /* ================================================================
     PARTICLES INIT
     ================================================================ */
  function initParticles() {
    particles = [];
    for (var i = 0; i < NUM_PARTICLES; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2
      });
    }
  }

  /* ================================================================
     CANVAS RESIZE
     ================================================================ */
  function resize() {
    DPR = window.devicePixelRatio || 1;   // re-read: changes on zoom / monitor switch
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = Math.round(rect.width - 16);
    W = w;
    H = Math.round(w * 0.53);
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ================================================================
     PHYSICS UPDATE
     ================================================================ */
  function updatePhysics() {
    // Charles' Law: V = V1 * (T / T1)
    volume = V1 * (temperature / T1);

    /* Molecular speed goes as sqrt(T)  (v_rms = sqrt(3RT/M)), and that must be
       true of the speed actually seen ON SCREEN.

       Particle coordinates are normalised 0..1 inside the gas column, so pixel
       speed = (normalised step) x (column size in that direction). The column's
       WIDTH is fixed, but its HEIGHT is proportional to the volume, which under
       Charles' Law is itself proportional to T. So a single isotropic
       sqrt(T/300) step — which is what this used to do — produced a vertical
       pixel speed going as T^1.5: at 600 K the molecules moved 6.7x faster than
       they should relative to 100 K.

       x keeps the plain sqrt(T/300); y divides by the column growth (T1/T). */
    var sx = Math.sqrt(temperature / 300) * 0.02;
    var sy = sx * (T1 / temperature);

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.x += p.vx * sx;
      p.y += p.vy * sy;

      // Bounce off walls
      if (p.x < 0) { p.x = -p.x; p.vx = -p.vx; }
      if (p.x > 1) { p.x = 2 - p.x; p.vx = -p.vx; }
      if (p.y < 0) { p.y = -p.y; p.vy = -p.vy; }
      if (p.y > 1) { p.y = 2 - p.y; p.vy = -p.vy; }
    }

    // Record a V-T trail point only when the state actually moved, otherwise
    // the buffer just fills with copies of the current point.
    var last = vtTrail[vtTrail.length - 1];
    if (!last || Math.abs(last.t - temperature) > 1e-6) {
      vtTrail.push({ v: volume, t: temperature });
      if (vtTrail.length > MAX_TRAIL) vtTrail.shift();
    }
  }

  /* Canvas font sizing. Sizes used to be a raw fraction of W, which rendered
     every label at 3.6-7.5px on phone widths — illegible. Clamping the width
     used for the calculation keeps the size hierarchy intact while holding the
     smallest label at ~9px and stopping ultrawide screens from ballooning. */
  function fpx(k) {
    return (Math.max(920, Math.min(W, 1200)) * k).toFixed(1);
  }

  /* ================================================================
     DRAW (pure render)
     ================================================================ */
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // ── Layout ──
    var cylLeft = W * 0.04;
    var cylWidth = W * 0.32;
    var cylBottom = H * 0.88;
    var cylMaxHeight = H * 0.72;
    var cylTop = cylBottom - cylMaxHeight;

    /* The gas column height must be DIRECTLY proportional to the volume, with
       no offset. This tool's whole lesson is that V is proportional to T and
       extrapolates to V = 0 at absolute zero — the V-T chart alongside draws
       exactly that line through the origin and labels it "V = 0 at 0 K".

       The previous mapping, cylMaxHeight * (0.15 + 0.85 * vNorm), worked out to
       0.51V - 0.02: it hit zero height at V = 0.039 L rather than at V = 0, and
       over-drew the coldest state by 10%. The apparatus and the chart were
       making different claims about the one thing the tool exists to teach. */
    var vMax = V1 * 600 / T1;   // 2.0 L at the top of the temperature range
    var gasHeight = cylMaxHeight * Math.max(0, Math.min(1, volume / vMax));
    var pistonY = cylBottom - gasHeight;

    // ── Draw Cylinder ──
    ctx.save();
    // Cylinder body
    ctx.fillStyle = '#1a2030';
    ctx.strokeStyle = '#3a4a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(cylLeft, cylTop - 10, cylWidth, cylBottom - cylTop + 10);
    ctx.fill();
    ctx.stroke();

    // Gas region (below piston)
    var tempColor = getTemperatureColor(temperature);
    ctx.fillStyle = tempColor;
    ctx.fillRect(cylLeft + 2, pistonY, cylWidth - 4, cylBottom - pistonY);

    // Draw gas particles
    var pRadius = Math.max(2, W * 0.004);
    var speedScale = Math.sqrt(temperature / 300);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var px = cylLeft + 4 + p.x * (cylWidth - 8);
      var py = pistonY + 4 + p.y * (cylBottom - pistonY - 8);

      // Particle glow based on temperature
      ctx.beginPath();
      ctx.arc(px, py, pRadius + 1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,112,67,' + Math.min(0.6, 0.15 + speedScale * 0.15) + ')';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, pRadius, 0, Math.PI * 2);
      ctx.fillStyle = getParticleColor(temperature);
      ctx.fill();
    }

    // Piston
    ctx.fillStyle = '#4a5a7a';
    ctx.fillRect(cylLeft - 4, pistonY - 10, cylWidth + 8, 12);
    // Piston highlight
    ctx.fillStyle = '#5a6a8a';
    ctx.fillRect(cylLeft - 4, pistonY - 10, cylWidth + 8, 3);
    // Piston rod
    ctx.fillStyle = '#4a5a7a';
    ctx.fillRect(cylLeft + cylWidth * 0.45, pistonY - 10 - 50, cylWidth * 0.1, 50);

    // Weight on top (constant pressure indicator)
    var weightY = pistonY - 65;
    ctx.fillStyle = '#2a3a5a';
    ctx.strokeStyle = '#4a5a7a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(cylLeft + cylWidth * 0.2, weightY, cylWidth * 0.6, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8a9aba';
    ctx.font = fpx(0.012) + 'px ' + 'Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P = const', cylLeft + cylWidth * 0.5, weightY + 12);

    // Open top (show arrow for constant pressure)
    ctx.strokeStyle = '#ff7043';
    ctx.lineWidth = 1.5;
    var arrowX = cylLeft + cylWidth * 0.5;
    var arrowTop = weightY - 20;
    ctx.beginPath();
    ctx.moveTo(arrowX, pistonY - 12);
    ctx.lineTo(arrowX, arrowTop);
    ctx.stroke();
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(arrowX - 5, arrowTop + 8);
    ctx.lineTo(arrowX, arrowTop);
    ctx.lineTo(arrowX + 5, arrowTop + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(arrowX - 5, pistonY - 18);
    ctx.lineTo(arrowX, pistonY - 10);
    ctx.lineTo(arrowX + 5, pistonY - 18);
    ctx.stroke();

    // Cylinder bottom wall
    ctx.fillStyle = '#3a4a6a';
    ctx.fillRect(cylLeft - 4, cylBottom, cylWidth + 8, 4);

    ctx.restore();

    // ── Labels on cylinder ──
    ctx.save();
    ctx.font = 'bold ' + fpx(0.015) + 'px ' + 'Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('V = ' + volume.toFixed(3) + ' L', cylLeft + cylWidth * 0.5, cylBottom + 22);
    ctx.fillStyle = '#ff7043';
    ctx.fillText('T = ' + temperature + ' K', cylLeft + cylWidth * 0.5, cylBottom + 40);

    // Temperature in Celsius
    ctx.fillStyle = '#6b7a99';
    ctx.font = fpx(0.012) + 'px ' + 'Segoe UI, sans-serif';
    ctx.fillText('(' + (temperature - 273.15).toFixed(1) + '\u00B0C)', cylLeft + cylWidth * 0.5, cylBottom + 55);

    // Formula
    ctx.fillStyle = '#ff8a65';
    ctx.font = 'bold ' + fpx(0.014) + 'px ' + 'Courier New, monospace';
    ctx.fillText('V\u2081/T\u2081 = V\u2082/T\u2082', cylLeft + cylWidth * 0.5, H * 0.06);
    ctx.restore();

    // ── V-T Diagram ──
    drawVTDiagram();
  }

  function getTemperatureColor(t) {
    // Blue (cold) to red (hot) gradient
    var norm = (t - 100) / 500; // 0 to 1
    var r = Math.round(20 + norm * 40);
    var g = Math.round(25 + (1 - norm) * 15);
    var b = Math.round(50 + (1 - norm) * 30);
    return 'rgba(' + r + ',' + g + ',' + b + ',0.6)';
  }

  function getParticleColor(t) {
    var norm = (t - 100) / 500;
    if (norm < 0.33) {
      // Blue to yellow
      var f = norm / 0.33;
      return 'rgb(' + Math.round(100 + f * 155) + ',' + Math.round(160 + f * 90) + ',' + Math.round(255 - f * 155) + ')';
    } else if (norm < 0.66) {
      // Yellow to orange
      var f2 = (norm - 0.33) / 0.33;
      return 'rgb(255,' + Math.round(250 - f2 * 100) + ',' + Math.round(100 - f2 * 50) + ')';
    } else {
      // Orange to bright red-white
      var f3 = (norm - 0.66) / 0.34;
      return 'rgb(255,' + Math.round(150 - f3 * 80) + ',' + Math.round(50 + f3 * 100) + ')';
    }
  }

  function drawVTDiagram() {
    var chartLeft = W * 0.46;
    var chartRight = W * 0.95;
    var chartTop = H * 0.08;
    var chartBottom = H * 0.85;
    var chartW = chartRight - chartLeft;
    var chartH = chartBottom - chartTop;

    // Chart background
    ctx.save();
    ctx.fillStyle = '#0d1117';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(chartLeft, chartTop, chartW, chartH);
    ctx.fill();
    ctx.stroke();

    // Grid
    ctx.strokeStyle = '#1a2030';
    ctx.lineWidth = 0.5;

    // T axis: 0 K to 700 K
    var tMin = 0, tMax = 700;
    var vDMin = 0, vDMax = 2.5;

    // Vertical grid lines (temperature)
    for (var ti = 0; ti <= 700; ti += 100) {
      var tx = chartLeft + (ti - tMin) / (tMax - tMin) * chartW;
      ctx.beginPath();
      ctx.moveTo(tx, chartTop);
      ctx.lineTo(tx, chartBottom);
      ctx.stroke();

      ctx.fillStyle = '#6b7a99';
      ctx.font = fpx(0.011) + 'px ' + 'Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ti + '', tx, chartBottom + 14);
    }

    // Horizontal grid lines (volume)
    for (var vi = 0; vi <= 2.5; vi += 0.5) {
      var vy = chartBottom - (vi - vDMin) / (vDMax - vDMin) * chartH;
      ctx.beginPath();
      ctx.moveTo(chartLeft, vy);
      ctx.lineTo(chartRight, vy);
      ctx.stroke();

      ctx.fillStyle = '#6b7a99';
      ctx.font = fpx(0.011) + 'px ' + 'Segoe UI, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(vi.toFixed(1), chartLeft - 6, vy + 4);
    }

    // Axis labels
    ctx.fillStyle = '#8a9aba';
    ctx.font = 'bold ' + fpx(0.013) + 'px ' + 'Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Temperature (K)', chartLeft + chartW * 0.5, chartBottom + 30);

    ctx.save();
    ctx.translate(chartLeft - 35, chartTop + chartH * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Volume (L)', 0, 0);
    ctx.restore();

    // ── Charles' Law line: V = VT_CONST * T (straight line through origin) ──
    ctx.beginPath();
    ctx.strokeStyle = '#ff7043';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    // Draw the full theoretical line from origin to max
    var lineT0x = chartLeft + (0 - tMin) / (tMax - tMin) * chartW;
    var lineT0y = chartBottom;
    var lineT700x = chartLeft + (700 - tMin) / (tMax - tMin) * chartW;
    var lineV700 = VT_CONST * 700;
    var lineT700y = chartBottom - (lineV700 - vDMin) / (vDMax - vDMin) * chartH;

    ctx.beginPath();
    ctx.moveTo(lineT0x, lineT0y);
    ctx.lineTo(lineT700x, lineT700y);
    ctx.stroke();

    // ── Dashed extrapolation line to absolute zero ──
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255,112,67,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lineT0x, lineT0y);
    // Draw from T=0 up to T=100 (the actual operating range start)
    var lineT100x = chartLeft + (100 - tMin) / (tMax - tMin) * chartW;
    var lineV100 = VT_CONST * 100;
    var lineT100y = chartBottom - (lineV100 - vDMin) / (vDMax - vDMin) * chartH;
    ctx.moveTo(lineT0x, lineT0y);
    ctx.lineTo(lineT100x, lineT100y);
    ctx.stroke();
    ctx.setLineDash([]);

    // ── Absolute zero label ──
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold ' + fpx(0.011) + 'px ' + 'Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('V = 0 at 0 K', lineT0x + 4, lineT0y - 8);
    ctx.fillStyle = '#6b7a99';
    ctx.font = fpx(0.01) + 'px ' + 'Segoe UI, sans-serif';
    ctx.fillText('(\u2212273.15\u00B0C)', lineT0x + 4, lineT0y - 20);

    // ── V-T trail dots ──
    ctx.fillStyle = 'rgba(255,112,67,0.15)';
    for (var j = 0; j < vtTrail.length; j++) {
      var pt = vtTrail[j];
      var ptx = chartLeft + (pt.t - tMin) / (tMax - tMin) * chartW;
      var pty = chartBottom - (pt.v - vDMin) / (vDMax - vDMin) * chartH;
      ctx.beginPath();
      ctx.arc(ptx, pty, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Current state marker ──
    var curX = chartLeft + (temperature - tMin) / (tMax - tMin) * chartW;
    var curY = chartBottom - (volume - vDMin) / (vDMax - vDMin) * chartH;

    // Glow
    ctx.beginPath();
    ctx.arc(curX, curY, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,112,67,0.25)';
    ctx.fill();

    // Marker
    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ff7043';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label for current state
    ctx.fillStyle = '#dde3f0';
    ctx.font = 'bold ' + fpx(0.012) + 'px ' + 'Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    var labelText = '(' + temperature + ' K, ' + volume.toFixed(3) + ' L)';
    /* Flip and clamp using the MEASURED text width. The old guard assumed a
       fixed 120/130px label, which on narrow canvases pushed the text ~35px
       outside the plot and straight over the "Volume (L)" axis caption. */
    var labelW = ctx.measureText(labelText).width;
    var labelX = curX + 10;
    var labelY = curY - 10;
    if (labelX + labelW > chartRight - 4) labelX = curX - 10 - labelW;
    if (labelX < chartLeft + 4) labelX = chartLeft + 4;
    if (labelY < chartTop + 14) labelY = curY + 22;
    if (labelY > chartBottom - 6) labelY = chartBottom - 6;
    ctx.fillText(labelText, labelX, labelY);

    // Chart title
    ctx.fillStyle = '#dde3f0';
    ctx.font = 'bold ' + fpx(0.014) + 'px ' + 'Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('V-T Diagram (Isobar at ' + P_CONST.toFixed(1) + ' kPa)', chartLeft + chartW * 0.5, chartTop - 6);

    // Label the line
    ctx.fillStyle = '#ff8a65';
    ctx.font = fpx(0.011) + 'px ' + 'Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    var lineLabelX = chartLeft + (550 - tMin) / (tMax - tMin) * chartW;
    var lineLabelV = VT_CONST * 550;
    var lineLabelY = chartBottom - (lineLabelV - vDMin) / (vDMax - vDMin) * chartH;
    ctx.fillText('V = (nR/P)\u00B7T', lineLabelX + 5, lineLabelY - 8);

    ctx.restore();
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    rVolume.textContent = volume.toFixed(3);
    rTemp.textContent = temperature;
    rTempC.textContent = (temperature - 273.15).toFixed(2);
    rVT.textContent = (volume / temperature * 1000).toFixed(3);
    rPressure.textContent = P_CONST.toFixed(2);
    svTemp.textContent = temperature + ' K';
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    updatePhysics();
    draw();
    updateReadouts();
    animId = requestAnimationFrame(animate);
  }

  function startAnimation() {
    if (!animId) animate();
  }

  function stopAnimation() {
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

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

    if (m === 'simulate') {
      simPanel.style.display = '';
      canvasCard.style.display = '';
      startAnimation();
    } else if (m === 'explore') {
      canvasCard.style.display = 'none';
      stopAnimation();
      catRow.style.display = '';
      itemSelector.style.display = '';
      buildConceptGrid();
    } else if (m === 'practice') {
      canvasCard.style.display = 'none';
      stopAnimation();
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      practiceScore = 0;
      practiceTotal = 0;
      pbarScoreVal.textContent = '0 / 0';
      newPractice();
    } else if (m === 'quiz') {
      canvasCard.style.display = 'none';
      stopAnimation();
      quizBar.style.display = '';
      startQuiz();
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
    itemInfo.style.display = 'none';
    buildConceptGrid();
  });

  function buildConceptGrid() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      var isActive = selectedConcept && selectedConcept.id === c.id;
      html += '<button class="is-btn' + (isActive ? ' active' : '') + '" data-id="' + c.id + '">';
      html += '<span class="is-btn-name">' + c.name + '</span>';
      html += '<span class="is-btn-sym">' + c.symbol + '</span>';
      html += '</button>';
    }
    conceptGrid.innerHTML = html;
  }

  conceptGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.is-btn');
    if (!btn) return;
    var id = btn.dataset.id;
    selectedConcept = CONCEPTS.find(function (c) { return c.id === id; });
    if (!selectedConcept) return;

    document.querySelectorAll('.is-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.id === id);
    });

    showConceptInfo(selectedConcept);
  });

  function showConceptInfo(c) {
    var catLabels = { basics: 'Gas Laws Basics', charles: 'Charles\' Law', zero: 'Absolute Zero', applications: 'Applications' };
    var html = '';
    html += '<div class="ii-top"><span class="ii-name">' + c.name + '</span>';
    html += '<span class="ii-cat-badge">' + (catLabels[c.cat] || c.cat) + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>';
    html += '<span class="fb-unit">Unit: ' + c.unit + '</span></div>';
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      for (var s = 0; s < c.example.steps.length; s++) {
        html += '<p class="ex-step">\u2192 <strong>' + c.example.steps[s] + '</strong></p>';
      }
      html += '</div>';
    }
    itemInfo.innerHTML = html;
    itemInfo.style.display = '';
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function newPractice() {
    currentProblem = generatePractice();
    practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppCheck.style.display = '';
    ppShow.style.display = '';
    ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') checkPractice();
  });

  function checkPractice() {
    if (practiceAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) {
      ppFeedback.textContent = 'Enter a number.';
      ppFeedback.className = 'feedback err';
      return;
    }
    practiceAnswered = true;
    practiceTotal++;
    ppInput.disabled = true;

    var diff = Math.abs(userVal - currentProblem.answer);
    if (diff <= currentProblem.tolerance) {
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
  }

  ppShow.addEventListener('click', function () {
    if (practiceAnswered) return;
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
    if (!currentProblem) return;
    var html = '<h4>Solution</h4>';
    for (var s = 0; s < currentProblem.steps.length; s++) {
      html += '<p class="sol-step">\u2192 <strong>' + currentProblem.steps[s] + '</strong></p>';
    }
    ppSolution.innerHTML = html;
    ppSolution.style.display = '';
  }

  ppNext.addEventListener('click', function () { newPractice(); });

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function startQuiz() {
    quizScore = 0;
    quizIdx = 0;
    quizAnswered = false;
    quizAnswers = [];
    quizResult.style.display = 'none';

    // Shuffle and pick QUIZ_SIZE questions
    var pool = QUIZ_POOL.map(function (q, idx) {
      // Shuffle options while tracking correct answer
      var options = q.options.slice();
      var correctText = options[q.correct];
      var shuffled = shuffle(options.slice());
      var newCorrect = shuffled.indexOf(correctText);
      return { q: q.q, options: shuffled, correct: newCorrect, origIdx: idx };
    });
    quizSet = shuffle(pool).slice(0, QUIZ_SIZE);
    showQuizQuestion();
  }

  function showQuizQuestion() {
    if (quizIdx >= quizSet.length) {
      showQuizResult();
      return;
    }
    quizAnswered = false;
    var q = quizSet[quizIdx];
    qbarNum.textContent = (quizIdx + 1);

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.q + '</p>';
    html += '<div class="answer-grid">';
    for (var i = 0; i < q.options.length; i++) {
      html += '<button class="answer-btn" data-idx="' + i + '">' + q.options[i] + '</button>';
    }
    html += '</div>';
    quizPanel.innerHTML = html;
    quizPanel.style.display = '';
  }

  quizPanel.addEventListener('click', function (e) {
    var btn = e.target.closest('.answer-btn');
    if (!btn || quizAnswered) return;
    quizAnswered = true;

    var selected = parseInt(btn.dataset.idx, 10);
    var q = quizSet[quizIdx];
    var isCorrect = selected === q.correct;

    if (isCorrect) quizScore++;
    quizAnswers.push({ q: q.q, selected: q.options[selected], correct: q.options[q.correct], ok: isCorrect });

    // Highlight answers
    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b) {
      b.classList.add('locked');
      var idx = parseInt(b.dataset.idx, 10);
      if (idx === q.correct) b.classList.add('correct');
      if (idx === selected && !isCorrect) b.classList.add('wrong');
    });

    // Auto-advance after delay
    setTimeout(function () {
      quizIdx++;
      showQuizQuestion();
    }, 1200);
  });

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';

    var stars, cls, verdict;
    if (quizScore === QUIZ_SIZE) {
      stars = '\u2605\u2605\u2605'; cls = 'perfect'; verdict = 'Perfect score!';
    } else if (quizScore >= 3) {
      stars = '\u2605\u2605\u2606'; cls = 'good'; verdict = 'Good job!';
    } else {
      stars = '\u2605\u2606\u2606'; cls = 'poor'; verdict = 'Keep practicing!';
    }

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</span>';
    html += '<div class="qr-verdict">' + verdict + '</div></div></div>';

    html += '<div class="qr-rows">';
    for (var i = 0; i < quizAnswers.length; i++) {
      var a = quizAnswers[i];
      html += '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail">';
      if (a.ok) {
        html += '<strong>' + a.correct + '</strong>';
      } else {
        html += 'Your answer: <strong>' + a.selected + '</strong> \u2014 Correct: <strong>' + a.correct + '</strong>';
      }
      html += '</span>';
      html += '<span class="qr-mark">' + (a.ok ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn btn-primary" id="quiz-retry">New Quiz</button>';

    quizResult.innerHTML = html;
    quizResult.style.display = '';

    document.getElementById('quiz-retry').addEventListener('click', function () {
      quizResult.style.display = 'none';
      quizBar.style.display = '';
      startQuiz();
    });
  }

  /* ================================================================
     SLIDER INPUT
     ================================================================ */
  slTemp.addEventListener('input', function () {
    temperature = parseInt(slTemp.value, 10);
    /* Derive the new volume and refresh the readouts here rather than waiting
       for the next animation frame. The numbers are a direct function of the
       slider, so they should not depend on the rAF loop running — that made
       the displayed values lag whenever frames were throttled. */
    volume = V1 * (temperature / T1);
    updateReadouts();
    draw();
  });

  /* ================================================================
     INIT
     ================================================================ */
  initParticles();
  resize();
  window.addEventListener('resize', function () { resize(); draw(); });
  startAnimation();

})();
