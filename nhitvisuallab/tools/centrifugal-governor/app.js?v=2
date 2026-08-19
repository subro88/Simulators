(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS
     ================================================================ */

  var CONCEPTS = [
    /* ── Basics ──────────────────────────────────────────────────── */
    {
      id: 'governor-def', name: 'Governor Definition', symbol: 'Governor',
      formula: 'Speed regulator using centrifugal effect', unit: '\u2014',
      cat: 'basics',
      desc: 'A governor is a mechanical device that automatically regulates the speed of an engine or prime mover by controlling the fuel supply. When the load on the engine decreases, its speed tends to increase. The governor detects this speed change and reduces the fuel supply to bring the speed back to the desired value. Conversely, when the load increases and speed drops, the governor opens the throttle to increase fuel supply.',
      diagram: 'governorDef',
      example: { problem: 'An engine runs at 300 rpm under normal load. If the load suddenly drops and speed rises to 315 rpm, what percentage speed increase does the governor need to correct?', steps: ['Speed increase = 315 \u2212 300 = 15 rpm', 'Percentage = (15/300) \u00D7 100', 'Percentage = 5%', 'Governor must reduce fuel to correct 5% overspeed'], answer: 5, unit: '%' }
    },
    {
      id: 'speed-regulation', name: 'Speed Regulation', symbol: 'N\u2081, N\u2082',
      formula: 'Regulation = (N\u2082\u2212N\u2081)/N_mean \u00D7 100%', unit: '%',
      cat: 'basics',
      desc: 'Speed regulation describes the range of speed over which a governor operates. N\u2081 is the minimum speed (maximum sleeve position, full fuel) and N\u2082 is the maximum speed (minimum sleeve position, reduced fuel). The mean speed N_mean = (N\u2081 + N\u2082)/2. A smaller regulation percentage means tighter speed control. Typical governors have 1\u20135% regulation.',
      diagram: 'speedRegulation',
      example: { problem: 'A governor operates between 290 rpm and 310 rpm. Find the speed regulation percentage.', steps: ['N\u2082 \u2212 N\u2081 = 310 \u2212 290 = 20 rpm', 'N_mean = (290 + 310)/2 = 300 rpm', 'Regulation = 20/300 \u00D7 100', 'Regulation = 6.67%'], answer: 6.67, unit: '%' }
    },
    {
      id: 'centrifugal-force', name: 'Centrifugal Force', symbol: 'Fc',
      formula: 'Fc = m\u03C9\u00B2r', unit: 'N',
      cat: 'basics',
      desc: 'The centrifugal force acting on each rotating ball is the fundamental force that drives governor operation. It equals the product of ball mass (m), the square of angular velocity (\u03C9\u00B2), and the radius of rotation (r). As the spindle speed increases, \u03C9 increases, causing Fc to increase, which pushes the balls outward to a larger radius, raising the sleeve.',
      diagram: 'centrifugalForce',
      example: { problem: 'A governor ball of mass 2 kg rotates at 150 rpm with radius 0.15 m. Find the centrifugal force.', steps: ['\u03C9 = 2\u03C0 \u00D7 150/60 = 15.71 rad/s', 'Fc = m\u03C9\u00B2r', 'Fc = 2 \u00D7 15.71\u00B2 \u00D7 0.15', 'Fc = 2 \u00D7 246.8 \u00D7 0.15 = 74.04 N'], answer: 74.04, unit: 'N' }
    },
    {
      id: 'governor-height', name: 'Governor Height', symbol: 'h',
      formula: 'h = g/\u03C9\u00B2 (Watt)', unit: 'm',
      cat: 'basics',
      desc: 'The governor height (h) is the vertical distance from the plane of rotation of the balls to the pivot point on the spindle. For a simple Watt governor, h = g/\u03C9\u00B2 = 9.81/(2\u03C0N/60)\u00B2. This shows that height is inversely proportional to the square of the speed \u2014 as speed increases, height decreases. The height also equals L\u00B7cos\u03B8, where L is the arm length and \u03B8 is the arm angle from vertical.',
      diagram: 'governorHeight',
      example: { problem: 'Find the height of a Watt governor running at 120 rpm.', steps: ['\u03C9 = 2\u03C0 \u00D7 120/60 = 12.566 rad/s', 'h = g/\u03C9\u00B2 = 9.81/12.566\u00B2', 'h = 9.81/157.9', 'h = 0.0621 m = 62.1 mm'], answer: 0.062, unit: 'm' }
    },

    /* ── Types ────────────────────────────────────────────────────── */
    {
      id: 'watt-governor', name: 'Watt Governor', symbol: 'h = g/\u03C9\u00B2',
      formula: 'h = g/\u03C9\u00B2 = 895/N\u00B2 (N in rpm, h in m)', unit: 'm',
      cat: 'types',
      desc: 'The Watt governor is the simplest centrifugal governor, consisting of two balls attached to the spindle by arms without any additional dead weight. The equilibrium height depends only on the rotational speed: h = g/\u03C9\u00B2. Its main limitation is that it can only operate at low speeds because at high speeds the height becomes very small, making it impractical. It was invented by James Watt for steam engines.',
      diagram: 'wattGovernor',
      example: { problem: 'A Watt governor has arms of 300 mm. Find the maximum speed of rotation (rpm) when the arms make 30\u00B0 with the spindle axis.', steps: ['h = L \u00D7 cos\u03B8 = 0.3 \u00D7 cos30\u00B0 = 0.2598 m', 'h = g/\u03C9\u00B2 \u2192 \u03C9\u00B2 = g/h = 9.81/0.2598', '\u03C9 = \u221A37.76 = 6.145 rad/s', 'N = 60\u03C9/(2\u03C0) = 58.7 rpm'], answer: 58.7, unit: 'rpm' }
    },
    {
      id: 'porter-governor', name: 'Porter Governor', symbol: 'h = (m+M)g/(m\u03C9\u00B2)',
      formula: 'h = (m+M)g / (m\u03C9\u00B2)', unit: 'm',
      cat: 'types',
      desc: 'The Porter governor improves on the Watt governor by adding a heavy central dead weight (sleeve mass M) that slides on the spindle. This additional mass increases the centrifugal force needed to raise the sleeve, allowing the governor to operate at higher speeds with better sensitivity. The height formula becomes h = (m+M)g/(m\u03C9\u00B2), where m is the ball mass and M is the sleeve mass. The lower arms connect the balls to the sleeve.',
      diagram: 'porterGovernor',
      example: { problem: 'A Porter governor has ball mass 2 kg, sleeve mass 10 kg, and runs at 200 rpm. Find the governor height.', steps: ['\u03C9 = 2\u03C0 \u00D7 200/60 = 20.944 rad/s', 'h = (m+M)g/(m\u03C9\u00B2)', 'h = (2+10) \u00D7 9.81 / (2 \u00D7 20.944\u00B2)', 'h = 117.72 / 877.3 = 0.1342 m'], answer: 0.134, unit: 'm' }
    },
    {
      id: 'proell-governor', name: 'Proell Governor', symbol: 'Extended arms',
      formula: 'Fc \u00D7 BF = (m + M/2)g \u00D7 tan\u03B8 \u00D7 BF/BG', unit: 'N',
      cat: 'types',
      desc: 'The Proell governor is a modification of the Porter governor where the balls are attached to extensions of the lower arms rather than at the junction of the upper and lower arms. This extension acts as a lever, amplifying the centrifugal force effect and making the governor more sensitive to speed changes. The Proell governor can operate over a wider speed range with less sleeve travel.',
      diagram: 'proellGovernor',
      example: { problem: 'A Proell governor has ball mass 3 kg at an extension ratio of 1.5. If the equivalent Porter controlling force is 80 N, what is the effective force?', steps: ['Extension ratio = BF/BG = 1.5', 'Effective force = Fc \u00D7 (BF/BG)', 'Effective force = 80 \u00D7 1.5', 'Effective force = 120 N'], answer: 120, unit: 'N' }
    },
    {
      id: 'hartnell-governor', name: 'Hartnell Governor', symbol: 'Spring-loaded',
      formula: 'Fc = S + m\u03C9\u00B2r (spring + centrifugal)', unit: 'N',
      cat: 'types',
      desc: 'The Hartnell governor is a spring-loaded centrifugal governor where the balls move against spring tension rather than gravity. A bell-crank lever connects each ball to the sleeve through a spring. The spring force provides the restoring force instead of gravity, allowing compact design and operation at any orientation. The stiffness of the spring determines the governor characteristics. Hartnell governors are widely used in modern engines.',
      diagram: 'hartnellGovernor',
      example: { problem: 'A Hartnell governor spring has stiffness 5 N/mm. If the sleeve moves 10 mm, what is the additional spring force?', steps: ['Spring stiffness k = 5 N/mm', 'Sleeve displacement x = 10 mm', 'Additional force = k \u00D7 x', 'F = 5 \u00D7 10 = 50 N'], answer: 50, unit: 'N' }
    },

    /* ── Analysis ─────────────────────────────────────────────────── */
    {
      id: 'controlling-force', name: 'Controlling Force', symbol: 'Fc',
      formula: 'Fc = m\u03C9\u00B2r = m(2\u03C0N/60)\u00B2r', unit: 'N',
      cat: 'analysis',
      desc: 'The controlling force is the inward radial force that balances the centrifugal force at equilibrium. For gravity-based governors, this force comes from the weight of the balls and sleeve. A controlling force diagram plots Fc against radius r. For a stable governor, the Fc-r curve must have a positive slope (Fc increases with r). The intercept and slope of this curve determine governor characteristics.',
      diagram: 'controllingForce',
      example: { problem: 'A governor ball of 4 kg rotates at a radius of 0.2 m at 180 rpm. Find the controlling force.', steps: ['\u03C9 = 2\u03C0 \u00D7 180/60 = 18.85 rad/s', 'Fc = m\u03C9\u00B2r', 'Fc = 4 \u00D7 18.85\u00B2 \u00D7 0.2', 'Fc = 4 \u00D7 355.3 \u00D7 0.2 = 284.2 N'], answer: 284.2, unit: 'N' }
    },
    {
      id: 'stability', name: 'Stability', symbol: 'dFc/dr > 0',
      formula: 'Stable if controlling force increases with radius', unit: '\u2014',
      cat: 'analysis',
      desc: 'A governor is stable when a small increase in radius (due to speed increase) results in a net restoring force that pushes the balls back toward equilibrium. On the controlling force diagram, this means the Fc curve must lie above the tangent from the origin, or equivalently dFc/dr > Fc/r. An unstable governor would allow the balls to fly to extreme positions without control.',
      diagram: 'stability',
      example: { problem: 'At r = 0.15 m, Fc = 60 N. At r = 0.18 m, Fc = 90 N. Is the governor stable?', steps: ['Fc/r at 0.15 = 60/0.15 = 400 N/m', 'Fc/r at 0.18 = 90/0.18 = 500 N/m', 'Slope = (90\u221260)/(0.18\u22120.15) = 1000 N/m', 'Since slope > Fc/r, governor is stable'], answer: 1000, unit: 'N/m' }
    },
    {
      id: 'isochronism', name: 'Isochronism', symbol: '\u03C9\u2081 = \u03C9\u2082',
      formula: 'All radii correspond to same equilibrium speed', unit: '\u2014',
      cat: 'analysis',
      desc: 'An isochronous governor is one where the equilibrium speed is the same for all radii of rotation. On the controlling force diagram, this means the Fc-r line passes through the origin (Fc is directly proportional to r). While theoretically ideal, a perfectly isochronous governor is impractical because any small speed disturbance would cause the balls to fly to extreme positions without a unique equilibrium.',
      diagram: 'isochronism',
      example: { problem: 'For an isochronous governor at 200 rpm with 3 kg balls, find Fc at r = 0.12 m and r = 0.18 m.', steps: ['\u03C9 = 2\u03C0 \u00D7 200/60 = 20.94 rad/s', 'Fc at 0.12 = 3 \u00D7 20.94\u00B2 \u00D7 0.12 = 158.0 N', 'Fc at 0.18 = 3 \u00D7 20.94\u00B2 \u00D7 0.18 = 237.0 N', 'Both at same \u03C9 \u2014 isochronous'], answer: 158.0, unit: 'N' }
    },
    {
      id: 'hunting', name: 'Hunting', symbol: 'Oscillation',
      formula: 'Continuous fluctuation about mean speed', unit: '\u2014',
      cat: 'analysis',
      desc: 'Hunting is the undesirable phenomenon where the governor continuously oscillates about the mean equilibrium position without settling. This happens when the governor is too sensitive \u2014 it overshoots the correction and then overcorrects in the opposite direction. Hunting causes wear on governor components and poor engine speed regulation. It can be reduced by adding damping or by designing the governor with appropriate sensitivity.',
      diagram: 'hunting',
      example: { problem: 'A governor oscillates between 285 and 315 rpm with a mean of 300 rpm. What is the hunting amplitude as a percentage?', steps: ['Amplitude = (315 \u2212 285)/2 = 15 rpm', 'Mean speed = 300 rpm', 'Percentage = 15/300 \u00D7 100', 'Hunting amplitude = 5%'], answer: 5, unit: '%' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 — Watt governor height */
    function () {
      var N = randInt(60, 200);
      var omega = 2 * Math.PI * N / 60;
      var h = +(9.81 / (omega * omega)).toFixed(4);
      return { prompt: 'A Watt governor runs at ' + N + ' rpm. Find the height of the governor (m).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + N + '/60 = ' + omega.toFixed(3) + ' rad/s', 'h = g/\u03C9\u00B2 = 9.81/' + omega.toFixed(3) + '\u00B2', 'h = 9.81/' + (omega * omega).toFixed(2), 'h = ' + h + ' m'], answer: h, unit: 'm' };
    },
    /* 1 — Centrifugal (controlling) force */
    function () {
      var m = randInt(1, 8);
      var N = randInt(100, 300);
      var r = +(randInt(10, 25) / 100).toFixed(2);
      var omega = 2 * Math.PI * N / 60;
      var Fc = +(m * omega * omega * r).toFixed(2);
      return { prompt: 'A governor ball of ' + m + ' kg rotates at ' + N + ' rpm with radius ' + r + ' m. Find the controlling force (N).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + N + '/60 = ' + omega.toFixed(3) + ' rad/s', 'Fc = m\u03C9\u00B2r = ' + m + ' \u00D7 ' + omega.toFixed(3) + '\u00B2 \u00D7 ' + r, 'Fc = ' + m + ' \u00D7 ' + (omega * omega).toFixed(2) + ' \u00D7 ' + r, 'Fc = ' + Fc + ' N'], answer: Fc, unit: 'N' };
    },
    /* 2 — Porter governor height */
    function () {
      var m = randInt(2, 6);
      var M = randInt(5, 15);
      var N = randInt(100, 250);
      var omega = 2 * Math.PI * N / 60;
      var h = +((m + M) * 9.81 / (m * omega * omega)).toFixed(4);
      return { prompt: 'A Porter governor has ball mass ' + m + ' kg, sleeve mass ' + M + ' kg, running at ' + N + ' rpm. Find height (m).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + N + '/60 = ' + omega.toFixed(3) + ' rad/s', 'h = (m+M)g/(m\u03C9\u00B2)', 'h = (' + m + '+' + M + ') \u00D7 9.81 / (' + m + ' \u00D7 ' + (omega * omega).toFixed(2) + ')', 'h = ' + h + ' m'], answer: h, unit: 'm' };
    },
    /* 3 — Angular velocity from rpm */
    function () {
      var N = randInt(50, 400);
      var omega = +(2 * Math.PI * N / 60).toFixed(3);
      return { prompt: 'Convert ' + N + ' rpm to angular velocity in rad/s.', steps: ['\u03C9 = 2\u03C0N/60', '\u03C9 = 2 \u00D7 3.1416 \u00D7 ' + N + ' / 60', '\u03C9 = ' + (2 * Math.PI * N).toFixed(2) + ' / 60', '\u03C9 = ' + omega + ' rad/s'], answer: +omega, unit: 'rad/s' };
    },
    /* 4 — Sensitivity calculation */
    function () {
      var N1 = randInt(180, 280);
      var N2 = N1 + randInt(10, 40);
      var Nmean = (N1 + N2) / 2;
      var sens = +((N2 - N1) / Nmean * 100).toFixed(2);
      return { prompt: 'A governor operates between ' + N1 + ' rpm and ' + N2 + ' rpm. Find the sensitivity (%).', steps: ['N_mean = (' + N1 + ' + ' + N2 + ')/2 = ' + Nmean + ' rpm', 'Sensitivity = (N\u2082 \u2212 N\u2081)/N_mean \u00D7 100', 'Sensitivity = (' + N2 + ' \u2212 ' + N1 + ')/' + Nmean + ' \u00D7 100', 'Sensitivity = ' + sens + '%'], answer: sens, unit: '%' };
    },
    /* 5 — Radius of rotation from arm length and angle */
    function () {
      var L = +(randInt(20, 40) / 100).toFixed(2);
      var theta = randInt(20, 60);
      var r = +(L * Math.sin(theta * Math.PI / 180)).toFixed(4);
      return { prompt: 'A governor arm of length ' + L + ' m makes ' + theta + '\u00B0 with the spindle axis. Find the radius of rotation (m).', steps: ['r = L \u00D7 sin\u03B8', 'r = ' + L + ' \u00D7 sin(' + theta + '\u00B0)', 'r = ' + L + ' \u00D7 ' + Math.sin(theta * Math.PI / 180).toFixed(4), 'r = ' + r + ' m'], answer: r, unit: 'm' };
    },
    /* 6 — Height from arm length and angle */
    function () {
      var L = +(randInt(20, 40) / 100).toFixed(2);
      var theta = randInt(20, 55);
      var h = +(L * Math.cos(theta * Math.PI / 180)).toFixed(4);
      return { prompt: 'A governor arm of length ' + L + ' m makes ' + theta + '\u00B0 with the vertical spindle. Find the height (m).', steps: ['h = L \u00D7 cos\u03B8', 'h = ' + L + ' \u00D7 cos(' + theta + '\u00B0)', 'h = ' + L + ' \u00D7 ' + Math.cos(theta * Math.PI / 180).toFixed(4), 'h = ' + h + ' m'], answer: h, unit: 'm' };
    },
    /* 7 — Speed from height (Watt governor) */
    function () {
      var h = +(randInt(3, 15) / 100).toFixed(2);
      var omega = Math.sqrt(9.81 / h);
      var N = +(omega * 60 / (2 * Math.PI)).toFixed(1);
      return { prompt: 'A Watt governor has a height of ' + h + ' m. Find the speed in rpm.', steps: ['\u03C9\u00B2 = g/h = 9.81/' + h, '\u03C9 = \u221A' + (9.81 / h).toFixed(2) + ' = ' + omega.toFixed(3) + ' rad/s', 'N = 60\u03C9/(2\u03C0) = 60 \u00D7 ' + omega.toFixed(3) + '/' + (2 * Math.PI).toFixed(4), 'N = ' + N + ' rpm'], answer: N, unit: 'rpm' };
    },
    /* 8 — Sleeve lift */
    function () {
      var L = +(randInt(20, 40) / 100).toFixed(2);
      var theta1 = randInt(15, 35);
      var theta2 = theta1 + randInt(10, 25);
      var h1 = L * Math.cos(theta1 * Math.PI / 180);
      var h2 = L * Math.cos(theta2 * Math.PI / 180);
      var lift = +(2 * (h1 - h2)).toFixed(4);
      return { prompt: 'A governor arm of ' + L + ' m swings from ' + theta1 + '\u00B0 to ' + theta2 + '\u00B0. Find the sleeve lift (m). (Sleeve lift = 2 \u00D7 change in height)', steps: ['h\u2081 = ' + L + ' \u00D7 cos(' + theta1 + '\u00B0) = ' + h1.toFixed(4) + ' m', 'h\u2082 = ' + L + ' \u00D7 cos(' + theta2 + '\u00B0) = ' + h2.toFixed(4) + ' m', 'Sleeve lift = 2(h\u2081 \u2212 h\u2082) = 2 \u00D7 ' + (h1 - h2).toFixed(4), 'Lift = ' + lift + ' m'], answer: lift, unit: 'm' };
    },
    /* 9 — Effort of a Porter governor */
    function () {
      var m = randInt(2, 5);
      var M = randInt(5, 15);
      var N1 = randInt(150, 250);
      var N2 = N1 + randInt(10, 30);
      var c = (N2 - N1) / ((N1 + N2) / 2);
      var effort = +((m + M) * 9.81 * c).toFixed(2);
      return { prompt: 'A Porter governor: ball mass ' + m + ' kg, sleeve mass ' + M + ' kg. Speed changes from ' + N1 + ' to ' + N2 + ' rpm. Find the governor effort (N).', steps: ['c = (N\u2082\u2212N\u2081)/N_mean = (' + N2 + '\u2212' + N1 + ')/' + ((N1 + N2) / 2).toFixed(1), 'c = ' + c.toFixed(4), 'Effort = (m+M) \u00D7 g \u00D7 c', 'Effort = (' + m + '+' + M + ') \u00D7 9.81 \u00D7 ' + c.toFixed(4) + ' = ' + effort + ' N'], answer: effort, unit: 'N' };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'A centrifugal governor works on the principle of:', options: ['Centrifugal force on rotating masses', 'Gyroscopic precession', 'Conservation of momentum', 'Bernoulli\'s principle'], correct: 0 },
    { type: 'mcq', prompt: 'In a Watt governor, the height h is:', options: ['Inversely proportional to \u03C9\u00B2', 'Directly proportional to \u03C9\u00B2', 'Independent of speed', 'Proportional to ball mass'], correct: 0 },
    { type: 'mcq', prompt: 'A Porter governor differs from a Watt governor by having:', options: ['A central dead weight (sleeve mass) on the spindle', 'Spring-loaded arms', 'Extended lower arms with balls', 'Hydraulic damping'], correct: 0 },
    { type: 'mcq', prompt: 'An isochronous governor has:', options: ['Same equilibrium speed at all radii', 'Maximum sensitivity', 'Zero hunting', 'Variable arm length'], correct: 0 },
    { type: 'mcq', prompt: 'Hunting in a governor is:', options: ['Continuous fluctuation about mean position', 'The maximum speed attainable', 'A type of governor support', 'Steady-state operation'], correct: 0 },
    { type: 'mcq', prompt: 'The controlling force diagram for a stable governor has:', options: ['A curve with positive slope where Fc increases with r', 'A horizontal line', 'A curve passing through the origin', 'A decreasing curve'], correct: 0 },
    { type: 'mcq', prompt: 'The Proell governor is more sensitive than the Porter governor because:', options: ['The balls are on extensions of the lower arms', 'It uses heavier balls', 'It operates at lower speeds', 'It has longer upper arms'], correct: 0 },
    { type: 'mcq', prompt: 'The formula \u03C9 = 2\u03C0N/60 converts:', options: ['RPM to rad/s', 'rad/s to RPM', 'Height to radius', 'Force to torque'], correct: 0 },
    { type: 'mcq', prompt: 'Governor sensitivity is defined as:', options: ['(N\u2082\u2212N\u2081)/N_mean \u00D7 100%', 'N\u2082/N\u2081 \u00D7 100%', '\u03C9\u00B2 \u00D7 r / g', 'Fc / mg'], correct: 0 },
    { type: 'mcq', prompt: 'As the speed of a centrifugal governor increases, the balls:', options: ['Move outward to a larger radius', 'Move inward to a smaller radius', 'Remain at the same radius', 'Oscillate randomly'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'A Watt governor runs at 100 rpm. Find h (m). Round to 4 decimals.', answer: 0.0893, unit: 'm', steps: ['\u03C9 = 2\u03C0\u00D7100/60 = 10.472 rad/s', 'h = 9.81/10.472\u00B2 = 9.81/109.66', 'h = 0.0893 m'] },
    { type: 'numeric', prompt: 'A 3 kg ball at 0.2 m radius, 200 rpm. Find Fc (N).', answer: 263.2, unit: 'N', steps: ['\u03C9 = 2\u03C0\u00D7200/60 = 20.944 rad/s', 'Fc = 3\u00D720.944\u00B2\u00D70.2', 'Fc = 263.2 N'] },
    { type: 'numeric', prompt: 'Convert 180 rpm to rad/s. Round to 2 decimals.', answer: 18.85, unit: 'rad/s', steps: ['\u03C9 = 2\u03C0\u00D7180/60', '\u03C9 = 18.85 rad/s'] },
    { type: 'numeric', prompt: 'A Porter governor: m=2kg, M=8kg, N=150rpm. Find h (m).', answer: 0.1989, unit: 'm', steps: ['\u03C9 = 15.708 rad/s', 'h = (2+8)\u00D79.81/(2\u00D7246.74)', 'h = 98.1/493.48 = 0.1989 m'] },
    { type: 'numeric', prompt: 'Governor operates between 280 and 320 rpm. Find sensitivity (%).', answer: 13.33, unit: '%', steps: ['N_mean = 300 rpm', 'Sens = 40/300 \u00D7 100', 'Sens = 13.33%'] }
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
  var govType = 'watt';

  /* Slider state */
  var ballMass = 2;        /* kg */
  var armLength = 0.3;     /* m */
  var rpm = 150;           /* rpm */
  var sleeveMass = 5;      /* kg */

  /* Animation */
  var animAngle = 0;       /* rotation angle for animation */
  var animRAF = null;

  /* Explore */
  var selCat = 'basics';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* ================================================================
     PHYSICS ENGINE
     ================================================================ */
  var g = 9.81;

  function calcOmega() {
    return 2 * Math.PI * rpm / 60;
  }

  function calcHeight() {
    var omega = calcOmega();
    if (omega < 0.1) return armLength;
    if (govType === 'watt') {
      return Math.min(g / (omega * omega), armLength);
    } else if (govType === 'porter') {
      return Math.min((ballMass + sleeveMass) * g / (ballMass * omega * omega), armLength);
    } else if (govType === 'proell') {
      /* Proell uses extension factor ~1.3 for the effective force */
      var extFactor = 1.3;
      return Math.min((ballMass + sleeveMass * extFactor) * g / (ballMass * omega * omega), armLength);
    }
    return armLength;
  }

  function calcRadius() {
    var h = calcHeight();
    /* r = sqrt(L^2 - h^2), clamped */
    var r2 = armLength * armLength - h * h;
    return r2 > 0 ? Math.sqrt(r2) : 0;
  }

  function calcAngleDeg() {
    var h = calcHeight();
    var cosTheta = h / armLength;
    cosTheta = Math.max(-1, Math.min(1, cosTheta));
    return Math.acos(cosTheta) * 180 / Math.PI;
  }

  function calcControllingForce() {
    var omega = calcOmega();
    var r = calcRadius();
    return ballMass * omega * omega * r;
  }

  function calcSleeveLift() {
    /* Sleeve lift compared to vertical (theta=0) position */
    var h = calcHeight();
    return 2 * (armLength - h); /* factor 2 because both sides contribute */
  }

  function calcSensitivity() {
    /* Sensitivity = (omega2 - omega1) / omega_mean * 100 */
    /* We use +/-5% rpm variation */
    var N1 = rpm * 0.95;
    var N2 = rpm * 1.05;
    var Nmean = rpm;
    return (N2 - N1) / Nmean * 100;
  }

  function calcEffort() {
    /* Effort = (m + M) * g * c, where c = (N2-N1)/Nmean */
    var c = 0.1; /* 10% speed variation */
    if (govType === 'watt') {
      return ballMass * g * c;
    }
    return (ballMass + sleeveMass) * g * c;
  }

  /* ================================================================
     DRAWING — SIMULATE MODE (ANIMATED GOVERNOR)
     ================================================================ */

  var ACCENT = '#6a1b9a';
  var ACCENT_LIGHT = '#ce93d8';
  var BALL_COLOR = '#ab47bc';
  var SPINDLE_COLOR = '#6b7a99';
  var SLEEVE_COLOR = '#42a5f5';
  var ARM_COLOR = '#dde3f0';
  var DIM_COLOR = '#4a5578';

  /* ── Shared fidelity helpers ───────────────────────────────────── */
  function drawSceneBackground() {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#10151f'); bg.addColorStop(0.55, '#0d1117'); bg.addColorStop(1, '#090c11');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (mode === 'simulate') {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, 535, H); ctx.clip();
      var glow = ctx.createRadialGradient(280, 250, 30, 280, 250, 300);
      glow.addColorStop(0, 'rgba(206,147,216,0.10)'); glow.addColorStop(1, 'rgba(206,147,216,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 535, H);
      ctx.restore();
    }
  }
  /* Cylindrical metal link: layered round-capped strokes, exact endpoints. */
  function metalLine(x1, y1, x2, y2, w, lo, mid, hi) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = lo;  ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.strokeStyle = mid; ctx.lineWidth = w * 0.72;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var nx = dy / L, ny = -dx / L, off = w * 0.24;
    ctx.strokeStyle = hi;  ctx.lineWidth = w * 0.26;
    ctx.beginPath(); ctx.moveTo(x1 + nx * off, y1 + ny * off); ctx.lineTo(x2 + nx * off, y2 + ny * off); ctx.stroke();
    ctx.restore();
  }
  /* Polished metal flyball: depth shadow + radial sheen + specular highlight. */
  function drawFlyball(x, y, r, base) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = base; ctx.fill();
    ctx.restore();
    ctx.save();
    var g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.65)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.33, y - r * 0.33, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
    ctx.restore();
  }

  function drawSimulate() {
    var omega = calcOmega();
    var h = calcHeight();
    var r = calcRadius();
    var thetaDeg = calcAngleDeg();
    var Fc = calcControllingForce();

    /* Layout: Governor mechanism on left, force diagram on right */
    var govCx = 280, govCy = 260; /* center of mechanism */
    var scale = 450; /* pixels per meter */

    /* Clamp for display */
    var hPx = h * scale;
    var rPx = r * scale;

    /* ── Title ── */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = ACCENT;
    ctx.fillText('GOVERNOR MECHANISM', 10, 8);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('CONTROLLING FORCE DIAGRAM', 560, 8);

    /* ── Draw Governor Mechanism ── */
    var pivotY = govCy - hPx;
    var ballLeftX = govCx - rPx;
    var ballRightX = govCx + rPx;
    var ballY = govCy;

    /* Spindle — chrome rod (horizontal gradient across its width) */
    var spg = ctx.createLinearGradient(govCx - 3, 0, govCx + 3, 0);
    spg.addColorStop(0, '#3a4150'); spg.addColorStop(0.5, '#aeb8c8'); spg.addColorStop(1, '#3a4150');
    ctx.fillStyle = spg;
    ctx.fillRect(govCx - 2.5, 50, 5, 410);

    /* Spindle label */
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = SPINDLE_COLOR;
    ctx.textAlign = 'center';
    ctx.fillText('Spindle', govCx, 40);

    /* Base */
    ctx.strokeStyle = SPINDLE_COLOR; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(govCx - 40, 460); ctx.lineTo(govCx + 40, 460); ctx.stroke();

    /* Rotation indicator (curved arrow at top) */
    ctx.strokeStyle = ACCENT_LIGHT; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(govCx, 65, 20, -Math.PI * 0.8, -Math.PI * 0.2);
    ctx.stroke();
    ctx.fillStyle = ACCENT_LIGHT;
    var arrowEndA = -Math.PI * 0.2;
    var arX = govCx + 20 * Math.cos(arrowEndA);
    var arY = 65 + 20 * Math.sin(arrowEndA);
    ctx.beginPath();
    ctx.moveTo(arX + 3, arY - 3);
    ctx.lineTo(arX - 4, arY - 2);
    ctx.lineTo(arX, arY + 4);
    ctx.closePath(); ctx.fill();

    ctx.font = '600 9px "Courier New", monospace';
    ctx.fillStyle = ACCENT_LIGHT;
    ctx.textAlign = 'center';
    ctx.fillText('\u03C9 = ' + omega.toFixed(1) + ' rad/s', govCx, 95);

    /* Upper arms — steel links (drawn under the pivot boss) */
    metalLine(govCx, pivotY, ballLeftX,  ballY, 5, '#8a93a6', '#dde3f0', '#ffffff');
    metalLine(govCx, pivotY, ballRightX, ballY, 5, '#8a93a6', '#dde3f0', '#ffffff');

    /* Upper pivot — domed boss */
    var ppg = ctx.createRadialGradient(govCx - 2, pivotY - 2, 0, govCx, pivotY, 5);
    ppg.addColorStop(0, '#ffffff'); ppg.addColorStop(1, '#9aa3b4');
    ctx.fillStyle = ppg;
    ctx.beginPath(); ctx.arc(govCx, pivotY, 5, 0, Math.PI * 2); ctx.fill();

    /* Sleeve — metallic block (vertical gradient + top sheen) */
    var sleeveY = govCy;
    var sleeveW = 24, sleeveH = 16;
    var slx = govCx - sleeveW / 2, sly = sleeveY - sleeveH / 2;
    var slg = ctx.createLinearGradient(0, sly, 0, sly + sleeveH);
    slg.addColorStop(0, '#7ec4fb'); slg.addColorStop(0.5, '#42a5f5'); slg.addColorStop(1, '#1c6fb0');
    ctx.fillStyle = slg;
    ctx.fillRect(slx, sly, sleeveW, sleeveH);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(slx, sly + 1, sleeveW, 2);
    ctx.strokeStyle = 'rgba(120,200,255,0.7)'; ctx.lineWidth = 1;
    ctx.strokeRect(slx, sly, sleeveW, sleeveH);

    /* Lower arms (to sleeve) — Porter and Proell only */
    if (govType !== 'watt') {
      ctx.strokeStyle = 'rgba(221,227,240,0.5)'; ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath(); ctx.moveTo(ballLeftX, ballY); ctx.lineTo(govCx - sleeveW / 2, sleeveY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ballRightX, ballY); ctx.lineTo(govCx + sleeveW / 2, sleeveY); ctx.stroke();
      ctx.setLineDash([]);

      /* Sleeve mass label */
      ctx.font = '700 9px "Courier New", monospace';
      ctx.fillStyle = SLEEVE_COLOR;
      ctx.textAlign = 'center';
      ctx.fillText('M=' + sleeveMass.toFixed(1) + ' kg', govCx, sleeveY + sleeveH / 2 + 14);
    }

    /* Proell extension indicators */
    if (govType === 'proell') {
      /* Draw extensions below the balls */
      var extLen = rPx * 0.25;
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ballLeftX, ballY); ctx.lineTo(ballLeftX - extLen * 0.3, ballY + extLen); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ballRightX, ballY); ctx.lineTo(ballRightX + extLen * 0.3, ballY + extLen); ctx.stroke();
      ctx.lineCap = 'butt';

      /* Extended ball position indicators */
      ctx.fillStyle = '#f5c842';
      ctx.beginPath(); ctx.arc(ballLeftX - extLen * 0.3, ballY + extLen, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ballRightX + extLen * 0.3, ballY + extLen, 6, 0, Math.PI * 2); ctx.fill();

      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('Extension', govCx, ballY + extLen + 20);
    }

    /* Flyballs — polished metal spheres */
    drawFlyball(ballLeftX,  ballY, 12, BALL_COLOR);
    drawFlyball(ballRightX, ballY, 12, BALL_COLOR);

    /* Ball mass labels */
    ctx.font = '700 9px "Courier New", monospace';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('m=' + ballMass.toFixed(1), ballLeftX, ballY - 18);
    ctx.fillText('m=' + ballMass.toFixed(1), ballRightX, ballY - 18);

    /* Centrifugal force arrows (outward) */
    if (Fc > 0.1) {
      var arrowLen = Math.min(Fc / 5, 60);
      /* Left arrow (pointing left) */
      ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ballLeftX - 14, ballY); ctx.lineTo(ballLeftX - 14 - arrowLen, ballY); ctx.stroke();
      ctx.fillStyle = '#ff5555';
      ctx.beginPath();
      ctx.moveTo(ballLeftX - 16 - arrowLen, ballY);
      ctx.lineTo(ballLeftX - 8 - arrowLen, ballY - 4);
      ctx.lineTo(ballLeftX - 8 - arrowLen, ballY + 4);
      ctx.closePath(); ctx.fill();

      /* Right arrow (pointing right) */
      ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(ballRightX + 14, ballY); ctx.lineTo(ballRightX + 14 + arrowLen, ballY); ctx.stroke();
      ctx.fillStyle = '#ff5555';
      ctx.beginPath();
      ctx.moveTo(ballRightX + 16 + arrowLen, ballY);
      ctx.lineTo(ballRightX + 8 + arrowLen, ballY - 4);
      ctx.lineTo(ballRightX + 8 + arrowLen, ballY + 4);
      ctx.closePath(); ctx.fill();

      ctx.font = '700 8px "Courier New", monospace';
      ctx.fillStyle = '#ff5555';
      ctx.textAlign = 'center';
      ctx.fillText('Fc', ballLeftX - 14 - arrowLen / 2, ballY - 8);
      ctx.fillText('Fc', ballRightX + 14 + arrowLen / 2, ballY - 8);
    }

    /* Dimension: height h */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(govCx + 50, pivotY); ctx.lineTo(govCx + 50, ballY); ctx.stroke();
    ctx.setLineDash([]);
    /* Arrowheads */
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(govCx + 50, pivotY); ctx.lineTo(govCx + 47, pivotY + 6); ctx.lineTo(govCx + 53, pivotY + 6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(govCx + 50, ballY); ctx.lineTo(govCx + 47, ballY - 6); ctx.lineTo(govCx + 53, ballY - 6); ctx.closePath(); ctx.fill();
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'left';
    ctx.fillText('h=' + h.toFixed(3) + 'm', govCx + 56, (pivotY + ballY) / 2 + 4);

    /* Dimension: radius r */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(govCx, ballY + 30); ctx.lineTo(ballRightX, ballY + 30); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f5c842';
    ctx.beginPath(); ctx.moveTo(govCx, ballY + 30); ctx.lineTo(govCx + 6, ballY + 27); ctx.lineTo(govCx + 6, ballY + 33); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ballRightX, ballY + 30); ctx.lineTo(ballRightX - 6, ballY + 27); ctx.lineTo(ballRightX - 6, ballY + 33); ctx.closePath(); ctx.fill();
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'center';
    ctx.fillText('r=' + r.toFixed(3) + 'm', (govCx + ballRightX) / 2, ballY + 46);

    /* Dimension: arm angle theta */
    if (thetaDeg > 1) {
      ctx.strokeStyle = ACCENT_LIGHT; ctx.lineWidth = 1;
      var arcR = 40;
      ctx.beginPath();
      ctx.arc(govCx, pivotY, arcR, -Math.PI / 2, -Math.PI / 2 + thetaDeg * Math.PI / 180);
      ctx.stroke();
      var midAngle = -Math.PI / 2 + (thetaDeg * Math.PI / 180) / 2;
      ctx.font = '600 9px "Courier New", monospace';
      ctx.fillStyle = ACCENT_LIGHT;
      ctx.textAlign = 'left';
      ctx.fillText('\u03B8=' + thetaDeg.toFixed(1) + '\u00B0', govCx + arcR * Math.cos(midAngle) + 6, pivotY + arcR * Math.sin(midAngle));
    }

    /* Dimension: arm length L */
    ctx.font = '600 8px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    var armMidX = (govCx + ballRightX) / 2 + 10;
    var armMidY = (pivotY + ballY) / 2 - 10;
    ctx.fillText('L=' + armLength.toFixed(2) + 'm', armMidX, armMidY);

    /* Governor type label */
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'center';
    var typeLabel = govType === 'watt' ? 'Watt Governor' : govType === 'porter' ? 'Porter Governor' : 'Proell Governor';
    ctx.fillText(typeLabel, govCx, 490);

    /* ── Controlling Force Diagram (right side) ── */
    drawControllingForceDiagram();
  }

  function drawControllingForceDiagram() {
    var chartL = 580, chartR = 870, chartT = 40, chartB = 480;
    var chartW = chartR - chartL, chartH = chartB - chartT;

    /* Axes */
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(chartL, chartB); ctx.lineTo(chartR, chartB); ctx.stroke(); /* x-axis */
    ctx.beginPath(); ctx.moveTo(chartL, chartB); ctx.lineTo(chartL, chartT); ctx.stroke(); /* y-axis */

    /* Axis labels */
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Radius r (m)', (chartL + chartR) / 2, chartB + 8);

    ctx.save();
    ctx.translate(chartL - 22, (chartT + chartB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Fc (N)', 0, 0);
    ctx.restore();

    /* Determine max values for scaling */
    var maxR = armLength;
    var omega = calcOmega();
    var maxFc = ballMass * omega * omega * maxR;
    if (maxFc < 10) maxFc = 100; /* default scale */

    /* Fc scale grid */
    ctx.strokeStyle = 'rgba(74,85,120,0.3)'; ctx.lineWidth = 0.5;
    for (var gi = 1; gi <= 4; gi++) {
      var gy = chartB - (gi / 4) * chartH;
      ctx.beginPath(); ctx.moveTo(chartL, gy); ctx.lineTo(chartR, gy); ctx.stroke();
      ctx.font = '600 8px "Courier New", monospace';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText((maxFc * gi / 4).toFixed(0), chartL - 4, gy);
    }
    /* r scale grid */
    for (var ri = 1; ri <= 4; ri++) {
      var gx = chartL + (ri / 4) * chartW;
      ctx.beginPath(); ctx.moveTo(gx, chartB); ctx.lineTo(gx, chartT); ctx.stroke();
      ctx.font = '600 8px "Courier New", monospace';
      ctx.fillStyle = '#6b7a99';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText((maxR * ri / 4).toFixed(3), gx, chartB + 2);
    }

    /* Plot Fc = m * omega^2 * r (linear through origin for current speed) */
    var steps = 50;
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var si = 0; si <= steps; si++) {
      var rr = (si / steps) * maxR;
      var fc = ballMass * omega * omega * rr;
      var px = chartL + (rr / maxR) * chartW;
      var py = chartB - (fc / maxFc) * chartH;
      py = Math.max(chartT, py);
      if (si === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    /* Fill area under curve */
    ctx.fillStyle = 'rgba(61,220,132,0.12)';
    ctx.beginPath();
    ctx.moveTo(chartL, chartB);
    for (var fi = 0; fi <= steps; fi++) {
      var rrF = (fi / steps) * maxR;
      var fcF = ballMass * omega * omega * rrF;
      var pxF = chartL + (rrF / maxR) * chartW;
      var pyF = chartB - (fcF / maxFc) * chartH;
      pyF = Math.max(chartT, pyF);
      ctx.lineTo(pxF, pyF);
    }
    ctx.lineTo(chartR, chartB);
    ctx.closePath();
    ctx.fill();

    /* Mark current operating point */
    var curR = calcRadius();
    var curFc = calcControllingForce();
    if (curR > 0) {
      var dotX = chartL + (curR / maxR) * chartW;
      var dotY = chartB - (curFc / maxFc) * chartH;
      dotY = Math.max(chartT + 5, dotY);

      /* Crosshair */
      ctx.strokeStyle = 'rgba(221,227,240,0.3)'; ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(dotX, chartB); ctx.lineTo(dotX, dotY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(chartL, dotY); ctx.lineTo(dotX, dotY); ctx.stroke();
      ctx.setLineDash([]);

      /* Dot */
      ctx.fillStyle = ACCENT;
      ctx.beginPath(); ctx.arc(dotX, dotY, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(106,27,154,0.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(dotX, dotY, 6, 0, Math.PI * 2); ctx.stroke();

      /* Value label */
      ctx.font = '700 9px "Courier New", monospace';
      ctx.fillStyle = ACCENT;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      var labelX = Math.min(dotX + 8, chartR - 80);
      ctx.fillText('(' + curR.toFixed(3) + ', ' + curFc.toFixed(1) + ')', labelX, dotY - 4);
    }

    /* Plot reference lines for +/-5% speed to show sensitivity range */
    var omega95 = 2 * Math.PI * (rpm * 0.95) / 60;
    var omega105 = 2 * Math.PI * (rpm * 1.05) / 60;

    /* Lower speed line */
    ctx.strokeStyle = 'rgba(66,165,245,0.5)'; ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    for (var li = 0; li <= steps; li++) {
      var rrL = (li / steps) * maxR;
      var fcL = ballMass * omega95 * omega95 * rrL;
      var pxL = chartL + (rrL / maxR) * chartW;
      var pyL = chartB - (fcL / maxFc) * chartH;
      pyL = Math.max(chartT, pyL);
      if (li === 0) ctx.moveTo(pxL, pyL);
      else ctx.lineTo(pxL, pyL);
    }
    ctx.stroke();

    /* Upper speed line */
    ctx.strokeStyle = 'rgba(255,85,85,0.5)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var ui = 0; ui <= steps; ui++) {
      var rrU = (ui / steps) * maxR;
      var fcU = ballMass * omega105 * omega105 * rrU;
      var pxU = chartL + (rrU / maxR) * chartW;
      var pyU = chartB - (fcU / maxFc) * chartH;
      pyU = Math.max(chartT, pyU);
      if (ui === 0) ctx.moveTo(pxU, pyU);
      else ctx.lineTo(pxU, pyU);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    /* Legend */
    ctx.font = '600 8px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('\u2014 N = ' + rpm + ' rpm', chartL + 10, chartT + 5);
    ctx.fillStyle = 'rgba(66,165,245,0.7)';
    ctx.fillText('--- N\u2081 = ' + (rpm * 0.95).toFixed(0) + ' rpm', chartL + 10, chartT + 18);
    ctx.fillStyle = 'rgba(255,85,85,0.7)';
    ctx.fillText('--- N\u2082 = ' + (rpm * 1.05).toFixed(0) + ' rpm', chartL + 10, chartT + 31);
  }

  /* ================================================================
     DRAWING — EXPLORE MINI-DIAGRAMS
     ================================================================ */

  function drawConceptDiagram(concept) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var fn = {
      'governorDef': drawGovernorDefDiag,
      'speedRegulation': drawSpeedRegulationDiag,
      'centrifugalForce': drawCentrifugalForceDiag,
      'governorHeight': drawGovernorHeightDiag,
      'wattGovernor': drawWattGovernorDiag,
      'porterGovernor': drawPorterGovernorDiag,
      'proellGovernor': drawProellGovernorDiag,
      'hartnellGovernor': drawHartnellGovernorDiag,
      'controllingForce': drawControllingForceConcept,
      'stability': drawStabilityDiag,
      'isochronism': drawIsochronismDiag,
      'hunting': drawHuntingDiag
    };

    if (fn[concept.diagram]) fn[concept.diagram]();

    /* Formula at bottom */
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = ACCENT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(concept.formula, W / 2, H - 16);
  }

  function drawMiniSpindle(cx, y1, y2) {
    ctx.strokeStyle = SPINDLE_COLOR; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, y1); ctx.lineTo(cx, y2); ctx.stroke();
    ctx.lineCap = 'butt';
  }

  function drawMiniGovernor(cx, cy, h, r, showSleeve) {
    var pivotY = cy - h;
    /* Spindle */
    drawMiniSpindle(cx, pivotY - 30, cy + 60);
    /* Pivot */
    ctx.fillStyle = '#dde3f0';
    ctx.beginPath(); ctx.arc(cx, pivotY, 4, 0, Math.PI * 2); ctx.fill();
    /* Arms */
    ctx.strokeStyle = ARM_COLOR; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, pivotY); ctx.lineTo(cx - r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, pivotY); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.lineCap = 'butt';
    /* Balls */
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath(); ctx.arc(cx - r, cy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r, cy, 10, 0, Math.PI * 2); ctx.fill();
    /* Sleeve */
    if (showSleeve) {
      ctx.fillStyle = SLEEVE_COLOR;
      ctx.fillRect(cx - 10, cy - 6, 20, 12);
      /* Lower arms */
      ctx.strokeStyle = 'rgba(221,227,240,0.4)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx - 10, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + r, cy); ctx.lineTo(cx + 10, cy); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawGovernorDefDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Centrifugal Governor — Speed Regulation', W / 2, 35);

    drawMiniGovernor(250, 220, 80, 80, false);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = ACCENT;
    ctx.fillText('Low Speed', 250, 330);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Balls close to spindle', 250, 348);

    drawMiniGovernor(650, 220, 40, 120, false);
    ctx.fillStyle = ACCENT;
    ctx.fillText('High Speed', 650, 330);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Balls fly outward', 650, 348);

    /* Arrow between */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(370, 220); ctx.lineTo(510, 220); ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.beginPath(); ctx.moveTo(515, 220); ctx.lineTo(505, 215); ctx.lineTo(505, 225); ctx.closePath(); ctx.fill();
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Speed increases', 440, 210);
  }

  function drawSpeedRegulationDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Speed Regulation Range', W / 2, 35);

    /* Speed axis */
    var axL = 100, axR = 800, axY = 260;
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(axL, axY); ctx.lineTo(axR, axY); ctx.stroke();

    /* N1 marker */
    var n1x = 250, n2x = 600, nmx = (n1x + n2x) / 2;
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(n1x, axY - 40); ctx.lineTo(n1x, axY + 15); ctx.stroke();
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText('N\u2081', n1x, axY + 30);
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillText('Min speed', n1x, axY + 45);

    /* N2 marker */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(n2x, axY - 40); ctx.lineTo(n2x, axY + 15); ctx.stroke();
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('N\u2082', n2x, axY + 30);
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillText('Max speed', n2x, axY + 45);

    /* Mean speed */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(nmx, axY - 30); ctx.lineTo(nmx, axY + 10); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('N_mean', nmx, axY - 38);

    /* Range bracket */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(n1x, axY - 55); ctx.lineTo(n2x, axY - 55); ctx.stroke();
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('N\u2082 \u2212 N\u2081 (range)', (n1x + n2x) / 2, axY - 65);

    /* Formula */
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Sensitivity = (N\u2082\u2212N\u2081) / N_mean \u00D7 100%', W / 2, 380);
  }

  function drawCentrifugalForceDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Centrifugal Force on Governor Ball', W / 2, 35);

    /* Circular path */
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.arc(450, 250, 100, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);

    /* Center */
    ctx.fillStyle = SPINDLE_COLOR;
    ctx.beginPath(); ctx.arc(450, 250, 4, 0, Math.PI * 2); ctx.fill();

    /* Ball on circle */
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath(); ctx.arc(550, 250, 14, 0, Math.PI * 2); ctx.fill();

    /* Radius line */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(450, 250); ctx.lineTo(548, 250); ctx.stroke();
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('r', 500, 242);

    /* Fc arrow outward */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(565, 250); ctx.lineTo(650, 250); ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.beginPath(); ctx.moveTo(655, 250); ctx.lineTo(645, 244); ctx.lineTo(645, 256); ctx.closePath(); ctx.fill();
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillText('Fc = m\u03C9\u00B2r', 680, 255);

    /* Rotation arrow */
    ctx.strokeStyle = ACCENT_LIGHT; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(450, 250, 120, -0.5, 0.5); ctx.stroke();
    ctx.fillStyle = ACCENT_LIGHT;
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('\u03C9', 450 + 130, 250);
  }

  function drawGovernorHeightDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Governor Height', W / 2, 35);

    drawMiniGovernor(450, 270, 90, 90, false);

    /* Height dimension */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(500, 180); ctx.lineTo(500, 270); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#3ddc84';
    ctx.font = '700 12px "Courier New", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('h = g/\u03C9\u00B2', 510, 230);
    ctx.fillText('h = L cos\u03B8', 510, 248);

    /* Angle arc */
    ctx.strokeStyle = ACCENT_LIGHT; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(450, 180, 35, Math.PI / 2, Math.PI / 2 + 0.8); ctx.stroke();
    ctx.fillStyle = ACCENT_LIGHT;
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u03B8', 430, 210);
  }

  function drawWattGovernorDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Watt Governor (Simplest Form)', W / 2, 35);

    drawMiniGovernor(300, 240, 80, 80, false);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('No dead weight on sleeve', 300, 340);
    ctx.fillStyle = ACCENT;
    ctx.fillText('h = g/\u03C9\u00B2 = 895/N\u00B2', 300, 358);

    /* Comparison at high speed */
    drawMiniGovernor(650, 240, 30, 120, false);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Limited to low speeds', 650, 340);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Height too small at high rpm', 650, 358);
  }

  function drawPorterGovernorDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Porter Governor (with Dead Weight)', W / 2, 35);

    drawMiniGovernor(450, 240, 70, 90, true);

    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = SLEEVE_COLOR;
    ctx.fillText('Sleeve Mass M', 450, 260);

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Dead weight improves sensitivity', 450, 360);
    ctx.fillStyle = ACCENT;
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillText('h = (m+M)g / (m\u03C9\u00B2)', 450, 390);
  }

  function drawProellGovernorDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Proell Governor (Extended Arms)', W / 2, 35);

    drawMiniGovernor(450, 220, 70, 90, true);

    /* Extensions */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(360, 220); ctx.lineTo(340, 260); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(540, 220); ctx.lineTo(560, 260); ctx.stroke();
    ctx.fillStyle = '#f5c842';
    ctx.beginPath(); ctx.arc(340, 260, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(560, 260, 7, 0, Math.PI * 2); ctx.fill();

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Ball on extension of lower arm', 450, 300);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('More sensitive than Porter governor', 450, 360);
  }

  function drawHartnellGovernorDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Hartnell Governor (Spring-Loaded)', W / 2, 35);

    /* Central spindle */
    drawMiniSpindle(450, 80, 400);

    /* Spring (zigzag) */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    var sy = 120;
    ctx.beginPath(); ctx.moveTo(450, sy);
    for (var si = 0; si < 6; si++) {
      ctx.lineTo(450 + (si % 2 === 0 ? 15 : -15), sy + 12 + si * 12);
    }
    ctx.lineTo(450, sy + 84);
    ctx.stroke();

    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Spring', 475, 160);

    /* Sleeve */
    ctx.fillStyle = SLEEVE_COLOR;
    ctx.fillRect(438, 210, 24, 14);

    /* Bell cranks and balls */
    ctx.strokeStyle = ARM_COLOR; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(438, 217); ctx.lineTo(340, 250); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(462, 217); ctx.lineTo(560, 250); ctx.stroke();
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath(); ctx.arc(340, 250, 10, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(560, 250, 10, 0, Math.PI * 2); ctx.fill();

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Spring replaces gravity for restoring force', 450, 340);
    ctx.fillStyle = ACCENT;
    ctx.fillText('Compact design, works in any orientation', 450, 360);
  }

  function drawControllingForceConcept() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Controlling Force Diagram', W / 2, 35);

    /* Axes */
    var cL = 150, cR = 750, cT = 70, cB = 380;
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cL, cB); ctx.lineTo(cR, cB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cL, cB); ctx.lineTo(cL, cT); ctx.stroke();

    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('r', (cL + cR) / 2, cB + 16);
    ctx.save();
    ctx.translate(cL - 20, (cT + cB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Fc', 0, 0);
    ctx.restore();

    /* Curve */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cL, cB);
    ctx.quadraticCurveTo((cL + cR) / 2, cB - 200, cR, cT + 30);
    ctx.stroke();

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Fc = m\u03C9\u00B2r', cR - 80, cT + 15);
  }

  function drawStabilityDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Governor Stability', W / 2, 35);

    /* Axes */
    var cL = 150, cR = 400, cT = 80, cB = 360;
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cL, cB); ctx.lineTo(cR, cB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cL, cB); ctx.lineTo(cL, cT); ctx.stroke();

    /* Stable curve */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cL, cB);
    ctx.quadraticCurveTo(cL + 100, cB - 100, cR, cT + 20);
    ctx.stroke();
    ctx.fillStyle = '#3ddc84'; ctx.font = '700 10px "Segoe UI", sans-serif';
    ctx.fillText('Stable', cR + 10, cT + 25);

    /* Unstable */
    var uL = 500, uR = 750;
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(uL, cB); ctx.lineTo(uR, cB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(uL, cB); ctx.lineTo(uL, cT); ctx.stroke();

    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(uL, cB);
    ctx.quadraticCurveTo(uL + 180, cB - 40, uR, cB - 30);
    ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Unstable', uR + 10, cB - 25);

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Stable: Fc curve above tangent from origin', W / 2, 400);
    ctx.fillText('Unstable: Fc curve below tangent from origin', W / 2, 420);
  }

  function drawIsochronismDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Isochronous Governor', W / 2, 35);

    /* Axes */
    var cL = 150, cR = 750, cT = 80, cB = 360;
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cL, cB); ctx.lineTo(cR, cB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cL, cB); ctx.lineTo(cL, cT); ctx.stroke();

    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('r', (cL + cR) / 2, cB + 15);

    /* Isochronous line through origin */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cL, cB); ctx.lineTo(cR, cT); ctx.stroke();

    ctx.fillStyle = '#3ddc84'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillText('Fc \u221D r (through origin)', cR - 100, cT - 10);

    ctx.fillStyle = '#dde3f0'; ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('Same equilibrium speed at all radii', W / 2, 400);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Impractical: any disturbance causes extreme displacement', W / 2, 420);
  }

  function drawHuntingDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Hunting — Speed Oscillation', W / 2, 35);

    /* Time axis */
    var axL = 100, axR = 800, axY = 250;
    ctx.strokeStyle = DIM_COLOR; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(axL, axY); ctx.lineTo(axR, axY); ctx.stroke();

    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('Time', (axL + axR) / 2, axY + 35);

    ctx.save();
    ctx.translate(axL - 25, axY);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Speed', 0, 0);
    ctx.restore();

    /* Mean speed line */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(axL, axY); ctx.lineTo(axR, axY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'right';
    ctx.fillText('N_mean', axL - 5, axY + 4);

    /* Oscillating curve */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var t = 0; t <= 700; t++) {
      var x = axL + t;
      var y = axY - 60 * Math.sin(t * 0.025) * Math.exp(-t * 0.001);
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('Continuous oscillation about mean speed', W / 2, 370);
    ctx.fillStyle = '#dde3f0';
    ctx.fillText('Caused by excessive sensitivity or inadequate damping', W / 2, 390);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    drawSceneBackground();

    if (mode === 'simulate') {
      drawSimulate();
      updateReadouts();
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
    ctx.fillStyle = ACCENT;
    ctx.fillText('Solve the governor problem below', W / 2, 65);

    /* Draw a sample governor */
    drawMiniGovernor(300, 250, 70, 80, false);
    drawMiniGovernor(600, 250, 50, 110, true);

    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('h = g/\u03C9\u00B2       Fc = m\u03C9\u00B2r', W / 2, 400);
  }

  function drawQuizCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Quiz Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = ACCENT;
    ctx.fillText('Answer the question below', W / 2, 65);

    drawMiniGovernor(450, 230, 60, 100, true);

    /* Formulas */
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Watt: h = g/\u03C9\u00B2', 250, 380);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('Porter: h = (m+M)g/(m\u03C9\u00B2)', 450, 380);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('Fc = m\u03C9\u00B2r', 680, 380);
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    var h = calcHeight();
    var Fc = calcControllingForce();
    var lift = calcSleeveLift();
    var omega = calcOmega();
    var r = calcRadius();
    var theta = calcAngleDeg();
    var sens = calcSensitivity();
    var effort = calcEffort();

    $('#r-height').textContent = h.toFixed(4);
    $('#r-fc').textContent = Fc.toFixed(2);
    $('#r-lift').textContent = lift.toFixed(4);
    $('#r-omega').textContent = omega.toFixed(2);
    $('#r-radius').textContent = r.toFixed(4);
    $('#r-angle').textContent = theta.toFixed(1);
    $('#r-sens').textContent = sens.toFixed(2);
    $('#r-effort').textContent = effort.toFixed(2);
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

  /* Governor type tabs */
  $('#gov-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    govType = e.target.dataset.gov;
    $$('#gov-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    /* Enable/disable sleeve slider */
    $('#sleeve-slider').disabled = (govType === 'watt');
    render();
  });

  /* Sliders */
  $('#mass-slider').addEventListener('input', function () {
    ballMass = +this.value;
    $('#mass-val').textContent = ballMass.toFixed(1) + ' kg';
    render();
  });
  $('#arm-slider').addEventListener('input', function () {
    armLength = +this.value;
    $('#arm-val').textContent = armLength.toFixed(2) + ' m';
    render();
  });
  $('#rpm-slider').addEventListener('input', function () {
    rpm = +this.value;
    $('#rpm-val').textContent = rpm + ' rpm';
    render();
  });
  $('#sleeve-slider').addEventListener('input', function () {
    sleeveMass = +this.value;
    $('#sleeve-val').textContent = sleeveMass.toFixed(1) + ' kg';
    render();
  });

  /* Presets */
  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var preset = btn.dataset.preset;
      if (!preset) return;
      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (preset === 'low-speed') {
        rpm = 80; ballMass = 2; armLength = 0.3;
        $('#rpm-slider').value = 80; $('#mass-slider').value = 2; $('#arm-slider').value = 0.3;
      } else if (preset === 'medium-speed') {
        rpm = 200; ballMass = 3; armLength = 0.25;
        $('#rpm-slider').value = 200; $('#mass-slider').value = 3; $('#arm-slider').value = 0.25;
      } else if (preset === 'high-speed') {
        rpm = 400; ballMass = 2; armLength = 0.2;
        $('#rpm-slider').value = 400; $('#mass-slider').value = 2; $('#arm-slider').value = 0.2;
      } else if (preset === 'heavy-ball') {
        rpm = 150; ballMass = 8; armLength = 0.35;
        $('#rpm-slider').value = 150; $('#mass-slider').value = 8; $('#arm-slider').value = 0.35;
      }

      $('#rpm-val').textContent = rpm + ' rpm';
      $('#mass-val').textContent = ballMass.toFixed(1) + ' kg';
      $('#arm-val').textContent = armLength.toFixed(2) + ' m';
      render();
    });
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
    var tol = Math.max(Math.abs(pProblem.answer) * 0.02, 0.5);
    var ok = !isNaN(val) && Math.abs(val - pProblem.answer) <= tol;
    if (ok) pScore++;
    $('#pp-feedback').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect \u2014 answer: ' + pProblem.answer + ' ' + pProblem.unit;
    $('#pp-feedback').className = 'feedback ' + (ok ? 'ok' : 'err');
    $('#pp-input').disabled = true;
    show($('#pp-next'));
    /* Show solution */
    var solEl = $('#pp-solution');
    solEl.innerHTML = '<h4>Step-by-Step Solution</h4>' +
      pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([0-9.]+)/, '= <strong>$1</strong>') + '</p>'; }).join('');
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
  }

  /* ================================================================
     INIT
     ================================================================ */
  setMode('simulate');

})();
