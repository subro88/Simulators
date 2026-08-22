(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS
     ================================================================ */

  var CONCEPTS = [
    /* ── Conduction ───────────────────────────────────────────────── */
    {
      id: 'fouriers-law', name: "Fourier's Law", symbol: 'Q = kA\u0394T/L',
      formula: 'Q = kA(T\u2081\u2212T\u2082)/L', unit: 'W',
      cat: 'conduction',
      desc: "Fourier's Law of heat conduction states that the rate of heat transfer through a material is proportional to the negative of the temperature gradient and the cross-sectional area. Q = kA(T\u2081\u2212T\u2082)/L, where k is thermal conductivity (W/m\u00B7K), A is cross-sectional area (m\u00B2), \u0394T is the temperature difference (K), and L is thickness (m). Heat always flows from high to low temperature.",
      diagram: 'fouriersLaw',
      example: { problem: 'A steel wall (k = 50 W/m\u00B7K) is 0.1 m thick with area 2 m\u00B2. T_hot = 400\u00B0C, T_cold = 50\u00B0C. Find Q.', steps: ['Q = kA(T\u2081\u2212T\u2082)/L', 'Q = 50 \u00D7 2 \u00D7 (400\u221250) / 0.1', 'Q = 50 \u00D7 2 \u00D7 350 / 0.1', 'Q = 350000 W = 350 kW'], answer: 350000, unit: 'W' }
    },
    {
      id: 'thermal-conductivity', name: 'Thermal Conductivity', symbol: 'k (W/m\u00B7K)',
      formula: 'k = QL / (A\u0394T)', unit: 'W/m\u00B7K',
      cat: 'conduction',
      desc: 'Thermal conductivity (k) is a material property that indicates how well a material conducts heat. High k means the material is a good conductor (metals: copper k\u224838 W/m\u00B7K, steel k\u224850 W/m\u00B7K). Low k means the material is an insulator (brick k\u22480.7 W/m\u00B7K, glass k\u22481.0 W/m\u00B7K). k depends on material composition, temperature, and phase.',
      diagram: 'thermalConductivity',
      example: { problem: 'A material transfers 5000 W through 0.05 m thickness, area 2 m\u00B2, with \u0394T = 100 K. Find k.', steps: ['k = QL / (A\u0394T)', 'k = 5000 \u00D7 0.05 / (2 \u00D7 100)', 'k = 250 / 200', 'k = 1.25 W/m\u00B7K'], answer: 1.25, unit: 'W/m\u00B7K' }
    },
    {
      id: 'composite-wall', name: 'Composite Wall', symbol: 'R_total = \u03A3(L/kA)',
      formula: 'Q = \u0394T / \u03A3(L\u1D62/k\u1D62A)', unit: 'W',
      cat: 'conduction',
      desc: 'A composite wall consists of multiple layers of different materials. The total thermal resistance is the sum of individual resistances: R_total = R\u2081 + R\u2082 + ... = L\u2081/(k\u2081A) + L\u2082/(k\u2082A) + ... The heat transfer rate is Q = \u0394T_overall / R_total. This is analogous to electrical resistors in series.',
      diagram: 'compositeWall',
      example: { problem: 'A wall has 0.1 m brick (k=0.7) and 0.05 m insulation (k=0.04), area 1 m\u00B2. \u0394T = 200 K. Find Q.', steps: ['R_brick = 0.1/(0.7\u00D71) = 0.143 K/W', 'R_ins = 0.05/(0.04\u00D71) = 1.25 K/W', 'R_total = 0.143 + 1.25 = 1.393 K/W', 'Q = 200/1.393 = 143.6 W'], answer: 143.6, unit: 'W' }
    },
    {
      id: 'thermal-resistance', name: 'Thermal Resistance', symbol: 'R = L/(kA)',
      formula: 'R_cond = L/(kA) [K/W]', unit: 'K/W',
      cat: 'conduction',
      desc: 'Thermal resistance is the opposition to heat flow, analogous to electrical resistance. For conduction: R = L/(kA). For convection: R = 1/(hA). For radiation: R = 1/(h_rad\u00B7A). The overall resistance of layers in series is their sum. The heat transfer rate Q = \u0394T/R. Lower resistance means more heat flows for the same temperature difference.',
      diagram: 'thermalResistance',
      example: { problem: 'A copper plate (k = 385 W/m\u00B7K) is 0.02 m thick, area 0.5 m\u00B2. Find thermal resistance.', steps: ['R = L / (kA)', 'R = 0.02 / (385 \u00D7 0.5)', 'R = 0.02 / 192.5', 'R = 1.04 \u00D7 10\u207B\u2074 K/W'], answer: 0.000104, unit: 'K/W' }
    },

    /* ── Convection ───────────────────────────────────────────────── */
    {
      id: 'newtons-cooling', name: "Newton's Law of Cooling", symbol: 'Q = hA\u0394T',
      formula: 'Q = hA(T_s \u2212 T_\u221E)', unit: 'W',
      cat: 'convection',
      desc: "Newton's Law of Cooling states that the convective heat transfer rate is proportional to the temperature difference between a surface and the surrounding fluid: Q = hA(T_s \u2212 T_\u221E). Here h is the convective heat transfer coefficient (W/m\u00B2\u00B7K), A is surface area, T_s is surface temperature, and T_\u221E is the bulk fluid temperature.",
      diagram: 'newtonsCooling',
      example: { problem: 'A heated plate (A = 0.5 m\u00B2) at 150\u00B0C is cooled by air at 25\u00B0C with h = 40 W/m\u00B2K. Find Q.', steps: ['Q = hA(T_s \u2212 T_\u221E)', 'Q = 40 \u00D7 0.5 \u00D7 (150 \u2212 25)', 'Q = 20 \u00D7 125', 'Q = 2500 W'], answer: 2500, unit: 'W' }
    },
    {
      id: 'natural-vs-forced', name: 'Natural vs Forced Convection', symbol: 'h_nat < h_forced',
      formula: 'Natural: h = 5\u201325 | Forced: h = 25\u2013500 W/m\u00B2K', unit: 'W/m\u00B2K',
      cat: 'convection',
      desc: 'Natural (free) convection occurs when fluid motion is driven by buoyancy forces due to density differences caused by temperature gradients. Forced convection occurs when fluid is moved by external means (fans, pumps). Forced convection has much higher h values (25\u2013500 W/m\u00B2K) compared to natural convection (5\u201325 W/m\u00B2K), resulting in more effective heat transfer.',
      diagram: 'naturalVsForced',
      example: { problem: 'A 1 m\u00B2 surface at 80\u00B0C, ambient 20\u00B0C. Compare Q for natural (h=10) vs forced (h=100) convection.', steps: ['Q_nat = 10 \u00D7 1 \u00D7 (80\u221220) = 600 W', 'Q_forced = 100 \u00D7 1 \u00D7 (80\u221220) = 6000 W', 'Forced is 10\u00D7 more effective', 'Q_forced / Q_nat = 10'], answer: 6000, unit: 'W' }
    },
    {
      id: 'ht-coefficient', name: 'Heat Transfer Coefficient', symbol: 'h (W/m\u00B2\u00B7K)',
      formula: 'h = Q / (A\u0394T)', unit: 'W/m\u00B2\u00B7K',
      cat: 'convection',
      desc: 'The convective heat transfer coefficient h depends on fluid properties (viscosity, conductivity, density), flow conditions (velocity, turbulence), and geometry. For air: h \u2248 5\u201325 (natural), 25\u2013250 (forced). For water: h \u2248 100\u20131000 (forced). For boiling water: h \u2248 2500\u201325000. Higher h means more efficient convective heat removal.',
      diagram: 'htCoefficient',
      example: { problem: 'A surface loses 4000 W by convection. Area = 2 m\u00B2, T_s = 90\u00B0C, T_fluid = 30\u00B0C. Find h.', steps: ['h = Q / (A\u0394T)', 'h = 4000 / (2 \u00D7 (90\u221230))', 'h = 4000 / (2 \u00D7 60)', 'h = 33.3 W/m\u00B2\u00B7K'], answer: 33.3, unit: 'W/m\u00B2K' }
    },
    {
      id: 'boundary-layer', name: 'Thermal Boundary Layer', symbol: '\u03B4_T',
      formula: '\u03B4_T grows with distance from leading edge', unit: 'm',
      cat: 'convection',
      desc: 'The thermal boundary layer is the thin region near a surface where the temperature transitions from the surface temperature to the free-stream fluid temperature. Its thickness \u03B4_T grows along the flow direction. The temperature gradient within this layer drives convective heat transfer. Thinner boundary layers (higher velocity, turbulence) yield higher h values.',
      diagram: 'boundaryLayer',
      example: { problem: 'Air flows over a plate. At a point, the boundary layer is 5 mm thick. T_surface = 100\u00B0C, T_\u221E = 20\u00B0C. Estimate the local temperature gradient.', steps: ['Approximate \u0394T across boundary layer', '\u0394T = 100 \u2212 20 = 80\u00B0C = 80 K', 'Gradient \u2248 \u0394T/\u03B4_T = 80/0.005', 'Gradient \u2248 16000 K/m'], answer: 16000, unit: 'K/m' }
    },

    /* ── Radiation ─────────────────────────────────────────────────── */
    {
      id: 'stefan-boltzmann', name: 'Stefan-Boltzmann Law', symbol: 'Q = \u03B5\u03C3A(T\u2081\u2074\u2212T\u2082\u2074)',
      formula: 'Q = \u03B5\u03C3A(T\u2081\u2074 \u2212 T\u2082\u2074)', unit: 'W',
      cat: 'radiation',
      desc: 'The Stefan-Boltzmann Law gives the net radiative heat exchange between a surface and its surroundings: Q = \u03B5\u03C3A(T\u2081\u2074 \u2212 T\u2082\u2074). Here \u03B5 is emissivity (0 to 1), \u03C3 = 5.67\u00D710\u207B\u2078 W/(m\u00B2\u00B7K\u2074) is the Stefan-Boltzmann constant, A is area, and T\u2081, T\u2082 are absolute temperatures in Kelvin. The T\u2074 dependence makes radiation dominant at high temperatures.',
      diagram: 'stefanBoltzmann',
      example: { problem: 'A surface (\u03B5 = 0.9, A = 2 m\u00B2) at 600 K radiates to surroundings at 300 K. Find Q.', steps: ['Q = \u03B5\u03C3A(T\u2081\u2074 \u2212 T\u2082\u2074)', '\u03C3 = 5.67\u00D710\u207B\u2078 W/(m\u00B2K\u2074)', 'Q = 0.9 \u00D7 5.67e\u22128 \u00D7 2 \u00D7 (600\u2074\u2212300\u2074)', 'Q = 0.9 \u00D7 5.67e\u22128 \u00D7 2 \u00D7 (1.296e11\u22128.1e9) = 12,400 W'], answer: 12400, unit: 'W' }
    },
    {
      id: 'emissivity', name: 'Emissivity', symbol: '\u03B5 (0\u20131)',
      formula: '\u03B5 = E_actual / E_blackbody', unit: '\u2014',
      cat: 'radiation',
      desc: 'Emissivity (\u03B5) is the ratio of radiation emitted by a real surface to that emitted by a blackbody at the same temperature. A blackbody has \u03B5 = 1 (perfect emitter/absorber). Polished metals have low \u03B5 (0.02\u20130.1), oxidised metals moderate (0.4\u20130.8), and non-metals high \u03B5 (0.8\u20130.95). Emissivity affects how much radiation a surface emits and absorbs.',
      diagram: 'emissivity',
      example: { problem: 'A blackbody at 500 K emits 3544 W/m\u00B2. An oxidised surface at 500 K emits 2480 W/m\u00B2. Find emissivity.', steps: ['\u03B5 = E_actual / E_blackbody', '\u03B5 = 2480 / 3544', '\u03B5 = 0.70', 'Oxidised surface emissivity = 0.70'], answer: 0.70, unit: '' }
    },
    {
      id: 'blackbody', name: 'Blackbody Radiation', symbol: 'E_b = \u03C3T\u2074',
      formula: 'E_b = \u03C3T\u2074 (W/m\u00B2)', unit: 'W/m\u00B2',
      cat: 'radiation',
      desc: 'A blackbody is an idealised surface that absorbs all incident radiation and emits the maximum possible radiation at any temperature. The emissive power of a blackbody is E_b = \u03C3T\u2074, where \u03C3 = 5.67\u00D710\u207B\u2078 W/(m\u00B2\u00B7K\u2074). Real surfaces emit less than a blackbody, scaled by their emissivity: E = \u03B5\u03C3T\u2074.',
      diagram: 'blackbody',
      example: { problem: 'Find the blackbody emissive power at 1000 K.', steps: ['E_b = \u03C3T\u2074', 'E_b = 5.67\u00D710\u207B\u2078 \u00D7 (1000)\u2074', 'E_b = 5.67\u00D710\u207B\u2078 \u00D7 10\u00B9\u00B2', 'E_b = 56700 W/m\u00B2 = 56.7 kW/m\u00B2'], answer: 56700, unit: 'W/m\u00B2' }
    },
    {
      id: 'view-factor', name: 'View Factor', symbol: 'F\u2081\u2082',
      formula: 'Q\u2081\u2082 = \u03B5\u03C3A\u2081F\u2081\u2082(T\u2081\u2074\u2212T\u2082\u2074)', unit: '\u2014',
      cat: 'radiation',
      desc: 'The view factor F\u2081\u2082 is the fraction of radiation leaving surface 1 that is intercepted by surface 2. It depends on geometry, orientation, and distance. For two parallel infinite plates: F\u2081\u2082 = 1. For a small surface enclosed by a large surface: F\u2081\u2082 \u2248 1. The reciprocity relation states: A\u2081F\u2081\u2082 = A\u2082F\u2082\u2081.',
      diagram: 'viewFactor',
      example: { problem: 'Two parallel plates (A = 1 m\u00B2, F\u2081\u2082 = 1, \u03B5 = 0.8) at 800 K and 400 K. Find net Q.', steps: ['Q = \u03B5\u03C3AF\u2081\u2082(T\u2081\u2074\u2212T\u2082\u2074)', 'Q = 0.8\u00D75.67e\u22128\u00D71\u00D71\u00D7(800\u2074\u2212400\u2074)', 'T\u2081\u2074\u2212T\u2082\u2074 = 4.096e11\u22122.56e10 = 3.84e11', 'Q = 0.8\u00D75.67e\u22128\u00D73.84e11 = 17,418 W'], answer: 17418, unit: 'W' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 — Conduction through a wall */
    function () {
      var mats = [
        { name: 'steel', k: 50 },
        { name: 'copper', k: 385 },
        { name: 'brick', k: 0.7 },
        { name: 'glass', k: 1.0 }
      ];
      var mat = mats[randInt(0, mats.length - 1)];
      var L = +(randInt(2, 20) / 100).toFixed(2);
      var A = randInt(1, 5);
      var T1 = randInt(100, 500);
      var T2 = randInt(20, 80);
      var Q = +(mat.k * A * (T1 - T2) / L).toFixed(1);
      return { prompt: 'A ' + mat.name + ' wall (k = ' + mat.k + ' W/m\u00B7K) is ' + L + ' m thick, area ' + A + ' m\u00B2. T_hot = ' + T1 + '\u00B0C, T_cold = ' + T2 + '\u00B0C. Find Q (W).', steps: ['Q = kA\u0394T/L', 'Q = ' + mat.k + ' \u00D7 ' + A + ' \u00D7 (' + T1 + '\u2212' + T2 + ') / ' + L, '\u0394T = ' + (T1 - T2) + ' K', 'Q = ' + Q + ' W'], answer: Q, unit: 'W' };
    },
    /* 1 — Thermal resistance of a slab */
    function () {
      var k = randInt(1, 50);
      var L = +(randInt(1, 30) / 100).toFixed(2);
      var A = randInt(1, 5);
      var R = +(L / (k * A)).toFixed(4);
      return { prompt: 'A slab has k = ' + k + ' W/m\u00B7K, thickness ' + L + ' m, area ' + A + ' m\u00B2. Find the thermal resistance (K/W).', steps: ['R = L / (kA)', 'R = ' + L + ' / (' + k + ' \u00D7 ' + A + ')', 'R = ' + L + ' / ' + (k * A), 'R = ' + R + ' K/W'], answer: R, unit: 'K/W' };
    },
    /* 2 — Convection heat loss */
    function () {
      var h = randInt(10, 200);
      var A = +(randInt(5, 30) / 10).toFixed(1);
      var Ts = randInt(60, 300);
      var Tf = randInt(15, 40);
      var Q = +(h * A * (Ts - Tf)).toFixed(1);
      return { prompt: 'A surface (A = ' + A + ' m\u00B2) at ' + Ts + '\u00B0C is cooled by fluid at ' + Tf + '\u00B0C, h = ' + h + ' W/m\u00B2K. Find Q (W).', steps: ['Q = hA(T_s \u2212 T_\u221E)', 'Q = ' + h + ' \u00D7 ' + A + ' \u00D7 (' + Ts + ' \u2212 ' + Tf + ')', '\u0394T = ' + (Ts - Tf) + ' K', 'Q = ' + Q + ' W'], answer: Q, unit: 'W' };
    },
    /* 3 — Find h from convection data */
    function () {
      var Q = randInt(500, 10000);
      var A = +(randInt(5, 30) / 10).toFixed(1);
      var Ts = randInt(80, 250);
      var Tf = randInt(15, 40);
      var h = +(Q / (A * (Ts - Tf))).toFixed(1);
      return { prompt: 'A surface (A = ' + A + ' m\u00B2) at ' + Ts + '\u00B0C loses ' + Q + ' W to fluid at ' + Tf + '\u00B0C. Find h (W/m\u00B2K).', steps: ['h = Q / (A\u0394T)', 'h = ' + Q + ' / (' + A + ' \u00D7 ' + (Ts - Tf) + ')', 'h = ' + Q + ' / ' + (A * (Ts - Tf)).toFixed(1), 'h = ' + h + ' W/m\u00B2K'], answer: h, unit: 'W/m\u00B2K' };
    },
    /* 4 — Radiation between surfaces */
    function () {
      var eps = +(randInt(5, 10) / 10).toFixed(1);
      var A = randInt(1, 4);
      var T1 = randInt(400, 800);
      var T2 = randInt(250, 350);
      var sigma = 5.67e-8;
      var Q = +(eps * sigma * A * (Math.pow(T1, 4) - Math.pow(T2, 4))).toFixed(1);
      return { prompt: 'A surface (\u03B5 = ' + eps + ', A = ' + A + ' m\u00B2) at ' + T1 + ' K radiates to surroundings at ' + T2 + ' K. Find net Q (W).', steps: ['Q = \u03B5\u03C3A(T\u2081\u2074\u2212T\u2082\u2074)', '\u03C3 = 5.67\u00D710\u207B\u2078 W/(m\u00B2K\u2074)', 'T\u2081\u2074 = ' + T1 + '\u2074 = ' + Math.pow(T1, 4).toExponential(2), 'Q = ' + Q + ' W'], answer: Q, unit: 'W' };
    },
    /* 5 — Blackbody emissive power */
    function () {
      var T = randInt(300, 1200);
      var sigma = 5.67e-8;
      var Eb = +(sigma * Math.pow(T, 4)).toFixed(1);
      return { prompt: 'Find the blackbody emissive power at T = ' + T + ' K (W/m\u00B2).', steps: ['E_b = \u03C3T\u2074', '\u03C3 = 5.67\u00D710\u207B\u2078 W/(m\u00B2K\u2074)', 'E_b = 5.67e\u22128 \u00D7 ' + T + '\u2074', 'E_b = ' + Eb + ' W/m\u00B2'], answer: Eb, unit: 'W/m\u00B2' };
    },
    /* 6 — Heat flux through conduction */
    function () {
      var k = randInt(10, 100);
      var L = +(randInt(2, 20) / 100).toFixed(2);
      var T1 = randInt(200, 600);
      var T2 = randInt(20, 80);
      var q = +(k * (T1 - T2) / L).toFixed(1);
      return { prompt: 'A wall (k = ' + k + ' W/m\u00B7K, L = ' + L + ' m) has T\u2081 = ' + T1 + '\u00B0C, T\u2082 = ' + T2 + '\u00B0C. Find heat flux q (W/m\u00B2).', steps: ['q = k\u0394T/L', 'q = ' + k + ' \u00D7 (' + T1 + '\u2212' + T2 + ') / ' + L, 'q = ' + k + ' \u00D7 ' + (T1 - T2) + ' / ' + L, 'q = ' + q + ' W/m\u00B2'], answer: q, unit: 'W/m\u00B2' };
    },
    /* 7 — Temperature gradient */
    function () {
      var T1 = randInt(200, 600);
      var T2 = randInt(20, 100);
      var L = +(randInt(2, 30) / 100).toFixed(2);
      var grad = +((T1 - T2) / L).toFixed(1);
      return { prompt: 'A wall is ' + L + ' m thick. T_hot = ' + T1 + '\u00B0C, T_cold = ' + T2 + '\u00B0C. Find the temperature gradient (K/m).', steps: ['\u0394T/L = (T\u2081\u2212T\u2082)/L', '\u0394T = ' + T1 + ' \u2212 ' + T2 + ' = ' + (T1 - T2) + ' K', 'Gradient = ' + (T1 - T2) + ' / ' + L, 'Gradient = ' + grad + ' K/m'], answer: grad, unit: 'K/m' };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: "Fourier's Law of conduction is:", options: ['Q = kA\u0394T/L', 'Q = hA\u0394T', 'Q = \u03B5\u03C3AT\u2074', 'Q = mc\u0394T'], correct: 0 },
    { type: 'mcq', prompt: 'The Stefan-Boltzmann constant \u03C3 is approximately:', options: ['5.67\u00D710\u207B\u2078 W/(m\u00B2\u00B7K\u2074)', '5.67\u00D710\u207B\u2074 W/(m\u00B2\u00B7K\u2074)', '8.314 J/(mol\u00B7K)', '1.38\u00D710\u207B\u00B2\u00B3 J/K'], correct: 0 },
    { type: 'mcq', prompt: 'A blackbody has an emissivity of:', options: ['1.0 (perfect emitter)', '0.5 (average emitter)', '0 (no emission)', 'Infinity'], correct: 0 },
    { type: 'mcq', prompt: 'Natural convection is driven by:', options: ['Buoyancy forces from temperature-induced density differences', 'External fans or pumps', 'Electromagnetic waves', 'Molecular diffusion only'], correct: 0 },
    { type: 'mcq', prompt: 'Which material has the highest thermal conductivity?', options: ['Copper (k \u2248 385 W/m\u00B7K)', 'Steel (k \u2248 50 W/m\u00B7K)', 'Brick (k \u2248 0.7 W/m\u00B7K)', 'Glass (k \u2248 1.0 W/m\u00B7K)'], correct: 0 },
    { type: 'mcq', prompt: 'Thermal resistance for conduction through a flat wall is:', options: ['R = L/(kA)', 'R = 1/(hA)', 'R = kA/L', 'R = hA'], correct: 0 },
    { type: 'mcq', prompt: "Newton's Law of Cooling describes:", options: ['Convective heat transfer between a surface and a fluid', 'Heat conduction through a solid', 'Radiative heat exchange between surfaces', 'Phase change heat transfer'], correct: 0 },
    { type: 'mcq', prompt: 'Radiation heat transfer depends on temperature as:', options: ['T\u2074 (fourth power)', 'T (linear)', 'T\u00B2 (squared)', 'T\u00B3 (cubed)'], correct: 0 },
    { type: 'mcq', prompt: 'Forced convection typically has h values:', options: ['Higher than natural convection (25\u2013500 W/m\u00B2K)', 'Lower than natural convection', 'Equal to natural convection', 'Zero'], correct: 0 },
    { type: 'mcq', prompt: 'In a composite wall, thermal resistances are added:', options: ['In series (R_total = R\u2081 + R\u2082 + ...)', 'In parallel (1/R_total = 1/R\u2081 + 1/R\u2082)', 'By multiplication', 'They cannot be combined'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'A steel wall (k = 50 W/m\u00B7K) is 0.1 m thick, area 2 m\u00B2. \u0394T = 300 K. Find Q (W).', answer: 300000, unit: 'W', steps: ['Q = kA\u0394T/L = 50\u00D72\u00D7300/0.1', 'Q = 300000 W'] },
    { type: 'numeric', prompt: 'h = 50 W/m\u00B2K, A = 3 m\u00B2, T_s = 200\u00B0C, T_fluid = 30\u00B0C. Find Q (W).', answer: 25500, unit: 'W', steps: ['Q = hA(T_s\u2212T_\u221E) = 50\u00D73\u00D7170', 'Q = 25500 W'] },
    { type: 'numeric', prompt: 'Find blackbody emissive power at 500 K (W/m\u00B2). \u03C3 = 5.67\u00D710\u207B\u2078.', answer: 3544, unit: 'W/m\u00B2', steps: ['E_b = \u03C3T\u2074 = 5.67e\u22128 \u00D7 500\u2074', 'E_b = 5.67e\u22128 \u00D7 6.25e10 = 3544 W/m\u00B2'] },
    { type: 'numeric', prompt: 'A brick wall (k = 0.7) is 0.2 m thick, area 1 m\u00B2. Find thermal resistance (K/W).', answer: 0.286, unit: 'K/W', steps: ['R = L/(kA) = 0.2/(0.7\u00D71)', 'R = 0.286 K/W'] },
    { type: 'numeric', prompt: 'Temperature gradient: T\u2081 = 500\u00B0C, T\u2082 = 100\u00B0C, L = 0.2 m. Find gradient (K/m).', answer: 2000, unit: 'K/m', steps: ['Gradient = \u0394T/L = 400/0.2', 'Gradient = 2000 K/m'] }
  ];

  /* ================================================================
     HELPERS
     ================================================================ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function shuffleArr(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  /* ================================================================
     MATERIAL DATA
     ================================================================ */
  var MATERIALS = {
    steel:  { name: 'Steel',  k: 50 },
    copper: { name: 'Copper', k: 385 },
    brick:  { name: 'Brick',  k: 0.7 },
    glass:  { name: 'Glass',  k: 1.0 }
  };
  var SIGMA = 5.67e-8; /* Stefan-Boltzmann constant */

  /* ================================================================
     CANVAS SETUP
     ================================================================ */
  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;
  var dpr = window.devicePixelRatio || 1;
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.maxWidth = W + 'px';
  ctx.scale(dpr, dpr);

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var htMode = 'conduction'; /* conduction, convection, radiation */

  /* Conduction state */
  var matKey = 'steel';
  var condThickness = 0.1;    /* m */
  var condArea = 1;            /* m² */
  var condThot = 400;          /* °C */
  var condTcold = 50;          /* °C */

  /* Convection state */
  var convArea = 1;            /* m² */
  var convH = 25;              /* W/m²K */
  var convTsurf = 200;         /* °C */
  var convTfluid = 25;         /* °C */

  /* Radiation state */
  var radEmiss = 0.85;
  var radArea = 1;             /* m² */
  var radT1 = 600;             /* K */
  var radT2 = 300;             /* K */

  /* Explore */
  var selCat = 'conduction';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* Animation */
  var animT = 0;
  var animFrame = null;

  /* ================================================================
     PHYSICS ENGINE
     ================================================================ */

  function calcConduction() {
    var k = MATERIALS[matKey].k;
    var dT = condThot - condTcold;
    var Q = k * condArea * dT / condThickness;
    var R = condThickness / (k * condArea);
    var grad = dT / condThickness;
    var flux = Q / condArea;
    return { Q: Q, R: R, grad: grad, flux: flux, dT: dT, k: k };
  }

  function calcConvection() {
    var dT = convTsurf - convTfluid;
    var Q = convH * convArea * dT;
    var R = 1 / (convH * convArea);
    var flux = Q / convArea;
    return { Q: Q, R: R, grad: null, flux: flux, dT: dT, k: null };
  }

  function calcRadiation() {
    var dT = radT1 - radT2;
    var Q = radEmiss * SIGMA * radArea * (Math.pow(radT1, 4) - Math.pow(radT2, 4));
    var hRad = Q / (radArea * dT);
    var R = dT !== 0 ? dT / Q : 0;
    var flux = Q / radArea;
    return { Q: Q, R: R, grad: null, flux: flux, dT: dT, k: null, hRad: hRad };
  }

  function getCalc() {
    if (htMode === 'conduction') return calcConduction();
    if (htMode === 'convection') return calcConvection();
    return calcRadiation();
  }

  /* ================================================================
     DRAWING — SIMULATE MODE
     ================================================================ */

  var MARGIN_L = 80, MARGIN_R = 80;
  var DRAW_L = MARGIN_L, DRAW_R = W - MARGIN_R;
  var DRAW_MID = (DRAW_L + DRAW_R) / 2;

  function drawSimulate() {
    var c = getCalc();

    if (htMode === 'conduction') drawConduction(c);
    else if (htMode === 'convection') drawConvection(c);
    else drawRadiation(c);
  }

  /* ── Conduction Drawing ──────────────────────────────────────── */
  function drawConduction(c) {
    var wallL = 250, wallR = 650, wallT = 80, wallB = 360;
    var wallW = wallR - wallL;

    /* Title */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('CONDUCTION \u2014 ' + MATERIALS[matKey].name.toUpperCase() + ' (k = ' + kD(MATERIALS[matKey].k).toFixed(isImp() ? 3 : 2) + ' ' + uK() + ')', 8, 10);

    /* Temperature gradient background */
    var grad = ctx.createLinearGradient(wallL, 0, wallR, 0);
    grad.addColorStop(0, 'rgba(211,47,47,0.35)');
    grad.addColorStop(1, 'rgba(66,165,245,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(wallL, wallT, wallW, wallB - wallT);

    /* Wall outline */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 2;
    ctx.strokeRect(wallL, wallT, wallW, wallB - wallT);

    /* Temperature profile line (linear for single slab) */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(wallL, wallT + 30);
    ctx.lineTo(wallR, wallB - 30);
    ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.beginPath(); ctx.arc(wallL, wallT + 30, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(wallR, wallB - 30, 4, 0, Math.PI * 2); ctx.fill();

    /* T_hot label */
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#ff6659';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('T\u2081 = ' + tCD(condThot).toFixed(0) + uTC(), wallL - 15, (wallT + wallB) / 2 - 15);
    ctx.fillText('(HOT)', wallL - 15, (wallT + wallB) / 2 + 10);

    /* T_cold label */
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'left';
    ctx.fillText('T\u2082 = ' + tCD(condTcold).toFixed(0) + uTC(), wallR + 15, (wallT + wallB) / 2 - 15);
    ctx.fillText('(COLD)', wallR + 15, (wallT + wallB) / 2 + 10);

    /* Heat flow arrows */
    drawHeatArrows(wallL + 30, wallR - 30, (wallT + wallB) / 2, 5);

    /* Thickness dimension */
    var dimY = wallB + 25;
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(wallL, dimY); ctx.lineTo(wallR, dimY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6b7a99'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('L = ' + condThickness.toFixed(2) + ' m', (wallL + wallR) / 2, dimY + 4);

    /* Formula + result at bottom */
    drawFormulaResult(c);

    /* Animated heat particles */
    drawHeatParticles(wallL, wallR, wallT, wallB, 'right');
  }

  /* ── Convection Drawing ──────────────────────────────────────── */
  function drawConvection(c) {
    var surfX = 200, surfT = 80, surfB = 360;
    var fluidR = 750;

    /* Title */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('CONVECTION \u2014 h = ' + hD(convH).toFixed(isImp() ? 2 : 0) + ' ' + uH(), 8, 10);

    /* Heated surface */
    ctx.fillStyle = 'rgba(211,47,47,0.5)';
    ctx.fillRect(surfX - 15, surfT, 15, surfB - surfT);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(surfX, surfT); ctx.lineTo(surfX, surfB); ctx.stroke();

    /* Boundary layer */
    ctx.strokeStyle = 'rgba(245,200,66,0.5)'; ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    var blThickness = 80;
    ctx.beginPath();
    ctx.moveTo(surfX + blThickness * 0.3, surfT);
    ctx.quadraticCurveTo(surfX + blThickness, (surfT + surfB) / 2, surfX + blThickness * 1.2, surfB);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'left';
    ctx.fillText('Boundary', surfX + blThickness + 5, surfT + 40);
    ctx.fillText('Layer', surfX + blThickness + 5, surfT + 53);

    /* Fluid flow arrows */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 1.5;
    for (var i = 0; i < 7; i++) {
      var ay = surfT + 30 + i * 42;
      var baseX = surfX + 120;
      var len = 80 + Math.sin(animT * 2 + i) * 15;
      ctx.beginPath(); ctx.moveTo(baseX, ay); ctx.lineTo(baseX + len, ay); ctx.stroke();
      ctx.fillStyle = '#42a5f5';
      ctx.beginPath();
      ctx.moveTo(baseX + len + 2, ay);
      ctx.lineTo(baseX + len - 8, ay - 4);
      ctx.lineTo(baseX + len - 8, ay + 4);
      ctx.closePath(); ctx.fill();
    }
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText('Fluid Flow', surfX + 280, surfT + 20);

    /* T_surface label */
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#ff6659';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('T_s = ' + convTsurf + '\u00B0C', surfX - 25, (surfT + surfB) / 2);

    /* T_fluid label */
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'left';
    ctx.fillText('T_\u221E = ' + convTfluid + '\u00B0C', fluidR - 80, (surfT + surfB) / 2);

    /* Convection arrows (wavy) from surface */
    for (var j = 0; j < 5; j++) {
      var wy = surfT + 50 + j * 55;
      drawWavyArrow(surfX + 8, wy, surfX + 100, wy, '#ff8a65', 2);
    }

    drawFormulaResult(c);
    drawHeatParticles(surfX, surfX + 300, surfT, surfB, 'right');
  }

  /* ── Radiation Drawing ───────────────────────────────────────── */
  function drawRadiation(c) {
    var surf1X = 170, surf2X = 730;
    var surfT = 80, surfB = 340;

    /* Title */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('RADIATION \u2014 \u03B5 = ' + radEmiss.toFixed(2) + ', \u03C3 = ' + (isImp() ? '1.714\u00D710\u207B\u2079 Btu/(hr\u00B7ft\u00B2\u00B7\u00B0R\u2074)' : '5.67\u00D710\u207B\u2078 W/(m\u00B2K\u2074)'), 8, 10);

    /* Surface 1 (hot) */
    ctx.fillStyle = 'rgba(211,47,47,0.5)';
    ctx.fillRect(surf1X - 10, surfT, 20, surfB - surfT);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(surf1X, surfT); ctx.lineTo(surf1X, surfB); ctx.stroke();

    /* Surface 2 (cold) */
    ctx.fillStyle = 'rgba(66,165,245,0.4)';
    ctx.fillRect(surf2X - 10, surfT, 20, surfB - surfT);
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(surf2X, surfT); ctx.lineTo(surf2X, surfB); ctx.stroke();

    /* Radiation wavy lines between surfaces */
    for (var i = 0; i < 6; i++) {
      var ry = surfT + 30 + i * 48;
      drawRadWave(surf1X + 15, ry, surf2X - 15, ry, '#ff8a65');
    }

    /* Temperature labels */
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#ff6659';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText('T\u2081 = ' + tKD(radT1).toFixed(0) + ' ' + uTK(), surf1X - 20, (surfT + surfB) / 2 - 15);
    ctx.fillText('(HOT)', surf1X - 20, (surfT + surfB) / 2 + 10);

    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'left';
    ctx.fillText('T\u2082 = ' + tKD(radT2).toFixed(0) + ' ' + uTK(), surf2X + 20, (surfT + surfB) / 2 - 15);
    ctx.fillText('(COLD)', surf2X + 20, (surfT + surfB) / 2 + 10);

    /* Emissivity label */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('\u03B5 = ' + radEmiss.toFixed(2), (surf1X + surf2X) / 2, surfT - 5);

    /* Glow effect on hot surface */
    var glow = ctx.createRadialGradient(surf1X, (surfT + surfB) / 2, 10, surf1X, (surfT + surfB) / 2, 100);
    glow.addColorStop(0, 'rgba(211,47,47,0.2)');
    glow.addColorStop(1, 'rgba(211,47,47,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(surf1X - 100, surfT - 20, 200, surfB - surfT + 40);

    drawFormulaResult(c);
    drawHeatParticles(surf1X, surf2X, surfT, surfB, 'right');
  }

  /* ── Drawing Helpers ─────────────────────────────────────────── */
  function drawHeatArrows(x1, x2, y, count) {
    var spacing = (x2 - x1) / (count + 1);
    for (var i = 1; i <= count; i++) {
      var ax = x1 + spacing * i + Math.sin(animT * 3 + i) * 5;
      ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ax - 20, y); ctx.lineTo(ax + 20, y); ctx.stroke();
      ctx.fillStyle = '#ff8a65';
      ctx.beginPath();
      ctx.moveTo(ax + 22, y);
      ctx.lineTo(ax + 14, y - 4);
      ctx.lineTo(ax + 14, y + 4);
      ctx.closePath(); ctx.fill();
    }
  }

  function drawWavyArrow(x1, y1, x2, y2, color, width) {
    ctx.strokeStyle = color; ctx.lineWidth = width || 2;
    var midX1 = x1 + (x2 - x1) * 0.33;
    var midX2 = x1 + (x2 - x1) * 0.66;
    var amp = 8 + Math.sin(animT * 2) * 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(midX1, y1 - amp, (x1 + x2) / 2, y1);
    ctx.quadraticCurveTo(midX2, y1 + amp, x2, y2);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2 + 2, y2);
    ctx.lineTo(x2 - 8, y2 - 4);
    ctx.lineTo(x2 - 8, y2 + 4);
    ctx.closePath(); ctx.fill();
  }

  function drawRadWave(x1, y1, x2, y2, color) {
    var segments = 8;
    var segW = (x2 - x1) / segments;
    var amp = 10 + Math.sin(animT * 1.5) * 4;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (var i = 0; i < segments; i++) {
      var sx = x1 + i * segW;
      var ex = sx + segW;
      var cpY = (i % 2 === 0) ? y1 - amp : y1 + amp;
      ctx.quadraticCurveTo(sx + segW / 2, cpY, ex, y1);
    }
    ctx.stroke();
    /* Arrow head */
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2 + 2, y2);
    ctx.lineTo(x2 - 8, y2 - 5);
    ctx.lineTo(x2 - 8, y2 + 5);
    ctx.closePath(); ctx.fill();
  }

  function drawHeatParticles(x1, x2, y1, y2, direction) {
    var count = 12;
    ctx.fillStyle = 'rgba(255,138,101,0.7)';
    for (var i = 0; i < count; i++) {
      var t = ((animT * 0.4 + i / count) % 1);
      var px = x1 + t * (x2 - x1);
      var py = y1 + 20 + ((i * 37 + animT * 20) % (y2 - y1 - 40));
      var size = 2 + Math.sin(animT * 5 + i * 2) * 1;
      ctx.beginPath(); ctx.arc(px, py, size, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawFormulaResult(c) {
    var boxY = 400, boxH = 110;
    ctx.fillStyle = 'rgba(13,17,23,0.85)';
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(60, boxY, W - 120, boxH, 10);
    else { ctx.rect(60, boxY, W - 120, boxH); }
    ctx.fill(); ctx.stroke();

    ctx.textAlign = 'center'; ctx.textBaseline = 'top';

    /* Formula */
    ctx.font = '700 15px "Courier New", monospace';
    ctx.fillStyle = '#d32f2f';
    var d2 = function (v) { return (+v).toFixed(2); };
    if (htMode === 'conduction') {
      ctx.fillText('Q = kA\u0394T/L = ' + d2(kD(MATERIALS[matKey].k)) + ' \u00D7 ' + d2(aD(condArea)) +
        ' \u00D7 ' + dTD(condThot - condTcold).toFixed(0) + ' / ' + d2(isImp() ? inD(condThickness) / 12 : condThickness), W / 2, boxY + 12);
    } else if (htMode === 'convection') {
      ctx.fillText('Q = hA(T_s \u2212 T_\u221E) = ' + d2(hD(convH)) + ' \u00D7 ' + d2(aD(convArea)) +
        ' \u00D7 ' + dTD(convTsurf - convTfluid).toFixed(0), W / 2, boxY + 12);
    } else {
      ctx.fillText('Q = \u03B5\u03C3A(T\u2081\u2074 \u2212 T\u2082\u2074) = ' + radEmiss + ' \u00D7 ' +
        (isImp() ? '1.714e\u207B\u2079' : '5.67e\u207B\u2078') + ' \u00D7 ' + d2(aD(radArea)) + ' \u00D7 ...', W / 2, boxY + 12);
    }

    /* Result */
    ctx.font = '700 22px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Q = ' + formatQ(c.Q), W / 2, boxY + 40);

    /* Sub-results */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    var sub = 'R = ' + rD(c.R).toExponential(3) + ' ' + uR() + '  |  q = ' + formatFlux(c.flux) +
              '  |  \u0394T = ' + dTD(c.dT).toFixed(0) + ' ' + uDT();
    ctx.fillText(sub, W / 2, boxY + 78);
  }

  /* Magnitude-prefixed value + unit. The prefix changes the unit, so the
     unit has to come from here rather than from a separate caption span —
     the two used to be printed together, giving "175.00 kW W". */
  function fmtMag(val, base) {
    if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(2) + ' M' + base;
    if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(2) + ' k' + base;
    return val.toFixed(1) + ' ' + base;
  }
  /* Heat rate in the active system, prefix included. */
  function formatQ(valW) { return fmtMag(qD(valW), uQ()); }
  function formatFlux(valWm2) { return fmtMag(fluxD(valWm2), uFlux()); }

  /* ================================================================
     DRAWING — EXPLORE MINI-DIAGRAMS
     ================================================================ */

  function drawConceptDiagram(concept) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var fn = {
      'fouriersLaw': drawFouriersLawDiag,
      'thermalConductivity': drawThermalConductivityDiag,
      'compositeWall': drawCompositeWallDiag,
      'thermalResistance': drawThermalResistanceDiag,
      'newtonsCooling': drawNewtonsCoolingDiag,
      'naturalVsForced': drawNaturalVsForcedDiag,
      'htCoefficient': drawHTCoefficientDiag,
      'boundaryLayer': drawBoundaryLayerDiag,
      'stefanBoltzmann': drawStefanBoltzmannDiag,
      'emissivity': drawEmissivityDiag,
      'blackbody': drawBlackbodyDiag,
      'viewFactor': drawViewFactorDiag
    };

    if (fn[concept.diagram]) fn[concept.diagram]();

    /* Formula at bottom */
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#d32f2f';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(concept.formula, W / 2, H - 16);
  }

  function drawMiniWall(x1, y1, x2, y2) {
    var g = ctx.createLinearGradient(x1, 0, x2, 0);
    g.addColorStop(0, 'rgba(211,47,47,0.3)');
    g.addColorStop(1, 'rgba(66,165,245,0.3)');
    ctx.fillStyle = g;
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
  }

  function drawMiniArrowRight(x, y, len, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x + len + 2, y); ctx.lineTo(x + len - 6, y - 4); ctx.lineTo(x + len - 6, y + 4); ctx.closePath(); ctx.fill();
  }

  function drawFouriersLawDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText("Fourier's Law of Heat Conduction", W / 2, 35);

    drawMiniWall(280, 80, 620, 300);

    /* Temperature profile */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(280, 100); ctx.lineTo(620, 280); ctx.stroke();

    /* Labels */
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#ff6659'; ctx.textAlign = 'right';
    ctx.fillText('T\u2081 (Hot)', 265, 130);
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'left';
    ctx.fillText('T\u2082 (Cold)', 635, 240);

    /* Heat arrows */
    for (var i = 0; i < 4; i++) {
      drawMiniArrowRight(310 + i * 60, 190, 40, '#ff8a65');
    }
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#ff8a65'; ctx.textAlign = 'center';
    ctx.fillText('Q \u2192', 450, 175);

    /* Dimensions */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('L (thickness)', 450, 325);
    ctx.fillText('A (area)', 220, 190);
  }

  function drawThermalConductivityDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Thermal Conductivity of Common Materials', W / 2, 35);

    var mats = [
      { name: 'Copper', k: 385, color: '#ff8a65' },
      { name: 'Steel', k: 50, color: '#d32f2f' },
      { name: 'Glass', k: 1.0, color: '#42a5f5' },
      { name: 'Brick', k: 0.7, color: '#6b7a99' }
    ];
    /* Thermal conductivity spans 550:1 across these four materials, so a linear
       bar length is useless: glass (1.0) and brick (0.7) both came out under
       1.5 px and were rescued by a Math.max(20, ...) floor, which drew them as
       IDENTICAL bars despite differing by 43% — and made both look roughly 20x
       more conductive relative to copper than they are.

       Textbook k-charts are logarithmic for exactly this reason. Mapping over
       decades from 0.1 keeps the ordering, separates glass from brick, and
       never needs a floor. The axis is labelled as logarithmic below. */
    var K_AXIS_MIN = 0.1, K_AXIS_MAX = 1000, BAR_MAX = 500;
    function kBarWidth(k) {
      var lo = Math.log(K_AXIS_MIN), hi = Math.log(K_AXIS_MAX);
      var f = (Math.log(Math.max(k, K_AXIS_MIN)) - lo) / (hi - lo);
      return Math.max(4, Math.min(1, f) * BAR_MAX);
    }
    var barY = 80, barH = 45;
    mats.forEach(function (m, i) {
      var y = barY + i * 65;
      var barW = kBarWidth(m.k);
      ctx.fillStyle = m.color;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(200, y, barW, barH, 6);
      else ctx.rect(200, y, barW, barH);
      ctx.fill();
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'right';
      ctx.fillText(m.name, 190, y + barH / 2 + 4);
      ctx.textAlign = 'left';
      ctx.fillText(m.k + ' W/m\u00B7K', 210 + barW, y + barH / 2 + 4);
    });

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('Low k = Insulator  |  High k = Conductor  —  bar length on a logarithmic scale', W / 2, 350);
  }

  function drawCompositeWallDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Composite Wall \u2014 Resistances in Series', W / 2, 35);

    /* Layer 1 */
    ctx.fillStyle = 'rgba(211,47,47,0.3)';
    ctx.fillRect(200, 80, 150, 220);
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1.5;
    ctx.strokeRect(200, 80, 150, 220);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff8a65'; ctx.textAlign = 'center';
    ctx.fillText('Layer 1 (k\u2081)', 275, 170);

    /* Layer 2 */
    ctx.fillStyle = 'rgba(66,165,245,0.3)';
    ctx.fillRect(350, 80, 120, 220);
    ctx.strokeRect(350, 80, 120, 220);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('Layer 2 (k\u2082)', 410, 170);

    /* Layer 3 */
    ctx.fillStyle = 'rgba(61,220,132,0.2)';
    ctx.fillRect(470, 80, 100, 220);
    ctx.strokeRect(470, 80, 100, 220);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Layer 3 (k\u2083)', 520, 170);

    /* Temp labels */
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#ff6659'; ctx.textAlign = 'right';
    ctx.fillText('T\u2081', 190, 190);
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'left';
    ctx.fillText('T\u2082', 580, 190);

    /* Resistance circuit analogy */
    var cy = 370;
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Thermal Circuit:', W / 2, cy);
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('R\u2081 + R\u2082 + R\u2083 = L\u2081/(k\u2081A) + L\u2082/(k\u2082A) + L\u2083/(k\u2083A)', W / 2, cy + 25);
  }

  function drawThermalResistanceDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Thermal Resistance Analogy', W / 2, 35);

    /* Electrical analogy */
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'left';
    ctx.fillText('Electrical:', 100, 90);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('V = IR  \u2192  I = V/R', 200, 90);

    ctx.fillStyle = '#f5c842';
    ctx.fillText('Thermal:', 100, 130);
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('\u0394T = QR  \u2192  Q = \u0394T/R', 200, 130);

    /* Resistance boxes */
    var resistances = [
      { label: 'Conduction', formula: 'R = L/(kA)', y: 200 },
      { label: 'Convection', formula: 'R = 1/(hA)', y: 260 },
      { label: 'Radiation', formula: 'R = 1/(h_rad\u00B7A)', y: 320 }
    ];
    resistances.forEach(function (r) {
      ctx.fillStyle = 'rgba(211,47,47,0.1)';
      ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(200, r.y, 500, 40, 8);
      else ctx.rect(200, r.y, 500, 40);
      ctx.fill(); ctx.stroke();
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'left';
      ctx.fillText(r.label, 220, r.y + 25);
      ctx.font = '700 13px "Courier New", monospace';
      ctx.fillStyle = '#d32f2f'; ctx.textAlign = 'right';
      ctx.fillText(r.formula, 680, r.y + 25);
    });
  }

  function drawNewtonsCoolingDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText("Newton's Law of Cooling", W / 2, 35);

    /* Heated surface */
    ctx.fillStyle = 'rgba(211,47,47,0.4)';
    ctx.fillRect(155, 80, 20, 250);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(175, 80); ctx.lineTo(175, 330); ctx.stroke();

    /* Fluid arrows */
    for (var i = 0; i < 5; i++) {
      var ay = 100 + i * 50;
      drawMiniArrowRight(250, ay, 100, '#42a5f5');
    }
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText('Fluid (T_\u221E)', 400, 100);

    /* Labels */
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#ff6659'; ctx.textAlign = 'right';
    ctx.fillText('T_s', 145, 200);
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'left';
    ctx.fillText('T_\u221E', 430, 200);

    /* Heat transfer arrows */
    for (var j = 0; j < 3; j++) {
      drawWavyArrow(180, 120 + j * 70, 240, 120 + j * 70, '#f5c842', 2);
    }
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Q = hA(T_s \u2212 T_\u221E)', W / 2, 370);
  }

  function drawNaturalVsForcedDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Natural vs Forced Convection', W / 2, 35);

    /* Natural convection */
    ctx.fillStyle = 'rgba(211,47,47,0.3)';
    ctx.fillRect(100, 150, 250, 20);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 2;
    ctx.strokeRect(100, 150, 250, 20);
    /* Rising arrows (buoyancy) */
    for (var i = 0; i < 5; i++) {
      var ax = 120 + i * 50;
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(ax, 145); ctx.lineTo(ax, 90); ctx.stroke();
      ctx.fillStyle = '#f5c842';
      ctx.beginPath(); ctx.moveTo(ax, 86); ctx.lineTo(ax - 4, 96); ctx.lineTo(ax + 4, 96); ctx.closePath(); ctx.fill();
    }
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Natural (h = 5\u201325)', 225, 75);
    ctx.fillText('Buoyancy-driven', 225, 195);

    /* Forced convection */
    ctx.fillStyle = 'rgba(211,47,47,0.3)';
    ctx.fillRect(550, 150, 250, 20);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 2;
    ctx.strokeRect(550, 150, 250, 20);
    /* Horizontal arrows (forced) */
    for (var j = 0; j < 5; j++) {
      drawMiniArrowRight(570 + j * 40, 120, 30, '#42a5f5');
    }
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText('Forced (h = 25\u2013500)', 675, 75);
    ctx.fillText('Fan/pump-driven', 675, 195);

    /* Comparison */
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('Forced convection: 10\u201320\u00D7 more effective', W / 2, 280);
  }

  function drawHTCoefficientDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Heat Transfer Coefficient (h) for Various Conditions', W / 2, 35);

    /* Bar lengths used to be hand-picked numbers (25/250/600/800) unrelated to
       the ranges printed beside them, and the smallest still hit a Math.max(20)
       floor. They are now derived from the geometric mid-point of each stated
       range on a logarithmic axis \u2014 h spans four decades here, so linear
       lengths cannot show it. */
    var items = [
      { label: 'Natural Conv. (Air)',   range: '5\u201325',        lo: 5,    hi: 25 },
      { label: 'Forced Conv. (Air)',    range: '25\u2013250',      lo: 25,   hi: 250 },
      { label: 'Forced Conv. (Water)',  range: '100\u20131000',    lo: 100,  hi: 1000 },
      { label: 'Boiling Water',         range: '2500\u201325000',  lo: 2500, hi: 25000 }
    ];
    var H_AXIS_MIN = 1, H_AXIS_MAX = 100000, H_BAR_MAX = 450;
    function hBarWidth(lo, hi) {
      var mid = Math.sqrt(lo * hi);                 // geometric mean of the range
      var a = Math.log(H_AXIS_MIN), b = Math.log(H_AXIS_MAX);
      var f = (Math.log(mid) - a) / (b - a);
      return Math.max(4, Math.min(1, f) * H_BAR_MAX);
    }
    items.forEach(function (item, i) {
      var y = 80 + i * 60;
      var barW = hBarWidth(item.lo, item.hi);
      ctx.fillStyle = 'rgba(211,47,47,' + (0.2 + i * 0.2) + ')';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(250, y, barW, 35, 6);
      else ctx.rect(250, y, barW, 35);
      ctx.fill();
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'right';
      ctx.fillText(item.label, 240, y + 22);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#d32f2f';
      ctx.fillText(item.range + ' W/m\u00B2K', 260 + barW, y + 22);
    });
  }

  function drawBoundaryLayerDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Thermal Boundary Layer', W / 2, 35);

    /* Surface */
    ctx.fillStyle = 'rgba(211,47,47,0.3)';
    ctx.fillRect(100, 200, 700, 10);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(100, 200); ctx.lineTo(800, 200); ctx.stroke();

    /* Boundary layer curve */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(100, 200);
    ctx.quadraticCurveTo(300, 170, 500, 140);
    ctx.quadraticCurveTo(650, 115, 800, 100);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'left';
    ctx.fillText('\u03B4_T (grows along flow)', 810, 105);

    /* Temperature profile at a section */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(500, 200); ctx.lineTo(500, 140); /* vertical T profile */
    ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('T_s', 505, 198);
    ctx.fillText('T_\u221E', 505, 135);

    /* Flow arrows */
    for (var i = 0; i < 6; i++) {
      drawMiniArrowRight(120 + i * 100, 80, 50, '#42a5f5');
    }
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText('Free-stream flow (T_\u221E)', W / 2, 70);
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('Heated surface (T_s)', W / 2, 230);
  }

  function drawStefanBoltzmannDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Stefan-Boltzmann Law', W / 2, 35);

    /* Hot surface */
    ctx.fillStyle = 'rgba(211,47,47,0.5)';
    ctx.fillRect(140, 90, 25, 230);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(165, 90); ctx.lineTo(165, 320); ctx.stroke();

    /* Cold surface */
    ctx.fillStyle = 'rgba(66,165,245,0.4)';
    ctx.fillRect(735, 90, 25, 230);
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(735, 90); ctx.lineTo(735, 320); ctx.stroke();

    /* Radiation waves */
    for (var i = 0; i < 5; i++) {
      drawRadWave(175, 110 + i * 45, 725, 110 + i * 45, '#ff8a65');
    }

    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#ff6659'; ctx.textAlign = 'right';
    ctx.fillText('T\u2081', 130, 200);
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'left';
    ctx.fillText('T\u2082', 770, 200);

    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#d32f2f'; ctx.textAlign = 'center';
    ctx.fillText('Q = \u03B5\u03C3A(T\u2081\u2074 \u2212 T\u2082\u2074)', W / 2, 370);
  }

  function drawEmissivityDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Emissivity Values for Common Surfaces', W / 2, 35);

    var items = [
      { label: 'Blackbody (ideal)', eps: 1.0 },
      { label: 'Oxidised steel', eps: 0.79 },
      { label: 'Concrete/brick', eps: 0.93 },
      { label: 'White paint', eps: 0.90 },
      { label: 'Polished copper', eps: 0.04 },
      { label: 'Polished aluminium', eps: 0.05 }
    ];
    items.forEach(function (item, i) {
      var y = 75 + i * 48;
      var barW = item.eps * 400;
      ctx.fillStyle = 'rgba(211,47,47,' + (item.eps * 0.6 + 0.1) + ')';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(280, y, barW, 30, 5);
      else ctx.rect(280, y, barW, 30);
      ctx.fill();
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'right';
      ctx.fillText(item.label, 270, y + 20);
      ctx.fillStyle = '#d32f2f'; ctx.textAlign = 'left';
      ctx.fillText('\u03B5 = ' + item.eps.toFixed(2), 290 + barW, y + 20);
    });
  }

  function drawBlackbodyDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Blackbody Emissive Power vs Temperature', W / 2, 35);

    /* Axes */
    var ox = 120, oy = 350, ew = 650, eh = 280;
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ew, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - eh); ctx.stroke();

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('Temperature (K)', ox + ew / 2, oy + 25);
    ctx.save();
    ctx.translate(ox - 40, oy - eh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('E_b (W/m\u00B2)', 0, 0);
    ctx.restore();

    /* Curve E_b = sigma*T^4 */
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 3;
    ctx.beginPath();
    var maxT = 1200, maxE = SIGMA * Math.pow(maxT, 4);
    for (var T = 200; T <= maxT; T += 5) {
      var E = SIGMA * Math.pow(T, 4);
      var px = ox + ((T - 200) / (maxT - 200)) * ew;
      var py = oy - (E / maxE) * (eh - 20);
      if (T === 200) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    /* T^4 label */
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('E_b = \u03C3T\u2074', ox + ew - 100, oy - eh + 30);
  }

  function drawViewFactorDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('View Factor Between Surfaces', W / 2, 35);

    /* Surface 1 */
    ctx.fillStyle = 'rgba(211,47,47,0.3)';
    ctx.fillRect(150, 120, 200, 15);
    ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = 2;
    ctx.strokeRect(150, 120, 200, 15);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#d32f2f'; ctx.textAlign = 'center';
    ctx.fillText('Surface 1 (A\u2081)', 250, 110);

    /* Surface 2 */
    ctx.fillStyle = 'rgba(66,165,245,0.3)';
    ctx.fillRect(450, 250, 250, 15);
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.strokeRect(450, 250, 250, 15);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('Surface 2 (A\u2082)', 575, 280);

    /* Radiation lines */
    ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(200, 135); ctx.lineTo(500, 250); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(300, 135); ctx.lineTo(600, 250); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(250, 135); ctx.lineTo(650, 250); ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#ff8a65'; ctx.textAlign = 'center';
    ctx.fillText('F\u2081\u2082', 400, 190);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Reciprocity: A\u2081F\u2081\u2082 = A\u2082F\u2082\u2081', W / 2, 340);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      drawSimulate();
    } else if (mode === 'explore') {
      var c = CONCEPTS.filter(function (cc) { return cc.cat === selCat; });
      if (c[selConcept]) drawConceptDiagram(c[selConcept]);
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    }
  }

  function drawPracticeCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Practice Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('Solve the heat transfer problem below', W / 2, 65);

    /* Draw a wall with heat flow */
    drawMiniWall(280, 130, 620, 310);
    for (var i = 0; i < 4; i++) {
      drawMiniArrowRight(310 + i * 60, 220, 40, '#ff8a65');
    }
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#ff6659'; ctx.textAlign = 'right';
    ctx.fillText('T\u2081', 265, 220);
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'left';
    ctx.fillText('T\u2082', 635, 220);

    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#d32f2f'; ctx.textAlign = 'center';
    ctx.fillText('Q = kA\u0394T/L  |  Q = hA\u0394T  |  Q = \u03B5\u03C3A(T\u2081\u2074\u2212T\u2082\u2074)', W / 2, 380);
  }

  function drawQuizCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Quiz Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#d32f2f';
    ctx.fillText('Answer the question below', W / 2, 65);

    /* Three mode icons */
    /* Conduction */
    drawMiniWall(100, 140, 250, 280);
    drawMiniArrowRight(120, 210, 100, '#ff8a65');
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#d32f2f'; ctx.textAlign = 'center';
    ctx.fillText('Conduction', 175, 300);

    /* Convection */
    ctx.fillStyle = 'rgba(211,47,47,0.3)';
    ctx.fillRect(370, 140, 10, 140);
    for (var i = 0; i < 3; i++) {
      drawMiniArrowRight(400, 160 + i * 40, 60, '#42a5f5');
    }
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('Convection', 420, 300);

    /* Radiation */
    drawRadWave(580, 180, 730, 180, '#ff8a65');
    drawRadWave(580, 220, 730, 220, '#ff8a65');
    drawRadWave(580, 260, 730, 260, '#ff8a65');
    ctx.fillStyle = '#d32f2f'; ctx.textAlign = 'center';
    ctx.fillText('Radiation', 660, 300);

    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('\u03C3 = 5.67\u00D710\u207B\u2078 W/(m\u00B2\u00B7K\u2074)', W / 2, 370);
  }

  /* ================================================================
     DISPLAY UNITS  (display only — all three modes solve in SI)
     US/IP heat-transfer practice: Q in Btu/hr, k in Btu/(hr·ft·°F),
     h in Btu/(hr·ft²·°F), area in ft², thickness in inches, temperature
     in °F (absolute in °R). Emissivity is dimensionless.
     ================================================================ */
  var unitSys = 'si';
  function isImp()  { return unitSys === 'imp'; }
  /* power / flux / resistance */
  function qD(w)    { return isImp() ? w * 3.412142 : w; }              /* W → Btu/hr */
  function uQ()     { return isImp() ? 'Btu/hr' : 'W'; }
  function fluxD(w) { return isImp() ? w * 0.3169983 : w; }             /* W/m² → Btu/(hr·ft²) */
  function uFlux()  { return isImp() ? 'Btu/hr\u00B7ft\u00B2' : 'W/m\u00B2'; }
  function rD(r)    { return isImp() ? r * 0.5275279 : r; }             /* K/W → °F·hr/Btu */
  function uR()     { return isImp() ? '\u00B0F\u00B7hr/Btu' : 'K/W'; }
  /* geometry */
  function inD(m)   { return isImp() ? m * 39.3701 : m; }               /* m → in */
  function uIn()    { return isImp() ? 'in' : 'm'; }
  function aD(m2)   { return isImp() ? m2 * 10.76391 : m2; }            /* m² → ft² */
  function uA()     { return isImp() ? 'ft\u00B2' : 'm\u00B2'; }
  /* material / film coefficients */
  function kD(k)    { return isImp() ? k * 0.5777893 : k; }             /* W/m·K → Btu/(hr·ft·°F) */
  function uK()     { return isImp() ? 'Btu/hr\u00B7ft\u00B7\u00B0F' : 'W/m\u00B7K'; }
  function hD(h)    { return isImp() ? h * 0.1761102 : h; }             /* W/m²K → Btu/(hr·ft²·°F) */
  function uH()     { return isImp() ? 'Btu/hr\u00B7ft\u00B2\u00B7\u00B0F' : 'W/m\u00B2K'; }
  /* temperature — absolute (K) and relative (°C) need different maps */
  function tCD(c)   { return isImp() ? c * 9 / 5 + 32 : c; }            /* °C → °F */
  function uTC()    { return isImp() ? '\u00B0F' : '\u00B0C'; }
  function tKD(k)   { return isImp() ? k * 1.8 : k; }                   /* K → °R */
  function uTK()    { return isImp() ? '\u00B0R' : 'K'; }
  function dTD(d)   { return isImp() ? d * 1.8 : d; }                   /* ΔK → Δ°F, no offset */
  function uDT()    { return isImp() ? '\u00B0F' : 'K'; }
  function gradD(g) { return isImp() ? g * 1.8 / 3.28084 : g; }         /* K/m → °F/ft */
  function uGrad()  { return isImp() ? '\u00B0F/ft' : 'K/m'; }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    var c = getCalc();
    $('#r-q').textContent = formatQ(c.Q);
    var Rd = rD(c.R);
    $('#r-rth').textContent = Rd < 0.001 ? Rd.toExponential(2) : Rd.toFixed(4);
    $('#r-grad').textContent = c.grad !== null ? gradD(c.grad).toFixed(0) : '\u2014';
    $('#r-flux').textContent = formatFlux(c.flux);
    $('#r-dt').textContent = dTD(c.dT).toFixed(0);
    $('#r-k').textContent = c.k !== null ? kD(c.k).toFixed(isImp() ? 3 : 2) : '\u2014';
    /* r-q and r-flux print their own magnitude-prefixed unit, so their
       caption spans stay empty instead of repeating it. */
    var caps = { 'u-q': '', 'u-rth': uR(), 'u-grad': uGrad(),
                 'u-flux': '', 'u-dt': uDT(), 'u-k': uK() };
    Object.keys(caps).forEach(function (id) {
      var e = $('#' + id); if (e) e.textContent = caps[id] ? ' ' + caps[id] : '';
    });

    if (htMode === 'conduction') {
      $('#r-mode').textContent = 'Cond.';
      $('#r-formula').textContent = 'Q=kA\u0394T/L';
    } else if (htMode === 'convection') {
      $('#r-mode').textContent = 'Conv.';
      $('#r-formula').textContent = 'Q=hA\u0394T';
    } else {
      $('#r-mode').textContent = 'Rad.';
      $('#r-formula').textContent = 'Q=\u03B5\u03C3A\u0394T\u2074';
    }
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    animT += 0.016;
    if (mode === 'simulate') {
      render();
      updateReadouts();
    }
    animFrame = requestAnimationFrame(animate);
  }

  /* ================================================================
     UI — MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;
    $$('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });
    var simPanels = ['#sim-panel'];
    var explorePanels = ['#cat-row', '#item-selector', '#item-info'];
    var practicePanels = ['#practice-panel', '#practice-bar'];
    var quizPanels = ['#quiz-panel', '#quiz-bar', '#quiz-result'];

    simPanels.concat(explorePanels, practicePanels, quizPanels).forEach(function (s) { hide($(s)); });

    if (m === 'simulate') {
      simPanels.forEach(function (s) { show($(s)); });
    }
    if (m === 'explore') {
      explorePanels.forEach(function (s) { show($(s)); });
      buildConceptGrid();
    }
    if (m === 'practice') {
      practicePanels.forEach(function (s) { show($(s)); });
      newPractice();
    }
    if (m === 'quiz') {
      show($('#quiz-panel')); show($('#quiz-bar'));
      startQuiz();
    }
    render();
  }

  $('#mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    setMode(e.target.dataset.mode);
  });

  /* ================================================================
     UI — SIMULATE CONTROLS
     ================================================================ */

  /* Heat transfer mode tabs */
  $('#ht-mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    htMode = e.target.dataset.ht;
    $$('#ht-mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    /* Show/hide relevant controls */
    hide($('#cond-controls'));
    hide($('#conv-controls'));
    hide($('#rad-controls'));
    if (htMode === 'conduction') show($('#cond-controls'));
    else if (htMode === 'convection') show($('#conv-controls'));
    else show($('#rad-controls'));
    render();
    updateReadouts();
  });

  /* Material tabs */
  $('#mat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    matKey = e.target.dataset.mat;
    $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    render();
    updateReadouts();
  });

  /* Unit toggle — display only; all three modes solve in SI */
  $$('#unit-tabs .pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-unit');
      if (!u || u === unitSys) return;
      unitSys = u;
      $$('#unit-tabs .pill').forEach(function (b) { b.classList.toggle('active', b === btn); });
      syncAllLabels();
      render();
      updateReadouts();
    });
  });

  /* Conduction sliders */
  $('#sl-thickness').addEventListener('input', function () {
    condThickness = +this.value;
    syncCondLabels();
    render(); updateReadouts();
  });
  $('#sl-area-cond').addEventListener('input', function () {
    condArea = +this.value;
    syncCondLabels();
    render(); updateReadouts();
  });
  $('#sl-thot').addEventListener('input', function () {
    condThot = +this.value;
    syncCondLabels();
    render(); updateReadouts();
  });
  $('#sl-tcold').addEventListener('input', function () {
    condTcold = +this.value;
    syncCondLabels();
    render(); updateReadouts();
  });

  /* Convection sliders */
  $('#sl-area-conv').addEventListener('input', function () {
    convArea = +this.value;
    syncConvLabels();
    render(); updateReadouts();
  });
  $('#sl-h').addEventListener('input', function () {
    convH = +this.value;
    syncConvLabels();
    render(); updateReadouts();
  });
  $('#sl-tsurf').addEventListener('input', function () {
    convTsurf = +this.value;
    syncConvLabels();
    render(); updateReadouts();
  });
  $('#sl-tfluid').addEventListener('input', function () {
    convTfluid = +this.value;
    syncConvLabels();
    render(); updateReadouts();
  });

  /* Radiation sliders */
  $('#sl-emiss').addEventListener('input', function () {
    radEmiss = +this.value;
    syncRadLabels();
    render(); updateReadouts();
  });
  $('#sl-area-rad').addEventListener('input', function () {
    radArea = +this.value;
    syncRadLabels();
    render(); updateReadouts();
  });
  $('#sl-t1rad').addEventListener('input', function () {
    radT1 = +this.value;
    syncRadLabels();
    render(); updateReadouts();
  });
  $('#sl-t2rad').addEventListener('input', function () {
    radT2 = +this.value;
    syncRadLabels();
    render(); updateReadouts();
  });

  /* Presets */
  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var preset = btn.dataset.preset;
      if (!preset) return;
      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (preset === 'steel-wall') {
        /* Switch to conduction */
        htMode = 'conduction';
        matKey = 'steel';
        condThickness = 0.05;
        condArea = 2;
        condThot = 300;
        condTcold = 50;
        syncHTModeUI();
        syncCondUI();
      } else if (preset === 'brick-oven') {
        htMode = 'conduction';
        matKey = 'brick';
        condThickness = 0.2;
        condArea = 3;
        condThot = 500;
        condTcold = 30;
        syncHTModeUI();
        syncCondUI();
      } else if (preset === 'pipe-flow') {
        htMode = 'convection';
        convArea = 2;
        convH = 150;
        convTsurf = 120;
        convTfluid = 30;
        syncHTModeUI();
        syncConvUI();
      } else if (preset === 'furnace-rad') {
        htMode = 'radiation';
        radEmiss = 0.9;
        radArea = 2;
        radT1 = 1000;
        radT2 = 300;
        syncHTModeUI();
        syncRadUI();
      }
      render();
      updateReadouts();
    });
  });

  function syncHTModeUI() {
    $$('#ht-mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.ht === htMode); });
    hide($('#cond-controls'));
    hide($('#conv-controls'));
    hide($('#rad-controls'));
    if (htMode === 'conduction') show($('#cond-controls'));
    else if (htMode === 'convection') show($('#conv-controls'));
    else show($('#rad-controls'));
  }

  function syncCondUI() {
    $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mat === matKey); });
    $('#sl-thickness').value = condThickness;
    $('#sl-area-cond').value = condArea;
    $('#sl-thot').value = condThot;
    $('#sl-tcold').value = condTcold;
    syncCondLabels();
  }
  function syncCondLabels() {
    $('#sv-thickness').textContent = inD(condThickness).toFixed(isImp() ? 2 : 2) + ' ' + uIn();
    $('#sv-area-cond').textContent = aD(condArea).toFixed(isImp() ? 2 : 1) + ' ' + uA();
    $('#sv-thot').textContent  = tCD(condThot).toFixed(0) + ' ' + uTC();
    $('#sv-tcold').textContent = tCD(condTcold).toFixed(0) + ' ' + uTC();
  }

  function syncConvUI() {
    $('#sl-area-conv').value = convArea;
    $('#sl-h').value = convH;
    $('#sl-tsurf').value = convTsurf;
    $('#sl-tfluid').value = convTfluid;
    syncConvLabels();
  }
  function syncConvLabels() {
    $('#sv-area-conv').textContent = aD(convArea).toFixed(isImp() ? 2 : 1) + ' ' + uA();
    $('#sv-h').textContent = hD(convH).toFixed(isImp() ? 2 : 0) + ' ' + uH();
    $('#sv-tsurf').textContent  = tCD(convTsurf).toFixed(0) + ' ' + uTC();
    $('#sv-tfluid').textContent = tCD(convTfluid).toFixed(0) + ' ' + uTC();
  }

  function syncRadUI() {
    $('#sl-emiss').value = radEmiss;
    $('#sl-area-rad').value = radArea;
    $('#sl-t1rad').value = radT1;
    $('#sl-t2rad').value = radT2;
    syncRadLabels();
  }
  function syncRadLabels() {
    $('#sv-emiss').textContent = radEmiss.toFixed(2);
    $('#sv-area-rad').textContent = aD(radArea).toFixed(isImp() ? 2 : 1) + ' ' + uA();
    $('#sv-t1rad').textContent = tKD(radT1).toFixed(0) + ' ' + uTK();
    $('#sv-t2rad').textContent = tKD(radT2).toFixed(0) + ' ' + uTK();
  }
  /* Every caption, whichever mode is showing. */
  function syncAllLabels() { syncCondLabels(); syncConvLabels(); syncRadLabels(); }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  function buildConceptGrid() {
    var grid = $('#concept-grid');
    grid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    filtered.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (i === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selConcept = i;
        $$('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo(c);
        render();
      });
      grid.appendChild(btn);
    });
    if (filtered[selConcept]) showConceptInfo(filtered[selConcept]);
  }

  function showConceptInfo(c) {
    var el = $('#item-info');
    el.innerHTML =
      '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">Unit: ' + c.unit + '</span></div>' +
      '<div class="example-box"><h4>Worked Example</h4><p class="ex-problem">' + c.example.problem + '</p>' +
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s + '</p>'; }).join('') +
      '</div>';
    show(el);
  }

  $('#cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    selCat = e.target.dataset.cat;
    selConcept = 0;
    $$('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildConceptGrid();
    render();
  });

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function newPractice() {
    pAnswered = false;
    var fn = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    pProblem = fn();
    $('#pp-prompt').textContent = pProblem.prompt;
    $('#pp-unit').textContent = pProblem.unit;
    $('#pp-input').value = '';
    $('#pp-input').disabled = false;
    $('#pp-feedback').textContent = '';
    hide($('#pp-next'));
    hide($('#pp-solution'));
    render();
  }

  $('#pp-check').addEventListener('click', function () {
    if (pAnswered || !pProblem) return;
    pAnswered = true;
    pTotal++;
    var val = parseFloat($('#pp-input').value);
    var tol = Math.max(Math.abs(pProblem.answer) * 0.05, 0.5);
    var ok = !isNaN(val) && Math.abs(val - pProblem.answer) <= tol;
    if (ok) pScore++;
    $('#pp-feedback').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect \u2014 answer: ' + pProblem.answer + ' ' + pProblem.unit;
    $('#pp-feedback').className = 'feedback ' + (ok ? 'ok' : 'err');
    $('#pp-input').disabled = true;
    show($('#pp-next'));
    /* Show solution */
    var solEl = $('#pp-solution');
    solEl.innerHTML = '<h4>Step-by-Step Solution</h4>' +
      pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([0-9.eE+\-]+)/, '= <strong>$1</strong>') + '</p>'; }).join('');
    show(solEl);
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
  });

  $('#pp-next').addEventListener('click', newPractice);

  /* Enter key submits practice */
  $('#pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') $('#pp-check').click();
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    quizScore = 0; quizIdx = 0; quizAnswered = false;
    quizQs = shuffleArr(QUIZ_POOL).slice(0, 5);
    hide($('#quiz-result'));
    show($('#quiz-panel')); show($('#quiz-bar'));
    showQuizQ();
  }

  function showQuizQ() {
    quizAnswered = false;
    var q = quizQs[quizIdx];
    $('#qbar-num').textContent = quizIdx + 1;
    var panel = $('#quiz-panel');

    if (q.type === 'mcq') {
      var opts = q.options.slice();
      var correctText = opts[q.correct];
      var shuffled = shuffleArr(opts);
      q._correctIdx = shuffled.indexOf(correctText);
      panel.innerHTML = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>' +
        '<div class="answer-grid">' +
        shuffled.map(function (o, i) {
          return '<button class="answer-btn" data-idx="' + i + '">' + o + '</button>';
        }).join('') + '</div>' +
        '<p class="quiz-feedback" id="qfb"></p>' +
        '<button class="btn btn-ghost" id="q-next" style="display:none;margin-top:10px;">Next \u2192</button>';
      panel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { submitMCQ(+btn.dataset.idx, q._correctIdx, panel); });
      });
    } else {
      panel.innerHTML = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>' +
        '<div class="quiz-input-row"><input class="qi-input" id="qi-val" type="number" step="any" placeholder="Your answer"><span class="qi-unit">' + q.unit + '</span>' +
        '<button class="btn btn-primary" id="q-submit">Submit</button></div>' +
        '<p class="quiz-feedback" id="qfb"></p>' +
        '<button class="btn btn-ghost" id="q-next" style="display:none;margin-top:10px;">Next \u2192</button>';
      panel.querySelector('#q-submit').addEventListener('click', function () { submitNumeric(q, panel); });
      panel.querySelector('#qi-val').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') panel.querySelector('#q-submit').click();
      });
    }
    var nextBtn = panel.querySelector('#q-next');
    if (nextBtn) nextBtn.addEventListener('click', nextQuizQ);
    render();
  }

  function submitMCQ(chosen, correct, panel) {
    if (quizAnswered) return;
    quizAnswered = true;
    var btns = panel.querySelectorAll('.answer-btn');
    btns.forEach(function (b, i) {
      b.classList.add('locked');
      if (i === correct) b.classList.add('correct');
      if (i === chosen && i !== correct) b.classList.add('wrong');
    });
    var ok = chosen === correct;
    if (ok) quizScore++;
    quizQs[quizIdx]._given = btns[chosen].textContent;
    quizQs[quizIdx]._ok = ok;
    panel.querySelector('#qfb').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect';
    panel.querySelector('#qfb').className = 'quiz-feedback ' + (ok ? 'ok' : 'err');
    show(panel.querySelector('#q-next'));
  }

  function submitNumeric(q, panel) {
    if (quizAnswered) return;
    quizAnswered = true;
    var val = parseFloat(panel.querySelector('#qi-val').value);
    var tol = Math.max(Math.abs(q.answer) * 0.05, 0.5);
    var ok = !isNaN(val) && Math.abs(val - q.answer) <= tol;
    if (ok) quizScore++;
    q._given = isNaN(val) ? 'No answer' : val;
    q._ok = ok;
    panel.querySelector('#qfb').textContent = ok ? '\u2714 Correct!' : '\u2718 Answer: ' + q.answer + ' ' + q.unit;
    panel.querySelector('#qfb').className = 'quiz-feedback ' + (ok ? 'ok' : 'err');
    panel.querySelector('#qi-val').disabled = true;
    panel.querySelector('#q-submit').disabled = true;
    show(panel.querySelector('#q-next'));
  }

  function nextQuizQ() {
    quizIdx++;
    if (quizIdx >= quizQs.length) { showQuizResult(); return; }
    showQuizQ();
  }

  function showQuizResult() {
    hide($('#quiz-panel')); hide($('#quiz-bar'));
    var el = $('#quiz-result');
    var pct = quizScore / quizQs.length;
    var cls = pct === 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct === 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605' : '\u2605';
    var verdict = pct === 1 ? 'Perfect Score!' : pct >= 0.6 ? 'Good Job!' : 'Keep Practising';

    el.innerHTML =
      '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + quizQs.length + '</span><div class="qr-verdict">' + verdict + '</div></div></div>' +
      '<div class="qr-rows">' +
      quizQs.map(function (q, i) {
        var rowCls = q._ok ? 'ok' : 'err';
        var mark = q._ok ? '\u2714' : '\u2718';
        var detail = q.type === 'mcq'
          ? '<strong>Your answer:</strong> ' + q._given
          : '<strong>Your answer:</strong> ' + q._given + ' &nbsp;|&nbsp; <strong>Correct:</strong> ' + q.answer + ' ' + q.unit;
        return '<div class="qr-row ' + rowCls + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + detail + '</span><span class="qr-mark">' + mark + '</span></div>';
      }).join('') +
      '</div>' +
      '<button class="btn btn-primary" id="qr-retry" style="align-self:flex-start;">New Quiz</button>';
    el.querySelector('#qr-retry').addEventListener('click', startQuiz);
    show(el);
  }

  /* ================================================================
     INIT
     ================================================================ */
  setMode('simulate');
  animate();

})();
