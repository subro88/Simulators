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
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ================================================================
     DATA — MATERIALS
     ================================================================ */
  var MATERIALS = [
    { id: 'spring-steel',    name: 'Spring Steel',    G: 80000, yieldShear: 600, color: '#00c853' },
    { id: 'stainless',       name: 'Stainless Steel', G: 69000, yieldShear: 500, color: '#42a5f5' },
    { id: 'phosphor-bronze', name: 'Phosphor Bronze', G: 41000, yieldShear: 300, color: '#f5c842' }
  ];

  /* ================================================================
     DATA — CONCEPTS (12)
     ================================================================ */
  var CONCEPTS = [
    /* ── Spring Types ────────────────────────────────────────────── */
    {
      id: 'compression-spring', name: 'Compression Spring', symbol: 'Helical',
      formula: 'Resists axial compression', unit: '\u2014',
      cat: 'spring-types',
      desc: 'A helical compression spring is an open-coil spring that resists a compressive force applied along its axis. When loaded, the spring shortens. It is the most common spring type, found in valves, pens, automotive suspensions, and mattresses. The coils do not touch when unloaded (except for end coils), and the spring returns to its free length when the load is removed. Design parameters include wire diameter, mean coil diameter, number of active turns, and material shear modulus.',
      diagram: 'compressionSpring',
      example: { problem: 'A compression spring with d = 3 mm, D = 25 mm, n = 8, G = 80000 MPa is loaded with 100 N. Find the spring rate k.', steps: ['k = G \u00D7 d\u2074 / (8 \u00D7 D\u00B3 \u00D7 n)', 'k = 80000 \u00D7 3\u2074 / (8 \u00D7 25\u00B3 \u00D7 8)', 'k = 80000 \u00D7 81 / (8 \u00D7 15625 \u00D7 8)', 'k = 6480000 / 1000000', 'k = 6.48 N/mm'], answer: 6.48, unit: 'N/mm' }
    },
    {
      id: 'extension-spring', name: 'Extension Spring', symbol: 'Tension',
      formula: 'Resists axial tension', unit: '\u2014',
      cat: 'spring-types',
      desc: 'An extension spring (tension spring) is a helical spring with closed coils that resists a pulling force. The coils are wound tightly together so the spring has an initial tension that must be overcome before the coils begin to separate. Hooks or loops at each end provide attachment points. Extension springs are used in trampolines, garage doors, carburetors, and balance scales. The spring rate formula is the same as compression springs, but the initial tension adds a preload.',
      diagram: 'extensionSpring',
      example: { problem: 'An extension spring has k = 5 N/mm and initial tension F0 = 10 N. Find the total force at 8 mm extension.', steps: ['F_total = F0 + k \u00D7 \u03B4', 'F_total = 10 + 5 \u00D7 8', 'F_total = 10 + 40', 'F_total = 50 N'], answer: 50, unit: 'N' }
    },
    {
      id: 'torsion-spring', name: 'Torsion Spring', symbol: 'Torsion',
      formula: 'Resists angular rotation', unit: '\u2014',
      cat: 'spring-types',
      desc: 'A torsion spring is a helical spring that works by twisting about its axis. It stores energy when twisted and exerts a torque (moment) in the opposite direction. The legs of the spring extend radially to apply or receive the torque. Torsion springs are used in clothespins, mousetraps, hinges, and clipboard mechanisms. The spring rate is expressed in N\u00B7mm per degree (or radian). The key formula is M = E \u00D7 d\u2074 \u00D7 \u03B8 / (64 \u00D7 D \u00D7 n \u00D7 180/\u03C0).',
      diagram: 'torsionSpring',
      example: { problem: 'A torsion spring with rate 0.5 N\u00B7mm/deg is wound 45 degrees. Find the restoring torque.', steps: ['M = k_t \u00D7 \u03B8', 'M = 0.5 \u00D7 45', 'M = 22.5 N\u00B7mm'], answer: 22.5, unit: 'N\u00B7mm' }
    },

    /* ── Key Formulas ────────────────────────────────────────────── */
    {
      id: 'spring-stiffness', name: 'Spring Stiffness', symbol: 'k',
      formula: 'k = Gd\u2074 / (8D\u00B3n)', unit: 'N/mm',
      cat: 'key-formulas',
      desc: 'The spring stiffness (rate) k is the force per unit deflection. It depends on the shear modulus G of the wire material, the wire diameter d raised to the fourth power, the mean coil diameter D cubed in the denominator, and the number of active coils n. Increasing wire diameter dramatically increases stiffness, while increasing coil diameter or number of turns decreases it. This formula assumes close-coiled helical springs with small deflections.',
      diagram: 'stiffnessFormula',
      example: { problem: 'Find k for d = 4 mm, D = 30 mm, n = 6, G = 80000 MPa.', steps: ['k = G \u00D7 d\u2074 / (8 \u00D7 D\u00B3 \u00D7 n)', 'k = 80000 \u00D7 256 / (8 \u00D7 27000 \u00D7 6)', 'k = 20480000 / 1296000', 'k = 15.80 N/mm'], answer: 15.80, unit: 'N/mm' }
    },
    {
      id: 'wahl-factor', name: 'Wahl Factor', symbol: 'Kw',
      formula: 'Kw = (4C\u22121)/(4C\u22124) + 0.615/C', unit: '\u2014',
      cat: 'key-formulas',
      desc: 'The Wahl correction factor accounts for the stress concentration due to curvature of the wire and the direct shear component. It is always greater than 1 and increases as the spring index C decreases (tighter coils). The factor was derived by A.M. Wahl in 1963. For a spring index of 6, Kw is approximately 1.25. For C = 10, Kw is about 1.14. Using the Wahl factor ensures accurate stress predictions, especially critical for fatigue-loaded springs.',
      diagram: 'wahlFormula',
      example: { problem: 'A spring has D = 30 mm and d = 5 mm. Find the Wahl correction factor.', steps: ['C = D / d = 30 / 5 = 6', 'Kw = (4\u00D76 \u2212 1) / (4\u00D76 \u2212 4) + 0.615 / 6', 'Kw = 23 / 20 + 0.1025', 'Kw = 1.15 + 0.1025', 'Kw = 1.2525'], answer: 1.25, unit: '' }
    },
    {
      id: 'max-shear-stress', name: 'Max Shear Stress', symbol: '\u03C4',
      formula: '\u03C4 = Kw \u00D7 8FD / (\u03C0d\u00B3)', unit: 'MPa',
      cat: 'key-formulas',
      desc: 'The maximum shear stress in a helical spring wire occurs on the inner surface of the coil. The basic shear stress formula 8FD/(\u03C0d\u00B3) is multiplied by the Wahl correction factor Kw to account for curvature and direct shear effects. The stress must remain below the yield shear stress of the material to prevent permanent deformation. For fatigue applications, the endurance limit is typically 40\u201350% of the ultimate tensile strength.',
      diagram: 'shearStressFormula',
      example: { problem: 'F = 200 N, D = 30 mm, d = 4 mm, Kw = 1.18. Find max shear stress.', steps: ['\u03C4 = Kw \u00D7 8FD / (\u03C0d\u00B3)', '\u03C4 = 1.18 \u00D7 8 \u00D7 200 \u00D7 30 / (\u03C0 \u00D7 64)', '\u03C4 = 1.18 \u00D7 48000 / 201.06', '\u03C4 = 1.18 \u00D7 238.73', '\u03C4 = 281.70 MPa'], answer: 281.70, unit: 'MPa' }
    },
    {
      id: 'deflection-formula', name: 'Deflection', symbol: '\u03B4',
      formula: '\u03B4 = 8FD\u00B3n / (Gd\u2074)', unit: 'mm',
      cat: 'key-formulas',
      desc: 'The axial deflection of a helical compression spring under force F is given by \u03B4 = 8FD\u00B3n / (Gd\u2074), which is equivalent to \u03B4 = F / k. The deflection is directly proportional to the force and the cube of the coil diameter, and inversely proportional to the fourth power of the wire diameter and the shear modulus. The operating deflection must not bring the spring to its solid length during normal use.',
      diagram: 'deflectionFormula',
      example: { problem: 'F = 100 N, D = 20 mm, n = 10, d = 2 mm, G = 80000 MPa. Find deflection.', steps: ['\u03B4 = 8FD\u00B3n / (Gd\u2074)', '\u03B4 = 8 \u00D7 100 \u00D7 8000 \u00D7 10 / (80000 \u00D7 16)', '\u03B4 = 64000000 / 1280000', '\u03B4 = 50.0 mm'], answer: 50.0, unit: 'mm' }
    },
    {
      id: 'spring-index', name: 'Spring Index', symbol: 'C',
      formula: 'C = D / d', unit: '\u2014',
      cat: 'key-formulas',
      desc: 'The spring index C is the ratio of the mean coil diameter D to the wire diameter d. It is a dimensionless number that characterises the tightness of the coil. Recommended range: 4 \u2264 C \u2264 12. Springs with C < 4 are very stiff and difficult to manufacture. Springs with C > 12 are prone to buckling and tangling. The spring index directly affects the Wahl correction factor and thus the stress distribution in the wire.',
      diagram: 'springIndexDiag',
      example: { problem: 'D = 36 mm, d = 4 mm. Find the spring index and state if it is acceptable.', steps: ['C = D / d', 'C = 36 / 4', 'C = 9', 'Since 4 \u2264 9 \u2264 12, the spring index is in the recommended range.'], answer: 9, unit: '' }
    },

    /* ── Material Properties ─────────────────────────────────────── */
    {
      id: 'shear-modulus', name: 'Shear Modulus Comparison', symbol: 'G',
      formula: 'G (Spring Steel) = 80 GPa', unit: 'GPa',
      cat: 'material-props',
      desc: 'The shear modulus G (modulus of rigidity) is the material property relating shear stress to shear strain. It directly affects both the spring rate and deflection. Spring steel (ASTM A228, A229) has G \u2248 80 GPa, stainless steel (302/304) has G \u2248 69 GPa, and phosphor bronze has G \u2248 41 GPa. A higher G means a stiffer spring for the same geometry. Material selection depends on the operating environment: stainless for corrosion, phosphor bronze for electrical conductivity and non-magnetic requirements.',
      diagram: 'shearModulusDiag',
      example: { problem: 'Two identical springs differ only in material: one is spring steel (G=80 GPa) and one is phosphor bronze (G=41 GPa). If the steel spring has k = 10 N/mm, find k for the bronze spring.', steps: ['k is proportional to G (all else equal)', 'k_bronze = k_steel \u00D7 G_bronze / G_steel', 'k_bronze = 10 \u00D7 41000 / 80000', 'k_bronze = 5.13 N/mm'], answer: 5.13, unit: 'N/mm' }
    },
    {
      id: 'wire-types', name: 'Wire Types', symbol: 'Wire',
      formula: 'Music wire, Oil-tempered, etc.', unit: '\u2014',
      cat: 'material-props',
      desc: 'Common spring wire types include: Music wire (ASTM A228) \u2014 the highest quality and most widely used carbon steel wire for springs, cold-drawn with excellent surface finish. Oil-tempered wire (A229) \u2014 general purpose, lower cost. Chrome vanadium (A231) \u2014 good fatigue resistance, used in automotive valves. Chrome silicon (A401) \u2014 excellent shock loading resistance. Stainless 302/304 \u2014 good corrosion resistance. Inconel X-750 \u2014 for high-temperature applications up to 700\u00B0C.',
      diagram: 'wireTypesDiag',
      example: { problem: 'A music wire (ASTM A228) spring with d=2mm has tensile strength approx 1900 MPa. Estimate yield shear stress (factor 0.577).', steps: ['Yield shear \u2248 0.577 \u00D7 Tensile strength \u00D7 0.6', 'Yield shear \u2248 0.577 \u00D7 1900 \u00D7 0.6', 'Yield shear \u2248 657.8 MPa', 'Approximate yield shear \u2248 658 MPa'], answer: 658, unit: 'MPa' }
    },
    {
      id: 'surface-treatments', name: 'Surface Treatments', symbol: 'Finish',
      formula: 'Shot peening, coating, etc.', unit: '\u2014',
      cat: 'material-props',
      desc: 'Surface treatments improve spring performance and durability. Shot peening introduces compressive residual stresses on the wire surface, increasing fatigue life by 20\u201350%. Electroplating (zinc, cadmium, chromium) provides corrosion protection. Powder coating and epoxy coatings protect against chemicals. Stress relieving (heat treatment at 200\u2013350\u00B0C) after forming removes residual stresses from the coiling process. Setting (pre-stressing) permanently deforms the spring slightly to increase the elastic range.',
      diagram: 'surfaceTreatDiag',
      example: { problem: 'A spring has a fatigue life of 100,000 cycles without treatment. Shot peening increases life by 40%. Find new fatigue life.', steps: ['New life = Original \u00D7 (1 + improvement)', 'New life = 100000 \u00D7 1.40', 'New life = 140000 cycles'], answer: 140000, unit: 'cycles' }
    },
    {
      id: 'end-conditions', name: 'End Conditions', symbol: 'Ends',
      formula: 'Squared, ground, plain', unit: '\u2014',
      cat: 'material-props',
      desc: 'The end configuration of a compression spring affects its total number of coils, free length, solid length, and stability. The four common end types are: Plain ends \u2014 no modification, the wire is simply cut; the total coils equal active coils n. Plain-and-ground \u2014 the end is ground flat for better seating; total coils = n + 1. Squared (closed) ends \u2014 the last coil on each end is closed to touch the adjacent coil; total coils = n + 2. Squared-and-ground \u2014 closed ends that are also ground flat; total coils = n + 2. Squared-and-ground ends are the most common in industrial springs as they provide the best load distribution and stability.',
      diagram: 'endCondDiag',
      example: { problem: 'A spring with n = 8 active coils and d = 3 mm has squared-and-ground ends. Find total coils and solid length.', steps: ['Total coils N_t = n + 2 = 8 + 2 = 10', 'Solid length L_s = N_t \u00D7 d', 'L_s = 10 \u00D7 3 = 30 mm'], answer: 30, unit: 'mm' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 1 — Spring rate k */
    function () {
      var d = randInt(2, 6);
      var D = randInt(15, 50);
      var n = randInt(4, 15);
      var mat = MATERIALS[randInt(0, 2)];
      var G = mat.G;
      var k = G * Math.pow(d, 4) / (8 * Math.pow(D, 3) * n);
      return {
        prompt: 'A ' + mat.name + ' compression spring has wire diameter d = ' + d + ' mm, mean coil diameter D = ' + D + ' mm, and n = ' + n + ' active coils. G = ' + G + ' MPa. Calculate the spring rate k.',
        answer: roundN(k, 2),
        unit: 'N/mm',
        steps: [
          'k = G \u00D7 d\u2074 / (8 \u00D7 D\u00B3 \u00D7 n)',
          'k = ' + G + ' \u00D7 ' + d + '\u2074 / (8 \u00D7 ' + D + '\u00B3 \u00D7 ' + n + ')',
          'k = ' + G + ' \u00D7 ' + Math.pow(d, 4) + ' / (8 \u00D7 ' + Math.pow(D, 3) + ' \u00D7 ' + n + ')',
          'k = ' + (G * Math.pow(d, 4)) + ' / ' + (8 * Math.pow(D, 3) * n),
          'k = ' + roundN(k, 2) + ' N/mm'
        ]
      };
    },
    /* 2 — Deflection */
    function () {
      var d = randInt(2, 5);
      var D = randInt(15, 40);
      var n = randInt(4, 12);
      var F = randInt(20, 300);
      var G = MATERIALS[0].G;
      var delta = 8 * F * Math.pow(D, 3) * n / (G * Math.pow(d, 4));
      return {
        prompt: 'A spring steel spring (G = 80000 MPa) has d = ' + d + ' mm, D = ' + D + ' mm, n = ' + n + ' turns. Find the deflection under F = ' + F + ' N.',
        answer: roundN(delta, 2),
        unit: 'mm',
        steps: [
          '\u03B4 = 8FD\u00B3n / (Gd\u2074)',
          '\u03B4 = 8 \u00D7 ' + F + ' \u00D7 ' + D + '\u00B3 \u00D7 ' + n + ' / (80000 \u00D7 ' + d + '\u2074)',
          '\u03B4 = 8 \u00D7 ' + F + ' \u00D7 ' + Math.pow(D, 3) + ' \u00D7 ' + n + ' / (80000 \u00D7 ' + Math.pow(d, 4) + ')',
          '\u03B4 = ' + (8 * F * Math.pow(D, 3) * n) + ' / ' + (G * Math.pow(d, 4)),
          '\u03B4 = ' + roundN(delta, 2) + ' mm'
        ]
      };
    },
    /* 3 — Max shear stress */
    function () {
      var d = randInt(2, 6);
      var D = randInt(15, 45);
      var F = randInt(50, 400);
      var C = D / d;
      var Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
      var tau = Kw * 8 * F * D / (Math.PI * Math.pow(d, 3));
      return {
        prompt: 'A spring has d = ' + d + ' mm, D = ' + D + ' mm. Force F = ' + F + ' N. Calculate the maximum shear stress using the Wahl correction.',
        answer: roundN(tau, 1),
        unit: 'MPa',
        steps: [
          'C = D / d = ' + D + ' / ' + d + ' = ' + roundN(C, 2),
          'Kw = (4C\u22121)/(4C\u22124) + 0.615/C = ' + roundN(Kw, 4),
          '\u03C4 = Kw \u00D7 8FD / (\u03C0d\u00B3)',
          '\u03C4 = ' + roundN(Kw, 4) + ' \u00D7 8 \u00D7 ' + F + ' \u00D7 ' + D + ' / (\u03C0 \u00D7 ' + Math.pow(d, 3) + ')',
          '\u03C4 = ' + roundN(tau, 1) + ' MPa'
        ]
      };
    },
    /* 4 — Spring index */
    function () {
      var d = randInt(1, 8);
      var D = randInt(d * 3, d * 14);
      var C = D / d;
      var acceptable = (C >= 4 && C <= 12) ? 'Yes, within recommended range (4\u201312).' : 'No, outside recommended range (4\u201312).';
      return {
        prompt: 'A spring has mean coil diameter D = ' + D + ' mm and wire diameter d = ' + d + ' mm. Find the spring index C and state whether it is acceptable.',
        answer: roundN(C, 2),
        unit: '',
        steps: [
          'C = D / d',
          'C = ' + D + ' / ' + d,
          'C = ' + roundN(C, 2),
          acceptable
        ]
      };
    },
    /* 5 — Wahl factor */
    function () {
      var d = randInt(2, 6);
      var D = d * randInt(4, 10);
      var C = D / d;
      var Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
      return {
        prompt: 'A spring has d = ' + d + ' mm and D = ' + D + ' mm. Calculate the Wahl correction factor Kw.',
        answer: roundN(Kw, 3),
        unit: '',
        steps: [
          'C = D / d = ' + D + ' / ' + d + ' = ' + roundN(C, 2),
          'Kw = (4C \u2212 1) / (4C \u2212 4) + 0.615 / C',
          'Kw = (' + roundN(4 * C - 1, 1) + ') / (' + roundN(4 * C - 4, 1) + ') + 0.615 / ' + roundN(C, 2),
          'Kw = ' + roundN((4 * C - 1) / (4 * C - 4), 4) + ' + ' + roundN(0.615 / C, 4),
          'Kw = ' + roundN(Kw, 3)
        ]
      };
    },
    /* 6 — Free length */
    function () {
      var d = randInt(2, 5);
      var n = randInt(4, 12);
      var Nt = n + 2;
      var pitch = d * (1 + randFloat(0.5, 2));
      pitch = roundN(pitch, 1);
      var Lf = Nt * d + n * (pitch - d);
      Lf = roundN(Lf, 1);
      return {
        prompt: 'A compression spring has d = ' + d + ' mm, n = ' + n + ' active coils, squared-and-ground ends (N_t = n+2), and coil pitch p = ' + pitch + ' mm. Find the free length.',
        answer: roundN(Lf, 1),
        unit: 'mm',
        steps: [
          'Total coils N_t = n + 2 = ' + n + ' + 2 = ' + Nt,
          'Free length L_f = N_t \u00D7 d + n \u00D7 (p \u2212 d)',
          'L_f = ' + Nt + ' \u00D7 ' + d + ' + ' + n + ' \u00D7 (' + pitch + ' \u2212 ' + d + ')',
          'L_f = ' + (Nt * d) + ' + ' + roundN(n * (pitch - d), 1),
          'L_f = ' + roundN(Lf, 1) + ' mm'
        ]
      };
    },
    /* 7 — Solid length */
    function () {
      var d = randInt(1, 6);
      var n = randInt(3, 15);
      var Nt = n + 2;
      var Ls = Nt * d;
      return {
        prompt: 'A spring with d = ' + d + ' mm, n = ' + n + ' active coils, squared-and-ground ends. Find the solid length L_s.',
        answer: Ls,
        unit: 'mm',
        steps: [
          'For squared-and-ground ends: Total coils N_t = n + 2',
          'N_t = ' + n + ' + 2 = ' + Nt,
          'Solid length L_s = N_t \u00D7 d',
          'L_s = ' + Nt + ' \u00D7 ' + d,
          'L_s = ' + Ls + ' mm'
        ]
      };
    },
    /* 8 — Required wire diameter for given k */
    function () {
      var k = randInt(5, 50);
      var D = randInt(15, 40);
      var n = randInt(4, 10);
      var G = 80000;
      // k = Gd^4 / (8D^3 n) => d^4 = 8kD^3n/G => d = (8kD^3n/G)^0.25
      var d4 = 8 * k * Math.pow(D, 3) * n / G;
      var d = Math.pow(d4, 0.25);
      return {
        prompt: 'A spring steel (G = 80000 MPa) spring must have k = ' + k + ' N/mm, D = ' + D + ' mm, n = ' + n + '. Find the required wire diameter d.',
        answer: roundN(d, 2),
        unit: 'mm',
        steps: [
          'From k = Gd\u2074 / (8D\u00B3n):',
          'd\u2074 = 8kD\u00B3n / G',
          'd\u2074 = 8 \u00D7 ' + k + ' \u00D7 ' + Math.pow(D, 3) + ' \u00D7 ' + n + ' / 80000',
          'd\u2074 = ' + roundN(d4, 2),
          'd = (' + roundN(d4, 2) + ')^0.25 = ' + roundN(d, 2) + ' mm'
        ]
      };
    },
    /* 9 — Number of turns needed */
    function () {
      var k = randInt(5, 40);
      var d = randInt(2, 5);
      var D = randInt(15, 40);
      var G = 80000;
      // n = Gd^4 / (8kD^3)
      var n = G * Math.pow(d, 4) / (8 * k * Math.pow(D, 3));
      return {
        prompt: 'A spring steel spring needs k = ' + k + ' N/mm with d = ' + d + ' mm, D = ' + D + ' mm. How many active coils are required? (Round up to next integer.)',
        answer: Math.ceil(n),
        unit: 'coils',
        steps: [
          'From k = Gd\u2074 / (8D\u00B3n):',
          'n = Gd\u2074 / (8kD\u00B3)',
          'n = 80000 \u00D7 ' + Math.pow(d, 4) + ' / (8 \u00D7 ' + k + ' \u00D7 ' + Math.pow(D, 3) + ')',
          'n = ' + roundN(n, 2),
          'Round up: n = ' + Math.ceil(n) + ' coils'
        ]
      };
    },
    /* 10 — Safety factor */
    function () {
      var d = randInt(2, 5);
      var D = randInt(15, 40);
      var F = randInt(50, 300);
      var matIdx = randInt(0, 2);
      var mat = MATERIALS[matIdx];
      var C = D / d;
      var Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
      var tau = Kw * 8 * F * D / (Math.PI * Math.pow(d, 3));
      var sf = mat.yieldShear / tau;
      return {
        prompt: 'A ' + mat.name + ' spring (yield shear = ' + mat.yieldShear + ' MPa) has d = ' + d + ' mm, D = ' + D + ' mm, F = ' + F + ' N. Find the safety factor.',
        answer: roundN(sf, 2),
        unit: '',
        steps: [
          'C = D/d = ' + D + '/' + d + ' = ' + roundN(C, 2),
          'Kw = (4C\u22121)/(4C\u22124) + 0.615/C = ' + roundN(Kw, 4),
          '\u03C4 = Kw \u00D7 8FD / (\u03C0d\u00B3) = ' + roundN(tau, 1) + ' MPa',
          'Safety Factor = \u03C4_yield / \u03C4 = ' + mat.yieldShear + ' / ' + roundN(tau, 1),
          'SF = ' + roundN(sf, 2)
        ]
      };
    },
    /* 11 — Force for given deflection */
    function () {
      var d = randInt(2, 5);
      var D = randInt(15, 35);
      var n = randInt(4, 12);
      var G = 80000;
      var k = G * Math.pow(d, 4) / (8 * Math.pow(D, 3) * n);
      var delta = randInt(5, 30);
      var F = k * delta;
      return {
        prompt: 'A spring steel spring has d = ' + d + ' mm, D = ' + D + ' mm, n = ' + n + '. Find the force required for \u03B4 = ' + delta + ' mm deflection.',
        answer: roundN(F, 1),
        unit: 'N',
        steps: [
          'k = Gd\u2074 / (8D\u00B3n)',
          'k = 80000 \u00D7 ' + Math.pow(d, 4) + ' / (8 \u00D7 ' + Math.pow(D, 3) + ' \u00D7 ' + n + ')',
          'k = ' + roundN(k, 3) + ' N/mm',
          'F = k \u00D7 \u03B4 = ' + roundN(k, 3) + ' \u00D7 ' + delta,
          'F = ' + roundN(F, 1) + ' N'
        ]
      };
    },
    /* 12 — Energy stored */
    function () {
      var k = randInt(5, 30);
      var delta = randInt(5, 25);
      var U = 0.5 * k * delta * delta;
      return {
        prompt: 'A spring has rate k = ' + k + ' N/mm and is compressed by \u03B4 = ' + delta + ' mm. Calculate the stored elastic energy.',
        answer: roundN(U, 1),
        unit: 'N\u00B7mm',
        steps: [
          'U = \u00BD k \u03B4\u00B2',
          'U = 0.5 \u00D7 ' + k + ' \u00D7 ' + delta + '\u00B2',
          'U = 0.5 \u00D7 ' + k + ' \u00D7 ' + (delta * delta),
          'U = ' + roundN(U, 1) + ' N\u00B7mm'
        ]
      };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15)
     ================================================================ */
  var QUIZ_POOL = [
    /* MCQ: Spring type identification */
    { type: 'mcq', prompt: 'Which spring type stores energy by being compressed axially?', options: ['Compression spring', 'Extension spring', 'Torsion spring', 'Leaf spring'], correct: 0 },
    { type: 'mcq', prompt: 'Which spring type uses hooks or loops at the ends and resists pulling?', options: ['Compression spring', 'Extension spring', 'Torsion spring', 'Belleville spring'], correct: 1 },
    { type: 'mcq', prompt: 'A clothespin uses which type of spring?', options: ['Compression', 'Extension', 'Torsion', 'Constant force'], correct: 2 },
    /* MCQ: Material selection */
    { type: 'mcq', prompt: 'Which material has the highest shear modulus (G) for spring design?', options: ['Spring steel (~80 GPa)', 'Stainless steel (~69 GPa)', 'Phosphor bronze (~41 GPa)', 'Aluminium (~26 GPa)'], correct: 0 },
    { type: 'mcq', prompt: 'For a corrosive environment, which spring material is most suitable?', options: ['Spring steel', 'Stainless steel', 'Phosphor bronze', 'Cast iron'], correct: 1 },
    /* MCQ: Formula identification */
    { type: 'mcq', prompt: 'The Wahl correction factor accounts for:', options: ['Wire curvature and direct shear', 'Temperature effects', 'Material fatigue', 'End coil friction'], correct: 0 },
    { type: 'mcq', prompt: 'In the spring rate formula k = Gd\u2074/(8D\u00B3n), which variable has the greatest effect on stiffness?', options: ['Wire diameter d', 'Coil diameter D', 'Active coils n', 'Shear modulus G'], correct: 0 },
    { type: 'mcq', prompt: 'The recommended range for spring index C is:', options: ['1 to 3', '4 to 12', '15 to 25', '30 to 50'], correct: 1 },
    /* Numeric: Calculate k */
    {
      type: 'numeric', prompt: 'A spring steel spring (G = 80000 MPa) has d = 4 mm, D = 32 mm, n = 6. Calculate k (N/mm).',
      answer: roundN(80000 * Math.pow(4, 4) / (8 * Math.pow(32, 3) * 6), 2), unit: 'N/mm'
    },
    /* Numeric: Calculate deflection */
    {
      type: 'numeric', prompt: 'A spring has k = 12 N/mm. Under F = 180 N, find the deflection in mm.',
      answer: 15, unit: 'mm'
    },
    /* Numeric: Calculate spring index */
    {
      type: 'numeric', prompt: 'D = 40 mm, d = 5 mm. What is the spring index C?',
      answer: 8, unit: ''
    },
    /* Numeric: Solid length */
    {
      type: 'numeric', prompt: 'A spring with d = 3 mm, n = 10, squared-and-ground ends. Find the solid length (mm).',
      answer: 36, unit: 'mm'
    },
    /* Numeric: Stress */
    {
      type: 'numeric', prompt: 'A spring has C = 8. Calculate the Wahl factor Kw (to 2 decimal places).',
      answer: roundN((4 * 8 - 1) / (4 * 8 - 4) + 0.615 / 8, 2), unit: ''
    },
    /* Numeric: Energy */
    {
      type: 'numeric', prompt: 'A spring with k = 20 N/mm is compressed 10 mm. How much energy (N\u00B7mm) is stored?',
      answer: 1000, unit: 'N\u00B7mm'
    },
    /* MCQ: End conditions */
    { type: 'mcq', prompt: 'For squared-and-ground ends, total coils N_t equals:', options: ['n', 'n + 1', 'n + 2', 'n + 3'], correct: 2 }
  ];

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var matIdx = 0;
  var activeCat = 'spring-types';
  var selConceptIdx = -1;

  /* Simulation state */
  var sim = { d: 3, D: 25, n: 8, F: 100 };
  var animDeflection = 0;   // smoothed deflection for animation
  var targetDeflection = 0;
  var animRAF = null;

  /* Practice state */
  var pProblem = null, pAnswered = false, pScore = 0, pTotal = 0;

  /* Quiz state */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* Canvas */
  var canvas = $('#sim-canvas');
  var ctx = canvas.getContext('2d');
  /* Logical drawing space stays 900x480 — every draw call below is written in
     these units and none of them change. */
  var W = 900, H = 480;

  /* The canvas carried fixed width/height attributes of 900x480 while the CSS
     stretches it to the card width, so on a 2x display it was presenting a 900px
     bitmap across ~1924 device pixels — a 2.14x upscale, and visibly soft.
     Size the backing store to the real device pixels instead and scale the
     context so the 900x480 coordinate system still maps onto the whole canvas.
     The 900:480 aspect is preserved, so the CSS `height:auto` layout is
     unchanged. There is no canvas pointer interaction in this tool, so there is
     no hit-test that needs to move in lockstep. */
  function fitCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var displayW = canvas.getBoundingClientRect().width;
    if (!(displayW > 40)) displayW = W;          // never size off a pre-layout measurement
    var displayH = displayW * (H / W);
    canvas.width  = Math.round(displayW * dpr);
    canvas.height = Math.round(displayH * dpr);
    var scale = (displayW * dpr) / W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  /* ================================================================
     SPRING FORMULAS
     ================================================================ */
  function calcSpring(d, D, n, F, mat) {
    var G = mat.G;
    var yieldShear = mat.yieldShear;
    var C = D / d;
    var Kw = (4 * C - 1) / (4 * C - 4) + 0.615 / C;
    var k = G * Math.pow(d, 4) / (8 * Math.pow(D, 3) * n);
    var delta = (k > 0) ? F / k : 0;
    var tau = Kw * 8 * F * D / (Math.PI * Math.pow(d, 3));
    var Nt = n + 2; // squared-and-ground ends
    var solidLen = Nt * d;
    var pitch = d + (D * 0.35); // reasonable approximation for pitch
    var freeLen = solidLen + n * (pitch - d);
    if (freeLen < solidLen) freeLen = solidLen + n * d * 0.3;
    var sf = (tau > 0) ? yieldShear / tau : 999;
    return {
      C: C, Kw: Kw, k: k, delta: delta, tau: tau,
      solidLen: solidLen, freeLen: freeLen, sf: sf,
      Nt: Nt, pitch: pitch
    };
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    var mat = MATERIALS[matIdx];
    var r = calcSpring(sim.d, sim.D, sim.n, sim.F, mat);

    // Badge readouts
    $('#rb-k').textContent = roundN(r.k, 2) + ' N/mm';
    $('#rb-tau').textContent = roundN(r.tau, 1) + ' MPa';
    $('#rb-delta').textContent = roundN(r.delta, 2) + ' mm';
    $('#rb-C').textContent = roundN(r.C, 2);

    // Card readouts
    $('#r-k').textContent = roundN(r.k, 3);
    $('#r-tau').textContent = roundN(r.tau, 1);
    $('#r-delta').textContent = roundN(r.delta, 2);
    $('#r-C').textContent = roundN(r.C, 2);
    $('#r-Lf').textContent = roundN(r.freeLen, 1);
    $('#r-Ls').textContent = roundN(r.solidLen, 1);
    $('#r-Kw').textContent = roundN(r.Kw, 4);
    $('#r-SF').textContent = roundN(r.sf, 2);

    // Update slider value labels
    $('#d-val').textContent = sim.d.toFixed(1) + ' mm';
    $('#D-val').textContent = sim.D.toFixed(1) + ' mm';
    $('#n-val').textContent = sim.n;
    $('#F-val').textContent = sim.F + ' N';

    // Animation target
    targetDeflection = r.delta;
  }

  /* ================================================================
     CANVAS DRAWING
     ================================================================ */
  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(42,48,80,0.3)';
    ctx.lineWidth = 1;
    var step = 40;
    for (var x = step; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = step; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawSpringCoils(cx, topY, bottomY, coilRadius, wireRadius, numCoils, accentColor) {
    var coilH = bottomY - topY;
    var segH = coilH / numCoils;

    /* Draw each coil as a sine wave */
    ctx.save();
    ctx.lineWidth = wireRadius * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* Gradient on wire */
    var grad = ctx.createLinearGradient(cx - coilRadius, 0, cx + coilRadius, 0);
    grad.addColorStop(0, accentColor);
    grad.addColorStop(0.4, '#69f0ae');
    grad.addColorStop(0.6, '#69f0ae');
    grad.addColorStop(1, accentColor);
    ctx.strokeStyle = grad;

    ctx.beginPath();
    var pts = numCoils * 40; // points per spring
    for (var i = 0; i <= pts; i++) {
      var t = i / pts;
      var y = topY + t * coilH;
      var x = cx + Math.sin(t * numCoils * 2 * Math.PI) * coilRadius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* Draw shadow/depth effect */
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = wireRadius * 2.5;
    ctx.beginPath();
    for (var i2 = 0; i2 <= pts; i2++) {
      var t2 = i2 / pts;
      var y2 = topY + t2 * coilH + 1.5;
      var x2 = cx + Math.sin(t2 * numCoils * 2 * Math.PI) * coilRadius + 1.5;
      if (i2 === 0) ctx.moveTo(x2, y2);
      else ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawPlate(x, y, w, h, isFixed) {
    ctx.save();
    ctx.fillStyle = '#2a3050';
    ctx.strokeStyle = '#3a4568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    if (isFixed) {
      /* Hatching for fixed support */
      ctx.strokeStyle = '#4a5578';
      ctx.lineWidth = 1;
      for (var hx = x - w / 2 + 8; hx < x + w / 2; hx += 10) {
        ctx.beginPath();
        ctx.moveTo(hx, y);
        ctx.lineTo(hx - 6, y + h);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawArrow(x1, y1, x2, y2, color, label, labelSide) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    /* Arrowhead */
    var angle = Math.atan2(y2 - y1, x2 - x1);
    var headLen = 10;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();

    /* Label */
    if (label) {
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = labelSide === 'left' ? 'right' : 'left';
      ctx.textBaseline = 'middle';
      var lx = labelSide === 'left' ? Math.min(x1, x2) - 8 : Math.max(x1, x2) + 8;
      var ly = (y1 + y2) / 2;
      ctx.fillText(label, lx, ly);
    }
    ctx.restore();
  }

  function drawDimensionLine(x1, y1, x2, y2, color, label, offset) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);

    var ox = offset || 0;

    /* Vertical extension lines */
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + ox, y1);
    ctx.moveTo(x2, y2); ctx.lineTo(x2 + ox, y2);
    ctx.stroke();

    ctx.setLineDash([]);
    /* Dimension line */
    var dx = x1 + ox, dy1 = y1, dy2 = y2;
    ctx.beginPath(); ctx.moveTo(dx, dy1); ctx.lineTo(dx, dy2); ctx.stroke();

    /* Arrowheads */
    var hl = 6;
    ctx.beginPath();
    ctx.moveTo(dx, dy1); ctx.lineTo(dx - 3, dy1 + hl); ctx.lineTo(dx + 3, dy1 + hl); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(dx, dy2); ctx.lineTo(dx - 3, dy2 - hl); ctx.lineTo(dx + 3, dy2 - hl); ctx.closePath(); ctx.fill();

    /* Label */
    if (label) {
      ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, dx + 6, (dy1 + dy2) / 2);
    }
    ctx.restore();
  }

  function drawHorizDimensionLine(x1, x2, y, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);

    /* Vertical extension lines */
    ctx.beginPath();
    ctx.moveTo(x1, y - 10); ctx.lineTo(x1, y + 10);
    ctx.moveTo(x2, y - 10); ctx.lineTo(x2, y + 10);
    ctx.stroke();

    ctx.setLineDash([]);
    /* Line */
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();

    /* Arrowheads */
    var hl = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y); ctx.lineTo(x1 + hl, y - 3); ctx.lineTo(x1 + hl, y + 3); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x2, y); ctx.lineTo(x2 - hl, y - 3); ctx.lineTo(x2 - hl, y + 3); ctx.closePath(); ctx.fill();

    /* Label */
    if (label) {
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, (x1 + x2) / 2, y - 6);
    }
    ctx.restore();
  }

  /* Main draw for Simulate mode */
  function drawSimulate() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();

    var mat = MATERIALS[matIdx];
    var r = calcSpring(sim.d, sim.D, sim.n, sim.F, mat);

    /* Layout constants */
    var springCX = W * 0.38;
    var plateW = 180;
    var plateH = 14;
    var topPlateY = 40;
    var bottomPlateBaseY = H - 80;

    /* Scale deflection for visual purposes */
    var maxVisualDefl = 160;
    var freeVisualLen = 280;
    var visualDefl = clamp(animDeflection / Math.max(r.freeLen - r.solidLen, 1) * maxVisualDefl, 0, maxVisualDefl);
    var currentVisualLen = freeVisualLen - visualDefl;
    if (currentVisualLen < 40) currentVisualLen = 40;

    var springTop = topPlateY + plateH;
    var springBottom = springTop + currentVisualLen;

    /* Wire radius for visual (scaled) */
    var wireVis = clamp(sim.d * 1.5, 2, 12);
    /* Coil radius for visual (scaled) */
    var coilVis = clamp(sim.D * 1.8, 20, 120);

    /* Draw fixed plate (top) */
    drawPlate(springCX, topPlateY, plateW, plateH, true);

    /* Draw spring coils */
    drawSpringCoils(springCX, springTop, springBottom, coilVis / 2, wireVis, sim.n, mat.color || '#00c853');

    /* Draw load plate (bottom, moves with deflection) */
    drawPlate(springCX, springBottom, plateW, plateH, false);

    /* Force arrow */
    if (sim.F > 0) {
      drawArrow(springCX, springBottom + plateH + 5, springCX, springBottom + plateH + 55, '#3ddc84', 'F = ' + sim.F + ' N', 'right');
    }

    /* Dimension annotations — right side */
    var dimX = springCX + coilVis / 2 + 50;

    /* Free length dimension (dashed, lighter) */
    ctx.save();
    ctx.globalAlpha = 0.4;
    drawDimensionLine(dimX + 50, springTop, dimX + 50, springTop + freeVisualLen, '#6b7a99', 'L\u2080 = ' + roundN(r.freeLen, 1) + ' mm', 0);
    ctx.restore();

    /* Current length dimension */
    drawDimensionLine(dimX, springTop, dimX, springBottom, '#f5c842', '\u03B4 = ' + roundN(animDeflection, 1) + ' mm offset', 0);

    /* Coil diameter D — horizontal dimension */
    drawHorizDimensionLine(springCX - coilVis / 2, springCX + coilVis / 2, springBottom + plateH + 75, '#42a5f5', 'D = ' + sim.D + ' mm');

    /* Wire diameter d — small circle annotation */
    var wireAnnotX = springCX - coilVis / 2 - 40;
    var wireAnnotY = (springTop + springBottom) / 2;
    ctx.save();
    ctx.strokeStyle = '#69f0ae';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wireAnnotX, wireAnnotY, wireVis * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wireAnnotX - wireVis * 2, wireAnnotY);
    ctx.lineTo(wireAnnotX + wireVis * 2, wireAnnotY);
    ctx.stroke();
    ctx.fillStyle = '#69f0ae';
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('d = ' + sim.d.toFixed(1) + ' mm', wireAnnotX, wireAnnotY + wireVis * 2 + 4);
    ctx.restore();

    /* Info panel on right side */
    var infoX = W * 0.68;
    var infoY = 60;
    ctx.save();
    ctx.fillStyle = 'rgba(22,27,39,0.85)';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(infoX - 10, infoY - 10, 260, 340, 10);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#00c853';
    ctx.textAlign = 'left';
    ctx.fillText('Spring Parameters', infoX, infoY + 6);

    var lines = [
      { label: 'Material', value: mat.name, color: mat.color || '#00c853' },
      { label: 'Wire Dia (d)', value: sim.d.toFixed(1) + ' mm', color: '#69f0ae' },
      { label: 'Coil Dia (D)', value: sim.D.toFixed(1) + ' mm', color: '#42a5f5' },
      { label: 'Active Turns (n)', value: '' + sim.n, color: '#dde3f0' },
      { label: 'Force (F)', value: sim.F + ' N', color: '#3ddc84' },
      { label: '', value: '', color: '' },
      { label: 'Spring Rate (k)', value: roundN(r.k, 3) + ' N/mm', color: '#00c853' },
      { label: 'Max Stress (\u03C4)', value: roundN(r.tau, 1) + ' MPa', color: r.tau > mat.yieldShear ? '#ff5555' : '#f5c842' },
      { label: 'Deflection (\u03B4)', value: roundN(r.delta, 2) + ' mm', color: '#f5c842' },
      { label: 'Spring Index (C)', value: roundN(r.C, 2), color: r.C < 4 || r.C > 12 ? '#ff5555' : '#3ddc84' },
      { label: 'Wahl Factor (Kw)', value: roundN(r.Kw, 4), color: '#dde3f0' },
      { label: 'Safety Factor', value: roundN(r.sf, 2), color: r.sf < 1 ? '#ff5555' : r.sf < 1.5 ? '#f5c842' : '#3ddc84' }
    ];

    var lineY = infoY + 30;
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    for (var li = 0; li < lines.length; li++) {
      if (!lines[li].label) { lineY += 8; continue; }
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'left';
      ctx.fillText(lines[li].label, infoX, lineY);
      ctx.fillStyle = lines[li].color;
      ctx.font = 'bold 13px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('' + lines[li].value, infoX + 240, lineY);
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      lineY += 24;
    }

    /* Warning badges */
    if (r.C < 4) {
      drawWarning(infoX, lineY + 10, 'C < 4: Hard to manufacture!');
    } else if (r.C > 12) {
      drawWarning(infoX, lineY + 10, 'C > 12: Prone to tangling!');
    }
    if (r.sf < 1) {
      drawWarning(infoX, lineY + 30, 'SF < 1: SPRING WILL FAIL!');
    } else if (r.sf < 1.2) {
      drawWarning(infoX, lineY + 30, 'SF < 1.2: Marginal safety');
    }
    ctx.restore();
  }

  function drawWarning(x, y, text) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,85,85,0.15)';
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 4, y - 10, 248, 22, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('\u26A0 ' + text, x + 4, y + 4);
    ctx.restore();
  }

  /* ================================================================
     EXPLORE MODE DRAWING
     ================================================================ */
  function drawExplore() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();

    if (selConceptIdx < 0 || selConceptIdx >= CONCEPTS.length) {
      drawCenteredText('Select a concept to see its diagram', '#6b7a99');
      return;
    }

    var c = CONCEPTS[selConceptIdx];
    switch (c.diagram) {
      case 'compressionSpring': drawExploreCompression(); break;
      case 'extensionSpring': drawExploreExtension(); break;
      case 'torsionSpring': drawExploreTorsion(); break;
      case 'stiffnessFormula': drawExploreStiffness(); break;
      case 'wahlFormula': drawExploreWahl(); break;
      case 'shearStressFormula': drawExploreShearStress(); break;
      case 'deflectionFormula': drawExploreDeflection(); break;
      case 'springIndexDiag': drawExploreSpringIndex(); break;
      case 'shearModulusDiag': drawExploreShearModulus(); break;
      case 'wireTypesDiag': drawExploreWireTypes(); break;
      case 'surfaceTreatDiag': drawExploreSurface(); break;
      case 'endCondDiag': drawExploreEndCond(); break;
      default: drawCenteredText(c.name, '#00c853');
    }
  }

  function drawCenteredText(text, color) {
    ctx.save();
    ctx.fillStyle = color || '#6b7a99';
    ctx.font = 'bold 20px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2);
    ctx.restore();
  }

  function drawTitle(text) {
    ctx.save();
    ctx.fillStyle = '#00c853';
    ctx.font = 'bold 18px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, 30);
    ctx.restore();
  }

  function drawExploreCompression() {
    drawTitle('Compression Spring');
    /* Draw a compression spring being compressed */
    var cx = W / 3;
    /* Uncompressed */
    drawPlate(cx, 55, 140, 10, true);
    drawSpringCoils(cx, 65, 300, 50, 5, 8, '#00c853');
    drawPlate(cx, 300, 140, 10, false);
    ctx.save();
    ctx.fillStyle = '#6b7a99';
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Free Length (unloaded)', cx, 340);
    ctx.restore();

    /* Compressed */
    var cx2 = W * 2 / 3;
    drawPlate(cx2, 55, 140, 10, true);
    drawSpringCoils(cx2, 65, 220, 50, 5, 8, '#f5c842');
    drawPlate(cx2, 220, 140, 10, false);
    drawArrow(cx2, 240, cx2, 290, '#3ddc84', 'F', 'right');
    ctx.save();
    ctx.fillStyle = '#6b7a99';
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Compressed (loaded)', cx2, 340);
    ctx.restore();

    /* Formula */
    ctx.save();
    ctx.fillStyle = '#00c853';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('F = k \u00D7 \u03B4', W / 2, H - 60);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Axial compression stores elastic energy', W / 2, H - 35);
    ctx.restore();
  }

  function drawExploreExtension() {
    drawTitle('Extension Spring');
    var cx = W / 2;
    drawPlate(cx, 50, 120, 10, true);

    /* Tightly wound coils */
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#42a5f5';
    ctx.lineCap = 'round';
    ctx.beginPath();
    var pts = 200;
    for (var i = 0; i <= pts; i++) {
      var t = i / pts;
      var y = 65 + t * 260;
      var x = cx + Math.sin(t * 10 * 2 * Math.PI) * 40;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    /* Hooks at top and bottom */
    ctx.save();
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx + 20, 60, 10, Math.PI, 0, false);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 20, 330, 10, 0, Math.PI, false);
    ctx.stroke();
    ctx.restore();

    drawArrow(cx, 345, cx, 400, '#3ddc84', 'F (tension)', 'right');

    ctx.save();
    ctx.fillStyle = '#42a5f5';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('F = F\u2080 + k \u00D7 \u03B4', W / 2, H - 40);
    ctx.restore();
  }

  function drawExploreTorsion() {
    drawTitle('Torsion Spring');
    var cx = W / 2, cy = H / 2;

    /* Draw coil body */
    ctx.save();
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 5;
    ctx.beginPath();
    var r = 50;
    for (var a = 0; a < 6 * Math.PI; a += 0.05) {
      var rr = r + a * 0.5;
      var x = cx + Math.cos(a) * rr * 0.6;
      var y = cy + Math.sin(a) * rr * 0.6;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    /* Legs */
    ctx.save();
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 50, cy);
    ctx.lineTo(cx + 120, cy - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 50, cy + 10);
    ctx.lineTo(cx + 120, cy + 60);
    ctx.stroke();
    ctx.restore();

    /* Rotation arrow */
    ctx.save();
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 90, -0.5, 0.8);
    ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath();
    var ax = cx + 90 * Math.cos(0.8);
    var ay = cy + 90 * Math.sin(0.8);
    ctx.moveTo(ax + 5, ay - 8);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax - 8, ay - 5);
    ctx.fill();
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('\u03B8', cx + 100, cy + 10);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('M = k_t \u00D7 \u03B8', W / 2, H - 40);
    ctx.restore();
  }

  function drawExploreStiffness() {
    drawTitle('Spring Stiffness: k = Gd\u2074 / (8D\u00B3n)');
    /* Show effect of changing d vs D */
    var labels = ['Small d, Large D\n(Soft)', 'Medium d, D\n(Medium)', 'Large d, Small D\n(Stiff)'];
    var configs = [
      { d: 2, D: 50, n: 8, coilR: 55, wireR: 2 },
      { d: 4, D: 30, n: 8, coilR: 40, wireR: 4 },
      { d: 8, D: 15, n: 8, coilR: 25, wireR: 8 }
    ];
    for (var i = 0; i < 3; i++) {
      var cx = W * (i + 1) / 4;
      drawPlate(cx, 80, 130, 8, true);
      drawSpringCoils(cx, 88, 320, configs[i].coilR, configs[i].wireR, configs[i].n, i === 0 ? '#42a5f5' : i === 1 ? '#00c853' : '#f5c842');
      drawPlate(cx, 320, 130, 8, false);

      ctx.save();
      ctx.fillStyle = '#dde3f0';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      var ll = labels[i].split('\n');
      for (var j = 0; j < ll.length; j++) {
        ctx.fillText(ll[j], cx, 355 + j * 16);
      }
      ctx.restore();
    }

    ctx.save();
    ctx.fillStyle = '#00c853';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('k = Gd\u2074 / (8D\u00B3n)  \u2014  d has strongest effect (4th power)', W / 2, H - 30);
    ctx.restore();
  }

  function drawExploreWahl() {
    drawTitle('Wahl Correction Factor: Kw = (4C\u22121)/(4C\u22124) + 0.615/C');
    /* Plot Kw vs C */
    var plotX = 120, plotY = 70, plotW = W - 240, plotH = 300;

    ctx.save();
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(plotX, plotY, plotW, plotH);

    /* Axes */
    ctx.strokeStyle = '#6b7a99';
    ctx.beginPath();
    ctx.moveTo(plotX, plotY + plotH);
    ctx.lineTo(plotX + plotW, plotY + plotH);
    ctx.moveTo(plotX, plotY);
    ctx.lineTo(plotX, plotY + plotH);
    ctx.stroke();

    /* Plot Kw curve from C=2 to C=16 */
    ctx.strokeStyle = '#00c853';
    ctx.lineWidth = 3;
    ctx.beginPath();
    var cMin = 2, cMax = 16;
    var kwMin = 1, kwMax = 2;
    for (var c = cMin; c <= cMax; c += 0.1) {
      var kw = (4 * c - 1) / (4 * c - 4) + 0.615 / c;
      var px = plotX + (c - cMin) / (cMax - cMin) * plotW;
      var py = plotY + plotH - (kw - kwMin) / (kwMax - kwMin) * plotH;
      if (c === cMin) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    /* Axis labels */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (var cl = 2; cl <= 16; cl += 2) {
      var xx = plotX + (cl - cMin) / (cMax - cMin) * plotW;
      ctx.fillText('' + cl, xx, plotY + plotH + 18);
    }
    ctx.fillText('Spring Index C', plotX + plotW / 2, plotY + plotH + 38);

    ctx.textAlign = 'right';
    for (var kwl = 1; kwl <= 2; kwl += 0.2) {
      var yy = plotY + plotH - (kwl - kwMin) / (kwMax - kwMin) * plotH;
      ctx.fillText(kwl.toFixed(1), plotX - 8, yy + 4);
    }

    ctx.save();
    ctx.translate(plotX - 50, plotY + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Wahl Factor Kw', 0, 0);
    ctx.restore();

    /* Recommended range shading */
    ctx.fillStyle = 'rgba(0,200,83,0.08)';
    var x4 = plotX + (4 - cMin) / (cMax - cMin) * plotW;
    var x12 = plotX + (12 - cMin) / (cMax - cMin) * plotW;
    ctx.fillRect(x4, plotY, x12 - x4, plotH);
    ctx.fillStyle = '#00c853';
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Recommended range (4\u201312)', (x4 + x12) / 2, plotY + 18);

    ctx.restore();
  }

  function drawExploreShearStress() {
    drawTitle('Max Shear Stress: \u03C4 = Kw \u00D7 8FD / (\u03C0d\u00B3)');
    var cx = W / 3;

    /* Cross section of wire showing stress distribution */
    ctx.save();
    var cr = 80;
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, H / 2, cr, 0, Math.PI * 2);
    ctx.stroke();

    /* Gradient showing stress concentration on inner side */
    var grd = ctx.createRadialGradient(cx - cr * 0.3, H / 2, 0, cx, H / 2, cr);
    grd.addColorStop(0, 'rgba(255,85,85,0.6)');
    grd.addColorStop(0.5, 'rgba(245,200,66,0.3)');
    grd.addColorStop(1, 'rgba(0,200,83,0.15)');
    ctx.fillStyle = grd;
    ctx.fill();

    ctx.fillStyle = '#dde3f0';
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Wire Cross-Section', cx, H / 2 + cr + 25);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('\u2190 Inner (max stress)', cx - 60, H / 2 + cr + 45);
    ctx.fillStyle = '#00c853';
    ctx.fillText('Outer (min stress) \u2192', cx + 60, H / 2 + cr + 45);

    /* Formula on right */
    var fx = W * 0.68;
    ctx.fillStyle = '#00c853';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C4 = Kw \u00D7 8FD', fx, H / 2 - 30);
    ctx.fillText('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500', fx, H / 2 - 10);
    ctx.fillText('   \u03C0d\u00B3', fx, H / 2 + 10);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '13px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Kw corrects for curvature', fx, H / 2 + 50);
    ctx.fillText('and direct shear effects', fx, H / 2 + 70);
    ctx.restore();
  }

  function drawExploreDeflection() {
    drawTitle('Deflection: \u03B4 = 8FD\u00B3n / (Gd\u2074)');
    /* Show two springs side by side: low deflection and high deflection */
    var cx1 = W / 3, cx2 = W * 2 / 3;

    drawPlate(cx1, 60, 140, 10, true);
    drawSpringCoils(cx1, 70, 300, 45, 5, 8, '#00c853');
    drawPlate(cx1, 300, 140, 10, false);
    drawArrow(cx1, 315, cx1, 355, '#3ddc84', 'Small F', 'right');
    ctx.save();
    ctx.fillStyle = '#6b7a99';
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Small deflection', cx1, 385);
    ctx.restore();

    drawPlate(cx2, 60, 140, 10, true);
    drawSpringCoils(cx2, 70, 200, 45, 5, 8, '#f5c842');
    drawPlate(cx2, 200, 140, 10, false);
    drawArrow(cx2, 215, cx2, 280, '#3ddc84', 'Large F', 'right');
    drawDimensionLine(cx2 + 100, 70, cx2 + 100, 200, '#ff5555', '\u03B4 large', 0);
    ctx.save();
    ctx.fillStyle = '#6b7a99';
    ctx.font = '12px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Large deflection', cx2, 310);
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#00c853';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u03B4 = F / k = 8FD\u00B3n / (Gd\u2074)', W / 2, H - 30);
    ctx.restore();
  }

  function drawExploreSpringIndex() {
    drawTitle('Spring Index: C = D / d');
    /* Show 3 springs with different C values */
    var configs = [
      { C: 3, label: 'C = 3 (Too tight)', color: '#ff5555', coilR: 18, wireR: 6 },
      { C: 8, label: 'C = 8 (Ideal)', color: '#00c853', coilR: 40, wireR: 5 },
      { C: 14, label: 'C = 14 (Too loose)', color: '#f5c842', coilR: 70, wireR: 3 }
    ];
    for (var i = 0; i < 3; i++) {
      var cx = W * (i + 1) / 4;
      drawPlate(cx, 80, 160, 8, true);
      drawSpringCoils(cx, 88, 320, configs[i].coilR, configs[i].wireR, 6, configs[i].color);
      drawPlate(cx, 320, 160, 8, false);
      ctx.save();
      ctx.fillStyle = configs[i].color;
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(configs[i].label, cx, 355);
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = '#6b7a99';
    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Recommended range: 4 \u2264 C \u2264 12', W / 2, H - 30);
    ctx.restore();
  }

  function drawExploreShearModulus() {
    drawTitle('Shear Modulus Comparison');
    /* Bar chart of G values */
    var mats = MATERIALS;
    var barW = 100, gap = 60;
    var totalW = mats.length * barW + (mats.length - 1) * gap;
    var startX = (W - totalW) / 2;
    var maxG = 80000;
    var barMaxH = 280;
    var baseY = H - 80;

    for (var i = 0; i < mats.length; i++) {
      var x = startX + i * (barW + gap);
      var h = (mats[i].G / maxG) * barMaxH;
      var y = baseY - h;

      ctx.save();
      var grd = ctx.createLinearGradient(x, y, x, baseY);
      grd.addColorStop(0, mats[i].color);
      grd.addColorStop(1, mats[i].color + '44');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, [8, 8, 0, 0]);
      ctx.fill();

      ctx.strokeStyle = mats[i].color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, [8, 8, 0, 0]);
      ctx.stroke();

      /* Labels */
      ctx.fillStyle = '#dde3f0';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText((mats[i].G / 1000) + ' GPa', x + barW / 2, y - 12);

      ctx.fillStyle = '#6b7a99';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(mats[i].name, x + barW / 2, baseY + 20);
      ctx.restore();
    }
  }

  function drawExploreWireTypes() {
    drawTitle('Spring Wire Types');
    var types = [
      { name: 'Music Wire (A228)', desc: 'Highest quality, cold-drawn', color: '#00c853' },
      { name: 'Oil-Tempered (A229)', desc: 'General purpose, lower cost', color: '#42a5f5' },
      { name: 'Chrome Vanadium (A231)', desc: 'Good fatigue resistance', color: '#f5c842' },
      { name: 'Chrome Silicon (A401)', desc: 'Excellent shock loading', color: '#ff7043' },
      { name: 'Stainless 302/304', desc: 'Corrosion resistant', color: '#ab47bc' },
      { name: 'Inconel X-750', desc: 'High temperature (700\u00B0C)', color: '#ef5350' }
    ];
    var startY = 80;
    var rowH = 56;
    for (var i = 0; i < types.length; i++) {
      var y = startY + i * rowH;
      ctx.save();
      ctx.fillStyle = 'rgba(22,27,39,0.7)';
      ctx.strokeStyle = types[i].color + '44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 200, y, 400, 44, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = types[i].color;
      ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(types[i].name, W / 2 - 185, y + 18);
      ctx.fillStyle = '#6b7a99';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(types[i].desc, W / 2 - 185, y + 35);

      /* Wire sample circle */
      ctx.strokeStyle = types[i].color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(W / 2 + 170, y + 22, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawExploreSurface() {
    drawTitle('Surface Treatments for Springs');
    var treatments = [
      { name: 'Shot Peening', benefit: '+20\u201350% fatigue life', icon: '\u25CF\u25CF\u25CF' },
      { name: 'Zinc Plating', benefit: 'Corrosion protection', icon: '\u25A0\u25A0\u25A0' },
      { name: 'Stress Relieving', benefit: 'Remove residual stress', icon: '\u25B2\u25B2\u25B2' },
      { name: 'Setting (Pre-stress)', benefit: 'Increase elastic range', icon: '\u25C6\u25C6\u25C6' }
    ];
    var startY = 100;
    var rowH = 80;
    for (var i = 0; i < treatments.length; i++) {
      var y = startY + i * rowH;
      ctx.save();
      ctx.fillStyle = '#161b27';
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 220, y, 440, 65, 10);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00c853';
      ctx.font = 'bold 15px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(treatments[i].name, W / 2 - 200, y + 25);
      ctx.fillStyle = '#6b7a99';
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(treatments[i].benefit, W / 2 - 200, y + 48);

      ctx.fillStyle = '#00c853';
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(treatments[i].icon, W / 2 + 200, y + 38);
      ctx.restore();
    }
  }

  function drawExploreEndCond() {
    drawTitle('End Conditions (Compression Springs)');
    var types = [
      { name: 'Plain', Nt: 'n', Ls: 'n \u00D7 d', desc: 'Wire just cut' },
      { name: 'Plain & Ground', Nt: 'n + 1', Ls: '(n+1)\u00D7d', desc: 'End ground flat' },
      { name: 'Squared', Nt: 'n + 2', Ls: '(n+2)\u00D7d', desc: 'End coils closed' },
      { name: 'Sq. & Ground', Nt: 'n + 2', Ls: '(n+2)\u00D7d', desc: 'Closed & ground (most common)' }
    ];
    var startX = 60;
    var colW = (W - 120) / 4;
    for (var i = 0; i < types.length; i++) {
      var cx = startX + i * colW + colW / 2;

      /* Draw mini spring */
      drawPlate(cx, 90, colW - 20, 6, true);
      drawSpringCoils(cx, 96, 260, 25, 3, 6, i === 3 ? '#00c853' : '#6b7a99');
      drawPlate(cx, 260, colW - 20, 6, false);

      ctx.save();
      ctx.fillStyle = i === 3 ? '#00c853' : '#dde3f0';
      ctx.font = 'bold 13px "Segoe UI", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(types[i].name, cx, 290);

      ctx.fillStyle = '#6b7a99';
      ctx.font = '11px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('N_t = ' + types[i].Nt, cx, 310);
      ctx.fillText('L_s = ' + types[i].Ls, cx, 326);
      ctx.fillText(types[i].desc, cx, 346);
      ctx.restore();
    }
  }

  /* ================================================================
     MAIN DRAW DISPATCHER
     ================================================================ */
  function draw() {
    if (mode === 'simulate') {
      drawSimulate();
    } else if (mode === 'explore') {
      drawExplore();
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    }
  }

  function drawPracticeCanvas() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    /* Draw a generic spring in the center for practice mode */
    var cx = W / 2;
    drawPlate(cx, 60, 180, 12, true);
    drawSpringCoils(cx, 72, 320, 60, 5, 8, '#00c853');
    drawPlate(cx, 320, 180, 12, false);

    ctx.save();
    ctx.fillStyle = '#00c853';
    ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Practice Mode', W / 2, H - 80);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Solve spring design problems below', W / 2, H - 55);
    ctx.restore();
  }

  function drawQuizCanvas() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    var cx = W / 2;
    drawPlate(cx, 60, 180, 12, true);
    drawSpringCoils(cx, 72, 320, 60, 5, 8, '#f5c842');
    drawPlate(cx, 320, 180, 12, false);

    ctx.save();
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 22px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Quiz Mode', W / 2, H - 80);
    ctx.fillStyle = '#6b7a99';
    ctx.font = '14px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Test your spring design knowledge', W / 2, H - 55);
    ctx.restore();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    /* Smooth deflection */
    var diff = targetDeflection - animDeflection;
    if (Math.abs(diff) > 0.01) {
      animDeflection += diff * 0.12;
    } else {
      animDeflection = targetDeflection;
    }
    draw();
    animRAF = requestAnimationFrame(animate);
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;
    $$('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === m); });

    /* Hide all panels */
    hide($('#sim-panel'));
    hide($('#cat-row'));
    hide($('#item-selector'));
    hide($('#item-info'));
    hide($('#practice-panel'));
    hide($('#practice-bar'));
    hide($('#quiz-panel'));
    hide($('#quiz-bar'));
    hide($('#quiz-result'));

    if (m === 'simulate') {
      show($('#sim-panel'));
      updateReadouts();
    } else if (m === 'explore') {
      show($('#cat-row'));
      show($('#item-selector'));
      buildConceptGrid();
    } else if (m === 'practice') {
      show($('#practice-panel'));
      show($('#practice-bar'));
      newPractice();
    } else if (m === 'quiz') {
      startQuiz();
    }
    draw();
  }

  /* Mode tab clicks */
  $('#mode-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.mode) return;
    setMode(pill.dataset.mode);
  });

  /* ================================================================
     SIMULATE — EVENT HANDLERS
     ================================================================ */
  /* Material tabs */
  $('#mat-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.mat) return;
    $$('#mat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === pill); });
    for (var i = 0; i < MATERIALS.length; i++) {
      if (MATERIALS[i].id === pill.dataset.mat) { matIdx = i; break; }
    }
    updateReadouts();
  });

  /* Sliders */
  function wireSlider(id, prop, factor, suffix) {
    var el = $('#' + id);
    el.addEventListener('input', function () {
      sim[prop] = parseFloat(el.value) * (factor || 1);
      updateReadouts();
    });
  }
  wireSlider('d-slider', 'd', 1, ' mm');
  wireSlider('D-slider', 'D', 1, ' mm');
  wireSlider('n-slider', 'n', 1, '');
  wireSlider('F-slider', 'F', 1, ' N');

  /* Presets */
  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      sim.d = parseFloat(btn.dataset.wire);
      sim.D = parseFloat(btn.dataset.coil);
      sim.n = parseInt(btn.dataset.turns, 10);
      sim.F = parseFloat(btn.dataset.force);
      $('#d-slider').value = sim.d;
      $('#D-slider').value = sim.D;
      $('#n-slider').value = sim.n;
      $('#F-slider').value = sim.F;
      updateReadouts();
    });
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  function buildConceptGrid() {
    var grid = $('#concept-grid');
    grid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === activeCat; });
    filtered.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn';
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        var realIdx = CONCEPTS.indexOf(c);
        selectConcept(realIdx, btn);
      });
      if (CONCEPTS.indexOf(c) === selConceptIdx) btn.classList.add('active');
      grid.appendChild(btn);
    });
  }

  function selectConcept(idx, btn) {
    selConceptIdx = idx;
    $$('.is-btn').forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');

    var c = CONCEPTS[idx];
    var info = $('#item-info');
    info.innerHTML =
      '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat.replace(/-/g, ' ') + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>' +
      '<div class="example-box"><h4>Example Calculation</h4>' +
      '<p class="ex-problem">' + c.example.problem + '</p>' +
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s.replace(/= ([0-9.,]+)/g, '= <strong>$1</strong>') + '</p>'; }).join('') +
      '</div>';
    show(info);
    draw();
  }

  /* Category tabs */
  $('#cat-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.cat) return;
    activeCat = pill.dataset.cat;
    selConceptIdx = -1;
    $$('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === pill); });
    hide($('#item-info'));
    buildConceptGrid();
    draw();
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
    draw();
  }

  $('#pp-check').addEventListener('click', function () {
    if (pAnswered || !pProblem) return;
    pAnswered = true;
    pTotal++;
    var val = parseFloat($('#pp-input').value);
    var tol = Math.max(Math.abs(pProblem.answer) * 0.01, 0.5);
    var ok = !isNaN(val) && Math.abs(val - pProblem.answer) <= tol;
    if (ok) { pScore++; }
    $('#pp-feedback').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect \u2014 answer: ' + pProblem.answer + ' ' + pProblem.unit;
    $('#pp-feedback').className = 'feedback ' + (ok ? 'ok' : 'err');
    $('#pp-input').disabled = true;
    show($('#pp-next'));
    /* Show solution */
    var solEl = $('#pp-solution');
    solEl.innerHTML = '<h4>Step-by-Step Solution</h4>' +
      pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([0-9.,]+)/g, '= <strong>$1</strong>') + '</p>'; }).join('');
    show(solEl);
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
  });

  /* Enter key to check */
  $('#pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!pAnswered) $('#pp-check').click();
      else $('#pp-next').click();
    }
  });

  $('#pp-next').addEventListener('click', newPractice);

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
        if (e.key === 'Enter') {
          if (!quizAnswered) panel.querySelector('#q-submit').click();
          else { var nb = panel.querySelector('#q-next'); if (nb) nb.click(); }
        }
      });
    }
    var nextBtn = panel.querySelector('#q-next');
    if (nextBtn) nextBtn.addEventListener('click', nextQuizQ);
    draw();
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
    var tol = Math.max(Math.abs(q.answer) * 0.02, 0.5);
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
    draw();
  }

  /* ================================================================
     CANVAS POLYFILL — roundRect
     ================================================================ */
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
      var r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      this.closePath();
      return this;
    };
  }

  /* ================================================================
     INIT
     ================================================================ */
  fitCanvas();
  updateReadouts();
  setMode('simulate');
  animate();

  /* Refit on resize — the backing store must follow the card width, otherwise
     the canvas goes soft again as soon as the window changes. */
  window.addEventListener('resize', fitCanvas);

})();
