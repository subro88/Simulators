(function () {
  'use strict';

  /* ================================================================
     DATA — CONCEPTS
     ================================================================ */

  var CONCEPTS = [
    /* ── Flow Basics ──────────────────────────────────────────────── */
    {
      id: 'fluid-props', name: 'Fluid Properties', symbol: '\u03C1, \u03BC',
      formula: '\u03C1 (density, kg/m\u00B3), \u03BC (dynamic viscosity, Pa\u00B7s)', unit: 'kg/m\u00B3, Pa\u00B7s',
      cat: 'basics',
      desc: 'The two most important fluid properties for pipe flow are density (\u03C1) and dynamic viscosity (\u03BC). Density is mass per unit volume \u2014 water at 20\u00B0C has \u03C1 \u2248 998 kg/m\u00B3. Dynamic viscosity measures a fluid\'s resistance to shear deformation \u2014 water at 20\u00B0C has \u03BC \u2248 1.002\u00D710\u207B\u00B3 Pa\u00B7s. Kinematic viscosity \u03BD = \u03BC/\u03C1 combines both properties. Higher viscosity fluids (like oil or glycerin) resist flow more and tend toward laminar conditions.',
      diagram: 'fluidProps',
      example: { problem: 'Water at 20\u00B0C (\u03C1=998 kg/m\u00B3, \u03BC=1.002\u00D710\u207B\u00B3 Pa\u00B7s) flows at 2 m/s in a 50 mm pipe. What is the kinematic viscosity?', steps: ['\u03BD = \u03BC / \u03C1', '\u03BD = 1.002\u00D710\u207B\u00B3 / 998', '\u03BD = 1.004\u00D710\u207B\u2076 m\u00B2/s', '\u03BD \u2248 1.0\u00D710\u207B\u2076 m\u00B2/s'], answer: 1.0, unit: '\u00D710\u207B\u2076 m\u00B2/s' }
    },
    {
      id: 'reynolds', name: 'Reynolds Number', symbol: 'Re',
      formula: 'Re = \u03C1VD/\u03BC', unit: '\u2014 (dimensionless)',
      cat: 'basics',
      desc: 'The Reynolds number is a dimensionless ratio of inertial forces to viscous forces: Re = \u03C1VD/\u03BC, where \u03C1 is fluid density, V is mean velocity, D is pipe diameter, and \u03BC is dynamic viscosity. It determines the flow regime: Re < 2300 is laminar (smooth, orderly), 2300 < Re < 4000 is transitional, and Re > 4000 is turbulent (chaotic eddies). This is the single most important parameter in pipe flow analysis.',
      diagram: 'reynolds',
      example: { problem: 'Water (\u03C1=998 kg/m\u00B3, \u03BC=0.001 Pa\u00B7s) flows at 0.5 m/s in a 25 mm diameter pipe. Find Re.', steps: ['Re = \u03C1VD/\u03BC', 'Re = 998 \u00D7 0.5 \u00D7 0.025 / 0.001', 'Re = 12.475 / 0.001', 'Re = 12475 (Turbulent)'], answer: 12475, unit: '' }
    },
    {
      id: 'flow-regimes', name: 'Flow Regimes', symbol: 'Lam / Trans / Turb',
      formula: 'Re<2300: Laminar | 2300<Re<4000: Transition | Re>4000: Turbulent', unit: '\u2014',
      cat: 'basics',
      desc: 'Laminar flow (Re < 2300) has smooth, parallel streamlines with a parabolic velocity profile \u2014 maximum velocity at the centre is exactly twice the mean velocity. Turbulent flow (Re > 4000) has chaotic, irregular motion with eddies and mixing \u2014 the velocity profile is much flatter, with a thin boundary layer near the wall. Transitional flow (2300 < Re < 4000) oscillates unpredictably between laminar and turbulent states. Most engineering pipe flows are turbulent.',
      diagram: 'flowRegimes',
      example: { problem: 'Oil (\u03C1=880 kg/m\u00B3, \u03BC=0.08 Pa\u00B7s) flows at 0.3 m/s in a 100 mm pipe. Is the flow laminar, transitional, or turbulent?', steps: ['Re = \u03C1VD/\u03BC', 'Re = 880 \u00D7 0.3 \u00D7 0.1 / 0.08', 'Re = 26.4 / 0.08 = 330', 'Re = 330 < 2300 \u2192 Laminar'], answer: 330, unit: '' }
    },
    {
      id: 'velocity-profile', name: 'Velocity Profile', symbol: 'u(r)',
      formula: 'Laminar: u(r) = 2V[1\u2212(r/R)\u00B2], V_max = 2V', unit: 'm/s',
      cat: 'basics',
      desc: 'In laminar pipe flow, the velocity varies parabolically from zero at the wall (no-slip condition) to a maximum at the centreline: u(r) = 2V_avg[1 \u2212 (r/R)\u00B2], where R is pipe radius and V_avg is mean velocity. The maximum velocity is exactly 2\u00D7 the mean velocity. In turbulent flow, the profile is much flatter due to mixing, approximated by the power law: u(r) = U_max(1 \u2212 r/R)^(1/n), where n \u2248 7 for smooth pipes. The ratio V_avg/V_max \u2248 0.82 for turbulent flow.',
      diagram: 'velocityProfile',
      example: { problem: 'Water flows at an average velocity of 1.5 m/s in laminar flow through a pipe. What is the maximum velocity at the centreline?', steps: ['For laminar flow: V_max = 2 \u00D7 V_avg', 'V_max = 2 \u00D7 1.5', 'V_max = 3.0 m/s', 'Parabolic profile: u(r) = 2V[1\u2212(r/R)\u00B2]'], answer: 3.0, unit: 'm/s' }
    },

    /* ── Key Equations ────────────────────────────────────────────── */
    {
      id: 'continuity', name: 'Continuity Equation', symbol: 'A\u2081V\u2081 = A\u2082V\u2082',
      formula: 'Q = AV = \u03C0D\u00B2V/4 = const', unit: 'm\u00B3/s',
      cat: 'equations',
      desc: 'The continuity equation states that for incompressible steady flow, the mass flow rate is constant: \u03C1A\u2081V\u2081 = \u03C1A\u2082V\u2082. For constant density, this simplifies to A\u2081V\u2081 = A\u2082V\u2082. The volume flow rate Q = AV = \u03C0D\u00B2V/4 remains constant along a pipe. If the pipe narrows, velocity increases; if it widens, velocity decreases. This is a fundamental principle used in designing pipe systems and nozzles.',
      diagram: 'continuity',
      example: { problem: 'Water flows at 2 m/s in a 100 mm pipe that narrows to 50 mm. Find the velocity in the narrow section.', steps: ['A\u2081V\u2081 = A\u2082V\u2082', '(\u03C0/4)(0.1)\u00B2 \u00D7 2 = (\u03C0/4)(0.05)\u00B2 \u00D7 V\u2082', 'V\u2082 = 2 \u00D7 (0.1/0.05)\u00B2', 'V\u2082 = 2 \u00D7 4 = 8 m/s'], answer: 8, unit: 'm/s' }
    },
    {
      id: 'bernoulli', name: 'Bernoulli\'s Equation', symbol: 'P/\u03C1g + V\u00B2/2g + z',
      formula: 'P\u2081/\u03C1g + V\u2081\u00B2/2g + z\u2081 = P\u2082/\u03C1g + V\u2082\u00B2/2g + z\u2082 + h_L', unit: 'm (head)',
      cat: 'equations',
      desc: 'Bernoulli\'s equation (modified for real pipe flow) expresses energy conservation per unit weight: P/\u03C1g (pressure head) + V\u00B2/2g (velocity head) + z (elevation head) = constant along a streamline, minus head losses h_L. The Energy Grade Line (EGL) represents total head (P/\u03C1g + V\u00B2/2g + z) and always slopes downward in the direction of flow. The Hydraulic Grade Line (HGL) is the EGL minus velocity head (V\u00B2/2g) and represents the height to which fluid would rise in a piezometer tube.',
      diagram: 'bernoulli',
      example: { problem: 'Water flows in a horizontal pipe. At section 1: P=200 kPa, V=2 m/s. At section 2: V=4 m/s. Neglecting losses, find P\u2082 (kPa). (\u03C1=998 kg/m\u00B3)', steps: ['P\u2081 + \u00BD\u03C1V\u2081\u00B2 = P\u2082 + \u00BD\u03C1V\u2082\u00B2', 'P\u2082 = P\u2081 + \u00BD\u03C1(V\u2081\u00B2 \u2212 V\u2082\u00B2)', 'P\u2082 = 200000 + 0.5\u00D7998\u00D7(4\u221216)', 'P\u2082 = 200000 \u2212 5988 = 194012 Pa \u2248 194 kPa'], answer: 194, unit: 'kPa' }
    },
    {
      id: 'darcy', name: 'Darcy-Weisbach', symbol: 'h_f',
      formula: 'h_f = f(L/D)(V\u00B2/2g)', unit: 'm',
      cat: 'equations',
      desc: 'The Darcy-Weisbach equation calculates major head loss (friction loss) along a pipe: h_f = f \u00D7 (L/D) \u00D7 (V\u00B2/2g), where f is the Darcy friction factor, L is pipe length, D is pipe diameter, V is mean velocity, and g = 9.81 m/s\u00B2. This equation is valid for both laminar and turbulent flow. For laminar flow, f = 64/Re. For turbulent flow, f depends on both Re and relative roughness \u03B5/D (found from Moody diagram or Colebrook equation). The pressure drop is \u0394P = \u03C1gh_f.',
      diagram: 'darcyWeisbach',
      example: { problem: 'Water flows at 3 m/s in a 100 mm steel pipe (f=0.02), 50 m long. Find the head loss (m).', steps: ['h_f = f(L/D)(V\u00B2/2g)', 'h_f = 0.02 \u00D7 (50/0.1) \u00D7 (3\u00B2/(2\u00D79.81))', 'h_f = 0.02 \u00D7 500 \u00D7 0.459', 'h_f = 4.59 m'], answer: 4.59, unit: 'm' }
    },
    {
      id: 'hagen-poiseuille', name: 'Hagen-Poiseuille', symbol: '\u0394P',
      formula: '\u0394P = 128\u03BCLQ/(\u03C0D\u2074) [laminar only]', unit: 'Pa',
      cat: 'equations',
      desc: 'The Hagen-Poiseuille equation gives the pressure drop for fully-developed laminar flow in a circular pipe: \u0394P = 128\u03BCLQ/(\u03C0D\u2074), where \u03BC is dynamic viscosity, L is pipe length, Q is volume flow rate, and D is diameter. It can also be written as \u0394P = 32\u03BCLV/D\u00B2. This equation is only valid for laminar flow (Re < 2300) and shows that pressure drop is proportional to velocity (not velocity squared as in turbulent flow). It also shows the strong dependence on diameter \u2014 halving D increases \u0394P by 16\u00D7.',
      diagram: 'hagenPoiseuille',
      example: { problem: 'Oil (\u03BC=0.1 Pa\u00B7s) flows at Q=0.5 L/s through a 20 mm diameter pipe, 5 m long. Find \u0394P (Pa).', steps: ['\u0394P = 128\u03BCLQ/(\u03C0D\u2074)', '\u0394P = 128 \u00D7 0.1 \u00D7 5 \u00D7 0.0005 / (\u03C0 \u00D7 0.02\u2074)', '\u0394P = 3.2 / (5.027\u00D710\u207B\u2077)', '\u0394P = 6,366,198 Pa \u2248 6366 kPa'], answer: 6366, unit: 'kPa' }
    },

    /* ── Losses & Friction ────────────────────────────────────────── */
    {
      id: 'friction-factor', name: 'Friction Factor', symbol: 'f',
      formula: 'Laminar: f=64/Re | Turbulent: Colebrook eq.', unit: '\u2014',
      cat: 'losses',
      desc: 'The Darcy friction factor f depends on the flow regime. For laminar flow (Re < 2300): f = 64/Re \u2014 it depends only on Reynolds number and decreases as Re increases. For turbulent flow in smooth pipes, f can be approximated by the Blasius equation: f = 0.316/Re^0.25 (for Re < 10\u2075). For rough pipes, the Colebrook equation applies: 1/\u221Af = \u22122.0\u00B7log(\u03B5/(3.7D) + 2.51/(Re\u221Af)). The Swamee-Jain approximation gives a direct solution without iteration.',
      diagram: 'frictionFactor',
      example: { problem: 'Water flows in a smooth pipe with Re = 50000. Estimate f using the Blasius equation.', steps: ['Blasius: f = 0.316 / Re^0.25', 'f = 0.316 / 50000^0.25', 'f = 0.316 / 14.95', 'f = 0.0211'], answer: 0.0211, unit: '' }
    },
    {
      id: 'major-losses', name: 'Major Losses', symbol: 'h_f',
      formula: 'h_f = f(L/D)(V\u00B2/2g), \u0394P = \u03C1gh_f', unit: 'm, Pa',
      cat: 'losses',
      desc: 'Major losses (also called friction losses) occur along the entire length of the pipe due to viscous shear between the fluid and the pipe wall. They are calculated using the Darcy-Weisbach equation: h_f = f(L/D)(V\u00B2/2g). Major losses are proportional to pipe length L and inversely proportional to diameter D. For a given flow rate, doubling the pipe diameter reduces major losses by a factor of about 32 (since h_f \u221D 1/D\u2075 for a given Q). This is why engineers select the largest economically viable pipe diameter.',
      diagram: 'majorLosses',
      example: { problem: 'Water (f=0.025) flows at 2 m/s in a 150 mm pipe, 200 m long. Find h_f and \u0394P (\u03C1=998 kg/m\u00B3).', steps: ['h_f = 0.025 \u00D7 (200/0.15) \u00D7 (2\u00B2/(2\u00D79.81))', 'h_f = 0.025 \u00D7 1333.3 \u00D7 0.2039', 'h_f = 6.80 m', '\u0394P = 998 \u00D7 9.81 \u00D7 6.80 = 66,595 Pa \u2248 66.6 kPa'], answer: 6.80, unit: 'm' }
    },
    {
      id: 'minor-losses', name: 'Minor Losses', symbol: 'h_m',
      formula: 'h_m = K(V\u00B2/2g)', unit: 'm',
      cat: 'losses',
      desc: 'Minor losses occur at pipe fittings, bends, valves, expansions, contractions, and entrances/exits. They are calculated as h_m = K(V\u00B2/2g), where K is the loss coefficient. Typical K values: 90\u00B0 elbow (K\u22480.9), 45\u00B0 elbow (K\u22480.4), gate valve fully open (K\u22480.2), globe valve (K\u224810), sudden expansion (K=(1\u2212A\u2081/A\u2082)\u00B2), sudden contraction (K\u22480.5), pipe entrance (K=0.5), pipe exit (K=1.0). Despite being called "minor", these losses can dominate in short pipe systems with many fittings.',
      diagram: 'minorLosses',
      example: { problem: 'Water flows at 3 m/s through a system with 4 elbows (K=0.9 each) and 1 gate valve (K=0.2). Find total minor head loss.', steps: ['h_m = \u03A3K \u00D7 V\u00B2/(2g)', 'Total K = 4\u00D70.9 + 1\u00D70.2 = 3.8', 'V\u00B2/(2g) = 9/(2\u00D79.81) = 0.459 m', 'h_m = 3.8 \u00D7 0.459 = 1.74 m'], answer: 1.74, unit: 'm' }
    },
    {
      id: 'moody-diagram', name: 'Moody Diagram', symbol: 'f vs Re',
      formula: 'f = fn(Re, \u03B5/D) \u2014 Moody Chart', unit: '\u2014',
      cat: 'losses',
      desc: 'The Moody diagram (or Moody chart) is a graphical representation of the Darcy friction factor f as a function of Reynolds number Re and relative roughness \u03B5/D. It shows three regions: (1) Laminar zone (Re < 2300): f = 64/Re, a straight line on log-log axes. (2) Transition zone (2300 < Re < 4000): unstable, dashed region. (3) Turbulent zone: a family of curves for different \u03B5/D values. At very high Re, f becomes independent of Re and depends only on \u03B5/D (fully rough zone). Common roughness values: smooth pipe \u03B5\u22480, PVC \u03B5=0.0015 mm, commercial steel \u03B5=0.045 mm, cast iron \u03B5=0.26 mm.',
      diagram: 'moodyDiagram',
      example: { problem: 'A commercial steel pipe (\u03B5=0.045 mm, D=100 mm) carries water at Re=100000. Estimate the relative roughness and use it to interpret the Moody diagram.', steps: ['\u03B5/D = 0.045/100 = 0.00045', 'At Re=100000 and \u03B5/D=0.00045', 'From Moody diagram: f \u2248 0.019', 'In the turbulent zone, between smooth and fully rough'], answer: 0.019, unit: '' }
    }
  ];

  /* ================================================================
     DATA — PROBLEM GENERATORS
     ================================================================ */

  var PROBLEM_GEN = [
    /* 0 — Reynolds number calculation */
    function () {
      var D = randInt(20, 200);
      var V = +(Math.random() * 4 + 0.5).toFixed(1);
      var rho = 998; var mu = 0.001;
      var Re = Math.round(rho * V * (D / 1000) / mu);
      return { prompt: 'Water (\u03C1=998 kg/m\u00B3, \u03BC=0.001 Pa\u00B7s) flows at ' + V + ' m/s in a ' + D + ' mm pipe. Calculate the Reynolds number.', steps: ['Re = \u03C1VD/\u03BC', 'Re = 998 \u00D7 ' + V + ' \u00D7 ' + (D / 1000) + ' / 0.001', 'Re = ' + (998 * V * D / 1000).toFixed(2) + ' / 0.001', 'Re = ' + Re], answer: Re, unit: '' };
    },
    /* 1 — Flow regime identification */
    function () {
      var D = randInt(10, 100);
      var V = +(Math.random() * 2 + 0.05).toFixed(2);
      var rho = 880; var mu = 0.03;
      var Re = Math.round(rho * V * (D / 1000) / mu);
      var regime = Re < 2300 ? 'Laminar' : Re < 4000 ? 'Transitional' : 'Turbulent';
      return { prompt: 'Oil (\u03C1=880 kg/m\u00B3, \u03BC=0.03 Pa\u00B7s) flows at ' + V + ' m/s in a ' + D + ' mm pipe. Find Re and state the flow regime.', steps: ['Re = \u03C1VD/\u03BC', 'Re = 880 \u00D7 ' + V + ' \u00D7 ' + (D / 1000) + ' / 0.03', 'Re = ' + Re, 'Flow is ' + regime + ' (Re ' + (Re < 2300 ? '< 2300' : Re < 4000 ? 'between 2300-4000' : '> 4000') + ')'], answer: Re, unit: '' };
    },
    /* 2 — Head loss Darcy-Weisbach */
    function () {
      var L = randInt(10, 100);
      var D = randInt(50, 300);
      var V = +(Math.random() * 3 + 1).toFixed(1);
      var f = +(Math.random() * 0.02 + 0.015).toFixed(4);
      var hf = +(f * (L / (D / 1000)) * (V * V / (2 * 9.81))).toFixed(2);
      return { prompt: 'Water flows at ' + V + ' m/s in a ' + D + ' mm pipe, ' + L + ' m long (f=' + f + '). Find the head loss h_f (m).', steps: ['h_f = f(L/D)(V\u00B2/2g)', 'h_f = ' + f + ' \u00D7 (' + L + '/' + (D / 1000) + ') \u00D7 (' + V + '\u00B2/(2\u00D79.81))', 'h_f = ' + f + ' \u00D7 ' + (L / (D / 1000)).toFixed(1) + ' \u00D7 ' + (V * V / (2 * 9.81)).toFixed(4), 'h_f = ' + hf + ' m'], answer: hf, unit: 'm' };
    },
    /* 3 — Pressure drop from head loss */
    function () {
      var hf = +(Math.random() * 8 + 1).toFixed(1);
      var rho = 998;
      var dp = +(rho * 9.81 * hf / 1000).toFixed(1);
      return { prompt: 'A pipe has a friction head loss of ' + hf + ' m. For water (\u03C1=998 kg/m\u00B3), find the pressure drop in kPa.', steps: ['\u0394P = \u03C1 \u00D7 g \u00D7 h_f', '\u0394P = 998 \u00D7 9.81 \u00D7 ' + hf, '\u0394P = ' + (rho * 9.81 * hf).toFixed(0) + ' Pa', '\u0394P = ' + dp + ' kPa'], answer: dp, unit: 'kPa' };
    },
    /* 4 — Laminar friction factor */
    function () {
      var Re = randInt(200, 2200);
      var f = +(64 / Re).toFixed(4);
      return { prompt: 'Flow in a pipe has Re = ' + Re + '. Assuming laminar flow, find the Darcy friction factor.', steps: ['For laminar flow: f = 64/Re', 'f = 64/' + Re, 'f = ' + f, 'Valid because Re < 2300'], answer: +f, unit: '' };
    },
    /* 5 — Flow rate from velocity */
    function () {
      var D = randInt(25, 200);
      var V = +(Math.random() * 3 + 0.5).toFixed(1);
      var A = Math.PI * Math.pow(D / 2000, 2);
      var Q = +(A * V * 1000).toFixed(2);
      return { prompt: 'Water flows at ' + V + ' m/s in a ' + D + ' mm diameter pipe. Calculate the flow rate in L/s.', steps: ['A = \u03C0D\u00B2/4 = \u03C0(' + (D / 1000) + ')\u00B2/4', 'A = ' + A.toFixed(6) + ' m\u00B2', 'Q = A \u00D7 V = ' + A.toFixed(6) + ' \u00D7 ' + V, 'Q = ' + Q + ' L/s'], answer: Q, unit: 'L/s' };
    },
    /* 6 — Minor loss calculation */
    function () {
      var V = +(Math.random() * 3 + 1).toFixed(1);
      var nElbows = randInt(2, 6);
      var K = +(nElbows * 0.9).toFixed(1);
      var hm = +(K * V * V / (2 * 9.81)).toFixed(2);
      return { prompt: 'Water flows at ' + V + ' m/s through ' + nElbows + ' standard 90\u00B0 elbows (K=0.9 each). Find the total minor head loss (m).', steps: ['Total K = ' + nElbows + ' \u00D7 0.9 = ' + K, 'V\u00B2/(2g) = ' + V + '\u00B2/(2\u00D79.81) = ' + (V * V / (2 * 9.81)).toFixed(4) + ' m', 'h_m = K \u00D7 V\u00B2/(2g)', 'h_m = ' + K + ' \u00D7 ' + (V * V / (2 * 9.81)).toFixed(4) + ' = ' + hm + ' m'], answer: hm, unit: 'm' };
    },
    /* 7 — Continuity equation */
    function () {
      var D1 = randInt(50, 150);
      var D2 = randInt(20, D1 - 10);
      var V1 = +(Math.random() * 2 + 0.5).toFixed(1);
      var V2 = +(V1 * Math.pow(D1 / D2, 2)).toFixed(2);
      return { prompt: 'Water flows at ' + V1 + ' m/s in a ' + D1 + ' mm pipe that contracts to ' + D2 + ' mm. Find the velocity in the narrow pipe (m/s).', steps: ['A\u2081V\u2081 = A\u2082V\u2082', 'V\u2082 = V\u2081 \u00D7 (D\u2081/D\u2082)\u00B2', 'V\u2082 = ' + V1 + ' \u00D7 (' + D1 + '/' + D2 + ')\u00B2', 'V\u2082 = ' + V2 + ' m/s'], answer: V2, unit: 'm/s' };
    },
    /* 8 — Maximum velocity in laminar flow */
    function () {
      var Vavg = +(Math.random() * 1.5 + 0.2).toFixed(1);
      var Vmax = +(2 * Vavg).toFixed(1);
      return { prompt: 'Laminar flow in a pipe has an average velocity of ' + Vavg + ' m/s. What is the maximum (centreline) velocity?', steps: ['For laminar pipe flow:', 'V_max = 2 \u00D7 V_avg', 'V_max = 2 \u00D7 ' + Vavg, 'V_max = ' + Vmax + ' m/s'], answer: Vmax, unit: 'm/s' };
    },
    /* 9 — Total head loss */
    function () {
      var hf = +(Math.random() * 5 + 1).toFixed(1);
      var hm = +(Math.random() * 2 + 0.3).toFixed(1);
      var total = +(+hf + +hm).toFixed(1);
      return { prompt: 'A pipe system has major losses h_f = ' + hf + ' m and minor losses h_m = ' + hm + ' m. Find the total head loss (m).', steps: ['h_total = h_f + h_m', 'h_total = ' + hf + ' + ' + hm, 'h_total = ' + total + ' m', 'Major + Minor losses combined'], answer: total, unit: 'm' };
    }
  ];

  /* ================================================================
     DATA — QUIZ POOL
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ 0-9 */
    { type: 'mcq', prompt: 'The Reynolds number for pipe flow is defined as:', options: ['Re = \u03C1VD/\u03BC', 'Re = \u03BCV/\u03C1D', 'Re = VD/g', 'Re = \u03C1gD/\u03BC'], correct: 0 },
    { type: 'mcq', prompt: 'Laminar flow in a pipe occurs when:', options: ['Re < 2300', 'Re > 4000', 'Re > 2300', 'Re = 0'], correct: 0 },
    { type: 'mcq', prompt: 'In fully developed laminar pipe flow, the velocity profile is:', options: ['Parabolic', 'Uniform (flat)', 'Linear', 'Logarithmic'], correct: 0 },
    { type: 'mcq', prompt: 'The Darcy friction factor for laminar flow is:', options: ['f = 64/Re', 'f = 128/Re', 'f = 0.316/Re\u00B9\u2074', 'f = Re/64'], correct: 0 },
    { type: 'mcq', prompt: 'The Darcy-Weisbach equation for head loss is:', options: ['h_f = f(L/D)(V\u00B2/2g)', 'h_f = f(D/L)(V\u00B2/2g)', 'h_f = f(L/D)(V/2g)', 'h_f = (L/D)(V\u00B2/2g)'], correct: 0 },
    { type: 'mcq', prompt: 'Minor losses in pipe systems are caused by:', options: ['Fittings, bends, valves, and changes in cross-section', 'Friction along the pipe wall only', 'Gravity and elevation changes', 'Temperature variations in the fluid'], correct: 0 },
    { type: 'mcq', prompt: 'The Hydraulic Grade Line (HGL) represents:', options: ['Pressure head + elevation head (P/\u03C1g + z)', 'Total energy head (P/\u03C1g + V\u00B2/2g + z)', 'Velocity head only (V\u00B2/2g)', 'Elevation head only (z)'], correct: 0 },
    { type: 'mcq', prompt: 'If a pipe diameter is halved while maintaining the same flow rate, the velocity:', options: ['Increases by a factor of 4', 'Increases by a factor of 2', 'Decreases by a factor of 2', 'Stays the same'], correct: 0 },
    { type: 'mcq', prompt: 'In the Moody diagram, at very high Reynolds numbers, the friction factor:', options: ['Depends only on relative roughness \u03B5/D', 'Depends only on Reynolds number', 'Approaches zero', 'Equals 64/Re'], correct: 0 },
    { type: 'mcq', prompt: 'The ratio of maximum to average velocity in laminar pipe flow is:', options: ['2.0', '1.0', '1.5', '3.0'], correct: 0 },
    /* Numeric 10-14 */
    { type: 'numeric', prompt: 'Water (\u03C1=998 kg/m\u00B3, \u03BC=0.001 Pa\u00B7s) flows at 1.5 m/s in a 80 mm pipe. Find Re.', answer: 119760, unit: '', steps: ['Re = 998\u00D71.5\u00D70.08/0.001', 'Re = 119,760'] },
    { type: 'numeric', prompt: 'Find h_f for f=0.02, L=20 m, D=50 mm, V=2 m/s. (m)', answer: 1.63, unit: 'm', steps: ['h_f = 0.02\u00D7(20/0.05)\u00D7(4/19.62)', 'h_f = 0.02\u00D7400\u00D70.2039 = 1.63 m'] },
    { type: 'numeric', prompt: 'Laminar flow with Re=800. What is the Darcy friction factor?', answer: 0.08, unit: '', steps: ['f = 64/Re = 64/800', 'f = 0.08'] },
    { type: 'numeric', prompt: 'Water (V=2.5 m/s) passes through 3 elbows (K=0.9 each). Find minor head loss (m).', answer: 0.86, unit: 'm', steps: ['K_total = 3\u00D70.9 = 2.7', 'h_m = 2.7\u00D7(2.5\u00B2/19.62) = 2.7\u00D70.3184 = 0.86 m'] },
    { type: 'numeric', prompt: 'Water flows at 3 m/s in a 100 mm pipe. Find Q in L/s.', answer: 23.56, unit: 'L/s', steps: ['A = \u03C0(0.1)\u00B2/4 = 0.007854 m\u00B2', 'Q = 0.007854\u00D73 = 0.02356 m\u00B3/s = 23.56 L/s'] }
  ];

  /* ================================================================
     FLUID & PIPE DATA
     ================================================================ */
  var FLUIDS = {
    water:    { name: 'Water (20\u00B0C)',   rho: 998,   mu: 1.002e-3 },
    oil:      { name: 'Oil',               rho: 880,   mu: 0.08 },
    air:      { name: 'Air (20\u00B0C)',     rho: 1.204, mu: 1.825e-5 },
    glycerin: { name: 'Glycerin (20\u00B0C)', rho: 1261,  mu: 1.412 }
  };

  var PIPES = {
    smooth: { name: 'Smooth',          epsilon: 0 },
    pvc:    { name: 'PVC',             epsilon: 0.0015e-3 },
    steel:  { name: 'Commercial Steel', epsilon: 0.045e-3 },
    iron:   { name: 'Cast Iron',        epsilon: 0.26e-3 }
  };

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

  /* Simulate state */
  var fluidKey = 'water';
  var pipeKey = 'smooth';
  var pipeDia = 50;       /* mm */
  var pipeLen = 10;       /* m */
  var flowVel = 1.0;      /* m/s */
  var numBends = 0;

  /* Derived values */
  var Re = 0, frictionFactor = 0, headLossMajor = 0, headLossMinor = 0;
  var pressureDrop = 0, flowRate = 0, flowRegime = 'Laminar';

  /* Animation */
  var animTime = 0;
  var animFrame = null;

  /* Explore */
  var selCat = 'basics';
  var selConcept = 0;

  /* Practice */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* Hover */
  var hoverX = -1;

  /* Unit system */
  var useImperial = false;

  /* ================================================================
     PHYSICS ENGINE
     ================================================================ */

  function calculateAll() {
    var fluid = FLUIDS[fluidKey];
    var pipe = PIPES[pipeKey];
    var D = pipeDia / 1000;  /* m */
    var L = pipeLen;          /* m */
    var V = flowVel;          /* m/s */
    var rho = fluid.rho;
    var mu = fluid.mu;
    var g = 9.81;

    /* Reynolds number */
    Re = rho * V * D / mu;

    /* Flow regime */
    if (Re < 2300) flowRegime = 'Laminar';
    else if (Re < 4000) flowRegime = 'Transitional';
    else flowRegime = 'Turbulent';

    /* Friction factor */
    if (Re < 1) {
      frictionFactor = 0;
    } else if (Re < 2300) {
      /* Laminar: f = 64/Re */
      frictionFactor = 64 / Re;
    } else {
      /* Turbulent: Swamee-Jain approximation of Colebrook equation */
      var epsD = pipe.epsilon / D; /* relative roughness */
      if (epsD < 1e-12) epsD = 1e-7; /* smooth pipe limit */
      frictionFactor = 0.25 / Math.pow(Math.log10(epsD / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    }

    /* Major head loss: Darcy-Weisbach */
    headLossMajor = frictionFactor * (L / D) * (V * V / (2 * g));

    /* Minor losses: K = 0.9 per 90-degree elbow */
    var Ktotal = numBends * 0.9;
    headLossMinor = Ktotal * (V * V / (2 * g));

    /* Pressure drop (total) */
    var totalHL = headLossMajor + headLossMinor;
    pressureDrop = rho * g * totalHL;

    /* Flow rate Q = A * V */
    var A = Math.PI * D * D / 4;
    flowRate = A * V * 1000; /* L/s */
  }

  /* ================================================================
     DRAWING — LAYOUT ZONES
     ================================================================ */
  var PIPE_Y0 = 10, PIPE_Y1 = 280;
  var GRADE_Y0 = 290, GRADE_Y1 = 510;
  var MARGIN_L = 80, MARGIN_R = 60;
  var pipeDrawL = MARGIN_L;
  var pipeDrawR = W - MARGIN_R;

  function pipeX(frac) { return pipeDrawL + frac * (pipeDrawR - pipeDrawL); }

  /* ================================================================
     DRAWING — SIMULATE MODE
     ================================================================ */

  function drawSimulate() {
    var fluid = FLUIDS[fluidKey];
    var D = pipeDia / 1000;
    var g = 9.81;

    /* ── Zone labels ── */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#00695c';
    ctx.fillText('PIPE FLOW VISUALIZATION', 8, PIPE_Y0 + 2);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('HGL & EGL', 8, GRADE_Y0 + 2);

    /* ── Pipe body ── */
    var pipeTopY = 80;
    var pipeBotY = 200;
    var pipeCenterY = (pipeTopY + pipeBotY) / 2;
    var pipeHeight = pipeBotY - pipeTopY;

    /* Pipe walls */
    ctx.strokeStyle = '#00695c'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pipeDrawL, pipeTopY); ctx.lineTo(pipeDrawR, pipeTopY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pipeDrawL, pipeBotY); ctx.lineTo(pipeDrawR, pipeBotY);
    ctx.stroke();

    /* Pipe end caps */
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pipeDrawL, pipeTopY - 8); ctx.lineTo(pipeDrawL, pipeBotY + 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pipeDrawR, pipeTopY - 8); ctx.lineTo(pipeDrawR, pipeBotY + 8);
    ctx.stroke();

    /* ── Pipe interior fill ── */
    var flowColor = Re < 2300 ? 'rgba(66,165,245,0.08)' : Re < 4000 ? 'rgba(255,193,7,0.08)' : 'rgba(255,112,67,0.08)';
    ctx.fillStyle = flowColor;
    ctx.fillRect(pipeDrawL + 2, pipeTopY + 2, pipeDrawR - pipeDrawL - 4, pipeHeight - 4);

    /* ── Velocity profile ── */
    drawVelocityProfile(pipeTopY, pipeBotY, pipeCenterY, pipeHeight);

    /* ── Animated fluid particles ── */
    drawFluidParticles(pipeTopY, pipeBotY, pipeCenterY, pipeHeight);

    /* ── Bends / fittings ── */
    drawFittings(pipeTopY, pipeBotY);

    /* ── Dimension labels ── */
    drawDimensions(pipeTopY, pipeBotY);

    /* ── Pressure gradient arrows ── */
    drawPressureGradient(pipeCenterY);

    /* ── Flow direction arrow ── */
    ctx.fillStyle = '#dde3f0'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Flow \u2192', (pipeDrawL + pipeDrawR) / 2, pipeTopY - 12);

    /* ── Regime badge ── */
    var badgeColor = Re < 2300 ? '#42a5f5' : Re < 4000 ? '#ffc107' : '#ff7043';
    var badgeX = pipeDrawR - 80;
    var badgeY = pipeTopY - 26;
    ctx.fillStyle = badgeColor;
    ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.roundRect(badgeX - 2, badgeY - 2, 92, 20, 6); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = badgeColor;
    ctx.textAlign = 'center';
    ctx.fillText(flowRegime, badgeX + 44, badgeY + 13);

    /* ── HGL & EGL diagram ── */
    drawGradeLines();

    /* ── Hover crosshair ── */
    if (hoverX >= 0 && hoverX <= 1) {
      drawHoverLine(pipeCenterY, pipeTopY, pipeBotY);
    }
  }

  function drawVelocityProfile(topY, botY, centerY, height) {
    var profileX = pipeDrawL + 35;
    var halfH = height / 2 - 4;
    var nPts = 40;
    var maxVelPx = 60;

    ctx.beginPath();
    for (var i = 0; i <= nPts; i++) {
      var frac = i / nPts;         /* 0 to 1 across pipe height */
      var r = (frac - 0.5) * 2;   /* -1 to +1 from centre */
      var absR = Math.abs(r);
      var velFrac;

      if (Re < 2300) {
        /* Laminar: parabolic u(r) = 2V(1 - (r/R)^2) */
        velFrac = 1 - r * r;
      } else {
        /* Turbulent: power law u(r) = Umax(1 - |r|)^(1/7) */
        velFrac = Math.pow(1 - absR, 1 / 7);
      }

      var vx = profileX + velFrac * maxVelPx;
      var vy = topY + 2 + frac * (height - 4);

      if (i === 0) ctx.moveTo(profileX, vy);
      ctx.lineTo(vx, vy);
    }
    /* Close back */
    ctx.lineTo(profileX, botY - 2);
    ctx.closePath();

    var profileColor = Re < 2300 ? 'rgba(66,165,245,0.35)' : Re < 4000 ? 'rgba(255,193,7,0.35)' : 'rgba(255,112,67,0.35)';
    ctx.fillStyle = profileColor;
    ctx.fill();

    /* Profile outline */
    ctx.strokeStyle = Re < 2300 ? '#42a5f5' : Re < 4000 ? '#ffc107' : '#ff7043';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var j = 0; j <= nPts; j++) {
      var fracJ = j / nPts;
      var rJ = (fracJ - 0.5) * 2;
      var velFracJ;
      if (Re < 2300) {
        velFracJ = 1 - rJ * rJ;
      } else {
        velFracJ = Math.pow(1 - Math.abs(rJ), 1 / 7);
      }
      var vxJ = profileX + velFracJ * maxVelPx;
      var vyJ = topY + 2 + fracJ * (height - 4);
      if (j === 0) ctx.moveTo(vxJ, vyJ);
      else ctx.lineTo(vxJ, vyJ);
    }
    ctx.stroke();

    /* Baseline (pipe wall zero line) */
    ctx.strokeStyle = 'rgba(107,122,153,0.4)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(profileX, topY + 2); ctx.lineTo(profileX, botY - 2);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Label */
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('u(r)', profileX + maxVelPx / 2, botY + 4);

    /* V_max label */
    ctx.font = '700 9px "Courier New", monospace';
    var vMaxColor = Re < 2300 ? '#42a5f5' : '#ff7043';
    ctx.fillStyle = vMaxColor;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    var vmax = Re < 2300 ? 2 * flowVel : flowVel / 0.82;
    var vmaxStr = useImperial
      ? 'V=' + (vmax * 3.281).toFixed(2) + 'ft/s'
      : 'V=' + vmax.toFixed(2) + 'm/s';
    ctx.fillText(vmaxStr, profileX + maxVelPx + 5, centerY);
  }

  function drawFluidParticles(topY, botY, centerY, height) {
    var pipeW = pipeDrawR - pipeDrawL;
    var nParticles = 50;
    var seed = 42;

    for (var i = 0; i < nParticles; i++) {
      /* Pseudo-random but deterministic positions */
      seed = (seed * 16807 + i * 97) % 2147483647;
      var px = (seed % 10000) / 10000;
      seed = (seed * 16807 + i * 31) % 2147483647;
      var py = (seed % 10000) / 10000;

      var r = (py - 0.5) * 2; /* -1 to +1 */
      var absR = Math.abs(r);
      var velFrac;
      if (Re < 2300) {
        velFrac = 1 - r * r;
      } else {
        velFrac = Math.pow(1 - absR, 1 / 7);
      }

      /* Animate x position based on local velocity */
      var speed = velFrac * 0.02 * clamp(flowVel, 0.1, 10);
      var xPos = ((px + animTime * speed) % 1);
      var drawX = pipeDrawL + 4 + xPos * (pipeW - 8);
      var drawY = topY + 4 + py * (height - 8);

      /* Particle size and color */
      var alpha = 0.3 + velFrac * 0.5;
      var particleColor = Re < 2300 ? 'rgba(66,165,245,' + alpha + ')' : Re < 4000 ? 'rgba(255,193,7,' + alpha + ')' : 'rgba(255,112,67,' + alpha + ')';
      ctx.fillStyle = particleColor;
      var size = 1.5 + velFrac * 2;
      ctx.beginPath();
      ctx.arc(drawX, drawY, size, 0, Math.PI * 2);
      ctx.fill();

      /* In turbulent flow, add some vertical wobble */
      if (Re > 4000) {
        var wobble = Math.sin(animTime * 8 + i * 1.7) * 3 * (1 - absR);
        drawY += wobble;
        ctx.beginPath();
        ctx.arc(drawX + wobble * 0.5, drawY, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawFittings(topY, botY) {
    if (numBends < 1) return;
    var pipeW = pipeDrawR - pipeDrawL;
    var spacing = pipeW / (numBends + 1);

    for (var i = 1; i <= numBends; i++) {
      var cx = pipeDrawL + spacing * i;
      var cy = (topY + botY) / 2;

      /* Elbow fitting symbol */
      ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.stroke();

      /* K label */
      ctx.fillStyle = '#ab47bc';
      ctx.font = '600 8px "Courier New", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('K=0.9', cx, botY + 4);

      /* Connecting dashed lines to pipe walls */
      ctx.strokeStyle = 'rgba(171,71,188,0.3)'; ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(cx, topY); ctx.lineTo(cx, topY + 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, botY); ctx.lineTo(cx, botY - 10);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawDimensions(topY, botY) {
    /* Pipe length dimension */
    var dimY = botY + 25;
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(pipeDrawL, dimY); ctx.lineTo(pipeDrawR, dimY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6b7a99'; ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var lenLabel = useImperial
      ? 'L = ' + (pipeLen * 3.281).toFixed(1) + ' ft'
      : 'L = ' + pipeLen.toFixed(1) + ' m';
    ctx.fillText(lenLabel, (pipeDrawL + pipeDrawR) / 2, dimY + 4);

    /* Pipe diameter dimension (on right side) */
    var dimX = pipeDrawR + 15;
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(dimX, topY); ctx.lineTo(dimX, botY);
    ctx.stroke();
    /* Ticks */
    ctx.beginPath();
    ctx.moveTo(dimX - 4, topY); ctx.lineTo(dimX + 4, topY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dimX - 4, botY); ctx.lineTo(dimX + 4, botY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.save();
    ctx.translate(dimX + 14, (topY + botY) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#6b7a99'; ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var diaLabel = useImperial
      ? 'D = ' + (pipeDia / 25.4).toFixed(2) + ' in'
      : 'D = ' + pipeDia + ' mm';
    ctx.fillText(diaLabel, 0, 0);
    ctx.restore();
  }

  function drawPressureGradient(centerY) {
    /* Pressure arrows at inlet and outlet */
    var arrowLen = 30;

    /* Inlet pressure (larger) */
    var inX = pipeDrawL - 25;
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(inX, centerY - arrowLen); ctx.lineTo(inX, centerY + arrowLen);
    ctx.stroke();
    /* Arrow heads (pointing inward toward pipe) */
    ctx.fillStyle = '#ab47bc';
    ctx.beginPath();
    ctx.moveTo(inX + 8, centerY); ctx.lineTo(inX, centerY - 5); ctx.lineTo(inX, centerY + 5); ctx.closePath();
    ctx.fill();
    ctx.font = '700 9px "Courier New", monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('P\u2081', inX - 10, centerY);

    /* Outlet pressure (smaller) */
    var outX = pipeDrawR + 45;
    var outArrow = Math.max(10, arrowLen * (1 - (headLossMajor + headLossMinor) / Math.max(pressureDrop / (FLUIDS[fluidKey].rho * 9.81), 1)));
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(outX, centerY - outArrow); ctx.lineTo(outX, centerY + outArrow);
    ctx.stroke();
    ctx.fillStyle = '#ab47bc';
    ctx.beginPath();
    ctx.moveTo(outX - 8, centerY); ctx.lineTo(outX, centerY - 5); ctx.lineTo(outX, centerY + 5); ctx.closePath();
    ctx.fill();
    ctx.fillText('P\u2082', outX + 10, centerY);
  }

  function drawGradeLines() {
    var zoneH = GRADE_Y1 - GRADE_Y0;
    var margin = 30;
    var plotTop = GRADE_Y0 + margin;
    var plotBot = GRADE_Y1 - 15;
    var plotH = plotBot - plotTop;

    var g = 9.81;
    var V = flowVel;
    var rho = FLUIDS[fluidKey].rho;
    var D = pipeDia / 1000;

    /* Calculate total energy at inlet (arbitrary datum, z=0) */
    var velHead = V * V / (2 * g);
    var totalHLoss = headLossMajor + headLossMinor;

    /* Assume inlet pressure head gives some height */
    var P1_head = 20; /* arbitrary reference */
    var eglInlet = P1_head + velHead;
    var hglInlet = P1_head;
    var eglOutlet = eglInlet - totalHLoss;
    var hglOutlet = eglOutlet - velHead;

    /* Scale to fit */
    var maxVal = eglInlet + 2;
    var minVal = Math.min(hglOutlet - 2, 0);
    var range = maxVal - minVal;
    if (range < 1) range = 1;

    function yForVal(val) { return plotBot - ((val - minVal) / range) * plotH; }

    /* Zero axis */
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    var zeroY = yForVal(0);
    if (zeroY >= plotTop && zeroY <= plotBot) {
      ctx.moveTo(pipeDrawL, zeroY); ctx.lineTo(pipeDrawR, zeroY);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    /* Y-axis label */
    ctx.save();
    ctx.translate(MARGIN_L - 40, (plotTop + plotBot) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(useImperial ? 'Head (ft)' : 'Head (m)', 0, 0);
    ctx.restore();

    /* Determine bend positions for step losses */
    var bendPositions = [];
    if (numBends > 0) {
      for (var b = 1; b <= numBends; b++) {
        bendPositions.push(b / (numBends + 1));
      }
    }
    var lossPerBend = numBends > 0 ? headLossMinor / numBends : 0;

    /* EGL line (total head) — drops linearly for friction, steps at bends */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    var N = 200;
    for (var i = 0; i <= N; i++) {
      var frac = i / N;
      /* Major loss is proportional to distance */
      var majorAtX = headLossMajor * frac;
      /* Minor losses step at bend positions */
      var minorAtX = 0;
      for (var bi = 0; bi < bendPositions.length; bi++) {
        if (frac >= bendPositions[bi]) minorAtX += lossPerBend;
      }
      var eglVal = eglInlet - majorAtX - minorAtX;
      var px = pipeX(frac);
      var py = yForVal(eglVal);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    /* HGL line (EGL minus velocity head) */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var j = 0; j <= N; j++) {
      var fracJ = j / N;
      var majorAtJ = headLossMajor * fracJ;
      var minorAtJ = 0;
      for (var bj = 0; bj < bendPositions.length; bj++) {
        if (fracJ >= bendPositions[bj]) minorAtJ += lossPerBend;
      }
      var eglJ = eglInlet - majorAtJ - minorAtJ;
      var hglJ = eglJ - velHead;
      var pxJ = pipeX(fracJ);
      var pyJ = yForVal(hglJ);
      if (j === 0) ctx.moveTo(pxJ, pyJ); else ctx.lineTo(pxJ, pyJ);
    }
    ctx.stroke();

    /* Velocity head gap annotation */
    var midFrac = 0.5;
    var midMajor = headLossMajor * midFrac;
    var midMinor = 0;
    for (var bm = 0; bm < bendPositions.length; bm++) {
      if (midFrac >= bendPositions[bm]) midMinor += lossPerBend;
    }
    var midEgl = eglInlet - midMajor - midMinor;
    var midHgl = midEgl - velHead;
    var midPx = pipeX(midFrac);
    var eglPy = yForVal(midEgl);
    var hglPy = yForVal(midHgl);

    if (Math.abs(eglPy - hglPy) > 8) {
      ctx.strokeStyle = 'rgba(221,227,240,0.4)'; ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(midPx + 3, eglPy); ctx.lineTo(midPx + 3, hglPy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 8px "Segoe UI", sans-serif';
      ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('V\u00B2/2g', midPx + 7, (eglPy + hglPy) / 2);
    }

    /* Legend */
    var legX = pipeDrawL + 5;
    var legY = GRADE_Y0 + 16;
    ctx.font = '600 10px "Segoe UI", sans-serif';
    /* EGL legend */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(legX, legY); ctx.lineTo(legX + 20, legY); ctx.stroke();
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('EGL (Total Head)', legX + 25, legY);
    /* HGL legend */
    ctx.strokeStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(legX + 180, legY); ctx.lineTo(legX + 200, legY); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('HGL (Pressure + Elevation)', legX + 205, legY);

    /* Head loss annotation */
    ctx.font = '700 10px "Courier New", monospace';
    ctx.fillStyle = '#ff5555';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    var hlTotal = headLossMajor + headLossMinor;
    var hlText = useImperial
      ? 'h_total = ' + (hlTotal * 3.281).toFixed(2) + ' ft'
      : 'h_total = ' + hlTotal.toFixed(2) + ' m';
    ctx.fillText(hlText, pipeDrawR, GRADE_Y0 + 16);
  }

  function drawHoverLine(centerY, topY, botY) {
    var hx = pipeX(hoverX);
    ctx.strokeStyle = 'rgba(221,227,240,0.3)'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(hx, PIPE_Y0); ctx.lineTo(hx, GRADE_Y1);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Info badge */
    var IMP = useImperial;
    var xDistM = hoverX * pipeLen;
    var xDistStr = IMP ? (xDistM * 3.281).toFixed(2) + ' ft' : xDistM.toFixed(2) + ' m';
    var majorAtHover = headLossMajor * hoverX;

    /* Minor losses at hover point */
    var minorAtHover = 0;
    if (numBends > 0) {
      var lossPerBend = headLossMinor / numBends;
      for (var b = 1; b <= numBends; b++) {
        if (hoverX >= b / (numBends + 1)) minorAtHover += lossPerBend;
      }
    }

    var hlAtHover = majorAtHover + minorAtHover;
    var pAtHoverPa = pressureDrop > 0 ? (1 - hlAtHover / ((headLossMajor + headLossMinor) || 1)) * pressureDrop : 0;
    var hlStr = IMP ? (hlAtHover * 3.281).toFixed(3) + ' ft' : hlAtHover.toFixed(3) + ' m';
    var pStr  = IMP ? (pAtHoverPa / 6894.76).toFixed(4) + ' psi' : pAtHoverPa.toFixed(0) + ' Pa';

    ctx.fillStyle = 'rgba(13,17,23,0.9)';
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 1;
    var bx = Math.min(hx + 10, W - 170);
    ctx.beginPath(); ctx.roundRect(bx, PIPE_Y0 + 10, 160, 74, 8); ctx.fill(); ctx.stroke();
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('x = ' + xDistStr, bx + 8, PIPE_Y0 + 16);
    ctx.fillStyle = '#ff7043';
    ctx.fillText('h_loss = ' + hlStr, bx + 8, PIPE_Y0 + 32);
    ctx.fillStyle = '#ab47bc';
    ctx.fillText('\u0394P = ' + pStr, bx + 8, PIPE_Y0 + 48);
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('Re = ' + Math.round(Re), bx + 8, PIPE_Y0 + 64);
  }

  /* ================================================================
     DRAWING — EXPLORE MINI-DIAGRAMS
     ================================================================ */

  function drawConceptDiagram(concept) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    var fn = {
      'fluidProps': drawFluidPropsDiag,
      'reynolds': drawReynoldsDiag,
      'flowRegimes': drawFlowRegimesDiag,
      'velocityProfile': drawVelocityProfileDiag,
      'continuity': drawContinuityDiag,
      'bernoulli': drawBernoulliDiag,
      'darcyWeisbach': drawDarcyWeisbachDiag,
      'hagenPoiseuille': drawHagenPoiseuilleDiag,
      'frictionFactor': drawFrictionFactorDiag,
      'majorLosses': drawMajorLossesDiag,
      'minorLosses': drawMinorLossesDiag,
      'moodyDiagram': drawMoodyDiagramDiag
    };

    if (fn[concept.diagram]) fn[concept.diagram]();

    /* Formula at bottom */
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#00695c';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(concept.formula, W / 2, H - 16);
  }

  /* Mini drawing helpers */
  function drawMiniPipe(x1, y, x2, height, color) {
    ctx.strokeStyle = color || '#00695c'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x1, y - height / 2); ctx.lineTo(x2, y - height / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y + height / 2); ctx.lineTo(x2, y + height / 2); ctx.stroke();
  }

  function drawMiniArrowRight(x, y, len, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x + len + 2, y); ctx.lineTo(x + len - 6, y - 4); ctx.lineTo(x + len - 6, y + 4); ctx.closePath(); ctx.fill();
  }

  function drawMiniArrowDown(x, y, len, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x, y + len + 2); ctx.lineTo(x - 4, y + len - 6); ctx.lineTo(x + 4, y + len - 6); ctx.closePath(); ctx.fill();
  }

  function drawFluidPropsDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Fluid Properties: Density and Viscosity', W / 2, 35);

    /* Water */
    ctx.fillStyle = 'rgba(66,165,245,0.3)';
    ctx.fillRect(80, 80, 200, 120);
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.strokeRect(80, 80, 200, 120);
    ctx.fillStyle = '#42a5f5'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Water (20\u00B0C)', 180, 110);
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillText('\u03C1 = 998 kg/m\u00B3', 180, 140);
    ctx.fillText('\u03BC = 1.002\u00D710\u207B\u00B3 Pa\u00B7s', 180, 160);
    ctx.fillText('\u03BD = 1.004\u00D710\u207B\u2076 m\u00B2/s', 180, 180);

    /* Oil */
    ctx.fillStyle = 'rgba(255,193,7,0.3)';
    ctx.fillRect(350, 80, 200, 120);
    ctx.strokeStyle = '#ffc107'; ctx.lineWidth = 2;
    ctx.strokeRect(350, 80, 200, 120);
    ctx.fillStyle = '#ffc107'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('Oil', 450, 110);
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillText('\u03C1 = 880 kg/m\u00B3', 450, 140);
    ctx.fillText('\u03BC = 0.08 Pa\u00B7s', 450, 160);
    ctx.fillText('\u03BD = 9.1\u00D710\u207B\u2075 m\u00B2/s', 450, 180);

    /* Glycerin */
    ctx.fillStyle = 'rgba(171,71,188,0.3)';
    ctx.fillRect(620, 80, 200, 120);
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.strokeRect(620, 80, 200, 120);
    ctx.fillStyle = '#ab47bc'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('Glycerin (20\u00B0C)', 720, 110);
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillText('\u03C1 = 1261 kg/m\u00B3', 720, 140);
    ctx.fillText('\u03BC = 1.412 Pa\u00B7s', 720, 160);
    ctx.fillText('\u03BD = 1.12\u00D710\u207B\u00B3 m\u00B2/s', 720, 180);

    /* Relationship */
    ctx.font = '700 14px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('\u03BD = \u03BC / \u03C1 (kinematic viscosity)', W / 2, 260);
  }

  function drawReynoldsDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Reynolds Number: Inertial vs Viscous Forces', W / 2, 35);

    /* Big Re formula */
    ctx.font = '700 28px "Courier New", monospace';
    ctx.fillStyle = '#00695c';
    ctx.fillText('Re = \u03C1VD / \u03BC', W / 2, 90);

    /* Scale */
    var scaleY = 160;
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(100, scaleY); ctx.lineTo(800, scaleY); ctx.stroke();

    /* Markers */
    var marks = [
      { x: 250, label: '2300', color: '#42a5f5' },
      { x: 450, label: '4000', color: '#ffc107' }
    ];
    marks.forEach(function (m) {
      ctx.strokeStyle = m.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(m.x, scaleY - 15); ctx.lineTo(m.x, scaleY + 15); ctx.stroke();
      ctx.fillStyle = m.color; ctx.font = '700 12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, m.x, scaleY + 30);
    });

    /* Zone labels */
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5'; ctx.fillText('LAMINAR', 170, scaleY - 25);
    ctx.fillStyle = '#ffc107'; ctx.fillText('TRANSITION', 350, scaleY - 25);
    ctx.fillStyle = '#ff7043'; ctx.fillText('TURBULENT', 600, scaleY - 25);

    /* Zone colors */
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#42a5f5'; ctx.fillRect(100, scaleY - 5, 150, 10);
    ctx.fillStyle = '#ffc107'; ctx.fillRect(250, scaleY - 5, 200, 10);
    ctx.fillStyle = '#ff7043'; ctx.fillRect(450, scaleY - 5, 350, 10);
    ctx.globalAlpha = 1;

    /* Description */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Re < 2300: Smooth, orderly flow', W / 2, 240);
    ctx.fillText('2300 < Re < 4000: Unstable, intermittent', W / 2, 260);
    ctx.fillText('Re > 4000: Chaotic eddies and mixing', W / 2, 280);
  }

  function drawFlowRegimesDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Laminar vs Turbulent Flow', W / 2, 35);

    /* Laminar pipe */
    drawMiniPipe(80, 140, 400, 80, '#42a5f5');
    ctx.fillStyle = 'rgba(66,165,245,0.1)';
    ctx.fillRect(80, 100, 320, 80);

    /* Smooth streamlines */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 1.5;
    for (var i = 0; i < 5; i++) {
      var y = 110 + i * 15;
      ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(390, y); ctx.stroke();
    }
    ctx.fillStyle = '#42a5f5'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('Laminar (Re < 2300)', 240, 205);

    /* Turbulent pipe */
    drawMiniPipe(500, 140, 820, 80, '#ff7043');
    ctx.fillStyle = 'rgba(255,112,67,0.1)';
    ctx.fillRect(500, 100, 320, 80);

    /* Wavy streamlines */
    ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 1.5;
    for (var j = 0; j < 5; j++) {
      var yT = 110 + j * 15;
      ctx.beginPath();
      for (var x = 510; x <= 810; x += 5) {
        var wave = Math.sin((x - 510) * 0.08 + j * 1.5) * (4 + j * 0.8);
        if (x === 510) ctx.moveTo(x, yT + wave);
        else ctx.lineTo(x, yT + wave);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#ff7043'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('Turbulent (Re > 4000)', 660, 205);

    /* Velocity profiles below */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('Parabolic profile, V_max = 2V', 240, 270);
    ctx.fillStyle = '#ff7043';
    ctx.fillText('Flatter profile, thin boundary layer', 660, 270);
  }

  function drawVelocityProfileDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Velocity Profiles in Pipe Flow', W / 2, 35);

    var profiles = [
      { label: 'Laminar', color: '#42a5f5', cx: 250, fn: function (r) { return 1 - r * r; } },
      { label: 'Turbulent', color: '#ff7043', cx: 650, fn: function (r) { return Math.pow(1 - Math.abs(r), 1 / 7); } }
    ];

    profiles.forEach(function (p) {
      var topY = 80, botY = 300, centerY = 190;
      var halfH = 100;
      var maxW = 120;

      /* Pipe walls */
      ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(p.cx, topY); ctx.lineTo(p.cx, botY); ctx.stroke();

      /* Profile */
      ctx.beginPath();
      for (var i = 0; i <= 40; i++) {
        var frac = i / 40;
        var r = (frac - 0.5) * 2;
        var vel = p.fn(r);
        var px = p.cx + vel * maxW;
        var py = topY + frac * (botY - topY);
        if (i === 0) ctx.moveTo(p.cx, py);
        ctx.lineTo(px, py);
      }
      ctx.lineTo(p.cx, botY);
      ctx.closePath();
      ctx.fillStyle = p.color.replace(')', ',0.25)').replace('rgb', 'rgba');
      ctx.fill();
      ctx.strokeStyle = p.color; ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var j = 0; j <= 40; j++) {
        var fracJ = j / 40;
        var rJ = (fracJ - 0.5) * 2;
        var velJ = p.fn(rJ);
        var pxJ = p.cx + velJ * maxW;
        var pyJ = topY + fracJ * (botY - topY);
        if (j === 0) ctx.moveTo(pxJ, pyJ);
        else ctx.lineTo(pxJ, pyJ);
      }
      ctx.stroke();

      ctx.fillStyle = p.color; ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, p.cx + 40, botY + 25);
    });
  }

  function drawContinuityDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Continuity Equation: Mass Conservation', W / 2, 35);

    /* Wide section */
    drawMiniPipe(80, 160, 400, 100, '#00695c');
    ctx.fillStyle = 'rgba(66,165,245,0.1)';
    ctx.fillRect(80, 110, 320, 100);
    drawMiniArrowRight(200, 160, 80, '#42a5f5');
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#42a5f5'; ctx.textAlign = 'center';
    ctx.fillText('V\u2081 (slow)', 240, 100);
    ctx.fillText('A\u2081 (large)', 240, 230);

    /* Narrow section */
    drawMiniPipe(500, 160, 820, 50, '#00695c');
    ctx.fillStyle = 'rgba(255,112,67,0.1)';
    ctx.fillRect(500, 135, 320, 50);
    drawMiniArrowRight(600, 160, 100, '#ff7043');
    ctx.font = '700 11px "Courier New", monospace';
    ctx.fillStyle = '#ff7043';
    ctx.fillText('V\u2082 (fast)', 660, 100);
    ctx.fillText('A\u2082 (small)', 660, 210);

    /* Connection */
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(400, 110); ctx.lineTo(500, 135);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(400, 210); ctx.lineTo(500, 185);
    ctx.stroke();

    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('A\u2081V\u2081 = A\u2082V\u2082 = Q', W / 2, 300);
  }

  function drawBernoulliDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Bernoulli\'s Equation: Energy Conservation', W / 2, 35);

    /* Pipe */
    drawMiniPipe(100, 180, 800, 60, '#00695c');

    /* EGL line */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(100, 80); ctx.lineTo(800, 120); ctx.stroke();
    ctx.fillStyle = '#f5c842'; ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('EGL (P/\u03C1g + V\u00B2/2g + z)', 450, 72);

    /* HGL line */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(100, 100); ctx.lineTo(800, 140); ctx.stroke();
    ctx.fillStyle = '#3ddc84';
    ctx.fillText('HGL (P/\u03C1g + z)', 450, 148);

    /* V^2/2g gap */
    ctx.strokeStyle = 'rgba(221,227,240,0.5)'; ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath(); ctx.moveTo(200, 85); ctx.lineTo(200, 103); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#dde3f0'; ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillText('V\u00B2/2g', 220, 93);

    ctx.font = '700 13px "Courier New", monospace';
    ctx.fillStyle = '#00695c'; ctx.textAlign = 'center';
    ctx.fillText('P\u2081/\u03C1g + V\u2081\u00B2/2g + z\u2081 = P\u2082/\u03C1g + V\u2082\u00B2/2g + z\u2082 + h_L', W / 2, 280);
  }

  function drawDarcyWeisbachDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Darcy-Weisbach Equation: Major Head Loss', W / 2, 35);

    /* Pipe */
    drawMiniPipe(100, 160, 800, 60, '#00695c');
    ctx.fillStyle = 'rgba(66,165,245,0.08)';
    ctx.fillRect(100, 130, 700, 60);

    /* Flow arrow */
    drawMiniArrowRight(380, 160, 100, '#42a5f5');

    /* Dimension */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(100, 210); ctx.lineTo(800, 210); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6b7a99'; ctx.font = '700 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('L', 450, 220);
    ctx.fillText('D', 830, 160);

    ctx.font = '700 22px "Courier New", monospace';
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('h_f = f \u00D7 (L/D) \u00D7 (V\u00B2/2g)', W / 2, 280);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('f = friction factor | L = pipe length | D = diameter | V = velocity | g = 9.81', W / 2, 320);
  }

  function drawHagenPoiseuilleDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Hagen-Poiseuille: Laminar Flow Only', W / 2, 35);

    /* Pipe with parabolic profile */
    drawMiniPipe(150, 160, 750, 80, '#42a5f5');
    ctx.fillStyle = 'rgba(66,165,245,0.08)';
    ctx.fillRect(150, 120, 600, 80);

    /* Parabolic profile */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 40; i++) {
      var frac = i / 40;
      var r = (frac - 0.5) * 2;
      var vel = 1 - r * r;
      var px = 200 + vel * 60;
      var py = 120 + frac * 80;
      if (i === 0) ctx.moveTo(200, py);
      ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.font = '700 20px "Courier New", monospace';
    ctx.fillStyle = '#00695c'; ctx.textAlign = 'center';
    ctx.fillText('\u0394P = 128\u03BCLQ / (\u03C0D\u2074)', W / 2, 270);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5555';
    ctx.fillText('ONLY valid for Re < 2300 (Laminar Flow)', W / 2, 310);
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Halving D increases \u0394P by 16\u00D7 (D\u2074 dependence)', W / 2, 340);
  }

  function drawFrictionFactorDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Friction Factor Determination', W / 2, 35);

    /* Laminar box */
    ctx.fillStyle = 'rgba(66,165,245,0.15)';
    ctx.fillRect(80, 70, 350, 90);
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2;
    ctx.strokeRect(80, 70, 350, 90);
    ctx.fillStyle = '#42a5f5'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Laminar (Re < 2300)', 255, 95);
    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillText('f = 64 / Re', 255, 130);

    /* Turbulent box */
    ctx.fillStyle = 'rgba(255,112,67,0.15)';
    ctx.fillRect(470, 70, 380, 90);
    ctx.strokeStyle = '#ff7043'; ctx.lineWidth = 2;
    ctx.strokeRect(470, 70, 380, 90);
    ctx.fillStyle = '#ff7043'; ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillText('Turbulent (Re > 4000)', 660, 95);
    ctx.font = '600 11px "Courier New", monospace';
    ctx.fillText('Colebrook or Swamee-Jain', 660, 125);
    ctx.fillText('Blasius: f=0.316/Re^0.25', 660, 145);

    /* Note */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('Use Moody diagram or iterative Colebrook equation for turbulent flow', W / 2, 210);
  }

  function drawMajorLossesDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Major Losses: Friction Along Pipe Length', W / 2, 35);

    /* Long pipe */
    drawMiniPipe(80, 140, 820, 50, '#00695c');

    /* Roughness texture */
    ctx.strokeStyle = 'rgba(107,122,153,0.4)'; ctx.lineWidth = 1;
    for (var i = 0; i < 40; i++) {
      var x = 90 + i * 18;
      ctx.beginPath(); ctx.moveTo(x, 115); ctx.lineTo(x + 3, 118); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, 165); ctx.lineTo(x + 3, 162); ctx.stroke();
    }

    /* Pressure gradient */
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(80, 80); ctx.lineTo(820, 105); ctx.stroke();
    ctx.fillStyle = '#ab47bc'; ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('Pressure decreasing \u2192', 450, 75);

    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('h_f = f(L/D)(V\u00B2/2g)', W / 2, 240);
    ctx.fillText('\u0394P = \u03C1gh_f', W / 2, 270);
  }

  function drawMinorLossesDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Minor Losses: Fittings, Bends, Valves', W / 2, 35);

    /* Pipe sections with fittings */
    drawMiniPipe(80, 130, 300, 40, '#00695c');
    drawMiniPipe(340, 130, 560, 40, '#00695c');
    drawMiniPipe(600, 130, 820, 40, '#00695c');

    /* Elbow symbols */
    ctx.strokeStyle = '#ab47bc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(320, 130, 10, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(580, 130, 10, 0, Math.PI * 2); ctx.stroke();

    /* Labels */
    ctx.fillStyle = '#ab47bc'; ctx.font = '600 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('90\u00B0 Elbow', 320, 170);
    ctx.fillText('K = 0.9', 320, 185);
    ctx.fillText('Gate Valve', 580, 170);
    ctx.fillText('K = 0.2', 580, 185);

    /* K values table */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'left';
    ctx.fillText('Common K values:', 100, 230);
    ctx.fillText('90\u00B0 elbow: 0.9  |  45\u00B0 elbow: 0.4  |  Gate valve: 0.2', 100, 250);
    ctx.fillText('Globe valve: 10  |  Sudden expansion: (1\u2212A\u2081/A\u2082)\u00B2  |  Pipe exit: 1.0', 100, 270);

    ctx.font = '700 16px "Courier New", monospace';
    ctx.fillStyle = '#ff5555'; ctx.textAlign = 'center';
    ctx.fillText('h_m = \u03A3K \u00D7 (V\u00B2/2g)', W / 2, 320);
  }

  function drawMoodyDiagramDiag() {
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Moody Diagram (Simplified)', W / 2, 35);

    /* Axes */
    var plotL = 120, plotR = 800, plotT = 70, plotB = 310;
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(plotL, plotT); ctx.lineTo(plotL, plotB); ctx.lineTo(plotR, plotB); ctx.stroke();

    /* Axis labels */
    ctx.save();
    ctx.translate(plotL - 40, (plotT + plotB) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#6b7a99'; ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Friction Factor (f)', 0, 0);
    ctx.restore();
    ctx.fillStyle = '#6b7a99'; ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Reynolds Number (Re)', (plotL + plotR) / 2, plotB + 25);

    /* \u2500\u2500 Moody curves, computed from the friction-factor physics \u2500\u2500\u2500\u2500\u2500\u2500
       Every line here used to be hard-coded pixel offsets with a
       quadraticCurveTo through invented control points, which got the single
       most important relationship in the chart BACKWARDS: at the right-hand
       edge the "Smooth" curve ended highest on the plot and "\u03B5/D = 0.01"
       lowest, i.e. the rougher pipe was drawn with the LOWER friction factor.
       The smooth curve also rose with Re, when f falls monotonically.

       The curves are now sampled from the same Swamee-Jain relation the
       simulator uses, on true log-log axes with real tick values. */
    var RE_LO = 640, RE_HI = 1e8, F_LO = 0.0055, F_HI = 0.11;
    var lgReLo = Math.log10(RE_LO), lgReHi = Math.log10(RE_HI);
    var lgFLo = Math.log10(F_LO), lgFHi = Math.log10(F_HI);
    function mx(Re) { return plotL + (Math.log10(Re) - lgReLo) / (lgReHi - lgReLo) * (plotR - plotL); }
    function my(f) { return plotB - (Math.log10(f) - lgFLo) / (lgFHi - lgFLo) * (plotB - plotT); }
    function fTurb(Re, epsD) {
      var e = epsD < 1e-12 ? 1e-7 : epsD;
      return 0.25 / Math.pow(Math.log10(e / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    }

    /* decade gridlines + tick values */
    /* Unicode superscripts are not contiguous (¹²³ sit outside the U+207x
       block), so use an explicit table rather than arithmetic on code points. */
    var SUP = { 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };
    ctx.font = '600 9px "Segoe UI", sans-serif';
    for (var dec = 3; dec <= 8; dec++) {
      var gx = mx(Math.pow(10, dec));
      if (gx < plotL || gx > plotR) continue;
      ctx.strokeStyle = '#263056'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(gx, plotT); ctx.lineTo(gx, plotB); ctx.stroke();
      ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
      ctx.fillText('10' + SUP[dec], gx, plotB + 12);
    }
    [0.006, 0.01, 0.02, 0.05, 0.1].forEach(function (fv) {
      var gy = my(fv);
      if (gy < plotT || gy > plotB) return;
      ctx.strokeStyle = '#263056'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(plotL, gy); ctx.lineTo(plotR, gy); ctx.stroke();
      ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'right';
      ctx.fillText(fv.toFixed(fv < 0.1 ? 3 : 2), plotL - 5, gy + 3);
    });

    /* Laminar line: f = 64/Re, a true straight line on log-log */
    ctx.strokeStyle = '#42a5f5'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mx(RE_LO), my(64 / RE_LO));
    ctx.lineTo(mx(2300), my(64 / 2300));
    ctx.stroke();
    ctx.fillStyle = '#42a5f5'; ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('f = 64/Re', mx(700), my(64 / 700) - 6);

    /* Transition band 2300\u20134000, dashed: genuinely unstable, no single curve */
    ctx.strokeStyle = '#ffc107'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(mx(2300), my(64 / 2300));
    ctx.lineTo(mx(4000), my(fTurb(4000, 0)));
    ctx.stroke();
    ctx.setLineDash([]);

    /* Turbulent family \u2014 rougher pipe sits HIGHER, as it must */
    var roughness = [
      { epsD: 0,      label: 'smooth',      color: '#3ddc84' },
      { epsD: 0.0001, label: '\u03B5/D=0.0001', color: '#4dd0e1' },
      { epsD: 0.001,  label: '\u03B5/D=0.001',  color: '#f5c842' },
      { epsD: 0.005,  label: '\u03B5/D=0.005',  color: '#ff9800' },
      { epsD: 0.02,   label: '\u03B5/D=0.02',   color: '#ff7043' }
    ];
    roughness.forEach(function (r) {
      ctx.strokeStyle = r.color; ctx.lineWidth = 2;
      ctx.beginPath();
      var started = false;
      for (var lg = Math.log10(4000); lg <= lgReHi + 1e-9; lg += 0.02) {
        var Re_ = Math.pow(10, lg);
        var px = mx(Re_), py = my(fTurb(Re_, r.epsD));
        if (py < plotT || py > plotB) { started = false; continue; }
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      var ly = my(fTurb(RE_HI, r.epsD));
      if (ly >= plotT && ly <= plotB) {
        ctx.fillStyle = r.color; ctx.font = '600 9px "Segoe UI", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(r.label, plotR - 4, ly - 4);
      }
    });

    /* Common roughness */
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('Smooth: \u03B5\u22480  |  PVC: \u03B5=0.0015mm  |  Steel: \u03B5=0.045mm  |  Cast Iron: \u03B5=0.26mm', W / 2, plotB + 50);
  }

  /* ================================================================
     RENDER
     ================================================================ */
  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (mode === 'simulate') {
      calculateAll();
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
    ctx.fillStyle = '#00695c';
    ctx.fillText('Solve the pipe flow problem below', W / 2, 65);

    /* Draw a pipe */
    drawMiniPipe(150, 180, 750, 60, '#00695c');
    ctx.fillStyle = 'rgba(66,165,245,0.08)';
    ctx.fillRect(150, 150, 600, 60);
    drawMiniArrowRight(350, 180, 100, '#42a5f5');

    /* Labels */
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('Re = \u03C1VD/\u03BC', W / 2, 280);
    ctx.fillStyle = '#f5c842';
    ctx.fillText('h_f = f(L/D)(V\u00B2/2g)', W / 2, 310);
    ctx.fillStyle = '#ff5555';
    ctx.fillText('h_m = K(V\u00B2/2g)', W / 2, 340);
  }

  function drawQuizCanvas() {
    ctx.font = '700 18px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Quiz Mode', W / 2, 40);
    ctx.font = '600 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#00695c';
    ctx.fillText('Answer the question below', W / 2, 65);

    /* Draw a pipe with flow indicators */
    drawMiniPipe(200, 180, 700, 50, '#00695c');
    drawMiniArrowRight(350, 180, 80, '#42a5f5');

    /* Reynolds number scale */
    ctx.strokeStyle = '#4a5578'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(200, 280); ctx.lineTo(700, 280); ctx.stroke();
    ctx.fillStyle = '#42a5f5'; ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillText('Laminar', 280, 300);
    ctx.fillStyle = '#ffc107';
    ctx.fillText('Trans.', 430, 300);
    ctx.fillStyle = '#ff7043';
    ctx.fillText('Turbulent', 600, 300);

    /* EGL/HGL hint */
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(200, 350); ctx.lineTo(700, 370); ctx.stroke();
    ctx.strokeStyle = '#3ddc84';
    ctx.beginPath(); ctx.moveTo(200, 370); ctx.lineTo(700, 390); ctx.stroke();
    ctx.font = '600 9px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.fillText('EGL', 170, 350);
    ctx.fillStyle = '#3ddc84'; ctx.fillText('HGL', 170, 380);
  }

  /* ================================================================
     UPDATE READOUTS
     ================================================================ */
  function updateReadouts() {
    var IMP = useImperial;

    /* Reynolds number (dimensionless) */
    var reText = Re < 1000 ? Re.toFixed(1) : Re < 1e6 ? Math.round(Re).toLocaleString() : Re.toExponential(2);
    $('#r-re').textContent = reText;

    /* Flow regime */
    $('#r-regime').textContent = flowRegime;
    $('#r-regime').style.color = Re < 2300 ? '#42a5f5' : Re < 4000 ? '#ffc107' : '#ff7043';

    /* Friction factor (dimensionless) */
    $('#r-f').textContent = frictionFactor < 0.0001 ? frictionFactor.toExponential(3) : frictionFactor.toFixed(4);

    /* Pressure drop — bug fix: update unit span dynamically */
    var dpVal, dpUnit;
    if (IMP) {
      var dpPsi = pressureDrop / 6894.76;
      dpVal = dpPsi < 10 ? dpPsi.toFixed(4) : dpPsi < 1000 ? dpPsi.toFixed(2) : dpPsi.toFixed(0);
      dpUnit = ' psi';
    } else {
      if (pressureDrop < 1000) { dpVal = pressureDrop.toFixed(1); dpUnit = ' Pa'; }
      else if (pressureDrop < 1e6) { dpVal = (pressureDrop / 1000).toFixed(2); dpUnit = ' kPa'; }
      else { dpVal = (pressureDrop / 1e6).toFixed(3); dpUnit = ' MPa'; }
    }
    $('#r-dp').textContent = dpVal;
    $('#r-dp-unit').textContent = dpUnit;

    /* Head losses */
    var hlUnit = IMP ? ' ft' : ' m';
    $('#r-hf').textContent = (IMP ? headLossMajor * 3.281 : headLossMajor).toFixed(3);
    $('#r-hf-unit').textContent = hlUnit;
    $('#r-hm').textContent = (IMP ? headLossMinor * 3.281 : headLossMinor).toFixed(3);
    $('#r-hm-unit').textContent = hlUnit;

    /* E4: hide minor loss card when no bends */
    var hmCard = $('#r-hm-card');
    if (hmCard) hmCard.style.display = numBends > 0 ? '' : 'none';

    /* Flow rate */
    var qDisp = IMP ? flowRate * 15.85 : flowRate;
    $('#r-q').textContent = qDisp.toFixed(2);
    $('#r-q-unit').textContent = IMP ? ' gal/min' : ' L/s';

    /* Velocity */
    $('#r-vel').textContent = (IMP ? flowVel * 3.281 : flowVel).toFixed(2);
    $('#r-vel-unit').textContent = IMP ? ' ft/s' : ' m/s';
  }

  /* ================================================================
     ANIMATION LOOP
     ================================================================ */
  function animate() {
    animTime += 1;
    if (mode === 'simulate') render();
    animFrame = requestAnimationFrame(animate);
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

    /* Canvas hint — show only in simulate mode */
    var hint = $('#canvas-hint');
    if (hint) hint.style.display = m === 'simulate' ? '' : 'none';

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

  /* Fluid type tabs */
  $('#fluid-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    fluidKey = e.target.dataset.fluid;
    $$('#fluid-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    render();
  });

  /* Pipe material tabs */
  $('#pipe-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    pipeKey = e.target.dataset.pipe;
    $$('#pipe-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    render();
  });

  /* ── syncAllControls: update companion inputs and unit button ──── */
  function syncAllControls() {
    var IMP = useImperial;
    /* Diameter */
    $('#dia-slider').value = pipeDia;
    $('#dia-input').value = IMP ? (pipeDia / 25.4).toFixed(2) : pipeDia;
    $('#dia-unit').textContent = IMP ? 'in' : 'mm';
    /* Length */
    $('#len-slider').value = pipeLen;
    $('#len-input').value = IMP ? (pipeLen * 3.281).toFixed(1) : pipeLen.toFixed(1);
    $('#len-unit').textContent = IMP ? 'ft' : 'm';
    /* Velocity */
    $('#vel-slider').value = flowVel;
    $('#vel-input').value = IMP ? (flowVel * 3.281).toFixed(2) : flowVel.toFixed(2);
    $('#vel-unit').textContent = IMP ? 'ft/s' : 'm/s';
    /* Bends */
    $('#bends-slider').value = numBends;
    $('#bends-input').value = numBends;
    /* Unit toggle button */
    var utBtn = $('#unit-toggle');
    if (utBtn) { utBtn.textContent = IMP ? 'IMP' : 'SI'; utBtn.classList.toggle('active', IMP); }
  }

  /* ── Sliders ─────────────────────────────────────────────────── */
  $('#dia-slider').addEventListener('input', function () {
    pipeDia = +this.value;
    $('#dia-input').value = useImperial ? (pipeDia / 25.4).toFixed(2) : pipeDia;
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });
  $('#dia-input').addEventListener('input', function () {
    var v = parseFloat(this.value);
    if (isNaN(v) || v <= 0) return;
    pipeDia = useImperial ? Math.round(v * 25.4) : Math.round(v);
    pipeDia = Math.max(10, Math.min(500, pipeDia));
    $('#dia-slider').value = pipeDia;
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });

  $('#len-slider').addEventListener('input', function () {
    pipeLen = +this.value;
    $('#len-input').value = useImperial ? (pipeLen * 3.281).toFixed(1) : pipeLen.toFixed(1);
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });
  $('#len-input').addEventListener('input', function () {
    var v = parseFloat(this.value);
    if (isNaN(v) || v <= 0) return;
    pipeLen = useImperial ? +(v / 3.281).toFixed(1) : +v.toFixed(1);
    pipeLen = Math.max(1, Math.min(100, pipeLen));
    $('#len-slider').value = pipeLen;
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });

  $('#vel-slider').addEventListener('input', function () {
    flowVel = +this.value;
    $('#vel-input').value = useImperial ? (flowVel * 3.281).toFixed(2) : flowVel.toFixed(2);
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });
  $('#vel-input').addEventListener('input', function () {
    var v = parseFloat(this.value);
    if (isNaN(v) || v <= 0) return;
    flowVel = useImperial ? +(v / 3.281).toFixed(2) : +v.toFixed(2);
    flowVel = Math.max(0.1, Math.min(10, flowVel));
    $('#vel-slider').value = flowVel;
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });

  $('#bends-slider').addEventListener('input', function () {
    numBends = +this.value;
    $('#bends-input').value = numBends;
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });
  $('#bends-input').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    if (isNaN(v)) return;
    numBends = Math.max(0, Math.min(10, v));
    this.value = numBends;
    $('#bends-slider').value = numBends;
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    render();
  });

  /* Presets */
  $$('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var preset = btn.dataset.preset;
      if (!preset) return;
      $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      if (preset === 'laminar') {
        fluidKey = 'oil'; pipeKey = 'smooth'; pipeDia = 25; pipeLen = 5; flowVel = 0.2; numBends = 0;
      } else if (preset === 'turbulent') {
        fluidKey = 'water'; pipeKey = 'steel'; pipeDia = 100; pipeLen = 50; flowVel = 3; numBends = 2;
      } else if (preset === 'high-loss') {
        fluidKey = 'water'; pipeKey = 'iron'; pipeDia = 50; pipeLen = 100; flowVel = 5; numBends = 8;
      } else if (preset === 'air-duct') {
        fluidKey = 'air'; pipeKey = 'smooth'; pipeDia = 300; pipeLen = 20; flowVel = 8; numBends = 3;
      }

      /* Update fluid tabs */
      $$('#fluid-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.fluid === fluidKey); });
      $$('#pipe-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.pipe === pipeKey); });

      /* Update sliders + companion inputs (unit-aware) */
      syncAllControls();
      render();
    });
  });

  /* ================================================================
     CANVAS INTERACTION — Hover to inspect
     ================================================================ */
  cvs.addEventListener('pointermove', function (e) {
    if (mode !== 'simulate') return;
    var rect = cvs.getBoundingClientRect();
    var x = (e.clientX - rect.left) * (W / rect.width);

    if (x >= pipeDrawL && x <= pipeDrawR) {
      hoverX = (x - pipeDrawL) / (pipeDrawR - pipeDrawL);
    } else {
      hoverX = -1;
    }
    /* render is called by animation loop */
  });

  cvs.addEventListener('pointerleave', function () {
    hoverX = -1;
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
    /* For very large numbers like Reynolds, increase tolerance */
    if (Math.abs(pProblem.answer) > 1000) tol = Math.abs(pProblem.answer) * 0.05;
    var ok = !isNaN(val) && Math.abs(val - pProblem.answer) <= tol;
    if (ok) pScore++;
    $('#pp-feedback').textContent = ok ? '\u2714 Correct!' : '\u2718 Incorrect \u2014 answer: ' + pProblem.answer + ' ' + pProblem.unit;
    $('#pp-feedback').className = 'feedback ' + (ok ? 'ok' : 'err');
    $('#pp-input').disabled = true;
    show($('#pp-next'));
    /* Show solution */
    var solEl = $('#pp-solution');
    solEl.innerHTML = '<h4>Step-by-Step Solution</h4>' +
      pProblem.steps.map(function (s) { return '<p class="sol-step">' + s.replace(/= ([0-9.,]+)/, '= <strong>$1</strong>') + '</p>'; }).join('');
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
    if (Math.abs(q.answer) > 1000) tol = Math.abs(q.answer) * 0.05;
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
     UNIT TOGGLE
     ================================================================ */
  $('#unit-toggle').addEventListener('click', function () {
    useImperial = !useImperial;
    syncAllControls();
    render();
  });

  /* ================================================================
     CANVAS RIGHT-CLICK CONTEXT MENU (D4b + D16)
     ================================================================ */
  var ctxMenu = $('#canvas-ctx-menu');

  cvs.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (mode !== 'simulate') return;
    ctxMenu.style.display = 'block';
    var mx = Math.min(e.clientX, window.innerWidth - 200);
    var my = Math.min(e.clientY, window.innerHeight - 170);
    ctxMenu.style.left = mx + 'px';
    ctxMenu.style.top  = my + 'px';
  });

  document.addEventListener('click', function () { if (ctxMenu) ctxMenu.style.display = 'none'; });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ctxMenu) ctxMenu.style.display = 'none'; });

  /* Export PNG */
  $('#ctx-export-png').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    /* Draw watermark on a temp canvas */
    var tmpCvs = document.createElement('canvas');
    tmpCvs.width = cvs.width; tmpCvs.height = cvs.height;
    var tmpCtx = tmpCvs.getContext('2d');
    tmpCtx.drawImage(cvs, 0, 0);
    var dpr2 = window.devicePixelRatio || 1;
    tmpCtx.font = 'bold ' + (13 * dpr2) + 'px "Segoe UI", sans-serif';
    tmpCtx.fillStyle = 'rgba(255,255,255,0.45)';
    tmpCtx.textAlign = 'right'; tmpCtx.textBaseline = 'bottom';
    tmpCtx.fillText('NHIT VisualLab', tmpCvs.width - 10 * dpr2, tmpCvs.height - 8 * dpr2);
    var link = document.createElement('a');
    link.download = 'fluid-flow-' + Date.now() + '.png';
    link.href = tmpCvs.toDataURL('image/png');
    link.click();
  });

  /* Export CSV */
  $('#ctx-export-csv').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    var csv =
      'Parameter,SI Value,SI Unit,Imperial Value,Imperial Unit\n' +
      'Fluid,' + FLUIDS[fluidKey].name + ',,\n' +
      'Pipe Material,' + PIPES[pipeKey].name + ',,\n' +
      'Pipe Diameter,' + pipeDia + ',mm,' + (pipeDia / 25.4).toFixed(3) + ',in\n' +
      'Pipe Length,' + pipeLen + ',m,' + (pipeLen * 3.281).toFixed(2) + ',ft\n' +
      'Flow Velocity,' + flowVel.toFixed(3) + ',m/s,' + (flowVel * 3.281).toFixed(3) + ',ft/s\n' +
      'Bends / Fittings,' + numBends + ',,,\n' +
      'Reynolds Number,' + Re.toFixed(0) + ',dimensionless,,\n' +
      'Flow Regime,' + flowRegime + ',,\n' +
      'Friction Factor,' + frictionFactor.toFixed(6) + ',dimensionless,,\n' +
      'Pressure Drop,' + pressureDrop.toFixed(2) + ',Pa,' + (pressureDrop / 6894.76).toFixed(4) + ',psi\n' +
      'Head Loss Major,' + headLossMajor.toFixed(4) + ',m,' + (headLossMajor * 3.281).toFixed(4) + ',ft\n' +
      'Head Loss Minor,' + headLossMinor.toFixed(4) + ',m,' + (headLossMinor * 3.281).toFixed(4) + ',ft\n' +
      'Total Head Loss,' + (headLossMajor + headLossMinor).toFixed(4) + ',m,' + ((headLossMajor + headLossMinor) * 3.281).toFixed(4) + ',ft\n' +
      'Flow Rate,' + flowRate.toFixed(4) + ',L/s,' + (flowRate * 15.85).toFixed(4) + ',gal/min\n';
    var blob = new Blob([csv], { type: 'text/csv' });
    var link = document.createElement('a');
    link.download = 'fluid-flow-' + Date.now() + '.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
  });

  /* Copy Re value */
  $('#ctx-copy-re').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    var reStr = Math.round(Re).toString();
    if (navigator.clipboard) { navigator.clipboard.writeText(reStr); }
    else {
      var ta = document.createElement('textarea');
      ta.value = reStr; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
  });

  /* Reset parameters */
  $('#ctx-reset').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    fluidKey = 'water'; pipeKey = 'smooth';
    pipeDia = 50; pipeLen = 10; flowVel = 1.0; numBends = 0;
    $$('#fluid-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.fluid === 'water'); });
    $$('#pipe-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.pipe === 'smooth'); });
    $$('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    syncAllControls();
    render();
  });

  /* ================================================================
     INIT
     ================================================================ */
  syncAllControls();
  setMode('simulate');
  animate();

})();
