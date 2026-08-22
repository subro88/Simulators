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
  function fmtSci(v) {
    if (Math.abs(v) < 0.01 || Math.abs(v) > 999999) return v.toExponential(2);
    return roundN(v, 2).toLocaleString();
  }
  function fmtNum(v) {
    if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1) + 'k';
    return roundN(v, 2).toString();
  }

  /* ================================================================
     BEARING DATA
     ================================================================ */
  var BEARING_TYPES = {
    'deep-groove':   { name: 'Deep Groove Ball',    p: 3,    X: 0.56, Y: 1.0,  e: 0.22, icon: 'ball',   minLoadFactor: 0.02 },
    'angular':       { name: 'Angular Contact Ball', p: 3,   X: 0.57, Y: 0.93, e: 0.68, icon: 'ball',   minLoadFactor: 0.01 },
    'cylindrical':   { name: 'Cylindrical Roller',   p: 10/3, X: 1.0, Y: 0,    e: 0,    icon: 'roller', minLoadFactor: 0.02 },
    'tapered':       { name: 'Tapered Roller',       p: 10/3, X: 0.4, Y: 1.5,  e: 0.37, icon: 'roller', minLoadFactor: 0.02 },
    'spherical':     { name: 'Spherical Roller',     p: 10/3, X: 0.67, Y: 2.78, e: 0.27, icon: 'roller', minLoadFactor: 0.02 },
    'needle':        { name: 'Needle Roller',        p: 10/3, X: 1.0, Y: 0,    e: 0,    icon: 'roller', minLoadFactor: 0.03 }
  };

  var RELIABILITY = [
    { label: '90%', value: 0.90, a1: 1.00 },
    { label: '95%', value: 0.95, a1: 0.62 },
    { label: '96%', value: 0.96, a1: 0.53 },
    { label: '97%', value: 0.97, a1: 0.44 },
    { label: '98%', value: 0.98, a1: 0.33 },
    { label: '99%', value: 0.99, a1: 0.21 }
  ];

  /* ================================================================
     CONCEPTS (Explore mode)
     ================================================================ */
  var CONCEPTS = [
    /* Fundamentals */
    {
      id: 'l10-life', name: 'Basic L10 Life', symbol: 'L10 = (C/P)^p',
      formula: 'L10 = (C / P)^p \u00D7 10\u2076 rev', unit: 'millions of revolutions',
      cat: 'fundamentals',
      desc: 'The L10 life (also called basic rating life) is the number of revolutions at which 10% of a group of identical bearings will have developed fatigue damage. The exponent p equals 3 for ball bearings and 10/3 for roller bearings. C is the dynamic load rating and P is the equivalent dynamic load. This statistical measure forms the foundation of bearing selection in mechanical design.',
      example: {
        problem: 'A deep groove ball bearing has C = 25 kN and carries an equivalent load P = 5 kN. Find the L10 life.',
        steps: [
          'Bearing type: ball, so p = 3',
          'L10 = (C/P)^p = (25/5)^3 = 5^3 = 125',
          'L10 = 125 \u00D7 10\u2076 revolutions',
          'L10 = 125 million revolutions'
        ],
        answer: 125, unit: 'million rev'
      }
    },
    {
      id: 'l10h-life', name: 'L10h Life in Hours', symbol: 'L10h = L10/(60n)',
      formula: 'L10h = L10 / (60 \u00D7 n)', unit: 'hours',
      cat: 'fundamentals',
      desc: 'The L10h life converts the basic L10 life from revolutions to operating hours. Here n is the rotational speed in RPM. This is the most practical form for designers because bearing life requirements are typically specified in operating hours. Standard industrial bearings are designed for 20,000-30,000 hours; automotive bearings for 3,000-5,000 hours.',
      example: {
        problem: 'A bearing has L10 = 125 million revolutions and operates at 1500 RPM. Find the L10h life in hours.',
        steps: [
          'L10 = 125 \u00D7 10\u2076 rev, n = 1500 RPM',
          'L10h = L10 / (60 \u00D7 n)',
          'L10h = 125,000,000 / (60 \u00D7 1500)',
          'L10h = 125,000,000 / 90,000',
          'L10h = 1,388.9 hours'
        ],
        answer: 1389, unit: 'hours'
      }
    },
    {
      id: 'dynamic-rating', name: 'Dynamic Load Rating C', symbol: 'C (kN)',
      formula: 'C = P \u00D7 (L10_req / 10\u2076)^(1/p)', unit: 'kN',
      cat: 'fundamentals',
      desc: 'The dynamic load rating (C) is the constant radial load that a bearing can theoretically endure for a basic rating life of 1 million revolutions. It is the primary parameter published in bearing catalogues and is used to compare bearings of different sizes. A higher C rating means the bearing can carry heavier loads or last longer under the same load.',
      example: {
        problem: 'A ball bearing must achieve L10 = 500 million rev under P = 8 kN. What minimum C rating is needed?',
        steps: [
          'p = 3 (ball bearing)',
          'C = P \u00D7 (L10 / 10\u2076)^(1/p)',
          'C = 8 \u00D7 (500)^(1/3)',
          'C = 8 \u00D7 7.937',
          'C = 63.5 kN'
        ],
        answer: 63.5, unit: 'kN'
      }
    },
    {
      id: 'equiv-load', name: 'Equivalent Dynamic Load', symbol: 'P = XFr + YFa',
      formula: 'P = X \u00D7 Fr + Y \u00D7 Fa', unit: 'kN',
      cat: 'fundamentals',
      desc: 'When a bearing experiences both radial load (Fr) and axial load (Fa), these are combined into a single equivalent dynamic load (P) that would produce the same fatigue life if applied as a pure radial load. The factors X and Y depend on the bearing type and the ratio Fa/Fr. If the ratio is below a threshold e, then P = Fr (axial load negligible).',
      example: {
        problem: 'A deep groove ball bearing carries Fr = 4 kN and Fa = 2 kN (Fa/Fr > e). X = 0.56, Y = 1.0. Find P.',
        steps: [
          'P = X \u00D7 Fr + Y \u00D7 Fa',
          'P = 0.56 \u00D7 4 + 1.0 \u00D7 2',
          'P = 2.24 + 2.0',
          'P = 4.24 kN'
        ],
        answer: 4.24, unit: 'kN'
      }
    },
    /* Bearing Types */
    {
      id: 'ball-bearings', name: 'Ball Bearings', symbol: 'p = 3',
      formula: 'L10 = (C/P)\u00B3 \u00D7 10\u2076', unit: 'rev',
      cat: 'types',
      desc: 'Ball bearings use spherical rolling elements and are the most common bearing type. They can support both radial and axial loads, are suitable for high speeds, and generate low friction. Deep groove ball bearings are the most versatile, while angular contact ball bearings excel under combined loads. The life exponent p = 3 for all ball bearing types.',
      example: {
        problem: 'An angular contact ball bearing (C = 30 kN) carries P = 6 kN at 2000 RPM. Find L10h.',
        steps: [
          'L10 = (C/P)^3 = (30/6)^3 = 5^3 = 125 million rev',
          'L10h = 125,000,000 / (60 \u00D7 2000)',
          'L10h = 125,000,000 / 120,000',
          'L10h = 1,041.7 hours'
        ],
        answer: 1042, unit: 'hours'
      }
    },
    {
      id: 'roller-bearings', name: 'Roller Bearings', symbol: 'p = 10/3',
      formula: 'L10 = (C/P)^(10/3) \u00D7 10\u2076', unit: 'rev',
      cat: 'types',
      desc: 'Roller bearings use cylindrical, tapered, spherical, or needle-shaped rolling elements. They have higher load capacity than ball bearings due to line contact (vs point contact). The life exponent p = 10/3 (3.333) for all roller types. Cylindrical rollers excel at radial loads, tapered rollers handle combined loads, spherical rollers accommodate misalignment, and needle rollers fit tight spaces.',
      example: {
        problem: 'A cylindrical roller bearing (C = 80 kN) carries P = 20 kN at 500 RPM. Find L10h.',
        steps: [
          'L10 = (C/P)^(10/3) = (80/20)^(10/3) = 4^3.333',
          'L10 = 4^3.333 = 84.45 million rev',
          'L10h = 84,450,000 / (60 \u00D7 500)',
          'L10h = 84,450,000 / 30,000',
          'L10h = 2,815 hours'
        ],
        answer: 2815, unit: 'hours'
      }
    },
    {
      id: 'tapered-roller', name: 'Tapered Roller', symbol: 'X=0.4, Y=1.5',
      formula: 'P = 0.4 Fr + 1.5 Fa', unit: 'kN',
      cat: 'types',
      desc: 'Tapered roller bearings feature conical rollers running on conical raceways. This geometry allows them to support large combined radial and axial loads. They are widely used in automotive wheel hubs, gearboxes, and heavy machinery. Typically mounted in pairs (face-to-face or back-to-back) to handle axial loads in both directions.',
      example: {
        problem: 'A tapered roller bearing (C = 120 kN) carries Fr = 30 kN and Fa = 15 kN. Find L10 life.',
        steps: [
          'P = 0.4 \u00D7 30 + 1.5 \u00D7 15 = 12 + 22.5 = 34.5 kN',
          'p = 10/3 (roller bearing)',
          'L10 = (C/P)^(10/3) = (120/34.5)^(10/3)',
          'L10 = 3.478^3.333 = 52.2 million rev'
        ],
        answer: 52.2, unit: 'million rev'
      }
    },
    {
      id: 'needle-roller', name: 'Needle Roller', symbol: 'Fa = 0',
      formula: 'P = Fr (radial only)', unit: 'kN',
      cat: 'types',
      desc: 'Needle roller bearings use long, thin cylindrical rollers (length/diameter > 4). Their compact design allows high radial load capacity in minimal radial space. They cannot support axial loads (Y = 0). Common applications include connecting rods, rocker arms, gearbox layshafts, and any application where radial space is limited.',
      example: {
        problem: 'A needle roller bearing (C = 35 kN) carries Fr = 10 kN at 3000 RPM. Find L10h.',
        steps: [
          'P = Fr = 10 kN (no axial load capability)',
          'L10 = (C/P)^(10/3) = (35/10)^(10/3) = 3.5^3.333',
          'L10 = 3.5^3.333 = 54.0 million rev',
          'L10h = 54,000,000 / (60 \u00D7 3000) = 300 hours'
        ],
        answer: 300, unit: 'hours'
      }
    },
    /* Life Factors */
    {
      id: 'reliability-factor', name: 'Reliability Factor a1', symbol: 'a1',
      formula: 'Lna = a1 \u00D7 L10', unit: 'factor',
      cat: 'factors',
      desc: 'The reliability factor a1 adjusts the L10 life for reliability levels other than 90%. Higher reliability requirements (fewer failures allowed) reduce the expected life. For example, at 99% reliability (only 1% failure rate), the adjusted life is only 21% of the L10 life. This factor is essential for critical applications like aerospace, medical devices, and nuclear equipment.',
      example: {
        problem: 'A bearing has L10 = 100 million rev. Find the life at 95% reliability.',
        steps: [
          'At R = 95%, a1 = 0.62',
          'L5 = a1 \u00D7 L10 = 0.62 \u00D7 100',
          'L5 = 62 million rev'
        ],
        answer: 62, unit: 'million rev'
      }
    },
    {
      id: 'adjusted-life', name: 'Adjusted Life Lna', symbol: 'Lna = a1\u00B7a2\u00B7a3\u00B7L10',
      formula: 'Lna = a1 \u00D7 a2 \u00D7 a3 \u00D7 L10', unit: 'rev',
      cat: 'factors',
      desc: 'The adjusted bearing life Lna accounts for three modification factors: a1 (reliability), a2 (material/processing quality, typically 0.7-1.0 for standard steel, up to 2.0 for premium materials), and a3 (lubrication conditions, 0.1-3.0 depending on oil film thickness and contamination). Modern ISO 281 replaces a2 and a3 with a combined aISO factor.',
      example: {
        problem: 'L10 = 200 million rev. Find adjusted life at 95% reliability, premium steel (a2=1.5), good lube (a3=1.2).',
        steps: [
          'a1 = 0.62 (95% reliability)',
          'a2 = 1.5 (premium material)',
          'a3 = 1.2 (good lubrication)',
          'Lna = 0.62 \u00D7 1.5 \u00D7 1.2 \u00D7 200',
          'Lna = 1.116 \u00D7 200 = 223.2 million rev'
        ],
        answer: 223.2, unit: 'million rev'
      }
    },
    {
      id: 'min-load', name: 'Minimum Load', symbol: 'P_min',
      formula: 'P_min = k_r \u00D7 C', unit: 'kN',
      cat: 'factors',
      desc: 'Bearings require a minimum radial load to prevent ball or roller skidding on the raceways. Skidding causes surface damage, heat generation, and premature failure. The minimum load factor k_r is typically 0.01-0.03 of the dynamic load rating C. For high-speed applications, the minimum load requirement increases with speed. If the actual load is below P_min, preloading or using a different bearing type is recommended.',
      example: {
        problem: 'A ball bearing has C = 50 kN and k_r = 0.02. What is the minimum required load?',
        steps: [
          'P_min = k_r \u00D7 C',
          'P_min = 0.02 \u00D7 50',
          'P_min = 1.0 kN'
        ],
        answer: 1.0, unit: 'kN'
      }
    },
    /* Applications */
    {
      id: 'required-c', name: 'Required C Rating', symbol: 'C_req',
      formula: 'C = P \u00D7 (60\u00B7n\u00B7Lh / 10\u2076)^(1/p)', unit: 'kN',
      cat: 'applications',
      desc: 'In design, you often need to find the minimum dynamic load rating C required to achieve a target life in hours (Lh) at a given speed (n RPM). This formula combines the L10 and L10h equations. Select a bearing from the catalogue with C greater than or equal to the calculated C_req.',
      example: {
        problem: 'Select a ball bearing for P = 5 kN, 1000 RPM, required life 20,000 hours. Find minimum C.',
        steps: [
          'Lh = 20,000 hours, n = 1000 RPM, p = 3',
          'L10 = 60 \u00D7 n \u00D7 Lh = 60 \u00D7 1000 \u00D7 20,000',
          'L10 = 1,200,000,000 = 1200 million rev',
          'C = P \u00D7 (L10/10\u2076)^(1/3) = 5 \u00D7 1200^(1/3)',
          'C = 5 \u00D7 10.627 = 53.1 kN'
        ],
        answer: 53.1, unit: 'kN'
      }
    },
    {
      id: 'life-years', name: 'Life in Years', symbol: 'years',
      formula: 'years = L10h / (hrs/day \u00D7 365)', unit: 'years',
      cat: 'applications',
      desc: 'Converting bearing life from hours to years depends on the operating schedule. A machine running 8 hours/day operates 2,920 hours/year; 16 hours/day is 5,840 hours/year; 24/7 continuous is 8,760 hours/year. This practical conversion helps engineers communicate bearing life expectations to clients and schedule maintenance intervals.',
      example: {
        problem: 'A bearing has L10h = 25,000 hours. Find life in years at 8 hours/day operation.',
        steps: [
          'Operating hours per year = 8 \u00D7 365 = 2,920 hrs/yr',
          'Life in years = L10h / hours per year',
          'Life = 25,000 / 2,920',
          'Life = 8.56 years'
        ],
        answer: 8.56, unit: 'years'
      }
    },
    {
      id: 'speed-factor', name: 'Speed Limitations', symbol: 'n_max',
      formula: 'n \u00D7 d_m < limit (mm\u00B7RPM)', unit: 'mm\u00B7RPM',
      cat: 'applications',
      desc: 'Every bearing has a speed limit based on the heat generated by rolling friction and cage dynamics. The speed capability is often expressed as the n\u00B7dm value (speed \u00D7 mean diameter in mm\u00B7RPM). Ball bearings typically allow n\u00B7dm up to 500,000-1,000,000; roller bearings up to 300,000-500,000. Exceeding speed limits causes overheating, lubricant degradation, and cage failure.',
      example: {
        problem: 'A bearing has bore d=40mm, outer D=80mm. Max n\u00B7dm = 500,000. Find max RPM.',
        steps: [
          'dm = (d + D) / 2 = (40 + 80) / 2 = 60 mm',
          'n_max = limit / dm = 500,000 / 60',
          'n_max = 8,333 RPM'
        ],
        answer: 8333, unit: 'RPM'
      }
    }
  ];

  /* ================================================================
     PRACTICE PROBLEM GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    function () {
      var C = randInt(15, 100);
      var P = randInt(3, Math.floor(C / 2));
      var ans = roundN(Math.pow(C / P, 3), 1);
      return {
        prompt: 'A deep groove ball bearing has C = ' + C + ' kN and equivalent load P = ' + P + ' kN. Calculate the L10 life in millions of revolutions.',
        answer: ans, unit: 'million rev', tolerance: Math.max(ans * 0.03, 1),
        steps: [
          'Ball bearing: p = 3',
          'L10 = (C/P)^p = (' + C + '/' + P + ')^3',
          'L10 = ' + roundN(C / P, 3) + '^3',
          'L10 = <strong>' + ans + ' million rev</strong>'
        ]
      };
    },
    function () {
      var C = randInt(20, 120);
      var P = randInt(5, Math.floor(C / 2));
      var ratio = C / P;
      var L10 = roundN(Math.pow(ratio, 10 / 3), 1);
      return {
        prompt: 'A cylindrical roller bearing has C = ' + C + ' kN and P = ' + P + ' kN. Calculate the L10 life in millions of revolutions.',
        answer: L10, unit: 'million rev', tolerance: Math.max(L10 * 0.05, 1),
        steps: [
          'Roller bearing: p = 10/3 = 3.333',
          'L10 = (C/P)^(10/3) = (' + C + '/' + P + ')^3.333',
          'L10 = ' + roundN(ratio, 3) + '^3.333',
          'L10 = <strong>' + L10 + ' million rev</strong>'
        ]
      };
    },
    function () {
      var C = randInt(20, 80);
      var P = randInt(3, Math.floor(C / 3));
      var rpm = randInt(5, 30) * 100;
      var L10rev = Math.pow(C / P, 3) * 1e6;
      var L10h = roundN(L10rev / (60 * rpm), 0);
      return {
        prompt: 'A ball bearing (C = ' + C + ' kN) operates at ' + rpm + ' RPM with P = ' + P + ' kN. Calculate the L10h life in hours.',
        answer: L10h, unit: 'hours', tolerance: Math.max(L10h * 0.03, 10),
        steps: [
          'L10 = (C/P)^3 = (' + C + '/' + P + ')^3 = ' + roundN(Math.pow(C / P, 3), 2) + ' million rev',
          'L10 (rev) = ' + fmtSci(L10rev) + ' rev',
          'L10h = L10 / (60 \u00D7 n) = ' + fmtSci(L10rev) + ' / (60 \u00D7 ' + rpm + ')',
          'L10h = <strong>' + L10h + ' hours</strong>'
        ]
      };
    },
    function () {
      var Fr = randInt(3, 20);
      var Fa = randInt(1, 10);
      var X = 0.56;
      var Y = 1.0;
      var P = roundN(X * Fr + Y * Fa, 2);
      return {
        prompt: 'A deep groove ball bearing carries Fr = ' + Fr + ' kN radial and Fa = ' + Fa + ' kN axial load (Fa/Fr > e). X = 0.56, Y = 1.0. Calculate the equivalent dynamic load P.',
        answer: P, unit: 'kN', tolerance: 0.1,
        steps: [
          'P = X \u00D7 Fr + Y \u00D7 Fa',
          'P = 0.56 \u00D7 ' + Fr + ' + 1.0 \u00D7 ' + Fa,
          'P = ' + roundN(X * Fr, 2) + ' + ' + Fa,
          'P = <strong>' + P + ' kN</strong>'
        ]
      };
    },
    function () {
      var Fr = randInt(10, 40);
      var Fa = randInt(5, 25);
      var P = roundN(0.4 * Fr + 1.5 * Fa, 2);
      return {
        prompt: 'A tapered roller bearing carries Fr = ' + Fr + ' kN and Fa = ' + Fa + ' kN. X = 0.4, Y = 1.5. Find P.',
        answer: P, unit: 'kN', tolerance: 0.2,
        steps: [
          'P = X \u00D7 Fr + Y \u00D7 Fa',
          'P = 0.4 \u00D7 ' + Fr + ' + 1.5 \u00D7 ' + Fa,
          'P = ' + roundN(0.4 * Fr, 1) + ' + ' + roundN(1.5 * Fa, 1),
          'P = <strong>' + P + ' kN</strong>'
        ]
      };
    },
    function () {
      var relIdx = randInt(1, 5);
      var rel = RELIABILITY[relIdx];
      var L10 = randInt(50, 500);
      var adj = roundN(rel.a1 * L10, 1);
      return {
        prompt: 'A bearing has L10 = ' + L10 + ' million rev. Find the adjusted life at ' + rel.label + ' reliability (a1 = ' + rel.a1 + ').',
        answer: adj, unit: 'million rev', tolerance: Math.max(adj * 0.03, 0.5),
        steps: [
          'a1 = ' + rel.a1 + ' (for ' + rel.label + ' reliability)',
          'L_adj = a1 \u00D7 L10 = ' + rel.a1 + ' \u00D7 ' + L10,
          'L_adj = <strong>' + adj + ' million rev</strong>'
        ]
      };
    },
    function () {
      var P = randInt(3, 15);
      var rpm = randInt(5, 30) * 100;
      var Lh = randInt(10, 50) * 1000;
      var L10 = 60 * rpm * Lh;
      var C = roundN(P * Math.pow(L10 / 1e6, 1 / 3), 1);
      return {
        prompt: 'Find the required C rating for a ball bearing with P = ' + P + ' kN, speed = ' + rpm + ' RPM, and required life = ' + (Lh / 1000) + ',000 hours.',
        answer: C, unit: 'kN', tolerance: Math.max(C * 0.03, 0.5),
        steps: [
          'L10 = 60 \u00D7 ' + rpm + ' \u00D7 ' + Lh + ' = ' + fmtSci(L10) + ' rev',
          'C = P \u00D7 (L10/10\u2076)^(1/3)',
          'C = ' + P + ' \u00D7 (' + roundN(L10 / 1e6, 1) + ')^(1/3)',
          'C = ' + P + ' \u00D7 ' + roundN(Math.pow(L10 / 1e6, 1 / 3), 3),
          'C = <strong>' + C + ' kN</strong>'
        ]
      };
    },
    function () {
      var L10h = randInt(5, 50) * 1000;
      var hrsPerDay = [8, 12, 16, 24][randInt(0, 3)];
      var yrs = roundN(L10h / (hrsPerDay * 365), 2);
      return {
        prompt: 'A bearing has L10h = ' + (L10h / 1000) + ',000 hours. How many years will it last at ' + hrsPerDay + ' hours/day operation?',
        answer: yrs, unit: 'years', tolerance: Math.max(yrs * 0.03, 0.1),
        steps: [
          'Hours per year = ' + hrsPerDay + ' \u00D7 365 = ' + (hrsPerDay * 365) + ' hrs/yr',
          'Life in years = L10h / hours per year',
          'Life = ' + L10h + ' / ' + (hrsPerDay * 365),
          'Life = <strong>' + yrs + ' years</strong>'
        ]
      };
    },
    function () {
      var C = randInt(30, 100);
      var P = randInt(5, Math.floor(C / 2));
      var rpm = randInt(5, 25) * 100;
      var a1 = RELIABILITY[randInt(1, 3)].a1;
      var relLabel = RELIABILITY.filter(function (r) { return r.a1 === a1; })[0].label;
      var L10rev = Math.pow(C / P, 3) * 1e6;
      var L10h = L10rev / (60 * rpm);
      var adjH = roundN(a1 * L10h, 0);
      return {
        prompt: 'A ball bearing (C = ' + C + ' kN, P = ' + P + ' kN) runs at ' + rpm + ' RPM. Find the adjusted L10h at ' + relLabel + ' reliability (a1 = ' + a1 + ').',
        answer: adjH, unit: 'hours', tolerance: Math.max(adjH * 0.05, 10),
        steps: [
          'L10 = (C/P)^3 = (' + C + '/' + P + ')^3 = ' + roundN(Math.pow(C / P, 3), 2) + ' million rev',
          'L10h = ' + fmtSci(L10rev) + ' / (60 \u00D7 ' + rpm + ') = ' + roundN(L10h, 0) + ' hours',
          'a1 = ' + a1 + ' (' + relLabel + ' reliability)',
          'Adjusted L10h = ' + a1 + ' \u00D7 ' + roundN(L10h, 0),
          'Adjusted L10h = <strong>' + adjH + ' hours</strong>'
        ]
      };
    },
    function () {
      var C = randInt(40, 150);
      var P = randInt(10, Math.floor(C / 2));
      var ratio = C / P;
      var L10 = roundN(Math.pow(ratio, 10 / 3), 1);
      var rpm = randInt(2, 10) * 100;
      var L10h = roundN(L10 * 1e6 / (60 * rpm), 0);
      return {
        prompt: 'A spherical roller bearing (C = ' + C + ' kN) carries P = ' + P + ' kN at ' + rpm + ' RPM. Find L10h.',
        answer: L10h, unit: 'hours', tolerance: Math.max(L10h * 0.05, 20),
        steps: [
          'Roller bearing: p = 10/3',
          'L10 = (C/P)^(10/3) = (' + C + '/' + P + ')^3.333 = ' + L10 + ' million rev',
          'L10h = ' + L10 + ' \u00D7 10\u2076 / (60 \u00D7 ' + rpm + ')',
          'L10h = <strong>' + L10h + ' hours</strong>'
        ]
      };
    },
    function () {
      var C = randInt(20, 60);
      var kr = 0.02;
      var Pmin = roundN(kr * C, 2);
      return {
        prompt: 'A ball bearing has C = ' + C + ' kN and minimum load factor k_r = 0.02. What is the minimum required load?',
        answer: Pmin, unit: 'kN', tolerance: 0.05,
        steps: [
          'P_min = k_r \u00D7 C',
          'P_min = 0.02 \u00D7 ' + C,
          'P_min = <strong>' + Pmin + ' kN</strong>'
        ]
      };
    },
    function () {
      var a1 = RELIABILITY[randInt(1, 4)].a1;
      var relLabel = RELIABILITY.filter(function (r) { return r.a1 === a1; })[0].label;
      var a2 = [0.8, 1.0, 1.2, 1.5][randInt(0, 3)];
      var a3 = [0.5, 0.8, 1.0, 1.2][randInt(0, 3)];
      var L10 = randInt(50, 300);
      var Lna = roundN(a1 * a2 * a3 * L10, 1);
      return {
        prompt: 'L10 = ' + L10 + ' million rev. Find Lna with a1 = ' + a1 + ' (' + relLabel + '), a2 = ' + a2 + ' (material), a3 = ' + a3 + ' (lubrication).',
        answer: Lna, unit: 'million rev', tolerance: Math.max(Lna * 0.03, 1),
        steps: [
          'Lna = a1 \u00D7 a2 \u00D7 a3 \u00D7 L10',
          'Lna = ' + a1 + ' \u00D7 ' + a2 + ' \u00D7 ' + a3 + ' \u00D7 ' + L10,
          'Lna = ' + roundN(a1 * a2 * a3, 4) + ' \u00D7 ' + L10,
          'Lna = <strong>' + Lna + ' million rev</strong>'
        ]
      };
    }
  ];

  /* ================================================================
     QUIZ POOL (15 questions: 8 MCQ + 7 numeric)
     ================================================================ */
  var QUIZ_POOL = [
    { type: 'mcq', prompt: 'What is the life exponent p for ball bearings in the L10 equation?', options: ['2', '3', '10/3', '4'], correct: 1 },
    { type: 'mcq', prompt: 'What does the L10 life represent?', options: ['Life at which 50% of bearings fail', 'Life at which 10% of bearings fail', 'Life at which 1% of bearings fail', 'Average life of all bearings'], correct: 1 },
    { type: 'mcq', prompt: 'Which bearing type uses the life exponent p = 10/3?', options: ['Deep groove ball', 'Angular contact ball', 'Cylindrical roller', 'All ball bearings'], correct: 2 },
    { type: 'mcq', prompt: 'What is the reliability factor a1 for 99% reliability?', options: ['1.00', '0.62', '0.44', '0.21'], correct: 3 },
    { type: 'mcq', prompt: 'Which bearing type CANNOT support axial loads?', options: ['Deep groove ball', 'Tapered roller', 'Cylindrical roller', 'Angular contact ball'], correct: 2 },
    { type: 'mcq', prompt: 'What causes bearing skidding?', options: ['Excessive load', 'Insufficient minimum load', 'High temperature', 'Misalignment'], correct: 1 },
    { type: 'mcq', prompt: 'Which factor does NOT appear in the adjusted life equation Lna?', options: ['Reliability a1', 'Material a2', 'Lubrication a3', 'Speed a4'], correct: 3 },
    { type: 'mcq', prompt: 'A tapered roller bearing is best suited for:', options: ['Pure radial loads only', 'Pure axial loads only', 'Combined radial and axial loads', 'Oscillating motion only'], correct: 2 },
    { type: 'numeric', prompt: 'A ball bearing (C = 40 kN, P = 8 kN) operates at 1000 RPM. Find L10h in hours.', answer: 14583, unit: 'hours', tolerance: 500 },
    { type: 'numeric', prompt: 'P = X\u00B7Fr + Y\u00B7Fa. With X=0.56, Y=1.0, Fr=10 kN, Fa=5 kN, find P.', answer: 10.6, unit: 'kN', tolerance: 0.2 },
    { type: 'numeric', prompt: 'A roller bearing (C=60 kN, P=15 kN) has L10 = (C/P)^(10/3). Find L10 in million rev.', answer: roundN(Math.pow(4, 10 / 3), 1), unit: 'million rev', tolerance: 3 },
    { type: 'numeric', prompt: 'L10 = 200 million rev at 90% reliability. What is the life at 95% reliability (a1=0.62)?', answer: 124, unit: 'million rev', tolerance: 3 },
    { type: 'numeric', prompt: 'A bearing runs at 500 RPM with L10h = 20,000 hours. What is L10 in million revolutions?', answer: 600, unit: 'million rev', tolerance: 10 },
    { type: 'numeric', prompt: 'Find required C for a ball bearing: P=10 kN, L10h=10,000 hrs, n=1500 RPM.', answer: roundN(10 * Math.pow(60 * 1500 * 10000 / 1e6, 1 / 3), 1), unit: 'kN', tolerance: 2 },
    { type: 'numeric', prompt: 'A bearing has L10h=30,000 hours. Operating 16 hrs/day, how many years?', answer: roundN(30000 / (16 * 365), 1), unit: 'years', tolerance: 0.3 }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */
  var cvs = $('#sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = cvs.width;   // logical width  (900)
  var H = cvs.height;  // logical height (480)

  /* HiDPI / Retina fix — prevents blurry/pixelated canvas text */
  (function applyDPR() {
    var dpr = window.devicePixelRatio || 1;
    if (dpr === 1) return;
    cvs.width  = W * dpr;
    cvs.height = H * dpr;
    ctx.scale(dpr, dpr);
  })();

  /* Canvas results-table geometry (shared by draw + click handler) */
  var TBL = { tx: 558, ty: 8, tw: 334, hdrH: 22, rh: 27, n: 8, btnH: 30 };

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var bearingType = 'deep-groove';
  var C_rating = 50;     // kN  (always SI internally)
  var Fr = 10;           // kN
  var Fa = 2;            // kN
  var rpm = 1500;
  var relIdx = 0;        // index into RELIABILITY
  var unitSI = true;     // true = kN, false = kip
  var dailyHours = 8;    // hours/day for life-in-years calculation

  /* Explore */
  var selCat = 'fundamentals';
  var selConcept = 0;

  /* Practice */
  var pProblem = null;
  var pAnswered = false;
  var pScore = 0;
  var pTotal = 0;

  /* Quiz */
  var quizQs = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizResults = [];

  /* Animation */
  var running = false;
  var animFrame = null;
  var animTime = 0;
  var ballAngle = 0;

  /* ================================================================
     UNIT HELPERS  (all internal calcs stay in SI / kN)
     ================================================================ */
  var KN_TO_KIP = 0.2248;
  function toD(kn)  { return unitSI ? kn : roundN(kn * KN_TO_KIP, 3); }
  function fromD(v) { return unitSI ? parseFloat(v) : roundN(parseFloat(v) / KN_TO_KIP, 2); }
  function uKN()    { return unitSI ? 'kN' : 'kip'; }

  /* ================================================================
     PRESETS
     ================================================================ */
  var PRESETS = {
    'gearbox': { type: 'deep-groove', C: 85,  Fr: 25, Fa: 5,  rpm: 1500, rel: 0, label: 'Industrial Gearbox'    },
    'motor':   { type: 'deep-groove', C: 35,  Fr: 8,  Fa: 2,  rpm: 3000, rel: 1, label: 'Electric Motor'        },
    'auto':    { type: 'tapered',     C: 65,  Fr: 20, Fa: 8,  rpm: 500,  rel: 2, label: 'Automotive Wheel Hub'  },
    'wind':    { type: 'spherical',   C: 180, Fr: 60, Fa: 15, rpm: 20,   rel: 1, label: 'Wind Turbine'          },
    'pump':    { type: 'cylindrical', C: 50,  Fr: 15, Fa: 0,  rpm: 2900, rel: 0, label: 'Pump Shaft'            }
  };

  /* ================================================================
     BEARING LIMITS  (per SKF General Catalogue ranges)
     C_max  — largest catalogue bearing of each type (kN)
     Fr_max — practical radial load ceiling ≈ 0.9 × C_max (kN)
     Fa_max — axial capacity ceiling (kN); 0 = radial-only type
     rpm_max — reference/limiting speed ceiling (RPM)
     ================================================================ */
  var BEARING_LIMITS = {
    'deep-groove': { C_max: 200,  Fr_max: 150, Fa_max: 60,  rpm_max: 13000 },
    'angular':     { C_max: 250,  Fr_max: 200, Fa_max: 100, rpm_max: 13000 },
    'cylindrical': { C_max: 950,  Fr_max: 800, Fa_max: 0,   rpm_max: 10000 },
    'tapered':     { C_max: 200,  Fr_max: 150, Fa_max: 50,  rpm_max: 12000 },
    'spherical':   { C_max: 550,  Fr_max: 400, Fa_max: 200, rpm_max: 5000  },
    'needle':      { C_max: 50,   Fr_max: 40,  Fa_max: 0,   rpm_max: 15000 }
  };

  /* ================================================================
     CALCULATIONS
     ================================================================ */
  function getBearingData() {
    var bt = BEARING_TYPES[bearingType];
    var p = bt.p;
    var X = bt.X;
    var Y = bt.Y;

    // Equivalent load
    var faFrRatio = Fr > 0 ? Fa / Fr : 0;
    var P;
    if (bt.Y === 0 || faFrRatio <= bt.e) {
      P = Fr;
    } else {
      P = X * Fr + Y * Fa;
    }
    P = Math.max(P, Fr); // P >= Fr always

    // L10 in millions of revolutions
    var L10 = P > 0 ? Math.pow(C_rating / P, p) : Infinity;

    // L10 in revolutions
    var L10rev = L10 * 1e6;

    // L10h in hours
    var L10h = rpm > 0 ? L10rev / (60 * rpm) : Infinity;

    // Adjusted life
    var a1 = RELIABILITY[relIdx].a1;
    var Lna_rev = a1 * L10rev;
    var Lna_h = rpm > 0 ? Lna_rev / (60 * rpm) : Infinity;

    // Life in years based on user-defined daily operating hours
    var lifeYears = L10h / (dailyHours * 365);

    // Minimum load
    var Pmin = bt.minLoadFactor * C_rating;
    var belowMinLoad = P < Pmin;

    return {
      type: bt,
      P: P,
      L10: L10,
      L10h: L10h,
      a1: a1,
      Lna_h: Lna_h,
      lifeYears: lifeYears,
      Pmin: Pmin,
      belowMinLoad: belowMinLoad
    };
  }

  /* ================================================================
     READOUT UPDATES
     ================================================================ */
  function syncSteppers() {
    var u = uKN();
    // Stepper inputs — guard activeElement to avoid overwriting user typing
    var cNum = $('#c-num');  if (cNum  && document.activeElement !== cNum)  cNum.value  = toD(C_rating);
    var frNum = $('#fr-num'); if (frNum && document.activeElement !== frNum) frNum.value = toD(Fr);
    var faNum = $('#fa-num'); if (faNum && document.activeElement !== faNum) faNum.value = toD(Fa);
    var rNum  = $('#rpm-num'); if (rNum && document.activeElement !== rNum) rNum.value  = rpm;
    // Unit labels on steppers
    var cu = $('#c-unit');  if (cu)  cu.textContent  = u;
    var fru = $('#fr-unit'); if (fru) fru.textContent = u;
    var fau = $('#fa-unit'); if (fau) fau.textContent = u;
    // Force-unit spans in readout cards
    $$('.r-force-unit').forEach(function(el) { el.textContent = '\u00A0' + u; });
  }

  function updateFaGroup() {
    var bt = BEARING_TYPES[bearingType];
    var grp = $('#fa-group');
    if (!grp) return;
    if (bt.Y === 0) {
      grp.classList.add('grp-disabled');
    } else {
      grp.classList.remove('grp-disabled');
    }
  }

  function updateSliderLimits() {
    var lim = BEARING_LIMITS[bearingType];
    if (!lim) return;

    // ── C slider ────────────────────────────────────────────────
    var cs = $('#c-slider');
    if (cs) {
      cs.max   = lim.C_max;
      C_rating = clamp(C_rating, 1, lim.C_max);
      cs.value = C_rating;
    }
    var cNum = $('#c-num'); if (cNum) cNum.max = lim.C_max;

    // ── Fr slider ───────────────────────────────────────────────
    var frs = $('#fr-slider');
    if (frs) {
      frs.max = lim.Fr_max;
      Fr      = clamp(Fr, 0, lim.Fr_max);
      frs.value = Fr;
    }
    var frNum = $('#fr-num'); if (frNum) frNum.max = lim.Fr_max;

    // ── Fa slider ───────────────────────────────────────────────
    var fas = $('#fa-slider');
    if (fas) {
      fas.max = lim.Fa_max;
      Fa      = lim.Fa_max > 0 ? clamp(Fa, 0, lim.Fa_max) : 0;
      fas.value = Fa;
    }
    var faNum = $('#fa-num'); if (faNum) faNum.max = lim.Fa_max;

    // ── RPM slider ──────────────────────────────────────────────
    var rs = $('#rpm-slider');
    if (rs) {
      rs.max  = lim.rpm_max;
      rpm     = clamp(rpm, 0, lim.rpm_max);
      rs.value = rpm;
    }
    var rNum = $('#rpm-num'); if (rNum) rNum.max = lim.rpm_max;
  }

  function updateReadouts() {
    var d = getBearingData();

    // Canvas badges
    $('#rb-l10').textContent   = isFinite(d.L10)       ? fmtNum(d.L10) + ' M rev' : '\u221E';
    $('#rb-l10h').textContent  = isFinite(d.L10h)      ? fmtNum(d.L10h) + ' hrs'  : '\u221E';
    $('#rb-p').textContent     = roundN(toD(d.P), 3) + '\u00A0' + uKN();
    $('#rb-years').textContent = isFinite(d.lifeYears) ? roundN(d.lifeYears, 1) + ' yrs' : '\u221E';

    // Sync stepper inputs + unit labels
    syncSteppers();

    // Min load warning
    var warn = $('#min-load-warn');
    if (warn) {
      if (d.belowMinLoad) {
        warn.textContent = '\u26A0 Load below minimum (' + roundN(toD(d.Pmin), 3) + '\u00A0' + uKN() + ') \u2014 risk of skidding!';
        warn.style.display = '';
      } else {
        warn.style.display = 'none';
      }
    }
  }

  /* ================================================================
     CALCULATION MODAL
     ================================================================ */
  function openCalcModal() {
    var modal = $('#calc-modal');
    var body  = $('#calc-modal-body');
    if (!modal || !body) return;
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    // Focus the close button for keyboard users
    var closeBtn = $('#calc-modal-close');
    if (closeBtn) closeBtn.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeCalcModal() {
    var modal = $('#calc-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (cvs) cvs.focus();
  }

  /* ================================================================
     CANVAS DRAWING
     ================================================================ */
  function clearCanvas() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitle(text) {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'center';
    ctx.fillText(text, W / 2, 30);
  }

  /* ── Bearing cross-section ─────────────────────────────────── */
  function drawBearingCrossSection(cx, cy, outerR, innerR, numBalls, ballR, isRoller) {
    // Outer race
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#4a5270';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Inner race
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#4a5270';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR + 6, 0, Math.PI * 2);
    ctx.stroke();

    // Shaft hole
    ctx.fillStyle = '#0d1117';
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 4, 0, Math.PI * 2);
    ctx.fill();

    // Raceway background
    var raceR = (outerR - 6 + innerR + 6) / 2;
    ctx.strokeStyle = 'rgba(66,165,245,0.1)';
    ctx.lineWidth = outerR - 6 - innerR - 6;
    ctx.beginPath();
    ctx.arc(cx, cy, raceR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Rolling elements
    for (var i = 0; i < numBalls; i++) {
      var angle = ballAngle + (i * 2 * Math.PI / numBalls);
      var bx = cx + raceR * Math.cos(angle);
      var by = cy + raceR * Math.sin(angle);

      if (isRoller) {
        // Draw small rectangle for roller
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(angle + Math.PI / 2);
        ctx.fillStyle = 'rgba(66,165,245,0.6)';
        ctx.strokeStyle = '#42a5f5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-ballR, -ballR * 0.5, ballR * 2, ballR, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        // Ball
        var ballGrad = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, ballR);
        ballGrad.addColorStop(0, '#90caf9');
        ballGrad.addColorStop(0.5, '#42a5f5');
        ballGrad.addColorStop(1, '#1565c0');
        ctx.fillStyle = ballGrad;
        ctx.beginPath();
        ctx.arc(bx, by, ballR, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Center cross
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ── Load arrows ───────────────────────────────────────────── */
  function drawArrow(x1, y1, x2, y2, color, label) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / len;
    var uy = dy / len;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Arrowhead
    var headLen = 10;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * ux - 4 * uy, y2 - headLen * uy + 4 * ux);
    ctx.lineTo(x2 - headLen * ux + 4 * uy, y2 - headLen * uy - 4 * ux);
    ctx.closePath();
    ctx.fill();

    // Label
    if (label) {
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, (x1 + x2) / 2 - uy * 14, (y1 + y2) / 2 + ux * 14);
    }
  }

  /* ── Results table (drawn on canvas right half) ───────────────── */
  function drawResultsTable(d) {
    var tx = TBL.tx, ty = TBL.ty, tw = TBL.tw;
    var hdrH = TBL.hdrH, rh = TBL.rh, btnH = TBL.btnH;
    var bodyH = TBL.n * rh;
    var totalH = hdrH + bodyH + btnH;

    var rows = [
      { label: 'Equiv. Load P',  val: roundN(toD(d.P), 3),                                       unit: uKN(),   col: '#42a5f5' },
      { label: 'L10 Life',       val: isFinite(d.L10)       ? fmtSci(d.L10)        : '\u221E',   unit: 'M rev', col: '#42a5f5' },
      { label: 'L10h Life',      val: isFinite(d.L10h)      ? fmtSci(d.L10h)       : '\u221E',   unit: 'hrs',   col: '#3ddc84' },
      { label: 'Adjusted Lna',   val: isFinite(d.Lna_h)     ? fmtSci(d.Lna_h)      : '\u221E',   unit: 'hrs',   col: '#3ddc84' },
      { label: 'Factor a\u2081', val: String(d.a1),                                               unit: '',      col: '#f5c842' },
      { label: 'Life (' + dailyHours + ' h/day)', val: isFinite(d.lifeYears) ? String(roundN(d.lifeYears, 2)) : '\u221E', unit: 'yrs', col: '#f5c842' },
      { label: 'C Rating',       val: String(roundN(toD(C_rating), 3)),                           unit: uKN(),   col: '#dde3f0' },
      { label: 'Min. Load',      val: String(roundN(toD(d.Pmin), 3)),                             unit: uKN(),   col: d.belowMinLoad ? '#ff5555' : '#8b9dc3', warn: d.belowMinLoad }
    ];

    // ── Panel background ────────────────────────────────────────────
    ctx.fillStyle = 'rgba(17,22,34,0.92)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, totalH, 8);
    ctx.fill();

    // ── Header ──────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(31,37,53,0.98)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, hdrH, [8, 8, 0, 0]);
    ctx.fill();

    ctx.font = '700 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#8b9dc3';
    ctx.textAlign = 'left';
    ctx.fillText('PARAMETER', tx + 10, ty + 15);
    ctx.textAlign = 'right';
    ctx.fillText('VALUE', tx + tw - 58, ty + 15);
    ctx.fillText('UNIT', tx + tw - 6, ty + 15);

    ctx.strokeStyle = 'rgba(66,165,245,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, ty + hdrH);
    ctx.lineTo(tx + tw, ty + hdrH);
    ctx.stroke();

    // ── Data rows ───────────────────────────────────────────────────
    for (var i = 0; i < rows.length; i++) {
      var ry = ty + hdrH + i * rh;
      var row = rows[i];
      var midY = ry + rh * 0.62;

      if (row.warn) {
        ctx.fillStyle = 'rgba(255,85,85,0.12)';
        ctx.fillRect(tx, ry, tw, rh);
      } else if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(31,37,53,0.35)';
        ctx.fillRect(tx, ry, tw, rh);
      }

      ctx.strokeStyle = 'rgba(42,48,80,0.5)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(tx, ry);
      ctx.lineTo(tx + tw, ry);
      ctx.stroke();

      // Label
      ctx.font = '500 10.5px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8b9dc3';
      ctx.textAlign = 'left';
      ctx.fillText(row.label, tx + 10, midY);

      // Value
      ctx.font = '700 12px "Courier New", monospace';
      ctx.fillStyle = row.col;
      ctx.textAlign = 'right';
      ctx.fillText(row.val, tx + tw - 54, midY);

      // Unit
      ctx.font = '500 9.5px "Segoe UI", sans-serif';
      ctx.fillStyle = 'rgba(139,157,195,0.75)';
      ctx.textAlign = 'right';
      ctx.fillText(row.unit, tx + tw - 6, midY);
    }

    // ── "Show Me Calculations" button ───────────────────────────────
    var bty = ty + hdrH + bodyH;
    var grad = ctx.createLinearGradient(tx, bty, tx + tw, bty);
    grad.addColorStop(0, 'rgba(245,200,66,0.28)');
    grad.addColorStop(1, 'rgba(245,200,66,0.14)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(tx, bty, tw, btnH, [0, 0, 8, 8]);
    ctx.fill();

    ctx.strokeStyle = 'rgba(245,200,66,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(tx, bty);
    ctx.lineTo(tx + tw, bty);
    ctx.stroke();

    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'center';
    ctx.fillText('\uD83E\uDDEE  Show Me Calculations', tx + tw / 2, bty + btnH * 0.65);

    // ── Outer border ────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(42,48,80,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, totalH, 8);
    ctx.stroke();

    // Accent left strip
    ctx.fillStyle = 'rgba(66,165,245,0.5)';
    ctx.beginPath();
    ctx.roundRect(tx, ty + hdrH, 3, bodyH, [0, 0, 0, 0]);
    ctx.fill();
  }

  /* ── Simulate mode drawing ─────────────────────────────────── */
  function drawSimulate() {
    var bt = BEARING_TYPES[bearingType];
    var d = getBearingData();
    var isRoller = bt.icon === 'roller';

    // Bearing sits in left ~44% of canvas
    var cx = 210;
    var cy = Math.round(H / 2) + 5;
    var outerR = 108;
    var innerR = 45;
    var numBalls = isRoller ? 12 : 10;
    var ballR = isRoller ? 13 : 11;

    // Bearing type label (top left area)
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText(bt.name + ' Bearing', cx, 26);

    // Draw bearing cross-section
    drawBearingCrossSection(cx, cy, outerR, innerR, numBalls, ballR, isRoller);

    // Radial load arrow (downward from top)
    if (Fr > 0) {
      var frScale = Math.min(Fr / 30 * 50, 65);
      drawArrow(cx, cy - outerR - frScale - 10, cx, cy - outerR - 5,
        '#ff5555', 'Fr=' + roundN(toD(Fr), 2) + uKN());
    }

    // Axial load arrow (horizontal, from left)
    if (Fa > 0 && bt.Y > 0) {
      var faScale = Math.min(Fa / 20 * 40, 55);
      drawArrow(cx - outerR - faScale - 10, cy, cx - outerR - 5, cy,
        '#f5c842', 'Fa=' + roundN(toD(Fa), 2) + uKN());
    }

    // RPM indicator
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5';
    ctx.textAlign = 'center';
    ctx.fillText(rpm + ' RPM', cx, cy + outerR + 22);

    // Rotation arrow (inner shaft)
    if (rpm > 0) {
      ctx.strokeStyle = 'rgba(66,165,245,0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, innerR - 12, -Math.PI * 0.3, Math.PI * 0.8);
      ctx.stroke();
      var arrX = cx + (innerR - 12) * Math.cos(Math.PI * 0.8);
      var arrY = cy + (innerR - 12) * Math.sin(Math.PI * 0.8);
      ctx.fillStyle = 'rgba(66,165,245,0.5)';
      ctx.beginPath();
      ctx.moveTo(arrX, arrY);
      ctx.lineTo(arrX + 6, arrY - 5);
      ctx.lineTo(arrX - 2, arrY - 7);
      ctx.closePath();
      ctx.fill();
    }

    // Formula reference (bottom left, subtle)
    ctx.font = '600 9px "Courier New", monospace';
    ctx.fillStyle = 'rgba(139,157,195,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('L10=(C/P)^p  |  P=X\u00B7Fr+Y\u00B7Fa', cx, H - 8);

    // Results table on right half
    drawResultsTable(d);
  }

  /* ================================================================
     CALCULATION STEPS — for "Show Me Calculations" modal
     ================================================================ */
  function calcStep(num, title, formula, calculation, result) {
    var html = '<div class="cs-step">';
    html += '<div class="cs-step-hd">';
    html += '<span class="cs-num">Step ' + num + '</span>';
    html += '<span class="cs-title">' + title + '</span>';
    html += '</div>';
    if (formula) {
      html += '<div class="cs-formula">' + formula.replace(/\n/g, '<br>') + '</div>';
    }
    if (calculation) {
      html += '<div class="cs-calc">' + calculation.replace(/\n/g, '<br>') + '</div>';
    }
    if (result !== null && result !== undefined) {
      html += '<div class="cs-result">\u2192 <strong>' + result + '</strong></div>';
    }
    html += '</div>';
    return html;
  }

  function buildCalcSteps() {
    var bt  = BEARING_TYPES[bearingType];
    var d   = getBearingData();
    var rel = RELIABILITY[relIdx];
    var faFrRatio  = Fr > 0 ? Fa / Fr : 0;
    var isPAxial   = bt.Y > 0 && faFrRatio > bt.e;
    var L10rev     = isFinite(d.L10) ? d.L10 * 1e6 : Infinity;

    var html = '';

    // ── Inputs summary ────────────────────────────────────────
    html += '<div class="cs-inputs">';
    html += '<span class="cs-badge cs-badge-type">' + bt.name + '</span>';
    html += '<div class="cs-given">';
    html += '<span>C = ' + C_rating + ' kN</span>';
    html += '<span>Fr = ' + Fr + ' kN</span>';
    html += '<span>Fa = ' + Fa + ' kN</span>';
    html += '<span>n = ' + rpm + ' RPM</span>';
    html += '<span>Reliability = ' + rel.label + '</span>';
    html += '</div>';
    html += '<p class="cs-si-note">\u2139\uFE0F All calculations in SI (kN, revolutions, hours). Unit toggle affects display only.</p>';
    html += '</div>';

    // ── Step 1: Life exponent p ───────────────────────────────
    html += calcStep(1, 'Life Exponent p',
      '\\[ p = 3 for ball bearings  \, | \,  p = 10/3 \\u2248 3.333 for roller bearings \\]',
      (bt.p === 3
        ? bt.name + ' \u2192 Ball bearing \u2192 p = 3'
        : bt.name + ' \u2192 Roller bearing \u2192 p = 10/3'),
      'p = ' + roundN(bt.p, 3)
    );

    // ── Step 2: Axial-to-radial ratio check ──────────────────
    var step2Calc;
    if (bt.Y === 0) {
      step2Calc = 'This bearing type has Y = 0 (radial-only).\nAxial load capacity = 0 \u2192 P = Fr regardless of Fa.';
    } else if (Fr === 0) {
      step2Calc = 'Fr = 0 \u2192 ratio is undefined.\nMinimum load condition applies.';
    } else {
      step2Calc = 'Fa / Fr = ' + Fa + ' / ' + Fr + ' = ' + roundN(faFrRatio, 4) + '\n'
        + 'Threshold e = ' + bt.e + ' (for ' + bt.name + ')\n'
        + 'Since ' + roundN(faFrRatio, 4) + (isPAxial ? ' > ' : ' \u2264 ') + bt.e + ' \u2192 '
        + (isPAxial ? 'Use combined load formula' : 'Axial effect negligible \u2192 P = Fr');
    }
    html += calcStep(2, 'Axial-to-Radial Load Ratio Check',
      (bt.Y === 0
        ? 'Radial-only bearing: Y = 0, e = 0'
        : 'If Fa/Fr \u2264 e \u2192 P = Fr\nIf Fa/Fr > e \u2192 P = X\u00B7Fr + Y\u00B7Fa\n(X = ' + bt.X + ', Y = ' + bt.Y + ', e = ' + bt.e + ')'),
      step2Calc,
      null
    );

    // ── Step 3: Equivalent dynamic load P ────────────────────
    var step3Calc;
    if (bt.Y === 0 || !isPAxial) {
      var reason = bt.Y === 0 ? 'radial-only type' : 'Fa/Fr \u2264 e';
      step3Calc = 'Condition: ' + reason + ' \u2192 P = Fr\n'
        + 'P = ' + Fr + ' kN';
      if (bt.Y > 0 && !isPAxial && Fr > 0) {
        step3Calc += '\n[Verify: P \u2265 Fr \u2192 ' + roundN(d.P, 3) + ' kN \u2265 ' + Fr + ' kN \u2713]';
      }
    } else {
      var xFr = roundN(bt.X * Fr, 3);
      var yFa = roundN(bt.Y * Fa, 3);
      var Pcalc = roundN(xFr + yFa, 3);
      step3Calc = 'P = X\u00B7Fr + Y\u00B7Fa\n'
        + 'P = ' + bt.X + ' \u00D7 ' + Fr + ' + ' + bt.Y + ' \u00D7 ' + Fa + '\n'
        + 'P = ' + xFr + ' + ' + yFa + '\n'
        + 'P = ' + Pcalc + ' kN\n'
        + '[Rule: P \u2265 Fr always \u2192 P = max(' + Pcalc + ', ' + Fr + ') = ' + roundN(d.P, 3) + ' kN]';
    }
    html += calcStep(3, 'Equivalent Dynamic Load P',
      '\\[ P = X\\u00B7Fr + Y\\u00B7Fa  \, (combined radial + axial) \\]',
      step3Calc,
      'P = ' + roundN(d.P, 3) + ' kN'
    );

    // ── Step 4: L10 basic rating life ─────────────────────────
    var step4Calc;
    if (!isFinite(d.L10)) {
      step4Calc = 'P = 0 \u2192 L10 = \u221E (bearing never fails under zero load)';
    } else {
      var cOverP = roundN(C_rating / d.P, 4);
      step4Calc = 'L10 = (C / P)^p\n'
        + 'L10 = (' + C_rating + ' / ' + roundN(d.P, 3) + ')^' + roundN(bt.p, 3) + '\n'
        + 'L10 = ' + cOverP + '^' + roundN(bt.p, 3) + '\n'
        + 'L10 = ' + roundN(d.L10, 4) + ' million revolutions';
    }
    html += calcStep(4, 'L10 Basic Rating Life',
      '\\[ L10 = (C / P)^p  \, \\u00D7 10\\u2076 rev  \,  \, [result in <em>millions</em> of revolutions] \\]',
      step4Calc,
      isFinite(d.L10) ? 'L10 = ' + roundN(d.L10, 2) + ' M rev' : 'L10 = \u221E'
    );

    // ── Step 5: L10h life in hours ────────────────────────────
    var step5Calc;
    if (!isFinite(d.L10h)) {
      step5Calc = rpm === 0
        ? 'n = 0 RPM \u2192 L10h = \u221E (stationary or very slow rotation)'
        : 'L10 = \u221E \u2192 L10h = \u221E';
    } else {
      var denom = 60 * rpm;
      step5Calc = 'L10h = L10 \u00D7 10\u2076 / (60 \u00D7 n)\n'
        + 'L10h = ' + roundN(d.L10, 4) + ' \u00D7 10\u2076 / (60 \u00D7 ' + rpm + ')\n'
        + 'L10h = ' + Math.round(L10rev).toLocaleString() + ' / ' + denom.toLocaleString() + '\n'
        + 'L10h = ' + roundN(d.L10h, 2) + ' hours';
    }
    html += calcStep(5, 'L10h Life in Operating Hours',
      '\\[ L10h = L10 \\u00D7 10\\u2076 / (60 \\u00D7 n)  \,  \, where n = speed in RPM \\]',
      step5Calc,
      isFinite(d.L10h) ? 'L10h = ' + roundN(d.L10h, 2) + ' hrs' : 'L10h = \u221E'
    );

    // ── Step 6: Reliability adjustment ───────────────────────
    var step6Calc;
    if (!isFinite(d.Lna_h)) {
      step6Calc = 'L10h = \u221E \u2192 Lna = \u221E';
    } else {
      step6Calc = 'Lna = a1 \u00D7 L10h\n'
        + 'At R = ' + rel.label + ': a1 = ' + rel.a1 + '\n'
        + 'Lna = ' + rel.a1 + ' \u00D7 ' + roundN(d.L10h, 2) + '\n'
        + 'Lna = ' + roundN(d.Lna_h, 2) + ' hours';
      if (relIdx === 0) {
        step6Calc += '\n[At 90% reliability a1 = 1.00 \u2192 Lna = L10h]';
      }
    }
    html += calcStep(6, 'Reliability-Adjusted Life Lna',
      'Lna = a1 \u00D7 L10h\n'
      + '<small>a1 = 1.00 (R=90%) | 0.62 (R=95%) | 0.44 (R=97%) | 0.33 (R=98%) | 0.21 (R=99%)</small>',
      step6Calc,
      isFinite(d.Lna_h) ? 'Lna = ' + roundN(d.Lna_h, 2) + ' hrs' : 'Lna = \u221E'
    );

    // ── Step 7: Life in years ─────────────────────────────────
    var step7Calc;
    if (!isFinite(d.lifeYears)) {
      step7Calc = 'L10h = \u221E \u2192 Life in years = \u221E';
    } else {
      var denom = dailyHours * 365;
      step7Calc = 'Years = L10h / (hours per day \u00D7 365)\n'
        + 'Years = ' + roundN(d.L10h, 2) + ' / (' + dailyHours + ' \u00D7 365)\n'
        + 'Years = ' + roundN(d.L10h, 2) + ' / ' + roundN(denom, 1) + '\n'
        + 'Years = ' + roundN(d.lifeYears, 3) + ' years\n'
        + '[Operating hours: ' + dailyHours + ' h/day, 365 days/year]';
    }
    html += calcStep(7, 'Life in Years (' + dailyHours + ' h/day Operation)',
      'Years = L10h / (' + dailyHours + ' \u00D7 365)',
      step7Calc,
      isFinite(d.lifeYears) ? 'Life = ' + roundN(d.lifeYears, 2) + ' yrs' : 'Life = \u221E'
    );

    // ── Step 8: Minimum load verification ────────────────────
    var Pmin = roundN(bt.minLoadFactor * C_rating, 3);
    var step8Calc = 'P_min = k_r \u00D7 C\n'
      + 'P_min = ' + bt.minLoadFactor + ' \u00D7 ' + C_rating + '\n'
      + 'P_min = ' + Pmin + ' kN\n\n'
      + 'Actual equivalent load P = ' + roundN(d.P, 3) + ' kN\n'
      + (d.belowMinLoad
          ? '\u26A0 P (' + roundN(d.P, 3) + ') < P_min (' + Pmin + ') \u2014 SKIDDING RISK!\n   Increase radial load or use a preloaded bearing.'
          : '\u2713 P (' + roundN(d.P, 3) + ') \u2265 P_min (' + Pmin + ') \u2014 Sufficient load, no skidding risk.');
    html += calcStep(8, 'Minimum Load Verification',
      'P_min = k_r \u00D7 C &nbsp;&nbsp;(k_r = ' + bt.minLoadFactor + ' for ' + bt.name + ')',
      step8Calc,
      d.belowMinLoad ? '\u26A0 Below minimum load' : '\u2713 Load adequate'
    );

    return html;
  }

  /* ── Explore diagram drawing ───────────────────────────────── */
  function drawExploreDiagram(concept) {
    clearCanvas();
    drawTitle(concept.name);

    if (concept.id === 'l10-life' || concept.id === 'dynamic-rating') {
      drawBearingCrossSection(220, 230, 90, 40, 8, 10, false);
      ctx.font = '700 18px "Courier New", monospace';
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'center';
      ctx.fillText(concept.formula, 600, 180);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8b9dc3';
      ctx.fillText('p = 3 (ball) or 10/3 (roller)', 600, 210);
      ctx.fillText('C = dynamic load rating, P = equivalent load', 600, 235);
    } else if (concept.id === 'l10h-life') {
      drawBearingCrossSection(220, 230, 90, 40, 8, 10, false);
      ctx.font = '700 18px "Courier New", monospace';
      ctx.fillStyle = '#3ddc84';
      ctx.textAlign = 'center';
      ctx.fillText('L10h = L10 / (60 \u00D7 n)', 600, 180);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.fillText('n = speed in RPM', 600, 210);
      ctx.fillStyle = '#8b9dc3';
      ctx.fillText('Standard life targets:', 600, 245);
      ctx.fillText('Industrial: 20,000-30,000 hrs', 600, 265);
      ctx.fillText('Automotive: 3,000-5,000 hrs', 600, 285);
    } else if (concept.id === 'equiv-load') {
      drawBearingCrossSection(220, 230, 90, 40, 8, 10, false);
      drawArrow(220, 100, 220, 140, '#ff5555', 'Fr');
      drawArrow(80, 230, 130, 230, '#f5c842', 'Fa');
      ctx.font = '700 18px "Courier New", monospace';
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'center';
      ctx.fillText('P = X\u00B7Fr + Y\u00B7Fa', 600, 180);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8b9dc3';
      ctx.fillText('If Fa/Fr \u2264 e: P = Fr', 600, 215);
      ctx.fillText('If Fa/Fr > e: P = X\u00B7Fr + Y\u00B7Fa', 600, 240);
    } else if (concept.id === 'ball-bearings') {
      drawBearingCrossSection(220, 230, 90, 40, 10, 10, false);
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'center';
      ctx.fillText('Ball Bearing', 220, 50);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#42a5f5';
      ctx.fillText('Point contact', 220, H - 40);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'left';
      ctx.fillText('Characteristics:', 450, 120);
      ctx.fillStyle = '#8b9dc3';
      var traits = ['\u2022 Life exponent p = 3', '\u2022 High speed capability', '\u2022 Low friction & noise', '\u2022 Supports radial + axial loads', '\u2022 Most common bearing type'];
      for (var t = 0; t < traits.length; t++) ctx.fillText(traits[t], 460, 150 + t * 24);
    } else if (concept.id === 'roller-bearings') {
      drawBearingCrossSection(220, 230, 90, 40, 12, 14, true);
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'center';
      ctx.fillText('Roller Bearing', 220, 50);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#42a5f5';
      ctx.fillText('Line contact', 220, H - 40);
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'left';
      ctx.fillText('Characteristics:', 450, 120);
      ctx.fillStyle = '#8b9dc3';
      var rTraits = ['\u2022 Life exponent p = 10/3', '\u2022 Higher load capacity', '\u2022 Line contact (more area)', '\u2022 Lower speed limit', '\u2022 Types: cylindrical, tapered, spherical'];
      for (var rt = 0; rt < rTraits.length; rt++) ctx.fillText(rTraits[rt], 460, 150 + rt * 24);
    } else if (concept.id === 'reliability-factor') {
      // Bar chart of a1 factors
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'center';
      ctx.fillText('Reliability Factor a1', W / 2, 60);
      var chartX = 100, chartY = 90, chartW = 650, barW = 70, gap = 30;
      for (var ri = 0; ri < RELIABILITY.length; ri++) {
        var rel = RELIABILITY[ri];
        var bx = chartX + ri * (barW + gap);
        var maxH = 280;
        var bh = rel.a1 * maxH;
        var by = chartY + maxH - bh + 20;
        ctx.fillStyle = ri === 0 ? '#42a5f5' : 'rgba(66,165,245,' + (0.3 + 0.7 * rel.a1) + ')';
        ctx.beginPath();
        ctx.roundRect(bx, by, barW, bh, [4, 4, 0, 0]);
        ctx.fill();
        ctx.font = '700 13px "Courier New", monospace';
        ctx.fillStyle = '#dde3f0';
        ctx.textAlign = 'center';
        ctx.fillText(rel.a1.toString(), bx + barW / 2, by - 8);
        ctx.font = '600 11px "Segoe UI", sans-serif';
        ctx.fillStyle = '#8b9dc3';
        ctx.fillText('R=' + rel.label, bx + barW / 2, chartY + maxH + 38);
      }
    } else if (concept.id === 'adjusted-life') {
      ctx.font = '700 20px "Courier New", monospace';
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'center';
      ctx.fillText('Lna = a1 \u00D7 a2 \u00D7 a3 \u00D7 L10', W / 2, 100);
      var factors = [
        { name: 'a1', title: 'Reliability', desc: '0.21 - 1.0', color: '#42a5f5' },
        { name: 'a2', title: 'Material', desc: '0.7 - 2.0', color: '#3ddc84' },
        { name: 'a3', title: 'Lubrication', desc: '0.1 - 3.0', color: '#f5c842' }
      ];
      var bw = 180, bh2 = 80, gap2 = 30;
      var sx = (W - (3 * bw + 2 * gap2)) / 2;
      for (var fi = 0; fi < factors.length; fi++) {
        var fx = sx + fi * (bw + gap2);
        ctx.fillStyle = '#1f2535';
        ctx.strokeStyle = factors[fi].color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(fx, 160, bw, bh2, 8);
        ctx.fill();
        ctx.stroke();
        ctx.font = '700 14px "Segoe UI", sans-serif';
        ctx.fillStyle = factors[fi].color;
        ctx.textAlign = 'center';
        ctx.fillText(factors[fi].name + ' \u2014 ' + factors[fi].title, fx + bw / 2, 195);
        ctx.font = '600 11px "Segoe UI", sans-serif';
        ctx.fillStyle = '#8b9dc3';
        ctx.fillText('Range: ' + factors[fi].desc, fx + bw / 2, 220);
      }
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8b9dc3';
      ctx.textAlign = 'center';
      ctx.fillText('Modern ISO 281 combines a2 and a3 into a single aISO factor', W / 2, 300);
    } else if (concept.id === 'min-load') {
      drawBearingCrossSection(220, 230, 90, 40, 8, 10, false);
      ctx.font = '700 18px "Courier New", monospace';
      ctx.fillStyle = '#ff5555';
      ctx.textAlign = 'center';
      ctx.fillText('P_min = k_r \u00D7 C', 600, 180);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0';
      ctx.fillText('k_r = 0.01 to 0.03 (bearing type)', 600, 215);
      ctx.fillStyle = '#8b9dc3';
      ctx.fillText('Below minimum load:', 600, 250);
      ctx.fillText('\u2022 Rolling elements skid', 600, 275);
      ctx.fillText('\u2022 Surface damage occurs', 600, 295);
      ctx.fillText('\u2022 Heat generation increases', 600, 315);
    } else {
      // Generic diagram
      drawBearingCrossSection(220, 230, 90, 40, 8, 10, false);
      ctx.font = '700 18px "Courier New", monospace';
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'center';
      ctx.fillText(concept.formula, 600, 200);
      ctx.font = '600 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8b9dc3';
      ctx.fillText('Unit: ' + concept.unit, 600, 230);
    }
  }

  /* ── Practice/Quiz diagrams ────────────────────────────────── */
  function drawPracticeDiagram() {
    drawTitle('Practice Mode \u2014 Solve Bearing Life Problems');
    drawBearingCrossSection(W / 2, 230, 100, 42, 8, 10, false);
    drawArrow(W / 2, 90, W / 2, 128, '#ff5555', 'Fr');
    drawArrow(W / 2 - 110, 230, W / 2 - 60, 230, '#f5c842', 'Fa');
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#8b9dc3';
    ctx.textAlign = 'center';
    ctx.fillText('L10 = (C/P)^p  |  L10h = L10/(60n)  |  P = XFr + YFa  |  Lna = a1\u00B7a2\u00B7a3\u00B7L10', W / 2, H - 15);
  }

  function drawQuizDiagram() {
    drawTitle('Quiz Mode \u2014 Test Your Knowledge');
    drawBearingCrossSection(W / 2, 220, 90, 38, 10, 9, false);
    if (quizQs.length > 0 && quizIdx < quizQs.length) {
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'center';
      ctx.fillText('Question ' + (quizIdx + 1) + ' of ' + quizQs.length, W / 2, H - 30);
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

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate(ts) {
    animTime = ts || 0;

    // Rotate balls based on RPM
    if (mode === 'simulate' && rpm > 0) {
      ballAngle += (rpm / 60) * 0.002;
      if (ballAngle > Math.PI * 2) ballAngle -= Math.PI * 2;
    }

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
    $$('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });

    var simEls = ['sim-panel'];
    var expEls = ['cat-row', 'item-selector', 'item-info'];
    var praEls = ['practice-panel', 'practice-bar'];
    var quiEls = ['quiz-panel', 'quiz-bar', 'quiz-result'];

    simEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'simulate' ? show(el) : hide(el); } });
    expEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'explore' ? show(el) : hide(el); } });
    praEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'practice' ? show(el) : hide(el); } });
    quiEls.forEach(function (id) { var el = $('#' + id); if (el) { m === 'quiz' ? show(el) : hide(el); } });

    // Show/hide canvas for non-simulate modes
    var canvasCard = cvs.closest('.canvas-card');
    if (canvasCard) {
      canvasCard.style.display = '';
    }

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
    var tol = pProblem.tolerance || Math.max(Math.abs(correct) * 0.03, 0.5);
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
     PRESET APPLICATION
     ================================================================ */
  function applyPreset(key) {
    var p = PRESETS[key];
    if (!p) return;

    // 1. Set bearing type first so updateSliderLimits knows the right bounds
    bearingType = p.type;
    $$('#type-tabs .pill').forEach(function(pill) {
      pill.classList.toggle('active', pill.dataset.type === bearingType);
    });

    // 2. Update slider max/min for this bearing type (clamps any stale values)
    updateSliderLimits();

    // 3. Override with exact preset values (always within the type's bounds)
    C_rating = p.C;
    Fr       = p.Fr;
    Fa       = p.Fa;
    rpm      = p.rpm;
    relIdx   = p.rel;

    // Sync slider positions to preset values
    var cs  = $('#c-slider');   if (cs)  cs.value  = C_rating;
    var frs = $('#fr-slider');  if (frs) frs.value = Fr;
    var fas = $('#fa-slider');  if (fas) fas.value  = Fa;
    var rs  = $('#rpm-slider'); if (rs)  rs.value   = rpm;

    // Reliability tabs
    $$('#rel-tabs .pill').forEach(function(pill) {
      pill.classList.toggle('active', parseInt(pill.dataset.rel) === relIdx);
    });

    // Highlight active preset button
    $$('#preset-btns .preset-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.preset === key);
    });

    updateFaGroup();
    syncSteppers();
    updateReadouts();
    draw();
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

    /* Bearing type tabs */
    $$('#type-tabs .pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        bearingType = pill.dataset.type;
        $$('#type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.type === bearingType); });
        $$('#preset-btns .preset-btn').forEach(function(b) { b.classList.remove('active'); });
        updateSliderLimits();   // clamp values + update slider max for new type
        updateFaGroup();
        syncSteppers();
        updateReadouts();
        draw();
      });
    });

    /* Reliability tabs */
    $$('#rel-tabs .pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        relIdx = parseInt(pill.dataset.rel);
        $$('#rel-tabs .pill').forEach(function (p) { p.classList.toggle('active', parseInt(p.dataset.rel) === relIdx); });
        updateReadouts();
        draw();
      });
    });

    /* Daily hours input */
    var dhInput = $('#daily-hours');
    if (dhInput) {
      dhInput.addEventListener('input', function () {
        var v = parseFloat(this.value);
        if (!isNaN(v) && v > 0 && v < 24) {
          dailyHours = v;
          updateReadouts();
          draw();
        }
      });
      dhInput.addEventListener('change', function () {
        var v = parseFloat(this.value);
        if (isNaN(v) || v <= 0 || v >= 24) {
          dailyHours = 8;
          this.value = 8;
        } else {
          dailyHours = v;
        }
        updateReadouts();
        draw();
      });
    }

    /* Unit toggle */
    $$('#unit-tabs .pill').forEach(function(pill) {
      pill.addEventListener('click', function() {
        unitSI = pill.dataset.unit === 'si';
        $$('#unit-tabs .pill').forEach(function(p) {
          p.classList.toggle('active', p.dataset.unit === (unitSI ? 'si' : 'imperial'));
        });
        syncSteppers();
        updateReadouts();
        draw();
      });
    });

    /* Presets */
    $$('#preset-btns .preset-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        applyPreset(btn.dataset.preset);
      });
    });

    /* ── Slider + Stepper helpers ──────────────────────────────── */
    // min/max are read live from slider.min / slider.max so they
    // automatically respect updateSliderLimits() without re-wiring.
    function makeSliderStepper(sliderId, numId, decId, incId, getter, setter, siStep) {
      var slider = $('#' + sliderId);
      var num    = $('#' + numId);
      var dec    = $('#' + decId);
      var inc    = $('#' + incId);
      var isRPM  = sliderId === 'rpm-slider';

      function sMin() { return parseInt(slider.min) || 0; }
      function sMax() { return parseInt(slider.max); }
      function clearPreset() { $$('#preset-btns .preset-btn').forEach(function(b) { b.classList.remove('active'); }); }

      // Slider drag
      slider.addEventListener('input', function() {
        setter(parseInt(this.value));
        clearPreset();
        syncSteppers(); updateReadouts(); draw();
      });

      // [−] button — step by siStep in SI
      dec.addEventListener('click', function() {
        var newVal = clamp(getter() - siStep, sMin(), sMax());
        setter(newVal); slider.value = newVal;
        clearPreset(); syncSteppers(); updateReadouts(); draw();
      });

      // [+] button — step by siStep in SI
      inc.addEventListener('click', function() {
        var newVal = clamp(getter() + siStep, sMin(), sMax());
        setter(newVal); slider.value = newVal;
        clearPreset(); syncSteppers(); updateReadouts(); draw();
      });

      // Text input — value is in displayed units; convert back to SI
      num.addEventListener('change', function() {
        var raw = parseFloat(this.value);
        if (isNaN(raw)) { syncSteppers(); return; }
        var siVal;
        if (isRPM) {
          siVal = clamp(Math.round(raw / siStep) * siStep, sMin(), sMax());
        } else {
          siVal = clamp(Math.round(fromD(raw)), sMin(), sMax());
        }
        setter(siVal); slider.value = siVal;
        clearPreset(); syncSteppers(); updateReadouts(); draw();
      });
    }

    makeSliderStepper('c-slider',   'c-num',   'c-dec',   'c-inc',
      function(){ return C_rating; }, function(v){ C_rating = v; }, 5);
    makeSliderStepper('fr-slider',  'fr-num',  'fr-dec',  'fr-inc',
      function(){ return Fr; },       function(v){ Fr = v; },       5);
    makeSliderStepper('fa-slider',  'fa-num',  'fa-dec',  'fa-inc',
      function(){ return Fa; },       function(v){ Fa = v; },       2);
    makeSliderStepper('rpm-slider', 'rpm-num', 'rpm-dec', 'rpm-inc',
      function(){ return rpm; },      function(v){ rpm = v; },      50);

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
        if (pAnswered) newPracticeProblem();
        else checkPractice();
      }
    });

    /* Show Me Calculations — canvas button hit-test */
    cvs.addEventListener('click', function(e) {
      if (mode !== 'simulate') return;
      var rect = cvs.getBoundingClientRect();
      var mx = (e.clientX - rect.left) * (W / rect.width);
      var my = (e.clientY - rect.top)  * (H / rect.height);
      var bty = TBL.ty + TBL.hdrH + TBL.n * TBL.rh;
      if (mx >= TBL.tx && mx <= TBL.tx + TBL.tw && my >= bty && my <= bty + TBL.btnH) {
        openCalcModal();
      }
    });

    var closeBtn  = $('#calc-modal-close');
    var calcModal = $('#calc-modal');

    if (closeBtn) closeBtn.addEventListener('click', closeCalcModal);

    // Click on backdrop (outside modal-box) closes modal
    if (calcModal) {
      calcModal.addEventListener('click', function (e) {
        if (e.target === calcModal) closeCalcModal();
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && calcModal && calcModal.classList.contains('active')) {
        closeCalcModal();
      }
    });
  }

  /* ================================================================
     CANVAS RESIZE HANDLER
     ================================================================ */
  function handleResize() {
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
    updateSliderLimits();   // set correct slider max for initial bearing type
    updateFaGroup();
    syncSteppers();
    updateReadouts();
    running = true;
    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
