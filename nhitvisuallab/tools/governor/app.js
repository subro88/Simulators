(function () {
  'use strict';

  /* ================================================================
     DATA — EXPLORE CONCEPTS (12 in 3 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Governor Types (4) ─────────────────────────────────────── */
    {
      id: 'watt-governor',
      name: 'Watt Governor',
      symbol: 'h = g/\u03C9\u00B2',
      formula: 'h = g/\u03C9\u00B2 = 895/N\u00B2 (m)',
      unit: 'm',
      cat: 'types',
      desc: 'The Watt governor is the simplest centrifugal governor, consisting of two flyballs attached by arms to a rotating spindle. As the spindle speed increases, centrifugal force pushes the balls outward and upward, reducing the cone height h. The relationship h = g/\u03C9\u00B2 shows that height depends only on angular velocity, not on ball mass. This makes the Watt governor unsuitable for high speeds where h becomes negligibly small. Invented by James Watt for steam engine speed regulation, it is the foundation for all centrifugal governor designs.',
      example: {
        problem: 'A Watt governor runs at N = 100 RPM. Find the height h of the governor.',
        steps: ['h = 895/N\u00B2', 'h = 895/100\u00B2', 'h = 895/10000', 'h = 0.0895 m = 89.5 mm'],
        answer: 0.0895, unit: 'm'
      }
    },
    {
      id: 'porter-governor',
      name: 'Porter Governor',
      symbol: 'h = g(m+M)/(m\u03C9\u00B2)',
      formula: 'h = g(m + M(1+f)) / (m\u03C9\u00B2)',
      unit: 'm',
      cat: 'types',
      desc: 'The Porter governor adds a central dead weight (mass M) on the sleeve to increase the range of speed regulation. The added weight means higher centrifugal force is needed to lift the sleeve, making the governor effective at higher speeds where the Watt governor fails. The height equation h = g(m + M(1+f))/(m\u03C9\u00B2) includes friction factor f. Porter governors provide better sensitivity and wider operating range compared to Watt governors. They are widely used in medium-speed engines.',
      example: {
        problem: 'Porter governor: m = 3 kg, M = 15 kg, N = 200 RPM. Find h (neglect friction).',
        steps: ['\u03C9 = 2\u03C0\u00D7200/60 = 20.944 rad/s', 'h = g(m+M)/(m\u03C9\u00B2)', 'h = 9.81\u00D7(3+15)/(3\u00D720.944\u00B2)', 'h = 176.58/1315.9 = 0.1342 m'],
        answer: 0.1342, unit: 'm'
      }
    },
    {
      id: 'proell-governor',
      name: 'Proell Governor',
      symbol: 'Extended arm design',
      formula: 'Fc = m\u03C9\u00B2r, with arm extension factor',
      unit: 'N',
      cat: 'types',
      desc: 'The Proell governor is a modification of the Porter governor where the flyballs are attached to extensions of the lower arms rather than at the pivot joints. This extension amplifies the sleeve movement for a given change in ball position, providing greater sensitivity. The mechanical advantage of the arm extension means that small speed changes produce larger sleeve movements, improving the governor response. Proell governors are used where sensitive speed control is required with relatively heavy sleeve loads.',
      example: {
        problem: 'Proell governor: m = 4 kg, arm L = 0.3 m, extension e = 0.1 m, N = 150 RPM. Find Fc.',
        steps: ['\u03C9 = 2\u03C0\u00D7150/60 = 15.708 rad/s', 'r = L\u00D7sin\u03B8 (assume \u03B8 = 30\u00B0) = 0.15 m', 'Fc = m\u03C9\u00B2r', 'Fc = 4\u00D715.708\u00B2\u00D70.15 = 148.0 N'],
        answer: 148.0, unit: 'N'
      }
    },
    {
      id: 'hartnell-governor',
      name: 'Hartnell Governor',
      symbol: 'Spring-loaded type',
      formula: 'Fc = m\u03C9\u00B2r, F_spring = k\u00D7x',
      unit: 'N',
      cat: 'types',
      desc: 'The Hartnell governor is a spring-loaded governor using bell crank levers instead of pendulum arms. The flyballs are mounted on horizontal arms of bell cranks, while the vertical arms connect to a sleeve compressed by a central spring. The spring stiffness determines the controlling force characteristic. Spring-loaded governors are compact, can operate at any angle (not just vertical), and are suitable for high-speed engines. The spring can be designed to give isochronous or stable governor characteristics.',
      example: {
        problem: 'Hartnell governor: m = 2 kg, r = 0.12 m, N = 300 RPM. Find centrifugal force.',
        steps: ['\u03C9 = 2\u03C0\u00D7300/60 = 31.416 rad/s', 'Fc = m\u03C9\u00B2r', 'Fc = 2\u00D731.416\u00B2\u00D70.12', 'Fc = 2\u00D7987.0\u00D70.12 = 236.9 N'],
        answer: 236.9, unit: 'N'
      }
    },

    /* ── Characteristics (4) ─────────────────────────────────────── */
    {
      id: 'height-speed',
      name: 'Height & Speed',
      symbol: 'h = 895/N\u00B2',
      formula: 'h = g/\u03C9\u00B2 = g/(2\u03C0N/60)\u00B2 = 895/N\u00B2',
      unit: 'm',
      cat: 'characteristics',
      desc: 'The height of a governor cone is inversely proportional to the square of the rotational speed. For a Watt governor, h = g/\u03C9\u00B2. At low speeds, the height is large and the balls hang low. As speed increases, centrifugal force pushes balls outward, reducing height. The h-N curve is a hyperbola. For Porter and Proell governors, the dead weight increases the effective height for the same speed. This relationship is fundamental to understanding how governors self-regulate.',
      example: {
        problem: 'At what speed does a Watt governor have height h = 0.25 m?',
        steps: ['h = 895/N\u00B2', '0.25 = 895/N\u00B2', 'N\u00B2 = 895/0.25 = 3580', 'N = \u221A3580 = 59.83 RPM'],
        answer: 59.83, unit: 'RPM'
      }
    },
    {
      id: 'controlling-force',
      name: 'Controlling Force',
      symbol: 'F = m\u03C9\u00B2r',
      formula: 'Fc = m\u03C9\u00B2r = m(2\u03C0N/60)\u00B2r',
      unit: 'N',
      cat: 'characteristics',
      desc: 'The controlling force is the centrifugal force acting on each flyball, given by Fc = m\u03C9\u00B2r. The F-r diagram (controlling force vs radius) reveals governor stability. If the F-r curve is a straight line through the origin, the governor is isochronous. If the curve intersects above the origin (positive intercept), it is stable. If below the origin (negative intercept), it is unstable. For spring-loaded governors, the F-r line slope equals the spring stiffness times the lever ratio squared.',
      example: {
        problem: 'Ball mass m = 5 kg, N = 180 RPM, radius r = 0.2 m. Find Fc.',
        steps: ['\u03C9 = 2\u03C0\u00D7180/60 = 18.85 rad/s', 'Fc = m\u03C9\u00B2r', 'Fc = 5\u00D718.85\u00B2\u00D70.2', 'Fc = 5\u00D7355.3\u00D70.2 = 355.3 N'],
        answer: 355.3, unit: 'N'
      }
    },
    {
      id: 'sensitivity',
      name: 'Sensitivity',
      symbol: 's = (N2-N1)/N',
      formula: 's = (N2 \u2212 N1) / N = 2(N2\u2212N1)/(N1+N2)',
      unit: '\u2014',
      cat: 'characteristics',
      desc: 'Sensitivity measures how responsive a governor is to speed changes. It is defined as s = (N2 - N1)/N, where N1 is the minimum speed, N2 is the maximum speed, and N is the mean speed. A highly sensitive governor responds to small speed variations. Isochronous governors have s = 0 (single equilibrium speed). In practice, some range is desirable to avoid hunting. Sensitivity depends on governor type, mass distribution, and friction. A good governor balances sensitivity with stability.',
      example: {
        problem: 'Governor: N1 = 190 RPM, N2 = 210 RPM. Find sensitivity.',
        steps: ['N = (N1+N2)/2 = (190+210)/2 = 200 RPM', 's = (N2\u2212N1)/N', 's = (210\u2212190)/200', 's = 20/200 = 0.10'],
        answer: 0.10, unit: ''
      }
    },
    {
      id: 'stability-isochronism',
      name: 'Stability & Isochronism',
      symbol: 'dF/dr > 0',
      formula: 'Stable: dF/dr > \u03C9\u00B2m; Isochronous: dF/dr = \u03C9\u00B2m',
      unit: '\u2014',
      cat: 'characteristics',
      desc: 'A governor is stable if for every equilibrium speed, there is a unique radius. On the F-r diagram, stability requires dF/dr > \u03C9\u00B2m (the slope of the controlling force curve exceeds the slope of the centrifugal force line). Isochronism occurs when all equilibrium positions correspond to the same speed \u2014 dF/dr = \u03C9\u00B2m. While isochronism sounds ideal, it makes the governor prone to hunting (oscillating between extremes). Practical governors are designed to be slightly stable rather than isochronous.',
      example: {
        problem: 'Governor: Fc1 = 200 N at r1 = 0.12 m, Fc2 = 350 N at r2 = 0.18 m. Is it stable?',
        steps: ['dF/dr = (350\u2212200)/(0.18\u22120.12)', 'dF/dr = 150/0.06 = 2500 N/m', 'F-r line has positive slope through positive intercept', 'Governor is STABLE (dF/dr > 0, intercept > 0)'],
        answer: 2500, unit: 'N/m'
      }
    },

    /* ── Design (4) ──────────────────────────────────────────────── */
    {
      id: 'effort-power',
      name: 'Effort & Power',
      symbol: 'E = c\u00B7(m+M)g',
      formula: 'Effort E = c(m+M)g; Power P = E\u00D7lift',
      unit: 'N',
      cat: 'design',
      desc: 'The effort of a governor is the mean force exerted on the sleeve for a given fractional change in speed c (e.g., c = 0.01 for 1% speed change). For a Porter governor, Effort = c\u00D7(m+M)\u00D7g. Power is the work done by the governor = Effort \u00D7 sleeve lift. Higher effort means the governor can overcome greater friction and valve resistance. Governor power determines whether the governor can actually move the fuel control mechanism effectively.',
      example: {
        problem: 'Porter governor: m = 4 kg, M = 20 kg, 2% speed change. Find effort.',
        steps: ['c = 2% = 0.02', 'E = c(m+M)g', 'E = 0.02\u00D7(4+20)\u00D79.81', 'E = 0.02\u00D7235.44 = 4.71 N'],
        answer: 4.71, unit: 'N'
      }
    },
    {
      id: 'hunting',
      name: 'Hunting',
      symbol: 'Speed oscillation',
      formula: 'Hunting = continuous fluctuation above/below mean speed',
      unit: '\u2014',
      cat: 'design',
      desc: 'Hunting is the continuous fluctuation of engine speed above and below the mean speed. It occurs when the governor is too sensitive (nearly isochronous) and the corrective action overshoots. The sleeve moves up (reducing fuel), speed drops, sleeve moves down (increasing fuel), speed rises, creating an oscillating cycle. Hunting is prevented by: (1) providing adequate friction, (2) using a dashpot damper, (3) making the governor slightly less sensitive. Excessive hunting causes wear, noise, and poor engine performance.',
      example: {
        problem: 'Governor oscillates between 195 RPM and 205 RPM at mean speed 200 RPM. Amplitude?',
        steps: ['Speed range = N2 \u2212 N1 = 205 \u2212 195 = 10 RPM', 'Amplitude = range/2 = 5 RPM', 'As % of mean: 5/200 = 2.5%', 'Hunting amplitude = 5 RPM (2.5%)'],
        answer: 5, unit: 'RPM'
      }
    },
    {
      id: 'governor-friction',
      name: 'Governor Friction',
      symbol: 'f = F/(Mg)',
      formula: 'Friction force F on sleeve; f = F/(Mg)',
      unit: '\u2014',
      cat: 'design',
      desc: 'Friction at the sleeve and pivot joints affects governor performance by creating a dead band \u2014 a range of speeds over which the governor does not respond. When speed increases, the sleeve must overcome friction to move up; when speed decreases, it must overcome friction to move down. This increases the speed range (N2\u2212N1) and reduces sensitivity. The friction coefficient f = F/(Mg) where F is friction force and M is sleeve mass. Reducing friction improves sensitivity but may increase hunting tendency.',
      example: {
        problem: 'Sleeve mass M = 15 kg, friction force F = 14.7 N. Find friction coefficient f.',
        steps: ['f = F/(Mg)', 'f = 14.7/(15\u00D79.81)', 'f = 14.7/147.15', 'f = 0.10'],
        answer: 0.10, unit: ''
      }
    },
    {
      id: 'spring-design',
      name: 'Spring Design (Hartnell)',
      symbol: 'k = \u0394F/\u0394x',
      formula: 'k = (Fc2\u00D7a2 \u2212 Fc1\u00D7a1) / (b\u00D7(r2\u2212r1)\u00D7b/a)',
      unit: 'N/m',
      cat: 'design',
      desc: 'In a Hartnell governor, the spring stiffness k determines the speed range and sensitivity. The bell crank lever has arms of length a (ball arm) and b (sleeve arm). At minimum speed N1, the ball is at radius r1 with centrifugal force Fc1. At maximum speed N2, radius is r2 with force Fc2. The spring must provide the restoring force through the lever mechanism. Spring stiffness k = 2(Fc2\u2212Fc1)\u00D7(a/b)/(sleeve lift). The spring initial compression and stiffness together determine the governor characteristic curve.',
      example: {
        problem: 'Hartnell: Fc1 = 200 N, Fc2 = 350 N, a = 0.1 m, b = 0.08 m, sleeve lift = 0.02 m. Find k.',
        steps: ['Spring force change = 2(Fc2\u2212Fc1)\u00D7a/b', '\u0394Fs = 2\u00D7150\u00D7(0.1/0.08) = 375 N', 'k = \u0394Fs / sleeve_lift', 'k = 375/0.02 = 18750 N/m'],
        answer: 18750, unit: 'N/m'
      }
    }
  ];

  /* ================================================================
     DATA — PRACTICE GENERATORS (12)
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 — Height of Watt governor */
    function () {
      var N = randInt(60, 200);
      var h = +(895 / (N * N)).toFixed(4);
      return {
        prompt: 'A Watt governor runs at N = ' + N + ' RPM. Calculate the height h of the governor in metres.',
        steps: [
          'h = 895/N\u00B2',
          'h = 895/' + N + '\u00B2',
          'h = 895/' + (N * N),
          'h = ' + h + ' m'
        ],
        answer: h, unit: 'm', tol: 0.001
      };
    },
    /* 1 — Porter governor speed range */
    function () {
      var m = +(1 + Math.random() * 8).toFixed(1);
      var M = +(5 + Math.random() * 30).toFixed(1);
      var h = +(0.05 + Math.random() * 0.3).toFixed(3);
      var w2 = 9.81 * (m + M) / (m * h);
      var w = Math.sqrt(w2);
      var N = +(w * 60 / (2 * Math.PI)).toFixed(1);
      return {
        prompt: 'Porter governor: m = ' + m + ' kg, M = ' + M + ' kg, height h = ' + h + ' m. Find equilibrium speed N in RPM (neglect friction).',
        steps: [
          '\u03C9\u00B2 = g(m+M)/(mh)',
          '\u03C9\u00B2 = 9.81\u00D7(' + m + '+' + M + ')/(' + m + '\u00D7' + h + ')',
          '\u03C9 = ' + w.toFixed(3) + ' rad/s',
          'N = 60\u03C9/(2\u03C0) = ' + N + ' RPM'
        ],
        answer: +N, unit: 'RPM', tol: 1
      };
    },
    /* 2 — Centrifugal force */
    function () {
      var m = +(1 + Math.random() * 8).toFixed(1);
      var N = randInt(80, 400);
      var r = +(0.05 + Math.random() * 0.3).toFixed(3);
      var w = 2 * Math.PI * N / 60;
      var Fc = +(m * w * w * r).toFixed(1);
      return {
        prompt: 'Ball mass m = ' + m + ' kg, speed N = ' + N + ' RPM, radius r = ' + r + ' m. Calculate centrifugal force Fc in N.',
        steps: [
          '\u03C9 = 2\u03C0N/60 = 2\u03C0\u00D7' + N + '/60 = ' + w.toFixed(3) + ' rad/s',
          'Fc = m\u03C9\u00B2r',
          'Fc = ' + m + '\u00D7' + w.toFixed(3) + '\u00B2\u00D7' + r,
          'Fc = ' + Fc + ' N'
        ],
        answer: +Fc, unit: 'N', tol: 2
      };
    },
    /* 3 — Sleeve lift */
    function () {
      var L = +(0.15 + Math.random() * 0.35).toFixed(3);
      var theta1 = +(15 + Math.random() * 25).toFixed(1);
      var theta2 = +(theta1 + 5 + Math.random() * 20).toFixed(1);
      var th1Rad = theta1 * Math.PI / 180;
      var th2Rad = theta2 * Math.PI / 180;
      var h1 = L * Math.cos(th1Rad);
      var h2 = L * Math.cos(th2Rad);
      var lift = +((h1 - h2) * 2).toFixed(4);
      return {
        prompt: 'Governor arm length L = ' + L + ' m. Arm angle changes from \u03B81 = ' + theta1 + '\u00B0 to \u03B82 = ' + theta2 + '\u00B0. Find sleeve lift in m (equal upper and lower arms).',
        steps: [
          'h1 = L\u00B7cos\u03B81 = ' + L + '\u00D7cos(' + theta1 + '\u00B0) = ' + h1.toFixed(4) + ' m',
          'h2 = L\u00B7cos\u03B82 = ' + L + '\u00D7cos(' + theta2 + '\u00B0) = ' + h2.toFixed(4) + ' m',
          'Sleeve lift = 2(h1 \u2212 h2) for equal arms',
          'Lift = 2\u00D7(' + h1.toFixed(4) + ' \u2212 ' + h2.toFixed(4) + ') = ' + lift + ' m'
        ],
        answer: +lift, unit: 'm', tol: 0.002
      };
    },
    /* 4 — Sensitivity calculation */
    function () {
      var N1 = randInt(150, 250);
      var N2 = N1 + randInt(10, 40);
      var Nm = (N1 + N2) / 2;
      var s = +((N2 - N1) / Nm).toFixed(4);
      return {
        prompt: 'Governor speed range: N1 = ' + N1 + ' RPM, N2 = ' + N2 + ' RPM. Calculate the sensitivity s.',
        steps: [
          'N (mean) = (N1+N2)/2 = (' + N1 + '+' + N2 + ')/2 = ' + Nm + ' RPM',
          's = (N2\u2212N1)/N',
          's = (' + N2 + '\u2212' + N1 + ')/' + Nm,
          's = ' + (N2 - N1) + '/' + Nm + ' = ' + s
        ],
        answer: +s, unit: '', tol: 0.005
      };
    },
    /* 5 — Effort of governor */
    function () {
      var m = +(2 + Math.random() * 6).toFixed(1);
      var M = +(10 + Math.random() * 30).toFixed(1);
      var cPercent = randInt(1, 5);
      var c = cPercent / 100;
      var E = +(c * (m + M) * 9.81).toFixed(2);
      return {
        prompt: 'Porter governor: m = ' + m + ' kg, M = ' + M + ' kg, speed change = ' + cPercent + '%. Calculate effort E in N.',
        steps: [
          'c = ' + cPercent + '% = ' + c,
          'E = c\u00D7(m+M)\u00D7g',
          'E = ' + c + '\u00D7(' + m + '+' + M + ')\u00D79.81',
          'E = ' + E + ' N'
        ],
        answer: +E, unit: 'N', tol: 0.1
      };
    },
    /* 6 — Power of governor */
    function () {
      var m = +(2 + Math.random() * 6).toFixed(1);
      var M = +(10 + Math.random() * 30).toFixed(1);
      var cPercent = randInt(1, 5);
      var c = cPercent / 100;
      var lift = +(0.01 + Math.random() * 0.04).toFixed(3);
      var E = c * (m + M) * 9.81;
      var P = +(E * lift).toFixed(4);
      return {
        prompt: 'Porter governor: m = ' + m + ' kg, M = ' + M + ' kg, speed change = ' + cPercent + '%, sleeve lift = ' + lift + ' m. Find power in W (J).',
        steps: [
          'Effort E = c(m+M)g = ' + c + '\u00D7' + (m + M).toFixed(1) + '\u00D79.81 = ' + E.toFixed(3) + ' N',
          'Power = E \u00D7 lift',
          'P = ' + E.toFixed(3) + ' \u00D7 ' + lift,
          'P = ' + P + ' J'
        ],
        answer: +P, unit: 'J', tol: 0.005
      };
    },
    /* 7 — Spring stiffness (Hartnell) */
    function () {
      var m = +(1 + Math.random() * 5).toFixed(1);
      var N1 = randInt(200, 300);
      var N2 = N1 + randInt(20, 60);
      var r1 = +(0.08 + Math.random() * 0.06).toFixed(3);
      var r2 = +(r1 + 0.02 + Math.random() * 0.04).toFixed(3);
      var a = +(0.08 + Math.random() * 0.06).toFixed(3);
      var b = +(0.05 + Math.random() * 0.05).toFixed(3);
      var w1 = 2 * Math.PI * N1 / 60;
      var w2 = 2 * Math.PI * N2 / 60;
      var Fc1 = m * w1 * w1 * r1;
      var Fc2 = m * w2 * w2 * r2;
      var lift = (r2 - r1) * b / a;
      var dFs = 2 * (Fc2 - Fc1) * a / b;
      var k = +(dFs / lift).toFixed(0);
      return {
        prompt: 'Hartnell governor: m = ' + m + ' kg, N1 = ' + N1 + ' RPM (r1 = ' + r1 + ' m), N2 = ' + N2 + ' RPM (r2 = ' + r2 + ' m), bell crank a = ' + a + ' m, b = ' + b + ' m. Find spring stiffness k in N/m.',
        steps: [
          'Fc1 = m\u03C91\u00B2r1 = ' + Fc1.toFixed(1) + ' N; Fc2 = m\u03C92\u00B2r2 = ' + Fc2.toFixed(1) + ' N',
          '\u0394Fs = 2(Fc2\u2212Fc1)\u00D7a/b = ' + dFs.toFixed(1) + ' N',
          'Sleeve lift = (r2\u2212r1)\u00D7b/a = ' + lift.toFixed(4) + ' m',
          'k = \u0394Fs/lift = ' + k + ' N/m'
        ],
        answer: +k, unit: 'N/m', tol: 100
      };
    },
    /* 8 — Controlling force */
    function () {
      var m = +(2 + Math.random() * 6).toFixed(1);
      var N = randInt(100, 350);
      var r = +(0.08 + Math.random() * 0.2).toFixed(3);
      var w = 2 * Math.PI * N / 60;
      var Fc = +(m * w * w * r).toFixed(1);
      return {
        prompt: 'Governor ball mass m = ' + m + ' kg rotates at N = ' + N + ' RPM with radius r = ' + r + ' m. Find the controlling force Fc in N.',
        steps: [
          '\u03C9 = 2\u03C0\u00D7' + N + '/60 = ' + w.toFixed(3) + ' rad/s',
          'Fc = m\u03C9\u00B2r',
          'Fc = ' + m + '\u00D7' + (w * w).toFixed(2) + '\u00D7' + r,
          'Fc = ' + Fc + ' N'
        ],
        answer: +Fc, unit: 'N', tol: 2
      };
    },
    /* 9 — Radius at given speed */
    function () {
      var L = +(0.15 + Math.random() * 0.35).toFixed(3);
      var N = randInt(80, 250);
      var w = 2 * Math.PI * N / 60;
      var h = 9.81 / (w * w);
      var rCalc = Math.sqrt(L * L - h * h);
      if (isNaN(rCalc) || rCalc < 0.01) {
        h = L * 0.7;
        rCalc = Math.sqrt(L * L - h * h);
      }
      var r = +rCalc.toFixed(4);
      return {
        prompt: 'Watt governor: arm length L = ' + L + ' m, speed N = ' + N + ' RPM. Find the radius of rotation r in m.',
        steps: [
          '\u03C9 = 2\u03C0\u00D7' + N + '/60 = ' + w.toFixed(3) + ' rad/s',
          'h = g/\u03C9\u00B2 = ' + h.toFixed(4) + ' m',
          'r = \u221A(L\u00B2 \u2212 h\u00B2)',
          'r = \u221A(' + (L * L).toFixed(4) + ' \u2212 ' + (h * h).toFixed(4) + ') = ' + r + ' m'
        ],
        answer: +r, unit: 'm', tol: 0.005
      };
    },
    /* 10 — Equilibrium speed */
    function () {
      var m = +(2 + Math.random() * 6).toFixed(1);
      var M = +(5 + Math.random() * 25).toFixed(1);
      var r = +(0.1 + Math.random() * 0.15).toFixed(3);
      var L = +(r / Math.sin(35 * Math.PI / 180) + 0.02).toFixed(3);
      var theta = Math.asin(r / L);
      var h = L * Math.cos(theta);
      var w2 = 9.81 * (m + M) / (m * h);
      var N = +(Math.sqrt(w2) * 60 / (2 * Math.PI)).toFixed(1);
      return {
        prompt: 'Porter governor: m = ' + m + ' kg, M = ' + M + ' kg, radius r = ' + r + ' m, arm L = ' + L + ' m. Find equilibrium speed N in RPM.',
        steps: [
          'sin\u03B8 = r/L = ' + r + '/' + L + ' = ' + (r / L).toFixed(4),
          'h = L\u00B7cos\u03B8 = ' + h.toFixed(4) + ' m',
          '\u03C9\u00B2 = g(m+M)/(mh) = ' + w2.toFixed(2),
          'N = 60\u03C9/(2\u03C0) = ' + N + ' RPM'
        ],
        answer: +N, unit: 'RPM', tol: 1
      };
    },
    /* 11 — Friction effect on speed range */
    function () {
      var m = +(2 + Math.random() * 6).toFixed(1);
      var M = +(10 + Math.random() * 25).toFixed(1);
      var h = +(0.08 + Math.random() * 0.15).toFixed(3);
      var fForce = +(5 + Math.random() * 20).toFixed(1);
      var w2_up = 9.81 * (m + M + fForce / 9.81) / (m * h);
      var w2_dn = 9.81 * (m + M - fForce / 9.81) / (m * h);
      var N_up = Math.sqrt(w2_up) * 60 / (2 * Math.PI);
      var N_dn = Math.sqrt(w2_dn) * 60 / (2 * Math.PI);
      var range = +(N_up - N_dn).toFixed(1);
      return {
        prompt: 'Porter governor: m = ' + m + ' kg, M = ' + M + ' kg, h = ' + h + ' m, friction force = ' + fForce + ' N. Find the speed range (N_up \u2212 N_down) in RPM.',
        steps: [
          'For upward motion: \u03C9\u00B2 = g(m+M+F/g)/(mh) = ' + w2_up.toFixed(2),
          'N_up = ' + N_up.toFixed(1) + ' RPM',
          'For downward motion: \u03C9\u00B2 = g(m+M\u2212F/g)/(mh) = ' + w2_dn.toFixed(2),
          'N_down = ' + N_dn.toFixed(1) + ' RPM; Range = ' + range + ' RPM'
        ],
        answer: +range, unit: 'RPM', tol: 1
      };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL (15: 10 MCQ + 5 numeric)
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    {
      q: 'Which governor type uses a dead weight on the sleeve?',
      opts: ['Watt', 'Porter', 'Hartnell', 'Wilson-Hartnell'],
      ans: 1
    },
    {
      q: 'The height of a Watt governor is independent of:',
      opts: ['Angular velocity', 'Ball mass', 'Gravitational acceleration', 'Arm length'],
      ans: 1
    },
    {
      q: 'An isochronous governor has:',
      opts: ['Zero sensitivity', 'Infinite sensitivity', 'Maximum stability', 'Maximum friction'],
      ans: 1
    },
    {
      q: 'Hunting in a governor refers to:',
      opts: ['Sleeve sticking due to friction', 'Continuous speed fluctuation above and below mean', 'Governor arm breaking', 'Ball mass increasing'],
      ans: 1
    },
    {
      q: 'The Hartnell governor is classified as a:',
      opts: ['Dead weight governor', 'Pendulum governor', 'Spring-loaded governor', 'Inertia governor'],
      ans: 2
    },
    {
      q: 'For a stable governor, the controlling force curve F-r must:',
      opts: ['Pass through the origin', 'Have a positive intercept on F-axis', 'Have a negative slope', 'Be horizontal'],
      ans: 1
    },
    {
      q: 'Governor sensitivity increases when:',
      opts: ['Speed range increases', 'Speed range decreases', 'Friction increases', 'Ball mass decreases'],
      ans: 1
    },
    {
      q: 'The Proell governor differs from Porter by:',
      opts: ['Using springs instead of weights', 'Having balls on arm extensions', 'Having no sleeve', 'Using two spindles'],
      ans: 1
    },
    {
      q: 'Centrifugal force on a governor ball is proportional to:',
      opts: ['N', 'N\u00B2', 'N\u00B3', '1/N\u00B2'],
      ans: 1
    },
    {
      q: 'The effort of a governor is:',
      opts: ['Force needed to rotate the spindle', 'Mean force on sleeve for given speed change', 'Weight of the flyballs', 'Centrifugal force at max speed'],
      ans: 1
    },
    /* Numeric 10-14 */
    {
      q: 'Watt governor at N = 100 RPM. Height h (m) =',
      type: 'numeric', ans: 0.0895, tol: 0.002, unit: 'm'
    },
    {
      q: 'Ball mass m = 4 kg, N = 200 RPM, r = 0.15 m. Centrifugal force Fc (N) =',
      type: 'numeric', ans: 263.2, tol: 2, unit: 'N'
    },
    {
      q: 'Governor: N1 = 180 RPM, N2 = 220 RPM. Sensitivity s =',
      type: 'numeric', ans: 0.2, tol: 0.01, unit: ''
    },
    {
      q: 'Porter governor: m = 5 kg, M = 20 kg, 3% speed change. Effort E (N) =',
      type: 'numeric', ans: 7.36, tol: 0.1, unit: 'N'
    },
    {
      q: 'Watt governor: arm L = 0.3 m, N = 80 RPM. Height h (m) =',
      type: 'numeric', ans: 0.1398, tol: 0.003, unit: 'm'
    }
  ];

  /* ================================================================
     DOM REFS
     ================================================================ */

  var cvs = document.getElementById('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;

  /* DPR-aware canvas setup */
  var DPR = Math.max(window.devicePixelRatio || 1, 1);
  cvs.width = W * DPR;
  cvs.height = H * DPR;
  cvs.style.maxWidth = W + 'px';
  ctx.scale(DPR, DPR);

  var modeTabs = document.getElementById('mode-tabs');
  var govTabs = document.getElementById('gov-tabs');
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

  var slRPM = document.getElementById('sl-rpm');
  var slMass = document.getElementById('sl-mass');
  var slArm = document.getElementById('sl-arm');
  var slSleeve = document.getElementById('sl-sleeve');
  var slSpring = document.getElementById('sl-spring');
  var valRPM = document.getElementById('val-rpm');
  var valMass = document.getElementById('val-mass');
  var valArm = document.getElementById('val-arm');
  var valSleeve = document.getElementById('val-sleeve');
  var valSpring = document.getElementById('val-spring');
  var grpSleeve = document.getElementById('grp-sleeve');
  var grpSpring = document.getElementById('grp-spring');

  /* ================================================================
     STATE
     ================================================================ */

  var mode = 'simulate';
  var govType = 'watt';
  var rpm = 120, ballMass = 3, armLen = 0.25;
  var sleeveMass = 10, springK = 2000;
  var animAngle = 0;
  var animRunning = true;
  var lastTimestamp = 0;
  var exploreCat = 'types', exploreItem = null;

  /* Practice state */
  var pCorrect = 0, pTotal = 0, currentProblem = null, pAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0;
  var quizAnswers = [], quizLocked = false;

  /* ================================================================
     HELPERS
     ================================================================ */

  function randInt(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
  }
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /* ================================================================
     PHYSICS — GOVERNOR CALCULATIONS
     ================================================================ */

  function getOmega() {
    return 2 * Math.PI * rpm / 60;
  }

  function getGovernorHeight() {
    var w = getOmega();
    if (w < 0.01) return 10;
    if (govType === 'watt') {
      return 9.81 / (w * w);
    }
    if (govType === 'porter' || govType === 'proell') {
      return 9.81 * (ballMass + sleeveMass) / (ballMass * w * w);
    }
    if (govType === 'hartnell') {
      /* For Hartnell, height concept is different; use equivalent */
      return 9.81 / (w * w);
    }
    return 9.81 / (w * w);
  }

  function getRadius() {
    var h = getGovernorHeight();
    var L = armLen;
    if (h >= L) return 0.01;
    var r = Math.sqrt(L * L - h * h);
    return Math.max(r, 0.01);
  }

  function getArmAngle() {
    var h = getGovernorHeight();
    var L = armLen;
    if (h >= L) return 5 * Math.PI / 180;
    var theta = Math.acos(clamp(h / L, 0, 1));
    return clamp(theta, 5 * Math.PI / 180, 80 * Math.PI / 180);
  }

  function getCentrifugalForce() {
    var w = getOmega();
    var r = getRadius();
    return ballMass * w * w * r;
  }

  function getSleeveLift() {
    /* Approximate sleeve lift relative to reference (low speed) */
    var refH = getRefHeight();
    var curH = getGovernorHeight();
    var lift = 2 * (refH - curH);
    return Math.max(lift, 0);
  }

  function getRefHeight() {
    /* Reference height at minimum speed (30 RPM) */
    var wMin = 2 * Math.PI * 30 / 60;
    if (govType === 'watt' || govType === 'hartnell') {
      return Math.min(9.81 / (wMin * wMin), armLen * 0.98);
    }
    return Math.min(9.81 * (ballMass + sleeveMass) / (ballMass * wMin * wMin), armLen * 0.98);
  }

  function getSensitivity() {
    /* Approximate sensitivity based on a 10% speed change around current RPM */
    var N1 = rpm * 0.95;
    var N2 = rpm * 1.05;
    var Nm = rpm;
    return (N2 - N1) / Nm;
  }

  function getControllingForce() {
    return getCentrifugalForce();
  }

  /* ================================================================
     READOUT UPDATES
     ================================================================ */

  function updateReadouts() {
    var h = getGovernorHeight();
    var r = getRadius();
    var Fc = getCentrifugalForce();
    var lift = getSleeveLift();
    var theta = getArmAngle() * 180 / Math.PI;
    var sens = getSensitivity();

    document.getElementById('r-height').textContent = h < 10 ? h.toFixed(4) : '\u221E';
    document.getElementById('r-lift').textContent = lift.toFixed(4);
    document.getElementById('r-fc').textContent = Fc.toFixed(1);
    document.getElementById('r-radius').textContent = r.toFixed(4);
    document.getElementById('r-angle').textContent = theta.toFixed(1);
    document.getElementById('r-sens').textContent = sens.toFixed(3);
  }

  /* ================================================================
     SLIDER SYNCHRONISATION
     ================================================================ */

  function syncSliders() {
    valRPM.textContent = slRPM.value + ' RPM';
    valMass.textContent = (+slMass.value).toFixed(1) + ' kg';
    valArm.textContent = (+slArm.value).toFixed(2) + ' m';
    valSleeve.textContent = (+slSleeve.value).toFixed(1) + ' kg';
    valSpring.textContent = slSpring.value + ' N/m';

    rpm = +slRPM.value;
    ballMass = +slMass.value;
    armLen = +slArm.value;
    sleeveMass = +slSleeve.value;
    springK = +slSpring.value;

    updateReadouts();
  }

  function showHideSliders() {
    var hasSleeve = govType === 'porter' || govType === 'proell';
    var hasSpring = govType === 'hartnell';

    grpSleeve.style.display = hasSleeve ? 'flex' : 'none';
    grpSpring.style.display = hasSpring ? 'flex' : 'none';
  }

  [slRPM, slMass, slArm, slSleeve, slSpring].forEach(function (sl) {
    sl.addEventListener('input', syncSliders);
  });

  /* ================================================================
     PRESETS
     ================================================================ */

  var PRESETS = {
    lowspeed:  { gov: 'porter', rpm: 80,  mass: 5,  arm: 0.35, sleeve: 20, spring: 2000 },
    highspeed: { gov: 'hartnell', rpm: 400, mass: 2, arm: 0.15, sleeve: 10, spring: 5000 },
    turbine:   { gov: 'hartnell', rpm: 500, mass: 1.5, arm: 0.12, sleeve: 8, spring: 8000 },
    diesel:    { gov: 'porter', rpm: 200, mass: 4, arm: 0.25, sleeve: 15, spring: 3000 }
  };

  function applyPreset(key) {
    var p = PRESETS[key];
    if (!p) return;

    /* Set governor type */
    govType = p.gov;
    var govPills = govTabs.querySelectorAll('.pill');
    govPills.forEach(function (pill) {
      pill.classList.toggle('active', pill.getAttribute('data-gov') === p.gov);
    });

    slRPM.value = p.rpm;
    slMass.value = p.mass;
    slArm.value = p.arm;
    slSleeve.value = p.sleeve;
    slSpring.value = p.spring;

    showHideSliders();
    syncSliders();

    /* Highlight active preset button */
    var presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-preset') === key);
    });
  }

  /* ================================================================
     DRAWING — LAYOUT CONSTANTS
     ================================================================ */

  var GOV_CX = 200;         /* Governor mechanism centre X */
  var GOV_TOP = 40;          /* Top of spindle */
  var GOV_BOT = 430;         /* Bottom of spindle */
  var GOV_PIVOT_Y = 70;      /* Pivot point Y (where arms attach) */
  var BALL_R = 14;            /* Ball display radius */
  var SPINDLE_W = 6;          /* Spindle width */

  /* Chart region (right side) */
  var CHART_L = 440;
  var CHART_R = 875;
  var CHART_T = 50;
  var CHART_B = 250;
  var CHART_W_PX = CHART_R - CHART_L;
  var CHART_H_PX = CHART_B - CHART_T;

  /* Second chart (F-r diagram) */
  var CHART2_T = 280;
  var CHART2_B = 470;
  var CHART2_H_PX = CHART2_B - CHART2_T;

  /* ================================================================
     DRAWING — GOVERNOR MECHANISM
     ================================================================ */

  function drawSpindle() {
    /* Main vertical spindle */
    ctx.fillStyle = '#4a5578';
    ctx.fillRect(GOV_CX - SPINDLE_W / 2, GOV_TOP, SPINDLE_W, GOV_BOT - GOV_TOP);

    /* Top cap */
    ctx.beginPath();
    ctx.arc(GOV_CX, GOV_TOP, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#6a1b9a';
    ctx.fill();
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Rotation indicator arrows around spindle top */
    var rpmIndicator = clamp(rpm / 600, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * rpmIndicator;
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 1.5;

    /* Left curved arrow */
    ctx.beginPath();
    ctx.arc(GOV_CX, GOV_TOP - 5, 18, Math.PI * 0.7, Math.PI * 1.3);
    ctx.stroke();
    var aL = Math.PI * 1.3;
    var ax1 = GOV_CX + 18 * Math.cos(aL);
    var ay1 = GOV_TOP - 5 + 18 * Math.sin(aL);
    ctx.beginPath();
    ctx.moveTo(ax1, ay1);
    ctx.lineTo(ax1 + 5, ay1 - 3);
    ctx.lineTo(ax1 + 2, ay1 + 4);
    ctx.closePath();
    ctx.fillStyle = '#ab47bc';
    ctx.fill();

    ctx.restore();

    /* RPM display on spindle */
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rpm + ' RPM', GOV_CX, GOV_BOT + 15);
  }

  function drawSleeveMechanism(sleeveY) {
    /* Sleeve block on spindle */
    var sw = 30, sh = 16;
    ctx.fillStyle = 'rgba(106,27,154,0.6)';
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(GOV_CX - sw / 2, sleeveY - sh / 2, sw, sh, 4);
    ctx.fill();
    ctx.stroke();

    /* Sleeve position marker line */
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(GOV_CX - 80, sleeveY);
    ctx.lineTo(GOV_CX + 80, sleeveY);
    ctx.stroke();
    ctx.restore();

    /* Porter: central dead weight */
    if (govType === 'porter' || govType === 'proell') {
      var ww = 40, wh = 12;
      ctx.fillStyle = 'rgba(171,71,188,0.45)';
      ctx.strokeStyle = '#ab47bc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(GOV_CX - ww / 2, sleeveY + sh / 2, ww, wh, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ab47bc';
      ctx.font = 'bold 8px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', GOV_CX, sleeveY + sh / 2 + wh / 2);
    }
  }

  function drawGovernorArms(theta, sleeveY) {
    /* theta = arm angle from vertical */
    var pivotY = GOV_PIVOT_Y;
    var armPx = armLen * 600;  /* Scale arm length to pixels */
    armPx = clamp(armPx, 80, 200);

    var dx = armPx * Math.sin(theta);
    var dy = armPx * Math.cos(theta);

    /* Ball positions */
    var leftBallX = GOV_CX - dx;
    var leftBallY = pivotY + dy;
    var rightBallX = GOV_CX + dx;
    var rightBallY = pivotY + dy;

    /* For Proell governor, balls are on arm extensions beyond the lower joint */
    var proellExt = 0;
    if (govType === 'proell') {
      proellExt = armPx * 0.35;
      leftBallX = GOV_CX - dx - proellExt * Math.sin(theta + 0.3);
      leftBallY = pivotY + dy + proellExt * Math.cos(theta + 0.3);
      rightBallX = GOV_CX + dx + proellExt * Math.sin(theta + 0.3);
      rightBallY = pivotY + dy + proellExt * Math.cos(theta + 0.3);
    }

    /* Upper arms (spindle pivot to ball or joint) */
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    if (govType === 'proell') {
      /* Upper arms to joint */
      ctx.beginPath();
      ctx.moveTo(GOV_CX, pivotY);
      ctx.lineTo(GOV_CX - dx, pivotY + dy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(GOV_CX, pivotY);
      ctx.lineTo(GOV_CX + dx, pivotY + dy);
      ctx.stroke();

      /* Extension arms from joint to ball */
      ctx.strokeStyle = '#ab47bc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(GOV_CX - dx, pivotY + dy);
      ctx.lineTo(leftBallX, leftBallY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(GOV_CX + dx, pivotY + dy);
      ctx.lineTo(rightBallX, rightBallY);
      ctx.stroke();
    } else {
      /* Standard arms to balls */
      ctx.beginPath();
      ctx.moveTo(GOV_CX, pivotY);
      ctx.lineTo(leftBallX, leftBallY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(GOV_CX, pivotY);
      ctx.lineTo(rightBallX, rightBallY);
      ctx.stroke();
    }

    /* Lower links (ball/joint to sleeve) */
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 2;

    if (govType === 'proell') {
      /* Lower links from joint to sleeve */
      ctx.beginPath();
      ctx.moveTo(GOV_CX - dx, pivotY + dy);
      ctx.lineTo(GOV_CX - 10, sleeveY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(GOV_CX + dx, pivotY + dy);
      ctx.lineTo(GOV_CX + 10, sleeveY);
      ctx.stroke();
    } else if (govType === 'hartnell') {
      /* Hartnell: bell crank levers */
      var leverPivotLX = GOV_CX - 50;
      var leverPivotRX = GOV_CX + 50;
      var leverPivotY = pivotY + dy * 0.6;

      /* Bell crank pivot points */
      ctx.fillStyle = '#4a5578';
      ctx.beginPath();
      ctx.arc(leverPivotLX, leverPivotY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(leverPivotRX, leverPivotY, 4, 0, 2 * Math.PI);
      ctx.fill();

      /* Horizontal arm to ball */
      ctx.strokeStyle = '#ab47bc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leverPivotLX, leverPivotY);
      ctx.lineTo(leftBallX, leftBallY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(leverPivotRX, leverPivotY);
      ctx.lineTo(rightBallX, rightBallY);
      ctx.stroke();

      /* Vertical arm to sleeve */
      ctx.strokeStyle = '#4a5578';
      ctx.beginPath();
      ctx.moveTo(leverPivotLX, leverPivotY);
      ctx.lineTo(GOV_CX - 12, sleeveY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(leverPivotRX, leverPivotY);
      ctx.lineTo(GOV_CX + 12, sleeveY);
      ctx.stroke();

      /* Spring symbol between sleeve and base */
      drawSpring(GOV_CX, sleeveY + 8, sleeveY + 70);
    } else {
      /* Watt/Porter: lower links to sleeve */
      ctx.beginPath();
      ctx.moveTo(leftBallX, leftBallY);
      ctx.lineTo(GOV_CX - 10, sleeveY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightBallX, rightBallY);
      ctx.lineTo(GOV_CX + 10, sleeveY);
      ctx.stroke();
    }

    /* Draw balls */
    drawBall(leftBallX, leftBallY);
    drawBall(rightBallX, rightBallY);

    /* Draw force arrows on balls */
    drawForceArrows(leftBallX, leftBallY, -1);
    drawForceArrows(rightBallX, rightBallY, 1);

    /* Joint circles for Proell */
    if (govType === 'proell') {
      ctx.beginPath();
      ctx.arc(GOV_CX - dx, pivotY + dy, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#4a5578';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(GOV_CX + dx, pivotY + dy, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    return { leftBallX: leftBallX, leftBallY: leftBallY, rightBallX: rightBallX, rightBallY: rightBallY };
  }

  function drawBall(x, y) {
    /* Shadow */
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, BALL_R, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    /* Main ball */
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, 2 * Math.PI);
    var grad = ctx.createRadialGradient(x - 4, y - 4, 2, x, y, BALL_R);
    grad.addColorStop(0, '#ab47bc');
    grad.addColorStop(1, '#6a1b9a');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Highlight */
    ctx.beginPath();
    ctx.arc(x - 4, y - 4, 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(171,71,188,0.4)';
    ctx.fill();

    /* Label */
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('m', x, y);
  }

  function drawForceArrows(bx, by, dir) {
    /* dir: -1 for left ball, +1 for right ball */
    var Fc = getCentrifugalForce();
    var arrowLen = clamp(Fc / 10, 5, 50);

    /* Centrifugal force (horizontal outward) */
    var fcEndX = bx + dir * (BALL_R + arrowLen);
    ctx.beginPath();
    ctx.moveTo(bx + dir * BALL_R, by);
    ctx.lineTo(fcEndX, by);
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(fcEndX, by);
    ctx.lineTo(fcEndX - dir * 7, by - 4);
    ctx.lineTo(fcEndX - dir * 7, by + 4);
    ctx.closePath();
    ctx.fillStyle = '#ff5555';
    ctx.fill();

    ctx.fillStyle = '#ff5555';
    ctx.font = 'bold 8px Courier New, monospace';
    ctx.textAlign = dir > 0 ? 'left' : 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Fc', fcEndX + dir * 3, by - 3);

    /* Gravity (downward) */
    var gLen = 25;
    ctx.beginPath();
    ctx.moveTo(bx, by + BALL_R);
    ctx.lineTo(bx, by + BALL_R + gLen);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(bx, by + BALL_R + gLen);
    ctx.lineTo(bx - 3, by + BALL_R + gLen - 6);
    ctx.lineTo(bx + 3, by + BALL_R + gLen - 6);
    ctx.closePath();
    ctx.fillStyle = '#3ddc84';
    ctx.fill();

    ctx.fillStyle = '#3ddc84';
    ctx.font = 'bold 8px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('mg', bx, by + BALL_R + gLen + 2);

    /* Spring force for Hartnell (upward on sleeve area) */
    if (govType === 'hartnell' && dir === 1) {
      var sFLen = clamp(springK * 0.005, 10, 40);
      var startY = by - BALL_R - 5;
      ctx.beginPath();
      ctx.moveTo(bx, startY);
      ctx.lineTo(bx, startY - sFLen);
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx, startY - sFLen);
      ctx.lineTo(bx - 3, startY - sFLen + 6);
      ctx.lineTo(bx + 3, startY - sFLen + 6);
      ctx.closePath();
      ctx.fillStyle = '#f5c842';
      ctx.fill();

      ctx.fillStyle = '#f5c842';
      ctx.font = 'bold 8px Courier New, monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Fs', bx + 5, startY - sFLen);
    }
  }

  function drawSpring(x, y1, y2) {
    var coils = 5;
    var len = y2 - y1;
    if (len < 15) return;
    var segH = len / (coils * 2 + 2);
    var halfW = 10;

    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y1 + segH);
    for (var i = 0; i < coils; i++) {
      var cy = y1 + segH + i * 2 * segH;
      var dir2 = (i % 2 === 0) ? 1 : -1;
      ctx.lineTo(x + dir2 * halfW, cy + segH);
      ctx.lineTo(x - dir2 * halfW, cy + 2 * segH);
    }
    ctx.lineTo(x, y2 - segH);
    ctx.lineTo(x, y2);

    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawSleevePositionIndicator(sleeveY) {
    /* Left-side indicator showing sleeve travel */
    var indX = GOV_CX - 95;
    var minY = GOV_PIVOT_Y + 30;
    var maxY = GOV_BOT - 80;

    /* Track */
    ctx.fillStyle = 'rgba(42,48,80,0.5)';
    ctx.fillRect(indX - 2, minY, 4, maxY - minY);

    /* Current position marker */
    var markerY = clamp(sleeveY, minY, maxY);
    ctx.beginPath();
    ctx.arc(indX, markerY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ab47bc';
    ctx.fill();

    /* Label */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '8px Courier New, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sleeve', indX - 8, markerY);
  }

  function drawGovernorTypeLabel() {
    var labels = {
      watt: 'Watt Governor',
      porter: 'Porter Governor',
      proell: 'Proell Governor',
      hartnell: 'Hartnell Governor'
    };
    ctx.fillStyle = '#6a1b9a';
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(labels[govType] || 'Governor', GOV_CX, GOV_BOT + 30);
  }

  /* ================================================================
     DRAWING — ROTATION EFFECT (3D ILLUSION)
     ================================================================ */

  function drawRotationTrail(leftX, leftY, rightX, rightY) {
    /* Faint elliptical path showing rotation */
    var rx = Math.abs(leftX - GOV_CX);
    var ry = rx * 0.25;
    var cy = (leftY + rightY) / 2;

    if (rx < 5) return;

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(171,71,188,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(GOV_CX, cy, rx, ry, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();
  }

  /* ================================================================
     DRAWING — H-N CHARACTERISTIC CURVE
     ================================================================ */

  function drawHNChart() {
    /* Axes */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CHART_L, CHART_B);
    ctx.lineTo(CHART_R, CHART_B);
    ctx.moveTo(CHART_L, CHART_B);
    ctx.lineTo(CHART_L, CHART_T);
    ctx.stroke();

    /* Axis labels */
    ctx.fillStyle = '#6b7a99';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Speed N (RPM)', (CHART_L + CHART_R) / 2, CHART_B + 8);

    ctx.save();
    ctx.translate(CHART_L - 18, (CHART_T + CHART_B) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Height h (m)', 0, 0);
    ctx.restore();

    /* Title */
    ctx.fillStyle = '#6a1b9a';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Height vs Speed (h-N)', (CHART_L + CHART_R) / 2, CHART_T - 5);

    /* Grid */
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(42,48,80,0.4)';
    ctx.lineWidth = 0.5;
    for (var gi = 1; gi <= 4; gi++) {
      var gy = CHART_B - gi * CHART_H_PX / 5;
      ctx.beginPath();
      ctx.moveTo(CHART_L, gy);
      ctx.lineTo(CHART_R, gy);
      ctx.stroke();
    }
    for (var gj = 1; gj <= 4; gj++) {
      var gx = CHART_L + gj * CHART_W_PX / 5;
      ctx.beginPath();
      ctx.moveTo(gx, CHART_T);
      ctx.lineTo(gx, CHART_B);
      ctx.stroke();
    }
    ctx.restore();

    /* Scale: N: 30-600 RPM, h: 0-1 m */
    var N_MIN = 30, N_MAX = 600;
    var H_MAX = 1.0;

    /* Tick labels */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var ti = 0; ti <= 5; ti++) {
      var tN = N_MIN + ti * (N_MAX - N_MIN) / 5;
      var tx = CHART_L + ti * CHART_W_PX / 5;
      ctx.fillText(Math.round(tN) + '', tx, CHART_B + 2);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var tj = 0; tj <= 5; tj++) {
      var tH = tj * H_MAX / 5;
      var ty = CHART_B - tj * CHART_H_PX / 5;
      ctx.fillText(tH.toFixed(2), CHART_L - 4, ty);
    }

    /* Draw h-N curve for current governor type */
    ctx.beginPath();
    var first = true;
    for (var n = N_MIN; n <= N_MAX; n += 2) {
      var w = 2 * Math.PI * n / 60;
      var hVal;
      if (govType === 'watt' || govType === 'hartnell') {
        hVal = 9.81 / (w * w);
      } else {
        hVal = 9.81 * (ballMass + sleeveMass) / (ballMass * w * w);
      }
      hVal = clamp(hVal, 0, H_MAX);

      var px = CHART_L + (n - N_MIN) / (N_MAX - N_MIN) * CHART_W_PX;
      var py = CHART_B - (hVal / H_MAX) * CHART_H_PX;

      if (first) { ctx.moveTo(px, py); first = false; }
      else { ctx.lineTo(px, py); }
    }
    ctx.strokeStyle = '#6a1b9a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* If Porter/Proell, also draw Watt curve for comparison */
    if (govType === 'porter' || govType === 'proell') {
      ctx.beginPath();
      first = true;
      for (var n2 = N_MIN; n2 <= N_MAX; n2 += 2) {
        var w2 = 2 * Math.PI * n2 / 60;
        var hv2 = clamp(9.81 / (w2 * w2), 0, H_MAX);
        var px2 = CHART_L + (n2 - N_MIN) / (N_MAX - N_MIN) * CHART_W_PX;
        var py2 = CHART_B - (hv2 / H_MAX) * CHART_H_PX;
        if (first) { ctx.moveTo(px2, py2); first = false; }
        else { ctx.lineTo(px2, py2); }
      }
      ctx.strokeStyle = 'rgba(106,27,154,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      /* Legend */
      ctx.fillStyle = 'rgba(106,27,154,0.5)';
      ctx.font = '9px Courier New, monospace';
      ctx.textAlign = 'left';
      ctx.fillText('-- Watt', CHART_R - 80, CHART_T + 15);
    }

    /* Current operating point */
    var curH = getGovernorHeight();
    curH = clamp(curH, 0, H_MAX);
    var opX = CHART_L + (rpm - N_MIN) / (N_MAX - N_MIN) * CHART_W_PX;
    var opY = CHART_B - (curH / H_MAX) * CHART_H_PX;
    opX = clamp(opX, CHART_L, CHART_R);
    opY = clamp(opY, CHART_T, CHART_B);

    /* Crosshair */
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(171,71,188,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(opX, CHART_B);
    ctx.lineTo(opX, opY);
    ctx.moveTo(CHART_L, opY);
    ctx.lineTo(opX, opY);
    ctx.stroke();
    ctx.restore();

    /* Operating point dot */
    ctx.beginPath();
    ctx.arc(opX, opY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ab47bc';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  /* ================================================================
     DRAWING — F-r CONTROLLING FORCE DIAGRAM
     ================================================================ */

  function drawFRChart() {
    /* Axes */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CHART_L, CHART2_B);
    ctx.lineTo(CHART_R, CHART2_B);
    ctx.moveTo(CHART_L, CHART2_B);
    ctx.lineTo(CHART_L, CHART2_T);
    ctx.stroke();

    /* Axis labels */
    ctx.fillStyle = '#6b7a99';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Radius r (m)', (CHART_L + CHART_R) / 2, CHART2_B + 8);

    ctx.save();
    ctx.translate(CHART_L - 18, (CHART2_T + CHART2_B) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Force F (N)', 0, 0);
    ctx.restore();

    /* Title */
    ctx.fillStyle = '#6a1b9a';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Controlling Force vs Radius (F-r)', (CHART_L + CHART_R) / 2, CHART2_T - 5);

    /* Grid */
    ctx.save();
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = 'rgba(42,48,80,0.4)';
    ctx.lineWidth = 0.5;
    for (var gi = 1; gi <= 4; gi++) {
      var gy = CHART2_B - gi * CHART2_H_PX / 5;
      ctx.beginPath();
      ctx.moveTo(CHART_L, gy);
      ctx.lineTo(CHART_R, gy);
      ctx.stroke();
    }
    for (var gj = 1; gj <= 4; gj++) {
      var gx = CHART_L + gj * CHART_W_PX / 5;
      ctx.beginPath();
      ctx.moveTo(gx, CHART2_T);
      ctx.lineTo(gx, CHART2_B);
      ctx.stroke();
    }
    ctx.restore();

    /* Scale */
    var R_MIN = 0, R_MAX = armLen * 1.2;
    if (R_MAX < 0.05) R_MAX = 0.3;
    var F_MAX_CHART = 0;

    /* Compute max force for scaling */
    var w = getOmega();
    var testFMax = ballMass * w * w * R_MAX;
    F_MAX_CHART = Math.max(testFMax * 1.2, 50);

    /* Tick labels */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (var ti = 0; ti <= 5; ti++) {
      var tR = R_MIN + ti * (R_MAX - R_MIN) / 5;
      var tx = CHART_L + ti * CHART_W_PX / 5;
      ctx.fillText(tR.toFixed(3), tx, CHART2_B + 2);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var tj = 0; tj <= 4; tj++) {
      var tF = tj * F_MAX_CHART / 4;
      var ty = CHART2_B - tj * CHART2_H_PX / 4;
      ctx.fillText(Math.round(tF) + '', CHART_L - 4, ty);
    }

    /* Current speed F-r line (Fc = m*w^2*r) — straight through origin */
    ctx.beginPath();
    var slope = ballMass * w * w;
    var fr0x = CHART_L;
    var fr0y = CHART2_B;
    var frEndR = R_MAX;
    var frEndF = slope * frEndR;
    if (frEndF > F_MAX_CHART) {
      frEndR = F_MAX_CHART / slope;
      frEndF = F_MAX_CHART;
    }
    var fr1x = CHART_L + (frEndR - R_MIN) / (R_MAX - R_MIN) * CHART_W_PX;
    var fr1y = CHART2_B - (frEndF / F_MAX_CHART) * CHART2_H_PX;
    ctx.moveTo(fr0x, fr0y);
    ctx.lineTo(fr1x, fr1y);
    ctx.strokeStyle = '#6a1b9a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    /* Label for current speed line */
    ctx.fillStyle = '#6a1b9a';
    ctx.font = 'bold 9px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('N=' + rpm, fr1x + 3, fr1y - 3);

    /* Isochronous line (through origin — same as current for Watt) */
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(245,200,66,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fr0x, fr0y);
    ctx.lineTo(fr1x, fr1y);
    ctx.stroke();
    ctx.restore();

    /* Stability reference lines at +/- 5% speed */
    var wLo = 2 * Math.PI * (rpm * 0.95) / 60;
    var wHi = 2 * Math.PI * (rpm * 1.05) / 60;

    /* N1 line */
    ctx.beginPath();
    var slopeLo = ballMass * wLo * wLo;
    var sEndR = R_MAX;
    var sEndF = slopeLo * sEndR;
    if (sEndF > F_MAX_CHART) { sEndR = F_MAX_CHART / slopeLo; sEndF = F_MAX_CHART; }
    ctx.moveTo(CHART_L, CHART2_B);
    ctx.lineTo(
      CHART_L + (sEndR - R_MIN) / (R_MAX - R_MIN) * CHART_W_PX,
      CHART2_B - (sEndF / F_MAX_CHART) * CHART2_H_PX
    );
    ctx.strokeStyle = 'rgba(61,220,132,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* N2 line */
    ctx.beginPath();
    var slopeHi = ballMass * wHi * wHi;
    sEndR = R_MAX;
    sEndF = slopeHi * sEndR;
    if (sEndF > F_MAX_CHART) { sEndR = F_MAX_CHART / slopeHi; sEndF = F_MAX_CHART; }
    ctx.moveTo(CHART_L, CHART2_B);
    ctx.lineTo(
      CHART_L + (sEndR - R_MIN) / (R_MAX - R_MIN) * CHART_W_PX,
      CHART2_B - (sEndF / F_MAX_CHART) * CHART2_H_PX
    );
    ctx.strokeStyle = 'rgba(255,85,85,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Operating range highlight */
    var curR = getRadius();
    var curF = getCentrifugalForce();
    curR = clamp(curR, R_MIN, R_MAX);
    curF = clamp(curF, 0, F_MAX_CHART);

    /* Current operating point */
    var cpx = CHART_L + (curR - R_MIN) / (R_MAX - R_MIN) * CHART_W_PX;
    var cpy = CHART2_B - (curF / F_MAX_CHART) * CHART2_H_PX;
    cpx = clamp(cpx, CHART_L, CHART_R);
    cpy = clamp(cpy, CHART2_T, CHART2_B);

    /* Crosshair */
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(171,71,188,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cpx, CHART2_B);
    ctx.lineTo(cpx, cpy);
    ctx.moveTo(CHART_L, cpy);
    ctx.lineTo(cpx, cpy);
    ctx.stroke();
    ctx.restore();

    /* Operating point dot */
    ctx.beginPath();
    ctx.arc(cpx, cpy, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#ab47bc';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    /* Legend */
    ctx.fillStyle = '#6b7a99';
    ctx.font = '8px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('N1(-5%)', CHART_R - 90, CHART2_T + 5);
    ctx.fillStyle = 'rgba(61,220,132,0.6)';
    ctx.fillRect(CHART_R - 96, CHART2_T + 7, 5, 5);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('N2(+5%)', CHART_R - 90, CHART2_T + 17);
    ctx.fillStyle = 'rgba(255,85,85,0.6)';
    ctx.fillRect(CHART_R - 96, CHART2_T + 19, 5, 5);
  }

  /* ================================================================
     DRAWING — BASE / PLATFORM
     ================================================================ */

  function drawBase() {
    var bw = 130;
    ctx.fillStyle = '#4a5578';
    ctx.fillRect(GOV_CX - bw / 2, GOV_BOT, bw, 6);

    /* Hatch lines */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var lx = GOV_CX - bw / 2 + 6 + i * 13;
      ctx.moveTo(lx, GOV_BOT + 6);
      ctx.lineTo(lx - 7, GOV_BOT + 16);
    }
    ctx.stroke();
  }

  /* ================================================================
     DRAWING — MAIN draw() FUNCTION (PURE RENDER)
     ================================================================ */

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      drawSimulate();
    } else if (mode === 'explore') {
      drawExplore();
    } else if (mode === 'practice') {
      drawPractice();
    } else if (mode === 'quiz') {
      drawQuiz();
    }
  }

  function drawSimulate() {
    var theta = getArmAngle();
    var h = getGovernorHeight();
    var armPx = clamp(armLen * 600, 80, 200);
    var dy = armPx * Math.cos(theta);
    var sleeveY = GOV_PIVOT_Y + dy;
    sleeveY = clamp(sleeveY, GOV_PIVOT_Y + 20, GOV_BOT - 40);

    /* Draw mechanism */
    drawBase();
    drawSpindle();
    var ballPos = drawGovernorArms(theta, sleeveY);
    drawSleeveMechanism(sleeveY);
    drawSleevePositionIndicator(sleeveY);
    drawGovernorTypeLabel();

    /* Rotation trail */
    drawRotationTrail(ballPos.leftBallX, ballPos.leftBallY, ballPos.rightBallX, ballPos.rightBallY);

    /* Divider line */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(420, 20);
    ctx.lineTo(420, H - 20);
    ctx.stroke();

    /* Charts */
    drawHNChart();
    drawFRChart();

    /* Sensitivity and hunting indicators */
    drawIndicators();
  }

  function drawIndicators() {
    var sens = getSensitivity();

    /* Sensitivity bar */
    var barX = CHART_R - 80;
    var barY = CHART2_B + 15;
    ctx.fillStyle = '#6b7a99';
    ctx.font = 'bold 9px Courier New, monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Sensitivity: ' + sens.toFixed(3), barX - 80, barY);

    /* Stability indicator */
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Stable', barX + 50, barY);

    /* Speed range indicator */
    var N1 = Math.round(rpm * 0.95);
    var N2 = Math.round(rpm * 1.05);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Range: ' + N1 + '-' + N2 + ' RPM', barX - 80, barY + 14);
  }

  /* ================================================================
     DRAWING — EXPLORE MODE CANVAS
     ================================================================ */

  function drawExplore() {
    if (!exploreItem) {
      drawPlaceholder('Select a concept to explore');
      return;
    }

    var c = exploreItem;
    var padL = 40, padT = 50;

    /* Title */
    ctx.fillStyle = '#6a1b9a';
    ctx.font = 'bold 18px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(c.name, padL, padT);

    /* Category badge */
    ctx.fillStyle = 'rgba(106,27,154,0.22)';
    var badgeW = ctx.measureText(c.cat.toUpperCase()).width + 16;
    ctx.beginPath();
    ctx.roundRect(padL + ctx.measureText(c.name).width + 14, padT + 2, badgeW, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 9px Segoe UI, sans-serif';
    ctx.fillText(c.cat.toUpperCase(), padL + ctx.measureText(c.name).width + 22, padT + 7);

    /* Formula */
    ctx.font = 'bold 16px Courier New, monospace';
    ctx.fillStyle = '#ab47bc';
    ctx.fillText(c.formula, padL, padT + 40);

    /* Unit */
    if (c.unit && c.unit !== '\u2014') {
      ctx.font = '12px Courier New, monospace';
      ctx.fillStyle = '#6b7a99';
      ctx.fillText('Unit: ' + c.unit, padL, padT + 62);
    }

    /* Description (wrapped) */
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillStyle = '#6b7a99';
    wrapText(ctx, c.desc, padL, padT + 85, W - 80, 20);

    /* Diagram area — draw concept-specific diagram */
    drawConceptDiagram(c.id);
  }

  function drawConceptDiagram(id) {
    var cx = W / 2, cy = 380;

    if (id === 'watt-governor' || id === 'height-speed') {
      /* Draw small h-N curve */
      drawMiniHNCurve(350, 300, 500, 460, 'watt');
    } else if (id === 'porter-governor') {
      drawMiniHNCurve(350, 300, 500, 460, 'porter');
    } else if (id === 'proell-governor') {
      drawMiniGovernor(cx, cy, 'proell');
    } else if (id === 'hartnell-governor' || id === 'spring-design') {
      drawMiniGovernor(cx, cy, 'hartnell');
    } else if (id === 'controlling-force' || id === 'stability-isochronism') {
      drawMiniFRCurve(350, 300, 500, 460);
    } else if (id === 'sensitivity') {
      drawSensitivityDiagram(cx, cy);
    } else if (id === 'effort-power') {
      drawEffortDiagram(cx, cy);
    } else if (id === 'hunting') {
      drawHuntingDiagram(350, 300, 500, 460);
    } else if (id === 'governor-friction') {
      drawFrictionDiagram(350, 300, 500, 460);
    }
  }

  function drawMiniHNCurve(l, t, r, b) {
    var w2 = r - l, h2 = b - t;
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l, b); ctx.lineTo(r, b);
    ctx.moveTo(l, b); ctx.lineTo(l, t);
    ctx.stroke();

    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N (RPM)', (l + r) / 2, b + 14);

    ctx.beginPath();
    for (var n = 30; n <= 400; n += 3) {
      var ww = 2 * Math.PI * n / 60;
      var hh = clamp(9.81 / (ww * ww), 0, 1);
      var px = l + (n - 30) / 370 * w2;
      var py = b - hh * h2;
      if (n === 30) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#6a1b9a';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawMiniFRCurve(l, t, r, b) {
    var w2 = r - l, h2 = b - t;
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l, b); ctx.lineTo(r, b);
    ctx.moveTo(l, b); ctx.lineTo(l, t);
    ctx.stroke();

    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('r (m)', (l + r) / 2, b + 14);

    /* Isochronous line (through origin) */
    ctx.beginPath();
    ctx.moveTo(l, b);
    ctx.lineTo(r, t + h2 * 0.2);
    ctx.strokeStyle = 'rgba(245,200,66,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Stable line (positive intercept) */
    ctx.beginPath();
    ctx.moveTo(l, b - h2 * 0.15);
    ctx.lineTo(r, t);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Labels */
    ctx.font = '9px Courier New, monospace';
    ctx.fillStyle = '#f5c842';
    ctx.textAlign = 'right';
    ctx.fillText('Isochronous', r - 5, t + h2 * 0.25);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Stable', r - 5, t + 5);
  }

  function drawMiniGovernor(cx, cy, type) {
    /* Simplified governor sketch */
    ctx.strokeStyle = '#4a5578';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 60);
    ctx.lineTo(cx, cy + 60);
    ctx.stroke();

    /* Arms */
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40);
    ctx.lineTo(cx - 50, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40);
    ctx.lineTo(cx + 50, cy);
    ctx.stroke();

    /* Balls */
    ctx.beginPath();
    ctx.arc(cx - 50, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#6a1b9a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 50, cy, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#6a1b9a';
    ctx.fill();

    if (type === 'hartnell') {
      /* Spring */
      drawSpring(cx, cy + 10, cy + 50);
      ctx.fillStyle = '#f5c842';
      ctx.font = '9px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Spring k', cx, cy + 60);
    }

    if (type === 'proell') {
      /* Extension marks */
      ctx.strokeStyle = '#ab47bc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 50, cy);
      ctx.lineTo(cx - 65, cy + 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 50, cy);
      ctx.lineTo(cx + 65, cy + 15);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx - 65, cy + 15, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#ab47bc';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 65, cy + 15, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#ab47bc';
      ctx.fill();

      ctx.fillStyle = '#6b7a99';
      ctx.font = '9px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Extension arms', cx, cy + 75);
    }
  }

  function drawSensitivityDiagram(cx, cy) {
    /* Speed range diagram */
    var barW = 300, barH = 20;
    var x0 = cx - barW / 2;

    ctx.fillStyle = 'rgba(106,27,154,0.15)';
    ctx.fillRect(x0, cy - barH / 2, barW, barH);

    /* N1 marker */
    var n1x = x0 + barW * 0.3;
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(n1x, cy - barH);
    ctx.lineTo(n1x, cy + barH);
    ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N1', n1x, cy + barH + 12);

    /* N2 marker */
    var n2x = x0 + barW * 0.7;
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(n2x, cy - barH);
    ctx.lineTo(n2x, cy + barH);
    ctx.stroke();
    ctx.fillStyle = '#ff5555';
    ctx.fillText('N2', n2x, cy + barH + 12);

    /* Mean speed */
    var nmx = (n1x + n2x) / 2;
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(nmx, cy - barH);
    ctx.lineTo(nmx, cy + barH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('N (mean)', nmx, cy - barH - 8);

    /* Formula */
    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 12px Courier New, monospace';
    ctx.fillText('s = (N2 - N1) / N', cx, cy + barH + 35);
  }

  function drawEffortDiagram(cx, cy) {
    /* Sleeve with force arrow */
    ctx.fillStyle = 'rgba(106,27,154,0.4)';
    ctx.fillRect(cx - 20, cy - 10, 40, 20);
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cx - 20, cy - 10, 40, 20);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sleeve', cx, cy);

    /* Effort arrow */
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy - 50);
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - 50);
    ctx.lineTo(cx - 5, cy - 42);
    ctx.lineTo(cx + 5, cy - 42);
    ctx.closePath();
    ctx.fillStyle = '#ff5555';
    ctx.fill();
    ctx.fillText('Effort E', cx, cy - 58);

    /* Lift arrow */
    ctx.beginPath();
    ctx.moveTo(cx + 30, cy - 10);
    ctx.lineTo(cx + 30, cy - 40);
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.font = '9px Courier New, monospace';
    ctx.fillText('Lift', cx + 50, cy - 25);

    ctx.fillStyle = '#ab47bc';
    ctx.font = 'bold 11px Courier New, monospace';
    ctx.fillText('Power = E \u00D7 Lift', cx, cy + 40);
  }

  function drawHuntingDiagram(l, t, r, b) {
    var w2 = r - l, h2 = b - t;
    var midY = (t + b) / 2;

    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l, b); ctx.lineTo(r, b);
    ctx.moveTo(l, midY); ctx.lineTo(r, midY);
    ctx.stroke();

    /* Mean speed line */
    ctx.save();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#f5c842';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l, midY);
    ctx.lineTo(r, midY);
    ctx.stroke();
    ctx.restore();

    /* Oscillating speed */
    ctx.beginPath();
    for (var i = 0; i <= w2; i++) {
      var x = l + i;
      var y = midY - Math.sin(i * 0.08) * h2 * 0.35 * Math.exp(-i * 0.003);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#ff5555';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f5c842';
    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('Mean N', r, midY - 5);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('Hunting', r, t + 10);
  }

  function drawFrictionDiagram(l, t, r, b) {
    var w2 = r - l, h2 = b - t;
    var midY = (t + b) / 2;

    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l, b); ctx.lineTo(r, b);
    ctx.moveTo(l, b); ctx.lineTo(l, t);
    ctx.stroke();

    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('N (RPM)', (l + r) / 2, b + 14);

    /* Without friction (narrow band) */
    ctx.fillStyle = 'rgba(61,220,132,0.15)';
    ctx.fillRect(l + w2 * 0.4, t, w2 * 0.1, h2);

    /* With friction (wider band) */
    ctx.fillStyle = 'rgba(255,85,85,0.1)';
    ctx.fillRect(l + w2 * 0.3, t, w2 * 0.3, h2);

    ctx.fillStyle = '#3ddc84';
    ctx.font = '9px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('No friction', l + w2 * 0.45, t + 15);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('With friction', l + w2 * 0.45, t + 30);
    ctx.fillText('Dead band', l + w2 * 0.45, t + 45);
  }

  /* ================================================================
     DRAWING — PRACTICE MODE CANVAS
     ================================================================ */

  function drawPractice() {
    drawPlaceholder('Solve the practice problem below');

    if (currentProblem) {
      /* Mini governor sketch */
      drawMiniGovernor(W / 2, 320, govType);
    }
  }

  /* ================================================================
     DRAWING — QUIZ MODE CANVAS
     ================================================================ */

  function drawQuiz() {
    drawPlaceholder('Answer the quiz question below');

    /* Mini governor sketch */
    drawMiniGovernor(W / 2, 320, 'watt');
  }

  /* ================================================================
     DRAWING — PLACEHOLDER
     ================================================================ */

  function drawPlaceholder(text) {
    ctx.fillStyle = '#6b7a99';
    ctx.font = '14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, 30);
  }

  /* ================================================================
     TEXT WRAP HELPER
     ================================================================ */

  function wrapText(context, text, x, y, maxW, lineH) {
    var words = text.split(' ');
    var line = '';
    for (var n = 0; n < words.length; n++) {
      var testLine = line + words[n] + ' ';
      var metrics = context.measureText(testLine);
      if (metrics.width > maxW && n > 0) {
        context.fillText(line.trim(), x, y);
        line = words[n] + ' ';
        y += lineH;
      } else {
        line = testLine;
      }
    }
    context.fillText(line.trim(), x, y);
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */

  function animate(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    var dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (animRunning && mode === 'simulate') {
      /* Rotate governor animation */
      var rotSpeed = rpm / 60 * 2 * Math.PI;
      animAngle += rotSpeed * dt;
      if (animAngle > 2 * Math.PI) animAngle -= 2 * Math.PI;
    }

    draw();
    requestAnimationFrame(animate);
  }

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  function setMode(m) {
    mode = m;
    var pills = modeTabs.querySelectorAll('.pill');
    pills.forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-mode') === m);
    });

    /* Visibility */
    simPanel.style.display = m === 'simulate' ? '' : 'none';
    catRow.style.display = m === 'explore' ? '' : 'none';
    itemSelector.style.display = m === 'explore' ? '' : 'none';
    itemInfo.style.display = m === 'explore' && exploreItem ? '' : 'none';
    practicePanel.style.display = m === 'practice' ? '' : 'none';
    practiceBar.style.display = m === 'practice' ? '' : 'none';
    quizPanel.style.display = m === 'quiz' ? '' : 'none';
    quizBar.style.display = m === 'quiz' ? '' : 'none';
    quizResult.style.display = 'none';

    if (m === 'explore') {
      renderConceptGrid();
    } else if (m === 'practice') {
      if (!currentProblem) generatePractice();
    } else if (m === 'quiz') {
      if (quizSet.length === 0) startQuiz();
    }
  }

  modeTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    setMode(pill.getAttribute('data-mode'));
  });

  /* Governor type tabs */
  govTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    govType = pill.getAttribute('data-gov');
    govTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p === pill);
    });
    showHideSliders();
    syncSliders();

    /* Clear preset highlighting */
    document.querySelectorAll('.preset-btn').forEach(function (btn) {
      btn.classList.remove('active');
    });
  });

  /* Preset buttons */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.preset-btn');
    if (!btn) return;
    var key = btn.getAttribute('data-preset');
    if (key) applyPreset(key);
  });

  /* ================================================================
     EXPLORE MODE — UI
     ================================================================ */

  catTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    exploreCat = pill.getAttribute('data-cat');
    catTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p === pill);
    });
    exploreItem = null;
    itemInfo.style.display = 'none';
    renderConceptGrid();
  });

  function renderConceptGrid() {
    conceptGrid.innerHTML = '';
    var items = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    items.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (exploreItem && exploreItem.id === c.id ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        selectConcept(c);
      });
      conceptGrid.appendChild(btn);
    });
  }

  function selectConcept(c) {
    exploreItem = c;

    /* Highlight active */
    conceptGrid.querySelectorAll('.is-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.querySelector('.is-btn-name').textContent === c.name);
    });

    /* Info panel */
    itemInfo.style.display = '';
    itemInfo.innerHTML =
      '<div class="ii-top">' +
        '<span class="ii-name">' + c.name + '</span>' +
        '<span class="ii-cat-badge">' + c.cat + '</span>' +
      '</div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      '<div class="formula-box">' +
        '<span class="fb-formula">' + c.formula + '</span>' +
        (c.unit ? '<span class="fb-unit">Unit: ' + c.unit + '</span>' : '') +
      '</div>' +
      (c.example ?
        '<div class="example-box">' +
          '<h4>Worked Example</h4>' +
          '<p class="ex-problem">' + c.example.problem + '</p>' +
          c.example.steps.map(function (s) {
            return '<p class="ex-step"><strong>' + s + '</strong></p>';
          }).join('') +
        '</div>' : '');
  }

  /* ================================================================
     PRACTICE MODE — UI
     ================================================================ */

  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');

  function generatePractice() {
    var idx = randInt(0, PROBLEM_GEN.length - 1);
    currentProblem = PROBLEM_GEN[idx]();
    pAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    ppInput.focus();
  }

  function checkPractice() {
    if (pAnswered || !currentProblem) return;
    pAnswered = true;
    pTotal++;
    var userVal = parseFloat(ppInput.value);
    var correct = !isNaN(userVal) && Math.abs(userVal - currentProblem.answer) <= currentProblem.tol;

    if (correct) {
      pCorrect++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback err';
    }

    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';
    document.getElementById('pbar-score-val').textContent = pCorrect + ' / ' + pTotal;

    /* Show solution */
    ppSolution.style.display = '';
    ppSolution.innerHTML = '<h4>Solution</h4>' +
      currentProblem.steps.map(function (s) {
        return '<p class="sol-step"><strong>' + s + '</strong></p>';
      }).join('');
  }

  ppCheck.addEventListener('click', checkPractice);
  ppNext.addEventListener('click', generatePractice);
  ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (!pAnswered) checkPractice();
      else generatePractice();
    }
  });

  /* ================================================================
     QUIZ MODE — UI
     ================================================================ */

  function startQuiz() {
    var indices = [];
    for (var i = 0; i < QUIZ_POOL.length; i++) indices.push(i);
    shuffle(indices);
    quizSet = indices.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizLocked = false;
    quizResult.style.display = 'none';
    quizBar.style.display = '';
    quizPanel.style.display = '';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIdx >= QUIZ_SIZE) {
      showQuizResult();
      return;
    }

    var q = QUIZ_POOL[quizSet[quizIdx]];
    quizLocked = false;
    document.getElementById('qbar-num').textContent = (quizIdx + 1) + '';

    if (q.type === 'numeric') {
      quizPanel.innerHTML =
        '<p class="qp-prompt">' + q.q + '</p>' +
        '<div class="quiz-input-row">' +
          '<input class="qi-input" id="qi-answer" type="number" step="any" placeholder="Your answer">' +
          '<span class="qi-unit">' + (q.unit || '') + '</span>' +
          '<button class="btn btn-primary" id="qi-submit">Submit</button>' +
        '</div>' +
        '<p class="quiz-feedback" id="q-feedback"></p>';

      var qiSubmit = document.getElementById('qi-submit');
      var qiAnswer = document.getElementById('qi-answer');

      qiSubmit.addEventListener('click', function () {
        if (quizLocked) return;
        quizLocked = true;
        var val = parseFloat(qiAnswer.value);
        var ok = !isNaN(val) && Math.abs(val - q.ans) <= q.tol;
        var fb = document.getElementById('q-feedback');
        if (ok) {
          quizScore++;
          fb.textContent = 'Correct!';
          fb.className = 'quiz-feedback ok';
        } else {
          fb.textContent = 'Incorrect. Answer: ' + q.ans + ' ' + (q.unit || '');
          fb.className = 'quiz-feedback err';
        }
        quizAnswers.push({ q: q.q, correct: ok, userAns: val, realAns: q.ans });
        qiAnswer.disabled = true;
        qiSubmit.textContent = 'Next \u2192';
        qiSubmit.addEventListener('click', function () {
          quizIdx++;
          renderQuizQuestion();
        }, { once: true });
      });

      qiAnswer.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') qiSubmit.click();
      });
      qiAnswer.focus();
    } else {
      /* MCQ */
      quizPanel.innerHTML =
        '<p class="qp-prompt">' + q.q + '</p>' +
        '<div class="answer-grid">' +
          q.opts.map(function (o, i) {
            return '<button class="answer-btn" data-idx="' + i + '">' + o + '</button>';
          }).join('') +
        '</div>' +
        '<p class="quiz-feedback" id="q-feedback"></p>';

      var btns = quizPanel.querySelectorAll('.answer-btn');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizLocked) return;
          quizLocked = true;
          var chosen = parseInt(btn.getAttribute('data-idx'));
          var ok = chosen === q.ans;

          btns.forEach(function (b) {
            b.classList.add('locked');
            var bi = parseInt(b.getAttribute('data-idx'));
            if (bi === q.ans) b.classList.add('correct');
            if (bi === chosen && !ok) b.classList.add('wrong');
          });

          if (ok) {
            quizScore++;
            document.getElementById('q-feedback').textContent = 'Correct!';
            document.getElementById('q-feedback').className = 'quiz-feedback ok';
          } else {
            document.getElementById('q-feedback').textContent = 'Incorrect.';
            document.getElementById('q-feedback').className = 'quiz-feedback err';
          }

          quizAnswers.push({ q: q.q, correct: ok, userAns: q.opts[chosen], realAns: q.opts[q.ans] });

          setTimeout(function () {
            quizIdx++;
            renderQuizQuestion();
          }, 1200);
        });
      });
    }
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    var pct = Math.round(quizScore / QUIZ_SIZE * 100);
    var stars = '';
    var cls = 'poor';
    var verdict = 'Keep practising!';
    if (pct >= 90) { stars = '\u2605\u2605\u2605'; cls = 'perfect'; verdict = 'Outstanding!'; }
    else if (pct >= 70) { stars = '\u2605\u2605'; cls = 'good'; verdict = 'Good work!'; }
    else if (pct >= 50) { stars = '\u2605'; cls = 'good'; verdict = 'Not bad!'; }
    else { stars = ''; cls = 'poor'; verdict = 'Keep practising!'; }

    var rowsHTML = quizAnswers.map(function (a, i) {
      var rc = a.correct ? 'ok' : 'err';
      return '<div class="qr-row ' + rc + '">' +
        '<span class="qr-qnum">Q' + (i + 1) + '</span>' +
        '<span class="qr-detail"><strong>' + a.q.substring(0, 60) + '</strong></span>' +
        '<span class="qr-mark">' + (a.correct ? '\u2713' : '\u2717') + '</span>' +
      '</div>';
    }).join('');

    quizResult.innerHTML =
      '<div class="qr-header">' +
        '<div class="qr-title-wrap">' +
          '<span class="qr-title">Quiz Complete</span>' +
          '<span class="qr-stars">' + stars + '</span>' +
        '</div>' +
        '<div class="qr-score-wrap">' +
          '<span class="qr-score ' + cls + '">' + pct + '%</span>' +
          '<div class="qr-verdict">' + verdict + ' (' + quizScore + '/' + QUIZ_SIZE + ')</div>' +
        '</div>' +
      '</div>' +
      '<div class="qr-rows">' + rowsHTML + '</div>' +
      '<button class="btn btn-primary" id="quiz-retry">Retry Quiz</button>';

    document.getElementById('quiz-retry').addEventListener('click', function () {
      startQuiz();
    });
  }

  /* ================================================================
     CANVAS POINTER EVENTS
     ================================================================ */

  cvs.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    /* Toggle animation on click */
    if (mode === 'simulate') {
      animRunning = !animRunning;
    }
  });

  /* ================================================================
     INIT
     ================================================================ */

  showHideSliders();
  syncSliders();
  setMode('simulate');
  requestAnimationFrame(animate);

})();
