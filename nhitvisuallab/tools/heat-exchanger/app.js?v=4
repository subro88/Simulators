(function () {
  'use strict';

  /* ================================================================
     FLUID DATA
     ================================================================ */
  var FLUIDS = {
    water:  { name: 'Water',           cp: 4.18 },
    oil:    { name: 'Engine Oil',      cp: 2.10 },
    air:    { name: 'Air',             cp: 1.005 },
    glycol: { name: 'Ethylene Glycol', cp: 2.42 },
    steam:  { name: 'Steam',           cp: 2.01 }
  };

  /* ================================================================
     CONCEPTS — EXPLORE MODE
     ================================================================ */
  var CONCEPTS = [
    /* ── Fundamentals ──────────────────────────────────────────── */
    {
      id: 'heat-balance', name: 'Heat Balance', symbol: 'Q = mCp\u0394T',
      formula: 'Q = \u1E41\u2095Cp\u2095(T\u2095\u1D62\u2099\u2212T\u2095\u2092\u1D64\u209C) = \u1E41\u1D04Cp\u1D04(T\u1D04\u2092\u1D64\u209C\u2212T\u1D04\u1D62\u2099)', unit: 'W',
      cat: 'fundamentals',
      desc: 'The heat balance equation states that the heat lost by the hot fluid equals the heat gained by the cold fluid (assuming no losses). Q = \u1E41\u2095Cp\u2095(T\u2095,in \u2212 T\u2095,out) = \u1E41cCpc(Tc,out \u2212 Tc,in). This is the fundamental energy conservation equation for heat exchangers. The mass flow rate \u1E41 (kg/s) multiplied by the specific heat capacity Cp (kJ/kg\u00B7K) gives the heat capacity rate C (kW/K).',
      example: { problem: 'Water (\u1E41=2 kg/s, Cp=4.18 kJ/kgK) cools from 90\u00B0C to 50\u00B0C. Find Q.', steps: ['Q = \u1E41Cp\u0394T', 'Q = 2 \u00D7 4.18 \u00D7 (90\u221250)', 'Q = 2 \u00D7 4.18 \u00D7 40', 'Q = 334.4 kW'], answer: 334.4, unit: 'kW' }
    },
    {
      id: 'overall-u', name: 'Overall U Coefficient', symbol: '1/U = \u03A3R',
      formula: '1/U = 1/h\u1D62 + Rf\u1D62 + t/k + Rf\u2092 + 1/h\u2092', unit: 'W/m\u00B2K',
      cat: 'fundamentals',
      desc: 'The overall heat transfer coefficient U combines all thermal resistances between the two fluids in series: inside convection (1/h\u1D62), inside fouling (Rf\u1D62), wall conduction (t/k), outside fouling (Rf\u2092), and outside convection (1/h\u2092). Typical values: liquid-to-liquid 150\u20131500 W/m\u00B2K, gas-to-gas 10\u201350 W/m\u00B2K. Fouling reduces U over time and must be accounted for in design.',
      example: { problem: 'h\u1D62=1000, h\u2092=500 W/m\u00B2K, wall 3mm steel (k=50), no fouling. Find U.', steps: ['1/U = 1/1000 + 0.003/50 + 1/500', '1/U = 0.001 + 0.00006 + 0.002', '1/U = 0.00306', 'U = 326.8 W/m\u00B2K'], answer: 326.8, unit: 'W/m\u00B2K' }
    },
    {
      id: 'capacity-rate', name: 'Heat Capacity Rate', symbol: 'C = \u1E41Cp',
      formula: 'C = \u1E41 \u00D7 Cp (kW/K)', unit: 'kW/K',
      cat: 'fundamentals',
      desc: 'The heat capacity rate C = \u1E41Cp (kW/K) represents the rate of heat transfer per degree of temperature change for a fluid stream. The fluid with the smaller C is called Cmin and limits the maximum possible heat transfer. The capacity ratio Cr = Cmin/Cmax ranges from 0 (phase change) to 1 (balanced exchanger).',
      example: { problem: 'Oil flows at 3 kg/s with Cp = 2.1 kJ/kgK. Find the heat capacity rate.', steps: ['C = \u1E41 \u00D7 Cp', 'C = 3 \u00D7 2.1', 'C = 6.3 kW/K'], answer: 6.3, unit: 'kW/K' }
    },
    {
      id: 'fouling-factor', name: 'Fouling Factor', symbol: 'Rf',
      formula: '1/U_dirty = 1/U_clean + Rf\u1D62 + Rf\u2092', unit: 'm\u00B2K/W',
      cat: 'fundamentals',
      desc: 'Fouling is the accumulation of deposits on heat transfer surfaces that increases thermal resistance. The fouling factor Rf (m\u00B2K/W) represents this additional resistance. Common values: river water 0.0003, sea water 0.0001, fuel oil 0.0009, air 0.0004. Fouling reduces effectiveness and requires periodic cleaning or design oversizing (typically 10\u201325%).',
      example: { problem: 'Clean U = 500 W/m\u00B2K. Inner fouling 0.0002, outer fouling 0.0003 m\u00B2K/W. Find dirty U.', steps: ['1/U_dirty = 1/500 + 0.0002 + 0.0003', '1/U_dirty = 0.002 + 0.0005', '1/U_dirty = 0.0025', 'U_dirty = 400 W/m\u00B2K'], answer: 400, unit: 'W/m\u00B2K' }
    },

    /* ── Flow Arrangements ─────────────────────────────────────── */
    {
      id: 'parallel-flow', name: 'Parallel Flow', symbol: '\u0394T\u2081=Th\u1D62\u2212Tc\u1D62',
      formula: '\u0394T\u2081 = Th,in\u2212Tc,in; \u0394T\u2082 = Th,out\u2212Tc,out', unit: '\u00B0C',
      cat: 'flow',
      desc: 'In parallel (co-current) flow, both fluids enter at the same end. The temperature difference is largest at the inlet and decreases along the length. The cold outlet can never exceed the hot outlet temperature. Maximum effectiveness is limited: \u03B5_max = 1/(1+Cr). Parallel flow is simpler to construct but less thermally efficient than counter flow.',
      example: { problem: 'Parallel flow: Th,in=120\u00B0C, Th,out=80\u00B0C, Tc,in=20\u00B0C, Tc,out=50\u00B0C. Find LMTD.', steps: ['\u0394T\u2081 = 120\u221220 = 100\u00B0C', '\u0394T\u2082 = 80\u221250 = 30\u00B0C', 'LMTD = (100\u221230)/ln(100/30)', 'LMTD = 70/1.204 = 58.1\u00B0C'], answer: 58.1, unit: '\u00B0C' }
    },
    {
      id: 'counter-flow', name: 'Counter Flow', symbol: '\u0394T\u2081=Th\u1D62\u2212Tc\u2092',
      formula: '\u0394T\u2081 = Th,in\u2212Tc,out; \u0394T\u2082 = Th,out\u2212Tc,in', unit: '\u00B0C',
      cat: 'flow',
      desc: 'In counter flow, fluids enter at opposite ends and flow in opposite directions. This produces a more uniform temperature difference along the length, yielding higher LMTD for the same terminal temperatures. The cold outlet can exceed the hot outlet temperature. Counter flow can theoretically achieve \u03B5 = 1 (for infinite area), making it the most thermally efficient single-pass configuration.',
      example: { problem: 'Counter flow: Th,in=120\u00B0C, Th,out=80\u00B0C, Tc,in=20\u00B0C, Tc,out=50\u00B0C. Find LMTD.', steps: ['\u0394T\u2081 = 120\u221250 = 70\u00B0C', '\u0394T\u2082 = 80\u221220 = 60\u00B0C', 'LMTD = (70\u221260)/ln(70/60)', 'LMTD = 10/0.1542 = 64.9\u00B0C'], answer: 64.9, unit: '\u00B0C' }
    },
    {
      id: 'crossflow', name: 'Cross Flow', symbol: 'F\u00D7LMTD_cf',
      formula: 'Q = U\u00D7A\u00D7F\u00D7LMTD_counterflow', unit: 'W',
      cat: 'flow',
      desc: 'In cross flow, fluids flow perpendicular to each other (e.g., car radiator). The LMTD correction factor F (0 < F \u2264 1) accounts for the deviation from pure counter flow. F depends on two dimensionless parameters P and R. For most designs, F > 0.75 is acceptable. If F drops below 0.75, consider multiple passes or a different configuration.',
      example: { problem: 'Cross-flow HX with LMTD_cf = 60\u00B0C, F = 0.85, U = 300 W/m\u00B2K, A = 5 m\u00B2. Find Q.', steps: ['Q = U \u00D7 A \u00D7 F \u00D7 LMTD_cf', 'Q = 300 \u00D7 5 \u00D7 0.85 \u00D7 60', 'Q = 76500 W', 'Q = 76.5 kW'], answer: 76.5, unit: 'kW' }
    },

    /* ── Design Methods ────────────────────────────────────────── */
    {
      id: 'lmtd-method', name: 'LMTD Method', symbol: 'Q = UA\u0394Tlm',
      formula: '\u0394Tlm = (\u0394T\u2081\u2212\u0394T\u2082)/ln(\u0394T\u2081/\u0394T\u2082)', unit: '\u00B0C',
      cat: 'design',
      desc: 'The LMTD method is used when all four terminal temperatures are known (or three plus Q). The log mean temperature difference accounts for the exponentially varying \u0394T along the exchanger. When \u0394T\u2081 = \u0394T\u2082, LMTD equals either value. The method is straightforward for sizing problems: A = Q/(U\u00D7LMTD). It becomes iterative for rating problems where outlet temperatures are unknown.',
      example: { problem: 'Counter-flow: \u0394T\u2081=80\u00B0C, \u0394T\u2082=40\u00B0C, U=400 W/m\u00B2K, A=8 m\u00B2. Find Q.', steps: ['LMTD = (80\u221240)/ln(80/40)', 'LMTD = 40/ln(2) = 40/0.693', 'LMTD = 57.7\u00B0C', 'Q = 400\u00D78\u00D757.7 = 184,640 W = 184.6 kW'], answer: 184.6, unit: 'kW' }
    },
    {
      id: 'ntu-method', name: 'NTU Method', symbol: '\u03B5 = f(NTU, Cr)',
      formula: 'NTU = UA/Cmin, Cr = Cmin/Cmax', unit: '\u2014',
      cat: 'design',
      desc: 'The NTU-effectiveness method is ideal when outlet temperatures are unknown. First compute Cmin, Cmax, and Cr = Cmin/Cmax. Then NTU = UA/Cmin. The effectiveness \u03B5 depends on flow arrangement: Counter flow: \u03B5 = (1\u2212exp(\u2212NTU(1\u2212Cr)))/(1\u2212Cr\u00B7exp(\u2212NTU(1\u2212Cr))). Parallel: \u03B5 = (1\u2212exp(\u2212NTU(1+Cr)))/(1+Cr). Finally Q = \u03B5\u00B7Cmin\u00B7(Th,in\u2212Tc,in).',
      example: { problem: 'Counter-flow: NTU=2.0, Cr=0.5. Find effectiveness.', steps: ['\u03B5 = (1\u2212exp(\u2212NTU(1\u2212Cr)))/(1\u2212Cr\u00B7exp(\u2212NTU(1\u2212Cr)))', '\u03B5 = (1\u2212exp(\u22122\u00D70.5))/(1\u22120.5\u00D7exp(\u22122\u00D70.5))', '\u03B5 = (1\u2212e\u207B\u00B9)/(1\u22120.5\u00D7e\u207B\u00B9)', '\u03B5 = (1\u22120.368)/(1\u22120.184) = 0.632/0.816 = 0.774 = 77.4%'], answer: 77.4, unit: '%' }
    },
    {
      id: 'effectiveness', name: 'Effectiveness', symbol: '\u03B5 = Q/Qmax',
      formula: '\u03B5 = Q_actual / [Cmin(Th,in\u2212Tc,in)]', unit: '%',
      cat: 'design',
      desc: 'Heat exchanger effectiveness \u03B5 is the ratio of actual heat transfer to the maximum possible. Qmax = Cmin(Th,in \u2212 Tc,in) represents the heat transferred if one fluid undergoes the maximum possible temperature change. Typical effectiveness: 40\u201360% for single-pass exchangers, 70\u201395% for well-designed counter-flow units. Higher \u03B5 requires larger area (diminishing returns beyond \u03B5 \u2248 0.85).',
      example: { problem: 'Th,in=150\u00B0C, Tc,in=30\u00B0C, Ch=6 kW/K, Cc=8 kW/K, Q=504 kW. Find \u03B5.', steps: ['Cmin = 6 kW/K (hot side)', 'Qmax = Cmin(Th,in\u2212Tc,in) = 6\u00D7(150\u221230) = 720 kW', '\u03B5 = Q/Qmax = 504/720', '\u03B5 = 0.70 = 70%'], answer: 70, unit: '%' }
    },
    {
      id: 'required-area', name: 'Required Area', symbol: 'A = Q/(U\u0394Tlm)',
      formula: 'A = Q / (U \u00D7 LMTD)', unit: 'm\u00B2',
      cat: 'design',
      desc: 'The required heat transfer surface area is determined from A = Q/(U\u00D7LMTD). This is the fundamental sizing equation. A fouling factor increases the required area. Design margin of 10\u201325% is typically added. Shell-and-tube exchangers may need multiple passes to achieve the required area within practical shell diameters.',
      example: { problem: 'Q = 200 kW, U = 500 W/m\u00B2K, LMTD = 50\u00B0C. Find required area.', steps: ['A = Q / (U \u00D7 LMTD)', 'A = 200000 / (500 \u00D7 50)', 'A = 200000 / 25000', 'A = 8.0 m\u00B2'], answer: 8.0, unit: 'm\u00B2' }
    },

    /* ── Applications ──────────────────────────────────────────── */
    {
      id: 'shell-tube', name: 'Shell & Tube', symbol: 'Most common type',
      formula: 'Multiple tube passes inside a shell', unit: '\u2014',
      cat: 'applications',
      desc: 'Shell-and-tube heat exchangers are the most common type in industry. One fluid flows through tubes while the other flows around them inside a cylindrical shell. Baffles direct shell-side flow for better heat transfer. Advantages: handles high pressures and temperatures, easy to clean and maintain, wide range of materials. TEMA standards classify designs by front end, shell type, and rear end.',
      example: { problem: 'A 1-2 shell-tube HX: U=350 W/m\u00B2K, A=15 m\u00B2, LMTD_cf=55\u00B0C, F=0.90. Find Q.', steps: ['Q = U \u00D7 A \u00D7 F \u00D7 LMTD_cf', 'Q = 350 \u00D7 15 \u00D7 0.90 \u00D7 55', 'Q = 259,875 W', 'Q = 259.9 kW'], answer: 259.9, unit: 'kW' }
    },
    {
      id: 'plate-hx', name: 'Plate Heat Exchanger', symbol: 'Compact design',
      formula: 'High U due to thin plates & turbulence', unit: '\u2014',
      cat: 'applications',
      desc: 'Plate heat exchangers use thin corrugated plates to create channels for fluid flow. The corrugations create turbulence even at low Reynolds numbers, yielding high U values (1000\u20135000 W/m\u00B2K for liquid-liquid). Advantages: compact, easy to expand by adding plates, high effectiveness. Limitations: lower pressure rating (typically < 25 bar), gasket materials limit temperature. Common in HVAC, food processing, and marine applications.',
      example: { problem: 'Plate HX: U=2000 W/m\u00B2K, A=3 m\u00B2, LMTD=35\u00B0C. Find Q.', steps: ['Q = U \u00D7 A \u00D7 LMTD', 'Q = 2000 \u00D7 3 \u00D7 35', 'Q = 210,000 W', 'Q = 210 kW'], answer: 210, unit: 'kW' }
    },
    {
      id: 'double-pipe', name: 'Double Pipe', symbol: 'Simplest type',
      formula: 'Inner pipe inside outer pipe', unit: '\u2014',
      cat: 'applications',
      desc: 'A double-pipe (concentric tube) heat exchanger consists of one pipe placed inside another. One fluid flows through the inner pipe while the other flows in the annular space between the pipes. It can operate in parallel or counter flow. Advantages: simple construction, easy to maintain, true counter flow possible. Limitations: small surface area, only suitable for low to moderate heat duties. Often used as a teaching tool and for small-scale applications.',
      example: { problem: 'Double-pipe counter-flow: U=250 W/m\u00B2K, A=2 m\u00B2, LMTD=45\u00B0C. Find Q.', steps: ['Q = U \u00D7 A \u00D7 LMTD', 'Q = 250 \u00D7 2 \u00D7 45', 'Q = 22,500 W', 'Q = 22.5 kW'], answer: 22.5, unit: 'kW' }
    }
  ];

  /* ================================================================
     PROBLEM GENERATORS — PRACTICE MODE (12 generators)
     ================================================================ */
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randEl(arr) { return arr[randInt(0, arr.length - 1)]; }
  function rnd(v, d) { return +v.toFixed(d); }

  var PROBLEM_GEN = [
    /* 0 — LMTD for counter flow */
    function () {
      var Thi = randInt(100, 300), Tho = randInt(50, Thi - 20);
      var Tci = randInt(10, 50), Tco = randInt(Tci + 10, Tho + 20);
      if (Tco >= Thi) Tco = Thi - 10;
      var dT1 = Thi - Tco, dT2 = Tho - Tci;
      if (dT1 <= 0 || dT2 <= 0) { dT1 = 80; dT2 = 40; }
      var lmtd = rnd((dT1 - dT2) / Math.log(dT1 / dT2), 1);
      if (Math.abs(dT1 - dT2) < 1) lmtd = dT1;
      return { prompt: 'Counter-flow HX: Th,in=' + Thi + '\u00B0C, Th,out=' + Tho + '\u00B0C, Tc,in=' + Tci + '\u00B0C, Tc,out=' + Tco + '\u00B0C. Find LMTD (\u00B0C).',
        steps: ['\u0394T\u2081 = Th,in \u2212 Tc,out = ' + Thi + ' \u2212 ' + Tco + ' = ' + dT1 + '\u00B0C', '\u0394T\u2082 = Th,out \u2212 Tc,in = ' + Tho + ' \u2212 ' + Tci + ' = ' + dT2 + '\u00B0C', 'LMTD = (\u0394T\u2081\u2212\u0394T\u2082)/ln(\u0394T\u2081/\u0394T\u2082)', 'LMTD = (' + dT1 + '\u2212' + dT2 + ')/ln(' + dT1 + '/' + dT2 + ') = ' + lmtd + '\u00B0C'], answer: lmtd, unit: '\u00B0C', tol: 1 };
    },
    /* 1 — LMTD for parallel flow */
    function () {
      var Thi = randInt(100, 250), Tho = randInt(60, Thi - 20);
      var Tci = randInt(10, 40), Tco = randInt(Tci + 10, Tho - 5);
      var dT1 = Thi - Tci, dT2 = Tho - Tco;
      if (dT2 <= 0) dT2 = 10;
      var lmtd = rnd((dT1 - dT2) / Math.log(dT1 / dT2), 1);
      return { prompt: 'Parallel-flow HX: Th,in=' + Thi + '\u00B0C, Th,out=' + Tho + '\u00B0C, Tc,in=' + Tci + '\u00B0C, Tc,out=' + Tco + '\u00B0C. Find LMTD (\u00B0C).',
        steps: ['\u0394T\u2081 = Th,in \u2212 Tc,in = ' + Thi + ' \u2212 ' + Tci + ' = ' + dT1 + '\u00B0C', '\u0394T\u2082 = Th,out \u2212 Tc,out = ' + Tho + ' \u2212 ' + Tco + ' = ' + dT2 + '\u00B0C', 'LMTD = (' + dT1 + '\u2212' + dT2 + ')/ln(' + dT1 + '/' + dT2 + ')', 'LMTD = ' + lmtd + '\u00B0C'], answer: lmtd, unit: '\u00B0C', tol: 1 };
    },
    /* 2 — Heat rate from LMTD */
    function () {
      var U = randInt(100, 800), A = randInt(2, 20), lmtd = randInt(20, 80);
      var Q = rnd(U * A * lmtd / 1000, 1);
      return { prompt: 'A heat exchanger has U=' + U + ' W/m\u00B2K, A=' + A + ' m\u00B2, LMTD=' + lmtd + '\u00B0C. Find Q (kW).',
        steps: ['Q = U \u00D7 A \u00D7 LMTD', 'Q = ' + U + ' \u00D7 ' + A + ' \u00D7 ' + lmtd, 'Q = ' + (U * A * lmtd) + ' W', 'Q = ' + Q + ' kW'], answer: Q, unit: 'kW', tol: 0.5 };
    },
    /* 3 — Required area */
    function () {
      var Q = randInt(50, 500), U = randInt(200, 1000), lmtd = randInt(20, 70);
      var A = rnd(Q * 1000 / (U * lmtd), 1);
      return { prompt: 'Q=' + Q + ' kW, U=' + U + ' W/m\u00B2K, LMTD=' + lmtd + '\u00B0C. Find required area (m\u00B2).',
        steps: ['A = Q / (U \u00D7 LMTD)', 'A = ' + Q + '000 / (' + U + ' \u00D7 ' + lmtd + ')', 'A = ' + (Q * 1000) + ' / ' + (U * lmtd), 'A = ' + A + ' m\u00B2'], answer: A, unit: 'm\u00B2', tol: 0.5 };
    },
    /* 4 — Hot outlet temperature */
    function () {
      var fk = ['water', 'oil', 'glycol'];
      var fh = FLUIDS[randEl(fk)];
      var mh = rnd(randInt(10, 50) / 10, 1);
      var Thi = randInt(100, 200);
      var Q = randInt(50, 300);
      var Tho = rnd(Thi - Q / (mh * fh.cp), 1);
      return { prompt: fh.name + ' (\u1E41=' + mh + ' kg/s, Cp=' + fh.cp + ' kJ/kgK) enters at ' + Thi + '\u00B0C. Q=' + Q + ' kW. Find hot outlet temp (\u00B0C).',
        steps: ['Q = \u1E41Cp(Th,in \u2212 Th,out)', 'Th,out = Th,in \u2212 Q/(\u1E41Cp)', 'Th,out = ' + Thi + ' \u2212 ' + Q + '/(' + mh + '\u00D7' + fh.cp + ')', 'Th,out = ' + Tho + '\u00B0C'], answer: Tho, unit: '\u00B0C', tol: 1 };
    },
    /* 5 — Cold outlet temperature */
    function () {
      var fk = ['water', 'oil', 'glycol'];
      var fc = FLUIDS[randEl(fk)];
      var mc = rnd(randInt(10, 50) / 10, 1);
      var Tci = randInt(10, 40);
      var Q = randInt(30, 200);
      var Tco = rnd(Tci + Q / (mc * fc.cp), 1);
      return { prompt: fc.name + ' (\u1E41=' + mc + ' kg/s, Cp=' + fc.cp + ' kJ/kgK) enters at ' + Tci + '\u00B0C. Q=' + Q + ' kW. Find cold outlet temp (\u00B0C).',
        steps: ['Q = \u1E41Cp(Tc,out \u2212 Tc,in)', 'Tc,out = Tc,in + Q/(\u1E41Cp)', 'Tc,out = ' + Tci + ' + ' + Q + '/(' + mc + '\u00D7' + fc.cp + ')', 'Tc,out = ' + Tco + '\u00B0C'], answer: Tco, unit: '\u00B0C', tol: 1 };
    },
    /* 6 — Overall U with fouling */
    function () {
      var hi = randInt(500, 2000), ho = randInt(300, 1500);
      var Rfi = rnd(randInt(1, 5) / 10000, 4), Rfo = rnd(randInt(1, 5) / 10000, 4);
      var invU = 1 / hi + Rfi + Rfo + 1 / ho;
      var U = rnd(1 / invU, 1);
      return { prompt: 'h\u1D62=' + hi + ', h\u2092=' + ho + ' W/m\u00B2K. Fouling: Rf\u1D62=' + Rfi + ', Rf\u2092=' + Rfo + ' m\u00B2K/W. Neglect wall. Find U (W/m\u00B2K).',
        steps: ['1/U = 1/h\u1D62 + Rf\u1D62 + Rf\u2092 + 1/h\u2092', '1/U = 1/' + hi + ' + ' + Rfi + ' + ' + Rfo + ' + 1/' + ho, '1/U = ' + rnd(invU, 5), 'U = ' + U + ' W/m\u00B2K'], answer: U, unit: 'W/m\u00B2K', tol: 5 };
    },
    /* 7 — Heat balance: find mass flow rate */
    function () {
      var fc = FLUIDS[randEl(['water', 'oil', 'glycol'])];
      var Tci = randInt(10, 30), Tco = randInt(Tci + 20, 80);
      var Q = randInt(50, 400);
      var mc = rnd(Q / (fc.cp * (Tco - Tci)), 2);
      return { prompt: 'Cold side: ' + fc.name + ' (Cp=' + fc.cp + ' kJ/kgK), Tc,in=' + Tci + '\u00B0C, Tc,out=' + Tco + '\u00B0C. Q=' + Q + ' kW. Find \u1E41c (kg/s).',
        steps: ['Q = \u1E41cCpc(Tc,out \u2212 Tc,in)', '\u1E41c = Q / [Cpc(Tc,out\u2212Tc,in)]', '\u1E41c = ' + Q + ' / (' + fc.cp + '\u00D7' + (Tco - Tci) + ')', '\u1E41c = ' + mc + ' kg/s'], answer: mc, unit: 'kg/s', tol: 0.05 };
    },
    /* 8 — NTU from given parameters */
    function () {
      var U = randInt(200, 800), A = randInt(5, 30);
      var Cmin = rnd(randInt(20, 100) / 10, 1);
      var NTU = rnd(U * A / (Cmin * 1000), 2);
      return { prompt: 'U=' + U + ' W/m\u00B2K, A=' + A + ' m\u00B2, Cmin=' + Cmin + ' kW/K. Find NTU.',
        steps: ['NTU = UA / Cmin', 'NTU = (' + U + ' \u00D7 ' + A + ') / (' + Cmin + ' \u00D7 1000)', 'NTU = ' + (U * A) + ' / ' + (Cmin * 1000), 'NTU = ' + NTU], answer: NTU, unit: '', tol: 0.05 };
    },
    /* 9 — Effectiveness from Q */
    function () {
      var Thi = randInt(100, 250), Tci = randInt(10, 40);
      var Cmin = rnd(randInt(20, 80) / 10, 1);
      var Qmax = rnd(Cmin * (Thi - Tci), 1);
      var eps = randInt(40, 90) / 100;
      var Q = rnd(eps * Qmax, 1);
      var effP = rnd(eps * 100, 1);
      return { prompt: 'Th,in=' + Thi + '\u00B0C, Tc,in=' + Tci + '\u00B0C, Cmin=' + Cmin + ' kW/K. Q=' + Q + ' kW. Find effectiveness (%).',
        steps: ['Qmax = Cmin(Th,in\u2212Tc,in) = ' + Cmin + '\u00D7' + (Thi - Tci) + ' = ' + Qmax + ' kW', '\u03B5 = Q/Qmax = ' + Q + '/' + Qmax, '\u03B5 = ' + rnd(eps, 3), '\u03B5 = ' + effP + '%'], answer: effP, unit: '%', tol: 1 };
    },
    /* 10 — Counter-flow effectiveness from NTU */
    function () {
      var NTU = rnd(randInt(5, 30) / 10, 1);
      var Cr = rnd(randInt(2, 8) / 10, 1);
      var expTerm = Math.exp(-NTU * (1 - Cr));
      var eps = rnd((1 - expTerm) / (1 - Cr * expTerm) * 100, 1);
      return { prompt: 'Counter-flow HX: NTU=' + NTU + ', Cr=' + Cr + '. Find effectiveness (%).',
        steps: ['\u03B5 = (1\u2212exp(\u2212NTU(1\u2212Cr)))/(1\u2212Cr\u00B7exp(\u2212NTU(1\u2212Cr)))', 'exp(\u2212' + NTU + '\u00D7(1\u2212' + Cr + ')) = exp(\u2212' + rnd(NTU * (1 - Cr), 3) + ') = ' + rnd(expTerm, 4), '\u03B5 = (1\u2212' + rnd(expTerm, 4) + ')/(1\u2212' + Cr + '\u00D7' + rnd(expTerm, 4) + ')', '\u03B5 = ' + eps + '%'], answer: eps, unit: '%', tol: 1 };
    },
    /* 11 — Parallel-flow effectiveness from NTU */
    function () {
      var NTU = rnd(randInt(5, 25) / 10, 1);
      var Cr = rnd(randInt(2, 8) / 10, 1);
      var expTerm = Math.exp(-NTU * (1 + Cr));
      var eps = rnd((1 - expTerm) / (1 + Cr) * 100, 1);
      return { prompt: 'Parallel-flow HX: NTU=' + NTU + ', Cr=' + Cr + '. Find effectiveness (%).',
        steps: ['\u03B5 = (1\u2212exp(\u2212NTU(1+Cr)))/(1+Cr)', 'exp(\u2212' + NTU + '\u00D7(1+' + Cr + ')) = exp(\u2212' + rnd(NTU * (1 + Cr), 3) + ') = ' + rnd(expTerm, 4), '\u03B5 = (1\u2212' + rnd(expTerm, 4) + ')/(1+' + Cr + ')', '\u03B5 = ' + eps + '%'], answer: eps, unit: '%', tol: 1 };
    }
  ];

  /* ================================================================
     QUIZ POOL — 15 questions (8 MCQ + 7 numeric)
     ================================================================ */
  var QUIZ_POOL = [
    /* MCQ */
    { type: 'mcq', prompt: 'Which flow arrangement gives higher LMTD for the same terminal temperatures?', options: ['Parallel flow', 'Counter flow', 'Cross flow', 'They are equal'], correct: 1, explain: 'Counter flow produces a more uniform \u0394T distribution, yielding higher LMTD.' },
    { type: 'mcq', prompt: 'In a parallel-flow heat exchanger, the cold outlet temperature:', options: ['Can exceed the hot outlet temperature', 'Can never exceed the hot outlet temperature', 'Always equals the hot outlet temperature', 'Depends on the fluid type only'], correct: 1, explain: 'In parallel flow, both temperatures approach the same equilibrium value, so Tc,out \u2264 Th,out.' },
    { type: 'mcq', prompt: 'What does NTU stand for in heat exchanger analysis?', options: ['Net Thermal Units', 'Number of Transfer Units', 'Nominal Tube Utilisation', 'Non-dimensional Temperature Utility'], correct: 1, explain: 'NTU = Number of Transfer Units = UA/Cmin. It is a dimensionless measure of heat exchanger size.' },
    { type: 'mcq', prompt: 'Fouling in a heat exchanger:', options: ['Increases the overall U', 'Decreases the overall U', 'Has no effect on U', 'Only affects the hot side'], correct: 1, explain: 'Fouling adds thermal resistance, decreasing U: 1/U_dirty = 1/U_clean + Rf_i + Rf_o.' },
    { type: 'mcq', prompt: 'The LMTD method is most convenient when:', options: ['Outlet temperatures are unknown', 'All four terminal temperatures are known', 'Only inlet temperatures are known', 'The flow rate is unknown'], correct: 1, explain: 'The LMTD method requires all terminal temperatures. When outlets are unknown, the NTU method is preferred.' },
    { type: 'mcq', prompt: 'Which heat exchanger type has the highest typical U values?', options: ['Double-pipe', 'Shell-and-tube', 'Plate heat exchanger', 'Air-cooled'], correct: 2, explain: 'Plate exchangers achieve U = 1000\u20135000 W/m\u00B2K due to thin corrugated plates creating high turbulence.' },
    { type: 'mcq', prompt: 'The capacity ratio Cr = Cmin/Cmax = 0 corresponds to:', options: ['Balanced heat exchanger', 'Fluid undergoing phase change', 'Infinite area exchanger', 'Zero heat transfer'], correct: 1, explain: 'Cr = 0 when one fluid undergoes phase change (boiling/condensation) so its Cmax approaches infinity.' },
    { type: 'mcq', prompt: 'In the formula Q = UA\u0394Tlm, increasing the area A while keeping U and \u0394Tlm constant:', options: ['Decreases Q', 'Increases Q linearly', 'Does not affect Q', 'Increases Q quadratically'], correct: 1, explain: 'Q is directly proportional to A. Doubling area doubles the heat transfer rate (all else equal).' },
    /* Numeric */
    { type: 'numeric', prompt: 'Counter-flow: \u0394T\u2081 = 80\u00B0C, \u0394T\u2082 = 40\u00B0C. Find LMTD (\u00B0C).', answer: 57.7, unit: '\u00B0C', tol: 1, explain: 'LMTD = (80\u221240)/ln(80/40) = 40/0.693 = 57.7\u00B0C' },
    { type: 'numeric', prompt: 'U = 400 W/m\u00B2K, A = 10 m\u00B2, LMTD = 50\u00B0C. Find Q in kW.', answer: 200, unit: 'kW', tol: 1, explain: 'Q = 400\u00D710\u00D750 = 200,000 W = 200 kW' },
    { type: 'numeric', prompt: 'Water (2 kg/s, Cp=4.18) cools from 90\u00B0C to 50\u00B0C. Find Q in kW.', answer: 334.4, unit: 'kW', tol: 2, explain: 'Q = 2\u00D74.18\u00D7(90\u221250) = 334.4 kW' },
    { type: 'numeric', prompt: 'Q = 150 kW, U = 500 W/m\u00B2K, LMTD = 40\u00B0C. Find area (m\u00B2).', answer: 7.5, unit: 'm\u00B2', tol: 0.5, explain: 'A = 150000/(500\u00D740) = 7.5 m\u00B2' },
    { type: 'numeric', prompt: 'Cmin = 5 kW/K, Th,in = 200\u00B0C, Tc,in = 30\u00B0C. Find Qmax (kW).', answer: 850, unit: 'kW', tol: 5, explain: 'Qmax = 5\u00D7(200\u221230) = 850 kW' },
    { type: 'numeric', prompt: 'Counter-flow: NTU = 1.5, Cr = 0.5. Find effectiveness (%).', answer: 69.8, unit: '%', tol: 2, explain: '\u03B5 = (1\u2212exp(\u22121.5\u00D70.5))/(1\u22120.5\u00D7exp(\u22121.5\u00D70.5)) = 0.698 = 69.8%' },
    { type: 'numeric', prompt: 'h\u1D62=1000 W/m\u00B2K, h\u2092=500 W/m\u00B2K. Neglect wall and fouling. Find U (W/m\u00B2K).', answer: 333.3, unit: 'W/m\u00B2K', tol: 5, explain: '1/U = 1/1000 + 1/500 = 0.003, U = 333.3 W/m\u00B2K' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */
  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');

  var modeTabs = document.getElementById('mode-tabs');
  var flowTabs = document.getElementById('flow-tabs');
  var simPanel = document.getElementById('sim-panel');
  var catRow = document.getElementById('cat-row');
  var catTabs = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');

  /* Simulate controls */
  var slThin = document.getElementById('sl-thin');
  var slTcin = document.getElementById('sl-tcin');
  var slMh = document.getElementById('sl-mh');
  var slMc = document.getElementById('sl-mc');
  var slU = document.getElementById('sl-u');
  var slArea = document.getElementById('sl-area');
  var selHot = document.getElementById('hot-fluid');
  var selCold = document.getElementById('cold-fluid');

  /* Readouts */
  var rQ = document.getElementById('r-q');
  var rLmtd = document.getElementById('r-lmtd');
  var rEff = document.getElementById('r-eff');
  var rNtu = document.getElementById('r-ntu');
  var rThout = document.getElementById('r-thout');
  var rTcout = document.getElementById('r-tcout');

  /* Practice refs */
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var flowType = 'counter';
  var exploreCat = 'fundamentals';
  var exploreIdx = 0;

  /* Practice state */
  var practiceCorrect = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* Animation */
  var animT = 0;
  var animId = null;

  /* ================================================================
     CANVAS SIZING
     ================================================================ */
  function sizeCanvas() {
    var w = canvas.parentElement.clientWidth - 16;
    var h = Math.min(w * 0.55, 400);
    canvas.width = w * (window.devicePixelRatio || 1);
    canvas.height = h * (window.devicePixelRatio || 1);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform((window.devicePixelRatio || 1), 0, 0, (window.devicePixelRatio || 1), 0, 0);
  }

  /* ================================================================
     HEAT EXCHANGER CALCULATIONS
     ================================================================ */
  function calcHX() {
    var Thi = +slThin.value;
    var Tci = +slTcin.value;
    var mh = +slMh.value;
    var mc = +slMc.value;
    var U = +slU.value;
    var A = +slArea.value;
    var Cph = FLUIDS[selHot.value].cp;
    var Cpc = FLUIDS[selCold.value].cp;

    var Ch = mh * Cph; // kW/K
    var Cc = mc * Cpc;
    var Cmin = Math.min(Ch, Cc);
    var Cmax = Math.max(Ch, Cc);
    var Cr = Cmin / Cmax;

    // NTU
    var NTU = (U * A) / (Cmin * 1000);

    // Effectiveness
    var eps;
    if (Cr < 0.001) {
      eps = 1 - Math.exp(-NTU);
    } else if (flowType === 'counter') {
      if (Math.abs(Cr - 1) < 0.001) {
        eps = NTU / (1 + NTU);
      } else {
        var expT = Math.exp(-NTU * (1 - Cr));
        eps = (1 - expT) / (1 - Cr * expT);
      }
    } else {
      // parallel
      var expT2 = Math.exp(-NTU * (1 + Cr));
      eps = (1 - expT2) / (1 + Cr);
    }
    if (eps > 1) eps = 1;
    if (eps < 0) eps = 0;

    var Qmax = Cmin * (Thi - Tci); // kW
    var Q = eps * Qmax;

    // Outlet temps
    var Tho = Thi - Q / Ch;
    var Tco = Tci + Q / Cc;

    // LMTD
    var dT1, dT2;
    if (flowType === 'counter') {
      dT1 = Thi - Tco;
      dT2 = Tho - Tci;
    } else {
      dT1 = Thi - Tci;
      dT2 = Tho - Tco;
    }
    var lmtd;
    if (dT1 <= 0 || dT2 <= 0) {
      lmtd = 0;
    } else if (Math.abs(dT1 - dT2) < 0.01) {
      lmtd = dT1;
    } else {
      lmtd = (dT1 - dT2) / Math.log(dT1 / dT2);
    }

    return { Q: Q, lmtd: lmtd, eps: eps, NTU: NTU, Thi: Thi, Tho: Tho, Tci: Tci, Tco: Tco,
             Cr: Cr, Ch: Ch, Cc: Cc, Cmin: Cmin };
  }

  /* ================================================================
     DRAWING — SIMULATE MODE
     ================================================================ */
  function draw() {
    var W = canvas.width / (window.devicePixelRatio || 1);
    var H = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, W, H);

    if (mode !== 'simulate') {
      drawExploreCanvas(W, H);
      return;
    }

    var res = calcHX();

    /* The four port labels sit outside the exchanger body, right-aligned at
       exX-30 and left-aligned at exX+exW+30. With the old fixed pad of 50 a
       label like "Hot in 150°C" (~90px) ran about 60px off BOTH edges of the
       canvas — the inlet captions rendered as "0°C" and "5°C". Derive the
       padding from the measured label width instead, and drop the words on
       narrow canvases where the arrow colour and legend already say which
       stream is which. */
    var wordy = W >= 760;
    ctx.font = 'bold 11px Segoe UI, system-ui, sans-serif';
    var LBL = {
      hotIn:   (wordy ? 'Hot in ' : '') + res.Thi.toFixed(0) + '°C',
      hotOut:  res.Tho.toFixed(1) + '°C' + (wordy ? ' Hot out' : ''),
      coldIn:  res.Tci.toFixed(0) + '°C' + (wordy ? ' Cold in' : ''),
      coldOut: (wordy ? 'Cold out ' : '') + res.Tco.toFixed(1) + '°C',
      coldInL: (wordy ? 'Cold in ' : '') + res.Tci.toFixed(0) + '°C',
      coldOutR: res.Tco.toFixed(1) + '°C' + (wordy ? ' Cold out' : '')
    };
    var maxLbl = 0;
    for (var lk in LBL) {
      if (Object.prototype.hasOwnProperty.call(LBL, lk)) {
        maxLbl = Math.max(maxLbl, ctx.measureText(LBL[lk]).width);
      }
    }
    // label ends at exX-30, so it starts at pad-30-maxLbl; keep that >= 2px
    var pad = Math.max(50, Math.min(W * 0.30, maxLbl + 34));
    var exW = W - pad * 2;
    var exH = H - pad * 2 - 20;
    var exX = pad;
    var exY = pad + 10;

    // Draw heat exchanger body
    ctx.save();
    ctx.fillStyle = '#1f2535';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    var bodyY = exY;
    var bodyH = exH * 0.35;
    roundRect(ctx, exX, bodyY, exW, bodyH, 8);
    ctx.fill();
    ctx.stroke();

    // Shell label
    ctx.fillStyle = '#6b7a99';
    ctx.font = '11px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Heat Exchanger (' + (flowType === 'counter' ? 'Counter' : 'Parallel') + ' Flow)', W / 2, bodyY - 6);

    // Tubes inside
    var nTubes = 3;
    for (var i = 0; i < nTubes; i++) {
      var ty = bodyY + bodyH * (0.25 + 0.25 * i);
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(exX + 10, ty);
      ctx.lineTo(exX + exW - 10, ty);
      ctx.stroke();
    }

    // Hot fluid arrows (shell side) — always left to right
    drawArrow(ctx, exX - 25, bodyY + bodyH * 0.15, exX - 5, bodyY + bodyH * 0.15, '#ef5350', 2);
    ctx.fillStyle = '#ef5350';
    ctx.font = 'bold 11px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(LBL.hotIn, exX - 30, bodyY + bodyH * 0.15 + 4);

    drawArrow(ctx, exX + exW + 5, bodyY + bodyH * 0.85, exX + exW + 25, bodyY + bodyH * 0.85, '#ff8a65', 2);
    ctx.fillStyle = '#ff8a65';
    ctx.textAlign = 'left';
    ctx.fillText(LBL.hotOut, exX + exW + 30, bodyY + bodyH * 0.85 + 4);

    // Cold fluid arrows (tube side)
    if (flowType === 'counter') {
      // Cold enters right, exits left
      drawArrow(ctx, exX + exW + 25, bodyY + bodyH * 0.35, exX + exW + 5, bodyY + bodyH * 0.35, '#42a5f5', 2);
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'left';
      ctx.fillText(LBL.coldIn, exX + exW + 30, bodyY + bodyH * 0.35 + 4);

      drawArrow(ctx, exX - 5, bodyY + bodyH * 0.65, exX - 25, bodyY + bodyH * 0.65, '#81d4fa', 2);
      ctx.fillStyle = '#81d4fa';
      ctx.textAlign = 'right';
      ctx.fillText(LBL.coldOut, exX - 30, bodyY + bodyH * 0.65 + 4);
    } else {
      // Parallel: cold enters left, exits right
      drawArrow(ctx, exX - 25, bodyY + bodyH * 0.65, exX - 5, bodyY + bodyH * 0.65, '#42a5f5', 2);
      ctx.fillStyle = '#42a5f5';
      ctx.textAlign = 'right';
      ctx.fillText(LBL.coldInL, exX - 30, bodyY + bodyH * 0.65 + 4);

      drawArrow(ctx, exX + exW + 5, bodyY + bodyH * 0.35, exX + exW + 25, bodyY + bodyH * 0.35, '#81d4fa', 2);
      ctx.fillStyle = '#81d4fa';
      ctx.textAlign = 'left';
      ctx.fillText(LBL.coldOutR, exX + exW + 30, bodyY + bodyH * 0.35 + 4);
    }

    // Flow particles animation
    drawFlowParticles(exX, bodyY, exW, bodyH, res);

    // Temperature profile chart
    var chartY = bodyY + bodyH + 35;
    var chartH = exH - bodyH - 35;
    var chartW = exW;
    drawTempProfile(exX, chartY, chartW, chartH, res);

    ctx.restore();

    // Update readouts
    rQ.textContent = res.Q.toFixed(1);
    rLmtd.textContent = res.lmtd.toFixed(1);
    rEff.textContent = (res.eps * 100).toFixed(1);
    rNtu.textContent = res.NTU.toFixed(2);
    rThout.textContent = res.Tho.toFixed(1);
    rTcout.textContent = res.Tco.toFixed(1);

    // Update slider labels
    document.getElementById('sv-thin').innerHTML = slThin.value + ' &deg;C';
    document.getElementById('sv-tcin').innerHTML = slTcin.value + ' &deg;C';
    document.getElementById('sv-mh').textContent = (+slMh.value).toFixed(1) + ' kg/s';
    document.getElementById('sv-mc').textContent = (+slMc.value).toFixed(1) + ' kg/s';
    document.getElementById('sv-u').textContent = slU.value;
    document.getElementById('sv-area').innerHTML = slArea.value + ' m&sup2;';
  }

  function drawFlowParticles(x, y, w, h, res) {
    var t = animT;
    // Hot side particles (shell)
    ctx.fillStyle = '#ef5350';
    for (var i = 0; i < 6; i++) {
      var px = x + 10 + ((t * 0.3 + i * w / 6) % (w - 20));
      var py = y + h * 0.12 + Math.sin(t * 0.05 + i) * 4;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Cold side particles (tubes)
    ctx.fillStyle = '#42a5f5';
    var dir = flowType === 'counter' ? -1 : 1;
    for (var j = 0; j < 6; j++) {
      var cpx;
      if (dir > 0) {
        cpx = x + 10 + ((t * 0.25 + j * w / 6) % (w - 20));
      } else {
        cpx = x + w - 10 - ((t * 0.25 + j * w / 6) % (w - 20));
      }
      var cpy = y + h * 0.5 + Math.sin(t * 0.05 + j * 1.3) * 6;
      ctx.beginPath();
      ctx.arc(cpx, cpy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTempProfile(x, y, w, h, res) {
    // Axes
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Position along exchanger', x + w / 2, y + h + 14);
    /* The y tick labels are right-aligned at x-4 and run ~20px wide, so a
       rotated title at x-14 landed on top of them. x-34 clears them; the chart
       starts at exX (>= 82px) so there is room. */
    ctx.save();
    ctx.translate(x - 34, y + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Temperature (\u00B0C)', 0, 0);
    ctx.restore();

    // Temperature range
    var allTemps = [res.Thi, res.Tho, res.Tci, res.Tco];
    var Tmin = Math.min.apply(null, allTemps) - 10;
    var Tmax = Math.max.apply(null, allTemps) + 10;
    if (Tmax - Tmin < 20) { Tmin -= 10; Tmax += 10; }

    function tY(T) { return y + h - (T - Tmin) / (Tmax - Tmin) * h; }

    // Grid lines
    ctx.strokeStyle = '#1a2030';
    ctx.lineWidth = 0.5;
    for (var g = 0; g <= 4; g++) {
      var gT = Tmin + (Tmax - Tmin) * g / 4;
      var gy = tY(gT);
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + w, gy);
      ctx.stroke();
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'right';
      ctx.font = '9px Courier New, monospace';
      ctx.fillText(gT.toFixed(0), x - 4, gy + 3);
    }

    /* Temperature profiles along the exchanger.

       These curves used to be straight lines — a linear interpolation from
       inlet to outlet, drawn through a 30-point loop under a comment that
       claimed "Exponential temperature profile". The real profile IS
       exponential: the local driving difference decays as
           ΔT(ξ) = ΔT₁ · exp(−βξ)
       with β = NTU·Cmin·(1/Ch ∓ 1/Cc), minus for counter flow and plus for
       parallel. Integrating dTh/dξ = −(UA/Ch)·ΔT gives a shape factor

           f(ξ) = (1 − e^(−βξ)) / (1 − e^(−β))

       so Th(ξ) = Thi − (Thi − Tho)·f(ξ), and the cold line follows from
       Tc(ξ) = Th(ξ) − ΔT₁·e^(−βξ), which keeps the two curves consistent with
       each other and with both end states by construction.

       Straight lines are correct only for balanced counter flow (Ch = Cc), and
       the formula reduces to f(ξ) = ξ in exactly that case — so the special
       case the old code got right by accident still comes out right. */
    var nPts = 40;
    var beta = res.NTU * res.Cmin *
               (flowType === 'counter' ? (1 / res.Ch - 1 / res.Cc)
                                       : (1 / res.Ch + 1 / res.Cc));
    var dT1 = (flowType === 'counter') ? (res.Thi - res.Tco) : (res.Thi - res.Tci);
    var denom = 1 - Math.exp(-beta);
    function shape(xi) {
      // β → 0 (balanced counter flow) is the linear limit
      if (Math.abs(beta) < 1e-6 || Math.abs(denom) < 1e-9) return xi;
      return (1 - Math.exp(-beta * xi)) / denom;
    }

    // Hot fluid line (always left to right, descending)
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var p = 0; p <= nPts; p++) {
      var frac = p / nPts;
      var Th = res.Thi - (res.Thi - res.Tho) * shape(frac);
      var px2 = x + frac * w;
      var py2 = tY(Th);
      if (p === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();

    // Cold fluid line — derived from the hot line and the decaying ΔT, so the
    // gap between the curves is the true local driving difference everywhere.
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var q = 0; q <= nPts; q++) {
      var frac2 = q / nPts;
      var ThAt = res.Thi - (res.Thi - res.Tho) * shape(frac2);
      var Tc = ThAt - dT1 * Math.exp(-beta * frac2);
      var px3 = x + frac2 * w;
      var py3 = tY(Tc);
      if (q === 0) ctx.moveTo(px3, py3); else ctx.lineTo(px3, py3);
    }
    ctx.stroke();

    // Legend
    ctx.font = 'bold 10px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ef5350';
    ctx.fillText('\u25CF Hot fluid', x + 10, y + 14);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('\u25CF Cold fluid', x + 90, y + 14);
  }

  function drawExploreCanvas(W, H) {
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2a3050';
    ctx.font = '14px Segoe UI, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Select a concept to view its diagram', W / 2, H / 2);
  }

  /* ================================================================
     DRAWING HELPERS
     ================================================================ */
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

  function drawArrow(c, x1, y1, x2, y2, color, lw) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / len, uy = dy / len;
    c.strokeStyle = color;
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    // Arrowhead
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x2, y2);
    c.lineTo(x2 - ux * 8 - uy * 4, y2 - uy * 8 + ux * 4);
    c.lineTo(x2 - ux * 8 + uy * 4, y2 - uy * 8 - ux * 4);
    c.closePath();
    c.fill();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    animT++;
    draw();
    animId = requestAnimationFrame(animate);
  }

  function startAnim() {
    if (!animId) animate();
  }

  function stopAnim() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
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

    canvas.parentElement.style.display = (m === 'simulate') ? '' : 'none';

    if (m === 'simulate') {
      simPanel.style.display = '';
      startAnim();
    } else {
      stopAnim();
    }

    if (m === 'explore') {
      catRow.style.display = '';
      itemSelector.style.display = '';
      buildConceptGrid();
    }

    if (m === 'practice') {
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      practiceCorrect = 0; practiceTotal = 0;
      pbarScoreVal.textContent = '0 / 0';
      newPractice();
    }

    if (m === 'quiz') {
      startQuiz();
    }
  }

  /* ================================================================
     FLOW TYPE SWITCHING
     ================================================================ */
  flowTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    flowType = e.target.dataset.flow;
    flowTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    draw();
  });

  /* ================================================================
     SLIDER EVENTS
     ================================================================ */
  [slThin, slTcin, slMh, slMc, slU, slArea].forEach(function (sl) {
    sl.addEventListener('input', function () { draw(); });
  });
  selHot.addEventListener('change', function () { draw(); });
  selCold.addEventListener('change', function () { draw(); });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    buildConceptGrid();
    itemInfo.style.display = 'none';
  });

  function buildConceptGrid() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    conceptGrid.innerHTML = '';
    filtered.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn';
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        conceptGrid.querySelectorAll('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConcept(c);
      });
      conceptGrid.appendChild(btn);
    });
  }

  function showConcept(c) {
    itemInfo.style.display = '';
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>';
    html += '<div class="ii-desc">' + c.desc + '</div>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>';
    if (c.unit && c.unit !== '\u2014') html += '<span class="fb-unit">Unit: ' + c.unit + '</span>';
    html += '</div>';
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<div class="ex-problem">' + c.example.problem + '</div>';
      c.example.steps.forEach(function (s) {
        html += '<div class="ex-step">\u2192 <strong>' + s + '</strong></div>';
      });
      html += '</div>';
    }
    itemInfo.innerHTML = html;
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function newPractice() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    currentProblem = gen();
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    practiceAnswered = false;
    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Enter a number'; ppFeedback.className = 'feedback err'; return; }
    practiceAnswered = true;
    practiceTotal++;
    var tol = currentProblem.tol || Math.abs(currentProblem.answer * 0.05) || 0.5;
    if (Math.abs(val - currentProblem.answer) <= tol) {
      practiceCorrect++;
      ppFeedback.textContent = '\u2713 Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '\u2717 Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback err';
    }
    pbarScoreVal.textContent = practiceCorrect + ' / ' + practiceTotal;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';

    // Show solution
    ppSolution.style.display = '';
    var solHtml = '<h4>Solution</h4>';
    currentProblem.steps.forEach(function (s) {
      solHtml += '<div class="sol-step">\u2192 <strong>' + s + '</strong></div>';
    });
    ppSolution.innerHTML = solHtml;
  });

  ppNext.addEventListener('click', newPractice);
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
    quizScore = 0; quizIdx = 0; quizAnswers = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    /* Fisher-Yates, not sort(() => Math.random() - 0.5). A comparator that
       returns random values is not a valid ordering, so that idiom produces a
       measurably non-uniform permutation (and its result varies by engine). */
    var pool = QUIZ_POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
    }
    /* Shuffle each MCQ's OPTIONS as well. Seven of the eight authored questions
       put the answer at index 1, so picking the second option every time scored
       ~87% without reading the question. */
    quizSet = pool.slice(0, QUIZ_SIZE).map(function (q) {
      if (q.type !== 'mcq' || !q.options) return q;
      var order = q.options.map(function (opt, k) { return { opt: opt, k: k }; });
      for (var a = order.length - 1; a > 0; a--) {
        var b = Math.floor(Math.random() * (a + 1));
        var tmp = order[a]; order[a] = order[b]; order[b] = tmp;
      }
      var copy = {};
      for (var key in q) if (Object.prototype.hasOwnProperty.call(q, key)) copy[key] = q[key];
      copy.options = order.map(function (o) { return o.opt; });
      copy.correct = order.findIndex(function (o) { return o.k === q.correct; });
      return copy;
    });
    showQuizQ();
  }

  function showQuizQ() {
    quizAnswered = false;
    var q = quizSet[quizIdx];
    document.getElementById('qbar-num').textContent = quizIdx + 1;

    var html = '<p class="qp-prompt">' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, i) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer">';
      html += '<span class="qi-unit">' + (q.unit || '') + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
    }
    html += '<div style="margin-top:10px;"><span class="quiz-feedback" id="quiz-fb"></span></div>';
    html += '<div style="margin-top:8px;display:none;" id="quiz-next-wrap"><button class="btn btn-ghost" id="quiz-next">Next \u2192</button></div>';

    quizPanel.innerHTML = html;

    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          submitQuizMCQ(+btn.dataset.idx);
        });
      });
    } else {
      var qiSubmit = document.getElementById('qi-submit');
      var qiInput = document.getElementById('qi-input');
      qiSubmit.addEventListener('click', function () {
        if (quizAnswered) return;
        submitQuizNum(parseFloat(qiInput.value));
      });
      qiInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !quizAnswered) submitQuizNum(parseFloat(qiInput.value));
      });
      qiInput.focus();
    }
  }

  function submitQuizMCQ(idx) {
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var correct = idx === q.correct;
    if (correct) quizScore++;
    quizAnswers.push({ q: q, given: q.options[idx], correct: correct });

    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b, i) {
      b.classList.add('locked');
      if (i === q.correct) b.classList.add('correct');
      if (i === idx && !correct) b.classList.add('wrong');
    });

    var fb = document.getElementById('quiz-fb');
    fb.textContent = correct ? '\u2713 Correct!' : '\u2717 ' + q.explain;
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');

    showNextBtn();
  }

  function submitQuizNum(val) {
    if (isNaN(val)) return;
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var tol = q.tol || Math.abs(q.answer * 0.05) || 0.5;
    var correct = Math.abs(val - q.answer) <= tol;
    if (correct) quizScore++;
    quizAnswers.push({ q: q, given: val + ' ' + (q.unit || ''), correct: correct });

    var fb = document.getElementById('quiz-fb');
    fb.textContent = correct ? '\u2713 Correct! (' + q.answer + ' ' + (q.unit || '') + ')' : '\u2717 Answer: ' + q.answer + ' ' + (q.unit || '') + '. ' + q.explain;
    fb.className = 'quiz-feedback ' + (correct ? 'ok' : 'err');

    var inp = document.getElementById('qi-input');
    if (inp) inp.disabled = true;
    var sub = document.getElementById('qi-submit');
    if (sub) sub.disabled = true;

    showNextBtn();
  }

  function showNextBtn() {
    var wrap = document.getElementById('quiz-next-wrap');
    wrap.style.display = '';
    var btn = document.getElementById('quiz-next');
    btn.addEventListener('click', function () {
      quizIdx++;
      if (quizIdx < QUIZ_SIZE) showQuizQ();
      else showQuizResult();
    });
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var stars, cls, verdict;
    if (quizScore === 5) { stars = '\u2605\u2605\u2605'; cls = 'perfect'; verdict = 'Perfect score!'; }
    else if (quizScore >= 3) { stars = '\u2605\u2605'; cls = 'good'; verdict = 'Good job!'; }
    else { stars = '\u2605'; cls = 'poor'; verdict = 'Keep practising!'; }

    var html = '<div class="qr-header"><div class="qr-title-wrap"><div class="qr-title">Quiz Complete</div><div class="qr-stars">' + stars + '</div></div>';
    html += '<div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</div><div class="qr-verdict">' + verdict + '</div></div></div>';
    html += '<div class="qr-rows">';
    quizAnswers.forEach(function (a, i) {
      var rc = a.correct ? 'ok' : 'err';
      html += '<div class="qr-row ' + rc + '"><span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + a.given + '</strong></span>';
      html += '<span class="qr-mark">' + (a.correct ? '\u2713' : '\u2717') + '</span></div>';
    });
    html += '</div>';
    html += '<button class="btn btn-primary" id="quiz-retry">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     INIT
     ================================================================ */
  window.addEventListener('resize', function () { sizeCanvas(); draw(); });
  sizeCanvas();
  startAnim();

})();
