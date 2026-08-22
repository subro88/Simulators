(function () {
  'use strict';

  /* ================================================================
     WEB AUDIO — hiss sound for exhaust
     ================================================================ */

  var audioCtx = null;
  function playHiss() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var bufSize = audioCtx.sampleRate * 0.06;
    var buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    var src = audioCtx.createBufferSource();
    src.buffer = buf;
    var gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start();
  }

  /* ================================================================
     EXPLORE DATA — 16 concept cards across 4 categories
     ================================================================ */

  var CONCEPTS = [
    /* ── Fundamentals ─────────────────────────────────────────── */
    {
      id: 'boyles-law', name: "Boyle's Law", symbol: 'P',
      formula: 'P\u2081V\u2081 = P\u2082V\u2082', unit: 'bar\u00B7L',
      cat: 'fundamentals',
      desc: "Boyle's Law states that at constant temperature, the pressure of a gas is inversely proportional to its volume. When you compress air into half the volume, its pressure doubles. This is fundamental to understanding pneumatic actuators \u2014 as a cylinder extends and the air volume increases, pressure drops. Unlike hydraulic oil which is virtually incompressible, air compresses significantly, which is why pneumatic actuators behave differently from hydraulic ones.",
      example: { problem: 'Air at 6 bar (absolute) occupies 2 litres. It expands to 4 litres. Find the new pressure.', steps: ['P\u2081V\u2081 = P\u2082V\u2082', '6 \u00D7 2 = P\u2082 \u00D7 4', 'P\u2082 = 12 / 4', 'P\u2082 = 3 bar (absolute)'], answer: 3, unit: 'bar' }
    },
    {
      id: 'force-pressure', name: 'Cylinder Force', symbol: 'F',
      formula: 'F = P \u00D7 A', unit: 'N',
      cat: 'fundamentals',
      desc: 'The force a pneumatic cylinder produces equals the supply pressure multiplied by the piston area. At 6 bar with a 50 mm bore, the extend force is about 1178 N. The retract force is less because the piston rod reduces the effective area. Pneumatic forces are much lower than hydraulic because pressures are 4\u20138 bar compared to 100\u2013350 bar in hydraulics.',
      example: { problem: 'Cylinder bore = 63 mm, supply pressure = 6 bar. Find the extend force.', steps: ['A = \u03C0/4 \u00D7 63\u00B2 = 3117 mm\u00B2', 'P = 6 bar = 0.6 N/mm\u00B2', 'F = 0.6 \u00D7 3117', 'F = 1870 N'], answer: 1870, unit: 'N' }
    },
    {
      id: 'air-consumption', name: 'Air Consumption', symbol: 'Q',
      formula: 'Q = A \u00D7 L \u00D7 (P+1) \u00D7 n', unit: 'NL/min',
      cat: 'fundamentals',
      desc: 'Air consumption tells you how much compressed air a cylinder uses per cycle. It depends on bore area, stroke length, supply pressure (gauge + 1 for absolute), and cycles per minute. Air is measured in Normal Litres (NL) \u2014 volume at atmospheric pressure (1 bar abs). A 50mm bore cylinder at 6 bar with 200mm stroke uses about 2.75 NL per extend stroke.',
      example: { problem: 'Bore 50 mm, stroke 200 mm, pressure 6 bar gauge, 10 cycles/min (double-acting). Find air consumption.', steps: ['A = \u03C0/4 \u00D7 50\u00B2 = 1963 mm\u00B2 = 19.63 cm\u00B2', 'V_extend = 19.63 \u00D7 20 = 392.7 cm\u00B3', 'At 6 bar gauge = 7 bar abs: NL per stroke = 0.3927 \u00D7 7 = 2.75 NL', 'Double-acting: \u00D72 strokes \u00D7 10 cycles = 55 NL/min'], answer: 55, unit: 'NL/min' }
    },
    {
      id: 'flow-speed', name: 'Piston Speed', symbol: 'v',
      formula: 'v = Q / A', unit: 'mm/s',
      cat: 'fundamentals',
      desc: 'Piston speed in a pneumatic cylinder depends on the flow rate of air entering the cylinder divided by the piston area. Unlike hydraulics, pneumatic speed also depends on back-pressure and load \u2014 because air is compressible, a heavier load compresses the supply air more, reducing speed. Meter-out speed control is preferred because it maintains back-pressure on the exhaust side for smooth motion.',
      example: { problem: 'Flow rate = 100 NL/min at 6 bar, bore = 40 mm. Estimate piston speed.', steps: ['At 6 bar gauge (7 bar abs): actual flow = 100/7 = 14.3 L/min', 'A = \u03C0/4 \u00D7 40\u00B2 = 1257 mm\u00B2', 'Q = 14.3 L/min = 238,333 mm\u00B3/s', 'v = 238333 / 1257 = 189.6 mm/s'], answer: 190, unit: 'mm/s' }
    },
    /* ── Components ──────────────────────────────────────────── */
    {
      id: 'frl-unit', name: 'FRL Unit', symbol: 'FRL',
      formula: 'Filter + Regulator + Lubricator', unit: '\u2014',
      cat: 'components',
      desc: 'The FRL unit is the air preparation assembly installed between the compressor and the circuit. The Filter removes water droplets, oil mist, and particles (down to 5\u201340 \u03BCm). The Regulator reduces and stabilises supply pressure \u2014 typically set to 6 bar for standard applications. The Lubricator adds a fine oil mist to protect moving parts in valves and cylinders. Every pneumatic circuit must start with an FRL unit.',
      symbol_desc: 'The ISO 1219 FRL symbol combines filter (diamond with dots), regulator (diamond with arrow), and lubricator (diamond with drop) in a single assembly. A supply line enters from the left and exits to the right.',
      types: ['Filter only (5\u201340 \u03BCm filtration)', 'Filter-Regulator (FR) combo', 'Full FRL (Filter + Regulator + Lubricator)', 'Coalescing filter (0.01 \u03BCm for instrumentation)'],
      tips: ['Always install FRL before the first valve', 'Drain the filter bowl regularly or use auto-drain', 'Set regulator slightly below compressor output', 'Use lubricator only when required \u2014 some modern valves are lubrication-free'],
      example: { problem: 'Compressor delivers 10 bar. Regulator set to 6 bar. What is the pressure drop across the regulator?', steps: ['\u0394P = P_in \u2212 P_out', '\u0394P = 10 \u2212 6', '\u0394P = 4 bar'], answer: 4, unit: 'bar' }
    },
    {
      id: 'v52-valve', name: '5/2-Way Valve', symbol: '5/2',
      formula: '5 ports, 2 positions', unit: '\u2014',
      cat: 'components',
      desc: 'The 5/2-way valve is the standard directional control valve for double-acting pneumatic cylinders. It has 5 ports: 1 (pressure supply), 2 (output A), 3 (exhaust A), 4 (output B), 5 (exhaust B). In position 1, supply connects to port 2 (extend), and port 4 exhausts through port 5. In position 2, supply connects to port 4 (retract), and port 2 exhausts through port 3. Having separate exhaust ports allows independent speed control on each side.',
      symbol_desc: 'Two rectangular envelopes side by side. Each envelope shows internal arrows indicating which ports connect in that position. Arrows with arrowheads show flow direction; T-bars indicate blocked ports. Port numbers (ISO 5599) are labelled around the normal-position envelope.',
      types: ['5/2 single solenoid (spring return)', '5/2 double solenoid (detented)', '5/2 pilot-operated (for high flow)', '5/3 closed centre (all ports blocked at centre)', '5/3 exhaust centre (cylinder ports exhaust at centre)', '4/3 closed centre (4-port variant for hydraulic-style circuits)'],
      params: ['Port 1: Pressure supply (P)', 'Port 2: Output A (cylinder cap)', 'Port 3: Exhaust A', 'Port 4: Output B (cylinder rod)', 'Port 5: Exhaust B'],
      tips: ['Use 5/2 for double-acting cylinders needing two stable positions', 'A 5/3 closed centre only slows drift — ISO 4414 §5.4 forbids holding a load on spool overlap, because air is compressible and every spool leaks. Fit a pilot-operated check valve pair (or a rod lock) at the cylinder ports for genuine load holding', 'Use 5/3 exhaust centre when cylinder must relax (no force) at centre', 'Install flow control valves on exhaust ports 3 and 5 for meter-out speed control'],
      example: { problem: 'Name the 5 ports of a 5/2 valve using ISO 5599 numbering.', steps: ['Port 1 = Pressure supply (P)', 'Port 2 = Output A (to cylinder cap)', 'Port 3 = Exhaust A (for port 2 return)', 'Port 4 = Output B (to cylinder rod)', 'Port 5 = Exhaust B (for port 4 return)'], answer: 5, unit: 'ports' }
    },
    {
      id: 'v32-valve', name: '3/2-Way Valve', symbol: '3/2',
      formula: '3 ports, 2 positions', unit: '\u2014',
      cat: 'components',
      desc: 'The 3/2-way valve has 3 ports (1=pressure, 2=output, 3=exhaust) and 2 positions. In the normal (rest) position of a normally-closed (NC) valve, port 2 connects to exhaust (3) and supply (1) is blocked. When actuated, supply (1) connects to output (2) and exhaust (3) is blocked. Used for single-acting cylinders and as pilot valves for larger valve actuation. Actuation can be manual (push button), mechanical (roller lever, plunger), electrical (solenoid), or pneumatic (pilot).',
      symbol_desc: 'Two rectangular envelopes. Left envelope (normal position) shows an arrow from port 2 to 3 (exhaust path) and a T-bar on port 1 (blocked). Right envelope (actuated) shows an arrow from port 1 to 2 (supply path) and a T-bar on port 3 (blocked). Spring symbol on one side, actuation symbol on the other.',
      types: ['Push button (manual momentary)', 'Roller lever (mechanical, cam-operated)', 'Idle return / one-way roller (triggers in one direction only)', 'Plunger (mechanical, direct contact)', 'Solenoid (electrical actuation)', '2/2 on/off switch (simplest: 2 ports, open/closed)'],
      tips: ['NC (normally closed) is the most common type \u2014 safe default with no air output', 'Use idle-return rollers for limit switches to prevent false triggering on retract', 'Solenoid 3/2 valves are used as pilot valves to shift larger 5/2 valves'],
      example: { problem: 'A 3/2 NC push-button valve is pressed. Which ports are connected?', steps: ['Normal state: 2\u21943 (output to exhaust), 1 blocked', 'Actuated state: 1\u21942 (supply to output), 3 blocked', 'When pressed: Port 1 connects to Port 2'], answer: 1, unit: '' }
    },
    {
      id: 'quick-exhaust', name: 'Quick Exhaust Valve', symbol: 'QEV',
      formula: 'Reduces exhaust path length', unit: '\u2014',
      cat: 'components',
      desc: 'A quick exhaust valve is placed directly at the cylinder port to provide the shortest possible exhaust path. When supply pressure arrives, the diaphragm seals the exhaust port and air enters the cylinder normally. When supply is cut and the cylinder retracts, the diaphragm lifts off the exhaust port, allowing air to escape directly to atmosphere without travelling back through the long supply line. This dramatically increases retraction speed.',
      symbol_desc: 'A circle with three ports. Supply enters from one side, output goes to the cylinder, and a large exhaust port faces downward. The internal diaphragm switches between supply-through and exhaust modes automatically based on pressure.',
      tips: ['Mount as close to the cylinder port as possible', 'Always install a silencer on the exhaust port', 'Typically used on single-acting cylinder retract or to speed up one stroke direction'],
      example: { problem: 'Why is a quick exhaust valve mounted at the cylinder port, not at the DCV?', steps: ['Exhaust air takes the shortest path to atmosphere', 'Eliminates back-pressure from long supply lines', 'Air exits directly at the cylinder rather than travelling back through tubing', 'Result: significantly faster piston speed'], answer: 0, unit: '' }
    },
    {
      id: 'shuttle-valve', name: 'Shuttle Valve (OR)', symbol: 'OR',
      formula: 'Output = A OR B', unit: '\u2014',
      cat: 'components',
      desc: 'A shuttle valve implements the logical OR function. It has two inputs and one output. A movable shuttle inside blocks whichever input has lower pressure, allowing the higher-pressure input to pass through to the output. If either input A OR input B has pressure, the output is pressurised. Used in dual-control circuits where a cylinder must be actuated from either of two locations.',
      symbol_desc: 'A circle with two input ports (left and right) and one output port (top or bottom). A movable ball or shuttle inside is shown between the two inputs.',
      tips: ['Used for OR logic: actuate from multiple locations', 'Also used in cascade circuits as group switching elements', 'The shuttle seals automatically \u2014 no external control needed'],
      example: { problem: 'Shuttle valve: Input A = 6 bar, Input B = 0 bar. What is the output?', steps: ['The shuttle moves toward the lower-pressure side (B)', 'Input A passes through to the output', 'Output = 6 bar (from input A)', 'If both inputs are pressurised, the higher one passes through'], answer: 6, unit: 'bar' }
    },
    {
      id: 'and-valve', name: 'Dual Pressure (AND)', symbol: 'AND',
      formula: 'Output = A AND B', unit: '\u2014',
      cat: 'components',
      desc: 'A dual-pressure valve (AND valve) requires pressure at both inputs before producing an output. It passes the lower of the two input pressures. Used for two-hand safety circuits in presses \u2014 the operator must press both buttons simultaneously to actuate the cylinder, preventing hands from being in the danger zone.',
      symbol_desc: 'A circle with two input ports and one output port. Internal mechanism requires both inputs to be pressurised before output is generated. Visually similar to a shuttle valve but functions differently.',
      tips: ['Primary use: two-hand safety circuits on presses', 'Both buttons must be pressed within 0.5 seconds of each other (safety standard)', 'Output equals the LOWER of the two input pressures'],
      example: { problem: 'AND valve: Input A = 6 bar, Input B = 4 bar. What is the output?', steps: ['Both inputs have pressure \u2192 condition met', 'Output = lower of the two pressures', 'Output = min(6, 4) = 4 bar', 'If either input is 0, output = 0 (AND logic)'], answer: 4, unit: 'bar' }
    },
    /* ── Circuits ────────────────────────────────────────────── */
    {
      id: 'meter-out', name: 'Meter-Out Speed Control', symbol: 'M-Out',
      formula: 'v \u221D restricted exhaust flow', unit: 'mm/s',
      cat: 'circuits',
      desc: 'In pneumatics, meter-out is the preferred speed control method. A one-way flow control valve on the exhaust port of the cylinder restricts air leaving. The check valve allows free flow of supply air. The restricted exhaust creates back-pressure that cushions the piston, giving smooth, controlled motion. Meter-in would restrict supply air, but because air is compressible, pressure would build up then release suddenly, causing jerky motion.',
      example: { problem: 'Why is meter-out preferred over meter-in in pneumatics?', steps: ['Air is compressible (unlike hydraulic oil)', 'Meter-in: supply air compresses, then releases suddenly \u2192 jerky motion', 'Meter-out: exhaust restriction creates steady back-pressure', 'Back-pressure cushions the piston for smooth, controllable speed'], answer: 0, unit: '' }
    },
    {
      id: 'auto-return', name: 'Auto-Return Circuit', symbol: 'Auto',
      formula: 'Extend \u2192 limit switch \u2192 retract', unit: '\u2014',
      cat: 'circuits',
      desc: 'An auto-return circuit automatically retracts the cylinder when it reaches full extension. A roller lever 3/2 valve (limit switch) is positioned at the end of the cylinder stroke. When the piston rod hits the roller, the valve sends a pilot signal to shift the 5/2 DCV back to the retract position. The one-way roller lever variant (idle return) is critical \u2014 it only triggers when the rod moves forward (not on retraction), preventing false signals.',
      example: { problem: 'Why use a one-way roller lever instead of a standard roller lever for auto-return?', steps: ['Standard roller triggers in BOTH directions of travel', 'On retraction, it would re-trigger and try to extend again', 'One-way roller (idle return) only triggers in one direction', 'Spring-loaded idle return allows the rod to pass freely on retract'], answer: 0, unit: '' }
    },
    {
      id: 'cascade-sequence', name: 'Cascade Sequencing', symbol: 'Casc',
      formula: 'Group switching eliminates signal conflicts', unit: '\u2014',
      cat: 'circuits',
      desc: 'Cascade sequencing solves the problem of opposing signals in multi-cylinder sequences. When a limit switch needs to send a signal that conflicts with another active signal, the cascade method divides the sequence into groups. A group switching valve changes the supply line to eliminate the conflicting signal. For example, sequence A+ B+ B\u2212 A\u2212 has a conflict at B\u2212 (the A+ limit switch signal is still active). Cascade splits this into Group I (A+ B+) and Group II (B\u2212 A\u2212).',
      example: { problem: 'Sequence A+ B+ B\u2212 A\u2212. Identify the signal conflict and cascade groups.', steps: ['Step 1: A+ (signal from start button)', 'Step 2: B+ (signal from A+ limit switch a1)', 'Step 3: B\u2212 \u2014 needs to reverse B, but a1 is still active!', 'Conflict: a1 signal opposes the B\u2212 command', 'Group I: A+ B+ | Group II: B\u2212 A\u2212'], answer: 2, unit: 'groups' }
    },
    {
      id: 'time-delay', name: 'Time Delay Circuit', symbol: 'Timer',
      formula: 't = R \u00D7 C (throttle \u00D7 reservoir)', unit: 's',
      cat: 'circuits',
      desc: 'A pneumatic time delay circuit uses an on-delay timer valve to hold a cylinder extended for a set duration before retracting. The timer valve contains a reservoir and adjustable throttle. When the pilot signal arrives (from a limit switch at full extension), air slowly fills the reservoir through the throttle. After the set delay, the pressure is enough to switch the output 3/2 valve, which sends a retract signal. Used for clamping, drying, cooling, and pressing operations.',
      example: { problem: 'Timer set to 5 seconds. Cylinder extends at t=0, reaches full stroke at t=2s. When does it retract?', steps: ['t=0: Start button pressed, cylinder begins extending', 't=2s: Cylinder reaches full stroke, hits limit switch', 'Limit switch triggers timer \u2192 timing starts at t=2s', 't=7s: Timer expires (2+5), sends retract signal'], answer: 7, unit: 's' }
    },
    /* ── Applications ───────────────────────────────────────── */
    {
      id: 'pick-place', name: 'Pick and Place', symbol: 'P&P',
      formula: 'Vacuum + Extend + Transfer + Retract', unit: '\u2014',
      cat: 'applications',
      desc: 'Pick-and-place systems use pneumatic cylinders for motion and vacuum suction cups for gripping. A venturi vacuum generator creates negative pressure to hold the workpiece. The sequence is: extend vertical cylinder down, activate vacuum, retract vertically, extend horizontally to transfer position, extend vertically down, release vacuum, retract vertically, retract horizontally to home. Sequential valve circuits with limit switches automate this cycle.',
      example: { problem: 'Suction cup diameter 40 mm, vacuum level 0.6 bar. Calculate holding force.', steps: ['A = \u03C0/4 \u00D7 40\u00B2 = 1257 mm\u00B2', 'P = 0.6 bar = 0.06 N/mm\u00B2', 'F = 0.06 \u00D7 1257 = 75.4 N', 'Safety factor 2: max workpiece = 37.7 N \u2248 3.8 kg'], answer: 75.4, unit: 'N' }
    },
    {
      id: 'clamping', name: 'Pneumatic Clamping', symbol: 'Clamp',
      formula: 'F_clamp = P \u00D7 A \u00D7 mechanical advantage', unit: 'N',
      cat: 'applications',
      desc: 'Pneumatic clamping fixtures use cylinders to hold workpieces during machining. A clamp-then-work sequence ensures the part is secured before the tool operates. A sequence valve detects when the clamp cylinder stalls (indicating full clamping force), then activates the work cylinder. Pressure switches or sequence valves ensure proper clamping before machining begins.',
      example: { problem: 'Clamp cylinder bore 80 mm, pressure 6 bar, toggle mechanism with 3:1 advantage. Find clamping force.', steps: ['A = \u03C0/4 \u00D7 80\u00B2 = 5027 mm\u00B2', 'F_cylinder = 0.6 \u00D7 5027 = 3016 N', 'F_clamp = 3016 \u00D7 3 = 9048 N', 'F_clamp \u2248 9.0 kN'], answer: 9048, unit: 'N' }
    }
  ];

  /* ================================================================
     PRACTICE — 12 problem generators
     ================================================================ */

  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var PRACTICE = [
    function () {
      var bore = randChoice([25, 32, 40, 50, 63, 80, 100]);
      var pBar = randChoice([4, 5, 6, 7, 8]);
      var a = Math.PI / 4 * bore * bore;
      var ans = +(pBar * 0.1 * a).toFixed(0);
      return { prompt: 'A pneumatic cylinder has bore diameter ' + bore + ' mm. Supply pressure is ' + pBar + ' bar. Calculate the extend force in N.', unit: 'N', answer: ans, tol: 5, steps: ['A = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + a.toFixed(1) + ' mm\u00B2', 'P = ' + pBar + ' bar = ' + (pBar * 0.1).toFixed(1) + ' N/mm\u00B2', 'F = P \u00D7 A = ' + (pBar * 0.1).toFixed(1) + ' \u00D7 ' + a.toFixed(1), 'F = ' + ans + ' N'] };
    },
    function () {
      var bore = randChoice([40, 50, 63, 80]);
      var rod = Math.round(bore * 0.4);
      var pBar = randChoice([4, 5, 6, 7]);
      var aAnn = Math.PI / 4 * (bore * bore - rod * rod);
      var ans = +(pBar * 0.1 * aAnn).toFixed(0);
      return { prompt: 'Cylinder bore = ' + bore + ' mm, rod = ' + rod + ' mm, pressure = ' + pBar + ' bar. Calculate retract force (N).', unit: 'N', answer: ans, tol: 5, steps: ['A_ann = \u03C0/4 \u00D7 (' + bore + '\u00B2 \u2212 ' + rod + '\u00B2) = ' + aAnn.toFixed(1) + ' mm\u00B2', 'F = ' + (pBar * 0.1).toFixed(1) + ' \u00D7 ' + aAnn.toFixed(1), 'F = ' + ans + ' N'] };
    },
    function () {
      var bore = randChoice([32, 40, 50, 63]);
      var stroke = randChoice([100, 150, 200, 300, 400]);
      var pBar = randChoice([4, 5, 6, 7]);
      var a = Math.PI / 4 * bore * bore;
      var vol = a * stroke / 1000; /* cm\u00B3 */
      var ans = +(vol * (pBar + 1) / 1000).toFixed(2);
      return { prompt: 'Bore ' + bore + ' mm, stroke ' + stroke + ' mm, pressure ' + pBar + ' bar gauge. Calculate air consumption per extend stroke (NL).', unit: 'NL', answer: ans, tol: 0.05, steps: ['A = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + a.toFixed(1) + ' mm\u00B2', 'V = ' + a.toFixed(1) + ' \u00D7 ' + stroke + ' = ' + (a * stroke).toFixed(0) + ' mm\u00B3 = ' + vol.toFixed(1) + ' cm\u00B3', 'Absolute pressure = ' + pBar + ' + 1 = ' + (pBar + 1) + ' bar abs', 'NL = ' + vol.toFixed(1) + ' \u00D7 ' + (pBar + 1) + ' / 1000 = ' + ans + ' NL'] };
    },
    function () {
      var p1 = randChoice([6, 7, 8, 9, 10]);
      var v1 = randChoice([2, 3, 4, 5]);
      var v2 = randChoice([v1 + 1, v1 + 2, v1 + 3]);
      var ans = +(p1 * v1 / v2).toFixed(2);
      return { prompt: "Boyle's Law: Air at " + p1 + ' bar (abs) occupies ' + v1 + ' litres. It expands to ' + v2 + ' litres. Find the new pressure (bar abs).', unit: 'bar', answer: ans, tol: 0.05, steps: ['P\u2081V\u2081 = P\u2082V\u2082', p1 + ' \u00D7 ' + v1 + ' = P\u2082 \u00D7 ' + v2, 'P\u2082 = ' + (p1 * v1) + ' / ' + v2, 'P\u2082 = ' + ans + ' bar (abs)'] };
    },
    function () {
      var bore = randChoice([25, 32, 40, 50, 63]);
      var stroke = randChoice([100, 200, 300]);
      var cycles = randChoice([5, 10, 15, 20]);
      var pBar = randChoice([5, 6, 7]);
      var a = Math.PI / 4 * bore * bore;
      var volPerStroke = a * stroke / 1e6; /* litres */
      var ans = +(volPerStroke * (pBar + 1) * 2 * cycles).toFixed(1);
      return { prompt: 'Double-acting cylinder: bore ' + bore + ' mm, stroke ' + stroke + ' mm, ' + pBar + ' bar gauge, ' + cycles + ' cycles/min. Calculate total air consumption (NL/min). Ignore rod volume.', unit: 'NL/min', answer: ans, tol: 1, steps: ['A = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + a.toFixed(1) + ' mm\u00B2', 'V per stroke = ' + a.toFixed(1) + ' \u00D7 ' + stroke + ' = ' + (a * stroke).toFixed(0) + ' mm\u00B3 = ' + (volPerStroke * 1000).toFixed(1) + ' cm\u00B3', 'NL per stroke = ' + (volPerStroke).toFixed(4) + ' \u00D7 ' + (pBar + 1) + ' = ' + (volPerStroke * (pBar + 1)).toFixed(3) + ' NL', 'Double-acting \u00D72 strokes \u00D7 ' + cycles + ' = ' + ans + ' NL/min'] };
    },
    function () {
      var cupDia = randChoice([20, 30, 40, 50, 60]);
      var vacuum = randChoice([0.4, 0.5, 0.6, 0.7, 0.8]);
      var a = Math.PI / 4 * cupDia * cupDia;
      var ans = +(vacuum * 0.1 * a).toFixed(1);
      return { prompt: 'Suction cup diameter = ' + cupDia + ' mm, vacuum level = ' + vacuum + ' bar. Calculate the theoretical holding force (N).', unit: 'N', answer: ans, tol: 0.5, steps: ['A = \u03C0/4 \u00D7 ' + cupDia + '\u00B2 = ' + a.toFixed(1) + ' mm\u00B2', 'P = ' + vacuum + ' bar = ' + (vacuum * 0.1).toFixed(2) + ' N/mm\u00B2', 'F = ' + (vacuum * 0.1).toFixed(2) + ' \u00D7 ' + a.toFixed(1), 'F = ' + ans + ' N'] };
    },
    function () {
      var bore = randChoice([40, 50, 63, 80]);
      var pBar = randChoice([4, 5, 6]);
      var rod = Math.round(bore * 0.4);
      var aB = Math.PI / 4 * bore * bore;
      var aA = Math.PI / 4 * (bore * bore - rod * rod);
      var fExt = +(pBar * 0.1 * aB).toFixed(0);
      var fRet = +(pBar * 0.1 * aA).toFixed(0);
      var ans = +(fExt / fRet).toFixed(2);
      return { prompt: 'Bore ' + bore + ' mm, rod ' + rod + ' mm. What is the force ratio (extend/retract)?', unit: '', answer: ans, tol: 0.03, steps: ['A_bore = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + aB.toFixed(1) + ' mm\u00B2', 'A_ann = \u03C0/4 \u00D7 (' + bore + '\u00B2 \u2212 ' + rod + '\u00B2) = ' + aA.toFixed(1) + ' mm\u00B2', 'Ratio = ' + aB.toFixed(1) + ' / ' + aA.toFixed(1), 'Ratio = ' + ans] };
    },
    function () {
      var pBar = randChoice([4, 5, 6, 7, 8]);
      var margin = randChoice([0.5, 1, 1.5, 2]);
      var ans = +(pBar + margin).toFixed(1);
      return { prompt: 'Operating pressure is ' + pBar + ' bar. Safety valve margin is ' + margin + ' bar. What should the relief valve be set to?', unit: 'bar', answer: ans, tol: 0, steps: ['Relief = operating + margin', 'Relief = ' + pBar + ' + ' + margin, 'Relief = ' + ans + ' bar'] };
    },
    function () {
      var bore = randChoice([32, 40, 50, 63]);
      var stroke = randChoice([100, 200, 300]);
      var a = Math.PI / 4 * bore * bore;
      var vol = a * stroke;
      var q = randChoice([60, 80, 100, 120]);
      var qMm3s = q * 1e6 / 60;
      var tSec = vol / qMm3s;
      var ans = +(tSec).toFixed(2);
      return { prompt: 'Bore ' + bore + ' mm, stroke ' + stroke + ' mm. Free air flow = ' + q + ' L/min at cylinder pressure. How long to extend (seconds)?', unit: 's', answer: ans, tol: 0.05, steps: ['A = ' + a.toFixed(1) + ' mm\u00B2', 'V = ' + a.toFixed(1) + ' \u00D7 ' + stroke + ' = ' + vol.toFixed(0) + ' mm\u00B3', 'Q = ' + q + ' L/min = ' + qMm3s.toFixed(0) + ' mm\u00B3/s', 't = V/Q = ' + vol.toFixed(0) + ' / ' + qMm3s.toFixed(0) + ' = ' + ans + ' s'] };
    },
    function () {
      var ports = randChoice([3, 5]);
      var positions = randChoice([2, 3]);
      var desc = ports + '/' + positions;
      var silencers = ports === 5 ? 2 : 1;
      var ans = silencers;
      return { prompt: 'A ' + desc + ' way valve is used. How many silencers are needed on the exhaust ports?', unit: '', answer: ans, tol: 0, steps: ['A ' + desc + ' valve has ' + ports + ' ports and ' + positions + ' positions', ports === 5 ? 'Ports 3 and 5 are exhaust ports' : 'Port 3 is the exhaust port', 'Number of exhaust ports = ' + silencers, 'Silencers needed = ' + ans] };
    },
    function () {
      var q = randChoice([200, 300, 400, 500]);
      var p = randChoice([6, 7, 8]);
      var freeAir = +(q * (p + 1)).toFixed(0);
      var ans = freeAir;
      return { prompt: 'Compressor delivers ' + q + ' L/min at ' + p + ' bar gauge. Calculate the free air delivery (FAD) in NL/min.', unit: 'NL/min', answer: ans, tol: 10, steps: ['FAD = compressed volume \u00D7 absolute pressure', 'Absolute pressure = ' + p + ' + 1 = ' + (p + 1) + ' bar', 'FAD = ' + q + ' \u00D7 ' + (p + 1), 'FAD = ' + ans + ' NL/min'] };
    },
    function () {
      var bore = randChoice([50, 63, 80, 100]);
      var pBar = randChoice([5, 6, 7]);
      var ma = randChoice([2, 3, 4]);
      var a = Math.PI / 4 * bore * bore;
      var fCyl = pBar * 0.1 * a;
      var ans = +(fCyl * ma).toFixed(0);
      return { prompt: 'Clamp cylinder: bore ' + bore + ' mm, pressure ' + pBar + ' bar, toggle mechanism ' + ma + ':1. Find clamping force (N).', unit: 'N', answer: ans, tol: 10, steps: ['A = \u03C0/4 \u00D7 ' + bore + '\u00B2 = ' + a.toFixed(1) + ' mm\u00B2', 'F_cyl = ' + (pBar * 0.1).toFixed(1) + ' \u00D7 ' + a.toFixed(1) + ' = ' + fCyl.toFixed(0) + ' N', 'F_clamp = ' + fCyl.toFixed(0) + ' \u00D7 ' + ma + ' = ' + ans + ' N'] };
    }
  ];

  /* ================================================================
     QUIZ — 15 questions (8 MCQ + 7 numeric)
     ================================================================ */

  var QUIZ_POOL = [
    { type: 'mcq', q: 'Why is meter-out preferred over meter-in in pneumatics?', opts: ['Meter-out uses less air', 'Air is compressible \u2014 meter-in causes jerky motion', 'Meter-out is cheaper', 'There is no difference'], ans: 1 },
    { type: 'mcq', q: 'What does an FRL unit stand for?', opts: ['Filter, Regulator, Lubricator', 'Flow, Return, Line', 'Force, Resistance, Load', 'Frequency, Ratio, Length'], ans: 0 },
    { type: 'mcq', q: 'How many exhaust ports does a 5/2 way valve have?', opts: ['1', '2', '3', '5'], ans: 1 },
    { type: 'mcq', q: 'A shuttle valve performs which logic function?', opts: ['AND', 'OR', 'NOT', 'NOR'], ans: 1 },
    { type: 'mcq', q: 'What is the typical operating pressure in industrial pneumatics?', opts: ['0.5\u20131 bar', '4\u20138 bar', '50\u2013100 bar', '200\u2013350 bar'], ans: 1 },
    { type: 'mcq', q: 'A one-way roller lever (idle return) triggers in:', opts: ['Both directions', 'One direction only', 'Neither direction', 'Only when pneumatically piloted'], ans: 1 },
    { type: 'mcq', q: 'What creates vacuum in a venturi vacuum generator?', opts: ['Electric pump', 'Compressed air through a venturi nozzle', 'Piston displacement', 'Spring mechanism'], ans: 1 },
    { type: 'mcq', q: 'ISO 5599 port 1 on a pneumatic valve is:', opts: ['Output A', 'Exhaust', 'Pressure supply', 'Pilot signal'], ans: 2 },
    { type: 'num', q: 'Cylinder bore = 50 mm, pressure = 6 bar. Calculate extend force in N.', ans: +(6 * 0.1 * Math.PI / 4 * 2500).toFixed(0), tol: 5, unit: 'N' },
    { type: 'num', q: 'Suction cup diameter = 30 mm, vacuum = 0.6 bar. Holding force in N?', ans: +(0.06 * Math.PI / 4 * 900).toFixed(1), tol: 0.5, unit: 'N' },
    { type: 'num', q: 'Air at 7 bar abs in 3 litres expands to 7 litres. New pressure (bar abs)?', ans: +(7 * 3 / 7).toFixed(1), tol: 0.1, unit: 'bar' },
    { type: 'num', q: 'Bore 40 mm, stroke 200 mm, 6 bar gauge. Air per extend stroke in NL?', ans: +(Math.PI / 4 * 1600 * 200 / 1e6 * 7).toFixed(2), tol: 0.05, unit: 'NL' },
    { type: 'num', q: 'Bore 63 mm, rod 25 mm. What is the area ratio (bore/annular)?', ans: +(Math.PI / 4 * 3969 / (Math.PI / 4 * (3969 - 625))).toFixed(2), tol: 0.03, unit: '' },
    { type: 'num', q: 'Compressor delivers 300 L/min at 7 bar gauge. FAD in NL/min?', ans: 2400, tol: 10, unit: 'NL/min' },
    { type: 'num', q: 'Operating pressure 6 bar, safety margin 1.5 bar. Relief valve setting?', ans: 7.5, tol: 0, unit: 'bar' }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */

  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');
  var simPanel = document.getElementById('sim-panel');
  var prebuiltTabs = document.getElementById('prebuilt-tabs');
  var circuitDesc = document.getElementById('circuit-desc');
  var btnRun = document.getElementById('btn-run');
  var btnStop = document.getElementById('btn-stop');
  var btnClear = document.getElementById('btn-clear');
  var btnDelete = document.getElementById('btn-delete');
  var toolbarHint = document.getElementById('toolbar-hint');
  var propsPanel = document.getElementById('props-panel');
  var propsBody = document.getElementById('props-body');
  var simReadouts = document.getElementById('sim-readouts');
  var warningBar = document.getElementById('warning-bar');

  var catRow = document.getElementById('cat-row');
  var catTabs = document.getElementById('cat-tabs');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');

  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var qbarNum = document.getElementById('qbar-num');
  var quizResult = document.getElementById('quiz-result');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var running = false;
  var _tankReserveActive = false; /* air tank supplying circuit (no compressor) */
  var _lastAirDemand = 0;         /* NL/min drawn by moving actuators last frame */
  var _compressorSag = false;     /* supply pressure drooping under demand */
  var animFrame = null;
  var W = 800, H = 500;
  var dpr = window.devicePixelRatio || 1;
  var _fontFamily = "'Segoe UI', system-ui, sans-serif";

  var components = [];
  var connections = [];
  var nextId = 1;
  var selectedComp = null;
  var draggingComp = null;
  var dragOffX = 0, dragOffY = 0;
  var dragStartX = 0, dragStartY = 0, dragMoved = false;
  var connectingFrom = null;
  var hoveredPort = null;
  var hoveredPortSX = 0, hoveredPortSY = 0; /* raw canvas screen px for tooltip */
  var hoveredCompId = null;
  var hoveredDcv = null;
  var selectedConn = -1;
  var hoveredConn = -1;
  var draggingSegInfo = null;
  var pendingSegDrag = null;        /* candidate segment drag awaiting movement past DRAG_THRESHOLD_PX */
  var DRAG_THRESHOLD_PX = 6;        /* pointer must move this far to commit to a drag (touch tap-vs-drag) */
  var _pathCache = [];
  var _crossingsCache = [];
  var prevExtensions = {};
  var particles = [];
  var simTime = 0;
  var undoStack = [];
  var MAX_UNDO = 30;
  var pendingDCVClick = null;
  var pendingMomentary = null;

  var exploreCat = 'fundamentals';
  var selectedConcept = null;

  var practiceCorrect = 0, practiceTotal = 0;
  var currentProblem = null;
  var practiceAnswered = false;

  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];

  /* ================================================================
     COMPONENT DEFINITIONS — 37 pneumatic components
     ================================================================ */

  var COMP_DEFS = {
    /* ── Air Supply (2) — ISO 5599/11727: pressure supply is port 1 ── */
    'air-supply': { name: 'Air Supply', cat: 'supply', w: 60, h: 50, ports: [{ x: 30, y: 0, dir: 'up', label: '1' }], params: { pressure: { label: 'Pressure (bar)', min: 2, max: 10, step: 0.5, def: 6 }, flow: { label: 'Flow (NL/min)', min: 50, max: 500, step: 10, def: 200 } } },
    'air-tank': { name: 'Air Tank', cat: 'supply', w: 44, h: 50, ports: [{ x: 22, y: 50, dir: 'down', label: '1' }, { x: 22, y: 0, dir: 'up', label: '2' }], params: { volume: { label: 'Volume (L)', min: 5, max: 200, step: 5, def: 50 } } },

    /* ── Air Treatment / FRL (3) — ISO 11727: 1=P(in), 2=A(out) ── */
    'filter': { name: 'Air Filter', cat: 'frl', w: 36, h: 44, ports: [{ x: 18, y: 44, dir: 'down', label: '1' }, { x: 18, y: 0, dir: 'up', label: '2' }], params: { micron: { label: 'Rating (\u03BCm)', min: 5, max: 40, step: 5, def: 20 } } },
    'regulator': { name: 'Regulator', cat: 'frl', w: 40, h: 44, ports: [{ x: 20, y: 44, dir: 'down', label: '1' }, { x: 20, y: 0, dir: 'up', label: '2' }], params: { setting: { label: 'Set Pressure (bar)', min: 1, max: 10, step: 0.5, def: 6 } } },
    'frl': { name: 'FRL Unit', cat: 'frl', w: 80, h: 44, ports: [{ x: 0, y: 22, dir: 'left', label: '1' }, { x: 80, y: 22, dir: 'right', label: '2' }], params: { setting: { label: 'Set Pressure (bar)', min: 1, max: 10, step: 0.5, def: 6 } } },

    /* ── On/Off Switch & Push Button NC — ISO 11727: 1=P, 2=A ── */
    'v22-push': { name: '2/2 On/Off Switch', cat: 'dcv', w: 44, h: 44, ports: [{ x: 22, y: 44, dir: 'down', label: '1' }, { x: 22, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Closed', 'Open'], def: 'Closed' } } },
    'v22-nc': { name: '2/2 Push Button NC', cat: 'dcv', w: 44, h: 44, ports: [{ x: 22, y: 44, dir: 'down', label: '1' }, { x: 22, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Closed', 'Open'], def: 'Closed' } } },

    /* ── Directional Control Valves — ISO 5599: 1=P, 2=A, 3=R, 4=B, 5=S ── */
    'v32-push': { name: '3/2 Push Button', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Pressed'], def: 'Normal' } } },
    'v32-roller': { name: '3/2 Roller Lever', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' }, triggerCyl: { label: 'Trigger Cyl ID', type: 'number', def: 0 }, triggerAt: { label: 'Trigger At (%)', type: 'number', def: 95 } } },
    'v32-roller-no': { name: '3/2 Roller Lever NO', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' }, triggerCyl: { label: 'Trigger Cyl ID', type: 'number', def: 0 }, triggerAt: { label: 'Trigger At (%)', type: 'number', def: 95 } } },
    'v32-idle': { name: '3/2 Idle Return', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' }, triggerCyl: { label: 'Trigger Cyl ID', type: 'number', def: 0 }, triggerAt: { label: 'Trigger At (%)', type: 'number', def: 95 } } },
    'v32-plunger': { name: '3/2 Plunger', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' }, triggerCyl: { label: 'Trigger Cyl ID', type: 'number', def: 0 }, triggerAt: { label: 'Trigger At (%)', type: 'number', def: 95 } } },
    'v32-push-no': { name: '3/2 Push Button NO', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Pressed'], def: 'Normal' } } },
    'v32-solenoid': { name: '3/2 Solenoid', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Energised'], def: 'Normal' } } },
    'v52-single': { name: '5/2 Single Sol.', cat: 'dcv', w: 90, h: 50, ports: [{ x: 24, y: 50, dir: 'down', label: '1' }, { x: 36, y: 0, dir: 'up', label: '2' }, { x: 36, y: 50, dir: 'down', label: '3' }, { x: 12, y: 0, dir: 'up', label: '4' }, { x: 12, y: 50, dir: 'down', label: '5' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Energised'], def: 'Normal' } } },
    'v52-double': { name: '5/2 Double Sol.', cat: 'dcv', w: 90, h: 50, ports: [{ x: 24, y: 50, dir: 'down', label: '1' }, { x: 36, y: 0, dir: 'up', label: '2' }, { x: 36, y: 50, dir: 'down', label: '3' }, { x: 12, y: 0, dir: 'up', label: '4' }, { x: 12, y: 50, dir: 'down', label: '5' }], params: { position: { label: 'Position', type: 'select', options: ['Position A', 'Position B'], def: 'Position A' } } },
    'v53-closed': { name: '5/3 Closed Ctr', cat: 'dcv', w: 100, h: 50, ports: [{ x: 50, y: 50, dir: 'down', label: '1' }, { x: 60, y: 0, dir: 'up', label: '2' }, { x: 60, y: 50, dir: 'down', label: '3' }, { x: 40, y: 0, dir: 'up', label: '4' }, { x: 40, y: 50, dir: 'down', label: '5' }], params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },
    'v53-exhaust': { name: '5/3 Exhaust Ctr', cat: 'dcv', w: 100, h: 50, ports: [{ x: 50, y: 50, dir: 'down', label: '1' }, { x: 60, y: 0, dir: 'up', label: '2' }, { x: 60, y: 50, dir: 'down', label: '3' }, { x: 40, y: 0, dir: 'up', label: '4' }, { x: 40, y: 50, dir: 'down', label: '5' }], params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },
    'v53-pressure': { name: '5/3 Pressure Ctr', cat: 'dcv', w: 100, h: 50, ports: [{ x: 50, y: 50, dir: 'down', label: '1' }, { x: 60, y: 0, dir: 'up', label: '2' }, { x: 60, y: 50, dir: 'down', label: '3' }, { x: 40, y: 0, dir: 'up', label: '4' }, { x: 40, y: 50, dir: 'down', label: '5' }], params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },
    'v53-pilot-exhaust': { name: '5/3 Pilot Exhaust Ctr', cat: 'dcv', w: 100, h: 50, ports: [{ x: 50, y: 50, dir: 'down', label: '1' }, { x: 60, y: 0, dir: 'up', label: '2' }, { x: 60, y: 50, dir: 'down', label: '3' }, { x: 40, y: 0, dir: 'up', label: '4' }, { x: 40, y: 50, dir: 'down', label: '5' }, { x: 0, y: 25, dir: 'left', label: '12' }, { x: 100, y: 25, dir: 'right', label: '14' }], params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },
    'v52-pilot': { name: '5/2 Double Pilot', cat: 'dcv', w: 90, h: 50, ports: [{ x: 24, y: 50, dir: 'down', label: '1' }, { x: 36, y: 0, dir: 'up', label: '2' }, { x: 36, y: 50, dir: 'down', label: '3' }, { x: 12, y: 0, dir: 'up', label: '4' }, { x: 12, y: 50, dir: 'down', label: '5' }, { x: 0, y: 25, dir: 'left', label: '12' }, { x: 90, y: 25, dir: 'right', label: '14' }], params: { position: { label: 'Position', type: 'select', options: ['Position A', 'Position B'], def: 'Position A' } } },
    /* ── Pneumatically Operated DCVs — pilot-shifted by air pressure signal ── */
    'v32-pilot-nc': { name: '3/2 Pilot NC', cat: 'dcv', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '1' }, { x: 45, y: 50, dir: 'down', label: '3' }, { x: 30, y: 0, dir: 'up', label: '2' }, { x: 0, y: 25, dir: 'left', label: '12' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' } } },
    'v52-pilot-single': { name: '5/2 Single Pilot', cat: 'dcv', w: 90, h: 50, ports: [{ x: 24, y: 50, dir: 'down', label: '1' }, { x: 36, y: 0, dir: 'up', label: '2' }, { x: 36, y: 50, dir: 'down', label: '3' }, { x: 12, y: 0, dir: 'up', label: '4' }, { x: 12, y: 50, dir: 'down', label: '5' }, { x: 90, y: 25, dir: 'right', label: '14' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' } } },
    'v53-pilot-closed': { name: '5/3 Pilot Closed Ctr', cat: 'dcv', w: 100, h: 50, ports: [{ x: 50, y: 50, dir: 'down', label: '1' }, { x: 60, y: 0, dir: 'up', label: '2' }, { x: 60, y: 50, dir: 'down', label: '3' }, { x: 40, y: 0, dir: 'up', label: '4' }, { x: 40, y: 50, dir: 'down', label: '5' }, { x: 0, y: 25, dir: 'left', label: '12' }, { x: 100, y: 25, dir: 'right', label: '14' }], params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },
    'v43-closed': { name: '4/3 Closed Ctr', cat: 'dcv', w: 100, h: 50, ports: [{ x: 36, y: 50, dir: 'down', label: '1' }, { x: 36, y: 0, dir: 'up', label: '2' }, { x: 64, y: 50, dir: 'down', label: '3' }, { x: 64, y: 0, dir: 'up', label: '4' }], params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },
    'v43-exhaust': { name: '4/3 Exhaust Ctr', cat: 'dcv', w: 100, h: 50, ports: [{ x: 36, y: 50, dir: 'down', label: '1' }, { x: 36, y: 0, dir: 'up', label: '2' }, { x: 64, y: 50, dir: 'down', label: '3' }, { x: 64, y: 0, dir: 'up', label: '4' }], params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },
    /* Pneumatically operated 4/3 */
    'v43-pilot-single': { name: '4/3 Single Pilot', cat: 'dcv', w: 100, h: 50,
      ports: [
        { x: 36, y: 50, dir: 'down',  label: '1'  },  /* 0 = P supply       */
        { x: 36, y: 0,  dir: 'up',    label: '2'  },  /* 1 = A output       */
        { x: 64, y: 50, dir: 'down',  label: '3'  },  /* 2 = port 3 exhaust */
        { x: 64, y: 0,  dir: 'up',    label: '4'  },  /* 3 = B output       */
        { x: 0, y: 25, dir: 'left', label: '12' }      /* 4 = pilot 12 (1→2 = Extend) */
      ],
      params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend'], def: 'Center' } } },
    'v43-pilot-double': { name: '4/3 Double Pilot', cat: 'dcv', w: 100, h: 50,
      ports: [
        { x: 36, y: 50, dir: 'down',  label: '1'  },  /* 0 = P supply       */
        { x: 36, y: 0,  dir: 'up',    label: '2'  },  /* 1 = A output       */
        { x: 64, y: 50, dir: 'down',  label: '3'  },  /* 2 = port 3 exhaust */
        { x: 64, y: 0,  dir: 'up',    label: '4'  },  /* 3 = B output       */
        { x: 0,   y: 25, dir: 'left',  label: '12' },  /* 4 = pilot 12 (→Ext)*/
        { x: 100, y: 25, dir: 'right', label: '14' }   /* 5 = pilot 14 (→Ret)*/
      ],
      params: { position: { label: 'Position', type: 'select', options: ['Center', 'Extend', 'Retract'], def: 'Center' } } },

    /* ── Flow Control (3) — ISO: 1(in), 2(out) ── */
    'flow-control': { name: 'One-Way Flow Ctrl', cat: 'flow', w: 40, h: 44, ports: [{ x: 20, y: 44, dir: 'down', label: '1' }, { x: 20, y: 0, dir: 'up', label: '2' }], params: { flow: { label: 'Max Flow (NL/min)', min: 10, max: 200, step: 5, def: 80 } } },
    'throttle': { name: 'Throttle Valve', cat: 'flow', w: 36, h: 40, ports: [{ x: 18, y: 40, dir: 'down', label: '1' }, { x: 18, y: 0, dir: 'up', label: '2' }], params: { opening: { label: 'Opening (%)', min: 5, max: 100, step: 5, def: 50 } } },
    'quick-exhaust': { name: 'Quick Exhaust', cat: 'flow', w: 44, h: 40, ports: [{ x: 22, y: 40, dir: 'down', label: '1' }, { x: 22, y: 0, dir: 'up', label: '2' }, { x: 44, y: 20, dir: 'right', label: '3' }], params: {} },

    /* ── Pressure Control (2) — ISO: 1(in), 2(out) ── */
    'relief': { name: 'Relief Valve', cat: 'pressure', w: 40, h: 50, ports: [{ x: 20, y: 50, dir: 'down', label: '1' }, { x: 20, y: 0, dir: 'up', label: '3' }], params: { setting: { label: 'Setting (bar)', min: 2, max: 12, step: 0.5, def: 8 } } },
    'sequence-valve': { name: 'Sequence Valve', cat: 'pressure', w: 40, h: 50, ports: [{ x: 20, y: 50, dir: 'down', label: '1' }, { x: 20, y: 0, dir: 'up', label: '2' }], params: { setting: { label: 'Setting (bar)', min: 2, max: 10, step: 0.5, def: 4 } } },

    /* ── Logic Valves (4) — ISO 11727: inputs 1 and 1(3), output 2 ── */
    'check': { name: 'Check Valve', cat: 'logic', w: 36, h: 40, ports: [{ x: 18, y: 40, dir: 'down', label: '1' }, { x: 18, y: 0, dir: 'up', label: '2' }], params: {} },
    'pilot-check': { name: 'Pilot Check', cat: 'logic', w: 44, h: 40, ports: [{ x: 22, y: 40, dir: 'down', label: '1' }, { x: 22, y: 0, dir: 'up', label: '2' }, { x: 44, y: 20, dir: 'right', label: '12' }], params: { pilotRatio: { label: 'Pilot Area Ratio', type: 'select', options: ['3:1', '4:1', '5:1'], def: '3:1' } } },
    'shuttle': { name: 'Shuttle (OR)', cat: 'logic', w: 44, h: 40, ports: [{ x: 0, y: 20, dir: 'left', label: '1' }, { x: 44, y: 20, dir: 'right', label: '1(3)' }, { x: 22, y: 0, dir: 'up', label: '2' }], params: {} },
    'dual-pressure': { name: 'AND Valve', cat: 'logic', w: 44, h: 40, ports: [{ x: 0, y: 20, dir: 'left', label: '1' }, { x: 44, y: 20, dir: 'right', label: '1(3)' }, { x: 22, y: 0, dir: 'up', label: '2' }], params: {} },

    /* ── Actuators (4) — ISO convention: 2 = blind/cap end (extend),
         4 = rod end (retract). Port 2 is drawn at the blind end of the
         barrel and port 4 at the rod end so the symbol matches the model. ── */
    'cyl-sa': { name: 'Single-Act Cyl', cat: 'actuators', w: 90, h: 60, ports: [{ x: 9, y: 60, dir: 'down', label: '2' }], params: { bore: { label: 'Bore (mm)', min: 16, max: 100, step: 1, def: 40 }, stroke: { label: 'Stroke (mm)', min: 25, max: 500, step: 5, def: 100 }, /* Default load must be inside the spring's return capability — a single-acting cylinder can only come back if the spring beats the load. */ load: { label: 'Load (N)', min: 0, max: 5000, step: 10, def: 80 } } },
    'cyl-da': { name: 'Double-Act Cyl', cat: 'actuators', w: 100, h: 60, ports: [{ x: 8, y: 60, dir: 'down', label: '2' }, { x: 56, y: 60, dir: 'down', label: '4' }], params: { bore: { label: 'Bore (mm)', min: 16, max: 100, step: 1, def: 50 }, rod: { label: 'Rod (mm)', min: 8, max: 50, step: 1, def: 20 }, stroke: { label: 'Stroke (mm)', min: 25, max: 500, step: 5, def: 150 }, load: { label: 'Load (N)', min: 0, max: 5000, step: 50, def: 200 } } },
    'cyl-rodless': { name: 'Rodless Cyl', cat: 'actuators', w: 100, h: 30, ports: [{ x: 0, y: 15, dir: 'left', label: '2' }, { x: 100, y: 15, dir: 'right', label: '4' }], params: { bore: { label: 'Bore (mm)', min: 16, max: 63, step: 1, def: 25 }, stroke: { label: 'Stroke (mm)', min: 100, max: 1000, step: 50, def: 300 }, load: { label: 'Load (N)', min: 0, max: 5000, step: 50, def: 100 } } },
    'rotary-act': { name: 'Rotary Actuator', cat: 'actuators', w: 50, h: 50, ports: [{ x: 0, y: 25, dir: 'left', label: '2' }, { x: 50, y: 25, dir: 'right', label: '4' }], params: { angle: { label: 'Swing (\u00B0)', min: 90, max: 360, step: 90, def: 180 } } },

    /* ── Vacuum (2) — Industry standard: P(supply), R(exhaust), V(vacuum) ── */
    'venturi': { name: 'Vacuum Generator', cat: 'vacuum', w: 50, h: 44, ports: [{ x: 0, y: 22, dir: 'left', label: 'P' }, { x: 50, y: 22, dir: 'right', label: 'R' }, { x: 25, y: 44, dir: 'down', label: 'V' }], params: { vacuumLevel: { label: 'Max Vacuum (bar)', min: 0.2, max: 0.9, step: 0.1, def: 0.6 } } },
    'suction-cup': { name: 'Suction Cup', cat: 'vacuum', w: 36, h: 36, ports: [{ x: 18, y: 0, dir: 'up', label: 'V' }], params: { diameter: { label: 'Cup \u00D8 (mm)', min: 10, max: 80, step: 5, def: 40 } } },

    /* ── Timing (2) — a real pneumatic timer is a 3/2 valve + air reservoir +
         one-way throttle: 12(pilot), 1(supply), 2(output), 3(exhaust).
         Port index order is kept as 0=12, 1=2, 2=1 so existing logic is stable. ── */
    'timer-on': { name: 'On-Delay Timer', cat: 'timing', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '12' }, { x: 45, y: 0, dir: 'up', label: '2' }, { x: 45, y: 50, dir: 'down', label: '1' }], params: { delay: { label: 'Delay (s)', min: 0.5, max: 30, step: 0.5, def: 3 } } },
    'timer-off': { name: 'Off-Delay Timer', cat: 'timing', w: 60, h: 50, ports: [{ x: 15, y: 50, dir: 'down', label: '12' }, { x: 45, y: 0, dir: 'up', label: '2' }, { x: 45, y: 50, dir: 'down', label: '1' }], params: { delay: { label: 'Delay (s)', min: 0.5, max: 30, step: 0.5, def: 3 } } },

    /* ── Measurement (3) ── */
    'gauge': { name: 'Pressure Gauge', cat: 'measure', w: 44, h: 50, ports: [{ x: 22, y: 50, dir: 'down', label: 'G' }], params: {} },
    'flow-meter': { name: 'Flow Meter', cat: 'measure', w: 44, h: 56, ports: [{ x: 22, y: 56, dir: 'down', label: '1' }, { x: 22, y: 0, dir: 'up', label: '2' }], params: {} },
    'proximity': { name: 'Proximity Sensor', cat: 'measure', w: 44, h: 44, ports: [{ x: 22, y: 44, dir: 'down', label: 'S' }], params: { threshold: { label: 'Threshold (bar)', min: 0.2, max: 8, step: 0.2, def: 0.5 } } },

    /* ── Sensors / Limit Switches (2) — 2-port roller-lever switches, triggered by cylinder position ── */
    'limit-nc': { name: 'Limit Switch NC', cat: 'sensors', w: 30, h: 44, ports: [{ x: 15, y: 44, dir: 'down', label: '1' }, { x: 15, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' }, triggerCyl: { label: 'Linked Cylinder', type: 'cylSelect', def: 0 }, triggerAt: { label: 'Position (%)', min: 0, max: 100, step: 1, def: 95 } } },
    'limit-no': { name: 'Limit Switch NO', cat: 'sensors', w: 30, h: 44, ports: [{ x: 15, y: 44, dir: 'down', label: '1' }, { x: 15, y: 0, dir: 'up', label: '2' }], params: { position: { label: 'Position', type: 'select', options: ['Normal', 'Actuated'], def: 'Normal' }, triggerCyl: { label: 'Linked Cylinder', type: 'cylSelect', def: 0 }, triggerAt: { label: 'Position (%)', min: 0, max: 100, step: 1, def: 95 } } },

    /* ── Utility (2) ── */
    'silencer': { name: 'Silencer', cat: 'util', w: 28, h: 34, ports: [{ x: 14, y: 0, dir: 'up', label: 'R' }], params: {} },
    'tee': { name: 'T-Connector', cat: 'util', w: 30, h: 30, ports: [{ x: 15, y: 0, dir: 'up', label: '1' }, { x: 0, y: 15, dir: 'left', label: '2' }, { x: 30, y: 15, dir: 'right', label: '3' }], params: {} }
  };

  /* ================================================================
     CANVAS SIZING
     ================================================================ */

  function resizeCanvas() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
    W = Math.max(400, Math.floor(rect.width));
    if (isFS && rect.height > 100) {
      /* Fullscreen: use the full available height of the canvas card */
      H = Math.max(300, Math.floor(rect.height));
    } else {
      /* Normal: maintain aspect ratio, capped so it doesn't overwhelm the page */
      H = Math.max(300, Math.min(540, Math.floor(W * 0.6)));
    }
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  window.addEventListener('resize', resizeCanvas);

  /* ================================================================
     ROTATION HELPERS
     ================================================================ */

  function getRotatedPort(def, portIdx, orient) {
    var port = def.ports[portIdx];
    if (!port) return null;
    if (!orient) return { x: port.x, y: port.y, dir: port.dir, label: port.label };
    var dirs = { up: 'right', right: 'down', down: 'left', left: 'up' };
    return { x: def.h - port.y, y: port.x, dir: dirs[port.dir] || port.dir, label: port.label };
  }

  function getCylWidth(comp) {
    var def = COMP_DEFS[comp.type];
    if (!def || !def.params || !def.params.stroke) return def ? def.w : 60;
    var stroke = (comp.values && comp.values.stroke) || def.params.stroke.def;
    var defStroke = def.params.stroke.def;
    return Math.round(def.w + (stroke - defStroke) * 0.2);
  }

  function getEffectiveDims(comp) {
    var def = COMP_DEFS[comp.type];
    if (!def) return { w: 60, h: 40 };
    var w = def.w;
    if (comp.type === 'cyl-sa' || comp.type === 'cyl-da') w = getCylWidth(comp);
    return comp.orient ? { w: def.h, h: w } : { w: w, h: def.h };
  }

  /* ================================================================
     PORT TOOLTIP — description lookup + canvas renderer
     ================================================================ */

  var PORT_DESC = {
    '1':   'Supply — Pressure in (P)',
    '2':   'Output A — to actuator',
    '3':   'Exhaust A — return to atm',
    '4':   'Output B — to actuator',
    '5':   'Exhaust B — return to atm',
    '12':  'Pilot 12 — selects flow 1→2 (extend)',
    '14':  'Pilot 14 — selects flow 1→4 (retract)',
    '1(3)': 'Second input — ISO 11727 port 1(3)',
    'P':   'Pressure supply',
    'A':   'Output A — to actuator',
    'B':   'Output B — to actuator',
    'T':   'Exhaust — vents to atmosphere',
    'R':   'Exhaust to atmosphere',
    'IN':  'Air inlet',
    'OUT': 'Air outlet',
    'EXH': 'Exhaust',
    'X':   'Pilot — extend',
    'Y':   'Pilot — retract',
    'Z':   'Pilot signal',
    'S':   'Set (pilot)',
    'CV':  'Check valve port',
    '+':   'Pressure port',
    'SIG': 'Signal input',
    'PL':  'Pilot line',
    'SUP': 'Supply'
  };

  /* True if a given (component, port-label) is an exhaust-to-atmosphere port.
     Exhaust ports may still accept a connection (silencer, flow-control for
     meter-out speed, quick-exhaust, feedback line) but are marked red to warn
     the user that they vent to atmosphere. */
  function isExhaustPort(compType, portLabel) {
    if (!portLabel) return false;
    if (compType === 'tee') return false;        /* T-connector '3' is a junction */
    if (compType === 'silencer') return true;    /* silencer itself is an exhaust */
    if (/^v(22|32|43|52|53)/.test(compType)) return portLabel === '3' || portLabel === '5';
    if (compType === 'relief') return portLabel === '3';
    if (compType === 'quick-exhaust') return portLabel === '3';
    if (compType === 'venturi') return portLabel === 'R';
    return false;
  }

  function drawPortTooltip(label, desc, cssx, cssy, tip) {
    /* cssx/cssy are CSS pixels from the canvas top-left corner.
       The canvas internal resolution is W×H but displayed at a smaller CSS size,
       so we must scale all coordinates and sizes by (canvas-px / CSS-px). */
    var _cRect = canvas.getBoundingClientRect();
    var scX = canvas.width  / _cRect.width;   /* e.g. 2.0 on retina */
    var scY = canvas.height / _cRect.height;  /* may differ from scX  */
    var sc  = scX;  /* use X-scale for uniform font / spacing sizes   */

    /* Convert the CSS port position to canvas pixels */
    var sx = cssx * scX;
    var sy = cssy * scY;

    /* All design constants in CSS pixels — multiply by sc for canvas px */
    var PORT_R_CSS   = 4;   /* visual radius of hovered port circle (CSS px) */
    var ARROW_H_CSS  = 9;
    var PAD_X_CSS    = 14;
    var PAD_Y_CSS    = 9;
    var GAP_CSS      = 5;   /* gap between the two text lines               */
    var F1_CSS       = 14;  /* port label font size (CSS px)                */
    var F2_CSS       = 13;  /* description font size (CSS px)               */
    var RADIUS_CSS   = 6;   /* box corner radius (CSS px)                   */

    var PORT_R  = PORT_R_CSS  * scY;
    var ARROW_H = ARROW_H_CSS * sc;
    var PAD_X   = PAD_X_CSS   * sc;
    var PAD_Y   = PAD_Y_CSS   * sc;
    var GAP     = GAP_CSS     * sc;
    var F1      = Math.round(F1_CSS * sc);
    var F2      = Math.round(F2_CSS * sc);
    var BRAD    = RADIUS_CSS  * sc;

    var line1 = 'Port ' + label;
    var line2 = desc || '';
    var line3 = tip || '';

    /* Exhaust ports use a red border + red label to reinforce "vents to atm" */
    var isExhaust = !!tip;
    var borderCol = isExhaust ? '#ef5350' : '#f5c518';
    var labelCol  = isExhaust ? '#ff8a80' : '#ffd700';
    var descCol   = isExhaust ? '#ffcdd2' : '#ffe98a';
    var tipCol    = '#ffb74d';

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); /* identity — canvas pixel space */

    /* Measure text widths */
    ctx.font = 'bold ' + F1 + 'px ' + _fontFamily;
    var w1 = ctx.measureText(line1).width;
    ctx.font = F2 + 'px ' + _fontFamily;
    var w2 = line2 ? ctx.measureText(line2).width : 0;
    var w3 = line3 ? ctx.measureText(line3).width : 0;

    var bw = Math.max(w1, w2, w3) + PAD_X * 2;
    var bh = PAD_Y + F1
           + (line2 ? GAP + F2 : 0)
           + (line3 ? GAP + F2 : 0)
           + PAD_Y;

    /* Arrow tip lands at the top edge of the port circle */
    var arrowTipY = sy - PORT_R;
    var by = arrowTipY - ARROW_H - bh;
    var bx = sx - bw / 2;

    /* Clamp horizontally to canvas bounds */
    if (bx < 4) bx = 4;
    if (bx + bw > canvas.width - 4) bx = canvas.width - bw - 4;

    /* Flip below port if tooltip would go above canvas top */
    var flipped = by < 4;
    if (flipped) by = sy + PORT_R + ARROW_H;

    /* Drop shadow */
    ctx.shadowColor  = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur   = 8 * sc;
    ctx.shadowOffsetY = 3 * sc;

    /* Background box */
    ctx.fillStyle   = '#0d1625';
    ctx.strokeStyle = borderCol;
    ctx.lineWidth   = 1.5 * sc;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, BRAD);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.stroke();

    /* Arrow triangle — tip points toward the port */
    var arrowBaseY = flipped ? by        : by + bh;
    var arrowTipY2 = flipped ? by - ARROW_H : by + bh + ARROW_H;
    var arrowX = Math.max(bx + 10 * sc, Math.min(bx + bw - 10 * sc, sx));
    ctx.beginPath();
    ctx.moveTo(arrowX - 7 * sc, arrowBaseY);
    ctx.lineTo(arrowX + 7 * sc, arrowBaseY);
    ctx.lineTo(arrowX, arrowTipY2);
    ctx.closePath();
    ctx.fillStyle   = '#0d1625';
    ctx.fill();
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    /* Port label — bold, yellow (or red-ish for exhaust) */
    ctx.font        = 'bold ' + F1 + 'px ' + _fontFamily;
    ctx.fillStyle   = labelCol;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(line1, bx + bw / 2, by + PAD_Y);

    /* Description line */
    if (line2) {
      ctx.font      = F2 + 'px ' + _fontFamily;
      ctx.fillStyle = descCol;
      ctx.fillText(line2, bx + bw / 2, by + PAD_Y + F1 + GAP);
    }

    /* Optional tip line (e.g. for exhaust: "Silencer / flow ctrl ok") */
    if (line3) {
      ctx.font      = F2 + 'px ' + _fontFamily;
      ctx.fillStyle = tipCol;
      ctx.fillText(line3, bx + bw / 2, by + PAD_Y + F1 + (line2 ? GAP + F2 : 0) + GAP);
    }

    ctx.restore();
  }

  /* ================================================================
     DRAWING — ISO 1219 PNEUMATIC SYMBOLS
     ================================================================ */

  function draw() {
    /* Clear at identity transform to ensure full canvas is cleared */
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    /* Apply view transform so circuit + grid zoom/pan together */
    ctx.save();
    ctx.translate(viewOffX, viewOffY);
    ctx.scale(viewScale, viewScale);

    /* Grid — compute bounds to fill visible area when zoomed */
    var gMinX = Math.floor(-viewOffX / viewScale / 20) * 20;
    var gMaxX = Math.ceil((W - viewOffX) / viewScale / 20) * 20;
    var gMinY = Math.floor(-viewOffY / viewScale / 20) * 20;
    var gMaxY = Math.ceil((H - viewOffY) / viewScale / 20) * 20;
    ctx.strokeStyle = '#151a24';
    ctx.lineWidth = 0.5;
    for (var gx = gMinX; gx <= gMaxX; gx += 20) { ctx.beginPath(); ctx.moveTo(gx, 0 + gMinY); ctx.lineTo(gx, gMaxY); ctx.stroke(); }
    for (var gy = gMinY; gy <= gMaxY; gy += 20) { ctx.beginPath(); ctx.moveTo(gMinX, gy); ctx.lineTo(gMaxX, gy); ctx.stroke(); }

    recomputePaths();

    for (var i = 0; i < connections.length; i++) {
      drawConnection(connections[i], i, hoveredConn === i, selectedConn === i);
    }
    drawCrossings();

    /* Connection preview — full-route preview from source port, through user
       waypoints, to either (a) the port currently under the cursor (showing the
       exact final route), or (b) the cursor itself (snapped orthogonally to a
       grid-aligned bend). */
    if (connectingFrom) {
      var fpPrev = getPortWorldPos(connectingFrom);
      var prevCompF = findComp(connectingFrom.compId);
      var prevPortF = null, stubPt = fpPrev;
      if (prevCompF) {
        var prevDefF = COMP_DEFS[prevCompF.type];
        prevPortF = getRotatedPort(prevDefF, connectingFrom.portIdx, prevCompF.orient);
        stubPt = applyStub({ x: prevCompF.x + prevPortF.x, y: prevCompF.y + prevPortF.y }, prevPortF.dir, 20);
      }

      /* Are we hovering a port that would be a valid drop target? */
      var dropPort = (connectingFrom._lastMouse && hoveredPort && hoveredPort.compId !== connectingFrom.compId)
        ? hoveredPort : null;
      var dropPortIsExhaust = false;
      var previewPath = [fpPrev, stubPt];

      if (connectingFrom._waypoints) {
        for (var wi = 0; wi < connectingFrom._waypoints.length; wi++) {
          previewPath.push(connectingFrom._waypoints[wi]);
        }
      }

      if (dropPort) {
        /* Hovering a real target — preview the full final route the user would get */
        var dropComp = findComp(dropPort.compId);
        if (dropComp) {
          var dropDef = COMP_DEFS[dropComp.type];
          var dropPortDef = getRotatedPort(dropDef, dropPort.portIdx, dropComp.orient);
          dropPortIsExhaust = isExhaustPort(dropComp.type, dropPortDef.label);
          var tp = { x: dropComp.x + dropPortDef.x, y: dropComp.y + dropPortDef.y };
          var tpS = applyStub(tp, dropPortDef.dir, 20);
          var lastWp = previewPath[previewPath.length - 1];
          if (Math.abs(lastWp.x - tpS.x) > 1 && Math.abs(lastWp.y - tpS.y) > 1) {
            if (dropPortDef.dir === 'up' || dropPortDef.dir === 'down') {
              previewPath.push({ x: tpS.x, y: lastWp.y });
            } else {
              previewPath.push({ x: lastWp.x, y: tpS.y });
            }
          }
          previewPath.push(tpS);
          previewPath.push(tp);
          previewPath = enforceOrthogonal(previewPath);
        }
      } else if (connectingFrom._lastMouse) {
        /* Free-routing to cursor — snap orthogonally from last point, grid-snapped */
        var mouse = connectingFrom._lastMouse;
        var lastPt = previewPath[previewPath.length - 1];
        var pdx = Math.abs(mouse.x - lastPt.x);
        var pdy = Math.abs(mouse.y - lastPt.y);
        var snappedX = snapToGrid(mouse.x);
        var snappedY = snapToGrid(mouse.y);
        if (pdx <= pdy) previewPath.push({ x: lastPt.x, y: snappedY });
        else            previewPath.push({ x: snappedX, y: lastPt.y });
      }

      /* Draw preview polyline */
      ctx.strokeStyle = dropPort ? (dropPortIsExhaust ? '#ef5350' : '#66bb6a') : '#42a5f5';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (var pi = 0; pi < previewPath.length; pi++) {
        if (pi === 0) ctx.moveTo(previewPath[pi].x, previewPath[pi].y);
        else ctx.lineTo(previewPath[pi].x, previewPath[pi].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      /* Draw waypoint dots */
      if (connectingFrom._waypoints) {
        for (var wd = 0; wd < connectingFrom._waypoints.length; wd++) {
          ctx.beginPath();
          ctx.arc(connectingFrom._waypoints[wd].x, connectingFrom._waypoints[wd].y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#80d8ff';
          ctx.fill();
        }
      }

      /* Highlight the candidate drop port with a halo */
      if (dropPort) {
        var dropPortPos = getPortWorldPos(dropPort);
        ctx.beginPath();
        ctx.arc(dropPortPos.x, dropPortPos.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = dropPortIsExhaust ? '#ef5350' : '#66bb6a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (var c = 0; c < components.length; c++) {
      drawComponent(components[c]);
    }

    drawLimitSwitchRulers();

    if (running) drawParticles();

    if (components.length === 0 && !running) {
      ctx.fillStyle = '#2a3050';
      ctx.font = '14px ' + _fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText('Drag or click components from the palette to add them', W / 2, H / 2 - 10);
      ctx.fillText('Then click ports (circles) to connect them', W / 2, H / 2 + 14);
      ctx.textAlign = 'left';
    }

    ctx.restore(); /* End view transform — annotations handle their own */

    /* Draw annotations on top of everything */
    drawAnnotations();

    /* Port tooltip — drawn last so it floats above all layers.
       Suppressed while drawing a connection or dragging a component (the
       drop-port halo and preview line already communicate port intent during
       a connect, and we don't want a stale tooltip lingering after a click). */
    if (hoveredPort && !draggingComp && !connectingFrom) {
      var _hpComp = null;
      for (var _tpi = 0; _tpi < components.length; _tpi++) {
        if (components[_tpi].id === hoveredPort.compId) { _hpComp = components[_tpi]; break; }
      }
      if (_hpComp) {
        var _hpDef = COMP_DEFS[_hpComp.type];
        if (_hpDef && _hpDef.ports[hoveredPort.portIdx]) {
          var _hpLbl = _hpDef.ports[hoveredPort.portIdx].label || '';
          var _hpDesc = PORT_DESC[_hpLbl] || '';
          var _hpExh = isExhaustPort(_hpComp.type, _hpLbl);
          var _hpTip = _hpExh ? 'Silencer / flow-ctrl / quick-exhaust ok' : '';
          drawPortTooltip(_hpLbl, _hpDesc, hoveredPortSX, hoveredPortSY, _hpTip);
        }
      }
    }
  }

  /* ── Routing helpers ── */

  function applyStub(pos, dir, len) {
    switch (dir) {
      case 'up': return { x: pos.x, y: pos.y - len };
      case 'down': return { x: pos.x, y: pos.y + len };
      case 'left': return { x: pos.x - len, y: pos.y };
      case 'right': return { x: pos.x + len, y: pos.y };
      default: return { x: pos.x, y: pos.y - len };
    }
  }

  /* Routing constants — change here to tune the entire connector aesthetic */
  var ROUTE_GRID = 10;        /* coordinate grid for waypoints + bend points */
  var ROUTE_BUNDLE_GAP = 4;   /* spacing between bundled parallel wires (was 8) */
  var ROUTE_OBSTACLE_PAD = 8; /* extra clearance around component bbox when avoiding */

  function snapToGrid(v) { return Math.round(v / ROUTE_GRID) * ROUTE_GRID; }
  function snapPt(pt)    { return { x: snapToGrid(pt.x), y: snapToGrid(pt.y) }; }

  /* Coarse pointer (touch) detection — used to enlarge hit-targets on iPad. */
  var IS_COARSE_POINTER = (function () {
    try { return window.matchMedia && window.matchMedia('(pointer: coarse)').matches; }
    catch (_e) { return false; }
  })();
  /* Re-evaluate when the matching media changes (e.g. tablet docked to mouse) */
  try {
    var _coarseMQ = window.matchMedia('(pointer: coarse)');
    if (_coarseMQ.addEventListener) _coarseMQ.addEventListener('change', function (e) { IS_COARSE_POINTER = e.matches; });
    else if (_coarseMQ.addListener) _coarseMQ.addListener(function (e) { IS_COARSE_POINTER = e.matches; });
  } catch (_e2) { /* no-op */ }

  /* Component bounding box in world coords (with optional padding).
     Skips ports — we only want the visual body, since wires can touch port stubs. */
  function compBBox(comp, pad) {
    var def = COMP_DEFS[comp.type];
    if (!def) return null;
    pad = pad || 0;
    var cw = (comp.type === 'cyl-sa' || comp.type === 'cyl-da') ? getCylWidth(comp) : def.w;
    var rotated = (comp.orient === 90 || comp.orient === 270);
    var w = rotated ? def.h : cw;
    var h = rotated ? cw : def.h;
    return { x1: comp.x - pad, y1: comp.y - pad, x2: comp.x + w + pad, y2: comp.y + h + pad };
  }

  /* True if axis-aligned segment (x1,y1)-(x2,y2) crosses inside the rectangle.
     `excludeIds` optionally lists component IDs whose bbox we should ignore
     (the segment's source/target components, since the line legitimately touches them). */
  function segmentHitsObstacle(x1, y1, x2, y2, excludeIds) {
    excludeIds = excludeIds || [];
    var sxMin = Math.min(x1, x2), sxMax = Math.max(x1, x2);
    var syMin = Math.min(y1, y2), syMax = Math.max(y1, y2);
    for (var i = 0; i < components.length; i++) {
      var c = components[i];
      if (excludeIds.indexOf(c.id) !== -1) continue;
      var bb = compBBox(c, ROUTE_OBSTACLE_PAD);
      if (!bb) continue;
      /* AABB vs segment intersect (segment is axis-aligned so this is just rect overlap) */
      if (sxMax < bb.x1 || sxMin > bb.x2) continue;
      if (syMax < bb.y1 || syMin > bb.y2) continue;
      return c;
    }
    return null;
  }

  /* Find a clear horizontal Y between two points that doesn't cross obstacles.
     Searches outward from the natural midpoint in ROUTE_GRID steps. */
  function findClearMidY(fpS, tpS, naturalMid, excludeIds) {
    var attempts = [naturalMid];
    /* Try snapped variations: ±1, ±2, ±3 grid units */
    for (var k = 1; k <= 8; k++) {
      attempts.push(naturalMid + k * ROUTE_GRID);
      attempts.push(naturalMid - k * ROUTE_GRID);
    }
    for (var a = 0; a < attempts.length; a++) {
      var y = snapToGrid(attempts[a]);
      /* Check both vertical legs and the horizontal bridge */
      if (segmentHitsObstacle(fpS.x, fpS.y, fpS.x, y, excludeIds)) continue;
      if (segmentHitsObstacle(tpS.x, y, tpS.x, tpS.y, excludeIds)) continue;
      if (segmentHitsObstacle(fpS.x, y, tpS.x, y, excludeIds)) continue;
      return y;
    }
    return snapToGrid(naturalMid); /* give up — return snapped natural midpoint */
  }

  function findClearMidX(fpS, tpS, naturalMid, excludeIds) {
    var attempts = [naturalMid];
    for (var k = 1; k <= 8; k++) {
      attempts.push(naturalMid + k * ROUTE_GRID);
      attempts.push(naturalMid - k * ROUTE_GRID);
    }
    for (var a = 0; a < attempts.length; a++) {
      var x = snapToGrid(attempts[a]);
      if (segmentHitsObstacle(fpS.x, fpS.y, x, fpS.y, excludeIds)) continue;
      if (segmentHitsObstacle(x, tpS.y, tpS.x, tpS.y, excludeIds)) continue;
      if (segmentHitsObstacle(x, fpS.y, x, tpS.y, excludeIds)) continue;
      return x;
    }
    return snapToGrid(naturalMid);
  }

  function enforceOrthogonal(pts) {
    if (!pts || pts.length < 2) return pts;
    var result = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var prev = result[result.length - 1];
      var cur = pts[i];
      if (Math.abs(prev.x - cur.x) > 1 && Math.abs(prev.y - cur.y) > 1) {
        if (result.length >= 2) {
          var pp = result[result.length - 2];
          if (Math.abs(pp.x - prev.x) < 1) result.push({ x: prev.x, y: cur.y });
          else result.push({ x: cur.x, y: prev.y });
        } else {
          result.push({ x: cur.x, y: prev.y });
        }
      }
      result.push(cur);
    }
    return result;
  }

  function findComp(id) {
    for (var i = 0; i < components.length; i++) { if (components[i].id === id) return components[i]; }
    return null;
  }

  function isLimitSwitch(type) { return type === 'limit-nc' || type === 'limit-no'; }

  function getNextSName() {
    var used = {};
    for (var i = 0; i < components.length; i++) {
      if (isLimitSwitch(components[i].type) && components[i].sName) {
        var n = parseInt(components[i].sName.substring(1), 10);
        if (!isNaN(n)) used[n] = true;
      }
    }
    for (var s = 1; s <= 999; s++) { if (!used[s]) return 'S' + s; }
    return 'S' + (components.length + 1);
  }

  function countLimitSwitchesForCyl(cylId, excludeId) {
    var count = 0;
    for (var i = 0; i < components.length; i++) {
      var c = components[i];
      if (isLimitSwitch(c.type) && c.values.triggerCyl === cylId && c.id !== excludeId) count++;
    }
    return count;
  }

  function getPortWorldPos(info) {
    var comp = findComp(info.compId);
    if (!comp) return { x: 0, y: 0 };
    var def = COMP_DEFS[comp.type];
    var port = getRotatedPort(def, info.portIdx, comp.orient);
    return { x: comp.x + port.x, y: comp.y + port.y };
  }

  function getConnectionPath(conn) {
    var fromComp = findComp(conn.from.compId);
    var toComp = findComp(conn.to.compId);
    if (!fromComp || !toComp) return null;

    var fromDef = COMP_DEFS[fromComp.type];
    var toDef = COMP_DEFS[toComp.type];
    var fromPort = getRotatedPort(fromDef, conn.from.portIdx, fromComp.orient);
    var toPort = getRotatedPort(toDef, conn.to.portIdx, toComp.orient);
    if (!fromPort || !toPort) return null;

    var fp = { x: fromComp.x + fromPort.x, y: fromComp.y + fromPort.y };
    var tp = { x: toComp.x + toPort.x, y: toComp.y + toPort.y };

    var STUB = 20;
    var fpS = applyStub(fp, fromPort.dir, STUB);
    var tpS = applyStub(tp, toPort.dir, STUB);

    if (conn.waypoints && conn.waypoints.length > 0) {
      var wpts = [fp, fpS];
      for (var wi = 0; wi < conn.waypoints.length; wi++) wpts.push(conn.waypoints[wi]);
      var lastWp = wpts[wpts.length - 1];
      if (Math.abs(lastWp.x - tpS.x) > 1 && Math.abs(lastWp.y - tpS.y) > 1) {
        if (toPort.dir === 'up' || toPort.dir === 'down') wpts.push({ x: tpS.x, y: lastWp.y });
        else wpts.push({ x: lastWp.x, y: tpS.y });
      }
      wpts.push(tpS);
      wpts.push(tp);
      return enforceOrthogonal(wpts);
    }

    var points = [fp, fpS];
    var isFromVert = (fromPort.dir === 'up' || fromPort.dir === 'down');
    var isToVert = (toPort.dir === 'up' || toPort.dir === 'down');
    var nudgeAmt = (conn._dragOffset || 0) + (conn._autoNudge || 0);
    var excludeIds = [fromComp.id, toComp.id];

    if (Math.abs(fpS.x - tpS.x) < 1 && Math.abs(fpS.y - tpS.y) < 1) {
      /* direct (stubs already meet) */
    } else if (Math.abs(fpS.x - tpS.x) < 1 || Math.abs(fpS.y - tpS.y) < 1) {
      points.push(tpS);
    } else if (isFromVert && isToVert) {
      /* Two vertical-port stubs joined by a horizontal bridge */
      var natural = (fpS.y + tpS.y) / 2 + nudgeAmt;
      var midY = findClearMidY(fpS, tpS, natural, excludeIds);
      points.push({ x: fpS.x, y: midY });
      points.push({ x: tpS.x, y: midY });
      points.push(tpS);
    } else if (!isFromVert && !isToVert) {
      /* Two horizontal-port stubs joined by a vertical bridge */
      var naturalX = (fpS.x + tpS.x) / 2 + nudgeAmt;
      var midX = findClearMidX(fpS, tpS, naturalX, excludeIds);
      points.push({ x: midX, y: fpS.y });
      points.push({ x: midX, y: tpS.y });
      points.push(tpS);
    } else {
      /* Mixed orientations — try a single L-bend first (cleaner look). If the
         long leg of the L would pass through the TARGET component's body
         (which obstacle avoidance excludes since the wire legitimately needs
         to touch its port), fall back to a U-bend at the midpoint between
         the two stub ends. */
      if (isFromVert) {
        var bendY = snapToGrid(tpS.y + nudgeAmt);
        var crossesTarget = false;
        var tBox = compBBox(toComp, ROUTE_OBSTACLE_PAD);
        /* The vertical leg from fpS to (fpS.x, bendY) — does it pass through
           the target body? The target body excludes the port stub itself. */
        if (tBox && fpS.x > tBox.x1 && fpS.x < tBox.x2) {
          var legMinY = Math.min(fpS.y, bendY);
          var legMaxY = Math.max(fpS.y, bendY);
          if (legMaxY > tBox.y1 && legMinY < tBox.y2) crossesTarget = true;
        }
        /* Also check that the L-bend's vertical leg doesn't cross OTHER components */
        if (!crossesTarget && segmentHitsObstacle(fpS.x, fpS.y, fpS.x, bendY, excludeIds)) {
          crossesTarget = true; /* re-use flag to trigger U-bend fallback */
        }
        if (crossesTarget) {
          /* U-bend: bridge at midpoint, then enter target horizontally */
          var midUY = snapToGrid((fpS.y + tpS.y) / 2 + nudgeAmt);
          /* Find a clear midY if the midpoint is also blocked */
          midUY = findClearMidY(fpS, tpS, midUY, excludeIds);
          points.push({ x: fpS.x, y: midUY });
          points.push({ x: tpS.x, y: midUY });
        } else {
          points.push({ x: fpS.x, y: bendY });
          points.push({ x: tpS.x, y: bendY });
        }
      } else {
        var bendX = snapToGrid(tpS.x + nudgeAmt);
        var crossesTargetH = false;
        var tBoxH = compBBox(toComp, ROUTE_OBSTACLE_PAD);
        if (tBoxH && fpS.y > tBoxH.y1 && fpS.y < tBoxH.y2) {
          var legMinX = Math.min(fpS.x, bendX);
          var legMaxX = Math.max(fpS.x, bendX);
          if (legMaxX > tBoxH.x1 && legMinX < tBoxH.x2) crossesTargetH = true;
        }
        if (!crossesTargetH && segmentHitsObstacle(fpS.x, fpS.y, bendX, fpS.y, excludeIds)) {
          crossesTargetH = true;
        }
        if (crossesTargetH) {
          var midUX = snapToGrid((fpS.x + tpS.x) / 2 + nudgeAmt);
          midUX = findClearMidX(fpS, tpS, midUX, excludeIds);
          points.push({ x: midUX, y: fpS.y });
          points.push({ x: midUX, y: tpS.y });
        } else {
          points.push({ x: bendX, y: fpS.y });
          points.push({ x: bendX, y: tpS.y });
        }
      }
      points.push(tpS);
    }

    points.push(tp);
    return cleanPath(points);
  }

  function cleanPath(path) {
    if (!path || path.length < 2) return path;
    var fixed = [path[0]];
    for (var i = 1; i < path.length; i++) {
      var prev = fixed[fixed.length - 1];
      var cur = path[i];
      if (Math.abs(cur.x - prev.x) > 1 && Math.abs(cur.y - prev.y) > 1) {
        fixed.push({ x: cur.x, y: prev.y });
      }
      fixed.push(cur);
    }
    /* Merge collinear */
    var res = [fixed[0]];
    for (var j = 1; j < fixed.length; j++) {
      if (res.length >= 2) {
        var pp = res[res.length - 2], p = res[res.length - 1], c = fixed[j];
        if ((Math.abs(pp.x - p.x) < 1 && Math.abs(p.x - c.x) < 1) ||
            (Math.abs(pp.y - p.y) < 1 && Math.abs(p.y - c.y) < 1)) {
          res[res.length - 1] = c;
          continue;
        }
      }
      var prev2 = res[res.length - 1];
      if (!(Math.abs(fixed[j].x - prev2.x) < 1 && Math.abs(fixed[j].y - prev2.y) < 1)) {
        res.push(fixed[j]);
      }
    }
    return res;
  }

  function polylineLength(pts) {
    var len = 0;
    for (var i = 1; i < pts.length; i++) len += Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
    return len;
  }

  function interpolatePolyline(pts, dist) {
    var remaining = dist;
    for (var i = 1; i < pts.length; i++) {
      var segLen = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
      if (segLen < 0.001) continue;
      if (remaining <= segLen) {
        var frac = remaining / segLen;
        return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * frac, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * frac };
      }
      remaining -= segLen;
    }
    return pts[pts.length - 1];
  }

  function pointToSegmentDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    var projX = ax + t * dx, projY = ay + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  /* ── Path cache & overlap detection ── */

  function recomputePaths() {
    for (var i = 0; i < connections.length; i++) connections[i]._autoNudge = 0;
    _pathCache = [];
    for (var i = 0; i < connections.length; i++) _pathCache[i] = getConnectionPath(connections[i]);
    nudgeOverlaps();
    _crossingsCache = findCrossings();
  }

  function nudgeOverlaps() {
    /* Bundle parallel wires with tight 4-px spacing — FluidSIM-like harness look.
       Each wire in a group is shifted by a small grid-aligned offset so the
       fan-out stays compact instead of drifting by 8+ px per wire. */
    var THRESHOLD = 12;
    var nudged = {};
    for (var i = 0; i < _pathCache.length; i++) {
      if (nudged[i]) continue;
      var pathA = _pathCache[i];
      if (!pathA || pathA.length < 2) continue;
      var group = [i];
      for (var j = i + 1; j < _pathCache.length; j++) {
        var pathB = _pathCache[j];
        if (!pathB || pathB.length < 2) continue;
        if (pathsOverlap(pathA, pathB, THRESHOLD)) group.push(j);
      }
      if (group.length > 1) {
        for (var g = 0; g < group.length; g++) {
          var ci = group[g];
          /* Symmetric fan-out around the natural midpoint.
             findClearMidY/findClearMidX will snap the resulting absolute
             coordinate to grid, so adjacent wires land on nearby grid lines. */
          connections[ci]._autoNudge = (g - (group.length - 1) / 2) * ROUTE_BUNDLE_GAP;
          _pathCache[ci] = getConnectionPath(connections[ci]);
          nudged[ci] = true;
        }
      }
    }
  }

  function pathsOverlap(pathA, pathB, threshold) {
    for (var si = 1; si < pathA.length; si++) {
      var a1 = pathA[si - 1], a2 = pathA[si];
      var aH = Math.abs(a1.y - a2.y) < 1, aV = Math.abs(a1.x - a2.x) < 1;
      if (!aH && !aV) continue;
      for (var sj = 1; sj < pathB.length; sj++) {
        var b1 = pathB[sj - 1], b2 = pathB[sj];
        var bH = Math.abs(b1.y - b2.y) < 1, bV = Math.abs(b1.x - b2.x) < 1;
        if (!bH && !bV) continue;
        if (aH && bH && Math.abs(a1.y - b1.y) < 4) {
          var ov = Math.min(Math.max(a1.x, a2.x), Math.max(b1.x, b2.x)) - Math.max(Math.min(a1.x, a2.x), Math.min(b1.x, b2.x));
          if (ov > threshold) return true;
        } else if (aV && bV && Math.abs(a1.x - b1.x) < 4) {
          var ov2 = Math.min(Math.max(a1.y, a2.y), Math.max(b1.y, b2.y)) - Math.max(Math.min(a1.y, a2.y), Math.min(b1.y, b2.y));
          if (ov2 > threshold) return true;
        }
      }
    }
    return false;
  }

  function findCrossings() {
    var crossings = [];
    var allSegs = [];
    for (var ci = 0; ci < _pathCache.length; ci++) {
      var path = _pathCache[ci];
      if (!path || path.length < 2) continue;
      for (var si = 1; si < path.length; si++) allSegs.push({ ci: ci, x1: path[si - 1].x, y1: path[si - 1].y, x2: path[si].x, y2: path[si].y });
    }
    for (var i = 0; i < allSegs.length; i++) {
      for (var j = i + 1; j < allSegs.length; j++) {
        var a = allSegs[i], b = allSegs[j];
        if (a.ci === b.ci) continue;
        var aH = Math.abs(a.y1 - a.y2) < 1, aV = Math.abs(a.x1 - a.x2) < 1;
        var bH = Math.abs(b.y1 - b.y2) < 1, bV = Math.abs(b.x1 - b.x2) < 1;
        if (aH && bV) {
          var ix = b.x1, iy = a.y1;
          if (ix > Math.min(a.x1, a.x2) + 2 && ix < Math.max(a.x1, a.x2) - 2 && iy > Math.min(b.y1, b.y2) + 2 && iy < Math.max(b.y1, b.y2) - 2) crossings.push({ x: ix, y: iy });
        } else if (aV && bH) {
          var ix2 = a.x1, iy2 = b.y1;
          if (ix2 > Math.min(b.x1, b.x2) + 2 && ix2 < Math.max(b.x1, b.x2) - 2 && iy2 > Math.min(a.y1, a.y2) + 2 && iy2 < Math.max(a.y1, a.y2) - 2) crossings.push({ x: ix2, y: iy2 });
        }
      }
    }
    return crossings;
  }

  function drawCrossings() {
    var crossings = _crossingsCache;
    if (!crossings || crossings.length === 0) return;
    ctx.save();
    var R = 5;
    for (var i = 0; i < crossings.length; i++) {
      var cr = crossings[i];
      ctx.fillStyle = '#0a0e14';
      ctx.fillRect(cr.x - R, cr.y - R, R * 2, R * 2);
      ctx.strokeStyle = '#6a7a9a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cr.x, cr.y, R, Math.PI, 0, false);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── Drawing connections and particles ── */

  function drawConnection(conn, connIdx, isHovered, isSelected) {
    var path = _pathCache[connIdx] || getConnectionPath(conn);
    if (!path) return;

    var pressure = conn.pressure || 0;
    if (running && pressure > 1) ctx.strokeStyle = '#42a5f5';
    else if (running && pressure > 0) ctx.strokeStyle = '#6699cc';
    else ctx.strokeStyle = '#3a4a6a';
    var baseWidth = running ? 3 : 2;

    if (isSelected) { ctx.strokeStyle = '#00e5ff'; baseWidth = 4; }
    else if (isHovered && !running) { ctx.strokeStyle = '#5599cc'; baseWidth = 3; }

    ctx.lineWidth = baseWidth;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (var i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0,229,255,0.2)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (var j = 1; j < path.length; j++) ctx.lineTo(path[j].x, path[j].y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var conn = connections[p.connIdx];
      if (!conn || conn.pressure <= 0) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#64b5f6';
      ctx.fill();
    }
  }

  /* ── Component drawing ── */

  function drawComponent(comp) {
    var def = COMP_DEFS[comp.type];
    if (!def) return;
    var x = comp.x, y = comp.y;
    var isSelected = (selectedComp && selectedComp.id === comp.id);
    var ed = getEffectiveDims(comp);

    ctx.save();
    ctx.translate(x, y);

    if (isSelected) {
      ctx.strokeStyle = '#42a5f5';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(-4, -4, ed.w + 8, ed.h + 8);
      ctx.setLineDash([]);
    }

    if (comp.orient) {
      ctx.save();
      ctx.translate(def.h, 0);
      ctx.rotate(Math.PI / 2);
    }

    drawSymbol(comp, def);

    if (comp.orient) ctx.restore();

    /* Ports */
    var showPortLabels = isSelected || (hoveredCompId === comp.id) || (connectingFrom != null);
    for (var p = 0; p < def.ports.length; p++) {
      var port = getRotatedPort(def, p, comp.orient);
      var isHov = (hoveredPort && hoveredPort.compId === comp.id && hoveredPort.portIdx === p);
      var isConn = (connectingFrom && connectingFrom.compId === comp.id && connectingFrom.portIdx === p);
      var isExh = isExhaustPort(comp.type, port.label);
      ctx.beginPath();
      ctx.arc(port.x, port.y, isHov ? 6 : 4, 0, Math.PI * 2);
      if (isConn) {
        ctx.fillStyle = '#ff9900';                      /* orange: start of connection */
      } else if (isExh) {
        ctx.fillStyle = isHov ? '#ff8a80' : '#ef5350';  /* red: exhaust-to-atmosphere  */
      } else {
        ctx.fillStyle = isHov ? '#80d8ff' : '#42a5f5';  /* blue: normal working port   */
      }
      ctx.fill();
      ctx.strokeStyle = '#0a0e14';
      ctx.lineWidth = 1;
      ctx.stroke();

      /* Port label — show when component hovered, selected, or connecting */
      if (showPortLabels && port.label) {
        ctx.save();
        ctx.font = 'bold 8px ' + _fontFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        /* Position label offset from port based on direction */
        var lx = port.x, ly = port.y;
        var lDir = port.dir;
        if (lDir === 'up') { ly -= 10; }
        else if (lDir === 'down') { ly += 10; }
        else if (lDir === 'left') { lx -= 12; }
        else if (lDir === 'right') { lx += 12; }
        /* Background pill for readability */
        var tw = ctx.measureText(port.label).width + 6;
        ctx.fillStyle = 'rgba(10,14,20,0.85)';
        ctx.beginPath();
        ctx.roundRect(lx - tw / 2, ly - 6, tw, 12, 3);
        ctx.fill();
        ctx.fillStyle = isHov ? '#80d8ff' : '#00bcd4';
        ctx.fillText(port.label, lx, ly);
        ctx.restore();
      }
    }

    /* Label */
    ctx.fillStyle = '#8899bb';
    ctx.font = '9px ' + _fontFamily;
    ctx.textAlign = 'center';
    var labelText = def.name;
    if (comp.sName && isLimitSwitch(comp.type)) {
      labelText = comp.sName + ' (' + (comp.type === 'limit-nc' ? 'NC' : 'NO') + ')';
    }
    /* An active suction cup prints its holding force at h+9 / h+17, so drop the
       name clear of it instead of overprinting both lines. */
    var labelDy = (comp.type === 'suction-cup' && running && suctionCupActive(comp)) ? 28 : 14;
    ctx.fillText(labelText, ed.w / 2, ed.h + labelDy);

    ctx.restore();
  }

  /* ── Symbol dispatcher ── */

  function drawSymbol(comp, def) {
    var w = (comp.type === 'cyl-sa' || comp.type === 'cyl-da') ? getCylWidth(comp) : def.w;
    var h = def.h;
    var t = comp.type;

    if (t === 'air-supply') drawAirSupplySymbol(w, h, comp);
    else if (t === 'air-tank') drawAirTankSymbol(w, h, comp);
    else if (t === 'v22-push' || t === 'v22-nc') drawV22PushSymbol(w, h, comp);
    else if (t === 'filter') drawFilterSymbol(w, h);
    else if (t === 'regulator') drawRegulatorSymbol(w, h);
    else if (t === 'frl') drawFRLSymbol(w, h);
    else if (t.indexOf('v32') === 0) drawV32Symbol(w, h, comp);
    else if (t.indexOf('v52') === 0 || t.indexOf('v53') === 0) drawV52Symbol(w, h, comp);
    else if (t === 'v43-closed' || t === 'v43-exhaust' || t === 'v43-pilot-single' || t === 'v43-pilot-double') drawV43Symbol(w, h, comp);
    else if (t === 'flow-control') drawFlowCtrlSymbol(w, h);
    else if (t === 'throttle') drawThrottleSymbol(w, h, comp);
    else if (t === 'quick-exhaust') drawQuickExhaustSymbol(w, h);
    else if (t === 'relief') drawReliefSymbol(w, h, comp);
    else if (t === 'sequence-valve') drawSequenceSymbol(w, h, comp);
    else if (t === 'check') drawCheckSymbol(w, h, comp);
    else if (t === 'pilot-check') drawPilotCheckSymbol(w, h, comp);
    else if (t === 'shuttle') drawShuttleSymbol(w, h);
    else if (t === 'dual-pressure') drawANDSymbol(w, h);
    else if (t === 'cyl-sa') drawCylSASymbol(w, h, comp);
    else if (t === 'cyl-da') drawCylDASymbol(w, h, comp);
    else if (t === 'cyl-rodless') drawRodlessSymbol(w, h, comp);
    else if (t === 'rotary-act') drawRotarySymbol(w, h, comp);
    else if (t === 'venturi') drawVenturiSymbol(w, h, comp);
    else if (t === 'suction-cup') drawSuctionCupSymbol(w, h, comp);
    else if (t === 'timer-on') drawTimerOnSymbol(w, h, comp);
    else if (t === 'timer-off') drawTimerOffSymbol(w, h, comp);
    else if (t === 'gauge') drawGaugeSymbol(w, h, comp);
    else if (t === 'flow-meter') drawFlowMeterSymbol(w, h, comp);
    else if (t === 'proximity') drawProximitySymbol(w, h, comp);
    else if (t === 'limit-nc' || t === 'limit-no') drawLimitSwitchSymbol(w, h, comp);
    else if (t === 'silencer') drawSilencerSymbol(w, h);
    else if (t === 'tee') drawTeeSymbol(w, h);
    else drawGenericSymbol(w, h, def.name);
  }

  /* ── Individual symbol drawing functions ── */

  function drawAirSupplySymbol(w, h, comp) {
    var cx = w / 2;
    /* Compressor circle */
    ctx.beginPath();
    ctx.arc(cx, 20, 16, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2535';
    ctx.fill();
    ctx.strokeStyle = running ? '#42a5f5' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Triangle pointing up */
    ctx.beginPath();
    ctx.moveTo(cx, 8);
    ctx.lineTo(cx - 8, 28);
    ctx.lineTo(cx + 8, 28);
    ctx.closePath();
    ctx.fillStyle = running ? '#42a5f5' : '#5a8ab5';
    ctx.fill();
    /* Label */
    ctx.fillStyle = '#667799';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText((comp.values && comp.values.pressure || 6) + ' bar', cx, h - 10);
    ctx.textBaseline = 'alphabetic';
  }

  function drawAirTankSymbol(w, h, comp) {
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(4, 8, w - 8, h - 12, 8);
    ctx.fill();
    ctx.stroke();
    /* Stored-pressure fill level (receiver charge) */
    var tp = comp ? (comp._tankP || 0) : 0;
    if (tp > 0.1) {
      var frac = Math.min(1, tp / 10);
      var fillH = (h - 16) * frac;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(6, 10, w - 12, h - 16, 6);
      ctx.clip();
      ctx.fillStyle = comp && comp._discharging ? 'rgba(255,187,51,0.30)' : 'rgba(0,188,212,0.25)';
      ctx.fillRect(6, 10 + (h - 16) - fillH, w - 12, fillH);
      ctx.restore();
    }
    ctx.fillStyle = '#667799';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Tank', w / 2, h / 2 + 2);
    ctx.textBaseline = 'alphabetic';
    if (tp > 0.1) {
      ctx.fillStyle = comp && comp._discharging ? '#ffbb33' : '#3ddc84';
      ctx.font = 'bold 7px sans-serif';
      ctx.fillText(convVal(tp, 'bar').toFixed(1) + ' ' + uLabel('bar'), w / 2, h + 8);
    }
  }

  function drawV22PushSymbol(w, h, comp) {
    var cx = w / 2;
    var isOpen = (comp.values && comp.values.position === 'Open');
    var col = isOpen ? '#42a5f5' : '#5a8ab5';
    /* Box */
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(2, 6, w - 4, h - 12, 4);
    ctx.fill();
    ctx.stroke();
    /* Vertical line — in/out flow path */
    ctx.beginPath();
    ctx.moveTo(cx, h - 6);
    ctx.lineTo(cx, h / 2 + 4);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.lineTo(cx, h / 2 - 4);
    ctx.stroke();
    /* Gate (horizontal bar) — open or closed */
    if (!isOpen) {
      /* Closed: bar across blocking flow */
      ctx.beginPath();
      ctx.moveTo(cx - 10, h / 2);
      ctx.lineTo(cx + 10, h / 2);
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else {
      /* Open: bar rotated aside */
      ctx.beginPath();
      ctx.moveTo(cx + 4, h / 2 - 8);
      ctx.lineTo(cx + 12, h / 2 + 2);
      ctx.strokeStyle = '#66ff66';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    /* Push button actuator on left */
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(6, h / 2 - 5);
    ctx.lineTo(6, h / 2 + 5);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }

  function drawLimitSwitchSymbol(w, h, comp) {
    var cx = w / 2;
    var isNC = (comp.type === 'limit-nc');
    var pos = (comp.values && comp.values.position) || 'Normal';
    var isActuated = (pos === 'Actuated');
    var flowOpen = isNC ? isActuated : !isActuated;
    var col = flowOpen ? '#42a5f5' : '#5a8ab5';

    /* Valve body */
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(3, 8, w - 6, h - 16, 3);
    ctx.fill();
    ctx.stroke();

    /* Port stubs */
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, 8);
    ctx.moveTo(cx, h - 8); ctx.lineTo(cx, h);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Internal flow path */
    ctx.beginPath();
    ctx.moveTo(cx, h - 8);
    ctx.lineTo(cx, h / 2 + 3);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, 8);
    ctx.lineTo(cx, h / 2 - 3);
    ctx.stroke();

    /* Gate indicator */
    if (!flowOpen) {
      ctx.beginPath();
      ctx.moveTo(cx - 7, h / 2);
      ctx.lineTo(cx + 7, h / 2);
      ctx.strokeStyle = '#ff6666';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx + 2, h / 2 - 5);
      ctx.lineTo(cx + 8, h / 2 + 2);
      ctx.strokeStyle = '#66ff66';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    /* NC/NO label */
    ctx.fillStyle = '#556688';
    ctx.font = 'bold 6px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isNC ? 'NC' : 'NO', cx, h - 11);

    /* Roller lever on left side */
    ctx.strokeStyle = isActuated ? '#42a5f5' : '#667799';
    ctx.lineWidth = 1;
    if (isActuated) {
      ctx.beginPath();
      ctx.moveTo(3, h / 2);
      ctx.lineTo(-2, h / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-5, h / 2, 3, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(3, h / 2);
      ctx.lineTo(-1, h / 2);
      ctx.lineTo(-4, h / 2 + 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-4, h / 2 + 6, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawFilterSymbol(w, h) {
    var cx = w / 2;
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    /* Diamond shape */
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(w - 2, h / 2);
    ctx.lineTo(cx, h - 4);
    ctx.lineTo(2, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Dashed line inside */
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(6, h / 2);
    ctx.lineTo(w - 6, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawRegulatorSymbol(w, h) {
    var cx = w / 2;
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    /* Square with arrow */
    ctx.strokeRect(4, 6, w - 8, h - 12);
    ctx.fillRect(4, 6, w - 8, h - 12);
    /* Diagonal arrow */
    ctx.strokeStyle = '#42a5f5';
    ctx.beginPath();
    ctx.moveTo(8, h - 10);
    ctx.lineTo(w - 8, 10);
    ctx.stroke();
    /* Arrowhead */
    ctx.beginPath();
    ctx.moveTo(w - 8, 10);
    ctx.lineTo(w - 14, 12);
    ctx.lineTo(w - 10, 16);
    ctx.closePath();
    ctx.fillStyle = '#42a5f5';
    ctx.fill();
  }

  function drawFRLSymbol(w, h) {
    /* 3-section FRL */
    var sec = w / 3;
    for (var s = 0; s < 3; s++) {
      var sx = s * sec + 2;
      var sw = sec - 4;
      ctx.fillStyle = '#1a2535';
      ctx.strokeStyle = '#5a8ab5';
      ctx.lineWidth = 1;
      ctx.fillRect(sx, 4, sw, h - 8);
      ctx.strokeRect(sx, 4, sw, h - 8);
    }
    ctx.fillStyle = '#667799';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', sec * 0.5, h / 2);
    ctx.fillText('R', sec * 1.5, h / 2);
    ctx.fillText('L', sec * 2.5, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  /* ── ISO 1219 DCV drawing helpers ── */

  /* Draw an arrow line from (x1,y1) to (x2,y2) with arrowhead */
  function drawDCVArrow(x1, y1, x2, y2, col) {
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    /* Arrowhead */
    var angle = Math.atan2(y2 - y1, x2 - x1);
    var hs = 4;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hs * Math.cos(angle - 0.5), y2 - hs * Math.sin(angle - 0.5));
    ctx.lineTo(x2 - hs * Math.cos(angle + 0.5), y2 - hs * Math.sin(angle + 0.5));
    ctx.closePath();
    ctx.fill();
  }

  /* Draw a T-bar (blocked port) at position */
  function drawDCVBlock(x, y, vertical) {
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x - 4, y);
      ctx.lineTo(x + 4, y);
    } else {
      ctx.moveTo(x, y - 4);
      ctx.lineTo(x, y + 4);
    }
    ctx.stroke();
  }

  /* ── ISO 1219 Actuation Symbol Helpers ── */

  /* Solenoid coil: small rectangle with diagonal slash */
  function drawActSolenoid(bx, my, bw) {
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, my - 5, bw, 10);
    ctx.beginPath(); ctx.moveTo(bx, my - 5); ctx.lineTo(bx + bw, my + 5); ctx.stroke();
  }

  /* Spring return: vertical zigzag centred at (sx, my) */
  function drawActSpring(sx, my) {
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(sx, my - 6);
    for (var _ss = 0; _ss < 3; _ss++) {
      ctx.lineTo(sx + 4, my - 6 + _ss * 4 + 2);
      ctx.lineTo(sx - 4, my - 6 + _ss * 4 + 4);
    }
    ctx.stroke();
  }

  /* Pilot triangle: filled ▶ or ◀ pointing toward valve edge at px */
  function drawActPilot(px, my, fromLeft) {
    ctx.fillStyle = '#667799';
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (fromLeft) {
      ctx.moveTo(px - 8, my - 4); ctx.lineTo(px, my); ctx.lineTo(px - 8, my + 4);
    } else {
      ctx.moveTo(px + 8, my - 4); ctx.lineTo(px, my); ctx.lineTo(px + 8, my + 4);
    }
    ctx.closePath(); ctx.fill();
  }

  /* ── 3/2 Valve Symbol ── */
  function drawV32Symbol(w, h, comp) {
    var pos = (comp.values && comp.values.position) || 'Normal';
    var isActuated = (pos !== 'Normal');
    var envW = (w - 4) / 2;
    var top = 8, bot = h - 8;
    var midY = h / 2;
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    /* Draw envelopes */
    ctx.fillRect(2, top, envW, bot - top);
    ctx.strokeRect(2, top, envW, bot - top);
    ctx.fillRect(2 + envW, top, envW, bot - top);
    ctx.strokeRect(2 + envW, top, envW, bot - top);
    /* Highlight active */
    var activeX = isActuated ? 2 + envW : 2;
    ctx.fillStyle = 'rgba(66,165,245,0.15)';
    ctx.fillRect(activeX, top, envW, bot - top);

    var arrowCol = '#42a5f5';
    var dimCol = '#4a6080';
    var isNO32 = (comp.type === 'v32-push-no' || comp.type === 'v32-roller-no');

    var lx = 2, lcx = lx + envW / 2;
    var p1x = lcx - 6, p3x = lcx + 6, p2x = lcx;
    var rx = 2 + envW, rcx = rx + envW / 2;
    var p1xR = rcx - 6, p3xR = rcx + 6, p2xR = rcx;

    if (isNO32) {
      /* NO — Left envelope = Normal: 1→2 (flow), 3 blocked */
      drawDCVArrow(p1x, bot - 4, p2x, top + 4, isActuated ? dimCol : arrowCol); /* 1→2 */
      drawDCVBlock(p3x, bot - 4, true);
      /* NO — Right envelope = Actuated: 2→3 (exhaust), 1 blocked */
      drawDCVArrow(p2xR, top + 4, p3xR, bot - 4, isActuated ? arrowCol : dimCol); /* 2→3 */
      drawDCVBlock(p1xR, bot - 4, true);
    } else {
      /* NC — Left envelope = Normal: 2→3, 1 blocked */
      drawDCVArrow(p2x, top + 4, p3x, bot - 4, isActuated ? dimCol : arrowCol); /* 2→3 */
      drawDCVBlock(p1x, bot - 4, true);
      /* NC — Right envelope = Actuated: 1→2, 3 blocked */
      drawDCVArrow(p1xR, bot - 4, p2xR, top + 4, isActuated ? arrowCol : dimCol); /* 1→2 */
      drawDCVBlock(p3xR, bot - 4, true);
    }

    /* Spring symbol on right */
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - 2, midY - 6);
    for (var zz = 0; zz < 3; zz++) {
      ctx.lineTo(w + 2, midY - 6 + zz * 4 + 2);
      ctx.lineTo(w - 6, midY - 6 + zz * 4 + 4);
    }
    ctx.stroke();
    /* Actuation symbol on left — ISO 1219 graphical symbols */
    var t = comp.type;
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 1;
    if (t === 'v32-push') {
      /* Push button: flat cap on a stem */
      ctx.beginPath(); ctx.moveTo(2, midY); ctx.lineTo(-3, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, midY - 5); ctx.lineTo(-3, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, midY - 5); ctx.lineTo(1, midY - 5); ctx.stroke();
    } else if (t === 'v32-roller') {
      /* Roller lever: circle at end of angled arm */
      ctx.beginPath(); ctx.moveTo(2, midY); ctx.lineTo(-4, midY); ctx.lineTo(-7, midY + 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(-7, midY + 6, 3, 0, Math.PI * 2); ctx.stroke();
    } else if (t === 'v32-idle') {
      /* Idle-return (one-way roller): roller + directional wedge on arm */
      ctx.beginPath(); ctx.moveTo(2, midY); ctx.lineTo(-4, midY); ctx.lineTo(-7, midY + 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(-7, midY + 6, 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#667799';
      ctx.beginPath(); ctx.moveTo(-2, midY - 4); ctx.lineTo(1, midY); ctx.lineTo(-2, midY); ctx.closePath(); ctx.fill();
    } else if (t === 'v32-plunger') {
      /* Plunger: solid arrow + back plate */
      ctx.beginPath(); ctx.moveTo(-10, midY); ctx.lineTo(0, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-10, midY - 4); ctx.lineTo(-10, midY + 4); ctx.stroke();
      ctx.fillStyle = '#667799';
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(-4, midY - 3); ctx.lineTo(-4, midY + 3); ctx.closePath(); ctx.fill();
    } else if (t === 'v32-solenoid') {
      /* Solenoid coil: rectangle with diagonal slash */
      drawActSolenoid(-11, midY, 11);
    } else if (t === 'v32-pilot-nc') {
      /* Pilot-operated: filled triangle pointing into valve */
      drawActPilot(2, midY, true);
    } else if (t === 'v32-push-no') {
      /* Push button NO: same cap symbol as NC — actuation method is identical */
      ctx.beginPath(); ctx.moveTo(2, midY); ctx.lineTo(-3, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-3, midY - 5); ctx.lineTo(-3, midY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, midY - 5); ctx.lineTo(1, midY - 5); ctx.stroke();
    } else if (t === 'v32-roller-no') {
      /* Roller lever NO: same roller circle symbol as NC — actuation method is identical */
      ctx.beginPath(); ctx.moveTo(2, midY); ctx.lineTo(-4, midY); ctx.lineTo(-7, midY + 6); ctx.stroke();
      ctx.beginPath(); ctx.arc(-7, midY + 6, 3, 0, Math.PI * 2); ctx.stroke();
    }
    /* Port labels */
    ctx.fillStyle = '#556688';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1', 15, h - 2);
    ctx.fillText('3', 45, h - 2);
    ctx.fillText('2', 30, 5);
  }

  /* ── 5/2 and 5/3 Valve Symbol ── */
  function drawV52Symbol(w, h, comp) {
    var def = COMP_DEFS[comp.type];
    var numPos = def.ports.length >= 5 && comp.type.indexOf('v53') === 0 ? 3 : 2;
    var pos = (comp.values && comp.values.position) || (numPos === 3 ? 'Center' : 'Normal');
    var envW = (w - 4) / numPos;
    var top = 8, bot = h - 8;
    var arrowCol = '#42a5f5';
    var dimCol = '#4a6080';
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;

    for (var e = 0; e < numPos; e++) {
      ctx.fillRect(2 + e * envW, top, envW, bot - top);
      ctx.strokeRect(2 + e * envW, top, envW, bot - top);
    }

    /* Highlight active envelope */
    var activeIdx = 0;
    if (numPos === 3) {
      if (pos === 'Center') activeIdx = 1;
      else if (pos === 'Retract') activeIdx = 2;
    } else {
      if (pos === 'Energised' || pos === 'Position B') activeIdx = 1;
    }
    ctx.fillStyle = 'rgba(66,165,245,0.15)';
    ctx.fillRect(2 + activeIdx * envW, top, envW, bot - top);

    /* Draw internal arrows for each envelope */
    /* Port layout: bottom-left=3, bottom-center=1, bottom-right=5, top-left=2, top-right=4 */
    for (var ei = 0; ei < numPos; ei++) {
      var ex = 2 + ei * envW;
      var ecx = ex + envW / 2;
      var isActive = (ei === activeIdx);
      var ac = isActive ? arrowCol : dimCol;
      /* Port positions within envelope */
      var pBL = ecx - envW * 0.3; /* port 3 bottom-left */
      var pBC = ecx;               /* port 1 bottom-center */
      var pBR = ecx + envW * 0.3;  /* port 5 bottom-right */
      var pTL = ecx - envW * 0.3;  /* port 2 top-left */
      var pTR = ecx + envW * 0.3;  /* port 4 top-right */

      if (numPos === 2) {
        if (ei === 0) {
          /* Position A (Normal): 1→2, 4→5 */
          drawDCVArrow(pBC, bot - 4, pTL, top + 4, ac); /* 1→2 */
          drawDCVArrow(pTR, top + 4, pBR, bot - 4, ac); /* 4→5 */
          drawDCVBlock(pBL, bot - 4, true); /* 3 blocked */
        } else {
          /* Position B: 1→4, 2→3 */
          drawDCVArrow(pBC, bot - 4, pTR, top + 4, ac); /* 1→4 */
          drawDCVArrow(pTL, top + 4, pBL, bot - 4, ac); /* 2→3 */
          drawDCVBlock(pBR, bot - 4, true); /* 5 blocked */
        }
      } else {
        /* 5/3 valve */
        if (ei === 0) {
          /* Extend: 1→2, 4→5 */
          drawDCVArrow(pBC, bot - 4, pTL, top + 4, ac);
          drawDCVArrow(pTR, top + 4, pBR, bot - 4, ac);
          drawDCVBlock(pBL, bot - 4, true);
        } else if (ei === 1) {
          /* Center */
          if (comp.type === 'v53-exhaust') {
            /* Exhaust center: 2→3, 4→5, 1 blocked */
            drawDCVArrow(pTL, top + 4, pBL, bot - 4, ac);
            drawDCVArrow(pTR, top + 4, pBR, bot - 4, ac);
            drawDCVBlock(pBC, bot - 4, true);
          } else if (comp.type === 'v53-pilot-exhaust') {
            /* Pilot exhaust center: 2→3, 4→5, 1 blocked — pilot-operated variant */
            drawDCVArrow(pTL, top + 4, pBL, bot - 4, ac);
            drawDCVArrow(pTR, top + 4, pBR, bot - 4, ac);
            drawDCVBlock(pBC, bot - 4, true);
          } else if (comp.type === 'v53-pressure') {
            /* Pressure center: 1→2 and 1→4 (P feeds both A and B), exhausts blocked */
            drawDCVArrow(pBC, bot - 4, pTL, top + 4, ac); /* 1→2 */
            drawDCVArrow(pBC, bot - 4, pTR, top + 4, ac); /* 1→4 */
            drawDCVBlock(pBL, bot - 4, true); /* 3 blocked */
            drawDCVBlock(pBR, bot - 4, true); /* 5 blocked */
          } else {
            /* Closed center: all blocked */
            drawDCVBlock(pTL, top + 4, true);
            drawDCVBlock(pTR, top + 4, true);
            drawDCVBlock(pBC, bot - 4, true);
            drawDCVBlock(pBL, bot - 4, true);
            drawDCVBlock(pBR, bot - 4, true);
          }
        } else {
          /* Retract: 1→4, 2→3 */
          drawDCVArrow(pBC, bot - 4, pTR, top + 4, ac);
          drawDCVArrow(pTL, top + 4, pBL, bot - 4, ac);
          drawDCVBlock(pBR, bot - 4, true);
        }
      }
    }

    /* Port stub lines from envelope edge to component border */
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.2;
    var refX = numPos === 3 ? (2 + envW + envW / 2) : (2 + envW / 2);
    var sP1x = refX;
    var sP4x = refX - envW * 0.3;
    var sP2x = refX + envW * 0.3;
    var sP5x = sP4x;
    var sP3x = sP2x;
    /* Top stubs: port 4 and port 2 */
    ctx.beginPath(); ctx.moveTo(sP4x, top); ctx.lineTo(sP4x, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sP2x, top); ctx.lineTo(sP2x, 0); ctx.stroke();
    /* Bottom stubs: port 5, port 1, port 3 */
    ctx.beginPath(); ctx.moveTo(sP5x, bot); ctx.lineTo(sP5x, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sP1x, bot); ctx.lineTo(sP1x, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sP3x, bot); ctx.lineTo(sP3x, h); ctx.stroke();
    /* Side pilot port stubs (v52-pilot, v52-pilot-single, v53-pilot-closed) */
    var t52pre = comp.type;
    if (t52pre === 'v52-pilot' || t52pre === 'v53-pilot-closed' || t52pre === 'v53-pilot-exhaust') {
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(-8, h / 2); ctx.stroke(); /* port 12 left */
      ctx.beginPath(); ctx.moveTo(w, h / 2); ctx.lineTo(w + 8, h / 2); ctx.stroke(); /* port 14 right */
    } else if (t52pre === 'v52-pilot-single') {
      ctx.beginPath(); ctx.moveTo(w, h / 2); ctx.lineTo(w + 8, h / 2); ctx.stroke(); /* port 14 right only */
    }

    /* Actuation symbols — solenoid coils, springs, or pilot triangles */
    var t52 = comp.type;
    var midY52 = h / 2;
    if (t52 === 'v52-single') {
      drawActSolenoid(-12, midY52, 11); /* Left: solenoid */
      drawActSpring(w - 2, midY52);     /* Right: spring return */
    } else if (t52 === 'v52-double') {
      drawActSolenoid(-12, midY52, 11); /* Left: solenoid A */
      drawActSolenoid(w + 1, midY52, 11); /* Right: solenoid B (bistable) */
    } else if (t52 === 'v52-pilot') {
      drawActPilot(2, midY52, true);    /* Left pilot triangle (port 12) */
      drawActPilot(w - 2, midY52, false); /* Right pilot triangle (port 14) */
    } else if (t52 === 'v52-pilot-single') {
      drawActSpring(2, midY52);         /* Left: spring return */
      drawActPilot(w - 2, midY52, false); /* Right: single pilot (port 14) */
    } else if (t52 === 'v53-pilot-closed') {
      /* 5/3 pilot spring-centred: pilot triangles + springs on both sides */
      drawActPilot(2, midY52, true);      /* Left pilot (port 12 → Retract) */
      drawActSpring(-12, midY52);         /* Left spring-centering */
      drawActPilot(w - 2, midY52, false); /* Right pilot (port 14 → Extend) */
      drawActSpring(w + 2, midY52);       /* Right spring-centering */
    } else if (t52 === 'v53-pilot-exhaust') {
      /* 5/3 pilot exhaust center: same actuation as pilot-closed (spring-centred + pilot triangles) */
      drawActPilot(2, midY52, true);      /* Left pilot (port 12 → Retract) */
      drawActSpring(-12, midY52);         /* Left spring-centering */
      drawActPilot(w - 2, midY52, false); /* Right pilot (port 14 → Extend) */
      drawActSpring(w + 2, midY52);       /* Right spring-centering */
    } else if (t52.indexOf('v53') === 0) {
      /* 5/3 solenoid spring-centred: solenoid coils + springs on both sides */
      drawActSolenoid(-12, midY52, 11);
      drawActSpring(-14, midY52);
      drawActSolenoid(w + 1, midY52, 11);
      drawActSpring(w + 3, midY52);
    }

    /* Port labels */
    ctx.fillStyle = '#556688';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('1', sP1x, h - 2);
    ctx.fillText('4', sP4x, 5);
    ctx.fillText('2', sP2x, 5);
    ctx.fillText('5', sP5x, h - 2);
    ctx.fillText('3', sP3x, h - 2);
  }

  /* ── 4/3 Valve Symbol ── */
  function drawV43Symbol(w, h, comp) {
    var pos = (comp.values && comp.values.position) || 'Center';
    var envW = (w - 4) / 3;
    var top = 8, bot = h - 8;
    var arrowCol = '#42a5f5';
    var dimCol = '#4a6080';
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;

    for (var e = 0; e < 3; e++) {
      ctx.fillRect(2 + e * envW, top, envW, bot - top);
      ctx.strokeRect(2 + e * envW, top, envW, bot - top);
    }

    /* Highlight active */
    var activeIdx = 1;
    if (pos === 'Extend') activeIdx = 0;
    else if (pos === 'Retract') activeIdx = 2;
    ctx.fillStyle = 'rgba(66,165,245,0.15)';
    ctx.fillRect(2 + activeIdx * envW, top, envW, bot - top);

    /* Draw internal arrows for each envelope */
    /* 4-port corner layout per ISO 1219:
       Top-left=A(2), Top-right=B(4), Bottom-left=P/IN(1), Bottom-right=T/OUT(3) */
    for (var ei = 0; ei < 3; ei++) {
      var ex = 2 + ei * envW;
      var ecx = ex + envW / 2;
      var isActive = (ei === activeIdx);
      var ac = isActive ? arrowCol : dimCol;
      var pBL = ecx - envW * 0.3; /* port 1 P/IN (bottom-left) */
      var pBR = ecx + envW * 0.3; /* port 3 T/OUT (bottom-right) */
      var pTL = ecx - envW * 0.3; /* port 2 A (top-left) */
      var pTR = ecx + envW * 0.3; /* port 4 B (top-right) */

      if (ei === 0) {
        /* Extend: P→A (parallel up-left), B→T (parallel down-right) */
        drawDCVArrow(pBL, bot - 4, pTL, top + 4, ac);
        drawDCVArrow(pTR, top + 4, pBR, bot - 4, ac);
      } else if (ei === 1) {
        /* Center */
        if (comp.type === 'v43-exhaust') {
          /* Exhaust center: A→T (crossing), B→T (parallel right), P blocked */
          drawDCVArrow(pTL, top + 4, pBR, bot - 4, ac); /* A→T */
          drawDCVArrow(pTR, top + 4, pBR, bot - 4, ac); /* B→T */
          drawDCVBlock(pBL, bot - 4, true);               /* P blocked */
        } else {
          /* Closed center: all 4 ports blocked */
          drawDCVBlock(pTL, top + 4, true);
          drawDCVBlock(pTR, top + 4, true);
          drawDCVBlock(pBL, bot - 4, true);
          drawDCVBlock(pBR, bot - 4, true);
        }
      } else {
        /* Retract: P→B (crossing), A→T (crossing) — forms X */
        drawDCVArrow(pBL, bot - 4, pTR, top + 4, ac);
        drawDCVArrow(pTL, top + 4, pBR, bot - 4, ac);
      }
    }

    /* Port stub lines from center envelope edge to component border */
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.2;
    var ctrX43 = 2 + envW + envW / 2;
    var pLx = ctrX43 - envW * 0.3;
    var pRx = ctrX43 + envW * 0.3;
    /* Top stubs: A and B */
    ctx.beginPath(); ctx.moveTo(pLx, top); ctx.lineTo(pLx, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pRx, top); ctx.lineTo(pRx, 0); ctx.stroke();
    /* Bottom stubs: P and T */
    ctx.beginPath(); ctx.moveTo(pLx, bot); ctx.lineTo(pLx, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pRx, bot); ctx.lineTo(pRx, h); ctx.stroke();

    /* Actuation symbols — vary by valve type */
    var midY43 = h / 2;
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 1;
    var vt43 = comp.type;

    /* Left spring (present on all 4/3 spring-centred types) */
    ctx.beginPath();
    ctx.moveTo(2, midY43 - 6);
    for (var zl = 0; zl < 3; zl++) {
      ctx.lineTo(-2, midY43 - 6 + zl * 4 + 2);
      ctx.lineTo(6,  midY43 - 6 + zl * 4 + 4);
    }
    ctx.stroke();
    /* Right spring (present on all 4/3 spring-centred types) */
    ctx.beginPath();
    ctx.moveTo(w - 2, midY43 - 6);
    for (var zr = 0; zr < 3; zr++) {
      ctx.lineTo(w + 2, midY43 - 6 + zr * 4 + 2);
      ctx.lineTo(w - 6, midY43 - 6 + zr * 4 + 4);
    }
    ctx.stroke();

    if (vt43 === 'v43-pilot-single') {
      /* Single pilot: pilot triangle on the LEFT (port 12 → 1→2 = extend),
         spring return on the right. ISO 5599: 12 selects the 1→2 flow path. */
      drawActPilot(2, midY43, true);
      /* Pilot port 12 stub line */
      ctx.strokeStyle = '#667799'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, midY43); ctx.lineTo(-8, midY43); ctx.stroke();
    } else if (vt43 === 'v43-pilot-double') {
      /* Double pilot: pilot triangle on each side */
      drawActPilot(2,     midY43, true);   /* port 12 — left  */
      drawActPilot(w - 2, midY43, false);  /* port 14 — right */
      /* Pilot port stub lines */
      ctx.strokeStyle = '#667799'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, midY43); ctx.lineTo(-8, midY43); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w, midY43); ctx.lineTo(w + 8, midY43); ctx.stroke();
    } else {
      /* v43-closed: solenoid coils on both sides */
      drawActSolenoid(-16, midY43, 11);
      drawActSolenoid(w + 5, midY43, 11);
    }

    /* Port labels — on center envelope */
    ctx.fillStyle = '#556688';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P', pLx, h - 2);
    ctx.fillText('A', pLx, 5);
    ctx.fillText('T', pRx, h - 2);
    ctx.fillText('B', pRx, 5);
  }

  function drawFlowCtrlSymbol(w, h) {
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 6, w - 8, h - 12);
    ctx.fillRect(4, 6, w - 8, h - 12);
    /* Arrow with restriction */
    ctx.strokeStyle = '#42a5f5';
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 8);
    ctx.lineTo(w / 2, 8);
    ctx.stroke();
    /* Check valve bypass */
    ctx.beginPath();
    ctx.moveTo(w / 2 - 6, h * 0.4);
    ctx.lineTo(w / 2 + 6, h * 0.4);
    ctx.stroke();
  }

  function drawThrottleSymbol(w, h, comp) {
    var opening = comp && comp.values ? (comp.values.opening || 50) : 50;
    var frac = Math.max(0.05, Math.min(1, opening / 100));
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    /* Restriction symbol — the opening between the two chevrons varies with `opening` */
    var gap = 2 + frac * 6; /* visible aperture in px */
    ctx.beginPath();
    ctx.moveTo(4, h / 2 - 8);
    ctx.lineTo(w / 2, h / 2 - gap);
    ctx.moveTo(w - 4, h / 2 - 8);
    ctx.lineTo(w / 2, h / 2 - gap);
    ctx.moveTo(4, h / 2 + 8);
    ctx.lineTo(w / 2, h / 2 + gap);
    ctx.moveTo(w - 4, h / 2 + 8);
    ctx.lineTo(w / 2, h / 2 + gap);
    ctx.stroke();
    /* Adjustable arrow — diagonal through the restriction */
    ctx.strokeStyle = '#42a5f5';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, 4);
    ctx.lineTo(w / 2 + 10, h - 4);
    ctx.stroke();
    /* Arrowhead at top */
    ctx.fillStyle = '#42a5f5';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 10, 4);
    ctx.lineTo(w / 2 - 6, 6);
    ctx.lineTo(w / 2 - 8, 9);
    ctx.closePath();
    ctx.fill();
    /* Opening percentage text */
    ctx.fillStyle = '#667799';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(opening) + '%', w / 2, h - 1);
  }

  function drawQuickExhaustSymbol(w, h) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2535';
    ctx.fill();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#667799';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('QE', w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function drawReliefSymbol(w, h, comp) {
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 6, w - 8, h - 12);
    ctx.fillRect(4, 6, w - 8, h - 12);
    /* Spring + arrow */
    ctx.strokeStyle = (running && comp._reliefActive) ? '#ff6644' : '#42a5f5';
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 8);
    ctx.lineTo(w / 2, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 4, 12);
    ctx.lineTo(w / 2, 8);
    ctx.lineTo(w / 2 + 4, 12);
    ctx.stroke();
  }

  function drawSequenceSymbol(w, h, comp) {
    var isOpen = !!(running && comp && comp._sequenceOpen);
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 6, w - 8, h - 12);
    ctx.fillRect(4, 6, w - 8, h - 12);
    /* Internal flow line — bright green when open, dim blue when closed */
    ctx.strokeStyle = isOpen ? '#66bb6a' : '#3b5a80';
    ctx.lineWidth = isOpen ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2, h - 8);
    ctx.lineTo(w / 2, 8);
    ctx.stroke();
    /* Arrowhead on top (flow direction when open) */
    if (isOpen) {
      ctx.fillStyle = '#66bb6a';
      ctx.beginPath();
      ctx.moveTo(w / 2, 8);
      ctx.lineTo(w / 2 - 3, 13);
      ctx.lineTo(w / 2 + 3, 13);
      ctx.closePath();
      ctx.fill();
    }
    /* Spring tick on the right-hand side — ISO sequence valve marker */
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w - 8, h / 2 - 4);
    ctx.lineTo(w - 4, h / 2 - 1);
    ctx.lineTo(w - 8, h / 2 + 2);
    ctx.lineTo(w - 4, h / 2 + 5);
    ctx.stroke();
    /* Label */
    ctx.fillStyle = isOpen ? '#aed581' : '#667799';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SEQ', w / 2 - 4, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function drawCheckSymbol(w, h, comp) {
    var cx = w / 2, cy = h / 2;
    /* Active when forward pressure is present (supply reached port 1 output side) */
    var isActive = !!(running && comp && (comp._localPressure || 0) > 0.5);
    ctx.strokeStyle = isActive ? '#66bb6a' : '#5a8ab5';
    ctx.lineWidth = isActive ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 6);
    ctx.lineTo(cx, cy - 6);
    ctx.lineTo(cx + 8, cy + 6);
    ctx.closePath();
    ctx.fillStyle = isActive ? 'rgba(102,187,106,0.25)' : '#1a2535';
    ctx.fill();
    ctx.stroke();
    /* Seat bar */
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 6);
    ctx.lineTo(cx + 8, cy - 6);
    ctx.stroke();
    /* Flow arrow when active */
    if (isActive) {
      ctx.strokeStyle = '#66bb6a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, h - 4);
      ctx.lineTo(cx, cy + 4);
      ctx.stroke();
      ctx.fillStyle = '#66bb6a';
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx - 3, cy - 5);
      ctx.lineTo(cx + 3, cy - 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  /* Pilot-operated check valve — ISO 1219: the cone/seat check symbol sits
     inside a dashed enclosure with a dashed pilot line running out to pilot port 12.
     Pressure on 12 acting over the larger pilot piston (3:1 to 5:1 area ratio)
     lifts the cone off its seat so air can flow back 2 → 1. */
  function drawPilotCheckSymbol(w, h, comp) {
    var cx = w / 2 - 4, cy = h / 2;
    var pilotOn = !!(running && comp && (comp._pilotPressure || 0) > 0.2 &&
      (comp._pilotPressure || 0) >= (comp._pilotNeeded || 0));
    /* Dashed enclosure */
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.rect(2, 4, w - 12, h - 8);
    ctx.stroke();
    ctx.setLineDash([]);
    /* Port stubs */
    ctx.beginPath();
    ctx.moveTo(cx, h); ctx.lineTo(cx, cy + 6);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - 6);
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    /* Cone (check element) — lifted aside while the pilot holds it open */
    ctx.strokeStyle = pilotOn ? '#66bb6a' : '#5a8ab5';
    ctx.lineWidth = pilotOn ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 6);
    ctx.lineTo(cx, cy - 5);
    ctx.lineTo(cx + 7, cy + 6);
    ctx.closePath();
    ctx.fillStyle = pilotOn ? 'rgba(102,187,106,0.25)' : '#1a2535';
    ctx.fill();
    ctx.stroke();
    /* Seat bar */
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 5);
    ctx.lineTo(cx + 7, cy - 5);
    ctx.stroke();
    /* Dashed pilot line out to port Z */
    ctx.strokeStyle = pilotOn ? '#66bb6a' : '#ffbb33';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(cx + 7, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    ctx.setLineDash([]);
    /* Pilot port label */
    ctx.fillStyle = pilotOn ? '#66bb6a' : '#ffbb33';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('12', w - 6, cy - 3);
  }

  function drawShuttleSymbol(w, h) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2535';
    ctx.fill();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#42a5f5';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OR', w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function drawANDSymbol(w, h) {
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 2, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2535';
    ctx.fill();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('AND', w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function drawCylSASymbol(w, h, comp) {
    var bodyH = 36, barrelW = 62, capW = 18;
    var rodH = 12, rodY = Math.floor((bodyH - rodH) / 2);
    var pistonMin = capW + 3, pistonMax = barrelW - 5;
    var ext = comp.extension || 0;
    var px = Math.round(pistonMin + (pistonMax - pistonMin) * ext);
    var portAX = Math.floor(capW / 2);
    var rodTip = Math.round((barrelW + 3) + (w - 4 - (barrelW + 3)) * ext);

    /* 1. Dark barrel background */
    ctx.fillStyle = '#0d1625';
    ctx.fillRect(1, 1, barrelW - 2, bodyH - 2);

    /* 2. Air fill (cap side) */
    if (running && ext > 0.02) {
      ctx.fillStyle = 'rgba(68,136,255,0.22)';
      ctx.fillRect(2, 1, px - 2, bodyH - 2);
    }

    /* 3. Spring on rod-side of piston (inside barrel only) */
    var spLeft = px + 3, spRight = barrelW - 3;
    if (spRight > spLeft + 10) {
      var spMidY = bodyH / 2, spAmp = 5, spSegs = 5;
      ctx.beginPath();
      ctx.strokeStyle = '#5577aa';
      ctx.lineWidth = 1;
      ctx.moveTo(spLeft, spMidY);
      for (var ss = 0; ss < spSegs; ss++) {
        var sx1 = spLeft + (spRight - spLeft) * (ss + 0.5) / spSegs;
        var sx2 = spLeft + (spRight - spLeft) * (ss + 1) / spSegs;
        ctx.lineTo(sx1, spMidY + (ss % 2 === 0 ? spAmp : -spAmp));
        ctx.lineTo(sx2, spMidY);
      }
      ctx.stroke();
    }

    /* 4. Rod rectangle: piston to dynamic tip (protrudes outside barrel) */
    ctx.fillStyle = '#2a3a50';
    ctx.fillRect(px, rodY, rodTip - px, rodH);
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, rodY, rodTip - px, rodH);

    /* 5. Barrel outline drawn OVER fill and inner rod section */
    ctx.beginPath();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, 0);      ctx.lineTo(barrelW, 0);
    ctx.moveTo(0, 0);      ctx.lineTo(0, bodyH);
    ctx.moveTo(0, bodyH);  ctx.lineTo(barrelW, bodyH);
    ctx.moveTo(barrelW, 0); ctx.lineTo(barrelW, rodY - 1);
    ctx.moveTo(barrelW, rodY + rodH + 1); ctx.lineTo(barrelW, bodyH);
    ctx.stroke();

    /* 6. Thick cap-end wall */
    ctx.beginPath();
    ctx.strokeStyle = '#7a9ac5';
    ctx.lineWidth = 3;
    ctx.moveTo(1.5, 0); ctx.lineTo(1.5, bodyH);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#5a8ab5';

    /* 7. Cap section divider */
    ctx.beginPath();
    ctx.moveTo(capW, 0); ctx.lineTo(capW, bodyH);
    ctx.stroke();

    /* 8. Piston (cyan vertical bar) */
    ctx.beginPath();
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 2.5;
    ctx.moveTo(px, 2); ctx.lineTo(px, bodyH - 2);
    ctx.stroke();

    /* 9. Port A stub */
    ctx.beginPath();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.moveTo(portAX, bodyH); ctx.lineTo(portAX, h);
    ctx.stroke();
  }

  function drawCylDASymbol(w, h, comp) {
    var bodyH = 36, barrelW = 64, capW = 19;
    var rodH = 13, rodY = Math.floor((bodyH - rodH) / 2);
    var pistonMin = capW + 3, pistonMax = barrelW - 5;
    var ext = comp.extension || 0;
    var px = Math.round(pistonMin + (pistonMax - pistonMin) * ext);
    /* Port 2 sits in the blind (cap) chamber, port 4 at the rod end of the
       barrel — matching the ISO 1219 symbol and the force model. */
    var portAX = 8;   /* port 2 — cap / blind end */
    var portBX = 56;  /* port 4 — rod end */
    var rodTip = Math.round((barrelW + 3) + (w - 4 - (barrelW + 3)) * ext);

    /* 1. Dark barrel background */
    ctx.fillStyle = '#0d1625';
    ctx.fillRect(1, 1, barrelW - 2, bodyH - 2);

    /* 2. Air fill (cap side blue, rod side lighter blue) inside barrel */
    if (running) {
      ctx.fillStyle = 'rgba(68,136,255,0.28)';
      ctx.fillRect(2, 1, px - 2, bodyH - 2);
      ctx.fillStyle = 'rgba(68,200,255,0.18)';
      ctx.fillRect(px, 1, barrelW - px - 1, bodyH - 2);
    }

    /* 3. Rod rectangle: from piston to dynamic tip (protrudes outside barrel) */
    ctx.fillStyle = '#2a3a50';
    ctx.fillRect(px, rodY, rodTip - px, rodH);
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, rodY, rodTip - px, rodH);

    /* 4. Barrel outline drawn OVER fill and inner rod section */
    ctx.beginPath();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.moveTo(0, 0);       ctx.lineTo(barrelW, 0);
    ctx.moveTo(0, 0);       ctx.lineTo(0, bodyH);
    ctx.moveTo(0, bodyH);   ctx.lineTo(barrelW, bodyH);
    ctx.moveTo(barrelW, 0); ctx.lineTo(barrelW, rodY - 1);
    ctx.moveTo(barrelW, rodY + rodH + 1); ctx.lineTo(barrelW, bodyH);
    ctx.stroke();

    /* 5. Thick cap-end wall */
    ctx.beginPath();
    ctx.strokeStyle = '#7a9ac5';
    ctx.lineWidth = 3;
    ctx.moveTo(1.5, 0); ctx.lineTo(1.5, bodyH);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#5a8ab5';

    /* 6. Cap section divider */
    ctx.beginPath();
    ctx.moveTo(capW, 0); ctx.lineTo(capW, bodyH);
    ctx.stroke();

    /* 7. Piston (cyan vertical bar) */
    ctx.beginPath();
    ctx.strokeStyle = '#00bcd4';
    ctx.lineWidth = 2.5;
    ctx.moveTo(px, 2); ctx.lineTo(px, bodyH - 2);
    ctx.stroke();

    /* 8. Port stubs */
    ctx.beginPath();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.moveTo(portAX, bodyH); ctx.lineTo(portAX, h);
    ctx.moveTo(portBX, bodyH); ctx.lineTo(portBX, h);
    ctx.stroke();
  }

  function drawRodlessSymbol(w, h, comp) {
    var ext = (comp.extension || 0);
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillRect(4, 4, w - 8, h - 8);
    /* Carriage */
    var cX = 8 + ext * (w - 24);
    ctx.fillStyle = running ? '#42a5f5' : '#4a6a8a';
    ctx.fillRect(cX, 2, 8, h - 4);
  }

  function drawRotarySymbol(w, h, comp) {
    var cx = w / 2, cy = h / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(w, h) / 2 - 3, 0, Math.PI * 2);
    ctx.fillStyle = '#1a2535';
    ctx.fill();
    ctx.strokeStyle = running ? '#42a5f5' : '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.stroke();
    /* Rotation arrow */
    var angle = (comp.rotation || 0);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = running ? '#42a5f5' : '#4a6a8a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, -0.5, Math.PI + 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(10, -1);
    ctx.lineTo(5, -2);
    ctx.fillStyle = running ? '#42a5f5' : '#4a6a8a';
    ctx.fill();
    ctx.restore();
  }

  /* ── Limit-switch ruler/marker overlay on linked cylinders ── */

  function drawLimitSwitchRulers() {
    var cylMap = {};
    for (var i = 0; i < components.length; i++) {
      var ls = components[i];
      if (!isLimitSwitch(ls.type)) continue;
      var cid = ls.values.triggerCyl;
      if (!cid) continue;
      if (!cylMap[cid]) cylMap[cid] = [];
      cylMap[cid].push(ls);
    }

    for (var cylId in cylMap) {
      var cyl = findComp(parseInt(cylId, 10));
      if (!cyl) continue;
      var def = COMP_DEFS[cyl.type];
      if (!def) continue;
      var switches = cylMap[cylId];

      var cylW = (cyl.type === 'cyl-sa' || cyl.type === 'cyl-da' || cyl.type === 'cyl-rodless') ? getCylWidth(cyl) : def.w;
      var barrelW, pistonMin, pistonMax;
      if (cyl.type === 'cyl-da') { barrelW = 64; pistonMin = 22; pistonMax = 59; }
      else if (cyl.type === 'cyl-sa') { barrelW = 62; pistonMin = 21; pistonMax = 57; }
      else { barrelW = cylW - 8; pistonMin = 8; pistonMax = barrelW - 8; }

      var rulerH = 14;
      var rulerGap = 4;
      var rulerY = -rulerH - rulerGap;
      var rulerX = 0;
      var rulerW = barrelW;

      ctx.save();
      ctx.translate(cyl.x, cyl.y);
      if (cyl.orient === 1) {
        ctx.translate(def.h, 0);
        ctx.rotate(Math.PI / 2);
      }

      /* Ruler background */
      ctx.fillStyle = 'rgba(20, 35, 55, 0.92)';
      ctx.strokeStyle = '#3a5a7a';
      ctx.lineWidth = 1;
      ctx.fillRect(rulerX, rulerY, rulerW, rulerH);
      ctx.strokeRect(rulerX, rulerY, rulerW, rulerH);

      /* Tick marks */
      var tickRange = pistonMax - pistonMin;
      ctx.strokeStyle = '#4a6a8a';
      ctx.lineWidth = 0.5;
      ctx.fillStyle = '#5a7a9a';
      ctx.font = '5px ' + _fontFamily;
      ctx.textAlign = 'center';
      for (var pct = 0; pct <= 100; pct += 10) {
        var tx = pistonMin + tickRange * (pct / 100);
        var tickH = (pct % 50 === 0) ? rulerH - 2 : (pct % 25 === 0) ? rulerH * 0.6 : rulerH * 0.35;
        ctx.beginPath();
        ctx.moveTo(tx, rulerY + rulerH);
        ctx.lineTo(tx, rulerY + rulerH - tickH);
        ctx.stroke();
        if (pct % 50 === 0) {
          ctx.fillText(pct + '', tx, rulerY + 5);
        }
      }

      /* Marker triangles for each linked limit switch — sort by position */
      switches.sort(function (a, b) { return (a.values.triggerAt || 95) - (b.values.triggerAt || 95); });
      var prevMx = -999;
      for (var si = 0; si < switches.length; si++) {
        var sw = switches[si];
        var trigPct = (sw.values.triggerAt || 95) / 100;
        var mx = pistonMin + tickRange * trigPct;
        var isActuated = sw.values.position === 'Actuated';
        var markerColor = (sw.type === 'limit-nc') ? '#ff6666' : '#66ff66';
        if (isActuated && running) markerColor = '#ffcc00';

        /* Offset triangle horizontally if too close to previous marker */
        var offset = (Math.abs(mx - prevMx) < 8 && si > 0) ? 8 : 0;

        /* Triangle pointing down */
        ctx.beginPath();
        ctx.moveTo(mx + offset, rulerY + rulerH + 1);
        ctx.lineTo(mx + offset - 4, rulerY + rulerH - 5);
        ctx.lineTo(mx + offset + 4, rulerY + rulerH - 5);
        ctx.closePath();
        ctx.fillStyle = markerColor;
        ctx.fill();

        /* S-name label above triangle */
        ctx.fillStyle = markerColor;
        ctx.font = 'bold 7px ' + _fontFamily;
        ctx.textAlign = 'center';
        ctx.fillText(sw.sName || '?', mx + offset, rulerY + 4);

        prevMx = mx + offset;
      }

      ctx.restore();
    }
  }

  function drawVenturiSymbol(w, h, comp) {
    var isActive = !!(running && comp && comp._vacuumActive);
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = isActive ? '#66bb6a' : '#5a8ab5';
    ctx.lineWidth = isActive ? 2 : 1.5;
    /* Converging-diverging nozzle shape */
    ctx.beginPath();
    ctx.moveTo(4, 8);
    ctx.lineTo(w / 2 - 4, h / 2 - 2);
    ctx.lineTo(w - 4, 8);
    ctx.lineTo(w - 4, h - 8);
    ctx.lineTo(w / 2 - 4, h / 2 + 2);
    ctx.lineTo(4, h - 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Vacuum port indicator — green and labelled with level when active */
    ctx.fillStyle = isActive ? '#aed581' : '#667799';
    ctx.font = '6px sans-serif';
    ctx.textAlign = 'center';
    var lvl = comp && comp._vacuumLevel ? comp._vacuumLevel.toFixed(1) : '';
    ctx.fillText(isActive && lvl ? ('\u2193' + lvl) : 'VAC', w / 2, h - 2);
  }

  /* True if this suction cup is being driven by an active venturi */
  /* Vacuum level (bar) reaching this suction cup from a connected venturi — 0 if none */
  function suctionCupVacuum(comp) {
    if (!running) return 0;
    /* Suction cup has a single port (V) at idx 0 — walk to see if an active venturi is reachable */
    for (var ci = 0; ci < connections.length; ci++) {
      var cn = connections[ci];
      var other = null;
      if (cn.from.compId === comp.id && cn.from.portIdx === 0) other = findComp(cn.to.compId);
      else if (cn.to.compId === comp.id && cn.to.portIdx === 0) other = findComp(cn.from.compId);
      if (!other) continue;
      if (other.type === 'venturi' && other._vacuumActive) return other._vacuumLevel || 0.6;
      /* Allow passthrough via tee — walk one hop */
      if (other.type === 'tee') {
        for (var cj = 0; cj < connections.length; cj++) {
          var cn2 = connections[cj];
          var other2 = null;
          if (cn2.from.compId === other.id && cn2.to.compId !== comp.id) other2 = findComp(cn2.to.compId);
          else if (cn2.to.compId === other.id && cn2.from.compId !== comp.id) other2 = findComp(cn2.from.compId);
          if (other2 && other2.type === 'venturi' && other2._vacuumActive) return other2._vacuumLevel || 0.6;
        }
      }
    }
    return 0;
  }

  function suctionCupActive(comp) {
    return suctionCupVacuum(comp) > 0;
  }

  function drawSuctionCupSymbol(w, h, comp) {
    var isActive = suctionCupActive(comp);
    ctx.strokeStyle = isActive ? '#66bb6a' : '#5a8ab5';
    ctx.lineWidth = isActive ? 2 : 1.5;
    ctx.fillStyle = isActive ? 'rgba(102,187,106,0.18)' : '#1a2535';
    /* Cup shape — filled with tint when vacuum active */
    ctx.beginPath();
    ctx.moveTo(4, h);
    ctx.quadraticCurveTo(w / 2, h * 0.4, w - 4, h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Stem */
    ctx.strokeStyle = isActive ? '#66bb6a' : '#5a8ab5';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.6);
    ctx.lineTo(w / 2, 2);
    ctx.stroke();
    /* Small downward arrow when actively gripping */
    if (isActive) {
      ctx.fillStyle = '#aed581';
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.82);
      ctx.lineTo(w / 2 - 3, h * 0.74);
      ctx.lineTo(w / 2 + 3, h * 0.74);
      ctx.closePath();
      ctx.fill();
      /* Live holding force: F = p_vac × A_cup (matches the Practice-mode
         formula), shown alongside the value you may actually design to.
         Vacuum sizing practice applies a safety factor of 2 for a vertical
         lift and up to 4 for horizontal handling or porous workpieces —
         never size a cup on the theoretical force. */
      var scVac = suctionCupVacuum(comp);
      var scDia = (comp && comp.values && comp.values.diameter) || 40;
      var scF = scVac * 0.1 * Math.PI / 4 * scDia * scDia; /* N, theoretical */
      ctx.fillStyle = '#aed581';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(convVal(scF, 'N').toFixed(0) + ' ' + uLabel('N'), w / 2, h + 9);
      ctx.fillStyle = '#8fae6a';
      ctx.font = '6px sans-serif';
      ctx.fillText('SF2 ' + convVal(scF / 2, 'N').toFixed(0) + ' ' + uLabel('N'), w / 2, h + 17);
    }
  }

  function drawTimerOnSymbol(w, h, comp) {
    var bx = 4, by = 6, bw = w - 8, bh = h - 12;
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);
    /* Fill progress bar — rises from bottom as reservoir fills */
    if (comp && running) {
      var delay = (comp.values && comp.values.delay) || 3;
      var fill = Math.max(0, Math.min(1, (comp._timerFill || 0) / delay));
      if (fill > 0) {
        var fh = (bh - 4) * fill;
        ctx.fillStyle = fill >= 1 ? 'rgba(102,187,106,0.55)' : 'rgba(66,165,245,0.45)';
        ctx.fillRect(bx + 2, by + bh - 2 - fh, bw - 4, fh);
      }
    }
    ctx.fillStyle = '#80d8ff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T\u2191', w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function drawTimerOffSymbol(w, h, comp) {
    var bx = 4, by = 6, bw = w - 8, bh = h - 12;
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeRect(bx, by, bw, bh);
    /* Drain progress bar — shrinks from top as reservoir drains */
    if (comp && running) {
      var delayOff = (comp.values && comp.values.delay) || 3;
      var drainFrac = Math.max(0, Math.min(1, (comp._timerDrain || 0) / delayOff));
      if (drainFrac > 0) {
        var dh = (bh - 4) * drainFrac;
        ctx.fillStyle = 'rgba(66,165,245,0.45)';
        ctx.fillRect(bx + 2, by + bh - 2 - dh, bw - 4, dh);
      }
    }
    ctx.fillStyle = '#80d8ff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('T\u2193', w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  function drawGaugeSymbol(w, h, comp) {
    var cx = w / 2;
    var dialCY = 16;       /* dial centred in upper half */
    var radius = 13;
    /* Dial face */
    ctx.beginPath();
    ctx.arc(cx, dialCY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1625';
    ctx.fill();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    /* Tick marks at 0, 5, 10 bar */
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 0.8;
    var tickAngles = [-Math.PI * 0.75, -Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI * 0.75];
    for (var ti = 0; ti < tickAngles.length; ti++) {
      var ax = cx + Math.cos(tickAngles[ti] - Math.PI / 2) * (radius - 2);
      var ay = dialCY + Math.sin(tickAngles[ti] - Math.PI / 2) * (radius - 2);
      var bx = cx + Math.cos(tickAngles[ti] - Math.PI / 2) * (radius - 5);
      var by = dialCY + Math.sin(tickAngles[ti] - Math.PI / 2) * (radius - 5);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
    /* Needle — sweeps over a 270° arc, 0–10 bar full scale */
    var reading = comp ? (comp.reading || 0) : 0;
    var clamped = Math.max(0, Math.min(10, reading));
    var needleAngle = -Math.PI * 0.75 + (clamped / 10) * Math.PI * 1.5;
    ctx.save();
    ctx.translate(cx, dialCY);
    ctx.rotate(needleAngle);
    ctx.strokeStyle = running ? '#ff6644' : '#5a6a80';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(0, -(radius - 2));
    ctx.stroke();
    ctx.restore();
    /* Needle hub */
    ctx.beginPath();
    ctx.arc(cx, dialCY, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#5a8ab5';
    ctx.fill();
    /* Numeric reading + unit beneath the dial */
    var dispVal = convVal(reading, 'bar');
    var lbl = uLabel('bar');
    ctx.fillStyle = running && reading > 0.1 ? '#aed581' : '#667799';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dispVal.toFixed(1), cx, h - 13);
    ctx.font = '7px sans-serif';
    ctx.fillStyle = '#667799';
    ctx.fillText(lbl, cx, h - 4);
    ctx.textBaseline = 'alphabetic';
  }

  function drawFlowMeterSymbol(w, h, comp) {
    var cx = w / 2;
    var dialCY = 18;
    var radius = 14;
    /* Dial face */
    ctx.beginPath();
    ctx.arc(cx, dialCY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1625';
    ctx.fill();
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    /* Q label at top of dial */
    ctx.fillStyle = '#667799';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Q', cx, dialCY - 4);
    /* Reading value inside dial */
    var reading = comp ? (comp.reading || 0) : 0;
    var dispVal = convVal(reading, 'NL/min');
    var lbl = uLabel('NL/min');
    var active = running && reading > 0.5;
    ctx.fillStyle = active ? '#aed581' : '#5a8ab5';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(dispVal.toFixed(0), cx, dialCY + 5);
    /* Unit label below dial */
    ctx.fillStyle = '#667799';
    ctx.font = '7px sans-serif';
    ctx.fillText(lbl, cx, h - 14);
    /* Through-flow arrow when active */
    if (active) {
      ctx.strokeStyle = '#aed581';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, h - 4);
      ctx.lineTo(cx, h - 9);
      ctx.stroke();
      ctx.fillStyle = '#aed581';
      ctx.beginPath();
      ctx.moveTo(cx, h - 12);
      ctx.lineTo(cx - 3, h - 7);
      ctx.lineTo(cx + 3, h - 7);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#5a8ab5';
      ctx.font = '7px sans-serif';
      ctx.fillText('\u2014', cx, h - 5);
    }
    ctx.textBaseline = 'alphabetic';
  }

  function drawProximitySymbol(w, h, comp) {
    /* Read local pressure at the tap point. Sensor is "active" when the
       monitored line is pressurised above the configured threshold. */
    var pressure = comp ? (comp._localPressure || 0) : 0;
    var threshold = (comp && comp.values && comp.values.threshold) || 0.5;
    var isActive = !!(running && pressure >= threshold);
    if (comp) comp.reading = isActive ? 1 : 0;
    /* Body */
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = isActive ? '#66bb6a' : '#5a8ab5';
    ctx.lineWidth = isActive ? 2 : 1.5;
    ctx.fillRect(4, 4, w - 8, h - 8);
    ctx.strokeRect(4, 4, w - 8, h - 8);
    /* LED indicator at top */
    var ledX = w / 2, ledY = 14;
    ctx.beginPath();
    ctx.arc(ledX, ledY, 5, 0, Math.PI * 2);
    ctx.fillStyle = isActive ? '#66bb6a' : '#3a4a5a';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#aed581' : '#5a8ab5';
    ctx.lineWidth = 1;
    ctx.stroke();
    if (isActive) {
      /* Small glow */
      ctx.fillStyle = 'rgba(102,187,106,0.3)';
      ctx.beginPath();
      ctx.arc(ledX, ledY, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    /* Label */
    ctx.fillStyle = '#667799';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRX', w / 2, h - 17);
    /* State text */
    ctx.fillStyle = isActive ? '#aed581' : '#5a8ab5';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(isActive ? 'ON' : 'OFF', w / 2, h - 7);
    ctx.textBaseline = 'alphabetic';
  }

  function drawSilencerSymbol(w, h) {
    ctx.fillStyle = '#3a4a5a';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1;
    /* Muffler shape */
    ctx.beginPath();
    ctx.moveTo(w / 2, 4);
    ctx.lineTo(w - 2, h * 0.4);
    ctx.lineTo(w - 2, h);
    ctx.lineTo(2, h);
    ctx.lineTo(2, h * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    /* Horizontal lines (indicating porous material) */
    ctx.strokeStyle = '#667799';
    ctx.lineWidth = 0.5;
    for (var sl = 0; sl < 3; sl++) {
      var sy = h * 0.5 + sl * 5;
      ctx.beginPath();
      ctx.moveTo(4, sy);
      ctx.lineTo(w - 4, sy);
      ctx.stroke();
    }
  }

  function drawTeeSymbol(w, h) {
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h / 2);
    ctx.lineTo(0, h / 2);
    ctx.moveTo(w / 2, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#42a5f5';
    ctx.fill();
  }

  function drawGenericSymbol(w, h, name) {
    ctx.fillStyle = '#1a2535';
    ctx.strokeStyle = '#5a8ab5';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#667799';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.substring(0, 6), w / 2, h / 2);
    ctx.textBaseline = 'alphabetic';
  }

  /* ================================================================
     HIT TESTING
     ================================================================ */

  function hitTestComponent(mx, my) {
    for (var i = components.length - 1; i >= 0; i--) {
      var comp = components[i];
      var ed = getEffectiveDims(comp);
      if (mx >= comp.x && mx <= comp.x + ed.w && my >= comp.y && my <= comp.y + ed.h) return comp;
    }
    return null;
  }

  /* ── Hit-test which position box of a DCV was clicked ── */
  function hitTestDCVBox(comp, mx, my) {
    var def = COMP_DEFS[comp.type];
    if (!def) return null;
    var t = comp.type;
    var w = def.w, h = def.h;
    var lx = mx - comp.x, ly = my - comp.y;
    /* Only within the envelope area (y: 8 to h-8) */
    if (ly < 8 || ly > h - 8) return null;

    if (t.indexOf('v53') === 0 || t === 'v43-closed') {
      /* 3-position valve: left=Extend, center=Center, right=Retract */
      var envW = (w - 4) / 3;
      if (lx < 2 + envW) return 'Extend';
      if (lx < 2 + envW * 2) return 'Center';
      return 'Retract';
    }
    if (t.indexOf('v52') === 0) {
      /* 2-position 5/2 valve: left=Position A, right=Position B */
      var envW2 = (w - 4) / 2;
      var opts = def.params.position.options;
      if (lx < 2 + envW2) return opts[0]; /* Normal/Position A */
      return opts[1]; /* Energised/Position B */
    }
    if (t.indexOf('v32') === 0) {
      /* 2-position 3/2 valve: left=Normal, right=Actuated */
      var envW3 = (w - 4) / 2;
      var opts3 = def.params.position.options;
      if (lx < 2 + envW3) return opts3[0]; /* Normal */
      return opts3[1]; /* Pressed/Actuated/Energised */
    }
    if (t === 'v22-push' || t === 'v22-nc') {
      return comp.values.position === 'Open' ? 'Closed' : 'Open';
    }
    return null;
  }

  /* Hit-target sizes — multiplied by ~1.6× on coarse-pointer (touch) devices
     so iPad users can target ports and segments without precise finger placement. */
  function _touchScale() { return IS_COARSE_POINTER ? 1.6 : 1; }

  function hitTestPort(mx, my, threshold) {
    threshold = (threshold || 12) * _touchScale();
    for (var i = components.length - 1; i >= 0; i--) {
      var comp = components[i];
      var def = COMP_DEFS[comp.type];
      for (var p = 0; p < def.ports.length; p++) {
        var port = getRotatedPort(def, p, comp.orient);
        var px = comp.x + port.x, py = comp.y + port.y;
        var dx = mx - px, dy = my - py;
        if (dx * dx + dy * dy < threshold * threshold) return { compId: comp.id, portIdx: p };
      }
    }
    return null;
  }

  function hitTestConnection(mx, my, threshold) {
    threshold = (threshold || 6) * _touchScale();
    for (var i = connections.length - 1; i >= 0; i--) {
      var path = _pathCache[i] || getConnectionPath(connections[i]);
      if (!path) continue;
      for (var s = 1; s < path.length; s++) {
        if (pointToSegmentDist(mx, my, path[s - 1].x, path[s - 1].y, path[s].x, path[s].y) < threshold) return i;
      }
    }
    return -1;
  }

  function hitTestSegment(mx, my, threshold) {
    threshold = (threshold || 8) * _touchScale();
    for (var i = connections.length - 1; i >= 0; i--) {
      var path = _pathCache[i];
      if (!path || path.length < 4) continue;
      for (var s = 2; s < path.length - 1; s++) {
        var a = path[s - 1], b = path[s];
        var isH = Math.abs(a.y - b.y) < 1, isV = Math.abs(a.x - b.x) < 1;
        if (!isH && !isV) continue;
        if (Math.abs(isH ? (b.x - a.x) : (b.y - a.y)) < 5) continue;
        if (pointToSegmentDist(mx, my, a.x, a.y, b.x, b.y) < threshold) return { connIdx: i, segIdx: s, axis: isH ? 'y' : 'x' };
      }
    }
    return null;
  }

  /* Convert auto-routed connection to explicit waypoints for segment dragging */
  function convertToWaypoints(connIdx) {
    var conn = connections[connIdx];
    if (conn.waypoints && conn.waypoints.length > 0) return;
    var path = _pathCache[connIdx];
    if (!path || path.length < 4) return;
    /* Extract middle points: skip [0]=port, [1]=stub, [last-1]=stub, [last]=port */
    conn.waypoints = [];
    for (var i = 2; i < path.length - 2; i++) {
      conn.waypoints.push({ x: path[i].x, y: path[i].y });
    }
    delete conn._dragOffset;
    delete conn._autoNudge;
  }

  /* ================================================================
     UNDO SYSTEM
     ================================================================ */

  var redoStack = [];

  /* ── Annotation state (F1-F24) ── */
  var annTool = 'move';         /* 'move' | 'sketch' | 'shape' */
  var annStrokes = [];           /* freehand: [{points:[{wx,wy,p}], color, width, rotation}] */
  var annShapes = [];            /* shapes: [{type, wx1, wy1, wx2, wy2, color, width, filled, rotation, text?}] */
  var annActiveStroke = null;
  var annActiveShape = null;
  var sketchColor = '#ffffff';
  var sketchWidth = 2;
  var shapeType = 'rect';
  var shapeColor = '#ffffff';
  var shapeWidth = 2;
  var shapeFilled = false;
  var annSelectedIdx = -1;
  var annSelectedType = '';       /* 'shape' | 'stroke' | '' */
  var annDrag = null;             /* {type, idx, lastX, lastY, corner} */
  var showAnnotations = true;
  var annCursorPos = null;
  var lockIconPositions = false;
  var selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };

  /* Zoom/pan state for canvas (F24) */
  var viewOffX = 0, viewOffY = 0, viewScale = 1;
  var isPanning = false, panStartX = 0, panStartY = 0, panOffX0 = 0, panOffY0 = 0;
  var panMode = false; /* When true, drag-to-pan without Ctrl */
  var annConsumed = false; /* flag: annotation handler consumed this pointer event */
  var PENCIL_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3Cpath d='M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3C/svg%3E\") 2 22, crosshair";

  function captureSnapshot() {
    return {
      components: JSON.parse(JSON.stringify(components.map(function (c) {
        return { id: c.id, type: c.type, x: c.x, y: c.y, values: c.values, orient: c.orient, extension: 0, rotation: 0, reading: 0, sName: c.sName || null };
      }))),
      connections: JSON.parse(JSON.stringify(connections.map(function (cn) {
        return { from: cn.from, to: cn.to, waypoints: cn.waypoints, pressure: 0, flow: 0, flowDir: 0 };
      }))),
      nextId: nextId,
      annStrokes: JSON.parse(JSON.stringify(annStrokes)),
      annShapes: JSON.parse(JSON.stringify(annShapes))
    };
  }

  function saveUndoState() {
    undoStack.push(captureSnapshot());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  function performUndo() {
    if (undoStack.length === 0) return;
    redoStack.push(captureSnapshot());
    var snap = undoStack.pop();
    restoreSnapshot(snap);
  }

  function performRedo() {
    if (redoStack.length === 0) return;
    undoStack.push(captureSnapshot());
    var snap = redoStack.pop();
    restoreSnapshot(snap);
  }

  function restoreSnapshot(snap) {
    components = snap.components;
    connections = snap.connections;
    nextId = snap.nextId;
    if (snap.annStrokes) annStrokes = snap.annStrokes;
    if (snap.annShapes) annShapes = snap.annShapes;
    annActiveStroke = null;
    annActiveShape = null;
    annSelectedIdx = -1;
    annSelectedType = '';
    annDrag = null;
    selectedComp = null;
    selectedConn = -1;
    connectingFrom = null;
    particles = [];
    if (running) computeCircuit();
    draw();
  }

  /* ================================================================
     UNIT SYSTEM — SI ↔ Imperial (display only, internal stays SI)
     ================================================================ */
  var unitSystem = 'si'; // 'si' or 'imperial'

  var UNIT_CONV = {
    bar:   { imp: 'psi',    factor: 14.504 },
    N:     { imp: 'lbf',    factor: 0.2248 },
    /* Compressed AIR flow in imperial practice is scfm (standard ft³/min),
       never gal/min — that is a liquid unit. 1 NL = 0.03531 ft³. */
    'NL/min': { imp: 'scfm', factor: 0.03531 },
    'NL/cycle': { imp: 'ft³/cycle', factor: 0.03531 },
    'mm/s': { imp: 'in/s',  factor: 0.03937 }
  };

  function convVal(val, siUnit) {
    if (unitSystem === 'si' || !UNIT_CONV[siUnit]) return val;
    return val * UNIT_CONV[siUnit].factor;
  }

  function uLabel(siUnit) {
    if (unitSystem === 'si' || !UNIT_CONV[siUnit]) return siUnit;
    return UNIT_CONV[siUnit].imp;
  }

  function initUnitToggle() {
    var btnSI = document.getElementById('unit-si');
    var btnImp = document.getElementById('unit-imp');
    if (!btnSI || !btnImp) return;

    function activate(sys) {
      unitSystem = sys;
      btnSI.classList.toggle('active', sys === 'si');
      btnImp.classList.toggle('active', sys === 'imperial');
      updateReadoutUnits();
    }

    btnSI.addEventListener('click', function () { activate('si'); });
    btnImp.addEventListener('click', function () { activate('imperial'); });
  }

  function updateReadoutUnits() {
    var unitSpans = document.querySelectorAll('.readout-unit');
    var siUnits = ['bar', 'NL/min', 'NL/cycle', 'N', 'mm/s', '', ''];
    unitSpans.forEach(function (span, i) {
      if (siUnits[i]) span.textContent = ' ' + uLabel(siUnits[i]);
    });
    /* Re-run compute to update displayed values */
    if (running) computeCircuit();
  }

  /* ================================================================
     EXPORT PNG
     ================================================================ */
  function exportPNG() {
    var wasRunning = running;
    if (wasRunning) { running = false; }
    draw();
    drawWatermark();
    var link = document.createElement('a');
    link.download = 'pneumatic-circuit.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    draw();
    if (wasRunning) { running = true; }
  }

  /* ================================================================
     HINT BANNER (auto-dismiss on first interaction)
     ================================================================ */
  function initHint() {
    var banner = document.getElementById('hint-banner');
    var dismiss = document.getElementById('hint-dismiss');
    if (!banner) return;

    /* Check if already dismissed */
    if (localStorage.getItem('pneumatic-hint-dismissed') === '1') {
      banner.style.display = 'none';
      return;
    }

    function closeBanner() {
      banner.style.display = 'none';
      localStorage.setItem('pneumatic-hint-dismissed', '1');
    }

    if (dismiss) dismiss.addEventListener('click', closeBanner);

    /* Auto-close on first meaningful interaction */
    function onFirstInteraction() {
      closeBanner();
      canvas.removeEventListener('pointerdown', onFirstInteraction);
      palette.removeEventListener('click', onFirstInteraction);
    }
    var palette = document.getElementById('palette');
    canvas.addEventListener('pointerdown', onFirstInteraction);
    if (palette) palette.addEventListener('click', onFirstInteraction);
  }

  /* ================================================================
     SMART COMPONENT PLACEMENT
     ================================================================ */

  function findFreeSpot(def) {
    var pad = 30, step = 100, margin = 20;
    for (var sy = margin; sy + def.h < H - margin; sy += step) {
      for (var sx = margin; sx + def.w < W - margin; sx += step) {
        var cx = Math.round(sx / 20) * 20;
        var cy = Math.round(sy / 20) * 20;
        var overlap = false;
        for (var i = 0; i < components.length; i++) {
          var ed = getEffectiveDims(components[i]);
          if (cx < components[i].x + ed.w + pad && cx + def.w + pad > components[i].x &&
              cy < components[i].y + ed.h + pad && cy + def.h + pad > components[i].y) {
            overlap = true; break;
          }
        }
        if (!overlap) return { x: cx, y: cy };
      }
    }
    return { x: Math.round((W / 2 - def.w / 2 + components.length * 30) / 20) * 20, y: Math.round((H / 2 - def.h / 2 + components.length * 30) / 20) * 20 };
  }

  function addComponent(type) {
    var def = COMP_DEFS[type];
    if (!def) return;
    saveUndoState();
    var pos = findFreeSpot(def);
    var vals = {};
    for (var k in def.params) vals[k] = def.params[k].def;
    var comp = { id: nextId++, type: type, x: pos.x, y: pos.y, orient: 0, values: vals, extension: 0, rotation: 0, reading: 0 };
    if (isLimitSwitch(type)) comp.sName = getNextSName();
    components.push(comp);
    selectedComp = comp;
    updateProperties();
    draw();
  }

  /* ================================================================
     PROPERTIES PANEL
     ================================================================ */

  function updateProperties() {
    if (!selectedComp) {
      propsPanel.style.display = 'none';
      return;
    }
    var def = COMP_DEFS[selectedComp.type];
    if (!def || !def.params || Object.keys(def.params).length === 0) {
      propsPanel.style.display = 'none';
      return;
    }
    propsPanel.style.display = '';
    propsBody.innerHTML = '';
    for (var k in def.params) {
      var p = def.params[k];
      var val = selectedComp.values[k];
      var label = document.createElement('label');
      if (p.type === 'cylSelect') {
        label.textContent = p.label;
        var sel = document.createElement('select');
        var noneOpt = document.createElement('option');
        noneOpt.value = '0'; noneOpt.textContent = '— None —';
        if (!val || val === 0) noneOpt.selected = true;
        sel.appendChild(noneOpt);
        for (var ci = 0; ci < components.length; ci++) {
          var cc = components[ci];
          if (cc.type !== 'cyl-da' && cc.type !== 'cyl-sa' && cc.type !== 'cyl-rodless') continue;
          var opt = document.createElement('option');
          opt.value = String(cc.id);
          var cylLabel = (cc.type === 'cyl-da' ? 'Double-Act' : cc.type === 'cyl-sa' ? 'Single-Act' : 'Rodless');
          opt.textContent = cylLabel + ' #' + cc.id + ' (' + (cc.values.stroke || 150) + 'mm)';
          if (cc.id === val) opt.selected = true;
          var linked = countLimitSwitchesForCyl(cc.id, selectedComp.id);
          if (linked >= 2 && cc.id !== val) { opt.disabled = true; opt.textContent += ' [2/2]'; }
          sel.appendChild(opt);
        }
        (function (key, select) {
          select.addEventListener('change', function () {
            selectedComp.values[key] = parseInt(select.value, 10) || 0;
            if (running) computeCircuit();
            draw();
            updateProperties();
          });
        })(k, sel);
        label.appendChild(sel);
      } else if (p.type === 'select') {
        label.textContent = p.label;
        var sel = document.createElement('select');
        for (var o = 0; o < p.options.length; o++) {
          var opt = document.createElement('option');
          opt.value = p.options[o];
          opt.textContent = p.options[o];
          if (p.options[o] === val) opt.selected = true;
          sel.appendChild(opt);
        }
        (function (key, select) {
          select.addEventListener('change', function () {
            selectedComp.values[key] = select.value;
            if (running) computeCircuit();
            draw();
          });
        })(k, sel);
        label.appendChild(sel);
      } else {
        var span = document.createElement('span');
        span.className = 'prop-val';
        var dispVal = val;
        if (k === 'triggerAt' && isLimitSwitch(selectedComp.type)) {
          var linkedCyl = findComp(selectedComp.values.triggerCyl || 0);
          var strokeMm = linkedCyl ? (linkedCyl.values.stroke || 150) : 0;
          dispVal = val + '% ' + (strokeMm ? '(' + Math.round(strokeMm * val / 100) + ' mm)' : '');
        }
        span.textContent = p.label + ': ' + dispVal;
        label.appendChild(span);
        var range = document.createElement('input');
        range.type = 'range';
        range.min = p.min;
        range.max = p.max;
        range.step = p.step;
        range.value = val;
        /* Editable number input paired with the slider — exact value entry */
        var num = document.createElement('input');
        num.type = 'number';
        num.className = 'props-num';
        num.setAttribute('inputmode', 'decimal');
        num.min = p.min;
        num.max = p.max;
        num.step = p.step;
        num.value = val;
        num.setAttribute('aria-label', p.label);
        (function (key, rng, sp, param, numEl) {
          function refreshLabel(v) {
            var dv = v;
            if (key === 'triggerAt' && isLimitSwitch(selectedComp.type)) {
              var lc = findComp(selectedComp.values.triggerCyl || 0);
              var sm = lc ? (lc.values.stroke || 150) : 0;
              dv = v + '% ' + (sm ? '(' + Math.round(sm * v / 100) + ' mm)' : '');
            }
            sp.textContent = param.label + ': ' + dv;
          }
          rng.addEventListener('input', function () {
            var v = parseFloat(rng.value);
            selectedComp.values[key] = v;
            numEl.value = v;
            refreshLabel(v);
            if (running) computeCircuit();
            draw();
          });
          function commitNum() {
            var v = parseFloat(numEl.value);
            if (isNaN(v)) { numEl.value = selectedComp.values[key]; return; }
            v = Math.min(param.max, Math.max(param.min, v));
            numEl.value = v;
            selectedComp.values[key] = v;
            rng.value = v;
            refreshLabel(v);
            if (running) computeCircuit();
            draw();
          }
          numEl.addEventListener('focus', function () { saveUndoState(); });
          numEl.addEventListener('change', commitNum);
          numEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { commitNum(); numEl.blur(); } });
        })(k, range, span, p, num);
        label.appendChild(range);
        label.appendChild(num);
      }
      propsBody.appendChild(label);
    }
  }

  /* ================================================================
     SIMULATION ENGINE — Pneumatic BFS
     ================================================================ */

  function buildAdjacency() {
    var adj = {};
    for (var i = 0; i < connections.length; i++) {
      var cn = connections[i];
      var fId = cn.from.compId, tId = cn.to.compId;
      if (!adj[fId]) adj[fId] = [];
      if (!adj[tId]) adj[tId] = [];
      adj[fId].push({ conn: cn, connIdx: i, otherCompId: tId, otherPort: cn.to.portIdx, myPort: cn.from.portIdx });
      adj[tId].push({ conn: cn, connIdx: i, otherCompId: fId, otherPort: cn.from.portIdx, myPort: cn.to.portIdx });
    }
    return adj;
  }

  /* ================================================================
     ACTUATOR PHYSICS HELPERS
     ================================================================ */

  /* Mechanical efficiency of a pneumatic cylinder (piston + rod seal friction
     and guide losses). FESTO/SMC sizing data puts this at 0.85–0.90, so the
     usable force is always LESS than the textbook p × A. Every force number in
     the tool — the readout, the stall test and the load ratio — uses it. */
  var CYL_ETA = 0.85;

  /* Recommended maximum load ratio for pneumatic sizing (FESTO/SMC teach
     50–70 %: size the bore so the load never exceeds this share of the
     available force, leaving margin for acceleration and pressure dips). */
  var LOAD_RATIO_MAX = 70;

  /* Progressive single-acting return spring, F(x) = F0 + k·x.
     Catalogue springs (FESTO ADVU / SMC CJ2) develop roughly 12 % of the
     6-bar theoretical force at rest and about 20 % fully compressed —
     never the bore-independent constant a flat +50 N would imply. */
  function saSpringForce(cyl) {
    var b = (cyl && cyl.values && cyl.values.bore) || 40;
    var aMm2 = Math.PI / 4 * b * b;
    var fRated = 6 * 0.1 * aMm2;                     /* N at 6 bar */
    var x = Math.max(0, Math.min(1, cyl.extension || 0));
    return fRated * (0.12 + 0.08 * x);
  }

  /* Highest pressure currently on a given port of a component. */
  function portPressure(compId, portIdx) {
    var pv = 0;
    for (var i = 0; i < connections.length; i++) {
      var cn = connections[i];
      if ((cn.to.compId === compId && cn.to.portIdx === portIdx) ||
          (cn.from.compId === compId && cn.from.portIdx === portIdx)) pv = Math.max(pv, cn.pressure);
    }
    return pv;
  }

  /* Real elapsed frame time (s) — used by the receiver model so tank
     charge/discharge is frame-rate independent. */
  var _lastDt = 1 / 60;

  function computeCircuit() {
    /* Reset all */
    for (var i = 0; i < connections.length; i++) {
      connections[i].pressure = 0;
      connections[i].flow = 0;
      connections[i].flowDir = 0;
    }
    for (var c = 0; c < components.length; c++) {
      components[c]._localPressure = 0;
      components[c]._localFlow = 0;
      components[c]._extending = false;
      components[c]._retracting = false;
      components[c]._stalled = false;
      components[c]._springStalled = false;
      components[c]._bothFed = false;
      /* _trapped is set by animate() AFTER computeCircuit, so it is cleared
         there (one frame of lag) rather than here — clearing it now would
         make the status bar never see it. */
      components[c]._exhaustCenter = false;
      components[c]._exhausting = false;
      components[c]._vacuumActive = false;
      components[c]._vacuumLevel = 0;
      components[c]._discharging = false;
      /* _reliefActive, _sequenceOpen and _tankP carry state across frames — don't reset here */
    }

    var adj = buildAdjacency();

    /* Find ALL air supplies (multi-supply circuits) */
    var supplies = [];
    for (var s = 0; s < components.length; s++) {
      if (components[s].type === 'air-supply') supplies.push(components[s]);
    }

    /* Air tank (receiver) reserve: a charged tank keeps the circuit alive as a
       pressure source when no compressor is present (e.g. supply deleted while
       running) — the receiver's real job. Charging happens after the BFS below. */
    _tankReserveActive = false;
    var tankSources = [];
    if (supplies.length === 0) {
      for (var tk = 0; tk < components.length; tk++) {
        var tkc = components[tk];
        if (tkc.type === 'air-tank' && (tkc._tankP || 0) > 0.5) tankSources.push(tkc);
      }
      if (tankSources.length === 0) {
        /* No compressor and no stored air: show a dead system, not stale values */
        if (running) {
          var _dp = document.getElementById('r-pressure'), _df = document.getElementById('r-flow'),
              _dfo = document.getElementById('r-force'), _dsp = document.getElementById('r-speed'),
              _dst = document.getElementById('r-status');
          if (_dp) _dp.textContent = '0.0';
          if (_df) _df.textContent = '0';
          if (_dfo) _dfo.textContent = '0';
          if (_dsp) _dsp.textContent = '0';
          if (_dst) { _dst.textContent = 'No air supply'; _dst.style.color = '#ff6666'; }
        }
        return;
      }
      _tankReserveActive = true;
    }

    var supplyPressure = supplies.length ? (supplies[0].values.pressure || 6) : tankSources[0]._tankP;
    var supplyFlow = supplies.length ? (supplies[0].values.flow || 200)
      : Math.min(200, ((tankSources[0].values && tankSources[0].values.volume) || 50) * 3);

    /* Compressor sag: if the air the moving actuators drew last frame exceeds
       the compressor's flow capacity, the supply pressure droops (you can't get
       full pressure and full flow from an undersized compressor). Sagging the
       SOURCE pressure keeps the gauges and readout consistent. Teaches CFM
       sizing: add a second cylinder or a bigger bore and watch pressure fall. */
    _compressorSag = false;
    if (supplies.length && supplyFlow > 0 && _lastAirDemand > supplyFlow) {
      var sag = Math.max(0.4, supplyFlow / _lastAirDemand);
      supplyPressure = supplyPressure * sag;
      _compressorSag = sag < 0.97;
    }

    /* ── Relief-valve pressure CLAMP (ISO 4414 over-pressure protection) ──
       A cracked relief valve does not merely open a vent path: it dumps the
       surplus air to atmosphere and therefore HOLDS the line at its setting.
       An 8 bar relief on a 10 bar supply must show 8 bar on the gauge.
       We model this by solving the network, checking whether any relief has
       cracked, and — if so — re-solving with every source clamped to the
       lowest cracked setting. Two outer iterations are enough to settle. */
    var _pressureCap = Infinity;

    for (var _clampIter = 0; _clampIter < 3; _clampIter++) {

    /* Convergence BFS — run up to 3 passes so multi-input components
       (AND valve, shuttle valve) see all input pressures.
       Connection pressures persist between passes (max-merged),
       so on pass 2+ the AND valve sees both inputs from pass 1. */
    for (var _bfsPass = 0; _bfsPass < 3; _bfsPass++) {
      var queue = [];
      for (var si = 0; si < supplies.length; si++) {
        var sup = supplies[si];
        var sp = Math.min(sup.values.pressure || 6, _pressureCap);
        var sf = sup.values.flow || 200;
        sup._localPressure = sp;
        sup._localFlow = sf;
        queue.push({ compId: sup.id, pressure: sp, flow: sf });
      }
      /* Discharging tanks act as BFS sources (no compressor present) */
      for (var ti = 0; ti < tankSources.length; ti++) {
        var tnk = tankSources[ti];
        var tFlow = Math.min(200, ((tnk.values && tnk.values.volume) || 50) * 3);
        var tnkP = Math.min(tnk._tankP, _pressureCap);
        tnk._localPressure = tnkP;
        tnk._localFlow = tFlow;
        tnk._discharging = true;
        queue.push({ compId: tnk.id, pressure: tnkP, flow: tFlow });
      }

      var visited = {};
      var passChanged = false;

      while (queue.length > 0) {
        var cur = queue.shift();
        var comp = findComp(cur.compId);
        if (!comp) continue;
        var links = adj[cur.compId] || [];

        for (var li = 0; li < links.length; li++) {
          var link = links[li];
          var other = findComp(link.otherCompId);
          if (!other) continue;

          var canPass = getPassthrough(comp, link.myPort, cur.pressure, cur.flow);
          if (!canPass.canFlow) continue;

          var outPressure = cur.pressure - (canPass.pressureDrop || 0);
          var outFlow = Math.min(cur.flow, canPass.flowLimit || cur.flow);
          if (outPressure < 0.1) continue;

          if (outPressure > link.conn.pressure + 0.01) {
            link.conn.pressure = outPressure;
            link.conn.flow = Math.max(link.conn.flow, outFlow);
            link.conn.flowDir = (link.conn.from.compId === cur.compId) ? 1 : -1;
            passChanged = true;
          }

          other._localPressure = Math.max(other._localPressure || 0, outPressure);
          other._localFlow = Math.max(other._localFlow || 0, outFlow);

          if (!visited[other.id] || outPressure > (visited[other.id] || 0) + 0.01) {
            visited[other.id] = Math.max(visited[other.id] || 0, outPressure);
            queue.push({ compId: other.id, pressure: outPressure, flow: outFlow });
          }
        }
      }

      if (!passChanged && _bfsPass > 0) break;
    }

      /* Did a relief valve crack? If so, clamp and re-solve. */
      var _newCap = Infinity;
      for (var _rv = 0; _rv < components.length; _rv++) {
        var _rvc = components[_rv];
        if (_rvc.type === 'relief' && _rvc._reliefActive) {
          _newCap = Math.min(_newCap, _rvc.values.setting || 8);
        }
      }
      if (!(_newCap < _pressureCap - 0.01)) break;
      _pressureCap = _newCap;
      /* Wipe the solved field (relief/sequence/tank state deliberately kept) */
      for (var _rz = 0; _rz < connections.length; _rz++) {
        connections[_rz].pressure = 0; connections[_rz].flow = 0; connections[_rz].flowDir = 0;
      }
      for (var _rz2 = 0; _rz2 < components.length; _rz2++) {
        components[_rz2]._localPressure = 0; components[_rz2]._localFlow = 0;
        components[_rz2]._exhaustCenter = false;
      }
    }

    /* The gauge/readout must show the clamped line pressure, not the compressor. */
    if (_pressureCap < supplyPressure) supplyPressure = _pressureCap;
    var _reliefClamped = (_pressureCap < Infinity);

    /* Second BFS pass — off-delay timers in drain mode act as virtual supplies.
       The 2-port timer-off uses its pilot input as the supply path. Once the
       pilot drops, the main BFS no longer reaches the timer, so the output
       would die immediately. To preserve the "stay-on for delay-after-pilot"
       behaviour, we re-inject the remembered supply pressure at the timer's
       output port (idx 1) and propagate forward. Connection pressures are
       max-merged so we never reduce a value the main BFS already set. */
    for (var ti2 = 0; ti2 < components.length; ti2++) {
      var todTimer = components[ti2];
      if (todTimer.type !== 'timer-off') continue;
      if (!(todTimer._timerDrain > 0) || !(todTimer._timerSupplyP > 0)) continue;

      var todQueue = [{ compId: todTimer.id, pressure: todTimer._timerSupplyP, flow: 80 }];
      var todVisited = {}; todVisited[todTimer.id] = true;

      while (todQueue.length > 0) {
        var todCur = todQueue.shift();
        var todComp = findComp(todCur.compId);
        if (!todComp) continue;
        var todLinks = adj[todCur.compId] || [];

        for (var todLi = 0; todLi < todLinks.length; todLi++) {
          var todLink = todLinks[todLi];
          /* For the source timer, only propagate from output port (idx 1).
             For all other components, use normal getPassthrough rules. */
          if (todCur.compId === todTimer.id && todLink.myPort !== 1) continue;

          var todOther = findComp(todLink.otherCompId);
          if (!todOther) continue;

          var todCanPass;
          if (todCur.compId === todTimer.id) {
            /* Force flow out of the timer's output port — it IS the source */
            todCanPass = { canFlow: true, pressureDrop: 0.1 };
          } else {
            todCanPass = getPassthrough(todComp, todLink.myPort, todCur.pressure, todCur.flow);
            if (!todCanPass.canFlow) continue;
          }

          var todOutP = todCur.pressure - (todCanPass.pressureDrop || 0);
          var todOutF = Math.min(todCur.flow, todCanPass.flowLimit || todCur.flow);
          if (todOutP < 0.1) continue;

          /* Max-merge with whatever the main BFS already wrote */
          if (todOutP > todLink.conn.pressure) {
            todLink.conn.pressure = todOutP;
            todLink.conn.flow = Math.max(todLink.conn.flow, todOutF);
            todLink.conn.flowDir = (todLink.conn.from.compId === todCur.compId) ? 1 : -1;
          }

          todOther._localPressure = Math.max(todOther._localPressure || 0, todOutP);
          todOther._localFlow = Math.max(todOther._localFlow || 0, todOutF);

          if (!todVisited[todOther.id]) {
            todVisited[todOther.id] = true;
            todQueue.push({ compId: todOther.id, pressure: todOutP, flow: todOutF });
          }
        }
      }
    }

    /* Auto-shift pilot-operated valves based on pilot port pressure */
    for (var pv = 0; pv < components.length; pv++) {
      var pvComp = components[pv];
      var pvType = pvComp.type;
      var pilotTypes = ['v52-pilot', 'v52-pilot-single', 'v32-pilot-nc', 'v53-pilot-closed', 'v53-pilot-exhaust', 'v43-pilot-single', 'v43-pilot-double'];
      if (pilotTypes.indexOf(pvType) === -1) continue;

      /* Helper: get max pressure on a given port index */
      var getPilotP = function(compId, portIdx) {
        var pval = 0;
        for (var pci = 0; pci < connections.length; pci++) {
          var pcn = connections[pci];
          if ((pcn.to.compId === compId && pcn.to.portIdx === portIdx) ||
              (pcn.from.compId === compId && pcn.from.portIdx === portIdx))
            pval = Math.max(pval, pcn.pressure);
        }
        return pval;
      };

      if (pvType === 'v52-pilot') {
        /* Ports: idx 5 = pilot 12, idx 6 = pilot 14 */
        var p12v = getPilotP(pvComp.id, 5);
        var p14v = getPilotP(pvComp.id, 6);
        if (p12v > 0.5 && p14v <= 0.5) pvComp.values.position = 'Position A';
        else if (p14v > 0.5 && p12v <= 0.5) pvComp.values.position = 'Position B';

      } else if (pvType === 'v52-pilot-single') {
        /* Ports: idx 5 = pilot 14. Spring returns to Normal when no signal. */
        var p14s = getPilotP(pvComp.id, 5);
        pvComp.values.position = (p14s > 0.5) ? 'Actuated' : 'Normal';

      } else if (pvType === 'v32-pilot-nc') {
        /* Ports: idx 3 = pilot 12. Spring returns to Normal (NC = blocked). */
        var p12r = getPilotP(pvComp.id, 3);
        pvComp.values.position = (p12r > 0.5) ? 'Actuated' : 'Normal';

      } else if (pvType === 'v53-pilot-closed') {
        /* ISO 5599-1: pilot 12 selects flow 1→2 (Extend); pilot 14 selects
           1→4 (Retract). Springs return the spool to Center. */
        var p12c = getPilotP(pvComp.id, 5);
        var p14c = getPilotP(pvComp.id, 6);
        if (p12c > 0.5 && p14c <= 0.5) pvComp.values.position = 'Extend';
        else if (p14c > 0.5 && p12c <= 0.5) pvComp.values.position = 'Retract';
        else pvComp.values.position = 'Center';

      } else if (pvType === 'v53-pilot-exhaust') {
        /* ISO 5599-1: pilot 12 → 1→2 (Extend); pilot 14 → 1→4 (Retract). */
        var p12pe = getPilotP(pvComp.id, 5);
        var p14pe = getPilotP(pvComp.id, 6);
        if (p12pe > 0.5 && p14pe <= 0.5) pvComp.values.position = 'Extend';
        else if (p14pe > 0.5 && p12pe <= 0.5) pvComp.values.position = 'Retract';
        else pvComp.values.position = 'Center';

      } else if (pvType === 'v43-pilot-single') {
        /* Port idx 4 = pilot 12 → 1→2 (Extend). Spring returns to Center. */
        var p12_43s = getPilotP(pvComp.id, 4);
        pvComp.values.position = (p12_43s > 0.5) ? 'Extend' : 'Center';

      } else if (pvType === 'v43-pilot-double') {
        /* Port idx 4 = pilot 12 (Extend), idx 5 = pilot 14 (Retract). Springs → Center. */
        var p12_43d = getPilotP(pvComp.id, 4);
        var p14_43d = getPilotP(pvComp.id, 5);
        if (p12_43d > 0.5 && p14_43d <= 0.5) pvComp.values.position = 'Extend';
        else if (p14_43d > 0.5 && p12_43d <= 0.5) pvComp.values.position = 'Retract';
        else pvComp.values.position = 'Center';
      }
    }

    /* Determine cylinder/actuator port pressures from connections and set extend flags */
    for (var ac2 = 0; ac2 < components.length; ac2++) {
      var cmp = components[ac2];
      var cType = cmp.type;
      if (cType === 'cyl-sa') {
        cmp._capPressure = 0;
        for (var ci2 = 0; ci2 < connections.length; ci2++) {
          var cn2 = connections[ci2];
          if ((cn2.from.compId === cmp.id && cn2.from.portIdx === 0) || (cn2.to.compId === cmp.id && cn2.to.portIdx === 0))
            cmp._capPressure = Math.max(cmp._capPressure, cn2.pressure);
        }
        /* Load check: the piston only moves when the EFFECTIVE force (η × p × A,
           η ≈ 0.85 for seal + guide friction) beats the applied load plus the
           progressive return spring. */
        var saBore = (cmp.values.bore || 40) / 1000;
        var saArea = Math.PI / 4 * saBore * saBore;
        var saSpring = saSpringForce(cmp);
        var saForce = CYL_ETA * (cmp._capPressure || 0) * 1e5 * saArea;
        var saLoad = (cmp.values.load || 0) + saSpring;
        cmp._stalled = (cmp._capPressure > 0.5) && (saForce < saLoad);
        cmp._extending = (cmp._capPressure > 0.5) && !cmp._stalled;
        cmp._netForce = saForce - saSpring;
        cmp._springForce = saSpring;
        /* Spring return only wins if it can also lift the load — a heavy load
           parks a single-acting cylinder out at stroke. */
        cmp._springStalled = (cmp._capPressure <= 0.5) && (cmp.extension > 0) &&
                             (saSpring < (cmp.values.load || 0));
        if (cmp._springStalled) cmp._stalled = true;
      }
      if (cType === 'cyl-da' || cType === 'cyl-rodless') {
        cmp._capPressure = 0;
        cmp._rodPressure = 0;
        for (var ci3 = 0; ci3 < connections.length; ci3++) {
          var cn3 = connections[ci3];
          if ((cn3.from.compId === cmp.id && cn3.from.portIdx === 0) || (cn3.to.compId === cmp.id && cn3.to.portIdx === 0))
            cmp._capPressure = Math.max(cmp._capPressure, cn3.pressure);
          if ((cn3.from.compId === cmp.id && cn3.from.portIdx === 1) || (cn3.to.compId === cmp.id && cn3.to.portIdx === 1))
            cmp._rodPressure = Math.max(cmp._rodPressure, cn3.pressure);
        }
        /* Load check: net EFFECTIVE force in the demanded direction is the
           driving-side p × A minus the back-pressure on the opposite face,
           scaled by the mechanical efficiency η. Below the load the piston
           can't break away — it stalls where it stands. */
        var daBore = (cmp.values.bore || 50) / 1000;
        var daRod = (cmp.type === 'cyl-rodless') ? 0 : (cmp.values.rod || 20) / 1000;
        var daABore = Math.PI / 4 * daBore * daBore;
        var daAAnn = daABore - Math.PI / 4 * daRod * daRod;
        var daLoad = cmp.values.load || 0;
        var daExtForce = CYL_ETA * ((cmp._capPressure || 0) * 1e5 * daABore - (cmp._rodPressure || 0) * 1e5 * daAAnn);
        var daRetForce = CYL_ETA * ((cmp._rodPressure || 0) * 1e5 * daAAnn - (cmp._capPressure || 0) * 1e5 * daABore);
        /* Pressure-centre case: with supply on BOTH faces of a rod cylinder the
           net force is p × A_rod in the EXTEND direction (the rod steals area
           from the annulus), so the piston creeps out — it does not sit still. */
        var daBothFed = (cmp._capPressure > 0.5) && (cmp._rodPressure > 0.5) &&
                        Math.abs(cmp._capPressure - cmp._rodPressure) <= 0.3 && daAAnn < daABore - 1e-9;
        var wantExtend = (cmp._capPressure > cmp._rodPressure + 0.3) || daBothFed;
        var wantRetract = (cmp._rodPressure > cmp._capPressure + 0.3);
        cmp._stalled = (wantExtend && daExtForce < daLoad) || (wantRetract && daRetForce < daLoad);
        cmp._extending = wantExtend && !cmp._stalled;
        cmp._retracting = wantRetract && !cmp._stalled;
        cmp._bothFed = daBothFed;
        cmp._netForce = wantRetract ? daRetForce : daExtForce; /* exposed for readouts */
      }
      if (cType === 'rotary-act') {
        cmp._portAPressure = 0;
        cmp._portBPressure = 0;
        for (var ci4 = 0; ci4 < connections.length; ci4++) {
          var cn4 = connections[ci4];
          if ((cn4.from.compId === cmp.id && cn4.from.portIdx === 0) || (cn4.to.compId === cmp.id && cn4.to.portIdx === 0))
            cmp._portAPressure = Math.max(cmp._portAPressure, cn4.pressure);
          if ((cn4.from.compId === cmp.id && cn4.from.portIdx === 1) || (cn4.to.compId === cmp.id && cn4.to.portIdx === 1))
            cmp._portBPressure = Math.max(cmp._portBPressure, cn4.pressure);
        }
        cmp._extending = (cmp._portAPressure > cmp._portBPressure + 0.3);
      }
    }

    /* Detect exhaust center condition on actuators.
       In exhaust center, both cylinder ports vent to atmosphere — no holding force.
       Walk up to 2 hops from each cylinder port to find a connected valve with _exhaustCenter. */
    for (var eca = 0; eca < components.length; eca++) {
      var ecCmp = components[eca];
      if (ecCmp.type !== 'cyl-da' && ecCmp.type !== 'cyl-rodless' && ecCmp.type !== 'rotary-act') continue;
      var ecCapP = ecCmp._capPressure || ecCmp._portAPressure || 0;
      var ecRodP = ecCmp._rodPressure || ecCmp._portBPressure || 0;
      if (ecCapP > 0.3 || ecRodP > 0.3) continue;
      for (var eci = 0; eci < connections.length; eci++) {
        var ecn = connections[eci];
        var ecOtherId = null;
        if (ecn.from.compId === ecCmp.id) ecOtherId = ecn.to.compId;
        else if (ecn.to.compId === ecCmp.id) ecOtherId = ecn.from.compId;
        if (!ecOtherId) continue;
        var ecOther = findComp(ecOtherId);
        if (!ecOther) continue;
        if (ecOther._exhaustCenter) { ecCmp._exhausting = true; break; }
        for (var ecj = 0; ecj < connections.length; ecj++) {
          var ecn2 = connections[ecj];
          var ecO2Id = null;
          if (ecn2.from.compId === ecOther.id) ecO2Id = ecn2.to.compId;
          else if (ecn2.to.compId === ecOther.id) ecO2Id = ecn2.from.compId;
          if (!ecO2Id || ecO2Id === ecCmp.id) continue;
          var ecO2 = findComp(ecO2Id);
          if (ecO2 && ecO2._exhaustCenter) { ecCmp._exhausting = true; break; }
        }
        if (ecCmp._exhausting) break;
      }
    }

    /* Update measuring instruments */
    for (var g = 0; g < components.length; g++) {
      var gComp = components[g];
      if (gComp.type === 'gauge')      gComp.reading = gComp._localPressure || 0;
      if (gComp.type === 'flow-meter') gComp.reading = gComp._localFlow || 0;
      if (gComp.type === 'proximity') {
        var thr = (gComp.values && gComp.values.threshold) || 0.5;
        gComp.reading = ((gComp._localPressure || 0) >= thr) ? 1 : 0;
      }
    }

    /* Air tank (receiver) charge/discharge step — a real gas balance, not a
       per-frame nudge. For an isothermal receiver the gauge pressure moves by
       the normal volume exchanged divided by the tank volume:
            Δp [bar] = (Q [NL/min] / 60 × dt [s]) / V [L]
       so the rate is frame-rate independent and scales with actual demand:
       a small tank under heavy demand empties fast, a big one rides through. */
    var atDt = _lastDt || (1 / 60);
    for (var atk = 0; atk < components.length; atk++) {
      var at = components[atk];
      if (at.type !== 'air-tank') continue;
      if (at._tankP === undefined) at._tankP = 0;
      var atVol = (at.values && at.values.volume) || 50;
      if (at._discharging) {
        /* Reserve duty: bleeding at the circuit's live demand (min 10 NL/min
           to represent standing losses through valves and fittings). */
        var atQout = Math.max(10, _lastAirDemand || 0);
        at._tankP = Math.max(0, at._tankP - (atQout / 60 * atDt) / atVol);
      } else {
        var atLineP = at._localPressure || 0;
        if (atLineP > at._tankP) {
          /* Charging uses the compressor capacity left over after the
             actuators have taken their share. */
          var atQin = Math.max(10, (at._localFlow || 100) - (_lastAirDemand || 0));
          at._tankP = Math.min(atLineP, at._tankP + (atQin / 60 * atDt) / atVol);
        }
      }
    }

    /* Update readouts */
    var rPressure = document.getElementById('r-pressure');
    var rFlow = document.getElementById('r-flow');
    var rPower = document.getElementById('r-power');
    var rForce = document.getElementById('r-force');
    var rSpeed = document.getElementById('r-speed');
    var rLoadRatio = document.getElementById('r-loadratio');
    var rStatus = document.getElementById('r-status');

    rPressure.textContent = convVal(supplyPressure, 'bar').toFixed(1);
    rFlow.textContent = convVal(supplyFlow, 'NL/min').toFixed(0);

    /* Find first cylinder for force/speed readout */
    var firstCyl = null;
    for (var fc = 0; fc < components.length; fc++) {
      if (components[fc].type === 'cyl-da' || components[fc].type === 'cyl-sa') { firstCyl = components[fc]; break; }
    }
    if (firstCyl) {
      var bore = firstCyl.values.bore || 50;
      var rod = (firstCyl.type === 'cyl-sa') ? 0 : (firstCyl.values.rod || 0);
      var boreArea = Math.PI / 4 * bore * bore;
      var annArea = Math.PI / 4 * (bore * bore - rod * rod);
      var capP = firstCyl._capPressure || 0;
      var rodP = (firstCyl.type === 'cyl-sa') ? 0 : (firstCyl._rodPressure || 0);
      var isRetracting = !firstCyl._extending && firstCyl.type === 'cyl-da' && (rodP > capP + 0.3);
      /* NET EFFECTIVE force — the single force number in the tool. It nets the
         back-pressure on the opposite piston face and applies the mechanical
         efficiency, so it agrees exactly with the stall model above.
         (1 bar = 0.1 N/mm², hence the 0.1 factor.) */
      var force;
      if (firstCyl.type === 'cyl-sa') {
        force = CYL_ETA * capP * 0.1 * boreArea - saSpringForce(firstCyl);
      } else if (isRetracting) {
        force = CYL_ETA * (rodP * 0.1 * annArea - capP * 0.1 * boreArea);
      } else {
        force = CYL_ETA * (capP * 0.1 * boreArea - rodP * 0.1 * annArea);
      }
      if (force < 0) force = 0;
      rForce.textContent = convVal(force, 'N').toFixed(0);
      /* Load ratio — FESTO/SMC sizing rule: keep the load below ~70 % of the
         available force so the cylinder still accelerates and tolerates dips. */
      if (rLoadRatio) {
        var cylLoad = firstCyl.values.load || 0;
        if (force > 1) {
          var lr = cylLoad / force * 100;
          rLoadRatio.textContent = lr.toFixed(0);
          rLoadRatio.style.color = (lr > 100) ? '#ff6666' : (lr > LOAD_RATIO_MAX ? '#ffbb33' : '');
        } else {
          rLoadRatio.textContent = '—';
          rLoadRatio.style.color = '';
        }
      }
      /* Speed readout — read straight off the value the ANIMATION integrated
         this frame (cylinderSpeedMMS), so the displayed mm/s and the on-screen
         stroke can never disagree. */
      var speedVal = firstCyl._speedMMS || 0;
      rSpeed.textContent = convVal(speedVal, 'mm/s').toFixed(0);
    } else {
      rForce.textContent = '0';
      rSpeed.textContent = '0';
      if (rLoadRatio) { rLoadRatio.textContent = '—'; rLoadRatio.style.color = ''; }
    }

    /* Air consumption per CYCLE (the number you size a compressor with) plus
       the live flow demand that drives the compressor-sag model.
         V_N = (A_bore × L + A_ann × L) × (p_g + 1) / 1e6   [NL per cycle]
       A double-acting cylinder consumes on BOTH strokes, so the annulus volume
       counts too; a single-acting cylinder returns on its spring, so only the
       bore volume is charged. Demand scales with bore² of each MOVING actuator
       (nominal ~130 NL/min for an 80 mm bore) — two cylinders or one big bore
       exceed a 200 NL/min compressor and droop the supply next frame. */
    var totalConsumption = 0, airDemand = 0;
    for (var ac = 0; ac < components.length; ac++) {
      var acc = components[ac];
      if (acc.type !== 'cyl-da' && acc.type !== 'cyl-sa') continue;
      var b = acc.values.bore || 50;
      var rr = (acc.type === 'cyl-sa') ? 0 : (acc.values.rod || 0);
      var strk = acc.values.stroke || 150;
      var aBore = Math.PI / 4 * b * b;
      var aAnn = Math.PI / 4 * (b * b - rr * rr);
      var volMm3 = (acc.type === 'cyl-sa') ? (aBore * strk) : (aBore * strk + aAnn * strk);
      totalConsumption += volMm3 / 1e6 * (supplyPressure + 1);
      /* Both directions of travel draw air on a double-acting cylinder. */
      if (acc._extending || acc._retracting) airDemand += (b / 80) * (b / 80) * 130;
    }
    _lastAirDemand = airDemand;
    rPower.textContent = convVal(totalConsumption, 'NL/cycle').toFixed(unitSystem === 'imperial' ? 3 : 1);
    /* Is any cylinder pinned by its load? That's the force-vs-load lesson:
       raise the supply pressure or fit a bigger bore until η × P × A wins. */
    var stalledCyl = false, springStalledCyl = false, trappedCyl = false;
    for (var sc = 0; sc < components.length; sc++) {
      if (components[sc]._springStalled) springStalledCyl = true;
      else if (components[sc]._stalled) stalledCyl = true;
      if (components[sc]._trapped) trappedCyl = true;
    }
    rStatus.textContent = !running ? 'Idle'
      : (_tankReserveActive ? 'Air tank reserve — no compressor'
        : (_compressorSag ? 'Compressor undersized — supply pressure drooping'
          : (springStalledCyl ? 'Load exceeds spring force — cylinder cannot return'
            : (stalledCyl ? 'Load exceeds available force — cylinder stalled'
              : (trappedCyl ? 'No exhaust path — air trapped, cylinder cannot move'
                : (_reliefClamped ? 'Relief valve open — line clamped at setting' : 'Running'))))));
    rStatus.style.color = (_tankReserveActive || _compressorSag || stalledCyl || springStalledCyl || trappedCyl || _reliefClamped) ? '#ffbb33' : '';

    /* ── Fix flow direction: particles always flow from high to low pressure ── */
    for (var fd = 0; fd < connections.length; fd++) {
      var fdc = connections[fd];
      if (fdc.pressure <= 0) { fdc.flowDir = 0; continue; }
      var fromComp = findComp(fdc.from.compId);
      var toComp = findComp(fdc.to.compId);
      if (!fromComp || !toComp) continue;
      var fromP = fromComp._localPressure || 0;
      var toP = toComp._localPressure || 0;
      /* Flow goes from high pressure to low pressure */
      if (fromP >= toP) fdc.flowDir = 1;    /* from → to */
      else fdc.flowDir = -1;                 /* to → from */
    }
  }

  /* getPassthrough — EXIT semantics: returns true if flow can EXIT through portIdx.
     BFS propagates FROM supply OUTWARD; each call checks whether the component
     allows supply-side flow to exit through the given port toward the next component. */
  function getPassthrough(comp, portIdx, pressure, flow) {
    var t = comp.type;
    var v = comp.values || {};

    /* Air supply — always passes (single port) */
    if (t === 'air-supply') return { canFlow: true, pressureDrop: 0 };
    /* Air tank: 2-port passthrough (port 0=in, port 1=out) */
    if (t === 'air-tank') return { canFlow: true, pressureDrop: 0 };

    /* FRL and filter/regulator — 2-port passthrough */
    if (t === 'frl' || t === 'regulator') {
      var maxP = v.setting || 6;
      return { canFlow: true, pressureDrop: Math.max(0, pressure - maxP) };
    }
    if (t === 'filter') return { canFlow: true, pressureDrop: 0.2 };

    /* 2/2 on/off valve & push button NC — ports: 0=1(P), 1=2(A) */
    if (t === 'v22-push' || t === 'v22-nc') {
      if (v.position !== 'Open') return { canFlow: false };
      if (portIdx === 1) return { canFlow: true, pressureDrop: 0.05 };
      return { canFlow: false };
    }

    /* 2-port limit switches — NC: blocked at rest, NO: flow at rest */
    if (t === 'limit-nc' || t === 'limit-no') {
      var lPos = v.position || 'Normal';
      var lActuated = (lPos === 'Actuated');
      var lFlows = (t === 'limit-nc') ? lActuated : !lActuated;
      if (!lFlows) return { canFlow: false };
      if (portIdx === 1) return { canFlow: true, pressureDrop: 0.05 };
      return { canFlow: false };
    }

    /* 3/2 valves — ports: 0=port1(supply), 1=port3(exhaust), 2=port2(output)
       NC valve: Normal = supply blocked; Actuated = 1→2 (exit via port2)
       NO valve: Normal = 1→2 (flow); Actuated (Pressed) = blocked */
    if (t.indexOf('v32') === 0) {
      var pos = v.position || 'Normal';
      var isActuated = (pos !== 'Normal');
      /* NO variants: reversed logic — flow in Normal state */
      if (t === 'v32-push-no' || t === 'v32-roller-no') {
        if (!isActuated) {
          if (portIdx === 2) return { canFlow: true, pressureDrop: 0.1 };
        }
        return { canFlow: false };
      }
      /* NC variants (default): blocked in Normal, flow when Actuated */
      if (isActuated) {
        if (portIdx === 2) return { canFlow: true, pressureDrop: 0.1 };
        return { canFlow: false };
      }
      return { canFlow: false };
    }

    /* 5/2 valves — ports: 0=port1(supply), 1=port2(A-out), 2=port3(A-exh), 3=port4(B-out), 4=port5(B-exh)
       Position A: supply→port2 (exit idx 1)
       Position B: supply→port4 (exit idx 3) */
    if (t.indexOf('v52') === 0) {
      var pos52 = v.position || 'Normal';
      var isB = (pos52 === 'Energised' || pos52 === 'Position B' || pos52 === 'Actuated');
      if (!isB) {
        /* Position A: 1→2 — exit via port 2 (idx 1) */
        if (portIdx === 1) return { canFlow: true, pressureDrop: 0.1 };
        return { canFlow: false };
      } else {
        /* Position B: 1→4 — exit via port 4 (idx 3) */
        if (portIdx === 3) return { canFlow: true, pressureDrop: 0.1 };
        return { canFlow: false };
      }
    }

    /* 5/3 valves — same port layout as 5/2
       Center: all blocked (closed or exhaust center — supply always blocked)
       Extend: supply→port2 (exit idx 1)
       Retract: supply→port4 (exit idx 3) */
    if (t.indexOf('v53') === 0) {
      var pos53 = v.position || 'Center';
      if (pos53 === 'Center') {
        if (t === 'v53-exhaust' || t === 'v53-pilot-exhaust') {
          comp._exhaustCenter = true; /* cylinder ports exhaust to atm; supply blocked */
          return { canFlow: false };
        }
        if (t === 'v53-pressure') {
          /* Pressure center: supply → A (idx 1) and supply → B (idx 3) simultaneously */
          if (portIdx === 1 || portIdx === 3) return { canFlow: true, pressureDrop: 0.1 };
          return { canFlow: false };
        }
        return { canFlow: false }; /* closed center: all blocked */
      }
      if (pos53 === 'Extend') {
        if (portIdx === 1) return { canFlow: true, pressureDrop: 0.1 };
        return { canFlow: false };
      }
      /* Retract */
      if (portIdx === 3) return { canFlow: true, pressureDrop: 0.1 };
      return { canFlow: false };
    }

    /* 4/3 valve — ports: 0=1(supply), 1=2(A), 2=3(exhaust to atmosphere), 3=4(B).
       Pneumatics has NO return line: port 3 vents through a silencer, it is not
       a tank port. Center: all blocked. Extend: 1→2 (exit idx 1).
       Retract: 1→4 (exit idx 3). */
    if (t === 'v43-closed' || t === 'v43-exhaust' || t === 'v43-pilot-single' || t === 'v43-pilot-double') {
      var pos43 = v.position || 'Center';
      if (pos43 === 'Center') {
        if (t === 'v43-exhaust') comp._exhaustCenter = true; /* ports 2 and 4 vent to atmosphere via 3 */
        return { canFlow: false }; /* P always blocked in center */
      }
      if (pos43 === 'Extend') {
        if (portIdx === 1) return { canFlow: true, pressureDrop: 0.1 };
        return { canFlow: false };
      }
      /* Retract: P→B */
      if (portIdx === 3) return { canFlow: true, pressureDrop: 0.1 };
      return { canFlow: false };
    }

    /* Flow control (one-way with check valve bypass) — 2-port passthrough */
    if (t === 'flow-control') {
      if (portIdx === 1) return { canFlow: true, pressureDrop: 0.3, flowLimit: v.flow || 80 }; /* Controlled direction out */
      return { canFlow: true, pressureDrop: 0.05 }; /* Reverse through check bypass */
    }
    if (t === 'throttle') {
      var opening = (v.opening || 50) / 100;
      return { canFlow: true, pressureDrop: 0.5 * (1 - opening), flowLimit: flow * opening };
    }

    /* Check valve — ports: 0=In, 1=Out — exit through Out only */
    if (t === 'check') {
      if (portIdx === 1) return { canFlow: true, pressureDrop: 0.1 };
      return { canFlow: false };
    }

    /* Pilot-operated (unlockable) non-return valve — ports: 0=1(In), 1=2(Out),
       2=12(Pilot). Forward 1→2 always passes. Reverse 2→1 only unseats when the
       PILOT AREA RATIO wins: the pilot piston is 3–5× the poppet area, so
             p_pilot × R  ≥  p_blocked + p_outlet
       Back-pressure at the outlet adds to what the pilot must overcome — which
       is exactly why a locked cylinder needs a properly sized pilot line. */
    if (t === 'pilot-check') {
      if (portIdx === 1) return { canFlow: true, pressureDrop: 0.1 };
      if (portIdx === 0) {
        var _pcPilot = portPressure(comp.id, 2);
        var _pcBlocked = portPressure(comp.id, 1);   /* pressure held at port 2 */
        var _pcOutlet = portPressure(comp.id, 0);    /* back-pressure at port 1 */
        var _pcRatio = parseFloat((v.pilotRatio || '3:1').split(':')[0]) || 3;
        comp._pilotPressure = _pcPilot;
        comp._pilotNeeded = (Math.max(_pcBlocked, pressure) + _pcOutlet) / _pcRatio;
        if (_pcPilot > 0.2 && _pcPilot * _pcRatio >= (Math.max(_pcBlocked, pressure) + _pcOutlet)) {
          return { canFlow: true, pressureDrop: 0.1 };
        }
        return { canFlow: false };
      }
      return { canFlow: false };
    }

    /* Shuttle valve (OR) — ports: 0=A, 1=B, 2=Out — exit via output */
    if (t === 'shuttle') {
      if (portIdx === 2) return { canFlow: true, pressureDrop: 0.05 };
      return { canFlow: false };
    }

    /* AND valve — ports: 0=A, 1=B, 2=Out — exit via output only if both inputs pressurised */
    if (t === 'dual-pressure') {
      if (portIdx === 2) {
        var _aP = 0, _bP = 0;
        for (var _ci = 0; _ci < connections.length; _ci++) {
          var _cn = connections[_ci];
          if ((_cn.to.compId === comp.id && _cn.to.portIdx === 0) || (_cn.from.compId === comp.id && _cn.from.portIdx === 0)) _aP = Math.max(_aP, _cn.pressure);
          if ((_cn.to.compId === comp.id && _cn.to.portIdx === 1) || (_cn.from.compId === comp.id && _cn.from.portIdx === 1)) _bP = Math.max(_bP, _cn.pressure);
        }
        if (_aP > 0.5 && _bP > 0.5) {
          var _andMin = Math.min(_aP, _bP);
          var _andDrop = Math.max(0.1, pressure - _andMin + 0.1);
          return { canFlow: true, pressureDrop: _andDrop };
        }
        return { canFlow: false };
      }
      return { canFlow: false };
    }

    /* Relief valve — ports: 0=In, 1=Out — vents when over-pressure.
       Hysteresis: cracks open at `setting`, reseats at 92% of setting.
       Real relief valves have a small blowdown band; this prevents chatter. */
    if (t === 'relief') {
      var rSet = v.setting || 8;
      var rReset = rSet * 0.92;
      if (comp._reliefActive) {
        if (pressure < rReset) comp._reliefActive = false;
      } else {
        if (pressure >= rSet) comp._reliefActive = true;
      }
      if (portIdx === 1 && comp._reliefActive) return { canFlow: true, pressureDrop: 0 };
      return { canFlow: false };
    }

    /* Sequence valve — ports: 0=In, 1=Out — exit via Out above threshold.
       Uses hysteresis: opens at `setting`, closes at 85% of setting. This
       prevents chatter when the upstream pressure oscillates around the
       threshold (common when the downstream cylinder is just starting to
       move and the supply is loaded). */
    if (t === 'sequence-valve') {
      var seqSet = v.setting || 4;
      var seqClose = seqSet * 0.85;
      if (comp._sequenceOpen) {
        /* Currently open — stay open until pressure drops below close threshold */
        if (pressure < seqClose) comp._sequenceOpen = false;
      } else {
        /* Currently closed — open once pressure exceeds setting */
        if (pressure >= seqSet) comp._sequenceOpen = true;
      }
      if (portIdx === 1 && comp._sequenceOpen) return { canFlow: true, pressureDrop: 0.2 };
      return { canFlow: false };
    }

    /* Quick exhaust — ISO 11727 ports: 0=1(supply), 1=2(cylinder), 2=3(exhaust) */
    if (t === 'quick-exhaust') {
      if (portIdx === 1) return { canFlow: true, pressureDrop: 0.02 };
      return { canFlow: false };
    }

    /* Single-acting cylinder — port 0=Cap (endpoint) */
    if (t === 'cyl-sa') return { canFlow: false };

    /* Double-acting cylinder — port 0=Cap, port 1=Rod (endpoint) */
    if (t === 'cyl-da' || t === 'cyl-rodless') return { canFlow: false };

    /* Rotary actuator — port 0=A (CW), port 1=B (CCW) (endpoint) */
    if (t === 'rotary-act') return { canFlow: false };

    /* Venturi vacuum generator — ports: 0=P(supply), 1=R(motive exhaust), 2=V(vacuum).
       Supply air flows P→R. The V port does NOT propagate positive pressure
       downstream (pneumatic gauges are clipped at 0 so we can't encode negative
       pressure in the BFS). Instead, the connected suction cup reads
       comp._vacuumActive to animate its held state. */
    if (t === 'venturi') {
      /* Vacuum depth is generated by the MOTIVE supply pressure, not a fixed
         setting: below ~1.5 bar the ejector produces nothing; it rises linearly
         to the rated max at ~5 bar. So raising supply pressure deepens the
         vacuum (and the suction-cup holding force) — the sizing lesson. */
      var maxVac = v.vacuumLevel || 0.6;
      var supFactor = Math.max(0, Math.min(1, (pressure - 1.5) / (5 - 1.5)));
      var vacNow = maxVac * supFactor;
      /* Motive air exits via R — the standard supply-driven flow */
      if (portIdx === 1) {
        comp._vacuumLevel = vacNow;
        comp._vacuumActive = vacNow > 0.05;
        return { canFlow: true, pressureDrop: 1.0 };
      }
      /* V port or P port — set vacuum from the supply too (handles circuits
         where R is not connected) */
      if (vacNow > 0.05) {
        comp._vacuumActive = true;
        comp._vacuumLevel = vacNow;
      }
      return { canFlow: false };
    }
    if (t === 'suction-cup') return { canFlow: false };

    /* Timers — the state (_timerFill / _timerDrain) is advanced in animate() using
       real dt. getPassthrough is a pure state-read so the BFS never accidentally
       ticks the timer multiple times per frame (on valve clicks, param changes,
       connection edits — which all call computeCircuit outside the animate loop). */
    /* A real pneumatic timer is a 3/2 valve + air reservoir + one-way throttle.
       The pilot (12) only TIMES the switchover — the output (2) is fed from the
       valve's own SUPPLY port (1), never from the signal line. So the output can
       never exceed the supply pressure and dies when the supply is removed. */
    if (t === 'timer-on') {
      /* On-delay: output (port idx 1) opens once the reservoir has filled
         to the configured delay. Pilot pressure is sampled in animate(). */
      if (portIdx === 1 && (comp._timerFill || 0) >= (v.delay || 3)) {
        var tOnSup = portPressure(comp.id, 2);
        if (tOnSup <= 0.5) return { canFlow: false };
        return { canFlow: true, pressureDrop: Math.max(0.1, pressure - tOnSup + 0.1) };
      }
      return { canFlow: false };
    }
    if (t === 'timer-off') {
      /* Off-delay: output stays open while pilot is ON and for `delay` seconds
         after pilot drops. Drain counter is maintained in animate(). */
      if (portIdx === 1 && (comp._timerDrain || 0) > 0) {
        var tOffSup = portPressure(comp.id, 2);
        if (tOffSup <= 0.5) return { canFlow: false };
        return { canFlow: true, pressureDrop: Math.max(0.1, pressure - tOffSup + 0.1) };
      }
      return { canFlow: false };
    }

    /* Gauges, sensors — tapping point */
    if (t === 'gauge' || t === 'proximity') return { canFlow: false };
    if (t === 'flow-meter') return { canFlow: true, pressureDrop: 0.05 };

    /* Silencer — exhaust endpoint */
    if (t === 'silencer') return { canFlow: false };

    /* Tee — 3-way junction, passes through */
    if (t === 'tee') return { canFlow: true, pressureDrop: 0 };

    return { canFlow: true, pressureDrop: 0 };
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  var lastTime = 0;

  /* Trace the discharge path from a cylinder port to atmosphere.
     Walks connections up to `maxDepth` hops, looking for:
       - flow-control / throttle   → tightens `factor` (meter-out restriction)
       - quick-exhaust             → sets `qevBoost` (short path to atm)
       - exhaust port of a valve   → terminates that branch (normal path)
     Returns a combined { factor, qevBoost } describing the restriction.
     factor=1 means no restriction; factor<1 = slower; qevBoost>1 = faster. */
  /* Does entering `comp` at `portIdx` currently reach atmosphere through the
     component's own internal path? A spool valve only vents the cylinder port
     that its CURRENT position connects to an exhaust port — that is the whole
     point of a closed centre. Returns false for pass-through components (the
     caller keeps walking through those). */
  function portVentsToAtm(comp, portIdx) {
    var t = comp.type;
    var v = comp.values || {};
    if (t === 'silencer') return true;
    if (t === 'quick-exhaust') return portIdx === 1;   /* port 2 always dumps via 3 */
    if (t.indexOf('v32') === 0) {
      var actuated32 = (v.position || 'Normal') !== 'Normal';
      var isNO32 = (t === 'v32-push-no' || t === 'v32-roller-no');
      /* NC: port 2 vents to 3 at rest. NO: port 2 vents to 3 when actuated. */
      if (portIdx === 2) return isNO32 ? actuated32 : !actuated32;
      return false;
    }
    if (t.indexOf('v52') === 0) {
      var pos52v = v.position || 'Normal';
      var isB52 = (pos52v === 'Energised' || pos52v === 'Position B' || pos52v === 'Actuated');
      /* Position A: 1→2, 4 vents via 5. Position B: 1→4, 2 vents via 3. */
      if (portIdx === 1) return isB52;
      if (portIdx === 3) return !isB52;
      return false;
    }
    if (t.indexOf('v53') === 0) {
      var pos53v = v.position || 'Center';
      if (pos53v === 'Center') return (t === 'v53-exhaust' || t === 'v53-pilot-exhaust');
      if (pos53v === 'Extend')  return portIdx === 3;   /* port 4 vents via 5 */
      return portIdx === 1;                             /* Retract: port 2 vents via 3 */
    }
    if (t === 'v43-closed' || t === 'v43-exhaust' || t === 'v43-pilot-single' || t === 'v43-pilot-double') {
      var pos43v = v.position || 'Center';
      if (pos43v === 'Center') return (t === 'v43-exhaust');
      if (pos43v === 'Extend')  return portIdx === 3;
      return portIdx === 1;
    }
    return false;
  }

  function traceExhaustPath(startCompId, startPortIdx) {
    var factor = 1.0, qevBoost = 1.0, vented = false;
    var visited = {};
    var maxDepth = 5;
    function walk(cid, pidx, depth) {
      if (depth > maxDepth) return;
      var key = cid + ':' + pidx;
      if (visited[key]) return;
      visited[key] = true;
      for (var ci = 0; ci < connections.length; ci++) {
        var cn = connections[ci];
        var otherId = null, otherPortIdx = null;
        if (cn.from.compId === cid && cn.from.portIdx === pidx) { otherId = cn.to.compId;   otherPortIdx = cn.to.portIdx;   }
        else if (cn.to.compId === cid && cn.to.portIdx === pidx) { otherId = cn.from.compId; otherPortIdx = cn.from.portIdx; }
        else continue;
        var oc = findComp(otherId);
        if (!oc) continue;
        var ot = oc.type;
        var odef = COMP_DEFS[ot];
        if (!odef) continue;
        var oLabel = odef.ports[otherPortIdx] ? odef.ports[otherPortIdx].label : '';
        /* Terminal: exhaust port of a valve / silencer / relief */
        if (isExhaustPort(ot, oLabel)) { vented = true; continue; } /* dead-end, good */
        /* Does this component vent the port we just entered straight to atmosphere? */
        if (portVentsToAtm(oc, otherPortIdx)) { vented = true; continue; }
        /* Restriction or boost components */
        if (ot === 'flow-control') {
          /* One-way flow-control: controlled dir = port 0→1 (inlet→outlet).
             Reverse (1→0) passes through the integrated check valve = free flow.
             We entered this component via `otherPortIdx`; if entry is port 0,
             flow must exit via port 1 → controlled direction → apply restriction.
             If entry is port 1, flow exits via port 0 → check-valve bypass → free. */
          if (otherPortIdx === 0) {
            factor = Math.min(factor, Math.max(0.1, (oc.values.flow || 80) / 200));
          }
        } else if (ot === 'throttle') {
          /* Throttle is bidirectional — same restriction either way */
          factor = Math.min(factor, Math.max(0.05, (oc.values.opening || 50) / 100));
        } else if (ot === 'quick-exhaust') {
          /* QEV accelerates only if entered via port A (idx 1) — the cylinder side.
             Port P (idx 0) is supply-side; port R (idx 2) is the exhaust dump. */
          if (otherPortIdx === 1) {
            /* A quick-exhaust valve mounted at the cylinder port typically
               gives a 2–4× speed-up (short, large-bore dump straight to atm);
               3× is the representative catalogue figure. */
            qevBoost = Math.max(qevBoost, 3.0);
            vented = true;
            continue; /* QEV dumps directly to atm — no further trace needed */
          }
        }
        /* Traverse to other ports of this component (excluding the entry port) */
        for (var op = 0; op < odef.ports.length; op++) {
          if (op === otherPortIdx) continue;
          walk(otherId, op, depth + 1);
        }
      }
    }
    walk(startCompId, startPortIdx, 0);
    return { factor: factor, qevBoost: qevBoost, vented: vented };
  }

  /* Stroke length in mm, guarded against a missing/zero parameter. */
  function strokeMM(cyl) {
    var s = (cyl.values && cyl.values.stroke) || 150;
    return (s < 1) ? 150 : s;
  }

  /* ── PISTON SPEED — the single source of truth ───────────────────────────
     This one function feeds BOTH the mm/s readout and the on-screen stroke
     animation, so a student timing the stroke with a stopwatch gets the number
     the panel shows.

     Compressed-air flow is quoted in NORMAL litres (free air at 1 atm). The air
     that actually fills the cylinder is compressed to line pressure, so the
     volumetric flow at the cylinder is the free-air figure divided by the
     ABSOLUTE pressure:
         Q_actual [L/min] = Q_N / (p_gauge + 1)
         v [mm/s]         = Q_actual × 1e6 / 60 / A [mm²]
     Example: 200 NL/min at 6 bar into a 50 mm bore
         200 / 7 = 28.57 L/min ; A = π/4 × 50² = 1963 mm² ; v = 242 mm/s.

     Meter-out restriction and quick-exhaust boost scale this PHYSICAL speed —
     the piston can only travel as fast as the opposite face can empty — so the
     readout and the animation are throttled together. */
  function cylinderSpeedMMS(cyl, isExtending) {
    /* Stalled on load — the piston develops less force than the load asks for,
       so it doesn't move at all (set in computeCircuit's force balance). */
    if (cyl._stalled) return 0;
    var bore = cyl.values.bore || 50;
    /* Retraction fills the annular area (bore² − rod²) which is smaller,
       so with the same flow the piston moves FASTER (v = Q/A). A rodless
       cylinder has equal areas both ways. */
    var rod = (cyl.type === 'cyl-da') ? (cyl.values.rod || 0) : 0;
    var area = isExtending ? (Math.PI / 4 * bore * bore)
                           : (Math.PI / 4 * (bore * bore - rod * rod));
    if (area < 1) area = Math.PI / 4 * bore * bore;
    var qN = cyl._localFlow || 0;          /* NL/min reaching this cylinder */
    if (qN <= 0) return 0;
    var capP = cyl._capPressure || 0;
    var rodP = (cyl.type === 'cyl-sa') ? 0 : (cyl._rodPressure || 0);
    var activeP = isExtending ? (capP || cyl._localPressure || 0)
                              : (rodP || cyl._localPressure || 0);
    var v = qN / (activeP + 1) * 1e6 / 60 / area;   /* mm/s */
    /* Exhaust-side: the port opposite the pressurized one */
    var exhaustPortIdx;
    if (cyl.type === 'cyl-sa') exhaustPortIdx = 0;
    else exhaustPortIdx = isExtending ? 1 : 0;
    var exh = (cyl.type === 'cyl-sa' && isExtending)
      ? { factor: 1.0, qevBoost: 1.0, vented: true }
      : traceExhaustPath(cyl.id, exhaustPortIdx);
    return v * exh.factor * exh.qevBoost;
  }

  /* Single-acting spring return: the SPRING sets the speed, not the supply
     (the cap side is exhausting, so there is no inlet flow to divide by area).
     Reference ≈0.8 stroke/s at 50 mm bore, scaled by √(50/bore) because a
     bigger piston has more air to push out, then throttled by the exhaust path
     (meter-out on the cap port, or sped up by a quick-exhaust valve). */
  function saSpringSpeedMMS(cyl) {
    if (cyl._stalled || cyl._springStalled) return 0;
    var bore = cyl.values.bore || 40;
    var exh = traceExhaustPath(cyl.id, 0);
    var frac = Math.max(0.1, 0.8 * Math.sqrt(50 / bore)) * exh.factor * exh.qevBoost;
    return frac * strokeMM(cyl);
  }

  /* Convert a physical speed into the animation's fraction-of-stroke per frame.
     v/stroke is the exact fraction per second (300 mm stroke at 100 mm/s → 3 s),
     and the per-frame result is clamped so a tiny bore on a big flow cannot jump
     an entire stroke inside one frame. */
  function strokeStep(cyl, speedMMS, dt) {
    var step = speedMMS / strokeMM(cyl) * dt;
    if (!(step > 0)) return 0;
    return Math.min(0.08, step);
  }

  /* ISO 4414: a cylinder can only move if the air on the OPPOSITE face has
     somewhere to go. A single-acting cylinder fed through a closed 2/2 has no
     exhaust route, so the trapped air holds it out at stroke — "no supply" is
     not the same as "vented". The one exception is the pressure-centre case,
     where both faces are connected to the supply and the displaced air simply
     flows back into the line. */
  function cylinderCanVent(cyl, isExtending) {
    if ((cyl._capPressure || 0) > 0.5 && (cyl._rodPressure || 0) > 0.5) return true;
    var idx;
    if (cyl.type === 'cyl-sa') idx = 0;
    else idx = isExtending ? 1 : 0;
    if (cyl.type === 'cyl-sa' && isExtending) return true;  /* spring side is open to atm */
    return traceExhaustPath(cyl.id, idx).vented;
  }

  /* Advance on-delay / off-delay timer reservoirs using real dt.
     Called once per frame BEFORE computeCircuit so the BFS sees up-to-date state.
     Pilot pressure is read from last frame's connection pressures (still in memory
     — computeCircuit will overwrite them in its own pass next). */
  function advanceTimers(dt) {
    for (var tc = 0; tc < components.length; tc++) {
      var tcComp = components[tc];
      if (tcComp.type !== 'timer-on' && tcComp.type !== 'timer-off') continue;
      /* Pilot port is always idx 0 (label '12') */
      var pP = 0;
      for (var tci = 0; tci < connections.length; tci++) {
        var tcn = connections[tci];
        if ((tcn.from.compId === tcComp.id && tcn.from.portIdx === 0) ||
            (tcn.to.compId   === tcComp.id && tcn.to.portIdx   === 0)) {
          pP = Math.max(pP, tcn.pressure);
        }
      }
      var delay = tcComp.values.delay || 3;
      if (tcComp.type === 'timer-on') {
        if (pP > 0.5) {
          tcComp._timerFill = Math.min(delay, (tcComp._timerFill || 0) + dt);
        } else {
          tcComp._timerFill = 0;   /* pilot removed → reset */
        }
      } else {
        /* timer-off: while pilot high, output is on AND we remember the
           pilot pressure as a "virtual supply" that will drive the output
           after the pilot drops. When pilot drops, drain over `delay`
           seconds; computeCircuit's second BFS pass injects this remembered
           pressure at the output port until drain reaches zero. */
        var tSupP = portPressure(tcComp.id, 2);   /* port 1 = supply, idx 2 */
        if (pP > 0.5) {
          tcComp._timerDrain = delay;
          tcComp._timerSupplyP = tSupP;
        } else if ((tcComp._timerDrain || 0) > 0) {
          tcComp._timerDrain = Math.max(0, tcComp._timerDrain - dt);
          tcComp._timerSupplyP = tSupP;   /* output is fed by the SUPPLY, not the signal */
          if (tcComp._timerDrain <= 0) tcComp._timerSupplyP = 0;
        }
      }
    }
  }

  function animate(timestamp) {
    if (!running) return;
    var dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    simTime += dt;
    _lastDt = dt;   /* real elapsed time — used by the air-receiver model */

    advanceTimers(dt);
    computeCircuit();

    /* Displacement diagram: sample + redraw (throttled) while the card is open */
    sampleDisplacement();
    if (_dispCanvas) {
      var _ddCard = document.getElementById('disp-diagram-card');
      if (_ddCard && _ddCard.open) {
        _dispDrawAccum = (_dispDrawAccum || 0) + dt;
        if (_dispDrawAccum > 0.1) { _dispDrawAccum = 0; drawDisplacement(); }
      }
    }

    /* Update cylinders */
    for (var c = 0; c < components.length; c++) {
      var comp = components[c];
      if (comp.type === 'cyl-sa' || comp.type === 'cyl-da' || comp.type === 'cyl-rodless') {
        var prev = comp.extension;
        comp._trapped = false;
        /* The stroke animation is driven by the SAME physical speed the readout
           shows: fraction of stroke per second = v [mm/s] / stroke [mm]. */
        comp._speedMMS = 0;
        /* B2 fix: double-acting needs explicit retract (rod pressure > cap) */
        if (comp._extending) {
          if (cylinderCanVent(comp, true)) {
            var extendSpeed = cylinderSpeedMMS(comp, true);
            if (comp.extension < 1) comp._speedMMS = extendSpeed;
            comp.extension = Math.min(1, comp.extension + strokeStep(comp, extendSpeed, dt));
          } else if (comp.extension < 1) {
            comp._trapped = true;   /* opposite face has no exhaust route */
          }
        } else if (comp.type === 'cyl-sa') {
          /* Single-acting: spring return when cap depressurised — but only if
             the spring can also lift the load AND the cap air can escape. */
          if (comp._capPressure < 0.5 && !comp._springStalled) {
            if (cylinderCanVent(comp, false)) {
              var saSpeed = saSpringSpeedMMS(comp);
              if (comp.extension > 0) comp._speedMMS = saSpeed;
              comp.extension = Math.max(0, comp.extension - strokeStep(comp, saSpeed, dt));
            } else if (comp.extension > 0) {
              comp._trapped = true;
            }
          }
        } else {
          /* Double-acting/rodless: retract only with rod pressure, hold otherwise */
          if (comp._rodPressure > comp._capPressure + 0.3) {
            if (cylinderCanVent(comp, false)) {
              var daSpeed = cylinderSpeedMMS(comp, false);
              if (comp.extension > 0) comp._speedMMS = daSpeed;
              comp.extension = Math.max(0, comp.extension - strokeStep(comp, daSpeed, dt));
            } else if (comp.extension > 0) {
              comp._trapped = true;
            }
          } else if (comp._exhausting && comp.extension > 0) {
            /* Exhaust center: both ports vent to atmosphere — no holding force.
               Cylinder drifts under gravity/load (modeled as slow retraction). */
            comp.extension = Math.max(0, comp.extension - dt * 0.15);
          }
          /* else: closed center or pressurized — cylinder holds position */
        }
        if (prev < 1 && comp.extension >= 1) playHiss();
        if (prev > 0 && comp.extension <= 0) playHiss();
      }
      if (comp.type === 'rotary-act') {
        /* E4 fix: limit rotation to swing angle.
           Rotation rate scales with _localFlow (80 NL/min = ref 2 rad/s).
           Also responds to meter-out flow-ctrl via traceExhaustPath. */
        var maxAngle = (comp.values.angle || 180) * Math.PI / 180;
        var flowScale = Math.max(0.1, Math.min(1.8, (comp._localFlow || 80) / 80));
        if (comp._extending) {
          var exhA = traceExhaustPath(comp.id, 1);
          var cwRate = 2 * flowScale * exhA.factor * exhA.qevBoost;
          comp.rotation = Math.min(maxAngle, (comp.rotation || 0) + dt * cwRate);
        } else if (comp._portBPressure > comp._portAPressure + 0.3) {
          var exhB = traceExhaustPath(comp.id, 0);
          var ccwRate = 2 * flowScale * exhB.factor * exhB.qevBoost;
          comp.rotation = Math.max(0, (comp.rotation || 0) - dt * ccwRate);
        } else if (comp._exhausting && (comp.rotation || 0) > 0) {
          comp.rotation = Math.max(0, (comp.rotation || 0) - dt * 0.3);
        }
      }
    }

    /* Auto-actuate roller levers, idle-return, plunger, and limit switches.
       These mechanical trip valves actuate when their linked cylinder reaches
       the configured stroke position (default 95%). */
    for (var rl = 0; rl < components.length; rl++) {
      var rv = components[rl];
      if (rv.type !== 'v32-roller' && rv.type !== 'v32-roller-no' &&
          rv.type !== 'v32-idle' && rv.type !== 'v32-plunger' &&
          rv.type !== 'limit-nc' && rv.type !== 'limit-no') continue;
      if (rv._latched) continue;
      var trigId = rv.values.triggerCyl || 0;
      if (!trigId) continue;
      var trigCyl = findComp(trigId);
      if (!trigCyl) continue;
      var threshold = (rv.values.triggerAt || 95) / 100;
      var ext = trigCyl.extension || 0;
      /* A cam-tripped switch reads 'Actuated' when the piston reaches it — for
         BOTH NC and NO bodies. The NC/NO difference lives in the flow path
         (getPortFlow), not in the position label. Swapping the labels here made
         v32-roller-no / limit-no behave EXACTLY like their NC twins: NO passed
         air only when tripped, which is the opposite of normally-open. */
      var actuatedVal = 'Actuated';
      var normalVal = 'Normal';
      if (rv.type === 'v32-idle') {
        if (ext >= threshold && !rv._idleTripped) {
          rv.values.position = actuatedVal;
          rv._idleTripped = true;
        } else if (ext < threshold * 0.5) {
          rv.values.position = normalVal;
          rv._idleTripped = false;
        }
      } else {
        rv.values.position = (ext >= threshold) ? actuatedVal : normalVal;
      }
    }

    /* Update particles */
    for (var p = 0; p < particles.length; p++) {
      var part = particles[p];
      var conn = connections[part.connIdx];
      if (!conn || conn.pressure <= 0) continue;
      part.t += part.speed * dt * (conn.flowDir || 1);
      if (part.t > 1) part.t -= 1;
      if (part.t < 0) part.t += 1;
      var path = _pathCache[part.connIdx];
      if (path) {
        var len = polylineLength(path);
        var pos = interpolatePolyline(path, part.t * len);
        part.x = pos.x;
        part.y = pos.y;
        part.pressure = conn.pressure;
      }
    }

    draw();
    animFrame = requestAnimationFrame(animate);
  }

  function startSimulation() {
    if (running) return;
    running = true;
    _dispBuf = []; _dispDrawAccum = 0; /* fresh displacement trace */
    btnRun.style.display = 'none';
    btnStop.style.display = '';
    simReadouts.style.display = '';

    /* Create particles */
    particles = [];
    for (var i = 0; i < connections.length; i++) {
      for (var j = 0; j < 4; j++) {
        particles.push({ connIdx: i, t: j / 4, x: 0, y: 0, speed: 0.3 + Math.random() * 0.2, pressure: 0 });
      }
    }

    computeCircuit();
    lastTime = performance.now();
    animFrame = requestAnimationFrame(animate);
  }

  function stopSimulation() {
    running = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    _lastAirDemand = 0; _compressorSag = false;
    btnRun.style.display = '';
    btnStop.style.display = 'none';
    simReadouts.style.display = 'none';
    particles = [];
    /* Reset extensions and timer state */
    for (var c = 0; c < components.length; c++) {
      components[c].extension = 0;
      components[c].rotation = 0;
      components[c].reading = 0;
      components[c]._localPressure = 0;
      components[c]._localFlow = 0;
      components[c]._speedMMS = 0;
      components[c]._extending = false;
      components[c]._timerFill = 0;
      components[c]._timerDrain = 0;
      components[c]._timerSupplyP = 0;
      components[c]._sequenceOpen = false;
      components[c]._reliefActive = false;
      components[c]._vacuumActive = false;
      components[c]._vacuumLevel = 0;
      components[c]._exhaustCenter = false;
      components[c]._exhausting = false;
      components[c]._idleTripped = false;
    }
    for (var i = 0; i < connections.length; i++) {
      connections[i].pressure = 0;
      connections[i].flow = 0;
    }
    draw();
  }

  /* ================================================================
     PRE-BUILT CIRCUITS
     ================================================================ */

  function buildCircuit(name) {
    saveUndoState();
    components = [];
    connections = [];
    nextId = 1;
    particles = [];
    selectedComp = null;
    selectedConn = -1;
    if (running) stopSimulation();

    var desc = '';

    switch (name) {
      /* ── Layout convention (FluidSIM-style) ────────────────────────────────
         All presets follow the same visual hierarchy:
           y=80      → actuators (cylinders, suction cups)
           y=240-280 → main directional control valves
           y=300-360 → manual / signal valves (push buttons, rollers, timers)
           y=400+    → supply chain (air-supply, tank, FRL)
         Grid: components placed at multiples of 20 px so wires snap cleanly.
         Manual signal valves are placed on the SAME SIDE as the pilot port
         they feed, so the pilot wire is short and never crosses the main DCV. */

      case 'direct-control':
        desc = 'Direct control: 3/2 push button valve controls a single-acting cylinder. Press the button to extend, release to retract. Pressure gauge taps the FRL output; flow meter is inline between the valve and cylinder so you can see flow when extending.';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v32-push', 279, 280, { position: 'Normal' });              /* #4 — port 2 at x=309 */
        addComp('cyl-sa', 300, 80, { bore: 40, stroke: 100 });              /* #5 — port at x=309 */
        addComp('gauge', 380, 380);                                         /* #6 — taps FRL output */
        addComp('flow-meter', 287, 160);                                    /* #7 — ports at x=309, vertical alignment */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v32 port 1 */
        connect(4, 2, 7, 0); /* v32 port 2 → flow-meter inlet (port 1) */
        connect(7, 1, 5, 0); /* flow-meter outlet (port 2) → cyl port 2 (cap) */
        connect(3, 1, 6, 0); /* frl → gauge tap (multi-connection from FRL OUT) */
        break;

      case 'speed-control':
        desc = 'Speed control: 4/3 closed-centre valve with meter-out flow control. Supply passes freely through the check valve; exhaust is throttled, which is why meter-out gives smooth motion. Click Extend/Retract to move, click Centre to block both cylinder ports and park mid-stroke. Note: a closed centre only SLOWS drift — ISO 4414 §5.4 does not accept spool overlap as a means of holding a load, because air is compressible and every spool leaks. For genuine load holding fit a pair of pilot-operated check valves at the cylinder ports, or a mechanical rod lock.';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        /* Vertical stack, one component per band so no two name labels collide:
           cyl 25 · flow-meter 105 · FC-cap 185 · FC-rod 250 · valve 320 · FRL 400 */
        addComp('v43-closed', 282, 320, { position: 'Center' });            /* #4 — port 2(A) at x=318, port 4(B) at x=346 */
        addComp('flow-control', 270, 185, { flow: 60 });                    /* #5 — meter-out on the CAP line, port at x=290 */
        addComp('flow-control', 318, 250, { flow: 80 });                    /* #6 — meter-out on the ROD line, port at x=338 */
        addComp('cyl-da', 282, 25, { bore: 50, rod: 20, stroke: 150 });     /* #7 — port 2 (cap) at x=290, port 4 (rod) at x=338 */
        addComp('gauge', 470, 380);                                         /* #8 — taps FRL output, clear of the valve */
        addComp('flow-meter', 268, 105);                                    /* #9 — ports at x=290, in the cap line */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v43 port P */
        connect(4, 1, 5, 1); /* v43 port A → flow-ctrl A check-valve side (free supply) */
        connect(5, 0, 9, 0); /* flow-ctrl A throttle side → flow-meter inlet (restricts exhaust) */
        connect(9, 1, 7, 0); /* flow-meter outlet → cyl port 2 (cap/blind end) */
        connect(4, 3, 6, 1); /* v43 port B → flow-ctrl B check-valve side (free supply) */
        connect(6, 0, 7, 1); /* flow-ctrl B throttle side → cyl port 4 (rod) (restricts exhaust) */
        connect(3, 1, 8, 0); /* frl → gauge tap */
        break;

      case 'auto-return':
        desc = 'Auto return: press push button to extend. Roller lever at full stroke pilots the valve back to retract automatically.';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v52-pilot', 280, 280, { position: 'Position B' });         /* #4 — main DCV (starts retracted) */
        addComp('v32-push', 60, 320, { position: 'Normal' });               /* #5 — extend (LEFT, feeds pilot 12 on LEFT) */
        addComp('v32-roller', 520, 320, { position: 'Normal', triggerCyl: 7 }); /* #6 — retract (RIGHT, feeds pilot 14 on RIGHT), trips at cyl #7 full stroke */
        addComp('cyl-da', 272, 80, { bore: 50, rod: 20, stroke: 150 });    /* #7 — cap port x=280, rod port x=328; centred on the valve's 292/316 outputs */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v52 port 1(P) */
        connect(4, 1, 7, 0); /* v52 port 2(A) → cyl port 2 (cap) */
        connect(4, 3, 7, 1); /* v52 port 4(B) → cyl port 4 (rod) */
        connect(3, 1, 5, 0); /* frl → push button port 1(P) */
        connect(5, 2, 4, 5); /* push button port 2 → v52 pilot 12 (LEFT, extend) */
        connect(3, 1, 6, 0); /* frl → roller port 1(P) */
        connect(6, 2, 4, 6); /* roller port 2 → v52 pilot 14 (RIGHT, retract) */
        break;

      case 'and-logic':
        desc = 'AND logic (two-hand safety): hold BOTH 3/2 push buttons simultaneously to extend the cylinder — prevents single-hand operation. Release either one and the released button vents the signal through its port 3, so the cylinder spring-returns. (3/2 valves are used, not 2/2 — a 2/2 has no exhaust port, so it would simply trap the air and leave the cylinder out at stroke.)';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v32-push', 130, 330, { position: 'Normal' });              /* #4 — push A, port 2 at x=160 */
        addComp('v32-push', 250, 330, { position: 'Normal' });              /* #5 — push B, port 2 at x=280 */
        addComp('dual-pressure', 160, 230, {});                             /* #6 — AND out at x=182 */
        addComp('cyl-sa', 173, 80, { bore: 40, stroke: 100 });              /* #7 — port at x=182 */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → push A port 1 */
        connect(3, 1, 5, 0); /* frl → push B port 1 */
        connect(4, 2, 6, 0); /* push A port 2 → AND input 1 */
        connect(5, 2, 6, 1); /* push B port 2 → AND input 1(3) */
        connect(6, 2, 7, 0); /* AND output 2 → cyl port 2 (cap) */
        break;

      case 'or-logic':
        desc = 'OR logic: hold either 3/2 push button to extend the cylinder — useful for operating from two locations. The shuttle valve passes whichever input is live to output 2 and blocks the other, so air cannot escape back through the idle button.';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v32-push', 130, 330, { position: 'Normal' });              /* #4 — push A, port 2 at x=160 */
        addComp('v32-push', 250, 330, { position: 'Normal' });              /* #5 — push B, port 2 at x=280 */
        addComp('shuttle', 160, 230, {});                                   /* #6 — OR out at x=182 */
        addComp('cyl-sa', 173, 80, { bore: 40, stroke: 100 });              /* #7 — port at x=182 */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → push A port 1 */
        connect(3, 1, 5, 0); /* frl → push B port 1 */
        connect(4, 2, 6, 0); /* push A port 2 → shuttle input 1 */
        connect(5, 2, 6, 1); /* push B port 2 → shuttle input 1(3) */
        connect(6, 2, 7, 0); /* shuttle output 2 → cyl port 2 (cap) */
        break;

      case 'time-delay':
        desc = 'Time delay: press push button to extend. The on-delay timer (3 s) is a 3/2 valve with an air reservoir and one-way throttle — port 12 only starts the timing, while the output at port 2 is fed from the timer’s own supply at port 1. After the delay it pilots the 5/2 valve back to retract.';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v52-pilot', 280, 280, { position: 'Position B' });         /* #4 — starts retracted */
        addComp('v32-push', 60, 320, { position: 'Normal' });               /* #5 — extend (LEFT, feeds pilot 12) */
        addComp('timer-on', 520, 280, { delay: 3 });                        /* #6 — timer (RIGHT, feeds pilot 14) */
        addComp('cyl-da', 272, 80, { bore: 50, rod: 20, stroke: 150 });    /* #7 — cap port x=280, rod port x=328; centred on the valve's 292/316 outputs */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v52 port 1(P) */
        connect(4, 1, 7, 0); /* v52 port 2(A) → cyl port 2 (cap) */
        connect(4, 3, 7, 1); /* v52 port 4(B) → cyl port 4 (rod) */
        connect(3, 1, 5, 0); /* frl → push button port 1(P) */
        connect(5, 2, 4, 5); /* push button → v52 pilot 12 (extend, LEFT) */
        connect(4, 1, 6, 0); /* v52 port 2(A) → timer pilot 12 (starts timing on extend) */
        connect(3, 1, 6, 2); /* frl → timer port 1 (SUPPLY — the output is fed from here) */
        connect(6, 1, 4, 6); /* timer output port 2 → v52 pilot 14 (retract after delay, RIGHT) */
        break;

      case 'sequential':
        desc = 'Sequential A+B+: click the right-hand box of valve A (Energise) to extend cyl A. The roller lever trips at A full stroke and pilots valve B, so cyl B follows. This is only the two-step half of a sequence \u2014 there is no B\u2212 or A\u2212 signal, so switch valve A back to Normal to retract A and click valve B\u2019s left box to bring B home. For the full A+B+B\u2212A\u2212 cycle running by itself, load the Cascade circuit.';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v52-single', 140, 280, { position: 'Normal' });            /* #4 — valve A (single sol.) */
        addComp('v52-pilot', 420, 280, { position: 'Position B' });         /* #5 — valve B (starts retracted) */
        addComp('cyl-da', 140, 80, { bore: 40, rod: 16, stroke: 100 });    /* #6 — cyl A same X as valve A */
        addComp('cyl-da', 412, 80, { bore: 50, rod: 20, stroke: 150 });    /* #7 — cyl B: cap x=420, rod x=468, centred on valve B's 432/456 outputs */
        addComp('v32-roller', 280, 330, { position: 'Normal', triggerCyl: 6 }); /* #8 — limit switch, trips at cyl A (#6) full stroke; label clears the FRL bus at y=422 */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v52A port 1(P) */
        connect(4, 1, 6, 1); /* v52A port A → cyl A port 4 (rod) (Normal=retract) */
        connect(4, 3, 6, 0); /* v52A port B → cyl A port 2 (cap) (Energised=extend) */
        connect(3, 1, 5, 0); /* frl → v52B port 1(P) */
        connect(5, 1, 7, 0); /* v52B port A → cyl B port 2 (cap) */
        connect(5, 3, 7, 1); /* v52B port B → cyl B port 4 (rod) */
        connect(3, 1, 8, 0); /* frl → roller port 1(P) */
        connect(8, 2, 5, 5); /* roller → v52B pilot 12 (LEFT side of v52B → triggers B extend) */
        break;

      case 'cascade':
        desc = 'Cascade A+B+B\u2212A\u2212: a proper two-group cascade — the standard cure for opposed limit-valve signals. Tap START: the 5/2 cascade valve puts GROUP 1 under pressure, which pilots valve A and extends cyl A. Roller a1 (fed from group 1) trips at A full stroke and extends cyl B. Roller b1 (also group 1) trips at B full stroke and flips the cascade valve to GROUP 2, which instantly EXHAUSTS group 1 — so a1 stops holding the B+ signal and group 2 is free to retract B. Roller b0 is a NORMALLY OPEN valve that passes air only while cyl B is home, so the moment B is back it retracts A and the circuit is armed for the next cycle.';
        addComp('air-supply', 60, 455, { pressure: 6, flow: 200 });         /* #1 — clear of the zoom-toolbar overlay */
        addComp('air-tank', 60, 390, { volume: 50 });                       /* #2 */
        addComp('frl', 130, 395, { setting: 6 });                           /* #3 */
        addComp('v52-pilot', 100, 200, { position: 'Position B' });         /* #4 — valve A (starts retracted) */
        addComp('v52-pilot', 430, 200, { position: 'Position B' });         /* #5 — valve B (starts retracted) */
        addComp('cyl-da', 92, 60, { bore: 40, rod: 16, stroke: 100 });      /* #6 — cyl A: cap x=100, rod x=148 (centred on valve A's 112/136 outputs) */
        addComp('cyl-da', 422, 60, { bore: 50, rod: 20, stroke: 150 });     /* #7 — cyl B: cap x=430, rod x=478 (centred on valve B's 442/466 outputs) */
        addComp('v32-push', 230, 455, { position: 'Normal' });              /* #8 — START */
        addComp('v52-pilot', 250, 320, { position: 'Position B' });         /* #9 — CASCADE valve: port 2 = group 1, port 4 = group 2 */
        addComp('v32-roller', 390, 320, { position: 'Normal', triggerCyl: 6, triggerAt: 95 });   /* #10 — a1, trips when cyl A is out */
        addComp('v32-roller', 560, 320, { position: 'Normal', triggerCyl: 7, triggerAt: 95 });   /* #11 — b1, trips when cyl B is out */
        addComp('v32-roller-no', 560, 430, { position: 'Normal', triggerCyl: 7, triggerAt: 5 }); /* #12 — b0, NORMALLY OPEN: passes while cyl B is home */
        connect(1, 0, 2, 0);   /* supply → tank */
        connect(2, 1, 3, 0);   /* tank out → frl in */
        connect(3, 1, 4, 0);   /* frl → valve A port 1(P) */
        connect(3, 1, 5, 0);   /* frl → valve B port 1(P) */
        connect(3, 1, 9, 0);   /* frl → cascade valve port 1(P) */
        connect(3, 1, 8, 0);   /* frl → START port 1(P) */
        connect(8, 2, 9, 5);   /* START → cascade pilot 12  = select GROUP 1 */
        connect(11, 2, 9, 6);  /* b1    → cascade pilot 14  = select GROUP 2 */
        connect(9, 1, 4, 5);   /* GROUP 1 → valve A pilot 12  = A+ */
        connect(9, 1, 10, 0);  /* GROUP 1 → a1 supply */
        connect(10, 2, 5, 5);  /* a1 → valve B pilot 12       = B+ */
        connect(9, 1, 11, 0);  /* GROUP 1 → b1 supply */
        connect(9, 3, 5, 6);   /* GROUP 2 → valve B pilot 14  = B\u2212 */
        connect(9, 3, 12, 0);  /* GROUP 2 → b0 supply */
        connect(12, 2, 4, 6);  /* b0 → valve A pilot 14       = A\u2212 */
        connect(4, 1, 6, 0);   /* valve A port 2 → cyl A port 2 (cap) */
        connect(4, 3, 6, 1);   /* valve A port 4 → cyl A port 4 (rod) */
        connect(5, 1, 7, 0);   /* valve B port 2 → cyl B port 2 (cap) */
        connect(5, 3, 7, 1);   /* valve B port 4 → cyl B port 4 (rod) */
        break;

      case 'vacuum-pick':
        desc = 'Vacuum pick: hold the 3/2 push button (Shift+Click latches it) to feed the venturi vacuum generator. The generator and cup turn green and the cup prints its live holding force F = p_vac \u00d7 A_cup, with the figure you would actually design to (safety factor 2 for a vertical lift) underneath. There is no cylinder in this circuit, so the Net Cyl. Force, Cylinder Speed and Load Ratio cards stay at zero \u2014 the cup carries the force reading.';
        addComp('air-supply', 60, 420, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 360, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 360, { setting: 6 });                           /* #3 */
        addComp('v32-push', 240, 240, { position: 'Normal' });              /* #4 — push button */
        addComp('venturi', 360, 220, { vacuumLevel: 0.6 });                 /* #5 — venturi (P faces LEFT, V faces DOWN at x=385) */
        addComp('suction-cup', 367, 330, { diameter: 40 });                 /* #6 — cup hangs BELOW the generator: its V port (x=385) drops straight onto the V port above it */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v32 port 1 */
        connect(4, 2, 5, 0); /* v32 port 2 → venturi P (supply, LEFT) */
        connect(5, 2, 6, 0); /* venturi V (vacuum, DOWN) → suction cup */
        break;

      case 'pilot-control':
        desc = 'Pilot control: two 3/2 push buttons send pilot air signals to a 4/3 double-pilot valve. HOLD Extend (left) to advance the cylinder and HOLD Retract (right) to bring it back \u2014 Shift+Click latches a button so you can watch a whole stroke hands-free. This valve is spring-CENTRED, not bistable: release both buttons and the spool returns to its closed centre, blocking both cylinder ports and parking the piston where it stands. (Compare Auto Return, whose 5/2 double-pilot valve really is bistable and does remember its last position.)';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v43-pilot-double', 280, 280, { position: 'Center' });      /* #4 — main valve */
        addComp('v32-push', 60, 320, { position: 'Normal' });               /* #5 — Extend (LEFT, feeds pilot 12) */
        addComp('v32-push', 500, 320, { position: 'Normal' });              /* #6 — Retract (RIGHT, feeds pilot 14) */
        addComp('cyl-da', 298, 80, { bore: 50, rod: 20, stroke: 150 });    /* #7 — cap x=306 under port 2 (316), rod x=354 under port 4 (344): no crossed wires */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v43 P supply */
        connect(4, 1, 7, 0); /* v43 A → cyl port 2 (cap) */
        connect(4, 3, 7, 1); /* v43 B → cyl port 4 (rod) */
        connect(3, 1, 5, 0); /* frl → Extend-button port 1 */
        connect(5, 2, 4, 4); /* Extend-button → v43 pilot 12 (LEFT) */
        connect(3, 1, 6, 0); /* frl → Retract-button port 1 */
        connect(6, 2, 4, 5); /* Retract-button → v43 pilot 14 (RIGHT) */
        break;

      case 'stroke-limit':
        desc = 'Stroke limit: press push button to extend. A limit switch NC at 50% stroke detects the piston position and sends a pilot signal to retract the 5/2 valve automatically. The cylinder stops and returns at mid-stroke instead of full extension.';
        addComp('air-supply', 60, 460, { pressure: 6, flow: 200 });        /* #1 */
        addComp('air-tank', 60, 400, { volume: 50 });                       /* #2 */
        addComp('frl', 160, 400, { setting: 6 });                           /* #3 */
        addComp('v52-pilot', 280, 280, { position: 'Position B' });         /* #4 — main DCV (starts retracted) */
        addComp('v32-push', 60, 280, { position: 'Normal' });               /* #5 — extend button */
        addComp('limit-nc', 520, 280, { position: 'Normal', triggerCyl: 7, triggerAt: 50 }); /* #6 — limit switch at 50% */
        addComp('cyl-da', 272, 80, { bore: 50, rod: 20, stroke: 300 });    /* #7 — long stroke; cap x=280, rod x=328, centred on the valve's 292/316 outputs */
        connect(1, 0, 2, 0); /* supply → tank */
        connect(2, 1, 3, 0); /* tank out → frl in */
        connect(3, 1, 4, 0); /* frl → v52 port 1 (supply) */
        connect(4, 1, 7, 0); /* v52 port 2(A) → cyl port 2 (cap) */
        connect(4, 3, 7, 1); /* v52 port 4(B) → cyl port 4 (rod) */
        connect(3, 1, 5, 0); /* frl → push button port 1 */
        connect(5, 2, 4, 5); /* push button port 2 → v52 pilot 12 (extend) */
        connect(3, 1, 6, 0); /* frl → limit switch port 1 (input) */
        connect(6, 1, 4, 6); /* limit switch port 2 (output) → v52 pilot 14 (retract) */
        break;
    }

    circuitDesc.textContent = desc;
    circuitDesc.style.display = desc ? '' : 'none';
    draw();
  }

  function addComp(type, x, y, vals) {
    var def = COMP_DEFS[type];
    if (!def) return;
    var values = {};
    for (var k in def.params) values[k] = def.params[k].def;
    for (var k2 in vals) values[k2] = vals[k2];
    var comp = { id: nextId++, type: type, x: x, y: y, orient: 0, values: values, extension: 0, rotation: 0, reading: 0 };
    if (isLimitSwitch(type)) comp.sName = getNextSName();
    components.push(comp);
  }

  function connect(fromId, fromPort, toId, toPort) {
    connections.push({ from: { compId: fromId, portIdx: fromPort }, to: { compId: toId, portIdx: toPort }, pressure: 0, flow: 0, flowDir: 0 });
  }

  /* ================================================================
     EVENT HANDLERS
     ================================================================ */

  function getCanvasPos(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = (e.clientX - rect.left) * (W / rect.width);
    var sy = (e.clientY - rect.top) * (H / rect.height);
    return { x: (sx - viewOffX) / viewScale, y: (sy - viewOffY) / viewScale };
  }

  /* Annotation event listeners — registered BEFORE circuit handlers so annConsumed flag works */
  canvas.addEventListener('pointerdown', onAnnPointerDown);
  canvas.addEventListener('pointermove', onAnnPointerMove);
  canvas.addEventListener('pointerup', onAnnPointerUp);
  canvas.addEventListener('pointerleave', function () { annCursorPos = null; if (annTool === 'sketch' || annTool === 'shape') draw(); });
  canvas.addEventListener('dblclick', function (e) {
    if (annTool !== 'move') return;
    var dpos = getCanvasPosSafe(e);
    var dhit = findNearestAnnotation(dpos.x, dpos.y);
    if (dhit && dhit.type === 'shape') {
      var ds = annShapes[dhit.idx];
      if (ds && ds.type === 'text') editTextShape(dhit.idx, ds);
    }
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    if (annConsumed) return; /* Annotation handler already handled this */
    var pos = getCanvasPos(e);
    var mx = pos.x, my = pos.y;

    /* Pre-check: does this touch hit anything interactive? */
    var hitsAnything = connectingFrom || hitTestPort(mx, my) || hitTestComponent(mx, my) || hitTestConnection(mx, my) >= 0;
    if (hitsAnything) e.preventDefault();

    /* Port click */
    var port = hitTestPort(mx, my);
    if (port) {
      if (connectingFrom) {
        /* Complete connection */
        if (connectingFrom.compId !== port.compId) {
          saveUndoState();
          var newConn = {
            from: { compId: connectingFrom.compId, portIdx: connectingFrom.portIdx },
            to: { compId: port.compId, portIdx: port.portIdx },
            pressure: 0, flow: 0, flowDir: 0
          };
          /* Attach manual waypoints if user clicked intermediate points */
          if (connectingFrom._waypoints && connectingFrom._waypoints.length > 0) {
            newConn.waypoints = connectingFrom._waypoints.slice();
          }
          connections.push(newConn);
          if (running) computeCircuit();
        }
        connectingFrom = null;
      } else {
        /* Start connection */
        connectingFrom = { compId: port.compId, portIdx: port.portIdx };
      }
      draw();
      return;
    }

    /* Add waypoint when clicking empty space during connection */
    if (connectingFrom) {
      if (!connectingFrom._waypoints) connectingFrom._waypoints = [];
      /* Snap orthogonally relative to previous point */
      var prevPt;
      if (connectingFrom._waypoints.length > 0) {
        prevPt = connectingFrom._waypoints[connectingFrom._waypoints.length - 1];
      } else {
        var fromC = findComp(connectingFrom.compId);
        if (fromC) {
          var fromDef = COMP_DEFS[fromC.type];
          var fromP = getRotatedPort(fromDef, connectingFrom.portIdx, fromC.orient);
          var portPos = { x: fromC.x + fromP.x, y: fromC.y + fromP.y };
          prevPt = applyStub(portPos, fromP.dir, 20);
        } else {
          prevPt = getPortWorldPos(connectingFrom);
        }
      }
      var adx = Math.abs(mx - prevPt.x);
      var ady = Math.abs(my - prevPt.y);
      var snapped;
      /* Snap orthogonally relative to the previous point AND to the routing grid */
      if (adx <= ady) {
        snapped = { x: prevPt.x, y: snapToGrid(my) };
      } else {
        snapped = { x: snapToGrid(mx), y: prevPt.y };
      }
      /* Skip degenerate zero-length segments */
      if (Math.abs(snapped.x - prevPt.x) > 2 || Math.abs(snapped.y - prevPt.y) > 2) {
        connectingFrom._waypoints.push(snapped);
      }
      draw();
      return;
    }

    /* DCV toggle during simulation — defer to pointerup to distinguish click vs drag */
    if (running) {
      var comp = hitTestComponent(mx, my);
      if (comp && comp.type.match(/^v[2-5][2-3]|^v43/)) {
        var box = hitTestDCVBox(comp, mx, my);
        if (box) {
          /* Momentary push buttons: actuation on press, auto-release on pointerup
             Shift+Click = latch (stays actuated until Shift+Click again) */
          if (comp.type === 'v22-nc' || comp.type === 'v32-push' || comp.type === 'v32-push-no') {
            var openVal = (comp.type === 'v22-nc') ? 'Open' : 'Pressed';
            var closedVal = (comp.type === 'v22-nc') ? 'Closed' : 'Normal';
            if (e.shiftKey) {
              /* Shift+Click: toggle latch */
              if (comp._latched) {
                comp.values.position = closedVal;
                comp._latched = false;
              } else {
                comp.values.position = openVal;
                comp._latched = true;
              }
              computeCircuit();
              draw();
              return;
            }
            /* Normal click: momentary press */
            comp.values.position = openVal;
            pendingMomentary = comp;
            computeCircuit();
            draw();
            return;
          }
          /* Store pending DCV click — only fire on pointerup if no drag */
          pendingDCVClick = { comp: comp, pos: box, startX: mx, startY: my };
          /* Still allow drag by falling through to component drag below */
        }
      }
    }

    /* Component drag */
    var comp2 = hitTestComponent(mx, my);
    if (comp2) {
      saveUndoState();
      selectedComp = comp2;
      selectedConn = -1;
      draggingComp = comp2;
      dragOffX = mx - comp2.x;
      dragOffY = my - comp2.y;
      dragStartX = mx;
      dragStartY = my;
      dragMoved = false;
      updateProperties();
      draw();
      return;
    }

    /* Connection selection + segment drag.
       Tap-vs-drag: we record the candidate segment but don't commit to dragging
       until pointermove exceeds DRAG_THRESHOLD_PX. Prevents accidental segment
       moves on touch. */
    var ci = hitTestConnection(mx, my);
    if (ci >= 0) {
      selectedConn = ci;
      selectedComp = null;
      updateProperties();
      /* Check if click is on a draggable segment */
      var segHit = hitTestSegment(mx, my);
      if (segHit && segHit.connIdx === ci) {
        /* Pending — actual commit happens in pointermove past threshold */
        pendingSegDrag = {
          segHit: segHit,
          startX: mx,
          startY: my,
          startClientX: e.clientX,
          startClientY: e.clientY
        };
        /* Capture pointer so drag continues even if finger leaves canvas */
        try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* old browser */ }
      }
      draw();
      return;
    }

    /* Deselect */
    selectedComp = null;
    selectedConn = -1;
    updateProperties();
    draw();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (mode !== 'simulate') return;
    if (annDrag || isPanning || annActiveStroke || annActiveShape) return;
    if (draggingComp || draggingSegInfo || connectingFrom || pendingSegDrag) e.preventDefault();
    var pos = getCanvasPos(e);
    var mx = pos.x, my = pos.y;

    /* Tap-vs-drag commit: if a segment-drag is pending and the pointer has
       moved past the threshold, convert into a real drag now. */
    if (pendingSegDrag && !draggingSegInfo) {
      var pdx = e.clientX - pendingSegDrag.startClientX;
      var pdy = e.clientY - pendingSegDrag.startClientY;
      if ((pdx * pdx + pdy * pdy) >= DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        var sh = pendingSegDrag.segHit;
        saveUndoState();
        convertToWaypoints(sh.connIdx);
        var wpA0 = sh.segIdx - 3;
        var wpB0 = sh.segIdx - 2;
        var wps0 = connections[sh.connIdx].waypoints;
        draggingSegInfo = {
          connIdx: sh.connIdx,
          axis: sh.axis,
          startVal: (sh.axis === 'y') ? pendingSegDrag.startY : pendingSegDrag.startX,
          wpIdxA: wpA0,
          wpIdxB: wpB0,
          origA: (wpA0 >= 0 && wpA0 < wps0.length) ? { x: wps0[wpA0].x, y: wps0[wpA0].y } : null,
          origB: (wpB0 >= 0 && wpB0 < wps0.length) ? { x: wps0[wpB0].x, y: wps0[wpB0].y } : null
        };
        pendingSegDrag = null;
        canvas.style.cursor = 'grabbing';
      }
    }

    /* Segment dragging — move connection segments horizontally/vertically.
       Drag delta is grid-snapped so wires land on consistent rails. */
    if (draggingSegInfo) {
      var conn = connections[draggingSegInfo.connIdx];
      if (!conn || !conn.waypoints) { draggingSegInfo = null; return; }
      var rawDelta = (draggingSegInfo.axis === 'y')
        ? (my - draggingSegInfo.startVal)
        : (mx - draggingSegInfo.startVal);
      /* Quantize to grid for clean alignment */
      var delta = Math.round(rawDelta / ROUTE_GRID) * ROUTE_GRID;
      var wps = conn.waypoints;
      if (draggingSegInfo.origA && draggingSegInfo.wpIdxA >= 0 && draggingSegInfo.wpIdxA < wps.length) {
        if (draggingSegInfo.axis === 'y') wps[draggingSegInfo.wpIdxA].y = draggingSegInfo.origA.y + delta;
        else wps[draggingSegInfo.wpIdxA].x = draggingSegInfo.origA.x + delta;
      }
      if (draggingSegInfo.origB && draggingSegInfo.wpIdxB >= 0 && draggingSegInfo.wpIdxB < wps.length) {
        if (draggingSegInfo.axis === 'y') wps[draggingSegInfo.wpIdxB].y = draggingSegInfo.origB.y + delta;
        else wps[draggingSegInfo.wpIdxB].x = draggingSegInfo.origB.x + delta;
      }
      canvas.style.cursor = 'grabbing';
      draw();
      return;
    }

    if (draggingComp) {
      /* Adaptive grid snap: use finer grid when zoomed out so movement stays smooth */
      var snapSize = viewScale < 0.7 ? 10 : 20;
      var nx = Math.round((mx - dragOffX) / snapSize) * snapSize;
      var ny = Math.round((my - dragOffY) / snapSize) * snapSize;
      /* Clamp to visible world area (accounting for zoom/pan) */
      var worldMinX = -viewOffX / viewScale;
      var worldMinY = -viewOffY / viewScale;
      var worldMaxX = (W - viewOffX) / viewScale;
      var worldMaxY = (H - viewOffY) / viewScale;
      var ed = getEffectiveDims(draggingComp);
      draggingComp.x = Math.max(worldMinX, Math.min(worldMaxX - ed.w, nx));
      draggingComp.y = Math.max(worldMinY, Math.min(worldMaxY - ed.h, ny));
      dragMoved = true;
      draw();
      return;
    }

    /* Hover detection — runs even while drawing a connection so the live preview
       can highlight the candidate drop port. */
    var port = hitTestPort(mx, my);
    var prevPort = hoveredPort;
    hoveredPort = port;
    if (port) {
      /* Save raw screen coords for tooltip positioning */
      var _tRect = canvas.getBoundingClientRect();
      hoveredPortSX = e.clientX - _tRect.left;  /* CSS px from canvas left */
      hoveredPortSY = e.clientY - _tRect.top;   /* CSS px from canvas top  */
    }

    if (connectingFrom) {
      connectingFrom._lastMouse = { x: mx, y: my };
      draw();
      return;
    }

    var prevConn = hoveredConn;
    hoveredConn = hitTestConnection(mx, my);

    var hComp = hitTestComponent(mx, my);
    var prevHovComp = hoveredCompId;
    hoveredCompId = hComp ? hComp.id : null;

    if (port !== prevPort || hoveredConn !== prevConn || hoveredCompId !== prevHovComp) draw();

    /* Cursor — sketch/shape tools keep their cursor, pan mode keeps grab */
    if (panMode) canvas.style.cursor = 'grab';
    else if (annTool === 'sketch') canvas.style.cursor = PENCIL_CURSOR;
    else if (annTool === 'shape') canvas.style.cursor = 'crosshair';
    else if (port) canvas.style.cursor = 'pointer';
    else if (hComp && running && hComp.type.match(/^v[2-5][2-3]|^v43/)) canvas.style.cursor = 'pointer';
    else if (hComp) canvas.style.cursor = 'move';
    else canvas.style.cursor = 'crosshair';
  });

  canvas.addEventListener('pointerup', function (e) {
    /* Momentary push buttons: auto-close on release (skip if latched) */
    if (pendingMomentary && !pendingMomentary._latched) {
      var defPos = (pendingMomentary.type === 'v22-nc') ? 'Closed' : 'Normal';
      pendingMomentary.values.position = defPos;
      pendingMomentary = null;
      computeCircuit();
      updateProperties();
      draw();
    }
    /* DCV click — fire only if user didn't drag (click, not drag) */
    if (pendingDCVClick && !dragMoved) {
      var p = pendingDCVClick;
      if (p.pos !== p.comp.values.position) {
        p.comp.values.position = p.pos;
        if (p.comp.type === 'v22-push') playHiss();
        computeCircuit();
        updateProperties();
        draw();
      }
    }
    /* Release any captured pointer so subsequent taps target the right element */
    try { if (e && e.pointerId !== undefined) canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    pendingDCVClick = null;
    pendingSegDrag = null;
    draggingComp = null;
    draggingSegInfo = null;
  });

  /* pointercancel: OS/browser interrupted the gesture (tab switch, palm
     rejection, system gesture) — release any held momentary button and
     clean up ALL drag state so the next pointer interaction starts fresh. */
  canvas.addEventListener('pointercancel', function (e) {
    try { if (e && e.pointerId !== undefined) canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (pendingMomentary && !pendingMomentary._latched) {
      pendingMomentary.values.position = (pendingMomentary.type === 'v22-nc') ? 'Closed' : 'Normal';
      computeCircuit();
    }
    pendingMomentary = null;
    pendingDCVClick = null;
    pendingSegDrag = null;
    draggingComp = null;
    draggingSegInfo = null;
    connectingFrom = null;
    canvas.style.cursor = '';
    draw();
  });

  /* Context menu */
  var ctxMenu = document.getElementById('ctx-menu');
  var ctxConnMenu = document.getElementById('ctx-conn-menu');
  var ctxTargetComp = null;
  var ctxTargetConn = -1;

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (mode !== 'simulate') return;
    /* Cancel connection on right-click */
    if (connectingFrom) {
      connectingFrom = null;
      draw();
      return;
    }
    var pos = getCanvasPos(e);
    var comp = hitTestComponent(pos.x, pos.y);
    if (comp) {
      ctxTargetComp = comp;
      ctxMenu.style.display = 'block';
      ctxMenu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
      ctxMenu.style.top = Math.min(e.clientY, window.innerHeight - 190) + 'px';
      return;
    }
    var ci = hitTestConnection(pos.x, pos.y);
    if (ci >= 0) {
      ctxTargetConn = ci;
      ctxConnMenu.style.display = 'block';
      ctxConnMenu.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
      ctxConnMenu.style.top = Math.min(e.clientY, window.innerHeight - 110) + 'px';
      return;
    }
    /* Empty canvas — show canvas context menu */
    var ctxCanvasMenu = document.getElementById('ctx-canvas-menu');
    if (ctxCanvasMenu) {
      var vw = window.innerWidth, vh = window.innerHeight;
      var mx = Math.min(e.clientX, vw - 180);
      var my = Math.min(e.clientY, vh - 100);
      ctxCanvasMenu.style.display = 'block';
      ctxCanvasMenu.style.left = mx + 'px';
      ctxCanvasMenu.style.top = my + 'px';
    }
  });

  document.addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    ctxConnMenu.style.display = 'none';
    var ctxCanvasMenu = document.getElementById('ctx-canvas-menu');
    if (ctxCanvasMenu) ctxCanvasMenu.style.display = 'none';
  });

  /* Canvas context menu actions */
  (function () {
    var ctxCanvasExport = document.getElementById('ctx-canvas-export');
    var ctxCanvasClear = document.getElementById('ctx-canvas-clear');
    if (ctxCanvasExport) ctxCanvasExport.addEventListener('click', function () {
      document.getElementById('ctx-canvas-menu').style.display = 'none';
      exportPNG();
    });
    if (ctxCanvasClear) ctxCanvasClear.addEventListener('click', function () {
      document.getElementById('ctx-canvas-menu').style.display = 'none';
      saveUndoState();
      components = []; connections = []; particles = [];
      selectedComp = null; selectedConn = -1; connectingFrom = null;
      if (running) stopSimulation();
      updateProperties();
      circuitDesc.style.display = 'none';
      draw();
    });
  })();

  document.getElementById('ctx-delete').addEventListener('click', function () {
    if (!ctxTargetComp) return;
    saveUndoState();
    var cid = ctxTargetComp.id;
    components = components.filter(function (c) { return c.id !== cid; });
    connections = connections.filter(function (cn) { return cn.from.compId !== cid && cn.to.compId !== cid; });
    if (selectedComp && selectedComp.id === cid) { selectedComp = null; updateProperties(); }
    draw();
  });

  document.getElementById('ctx-duplicate').addEventListener('click', function () {
    if (!ctxTargetComp) return;
    saveUndoState();
    var orig = ctxTargetComp;
    var vals = {};
    for (var k in orig.values) vals[k] = orig.values[k];
    var newC = { id: nextId++, type: orig.type, x: orig.x + 40, y: orig.y + 40, orient: orig.orient, values: vals, extension: 0, rotation: 0, reading: 0 };
    if (isLimitSwitch(orig.type)) newC.sName = getNextSName();
    components.push(newC);
    selectedComp = newC;
    updateProperties();
    draw();
  });

  document.getElementById('ctx-rotate').addEventListener('click', function () {
    if (!ctxTargetComp) return;
    saveUndoState();
    ctxTargetComp.orient = ctxTargetComp.orient ? 0 : 1;
    draw();
  });

  document.getElementById('ctx-info').addEventListener('click', function (e) {
    e.stopPropagation();
    ctxMenu.style.display = 'none';
    if (!ctxTargetComp) return;
    var def = COMP_DEFS[ctxTargetComp.type];

    /* Map component types to concept IDs */
    var conceptMap = {
      'air-supply': null, 'air-tank': null,
      'filter': 'frl-unit', 'regulator': 'frl-unit', 'frl': 'frl-unit',
      'v22-push': 'v32-valve',
      'v32-push': 'v32-valve', 'v32-roller': 'v32-valve', 'v32-idle': 'v32-valve',
      'v32-plunger': 'v32-valve', 'v32-solenoid': 'v32-valve',
      'v32-push-no': 'v32-valve', 'v32-roller-no': 'v32-valve',
      'v52-single': 'v52-valve', 'v52-double': 'v52-valve', 'v52-pilot': 'v52-valve',
      'v53-closed': 'v52-valve', 'v53-exhaust': 'v52-valve',
      'v53-pressure': 'v52-valve', 'v53-pilot-exhaust': 'v52-valve',
      'v43-closed': 'v52-valve', 'v43-exhaust': 'v52-valve',
      'flow-control': 'meter-out', 'throttle': 'meter-out',
      'quick-exhaust': 'quick-exhaust',
      'relief': null, 'sequence-valve': null,
      'check': null, 'shuttle': 'shuttle-valve', 'dual-pressure': 'and-valve',
      'cyl-sa': 'force-pressure', 'cyl-da': 'force-pressure',
      'cyl-rodless': 'force-pressure', 'rotary-act': 'force-pressure',
      'venturi': 'pick-place', 'suction-cup': 'pick-place',
      'timer-on': 'time-delay', 'timer-off': 'time-delay',
      'gauge': null, 'flow-meter': 'flow-speed', 'proximity': null,
      'limit-nc': 'v32-valve', 'limit-no': 'v32-valve',
      'silencer': null, 'tee': null
    };

    var conceptId = conceptMap[ctxTargetComp.type];
    var concept = conceptId ? CONCEPTS.find(function (c) { return c.id === conceptId; }) : null;

    var infoHtml = '<strong style="color:#00bcd4;font-size:1rem;">' + def.name + '</strong>';
    infoHtml += ' <span style="color:#667799;">(ID: ' + ctxTargetComp.id + ')</span><br>';

    /* Port info */
    if (def.ports && def.ports.length) {
      infoHtml += '<div style="margin-top:6px;font-size:0.82rem;color:#8899bb;">';
      infoHtml += '<strong>Ports:</strong> ';
      infoHtml += def.ports.map(function (p) { return p.label; }).join(', ');
      infoHtml += '</div>';
    }

    /* Current parameter values */
    if (ctxTargetComp.values && Object.keys(ctxTargetComp.values).length) {
      infoHtml += '<div style="margin-top:4px;font-size:0.82rem;color:#8899bb;">';
      for (var vk in ctxTargetComp.values) {
        var vLabel = (def.params[vk] && def.params[vk].label) || vk;
        infoHtml += '<div>' + vLabel + ': <span style="color:#42a5f5;">' + ctxTargetComp.values[vk] + '</span></div>';
      }
      infoHtml += '</div>';
    }

    /* Interaction hints for push buttons */
    if (ctxTargetComp.type === 'v22-nc' || ctxTargetComp.type === 'v32-push' || ctxTargetComp.type === 'v32-push-no') {
      infoHtml += '<div style="margin-top:8px;padding:8px 10px;border-radius:6px;background:rgba(66,165,245,0.08);border:1px solid rgba(66,165,245,0.2);font-size:0.82rem;color:#80d8ff;line-height:1.5;">';
      infoHtml += '<strong>Interaction:</strong><br>';
      infoHtml += '\u2022 <strong>Click & Hold</strong> \u2014 momentary press (opens while held)<br>';
      infoHtml += '\u2022 <strong>Shift+Click</strong> \u2014 latch (stays pressed until Shift+Click again)';
      infoHtml += '</div>';
    }

    if (concept) {
      infoHtml += '<div style="margin-top:8px;font-size:0.84rem;color:#99a8c0;line-height:1.5;">' + concept.desc.substring(0, 300);
      if (concept.desc.length > 300) infoHtml += '...';
      infoHtml += '</div>';
      if (concept.formula) {
        infoHtml += '<div style="margin-top:6px;font-family:monospace;color:#00bcd4;font-size:0.85rem;">' + concept.formula + '</div>';
      }
      infoHtml += '<div style="margin-top:8px;font-size:0.78rem;color:#667799;">Tip: Switch to <strong>Explore</strong> mode for full details.</div>';
    } else {
      /* Brief description for components without full Explore articles */
      var briefDescs = {
        'air-supply': 'Compressed air source. Sets the system pressure and flow rate for the entire circuit.',
        'air-tank': 'Air reservoir that stores compressed air to buffer pressure fluctuations and maintain steady supply.',
        'relief': 'Safety valve that opens to vent air when system pressure exceeds the set threshold, protecting downstream components.',
        'sequence-valve': 'Opens output port only when input pressure exceeds threshold. Used to sequence cylinder operations.',
        'check': 'One-way valve allowing flow in one direction only (In→Out). Prevents backflow.',
        'gauge': 'Pressure measurement instrument. Displays the local pressure at its tapping point.',
        'proximity': 'Proximity sensor for detecting piston position inside a cylinder.',
        'silencer': 'Exhaust muffler that reduces noise when compressed air is vented to atmosphere.',
        'tee': 'Three-way pipe junction for branching or combining pneumatic lines.'
      };
      var brief = briefDescs[ctxTargetComp.type];
      if (brief) {
        infoHtml += '<div style="margin-top:8px;font-size:0.84rem;color:#99a8c0;line-height:1.5;">' + brief + '</div>';
      }
    }

    /* Show in properties panel */
    propsPanel.style.display = 'block';
    propsBody.innerHTML = infoHtml;
  });

  document.getElementById('ctx-conn-delete').addEventListener('click', function () {
    if (ctxTargetConn < 0) return;
    saveUndoState();
    connections.splice(ctxTargetConn, 1);
    selectedConn = -1;
    draw();
  });

  document.getElementById('ctx-conn-clear-wp').addEventListener('click', function () {
    if (ctxTargetConn < 0) return;
    saveUndoState();
    delete connections[ctxTargetConn].waypoints;
    delete connections[ctxTargetConn]._dragOffset;
    draw();
  });

  /* Keyboard shortcuts */
  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
    if (mode !== 'simulate') return;

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); performUndo(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); performRedo(); return; }
    if (e.key === 'Escape') {
      if (panMode) { setPanMode(false); return; }
      if (connectingFrom) { connectingFrom = null; draw(); return; }
      var guideOverlay = document.getElementById('guide-overlay');
      if (guideOverlay && guideOverlay.style.display === 'flex') { guideOverlay.style.display = 'none'; e.stopPropagation(); return; }
    }
    /* Zoom shortcuts: Ctrl+= zoom in, Ctrl+- zoom out, Ctrl+0 reset, Ctrl+1 fit */
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomCentre(1.3); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); zoomCentre(1 / 1.3); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); viewOffX = 0; viewOffY = 0; viewScale = 1; draw(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '1') { e.preventDefault(); document.getElementById('btn-zoom-fit').click(); return; }
    /* H key toggles pan mode (Figma/Photoshop convention) */
    if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey) { setPanMode(!panMode); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedComp) {
        saveUndoState();
        var cid = selectedComp.id;
        components = components.filter(function (c) { return c.id !== cid; });
        connections = connections.filter(function (cn) { return cn.from.compId !== cid && cn.to.compId !== cid; });
        selectedComp = null;
        updateProperties();
        draw();
      } else if (selectedConn >= 0) {
        saveUndoState();
        connections.splice(selectedConn, 1);
        selectedConn = -1;
        draw();
      }
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      if (selectedComp) { saveUndoState(); selectedComp.orient = selectedComp.orient ? 0 : 1; draw(); }
      return;
    }
    if (e.key === 'd' || e.key === 'D') {
      if (selectedComp) {
        saveUndoState();
        var orig = selectedComp;
        var vals = {};
        for (var k in orig.values) vals[k] = orig.values[k];
        var newC = { id: nextId++, type: orig.type, x: orig.x + 40, y: orig.y + 40, orient: orig.orient, values: vals, extension: 0, rotation: 0, reading: 0 };
        components.push(newC);
        selectedComp = newC;
        updateProperties();
        draw();
      }
      return;
    }
    if (e.key === ' ') {
      e.preventDefault();
      if (running) stopSimulation();
      else startSimulation();
    }
  });

  /* Toolbar buttons */
  btnRun.addEventListener('click', startSimulation);
  btnStop.addEventListener('click', stopSimulation);
  btnClear.addEventListener('click', function () {
    saveUndoState();
    components = [];
    connections = [];
    particles = [];
    selectedComp = null;
    selectedConn = -1;
    connectingFrom = null;
    if (running) stopSimulation();
    updateProperties();
    circuitDesc.style.display = 'none';
    draw();
  });
  btnDelete.addEventListener('click', function () {
    if (selectedComp) {
      saveUndoState();
      var cid = selectedComp.id;
      components = components.filter(function (c) { return c.id !== cid; });
      connections = connections.filter(function (cn) { return cn.from.compId !== cid && cn.to.compId !== cid; });
      selectedComp = null;
      updateProperties();
      draw();
    }
  });
  document.getElementById('btn-rotate').addEventListener('click', function () {
    if (selectedComp) { saveUndoState(); selectedComp.orient = selectedComp.orient ? 0 : 1; draw(); }
  });
  document.getElementById('btn-undo').addEventListener('click', performUndo);
  document.getElementById('btn-redo').addEventListener('click', performRedo);

  /* Export PNG button */
  document.getElementById('canvas-export-btn').addEventListener('click', function () { exportPNG(); });

  /* Pre-built circuit tabs */
  prebuiltTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var circuit = pill.dataset.circuit;
    if (!circuit) return;
    prebuiltTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
    pill.classList.add('active');
    buildCircuit(circuit);
  });

  /* ================================================================
     PALETTE — Click to place + Drag-and-drop + Collapsible categories
     ================================================================ */

  var palette = document.getElementById('palette');

  /* Collapsible categories — accordion style */
  var catHeaders = palette.querySelectorAll('.palette-cat');
  /* Collapse all except first on init */
  catHeaders.forEach(function (h, i) {
    if (i > 0) h.classList.add('collapsed');
  });
  catHeaders.forEach(function (catHeader) {
    catHeader.addEventListener('click', function () {
      var wasCollapsed = catHeader.classList.contains('collapsed');
      /* Collapse all first (accordion) */
      catHeaders.forEach(function (h) { h.classList.add('collapsed'); });
      /* Toggle the clicked one */
      if (wasCollapsed) catHeader.classList.remove('collapsed');
    });
  });

  /* Click to place */
  palette.addEventListener('click', function (e) {
    var item = e.target.closest('.palette-item');
    if (!item) return;
    var type = item.dataset.type;
    if (!type) return;
    addComponent(type);
  });

  /* Drag and drop */
  palette.addEventListener('dragstart', function (e) {
    var item = e.target.closest('.palette-item');
    if (!item) return;
    e.dataTransfer.setData('text/plain', item.dataset.type);
    e.dataTransfer.effectAllowed = 'copy';
  });

  canvas.addEventListener('dragover', function (e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  canvas.addEventListener('drop', function (e) {
    e.preventDefault();
    var type = e.dataTransfer.getData('text/plain');
    var def = COMP_DEFS[type];
    if (!def) return;
    var pos = getCanvasPos(e);
    saveUndoState();
    var vals = {};
    for (var k in def.params) vals[k] = def.params[k].def;
    var x = Math.round((pos.x - def.w / 2) / 20) * 20;
    var y = Math.round((pos.y - def.h / 2) / 20) * 20;
    var comp = { id: nextId++, type: type, x: x, y: y, orient: 0, values: vals, extension: 0, rotation: 0, reading: 0 };
    if (isLimitSwitch(type)) comp.sName = getNextSName();
    components.push(comp);
    selectedComp = comp;
    updateProperties();
    draw();
  });

  /* Draw palette icons */
  function drawPaletteIcons() {
    var _dpr = window.devicePixelRatio || 1;
    palette.querySelectorAll('.palette-item').forEach(function (item) {
      var type = item.dataset.type;
      var def = COMP_DEFS[type];
      if (!def) return;
      var c = item.querySelector('canvas');
      if (!c) return;
      /* DPR backing store. These were fixed 36x36 bitmaps stretched by the
         browser on a retina display, so every component symbol in the palette
         rendered at 2x upscale. Size the backing to device pixels and scale
         the context, keeping the 36-unit logical space so the drawing code
         below is unchanged. */
      var _need = Math.round(36 * _dpr);
      if (c.width !== _need) {
        c.width = _need; c.height = _need;
        c.style.width = '36px'; c.style.height = '36px';
      }
      var pCtx = c.getContext('2d');
      var s = 36;
      pCtx.setTransform(_dpr, 0, 0, _dpr, 0, 0);
      pCtx.clearRect(0, 0, s, s);
      pCtx.fillStyle = '#0d1117';
      pCtx.fillRect(0, 0, s, s);
      pCtx.save();
      var scale = Math.min((s - 4) / def.w, (s - 4) / def.h) * 0.85;
      pCtx.translate(s / 2 - def.w * scale / 2, s / 2 - def.h * scale / 2);
      pCtx.scale(scale, scale);
      /* Temporarily swap ctx */
      var origCtx = ctx;
      ctx = pCtx;
      drawSymbol({ type: type, values: {}, extension: 0, rotation: 0, reading: 0 }, def);
      ctx = origCtx;
      pCtx.restore();
    });
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function switchMode(m) {
    mode = m;
    /* Leaving Simulate while running: stop cleanly so no stale running state */
    if (m !== 'simulate' && running) stopSimulation();
    simPanel.style.display = m === 'simulate' ? '' : 'none';
    catRow.style.display = m === 'explore' ? '' : 'none';
    itemSelector.style.display = m === 'explore' ? '' : 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = m === 'practice' ? '' : 'none';
    practiceBar.style.display = m === 'practice' ? '' : 'none';
    quizPanel.style.display = m === 'quiz' ? '' : 'none';
    quizBar.style.display = m === 'quiz' ? '' : 'none';
    quizResult.style.display = 'none';

    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });

    if (m === 'simulate') draw();
    if (m === 'explore') renderConceptGrid();
    if (m === 'practice') generateProblem();
    if (m === 'quiz') startQuiz();
  }

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    switchMode(pill.dataset.mode);
  });

  /* ================================================================
     EXPLORE SYMBOL RENDERING
     ================================================================ */

  var CONCEPT_SYMBOL_MAP = {
    'frl-unit': 'frl',
    'v52-valve': 'v52-single',
    'v32-valve': 'v32-push',
    'quick-exhaust': 'quick-exhaust',
    'shuttle-valve': 'shuttle',
    'and-valve': 'dual-pressure',
    'meter-out': 'flow-control',
    'auto-return': 'cyl-da',
    'cascade-sequence': 'v52-double',
    'time-delay': 'timer-on',
    'pick-place': 'venturi',
    'clamping': 'cyl-sa'
  };

  function drawExploreSymbol(parentEl, conceptId) {
    var compType = CONCEPT_SYMBOL_MAP[conceptId];
    if (!compType) return;
    var def = COMP_DEFS[compType];
    if (!def) return;

    var symCanvas = document.createElement('canvas');
    var scale = 2.2;
    var padX = 30, padY = 24;
    symCanvas.width = Math.max(280, def.w * scale + padX * 2);
    symCanvas.height = (def.h * scale + padY * 2 + 16);
    symCanvas.style.display = 'block';
    symCanvas.style.margin = '10px auto 6px';
    symCanvas.style.borderRadius = '6px';
    symCanvas.style.background = '#0a0e14';
    symCanvas.style.border = '1px solid #1a2535';

    var sCtx = symCanvas.getContext('2d');
    /* Swap global ctx temporarily */
    var origCtx = ctx;
    ctx = sCtx;
    var origRunning = running;
    running = false;

    sCtx.save();
    var offsetX = (symCanvas.width - def.w * scale) / 2;
    sCtx.translate(offsetX, padY);
    sCtx.scale(scale, scale);

    /* Create a dummy comp for drawing */
    var dummyComp = { id: -1, type: compType, x: 0, y: 0, values: {}, extension: 0.4, rotation: 0, reading: 120 };
    for (var key in def.params) dummyComp.values[key] = def.params[key].def;

    /* Draw the symbol using the existing dispatcher */
    drawSymbol(dummyComp, def);

    /* Draw port circles */
    for (var p = 0; p < def.ports.length; p++) {
      var port = def.ports[p];
      sCtx.beginPath();
      sCtx.arc(port.x, port.y, 3, 0, Math.PI * 2);
      sCtx.fillStyle = '#00bcd4';
      sCtx.fill();
    }

    sCtx.restore();

    /* Label under symbol */
    sCtx.fillStyle = '#667799';
    sCtx.font = '11px ' + _fontFamily;
    sCtx.textAlign = 'center';
    sCtx.fillText('ISO 1219 Symbol (as used in simulator)', symCanvas.width / 2, symCanvas.height - 6);

    /* Restore global ctx */
    ctx = origCtx;
    running = origRunning;

    parentEl.appendChild(symCanvas);
  }

  /* ================================================================
     EXPLORE UI
     ================================================================ */

  function renderConceptGrid() {
    conceptGrid.innerHTML = '';
    CONCEPTS.forEach(function (c) {
      if (c.cat !== exploreCat) return;
      var card = document.createElement('div');
      card.className = 'is-card' + (selectedConcept === c ? ' active' : '');
      card.innerHTML = '<div class="is-card-name">' + c.name + '</div><div class="is-card-symbol">' + c.formula + '</div>';
      card.addEventListener('click', function () {
        selectedConcept = c;
        renderConceptGrid();
        renderConceptInfo(c);
      });
      conceptGrid.appendChild(card);
    });
  }

  function renderConceptInfo(c) {
    itemInfo.style.display = '';
    var html = '<h3>' + c.name + ' (' + c.symbol + ')</h3>';
    html += '<div class="formula-box">' + c.formula + (c.unit !== '\u2014' ? ' [' + c.unit + ']' : '') + '</div>';

    /* Symbol canvas placeholder */
    if (CONCEPT_SYMBOL_MAP[c.id]) {
      html += '<div id="explore-symbol-slot"></div>';
    }

    html += '<p>' + c.desc + '</p>';

    /* Symbol description */
    if (c.symbol_desc) {
      html += '<div style="margin-top:12px;padding:10px 12px;background:rgba(0,188,212,0.08);border-left:3px solid #00bcd4;border-radius:4px;">';
      html += '<div style="font-weight:700;color:#00bcd4;font-size:0.82rem;margin-bottom:4px;">Standard Symbol</div>';
      html += '<div style="font-size:0.82rem;color:#c0c8d8;line-height:1.5;">' + c.symbol_desc + '</div>';
      html += '</div>';
    }

    /* Types & Variants */
    if (c.types && c.types.length) {
      html += '<div style="margin-top:12px;">';
      html += '<div style="font-weight:700;color:#a0b0d0;font-size:0.82rem;margin-bottom:6px;">Types &amp; Variants</div>';
      html += '<ul style="margin:0;padding-left:18px;font-size:0.82rem;color:#99a8c0;line-height:1.6;">';
      c.types.forEach(function (t) { html += '<li>' + t + '</li>'; });
      html += '</ul></div>';
    }

    /* Key parameters */
    if (c.params && c.params.length) {
      html += '<div style="margin-top:12px;">';
      html += '<div style="font-weight:700;color:#a0b0d0;font-size:0.82rem;margin-bottom:6px;">Key Parameters</div>';
      html += '<ul style="margin:0;padding-left:18px;font-size:0.82rem;color:#99a8c0;line-height:1.6;">';
      c.params.forEach(function (p) { html += '<li>' + p + '</li>'; });
      html += '</ul></div>';
    }

    /* Practical tips */
    if (c.tips && c.tips.length) {
      html += '<div style="margin-top:12px;padding:10px 12px;background:rgba(255,187,51,0.06);border-left:3px solid #ffbb33;border-radius:4px;">';
      html += '<div style="font-weight:700;color:#ffbb33;font-size:0.82rem;margin-bottom:6px;">Practical Tips</div>';
      html += '<ul style="margin:0;padding-left:18px;font-size:0.82rem;color:#b8b090;line-height:1.6;">';
      c.tips.forEach(function (t) { html += '<li>' + t + '</li>'; });
      html += '</ul></div>';
    }

    /* Worked example */
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4><p><strong>' + c.example.problem + '</strong></p>';
      c.example.steps.forEach(function (s) { html += '<div class="step">' + s + '</div>'; });
      if (c.example.answer) html += '<p><strong>Answer: ' + c.example.answer + ' ' + (c.example.unit || '') + '</strong></p>';
      html += '</div>';
    }
    itemInfo.innerHTML = html;

    /* Draw the actual simulator symbol into the slot */
    var slot = document.getElementById('explore-symbol-slot');
    if (slot) drawExploreSymbol(slot, c.id);
  }

  catTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    exploreCat = pill.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p.dataset.cat === exploreCat); });
    selectedConcept = null;
    itemInfo.style.display = 'none';
    renderConceptGrid();
  });

  /* ================================================================
     PRACTICE UI
     ================================================================ */

  function generateProblem() {
    var gen = PRACTICE[Math.floor(Math.random() * PRACTICE.length)];
    currentProblem = gen();
    practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) return;
    practiceAnswered = true;
    practiceTotal++;
    var diff = Math.abs(userVal - currentProblem.answer);
    var correct = diff <= currentProblem.tol;
    if (correct) {
      practiceCorrect++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback correct';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback wrong';
    }
    pbarScoreVal.textContent = practiceCorrect + ' / ' + practiceTotal;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';
    /* Show solution */
    ppSolution.style.display = '';
    ppSolution.innerHTML = '<strong>Solution:</strong><br>' + currentProblem.steps.join('<br>');
  });

  ppNext.addEventListener('click', generateProblem);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') ppCheck.click(); });

  /* ================================================================
     QUIZ UI
     ================================================================ */

  function startQuiz() {
    var shuffled = QUIZ_POOL.slice().sort(function () { return Math.random() - 0.5; });
    quizSet = shuffled.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    quizAnswers = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIdx >= quizSet.length) { showQuizResults(); return; }
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;

    var html = '<p class="q-prompt"><strong>Q' + (quizIdx + 1) + '.</strong> ' + q.q + '</p>';
    if (q.type === 'mcq') {
      html += '<div class="q-options">';
      q.opts.forEach(function (opt, oi) {
        html += '<div class="q-opt" data-idx="' + oi + '">' + opt + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="q-num-input"><input type="number" step="any" id="quiz-num-input" placeholder="Your answer"> <span>' + (q.unit || '') + '</span> <button class="btn btn-primary" id="quiz-num-check">Check</button></div>';
    }
    quizPanel.innerHTML = html;

    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.q-opt').forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var idx = parseInt(opt.dataset.idx);
          var correct = idx === q.ans;
          if (correct) { quizScore++; opt.classList.add('correct'); }
          else {
            opt.classList.add('wrong');
            quizPanel.querySelectorAll('.q-opt')[q.ans].classList.add('correct');
          }
          quizAnswers.push({ q: q.q, correct: correct });
          setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1200);
        });
      });
    } else {
      var numCheck = document.getElementById('quiz-num-check');
      var numInput = document.getElementById('quiz-num-input');
      if (numCheck) {
        numCheck.addEventListener('click', function () {
          if (quizAnswered) return;
          var val = parseFloat(numInput.value);
          if (isNaN(val)) return;
          quizAnswered = true;
          var correct = Math.abs(val - q.ans) <= (q.tol || 0.5);
          if (correct) { quizScore++; numCheck.textContent = 'Correct!'; numCheck.style.background = '#3ddc84'; }
          else { numCheck.textContent = 'Answer: ' + q.ans + ' ' + (q.unit || ''); numCheck.style.background = '#ff5555'; }
          quizAnswers.push({ q: q.q, correct: correct });
          setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1500);
        });
        numInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') numCheck.click(); });
        numInput.focus();
      }
    }
  }

  function showQuizResults() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';
    var pct = Math.round(quizScore / QUIZ_SIZE * 100);
    var html = '<h3>Quiz Complete!</h3><div class="score">' + quizScore + ' / ' + QUIZ_SIZE + ' (' + pct + '%)</div>';
    html += '<p style="margin-top:12px;color:#6b7a99;">' + (pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!') + '</p>';
    html += '<button class="btn btn-primary" style="margin-top:16px;" id="quiz-retry">Try Again</button>';
    quizResult.innerHTML = html;
    document.getElementById('quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     ANNOTATION SYSTEM — F1-F24 Canvas Marking Tools
     ================================================================ */

  /* ── World ↔ Screen coordinate conversion (screen = canvas CSS px) ── */
  function toSX(wx) { return wx * viewScale + viewOffX; }
  function toSY(wy) { return wy * viewScale + viewOffY; }
  function toWX(sx) { return (sx - viewOffX) / viewScale; }
  function toWY(sy) { return (sy - viewOffY) / viewScale; }

  /* ── Geometry helpers ── */
  function rotatePoint(px, py, cx, cy, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var dx = px - cx, dy = py - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }
  function unrotatePoint(px, py, cx, cy, angle) {
    if (!angle) return { x: px, y: py };
    return rotatePoint(px, py, cx, cy, -angle);
  }
  function distToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    var cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }
  function pointInPolygon(px, py, corners) {
    if (!corners || corners.length < 3) return false;
    var n = corners.length, inside = true;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var cross = (corners[i].x - corners[j].x) * (py - corners[j].y) -
                  (corners[i].y - corners[j].y) * (px - corners[j].x);
      if (i === 0) inside = cross >= 0;
      else if ((cross >= 0) !== inside) return false;
    }
    return true;
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r); c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
  }

  /* ── F17-F19: Export functions ── */
  function drawWatermark() {
    ctx.save();
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(139,157,195,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText('NHIT VisualLab', W - 12, H - 8);
    ctx.restore();
  }
  function exportCleanPNG() {
    var wasShow = showAnnotations;
    showAnnotations = false;
    draw();
    drawWatermark();
    var url = canvas.toDataURL('image/png');
    showAnnotations = wasShow;
    draw();
    var a = document.createElement('a');
    a.href = url; a.download = 'pneumatic-circuit-clean.png';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  /* ── Stroke rendering (F1) ── */
  function renderStroke(stroke) {
    var pts = stroke.points;
    if (pts.length < 2) return;
    var sRot = stroke.rotation || 0;
    if (sRot) {
      var sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
      for (var ri = 0; ri < pts.length; ri++) {
        var rpx = toSX(pts[ri].wx), rpy = toSY(pts[ri].wy);
        if (rpx < sMinX) sMinX = rpx; if (rpy < sMinY) sMinY = rpy;
        if (rpx > sMaxX) sMaxX = rpx; if (rpy > sMaxY) sMaxY = rpy;
      }
      var scx = (sMinX + sMaxX) / 2, scy = (sMinY + sMaxY) / 2;
      ctx.save(); ctx.translate(scx, scy); ctx.rotate(sRot); ctx.translate(-scx, -scy);
    }
    ctx.strokeStyle = stroke.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.9;
    var hasPressure = false;
    for (var k = 0; k < pts.length; k++) {
      if (pts[k].p > 0 && Math.abs(pts[k].p - 0.5) > 0.05) { hasPressure = true; break; }
    }
    if (!hasPressure) {
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(toSX(pts[0].wx), toSY(pts[0].wy));
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (toSX(pts[i].wx) + toSX(pts[i + 1].wx)) / 2;
        var my = (toSY(pts[i].wy) + toSY(pts[i + 1].wy)) / 2;
        ctx.quadraticCurveTo(toSX(pts[i].wx), toSY(pts[i].wy), mx, my);
      }
      ctx.lineTo(toSX(pts[pts.length - 1].wx), toSY(pts[pts.length - 1].wy));
      ctx.stroke();
    } else {
      for (var j = 1; j < pts.length; j++) {
        var p0 = pts[j - 1], p1 = pts[j];
        ctx.lineWidth = stroke.width * (0.4 + p1.p * 0.8);
        ctx.beginPath();
        ctx.moveTo(toSX(p0.wx), toSY(p0.wy));
        ctx.lineTo(toSX(p1.wx), toSY(p1.wy));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (sRot) ctx.restore();
  }

  /* ── Shape rendering (F2) ── */
  function drawArrowhead(x, y, angle, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size * 0.45); ctx.lineTo(-size, size * 0.45);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }

  function renderShape(s) {
    var x1 = toSX(s.wx1), y1 = toSY(s.wy1), x2 = toSX(s.wx2), y2 = toSY(s.wy2);
    var rot = s.rotation || 0;
    if (rot) {
      var rcx = (x1 + x2) / 2, rcy = (y1 + y2) / 2;
      ctx.save(); ctx.translate(rcx, rcy); ctx.rotate(rot); ctx.translate(-rcx, -rcy);
    }
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.9;
    var headSize = Math.max(10, s.width * 3);
    switch (s.type) {
      case 'line':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); break;
      case 'arrow':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        drawArrowhead(x2, y2, Math.atan2(y2 - y1, x2 - x1), headSize, s.color); break;
      case 'dblarrow':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        drawArrowhead(x2, y2, Math.atan2(y2 - y1, x2 - x1), headSize, s.color);
        drawArrowhead(x1, y1, Math.atan2(y1 - y2, x1 - x2), headSize, s.color); break;
      case 'rect':
        var rx = Math.min(x1, x2), ry = Math.min(y1, y2), rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fillRect(rx, ry, rw, rh); ctx.globalAlpha = 0.9; }
        ctx.strokeRect(rx, ry, rw, rh); break;
      case 'circle':
        var cdx = x2 - x1, cdy = y2 - y1, radius = Math.sqrt(cdx * cdx + cdy * cdy);
        ctx.beginPath(); ctx.arc(x1, y1, radius, 0, Math.PI * 2);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 0.9; }
        ctx.stroke(); break;
      case 'ellipse':
        var ecx = (x1 + x2) / 2, ecy = (y1 + y2) / 2, erx = Math.abs(x2 - x1) / 2, ery = Math.abs(y2 - y1) / 2;
        if (erx < 1 || ery < 1) break;
        ctx.beginPath(); ctx.ellipse(ecx, ecy, erx, ery, 0, 0, Math.PI * 2);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 0.9; }
        ctx.stroke(); break;
      case 'text':
        if (!s.text) break;
        var tbW = Math.abs(x2 - x1), tbH = Math.abs(y2 - y1);
        if (tbW < 4) tbW = 60; if (tbH < 4) tbH = 22;
        var fontSize = Math.max(8, Math.round(tbH * 0.64));
        ctx.font = 'bold ' + fontSize + 'px ' + _fontFamily;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        var tbX = Math.min(x1, x2), tbY = Math.min(y1, y2);
        ctx.fillStyle = 'rgba(13,17,23,0.85)'; ctx.strokeStyle = s.color; ctx.lineWidth = 1;
        roundRect(ctx, tbX, tbY, tbW, tbH, 5); ctx.fill(); ctx.stroke();
        ctx.fillStyle = s.color;
        ctx.fillText(s.text, tbX + 6, tbY + (tbH - fontSize) / 2);
        break;
    }
    ctx.globalAlpha = 1;
    if (rot) ctx.restore();
  }

  /* ── Draw all annotations ── */
  function drawAnnotations() {
    if (!showAnnotations) return;
    for (var i = 0; i < annStrokes.length; i++) renderStroke(annStrokes[i]);
    if (annActiveStroke) renderStroke(annActiveStroke);
    for (var j = 0; j < annShapes.length; j++) renderShape(annShapes[j]);
    if (annActiveShape) renderShape(annActiveShape);
    drawSelectionIndicator();
    drawCursorDot();
  }

  /* ── F21: Cursor dot ── */
  function drawCursorDot() {
    if (!annCursorPos) return;
    if (annTool !== 'sketch' && annTool !== 'shape') return;
    var color = annTool === 'sketch' ? sketchColor : shapeColor;
    var size = annTool === 'sketch' ? sketchWidth : shapeWidth;
    var r = Math.max(3, size);
    ctx.beginPath(); ctx.arc(annCursorPos.x, annCursorPos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.globalAlpha = 0.7; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* ── F7-F9: Selection system ── */
  function findNearestAnnotation(sx, sy) {
    var threshold = 15, best = null, bestDist = threshold;
    /* Shapes (reverse order — topmost wins) */
    for (var i = annShapes.length - 1; i >= 0; i--) {
      var s = annShapes[i];
      var x1 = toSX(s.wx1), y1 = toSY(s.wy1), x2 = toSX(s.wx2), y2 = toSY(s.wy2);
      var d = Infinity, lsx = sx, lsy = sy;
      if (s.rotation) {
        var scx = (x1 + x2) / 2, scy = (y1 + y2) / 2;
        var lp = unrotatePoint(sx, sy, scx, scy, s.rotation);
        lsx = lp.x; lsy = lp.y;
      }
      switch (s.type) {
        case 'line': case 'arrow': case 'dblarrow':
          d = distToSegment(lsx, lsy, x1, y1, x2, y2); break;
        case 'rect':
          var rrx = Math.min(x1, x2), rry = Math.min(y1, y2), rrw = Math.abs(x2 - x1), rrh = Math.abs(y2 - y1);
          if (lsx >= rrx - threshold && lsx <= rrx + rrw + threshold && lsy >= rry - threshold && lsy <= rry + rrh + threshold) {
            d = Math.min(Math.abs(lsx - rrx), Math.abs(lsx - rrx - rrw), Math.abs(lsy - rry), Math.abs(lsy - rry - rrh));
            if (s.filled && lsx >= rrx && lsx <= rrx + rrw && lsy >= rry && lsy <= rry + rrh) d = 0;
          } break;
        case 'circle':
          var cr = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
          var cd = Math.sqrt((lsx - x1) * (lsx - x1) + (lsy - y1) * (lsy - y1));
          d = Math.abs(cd - cr); if (s.filled && cd <= cr) d = 0; break;
        case 'ellipse':
          var eex = (x1 + x2) / 2, eey = (y1 + y2) / 2, eerx = Math.abs(x2 - x1) / 2, eery = Math.abs(y2 - y1) / 2;
          if (eerx > 0 && eery > 0) {
            var enorm = Math.sqrt(((lsx - eex) * (lsx - eex)) / (eerx * eerx) + ((lsy - eey) * (lsy - eey)) / (eery * eery));
            d = Math.abs(enorm - 1) * Math.min(eerx, eery); if (s.filled && enorm <= 1) d = 0;
          } break;
        case 'text':
          var ttx = Math.min(x1, x2), tty = Math.min(y1, y2), ttw = Math.abs(x2 - x1), tth = Math.abs(y2 - y1);
          if (ttw < 4) { ttw = 60; tth = 22; }
          if (lsx >= ttx - 4 && lsx <= ttx + ttw + 4 && lsy >= tty - 4 && lsy <= tty + tth + 4) d = 0; break;
      }
      if (d < bestDist) { bestDist = d; best = { type: 'shape', idx: i }; }
    }
    /* Strokes (reverse order) */
    for (var k = annStrokes.length - 1; k >= 0; k--) {
      var pts = annStrokes[k].points;
      for (var m = 1; m < pts.length; m++) {
        var sd = distToSegment(sx, sy, toSX(pts[m - 1].wx), toSY(pts[m - 1].wy), toSX(pts[m].wx), toSY(pts[m].wy));
        if (sd < bestDist) { bestDist = sd; best = { type: 'stroke', idx: k }; break; }
      }
    }
    return best;
  }

  function getSelectionBounds() {
    if (annSelectedIdx < 0) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var rot = 0, corners = null;
    if (annSelectedType === 'shape') {
      var s = annShapes[annSelectedIdx]; if (!s) return null;
      rot = s.rotation || 0;
      var sx1 = toSX(s.wx1), sy1 = toSY(s.wy1), sx2 = toSX(s.wx2), sy2 = toSY(s.wy2);
      var lMinX, lMinY, lMaxX, lMaxY;
      if (s.type === 'circle') {
        var r = Math.sqrt((sx2 - sx1) * (sx2 - sx1) + (sy2 - sy1) * (sy2 - sy1));
        lMinX = sx1 - r; lMinY = sy1 - r; lMaxX = sx1 + r; lMaxY = sy1 + r;
      } else {
        lMinX = Math.min(sx1, sx2); lMinY = Math.min(sy1, sy2);
        lMaxX = Math.max(sx1, sx2); lMaxY = Math.max(sy1, sy2);
      }
      var pad = 6; lMinX -= pad; lMinY -= pad; lMaxX += pad; lMaxY += pad;
      var cx = (lMinX + lMaxX) / 2, cy = (lMinY + lMaxY) / 2;
      var c0 = rotatePoint(lMinX, lMinY, cx, cy, rot);
      var c1 = rotatePoint(lMaxX, lMinY, cx, cy, rot);
      var c2 = rotatePoint(lMaxX, lMaxY, cx, cy, rot);
      var c3 = rotatePoint(lMinX, lMaxY, cx, cy, rot);
      corners = [c0, c1, c2, c3];
    } else if (annSelectedType === 'stroke') {
      var st = annStrokes[annSelectedIdx]; if (!st) return null;
      rot = st.rotation || 0;
      for (var i = 0; i < st.points.length; i++) {
        var px = toSX(st.points[i].wx), py = toSY(st.points[i].wy);
        if (px < minX) minX = px; if (py < minY) minY = py;
        if (px > maxX) maxX = px; if (py > maxY) maxY = py;
      }
      if (!isFinite(minX)) return null;
      var spad = 6; minX -= spad; minY -= spad; maxX += spad; maxY += spad;
      var scx = (minX + maxX) / 2, scy = (minY + maxY) / 2;
      if (rot) {
        var sc0 = rotatePoint(minX, minY, scx, scy, rot);
        var sc1 = rotatePoint(maxX, minY, scx, scy, rot);
        var sc2 = rotatePoint(maxX, maxY, scx, scy, rot);
        var sc3 = rotatePoint(minX, maxY, scx, scy, rot);
        corners = [sc0, sc1, sc2, sc3];
      } else {
        corners = [{x:minX,y:minY},{x:maxX,y:minY},{x:maxX,y:maxY},{x:minX,y:maxY}];
      }
    }
    if (!corners) return null;
    minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
    for (var ci = 0; ci < 4; ci++) {
      if (corners[ci].x < minX) minX = corners[ci].x;
      if (corners[ci].y < minY) minY = corners[ci].y;
      if (corners[ci].x > maxX) maxX = corners[ci].x;
      if (corners[ci].y > maxY) maxY = corners[ci].y;
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, rotation: rot, cx: (minX+maxX)/2, cy: (minY+maxY)/2, corners: corners };
  }

  function hitCorner(sx, sy, b) {
    if (!b || !b.corners) return null;
    var t = 12, labels = ['nw', 'ne', 'se', 'sw'];
    for (var ci = 0; ci < 4; ci++) {
      if (Math.abs(sx - b.corners[ci].x) < t && Math.abs(sy - b.corners[ci].y) < t) return labels[ci];
    }
    return null;
  }
  function hitBtn(sx, sy, btn) {
    if (!btn) return false;
    return sx >= btn.x - 4 && sx <= btn.x + btn.w + 4 && sy >= btn.y - 4 && sy <= btn.y + btn.h + 4;
  }

  /* ── Selection indicator drawing (F13) ── */
  function drawSelectionIndicator() {
    var b = getSelectionBounds();
    if (!b) { selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null }; return; }
    selectionUI.box = b;
    var c = b.corners;
    /* Dashed selection polygon */
    ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]); ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(c[0].x, c[0].y);
    ctx.lineTo(c[1].x, c[1].y); ctx.lineTo(c[2].x, c[2].y); ctx.lineTo(c[3].x, c[3].y);
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    /* Corner handles */
    var hs = 5; ctx.fillStyle = '#4fc3f7'; ctx.globalAlpha = 1;
    for (var chi = 0; chi < 4; chi++) ctx.fillRect(c[chi].x - hs, c[chi].y - hs, hs * 2, hs * 2);
    /* Action icons above selection */
    var iconSize = 24, gap = 6, totalW = iconSize * 3 + gap * 2;
    var icX, icY;
    if (lockIconPositions && selectionUI.deleteBtn) {
      icX = selectionUI.deleteBtn.x; icY = selectionUI.deleteBtn.y;
    } else {
      icX = (b.minX + b.maxX) / 2 - totalW / 2;
      icY = b.minY - iconSize - 8;
      if (icY < 2) icY = b.maxY + 8;
    }
    ctx.font = '12px ' + _fontFamily; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    /* Delete button */
    var delBtn = { x: icX, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1;
    roundRect(ctx, delBtn.x, delBtn.y, delBtn.w, delBtn.h, 5); ctx.fill(); ctx.stroke();
    var dx = delBtn.x + iconSize / 2, dy = delBtn.y + iconSize / 2;
    ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(dx - 5, dy - 4); ctx.lineTo(dx + 5, dy - 4);
    ctx.moveTo(dx - 4, dy - 3); ctx.lineTo(dx - 3, dy + 5); ctx.lineTo(dx + 3, dy + 5); ctx.lineTo(dx + 4, dy - 3);
    ctx.moveTo(dx - 1, dy - 2); ctx.lineTo(dx - 1, dy + 3);
    ctx.moveTo(dx + 1, dy - 2); ctx.lineTo(dx + 1, dy + 3);
    ctx.stroke();
    selectionUI.deleteBtn = delBtn;
    /* Duplicate button */
    var dupBtn = { x: icX + iconSize + gap, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1;
    roundRect(ctx, dupBtn.x, dupBtn.y, dupBtn.w, dupBtn.h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4fc3f7'; ctx.font = '13px ' + _fontFamily;
    ctx.fillText('\u2750', dupBtn.x + iconSize / 2, dupBtn.y + iconSize / 2);
    selectionUI.dupBtn = dupBtn;
    /* Rotate button */
    var rotBtn = { x: icX + (iconSize + gap) * 2, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1;
    roundRect(ctx, rotBtn.x, rotBtn.y, rotBtn.w, rotBtn.h, 5); ctx.fill(); ctx.stroke();
    var rrx = rotBtn.x + iconSize / 2, rry = rotBtn.y + iconSize / 2;
    ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(rrx, rry, 5, -Math.PI * 0.8, Math.PI * 0.5); ctx.stroke();
    ctx.beginPath(); var ax = rrx + 5 * Math.cos(Math.PI * 0.5), ay = rry + 5 * Math.sin(Math.PI * 0.5);
    ctx.moveTo(ax - 3, ay - 2); ctx.lineTo(ax, ay + 1); ctx.lineTo(ax + 3, ay - 2); ctx.stroke();
    selectionUI.rotateBtn = rotBtn;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  /* ── F11-F12: Delete, Duplicate, Rotate ── */
  function deleteSelectedAnnotation() {
    if (annSelectedIdx < 0) return;
    saveUndoState();
    if (annSelectedType === 'shape') annShapes.splice(annSelectedIdx, 1);
    else if (annSelectedType === 'stroke') annStrokes.splice(annSelectedIdx, 1);
    annSelectedIdx = -1; annSelectedType = '';
    selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
    draw();
  }
  function duplicateSelectedAnnotation() {
    if (annSelectedIdx < 0) return;
    saveUndoState();
    var offset = 20 / viewScale;
    if (annSelectedType === 'shape') {
      var orig = annShapes[annSelectedIdx]; if (!orig) return;
      var dup = JSON.parse(JSON.stringify(orig));
      dup.wx1 += offset; dup.wy1 += offset; dup.wx2 += offset; dup.wy2 += offset;
      annShapes.push(dup); annSelectedIdx = annShapes.length - 1;
    } else if (annSelectedType === 'stroke') {
      var origS = annStrokes[annSelectedIdx]; if (!origS) return;
      var dupS = JSON.parse(JSON.stringify(origS));
      for (var i = 0; i < dupS.points.length; i++) { dupS.points[i].wx += offset; dupS.points[i].wy += offset; }
      annStrokes.push(dupS); annSelectedIdx = annStrokes.length - 1;
    }
    draw();
  }
  function rotateSelectedAnnotation() {
    if (annSelectedIdx < 0) return;
    saveUndoState();
    if (annSelectedType === 'shape') {
      var s = annShapes[annSelectedIdx];
      if (s) s.rotation = ((s.rotation || 0) + Math.PI / 12) % (Math.PI * 2);
    } else if (annSelectedType === 'stroke') {
      var st = annStrokes[annSelectedIdx];
      if (st) st.rotation = ((st.rotation || 0) + Math.PI / 12) % (Math.PI * 2);
    }
    lockIconPositions = true; draw(); lockIconPositions = false;
  }

  /* ── F14: Text label creation ── */
  function createTextLabel(sx, sy) {
    var inp = document.getElementById('shape-text-input');
    if (!inp) return;
    inp.style.display = 'block';
    inp.style.left = sx + 'px'; inp.style.top = sy + 'px';
    inp.value = ''; inp.focus();
    var committed = false;
    function commit() {
      if (committed) return; committed = true;
      var txt = inp.value.trim();
      inp.style.display = 'none';
      inp.removeEventListener('keydown', onKey);
      inp.removeEventListener('blur', commit);
      document.removeEventListener('pointerdown', onOutside, true);
      if (!txt) { setAnnTool('move'); return; }
      saveUndoState();
      var wx = toWX(sx), wy = toWY(sy);
      ctx.font = 'bold 14px ' + _fontFamily;
      var tw = ctx.measureText(txt).width + 16;
      annShapes.push({
        type: 'text', wx1: wx, wy1: wy, wx2: wx + tw / viewScale, wy2: wy + 24 / viewScale,
        color: shapeColor, width: shapeWidth, filled: false, rotation: 0, text: txt
      });
      setAnnTool('move'); draw();
    }
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { inp.value = ''; commit(); }
    }
    function onOutside(e) { if (e.target !== inp) commit(); }
    inp.addEventListener('keydown', onKey);
    inp.addEventListener('blur', commit);
    document.addEventListener('pointerdown', onOutside, true);
  }

  /* ── F14: Edit existing text shape on double-click ── */
  function editTextShape(idx, shape) {
    var sx = toSX(shape.wx1), sy = toSY(shape.wy1);
    var inp = document.getElementById('shape-text-input');
    if (!inp) return;
    inp.style.display = 'block';
    inp.style.left = sx + 'px'; inp.style.top = sy + 'px';
    inp.value = shape.text || ''; inp.focus(); inp.select();
    var committed = false;
    function commit() {
      if (committed) return; committed = true;
      var txt = inp.value.trim();
      inp.style.display = 'none';
      inp.removeEventListener('keydown', onKey);
      inp.removeEventListener('blur', commit);
      document.removeEventListener('pointerdown', onOutside, true);
      if (txt) {
        saveUndoState();
        shape.text = txt;
        ctx.font = 'bold 14px ' + _fontFamily;
        var tw = ctx.measureText(txt).width + 16;
        shape.wx2 = shape.wx1 + tw / viewScale;
      }
      draw();
    }
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { inp.value = shape.text || ''; commit(); }
    }
    function onOutside(e) { if (e.target !== inp) commit(); }
    inp.addEventListener('keydown', onKey);
    inp.addEventListener('blur', commit);
    document.addEventListener('pointerdown', onOutside, true);
  }

  /* ── Tool switching ── */
  function setAnnTool(t) {
    if (panMode) setPanMode(false);
    annTool = t;
    annSelectedIdx = -1; annSelectedType = '';
    annActiveStroke = null; annActiveShape = null;
    var btns = document.querySelectorAll('#mark-bar .tool-btn[data-tool]');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === t);
    /* Set cursor based on active tool */
    if (t === 'sketch') canvas.style.cursor = PENCIL_CURSOR;
    else if (t === 'shape') canvas.style.cursor = 'crosshair';
    else canvas.style.cursor = '';
  }

  /* ── Wire marking toolbar (dropdowns, swatches, etc.) ── */
  function wireMarkBar() {
    /* Tool buttons */
    var btns = document.querySelectorAll('#mark-bar .tool-btn[data-tool]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        setAnnTool(this.getAttribute('data-tool'));
        draw();
      });
    }

    /* Sketch dropdown */
    var skToggle = document.getElementById('sketch-drop-toggle');
    var skDrop = document.getElementById('sketch-dropdown');
    var skBtn = document.querySelector('[data-tool="sketch"]');
    function positionDropdown(drop, toggle) {
      var r = toggle.getBoundingClientRect();
      drop.style.left = r.left + 'px';
      drop.style.top = (r.bottom + 4) + 'px';
    }
    if (skToggle && skDrop) {
      skToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var show = skDrop.style.display === 'none';
        skDrop.style.display = show ? '' : 'none';
        if (show) positionDropdown(skDrop, skToggle);
      });
      var skSwatches = skDrop.querySelectorAll('.swatch');
      for (var si = 0; si < skSwatches.length; si++) {
        (function (sw) {
          sw.addEventListener('click', function (e) {
            e.stopPropagation();
            sketchColor = sw.getAttribute('data-color');
            for (var j = 0; j < skSwatches.length; j++) skSwatches[j].classList.remove('active');
            sw.classList.add('active');
            if (skBtn) skBtn.style.setProperty('--sketch-color', sketchColor);
          });
        })(skSwatches[si]);
      }
      var skWidths = skDrop.querySelectorAll('.width-btn');
      for (var sw = 0; sw < skWidths.length; sw++) {
        (function (wb) {
          wb.addEventListener('click', function (e) {
            e.stopPropagation();
            sketchWidth = parseInt(wb.getAttribute('data-width'), 10) || 2;
            for (var k = 0; k < skWidths.length; k++) skWidths[k].classList.remove('active');
            wb.classList.add('active');
          });
        })(skWidths[sw]);
      }
      document.addEventListener('click', function (e) { if (!skDrop.contains(e.target) && e.target !== skToggle) skDrop.style.display = 'none'; });
    }

    /* Shape dropdown */
    var shToggle = document.getElementById('shape-drop-toggle');
    var shDrop = document.getElementById('shape-dropdown');
    var shBtn = document.querySelector('[data-tool="shape"]');
    var shapeIcons = { arrow: '➜', line: '╱', rect: '▭', circle: '◯', ellipse: '⬭', dblarrow: '⟷', text: 'T' };
    var iconEl = document.getElementById('shape-icon');
    if (shToggle && shDrop) {
      shToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var show = shDrop.style.display === 'none';
        shDrop.style.display = show ? '' : 'none';
        if (show) positionDropdown(shDrop, shToggle);
        if (skDrop) skDrop.style.display = 'none';
      });
      var picks = shDrop.querySelectorAll('.shape-pick');
      for (var p = 0; p < picks.length; p++) {
        (function (pk) {
          pk.addEventListener('click', function (e) {
            e.stopPropagation();
            shapeType = pk.getAttribute('data-shape');
            for (var q = 0; q < picks.length; q++) picks[q].classList.remove('active');
            pk.classList.add('active');
            if (iconEl) iconEl.textContent = shapeIcons[shapeType] || '▭';
            shDrop.style.display = 'none';
            setAnnTool('shape');
          });
        })(picks[p]);
      }
      var shSwatches = shDrop.querySelectorAll('.shape-colors .swatch');
      for (var sci = 0; sci < shSwatches.length; sci++) {
        (function (sw) {
          sw.addEventListener('click', function (e) {
            e.stopPropagation();
            shapeColor = sw.getAttribute('data-color');
            for (var j = 0; j < shSwatches.length; j++) shSwatches[j].classList.remove('active');
            sw.classList.add('active');
            if (shBtn) shBtn.style.setProperty('--shape-color', shapeColor);
          });
        })(shSwatches[sci]);
      }
      var shWidths = shDrop.querySelectorAll('.shape-widths .width-btn');
      for (var swi = 0; swi < shWidths.length; swi++) {
        (function (wb) {
          wb.addEventListener('click', function (e) {
            e.stopPropagation();
            shapeWidth = parseInt(wb.getAttribute('data-width'), 10) || 2;
            for (var k = 0; k < shWidths.length; k++) shWidths[k].classList.remove('active');
            wb.classList.add('active');
          });
        })(shWidths[swi]);
      }
      var fillBtns = shDrop.querySelectorAll('.fill-btn');
      for (var fi = 0; fi < fillBtns.length; fi++) {
        (function (fb) {
          fb.addEventListener('click', function (e) {
            e.stopPropagation();
            shapeFilled = fb.getAttribute('data-fill') === 'true';
            for (var m = 0; m < fillBtns.length; m++) fillBtns[m].classList.remove('active');
            fb.classList.add('active');
          });
        })(fillBtns[fi]);
      }
      document.addEventListener('click', function (e) { if (!shDrop.contains(e.target) && e.target !== shToggle) shDrop.style.display = 'none'; });
    }

    /* F15: Annotation toggle */
    var btnToggle = document.getElementById('btn-toggle-annotations');
    if (btnToggle) {
      btnToggle.addEventListener('click', function () {
        showAnnotations = !showAnnotations;
        btnToggle.classList.toggle('active', showAnnotations);
        btnToggle.textContent = showAnnotations ? '👁' : '🚫';
        btnToggle.title = showAnnotations ? 'Hide Annotations' : 'Show Annotations';
        draw();
      });
    }

    /* F16: Clear annotations dialog */
    var btnClearAnn = document.getElementById('btn-clear-annotations');
    var clearOverlay = document.getElementById('clear-ann-confirm');
    var clearSelect = document.getElementById('clear-ann-category');
    var clearHint = document.getElementById('clear-ann-hint');
    var clearNo = document.getElementById('clear-ann-no');
    var clearYes = document.getElementById('clear-ann-yes');
    var hints = {
      all: 'Removes all sketches, shapes, and text annotations.',
      sketches: 'Removes freehand sketch strokes only.',
      shapes: 'Removes geometric shapes and text labels only.'
    };
    if (btnClearAnn && clearOverlay) {
      if (clearSelect && clearHint) {
        clearSelect.addEventListener('change', function () { clearHint.textContent = hints[clearSelect.value] || ''; });
      }
      btnClearAnn.addEventListener('click', function () {
        if (!annStrokes.length && !annShapes.length) return;
        if (clearSelect) clearSelect.value = 'all';
        if (clearHint) clearHint.textContent = hints.all;
        clearOverlay.style.display = '';
      });
      if (clearNo) clearNo.addEventListener('click', function () { clearOverlay.style.display = 'none'; });
      if (clearYes) clearYes.addEventListener('click', function () {
        saveUndoState();
        var cat = clearSelect ? clearSelect.value : 'all';
        if (cat === 'all' || cat === 'sketches') { annStrokes = []; annActiveStroke = null; }
        if (cat === 'all' || cat === 'shapes') { annShapes = []; annActiveShape = null; }
        annSelectedIdx = -1; annSelectedType = '';
        clearOverlay.style.display = 'none'; draw();
      });
      clearOverlay.addEventListener('click', function (e) { if (e.target === clearOverlay) clearOverlay.style.display = 'none'; });
    }

    /* F19: Export clean context menu */
    var ctxCanvasExportClean = document.getElementById('ctx-canvas-export-clean');
    if (ctxCanvasExportClean) {
      ctxCanvasExportClean.addEventListener('click', function () {
        document.getElementById('ctx-canvas-menu').style.display = 'none';
        exportCleanPNG();
      });
    }
  }

  /* ── F20: Fullscreen ── */
  function wireFullscreen() {
    var btn = document.getElementById('btn-fullscreen');
    var card = document.getElementById('sim-panel');
    if (!btn || !card) return;
    function isFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function enterFS() {
      if (card.requestFullscreen) card.requestFullscreen();
      else if (card.webkitRequestFullscreen) card.webkitRequestFullscreen();
    }
    function exitFS() {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    function onFSChange() {
      if (isFS()) {
        card.classList.add('is-fullscreen');
        btn.textContent = '✕'; btn.title = 'Exit Fullscreen';
      } else {
        card.classList.remove('is-fullscreen');
        btn.textContent = '⛶'; btn.title = 'Fullscreen';
      }
      /* Double-rAF: first frame applies CSS layout, second reads final dimensions */
      requestAnimationFrame(function () { requestAnimationFrame(resizeCanvas); });
    }
    btn.addEventListener('click', function () { if (isFS()) exitFS(); else enterFS(); });
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('webkitfullscreenchange', onFSChange);
  }

  /* ── Zoom/Pan helpers (IIFE scope so keyboard shortcuts can use them) ── */
  function zoomCentre(factor) {
    var cx = W / 2, cy = H / 2;
    var newScale = viewScale * factor;
    if (newScale < 0.3 || newScale > 5) return;
    viewOffX = cx - (cx - viewOffX) * factor;
    viewOffY = cy - (cy - viewOffY) * factor;
    viewScale = newScale;
    draw();
  }

  function setPanMode(on) {
    panMode = on;
    if (on) { annTool = 'move'; annSelectedIdx = -1; annSelectedType = ''; annActiveStroke = null; annActiveShape = null;
      var btns = document.querySelectorAll('#mark-bar .tool-btn[data-tool]');
      for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === 'move');
    }
    var btn = document.getElementById('btn-pan-toggle');
    if (btn) btn.classList.toggle('active', panMode);
    canvas.style.cursor = panMode ? 'grab' : '';
  }

  /* ── F24: Zoom/Pan (Ctrl+Wheel = zoom, Ctrl+drag = pan) ── */
  function wireZoomPan() {
    canvas.addEventListener('wheel', function (e) {
      /* Only zoom when Ctrl/Cmd held — page scrolls normally otherwise */
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var mx = e.clientX - rect.left, my = e.clientY - rect.top;
      var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      var newScale = viewScale * factor;
      if (newScale < 0.3 || newScale > 5) return;
      /* Zoom towards mouse position */
      viewOffX = mx - (mx - viewOffX) * factor;
      viewOffY = my - (my - viewOffY) * factor;
      viewScale = newScale;
      draw();
    }, { passive: false });

    /* Touch pinch zoom for canvas (2-finger only, 1-finger = normal scroll) */
    var lastTouchDist = 0, lastTouchMid = null, touchIds = [];
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        touchIds = [e.touches[0].identifier, e.touches[1].identifier];
        var dx = e.touches[1].clientX - e.touches[0].clientX;
        var dy = e.touches[1].clientY - e.touches[0].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
        lastTouchMid = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', function (e) {
      if (e.touches.length === 2 && lastTouchDist > 0) {
        e.preventDefault();
        var dx = e.touches[1].clientX - e.touches[0].clientX;
        var dy = e.touches[1].clientY - e.touches[0].clientY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var mid = { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
        var rect = canvas.getBoundingClientRect();
        var mx = mid.x - rect.left, my = mid.y - rect.top;
        var factor = dist / lastTouchDist;
        var newScale = viewScale * factor;
        if (newScale >= 0.3 && newScale <= 5) {
          viewOffX = mx - (mx - viewOffX) * factor;
          viewOffY = my - (my - viewOffY) * factor;
          viewScale = newScale;
        }
        /* Pan */
        if (lastTouchMid) {
          viewOffX += (mid.x - lastTouchMid.x);
          viewOffY += (mid.y - lastTouchMid.y);
        }
        lastTouchDist = dist;
        lastTouchMid = mid;
        draw();
      }
    }, { passive: false });
    canvas.addEventListener('touchend', function () { lastTouchDist = 0; lastTouchMid = null; touchIds = []; });

    /* Zoom toolbar buttons */
    var btnZIn = document.getElementById('btn-zoom-in');
    var btnZOut = document.getElementById('btn-zoom-out');
    var btnZReset = document.getElementById('btn-zoom-reset');
    var btnZFit = document.getElementById('btn-zoom-fit');
    var btnPan = document.getElementById('btn-pan-toggle');

    if (btnZIn) btnZIn.addEventListener('click', function () { zoomCentre(1.3); });
    if (btnZOut) btnZOut.addEventListener('click', function () { zoomCentre(1 / 1.3); });
    if (btnZReset) btnZReset.addEventListener('click', function () {
      viewOffX = 0; viewOffY = 0; viewScale = 1; draw();
    });
    if (btnZFit) btnZFit.addEventListener('click', function () {
      if (components.length === 0) { viewOffX = 0; viewOffY = 0; viewScale = 1; draw(); return; }
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (var i = 0; i < components.length; i++) {
        var c = components[i], ed = getEffectiveDims(c);
        if (c.x < minX) minX = c.x;
        if (c.y < minY) minY = c.y;
        if (c.x + ed.w > maxX) maxX = c.x + ed.w;
        if (c.y + ed.h > maxY) maxY = c.y + ed.h;
      }
      var pad = 40;
      minX -= pad; minY -= pad; maxX += pad; maxY += pad;
      var rangeX = maxX - minX, rangeY = maxY - minY;
      var scaleX = W / rangeX, scaleY = H / rangeY;
      var fitScale = Math.min(scaleX, scaleY, 3);
      viewScale = fitScale;
      viewOffX = (W - rangeX * fitScale) / 2 - minX * fitScale;
      viewOffY = (H - rangeY * fitScale) / 2 - minY * fitScale;
      draw();
    });
    if (btnPan) btnPan.addEventListener('click', function () { setPanMode(!panMode); });

    /* Right-click on canvas toggles pan mode */
    canvas.addEventListener('contextmenu', function (e) {
      if (mode !== 'simulate') return;
      /* Only toggle pan if no circuit context menu is about to open */
      var pos = getCanvasPos(e);
      var hComp = hitTestComponent(pos.x, pos.y);
      var hConn = hitTestConnection(pos.x, pos.y);
      if (hComp || hConn >= 0) return; /* Let circuit context menu handle it */
      e.preventDefault();
      setPanMode(!panMode);
    });
  }

  /* ── Annotation pointer events on canvas ── */
  function getCanvasPosSafe(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onAnnPointerDown(e) {
    if (mode !== 'simulate') return;
    annConsumed = false;

    /* Pan mode — intercept before annotation handling */
    if (annTool === 'move' && panMode) {
      var pp = getCanvasPosSafe(e);
      isPanning = true; panStartX = pp.x; panStartY = pp.y; panOffX0 = viewOffX; panOffY0 = viewOffY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      annConsumed = true; e.preventDefault(); return;
    }

    if (annTool === 'move' && !e.ctrlKey && !e.metaKey) {
      /* Handle annotation interactions first */
      var pos = getCanvasPosSafe(e);
      /* Action icon clicks */
      if (annSelectedIdx >= 0) {
        if (hitBtn(pos.x, pos.y, selectionUI.deleteBtn)) { deleteSelectedAnnotation(); annConsumed = true; e.preventDefault(); return; }
        if (hitBtn(pos.x, pos.y, selectionUI.dupBtn)) { duplicateSelectedAnnotation(); annConsumed = true; e.preventDefault(); return; }
        if (hitBtn(pos.x, pos.y, selectionUI.rotateBtn)) { rotateSelectedAnnotation(); annConsumed = true; e.preventDefault(); return; }
        /* Corner resize */
        var bounds = getSelectionBounds();
        var corner = hitCorner(pos.x, pos.y, bounds);
        if (corner) {
          saveUndoState();
          annDrag = { type: annSelectedType, idx: annSelectedIdx, lastX: pos.x, lastY: pos.y, corner: corner };
          canvas.setPointerCapture(e.pointerId);
          annConsumed = true; e.preventDefault(); return;
        }
        /* Inside selection box → move */
        if (bounds && bounds.corners && pointInPolygon(pos.x, pos.y, bounds.corners)) {
          saveUndoState();
          annDrag = { type: annSelectedType, idx: annSelectedIdx, lastX: pos.x, lastY: pos.y, corner: null };
          canvas.setPointerCapture(e.pointerId);
          canvas.style.cursor = 'move';
          annConsumed = true; e.preventDefault(); return;
        }
      }
      /* Hit-test annotations */
      var hit = findNearestAnnotation(pos.x, pos.y);
      if (hit) {
        annSelectedIdx = hit.idx; annSelectedType = hit.type;
        saveUndoState();
        annDrag = { type: hit.type, idx: hit.idx, lastX: pos.x, lastY: pos.y, corner: null };
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'move';
        draw(); annConsumed = true; e.preventDefault(); return;
      }
      /* Deselect annotations */
      if (annSelectedIdx >= 0) {
        annSelectedIdx = -1; annSelectedType = '';
        draw();
      }
      return; /* Let normal handler take over for circuit interactions */
    }

    /* Ctrl+drag = pan, or panMode active */
    if (annTool === 'move' && (e.ctrlKey || e.metaKey || panMode)) {
      var pp = getCanvasPosSafe(e);
      isPanning = true; panStartX = pp.x; panStartY = pp.y; panOffX0 = viewOffX; panOffY0 = viewOffY;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = 'grabbing';
      annConsumed = true; e.preventDefault(); return;
    }

    /* Sketch tool */
    if (annTool === 'sketch') {
      var sp = getCanvasPosSafe(e);
      saveUndoState();
      annActiveStroke = {
        points: [{ wx: toWX(sp.x), wy: toWY(sp.y), p: e.pressure || 0.5 }],
        color: sketchColor, width: sketchWidth, rotation: 0
      };
      canvas.setPointerCapture(e.pointerId);
      annConsumed = true; e.preventDefault(); return;
    }

    /* Shape tool */
    if (annTool === 'shape') {
      var shp = getCanvasPosSafe(e);
      if (shapeType === 'text') {
        createTextLabel(shp.x, shp.y);
        annConsumed = true; e.preventDefault(); return;
      }
      saveUndoState();
      var swx = toWX(shp.x), swy = toWY(shp.y);
      annActiveShape = {
        type: shapeType, wx1: swx, wy1: swy, wx2: swx, wy2: swy,
        color: shapeColor, width: shapeWidth, filled: shapeFilled, rotation: 0
      };
      canvas.setPointerCapture(e.pointerId);
      annConsumed = true; e.preventDefault(); return;
    }
  }

  function onAnnPointerMove(e) {
    if (mode !== 'simulate') return;
    var pos = getCanvasPosSafe(e);
    annCursorPos = pos;

    /* Pan */
    if (isPanning) {
      viewOffX = panOffX0 + (pos.x - panStartX);
      viewOffY = panOffY0 + (pos.y - panStartY);
      draw(); return;
    }

    /* Annotation drag */
    if (annDrag) {
      var dx = pos.x - annDrag.lastX, dy = pos.y - annDrag.lastY;
      var dwx = dx / viewScale, dwy = dy / viewScale;
      if (annDrag.corner) {
        /* Resize */
        var nowWx = toWX(pos.x), nowWy = toWY(pos.y);
        if (annDrag.type === 'shape') {
          var rsh = annShapes[annDrag.idx];
          if (rsh) {
            var c = annDrag.corner;
            if (c === 'nw') { rsh.wx1 = nowWx; rsh.wy1 = nowWy; }
            else if (c === 'ne') { rsh.wx2 = nowWx; rsh.wy1 = nowWy; }
            else if (c === 'sw') { rsh.wx1 = nowWx; rsh.wy2 = nowWy; }
            else if (c === 'se') { rsh.wx2 = nowWx; rsh.wy2 = nowWy; }
          }
        }
      } else {
        /* Move */
        if (annDrag.type === 'shape') {
          var ms = annShapes[annDrag.idx];
          if (ms) { ms.wx1 += dwx; ms.wy1 += dwy; ms.wx2 += dwx; ms.wy2 += dwy; }
        } else if (annDrag.type === 'stroke') {
          var mst = annStrokes[annDrag.idx];
          if (mst) { for (var i = 0; i < mst.points.length; i++) { mst.points[i].wx += dwx; mst.points[i].wy += dwy; } }
        }
      }
      annDrag.lastX = pos.x; annDrag.lastY = pos.y;
      draw(); return;
    }

    /* Active sketch */
    if (annTool === 'sketch' && annActiveStroke) {
      annActiveStroke.points.push({ wx: toWX(pos.x), wy: toWY(pos.y), p: e.pressure || 0.5 });
      draw(); return;
    }

    /* Active shape preview */
    if (annTool === 'shape' && annActiveShape) {
      annActiveShape.wx2 = toWX(pos.x); annActiveShape.wy2 = toWY(pos.y);
      draw(); return;
    }

    /* F22: Hover cursor feedback in move mode */
    if (annTool === 'move' && !panMode && !e.ctrlKey && !e.metaKey) {
      var hBounds = getSelectionBounds();
      var hCorner = hitCorner(pos.x, pos.y, hBounds);
      if (hCorner) {
        canvas.style.cursor = (hCorner === 'nw' || hCorner === 'se') ? 'nwse-resize' : 'nesw-resize';
      } else if (hitBtn(pos.x, pos.y, selectionUI.deleteBtn) || hitBtn(pos.x, pos.y, selectionUI.dupBtn) || hitBtn(pos.x, pos.y, selectionUI.rotateBtn)) {
        canvas.style.cursor = 'pointer';
      } else if (hBounds && hBounds.corners && pointInPolygon(pos.x, pos.y, hBounds.corners)) {
        canvas.style.cursor = 'move';
      } else if (findNearestAnnotation(pos.x, pos.y)) {
        canvas.style.cursor = 'move';
      }
      /* Don't override — let the original handler set cursor for circuit elements */
    }

    if (annTool === 'sketch' || annTool === 'shape') {
      draw(); /* Redraw for cursor dot */
    }
  }

  function onAnnPointerUp(e) {
    /* Pan end */
    if (isPanning) {
      isPanning = false; canvas.style.cursor = panMode ? 'grab' : ''; return;
    }
    /* Annotation drag end */
    if (annDrag) {
      annDrag = null; canvas.style.cursor = 'crosshair'; draw(); return;
    }
    /* Finalize sketch — stay in sketch mode for continuous drawing */
    if (annTool === 'sketch' && annActiveStroke) {
      if (annActiveStroke.points.length > 1) annStrokes.push(annActiveStroke);
      annActiveStroke = null;
      canvas.style.cursor = PENCIL_CURSOR;
      draw(); return;
    }
    /* Finalize shape */
    if (annTool === 'shape' && annActiveShape) {
      var sdx = toSX(annActiveShape.wx2) - toSX(annActiveShape.wx1);
      var sdy = toSY(annActiveShape.wy2) - toSY(annActiveShape.wy1);
      if (Math.abs(sdx) > 3 || Math.abs(sdy) > 3) annShapes.push(annActiveShape);
      annActiveShape = null;
      setAnnTool('move'); draw(); return;
    }
  }

  /* Init annotations: wire toolbar, fullscreen, zoom/pan. Canvas events handled inline below. */
  function initAnnotations() {
    wireMarkBar();
    wireFullscreen();
    wireZoomPan();
  }

  /* ================================================================
     USER GUIDE MODAL
     ================================================================ */

  (function () {
    var overlay = document.getElementById('guide-overlay');
    var btnOpen = document.getElementById('btn-guide');
    var btnClose = document.getElementById('guide-close');
    if (!overlay || !btnOpen) return;
    btnOpen.addEventListener('click', function () { overlay.style.display = 'flex'; });
    if (btnClose) btnClose.addEventListener('click', function () { overlay.style.display = 'none'; });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.style.display = 'none'; });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.style.display === 'flex') { overlay.style.display = 'none'; e.stopPropagation(); }
    });
  })();

  /* ================================================================
     SAVE / LOAD / EXPORT / IMPORT  (multi-slot)
     ================================================================ */
  (function () {
    var STORAGE_KEY = 'mechsim.pneumatic.circuits.v2';   /* { name: {savedAt, data} } */
    var SCHEMA = 'mechsim.pneumatic.v1';

    function showToast(msg, kind) {
      var t = document.getElementById('_circuit-toast');
      if (!t) {
        t = document.createElement('div');
        t.id = '_circuit-toast';
        t.className = 'toast';
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.className = 'toast show' + (kind === 'error' ? ' toast-error' : (kind === 'success' ? ' toast-success' : ''));
      clearTimeout(t._tid);
      t._tid = setTimeout(function () { t.className = 'toast'; }, 2200);
    }

    function deepClone(v) { return JSON.parse(JSON.stringify(v)); }

    function serialize() {
      return {
        schema: SCHEMA,
        savedAt: new Date().toISOString(),
        view: { offX: viewOffX, offY: viewOffY, scale: viewScale },
        components: components.map(function (c) {
          return { id: c.id, type: c.type, x: c.x, y: c.y, orient: c.orient || 0, values: deepClone(c.values || {}) };
        }),
        connections: connections.map(function (cn) {
          var out = { from: { compId: cn.from.compId, portIdx: cn.from.portIdx }, to: { compId: cn.to.compId, portIdx: cn.to.portIdx } };
          if (cn.waypoints && cn.waypoints.length) out.waypoints = deepClone(cn.waypoints);
          return out;
        })
      };
    }

    function validate(data) {
      if (!data || typeof data !== 'object') return 'Not a valid circuit file';
      if (data.schema !== SCHEMA) return 'Unrecognised schema (expected ' + SCHEMA + ')';
      if (!Array.isArray(data.components) || !Array.isArray(data.connections)) return 'Missing components or connections';
      for (var i = 0; i < data.components.length; i++) {
        var c = data.components[i];
        if (typeof c.id !== 'number' || typeof c.type !== 'string' || typeof c.x !== 'number' || typeof c.y !== 'number') {
          return 'Component ' + i + ' has invalid fields';
        }
      }
      for (var j = 0; j < data.connections.length; j++) {
        var cn = data.connections[j];
        if (!cn.from || !cn.to || typeof cn.from.compId !== 'number' || typeof cn.to.compId !== 'number') {
          return 'Connection ' + j + ' has invalid endpoints';
        }
      }
      return null;
    }

    function restore(data) {
      if (running) stopSimulation();
      if (typeof saveUndoState === 'function') saveUndoState();
      components = data.components.map(function (c) {
        return {
          id: c.id, type: c.type, x: c.x, y: c.y, orient: c.orient || 0,
          values: deepClone(c.values || {}),
          extension: 0, rotation: 0, reading: 0
        };
      });
      connections = data.connections.map(function (cn) {
        var out = {
          from: { compId: cn.from.compId, portIdx: cn.from.portIdx },
          to:   { compId: cn.to.compId,   portIdx: cn.to.portIdx   },
          pressure: 0, flow: 0, flowDir: 0
        };
        if (cn.waypoints && cn.waypoints.length) out.waypoints = deepClone(cn.waypoints);
        return out;
      });
      var maxId = 0;
      for (var i = 0; i < components.length; i++) if (components[i].id > maxId) maxId = components[i].id;
      nextId = maxId + 1;
      particles = [];
      if (typeof prevExtensions !== 'undefined') prevExtensions = {};
      selectedComp = null;
      if (typeof selectedConn !== 'undefined') selectedConn = -1;
      if (typeof connectingFrom !== 'undefined') connectingFrom = null;
      if (data.view) {
        viewOffX = +data.view.offX || 0;
        viewOffY = +data.view.offY || 0;
        viewScale = +data.view.scale || 1;
      }
      if (typeof updateProperties === 'function') updateProperties();
      draw();
    }

    function readSlots() {
      var slots = {};
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { var parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object') slots = parsed; }
      } catch (e) { /* ignore */ }
      return slots;
    }
    function writeSlots(slots) { localStorage.setItem(STORAGE_KEY, JSON.stringify(slots)); }

    function defaultSaveName() {
      var d = new Date();
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      return 'Circuit ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
           + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function fmtDate(iso) {
      try { var d = new Date(iso); if (isNaN(d.getTime())) return iso || ''; return d.toLocaleString(); }
      catch (e) { return iso || ''; }
    }

    var btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', function () {
      if (!components.length) { showToast('Nothing to save — canvas is empty', 'error'); return; }
      var slots = readSlots();
      var name = prompt('Save circuit as:', defaultSaveName());
      if (name === null) return;
      name = String(name).trim();
      if (!name) { showToast('Name cannot be empty', 'error'); return; }
      if (name.length > 60) name = name.slice(0, 60);
      if (slots[name] && !confirm('A circuit named "' + name + '" already exists. Overwrite?')) return;
      try {
        slots[name] = { savedAt: new Date().toISOString(), data: serialize() };
        writeSlots(slots);
        showToast('Saved as "' + name + '"', 'success');
      } catch (err) { showToast('Save failed: ' + (err && err.message ? err.message : 'storage error'), 'error'); }
    });

    var btnLoad = document.getElementById('btn-load');
    var pickerOverlay = document.getElementById('load-picker-overlay');
    var pickerList    = document.getElementById('load-picker-list');
    var pickerEmpty   = document.getElementById('load-picker-empty');
    var pickerClose   = document.getElementById('load-picker-close');

    function renderPicker() {
      if (!pickerList) return;
      var slots = readSlots();
      var names = Object.keys(slots).sort(function (a, b) {
        return (slots[b].savedAt || '').localeCompare(slots[a].savedAt || '');
      });
      pickerList.innerHTML = '';
      if (!names.length) {
        pickerList.style.display = 'none';
        if (pickerEmpty) pickerEmpty.style.display = '';
        return;
      }
      pickerList.style.display = '';
      if (pickerEmpty) pickerEmpty.style.display = 'none';
      names.forEach(function (n) {
        var rec = slots[n];
        var compCount = (rec.data && rec.data.components) ? rec.data.components.length : 0;
        var connCount = (rec.data && rec.data.connections) ? rec.data.connections.length : 0;
        var row = document.createElement('div'); row.className = 'saved-item';
        var info = document.createElement('div'); info.className = 'saved-item-info';
        var nameEl = document.createElement('div'); nameEl.className = 'saved-item-name'; nameEl.textContent = n;
        var metaEl = document.createElement('div'); metaEl.className = 'saved-item-meta';
        metaEl.textContent = compCount + ' components · ' + connCount + ' connections · ' + fmtDate(rec.savedAt);
        info.appendChild(nameEl); info.appendChild(metaEl);
        var actions = document.createElement('div'); actions.className = 'saved-item-actions';
        var loadBtn = document.createElement('button'); loadBtn.type = 'button';
        loadBtn.className = 'saved-item-btn'; loadBtn.textContent = 'Load';
        loadBtn.setAttribute('aria-label', 'Load circuit ' + n);
        loadBtn.addEventListener('click', function () {
          var verr = validate(rec.data);
          if (verr) { showToast(verr, 'error'); return; }
          if (components.length && !confirm('Replace current circuit with "' + n + '"?')) return;
          restore(rec.data);
          if (pickerOverlay) pickerOverlay.style.display = 'none';
          showToast('Loaded "' + n + '"', 'success');
        });
        var delBtn = document.createElement('button'); delBtn.type = 'button';
        delBtn.className = 'saved-item-btn saved-item-delete'; delBtn.textContent = 'Delete';
        delBtn.setAttribute('aria-label', 'Delete circuit ' + n);
        delBtn.addEventListener('click', function () {
          if (!confirm('Delete saved circuit "' + n + '"? This cannot be undone.')) return;
          var s = readSlots(); delete s[n]; writeSlots(s);
          renderPicker(); showToast('Deleted "' + n + '"', 'success');
        });
        actions.appendChild(loadBtn); actions.appendChild(delBtn);
        row.appendChild(info); row.appendChild(actions);
        pickerList.appendChild(row);
      });
    }

    if (btnLoad && pickerOverlay) {
      btnLoad.addEventListener('click', function () { renderPicker(); pickerOverlay.style.display = 'flex'; });
      if (pickerClose) pickerClose.addEventListener('click', function () { pickerOverlay.style.display = 'none'; });
      pickerOverlay.addEventListener('click', function (e) { if (e.target === pickerOverlay) pickerOverlay.style.display = 'none'; });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pickerOverlay.style.display === 'flex') {
          pickerOverlay.style.display = 'none'; e.stopPropagation();
        }
      });
    }

    var btnExport = document.getElementById('btn-export-json');
    if (btnExport) btnExport.addEventListener('click', function () {
      if (!components.length) { showToast('Nothing to export — canvas is empty', 'error'); return; }
      try {
        var json = JSON.stringify(serialize(), null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        var a = document.createElement('a');
        a.href = url; a.download = 'pneumatic-circuit-' + stamp + '.json';
        document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
        showToast('Circuit exported', 'success');
      } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
    });

    var btnImport = document.getElementById('btn-import-json');
    var fileInput = document.getElementById('import-json-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', function () { fileInput.value = ''; fileInput.click(); });
      fileInput.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var data;
          try { data = JSON.parse(ev.target.result); }
          catch (er) { showToast('File is not valid JSON', 'error'); return; }
          var verr = validate(data);
          if (verr) { showToast(verr, 'error'); return; }
          if (components.length && !confirm('Replace current circuit with imported one?')) return;
          restore(data);
          showToast('Circuit imported', 'success');
        };
        reader.onerror = function () { showToast('Could not read file', 'error'); };
        reader.readAsText(f);
      });
    }

    /* ================================================================
       SHAREABLE URL — the whole circuit is encoded into the link (no backend).
       serialize() (minus savedAt) → [flag] + deflate-raw|raw → base64url → '#c='
       ================================================================ */
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
    function shareSnapshot(){ var d=serialize(); delete d.savedAt; return JSON.stringify(d); }   // drop savedAt → same circuit yields the same link
    function flashShare(label, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=label; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900); }
    function shareLink(){
      if(!components.length){ showToast('Nothing to share — canvas is empty','error'); return Promise.resolve(); }
      try{
        var U=new TextEncoder().encode(shareSnapshot());
        var canZip=(typeof CompressionStream!=='undefined');
        return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
          var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
          var enc=b64urlEncode(out);
          if(enc.length>SHARE_MAX){ showToast('Circuit too big to share as a link — use Export (JSON) instead','error'); flashShare('⚠ Too big — use Export',false); return; }
          var url=location.origin+location.pathname+'#c='+enc;
          try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(
              function(){ showToast('Shareable link copied — opens this exact circuit','success'); flashShare('✓ Link copied!',true); },
              function(){ showToast('Shareable link is in the address bar','success'); flashShare('↑ Link in address bar'); });
          } else { showToast('Shareable link is in the address bar','success'); flashShare('↑ Link in address bar'); }
        }).catch(function(){ showToast('Could not create a share link','error'); flashShare('✗ Share failed',false); });
      }catch(e){ showToast('Could not create a share link','error'); flashShare('✗ Share failed',false); return Promise.resolve(); }
    }
    function loadFromHash(){
      var h=location.hash||''; if(h.indexOf('#c=')!==0) return;
      var enc=h.slice(3);
      Promise.resolve().then(function(){
        var final=b64urlDecode(enc), flag=final[0], body=final.subarray(1);
        return (flag===1)?inflateBytes(body):Promise.resolve(body);
      }).then(function(U){
        var data=JSON.parse(new TextDecoder().decode(U));
        if(validate(data)) return;               // schema/shape mismatch → ignore silently
        restore(data);
        showToast('Opened a shared circuit','success');
      }).catch(function(){});                     // corrupt link → stay on the empty canvas
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // runs after the synchronous boot (rAF-free so it's not throttled in background tabs)
  })();

  /* ================================================================
     INITIALISATION
     ================================================================ */

  /* ================================================================
     DISPLACEMENT–TIME (STEP) DIAGRAM
     Plots each cylinder's stroke (0→1) over a rolling time window, labelled
     A, B, C… in placement order — the classic A+ B+ A− B− sequence chart.
     ================================================================ */
  var _dispCanvas = document.getElementById('disp-canvas');
  var _dispCtx = _dispCanvas ? _dispCanvas.getContext('2d') : null;
  var _dispBuf = [];              /* [{ t, ext:{compId:0..1} }] */
  var _dispDrawAccum = 0;
  var _DISP_WINDOW = 20;          /* seconds shown */
  var _DISP_COLORS = ['#42a5f5', '#3ddc84', '#f5c842', '#ff6699', '#b388ff', '#4dd0e1'];

  function dispCylinders() {
    var out = [];
    for (var i = 0; i < components.length; i++) {
      var c = components[i];
      if (c.type === 'cyl-da' || c.type === 'cyl-sa' || c.type === 'cyl-rodless') out.push(c);
    }
    return out;
  }

  function sampleDisplacement() {
    if (!running) return;
    var cyls = dispCylinders();
    if (!cyls.length) return;
    var ext = {};
    for (var i = 0; i < cyls.length; i++) ext[cyls[i].id] = cyls[i].extension || 0;
    _dispBuf.push({ t: simTime, ext: ext });
    while (_dispBuf.length > 2 && _dispBuf[0].t < simTime - _DISP_WINDOW) _dispBuf.shift();
  }

  function resizeDispCanvas() {
    if (!_dispCanvas) return;
    var rect = _dispCanvas.getBoundingClientRect();
    var cssW = Math.max(200, rect.width), cssH = 200;
    var dpr = window.devicePixelRatio || 1;
    _dispCanvas.width = cssW * dpr; _dispCanvas.height = cssH * dpr;
    _dispCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawDisplacement() {
    if (!_dispCtx || !_dispCanvas) return;
    resizeDispCanvas();
    var W = _dispCanvas.width / (window.devicePixelRatio || 1);
    var H = _dispCanvas.height / (window.devicePixelRatio || 1);
    _dispCtx.fillStyle = '#0a0f18'; _dispCtx.fillRect(0, 0, W, H);
    var cyls = dispCylinders();
    var legend = document.getElementById('disp-legend');

    if (!cyls.length) {
      _dispCtx.fillStyle = '#5a6a80'; _dispCtx.font = '12px system-ui, sans-serif';
      _dispCtx.textAlign = 'center';
      _dispCtx.fillText('Add cylinders and run the circuit to plot the displacement sequence.', W / 2, H / 2);
      if (legend) legend.innerHTML = '';
      return;
    }

    var padL = 34, padR = 10, padT = 10, padB = 18;
    var lanes = cyls.length;
    var laneH = (H - padT - padB) / lanes;
    var tNow = _dispBuf.length ? _dispBuf[_dispBuf.length - 1].t : simTime;
    var tMin = Math.max(0, tNow - _DISP_WINDOW);
    var span = Math.max(0.001, tNow - tMin);
    function xOf(t) { return padL + (t - tMin) / span * (W - padL - padR); }

    /* Vertical time gridlines */
    _dispCtx.strokeStyle = '#16202f'; _dispCtx.lineWidth = 1;
    for (var g = 0; g <= 4; g++) { var gx = padL + g / 4 * (W - padL - padR); _dispCtx.beginPath(); _dispCtx.moveTo(gx, padT); _dispCtx.lineTo(gx, H - padB); _dispCtx.stroke(); }

    var legendHTML = '';
    for (var i = 0; i < cyls.length; i++) {
      var laneY = padT + i * laneH;
      var col = _DISP_COLORS[i % _DISP_COLORS.length];
      var label = String.fromCharCode(65 + i); /* A, B, C… */
      /* Lane baselines (retracted / extended) */
      _dispCtx.strokeStyle = '#16202f';
      _dispCtx.beginPath(); _dispCtx.moveTo(padL, laneY + laneH - 4); _dispCtx.lineTo(W - padR, laneY + laneH - 4); _dispCtx.stroke();
      _dispCtx.beginPath(); _dispCtx.moveTo(padL, laneY + 4); _dispCtx.lineTo(W - padR, laneY + 4); _dispCtx.stroke();
      /* Row label + 0/1 ticks */
      _dispCtx.fillStyle = col; _dispCtx.font = 'bold 10px ui-monospace, monospace'; _dispCtx.textAlign = 'right';
      _dispCtx.fillText(label, padL - 6, laneY + laneH / 2 + 3);
      _dispCtx.fillStyle = '#4a5a70'; _dispCtx.font = '7px sans-serif';
      _dispCtx.fillText('1', padL - 6, laneY + 8); _dispCtx.fillText('0', padL - 6, laneY + laneH - 2);
      /* Trace */
      _dispCtx.strokeStyle = col; _dispCtx.lineWidth = 1.8;
      _dispCtx.beginPath(); var started = false;
      for (var s = 0; s < _dispBuf.length; s++) {
        var smp = _dispBuf[s]; if (smp.t < tMin) continue;
        var e = smp.ext[cyls[i].id]; if (e == null) continue;
        var x = xOf(smp.t), y = laneY + 4 + (1 - e) * (laneH - 8);
        if (!started) { _dispCtx.moveTo(x, y); started = true; } else { _dispCtx.lineTo(x, y); }
      }
      _dispCtx.stroke();
      legendHTML += '<span class="lg"><span class="dot" style="background:' + col + '"></span>' + label + ' — ' + (COMP_DEFS[cyls[i].type] ? COMP_DEFS[cyls[i].type].name : 'Cyl') + '</span>';
    }
    if (legend) legend.innerHTML = legendHTML;
  }

  (function initDispDiagram() {
    var card = document.getElementById('disp-diagram-card');
    if (card) card.addEventListener('toggle', function () { if (card.open) drawDisplacement(); });
    var _drT;
    window.addEventListener('resize', function () { clearTimeout(_drT); _drT = setTimeout(drawDisplacement, 150); });
  })();

  resizeCanvas();
  drawPaletteIcons();
  initUnitToggle();
  initHint();
  initAnnotations();
  switchMode('simulate');


})();
