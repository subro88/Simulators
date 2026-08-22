(function () {
  'use strict';

  var PI = Math.PI, TAU = 2 * PI, DEG = 180 / PI, RAD = PI / 180;
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(arr) { for (var i = arr.length - 1; i > 0; i--) { var j = randInt(0, i); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; } return arr; }
  function $(id) { return document.getElementById(id); }
  function qs(s) { return document.querySelector(s); }
  function qsa(s) { return document.querySelectorAll(s); }

  /* ================================================================
     SECTION 2: CONCEPTS (12)
     ================================================================ */
  var CONCEPTS = [
    { id:'anatomy', name:'Geneva Mechanism Anatomy', symbol:'Pin + Slots', formula:'n slots, 1 pin', unit:'\u2014', cat:'basics',
      desc:'A Geneva mechanism consists of a driver disc (with one drive pin and a locking arc) and a driven Geneva wheel (with n radial slots and convex locking arcs between them). The driver rotates continuously. When the pin enters a slot, it rotates the Geneva wheel by one indexing step (360\u00b0/n). When the pin exits, the locking arc on the driver engages the concave arc on the Geneva wheel, holding it stationary during the dwell period. The mechanism has one degree of freedom.',
      example:{ problem:'A Geneva wheel has 6 slots. What is the indexing angle?', steps:['\u03b1 = 360\u00b0/n','\u03b1 = 360\u00b0/6','\u03b1 = 60\u00b0'], answer:60, unit:'\u00b0' }},
    { id:'intermittent', name:'Intermittent Motion', symbol:'Motion + Dwell', formula:'Motion \u2192 Dwell \u2192 Motion', unit:'\u2014', cat:'basics',
      desc:'Intermittent motion is periodic motion alternating between motion and rest (dwell). The Geneva mechanism produces precise intermittent rotary motion from continuous input rotation. During the motion phase, the pin engages a slot and the Geneva wheel rotates. During the dwell phase, the locking arc holds the wheel stationary. This is fundamentally different from continuous mechanisms like gears, and from reciprocating mechanisms like slider-cranks.',
      example:{ problem:'A 4-slot Geneva has input speed 60 RPM. How many indexing steps per minute?', steps:['Each full driver revolution = 1 index step','Steps/min = driver RPM = 60','The Geneva wheel completes 60 \u00d7 90\u00b0 = 5400\u00b0 = 15 full revolutions/min'], answer:60, unit:'steps/min' }},
    { id:'slotcount', name:'Slot Count Effects', symbol:'n = 3,4,6,8', formula:'Dwell% = (180+360/n)/360 \u00d7 100', unit:'%', cat:'basics',
      desc:'The number of slots n determines: (1) Indexing angle \u03b1 = 360\u00b0/n \u2014 how far the wheel advances per cycle. (2) Dwell percentage \u2014 fraction of cycle the wheel is stationary. (3) Motion angle of driver = 180\u00b0 \u2212 360\u00b0/n. More slots = smaller steps, longer dwell, smoother velocity profile. Fewer slots = larger steps, shorter dwell, higher peak velocity. Minimum slots = 3 (geometric constraint). Common: 4 (90\u00b0), 6 (60\u00b0), 8 (45\u00b0).',
      example:{ problem:'Find the dwell percentage for an 8-slot Geneva.', steps:['Dwell% = (180 + 360/n) / 360 \u00d7 100','Dwell% = (180 + 45) / 360 \u00d7 100','Dwell% = 225/360 \u00d7 100','Dwell% = 62.5%... wait, let me recalculate.','Motion angle = 180\u00b0 \u2212 360\u00b0/8 = 180\u00b0 \u2212 45\u00b0 = 135\u00b0','Dwell angle = 360\u00b0 \u2212 135\u00b0 = 225\u00b0','Dwell% = 225/360 \u00d7 100 = 62.5%... No.','Actually: motion half-angle = 90\u00b0 \u2212 180\u00b0/n = 90\u00b0 \u2212 22.5\u00b0 = 67.5\u00b0','Motion angle = 2 \u00d7 67.5\u00b0 = 135\u00b0','Dwell angle = 360\u00b0 \u2212 135\u00b0 = 225\u00b0','Dwell% = 225/360 = 62.5%'], answer:62.5, unit:'%' }},
    { id:'locking', name:'Locking Arc', symbol:'Holds wheel', formula:'Arc radius = centre distance \u2212 crank radius', unit:'mm', cat:'basics',
      desc:'The locking arc is a critical safety feature. It is a raised circular surface on the driver disc that meshes with concave arcs between the Geneva wheel\u2019s slots. When the pin is not in a slot, the locking arc prevents the wheel from rotating due to vibration, gravity, or load. Without it, the wheel could drift and lose its indexed position. The locking arc radius equals the distance from the driver centre to the Geneva wheel slot entrance. The driver has a cutout near the pin to allow the Geneva wheel to rotate during the motion phase.'},
    { id:'indexing', name:'Indexing Angle', symbol:'\u03b1 = 360\u00b0/n', formula:'\u03b1 = 2\u03c0/n', unit:'rad', cat:'kinematics',
      desc:'The indexing angle \u03b1 = 360\u00b0/n (or 2\u03c0/n radians) is the angular advance of the Geneva wheel per driver revolution. For n=4: \u03b1=90\u00b0. For n=6: \u03b1=60\u00b0. For n=8: \u03b1=45\u00b0. After each motion phase, the wheel has rotated exactly \u03b1 and is locked in the new position.',
      example:{ problem:'A Geneva wheel has 6 slots. Find the indexing angle in radians.', steps:['\u03b1 = 2\u03c0/n','\u03b1 = 2\u03c0/6','\u03b1 = \u03c0/3 \u2248 1.047 rad'], answer:1.047, unit:'rad' }},
    { id:'dwell', name:'Dwell Ratio', symbol:'Dwell/Total', formula:'Motion angle = \u03c0 \u2212 2\u03c0/n', unit:'rad', cat:'kinematics',
      desc:'The motion angle of the driver (angle over which the pin is engaged in a slot) is \u03c0 \u2212 2\u03c0/n radians. The dwell angle (angle over which the wheel is stationary) is \u03c0 + 2\u03c0/n radians. Dwell fraction = (\u03c0 + 2\u03c0/n) / (2\u03c0). For n=4: motion = 90\u00b0, dwell = 270\u00b0, dwell% = 75%. For n=6: motion = 120\u00b0, dwell = 240\u00b0... actually motion = 180\u00b0\u221260\u00b0 = 120\u00b0, dwell = 240\u00b0, dwell% = 66.7%.',
      example:{ problem:'Find the dwell fraction for a 4-slot Geneva.', steps:['Motion angle = \u03c0 \u2212 2\u03c0/4 = \u03c0 \u2212 \u03c0/2 = \u03c0/2 rad = 90\u00b0','Dwell angle = 2\u03c0 \u2212 \u03c0/2 = 3\u03c0/2 rad = 270\u00b0','Dwell fraction = 270/360 = 0.75 = 75%'], answer:75, unit:'%' }},
    { id:'omega-ratio', name:'Angular Velocity Ratio', symbol:'\u03c9\u2082/\u03c9\u2081', formula:'\u03c9\u2082/\u03c9\u2081 = (M\u00b7cos\u03c6 \u2212 1)/(1+M\u00b2\u22122M\u00b7sin\u03c6)', unit:'\u2014', cat:'kinematics',
      desc:'During the motion phase, the Geneva wheel angular velocity ratio is \u03c9\u2082/\u03c9\u2081 = (M\u00b7cos\u03c6 \u2212 1) / (1 + M\u00b2 \u2212 2M\u00b7sin\u03c6), where M = 1/sin(\u03c0/n) is the centre distance ratio and \u03c6 is the driver angle measured from the midpoint of the motion phase. The ratio starts at 0, peaks near the midpoint, and returns to 0. During dwell, \u03c9\u2082 = 0. The peak velocity ratio decreases with more slots (smoother motion).',
      example:{ problem:'For a 4-slot Geneva (M = \u221a2), find \u03c9\u2082/\u03c9\u2081 at \u03c6 = 0\u00b0 (midpoint).', steps:['M = 1/sin(\u03c0/4) = 1/(\u221a2/2) = \u221a2 \u2248 1.4142','At \u03c6 = 0: cos0 = 1, sin0 = 0','\u03c9\u2082/\u03c9\u2081 = (M\u00b71 \u2212 1)/(1 + M\u00b2 \u2212 0)','= (\u221a2 \u2212 1)/(1 + 2) = 0.4142/3','= 0.1381'], answer:0.138, unit:'' }},
    { id:'alpha-ratio', name:'Angular Acceleration', symbol:'\u03b1\u2082/\u03c9\u2081\u00b2', formula:'\u03b1\u2082/\u03c9\u2081\u00b2 = M\u00b7sin\u03c6\u00b7(M\u00b2\u22121)/(1+M\u00b2\u22122M\u00b7sin\u03c6)\u00b2', unit:'\u2014', cat:'kinematics',
      desc:'The angular acceleration of the Geneva wheel is \u03b1\u2082/\u03c9\u2081\u00b2 = M\u00b7sin\u03c6\u00b7(M\u00b2 \u2212 1) / (1 + M\u00b2 \u2212 2M\u00b7sin\u03c6)\u00b2. This produces sharp spikes at the entry and exit of the slot (when \u03c6 = \u00b1(90\u00b0 \u2212 180\u00b0/n)). These acceleration discontinuities cause impact forces and vibration, which is the primary speed limitation of Geneva mechanisms. The phenomenon is called "jerking" and increases with the square of the driver speed.'},
    { id:'projector', name:'Film Projector', symbol:'24 fps', formula:'4-slot, 24 cycles/s', unit:'\u2014', cat:'design',
      desc:'The classic application of the Geneva mechanism is the film projector. A 4-slot Geneva advances the film strip by one frame (4 perforations) 24 times per second. During dwell (75% of cycle), the shutter opens and light projects the stationary frame. During motion (25% of cycle), the shutter closes and the film advances. The mechanism must operate at 1440 RPM (24 \u00d7 60) with extreme precision. Modern digital projectors have largely replaced this, but the Geneva drive remains the iconic example.',
      example:{ problem:'A film projector runs at 24 fps with a 4-slot Geneva. Find the driver RPM.', steps:['Each frame = 1 driver revolution','24 frames/second \u00d7 60 seconds/minute','Driver RPM = 24 \u00d7 60 = 1440 RPM'], answer:1440, unit:'RPM' }},
    { id:'indexing-table', name:'Indexing Tables', symbol:'Manufacturing', formula:'n = 360\u00b0/\u03b1', unit:'\u2014', cat:'design',
      desc:'Rotary indexing tables use Geneva mechanisms to precisely position workpieces at equally spaced stations around a circular table. Each station performs a different operation (drilling, tapping, inspection, assembly). The dwell period allows machining operations to complete before the table advances. Common configurations: 4-station (90\u00b0 index), 6-station (60\u00b0), 8-station (45\u00b0), 12-station (30\u00b0). Positioning accuracy: \u00b130 to \u00b1120 arc-seconds.'},
    { id:'design-params', name:'Design Parameters', symbol:'M, C, R, a', formula:'C = a/sin(\u03c0/n)', unit:'mm', cat:'design',
      desc:'Key design parameters: (1) Crank radius a. (2) Centre distance C = a/sin(\u03c0/n) = a\u00b7M. (3) Geneva wheel radius R = C\u00b7cos(\u03c0/n) = a/tan(\u03c0/n). (4) Centre distance ratio M = C/a = 1/sin(\u03c0/n). (5) Pin diameter: 8\u201312% of Geneva wheel radius. (6) Slot width: pin diameter + 10\u201315% clearance. The geometry must ensure the pin enters and exits slots smoothly without binding.',
      example:{ problem:'Find the centre distance for a 4-slot Geneva with a = 40 mm.', steps:['M = 1/sin(\u03c0/4) = 1/sin(45\u00b0) = 1/0.7071 = 1.4142','C = a \u00d7 M = 40 \u00d7 1.4142','C = 56.57 mm'], answer:56.57, unit:'mm' }},
    { id:'advantages', name:'Advantages & Limitations', symbol:'Pros / Cons', formula:'\u2014', unit:'\u2014', cat:'design',
      desc:'Advantages: (1) Simple, reliable design with few parts. (2) Precise indexing without feedback control. (3) Self-locking during dwell. (4) Compact package. (5) High positioning accuracy (\u00b130\u2013120 arcsec). Limitations: (1) Acceleration spikes at slot entry/exit cause impact and vibration. (2) Speed limited by dynamic forces (F \u221d \u03c9\u00b2). (3) Fixed dwell ratio (cannot be adjusted without changing n). (4) Only equal-division indexing (no unequal steps). (5) Wear on pin and slot surfaces requires lubrication.'}
  ];

  /* ================================================================
     SECTION 3: PROBLEM GENERATORS (12)
     ================================================================ */
  var PROBLEM_GEN = [
    function(){ var n = [3,4,6,8][randInt(0,3)]; return { prompt:'Find the indexing angle for a '+n+'-slot Geneva mechanism.', steps:['\u03b1 = 360\u00b0/n','\u03b1 = 360\u00b0/'+n,'\u03b1 = '+(360/n)+'\u00b0'], answer:360/n, unit:'\u00b0', type:'number' }; },
    function(){ var n = [3,4,6,8][randInt(0,3)]; var ma = 180-360/n; var da = 360-ma; var dp = Math.round(da/360*1000)/10; return { prompt:'Find the dwell percentage for a '+n+'-slot Geneva.', steps:['Motion angle = 180\u00b0 \u2212 360\u00b0/'+n+' = '+(180-360/n)+'\u00b0','Dwell angle = 360\u00b0 \u2212 '+ma+'\u00b0 = '+da+'\u00b0','Dwell% = '+da+'/360 \u00d7 100 = '+dp+'%'], answer:dp, unit:'%', type:'number' }; },
    function(){ var n = [4,6,8][randInt(0,2)]; var a = randInt(25,60); var M = 1/Math.sin(PI/n); var C = Math.round(a*M*100)/100; return { prompt:'Find the centre distance: '+n+'-slot Geneva, crank radius a = '+a+' mm.', steps:['M = 1/sin(\u03c0/'+n+') = '+M.toFixed(4),'C = a \u00d7 M = '+a+' \u00d7 '+M.toFixed(4),'C = '+C+' mm'], answer:C, unit:'mm', type:'number' }; },
    function(){ var n = [3,4,6,8][randInt(0,3)]; var ma = Math.round((180-360/n)*100)/100; return { prompt:'Find the motion angle of the driver for a '+n+'-slot Geneva.', steps:['Motion angle = 180\u00b0 \u2212 360\u00b0/n','= 180\u00b0 \u2212 360\u00b0/'+n,'= '+ma+'\u00b0'], answer:ma, unit:'\u00b0', type:'number' }; },
    function(){ var n = [4,6,8][randInt(0,2)]; var a = randInt(30,50); var M = 1/Math.sin(PI/n); var R = Math.round(a/Math.tan(PI/n)*100)/100; return { prompt:'Find Geneva wheel radius R: '+n+'-slot, a = '+a+' mm.', steps:['R = a/tan(\u03c0/n)','R = '+a+'/tan(\u03c0/'+n+')','R = '+a+'/'+Math.tan(PI/n).toFixed(4),'R = '+R+' mm'], answer:R, unit:'mm', type:'number' }; },
    function(){ var rpm = randInt(5,40)*5; var w = Math.round(rpm*TAU/60*1000)/1000; return { prompt:'Convert N = '+rpm+' RPM to \u03c9 in rad/s.', steps:['\u03c9 = 2\u03c0N/60','\u03c9 = 2\u03c0\u00d7'+rpm+'/60','\u03c9 = '+w+' rad/s'], answer:w, unit:'rad/s', type:'number' }; },
    function(){ var n = [3,4,6,8][randInt(0,3)]; var rpm = randInt(10,60); var T = Math.round(60/rpm*1000)/1000; return { prompt:'A '+n+'-slot Geneva driver runs at '+rpm+' RPM. Find the time per index cycle.', steps:['T = 60/N = 60/'+rpm,'T = '+T+' s','Each cycle: 1 index step in '+T+' s'], answer:T, unit:'s', type:'number' }; },
    function(){ var n = [4,6,8][randInt(0,2)]; var a = randInt(30,60); var M = 1/Math.sin(PI/n); var C = a*M; var R = a/Math.tan(PI/n); return { prompt:'For a '+n+'-slot Geneva with a = '+a+' mm, find M (centre distance ratio).', steps:['M = 1/sin(\u03c0/n)','M = 1/sin(\u03c0/'+n+')','M = 1/'+Math.sin(PI/n).toFixed(4),'M = '+M.toFixed(4)], answer:Math.round(M*10000)/10000, unit:'', type:'number' }; },
    function(){ return { prompt:'What is the minimum number of slots in a Geneva mechanism?', steps:['The minimum is 3 slots','With fewer slots, the locking arc geometry is impossible','3 slots give 120\u00b0 indexing, 33.3% dwell'], answer:'3', unit:'slots', type:'text' }; },
    function(){ var fps = randInt(20,30); var rpm = fps*60; return { prompt:'A film projector runs at '+fps+' fps with a 4-slot Geneva. Find driver RPM.', steps:['Each frame = 1 driver revolution','RPM = fps \u00d7 60','RPM = '+fps+' \u00d7 60 = '+rpm], answer:rpm, unit:'RPM', type:'number' }; },
    function(){ var n = [4,6,8][randInt(0,2)]; var alpha = Math.round(2*PI/n*1000)/1000; return { prompt:'Find the indexing angle in radians for a '+n+'-slot Geneva.', steps:['\u03b1 = 2\u03c0/n','\u03b1 = 2\u03c0/'+n,'\u03b1 = '+alpha+' rad'], answer:alpha, unit:'rad', type:'number' }; },
    function(){ var n = [3,4,6,8][randInt(0,3)]; var ma = 180-360/n; var rpm = randInt(10,30)*2; var motionTime = Math.round(ma/360*(60/rpm)*1000)/1000; return { prompt:'A '+n+'-slot Geneva at '+rpm+' RPM. Find the motion time per cycle.', steps:['Motion angle = '+ma+'\u00b0','Period T = 60/'+rpm+' = '+(60/rpm).toFixed(3)+' s','Motion time = '+ma+'/360 \u00d7 T','= '+(ma/360).toFixed(4)+' \u00d7 '+(60/rpm).toFixed(3),'= '+motionTime+' s'], answer:motionTime, unit:'s', type:'number' }; }
  ];

  /* ================================================================
     SECTION 4: QUIZ POOL (15)
     ================================================================ */
  var QUIZ_POOL = [
    { q:'A Geneva mechanism converts continuous rotation into:', choices:['Reciprocating motion','Intermittent rotation','Oscillating motion','Uniform rotation'], correct:1 },
    { q:'The minimum number of slots in a Geneva wheel is:', choices:['2','3','4','6'], correct:1 },
    { q:'The indexing angle for a 4-slot Geneva is:', choices:['45\u00b0','60\u00b0','90\u00b0','120\u00b0'], correct:2 },
    { q:'What holds the Geneva wheel stationary during dwell?', choices:['Friction brake','Locking arc','Spring','Ratchet'], correct:1 },
    { q:'The dwell percentage of a 6-slot Geneva is approximately:', choices:['50%','62.5%','66.7%','75%'], correct:2 },
    { q:'As slot count increases, the dwell percentage:', choices:['Decreases','Stays same','Increases','Fluctuates'], correct:2 },
    { q:'The classic application of a 4-slot Geneva is:', choices:['IC engine','Film projector','Steam engine','Turbine'], correct:1 },
    { q:'The centre distance ratio M for a Geneva is:', choices:['M = sin(\u03c0/n)','M = 1/sin(\u03c0/n)','M = cos(\u03c0/n)','M = n/\u03c0'], correct:1 },
    { q:'The motion angle of the driver for a 4-slot Geneva is:', choices:['45\u00b0','90\u00b0','120\u00b0','180\u00b0'], correct:1 },
    { q:'Peak angular acceleration in a Geneva mechanism occurs at:', choices:['Midpoint of motion','Slot entry and exit','During dwell','At maximum velocity'], correct:1 },
    { q:'Geneva mechanisms are NOT suitable for:', choices:['Indexing tables','Film projectors','Very high speed operation','Watch mechanisms'], correct:2 },
    { q:'The Geneva wheel angular velocity during dwell is:', choices:['Maximum','Half of input','Zero','Equal to input'], correct:2 },
    { q:'What limits the maximum speed of a Geneva mechanism?', choices:['Gear ratio','Acceleration spikes at entry/exit','Friction only','Number of slots'], correct:1 },
    { q:'For a 4-slot Geneva, M = 1/sin(45\u00b0) equals:', choices:['1.0','1.414','2.0','0.707'], correct:1 },
    { q:'Indexing tables typically use Geneva mechanisms with:', choices:['2 slots','3 slots','4-12 slots','Only 4 slots'], correct:2 }
  ];

  /* ================================================================
     SECTION 5: KINEMATICS ENGINE
     ================================================================ */
  function genevaM(n) { return 1 / Math.sin(PI / n); }
  function genevaMotionHalf(n) { return PI / 2 - PI / n; }
  function genevaDwellPct(n) { var ma = PI - 2 * PI / n; return (TAU - ma) / TAU * 100; }

  /* Angular velocity ratio during motion phase.
     phi = driver angle measured from midpoint of motion phase
     Valid when |phi| <= motionHalf */
  function genevaOmegaRatio(n, phi) {
    var M = genevaM(n);
    var denom = 1 + M * M - 2 * M * Math.cos(phi);
    if (Math.abs(denom) < 1e-10) return 0;
    return (M * Math.cos(phi) - 1) / denom;
  }

  /* Angular acceleration ratio */
  function genevaAlphaRatio(n, phi) {
    var M = genevaM(n);
    var denom = 1 + M * M - 2 * M * Math.cos(phi);
    if (Math.abs(denom) < 1e-10) return 0;
    return -M * Math.sin(phi) * (M * M - 1) / (denom * denom);
  }

  /* Direct position equation — gives Geneva wheel displacement during one motion phase.
     Uses atan2 for the pin direction from O2, then unwraps relative to the entry angle
     to get the true continuous wheel rotation (avoids atan2 branch-cut errors).
     Returns displacement in range [0, -2PI/n] (wheel rotates opposite to driver). */
  function genevaDirectDisplacement(n, theta) {
    var M = genevaM(n);
    var mh = genevaMotionHalf(n);
    /* Reference angle: direction from O2 to pin at start of engagement (theta = -mh) */
    var alphaRef = Math.atan2(Math.sin(-mh), Math.cos(-mh) - M);
    /* Current direction from O2 to pin */
    var alpha = Math.atan2(Math.sin(theta), Math.cos(theta) - M);
    /* Unwrap to get continuous displacement */
    var delta = alpha - alphaRef;
    while (delta > PI) delta -= TAU;
    while (delta < -PI) delta += TAU;
    return delta;
  }

  /* Is the pin engaged in a slot at given driver angle?
     driverAngle in [0, TAU), measured from 0 = pin at rightmost position
     Motion phase centred at driverAngle = 0 (pin pointing RIGHT toward Geneva wheel) */
  function isMotionPhase(driverAngle, n) {
    var mh = genevaMotionHalf(n);
    var diff = driverAngle;
    while (diff > PI) diff -= TAU;
    while (diff < -PI) diff += TAU;
    return Math.abs(diff) <= mh + 0.001;
  }

  function driverToPhi(driverAngle, n) {
    var diff = driverAngle;
    while (diff > PI) diff -= TAU;
    while (diff < -PI) diff += TAU;
    return diff;
  }

  /* ================================================================
     SECTION 6: CANVAS SETUP
     ================================================================ */
  var cvs = $('sim-canvas'), ctx = cvs.getContext('2d');
  var W = 900, H = 520;
  var DPR = Math.max(window.devicePixelRatio || 1, 1);
  function initCanvas() {
    cvs.width = W * DPR; cvs.height = H * DPR;
    cvs.style.width = W + 'px'; cvs.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  initCanvas();
  var GRAPH_L = 478, GRAPH_R = 868, GRAPH_T = 55, GRAPH_B = 475;

  /* ================================================================
     SECTION 7: STATE
     ================================================================ */
  var state = {
    mode: 'simulate', n: 4, a: 50, rpm: 20,
    driverAngle: PI, wheelAngle: 0, running: true,
    completedSteps: 0, lastMotionPhase: false,
    graphType: 'velocity', activePreset: '4-slot',
    exploreCat: 'basics', exploreItem: null,
    pracScore: 0, pracTotal: 0, pracCurrent: null, pracAnswered: false,
    quizQuestions: [], quizIdx: 0, quizScore: 0, quizAnswered: false, quizResults: []
  };

  var PRESETS = {
    '4-slot':    { n: 4, a: 50, rpm: 20 },
    '6-slot':    { n: 6, a: 45, rpm: 15 },
    '3-slot':    { n: 3, a: 55, rpm: 25 },
    '8-slot':    { n: 8, a: 40, rpm: 12 },
    'projector': { n: 4, a: 35, rpm: 40 }
  };

  /* ================================================================
     SECTION 8: DRAWING HELPERS
     ================================================================ */
  function roundRect(c,x,y,w,h,r){ c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.quadraticCurveTo(x+w,y,x+w,y+r);c.lineTo(x+w,y+h-r);c.quadraticCurveTo(x+w,y+h,x+w-r,y+h);c.lineTo(x+r,y+h);c.quadraticCurveTo(x,y+h,x,y+h-r);c.lineTo(x,y+r);c.quadraticCurveTo(x,y,x+r,y);c.closePath(); }
  function drawGrid(){ ctx.save();ctx.strokeStyle='rgba(100,120,150,0.08)';ctx.lineWidth=1;for(var x=0;x<=440;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}for(var y=0;y<=H;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(440,y);ctx.stroke();}ctx.restore(); }
  function drawDivider(){ ctx.save();ctx.strokeStyle='rgba(100,120,150,0.25)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(450,10);ctx.lineTo(450,H-10);ctx.stroke();ctx.setLineDash([]);ctx.restore(); }

  /* Curved rotation arrow with arrowhead (Image 4: omega_in / omega_out) */
  function drawRotationArrow(cx, cy, radius, startAng, sweepAng, color, label) {
    ctx.save();
    var endAng = startAng + sweepAng;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAng, endAng, sweepAng < 0);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
    /* arrowhead */
    var tipX = cx + radius * Math.cos(endAng), tipY = cy + radius * Math.sin(endAng);
    var tangent = sweepAng > 0 ? endAng + PI / 2 : endAng - PI / 2;
    var aL = 8;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + aL * Math.cos(tangent + 0.45), tipY + aL * Math.sin(tangent + 0.45));
    ctx.lineTo(tipX + aL * Math.cos(tangent - 0.45), tipY + aL * Math.sin(tangent - 0.45));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    /* label */
    if (label) {
      var midAng = startAng + sweepAng * 0.5;
      var lR = radius + 10;
      ctx.font = 'italic 8px monospace'; ctx.fillStyle = color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, cx + lR * Math.cos(midAng), cy + lR * Math.sin(midAng));
    }
    ctx.restore();
  }

  /* 5-phase system: DWELL, ENGAGE, DRIVE, EXIT, LOCK (from PDF analysis) */
  var PHASE_COLORS = {
    DWELL:  { bg: 'rgba(100,120,150,0.15)', border: '#6b7a99', text: '#8899aa' },
    ENGAGE: { bg: 'rgba(255,180,50,0.2)',   border: '#ffb432', text: '#ffb432' },
    DRIVE:  { bg: 'rgba(61,220,132,0.25)',  border: '#3ddc84', text: '#3ddc84' },
    EXIT:   { bg: 'rgba(255,140,50,0.2)',   border: '#ff8c32', text: '#ff8c32' },
    LOCK:   { bg: 'rgba(100,160,255,0.15)', border: '#64a0ff', text: '#64a0ff' }
  };
  function getPhase(da, n) {
    var mh = genevaMotionHalf(n);
    var tm = da; while (tm > PI) tm -= TAU; while (tm < -PI) tm += TAU;
    var abs = Math.abs(tm);
    if (abs > mh + 0.001) return 'DWELL';
    /* Within motion: split into ENGAGE / DRIVE / EXIT zones */
    var progress = (tm + mh) / (2 * mh); /* 0 at entry, 1 at exit */
    if (progress < 0.15) return 'ENGAGE';
    if (progress > 0.85) return 'EXIT';
    return 'DRIVE';
  }
  var PHASE_DESC = {
    DWELL:  'Locking arc engaged — output locked',
    ENGAGE: 'Pin entering slot — engagement begins',
    DRIVE:  'Pin driving slot — wheel advancing',
    EXIT:   'Pin exiting slot — decelerating',
    LOCK:   'Step complete — re-locking'
  };

  /* Phase badge with 5-phase system */
  function drawPhaseBadge(x, y, phase) {
    ctx.save();
    var w = 88, h = 20, r = 5;
    var c = PHASE_COLORS[phase] || PHASE_COLORS.DWELL;
    roundRect(ctx, x, y, w, h, r); ctx.fillStyle = c.bg; ctx.fill();
    ctx.strokeStyle = c.border; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = c.text;
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('\u25cf ' + phase, x + w / 2, y + h / 2);
    ctx.restore();
  }

  /* Cross-hatch inside a circle (engineering hub/pivot) */
  function drawCrossHatch(cx, cy, radius) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, TAU); ctx.clip();
    ctx.strokeStyle = 'rgba(180,190,210,0.35)'; ctx.lineWidth = 0.7;
    for (var d = -radius * 2; d < radius * 2; d += 4) {
      ctx.beginPath(); ctx.moveTo(cx + d, cy - radius * 2); ctx.lineTo(cx + d + radius * 2, cy + radius * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + d, cy + radius * 2); ctx.lineTo(cx + d + radius * 2, cy - radius * 2); ctx.stroke();
    }
    ctx.restore();
  }

  /* ================================================================
     SECTION 9: MECHANISM DRAWING — Full engineering-accurate rendering
     ================================================================ */
  function drawMechanism() {
    var n = state.n, a = state.a, da = state.driverAngle;
    var M = genevaM(n);
    var beta = PI / n;                   /* half-angle between adjacent slots */
    var C = a * M;                       /* centre distance (constraint 1) */
    var Rg = a / Math.tan(beta);         /* Geneva slot-tip radius (constraint 2) */
    var Rd = a;                          /* driver radius = crank radius (constraint 4) */
    var pinR = 7;                        /* pin visual radius (px, post-scale) */
    var sw = pinR + 3;                   /* slot half-width (px, constraint 6) */

    /* Auto-scale to fit left canvas panel (0-440 px) */
    var totalW = C + Rd + Rg + 20;
    var totalH = 2 * Math.max(Rd, Rg) + 30;
    var SC = Math.min(380 / totalW, (H - 80) / totalH, 2.5);

    /* Scale-aware pin sizing (Phase 7b) */
    pinR = Math.max(4, 7 * Math.min(SC, 1.5));
    sw = pinR + 3;

    var cSC = C * SC, rgSC = Rg * SC, rdSC = Rd * SC, aSC = a * SC;

    /* Layout: O2 (Geneva) right, O1 (driver) left */
    var o2x = 220 + cSC * 0.35, o2y = H / 2;
    var o1x = o2x - cSC, o1y = o2y;
    /* Clamp to visible area */
    if (o1x < rdSC + 10) { var sh1 = rdSC + 10 - o1x; o1x += sh1; o2x += sh1; }
    if (o2x + rgSC + 10 > 440) { var sh2 = o2x + rgSC + 10 - 440; o1x -= sh2; o2x -= sh2; }

    /* Slot alignment offset: rotate wheel drawing so slot 0 faces the
       pin entry direction.  alphaRef = direction from O₂ to pin at entry. */
    var mhDraw = genevaMotionHalf(n);
    var Mdraw  = genevaM(n);
    var slotOffset = Math.atan2(Math.sin(-mhDraw), Math.cos(-mhDraw) - Mdraw);
    var wA = state.wheelAngle + slotOffset;
    var inMotion = isMotionPhase(da, n);
    var phi = driverToPhi(da, n);

    /* Hub radius */
    var hubR = Math.max(sw * 2.5, 12);

    /* Determine active slot index (for highlight during motion) */
    var activeSlotIdx = -1;
    if (inMotion) {
      /* Pin world position */
      var pinWx = o1x + aSC * Math.cos(da), pinWy = o1y + aSC * Math.sin(da);
      /* Pin in wheel-local coords */
      var pLocalX = (pinWx - o2x) * Math.cos(-wA) - (pinWy - o2y) * Math.sin(-wA);
      var pLocalY = (pinWx - o2x) * Math.sin(-wA) + (pinWy - o2y) * Math.cos(-wA);
      var pLocalAng = Math.atan2(pLocalY, pLocalX);
      if (pLocalAng < 0) pLocalAng += TAU;
      activeSlotIdx = Math.round(pLocalAng / (TAU / n)) % n;
    }

    /* Determine which concave arc is adjacent to driver's locking arc (for dwell highlight) */
    var lockArcIdx = -1;
    if (!inMotion) {
      var driverDirInWheel = Math.atan2(o1y - o2y, o1x - o2x) - wA;
      while (driverDirInWheel < 0) driverDirInWheel += TAU;
      while (driverDirInWheel >= TAU) driverDirInWheel -= TAU;
      /* find sector whose midpoint is closest */
      var bestDist = Infinity;
      for (var li = 0; li < n; li++) {
        var secMidAng = li * TAU / n + beta;
        var dd = Math.abs(secMidAng - driverDirInWheel);
        if (dd > PI) dd = TAU - dd;
        if (dd < bestDist) { bestDist = dd; lockArcIdx = li; }
      }
    }

    /* ══════════ DROP SHADOWS ══════════ */
    var Rout_shadow = rgSC * 1.12;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath(); ctx.arc(o1x + 3, o1y + 3, rdSC + 3, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath(); ctx.arc(o2x + 3, o2y + 3, Rout_shadow + 5, 0, TAU); ctx.fill();
    ctx.restore();

    /* ══════════ DRIVER DISC (drawn first — behind Geneva wheel) ══════════ */
    /* Use offscreen canvas to build driver as one solid piece with cutout punched out */
    var driverSize = Math.ceil((rdSC + 10) * 2);
    var dCvs = document.createElement('canvas');
    dCvs.width = driverSize; dCvs.height = driverSize;
    var dCtx = dCvs.getContext('2d');
    var dOff = driverSize / 2;
    dCtx.translate(dOff, dOff);
    dCtx.rotate(da);

    var crescentTheta = PI / 2 - beta;
    var cCx = cSC;
    var p1x = rdSC * Math.cos(-crescentTheta) - cCx;
    var p1y = rdSC * Math.sin(-crescentTheta);
    var crescAng1 = Math.atan2(p1y, p1x);
    var p2x = rdSC * Math.cos(crescentTheta) - cCx;
    var p2y = rdSC * Math.sin(crescentTheta);
    var crescAng2 = Math.atan2(p2y, p2x);

    /* Step 1: Draw full solid disc */
    dCtx.beginPath();
    dCtx.arc(0, 0, rdSC, 0, TAU);
    dCtx.fillStyle = '#5588bb';
    dCtx.fill();

    /* Step 1b: Locking arc band — distinct color for the embossed portion
       that slides into the Geneva wheel's concave notch during dwell.
       Angular range: from crescentTheta to TAU-crescentTheta (opposite the pin). */
    var lockBandInner = rdSC * 0.65;
    dCtx.beginPath();
    dCtx.arc(0, 0, rdSC, crescentTheta, TAU - crescentTheta, false);
    dCtx.arc(0, 0, lockBandInner, TAU - crescentTheta, crescentTheta, true);
    dCtx.closePath();
    dCtx.fillStyle = inMotion ? '#7aaece' : '#90c4de';
    dCtx.fill();

    /* Step 2: Punch out the crescent cutout */
    dCtx.globalCompositeOperation = 'destination-out';
    dCtx.beginPath();
    dCtx.arc(0, 0, rdSC, -crescentTheta, crescentTheta, false);
    dCtx.arc(cCx, 0, rgSC, crescAng2, crescAng1, true);
    dCtx.closePath();
    dCtx.fillStyle = '#000';
    dCtx.fill();
    dCtx.globalCompositeOperation = 'source-over';

    /* Step 3: Outline the disc body */
    dCtx.beginPath();
    dCtx.arc(0, 0, rdSC, crescentTheta, TAU - crescentTheta, false);
    dCtx.strokeStyle = '#3366aa';
    dCtx.lineWidth = 2;
    dCtx.stroke();
    dCtx.beginPath();
    dCtx.arc(cCx, 0, rgSC, crescAng1, crescAng2, false);
    dCtx.strokeStyle = '#3366aa';
    dCtx.lineWidth = 1.5;
    dCtx.stroke();

    /* Locking arc highlight — brighter during dwell */
    dCtx.beginPath();
    dCtx.arc(0, 0, rdSC, crescentTheta + 0.02, TAU - crescentTheta - 0.02, false);
    dCtx.strokeStyle = inMotion ? 'rgba(160,160,200,0.5)' : 'rgba(200,200,240,0.7)';
    dCtx.lineWidth = inMotion ? 2.5 : 4;
    dCtx.stroke();

    /* Step 4: Crank arm (on driver disc, behind Geneva wheel) */
    dCtx.beginPath(); dCtx.moveTo(0, 0); dCtx.lineTo(aSC, 0);
    dCtx.strokeStyle = '#3366aa'; dCtx.lineWidth = 4; dCtx.lineCap = 'round'; dCtx.stroke();

    /* Step 5: Hub/spindle */
    var dHubR = rdSC * 0.15;
    dCtx.beginPath(); dCtx.arc(0, 0, dHubR, 0, TAU);
    dCtx.fillStyle = '#cc44cc'; dCtx.fill();
    dCtx.strokeStyle = '#881188'; dCtx.lineWidth = 2; dCtx.stroke();
    dCtx.beginPath(); dCtx.arc(0, 0, dHubR * 0.45, 0, TAU);
    dCtx.fillStyle = '#441144'; dCtx.fill();

    /* Stamp driver disc onto main canvas (BEHIND Geneva wheel) */
    ctx.drawImage(dCvs, o1x - dOff, o1y - dOff);

    /* ══════════ GENEVA WHEEL (drawn on top — covers pin except in slot channels) ══════════ */
    /* Full disc with outer rim, slots cut as channels, concave arcs as internal grooves */
    var halfSlotAng = Math.atan2(sw, rgSC);
    var halfSlotAngHub = Math.atan2(sw, hubR);
    var Rout = rgSC * 1.04; /* thin rim lip beyond slot tips */
    var halfSlotAngRim = Math.atan2(sw, Rout);

    var wheelSize = Math.ceil((Rout + 10) * 2);
    var wCvs = document.createElement('canvas');
    wCvs.width = wheelSize; wCvs.height = wheelSize;
    var wCtx = wCvs.getContext('2d');
    var wOff = wheelSize / 2;
    wCtx.translate(wOff, wOff);
    wCtx.rotate(wA);

    /* ─── Step 1: Full solid disc at outer rim radius ─── */
    wCtx.beginPath();
    wCtx.arc(0, 0, Rout, 0, TAU);
    wCtx.fillStyle = '#c87060';
    wCtx.fill();

    /* ─── Step 2: Cut slots as transparent channels through the disc ─── */
    wCtx.globalCompositeOperation = 'destination-out';
    for (var si = 0; si < n; si++) {
      var sAng = si * TAU / n;
      var outerL = Rout + 4;
      wCtx.beginPath();
      wCtx.moveTo((hubR - 1) * Math.cos(sAng - halfSlotAngHub), (hubR - 1) * Math.sin(sAng - halfSlotAngHub));
      wCtx.lineTo(outerL * Math.cos(sAng - halfSlotAngRim), outerL * Math.sin(sAng - halfSlotAngRim));
      wCtx.lineTo(outerL * Math.cos(sAng + halfSlotAngRim), outerL * Math.sin(sAng + halfSlotAngRim));
      wCtx.lineTo((hubR - 1) * Math.cos(sAng + halfSlotAngHub), (hubR - 1) * Math.sin(sAng + halfSlotAngHub));
      wCtx.arc(0, 0, hubR - 1, sAng + halfSlotAngHub, sAng - halfSlotAngHub, true);
      wCtx.closePath();
      wCtx.fillStyle = '#000';
      wCtx.fill();
    }
    wCtx.globalCompositeOperation = 'source-over';

    /* ─── Step 2b: Shade concave locking-arc regions between slots ─── */
    /* Fill the concave notch areas with a darker shade to show the recessed
       locking surface — keeps the disc shape while indicating the contact zone. */
    for (var ni = 0; ni < n; ni++) {
      var secMidN = ni * TAU / n + beta;
      var arcCxN = cSC * Math.cos(secMidN);
      var arcCyN = cSC * Math.sin(secMidN);
      var kN = (Rout * Rout + cSC * cSC - rdSC * rdSC) / (2 * cSC);
      var cosAngN = kN / Rout;
      if (Math.abs(cosAngN) > 1) continue;
      var dAngN = Math.acos(cosAngN);
      var intAng1 = secMidN - dAngN;
      var intAng2 = secMidN + dAngN;
      var ix1x = Rout * Math.cos(intAng1), ix1y = Rout * Math.sin(intAng1);
      var ix2x = Rout * Math.cos(intAng2), ix2y = Rout * Math.sin(intAng2);
      var ca1 = Math.atan2(ix1y - arcCyN, ix1x - arcCxN);
      var ca2 = Math.atan2(ix2y - arcCyN, ix2x - arcCxN);
      var csweepLR = ca2 - ca1;
      while (csweepLR > PI) csweepLR -= TAU;
      while (csweepLR <= -PI) csweepLR += TAU;
      /* Shade: darker fill for recessed area, highlight during dwell contact */
      var isLocked = (lockArcIdx === ni);
      wCtx.beginPath();
      wCtx.arc(0, 0, Rout, intAng1, intAng2, false);
      wCtx.arc(arcCxN, arcCyN, rdSC, ca2, ca1, csweepLR >= 0);
      wCtx.closePath();
      wCtx.fillStyle = isLocked ? 'rgba(80,120,180,0.35)' : 'rgba(40,20,15,0.25)';
      wCtx.fill();
    }

    /* ─── Step 3: Concave arc edge highlights (locking surface indicators) ─── */
    for (var oi = 0; oi < n; oi++) {
      var slotAng2 = oi * TAU / n;
      var nextSlotAng2 = (oi + 1) * TAU / n;
      var secMid2 = slotAng2 + beta;

      var rightOuter2 = slotAng2 + halfSlotAng;
      var nextLeftOuter2 = nextSlotAng2 - halfSlotAng;

      var arcCx2 = cSC * Math.cos(secMid2);
      var arcCy2 = cSC * Math.sin(secMid2);
      var rX2 = rgSC * Math.cos(rightOuter2) - arcCx2;
      var rY2 = rgSC * Math.sin(rightOuter2) - arcCy2;
      var lX2 = rgSC * Math.cos(nextLeftOuter2) - arcCx2;
      var lY2 = rgSC * Math.sin(nextLeftOuter2) - arcCy2;
      var as2 = Math.atan2(rY2, rX2);
      var ae2 = Math.atan2(lY2, lX2);
      var sw2 = ae2 - as2;
      while (sw2 > PI) sw2 -= TAU;
      while (sw2 <= -PI) sw2 += TAU;

      /* Concave arc groove — darker shade to show locking surface */
      wCtx.beginPath();
      wCtx.arc(arcCx2, arcCy2, rdSC, as2, ae2, sw2 <= 0);
      wCtx.strokeStyle = lockArcIdx === oi ? '#e8a898' : '#985850';
      wCtx.lineWidth = lockArcIdx === oi ? 3 : 2;
      wCtx.stroke();
    }

    /* ─── Step 4: Outer rim outline + slot wall edges ─── */
    /* Rim arcs between slots */
    for (var ri = 0; ri < n; ri++) {
      var rSlot = ri * TAU / n;
      var rNext = (ri + 1) * TAU / n;
      wCtx.beginPath();
      wCtx.arc(0, 0, Rout, rSlot + halfSlotAngRim + 0.01, rNext - halfSlotAngRim - 0.01, false);
      wCtx.strokeStyle = '#a05848';
      wCtx.lineWidth = 2;
      wCtx.stroke();
    }
    /* Slot wall edges */
    for (var wi = 0; wi < n; wi++) {
      var wSlot = wi * TAU / n;
      wCtx.strokeStyle = '#985850';
      wCtx.lineWidth = 1.5;
      wCtx.beginPath();
      wCtx.moveTo(hubR * Math.cos(wSlot + halfSlotAngHub), hubR * Math.sin(wSlot + halfSlotAngHub));
      wCtx.lineTo(Rout * Math.cos(wSlot + halfSlotAngRim), Rout * Math.sin(wSlot + halfSlotAngRim));
      wCtx.stroke();
      wCtx.beginPath();
      wCtx.moveTo(hubR * Math.cos(wSlot - halfSlotAngHub), hubR * Math.sin(wSlot - halfSlotAngHub));
      wCtx.lineTo(Rout * Math.cos(wSlot - halfSlotAngRim), Rout * Math.sin(wSlot - halfSlotAngRim));
      wCtx.stroke();
    }

    /* ─── Step 5: Hub ─── */
    var hubInner = hubR * 0.45;
    wCtx.beginPath(); wCtx.arc(0, 0, hubInner, 0, TAU);
    wCtx.fillStyle = '#e8c834'; wCtx.fill();
    wCtx.strokeStyle = '#a05848'; wCtx.lineWidth = 2; wCtx.stroke();

    /* ─── Step 6: Active slot highlight ─── */
    if (activeSlotIdx >= 0) {
      var asAng = activeSlotIdx * TAU / n;
      var outerH = Rout + 4;
      wCtx.beginPath();
      wCtx.moveTo((hubR - 1) * Math.cos(asAng - halfSlotAngHub), (hubR - 1) * Math.sin(asAng - halfSlotAngHub));
      wCtx.lineTo(outerH * Math.cos(asAng - halfSlotAngRim), outerH * Math.sin(asAng - halfSlotAngRim));
      wCtx.lineTo(outerH * Math.cos(asAng + halfSlotAngRim), outerH * Math.sin(asAng + halfSlotAngRim));
      wCtx.lineTo((hubR - 1) * Math.cos(asAng + halfSlotAngHub), (hubR - 1) * Math.sin(asAng + halfSlotAngHub));
      wCtx.arc(0, 0, hubR - 1, asAng + halfSlotAngHub, asAng - halfSlotAngHub, true);
      wCtx.closePath();
      wCtx.fillStyle = 'rgba(255,138,101,0.2)';
      wCtx.fill();
      wCtx.strokeStyle = '#ff8a65'; wCtx.lineWidth = 1.5; wCtx.stroke();
    }

    /* Stamp Geneva wheel onto main canvas (ON TOP of driver) */
    ctx.drawImage(wCvs, o2x - wOff, o2y - wOff);

    /* ══════════ PIN (drawn on top — pin sticks up through wheel plane) ══════════ */
    ctx.save();
    var pinX = o1x + aSC * Math.cos(da), pinY = o1y + aSC * Math.sin(da);
    ctx.beginPath(); ctx.arc(pinX, pinY, pinR, 0, TAU);
    ctx.fillStyle = '#4466ee'; ctx.fill();
    ctx.strokeStyle = '#223399'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    /* ══════════ CONTACT GLOW ══════════ */
    if (inMotion) {
      var glowX = o1x + aSC * Math.cos(da), glowY = o1y + aSC * Math.sin(da);
      ctx.save();
      ctx.beginPath(); ctx.arc(glowX, glowY, pinR + 6, 0, TAU);
      ctx.fillStyle = 'rgba(68,102,238,0.15)'; ctx.fill();
      ctx.restore();
    }

    /* ══════════ PIVOTS — blue axle cylinders (per PDF) ══════════ */
    ctx.save();
    var pivR = 6;
    /* O1 — driver axle */
    ctx.beginPath(); ctx.arc(o1x, o1y, pivR, 0, TAU);
    ctx.fillStyle = '#4488cc'; ctx.fill();
    ctx.strokeStyle = '#2266aa'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(o1x, o1y, pivR * 0.4, 0, TAU);
    ctx.fillStyle = '#224466'; ctx.fill();
    /* O2 — Geneva axle */
    ctx.beginPath(); ctx.arc(o2x, o2y, pivR, 0, TAU);
    ctx.fillStyle = '#4488cc'; ctx.fill();
    ctx.strokeStyle = '#2266aa'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.arc(o2x, o2y, pivR * 0.4, 0, TAU);
    ctx.fillStyle = '#224466'; ctx.fill();
    ctx.restore();

    /* ══════════ GROUND HATCHING ══════════ */
    ctx.save(); ctx.strokeStyle = '#8899aa'; ctx.lineWidth = 1;
    var gY = o2y + Math.max(rdSC, rgSC) + 18;
    ctx.beginPath(); ctx.moveTo(o1x - 20, gY); ctx.lineTo(o1x + 20, gY); ctx.stroke();
    for (var h1 = -20; h1 < 20; h1 += 5) { ctx.beginPath(); ctx.moveTo(o1x + h1 + 5, gY); ctx.lineTo(o1x + h1, gY + 7); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(o2x - 20, gY); ctx.lineTo(o2x + 20, gY); ctx.stroke();
    for (var h2 = -20; h2 < 20; h2 += 5) { ctx.beginPath(); ctx.moveTo(o2x + h2 + 5, gY); ctx.lineTo(o2x + h2, gY + 7); ctx.stroke(); }
    ctx.restore();

    /* ══════════ ROTATION DIRECTION ARROWS (Image 4: omega_in / omega_out) ══════════ */
    ctx.save();
    /* omega_in: always visible on driver (CW rotation) */
    drawRotationArrow(o1x, o1y, rdSC + 12, da + 0.4, 0.8, 'rgba(102,153,204,0.5)', '\u03c9\u1d62\u2099');
    /* omega_out: on Geneva wheel, visible during motion only */
    if (inMotion) {
      drawRotationArrow(o2x, o2y, Rout + 12, wA - 0.4, -0.8, 'rgba(212,131,111,0.5)', '\u03c9\u2092\u1d64\u209c');
    }
    ctx.restore();

    /* ══════════ DIMENSION LINE: C = centre distance (below ground) ══════════ */
    ctx.save(); ctx.strokeStyle = 'rgba(107,122,153,0.6)'; ctx.lineWidth = 1;
    var dimY = gY + 14;
    /* Extension lines */
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(o1x, gY + 2); ctx.lineTo(o1x, dimY + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(o2x, gY + 2); ctx.lineTo(o2x, dimY + 3); ctx.stroke();
    ctx.setLineDash([]);
    /* Arrow line */
    ctx.beginPath(); ctx.moveTo(o1x + 5, dimY); ctx.lineTo(o2x - 5, dimY); ctx.stroke();
    /* Arrowheads */
    ctx.fillStyle = 'rgba(107,122,153,0.6)';
    ctx.beginPath(); ctx.moveTo(o1x, dimY); ctx.lineTo(o1x + 5, dimY - 2); ctx.lineTo(o1x + 5, dimY + 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(o2x, dimY); ctx.lineTo(o2x - 5, dimY - 2); ctx.lineTo(o2x - 5, dimY + 2); ctx.fill();
    ctx.font = '8px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(200,210,230,0.7)';
    ctx.fillText('C = ' + toDisplay(C) + ' ' + uLabel(), (o1x + o2x) / 2, dimY - 3);
    ctx.restore();

    /* ══════════ LABELS (Images 2, 4: component labels) ══════════ */
    ctx.save();
    ctx.font = '9px monospace'; ctx.textAlign = 'center';
    /* O1, O2 pivot markers (small, unobtrusive) */
    ctx.fillStyle = 'rgba(200,210,230,0.6)';
    ctx.fillText('O\u2081', o1x, o1y + rdSC + 16);
    ctx.fillText('O\u2082', o2x, o2y + Rout + 16);
    /* "pin" label (Image 2) */
    var pwx = o1x + aSC * Math.cos(da), pwy = o1y + aSC * Math.sin(da);
    ctx.fillStyle = 'rgba(102,136,238,0.7)'; ctx.font = '8px monospace';
    ctx.fillText('pin', pwx + 10, pwy - 8);
    /* "slot" label during motion (Image 2) */
    if (inMotion && activeSlotIdx >= 0) {
      var sltAng = activeSlotIdx * TAU / n + wA;
      var sltLx = o2x + (Rout + 10) * Math.cos(sltAng);
      var sltLy = o2y + (Rout + 10) * Math.sin(sltAng);
      ctx.fillStyle = 'rgba(212,131,111,0.6)'; ctx.font = '8px monospace';
      ctx.fillText('slot', sltLx, sltLy);
    }
    ctx.restore();

    /* ══════════ TITLE (top-left, compact) ══════════ */
    var phase = getPhase(da, n);
    ctx.save();
    ctx.fillStyle = 'rgba(200,210,230,0.7)'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
    ctx.fillText(n + '-Slot Geneva', 8, 14);
    ctx.restore();

    /* ══════════ PHASE BADGE (top-left, below title) ══════════ */
    drawPhaseBadge(8, 20, phase);

    /* ══════════ INFO PANEL (bottom-left) ══════════ */
    var omR = inMotion ? genevaOmegaRatio(n, phi) : 0;
    var alR = inMotion ? genevaAlphaRatio(n, phi) : 0;
    var pW = 170, pH = 86, pX = 4, pY = H - pH - 4;
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.85)'; ctx.strokeStyle = 'rgba(100,120,150,0.3)'; ctx.lineWidth = 1;
    roundRect(ctx, pX, pY, pW, pH, 5); ctx.fill(); roundRect(ctx, pX, pY, pW, pH, 5); ctx.stroke();
    ctx.fillStyle = 'rgba(200,210,230,0.8)'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
    var lh = 13, sY = pY + 12;
    ctx.fillText('\u03c6=' + (da * DEG).toFixed(1) + '\u00b0  \u03b8\u2082=' + (state.wheelAngle * DEG).toFixed(1) + '\u00b0', pX + 6, sY);
    ctx.fillText('\u03c9\u2082/\u03c9\u2081=' + omR.toFixed(3) + '  \u03b1\u2082=' + alR.toFixed(3), pX + 6, sY + lh);
    ctx.fillText('n=' + n + '  Dwell=' + genevaDwellPct(n).toFixed(1) + '%', pX + 6, sY + lh * 2);
    /* Slot engagement status */
    var slotTxt = inMotion ? 'Slot ' + (activeSlotIdx + 1) + '/' + n : 'Locked';
    ctx.fillStyle = inMotion ? '#3ddc84' : '#6b7a99';
    ctx.fillText(slotTxt, pX + 6, sY + lh * 3);
    if (inMotion) {
      var mhD = genevaMotionHalf(n);
      var tmD = da; while (tmD > PI) tmD -= TAU; while (tmD < -PI) tmD += TAU;
      var prog = (tmD + mhD) / (2 * mhD);
      var pinDepthPct = Math.round((prog <= 0.5 ? prog * 2 : (1 - prog) * 2) * 100);
      ctx.fillStyle = '#ffb432';
      ctx.fillText('Depth:' + pinDepthPct + '%', pX + 70, sY + lh * 3);
    }
    /* Phase description */
    ctx.fillStyle = (PHASE_COLORS[phase] || PHASE_COLORS.DWELL).text;
    ctx.font = 'italic 8px monospace';
    ctx.fillText(PHASE_DESC[phase] || '', pX + 6, sY + lh * 4 + 2);
    ctx.restore();
  }

  /* ================================================================
     SECTION 10: GRAPH
     ================================================================ */
  function drawGraph() {
    var gL = GRAPH_L, gR = GRAPH_R, gT = GRAPH_T, gB = GRAPH_B;
    var gW = gR - gL, gH = gB - gT;
    var n = state.n;

    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.6)';
    ctx.fillRect(gL - 10, gT - 20, gW + 30, gH + 40);

    /* compute data — offset so motion phase appears in the centre */
    var data = [];
    var yMin = Infinity, yMax = -Infinity;
    var cumAngle = 0;
    var mh = genevaMotionHalf(n);
    var mhDeg = mh * DEG;
    var graphOffset = 360 - mhDeg; /* graph x=0 maps to start of motion */

    for (var i = 0; i <= 360; i += 1) {
      var da = ((i + graphOffset) % 360) * RAD;
      var inM = isMotionPhase(da, n);
      var phi = driverToPhi(da, n);
      var val = 0;

      if (state.graphType === 'velocity') {
        val = inM ? genevaOmegaRatio(n, phi) : 0;
      } else if (state.graphType === 'acceleration') {
        val = inM ? genevaAlphaRatio(n, phi) : 0;
      } else if (state.graphType === 'displacement') {
        /* cumulative wheel angle: integrate velocity ratio */
        if (i > 0 && inM) {
          cumAngle += genevaOmegaRatio(n, phi) * RAD;
        }
        val = cumAngle * DEG;
      }

      data.push({ deg: i, val: val });
      if (val < yMin) yMin = val;
      if (val > yMax) yMax = val;
    }

    var yRange = yMax - yMin;
    if (yRange < 0.001) { yRange = 1; yMin -= 0.5; yMax += 0.5; }
    yMin -= yRange * 0.08; yMax += yRange * 0.08; yRange = yMax - yMin;

    /* axes */
    ctx.strokeStyle = '#6b7a99'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gL, gB); ctx.lineTo(gR, gB); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gL, gT); ctx.lineTo(gL, gB); ctx.stroke();

    /* grid */
    ctx.strokeStyle = 'rgba(100,120,150,0.15)'; ctx.lineWidth = 0.5;
    for (var gx = 0; gx <= 360; gx += 90) { var px = gL + (gx / 360) * gW; ctx.beginPath(); ctx.moveTo(px, gT); ctx.lineTo(px, gB); ctx.stroke(); }
    for (var gi = 0; gi <= 4; gi++) { var gy = gT + gi * (gH / 4); ctx.beginPath(); ctx.moveTo(gL, gy); ctx.lineTo(gR, gy); ctx.stroke(); }

    /* motion phase shading — motion is at graph 0 to 2*mhDeg */
    var motionEnd = 2 * mhDeg;
    var shadeMotR = gL + (motionEnd / 360) * gW;
    ctx.fillStyle = 'rgba(124,58,237,0.08)';
    ctx.fillRect(gL, gT, shadeMotR - gL, gH);
    ctx.fillStyle = 'rgba(124,58,237,0.3)'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('MOTION', (gL + shadeMotR) / 2, gT + 12);

    /* x labels */
    ctx.fillStyle = '#8899aa'; ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var xl = 0; xl <= 360; xl += 90) ctx.fillText(xl + '\u00b0', gL + (xl / 360) * gW, gB + 4);
    ctx.fillText('Driver Angle \u03c6 (\u00b0)', (gL + gR) / 2, gB + 18);

    /* y labels */
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (var yi = 0; yi <= 4; yi++) ctx.fillText((yMax - yi * (yRange / 4)).toFixed(2), gL - 5, gT + yi * (gH / 4));

    /* y title */
    ctx.save(); ctx.translate(gL - 38, (gT + gB) / 2); ctx.rotate(-PI / 2);
    ctx.textAlign = 'center'; ctx.fillStyle = '#8899aa'; ctx.font = '9px monospace';
    var yTit = state.graphType === 'velocity' ? '\u03c9\u2082/\u03c9\u2081' : state.graphType === 'acceleration' ? '\u03b1\u2082/\u03c9\u2081\u00b2' : '\u03b8\u2082 (\u00b0)';
    ctx.fillText(yTit, 0, 0); ctx.restore();

    /* graph title */
    ctx.fillStyle = '#ccd0dd'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    var gTit = state.graphType === 'velocity' ? 'Velocity Ratio vs \u03c6' : state.graphType === 'acceleration' ? 'Accel. Ratio vs \u03c6' : 'Displacement vs \u03c6';
    ctx.fillText(gTit, (gL + gR) / 2, gT - 5);

    /* curve */
    ctx.beginPath(); var started = false;
    for (var ci = 0; ci < data.length; ci++) {
      var cx = gL + (data[ci].deg / 360) * gW;
      var cy = gT + ((yMax - data[ci].val) / yRange) * gH;
      if (!started) { ctx.moveTo(cx, cy); started = true; } else ctx.lineTo(cx, cy);
    }
    var cc = state.graphType === 'velocity' ? '#42a5f5' : state.graphType === 'acceleration' ? '#ef5350' : '#3ddc84';
    ctx.strokeStyle = cc; ctx.lineWidth = 2.5; ctx.stroke();

    /* dot — map current driver angle to graph x using offset */
    var curDeg = ((state.driverAngle * DEG + mhDeg) % 360 + 360) % 360;
    var idx = Math.round(curDeg); if (idx > 360) idx = 360;
    var curVal = data[idx] ? data[idx].val : 0;
    var dotX = gL + (curDeg / 360) * gW;
    var dotY = gT + ((yMax - curVal) / yRange) * gH;
    ctx.beginPath(); ctx.arc(dotX, dotY, 5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.strokeStyle = cc; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace';
    ctx.textAlign = dotX > (gL + gR) / 2 ? 'right' : 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(curVal.toFixed(3), dotX + (dotX > (gL + gR) / 2 ? -10 : 10), dotY - 8);

    ctx.restore();
  }

  /* ================================================================
     SECTION 11: MAIN DRAW & READOUTS
     ================================================================ */
  function draw() {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);
    if (typeof showGrid !== 'undefined' && showGrid) drawGrid();
    drawDivider();
    ctx.save(); try { drawMechanism(); } catch(e) {} ctx.restore();
    ctx.save(); try { drawGraph(); } catch(e) {} ctx.restore();
    updateReadouts();
  }

  function updateReadouts() {
    var n = state.n, da = state.driverAngle;
    var omega1 = state.rpm * TAU / 60;
    var inM = isMotionPhase(da, n);
    var phi = driverToPhi(da, n);
    var omR = inM ? genevaOmegaRatio(n, phi) : 0;
    var alR = inM ? genevaAlphaRatio(n, phi) : 0;

    setText('r-phi', (da * DEG).toFixed(1) + '\u00b0');
    setText('r-theta2', (state.wheelAngle * DEG).toFixed(1) + '\u00b0');
    setText('r-ratio', omR.toFixed(4));
    setText('r-alpha', alR.toFixed(4));
    setText('r-slots', n);
    setText('r-dwell', genevaDwellPct(n).toFixed(1));
    setText('r-index', (360 / n).toFixed(1));
    setText('r-omega', omega1.toFixed(2));
    /* Update unit labels on companion inputs */
    if (typeof updateUnitLabels === 'function') updateUnitLabels();
  }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v; }

  /* ================================================================
     SECTION 12: ANIMATION LOOP — Direct atan2 position (constraint 11, 16, 17)
     ================================================================ */
  var lastTime = 0;

  /* Compute wheel angle directly from driver angle using unwrapped atan2 (no drift).
     Uses completedSteps to track cumulative indexing.
     Constraint 11: direct position, no integration.
     Constraint 16: no drift.
     Constraint 17: snap to exact k*(2PI/n) at dwell. */
  function updateWheelPosition() {
    var n = state.n;
    var mh = genevaMotionHalf(n);
    var theta = state.driverAngle;
    /* Normalize to [-PI, PI] (motion phase centered at 0) */
    var thetaMod = theta;
    while (thetaMod > PI) thetaMod -= TAU;
    while (thetaMod < -PI) thetaMod += TAU;

    var inM = Math.abs(thetaMod) <= mh + 0.001;

    if (inM) {
      /* Direct displacement with proper angle unwrapping.
         delta goes from ~0 at entry to ~-(2PI/n) at exit. */
      var delta = genevaDirectDisplacement(n, thetaMod);
      state.wheelAngle = -(state.completedSteps * (TAU / n)) + delta;
    } else {
      /* Dwell: snap to locked position */
      if (state.lastMotionPhase && !inM) {
        state.completedSteps++;
        if (state.completedSteps >= n) {
          state.completedSteps -= n;
        }
      }
      state.wheelAngle = -(state.completedSteps * (TAU / n));
    }
    state.lastMotionPhase = inM;
  }

  function animate(ts) {
    requestAnimationFrame(animate);
    if (!state.running || state.mode !== 'simulate') { lastTime = ts; return; }
    var dt = lastTime ? (ts - lastTime) / 1000 : 0; lastTime = ts;
    if (dt > 0.1) dt = 0.016;

    var omega1 = state.rpm * TAU / 60;
    state.driverAngle += omega1 * dt;
    if (state.driverAngle >= TAU) state.driverAngle -= TAU;

    updateWheelPosition();
    draw();
  }
  requestAnimationFrame(animate);

  /* ================================================================
     SECTION 13: EVENT HANDLERS
     ================================================================ */
  var modeTabs = $('mode-tabs');
  if (modeTabs) modeTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-mode]'); if (!btn) return;
    showMode(btn.getAttribute('data-mode'));
  });

  var slotTabs = $('slot-tabs');
  if (slotTabs) slotTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-slots]'); if (!btn) return;
    state.n = parseInt(btn.getAttribute('data-slots'), 10);
    state.driverAngle = PI; state.wheelAngle = 0; state.completedSteps = 0; state.lastMotionPhase = false;
    qsa('#slot-tabs [data-slots]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    syncSliders('a');
    draw();
  });

  var graphTabs = $('graph-tabs');
  if (graphTabs) graphTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-graph]'); if (!btn) return;
    state.graphType = btn.getAttribute('data-graph');
    qsa('#graph-tabs [data-graph]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active'); draw();
  });

  function onSlider(slId, valId, prop, parser) {
    var sl = $(slId), val = $(valId); if (!sl) return;
    sl.addEventListener('input', function () {
      var v = parser ? parser(sl.value) : parseFloat(sl.value);
      state[prop] = v; if (val && document.activeElement !== val) val.value = v; draw();
    });
  }
  /* Coupled crank/wheel radius sliders — kinematic constraint: Rg = a / tan(π/n) */
  function computeRg(a, n) { return a / Math.tan(PI / n); }
  function computeA(Rg, n) { return Rg * Math.tan(PI / n); }

  function syncSliders(source) {
    var slA = $('sl-radius'), vA = $('val-radius');
    var slR = $('sl-rg'), vR = $('val-rg');
    var n = state.n;
    /* Update dynamic min/max for Rg slider based on current n */
    var rgMin = Math.round(computeRg(20, n));
    var rgMax = Math.round(computeRg(80, n));
    if (slR) { slR.min = rgMin; slR.max = rgMax; }

    if (source === 'a') {
      var Rg = Math.round(computeRg(state.a, n));
      if (slR) slR.value = Rg;
      if (vR && document.activeElement !== vR) vR.value = toDisplay(Rg);
    } else if (source === 'Rg') {
      var rgVal = parseInt(slR.value);
      var newA = computeA(rgVal, n);
      newA = Math.max(20, Math.min(80, Math.round(newA)));
      state.a = newA;
      if (slA) slA.value = newA;
      if (vA && document.activeElement !== vA) vA.value = toDisplay(newA);
      var rgExact = Math.round(computeRg(newA, n));
      if (slR) slR.value = rgExact;
      if (vR && document.activeElement !== vR) vR.value = toDisplay(rgExact);
    }
    if (source === 'a') {
      if (slA) slA.value = state.a;
      if (vA && document.activeElement !== vA) vA.value = toDisplay(state.a);
    }
  }

  /* Crank radius slider — changing a updates Rg */
  (function () {
    var sl = $('sl-radius'); if (!sl) return;
    sl.addEventListener('input', function () {
      state.a = parseInt(sl.value);
      syncSliders('a');
      draw();
    });
  })();

  /* Wheel radius slider — changing Rg updates a */
  (function () {
    var sl = $('sl-rg'); if (!sl) return;
    sl.addEventListener('input', function () {
      syncSliders('Rg');
      draw();
    });
  })();

  /* Initialize Rg slider to match default state */
  syncSliders('a');

  onSlider('sl-rpm', 'val-rpm', 'rpm', parseInt);

  qsa('.preset-btn').forEach(function (btn) {
    btn.addEventListener('pointerdown', function () {
      var name = btn.getAttribute('data-preset');
      if (name && PRESETS[name]) applyPreset(name);
    });
  });

  function applyPreset(name) {
    var p = PRESETS[name]; if (!p) return;
    state.n = p.n; state.a = p.a; state.rpm = p.rpm;
    state.driverAngle = PI; state.wheelAngle = 0; state.completedSteps = 0; state.lastMotionPhase = false; state.activePreset = name;
    var sl1 = $('sl-radius'), v1 = $('val-radius'); if (sl1) sl1.value = p.a; if (v1) v1.value = p.a;
    syncSliders('a');
    var sl2 = $('sl-rpm'), v2 = $('val-rpm'); if (sl2) sl2.value = p.rpm; if (v2) v2.value = p.rpm;
    qsa('#slot-tabs [data-slots]').forEach(function (b) { b.classList.remove('active'); });
    var sb = qs('#slot-tabs [data-slots="' + p.n + '"]'); if (sb) sb.classList.add('active');
    qsa('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
    var ab = qs('.preset-btn[data-preset="' + name + '"]'); if (ab) ab.classList.add('active');
    draw();
  }

  cvs.addEventListener('pointerdown', function () { if (state.mode === 'simulate') state.running = !state.running; });

  document.addEventListener('keydown', function (ev) {
    if (state.mode !== 'simulate') return;
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
    if (ev.code === 'Space') { ev.preventDefault(); state.running = !state.running; }
    else if (ev.code === 'ArrowRight') {
      ev.preventDefault(); state.running = false;
      state.driverAngle += 2 * RAD;
      if (state.driverAngle >= TAU) state.driverAngle -= TAU;
      updateWheelPosition();
      draw();
    } else if (ev.code === 'ArrowLeft') {
      ev.preventDefault(); state.running = false;
      state.driverAngle -= 2 * RAD;
      if (state.driverAngle < 0) state.driverAngle += TAU;
      updateWheelPosition();
      draw();
    }
  });

  /* ================================================================
     SECTION 14: MODE SWITCHING
     ================================================================ */
  function showMode(mode) {
    state.mode = mode;
    qsa('#mode-tabs [data-mode]').forEach(function (b) { b.classList.remove('active'); });
    var ab = qs('#mode-tabs [data-mode="' + mode + '"]'); if (ab) ab.classList.add('active');
    var panels = {
      'sim-panel': mode === 'simulate', 'cat-row': mode === 'explore', 'cat-tabs': mode === 'explore',
      'concept-grid': mode === 'explore' && !state.exploreItem, 'item-info': mode === 'explore' && !!state.exploreItem,
      'practice-panel': mode === 'practice', 'practice-bar': mode === 'practice',
      'quiz-panel': mode === 'quiz', 'quiz-bar': mode === 'quiz', 'quiz-result': false
    };
    for (var pid in panels) { var el = $(pid); if (el) el.style.display = panels[pid] ? '' : 'none'; }
    /* E4: hide readout row in non-simulate modes */
    var rr = $('readout-row'); if (rr) rr.style.display = mode === 'simulate' ? '' : 'none';
    if (mode === 'simulate') { state.running = true; draw(); }
    else {
      state.running = false;
      if (mode === 'explore') renderConceptGrid();
      /* A8: reset practice state on re-entry */
      if (mode === 'practice') { state.pracCurrent = null; state.pracAnswered = false; newPracticeProblem(); }
      /* A8: reset quiz state on re-entry */
      if (mode === 'quiz') { state.quizQuestions = []; state.quizIdx = 0; state.quizScore = 0; state.quizAnswered = false; state.quizResults = []; startQuiz(); }
      draw();
    }
  }

  /* ================================================================
     SECTION 15: EXPLORE
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
    var grid = $('concept-grid'); if (!grid) return; grid.innerHTML = '';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === state.exploreCat; });
    var container = document.createElement('div'); container.className = 'is-grid';
    filtered.forEach(function (c) {
      var btn = document.createElement('button'); btn.className = 'is-btn';
      if (state.exploreItem && state.exploreItem.id === c.id) btn.classList.add('active');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
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
    var html = '<div class="ii-top"><span class="ii-name">' + concept.name + '</span><span class="ii-cat-badge">' + catLabel + '</span></div>';
    html += '<div class="ii-desc">' + concept.desc.replace(/\n/g, '<br>') + '</div>';
    if (concept.formula && concept.formula !== '\u2014') {
      html += '<div class="formula-box"><span class="fb-formula">' + concept.formula + '</span>';
      if (concept.unit && concept.unit !== '\u2014') html += '<span class="fb-unit">[' + concept.unit + ']</span>';
      html += '</div>';
    }
    if (concept.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<div class="ex-problem">' + concept.example.problem + '</div>';
      concept.example.steps.forEach(function (s) { html += '<div class="ex-step">' + s + '</div>'; });
      html += '</div>';
    }
    info.innerHTML = html; info.style.display = '';
  }

  /* ================================================================
     SECTION 16: PRACTICE
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
      correct = uv.toLowerCase().replace(/\s+/g, '') === String(state.pracCurrent.answer).toLowerCase().replace(/\s+/g, '');
    } else {
      var num = parseFloat(uv), ans = state.pracCurrent.answer;
      var tol = Math.abs(ans) < 1 ? 0.05 : Math.abs(ans) * 0.02;
      correct = Math.abs(num - ans) <= Math.max(tol, 0.5);
    }
    if (correct) { state.pracScore++; feedback.textContent = '\u2714 Correct!'; feedback.className = 'feedback ok'; }
    else { feedback.textContent = '\u2718 Incorrect. Answer: ' + state.pracCurrent.answer + ' ' + state.pracCurrent.unit; feedback.className = 'feedback err'; showSolution(); }
    setText('pp-score', state.pracScore + ' / ' + state.pracTotal);
    var nextBtn = $('pp-next'); if (nextBtn) nextBtn.disabled = false;
  });

  var ppNext = $('pp-next'); if (ppNext) ppNext.addEventListener('pointerdown', function () { newPracticeProblem(); });
  var ppShowSol = $('pp-show-sol'); if (ppShowSol) ppShowSol.addEventListener('pointerdown', function () { showSolution(); });
  function showSolution() {
    if (!state.pracCurrent) return;
    var sol = $('pp-solution'), steps = $('pp-sol-steps'); if (!sol || !steps) return;
    steps.innerHTML = '';
    state.pracCurrent.steps.forEach(function (s) { var d = document.createElement('div'); d.className = 'sol-step'; d.innerHTML = s; steps.appendChild(d); });
    sol.style.display = '';
  }
  var ppInput = $('pp-input');
  if (ppInput) ppInput.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' && !state.pracAnswered) { ev.preventDefault(); if (ppCheck) ppCheck.click(); } });

  /* ================================================================
     SECTION 17: QUIZ
     ================================================================ */
  function startQuiz() {
    var pool = QUIZ_POOL.slice(); shuffle(pool);
    state.quizQuestions = pool.slice(0, 5); state.quizIdx = 0; state.quizScore = 0;
    state.quizAnswered = false; state.quizResults = [];
    showQuizQuestion();
    var result = $('quiz-result'); if (result) result.style.display = 'none';
    var panel = $('quiz-panel'); if (panel) panel.style.display = '';
    var bar = $('quiz-bar'); if (bar) bar.style.display = '';
  }
  function showQuizQuestion() {
    var q = state.quizQuestions[state.quizIdx]; if (!q) return;
    state.quizAnswered = false;
    setText('qbar-num', state.quizIdx + 1); setText('qbar-total', state.quizQuestions.length);
    var prompt = $('qp-prompt'); if (prompt) prompt.textContent = q.q;
    var feedback = $('qp-feedback'); if (feedback) { feedback.textContent = ''; feedback.className = 'quiz-feedback'; }
    var grid = $('qp-answers');
    if (grid) { grid.innerHTML = ''; q.choices.forEach(function (ch, ci) {
      var btn = document.createElement('button'); btn.className = 'answer-btn'; btn.textContent = ch;
      btn.addEventListener('pointerdown', function () { if (state.quizAnswered) return; handleQuizAnswer(ci); });
      grid.appendChild(btn);
    }); }
    var qiRow = $('qi-row'); if (qiRow) qiRow.style.display = 'none';
    var submitBtn = $('q-submit'); if (submitBtn) submitBtn.style.display = 'none';
    var nextBtn = $('q-next'); if (nextBtn) nextBtn.disabled = true;
  }
  function handleQuizAnswer(chosen) {
    state.quizAnswered = true;
    var q = state.quizQuestions[state.quizIdx]; var correct = chosen === q.correct;
    if (correct) state.quizScore++;
    state.quizResults.push({ q: q.q, chosen: q.choices[chosen], correct: correct, answer: q.choices[q.correct] });
    var feedback = $('qp-feedback');
    if (feedback) { feedback.textContent = correct ? '\u2714 Correct!' : '\u2718 Incorrect. Answer: ' + q.choices[q.correct]; feedback.className = 'quiz-feedback ' + (correct ? 'ok' : 'err'); }
    var grid = $('qp-answers');
    if (grid) { grid.querySelectorAll('.answer-btn').forEach(function (b, bi) { b.classList.add('locked'); if (bi === q.correct) b.classList.add('correct'); if (bi === chosen && !correct) b.classList.add('wrong'); }); }
    var nextBtn = $('q-next'); if (nextBtn) nextBtn.disabled = false;
  }
  var qNext = $('q-next');
  if (qNext) qNext.addEventListener('pointerdown', function () { if (!state.quizAnswered) return; state.quizIdx++; if (state.quizIdx >= state.quizQuestions.length) showQuizResult(); else showQuizQuestion(); });
  function showQuizResult() {
    var panel = $('quiz-panel'), bar = $('quiz-bar'), result = $('quiz-result');
    if (panel) panel.style.display = 'none'; if (bar) bar.style.display = 'none'; if (result) result.style.display = '';
    var pct = Math.round(state.quizScore / state.quizQuestions.length * 100);
    var scoreEl = $('qr-score'); if (scoreEl) { scoreEl.textContent = pct + '%'; scoreEl.className = 'qr-score ' + (pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor'); }
    var verdict = $('qr-verdict'); if (verdict) verdict.textContent = state.quizScore + ' of ' + state.quizQuestions.length + ' correct';
    var stars = $('qr-stars'); if (stars) { var s = pct >= 100 ? 5 : pct >= 80 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1; stars.textContent = '\u2605'.repeat(s) + '\u2606'.repeat(5 - s); }
    var rows = $('qr-rows');
    if (rows) { rows.innerHTML = ''; state.quizResults.forEach(function (r, ri) {
      var div = document.createElement('div'); div.className = 'qr-row ' + (r.correct ? 'ok' : 'err');
      div.innerHTML = '<span class="qr-qnum">Q' + (ri + 1) + '</span><span class="qr-detail">' + r.q + ' <strong>' + r.answer + '</strong></span><span class="qr-mark">' + (r.correct ? '\u2714' : '\u2718') + '</span>';
      rows.appendChild(div);
    }); }
  }
  var qNewQuiz = $('q-new-quiz');
  if (qNewQuiz) qNewQuiz.addEventListener('pointerdown', function () { startQuiz(); });

  /* ================================================================
     SECTION 18: COMPANION TEXT INPUTS FOR SLIDERS (D14/E11)
     ================================================================ */
  /* Crank radius text input */
  (function () {
    var inp = $('val-radius'); if (!inp) return;
    function commit() {
      var v = fromDisplay(parseFloat(inp.value));
      if (isNaN(v)) { inp.value = toDisplay(state.a); return; }
      v = Math.max(20, Math.min(80, Math.round(v)));
      state.a = v; inp.value = toDisplay(v);
      var sl = $('sl-radius'); if (sl) sl.value = v;
      syncSliders('a'); draw();
    }
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); inp.blur(); } });
  })();
  /* Wheel radius text input */
  (function () {
    var inp = $('val-rg'); if (!inp) return;
    function commit() {
      var v = fromDisplay(parseFloat(inp.value));
      if (isNaN(v)) { syncSliders('a'); return; }
      var sl = $('sl-rg'); if (sl) sl.value = Math.round(v);
      syncSliders('Rg'); draw();
    }
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); inp.blur(); } });
  })();
  /* RPM text input */
  (function () {
    var inp = $('val-rpm'); if (!inp) return;
    function commit() {
      var v = parseInt(inp.value);
      if (isNaN(v)) { inp.value = state.rpm; return; }
      v = Math.max(5, Math.min(60, v));
      state.rpm = v; inp.value = v;
      var sl = $('sl-rpm'); if (sl) sl.value = v;
      draw();
    }
    inp.addEventListener('change', commit);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); commit(); inp.blur(); } });
  })();

  /* ================================================================
     SECTION 19: SI / IMPERIAL UNIT TOGGLE (D6)
     ================================================================ */
  var unitMode = 'si'; /* 'si' or 'imp' */
  var MM_TO_IN = 0.03937;

  function toDisplay(mmVal) { return unitMode === 'imp' ? (mmVal * MM_TO_IN).toFixed(2) : Math.round(mmVal); }
  /* Inverse of toDisplay — turns a typed value in the displayed unit back into mm. */
  function fromDisplay(dispVal) { return unitMode === 'imp' ? dispVal / MM_TO_IN : dispVal; }
  function uLabel() { return unitMode === 'imp' ? 'in' : 'mm'; }

  function updateUnitLabels() {
    var u = uLabel();
    var ur = $('unit-radius'); if (ur) ur.textContent = u;
    var urg = $('unit-rg'); if (urg) urg.textContent = u;
    /* Update slider text input values to display units */
    var vA = $('val-radius');
    if (vA && document.activeElement !== vA) {
      vA.value = toDisplay(state.a);
      vA.step = unitMode === 'imp' ? '0.01' : '1';
    }
    var vR = $('val-rg');
    if (vR && document.activeElement !== vR) {
      var Rg = Math.round(computeRg(state.a, state.n));
      vR.value = toDisplay(Rg);
      vR.step = unitMode === 'imp' ? '0.01' : '1';
    }
    /* min/max are authored in mm — restate them in the displayed unit so an
       inch entry inside the legal mm range isn't rejected by the browser. */
    [['val-radius', 20, 80], ['val-rg', 11, 194]].forEach(function (r) {
      var el = $(r[0]); if (!el) return;
      el.min = unitMode === 'imp' ? (r[1] * MM_TO_IN).toFixed(2) : r[1];
      el.max = unitMode === 'imp' ? (r[2] * MM_TO_IN).toFixed(2) : r[2];
    });
  }

  var unitTabs = $('unit-tabs');
  if (unitTabs) unitTabs.addEventListener('pointerdown', function (ev) {
    var btn = ev.target.closest('[data-unit]'); if (!btn) return;
    unitMode = btn.getAttribute('data-unit');
    qsa('#unit-tabs [data-unit]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    updateUnitLabels();
    draw();
  });

  /* ================================================================
     SECTION 20: RIGHT-CLICK CONTEXT MENU (A14)
     ================================================================ */
  var showGrid = true;
  var ctxMenu = $('ctx-menu');

  function hideCtxMenu() { if (ctxMenu) ctxMenu.style.display = 'none'; }
  document.addEventListener('pointerdown', hideCtxMenu);
  document.addEventListener('scroll', hideCtxMenu);

  cvs.addEventListener('contextmenu', function (ev) {
    ev.preventDefault();
    if (!ctxMenu) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var x = Math.min(ev.clientX, vw - 160), y = Math.min(ev.clientY, vh - 120);
    ctxMenu.style.left = x + 'px'; ctxMenu.style.top = y + 'px'; ctxMenu.style.display = '';
  });

  var ctxCopy = $('ctx-copy');
  if (ctxCopy) ctxCopy.addEventListener('pointerdown', function (ev) {
    ev.stopPropagation(); hideCtxMenu();
    var n = state.n, da = state.driverAngle, inM = isMotionPhase(da, n);
    var phi = driverToPhi(da, n);
    var txt = 'Geneva ' + n + '-Slot\n' +
      '\u03c6 = ' + (da * DEG).toFixed(1) + '\u00b0\n' +
      '\u03b8\u2082 = ' + (state.wheelAngle * DEG).toFixed(1) + '\u00b0\n' +
      '\u03c9\u2082/\u03c9\u2081 = ' + (inM ? genevaOmegaRatio(n, phi) : 0).toFixed(4) + '\n' +
      'Dwell = ' + genevaDwellPct(n).toFixed(1) + '%';
    if (navigator.clipboard) navigator.clipboard.writeText(txt);
  });

  var ctxReset = $('ctx-reset');
  if (ctxReset) ctxReset.addEventListener('pointerdown', function (ev) {
    ev.stopPropagation(); hideCtxMenu();
    state.driverAngle = PI; state.wheelAngle = 0; state.completedSteps = 0; state.lastMotionPhase = false;
    state.running = true; draw();
  });

  var ctxGrid = $('ctx-grid');
  if (ctxGrid) ctxGrid.addEventListener('pointerdown', function (ev) {
    ev.stopPropagation(); hideCtxMenu();
    showGrid = !showGrid; draw();
  });

  /* ================================================================
     SECTION 21: FIRST-TIME HINT BAR (E2)
     ================================================================ */
  var hintClose = $('hint-close');
  if (hintClose) hintClose.addEventListener('pointerdown', function () {
    var bar = $('hint-bar'); if (bar) bar.style.display = 'none';
  });
  /* Auto-close hint on first canvas interaction */
  cvs.addEventListener('pointerdown', function dismissHint() {
    var bar = $('hint-bar'); if (bar) bar.style.display = 'none';
    cvs.removeEventListener('pointerdown', dismissHint);
  });

  /* ================================================================
     SECTION 22: INITIAL DRAW
     ================================================================ */
  draw();

})();
