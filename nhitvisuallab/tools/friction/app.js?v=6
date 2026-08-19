(function () {
  'use strict';

  /* ================================================================
     DATA — EXPLORE CONCEPTS
     ================================================================ */
  var CONCEPTS = [
    /* ── Friction Types ───────────────────────────────────────── */
    {
      id: 'static-friction', name: 'Static Friction', symbol: 'fs \u2264 \u03BCs\u00B7N',
      formula: 'fs,max = \u03BCs \u00D7 N', unit: 'N',
      cat: 'friction-types',
      desc: 'Static friction is the force that resists the initiation of sliding motion between two surfaces in contact. It is a self-adjusting force: it matches the applied force up to a maximum value fs,max = \u03BCs\u00B7N. Once the applied force exceeds this maximum, the object begins to move. Static friction is always greater than or equal to kinetic friction for the same surfaces.',
      diagram: 'staticFriction',
      example: { problem: 'A 20 kg box on a surface with \u03BCs = 0.5. What is the maximum static friction force? (g = 9.81)', steps: ['N = mg = 20 \u00D7 9.81 = 196.2 N', 'fs,max = \u03BCs \u00D7 N', 'fs,max = 0.5 \u00D7 196.2', 'fs,max = 98.1 N'], answer: 98.1, unit: 'N' }
    },
    {
      id: 'kinetic-friction', name: 'Kinetic Friction', symbol: 'fk = \u03BCk\u00B7N',
      formula: 'fk = \u03BCk \u00D7 N', unit: 'N',
      cat: 'friction-types',
      desc: 'Kinetic (sliding) friction acts on an object that is already in motion relative to the surface. Unlike static friction, kinetic friction has a constant magnitude fk = \u03BCk\u00B7N, independent of speed (for most practical cases). The kinetic friction coefficient \u03BCk is always less than the static coefficient \u03BCs for the same pair of surfaces, which is why objects are easier to keep moving than to start moving.',
      diagram: 'kineticFriction',
      example: { problem: 'A 15 kg box slides on a floor with \u03BCk = 0.3. Find the kinetic friction force. (g = 9.81)', steps: ['N = mg = 15 \u00D7 9.81 = 147.15 N', 'fk = \u03BCk \u00D7 N', 'fk = 0.3 \u00D7 147.15', 'fk = 44.15 N'], answer: 44.15, unit: 'N' }
    },
    {
      id: 'rolling-friction', name: 'Rolling Friction', symbol: 'fr = \u03BCr\u00B7N',
      formula: 'fr = \u03BCr \u00D7 N (\u03BCr \u226A \u03BCk)', unit: 'N',
      cat: 'friction-types',
      desc: 'Rolling friction (rolling resistance) is the force resisting the motion of a rolling body on a surface. It is much smaller than sliding friction (\u03BCr typically 0.001 to 0.01 for hard surfaces). This is why wheels and ball bearings are used to reduce friction. Rolling friction arises from deformation of the surfaces at the contact point and energy losses in the material.',
      diagram: 'rollingFriction',
      example: { problem: 'A 500 kg cart on steel wheels (\u03BCr = 0.005) rolls on a flat floor. Find rolling friction. (g = 9.81)', steps: ['N = mg = 500 \u00D7 9.81 = 4905 N', 'fr = \u03BCr \u00D7 N', 'fr = 0.005 \u00D7 4905', 'fr = 24.53 N'], answer: 24.53, unit: 'N' }
    },
    {
      id: 'angle-of-repose', name: 'Angle of Repose', symbol: 'tan\u03B8 = \u03BCs',
      formula: '\u03B8 = arctan(\u03BCs)', unit: '\u00B0',
      cat: 'friction-types',
      desc: 'The angle of repose is the steepest angle of an inclined surface at which an object remains stationary due to friction. At this angle, the component of gravity along the surface exactly equals the maximum static friction force. The angle of repose \u03B8 = arctan(\u03BCs) depends only on the friction coefficient, not on the mass of the object. This concept is vital in geotechnical engineering and granular material handling.',
      diagram: 'angleOfRepose',
      example: { problem: 'A surface has \u03BCs = 0.4. What is the angle of repose?', steps: ['\u03B8 = arctan(\u03BCs)', '\u03B8 = arctan(0.4)', '\u03B8 = 21.80\u00B0', 'Object starts sliding above 21.80\u00B0'], answer: 21.80, unit: '\u00B0' }
    },

    /* ── Force Analysis ───────────────────────────────────────── */
    {
      id: 'normal-flat', name: 'Normal Force on Flat', symbol: 'N = mg',
      formula: 'N = mg (flat, horizontal surface)', unit: 'N',
      cat: 'force-analysis',
      desc: 'On a flat horizontal surface with no vertical forces other than gravity, the normal force equals the weight of the object: N = mg. The normal force is the surface\u2019s reaction to the object\u2019s weight, acting perpendicular to the surface. If additional vertical forces are applied (such as pushing down or pulling up), the normal force adjusts accordingly: N = mg + Fdown or N = mg \u2212 Fup.',
      diagram: 'normalFlat',
      example: { problem: 'A 25 kg box sits on a flat floor. Find the normal force. (g = 9.81)', steps: ['Flat surface, no extra vertical forces', 'N = mg', 'N = 25 \u00D7 9.81', 'N = 245.25 N'], answer: 245.25, unit: 'N' }
    },
    {
      id: 'normal-incline', name: 'Normal Force on Incline', symbol: 'N = mg\u00B7cos\u03B8',
      formula: 'N = mg \u00D7 cos\u03B8', unit: 'N',
      cat: 'force-analysis',
      desc: 'On an inclined plane at angle \u03B8, the normal force is reduced to N = mg\u00B7cos\u03B8 because only the component of weight perpendicular to the surface contributes. The parallel component mg\u00B7sin\u03B8 acts along the slope trying to slide the object down. As the angle increases toward 90\u00B0, the normal force approaches zero and the friction force decreases accordingly.',
      diagram: 'normalIncline',
      example: { problem: 'A 10 kg block is on a 30\u00B0 incline. Find the normal force. (g = 9.81)', steps: ['N = mg \u00D7 cos\u03B8', 'N = 10 \u00D7 9.81 \u00D7 cos(30\u00B0)', 'N = 98.1 \u00D7 0.866', 'N = 84.96 N'], answer: 84.96, unit: 'N' }
    },
    {
      id: 'fbd', name: 'Free Body Diagrams', symbol: 'FBD',
      formula: '\u03A3Fx = max, \u03A3Fy = may', unit: 'N',
      cat: 'force-analysis',
      desc: 'A Free Body Diagram (FBD) shows all forces acting on a body as vectors from its centre of mass. For friction problems, the key forces are: Weight (W = mg, downward), Normal force (N, perpendicular to surface), Applied force (F, at some angle), and Friction force (f, opposing motion along surface). Resolving all forces into components parallel and perpendicular to the surface simplifies the analysis.',
      diagram: 'fbdDiagram',
      example: { problem: 'A 12 kg box is pushed with 80 N on a flat surface (\u03BCk = 0.25). Find acceleration. (g = 9.81)', steps: ['N = mg = 12 \u00D7 9.81 = 117.72 N', 'fk = \u03BCk\u00B7N = 0.25 \u00D7 117.72 = 29.43 N', 'Fnet = 80 \u2212 29.43 = 50.57 N', 'a = Fnet/m = 50.57/12 = 4.21 m/s\u00B2'], answer: 4.21, unit: 'm/s\u00B2' }
    },
    {
      id: 'friction-coefficient', name: 'Friction Coefficient', symbol: '\u03BC = f/N',
      formula: '\u03BC = f / N (dimensionless)', unit: '\u2014',
      cat: 'force-analysis',
      desc: 'The coefficient of friction \u03BC is a dimensionless ratio that characterises the friction between two surfaces. It is determined experimentally: \u03BC = f/N. Typical values range from 0.01 (ice on ice) to over 1.0 (rubber on concrete). The coefficient depends on the materials, surface finish, and conditions (wet vs. dry) but is approximately independent of contact area and sliding speed for most practical applications.',
      diagram: 'frictionCoefficient',
      example: { problem: 'A 30 N force is needed to slide a 50 kg box. Find the kinetic friction coefficient. (g = 9.81)', steps: ['N = mg = 50 \u00D7 9.81 = 490.5 N', 'fk = 30 N (given)', '\u03BCk = fk / N', '\u03BCk = 30 / 490.5 = 0.061'], answer: 0.061, unit: '' }
    },

    /* ── Applications ─────────────────────────────────────────── */
    {
      id: 'braking-distance', name: 'Braking Distance', symbol: 'd = v\u00B2/(2\u03BCg)',
      formula: 'd = v\u00B2 / (2\u03BCg)', unit: 'm',
      cat: 'applications',
      desc: 'Braking distance is the distance a vehicle travels while decelerating to a stop. When brakes lock, the deceleration is a = \u03BCg, and the stopping distance is d = v\u00B2/(2\u03BCg). This shows that doubling the speed quadruples the stopping distance. On wet roads (\u03BC \u2248 0.4) the stopping distance is nearly double compared to dry roads (\u03BC \u2248 0.7). ABS systems maintain static friction (higher \u03BC) rather than allowing wheel lock (kinetic \u03BC).',
      diagram: 'brakingDistance',
      example: { problem: 'A car travelling at 20 m/s brakes on dry road (\u03BC = 0.7). Find stopping distance. (g = 9.81)', steps: ['d = v\u00B2 / (2\u03BCg)', 'd = 20\u00B2 / (2 \u00D7 0.7 \u00D7 9.81)', 'd = 400 / 13.734', 'd = 29.13 m'], answer: 29.13, unit: 'm' }
    },
    {
      id: 'belt-friction', name: 'Belt Friction', symbol: 'T\u2082/T\u2081 = e^(\u03BC\u03B8)',
      formula: 'T\u2082 = T\u2081 \u00D7 e^(\u03BC\u03B8)', unit: 'N',
      cat: 'applications',
      desc: 'The Euler\u2013Eytelwein formula describes friction in belt drives: T\u2082/T\u2081 = e^(\u03BC\u03B8), where T\u2082 is the tight side tension, T\u2081 is the slack side tension, \u03BC is the friction coefficient, and \u03B8 is the wrap angle in radians. A small friction coefficient can hold large loads if the wrap angle is large enough. This is why ropes wrapped around posts can hold ships, and belt drives can transmit significant power.',
      diagram: 'beltFriction',
      example: { problem: 'A belt wraps 180\u00B0 around a pulley (\u03BC = 0.3). Slack side T\u2081 = 100 N. Find tight side T\u2082.', steps: ['\u03B8 = 180\u00B0 = \u03C0 rad', 'T\u2082 = T\u2081 \u00D7 e^(\u03BC\u03B8)', 'T\u2082 = 100 \u00D7 e^(0.3 \u00D7 \u03C0)', 'T\u2082 = 100 \u00D7 2.566 = 256.6 N'], answer: 256.6, unit: 'N' }
    },
    {
      id: 'wedge-friction', name: 'Wedge Friction', symbol: 'Self-locking',
      formula: 'Self-locking when \u03B1 < 2\u00D7arctan(\u03BC)', unit: '\u00B0',
      cat: 'applications',
      desc: 'Wedges use friction for mechanical advantage and self-locking. A wedge with half-angle \u03B1 is self-locking (stays in place without external force) when the friction angle \u03C6 = arctan(\u03BC) is greater than the wedge half-angle. This principle is used in door stops, axe heads, machine tool clamps, and taper locks. The force amplification of a wedge depends on the wedge angle and friction coefficient.',
      diagram: 'wedgeFriction',
      example: { problem: 'A wedge has half-angle 8\u00B0 and \u03BC = 0.2. Is it self-locking?', steps: ['Friction angle \u03C6 = arctan(0.2) = 11.31\u00B0', 'Wedge half-angle \u03B1 = 8\u00B0', 'Since \u03C6 (11.31\u00B0) > \u03B1 (8\u00B0)', 'Yes, the wedge is self-locking'], answer: 11.31, unit: '\u00B0 (friction angle)' }
    },
    {
      id: 'bearing-friction', name: 'Bearing Friction', symbol: 'T = \u03BC\u00B7R\u00B7N',
      formula: 'Friction torque T = \u03BC \u00D7 r \u00D7 N', unit: 'N\u00B7m',
      cat: 'applications',
      desc: 'Journal bearing friction creates a torque T = \u03BC\u00B7r\u00B7N opposing rotation, where r is the shaft radius and N is the bearing load. Reducing bearing friction is critical for machine efficiency. Ball and roller bearings achieve \u03BC \u2248 0.001\u20130.005 compared to \u03BC \u2248 0.08\u20130.15 for plain bearings. Lubrication reduces friction by creating a fluid film between surfaces, transitioning from boundary to hydrodynamic lubrication.',
      diagram: 'bearingFriction',
      example: { problem: 'A 50 mm diameter shaft carries 5000 N load with \u03BC = 0.1. Find friction torque.', steps: ['r = 50/2 = 25 mm = 0.025 m', 'T = \u03BC \u00D7 r \u00D7 N', 'T = 0.1 \u00D7 0.025 \u00D7 5000', 'T = 12.5 N\u00B7m'], answer: 12.5, unit: 'N\u00B7m' }
    }
  ];

  /* ================================================================
     DATA — PRACTICE GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    /* 0 — Friction force on flat surface */
    function () {
      var m = randInt(5, 50);
      var mu = +((Math.random() * 0.5 + 0.1).toFixed(2));
      var N = +(m * 9.81).toFixed(2);
      var f = +(mu * N).toFixed(2);
      return { prompt: 'A ' + m + ' kg box sits on a flat surface with \u03BCk = ' + mu + '. Find the kinetic friction force (N). (g = 9.81)', steps: ['N = mg = ' + m + ' \u00D7 9.81 = ' + N + ' N', 'fk = \u03BCk \u00D7 N', 'fk = ' + mu + ' \u00D7 ' + N, 'fk = ' + f + ' N'], answer: f, unit: 'N' };
    },
    /* 1 — Normal force on flat */
    function () {
      var m = randInt(5, 80);
      var N = +(m * 9.81).toFixed(1);
      return { prompt: 'Find the normal force on a ' + m + ' kg object resting on a flat horizontal surface. (g = 9.81)', steps: ['Flat surface, no extra vertical forces', 'N = mg', 'N = ' + m + ' \u00D7 9.81', 'N = ' + N + ' N'], answer: N, unit: 'N' };
    },
    /* 2 — Minimum force to start moving */
    function () {
      var m = randInt(5, 40);
      var mus = +((Math.random() * 0.5 + 0.2).toFixed(2));
      var N = +(m * 9.81).toFixed(2);
      var fMax = +(mus * N).toFixed(2);
      return { prompt: 'A ' + m + ' kg box on a surface with \u03BCs = ' + mus + '. What minimum horizontal force is needed to start it moving? (g = 9.81)', steps: ['N = mg = ' + m + ' \u00D7 9.81 = ' + N + ' N', 'F\u2098\u1d62\u2099 = \u03BCs \u00D7 N', 'F\u2098\u1d62\u2099 = ' + mus + ' \u00D7 ' + N, 'F\u2098\u1d62\u2099 = ' + fMax + ' N'], answer: fMax, unit: 'N' };
    },
    /* 3 — Angle of repose */
    function () {
      var mus = +((Math.random() * 0.6 + 0.2).toFixed(2));
      var angle = +(Math.atan(mus) * 180 / Math.PI).toFixed(2);
      return { prompt: 'A surface has \u03BCs = ' + mus + '. Find the angle of repose (\u00B0).', steps: ['\u03B8 = arctan(\u03BCs)', '\u03B8 = arctan(' + mus + ')', '\u03B8 = ' + angle + '\u00B0'], answer: angle, unit: '\u00B0' };
    },
    /* 4 — Stopping distance */
    function () {
      var v = randInt(10, 30);
      var mu = +((Math.random() * 0.4 + 0.3).toFixed(2));
      var d = +(v * v / (2 * mu * 9.81)).toFixed(2);
      return { prompt: 'A car travels at ' + v + ' m/s and brakes (\u03BC = ' + mu + '). Find the stopping distance (m). (g = 9.81)', steps: ['d = v\u00B2 / (2\u03BCg)', 'd = ' + v + '\u00B2 / (2 \u00D7 ' + mu + ' \u00D7 9.81)', 'd = ' + (v * v) + ' / ' + (2 * mu * 9.81).toFixed(3), 'd = ' + d + ' m'], answer: d, unit: 'm' };
    },
    /* 5 — Acceleration with friction */
    function () {
      var m = randInt(5, 30);
      var F = randInt(30, 150);
      var muk = +((Math.random() * 0.3 + 0.1).toFixed(2));
      var N = +(m * 9.81).toFixed(2);
      var fk = +(muk * N).toFixed(2);
      var Fnet = +(F - fk).toFixed(2);
      var a = +(Fnet / m).toFixed(2);
      return { prompt: 'A ' + F + ' N force pushes a ' + m + ' kg box (\u03BCk = ' + muk + '). Find the acceleration (m/s\u00B2). (g = 9.81)', steps: ['N = mg = ' + N + ' N', 'fk = \u03BCk\u00B7N = ' + muk + ' \u00D7 ' + N + ' = ' + fk + ' N', 'Fnet = ' + F + ' \u2212 ' + fk + ' = ' + Fnet + ' N', 'a = Fnet/m = ' + Fnet + '/' + m + ' = ' + a + ' m/s\u00B2'], answer: a, unit: 'm/s\u00B2' };
    },
    /* 6 — Coefficient from data */
    function () {
      var m = randInt(10, 50);
      var N = +(m * 9.81).toFixed(2);
      var mu = +((Math.random() * 0.4 + 0.1).toFixed(2));
      var f = +(mu * N).toFixed(2);
      return { prompt: 'A ' + m + ' kg box requires ' + f + ' N to keep it sliding. Find \u03BCk. (g = 9.81)', steps: ['N = mg = ' + m + ' \u00D7 9.81 = ' + N + ' N', '\u03BCk = fk / N', '\u03BCk = ' + f + ' / ' + N, '\u03BCk = ' + mu], answer: mu, unit: '' };
    },
    /* 7 — Normal force on incline */
    function () {
      var m = randInt(5, 30);
      var angle = randInt(15, 45);
      var cosA = +Math.cos(angle * Math.PI / 180).toFixed(4);
      var N = +(m * 9.81 * cosA).toFixed(2);
      return { prompt: 'A ' + m + ' kg block on a ' + angle + '\u00B0 incline. Find the normal force (N). (g = 9.81)', steps: ['N = mg\u00B7cos\u03B8', 'N = ' + m + ' \u00D7 9.81 \u00D7 cos(' + angle + '\u00B0)', 'N = ' + (m * 9.81).toFixed(2) + ' \u00D7 ' + cosA, 'N = ' + N + ' N'], answer: N, unit: 'N' };
    },
    /* 8 — Force on incline (impending motion) */
    function () {
      var m = randInt(5, 25);
      var angle = randInt(10, 35);
      var mus = +((Math.random() * 0.3 + 0.2).toFixed(2));
      var cosA = Math.cos(angle * Math.PI / 180);
      var sinA = Math.sin(angle * Math.PI / 180);
      var W = m * 9.81;
      var Fdown = +(W * sinA).toFixed(2);
      var N = +(W * cosA).toFixed(2);
      var fMax = +(mus * N).toFixed(2);
      var net = +(Fdown - fMax).toFixed(2);
      return { prompt: 'A ' + m + ' kg block on a ' + angle + '\u00B0 incline (\u03BCs = ' + mus + '). What is the friction force at impending motion? (g = 9.81)', steps: ['N = mg\u00B7cos\u03B8 = ' + N + ' N', 'W\u2225 = mg\u00B7sin\u03B8 = ' + Fdown + ' N', 'fs,max = \u03BCs\u00B7N = ' + mus + ' \u00D7 ' + N, 'fs,max = ' + fMax + ' N'], answer: fMax, unit: 'N' };
    },
    /* 9 — Pulling at angle: normal force */
    function () {
      var m = randInt(10, 40);
      var F = randInt(30, 100);
      var alpha = randInt(15, 45);
      var sinA = +Math.sin(alpha * Math.PI / 180).toFixed(4);
      var Nval = +(m * 9.81 - F * sinA).toFixed(2);
      return { prompt: 'A ' + F + ' N force pulls a ' + m + ' kg box at ' + alpha + '\u00B0 above horizontal. Find the normal force (N). (g = 9.81)', steps: ['N = mg \u2212 F\u00B7sin\u03B1', 'N = ' + m + ' \u00D7 9.81 \u2212 ' + F + ' \u00D7 sin(' + alpha + '\u00B0)', 'N = ' + (m * 9.81).toFixed(2) + ' \u2212 ' + (F * sinA).toFixed(2), 'N = ' + Nval + ' N'], answer: Nval, unit: 'N' };
    },
    /* 10 — Deceleration from friction */
    function () {
      var muk = +((Math.random() * 0.4 + 0.2).toFixed(2));
      var a = +(muk * 9.81).toFixed(2);
      return { prompt: 'A sliding block has \u03BCk = ' + muk + '. Find its deceleration (m/s\u00B2). (g = 9.81)', steps: ['Only friction acts horizontally', 'a = \u03BCk \u00D7 g', 'a = ' + muk + ' \u00D7 9.81', 'a = ' + a + ' m/s\u00B2'], answer: a, unit: 'm/s\u00B2' };
    },
    /* 11 — Belt friction */
    function () {
      var T1 = randInt(50, 200);
      var mu = +((Math.random() * 0.3 + 0.2).toFixed(2));
      var angleDeg = [90, 120, 150, 180][randInt(0, 3)];
      var angleRad = angleDeg * Math.PI / 180;
      var T2 = +(T1 * Math.exp(mu * angleRad)).toFixed(2);
      return { prompt: 'A belt wraps ' + angleDeg + '\u00B0 around a pulley (\u03BC = ' + mu + '). Slack side T\u2081 = ' + T1 + ' N. Find tight side T\u2082 (N).', steps: ['\u03B8 = ' + angleDeg + '\u00B0 = ' + angleRad.toFixed(4) + ' rad', 'T\u2082 = T\u2081 \u00D7 e^(\u03BC\u03B8)', 'T\u2082 = ' + T1 + ' \u00D7 e^(' + mu + ' \u00D7 ' + angleRad.toFixed(4) + ')', 'T\u2082 = ' + T2 + ' N'], answer: T2, unit: 'N' };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15)
     ================================================================ */
  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'Static friction force is always:', options: ['\u2264 \u03BCs\u00B7N', '= \u03BCs\u00B7N', '> \u03BCk\u00B7N', '= applied force'], correct: 0 },
    { type: 'mcq', prompt: 'Kinetic friction applies when the object is:', options: ['Already sliding', 'About to move', 'At rest', 'Rolling without slip'], correct: 0 },
    { type: 'mcq', prompt: 'On an incline at the angle of repose, friction force equals:', options: ['mg\u00B7sin\u03B8', 'mg\u00B7cos\u03B8', 'mg', '\u03BCs\u00B7mg'], correct: 0 },
    { type: 'mcq', prompt: 'Coefficient of friction is:', options: ['Dimensionless', 'Measured in Newtons', 'Measured in kg', 'Measured in m/s\u00B2'], correct: 0 },
    { type: 'mcq', prompt: 'If you double the speed, braking distance:', options: ['Quadruples', 'Doubles', 'Stays same', 'Halves'], correct: 0 },
    { type: 'mcq', prompt: 'Normal force on a flat surface equals:', options: ['mg', 'mg\u00B7sin\u03B8', '\u03BC\u00B7mg', 'F\u00B7cos\u03B8'], correct: 0 },
    { type: 'mcq', prompt: 'Pulling an object at an angle above horizontal:', options: ['Reduces normal force', 'Increases normal force', 'Has no effect on normal force', 'Doubles friction'], correct: 0 },
    { type: 'mcq', prompt: 'Rolling friction compared to sliding friction is:', options: ['Much smaller', 'Much larger', 'About equal', 'Zero'], correct: 0 },
    { type: 'mcq', prompt: '\u03BCk is typically:', options: ['Less than \u03BCs', 'Greater than \u03BCs', 'Equal to \u03BCs', 'Unrelated to \u03BCs'], correct: 0 },
    { type: 'mcq', prompt: 'A self-locking wedge requires:', options: ['Friction angle > wedge half-angle', 'Friction angle < wedge half-angle', 'Zero friction', 'Large mass'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'A 10 kg box on a flat surface (\u03BCs = 0.5). Maximum static friction (N)? (g = 9.81)', answer: 49.05, unit: 'N', steps: ['N = mg = 10 \u00D7 9.81 = 98.1 N', 'fs,max = \u03BCs\u00B7N = 0.5 \u00D7 98.1 = 49.05 N'] },
    { type: 'numeric', prompt: 'Car at 15 m/s brakes (\u03BC = 0.6). Stopping distance (m)? Round to 2 decimals. (g = 9.81)', answer: 19.11, unit: 'm', steps: ['d = v\u00B2/(2\u03BCg) = 225/(2\u00D70.6\u00D79.81)', 'd = 225/11.772 = 19.11 m'] },
    { type: 'numeric', prompt: '20 kg block on 25\u00B0 incline. Normal force (N)? Round to 2 decimals. (g = 9.81)', answer: 177.80, unit: 'N', steps: ['N = mg\u00B7cos\u03B8 = 20\u00D79.81\u00D7cos(25\u00B0)', 'N = 196.2\u00D70.9063 = 177.80 N'] },
    { type: 'numeric', prompt: '100 N force pushes a 20 kg box (\u03BCk = 0.2). Find acceleration (m/s\u00B2). Round to 2 decimals. (g = 9.81)', answer: 3.04, unit: 'm/s\u00B2', steps: ['N = mg = 196.2 N', 'fk = 0.2\u00D7196.2 = 39.24 N', 'Fnet = 100\u221239.24 = 60.76 N', 'a = 60.76/20 = 3.04 m/s\u00B2'] },
    { type: 'numeric', prompt: '\u03BCs = 0.6. Angle of repose (\u00B0)? Round to 2 decimals.', answer: 30.96, unit: '\u00B0', steps: ['\u03B8 = arctan(\u03BCs) = arctan(0.6)', '\u03B8 = 30.96\u00B0'] }
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
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function degToRad(d) { return d * Math.PI / 180; }

  /* ================================================================
     CANVAS SETUP
     ================================================================ */
  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 480;
  var dpr = window.devicePixelRatio || 1;
  cvs.width = W * dpr; cvs.height = H * dpr;
  cvs.style.maxWidth = W + 'px';
  ctx.scale(dpr, dpr);

  /* ================================================================
     STATE
     ================================================================ */
  var mode = 'simulate';
  var scenario = 'flat';

  /* Simulation parameters */
  var S = {
    mass: 10, force: 80, mus: 0.40, muk: 0.30,
    incline: 40, pullAngle: 30
  };

  /* Animation state */
  var anim = {
    blockX: 200, blockVel: 0, sliding: false,
    shakeT: 0, brakeX: 100, brakeVel: 80,
    brakeStopped: false, time: 0,
    blockDist: 250, liftY: 0, skidLen: 0
  };
  var animFrame = null;
  var simulating = false, simTime = 0, simDone = false, simLastTs = 0;
  var canMove = false;
  var angleMode = 'pull'; /* 'pull' or 'push' */
  var simSpeed = 0.4; /* normalized time per second */
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  var G = 9.81;
  var SCALE = 2.5; /* pixels per N for arrows */

  /* Explore */
  var selCat = 'friction-types';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* ================================================================
     PHYSICS CALCULATIONS
     ================================================================ */
  function calcFlat() {
    var W_ = S.mass * G;
    var N = W_;
    var maxFs = S.mus * N;
    var fk = S.muk * N;
    var applied = S.force;
    var sliding = applied > maxFs;
    var frictionF = sliding ? fk : Math.min(applied, maxFs);
    var net = applied - frictionF;
    if (!sliding) net = 0;
    var accel = sliding ? net / S.mass : 0;
    var status = applied < maxFs * 0.99 ? 'Static' : (applied >= maxFs && !sliding ? 'Impending' : 'Sliding');
    if (applied >= maxFs) { sliding = true; status = 'Sliding'; frictionF = fk; net = applied - fk; accel = net / S.mass; }
    if (applied < 0.01) { status = 'Static'; frictionF = 0; net = 0; accel = 0; }
    return { N: N, friction: frictionF, applied: applied, net: net, accel: accel, status: status, weight: W_, maxFs: maxFs, fk: fk, sliding: sliding };
  }

  function calcIncline() {
    var theta = degToRad(S.incline);
    var W_ = S.mass * G;
    var N = W_ * Math.cos(theta);
    var Wpar = W_ * Math.sin(theta);
    var maxFs = S.mus * N;
    var fk = S.muk * N;
    var sliding = Wpar > maxFs;
    var frictionF = sliding ? fk : Math.min(Wpar, maxFs);
    var net = sliding ? Wpar - fk : 0;
    var accel = sliding ? net / S.mass : 0;
    var status = Wpar < maxFs * 0.95 ? 'Static' : (!sliding ? 'Impending' : 'Sliding');
    if (Wpar > maxFs) { sliding = true; status = 'Sliding'; }
    var angleOfRepose = Math.atan(S.mus) * 180 / Math.PI;
    return { N: N, friction: frictionF, applied: Wpar, net: net, accel: accel, status: status, weight: W_, Wpar: Wpar, Wperp: N, maxFs: maxFs, fk: fk, sliding: sliding, angleOfRepose: angleOfRepose };
  }

  function calcAngle() {
    var alpha = degToRad(S.pullAngle);
    var W_ = S.mass * G;
    var Fh = S.force * Math.cos(alpha);
    var Fv = S.force * Math.sin(alpha);
    var N, maxFs, fk, sliding, frictionF, net, accel, status;
    if (angleMode === 'pull') {
      /* Pull: vertical component lifts, reducing normal force */
      N = Math.max(0, W_ - Fv);
    } else {
      /* Push: vertical component presses into surface, increasing normal force */
      N = W_ + Fv;
    }
    maxFs = S.mus * N;
    fk = S.muk * N;
    sliding = Fh > maxFs;
    frictionF = sliding ? fk : Math.min(Fh, maxFs);
    net = sliding ? Fh - fk : 0;
    accel = sliding ? net / S.mass : 0;
    status = Fh < maxFs * 0.95 ? 'Static' : (!sliding ? 'Impending' : 'Sliding');
    if (Fh > maxFs) { sliding = true; status = 'Sliding'; }
    if (angleMode === 'pull' && N <= 0) { status = 'Lifted'; frictionF = 0; net = Fh; accel = net / S.mass; }
    return { N: N, friction: frictionF, applied: S.force, net: net, accel: accel, status: status, weight: W_, Fh: Fh, Fv: Fv, maxFs: maxFs, fk: fk, sliding: sliding };
  }

  function calcBraking() {
    var W_ = S.mass * G;
    var N = W_;
    /* Brake-limited model: brake system has a fixed force capacity
       (calibrated at 10 kg). Lighter mass stops shorter, heavier mass stops longer. */
    var refMass = 10;
    var brakeForce = S.muk * refMass * G; /* fixed brake system capacity */
    var decel = brakeForce / S.mass;
    var v0 = S.force; /* reuse force slider as initial velocity for braking */
    var dist = decel > 0 ? (v0 * v0) / (2 * decel) : 0;
    return { N: N, friction: brakeForce, applied: 0, net: -brakeForce, accel: -decel, status: anim.brakeStopped ? 'Stopped' : 'Braking', weight: W_, v0: v0, dist: dist, decel: decel, brakeForce: brakeForce };
  }

  function getCalc() {
    switch (scenario) {
      case 'flat': return calcFlat();
      case 'incline': return calcIncline();
      case 'angle': return calcAngle();
      case 'braking': return calcBraking();
      default: return calcFlat();
    }
  }

  /* ================================================================
     DRAWING HELPERS
     ================================================================ */
  function drawArrow(x1, y1, x2, y2, color, headSize) {
    headSize = headSize || 8;
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    var ux = dx / len, uy = dy / len;
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * headSize * 0.5, y2 - uy * headSize * 0.5);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * headSize - uy * headSize * 0.5, y2 - uy * headSize + ux * headSize * 0.5);
    ctx.lineTo(x2 - ux * headSize + uy * headSize * 0.5, y2 - uy * headSize - ux * headSize * 0.5);
    ctx.closePath(); ctx.fill();
  }

  function drawSurface(y, label, textured) {
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke();
    if (textured) {
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 1.2;
      for (var x = 40; x < W - 30; x += 18) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 9); ctx.stroke();
      }
    }
    if (label) {
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(label, 35, y + 14);
    }
  }

  function drawBlock(x, y, w, h, massLabel, color, strokeColor) {
    ctx.fillStyle = color || 'rgba(141,110,99,0.35)';
    ctx.strokeStyle = strokeColor || '#8d6e63';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 5); ctx.fill(); ctx.stroke();
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = strokeColor || '#8d6e63';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(massLabel, x + w / 2, y + h / 2);
  }

  function drawForceLabel(x, y, label, color, align) {
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = color; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }

  function drawBadge(x, y, w, h, title, value, valueColor) {
    ctx.fillStyle = 'rgba(141,110,99,0.12)';
    ctx.strokeStyle = 'rgba(141,110,99,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.fill(); ctx.stroke();
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(title, x + w / 2, y + 5);
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = valueColor || '#8d6e63';
    ctx.fillText(value, x + w / 2, y + 22);
  }

  /* ================================================================
     DRAWING — FLAT SURFACE SCENARIO
     ================================================================ */
  function drawFlat() {
    var c = calcFlat();
    var surfY = 340;
    drawSurface(surfY, 'Rough Surface (\u03BCs=' + S.mus + ', \u03BCk=' + S.muk + ')', true);

    /* Block (with shake if near impending) */
    var bw = 80, bh = 60;
    var bx = anim.blockX;
    var by = surfY - bh;
    var nearImpending = Math.abs(S.force - c.maxFs) < c.maxFs * 0.08 && S.force > 0;
    if (nearImpending && !c.sliding) {
      anim.shakeT += 0.4;
      bx += Math.sin(anim.shakeT * 8) * 3;
    }
    drawBlock(bx, by, bw, bh, S.mass + ' kg');

    var cx = bx + bw / 2, cy = by + bh / 2;

    /* Weight arrow (down) */
    var wLen = clamp(c.weight * 0.4, 20, 80);
    drawArrow(cx, surfY, cx, surfY + wLen, '#e57373', 8);
    drawForceLabel(cx + 30, surfY + wLen / 2, 'W=' + c.weight.toFixed(1) + 'N', '#e57373');

    /* Normal arrow (up) */
    var nLen = clamp(c.N * 0.4, 20, 80);
    drawArrow(cx, by, cx, by - nLen, '#42a5f5', 8);
    drawForceLabel(cx + 30, by - nLen / 2, 'N=' + c.N.toFixed(1) + 'N', '#42a5f5');

    /* Applied force arrow — drives the block to the RIGHT (green, right side).
       Convention across the whole tool: applied force & motion point right,
       friction opposes and points left. */
    if (S.force > 0) {
      var fLen = clamp(S.force * 0.3, 15, 120);
      drawArrow(bx + bw + 5, cy, bx + bw + 5 + fLen, cy, '#3ddc84', 9);
      drawForceLabel(bx + bw + fLen / 2 + 10, cy - 15, 'F=' + S.force + 'N →', '#3ddc84');
    }

    /* Friction arrow — OPPOSES motion, at the contact surface, pointing LEFT (red) */
    if (c.friction > 0.1) {
      var frLen = clamp(c.friction * 0.3, 10, 100);
      var fricY = surfY - 8; /* along the contact surface, not through the block body */
      drawArrow(bx - 5, fricY, bx - 5 - frLen, fricY, '#ff5555', 8);
      drawForceLabel(bx - frLen / 2 - 10, fricY - 12, '← f=' + c.friction.toFixed(1) + 'N', '#ff5555');
    }

    /* Status text */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    if (c.status === 'Static') { ctx.fillStyle = '#3ddc84'; ctx.fillText('STATIC \u2014 f = Applied Force (' + c.friction.toFixed(1) + ' N)', W / 2, 50); }
    else if (c.status === 'Sliding') { ctx.fillStyle = '#ff5555'; ctx.fillText('SLIDING \u2014 Kinetic Friction fk = ' + c.fk.toFixed(1) + ' N', W / 2, 50); }

    /* Friction force graph bar */
    drawFrictionBar(c);

    /* Badges */
    drawBadge(30, 10, 110, 42, 'Max Static', c.maxFs.toFixed(1) + ' N');
    drawBadge(150, 10, 110, 42, 'Kinetic', c.fk.toFixed(1) + ' N');
    drawBadge(W - 240, 10, 110, 42, 'Net Force', c.net.toFixed(1) + ' N', c.net > 0 ? '#3ddc84' : '#6b7a99');
    drawBadge(W - 120, 10, 110, 42, 'Accel', c.accel.toFixed(2) + ' m/s\u00B2', c.accel > 0 ? '#42a5f5' : '#6b7a99');

    /* FBD mini diagram */
    drawMiniFBD(680, 200, c.weight, c.N, S.force, c.friction, 'Flat FBD');

    /* Pulsing "Press Simulate" prompt */
    if (!simulating && !simDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('\u25B6 Press Simulate to test friction', W / 2, H - 15);
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(function () { draw(); });
    }
  }

  function drawFrictionBar(c) {
    var barX = 60, barY = H - 60, barW = 350, barH = 20;
    /* Background */
    ctx.fillStyle = '#1f2535';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();
    /* Max static region */
    var maxW = clamp((c.maxFs / (S.force > 0 ? Math.max(S.force, c.maxFs) : c.maxFs)) * barW, 0, barW);
    ctx.fillStyle = 'rgba(141,110,99,0.35)';
    ctx.beginPath(); ctx.roundRect(barX, barY, maxW, barH, 4); ctx.fill();
    /* Current friction */
    var curW = clamp((c.friction / Math.max(S.force, c.maxFs, 1)) * barW, 0, barW);
    ctx.fillStyle = c.sliding ? 'rgba(255,85,85,0.55)' : 'rgba(61,220,132,0.55)';
    ctx.beginPath(); ctx.roundRect(barX, barY, curW, barH, 4); ctx.fill();
    /* Labels */
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left';
    ctx.fillText('Friction Force', barX, barY - 5);
    ctx.textAlign = 'right';
    ctx.fillText('\u03BCs\u00B7N = ' + c.maxFs.toFixed(1) + ' N', barX + barW, barY - 5);
    /* Applied force marker */
    if (S.force > 0) {
      var appX = barX + clamp((S.force / Math.max(S.force, c.maxFs, 1)) * barW, 0, barW);
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(appX, barY - 3); ctx.lineTo(appX, barY + barH + 3); ctx.stroke();
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
      ctx.fillText('F=' + S.force, appX, barY + barH + 14);
    }
  }

  function drawMiniFBD(cx, cy, W_, N, F, f, title) {
    /* Title */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText(title, cx, cy - 60);
    /* Central dot */
    ctx.fillStyle = 'rgba(141,110,99,0.5)';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    /* Weight */
    var sc = 0.25;
    var wL = clamp(W_ * sc, 10, 50);
    drawArrow(cx, cy, cx, cy + wL, '#e57373', 6);
    /* Normal */
    var nL = clamp(N * sc, 10, 50);
    drawArrow(cx, cy, cx, cy - nL, '#42a5f5', 6);
    /* Applied (drives motion to the RIGHT) */
    if (F > 0) {
      var fL = clamp(F * sc, 10, 50);
      drawArrow(cx, cy, cx + fL, cy, '#3ddc84', 6);
    }
    /* Friction (opposes → points LEFT) */
    if (f > 0.1) {
      var frL = clamp(f * sc, 10, 50);
      drawArrow(cx, cy, cx - frL, cy, '#ff5555', 6);
    }
    /* Labels */
    ctx.font = '600 8px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e57373'; ctx.fillText('W', cx + 12, cy + wL - 3);
    ctx.fillStyle = '#42a5f5'; ctx.fillText('N', cx + 12, cy - nL + 5);
    if (F > 0) { ctx.fillStyle = '#3ddc84'; ctx.fillText('F', cx + clamp(F * sc, 10, 50) + 8, cy - 5); }
    if (f > 0.1) { ctx.fillStyle = '#ff5555'; ctx.fillText('f', cx - clamp(f * sc, 10, 50) - 8, cy - 5); }
  }

  /* ================================================================
     DRAWING — INCLINED PLANE SCENARIO
     ================================================================ */
  function drawIncline() {
    var c = calcIncline();
    var theta = degToRad(S.incline);

    /* Draw inclined plane */
    var baseX = 100, baseY = 380;
    var planeLen = 550;
    var topX = baseX + planeLen * Math.cos(theta);
    var topY = baseY - planeLen * Math.sin(theta);

    /* Ground line */
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(50, baseY); ctx.lineTo(W - 50, baseY); ctx.stroke();

    /* Incline surface */
    ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(topX, topY); ctx.stroke();

    /* Surface roughness marks on incline */
    ctx.strokeStyle = '#bcaaa4'; ctx.lineWidth = 1;
    var cos90 = Math.cos(theta + Math.PI / 2), sin90 = Math.sin(theta + Math.PI / 2);
    for (var i = 30; i < planeLen - 30; i += 25) {
      var px = baseX + i * Math.cos(theta);
      var py = baseY - i * Math.sin(theta);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + cos90 * 8, py + sin90 * 8);
      ctx.stroke();
    }

    /* Angle arc */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(baseX, baseY, 50, -Math.PI, -Math.PI + theta, true);
    ctx.stroke();
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
    ctx.fillText('\u03B8=' + S.incline + '\u00B0', baseX + 70, baseY - 15);

    /* Block on incline */
    var blockDist = anim.blockDist || 250;
    var bx = baseX + blockDist * Math.cos(theta);
    var by = baseY - blockDist * Math.sin(theta);
    var bw = 70, bh = 50;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-theta);
    drawBlock(-bw / 2, -bh, bw, bh, S.mass + 'kg', 'rgba(141,110,99,0.35)', '#8d6e63');
    ctx.restore();

    /* Weight arrow (straight down from block center) */
    var bcx = bx, bcy = by - bh / 2 * Math.cos(theta);
    var wLen = clamp(c.weight * 0.3, 20, 70);
    drawArrow(bcx, bcy, bcx, bcy + wLen, '#e57373', 8);
    drawForceLabel(bcx + 35, bcy + wLen / 2, 'W=' + c.weight.toFixed(0) + 'N', '#e57373');

    /* Weight components */
    /* W parallel (along plane, downward) */
    var wpLen = clamp(c.Wpar * 0.4, 10, 60);
    var wpEx = bcx + wpLen * Math.cos(theta);
    var wpEy = bcy + wpLen * Math.sin(theta) * (theta > 0 ? 1 : -1);
    /* Actually along the slope pointing down-slope */
    drawArrow(bcx, bcy, bcx - wpLen * Math.cos(theta), bcy + wpLen * Math.sin(theta), '#e5737390', 6);
    drawForceLabel(bcx - wpLen * Math.cos(theta) - 20, bcy + wpLen * Math.sin(theta), 'W\u2225=' + c.Wpar.toFixed(1), '#e57373');

    /* Normal force (perpendicular to surface, away from surface) */
    var nLen = clamp(c.N * 0.4, 15, 60);
    drawArrow(bcx, bcy, bcx - nLen * Math.sin(theta), bcy - nLen * Math.cos(theta), '#42a5f5', 7);
    drawForceLabel(bcx - nLen * Math.sin(theta) - 20, bcy - nLen * Math.cos(theta), 'N=' + c.N.toFixed(1), '#42a5f5');

    /* Friction (along surface, up the slope) */
    if (c.friction > 0.1) {
      var frLen = clamp(c.friction * 0.4, 10, 60);
      drawArrow(bcx, bcy, bcx + frLen * Math.cos(theta), bcy - frLen * Math.sin(theta), '#ff5555', 7);
      drawForceLabel(bcx + frLen * Math.cos(theta) + 25, bcy - frLen * Math.sin(theta), 'f=' + c.friction.toFixed(1), '#ff5555');
    }

    /* Status & info */
    ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    if (c.status === 'Static') { ctx.fillStyle = '#3ddc84'; ctx.fillText('STATIC \u2014 Block held by friction', W / 2, 35); }
    else if (c.status === 'Impending') { ctx.fillStyle = '#f5c842'; ctx.fillText('IMPENDING MOTION \u2014 About to slide!', W / 2, 35); }
    else { ctx.fillStyle = '#ff5555'; ctx.fillText('SLIDING \u2014 tan\u03B8 > \u03BCs', W / 2, 35); }

    /* Angle of repose badge */
    drawBadge(W - 240, 10, 110, 42, 'Repose Angle', c.angleOfRepose.toFixed(1) + '\u00B0', S.incline >= c.angleOfRepose ? '#ff5555' : '#3ddc84');
    drawBadge(W - 120, 10, 110, 42, 'Accel', c.accel.toFixed(2) + ' m/s\u00B2', c.accel > 0 ? '#ff5555' : '#6b7a99');
    drawBadge(30, 10, 110, 42, 'Normal', c.N.toFixed(1) + ' N');
    drawBadge(150, 10, 110, 42, 'Friction', c.friction.toFixed(1) + ' N');

    /* Pulsing "Press Simulate" prompt */
    if (!simulating && !simDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('\u25B6 Press Simulate to test friction', W / 2, H - 15);
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(function () { draw(); });
    }
  }

  /* ================================================================
     DRAWING — PULLING AT ANGLE SCENARIO
     ================================================================ */
  function drawAngle() {
    var c = calcAngle();
    var surfY = 340;
    var isPull = (angleMode === 'pull');
    var modeLabel = isPull ? 'Pulling at Angle' : 'Pushing at Angle';
    drawSurface(surfY, 'Surface (\u03BCs=' + S.mus + ', \u03BCk=' + S.muk + ')', true);

    /* Block */
    var bw = 80, bh = 60;
    var bx = anim.blockX || 300, by = surfY - bh - (anim.liftY || 0);
    drawBlock(bx, by, bw, bh, S.mass + 'kg');

    var cx = bx + bw / 2, cy = by + bh / 2;
    var alpha = degToRad(S.pullAngle);

    /* Applied force at angle */
    if (S.force > 0) {
      var fLen = clamp(S.force * 0.35, 20, 130);

      if (isPull) {
        /* PULL: Arrow from right side of block going upper-right */
        var fx2 = bx + bw + fLen * Math.cos(alpha);
        var fy2 = cy - fLen * Math.sin(alpha);
        drawArrow(bx + bw, cy, fx2, fy2, '#3ddc84', 9);
        drawForceLabel(fx2 + 10, fy2 - 10, 'F=' + S.force + 'N', '#3ddc84');

        /* Angle arc at right side */
        ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx + bw, cy, 35, -alpha, 0, false);
        ctx.stroke();
        ctx.font = '600 10px "Segoe UI", sans-serif';
        ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
        ctx.fillText('\u03B1=' + S.pullAngle + '\u00B0', bx + bw + 50, cy - 20);

        /* Component arrows (dashed) */
        ctx.setLineDash([4, 3]);
        var hLen = clamp(c.Fh * 0.35, 10, 100);
        ctx.strokeStyle = 'rgba(61,220,132,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx + bw, cy); ctx.lineTo(bx + bw + hLen, cy); ctx.stroke();
        ctx.font = '600 9px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(61,220,132,0.7)'; ctx.textAlign = 'center';
        ctx.fillText('Fcos\u03B1=' + c.Fh.toFixed(1), bx + bw + hLen / 2, cy + 15);
        var vLen = clamp(c.Fv * 0.35, 10, 60);
        ctx.strokeStyle = 'rgba(61,220,132,0.5)';
        ctx.beginPath(); ctx.moveTo(bx + bw, cy); ctx.lineTo(bx + bw, cy - vLen); ctx.stroke();
        ctx.fillText('Fsin\u03B1=' + c.Fv.toFixed(1), bx + bw + 45, cy - vLen / 2);
        ctx.setLineDash([]);
      } else {
        /* PUSH: Arrow from upper-left coming down into block left side */
        var fx2 = bx - fLen * Math.cos(alpha);
        var fy2 = cy - fLen * Math.sin(alpha);
        drawArrow(fx2, fy2, bx, cy, '#3ddc84', 9);
        drawForceLabel(fx2 - 15, fy2 - 10, 'F=' + S.force + 'N', '#3ddc84');

        /* Angle arc at left side (below horizontal) */
        ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, cy, 35, Math.PI, Math.PI + alpha, true);
        ctx.stroke();
        ctx.font = '600 10px "Segoe UI", sans-serif';
        ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
        ctx.fillText('\u03B1=' + S.pullAngle + '\u00B0', bx - 50, cy - 20);

        /* Component arrows (dashed) */
        ctx.setLineDash([4, 3]);
        var hLen = clamp(c.Fh * 0.35, 10, 100);
        ctx.strokeStyle = 'rgba(61,220,132,0.5)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, cy); ctx.lineTo(bx + hLen, cy); ctx.stroke();
        ctx.font = '600 9px "Segoe UI", sans-serif';
        ctx.fillStyle = 'rgba(61,220,132,0.7)'; ctx.textAlign = 'center';
        ctx.fillText('Fcos\u03B1=' + c.Fh.toFixed(1), bx + hLen / 2, cy + 15);
        var vLen = clamp(c.Fv * 0.35, 10, 60);
        ctx.strokeStyle = 'rgba(61,220,132,0.5)';
        ctx.beginPath(); ctx.moveTo(bx, cy); ctx.lineTo(bx, cy + vLen); ctx.stroke();
        ctx.fillText('Fsin\u03B1=' + c.Fv.toFixed(1), bx + 45, cy + vLen / 2);
        ctx.setLineDash([]);
      }
    }

    /* Weight */
    var wLen = clamp(c.weight * 0.35, 20, 80);
    drawArrow(cx, surfY, cx, surfY + wLen, '#e57373', 8);
    drawForceLabel(cx + 30, surfY + wLen / 2, 'W=' + c.weight.toFixed(0) + 'N', '#e57373');

    /* Normal */
    var nLen = clamp(c.N * 0.35, 10, 80);
    drawArrow(cx, by, cx, by - nLen, '#42a5f5', 8);
    drawForceLabel(cx + 35, by - nLen / 2, 'N=' + c.N.toFixed(1) + 'N', '#42a5f5');

    /* Friction (opposing rightward motion = pointing LEFT) */
    if (c.friction > 0.1) {
      var frLen = clamp(c.friction * 0.35, 10, 80);
      drawArrow(bx - 5, cy, bx - 5 - frLen, cy, '#ff5555', 8);
      drawForceLabel(bx - frLen / 2 - 10, cy - 15, 'f=' + c.friction.toFixed(1) + 'N', '#ff5555');
    }

    /* Status */
    ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    if (c.status === 'Lifted') { ctx.fillStyle = '#f5c842'; ctx.fillText(modeLabel + ' \u2014 LIFTED OFF SURFACE (N = 0)', W / 2, 35); }
    else if (c.status === 'Sliding') { ctx.fillStyle = '#ff5555'; ctx.fillText(modeLabel + ' \u2014 SLIDING (Fcos\u03B1 > \u03BCs\u00B7N)', W / 2, 35); }
    else {
      var nFormula = isPull ? 'mg \u2212 Fsin\u03B1' : 'mg + Fsin\u03B1';
      ctx.fillStyle = '#3ddc84'; ctx.fillText(modeLabel + ' \u2014 STATIC (N = ' + nFormula + ' = ' + c.N.toFixed(1) + ' N)', W / 2, 35);
    }

    /* Badges */
    var optAngle = +(Math.atan(S.mus) * 180 / Math.PI).toFixed(1);
    drawBadge(30, 10, 120, 42, isPull ? 'Optimal \u03B1' : 'Mode', isPull ? optAngle + '\u00B0' : 'Push');
    drawBadge(160, 10, 110, 42, 'Normal', c.N.toFixed(1) + ' N');
    drawBadge(W - 240, 10, 110, 42, 'Net Force', c.net.toFixed(1) + ' N', c.net > 0 ? '#3ddc84' : '#6b7a99');
    drawBadge(W - 120, 10, 110, 42, 'Accel', c.accel.toFixed(2) + ' m/s\u00B2', c.accel > 0 ? '#42a5f5' : '#6b7a99');

    /* Mini FBD */
    if (isPull) {
      drawMiniFBD(700, 250, c.weight, c.N, c.Fh, c.friction, 'Pull FBD');
    } else {
      drawMiniFBD(700, 250, c.weight, c.N, c.Fh, c.friction, 'Push FBD');
    }

    /* Pulsing "Press Simulate" prompt */
    if (!simulating && !simDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('\u25B6 Press Simulate to test friction', W / 2, H - 15);
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(function () { draw(); });
    }
  }

  /* ================================================================
     DRAWING — BRAKING SCENARIO
     ================================================================ */
  function drawBraking() {
    var c = calcBraking();
    var surfY = 320;
    drawSurface(surfY, 'Road Surface (\u03BCk=' + S.muk + ')', true);

    /* Use force slider as v0 */
    var v0 = S.force;
    var dist = c.dist;

    /* Draw distance markers */
    var startX = 100;

    /* Skid marks */
    if (dist > 0) {
      ctx.strokeStyle = 'rgba(141,110,99,0.3)'; ctx.lineWidth = 4;
      var skidLen = (simulating || simDone) ? clamp(anim.skidLen || 0, 0, 600) : 0;
      ctx.beginPath();
      ctx.moveTo(startX, surfY - 2);
      ctx.lineTo(startX + skidLen, surfY - 2);
      ctx.stroke();
      /* Distance label */
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('d = ' + dist.toFixed(1) + ' m', startX + skidLen / 2, surfY + 25);
      /* Distance arrow */
      if (skidLen > 30) {
        ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(startX, surfY + 15); ctx.lineTo(startX + skidLen, surfY + 15); ctx.stroke();
        /* arrowheads */
        ctx.fillStyle = '#f5c842';
        ctx.beginPath(); ctx.moveTo(startX, surfY + 15); ctx.lineTo(startX + 6, surfY + 12); ctx.lineTo(startX + 6, surfY + 18); ctx.fill();
        ctx.beginPath(); ctx.moveTo(startX + skidLen, surfY + 15); ctx.lineTo(startX + skidLen - 6, surfY + 12); ctx.lineTo(startX + skidLen - 6, surfY + 18); ctx.fill();
      }
    }

    /* Block / vehicle */
    var blockPos = anim.brakeX;
    var bw = 90, bh = 55;
    var bx = blockPos, by = surfY - bh;
    drawBlock(bx, by, bw, bh, S.mass + 'kg');

    var cx = bx + bw / 2, cy = by + bh / 2;

    /* Velocity arrow */
    if (anim.brakeVel > 0.5) {
      var vLen = clamp(anim.brakeVel * 3, 10, 80);
      drawArrow(bx + bw + 5, cy - 20, bx + bw + 5 + vLen, cy - 20, '#3ddc84', 7);
      drawForceLabel(bx + bw + vLen / 2 + 10, cy - 35, 'v=' + anim.brakeVel.toFixed(1) + 'm/s', '#3ddc84');
    }

    /* Friction arrow (opposing motion) */
    if (anim.brakeVel > 0.1) {
      var frLen = clamp(c.friction * 0.3, 15, 80);
      drawArrow(bx - 5, cy, bx - 5 - frLen, cy, '#ff5555', 8);
      drawForceLabel(bx - frLen / 2 - 10, cy - 15, 'f=' + c.friction.toFixed(1) + 'N', '#ff5555');
    }

    /* Weight & Normal */
    var wLen = clamp(c.weight * 0.25, 15, 60);
    drawArrow(cx, surfY, cx, surfY + wLen, '#e57373', 7);
    var nLen = clamp(c.N * 0.25, 15, 60);
    drawArrow(cx, by, cx, by - nLen, '#42a5f5', 7);

    /* Status */
    ctx.font = '700 16px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
    if (anim.brakeStopped) {
      ctx.fillStyle = '#3ddc84'; ctx.fillText('STOPPED after ' + dist.toFixed(1) + ' m', W / 2, 40);
    } else {
      ctx.fillStyle = '#ff5555'; ctx.fillText('BRAKING \u2014 a = \u2212' + c.decel.toFixed(2) + ' m/s\u00B2', W / 2, 40);
    }

    /* Formula */
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#8d6e63'; ctx.textAlign = 'center';
    ctx.fillText('F_brake=' + c.friction.toFixed(1) + 'N  a=F/m=' + c.decel.toFixed(2) + 'm/s\u00B2  d=v\u00B2/(2a)=' + dist.toFixed(1) + 'm', W / 2, H - 30);

    /* Badges */
    drawBadge(20, 10, 100, 42, 'Speed', v0 + ' m/s');
    drawBadge(125, 10, 100, 42, 'Mass', S.mass + ' kg');
    drawBadge(230, 10, 120, 42, 'Stop Dist', dist.toFixed(1) + ' m', '#f5c842');
    drawBadge(W - 240, 10, 110, 42, 'Decel', c.decel.toFixed(2) + ' m/s\u00B2');
    drawBadge(W - 120, 10, 110, 42, 'Brake F', c.friction.toFixed(1) + ' N');

    /* Pulsing "Press Simulate" prompt */
    if (!simulating && !simDone) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 500);
      ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('\u25B6 Press Simulate to test braking', W / 2, H - 15);
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(function () { draw(); });
    }
  }

  /* ================================================================
     DRAWING — EXPLORE MODE DIAGRAMS
     ================================================================ */
  function drawExploreDiagram(concept) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    var fn = exploreDiagrams[concept.diagram];
    if (fn) fn();
    /* Formula at bottom */
    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#8d6e63'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(concept.formula, W / 2, H - 16);
  }

  var exploreDiagrams = {
    staticFriction: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Static Friction \u2014 Self-Adjusting Force', W / 2, 40);
      drawSurface(280, '', true);
      /* Show 3 scenarios: small F, medium F, at limit */
      var scenarios = [
        { F: 20, fs: 20, label: 'Small push' },
        { F: 50, fs: 50, label: 'Medium push' },
        { F: 98, fs: 98, label: 'At fs,max' }
      ];
      for (var i = 0; i < 3; i++) {
        var sy = 120 + i * 90;
        var bx = 200;
        drawBlock(bx, sy, 60, 40, '', 'rgba(141,110,99,0.35)', '#8d6e63');
        /* Applied force to the RIGHT (green), friction opposing to the LEFT (red) */
        drawArrow(bx + 65, sy + 20, bx + 65 + scenarios[i].F * 0.6, sy + 20, '#3ddc84', 6);
        drawArrow(bx - 5, sy + 20, bx - 5 - scenarios[i].fs * 0.6, sy + 20, '#ff5555', 6);
        ctx.font = '600 10px "Segoe UI", sans-serif';
        ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'left';
        ctx.fillText('F=' + scenarios[i].F + 'N', bx + 65 + scenarios[i].F * 0.6 + 5, sy + 15);
        ctx.fillStyle = '#ff5555'; ctx.textAlign = 'right';
        ctx.fillText('fs=' + scenarios[i].fs + 'N', bx - scenarios[i].fs * 0.6 - 10, sy + 15);
        ctx.fillStyle = i === 2 ? '#f5c842' : '#6b7a99'; ctx.textAlign = 'right';
        ctx.fillText(scenarios[i].label, 180, sy + 25);
      }
      ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('Static friction matches applied force up to fs,max = \u03BCs\u00B7N', W / 2, 410);
    },
    kineticFriction: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Kinetic Friction \u2014 Constant Magnitude', W / 2, 40);
      drawSurface(300, '', true);
      /* Sliding block */
      drawBlock(250, 240, 80, 60, 'Sliding', 'rgba(141,110,99,0.35)', '#8d6e63');
      /* Motion/applied force to the RIGHT (green); kinetic friction opposes \u2192 LEFT (red) */
      drawArrow(335, 270, 405, 270, '#3ddc84', 8);
      drawForceLabel(388, 255, 'F (motion)', '#3ddc84');
      drawArrow(245, 270, 175, 270, '#ff5555', 8);
      drawForceLabel(200, 255, 'fk = \u03BCk\u00B7N', '#ff5555');
      /* Graph */
      ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(500, 350); ctx.lineTo(500, 120); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(500, 350); ctx.lineTo(800, 350); ctx.stroke();
      ctx.font = '600 9px "Segoe UI", sans-serif'; ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('Applied Force', 650, 370);
      ctx.save(); ctx.translate(490, 235); ctx.rotate(-Math.PI / 2);
      ctx.fillText('Friction', 0, 0); ctx.restore();
      /* Static region (increasing) */
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(500, 350); ctx.lineTo(620, 180); ctx.stroke();
      /* Drop to kinetic */
      ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(620, 180); ctx.lineTo(620, 220); ctx.stroke();
      /* Kinetic region (constant) */
      ctx.beginPath(); ctx.moveTo(620, 220); ctx.lineTo(790, 220); ctx.stroke();
      /* Labels */
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'right'; ctx.fillText('Static region', 615, 260);
      ctx.fillStyle = '#ff5555'; ctx.textAlign = 'left'; ctx.fillText('Kinetic (constant)', 630, 210);
      ctx.fillStyle = '#f5c842'; ctx.fillText('\u03BCs\u00B7N', 505, 178);
      ctx.fillText('\u03BCk\u00B7N', 505, 218);
    },
    rollingFriction: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Rolling Friction \u2014 Much Less Than Sliding', W / 2, 40);
      drawSurface(300, '', false);
      /* Rolling wheel */
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(300, 270, 30, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(141,110,99,0.2)'; ctx.fill();
      drawArrow(330, 270, 390, 270, '#3ddc84', 7);
      drawForceLabel(360, 255, 'Motion', '#3ddc84');
      drawArrow(270, 300, 240, 300, '#ff5555', 6);
      drawForceLabel(250, 315, 'fr (tiny)', '#ff5555');
      /* Sliding block for comparison */
      drawBlock(500, 250, 70, 50, '', 'rgba(141,110,99,0.35)', '#8d6e63');
      drawArrow(570, 275, 630, 275, '#3ddc84', 7);
      drawArrow(500, 275, 430, 275, '#ff5555', 7);
      drawForceLabel(460, 260, 'fk (large)', '#ff5555');
      ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('\u03BCr \u2248 0.001\u20130.01 vs \u03BCk \u2248 0.2\u20130.6', W / 2, 380);
    },
    angleOfRepose: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Angle of Repose \u2014 Critical Slope Angle', W / 2, 40);
      /* Incline at repose angle */
      var theta = Math.atan(0.4);
      var bx = 150, by = 350, pLen = 450;
      var tx = bx + pLen * Math.cos(theta), ty = by - pLen * Math.sin(theta);
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx + 50, by); ctx.stroke();
      /* Angle arc */
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(bx, by, 60, -Math.PI * 0, -theta, true); ctx.stroke();
      ctx.font = '700 12px "Segoe UI", sans-serif'; ctx.fillStyle = '#f5c842';
      ctx.fillText('\u03B8 = arctan(\u03BCs)', bx + 90, by - 20);
      /* Block on slope */
      var dist = 200;
      var blx = bx + dist * Math.cos(theta), bly = by - dist * Math.sin(theta);
      ctx.save(); ctx.translate(blx, bly); ctx.rotate(-theta);
      drawBlock(-30, -40, 60, 40, 'm');
      ctx.restore();
      ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
      ctx.fillText('At \u03B8 = arctan(\u03BCs): block is on verge of sliding', W / 2, 400);
      ctx.fillStyle = '#6b7a99';
      ctx.fillText('\u03B8 < repose angle \u2192 Static     |     \u03B8 > repose angle \u2192 Slides', W / 2, 425);
    },
    normalFlat: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Normal Force on Flat Surface', W / 2, 40);
      ctx.fillStyle = 'rgba(42,48,80,0.5)'; ctx.fillRect(200, 280, 500, 15);
      ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2; ctx.strokeRect(200, 280, 500, 15);
      drawBlock(400, 220, 100, 60, '25 kg');
      drawArrow(450, 280, 450, 350, '#e57373', 8);
      drawForceLabel(450, 365, 'W = mg = 245.3 N', '#e57373');
      drawArrow(450, 220, 450, 150, '#42a5f5', 8);
      drawForceLabel(450, 138, 'N = mg = 245.3 N', '#42a5f5');
      ctx.font = '700 13px "Courier New", monospace'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('N = W = mg (flat, no extra vertical forces)', W / 2, 400);
    },
    normalIncline: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Normal Force on Inclined Plane', W / 2, 40);
      var theta = degToRad(30);
      var bx = 150, by = 370, pLen = 450;
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + pLen * Math.cos(theta), by - pLen * Math.sin(theta)); ctx.stroke();
      ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + pLen + 30, by); ctx.stroke();
      var dist = 200;
      var blx = bx + dist * Math.cos(theta), bly = by - dist * Math.sin(theta);
      ctx.save(); ctx.translate(blx, bly); ctx.rotate(-theta);
      drawBlock(-35, -45, 70, 45, '10 kg');
      ctx.restore();
      /* Weight straight down */
      drawArrow(blx, bly, blx, bly + 60, '#e57373', 8);
      drawForceLabel(blx + 30, bly + 40, 'W=98.1N', '#e57373');
      /* Normal perpendicular to surface */
      var nLen = 50;
      drawArrow(blx, bly, blx - nLen * Math.sin(theta), bly - nLen * Math.cos(theta), '#42a5f5', 8);
      drawForceLabel(blx - nLen * Math.sin(theta) - 25, bly - nLen * Math.cos(theta), 'N=85.0N', '#42a5f5');
      ctx.font = '700 12px "Courier New", monospace'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('N = mg\u00B7cos\u03B8 = 98.1 \u00D7 cos30\u00B0 = 85.0 N', W / 2, 420);
    },
    fbdDiagram: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Free Body Diagram for Friction Problems', W / 2, 40);
      drawBlock(380, 180, 120, 80, '12 kg');
      drawArrow(380, 220, 280, 220, '#3ddc84', 9);
      drawForceLabel(320, 205, 'F = 80 N', '#3ddc84');
      drawArrow(500, 220, 570, 220, '#ff5555', 8);
      drawForceLabel(540, 205, 'fk = 29.4 N', '#ff5555');
      drawArrow(440, 260, 440, 340, '#e57373', 8);
      drawForceLabel(440, 355, 'W = 117.7 N', '#e57373');
      drawArrow(440, 180, 440, 100, '#42a5f5', 8);
      drawForceLabel(440, 88, 'N = 117.7 N', '#42a5f5');
      ctx.font = '700 12px "Courier New", monospace'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('Fnet = 80 \u2212 29.4 = 50.6 N \u2192 a = 4.21 m/s\u00B2', W / 2, 400);
    },
    frictionCoefficient: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Friction Coefficient \u2014 Surface Property', W / 2, 40);
      var surfaces = [
        { name: 'Ice on Ice', mu: 0.03, color: '#42a5f5' },
        { name: 'Wood on Wood', mu: 0.40, color: '#8d6e63' },
        { name: 'Rubber on Concrete', mu: 0.80, color: '#ff5555' },
        { name: 'Steel on Steel', mu: 0.60, color: '#f5c842' }
      ];
      for (var i = 0; i < 4; i++) {
        var sy = 100 + i * 80;
        var barW = surfaces[i].mu * 400;
        ctx.fillStyle = surfaces[i].color + '33';
        ctx.beginPath(); ctx.roundRect(250, sy, barW, 35, 6); ctx.fill();
        ctx.strokeStyle = surfaces[i].color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(250, sy, barW, 35, 6); ctx.stroke();
        ctx.font = '600 11px "Segoe UI", sans-serif';
        ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'right';
        ctx.fillText(surfaces[i].name, 240, sy + 22);
        ctx.fillStyle = surfaces[i].color; ctx.textAlign = 'left';
        ctx.fillText('\u03BC = ' + surfaces[i].mu, 260 + barW, sy + 22);
      }
    },
    brakingDistance: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Braking Distance \u2014 d = v\u00B2/(2\u03BCg)', W / 2, 40);
      drawSurface(300, '', true);
      /* Block */
      drawBlock(100, 245, 80, 55, 'Car');
      drawArrow(180, 272, 230, 272, '#3ddc84', 7);
      drawForceLabel(210, 258, 'v', '#3ddc84');
      /* Skid marks */
      ctx.strokeStyle = 'rgba(141,110,99,0.4)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(180, 298); ctx.lineTo(500, 298); ctx.stroke();
      /* Distance */
      ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(180, 320); ctx.lineTo(500, 320); ctx.stroke();
      ctx.fillStyle = '#f5c842'; ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText('d = v\u00B2/(2\u03BCg)', 340, 340);
      ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('Double speed \u2192 4\u00D7 stopping distance', W / 2, 400);
      ctx.fillText('Wet road (\u03BC=0.4): nearly 2\u00D7 distance vs dry (\u03BC=0.7)', W / 2, 420);
    },
    beltFriction: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Belt Friction \u2014 Euler\u2013Eytelwein Formula', W / 2, 40);
      /* Pulley */
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(400, 220, 60, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(141,110,99,0.15)'; ctx.fill();
      /* Belt wrapping */
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(400, 220, 63, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
      /* Tight side */
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(400, 157); ctx.lineTo(400, 100); ctx.stroke();
      drawForceLabel(420, 120, 'T\u2082 (tight)', '#3ddc84');
      /* Slack side */
      ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(400, 283); ctx.lineTo(400, 340); ctx.stroke();
      drawForceLabel(420, 320, 'T\u2081 (slack)', '#ff5555');
      ctx.font = '700 13px "Courier New", monospace'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('T\u2082/T\u2081 = e^(\u03BC\u03B8)', W / 2, 400);
    },
    wedgeFriction: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Wedge Friction \u2014 Self-Locking', W / 2, 40);
      /* Wedge shape */
      ctx.fillStyle = 'rgba(141,110,99,0.35)'; ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(350, 300); ctx.lineTo(450, 300); ctx.lineTo(400, 180); ctx.closePath();
      ctx.fill(); ctx.stroke();
      /* Force arrows */
      drawArrow(400, 160, 400, 100, '#3ddc84', 8);
      drawForceLabel(400, 88, 'P (push)', '#3ddc84');
      /* Friction on sides */
      drawArrow(360, 250, 340, 220, '#ff5555', 6);
      drawForceLabel(325, 215, 'f', '#ff5555');
      drawArrow(440, 250, 460, 220, '#ff5555', 6);
      drawForceLabel(475, 215, 'f', '#ff5555');
      ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('Self-locking when friction angle > wedge half-angle', W / 2, 370);
      ctx.font = '700 12px "Courier New", monospace'; ctx.fillStyle = '#f5c842';
      ctx.fillText('\u03C6 = arctan(\u03BC) > \u03B1 \u2192 Self-locking', W / 2, 400);
    },
    bearingFriction: function () {
      ctx.font = '700 14px "Segoe UI", sans-serif'; ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
      ctx.fillText('Bearing Friction \u2014 Friction Torque', W / 2, 40);
      /* Shaft cross-section */
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(400, 230, 50, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(141,110,99,0.2)'; ctx.fill();
      /* Bearing housing */
      ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(400, 230, 65, 0, Math.PI * 2); ctx.stroke();
      /* Rotation arrow */
      ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(400, 230, 35, -0.5, Math.PI * 1.3); ctx.stroke();
      ctx.fillStyle = '#3ddc84';
      var ax = 400 + 35 * Math.cos(Math.PI * 1.3), ay = 230 + 35 * Math.sin(Math.PI * 1.3);
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 8, ay - 3); ctx.lineTo(ax + 3, ay + 8); ctx.fill();
      /* Load arrow */
      drawArrow(400, 100, 400, 160, '#e57373', 8);
      drawForceLabel(400, 88, 'Load N', '#e57373');
      /* Labels */
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8d6e63'; ctx.textAlign = 'center';
      ctx.fillText('r', 420, 230);
      ctx.font = '700 12px "Courier New", monospace'; ctx.fillStyle = '#f5c842'; ctx.textAlign = 'center';
      ctx.fillText('T = \u03BC \u00D7 r \u00D7 N', W / 2, 370);
      ctx.font = '600 11px "Segoe UI", sans-serif'; ctx.fillStyle = '#6b7a99';
      ctx.fillText('Ball bearings: \u03BC \u2248 0.001\u20130.005  |  Plain bearings: \u03BC \u2248 0.08\u20130.15', W / 2, 400);
    }
  };

  /* ================================================================
     MAIN DRAW
     ================================================================ */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      switch (scenario) {
        case 'flat': drawFlat(); break;
        case 'incline': drawIncline(); break;
        case 'angle': drawAngle(); break;
        case 'braking': drawBraking(); break;
      }
    } else if (mode === 'explore') {
      var cat = CONCEPTS.filter(function (c) { return c.cat === selCat; });
      if (cat[selConcept]) drawExploreDiagram(cat[selConcept]);
    } else {
      /* Practice / Quiz: show a placeholder */
      ctx.font = '700 16px "Segoe UI", sans-serif';
      ctx.fillStyle = '#8d6e63'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Friction & Contact Forces', W / 2, H / 2 - 20);
      ctx.font = '600 12px "Segoe UI", sans-serif'; ctx.fillStyle = '#6b7a99';
      ctx.fillText(mode === 'practice' ? 'Solve the problem below' : 'Answer the quiz question below', W / 2, H / 2 + 15);
      /* Decorative friction diagram */
      drawSurface(H / 2 + 60, '', true);
      drawBlock(W / 2 - 40, H / 2 + 10, 80, 50, 'm');
      /* Applied force right (green), friction opposing left (red) */
      drawArrow(W / 2 + 45, H / 2 + 35, W / 2 + 100, H / 2 + 35, '#3ddc84', 6);
      drawArrow(W / 2 - 45, H / 2 + 35, W / 2 - 100, H / 2 + 35, '#ff5555', 6);
    }
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animationLoop() {
    if (mode !== 'simulate') { draw(); return; }
    /* Static redraw only — no continuous physics */
    draw();
    updateReadouts();
  }

  function startSim() {
    if (simulating || simDone) return;
    var c = getCalc();
    var btn = $('#btn-play');
    var status = $('#play-status');
    simulating = true; simTime = 0; simDone = false; simLastTs = 0;

    /* Determine if motion occurs and set status message */
    if (scenario === 'flat') {
      var needed = c.maxFs;
      if (S.force >= needed) {
        canMove = true;
        status.textContent = 'Force ' + S.force + ' N \u2265 ' + needed.toFixed(1) + ' N (max static) \u2014 block slides!';
        status.className = 'play-status active';
      } else {
        canMove = false;
        status.textContent = 'Force ' + S.force + ' N < ' + needed.toFixed(1) + ' N needed \u2014 block stays put';
        status.className = 'play-status fail';
      }
    } else if (scenario === 'incline') {
      var repose = c.angleOfRepose;
      if (S.incline >= repose) {
        canMove = true;
        status.textContent = 'Angle ' + S.incline + '\u00B0 \u2265 repose ' + repose.toFixed(1) + '\u00B0 \u2014 block slides down!';
        status.className = 'play-status active';
      } else {
        canMove = false;
        status.textContent = 'Angle ' + S.incline + '\u00B0 < repose ' + repose.toFixed(1) + '\u00B0 \u2014 friction holds';
        status.className = 'play-status fail';
      }
    } else if (scenario === 'angle') {
      var mLabel = angleMode === 'pull' ? 'Pull' : 'Push';
      var nFormula = angleMode === 'pull' ? 'N=mg\u2212Fsin\u03B1=' : 'N=mg+Fsin\u03B1=';
      if (c.status === 'Lifted') {
        canMove = true;
        status.textContent = mLabel + ': Fsin\u03B1=' + c.Fv.toFixed(1) + ' N \u2265 W=' + c.weight.toFixed(1) + ' N \u2014 lifted!';
        status.className = 'play-status active';
      } else if (c.Fh > c.maxFs) {
        canMove = true;
        status.textContent = mLabel + ': Fcos\u03B1=' + c.Fh.toFixed(1) + ' N > \u03BCs\u00B7' + nFormula + c.N.toFixed(1) + ' \u2014 slides!';
        status.className = 'play-status active';
      } else {
        canMove = false;
        status.textContent = mLabel + ': Fcos\u03B1=' + c.Fh.toFixed(1) + ' N < \u03BCs\u00B7' + nFormula + c.N.toFixed(1) + ' \u2014 static';
        status.className = 'play-status fail';
      }
    } else if (scenario === 'braking') {
      canMove = true;
      status.textContent = 'v\u2080=' + S.force + ' m/s, m=' + S.mass + 'kg \u2192 d=' + c.dist.toFixed(1) + ' m (a=' + c.decel.toFixed(2) + ' m/s\u00B2)';
      status.className = 'play-status active';
    }

    btn.classList.add('playing');
    btn.innerHTML = '\u275A\u275A Playing...';
    animFrame = requestAnimationFrame(simLoop);
  }

  function simLoop(ts) {
    if (!simulating) return;
    if (!simLastTs) simLastTs = ts;
    var dt = (ts - simLastTs) / 1000;
    simLastTs = ts;
    simTime = Math.min(1, simTime + dt * simSpeed);
    var t = easeOut(simTime);

    /* Update animation positions per scenario — distance scales with acceleration */
    if (scenario === 'flat') {
      var cf = calcFlat();
      if (canMove) {
        /* d = ½at² over ~3s simulated → scale to pixels (min 80, max 450) */
        var flatDist = clamp(cf.accel * 55, 80, 450);
        anim.blockX = 200 + t * flatDist;
        anim.sliding = true;
        anim.blockVel = t * cf.accel * 3;
      } else {
        /* Shake and fail */
        var shake = Math.sin(simTime * 40) * 6 * (1 - simTime);
        anim.blockX = 200 + shake;
        anim.sliding = false;
      }
    } else if (scenario === 'incline') {
      var ci = calcIncline();
      if (canMove) {
        var incDist = clamp(ci.accel * 35, 50, 250);
        anim.blockDist = 250 - t * incDist;
        anim.sliding = true;
      } else {
        var shakeI = Math.sin(simTime * 40) * 4 * (1 - simTime);
        anim.blockDist = 250 + shakeI;
        anim.sliding = false;
      }
    } else if (scenario === 'angle') {
      var ca = calcAngle();
      if (ca.status === 'Lifted') {
        anim.blockX = 200;
        anim.liftY = t * 80;
        anim.sliding = false;
      } else if (canMove) {
        var angDist = clamp(ca.accel * 55, 80, 380);
        anim.blockX = 200 + t * angDist;
        anim.liftY = 0;
        anim.sliding = true;
      } else {
        var shakeA = Math.sin(simTime * 40) * 6 * (1 - simTime);
        anim.blockX = 200 + shakeA;
        anim.liftY = 0;
        anim.sliding = false;
      }
    } else if (scenario === 'braking') {
      /* Decelerate: velocity goes from v0 to 0 */
      anim.brakeVel = S.force * (1 - t);
      var cb = calcBraking();
      /* sqrt scaling so visual distance is proportional but fits canvas */
      var pixelDist = clamp(10 * Math.sqrt(cb.dist), 80, 550);
      anim.brakeX = 100 + t * pixelDist;
      anim.brakeStopped = (simTime >= 0.98);
      anim.skidLen = t * pixelDist;
    }

    draw();
    updateReadouts();

    if (simTime >= 1) {
      simDone = true;
      simulating = false;
      var btn = $('#btn-play');
      btn.innerHTML = '\u2714 Done';
      return;
    }
    animFrame = requestAnimationFrame(simLoop);
  }

  function resetSim() {
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
    simulating = false; simTime = 0; simDone = false; simLastTs = 0;
    canMove = false;
    anim.blockX = 200; anim.blockVel = 0; anim.sliding = false; anim.shakeT = 0;
    anim.blockDist = 250;
    anim.liftY = 0;
    anim.brakeX = 100; anim.brakeVel = S.force; anim.brakeStopped = false;
    anim.skidLen = 0;
    anim.time = 0;
    var btn = $('#btn-play');
    if (btn) { btn.classList.remove('playing'); btn.innerHTML = '<span class="play-icon">\u25B6</span> Simulate'; }
    var status = $('#play-status');
    if (status) { status.textContent = 'Set up variables, then press Simulate'; status.className = 'play-status'; }
    updateReadouts();
    draw();
  }

  /* Keep old name as alias for mode switching */
  function startAnim() { draw(); updateReadouts(); }
  function resetAnim() { resetSim(); }

  /* ================================================================
     READOUT UPDATES
     ================================================================ */
  function updateReadouts() {
    var c = getCalc();
    $('#r-normal').textContent = c.N.toFixed(1);
    $('#r-friction').textContent = Math.abs(c.friction).toFixed(1);
    $('#r-applied').textContent = scenario === 'braking' ? (S.force + ' m/s') : Math.abs(c.applied).toFixed(1);
    $('#r-net').textContent = Math.abs(c.net).toFixed(1);
    $('#r-accel').textContent = Math.abs(c.accel).toFixed(2);
    $('#r-status').textContent = c.status;
    var statusEl = $('#r-status');
    statusEl.style.color = c.status === 'Static' ? '#3ddc84' : (c.status === 'Sliding' || c.status === 'Braking' ? '#ff5555' : '#f5c842');
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */
  function setMode(m) {
    mode = m;
    /* Update pills */
    $$('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === m); });
    /* Show/hide panels */
    var simEls = [$('#sim-panel')];
    var expEls = [$('#cat-row'), $('#item-selector'), $('#item-info')];
    var pracEls = [$('#practice-panel'), $('#practice-bar')];
    var quizEls = [$('#quiz-panel'), $('#quiz-bar'), $('#quiz-result')];
    simEls.forEach(function (el) { m === 'simulate' ? show(el) : hide(el); });
    expEls.forEach(function (el) { m === 'explore' ? show(el) : hide(el); });
    pracEls.forEach(function (el) { m === 'practice' ? show(el) : hide(el); });
    quizEls.forEach(function (el) { m === 'quiz' ? show(el) : hide(el); });

    if (m === 'explore') { buildExploreGrid(); showConceptInfo(); }
    if (m === 'practice') { genPractice(); }
    if (m === 'quiz') { startQuiz(); }
    if (m === 'simulate') { resetSim(); }
    draw();
  }

  /* ================================================================
     SCENARIO SWITCHING
     ================================================================ */
  function setScenario(s) {
    scenario = s;
    $$('#scenario-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.scenario === s); });
    /* Show/hide angle rows */
    if (s === 'incline') { show($('#incline-row')); hide($('#pull-angle-row')); hide($('#angle-mode-row')); }
    else if (s === 'angle') { hide($('#incline-row')); show($('#pull-angle-row')); show($('#angle-mode-row')); }
    else { hide($('#incline-row')); hide($('#pull-angle-row')); hide($('#angle-mode-row')); }
    /* Update applied force label for braking */
    if (s === 'braking') {
      $$('.sim-slider-label')[1].textContent = 'Initial Speed';
      $('#val-force').textContent = S.force + ' m/s';
    } else {
      $$('.sim-slider-label')[1].textContent = 'Applied Force';
      $('#val-force').textContent = S.force + ' N';
    }
    resetSim();
    updateReadouts();
    draw();
  }

  /* ================================================================
     EXPLORE MODE
     ================================================================ */
  function buildExploreGrid() {
    var grid = $('#concept-grid');
    grid.innerHTML = '';
    var cats = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    cats.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (i === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () { selConcept = i; buildExploreGrid(); showConceptInfo(); draw(); });
      grid.appendChild(btn);
    });
  }

  function showConceptInfo() {
    var cats = CONCEPTS.filter(function (c) { return c.cat === selCat; });
    var c = cats[selConcept];
    if (!c) return;
    var info = $('#item-info');
    show(info);
    info.innerHTML =
      '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat.replace('-', ' ') + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">Unit: ' + c.unit + '</span></div>' +
      '<div class="example-box"><h4>Worked Example</h4>' +
      '<p class="ex-problem">' + c.example.problem + '</p>' +
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s.replace(/= ([\d.]+)/g, '= <strong>$1</strong>') + '</p>'; }).join('') +
      '</div>';
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */
  function genPractice() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    pProblem = gen();
    pAnswered = false;
    $('#pp-prompt').textContent = pProblem.prompt;
    $('#pp-unit').textContent = pProblem.unit;
    $('#pp-input').value = '';
    $('#pp-feedback').textContent = '';
    $('#pp-feedback').className = 'feedback';
    hide($('#pp-solution'));
    hide($('#pp-next'));
    show($('#pp-check'));
    draw();
  }

  function checkPractice() {
    if (pAnswered) return;
    var ans = parseFloat($('#pp-input').value);
    if (isNaN(ans)) { $('#pp-feedback').textContent = 'Enter a number'; $('#pp-feedback').className = 'feedback err'; return; }
    pAnswered = true; pTotal++;
    var tol = Math.max(Math.abs(pProblem.answer) * 0.02, 0.1);
    if (Math.abs(ans - pProblem.answer) <= tol) {
      pScore++;
      $('#pp-feedback').textContent = 'Correct!';
      $('#pp-feedback').className = 'feedback ok';
    } else {
      $('#pp-feedback').textContent = 'Incorrect. Answer: ' + pProblem.answer + ' ' + pProblem.unit;
      $('#pp-feedback').className = 'feedback err';
    }
    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
    /* Show solution */
    var sol = $('#pp-solution');
    show(sol);
    sol.innerHTML = '<h4>Solution</h4>' + pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([\d.\-]+)/g, '= <strong>$1</strong>') + '</p>'; }).join('');
    hide($('#pp-check'));
    show($('#pp-next'));
  }

  /* ================================================================
     QUIZ MODE
     ================================================================ */
  function startQuiz() {
    var pool = shuffleArr(QUIZ_POOL);
    quizQs = pool.slice(0, 5);
    quizIdx = 0; quizScore = 0; quizAnswered = false;
    hide($('#quiz-result'));
    show($('#quiz-panel'));
    show($('#quiz-bar'));
    renderQuiz();
    draw();
  }

  function renderQuiz() {
    var q = quizQs[quizIdx];
    var panel = $('#quiz-panel');
    $('#qbar-num').textContent = quizIdx + 1;

    if (q.type === 'mcq') {
      var opts = q.options.slice();
      var correctText = opts[q.correct];
      opts = shuffleArr(opts);
      var html = '<p class="qp-prompt">' + q.prompt + '</p><div class="answer-grid">';
      opts.forEach(function (o) {
        html += '<button class="answer-btn" data-val="' + o + '">' + o + '</button>';
      });
      html += '</div><p class="quiz-feedback" id="q-fb"></p>';
      panel.innerHTML = html;
      panel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var correct = btn.dataset.val === correctText;
          if (correct) quizScore++;
          panel.querySelectorAll('.answer-btn').forEach(function (b) {
            b.classList.add('locked');
            if (b.dataset.val === correctText) b.classList.add('correct');
            else if (b === btn && !correct) b.classList.add('wrong');
          });
          $('#q-fb').textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + correctText;
          $('#q-fb').className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
          setTimeout(nextQuiz, 1200);
        });
      });
    } else {
      /* Numeric */
      var html2 = '<p class="qp-prompt">' + q.prompt + '</p>' +
        '<div class="quiz-input-row"><input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer"><span class="qi-unit">' + q.unit + '</span>' +
        '<button class="btn btn-primary" id="qi-check">Submit</button></div>' +
        '<p class="quiz-feedback" id="q-fb"></p>';
      panel.innerHTML = html2;
      $('#qi-check').addEventListener('click', function () {
        if (quizAnswered) return;
        var ans = parseFloat($('#qi-input').value);
        if (isNaN(ans)) return;
        quizAnswered = true;
        var tol = Math.max(Math.abs(q.answer) * 0.02, 0.1);
        var correct = Math.abs(ans - q.answer) <= tol;
        if (correct) quizScore++;
        $('#q-fb').textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.answer + ' ' + q.unit;
        $('#q-fb').className = 'quiz-feedback ' + (correct ? 'ok' : 'err');
        if (q.steps) {
          var stepsHtml = '<div class="solution-panel"><h4>Solution</h4>' + q.steps.map(function (s) { return '<p class="sol-step">' + s + '</p>'; }).join('') + '</div>';
          panel.insertAdjacentHTML('beforeend', stepsHtml);
        }
        setTimeout(nextQuiz, 1800);
      });
    }
  }

  function nextQuiz() {
    quizIdx++;
    quizAnswered = false;
    if (quizIdx >= quizQs.length) { showQuizResult(); return; }
    renderQuiz();
  }

  function showQuizResult() {
    hide($('#quiz-panel'));
    hide($('#quiz-bar'));
    var res = $('#quiz-result');
    show(res);
    var pct = Math.round(quizScore / quizQs.length * 100);
    var stars = '';
    for (var i = 0; i < 5; i++) stars += i < quizScore ? '\u2605' : '\u2606';
    var cls = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';
    var verdict = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Great job!' : pct >= 60 ? 'Good effort!' : 'Keep practising!';
    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + pct + '%</span><span class="qr-verdict">' + verdict + '</span></div></div>';
    html += '<div class="qr-rows">';
    quizQs.forEach(function (q, i) {
      var ok = true; /* simplified — we track overall score */
      html += '<div class="qr-row ' + (i < quizScore ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span>' +
        '<span class="qr-detail">' + q.prompt.substring(0, 60) + '...</span>' +
        '<span class="qr-mark">' + (i < quizScore ? '\u2713' : '\u2717') + '</span></div>';
    });
    html += '</div>';
    html += '<button class="btn btn-primary" id="quiz-retry">Retry Quiz</button>';
    res.innerHTML = html;
    $('#quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     EVENT LISTENERS
     ================================================================ */

  /* Mode tabs */
  $$('#mode-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () { setMode(p.dataset.mode); });
  });

  /* Scenario tabs */
  $$('#scenario-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () { setScenario(p.dataset.scenario); });
  });

  /* Explore category tabs */
  $$('#cat-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      selCat = p.dataset.cat;
      selConcept = 0;
      $$('#cat-tabs .pill').forEach(function (b) { b.classList.toggle('active', b === p); });
      buildExploreGrid(); showConceptInfo(); draw();
    });
  });

  /* Sliders */
  function bindSlider(id, key, valId, suffix, parser) {
    var sl = $(id);
    if (!sl) return;
    sl.addEventListener('input', function () {
      var v = parser ? parser(sl.value) : parseFloat(sl.value);
      S[key] = v;
      $(valId).textContent = (typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(2)) : v) + suffix;
      if (simulating || simDone) resetSim();
      updateReadouts();
      draw();
    });
  }

  bindSlider('#sl-mass', 'mass', '#val-mass', ' kg', function (v) { return parseInt(v); });
  bindSlider('#sl-force', 'force', '#val-force', scenario === 'braking' ? ' m/s' : ' N', function (v) { return parseInt(v); });
  bindSlider('#sl-mus', 'mus', '#val-mus', '', parseFloat);
  bindSlider('#sl-muk', 'muk', '#val-muk', '', parseFloat);
  bindSlider('#sl-incline', 'incline', '#val-incline', '\u00B0', function (v) { return parseInt(v); });
  bindSlider('#sl-pull', 'pullAngle', '#val-pull', '\u00B0', function (v) { return parseInt(v); });

  /* Force slider needs dynamic suffix for braking */
  $('#sl-force').addEventListener('input', function () {
    var v = parseInt(this.value);
    S.force = v;
    $('#val-force').textContent = v + (scenario === 'braking' ? ' m/s' : ' N');
    if (simulating || simDone) resetSim();
    updateReadouts(); draw();
  });

  /* Surface presets */
  $$('.surface-preset').forEach(function (btn) {
    btn.addEventListener('click', function () {
      $$('.surface-preset').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      S.mus = parseFloat(btn.dataset.mus);
      S.muk = parseFloat(btn.dataset.muk);
      $('#sl-mus').value = S.mus;
      $('#sl-muk').value = S.muk;
      $('#val-mus').textContent = S.mus.toFixed(2);
      $('#val-muk').textContent = S.muk.toFixed(2);
      resetSim();
    });
  });

  /* Practice buttons */
  $('#pp-check').addEventListener('click', checkPractice);
  $('#pp-next').addEventListener('click', genPractice);
  $('#pp-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') { if (pAnswered) genPractice(); else checkPractice(); } });

  /* Push/Pull toggle */
  $$('#angle-mode-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      angleMode = p.dataset.amode;
      $$('#angle-mode-tabs .pill').forEach(function (b) { b.classList.toggle('active', b === p); });
      if (simulating || simDone) resetSim();
      updateReadouts(); draw();
    });
  });

  /* Play / Reset buttons */
  $('#btn-play').addEventListener('click', function () {
    if (simulating || simDone) { resetSim(); } else { startSim(); }
  });
  $('#btn-reset').addEventListener('click', function () { resetSim(); });

  /* Scenario tabs also reset sim */
  $$('#scenario-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () { resetSim(); });
  });

  /* Canvas pointer events for touch-action */
  cvs.addEventListener('pointerdown', function (e) { e.preventDefault(); });

  /* ================================================================
     INITIALISATION
     ================================================================ */
  /* Hide conditional rows initially */
  hide($('#incline-row'));
  hide($('#pull-angle-row'));
  hide($('#angle-mode-row'));
  updateReadouts();
  draw();

})();
