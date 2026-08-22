(function () {
  'use strict';

  /* ================================================================
     EXPLORE DATA — 14 concept cards across 4 categories
     ================================================================ */

  var CONCEPTS = [
    /* ── Fundamentals ─────────────────────────────────────────────── */
    {
      id: 'bore-area', name: 'Bore Area', symbol: 'A\u2080',
      formula: 'A_bore = \u03C0/4 \u00D7 D\u00B2', unit: 'mm\u00B2',
      cat: 'fundamentals',
      desc: 'The bore area is the full cross-sectional area of the cylinder bore. It determines the extend force: F_ext = P \u00D7 A_bore. Larger bore diameters produce proportionally more force at the same pressure because area scales with the square of diameter.',
      example: { problem: 'A cylinder has a bore diameter of 80 mm. Calculate the bore area.', steps: ['Given: D = 80 mm', 'A = \u03C0/4 \u00D7 D\u00B2', 'A = \u03C0/4 \u00D7 80\u00B2', 'A = \u03C0/4 \u00D7 6400', 'A = 5026.5 mm\u00B2'], answer: 5026.5, unit: 'mm\u00B2' }
    },
    {
      id: 'annular-area', name: 'Annular Area', symbol: 'A_ann',
      formula: 'A_ann = \u03C0/4 \u00D7 (D\u00B2 \u2212 d\u00B2)', unit: 'mm\u00B2',
      cat: 'fundamentals',
      desc: 'The annular area is the ring-shaped area on the rod side of the piston (bore area minus rod area). It determines the retract force. Because the rod occupies part of the bore, the annular area is always less than the bore area.',
      example: { problem: 'Bore D = 100 mm, rod d = 56 mm. Find annular area.', steps: ['Given: D = 100 mm, d = 56 mm', 'A_ann = \u03C0/4 \u00D7 (D\u00B2 \u2212 d\u00B2)', 'A_ann = \u03C0/4 \u00D7 (10000 \u2212 3136)', 'A_ann = \u03C0/4 \u00D7 6864', 'A_ann = 5390.6 mm\u00B2'], answer: 5390.6, unit: 'mm\u00B2' }
    },
    {
      id: 'extend-force', name: 'Extend Force', symbol: 'F_ext',
      formula: 'F_ext = P \u00D7 A_bore', unit: 'N',
      cat: 'fundamentals',
      desc: 'The extend (push) force is produced when pressurised oil enters the cap-end port and acts on the full bore area. This is the maximum force the cylinder can produce. Extend force = system pressure \u00D7 bore area.',
      example: { problem: 'Bore D = 63 mm, pressure = 20 MPa. Calculate extend force.', steps: ['A_bore = \u03C0/4 \u00D7 63\u00B2 = 3117.2 mm\u00B2', 'Convert: A = 3117.2 \u00D7 10\u207B\u2076 = 0.003117 m\u00B2', 'F = P \u00D7 A = 20\u00D710\u2076 \u00D7 0.003117', 'F = 62,345 N \u2248 62.3 kN'], answer: 62.3, unit: 'kN' }
    },
    {
      id: 'retract-force', name: 'Retract Force', symbol: 'F_ret',
      formula: 'F_ret = P \u00D7 A_annular', unit: 'N',
      cat: 'fundamentals',
      desc: 'The retract (pull) force is produced when oil enters the rod-end port and acts on the annular area. It is always less than the extend force because the rod reduces the effective area. The ratio F_ret/F_ext equals A_ann/A_bore.',
      example: { problem: 'Bore 63 mm, rod 36 mm, pressure 20 MPa. Find retract force.', steps: ['A_ann = \u03C0/4 \u00D7 (63\u00B2 \u2212 36\u00B2) = \u03C0/4 \u00D7 (3969 \u2212 1296)', 'A_ann = \u03C0/4 \u00D7 2673 = 2099.0 mm\u00B2', 'A_ann = 0.002099 m\u00B2', 'F = 20\u00D710\u2076 \u00D7 0.002099 = 41,982 N \u2248 42.0 kN'], answer: 42.0, unit: 'kN' }
    },

    /* ── Cylinder Types ───────────────────────────────────────────── */
    {
      id: 'double-acting', name: 'Double-Acting Cylinder', symbol: 'DA',
      formula: 'F_ext = P\u00D7A_bore, F_ret = P\u00D7A_ann', unit: '\u2014',
      cat: 'types',
      desc: 'A double-acting cylinder uses hydraulic pressure on both sides of the piston to produce force in both extend and retract directions. It is the most common industrial type. Oil enters the cap end to extend and the rod end to retract.',
      example: { problem: 'DA cylinder: bore 80 mm, rod 45 mm, pressure 16 MPa. Find both forces.', steps: ['A_bore = \u03C0/4 \u00D7 80\u00B2 = 5026.5 mm\u00B2', 'A_ann = \u03C0/4 \u00D7 (6400 \u2212 2025) = 3436.3 mm\u00B2', 'F_ext = 16 \u00D7 5026.5 \u00D7 10\u207B\u00B3 = 80.4 kN', 'F_ret = 16 \u00D7 3436.3 \u00D7 10\u207B\u00B3 = 55.0 kN'], answer: 80.4, unit: 'kN' }
    },
    {
      id: 'single-acting', name: 'Single-Acting Cylinder', symbol: 'SA',
      formula: 'F_ext = P\u00D7A_bore (spring return)', unit: '\u2014',
      cat: 'types',
      desc: 'A single-acting cylinder has hydraulic pressure on one side only. The return stroke relies on a spring, gravity, or an external load. Simpler and cheaper than double-acting, used where force is needed in one direction only (e.g. hydraulic jacks, log splitters).',
      example: { problem: 'SA cylinder: bore 50 mm, pressure 10 MPa. Spring force = 200 N. Find net extend force.', steps: ['A_bore = \u03C0/4 \u00D7 50\u00B2 = 1963.5 mm\u00B2', 'F_hydraulic = 10 \u00D7 1963.5 \u00D7 10\u207B\u00B3 = 19.6 kN', 'F_net = 19635 \u2212 200 = 19435 N', 'F_net \u2248 19.4 kN'], answer: 19.4, unit: 'kN' }
    },
    {
      id: 'telescopic', name: 'Telescopic Cylinder', symbol: 'Tele',
      formula: 'Stroke_total = \u03A3 stage strokes', unit: '\u2014',
      cat: 'types',
      desc: 'A telescopic cylinder has multiple nested stages that extend sequentially. This provides a very long stroke from a compact retracted length. Common on dump trucks, cranes, and aerial platforms. Each stage has a different bore area, so the force changes as stages extend.',
      example: { problem: '3-stage telescopic: bore stages 120, 100, 80 mm. Each 400 mm stroke. Total extension?', steps: ['Stage 1: 400 mm', 'Stage 2: 400 mm', 'Stage 3: 400 mm', 'Total stroke = 400 + 400 + 400 = 1200 mm'], answer: 1200, unit: 'mm' }
    },
    {
      id: 'area-ratio', name: 'Area Ratio', symbol: '\u03C6',
      formula: '\u03C6 = A_bore / A_annular', unit: '\u2014',
      cat: 'types',
      desc: 'The area ratio (\u03C6) describes the relationship between bore and annular areas. It determines the speed and force differential between extend and retract. A common ratio is 2:1 (rod diameter \u2248 0.707 \u00D7 bore). Higher ratios mean larger speed differences.',
      example: { problem: 'Bore 100 mm, rod 70 mm. Calculate area ratio.', steps: ['A_bore = \u03C0/4 \u00D7 100\u00B2 = 7854.0 mm\u00B2', 'A_ann = \u03C0/4 \u00D7 (10000 \u2212 4900) = 4003.5 mm\u00B2', '\u03C6 = 7854.0 / 4003.5', '\u03C6 = 1.96 \u2248 2:1'], answer: 1.96, unit: '' }
    },

    /* ── Sizing ───────────────────────────────────────────────────── */
    {
      id: 'piston-speed', name: 'Piston Speed', symbol: 'v',
      formula: 'v = Q / A', unit: 'mm/s',
      cat: 'sizing',
      desc: 'Piston speed is determined by the flow rate of oil entering the cylinder divided by the effective piston area. Extend speed uses bore area; retract speed uses annular area. Since annular area is smaller, retract speed is always faster than extend speed for the same flow rate.',
      example: { problem: 'Flow rate = 40 L/min, bore area = 5026.5 mm\u00B2. Find extend speed.', steps: ['Q = 40 L/min = 40 \u00D7 10\u00B3 / 60 cm\u00B3/s = 666.7 cm\u00B3/s', 'Q = 666667 mm\u00B3/s', 'v = Q / A = 666667 / 5026.5', 'v = 132.6 mm/s'], answer: 132.6, unit: 'mm/s' }
    },
    {
      id: 'flow-rate', name: 'Flow Rate', symbol: 'Q',
      formula: 'Q = A \u00D7 v', unit: 'L/min',
      cat: 'sizing',
      desc: 'The required flow rate depends on the desired piston speed and the effective area. Q = A \u00D7 v. For a given speed requirement, a larger bore demands a higher flow rate, which in turn requires a larger pump and more hydraulic power.',
      example: { problem: 'Required extend speed = 200 mm/s, bore = 63 mm. Find flow rate.', steps: ['A_bore = \u03C0/4 \u00D7 63\u00B2 = 3117.2 mm\u00B2', 'Q = A \u00D7 v = 3117.2 \u00D7 200 = 623449 mm\u00B3/s', 'Q = 623.4 cm\u00B3/s', 'Q = 623.4 \u00D7 60 / 1000 = 37.4 L/min'], answer: 37.4, unit: 'L/min' }
    },
    {
      id: 'volume-stroke', name: 'Volume per Stroke', symbol: 'V',
      formula: 'V = A \u00D7 L', unit: 'cm\u00B3',
      cat: 'sizing',
      desc: 'The volume of oil required for one full stroke equals the effective piston area multiplied by the stroke length. This determines oil tank sizing, pump capacity, and cycle time calculations.',
      example: { problem: 'Bore 80 mm, stroke 500 mm. Find volume per extend stroke.', steps: ['A_bore = \u03C0/4 \u00D7 80\u00B2 = 5026.5 mm\u00B2', 'V = A \u00D7 L = 5026.5 \u00D7 500', 'V = 2,513,274 mm\u00B3', 'V = 2513.3 cm\u00B3 = 2.51 L'], answer: 2.51, unit: 'L' }
    },

    /* ── System Design ────────────────────────────────────────────── */
    {
      id: 'pump-power', name: 'Pump Power', symbol: 'P_hyd',
      formula: 'P = p \u00D7 Q / (60 \u00D7 \u03B7)', unit: 'kW',
      cat: 'system',
      desc: 'Hydraulic power is the product of pressure and flow rate. The required pump input power must account for overall system efficiency (\u03B7), which includes volumetric, mechanical, and pipeline losses. Typical overall efficiency ranges from 0.75 to 0.90.',
      example: { problem: 'Pressure 16 MPa, flow 40 L/min, efficiency 85%. Find pump power.', steps: ['P = p \u00D7 Q / (60 \u00D7 \u03B7)', 'P = 16 \u00D7 40 / (60 \u00D7 0.85)', 'P = 640 / 51', 'P = 12.55 kW'], answer: 12.55, unit: 'kW' }
    },
    {
      id: 'rod-buckling', name: 'Rod Buckling (Euler)', symbol: 'P_cr',
      formula: 'P_cr = \u03C0\u00B2EI / L\u00B2', unit: 'N',
      cat: 'system',
      desc: 'When a cylinder pushes a load, the rod is in compression. Long, slender rods can buckle before reaching yield stress. The Euler critical load depends on modulus of elasticity (E = 210 GPa for steel), second moment of area (I = \u03C0d\u2074/64), and free length (L). A safety factor of 3.5\u20135 is typical.',
      example: { problem: 'Rod d = 40 mm, stroke L = 800 mm, E = 210 GPa. Find critical buckling load.', steps: ['I = \u03C0 \u00D7 40\u2074 / 64 = \u03C0 \u00D7 2560000 / 64 = 125664 mm\u2074', 'P_cr = \u03C0\u00B2 \u00D7 210000 \u00D7 125664 / 800\u00B2', 'P_cr = 9.8696 \u00D7 210000 \u00D7 125664 / 640000', 'P_cr = 406,717 N \u2248 406.7 kN'], answer: 406.7, unit: 'kN' }
    },
    {
      id: 'pressure-drop', name: 'Pressure Drop', symbol: '\u0394P',
      formula: '\u0394P = f \u00D7 (L/D) \u00D7 (\u03C1v\u00B2/2)', unit: 'kPa',
      cat: 'system',
      desc: 'Pressure drop in hydraulic lines reduces the effective pressure at the cylinder. It depends on fluid velocity, line length, internal diameter, and friction factor. Minimising pressure drop requires adequately sized hoses, smooth fittings, and limiting flow velocity to 3\u20136 m/s.',
      example: { problem: 'Oil velocity 4 m/s, \u03C1 = 870 kg/m\u00B3, hose L = 3 m, D = 19 mm, f = 0.03.', steps: ['\u0394P = f \u00D7 (L/D) \u00D7 (\u03C1v\u00B2/2)', '\u0394P = 0.03 \u00D7 (3/0.019) \u00D7 (870 \u00D7 16 / 2)', '\u0394P = 0.03 \u00D7 157.9 \u00D7 6960', '\u0394P = 32,971 Pa \u2248 33.0 kPa'], answer: 33.0, unit: 'kPa' }
    }
  ];

  /* ================================================================
     PRACTICE — 12 problem generators
     ================================================================ */

  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function roundN(val, n) { return Math.round(val * Math.pow(10, n)) / Math.pow(10, n); }

  var STD_BORE = [25, 32, 40, 50, 63, 80, 100, 125, 160, 200];
  var STD_ROD  = [16, 20, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80];

  function pickBoreRod() {
    var bore = randChoice(STD_BORE);
    var validRods = STD_ROD.filter(function (r) { return r < bore * 0.85; });
    if (validRods.length === 0) validRods = [Math.round(bore * 0.5)];
    var rod = randChoice(validRods);
    return { bore: bore, rod: rod };
  }

  var PRACTICE_GENERATORS = [
    function genBoreArea() {
      var bore = randChoice(STD_BORE);
      var area = roundN(Math.PI / 4 * bore * bore, 1);
      return {
        prompt: 'Calculate the bore area of a hydraulic cylinder with bore diameter D = ' + bore + ' mm.',
        answer: area, unit: 'mm\u00B2', tolerance: 1,
        steps: ['A = \u03C0/4 \u00D7 D\u00B2', 'A = \u03C0/4 \u00D7 ' + bore + '\u00B2', 'A = \u03C0/4 \u00D7 ' + (bore * bore), 'A = ' + area + ' mm\u00B2']
      };
    },
    function genAnnularArea() {
      var br = pickBoreRod();
      var area = roundN(Math.PI / 4 * (br.bore * br.bore - br.rod * br.rod), 1);
      return {
        prompt: 'Find the annular area. Bore D = ' + br.bore + ' mm, rod d = ' + br.rod + ' mm.',
        answer: area, unit: 'mm\u00B2', tolerance: 1,
        steps: ['A_ann = \u03C0/4 \u00D7 (D\u00B2 \u2212 d\u00B2)', 'A_ann = \u03C0/4 \u00D7 (' + (br.bore * br.bore) + ' \u2212 ' + (br.rod * br.rod) + ')', 'A_ann = \u03C0/4 \u00D7 ' + (br.bore * br.bore - br.rod * br.rod), 'A_ann = ' + area + ' mm\u00B2']
      };
    },
    function genExtendForce() {
      var bore = randChoice(STD_BORE);
      var pressureMPa = randChoice([10, 12, 14, 16, 18, 20, 25]);
      var areaM2 = Math.PI / 4 * Math.pow(bore / 1000, 2);
      var forceKN = roundN(pressureMPa * 1e6 * areaM2 / 1000, 1);
      return {
        prompt: 'Bore D = ' + bore + ' mm, pressure = ' + pressureMPa + ' MPa. Calculate the extend force in kN.',
        answer: forceKN, unit: 'kN', tolerance: 0.2,
        steps: ['A_bore = \u03C0/4 \u00D7 (' + bore + '/1000)\u00B2 = ' + roundN(areaM2, 6) + ' m\u00B2', 'F = P \u00D7 A = ' + pressureMPa + '\u00D710\u2076 \u00D7 ' + roundN(areaM2, 6), 'F = ' + roundN(forceKN * 1000, 0) + ' N', 'F = ' + forceKN + ' kN']
      };
    },
    function genRetractForce() {
      var br = pickBoreRod();
      var pressureMPa = randChoice([10, 14, 16, 20, 25]);
      var annM2 = Math.PI / 4 * (Math.pow(br.bore / 1000, 2) - Math.pow(br.rod / 1000, 2));
      var forceKN = roundN(pressureMPa * 1e6 * annM2 / 1000, 1);
      return {
        prompt: 'Bore = ' + br.bore + ' mm, rod = ' + br.rod + ' mm, pressure = ' + pressureMPa + ' MPa. Find retract force in kN.',
        answer: forceKN, unit: 'kN', tolerance: 0.2,
        steps: ['A_ann = \u03C0/4 \u00D7 ((' + br.bore + '/1000)\u00B2 \u2212 (' + br.rod + '/1000)\u00B2)', 'A_ann = ' + roundN(annM2, 6) + ' m\u00B2', 'F = ' + pressureMPa + '\u00D710\u2076 \u00D7 ' + roundN(annM2, 6), 'F = ' + forceKN + ' kN']
      };
    },
    function genExtendSpeed() {
      var bore = randChoice(STD_BORE);
      var flowLPM = randChoice([20, 30, 40, 50, 60, 80]);
      var areaMM2 = Math.PI / 4 * bore * bore;
      var flowMM3s = flowLPM * 1e6 / 60;
      var speed = roundN(flowMM3s / areaMM2, 1);
      return {
        prompt: 'Bore D = ' + bore + ' mm, flow rate Q = ' + flowLPM + ' L/min. Calculate extend speed in mm/s.',
        answer: speed, unit: 'mm/s', tolerance: 1,
        steps: ['A_bore = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + roundN(areaMM2, 1) + ' mm\u00B2', 'Q = ' + flowLPM + ' L/min = ' + roundN(flowMM3s, 0) + ' mm\u00B3/s', 'v = Q / A = ' + roundN(flowMM3s, 0) + ' / ' + roundN(areaMM2, 1), 'v = ' + speed + ' mm/s']
      };
    },
    function genRetractSpeed() {
      var br = pickBoreRod();
      var flowLPM = randChoice([20, 30, 40, 50, 60]);
      var annMM2 = Math.PI / 4 * (br.bore * br.bore - br.rod * br.rod);
      var flowMM3s = flowLPM * 1e6 / 60;
      var speed = roundN(flowMM3s / annMM2, 1);
      return {
        prompt: 'Bore = ' + br.bore + ' mm, rod = ' + br.rod + ' mm, flow = ' + flowLPM + ' L/min. Find retract speed in mm/s.',
        answer: speed, unit: 'mm/s', tolerance: 1,
        steps: ['A_ann = \u03C0/4 \u00D7 (' + (br.bore * br.bore) + ' \u2212 ' + (br.rod * br.rod) + ') = ' + roundN(annMM2, 1) + ' mm\u00B2', 'Q = ' + roundN(flowMM3s, 0) + ' mm\u00B3/s', 'v = ' + roundN(flowMM3s, 0) + ' / ' + roundN(annMM2, 1), 'v = ' + speed + ' mm/s']
      };
    },
    function genFlowRate() {
      var bore = randChoice(STD_BORE);
      var speedMMs = randChoice([100, 150, 200, 250, 300]);
      var areaMM2 = Math.PI / 4 * bore * bore;
      var flowMM3s = areaMM2 * speedMMs;
      var flowLPM = roundN(flowMM3s * 60 / 1e6, 1);
      return {
        prompt: 'Bore = ' + bore + ' mm, desired extend speed = ' + speedMMs + ' mm/s. Find required flow rate in L/min.',
        answer: flowLPM, unit: 'L/min', tolerance: 0.5,
        steps: ['A_bore = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + roundN(areaMM2, 1) + ' mm\u00B2', 'Q = A \u00D7 v = ' + roundN(areaMM2, 1) + ' \u00D7 ' + speedMMs + ' = ' + roundN(flowMM3s, 0) + ' mm\u00B3/s', 'Q = ' + roundN(flowMM3s, 0) + ' \u00D7 60 / 10\u2076', 'Q = ' + flowLPM + ' L/min']
      };
    },
    function genPower() {
      var pressureMPa = randChoice([10, 14, 16, 20, 25]);
      var flowLPM = randChoice([20, 30, 40, 50, 60, 80]);
      var eff = randChoice([80, 85, 90]) / 100;
      var power = roundN(pressureMPa * flowLPM / (60 * eff), 2);
      return {
        prompt: 'Pressure = ' + pressureMPa + ' MPa, flow = ' + flowLPM + ' L/min, efficiency = ' + (eff * 100) + '%. Find pump power in kW.',
        answer: power, unit: 'kW', tolerance: 0.1,
        steps: ['P = p \u00D7 Q / (60 \u00D7 \u03B7)', 'P = ' + pressureMPa + ' \u00D7 ' + flowLPM + ' / (60 \u00D7 ' + eff + ')', 'P = ' + (pressureMPa * flowLPM) + ' / ' + roundN(60 * eff, 1), 'P = ' + power + ' kW']
      };
    },
    function genVolumeStroke() {
      var bore = randChoice(STD_BORE);
      var strokeMM = randChoice([200, 300, 400, 500, 600, 800, 1000]);
      var areaMM2 = Math.PI / 4 * bore * bore;
      var volL = roundN(areaMM2 * strokeMM / 1e6, 2);
      return {
        prompt: 'Bore = ' + bore + ' mm, stroke = ' + strokeMM + ' mm. Calculate extend volume per stroke in litres.',
        answer: volL, unit: 'L', tolerance: 0.05,
        steps: ['A_bore = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + roundN(areaMM2, 1) + ' mm\u00B2', 'V = A \u00D7 L = ' + roundN(areaMM2, 1) + ' \u00D7 ' + strokeMM, 'V = ' + roundN(areaMM2 * strokeMM, 0) + ' mm\u00B3', 'V = ' + volL + ' L']
      };
    },
    function genAreaRatio() {
      var br = pickBoreRod();
      var aBore = Math.PI / 4 * br.bore * br.bore;
      var aAnn = Math.PI / 4 * (br.bore * br.bore - br.rod * br.rod);
      var ratio = roundN(aBore / aAnn, 2);
      return {
        prompt: 'Bore = ' + br.bore + ' mm, rod = ' + br.rod + ' mm. Calculate the area ratio (A_bore / A_annular).',
        answer: ratio, unit: '', tolerance: 0.05,
        steps: ['A_bore = \u03C0/4 \u00D7 ' + br.bore + '\u00B2 = ' + roundN(aBore, 1), 'A_ann = \u03C0/4 \u00D7 (' + (br.bore * br.bore) + ' \u2212 ' + (br.rod * br.rod) + ') = ' + roundN(aAnn, 1), '\u03C6 = ' + roundN(aBore, 1) + ' / ' + roundN(aAnn, 1), '\u03C6 = ' + ratio]
      };
    },
    function genBuckling() {
      var rod = randChoice([25, 32, 36, 40, 45, 50, 56, 63]);
      var strokeMM = randChoice([400, 500, 600, 800, 1000]);
      var E = 210000; // MPa
      var I = Math.PI * Math.pow(rod, 4) / 64;
      var Pcr = Math.PI * Math.PI * E * I / (strokeMM * strokeMM);
      var PcrKN = roundN(Pcr / 1000, 1);
      return {
        prompt: 'Rod d = ' + rod + ' mm, stroke L = ' + strokeMM + ' mm, E = 210 GPa. Find Euler critical buckling load in kN.',
        answer: PcrKN, unit: 'kN', tolerance: 1,
        steps: ['I = \u03C0d\u2074/64 = \u03C0 \u00D7 ' + rod + '\u2074 / 64 = ' + roundN(I, 0) + ' mm\u2074', 'P_cr = \u03C0\u00B2EI / L\u00B2', 'P_cr = \u03C0\u00B2 \u00D7 210000 \u00D7 ' + roundN(I, 0) + ' / ' + strokeMM + '\u00B2', 'P_cr = ' + roundN(Pcr, 0) + ' N = ' + PcrKN + ' kN']
      };
    },
    function genBoreDiameter() {
      var forceKN = randChoice([20, 30, 40, 50, 60, 80, 100]);
      var pressureMPa = randChoice([10, 14, 16, 20, 25]);
      var forceN = forceKN * 1000;
      var pressurePa = pressureMPa * 1e6;
      var areaM2 = forceN / pressurePa;
      var diamM = Math.sqrt(4 * areaM2 / Math.PI);
      var diamMM = roundN(diamM * 1000, 1);
      return {
        prompt: 'Required extend force = ' + forceKN + ' kN, pressure = ' + pressureMPa + ' MPa. Find minimum bore diameter in mm.',
        answer: diamMM, unit: 'mm', tolerance: 0.5,
        steps: ['A = F / P = ' + forceKN + '\u00D710\u00B3 / (' + pressureMPa + '\u00D710\u2076) = ' + roundN(areaM2, 6) + ' m\u00B2', 'D = \u221A(4A/\u03C0)', 'D = \u221A(4 \u00D7 ' + roundN(areaM2, 6) + ' / \u03C0)', 'D = ' + roundN(diamM, 4) + ' m = ' + diamMM + ' mm']
      };
    }
  ];

  /* ================================================================
     QUIZ — 15 questions (8 MCQ + 7 numeric)
     ================================================================ */

  function makeQuizPool() {
    return [
      /* MCQ 1 */
      { type: 'mcq', prompt: 'What is the formula for bore area of a hydraulic cylinder?', options: ['\u03C0/4 \u00D7 D\u00B2', '\u03C0 \u00D7 D\u00B2', '\u03C0/4 \u00D7 (D\u00B2 \u2212 d\u00B2)', 'D\u00B2 / 4'], correct: 0 },
      /* MCQ 2 */
      { type: 'mcq', prompt: 'Why is retract speed faster than extend speed for the same flow rate?', options: ['Annular area is smaller than bore area', 'Rod adds extra force', 'Oil pressure increases during retract', 'The pump speeds up'], correct: 0 },
      /* MCQ 3 */
      { type: 'mcq', prompt: 'Which cylinder type provides powered motion in both directions?', options: ['Double-acting', 'Single-acting', 'Telescopic single-acting', 'Spring-return'], correct: 0 },
      /* MCQ 4 */
      { type: 'mcq', prompt: 'What does Euler\'s buckling formula P_cr = \u03C0\u00B2EI/L\u00B2 calculate?', options: ['Critical compressive load before rod buckles', 'Maximum hydraulic pressure', 'Piston extend force', 'Cylinder bore diameter'], correct: 0 },
      /* MCQ 5 */
      { type: 'mcq', prompt: 'What is the typical safety factor against rod buckling?', options: ['3.5 to 5', '1 to 1.5', '10 to 15', '0.5 to 1'], correct: 0 },
      /* MCQ 6 */
      { type: 'mcq', prompt: 'In the power formula P = pQ/(60\u03B7), what does \u03B7 represent?', options: ['Overall system efficiency', 'Fluid viscosity', 'Area ratio', 'Stroke length'], correct: 0 },
      /* MCQ 7 */
      { type: 'mcq', prompt: 'Which type of cylinder achieves a long stroke from a short retracted length?', options: ['Telescopic', 'Double-acting', 'Single-acting', 'Tandem'], correct: 0 },
      /* MCQ 8 */
      { type: 'mcq', prompt: 'What happens to extend force if bore diameter is doubled (at the same pressure)?', options: ['Force increases 4 times', 'Force doubles', 'Force stays the same', 'Force increases 8 times'], correct: 0 },
      /* Numeric 1 */
      (function () {
        var bore = 100;
        var area = roundN(Math.PI / 4 * bore * bore, 1);
        return { type: 'numeric', prompt: 'Bore D = ' + bore + ' mm. Calculate bore area (mm\u00B2).', answer: area, unit: 'mm\u00B2', tolerance: 1 };
      })(),
      /* Numeric 2 */
      (function () {
        var bore = 80, rod = 45;
        var ann = roundN(Math.PI / 4 * (bore * bore - rod * rod), 1);
        return { type: 'numeric', prompt: 'Bore = ' + bore + ' mm, rod = ' + rod + ' mm. Find annular area (mm\u00B2).', answer: ann, unit: 'mm\u00B2', tolerance: 1 };
      })(),
      /* Numeric 3 */
      (function () {
        var bore = 63, pMPa = 20;
        var aM2 = Math.PI / 4 * Math.pow(bore / 1000, 2);
        var fKN = roundN(pMPa * 1e6 * aM2 / 1000, 1);
        return { type: 'numeric', prompt: 'Bore = ' + bore + ' mm, P = ' + pMPa + ' MPa. Extend force in kN?', answer: fKN, unit: 'kN', tolerance: 0.2 };
      })(),
      /* Numeric 4 */
      (function () {
        var bore = 80, flow = 40;
        var aMM2 = Math.PI / 4 * bore * bore;
        var qMM3s = flow * 1e6 / 60;
        var v = roundN(qMM3s / aMM2, 1);
        return { type: 'numeric', prompt: 'Bore = ' + bore + ' mm, flow = ' + flow + ' L/min. Extend speed in mm/s?', answer: v, unit: 'mm/s', tolerance: 1 };
      })(),
      /* Numeric 5 */
      (function () {
        var pMPa = 16, flow = 50, eff = 0.85;
        var pw = roundN(pMPa * flow / (60 * eff), 2);
        return { type: 'numeric', prompt: 'P = ' + pMPa + ' MPa, Q = ' + flow + ' L/min, \u03B7 = ' + (eff * 100) + '%. Pump power in kW?', answer: pw, unit: 'kW', tolerance: 0.1 };
      })(),
      /* Numeric 6 */
      (function () {
        var rod = 40, strokeMM = 600;
        var I = Math.PI * Math.pow(rod, 4) / 64;
        var Pcr = Math.PI * Math.PI * 210000 * I / (strokeMM * strokeMM);
        var PcrKN = roundN(Pcr / 1000, 1);
        return { type: 'numeric', prompt: 'Rod = ' + rod + ' mm, L = ' + strokeMM + ' mm. Euler critical load in kN?', answer: PcrKN, unit: 'kN', tolerance: 1 };
      })(),
      /* Numeric 7 */
      (function () {
        var bore = 100, rod = 56;
        var aB = Math.PI / 4 * bore * bore;
        var aA = Math.PI / 4 * (bore * bore - rod * rod);
        var ratio = roundN(aB / aA, 2);
        return { type: 'numeric', prompt: 'Bore = ' + bore + ' mm, rod = ' + rod + ' mm. Area ratio (A_bore/A_ann)?', answer: ratio, unit: '', tolerance: 0.05 };
      })()
    ];
  }

  /* ================================================================
     DOM REFS
     ================================================================ */

  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');

  /* Simulate */
  var simPanel     = document.getElementById('sim-panel');
  var boreSlider   = document.getElementById('bore-slider');
  var rodSlider    = document.getElementById('rod-slider');
  var strokeSlider = document.getElementById('stroke-slider');
  var pressureSlider = document.getElementById('pressure-slider');
  var flowSlider   = document.getElementById('flow-slider');
  var effSlider    = document.getElementById('eff-slider');
  var boreValEl    = document.getElementById('bore-val');
  var rodValEl     = document.getElementById('rod-val');
  var strokeValEl  = document.getElementById('stroke-val');
  var pressureValEl = document.getElementById('pressure-val');
  var flowValEl    = document.getElementById('flow-val');
  var effValEl     = document.getElementById('eff-val');
  var btnAnimate   = document.getElementById('btn-animate');
  var chkOilFlow   = document.getElementById('chk-oil-flow');
  var chkDimensions = document.getElementById('chk-dimensions');

  var rFext   = document.getElementById('r-fext');
  var rFret   = document.getElementById('r-fret');
  var rVext   = document.getElementById('r-vext');
  var rVret   = document.getElementById('r-vret');
  var rVol    = document.getElementById('r-vol');
  var rPower  = document.getElementById('r-power');
  var rBuckle = document.getElementById('r-buckle');

  /* Explore */
  var catRow       = document.getElementById('cat-row');
  var catTabs      = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid  = document.getElementById('concept-grid');
  var itemInfo     = document.getElementById('item-info');

  /* Practice */
  var practicePanel = document.getElementById('practice-panel');
  var ppPrompt      = document.getElementById('pp-prompt');
  var ppInput       = document.getElementById('pp-input');
  var ppUnit        = document.getElementById('pp-unit');
  var ppCheck       = document.getElementById('pp-check');
  var ppNext        = document.getElementById('pp-next');
  var ppFeedback    = document.getElementById('pp-feedback');
  var ppSolution    = document.getElementById('pp-solution');
  var practiceBar   = document.getElementById('practice-bar');
  var pbarScoreVal  = document.getElementById('pbar-score-val');

  /* Quiz */
  var quizPanel   = document.getElementById('quiz-panel');
  var quizBar     = document.getElementById('quiz-bar');
  var qbarNum     = document.getElementById('qbar-num');
  var quizResult  = document.getElementById('quiz-result');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var cylType = 'double';

  /* Sim params */
  var boreMM = 80, rodMM = 40, strokeMM = 500;
  var pressureMPa = 16, flowLPM = 40, effPct = 85;

  /* Animation */
  var animating = false;
  var animPhase = 0; // 0..1 extend, 1..2 retract
  var animSpeed = 0.005;
  var animFrame = null;
  var oilParticles = [];

  /* Explore */
  var exploreCat = 'fundamentals';
  var selectedConcept = null;

  /* Practice */
  var practiceProblem = null;
  var practiceCorrect = 0, practiceTotal = 0;
  var practiceAnswered = false;

  /* Quiz */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* ================================================================
     CALCULATIONS
     ================================================================ */

  function boreArea() { return Math.PI / 4 * boreMM * boreMM; }
  function rodArea()  { return Math.PI / 4 * rodMM * rodMM; }
  function annularArea() { return boreArea() - rodArea(); }
  function extendForceN() { return pressureMPa * 1e6 * boreArea() * 1e-6; }
  function retractForceN() { return pressureMPa * 1e6 * annularArea() * 1e-6; }
  function extendSpeedMMs() { return (flowLPM * 1e6 / 60) / boreArea(); }
  function retractSpeedMMs() { return (flowLPM * 1e6 / 60) / annularArea(); }
  function volumePerStrokeL() { return boreArea() * strokeMM / 1e6; }
  function pumpPowerKW() { return pressureMPa * flowLPM / (60 * effPct / 100); }
  function eulerCriticalN() {
    var E = 210000; // MPa
    var I = Math.PI * Math.pow(rodMM, 4) / 64;
    return Math.PI * Math.PI * E * I / (strokeMM * strokeMM);
  }
  function bucklingSF() {
    var fExt = extendForceN();
    if (fExt <= 0) return 999;
    return eulerCriticalN() / fExt;
  }

  function updateReadouts() {
    rFext.textContent   = roundN(extendForceN() / 1000, 1);
    rFret.textContent   = roundN(retractForceN() / 1000, 1);
    rVext.textContent   = roundN(extendSpeedMMs(), 1);
    rVret.textContent   = roundN(retractSpeedMMs(), 1);
    rVol.textContent    = roundN(volumePerStrokeL(), 2);
    rPower.textContent  = roundN(pumpPowerKW(), 2);
    var sf = bucklingSF();
    rBuckle.textContent = sf > 100 ? '>100' : roundN(sf, 1);
    rBuckle.style.color = sf >= 3.5 ? '#3ddc84' : sf >= 2 ? '#f5c842' : '#ff5555';
  }

  /* ================================================================
     CANVAS — Hydraulic Cylinder Drawing
     ================================================================ */

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = Math.floor(rect.width - 16);
    var h = Math.min(360, Math.floor(w * 0.42));
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  function draw() {
    var size = resizeCanvas();
    var W = size.w, H = size.h;
    ctx.clearRect(0, 0, W, H);

    /* Layout constants */
    var pad = 30;
    var cylY = H * 0.28;
    var cylH = H * 0.34;
    var totalL = W - 2 * pad;
    var barrelL = totalL * 0.55;
    var rodL = totalL * 0.35;
    var capW = 12;

    /* Piston position for animation */
    var pistonFrac = 0;
    if (animating) {
      pistonFrac = animPhase <= 1 ? animPhase : (2 - animPhase);
    }
    var pistonX = pad + capW + pistonFrac * (barrelL - capW - 8);

    /* Barrel */
    ctx.fillStyle = '#1f2535';
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    roundRect(ctx, pad, cylY, barrelL, cylH, 6);
    ctx.fill();
    ctx.stroke();

    /* Cap end (left) */
    ctx.fillStyle = '#26a69a';
    ctx.globalAlpha = 0.7;
    roundRect(ctx, pad - 4, cylY - 4, capW, cylH + 8, 3);
    ctx.fill();
    ctx.globalAlpha = 1;

    /* Oil in cap side */
    if (chkOilFlow.checked) {
      ctx.fillStyle = 'rgba(38,166,154,0.18)';
      var oilW = Math.max(0, pistonX - pad - capW);
      ctx.fillRect(pad + capW, cylY + 4, oilW, cylH - 8);

      /* Oil in rod side */
      ctx.fillStyle = 'rgba(38,166,154,0.12)';
      var rodSideX = pistonX + 8;
      var rodSideW = Math.max(0, pad + barrelL - rodSideX);
      ctx.fillRect(rodSideX, cylY + 4, rodSideW, cylH - 8);
    }

    /* Piston head */
    ctx.fillStyle = '#26a69a';
    var pistonW = 8;
    ctx.fillRect(pistonX, cylY + 4, pistonW, cylH - 8);

    /* Seals on piston */
    ctx.fillStyle = '#1a7a70';
    ctx.fillRect(pistonX - 1, cylY + 4, 2, cylH - 8);
    ctx.fillRect(pistonX + pistonW - 1, cylY + 4, 2, cylH - 8);

    /* Rod */
    var rodStartX = pistonX + pistonW;
    var rodH = cylH * 0.32;
    var rodY = cylY + (cylH - rodH) / 2;
    var rodEndX = pad + barrelL + rodL * (0.3 + 0.7 * pistonFrac);
    ctx.fillStyle = '#26a69a';
    ctx.globalAlpha = 0.85;
    roundRect(ctx, rodStartX, rodY, rodEndX - rodStartX, rodH, 4);
    ctx.fill();
    ctx.globalAlpha = 1;

    /* Rod end eye */
    var eyeR = rodH * 0.65;
    var eyeCX = rodEndX + eyeR;
    var eyeCY = cylY + cylH / 2;
    ctx.beginPath();
    ctx.arc(eyeCX, eyeCY, eyeR, 0, Math.PI * 2);
    ctx.strokeStyle = '#26a69a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eyeCX, eyeCY, eyeR * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1117';
    ctx.fill();
    ctx.strokeStyle = '#26a69a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Port connections */
    var portW = 8, portH = 14;
    ctx.fillStyle = 'rgba(38,166,154,0.6)';
    ctx.fillRect(pad + barrelL * 0.25, cylY - portH + 2, portW, portH);
    ctx.fillRect(pad + barrelL * 0.75, cylY - portH + 2, portW, portH);

    /* Port labels */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.fillText('P', pad + barrelL * 0.25 + portW / 2, cylY - portH - 3);
    ctx.fillText('T', pad + barrelL * 0.75 + portW / 2, cylY - portH - 3);

    /* Oil flow particles */
    if (animating && chkOilFlow.checked) {
      drawOilParticles(pad, cylY, barrelL, cylH, pistonX, capW);
    }

    /* Dimensions */
    if (chkDimensions.checked) {
      drawDimensions(pad, cylY, cylH, barrelL, rodEndX, eyeCX, eyeR, rodY, rodH, W, H);
    }

    /* Cylinder type indicator */
    ctx.fillStyle = '#26a69a';
    ctx.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'left';
    var typeLabel = cylType === 'double' ? 'Double-Acting' : cylType === 'single' ? 'Single-Acting' : 'Telescopic';
    ctx.fillText(typeLabel, pad, H - 10);

    /* Force arrows */
    var midY = cylY + cylH / 2;
    if (animating) {
      var extending = animPhase <= 1;
      var arrowX = eyeCX + eyeR + 10;
      ctx.strokeStyle = extending ? '#3ddc84' : '#ff5555';
      ctx.fillStyle = extending ? '#3ddc84' : '#ff5555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (extending) {
        ctx.moveTo(arrowX, midY);
        ctx.lineTo(arrowX + 30, midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrowX + 30, midY - 6);
        ctx.lineTo(arrowX + 38, midY);
        ctx.lineTo(arrowX + 30, midY + 6);
        ctx.fill();
      } else {
        ctx.moveTo(arrowX + 38, midY);
        ctx.lineTo(arrowX + 8, midY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrowX + 8, midY - 6);
        ctx.lineTo(arrowX, midY);
        ctx.lineTo(arrowX + 8, midY + 6);
        ctx.fill();
      }
    }

    /* Single-acting spring */
    if (cylType === 'single') {
      drawSpring(pad + barrelL - 30, cylY + 10, 25, cylH - 20);
    }

    /* Telescopic stages */
    if (cylType === 'telescopic') {
      ctx.strokeStyle = 'rgba(38,166,154,0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      var stageX1 = pad + barrelL * 0.33;
      ctx.beginPath();
      ctx.moveTo(stageX1, cylY + 2);
      ctx.lineTo(stageX1, cylY + cylH - 2);
      ctx.stroke();
      var stageX2 = pad + barrelL * 0.66;
      ctx.beginPath();
      ctx.moveTo(stageX2, cylY + 2);
      ctx.lineTo(stageX2, cylY + cylH - 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawSpring(sx, sy, sw, sh) {
    ctx.strokeStyle = 'rgba(38,166,154,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    var coils = 6;
    for (var i = 0; i <= coils * 2; i++) {
      var ty = sy + (sh * i) / (coils * 2);
      var tx = sx + (i % 2 === 0 ? 0 : sw);
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.stroke();
  }

  function drawOilParticles(padX, cylY, barrelL, cylH, pistonX, capW) {
    ctx.fillStyle = '#26a69a';
    ctx.globalAlpha = 0.6;
    var extending = animPhase <= 1;
    for (var i = 0; i < 12; i++) {
      var t = ((animPhase * 4 + i * 0.3) % 1);
      var px, py;
      if (extending) {
        px = padX + capW + t * (pistonX - padX - capW);
      } else {
        px = pistonX + 10 + t * (padX + barrelL - pistonX - 10);
      }
      py = cylY + 8 + (i * 31 % (cylH - 16));
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawDimensions(padX, cylY, cylH, barrelL, rodEndX, eyeCX, eyeR, rodY, rodH, W, H) {
    ctx.strokeStyle = '#6b7a99';
    ctx.fillStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';

    /* Bore diameter */
    var dimX = padX + 20;
    ctx.beginPath();
    ctx.moveTo(dimX, cylY);
    ctx.lineTo(dimX, cylY + cylH);
    ctx.stroke();
    ctx.fillText('\u2300' + boreMM, dimX + 18, cylY + cylH / 2 - 2);

    /* Rod diameter */
    var rdimX = rodEndX - 20;
    ctx.beginPath();
    ctx.moveTo(rdimX, rodY);
    ctx.lineTo(rdimX, rodY + rodH);
    ctx.stroke();
    ctx.fillText('\u2300' + rodMM, rdimX - 22, rodY + rodH / 2 + 3);

    /* Stroke length */
    var dimY2 = cylY + cylH + 18;
    ctx.beginPath();
    ctx.moveTo(padX, dimY2);
    ctx.lineTo(padX + barrelL, dimY2);
    ctx.stroke();
    ctx.fillText('Stroke: ' + strokeMM + ' mm', padX + barrelL / 2, dimY2 + 13);
  }

  function roundRect(context, rx, ry, rw, rh, rr) {
    context.beginPath();
    context.moveTo(rx + rr, ry);
    context.lineTo(rx + rw - rr, ry);
    context.quadraticCurveTo(rx + rw, ry, rx + rw, ry + rr);
    context.lineTo(rx + rw, ry + rh - rr);
    context.quadraticCurveTo(rx + rw, ry + rh, rx + rw - rr, ry + rh);
    context.lineTo(rx + rr, ry + rh);
    context.quadraticCurveTo(rx, ry + rh, rx, ry + rh - rr);
    context.lineTo(rx, ry + rr);
    context.quadraticCurveTo(rx, ry, rx + rr, ry);
    context.closePath();
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animateLoop() {
    animPhase += animSpeed;
    if (animPhase >= 2) animPhase -= 2;
    draw();
    updateReadouts();
    if (animating) animFrame = requestAnimationFrame(animateLoop);
  }

  function toggleAnimation() {
    animating = !animating;
    btnAnimate.textContent = animating ? '\u23F9 Stop' : '\u25B6 Animate';
    if (animating) {
      animFrame = requestAnimationFrame(animateLoop);
    } else {
      if (animFrame) cancelAnimationFrame(animFrame);
      animPhase = 0;
      draw();
    }
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  var canvasCard = canvas.parentElement;

  function switchMode(newMode) {
    mode = newMode;

    /* Stop animation */
    if (animating) toggleAnimation();

    /* Hide all */
    simPanel.style.display = 'none';
    catRow.style.display = 'none';
    itemSelector.style.display = 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';

    if (newMode === 'simulate') {
      canvasCard.style.display = '';
      simPanel.style.display = '';
      draw();
      updateReadouts();
    } else if (newMode === 'explore') {
      canvasCard.style.display = 'none';
      catRow.style.display = '';
      itemSelector.style.display = '';
      renderConceptGrid();
    } else if (newMode === 'practice') {
      canvasCard.style.display = 'none';
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      newPracticeProblem();
    } else if (newMode === 'quiz') {
      canvasCard.style.display = 'none';
      quizBar.style.display = '';
      startQuiz();
    }
  }

  /* Mode tabs */
  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(m);
  });

  /* Cylinder type tabs */
  document.getElementById('cyl-type-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    cylType = e.target.dataset.ctype;
    document.querySelectorAll('#cyl-type-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    draw();
  });

  /* ================================================================
     SIMULATE — Slider handlers
     ================================================================ */

  function readSliders() {
    boreMM = parseInt(boreSlider.value, 10);
    rodMM = parseInt(rodSlider.value, 10);
    strokeMM = parseInt(strokeSlider.value, 10);
    pressureMPa = parseFloat(pressureSlider.value);
    flowLPM = parseInt(flowSlider.value, 10);
    effPct = parseInt(effSlider.value, 10);

    /* Clamp rod < bore */
    if (rodMM >= boreMM) {
      rodMM = Math.max(16, boreMM - 5);
      rodSlider.value = rodMM;
    }

    boreValEl.textContent = boreMM + ' mm';
    rodValEl.textContent = rodMM + ' mm';
    strokeValEl.textContent = strokeMM + ' mm';
    pressureValEl.textContent = pressureMPa + ' MPa';
    flowValEl.textContent = flowLPM + ' L/min';
    effValEl.textContent = effPct + ' %';
  }

  function onSliderInput() {
    readSliders();
    updateReadouts();
    if (!animating) draw();
  }

  [boreSlider, rodSlider, strokeSlider, pressureSlider, flowSlider, effSlider].forEach(function (s) {
    s.addEventListener('input', onSliderInput);
  });

  btnAnimate.addEventListener('click', toggleAnimation);

  chkOilFlow.addEventListener('change', function () {
    this.parentElement.classList.toggle('checked', this.checked);
    if (!animating) draw();
  });
  chkDimensions.addEventListener('change', function () {
    this.parentElement.classList.toggle('checked', this.checked);
    if (!animating) draw();
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.cat === exploreCat);
    });
    selectedConcept = null;
    itemInfo.style.display = 'none';
    renderConceptGrid();
  });

  function renderConceptGrid() {
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    conceptGrid.innerHTML = '';
    filtered.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept && selectedConcept.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () { selectConcept(c); });
      conceptGrid.appendChild(btn);
    });
  }

  function selectConcept(c) {
    selectedConcept = c;
    renderConceptGrid();
    itemInfo.style.display = '';

    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span>';
    html += '<span class="ii-cat-badge">' + c.cat + '</span></div>';
    html += '<p class="ii-desc">' + c.desc + '</p>';
    html += '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>';
    if (c.unit) html += '<span class="fb-unit">' + c.unit + '</span>';
    html += '</div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<div class="ex-problem">' + c.example.problem + '</div>';
      c.example.steps.forEach(function (s) {
        html += '<div class="ex-step">' + s.replace(/=\s*([0-9.,]+)/g, '= <strong>$1</strong>') + '</div>';
      });
      html += '</div>';
    }

    itemInfo.innerHTML = html;
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function newPracticeProblem() {
    var gen = PRACTICE_GENERATORS[Math.floor(Math.random() * PRACTICE_GENERATORS.length)];
    practiceProblem = gen();
    practiceAnswered = false;
    ppPrompt.textContent = practiceProblem.prompt;
    ppUnit.textContent = practiceProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !practiceAnswered) checkPractice();
  });

  function checkPractice() {
    if (practiceAnswered || !practiceProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) { ppFeedback.textContent = 'Enter a number'; ppFeedback.className = 'feedback err'; return; }

    practiceAnswered = true;
    practiceTotal++;
    var diff = Math.abs(userVal - practiceProblem.answer);
    var ok = diff <= practiceProblem.tolerance;
    if (ok) practiceCorrect++;

    ppFeedback.textContent = ok ? '\u2705 Correct!' : '\u274C Incorrect \u2014 answer: ' + practiceProblem.answer + ' ' + practiceProblem.unit;
    ppFeedback.className = ok ? 'feedback ok' : 'feedback err';
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';
    pbarScoreVal.textContent = practiceCorrect + ' / ' + practiceTotal;

    /* Show solution */
    ppSolution.style.display = '';
    var solHTML = '<h4>Solution</h4>';
    practiceProblem.steps.forEach(function (s) {
      solHTML += '<div class="sol-step">' + s.replace(/=\s*([0-9.,]+)/g, '= <strong>$1</strong>') + '</div>';
    });
    ppSolution.innerHTML = solHTML;
  }

  ppNext.addEventListener('click', newPracticeProblem);

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
    var pool = makeQuizPool();
    quizSet = shuffle(pool).slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    showQuizQuestion();
  }

  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    quizAnswered = false;
    qbarNum.textContent = quizIdx + 1;

    var html = '<p class="qp-prompt">' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, idx) {
        html += '<button class="answer-btn" data-idx="' + idx + '">' + opt + '</button>';
      });
      html += '</div>';
      html += '<div style="margin-top:10px"><span class="quiz-feedback" id="qfb"></span></div>';
      html += '<div style="margin-top:8px"><button class="btn btn-primary" id="quiz-next" style="display:none">Next \u2192</button></div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-val" type="number" step="any" placeholder="Answer">';
      html += '<span class="qi-unit">' + (q.unit || '') + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
      html += '<div style="margin-top:6px"><span class="quiz-feedback" id="qfb"></span></div>';
      html += '<div style="margin-top:8px"><button class="btn btn-primary" id="quiz-next" style="display:none">Next \u2192</button></div>';
    }

    quizPanel.innerHTML = html;

    /* Wire events */
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () { submitQuizMCQ(parseInt(btn.dataset.idx, 10)); });
      });
    } else {
      var submitBtn = document.getElementById('qi-submit');
      var inputEl = document.getElementById('qi-val');
      submitBtn.addEventListener('click', function () { submitQuizNumeric(); });
      inputEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitQuizNumeric(); });
      inputEl.focus();
    }
  }

  function submitQuizMCQ(chosenIdx) {
    if (quizAnswered) return;
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var ok = chosenIdx === q.correct;
    if (ok) quizScore++;

    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b) {
      b.classList.add('locked');
      var bIdx = parseInt(b.dataset.idx, 10);
      if (bIdx === q.correct) b.classList.add('correct');
      if (bIdx === chosenIdx && !ok) b.classList.add('wrong');
    });

    var fb = document.getElementById('qfb');
    fb.textContent = ok ? '\u2705 Correct!' : '\u274C Incorrect';
    fb.className = ok ? 'quiz-feedback ok' : 'quiz-feedback err';

    quizAnswers.push({ prompt: q.prompt, correct: ok, given: q.options[chosenIdx], expected: q.options[q.correct] });

    document.getElementById('quiz-next').style.display = '';
    document.getElementById('quiz-next').addEventListener('click', nextQuizQuestion);
  }

  function submitQuizNumeric() {
    if (quizAnswered) return;
    var inputEl = document.getElementById('qi-val');
    var val = parseFloat(inputEl.value);
    if (isNaN(val)) return;

    quizAnswered = true;
    var q = quizSet[quizIdx];
    var ok = Math.abs(val - q.answer) <= (q.tolerance || 1);
    if (ok) quizScore++;

    inputEl.disabled = true;
    var submitBtn = document.getElementById('qi-submit');
    submitBtn.disabled = true;

    var fb = document.getElementById('qfb');
    fb.textContent = ok ? '\u2705 Correct!' : '\u274C Answer: ' + q.answer + ' ' + (q.unit || '');
    fb.className = ok ? 'quiz-feedback ok' : 'quiz-feedback err';

    quizAnswers.push({ prompt: q.prompt, correct: ok, given: String(val), expected: String(q.answer) + ' ' + (q.unit || '') });

    document.getElementById('quiz-next').style.display = '';
    document.getElementById('quiz-next').addEventListener('click', nextQuizQuestion);
  }

  function nextQuizQuestion() {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) {
      showQuizResult();
    } else {
      showQuizQuestion();
    }
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = quizScore / QUIZ_SIZE;
    var cls = pct >= 1 ? 'perfect' : pct >= 0.6 ? 'good' : 'poor';
    var stars = pct >= 1 ? '\u2605\u2605\u2605' : pct >= 0.6 ? '\u2605\u2605' : '\u2605';
    var verdict = pct >= 1 ? 'Perfect!' : pct >= 0.6 ? 'Good job!' : 'Keep practising!';

    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span>';
    html += '<span class="qr-stars">' + stars + '</span></div>';
    html += '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</span>';
    html += '<div class="qr-verdict">' + verdict + '</div></div></div>';

    html += '<div class="qr-rows">';
    quizAnswers.forEach(function (a, idx) {
      var rowCls = a.correct ? 'ok' : 'err';
      html += '<div class="qr-row ' + rowCls + '">';
      html += '<span class="qr-qnum">Q' + (idx + 1) + '</span>';
      html += '<span class="qr-detail"><strong>' + escHtml(a.given) + '</strong>';
      if (!a.correct) html += ' \u2014 expected: ' + escHtml(a.expected);
      html += '</span>';
      html += '<span class="qr-mark">' + (a.correct ? '\u2713' : '\u2717') + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" id="btn-new-quiz">New Quiz</button>';
    quizResult.innerHTML = html;

    document.getElementById('btn-new-quiz').addEventListener('click', function () {
      quizResult.style.display = 'none';
      startQuiz();
    });
  }

  function escHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ================================================================
     RESIZE
     ================================================================ */

  window.addEventListener('resize', function () {
    if (mode === 'simulate' && !animating) draw();
  });

  /* ================================================================
     INIT
     ================================================================ */

  readSliders();
  updateReadouts();
  draw();

})();
