(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randFloat(a, b) { return a + Math.random() * (b - a); }
  function shuffleArr(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fmtSci(v) {
    if (Math.abs(v) < 0.01 || Math.abs(v) > 999999) {
      return v.toExponential(2);
    }
    return roundN(v, 2).toLocaleString();
  }

  /* ================================================================
     DATA — MATERIALS
     ================================================================ */
  var MATERIALS = {
    steel:     { name: 'Steel',     G: 80000, density: 7850, color: '#8899aa' },
    aluminium: { name: 'Aluminium', G: 26000, density: 2700, color: '#b0c4de' },
    copper:    { name: 'Copper',    G: 45000, density: 8960, color: '#cd7f32' }
  };

  /* ================================================================
     DATA — PRESETS
     ================================================================ */
  var PRESETS = {
    'drive-shaft':    { type: 'solid',  mat: 'steel',     od: 50,  id: 0,   len: 1000, torque: 2000, rpm: 1500 },
    'hollow-axle':    { type: 'hollow', mat: 'steel',     od: 80,  id: 50,  len: 800,  torque: 1500, rpm: 1000 },
    'motor-shaft':    { type: 'solid',  mat: 'steel',     od: 25,  id: 0,   len: 300,  torque: 100,  rpm: 2800 },
    'propeller-shaft':{ type: 'hollow', mat: 'aluminium', od: 100, id: 70,  len: 1500, torque: 3000, rpm: 800  }
  };

  /* ================================================================
     DATA — CONCEPTS (12)
     ================================================================ */
  var CONCEPTS = [
    /* ── Torsion Theory ──────────────────────────────────────────── */
    {
      id: 'torsion-formula', name: 'Torsion Formula', symbol: '\u03C4 = Tr/J',
      formula: '\u03C4_max = T \u00D7 r / J', unit: 'MPa',
      cat: 'theory',
      desc: 'The torsion formula relates the maximum shear stress (\u03C4_max) developed on the surface of a circular shaft to the applied torque (T), the outer radius (r = D/2), and the polar moment of inertia (J). Shear stress varies linearly from zero at the shaft centre to a maximum at the outer surface. This formula is valid for circular cross-sections (solid or hollow) made of linearly elastic, isotropic materials, and assumes the shaft is straight and uniform.',
      diagram: 'torsionFormula',
      example: {
        problem: 'A solid shaft of 40 mm diameter is subjected to a torque of 800 Nm. Find the maximum shear stress.',
        steps: [
          'D = 40 mm, r = 20 mm, T = 800 Nm = 800,000 N\u00B7mm',
          'J = \u03C0D\u2074/32 = \u03C0(40)\u2074/32 = 251,327 mm\u2074',
          '\u03C4_max = T\u00D7r / J = 800,000 \u00D7 20 / 251,327',
          '\u03C4_max = 63.66 MPa'
        ],
        answer: 63.66, unit: 'MPa'
      }
    },
    {
      id: 'angle-of-twist', name: 'Angle of Twist', symbol: '\u03B8 = TL/GJ',
      formula: '\u03B8 = T \u00D7 L / (G \u00D7 J)', unit: 'radians',
      cat: 'theory',
      desc: 'The angle of twist (\u03B8) measures how much one end of a shaft rotates relative to the other when subjected to torque. It depends on the torque (T), shaft length (L), shear modulus (G), and polar moment of inertia (J). A longer shaft or a smaller cross-section results in a larger twist angle. Excessive twist can cause vibration, misalignment, and fatigue failure in rotating machinery.',
      diagram: 'angleOfTwist',
      example: {
        problem: 'A steel shaft (G = 80 GPa) is 1 m long, 50 mm diameter, and carries 1000 Nm torque. Find the angle of twist in degrees.',
        steps: [
          'D = 50 mm, L = 1000 mm, T = 1,000,000 N\u00B7mm, G = 80,000 MPa',
          'J = \u03C0(50)\u2074/32 = 613,592 mm\u2074',
          '\u03B8 = TL/(GJ) = 1,000,000 \u00D7 1000 / (80,000 \u00D7 613,592)',
          '\u03B8 = 0.02037 rad = 1.167\u00B0'
        ],
        answer: 1.17, unit: '\u00B0'
      }
    },
    {
      id: 'stress-distribution', name: 'Shear Stress Distribution', symbol: '\u03C4(r) = Tr/J',
      formula: '\u03C4(r) = T \u00D7 r / J', unit: 'MPa',
      cat: 'theory',
      desc: 'In a circular shaft under torsion, the shear stress at any radial position r from the centre is proportional to r. At the centre (r = 0), the shear stress is zero. At the outer surface (r = D/2), it reaches maximum. This linear distribution is a consequence of the assumption that plane cross-sections remain plane after twisting (Coulomb torsion theory). For hollow shafts, the stress is non-zero at the inner radius and increases linearly to the outer radius.',
      diagram: 'stressDistribution',
      example: {
        problem: 'A shaft has \u03C4_max = 50 MPa at D = 60 mm. What is the shear stress at r = 15 mm from centre?',
        steps: [
          'R_outer = 30 mm, r = 15 mm',
          '\u03C4(r) = \u03C4_max \u00D7 (r / R_outer)',
          '\u03C4(15) = 50 \u00D7 (15 / 30)',
          '\u03C4(15) = 25 MPa'
        ],
        answer: 25, unit: 'MPa'
      }
    },

    /* ── Cross Sections ──────────────────────────────────────────── */
    {
      id: 'polar-moi-solid', name: 'Polar MOI (Solid)', symbol: 'J = \u03C0d\u2074/32',
      formula: 'J = \u03C0 \u00D7 D\u2074 / 32', unit: 'mm\u2074',
      cat: 'sections',
      desc: 'The polar moment of inertia (J) for a solid circular cross-section depends on the fourth power of the diameter. This means doubling the diameter increases J by a factor of 16, making the shaft dramatically stiffer in torsion. J quantifies the cross-section\'s resistance to twisting. A larger J means lower shear stress and less angle of twist for the same applied torque.',
      diagram: 'polarSolid',
      example: {
        problem: 'Find the polar moment of inertia for a solid shaft of 60 mm diameter.',
        steps: [
          'D = 60 mm',
          'J = \u03C0D\u2074/32',
          'J = \u03C0 \u00D7 (60)\u2074 / 32',
          'J = \u03C0 \u00D7 12,960,000 / 32',
          'J = 1,272,345 mm\u2074'
        ],
        answer: 1272345, unit: 'mm\u2074'
      }
    },
    {
      id: 'polar-moi-hollow', name: 'Polar MOI (Hollow)', symbol: 'J = \u03C0(D\u2074\u2212d\u2074)/32',
      formula: 'J = \u03C0 \u00D7 (D_o\u2074 \u2212 D_i\u2074) / 32', unit: 'mm\u2074',
      cat: 'sections',
      desc: 'For a hollow shaft, the polar moment of inertia accounts for the removed inner core. Since the material near the centre contributes little to torsional resistance (stress is nearly zero there), a hollow shaft retains most of the torsional stiffness of a solid shaft while being significantly lighter. The ratio D_i/D_o is called the hollowness ratio and typically ranges from 0.5 to 0.8 in practice.',
      diagram: 'polarHollow',
      example: {
        problem: 'Find J for a hollow shaft with D_o = 80 mm and D_i = 50 mm.',
        steps: [
          'D_o = 80 mm, D_i = 50 mm',
          'J = \u03C0(D_o\u2074 \u2212 D_i\u2074)/32',
          'J = \u03C0(80\u2074 \u2212 50\u2074)/32',
          'J = \u03C0(40,960,000 \u2212 6,250,000)/32',
          'J = \u03C0 \u00D7 34,710,000/32 = 3,406,816 mm\u2074'
        ],
        answer: 3406816, unit: 'mm\u2074'
      }
    },
    {
      id: 'section-modulus', name: 'Torsional Section Modulus', symbol: 'Z_p = J/r',
      formula: 'Z_p = J / (D/2)', unit: 'mm\u00B3',
      cat: 'sections',
      desc: 'The torsional section modulus (Z_p) simplifies the torsion formula to \u03C4_max = T / Z_p. It equals J divided by the outer radius. For a solid shaft: Z_p = \u03C0D\u00B3/16. For a hollow shaft: Z_p = \u03C0(D_o\u2074 \u2212 D_i\u2074)/(16\u00D7D_o). This parameter is useful for direct comparison of cross-sectional efficiency between different shaft designs.',
      diagram: 'sectionModulus',
      example: {
        problem: 'Find the torsional section modulus for a solid shaft of 40 mm diameter.',
        steps: [
          'D = 40 mm',
          'Z_p = \u03C0D\u00B3/16',
          'Z_p = \u03C0 \u00D7 (40)\u00B3 / 16',
          'Z_p = \u03C0 \u00D7 64,000 / 16',
          'Z_p = 12,566 mm\u00B3'
        ],
        answer: 12566, unit: 'mm\u00B3'
      }
    },

    /* ── Applications ────────────────────────────────────────────── */
    {
      id: 'power-transmission', name: 'Power Transmission', symbol: 'P = 2\u03C0NT/60',
      formula: 'P = 2\u03C0 \u00D7 N \u00D7 T / 60', unit: 'Watts',
      cat: 'applications',
      desc: 'Shafts transmit mechanical power from a prime mover (motor, engine, turbine) to a driven machine. The power transmitted depends on both the torque and the rotational speed. For a given power requirement, increasing the speed allows a proportional reduction in required torque, and therefore a smaller shaft diameter. This is why high-speed machinery generally uses thinner shafts.',
      diagram: 'powerTransmission',
      example: {
        problem: 'A shaft transmits 50 kW at 1500 RPM. Find the torque.',
        steps: [
          'P = 50 kW = 50,000 W, N = 1500 RPM',
          'P = 2\u03C0NT/60',
          'T = P \u00D7 60 / (2\u03C0N)',
          'T = 50,000 \u00D7 60 / (2\u03C0 \u00D7 1500)',
          'T = 318.3 Nm'
        ],
        answer: 318.3, unit: 'Nm'
      }
    },
    {
      id: 'shaft-design', name: 'Shaft Design', symbol: 'D = \u00B3\u221A(16T/\u03C0\u03C4)',
      formula: 'D = (16T / (\u03C0\u03C4_allow))^(1/3)', unit: 'mm',
      cat: 'applications',
      desc: 'Shaft design involves determining the minimum diameter required to safely transmit a given torque without exceeding the allowable shear stress. By rearranging the torsion formula for a solid shaft: D = (16T / (\u03C0\u03C4_allow))^(1/3). Design must also account for stress concentration factors at keyways, shoulders, and other geometric discontinuities, typically by multiplying torque by a factor of 1.5 to 3.',
      diagram: 'shaftDesign',
      example: {
        problem: 'Design a solid shaft to transmit 500 Nm with allowable shear stress of 40 MPa.',
        steps: [
          'T = 500 Nm = 500,000 N\u00B7mm, \u03C4_allow = 40 MPa',
          'D = (16T / (\u03C0\u03C4_allow))^(1/3)',
          'D = (16 \u00D7 500,000 / (\u03C0 \u00D7 40))^(1/3)',
          'D = (63,662)^(1/3)',
          'D = 39.9 mm \u2248 40 mm'
        ],
        answer: 39.9, unit: 'mm'
      }
    },
    {
      id: 'material-selection', name: 'Material Selection', symbol: 'G, \u03C1',
      formula: 'Stiffness-to-weight ratio: G / \u03C1', unit: 'MPa/(kg/m\u00B3)',
      cat: 'applications',
      desc: 'Material selection for shafts involves balancing the shear modulus (G), density (\u03C1), yield strength, fatigue strength, corrosion resistance, and cost. Steel is the most common shaft material due to its high G (~80 GPa) and availability. Aluminium (G ~26 GPa) is chosen for lightweight applications. The specific stiffness (G/\u03C1) helps compare materials: steel \u2248 10.2, aluminium \u2248 9.6, and copper \u2248 5.0 (in MPa\u00B7m\u00B3/kg units).',
      diagram: 'materialSelection',
      example: {
        problem: 'Compare the G/\u03C1 ratio for steel (G=80 GPa, \u03C1=7850 kg/m\u00B3) and aluminium (G=26 GPa, \u03C1=2700 kg/m\u00B3).',
        steps: [
          'Steel: G/\u03C1 = 80,000 / 7850 = 10.19',
          'Aluminium: G/\u03C1 = 26,000 / 2700 = 9.63',
          'Steel has slightly higher specific stiffness',
          'But aluminium shaft weighs about 1/3 of steel shaft'
        ],
        answer: 10.19, unit: 'MPa/(kg/m\u00B3)'
      }
    },
    {
      id: 'hollow-vs-solid', name: 'Hollow vs Solid Shafts', symbol: 'W ratio',
      formula: 'Weight ratio = 1 \u2212 (D_i/D_o)\u00B2', unit: '\u2014',
      cat: 'sections',
      desc: 'A hollow shaft with the same outer diameter as a solid shaft has nearly the same torsional strength but significantly less weight. For example, a hollow shaft with D_i/D_o = 0.6 retains 87% of the torsional strength of the solid shaft while weighing only 64% as much. The strength-to-weight ratio of a hollow shaft is always superior to that of a solid shaft of the same outer diameter.',
      diagram: 'hollowVsSolid',
      example: {
        problem: 'Compare J and weight of a solid shaft (D=80mm) vs hollow shaft (D_o=80mm, D_i=50mm), both steel.',
        steps: [
          'J_solid = \u03C0(80)\u2074/32 = 4,021,239 mm\u2074',
          'J_hollow = \u03C0(80\u2074\u221250\u2074)/32 = 3,406,816 mm\u2074',
          'J ratio = 3,406,816 / 4,021,239 = 84.7%',
          'Weight ratio = 1 \u2212 (50/80)\u00B2 = 1 \u2212 0.391 = 60.9%',
          'Hollow shaft: 84.7% strength, 60.9% weight'
        ],
        answer: 84.7, unit: '%'
      }
    },
    {
      id: 'torsional-rigidity', name: 'Torsional Rigidity', symbol: 'GJ',
      formula: 'k_t = G \u00D7 J / L', unit: 'N\u00B7mm/rad',
      cat: 'theory',
      desc: 'Torsional rigidity (GJ) is the product of the shear modulus and the polar moment of inertia. The torsional stiffness (k_t = GJ/L) represents the torque required to produce a unit angle of twist per unit length. A shaft with high torsional stiffness resists twisting better, which is important in precision applications like machine tool spindles, measuring instrument shafts, and control system linkages.',
      diagram: 'torsionalRigidity',
      example: {
        problem: 'Find the torsional stiffness of a steel shaft (G=80 GPa), D=40 mm, L=500 mm.',
        steps: [
          'J = \u03C0(40)\u2074/32 = 251,327 mm\u2074',
          'G = 80,000 MPa',
          'k_t = GJ/L = 80,000 \u00D7 251,327 / 500',
          'k_t = 40,212,400 N\u00B7mm/rad',
          'k_t \u2248 40.2 \u00D7 10\u2076 N\u00B7mm/rad'
        ],
        answer: 40212400, unit: 'N\u00B7mm/rad'
      }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0 — Max shear stress (solid) */
    function () {
      var D = randInt(20, 100);
      var T = randInt(1, 50) * 100;
      var r = D / 2;
      var J = Math.PI * Math.pow(D, 4) / 32;
      var tau = roundN(T * 1000 * r / J, 2);
      return {
        prompt: 'A solid shaft has diameter D = ' + D + ' mm and is subjected to a torque of ' + T + ' Nm. Calculate the maximum shear stress (\u03C4_max) in MPa.',
        answer: tau, unit: 'MPa',
        steps: [
          'D = ' + D + ' mm, r = ' + (D / 2) + ' mm',
          'T = ' + T + ' Nm = ' + (T * 1000) + ' N\u00B7mm',
          'J = \u03C0D\u2074/32 = \u03C0(' + D + ')\u2074/32 = ' + roundN(J, 0) + ' mm\u2074',
          '\u03C4_max = Tr/J = ' + (T * 1000) + ' \u00D7 ' + r + ' / ' + roundN(J, 0),
          '\u03C4_max = ' + tau + ' MPa'
        ]
      };
    },
    /* 1 — Max shear stress (hollow) */
    function () {
      var Do = randInt(50, 120);
      var Di = randInt(Math.round(Do * 0.3), Math.round(Do * 0.7));
      var T = randInt(5, 80) * 100;
      var J = Math.PI * (Math.pow(Do, 4) - Math.pow(Di, 4)) / 32;
      var tau = roundN(T * 1000 * (Do / 2) / J, 2);
      return {
        prompt: 'A hollow shaft has D_o = ' + Do + ' mm and D_i = ' + Di + ' mm. Torque = ' + T + ' Nm. Find \u03C4_max in MPa.',
        answer: tau, unit: 'MPa',
        steps: [
          'D_o = ' + Do + ' mm, D_i = ' + Di + ' mm, r = ' + (Do / 2) + ' mm',
          'T = ' + T + ' Nm = ' + (T * 1000) + ' N\u00B7mm',
          'J = \u03C0(D_o\u2074 \u2212 D_i\u2074)/32 = ' + roundN(J, 0) + ' mm\u2074',
          '\u03C4_max = Tr/J = ' + (T * 1000) + ' \u00D7 ' + (Do / 2) + ' / ' + roundN(J, 0),
          '\u03C4_max = ' + tau + ' MPa'
        ]
      };
    },
    /* 2 — Angle of twist (solid) */
    function () {
      var D = randInt(25, 80);
      var L = randInt(2, 20) * 100;
      var T = randInt(1, 40) * 100;
      var matKeys = ['steel', 'aluminium', 'copper'];
      var mk = matKeys[randInt(0, 2)];
      var G = MATERIALS[mk].G;
      var J = Math.PI * Math.pow(D, 4) / 32;
      var theta = T * 1000 * L / (G * J);
      var thetaDeg = roundN(theta * 180 / Math.PI, 3);
      return {
        prompt: 'A ' + MATERIALS[mk].name + ' solid shaft (G = ' + G + ' MPa), D = ' + D + ' mm, L = ' + L + ' mm, T = ' + T + ' Nm. Find the angle of twist in degrees.',
        answer: thetaDeg, unit: '\u00B0',
        steps: [
          'J = \u03C0(' + D + ')\u2074/32 = ' + roundN(J, 0) + ' mm\u2074',
          'T = ' + (T * 1000) + ' N\u00B7mm, L = ' + L + ' mm, G = ' + G + ' MPa',
          '\u03B8 = TL/(GJ) = ' + (T * 1000) + ' \u00D7 ' + L + ' / (' + G + ' \u00D7 ' + roundN(J, 0) + ')',
          '\u03B8 = ' + roundN(theta, 5) + ' rad',
          '\u03B8 = ' + thetaDeg + '\u00B0'
        ]
      };
    },
    /* 3 — Polar MOI (solid) */
    function () {
      var D = randInt(15, 120);
      var J = roundN(Math.PI * Math.pow(D, 4) / 32, 0);
      return {
        prompt: 'Calculate the polar moment of inertia (J) for a solid shaft with diameter D = ' + D + ' mm. Give answer in mm\u2074.',
        answer: J, unit: 'mm\u2074',
        steps: [
          'J = \u03C0D\u2074/32',
          'J = \u03C0 \u00D7 (' + D + ')\u2074 / 32',
          'J = \u03C0 \u00D7 ' + Math.pow(D, 4) + ' / 32',
          'J = ' + J + ' mm\u2074'
        ]
      };
    },
    /* 4 — Polar MOI (hollow) */
    function () {
      var Do = randInt(40, 120);
      var Di = randInt(Math.round(Do * 0.3), Math.round(Do * 0.7));
      var J = roundN(Math.PI * (Math.pow(Do, 4) - Math.pow(Di, 4)) / 32, 0);
      return {
        prompt: 'Calculate J for a hollow shaft with D_o = ' + Do + ' mm and D_i = ' + Di + ' mm.',
        answer: J, unit: 'mm\u2074',
        steps: [
          'J = \u03C0(D_o\u2074 \u2212 D_i\u2074)/32',
          'J = \u03C0(' + Math.pow(Do, 4) + ' \u2212 ' + Math.pow(Di, 4) + ')/32',
          'J = \u03C0 \u00D7 ' + (Math.pow(Do, 4) - Math.pow(Di, 4)) + ' / 32',
          'J = ' + J + ' mm\u2074'
        ]
      };
    },
    /* 5 — Power from torque and RPM */
    function () {
      var T = randInt(1, 50) * 50;
      var N = randInt(1, 30) * 100;
      var P = roundN(2 * Math.PI * N * T / 60000, 2);
      return {
        prompt: 'A shaft transmits ' + T + ' Nm torque at ' + N + ' RPM. Calculate the transmitted power in kW.',
        answer: P, unit: 'kW',
        steps: [
          'P = 2\u03C0NT/60',
          'P = 2\u03C0 \u00D7 ' + N + ' \u00D7 ' + T + ' / 60',
          'P = ' + roundN(2 * Math.PI * N * T / 60, 1) + ' W',
          'P = ' + P + ' kW'
        ]
      };
    },
    /* 6 — Torque from power and RPM */
    function () {
      var P = randInt(1, 100);
      var N = randInt(5, 30) * 100;
      var T = roundN(P * 1000 * 60 / (2 * Math.PI * N), 2);
      return {
        prompt: 'A motor delivers ' + P + ' kW at ' + N + ' RPM. Find the shaft torque in Nm.',
        answer: T, unit: 'Nm',
        steps: [
          'P = ' + P + ' kW = ' + (P * 1000) + ' W, N = ' + N + ' RPM',
          'T = P \u00D7 60 / (2\u03C0N)',
          'T = ' + (P * 1000) + ' \u00D7 60 / (2\u03C0 \u00D7 ' + N + ')',
          'T = ' + T + ' Nm'
        ]
      };
    },
    /* 7 — Required diameter for given stress limit */
    function () {
      var T = randInt(1, 30) * 100;
      var tauAllow = randInt(30, 80);
      var D = roundN(Math.pow(16 * T * 1000 / (Math.PI * tauAllow), 1 / 3), 1);
      return {
        prompt: 'Design a solid shaft to transmit ' + T + ' Nm with allowable shear stress = ' + tauAllow + ' MPa. Find the minimum diameter in mm.',
        answer: D, unit: 'mm',
        steps: [
          'T = ' + T + ' Nm = ' + (T * 1000) + ' N\u00B7mm, \u03C4_allow = ' + tauAllow + ' MPa',
          'D = (16T / (\u03C0\u03C4))\u00B9\u0338\u00B3',
          'D = (16 \u00D7 ' + (T * 1000) + ' / (\u03C0 \u00D7 ' + tauAllow + '))\u00B9\u0338\u00B3',
          'D = (' + roundN(16 * T * 1000 / (Math.PI * tauAllow), 0) + ')\u00B9\u0338\u00B3',
          'D = ' + D + ' mm'
        ]
      };
    },
    /* 8 — Weight comparison */
    function () {
      var Do = randInt(50, 100);
      var Di = randInt(Math.round(Do * 0.4), Math.round(Do * 0.7));
      var L = randInt(5, 20) * 100;
      var rho = 7850;
      var Ws = roundN(rho * Math.PI / 4 * Math.pow(Do / 1000, 2) * (L / 1000), 3);
      var Wh = roundN(rho * Math.PI / 4 * (Math.pow(Do / 1000, 2) - Math.pow(Di / 1000, 2)) * (L / 1000), 3);
      var saving = roundN((1 - Wh / Ws) * 100, 1);
      return {
        prompt: 'A steel shaft (density 7850 kg/m\u00B3) has D_o = ' + Do + ' mm, L = ' + L + ' mm. A hollow version has D_i = ' + Di + ' mm. Find the weight saving as a percentage.',
        answer: saving, unit: '%',
        steps: [
          'W_solid = \u03C1 \u00D7 \u03C0/4 \u00D7 D\u00B2 \u00D7 L = ' + Ws + ' kg',
          'W_hollow = \u03C1 \u00D7 \u03C0/4 \u00D7 (D_o\u00B2 \u2212 D_i\u00B2) \u00D7 L = ' + Wh + ' kg',
          'Saving = (1 \u2212 W_hollow/W_solid) \u00D7 100',
          'Saving = (1 \u2212 ' + roundN(Wh / Ws, 4) + ') \u00D7 100',
          'Saving = ' + saving + '%'
        ]
      };
    },
    /* 9 — Shear stress at given radius */
    function () {
      var D = randInt(30, 80);
      var T = randInt(2, 40) * 100;
      var r_query = randInt(5, Math.floor(D / 2) - 2);
      var J = Math.PI * Math.pow(D, 4) / 32;
      var tau = roundN(T * 1000 * r_query / J, 2);
      return {
        prompt: 'A solid shaft D = ' + D + ' mm carries T = ' + T + ' Nm. Find the shear stress at r = ' + r_query + ' mm from the centre.',
        answer: tau, unit: 'MPa',
        steps: [
          'J = \u03C0(' + D + ')\u2074/32 = ' + roundN(J, 0) + ' mm\u2074',
          'T = ' + (T * 1000) + ' N\u00B7mm, r = ' + r_query + ' mm',
          '\u03C4(r) = Tr/J = ' + (T * 1000) + ' \u00D7 ' + r_query + ' / ' + roundN(J, 0),
          '\u03C4 = ' + tau + ' MPa'
        ]
      };
    },
    /* 10 — Torsional section modulus */
    function () {
      var D = randInt(20, 80);
      var Zp = roundN(Math.PI * Math.pow(D, 3) / 16, 0);
      return {
        prompt: 'Find the torsional section modulus (Z_p) for a solid shaft of diameter ' + D + ' mm.',
        answer: Zp, unit: 'mm\u00B3',
        steps: [
          'Z_p = \u03C0D\u00B3/16',
          'Z_p = \u03C0 \u00D7 (' + D + ')\u00B3 / 16',
          'Z_p = \u03C0 \u00D7 ' + Math.pow(D, 3) + ' / 16',
          'Z_p = ' + Zp + ' mm\u00B3'
        ]
      };
    },
    /* 11 — Angle of twist (hollow) */
    function () {
      var Do = randInt(50, 100);
      var Di = randInt(Math.round(Do * 0.3), Math.round(Do * 0.6));
      var L = randInt(3, 15) * 100;
      var T = randInt(5, 60) * 100;
      var G = 80000;
      var J = Math.PI * (Math.pow(Do, 4) - Math.pow(Di, 4)) / 32;
      var theta = T * 1000 * L / (G * J);
      var thetaDeg = roundN(theta * 180 / Math.PI, 3);
      return {
        prompt: 'A hollow steel shaft (G = 80 GPa): D_o = ' + Do + ' mm, D_i = ' + Di + ' mm, L = ' + L + ' mm, T = ' + T + ' Nm. Find the angle of twist in degrees.',
        answer: thetaDeg, unit: '\u00B0',
        steps: [
          'J = \u03C0(' + Do + '\u2074 \u2212 ' + Di + '\u2074)/32 = ' + roundN(J, 0) + ' mm\u2074',
          'T = ' + (T * 1000) + ' N\u00B7mm, L = ' + L + ' mm, G = 80,000 MPa',
          '\u03B8 = TL/(GJ) = ' + (T * 1000) + ' \u00D7 ' + L + ' / (80,000 \u00D7 ' + roundN(J, 0) + ')',
          '\u03B8 = ' + roundN(theta, 6) + ' rad',
          '\u03B8 = ' + thetaDeg + '\u00B0'
        ]
      };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15)
     ================================================================ */
  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'Where does the maximum shear stress occur in a solid circular shaft under torsion?', options: ['At the outer surface', 'At the centre', 'At the neutral axis', 'Uniformly throughout'], correct: 0 },
    { type: 'mcq', prompt: 'What is the formula for the polar moment of inertia of a solid circular shaft?', options: ['J = \u03C0D\u2074/32', 'J = \u03C0D\u2074/64', 'J = \u03C0D\u00B2/4', 'J = \u03C0D\u00B3/32'], correct: 0 },
    { type: 'mcq', prompt: 'Doubling the diameter of a solid shaft increases its polar MOI by a factor of:', options: ['16', '2', '4', '8'], correct: 0 },
    { type: 'mcq', prompt: 'The angle of twist of a shaft is proportional to:', options: ['Torque and length', 'Torque and diameter', 'Length and shear modulus', 'Diameter and modulus'], correct: 0 },
    { type: 'mcq', prompt: 'Which material has the highest shear modulus (G)?', options: ['Steel (~80 GPa)', 'Copper (~45 GPa)', 'Aluminium (~26 GPa)', 'Rubber (~0.001 GPa)'], correct: 0 },
    { type: 'mcq', prompt: 'The main advantage of a hollow shaft over a solid shaft of the same outer diameter is:', options: ['Lower weight with nearly the same strength', 'Higher maximum shear stress capacity', 'Lower manufacturing cost', 'Higher shear modulus'], correct: 0 },
    { type: 'mcq', prompt: 'The power transmitted by a shaft is given by:', options: ['P = 2\u03C0NT/60', 'P = T/N', 'P = T \u00D7 D', 'P = NT/2\u03C0'], correct: 0 },
    { type: 'mcq', prompt: 'In the torsion formula \u03C4 = Tr/J, what does J represent?', options: ['Polar moment of inertia', 'Second moment of area', 'Section modulus', 'Moment of resistance'], correct: 0 },
    { type: 'mcq', prompt: 'For a hollow shaft, the shear stress at the inner radius is:', options: ['Non-zero and proportional to inner radius', 'Zero', 'Equal to maximum stress', 'Negative'], correct: 0 },
    { type: 'mcq', prompt: 'Torsional rigidity of a shaft is defined as:', options: ['G \u00D7 J', 'E \u00D7 I', '\u03C4 \u00D7 r', 'T \u00D7 L'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'A solid shaft of D = 50 mm carries T = 1000 Nm. Find \u03C4_max in MPa. (round to 1 decimal)', answer: 81.5, unit: 'MPa', tolerance: 1.0 },
    { type: 'numeric', prompt: 'Find J for a solid shaft of D = 40 mm (in mm\u2074, round to nearest integer).', answer: 251327, unit: 'mm\u2074', tolerance: 100 },
    { type: 'numeric', prompt: 'A shaft transmits 10 kW at 1000 RPM. Find the torque in Nm. (round to 1 decimal)', answer: 95.5, unit: 'Nm', tolerance: 1.0 },
    { type: 'numeric', prompt: 'Steel shaft (G=80 GPa), D=30 mm, L=500 mm, T=200 Nm. Find angle of twist in degrees. (round to 3 decimals)', answer: 0.864, unit: '\u00B0', tolerance: 0.02 },
    { type: 'numeric', prompt: 'A hollow shaft has D_o=60 mm, D_i=40 mm. Find J in mm\u2074. (round to nearest integer)', answer: 1021018, unit: 'mm\u2074', tolerance: 200 }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */
  var cvs = $('#sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 480;

  /* Hi-DPI. This canvas carried fixed width/height attributes while the CSS
     stretches it to the card, so on a 2x display it presented an upscaled
     bitmap. Size the backing store to real device pixels and scale the context
     so the existing 900x480 logical space is untouched — no drawing code changes.
     There is no canvas pointer interaction in this tool, so no hit-test has to
     move in lockstep. */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var displayW = cvs.getBoundingClientRect().width;
    if (!(displayW > 40)) displayW = 900;
    var displayH = displayW * (480 / 900);
    cvs.width  = Math.round(displayW * dpr);
    cvs.height = Math.round(displayH * dpr);
    var s = (displayW * dpr) / 900;
    ctx.setTransform(s, 0, 0, s, 0, 0);
  }
  fitCanvas();
  cvs.style.maxWidth = W + 'px';

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var shaftType = 'solid';
  var matKey = 'steel';
  var outerDia = 50;      // mm
  var innerDia = 0;       // mm (0 for solid)
  var shaftLen = 1000;    // mm
  var torque = 2000;      // Nm
  var rpm = 1500;

  var running = true;
  var animFrame = null;
  var animTime = 0;
  var twistAnim = 0;      // smoothly animated twist visual
  var targetTwist = 0;    // target twist for animation

  /* Explore state */
  var selCat = 'theory';
  var selConcept = 0;

  /* Practice state */
  var pProblem = null, pAnswered = false, pScore = 0, pTotal = 0;

  /* Quiz state */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;
  var quizResults = [];

  /* ================================================================
     PHYSICS CALCULATIONS
     ================================================================ */
  function getMaterial() {
    return MATERIALS[matKey];
  }

  function polarMOI() {
    // J in mm^4
    if (shaftType === 'solid') {
      return Math.PI * Math.pow(outerDia, 4) / 32;
    }
    return Math.PI * (Math.pow(outerDia, 4) - Math.pow(innerDia, 4)) / 32;
  }

  function maxShearStress() {
    // tau_max in MPa; T in N*mm, r in mm, J in mm^4
    var J = polarMOI();
    if (J <= 0) return 0;
    var T_nmm = torque * 1000; // Nm -> N*mm
    var r = outerDia / 2;
    return T_nmm * r / J;
  }

  function angleOfTwist() {
    // theta in radians
    var J = polarMOI();
    var G = getMaterial().G;
    if (J <= 0 || G <= 0) return 0;
    var T_nmm = torque * 1000;
    return T_nmm * shaftLen / (G * J);
  }

  function angleOfTwistDeg() {
    return angleOfTwist() * 180 / Math.PI;
  }

  function transmittedPower() {
    // P in kW; T in Nm, N in rpm
    return 2 * Math.PI * rpm * torque / 60000;
  }

  function shaftWeight() {
    // Weight in kg
    var rho = getMaterial().density; // kg/m^3
    var Do_m = outerDia / 1000;
    var Di_m = (shaftType === 'hollow') ? innerDia / 1000 : 0;
    var L_m = shaftLen / 1000;
    var area = Math.PI / 4 * (Do_m * Do_m - Di_m * Di_m);
    return rho * area * L_m;
  }

  function getEffectiveInnerDia() {
    return shaftType === 'hollow' ? innerDia : 0;
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    var tau = maxShearStress();
    var theta = angleOfTwistDeg();
    var J = polarMOI();
    var P = transmittedPower();
    var W_kg = shaftWeight();
    var Di = getEffectiveInnerDia();

    /* Badges */
    $('#rb-tau').textContent = roundN(tau, 1) + ' MPa';
    $('#rb-theta').innerHTML = roundN(theta, 3) + '&deg;';
    $('#rb-j').innerHTML = fmtSci(J) + ' mm&sup4;';
    $('#rb-power').textContent = roundN(P, 2) + ' kW';

    /* Readout cards */
    $('#r-tau').textContent = roundN(tau, 2);
    $('#r-theta').textContent = roundN(theta, 3);
    $('#r-j').textContent = fmtSci(J);
    $('#r-power').textContent = roundN(P, 2);
    $('#r-od').textContent = outerDia;
    $('#r-id').textContent = Di;
    $('#r-len').textContent = shaftLen;
    $('#r-weight').textContent = roundN(W_kg, 3);

    /* Slider values */
    $('#od-val').textContent = outerDia + ' mm';
    $('#id-val').textContent = innerDia + ' mm';
    $('#len-val').textContent = shaftLen + ' mm';
    $('#torque-val').textContent = torque + ' Nm';
    $('#rpm-val').textContent = rpm + ' rpm';

    /* Animation target */
    targetTwist = clamp(angleOfTwist() * 30, 0, 0.6); // scale for visual effect
  }

  /* ================================================================
     CANVAS — DRAWING UTILITIES
     ================================================================ */
  function clearCanvas() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitle(text) {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(text, W / 2, 10);
  }

  function drawHatchedWall(x, y, w, h) {
    ctx.fillStyle = '#3a4260';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1.5;
    var spacing = 8;
    ctx.beginPath();
    for (var i = 0; i < h + w; i += spacing) {
      var sx = x + Math.min(i, w);
      var sy = y + Math.max(0, i - w);
      var ex = x + Math.max(0, i - h);
      var ey = y + Math.min(i, h);
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
    }
    ctx.stroke();
    /* Border */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
  }

  function drawDimArrow(x1, y1, x2, y2, label, offset) {
    offset = offset || 0;
    var isHoriz = Math.abs(y2 - y1) < 2;
    ctx.strokeStyle = '#6b7a99';
    ctx.fillStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);

    if (isHoriz) {
      var dy = offset || 20;
      /* Extension lines */
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x1, y1 + dy);
      ctx.moveTo(x2, y2); ctx.lineTo(x2, y2 + dy);
      ctx.stroke();
      ctx.setLineDash([]);
      /* Main line */
      var my = y1 + dy;
      ctx.beginPath();
      ctx.moveTo(x1, my); ctx.lineTo(x2, my);
      ctx.stroke();
      /* Arrowheads */
      ctx.beginPath();
      ctx.moveTo(x1, my); ctx.lineTo(x1 + 6, my - 3); ctx.lineTo(x1 + 6, my + 3);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x2, my); ctx.lineTo(x2 - 6, my - 3); ctx.lineTo(x2 - 6, my + 3);
      ctx.closePath(); ctx.fill();
      /* Label */
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, (x1 + x2) / 2, my + 4);
    } else {
      var dx = offset || 20;
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x1 + dx, y1);
      ctx.moveTo(x2, y2); ctx.lineTo(x2 + dx, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      var mx = x1 + dx;
      ctx.beginPath();
      ctx.moveTo(mx, y1); ctx.lineTo(mx, y2);
      ctx.stroke();
      /* Arrowheads */
      ctx.beginPath();
      ctx.moveTo(mx, y1); ctx.lineTo(mx - 3, y1 + 6); ctx.lineTo(mx + 3, y1 + 6);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(mx, y2); ctx.lineTo(mx - 3, y2 - 6); ctx.lineTo(mx + 3, y2 - 6);
      ctx.closePath(); ctx.fill();
      /* Label */
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx + 6, (y1 + y2) / 2);
    }
    ctx.setLineDash([]);
  }

  function drawCurvedTorqueArrow(cx, cy, r, clockwise, color, label) {
    var startAngle = clockwise ? -Math.PI * 0.75 : Math.PI * 0.25;
    var endAngle = clockwise ? -Math.PI * 0.15 : Math.PI * 0.85;
    var arrowR = r;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(cx, cy, arrowR, startAngle, endAngle, !clockwise);
    ctx.stroke();

    /* Arrowhead */
    var ax = cx + arrowR * Math.cos(endAngle);
    var ay = cy + arrowR * Math.sin(endAngle);
    var headAngle = clockwise ? endAngle + Math.PI / 2 : endAngle - Math.PI / 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ax + 8 * Math.cos(headAngle), ay + 8 * Math.sin(headAngle));
    ctx.lineTo(ax + 8 * Math.cos(headAngle + 2.3), ay + 8 * Math.sin(headAngle + 2.3));
    ctx.lineTo(ax + 8 * Math.cos(headAngle - 2.3), ay + 8 * Math.sin(headAngle - 2.3));
    ctx.closePath();
    ctx.fill();

    /* Label */
    if (label) {
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var lx = cx + (arrowR + 18) * Math.cos((startAngle + endAngle) / 2);
      var ly = cy + (arrowR + 18) * Math.sin((startAngle + endAngle) / 2);
      ctx.fillText(label, lx, ly);
    }
  }

  /* ================================================================
     CANVAS — SHAFT SIDE VIEW (3D cylinder)
     ================================================================ */
  function drawShaftSideView(sx, sy, shaftW, shaftH) {
    /* sx, sy: top-left of the shaft body area */
    var mat = getMaterial();

    /* Create 3D cylinder gradient */
    var cylGrad = ctx.createLinearGradient(sx, sy, sx, sy + shaftH);
    cylGrad.addColorStop(0.0, '#6b7a99');
    cylGrad.addColorStop(0.15, mat.color);
    cylGrad.addColorStop(0.5, '#3a4260');
    cylGrad.addColorStop(0.85, mat.color);
    cylGrad.addColorStop(1.0, '#252d42');

    /* Shaft body */
    ctx.fillStyle = cylGrad;
    ctx.beginPath();
    ctx.roundRect(sx, sy, shaftW, shaftH, 4);
    ctx.fill();

    /* Shaft border */
    ctx.strokeStyle = '#4a5270';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(sx, sy, shaftW, shaftH, 4);
    ctx.stroke();

    /* End caps (ellipses for 3D look) */
    /* Left end cap (fixed end) */
    ctx.fillStyle = '#2a3050';
    ctx.strokeStyle = '#4a5270';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy + shaftH / 2, 6, shaftH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    /* Right end cap (free end) */
    var endGrad = ctx.createLinearGradient(sx + shaftW, sy, sx + shaftW, sy + shaftH);
    endGrad.addColorStop(0, '#5a6480');
    endGrad.addColorStop(0.5, '#3a4260');
    endGrad.addColorStop(1, '#252d42');
    ctx.fillStyle = endGrad;
    ctx.beginPath();
    ctx.ellipse(sx + shaftW, sy + shaftH / 2, 6, shaftH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    /* Twist lines on shaft surface */
    var numLines = 8;
    var twistAmount = twistAnim;
    ctx.strokeStyle = 'rgba(107, 122, 153, 0.35)';
    ctx.lineWidth = 1;
    for (var i = 1; i < numLines; i++) {
      var frac = i / numLines;
      var lx = sx + shaftW * frac;
      /* The twist increases along the length */
      var localTwist = twistAmount * frac;
      var dx = localTwist * shaftH * 0.8;
      ctx.beginPath();
      ctx.moveTo(lx - dx / 2, sy + 2);
      /* Bezier for smooth twist curve */
      ctx.bezierCurveTo(
        lx - dx * 0.2, sy + shaftH * 0.3,
        lx + dx * 0.2, sy + shaftH * 0.7,
        lx + dx / 2, sy + shaftH - 2
      );
      ctx.stroke();
    }

    /* Highlight line at top */
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + 3);
    ctx.lineTo(sx + shaftW - 8, sy + 3);
    ctx.stroke();

    /* Hollow shaft indication (if hollow, draw hole at the end) */
    if (shaftType === 'hollow' && innerDia > 0) {
      var innerH = shaftH * (innerDia / outerDia);
      /* Draw inner circle at right end cap */
      ctx.fillStyle = '#0d1117';
      ctx.beginPath();
      ctx.ellipse(sx + shaftW, sy + shaftH / 2, 4, innerH / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#4a5270';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* ================================================================
     CANVAS — CROSS SECTION VIEW
     ================================================================ */
  function drawCrossSection(cx, cy, maxR) {
    var Di = getEffectiveInnerDia();
    var outerR = maxR;
    var innerR = (Di / outerDia) * maxR;
    var tau = maxShearStress();

    /* Stress gradient - radial */
    var numRings = 40;
    for (var i = numRings; i >= 0; i--) {
      var rFrac = i / numRings;
      var r = outerR * rFrac;

      /* Skip inside hollow part */
      if (shaftType === 'hollow' && r < innerR) continue;

      /* Stress fraction: for solid, linear from 0 to 1; for hollow, from Di/Do to 1 */
      var stressFrac;
      if (shaftType === 'hollow' && innerR > 0) {
        stressFrac = rFrac; // stress proportional to r/R
      } else {
        stressFrac = rFrac;
      }

      /* Color: blend from dark center (#1f2535) to bright accent (#ff6e40) */
      var red = Math.round(lerp(31, 255, stressFrac));
      var green = Math.round(lerp(37, 110, stressFrac));
      var blue = Math.round(lerp(53, 64, stressFrac));
      var alpha = 0.3 + 0.7 * stressFrac;

      ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Outer circle border */
    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    /* Inner circle (hollow) */
    if (shaftType === 'hollow' && innerR > 0) {
      /* Clear inner area */
      ctx.fillStyle = '#0d1117';
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fill();
      /* Inner border */
      ctx.strokeStyle = '#ff6e40';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.stroke();
    }

    /* Centre dot */
    ctx.fillStyle = '#6b7a99';
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    /* Stress distribution triangle (radial diagram) */
    /* Draw upward from center */
    var triBaseR = shaftType === 'hollow' ? innerR : 0;
    var stressAtInner = (shaftType === 'hollow' && outerDia > 0) ? tau * (innerDia / outerDia) : 0;
    var triWidth = 40; // max width of triangle at surface

    /* Dashed center line */
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - outerR - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Stress distribution triangle */
    ctx.fillStyle = 'rgba(255, 110, 64, 0.25)';
    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (shaftType === 'hollow' && innerR > 0) {
      var wInner = triWidth * (innerDia / outerDia);
      ctx.moveTo(cx + wInner, cy - innerR);
      ctx.lineTo(cx + triWidth, cy - outerR);
      ctx.lineTo(cx, cy - outerR);
      ctx.lineTo(cx, cy - innerR);
      ctx.closePath();
    } else {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + triWidth, cy - outerR);
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();

    /* Tau max label */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'left';
    ctx.fillText('\u03C4_max', cx + triWidth + 4, cy - outerR + 4);

    if (shaftType === 'hollow' && innerR > 0) {
      ctx.fillStyle = '#ffab91';
      ctx.fillText('\u03C4_i', cx + triWidth * (innerDia / outerDia) + 4, cy - innerR + 4);
    }

    /* Zero label at center */
    if (shaftType === 'solid') {
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'center';
      ctx.fillText('0', cx - 8, cy + 4);
    }

    /* Diameter labels */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('D = ' + outerDia + ' mm', cx, cy + outerR + 20);
    if (shaftType === 'hollow' && innerDia > 0) {
      ctx.fillStyle = '#ffab91';
      ctx.fillText('d = ' + innerDia + ' mm', cx, cy + outerR + 35);
    }
  }

  /* ================================================================
     CANVAS — SIMULATE MODE
     ================================================================ */
  function drawSimulate() {
    /* Layout constants */
    var wallX = 60, wallY = 120, wallW = 25, wallH = 180;
    var shaftW = 320;
    var shaftH = clamp(outerDia * 1.5, 40, 160);
    var shaftX = wallX + wallW;
    var shaftY = wallY + (wallH - shaftH) / 2;

    /* Draw fixed wall */
    drawHatchedWall(wallX, wallY, wallW, wallH);

    /* Draw shaft side view */
    drawShaftSideView(shaftX, shaftY, shaftW, shaftH);

    /* Draw torque arrow at free end */
    var torqueR = shaftH / 2 + 25;
    drawCurvedTorqueArrow(shaftX + shaftW, shaftY + shaftH / 2, torqueR, true, '#ff6e40', 'T = ' + torque + ' Nm');

    /* Reaction torque arrow at fixed end (opposite direction) */
    if (torque > 0) {
      drawCurvedTorqueArrow(wallX + wallW / 2, shaftY + shaftH / 2, torqueR * 0.7, false, 'rgba(255,110,64,0.4)', '');
    }

    /* Length dimension */
    drawDimArrow(shaftX, shaftY + shaftH, shaftX + shaftW, shaftY + shaftH, 'L = ' + shaftLen + ' mm', 35);

    /* Diameter dimension (vertical) */
    drawDimArrow(shaftX + shaftW * 0.5, shaftY, shaftX + shaftW * 0.5, shaftY + shaftH, 'D = ' + outerDia + ' mm', -50);

    /* Draw cross-section view on right side */
    var csX = 630, csY = 220, csR = 90;
    /* Scale cross-section radius to fit */
    var effectiveR = Math.min(csR, csR);

    /* Section label */
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Cross-Section View', csX, csY - effectiveR - 30);

    /* Draw cutting plane indicator on shaft */
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 1;
    var cutX = shaftX + shaftW * 0.6;
    ctx.beginPath();
    ctx.moveTo(cutX, shaftY - 15);
    ctx.lineTo(cutX, shaftY + shaftH + 15);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Arrow from cut to cross section */
    ctx.strokeStyle = 'rgba(255,110,64,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cutX + 5, shaftY - 10);
    ctx.lineTo(csX - effectiveR - 10, csY - effectiveR + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Draw cross-section */
    drawCrossSection(csX, csY, effectiveR);

    /* Info box */
    var ibx = W - 210, iby = 15, ibw = 195, ibh = 95;
    ctx.fillStyle = 'rgba(31,37,53,0.92)';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(ibx, iby, ibw, ibh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'left';
    var lh = 16, ly = iby + 18;
    ctx.fillText('Type: ' + (shaftType === 'solid' ? 'Solid' : 'Hollow'), ibx + 12, ly);
    ctx.fillText('Material: ' + getMaterial().name, ibx + 12, ly + lh);
    ctx.fillText('\u03C4_max: ' + roundN(maxShearStress(), 1) + ' MPa', ibx + 12, ly + lh * 2);
    ctx.fillText('\u03B8: ' + roundN(angleOfTwistDeg(), 3) + '\u00B0', ibx + 12, ly + lh * 3);
    ctx.fillText('P: ' + roundN(transmittedPower(), 2) + ' kW', ibx + 12, ly + lh * 4);

    /* Stress warning indicator */
    var tau = maxShearStress();
    if (tau > 0) {
      var warnColor = tau > 200 ? '#ff5555' : (tau > 100 ? '#f5c842' : '#3ddc84');
      var warnLabel = tau > 200 ? 'HIGH STRESS' : (tau > 100 ? 'MODERATE' : 'SAFE');
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.fillStyle = warnColor;
      ctx.textAlign = 'left';
      ctx.fillText('\u25CF ' + warnLabel, ibx + 12, ly + lh * 5 + 2);
    }

    /* Title */
    drawTitle('Shaft Torsion \u2014 Side View & Cross-Section');
  }

  /* ================================================================
     CANVAS — EXPLORE MODE DIAGRAMS
     ================================================================ */
  function drawExploreDiagram(concept) {
    var diag = concept.diagram;
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText(concept.name, W / 2, 35);

    switch (diag) {
      case 'torsionFormula':
        drawDiag_torsionFormula();
        break;
      case 'angleOfTwist':
        drawDiag_angleOfTwist();
        break;
      case 'stressDistribution':
        drawDiag_stressDistribution();
        break;
      case 'polarSolid':
        drawDiag_polarSolid();
        break;
      case 'polarHollow':
        drawDiag_polarHollow();
        break;
      case 'sectionModulus':
        drawDiag_sectionModulus();
        break;
      case 'powerTransmission':
        drawDiag_powerTransmission();
        break;
      case 'shaftDesign':
        drawDiag_shaftDesign();
        break;
      case 'materialSelection':
        drawDiag_materialSelection();
        break;
      case 'hollowVsSolid':
        drawDiag_hollowVsSolid();
        break;
      case 'torsionalRigidity':
        drawDiag_torsionalRigidity();
        break;
      default:
        drawDiag_generic(concept);
        break;
    }
  }

  function drawDiag_torsionFormula() {
    /* Show shaft with force labels and stress distribution */
    var sx = 100, sy = 140, sw = 300, sh = 100;
    drawHatchedWall(sx - 25, sy - 20, 25, sh + 40);
    drawShaftSideViewStatic(sx, sy, sw, sh, '#8899aa');

    /* Torque arrow */
    drawCurvedTorqueArrow(sx + sw, sy + sh / 2, sh / 2 + 20, true, '#ff6e40', 'T');

    /* Labels */
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Fixed end', sx - 12, sy + sh + 40);
    ctx.fillText('Free end', sx + sw, sy + sh + 40);

    /* Cross section with stress */
    drawCrossSection(630, 220, 80);

    /* Formula */
    ctx.font = '700 18px "Courier New", monospace';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C4_max = T \u00D7 r / J', W / 2, H - 50);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('\u03C4 = shear stress (MPa) | T = torque (N\u00B7mm) | r = radius (mm) | J = polar MOI (mm\u2074)', W / 2, H - 25);
  }

  function drawDiag_angleOfTwist() {
    /* Show shaft with twist indication */
    var sx = 80, sy = 140, sw = 350, sh = 90;
    drawHatchedWall(sx - 25, sy - 15, 25, sh + 30);
    drawShaftSideViewStatic(sx, sy, sw, sh, '#8899aa');

    /* Show angle of twist */
    drawCurvedTorqueArrow(sx + sw, sy + sh / 2, sh / 2 + 20, true, '#ff6e40', 'T');

    /* Twist angle arc */
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx + sw, sy + sh / 2, sh / 2 + 40, -Math.PI / 2, -Math.PI / 2 + 0.3, false);
    ctx.stroke();
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'left';
    ctx.fillText('\u03B8', sx + sw + sh / 2 + 44, sy + sh / 2 - sh / 2 - 8);

    /* Length arrow */
    drawDimArrow(sx, sy + sh + 5, sx + sw, sy + sh + 5, 'L', 20);

    /* Formula */
    ctx.font = '700 18px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'center';
    ctx.fillText('\u03B8 = T \u00D7 L / (G \u00D7 J)', W / 2, H - 50);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('\u03B8 = angle of twist (rad) | T = torque (N\u00B7mm) | L = length (mm) | G = shear modulus (MPa)', W / 2, H - 25);
  }

  function drawDiag_stressDistribution() {
    /* Show cross-section with detailed stress distribution */
    /* Solid shaft */
    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Solid Shaft', 220, 70);
    drawCrossSectionDetailed(220, 220, 90, false);

    /* Hollow shaft */
    ctx.fillText('Hollow Shaft', 630, 70);
    drawCrossSectionDetailed(630, 220, 90, true);

    /* Formula */
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C4(r) = T \u00D7 r / J    (linear distribution)', W / 2, H - 40);
  }

  function drawDiag_polarSolid() {
    /* Show solid shaft cross-section with J formula */
    drawCrossSection(300, 220, 100);

    /* Additional info */
    ctx.font = '700 20px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('J = \u03C0D\u2074 / 32', 650, 180);

    /* Numerical example */
    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Example: D = 50 mm', 650, 220);
    ctx.fillStyle = '#ff6e40';
    ctx.fillText('J = \u03C0(50)\u2074/32', 650, 245);
    ctx.fillText('J = 613,592 mm\u2074', 650, 270);

    /* Property note */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('J depends on the 4th power of D', 650, 310);
    ctx.fillText('Doubling D increases J by 16\u00D7', 650, 330);
  }

  function drawDiag_polarHollow() {
    /* Hollow cross-section */
    var saveType = shaftType;
    var saveDi = innerDia;
    shaftType = 'hollow';
    innerDia = 50;
    var saveOd = outerDia;
    outerDia = 80;
    drawCrossSection(300, 220, 100);
    shaftType = saveType;
    innerDia = saveDi;
    outerDia = saveOd;

    /* Formula */
    ctx.font = '700 18px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('J = \u03C0(D_o\u2074 \u2212 D_i\u2074) / 32', 650, 180);

    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Example: D_o=80mm, D_i=50mm', 650, 220);
    ctx.fillStyle = '#ff6e40';
    ctx.fillText('J = \u03C0(80\u2074 \u2212 50\u2074)/32', 650, 245);
    ctx.fillText('J = 3,406,816 mm\u2074', 650, 270);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Removes low-stress material from centre', 650, 310);
    ctx.fillText('Retains ~85% torsional strength at ~61% weight', 650, 330);
  }

  function drawDiag_sectionModulus() {
    /* Solid circle */
    ctx.fillStyle = 'rgba(255,110,64,0.15)';
    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(250, 220, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('D', 250, 320);

    /* Formula */
    ctx.font = '700 18px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('Z_p = J / (D/2) = \u03C0D\u00B3/16', 620, 180);

    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Simplifies torsion check:', 620, 220);
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#ff6e40';
    ctx.fillText('\u03C4_max = T / Z_p', 620, 250);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Useful for quick shaft comparison', 620, 290);
    ctx.fillText('Higher Z_p = more torque capacity', 620, 310);
  }

  function drawDiag_powerTransmission() {
    /* Motor -> Shaft -> Load diagram */
    /* Motor */
    ctx.fillStyle = '#2a3050';
    ctx.strokeStyle = '#4a5270';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 160, 100, 120, 10);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('MOTOR', 130, 225);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('P, N', 130, 245);

    /* Shaft */
    var shGrad = ctx.createLinearGradient(180, 200, 180, 240);
    shGrad.addColorStop(0, '#6b7a99');
    shGrad.addColorStop(0.5, '#3a4260');
    shGrad.addColorStop(1, '#252d42');
    ctx.fillStyle = shGrad;
    ctx.fillRect(180, 205, 280, 30);
    ctx.strokeStyle = '#4a5270';
    ctx.strokeRect(180, 205, 280, 30);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'center';
    ctx.fillText('SHAFT (T, \u03C4, \u03B8)', 320, 198);

    /* Rotation arrow */
    drawCurvedTorqueArrow(350, 220, 40, true, 'rgba(255,110,64,0.5)', '');

    /* Load */
    ctx.fillStyle = '#2a3050';
    ctx.strokeStyle = '#4a5270';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(460, 160, 100, 120, 10);
    ctx.fill();
    ctx.stroke();
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('LOAD', 510, 225);

    /* Formula */
    ctx.font = '700 20px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('P = 2\u03C0NT / 60', W / 2, H - 80);

    ctx.font = '600 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('P (Watts) | N (RPM) | T (N\u00B7m)', W / 2, H - 50);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('For kW: divide by 1000 | For HP: divide by 746', W / 2, H - 25);
  }

  function drawDiag_shaftDesign() {
    /* Show the design process flow */
    var steps = [
      { label: 'Given', detail: 'P (kW), N (RPM)' },
      { label: 'Find T', detail: 'T = P\u00D760/(2\u03C0N)' },
      { label: 'Choose \u03C4_allow', detail: 'Material property' },
      { label: 'Find D', detail: 'D = (16T/\u03C0\u03C4)^(1/3)' }
    ];

    var bw = 160, bh = 60, gap = 30;
    var startX = (W - (steps.length * bw + (steps.length - 1) * gap)) / 2;
    var by = 150;

    for (var i = 0; i < steps.length; i++) {
      var bx = startX + i * (bw + gap);
      ctx.fillStyle = i === 3 ? 'rgba(255,110,64,0.15)' : '#1f2535';
      ctx.strokeStyle = i === 3 ? '#ff6e40' : '#2a3050';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = i === 3 ? '#ff6e40' : '#dde3f0';
      ctx.textAlign = 'center';
      ctx.fillText(steps[i].label, bx + bw / 2, by + 24);

      ctx.font = '600 10px "Courier New", monospace';
      ctx.fillStyle = '#6b7a99';
      ctx.fillText(steps[i].detail, bx + bw / 2, by + 44);

      /* Arrow */
      if (i < steps.length - 1) {
        ctx.fillStyle = '#4a5270';
        ctx.beginPath();
        var ax = bx + bw + gap / 2;
        ctx.moveTo(ax - 6, by + bh / 2 - 4);
        ctx.lineTo(ax + 6, by + bh / 2);
        ctx.lineTo(ax - 6, by + bh / 2 + 4);
        ctx.closePath();
        ctx.fill();
      }
    }

    /* Design formula */
    ctx.font = '700 20px "Courier New", monospace';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'center';
    ctx.fillText('D = (16T / \u03C0\u03C4_allow)^(1/3)', W / 2, 300);

    /* Table of common allowable stresses */
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Common allowable shear stresses:', W / 2, 350);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Mild steel: 40-60 MPa | Alloy steel: 60-100 MPa | Stainless steel: 50-70 MPa', W / 2, 375);
  }

  function drawDiag_materialSelection() {
    /* Bar chart comparing materials */
    var mats = [
      { name: 'Steel', G: 80, rho: 7850, color: '#8899aa' },
      { name: 'Aluminium', G: 26, rho: 2700, color: '#b0c4de' },
      { name: 'Copper', G: 45, rho: 8960, color: '#cd7f32' }
    ];

    var chartX = 120, chartY = 100, chartW = 300, chartH = 250;
    var barW = 60, gap = 40;

    /* G chart */
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Shear Modulus G (GPa)', chartX + chartW / 2, chartY - 10);

    for (var i = 0; i < mats.length; i++) {
      var bx = chartX + 20 + i * (barW + gap);
      var bh = (mats[i].G / 80) * (chartH - 40);
      var by = chartY + chartH - bh;

      ctx.fillStyle = mats[i].color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, bh, [4, 4, 0, 0]);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'center';
      ctx.fillText(mats[i].G + '', bx + barW / 2, by - 8);

      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99';
      ctx.fillText(mats[i].name, bx + barW / 2, chartY + chartH + 15);
    }

    /* Density chart */
    var chart2X = 520;
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Density \u03C1 (kg/m\u00B3)', chart2X + chartW / 2, chartY - 10);

    for (var k = 0; k < mats.length; k++) {
      var bx2 = chart2X + 20 + k * (barW + gap);
      var bh2 = (mats[k].rho / 9000) * (chartH - 40);
      var by2 = chartY + chartH - bh2;

      ctx.fillStyle = mats[k].color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.roundRect(bx2, by2, barW, bh2, [4, 4, 0, 0]);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'center';
      ctx.fillText(mats[k].rho + '', bx2 + barW / 2, by2 - 8);

      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99';
      ctx.fillText(mats[k].name, bx2 + barW / 2, chartY + chartH + 15);
    }

    /* G/rho comparison */
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('Specific stiffness: G/\u03C1 \u2192 Steel: 10.2 | Al: 9.6 | Cu: 5.0', W / 2, H - 30);
  }

  function drawDiag_hollowVsSolid() {
    /* Side-by-side comparison */
    /* Solid */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Solid Shaft', 220, 80);

    ctx.fillStyle = 'rgba(136,153,170,0.3)';
    ctx.strokeStyle = '#8899aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(220, 200, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('J = \u03C0D\u2074/32', 220, 310);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Weight = 100%', 220, 335);
    ctx.fillText('Strength = 100%', 220, 355);

    /* Hollow */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Hollow Shaft (d/D = 0.6)', 630, 80);

    ctx.fillStyle = 'rgba(255,110,64,0.2)';
    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(630, 200, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.arc(630, 200, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('J = \u03C0(D\u2074\u2212d\u2074)/32', 630, 310);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Weight = 64%', 630, 335);
    ctx.fillText('Strength = 87%', 630, 355);

    /* Arrow between */
    ctx.fillStyle = '#4a5270';
    ctx.beginPath();
    ctx.moveTo(380, 200);
    ctx.lineTo(420, 190);
    ctx.lineTo(420, 210);
    ctx.closePath();
    ctx.fill();
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Same D_o', 400, 175);

    /* Bottom summary */
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Hollow shaft: 36% weight saving with only 13% strength loss!', W / 2, H - 40);
  }

  function drawDiag_torsionalRigidity() {
    /* Show stiff vs flexible shaft */
    var sx = 100, sy = 130;
    /* Stiff shaft */
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('High Torsional Rigidity (large GJ)', 270, sy - 10);
    drawShaftSideViewStatic(sx, sy, 300, 60, '#3ddc84');
    /* Minimal twist lines */
    ctx.strokeStyle = 'rgba(61,220,132,0.3)';
    ctx.lineWidth = 1;
    for (var j = 1; j < 6; j++) {
      var fx = sx + 50 * j;
      ctx.beginPath();
      ctx.moveTo(fx, sy + 2);
      ctx.lineTo(fx + 2, sy + 58);
      ctx.stroke();
    }

    /* Flexible shaft */
    var sy2 = 280;
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5555';
    ctx.textAlign = 'center';
    ctx.fillText('Low Torsional Rigidity (small GJ)', 270, sy2 - 10);
    drawShaftSideViewStatic(sx, sy2, 300, 60, '#ff5555');
    /* Large twist lines */
    ctx.strokeStyle = 'rgba(255,85,85,0.3)';
    ctx.lineWidth = 1;
    for (var k = 1; k < 6; k++) {
      var fx2 = sx + 50 * k;
      var twist = k * 6;
      ctx.beginPath();
      ctx.moveTo(fx2 - twist / 2, sy2 + 2);
      ctx.bezierCurveTo(fx2 - twist * 0.2, sy2 + 20, fx2 + twist * 0.2, sy2 + 40, fx2 + twist / 2, sy2 + 58);
      ctx.stroke();
    }

    /* Formula */
    ctx.font = '700 18px "Courier New", monospace';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'center';
    ctx.fillText('k_t = G \u00D7 J / L', 650, 200);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Torsional rigidity: GJ', 650, 240);
    ctx.fillText('Torsional stiffness: GJ/L', 650, 260);
    ctx.fillText('Higher \u2192 less twist per unit torque', 650, 280);
  }

  function drawDiag_generic(concept) {
    /* Generic diagram with formula display */
    ctx.font = '700 22px "Courier New", monospace';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'center';
    ctx.fillText(concept.formula, W / 2, H / 2 - 20);

    ctx.font = '600 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Unit: ' + concept.unit, W / 2, H / 2 + 20);

    /* Draw a simple shaft */
    drawShaftSideViewStatic(200, 280, 250, 60, '#8899aa');
    drawCurvedTorqueArrow(450, 310, 50, true, '#ff6e40', 'T');
  }

  /* Static shaft side view (for explore diagrams) */
  function drawShaftSideViewStatic(sx, sy, sw, sh, tintColor) {
    tintColor = tintColor || '#8899aa';
    var cylGrad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
    cylGrad.addColorStop(0.0, '#6b7a99');
    cylGrad.addColorStop(0.3, tintColor);
    cylGrad.addColorStop(0.7, '#3a4260');
    cylGrad.addColorStop(1.0, '#252d42');
    ctx.fillStyle = cylGrad;
    ctx.beginPath();
    ctx.roundRect(sx, sy, sw, sh, 4);
    ctx.fill();
    ctx.strokeStyle = '#4a5270';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /* Detailed cross-section for stress distribution diagram */
  function drawCrossSectionDetailed(cx, cy, maxR, isHollow) {
    var innerR = isHollow ? maxR * 0.5 : 0;

    /* Gradient rings */
    var numRings = 30;
    for (var i = numRings; i >= 0; i--) {
      var rFrac = i / numRings;
      var r = maxR * rFrac;
      if (isHollow && r < innerR) continue;

      var red = Math.round(lerp(31, 255, rFrac));
      var green = Math.round(lerp(37, 110, rFrac));
      var blue = Math.round(lerp(53, 64, rFrac));

      ctx.fillStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + (0.3 + 0.7 * rFrac) + ')';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.stroke();

    if (isHollow) {
      ctx.fillStyle = '#0d1117';
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff6e40';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    /* Stress distribution line (vertical, upward) */
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - maxR - 15);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Triangle */
    var tw = 35;
    ctx.fillStyle = 'rgba(255,110,64,0.25)';
    ctx.strokeStyle = '#ff6e40';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (isHollow) {
      ctx.moveTo(cx + tw * 0.5, cy - innerR);
      ctx.lineTo(cx + tw, cy - maxR);
      ctx.lineTo(cx, cy - maxR);
      ctx.lineTo(cx, cy - innerR);
    } else {
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + tw, cy - maxR);
      ctx.lineTo(cx, cy - maxR);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    /* Labels */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff6e40';
    ctx.textAlign = 'left';
    ctx.fillText('\u03C4_max', cx + tw + 4, cy - maxR + 4);

    if (!isHollow) {
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'center';
      ctx.fillText('\u03C4 = 0', cx - 12, cy + 4);
    } else {
      ctx.fillStyle = '#ffab91';
      ctx.textAlign = 'left';
      ctx.fillText('\u03C4_i > 0', cx + tw * 0.5 + 4, cy - innerR + 4);
    }
  }

  /* ================================================================
     MAIN DRAW
     ================================================================ */
  function draw() {
    clearCanvas();

    if (mode === 'simulate') {
      drawSimulate();
    } else if (mode === 'explore') {
      var concepts = CONCEPTS.filter(function (c) { return c.cat === selCat; });
      if (concepts.length > 0) {
        var idx = clamp(selConcept, 0, concepts.length - 1);
        drawExploreDiagram(concepts[idx]);
      }
    } else if (mode === 'practice') {
      drawPracticeDiagram();
    } else if (mode === 'quiz') {
      drawQuizDiagram();
    }
  }

  function drawPracticeDiagram() {
    drawTitle('Practice Mode \u2014 Solve Shaft Torsion Problems');
    /* Draw a generic shaft setup */
    var sx = 150, sy = 160, sw = 320, sh = 80;
    drawHatchedWall(sx - 25, sy - 15, 25, sh + 30);
    drawShaftSideViewStatic(sx, sy, sw, sh, '#8899aa');
    drawCurvedTorqueArrow(sx + sw, sy + sh / 2, sh / 2 + 20, true, '#ff6e40', 'T');
    drawCrossSection(680, 240, 70);
    drawDimArrow(sx, sy + sh + 5, sx + sw, sy + sh + 5, 'L', 25);

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Use the formulas: \u03C4 = Tr/J  |  \u03B8 = TL/GJ  |  P = 2\u03C0NT/60  |  J = \u03C0D\u2074/32', W / 2, H - 30);
  }

  function drawQuizDiagram() {
    drawTitle('Quiz Mode \u2014 Test Your Knowledge');
    /* Draw a styled shaft */
    var sx = 180, sy = 150, sw = 280, sh = 80;
    drawHatchedWall(sx - 25, sy - 15, 25, sh + 30);
    drawShaftSideViewStatic(sx, sy, sw, sh, '#ff6e40');
    drawCurvedTorqueArrow(sx + sw, sy + sh / 2, sh / 2 + 25, true, '#f5c842', 'T');

    /* Question counter */
    if (quizQs.length > 0 && quizIdx < quizQs.length) {
      ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ff6e40';
      ctx.textAlign = 'center';
      ctx.fillText('Question ' + (quizIdx + 1) + ' of ' + quizQs.length, W / 2, H - 50);
    }

    drawCrossSection(660, 230, 65);
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate(ts) {
    animTime = ts || 0;

    /* Smooth twist animation */
    twistAnim += (targetTwist - twistAnim) * 0.08;
    if (Math.abs(twistAnim - targetTwist) < 0.001) twistAnim = targetTwist;

    draw();

    if (running) {
      animFrame = requestAnimationFrame(animate);
    }
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;

    /* Update pills */
    $$('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });

    /* Show/hide panels */
    var simEls = ['sim-panel'];
    var expEls = ['cat-row', 'item-selector', 'item-info'];
    var praEls = ['practice-panel', 'practice-bar'];
    var quiEls = ['quiz-panel', 'quiz-bar', 'quiz-result'];

    simEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'simulate' ? show(el) : hide(el); } });
    expEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'explore' ? show(el) : hide(el); } });
    praEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'practice' ? show(el) : hide(el); } });
    quiEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'quiz' ? show(el) : hide(el); } });

    if (m === 'explore') {
      buildConceptGrid();
      showConceptInfo();
    }
    if (m === 'practice') {
      if (!pProblem) newPracticeProblem();
    }
    if (m === 'quiz') {
      hide($('#quiz-result'));
      if (quizQs.length === 0) startQuiz();
    }

    draw();
  }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  function buildConceptGrid() {
    var grid = $('#concept-grid');
    var filtered = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    grid.innerHTML = '';
    filtered.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (i === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selConcept = i;
        $$('#concept-grid .is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo();
        draw();
      });
      grid.appendChild(btn);
    });
  }

  function showConceptInfo() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    if (filtered.length === 0) return;
    var idx = clamp(selConcept, 0, filtered.length - 1);
    var c = filtered[idx];
    var info = $('#item-info');

    var html = '<div class="ii-top">';
    html += '<span class="ii-name">' + c.name + '</span>';
    html += '<span class="ii-cat-badge">' + c.cat + '</span>';
    html += '</div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box">';
    html += '<span class="fb-formula">' + c.formula + '</span>';
    html += '<span class="fb-unit">Unit: ' + c.unit + '</span>';
    html += '</div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Example Calculation</h4>';
      html += '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step">' + s + '</p>';
      });
      html += '<p class="ex-step"><strong>Answer: ' + c.example.answer + ' ' + c.example.unit + '</strong></p>';
      html += '</div>';
    }

    info.innerHTML = html;
    show(info);
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function newPracticeProblem() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    pProblem = gen();
    pAnswered = false;

    $('#pp-prompt').textContent = pProblem.prompt;
    $('#pp-unit').textContent = pProblem.unit;
    $('#pp-input').value = '';
    $('#pp-input').disabled = false;
    $('#pp-feedback').textContent = '';
    $('#pp-feedback').className = 'feedback';
    hide($('#pp-next'));
    hide($('#pp-solution'));
    show($('#pp-check'));
    $('#pp-input').focus();
    draw();
  }

  function checkPractice() {
    if (pAnswered || !pProblem) return;
    var userVal = parseFloat($('#pp-input').value);
    if (isNaN(userVal)) {
      $('#pp-feedback').textContent = 'Please enter a number.';
      $('#pp-feedback').className = 'feedback err';
      return;
    }

    pAnswered = true;
    pTotal++;
    var correct = pProblem.answer;
    var tol = Math.max(Math.abs(correct) * 0.03, 0.5); // 3% or 0.5 tolerance
    var isCorrect = Math.abs(userVal - correct) <= tol;

    if (isCorrect) {
      pScore++;
      $('#pp-feedback').textContent = '\u2713 Correct! Answer: ' + correct + ' ' + pProblem.unit;
      $('#pp-feedback').className = 'feedback ok';
    } else {
      $('#pp-feedback').textContent = '\u2717 Incorrect. Correct answer: ' + correct + ' ' + pProblem.unit;
      $('#pp-feedback').className = 'feedback err';
    }

    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
    $('#pp-input').disabled = true;
    hide($('#pp-check'));
    show($('#pp-next'));

    /* Show solution */
    var solPanel = $('#pp-solution');
    var html = '<h4>Step-by-Step Solution</h4>';
    pProblem.steps.forEach(function (s) {
      html += '<p class="sol-step">' + s + '</p>';
    });
    solPanel.innerHTML = html;
    show(solPanel);
  }

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    quizQs = shuffleArr(QUIZ_POOL).slice(0, 5);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    quizResults = [];
    hide($('#quiz-result'));
    show($('#quiz-panel'));
    show($('#quiz-bar'));
    renderQuizQuestion();
    draw();
  }

  function renderQuizQuestion() {
    if (quizIdx >= quizQs.length) {
      showQuizResult();
      return;
    }
    var q = quizQs[quizIdx];
    quizAnswered = false;
    $('#qbar-num').textContent = quizIdx + 1;

    var panel = $('#quiz-panel');
    var html = '<p class="qp-prompt">' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, oi) {
        html += '<button class="answer-btn" data-idx="' + oi + '">' + opt + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-input" type="number" step="any" placeholder="Your answer">';
      html += '<span class="qi-unit">' + (q.unit || '') + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
    }
    html += '<div style="margin-top:10px;"><span class="quiz-feedback" id="quiz-fb"></span></div>';
    html += '<div style="margin-top:10px;display:none;" id="quiz-next-wrap"><button class="btn btn-ghost" id="quiz-next">Next \u2192</button></div>';

    panel.innerHTML = html;

    /* Bind events */
    if (q.type === 'mcq') {
      $$('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var chosen = parseInt(btn.dataset.idx);
          var correct = q.correct;
          $$('.answer-btn').forEach(function (b) { b.classList.add('locked'); });
          $$('.answer-btn')[correct].classList.add('correct');
          if (chosen === correct) {
            quizScore++;
            btn.classList.add('correct');
            $('#quiz-fb').textContent = '\u2713 Correct!';
            $('#quiz-fb').className = 'quiz-feedback ok';
            quizResults.push({ q: q.prompt, correct: true, userAnswer: q.options[chosen], rightAnswer: q.options[correct] });
          } else {
            btn.classList.add('wrong');
            $('#quiz-fb').textContent = '\u2717 Wrong. Correct: ' + q.options[correct];
            $('#quiz-fb').className = 'quiz-feedback err';
            quizResults.push({ q: q.prompt, correct: false, userAnswer: q.options[chosen], rightAnswer: q.options[correct] });
          }
          show($('#quiz-next-wrap'));
        });
      });
    } else {
      var submitBtn = $('#qi-submit');
      if (submitBtn) {
        submitBtn.addEventListener('click', function () {
          if (quizAnswered) return;
          var input = $('#qi-input');
          var userVal = parseFloat(input.value);
          if (isNaN(userVal)) {
            $('#quiz-fb').textContent = 'Enter a number.';
            $('#quiz-fb').className = 'quiz-feedback err';
            return;
          }
          quizAnswered = true;
          var tol = q.tolerance || Math.max(Math.abs(q.answer) * 0.05, 0.5);
          if (Math.abs(userVal - q.answer) <= tol) {
            quizScore++;
            $('#quiz-fb').textContent = '\u2713 Correct! Answer: ' + q.answer + ' ' + q.unit;
            $('#quiz-fb').className = 'quiz-feedback ok';
            quizResults.push({ q: q.prompt, correct: true, userAnswer: userVal + '', rightAnswer: q.answer + ' ' + q.unit });
          } else {
            $('#quiz-fb').textContent = '\u2717 Wrong. Correct: ' + q.answer + ' ' + q.unit;
            $('#quiz-fb').className = 'quiz-feedback err';
            quizResults.push({ q: q.prompt, correct: false, userAnswer: userVal + '', rightAnswer: q.answer + ' ' + q.unit });
          }
          input.disabled = true;
          submitBtn.disabled = true;
          show($('#quiz-next-wrap'));
        });
      }
    }

    /* Next button */
    var nextWrap = $('#quiz-next-wrap');
    if (nextWrap) {
      var nextBtn = $('#quiz-next');
      nextBtn.addEventListener('click', function () {
        quizIdx++;
        if (quizIdx >= quizQs.length) {
          showQuizResult();
        } else {
          renderQuizQuestion();
          draw();
        }
      });
    }
    draw();
  }

  function showQuizResult() {
    hide($('#quiz-panel'));
    hide($('#quiz-bar'));
    var result = $('#quiz-result');
    show(result);

    var pct = Math.round((quizScore / quizQs.length) * 100);
    var stars = '';
    var scoreClass = 'poor';
    var verdict = 'Keep practising!';
    if (pct >= 80) { stars = '\u2B50\u2B50\u2B50'; scoreClass = 'perfect'; verdict = 'Excellent!'; }
    else if (pct >= 60) { stars = '\u2B50\u2B50'; scoreClass = 'good'; verdict = 'Good job!'; }
    else if (pct >= 40) { stars = '\u2B50'; scoreClass = 'poor'; verdict = 'Keep practising.'; }

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + scoreClass + '">' + pct + '%</span><p class="qr-verdict">' + verdict + '</p></div>';
    html += '</div>';

    html += '<div class="qr-rows">';
    quizResults.forEach(function (r, i) {
      html += '<div class="qr-row ' + (r.correct ? 'ok' : 'err') + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + r.q.substring(0, 60) + (r.q.length > 60 ? '...' : '') + '</strong></span>';
      html += '<span class="qr-mark">' + (r.correct ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="quiz-retry" style="align-self:center;margin-top:8px;">Retry Quiz</button>';

    result.innerHTML = html;

    $('#quiz-retry').addEventListener('click', function () {
      startQuiz();
    });
  }

  /* ================================================================
     EVENT BINDINGS
     ================================================================ */
  function bindEvents() {
    /* Mode tabs */
    $$('#mode-tabs .pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        setMode(pill.dataset.mode);
      });
    });

    /* Shaft type tabs */
    $$('#type-tabs .pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        shaftType = pill.dataset.type;
        $$('#type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.type === shaftType); });
        if (shaftType === 'hollow') {
          show($('#id-row'));
          if (innerDia >= outerDia) innerDia = Math.max(0, outerDia - 10);
          $('#id-slider').max = outerDia - 1;
          $('#id-slider').value = innerDia;
        } else {
          hide($('#id-row'));
          innerDia = 0;
        }
        updateReadouts();
        draw();
        clearActivePreset();
      });
    });

    /* Material tabs */
    $$('#mat-tabs .pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        matKey = pill.dataset.mat;
        $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mat === matKey); });
        updateReadouts();
        draw();
        clearActivePreset();
      });
    });

    /* Sliders */
    $('#od-slider').addEventListener('input', function () {
      outerDia = parseInt(this.value);
      /* Constrain inner diameter */
      if (shaftType === 'hollow') {
        $('#id-slider').max = outerDia - 1;
        if (innerDia >= outerDia) {
          innerDia = outerDia - 1;
          $('#id-slider').value = innerDia;
        }
      }
      updateReadouts();
      draw();
      clearActivePreset();
    });

    $('#id-slider').addEventListener('input', function () {
      innerDia = parseInt(this.value);
      if (innerDia >= outerDia) {
        innerDia = outerDia - 1;
        this.value = innerDia;
      }
      updateReadouts();
      draw();
      clearActivePreset();
    });

    $('#len-slider').addEventListener('input', function () {
      shaftLen = parseInt(this.value);
      updateReadouts();
      draw();
      clearActivePreset();
    });

    $('#torque-slider').addEventListener('input', function () {
      torque = parseInt(this.value);
      updateReadouts();
      draw();
      clearActivePreset();
    });

    $('#rpm-slider').addEventListener('input', function () {
      rpm = parseInt(this.value);
      updateReadouts();
      draw();
      clearActivePreset();
    });

    /* Presets */
    $$('.preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var presetKey = btn.dataset.preset;
        var p = PRESETS[presetKey];
        if (!p) return;

        /* Set shaft type */
        shaftType = p.type;
        $$('#type-tabs .pill').forEach(function (pill) { pill.classList.toggle('active', pill.dataset.type === shaftType); });
        if (shaftType === 'hollow') {
          show($('#id-row'));
        } else {
          hide($('#id-row'));
        }

        /* Set material */
        matKey = p.mat;
        $$('#mat-tabs .pill').forEach(function (pill) { pill.classList.toggle('active', pill.dataset.mat === matKey); });

        /* Set values */
        outerDia = p.od;
        innerDia = p.type === 'hollow' ? p.id : 0;
        shaftLen = p.len;
        torque = p.torque;
        rpm = p.rpm;

        /* Update sliders */
        $('#od-slider').value = outerDia;
        $('#id-slider').value = innerDia;
        $('#id-slider').max = outerDia - 1;
        $('#len-slider').value = shaftLen;
        $('#torque-slider').value = torque;
        $('#rpm-slider').value = rpm;

        /* Active preset */
        $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        updateReadouts();
        draw();
      });
    });

    /* Explore category tabs */
    $$('#cat-tabs .pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        selCat = pill.dataset.cat;
        selConcept = 0;
        $$('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.cat === selCat); });
        buildConceptGrid();
        showConceptInfo();
        draw();
      });
    });

    /* Practice */
    $('#pp-check').addEventListener('click', checkPractice);
    $('#pp-next').addEventListener('click', function () {
      newPracticeProblem();
    });
    $('#pp-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        if (pAnswered) {
          newPracticeProblem();
        } else {
          checkPractice();
        }
      }
    });
  }

  function clearActivePreset() {
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
  }

  /* ================================================================
     CANVAS RESIZE HANDLER
     ================================================================ */
  function handleResize() {
    fitCanvas();
    var card = cvs.parentElement;
    if (!card) return;
    var cw = card.clientWidth - 16;
    if (cw < W) {
      cvs.style.width = cw + 'px';
    } else {
      cvs.style.width = '';
    }
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    bindEvents();
    handleResize();
    window.addEventListener('resize', handleResize);
    updateReadouts();
    running = true;
    animate();
  }

  /* Wait for DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
