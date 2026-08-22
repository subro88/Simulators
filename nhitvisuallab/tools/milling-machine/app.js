(function () {
  'use strict';

  /* ================================================================
     CONCEPTS DATA — Explore Mode (14 concepts, 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Fundamentals ─────────────────────────────────────────── */
    {
      id: 'cutting-speed', name: 'Cutting Speed', symbol: 'V = \u03C0DN/1000',
      formula: 'V = \u03C0 \u00D7 D \u00D7 N / 1000', unit: 'm/min',
      cat: 'fundamentals',
      desc: 'Cutting speed (V) is the peripheral velocity of the milling cutter, representing how fast the cutting edge moves through the workpiece material. It depends on the cutter diameter (D in mm) and spindle speed (N in RPM). Optimal cutting speed depends on the workpiece material, tool material, and desired surface finish. Higher cutting speeds increase productivity but also increase tool wear and heat generation.',
      diagram: 'cuttingSpeed',
      example: { problem: 'A 20 mm end mill rotates at 1500 RPM. Find the cutting speed in m/min.', steps: ['V = \u03C0 \u00D7 D \u00D7 N / 1000', 'V = \u03C0 \u00D7 20 \u00D7 1500 / 1000', 'V = 94247.8 / 1000', 'V = 94.25 m/min'], answer: 94.25, unit: 'm/min' }
    },
    {
      id: 'feed-rate', name: 'Feed Rate', symbol: 'V\u2086 = f\u2098 \u00D7 N \u00D7 z',
      formula: 'V_f = f_z \u00D7 N \u00D7 z', unit: 'mm/min',
      cat: 'fundamentals',
      desc: 'The table feed rate (V_f) is the speed at which the workpiece moves relative to the cutter, measured in mm/min. It is determined by the feed per tooth (f_z), spindle speed (N), and number of teeth (z). The feed rate directly affects surface finish quality, chip thickness, and cutting forces. Higher feed rates increase productivity but may cause poor surface finish or tool breakage.',
      diagram: 'feedRate',
      example: { problem: 'f_z = 0.1 mm/tooth, N = 1000 RPM, z = 4 teeth. Find feed rate.', steps: ['V_f = f_z \u00D7 N \u00D7 z', 'V_f = 0.1 \u00D7 1000 \u00D7 4', 'V_f = 400 mm/min'], answer: 400, unit: 'mm/min' }
    },
    {
      id: 'feed-per-tooth', name: 'Feed per Tooth', symbol: 'f\u2098 = V\u2086/(N\u00D7z)',
      formula: 'f_z = V_f / (N \u00D7 z)', unit: 'mm/tooth',
      cat: 'fundamentals',
      desc: 'Feed per tooth (f_z) is the distance the workpiece advances during the time one tooth engages and cuts. It is the most fundamental feed parameter in milling because it determines chip thickness, cutting forces, and surface finish. Typical values range from 0.02\u20130.3 mm/tooth depending on the cutter type, material, and operation. Too low f_z causes rubbing instead of cutting; too high f_z overloads the tool.',
      diagram: 'feedPerTooth',
      example: { problem: 'V_f = 300 mm/min, N = 1200 RPM, z = 4. Find f_z.', steps: ['f_z = V_f / (N \u00D7 z)', 'f_z = 300 / (1200 \u00D7 4)', 'f_z = 300 / 4800', 'f_z = 0.0625 mm/tooth'], answer: 0.0625, unit: 'mm/tooth' }
    },
    {
      id: 'mrr', name: 'Material Removal Rate', symbol: 'MRR = a\u209A\u00D7a\u2091\u00D7V\u2086',
      formula: 'MRR = a_p \u00D7 a_e \u00D7 V_f', unit: 'mm\u00B3/min',
      cat: 'fundamentals',
      desc: 'Material removal rate (MRR) is the volume of material removed per unit time. In milling, MRR = a_p \u00D7 a_e \u00D7 V_f, where a_p is the axial depth of cut (mm), a_e is the radial width of cut (mm), and V_f is the table feed rate (mm/min). MRR is a key productivity metric \u2014 higher MRR means faster machining but requires more power and may reduce tool life. Convert to cm\u00B3/min by dividing by 1000.',
      diagram: 'mrr',
      example: { problem: 'a_p = 3 mm, a_e = 20 mm (full cutter engagement), V_f = 400 mm/min. Find MRR.', steps: ['MRR = a_p \u00D7 a_e \u00D7 V_f', 'MRR = 3 \u00D7 20 \u00D7 400', 'MRR = 24000 mm\u00B3/min', 'MRR = 24.0 cm\u00B3/min'], answer: 24.0, unit: 'cm\u00B3/min' }
    },
    {
      id: 'specific-cutting-force', name: 'Specific Cutting Force', symbol: 'k\u2090',
      formula: 'P = MRR \u00D7 k_c / (60\u00D71000\u00D7\u03B7)', unit: 'N/mm\u00B2',
      cat: 'fundamentals',
      desc: 'Specific cutting force (k_c) is the force required to remove a unit volume of material. It depends on the workpiece material: approximately 800 N/mm\u00B2 for aluminum, 2500 N/mm\u00B2 for mild steel, and 1500 N/mm\u00B2 for cast iron. The cutting power is calculated as P = MRR \u00D7 k_c / (60 \u00D7 1000 \u00D7 \u03B7), where \u03B7 is the machine efficiency (typically 0.75\u20130.85). This determines the minimum spindle motor power needed.',
      diagram: 'specificForce',
      example: { problem: 'MRR = 20 cm\u00B3/min (20000 mm\u00B3/min), k_c = 2500 N/mm\u00B2, \u03B7 = 0.80. Find power.', steps: ['P = MRR \u00D7 k_c / (60 \u00D7 1000 \u00D7 \u03B7)', 'P = 20000 \u00D7 2500 / (60 \u00D7 1000 \u00D7 0.80)', 'P = 50000000 / 48000', 'P = 1041.7 W = 1.04 kW'], answer: 1.04, unit: 'kW' }
    },
    {
      id: 'surface-finish', name: 'Surface Finish', symbol: 'Ra \u2248 f\u2098\u00B2/(32R)',
      formula: 'Ra \u2248 f_z\u00B2 / (32 \u00D7 R)', unit: '\u00B5m',
      cat: 'fundamentals',
      desc: 'Theoretical surface roughness (Ra) in milling is estimated from the feed per tooth (f_z) and the cutter nose radius (R). For a flat-bottom end mill, the cutter radius R = D/2. The formula Ra = f_z\u00B2 / (32 \u00D7 R) gives an approximate value in mm, which is converted to micrometers (\u00B5m). Actual surface finish depends on additional factors including tool runout, vibration, coolant, and built-up edge formation.',
      diagram: 'surfaceFinish',
      example: { problem: 'f_z = 0.1 mm/tooth, cutter diameter D = 20 mm (R = 10 mm). Find Ra.', steps: ['R = D/2 = 20/2 = 10 mm', 'Ra = f_z\u00B2 / (32 \u00D7 R)', 'Ra = 0.1\u00B2 / (32 \u00D7 10)', 'Ra = 0.01 / 320', 'Ra = 0.00003125 mm = 0.031 \u00B5m'], answer: 0.031, unit: '\u00B5m' }
    },

    /* ── Cutter Types ─────────────────────────────────────────── */
    {
      id: 'end-mill', name: 'End Mill', symbol: '2\u20138 flutes',
      formula: 'Peripheral + face cutting', unit: '\u2014',
      cat: 'cutters',
      desc: 'An end mill is the most versatile milling cutter, capable of cutting on both its periphery (sides) and face (bottom). It typically has 2\u20138 flutes (cutting edges) spiraling around the tool body. More flutes provide better surface finish but reduce chip space, limiting feed rate. End mills are used for slotting, profiling, pocketing, contouring, and face milling of small surfaces. Common sizes range from 1 mm to 50 mm diameter.',
      diagram: 'endMill',
      example: { problem: 'A 4-flute, 16 mm end mill at 2000 RPM with f_z = 0.08 mm/tooth. Find V and V_f.', steps: ['V = \u03C0 \u00D7 16 \u00D7 2000 / 1000 = 100.5 m/min', 'V_f = f_z \u00D7 N \u00D7 z = 0.08 \u00D7 2000 \u00D7 4', 'V_f = 640 mm/min'], answer: 640, unit: 'mm/min' }
    },
    {
      id: 'face-mill', name: 'Face Mill', symbol: '4\u201312 inserts',
      formula: 'Primarily face cutting', unit: '\u2014',
      cat: 'cutters',
      desc: 'A face mill is a large-diameter cutter used primarily for machining flat surfaces. It has multiple cutting inserts (typically 4\u201312) mounted on a cutter body. The cutter axis is perpendicular to the machined surface. Face mills are highly productive due to their large diameter (50\u2013300 mm), allowing high MRR. The multiple inserts distribute cutting forces and heat, extending tool life. Face mills are used for roughing and finishing large flat areas.',
      diagram: 'faceMill',
      example: { problem: 'An 80 mm face mill with 6 inserts at 800 RPM, f_z = 0.15 mm/tooth. Find V and V_f.', steps: ['V = \u03C0 \u00D7 80 \u00D7 800 / 1000 = 201.1 m/min', 'V_f = f_z \u00D7 N \u00D7 z = 0.15 \u00D7 800 \u00D7 6', 'V_f = 720 mm/min'], answer: 720, unit: 'mm/min' }
    },
    {
      id: 'slot-drill', name: 'Slot Drill', symbol: '2\u20133 flutes',
      formula: 'Center-cutting end mill', unit: '\u2014',
      cat: 'cutters',
      desc: 'A slot drill is a special type of end mill with 2 or 3 flutes that can plunge directly into the workpiece (center-cutting capability). Unlike standard end mills with more flutes, a slot drill has flutes that extend to the center of the tool, allowing axial plunging. It is specifically designed for cutting slots and keyways. The 2-flute design provides maximum chip clearance, essential when cutting full-width slots where chips must escape from both sides.',
      diagram: 'slotDrill',
      example: { problem: 'A 2-flute, 10 mm slot drill at 3000 RPM, f_z = 0.05 mm/tooth. Find feed rate.', steps: ['V_f = f_z \u00D7 N \u00D7 z', 'V_f = 0.05 \u00D7 3000 \u00D7 2', 'V_f = 300 mm/min'], answer: 300, unit: 'mm/min' }
    },
    {
      id: 'ball-nose', name: 'Ball Nose Mill', symbol: 'R = D/2',
      formula: 'Effective D = 2R\u00D7sin(a_p/R)', unit: '\u2014',
      cat: 'cutters',
      desc: 'A ball nose end mill has a hemispherical tip, ideal for machining 3D contoured surfaces, fillets, and radii. The effective cutting diameter varies with depth of cut: D_eff = 2 \u00D7 R \u00D7 sin(arccos(1 \u2212 a_p/R)). At shallow depths of cut, the effective diameter is much smaller than the nominal diameter, which means the effective cutting speed is lower. Ball nose mills are essential for mold making, die sinking, and 5-axis sculptured surface machining.',
      diagram: 'ballNose',
      example: { problem: 'A 12 mm ball nose mill (R = 6 mm) with a_p = 1 mm. Find the effective diameter.', steps: ['D_eff = 2R \u00D7 sin(arccos(1 \u2212 a_p/R))', 'D_eff = 12 \u00D7 sin(arccos(1 \u2212 1/6))', 'D_eff = 12 \u00D7 sin(arccos(0.833))', 'D_eff = 12 \u00D7 sin(33.6\u00B0)', 'D_eff = 12 \u00D7 0.553 = 6.64 mm'], answer: 6.64, unit: 'mm' }
    },

    /* ── Operations ───────────────────────────────────────────── */
    {
      id: 'face-milling-op', name: 'Face Milling', symbol: 'a\u2091 = D',
      formula: 'MRR = a_p \u00D7 D \u00D7 V_f', unit: 'mm\u00B3/min',
      cat: 'operations',
      desc: 'Face milling produces flat surfaces perpendicular to the cutter axis. The cutter diameter is larger than the workpiece width for full face milling, or slightly overlaps for partial face milling. The radial width of cut (a_e) equals the full cutter diameter when fully engaged. Face milling achieves high material removal rates and good surface finish. The cutter should be positioned so it enters the cut with a small engagement angle to reduce impact loads.',
      diagram: 'faceMilling',
      example: { problem: 'Face milling with 80 mm cutter, a_p = 2 mm, V_f = 500 mm/min. Find MRR.', steps: ['a_e = D = 80 mm (full engagement)', 'MRR = a_p \u00D7 a_e \u00D7 V_f', 'MRR = 2 \u00D7 80 \u00D7 500', 'MRR = 80000 mm\u00B3/min = 80.0 cm\u00B3/min'], answer: 80.0, unit: 'cm\u00B3/min' }
    },
    {
      id: 'peripheral-milling-op', name: 'Peripheral Milling', symbol: 'Side cut',
      formula: 'MRR = a_p \u00D7 a_e \u00D7 V_f', unit: 'mm\u00B3/min',
      cat: 'operations',
      desc: 'Peripheral (slab) milling uses the cutter periphery to machine surfaces parallel to the cutter axis. There are two modes: conventional (up) milling where the cutter rotates against the feed direction, and climb (down) milling where the cutter rotates in the feed direction. Climb milling is preferred on CNC machines because it produces better surface finish, lower cutting forces, and longer tool life, but requires a rigid setup to prevent workpiece pulling.',
      diagram: 'peripheralMilling',
      example: { problem: 'Peripheral milling: a_p = 4 mm, a_e = 5 mm (side step), V_f = 350 mm/min. Find MRR.', steps: ['MRR = a_p \u00D7 a_e \u00D7 V_f', 'MRR = 4 \u00D7 5 \u00D7 350', 'MRR = 7000 mm\u00B3/min = 7.0 cm\u00B3/min'], answer: 7.0, unit: 'cm\u00B3/min' }
    },
    {
      id: 'slot-milling-op', name: 'Slot Milling', symbol: 'a\u2091 = D',
      formula: 'MRR = a_p \u00D7 D \u00D7 V_f', unit: 'mm\u00B3/min',
      cat: 'operations',
      desc: 'Slot milling cuts a groove or slot where the full cutter diameter is engaged (a_e = D). This is the most demanding operation because chips must evacuate from both sides and the full tool diameter is loaded. A slot drill (2-flute, center-cutting) is typically used for plunge entry. Feed rate should be reduced by 50% compared to peripheral milling to manage chip evacuation and cutting forces. Peck milling (multiple passes at increasing depth) is often used for deep slots.',
      diagram: 'slotMilling',
      example: { problem: 'Slot milling with 12 mm slot drill, a_p = 5 mm, V_f = 200 mm/min. Find MRR.', steps: ['a_e = D = 12 mm (full slot)', 'MRR = a_p \u00D7 a_e \u00D7 V_f', 'MRR = 5 \u00D7 12 \u00D7 200', 'MRR = 12000 mm\u00B3/min = 12.0 cm\u00B3/min'], answer: 12.0, unit: 'cm\u00B3/min' }
    },
    {
      id: 'pocket-milling-op', name: 'Pocket Milling', symbol: 'Multi-pass',
      formula: 'Stepover = 50\u201375% of D', unit: '\u2014',
      cat: 'operations',
      desc: 'Pocket milling removes material from an enclosed area to a specified depth. It combines plunge entry (ramping or helical), face milling, and peripheral milling. The stepover (radial depth of cut between passes) is typically 50\u201375% of the cutter diameter for roughing and 10\u201325% for finishing. Toolpath strategies include zigzag, spiral-in, and trochoidal patterns. Trochoidal milling uses small radial engagement with high axial depth, reducing heat and extending tool life.',
      diagram: 'pocketMilling',
      example: { problem: 'Pocket milling with 16 mm end mill, 60% stepover, a_p = 3 mm, V_f = 450 mm/min. Find MRR per pass.', steps: ['a_e = 0.60 \u00D7 16 = 9.6 mm', 'MRR = a_p \u00D7 a_e \u00D7 V_f', 'MRR = 3 \u00D7 9.6 \u00D7 450', 'MRR = 12960 mm\u00B3/min = 12.96 cm\u00B3/min'], answer: 12.96, unit: 'cm\u00B3/min' }
    }
  ];

  /* ================================================================
     PROBLEM GENERATORS — Practice Mode (12 generators)
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(n) { return +(Math.round(n * 100) / 100).toFixed(2); }
  function round1(n) { return +(Math.round(n * 10) / 10).toFixed(1); }
  function round3(n) { return +(Math.round(n * 1000) / 1000).toFixed(3); }
  function round4(n) { return +(Math.round(n * 10000) / 10000).toFixed(4); }

  var PROBLEM_GEN = [
    /* 0 — Cutting speed from D and N */
    function () {
      var D = randInt(6, 80);
      var N = randInt(200, 4000);
      var V = round2(Math.PI * D * N / 1000);
      return { prompt: 'A milling cutter of diameter D = ' + D + ' mm rotates at N = ' + N + ' RPM. Find the cutting speed V (m/min).', steps: ['V = \u03C0 \u00D7 D \u00D7 N / 1000', 'V = \u03C0 \u00D7 ' + D + ' \u00D7 ' + N + ' / 1000', 'V = ' + round2(Math.PI * D * N) + ' / 1000', 'V = ' + V + ' m/min'], answer: V, unit: 'm/min', tol: 0.5 };
    },
    /* 1 — Spindle speed from V and D */
    function () {
      var D = randInt(10, 80);
      var V = randInt(40, 250);
      var N = round1(V * 1000 / (Math.PI * D));
      return { prompt: 'Find the spindle speed N (RPM) for cutting speed V = ' + V + ' m/min with a ' + D + ' mm diameter cutter.', steps: ['N = V \u00D7 1000 / (\u03C0 \u00D7 D)', 'N = ' + V + ' \u00D7 1000 / (\u03C0 \u00D7 ' + D + ')', 'N = ' + (V * 1000) + ' / ' + round2(Math.PI * D), 'N = ' + N + ' RPM'], answer: N, unit: 'RPM', tol: 1 };
    },
    /* 2 — Feed per tooth from Vf, N, z */
    function () {
      var N = randInt(500, 3000);
      var z = randInt(2, 8);
      var Vf = randInt(100, 1500);
      var fz = round4(Vf / (N * z));
      return { prompt: 'V_f = ' + Vf + ' mm/min, N = ' + N + ' RPM, z = ' + z + ' teeth. Find the feed per tooth f_z (mm/tooth).', steps: ['f_z = V_f / (N \u00D7 z)', 'f_z = ' + Vf + ' / (' + N + ' \u00D7 ' + z + ')', 'f_z = ' + Vf + ' / ' + (N * z), 'f_z = ' + fz + ' mm/tooth'], answer: fz, unit: 'mm/tooth', tol: 0.002 };
    },
    /* 3 — Feed rate from fz, N, z */
    function () {
      var fz = round2(randInt(3, 20) / 100);
      var N = randInt(500, 3000);
      var z = randInt(2, 8);
      var Vf = round1(fz * N * z);
      return { prompt: 'f_z = ' + fz + ' mm/tooth, N = ' + N + ' RPM, z = ' + z + ' teeth. Find the table feed rate V_f (mm/min).', steps: ['V_f = f_z \u00D7 N \u00D7 z', 'V_f = ' + fz + ' \u00D7 ' + N + ' \u00D7 ' + z, 'V_f = ' + Vf + ' mm/min'], answer: Vf, unit: 'mm/min', tol: 1 };
    },
    /* 4 — MRR from ap, ae, Vf */
    function () {
      var ap = round1(randInt(10, 60) / 10);
      var ae = randInt(5, 50);
      var Vf = randInt(100, 800);
      var mrr = round2(ap * ae * Vf / 1000);
      return { prompt: 'a_p = ' + ap + ' mm, a_e = ' + ae + ' mm, V_f = ' + Vf + ' mm/min. Find the MRR (cm\u00B3/min).', steps: ['MRR = a_p \u00D7 a_e \u00D7 V_f', 'MRR = ' + ap + ' \u00D7 ' + ae + ' \u00D7 ' + Vf, 'MRR = ' + round1(ap * ae * Vf) + ' mm\u00B3/min', 'MRR = ' + mrr + ' cm\u00B3/min'], answer: mrr, unit: 'cm\u00B3/min', tol: 0.5 };
    },
    /* 5 — Power from MRR and kc */
    function () {
      var mats = [{ name: 'aluminum', kc: 800 }, { name: 'mild steel', kc: 2500 }, { name: 'cast iron', kc: 1500 }];
      var m = mats[randInt(0, 2)];
      var mrrCm3 = round1(randInt(5, 40));
      var eta = 0.80;
      var mrrMm3g = mrrCm3 * 1000;
      var P_Wg = round1(mrrMm3g * m.kc / (60 * 1000 * eta));   /* watts */
      var P = round2(P_Wg / 1000);                             /* kW */
      return { prompt: 'MRR = ' + mrrCm3 + ' cm\u00B3/min for ' + m.name + ' (k_c = ' + m.kc + ' N/mm\u00B2). Machine efficiency \u03B7 = 0.80. Find power P (kW).', steps: ['MRR in mm\u00B3/min = ' + mrrCm3 + ' \u00D7 1000 = ' + mrrMm3g, 'P = MRR \u00D7 k_c / (60 \u00D7 1000 \u00D7 \u03B7)', 'P = ' + mrrMm3g + ' \u00D7 ' + m.kc + ' / (60000 \u00D7 0.80)', 'P = ' + round1(mrrMm3g * m.kc) + ' / 48000 = ' + P_Wg + ' W', 'P = ' + P + ' kW'], answer: P, unit: 'kW', tol: 0.1 };
    },
    /* 6 — Surface finish Ra from fz and D */
    function () {
      var fz = round2(randInt(5, 20) / 100);
      var D = randInt(10, 50);
      var R = D / 2;
      var Ra = round4(fz * fz / (32 * R) * 1000);
      return { prompt: 'f_z = ' + fz + ' mm/tooth, cutter diameter D = ' + D + ' mm. Find the theoretical surface roughness Ra (\u00B5m).', steps: ['R = D/2 = ' + D + '/2 = ' + R + ' mm', 'Ra = f_z\u00B2 / (32 \u00D7 R)', 'Ra = ' + fz + '\u00B2 / (32 \u00D7 ' + R + ')', 'Ra = ' + round4(fz * fz) + ' / ' + (32 * R), 'Ra = ' + round4(fz * fz / (32 * R)) + ' mm = ' + Ra + ' \u00B5m'], answer: Ra, unit: '\u00B5m', tol: 0.05 };
    },
    /* 7 — Number of teeth from Vf, fz, N */
    function () {
      var fz = round2(randInt(5, 15) / 100);
      var N = randInt(500, 2500);
      var z = randInt(2, 8);
      var Vf = round1(fz * N * z);
      return { prompt: 'V_f = ' + Vf + ' mm/min, f_z = ' + fz + ' mm/tooth, N = ' + N + ' RPM. How many teeth does the cutter have?', steps: ['z = V_f / (f_z \u00D7 N)', 'z = ' + Vf + ' / (' + fz + ' \u00D7 ' + N + ')', 'z = ' + Vf + ' / ' + round2(fz * N), 'z = ' + z + ' teeth'], answer: z, unit: 'teeth', tol: 0.1 };
    },
    /* 8 — Chip thickness from fz and engagement angle */
    function () {
      var fz = round2(randInt(5, 15) / 100);
      var ae = randInt(5, 30);
      var D = randInt(ae, 80);
      var engAngle = Math.acos(1 - 2 * ae / D);
      var tc = round3(fz * Math.sin(engAngle));
      return { prompt: 'f_z = ' + fz + ' mm/tooth, a_e = ' + ae + ' mm, D = ' + D + ' mm. Find the maximum chip thickness t_c (mm). Use t_c = f_z \u00D7 sin(engagement angle) where engagement angle = arccos(1 \u2212 2a_e/D).', steps: ['Engagement angle = arccos(1 \u2212 2\u00D7' + ae + '/' + D + ')', 'Engagement angle = arccos(' + round3(1 - 2 * ae / D) + ')', 'Engagement angle = ' + round1(engAngle * 180 / Math.PI) + '\u00B0', 't_c = f_z \u00D7 sin(' + round1(engAngle * 180 / Math.PI) + '\u00B0)', 't_c = ' + fz + ' \u00D7 ' + round3(Math.sin(engAngle)), 't_c = ' + tc + ' mm'], answer: tc, unit: 'mm', tol: 0.005 };
    },
    /* 9 — Machining time from length, Vf */
    function () {
      var L = randInt(50, 500);
      var Vf = randInt(100, 1000);
      var approach = randInt(5, 20);
      var totalL = L + approach;
      var t = round2(totalL / Vf);
      return { prompt: 'Workpiece length = ' + L + ' mm, approach distance = ' + approach + ' mm, V_f = ' + Vf + ' mm/min. Find the machining time (min).', steps: ['Total travel = ' + L + ' + ' + approach + ' = ' + totalL + ' mm', 't = Total travel / V_f', 't = ' + totalL + ' / ' + Vf, 't = ' + t + ' min'], answer: t, unit: 'min', tol: 0.02 };
    },
    /* 10 — Cutting force from P and V */
    function () {
      var P = round1(randInt(5, 50) / 10);
      var V = randInt(40, 200);
      var F = round1(P * 1000 * 60 / (V));
      return { prompt: 'Cutting power P = ' + P + ' kW, cutting speed V = ' + V + ' m/min. Find the tangential cutting force F_c (N). Use F_c = P\u00D71000\u00D760/V.', steps: ['F_c = P \u00D7 1000 \u00D7 60 / V', 'F_c = ' + P + ' \u00D7 60000 / ' + V, 'F_c = ' + round1(P * 60000) + ' / ' + V, 'F_c = ' + F + ' N'], answer: F, unit: 'N', tol: 1 };
    },
    /* 11 — Cutter diameter from V and N */
    function () {
      var N = randInt(500, 3000);
      var V = randInt(50, 250);
      var D = round1(V * 1000 / (Math.PI * N));
      return { prompt: 'Cutting speed V = ' + V + ' m/min, spindle speed N = ' + N + ' RPM. Find the cutter diameter D (mm).', steps: ['D = V \u00D7 1000 / (\u03C0 \u00D7 N)', 'D = ' + V + ' \u00D7 1000 / (\u03C0 \u00D7 ' + N + ')', 'D = ' + (V * 1000) + ' / ' + round1(Math.PI * N), 'D = ' + D + ' mm'], answer: D, unit: 'mm', tol: 0.5 };
    }
  ];

  /* ================================================================
     QUIZ QUESTIONS — 18 questions (mix of MCQ and numeric)
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ */
    { type: 'mcq', prompt: 'Which formula calculates milling cutting speed?', options: ['V = \u03C0DN/1000', 'V = f_z \u00D7 N \u00D7 z', 'V = a_p \u00D7 a_e \u00D7 V_f', 'V = P/(F_c \u00D7 V)'], correct: 0 },
    { type: 'mcq', prompt: 'In face milling, the cutter axis is:', options: ['Parallel to the machined surface', 'Perpendicular to the machined surface', 'At 45\u00B0 to the surface', 'Tangent to the surface'], correct: 1 },
    { type: 'mcq', prompt: 'A slot drill typically has how many flutes?', options: ['1 flute', '2 or 3 flutes', '6 flutes', '10 flutes'], correct: 1 },
    { type: 'mcq', prompt: 'Which material has the highest specific cutting force (k_c)?', options: ['Aluminum (~800 N/mm\u00B2)', 'Cast iron (~1500 N/mm\u00B2)', 'Mild steel (~2500 N/mm\u00B2)', 'Brass (~700 N/mm\u00B2)'], correct: 2 },
    { type: 'mcq', prompt: 'In climb milling, the cutter rotation direction relative to feed is:', options: ['Opposite to feed (conventional)', 'Same as feed direction', 'Perpendicular to feed', 'It does not matter'], correct: 1 },
    { type: 'mcq', prompt: 'What is the main advantage of climb milling over conventional milling?', options: ['Lower setup rigidity needed', 'Better surface finish and lower forces', 'Higher MRR possible', 'Works without CNC'], correct: 1 },
    { type: 'mcq', prompt: 'Increasing the number of cutter teeth while keeping other parameters constant will:', options: ['Increase feed per tooth', 'Decrease table feed rate', 'Decrease feed per tooth', 'Have no effect on feed per tooth'], correct: 2 },
    { type: 'mcq', prompt: 'Which cutter type is best for machining 3D contoured surfaces?', options: ['Face mill', 'Flat end mill', 'Ball nose end mill', 'Slot drill'], correct: 2 },
    { type: 'mcq', prompt: 'The theoretical surface roughness in milling depends on:', options: ['Only spindle speed', 'Feed per tooth and cutter radius', 'Only depth of cut', 'Number of teeth only'], correct: 1 },
    { type: 'mcq', prompt: 'For slot milling, the radial width of cut (a_e) equals:', options: ['Half the cutter diameter', 'The full cutter diameter', 'The depth of cut', '25% of the cutter diameter'], correct: 1 },
    /* Numeric */
    { type: 'numeric', prompt: 'A 25 mm end mill at 2000 RPM. Find cutting speed V (m/min).', answer: round2(Math.PI * 25 * 2000 / 1000), unit: 'm/min', tol: 1 },
    { type: 'numeric', prompt: 'f_z = 0.1 mm/tooth, N = 1500 RPM, z = 4 teeth. Find V_f (mm/min).', answer: 600, unit: 'mm/min', tol: 1 },
    { type: 'numeric', prompt: 'a_p = 2 mm, a_e = 30 mm, V_f = 500 mm/min. Find MRR (cm\u00B3/min).', answer: 30, unit: 'cm\u00B3/min', tol: 0.5 },
    { type: 'numeric', prompt: 'V_f = 480 mm/min, N = 1200 RPM, z = 4. Find f_z (mm/tooth).', answer: 0.1, unit: 'mm/tooth', tol: 0.005 },
    { type: 'numeric', prompt: 'MRR = 15 cm\u00B3/min, k_c = 2500 N/mm\u00B2, \u03B7 = 0.80. Find power P (kW).', answer: round2(15 * 1000 * 2500 / (60 * 1000 * 0.80) / 1000), unit: 'kW', tol: 0.1 },
    { type: 'numeric', prompt: 'Cutting speed V = 120 m/min, D = 40 mm. Find spindle speed N (RPM).', answer: round1(120 * 1000 / (Math.PI * 40)), unit: 'RPM', tol: 5 },
    { type: 'numeric', prompt: 'Workpiece length 200 mm + 10 mm approach, V_f = 350 mm/min. Find machining time (min).', answer: round2(210 / 350), unit: 'min', tol: 0.02 },
    { type: 'numeric', prompt: 'An 80 mm face mill with 8 inserts, f_z = 0.12 mm/tooth, N = 600 RPM. Find V_f (mm/min).', answer: round1(0.12 * 600 * 8), unit: 'mm/min', tol: 1 }
  ];

  /* ================================================================
     DOM REFERENCES
     ================================================================ */

  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');

  /* Simulate panel */
  var simPanel = document.getElementById('sim-panel');
  var speedSlider = document.getElementById('speed-slider');
  var feedSlider = document.getElementById('feed-slider');
  var docSlider = document.getElementById('doc-slider');
  var diaSlider = document.getElementById('dia-slider');
  var teethSlider = document.getElementById('teeth-slider');
  var speedVal = document.getElementById('speed-val');
  var feedVal = document.getElementById('feed-val');
  var docVal = document.getElementById('doc-val');
  var diaVal = document.getElementById('dia-val');
  var teethVal = document.getElementById('teeth-val');
  var rSpeed = document.getElementById('r-speed');
  var rFz = document.getElementById('r-fz');
  var rMRR = document.getElementById('r-mrr');
  var rPower = document.getElementById('r-power');
  var rFinish = document.getElementById('r-finish');
  var rChip = document.getElementById('r-chip');

  /* Explore panel */
  var catRow = document.getElementById('cat-row');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');

  /* Practice panel */
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppShowSol = document.getElementById('pp-show-sol');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  /* Quiz panel */
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');
  var qbarNum = document.getElementById('qbar-num');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var cutterType = 'endmill';
  var material = 'aluminum';
  var spindle = 1200;
  var feedRate = 300;
  var depthOfCut = 2;
  var cutterDia = 20;
  var numTeeth = 4;
  var angle = 0;
  var animId = null;

  /* Milling simulation state */
  var millState = 'idle';     /* idle | descend | milling | retract | done */
  var toolNormX = -0.05;      /* normalized position 0–1 across workpiece */
  var toolNormY = 0;          /* 0 = raised, 1 = at cutting depth */
  var PROFILE_RES = 300;
  var cutProfile = [];
  var chipParticles = [];

  function resetMill() {
    millState = 'idle';
    toolNormX = -0.05;
    toolNormY = 0;
    cutProfile = [];
    for (var cp = 0; cp < PROFILE_RES; cp++) cutProfile.push(0);
    chipParticles = [];
  }
  resetMill();

  /* Material properties: kc in N/mm^2 + tint colors for shading */
  var MAT_PROPS = {
    aluminum: { kc: 800,  color: '#c8cdd4', hl: '#f0f3f7', chip: '#e0e4ea', name: 'Aluminum' },
    steel:    { kc: 2500, color: '#8c95a0', hl: '#c8d0d8', chip: '#c8b88a', name: 'Mild Steel' },
    castiron: { kc: 1500, color: '#4a4d54', hl: '#7a7f88', chip: '#3a3d44', name: 'Cast Iron' }
  };

  /* ── Industrial color palette (matches lathe simulator) ── */
  var COL = {
    paintDark:   '#1e4a2d',
    paintMid:    '#2e6e44',
    paintLight:  '#48a566',
    paintHi:     '#6dc28a',
    bedTop:      '#3a3f48',
    castIron:    '#33383f',
    steel:       '#a8b0bc',
    steelDark:   '#5a626e',
    steelLight:  '#e8ecf2',
    chrome:      '#dde2eb',
    brass:       '#c9a063',
    brassDark:   '#876b3e',
    bronze:      '#a37a3e',
    toolHolder:  '#e87b1a',
    toolHolderD: '#b85a08',
    insertGold:  '#f0c040',
    insertEdge:  '#fff9c4',
    handwheel:   '#181a20',
    handwheelR:  '#c0392b',
    pan:         '#262a31',
    panEdge:     '#3a3f48',
    hazardY:     '#f5c842',
    hazardB:     '#0e1116',
    coolantBlue: '#3ec1ff',
    coolantHose: '#1a1d24',
    boltGray:    '#272a31',
    boltShine:   '#7a808a',
    text:        '#dde3f0',
    textDim:     '#6b7a99'
  };

  function _lighten(hex, amt) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.min(255, r+amt); g = Math.min(255, g+amt); b = Math.min(255, b+amt);
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function _darken(hex, amt) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    r = Math.max(0, r-amt); g = Math.max(0, g-amt); b = Math.max(0, b-amt);
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function _rgba(hex, a) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }
  function _roundRect(c, x, y, w, h, r) {
    if (r === undefined) r = 4;
    var rr = Math.min(r, Math.abs(w)/2, Math.abs(h)/2);
    c.beginPath();
    c.moveTo(x+rr, y); c.lineTo(x+w-rr, y);
    c.quadraticCurveTo(x+w, y, x+w, y+rr);
    c.lineTo(x+w, y+h-rr);
    c.quadraticCurveTo(x+w, y+h, x+w-rr, y+h);
    c.lineTo(x+rr, y+h);
    c.quadraticCurveTo(x, y+h, x, y+h-rr);
    c.lineTo(x, y+rr);
    c.quadraticCurveTo(x, y, x+rr, y);
    c.closePath();
  }
  function _drawBolt(c, x, y, r) {
    c.fillStyle = COL.boltGray;
    c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); c.fill();
    c.strokeStyle = COL.boltShine; c.lineWidth = 0.6; c.stroke();
    c.strokeStyle = '#0a0c10'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x-r*0.6, y); c.lineTo(x+r*0.6, y); c.stroke();
  }
  function _drawHazardStripe(c, x, y, w, h) {
    var stripe = 7;
    c.save();
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    for (var i = -h; i < w + h; i += stripe * 2) {
      c.fillStyle = COL.hazardY;
      c.beginPath();
      c.moveTo(x + i, y); c.lineTo(x + i + stripe, y);
      c.lineTo(x + i + stripe + h, y + h); c.lineTo(x + i + h, y + h);
      c.closePath(); c.fill();
      c.fillStyle = COL.hazardB;
      c.beginPath();
      c.moveTo(x + i + stripe, y); c.lineTo(x + i + stripe * 2, y);
      c.lineTo(x + i + stripe * 2 + h, y + h); c.lineTo(x + i + stripe + h, y + h);
      c.closePath(); c.fill();
    }
    c.restore();
  }
  function _drawPaintedBox(c, x, y, w, h, vertical) {
    var grad = vertical
      ? c.createLinearGradient(x, 0, x + w, 0)
      : c.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, COL.paintDark);
    grad.addColorStop(0.45, COL.paintMid);
    grad.addColorStop(0.6, COL.paintLight);
    grad.addColorStop(1, COL.paintDark);
    c.fillStyle = grad;
    _roundRect(c, x, y, w, h, 4); c.fill();
    c.strokeStyle = COL.paintDark; c.lineWidth = 1; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.10)';
    c.fillRect(x + 3, y + 2, w - 6, 2);
  }
  function _drawHandwheel(c, cx, cy, r) {
    var grad = c.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
    grad.addColorStop(0, '#3a4048');
    grad.addColorStop(0.6, COL.handwheel);
    grad.addColorStop(1, '#000');
    c.fillStyle = grad;
    c.beginPath(); c.arc(cx, cy, r, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#5a626c'; c.lineWidth = 1; c.stroke();
    c.strokeStyle = '#0a0c10'; c.lineWidth = 2;
    for (var sp = 0; sp < 4; sp++) {
      var spa = sp * Math.PI / 2 + Math.PI / 4;
      c.beginPath();
      c.moveTo(cx + Math.cos(spa) * 3, cy + Math.sin(spa) * 3);
      c.lineTo(cx + Math.cos(spa) * (r-2), cy + Math.sin(spa) * (r-2));
      c.stroke();
    }
    c.fillStyle = COL.handwheelR;
    c.beginPath(); c.arc(cx, cy, r*0.3, 0, Math.PI*2); c.fill();
    c.strokeStyle = '#5a0a0a'; c.lineWidth = 0.6; c.stroke();
  }

  /* Toolbar state (machine power, coolant, etc.) */
  var machineState = {
    power: true,
    coolant: true,
    spindleCW: true,
    worklight: true,
    guard: true,
    estopShake: 0
  };

  /* Explore state */
  var exploreCat = 'fundamentals';
  var selectedConcept = null;

  /* Practice state */
  var practiceQ = null;
  var practiceScore = 0;
  var practiceTotal = 0;
  var practiceChecked = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizResults = [];

  /* ================================================================
     CANVAS SIZING
     ================================================================ */

  var LOGW = 900, LOGH = 420;   /* logical drawing size in CSS px */
  function sizeCanvas() {
    /* Hi-DPI: back the canvas with device pixels and scale the context so the
       drawing code keeps working in CSS-pixel units. The backing store used to
       be sized in CSS pixels, a 2.00x upscale on a retina display. */
    var w = canvas.parentElement.clientWidth - 16;
    var h = Math.min(w * 0.55, 420);
    var dpr = window.devicePixelRatio || 1;
    LOGW = w; LOGH = h;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', function () { sizeCanvas(); draw(); });

  /* ================================================================
     CALCULATIONS
     ================================================================ */

  function calc() {
    var N = spindle;
    var D = cutterDia;
    var z = numTeeth;
    var Vf = feedRate;
    var ap = depthOfCut;
    var ae = D; /* default: full engagement for face/slot milling */

    if (cutterType === 'endmill') ae = D * 0.6; /* typical side engagement */
    if (cutterType === 'facemill') ae = D;
    if (cutterType === 'slotdrill') ae = D;

    var V = Math.PI * D * N / 1000;
    var fz = (N * z > 0) ? Vf / (N * z) : 0;
    var mrrMm3 = ap * ae * Vf;
    var mrrCm3 = mrrMm3 / 1000;
    var kc = MAT_PROPS[material].kc;
    var eta = 0.80;
    /* mrrMm3 [mm³/min] × kc [N/mm²] = N·mm/min. ÷60 → N·mm/s, ÷1000 → W.
       So this expression is in WATTS; one more ÷1000 gives the kW that every
       readout, canvas panel and the Explore worked example are captioned in.
       (It previously returned watts under a "kW" label, reading ~120 kW for a
       20 mm cutter taking a 2 mm cut in aluminium — 1000× too high.) */
    var P_W = mrrMm3 * kc / (60 * 1000 * eta);  /* watts */
    var P = P_W / 1000;                        /* kW — what the readouts show */
    var R = D / 2;
    var Ra = (R > 0) ? (fz * fz / (32 * R)) * 1000 : 0; /* in microns */
    var engAngle = (D > 0) ? Math.acos(Math.max(-1, Math.min(1, 1 - 2 * ae / D))) : 0;
    var tc = fz * Math.sin(engAngle);

    return { V: V, fz: fz, mrrCm3: mrrCm3, P: P, Ra: Ra, tc: tc, ae: ae, engAngle: engAngle };
  }

  /* ================================================================
     DISPLAY UNITS  (display only — every cut calculation stays metric)
     US shop practice: surface speed in SFM (ft/min), feed in in/min,
     feed per tooth in in/tooth, MRR in in³/min, power in hp, finish in
     microinch Ra. Spindle speed is RPM and tooth count is a count, so
     both are the same in either system.
     ================================================================ */
  var unitSys = 'si';
  function isImp() { return unitSys === 'imp'; }
  var MU = {
    len:    { f: 0.0393701, si: 'mm',        imp: 'in',        d: 2 },
    feed:   { f: 0.0393701, si: 'mm/min',    imp: 'in/min',    d: 2 },
    fz:     { f: 0.0393701, si: 'mm/tooth',  imp: 'in/tooth',  d: 5 },
    vc:     { f: 3.28084,   si: 'm/min',     imp: 'SFM',       d: 0 },
    mrr:    { f: 0.0610237, si: 'cm\u00B3/min', imp: 'in\u00B3/min', d: 3 },
    power:  { f: 1.34102,   si: 'kW',        imp: 'hp',        d: 2 },
    ra:     { f: 39.3701,   si: '\u00B5m Ra',   imp: '\u00B5in Ra',  d: 1 }
  };
  function mv(val, k)  { return isImp() ? val * MU[k].f : val; }
  function mu(k)       { return isImp() ? MU[k].imp : MU[k].si; }
  /* dSI / dImp let a caller override the default precision — chip thickness in
     inches needs 5 dp or a 0.06 mm chip renders as "0.00". */
  function mfix(val,k,dSI,dImp) {
    return mv(val,k).toFixed(isImp() ? (dImp == null ? MU[k].d : dImp)
                                     : (dSI  == null ? MU[k].d : dSI));
  }

  function updateReadouts() {
    var c = calc();
    rSpeed.textContent  = mfix(c.V, 'vc', 1);
    rFz.textContent     = mfix(c.fz, 'fz', 4);
    rMRR.textContent    = mfix(c.mrrCm3, 'mrr', 2);
    rPower.textContent  = mfix(c.P, 'power', 2);
    rFinish.textContent = mfix(c.Ra, 'ra', 3);
    rChip.textContent   = mfix(c.tc, 'len', 4, 5);
    var cap = [['u-speed','vc'],['u-fz','fz'],['u-mrr','mrr'],
               ['u-power','power'],['u-finish','ra'],['u-chip','len']];
    cap.forEach(function (r) {
      var e = document.getElementById(r[0]);
      if (e) e.textContent = ' ' + mu(r[1]);
    });
    syncSliderLabels();
  }

  /* Single owner of the five slider captions — bindSlider() delegates here so
     the toggle and a drag can never disagree. */
  function syncSliderLabels() {
    if (speedVal) speedVal.textContent = spindle + ' RPM';
    if (feedVal)  feedVal.textContent  = mfix(feedRate, 'feed', 0) + ' ' + mu('feed');
    if (docVal)   docVal.textContent   = mfix(depthOfCut, 'len', 1) + ' ' + mu('len');
    if (diaVal)   diaVal.textContent   = mfix(cutterDia, 'len', 0) + ' ' + mu('len');
    if (teethVal) teethVal.textContent = numTeeth;
  }

  /* (old top-down draw function removed — replaced by side-view below) */

  function _draw_REMOVED() { return; /* dead code — never called */

    /* Background grid */
    ctx.strokeStyle = 'rgba(42,48,80,0.35)';
    ctx.lineWidth = 0.5;
    var gs = 30;
    for (var gx = 0; gx < W; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += gs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    /* Center of canvas */
    var cx = W * 0.5;
    var cy = H * 0.45;
    var c = calc();

    /* Scale cutter diameter to canvas */
    var maxR = Math.min(W, H) * 0.25;
    var minR = 20;
    var cutR = minR + (maxR - minR) * ((cutterDia - 6) / (100 - 6));

    /* Draw workpiece (rectangle below cutter) */
    var wpW = W * 0.55;
    var wpH = H * 0.22;
    var wpX = cx - wpW / 2;
    var wpY = cy - wpH * 0.1;
    var matColor = MAT_PROPS[material].color;

    ctx.fillStyle = matColor + '33';
    ctx.strokeStyle = matColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(wpX, wpY, wpW, wpH);
    ctx.fill();
    ctx.stroke();

    /* Material label */
    ctx.fillStyle = matColor;
    ctx.font = '11px ' + "'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(MAT_PROPS[material].name + ' Workpiece', cx, wpY + wpH + 16);

    /* Cutting zone highlight */
    var cutZoneW = cutR * 1.2;
    var cutZoneH = depthOfCut * 3;
    ctx.fillStyle = 'rgba(255,85,85,0.12)';
    ctx.fillRect(cx - cutZoneW / 2, wpY - cutZoneH * 0.3, cutZoneW, cutZoneH);

    /* Draw cutter (top-down view — circle with teeth) */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    /* Cutter body circle */
    ctx.beginPath();
    ctx.arc(0, 0, cutR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,191,165,0.12)';
    ctx.fill();
    ctx.strokeStyle = '#00bfa5';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Inner circle */
    ctx.beginPath();
    ctx.arc(0, 0, cutR * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#00bfa5';
    ctx.fill();

    /* Teeth */
    var z = numTeeth;
    for (var i = 0; i < z; i++) {
      var tAngle = (Math.PI * 2 / z) * i;
      var tx1 = Math.cos(tAngle) * cutR * 0.3;
      var ty1 = Math.sin(tAngle) * cutR * 0.3;
      var tx2 = Math.cos(tAngle) * cutR;
      var ty2 = Math.sin(tAngle) * cutR;
      ctx.beginPath();
      ctx.moveTo(tx1, ty1);
      ctx.lineTo(tx2, ty2);
      ctx.strokeStyle = '#00bfa5';
      ctx.lineWidth = 3;
      ctx.stroke();

      /* Tooth tip (small arc) */
      ctx.beginPath();
      ctx.arc(tx2, ty2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#64ffda';
      ctx.fill();
    }

    ctx.restore();

    /* Chip particles (animated based on speed) */
    var chipCount = Math.min(Math.floor(feedRate / 50), 15);
    for (var ci = 0; ci < chipCount; ci++) {
      var chipAngle = angle * 3 + ci * 1.2;
      var chipDist = cutR + 8 + (ci % 5) * 6;
      var chipX = cx + Math.cos(chipAngle) * chipDist;
      var chipY = cy + Math.sin(chipAngle) * chipDist;
      if (chipX > wpX && chipX < wpX + wpW && chipY > wpY - 10 && chipY < wpY + wpH + 10) {
        ctx.beginPath();
        ctx.arc(chipX, chipY, 2, 0, Math.PI * 2);
        ctx.fillStyle = matColor;
        ctx.fill();
      }
    }

    /* Feed direction arrow */
    var arrowY = wpY + wpH / 2;
    var arrowX1 = wpX + 20;
    var arrowX2 = wpX + 20 + Math.min(feedRate / 8, 100);
    ctx.beginPath();
    ctx.moveTo(arrowX1, arrowY);
    ctx.lineTo(arrowX2, arrowY);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 3;
    ctx.stroke();
    /* Arrowhead */
    ctx.beginPath();
    ctx.moveTo(arrowX2, arrowY);
    ctx.lineTo(arrowX2 - 8, arrowY - 5);
    ctx.lineTo(arrowX2 - 8, arrowY + 5);
    ctx.closePath();
    ctx.fillStyle = '#3ddc84';
    ctx.fill();
    ctx.font = 'bold 11px ' + "'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'left';
    ctx.fillText('Feed ' + mfix(feedRate,'feed',0) + ' ' + mu('feed'), arrowX1, arrowY - 10);

    /* Rotation indicator */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.arc(0, 0, cutR + 15, -0.5, 1.5);
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Arrowhead on arc */
    var arrowArcX = Math.cos(1.5) * (cutR + 15);
    var arrowArcY = Math.sin(1.5) * (cutR + 15);
    ctx.beginPath();
    ctx.moveTo(arrowArcX, arrowArcY);
    ctx.lineTo(arrowArcX + 6, arrowArcY - 4);
    ctx.lineTo(arrowArcX + 2, arrowArcY + 6);
    ctx.closePath();
    ctx.fillStyle = '#f5c842';
    ctx.fill();
    ctx.restore();

    /* RPM label */
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 11px ' + "'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText(spindle + ' RPM', cx, cy - cutR - 22);

    /* Depth of cut indicator (right side) */
    var docX = wpX + wpW + 20;
    var docTopY = wpY;
    var docScale = Math.min(depthOfCut * 5, wpH * 0.8);
    ctx.beginPath();
    ctx.moveTo(docX, docTopY);
    ctx.lineTo(docX, docTopY + docScale);
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* DOC arrows */
    ctx.beginPath();
    ctx.moveTo(docX - 4, docTopY + 4);
    ctx.lineTo(docX, docTopY);
    ctx.lineTo(docX + 4, docTopY + 4);
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(docX - 4, docTopY + docScale - 4);
    ctx.lineTo(docX, docTopY + docScale);
    ctx.lineTo(docX + 4, docTopY + docScale - 4);
    ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.font = '10px ' + "'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('DOC ' + mfix(depthOfCut,'len',1) + ' ' + mu('len'), docX + 6, docTopY + docScale / 2 + 4);

    /* Info panel (top-right) */
    var infoX = W - 160;
    var infoY = 15;
    ctx.fillStyle = 'rgba(22,27,39,0.85)';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, 150, 90, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px ' + "'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('V = ' + mfix(c.V,'vc',1) + ' ' + mu('vc'), infoX + 10, infoY + 18);
    ctx.fillText('f_z = ' + mfix(c.fz,'fz',4) + ' ' + mu('fz'), infoX + 10, infoY + 34);
    ctx.fillText('MRR = ' + mfix(c.mrrCm3,'mrr',2) + ' ' + mu('mrr'), infoX + 10, infoY + 50);
    ctx.fillText('P = ' + mfix(c.P, 'power', 2) + ' ' + mu('power'), infoX + 10, infoY + 66);
    ctx.fillStyle = '#00bfa5';
    ctx.fillText(cutterType === 'endmill' ? 'End Mill' : cutterType === 'facemill' ? 'Face Mill' : 'Slot Drill', infoX + 10, infoY + 82);

    /* Cutter type label */
    ctx.fillStyle = '#00bfa5';
    ctx.font = 'bold 12px ' + "'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = 'left';
    ctx.fillText('\u00D8' + mfix(cutterDia,'len',0) + ' ' + mu('len') + ' \u00D7 ' + numTeeth + 'T', 15, 25);
  }

  /* ================================================================
     DRAWING — Side-view milling simulation
     ================================================================ */

  function draw() {
    var W = LOGW, H = LOGH;   /* logical CSS-px space; backing is DPR-scaled */
    ctx.clearRect(0, 0, W, H);

    if (mode !== 'simulate') return;

    var c = calc();

    /* Background — shop-floor gradient */
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#10141a');
    bgGrad.addColorStop(1, '#06080c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    /* Subtle floor grid */
    ctx.strokeStyle = 'rgba(40,50,70,0.18)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, H - 60); ctx.lineTo(gx, H); ctx.stroke();
    }

    /* E-Stop shake */
    var shakeX = machineState.estopShake > 0
      ? Math.sin(performance.now() / 30) * machineState.estopShake * 4
      : 0;
    if (machineState.estopShake > 0) machineState.estopShake = Math.max(0, machineState.estopShake - 0.02);

    /* Worklight cone */
    if (machineState.power && machineState.worklight) {
      var lightX = W * 0.55, lightY = 30;
      var lg = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 280);
      lg.addColorStop(0, 'rgba(255,244,184,0.20)');
      lg.addColorStop(0.5, 'rgba(255,244,184,0.06)');
      lg.addColorStop(1, 'rgba(255,244,184,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.save();
    ctx.translate(shakeX, 0);

    /* Title strip */
    ctx.fillStyle = COL.text;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    var cutterLabel = cutterType === 'endmill' ? 'End Mill' : cutterType === 'facemill' ? 'Face Mill' : 'Slot Drill';
    ctx.fillText('Vertical Knee Mill — ' + cutterLabel + '  ', W / 2 - 35, 18);
    ctx.fillStyle = MAT_PROPS[material].color;
    ctx.fillText('• ' + MAT_PROPS[material].name, W / 2 + 80, 18);

    drawMillingMachineSideView(W, H, c);

    ctx.restore();

    /* Status bar pinned at canvas bottom */
    drawMillingStatusBar(W, H, c);
    return;

    /* ─── Legacy code below (unreachable but preserved for reference) ─── */
    var gs = 30;

    /* Layout dimensions */
    var wpX = W * 0.08;
    var wpW = W * 0.84;
    var wpH = H * 0.28;
    var wpY = H * 0.52;
    var tableY = wpY + wpH;
    var tableH = H * 0.05;

    /* Depth scaling: depthOfCut (0.5–10mm) maps to visual pixels */
    var maxDepthPx = wpH * 0.55;
    var depthPx = depthOfCut / 10 * maxDepthPx;

    /* Cutter visual width */
    var cutterWidthPx = Math.max(18, cutterDia / 150 * wpW);
    if (cutterType === 'facemill') cutterWidthPx = Math.max(30, cutterDia / 100 * wpW);
    cutterWidthPx = Math.min(cutterWidthPx, wpW * 0.35);

    var cutterHeightPx = Math.min(H * 0.22, 100);
    var aboveWp = H * 0.14;

    /* Tool pixel position */
    var toolCX = wpX + toolNormX * wpW;
    var toolBottomY = (wpY - aboveWp) + toolNormY * (aboveWp + depthPx);
    var toolTopY = toolBottomY - cutterHeightPx;

    /* ── Machine Table ── */
    ctx.fillStyle = '#1a2332';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(wpX - 15, tableY, wpW + 30, tableH);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2a305066';
    ctx.lineWidth = 1;
    for (var ts = wpX + 30; ts < wpX + wpW; ts += 50) {
      ctx.beginPath(); ctx.moveTo(ts, tableY + 3); ctx.lineTo(ts, tableY + tableH - 3); ctx.stroke();
    }

    /* ── Workpiece with material removal ── */
    var matColor = MAT_PROPS[material].color;
    var segW = wpW / PROFILE_RES;

    for (var seg = 0; seg < PROFILE_RES; seg++) {
      var sx = wpX + seg * segW;
      var removedDepth = cutProfile[seg] || 0;
      var removedPx = removedDepth / 10 * maxDepthPx;

      if (removedPx > 0) {
        ctx.fillStyle = '#0d111788';
        ctx.fillRect(sx, wpY, segW + 0.5, removedPx);
        ctx.fillStyle = matColor + '55';
        ctx.fillRect(sx, wpY + removedPx - 1, segW + 0.5, 2);
      }

      ctx.fillStyle = matColor + '44';
      ctx.fillRect(sx, wpY + removedPx, segW + 0.5, wpH - removedPx);
    }

    /* Workpiece outline */
    ctx.strokeStyle = matColor + 'aa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(wpX, wpY, wpW, wpH);
    ctx.stroke();
    ctx.strokeStyle = matColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wpX, wpY); ctx.lineTo(wpX + wpW, wpY);
    ctx.stroke();

    ctx.fillStyle = matColor;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(MAT_PROPS[material].name + ' Workpiece', wpX + wpW / 2, tableY + tableH + 15);

    /* ── Spindle Column ── */
    var colW = 14;
    ctx.fillStyle = '#161b27';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(toolCX - colW / 2, 0, colW, toolTopY + 5);
    ctx.fill(); ctx.stroke();

    /* ── Spindle Housing ── */
    var spW = cutterWidthPx + 24;
    var spH = 28;
    var spY = toolTopY - spH + 2;
    ctx.fillStyle = '#1f2535';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(toolCX - spW / 2, spY, spW, spH, 5);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPINDLE', toolCX, spY + spH / 2 + 3);

    /* ── Cutter ── */
    drawCutter(toolCX, toolTopY, toolBottomY, cutterWidthPx, cutterHeightPx);

    /* ── Cutting zone glow ── */
    if (millState === 'milling' && toolBottomY > wpY) {
      var glowGrad = ctx.createRadialGradient(toolCX, wpY, 0, toolCX, wpY, cutterWidthPx);
      glowGrad.addColorStop(0, 'rgba(255,85,85,0.25)');
      glowGrad.addColorStop(1, 'rgba(255,85,85,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(toolCX - cutterWidthPx, wpY - 10, cutterWidthPx * 2, depthPx + 20);
    }

    /* ── Chip Particles ── */
    for (var pi = 0; pi < chipParticles.length; pi++) {
      var p = chipParticles[pi];
      var alpha = Math.max(0, Math.min(1, p.life / 30));
      var hex = Math.floor(alpha * 200).toString(16);
      if (hex.length < 2) hex = '0' + hex;
      ctx.fillStyle = matColor + hex;
      ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
    }

    /* ── RPM Label ── */
    if (millState !== 'idle') {
      ctx.fillStyle = '#f5c842';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(spindle + ' RPM', toolCX, spY - 8);
      ctx.save();
      ctx.translate(toolCX + spW / 2 + 12, spY + spH / 2);
      ctx.beginPath();
      ctx.arc(0, 0, 8, -0.5 + angle, 1.8 + angle);
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    /* ── Feed Arrow ── */
    if (millState === 'milling') {
      var arrY = tableY + tableH + 28;
      var arrX1 = wpX + 10;
      var arrX2 = arrX1 + Math.min(feedRate / 5, wpW * 0.25);
      ctx.beginPath();
      ctx.moveTo(arrX1, arrY); ctx.lineTo(arrX2, arrY);
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrX2, arrY); ctx.lineTo(arrX2 - 7, arrY - 4); ctx.lineTo(arrX2 - 7, arrY + 4);
      ctx.closePath();
      ctx.fillStyle = '#3ddc84';
      ctx.fill();
      ctx.fillStyle = '#3ddc84';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Feed: ' + mfix(feedRate,'feed',0) + ' ' + mu('feed'), arrX2 + 8, arrY + 4);
    }

    /* ── DOC Indicator ── */
    if (millState !== 'idle' && depthPx > 3) {
      var docX = wpX + wpW + 12;
      ctx.strokeStyle = '#ff5555';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(docX, wpY); ctx.lineTo(docX, wpY + depthPx); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(docX - 3, wpY + 3); ctx.lineTo(docX, wpY); ctx.lineTo(docX + 3, wpY + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(docX - 3, wpY + depthPx - 3); ctx.lineTo(docX, wpY + depthPx); ctx.lineTo(docX + 3, wpY + depthPx - 3); ctx.stroke();
      ctx.fillStyle = '#ff5555';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('DOC ' + mfix(depthOfCut,'len',1) + mu('len'), docX + 5, wpY + depthPx / 2 + 4);
    }

    /* ── Info Panel (top-right) ── */
    var infoX = W - 155;
    var infoY = 8;
    ctx.fillStyle = 'rgba(22,27,39,0.9)';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(infoX, infoY, 148, 100, 8);
    ctx.fill(); ctx.stroke();

    var cutterLabel = cutterType === 'endmill' ? 'End Mill' : cutterType === 'facemill' ? 'Face Mill' : 'Slot Drill';
    ctx.fillStyle = '#00bfa5';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(cutterLabel + '  \u00D8' + cutterDia + '\u00D7' + numTeeth + 'T', infoX + 8, infoY + 16);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('V = ' + mfix(c.V,'vc',1) + ' ' + mu('vc'), infoX + 8, infoY + 33);
    ctx.fillText('fz = ' + mfix(c.fz,'fz',4) + ' ' + mu('fz'), infoX + 8, infoY + 47);
    ctx.fillText('MRR = ' + mfix(c.mrrCm3,'mrr',2) + ' ' + mu('mrr'), infoX + 8, infoY + 61);
    ctx.fillText('P = ' + mfix(c.P, 'power', 2) + ' ' + mu('power'), infoX + 8, infoY + 75);
    ctx.fillText('Ra = ' + c.Ra.toFixed(3) + ' \u00B5m', infoX + 8, infoY + 89);

    /* ── Status Label ── */
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (millState === 'idle') {
      ctx.fillStyle = '#6b7a99';
      ctx.fillText('Press \u25B6 Start Milling to begin', W / 2, H - 10);
    } else if (millState === 'descend') {
      ctx.fillStyle = '#f5c842';
      ctx.fillText('Descending to depth...', W / 2, H - 10);
    } else if (millState === 'milling') {
      var pct = Math.min(100, Math.max(0, Math.round(toolNormX * 100)));
      ctx.fillStyle = '#00bfa5';
      ctx.fillText('Milling in progress... ' + pct + '%', W / 2, H - 10);
    } else if (millState === 'retract') {
      ctx.fillStyle = '#f5c842';
      ctx.fillText('Retracting tool...', W / 2, H - 10);
    } else if (millState === 'done') {
      ctx.fillStyle = '#3ddc84';
      ctx.fillText('\u2714 Milling Complete!', W / 2, H - 10);
    }
  }

  /* ============================================================
     SIDE-VIEW VERTICAL KNEE MILL — realistic industrial render
     ============================================================ */
  function drawMillingMachineSideView(W, H, c) {
    var matColor = MAT_PROPS[material].color;
    var matHi    = MAT_PROPS[material].hl;

    /* Layout calculations */
    var statusH = 38;
    var floorY  = H - statusH;
    var baseH   = Math.max(30, H * 0.075);
    var baseY   = floorY - baseH;
    var baseX   = 18;
    var baseW   = W - baseX * 2;

    /* Column at the LEFT */
    var colX = baseX + 8;
    var colW = Math.max(70, W * 0.085);
    var colTop = 60;
    var colBot = baseY;

    /* Overarm/ram at the top, extends right from column */
    var overY = colTop;
    var overH = Math.max(30, H * 0.075);
    var overX = colX;
    var overW = W - baseX - colX;

    /* Motor housing on top */
    var motorY = overY - 26;
    var motorH = 28;

    /* Spindle head — hangs from overarm at right-center */
    var headW = Math.max(46, W * 0.07);
    var headH = Math.max(48, H * 0.12);
    var headCX = colX + colW + (overW - colW) * 0.6;
    var headY = overY + overH - 3;

    /* Workpiece + table positioning */
    var wpW = Math.max(160, W * 0.32);
    var wpH = Math.max(36, H * 0.085);

    /* Tool descent travel */
    var quillRetract = headY + headH;
    var maxToolBottom = colBot - baseH * 0.95 - wpH - 8;   // workpiece top region
    var maxDepthPx = Math.min(wpH * 0.6, depthOfCut / 10 * wpH);
    var depthPx = depthOfCut / 10 * (wpH * 0.6);

    /* toolNormX = horizontal feed (we move the TABLE/workpiece, keeping cutter
       roughly centered above the workpiece) */
    var feedTravel = Math.max(100, W * 0.18);
    var tableX = headCX - wpW * 0.5 + feedTravel * (0.5 - toolNormX);
    var wpX = tableX;
    var tableTopY = maxToolBottom + wpH;       // top surface of table = bottom of workpiece
    var wpY = tableTopY - wpH;

    /* Knee/saddle attached to column, beneath the table */
    var kneeX = colX + colW - 4;
    var kneeY = tableTopY + 14;
    var kneeH = baseY - kneeY;
    var kneeW = Math.max(140, W * 0.22);

    /* Tool dimensions */
    var cutterWidthPx = Math.max(20, Math.min(wpW * 0.4, cutterDia / 100 * wpW * 0.6));
    if (cutterType === 'facemill') cutterWidthPx = Math.max(34, Math.min(wpW * 0.55, cutterDia / 80 * wpW * 0.6));
    var cutterHeightPx = Math.min(H * 0.16, 70);
    var quillY = quillRetract;
    var toolBottomY = (wpY - 10) + toolNormY * (depthPx + 10);
    var toolTopY = toolBottomY - cutterHeightPx;

    /* ── 1) Floor shadow ── */
    var shadowGrad = ctx.createRadialGradient(W/2, floorY+12, 0, W/2, floorY+12, baseW*0.55);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(W/2, floorY+14, baseW*0.5, 11, 0, 0, Math.PI*2);
    ctx.fill();

    /* ── 2) BASE (wide green casting at the bottom) ── */
    _drawPaintedBox(ctx, baseX, baseY, baseW, baseH, false);
    _drawHazardStripe(ctx, baseX + 10, baseY + baseH - 9, baseW - 20, 6);
    /* Base brand plate */
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(baseX + 30, baseY + 8, 110, 14);
    ctx.strokeStyle = COL.brass; ctx.lineWidth = 0.5; ctx.strokeRect(baseX + 30, baseY + 8, 110, 14);
    ctx.fillStyle = COL.brass;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MECH-MILL VK-650', baseX + 85, baseY + 18);

    /* ── 3) COLUMN (tall painted casting on the left) ── */
    _drawPaintedBox(ctx, colX, colTop, colW, colBot - colTop, true);
    /* Bolts along column edges */
    for (var bb = colTop + 14; bb < colBot - 10; bb += 30) {
      _drawBolt(ctx, colX + 6, bb, 2.5);
      _drawBolt(ctx, colX + colW - 6, bb, 2.5);
    }
    /* Vertical column guides (precision ground) */
    ctx.strokeStyle = '#5a626c';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(colX + colW + 1, colTop + 10); ctx.lineTo(colX + colW + 1, colBot - 10); ctx.stroke();

    /* ── 4) OVERARM / RAM ── */
    _drawPaintedBox(ctx, overX, overY, overW, overH, false);
    /* Rim bolts */
    for (var ob = overX + 12; ob < overX + overW - 12; ob += 50) {
      _drawBolt(ctx, ob, overY + 6, 2.2);
      _drawBolt(ctx, ob, overY + overH - 6, 2.2);
    }

    /* ── 5) MOTOR HOUSING (on top of overarm) ── */
    var motorCX = headCX;
    var motorW = Math.max(80, W * 0.13);
    _drawPaintedBox(ctx, motorCX - motorW/2, motorY, motorW, motorH, false);
    /* Cooling fins */
    ctx.strokeStyle = _darken(COL.paintDark, 10);
    ctx.lineWidth = 0.8;
    for (var fi = motorCX - motorW/2 + 6; fi < motorCX + motorW/2 - 6; fi += 4) {
      ctx.beginPath();
      ctx.moveTo(fi, motorY + 4); ctx.lineTo(fi, motorY + motorH - 4);
      ctx.stroke();
    }
    /* Power LED on motor */
    ctx.fillStyle = machineState.power ? '#3ddc84' : '#2a2f36';
    ctx.beginPath(); ctx.arc(motorCX + motorW/2 - 8, motorY + 6, 3, 0, Math.PI*2); ctx.fill();
    if (machineState.power) {
      ctx.shadowColor = '#3ddc84'; ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    /* ── 6) SPINDLE HEAD (vertical box hanging from overarm) ── */
    var headX = headCX - headW/2;
    _drawPaintedBox(ctx, headX, headY, headW, headH, true);
    /* Quill housing bolts */
    _drawBolt(ctx, headX + 5, headY + 5, 2.2);
    _drawBolt(ctx, headX + headW - 5, headY + 5, 2.2);
    _drawBolt(ctx, headX + 5, headY + headH - 5, 2.2);
    _drawBolt(ctx, headX + headW - 5, headY + headH - 5, 2.2);
    /* SPINDLE label */
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(headX + 5, headY + headH/2 - 6, headW - 10, 12);
    ctx.fillStyle = COL.brass;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPINDLE', headCX, headY + headH/2 + 2);
    /* RPM tag */
    if (millState !== 'idle' && machineState.power) {
      ctx.fillStyle = COL.hazardY;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(spindle + ' RPM', headCX, headY - 6);
    }

    /* ── 7) QUILL (chrome cylindrical rod) descends from spindle head ── */
    var quillW = 16;
    var quillTopY = headY + headH;
    var quillBotY = toolTopY + 4;
    var quillGrad = ctx.createLinearGradient(headCX - quillW/2, 0, headCX + quillW/2, 0);
    quillGrad.addColorStop(0, COL.steelDark);
    quillGrad.addColorStop(0.4, COL.steel);
    quillGrad.addColorStop(0.55, COL.steelLight);
    quillGrad.addColorStop(1, COL.steelDark);
    ctx.fillStyle = quillGrad;
    ctx.fillRect(headCX - quillW/2, quillTopY, quillW, quillBotY - quillTopY);
    ctx.strokeStyle = COL.steelDark; ctx.lineWidth = 0.8;
    ctx.strokeRect(headCX - quillW/2, quillTopY, quillW, quillBotY - quillTopY);
    /* Calibration marks */
    ctx.strokeStyle = '#1a1d22'; ctx.lineWidth = 0.5;
    for (var qm = quillTopY + 4; qm < quillBotY - 4; qm += 5) {
      ctx.beginPath();
      ctx.moveTo(headCX - quillW/2 + 2, qm);
      ctx.lineTo(headCX - quillW/2 + 5, qm);
      ctx.stroke();
    }

    /* ── 8) SPINDLE NOSE (bronze) ── */
    var noseW = quillW + 6;
    var noseH = 7;
    var noseY = quillBotY - 2;
    var noseGrad = ctx.createLinearGradient(0, noseY, 0, noseY + noseH);
    noseGrad.addColorStop(0, _lighten(COL.bronze, 30));
    noseGrad.addColorStop(0.5, COL.bronze);
    noseGrad.addColorStop(1, COL.brassDark);
    ctx.fillStyle = noseGrad;
    ctx.fillRect(headCX - noseW/2, noseY, noseW, noseH);
    ctx.strokeStyle = COL.brassDark; ctx.lineWidth = 0.8;
    ctx.strokeRect(headCX - noseW/2, noseY, noseW, noseH);

    /* ── 9) KNEE (painted casting attached to column) ── */
    _drawPaintedBox(ctx, kneeX, kneeY, kneeW, kneeH, true);
    /* Bolts */
    _drawBolt(ctx, kneeX + 6, kneeY + 6, 2.2);
    _drawBolt(ctx, kneeX + kneeW - 6, kneeY + 6, 2.2);
    _drawBolt(ctx, kneeX + 6, kneeY + kneeH - 6, 2.2);
    _drawBolt(ctx, kneeX + kneeW - 6, kneeY + kneeH - 6, 2.2);
    /* Knee elevation handwheel on the right side */
    _drawHandwheel(ctx, kneeX + kneeW + 8, kneeY + kneeH * 0.55, 13);

    /* ── 10) SADDLE (smaller darker casting on top of knee) ── */
    var saddleY = kneeY - 8;
    var saddleH = 12;
    var saddleX = kneeX + 8;
    var saddleW = kneeW - 16;
    ctx.fillStyle = _darken(COL.paintMid, 10);
    _roundRect(ctx, saddleX, saddleY, saddleW, saddleH, 3);
    ctx.fill();
    ctx.strokeStyle = COL.paintDark; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(saddleX + 2, saddleY + 1, saddleW - 4, 2);

    /* ── 11) TABLE (long cast iron bar with T-slots) ── */
    var tableLeft = colX + colW + 10;
    var tableRight = W - baseX - 10;
    var tableY1 = saddleY - 14;
    var tableH1 = 18;
    /* Top — machined gray */
    var tableGrad = ctx.createLinearGradient(0, tableY1, 0, tableY1 + tableH1);
    tableGrad.addColorStop(0, '#5a626c');
    tableGrad.addColorStop(0.3, COL.bedTop);
    tableGrad.addColorStop(1, '#2a2f36');
    ctx.fillStyle = tableGrad;
    ctx.fillRect(tableLeft, tableY1, tableRight - tableLeft, tableH1);
    ctx.strokeStyle = COL.castIron; ctx.lineWidth = 1;
    ctx.strokeRect(tableLeft, tableY1, tableRight - tableLeft, tableH1);
    /* Top highlight */
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(tableLeft, tableY1 + 0.5); ctx.lineTo(tableRight, tableY1 + 0.5); ctx.stroke();
    /* T-slots (3 dark grooves running along the table) */
    for (var ts = 0; ts < 3; ts++) {
      var tsy = tableY1 + 4 + ts * 5;
      ctx.fillStyle = '#0c0f15';
      ctx.fillRect(tableLeft + 6, tsy, tableRight - tableLeft - 12, 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(tableLeft + 6, tsy); ctx.lineTo(tableRight - 6, tsy); ctx.stroke();
    }
    /* Table feed handwheels at both ends */
    _drawHandwheel(ctx, tableLeft - 12, tableY1 + tableH1/2, 11);
    _drawHandwheel(ctx, tableRight + 12, tableY1 + tableH1/2, 11);

    /* ── 12) WORKPIECE (sits on table) ── */
    var wpFinalX = Math.max(tableLeft + 8, Math.min(tableRight - wpW - 8, wpX));
    var wpFinalY = tableY1 - wpH;
    var wpGrad = ctx.createLinearGradient(0, wpFinalY, 0, wpFinalY + wpH);
    wpGrad.addColorStop(0, _darken(matColor, 25));
    wpGrad.addColorStop(0.3, matColor);
    wpGrad.addColorStop(0.5, matHi);
    wpGrad.addColorStop(0.7, matColor);
    wpGrad.addColorStop(1, _darken(matColor, 35));
    ctx.fillStyle = wpGrad;
    ctx.fillRect(wpFinalX, wpFinalY, wpW, wpH);
    ctx.strokeStyle = _darken(matColor, 30); ctx.lineWidth = 1.2;
    ctx.strokeRect(wpFinalX, wpFinalY, wpW, wpH);
    /* Surface finish marks (after cutting) */
    for (var seg = 0; seg < PROFILE_RES; seg++) {
      var segX = wpFinalX + (seg / PROFILE_RES) * wpW;
      var removed = cutProfile[seg] || 0;
      if (removed > 0) {
        var removedPx = removed / 10 * (wpH * 0.5);
        ctx.fillStyle = _rgba('#0a0d12', 0.7);
        ctx.fillRect(segX, wpFinalY, wpW / PROFILE_RES + 0.7, removedPx);
        /* Bottom of cut edge highlight */
        ctx.fillStyle = matHi;
        ctx.fillRect(segX, wpFinalY + removedPx - 1, wpW / PROFILE_RES + 0.7, 1.5);
      }
    }

    /* Material label */
    ctx.fillStyle = COL.textDim;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(MAT_PROPS[material].name + ' Workpiece (' + mfix(wpW,'len',0) + ' ' + mu('len') + ')', wpFinalX + wpW / 2, tableY1 + tableH1 + 14);

    /* ── 13) CUTTER (descends from quill) ── */
    drawCutter(headCX, toolTopY, toolBottomY, cutterWidthPx, cutterHeightPx);

    /* ── 14) Cutting glow when engaged ── */
    if (millState === 'milling' && toolBottomY > wpFinalY) {
      var glow = ctx.createRadialGradient(headCX, wpFinalY, 0, headCX, wpFinalY, cutterWidthPx);
      glow.addColorStop(0, 'rgba(255,140,60,0.32)');
      glow.addColorStop(1, 'rgba(255,140,60,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(headCX - cutterWidthPx, wpFinalY - 6, cutterWidthPx * 2, depthPx + 10);
    }

    /* ── 15) COOLANT NOZZLE & STREAM ── */
    if (machineState.coolant && machineState.power) {
      var nozX = headCX + headW * 0.55;
      var nozTopY = headY + headH + 4;
      var targetY = wpFinalY + 2;
      ctx.strokeStyle = COL.coolantHose;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(nozX, nozTopY);
      ctx.quadraticCurveTo(nozX - 8, nozTopY + 22, headCX + cutterWidthPx/2 + 4, toolBottomY - 8);
      ctx.stroke();
      ctx.lineCap = 'butt';
      /* Stream */
      if (millState === 'milling') {
        ctx.strokeStyle = _rgba(COL.coolantBlue, 0.7);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(headCX + cutterWidthPx/2 + 4, toolBottomY - 5);
        ctx.lineTo(headCX + cutterWidthPx/2 + 1, targetY);
        ctx.stroke();
        /* Droplets */
        for (var dr = 0; dr < 5; dr++) {
          ctx.fillStyle = _rgba(COL.coolantBlue, 0.3 + Math.random() * 0.4);
          ctx.beginPath();
          ctx.arc(headCX + cutterWidthPx/2 + 1 + (Math.random()-0.5)*5,
                  toolBottomY - 4 + dr * (targetY - toolBottomY + 5) / 5 + (Math.random()-0.5)*3,
                  1 + Math.random() * 1.5, 0, Math.PI*2);
          ctx.fill();
        }
        /* Splash */
        ctx.fillStyle = _rgba(COL.coolantBlue, 0.4);
        ctx.beginPath();
        ctx.ellipse(headCX + cutterWidthPx/2 + 1, targetY + 2, 6, 2, 0, 0, Math.PI*2);
        ctx.fill();
      }
    }

    /* ── 16) SAFETY GUARD (transparent shield around cutter) ── */
    if (machineState.guard) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#7ec8ff';
      ctx.fillRect(headCX - cutterWidthPx - 12, headY + headH + 4, cutterWidthPx * 2 + 24, toolBottomY - (headY + headH) + 6);
      ctx.restore();
      ctx.strokeStyle = '#8aa0b8'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(headCX - cutterWidthPx - 12, headY + headH + 4);
      ctx.lineTo(headCX - cutterWidthPx - 12, toolBottomY + 8);
      ctx.moveTo(headCX + cutterWidthPx + 12, headY + headH + 4);
      ctx.lineTo(headCX + cutterWidthPx + 12, toolBottomY + 8);
      ctx.stroke();
    }

    /* ── 17) CHIP PARTICLES ── */
    for (var pi = 0; pi < chipParticles.length; pi++) {
      var p = chipParticles[pi];
      var alpha = Math.max(0, Math.min(1, p.life / 30));
      ctx.fillStyle = _rgba(p.color || matColor, alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }

    /* ── 18) Feed direction arrow ── */
    if (millState === 'milling') {
      var arrowY = wpFinalY + wpH + 6;
      var arrowX1 = wpFinalX + 6;
      var arrowX2 = arrowX1 + Math.min(feedRate / 6, wpW * 0.3);
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(arrowX1, arrowY); ctx.lineTo(arrowX2, arrowY); ctx.stroke();
      ctx.fillStyle = '#3ddc84';
      ctx.beginPath();
      ctx.moveTo(arrowX2, arrowY); ctx.lineTo(arrowX2 - 7, arrowY - 4); ctx.lineTo(arrowX2 - 7, arrowY + 4);
      ctx.closePath(); ctx.fill();
    }

    /* ── 19) Depth of cut indicator ── */
    if (millState !== 'idle' && depthPx > 3) {
      var docX = wpFinalX + wpW + 12;
      ctx.strokeStyle = COL.hazardY;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(docX, wpFinalY); ctx.lineTo(docX, wpFinalY + depthPx); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(docX - 3, wpFinalY + 3); ctx.lineTo(docX, wpFinalY); ctx.lineTo(docX + 3, wpFinalY + 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(docX - 3, wpFinalY + depthPx - 3); ctx.lineTo(docX, wpFinalY + depthPx); ctx.lineTo(docX + 3, wpFinalY + depthPx - 3); ctx.stroke();
      ctx.fillStyle = COL.hazardY;
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('a_p = ' + depthOfCut.toFixed(1) + ' mm', docX + 5, wpFinalY + depthPx / 2 + 4);
    }
  }

  /* ── Status bar at canvas bottom ── */
  function drawMillingStatusBar(W, H, c) {
    var y = H - 32;
    ctx.fillStyle = 'rgba(8,12,18,0.92)';
    _roundRect(ctx, 10, y, W - 20, 26, 6); ctx.fill();
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1; ctx.stroke();

    var statusColor = !machineState.power ? '#ff5555'
      : (millState === 'milling' ? '#3ddc84' : millState === 'done' ? '#00bfa5' : '#f5c842');
    var statusText = !machineState.power ? 'POWER OFF'
      : millState === 'idle' ? 'READY'
      : millState === 'descend' ? 'DESCENDING'
      : millState === 'milling' ? 'MACHINING'
      : millState === 'retract' ? 'RETRACTING'
      : 'COMPLETE';
    ctx.fillStyle = statusColor;
    ctx.beginPath(); ctx.arc(24, y + 13, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.shadowColor = statusColor; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = COL.text;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(statusText, 36, y + 16);

    var cutterLabel = cutterType === 'endmill' ? 'End Mill' : cutterType === 'facemill' ? 'Face Mill' : 'Slot Drill';
    ctx.fillStyle = COL.textDim;
    ctx.font = '9px sans-serif';
    ctx.fillText(cutterLabel + ' Ø' + cutterDia + ' × ' + numTeeth + 'T  |  ' + MAT_PROPS[material].name, 130, y + 16);
    ctx.fillStyle = '#1e88e5';
    ctx.textAlign = 'right';
    ctx.fillText('V=' + mfix(c.V,'vc',1) + ' ' + mu('vc') + '  MRR=' + mfix(c.mrrCm3,'mrr',2) + ' ' + mu('mrr') + '  P=' + mfix(c.P,'power',2) + ' ' + mu('power'), W - 16, y + 16);
  }

  /* ── REALISTIC CUTTER (side view, dark steel + gold inserts) ── */
  function drawCutter(cx, topY, bottomY, w, h) {
    var halfW = w / 2;
    var shankW = Math.max(8, halfW * 0.42);
    var bodyTop = topY + h * 0.3;

    /* Common: shank (dark steel) */
    var shankGrad = ctx.createLinearGradient(cx - shankW, 0, cx + shankW, 0);
    shankGrad.addColorStop(0, '#0e1116');
    shankGrad.addColorStop(0.45, '#2a3140');
    shankGrad.addColorStop(0.55, '#4a5260');
    shankGrad.addColorStop(1, '#0e1116');
    ctx.fillStyle = shankGrad;
    ctx.fillRect(cx - shankW, topY, shankW * 2, bodyTop - topY);
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
    ctx.strokeRect(cx - shankW, topY, shankW * 2, bodyTop - topY);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(cx - shankW + 1, topY + 2, 2, (bodyTop - topY) - 4);

    if (cutterType === 'endmill') {
      /* Fluted cutter body */
      var bodyGrad = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      bodyGrad.addColorStop(0, COL.steelDark);
      bodyGrad.addColorStop(0.4, COL.steel);
      bodyGrad.addColorStop(0.55, COL.steelLight);
      bodyGrad.addColorStop(1, COL.steelDark);
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.strokeRect(cx - halfW, bodyTop, w, bottomY - bodyTop);

      /* Helical flute lines, scrolling with rotation */
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - halfW, bodyTop, w, bottomY - bodyTop); ctx.clip();
      var bodyH = bottomY - bodyTop;
      for (var fi = 0; fi < numTeeth; fi++) {
        var off = ((fi / numTeeth) + (angle / (Math.PI * 2))) % 1;
        var sx = cx - halfW + off * w;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(sx, bodyTop);
        ctx.lineTo(sx - w * 0.35, bottomY);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx + 2, bodyTop);
        ctx.lineTo(sx + 2 - w * 0.35, bottomY);
        ctx.stroke();
      }
      ctx.restore();

      /* Bottom: gold carbide cutting edges */
      ctx.fillStyle = COL.insertGold;
      ctx.fillRect(cx - halfW, bottomY - 4, w, 4);
      ctx.strokeStyle = COL.insertEdge; ctx.lineWidth = 0.6;
      ctx.strokeRect(cx - halfW, bottomY - 4, w, 4);
      /* Bright glint */
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - halfW + 2, bottomY - 3.5);
      ctx.lineTo(cx + halfW - 2, bottomY - 3.5);
      ctx.stroke();

    } else if (cutterType === 'facemill') {
      /* Wide face mill body */
      var bodyGrad2 = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      bodyGrad2.addColorStop(0, '#2a3140');
      bodyGrad2.addColorStop(0.3, COL.steelDark);
      bodyGrad2.addColorStop(0.5, COL.steel);
      bodyGrad2.addColorStop(0.7, COL.steelDark);
      bodyGrad2.addColorStop(1, '#2a3140');
      ctx.fillStyle = bodyGrad2;
      ctx.fillRect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.strokeRect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      /* Center ring */
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1;
      var midY = (bodyTop + bottomY) / 2;
      ctx.beginPath(); ctx.moveTo(cx - halfW + 4, midY); ctx.lineTo(cx + halfW - 4, midY); ctx.stroke();

      /* Multiple gold carbide inserts on bottom face */
      var numIns = Math.max(4, Math.min(numTeeth, Math.floor(w / 12)));
      var spacing = w / (numIns + 1);
      for (var ii = 0; ii < numIns; ii++) {
        var ix = cx - halfW + spacing * (ii + 1) + Math.sin(angle * 3 + ii) * 1;
        /* Insert pocket (dark) */
        ctx.fillStyle = '#0a0c10';
        ctx.fillRect(ix - 5, bottomY - 8, 10, 7);
        /* Gold insert */
        ctx.fillStyle = COL.insertGold;
        ctx.beginPath();
        ctx.moveTo(ix - 5, bottomY - 3);
        ctx.lineTo(ix, bottomY + 5);
        ctx.lineTo(ix + 5, bottomY - 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = COL.insertEdge; ctx.lineWidth = 0.6;
        ctx.stroke();
        /* Glint on each insert */
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ix - 1, bottomY - 2, 2, 1);
      }

    } else {
      /* Slot drill — 2-3 flutes, center-cutting V-tip */
      var bodyGrad3 = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      bodyGrad3.addColorStop(0, COL.steelDark);
      bodyGrad3.addColorStop(0.5, COL.steelLight);
      bodyGrad3.addColorStop(1, COL.steelDark);
      ctx.fillStyle = bodyGrad3;
      ctx.fillRect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.strokeRect(cx - halfW, bodyTop, w, bottomY - bodyTop);

      /* 2 wide flute grooves, scrolling */
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - halfW, bodyTop, w, bottomY - bodyTop); ctx.clip();
      var slotN = Math.min(numTeeth, 3);
      for (var si = 0; si < slotN; si++) {
        var off2 = ((si / slotN) + (angle / (Math.PI * 2))) % 1;
        var sx2 = cx - halfW + off2 * w;
        ctx.strokeStyle = 'rgba(0,0,0,0.65)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(sx2, bodyTop);
        ctx.lineTo(sx2 - w * 0.5, bottomY);
        ctx.stroke();
      }
      ctx.restore();

      /* Center-cutting V-tip with gold cutting edge */
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.moveTo(cx - halfW, bottomY);
      ctx.lineTo(cx, bottomY + 6);
      ctx.lineTo(cx + halfW, bottomY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COL.insertEdge; ctx.lineWidth = 0.8;
      ctx.stroke();
      /* Glint at tip */
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, bottomY + 4, 1.5, 0, Math.PI*2);
      ctx.fill();
    }

    /* Hot contact point when running */
    if (millState === 'milling') {
      ctx.save();
      ctx.shadowColor = '#ff7030';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(255,140,60,0.85)';
      ctx.beginPath();
      ctx.arc(cx, bottomY, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }
    return;

    /* Legacy unreachable code below */
    if (false) {
      /* Shank */
      ctx.fillStyle = '#37474f';
      ctx.strokeStyle = '#546e7a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - shankW, topY, shankW * 2, bodyTop - topY);
      ctx.fill(); ctx.stroke();

      /* Fluted body */
      var grad = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      grad.addColorStop(0, '#455a64');
      grad.addColorStop(0.5, '#607d8b');
      grad.addColorStop(1, '#455a64');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      ctx.fill(); ctx.stroke();

      /* Flute lines (animated) */
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      ctx.clip();
      ctx.strokeStyle = 'rgba(0,191,165,0.35)';
      ctx.lineWidth = 1.5;
      for (var fi = 0; fi < numTeeth; fi++) {
        var off = (fi / numTeeth) * w + (angle * w / (Math.PI * 2)) % w;
        var sx = cx - halfW + (off % w);
        ctx.beginPath(); ctx.moveTo(sx, bodyTop); ctx.lineTo(sx - w * 0.3, bottomY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx + w, bodyTop); ctx.lineTo(sx + w - w * 0.3, bottomY); ctx.stroke();
      }
      ctx.restore();

      /* Bottom cutting edge */
      ctx.fillStyle = '#00bfa5';
      ctx.fillRect(cx - halfW, bottomY - 2, w, 3);

    } else if (cutterType === 'facemill') {
      /* Arbor */
      ctx.fillStyle = '#37474f';
      ctx.strokeStyle = '#546e7a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - shankW, topY, shankW * 2, bodyTop - topY);
      ctx.fill(); ctx.stroke();

      /* Wide body */
      var bodyH = bottomY - bodyTop;
      var grad = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      grad.addColorStop(0, '#37474f');
      grad.addColorStop(0.3, '#546e7a');
      grad.addColorStop(0.7, '#546e7a');
      grad.addColorStop(1, '#37474f');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - halfW, bodyTop, w, bodyH);
      ctx.fill(); ctx.stroke();

      /* Body detail line */
      ctx.strokeStyle = 'rgba(0,191,165,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - halfW, bodyTop + bodyH * 0.5);
      ctx.lineTo(cx + halfW, bodyTop + bodyH * 0.5);
      ctx.stroke();

      /* Insert pockets on bottom (yellow triangles) */
      var numIns = Math.max(2, Math.min(numTeeth, Math.floor(w / 14)));
      var spacing = w / (numIns + 1);
      for (var ii = 0; ii < numIns; ii++) {
        var ix = cx - halfW + spacing * (ii + 1) + Math.sin(angle + ii) * 2;
        ctx.beginPath();
        ctx.moveTo(ix - 5, bottomY - 1);
        ctx.lineTo(ix, bottomY + 5);
        ctx.lineTo(ix + 5, bottomY - 1);
        ctx.closePath();
        ctx.fillStyle = '#f5c842';
        ctx.fill();
        ctx.strokeStyle = '#c49b00';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

    } else { /* slotdrill */
      /* Shank */
      ctx.fillStyle = '#37474f';
      ctx.strokeStyle = '#546e7a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - shankW, topY, shankW * 2, bodyTop - topY);
      ctx.fill(); ctx.stroke();

      /* Fluted body */
      var grad = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
      grad.addColorStop(0, '#455a64');
      grad.addColorStop(0.5, '#607d8b');
      grad.addColorStop(1, '#455a64');
      ctx.fillStyle = grad;
      ctx.strokeStyle = '#78909c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      ctx.fill(); ctx.stroke();

      /* 2 wide flute lines */
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - halfW, bodyTop, w, bottomY - bodyTop);
      ctx.clip();
      ctx.strokeStyle = 'rgba(0,191,165,0.45)';
      ctx.lineWidth = 2.5;
      for (var si = 0; si < 2; si++) {
        var off = (si / 2) * w + (angle * w / (Math.PI * 2)) % w;
        var sx = cx - halfW + (off % w);
        ctx.beginPath(); ctx.moveTo(sx, bodyTop); ctx.lineTo(sx - w * 0.4, bottomY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sx + w, bodyTop); ctx.lineTo(sx + w - w * 0.4, bottomY); ctx.stroke();
      }
      ctx.restore();

      /* Center-cutting V-tip */
      ctx.beginPath();
      ctx.moveTo(cx - halfW, bottomY);
      ctx.lineTo(cx, bottomY + 4);
      ctx.lineTo(cx + halfW, bottomY);
      ctx.closePath();
      ctx.fillStyle = '#00bfa5';
      ctx.fill();
    }
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate() {
    var dt = 1 / 60;

    /* Rotate cutter when active */
    if (millState !== 'idle' && millState !== 'done') {
      angle += (spindle / 60) * Math.PI * 2 * dt * 0.08;
      if (angle > Math.PI * 200) angle -= Math.PI * 200;
    }

    /* Milling state machine */
    switch (millState) {
      case 'descend':
        toolNormY += 0.025;
        if (toolNormY >= 1) { toolNormY = 1; millState = 'milling'; }
        break;

      case 'milling':
        var feedNorm = 0.003 * (feedRate / 300);
        feedNorm = Math.max(feedNorm, 0.0008);
        feedNorm = Math.min(feedNorm, 0.012);
        toolNormX += feedNorm;

        /* Update cut profile — remove material under cutter */
        var cutWidthNorm = cutterDia / 200;
        if (cutterType === 'facemill') cutWidthNorm = cutterDia / 130;
        cutWidthNorm = Math.min(cutWidthNorm, 0.35);
        var leftSeg = Math.floor((toolNormX - cutWidthNorm / 2) * PROFILE_RES);
        var rightSeg = Math.ceil((toolNormX + cutWidthNorm / 2) * PROFILE_RES);
        for (var s = Math.max(0, leftSeg); s < Math.min(PROFILE_RES, rightSeg); s++) {
          cutProfile[s] = depthOfCut;
        }

        /* Spawn chip particles */
        if (toolNormX > 0 && toolNormX < 1 && Math.random() > 0.35) {
          var cpWpX = canvas.width * 0.08;
          var cpWpW = canvas.width * 0.84;
          var cpWpY = canvas.height * 0.52;
          var cpMatColor = MAT_PROPS[material].color;
          chipParticles.push({
            x: cpWpX + toolNormX * cpWpW + (Math.random() - 0.5) * 10,
            y: cpWpY - 5,
            vx: (Math.random() - 0.2) * 3,
            vy: -Math.random() * 3 - 1,
            life: 25 + Math.random() * 20,
            size: 1.5 + Math.random() * 2.5,
            color: cpMatColor
          });
        }

        if (toolNormX > 1.08) { millState = 'retract'; }
        break;

      case 'retract':
        toolNormY -= 0.03;
        if (toolNormY <= 0) { toolNormY = 0; millState = 'done'; }
        break;
    }

    /* Update chip particles */
    for (var ci = chipParticles.length - 1; ci >= 0; ci--) {
      var cp = chipParticles[ci];
      cp.x += cp.vx;
      cp.y += cp.vy;
      cp.vy += 0.12;
      cp.life--;
      if (cp.life <= 0) chipParticles.splice(ci, 1);
    }

    draw();
    updateReadouts();

    if (mode === 'simulate') {
      animId = requestAnimationFrame(animate);
    }
  }

  function startAnim() {
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(animate);
  }

  function stopAnim() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(m);
  });

  function switchMode(m) {
    mode = m;
    stopAnim();

    /* Hide all */
    var canvasCard = canvas.parentElement;
    canvasCard.style.display = 'none';
    simPanel.style.display = 'none';
    catRow.style.display = 'none';
    itemSelector.style.display = 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';

    if (m === 'simulate') {
      canvasCard.style.display = '';
      simPanel.style.display = '';
      startAnim();
    } else if (m === 'explore') {
      catRow.style.display = '';
      itemSelector.style.display = '';
      renderExplore();
    } else if (m === 'practice') {
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      if (!practiceQ) newPractice();
    } else if (m === 'quiz') {
      startQuiz();
    }
  }

  /* ================================================================
     SLIDER EVENTS
     ================================================================ */

  function bindSlider(slider, valEl, fmt, update) {
    slider.addEventListener('input', function () {
      update(parseFloat(slider.value));
      syncSliderLabels();
    });
  }

  bindSlider(speedSlider, speedVal, null, function (v) { spindle = v; });
  bindSlider(feedSlider,  feedVal,  null, function (v) { feedRate = v; });
  bindSlider(docSlider,   docVal,   null, function (v) { depthOfCut = v; });
  bindSlider(diaSlider,   diaVal,   null, function (v) { cutterDia = v; });
  bindSlider(teethSlider, teethVal, null, function (v) { numTeeth = v; });

  /* Unit toggle — display only */
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

  /* Cutter type tabs */
  document.getElementById('cutter-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    cutterType = e.target.dataset.type;
    document.querySelectorAll('#cutter-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
  });

  /* Material tabs */
  document.getElementById('material-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    material = e.target.dataset.mat;
    document.querySelectorAll('#material-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
  });

  /* Start Milling button */
  document.getElementById('btn-start-mill').addEventListener('click', function () {
    if (millState === 'descend' || millState === 'milling' || millState === 'retract') return;
    resetMill();
    millState = 'descend';
  });

  /* Reset button */
  document.getElementById('btn-reset-mill').addEventListener('click', function () {
    resetMill();
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
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
    var catLabels = { fundamentals: 'Fundamentals', cutters: 'Cutter Types', operations: 'Operations' };
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + catLabels[c.cat] + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>';

    /* Worked example */
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

  function newPractice() {
    var idx = randInt(0, PROBLEM_GEN.length - 1);
    practiceQ = PROBLEM_GEN[idx]();
    practiceChecked = false;
    ppPrompt.textContent = practiceQ.prompt;
    ppUnit.textContent = practiceQ.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppShowSol.style.display = '';
    ppNext.style.display = 'none';
    ppCheck.disabled = false;
    ppInput.focus();
  }

  ppCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });

  function checkPractice() {
    if (practiceChecked || !practiceQ) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Enter a number.'; ppFeedback.className = 'feedback err'; return; }

    practiceChecked = true;
    practiceTotal++;
    var tol = practiceQ.tol || Math.abs(practiceQ.answer) * 0.02;
    var correct = Math.abs(val - practiceQ.answer) <= tol;

    if (correct) {
      practiceScore++;
      ppFeedback.textContent = '\u2714 Correct! ' + practiceQ.answer + ' ' + practiceQ.unit;
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '\u2718 Incorrect. Answer: ' + practiceQ.answer + ' ' + practiceQ.unit;
      ppFeedback.className = 'feedback err';
    }

    ppInput.disabled = true;
    ppCheck.disabled = true;
    ppNext.style.display = '';
    ppShowSol.style.display = 'none';
    showSolution();
    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;
  }

  ppShowSol.addEventListener('click', function () {
    showSolution();
    ppShowSol.style.display = 'none';
  });

  function showSolution() {
    if (!practiceQ) return;
    ppSolution.style.display = '';
    var html = '<h4>Step-by-Step Solution</h4>';
    practiceQ.steps.forEach(function (s) {
      html += '<p class="sol-step">\u2192 <strong>' + s + '</strong></p>';
    });
    ppSolution.innerHTML = html;
  }

  ppNext.addEventListener('click', function () { newPractice(); });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  function startQuiz() {
    quizScore = 0;
    quizIdx = 0;
    quizResults = [];
    quizAnswered = false;

    /* Shuffle and pick QUIZ_SIZE */
    var pool = QUIZ_POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    quizSet = pool.slice(0, QUIZ_SIZE);

    quizPanel.style.display = '';
    quizBar.style.display = '';
    quizResult.style.display = 'none';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, oi) {
        html += '<button class="answer-btn" data-idx="' + oi + '">' + opt + '</button>';
      });
      html += '</div>';
      html += '<div style="margin-top:10px;"><span class="quiz-feedback" id="quiz-fb"></span></div>';
      html += '<div style="margin-top:10px;"><button class="btn btn-primary" id="quiz-next" style="display:none;">Next \u2192</button></div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="quiz-num-input" type="number" step="any" placeholder="Your answer">';
      html += '<span class="qi-unit">' + q.unit + '</span>';
      html += '<button class="btn btn-primary" id="quiz-submit">Submit</button>';
      html += '</div>';
      html += '<div style="margin-top:10px;"><span class="quiz-feedback" id="quiz-fb"></span></div>';
      html += '<div style="margin-top:10px;"><button class="btn btn-primary" id="quiz-next" style="display:none;">Next \u2192</button></div>';
    }

    quizPanel.innerHTML = html;

    /* Bind events */
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var idx = parseInt(btn.dataset.idx);
          var correct = idx === q.correct;

          quizPanel.querySelectorAll('.answer-btn').forEach(function (b, bi) {
            b.classList.add('locked');
            if (bi === q.correct) b.classList.add('correct');
            if (bi === idx && !correct) b.classList.add('wrong');
          });

          var fb = document.getElementById('quiz-fb');
          if (correct) {
            quizScore++;
            fb.textContent = '\u2714 Correct!';
            fb.className = 'quiz-feedback ok';
          } else {
            fb.textContent = '\u2718 Wrong. Answer: ' + q.options[q.correct];
            fb.className = 'quiz-feedback err';
          }

          quizResults.push({ prompt: q.prompt, correct: correct, given: q.options[idx], expected: q.options[q.correct] });
          document.getElementById('quiz-next').style.display = '';
        });
      });
    } else {
      var submitBtn = document.getElementById('quiz-submit');
      var numInput = document.getElementById('quiz-num-input');

      function submitNumeric() {
        if (quizAnswered) return;
        var val = parseFloat(numInput.value);
        if (isNaN(val)) return;
        quizAnswered = true;

        var tol = q.tol || Math.abs(q.answer) * 0.02;
        var correct = Math.abs(val - q.answer) <= tol;

        var fb = document.getElementById('quiz-fb');
        if (correct) {
          quizScore++;
          fb.textContent = '\u2714 Correct! ' + q.answer + ' ' + q.unit;
          fb.className = 'quiz-feedback ok';
        } else {
          fb.textContent = '\u2718 Wrong. Answer: ' + q.answer + ' ' + q.unit;
          fb.className = 'quiz-feedback err';
        }

        numInput.disabled = true;
        submitBtn.disabled = true;
        quizResults.push({ prompt: q.prompt, correct: correct, given: val + ' ' + q.unit, expected: q.answer + ' ' + q.unit });
        document.getElementById('quiz-next').style.display = '';
      }

      submitBtn.addEventListener('click', submitNumeric);
      numInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitNumeric(); });
    }

    /* Next button */
    setTimeout(function () {
      var nextBtn = document.getElementById('quiz-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          quizIdx++;
          if (quizIdx >= QUIZ_SIZE) {
            showQuizResult();
          } else {
            renderQuizQuestion();
          }
        });
      }
    }, 0);
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var starClass, stars, verdict;
    if (pct === 1) { starClass = 'perfect'; stars = '\u2605\u2605\u2605'; verdict = 'Perfect Score!'; }
    else if (pct >= 0.6) { starClass = 'good'; stars = '\u2605\u2605'; verdict = 'Good Job!'; }
    else { starClass = 'poor'; stars = '\u2605'; verdict = 'Keep Practicing'; }

    var html = '<div class="qr-header">';
    html += '<div class="qr-title-wrap"><span class="qr-title">Quiz Complete!</span><span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + starClass + '">' + quizScore + '/' + QUIZ_SIZE + '</span><div class="qr-verdict">' + verdict + '</div></div>';
    html += '</div>';
    html += '<div class="qr-rows">';

    quizResults.forEach(function (r, i) {
      html += '<div class="qr-row ' + (r.correct ? 'ok' : 'err') + '">';
      html += '<span class="qr-qnum">Q' + (i + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + (r.correct ? r.expected : r.given) + '</strong> ' + (r.correct ? '' : '(Correct: ' + r.expected + ')') + '</span>';
      html += '<span class="qr-mark">' + (r.correct ? '\u2714' : '\u2718') + '</span>';
      html += '</div>';
    });

    html += '</div>';
    html += '<button class="btn btn-primary" id="btn-new-quiz" style="margin-top:12px;">New Quiz</button>';

    quizResult.innerHTML = html;

    document.getElementById('btn-new-quiz').addEventListener('click', function () {
      quizResult.style.display = 'none';
      startQuiz();
    });
  }

  /* ================================================================
     INITIALIZATION
     ================================================================ */

  startAnim();

})();
