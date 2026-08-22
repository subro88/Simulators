(function () {
  'use strict';

  /* ================================================================
     HELPERS
     ================================================================ */
  function $(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randF(a, b) { return a + Math.random() * (b - a); }
  function shuffleArr(a) { var arr = a.slice(); for (var i = arr.length - 1; i > 0; i--) { var j = randInt(0, i); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function deg2rad(d) { return d * Math.PI / 180; }
  /* Rebuild the play button preserving the icon/label split, so the
     icon-only mobile variant keeps working in the playing and done states. */
  function setPlayButton(icon, label) {
    var b = document.getElementById('btn-play');
    if (!b) return;
    b.innerHTML = '<span class="cvs-ico">' + icon + '</span><span class="cvs-lbl">' + label + '</span>';
  }
  function round2(v) { return Math.round(v * 100) / 100; }
  function round1(v) { return Math.round(v * 10) / 10; }

  /* ================================================================
     DATA — CONCEPTS (12)
     ================================================================ */
  var CONCEPTS = [
    /* ── Fundamentals ─────────────────────────────────────────────── */
    {
      id: 'mechanical-advantage', name: 'Mechanical Advantage', symbol: 'MA = L/E',
      formula: 'MA = Load / Effort', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'Mechanical Advantage (MA) is the ratio of the output force (load) to the input force (effort). An MA greater than 1 means the machine multiplies force \u2014 you apply less effort to move a larger load. MA is measured from forces: MA = Load / Effort. The distance ratio is a separate quantity, the Velocity Ratio, and the two are equal ONLY for an ideal frictionless machine. In any real machine MA is smaller than VR, and the shortfall is the efficiency: \u03b7 = MA / VR.',
      diagram: 'maDiagram',
      example: { problem: 'A lever lifts a 400 N load with an effort of 100 N. What is the Mechanical Advantage?', steps: ['MA = Load / Effort', 'MA = 400 / 100', 'MA = 4'], answer: 4, unit: '' }
    },
    {
      id: 'velocity-ratio', name: 'Velocity Ratio', symbol: 'VR = dE/dL',
      formula: 'VR = Distance(effort) / Distance(load)', unit: '\u2014',
      cat: 'fundamentals',
      desc: 'Velocity Ratio (VR) is the ratio of the distance moved by the effort to the distance moved by the load. It depends purely on the geometry of the machine, not on friction. For a lever, VR = effort arm / load arm. VR is always the ideal (maximum) mechanical advantage.',
      diagram: 'vrDiagram',
      example: { problem: 'The effort moves 3 m while the load moves 0.5 m. Find VR.', steps: ['VR = distance(effort) / distance(load)', 'VR = 3 / 0.5', 'VR = 6'], answer: 6, unit: '' }
    },
    {
      id: 'efficiency', name: 'Efficiency', symbol: '\u03B7 = MA/VR',
      formula: '\u03B7 = (MA / VR) \u00D7 100%', unit: '%',
      cat: 'fundamentals',
      desc: 'Efficiency measures how much of the input work is converted to useful output work. It equals MA divided by VR times 100%. An ideal (frictionless) machine has 100% efficiency. Real machines always have efficiency less than 100% due to friction, heat, and deformation losses.',
      diagram: 'effDiagram',
      example: { problem: 'A pulley system has MA = 3.6 and VR = 4. Find efficiency.', steps: ['\u03B7 = (MA / VR) \u00D7 100', '\u03B7 = (3.6 / 4) \u00D7 100', '\u03B7 = 0.9 \u00D7 100', '\u03B7 = 90%'], answer: 90, unit: '%' }
    },
    {
      id: 'work-energy', name: 'Work & Energy', symbol: 'W = F \u00D7 d',
      formula: 'Work = Force \u00D7 Distance', unit: 'J (Joules)',
      cat: 'fundamentals',
      desc: 'Work is the product of force and the distance moved in the direction of the force. Work input = Effort \u00D7 distance(effort). Work output = Load \u00D7 distance(load). By conservation of energy, work output can never exceed work input. The difference is lost to friction as heat.',
      diagram: 'workDiagram',
      example: { problem: 'A 200 N load is lifted 1.5 m using an inclined plane. How much work is done on the load?', steps: ['W = F \u00D7 d', 'W = 200 \u00D7 1.5', 'W = 300 J'], answer: 300, unit: 'J' }
    },
    /* ── Machine Types ────────────────────────────────────────────── */
    {
      id: 'lever-types', name: 'Lever (3 Classes)', symbol: 'MA = eArm/lArm',
      formula: 'MA = Effort arm / Load arm', unit: '\u2014',
      cat: 'types',
      desc: '1st class: fulcrum between effort and load (seesaw, crowbar). 2nd class: load between fulcrum and effort (wheelbarrow, nutcracker). 3rd class: effort between fulcrum and load (fishing rod, tweezers). The MA equals the effort arm divided by the load arm.',
      diagram: 'leverDiagram',
      example: { problem: 'A 1st-class lever has effort arm 3 m and load arm 1 m. What is the MA?', steps: ['MA = effort arm / load arm', 'MA = 3 / 1', 'MA = 3'], answer: 3, unit: '' }
    },
    {
      id: 'pulley-systems', name: 'Pulley Systems', symbol: 'MA = n ropes',
      formula: 'MA = number of rope sections supporting load', unit: '\u2014',
      cat: 'types',
      desc: 'A fixed pulley changes direction but gives no mechanical advantage (MA=1). A movable pulley gives MA=2. A block and tackle system uses multiple pulleys to increase MA. The velocity ratio equals the number of rope sections supporting the load.',
      diagram: 'pulleyDiagram',
      example: { problem: 'A block and tackle has 4 rope sections supporting the load of 800 N. What effort is needed (ideal)?', steps: ['MA = VR = number of ropes = 4', 'Effort = Load / MA', 'Effort = 800 / 4', 'Effort = 200 N'], answer: 200, unit: 'N' }
    },
    {
      id: 'inclined-plane', name: 'Inclined Plane', symbol: 'MA = 1/sin\u03B8',
      formula: 'MA(ideal) = 1 / sin(\u03B8) = L / h', unit: '\u2014',
      cat: 'types',
      desc: 'An inclined plane (ramp) reduces the effort needed by increasing the distance. The ideal MA is 1/sin(angle) which equals the ramp length divided by the height. Friction reduces the actual MA. The effort needed = W \u00D7 sin(\u03B8) + friction force.',
      diagram: 'inclinedDiagram',
      example: { problem: 'A ramp makes a 30\u00B0 angle. What is the ideal MA?', steps: ['MA = 1 / sin(\u03B8)', 'MA = 1 / sin(30\u00B0)', 'MA = 1 / 0.5', 'MA = 2'], answer: 2, unit: '' }
    },
    {
      id: 'wheel-axle', name: 'Wheel & Axle', symbol: 'MA = R/r',
      formula: 'MA = Wheel radius / Axle radius', unit: '\u2014',
      cat: 'types',
      desc: 'The wheel and axle is a rotating lever. Effort is applied at the wheel rim (large radius R), and the load is connected at the axle (small radius r). MA = R/r. Examples: steering wheel, screwdriver, door knob, bicycle gears, windlass.',
      diagram: 'wheelAxleDiagram',
      example: { problem: 'A steering wheel has R = 0.2 m and axle r = 0.04 m. Find MA.', steps: ['MA = R / r', 'MA = 0.2 / 0.04', 'MA = 5'], answer: 5, unit: '' }
    },
    /* ── Advanced ─────────────────────────────────────────────────── */
    {
      id: 'screw-machine', name: 'Screw', symbol: 'MA = 2\u03C0L/p',
      formula: 'MA = 2\u03C0L / pitch', unit: '\u2014',
      cat: 'advanced',
      desc: 'A screw is an inclined plane wrapped around a cylinder. One full turn of the handle (effort distance = 2\u03C0L) advances the screw by one pitch. MA = 2\u03C0L/p. Used in screw jacks, vices, bolts, and presses. The very high MA comes at the cost of moving the load very slowly.',
      diagram: 'screwDiagram',
      example: { problem: 'A screw jack has pitch 4 mm and handle length 300 mm. Find MA.', steps: ['MA = 2\u03C0L / p', 'MA = 2 \u00D7 3.1416 \u00D7 300 / 4', 'MA = 1884.96 / 4', 'MA = 471.24'], answer: 471.24, unit: '' }
    },
    {
      id: 'wedge-machine', name: 'Wedge', symbol: 'MA = L/t',
      formula: 'MA = Length / Thickness (at wide end)', unit: '\u2014',
      cat: 'advanced',
      desc: 'A wedge is a double inclined plane that converts a horizontal push into two perpendicular splitting forces. Thinner wedges have higher MA. Used in axes, knives, chisels, nails, and doorstops. MA \u2248 length/thickness of the wedge.',
      diagram: 'wedgeDiagram',
      example: { problem: 'A wedge is 200 mm long and 20 mm thick. What is the MA?', steps: ['MA = Length / Thickness', 'MA = 200 / 20', 'MA = 10'], answer: 10, unit: '' }
    },
    {
      id: 'compound-machines', name: 'Compound Machines', symbol: 'MA\u209C = MA\u2081\u00D7MA\u2082',
      formula: 'MA(total) = MA\u2081 \u00D7 MA\u2082 \u00D7 ... \u00D7 MA\u2099', unit: '\u2014',
      cat: 'advanced',
      desc: 'A compound machine is two or more simple machines working together. The total MA is the product of the individual MAs. Examples: bicycle (wheel & axle + lever + pulley), car jack (screw + lever), scissors (two 1st-class levers). Compound machines trade even more distance for force.',
      diagram: 'compoundDiagram',
      example: { problem: 'A gear train has two stages: MA\u2081 = 3 and MA\u2082 = 4. Total MA?', steps: ['MA(total) = MA\u2081 \u00D7 MA\u2082', 'MA(total) = 3 \u00D7 4', 'MA(total) = 12'], answer: 12, unit: '' }
    },
    {
      id: 'energy-conservation', name: 'Energy Conservation', symbol: 'W(in)=W(out)+losses',
      formula: 'Work(in) = Work(out) + Friction losses', unit: 'J',
      cat: 'advanced',
      desc: 'The law of conservation of energy states that energy cannot be created or destroyed, only transformed. In any machine, the work input (effort \u00D7 distance) equals the useful work output (load \u00D7 distance) plus energy lost to friction. This is why real machines always have efficiency < 100%.',
      diagram: 'energyDiagram',
      example: { problem: 'An effort of 120 N moves 5 m to lift 400 N through 1.2 m. Find efficiency.', steps: ['Work in = 120 \u00D7 5 = 600 J', 'Work out = 400 \u00D7 1.2 = 480 J', '\u03B7 = (480 / 600) \u00D7 100', '\u03B7 = 80%'], answer: 80, unit: '%' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0  lever MA
       Round FIRST, then compute. Deriving the answer from the unrounded
       draw while printing the rounded values made the worked solution
       contradict itself ("MA = 4.0 / 0.5" ... "MA = 7.27") and could mark a
       correct answer wrong. */
    function () {
      var eArm = round1(randF(1, 4)); var lArm = round1(randF(0.5, 3));
      if (lArm <= 0) lArm = 0.5;
      var ma = round2(eArm / lArm);
      return { prompt: 'A lever has effort arm ' + eArm + ' m and load arm ' + lArm + ' m. What is the Mechanical Advantage?', answer: ma, unit: '', steps: ['MA = effort arm / load arm', 'MA = ' + eArm + ' / ' + lArm, 'MA = ' + ma] };
    },
    /* 1  lever effort */
    function () {
      var load = randInt(5, 50) * 10; var ma = randInt(2, 6);
      var effort = round2(load / ma);
      return { prompt: 'A lever has MA = ' + ma + ' and carries a ' + load + ' N load. What effort is needed?', answer: effort, unit: 'N', steps: ['MA = Load / Effort', 'Effort = Load / MA', 'Effort = ' + load + ' / ' + ma, 'Effort = ' + effort + ' N'] };
    },
    /* 2  pulley MA */
    function () {
      var n = randInt(2, 6);
      return { prompt: 'A pulley system has ' + n + ' rope sections supporting the load. What is the Velocity Ratio?', answer: n, unit: '', steps: ['VR = number of supporting ropes', 'VR = ' + n] };
    },
    /* 3  pulley effort */
    function () {
      var n = randInt(2, 5); var load = randInt(2, 20) * 100;
      var effort = round2(load / n);
      return { prompt: 'A block and tackle with ' + n + ' supporting ropes lifts ' + load + ' N. Find the ideal effort.', answer: effort, unit: 'N', steps: ['Effort = Load / VR', 'Effort = ' + load + ' / ' + n, 'Effort = ' + effort + ' N'] };
    },
    /* 4  inclined plane MA */
    function () {
      var angle = randInt(10, 50);
      var ma = round2(1 / Math.sin(deg2rad(angle)));
      return { prompt: 'An inclined plane has an angle of ' + angle + '\u00B0. What is the ideal MA?', answer: ma, unit: '', steps: ['MA = 1 / sin(\u03B8)', 'MA = 1 / sin(' + angle + '\u00B0)', 'MA = 1 / ' + Math.sin(deg2rad(angle)).toFixed(4), 'MA = ' + ma] };
    },
    /* 5  inclined plane effort */
    function () {
      var angle = randInt(15, 45); var w = randInt(2, 10) * 100;
      var effort = round2(w * Math.sin(deg2rad(angle)));
      return { prompt: 'A ' + w + ' N load is pushed up a frictionless ' + angle + '\u00B0 ramp. What effort is needed?', answer: effort, unit: 'N', steps: ['Effort = W \u00D7 sin(\u03B8)', 'Effort = ' + w + ' \u00D7 sin(' + angle + '\u00B0)', 'Effort = ' + w + ' \u00D7 ' + Math.sin(deg2rad(angle)).toFixed(4), 'Effort = ' + effort + ' N'] };
    },
    /* 6  wheel & axle MA */
    function () {
      var R = randInt(2, 10) * 5; var r = randInt(1, 4) * 5;
      if (r >= R) r = 5;
      var ma = round2(R / r);
      return { prompt: 'A wheel and axle has wheel radius ' + R + ' cm and axle radius ' + r + ' cm. Find MA.', answer: ma, unit: '', steps: ['MA = R / r', 'MA = ' + R + ' / ' + r, 'MA = ' + ma] };
    },
    /* 7  screw MA */
    function () {
      var p = randInt(2, 10); var L = randInt(10, 40) * 10;
      var ma = round2(2 * Math.PI * L / p);
      return { prompt: 'A screw has pitch ' + p + ' mm and handle length ' + L + ' mm. Find the MA.', answer: ma, unit: '', steps: ['MA = 2\u03C0L / p', 'MA = 2 \u00D7 3.1416 \u00D7 ' + L + ' / ' + p, 'MA = ' + round2(2 * Math.PI * L) + ' / ' + p, 'MA = ' + ma] };
    },
    /* 8  efficiency */
    function () {
      var ma = randF(2, 5); var vr = ma + randF(0.5, 2);
      ma = round2(ma); vr = round2(vr);
      var eff = round2(ma / vr * 100);
      return { prompt: 'A machine has MA = ' + ma + ' and VR = ' + vr + '. What is the efficiency?', answer: eff, unit: '%', steps: ['\u03B7 = (MA / VR) \u00D7 100', '\u03B7 = (' + ma + ' / ' + vr + ') \u00D7 100', '\u03B7 = ' + round2(ma / vr) + ' \u00D7 100', '\u03B7 = ' + eff + '%'] };
    },
    /* 9  VR from distances */
    function () {
      var dE = randInt(2, 10); var dL = randF(0.5, 3); dL = round1(dL);
      var vr = round2(dE / dL);
      return { prompt: 'Effort moves ' + dE + ' m while load moves ' + dL + ' m. Find VR.', answer: vr, unit: '', steps: ['VR = d(effort) / d(load)', 'VR = ' + dE + ' / ' + dL, 'VR = ' + vr] };
    },
    /* 10 work input */
    function () {
      var E = randInt(5, 30) * 10; var dE = randF(1, 5); dE = round1(dE);
      var W = round2(E * dE);
      return { prompt: 'An effort of ' + E + ' N moves through ' + dE + ' m. Calculate work input.', answer: W, unit: 'J', steps: ['W = F \u00D7 d', 'W = ' + E + ' \u00D7 ' + dE, 'W = ' + W + ' J'] };
    },
    /* 11 work output */
    function () {
      var L = randInt(10, 50) * 10; var dL = randF(0.5, 2); dL = round1(dL);
      var W = round2(L * dL);
      return { prompt: 'A load of ' + L + ' N is lifted ' + dL + ' m. Calculate work output.', answer: W, unit: 'J', steps: ['W = F \u00D7 d', 'W = ' + L + ' \u00D7 ' + dL, 'W = ' + W + ' J'] };
    },
    /* 12 wedge MA \u2014 the sixth machine had no practice problem at all */
    function () {
      var len = randInt(10, 30) * 10;        /* mm */
      var t = randInt(2, 8) * 5;             /* mm, back thickness */
      var ma = round2(len / t);
      return { prompt: 'A wedge is ' + len + ' mm long and ' + t + ' mm thick at its wide end. What is the ideal MA?', answer: ma, unit: '', steps: ['MA = length / thickness', 'MA = ' + len + ' / ' + t, 'MA = ' + ma] };
    },
    /* 13 wedge splitting force */
    function () {
      var F = randInt(2, 12) * 50;
      var t = randInt(2, 8) * 5, len = randInt(10, 30) * 10;
      var ma = len / t;
      var Wface = round2(F * ma / 2);
      return { prompt: 'A ' + len + ' mm long, ' + t + ' mm thick wedge is driven with ' + F + ' N. Ignoring friction, what splitting force acts on EACH face?', answer: Wface, unit: 'N',
        steps: ['Ideal MA = length / thickness = ' + len + ' / ' + t + ' = ' + round2(ma), 'Total splitting force = F \u00D7 MA = ' + round2(F * ma) + ' N', 'Shared over two faces: ' + round2(F * ma) + ' / 2', 'Force per face = ' + Wface + ' N'] };
    },
    /* 14 real effort with friction \u2014 ties MA, VR and \u03B7 together */
    function () {
      var vr = randInt(3, 8);
      var eta = randInt(60, 95);
      var load = randInt(4, 20) * 100;
      var effort = round2(load / (vr * eta / 100));
      return { prompt: 'A machine with VR = ' + vr + ' is ' + eta + '% efficient and lifts a ' + load + ' N load. What effort is actually required?', answer: effort, unit: 'N',
        steps: ['MA = \u03B7 \u00D7 VR = ' + (eta / 100) + ' \u00D7 ' + vr + ' = ' + round2(vr * eta / 100), 'Effort = Load / MA', 'Effort = ' + load + ' / ' + round2(vr * eta / 100), 'Effort = ' + effort + ' N'] };
    },
    /* 15 inclined plane WITH friction */
    function () {
      var angle = randInt(15, 40);
      var w = randInt(2, 10) * 100;
      var mu = randInt(5, 30) / 100;
      var sa = Math.sin(deg2rad(angle)), ca = Math.cos(deg2rad(angle));
      var effort = round2(w * (sa + mu * ca));
      return { prompt: 'A ' + w + ' N load is pushed up a ' + angle + '\u00B0 ramp with friction coefficient \u03BC = ' + mu.toFixed(2) + '. What effort is needed?', answer: effort, unit: 'N',
        steps: ['Effort = W(sin\u03B8 + \u03BCcos\u03B8)', 'Effort = ' + w + '(sin' + angle + '\u00B0 + ' + mu.toFixed(2) + '\u00B7cos' + angle + '\u00B0)', 'Effort = ' + w + '(' + sa.toFixed(4) + ' + ' + (mu * ca).toFixed(4) + ')', 'Effort = ' + effort + ' N'] };
    },
    /* 16 screw self-locking check */
    function () {
      var p = randInt(2, 8), dm = randInt(10, 40);
      var mu = randInt(8, 25) / 100;
      var lam = Math.atan(p / (Math.PI * dm)) * 180 / Math.PI;
      var phi = Math.atan(mu) * 180 / Math.PI;
      return { prompt: 'A screw has pitch ' + p + ' mm and mean thread diameter ' + dm + ' mm. Find the lead angle \u03BB in degrees.', answer: round2(lam), unit: '\u00B0',
        steps: ['tan \u03BB = p / (\u03C0\u00B7d_m)', 'tan \u03BB = ' + p + ' / (\u03C0 \u00D7 ' + dm + ') = ' + (p / (Math.PI * dm)).toFixed(4), '\u03BB = ' + round2(lam) + '\u00B0',
                'With \u03BC = ' + mu.toFixed(2) + ', \u03C6 = ' + round2(phi) + '\u00B0 \u2192 ' + (phi >= lam ? '\u03C6 \u2265 \u03BB, so the screw is SELF-LOCKING' : '\u03C6 < \u03BB, so the screw is REVERSIBLE')] };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15)
     ================================================================ */
  var QUIZ_POOL = [
    /* MCQ 0 */ { type: 'mcq', prompt: 'Which class of lever has the fulcrum between the effort and the load?', options: ['1st Class', '2nd Class', '3rd Class', 'No class'], correct: 0 },
    /* MCQ 1 */ { type: 'mcq', prompt: 'A wheelbarrow is an example of which class of lever?', options: ['1st Class', '2nd Class', '3rd Class', 'Not a lever'], correct: 1 },
    /* MCQ 2 */ { type: 'mcq', prompt: 'A fixed pulley provides:', options: ['MA = 2', 'MA = 1 (direction change only)', 'MA = 0.5', 'Infinite MA'], correct: 1 },
    /* MCQ 3 */ { type: 'mcq', prompt: 'Which simple machine is an inclined plane wrapped around a cylinder?', options: ['Wedge', 'Wheel & Axle', 'Screw', 'Pulley'], correct: 2 },
    /* MCQ 4 */ { type: 'mcq', prompt: 'Efficiency of a machine is always:', options: ['Greater than 100%', 'Equal to 100%', 'Less than or equal to 100%', 'Depends on the operator'], correct: 2 },
    /* MCQ 5 */ { type: 'mcq', prompt: 'What does a wedge do to an applied force?', options: ['Multiplies it and changes direction', 'Only changes direction', 'Reduces it', 'Stores it as energy'], correct: 0 },
    /* MCQ 6 */ { type: 'mcq', prompt: 'The Velocity Ratio of a machine depends on:', options: ['Friction', 'Geometry only', 'Material strength', 'Applied effort'], correct: 1 },
    /* MCQ 7 */ { type: 'mcq', prompt: 'A fishing rod is an example of which lever class?', options: ['1st Class', '2nd Class', '3rd Class', 'Not a lever'], correct: 2 },
    /* MCQ 8 */ { type: 'mcq', prompt: 'In a wheel and axle, effort is applied at the:', options: ['Axle', 'Wheel rim', 'Center', 'Handle only'], correct: 1 },
    /* MCQ 9 */ { type: 'mcq', prompt: 'Conservation of energy in machines means:', options: ['Work out > Work in', 'Work out = Work in (ideal)', 'Work is created', 'Energy is destroyed by friction'], correct: 1 },
    /* Numeric 10 */ { type: 'numeric', prompt: 'A lever has effort arm 4 m and load arm 2 m. What is the MA?', answer: 2, unit: '' },
    /* Numeric 11 */ { type: 'numeric', prompt: 'A pulley system with 3 supporting ropes lifts 900 N. What ideal effort is needed (in N)?', answer: 300, unit: 'N' },
    /* Numeric 12 */ { type: 'numeric', prompt: 'An inclined plane at 30\u00B0 has ideal MA = 1/sin(30\u00B0). What is the MA?', answer: 2, unit: '' },
    /* Numeric 13 */ { type: 'numeric', prompt: 'A screw jack has pitch 5 mm and handle 250 mm. What is MA? (Use \u03C0 = 3.14)', answer: 314, unit: '' },
    /* Numeric 14 */ { type: 'numeric', prompt: 'A machine has MA = 4 and VR = 5. What is the efficiency in %?', answer: 80, unit: '%' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */
  var cvs = $('#sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 480;       /* logical coordinates — every draw fn uses W/H */
  cvs.style.maxWidth = W + 'px';
  /* DPR-aware resize keeps text crisp on retina/mobile. Logical units stay W×H. */
  function resizeCanvas() {
    var dpr = Math.min(3, window.devicePixelRatio || 1);
    var rect = cvs.getBoundingClientRect();
    var cssW = rect.width || W;
    var cssH = cssW * (H / W);
    /* Deliberately do NOT pin cvs.style.height. The backing store is always
       written at the W:H ratio and the stylesheet lays the element out as
       width:100%; height:auto, so the box derives its own height and stays
       correct even when a resize notification is missed (which happens
       whenever the tab is backgrounded). A pinned pixel height leaves the
       canvas stretched until the next observation fires. */
    cvs.width  = Math.round(cssW * dpr);
    cvs.height = Math.round(cssH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(cvs.width / W, cvs.height / H);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
    if (typeof render === 'function') render();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(resizeCanvas).observe(cvs);

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var machineType = 'lever';

  /* Lever */
  var leverClass = 1;
  var leverEffort = 150, leverLoad = 200;
  var leverEArm = 2, leverLArm = 1;

  /* Pulley */
  var pulleyType = 'fixed';
  var pulleyNum = 1, pulleyLoad = 200;

  /* Inclined plane */
  var inclAngle = 30, inclLoad = 200, inclMu = 0.1;

  /* Wheel & Axle */
  var waWheelR = 0.5, waAxleR = 0.1, waLoad = 500;

  /* Screw */
  var screwPitch = 5, screwHandle = 200, screwLoad = 5000;
  var screwMu = 0.15;       /* thread friction coefficient (steel-on-steel oiled ≈ 0.10–0.20) */
  var screwMeanD = 20;      /* mean thread diameter, mm (governs lead angle λ) */

  /* Wedge */
  var wedgeAngle = 15, wedgeForce = 100;
  var wedgeMu = 0.20;       /* face friction coefficient */

  /* Pulley realism */
  var pulleyEtaPerSheave = 0.96;  /* per-sheave efficiency (bearing + rope stiffness loss) */

  /* Master "Real / Ideal" switch — quiz/practice always use ideal.
     Defaults OFF so first-time users see clean ideal MA = VR values. */
  var useFriction = false;

  /* Free-body-diagram overlay toggle (inclined plane only — most useful pedagogically). */
  var showFBD = false;

  /* ────────────────────────────────────────────────────────────────
     SI ⇄ IMPERIAL UNIT SYSTEM
     ALL state is kept in SI.  Only display values convert.
     ──────────────────────────────────────────────────────────────── */
  var unitSystem = 'SI';                       /* 'SI' | 'IMP' */
  function isImp() { return unitSystem === 'IMP'; }
  /* Conversion constants (exact). */
  var N_PER_LBF = 4.4482216152605;
  var M_PER_FT  = 0.3048;
  var MM_PER_IN = 25.4;
  /* Format helpers — siValue ALWAYS in SI; output is a string with unit label. */
  function fmtN(siN) {
    if (siN == null || !isFinite(siN)) return '—';
    if (!isImp()) return round2(siN) + ' N';
    var v = siN / N_PER_LBF;
    return (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(2)) + ' lbf';
  }
  function fmtM(siM) {
    if (siM == null || !isFinite(siM)) return '—';
    if (!isImp()) return siM.toFixed(2) + ' m';
    return (siM / M_PER_FT).toFixed(2) + ' ft';
  }
  function fmtMM(siMM) {
    if (siMM == null || !isFinite(siMM)) return '—';
    if (!isImp()) return siMM.toFixed(1) + ' mm';
    return (siMM / MM_PER_IN).toFixed(3) + ' in';
  }
  /* "Bare" formatters — no unit suffix, just the number string for inline use. */
  function nbN(siN)   { return isImp() ? (siN / N_PER_LBF).toFixed(siN >= 100 * N_PER_LBF ? 1 : 2) : round2(siN).toString(); }
  function nbM(siM)   { return isImp() ? (siM / M_PER_FT).toFixed(2) : siM.toFixed(2); }
  function nbMM(siMM) { return isImp() ? (siMM / MM_PER_IN).toFixed(3) : siMM.toFixed(1); }
  function lblN()  { return isImp() ? 'lbf' : 'N'; }
  function lblM()  { return isImp() ? 'ft' : 'm'; }
  function lblMM() { return isImp() ? 'in' : 'mm'; }

  /* Map slider IDs → (state-variable, formatter) so we can refresh all
     value labels in one place when the unit system flips. */
  var SLIDER_FMT = {
    'lever-effort':  function () { return fmtN(leverEffort); },
    'lever-load':    function () { return fmtN(leverLoad); },
    'lever-earm':    function () { return fmtM(leverEArm); },
    'lever-larm':    function () { return fmtM(leverLArm); },
    'pulley-effort': function () { return fmtN(pulleyEffort); },
    'pulley-load':   function () { return fmtN(pulleyLoad); },
    'pulley-diam':   function () { return fmtM(pulleyDiam); },
    'incl-load':     function () { return fmtN(inclLoad); },
    'incl-effort':   function () { return fmtN(inclEffort); },
    'incl-angle':    function () { return inclAngle + '°'; },
    'incl-mu':       function () { return inclMu.toFixed(2); },
    'wa-wheelr':     function () { return fmtM(waWheelR); },
    'wa-axler':      function () { return fmtM(waAxleR); },
    'wa-load':       function () { return fmtN(waLoad); },
    'screw-pitch':   function () { return fmtMM(screwPitch); },
    'screw-handle':  function () { return fmtMM(screwHandle); },
    'screw-effort':  function () { return fmtN(screwEffort); },
    'screw-load':    function () { return fmtN(screwLoad); },
    'screw-dm':      function () { return fmtMM(screwMeanD); },
    'screw-mu':      function () { return screwMu.toFixed(2); },
    'wedge-angle':   function () { return wedgeAngle + '°'; },
    'wedge-force':   function () { return fmtN(wedgeForce); },
    'wedge-mu':      function () { return wedgeMu.toFixed(2); }
  };
  function syncSliderLabels() {
    Object.keys(SLIDER_FMT).forEach(function (id) {
      var span = document.getElementById(id + '-val');
      if (span) span.textContent = SLIDER_FMT[id]();
    });
  }

  /* Pulley user-controlled */
  var pulleyEffort = 250, pulleyDiam = 0.3;
  var pulleyCanLift = false;

  /* Inclined user-controlled */
  var inclEffort = 200;
  var inclCanPush = false;
  var inclDirection = 1; /* 1=lifting load up the ramp, -1=lowering load down the ramp */

  /* Screw user-controlled */
  var screwEffort = 40;
  var screwCanTurn = false;

  /* Wedge animation */
  var wedgeAnimPos = 0; /* 0→1 penetration */

  /* Explore */
  var selCat = 'fundamentals', selConcept = 0;

  /* Practice */
  var pProblem = null, pAnswered = false, pScore = 0, pTotal = 0;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* Animation */
  var animating = false;       /* is animation running? */
  var animTime = 0;            /* 0 → 1 normalized progress */
  var animDone = false;        /* animation reached end? */
  var animRafId = null;        /* requestAnimationFrame handle */
  var animLastTs = 0;          /* last timestamp for delta */
  var animSpeed = 0.35;        /* slower animation so movement is clearly visible */
  /* Lever anim */
  var leverAnimAngle = 0;      /* current beam tilt angle (rad) */
  var leverTargetAngle = 0;    /* target angle from torque calc */
  /* Pulley anim */
  var pulleyAnimDist = 0;      /* how far load has been lifted (px) */
  var pulleyRopeOffset = 0;    /* rope texture offset for visual movement */
  var pulleyMaxLift = 100;     /* max lift distance */
  /* Inclined anim */
  var inclAnimPos = 0;         /* block position along ramp 0→1 */
  /* Wheel-axle anim */
  var waAnimRot = 0;           /* wheel rotation angle */
  /* Screw anim */
  var screwAnimRot = 0;        /* handle rotation progress */

  /* ================================================================
     PHYSICS CALCULATIONS
     ================================================================ */
  /* Safe wedge half-angle (radians). Clamped to ≥1° to avoid singularity at α=0. */
  function wedgeHalfA() { return deg2rad(Math.max(1, wedgeAngle) / 2); }
  /* Screw lead angle λ from pitch and mean thread diameter. tan λ = p / (π·d_m). */
  function screwLeadA() {
    var dm = Math.max(1, screwMeanD);   /* mm */
    return Math.atan(screwPitch / (Math.PI * dm));
  }
  /* Friction angle from coefficient. */
  function fricAngle(mu) { return Math.atan(Math.max(0, mu)); }

  /* VR is pure geometry — never affected by friction. */
  function calcVR() {
    switch (machineType) {
      case 'lever': return round2(leverEArm / leverLArm);
      case 'pulley':
        if (pulleyType === 'fixed') return 1;
        if (pulleyType === 'movable') return 2;
        return pulleyNum;
      case 'inclined': return round2(1 / Math.sin(deg2rad(inclAngle)));
      case 'wheel-axle': return round2(waWheelR / waAxleR);
      case 'screw': return round2(2 * Math.PI * screwHandle / screwPitch);
      case 'wedge': return round2(1 / (2 * Math.tan(wedgeHalfA())));
      default: return 1;
    }
  }

  /* Ideal MA (no friction) = VR for every classical simple machine. */
  function calcMAIdeal() { return calcVR(); }

  /* Actual MA — includes friction losses when useFriction is on. */
  function calcMA() {
    if (!useFriction) return calcMAIdeal();
    /* Inclined plane in lowering mode: ratio of L/E loses meaning when E is what
       gravity supplies; keep the ideal lifting MA so the badge stays interpretable. */
    if (machineType === 'inclined' && inclDirection === -1) return calcMAIdeal();
    var L = calcLoad(), E = calcEffort();
    if (E <= 0) return 0;
    return round2(L / E);
  }

  /* Efficiency η = MA_actual / VR.  Always ≤ 100 % when friction is active. */
  function calcEfficiency() {
    var vr = calcVR();
    if (vr <= 0) return 0;
    var ma = calcMA();
    return Math.max(0, Math.min(100, round2(ma / vr * 100)));
  }

  /* Small bearing / pivot efficiency factors used only when useFriction is on. */
  var LEVER_ETA  = 0.95;   /* fulcrum friction loss (~5%) */
  var WA_ETA     = 0.92;   /* axle bearing loss (~8%) */

  /* Effort required at the input given current state. With friction when enabled. */
  function calcEffort() {
    switch (machineType) {
      case 'lever': {
        var idealE = leverLoad * leverLArm / leverEArm;
        return round2(useFriction ? idealE / LEVER_ETA : idealE);
      }

      case 'pulley': {
        var vrP = calcVR();
        if (vrP <= 0) return pulleyLoad;
        var idealE = pulleyLoad / vrP;
        if (!useFriction) return round2(idealE);
        /* Per-sheave loss compounds: η_total ≈ η_per^n where n is sheaves bearing load. */
        var nSheaves = Math.max(1, vrP);
        var etaTotal = Math.pow(pulleyEtaPerSheave, nSheaves);
        return round2(idealE / etaTotal);
      }

      case 'inclined': {
        var sinA = Math.sin(deg2rad(inclAngle));
        var cosA = Math.cos(deg2rad(inclAngle));
        var mu = useFriction ? inclMu : 0;
        if (inclDirection === 1) {
          /* Pushing the load UP the ramp: friction opposes motion (down the ramp). */
          return round2(inclLoad * (sinA + mu * cosA));
        } else {
          /* Lowering the load DOWN the ramp: friction opposes motion (up the ramp). */
          var e = inclLoad * (sinA - mu * cosA);
          /* If sinθ ≤ μ cosθ (tan θ ≤ μ) the load is self-locking — gravity alone won't move it. */
          return round2(Math.max(0, e));
        }
      }

      case 'wheel-axle': {
        var ma = waWheelR / waAxleR;
        if (ma <= 0) return waLoad;
        var idealEwa = waLoad / ma;
        return round2(useFriction ? idealEwa / WA_ETA : idealEwa);
      }

      case 'screw': {
        var maScI = 2 * Math.PI * screwHandle / screwPitch;
        if (maScI <= 0) return screwLoad;
        if (!useFriction) return round2(screwLoad / maScI);
        /* Real screw raising load: P = W·tan(λ+φ)·d_m / (2L).
           Equivalent: P_real = P_ideal / η, where η = tan λ / tan(λ+φ). */
        var lam = screwLeadA();
        var phi = fricAngle(screwMu);
        var tanSum = Math.tan(lam + phi);
        if (tanSum <= 0) return screwLoad;
        var eta = Math.tan(lam) / tanSum;
        var idealE2 = screwLoad / maScI;
        return round2(idealE2 / Math.max(0.01, eta));
      }

      case 'wedge': {
        if (!useFriction) return wedgeForce;
        /* Symmetric wedge driving against a load W on each face.
           Driving force F = 2W·tan(α/2 + φ).  Ideal F_id = 2W·tan(α/2) = W/MA_ideal.
           Here `wedgeForce` is the user's driving force; we expose the actual load it can
           split given friction.  Effort readout = user-set driving force. */
        return wedgeForce;
      }
      default: return 0;
    }
  }

  function calcLoad() {
    switch (machineType) {
      case 'lever': return leverLoad;
      case 'pulley': return pulleyLoad;
      case 'inclined': return inclLoad;
      case 'wheel-axle': return waLoad;
      case 'screw': return screwLoad;
      case 'wedge': {
        var halfA = wedgeHalfA();
        var mu = useFriction ? wedgeMu : 0;
        var tanSum = Math.tan(halfA + fricAngle(mu));
        if (tanSum <= 0) return 0;
        /* W = F / (2·tan(α/2 + φ)) — load per face that the driving force can overcome. */
        return round2(wedgeForce / (2 * tanSum));
      }
      default: return 0;
    }
  }

  /* Self-locking detection for screws, wedges, inclined planes.
     Returns 'locked', 'unlocked', or 'na'. */
  function selfLockStatus() {
    if (!useFriction) return 'na';
    if (machineType === 'screw') {
      var lam = screwLeadA();
      var phi = fricAngle(screwMu);
      return phi >= lam ? 'locked' : 'unlocked';
    }
    if (machineType === 'wedge') {
      /* A symmetric wedge is self-holding if its half-angle ≤ friction angle. */
      var halfA = wedgeHalfA();
      var phiW = fricAngle(wedgeMu);
      return halfA <= phiW ? 'locked' : 'unlocked';
    }
    if (machineType === 'inclined') {
      var rampA = deg2rad(inclAngle);
      var phiI = fricAngle(inclMu);
      return rampA <= phiI ? 'locked' : 'unlocked';
    }
    return 'na';
  }

  /* ================================================================
     DRAWING HELPERS
     ================================================================ */
  function drawArrow(x1, y1, x2, y2, color, lw) {
    ctx.strokeStyle = color; ctx.fillStyle = color;
    ctx.lineWidth = lw || 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var angle = Math.atan2(y2 - y1, x2 - x1);
    var hl = 10 + (lw || 3);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle - 0.4), y2 - hl * Math.sin(angle - 0.4));
    ctx.lineTo(x2 - hl * Math.cos(angle + 0.4), y2 - hl * Math.sin(angle + 0.4));
    ctx.closePath(); ctx.fill();
  }

  function drawLabel(x, y, text, color, size) {
    ctx.font = '700 ' + (size || 12) + 'px "Segoe UI", sans-serif';
    ctx.fillStyle = color || '#dde3f0';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
  }

  /* ── On-canvas HUD ────────────────────────────────────────────────
     MA / VR / efficiency (and the self-locking state when it applies) used to
     live in a row of DOM chips above the canvas. They belong on the canvas:
     they are readings from the machine, they now sit in the dead space every
     layout leaves in its top-left corner, and the page loses a whole row of
     chrome. The machine name is not repeated here because every machine
     already draws its own title.                                          */
  var hud = { ma: '1.00', vr: '1.00', eff: '100%', lock: null };

  /* Where the next corner overlay may start — drawHUD sets it, the idle hint
     reads it, so the stack cannot overlap itself however many chips there are. */
  var hudNextY = 44;

  /* Row 1 is the three always-present readings. The self-locking chip goes on
     its own row: adding it inline pushed the group under the centred machine
     title, which is up to ~300px wide. */
  function hudRows() {
    var rows = [[
      { k: 'MA', v: hud.ma, c: '#ce93d8' },
      { k: 'VR', v: hud.vr, c: '#ce93d8' },
      { k: 'η', v: hud.eff, c: '#3ddc84' }
    ]];
    if (hud.lock) rows.push([{ k: '', v: hud.lock.text, c: hud.lock.color }]);
    return rows;
  }

  /* Measured up-front so the idle hint, drawn from inside the machine render,
     knows exactly where the stack ends. */
  function hudLayout() {
    var rows = hudRows(), y = 20;
    for (var i = 0; i < rows.length; i++) {
      var s = hudScale();
      var wide = rowWidth(rows[i], s);
      if (wide > HUD_MAX_W) s = Math.max(1, s * HUD_MAX_W / wide);
      y += 21 * s + 4 * s;
    }
    return y;
  }

  function drawHUD() {
    var rows = hudRows(), y = 20;
    for (var i = 0; i < rows.length; i++) y = drawChipRow(rows[i], y);
    hudNextY = y;
  }

  /* The canvas is drawn in fixed 900x480 logical units but displayed as small
     as ~325 CSS px on a phone, where a 12px logical chip renders at about 4px.
     Scale the overlay up on narrow canvases so it stays readable; the art
     itself is unaffected. */
  function hudScale() {
    var cssW = cvs.getBoundingClientRect().width || W;
    return Math.max(1, Math.min(1.9, 620 / Math.max(200, cssW)));
  }

  /* Every machine centres its own title, the widest of which starts near
     x = 285. The HUD must never grow into it, so the scale is capped to
     whatever actually fits the corner rather than trusted blindly. */
  var HUD_MAX_W = 262;

  function rowWidth(chips, s) {
    var total = 0;
    ctx.save();
    for (var i = 0; i < chips.length; i++) {
      ctx.font = '600 ' + (9 * s).toFixed(1) + 'px "Segoe UI", system-ui, sans-serif';
      var kw = chips[i].k ? ctx.measureText(chips[i].k).width + 5 * s : 0;
      ctx.font = '700 ' + (12 * s).toFixed(1) + 'px "JetBrains Mono","Courier New",monospace';
      total += 22 * s + kw + ctx.measureText(chips[i].v).width + (i ? 6 * s : 0);
    }
    ctx.restore();
    return total;
  }

  /* Draws one row of chips at vertical centre `y`; returns the centre for the
     next row. */
  function drawChipRow(chips, y) {
    var s = hudScale();
    var wide = rowWidth(chips, s);
    if (wide > HUD_MAX_W) s = Math.max(1, s * HUD_MAX_W / wide);
    ctx.save();
    ctx.textBaseline = 'middle';
    var x = 14, h = 21 * s, gap = 6 * s;
    var fk = (9 * s).toFixed(1), fv = (12 * s).toFixed(1);
    for (var i = 0; i < chips.length; i++) {
      var ch = chips[i];
      ctx.font = '600 ' + fk + 'px "Segoe UI", system-ui, sans-serif';
      var kw = ch.k ? ctx.measureText(ch.k).width + 5 * s : 0;
      ctx.font = '700 ' + fv + 'px "JetBrains Mono","Courier New",monospace';
      var vw = ctx.measureText(ch.v).width;
      var padX = 11 * s;
      var w = padX + kw + vw + padX;

      ctx.fillStyle = 'rgba(13,17,30,0.82)';
      ctx.strokeStyle = 'rgba(139,157,195,0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(x, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();

      var tx = x + padX;
      ctx.textAlign = 'left';
      if (ch.k) {
        ctx.font = '600 ' + fk + 'px "Segoe UI", system-ui, sans-serif';
        ctx.fillStyle = '#6b7a99';
        ctx.fillText(ch.k, tx, y + 0.5);
        tx += kw;
      }
      ctx.font = '700 ' + fv + 'px "JetBrains Mono","Courier New",monospace';
      ctx.fillStyle = ch.c;
      ctx.fillText(ch.v, tx, y + 0.5);

      x += w + gap;
    }
    ctx.restore();
    return y + h + 4 * s;
  }

  /* Shared idle prompt. Every machine used to place this itself, and three of
     them put it straight on top of the apparatus (behind the screw shaft,
     inside the ramp, inside the wedge) while the block & tackle pushed it to
     y=465 where it collided with the status line and was clipped by the
     480-tall canvas. One pill, one reserved spot: the top-left corner, which
     is empty in all six layouts because every machine title is centred. */
  function drawIdleHint(text) {
    ctx.save();
    var s = hudScale();
    /* Same corner budget as the chips: never grow into the centred title. */
    ctx.font = '600 ' + (11 * s).toFixed(1) + 'px "Segoe UI", system-ui, sans-serif';
    var full = ctx.measureText(text).width + 18 * s;
    if (full > HUD_MAX_W) s = Math.max(1, s * HUD_MAX_W / full);
    ctx.font = '600 ' + (11 * s).toFixed(1) + 'px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var pad = 9 * s, x = 14, y = hudNextY + 7 * s;   /* stacks under the HUD rows */
    var tw = ctx.measureText(text).width;
    var pulse = 0.55 + 0.45 * Math.sin(animClock() / 520);
    ctx.fillStyle = 'rgba(13,17,30,0.88)';
    ctx.strokeStyle = 'rgba(107,122,153,' + (0.35 + 0.3 * pulse) + ')';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y - 11 * s, tw + pad * 2, 22 * s, 11 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(150,165,195,' + (0.7 + 0.3 * pulse) + ')';
    ctx.fillText(text, x + pad, y + 0.5);
    ctx.restore();
  }
  /* The idle pulse needs a clock even when no animation loop is running. */
  function animClock() { return (typeof performance !== 'undefined' ? performance.now() : 0); }

  function drawDimLine(x1, y1, x2, y2, label, color) {
    ctx.strokeStyle = color || '#6b7a99'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.setLineDash([]);
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillStyle = color || '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText(label, mx, my - 8);
  }

  /* ================================================================
     MATERIAL HELPERS — shared apparatus rendering (all 6 machines).
     Geometry-preserving: these change how a shape is FILLED/STROKED,
     never where it sits, so every anchor, arrow and hit-test is intact.
     ================================================================ */

  /* Multiply a #rrggbb hex by a factor → 'rgb()' string (darken <1 / lighten >1). */
  function shadeHex(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, ((n >> 16) & 255) * f) | 0;
    var g = Math.min(255, ((n >> 8) & 255) * f) | 0;
    var b = Math.min(255, (n & 255) * f) | 0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  /* Soft elliptical contact shadow on a surface — grounds an object so it
     doesn't float. Draw BEFORE the object, on the surface it rests on. */
  function contactShadow(x, y, rx, ry, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, rx);
    g.addColorStop(0, 'rgba(0,0,0,' + (a == null ? 0.4 : a) + ')');
    g.addColorStop(0.7, 'rgba(0,0,0,' + (a == null ? 0.16 : a * 0.4) + ')');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.translate(x, y); ctx.scale(1, (ry || rx * 0.28) / rx);
    ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
  }

  /* Cylindrical steel rod along exact endpoints — 3 layered round-cap strokes
     (dark base → mid body → thin offset highlight). Drop-in for any flat line. */
  function metalRod(x1, y1, x2, y2, w, base) {
    base = base || '#8592ab';
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = shadeHex(base, 0.48); ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = base; ctx.lineWidth = w * 0.7;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var nx = (y2 - y1), ny = -(x2 - x1), L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
    ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = Math.max(1, w * 0.16);
    var o = w * 0.24;
    ctx.beginPath(); ctx.moveTo(x1 + nx * o, y1 + ny * o); ctx.lineTo(x2 + nx * o, y2 + ny * o); ctx.stroke();
    ctx.restore();
  }

  /* Shaded sphere / bolt-head / pin — radial highlight offset to upper-left. */
  function domeSphere(x, y, r, base) {
    var g = ctx.createRadialGradient(x - r * 0.38, y - r * 0.38, r * 0.1, x, y, r);
    g.addColorStop(0, shadeHex(base, 1.55));
    g.addColorStop(0.5, base);
    g.addColorStop(1, shadeHex(base, 0.5));
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = shadeHex(base, 0.68); ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.24, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
  }

  /* Cast-iron hanging weight — trapezoidal block with a top bevel, cast body
     gradient and a lifting eye. Semantic outline colour preserved (green effort
     / red load). Returns nothing; draws with (x,y) = top-centre of the block. */
  function drawCastWeight(x, yTop, w, h, label, edge) {
    var half = w / 2;
    /* lifting eye */
    ctx.strokeStyle = shadeHex(edge, 0.8); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(x, yTop - 5, 4.5, Math.PI * 0.15, Math.PI * 0.85, true); ctx.stroke();
    /* body — slight trapezoid (wider at base), cast-iron vertical gradient tinted by edge */
    var g = ctx.createLinearGradient(x - half, yTop, x - half, yTop + h);
    g.addColorStop(0, shadeHex(edge, 0.55));
    g.addColorStop(0.12, shadeHex(edge, 0.9));
    g.addColorStop(0.5, shadeHex(edge, 0.42));
    g.addColorStop(1, shadeHex(edge, 0.28));
    ctx.beginPath();
    ctx.moveTo(x - half * 0.82, yTop);
    ctx.lineTo(x + half * 0.82, yTop);
    ctx.lineTo(x + half, yTop + h);
    ctx.lineTo(x - half, yTop + h);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.stroke();
    /* top bevel highlight */
    ctx.beginPath();
    ctx.moveTo(x - half * 0.82, yTop); ctx.lineTo(x + half * 0.82, yTop);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
    /* label */
    ctx.fillStyle = '#fff'; ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, yTop + h / 2 + 1);
  }

  /* Gripped T-handle — used where effort is applied UPWARD (2nd/3rd class
     levers), e.g. a jack handle or pump handle. A hanging weight there would
     read as a load pulled down by gravity, contradicting the upward force;
     an anatomical hand/fist at icon scale read ambiguously in testing, so
     this uses an unambiguous mechanical grip instead — a steel post with a
     crossbar knob, exactly the kind of handle a hand would pull upward on.
     (x, yTop) = top of the post; returns the icon's bottom Y so the caller
     can place a value/caption label beneath it without collision. */
  function drawHandGrip(x, yTop, fr, color) {
    var postLen = fr * 1.3;
    var barY = yTop + postLen;
    var barHalf = fr * 1.15;
    /* steel post from the beam down to the crossbar */
    metalRod(x, yTop, x, barY, 5, '#8592ab');
    /* crossbar — the part a hand wraps around, in the semantic effort colour */
    metalRod(x - barHalf, barY, x + barHalf, barY, 7, color);
    /* rounded knob caps at each end of the crossbar */
    domeSphere(x - barHalf, barY, 5.5, color);
    domeSphere(x + barHalf, barY, 5.5, color);
    /* centre collar where the post meets the crossbar */
    domeSphere(x, barY, 4.5, shadeHex(color, 0.85));
    return barY + 6;
  }

  /* ================================================================
     DRAW MACHINES — SIMULATE MODE
     ================================================================ */

  /* ── LEVER ────────────────────────────────────────────────────── */
  function drawLever() {
    var cx = W / 2, groundY = 320;   /* raised from 380 to centre the lever vertically */
    /* Scale must keep the WHOLE beam inside the canvas under every class.
       1st class: fulcrum at centre, each side independent → limit by max arm.
       2nd/3rd class: fulcrum at one end, beam extends to one side → limit by total. */
    var sideMargin = 60;             /* px from each edge to leave room for labels */
    var halfWidth  = W / 2 - sideMargin;
    var fullWidth  = W - 2 * sideMargin;
    var scaleClass1 = halfWidth / Math.max(leverEArm, leverLArm);
    var scaleClass23 = fullWidth / Math.max(leverEArm + leverLArm, 1);
    var scale = Math.min(140, leverClass === 1 ? scaleClass1 : scaleClass23);
    var eLen = leverEArm * scale;
    var lLen = leverLArm * scale;

    /* ── Position fulcrum, effort, load by class ── */
    var fulcrumX, eRelX, lRelX; /* relative to fulcrum: negative=left, positive=right */

    if (leverClass === 1) {
      /* 1st Class: E ── F ── L  (fulcrum between) */
      fulcrumX = cx;
      eRelX = -eLen;  /* effort to the left */
      lRelX = lLen;   /* load to the right */
    } else if (leverClass === 2) {
      /* 2nd Class: F ── L ── E  (fulcrum at left end, load in middle, effort at right) */
      fulcrumX = cx - (lLen + eLen) / 2 + 30;
      eRelX = lLen + eLen;  /* effort at far right */
      lRelX = lLen;         /* load in middle */
    } else {
      /* 3rd Class: F ── E ── L  (fulcrum at left end, effort in middle, load at right) */
      fulcrumX = cx - (eLen + lLen) / 2 + 30;
      eRelX = eLen;         /* effort in middle */
      lRelX = eLen + lLen;  /* load at far right */
    }

    /* ── Fulcrum visual ── */
    var fH = 50;
    var beamY = groundY - fH;

    /* Ground surface — steel bench band with a bright front edge so objects sit on it */
    var gndG = ctx.createLinearGradient(0, groundY, 0, groundY + 12);
    gndG.addColorStop(0, '#2b3346'); gndG.addColorStop(1, '#141a26');
    ctx.fillStyle = gndG;
    ctx.fillRect(40, groundY, W - 80, 12);
    ctx.fillStyle = 'rgba(150,168,205,0.8)';
    ctx.fillRect(40, groundY, W - 80, 1.5);

    if (leverClass === 1) {
      /* 1st class: cast-iron knife-edge fulcrum */
      var fW = 40;
      contactShadow(fulcrumX, groundY + 2, fW * 0.85, 6, 0.42);
      ctx.beginPath();
      ctx.moveTo(fulcrumX, beamY);
      ctx.lineTo(fulcrumX - fW / 2, groundY);
      ctx.lineTo(fulcrumX + fW / 2, groundY);
      ctx.closePath();
      /* horizontal gradient = light from upper-left across the cast body */
      var fGrad = ctx.createLinearGradient(fulcrumX - fW / 2, 0, fulcrumX + fW / 2, 0);
      fGrad.addColorStop(0, '#5b6479');
      fGrad.addColorStop(0.42, '#8a93a8');
      fGrad.addColorStop(0.55, '#6f7890');
      fGrad.addColorStop(1, '#3a4152');
      ctx.fillStyle = fGrad;
      ctx.fill();
      ctx.strokeStyle = '#2a303e'; ctx.lineWidth = 1.5; ctx.stroke();
      /* bright hardened knife-edge down the front ridge */
      ctx.beginPath(); ctx.moveTo(fulcrumX, beamY + 2); ctx.lineTo(fulcrumX, groundY - 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1.5; ctx.stroke();
      /* Pivot pin */
      domeSphere(fulcrumX, beamY, 6, '#c9d2e6');
    } else {
      /* 2nd/3rd class: wheel-style fulcrum at beam end —
         like a wheelbarrow wheel or a pivot pin.
         Wheel fills space between beam and ground perfectly */
      var wheelR = fH / 2;  /* 25px — fits exactly in the 50px gap */
      var wheelCY = beamY + wheelR; /* center between beam and ground */

      /* Support leg / axle fork */
      ctx.strokeStyle = '#6a1b7a'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fulcrumX - 12, groundY);
      ctx.lineTo(fulcrumX - 4, wheelCY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fulcrumX + 12, groundY);
      ctx.lineTo(fulcrumX + 4, wheelCY);
      ctx.stroke();

      /* Wheel outer rim */
      ctx.beginPath(); ctx.arc(fulcrumX, wheelCY, wheelR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(156,39,176,.15)';
      ctx.fill();
      ctx.strokeStyle = '#9c27b0'; ctx.lineWidth = 3; ctx.stroke();

      /* Wheel inner ring */
      ctx.beginPath(); ctx.arc(fulcrumX, wheelCY, wheelR * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = '#7b5ea7'; ctx.lineWidth = 1.5; ctx.stroke();

      /* Spokes */
      ctx.strokeStyle = '#6a1b7a'; ctx.lineWidth = 2;
      for (var sp = 0; sp < 6; sp++) {
        var sa = sp * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(fulcrumX + Math.cos(sa) * 5, wheelCY + Math.sin(sa) * 5);
        ctx.lineTo(fulcrumX + Math.cos(sa) * (wheelR - 4), wheelCY + Math.sin(sa) * (wheelR - 4));
        ctx.stroke();
      }

      /* Axle hub (connects to beam) */
      ctx.beginPath(); ctx.arc(fulcrumX, wheelCY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ce93d8'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      /* Axle rod from wheel hub up to beam */
      ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fulcrumX, wheelCY);
      ctx.lineTo(fulcrumX, beamY);
      ctx.stroke();
    }

    /* ── Beam tilt angle ── */
    var torqueE = leverEffort * leverEArm;
    var torqueL = leverLoad * leverLArm;
    /* Clamp tilt so the longest arm's endpoint stays within ~60 px of beamY —
       keeps the beam inside the canvas and clear of the ground line. */
    var maxArmPx = Math.max(eLen, lLen, 1);
    var pxBudget = 40;   /* keep beam clear of the ground line (groundY − beamY = 50 px) */
    var maxAngle = Math.min(0.28, Math.asin(Math.min(0.99, pxBudget / maxArmPx)));
    var balanced = Math.abs(torqueE - torqueL) < 0.5;

    /* Calculate target: positive = clockwise (right side dips) */
    if (balanced) {
      leverTargetAngle = 0;
    } else {
      var torqueDiff = (torqueL - torqueE) / Math.max(torqueE + torqueL, 1);
      leverTargetAngle = torqueDiff * maxAngle * 1.5;
    }
    leverTargetAngle = Math.max(-maxAngle, Math.min(maxAngle, leverTargetAngle));

    /* Use animated angle if animating, else show horizontal (setup phase) */
    var angle = animating ? leverAnimAngle : 0;

    /* ── Draw beam rotated around fulcrum pivot ── */
    ctx.save();
    ctx.translate(fulcrumX, beamY);
    ctx.rotate(angle);

    /* Beam bar */
    var beamThickness = 10;
    var leftEnd, rightEnd;
    if (leverClass === 1) {
      leftEnd = -eLen;
      rightEnd = lLen;
    } else {
      /* 2nd/3rd class: fulcrum is at one end — beam extends slightly past fulcrum
         where the axle/wheel connects */
      leftEnd = -30;
      rightEnd = Math.max(eRelX, lRelX);
    }

    /* Beam — rolled-steel bar: vertical gradient (light top → dark bottom) + specular */
    var bGrad = ctx.createLinearGradient(0, -beamThickness / 2, 0, beamThickness / 2);
    bGrad.addColorStop(0, '#9aa6c0');
    bGrad.addColorStop(0.35, '#6e7c9c');
    bGrad.addColorStop(0.52, '#586686');
    bGrad.addColorStop(1, '#3a4560');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.moveTo(leftEnd, -beamThickness / 2);
    ctx.lineTo(rightEnd, -beamThickness / 2);
    ctx.lineTo(rightEnd + 4, 0);
    ctx.lineTo(rightEnd, beamThickness / 2);
    ctx.lineTo(leftEnd, beamThickness / 2);
    ctx.lineTo(leftEnd - 4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2c3448'; ctx.lineWidth = 1; ctx.stroke();
    /* Specular streak just below the top edge */
    ctx.beginPath();
    ctx.moveTo(leftEnd, -beamThickness / 2 + 2); ctx.lineTo(rightEnd, -beamThickness / 2 + 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.4; ctx.stroke();

    /* Small marks at E, L, F positions on beam */
    var markH = 5;
    ctx.strokeStyle = '#8899bb'; ctx.lineWidth = 1;
    /* Fulcrum position mark (always at 0) */
    ctx.beginPath(); ctx.moveTo(0, -markH - beamThickness / 2); ctx.lineTo(0, markH + beamThickness / 2); ctx.stroke();

    /* For 2nd/3rd class: draw pivot bracket connecting fulcrum to beam */
    if (leverClass !== 1) {
      /* Thick pivot bracket — visual connector between beam and fulcrum */
      ctx.fillStyle = '#9c27b0';
      ctx.beginPath();
      ctx.rect(-10, -beamThickness / 2 - 2, 20, beamThickness + 4);
      ctx.fill();
      ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 1.5; ctx.stroke();

      /* Pivot pin */
      ctx.fillStyle = '#ce93d8';
      ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

      /* "F" label above bracket */
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ce93d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('F', 0, -beamThickness / 2 - 10);

      /* Left end cap to show beam edge */
      ctx.fillStyle = '#9c27b0';
      ctx.beginPath();
      ctx.rect(leftEnd, -beamThickness / 2 - 1, 8, beamThickness + 2);
      ctx.fill();
    }

    /* ── Effort application point ── */
    ctx.save();
    ctx.translate(eRelX, beamThickness / 2);
    ctx.rotate(-angle); /* counter-rotate so it stays upright regardless of beam tilt */

    var eLabel = fmtN(leverEffort);
    if (leverClass === 1) {
      /* 1st class: effort PUSHES DOWN — a hanging cast weight is the correct symbol
         (gravity supplies exactly this force) */
      ctx.strokeStyle = '#3ddc8480'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 35); ctx.stroke();
      ctx.font = '700 11px "Segoe UI", sans-serif';
      var eTextW = ctx.measureText(eLabel).width;
      var eWBase = Math.max(22, Math.min(36, leverEffort / 12));
      var eWSize = Math.max(eWBase, eTextW + 12);
      drawCastWeight(0, 35, eWSize, eWBase, eLabel, '#3ddc84');  /* height tied to magnitude */
      ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillText('Effort', 0, 35 + eWBase + 14);
    } else {
      /* 2nd/3rd class: effort LIFTS UP — a hanging weight would misread as a load
         pulled down by gravity, contradicting the upward force. Show a hand
         gripping the handle instead. */
      var fr = Math.max(13, Math.min(18, leverEffort / 14));
      var gripBottomY = drawHandGrip(0, 6, fr, '#3ddc84');
      ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText(eLabel, 0, gripBottomY + 12);
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillText('Effort', 0, gripBottomY + 27);
    }
    /* Green dot on beam */
    ctx.restore();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.arc(eRelX, 0, 5, 0, Math.PI * 2); ctx.fill();

    /* ── Load weight hanging from beam ── */
    ctx.save();
    ctx.translate(lRelX, beamThickness / 2);
    ctx.rotate(-angle); /* counter-rotate so weight hangs vertical */

    /* Rope */
    ctx.strokeStyle = '#ff555580'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 35); ctx.stroke();

    /* Weight block — auto-fits label */
    var lLabel = fmtN(leverLoad);
    ctx.font = '700 11px "Segoe UI", sans-serif';
    var lTextW = ctx.measureText(lLabel).width;
    var lWBase = Math.max(22, Math.min(44, leverLoad / 10));
    var lWSize = Math.max(lWBase, lTextW + 12);
    drawCastWeight(0, 35, lWSize, lWBase, lLabel, '#ff5555');

    /* Load caption */
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('Load', 0, 35 + lWBase + 14);
    ctx.restore();
    ctx.fillStyle = '#ff5555';
    ctx.beginPath(); ctx.arc(lRelX, 0, 5, 0, Math.PI * 2); ctx.fill();

    ctx.restore(); /* end beam rotation */

    /* ── Force arrows in WORLD space — gravity and applied force stay vertical ──
       eRelX/lRelX in beam-local; transform to canvas coords using the beam angle.     */
    var _eWX = fulcrumX + eRelX * Math.cos(angle);
    var _eWY = beamY    + eRelX * Math.sin(angle);
    var _lWX = fulcrumX + lRelX * Math.cos(angle);
    var _lWY = beamY    + lRelX * Math.sin(angle);
    var _aLen = 58;
    ctx.font = '700 11px "Segoe UI", sans-serif'; ctx.textBaseline = 'middle';
    if (leverClass === 1) {
      /* 1st class: effort pushes beam DOWN (gravity direction) */
      drawArrow(_eWX, _eWY - _aLen, _eWX, _eWY - 5, '#3ddc84', 4);
      ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
      ctx.fillText('E \u2193', _eWX, _eWY - _aLen - 10);
    }
    /* 2nd/3rd class (person lifts handle UPWARD) intentionally has no separate
       world-space arrow here: a 4px-wide green line drawn on top of the
       T-handle's gray steel post visually erased the post's own colour,
       collapsing "gray post + green handle" into an undifferentiated green
       blob. The T-handle icon (a post into the beam + a gripped crossbar)
       already reads as "force applied here, into the beam" on its own; the
       animation's motion arrows still show live direction during Simulate. */
    /* Load: gravity always pulls straight down */
    drawArrow(_lWX, _lWY - _aLen, _lWX, _lWY - 5, '#ff5555', 4);
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('L \u2193', _lWX, _lWY - _aLen - 10);

    /* ── Motion arrows when animating (show which end moves up/down) ── */
    if (animating && Math.abs(angle) > 0.02) {
      /* World coords: transform beam-local (px,0) through translate(fulcrum)+rotate(angle) */
      var eEndAbsX = fulcrumX + eRelX * Math.cos(angle);
      var eEndAbsY = beamY    + eRelX * Math.sin(angle);
      var lEndAbsX = fulcrumX + lRelX * Math.cos(angle);
      var lEndAbsY = beamY    + lRelX * Math.sin(angle);

      /* Effort end motion arrow */
      var eMovesDown = (eEndAbsY > beamY);
      var eArrowClr = eMovesDown ? '#ff8a65' : '#3ddc84';
      /* Real-world displacement = effort-arm length × sin(angle); follows SI/Imp toggle. */
      var eDispM = Math.abs(Math.sin(angle) * leverEArm);
      ctx.globalAlpha = 0.8;
      if (eMovesDown) {
        drawArrow(eEndAbsX + 20, eEndAbsY - 15, eEndAbsX + 20, eEndAbsY + 15, eArrowClr, 3);
      } else {
        drawArrow(eEndAbsX + 20, eEndAbsY + 15, eEndAbsX + 20, eEndAbsY - 15, eArrowClr, 3);
      }
      ctx.font = '700 10px "Segoe UI", sans-serif';
      ctx.fillStyle = eArrowClr; ctx.textAlign = 'left';
      ctx.fillText((eMovesDown ? '\u2193 ' : '\u2191 ') + fmtM(eDispM), eEndAbsX + 30, eEndAbsY);

      /* Load end motion arrow */
      var lMovesDown = (lEndAbsY > beamY);
      var lArrowClr = lMovesDown ? '#ff8a65' : '#3ddc84';
      var lDispM = Math.abs(Math.sin(angle) * leverLArm);
      if (lMovesDown) {
        drawArrow(lEndAbsX - 20, lEndAbsY - 15, lEndAbsX - 20, lEndAbsY + 15, lArrowClr, 3);
      } else {
        drawArrow(lEndAbsX - 20, lEndAbsY + 15, lEndAbsX - 20, lEndAbsY - 15, lArrowClr, 3);
      }
      ctx.fillStyle = lArrowClr; ctx.textAlign = 'right';
      ctx.fillText((lMovesDown ? '\u2193 ' : '\u2191 ') + fmtM(lDispM), lEndAbsX - 30, lEndAbsY);
      ctx.globalAlpha = 1.0;
    }

    /* ── "Press Simulate" prompt when NOT animating ── */
    if (!animating && !animDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      drawIdleHint('\u25B6 Press Simulate');
      ctx.globalAlpha = 1.0;
    }

    /* ── Fulcrum label ── */
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ce93d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Fulcrum', fulcrumX, groundY + 18);

    /* ── Dimension lines below ground ── */
    var dimY1 = groundY + 34;
    var dimY2 = groundY + 50;
    drawDimLine(fulcrumX, dimY1, fulcrumX + eRelX, dimY1, round1(leverEArm) + ' m (effort arm)', '#3ddc84');
    drawDimLine(fulcrumX, dimY2, fulcrumX + lRelX, dimY2, round1(leverLArm) + ' m (load arm)', '#ff5555');

    /* ── Position labels on beam ── */
    var classNames = ['', '1st Class \u2014 Fulcrum between E & L', '2nd Class \u2014 Load between F & E', '3rd Class \u2014 Effort between F & L'];
    var classExamples = ['', 'Seesaw  \u2022  Crowbar  \u2022  Scissors', 'Wheelbarrow  \u2022  Nutcracker  \u2022  Bottle Opener', 'Fishing Rod  \u2022  Tweezers  \u2022  Broom'];
    drawLabel(cx, 28, classNames[leverClass], '#ce93d8', 15);
    drawLabel(cx, 48, classExamples[leverClass], '#6b7a99', 11);

    /* ── MA and balance indicator ── */
    var maIdealLv = round2(leverEArm / leverLArm);
    var maLbl = useFriction ? 'MA = ' + round2(calcMA()) + ' (ideal ' + maIdealLv + ')' : 'MA = ' + maIdealLv;
    if (balanced) {
      drawLabel(cx, 70, maLbl + '     Balanced! \u2696', '#f5c842', 13);
    } else if (torqueE > torqueL) {
      drawLabel(cx, 70, maLbl + '     Effort wins \u2014 load rises \u2191', '#3ddc84', 13);
    } else {
      drawLabel(cx, 70, maLbl + '     Load wins \u2014 load drops \u2193', '#ff5555', 13);
    }

    /* ── Schematic layout indicator ── */
    var schY = 92;
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    if (leverClass === 1) ctx.fillText('E \u2500\u2500\u2500\u2500\u2500\u2500\u2500 F \u2500\u2500\u2500\u2500\u2500\u2500\u2500 L', cx, schY);
    else if (leverClass === 2) ctx.fillText('F \u2500\u2500\u2500\u2500\u2500\u2500\u2500 L \u2500\u2500\u2500\u2500\u2500\u2500\u2500 E', cx, schY);
    else ctx.fillText('F \u2500\u2500\u2500\u2500\u2500\u2500\u2500 E \u2500\u2500\u2500\u2500\u2500\u2500\u2500 L', cx, schY);
  }

  /* ── PULLEY ───────────────────────────────────────────────────── */

  /* Helper: draw a realistic pulley wheel */
  function drawPulleyWheel(x, y, r, rotation) {
    rotation = rotation || 0;
    /* Sheave face — radial depth (light centre → dark rim), cast metal disc */
    var faceG = ctx.createRadialGradient(x - r * 0.25, y - r * 0.25, r * 0.1, x, y, r);
    faceG.addColorStop(0, 'rgba(206,147,216,0.36)');
    faceG.addColorStop(0.62, 'rgba(140,79,160,0.26)');
    faceG.addColorStop(1, 'rgba(70,38,84,0.42)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = faceG; ctx.fill();
    /* Machined rim: dark base ring + bright inner highlight */
    ctx.strokeStyle = shadeHex('#ab47bc', 0.5); ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#c98fda'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, r - 2.2, 0, Math.PI * 2); ctx.stroke();
    /* Rope groove */
    ctx.strokeStyle = 'rgba(120,70,140,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, Math.PI * 2); ctx.stroke();
    /* Spokes (rotate with the wheel) */
    for (var s = 0; s < 4; s++) {
      var a = rotation + s * Math.PI / 2;
      metalRod(x + Math.cos(a) * 4, y + Math.sin(a) * 4,
               x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3), 3, '#9a6fb5');
    }
    /* Axle hub bolt */
    domeSphere(x, y, Math.max(4, r * 0.16), '#e0c4ef');
  }

  /* Helper: draw a hanging load as a cast-iron weight.  Auto-widens so the label
     always fits.  (x, y) = top-centre; delegates to the shared cast-weight render. */
  function drawWeightBlock(x, y, w, h, label, color) {
    ctx.font = '700 11px "Segoe UI", sans-serif';
    var tw = ctx.measureText(label).width;
    var fitW = Math.max(w, tw + 14);          /* expand if text would overflow */
    drawCastWeight(x, y, fitW, h, label, color);
  }

  /* Helper: draw the support beam/ceiling */
  function drawSupportBeam(x, y, width) {
    var grad = ctx.createLinearGradient(x, y, x, y + 14);
    grad.addColorStop(0, '#3a4060');
    grad.addColorStop(1, '#252b40');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, 14);
    ctx.strokeStyle = '#4a5a7a'; ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, 14);
    /* Ceiling line */
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 20, y); ctx.lineTo(x + width + 20, y); ctx.stroke();
    /* Hatch marks for ceiling */
    ctx.strokeStyle = '#3a4a6a'; ctx.lineWidth = 1;
    for (var i = x - 15; i < x + width + 20; i += 12) {
      ctx.beginPath(); ctx.moveTo(i, y); ctx.lineTo(i - 8, y - 8); ctx.stroke();
    }
  }

  function drawPulley() {
    var cx = W / 2;
    var topY = 55, pr = Math.max(18, Math.min(40, pulleyDiam * 100));
    var lift = animating ? pulleyAnimDist : 0;
    var ropeRot = animating ? pulleyRopeOffset * 0.15 : 0;

    var typeLabel = pulleyType === 'fixed' ? 'Fixed Pulley' :
                    pulleyType === 'movable' ? 'Movable Pulley' : 'Block & Tackle';
    drawLabel(cx, 28, typeLabel, '#ce93d8', 16);

    if (pulleyType === 'fixed') {
      /* ── Fixed Pulley: direction change only ── */
      drawSupportBeam(cx - 90, topY, 180);
      /* Bracket hanging from beam */
      ctx.strokeStyle = '#4a5a7a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, topY + 14); ctx.lineTo(cx, topY + 14 + 10); ctx.stroke();

      var pulleyY = topY + 14 + 10 + pr;
      drawPulleyWheel(cx, pulleyY, pr, ropeRot);

      /* Rope */
      var ropeClr = '#f5c842';
      var loadBaseY = 340 - lift;
      var effortPullY = 340 + lift; /* effort side extends as load rises */
      ctx.strokeStyle = ropeClr; ctx.lineWidth = 2.5;
      /* Left side (effort) - goes down */
      ctx.beginPath(); ctx.moveTo(cx - pr, pulleyY); ctx.lineTo(cx - pr, Math.min(effortPullY, 400)); ctx.stroke();
      /* Arc over pulley */
      ctx.beginPath(); ctx.arc(cx, pulleyY, pr, Math.PI, 0); ctx.stroke();
      /* Right side (load) - goes down */
      ctx.beginPath(); ctx.moveTo(cx + pr, pulleyY); ctx.lineTo(cx + pr, loadBaseY); ctx.stroke();

      /* Effort arrow */
      var eArrY = Math.min(effortPullY, 390);
      drawArrow(cx - pr, eArrY - 70, cx - pr, eArrY - 5, '#3ddc84', 4);
      drawLabel(cx - pr - 50, eArrY - 40, 'E = ' + fmtN(pulleyEffort), '#3ddc84', 12);
      drawLabel(cx - pr, eArrY - 80, 'Effort \u2193', '#3ddc84', 10);

      /* Load block */
      drawWeightBlock(cx + pr, loadBaseY, 44, 38, fmtN(pulleyLoad), '#ff5555');
      drawLabel(cx + pr, loadBaseY + 52, 'Load', '#ff5555', 10);

      /* Info */
      drawLabel(cx, 430, 'MA = 1  \u2014  Direction change only (no force multiplication)', '#f5c842', 12);
      var reqE1 = calcEffort();   /* friction-aware — matches the animation gate */
      var ok1 = pulleyEffort >= reqE1;
      drawLabel(cx, 450, 'Required: ' + fmtN(reqE1) + ' | Your effort: ' + fmtN(pulleyEffort) + ' | ' + (ok1 ? '\u2714 Can lift' : '\u2718 Cannot lift'), ok1 ? '#3ddc84' : '#ff5555', 10);
      /* Rope count indicators */
      drawLabel(cx - pr - 10, pulleyY + pr + 15, '1', '#f5c842', 11);
      drawLabel(cx + pr + 10, pulleyY + pr + 15, '1', '#f5c842', 11);

    } else if (pulleyType === 'movable') {
      /* ── Movable Pulley: MA = 2 ── */
      drawSupportBeam(cx - 100, topY, 200);

      /* Fixed hook point (left) */
      var hookX = cx - 50;
      ctx.fillStyle = '#f5c842'; ctx.strokeStyle = '#e0a800'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(hookX, topY + 14 + 4, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      /* Movable pulley position */
      var movPulleyY = 210 - lift;
      drawPulleyWheel(cx, movPulleyY, pr, ropeRot);

      /* Rope */
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.5;
      /* Rope 1: fixed point straight down to left side of pulley */
      ctx.beginPath(); ctx.moveTo(hookX, topY + 14 + 9); ctx.lineTo(hookX, movPulleyY);
      ctx.lineTo(cx - pr, movPulleyY); ctx.stroke();
      /* Arc under pulley */
      ctx.beginPath(); ctx.arc(cx, movPulleyY, pr, Math.PI, 0, true); ctx.stroke();
      /* Rope 2: right side of pulley straight up — the free end the user pulls UP on */
      var effortX = cx + pr;
      ctx.beginPath();
      ctx.moveTo(effortX, movPulleyY);
      ctx.lineTo(effortX, topY + 30);
      ctx.stroke();

      /* Load hanging below pulley */
      ctx.strokeStyle = '#ff555580'; ctx.lineWidth = 2;
      var loadHangY = movPulleyY + pr + 5;
      ctx.beginPath(); ctx.moveTo(cx, loadHangY); ctx.lineTo(cx, loadHangY + 40); ctx.stroke();
      drawWeightBlock(cx, loadHangY + 40, 48, 40, fmtN(pulleyLoad), '#ff5555');
      drawLabel(cx, loadHangY + 95, 'Load', '#ff5555', 10);

      /* Effort arrow — a bare movable pulley is hauled UP on the free end
         (pulling down would need a fixed redirect sheave, i.e. a block & tackle) */
      drawArrow(effortX, topY + 110, effortX, topY + 45, '#3ddc84', 4);
      drawLabel(effortX + 60, topY + 78, 'E = ' + fmtN(pulleyEffort), '#3ddc84', 12);
      drawLabel(effortX, topY + 33, 'Effort \u2191', '#3ddc84', 10);

      /* Rope count labels */
      ctx.font = '700 14px "Courier New", monospace';
      ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.beginPath();
      ctx.arc(hookX - 1, movPulleyY - pr - 12, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245,200,66,.15)'; ctx.fill();
      ctx.fillStyle = '#f5c842';
      ctx.fillText('1', hookX - 1, movPulleyY - pr - 11);
      ctx.beginPath();
      ctx.arc(effortX, movPulleyY - pr - 12, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245,200,66,.15)'; ctx.fill();
      ctx.fillStyle = '#f5c842';
      ctx.fillText('2', effortX, movPulleyY - pr - 11);

      drawLabel(cx, 430, 'MA = 2  \u2014  Two rope sections support the load', '#f5c842', 12);
      var reqE2 = calcEffort();   /* friction-aware — matches the animation gate */
      var ok2 = pulleyEffort >= reqE2;
      drawLabel(cx, 450, 'Required: ' + fmtN(reqE2) + ' | Your effort: ' + fmtN(pulleyEffort) + ' | ' + (ok2 ? '\u2714 Can lift' : '\u2718 Cannot lift'), ok2 ? '#3ddc84' : '#ff5555', 10);

    } else {
      /* ── Block & Tackle ── */
      var n = pulleyNum;
      var topPulleys = Math.ceil(n / 2);
      var botPulleys = Math.floor(n / 2);
      var gap = Math.min(65, 320 / Math.max(n, 2));
      var bpr = Math.min(24, Math.max(14, 90 / Math.max(n, 2)));

      /* Support beam */
      var beamW = Math.max(200, topPulleys * gap + 80);
      drawSupportBeam(cx - beamW / 2, topY, beamW);

      var topRowY = topY + 14 + bpr + 12;
      var btmRowY = topRowY + 90 - lift;

      /* Upper block frame */
      var ubW = topPulleys * gap + 20;
      ctx.fillStyle = 'rgba(42,48,80,.5)';
      ctx.strokeStyle = '#4a5a7a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.rect(cx - ubW / 2, topRowY - bpr - 8, ubW, bpr * 2 + 16); ctx.fill(); ctx.stroke();
      drawLabel(cx, topRowY - bpr - 16, 'Fixed Block', '#6b7a99', 9);

      /* Lower block frame */
      if (botPulleys > 0) {
        var lbW = botPulleys * gap + 20;
        ctx.fillStyle = 'rgba(42,48,80,.5)';
        ctx.strokeStyle = '#4a5a7a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.rect(cx - lbW / 2, btmRowY - bpr - 8, lbW, bpr * 2 + 16); ctx.fill(); ctx.stroke();
        drawLabel(cx, btmRowY + bpr + 18, 'Movable Block', '#6b7a99', 9);
      }

      /* Draw top pulleys */
      for (var ti = 0; ti < topPulleys; ti++) {
        var tpx = cx - (topPulleys - 1) * gap / 2 + ti * gap;
        drawPulleyWheel(tpx, topRowY, bpr, ropeRot);
      }
      /* Draw bottom pulleys */
      for (var bi = 0; bi < botPulleys; bi++) {
        var bpx = cx - (botPulleys - 1) * gap / 2 + bi * gap;
        drawPulleyWheel(bpx, btmRowY, bpr, -ropeRot);
      }

      /* Rope threading.
         VR = n requires exactly n rope segments supporting the MOVABLE block:
         - odd n  → the rope's dead end anchors on the MOVABLE block, first wrap on a top sheave;
         - even n → the dead end anchors on the FIXED block, first wrap on a bottom sheave.
         Either way the hauling (effort) end leaves the last TOP sheave, pointing down. */
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.5;
      var pts = [];
      var oddN = (n % 2 === 1);
      for (var k = 0; k < n; k++) {
        var onTop = oddN ? (k % 2 === 0) : (k % 2 === 1);
        var idx = Math.floor(k / 2);
        if (onTop) {
          pts.push({ x: cx - (topPulleys - 1) * gap / 2 + idx * gap, y: topRowY, row: 'top' });
        } else {
          pts.push({ x: cx - (botPulleys - 1) * gap / 2 + idx * gap, y: btmRowY, row: 'bot' });
        }
      }

      var eRopeX = cx + beamW / 2 - 10;
      if (pts.length > 0) {
        /* Dead-end anchor point + strand to the first sheave.
           Top sheaves are entered on the LEFT (rope passes over, exits right);
           bottom sheaves are entered on the RIGHT (rope passes under, exits left). */
        var ax, ay, entryX;
        if (oddN) {
          ax = Math.max(cx - (botPulleys * gap + 20) / 2 + 6, pts[0].x - bpr);
          ay = btmRowY - bpr - 8;
          entryX = pts[0].x - bpr;
        } else {
          ax = pts[0].x + bpr;
          ay = topRowY + bpr + 8;
          entryX = pts[0].x + bpr;
        }
        /* Anchor dot on the block frame */
        ctx.fillStyle = '#f5c842';
        ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(entryX, pts[0].y); ctx.stroke();

        for (var ri = 0; ri < pts.length; ri++) {
          var p = pts[ri];
          /* Wrap: over a top sheave (enter left, exit right) / under a bottom sheave (enter right, exit left) */
          ctx.beginPath();
          if (p.row === 'top') ctx.arc(p.x, p.y, bpr, Math.PI, 0);
          else                 ctx.arc(p.x, p.y, bpr, 0, Math.PI);
          ctx.stroke();
          /* Strand to the next sheave */
          if (ri < pts.length - 1) {
            var nxt = pts[ri + 1];
            ctx.beginPath();
            if (p.row === 'top') { ctx.moveTo(p.x + bpr, p.y); ctx.lineTo(nxt.x + bpr, nxt.y); }
            else                 { ctx.moveTo(p.x - bpr, p.y); ctx.lineTo(nxt.x - bpr, nxt.y); }
            ctx.stroke();
          }
        }

        /* Free (hauling) end → leaves the last TOP sheave and drops to the effort hand,
           routed just clear of the movable block */
        var last = pts[pts.length - 1];
        eRopeX = Math.max(last.x + bpr, cx + (botPulleys * gap + 20) / 2 + 18);
        ctx.beginPath();
        ctx.moveTo(last.x + bpr, last.y);
        ctx.lineTo(eRopeX, last.y + 30);
        ctx.lineTo(eRopeX, 360);
        ctx.stroke();

        /* Number the n SUPPORTING strands (the hauling fall is not one of them) */
        var numY = (topRowY + btmRowY) / 2;
        ctx.font = '700 12px "Courier New", monospace';
        ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('1', (ax + entryX) / 2 - 10, numY);
        for (var ci = 0; ci < pts.length - 1; ci++) {
          var sOff = (pts[ci].row === 'top') ? bpr : -bpr;
          ctx.fillText(String(ci + 2), (pts[ci].x + pts[ci + 1].x) / 2 + sOff + (sOff > 0 ? 10 : -10), numY);
        }
      }

      /* Effort arrow */
      drawArrow(eRopeX, 300, eRopeX, 355, '#3ddc84', 4);
      drawLabel(eRopeX + 55, 330, 'E = ' + fmtN(pulleyEffort), '#3ddc84', 12);
      drawLabel(eRopeX, 290, 'Effort \u2193', '#3ddc84', 10);

      /* Load hanging from bottom block */
      var loadCX = cx;
      ctx.strokeStyle = '#ff555580'; ctx.lineWidth = 2;
      var loadTopY = btmRowY + bpr + (botPulleys > 0 ? 8 : 0) + 10;
      ctx.beginPath(); ctx.moveTo(loadCX, loadTopY); ctx.lineTo(loadCX, loadTopY + 30); ctx.stroke();
      drawWeightBlock(loadCX, loadTopY + 30, 55, 42, fmtN(pulleyLoad), '#ff5555');
      drawLabel(loadCX, loadTopY + 85, 'Load', '#ff5555', 10);

      drawLabel(cx, 432, 'MA = VR = ' + n + '  \u2014  ' + n + ' rope sections support the load', '#f5c842', 12);
      var reqEn = calcEffort();   /* friction-aware — matches the animation gate */
      var okn = pulleyEffort >= reqEn;
      drawLabel(cx, 452, 'Required: ' + fmtN(reqEn) + ' | Your effort: ' + fmtN(pulleyEffort) + ' | ' + (okn ? '\u2714 Can lift' : '\u2718 Cannot lift'), okn ? '#3ddc84' : '#ff5555', 10);
    }

    if (!animating && !animDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      drawIdleHint('\u25B6 Press Simulate');
      ctx.globalAlpha = 1.0;
    }
  }

  /* ── INCLINED PLANE ───────────────────────────────────────────── */
  function drawInclinedPlane() {
    var bx = 120, by = 360;
    var rampLen = 450;
    var rampH = rampLen * Math.sin(deg2rad(inclAngle));
    var rampW = rampLen * Math.cos(deg2rad(inclAngle));

    drawLabel(W / 2, 30, 'Inclined Plane (' + inclAngle + '\u00B0)', '#ab47bc', 15);

    /* Required effort calculation (direction-aware, friction-aware) */
    var sinA = Math.sin(deg2rad(inclAngle));
    var cosA = Math.cos(deg2rad(inclAngle));
    var requiredEffort = calcEffort();

    /* Ground — bench band with bright front edge (drawn first so ramp sits on it) */
    var iGnd = ctx.createLinearGradient(0, by, 0, by + 12);
    iGnd.addColorStop(0, '#2b3346'); iGnd.addColorStop(1, '#141a26');
    ctx.fillStyle = iGnd; ctx.fillRect(40, by, W - 80, 12);
    ctx.fillStyle = 'rgba(150,168,205,0.8)'; ctx.fillRect(40, by, W - 80, 1.5);

    /* Ramp — solid timber wedge with grain + a bright running surface along the incline */
    contactShadow((bx + bx + rampW) / 2, by + 2, rampW / 2, 6, 0.34);
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + rampW, by);
    ctx.lineTo(bx + rampW, by - rampH);
    ctx.closePath();
    var rampG = ctx.createLinearGradient(0, by - rampH, 0, by);
    rampG.addColorStop(0, '#9a6c3e');
    rampG.addColorStop(0.5, '#7d5730');
    rampG.addColorStop(1, '#5c3f22');
    ctx.fillStyle = rampG; ctx.fill();
    ctx.strokeStyle = '#3a2817'; ctx.lineWidth = 2; ctx.stroke();
    /* grain lines parallel to the incline surface (clipped to the wedge) */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(bx + rampW, by); ctx.lineTo(bx + rampW, by - rampH); ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = 'rgba(58,40,23,0.5)'; ctx.lineWidth = 1;
    for (var gi = 1; gi <= 5; gi++) {
      var gy = gi * (rampH + 30) / 6;
      ctx.beginPath(); ctx.moveTo(bx - 10, by - gy + rampH * 0.15); ctx.lineTo(bx + rampW + 10, by - gy); ctx.stroke();
    }
    ctx.restore();
    /* bright hardened running surface (the incline the block rides on) */
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + rampW, by - rampH);
    ctx.strokeStyle = 'rgba(255,224,170,0.55)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineCap = 'butt';

    /* Block position on ramp */
    var blockDist = 0.5; /* default start position */
    if (animating || animDone) {
      if (inclCanPush) {
        blockDist = 0.15 + inclAnimPos; /* slides up from 0.15 */
      } else {
        blockDist = 0.5 + inclAnimPos; /* slides down from 0.5 */
      }
    }
    blockDist = Math.max(0.05, Math.min(0.95, blockDist));

    var blockCX = bx + rampW * blockDist;
    var blockCY = by - rampH * blockDist;
    var bh = 32;
    ctx.save();
    ctx.translate(blockCX, blockCY);
    ctx.rotate(-deg2rad(inclAngle));
    /* Width auto-fits the label so Imperial values don't overflow */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    var bLabel = fmtN(inclLoad);
    var bw = Math.max(44, ctx.measureText(bLabel).width + 14);
    /* wooden crate body (sits with its base on the incline surface) */
    var crateG = ctx.createLinearGradient(0, -bh, 0, 0);
    crateG.addColorStop(0, '#c79a5b');
    crateG.addColorStop(0.5, '#a97e42');
    crateG.addColorStop(1, '#835f2e');
    ctx.fillStyle = crateG;
    ctx.fillRect(-bw / 2, -bh, bw, bh);
    ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 2; ctx.strokeRect(-bw / 2, -bh, bw, bh);
    /* diagonal crate battens */
    ctx.strokeStyle = 'rgba(74,52,24,0.55)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-bw / 2, 0); ctx.lineTo(bw / 2, -bh); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-bw / 2, -bh); ctx.lineTo(bw / 2, 0); ctx.stroke();
    /* top-edge highlight */
    ctx.beginPath(); ctx.moveTo(-bw / 2, -bh + 1.5); ctx.lineTo(bw / 2, -bh + 1.5);
    ctx.strokeStyle = 'rgba(255,232,190,0.5)'; ctx.lineWidth = 1.4; ctx.stroke();
    /* label chip for readability over the grain */
    ctx.fillStyle = '#2a1e0e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillText(bLabel, 0, -bh / 2);
    ctx.fillStyle = '#ffe9c2';
    ctx.fillText(bLabel, 0, -bh / 2 - 0.8);
    ctx.restore();

    /* Force arrows from block center */
    var fx = blockCX, fy = blockCY - 15;

    /* Weight (straight down) */
    var wLen = Math.min(100, inclLoad / 5);
    drawArrow(fx, fy, fx, fy + wLen, '#ff5555', 4);
    drawLabel(fx + 35, fy + wLen - 5, 'W = ' + fmtN(inclLoad), '#ff5555', 10);

    /* Normal force */
    var nAngle = deg2rad(inclAngle);
    var nLen = wLen * Math.cos(nAngle);
    var nx = fx - nLen * Math.sin(nAngle);
    var ny = fy - nLen * Math.cos(nAngle);
    drawArrow(fx, fy, nx, ny, '#42a5f5', 3);
    drawLabel(nx - 25, ny, 'N', '#42a5f5', 10);

    /* User effort arrow (along surface, upward) */
    var eLen2 = Math.min(80, inclEffort / 3);
    var ex = fx - eLen2 * Math.cos(nAngle);
    var ey = fy + eLen2 * Math.sin(nAngle);
    drawArrow(ex, ey, fx, fy, '#3ddc84', 4);
    drawLabel(ex - 40, ey, 'E = ' + fmtN(inclEffort), '#3ddc84', 10);

    /* Friction (opposing motion). Direction depends on inclDirection:
       lifting → friction points DOWN the slope; lowering → friction points UP the slope. */
    if (useFriction && inclMu > 0) {
      var fric = round2(inclMu * inclLoad * cosA);
      var fLen = Math.min(50, fric / 3);
      var fSign = inclDirection === 1 ? 1 : -1;  /* +1 = down-slope, -1 = up-slope */
      var ffx = fx + fSign * fLen * Math.cos(nAngle);
      var ffy = fy - fSign * fLen * Math.sin(nAngle);
      drawArrow(fx, fy, ffx, ffy, '#ff8a65', 3);
      drawLabel(ffx + 25 * fSign, ffy, 'f = ' + fmtN(fric), '#ff8a65', 10);
    }

    /* FBD overlay — extra decomposition arrows W∥ and W⊥ when toggled on */
    if (showFBD) {
      var wPar = inclLoad * sinA;  /* component down the slope */
      var wPer = inclLoad * cosA;  /* component into the slope */
      var pLen = Math.min(70, wPar / 5);
      var rLen = Math.min(70, wPer / 5);
      /* W∥ — down the slope, dashed magenta */
      ctx.setLineDash([5, 4]);
      var pX = fx + pLen * Math.cos(nAngle);
      var pY = fy - pLen * Math.sin(nAngle);
      drawArrow(fx, fy, pX, pY, '#e040fb', 2);
      ctx.setLineDash([]);
      drawLabel(pX + 30, pY + 12, 'W∥=' + fmtN(wPar), '#e040fb', 10);
      /* W⊥ — into the slope, dashed cyan */
      ctx.setLineDash([5, 4]);
      var qX = fx + rLen * Math.sin(nAngle);
      var qY = fy + rLen * Math.cos(nAngle);
      drawArrow(fx, fy, qX, qY, '#80deea', 2);
      ctx.setLineDash([]);
      drawLabel(qX + 40, qY, 'W⊥=' + fmtN(wPer), '#80deea', 10);
    }

    /* Angle arc \u2014 \u03B8 sits at the ramp's bottom-LEFT vertex, between the ground
       (0 rad, pointing right) and the rising surface (\u2212\u03B8 in canvas coords) */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(bx, by, 40, 0, -deg2rad(inclAngle), true); ctx.stroke();
    drawLabel(bx + 62, by - 14, inclAngle + '\u00B0', '#f5c842', 11);

    /* Height label */
    /* Height annotated as fraction of ramp length; rampLen=450px represents 5m scale */
    drawDimLine(bx + rampW + 15, by, bx + rampW + 15, by - rampH, 'h = L·sin(' + inclAngle + '°)', '#6b7a99');

    /* Info labels */
    var dirStr = inclDirection === 1 ? 'Lifting UP' : 'Lowering DOWN';
    drawLabel(W / 2, 410, dirStr + '    |    Required effort = ' + fmtN(requiredEffort) + '    |    Your effort = ' + fmtN(inclEffort), '#f5c842', 12);
    var enoughStr, enoughClr;
    if (inclDirection === 1) {
      enoughStr = inclEffort >= requiredEffort ? '\u2714 Sufficient \u2014 block slides UP' : '\u2718 Insufficient \u2014 block slides DOWN';
      enoughClr = inclEffort >= requiredEffort ? '#3ddc84' : '#ff5555';
    } else {
      var locked = selfLockStatus() === 'locked';
      enoughStr = locked ? '\u2756 Self-locking: tan ' + inclAngle + '\u00B0 \u2264 \u03BC \u2014 block holds without effort' : '\u25BC Reversible: gravity overcomes friction';
      enoughClr = locked ? '#ff8a65' : '#3ddc84';
    }
    drawLabel(W / 2, 432, enoughStr, enoughClr, 11);
    /* \u03B7 is meaningless when gravity does the lowering work \u2014 blank it rather than print 100% */
    var etaStrIncl = (inclDirection === -1 && useFriction) ? '\u2014' : round2(calcEfficiency()) + '%';
    drawLabel(W / 2, 455, 'MA(ideal) = 1/sin(' + inclAngle + '\u00B0) = ' + round2(1 / sinA) + '    |    \u03B7 = ' + etaStrIncl, '#6b7a99', 10);

    /* Pulsing prompt */
    if (!animating && !animDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      drawIdleHint('\u25B6 Press Simulate');
      ctx.globalAlpha = 1.0;
    }
  }

  /* ── WHEEL & AXLE ─────────────────────────────────────────────── */
  function drawWheelAndAxle() {
    var cx = W / 2, cy = 210;
    var maxR = 155;
    var wheelRpx = Math.min(maxR, Math.max(30, waWheelR * 250));
    var axleRpx  = Math.max(10, Math.min(50, waAxleR * 250));
    /* waAnimRot drives the rotation — was unused before this fix */
    var rot = (animating || animDone) ? waAnimRot : 0;
    /* Rope winds on axle; load rises as rot increases */
    var maxDropPx  = 100;
    var ropeDropPx = Math.max(16, maxDropPx - axleRpx * rot);
    var loadY = cy + axleRpx + ropeDropPx;
    var ropeX = cx + axleRpx * 0.65;

    drawLabel(cx, 28, 'Wheel & Axle', '#ab47bc', 15);

    /* Support shaft and ceiling bracket */
    ctx.fillStyle = '#3a4060'; ctx.strokeStyle = '#4a5a7a'; ctx.lineWidth = 1.5;
    ctx.fillRect(cx - 8, 44, 16, cy - 44 - axleRpx);
    ctx.strokeRect(cx - 8, 44, 16, cy - 44 - axleRpx);
    ctx.fillRect(cx - 48, 44, 96, 13);
    ctx.strokeRect(cx - 48, 44, 96, 13);
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    for (var hi = cx - 55; hi <= cx + 55; hi += 13) {
      ctx.beginPath(); ctx.moveTo(hi, 44); ctx.lineTo(hi - 8, 37); ctx.stroke();
    }

    /* Rotating wheel + axle group — spokes animate with rot */
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    /* Wheel face — radial depth (light hub → dark rim), cast metal disc */
    var faceG = ctx.createRadialGradient(-wheelRpx * 0.2, -wheelRpx * 0.2, wheelRpx * 0.1, 0, 0, wheelRpx);
    faceG.addColorStop(0, 'rgba(206,147,216,0.32)');
    faceG.addColorStop(0.6, 'rgba(140,79,160,0.24)');
    faceG.addColorStop(1, 'rgba(74,40,88,0.4)');
    ctx.beginPath(); ctx.arc(0, 0, wheelRpx, 0, Math.PI * 2);
    ctx.fillStyle = faceG; ctx.fill();
    /* Rim — dark base ring + bright inner highlight = machined metal */
    ctx.strokeStyle = shadeHex('#ab47bc', 0.55); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 0, wheelRpx, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#c98fda'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, wheelRpx - 3, 0, Math.PI * 2); ctx.stroke();
    /* Inner tyre groove */
    ctx.strokeStyle = 'rgba(120,70,140,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(0, 0, wheelRpx * 0.87, 0, Math.PI * 2); ctx.stroke();
    /* 8 metal spokes */
    for (var sp = 0; sp < 8; sp++) {
      var sa = sp * Math.PI / 4;
      metalRod(Math.cos(sa) * (axleRpx + 5), Math.sin(sa) * (axleRpx + 5),
               Math.cos(sa) * (wheelRpx - 7), Math.sin(sa) * (wheelRpx - 7), 4, '#9a6fb5');
    }
    /* Axle drum — shaded metal cylinder cross-section */
    var axG = ctx.createRadialGradient(-axleRpx * 0.3, -axleRpx * 0.3, axleRpx * 0.1, 0, 0, axleRpx);
    axG.addColorStop(0, '#d7abe6'); axG.addColorStop(0.6, '#a25cbb'); axG.addColorStop(1, '#5e2f74');
    ctx.fillStyle = axG; ctx.strokeStyle = '#4a2560'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, axleRpx, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    /* Axle inner ring for depth */
    ctx.strokeStyle = 'rgba(224,176,239,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 0, axleRpx * 0.55, 0, Math.PI * 2); ctx.stroke();
    /* Hub bolt */
    domeSphere(0, 0, 5.5, '#e0c4ef');

    ctx.restore();

    /* Wheel radius dashed line (world space) */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + wheelRpx, cy); ctx.stroke();
    ctx.setLineDash([]);
    drawLabel(cx + wheelRpx / 2, cy - 14, 'R = ' + fmtM(waWheelR), '#3ddc84', 10);

    /* Axle radius dashed line */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + axleRpx); ctx.stroke();
    ctx.setLineDash([]);
    drawLabel(cx + 34, cy + axleRpx * 0.55, 'r = ' + fmtM(waAxleR), '#ff5555', 10);

    /* Effort arrow — world space, always vertical, on left rim */
    var efX = cx - wheelRpx;
    drawArrow(efX, cy - 54, efX, cy + 10, '#3ddc84', 4);
    drawLabel(efX - 60, cy - 22, 'E = ' + fmtN(calcEffort()), '#3ddc84', 11);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Effort ↓', efX, cy - 60);

    /* Clockwise rotation arc arrow */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    var arcR2 = wheelRpx + 22;
    var arcEnd = 0.8;
    ctx.beginPath(); ctx.arc(cx, cy, arcR2, -0.4, arcEnd); ctx.stroke();
    drawArrow(cx + arcR2 * Math.cos(arcEnd - 0.07), cy + arcR2 * Math.sin(arcEnd - 0.07),
              cx + arcR2 * Math.cos(arcEnd), cy + arcR2 * Math.sin(arcEnd), '#f5c842', 2);

    /* Load rope and rising weight block */
    ctx.strokeStyle = 'rgba(245,200,66,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ropeX, cy + axleRpx); ctx.lineTo(ropeX, loadY); ctx.stroke();
    drawWeightBlock(ropeX, loadY, 54, 36, fmtN(waLoad), '#ff5555');
    drawLabel(ropeX, loadY + 36 + 10, 'Load', '#ff5555', 10);

    if ((animating || animDone) && rot > 0.15) {
      ctx.globalAlpha = 0.85;
      drawLabel(ropeX + 52, cy + axleRpx + ropeDropPx / 2, '↑ rises', '#3ddc84', 10);
      ctx.globalAlpha = 1.0;
    }

    var waLine = 'MA(ideal) = R / r = ' + waWheelR.toFixed(2) + ' / ' + waAxleR.toFixed(2) + ' = ' + round2(waWheelR / waAxleR);
    if (useFriction) waLine += '   |   actual MA = ' + round2(calcMA());
    drawLabel(cx, 398, waLine, '#f5c842', 13);
    drawLabel(cx, 420, 'Effort × R = Load × r  (torque balance)', '#6b7a99', 11);

    if (!animating && !animDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      drawIdleHint('\u25B6 Press Simulate');
      ctx.globalAlpha = 1.0;
    }
  }

  /* ── SCREW ────────────────────────────────────────────────────── */
  function drawScrew() {
    var cx = W / 2, topY = 80;
    var screwW = 50, screwH = 250;
    var maSc = round2(2 * Math.PI * screwHandle / screwPitch);  /* ideal MA = VR */
    var requiredEff = calcEffort();                              /* friction-aware */
    var lam = screwLeadA(), phi = fricAngle(screwMu);
    var etaScrew = useFriction ? Math.max(0, Math.tan(lam) / Math.max(1e-9, Math.tan(lam + phi))) : 1;

    drawLabel(cx, 30, 'Screw Jack (Inclined Plane on Cylinder)', '#ab47bc', 15);

    /* Screw advancement (animation) */
    var advance = 0;
    var handleAngle = 0;
    if (animating || animDone) {
      handleAngle = screwAnimRot;
      if (screwCanTurn) {
        advance = (screwAnimRot / (Math.PI * 4)) * 40; /* screw moves down */
      }
    }

    /* Cast-iron base the screw presses into (the reacting load) */
    var platformY = topY + 40 + screwH + 10 - advance;
    contactShadow(cx, platformY + 27, 96, 9, 0.42);
    var baseG = ctx.createLinearGradient(0, platformY, 0, platformY + 25);
    baseG.addColorStop(0, '#7c4a4a'); baseG.addColorStop(0.5, '#583333'); baseG.addColorStop(1, '#371d1d');
    ctx.fillStyle = baseG; ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.rect(cx - 80, platformY, 160, 25); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 80, platformY + 1.5); ctx.lineTo(cx + 80, platformY + 1.5);
    ctx.strokeStyle = 'rgba(255,190,190,0.4)'; ctx.lineWidth = 1.4; ctx.stroke();
    drawLabel(cx, platformY + 13, fmtN(screwLoad) + ' Load', '#ff9a9a', 10);

    /* ── Screw shaft — steel cylinder with a helical V-thread ── */
    var sxL = cx - screwW / 2, sxR = cx + screwW / 2;
    var screwTop = topY + 40;
    var pitchPx = Math.max(12, screwPitch * 4);
    var screwBottom = screwTop + screwH - advance;
    var numThreads = Math.floor((screwBottom - screwTop) / pitchPx);  /* used by pitch marking below */
    /* round-bar body: horizontal gradient with a bright specular band */
    var cylG = ctx.createLinearGradient(sxL, 0, sxR, 0);
    cylG.addColorStop(0.00, '#454d61');
    cylG.addColorStop(0.28, '#9fabc4');
    cylG.addColorStop(0.48, '#717c96');
    cylG.addColorStop(0.72, '#8b97b0');
    cylG.addColorStop(1.00, '#383f52');
    ctx.fillStyle = cylG;
    ctx.fillRect(sxL, screwTop, screwW, screwBottom - screwTop);
    /* threads: dark groove + light crest, slanted to read as a right-hand helix */
    ctx.save();
    ctx.beginPath(); ctx.rect(sxL, screwTop, screwW, screwBottom - screwTop); ctx.clip();
    var slant = pitchPx * 0.5;
    for (var ty = screwTop - pitchPx; ty <= screwBottom; ty += pitchPx) {
      ctx.strokeStyle = 'rgba(18,22,32,0.62)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sxL - 6, ty); ctx.lineTo(sxR + 6, ty + slant); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.30)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(sxL - 6, ty - pitchPx * 0.3); ctx.lineTo(sxR + 6, ty + slant - pitchPx * 0.3); ctx.stroke();
    }
    ctx.restore();
    /* thread crests biting out of both silhouette edges — the tell of a real screw */
    for (var tv = screwTop; tv < screwBottom - 2; tv += pitchPx) {
      ctx.fillStyle = '#5c6379'; ctx.strokeStyle = '#2b3140'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sxL, tv); ctx.lineTo(sxL - 5, tv + pitchPx * 0.3); ctx.lineTo(sxL, tv + pitchPx * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sxR, tv + slant * 0.2); ctx.lineTo(sxR + 5, tv + pitchPx * 0.3 + slant * 0.2); ctx.lineTo(sxR, tv + pitchPx * 0.6 + slant * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.strokeStyle = '#2b3140'; ctx.lineWidth = 2;
    ctx.strokeRect(sxL, screwTop, screwW, screwBottom - screwTop);

    /* Pitch marking */
    if (numThreads > 1) {
      var py1 = topY + 40 + pitchPx;
      var py2 = topY + 40 + pitchPx * 2;
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.beginPath(); ctx.moveTo(cx + screwW / 2 + 25, py1 + pitchPx * 0.25); ctx.lineTo(cx + screwW / 2 + 25, py2 + pitchPx * 0.25); ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(cx + screwW / 2 + 55, (py1 + py2) / 2 + pitchPx * 0.25, 'p = ' + fmtMM(screwPitch), '#f5c842', 10);
    }

    /* Steel tommy-bar handle (rotates during animation); effort is carried by the
       green arrow + label, so the bar itself is rendered as real steel */
    var handlePx = Math.min(180, screwHandle * 0.8);
    ctx.save();
    ctx.translate(cx, topY + 30);
    ctx.rotate(handleAngle);
    metalRod(-handlePx, 0, handlePx, 0, 7, '#8592ab');
    /* knurled steel grips at each end */
    domeSphere(-handlePx, 0, 6.5, '#aeb8cd');
    domeSphere(handlePx, 0, 6.5, '#aeb8cd');
    /* collar hub over the screw top */
    domeSphere(0, 0, 9, '#c3ccdd');
    ctx.restore();

    /* Labels */
    drawLabel(cx, topY + 10, '2\u03C0L = ' + fmtMM(2 * Math.PI * screwHandle), '#3ddc84', 10);

    /* Effort arrow */
    ctx.save();
    ctx.translate(cx, topY + 30);
    ctx.rotate(handleAngle);
    drawArrow(handlePx + 5, 0, handlePx + 5, 40, '#3ddc84', 4);
    ctx.restore();
    drawLabel(cx + handlePx + 35, topY + 50, 'E = ' + fmtN(screwEffort), '#3ddc84', 11);

    /* Info */
    var lamDeg = (lam * 180 / Math.PI).toFixed(1);
    var phiDeg = (phi * 180 / Math.PI).toFixed(1);
    drawLabel(cx, 415, 'MA(ideal) = 2\u03C0L/p = ' + maSc + '    |    Required = ' + fmtN(requiredEff) + '    |    Your effort = ' + fmtN(screwEffort), '#f5c842', 11);
    if (useFriction) {
      drawLabel(cx, 435, '\u03BB = ' + lamDeg + '\u00B0    \u03C6 = ' + phiDeg + '\u00B0    \u03B7 = ' + (etaScrew * 100).toFixed(1) + '%', '#ce93d8', 10);
    }
    var canStr, canClr;
    if (selfLockStatus() === 'locked') {
      canStr = '\u2756 Self-locking (\u03C6 \u2265 \u03BB) \u2014 load cannot back-drive the screw';
      canClr = '#ff8a65';
    } else {
      canStr = screwEffort >= requiredEff ? '\u2714 Sufficient \u2014 screw advances' : '\u2718 Insufficient \u2014 cannot turn against load';
      canClr = screwEffort >= requiredEff ? '#3ddc84' : '#ff5555';
    }
    drawLabel(cx, 455, canStr, canClr, 11);

    if (!animating && !animDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      drawIdleHint('\u25B6 Press Simulate');
      ctx.globalAlpha = 1.0;
    }
  }

  /* ── WEDGE ────────────────────────────────────────────────────── */
  function drawWedge() {
    var cx = W / 2, cy = 240;
    var wedgeLen = 300;
    var halfAngle = deg2rad(wedgeAngle / 2);
    var wedgeThick = wedgeLen * Math.tan(halfAngle);

    drawLabel(cx, 30, 'Wedge (' + wedgeAngle + '\u00B0)', '#ab47bc', 15);

    /* Animation: wedge penetrates from left to right */
    var penetration = (animating || animDone) ? wedgeAnimPos : 0;
    var wedgeOffsetX = -wedgeLen * 0.3 + penetration * wedgeLen * 0.5;

    /* Timber blocks being split apart as the wedge enters */
    var splitDist = penetration * wedgeThick * 1.2;
    var matX = cx + 40, matW = 120, matH = 100;

    /* one timber half: wood gradient + grain + a jagged torn face on `crackSide` */
    function timberHalf(yTop, crackSide) {
      var wg = ctx.createLinearGradient(matX, 0, matX + matW, 0);
      wg.addColorStop(0, '#7a5330'); wg.addColorStop(0.5, '#9a6f42'); wg.addColorStop(1, '#6d4a28');
      ctx.fillStyle = wg;
      ctx.fillRect(matX, yTop, matW, matH);
      ctx.strokeStyle = '#3f2c17'; ctx.lineWidth = 2; ctx.strokeRect(matX, yTop, matW, matH);
      ctx.save();
      ctx.beginPath(); ctx.rect(matX, yTop, matW, matH); ctx.clip();
      ctx.strokeStyle = 'rgba(63,44,23,0.45)'; ctx.lineWidth = 1;
      for (var k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(matX, yTop + k * matH / 5); ctx.lineTo(matX + matW, yTop + k * matH / 5 - 3); ctx.stroke(); }
      ctx.restore();
      /* torn splitting face (jagged) with a bright freshly-split highlight */
      var fy = crackSide === 'bottom' ? yTop + matH : yTop;
      ctx.beginPath();
      for (var jx = 0; jx <= matW; jx += 12) {
        var jog = ((jx / 12) % 2 === 0 ? 1 : -1) * 3 * (penetration > 0.02 ? 1 : 0);
        var px = matX + jx, py = fy + (crackSide === 'bottom' ? jog : -jog);
        jx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(214,178,128,0.7)'; ctx.lineWidth = 1.6; ctx.stroke();
    }
    timberHalf(cy - matH - splitDist, 'bottom');
    timberHalf(cy + splitDist, 'top');
    drawLabel(matX + matW / 2, cy - matH / 2 - splitDist, 'Timber', '#d6b280', 10);

    /* Steel wedge (horizontal, point to the right) — beveled faces + bright edge */
    ctx.save();
    ctx.translate(wedgeOffsetX, 0);
    var wg2 = ctx.createLinearGradient(0, cy - wedgeThick, 0, cy + wedgeThick);
    wg2.addColorStop(0, '#aeb8cd');
    wg2.addColorStop(0.5, '#6d7793');
    wg2.addColorStop(1, '#39404f');
    ctx.beginPath();
    ctx.moveTo(cx - wedgeLen / 2, cy - wedgeThick);
    ctx.lineTo(cx + wedgeLen / 2, cy);
    ctx.lineTo(cx - wedgeLen / 2, cy + wedgeThick);
    ctx.closePath();
    ctx.fillStyle = wg2; ctx.fill();
    ctx.strokeStyle = '#2b3140'; ctx.lineWidth = 2; ctx.stroke();
    /* centre ridge highlight from butt to tip */
    ctx.beginPath(); ctx.moveTo(cx - wedgeLen / 2, cy); ctx.lineTo(cx + wedgeLen / 2, cy);
    ctx.strokeStyle = 'rgba(255,255,255,0.32)'; ctx.lineWidth = 1.4; ctx.stroke();
    /* hardened cutting tip */
    ctx.beginPath(); ctx.arc(cx + wedgeLen / 2, cy, 2.4, 0, Math.PI * 2);
    ctx.fillStyle = '#eef2f8'; ctx.fill();
    ctx.restore();

    /* Applied force arrow (from left, horizontal) */
    var arrowStartX = cx - wedgeLen / 2 + wedgeOffsetX - 80;
    drawArrow(arrowStartX, cy, arrowStartX + 75, cy, '#3ddc84', 5);
    drawLabel(arrowStartX + 30, cy - 18, 'F = ' + fmtN(wedgeForce), '#3ddc84', 11);

    /* Reaction forces (grow with penetration) */
    var reactionF = calcLoad();
    var visReaction = reactionF * Math.max(0.2, penetration);
    var rLen = Math.min(80, visReaction / 5);

    if (penetration > 0.05) {
      /* Top reaction */
      var topMidX = cx + 40 + wedgeOffsetX / 2, topMidY = cy - splitDist - 10;
      drawArrow(topMidX, topMidY, topMidX, topMidY - rLen, '#ff5555', 4);
      drawLabel(topMidX + 40, topMidY - rLen / 2, fmtN(reactionF) + ' \u2191', '#ff5555', 10);

      /* Bottom reaction */
      var botMidX = cx + 40 + wedgeOffsetX / 2, botMidY = cy + splitDist + 10;
      drawArrow(botMidX, botMidY, botMidX, botMidY + rLen, '#ff5555', 4);
      drawLabel(botMidX + 40, botMidY + rLen / 2, fmtN(reactionF) + ' \u2193', '#ff5555', 10);
    }

    /* Angle label */
    var tipX = cx + wedgeLen / 2 + wedgeOffsetX;
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(tipX, cy, 30, Math.PI - halfAngle, Math.PI + halfAngle); ctx.stroke();
    drawLabel(tipX - 45, cy, wedgeAngle + '\u00B0', '#f5c842', 11);

    var ma2 = calcMA();
    var wedgeFormula = useFriction ? 'MA = 1/(2·tan(\u03B1/2 + \u03C6)) = ' : 'MA = 1/(2·tan(\u03B1/2)) = ';
    drawLabel(cx, 400, wedgeFormula + round2(ma2), '#f5c842', 13);
    drawLabel(cx, 425, 'Splitting force = ' + fmtN(reactionF) + ' each side', '#6b7a99', 11);

    if (!animating && !animDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      drawIdleHint('\u25B6 Press Simulate');
      ctx.globalAlpha = 1.0;
    }
  }

  /* ================================================================
     MINI DIAGRAMS — EXPLORE MODE (12)
     ================================================================ */
  function drawConceptDiagram(c) {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText(c.name, W / 2, 35);

    switch (c.diagram) {
      case 'maDiagram': drawMiniMA(); break;
      case 'vrDiagram': drawMiniVR(); break;
      case 'effDiagram': drawMiniEff(); break;
      case 'workDiagram': drawMiniWork(); break;
      case 'leverDiagram': drawMiniLever(); break;
      case 'pulleyDiagram': drawMiniPulley(); break;
      case 'inclinedDiagram': drawMiniInclined(); break;
      case 'wheelAxleDiagram': drawMiniWA(); break;
      case 'screwDiagram': drawMiniScrew(); break;
      case 'wedgeDiagram': drawMiniWedge(); break;
      case 'compoundDiagram': drawMiniCompound(); break;
      case 'energyDiagram': drawMiniEnergy(); break;
    }
  }

  function drawMiniMA() {
    drawLabel(W / 2, 80, 'MA = Load / Effort', '#ab47bc', 16);
    /* Small lever */
    ctx.fillStyle = 'rgba(171,71,188,.35)'; ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(450, 250); ctx.lineTo(435, 280); ctx.lineTo(465, 280); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(300, 260); ctx.lineTo(600, 240); ctx.stroke();
    drawArrow(340, 200, 340, 255, '#3ddc84', 4);
    drawLabel(340, 188, 'Effort = 50 N', '#3ddc84', 11);
    drawArrow(560, 245, 560, 310, '#ff5555', 4);
    drawLabel(560, 325, 'Load = 200 N', '#ff5555', 11);
    drawLabel(W / 2, 370, 'MA = 200/50 = 4', '#f5c842', 14);
    drawLabel(W / 2, 400, 'MA > 1 means force is multiplied', '#6b7a99', 11);
  }

  function drawMiniVR() {
    drawLabel(W / 2, 80, 'VR = Distance(effort) / Distance(load)', '#ab47bc', 16);
    /* Two bars showing distances */
    ctx.fillStyle = 'rgba(61,220,132,.35)'; ctx.fillRect(200, 160, 300, 30);
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2; ctx.strokeRect(200, 160, 300, 30);
    drawLabel(350, 175, 'Effort moves 3 m', '#3ddc84', 11);
    ctx.fillStyle = 'rgba(255,85,85,.35)'; ctx.fillRect(200, 220, 100, 30);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2; ctx.strokeRect(200, 220, 100, 30);
    drawLabel(250, 235, 'Load moves 1 m', '#ff5555', 11);
    drawLabel(W / 2, 310, 'VR = 3/1 = 3', '#f5c842', 14);
    drawLabel(W / 2, 340, 'VR depends on geometry, not friction', '#6b7a99', 11);
  }

  function drawMiniEff() {
    drawLabel(W / 2, 80, '\u03B7 = (MA / VR) \u00D7 100%', '#ab47bc', 16);
    /* Efficiency bar */
    ctx.fillStyle = 'rgba(171,71,188,.35)'; ctx.fillRect(200, 180, 400, 40);
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2; ctx.strokeRect(200, 180, 400, 40);
    ctx.fillStyle = 'rgba(61,220,132,.45)'; ctx.fillRect(200, 180, 360, 40);
    drawLabel(380, 200, 'Useful work (90%)', '#3ddc84', 12);
    ctx.fillStyle = 'rgba(255,85,85,.45)'; ctx.fillRect(560, 180, 40, 40);
    drawLabel(580, 200, 'Friction', '#ff5555', 10);
    drawLabel(W / 2, 270, 'MA = 3.6, VR = 4', '#6b7a99', 12);
    drawLabel(W / 2, 300, '\u03B7 = (3.6/4) \u00D7 100 = 90%', '#f5c842', 14);
  }

  function drawMiniWork() {
    drawLabel(W / 2, 80, 'Work = Force \u00D7 Distance', '#ab47bc', 16);
    drawArrow(250, 200, 400, 200, '#3ddc84', 5);
    drawLabel(325, 185, 'F = 100 N', '#3ddc84', 12);
    drawDimLine(250, 230, 400, 230, 'd = 3 m', '#f5c842');
    drawLabel(W / 2, 280, 'W = 100 \u00D7 3 = 300 J', '#f5c842', 14);
    drawLabel(W / 2, 310, '1 Joule = 1 Newton \u00D7 1 metre', '#6b7a99', 11);
  }

  function drawMiniLever() {
    drawLabel(W / 2, 70, 'Three Classes of Levers', '#ab47bc', 14);
    var classes = [
      { label: '1st Class', desc: 'F between E & L', ex: 'Seesaw', y: 140 },
      { label: '2nd Class', desc: 'L between F & E', ex: 'Wheelbarrow', y: 250 },
      { label: '3rd Class', desc: 'E between F & L', ex: 'Fishing Rod', y: 360 }
    ];
    classes.forEach(function (c) {
      ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(250, c.y); ctx.lineTo(650, c.y); ctx.stroke();
      drawLabel(200, c.y, c.label, '#ab47bc', 12);
      drawLabel(450, c.y + 25, c.desc + ' (' + c.ex + ')', '#6b7a99', 10);
    });
    /* 1st class markers */
    drawLabel(350, classes[0].y - 12, 'E', '#3ddc84', 10);
    drawLabel(450, classes[0].y - 12, 'F', '#f5c842', 10);
    drawLabel(550, classes[0].y - 12, 'L', '#ff5555', 10);
    /* 2nd class */
    drawLabel(300, classes[1].y - 12, 'F', '#f5c842', 10);
    drawLabel(450, classes[1].y - 12, 'L', '#ff5555', 10);
    drawLabel(600, classes[1].y - 12, 'E', '#3ddc84', 10);
    /* 3rd class */
    drawLabel(300, classes[2].y - 12, 'F', '#f5c842', 10);
    drawLabel(450, classes[2].y - 12, 'E', '#3ddc84', 10);
    drawLabel(600, classes[2].y - 12, 'L', '#ff5555', 10);
  }

  function drawMiniPulley() {
    drawLabel(W / 2, 70, 'Pulley Types', '#ab47bc', 14);
    var types = ['Fixed (MA=1)', 'Movable (MA=2)', 'Block & Tackle'];
    for (var i = 0; i < 3; i++) {
      var px = 200 + i * 220;
      ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(171,71,188,.35)';
      ctx.beginPath(); ctx.arc(px, 180, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      drawLabel(px, 230, types[i], '#6b7a99', 10);
    }
    drawLabel(W / 2, 320, 'MA = number of rope sections supporting the load', '#f5c842', 13);
  }

  function drawMiniInclined() {
    drawLabel(W / 2, 70, 'Inclined Plane', '#ab47bc', 14);
    ctx.fillStyle = 'rgba(171,71,188,.35)'; ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(200, 320); ctx.lineTo(600, 320); ctx.lineTo(600, 150); ctx.closePath(); ctx.fill(); ctx.stroke();
    drawLabel(400, 310, 'Length (L)', '#3ddc84', 11);
    drawLabel(620, 235, 'Height (h)', '#ff5555', 11);
    drawLabel(W / 2, 380, 'MA = L/h = 1/sin(\u03B8)', '#f5c842', 14);
  }

  function drawMiniWA() {
    drawLabel(W / 2, 70, 'Wheel & Axle', '#ab47bc', 14);
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(171,71,188,.35)';
    ctx.beginPath(); ctx.arc(450, 230, 80, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(171,71,188,.55)';
    ctx.beginPath(); ctx.arc(450, 230, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawLabel(450, 340, 'MA = R / r', '#f5c842', 14);
    drawLabel(490, 200, 'R', '#3ddc84', 12);
    drawLabel(460, 240, 'r', '#ff5555', 12);
  }

  function drawMiniScrew() {
    drawLabel(W / 2, 70, 'Screw = Inclined Plane on Cylinder', '#ab47bc', 14);
    ctx.fillStyle = 'rgba(171,71,188,.35)'; ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.fillRect(420, 120, 60, 200); ctx.strokeRect(420, 120, 60, 200);
    for (var i = 0; i < 8; i++) {
      var ty = 130 + i * 25;
      ctx.strokeStyle = '#ce93d8'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(415, ty); ctx.lineTo(485, ty + 12); ctx.stroke();
    }
    drawLabel(450, 370, 'MA = 2\u03C0L / pitch', '#f5c842', 14);
  }

  function drawMiniWedge() {
    drawLabel(W / 2, 70, 'Wedge = Double Inclined Plane', '#ab47bc', 14);
    ctx.fillStyle = 'rgba(171,71,188,.35)'; ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(300, 180); ctx.lineTo(550, 240); ctx.lineTo(300, 300); ctx.closePath(); ctx.fill(); ctx.stroke();
    drawArrow(220, 240, 295, 240, '#3ddc84', 4);
    drawLabel(250, 225, 'Force', '#3ddc84', 10);
    drawArrow(430, 210, 430, 160, '#ff5555', 3);
    drawArrow(430, 270, 430, 320, '#ff5555', 3);
    drawLabel(450, 150, 'Split', '#ff5555', 10);
    drawLabel(W / 2, 370, 'MA = Length / Thickness', '#f5c842', 14);
  }

  function drawMiniCompound() {
    drawLabel(W / 2, 70, 'Compound Machines', '#ab47bc', 14);
    drawLabel(W / 2, 120, 'Two or more simple machines working together', '#6b7a99', 12);
    /* Box diagram */
    ctx.fillStyle = 'rgba(61,220,132,.35)'; ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.fillRect(200, 180, 120, 60); ctx.strokeRect(200, 180, 120, 60);
    drawLabel(260, 210, 'MA\u2081 = 3', '#3ddc84', 12);
    drawArrow(320, 210, 370, 210, '#f5c842', 3);
    ctx.fillStyle = 'rgba(255,85,85,.35)'; ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    ctx.fillRect(370, 180, 120, 60); ctx.strokeRect(370, 180, 120, 60);
    drawLabel(430, 210, 'MA\u2082 = 4', '#ff5555', 12);
    drawLabel(W / 2, 290, 'Total MA = 3 \u00D7 4 = 12', '#f5c842', 14);
    drawLabel(W / 2, 330, 'Examples: bicycle, car jack, scissors', '#6b7a99', 11);
  }

  function drawMiniEnergy() {
    drawLabel(W / 2, 70, 'Conservation of Energy', '#ab47bc', 14);
    /* Work in bar */
    ctx.fillStyle = 'rgba(61,220,132,.35)'; ctx.fillRect(200, 150, 400, 40);
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2; ctx.strokeRect(200, 150, 400, 40);
    drawLabel(400, 170, 'Work Input = E \u00D7 dE = 600 J', '#3ddc84', 12);
    /* Work out bar */
    ctx.fillStyle = 'rgba(255,85,85,.35)'; ctx.fillRect(200, 220, 320, 40);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2; ctx.strokeRect(200, 220, 320, 40);
    drawLabel(360, 240, 'Work Output = L \u00D7 dL = 480 J', '#ff5555', 12);
    /* Friction loss */
    ctx.fillStyle = 'rgba(245,200,66,.35)'; ctx.fillRect(520, 220, 80, 40);
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2; ctx.strokeRect(520, 220, 80, 40);
    drawLabel(560, 240, 'Loss', '#f5c842', 10);
    drawLabel(W / 2, 310, 'Work In = Work Out + Friction Losses', '#f5c842', 14);
    drawLabel(W / 2, 340, '\u03B7 = 480/600 \u00D7 100 = 80%', '#6b7a99', 12);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function drawSceneBackground() {
    /* Vertical studio gradient for depth */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   '#11141f');
    bg.addColorStop(0.5, '#0d1117');
    bg.addColorStop(1,   '#090b10');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    /* Soft accent spotlight over the working area (lifts the machine off the bg) */
    var glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, W * 0.55);
    glow.addColorStop(0, 'rgba(156,39,176,0.08)');
    glow.addColorStop(1, 'rgba(156,39,176,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawSceneBackground();

    if (mode === 'simulate') {
      /* Work out how tall the HUD stack will be BEFORE the machine draws, so
         the idle hint (emitted from inside the machine draw) sits under it
         rather than lagging a frame behind the lock chip appearing. */
      hudNextY = hudLayout();
      switch (machineType) {
        case 'lever': drawLever(); break;
        case 'pulley': drawPulley(); break;
        case 'inclined': drawInclinedPlane(); break;
        case 'wheel-axle': drawWheelAndAxle(); break;
        case 'screw': drawScrew(); break;
        case 'wedge': drawWedge(); break;
      }
      drawHUD();   /* painted last so nothing can cover the readings */
    } else if (mode === 'explore') {
      var filtered = CONCEPTS.filter(function (c) { return c.cat === selCat; });
      if (filtered[selConcept]) drawConceptDiagram(filtered[selConcept]);
    } else if (mode === 'quiz') {
      drawQuizCanvas();
    } else if (mode === 'practice') {
      drawPracticeCanvas();
    }
  }

  function drawQuizCanvas() {
    drawLabel(W / 2, 40, 'Quiz Mode', '#dde3f0', 18);
    drawLabel(W / 2, 65, 'Answer the question below', '#f5c842', 12);
    /* Decorative lever */
    ctx.fillStyle = 'rgba(171,71,188,.35)'; ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(450, 200); ctx.lineTo(430, 240); ctx.lineTo(470, 240); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(300, 210); ctx.lineTo(600, 190); ctx.stroke();
    drawArrow(340, 160, 340, 207, '#3ddc84', 4);
    drawArrow(560, 193, 560, 260, '#ff5555', 4);
    drawLabel(450, 280, 'MA = Load / Effort', '#f5c842', 14);
  }

  function drawPracticeCanvas() {
    drawLabel(W / 2, 40, 'Practice Mode', '#dde3f0', 18);
    drawLabel(W / 2, 65, 'Solve the problem below', '#f5c842', 12);
    /* Small machine icons */
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2; ctx.fillStyle = 'rgba(171,71,188,.35)';
    ctx.beginPath(); ctx.arc(300, 200, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawLabel(300, 200, 'W&A', '#ab47bc', 10);
    ctx.beginPath(); ctx.moveTo(430, 170); ctx.lineTo(530, 230); ctx.lineTo(430, 230); ctx.closePath(); ctx.fill(); ctx.stroke();
    drawLabel(470, 250, 'Ramp', '#ab47bc', 10);
    /* Pulley */
    ctx.beginPath(); ctx.arc(620, 190, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawLabel(620, 190, 'P', '#ab47bc', 10);
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    var effort = calcEffort();
    var load = calcLoad();
    var ma = calcMA();
    var vr = calcVR();
    var eff = calcEfficiency();

    /* HUD chips, painted on the canvas by drawHUD(). */
    /* η is meaningless when lowering with friction (gravity supplies the work) */
    var effUndefined = (machineType === 'inclined' && inclDirection === -1 && useFriction);
    hud.ma  = String(round2(ma));
    hud.vr  = String(round2(vr));
    hud.eff = effUndefined ? '—' : round2(eff) + '%';
    var ls = selfLockStatus();
    hud.lock = (ls === 'na') ? null
      : { text: ls === 'locked' ? 'SELF-LOCKING' : 'REVERSIBLE',
          color: ls === 'locked' ? '#ff8a65' : '#3ddc84' };

    /* Full readout cards \u2014 unit-aware via fmtN/fmtM/fmtMM. */
    setReadout(1, 'Effort',     nbN(effort), lblN());
    setReadout(2, 'Load',       nbN(load),   lblN());
    setReadout(3, 'MA',         round2(ma),  '');
    setReadout(4, 'VR',         round2(vr),  '');
    /* Keep the card and the badge telling the same story. */
    setReadout(5, 'Efficiency', effUndefined ? '—' : round2(eff), effUndefined ? '' : '%');

    /* \u2500\u2500 Distances and work \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
       Every machine is normalised to ONE UNIT OF LOAD MOVEMENT, so the
       cards are directly comparable and the energy identity always holds:
           d_effort = VR x d_load,  W_in = E x d_E,  W_out = L x d_L,
           eta = W_out / W_in.
       Previously the lever reported its ARM LENGTHS as the distances moved
       (only true for exactly one radian of rotation) and the pulley, wheel
       & axle and wedge reported nothing at all.                          */
    var d = machineDistances();
    var wIn  = effort * d.dE;
    /* `nOut` counts how many places the output force acts. It is 2 for the
       wedge, whose reported load is the force on ONE face — counting a single
       face made W_out come out at half of W_in and contradicted the 100 %
       efficiency card. */
    var wOut = load * d.dL * (d.nOut || 1);
    setReadout(6, 'Dist. Effort', nbM(d.dE), lblM());
    setReadout(7, d.loadLabel,    nbM(d.dL), lblM());
    setReadout(8, 'Work in',      nbJ(wIn),  lblJ());
    setReadout(9, 'Work out',     nbJ(wOut), lblJ());
    setReadout(10, 'Lost to friction', nbJ(Math.max(0, wIn - wOut)), lblJ());
    var noteEl = $('#work-note');
    if (noteEl) noteEl.textContent = d.note;
  }

  /* Work-energy bookkeeping, normalised per unit of load travel.
     Returns SI metres. `dL` is what the LOAD moves, `dE` what the EFFORT moves. */
  function machineDistances() {
    var vr = calcVR();
    switch (machineType) {
      case 'screw': {
        /* A screw is naturally described per full turn of the handle. */
        var dLoad = screwPitch / 1000;              /* one pitch, m */
        return { dE: 2 * Math.PI * screwHandle / 1000, dL: dLoad,
                 loadLabel: 'Dist. Load',
                 note: 'Per one full turn of the handle: the effort travels 2\u03c0L while the load advances one pitch.' };
      }
      case 'inclined':
        return { dE: 1 / Math.sin(deg2rad(inclAngle)), dL: 1,
                 loadLabel: 'Rise (height)',
                 note: 'Per 1 m of vertical rise: the load is pushed the full ramp length L = h / sin\u03b8.' };
      case 'wedge':
        /* Driving the wedge in by dE spreads EACH face by dE\u00b7tan(\u03b1/2), and the
           reported load is the force on one face \u2014 so the output work is
           collected at two places. */
        return { dE: 1, dL: Math.tan(wedgeHalfA()), nOut: 2,
                 loadLabel: 'Face spread',
                 note: 'Per 1 m the wedge is driven in, each of the two faces is forced apart by tan(\u03b1/2) \u2014 so the output work is counted on both faces.' };
      default:
        /* Lever, pulley, wheel & axle: per 1 m of load movement the effort
           must travel VR metres. */
        return { dE: vr, dL: 1,
                 loadLabel: 'Dist. Load',
                 note: 'Per 1 m of load movement the effort travels VR = ' + round2(vr) + ' m \u2014 force is traded for distance.' };
    }
  }

  /* Work formatters \u2014 SI joules internally, ft\u00b7lbf when Imperial. */
  var J_TO_FTLBF = 1 / (M_PER_FT * N_PER_LBF);   /* 1 J \u2248 0.7376 ft\u00b7lbf */
  function nbJ(j) {
    if (j == null || !isFinite(j)) return '\u2014';
    var v = isImp() ? j * J_TO_FTLBF : j;
    return Math.abs(v) >= 1000 ? Math.round(v).toString() : round2(v).toString();
  }
  function lblJ() { return isImp() ? 'ft\u00b7lbf' : 'J'; }

  function setReadout(n, label, val, unit) {
    var lEl = $('#r-l' + n), vEl = $('#r-v' + n), uEl = $('#r-u' + n);
    if (lEl) lEl.textContent = label;
    if (vEl) vEl.textContent = val;
    if (uEl) uEl.textContent = unit ? ' ' + unit : '';
  }

  /* ================================================================
     UI — MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;
    $$('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });

    /* MA/VR/efficiency moved onto the canvas — no badge row to show or hide. */
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
     UI — MACHINE TYPE SWITCHING
     ================================================================ */
  function setMachine(type) {
    machineType = type;
    $$('#machine-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.machine === type);
    });
    /* Hide all machine control panels */
    var allCtrls = ['#lever-ctrls', '#pulley-ctrls', '#inclined-ctrls', '#wheel-axle-ctrls', '#screw-ctrls', '#wedge-ctrls'];
    allCtrls.forEach(function (s) { hide($(s)); });
    /* Show the selected one */
    var map = { lever: '#lever-ctrls', pulley: '#pulley-ctrls', inclined: '#inclined-ctrls', 'wheel-axle': '#wheel-axle-ctrls', screw: '#screw-ctrls', wedge: '#wedge-ctrls' };
    show($(map[type]));
    /* FBD overlay is meaningful only on inclined plane — disable chip elsewhere. */
    var fbdLbl = $('#show-fbd');
    if (fbdLbl) {
      var lbl = fbdLbl.closest('label');
      if (type === 'inclined') {
        lbl.classList.remove('cvs-chk-disabled');
        fbdLbl.disabled = false;
        lbl.title = 'Show Free-Body Diagram (W∥, W⊥)';
      } else {
        lbl.classList.add('cvs-chk-disabled');
        fbdLbl.disabled = true;
        lbl.title = 'FBD overlay is available on Inclined Plane only';
      }
    }
    updateReadouts();
    render();
  }

  $('#machine-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    setMachine(e.target.dataset.machine);
  });

  /* ================================================================
     UI — LEVER CONTROLS
     ================================================================ */
  $('#lever-class-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    leverClass = +e.target.dataset.cls;
    $$('#lever-class-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.cls === leverClass); });
    if (animating || animDone) resetAnim();
    updateReadouts(); render();
  });

  $('#lever-effort').addEventListener('input', function () { leverEffort = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#lever-load')  .addEventListener('input', function () { leverLoad   = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#lever-earm')  .addEventListener('input', function () { leverEArm   = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#lever-larm')  .addEventListener('input', function () { leverLArm   = +this.value; syncSliderLabels(); updateReadouts(); render(); });

  /* ================================================================
     UI — PULLEY CONTROLS
     ================================================================ */
  function syncPulleyRadios() {
    /* Disable/enable radio buttons based on pulley type */
    var radios = $$('#pulley-num-radios .radio-btn');
    radios.forEach(function (lbl) {
      var val = +lbl.querySelector('input').value;
      if (pulleyType === 'fixed') {
        lbl.classList.toggle('disabled', val !== 1);
      } else if (pulleyType === 'movable') {
        lbl.classList.toggle('disabled', val !== 2);
      } else {
        lbl.classList.toggle('disabled', val < 2);
      }
    });
    /* Select the correct radio */
    var correctVal = pulleyType === 'fixed' ? 1 : pulleyType === 'movable' ? 2 : pulleyNum;
    $$('#pulley-num-radios input[type="radio"]').forEach(function (r) {
      r.checked = (+r.value === correctVal);
    });
  }

  $('#pulley-type-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    pulleyType = e.target.dataset.ptype;
    $$('#pulley-type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.ptype === pulleyType); });
    if (pulleyType === 'fixed') pulleyNum = 1;
    else if (pulleyType === 'movable') pulleyNum = 2;
    else if (pulleyNum < 2) pulleyNum = 3;
    syncPulleyRadios();
    if (animating || animDone) resetAnim();
    updateReadouts(); render();
  });
  $('#pulley-num-radios').addEventListener('change', function (e) {
    if (!e.target.matches('input[type="radio"]')) return;
    pulleyNum = +e.target.value;
    /* Auto-switch type based on count */
    if (pulleyNum === 1) {
      pulleyType = 'fixed';
    } else if (pulleyNum === 2) {
      pulleyType = 'movable';
    } else {
      pulleyType = 'block';
    }
    $$('#pulley-type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.ptype === pulleyType); });
    syncPulleyRadios();
    if (animating || animDone) resetAnim();
    updateReadouts(); render();
  });
  $('#pulley-effort').addEventListener('input', function () { pulleyEffort = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#pulley-load')  .addEventListener('input', function () { pulleyLoad   = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#pulley-diam')  .addEventListener('input', function () { pulleyDiam   = +this.value; syncSliderLabels(); updateReadouts(); render(); });

  /* ================================================================
     UI — INCLINED PLANE CONTROLS
     ================================================================ */
  $('#incl-angle') .addEventListener('input', function () { inclAngle  = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#incl-load')  .addEventListener('input', function () { inclLoad   = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#incl-mu')    .addEventListener('input', function () { inclMu     = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#incl-effort').addEventListener('input', function () { inclEffort = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#incl-dir-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    inclDirection = +e.target.dataset.dir;
    $$('#incl-dir-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.dir === inclDirection); });
    if (animating || animDone) resetAnim();
    updateReadouts(); render();
  });

  /* ================================================================
     UI — WHEEL & AXLE CONTROLS
     ================================================================ */
  $('#wa-wheelr').addEventListener('input', function () { waWheelR = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#wa-axler') .addEventListener('input', function () { waAxleR  = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#wa-load')  .addEventListener('input', function () { waLoad   = +this.value; syncSliderLabels(); updateReadouts(); render(); });

  /* ================================================================
     UI — SCREW CONTROLS
     ================================================================ */
  $('#screw-pitch') .addEventListener('input', function () { screwPitch  = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#screw-handle').addEventListener('input', function () { screwHandle = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#screw-effort').addEventListener('input', function () { screwEffort = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#screw-load')  .addEventListener('input', function () { screwLoad   = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#screw-dm')    .addEventListener('input', function () { screwMeanD  = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#screw-mu')    .addEventListener('input', function () { screwMu     = +this.value; syncSliderLabels(); updateReadouts(); render(); });

  /* ================================================================
     UI — WEDGE CONTROLS
     ================================================================ */
  $('#wedge-angle').addEventListener('input', function () { wedgeAngle = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#wedge-force').addEventListener('input', function () { wedgeForce = +this.value; syncSliderLabels(); updateReadouts(); render(); });
  $('#wedge-mu')   .addEventListener('input', function () { wedgeMu    = +this.value; syncSliderLabels(); updateReadouts(); render(); });

  /* Master friction toggle */
  $('#use-friction').addEventListener('change', function () {
    useFriction = this.checked;
    if (animating || animDone) resetAnim();
    updateReadouts(); render();
  });

  /* ────────────────────────────────────────────────────────────────
     UNDO / REDO  — stack of full-state snapshots.
     Captured BEFORE every mutating user action (slider, preset,
     machine switch, friction/FBD/unit toggle, anim start, FBD).
     ──────────────────────────────────────────────────────────────── */
  var UNDO = [], REDO = [], UNDO_MAX = 50;
  function snap() {
    return JSON.stringify({
      mt: machineType, lc: leverClass, lE: leverEffort, lL: leverLoad, lEA: leverEArm, lLA: leverLArm,
      pt: pulleyType, pn: pulleyNum, pE: pulleyEffort, pL: pulleyLoad, pD: pulleyDiam,
      iA: inclAngle, iL: inclLoad, iE: inclEffort, iM: inclMu, iDir: inclDirection,
      wR: waWheelR, wr: waAxleR, wL: waLoad,
      sP: screwPitch, sH: screwHandle, sE: screwEffort, sL: screwLoad, sD: screwMeanD, sM: screwMu,
      wA: wedgeAngle, wF: wedgeForce, wM: wedgeMu,
      uF: useFriction, fbd: showFBD, us: unitSystem
    });
  }
  function restore(json) {
    var st = JSON.parse(json);
    machineType = st.mt; leverClass = st.lc;
    leverEffort = st.lE; leverLoad = st.lL; leverEArm = st.lEA; leverLArm = st.lLA;
    pulleyType = st.pt; pulleyNum = st.pn; pulleyEffort = st.pE; pulleyLoad = st.pL; pulleyDiam = st.pD;
    inclAngle = st.iA; inclLoad = st.iL; inclEffort = st.iE; inclMu = st.iM; inclDirection = st.iDir;
    waWheelR = st.wR; waAxleR = st.wr; waLoad = st.wL;
    screwPitch = st.sP; screwHandle = st.sH; screwEffort = st.sE; screwLoad = st.sL; screwMeanD = st.sD; screwMu = st.sM;
    wedgeAngle = st.wA; wedgeForce = st.wF; wedgeMu = st.wM;
    useFriction = !!st.uF; showFBD = !!st.fbd; unitSystem = st.us || 'SI';
    /* Push state into the DOM so sliders, pills, checkboxes match. */
    var stateMap = {
      'lever-effort': leverEffort, 'lever-load': leverLoad, 'lever-earm': leverEArm, 'lever-larm': leverLArm,
      'pulley-effort': pulleyEffort, 'pulley-load': pulleyLoad, 'pulley-diam': pulleyDiam,
      'incl-angle': inclAngle, 'incl-load': inclLoad, 'incl-effort': inclEffort, 'incl-mu': inclMu,
      'wa-wheelr': waWheelR, 'wa-axler': waAxleR, 'wa-load': waLoad,
      'screw-pitch': screwPitch, 'screw-handle': screwHandle, 'screw-effort': screwEffort, 'screw-load': screwLoad, 'screw-dm': screwMeanD, 'screw-mu': screwMu,
      'wedge-angle': wedgeAngle, 'wedge-force': wedgeForce, 'wedge-mu': wedgeMu
    };
    Object.keys(stateMap).forEach(function (id) { var el = $('#' + id); if (el) el.value = stateMap[id]; });
    /* Sync pills, checkboxes, unit button. */
    $$('#machine-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.machine === machineType); });
    $$('#lever-class-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.cls === leverClass); });
    $$('#pulley-type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.ptype === pulleyType); });
    $$('#incl-dir-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.dir === inclDirection); });
    syncPulleyRadios();
    var uf = $('#use-friction'); if (uf) uf.checked = useFriction;
    var fb = $('#show-fbd');    if (fb) fb.checked = showFBD;
    /* Sync the segmented SI|Imp control to the restored state */
    $$('#btn-units .cvs-unit-opt').forEach(function (b) {
      b.classList.toggle('active', b.dataset.unit === unitSystem);
    });
    /* Show the right machine controls panel. */
    ['#lever-ctrls','#pulley-ctrls','#inclined-ctrls','#wheel-axle-ctrls','#screw-ctrls','#wedge-ctrls'].forEach(function (s) { hide($(s)); });
    show($({ lever:'#lever-ctrls', pulley:'#pulley-ctrls', inclined:'#inclined-ctrls', 'wheel-axle':'#wheel-axle-ctrls', screw:'#screw-ctrls', wedge:'#wedge-ctrls' }[machineType]));
    if (animating || animDone) resetAnim();
    syncSliderLabels(); updateReadouts(); render();
  }
  function pushUndo() {
    UNDO.push(snap()); if (UNDO.length > UNDO_MAX) UNDO.shift();
    REDO = [];   /* mutation invalidates redo stack */
  }
  function doUndo() { if (UNDO.length === 0) return; REDO.push(snap()); restore(UNDO.pop()); }
  function doRedo() { if (REDO.length === 0) return; UNDO.push(snap()); restore(REDO.pop()); }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); doUndo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); doRedo(); }
  });
  /* Capture an initial state so the first undo doesn't go to nothing. */
  /* (deferred until after init by calling pushUndo() at end of init) */

  /* Wrap every slider/preset/toggle event to push an undo snapshot first. */
  $$('.sim-slider').forEach(function (sl) {
    sl.addEventListener('input', function () { /* throttle: snapshot only on change boundaries via pointerdown */ }, false);
    sl.addEventListener('pointerdown', pushUndo);
    sl.addEventListener('keydown', function (e) { if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].indexOf(e.key) >= 0) pushUndo(); });
  });

  /* ────────────────────────────────────────────────────────────────
     SLIDER STEPPERS (D7/E11)  — add [−] [+] buttons next to every slider
     value span for precise keyboard-free adjustment.
     ──────────────────────────────────────────────────────────────── */
  $$('.sim-slider').forEach(function (sl) {
    var group = sl.parentElement;             /* .sim-slider-group */
    if (!group || group.querySelector('.sim-step-minus')) return;
    var step = parseFloat(sl.step) || 1;
    var minus = document.createElement('button');
    var plus  = document.createElement('button');
    minus.type = 'button'; plus.type = 'button';
    minus.className = 'sim-step-minus';
    plus.className  = 'sim-step-plus';
    minus.textContent = '−'; plus.textContent = '+';
    minus.title = 'Decrease by ' + step;
    plus .title = 'Increase by ' + step;
    function bump(delta) {
      pushUndo();
      var min = parseFloat(sl.min), max = parseFloat(sl.max);
      var cur = parseFloat(sl.value);
      var next = Math.max(min, Math.min(max, cur + delta));
      /* Snap to step grid to avoid float drift */
      var snapped = Math.round((next - min) / step) * step + min;
      sl.value = snapped;
      sl.dispatchEvent(new Event('input', { bubbles: true }));
    }
    minus.addEventListener('click', function () { bump(-step); });
    plus .addEventListener('click', function () { bump(+step); });
    group.appendChild(minus); group.appendChild(plus);
  });

  /* ────────────────────────────────────────────────────────────────
     EXPORT  — PNG snapshot, CSV of current state + readouts.
     ──────────────────────────────────────────────────────────────── */
  function exportPNG() {
    /* Re-blit through a watermark layer. */
    var off = document.createElement('canvas');
    off.width = cvs.width; off.height = cvs.height;
    var octx = off.getContext('2d');
    octx.fillStyle = '#0d1117'; octx.fillRect(0, 0, off.width, off.height);
    octx.drawImage(cvs, 0, 0);
    octx.font = '600 ' + Math.round(off.width * 0.018) + 'px "Segoe UI", sans-serif';
    octx.fillStyle = 'rgba(245,200,66,0.55)'; octx.textAlign = 'right'; octx.textBaseline = 'bottom';
    octx.fillText('NHIT VisualLab', off.width - 12, off.height - 10);
    var url = off.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = url; a.download = 'simple-machines-' + machineType + '-' + Date.now() + '.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function exportCSV() {
    var rows = [['Field','Value','Unit']];
    rows.push(['Machine', machineType, '']);
    rows.push(['UnitSystem', unitSystem, '']);
    rows.push(['UseFriction', useFriction, '']);
    /* Inputs */
    function row(k, siVal, fmt) { rows.push([k, fmt(siVal).replace(/,/g, ''), '']); }
    if (machineType === 'lever')      { row('LeverClass', leverClass, String); row('Effort', leverEffort, fmtN); row('Load', leverLoad, fmtN); row('EffortArm', leverEArm, fmtM); row('LoadArm', leverLArm, fmtM); }
    if (machineType === 'pulley')     { row('Type', pulleyType, String); row('N', pulleyNum, String); row('Effort', pulleyEffort, fmtN); row('Load', pulleyLoad, fmtN); row('Diameter', pulleyDiam, fmtM); }
    if (machineType === 'inclined')   { row('Angle°', inclAngle, String); row('Load', inclLoad, fmtN); row('Effort', inclEffort, fmtN); row('Mu', inclMu, String); row('Direction', inclDirection === 1 ? 'UP' : 'DOWN', String); }
    if (machineType === 'wheel-axle') { row('WheelR', waWheelR, fmtM); row('AxleR', waAxleR, fmtM); row('Load', waLoad, fmtN); }
    if (machineType === 'screw')      { row('Pitch', screwPitch, fmtMM); row('HandleL', screwHandle, fmtMM); row('MeanDia', screwMeanD, fmtMM); row('Mu', screwMu, String); row('Effort', screwEffort, fmtN); row('Load', screwLoad, fmtN); }
    if (machineType === 'wedge')      { row('Apex°', wedgeAngle, String); row('Force', wedgeForce, fmtN); row('Mu', wedgeMu, String); }
    /* Results */
    rows.push(['MA',  calcMA(), '']);
    rows.push(['VR',  calcVR(), '']);
    rows.push(['Efficiency', calcEfficiency() + '%', '']);
    rows.push(['EffortRequired', fmtN(calcEffort()), '']);
    rows.push(['LoadCapacity', fmtN(calcLoad()), '']);
    rows.push(['SelfLock', selfLockStatus(), '']);
    var csv = rows.map(function (r) { return r.join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'simple-machines-' + machineType + '-' + Date.now() + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  /* ────────────────────────────────────────────────────────────────
     CANVAS CONTEXT MENU  (right-click → Export, Reset, Toggle Friction/FBD)
     ──────────────────────────────────────────────────────────────── */
  var ctxMenu = null;
  function showCtxMenu(x, y) {
    hideCtxMenu();
    var m = document.createElement('div');
    m.className = 'cvs-ctx-menu';
    m.style.cssText = 'position:fixed;top:' + y + 'px;left:' + x + 'px;background:#141a2e;border:1px solid rgba(139,157,195,.3);border-radius:8px;padding:6px;z-index:5000;box-shadow:0 12px 28px rgba(0,0,0,.55);min-width:170px;';
    var items = [
      { label: 'Export PNG', fn: exportPNG },
      { label: 'Export CSV', fn: exportCSV },
      { label: '─', sep: true },
      { label: (useFriction ? '✓ ' : '   ') + 'Friction', fn: function () { pushUndo(); useFriction = !useFriction; var uf = $('#use-friction'); if (uf) uf.checked = useFriction; updateReadouts(); render(); } },
      { label: (showFBD ? '✓ ' : '   ') + 'FBD',         fn: function () { pushUndo(); showFBD = !showFBD; var fb = $('#show-fbd'); if (fb) fb.checked = showFBD; render(); } },
      { label: 'Toggle SI/Imperial',                       fn: function () { pushUndo(); setUnitSystem(isImp() ? 'SI' : 'IMP'); } },
      { label: '─', sep: true },
      { label: 'Undo (Ctrl+Z)', fn: doUndo },
      { label: 'Redo (Ctrl+Shift+Z)', fn: doRedo },
      { label: 'Reset animation',     fn: resetAnim }
    ];
    items.forEach(function (it) {
      if (it.sep) {
        var hr = document.createElement('div');
        hr.style.cssText = 'height:1px;background:rgba(139,157,195,.2);margin:4px 0;';
        m.appendChild(hr);
        return;
      }
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = it.label;
      b.style.cssText = 'display:block;width:100%;text-align:left;padding:6px 10px;background:transparent;border:0;color:#dde3f0;font-size:0.82rem;cursor:pointer;border-radius:4px;';
      b.addEventListener('mouseenter', function () { this.style.background = 'rgba(66,165,245,0.18)'; });
      b.addEventListener('mouseleave', function () { this.style.background = 'transparent'; });
      b.addEventListener('click', function () { hideCtxMenu(); it.fn(); });
      m.appendChild(b);
    });
    document.body.appendChild(m);
    ctxMenu = m;
    /* Reposition if off-screen. */
    var r = m.getBoundingClientRect();
    if (r.right > window.innerWidth)  m.style.left = Math.max(8, window.innerWidth - r.width - 8) + 'px';
    if (r.bottom > window.innerHeight) m.style.top  = Math.max(8, window.innerHeight - r.height - 8) + 'px';
  }
  function hideCtxMenu() { if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; } }
  cvs.addEventListener('contextmenu', function (e) { e.preventDefault(); showCtxMenu(e.clientX, e.clientY); });
  document.addEventListener('click', function (e) { if (ctxMenu && !ctxMenu.contains(e.target)) hideCtxMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideCtxMenu(); });

  /* Unit-system toggle — segmented [SI | Imp].  State stays SI; display only. */
  function setUnitSystem(sys) {
    unitSystem = (sys === 'IMP') ? 'IMP' : 'SI';
    $$('#btn-units .cvs-unit-opt').forEach(function (b) {
      b.classList.toggle('active', b.dataset.unit === unitSystem);
    });
    syncSliderLabels();
    updateReadouts();
    render();
  }
  $('#btn-units').addEventListener('click', function (e) {
    var b = e.target.closest('.cvs-unit-opt');
    if (!b || b.dataset.unit === unitSystem) return;
    pushUndo();
    setUnitSystem(b.dataset.unit);
  });

  /* ================================================================
     PRESETS
     ================================================================ */
  /* Tiny helper: set both state var and slider DOM value, then sync labels in one go. */
  function applyPreset(setters) {
    Object.keys(setters).forEach(function (sliderId) {
      var v = setters[sliderId];
      var s = $('#' + sliderId);
      if (s) s.value = v;
    });
    syncSliderLabels();
  }

  var PRESETS = {
    wheelbarrow: function () {
      setMachine('lever');
      leverClass = 2;
      $$('#lever-class-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.cls === 2); });
      leverEffort = 50; leverLoad = 300; leverEArm = 3; leverLArm = 0.5;
      applyPreset({ 'lever-effort': 50, 'lever-load': 300, 'lever-earm': 3, 'lever-larm': 0.5 });
    },
    'fishing-rod': function () {
      setMachine('lever');
      leverClass = 3;
      $$('#lever-class-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.cls === 3); });
      leverEffort = 200; leverLoad = 50; leverEArm = 0.5; leverLArm = 3;
      applyPreset({ 'lever-effort': 200, 'lever-load': 50, 'lever-earm': 0.5, 'lever-larm': 3 });
    },
    'crane-pulley': function () {
      setMachine('pulley');
      pulleyType = 'block'; pulleyNum = 4; pulleyLoad = 800;
      $$('#pulley-type-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.ptype === 'block'); });
      syncPulleyRadios();
      applyPreset({ 'pulley-load': 800 });
    },
    'car-jack': function () {
      setMachine('screw');
      screwPitch = 3; screwHandle = 250; screwLoad = 8000; screwMeanD = 25; screwMu = 0.15;
      applyPreset({ 'screw-pitch': 3, 'screw-handle': 250, 'screw-load': 8000, 'screw-dm': 25, 'screw-mu': 0.15 });
    },
    'loading-ramp': function () {
      setMachine('inclined');
      inclAngle = 15; inclLoad = 800; inclEffort = 250; inclMu = 0.20; inclDirection = 1;
      $$('#incl-dir-tabs .pill').forEach(function (p) { p.classList.toggle('active', +p.dataset.dir === 1); });
      applyPreset({ 'incl-angle': 15, 'incl-load': 800, 'incl-effort': 250, 'incl-mu': 0.20 });
    },
    'door-wedge': function () {
      setMachine('wedge');
      wedgeAngle = 10; wedgeForce = 200; wedgeMu = 0.35;
      applyPreset({ 'wedge-angle': 10, 'wedge-force': 200, 'wedge-mu': 0.35 });
    },
    'screwdriver': function () {
      setMachine('wheel-axle');
      waWheelR = 0.40; waAxleR = 0.05; waLoad = 200;
      applyPreset({ 'wa-wheelr': 0.40, 'wa-axler': 0.05, 'wa-load': 200 });
    }
  };

  $('#preset-row').addEventListener('click', function (e) {
    var btn = e.target.closest('.preset-btn');
    if (!btn) return;
    var key = btn.dataset.preset;
    if (PRESETS[key]) {
      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      PRESETS[key]();
      updateReadouts(); render();
    }
  });

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
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s.replace(/= ([0-9.]+)/, '= <strong>$1</strong>') + '</p>'; }).join('') +
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
    var tol = Math.max(Math.abs(pProblem.answer) * 0.02, 0.5);
    var ok = !isNaN(val) && Math.abs(val - pProblem.answer) <= tol;
    if (ok) pScore++;
    $('#pp-feedback').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect \u2014 answer: ' + pProblem.answer + ' ' + pProblem.unit;
    $('#pp-feedback').className = 'feedback ' + (ok ? 'ok' : 'err');
    $('#pp-input').disabled = true;
    show($('#pp-next'));
    var solEl = $('#pp-solution');
    solEl.innerHTML = '<h4>Step-by-Step Solution</h4>' +
      pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([0-9.]+)/, '= <strong>$1</strong>') + '</p>'; }).join('');
    show(solEl);
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
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
        '<div class="quiz-input-row"><input class="qi-input" id="qi-val" type="number" step="any" placeholder="Your answer"><span class="qi-unit">' + (q.unit || '') + '</span>' +
        '<button class="btn btn-primary" id="q-submit">Submit</button></div>' +
        '<p class="quiz-feedback" id="qfb"></p>' +
        '<button class="btn btn-ghost" id="q-next" style="display:none;margin-top:10px;">Next \u2192</button>';
      panel.querySelector('#q-submit').addEventListener('click', function () { submitNumeric(q, panel); });
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
    var tol = Math.max(Math.abs(q.answer) * 0.02, 0.5);
    var ok = !isNaN(val) && Math.abs(val - q.answer) <= tol;
    if (ok) quizScore++;
    q._given = isNaN(val) ? 'No answer' : val;
    q._ok = ok;
    panel.querySelector('#qfb').textContent = ok ? '\u2714 Correct!' : '\u2718 Answer: ' + q.answer + ' ' + (q.unit || '');
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
          : '<strong>Your answer:</strong> ' + q._given + ' &nbsp;|&nbsp; <strong>Correct:</strong> ' + q.answer + ' ' + (q.unit || '');
        return '<div class="qr-row ' + rowCls + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + detail + '</span><span class="qr-mark">' + mark + '</span></div>';
      }).join('') +
      '</div>' +
      '<button class="btn btn-primary" id="qr-retry" style="align-self:flex-start;">New Quiz</button>';
    el.querySelector('#qr-retry').addEventListener('click', startQuiz);
    show(el);
  }

  /* ================================================================
     CANVAS POINTER EVENTS
     ================================================================ */
  /* Only the lever and the inclined plane respond to dragging. */
  function isDraggableMachine() { return machineType === 'lever' || machineType === 'inclined'; }

  var isDragging = false, dragArmed = false, dragStart = null, dragMoved = false;
  var DRAG_SLOP = 4;            /* px of movement before a drag counts */

  cvs.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate' || !isDraggableMachine()) return;
    /* Arm, but do NOT act yet. Acting on pointerdown meant a single stray
       click anywhere on the canvas instantly rewrote the effort arm or the
       ramp angle and wiped the user's setup, with no undo entry. */
    dragArmed = true; dragMoved = false;
    dragStart = { x: e.clientX, y: e.clientY };
  });
  cvs.addEventListener('pointermove', function (e) {
    if (!dragArmed) {
      /* Cursor affordance so it is discoverable that these two are draggable. */
      cvs.style.cursor = (mode === 'simulate' && isDraggableMachine())
        ? (machineType === 'lever' ? 'ew-resize' : 'ns-resize') : 'default';
      return;
    }
    if (!dragMoved) {
      if (Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y) < DRAG_SLOP) return;
      dragMoved = true; isDragging = true;
      pushUndo();                       /* one undo entry per drag gesture */
      if (cvs.setPointerCapture) { try { cvs.setPointerCapture(e.pointerId); } catch (err) {} }
    }
    handleDrag(e);
  });
  function endDrag() { isDragging = false; dragArmed = false; dragMoved = false; }
  cvs.addEventListener('pointerup', endDrag);
  cvs.addEventListener('pointercancel', endDrag);
  cvs.addEventListener('pointerleave', function () { if (!isDragging) endDrag(); });

  function handleDrag(e) {
    var rect = cvs.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (W / rect.width);
    var y = (e.clientY - rect.top) * (H / rect.height);

    if (machineType === 'lever') {
      /* Dragging left/right adjusts effort arm ratio */
      var ratio = Math.max(0.1, Math.min(0.9, x / W));
      leverEArm = round1(0.5 + ratio * 4.5);
      $('#lever-earm').value = leverEArm;
      syncSliderLabels(); updateReadouts(); render();
    } else if (machineType === 'inclined') {
      var angle = Math.max(5, Math.min(60, Math.round((1 - y / H) * 60)));
      inclAngle = angle;
      $('#incl-angle').value = angle;
      syncSliderLabels(); updateReadouts(); render();
    }
  }

  /* ================================================================
     ANIMATION SYSTEM
     ================================================================ */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function resetAnim() {
    animating = false;
    animTime = 0;
    animDone = false;
    leverAnimAngle = 0;
    pulleyAnimDist = 0;
    pulleyRopeOffset = 0;
    inclAnimPos = 0;
    waAnimRot = 0;
    screwAnimRot = 0;
    wedgeAnimPos = 0;
    pulleyCanLift = false;
    inclCanPush = false;
    screwCanTurn = false;
    if (animRafId) { cancelAnimationFrame(animRafId); animRafId = null; }
    var btn = $('#btn-play');
    if (btn) {
      btn.classList.remove('playing');
      setPlayButton('\u25B6', 'Simulate');
    }
    var status = $('#play-status');
    if (status) { status.textContent = 'Set up variables, then press Simulate'; status.className = 'play-status'; }
    render();
  }

  function startAnim() {
    if (animating) return;
    animating = true;
    animTime = 0;
    animDone = false;
    animLastTs = 0;

    var status = $('#play-status');
    var btn = $('#btn-play');

    if (machineType === 'lever') {
      var torqueE = leverEffort * leverEArm;
      var torqueL = leverLoad * leverLArm;
      var balanced = Math.abs(torqueE - torqueL) < 0.5;
      /* Match drawLever clamp: keep beam endpoint inside canvas. */
      var lvMaxAng = 0.32;
      if (balanced) {
        leverTargetAngle = 0;
      } else {
        var torqueDiff = (torqueL - torqueE) / Math.max(torqueE + torqueL, 1);
        leverTargetAngle = torqueDiff * lvMaxAng * 1.5;
      }
      leverTargetAngle = Math.max(-lvMaxAng, Math.min(lvMaxAng, leverTargetAngle));
      if (status) {
        if (balanced) { status.textContent = 'Balanced! Torques are equal.'; status.className = 'play-status balanced'; }
        else if (torqueE > torqueL) { status.textContent = 'Effort torque > Load torque \u2014 lifting load'; status.className = 'play-status active'; }
        else { status.textContent = 'Load torque > Effort torque \u2014 load side drops'; status.className = 'play-status active'; }
      }
    } else if (machineType === 'pulley') {
      var requiredEffort = calcEffort();    /* respects per-sheave loss */
      pulleyCanLift = (pulleyEffort >= requiredEffort);
      if (status) {
        if (pulleyCanLift) {
          status.textContent = 'Effort ' + fmtN(pulleyEffort) + ' \u2265 ' + fmtN(requiredEffort) + ' needed \u2014 load rises!';
          status.className = 'play-status active';
        } else {
          status.textContent = 'Effort ' + fmtN(pulleyEffort) + ' < ' + fmtN(requiredEffort) + ' needed \u2014 cannot lift!';
          status.className = 'play-status fail';
        }
      }
    } else if (machineType === 'inclined') {
      var sinA = Math.sin(deg2rad(inclAngle));
      var cosA = Math.cos(deg2rad(inclAngle));
      var muI = useFriction ? inclMu : 0;
      var requiredUp = round2(inclLoad * (sinA + muI * cosA));
      var holdDown  = round2(Math.max(0, inclLoad * (sinA - muI * cosA))); /* effort needed to keep load from sliding when lowering */
      if (inclDirection === 1) {
        inclCanPush = (inclEffort >= requiredUp);
        if (status) {
          if (inclCanPush) { status.textContent = 'Effort ' + fmtN(inclEffort) + ' \u2265 ' + fmtN(requiredUp) + ' \u2014 block slides UP'; status.className = 'play-status active'; }
          else             { status.textContent = 'Effort ' + fmtN(inclEffort) + ' < ' + fmtN(requiredUp) + ' \u2014 effort insufficient'; status.className = 'play-status fail'; }
        }
      } else {
        /* Lowering: if self-locking (tan\u03b8 \u2264 \u03bc) the load won't slide on its own. */
        if (holdDown <= 0) {
          inclCanPush = false; /* block stays in place \u2014 self-locking */
          if (status) { status.textContent = 'Self-locking: tan ' + inclAngle + '\u00b0 \u2264 \u03bc \u2014 load will not slide down'; status.className = 'play-status balanced'; }
        } else {
          inclCanPush = true; /* gravity overcomes friction and load slides down */
          if (status) { status.textContent = 'Lowering: gravity force ' + fmtN(holdDown) + ' drives load DOWN'; status.className = 'play-status active'; }
        }
      }
    } else if (machineType === 'screw') {
      var requiredSc = calcEffort();         /* friction-aware */
      screwCanTurn = (screwEffort >= requiredSc);
      if (status) {
        if (screwCanTurn) {
          status.textContent = 'Effort ' + fmtN(screwEffort) + ' \u2265 ' + fmtN(requiredSc) + ' \u2014 screw advances!';
          status.className = 'play-status active';
        } else {
          status.textContent = 'Effort ' + fmtN(screwEffort) + ' < ' + fmtN(requiredSc) + ' \u2014 cannot turn!';
          status.className = 'play-status fail';
        }
      }
    } else if (machineType === 'wedge') {
      if (status) { status.textContent = 'Driving wedge into material...'; status.className = 'play-status active'; }
    } else if (machineType === 'wheel-axle') {
      if (status) { status.textContent = 'Rotating wheel...'; status.className = 'play-status active'; }
    }

    if (btn) { btn.classList.add('playing'); setPlayButton('\u275A\u275A', 'Playing\u2026'); }
    animRafId = requestAnimationFrame(animLoop);
  }

  function animLoop(ts) {
    if (!animating) return;

    if (animLastTs === 0) animLastTs = ts;
    var dt = (ts - animLastTs) / 1000;
    animLastTs = ts;

    animTime = Math.min(1, animTime + dt * animSpeed);
    var t = easeOut(animTime);

    switch (machineType) {
      case 'lever':
        leverAnimAngle = leverTargetAngle * t;
        if (animTime > 0.7 && leverTargetAngle !== 0) {
          var bouncePhase = (animTime - 0.7) / 0.3;
          var bounce = Math.sin(bouncePhase * Math.PI * 4) * 0.06 * (1 - bouncePhase);
          leverAnimAngle += bounce;
        }
        break;
      case 'pulley':
        if (pulleyCanLift) {
          pulleyAnimDist = t * pulleyMaxLift;
          pulleyRopeOffset = t * pulleyMaxLift * calcVR();
        } else {
          /* Jerk and fail — small upward attempt then fall back */
          if (animTime < 0.3) {
            pulleyAnimDist = easeOut(animTime / 0.3) * 8;
          } else {
            pulleyAnimDist = 8 * (1 - easeOut((animTime - 0.3) / 0.7));
          }
          pulleyRopeOffset = pulleyAnimDist * calcVR();
        }
        break;
      case 'inclined':
        if (inclCanPush) {
          inclAnimPos = t * 0.8; /* slides up from 0.1 to 0.9 */
        } else {
          inclAnimPos = -t * 0.4; /* slides down */
        }
        break;
      case 'wheel-axle':
        waAnimRot = t * Math.PI * 2;
        break;
      case 'screw':
        if (screwCanTurn) {
          screwAnimRot = t * Math.PI * 4;
        } else {
          /* Jerk and fail */
          if (animTime < 0.3) {
            screwAnimRot = easeOut(animTime / 0.3) * 0.3;
          } else {
            screwAnimRot = 0.3 * (1 - easeOut((animTime - 0.3) / 0.7));
          }
        }
        break;
      case 'wedge':
        wedgeAnimPos = t;
        break;
    }

    render();

    if (animTime >= 1) {
      animDone = true;
      animating = true;
      var btn = $('#btn-play');
      if (btn) { btn.classList.add('playing'); setPlayButton('\u2714', 'Done'); }
      return;
    }

    animRafId = requestAnimationFrame(animLoop);
  }

  /* Play / Reset buttons */
  var btnPlay = $('#btn-play');
  var btnReset = $('#btn-reset');
  if (btnPlay) {
    btnPlay.addEventListener('click', function () {
      if (animating || animDone) {
        resetAnim();
      } else {
        startAnim();
      }
    });
  }
  if (btnReset) {
    btnReset.addEventListener('click', function () { resetAnim(); });
  }

  /* Reset animation when machine type or class changes */
  var origSetMachine = setMachine;
  setMachine = function (type) {
    resetAnim();
    origSetMachine(type);
  };

  /* Also reset when any slider changes */
  $$('.sim-slider').forEach(function (sl) {
    sl.addEventListener('input', function () {
      if (animating || animDone) resetAnim();
    });
  });

  /* Reset when lever class changes */
  var origLeverClassHandler = null; /* handled via slider reset above */

  /* ================================================================
     FBD TOGGLE + SHOW-CALCULATION MODAL
     ================================================================ */
  var cbFBD = $('#show-fbd');
  if (cbFBD) cbFBD.addEventListener('change', function () { showFBD = this.checked; render(); });

  /* Convert a textual formula into KaTeX-ready LaTeX. Wraps in inline delimiters. */
  function toLatex(s) {
    if (!s) return s;
    return s
      .replace(/θ/g, '\\theta')
      .replace(/μ/g, '\\mu')
      .replace(/λ/g, '\\lambda')
      .replace(/φ/g, '\\varphi')
      .replace(/α/g, '\\alpha')
      .replace(/η/g, '\\eta')
      .replace(/π/g, '\\pi ')
      .replace(/×/g, '\\cdot ')
      .replace(/≤/g, '\\le ')
      .replace(/≥/g, '\\ge ')
      .replace(/⇒/g, '\\Rightarrow ')
      .replace(/∥/g, '_{\\parallel}')
      .replace(/⊥/g, '_{\\perp}')
      .replace(/ₘ/g, '_{m}')
      .replace(/_(ideal|pivot|bearing|total|per|id|m)/g, '_{$1}')
      .replace(/\bsinθ\b/g, '\\sin\\theta')  /* no-op since θ already replaced — kept for safety */
      .replace(/\\theta\)/g, '\\theta)')
      .replace(/sin\(/g, '\\sin(').replace(/cos\(/g, '\\cos(').replace(/tan\(/g, '\\tan(')
      .replace(/atan\(/g, '\\arctan(')
      .replace(/sin\\theta/g, '\\sin\\theta').replace(/cos\\theta/g, '\\cos\\theta').replace(/tan\\theta/g, '\\tan\\theta')
      .replace(/sin\\lambda/g, '\\sin\\lambda').replace(/tan\\lambda/g, '\\tan\\lambda')
      .replace(/tan\\varphi/g, '\\tan\\varphi');
  }

  /* Helper: generic step block.  formula is wrapped in \(...\) so KaTeX renders it. */
  function calcStep(num, title, formula, calculation, result) {
    var html = '<div class="cs-step"><div class="cs-step-hd"><span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula)     html += '<div class="cs-formula">\\(' + toLatex(formula) + '\\)</div>';
    if (calculation) html += '<div class="cs-calc">' + calculation.replace(/\n/g, '<br>') + '</div>';
    if (result != null) html += '<div class="cs-result">→ <strong>' + result + '</strong></div>';
    return html + '</div>';
  }
  function rN(x, d) { if (!isFinite(x)) return String(x); var p = Math.pow(10, d || 0); return (Math.round(x * p) / p).toString(); }

  function buildCalcSteps() {
    var html = '<div class="cs-inputs"><span class="cs-badge">Given — Current State</span><div class="cs-given">';
    var fricLine = useFriction ? 'Friction: <strong>ON</strong>' : 'Friction: <strong>OFF (ideal)</strong>';
    var unitLine = ' &middot; Units: <strong>' + (isImp() ? 'Imperial (lbf, ft, in)' : 'SI (N, m, mm)') + '</strong>';
    var s = 0;
    if (machineType === 'lever') {
      html += '<span>Class = ' + leverClass + '</span><span>Effort arm = ' + fmtM(leverEArm) + '</span><span>Load arm = ' + fmtM(leverLArm) + '</span><span>Load = ' + fmtN(leverLoad) + '</span></div>';
      html += '<p class="cs-si-note">ⓘ ' + fricLine + (useFriction ? ' — pivot η = ' + LEVER_ETA : '') + unitLine + '</p></div>';
      html += calcStep(++s, 'Velocity Ratio (geometric)', 'VR = effort arm / load arm', 'VR = ' + nbM(leverEArm) + ' / ' + nbM(leverLArm) + ' ' + lblM(), rN(leverEArm / leverLArm, 2));
      html += calcStep(++s, 'Ideal effort (frictionless)', 'E_ideal = Load × load arm / effort arm', 'E_ideal = ' + nbN(leverLoad) + ' ' + lblN() + ' × ' + nbM(leverLArm) + ' / ' + nbM(leverEArm), fmtN(leverLoad * leverLArm / leverEArm));
      if (useFriction) html += calcStep(++s, 'Real effort with pivot friction', 'E = E_ideal / η_pivot', 'E = ' + fmtN(leverLoad * leverLArm / leverEArm) + ' / ' + LEVER_ETA, fmtN(calcEffort()));
      html += calcStep(++s, 'Mechanical Advantage', 'MA = Load / E', '', rN(calcMA(), 2));
      html += calcStep(++s, 'Efficiency', 'η = MA / VR × 100%', 'η = ' + rN(calcMA(), 2) + ' / ' + rN(calcVR(), 2) + ' × 100', rN(calcEfficiency(), 1) + '%');
    } else if (machineType === 'pulley') {
      var vrP = calcVR();
      html += '<span>Type = ' + pulleyType + '</span><span>n (segments) = ' + vrP + '</span><span>Load = ' + fmtN(pulleyLoad) + '</span></div>';
      html += '<p class="cs-si-note">ⓘ ' + fricLine + ' (per-sheave η = ' + pulleyEtaPerSheave + ')' + unitLine + '</p></div>';
      html += calcStep(++s, 'Velocity Ratio = number of rope segments', 'VR = n', '', rN(vrP, 2));
      html += calcStep(++s, 'Ideal effort', 'E_ideal = Load / VR', 'E_ideal = ' + fmtN(pulleyLoad) + ' / ' + vrP, fmtN(pulleyLoad / vrP));
      if (useFriction) {
        var etaT = Math.pow(pulleyEtaPerSheave, Math.max(1, vrP));
        html += calcStep(++s, 'Compounded sheave efficiency', 'η_total = η_per^n', 'η_total = ' + pulleyEtaPerSheave + '^' + vrP, rN(etaT * 100, 2) + '%');
        html += calcStep(++s, 'Real required effort', 'E = E_ideal / η_total', 'E = ' + fmtN(pulleyLoad / vrP) + ' / ' + rN(etaT, 3), fmtN(calcEffort()));
      }
      html += calcStep(++s, 'Actual MA & efficiency', 'MA = L / E', 'MA = ' + fmtN(pulleyLoad) + ' / ' + fmtN(calcEffort()), rN(calcMA(), 2) + ',  η = ' + rN(calcEfficiency(), 1) + '%');
    } else if (machineType === 'inclined') {
      var sinA = Math.sin(deg2rad(inclAngle)), cosA = Math.cos(deg2rad(inclAngle));
      html += '<span>θ = ' + inclAngle + '°</span><span>Load W = ' + fmtN(inclLoad) + '</span><span>μ = ' + (useFriction ? inclMu : inclMu + ' (inactive → 0)') + '</span><span>Direction = ' + (inclDirection === 1 ? 'Lift UP' : 'Lower DOWN') + '</span></div>';
      html += '<p class="cs-si-note">ⓘ ' + fricLine + unitLine + '</p></div>';
      html += calcStep(++s, 'Weight decomposition', 'W∥ = W sinθ (along ramp)\nW⊥ = W cosθ (into ramp)', 'W∥ = ' + fmtN(inclLoad) + ' × sin(' + inclAngle + '°) = ' + fmtN(inclLoad * sinA) + '\nW⊥ = ' + fmtN(inclLoad) + ' × cos(' + inclAngle + '°) = ' + fmtN(inclLoad * cosA), null);
      var muE = useFriction ? inclMu : 0;
      var fric = muE * inclLoad * cosA;
      html += calcStep(++s, 'Friction force', 'f = μ N = μ W cosθ', 'f = ' + muE + ' × ' + fmtN(inclLoad * cosA), fmtN(fric));
      if (inclDirection === 1) {
        html += calcStep(++s, 'Effort to push UP', 'E = W (sinθ + μ cosθ)', 'E = ' + fmtN(inclLoad) + ' × (' + rN(sinA, 3) + ' + ' + muE + '×' + rN(cosA, 3) + ')', fmtN(calcEffort()));
      } else {
        html += calcStep(++s, 'Effort to lower DOWN', 'E = max(0, W (sinθ − μ cosθ))', 'E = max(0, ' + fmtN(inclLoad) + ' × (' + rN(sinA, 3) + ' − ' + muE + '×' + rN(cosA, 3) + '))', fmtN(calcEffort()));
        if (selfLockStatus() === 'locked') html += calcStep(++s, 'Self-locking check', 'tanθ ≤ μ ⇒ load holds without effort', 'tan(' + inclAngle + '°) = ' + rN(Math.tan(deg2rad(inclAngle)), 3) + ' ≤ ' + inclMu, 'LOCKED');
      }
      html += calcStep(++s, 'Ideal MA & VR', 'MA_id = VR = 1/sinθ', '1 / sin(' + inclAngle + '°) = 1/' + rN(sinA, 3), rN(1 / sinA, 2));
      var etaModalIncl = (inclDirection === -1 && useFriction) ? '— (gravity supplies the work)' : rN(calcEfficiency(), 1) + '%';
      html += calcStep(++s, 'Actual MA & η', 'MA = L/E,  η = MA/VR × 100%', '', rN(calcMA(), 2) + ',  η = ' + etaModalIncl);
    } else if (machineType === 'wheel-axle') {
      html += '<span>Wheel R = ' + fmtM(waWheelR) + '</span><span>Axle r = ' + fmtM(waAxleR) + '</span><span>Load = ' + fmtN(waLoad) + '</span></div>';
      html += '<p class="cs-si-note">ⓘ ' + fricLine + (useFriction ? ' — axle bearing η = ' + WA_ETA : '') + unitLine + '</p></div>';
      html += calcStep(++s, 'Velocity Ratio = R / r', 'VR = R / r', 'VR = ' + nbM(waWheelR) + ' / ' + nbM(waAxleR) + ' ' + lblM(), rN(waWheelR / waAxleR, 2));
      html += calcStep(++s, 'Ideal effort (frictionless)', 'E_ideal = Load × r / R', 'E = ' + fmtN(waLoad) + ' × ' + nbM(waAxleR) + ' / ' + nbM(waWheelR), fmtN(waLoad * waAxleR / waWheelR));
      if (useFriction) html += calcStep(++s, 'Real effort with bearing friction', 'E = E_ideal / η_bearing', 'E = ' + fmtN(waLoad * waAxleR / waWheelR) + ' / ' + WA_ETA, fmtN(calcEffort()));
      html += calcStep(++s, 'Mechanical Advantage', 'MA = Load / E', '', rN(calcMA(), 2));
      html += calcStep(++s, 'Distance trade-off', 'Effort travels 2πR while load rises 2πr', '2πR = ' + fmtM(2 * Math.PI * waWheelR) + '   |   2πr = ' + fmtM(2 * Math.PI * waAxleR), 'Ratio ' + rN(waWheelR / waAxleR, 2) + ' : 1');
    } else if (machineType === 'screw') {
      var lam = screwLeadA(), phi = fricAngle(screwMu);
      var ma_i = 2 * Math.PI * screwHandle / screwPitch;
      html += '<span>Pitch p = ' + fmtMM(screwPitch) + '</span><span>Handle L = ' + fmtMM(screwHandle) + '</span><span>Mean Ø dₘ = ' + fmtMM(screwMeanD) + '</span><span>μ = ' + (useFriction ? screwMu : screwMu + ' (inactive → 0)') + '</span><span>Load = ' + fmtN(screwLoad) + '</span></div>';
      html += '<p class="cs-si-note">ⓘ ' + fricLine + unitLine + '</p></div>';
      html += calcStep(++s, 'Ideal MA = VR', 'MA = 2πL / p', '2 × π × ' + nbMM(screwHandle) + ' / ' + nbMM(screwPitch) + ' (in ' + lblMM() + ')', rN(ma_i, 2));
      html += calcStep(++s, 'Lead angle λ', 'tanλ = p / (π dₘ)', 'λ = atan(' + nbMM(screwPitch) + ' / (π × ' + nbMM(screwMeanD) + '))', rN(lam * 180 / Math.PI, 2) + '°');
      var muScrEff = useFriction ? screwMu : 0;
      var phiEff = fricAngle(muScrEff);
      html += calcStep(++s, 'Friction angle φ', 'tanφ = μ', 'φ = atan(' + muScrEff + ')', rN(phiEff * 180 / Math.PI, 2) + '°');
      if (useFriction) {
        var etaScr = Math.tan(lam) / Math.tan(lam + phi);
        html += calcStep(++s, 'Efficiency', 'η = tanλ / tan(λ + φ)', 'η = tan(' + rN(lam * 180 / Math.PI, 2) + '°) / tan(' + rN((lam + phi) * 180 / Math.PI, 2) + '°)', rN(etaScr * 100, 2) + '%');
        html += calcStep(++s, 'Real required effort', 'E = (Load / MA_ideal) / η', 'E = (' + fmtN(screwLoad) + ' / ' + rN(ma_i, 2) + ') / ' + rN(etaScr, 3), fmtN(calcEffort()));
        if (selfLockStatus() === 'locked') html += calcStep(++s, 'Self-locking check', 'φ ≥ λ ⇒ load cannot back-drive the screw', rN(phi * 180 / Math.PI, 2) + '° ≥ ' + rN(lam * 180 / Math.PI, 2) + '°', 'LOCKED');
      }
      html += calcStep(++s, 'Actual MA', 'MA = Load / E', '', rN(calcMA(), 2));
    } else if (machineType === 'wedge') {
      var halfA = wedgeHalfA();
      var phiW = fricAngle(useFriction ? wedgeMu : 0);
      html += '<span>Apex α = ' + wedgeAngle + '°</span><span>Driving F = ' + fmtN(wedgeForce) + '</span><span>μ = ' + (useFriction ? wedgeMu : wedgeMu + ' (inactive → 0)') + '</span></div>';
      html += '<p class="cs-si-note">ⓘ ' + fricLine + unitLine + '</p></div>';
      html += calcStep(++s, 'Geometric VR', 'VR = 1 / (2 tan(α/2))', '1 / (2 × tan(' + (wedgeAngle / 2) + '°))', rN(calcVR(), 2));
      html += calcStep(++s, 'Friction angle φ', 'tanφ = μ', 'φ = atan(' + (useFriction ? wedgeMu : 0) + ')', rN(phiW * 180 / Math.PI, 2) + '°');
      html += calcStep(++s, 'Splitting load per face', 'W = F / (2 × tan(α/2 + φ))', 'W = ' + fmtN(wedgeForce) + ' / (2 × tan(' + rN((halfA + phiW) * 180 / Math.PI, 2) + '°))', fmtN(calcLoad()));
      html += calcStep(++s, 'Actual MA & η', 'MA = L / E,  η = MA / VR × 100%', '', rN(calcMA(), 2) + ',  η = ' + rN(calcEfficiency(), 1) + '%');
      if (selfLockStatus() === 'locked') html += calcStep(++s, 'Self-holding check', 'α/2 ≤ φ ⇒ wedge stays put once driven', rN(halfA * 180 / Math.PI, 2) + '° ≤ ' + rN(phiW * 180 / Math.PI, 2) + '°', 'LOCKED');
    }
    return html;
  }

  function openCalcModal() {
    var m = $('#calc-modal'); if (!m) return;
    var body = $('#calc-modal-body');
    body.innerHTML = buildCalcSteps();
    m.classList.add('active');
    m.style.display = 'flex';
    /* Render KaTeX once it's loaded.  auto-render walks the modal body. */
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(body, {
          delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }],
          throwOnError: false
        });
      } catch (e) { /* katex not ready yet — fallback to plain text */ }
    }
  }
  function closeCalcModal() {
    var m = $('#calc-modal'); if (!m) return;
    m.classList.remove('active'); m.style.display = 'none';
  }
  var btnCalc = $('#btn-calc');
  if (btnCalc) btnCalc.addEventListener('click', openCalcModal);
  var btnCalcClose = $('#calc-modal-close');
  if (btnCalcClose) btnCalcClose.addEventListener('click', closeCalcModal);
  var calcModal = $('#calc-modal');
  if (calcModal) calcModal.addEventListener('click', function (e) { if (e.target === calcModal) closeCalcModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCalcModal(); });

  /* ================================================================
     INIT
     ================================================================ */
  syncSliderLabels();
  updateReadouts();
  syncPulleyRadios();
  setMachine('lever');
  setMode('simulate');
  pushUndo();        /* baseline snapshot so first user undo lands here */

})();
