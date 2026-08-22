(function () {
  'use strict';

  /* ================================================================
     SECTION 1: CONSTANTS & HELPERS
     ================================================================ */
  var PI  = Math.PI;
  var TAU = 2 * PI;
  var DEG = 180 / PI;
  var RAD = PI / 180;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
  function randFloat(lo, hi) { return lo + Math.random() * (hi - lo); }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function $(id) { return document.getElementById(id); }
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return document.querySelectorAll(sel); }

  /* ================================================================
     SECTION 2: CONCEPTS (12 items, 3 categories)
     ================================================================ */
  var CONCEPTS = [
    /* ── Basics (4) ─────────────────────────────────────────────── */
    {
      id: 'double-slider-chain', name: 'Double Slider Crank Chain', symbol: '2 sliders + 2 turns',
      formula: 'DOF = 3(n\u22121) \u2212 2j\u2081 \u2212 j\u2082 = 1', unit: 'DOF',
      cat: 'basics',
      desc: 'The double slider crank chain is a four-link kinematic chain consisting of two sliding pairs and two turning (revolute) pairs. Unlike the single slider crank chain (used in IC engines), both endpoints of the connecting link are constrained to slide along guides. By fixing different links in this chain, three distinct kinematic inversions are obtained: the Elliptical Trammel (1st), the Scotch Yoke (2nd), and Oldham\u2019s Coupling (3rd). The chain has one degree of freedom (DOF = 1), meaning a single input fully defines the motion of all links.',
      example: {
        problem: 'How many links and joints does the double slider crank chain have?',
        steps: [
          'Links: 4 (frame, two sliders, connecting bar)',
          'Joints: 2 sliding pairs + 2 revolute pairs = 4 full joints',
          'DOF = 3(4\u22121) \u2212 2(4) \u2212 0 = 9 \u2212 8 = 1'
        ],
        answer: 1, unit: 'DOF'
      }
    },
    {
      id: 'elliptical-trammel', name: 'Elliptical Trammel (1st Inv.)', symbol: 'Frame fixed',
      formula: '(x/a)\u00b2 + (y/b)\u00b2 = 1', unit: '\u2014',
      cat: 'basics',
      desc: 'The 1st inversion of the double slider crank chain is the Elliptical Trammel, obtained by fixing the frame. Two sliders move in perpendicular fixed slots (horizontal and vertical). A rigid connecting bar links the two sliders. As the mechanism moves, every point on the connecting bar traces an ellipse. The slider endpoints trace straight lines along their respective slots. If the bar has length L, and a point P divides the bar into segments a (from horizontal slider) and b (from vertical slider), then P traces an ellipse with semi-major axis a and semi-minor axis b. The midpoint of the bar traces a circle.',
      example: {
        problem: 'A trammel bar has length L = 100 mm. Slider A is 60 mm from point P, slider B is 40 mm from P. What are the semi-axes of the ellipse traced by P?',
        steps: [
          'Semi-major axis a = distance from P to slider in horizontal slot = 60 mm',
          'Semi-minor axis b = distance from P to slider in vertical slot = 40 mm',
          'Ellipse: (x/60)\u00b2 + (y/40)\u00b2 = 1'
        ],
        answer: '60 mm \u00d7 40 mm', unit: ''
      }
    },
    {
      id: 'scotch-yoke', name: 'Scotch Yoke (2nd Inv.)', symbol: 'Slider fixed',
      formula: 'x = r\u00b7cos\u03b8', unit: 'mm',
      cat: 'basics',
      desc: 'The 2nd inversion of the double slider crank chain is the Scotch Yoke mechanism, obtained by fixing one of the sliding-pair links. A rotating crank with a pin slides inside a slotted yoke. The yoke reciprocates horizontally with pure simple harmonic motion (SHM). Unlike the slider-crank mechanism which uses a connecting rod and produces approximate SHM, the Scotch Yoke directly projects circular motion onto one axis: x = r\u00b7cos\u03b8. There are no second-harmonic or higher-order terms. Applications include Stirling engines, valve actuators, reciprocating compressors, and vibration shakers.',
      example: {
        problem: 'A Scotch Yoke has crank radius r = 50 mm. Find the stroke S.',
        steps: [
          'S = 2r (always exact for Scotch Yoke)',
          'S = 2 \u00d7 50',
          'S = 100 mm'
        ],
        answer: 100, unit: 'mm'
      }
    },
    {
      id: 'oldham-coupling', name: 'Oldham\u2019s Coupling (3rd Inv.)', symbol: 'Link fixed',
      formula: '\u03c9\u2081 = \u03c9\u2082 (equal speed)', unit: 'rad/s',
      cat: 'basics',
      desc: 'The 3rd inversion of the double slider crank chain is Oldham\u2019s Coupling, obtained by fixing the connecting link. Two parallel shafts with a lateral offset d are coupled by a central floating disc. Each shaft has a tongue (or key) that engages a slot in the disc, with the two slots perpendicular to each other. As the input shaft rotates, the disc translates laterally while transmitting torque, causing the output shaft to rotate at exactly the same angular velocity. The disc centre traces a circle of diameter equal to the shaft offset. Applications: coupling misaligned shafts in machinery, power transmission with lateral offset.',
      example: {
        problem: 'Two shafts are offset by d = 30 mm and rotate at 600 RPM. Find the disc centre velocity.',
        steps: [
          '\u03c9 = 2\u03c0 \u00d7 600/60 = 62.83 rad/s',
          'Disc centre traces circle of radius d/2 = 15 mm',
          'v = \u03c9 \u00d7 d/2 = 62.83 \u00d7 15 = 942.5 mm/s'
        ],
        answer: 942.5, unit: 'mm/s'
      }
    },

    /* ── Kinematics (4) ──────────────────────────────────────────── */
    {
      id: 'yoke-displacement', name: 'Yoke Displacement', symbol: 'x(\u03b8)',
      formula: 'x = r\u00b7cos\u03b8', unit: 'mm',
      cat: 'kinematics',
      desc: 'The instantaneous displacement of the Scotch Yoke from the crank pivot axis is x = r\u00b7cos\u03b8, where r is the crank radius and \u03b8 is the crank angle. This is a pure cosine function with amplitude r. At \u03b8 = 0\u00b0, x = +r (maximum). At \u03b8 = 90\u00b0, x = 0 (mean). At \u03b8 = 180\u00b0, x = \u2212r (minimum). At \u03b8 = 270\u00b0, x = 0 again. The displacement is symmetric about the mean position. Stroke S = 2r always.',
      example: {
        problem: 'Find the yoke displacement when r = 50 mm and \u03b8 = 60\u00b0.',
        steps: ['x = r\u00b7cos\u03b8', 'x = 50 \u00d7 cos(60\u00b0)', 'x = 50 \u00d7 0.5', 'x = 25 mm'],
        answer: 25, unit: 'mm'
      }
    },
    {
      id: 'yoke-velocity', name: 'Yoke Velocity', symbol: 'v(\u03b8)',
      formula: 'v = \u2212r\u03c9\u00b7sin\u03b8', unit: 'mm/s',
      cat: 'kinematics',
      desc: 'The yoke velocity is v = dx/dt = \u2212r\u03c9\u00b7sin\u03b8 where \u03c9 = 2\u03c0N/60. Maximum velocity v_max = r\u03c9 occurs at \u03b8 = 90\u00b0 and 270\u00b0 (mean positions). Velocity is zero at the extreme positions (\u03b8 = 0\u00b0 and 180\u00b0). The velocity curve is a pure negative sine wave, 90\u00b0 out of phase with displacement. This is exact SHM: velocity leads displacement by a quarter cycle.',
      example: {
        problem: 'Find the yoke velocity when r = 40 mm, N = 30 RPM, \u03b8 = 90\u00b0.',
        steps: ['\u03c9 = 2\u03c0 \u00d7 30/60 = 3.1416 rad/s', 'v = \u221240 \u00d7 3.1416 \u00d7 sin(90\u00b0)', 'v = \u221240 \u00d7 3.1416 \u00d7 1', 'v = \u2212125.66 mm/s'],
        answer: -125.66, unit: 'mm/s'
      }
    },
    {
      id: 'yoke-acceleration', name: 'Yoke Acceleration', symbol: 'a(\u03b8)',
      formula: 'a = \u2212r\u03c9\u00b2\u00b7cos\u03b8', unit: 'mm/s\u00b2',
      cat: 'kinematics',
      desc: 'The yoke acceleration is a = \u2212r\u03c9\u00b2\u00b7cos\u03b8. This equals \u2212\u03c9\u00b2x, confirming SHM. Max magnitude |a|_max = r\u03c9\u00b2 at extreme positions (\u03b8 = 0\u00b0, 180\u00b0). Acceleration is zero at the mean position (\u03b8 = 90\u00b0, 270\u00b0). The acceleration is always directed toward the mean position \u2014 the restoring acceleration of SHM.',
      example: {
        problem: 'Find the yoke acceleration at \u03b8 = 0\u00b0 when r = 50 mm, \u03c9 = 10 rad/s.',
        steps: ['a = \u2212r\u03c9\u00b2\u00b7cos\u03b8', 'a = \u221250 \u00d7 100 \u00d7 cos(0\u00b0)', 'a = \u22125000 mm/s\u00b2'],
        answer: -5000, unit: 'mm/s\u00b2'
      }
    },
    {
      id: 'ellipse-equation', name: 'Ellipse from Trammel', symbol: '(x/a)\u00b2+(y/b)\u00b2=1',
      formula: 'x = a\u00b7cos\u03b8, y = b\u00b7sin\u03b8', unit: 'mm',
      cat: 'kinematics',
      desc: 'In the Elliptical Trammel (1st inversion), a point P on the bar at distances a from the horizontal slider and b from the vertical slider traces the ellipse (x/a)\u00b2 + (y/b)\u00b2 = 1. The parametric form is x = a\u00b7cos\u03b8, y = b\u00b7sin\u03b8. If a = b, the ellipse becomes a circle. The midpoint of the bar (a = b = L/2) always traces a circle of radius L/2. The endpoint at the horizontal slider traces a vertical line, and the one at the vertical slider traces a horizontal line.',
      example: {
        problem: 'A trammel bar has L = 80 mm. Point P is 50 mm from slider A and 30 mm from slider B. Find the ellipse dimensions.',
        steps: ['a = 50 mm (semi-major axis)', 'b = 30 mm (semi-minor axis)', 'Ellipse: (x/50)\u00b2 + (y/30)\u00b2 = 1', 'Area = \u03c0ab = \u03c0 \u00d7 50 \u00d7 30 = 4712 mm\u00b2'],
        answer: '50 \u00d7 30 mm', unit: ''
      }
    },

    /* ── Design & Applications (4) ──────────────────────────────── */
    {
      id: 'stirling-engine', name: 'Stirling Engine (Scotch Yoke)', symbol: 'Piston \u2192 Shaft',
      formula: 'x = r\u00b7cos\u03b8', unit: 'mm',
      cat: 'design',
      desc: 'The Scotch Yoke is widely used in Stirling engines. The displacer or power piston connects to the output shaft via a Scotch Yoke, converting reciprocating motion into shaft rotation. The pure SHM output produces smooth shaft rotation with minimal vibration. The mechanism\u2019s simplicity and compactness are advantages in Stirling engines where space is limited and low-to-medium RPM operation is typical.',
      example: {
        problem: 'A Stirling engine Scotch Yoke has r = 25 mm, N = 600 RPM. Find v_max.',
        steps: ['\u03c9 = 2\u03c0 \u00d7 600/60 = 62.83 rad/s', 'v_max = r\u03c9 = 25 \u00d7 62.83', 'v_max = 1570.8 mm/s'],
        answer: 1570.8, unit: 'mm/s'
      }
    },
    {
      id: 'oldham-application', name: 'Oldham Coupling Application', symbol: '\u03c9\u2081 = \u03c9\u2082',
      formula: 'Disc velocity = \u03c9 \u00d7 d/2', unit: 'mm/s',
      cat: 'design',
      desc: 'Oldham\u2019s Coupling (3rd inversion) is used to transmit rotation between two parallel shafts with lateral offset. The central disc slides on both shaft tongues. Both shafts rotate at equal speed regardless of offset. Key design parameters: shaft offset d (determines disc travel), shaft diameter (determines tongue size), and RPM (determines sliding velocity and wear). The disc centre traces a circle of radius d/2 at the shaft speed. Used in pumps, compressors, and machine tool drives with slight shaft misalignment.',
      example: {
        problem: 'An Oldham coupling has d = 20 mm offset, N = 300 RPM. Find the disc sliding velocity.',
        steps: ['\u03c9 = 2\u03c0 \u00d7 300/60 = 31.42 rad/s', 'v_disc = \u03c9 \u00d7 d/2 = 31.42 \u00d7 10', 'v_disc = 314.2 mm/s'],
        answer: 314.2, unit: 'mm/s'
      }
    },
    {
      id: 'trammel-application', name: 'Trammel Applications', symbol: 'Drawing ellipses',
      formula: '(x/a)\u00b2 + (y/b)\u00b2 = 1', unit: '\u2014',
      cat: 'design',
      desc: 'The Elliptical Trammel (1st inversion) is historically used as a drafting instrument for drawing ellipses of any size. Two sliders move in perpendicular grooves while a pencil point on the connecting bar traces an ellipse. Modern applications include CNC machines that use the trammel principle for elliptical interpolation, optical instruments that need elliptical apertures, and educational demonstrations in kinematics courses. The mechanism is also called the "Trammel of Archimedes".',
      example: {
        problem: 'An elliptical trammel needs to draw an ellipse with semi-major 80 mm and semi-minor 50 mm. Where should the pencil point be placed on the bar?',
        steps: ['Point P at distance a = 80 mm from the horizontal slider', 'Point P at distance b = 50 mm from the vertical slider', 'Total bar length L = 80 + 50 = 130 mm'],
        answer: '80 mm from horizontal slider', unit: ''
      }
    },
    {
      id: 'scotch-vs-crank', name: 'Scotch Yoke vs Slider-Crank', symbol: 'SHM comparison',
      formula: 'Error = r/(4l) \u00d7 cos(2\u03b8)', unit: 'mm',
      cat: 'design',
      desc: 'The slider-crank produces approximate SHM with a 2nd-harmonic error of r\u00b2/(4l)\u00b7cos(2\u03b8). The Scotch Yoke has zero error \u2014 pure SHM. Advantages of Scotch Yoke: exact SHM, fewer parts, compact. Disadvantages: high slot friction at speed, wear on sliding surfaces, cannot handle high RPM. The slider-crank wins at high-speed/high-load applications (IC engines) while the Scotch Yoke wins for smooth motion at low-to-medium speeds (Stirling engines, valve actuators).',
      example: {
        problem: 'Compare max 2nd-harmonic error for slider-crank (r=40, l=120) vs Scotch Yoke.',
        steps: ['Slider-crank error = r\u00b2/(4l) = 1600/(480) = 3.33 mm', 'Scotch Yoke error = 0 mm (exact SHM)', 'Slider-crank deviates by 3.33 mm from pure SHM'],
        answer: '3.33 mm for slider-crank, 0 for Scotch Yoke', unit: ''
      }
    }
  ];

  /* ================================================================
     SECTION 3: PROBLEM GENERATORS (12 functions)
     ================================================================ */
  var PROBLEM_GEN = [
    function () { var r = randInt(20, 80); return { prompt: 'A Scotch Yoke has crank radius r = ' + r + ' mm. Find the stroke S.', steps: ['S = 2r', 'S = 2 \u00d7 ' + r, 'S = ' + (2*r) + ' mm'], answer: 2*r, unit: 'mm', type: 'number' }; },
    function () {
      var r = randInt(25, 70); var angles = [30,45,60,90,120,135,150]; var td = angles[randInt(0,angles.length-1)]; var th = td*RAD;
      var x = Math.round(r*Math.cos(th)*100)/100;
      return { prompt: 'Find yoke displacement: r = ' + r + ' mm, \u03b8 = ' + td + '\u00b0.', steps: ['x = r\u00b7cos\u03b8','x = '+r+' \u00d7 cos('+td+'\u00b0)','x = '+r+' \u00d7 '+Math.cos(th).toFixed(4),'x = '+x+' mm'], answer: x, unit: 'mm', type: 'number' };
    },
    function () {
      var r = randInt(30,60); var rpm = randInt(2,12)*5; var angles = [30,45,60,90,120,150]; var td = angles[randInt(0,angles.length-1)]; var th = td*RAD; var w = rpm*TAU/60;
      var v = Math.round(-r*w*Math.sin(th)*100)/100;
      return { prompt: 'Find yoke velocity: r = '+r+' mm, N = '+rpm+' RPM, \u03b8 = '+td+'\u00b0.', steps: ['\u03c9 = 2\u03c0\u00d7'+rpm+'/60 = '+w.toFixed(3)+' rad/s','v = \u2212r\u03c9\u00b7sin\u03b8','v = \u2212'+r+'\u00d7'+w.toFixed(3)+'\u00d7sin('+td+'\u00b0)','v = '+v+' mm/s'], answer: v, unit: 'mm/s', type: 'number' };
    },
    function () {
      var r = randInt(30,60); var rpm = randInt(2,12)*5; var angles = [0,30,60,90,120,180]; var td = angles[randInt(0,angles.length-1)]; var th = td*RAD; var w = rpm*TAU/60;
      var a = Math.round(-r*w*w*Math.cos(th)*100)/100;
      return { prompt: 'Find yoke acceleration: r = '+r+' mm, N = '+rpm+' RPM, \u03b8 = '+td+'\u00b0.', steps: ['\u03c9 = 2\u03c0\u00d7'+rpm+'/60 = '+w.toFixed(3)+' rad/s','a = \u2212r\u03c9\u00b2\u00b7cos\u03b8','a = \u2212'+r+'\u00d7'+(w*w).toFixed(2)+'\u00d7cos('+td+'\u00b0)','a = '+a+' mm/s\u00b2'], answer: a, unit: 'mm/s\u00b2', type: 'number' };
    },
    function () { var r = randInt(25,70); var rpm = randInt(2,12)*5; var w = rpm*TAU/60; var vm = Math.round(r*w*100)/100; return { prompt: 'Find max yoke velocity: r = '+r+' mm, N = '+rpm+' RPM.', steps: ['\u03c9 = 2\u03c0\u00d7'+rpm+'/60 = '+w.toFixed(3)+' rad/s','v_max = r\u03c9 = '+r+'\u00d7'+w.toFixed(3),'v_max = '+vm+' mm/s'], answer: vm, unit: 'mm/s', type: 'number' }; },
    function () { var r = randInt(25,60); var rpm = randInt(2,12)*5; var w = rpm*TAU/60; var am = Math.round(r*w*w*100)/100; return { prompt: 'Find max yoke acceleration magnitude: r = '+r+' mm, N = '+rpm+' RPM.', steps: ['\u03c9 = 2\u03c0\u00d7'+rpm+'/60 = '+w.toFixed(3)+' rad/s','|a|_max = r\u03c9\u00b2 = '+r+'\u00d7'+(w*w).toFixed(2),'|a|_max = '+am+' mm/s\u00b2'], answer: am, unit: 'mm/s\u00b2', type: 'number' }; },
    function () { var rpm = randInt(5,60)*5; var w = Math.round(rpm*TAU/60*1000)/1000; return { prompt: 'Convert N = '+rpm+' RPM to \u03c9 in rad/s.', steps: ['\u03c9 = 2\u03c0N/60','\u03c9 = 2\u03c0\u00d7'+rpm+'/60','\u03c9 = '+w+' rad/s'], answer: w, unit: 'rad/s', type: 'number' }; },
    function () { var rpm = randInt(5,40)*5; var T = Math.round(60/rpm*1000)/1000; return { prompt: 'A Scotch Yoke rotates at N = '+rpm+' RPM. Find the period T.', steps: ['T = 60/N','T = 60/'+rpm,'T = '+T+' s'], answer: T, unit: 's', type: 'number' }; },
    function () {
      var a = randInt(40,80); var b = randInt(20,a-10);
      return { prompt: 'An elliptical trammel has point P at a = '+a+' mm from horizontal slider and b = '+b+' mm from vertical slider. What is the bar length?', steps: ['L = a + b','L = '+a+' + '+b,'L = '+(a+b)+' mm'], answer: a+b, unit: 'mm', type: 'number' };
    },
    function () {
      var d = randInt(10,50); var rpm = randInt(10,60)*5; var w = rpm*TAU/60;
      var v = Math.round(w*d/2*100)/100;
      return { prompt: 'Oldham coupling: offset d = '+d+' mm, N = '+rpm+' RPM. Find disc centre velocity.', steps: ['\u03c9 = 2\u03c0\u00d7'+rpm+'/60 = '+w.toFixed(3)+' rad/s','v = \u03c9\u00d7d/2 = '+w.toFixed(3)+'\u00d7'+(d/2),'v = '+v+' mm/s'], answer: v, unit: 'mm/s', type: 'number' };
    },
    function () { return { prompt: 'Which inversion of the double slider crank chain produces the Scotch Yoke?', steps: ['1st inversion: Elliptical Trammel (frame fixed)','2nd inversion: Scotch Yoke (slider fixed)','3rd inversion: Oldham\u2019s Coupling (link fixed)','Answer: 2nd inversion'], answer: '2nd', unit: 'inversion', type: 'text' }; },
    function () { return { prompt: 'At what crank angle(s) does max yoke velocity occur in a Scotch Yoke?', steps: ['v = \u2212r\u03c9\u00b7sin\u03b8','|v| is max when |sin\u03b8| = 1','This occurs at \u03b8 = 90\u00b0 and 270\u00b0'], answer: '90 and 270', unit: '\u00b0', type: 'text' }; }
  ];

  /* ================================================================
     SECTION 4: QUIZ POOL (15 MCQ questions)
     ================================================================ */
  var QUIZ_POOL = [
    { q: 'How many inversions does the double slider crank chain have?', choices: ['2','3','4','5'], correct: 1 },
    { q: 'The 1st inversion of the double slider crank chain produces:', choices: ['Scotch Yoke','Oldham Coupling','Elliptical Trammel','Rapson\u2019s Slide'], correct: 2 },
    { q: 'The Scotch Yoke mechanism is which inversion?', choices: ['1st inversion','2nd inversion','3rd inversion','4th inversion'], correct: 1 },
    { q: 'Oldham\u2019s Coupling is obtained by fixing which link?', choices: ['Frame','One slider','Connecting link','Crank'], correct: 2 },
    { q: 'What type of motion does the Scotch Yoke produce?', choices: ['Uniform velocity','Approximate SHM','Pure simple harmonic motion','Parabolic motion'], correct: 2 },
    { q: 'The stroke of a Scotch Yoke with crank radius r is:', choices: ['S = r','S = 2r','S = r + l','S = \u03c0r'], correct: 1 },
    { q: 'Maximum yoke velocity in a Scotch Yoke occurs at:', choices: ['\u03b8 = 0\u00b0','\u03b8 = 45\u00b0','\u03b8 = 90\u00b0','\u03b8 = 180\u00b0'], correct: 2 },
    { q: 'Maximum yoke acceleration in a Scotch Yoke occurs at:', choices: ['\u03b8 = 90\u00b0 and 270\u00b0','\u03b8 = 0\u00b0 and 180\u00b0','\u03b8 = 45\u00b0','\u03b8 = 135\u00b0'], correct: 1 },
    { q: 'In an Elliptical Trammel, what path does the midpoint of the bar trace?', choices: ['Ellipse','Straight line','Circle','Parabola'], correct: 2 },
    { q: 'Oldham\u2019s Coupling is used to connect:', choices: ['Coaxial shafts','Intersecting shafts','Offset parallel shafts','Perpendicular shafts'], correct: 2 },
    { q: 'In Oldham\u2019s Coupling, the output shaft speed is:', choices: ['Double the input','Equal to input','Half the input','Variable'], correct: 1 },
    { q: 'The Scotch Yoke acceleration can be written as:', choices: ['a = r\u03c9\u00b2','a = \u2212r\u03c9\u00b2cos\u03b8','a = \u2212r\u03c9sin\u03b8','a = r\u03c9\u00b2sin\u03b8'], correct: 1 },
    { q: 'The main disadvantage of the Scotch Yoke at high speeds is:', choices: ['Complex design','High slot friction and wear','Non-linear motion','Excessive vibration'], correct: 1 },
    { q: 'Which application commonly uses Scotch Yoke mechanisms?', choices: ['High-speed racing engines','Stirling engines','Jet turbines','Centrifugal pumps'], correct: 1 },
    { q: 'How many links does a double slider crank chain have?', choices: ['2','3','4','5'], correct: 2 }
  ];

  /* ================================================================
     SECTION 5: KINEMATICS ENGINE
     ================================================================ */
  function yokeDisp(r, theta) { return r * Math.cos(theta); }
  function yokeVel(r, omega, theta) { return -r * omega * Math.sin(theta); }
  function yokeAcc(r, omega, theta) { return -r * omega * omega * Math.cos(theta); }

  /* slider-crank for comparison */
  function scDisp(r, l, theta) {
    var s = Math.sin(theta); var v = l*l - r*r*s*s;
    return v < 0 ? r*Math.cos(theta) : r*Math.cos(theta) + Math.sqrt(v) - l;
  }
  function scVel(r, l, w, th) { var h=0.0001; return (scDisp(r,l,th+h)-scDisp(r,l,th-h))/(2*h)*w; }
  function scAcc(r, l, w, th) { var h=0.0001; return (scDisp(r,l,th+h)-2*scDisp(r,l,th)+scDisp(r,l,th-h))/(h*h)*w*w; }

  /* ================================================================
     SECTION 6: CANVAS SETUP
     ================================================================ */
  var cvs = $('sim-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 520;
  var DPR = Math.max(window.devicePixelRatio || 1, 1);
  function initCanvas() {
    cvs.width = W * DPR; cvs.height = H * DPR;
    cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  initCanvas();

  var GRAPH_L = 470, GRAPH_R = 875, GRAPH_T = 55, GRAPH_B = 475;

  /* ================================================================
     SECTION 7: STATE
     ================================================================ */
  var state = {
    mode: 'simulate', inversion: 2,
    r: 50, rpm: 20, barLen: 120, offset: 40,
    theta: 0, running: true,
    graphType: 'displacement',
    showOverlay: false,
    activePreset: 'standard',
    exploreCat: 'basics', exploreItem: null,
    pracScore: 0, pracTotal: 0, pracCurrent: null, pracAnswered: false,
    quizQuestions: [], quizIdx: 0, quizScore: 0, quizAnswered: false, quizResults: []
  };

  var PRESETS = {
    'standard':   { r: 50, rpm: 20, barLen: 120, offset: 40 },
    'stirling':   { r: 25, rpm: 40, barLen: 80,  offset: 30 },
    'valve':      { r: 35, rpm: 10, barLen: 100, offset: 25 },
    'compressor': { r: 70, rpm: 30, barLen: 150, offset: 50 },
    'shaker':     { r: 15, rpm: 50, barLen: 60,  offset: 20 }
  };

  /* ================================================================
     SECTION 8: DRAWING HELPERS
     ================================================================ */
  function drawPivot(x, y, color, radius) {
    radius = radius || 5;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU);
    ctx.fillStyle = color; ctx.fill();
    var g = ctx.createRadialGradient(x - radius*0.4, y - radius*0.4, 0, x, y, radius);
    g.addColorStop(0, 'rgba(255,255,255,0.60)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.stroke();
    ctx.restore();
  }
  /* Cylindrical metal link: layered round-capped strokes preserve exact endpoints. */
  function metalLink(x1, y1, x2, y2, w, lo, mid, hi) {
    var dx = x2-x1, dy = y2-y1, L = Math.hypot(dx,dy) || 1;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = lo;  ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.strokeStyle = mid; ctx.lineWidth = w*0.74;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var nx = dy/L, ny = -dx/L, off = w*0.24;
    ctx.strokeStyle = hi;  ctx.lineWidth = w*0.26;
    ctx.beginPath(); ctx.moveTo(x1+nx*off,y1+ny*off); ctx.lineTo(x2+nx*off,y2+ny*off); ctx.stroke();
    ctx.restore();
  }
  function drawHatch(cx, cy, w, side) {
    ctx.save(); ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 1;
    var hW = w || 30, hH = 8;
    ctx.beginPath();
    if (side === 'down') {
      ctx.moveTo(cx-hW/2, cy); ctx.lineTo(cx+hW/2, cy); ctx.stroke();
      for (var i = -hW/2; i < hW/2; i += 5) { ctx.beginPath(); ctx.moveTo(cx+i+5, cy); ctx.lineTo(cx+i, cy+hH); ctx.stroke(); }
    } else if (side === 'left') {
      ctx.moveTo(cx, cy-hW/2); ctx.lineTo(cx, cy+hW/2); ctx.stroke();
      for (var k = -hW/2; k < hW/2; k += 5) { ctx.beginPath(); ctx.moveTo(cx, cy+k); ctx.lineTo(cx-hH, cy+k+5); ctx.stroke(); }
    } else if (side === 'right') {
      ctx.moveTo(cx, cy-hW/2); ctx.lineTo(cx, cy+hW/2); ctx.stroke();
      for (var m = -hW/2; m < hW/2; m += 5) { ctx.beginPath(); ctx.moveTo(cx, cy+m+5); ctx.lineTo(cx+hH, cy+m); ctx.stroke(); }
    }
    ctx.restore();
  }
  function drawAngleArc(cx, cy, radius, startA, endA, color, label) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, -startA, -endA, endA > startA);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
    var tip = -endA, aL = 6, pD = endA > startA ? 1 : -1;
    var tx = cx + radius*Math.cos(tip), ty = cy + radius*Math.sin(tip);
    var tg = tip + pD*PI/2;
    ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx+Math.cos(tg+0.5)*aL, ty+Math.sin(tg+0.5)*aL);
    ctx.moveTo(tx,ty); ctx.lineTo(tx+Math.cos(tg-0.5)*aL, ty+Math.sin(tg-0.5)*aL); ctx.stroke();
    if (label) {
      var mA = -(startA+endA)/2;
      ctx.fillStyle = color; ctx.font = '12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, cx+(radius+14)*Math.cos(mA), cy+(radius+14)*Math.sin(mA));
    }
    ctx.restore();
  }
  function roundRect(c, x, y, w, h, rad) {
    c.beginPath(); c.moveTo(x+rad,y); c.lineTo(x+w-rad,y); c.quadraticCurveTo(x+w,y,x+w,y+rad);
    c.lineTo(x+w,y+h-rad); c.quadraticCurveTo(x+w,y+h,x+w-rad,y+h);
    c.lineTo(x+rad,y+h); c.quadraticCurveTo(x,y+h,x,y+h-rad);
    c.lineTo(x,y+rad); c.quadraticCurveTo(x,y,x+rad,y); c.closePath();
  }
  function drawGrid() {
    ctx.save(); ctx.strokeStyle = 'rgba(100,120,150,0.08)'; ctx.lineWidth = 1;
    for (var x = 0; x <= 440; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (var y = 0; y <= H; y += 20) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(440,y); ctx.stroke(); }
    ctx.restore();
  }
  function drawDivider() {
    ctx.save(); ctx.strokeStyle = 'rgba(100,120,150,0.25)'; ctx.lineWidth = 1;
    ctx.setLineDash([4,4]); ctx.beginPath(); ctx.moveTo(450,10); ctx.lineTo(450,H-10); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }

  /* ================================================================
     SECTION 9: INVERSION DRAWING FUNCTIONS
     ================================================================ */
  var S = 2.2; /* global scale */

  /* ---- 1st Inversion: Elliptical Trammel ---- */
  function draw1stInversion() {
    var r = state.r, barLen = state.barLen, theta = state.theta;
    var ox = 200, oy = 260;

    /* slider A moves horizontally, slider B moves vertically */
    var Ax = ox + r * S * Math.cos(-theta);
    var Ay = oy;
    var Bx = ox;
    var By = oy + r * S * Math.sin(-theta);

    /* bar length determines point proportions:
       we use r as the "crank equivalent" driving parameter
       slider A at horizontal position, slider B at vertical position
       bar connects A to B, length = distance A-B which varies */
    /* For a true trammel: A moves in horizontal slot, B in vertical slot,
       bar length L is fixed. Use parametric: Ax = a*cos(theta), By = b*sin(theta)
       where a+b = L */
    var a = barLen * 0.6;  /* horizontal semi-axis */
    var b = barLen * 0.4;  /* vertical semi-axis */
    Ax = ox + a * S * Math.cos(-theta);
    Ay = oy;
    Bx = ox;
    By = oy - b * S * Math.sin(-theta);

    /* fixed frame: horizontal slot */
    ctx.save();
    ctx.strokeStyle = '#556677'; ctx.lineWidth = 2.5;
    var hSlotL = ox - (a + 20) * S, hSlotR = ox + (a + 20) * S;
    ctx.beginPath(); ctx.moveTo(hSlotL, oy - 8); ctx.lineTo(hSlotR, oy - 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hSlotL, oy + 8); ctx.lineTo(hSlotR, oy + 8); ctx.stroke();
    ctx.restore();

    /* fixed frame: vertical slot */
    ctx.save();
    ctx.strokeStyle = '#556677'; ctx.lineWidth = 2.5;
    var vSlotT = oy - (b + 20) * S, vSlotB = oy + (b + 20) * S;
    ctx.beginPath(); ctx.moveTo(ox - 8, vSlotT); ctx.lineTo(ox - 8, vSlotB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + 8, vSlotT); ctx.lineTo(ox + 8, vSlotB); ctx.stroke();
    ctx.restore();

    /* ground hatching at intersection */
    drawHatch(ox, oy + 8, 30, 'down');
    drawHatch(ox - 8, oy, 30, 'left');

    /* trace ellipse path */
    ctx.save();
    ctx.beginPath();
    for (var i = 0; i <= 360; i += 3) {
      var t = i * RAD;
      var ex = ox + a * S * Math.cos(t);
      var ey = oy - b * S * Math.sin(t);
      if (i === 0) ctx.moveTo(ex, ey); else ctx.lineTo(ex, ey);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(61,220,132,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    /* connecting bar A to B */
    ctx.save();
    ctx.beginPath(); ctx.moveTo(Ax, Ay); ctx.lineTo(Bx, By);
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();

    /* midpoint of bar (traces circle) */
    var Mx = (Ax + Bx) / 2, My = (Ay + By) / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(Mx, My, 3, 0, TAU);
    ctx.fillStyle = '#3ddc84'; ctx.fill();
    ctx.restore();

    /* point P on bar (traces ellipse) */
    var Px = ox + a * S * Math.cos(-theta);
    var Py = oy - b * S * Math.sin(-theta);
    ctx.save();
    ctx.beginPath(); ctx.arc(Px, Py, 4, 0, TAU);
    ctx.fillStyle = '#3ddc84'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    /* slider blocks */
    ctx.save();
    ctx.fillStyle = '#ff8a65';
    ctx.fillRect(Ax - 10, Ay - 6, 20, 12);
    ctx.strokeStyle = '#c75b39'; ctx.lineWidth = 1;
    ctx.strokeRect(Ax - 10, Ay - 6, 20, 12);
    ctx.fillRect(Bx - 6, By - 10, 12, 20);
    ctx.strokeRect(Bx - 6, By - 10, 12, 20);
    ctx.restore();

    /* pivots at A and B */
    drawPivot(Ax, Ay, '#ff8a65', 4);
    drawPivot(Bx, By, '#ff8a65', 4);

    /* angle arc */
    if (Math.abs(theta % TAU) > 0.02) {
      drawAngleArc(ox, oy, 25, 0, theta, '#3ddc84', '\u03b8');
    }

    /* labels */
    ctx.save();
    ctx.fillStyle = '#ccd0dd'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('A', Ax, Ay + 22);
    ctx.fillText('B', Bx - 18, By);
    ctx.fillText('P', Px + 10, Py - 8);
    ctx.fillStyle = 'rgba(200,210,230,0.7)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('1st Inversion \u2014 Elliptical Trammel', 10, 20);
    ctx.restore();

    /* info panel */
    var panelX = 300, panelY = 30, panelW = 135, panelH = 70;
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.75)'; ctx.strokeStyle = 'rgba(100,120,150,0.4)'; ctx.lineWidth = 1;
    roundRect(ctx, panelX, panelY, panelW, panelH, 6); ctx.fill();
    roundRect(ctx, panelX, panelY, panelW, panelH, 6); ctx.stroke();
    ctx.fillStyle = '#ccd0dd'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('\u03b8 = ' + (theta*DEG).toFixed(1) + '\u00b0', panelX+10, panelY+16);
    ctx.fillText('a = ' + a.toFixed(0) + ' mm', panelX+10, panelY+32);
    ctx.fillText('b = ' + b.toFixed(0) + ' mm', panelX+10, panelY+48);
    ctx.fillText('L = ' + barLen + ' mm', panelX+10, panelY+64);
    ctx.restore();
  }

  /* ---- 2nd Inversion: Scotch Yoke (FIXED slot sizing) ---- */
  function draw2ndInversion() {
    var r = state.r, theta = state.theta;
    var ox = 200, oy = 260;

    var pinX = ox + r * S * Math.cos(-theta);
    var pinY = oy + r * S * Math.sin(-theta);
    var yokeX = pinX;

    /* AUTO-SIZED yoke: always fits pin travel */
    var yokeH = (2 * r + 30) * S;
    var yokeSlotW = 16;
    var yokeBodyW = 24;
    var yokeTop = oy - yokeH / 2;

    /* crank circle */
    ctx.save();
    ctx.beginPath(); ctx.arc(ox, oy, r * S, 0, TAU);
    ctx.strokeStyle = 'rgba(0,145,234,0.2)'; ctx.lineWidth = 1;
    ctx.setLineDash([4,4]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

    /* horizontal guide rails */
    var railTop = oy - yokeH / 2 - 15;
    var railBot = oy + yokeH / 2 + 15;
    var railL = ox - (r + 25) * S;
    var railR = ox + (r + 25) * S;
    ctx.save(); ctx.strokeStyle = '#556677'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(railL, railTop); ctx.lineTo(railR, railTop); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(railL, railBot); ctx.lineTo(railR, railBot); ctx.stroke();
    ctx.restore();

    /* yoke body — brushed-brass vertical bar with cross-section sheen */
    var yokeBodyL = yokeX - yokeBodyW / 2;
    ctx.save();
    var yg = ctx.createLinearGradient(yokeBodyL, 0, yokeBodyL + yokeBodyW, 0);
    yg.addColorStop(0,   'rgba(124,94,16,0.55)');
    yg.addColorStop(0.5, 'rgba(245,200,66,0.42)');
    yg.addColorStop(0.5, 'rgba(245,200,66,0.42)');
    yg.addColorStop(1,   'rgba(110,82,12,0.55)');
    ctx.fillStyle = yg;
    roundRect(ctx, yokeBodyL, yokeTop, yokeBodyW, yokeH, 4); ctx.fill();
    /* left specular edge */
    ctx.fillStyle = 'rgba(255,231,154,0.55)';
    ctx.fillRect(yokeBodyL + 2, yokeTop + 4, 2, yokeH - 8);
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2.5;
    roundRect(ctx, yokeBodyL, yokeTop, yokeBodyW, yokeH, 4); ctx.stroke();
    ctx.restore();

    /* yoke slot */
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.7)';
    ctx.fillRect(yokeX - yokeSlotW / 2, yokeTop + 4, yokeSlotW, yokeH - 8);
    ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 1;
    ctx.strokeRect(yokeX - yokeSlotW / 2, yokeTop + 4, yokeSlotW, yokeH - 8);
    ctx.restore();

    /* yoke arms to rails */
    ctx.save();
    ctx.fillStyle = 'rgba(245,200,66,0.12)'; ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2;
    ctx.fillRect(yokeX - 12, railTop, 24, yokeTop - railTop);
    ctx.strokeRect(yokeX - 12, railTop, 24, yokeTop - railTop);
    ctx.fillRect(yokeX - 12, yokeTop + yokeH, 24, railBot - yokeTop - yokeH);
    ctx.strokeRect(yokeX - 12, yokeTop + yokeH, 24, railBot - yokeTop - yokeH);
    ctx.restore();

    /* extreme position markers */
    var extR = ox + r * S, extL = ox - r * S;
    ctx.save(); ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(extR, oy-50); ctx.lineTo(extR, oy+50); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(extL, oy-50); ctx.lineTo(extL, oy+50); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#6b7a99'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('+r', extR, oy-55); ctx.fillText('\u2212r', extL, oy-55);
    ctx.restore();

    /* mean line */
    ctx.save(); ctx.strokeStyle = 'rgba(0,145,234,0.3)'; ctx.lineWidth = 1;
    ctx.setLineDash([2,4]); ctx.beginPath(); ctx.moveTo(ox, oy-45); ctx.lineTo(ox, oy+45); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    /* crank arm — blue steel rod */
    metalLink(ox, oy, pinX, pinY, 10, '#024a78', '#0091ea', '#7fd0ff');

    /* counterweight */
    ctx.save();
    var cwA = theta + PI, cwR = r*S*0.3;
    ctx.beginPath(); ctx.arc(ox+Math.cos(-cwA)*r*S*0.4, oy+Math.sin(-cwA)*r*S*0.4, cwR, 0, TAU);
    ctx.fillStyle = 'rgba(0,145,234,0.2)'; ctx.fill();
    ctx.strokeStyle = '#0091ea'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();

    /* crank pin — domed */
    drawPivot(pinX, pinY, '#ff8a65', 6);

    /* theta arc */
    if (Math.abs(theta % TAU) > 0.02) drawAngleArc(ox, oy, 30, 0, theta, '#3ddc84', '\u03b8');

    /* ground pivot */
    drawPivot(ox, oy, '#0091ea', 7);
    drawHatch(ox, oy + 9, 40, 'down');

    /* labels */
    ctx.save(); ctx.fillStyle = '#ccd0dd'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('O', ox, oy+30); ctx.fillText('P', pinX+12, pinY-10);
    ctx.fillStyle = 'rgba(200,210,230,0.7)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('2nd Inversion \u2014 Scotch Yoke (Pure SHM)', 10, 20); ctx.restore();

    /* displacement arrow */
    if (Math.abs(yokeX - ox) > 5) {
      ctx.save(); ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1.5; ctx.setLineDash([3,3]);
      ctx.beginPath(); ctx.moveTo(ox, oy+yokeH/2+25); ctx.lineTo(yokeX, oy+yokeH/2+25); ctx.stroke();
      ctx.setLineDash([]);
      var ad = yokeX > ox ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(yokeX, oy+yokeH/2+25);
      ctx.lineTo(yokeX-ad*6, oy+yokeH/2+21); ctx.lineTo(yokeX-ad*6, oy+yokeH/2+29); ctx.closePath();
      ctx.fillStyle = '#3ddc84'; ctx.fill();
      ctx.font = '10px monospace'; ctx.textAlign = 'center';
      ctx.fillText('x='+yokeDisp(r,theta).toFixed(1), (ox+yokeX)/2, oy+yokeH/2+40);
      ctx.restore();
    }

    /* info panel */
    var omega = state.rpm * TAU / 60;
    var d = yokeDisp(r, theta), vel = yokeVel(r, omega, theta), acc = yokeAcc(r, omega, theta);
    var pX = 300, pY = 30, pW = 140, pH = 100;
    ctx.save(); ctx.fillStyle = 'rgba(13,17,23,0.75)'; ctx.strokeStyle = 'rgba(100,120,150,0.4)'; ctx.lineWidth = 1;
    roundRect(ctx, pX, pY, pW, pH, 6); ctx.fill(); roundRect(ctx, pX, pY, pW, pH, 6); ctx.stroke();
    ctx.fillStyle = '#ccd0dd'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    var lh = 16, sY = pY+16;
    ctx.fillText('\u03b8 = '+(theta*DEG).toFixed(1)+'\u00b0', pX+10, sY);
    ctx.fillText('x = '+d.toFixed(2)+' mm', pX+10, sY+lh);
    ctx.fillText('v = '+vel.toFixed(1)+' mm/s', pX+10, sY+lh*2);
    ctx.fillText('a = '+acc.toFixed(0)+' mm/s\u00b2', pX+10, sY+lh*3);
    ctx.fillText('S = '+(2*r)+' mm', pX+10, sY+lh*4);
    ctx.restore();
  }

  /* ---- 3rd Inversion: Oldham's Coupling ---- */
  function draw3rdInversion() {
    var r = state.r, theta = state.theta, d = state.offset;
    var ox = 200, oy = 260;

    /* Two shafts: input (left) and output (right), offset by d */
    var shaft1X = ox - d * S / 2, shaft1Y = oy;
    var shaft2X = ox + d * S / 2, shaft2Y = oy;

    /* Both shafts rotate at same angle theta */
    /* Input shaft has horizontal tongue at angle theta */
    /* Output shaft has vertical tongue at angle theta */
    /* Central disc has two perpendicular slots */

    /* Disc centre position */
    var discCX = shaft1X + (d * S / 2) * (1 + Math.cos(-theta));
    var discCY = shaft1Y + (d * S / 2) * Math.sin(-theta);
    /* More accurately: disc centre traces a circle of radius d/2 about the midpoint */
    discCX = ox + (d * S / 2) * Math.cos(-theta);
    discCY = oy + (d * S / 2) * Math.sin(-theta);

    var discR = Math.max(r, d) * S * 0.8;

    /* shaft circles */
    ctx.save(); ctx.strokeStyle = 'rgba(100,120,150,0.2)'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.arc(shaft1X, shaft1Y, r*S*0.4, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(shaft2X, shaft2Y, r*S*0.4, 0, TAU); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    /* disc centre path */
    ctx.save(); ctx.beginPath();
    for (var i = 0; i <= 360; i += 3) {
      var t = i*RAD;
      var px = ox + (d*S/2)*Math.cos(t), py = oy + (d*S/2)*Math.sin(t);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.strokeStyle = 'rgba(61,220,132,0.3)'; ctx.lineWidth = 1;
    ctx.setLineDash([3,3]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

    /* central disc */
    ctx.save();
    ctx.beginPath(); ctx.arc(discCX, discCY, discR, 0, TAU);
    ctx.fillStyle = 'rgba(245,200,66,0.1)'; ctx.fill();
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();

    /* disc slot 1 (horizontal, for shaft 1 tongue) - rotated by theta */
    ctx.save();
    ctx.translate(discCX, discCY);
    ctx.rotate(-theta);
    ctx.fillStyle = 'rgba(13,17,23,0.6)';
    ctx.fillRect(-discR + 5, -5, discR*2 - 10, 10);
    ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 1;
    ctx.strokeRect(-discR + 5, -5, discR*2 - 10, 10);
    ctx.restore();

    /* disc slot 2 (perpendicular to slot 1) */
    ctx.save();
    ctx.translate(discCX, discCY);
    ctx.rotate(-theta + PI/2);
    ctx.fillStyle = 'rgba(13,17,23,0.6)';
    ctx.fillRect(-discR + 5, -5, discR*2 - 10, 10);
    ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 1;
    ctx.strokeRect(-discR + 5, -5, discR*2 - 10, 10);
    ctx.restore();

    /* shaft 1 tongue (slides in disc slot 1) */
    var t1endX = shaft1X + r*S*0.6 * Math.cos(-theta);
    var t1endY = shaft1Y + r*S*0.6 * Math.sin(-theta);
    ctx.save(); ctx.beginPath(); ctx.moveTo(shaft1X, shaft1Y); ctx.lineTo(t1endX, t1endY);
    ctx.strokeStyle = '#0091ea'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();

    /* shaft 1 body */
    ctx.save(); ctx.beginPath(); ctx.moveTo(shaft1X, shaft1Y);
    ctx.lineTo(shaft1X - r*S*0.5*Math.cos(-theta), shaft1Y - r*S*0.5*Math.sin(-theta));
    ctx.strokeStyle = '#0091ea'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();

    /* shaft 2 tongue (slides in disc slot 2) */
    var t2endX = shaft2X + r*S*0.6 * Math.cos(-theta);
    var t2endY = shaft2Y + r*S*0.6 * Math.sin(-theta);
    ctx.save(); ctx.beginPath(); ctx.moveTo(shaft2X, shaft2Y); ctx.lineTo(t2endX, t2endY);
    ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();

    /* shaft 2 body */
    ctx.save(); ctx.beginPath(); ctx.moveTo(shaft2X, shaft2Y);
    ctx.lineTo(shaft2X + r*S*0.5*Math.cos(-theta+PI), shaft2Y + r*S*0.5*Math.sin(-theta+PI));
    ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();

    /* ground hatching at shaft bearings */
    drawHatch(shaft1X, shaft1Y + r*S*0.5, 30, 'down');
    drawHatch(shaft2X, shaft2Y + r*S*0.5, 30, 'down');

    /* pivots */
    drawPivot(shaft1X, shaft1Y, '#0091ea', 6);
    drawPivot(shaft2X, shaft2Y, '#ef5350', 6);
    drawPivot(discCX, discCY, '#3ddc84', 4);

    /* offset dimension */
    ctx.save(); ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(shaft1X, shaft1Y + r*S*0.7); ctx.lineTo(shaft2X, shaft2Y + r*S*0.7); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#6b7a99'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('d='+d+' mm', ox, shaft1Y + r*S*0.7 + 14);
    ctx.restore();

    /* angle arcs */
    if (Math.abs(theta % TAU) > 0.02) {
      drawAngleArc(shaft1X, shaft1Y, 25, 0, theta, '#42a5f5', '\u03b8');
      drawAngleArc(shaft2X, shaft2Y, 25, 0, theta, '#ef5350', '\u03b8');
    }

    /* labels */
    ctx.save(); ctx.fillStyle = '#ccd0dd'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('Input', shaft1X, shaft1Y - r*S*0.6);
    ctx.fillText('Output', shaft2X, shaft2Y - r*S*0.6);
    ctx.fillText('Disc', discCX + discR + 12, discCY);
    ctx.fillStyle = 'rgba(200,210,230,0.7)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('3rd Inversion \u2014 Oldham\u2019s Coupling', 10, 20);
    ctx.restore();

    /* info panel */
    var omega = state.rpm * TAU / 60;
    var pX = 300, pY = 30, pW = 140, pH = 84;
    ctx.save(); ctx.fillStyle = 'rgba(13,17,23,0.75)'; ctx.strokeStyle = 'rgba(100,120,150,0.4)'; ctx.lineWidth = 1;
    roundRect(ctx, pX, pY, pW, pH, 6); ctx.fill(); roundRect(ctx, pX, pY, pW, pH, 6); ctx.stroke();
    ctx.fillStyle = '#ccd0dd'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('\u03b8 = '+(theta*DEG).toFixed(1)+'\u00b0', pX+10, pY+16);
    ctx.fillText('\u03c9 = '+omega.toFixed(2)+' rad/s', pX+10, pY+32);
    ctx.fillText('d = '+d+' mm', pX+10, pY+48);
    ctx.fillText('\u03c9\u2081 = \u03c9\u2082 (equal)', pX+10, pY+64);
    ctx.fillText('v_disc = '+(omega*d/2).toFixed(1)+' mm/s', pX+10, pY+80);
    ctx.restore();
  }

  /* ---- drawMechanism dispatcher ---- */
  function drawMechanism() {
    switch (state.inversion) {
      case 1: draw1stInversion(); break;
      case 2: draw2ndInversion(); break;
      case 3: draw3rdInversion(); break;
    }
  }

  /* ================================================================
     SECTION 10: GRAPH DRAWING
     ================================================================ */
  function drawGraph() {
    var gL = GRAPH_L, gR = GRAPH_R, gT = GRAPH_T, gB = GRAPH_B;
    var gW = gR - gL, gH = gB - gT;
    var r = state.r, l = r * 3;
    var omega = state.rpm * TAU / 60;

    ctx.save(); ctx.fillStyle = 'rgba(13,17,23,0.6)';
    ctx.fillRect(gL-10, gT-20, gW+30, gH+40); ctx.restore();

    var data = [], data2 = [];
    var yMin = Infinity, yMax = -Infinity;
    var isComp = state.graphType === 'comparison';

    for (var i = 0; i <= 360; i += 2) {
      var th = i * RAD; var val = 0, val2 = 0;
      if (state.graphType === 'displacement' || isComp) {
        val = yokeDisp(r, th);
        if (isComp || state.showOverlay) val2 = scDisp(r, l, th);
      } else if (state.graphType === 'velocity') {
        val = yokeVel(r, omega, th);
        if (state.showOverlay) val2 = scVel(r, l, omega, th);
      } else if (state.graphType === 'acceleration') {
        val = yokeAcc(r, omega, th);
        if (state.showOverlay) val2 = scAcc(r, l, omega, th);
      }
      data.push({deg:i, val:val}); data2.push({deg:i, val:val2});
      if (val < yMin) yMin = val; if (val > yMax) yMax = val;
      if ((isComp || state.showOverlay) && val2) { if (val2 < yMin) yMin = val2; if (val2 > yMax) yMax = val2; }
    }

    var yRange = yMax - yMin;
    if (yRange < 0.001) { yRange = 1; yMin -= 0.5; yMax += 0.5; }
    yMin -= yRange*0.08; yMax += yRange*0.08; yRange = yMax - yMin;

    ctx.save(); ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gL,gB); ctx.lineTo(gR,gB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gL,gT); ctx.lineTo(gL,gB); ctx.stroke();

    ctx.strokeStyle = 'rgba(100,120,150,0.15)'; ctx.lineWidth = 0.5;
    for (var gx = 0; gx <= 360; gx += 90) { var px = gL+(gx/360)*gW; ctx.beginPath(); ctx.moveTo(px,gT); ctx.lineTo(px,gB); ctx.stroke(); }
    for (var gi = 0; gi <= 4; gi++) { var gy = gT+gi*(gH/4); ctx.beginPath(); ctx.moveTo(gL,gy); ctx.lineTo(gR,gy); ctx.stroke(); }

    ctx.fillStyle = '#8899aa'; ctx.font = '10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var xl = 0; xl <= 360; xl += 90) ctx.fillText(xl+'\u00b0', gL+(xl/360)*gW, gB+5);
    ctx.fillText('Crank Angle \u03b8 (\u00b0)', (gL+gR)/2, gB+20);

    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var yi = 0; yi <= 4; yi++) { var yv = yMax-yi*(yRange/4); ctx.fillText(yv.toFixed(1), gL-5, gT+yi*(gH/4)); }

    ctx.save(); ctx.translate(gL-45,(gT+gB)/2); ctx.rotate(-PI/2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#8899aa'; ctx.font = '10px monospace';
    var yTit = isComp ? 'Displacement (mm)' : state.graphType === 'displacement' ? 'Displacement (mm)' : state.graphType === 'velocity' ? 'Velocity (mm/s)' : 'Acceleration (mm/s\u00b2)';
    ctx.fillText(yTit, 0, 0); ctx.restore();

    ctx.fillStyle = '#ccd0dd'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    var gTit = isComp ? 'Scotch Yoke (SHM) vs Slider-Crank' : state.graphType === 'displacement' ? 'Yoke Displacement vs Crank Angle' : state.graphType === 'velocity' ? 'Yoke Velocity vs Crank Angle' : 'Yoke Acceleration vs Crank Angle';
    ctx.fillText(gTit, (gL+gR)/2, gT-5);

    /* overlay curve */
    if (isComp || state.showOverlay) {
      ctx.beginPath(); var s2 = false;
      for (var ci2 = 0; ci2 < data2.length; ci2++) {
        var cx2 = gL+(data2[ci2].deg/360)*gW, cy2 = gT+((yMax-data2[ci2].val)/yRange)*gH;
        if (!s2) { ctx.moveTo(cx2,cy2); s2=true; } else ctx.lineTo(cx2,cy2);
      }
      ctx.strokeStyle = '#ff8a65'; ctx.lineWidth = 2; ctx.setLineDash([6,4]); ctx.stroke(); ctx.setLineDash([]);
    }

    /* main curve */
    ctx.beginPath(); var st = false;
    for (var ci = 0; ci < data.length; ci++) {
      var cx = gL+(data[ci].deg/360)*gW, cy = gT+((yMax-data[ci].val)/yRange)*gH;
      if (!st) { ctx.moveTo(cx,cy); st=true; } else ctx.lineTo(cx,cy);
    }
    var cc = isComp ? '#0091ea' : state.graphType === 'displacement' ? '#3ddc84' : state.graphType === 'velocity' ? '#42a5f5' : '#ef5350';
    ctx.strokeStyle = cc; ctx.lineWidth = 2.5; ctx.stroke();

    /* legend */
    if (isComp || state.showOverlay) {
      ctx.font = '10px monospace'; ctx.textAlign = 'left';
      ctx.strokeStyle = cc; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gR-180,gT+12); ctx.lineTo(gR-155,gT+12); ctx.stroke();
      ctx.fillStyle = cc; ctx.fillText('Scotch Yoke', gR-150, gT+16);
      ctx.strokeStyle = '#ff8a65'; ctx.setLineDash([6,4]); ctx.beginPath(); ctx.moveTo(gR-180,gT+28); ctx.lineTo(gR-155,gT+28); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ff8a65'; ctx.fillText('Slider-Crank', gR-150, gT+32);
    }

    /* animated dot */
    var curDeg = (state.theta*DEG)%360; if (curDeg < 0) curDeg += 360;
    var idx = curDeg/2, idxF = Math.floor(idx), idxC = Math.min(idxF+1, data.length-1), frac = idx-idxF;
    var curVal = data[idxF].val*(1-frac)+data[idxC].val*frac;
    var dotX = gL+(curDeg/360)*gW, dotY = gT+((yMax-curVal)/yRange)*gH;
    ctx.beginPath(); ctx.arc(dotX,dotY,5,0,TAU); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = cc; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = '11px monospace';
    ctx.textAlign = dotX > (gL+gR)/2 ? 'right' : 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText(curVal.toFixed(1), dotX+(dotX>(gL+gR)/2?-10:10), dotY-8);
    ctx.restore();
  }

  /* ================================================================
     SECTION 11: MAIN DRAW & READOUTS
     ================================================================ */
  function drawSceneBackground() {
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#10151f'); bg.addColorStop(0.55, '#0d1117'); bg.addColorStop(1, '#090c11');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, 450, H); ctx.clip();
    var glow = ctx.createRadialGradient(205, 260, 30, 205, 260, 300);
    glow.addColorStop(0, 'rgba(79,142,247,0.10)'); glow.addColorStop(1, 'rgba(79,142,247,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, 450, H);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0,0,W,H); drawSceneBackground();
    drawGrid(); drawDivider(); drawMechanism(); drawGraph(); updateReadouts();
  }

  function updateReadouts() {
    var omega = state.rpm * TAU / 60;
    var d = yokeDisp(state.r, state.theta);
    var vel = yokeVel(state.r, omega, state.theta);
    var acc = yokeAcc(state.r, omega, state.theta);
    var T = state.rpm > 0 ? 60 / state.rpm : 0;
    setText('r-theta', (state.theta*DEG).toFixed(1)+'\u00b0');
    setText('r-disp', d.toFixed(2));
    setText('r-vel', vel.toFixed(1));
    setText('r-acc', acc.toFixed(0));
    setText('r-stroke', (2*state.r).toFixed(0));
    setText('r-omega', omega.toFixed(2));
    setText('r-period', T.toFixed(3));
    setText('r-vmax', (state.r*omega).toFixed(1));
  }
  function setText(id, val) { var el = $(id); if (el) el.textContent = val; }

  /* ================================================================
     SECTION 12: ANIMATION LOOP
     ================================================================ */
  var animId = null, lastTime = 0;
  function animate(ts) {
    animId = requestAnimationFrame(animate);
    if (!state.running || state.mode !== 'simulate') { lastTime = ts; return; }
    var dt = lastTime ? (ts-lastTime)/1000 : 0; lastTime = ts;
    if (dt > 0.1) dt = 0.016;
    state.theta += state.rpm * TAU / 60 * dt;
    if (state.theta >= TAU) state.theta -= TAU;
    if (state.theta < 0) state.theta += TAU;
    draw();
  }
  animId = requestAnimationFrame(animate);

  /* ================================================================
     SECTION 13: EVENT HANDLERS
     ================================================================ */
  var modeTabs = $('mode-tabs');
  if (modeTabs) modeTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-mode]'); if (!btn) return;
    showMode(btn.getAttribute('data-mode'));
  });

  /* Inversion tabs */
  var invTabs = $('inv-tabs');
  if (invTabs) invTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-inv]'); if (!btn) return;
    var inv = parseInt(btn.getAttribute('data-inv'), 10);
    state.inversion = inv;
    qsa('#inv-tabs [data-inv]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    /* show/hide relevant sliders */
    var grpOff = $('grp-offset'); if (grpOff) grpOff.style.display = inv === 3 ? '' : 'none';
    var grpBar = $('grp-bar'); if (grpBar) grpBar.style.display = inv === 1 ? '' : 'none';
    draw();
  });

  /* Graph tabs */
  var graphTabs = $('graph-tabs');
  if (graphTabs) graphTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-graph]'); if (!btn) return;
    state.graphType = btn.getAttribute('data-graph');
    qsa('#graph-tabs [data-graph]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active'); draw();
  });

  /* Sliders */
  function onSlider(slId, valId, prop, parser, suffix) {
    var sl = $(slId), val = $(valId); if (!sl) return;
    sl.addEventListener('input', function () {
      var v = parser ? parser(sl.value) : parseFloat(sl.value);
      state[prop] = v; if (val) val.textContent = v + (suffix || ''); draw();
    });
  }
  onSlider('sl-crank', 'val-crank', 'r', parseInt, ' mm');
  onSlider('sl-rpm', 'val-rpm', 'rpm', parseInt, ' RPM');
  onSlider('sl-offset', 'val-offset', 'offset', parseInt, ' mm');
  onSlider('sl-bar', 'val-bar', 'barLen', parseInt, ' mm');

  /* Preset buttons */
  qsa('.preset-btn').forEach(function (btn) {
    btn.addEventListener('pointerdown', function () {
      var name = btn.getAttribute('data-preset');
      if (name && PRESETS[name]) applyPreset(name);
    });
  });
  function applyPreset(name) {
    var p = PRESETS[name]; if (!p) return;
    state.r = p.r; state.rpm = p.rpm; state.barLen = p.barLen; state.offset = p.offset;
    state.theta = 0; state.activePreset = name;
    setSlider('sl-crank','val-crank',p.r,' mm');
    setSlider('sl-rpm','val-rpm',p.rpm,' RPM');
    setSlider('sl-bar','val-bar',p.barLen,' mm');
    setSlider('sl-offset','val-offset',p.offset,' mm');
    qsa('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    var act = qs('.preset-btn[data-preset="'+name+'"]'); if (act) act.classList.add('active');
    draw();
  }
  function setSlider(slId, valId, val, suffix) {
    var sl = $(slId), vEl = $(valId);
    if (sl) sl.value = val; if (vEl) vEl.textContent = val + (suffix || '');
  }

  /* Canvas click: toggle running */
  cvs.addEventListener('pointerdown', function () { if (state.mode === 'simulate') state.running = !state.running; });

  /* Keyboard */
  document.addEventListener('keydown', function (ev) {
    if (state.mode !== 'simulate') return;
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
    if (ev.code === 'Space') { ev.preventDefault(); state.running = !state.running; }
    else if (ev.code === 'ArrowRight') { ev.preventDefault(); state.running = false; state.theta += 2*RAD; if (state.theta >= TAU) state.theta -= TAU; draw(); }
    else if (ev.code === 'ArrowLeft') { ev.preventDefault(); state.running = false; state.theta -= 2*RAD; if (state.theta < 0) state.theta += TAU; draw(); }
  });

  /* ================================================================
     SECTION 14: MODE SWITCHING
     ================================================================ */
  function showMode(mode) {
    state.mode = mode;
    qsa('#mode-tabs [data-mode]').forEach(function (b) { b.classList.remove('active'); });
    var ab = qs('#mode-tabs [data-mode="'+mode+'"]'); if (ab) ab.classList.add('active');
    var panels = {
      'sim-panel': mode==='simulate', 'cat-row': mode==='explore', 'cat-tabs': mode==='explore',
      'concept-grid': mode==='explore'&&!state.exploreItem, 'item-info': mode==='explore'&&!!state.exploreItem,
      'practice-panel': mode==='practice', 'practice-bar': mode==='practice',
      'quiz-panel': mode==='quiz', 'quiz-bar': mode==='quiz', 'quiz-result': false
    };
    for (var pid in panels) { var el = $(pid); if (el) el.style.display = panels[pid] ? '' : 'none'; }
    if (mode === 'simulate') { state.running = true; draw(); }
    else {
      state.running = false;
      if (mode === 'explore') renderConceptGrid();
      if (mode === 'practice' && !state.pracCurrent) newPracticeProblem();
      if (mode === 'quiz' && state.quizQuestions.length === 0) startQuiz();
      draw();
    }
  }

  /* ================================================================
     SECTION 15: EXPLORE MODE
     ================================================================ */
  var catTabs = $('cat-tabs');
  if (catTabs) catTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-cat]'); if (!btn) return;
    state.exploreCat = btn.getAttribute('data-cat'); state.exploreItem = null;
    qsa('#cat-tabs [data-cat]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active'); renderConceptGrid();
    var info = $('item-info'); if (info) info.style.display = 'none';
    var grid = $('concept-grid'); if (grid) grid.style.display = '';
  });

  function renderConceptGrid() {
    var grid = $('concept-grid'); if (!grid) return;
    grid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === state.exploreCat; });
    var container = document.createElement('div'); container.className = 'is-grid';
    filtered.forEach(function (c) {
      var btn = document.createElement('button'); btn.className = 'is-btn';
      if (state.exploreItem && state.exploreItem.id === c.id) btn.classList.add('active');
      btn.innerHTML = '<span class="is-btn-name">'+c.name+'</span><span class="is-btn-sym">'+c.symbol+'</span>';
      btn.addEventListener('pointerdown', function () {
        showConceptInfo(c);
        container.querySelectorAll('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
      container.appendChild(btn);
    });
    grid.appendChild(container); grid.style.display = '';
  }

  function showConceptInfo(concept) {
    state.exploreItem = concept;
    var info = $('item-info'); if (!info) return;
    var catLabel = concept.cat === 'basics' ? 'Basics' : concept.cat === 'kinematics' ? 'Kinematics' : 'Design & Applications';
    var html = '<div class="ii-top"><span class="ii-name">'+concept.name+'</span><span class="ii-cat-badge">'+catLabel+'</span></div>';
    html += '<div class="ii-desc">'+concept.desc.replace(/\n/g,'<br>')+'</div>';
    if (concept.formula && concept.formula !== '\u2014') {
      html += '<div class="formula-box"><span class="fb-formula">'+concept.formula+'</span>';
      if (concept.unit && concept.unit !== '\u2014') html += '<span class="fb-unit">['+concept.unit+']</span>';
      html += '</div>';
    }
    if (concept.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<div class="ex-problem">'+concept.example.problem+'</div>';
      concept.example.steps.forEach(function (s) { html += '<div class="ex-step">'+s+'</div>'; });
      html += '</div>';
    }
    info.innerHTML = html; info.style.display = '';
  }

  /* ================================================================
     SECTION 16: PRACTICE MODE
     ================================================================ */
  function newPracticeProblem() {
    var idx = randInt(0, PROBLEM_GEN.length - 1);
    state.pracCurrent = PROBLEM_GEN[idx](); state.pracAnswered = false;
    var prompt = $('pp-prompt'), input = $('pp-input'), unit = $('pp-unit');
    var feedback = $('pp-feedback'), solution = $('pp-solution'), nextBtn = $('pp-next');
    if (prompt) prompt.textContent = state.pracCurrent.prompt;
    if (input) { input.value = ''; input.disabled = false; input.type = state.pracCurrent.type === 'text' ? 'text' : 'number'; input.focus(); }
    if (unit) unit.textContent = state.pracCurrent.unit;
    if (feedback) { feedback.textContent = ''; feedback.className = 'feedback'; }
    if (solution) solution.style.display = 'none';
    if (nextBtn) nextBtn.disabled = true;
  }

  var ppCheck = $('pp-check');
  if (ppCheck) ppCheck.addEventListener('pointerdown', function () {
    if (state.pracAnswered || !state.pracCurrent) return;
    var input = $('pp-input'), feedback = $('pp-feedback'); if (!input || !feedback) return;
    var uv = input.value.trim(); if (!uv) return;
    state.pracAnswered = true; state.pracTotal++; input.disabled = true;
    var correct = false;
    if (state.pracCurrent.type === 'text') {
      correct = uv.toLowerCase().replace(/\s+/g,'') === String(state.pracCurrent.answer).toLowerCase().replace(/\s+/g,'');
    } else {
      var num = parseFloat(uv), ans = state.pracCurrent.answer;
      var tol = Math.abs(ans) < 1 ? 0.05 : Math.abs(ans) * 0.02;
      correct = Math.abs(num - ans) <= Math.max(tol, 0.5);
    }
    if (correct) { state.pracScore++; feedback.textContent = '\u2714 Correct!'; feedback.className = 'feedback ok'; }
    else { feedback.textContent = '\u2718 Incorrect. Answer: '+state.pracCurrent.answer+' '+state.pracCurrent.unit; feedback.className = 'feedback err'; showSolution(); }
    setText('pp-score', state.pracScore+' / '+state.pracTotal);
    var nextBtn = $('pp-next'); if (nextBtn) nextBtn.disabled = false;
  });

  var ppNext = $('pp-next');
  if (ppNext) ppNext.addEventListener('pointerdown', function () { newPracticeProblem(); });
  var ppShowSol = $('pp-show-sol');
  if (ppShowSol) ppShowSol.addEventListener('pointerdown', function () { showSolution(); });

  function showSolution() {
    if (!state.pracCurrent) return;
    var sol = $('pp-solution'), steps = $('pp-sol-steps'); if (!sol || !steps) return;
    steps.innerHTML = '';
    state.pracCurrent.steps.forEach(function (s) {
      var div = document.createElement('div'); div.className = 'sol-step'; div.innerHTML = s; steps.appendChild(div);
    });
    sol.style.display = '';
  }

  var ppInput = $('pp-input');
  if (ppInput) ppInput.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && !state.pracAnswered) { ev.preventDefault(); if (ppCheck) ppCheck.click(); }
  });

  /* ================================================================
     SECTION 17: QUIZ MODE
     ================================================================ */
  function startQuiz() {
    var pool = QUIZ_POOL.slice(); shuffle(pool);
    state.quizQuestions = pool.slice(0,5); state.quizIdx = 0; state.quizScore = 0;
    state.quizAnswered = false; state.quizResults = [];
    showQuizQuestion();
    var result = $('quiz-result'); if (result) result.style.display = 'none';
    var panel = $('quiz-panel'); if (panel) panel.style.display = '';
    var bar = $('quiz-bar'); if (bar) bar.style.display = '';
  }

  function showQuizQuestion() {
    var q = state.quizQuestions[state.quizIdx]; if (!q) return;
    state.quizAnswered = false;
    setText('qbar-num', state.quizIdx+1); setText('qbar-total', state.quizQuestions.length);
    var prompt = $('qp-prompt'); if (prompt) prompt.textContent = q.q;
    var feedback = $('qp-feedback'); if (feedback) { feedback.textContent = ''; feedback.className = 'quiz-feedback'; }
    var grid = $('qp-answers');
    if (grid) {
      grid.innerHTML = '';
      q.choices.forEach(function (ch, ci) {
        var btn = document.createElement('button'); btn.className = 'answer-btn'; btn.textContent = ch;
        btn.addEventListener('pointerdown', function () { if (state.quizAnswered) return; handleQuizAnswer(ci); });
        grid.appendChild(btn);
      });
    }
    var qiRow = $('qi-row'); if (qiRow) qiRow.style.display = 'none';
    var submitBtn = $('q-submit'); if (submitBtn) submitBtn.style.display = 'none';
    var nextBtn = $('q-next'); if (nextBtn) nextBtn.disabled = true;
  }

  function handleQuizAnswer(chosen) {
    state.quizAnswered = true;
    var q = state.quizQuestions[state.quizIdx]; var correct = chosen === q.correct;
    if (correct) state.quizScore++;
    state.quizResults.push({q:q.q, chosen:q.choices[chosen], correct:correct, answer:q.choices[q.correct]});
    var feedback = $('qp-feedback');
    if (feedback) { feedback.textContent = correct ? '\u2714 Correct!' : '\u2718 Incorrect. Answer: '+q.choices[q.correct]; feedback.className = 'quiz-feedback '+(correct?'ok':'err'); }
    var grid = $('qp-answers');
    if (grid) { grid.querySelectorAll('.answer-btn').forEach(function (b, bi) { b.classList.add('locked'); if (bi===q.correct) b.classList.add('correct'); if (bi===chosen&&!correct) b.classList.add('wrong'); }); }
    var nextBtn = $('q-next'); if (nextBtn) nextBtn.disabled = false;
  }

  var qNext = $('q-next');
  if (qNext) qNext.addEventListener('pointerdown', function () {
    if (!state.quizAnswered) return; state.quizIdx++;
    if (state.quizIdx >= state.quizQuestions.length) showQuizResult(); else showQuizQuestion();
  });

  function showQuizResult() {
    var panel = $('quiz-panel'), bar = $('quiz-bar'), result = $('quiz-result');
    if (panel) panel.style.display = 'none'; if (bar) bar.style.display = 'none'; if (result) result.style.display = '';
    var pct = Math.round(state.quizScore/state.quizQuestions.length*100);
    var scoreEl = $('qr-score');
    if (scoreEl) { scoreEl.textContent = pct+'%'; scoreEl.className = 'qr-score '+(pct===100?'perfect':pct>=60?'good':'poor'); }
    var verdict = $('qr-verdict'); if (verdict) verdict.textContent = state.quizScore+' of '+state.quizQuestions.length+' correct';
    var stars = $('qr-stars'); if (stars) { var s = pct>=100?5:pct>=80?4:pct>=60?3:pct>=40?2:1; stars.textContent = '\u2605'.repeat(s)+'\u2606'.repeat(5-s); }
    var rows = $('qr-rows');
    if (rows) { rows.innerHTML = ''; state.quizResults.forEach(function (r, ri) {
      var div = document.createElement('div'); div.className = 'qr-row '+(r.correct?'ok':'err');
      div.innerHTML = '<span class="qr-qnum">Q'+(ri+1)+'</span><span class="qr-detail">'+r.q+' <strong>'+r.answer+'</strong></span><span class="qr-mark">'+(r.correct?'\u2714':'\u2718')+'</span>';
      rows.appendChild(div);
    }); }
  }

  var qNewQuiz = $('q-new-quiz');
  if (qNewQuiz) qNewQuiz.addEventListener('pointerdown', function () { startQuiz(); });

  /* ================================================================
     SECTION 18: INITIAL SETUP
     ================================================================ */
  /* hide sliders based on default inversion (2nd = Scotch Yoke) */
  var grpOff = $('grp-offset'); if (grpOff) grpOff.style.display = 'none';
  var grpBar = $('grp-bar'); if (grpBar) grpBar.style.display = 'none';

  draw();

})();
