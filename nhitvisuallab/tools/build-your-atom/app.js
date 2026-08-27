(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     BUILD YOUR ATOM — interactive Bohr-model atom builder
     ═══════════════════════════════════════════════════════════════════ */

  var $ = function (id) { return document.getElementById(id); };

  /* ─── Motion tokens (v21) — mirror of CSS :root tokens ─── */
  var MOTION = { xs: 80, s: 160, m: 220, l: 320, xl: 500, stagger: 30 };
  var EASE = {
    out:        function (t) { return 1 - Math.pow(1 - t, 3); },
    outQuart:   function (t) { return 1 - Math.pow(1 - t, 4); },
    spring:     function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    inOutSine:  function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; }
  };
  function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* prefers-reduced-motion — live (re-reads on OS toggle without reload) */
  var PRM = false;
  try {
    var prmQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    PRM = prmQ.matches;
    if (prmQ.addEventListener) prmQ.addEventListener('change', function (e) { PRM = e.matches; });
    else if (prmQ.addListener) prmQ.addListener(function (e) { PRM = e.matches; });
  } catch (err) { PRM = false; }

  /* ─── Element data (Z=1..118) ─────────────────────────────────────
     Each entry: [symbol, name, standardAtomicMass, mostStableMassNumber,
     legacyNMin, legacyNMax, category, period, group]
     category codes:  h=hydrogen, am=alkali metal, ae=alkaline earth,
                      tm=transition metal, pt=post-transition metal,
                      mm=metalloid, nm=non-metal, hg=halogen, ng=noble gas,
                      ln=lanthanide, ac=actinide
     Columns 4–5 (legacy stability band) are SUPERSEDED by the explicit
     STABLE_N table below and are no longer read anywhere.                 */
  var ELEMENTS = [
    /* 1  */ ['H',  'Hydrogen',     1.008,    1,   0,  1, 'h',  1, 1],
    /* 2  */ ['He', 'Helium',       4.0026,   4,   1,  2, 'ng', 1, 18],
    /* 3  */ ['Li', 'Lithium',      6.94,     7,   3,  4, 'am', 2, 1],
    /* 4  */ ['Be', 'Beryllium',    9.0122,   9,   5,  5, 'ae', 2, 2],
    /* 5  */ ['B',  'Boron',        10.81,    11,  5,  6, 'mm', 2, 13],
    /* 6  */ ['C',  'Carbon',       12.011,   12,  6,  7, 'nm', 2, 14],
    /* 7  */ ['N',  'Nitrogen',     14.007,   14,  7,  8, 'nm', 2, 15],
    /* 8  */ ['O',  'Oxygen',       15.999,   16,  8, 10, 'nm', 2, 16],
    /* 9  */ ['F',  'Fluorine',     18.998,   19, 10, 10, 'hg', 2, 17],
    /* 10 */ ['Ne', 'Neon',         20.180,   20, 10, 12, 'ng', 2, 18],
    /* 11 */ ['Na', 'Sodium',       22.990,   23, 12, 12, 'am', 3, 1],
    /* 12 */ ['Mg', 'Magnesium',    24.305,   24, 12, 14, 'ae', 3, 2],
    /* 13 */ ['Al', 'Aluminium',    26.982,   27, 14, 14, 'pt', 3, 13],
    /* 14 */ ['Si', 'Silicon',      28.085,   28, 14, 16, 'mm', 3, 14],
    /* 15 */ ['P',  'Phosphorus',   30.974,   31, 16, 16, 'nm', 3, 15],
    /* 16 */ ['S',  'Sulfur',       32.06,    32, 16, 20, 'nm', 3, 16],
    /* 17 */ ['Cl', 'Chlorine',     35.45,    35, 18, 20, 'hg', 3, 17],
    /* 18 */ ['Ar', 'Argon',        39.948,   40, 18, 22, 'ng', 3, 18],
    /* 19 */ ['K',  'Potassium',    39.098,   39, 20, 22, 'am', 4, 1],
    /* 20 */ ['Ca', 'Calcium',      40.078,   40, 20, 26, 'ae', 4, 2],
    /* 21 */ ['Sc', 'Scandium',     44.956,   45, 24, 24, 'tm', 4, 3],
    /* 22 */ ['Ti', 'Titanium',     47.867,   48, 24, 28, 'tm', 4, 4],
    /* 23 */ ['V',  'Vanadium',     50.942,   51, 28, 28, 'tm', 4, 5],
    /* 24 */ ['Cr', 'Chromium',     51.996,   52, 26, 30, 'tm', 4, 6],
    /* 25 */ ['Mn', 'Manganese',    54.938,   55, 30, 30, 'tm', 4, 7],
    /* 26 */ ['Fe', 'Iron',         55.845,   56, 28, 32, 'tm', 4, 8],
    /* 27 */ ['Co', 'Cobalt',       58.933,   59, 32, 32, 'tm', 4, 9],
    /* 28 */ ['Ni', 'Nickel',       58.693,   58, 30, 36, 'tm', 4, 10],
    /* 29 */ ['Cu', 'Copper',       63.546,   63, 34, 36, 'tm', 4, 11],
    /* 30 */ ['Zn', 'Zinc',         65.38,    64, 34, 40, 'tm', 4, 12],
    /* 31 */ ['Ga', 'Gallium',      69.723,   69, 38, 40, 'pt', 4, 13],
    /* 32 */ ['Ge', 'Germanium',    72.630,   74, 38, 44, 'mm', 4, 14],
    /* 33 */ ['As', 'Arsenic',      74.922,   75, 42, 42, 'mm', 4, 15],
    /* 34 */ ['Se', 'Selenium',     78.971,   80, 40, 48, 'nm', 4, 16],
    /* 35 */ ['Br', 'Bromine',      79.904,   79, 44, 46, 'hg', 4, 17],
    /* 36 */ ['Kr', 'Krypton',      83.798,   84, 42, 50, 'ng', 4, 18],
    /* 37 */ ['Rb', 'Rubidium',     85.468,   85, 48, 50, 'am', 5, 1],
    /* 38 */ ['Sr', 'Strontium',    87.62,    88, 46, 50, 'ae', 5, 2],
    /* 39 */ ['Y',  'Yttrium',      88.906,   89, 50, 50, 'tm', 5, 3],
    /* 40 */ ['Zr', 'Zirconium',    91.224,   90, 50, 54, 'tm', 5, 4],
    /* 41 */ ['Nb', 'Niobium',      92.906,   93, 52, 52, 'tm', 5, 5],
    /* 42 */ ['Mo', 'Molybdenum',   95.95,    98, 50, 58, 'tm', 5, 6],
    /* 43 */ ['Tc', 'Technetium',   98,       98, 1,  0,  'tm', 5, 7],
    /* 44 */ ['Ru', 'Ruthenium',    101.07,   102,52, 60, 'tm', 5, 8],
    /* 45 */ ['Rh', 'Rhodium',      102.91,   103,58, 58, 'tm', 5, 9],
    /* 46 */ ['Pd', 'Palladium',    106.42,   106,56, 64, 'tm', 5, 10],
    /* 47 */ ['Ag', 'Silver',       107.87,   107,60, 62, 'tm', 5, 11],
    /* 48 */ ['Cd', 'Cadmium',      112.41,   114,58, 68, 'tm', 5, 12],
    /* 49 */ ['In', 'Indium',       114.82,   113,64, 66, 'pt', 5, 13],
    /* 50 */ ['Sn', 'Tin',          118.71,   120,62, 74, 'pt', 5, 14],
    /* 51 */ ['Sb', 'Antimony',     121.76,   121,70, 72, 'mm', 5, 15],
    /* 52 */ ['Te', 'Tellurium',    127.60,   126,68, 78, 'mm', 5, 16],
    /* 53 */ ['I',  'Iodine',       126.90,   127,74, 74, 'hg', 5, 17],
    /* 54 */ ['Xe', 'Xenon',        131.29,   132,70, 82, 'ng', 5, 18],
    /* 55 */ ['Cs', 'Caesium',      132.91,   133,78, 78, 'am', 6, 1],
    /* 56 */ ['Ba', 'Barium',       137.33,   138,74, 82, 'ae', 6, 2],
    /* 57 */ ['La', 'Lanthanum',    138.91,   139,82, 82, 'ln', 6, 3],
    /* 58 */ ['Ce', 'Cerium',       140.12,   140,78, 84, 'ln', 6, 3],
    /* 59 */ ['Pr', 'Praseodymium', 140.91,   141,82, 82, 'ln', 6, 3],
    /* 60 */ ['Nd', 'Neodymium',    144.24,   142,82, 90, 'ln', 6, 3],
    /* 61 */ ['Pm', 'Promethium',   145,      145, 1,  0, 'ln', 6, 3],
    /* 62 */ ['Sm', 'Samarium',     150.36,   152,82, 92, 'ln', 6, 3],
    /* 63 */ ['Eu', 'Europium',     151.96,   153,88, 90, 'ln', 6, 3],
    /* 64 */ ['Gd', 'Gadolinium',   157.25,   158,90, 96, 'ln', 6, 3],
    /* 65 */ ['Tb', 'Terbium',      158.93,   159,94, 94, 'ln', 6, 3],
    /* 66 */ ['Dy', 'Dysprosium',   162.50,   164,90,100, 'ln', 6, 3],
    /* 67 */ ['Ho', 'Holmium',      164.93,   165,98, 98, 'ln', 6, 3],
    /* 68 */ ['Er', 'Erbium',       167.26,   166,94,102, 'ln', 6, 3],
    /* 69 */ ['Tm', 'Thulium',      168.93,   169,100,100,'ln', 6, 3],
    /* 70 */ ['Yb', 'Ytterbium',    173.05,   174,98,106, 'ln', 6, 3],
    /* 71 */ ['Lu', 'Lutetium',     174.97,   175,104,104,'ln', 6, 3],
    /* 72 */ ['Hf', 'Hafnium',      178.49,   180,102,108,'tm', 6, 4],
    /* 73 */ ['Ta', 'Tantalum',     180.95,   181,108,108,'tm', 6, 5],
    /* 74 */ ['W',  'Tungsten',     183.84,   184,106,112,'tm', 6, 6],
    /* 75 */ ['Re', 'Rhenium',      186.21,   185,110,112,'tm', 6, 7],
    /* 76 */ ['Os', 'Osmium',       190.23,   192,108,116,'tm', 6, 8],
    /* 77 */ ['Ir', 'Iridium',      192.22,   193,114,116,'tm', 6, 9],
    /* 78 */ ['Pt', 'Platinum',     195.08,   195,112,120,'tm', 6, 10],
    /* 79 */ ['Au', 'Gold',         196.97,   197,118,118,'tm', 6, 11],
    /* 80 */ ['Hg', 'Mercury',      200.59,   202,116,124,'tm', 6, 12],
    /* 81 */ ['Tl', 'Thallium',     204.38,   205,122,124,'pt', 6, 13],
    /* 82 */ ['Pb', 'Lead',         207.2,    208,122,126,'pt', 6, 14],
    /* 83 */ ['Bi', 'Bismuth',      208.98,   209,126,126,'pt', 6, 15],
    /* 84 */ ['Po', 'Polonium',     209,      209, 1,  0, 'pt', 6, 16],
    /* 85 */ ['At', 'Astatine',     210,      210, 1,  0, 'hg', 6, 17],
    /* 86 */ ['Rn', 'Radon',        222,      222, 1,  0, 'ng', 6, 18],
    /* 87 */ ['Fr', 'Francium',     223,      223, 1,  0, 'am', 7, 1],
    /* 88 */ ['Ra', 'Radium',       226,      226, 1,  0, 'ae', 7, 2],
    /* 89 */ ['Ac', 'Actinium',     227,      227, 1,  0, 'ac', 7, 3],
    /* 90 */ ['Th', 'Thorium',      232.04,   232, 1,  0, 'ac', 7, 3],
    /* 91 */ ['Pa', 'Protactinium', 231.04,   231, 1,  0, 'ac', 7, 3],
    /* 92 */ ['U',  'Uranium',      238.03,   238, 1,  0, 'ac', 7, 3],
    /* 93 */ ['Np', 'Neptunium',    237,      237, 1,  0, 'ac', 7, 3],
    /* 94 */ ['Pu', 'Plutonium',    244,      244, 1,  0, 'ac', 7, 3],
    /* 95 */ ['Am', 'Americium',    243,      243, 1,  0, 'ac', 7, 3],
    /* 96 */ ['Cm', 'Curium',       247,      247, 1,  0, 'ac', 7, 3],
    /* 97 */ ['Bk', 'Berkelium',    247,      247, 1,  0, 'ac', 7, 3],
    /* 98 */ ['Cf', 'Californium',  251,      251, 1,  0, 'ac', 7, 3],
    /* 99 */ ['Es', 'Einsteinium',  252,      252, 1,  0, 'ac', 7, 3],
    /* 100*/ ['Fm', 'Fermium',      257,      257, 1,  0, 'ac', 7, 3],
    /* 101*/ ['Md', 'Mendelevium',  258,      258, 1,  0, 'ac', 7, 3],
    /* 102*/ ['No', 'Nobelium',     259,      259, 1,  0, 'ac', 7, 3],
    /* 103*/ ['Lr', 'Lawrencium',   266,      266, 1,  0, 'ac', 7, 3],
    /* 104*/ ['Rf', 'Rutherfordium',267,      267, 1,  0, 'tm', 7, 4],
    /* 105*/ ['Db', 'Dubnium',      268,      268, 1,  0, 'tm', 7, 5],
    /* 106*/ ['Sg', 'Seaborgium',   269,      269, 1,  0, 'tm', 7, 6],
    /* 107*/ ['Bh', 'Bohrium',      270,      270, 1,  0, 'tm', 7, 7],
    /* 108*/ ['Hs', 'Hassium',      269,      269, 1,  0, 'tm', 7, 8],
    /* 109*/ ['Mt', 'Meitnerium',   278,      278, 1,  0, 'tm', 7, 9],
    /* 110*/ ['Ds', 'Darmstadtium', 281,      281, 1,  0, 'tm', 7, 10],
    /* 111*/ ['Rg', 'Roentgenium',  282,      282, 1,  0, 'tm', 7, 11],
    /* 112*/ ['Cn', 'Copernicium',  285,      285, 1,  0, 'tm', 7, 12],
    /* 113*/ ['Nh', 'Nihonium',     286,      286, 1,  0, 'pt', 7, 13],
    /* 114*/ ['Fl', 'Flerovium',    289,      289, 1,  0, 'pt', 7, 14],
    /* 115*/ ['Mc', 'Moscovium',    290,      290, 1,  0, 'pt', 7, 15],
    /* 116*/ ['Lv', 'Livermorium',  293,      293, 1,  0, 'pt', 7, 16],
    /* 117*/ ['Ts', 'Tennessine',   294,      294, 1,  0, 'hg', 7, 17],
    /* 118*/ ['Og', 'Oganesson',    294,      294, 1,  0, 'ng', 7, 18]
  ];

  function E(z) {
    if (z < 1 || z > 118 || !isFinite(z)) return null;
    return ELEMENTS[z - 1];
  }

  /* ─── Stable isotopes — explicit neutron counts per element ────────
     STABLE_N[Z] = list of neutron numbers N whose isotope has never been
     observed to decay (NNDC/IAEA). Replaces the old [min,max] band model,
     which wrongly marked dozens of in-band radioactive isotopes stable
     (Cl-36, K-40, Fe-55, Ni-63, Rb-87, In-115, …).
     Empty list = no stable isotope (Tc, Pm, Bi and everything above).
     Note: Bi-209, long taught as stable, was shown in 2003 to alpha-decay
     with a half-life of 2.0×10¹⁹ years — so Pb (Z=82) is the heaviest
     element with stable isotopes. Very-long-lived nuclides whose decay HAS
     been observed (Ca-48, Se-82, Cd-113, Te-130, U-238 …) are excluded.  */
  var STABLE_N = {
    1:[0,1], 2:[1,2], 3:[3,4], 4:[5], 5:[5,6], 6:[6,7], 7:[7,8], 8:[8,9,10], 9:[10],
    10:[10,11,12], 11:[12], 12:[12,13,14], 13:[14], 14:[14,15,16], 15:[16],
    16:[16,17,18,20], 17:[18,20], 18:[18,20,22], 19:[20,22], 20:[20,22,23,24,26],
    21:[24], 22:[24,25,26,27,28], 23:[28], 24:[26,28,29,30], 25:[30],
    26:[28,30,31,32], 27:[32], 28:[30,32,33,34,36], 29:[34,36], 30:[34,36,37,38,40],
    31:[38,40], 32:[38,40,41,42], 33:[42], 34:[40,42,43,44,46], 35:[44,46],
    36:[44,46,47,48,50], 37:[48], 38:[46,48,49,50], 39:[50], 40:[50,51,52,54],
    41:[52], 42:[50,52,53,54,55,56], 43:[], 44:[52,54,55,56,57,58,60], 45:[58],
    46:[56,58,59,60,62,64], 47:[60,62], 48:[58,60,62,63,64,66], 49:[64],
    50:[62,64,65,66,67,68,69,70,72,74], 51:[70,72], 52:[68,70,71,72,73,74], 53:[74],
    54:[72,74,75,76,77,78,80], 55:[78], 56:[76,78,79,80,81,82], 57:[82],
    58:[78,80,82,84], 59:[82], 60:[82,83,85,86,88], 61:[], 62:[82,87,88,90,92],
    63:[90], 64:[90,91,92,93,94,96], 65:[94], 66:[90,92,94,95,96,97,98], 67:[98],
    68:[94,96,98,99,100,102], 69:[100], 70:[98,100,101,102,103,104,106], 71:[104],
    72:[104,105,106,107,108], 73:[108], 74:[108,109,110,112], 75:[110],
    76:[111,112,113,114,116], 77:[114,116], 78:[114,116,117,118,120], 79:[118],
    80:[116,118,119,120,121,122,124], 81:[122,124], 82:[122,124,125,126], 83:[]
  };
  function stableNs(z)         { return STABLE_N[z] || []; }
  function hasStableIsotope(z) { return stableNs(z).length > 0; }

  /* ─── Electron shell configurations — real ground states ────────────
     Filled via the Aufbau (Madelung) sub-shell order with the standard
     d/f-block exceptions (Cr, Cu, Nb, Mo, Ru, Rh, Pd, Ag, La, Ce, Gd, Pt,
     Au, Ac–Np, Cm, Lr). This replaces the old naive 2,8,8,18,… row-fill,
     which produced wrong configurations for every transition metal
     (e.g. iron showed 2,8,8,8 instead of the correct 2,8,14,2).
     shellsFor(e) uses the ground state of the NEUTRAL element with e
     electrons — for ions this equals the isoelectronic species (Na⁺ with
     10 e⁻ → 2,8 like neon), the standard school treatment.               */
  var SUBSHELLS = [            /* [principal n, capacity] in filling order  */
    [1,2],[2,2],[2,6],[3,2],[3,6],[4,2],[3,10],[4,6],[5,2],[4,10],[5,6],
    [6,2],[4,14],[5,10],[6,6],[7,2],[5,14],[6,10],[7,6]
  ]; /* idx: 0:1s 1:2s 2:2p 3:3s 4:3p 5:4s 6:3d 7:4p 8:5s 9:4d 10:5p
             11:6s 12:4f 13:5d 14:6p 15:7s 16:5f 17:6d 18:7p               */
  var CONFIG_TWEAKS = {        /* Z: [[fromIdx, toIdx, electrons], …]       */
    24:[[5,6,1]],  29:[[5,6,1]],                       /* Cr, Cu   4s→3d */
    41:[[8,9,1]],  42:[[8,9,1]],  44:[[8,9,1]],        /* Nb Mo Ru 5s→4d */
    45:[[8,9,1]],  46:[[8,9,2]],  47:[[8,9,1]],        /* Rh Pd Ag 5s→4d */
    57:[[12,13,1]], 58:[[12,13,1]], 64:[[12,13,1]],    /* La Ce Gd 4f→5d */
    78:[[11,13,1]], 79:[[11,13,1]],                    /* Pt Au    6s→5d */
    89:[[16,17,1]], 90:[[16,17,2]], 91:[[16,17,1]],    /* Ac Th Pa 5f→6d */
    92:[[16,17,1]], 93:[[16,17,1]], 96:[[16,17,1]],    /* U Np Cm  5f→6d */
    103:[[17,18,1]]                                    /* Lr       6d→7p */
  };
  var SHELL_CONFIGS = (function () {
    var out = [[]];
    for (var e = 1; e <= 118; e++) {
      var fill = [], left = e, i;
      for (i = 0; i < SUBSHELLS.length && left > 0; i++) {
        var take = Math.min(SUBSHELLS[i][1], left);
        fill[i] = take; left -= take;
      }
      var tweaks = CONFIG_TWEAKS[e];
      if (tweaks) for (i = 0; i < tweaks.length; i++) {
        fill[tweaks[i][0]] = (fill[tweaks[i][0]] || 0) - tweaks[i][2];
        fill[tweaks[i][1]] = (fill[tweaks[i][1]] || 0) + tweaks[i][2];
      }
      var shells = [];
      for (i = 0; i < SUBSHELLS.length; i++) {
        if (!fill[i]) continue;
        var n = SUBSHELLS[i][0];
        shells[n - 1] = (shells[n - 1] || 0) + fill[i];
      }
      while (shells.length && !shells[shells.length - 1]) shells.pop();
      out.push(shells);
    }
    return out;
  })();

  /* True per-shell maxima (2n² rule) — used for the occupancy bars */
  var SHELL_MAX = [2, 8, 18, 32, 50, 72, 98];

  function shellsFor(eCount) {
    if (!eCount || eCount < 1) return [];
    if (eCount > 118) eCount = 118;
    return SHELL_CONFIGS[eCount].slice();
  }

  function configString(eCount) {
    var s = shellsFor(eCount);
    if (!s.length) return '—';
    return s.join(', ');
  }

  /* ─── State ───────────────────────────────────────────────────── */
  var state = {
    p: 0, n: 0, e: 0,
    mode: 'simulate',
    practice: { active: false, targetZ: 0, score: 0, total: 0 },
    quiz:     { active: false, idx: 0, score: 0, qs: [], answered: false },
    audioCtx: null, soundOn: true,
    electronPhase: 0,
    animSpeed: 1, frozen: false, paused: false,
    orbit: true, spin: true, showShellTable: true,
    spinPhase: 0,
    seenZ: {},                  // identity-reveal de-dup set
    lastIdRevealT: 0,           // debounce id-reveal at 350 ms
    chargeAuraT0: 0,            // capped charge-aura pulse
    stabilityTarget: 0,         // 0 = stable, 1 = unstable
    stabilityT: 1,              // current interpolated 0-1
    stabilityT0: 0,             // start of last flip
    shellAnim: {},              // {n: { t0, dir:'in'|'out' }}
    settleT0: 0,                // octet-completion settle moment
    canvasPulses: [],           // transient identity-reveal canvas pulses
    escapingElectrons: [],      // ion-formation escape trajectories
    toggles: { shellnum: true, valence: false, elabels: false, cloud: false, stability: false }
  };

  /* Fly-in particles — animated from bin to atom center, then incremented for real. */
  var flyingDOM = [];   // [{el, sx, sy, tx, ty, t0, dur, type, action}]

  /* History for nucleus particle positions (cluster animation) */
  var nucleusParticles = []; // {type, x, y, vx, vy, target}

  /* ─── Audio (Web Audio API) ───────────────────────────────────── */
  function audio() {
    if (!state.soundOn) return null;
    if (!state.audioCtx) {
      try { state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (err) { return null; }
    }
    return state.audioCtx;
  }
  function tone(freq, dur, type, vol) {
    var ctx = audio(); if (!ctx) return;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.value = vol || 0.06;
    o.connect(g); g.connect(ctx.destination);
    var t = ctx.currentTime;
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.1));
    o.start(t); o.stop(t + (dur || 0.1) + 0.02);
  }
  function playAddProton()   { tone(220, 0.10, 'triangle', 0.08); }
  function playAddNeutron()  { tone(140, 0.10, 'sine',     0.07); }
  function playAddElectron() { tone(880, 0.06, 'sine',     0.05); setTimeout(function(){ tone(1320, 0.08, 'sine', 0.04); }, 40); }
  function playRemove()      { tone(180, 0.10, 'square',   0.04); }
  function playMatch()       { tone(660, 0.12, 'sine',     0.07); setTimeout(function(){ tone(990, 0.16, 'sine', 0.07); }, 100); }
  function playSuccess()     { tone(880, 0.12, 'sine', 0.1); setTimeout(function(){ tone(1100, 0.15, 'sine', 0.1); }, 120); setTimeout(function(){ tone(1320, 0.2, 'sine', 0.1); }, 260); }
  function playError()       { tone(300, 0.25, 'sawtooth', 0.07); }

  /* ─── Canvas ─────────────────────────────────────────────────── */
  var canvas, ctx;
  var canvasW = 800, canvasH = 540;

  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    var wrap = canvas.parentElement;                 // .canvas-wrap
    var canvasCard = wrap.parentElement;             // .canvas-card
    if (!canvasCard) return;
    var w = Math.max(320, wrap.clientWidth || 320);
    var h;
    var isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);

    if (isFs) {
      // Fullscreen — the wrap is flex:1 inside the card and gets all remaining vertical space.
      // Use it directly so the canvas claims everything available.
      h = Math.max(320, wrap.clientHeight || 600);
    } else {
      // Standard view — push canvas height aggressively, capped only by viewport.
      var aspectH = Math.round(w * 0.78);                          // even taller aspect (was 0.72)
      var vh = window.innerHeight || 800;
      var reservedAbove = 0;
      var strip = document.getElementById('atom-strip');
      var actionBar = canvasCard.querySelector('.action-bar');
      var ctrlToggles = canvasCard.querySelector('.canvas-toggles');
      if (strip)       reservedAbove += strip.offsetHeight + 6;
      if (actionBar)   reservedAbove += actionBar.offsetHeight + 4;
      if (ctrlToggles) reservedAbove += ctrlToggles.offsetHeight + 4;
      var appHead = document.querySelector('header');
      var ctrlsBar = document.querySelector('#sec-simulate .controls-bar, .mode-section.active .controls-bar, .controls-bar');
      var siteNav = document.querySelector('.site-nav');
      if (appHead)  reservedAbove += appHead.offsetHeight;
      if (ctrlsBar) reservedAbove += ctrlsBar.offsetHeight;
      if (siteNav)  reservedAbove += siteNav.offsetHeight;
      var bins = document.querySelector('.particle-bins');
      var binsH = bins ? bins.offsetHeight + 6 : 100;
      var availH = vh - reservedAbove - binsH - 8;                 // breathing room tightened 24 → 8
      if (availH < 360) availH = 360;
      h = Math.min(aspectH, 880, availH);                          // max cap raised 760 → 880
      if (h < 360) h = 360;                                        // min raised 340 → 360
    }

    canvas.width  = Math.round(w * (window.devicePixelRatio || 1));
    canvas.height = Math.round(h * (window.devicePixelRatio || 1));
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    var dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvasW = w; canvasH = h;
  }

  function rebuildNucleusParticles() {
    var total = state.p + state.n;
    // Truncate if too many
    if (nucleusParticles.length > total) {
      nucleusParticles.length = total;
    }
    // Make sure ratios match
    var hasP = 0, hasN = 0;
    for (var i = 0; i < nucleusParticles.length; i++) {
      if (nucleusParticles[i].type === 'p') hasP++; else hasN++;
    }
    // Add missing protons
    while (hasP < state.p) {
      nucleusParticles.push(newNucleusParticle('p'));
      hasP++;
    }
    while (hasN < state.n) {
      nucleusParticles.push(newNucleusParticle('n'));
      hasN++;
    }
    // Remove excess
    if (hasP > state.p) {
      for (var j = nucleusParticles.length - 1; j >= 0 && hasP > state.p; j--) {
        if (nucleusParticles[j].type === 'p') { nucleusParticles.splice(j, 1); hasP--; }
      }
    }
    if (hasN > state.n) {
      for (var k = nucleusParticles.length - 1; k >= 0 && hasN > state.n; k--) {
        if (nucleusParticles[k].type === 'n') { nucleusParticles.splice(k, 1); hasN--; }
      }
    }
    // Interleave p / n so the cluster looks visually mixed instead of segregated.
    var protons = [], neutrons = [];
    for (var ii = 0; ii < nucleusParticles.length; ii++) {
      (nucleusParticles[ii].type === 'p' ? protons : neutrons).push(nucleusParticles[ii]);
    }
    nucleusParticles.length = 0;
    var P = protons.length, N = neutrons.length;
    var ratio = (P + N) > 0 ? P / (P + N) : 0;
    var pIdx = 0, nIdx = 0;
    while (pIdx < P || nIdx < N) {
      // Pick proton when its share is "behind"
      var pShare = (pIdx + nIdx) > 0 ? pIdx / (pIdx + nIdx) : 0;
      if (pIdx < P && (nIdx >= N || pShare < ratio)) { nucleusParticles.push(protons[pIdx++]); }
      else { nucleusParticles.push(neutrons[nIdx++]); }
    }
  }

  function newNucleusParticle(type) {
    // Start from a random edge for "fly-in" animation
    var ang = Math.random() * Math.PI * 2;
    var R = 320;
    return {
      type: type,
      x: Math.cos(ang) * R,
      y: Math.sin(ang) * R,
      vx: 0, vy: 0
    };
  }

  function isStable() {
    if (state.p < 1 || state.p > 118) return false;
    return stableNs(state.p).indexOf(state.n) !== -1;
  }

  function currentElement() {
    if (state.p < 1 || state.p > 118) return null;
    return E(state.p);
  }

  function charge() { return state.p - state.e; }
  function massNumber() { return state.p + state.n; }

  /* ─── DRAWING ─────────────────────────────────────────────────── */
  function draw() {
    if (!ctx) return;
    var W = canvasW, H = canvasH;
    var cx = W * 0.5, cy = H * 0.5;

    ctx.clearRect(0, 0, W, H);

    // Subtle grid + glow
    drawBackground(W, H);

    // Compute nucleus radius FIRST so shells can sit outside it
    var nucRadius = computeNucleusRadius();

    // Compute shell radii — innermost shell always sits outside the nucleus
    var shells = shellsFor(state.e);
    var nShells = shells.length;
    var maxR = Math.min(W, H) * 0.46;
    var minR = Math.max(Math.min(W, H) * 0.13, nucRadius + 22);
    if (minR > maxR - 20) minR = Math.max(maxR - 20, nucRadius + 18);
    var shellR = [];
    if (nShells > 0) {
      for (var i = 0; i < nShells; i++) {
        var t = nShells === 1 ? 0 : i / (nShells - 1);
        shellR.push(minR + t * (maxR - minR));
      }
    }

    // Draw shells (orbit rings) — with spring-in / collapse-out animation
    var valenceIdx = nShells - 1;
    var nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    for (var s = 0; s < nShells; s++) {
      var r = shellR[s];
      // Per-shell animation state lookup
      var sa = state.shellAnim[s + 1];
      var sScale = 1, sAlpha = 1;
      if (sa && !PRM) {
        var saDur = sa.dir === 'in' ? MOTION.l : 260;
        var kk = clamp01((nowMs - sa.t0) / saDur);
        if (sa.dir === 'in') {
          // Spring overshoot clamped at small widths to avoid clipping
          var oshoot = (W < 600) ? 0.02 : 0.05;
          sScale = 0.85 + EASE.spring(kk) * (0.15 + oshoot - 0.05);
          if (sScale < 0.85) sScale = 0.85;
          sAlpha = Math.min(1, kk * 1.6);
          if (kk >= 1) { state.shellAnim[s + 1] = null; }
        } else {
          sScale = 1 - 0.08 * EASE.out(kk);
          sAlpha = 1 - kk;
          if (kk >= 1) { state.shellAnim[s + 1] = null; continue; }
        }
      }
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalAlpha = sAlpha;
      var rEff = r * sScale;
      var isValence = state.toggles.valence && s === valenceIdx;
      ctx.strokeStyle = isValence ? 'rgba(245, 200, 66, 0.85)' : 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = isValence ? 1.8 : 1.2;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.arc(0, 0, rEff, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      // Override the shell radius in shellR[] downstream uses so electrons follow the same scale
      shellR[s] = rEff;
      if (isValence) {
        // soft halo
        ctx.strokeStyle = 'rgba(245, 200, 66, 0.18)';
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
      }
      // Shell labels (toggleable)
      if (state.toggles.shellnum) {
        var labelAng = -Math.PI * 0.18 + s * 0.13;
        var lx = Math.cos(labelAng) * rEff;
        var ly = Math.sin(labelAng) * rEff;
        ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
        var lw = 24, lh = 14;
        ctx.fillRect(lx - lw/2, ly - lh/2, lw, lh);
        ctx.fillStyle = isValence ? 'rgba(245, 200, 66, 0.95)' : 'rgba(192, 132, 252, 0.95)';
        ctx.font = '700 10px Segoe UI, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('n' + (s + 1), lx, ly);
      }
      ctx.restore();
    }

    // Draw nucleus
    drawNucleus(cx, cy);

    // Draw electrons in shells (or as a probability cloud if toggle on)
    var phase = state.electronPhase;
    electronHitPoints.length = 0;
    var eIndex = 0;
    for (var sh = 0; sh < nShells; sh++) {
      var count = shells[sh];
      var rr = shellR[sh];
      if (state.toggles.cloud) {
        // Draw a translucent cloud band instead of discrete dots
        ctx.save();
        var alpha = Math.min(0.6, 0.12 + count * 0.025);
        var grad = ctx.createRadialGradient(cx, cy, rr - 8, cx, cy, rr + 8);
        grad.addColorStop(0, 'rgba(34, 211, 238, 0)');
        grad.addColorStop(0.5, 'rgba(34, 211, 238, ' + alpha + ')');
        grad.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, rr + 8, 0, Math.PI * 2);
        ctx.arc(cx, cy, rr - 8, 0, Math.PI * 2, true);
        ctx.fill();
        ctx.restore();
        // Count badge near the ring
        if (state.toggles.shellnum) {
          ctx.save();
          ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
          ctx.font = '700 11px Courier New, monospace';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText(count + 'e⁻', cx + rr + 14, cy - 10 - sh * 14);
          ctx.restore();
        }
        eIndex += count;
      } else {
        var speed = 0.6 / (sh + 1.6);
        var angOff = phase * speed + sh * 0.7;
        for (var k = 0; k < count; k++) {
          var ang = angOff + (k / count) * Math.PI * 2;
          var ex = cx + Math.cos(ang) * rr;
          var ey = cy + Math.sin(ang) * rr;
          drawElectron(ex, ey, state.toggles.elabels ? (eIndex + 1) : null);
          electronHitPoints.push({ x: ex, y: ey, idx: eIndex });
          eIndex++;
        }
      }
    }

    // Label in corner — "Empty" / element name / "Undefined"
    drawHud(W, H);
  }

  function drawBackground(W, H) {
    // Radial vignette already from CSS background; add a faint grid
    ctx.save();
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.05)';
    ctx.lineWidth = 1;
    var step = 40;
    for (var x = 0; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  function drawNucleus(cx, cy) {
    var total = state.p + state.n;
    if (total === 0) {
      // Empty atom — pulsing centre dot
      ctx.save();
      var pulse = 0.6 + 0.4 * Math.sin(state.electronPhase * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, ' + (0.25 * pulse) + ')';
      ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(168, 85, 247, ' + (0.6 * pulse) + ')';
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(221, 227, 240, 0.4)';
      ctx.font = '600 13px Segoe UI, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Drop particles here', cx, cy + 50);
      ctx.restore();
      return;
    }

    // Nucleon radius — kept large for small atoms, gently shrinks for heavy ones
    var R = nucleonRadius(total);

    // Target positions: pack particles in an overlapping (close-packed) cluster
    var cluster = clusterPositions(total, R);

    // Shake offset for unstable
    var shakeX = 0, shakeY = 0;
    if (state.p > 0 && !isStable() && state.n + state.p > 0) {
      shakeX = (Math.sin(state.electronPhase * 6) + Math.cos(state.electronPhase * 9.3)) * 1.6;
      shakeY = (Math.sin(state.electronPhase * 7.7) + Math.cos(state.electronPhase * 4.1)) * 1.6;
    }

    // Sort particles to alternate p/n in cluster
    rebuildNucleusParticles();

    // Animate toward target
    for (var i = 0; i < nucleusParticles.length; i++) {
      var p = nucleusParticles[i];
      var t = cluster[i];
      var dx = (cx + t.x + shakeX) - p.x;
      var dy = (cy + t.y + shakeY) - p.y;
      p.vx = p.vx * 0.7 + dx * 0.15;
      p.vy = p.vy * 0.7 + dy * 0.15;
      p.x += p.vx; p.y += p.vy;
    }

    // Draw nucleus glow — interpolated stable↔unstable color (500 ms lerp)
    ctx.save();
    var glowR = R * Math.sqrt(total) * 1.6 + 12;
    var nowGlow = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    // Interpolate stabilityT toward stabilityTarget over 500 ms.
    var stableTarget = isStable() ? 0 : 1;
    if (stableTarget !== state.stabilityTarget) {
      state.stabilityTarget = stableTarget;
      state.stabilityT0 = nowGlow;
    }
    var lerpDur = PRM ? 1 : 500;
    var lerpK = clamp01((nowGlow - state.stabilityT0) / lerpDur);
    var ease = EASE.inOutSine(lerpK);
    // Current T: smoothly migrate toward target
    state.stabilityT = lerp(1 - stableTarget, stableTarget, ease);
    var stabAmt = state.stabilityT; // 0 = stable green, 1 = unstable red
    var gR = Math.round(lerp(61, 255, stabAmt));
    var gG = Math.round(lerp(220, 85, stabAmt));
    var gB = Math.round(lerp(132, 85, stabAmt));
    var glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    if (state.p === 0) {
      glow.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
      glow.addColorStop(1, 'rgba(168, 85, 247, 0)');
    } else {
      glow.addColorStop(0, 'rgba(' + gR + ',' + gG + ',' + gB + ',0.18)');
      glow.addColorStop(1, 'rgba(' + gR + ',' + gG + ',' + gB + ',0)');
    }
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // ── Charge aura (capped ~3 cycles ≈ 5 s, then settle to static) ──
    if (state.p > 0) {
      var chg = charge();
      if (chg !== 0) {
        ctx.save();
        var auraR = (R * Math.sqrt(total) * 1.45) + 8;
        var auraCol = chg > 0 ? '255,180,80' : '120,180,255';
        var auraAlpha = 0.17;
        // Pulse for ~5 s (3 cycles @ 0.6 Hz) after a charge change, then static.
        var pulseAge = (nowGlow - (state.chargeAuraT0 || 0)) / 1000;
        if (!PRM && state.chargeAuraT0 && pulseAge < 5) {
          auraAlpha = 0.17 + 0.05 * Math.sin(pulseAge * 2 * Math.PI * 0.6);
        }
        // When unstable (stab > 0.5), suppress charge aura so signals don't compete
        if (stabAmt > 0.5) auraAlpha *= (1 - (stabAmt - 0.5) * 1.4);
        if (auraAlpha > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, auraR, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(' + auraCol + ',' + auraAlpha + ')';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // ── Identity-reveal canvas pulses (drawn on top of glow, behind nucleons) ──
    if (state.canvasPulses && state.canvasPulses.length) {
      var stillAlive = [];
      for (var pi2 = 0; pi2 < state.canvasPulses.length; pi2++) {
        var pp = state.canvasPulses[pi2];
        var pk = (nowGlow - pp.t0) / pp.dur;
        if (pk >= 1) continue;
        var pr = R * Math.sqrt(Math.max(total, 1)) * 1.4 * (1 + 0.8 * EASE.out(pk));
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, pr, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168, 85, 247,' + (0.35 * (1 - pk)) + ')';
        ctx.fill();
        ctx.restore();
        stillAlive.push(pp);
      }
      state.canvasPulses = stillAlive;
    }

    // Draw particles (protons + neutrons)
    for (var pi = 0; pi < nucleusParticles.length; pi++) {
      var part = nucleusParticles[pi];
      drawNucleon(part.x, part.y, R, part.type);
    }
  }

  function drawNucleon(x, y, R, type) {
    ctx.save();
    var grad = ctx.createRadialGradient(x - R*0.4, y - R*0.4, R*0.1, x, y, R);
    if (type === 'p') {
      grad.addColorStop(0, '#ffd1ad');
      grad.addColorStop(0.55, '#ff7a4d');
      grad.addColorStop(1, '#c84a1d');
    } else {
      grad.addColorStop(0, '#dbe0ee');
      grad.addColorStop(0.55, '#9aa3b8');
      grad.addColorStop(1, '#5c647a');
    }
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
    // rim
    ctx.strokeStyle = type === 'p' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // +/0 label only when the cluster is small enough to be readable
    if (R >= 11 && (state.p + state.n) <= 12) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '700 ' + Math.round(R * 1.1) + 'px Courier New, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(type === 'p' ? '+' : '0', x, y + 1);
    }
    ctx.restore();
  }

  function drawElectron(x, y, label) {
    ctx.save();
    // glow
    var glow = ctx.createRadialGradient(x, y, 0, x, y, 14);
    glow.addColorStop(0, 'rgba(34, 211, 238, 0.6)');
    glow.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
    // body
    var g = ctx.createRadialGradient(x - 2, y - 2, 0.5, x, y, 6);
    g.addColorStop(0, '#bbf7ff');
    g.addColorStop(0.6, '#22d3ee');
    g.addColorStop(1, '#0891b2');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // Self-spin — bright crescent that rotates around the electron's own axis
    if (state.spin) {
      var sp = state.spinPhase + (x * 0.013 + y * 0.011); // unique phase offset per electron
      ctx.save();
      ctx.translate(x, y); ctx.rotate(sp);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(2.2, -1.6, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(-2.6, 1.4, 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // minus sign
    ctx.fillStyle = 'rgba(13, 17, 23, 0.9)';
    ctx.fillRect(x - 3, y - 0.7, 6, 1.4);
    if (label != null) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(13, 17, 23, 0.95)';
      ctx.lineWidth = 2.5;
      ctx.font = '700 9px Courier New, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeText(String(label), x, y - 11);
      ctx.fillText(String(label), x, y - 11);
    }
    ctx.restore();
  }

  function drawHud(W, H) {
    // All HUD info now rendered in the HTML .atom-strip above the canvas
    // (see updateAtomStrip). Only the on-canvas shell-occupancy table remains.
    if (state.showShellTable && state.e > 0) {
      drawShellTable(W, H);
    }
  }

  /* Accessibility — mirror the canvas-only HUD into a screen-reader live region */
  function updateSRLive() {
    var sr = document.getElementById('sr-live');
    if (!sr) return;
    if (state.p === 0) { sr.textContent = 'Empty atom — drop a proton to start.'; return; }
    if (state.p > 118 || !currentElement()) { sr.textContent = 'Beyond known elements (Z = ' + state.p + ').'; return; }
    var el = E(state.p);
    var c = charge();
    var stab = isStable() ? 'stable' : (!hasStableIsotope(state.p) ? 'radioactive' : 'unstable');
    var shells = shellsFor(state.e);
    var shellTxt = shells.length ? 'Shells: ' + shells.join(', ') + '.' : '';
    var chargeTxt = c === 0 ? 'Neutral.' : (c > 0 ? 'Cation ' + c + '+.' : 'Anion ' + c + '.');
    sr.textContent = el[1] + ' isotope ' + massNumber() + '. Z = ' + state.p +
      ', N = ' + state.n + ', electrons = ' + state.e + '. ' +
      'Standard atomic weight ' + el[2].toFixed(3) + ' u. ' +
      chargeTxt + ' Nucleus ' + stab + '. ' + shellTxt;
  }

  /* Update the HTML strip above the canvas (called from onChange) */
  function updateAtomStrip() {
    var el = currentElement();
    var c = charge();
    var name = document.getElementById('as-name');
    var ch   = document.getElementById('as-charge');
    var pEl = document.getElementById('as-p');
    var nEl = document.getElementById('as-n');
    var eEl = document.getElementById('as-e');
    var amu = document.getElementById('as-amu');
    var aN  = document.getElementById('as-A');
    var iso = document.getElementById('as-isotope');
    var st  = document.getElementById('as-stability');
    if (!name) return;

    if (pEl) pEl.textContent = state.p;
    if (nEl) nEl.textContent = state.n;
    if (eEl) eEl.textContent = state.e;

    if (state.p === 0) {
      name.textContent = 'Empty';
      ch.textContent = 'Drop a proton to start';
      ch.className = 'as-charge';
      amu.textContent = '—'; aN.textContent = '—';
      iso.textContent = '—';
      st.hidden = true;
      return;
    }
    if (state.p > 118 || !el) {
      name.textContent = 'Beyond Z = 118';
      ch.textContent = 'Theoretical';
      ch.className = 'as-charge neg';
      amu.textContent = '—'; aN.textContent = String(massNumber());
      iso.textContent = '?';
      st.hidden = false; st.className = 'as-stability unstable'; st.textContent = 'THEORETICAL';
      return;
    }

    // Normal case
    name.textContent = el[1];
    var chargeText = c === 0 ? 'Neutral atom' : (c > 0 ? 'Cation (+' + c + ')' : 'Anion (' + c + ')');
    ch.textContent = chargeText;
    ch.className = 'as-charge ' + (c === 0 ? 'neutral' : (c > 0 ? 'pos' : 'neg'));

    amu.textContent = el[2].toFixed(3) + ' u';
    aN.textContent = String(massNumber()) + ' (this isotope)';

    var note = sup(massNumber()) + sub(state.p) + el[0];
    if (c !== 0) note += c > 0 ? (c === 1 ? '⁺' : sup(c) + '⁺') : (c === -1 ? '⁻' : sup(-c) + '⁻');
    iso.textContent = note;

    var stable = isStable();
    var noStable = !hasStableIsotope(state.p);
    var badge = noStable ? 'RADIOACTIVE' : (stable ? 'STABLE' : 'UNSTABLE');
    st.hidden = false;
    st.className = 'as-stability ' + ((stable && !noStable) ? 'stable' : 'unstable');
    st.textContent = badge;
  }

  function drawShellTable(W, H) {
    var shells = shellsFor(state.e);
    if (!shells.length) return;
    var rowH = 18, headerH = 22, padX = 12;
    var tw = 168, th = headerH + shells.length * rowH + 8;
    var x0 = 8, y0 = H - th - 8;

    ctx.save();
    // backdrop
    ctx.fillStyle = 'rgba(15, 19, 30, 0.82)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.45)';
    ctx.lineWidth = 1;
    roundRect(x0, y0, tw, th, 10, true, true);

    // header
    ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.fillRect(x0 + 1, y0 + 1, tw - 2, headerH);
    ctx.fillStyle = '#c084fc';
    ctx.font = '800 11px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('SHELL OCCUPANCY', x0 + padX, y0 + headerH / 2);

    // rows: n=k | count | bar
    ctx.font = '700 11px Courier New, monospace';
    for (var i = 0; i < shells.length; i++) {
      var ry = y0 + headerH + 4 + i * rowH;
      // shell number — compact "n1", "n2" instead of "n = 1"
      ctx.fillStyle = '#dde3f0';
      ctx.textAlign = 'left';
      ctx.fillText('n' + (i + 1), x0 + padX, ry + rowH / 2);
      // count
      ctx.fillStyle = '#22d3ee';
      ctx.textAlign = 'right';
      ctx.fillText(shells[i] + ' e⁻', x0 + tw - padX - 50, ry + rowH / 2);
      // mini-bar
      var maxCap = SHELL_MAX[i] || 32;
      var barW = 40, barX = x0 + tw - padX - barW + 2;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.15)';
      ctx.fillRect(barX, ry + rowH / 2 - 3, barW, 6);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(barX, ry + rowH / 2 - 3, Math.max(2, (shells[i] / maxCap) * barW), 6);
      // valence marker
      if (i === shells.length - 1) {
        ctx.strokeStyle = '#f5c842';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(barX, ry + rowH / 2 - 3, barW, 6);
      }
    }
    ctx.restore();
  }

  function roundRect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function nucleonRadius(total) {
    // Constant-ish nucleon size; shrinks gently for very heavy nuclei.
    if (total <= 1)   return 13;
    if (total <= 4)   return 12;
    if (total <= 12)  return 11;
    if (total <= 30)  return 10;
    if (total <= 60)  return 8.5;
    if (total <= 120) return 7;
    if (total <= 200) return 6;
    return 5.2;
  }

  function clusterSpacing(total) {
    // Multiplied by R to get ring-to-ring distance.
    // Smaller values → tighter overlap (looks like a packed cluster).
    if (total <= 7)   return 1.55;   // small atoms: overlap slightly so balls touch
    if (total <= 30)  return 1.45;
    if (total <= 100) return 1.30;
    return 1.20;                     // heavy nuclei: dense overlapping cluster
  }

  function clusterPositions(n, R) {
    // Hexagonal close-packed concentric-ring layout with overlap.
    var positions = [];
    if (n === 0) return positions;
    positions.push({ x: 0, y: 0 });
    var i = 1;
    var ring = 1;
    var spacing = clusterSpacing(n);
    while (i < n) {
      // Hex packing: each ring k holds 6k particles
      var perRing = 6 * ring;
      if (perRing > n - i) perRing = n - i;
      var rr = ring * R * spacing;
      for (var k = 0; k < perRing && i < n; k++) {
        var ang = (k / perRing) * Math.PI * 2 + ring * 0.35;
        positions.push({ x: Math.cos(ang) * rr, y: Math.sin(ang) * rr });
        i++;
      }
      ring++;
    }
    return positions;
  }

  function computeNucleusRadius() {
    var total = state.p + state.n;
    if (total === 0) return 0;
    var R = nucleonRadius(total);
    var spacing = clusterSpacing(total);
    // Find outermost ring used
    var rings = 0, placed = 1;
    while (placed < total) { rings++; placed += 6 * rings; }
    var outer = rings * R * spacing + R;   // include particle radius
    return outer;
  }

  /* ─── Animation loop ──────────────────────────────────────────── */
  var rafId = null;
  var lastT = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
  function loop(now) {
    if (typeof now !== 'number') now = lastT;
    var dt = (now - lastT) / 1000;
    if (dt > 0.033) dt = 0.033;   // cap at ~2 frames (tab-blur returns shouldn't jump)
    if (dt < 0) dt = 0;
    lastT = now;

    var hidden = (typeof document !== 'undefined' && document.hidden);
    var paused = state.frozen || state.paused;
    if (!paused && !hidden) {
      // Frame-rate-independent phase advance — 60fps baseline rates
      if (state.orbit) state.electronPhase += 0.96 * state.animSpeed * dt;       // was 0.016/frame → 0.96/s
      if (state.spin)  state.spinPhase     += 3.60 * state.animSpeed * dt;       // was 0.06/frame  → 3.6/s
    }
    stepFlyingParticles();
    if (!hidden) draw();
    rafId = requestAnimationFrame(loop);
  }

  // Reset lastT when tab becomes visible so the first post-blur frame has dt≈0
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && typeof performance !== 'undefined' && performance.now) {
        lastT = performance.now();
      }
    });
  }

  /* Update floating fly-in particles every frame */
  function stepFlyingParticles() {
    if (!flyingDOM.length) return;
    var now = performance.now();
    for (var i = flyingDOM.length - 1; i >= 0; i--) {
      var f = flyingDOM[i];
      var t = (now - f.t0) / f.dur;
      if (t >= 1) {
        // Land: commit the action (increment or decrement)
        try { if (f.el && f.el.parentElement) document.body.removeChild(f.el); } catch (er) {}
        flyingDOM.splice(i, 1);
        if (f.action === 'add') addParticleCore(f.type);
        else if (f.action === 'remove') removeParticleCore(f.type);
        continue;
      }
      // Eased trajectory (cubic ease-in for "shot toward target" feel)
      var eased = 1 - Math.pow(1 - t, 2);
      var x = f.sx + (f.tx - f.sx) * eased;
      var y = f.sy + (f.ty - f.sy) * eased;
      // Slight arc — pull up midway
      var arc = -Math.sin(t * Math.PI) * 50;
      f.el.style.left = x + 'px';
      f.el.style.top  = (y + arc) + 'px';
      // Rotate trail to match motion vector
      var dx = (f.tx - f.sx), dy = (f.ty - f.sy);
      var ang = Math.atan2(dy, dx);
      var trail = f.el.querySelector('.fly-trail');
      if (trail) trail.style.transform = 'translate(-100%, -50%) rotate(' + (ang * 180 / Math.PI) + 'deg)';
      // Scale (shrinks slightly as it nears nucleus)
      var sc = 1 - t * 0.25;
      f.el.style.transform = 'translate(-50%, -50%) scale(' + sc + ')';
    }
  }

  function launchFlyingParticle(type, action, sourceEl) {
    if (!sourceEl) { (action === 'add' ? addParticleCore : removeParticleCore)(type); return; }
    // Prevent unbounded growth if user mashes buttons faster than the animation lands.
    if (flyingDOM.length >= 24) {
      // Force-land the oldest one immediately so its action commits.
      var oldest = flyingDOM.shift();
      try { if (oldest.el && oldest.el.parentElement) document.body.removeChild(oldest.el); } catch (e) {}
      if (oldest.action === 'add') addParticleCore(oldest.type);
      else if (oldest.action === 'remove') removeParticleCore(oldest.type);
    }
    var srcRect = sourceEl.getBoundingClientRect();
    var sx = srcRect.left + srcRect.width / 2;
    var sy = srcRect.top + srcRect.height / 2;
    var cRect = canvas.getBoundingClientRect();
    var tx = cRect.left + cRect.width / 2;
    var ty = cRect.top + cRect.height / 2;
    // For "remove" the particle flies OUT from the canvas to the bin (reverse)
    if (action === 'remove') { var tmpX = sx, tmpY = sy; sx = tx; sy = ty; tx = tmpX; ty = tmpY; }
    var el = document.createElement('div');
    el.className = 'fly-particle ' + ({p:'proton',n:'neutron',e:'electron'})[type];
    if (action === 'remove') el.classList.add('outgoing');
    var symbol = ({p:'+', n:'0', e:'−'})[type];
    el.innerHTML = '<span class="fly-trail"></span>' + symbol;
    el.style.left = sx + 'px';
    el.style.top  = sy + 'px';
    document.body.appendChild(el);
    flyingDOM.push({ el: el, sx: sx, sy: sy, tx: tx, ty: ty, t0: performance.now(), dur: 480, type: type, action: action });
  }

  /* ─── Particle add/remove ─────────────────────────────────────── */
  /* Public API (used by keyboard, periodic-table click, drag-drop, presets) — direct increment, no animation. */
  function addParticle(type)    { addParticleCore(type); }
  function removeParticle(type) { removeParticleCore(type); }

  /* Core: actually mutate state + play sound (called either directly OR by fly-in arrival) */
  function addParticleCore(type) {
    if (type === 'p') {
      if (state.p >= 118) { playError(); return; }
      state.p++; playAddProton();
    } else if (type === 'n') {
      if (state.n >= 200) { playError(); return; }
      state.n++; playAddNeutron();
    } else if (type === 'e') {
      if (state.e >= 118) { playError(); return; }
      var prev = state.e;
      state.e++;
      var prevShells = shellsFor(prev).length;
      var newShells = shellsFor(state.e).length;
      if (newShells > prevShells) {
        // Spring-in the new shell
        state.shellAnim[newShells] = { t0: performance.now(), dir: 'in' };
        setTimeout(function () { tone(1500, 0.18, 'sine', 0.05); }, 60);
      }
      playAddElectron();
    }
    onChange();
  }
  function removeParticleCore(type) {
    if (type === 'p' && state.p > 0) { state.p--; playRemove(); onChange(); }
    else if (type === 'n' && state.n > 0) { state.n--; playRemove(); onChange(); }
    else if (type === 'e' && state.e > 0) {
      var prevE = state.e;
      var prevSh = shellsFor(prevE).length;
      state.e--;
      var newSh = shellsFor(state.e).length;
      if (newSh < prevSh) {
        // Collapse the just-emptied shell
        state.shellAnim[prevSh] = { t0: performance.now(), dir: 'out' };
      }
      playRemove(); onChange();
    }
  }

  /* Animated wrapper (bin button click) — launches fly-in particle, particle's arrival triggers core */
  function animatedAdd(type, sourceEl) {
    if (type === 'p' && state.p >= 118) { playError(); return; }
    if (type === 'n' && state.n >= 200) { playError(); return; }
    if (type === 'e' && state.e >= 118) { playError(); return; }
    launchFlyingParticle(type, 'add', sourceEl);
    // Tiny pre-sound to confirm input received
    tone(1200, 0.04, 'sine', 0.03);
    // Pulse the bin button briefly
    if (sourceEl && sourceEl.classList) {
      sourceEl.classList.add('pulse');
      setTimeout(function () { sourceEl.classList.remove('pulse'); }, 350);
    }
  }
  function animatedRemove(type, sourceEl) {
    if (type === 'p' && state.p <= 0) { playError(); return; }
    if (type === 'n' && state.n <= 0) { playError(); return; }
    if (type === 'e' && state.e <= 0) { playError(); return; }
    launchFlyingParticle(type, 'remove', sourceEl);
    tone(450, 0.04, 'sine', 0.03);
    if (sourceEl && sourceEl.classList) {
      sourceEl.classList.add('pulse');
      setTimeout(function () { sourceEl.classList.remove('pulse'); }, 350);
    }
  }

  function resetAtom() {
    state.p = 0; state.n = 0; state.e = 0;
    nucleusParticles.length = 0;
    prevMatchZ = 0;
    onChange();
    playRemove();
  }

  var prevMatchZ = 0;
  var prevCharge = 0;
  var prevStatVals = { p: 0, n: 0, e: 0, A: 0 };
  function onChange() {
    var nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
    updateBinCounts();
    updateInfoPanel();
    updatePT();
    updateConfigRow();
    renderPropsPanel();
    renderIsotopePanel();
    renderIsoChips();
    updateAtomStrip();
    updateSRLive();

    // Flash stat-cells whose value changed
    flashStatIfChanged('stat-p',      state.p,        prevStatVals, 'p');
    flashStatIfChanged('stat-n',      state.n,        prevStatVals, 'n');
    flashStatIfChanged('stat-e',      state.e,        prevStatVals, 'e');
    flashStatIfChanged('stat-mass',   massNumber(),   prevStatVals, 'A');

    // Match sound + identity reveal (debounced, gated on PRM)
    var nowZ = (state.p >= 1 && state.p <= 118) ? state.p : 0;
    if (nowZ && nowZ !== prevMatchZ) {
      playMatch();
      var strip = document.getElementById('atom-strip');
      if (strip) {
        strip.classList.remove('flash');
        void strip.offsetWidth;
        strip.classList.add('flash');
      }
      // Identity-reveal anticipation + spring + canvas pulse — once per new Z, debounced 350 ms
      if (!PRM && (nowMs - state.lastIdRevealT) > 350) {
        state.lastIdRevealT = nowMs;
        var firstSee = !state.seenZ[nowZ];
        state.seenZ[nowZ] = true;
        // DOM keyframe pulse on atom-strip name + element-card symbol
        var es = document.getElementById('atom-strip');
        if (es) { es.classList.remove('id-reveal'); void es.offsetWidth; es.classList.add('id-reveal'); }
        var ec = document.getElementById('element-card');
        if (ec) { ec.classList.remove('id-reveal'); void ec.offsetWidth; ec.classList.add('id-reveal'); }
        // Canvas radial pulse — only on first sighting of this element (stronger reveal)
        if (firstSee) {
          state.canvasPulses.push({ t0: nowMs, dur: 500 });
        }
      }
      // Re-arm pt-match keyframe on every Z change so the cap-3 animation runs each time
      var matchCell = document.querySelector('.pt-cell.match');
      if (matchCell) { matchCell.classList.remove('settled'); }
    }
    prevMatchZ = nowZ;

    // Charge aura — trigger pulse window when net charge crosses zero or changes sign
    var nowChg = charge();
    if (nowChg !== prevCharge && nowChg !== 0) {
      state.chargeAuraT0 = nowMs;
    }
    prevCharge = nowChg;

    if (state.practice.active) checkPracticeAuto();
  }

  /* Stat-cell flash helper */
  function flashStatIfChanged(id, val, store, key) {
    if (store[key] !== val) {
      store[key] = val;
      var el = document.getElementById(id);
      if (!el || PRM) return;
      var cell = el.parentElement;
      if (!cell) return;
      cell.classList.remove('stat-flash');
      void cell.offsetWidth;
      cell.classList.add('stat-flash');
    }
  }

  /* ─── DOM updates ─────────────────────────────────────────────── */
  function updateBinCounts() {
    ['p', 'n', 'e'].forEach(function (k) {
      var cell = $('count-' + k);
      if (cell && !cell.classList.contains('editing')) cell.textContent = state[k];
    });
  }

  function updateInfoPanel() {
    var el = currentElement();
    var card = $('element-card');
    var symEl = $('ec-symbol');
    var nameEl = $('ec-name');
    var nameSubEl = $('ec-name-sub');
    var zEl = $('ec-z');
    var massEl = $('ec-mass');
    var notationEl = $('ec-notation');

    if (state.p === 0) {
      card.className = 'element-card undefined';
      symEl.textContent = 'Empty';
      symEl.className = 'ec-symbol undefined';
      nameEl.textContent = 'No nucleus';
      nameSubEl.textContent = 'Drop a proton to start';
      zEl.textContent = 'Z = 0';
      massEl.textContent = '';
      notationEl.textContent = '—';
    } else if (state.p > 118) {
      card.className = 'element-card undefined';
      symEl.textContent = '?';
      symEl.className = 'ec-symbol undefined';
      nameEl.textContent = 'Beyond known elements';
      nameSubEl.textContent = 'Heaviest known is Z = 118 (Og)';
      zEl.textContent = 'Z = ' + state.p;
      massEl.textContent = 'A = ' + massNumber();
      notationEl.textContent = '?';
    } else {
      card.className = 'element-card matched';
      symEl.className = 'ec-symbol';
      symEl.textContent = el[0];
      nameEl.textContent = el[1];
      nameSubEl.textContent = elementCategoryName(el[6]);
      zEl.textContent = 'Z = ' + state.p;
      massEl.textContent = 'A = ' + massNumber();
      // Isotope notation: ᴬ_Z X^±n
      var c = charge();
      var chargeSup = c === 0 ? '' : (c > 0 ? (c === 1 ? '⁺' : sup(c) + '⁺') : (c === -1 ? '⁻' : sup(-c) + '⁻'));
      notationEl.textContent = sup(massNumber()) + sub(state.p) + el[0] + chargeSup;
    }

    // Stats
    setStat('stat-p', state.p, 'proton');
    setStat('stat-n', state.n, 'neutron');
    setStat('stat-e', state.e, 'electron');
    setStat('stat-mass', massNumber() || '—', 'gold');
    // Standard atomic mass (textbook decimal value)
    if (state.p >= 1 && state.p <= 118) {
      var elx = E(state.p);
      setStat('stat-amu', elx[2].toFixed(3) + ' u', 'gold');
    } else {
      setStat('stat-amu', '—', '');
    }

    var c = charge();
    var cText = c === 0 ? '0 (neutral)' : (c > 0 ? '+' + c + ' (cation)' : c + ' (anion)');
    var cCls = c === 0 ? 'charge neutral' : (c > 0 ? 'charge pos' : 'charge neg');
    setStat('stat-charge', cText, cCls);

    if (state.p === 0) {
      setStat('stat-stable', '—', '');
    } else if (state.p > 118) {
      setStat('stat-stable', 'Theoretical', 'unstable');
    } else {
      var stable = isStable();
      var noStableIsotopes = !hasStableIsotope(state.p);
      if (noStableIsotopes) {
        setStat('stat-stable', 'Radioactive', 'unstable');
      } else {
        setStat('stat-stable', stable ? 'Stable' : 'Unstable', stable ? 'stable' : 'unstable');
      }
    }
  }

  function setStat(id, val, cls) {
    var n = $(id);
    if (!n) return;
    n.textContent = val;
    n.className = 'sc-val ' + (cls || '');
  }

  function sup(n) {
    var map = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','+':'⁺' };
    return String(n).split('').map(function(c){ return map[c] || c; }).join('');
  }
  function sub(n) {
    var map = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉' };
    return String(n).split('').map(function(c){ return map[c] || c; }).join('');
  }

  function elementCategoryName(c) {
    var map = {
      h: 'Hydrogen', am: 'Alkali metal', ae: 'Alkaline earth metal',
      tm: 'Transition metal', pt: 'Post-transition metal',
      mm: 'Metalloid', nm: 'Reactive non-metal',
      hg: 'Halogen', ng: 'Noble gas',
      ln: 'Lanthanide', ac: 'Actinide'
    };
    return map[c] || '—';
  }

  function updateConfigRow() {
    var row = $('config-row');
    if (state.e === 0) {
      row.innerHTML = '<span class="cl">No electrons</span>';
      return;
    }
    var s = shellsFor(state.e);
    var html = '';
    for (var i = 0; i < s.length; i++) {
      if (i > 0) html += ' <span class="cl">,</span> ';
      html += '<span title="Shell n=' + (i + 1) + '">' + s[i] + '</span>';
    }
    row.innerHTML = '<span class="cl">Shells: </span>' + html;
  }

  /* Periodic table positions (period, group). Group 3 in periods 6/7 is split into lanth/actinide rows. */
  var PT_LAYOUT = (function () {
    var grid = {}; // key 'r,c' -> z
    // periods 1-3
    grid['1,1']  = 1;  grid['1,18'] = 2;
    grid['2,1']  = 3;  grid['2,2']  = 4;
    var ne = 5;
    for (var c = 13; c <= 18; c++) grid['2,' + c] = ne++;
    grid['3,1']  = 11; grid['3,2']  = 12;
    var nm = 13;
    for (var c2 = 13; c2 <= 18; c2++) grid['3,' + c2] = nm++;
    // period 4
    var z4 = 19;
    for (var g4 = 1; g4 <= 18; g4++) grid['4,' + g4] = z4++;
    // period 5
    var z5 = 37;
    for (var g5 = 1; g5 <= 18; g5++) grid['5,' + g5] = z5++;
    // period 6: 55, 56, then La at row6 col3 (we'll mark La/Ac as a special cell that opens the row)
    grid['6,1'] = 55; grid['6,2'] = 56; grid['6,3'] = 57; // La as placeholder marker for lanthanides
    var z6 = 72;
    for (var g6 = 4; g6 <= 18; g6++) grid['6,' + g6] = z6++;
    // period 7
    grid['7,1'] = 87; grid['7,2'] = 88; grid['7,3'] = 89; // Ac placeholder
    var z7 = 104;
    for (var g7 = 4; g7 <= 18; g7++) grid['7,' + g7] = z7++;
    // Lanthanides row (row 8) — Ce(58)..Lu(71) at cols 3..17 (15 elements -> cols 4..18 actually). Use cols 4..18.
    var zL = 58;
    for (var cL = 4; cL <= 18; cL++) grid['8,' + cL] = zL++;
    // Actinides row (row 9) — Th(90)..Lr(103) at cols 4..18
    var zA = 90;
    for (var cA = 4; cA <= 18; cA++) grid['9,' + cA] = zA++;
    return grid;
  })();

  function buildPT() {
    var pt = $('pt-mini');
    var html = '';
    for (var r = 1; r <= 9; r++) {
      for (var c = 1; c <= 18; c++) {
        var z = PT_LAYOUT[r + ',' + c];
        if (!z) {
          html += '<div class="pt-cell empty"></div>';
        } else {
          var el = E(z);
          html += '<div class="pt-cell cat-' + el[6] + '" data-z="' + z + '" title="' + el[1] + ' (Z=' + z + ')">' + el[0] + '</div>';
        }
      }
    }
    pt.innerHTML = html;
    // click to load element
    pt.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.classList.contains('pt-cell') || t.classList.contains('empty')) return;
      var z = parseInt(t.dataset.z, 10);
      if (!isFinite(z) || z < 1 || z > 118) return;
      var el = E(z);
      if (!el) return;
      // Set neutral default isotope
      state.p = z;
      state.n = el[3] - z;
      state.e = z;
      onChange();
    });
  }

  function updatePT() {
    var pt = $('pt-mini');
    var cells = pt.querySelectorAll('.pt-cell');
    for (var i = 0; i < cells.length; i++) cells[i].classList.remove('match');
    if (state.p >= 1 && state.p <= 118) {
      var c = pt.querySelector('.pt-cell[data-z="' + state.p + '"]');
      if (c) {
        c.classList.add('match');
        // After the cap-3 ptMatch3 animation ends, mark settled so motion stops.
        c.addEventListener('animationend', function onAEnd() {
          c.classList.add('settled');
          c.removeEventListener('animationend', onAEnd);
        }, { once: true });
      }
    }
    var big = $('pt-big');
    if (big) {
      var btiles = big.querySelectorAll('.pt-big-tile');
      for (var j = 0; j < btiles.length; j++) btiles[j].classList.remove('match');
      if (state.p >= 1 && state.p <= 118) {
        var bm = big.querySelector('.pt-big-tile[data-z="' + state.p + '"]');
        if (bm) bm.classList.add('match');
      }
    }
  }

  /* ─── Periodic-table block filter (s / p / d / f) ────────────── */
  function blockOf(z) {
    if (z >= 58 && z <= 71)  return 'f';   // lanthanides Ce–Lu
    if (z >= 89 && z <= 103) return 'f';   // actinides Ac–Lr  (includes Ac, Z=89)
    if (z === 1 || z === 2)  return 's';   // H and He are s-block (1s)
    var el = E(z);
    if (!el) return 'd';
    var g = el[8];
    if (g === 1 || g === 2)              return 's';
    if (g >= 13 && g <= 18)              return 'p';
    if (g >= 3 && g <= 12)               return 'd';
    return 'd';
  }
  var BLOCK_LABEL = { s: 's-block', p: 'p-block', d: 'd-block', f: 'f-block' };

  function setupPTFilter() {
    var bar = document.getElementById('pt-filter');
    if (!bar) return;
    var btns = bar.querySelectorAll('.ptf-btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('active');
        b.setAttribute('aria-selected', 'true');
        applyBlockFilter(b.dataset.block);
        tone(700, 0.05, 'sine', 0.04);
      });
    });
  }

  function applyBlockFilter(block) {
    var mini = $('pt-mini');
    var big  = $('pt-big');
    var range = $('pt-range');
    if (!mini || !big) return;
    if (block === 'all' || !block) {
      mini.hidden = false;
      big.hidden  = true;
      if (range) range.textContent = 'Z = 1–118';
      return;
    }
    var list = [];
    for (var z = 1; z <= 118; z++) if (blockOf(z) === block) list.push(z);
    var html = '';
    for (var i = 0; i < list.length; i++) {
      var z2 = list[i];
      var el = E(z2);
      html += '<div class="pt-big-tile bk-' + block + '" style="--i:' + i + '" data-z="' + z2 + '"' +
              ' title="' + el[1] + ' (Z=' + z2 + ')">' +
              '<div class="pt-big-z">' + z2 + '</div>' +
              '<div class="pt-big-sym">' + el[0] + '</div>' +
              '<div class="pt-big-name">' + el[1] + '</div>' +
              '</div>';
    }
    big.innerHTML = html;
    big.className = 'pt-big cols-' + block;
    if (!PRM) {
      big.classList.add('entering');
      setTimeout(function () { big.classList.remove('entering'); }, MOTION.m + Math.min(list.length, 8) * MOTION.stagger + 80);
    }
    mini.hidden = true;
    big.hidden  = false;
    if (range) range.textContent = BLOCK_LABEL[block] + ' — ' + list.length + ' elements';
    big.querySelectorAll('.pt-big-tile').forEach(function (t) {
      t.addEventListener('click', function () { loadElement(parseInt(t.dataset.z, 10)); });
    });
    updatePT();
  }

  /* ─── Drag-and-drop ──────────────────────────────────────────── */
  var dragEl = null;
  var dragType = null;

  function startDrag(type, clientX, clientY) {
    if (dragEl) return;
    dragType = type;
    dragEl = document.createElement('div');
    dragEl.className = 'drag-particle ' + ({p:'proton',n:'neutron',e:'electron'})[type];
    dragEl.textContent = ({p:'+',n:'0',e:'−'})[type];
    dragEl.style.left = clientX + 'px';
    dragEl.style.top  = clientY + 'px';
    document.body.appendChild(dragEl);
  }
  function moveDrag(clientX, clientY) {
    if (!dragEl) return;
    dragEl.style.left = clientX + 'px';
    dragEl.style.top  = clientY + 'px';
  }
  function endDrag(clientX, clientY) {
    if (!dragEl) return;
    var rect = canvas.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      addParticle(dragType);
    }
    document.body.removeChild(dragEl);
    dragEl = null; dragType = null;
  }

  function attachBinDrag() {
    var bins = document.querySelectorAll('.bin-pile');
    bins.forEach(function (bin) {
      var type = bin.dataset.type;
      bin.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        startDrag(type, e.clientX, e.clientY);
        bin.setPointerCapture(e.pointerId);
      });
      bin.addEventListener('pointermove', function (e) {
        if (dragEl) moveDrag(e.clientX, e.clientY);
      });
      bin.addEventListener('pointerup', function (e) {
        if (dragEl) endDrag(e.clientX, e.clientY);
        try { bin.releasePointerCapture(e.pointerId); } catch (err) {}
      });
      bin.addEventListener('pointercancel', function () {
        if (dragEl) { document.body.removeChild(dragEl); dragEl = null; dragType = null; }
      });
    });
  }

  /* ─── Bin pile decorative animation ───────────────────────────── */
  function drawBinPiles() {
    document.querySelectorAll('.bin-pile').forEach(function (pile) {
      if (pile.firstChild) return;
      var c = document.createElement('canvas');
      pile.appendChild(c);
      var type = pile.dataset.type;
      var cc = c.getContext('2d');
      function render() {
        var w = c.width = pile.clientWidth * (window.devicePixelRatio || 1);
        var h = c.height = pile.clientHeight * (window.devicePixelRatio || 1);
        cc.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
        var W = pile.clientWidth, H = pile.clientHeight;
        cc.clearRect(0, 0, W, H);
        var colors = {
          p: ['#ffd1ad', '#ff7a4d', '#c84a1d'],
          n: ['#dbe0ee', '#9aa3b8', '#5c647a'],
          e: ['#bbf7ff', '#22d3ee', '#0891b2']
        };
        var ck = colors[type];
        var R = type === 'e' ? 7 : 11;
        var rows = type === 'e' ? 4 : 3;
        var perRow = type === 'e' ? 8 : 5;
        var spacingX = W / (perRow + 1);
        var spacingY = (H - R*2) / rows;
        for (var rIdx = 0; rIdx < rows; rIdx++) {
          for (var cIdx = 0; cIdx < perRow; cIdx++) {
            var x = (cIdx + 1) * spacingX + (rIdx % 2 ? spacingX * 0.4 : 0);
            var y = H - R - rIdx * spacingY * 0.6;
            if (x > W - R || x < R) continue;
            var g = cc.createRadialGradient(x - R*0.4, y - R*0.4, 0.5, x, y, R);
            g.addColorStop(0, ck[0]); g.addColorStop(0.55, ck[1]); g.addColorStop(1, ck[2]);
            cc.fillStyle = g;
            cc.beginPath(); cc.arc(x, y, R, 0, Math.PI * 2); cc.fill();
            cc.strokeStyle = 'rgba(255,255,255,0.3)';
            cc.lineWidth = 0.8;
            cc.stroke();
          }
        }
        // hint
        cc.fillStyle = 'rgba(221, 227, 240, 0.55)';
        cc.font = '600 10px Segoe UI, system-ui, sans-serif';
        cc.textAlign = 'center';
        cc.fillText('Drag to atom →', W / 2, 12);
      }
      render();
      window.addEventListener('resize', render);
    });
  }

  /* ─── Mode switching ──────────────────────────────────────────── */
  var modeSwapToken = 0;
  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.value === mode);
    });
    if (PRM) {
      // Instant swap path — no animation
      document.querySelectorAll('.mode-section').forEach(function (s) {
        s.classList.toggle('active', s.dataset.mode === mode);
      });
    } else {
      var token = ++modeSwapToken;
      var current = document.querySelector('.mode-section.active');
      var next    = document.querySelector('.mode-section[data-mode="' + mode + '"]');
      if (!next || current === next) {
        document.querySelectorAll('.mode-section').forEach(function (s) {
          s.classList.toggle('active', s.dataset.mode === mode);
        });
      } else {
        // Fade out current
        if (current) current.classList.add('mode-fading-out');
        setTimeout(function () {
          // If a newer swap started, abort
          if (token !== modeSwapToken) return;
          document.querySelectorAll('.mode-section').forEach(function (s) {
            s.classList.remove('active', 'mode-fading-out', 'mode-fading-in');
            if (s.dataset.mode === mode) {
              s.classList.add('active');
              s.classList.add('mode-fading-in');
              setTimeout(function () { s.classList.remove('mode-fading-in'); }, MOTION.m + 40);
            }
          });
        }, 120);
      }
    }
    if (mode === 'practice') startPractice();
    else state.practice.active = false;
    if (mode === 'quiz') startQuiz();
  }

  /* ─── PRACTICE ────────────────────────────────────────────────── */
  function startPractice() {
    state.practice.active = true;
    state.practice.score = state.practice.score || 0;
    state.practice.total = state.practice.total || 0;
    nextPracticeTarget();
    updatePracticeUI();
  }
  function nextPracticeTarget() {
    // Pick a random element with a stable isotope, biased toward common ones for school
    var pool = [];
    for (var z = 1; z <= 36; z++) pool.push(z);  // first 36 covered well
    // sprinkle a few common heavy
    [47, 53, 56, 78, 79, 82, 92].forEach(function (z) { pool.push(z); });
    state.practice.targetZ = pool[Math.floor(Math.random() * pool.length)];
  }
  function updatePracticeUI() {
    var el = E(state.practice.targetZ);
    var target = $('practice-target');
    var mode = $('practice-mode-pill');
    var modeKey = mode ? mode.dataset.value : 'neutral';
    var requireStable = modeKey === 'stable' || modeKey === 'neutral';
    var requireNeutral = modeKey === 'neutral';
    var targetHasStable = hasStableIsotope(state.practice.targetZ);
    var instruction = 'Build a <strong>' + (requireNeutral ? 'neutral ' : '') + (requireStable ? 'stable atom' : 'atom') + ' of ' + el[1] + ' (' + el[0] + ')</strong>';
    if (requireStable && targetHasStable) {
      instruction += ' — protons = ' + state.practice.targetZ + ', neutrons in stable range' + (requireNeutral ? ', electrons = ' + state.practice.targetZ : '');
    } else if (requireStable && !targetHasStable) {
      /* No stable isotope exists (e.g. U) — ask for the most stable one instead */
      instruction += ' — protons = ' + state.practice.targetZ + ', neutrons = ' + (el[3] - state.practice.targetZ) +
        ' (its most stable isotope, ' + el[0] + '-' + el[3] + ' — this element has no stable isotope)' +
        (requireNeutral ? ', electrons = ' + state.practice.targetZ : '');
    } else {
      instruction += ' — protons = ' + state.practice.targetZ;
    }
    target.innerHTML = instruction;
    $('practice-score').textContent = state.practice.score + ' / ' + state.practice.total;
    $('practice-fb').className = 'practice-feedback';
    $('practice-fb').textContent = '';
  }
  function checkPracticeAuto() {
    if (!state.practice.active) return;
    var el = E(state.practice.targetZ);
    var modeKey = $('practice-mode-pill') ? $('practice-mode-pill').dataset.value : 'neutral';
    /* Elements with no stable isotope (e.g. U) can never satisfy isStable() —
       accept their most-stable isotope instead so the goal is achievable. */
    var nucleusOK = hasStableIsotope(state.practice.targetZ)
      ? isStable()
      : (state.p === state.practice.targetZ && state.n === el[3] - state.practice.targetZ);
    var ok = false;
    if (modeKey === 'neutral') {
      ok = state.p === state.practice.targetZ && state.e === state.practice.targetZ && nucleusOK;
    } else if (modeKey === 'stable') {
      ok = state.p === state.practice.targetZ && nucleusOK;
    } else if (modeKey === 'ion') {
      ok = state.p === state.practice.targetZ && state.e !== state.practice.targetZ && nucleusOK;
    }
    if (ok) {
      var fb = $('practice-fb');
      fb.className = 'practice-feedback ok';
      fb.textContent = '✓ Correct! You built ' + el[1] + '. Click "Next" for another.';
      // only increment once per target
      if (!state.practice.scored) {
        state.practice.score++;
        state.practice.total++;
        state.practice.scored = true;
        $('practice-score').textContent = state.practice.score + ' / ' + state.practice.total;
        playSuccess();
      }
    } else {
      state.practice.scored = false;
    }
  }
  function practiceNext() {
    if (!state.practice.scored && state.practice.total < state.practice.score + 1) {
      // user is skipping without solving
      state.practice.total++;
      $('practice-score').textContent = state.practice.score + ' / ' + state.practice.total;
    }
    state.practice.scored = false;
    nextPracticeTarget();
    updatePracticeUI();
    resetAtom();
  }

  /* ─── QUIZ ────────────────────────────────────────────────────── */
  var QUIZ_BANK = [
    {
      q: 'An atom has 8 protons, 8 neutrons and 10 electrons. What is it?',
      opts: ['Neutral oxygen atom', 'Oxide ion O²⁻', 'Fluoride ion F⁻', 'Neutral neon atom'],
      a: 1,
      exp: 'Z = 8 → oxygen. Electrons (10) > protons (8) by 2, so net charge = −2, giving the oxide ion O²⁻.'
    },
    {
      q: 'Which subatomic particle determines the identity of an element?',
      opts: ['Number of neutrons', 'Number of electrons', 'Number of protons (atomic number)', 'Atomic mass'],
      a: 2,
      exp: 'An element is defined by its atomic number Z — the number of protons. Two atoms with the same Z but different neutron counts are isotopes of the same element.'
    },
    {
      q: 'What is the maximum number of electrons that can occupy the first shell (n = 1)?',
      opts: ['2', '4', '8', '18'],
      a: 0,
      exp: 'The first shell holds at most 2 electrons (2n² with n=1). The second shell holds 8, the third up to 18.'
    },
    {
      q: 'A sodium atom (Z = 11) loses one electron. What is formed?',
      opts: ['A neutral atom of magnesium', 'A sodium cation Na⁺', 'A sodium anion Na⁻', 'A different isotope of sodium'],
      a: 1,
      exp: 'Losing one electron leaves 11 protons and 10 electrons → net charge +1 → cation Na⁺. The proton count is unchanged, so it remains sodium.'
    },
    {
      q: 'The mass number (A) of an atom equals:',
      opts: ['Number of protons only', 'Number of electrons only', 'Protons + Neutrons', 'Protons + Electrons'],
      a: 2,
      exp: 'A = Z + N. Electrons have negligible mass (~1/1836 of a proton), so they are not counted in mass number.'
    },
    {
      q: 'Carbon-12 (₆¹²C) has how many neutrons?',
      opts: ['12', '6', '18', '0'],
      a: 1,
      exp: 'N = A − Z = 12 − 6 = 6 neutrons. The subscript is Z (protons); the superscript is A (mass number).'
    },
    {
      q: 'Which of these is a noble gas?',
      opts: ['Chlorine (Cl)', 'Sodium (Na)', 'Neon (Ne)', 'Carbon (C)'],
      a: 2,
      exp: 'Neon (Z=10) is in group 18, the noble gases. Its outer shell is full (2,8), making it exceptionally unreactive.'
    },
    {
      q: 'An atom with 6 protons, 8 neutrons, and 6 electrons is:',
      opts: ['Carbon-14, a neutral atom', 'Oxygen-14', 'Carbon-12 cation', 'Nitrogen-14'],
      a: 0,
      exp: 'Z=6 → carbon. A = 6+8 = 14 → Carbon-14 (a radioactive isotope used in dating). Electrons = protons → neutral.'
    },
    {
      q: 'In the Bohr model, the third shell can hold a maximum of:',
      opts: ['8 electrons', '18 electrons', '32 electrons', '50 electrons'],
      a: 1,
      exp: '2n² with n=3 gives 2 × 9 = 18 electrons. In a school-level Bohr-Bury filling, the third shell often appears as 8 before period-4 transition metals fill the 3d sub-shell.'
    },
    {
      q: 'What happens to an atom if you add a neutron without changing protons?',
      opts: ['It becomes a different element', 'It becomes an ion', 'It becomes a different isotope', 'It becomes radioactive automatically'],
      a: 2,
      exp: 'Adding a neutron changes the mass number but not the atomic number, producing an isotope of the same element. Whether the new isotope is stable depends on the neutron/proton ratio.'
    }
  ];

  function startQuiz() {
    state.quiz.qs = shuffle(QUIZ_BANK.slice()).slice(0, 5);
    state.quiz.idx = 0; state.quiz.score = 0; state.quiz.answered = false;
    renderQuiz();
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function renderQuiz() {
    var idx = state.quiz.idx;
    var total = state.quiz.qs.length;
    if (idx >= total) {
      renderQuizResult();
      return;
    }
    var q = state.quiz.qs[idx];
    $('quiz-progress-text').textContent = 'Question ' + (idx + 1) + ' / ' + total;
    $('quiz-progress-score').textContent = 'Score: ' + state.quiz.score;
    $('quiz-progress-fill').style.width = ((idx / total) * 100) + '%';
    $('quiz-q').textContent = q.q;
    var opts = $('quiz-opts');
    opts.innerHTML = '';
    for (var i = 0; i < q.opts.length; i++) {
      var b = document.createElement('button');
      b.className = 'quiz-opt';
      b.textContent = q.opts[i];
      b.dataset.idx = i;
      b.addEventListener('click', onQuizAnswer);
      opts.appendChild(b);
    }
    $('quiz-explain').className = 'quiz-explain';
    $('quiz-explain').textContent = '';
    $('quiz-next').style.display = 'none';
    $('quiz-result').style.display = 'none';
    $('quiz-question-box').style.display = 'block';
    state.quiz.answered = false;
  }
  function onQuizAnswer(e) {
    if (state.quiz.answered) return;
    var idx = parseInt(e.target.dataset.idx, 10);
    var q = state.quiz.qs[state.quiz.idx];
    if (!q || !isFinite(idx) || idx < 0 || idx >= q.opts.length) return;
    state.quiz.answered = true;
    var opts = document.querySelectorAll('.quiz-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].disabled = true;
      if (i === q.a) opts[i].classList.add('correct');
      else if (i === idx) opts[i].classList.add('wrong');
    }
    if (idx === q.a) { state.quiz.score++; playSuccess(); }
    else { playError(); }
    var expEl = $('quiz-explain');
    expEl.textContent = q.exp;
    expEl.className = 'quiz-explain show';
    $('quiz-next').style.display = 'inline-flex';
    $('quiz-progress-score').textContent = 'Score: ' + state.quiz.score;
  }
  function nextQuizQ() {
    state.quiz.idx++;
    renderQuiz();
  }
  function renderQuizResult() {
    $('quiz-question-box').style.display = 'none';
    var res = $('quiz-result');
    res.style.display = 'block';
    var stars = Math.max(0, Math.min(5, state.quiz.score));
    var starStr = '';
    for (var i = 0; i < 5; i++) starStr += i < stars ? '★' : '☆';
    $('quiz-result-stars').textContent = starStr;
    $('quiz-result-score').textContent = state.quiz.score + ' / ' + state.quiz.qs.length;
    $('quiz-progress-fill').style.width = '100%';
  }

  /* ─── EXPLORE ─────────────────────────────────────────────────── */
  var EXPLORE = {
    basics: [
      { title: 'What is an atom?',
        body: 'An atom is the smallest unit of an element that still has the chemical properties of that element. Every atom has a tiny dense nucleus surrounded by a cloud of electrons. The nucleus holds positive protons and electrically neutral neutrons. Even though atoms are mostly empty space, they make up everything you can see.',
        note: 'Hydrogen atoms are about 0.1 nanometres across — you would need 10 million in a row to span 1 mm.' },
      { title: 'Subatomic particles',
        body: 'Protons (+1 charge), neutrons (0 charge) and electrons (−1 charge) are the three building blocks. Protons and neutrons live in the nucleus and have nearly the same mass. Electrons are about 1836 times lighter and orbit the nucleus in shells.',
        formula: 'mass(p⁺) ≈ mass(n⁰) ≫ mass(e⁻)' },
      { title: 'Atomic number Z',
        body: 'The number of protons in an atom is called the atomic number, Z. It defines what element you have: Z = 1 is hydrogen, Z = 6 is carbon, Z = 79 is gold. Change the number of protons and you change the element itself.',
        note: 'Hint: drop a single proton in the simulator — instantly hydrogen. Drop a second — helium.' },
      { title: 'Mass number A',
        body: 'A = Z + N, where N is the number of neutrons. The mass number tells you the approximate atomic mass in atomic mass units (u). It is shown as a superscript before the element symbol: ¹²C means carbon with mass number 12.',
        formula: 'A = Z + N    (protons + neutrons)' }
    ],
    particles: [
      { title: 'Protons',
        body: 'Protons carry one positive elementary charge (+e). The number of protons fixes the chemical identity of the atom. Their mutual electrostatic repulsion is the reason heavy nuclei need extra neutrons to stay together — the strong nuclear force has to overcome that repulsion at short range.',
        note: 'Add a proton in the simulator and watch the periodic table cell light up in real time.' },
      { title: 'Neutrons',
        body: 'Neutrons have no electric charge but almost the same mass as a proton. They act as nuclear "glue" — extra neutrons stabilise the nucleus by increasing the strong-force attraction without adding more electrostatic repulsion. Atoms with the same Z but different neutron counts are called isotopes.',
        note: 'Carbon-12 and Carbon-14 are both carbon (Z=6), but the latter is radioactive.' },
      { title: 'Electrons',
        body: 'Electrons are 1836× lighter than protons, carry a −1 charge, and live in quantised shells (n = 1, 2, 3, …). The outermost shell electrons are called valence electrons and they decide how the atom bonds. Gaining or losing electrons turns a neutral atom into an ion.',
        formula: 'q_atom = Z − e_count' },
      { title: 'Ions',
        body: 'A positive ion (cation) has fewer electrons than protons. A negative ion (anion) has more electrons than protons. Metals typically lose electrons to form cations (Na⁺, Ca²⁺), and non-metals typically gain them to form anions (Cl⁻, O²⁻).',
        note: 'Build Na⁺ in the simulator: 11 protons, 12 neutrons, 10 electrons.' }
    ],
    shells: [
      { title: 'Shell capacities (2n² rule)',
        body: 'Each principal shell n can hold a maximum of 2n² electrons. Shell 1 holds 2, shell 2 holds 8, shell 3 holds 18, shell 4 holds 32. Shells beyond calcium do not fill straight to their maximum, because sub-shells (s, p, d, f) overlap in energy — the simulator shows the real ground-state occupancy for every electron count.',
        formula: 'maximum electrons in shell n  =  2n²' },
      { title: 'Filling order (Aufbau principle)',
        body: 'Electrons fill sub-shells in order of increasing energy: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p… That is why potassium\'s 19th electron starts shell 4 while shell 3 holds only 8 — and why the next ten elements (Sc–Zn) go back and fill shell 3 up to 18. Iron therefore shows 2, 8, 14, 2. A few elements (Cr, Cu, Ag, Au…) borrow one s-electron for a half-full or full d sub-shell; the simulator includes these exceptions.',
        note: 'Load potassium (19 e⁻ → 2, 8, 8, 1), then step up to scandium (21 e⁻ → 2, 8, 9, 2) and watch shell 3 grow while shell 4 keeps 2.' },
      { title: 'Valence electrons',
        body: 'The electrons in the outermost shell are the valence electrons. They drive chemistry: how an atom bonds, what charge ion it tends to form, and which group of the periodic table it sits in. Group 1 has 1 valence electron; group 18 has a full outer shell.',
        formula: 'octet rule:  most atoms want 8 valence electrons' },
      { title: 'Why noble gases are inert',
        body: 'Helium, Neon, Argon, Krypton, Xenon and Radon all have completely filled outer shells. That configuration is so stable that they rarely react with anything — no bonding, no ions, no compounds (apart from a few exotic xenon fluorides).',
        note: 'Build Argon (18 electrons): the shells fill as 2, 8, 8 — a closed shell.' }
    ],
    table: [
      { title: 'Reading the periodic table',
        body: 'The periodic table arranges all 118 elements by atomic number Z, into 7 rows (periods) and 18 columns (groups). Elements in the same column have similar chemical behaviour because they share the same number of valence electrons.',
        note: 'Click any element in the mini periodic table on the right to load its neutral, most-stable atom into the simulator.' },
      { title: 'Periods and shells',
        body: 'The row number tells you the number of occupied electron shells. Period 1 elements (H, He) have one shell; period 7 elements (Fr–Og) have seven. As you move down the table, atoms get bigger because outer shells are farther from the nucleus.',
        formula: 'period number = highest occupied shell' },
      { title: 'Stability and isotopes',
        body: 'Up to lead (Z=82) almost every element has at least one stable isotope — the exceptions are technetium (Z=43) and promethium (Z=61). From bismuth (Z=83) onward every isotope is radioactive: bismuth-209 was long taught as stable, but in 2003 its alpha decay was detected (half-life 2×10¹⁹ years — a billion times the age of the universe). The simulator checks your exact neutron count against the known stable-isotope list.',
        note: 'For light elements N ≈ Z works. For heavy ones, more neutrons are needed: Lead-208 has 82 protons and 126 neutrons.' },
      { title: 'Element categories',
        body: 'Metals (left and centre): lose electrons easily, conduct electricity. Non-metals (top right): gain or share electrons, poor conductors. Metalloids (the staircase): mixed properties. Noble gases (far right): inert. Lanthanides and actinides: f-block, often radioactive.',
        note: 'The mini periodic table colour-codes every cell by category.' }
    ]
  };

  function renderExplore(cat) {
    var cards = EXPLORE[cat] || EXPLORE.basics;
    var wrap = $('explore-cards');
    wrap.innerHTML = '';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      var card = document.createElement('div');
      card.className = 'explore-card';
      var html = '<h3>' + c.title + '</h3><p>' + c.body + '</p>';
      if (c.formula) html += '<code class="formula">' + c.formula + '</code>';
      if (c.note) html += '<div class="note">' + c.note + '</div>';
      card.innerHTML = html;
      wrap.appendChild(card);
    }
  }

  /* ─── Context menu ────────────────────────────────────────────── */
  function setupCtxMenu() {
    var menu = $('ctx-menu');
    canvas.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      var card = canvas.parentElement;
      var rect = card.getBoundingClientRect();
      menu.style.display = 'block';
      // Measure then clamp inside card
      var mw = menu.offsetWidth || 170, mh = menu.offsetHeight || 120;
      var lx = e.clientX - rect.left;
      var ly = e.clientY - rect.top;
      if (lx + mw > rect.width - 4)  lx = rect.width  - mw - 4;
      if (ly + mh > rect.height - 4) ly = rect.height - mh - 4;
      if (lx < 4) lx = 4;
      if (ly < 4) ly = 4;
      menu.style.left = lx + 'px';
      menu.style.top  = ly + 'px';
    });
    document.addEventListener('click', function (e) {
      if (e.target && e.target.classList && e.target.classList.contains('ctx-item')) return;
      menu.style.display = 'none';
    });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('.ctx-item');
      if (!b) return;
      var action = b.dataset.action;
      if (action === 'save-img')  saveImage();
      if (action === 'copy-data') copyData();
      if (action === 'reset')     resetAtom();
      menu.style.display = 'none';
    });
  }

  function saveImage() {
    var tmp = document.createElement('canvas');
    tmp.width = canvas.width; tmp.height = canvas.height;
    var tc = tmp.getContext('2d');
    // dark background
    tc.fillStyle = '#0d1117'; tc.fillRect(0, 0, tmp.width, tmp.height);
    tc.drawImage(canvas, 0, 0);
    var dpr = window.devicePixelRatio || 1;
    var fs = Math.round(tmp.width * 0.022); if (fs < 10) fs = 10;
    tc.font = '600 ' + fs + 'px Segoe UI, system-ui, sans-serif';
    tc.textAlign = 'right'; tc.textBaseline = 'bottom';
    tc.fillStyle = 'rgba(255,255,255,0.3)';
    tc.fillText('NHIT VisualLab', tmp.width - 12, tmp.height - 8);
    var a = document.createElement('a');
    var el = currentElement();
    a.download = 'atom_' + (el ? el[0] : 'empty') + '.png';
    a.href = tmp.toDataURL('image/png');
    a.click();
  }
  function copyData() {
    var el = currentElement();
    var c = charge();
    var lines = [
      'Build Your Atom — NHIT VisualLab',
      '',
      'Element : ' + (el ? el[1] + ' (' + el[0] + ')' : 'No element'),
      'Z       : ' + state.p,
      'N       : ' + state.n,
      'A       : ' + massNumber(),
      'e⁻      : ' + state.e,
      'Charge  : ' + (c === 0 ? '0 (neutral)' : (c > 0 ? '+' + c : c)),
      'Config  : ' + configString(state.e),
      'Status  : ' + (state.p === 0 ? '—' : (isStable() ? 'Stable' : 'Unstable'))
    ];
    var txt = lines.join('\n');
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
    else {
      var ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (er) {}
      document.body.removeChild(ta);
    }
  }

  /* ─── Electron hit points (filled each draw — used for drag-to-remove) ─── */
  var electronHitPoints = [];

  /* ═══════════════════════════════════════════════════════════════════
     ELEMENT PROPERTIES (for the learning panel)
     [firstIE_kJmol, atomicRadius_pm, electronegativity, phaseAt25C, oxStates, useNote]
     phase: 'solid' | 'liquid' | 'gas' | 'syn' (synthetic/radioactive lab)
     Data for Z=1..36 + a curated set of common heavies. Heavier synthetics
     fall through to a generic message.
     ═══════════════════════════════════════════════════════════════════ */
  var ELEM_PROPS = {
    1:  [1312, 53,  2.20, 'gas',   '−1, +1',         'Fuel cells, ammonia synthesis, the stars.'],
    2:  [2372, 31,  null, 'gas',   '0',              'Lifting balloons, MRI cooling, deep-sea breathing mixes.'],
    3:  [520,  167, 0.98, 'solid', '+1',             'Lithium-ion batteries, mood-stabilising medicine.'],
    4:  [899,  112, 1.57, 'solid', '+2',             'Aerospace alloys, X-ray windows, copper-beryllium springs.'],
    5:  [801,  87,  2.04, 'solid', '+3',             'Borosilicate glass (Pyrex), neutron-absorber control rods.'],
    6:  [1086, 67,  2.55, 'solid', '−4, +2, +4',     'Life itself — also diamond, graphite, steel, plastics.'],
    7:  [1402, 56,  3.04, 'gas',   '−3, +3, +5',     '78 % of the atmosphere; fertilizers, explosives, refrigerants.'],
    8:  [1314, 48,  3.44, 'gas',   '−2',             'Breathing, combustion, steel making, the oceans.'],
    9:  [1681, 42,  3.98, 'gas',   '−1',             'Toothpaste, Teflon non-stick, uranium enrichment.'],
    10: [2081, 38,  null, 'gas',   '0',              'Neon signs, vacuum tubes, indicator lights.'],
    11: [496,  190, 0.93, 'solid', '+1',             'Table salt, street lights, soap and glass making.'],
    12: [738,  145, 1.31, 'solid', '+2',             'Light aluminium-magnesium alloys, flares, fireworks.'],
    13: [577,  118, 1.61, 'solid', '+3',             'Cans, foil, aircraft, power cables, smartphone bodies.'],
    14: [786,  111, 1.90, 'solid', '+4',             'Computer chips, solar cells, sand, glass, silicones.'],
    15: [1012, 98,  2.19, 'solid', '−3, +3, +5',     'DNA backbone, fertilizers, matches, detergents.'],
    16: [1000, 88,  2.58, 'solid', '−2, +4, +6',     'Sulfuric acid (most-made chemical), vulcanised rubber.'],
    17: [1251, 79,  3.16, 'gas',   '−1, +1, +5, +7', 'Drinking-water sterilisation, PVC plastic, bleach.'],
    18: [1521, 71,  null, 'gas',   '0',              'Inert welding shield-gas, light-bulb fillers.'],
    19: [419,  243, 0.82, 'solid', '+1',             'Plant nutrient, fertilizers, fireworks (lilac flame).'],
    20: [590,  194, 1.00, 'solid', '+2',             'Bones, teeth, cement, antacids.'],
    21: [633,  184, 1.36, 'solid', '+3',             'Lightweight aerospace alloys, halide stadium lamps.'],
    22: [659,  176, 1.54, 'solid', '+4',             'Bicycle frames, jet engines, medical implants.'],
    23: [651,  171, 1.63, 'solid', '+2, +3, +4, +5', 'Steel hardening, vanadium-redox grid batteries.'],
    24: [653,  166, 1.66, 'solid', '+3, +6',         'Stainless steel, chrome plating, green-coloured gems.'],
    25: [717,  161, 1.55, 'solid', '+2, +4, +7',     'Steel toughening, alkaline batteries, glass colouring.'],
    26: [762,  156, 1.83, 'solid', '+2, +3',         'Earth\'s core, structural steel, hemoglobin.'],
    27: [760,  152, 1.88, 'solid', '+2, +3',         'Magnets, lithium-ion cathodes, blue ceramic glazes.'],
    28: [737,  149, 1.91, 'solid', '+2, +3',         'Stainless steel, rechargeable batteries, coins.'],
    29: [745,  145, 1.90, 'solid', '+1, +2',         'Electrical wiring, plumbing, brass and bronze.'],
    30: [906,  142, 1.65, 'solid', '+2',             'Galvanised steel, alkaline batteries, brass.'],
    31: [579,  136, 1.81, 'solid', '+3',             'LEDs, semiconductors, infra-red optics.'],
    32: [762,  125, 2.01, 'solid', '+2, +4',         'Fiber-optic cables, infrared lenses, transistors.'],
    33: [947,  114, 2.18, 'solid', '−3, +3, +5',     'Semiconductors (GaAs), historic poisons, wood preservative.'],
    34: [941,  103, 2.55, 'solid', '−2, +4, +6',     'Photocopiers, solar cells, anti-dandruff shampoo.'],
    35: [1140, 94,  2.96, 'liquid','−1, +1, +5',     'Flame retardants, photographic film, water disinfection.'],
    36: [1351, 88,  3.00, 'gas',   '0',              'High-intensity lamps, krypton-fluoride lasers.'],
    47: [731,  144, 1.93, 'solid', '+1',             'Best electrical conductor, jewellery, antibacterial wound dressings.'],
    50: [709,  140, 1.96, 'solid', '+2, +4',         'Solder, tin-plating, bronze, organ pipes.'],
    53: [1008, 115, 2.66, 'solid', '−1, +1, +5, +7', 'Antiseptics, salt iodisation, thyroid medicine.'],
    74: [770,  139, 2.36, 'solid', '+4, +6',         'Light-bulb filaments, drill bits, armour-piercing rounds.'],
    78: [870,  139, 2.28, 'solid', '+2, +4',         'Catalytic converters, lab crucibles, jewellery, cancer drugs.'],
    79: [890,  144, 2.54, 'solid', '+1, +3',         'Currency, jewellery, microchip bond wires, biocompatible implants.'],
    80: [1007, 132, 2.00, 'liquid','+1, +2',         'Thermometers, fluorescent lamps, dental amalgam.'],
    82: [716,  175, 2.33, 'solid', '+2, +4',         'Car batteries, radiation shielding, ammunition.'],
    92: [598,  196, 1.38, 'solid', '+3, +4, +5, +6', 'Nuclear fuel (U-235), depleted-uranium armour, geological dating.'],
    94: [585,  187, 1.28, 'solid', '+3, +4, +5, +6', 'Plutonium-239 fuels weapons and Mars-rover batteries.']
  };

  /* COMMON_ISOTOPES[Z] = [ {a, n, halfLife, decay, note}, ... ] (top 3-4 per element).
     halfLife is human-readable string. */
  var COMMON_ISOTOPES = {
    1:  [{a:1, halfLife:'stable',     note:'Protium — 99.98% natural'},
         {a:2, halfLife:'stable',     note:'Deuterium — heavy water'},
         {a:3, halfLife:'12.32 y',    decay:'β⁻', note:'Tritium — radioluminescence'}],
    2:  [{a:3, halfLife:'stable',     note:'Helium-3 — rare, fusion fuel'},
         {a:4, halfLife:'stable',     note:'Helium-4 — 99.999% natural'}],
    6:  [{a:12, halfLife:'stable',    note:'Carbon-12 — defines atomic mass unit'},
         {a:13, halfLife:'stable',    note:'Carbon-13 — 1.1% natural, NMR'},
         {a:14, halfLife:'5730 y',    decay:'β⁻', note:'Radiocarbon dating'}],
    7:  [{a:14, halfLife:'stable',    note:'Nitrogen-14 — 99.6% natural'},
         {a:15, halfLife:'stable',    note:'Nitrogen-15 — 0.4% natural'}],
    8:  [{a:16, halfLife:'stable',    note:'Oxygen-16 — 99.76% natural'},
         {a:17, halfLife:'stable',    note:'Oxygen-17 — 0.04% natural'},
         {a:18, halfLife:'stable',    note:'Oxygen-18 — paleoclimatology'}],
    11: [{a:23, halfLife:'stable',    note:'Only stable isotope'},
         {a:22, halfLife:'2.6 y',     decay:'β⁺', note:'PET tracer'}],
    17: [{a:35, halfLife:'stable',    note:'Chlorine-35 — 76% natural'},
         {a:37, halfLife:'stable',    note:'Chlorine-37 — 24% natural'}],
    19: [{a:39, halfLife:'stable',    note:'Potassium-39 — 93% natural'},
         {a:40, halfLife:'1.25 Gy',   decay:'β⁻/β⁺', note:'K-Ar dating'}],
    26: [{a:56, halfLife:'stable',    note:'Iron-56 — most abundant'},
         {a:54, halfLife:'stable'},
         {a:57, halfLife:'stable',    note:'Mössbauer spectroscopy'}],
    27: [{a:59, halfLife:'stable',    note:'Only stable isotope'},
         {a:60, halfLife:'5.27 y',    decay:'β⁻', note:'Radiotherapy, sterilisation'}],
    53: [{a:127, halfLife:'stable',   note:'Only stable isotope'},
         {a:131, halfLife:'8.02 d',   decay:'β⁻', note:'Thyroid treatment & imaging'}],
    55: [{a:133, halfLife:'stable'},
         {a:137, halfLife:'30.17 y',  decay:'β⁻', note:'Fission product, dosimetry'}],
    82: [{a:208, halfLife:'stable',   note:'Most abundant'},
         {a:206, halfLife:'stable',   note:'End of U-238 decay chain'},
         {a:207, halfLife:'stable'}],
    83: [{a:209, halfLife:'2.0×10¹⁹ y', decay:'α', note:'Long taught as stable — decay detected in 2003'}],
    92: [{a:238, halfLife:'4.47 Gy',  decay:'α',   note:'Depleted uranium, 99.3% natural'},
         {a:235, halfLife:'703.8 My', decay:'α',   note:'Fissile — reactor & weapons fuel'},
         {a:234, halfLife:'245.5 ky', decay:'α'}],
    94: [{a:239, halfLife:'24.1 ky',  decay:'α',   note:'Weapons-grade'},
         {a:238, halfLife:'87.7 y',   decay:'α',   note:'RTG power source (Mars rovers)'}]
  };

  function phaseLabel(p) {
    if (p === 'solid')  return { txt: 'Solid',  color: 'var(--text)' };
    if (p === 'liquid') return { txt: 'Liquid', color: 'var(--electron)' };
    if (p === 'gas')    return { txt: 'Gas',    color: 'var(--green)' };
    if (p === 'syn')    return { txt: 'Synthetic (lab only)', color: 'var(--red)' };
    return { txt: '—', color: 'var(--text-dim)' };
  }

  /* ─── Properties panel renderer ──────────────────────────────── */
  function renderPropsPanel() {
    var grid = document.getElementById('props-grid');
    if (!grid) return;
    if (state.p < 1 || state.p > 118) {
      grid.innerHTML = '<div class="props-empty">Build an atom or click an element in the periodic table to see its properties.</div>';
      return;
    }
    var el = E(state.p);
    var pr = ELEM_PROPS[state.p];
    var html = '';
    html += '<div class="prop-cell"><div class="pl">First ionization</div><div class="pv accent">' + (pr && pr[0] ? pr[0] + ' <span class="pu">kJ/mol</span>' : '—') + '</div></div>';
    html += '<div class="prop-cell"><div class="pl">Atomic radius</div><div class="pv accent">' + (pr && pr[1] ? pr[1] + ' <span class="pu">pm</span>' : '—') + '</div></div>';
    html += '<div class="prop-cell"><div class="pl">Electronegativity</div><div class="pv accent">' + (pr && pr[2] != null ? pr[2].toFixed(2) + ' <span class="pu">Pauling</span>' : '—') + '</div></div>';
    var ph = phaseLabel(pr ? pr[3] : null);
    if (state.p >= 89 && state.p <= 118 && !pr) ph = phaseLabel('syn');
    html += '<div class="prop-cell"><div class="pl">Phase at 25&deg;C</div><div class="pv" style="color:' + ph.color + '">' + ph.txt + '</div></div>';
    html += '<div class="prop-cell"><div class="pl">Common oxidations</div><div class="pv gold">' + (pr && pr[4] ? pr[4] : '—') + '</div></div>';
    html += '<div class="prop-cell"><div class="pl">Standard mass</div><div class="pv">' + el[2].toFixed(3) + ' <span class="pu">u</span></div></div>';
    if (pr && pr[5]) {
      html += '<div class="prop-uses">💡 ' + pr[5] + '</div>';
    } else if (state.p >= 95) {
      html += '<div class="prop-uses">💡 Synthetic transuranium element. Produced in particle accelerators in tiny quantities; primarily used in nuclear-physics research.</div>';
    }
    grid.innerHTML = html;
  }

  /* ─── Isotope panel renderer ─────────────────────────────────── */
  function renderIsotopePanel() {
    var p = document.getElementById('iso-panel');
    if (!p) return;
    if (state.p < 1) {
      p.innerHTML = 'Build an atom to see isotope details.';
      return;
    }
    var el = E(state.p);
    var a = massNumber();
    var nz = state.p > 0 ? (state.n / state.p) : 0;
    var stableTxt = isStable() ? '<strong style="color:var(--green)">Stable</strong>' : '<strong style="color:var(--red)">Radioactive</strong>';
    var sNs = stableNs(state.p);
    var stableRange;
    if (!sNs.length) {
      stableRange = 'no stable isotope exists';
    } else if (sNs.length === 1) {
      stableRange = sNs[0] + ' neutrons (only one stable isotope)';
    } else {
      stableRange = sNs.join(', ') + ' neutrons (' + sNs.length + ' stable isotopes)';
    }
    var html = '';
    html += '<div class="iso-line">Current isotope: <strong>' + sup(a) + el[0] + '</strong> &mdash; ' + stableTxt + '</div>';
    html += '<div class="iso-line">N / Z ratio: <strong>' + nz.toFixed(2) + '</strong>';
    if (state.p > 0) {
      /* Empirical valley-of-stability ratio: ≈1 up to Ca, rising to ~1.54 at Pb.
         Piecewise fit through (Z=20, 1.00), (Z=50, 1.36), (Z=82, 1.54). */
      var ideal = state.p <= 20 ? 1.0
                : state.p <= 50 ? 1.0 + (state.p - 20) * 0.012
                : 1.36 + (state.p - 50) * 0.0056;
      html += ' &middot; ideal ≈ ' + ideal.toFixed(2);
    }
    html += '</div>';
    html += '<div class="iso-line">Stable neutron counts for ' + el[1] + ': <strong>' + stableRange + '</strong></div>';
    // Common isotopes
    var commons = COMMON_ISOTOPES[state.p];
    if (commons) {
      html += '<div class="iso-line" style="margin-top:8px"><strong>Notable isotopes</strong></div>';
      for (var i = 0; i < commons.length; i++) {
        var iso = commons[i];
        html += '<div style="padding:3px 0;color:var(--text-dim);font-size:0.82rem">' +
                '<span style="color:var(--accent-hi);font-family:var(--mono);font-weight:700">' + sup(iso.a) + el[0] + '</span> &mdash; ' +
                iso.halfLife + (iso.decay ? ' (' + iso.decay + ')' : '') +
                (iso.note ? ' <span style="color:var(--text-dim)">— ' + iso.note + '</span>' : '') +
                '</div>';
      }
    }
    // N-Z mini chart
    html += '<canvas class="iso-nz" id="iso-nz-canvas" width="460" height="180" role="img" aria-label="Stability band of N vs Z showing where the current atom sits"></canvas>';
    p.innerHTML = html;
    drawNZChart();
  }

  function drawNZChart() {
    var c = document.getElementById('iso-nz-canvas');
    if (!c) return;
    var x = c.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var W = c.clientWidth || 460, H = c.clientHeight || 180;
    c.width = W * dpr; c.height = H * dpr;
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, W, H);
    var maxZ = 118, maxN = 180;
    function px(z) { return 30 + (z / maxZ) * (W - 40); }
    function py(n) { return H - 18 - (n / maxN) * (H - 30); }
    // Axes
    x.strokeStyle = 'rgba(168,85,247,.35)';
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(30, 12); x.lineTo(30, H - 18); x.lineTo(W - 8, H - 18); x.stroke();
    x.fillStyle = 'rgba(192,132,252,.7)';
    x.font = '700 9px Segoe UI, system-ui, sans-serif';
    x.textAlign = 'left';
    x.fillText('N', 6, 16);
    x.fillText('Z', W - 14, H - 4);
    // Stability band — only elements that actually have stable isotopes (Z ≤ 82)
    x.fillStyle = 'rgba(61,220,132,.15)';
    x.beginPath();
    var started = false;
    for (var z = 1; z <= maxZ; z++) {
      var ns = stableNs(z); if (!ns.length) continue;
      var lo = ns[0];
      if (!started) { x.moveTo(px(z), py(lo)); started = true; }
      else x.lineTo(px(z), py(lo));
    }
    for (var z2 = maxZ; z2 >= 1; z2--) {
      var ns2 = stableNs(z2); if (!ns2.length) continue;
      var hi = ns2[ns2.length - 1];
      x.lineTo(px(z2), py(hi > ns2[0] ? hi : ns2[0] + 1));
    }
    x.closePath(); x.fill();
    // N = Z line
    x.strokeStyle = 'rgba(255,255,255,.18)';
    x.setLineDash([3, 3]);
    x.beginPath(); x.moveTo(px(0), py(0)); x.lineTo(px(maxZ), py(maxZ)); x.stroke();
    x.setLineDash([]);
    // Current atom marker
    if (state.p > 0) {
      var mx = px(state.p), my = py(state.n);
      x.fillStyle = isStable() ? 'rgba(61,220,132,.95)' : 'rgba(255,85,85,.95)';
      x.strokeStyle = '#fff'; x.lineWidth = 2;
      x.beginPath(); x.arc(mx, my, 5, 0, Math.PI * 2); x.fill(); x.stroke();
      // label
      x.fillStyle = '#fff';
      x.font = '700 10px Segoe UI, system-ui, sans-serif';
      x.fillText(E(state.p)[0] + '-' + (state.p + state.n), mx + 8, my + 3);
    }
  }

  /* ─── Isotope chips ──────────────────────────────────────────── */
  function renderIsoChips() {
    var row = document.getElementById('iso-row');
    var wrap = document.getElementById('iso-chips');
    if (!row || !wrap) return;
    if (state.p < 1 || state.p > 118) { row.hidden = true; return; }
    var commons = COMMON_ISOTOPES[state.p];
    if (!commons || commons.length < 2) { row.hidden = true; return; }
    row.hidden = false;
    var html = '';
    for (var i = 0; i < commons.length; i++) {
      var iso = commons[i];
      var active = (iso.a === state.p + state.n) ? ' active' : '';
      html += '<button class="iso-chip' + active + '" data-a="' + iso.a + '">' +
              sup(iso.a) + E(state.p)[0] +
              '<span class="iso-half">' + iso.halfLife + '</span></button>';
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll('.iso-chip').forEach(function (b) {
      b.addEventListener('click', function () {
        var a = parseInt(b.dataset.a, 10);
        state.n = a - state.p;
        onChange();
      });
    });
  }

  /* ─── Element search ─────────────────────────────────────────── */
  var searchActiveIdx = -1;
  function setupElementSearch() {
    var inp = document.getElementById('el-search');
    var dd = document.getElementById('el-search-results');
    if (!inp || !dd) return;
    function close() { dd.classList.remove('show'); searchActiveIdx = -1; }
    function open() { dd.classList.add('show'); }
    function search(q) {
      q = q.trim().toLowerCase();
      if (!q) { close(); return; }
      var matches = [];
      var asZ = parseInt(q, 10);
      for (var z = 1; z <= 118; z++) {
        var el = E(z);
        if (asZ && z === asZ) matches.push({ z: z, score: 0 });
        else if (el[0].toLowerCase() === q) matches.push({ z: z, score: 1 });
        else if (el[1].toLowerCase().indexOf(q) === 0) matches.push({ z: z, score: 2 });
        else if (el[0].toLowerCase().indexOf(q) === 0) matches.push({ z: z, score: 3 });
        else if (el[1].toLowerCase().indexOf(q) >= 0) matches.push({ z: z, score: 4 });
        if (matches.length >= 30) break;
      }
      matches.sort(function (a, b) { return a.score - b.score; });
      matches = matches.slice(0, 8);
      if (!matches.length) { dd.innerHTML = '<div class="el-result-item" style="color:var(--text-dim)">No element matches</div>'; open(); return; }
      var html = '';
      for (var i = 0; i < matches.length; i++) {
        var el2 = E(matches[i].z);
        html += '<div class="el-result-item" data-z="' + matches[i].z + '">' +
                '<span class="el-result-sym">' + el2[0] + '</span>' +
                '<span>' + el2[1] + '</span>' +
                '<span class="el-result-z">Z=' + matches[i].z + '</span></div>';
      }
      dd.innerHTML = html;
      dd.querySelectorAll('.el-result-item[data-z]').forEach(function (item) {
        item.addEventListener('click', function () { loadElement(parseInt(item.dataset.z, 10)); inp.value = ''; close(); });
      });
      open();
    }
    inp.addEventListener('input', function () { search(inp.value); });
    inp.addEventListener('focus',  function () { if (inp.value) search(inp.value); });
    inp.addEventListener('keydown', function (e) {
      var items = dd.querySelectorAll('.el-result-item[data-z]');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchActiveIdx = Math.min(items.length - 1, searchActiveIdx + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchActiveIdx = Math.max(0, searchActiveIdx - 1);
      } else if (e.key === 'Enter' && items.length) {
        e.preventDefault();
        var idx = searchActiveIdx >= 0 ? searchActiveIdx : 0;
        loadElement(parseInt(items[idx].dataset.z, 10));
        inp.value = ''; close();
        return;
      } else if (e.key === 'Escape') {
        close(); inp.blur();
        return;
      }
      items.forEach(function (it, i) { it.classList.toggle('active', i === searchActiveIdx); });
    });
    document.addEventListener('click', function (e) {
      if (e.target !== inp && !dd.contains(e.target)) close();
    });
  }

  function loadElement(z) {
    if (z < 1 || z > 118) return;
    var el = E(z);
    state.p = z;
    state.n = el[3] - z;
    state.e = z;
    onChange();
  }

  /* ─── Editable bin-count ─────────────────────────────────────── */
  function setupEditableCounts() {
    document.querySelectorAll('.bin-count').forEach(function (cell) {
      cell.addEventListener('click', function () {
        if (cell.classList.contains('editing')) return;
        var type = cell.dataset.type;
        var cur = state[type];
        var max = type === 'p' ? 118 : (type === 'n' ? 200 : 118);
        var inp = document.createElement('input');
        inp.type = 'number'; inp.min = 0; inp.max = max;
        inp.value = cur;
        cell.classList.add('editing');
        cell.textContent = '';
        cell.appendChild(inp);
        inp.focus(); inp.select();
        var done = false;
        function commit() {
          if (done) return; done = true;
          var v = parseInt(inp.value, 10);
          if (!isFinite(v) || v < 0) v = 0;
          if (v > max) v = max;
          state[type] = v;
          cell.classList.remove('editing');
          cell.textContent = v;
          onChange();
        }
        function cancel() {
          if (done) return; done = true;
          cell.classList.remove('editing');
          cell.textContent = cur;
        }
        inp.addEventListener('blur', commit);
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        });
      });
    });
  }

  /* ─── Keyboard shortcuts ─────────────────────────────────────── */
  function setupKeyboard() {
    document.addEventListener('keydown', function (e) {
      // Ignore when typing in inputs / textareas
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || e.target.isContentEditable) return;
      var k = e.key;
      if (k === '/') {
        e.preventDefault();
        var inp = document.getElementById('el-search');
        if (inp) inp.focus();
        return;
      }
      if (k === 'p' || k === 'P') {
        e.preventDefault();
        if (e.shiftKey) removeParticle('p'); else addParticle('p');
      } else if (k === 'n' || k === 'N') {
        e.preventDefault();
        if (e.shiftKey) removeParticle('n'); else addParticle('n');
      } else if (k === 'e' || k === 'E') {
        e.preventDefault();
        if (e.shiftKey) removeParticle('e'); else addParticle('e');
      } else if (k === 'r' || k === 'R') {
        e.preventDefault();
        resetAtom();
      } else if (k === 'f' || k === 'F') {
        e.preventDefault();
        toggleFreeze();
      } else if (k === ' ' || k === 'Spacebar') {
        // WCAG 2.2.2 Pause/Play. Don't intercept when input/textarea/contenteditable focused.
        var ce = e.target.isContentEditable;
        if (t !== 'INPUT' && t !== 'TEXTAREA' && t !== 'SELECT' && !ce) {
          e.preventDefault();
          state.paused = !state.paused;
          if (!state.paused && typeof performance !== 'undefined' && performance.now) lastT = performance.now();
          tone(state.paused ? 380 : 720, 0.06, 'sine', 0.04);
        }
      } else if (k === 'o' || k === 'O') {
        e.preventDefault();
        var b = document.getElementById('ov-orbit'); if (b) b.click();
      } else if (k === 's' || k === 'S') {
        e.preventDefault();
        var b2 = document.getElementById('ov-spin'); if (b2) b2.click();
      } else if (k === 't' || k === 'T') {
        e.preventDefault();
        var b3 = document.getElementById('ov-table'); if (b3) b3.click();
      } else if (k === 'Escape') {
        var menu = document.getElementById('ctx-menu');
        if (menu) menu.style.display = 'none';
      }
    });
  }

  function toggleFreeze() {
    state.frozen = !state.frozen;
    var b = document.getElementById('btn-freeze');
    if (b) b.style.opacity = state.frozen ? '0.5' : '1';
  }

  /* ─── Drag electron OUT of canvas to remove ──────────────────── */
  function setupCanvasDragOut() {
    var dragging = null; // { idx }
    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var rect = canvas.getBoundingClientRect();
      var px = e.clientX - rect.left, py = e.clientY - rect.top;
      // hit-test electrons
      for (var i = 0; i < electronHitPoints.length; i++) {
        var hp = electronHitPoints[i];
        var d = Math.hypot(hp.x - px, hp.y - py);
        if (d <= 14) {
          dragging = { startX: e.clientX, startY: e.clientY };
          canvas.setPointerCapture(e.pointerId);
          startDrag('e', e.clientX, e.clientY);
          // pre-empt one electron from the model so the visual is in-sync
          removeParticle('e');
          return;
        }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (dragging && dragEl) moveDrag(e.clientX, e.clientY);
      // visual hint when over canvas during drag
      if (dragEl) {
        var card = canvas.parentElement;
        var r = canvas.getBoundingClientRect();
        var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        // Don't add a class when over canvas during electron-drag-out
        card.classList.toggle('drag-out-zone', dragging && !inside);
      }
    });
    canvas.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      // Particle already removed at start; just clean up the floating element
      if (dragEl) { document.body.removeChild(dragEl); dragEl = null; dragType = null; }
      canvas.parentElement.classList.remove('drag-out-zone');
      try { canvas.releasePointerCapture(e.pointerId); } catch (er) {}
      dragging = null;
    });
    canvas.addEventListener('pointercancel', function () {
      if (dragEl) { document.body.removeChild(dragEl); dragEl = null; dragType = null; }
      canvas.parentElement.classList.remove('drag-out-zone');
      dragging = null;
    });
  }

  /* ─── CSV export ─────────────────────────────────────────────── */
  function exportCSV() {
    var el = currentElement();
    var c = charge();
    var headers = ['Field', 'Value'];
    var rows = [
      ['Element',          el ? el[1] : 'No element'],
      ['Symbol',           el ? el[0] : '—'],
      ['Atomic Number Z',  state.p],
      ['Neutrons N',       state.n],
      ['Electrons',        state.e],
      ['Mass Number A',    massNumber()],
      ['Net Charge',       c === 0 ? '0' : (c > 0 ? '+' + c : c)],
      ['Configuration',    configString(state.e)],
      ['Stability',        state.p === 0 ? '—' : (isStable() ? 'Stable' : 'Unstable')],
      ['Standard atomic mass (u)', el ? el[2] : '—']
    ];
    var lines = [headers.join(',')];
    rows.forEach(function (r) {
      lines.push(r.map(function (v) {
        var s = String(v);
        if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0) s = '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(','));
    });
    var csv = lines.join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'atom_' + (el ? el[0] : 'empty') + '_' + (massNumber() || 0) + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 200);
  }

  /* ─── Wire learning panels expand/collapse ───────────────────── */
  function wireLearnPanels() {
    var exp = document.getElementById('learn-expand-all');
    var col = document.getElementById('learn-collapse-all');
    var cards = document.querySelectorAll('.learn-card');
    if (exp) exp.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); drawNZChart(); });
    if (col) col.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
    // redraw N-Z chart when stability card opens
    var sc = document.getElementById('lp-stability');
    if (sc) sc.addEventListener('toggle', function () { if (sc.open) setTimeout(drawNZChart, 50); });
  }

  /* ─── Canvas feature toggle wiring ───────────────────────────── */
  function setupCanvasToggles() {
    var map = { shellnum:'ct-shellnum', valence:'ct-valence', elabels:'ct-elabels', cloud:'ct-cloud', stability:'ct-stability' };
    Object.keys(map).forEach(function (k) {
      var el = document.getElementById(map[k]);
      if (!el) return;
      state.toggles[k] = el.checked;
      el.addEventListener('change', function () {
        state.toggles[k] = el.checked;
        // Stability toggle expands the stability card and scrolls to it
        if (k === 'stability' && el.checked) {
          var card = document.getElementById('lp-stability');
          if (card) { card.open = true; setTimeout(drawNZChart, 80); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
        }
      });
    });
    var speed = document.getElementById('anim-speed');
    if (speed) speed.addEventListener('input', function () { state.animSpeed = parseFloat(speed.value); });
  }

  /* ─── Fullscreen mode ────────────────────────────────────────── */
  function setupFullscreen() {
    var btn = document.getElementById('fs-btn');
    if (!btn) return;
    var target = document.getElementById('sec-simulate');
    if (!target) return;

    function enter() {
      var fn = target.requestFullscreen || target.webkitRequestFullscreen || target.msRequestFullscreen;
      if (fn) fn.call(target).catch(function () {});
    }
    function exit() {
      var fn = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (fn) fn.call(document).catch(function () {});
    }
    function isFs() {
      return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
    }
    btn.addEventListener('click', function () {
      if (isFs()) exit(); else enter();
    });
    // Re-fit canvas + relabel button on fullscreen change
    function onChange() {
      var fs = isFs();
      btn.setAttribute('aria-label', fs ? 'Exit fullscreen mode' : 'Enter fullscreen mode');
      btn.setAttribute('aria-pressed', fs ? 'true' : 'false');
      btn.title = fs ? 'Exit fullscreen (F or Esc)' : 'Enter fullscreen (F11)';
      var lbl = btn.querySelector('.fs-label');
      if (lbl) lbl.textContent = fs ? 'Exit' : 'Fullscreen';
      // Canvas needs to refit to the new container height
      requestAnimationFrame(function () { resizeCanvas(); });
      setTimeout(function () { resizeCanvas(); }, 120);
      setTimeout(function () { resizeCanvas(); }, 350);
      // Subtle confirmation tone
      tone(fs ? 800 : 500, 0.06, 'sine', 0.04);
    }
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    document.addEventListener('msfullscreenchange', onChange);

    // F11 / shift+F keyboard
    document.addEventListener('keydown', function (e) {
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'F11') {
        e.preventDefault();
        if (isFs()) exit(); else enter();
      }
    });
  }

  /* ─── Canvas overlay (orbit/spin/table) ──────────────────────── */
  function setupCanvasOverlayToggles() {
    var bindings = [
      { id: 'ov-orbit', key: 'orbit',          on: 'Orbit',  off: 'Paused' },
      { id: 'ov-spin',  key: 'spin',           on: 'Spin',   off: 'No spin' },
      { id: 'ov-table', key: 'showShellTable', on: 'Table',  off: 'Hidden' }
    ];
    bindings.forEach(function (b) {
      var btn = document.getElementById(b.id);
      if (!btn) return;
      function paint() {
        btn.classList.toggle('active', !!state[b.key]);
        var lbl = btn.querySelector('.ov-label');
        if (lbl) lbl.textContent = state[b.key] ? b.on : b.off;
      }
      btn.addEventListener('click', function () {
        state[b.key] = !state[b.key];
        paint();
        tone(state[b.key] ? 700 : 400, 0.05, 'sine', 0.04);
      });
      paint();
    });
  }

  /* ─── Init ────────────────────────────────────────────────────── */
  function init() {
    canvas = $('atom-canvas');
    ctx = canvas.getContext('2d');
    resizeCanvas();
    // Re-run after layout fully settles (atom-strip mounted, DOM measured)
    requestAnimationFrame(function () { resizeCanvas(); });
    setTimeout(function () { resizeCanvas(); }, 120);
    window.addEventListener('resize', function () { resizeCanvas(); });
    // Observe both the atom-strip AND the canvas-wrap — any container
    // size shift (including fullscreen layout settling) re-fits the canvas.
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(function () { resizeCanvas(); });
      var strip = document.getElementById('atom-strip');
      if (strip) ro.observe(strip);
      var wrap = canvas.parentElement;
      if (wrap) ro.observe(wrap);
    }

    // Bin buttons — trigger fly-in animation from bin → atom center
    document.querySelectorAll('.bin-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var type = b.dataset.type;
        var action = b.dataset.action;
        if (action === 'add') animatedAdd(type, b);
        else animatedRemove(type, b);
      });
    });

    // Action bar
    $('btn-reset').addEventListener('click', resetAtom);
    $('btn-export').addEventListener('click', saveImage);
    var csvBtn = $('btn-export-csv'); if (csvBtn) csvBtn.addEventListener('click', exportCSV);
    var freezeBtn = $('btn-freeze'); if (freezeBtn) freezeBtn.addEventListener('click', toggleFreeze);
    $('btn-sound').addEventListener('click', function () {
      state.soundOn = !state.soundOn;
      var b = $('btn-sound');
      b.setAttribute('aria-pressed', state.soundOn ? 'false' : 'true');
      var on  = b.querySelector('.snd-on');
      var off = b.querySelector('.snd-off');
      if (on)  on.style.display  = state.soundOn ? '' : 'none';
      if (off) off.style.display = state.soundOn ? 'none' : '';
    });
    var presetBtn = $('btn-preset');
    if (presetBtn) presetBtn.addEventListener('click', function () {
      // Random fun preset for inspiration
      var presets = [1, 2, 6, 8, 11, 17, 26, 29, 47, 79, 92];
      var z = presets[Math.floor(Math.random() * presets.length)];
      var el = E(z);
      state.p = z; state.n = el[3] - z; state.e = z;
      onChange();
    });

    // Mode tabs
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () { setMode(p.dataset.value); });
    });

    // Explore tabs
    document.querySelectorAll('.explore-tab').forEach(function (b) {
      b.addEventListener('click', function () {
        document.querySelectorAll('.explore-tab').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        renderExplore(b.dataset.cat);
      });
    });
    renderExplore('basics');

    // Practice
    document.querySelectorAll('#practice-mode-tabs .pill').forEach(function (p) {
      p.addEventListener('click', function () {
        document.querySelectorAll('#practice-mode-tabs .pill').forEach(function (x) { x.classList.remove('active'); });
        p.classList.add('active');
        $('practice-mode-pill').dataset.value = p.dataset.value;
        updatePracticeUI();
      });
    });
    $('practice-next').addEventListener('click', practiceNext);
    $('practice-reveal').addEventListener('click', function () {
      var z = state.practice.targetZ;
      var el = E(z);
      state.p = z; state.n = el[3] - z; state.e = z;
      onChange();
    });

    // Quiz
    $('quiz-next').addEventListener('click', nextQuizQ);
    $('quiz-retry').addEventListener('click', startQuiz);

    // Drag from bins
    attachBinDrag();
    drawBinPiles();

    // Periodic table mini
    buildPT();

    // Context menu
    setupCtxMenu();

    // ── v2 upgrade features ────────────────────────────────
    setupElementSearch();
    setupEditableCounts();
    setupCanvasToggles();
    setupCanvasDragOut();
    setupKeyboard();
    wireLearnPanels();

    // ── v3: canvas overlay toggles (orbit / spin / shell table) ──
    setupCanvasOverlayToggles();

    // ── v7: fullscreen experience ──
    setupFullscreen();

    // ── v13: periodic-table block filter ──
    setupPTFilter();

    // First render
    onChange();
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
