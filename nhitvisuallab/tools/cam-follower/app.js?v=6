(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS (12 items, 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Cam Basics (4) ─────────────────────────────────────────── */
    {
      id: 'cam-types', name: 'Types of Cams', symbol: 'Disc / Cylindrical / Wedge',
      formula: 'Disc (plate), Cylindrical, Wedge, Conjugate', unit: '\u2014',
      cat: 'basics',
      desc: 'Cams are classified by their shape and the type of motion they produce. A disc cam (plate cam) is the most common \u2014 the cam profile is machined on the face of a rotating disc. A cylindrical cam has a groove cut into the surface of a cylinder; the follower rides in this groove. A wedge cam translates linearly to push a follower. A conjugate cam uses two cam profiles to maintain positive contact with the follower, eliminating the need for a spring return.',
      diagram: 'camTypes',
      example: { problem: 'A disc cam rotates at 600 rpm. How many cam cycles occur per second?', steps: ['Cycles per second = RPM / 60', '= 600 / 60', '= 10 cycles/s', 'Each rotation = one complete cam cycle'], answer: 10, unit: 'cycles/s' }
    },
    {
      id: 'follower-types', name: 'Follower Types', symbol: 'Flat / Roller / Knife',
      formula: 'Flat-face, Roller, Knife-edge, Mushroom', unit: '\u2014',
      cat: 'basics',
      desc: 'Followers are classified by the shape of their contact surface. A flat-face follower has a wide, planar contact surface that distributes load over a larger area, reducing contact stress and wear. A roller follower uses a small rolling element at the tip, converting sliding friction to rolling friction for improved efficiency. A knife-edge follower has a sharp point of contact that can trace complex cam profiles precisely but wears rapidly due to high contact pressure. Mushroom (spherical) followers offer a compromise between flat and knife-edge types.',
      diagram: 'followerTypes',
      example: { problem: 'A roller follower with radius 8 mm rides on a cam with a pitch-curve radius of curvature of 20 mm. What is the actual cam-surface radius of curvature?', steps: ['Cam surface radius = Pitch curve radius \u2212 Roller radius', '= 20 \u2212 8', '= 12 mm', 'If this were negative, undercutting would occur'], answer: 12, unit: 'mm' }
    },
    {
      id: 'base-circle', name: 'Base Circle & Trace Point', symbol: 'r\u2080',
      formula: 'Base circle = smallest circle tangent to cam profile from centre', unit: 'mm',
      cat: 'basics',
      desc: 'The base circle is the smallest circle that can be drawn from the cam\u2019s centre of rotation, tangent to the cam profile. It defines the minimum size of the cam. The trace point is the point on the follower whose path generates the pitch curve \u2014 for a knife-edge follower, it is the tip; for a roller follower, it is the centre of the roller. The pitch curve is the locus of the trace point as the cam rotates. Increasing the base circle radius reduces the pressure angle and risk of undercutting, but makes the cam physically larger.',
      diagram: 'baseCircle',
      example: { problem: 'A cam has a base circle radius of 30 mm and a maximum lift of 20 mm. What is the maximum distance from the cam centre to the pitch curve?', steps: ['Max pitch-curve radius = Base circle radius + Lift', '= 30 + 20', '= 50 mm', 'This occurs at maximum follower displacement'], answer: 50, unit: 'mm' }
    },
    {
      id: 'cam-terminology', name: 'Cam Terminology', symbol: 'Rise / Dwell / Return',
      formula: 'Rise \u2192 Dwell \u2192 Return \u2192 Dwell (one cycle = 360\u00B0)', unit: '\u00B0',
      cat: 'basics',
      desc: 'A complete cam cycle (360\u00B0) consists of four phases. During the rise (or lift), the follower moves away from the cam centre \u2014 the cam angle traversed is called the rise angle (\u03B2\u2081). During the first dwell, the follower remains stationary at maximum displacement. During the return, the follower moves back towards the cam centre over the return angle (\u03B2\u2082). During the second dwell (if any), the follower rests at its lowest position. The lift (h) is the maximum linear displacement of the follower. The cam angle (\u03B8) is measured from the start of the cycle.',
      diagram: 'camTerminology',
      example: { problem: 'A cam has rise angle 120\u00B0, first dwell 30\u00B0, return angle 150\u00B0. What is the second dwell angle?', steps: ['Total cycle = 360\u00B0', 'Second dwell = 360 \u2212 (rise + dwell\u2081 + return)', '= 360 \u2212 (120 + 30 + 150)', '= 60\u00B0'], answer: 60, unit: '\u00B0' }
    },

    /* ── Motion Laws (4) ────────────────────────────────────────── */
    {
      id: 'shm-profile', name: 'SHM Profile', symbol: 's = h/2(1\u2212cos\u03C0\u03B8/\u03B2)',
      formula: 'v_max = \u03C0h\u03C9/(2\u03B2), a_max = \u03C0\u00B2h\u03C9\u00B2/(2\u03B2\u00B2)', unit: 'mm, mm/s, mm/s\u00B2',
      cat: 'motion',
      desc: 'Simple Harmonic Motion produces a sinusoidal displacement curve. The follower displacement is s = (h/2)(1 \u2212 cos(\u03C0\u03B8/\u03B2)), where h is the lift, \u03B8 is the current cam angle within the rise, and \u03B2 is the total rise angle. The velocity is v = (\u03C0h\u03C9)/(2\u03B2) \u00D7 sin(\u03C0\u03B8/\u03B2), and acceleration is a = (\u03C0\u00B2h\u03C9\u00B2)/(2\u03B2\u00B2) \u00D7 cos(\u03C0\u03B8/\u03B2). SHM has finite acceleration but a discontinuity in the jerk (derivative of acceleration) at the beginning and end of the stroke, which can cause vibration at high speeds.',
      diagram: 'shmProfile',
      example: { problem: 'A cam with SHM rise has h = 25 mm, \u03B2 = \u03C0 rad (180\u00B0), \u03C9 = 10 rad/s. Find v_max.', steps: ['v_max = \u03C0h\u03C9 / (2\u03B2)', '= \u03C0 \u00D7 25 \u00D7 10 / (2 \u00D7 \u03C0)', '= 250\u03C0 / (2\u03C0)', '= 125 mm/s'], answer: 125, unit: 'mm/s' }
    },
    {
      id: 'uniform-vel', name: 'Uniform Velocity', symbol: 's = h\u03B8/\u03B2',
      formula: 'v = h\u03C9/\u03B2, a = 0 (infinite at transitions)', unit: 'mm, mm/s',
      cat: 'motion',
      desc: 'Uniform velocity motion produces a linear displacement curve: s = h\u03B8/\u03B2. The velocity is constant at v = h\u03C9/\u03B2 throughout the rise, and the acceleration is zero during the stroke. However, at the start and end of the rise, the velocity changes instantaneously from zero to v (and back), producing theoretically infinite acceleration \u2014 an impulse or shock. This makes pure uniform velocity unsuitable for high-speed cams. In practice, the transitions are rounded with parabolic or circular arcs to limit the acceleration spike.',
      diagram: 'uniformVel',
      example: { problem: 'A cam with uniform velocity rise has h = 30 mm, \u03B2 = 2.094 rad (120\u00B0), \u03C9 = 20 rad/s. Find the constant velocity.', steps: ['v = h\u03C9/\u03B2', '= 30 \u00D7 20 / 2.094', '= 600 / 2.094', '\u2248 286.5 mm/s'], answer: 286.5, unit: 'mm/s' }
    },
    {
      id: 'uniform-acc', name: 'Uniform Acceleration', symbol: 'Parabolic',
      formula: 'v_max = 2h\u03C9/\u03B2, a_max = 4h\u03C9\u00B2/\u03B2\u00B2', unit: 'mm/s, mm/s\u00B2',
      cat: 'motion',
      desc: 'Uniform acceleration (parabolic) motion provides constant acceleration in the first half of the rise and constant deceleration in the second half. For the first half (0 \u2264 \u03B8 \u2264 \u03B2/2): s = 2h(\u03B8/\u03B2)\u00B2. For the second half (\u03B2/2 < \u03B8 \u2264 \u03B2): s = h \u2212 2h(1 \u2212 \u03B8/\u03B2)\u00B2. The maximum velocity occurs at the midpoint: v_max = 2h\u03C9/\u03B2. The acceleration is \u00B1 4h\u03C9\u00B2/\u03B2\u00B2. This motion law has a discontinuity in acceleration at the midpoint (sudden reversal) and at the ends, producing jerk. It is suitable for moderate-speed applications.',
      diagram: 'uniformAcc',
      example: { problem: 'A cam with uniform acceleration has h = 20 mm, \u03B2 = \u03C0 rad, \u03C9 = 15 rad/s. Find a_max.', steps: ['a_max = 4h\u03C9\u00B2/\u03B2\u00B2', '= 4 \u00D7 20 \u00D7 15\u00B2 / \u03C0\u00B2', '= 4 \u00D7 20 \u00D7 225 / 9.8696', '= 18000 / 9.8696 \u2248 1823.7 mm/s\u00B2'], answer: 1823.7, unit: 'mm/s\u00B2' }
    },
    {
      id: 'cycloidal-motion', name: 'Cycloidal Motion', symbol: 's = h(\u03B8/\u03B2 \u2212 sin(2\u03C0\u03B8/\u03B2)/(2\u03C0))',
      formula: 'v_max = 2h\u03C9/\u03B2, a_max = 2\u03C0h\u03C9\u00B2/\u03B2\u00B2', unit: 'mm/s, mm/s\u00B2',
      cat: 'motion',
      desc: 'Cycloidal motion is widely considered the best motion law for high-speed cams because it produces zero acceleration at both the beginning and end of the stroke \u2014 eliminating jerk (infinite rate of change of acceleration). The displacement equation is s = h(\u03B8/\u03B2 \u2212 sin(2\u03C0\u03B8/\u03B2)/(2\u03C0)). The velocity is v = (h\u03C9/\u03B2)(1 \u2212 cos(2\u03C0\u03B8/\u03B2)), peaking at v_max = 2h\u03C9/\u03B2. The acceleration is a = (2\u03C0h\u03C9\u00B2/\u03B2\u00B2)sin(2\u03C0\u03B8/\u03B2), with a_max = 2\u03C0h\u03C9\u00B2/\u03B2\u00B2. Although the peak acceleration is higher than uniform acceleration, the smooth transitions make it preferable for high-speed operation.',
      diagram: 'cycloidalMotion',
      example: { problem: 'A cycloidal cam has h = 20 mm, \u03B2 = \u03C0 rad, \u03C9 = 10 rad/s. Find v_max and a_max.', steps: ['v_max = 2h\u03C9/\u03B2 = 2\u00D720\u00D710/\u03C0', '= 400/\u03C0 \u2248 127.3 mm/s', 'a_max = 2\u03C0h\u03C9\u00B2/\u03B2\u00B2 = 2\u03C0\u00D720\u00D7100/\u03C0\u00B2', '= 4000/\u03C0 \u2248 1273.2 mm/s\u00B2'], answer: 127.3, unit: 'mm/s' }
    },

    /* ── Design (4) ─────────────────────────────────────────────── */
    {
      id: 'pressure-angle', name: 'Pressure Angle', symbol: '\u03B1',
      formula: '\u03B1 = arctan(ds/d\u03B8 / (r\u2080 + s))', unit: '\u00B0',
      cat: 'design',
      desc: 'The pressure angle (\u03B1) is the angle between the direction of the follower motion and the normal to the pitch curve at the contact point. It determines how much of the contact force drives the follower versus how much pushes it sideways into the guide. For translating followers, the pressure angle should be kept below 30\u00B0 to prevent jamming and excessive side thrust. For oscillating followers, up to 35\u00B0 may be acceptable. The pressure angle can be reduced by increasing the base circle radius, decreasing the lift, or increasing the rise angle.',
      diagram: 'pressureAngle',
      example: { problem: 'At a point where s = 15 mm, ds/d\u03B8 = 12 mm/rad, and base circle radius r\u2080 = 30 mm. Find the pressure angle.', steps: ['\u03B1 = arctan(ds/d\u03B8 \u00F7 (r\u2080 + s))', '= arctan(12 / (30 + 15))', '= arctan(12 / 45)', '= arctan(0.2667) \u2248 14.9\u00B0'], answer: 14.9, unit: '\u00B0' }
    },
    {
      id: 'undercutting', name: 'Undercutting', symbol: '\u03C1 < r_roller',
      formula: 'Occurs when pitch-curve curvature radius < roller radius', unit: 'mm',
      cat: 'design',
      desc: 'Undercutting occurs when the radius of curvature of the pitch curve becomes smaller than the roller radius. This makes it impossible to generate a valid cam profile \u2014 the cam surface folds back on itself, creating a cusp or self-intersecting profile that cannot be manufactured. To avoid undercutting: (1) Increase the base circle radius. (2) Decrease the roller radius. (3) Reduce the lift or increase the rise angle. (4) Choose a motion law with lower acceleration peaks. Checking for undercutting is a critical step in cam design validation.',
      diagram: 'undercutting',
      example: { problem: 'A pitch curve has a minimum radius of curvature of 10 mm. What is the maximum roller follower radius that avoids undercutting?', steps: ['No undercutting when: roller radius < min curvature radius', 'Max roller radius < 10 mm', 'For safety margin, use roller radius \u2264 8 mm', 'A common rule: roller radius \u2264 0.8 \u00D7 min curvature radius'], answer: 10, unit: 'mm' }
    },
    {
      id: 'cam-manufacturing', name: 'Cam Manufacturing', symbol: 'CNC / Milling',
      formula: 'Profile accuracy \u00B1 0.01 mm (CNC), \u00B1 0.05 mm (conventional)', unit: 'mm',
      cat: 'design',
      desc: 'Cams are manufactured using several methods. CNC milling is the most precise, generating the cam profile directly from the mathematical equations with accuracy of \u00B1 0.01 mm. Conventional milling uses a master cam or template. Wire EDM (Electrical Discharge Machining) is used for hardened materials and complex profiles. Grinding is used for final finishing to achieve smooth surface finish and accurate profiles. The cam material is typically hardened steel (case-hardened or through-hardened) to resist wear at the contact surface. Surface treatments like nitriding or chrome plating further improve wear resistance.',
      diagram: 'camManufacturing',
      example: { problem: 'A CNC-manufactured cam has a profile tolerance of \u00B1 0.01 mm. If the nominal lift is 25 mm, what is the range of actual lift values?', steps: ['Minimum lift = 25 \u2212 0.01 = 24.99 mm', 'Maximum lift = 25 + 0.01 = 25.01 mm', 'Range = 0.02 mm', 'This is typical CNC cam precision'], answer: 0.02, unit: 'mm' }
    },
    {
      id: 'real-world-apps', name: 'Real-world Applications', symbol: 'IC / Textile / Pkg',
      formula: 'Engine valves, textile looms, packaging, printing', unit: '\u2014',
      cat: 'design',
      desc: 'Cam mechanisms are ubiquitous in mechanical engineering. In internal combustion engines, camshafts with multiple cams open and close intake and exhaust valves with precise timing. Overhead cam (OHC) and double overhead cam (DOHC) configurations are standard in modern engines. In textile machinery, cams control the shedding mechanism for weaving patterns. In printing presses, cams synchronise paper feed, ink transfer, and impression timing. In packaging machinery, cams drive filling, sealing, and cutting operations at high speed. In metalworking, cam-operated presses and automatic lathes use cams to control tool paths.',
      diagram: 'realWorldApps',
      example: { problem: 'An engine camshaft rotates at 1500 rpm with a lift of 8 mm and rise angle of 120\u00B0. If using SHM, find v_max.', steps: ['\u03C9 = 2\u03C0 \u00D7 1500/60 = 50\u03C0 rad/s', '\u03B2 = 120\u00B0 = 2\u03C0/3 rad', 'v_max = \u03C0h\u03C9/(2\u03B2)', '= \u03C0 \u00D7 8 \u00D7 50\u03C0 / (2 \u00D7 2\u03C0/3) = 8 \u00D7 50\u03C0\u00B2 \u00D7 3 / (4\u03C0) = 300\u03C0 \u2248 942.5 mm/s'], answer: 942.5, unit: 'mm/s' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS (12)
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 — SHM max velocity */
    function () {
      var h = randInt(10, 40);
      var betaDeg = [120, 150, 180][randInt(0, 2)];
      var beta = betaDeg * Math.PI / 180;
      var rpm = randInt(20, 80);
      var omega = 2 * Math.PI * rpm / 60;
      var vmax = +(Math.PI * h * omega / (2 * beta)).toFixed(1);
      return { prompt: 'SHM rise: h = ' + h + ' mm, rise angle = ' + betaDeg + '\u00B0, RPM = ' + rpm + '. Find v_max (mm/s).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + '/60 = ' + (omega).toFixed(3) + ' rad/s', '\u03B2 = ' + betaDeg + '\u00B0 = ' + beta.toFixed(4) + ' rad', 'v_max = \u03C0h\u03C9/(2\u03B2)', 'v_max = ' + vmax + ' mm/s'], answer: vmax, unit: 'mm/s' };
    },
    /* 1 — SHM max acceleration */
    function () {
      var h = randInt(10, 30);
      var betaDeg = [120, 150, 180][randInt(0, 2)];
      var beta = betaDeg * Math.PI / 180;
      var rpm = randInt(20, 60);
      var omega = 2 * Math.PI * rpm / 60;
      var amax = +(Math.PI * Math.PI * h * omega * omega / (2 * beta * beta)).toFixed(1);
      return { prompt: 'SHM rise: h = ' + h + ' mm, rise angle = ' + betaDeg + '\u00B0, RPM = ' + rpm + '. Find a_max (mm/s\u00B2).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + '/60 = ' + omega.toFixed(3) + ' rad/s', '\u03B2 = ' + betaDeg + '\u00B0 = ' + beta.toFixed(4) + ' rad', 'a_max = \u03C0\u00B2h\u03C9\u00B2/(2\u03B2\u00B2)', 'a_max = ' + amax + ' mm/s\u00B2'], answer: amax, unit: 'mm/s\u00B2' };
    },
    /* 2 — Uniform velocity */
    function () {
      var h = randInt(15, 40);
      var betaDeg = [90, 120, 150, 180][randInt(0, 3)];
      var beta = betaDeg * Math.PI / 180;
      var rpm = randInt(20, 80);
      var omega = 2 * Math.PI * rpm / 60;
      var v = +(h * omega / beta).toFixed(1);
      return { prompt: 'Uniform velocity: h = ' + h + ' mm, rise angle = ' + betaDeg + '\u00B0, RPM = ' + rpm + '. Find constant velocity (mm/s).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + '/60 = ' + omega.toFixed(3) + ' rad/s', '\u03B2 = ' + betaDeg + '\u00B0 = ' + beta.toFixed(4) + ' rad', 'v = h\u03C9/\u03B2', 'v = ' + v + ' mm/s'], answer: v, unit: 'mm/s' };
    },
    /* 3 — Uniform acceleration v_max */
    function () {
      var h = randInt(10, 35);
      var betaDeg = [120, 150, 180][randInt(0, 2)];
      var beta = betaDeg * Math.PI / 180;
      var rpm = randInt(20, 60);
      var omega = 2 * Math.PI * rpm / 60;
      var vmax = +(2 * h * omega / beta).toFixed(1);
      return { prompt: 'Uniform acceleration: h = ' + h + ' mm, rise angle = ' + betaDeg + '\u00B0, RPM = ' + rpm + '. Find v_max (mm/s).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + '/60 = ' + omega.toFixed(3) + ' rad/s', '\u03B2 = ' + betaDeg + '\u00B0 = ' + beta.toFixed(4) + ' rad', 'v_max = 2h\u03C9/\u03B2', 'v_max = ' + vmax + ' mm/s'], answer: vmax, unit: 'mm/s' };
    },
    /* 4 — Uniform acceleration a_max */
    function () {
      var h = randInt(10, 30);
      var betaDeg = [120, 150, 180][randInt(0, 2)];
      var beta = betaDeg * Math.PI / 180;
      var rpm = randInt(20, 50);
      var omega = 2 * Math.PI * rpm / 60;
      var amax = +(4 * h * omega * omega / (beta * beta)).toFixed(1);
      return { prompt: 'Uniform acceleration: h = ' + h + ' mm, rise angle = ' + betaDeg + '\u00B0, RPM = ' + rpm + '. Find a_max (mm/s\u00B2).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + '/60 = ' + omega.toFixed(3) + ' rad/s', '\u03B2 = ' + betaDeg + '\u00B0 = ' + beta.toFixed(4) + ' rad', 'a_max = 4h\u03C9\u00B2/\u03B2\u00B2', 'a_max = ' + amax + ' mm/s\u00B2'], answer: amax, unit: 'mm/s\u00B2' };
    },
    /* 5 — Cycloidal v_max */
    function () {
      var h = randInt(10, 35);
      var betaDeg = [120, 150, 180][randInt(0, 2)];
      var beta = betaDeg * Math.PI / 180;
      var rpm = randInt(20, 80);
      var omega = 2 * Math.PI * rpm / 60;
      var vmax = +(2 * h * omega / beta).toFixed(1);
      return { prompt: 'Cycloidal rise: h = ' + h + ' mm, rise angle = ' + betaDeg + '\u00B0, RPM = ' + rpm + '. Find v_max (mm/s).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + '/60 = ' + omega.toFixed(3) + ' rad/s', '\u03B2 = ' + betaDeg + '\u00B0 = ' + beta.toFixed(4) + ' rad', 'v_max = 2h\u03C9/\u03B2', 'v_max = ' + vmax + ' mm/s'], answer: vmax, unit: 'mm/s' };
    },
    /* 6 — Cycloidal a_max */
    function () {
      var h = randInt(10, 25);
      var betaDeg = [120, 150, 180][randInt(0, 2)];
      var beta = betaDeg * Math.PI / 180;
      var rpm = randInt(20, 50);
      var omega = 2 * Math.PI * rpm / 60;
      var amax = +(2 * Math.PI * h * omega * omega / (beta * beta)).toFixed(1);
      return { prompt: 'Cycloidal rise: h = ' + h + ' mm, rise angle = ' + betaDeg + '\u00B0, RPM = ' + rpm + '. Find a_max (mm/s\u00B2).', steps: ['\u03C9 = 2\u03C0 \u00D7 ' + rpm + '/60 = ' + omega.toFixed(3) + ' rad/s', '\u03B2 = ' + betaDeg + '\u00B0 = ' + beta.toFixed(4) + ' rad', 'a_max = 2\u03C0h\u03C9\u00B2/\u03B2\u00B2', 'a_max = ' + amax + ' mm/s\u00B2'], answer: amax, unit: 'mm/s\u00B2' };
    },
    /* 7 — SHM displacement at given angle */
    function () {
      var h = randInt(15, 40);
      var betaDeg = 180;
      var thetaDeg = [30, 45, 60, 90, 120][randInt(0, 4)];
      var s = +(h / 2 * (1 - Math.cos(Math.PI * thetaDeg / betaDeg))).toFixed(2);
      return { prompt: 'SHM rise: h = ' + h + ' mm, \u03B2 = 180\u00B0. Find displacement at \u03B8 = ' + thetaDeg + '\u00B0 (mm).', steps: ['s = (h/2)(1 \u2212 cos(\u03C0\u03B8/\u03B2))', '= (' + h + '/2)(1 \u2212 cos(\u03C0\u00D7' + thetaDeg + '/180))', '= ' + (h / 2).toFixed(1) + ' \u00D7 (1 \u2212 cos(' + thetaDeg + '\u00B0))', 's = ' + s + ' mm'], answer: s, unit: 'mm' };
    },
    /* 8 — Pressure angle calculation */
    function () {
      var r0 = randInt(25, 50);
      var dsdt = randInt(8, 25);
      var s = randInt(5, 30);
      var alpha = +(Math.atan(dsdt / (r0 + s)) * 180 / Math.PI).toFixed(1);
      return { prompt: 'At a point: ds/d\u03B8 = ' + dsdt + ' mm/rad, s = ' + s + ' mm, r\u2080 = ' + r0 + ' mm. Find pressure angle (\u00B0).', steps: ['\u03B1 = arctan(ds/d\u03B8 \u00F7 (r\u2080 + s))', '= arctan(' + dsdt + ' / (' + r0 + ' + ' + s + '))', '= arctan(' + dsdt + ' / ' + (r0 + s) + ')', '\u03B1 = ' + alpha + '\u00B0'], answer: alpha, unit: '\u00B0' };
    },
    /* 9 — Max pitch curve radius */
    function () {
      var r0 = randInt(20, 50);
      var h = randInt(10, 40);
      var rmax = r0 + h;
      return { prompt: 'Base circle radius = ' + r0 + ' mm, lift = ' + h + ' mm. Find the maximum pitch-curve radius (mm).', steps: ['Max radius = r\u2080 + h', '= ' + r0 + ' + ' + h, '= ' + rmax + ' mm', 'Occurs at maximum displacement'], answer: rmax, unit: 'mm' };
    },
    /* 10 — Uniform acceleration displacement at midpoint */
    function () {
      var h = randInt(15, 40);
      var s = +(h / 2).toFixed(1);
      return { prompt: 'Uniform acceleration rise: h = ' + h + ' mm. What is the displacement at the midpoint (\u03B8 = \u03B2/2)?', steps: ['At midpoint, both halves give s = h/2', 'First half: s = 2h(\u03B8/\u03B2)\u00B2 at \u03B8=\u03B2/2 \u2192 s = 2h(0.5)\u00B2 = h/2', 's = ' + h + '/2', 's = ' + s + ' mm'], answer: s, unit: 'mm' };
    },
    /* 11 — Dwell angle calculation */
    function () {
      var rise = [90, 120, 150][randInt(0, 2)];
      var dwell1 = [20, 30, 40, 60][randInt(0, 3)];
      var ret = [90, 120, 150][randInt(0, 2)];
      var dwell2 = 360 - rise - dwell1 - ret;
      if (dwell2 < 0) dwell2 = 0;
      return { prompt: 'Rise = ' + rise + '\u00B0, dwell\u2081 = ' + dwell1 + '\u00B0, return = ' + ret + '\u00B0. Find dwell\u2082 (\u00B0).', steps: ['Total = 360\u00B0', 'dwell\u2082 = 360 \u2212 (rise + dwell\u2081 + return)', '= 360 \u2212 (' + rise + ' + ' + dwell1 + ' + ' + ret + ')', '= ' + dwell2 + '\u00B0'], answer: dwell2, unit: '\u00B0' };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15 questions)
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'Which motion law produces zero acceleration throughout the stroke (ignoring transitions)?', options: ['Uniform velocity', 'SHM', 'Cycloidal', 'Uniform acceleration'], correct: 0 },
    { type: 'mcq', prompt: 'What is the base circle of a cam?', options: ['The smallest circle from the cam centre tangent to the cam profile', 'The largest circle inscribed in the cam', 'The circle traced by the follower tip', 'The pitch circle of the cam'], correct: 0 },
    { type: 'mcq', prompt: 'A roller follower reduces:', options: ['Sliding friction at the contact point', 'The size of the cam', 'The required lift', 'The number of dwell periods'], correct: 0 },
    { type: 'mcq', prompt: 'Cycloidal motion has what advantage over SHM?', options: ['Zero jerk at the start and end of stroke', 'Lower peak acceleration', 'Simpler mathematical expression', 'Higher maximum velocity'], correct: 0 },
    { type: 'mcq', prompt: 'The pressure angle in a cam mechanism should typically be kept below:', options: ['30\u00B0 for translating followers', '90\u00B0 for any follower', '10\u00B0 for all applications', '60\u00B0 for roller followers'], correct: 0 },
    { type: 'mcq', prompt: 'Undercutting in a cam profile occurs when:', options: ['The pitch-curve radius of curvature is less than the roller radius', 'The cam rotates too fast', 'The follower is too heavy', 'The base circle is too large'], correct: 0 },
    { type: 'mcq', prompt: 'In a complete cam cycle (360\u00B0), the phases in order are:', options: ['Rise, dwell, return, dwell', 'Rise, return, dwell, rise', 'Dwell, rise, dwell, return', 'Return, rise, dwell, return'], correct: 0 },
    { type: 'mcq', prompt: 'For uniform acceleration motion, the maximum velocity occurs at:', options: ['The midpoint of the rise', 'The start of the rise', 'The end of the rise', 'One-third of the rise'], correct: 0 },
    { type: 'mcq', prompt: 'Which follower type can trace the most complex cam profiles but wears fastest?', options: ['Knife-edge follower', 'Flat-face follower', 'Roller follower', 'Mushroom follower'], correct: 0 },
    { type: 'mcq', prompt: 'Increasing the base circle radius of a cam will:', options: ['Reduce the pressure angle', 'Increase the lift', 'Increase the pressure angle', 'Have no effect on performance'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'A cycloidal cam: h = 20 mm, \u03B2 = \u03C0 rad, \u03C9 = 10 rad/s. Find v_max (mm/s). (Round to 1 decimal)', answer: 127.3, unit: 'mm/s', steps: ['v_max = 2h\u03C9/\u03B2 = 2\u00D720\u00D710/\u03C0', '= 400/\u03C0 \u2248 127.3 mm/s'] },
    { type: 'numeric', prompt: 'SHM cam: h = 30 mm, \u03B2 = 180\u00B0. Find displacement at \u03B8 = 90\u00B0 (mm).', answer: 15, unit: 'mm', steps: ['s = (h/2)(1 \u2212 cos(\u03C0\u00D790/180))', '= 15 \u00D7 (1 \u2212 cos(90\u00B0)) = 15 \u00D7 1 = 15 mm'] },
    { type: 'numeric', prompt: 'Rise = 150\u00B0, dwell\u2081 = 30\u00B0, return = 120\u00B0. Find dwell\u2082 (\u00B0).', answer: 60, unit: '\u00B0', steps: ['dwell\u2082 = 360 \u2212 150 \u2212 30 \u2212 120', '= 60\u00B0'] },
    { type: 'numeric', prompt: 'Base circle radius = 40 mm, lift = 25 mm. Max pitch-curve radius (mm)?', answer: 65, unit: 'mm', steps: ['Max radius = r\u2080 + h = 40 + 25', '= 65 mm'] },
    { type: 'numeric', prompt: 'Uniform acceleration: h = 24 mm, \u03B2 = \u03C0 rad, \u03C9 = 20 rad/s. Find v_max (mm/s). (Round to 1 decimal)', answer: 305.6, unit: 'mm/s', steps: ['v_max = 2h\u03C9/\u03B2 = 2\u00D724\u00D720/\u03C0', '= 960/\u03C0 \u2248 305.6 mm/s'] }
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
  var camType = 'eccentric';
  var followerType = 'flat';
  var baseRadius = 30;    /* mm */
  var lift = 20;           /* mm */
  var rpm = 30;
  var playing = true;
  var camAngle = 0;        /* radians, current rotation */

  /* Timing angles in radians */
  var riseAngle = Math.PI;          /* 180 degrees */
  var dwellAngle1 = Math.PI / 6;   /* 30 degrees */
  var returnAngle = 5 * Math.PI / 6; /* 150 degrees */
  var dwellAngle2 = 0;              /* remainder = 0 degrees for now */

  /* Explore */
  var selCat = 'basics';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* Animation */
  var lastTime = 0;
  var animId = null;

  /* ================================================================
     MOTION LAW FUNCTIONS
     ================================================================ */

  /* All functions take theta (angle within rise/return, 0 to beta) and beta (total rise/return angle) */
  /* Return { s, v, a } where s = displacement ratio (0 to h), v, a include omega factor */

  function motionEccentric(theta, beta, h, omega) {
    /* Eccentric cam = SHM equivalent for full rotation, but simplified */
    var s = h / 2 * (1 - Math.cos(Math.PI * theta / beta));
    var v = Math.PI * h * omega / (2 * beta) * Math.sin(Math.PI * theta / beta);
    var a = Math.PI * Math.PI * h * omega * omega / (2 * beta * beta) * Math.cos(Math.PI * theta / beta);
    return { s: s, v: v, a: a };
  }

  function motionSHM(theta, beta, h, omega) {
    var s = h / 2 * (1 - Math.cos(Math.PI * theta / beta));
    var v = Math.PI * h * omega / (2 * beta) * Math.sin(Math.PI * theta / beta);
    var a = Math.PI * Math.PI * h * omega * omega / (2 * beta * beta) * Math.cos(Math.PI * theta / beta);
    return { s: s, v: v, a: a };
  }

  function motionUniformVel(theta, beta, h, omega) {
    var frac = theta / beta;
    var s = h * frac;
    var v = h * omega / beta;
    var a = 0;
    return { s: s, v: v, a: a };
  }

  function motionUniformAcc(theta, beta, h, omega) {
    var frac = theta / beta;
    var s, v, a;
    if (frac <= 0.5) {
      s = 2 * h * frac * frac;
      v = 4 * h * omega * frac / beta;
      a = 4 * h * omega * omega / (beta * beta);
    } else {
      s = h - 2 * h * (1 - frac) * (1 - frac);
      v = 4 * h * omega * (1 - frac) / beta;
      a = -4 * h * omega * omega / (beta * beta);
    }
    return { s: s, v: v, a: a };
  }

  function motionCycloidal(theta, beta, h, omega) {
    var frac = theta / beta;
    var s = h * (frac - Math.sin(2 * Math.PI * frac) / (2 * Math.PI));
    var v = h * omega / beta * (1 - Math.cos(2 * Math.PI * frac));
    var a = 2 * Math.PI * h * omega * omega / (beta * beta) * Math.sin(2 * Math.PI * frac);
    return { s: s, v: v, a: a };
  }

  function getMotionFn() {
    switch (camType) {
      case 'eccentric': return motionEccentric;
      case 'shm': return motionSHM;
      case 'uniform-vel': return motionUniformVel;
      case 'uniform-acc': return motionUniformAcc;
      case 'cycloidal': return motionCycloidal;
      default: return motionSHM;
    }
  }

  /* Get follower displacement, velocity, acceleration at a given global cam angle (0 to 2*PI) */
  function getMotionAtAngle(globalAngle) {
    var angle = ((globalAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    var omega = 2 * Math.PI * rpm / 60;
    var fn = getMotionFn();
    var h = lift;

    /* Phase boundaries */
    var p1 = riseAngle;
    var p2 = p1 + dwellAngle1;
    var p3 = p2 + returnAngle;
    /* p4 = 2*PI (dwell2) */

    if (angle <= p1) {
      /* Rise phase */
      return fn(angle, riseAngle, h, omega);
    } else if (angle <= p2) {
      /* Dwell 1 — at max displacement */
      return { s: h, v: 0, a: 0 };
    } else if (angle <= p3) {
      /* Return phase — mirror of rise */
      var thetaRet = angle - p2;
      var ret = fn(thetaRet, returnAngle, h, omega);
      return { s: h - ret.s, v: -ret.v, a: -ret.a };
    } else {
      /* Dwell 2 — at zero displacement */
      return { s: 0, v: 0, a: 0 };
    }
  }

  /* ================================================================
     CAM PROFILE GENERATION
     ================================================================ */

  function generateCamProfile(steps) {
    var points = [];
    for (var i = 0; i <= steps; i++) {
      var angle = (i / steps) * 2 * Math.PI;
      var mot = getMotionAtAngle(angle);
      var r = baseRadius + mot.s;
      points.push({ angle: angle, r: r, s: mot.s });
    }
    return points;
  }

  /* ================================================================
     DRAWING — SIMULATE MODE
     ================================================================ */

  /* Layout: Left side = cam animation, Right side = motion diagrams */
  var CAM_CX = 180, CAM_CY = 260;
  var CAM_SCALE = 2.5; /* pixels per mm */

  /* Right side diagrams */
  var DIAG_L = 400, DIAG_R = 880;
  var DIAG_W = DIAG_R - DIAG_L;
  var CHART_H = 120;
  var CHART_PAD = 20;
  var CHART1_Y = 30;   /* Displacement */
  var CHART2_Y = CHART1_Y + CHART_H + CHART_PAD; /* Velocity */
  var CHART3_Y = CHART2_Y + CHART_H + CHART_PAD; /* Acceleration */

  function drawSimulate() {
    /* ── LEFT: Cam + Follower Animation ── */
    drawCamMechanism();

    /* ── RIGHT: Motion Diagrams ── */
    drawMotionDiagrams();
  }

  function drawCamMechanism() {
    var cx = CAM_CX, cy = CAM_CY;
    var sc = CAM_SCALE;

    /* Base circle (dashed) */
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius * sc, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Cam profile */
    var profile = generateCamProfile(360);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-camAngle); /* cam rotates clockwise */

    /* Fill cam profile */
    ctx.beginPath();
    for (var i = 0; i < profile.length; i++) {
      var pt = profile[i];
      var px = pt.r * sc * Math.cos(pt.angle - Math.PI / 2);
      var py = pt.r * sc * Math.sin(pt.angle - Math.PI / 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    /* metallic cast-iron cam plate — radial sheen offset toward the light */
    var maxR = 0;
    for (var mr = 0; mr < profile.length; mr++) { if (profile[mr].r > maxR) maxR = profile[mr].r; }
    var camG = ctx.createRadialGradient(-maxR * sc * 0.32, -maxR * sc * 0.32, maxR * sc * 0.08, 0, 0, maxR * sc * 1.05);
    camG.addColorStop(0,   'rgba(255,150,110,0.62)');
    camG.addColorStop(0.5, 'rgba(216,67,21,0.46)');
    camG.addColorStop(1,   'rgba(120,35,10,0.55)');
    ctx.fillStyle = camG;
    ctx.fill();
    ctx.strokeStyle = '#ef6a3d';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Shaft hub — domed steel boss */
    var hubG = ctx.createRadialGradient(-2, -2, 0, 0, 0, 7);
    hubG.addColorStop(0, '#ffd9c2'); hubG.addColorStop(0.6, '#ff8a65'); hubG.addColorStop(1, '#a8431f');
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, 2 * Math.PI);
    ctx.fillStyle = hubG; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.stroke();

    /* Current angle indicator line */
    ctx.strokeStyle = 'rgba(255,138,101,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    var indR = (baseRadius + lift + 5) * sc;
    ctx.lineTo(indR * Math.cos(-Math.PI / 2), indR * Math.sin(-Math.PI / 2));
    ctx.stroke();

    ctx.restore();

    /* Rotation arrow (outside cam) */
    var arrowR = (baseRadius + lift + 12) * sc;
    ctx.strokeStyle = '#d84315';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, arrowR, -Math.PI * 0.7, -Math.PI * 0.2);
    ctx.stroke();
    /* Arrow head */
    var aEnd = -Math.PI * 0.2;
    var ahx = cx + arrowR * Math.cos(aEnd);
    var ahy = cy + arrowR * Math.sin(aEnd);
    ctx.fillStyle = '#d84315';
    ctx.beginPath();
    ctx.moveTo(ahx + 6 * Math.cos(aEnd + 0.5), ahy + 6 * Math.sin(aEnd + 0.5));
    ctx.lineTo(ahx, ahy);
    ctx.lineTo(ahx + 6 * Math.cos(aEnd - 1.2), ahy + 6 * Math.sin(aEnd - 1.2));
    ctx.closePath();
    ctx.fill();

    /* ── Follower ── */
    var mot = getMotionAtAngle(camAngle);
    var followerBaseY = cy - (baseRadius + lift) * sc - 10; /* top of max lift */
    var followerY = cy - (baseRadius + mot.s) * sc;

    /* Follower guide rails */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    var guideLeft = cx - 18;
    var guideRight = cx + 18;
    var guideTop = followerBaseY - 60;
    ctx.beginPath();
    ctx.moveTo(guideLeft, guideTop); ctx.lineTo(guideLeft, cy - baseRadius * sc + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(guideRight, guideTop); ctx.lineTo(guideRight, cy - baseRadius * sc + 5);
    ctx.stroke();

    /* Contact glow where cam meets follower */
    var glowG = ctx.createRadialGradient(cx, followerY, 0, cx, followerY, 16);
    glowG.addColorStop(0, 'rgba(255,210,120,0.55)');
    glowG.addColorStop(1, 'rgba(255,210,120,0)');
    ctx.fillStyle = glowG;
    ctx.beginPath(); ctx.arc(cx, followerY, 16, 0, 2 * Math.PI); ctx.fill();

    /* Follower stem — cylindrical steel rod (dark core, body, highlight) */
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#a8431f'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(cx, followerY); ctx.lineTo(cx, guideTop); ctx.stroke();
    ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx, followerY); ctx.lineTo(cx, guideTop); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,220,200,0.7)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 1.6, followerY); ctx.lineTo(cx - 1.6, guideTop); ctx.stroke();
    ctx.restore();
    ctx.lineCap = 'butt';

    /* Follower head based on type */
    if (followerType === 'flat') {
      ctx.fillStyle = '#ff8a65';
      ctx.fillRect(cx - 22, followerY - 3, 44, 6);
      ctx.strokeStyle = '#d84315';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 22, followerY - 3, 44, 6);
    } else if (followerType === 'roller') {
      var rollerR = 8;
      ctx.beginPath();
      ctx.arc(cx, followerY + rollerR, rollerR, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255,138,101,0.45)';
      ctx.fill();
      ctx.strokeStyle = '#ff8a65';
      ctx.lineWidth = 2;
      ctx.stroke();
      /* Centre dot */
      ctx.beginPath();
      ctx.arc(cx, followerY + rollerR, 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff8a65';
      ctx.fill();
    } else if (followerType === 'knife') {
      ctx.fillStyle = '#ff8a65';
      ctx.beginPath();
      ctx.moveTo(cx, followerY);
      ctx.lineTo(cx - 8, followerY - 14);
      ctx.lineTo(cx + 8, followerY - 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d84315';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* Pressure angle line (visual indicator) */
    if (mot.s > 0.5) {
      var omega = 2 * Math.PI * rpm / 60;
      var dsdt = mot.v / (omega || 1);
      var pressureAngle = Math.atan2(dsdt, baseRadius + mot.s);
      /* Draw as a small angle indicator near the contact point */
      var contactY = followerY;
      ctx.strokeStyle = 'rgba(245,200,66,0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      /* Normal line (vertical) */
      ctx.beginPath();
      ctx.moveTo(cx, contactY);
      ctx.lineTo(cx, contactY + 30);
      ctx.stroke();
      /* Force direction */
      ctx.beginPath();
      ctx.moveTo(cx, contactY);
      ctx.lineTo(cx + 30 * Math.sin(pressureAngle), contactY + 30 * Math.cos(pressureAngle));
      ctx.stroke();
      ctx.setLineDash([]);
      /* Angle arc */
      if (Math.abs(pressureAngle) > 0.02) {
        ctx.beginPath();
        ctx.arc(cx, contactY, 15, Math.PI / 2 - pressureAngle, Math.PI / 2);
        ctx.strokeStyle = 'rgba(245,200,66,0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
        ctx.stroke();
        ctx.font = '600 9px "Segoe UI", sans-serif';
        ctx.fillStyle = '#f5c842';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('\u03B1=' + (pressureAngle * 180 / Math.PI).toFixed(1) + '\u00B0', cx + 20, contactY + 22);
      }
    }

    /* Labels */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#d84315';
    ctx.fillText('CAM MECHANISM', cx, cy + (baseRadius + lift + 20) * sc);

    /* Base circle label */
    ctx.font = '500 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'left';
    ctx.fillText('r\u2080 = ' + lFix(baseRadius, 0, 2) + ' ' + uLen(), cx + baseRadius * sc + 8, cy - 5);

    /* Lift label */
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('h = ' + lFix(lift, 0, 2) + ' ' + uLen(), 20, cy - (baseRadius + lift / 2) * sc);
  }

  function drawMotionDiagrams() {
    var omega = 2 * Math.PI * rpm / 60;
    var fn = getMotionFn();
    var h = lift;

    /* Collect data for full cycle */
    var N = 360;
    var dispData = [], velData = [], accData = [];
    var maxV = 0, maxA = 0;

    for (var i = 0; i <= N; i++) {
      var angle = (i / N) * 2 * Math.PI;
      var mot = getMotionAtAngle(angle);
      dispData.push(mot.s);
      velData.push(mot.v);
      accData.push(mot.a);
      if (Math.abs(mot.v) > maxV) maxV = Math.abs(mot.v);
      if (Math.abs(mot.a) > maxA) maxA = Math.abs(mot.a);
    }
    if (maxV < 0.01) maxV = 1;
    if (maxA < 0.01) maxA = 1;

    /* Draw each chart */
    drawChart('DISPLACEMENT (s)', CHART1_Y, dispData, 0, h, '#3ddc84', uLen());
    drawChart('VELOCITY (v)', CHART2_Y, velData, -maxV * 1.1, maxV * 1.1, '#42a5f5', uVel());
    drawChart('ACCELERATION (a)', CHART3_Y, accData, -maxA * 1.1, maxA * 1.1, '#f5c842', uAcc());

    /* Current angle crosshair on all 3 charts */
    var angleFrac = ((camAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI);
    var crossX = DIAG_L + angleFrac * DIAG_W;

    ctx.strokeStyle = 'rgba(221,227,240,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(crossX, CHART1_Y);
    ctx.lineTo(crossX, CHART3_Y + CHART_H);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Dot on each chart at current value */
    var curMot = getMotionAtAngle(camAngle);
    drawCrossDot(crossX, CHART1_Y, CHART_H, curMot.s, 0, h, '#3ddc84');
    drawCrossDot(crossX, CHART2_Y, CHART_H, curMot.v, -maxV * 1.1, maxV * 1.1, '#42a5f5');
    drawCrossDot(crossX, CHART3_Y, CHART_H, curMot.a, -maxA * 1.1, maxA * 1.1, '#f5c842');
  }

  function drawChart(title, topY, data, minVal, maxVal, color, unitStr) {
    var range = maxVal - minVal;
    if (range < 0.001) range = 1;

    /* Chart background */
    ctx.fillStyle = 'rgba(22,27,39,0.6)';
    ctx.fillRect(DIAG_L - 5, topY, DIAG_W + 10, CHART_H);
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.strokeRect(DIAG_L - 5, topY, DIAG_W + 10, CHART_H);

    /* Zero line if applicable */
    if (minVal < 0 && maxVal > 0) {
      var zeroY = topY + CHART_H * (maxVal / range);
      ctx.strokeStyle = '#4a5578';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(DIAG_L, zeroY);
      ctx.lineTo(DIAG_R, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    /* Phase boundary lines */
    var phases = [riseAngle, riseAngle + dwellAngle1, riseAngle + dwellAngle1 + returnAngle];
    ctx.strokeStyle = 'rgba(106,122,153,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    for (var p = 0; p < phases.length; p++) {
      var px = DIAG_L + (phases[p] / (2 * Math.PI)) * DIAG_W;
      ctx.beginPath();
      ctx.moveTo(px, topY);
      ctx.lineTo(px, topY + CHART_H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    /* Data curve */
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i < data.length; i++) {
      var x = DIAG_L + (i / (data.length - 1)) * DIAG_W;
      var y = topY + CHART_H * ((maxVal - data[i]) / range);
      y = Math.max(topY, Math.min(topY + CHART_H, y));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* Fill under curve */
    if (minVal >= 0) {
      ctx.beginPath();
      for (var i2 = 0; i2 < data.length; i2++) {
        var x2 = DIAG_L + (i2 / (data.length - 1)) * DIAG_W;
        var y2 = topY + CHART_H * ((maxVal - data[i2]) / range);
        y2 = Math.max(topY, Math.min(topY + CHART_H, y2));
        if (i2 === 0) ctx.moveTo(x2, y2);
        else ctx.lineTo(x2, y2);
      }
      ctx.lineTo(DIAG_R, topY + CHART_H);
      ctx.lineTo(DIAG_L, topY + CHART_H);
      ctx.closePath();
      ctx.fillStyle = color.replace(')', ',0.35)').replace('rgb', 'rgba');
      ctx.fill();
    }

    /* Title */
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.fillText(title, DIAG_L, topY - 14);

    /* Y axis labels */
    ctx.font = '500 8px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillText(formatNum(lD(maxVal)) + ' ' + unitStr, DIAG_L - 8, topY);
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatNum(lD(minVal)), DIAG_L - 8, topY + CHART_H);

    /* X axis labels (degrees) */
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#4a5578';
    ctx.font = '500 8px "Courier New", monospace';
    for (var d = 0; d <= 360; d += 90) {
      var lx = DIAG_L + (d / 360) * DIAG_W;
      ctx.fillText(d + '\u00B0', lx, topY + CHART_H + 3);
    }
  }

  function drawCrossDot(x, chartTop, chartH, value, minVal, maxVal, color) {
    var range = maxVal - minVal;
    if (range < 0.001) range = 1;
    var y = chartTop + chartH * ((maxVal - value) / range);
    y = Math.max(chartTop, Math.min(chartTop + chartH, y));
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#0d1117';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function formatNum(n) {
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'k';
    if (Math.abs(n) >= 10) return n.toFixed(0);
    if (Math.abs(n) >= 1) return n.toFixed(1);
    return n.toFixed(2);
  }

  /* ================================================================
     DRAWING — EXPLORE MODE
     ================================================================ */

  function drawExplore() {
    var concept = getSelectedConcept();
    if (!concept) return;

    ctx.fillStyle = '#6b7a99';
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Concept Diagram: ' + concept.name, W / 2, 15);

    /* Draw appropriate diagram based on concept */
    switch (concept.diagram) {
      case 'camTypes': drawDiagramCamTypes(); break;
      case 'followerTypes': drawDiagramFollowerTypes(); break;
      case 'baseCircle': drawDiagramBaseCircle(); break;
      case 'camTerminology': drawDiagramCamTerminology(); break;
      case 'shmProfile': drawDiagramMotionProfile('SHM', motionSHM); break;
      case 'uniformVel': drawDiagramMotionProfile('Uniform Velocity', motionUniformVel); break;
      case 'uniformAcc': drawDiagramMotionProfile('Uniform Acceleration', motionUniformAcc); break;
      case 'cycloidalMotion': drawDiagramMotionProfile('Cycloidal', motionCycloidal); break;
      case 'pressureAngle': drawDiagramPressureAngle(); break;
      case 'undercutting': drawDiagramUndercutting(); break;
      case 'camManufacturing': drawDiagramManufacturing(); break;
      case 'realWorldApps': drawDiagramApplications(); break;
      default: drawDiagramGeneric(concept.name);
    }
  }

  function drawDiagramCamTypes() {
    var labels = ['Disc Cam', 'Cylindrical Cam', 'Wedge Cam'];
    var xPositions = [150, 450, 750];

    for (var i = 0; i < 3; i++) {
      var cx = xPositions[i], cy = 260;

      if (i === 0) {
        /* Disc cam */
        ctx.beginPath(); ctx.arc(cx, cy, 60, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(216,67,21,0.35)'; ctx.fill();
        ctx.strokeStyle = '#d84315'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + 10, cy, 60, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#d84315'; ctx.fill();
      } else if (i === 1) {
        /* Cylindrical cam */
        ctx.fillStyle = 'rgba(216,67,21,0.35)';
        ctx.fillRect(cx - 50, cy - 60, 100, 120);
        ctx.strokeStyle = '#d84315'; ctx.lineWidth = 2;
        ctx.strokeRect(cx - 50, cy - 60, 100, 120);
        /* Groove */
        ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 50, cy - 20);
        ctx.bezierCurveTo(cx - 20, cy - 40, cx + 20, cy + 40, cx + 50, cy + 20);
        ctx.stroke();
      } else {
        /* Wedge cam */
        ctx.fillStyle = 'rgba(216,67,21,0.35)';
        ctx.beginPath();
        ctx.moveTo(cx - 60, cy + 40);
        ctx.lineTo(cx + 60, cy + 40);
        ctx.lineTo(cx + 60, cy - 10);
        ctx.lineTo(cx - 60, cy - 40);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#d84315'; ctx.lineWidth = 2; ctx.stroke();
        /* Arrow showing motion */
        ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - 40, cy + 55); ctx.lineTo(cx + 40, cy + 55); ctx.stroke();
        ctx.fillStyle = '#ff8a65';
        ctx.beginPath(); ctx.moveTo(cx + 42, cy + 55); ctx.lineTo(cx + 32, cy + 50); ctx.lineTo(cx + 32, cy + 60); ctx.closePath(); ctx.fill();
      }

      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(labels[i], cx, cy + 90);
    }
  }

  function drawDiagramFollowerTypes() {
    var labels = ['Flat-face', 'Roller', 'Knife-edge'];
    var xPositions = [150, 450, 750];

    for (var i = 0; i < 3; i++) {
      var cx = xPositions[i], baseY = 320;

      /* Stem */
      ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx, baseY - 80); ctx.lineTo(cx, baseY - 160); ctx.stroke();

      /* Guide */
      ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 15, baseY - 80); ctx.lineTo(cx - 15, baseY - 170); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 15, baseY - 80); ctx.lineTo(cx + 15, baseY - 170); ctx.stroke();

      if (i === 0) {
        /* Flat face */
        ctx.fillStyle = '#ff8a65';
        ctx.fillRect(cx - 30, baseY - 83, 60, 6);
      } else if (i === 1) {
        /* Roller */
        ctx.beginPath(); ctx.arc(cx, baseY - 70, 12, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255,138,101,0.45)'; ctx.fill();
        ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, baseY - 70, 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff8a65'; ctx.fill();
      } else {
        /* Knife-edge */
        ctx.fillStyle = '#ff8a65';
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 78);
        ctx.lineTo(cx - 10, baseY - 96);
        ctx.lineTo(cx + 10, baseY - 96);
        ctx.closePath(); ctx.fill();
      }

      /* Cam below */
      ctx.beginPath(); ctx.arc(cx, baseY + 20, 50, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(216,67,21,0.2)'; ctx.fill();
      ctx.strokeStyle = '#d84315'; ctx.lineWidth = 1.5; ctx.stroke();

      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(labels[i], cx, baseY + 80);
    }
  }

  function drawDiagramBaseCircle() {
    var cx = W / 2, cy = 260, sc = 3;
    var r0 = 30, h = 20;

    /* Base circle */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.arc(cx, cy, r0 * sc, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);

    /* Prime circle (pitch curve at max) */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(cx, cy, (r0 + h) * sc, 0, 2 * Math.PI); ctx.stroke();
    ctx.setLineDash([]);

    /* Cam profile */
    var profile = generateCamProfile(360);
    ctx.beginPath();
    for (var i = 0; i < profile.length; i++) {
      var px = cx + profile[i].r * sc * Math.cos(profile[i].angle - Math.PI / 2);
      var py = cy + profile[i].r * sc * Math.sin(profile[i].angle - Math.PI / 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(216,67,21,0.35)'; ctx.fill();
    ctx.strokeStyle = '#d84315'; ctx.lineWidth = 2; ctx.stroke();

    /* Centre */
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#d84315'; ctx.fill();

    /* Labels */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('Base Circle (r\u2080)', cx + r0 * sc + 5, cy + 15);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('Prime Circle (r\u2080 + h)', cx + (r0 + h) * sc + 5, cy - 15);
    ctx.fillStyle = '#d84315';
    ctx.fillText('Cam Profile', cx + 10, cy - (r0 + h / 2) * sc);
  }

  function drawDiagramCamTerminology() {
    /* Show displacement diagram with labeled phases */
    var chartL = 80, chartR = W - 80;
    var chartW = chartR - chartL;
    var chartTop = 80, chartBot = 420;
    var chartH = chartBot - chartTop;
    var h = lift;

    /* Axes */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(chartL, chartBot); ctx.lineTo(chartR, chartBot); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(chartL, chartBot); ctx.lineTo(chartL, chartTop); ctx.stroke();

    /* Phase boundaries */
    var phases = [riseAngle, riseAngle + dwellAngle1, riseAngle + dwellAngle1 + returnAngle];
    var phaseX = phases.map(function (p) { return chartL + (p / (2 * Math.PI)) * chartW; });
    var phaseLabels = ['RISE', 'DWELL', 'RETURN', 'DWELL'];
    var phaseColors = ['#3ddc84', '#f5c842', '#ff5555', '#42a5f5'];

    ctx.setLineDash([4, 3]);
    for (var p = 0; p < phaseX.length; p++) {
      ctx.strokeStyle = phaseColors[p]; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(phaseX[p], chartTop); ctx.lineTo(phaseX[p], chartBot + 10); ctx.stroke();
    }
    ctx.setLineDash([]);

    /* Phase labels */
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var boundaryX = [chartL].concat(phaseX, [chartR]);
    for (var pl = 0; pl < phaseLabels.length; pl++) {
      var midX = (boundaryX[pl] + boundaryX[pl + 1]) / 2;
      ctx.fillStyle = phaseColors[pl];
      ctx.fillText(phaseLabels[pl], midX, chartBot + 18);
    }

    /* Draw displacement curve */
    var fn = getMotionFn();
    ctx.strokeStyle = '#d84315'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 360; i++) {
      var angle = (i / 360) * 2 * Math.PI;
      var mot = getMotionAtAngle(angle);
      var x = chartL + (i / 360) * chartW;
      var y = chartBot - (mot.s / h) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* Labels */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('\u03B8 (degrees)', (chartL + chartR) / 2, chartBot + 46);
    ctx.save();
    ctx.translate(chartL - 30, (chartTop + chartBot) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Displacement s (' + uLen() + ')', 0, 0);
    ctx.restore();

    /* Lift label */
    ctx.fillStyle = '#d84315'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillText('h = ' + lFix(h, 0, 2) + ' ' + uLen(), chartL - 5, chartTop);
    ctx.fillText('0', chartL - 5, chartBot);
  }

  function drawDiagramMotionProfile(name, motionFn) {
    var omega = 2 * Math.PI * 30 / 60; /* 30 rpm for demo */
    var h = 20;
    var beta = Math.PI;

    var chartL = 100, chartR = W - 50;
    var chartW = chartR - chartL;

    var charts = [
      { label: 's (mm)', top: 50, h: 120, color: '#3ddc84', data: [] },
      { label: 'v (mm/s)', top: 200, h: 120, color: '#42a5f5', data: [] },
      { label: 'a (mm/s\u00B2)', top: 350, h: 120, color: '#f5c842', data: [] }
    ];

    /* Generate data for rise only */
    var maxV = 0, maxA = 0;
    for (var i = 0; i <= 200; i++) {
      var theta = (i / 200) * beta;
      var m = motionFn(theta, beta, h, omega);
      charts[0].data.push(m.s);
      charts[1].data.push(m.v);
      charts[2].data.push(m.a);
      if (Math.abs(m.v) > maxV) maxV = Math.abs(m.v);
      if (Math.abs(m.a) > maxA) maxA = Math.abs(m.a);
    }

    var ranges = [
      { min: 0, max: h },
      { min: -maxV * 0.1, max: maxV * 1.1 },
      { min: -maxA * 1.1, max: maxA * 1.1 }
    ];

    for (var c = 0; c < 3; c++) {
      var chart = charts[c];
      var rng = ranges[c];
      var rngSize = rng.max - rng.min;
      if (rngSize < 0.001) rngSize = 1;

      /* Background */
      ctx.fillStyle = 'rgba(22,27,39,0.6)';
      ctx.fillRect(chartL, chart.top, chartW, chart.h);
      ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
      ctx.strokeRect(chartL, chart.top, chartW, chart.h);

      /* Zero line */
      if (rng.min < 0) {
        var zy = chart.top + chart.h * (rng.max / rngSize);
        ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 0.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(chartL, zy); ctx.lineTo(chartR, zy); ctx.stroke();
        ctx.setLineDash([]);
      }

      /* Curve */
      ctx.strokeStyle = chart.color; ctx.lineWidth = 2;
      ctx.beginPath();
      for (var j = 0; j < chart.data.length; j++) {
        var x = chartL + (j / (chart.data.length - 1)) * chartW;
        var y = chart.top + chart.h * ((rng.max - chart.data[j]) / rngSize);
        y = Math.max(chart.top, Math.min(chart.top + chart.h, y));
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      /* Label */
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = chart.color;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(chart.label, chartL, chart.top - 3);
    }

    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#d84315'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(name + ' Motion \u2014 Rise Phase (\u03B2 = 180\u00B0)', W / 2, 15);
  }

  function drawDiagramPressureAngle() {
    var cx = 300, cy = 280, sc = 3.5;
    var r0 = 30, s = 15;

    /* Cam outline simplified */
    ctx.beginPath(); ctx.arc(cx, cy, r0 * sc, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(216,67,21,0.35)'; ctx.fill();
    ctx.strokeStyle = '#d84315'; ctx.lineWidth = 1.5; ctx.stroke();

    /* Contact point */
    var contactY = cy - (r0 + s) * sc;
    ctx.beginPath(); ctx.arc(cx, contactY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff8a65'; ctx.fill();

    /* Follower direction (vertical, up) */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, contactY); ctx.lineTo(cx, contactY - 80); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(cx, contactY - 82); ctx.lineTo(cx - 5, contactY - 72); ctx.lineTo(cx + 5, contactY - 72); ctx.closePath(); ctx.fill();
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('Follower Direction', cx + 10, contactY - 60);

    /* Normal to pitch curve */
    var normalAngle = 25 * Math.PI / 180;
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, contactY);
    ctx.lineTo(cx + 80 * Math.sin(normalAngle), contactY - 80 * Math.cos(normalAngle));
    ctx.stroke();
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'left';
    ctx.fillText('Normal to Pitch Curve', cx + 80 * Math.sin(normalAngle) + 5, contactY - 80 * Math.cos(normalAngle));

    /* Pressure angle arc */
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, contactY, 35, -Math.PI / 2, -Math.PI / 2 + normalAngle);
    ctx.stroke();
    ctx.fillStyle = '#ff5555'; ctx.font = '700 14px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u03B1', cx + 45 * Math.sin(normalAngle / 2), contactY - 45 * Math.cos(normalAngle / 2));

    /* Explanation */
    ctx.font = '500 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Pressure angle \u03B1 = angle between follower direction', 550, 200);
    ctx.fillText('and normal to pitch curve at contact point.', 550, 218);
    ctx.fillText('Keep \u03B1 < 30\u00B0 for translating followers.', 550, 248);
    ctx.fillStyle = '#d84315';
    ctx.fillText('\u03B1 = arctan(ds/d\u03B8 \u00F7 (r\u2080 + s))', 550, 280);
  }

  function drawDiagramUndercutting() {
    var cx = W / 2, cy = 260;

    /* Normal cam (left) */
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Normal Profile', cx - 200, 60);

    ctx.beginPath(); ctx.arc(cx - 200, cy, 80, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(61,220,132,0.35)'; ctx.fill();
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2; ctx.stroke();

    /* Undercut cam (right) */
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('Undercut Profile', cx + 200, 60);

    ctx.beginPath();
    ctx.moveTo(cx + 130, cy);
    ctx.bezierCurveTo(cx + 200, cy - 100, cx + 300, cy - 50, cx + 280, cy);
    ctx.bezierCurveTo(cx + 300, cy + 50, cx + 200, cy + 100, cx + 130, cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,85,85,0.35)'; ctx.fill();
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 2; ctx.stroke();

    /* Cusp indication */
    ctx.fillStyle = '#ff5555'; ctx.font = '500 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('Cusp / Self-intersection', cx + 285, cy - 5);
    ctx.strokeStyle = '#ff5555'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx + 280, cy); ctx.lineTo(cx + 283, cy); ctx.stroke();

    /* Explanation */
    ctx.font = '500 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Undercutting occurs when pitch curve radius of curvature < roller radius', cx, cy + 120);
    ctx.fillText('Solution: increase base circle radius, reduce roller size, or change motion law', cx, cy + 140);
  }

  function drawDiagramManufacturing() {
    drawDiagramGeneric('Cam Manufacturing Methods');
    ctx.font = '500 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var methods = ['CNC Milling (\u00B10.01 mm)', 'Wire EDM (hardened materials)', 'Grinding (surface finish)', 'Conventional Milling (\u00B10.05 mm)'];
    var colors = ['#3ddc84', '#42a5f5', '#f5c842', '#ff8a65'];
    for (var i = 0; i < methods.length; i++) {
      ctx.fillStyle = colors[i]; ctx.font = '700 13px "Segoe UI", sans-serif';
      ctx.fillText('\u25CF  ' + methods[i], 200, 150 + i * 60);

      /* Simple icon per method */
      var ix = 160, iy = 155 + i * 60;
      ctx.beginPath(); ctx.arc(ix, iy, 10, 0, 2 * Math.PI);
      ctx.fillStyle = colors[i].replace(')', ',0.35)').replace('#', 'rgba(');
      /* Use the color directly with reduced opacity */
      ctx.fillStyle = 'rgba(106,122,153,0.35)';
      ctx.fill();
      ctx.strokeStyle = colors[i]; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  function drawDiagramApplications() {
    var apps = [
      { name: 'IC Engine Valve', x: 150, y: 180, color: '#d84315' },
      { name: 'Printing Press', x: 450, y: 180, color: '#3ddc84' },
      { name: 'Textile Loom', x: 150, y: 380, color: '#42a5f5' },
      { name: 'Packaging Machine', x: 450, y: 380, color: '#f5c842' }
    ];

    for (var i = 0; i < apps.length; i++) {
      var app = apps[i];
      /* Simple cam icon */
      ctx.beginPath(); ctx.arc(app.x, app.y, 40, 0, 2 * Math.PI);
      ctx.fillStyle = app.color.replace(')', ',0.2)').replace('#', 'rgba(');
      ctx.fillStyle = 'rgba(216,67,21,0.35)';
      ctx.fill();
      ctx.strokeStyle = app.color; ctx.lineWidth = 2; ctx.stroke();

      /* Eccentric dot */
      ctx.beginPath(); ctx.arc(app.x + 8, app.y, 3, 0, 2 * Math.PI);
      ctx.fillStyle = app.color; ctx.fill();

      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillStyle = app.color; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(app.name, app.x, app.y + 50);
    }

    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('Cam mechanisms are used in countless industrial applications', W / 2, 470);
  }

  function drawDiagramGeneric(title) {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#d84315';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(title, W / 2, H / 2);
  }

  /* ================================================================
     MAIN DRAW
     ================================================================ */

  function drawSceneBackground() {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#10151f'); bg.addColorStop(0.55, '#0d1117'); bg.addColorStop(1, '#090c11');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    if (mode === 'simulate') {
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, 392, H); ctx.clip();
      var glow = ctx.createRadialGradient(CAM_CX, CAM_CY, 30, CAM_CX, CAM_CY, 290);
      glow.addColorStop(0, 'rgba(216,67,21,0.10)'); glow.addColorStop(1, 'rgba(216,67,21,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 392, H);
      ctx.restore();
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawSceneBackground();

    if (mode === 'simulate') {
      drawSimulate();
    } else if (mode === 'explore') {
      drawExplore();
    } else {
      /* Practice / Quiz — show a static cam diagram */
      drawStaticCam();
    }
  }

  function drawStaticCam() {
    var cx = W / 2, cy = H / 2;
    var sc = 2;
    /* Draw a gentle static cam */
    ctx.beginPath(); ctx.arc(cx, cy, baseRadius * sc, 0, 2 * Math.PI);
    ctx.strokeStyle = '#2a3050'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);

    var profile = generateCamProfile(360);
    ctx.beginPath();
    for (var i = 0; i < profile.length; i++) {
      var px = cx + profile[i].r * sc * Math.cos(profile[i].angle - Math.PI / 2);
      var py = cy + profile[i].r * sc * Math.sin(profile[i].angle - Math.PI / 2);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(216,67,21,0.35)'; ctx.fill();
    ctx.strokeStyle = 'rgba(216,67,21,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(216,67,21,0.5)'; ctx.fill();

    var modeLabel = mode === 'practice' ? 'PRACTICE MODE' : 'QUIZ MODE';
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(modeLabel, cx, cy - (baseRadius + lift + 10) * sc);
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate(time) {
    if (lastTime === 0) lastTime = time;
    var dt = (time - lastTime) / 1000;
    lastTime = time;

    if (playing && mode === 'simulate') {
      var omega = 2 * Math.PI * rpm / 60;
      camAngle += omega * dt;
      camAngle = camAngle % (2 * Math.PI);
    }

    draw();
    updateReadouts();
    animId = requestAnimationFrame(animate);
  }

  /* ================================================================
     READOUT UPDATES
     ================================================================ */

  /* ================================================================
     DISPLAY UNITS  (display only — the cam profile stays in mm)
     Base radius, lift, displacement, velocity and acceleration are all
     lengths or length-derived, so one factor covers them. Cam angle and
     shaft speed are the same in both systems.
     ================================================================ */
  var unitSys = 'si';
  function isImp() { return unitSys === 'imp'; }
  function lD(mm)  { return isImp() ? mm * 0.0393701 : mm; }
  function uLen()  { return isImp() ? 'in' : 'mm'; }
  function uVel()  { return isImp() ? 'in/s' : 'mm/s'; }
  function uAcc()  { return isImp() ? 'in/s\u00b2' : 'mm/s\u00b2'; }
  function lFix(mm, dSI, dImp) {
    return lD(mm).toFixed(isImp() ? (dImp == null ? 3 : dImp) : (dSI == null ? 2 : dSI));
  }
  /* Single owner of the three slider captions. */
  function syncSliderLabels() {
    $('#radius-val').textContent = lFix(baseRadius, 0, 2) + ' ' + uLen();
    $('#lift-val').textContent   = lFix(lift, 0, 2) + ' ' + uLen();
    $('#rpm-val').textContent    = rpm + ' rpm';
    var caps = { 'u-disp': uLen(), 'u-vel': uVel(), 'u-acc': uAcc(),
                 'u-vmax': uVel(), 'u-amax': uAcc() };
    Object.keys(caps).forEach(function (id) {
      var e = $('#' + id); if (e) e.textContent = ' ' + caps[id];
    });
  }

  /* Unit toggle — display only; the cam profile stays in mm */
  $$('#unit-tabs .pill').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-unit');
      if (!u || u === unitSys) return;
      unitSys = u;
      $$('#unit-tabs .pill').forEach(function (b) { b.classList.toggle('active', b === btn); });
      syncSliderLabels();
      if (typeof draw === 'function') draw();
    });
  });

  function updateReadouts() {
    if (mode !== 'simulate') return;

    var mot = getMotionAtAngle(camAngle);
    var angleDeg = ((camAngle * 180 / Math.PI) % 360 + 360) % 360;

    $('#r-angle').textContent = angleDeg.toFixed(1);
    $('#r-disp').textContent = lFix(mot.s, 2, 3);
    $('#r-vel').textContent  = lFix(mot.v, 1, 2);
    $('#r-acc').textContent  = lFix(mot.a, 1, 2);

    /* Calculate max values over full cycle */
    var maxV = 0, maxA = 0;
    for (var i = 0; i <= 360; i++) {
      var angle = (i / 360) * 2 * Math.PI;
      var m = getMotionAtAngle(angle);
      if (Math.abs(m.v) > maxV) maxV = Math.abs(m.v);
      if (Math.abs(m.a) > maxA) maxA = Math.abs(m.a);
    }

    $('#r-vmax').textContent = lFix(maxV, 1, 2);
    $('#r-amax').textContent = lFix(maxA, 1, 2);
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function setMode(newMode) {
    mode = newMode;

    /* Update pills */
    $$('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === mode); });

    /* Toggle panels */
    var simPanel = $('#sim-panel');
    var catRow = $('#cat-row');
    var itemSel = $('#item-selector');
    var itemInfo = $('#item-info');
    var pracPanel = $('#practice-panel');
    var pracBar = $('#practice-bar');
    var quizPanel = $('#quiz-panel');
    var quizBar = $('#quiz-bar');
    var quizResult = $('#quiz-result');

    hide(simPanel); hide(catRow); hide(itemSel); hide(itemInfo);
    hide(pracPanel); hide(pracBar); hide(quizPanel); hide(quizBar); hide(quizResult);

    if (mode === 'simulate') {
      show(simPanel);
    } else if (mode === 'explore') {
      show(catRow); show(itemSel);
      buildConceptGrid();
      showConceptInfo();
    } else if (mode === 'practice') {
      show(pracPanel); show(pracBar);
      if (!pProblem) nextPractice();
    } else if (mode === 'quiz') {
      show(quizPanel); show(quizBar);
      if (quizQs.length === 0) startQuiz();
      else renderQuizQuestion();
    }

    draw();
  }

  /* ================================================================
     SIMULATE — CONTROLS
     ================================================================ */

  /* Cam type pills */
  $$('#cam-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      camType = p.dataset.cam;
      $$('#cam-tabs .pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.cam === camType); });
      $$('.preset-btn').forEach(function (pb) { pb.classList.remove('active'); });
    });
  });

  /* Follower type pills */
  $$('#follower-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      followerType = p.dataset.follower;
      $$('#follower-tabs .pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.follower === followerType); });
    });
  });

  /* Sliders */
  var radiusSlider = $('#radius-slider');
  var liftSlider = $('#lift-slider');
  var rpmSlider = $('#rpm-slider');

  radiusSlider.addEventListener('input', function () {
    baseRadius = +this.value;
    syncSliderLabels();
  });
  liftSlider.addEventListener('input', function () {
    lift = +this.value;
    syncSliderLabels();
  });
  rpmSlider.addEventListener('input', function () {
    rpm = +this.value;
    syncSliderLabels();
  });

  /* Play / Pause */
  $('#btn-play').addEventListener('click', function () {
    playing = !playing;
    this.textContent = playing ? 'Pause' : 'Play';
  });

  /* Reset angle */
  $('#btn-reset').addEventListener('click', function () {
    camAngle = 0;
    lastTime = 0;
  });

  /* Presets */
  var PRESETS = {
    'engine-valve': { cam: 'shm', r: 25, h: 10, rpm: 60, follower: 'roller' },
    'printing-press': { cam: 'cycloidal', r: 40, h: 25, rpm: 45, follower: 'flat' },
    'textile-loom': { cam: 'uniform-acc', r: 35, h: 30, rpm: 30, follower: 'flat' },
    'packaging': { cam: 'cycloidal', r: 30, h: 20, rpm: 80, follower: 'roller' }
  };

  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = PRESETS[btn.dataset.preset];
      if (!p) return;

      camType = p.cam;
      baseRadius = p.r;
      lift = p.h;
      rpm = p.rpm;
      followerType = p.follower;

      /* Update UI */
      radiusSlider.value = baseRadius;
      liftSlider.value = lift;
      rpmSlider.value = rpm;
      syncSliderLabels();
  
      $('#rpm-val').textContent = rpm + ' rpm';

      $$('#cam-tabs .pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.cam === camType); });
      $$('#follower-tabs .pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.follower === followerType); });
      $$('.preset-btn').forEach(function (pb) { pb.classList.toggle('active', pb === btn); });
    });
  });

  /* ================================================================
     EXPLORE MODE
     ================================================================ */

  /* Category pills */
  $$('#cat-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      selCat = p.dataset.cat;
      $$('#cat-tabs .pill').forEach(function (pp) { pp.classList.toggle('active', pp.dataset.cat === selCat); });
      buildConceptGrid();
      selConcept = 0;
      showConceptInfo();
      draw();
    });
  });

  function getConceptsForCat() {
    return CONCEPTS.filter(function (c) { return c.cat === selCat; });
  }

  function getSelectedConcept() {
    var list = getConceptsForCat();
    return list[selConcept] || list[0];
  }

  function buildConceptGrid() {
    var grid = $('#concept-grid');
    grid.innerHTML = '';
    var list = getConceptsForCat();
    list.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (i === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selConcept = i;
        $$('#concept-grid .is-btn').forEach(function (b, bi) { b.classList.toggle('active', bi === i); });
        showConceptInfo();
        draw();
      });
      grid.appendChild(btn);
    });
    show($('#item-selector'));
  }

  function showConceptInfo() {
    var c = getSelectedConcept();
    if (!c) { hide($('#item-info')); return; }

    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span>' +
      '<span class="ii-cat-badge">' + c.cat + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span>' +
      '<span class="fb-unit">' + c.unit + '</span></div>';

    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>' +
        '<p class="ex-problem">' + c.example.problem + '</p>';
      c.example.steps.forEach(function (s) {
        html += '<p class="ex-step">' + s + '</p>';
      });
      html += '<p class="ex-step"><strong>Answer: ' + c.example.answer + ' ' + c.example.unit + '</strong></p></div>';
    }

    var infoEl = $('#item-info');
    infoEl.innerHTML = html;
    show(infoEl);
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function nextPractice() {
    pAnswered = false;
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    pProblem = gen();
    $('#pp-prompt').textContent = pProblem.prompt;
    $('#pp-unit').textContent = pProblem.unit;
    $('#pp-input').value = '';
    $('#pp-feedback').textContent = '';
    $('#pp-feedback').className = 'feedback';
    hide($('#pp-solution'));
    hide($('#pp-next'));
    show($('#pp-check'));
    $('#pp-input').focus();
  }

  $('#pp-check').addEventListener('click', function () {
    if (pAnswered || !pProblem) return;
    var userVal = parseFloat($('#pp-input').value);
    if (isNaN(userVal)) { $('#pp-feedback').textContent = 'Enter a number'; $('#pp-feedback').className = 'feedback err'; return; }

    pAnswered = true;
    pTotal++;
    var correct = Math.abs(userVal - pProblem.answer) <= Math.max(0.1, Math.abs(pProblem.answer) * 0.02);
    if (correct) {
      pScore++;
      $('#pp-feedback').textContent = 'Correct!';
      $('#pp-feedback').className = 'feedback ok';
    } else {
      $('#pp-feedback').textContent = 'Incorrect \u2014 answer is ' + pProblem.answer + ' ' + pProblem.unit;
      $('#pp-feedback').className = 'feedback err';
    }

    /* Show solution */
    var solHtml = '<h4>Solution</h4>';
    pProblem.steps.forEach(function (s) {
      solHtml += '<p class="sol-step">' + s + '</p>';
    });
    $('#pp-solution').innerHTML = solHtml;
    show($('#pp-solution'));
    show($('#pp-next'));

    $('#pbar-score-val').textContent = pScore + ' / ' + pTotal;
  });

  $('#pp-next').addEventListener('click', function () { nextPractice(); });

  /* Enter key submits */
  $('#pp-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (pAnswered) nextPractice();
      else $('#pp-check').click();
    }
  });

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  function startQuiz() {
    var pool = shuffleArr(QUIZ_POOL);
    quizQs = pool.slice(0, 5);
    quizIdx = 0; quizScore = 0; quizAnswered = false;
    hide($('#quiz-result'));
    show($('#quiz-panel')); show($('#quiz-bar'));
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = quizQs[quizIdx];
    quizAnswered = false;
    $('#qbar-num').textContent = quizIdx + 1;

    var html = '<p class="qp-prompt">Q' + (quizIdx + 1) + '. ' + q.prompt + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      var shuffled = q.options.map(function (o, i) { return { text: o, idx: i }; });
      shuffled = shuffleArr(shuffled);
      shuffled.forEach(function (o) {
        html += '<button class="answer-btn" data-idx="' + o.idx + '">' + o.text + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">' +
        '<input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer">' +
        '<span class="qi-unit">' + q.unit + '</span>' +
        '<button class="btn btn-primary" id="qi-check">Check</button></div>' +
        '<p class="quiz-feedback" id="qi-feedback"></p>';
    }

    $('#quiz-panel').innerHTML = html;

    if (q.type === 'mcq') {
      $$('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var chosen = +btn.dataset.idx;
          var correct = chosen === q.correct;
          if (correct) quizScore++;

          $$('.answer-btn').forEach(function (b) {
            b.classList.add('locked');
            if (+b.dataset.idx === q.correct) b.classList.add('correct');
            else if (b === btn && !correct) b.classList.add('wrong');
          });

          setTimeout(function () { advanceQuiz(); }, 1200);
        });
      });
    } else {
      var checkBtn = $('#qi-check');
      var inputEl = $('#qi-input');
      if (checkBtn) {
        checkBtn.addEventListener('click', function () { checkNumericQuiz(q); });
      }
      if (inputEl) {
        inputEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') checkNumericQuiz(q);
        });
        inputEl.focus();
      }
    }
  }

  function checkNumericQuiz(q) {
    if (quizAnswered) return;
    var inputEl = $('#qi-input');
    var fbEl = $('#qi-feedback');
    if (!inputEl || !fbEl) return;

    var userVal = parseFloat(inputEl.value);
    if (isNaN(userVal)) { fbEl.textContent = 'Enter a number'; fbEl.className = 'quiz-feedback err'; return; }

    quizAnswered = true;
    var correct = Math.abs(userVal - q.answer) <= Math.max(0.1, Math.abs(q.answer) * 0.02);
    if (correct) {
      quizScore++;
      fbEl.textContent = 'Correct!';
      fbEl.className = 'quiz-feedback ok';
    } else {
      fbEl.textContent = 'Incorrect \u2014 answer: ' + q.answer + ' ' + q.unit;
      fbEl.className = 'quiz-feedback err';
    }

    if (q.steps) {
      var stepsHtml = '';
      q.steps.forEach(function (s) { stepsHtml += '<p class="sol-step">' + s + '</p>'; });
      fbEl.innerHTML += '<div style="margin-top:8px;">' + stepsHtml + '</div>';
    }

    setTimeout(function () { advanceQuiz(); }, 2000);
  }

  function advanceQuiz() {
    quizIdx++;
    if (quizIdx >= quizQs.length) {
      showQuizResult();
    } else {
      renderQuizQuestion();
    }
  }

  function showQuizResult() {
    hide($('#quiz-panel')); hide($('#quiz-bar'));

    var pct = Math.round(quizScore / quizQs.length * 100);
    var cls = pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor';
    var stars = '';
    for (var i = 0; i < 5; i++) stars += (i < Math.round(quizScore / quizQs.length * 5)) ? '\u2605' : '\u2606';

    var verdict = pct === 100 ? 'Perfect score!' : pct >= 80 ? 'Excellent work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!';

    var html = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span>' +
      '<span class="qr-stars">' + stars + '</span></div>' +
      '<div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + pct + '%</span>' +
      '<div class="qr-verdict">' + verdict + '</div></div></div>' +
      '<div class="qr-rows">';

    quizQs.forEach(function (q, i) {
      var ok = false;
      if (q.type === 'mcq') {
        ok = true; /* Simplified — actual tracking would need per-question storage */
      }
      html += '<div class="qr-row ' + (i < quizScore ? 'ok' : 'err') + '">' +
        '<span class="qr-qnum">Q' + (i + 1) + '</span>' +
        '<span class="qr-detail">' + q.prompt.substring(0, 80) + (q.prompt.length > 80 ? '...' : '') + '</span>' +
        '<span class="qr-mark">' + (i < quizScore ? '\u2713' : '\u2717') + '</span></div>';
    });

    html += '</div><button class="btn btn-primary" id="quiz-retry" style="align-self:flex-start;margin-top:8px;">Retry Quiz</button>';

    var resultEl = $('#quiz-result');
    resultEl.innerHTML = html;
    show(resultEl);

    $('#quiz-retry').addEventListener('click', function () { startQuiz(); });
  }

  /* ================================================================
     MODE TABS
     ================================================================ */

  $$('#mode-tabs .pill').forEach(function (p) {
    p.addEventListener('click', function () {
      setMode(p.dataset.mode);
    });
  });

  /* ================================================================
     CANVAS INTERACTION — Pointer events for cam angle control
     ================================================================ */

  var dragging = false;

  cvs.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    dragging = true;
    playing = false;
    $('#btn-play').textContent = 'Play';
    updateCamAngleFromPointer(e);
  });

  cvs.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    updateCamAngleFromPointer(e);
  });

  cvs.addEventListener('pointerup', function () { dragging = false; });
  cvs.addEventListener('pointerleave', function () { dragging = false; });

  function updateCamAngleFromPointer(e) {
    var rect = cvs.getBoundingClientRect();
    var scaleX = W / rect.width;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleX;

    /* Only respond if click is near the cam area */
    var dx = mx - CAM_CX;
    var dy = my - CAM_CY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200) {
      var angle = Math.atan2(dy, dx) + Math.PI / 2;
      camAngle = ((angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    }
  }

  /* ================================================================
     INIT
     ================================================================ */

  setMode('simulate');
  animId = requestAnimationFrame(animate);

})();
