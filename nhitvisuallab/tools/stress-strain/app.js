/* ═══════════════════════════════════════════════════════════════════
   Stress-Strain Diagram Trainer — app.js  v1
   NHIT VisualLab · https://nhitvisuallab.org
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────
     1. DATA — 15 CONCEPTS
     ──────────────────────────────────────────────────────────────── */
  var CONCEPTS = [
    /* ── Properties ── */
    { id:'stress', name:'Stress', symbol:'σ', formula:'σ = F / A', unit:'MPa (N/mm²)', cat:'properties',
      desc:'Stress is the internal resistance offered by a material per unit cross-sectional area when subjected to an external force. It indicates how much force is distributed over the material\'s cross-section.',
      example:{ problem:'A steel rod of cross-sectional area 200 mm² is subjected to a tensile force of 50 kN. Calculate the stress.', steps:['Given: F = 50 kN = 50,000 N, A = 200 mm²', 'σ = F / A', 'σ = 50,000 / 200', 'σ = 250 MPa'], answer:250, unit:'MPa' } },

    { id:'strain', name:'Strain', symbol:'ε', formula:'ε = ΔL / L₀', unit:'dimensionless', cat:'properties',
      desc:'Strain is the ratio of change in length to the original length when a material is deformed. It is a dimensionless quantity that measures the degree of deformation.',
      example:{ problem:'A 2 m long rod elongates by 1.5 mm under tensile load. Calculate the strain.', steps:['Given: ΔL = 1.5 mm, L₀ = 2 m = 2000 mm', 'ε = ΔL / L₀', 'ε = 1.5 / 2000', 'ε = 0.00075'], answer:0.00075, unit:'' } },

    { id:'youngs', name:'Young\'s Modulus', symbol:'E', formula:'E = σ / ε', unit:'GPa', cat:'properties',
      desc:'Young\'s Modulus (Modulus of Elasticity) is the ratio of stress to strain in the linear elastic region. It represents the stiffness of a material — higher E means a stiffer material.',
      example:{ problem:'A material has a stress of 210 MPa at a strain of 0.001. Calculate Young\'s Modulus.', steps:['Given: σ = 210 MPa, ε = 0.001', 'E = σ / ε', 'E = 210 / 0.001', 'E = 210,000 MPa = 210 GPa'], answer:210, unit:'GPa' } },

    { id:'poisson', name:'Poisson\'s Ratio', symbol:'ν', formula:'ν = −ε_lateral / ε_axial', unit:'dimensionless', cat:'properties',
      desc:'Poisson\'s Ratio is the negative ratio of lateral strain to axial strain. When a material is stretched axially, it contracts laterally. Typical values: steel ≈ 0.3, rubber ≈ 0.5, cork ≈ 0.',
      example:{ problem:'A bar under tension has an axial strain of 0.002 and lateral strain of −0.0006. Calculate Poisson\'s ratio.', steps:['Given: ε_axial = 0.002, ε_lateral = −0.0006', 'ν = −ε_lateral / ε_axial', 'ν = −(−0.0006) / 0.002', 'ν = 0.3'], answer:0.3, unit:'' } },

    /* ── Curve points ── */
    { id:'proportional', name:'Proportional Limit', symbol:'—', formula:'End of linear σ-ε region', unit:'MPa', cat:'curve',
      desc:'The proportional limit is the maximum stress at which stress remains directly proportional to strain (Hooke\'s Law applies). Beyond this point, the stress-strain curve begins to deviate from a straight line.',
      example:{ problem:'A material follows Hooke\'s Law up to a stress of 180 MPa with E = 200 GPa. What is the strain at the proportional limit?', steps:['Given: σ = 180 MPa, E = 200 GPa = 200,000 MPa', 'ε = σ / E', 'ε = 180 / 200,000', 'ε = 0.0009'], answer:0.0009, unit:'' } },

    { id:'elastic', name:'Elastic Limit', symbol:'—', formula:'Max stress for full recovery', unit:'MPa', cat:'curve',
      desc:'The elastic limit is the maximum stress a material can withstand and still return to its original shape when the load is removed. Beyond this point, permanent (plastic) deformation begins.',
      example:{ problem:'A spring steel has an elastic limit of 400 MPa and E = 200 GPa. Calculate the maximum elastic strain.', steps:['Given: σ_e = 400 MPa, E = 200,000 MPa', 'ε = σ / E', 'ε = 400 / 200,000', 'ε = 0.002'], answer:0.002, unit:'' } },

    { id:'yield', name:'Yield Stress', symbol:'σ_y', formula:'Onset of plastic deformation', unit:'MPa', cat:'curve',
      desc:'Yield stress is the stress at which a material begins to deform permanently (plastically). For mild steel, distinct upper and lower yield points are visible. For other materials, a 0.2% proof stress is used.',
      example:{ problem:'A structural beam uses steel with σ_y = 250 MPa. If the working stress is 100 MPa, what is the Factor of Safety?', steps:['Given: σ_y = 250 MPa, σ_working = 100 MPa', 'FoS = σ_y / σ_working', 'FoS = 250 / 100', 'FoS = 2.5'], answer:2.5, unit:'' } },

    { id:'uts', name:'Ultimate Tensile Stress', symbol:'σ_u', formula:'Maximum stress on curve', unit:'MPa', cat:'curve',
      desc:'The Ultimate Tensile Stress (UTS) is the maximum stress a material can withstand before necking begins. It represents the peak of the engineering stress-strain curve and is used to specify material strength.',
      example:{ problem:'A bolt made of steel with σ_u = 830 MPa has a cross-sectional area of 78.5 mm². What is the maximum tensile force it can withstand?', steps:['Given: σ_u = 830 MPa, A = 78.5 mm²', 'F = σ_u × A', 'F = 830 × 78.5', 'F = 65,155 N ≈ 65.2 kN'], answer:65155, unit:'N' } },

    { id:'proof', name:'0.2% Proof Stress', symbol:'σ₀.₂', formula:'Stress at 0.2% offset strain', unit:'MPa', cat:'curve',
      desc:'For materials without a distinct yield point (e.g., aluminium, copper), the 0.2% proof stress is used. A line parallel to the initial linear portion is drawn from 0.2% (0.002) strain — where it intersects the curve defines σ₀.₂.',
      example:{ problem:'An aluminium alloy has E = 70 GPa and 0.2% proof stress of 280 MPa. At what total strain does yielding occur?', steps:['Given: σ₀.₂ = 280 MPa, E = 70,000 MPa', 'Elastic strain = σ / E = 280 / 70,000 = 0.004', 'Total strain = elastic + offset = 0.004 + 0.002', 'ε_total = 0.006'], answer:0.006, unit:'' } },

    { id:'necking', name:'Necking', symbol:'—', formula:'Localized cross-section reduction', unit:'—', cat:'curve',
      desc:'Necking is the localized reduction in cross-sectional area that occurs after the UTS is reached. The material thins at one point, engineering stress drops (because we use original area), and fracture eventually occurs at this neck.',
      example:null },

    /* ── Design ── */
    { id:'fos', name:'Factor of Safety', symbol:'FoS', formula:'FoS = σ_y / σ_working', unit:'dimensionless', cat:'design',
      desc:'The Factor of Safety (FoS) is the ratio of the material\'s yield stress to the actual working stress. It provides a safety margin against unexpected loads, material defects, or calculation errors. Typical FoS: buildings 3–5, aircraft 1.5–2.5.',
      example:{ problem:'A shaft operates at a working stress of 80 MPa. The material yield stress is 360 MPa. Calculate the Factor of Safety.', steps:['Given: σ_y = 360 MPa, σ_working = 80 MPa', 'FoS = σ_y / σ_working', 'FoS = 360 / 80', 'FoS = 4.5'], answer:4.5, unit:'' } },

    { id:'resilience', name:'Resilience', symbol:'U_r', formula:'U_r = ½ × σ_y × ε_y', unit:'J/m³', cat:'design',
      desc:'Resilience (Modulus of Resilience) is the energy absorbed per unit volume up to the elastic limit. It represents the material\'s ability to absorb energy without permanent deformation — the area under the elastic portion of the curve.',
      example:{ problem:'A steel has yield stress 250 MPa and E = 200 GPa. Calculate the modulus of resilience.', steps:['Given: σ_y = 250 MPa, E = 200,000 MPa', 'ε_y = σ_y / E = 250 / 200,000 = 0.00125', 'U_r = ½ × σ_y × ε_y', 'U_r = 0.5 × 250 × 0.00125 = 0.15625 MPa = 156,250 J/m³'], answer:0.15625, unit:'MPa' } },

    { id:'toughness', name:'Toughness', symbol:'U_t', formula:'U_t = ∫σ dε (area under curve)', unit:'J/m³', cat:'design',
      desc:'Toughness is the total energy absorbed per unit volume until fracture — the entire area under the stress-strain curve. A tough material has both high strength and high ductility. Example: mild steel is tough, glass is not.',
      example:null },

    { id:'ductile', name:'Ductile Material', symbol:'—', formula:'Large plastic region before fracture', unit:'—', cat:'design',
      desc:'A ductile material undergoes significant plastic deformation before fracturing (e.g., mild steel, copper, aluminium). The stress-strain curve shows a long strain-hardening region, distinct necking, and high total elongation (>5%).',
      example:null },

    { id:'brittle', name:'Brittle Material', symbol:'—', formula:'Fractures with little/no plastic deformation', unit:'—', cat:'design',
      desc:'A brittle material fractures suddenly with little or no plastic deformation (e.g., cast iron, glass, ceramics, concrete in tension). The stress-strain curve is nearly linear until sudden fracture — no yield point or necking is visible.',
      example:null }
  ];

  /* ────────────────────────────────────────────────────────────────
     2. DATA — 7 CURVE REGIONS (normalised t: 0-1 along curve)
     ──────────────────────────────────────────────────────────────── */
  var REGIONS = [
    { id:'proportional', name:'Proportional Limit (Hooke\'s Law)', t1:0, t2:0.18,
      desc:'Stress is directly proportional to strain. The slope of this line equals Young\'s Modulus (E). Hooke\'s Law applies: σ = Eε.',
      color:'#7c4dff' },
    { id:'elastic', name:'Elastic Region', t1:0.18, t2:0.24,
      desc:'Slight deviation from linearity, but the material still returns to its original shape if unloaded. No permanent deformation.',
      color:'#536dfe' },
    { id:'yield', name:'Yield Point', t1:0.24, t2:0.34,
      desc:'The material begins to deform plastically. For mild steel, a distinct upper and lower yield point is visible — the stress drops slightly as dislocations begin to move freely.',
      color:'#3ddc84' },
    { id:'hardening', name:'Strain Hardening', t1:0.34, t2:0.65,
      desc:'After yielding, the material strengthens due to dislocation entanglement. Stress increases with strain, but at a decreasing rate.',
      color:'#ff9800' },
    { id:'uts', name:'Ultimate Tensile Stress (UTS)', t1:0.65, t2:0.75,
      desc:'The maximum stress the material can withstand. The peak of the engineering stress-strain curve. Beyond this, necking begins.',
      color:'#f44336' },
    { id:'necking', name:'Necking', t1:0.75, t2:0.92,
      desc:'A localized constriction forms. The cross-sectional area decreases rapidly at one point. Engineering stress drops because we use the original area.',
      color:'#e91e63' },
    { id:'fracture', name:'Fracture', t1:0.92, t2:1.0,
      desc:'The material breaks at the neck. The fracture surface is typically cup-and-cone shaped for ductile materials.',
      color:'#ff5252' }
  ];

  /* ────────────────────────────────────────────────────────────────
     3. DATA — LEARN PARTS
     ──────────────────────────────────────────────────────────────── */
  var LEARN_PARTS = [
    { name:'Proportional / Hooke\'s Law', desc:'Linear region — σ = Eε. Slope = Young\'s Modulus.', color:'#7c4dff' },
    { name:'Elastic Limit', desc:'Maximum stress for full elastic recovery — no permanent set.', color:'#536dfe' },
    { name:'Yield Point (σ_y)', desc:'Onset of plastic deformation. Upper/lower yield in mild steel.', color:'#3ddc84' },
    { name:'Strain Hardening', desc:'Material strengthens as dislocations tangle and resist movement.', color:'#ff9800' },
    { name:'Ultimate Tensile Stress (σ_u)', desc:'Peak stress on curve. Necking initiates beyond this.', color:'#f44336' },
    { name:'Necking → Fracture', desc:'Localised thinning → cup-and-cone break in ductile materials.', color:'#e91e63' },
    { name:'Brittle Behaviour', desc:'Linear to sudden fracture — no yield plateau or necking region.', color:'#ff5252' }
  ];

  /* ────────────────────────────────────────────────────────────────
     4. DATA — PRACTICE PROBLEM TEMPLATES
     ──────────────────────────────────────────────────────────────── */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function round(v, d) { var f = Math.pow(10, d); return Math.round(v * f) / f; }

  var PROBLEM_GEN = [
    function () {
      var F = randInt(10, 200) * 1000;
      var A = randInt(50, 500);
      var ans = round(F / A, 2);
      return { prompt:'A rod with cross-sectional area ' + A + ' mm² is subjected to a tensile force of ' + (F/1000) + ' kN. Calculate the stress.',
        steps:['Given: F = ' + (F/1000) + ' kN = ' + F + ' N, A = ' + A + ' mm²', 'σ = F / A', 'σ = ' + F + ' / ' + A, 'σ = ' + ans + ' MPa'], answer:ans, unit:'MPa' };
    },
    function () {
      var dL = round(randInt(5, 30) * 0.1, 1);
      var L = randInt(1, 5) * 1000;
      var ans = round(dL / L, 6);
      return { prompt:'A bar of original length ' + L + ' mm elongates by ' + dL + ' mm under load. Calculate the strain.',
        steps:['Given: ΔL = ' + dL + ' mm, L₀ = ' + L + ' mm', 'ε = ΔL / L₀', 'ε = ' + dL + ' / ' + L, 'ε = ' + ans], answer:ans, unit:'' };
    },
    function () {
      var s = randInt(100, 400);
      var e = round(randInt(5, 25) * 0.0001, 4);
      var ans = round(s / e, 1);
      return { prompt:'A material has a stress of ' + s + ' MPa at a strain of ' + e + '. Calculate Young\'s Modulus in MPa.',
        steps:['Given: σ = ' + s + ' MPa, ε = ' + e, 'E = σ / ε', 'E = ' + s + ' / ' + e, 'E = ' + ans + ' MPa'], answer:ans, unit:'MPa' };
    },
    function () {
      var sy = pick([200, 250, 300, 350, 400, 450]);
      var sw = randInt(50, Math.floor(sy / 1.5));
      var ans = round(sy / sw, 2);
      return { prompt:'A component uses material with yield stress σ_y = ' + sy + ' MPa. The working stress is ' + sw + ' MPa. Calculate the Factor of Safety.',
        steps:['Given: σ_y = ' + sy + ' MPa, σ_working = ' + sw + ' MPa', 'FoS = σ_y / σ_working', 'FoS = ' + sy + ' / ' + sw, 'FoS = ' + ans], answer:ans, unit:'' };
    },
    function () {
      var F = randInt(20, 150) * 1000;
      var s = randInt(100, 500);
      var ans = round(F / s, 2);
      return { prompt:'A tensile force of ' + (F/1000) + ' kN causes a stress of ' + s + ' MPa. Calculate the cross-sectional area.',
        steps:['Given: F = ' + (F/1000) + ' kN = ' + F + ' N, σ = ' + s + ' MPa', 'A = F / σ', 'A = ' + F + ' / ' + s, 'A = ' + ans + ' mm²'], answer:ans, unit:'mm²' };
    },
    function () {
      var ea = round(randInt(10, 30) * 0.0001, 4);
      var nu = round(randInt(25, 45) * 0.01, 2);
      var el = round(ea * nu, 6);
      return { prompt:'A bar under tension has axial strain ε_axial = ' + ea + ' and Poisson\'s ratio ν = ' + nu + '. Calculate the magnitude of lateral strain.',
        steps:['Given: ε_axial = ' + ea + ', ν = ' + nu, 'ε_lateral = ν × ε_axial', 'ε_lateral = ' + nu + ' × ' + ea, 'ε_lateral = ' + el], answer:el, unit:'' };
    },
    function () {
      var s = randInt(150, 400);
      var E = pick([70000, 120000, 200000, 210000]);
      var e = round(s / E, 6);
      var Eg = E / 1000;
      return { prompt:'A material with E = ' + Eg + ' GPa is stressed to ' + s + ' MPa within the elastic region. Calculate the strain.',
        steps:['Given: σ = ' + s + ' MPa, E = ' + Eg + ' GPa = ' + E + ' MPa', 'ε = σ / E', 'ε = ' + s + ' / ' + E, 'ε = ' + e], answer:e, unit:'' };
    },
    function () {
      var e = round(randInt(5, 25) * 0.0001, 4);
      var L = randInt(1, 6) * 1000;
      var dL = round(e * L, 3);
      return { prompt:'A bar of length ' + L + ' mm has a strain of ' + e + '. Calculate the change in length (ΔL).',
        steps:['Given: ε = ' + e + ', L₀ = ' + L + ' mm', 'ΔL = ε × L₀', 'ΔL = ' + e + ' × ' + L, 'ΔL = ' + dL + ' mm'], answer:dL, unit:'mm' };
    },
    function () {
      var sy = pick([200, 250, 280, 300, 350]);
      var E = pick([200000, 210000]);
      var ey = round(sy / E, 6);
      var Ur = round(0.5 * sy * ey, 4);
      var Eg = E / 1000;
      return { prompt:'Steel has σ_y = ' + sy + ' MPa and E = ' + Eg + ' GPa. Calculate the modulus of resilience (U_r = ½σ_yε_y) in MPa.',
        steps:['Given: σ_y = ' + sy + ' MPa, E = ' + E + ' MPa', 'ε_y = σ_y / E = ' + sy + ' / ' + E + ' = ' + ey, 'U_r = ½ × σ_y × ε_y', 'U_r = 0.5 × ' + sy + ' × ' + ey + ' = ' + Ur + ' MPa'], answer:Ur, unit:'MPa' };
    },
    function () {
      var su = pick([400, 450, 500, 550, 600, 830]);
      var A = pick([50, 78.5, 100, 150, 200, 314]);
      var F = round(su * A, 1);
      return { prompt:'A bolt has UTS σ_u = ' + su + ' MPa and cross-section A = ' + A + ' mm². What is the maximum force it can take?',
        steps:['Given: σ_u = ' + su + ' MPa, A = ' + A + ' mm²', 'F = σ_u × A', 'F = ' + su + ' × ' + A, 'F = ' + F + ' N'], answer:F, unit:'N' };
    },
    function () {
      var ea = round(randInt(5, 25) * 0.0001, 4);
      var el = round(randInt(1, Math.floor(ea * 10000 * 0.5)) * 0.0001, 4);
      var nu = round(el / ea, 2);
      return { prompt:'Under tension, a material has axial strain ' + ea + ' and lateral strain ' + el + '. Calculate Poisson\'s ratio.',
        steps:['Given: ε_axial = ' + ea + ', ε_lateral = ' + el, 'ν = ε_lateral / ε_axial', 'ν = ' + el + ' / ' + ea, 'ν = ' + nu], answer:nu, unit:'' };
    },
    function () {
      var fos = pick([2, 2.5, 3, 3.5, 4]);
      var sw = randInt(40, 150);
      var sy = round(fos * sw, 1);
      return { prompt:'A component requires FoS = ' + fos + '. If the working stress is ' + sw + ' MPa, what minimum yield stress should the material have?',
        steps:['Given: FoS = ' + fos + ', σ_working = ' + sw + ' MPa', 'σ_y = FoS × σ_working', 'σ_y = ' + fos + ' × ' + sw, 'σ_y = ' + sy + ' MPa'], answer:sy, unit:'MPa' };
    }
  ];

  /* ────────────────────────────────────────────────────────────────
     5. DATA — QUIZ POOL (MCQ + Numeric mix)
     ──────────────────────────────────────────────────────────────── */
  var QUIZ_POOL = [
    /* MCQ questions */
    { type:'mcq', q:'Which region of the stress-strain curve follows Hooke\'s Law?',
      opts:['Proportional limit (linear region)', 'Strain hardening', 'Necking', 'Plastic region'], correct:0 },
    { type:'mcq', q:'What does the slope of the linear portion of the stress-strain curve represent?',
      opts:['Young\'s Modulus (E)', 'Yield Stress', 'Ultimate Tensile Stress', 'Poisson\'s Ratio'], correct:0 },
    { type:'mcq', q:'What happens to a ductile material after the UTS is reached?',
      opts:['Necking begins', 'It returns to original shape', 'Hooke\'s Law applies', 'Strain hardening starts'], correct:0 },
    { type:'mcq', q:'Which material fractures with little or no plastic deformation?',
      opts:['Brittle material', 'Ductile material', 'Elastic material', 'Resilient material'], correct:0 },
    { type:'mcq', q:'The 0.2% proof stress is used when a material:',
      opts:['Has no distinct yield point', 'Is perfectly elastic', 'Has a clear upper yield point', 'Fractures at the elastic limit'], correct:0 },
    { type:'mcq', q:'What does a higher Factor of Safety indicate?',
      opts:['Greater safety margin', 'Weaker material', 'Higher working stress', 'Material is at yield'], correct:0 },
    { type:'mcq', q:'Poisson\'s ratio relates:',
      opts:['Lateral strain to axial strain', 'Stress to strain', 'Force to area', 'Elongation to original length'], correct:0 },
    { type:'mcq', q:'Modulus of Resilience represents:',
      opts:['Energy absorbed in the elastic region', 'Total energy to fracture', 'Stress at yield point', 'Maximum strain before fracture'], correct:0 },
    { type:'mcq', q:'At the yield point, the material:',
      opts:['Begins permanent deformation', 'Fractures immediately', 'Returns to original shape', 'Reaches maximum stress'], correct:0 },
    { type:'mcq', q:'A material with high toughness has:',
      opts:['Both high strength and high ductility', 'Only high strength', 'Only high ductility', 'Low strain at fracture'], correct:0 },
    /* Numeric questions */
    { type:'num', q:'A rod (A = 150 mm²) is subjected to F = 45 kN. Calculate stress (MPa).',
      answer:300, unit:'MPa', steps:['σ = F / A = 45,000 / 150 = 300 MPa'] },
    { type:'num', q:'A 3 m bar elongates by 1.2 mm. Calculate the strain.',
      answer:0.0004, unit:'', steps:['ε = ΔL / L₀ = 1.2 / 3000 = 0.0004'] },
    { type:'num', q:'σ = 180 MPa, ε = 0.0009. Calculate E in GPa.',
      answer:200, unit:'GPa', steps:['E = σ / ε = 180 / 0.0009 = 200,000 MPa = 200 GPa'] },
    { type:'num', q:'σ_y = 300 MPa, working stress = 75 MPa. Calculate Factor of Safety.',
      answer:4, unit:'', steps:['FoS = σ_y / σ_working = 300 / 75 = 4'] },
    { type:'num', q:'Axial strain = 0.003, ν = 0.33. Calculate lateral strain magnitude.',
      answer:0.00099, unit:'', steps:['ε_lat = ν × ε_axial = 0.33 × 0.003 = 0.00099'] }
  ];

  /* ────────────────────────────────────────────────────────────────
     6. CANVAS SETUP & STATE
     ──────────────────────────────────────────────────────────────── */
  var canvas = document.getElementById('ss-canvas');
  var ctx    = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function initCanvas() {
    W = 900; H = 480;                 /* logical space — all layout constants use it */
    /* Size the backing store to the canvas's REAL display width, not to a fixed
       900 logical units. The CSS stretches this canvas to the card, so on a wide
       desktop 900*dpr was being presented across ~1044*dpr device pixels — a
       1.16x upscale. Scaling the context by displayW/W instead keeps the 900x480
       coordinate system exactly as the drawing code expects.
       canvasCoords() maps pointers with W/rect.width, which is independent of
       the backing store, so the hit-test needs no change. */
    var displayW = canvas.getBoundingClientRect().width;
    if (!(displayW > 40)) displayW = W;   /* never size off a pre-layout measurement */
    canvas.width  = Math.round(displayW * dpr);
    canvas.height = Math.round(displayW * (H / W) * dpr);
    canvas.style.width  = '';
    canvas.style.height = '';
    var scale = (displayW * dpr) / W;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }
  initCanvas();

  /* Layout constants for graph area */
  var OX = 90, OY = 430, GW = 760, GH = 370;

  /* State */
  var mode       = 'learn';
  var matToggle  = 'ductile';    /* ductile | brittle | both */
  var selRegion  = -1;           /* learn mode selected region */
  var selCat     = 'properties'; /* explore category */
  var selConcept = 0;            /* explore concept index */
  var dragT      = 0.35;         /* drag point parameter 0..1 */
  var isDragging = false;

  /* Practice state */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz state */
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* ────────────────────────────────────────────────────────────────
     7. DUCTILE CURVE — Parametric Bezier Path
     ──────────────────────────────────────────────────────────────── */
  /* Returns {x,y} for parameter t ∈ [0,1] along the ductile curve */
  var CURVE_PTS = [
    /* Each segment: [x0,y0, cx1,cy1, cx2,cy2, x1,y1] — cubic bezier */
    /* 1. Linear / proportional (0→0.18) */
    [0, 0,  0.06, 0.22,  0.12, 0.44,  0.08, 0.48],
    /* 2. Elastic deviation (0.18→0.24) */
    [0.08, 0.48,  0.085, 0.50,  0.09, 0.53,  0.095, 0.55],
    /* 3. Yield point (upper+lower) (0.24→0.34) */
    [0.095, 0.55,  0.10, 0.59,  0.105, 0.58,  0.12, 0.56],
    /* 4. Strain hardening (0.34→0.65) */
    [0.12, 0.56,  0.18, 0.48,  0.35, 0.35,  0.55, 0.82],
    /* 5. UTS peak (0.65→0.75) */
    [0.55, 0.82,  0.62, 0.90,  0.68, 0.92,  0.72, 0.90],
    /* 6. Necking (0.75→0.92) */
    [0.72, 0.90,  0.76, 0.88,  0.80, 0.82,  0.84, 0.72],
    /* 7. Fracture drop (0.92→1.0) */
    [0.84, 0.72,  0.86, 0.68,  0.88, 0.60,  0.90, 0.50]
  ];

  var SEGS = CURVE_PTS.length;
  var SEG_T = 1 / SEGS; /* each segment covers 1/7 of t range */

  function cubicBez(p, t) {
    var u = 1 - t;
    return u*u*u*p[0] + 3*u*u*t*p[1] + 3*u*t*t*p[2] + t*t*t*p[3];
  }

  function curveAt(t) {
    if (t <= 0) return { x: CURVE_PTS[0][0], y: CURVE_PTS[0][1] };
    if (t >= 1) {
      var last = CURVE_PTS[SEGS - 1];
      return { x: last[6], y: last[7] };
    }
    var seg = Math.min(Math.floor(t * SEGS), SEGS - 1);
    var lt = (t - seg * SEG_T) / SEG_T;
    var s = CURVE_PTS[seg];
    return {
      x: cubicBez([s[0], s[2], s[4], s[6]], lt),
      y: cubicBez([s[1], s[3], s[5], s[7]], lt)
    };
  }

  /* Map normalised curve coords to canvas pixels */
  function toCanvas(nx, ny) {
    return { x: OX + nx * GW, y: OY - ny * GH };
  }

  /* ────────────────────────────────────────────────────────────────
     8. BRITTLE CURVE — simple linear to fracture
     ──────────────────────────────────────────────────────────────── */
  function brittleCurveAt(t) {
    /* Steep linear rise to 70% stress then snap at ~20% strain */
    if (t <= 0.85) {
      return { x: t * 0.22, y: t * 0.78 };
    }
    /* Abrupt fracture drop */
    var dt = (t - 0.85) / 0.15;
    return { x: 0.22 + dt * 0.02, y: 0.78 * (1 - dt * 0.9) };
  }

  /* ────────────────────────────────────────────────────────────────
     9. DRAWING HELPERS
     ──────────────────────────────────────────────────────────────── */
  function clear() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);
  }

  function drawAxes() {
    ctx.strokeStyle = '#3a4468';
    ctx.lineWidth = 2;
    /* X axis */
    ctx.beginPath();
    ctx.moveTo(OX, OY);
    ctx.lineTo(OX + GW + 20, OY);
    ctx.stroke();
    /* Y axis */
    ctx.beginPath();
    ctx.moveTo(OX, OY);
    ctx.lineTo(OX, OY - GH - 20);
    ctx.stroke();
    /* Arrowheads */
    ctx.fillStyle = '#3a4468';
    ctx.beginPath();
    ctx.moveTo(OX + GW + 20, OY);
    ctx.lineTo(OX + GW + 10, OY - 5);
    ctx.lineTo(OX + GW + 10, OY + 5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(OX, OY - GH - 20);
    ctx.lineTo(OX - 5, OY - GH - 10);
    ctx.lineTo(OX + 5, OY - GH - 10);
    ctx.fill();
    /* Labels */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Strain (ε)', OX + GW / 2, OY + 36);
    ctx.save();
    ctx.translate(OX - 50, OY - GH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Stress (σ)', 0, 0);
    ctx.restore();
  }

  function drawGridLines() {
    ctx.strokeStyle = 'rgba(58,68,104,0.25)';
    ctx.lineWidth = 0.5;
    for (var i = 1; i <= 5; i++) {
      var y = OY - (GH * i / 5);
      ctx.beginPath(); ctx.moveTo(OX, y); ctx.lineTo(OX + GW, y); ctx.stroke();
      var x = OX + (GW * i / 5);
      ctx.beginPath(); ctx.moveTo(x, OY); ctx.lineTo(x, OY - GH); ctx.stroke();
    }
  }

  function drawFullCurve(type, alpha) {
    var oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (type === 'ductile') {
      ctx.strokeStyle = '#7c4dff';
      ctx.beginPath();
      var steps = 200;
      for (var i = 0; i <= steps; i++) {
        var t = i / steps;
        var p = curveAt(t);
        var c = toCanvas(p.x, p.y);
        if (i === 0) ctx.moveTo(c.x, c.y); else ctx.lineTo(c.x, c.y);
      }
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#ff5252';
      ctx.setLineDash([8, 5]);
      ctx.beginPath();
      var bSteps = 150;
      for (var j = 0; j <= bSteps; j++) {
        var bt = j / bSteps;
        var bp = brittleCurveAt(bt);
        var bc = toCanvas(bp.x, bp.y);
        if (j === 0) ctx.moveTo(bc.x, bc.y); else ctx.lineTo(bc.x, bc.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = oldAlpha;
  }

  function drawKeyPoints() {
    /* Yield point */
    var yp = curveAt(0.28);
    var yc = toCanvas(yp.x, yp.y);
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath(); ctx.arc(yc.x, yc.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'left';
    ctx.fillText('σᵧ (Yield)', yc.x + 10, yc.y - 8);

    /* UTS */
    var up = curveAt(0.70);
    var uc = toCanvas(up.x, up.y);
    ctx.fillStyle = '#f44336';
    ctx.beginPath(); ctx.arc(uc.x, uc.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f44336';
    ctx.textAlign = 'left';
    ctx.fillText('σᵤ (UTS)', uc.x + 10, uc.y - 8);

    /* Fracture */
    var fp = curveAt(1.0);
    var fc = toCanvas(fp.x, fp.y);
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(fc.x - 6, fc.y - 6); ctx.lineTo(fc.x + 6, fc.y + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fc.x + 6, fc.y - 6); ctx.lineTo(fc.x - 6, fc.y + 6); ctx.stroke();
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5252';
    ctx.textAlign = 'left';
    ctx.fillText('Fracture', fc.x + 10, fc.y + 4);

    /* Brittle fracture if shown */
    if (matToggle === 'brittle' || matToggle === 'both') {
      var bfp = brittleCurveAt(1.0);
      var bfc = toCanvas(bfp.x, bfp.y);
      ctx.strokeStyle = '#ff5252';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(bfc.x - 5, bfc.y - 5); ctx.lineTo(bfc.x + 5, bfc.y + 5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bfc.x + 5, bfc.y - 5); ctx.lineTo(bfc.x - 5, bfc.y + 5); ctx.stroke();
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ff5252';
      ctx.fillText('Brittle fracture', bfc.x + 10, bfc.y + 4);
    }
  }

  function drawHookeSlope() {
    /* Dashed line along linear region extended */
    var p0 = curveAt(0);
    var p1 = curveAt(0.14);
    var c0 = toCanvas(p0.x, p0.y);
    var c1 = toCanvas(p1.x * 1.6, p1.y * 1.6);
    ctx.strokeStyle = 'rgba(124,77,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(c0.x, c0.y);
    ctx.lineTo(c1.x, c1.y);
    ctx.stroke();
    ctx.setLineDash([]);
    /* E label */
    var mid = toCanvas(p1.x * 0.6, p1.y * 0.6);
    ctx.font = '800 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7c4dff';
    ctx.textAlign = 'right';
    ctx.fillText('E = σ/ε', mid.x - 8, mid.y + 4);
  }

  /* ────────────────────────────────────────────────────────────────
     10. REGION HIGHLIGHTING (Learn mode)
     ──────────────────────────────────────────────────────────────── */
  function drawRegionHighlight(ridx) {
    if (ridx < 0 || ridx >= REGIONS.length) return;
    var r = REGIONS[ridx];
    ctx.fillStyle = r.color + '55';
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2.5;

    /* Draw shaded area under curve for this region */
    ctx.beginPath();
    var steps = 60;
    var first = true;
    for (var i = 0; i <= steps; i++) {
      var t = r.t1 + (r.t2 - r.t1) * i / steps;
      var p = curveAt(t);
      var c = toCanvas(p.x, p.y);
      if (first) { ctx.moveTo(c.x, c.y); first = false; }
      else ctx.lineTo(c.x, c.y);
    }
    /* Close to baseline */
    var pEnd = curveAt(r.t2);
    var pStart = curveAt(r.t1);
    ctx.lineTo(toCanvas(pEnd.x, 0).x, OY);
    ctx.lineTo(toCanvas(pStart.x, 0).x, OY);
    ctx.closePath();
    ctx.fill();

    /* Redraw curve segment with full opacity */
    ctx.beginPath();
    first = true;
    for (var j = 0; j <= steps; j++) {
      var t2 = r.t1 + (r.t2 - r.t1) * j / steps;
      var p2 = curveAt(t2);
      var c2 = toCanvas(p2.x, p2.y);
      if (first) { ctx.moveTo(c2.x, c2.y); first = false; }
      else ctx.lineTo(c2.x, c2.y);
    }
    ctx.stroke();
  }

  /* ────────────────────────────────────────────────────────────────
     11. DRAGGABLE POINT ALONG CURVE (Learn mode)
     ──────────────────────────────────────────────────────────────── */
  function drawDragPoint() {
    var p = curveAt(dragT);
    var c = toCanvas(p.x, p.y);

    /* Crosshair lines */
    ctx.strokeStyle = 'rgba(124,77,255,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x, OY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(OX, c.y); ctx.stroke();
    ctx.setLineDash([]);

    /* Dot */
    ctx.fillStyle = '#b388ff';
    ctx.beginPath(); ctx.arc(c.x, c.y, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(c.x, c.y, 3, 0, Math.PI * 2); ctx.fill();

    /* Tooltip */
    var sVal = round(p.y * 500, 1);
    var eVal = round(p.x * 0.35, 5);
    var txt = 'σ = ' + sVal + ' MPa   ε = ' + eVal;
    ctx.font = '700 12px "Courier New", monospace';
    var tw = ctx.measureText(txt).width;
    var tx = c.x - tw / 2;
    var ty = c.y - 22;
    if (ty < 30) ty = c.y + 30;
    if (tx < OX) tx = OX + 4;
    if (tx + tw > OX + GW) tx = OX + GW - tw - 4;
    ctx.fillStyle = 'rgba(13,17,23,0.88)';
    ctx.beginPath();
    ctx.roundRect(tx - 8, ty - 14, tw + 16, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#b388ff';
    ctx.textAlign = 'left';
    ctx.fillText(txt, tx, ty);
  }

  /* ────────────────────────────────────────────────────────────────
     12. CONCEPT MINI-DIAGRAMS (Explore mode)
     ──────────────────────────────────────────────────────────────── */
  function drawConceptDiagram(id) {
    var cx = W / 2, cy = H / 2 - 20;

    switch (id) {
      case 'stress':
        drawBarWithForce(cx, cy, 'σ = F / A');
        break;
      case 'strain':
        drawStrainBar(cx, cy);
        break;
      case 'youngs':
        drawMiniCurveWithSlope(cx, cy, 'E = σ / ε');
        break;
      case 'poisson':
        drawPoissonBar(cx, cy);
        break;
      case 'proportional': case 'elastic':
        drawMiniCurveRegion(cx, cy, 0, 0.24, 'Elastic Region');
        break;
      case 'yield':
        drawMiniCurveRegion(cx, cy, 0.24, 0.34, 'Yield Point');
        break;
      case 'uts':
        drawMiniCurveRegion(cx, cy, 0.60, 0.80, 'UTS Peak');
        break;
      case 'proof':
        drawProofStress(cx, cy);
        break;
      case 'necking':
        drawNeckingBar(cx, cy);
        break;
      case 'fos':
        drawFoSDiagram(cx, cy);
        break;
      case 'resilience':
        drawResilienceDiagram(cx, cy);
        break;
      case 'toughness':
        drawToughnessDiagram(cx, cy);
        break;
      case 'ductile':
        drawMaterialComparison(cx, cy, 'ductile');
        break;
      case 'brittle':
        drawMaterialComparison(cx, cy, 'brittle');
        break;
      default:
        drawMiniStressStrain(cx, cy);
    }
  }

  /* Mini bar with force arrows for stress concept */
  function drawBarWithForce(cx, cy, label) {
    var bw = 260, bh = 60;
    /* Bar */
    ctx.fillStyle = 'rgba(124,77,255,0.38)';
    ctx.strokeStyle = '#7c4dff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - bw/2, cy - bh/2, bw, bh, 6);
    ctx.fill(); ctx.stroke();

    /* Cross-section circle */
    ctx.strokeStyle = 'rgba(124,77,255,0.5)';
    ctx.setLineDash([4,3]);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 20, bh/2 - 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#b388ff';
    ctx.textAlign = 'center';
    ctx.fillText('A', cx, cy + 4);

    /* Force arrows */
    drawArrow(cx - bw/2 - 60, cy, cx - bw/2 - 4, cy, '#3ddc84', 3);
    drawArrow(cx + bw/2 + 60, cy, cx + bw/2 + 4, cy, '#3ddc84', 3);
    ctx.font = '800 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('F', cx - bw/2 - 70, cy + 5);
    ctx.fillText('F', cx + bw/2 + 70, cy + 5);

    /* Formula */
    ctx.font = '800 20px "Courier New", monospace';
    ctx.fillStyle = '#7c4dff';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + bh/2 + 50);
  }

  function drawArrow(x1, y1, x2, y2, color, w) {
    var angle = Math.atan2(y2 - y1, x2 - x1);
    var len = Math.sqrt((x2-x1)*(x2-x1) + (y2-y1)*(y2-y1));
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    /* Arrowhead */
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 10 * Math.cos(angle - 0.35), y2 - 10 * Math.sin(angle - 0.35));
    ctx.lineTo(x2 - 10 * Math.cos(angle + 0.35), y2 - 10 * Math.sin(angle + 0.35));
    ctx.closePath();
    ctx.fill();
  }

  function drawStrainBar(cx, cy) {
    var bw = 200, bh = 50;
    /* Original bar */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 2;
    ctx.setLineDash([5,4]);
    ctx.beginPath();
    ctx.roundRect(cx - bw/2, cy - bh/2 - 35, bw, bh, 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('Original (L₀)', cx, cy - 35 + bh/2 + 4);

    /* Stretched bar */
    var ext = 50;
    ctx.fillStyle = 'rgba(124,77,255,0.38)';
    ctx.strokeStyle = '#7c4dff';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect(cx - bw/2, cy + 10 - bh/2, bw + ext, bh, 4);
    ctx.fill(); ctx.stroke();

    /* ΔL dimension */
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + bw/2, cy + 10 + bh/2 + 8);
    ctx.lineTo(cx + bw/2 + ext, cy + 10 + bh/2 + 8);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + bw/2, cy + 10 + bh/2 + 3); ctx.lineTo(cx + bw/2, cy + 10 + bh/2 + 13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + bw/2 + ext, cy + 10 + bh/2 + 3); ctx.lineTo(cx + bw/2 + ext, cy + 10 + bh/2 + 13); ctx.stroke();
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84';
    ctx.textAlign = 'center';
    ctx.fillText('ΔL', cx + bw/2 + ext/2, cy + 10 + bh/2 + 26);

    /* Formula */
    ctx.font = '800 20px "Courier New", monospace';
    ctx.fillStyle = '#7c4dff';
    ctx.fillText('ε = ΔL / L₀', cx, cy + bh + 65);
  }

  function drawPoissonBar(cx, cy) {
    var bw = 180, bh = 60;
    /* Original outline */
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath();
    ctx.rect(cx - bw/2, cy - bh/2, bw, bh);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Deformed (stretched longer, thinner) */
    var ext = 40, contract = 8;
    ctx.fillStyle = 'rgba(124,77,255,0.35)';
    ctx.strokeStyle = '#7c4dff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(cx - bw/2 - ext/2, cy - bh/2 + contract, bw + ext, bh - contract*2);
    ctx.fill(); ctx.stroke();

    /* Arrows showing axial stretch */
    drawArrow(cx + bw/2 + ext/2 + 5, cy, cx + bw/2 + ext/2 + 35, cy, '#3ddc84', 2);
    drawArrow(cx - bw/2 - ext/2 - 5, cy, cx - bw/2 - ext/2 - 35, cy, '#3ddc84', 2);

    /* Arrows showing lateral contraction */
    drawArrow(cx, cy - bh/2 + contract - 5, cx, cy - bh/2 + contract - 25, '#ff5252', 2);
    drawArrow(cx, cy + bh/2 - contract + 5, cx, cy + bh/2 - contract + 25, '#ff5252', 2);
    /* Actually contraction arrows point inward */
    drawArrow(cx, cy - bh/2 - 15, cx, cy - bh/2 + contract + 2, '#ff5252', 2);
    drawArrow(cx, cy + bh/2 + 15, cx, cy + bh/2 - contract - 2, '#ff5252', 2);

    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('ε_axial', cx + bw/2 + ext/2 + 20, cy - 15);
    ctx.fillStyle = '#ff5252';
    ctx.fillText('ε_lateral', cx + 35, cy - bh/2 - 20);

    ctx.font = '800 18px "Courier New", monospace';
    ctx.fillStyle = '#7c4dff';
    ctx.fillText('ν = −ε_lat / ε_axial', cx, cy + bh/2 + 55);
  }

  function drawMiniCurveWithSlope(cx, cy, label) {
    /* Small stress-strain curve with slope highlighted */
    var ox = cx - 150, oy = cy + 90, gw = 300, gh = 200;
    /* Axes */
    ctx.strokeStyle = '#3a4468';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    /* Curve */
    ctx.strokeStyle = 'rgba(124,77,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      var px = ox + p.x * gw / 0.95;
      var py = oy - p.y * gh / 0.95;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    /* Linear slope highlighted */
    ctx.strokeStyle = '#7c4dff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (var j = 0; j <= 30; j++) {
      var t2 = j / 100 * 0.18;
      var p2 = curveAt(t2);
      var px2 = ox + p2.x * gw / 0.95;
      var py2 = oy - p2.y * gh / 0.95;
      if (j === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
    }
    ctx.stroke();
    /* Label */
    ctx.font = '800 20px "Courier New", monospace';
    ctx.fillStyle = '#7c4dff';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, oy + 40);
  }

  function drawMiniCurveRegion(cx, cy, t1, t2, label) {
    var ox = cx - 150, oy = cy + 100, gw = 300, gh = 210;
    /* Axes */
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    /* Full curve faded */
    ctx.strokeStyle = 'rgba(124,77,255,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      var px = ox + p.x * gw / 0.95;
      var py = oy - p.y * gh / 0.95;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    /* Highlight region */
    ctx.fillStyle = 'rgba(124,77,255,0.38)';
    ctx.beginPath();
    var first = true;
    for (var j = 0; j <= 60; j++) {
      var tr = t1 + (t2 - t1) * j / 60;
      var pr = curveAt(tr);
      var pxr = ox + pr.x * gw / 0.95;
      var pyr = oy - pr.y * gh / 0.95;
      if (first) { ctx.moveTo(pxr, pyr); first = false; }
      else ctx.lineTo(pxr, pyr);
    }
    var pe = curveAt(t2), ps = curveAt(t1);
    ctx.lineTo(ox + pe.x * gw / 0.95, oy);
    ctx.lineTo(ox + ps.x * gw / 0.95, oy);
    ctx.closePath(); ctx.fill();
    /* Region curve bold */
    ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 3.5;
    ctx.beginPath();
    first = true;
    for (var k = 0; k <= 60; k++) {
      var tr2 = t1 + (t2 - t1) * k / 60;
      var pr2 = curveAt(tr2);
      var pxr2 = ox + pr2.x * gw / 0.95;
      var pyr2 = oy - pr2.y * gh / 0.95;
      if (first) { ctx.moveTo(pxr2, pyr2); first = false; }
      else ctx.lineTo(pxr2, pyr2);
    }
    ctx.stroke();
    /* Label */
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7c4dff'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, oy + 35);
  }

  function drawProofStress(cx, cy) {
    var ox = cx - 150, oy = cy + 100, gw = 300, gh = 210;
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    /* Curve (aluminium-like, no distinct yield) */
    ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var x = t * 0.8;
      var y = 0.8 * (1 - Math.exp(-6 * t));
      var px = ox + x * gw / 0.95;
      var py = oy - y * gh / 0.95;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    /* 0.2% offset line */
    var offX = 0.002 / 0.35 * 0.8; /* normalised offset */
    offX = 0.06; /* visual offset for diagram */
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1.5; ctx.setLineDash([5,3]);
    /* Get slope from initial linear part */
    ctx.beginPath();
    ctx.moveTo(ox + offX * gw / 0.95, oy);
    ctx.lineTo(ox + (offX + 0.15) * gw / 0.95, oy - 0.55 * gh / 0.95);
    ctx.stroke();
    ctx.setLineDash([]);
    /* 0.2% label */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    ctx.fillText('0.2%', ox + offX * gw / 0.95, oy + 16);
    /* σ₀.₂ label at intersection */
    ctx.fillStyle = '#3ddc84';
    ctx.beginPath();
    ctx.arc(ox + (offX + 0.11) * gw / 0.95, oy - 0.42 * gh / 0.95, 4, 0, Math.PI*2);
    ctx.fill();
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillText('σ₀.₂', ox + (offX + 0.11) * gw / 0.95 + 30, oy - 0.42 * gh / 0.95 + 4);
    /* Title */
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7c4dff'; ctx.textAlign = 'center';
    ctx.fillText('0.2% Proof Stress Method', cx, oy + 35);
  }

  function drawNeckingBar(cx, cy) {
    /* Bar with neck */
    ctx.fillStyle = 'rgba(124,77,255,0.38)';
    ctx.strokeStyle = '#7c4dff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 150, cy - 30);
    ctx.lineTo(cx - 30, cy - 30);
    ctx.quadraticCurveTo(cx, cy - 12, cx + 30, cy - 30);
    ctx.lineTo(cx + 150, cy - 30);
    ctx.lineTo(cx + 150, cy + 30);
    ctx.lineTo(cx + 30, cy + 30);
    ctx.quadraticCurveTo(cx, cy + 12, cx - 30, cy + 30);
    ctx.lineTo(cx - 150, cy + 30);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    /* Force arrows */
    drawArrow(cx - 220, cy, cx - 155, cy, '#3ddc84', 2.5);
    drawArrow(cx + 220, cy, cx + 155, cy, '#3ddc84', 2.5);
    /* Neck label */
    ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 1.5;
    ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(cx, cy - 45); ctx.lineTo(cx, cy - 12); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ff5252'; ctx.textAlign = 'center';
    ctx.fillText('Neck', cx, cy - 52);
    /* Title */
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#7c4dff';
    ctx.fillText('Necking — Localized Thinning', cx, cy + 70);
  }

  function drawFoSDiagram(cx, cy) {
    var ox = cx - 140, oy = cy + 100, gw = 280, gh = 200;
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    /* Curve */
    ctx.strokeStyle = 'rgba(124,77,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      ctx.lineTo(ox + p.x * gw / 0.95, oy - p.y * gh / 0.95);
    }
    ctx.stroke();
    /* σ_y line */
    var yp = curveAt(0.28);
    var yy = oy - yp.y * gh / 0.95;
    ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 1.5; ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.moveTo(ox, yy); ctx.lineTo(ox + gw, yy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'left';
    ctx.fillText('σᵧ (Yield)', ox + gw + 5, yy + 4);
    /* σ_working line */
    var ww = yy + (oy - yy) * 0.55;
    ctx.strokeStyle = '#ff9800'; ctx.lineWidth = 1.5; ctx.setLineDash([5,3]);
    ctx.beginPath(); ctx.moveTo(ox, ww); ctx.lineTo(ox + gw, ww); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff9800';
    ctx.fillText('σ_working', ox + gw + 5, ww + 4);
    /* FoS brace */
    var midX = ox + gw * 0.7;
    ctx.strokeStyle = '#f5c842'; ctx.lineWidth = 2; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(midX, yy); ctx.lineTo(midX, ww); ctx.stroke();
    drawArrow(midX, ww - 3, midX, yy + 3, '#f5c842', 1.5);
    drawArrow(midX, yy + 3, midX, ww - 3, '#f5c842', 1.5);
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#f5c842'; ctx.textAlign = 'left';
    ctx.fillText('FoS', midX + 8, (yy + ww) / 2 + 4);
    /* Formula */
    ctx.font = '800 18px "Courier New", monospace';
    ctx.fillStyle = '#7c4dff'; ctx.textAlign = 'center';
    ctx.fillText('FoS = σᵧ / σ_working', cx, oy + 35);
  }

  function drawResilienceDiagram(cx, cy) {
    var ox = cx - 140, oy = cy + 100, gw = 280, gh = 200;
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    /* Full curve faded */
    ctx.strokeStyle = 'rgba(124,77,255,0.25)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      ctx.lineTo(ox + p.x * gw / 0.95, oy - p.y * gh / 0.95);
    }
    ctx.stroke();
    /* Shaded triangle under elastic region */
    ctx.fillStyle = 'rgba(61,220,132,0.45)';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    for (var j = 0; j <= 30; j++) {
      var t2 = j / 30 * 0.28;
      var p2 = curveAt(t2);
      ctx.lineTo(ox + p2.x * gw / 0.95, oy - p2.y * gh / 0.95);
    }
    var pe = curveAt(0.28);
    ctx.lineTo(ox + pe.x * gw / 0.95, oy);
    ctx.closePath(); ctx.fill();
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'center';
    var pMid = curveAt(0.14);
    ctx.fillText('U_r', ox + pMid.x * gw / 0.95, oy - pMid.y * gh / 0.95 * 0.3 + 15);
    ctx.font = '800 16px "Courier New", monospace';
    ctx.fillStyle = '#7c4dff';
    ctx.fillText('U_r = ½ × σᵧ × εᵧ', cx, oy + 35);
  }

  function drawToughnessDiagram(cx, cy) {
    var ox = cx - 140, oy = cy + 100, gw = 280, gh = 200;
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    /* Shaded area under full curve */
    ctx.fillStyle = 'rgba(124,77,255,0.38)';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      ctx.lineTo(ox + p.x * gw / 0.95, oy - p.y * gh / 0.95);
    }
    var pf = curveAt(1);
    ctx.lineTo(ox + pf.x * gw / 0.95, oy);
    ctx.closePath(); ctx.fill();
    /* Curve */
    ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var j = 0; j <= 100; j++) {
      var t2 = j / 100;
      var p2 = curveAt(t2);
      var px = ox + p2.x * gw / 0.95;
      var py = oy - p2.y * gh / 0.95;
      if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.font = '800 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#b388ff'; ctx.textAlign = 'center';
    ctx.fillText('U_t (Total Area)', cx, oy - gh * 0.2);
    ctx.font = '800 16px "Courier New", monospace';
    ctx.fillStyle = '#7c4dff';
    ctx.fillText('Toughness = ∫ σ dε', cx, oy + 35);
  }

  function drawMaterialComparison(cx, cy, highlight) {
    var ox = cx - 150, oy = cy + 100, gw = 300, gh = 210;
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('Strain (ε)', ox + gw/2, oy + 20);
    ctx.save(); ctx.translate(ox - 20, oy - gh/2); ctx.rotate(-Math.PI/2);
    ctx.fillText('Stress (σ)', 0, 0); ctx.restore();
    /* Ductile curve */
    var dAlpha = highlight === 'ductile' ? 1 : 0.3;
    ctx.globalAlpha = dAlpha;
    ctx.strokeStyle = '#7c4dff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      var px = ox + p.x * gw / 0.95;
      var py = oy - p.y * gh / 0.95;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    /* Brittle curve */
    var bAlpha = highlight === 'brittle' ? 1 : 0.3;
    ctx.globalAlpha = bAlpha;
    ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 2.5;
    ctx.setLineDash([6,4]);
    ctx.beginPath();
    for (var j = 0; j <= 100; j++) {
      var bt = j / 100;
      var bp = brittleCurveAt(bt);
      var bpx = ox + bp.x * gw / 0.95;
      var bpy = oy - bp.y * gh / 0.95;
      if (j === 0) ctx.moveTo(bpx, bpy); else ctx.lineTo(bpx, bpy);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    /* Labels */
    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#7c4dff';
    ctx.fillText('— Ductile', ox + gw - 100, oy - gh + 18);
    ctx.fillStyle = '#ff5252';
    ctx.fillText('--- Brittle', ox + gw - 100, oy - gh + 35);
    /* Title */
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = highlight === 'ductile' ? '#7c4dff' : '#ff5252';
    ctx.textAlign = 'center';
    ctx.fillText(highlight === 'ductile' ? 'Ductile — Large Plastic Region' : 'Brittle — Sudden Fracture', cx, oy + 40);
  }

  function drawMiniStressStrain(cx, cy) {
    drawMiniCurveWithSlope(cx, cy, '');
  }

  /* ────────────────────────────────────────────────────────────────
     13. MAIN RENDER FUNCTION
     ──────────────────────────────────────────────────────────────── */
  function render() {
    clear();

    if (mode === 'learn') {
      drawLearnMode();
    } else if (mode === 'explore') {
      drawConceptDiagram(CONCEPTS[selConcept].id);
    } else if (mode === 'practice') {
      drawPracticeMode();
    } else if (mode === 'quiz') {
      drawQuizMode();
    }
  }

  function drawLearnMode() {
    drawGridLines();
    drawAxes();
    drawHookeSlope();

    /* Draw curves based on material toggle */
    if (matToggle === 'ductile') {
      drawFullCurve('ductile', 1);
    } else if (matToggle === 'brittle') {
      drawFullCurve('brittle', 1);
    } else {
      drawFullCurve('ductile', 1);
      drawFullCurve('brittle', 0.7);
    }

    /* Region highlight */
    if (selRegion >= 0 && selRegion < 7 && matToggle !== 'brittle') {
      drawRegionHighlight(selRegion);
    }

    /* Key points */
    if (matToggle !== 'brittle') {
      drawKeyPoints();
    } else {
      /* Brittle key points */
      var bfp = brittleCurveAt(1.0);
      var bfc = toCanvas(bfp.x, bfp.y);
      ctx.strokeStyle = '#ff5252'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bfc.x-6,bfc.y-6); ctx.lineTo(bfc.x+6,bfc.y+6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bfc.x+6,bfc.y-6); ctx.lineTo(bfc.x-6,bfc.y+6); ctx.stroke();
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ff5252'; ctx.textAlign = 'left';
      ctx.fillText('Fracture', bfc.x + 10, bfc.y + 4);
    }

    if (matToggle === 'both') {
      drawKeyPoints();
    }

    /* Drag point on ductile curve */
    if (matToggle !== 'brittle') {
      drawDragPoint();
    }

    /* Legend */
    if (matToggle === 'both') {
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#7c4dff';
      ctx.fillText('— Ductile', OX + GW - 140, OY - GH + 20);
      ctx.fillStyle = '#ff5252';
      ctx.fillText('--- Brittle', OX + GW - 140, OY - GH + 38);
    }

    /* Title */
    ctx.font = '700 15px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Engineering Stress-Strain Diagram', W / 2, 25);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Click a region below or drag the point along the curve', W / 2, 44);
  }

  function drawPracticeMode() {
    if (!pProblem) return;
    /* Draw a mini stress-strain curve for context */
    var ox = W / 2 - 120, oy = 250, gw = 240, gh = 170;
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    ctx.strokeStyle = 'rgba(124,77,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      ctx.lineTo(ox + p.x * gw / 0.95, oy - p.y * gh / 0.95);
    }
    ctx.stroke();
    /* Title */
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Practice — Solve the Calculation', W / 2, 35);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.fillText('Enter your answer below within ±1% tolerance', W / 2, 55);
    /* σ ε labels */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99'; ctx.textAlign = 'center';
    ctx.fillText('σ', ox - 15, oy - gh/2);
    ctx.fillText('ε', ox + gw/2, oy + 18);
  }

  function drawQuizMode() {
    if (quizQs.length === 0) return;
    var q = quizQs[quizIdx];
    /* Mini curve */
    var ox = W / 2 - 120, oy = 250, gw = 240, gh = 170;
    ctx.strokeStyle = '#3a4468'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + gw, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - gh); ctx.stroke();
    ctx.strokeStyle = 'rgba(124,77,255,0.35)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (var i = 0; i <= 100; i++) {
      var t = i / 100;
      var p = curveAt(t);
      ctx.lineTo(ox + p.x * gw / 0.95, oy - p.y * gh / 0.95);
    }
    ctx.stroke();
    /* Title */
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0'; ctx.textAlign = 'center';
    ctx.fillText('Quiz — Question ' + (quizIdx + 1) + ' of ' + quizQs.length, W / 2, 35);
  }

  /* ────────────────────────────────────────────────────────────────
     14. DOM REFERENCES & UI WIRING
     ──────────────────────────────────────────────────────────────── */
  var $modeTabs     = document.getElementById('mode-tabs');
  var $matTabs      = document.getElementById('mat-tabs');
  var $catRow       = document.getElementById('category-row');
  var $catTabs      = document.getElementById('cat-tabs');
  var $isGrid       = document.getElementById('is-grid');
  var $itemInfo     = document.getElementById('item-info');
  var $iiName       = document.getElementById('ii-name');
  var $iiCat        = document.getElementById('ii-cat');
  var $iiDesc       = document.getElementById('ii-desc');
  var $formulaBox   = document.getElementById('formula-box');
  var $fbFormula    = document.getElementById('fb-formula');
  var $fbUnit       = document.getElementById('fb-unit');
  var $exampleBox   = document.getElementById('example-box');
  var $learnInfo    = document.getElementById('learn-info');
  var $learnParts   = document.getElementById('learn-parts');
  var $itemSelector = document.getElementById('item-selector');
  var $matRow       = document.getElementById('mat-row');

  /* Practice DOM */
  var $pracPanel    = document.getElementById('practice-panel');
  var $ppPrompt     = document.getElementById('pp-prompt');
  var $ppInput      = document.getElementById('pp-input');
  var $ppUnit       = document.getElementById('pp-unit');
  var $pracFeedback = document.getElementById('p-feedback');
  var $pracSolution = document.getElementById('p-solution');
  var $pracBar      = document.getElementById('practice-bar');
  var $pScore       = document.getElementById('p-score');
  var $pTotal       = document.getElementById('p-total');
  var $btnPCheck    = document.getElementById('btn-p-check');
  var $btnPNext     = document.getElementById('btn-p-next');

  /* Quiz DOM */
  var $quizPanel    = document.getElementById('quiz-panel');
  var $qpPrompt     = document.getElementById('qp-prompt');
  var $quizAnswers  = document.getElementById('quiz-answers');
  var $quizBar      = document.getElementById('quiz-bar');
  var $quizQNum     = document.getElementById('quiz-q-num');
  var $quizQTotal   = document.getElementById('quiz-q-total');
  var $quizFeedback = document.getElementById('quiz-feedback');
  var $btnQuizNext  = document.getElementById('btn-quiz-next');
  var $quizResult   = document.getElementById('quiz-result');
  var $qrStars      = document.getElementById('qr-stars');
  var $qrScore      = document.getElementById('qr-score');
  var $qrVerdict    = document.getElementById('qr-verdict');
  var $qrRows       = document.getElementById('qr-rows');
  var $btnQuizRetry = document.getElementById('btn-quiz-retry');

  /* ────────────────────────────────────────────────────────────────
     15. MODE SWITCHING
     ──────────────────────────────────────────────────────────────── */
  function setMode(m) {
    mode = m;
    /* Update pills */
    Array.from($modeTabs.children).forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === m);
    });
    /* Toggle panel visibility */
    var isLearn = m === 'learn';
    var isExplore = m === 'explore';
    var isPractice = m === 'practice';
    var isQuiz = m === 'quiz';

    $learnInfo.style.display    = isLearn ? '' : 'none';
    $matRow.style.display       = isLearn ? '' : 'none';
    $catRow.style.display       = isExplore ? '' : 'none';
    $itemSelector.style.display = isExplore ? '' : 'none';
    $itemInfo.style.display     = isExplore ? '' : 'none';
    $pracPanel.style.display    = isPractice ? '' : 'none';
    $pracBar.style.display      = isPractice ? '' : 'none';
    $quizPanel.style.display    = isQuiz ? '' : 'none';
    $quizBar.style.display      = isQuiz ? '' : 'none';
    $quizResult.style.display   = 'none';

    if (isLearn) { selRegion = -1; buildLearnParts(); }
    if (isExplore) { buildConceptGrid(); selectConcept(selConcept); }
    if (isPractice) { newPractice(); }
    if (isQuiz) { startQuiz(); }
    render();
  }

  $modeTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.pill');
    if (!btn) return;
    setMode(btn.dataset.value);
  });

  /* Material toggle */
  $matTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.pill');
    if (!btn) return;
    matToggle = btn.dataset.value;
    Array.from($matTabs.children).forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === matToggle);
    });
    render();
  });

  /* ────────────────────────────────────────────────────────────────
     16. LEARN MODE — Parts list
     ──────────────────────────────────────────────────────────────── */
  function buildLearnParts() {
    $learnParts.innerHTML = '';
    LEARN_PARTS.forEach(function (part, i) {
      var div = document.createElement('div');
      div.className = 'learn-part' + (i === selRegion ? ' active' : '');
      div.innerHTML = '<span class="learn-dot" style="background:' + part.color + '"></span>' +
        '<div><div class="learn-part-name">' + part.name + '</div>' +
        '<div class="learn-part-desc">' + part.desc + '</div></div>';
      div.addEventListener('click', function () {
        if (i === 6) {
          /* Brittle behaviour */
          matToggle = 'both';
          Array.from($matTabs.children).forEach(function (b) {
            b.classList.toggle('active', b.dataset.value === 'both');
          });
          selRegion = -1;
        } else {
          if (matToggle === 'brittle') {
            matToggle = 'ductile';
            Array.from($matTabs.children).forEach(function (b) {
              b.classList.toggle('active', b.dataset.value === 'ductile');
            });
          }
          selRegion = i;
        }
        buildLearnParts();
        render();
      });
      $learnParts.appendChild(div);
    });
  }

  /* ────────────────────────────────────────────────────────────────
     17. EXPLORE MODE — Concept grid & info
     ──────────────────────────────────────────────────────────────── */
  function filteredConcepts() {
    return CONCEPTS.filter(function (c) { return c.cat === selCat; });
  }

  function buildConceptGrid() {
    $isGrid.innerHTML = '';
    var filtered = filteredConcepts();
    filtered.forEach(function (c) {
      var idx = CONCEPTS.indexOf(c);
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (idx === selConcept ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span>' +
        (c.symbol !== '—' ? '<span class="is-btn-sym">' + c.symbol + '</span>' : '');
      btn.addEventListener('click', function () { selectConcept(idx); });
      $isGrid.appendChild(btn);
    });
  }

  function selectConcept(idx) {
    selConcept = idx;
    var c = CONCEPTS[idx];
    $iiName.textContent = c.name;
    $iiCat.textContent = c.cat.charAt(0).toUpperCase() + c.cat.slice(1);
    $iiDesc.textContent = c.desc;
    /* Formula box */
    if (c.formula && c.formula !== '—') {
      $formulaBox.style.display = '';
      $fbFormula.textContent = c.formula;
      $fbUnit.textContent = c.unit && c.unit !== '—' ? 'Unit: ' + c.unit : '';
    } else {
      $formulaBox.style.display = 'none';
    }
    /* Example */
    if (c.example) {
      $exampleBox.style.display = '';
      var html = '<h4>Example Calculation</h4>';
      html += '<div class="ex-problem">' + c.example.problem + '</div>';
      c.example.steps.forEach(function (s) {
        html += '<div class="ex-step">' + s.replace(/=\s*([^\s,]+)\s*(MPa|GPa|N|mm²|J\/m³)?$/,
          '= <strong>$1 $2</strong>') + '</div>';
      });
      $exampleBox.innerHTML = html;
    } else {
      $exampleBox.style.display = 'none';
    }
    /* Update grid active state */
    Array.from($isGrid.children).forEach(function (b, i) {
      var filtered = filteredConcepts();
      b.classList.toggle('active', CONCEPTS.indexOf(filtered[i]) === idx);
    });
    render();
  }

  $catTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.pill');
    if (!btn) return;
    selCat = btn.dataset.value;
    Array.from($catTabs.children).forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === selCat);
    });
    /* Reset to first concept in category */
    var filtered = filteredConcepts();
    if (filtered.length > 0) selConcept = CONCEPTS.indexOf(filtered[0]);
    buildConceptGrid();
    selectConcept(selConcept);
  });

  /* ────────────────────────────────────────────────────────────────
     18. PRACTICE MODE — Numeric problems
     ──────────────────────────────────────────────────────────────── */
  function newPractice() {
    var gen = pick(PROBLEM_GEN);
    pProblem = gen();
    pAnswered = false;
    $ppPrompt.textContent = pProblem.prompt;
    $ppInput.value = '';
    $ppUnit.textContent = pProblem.unit || '';
    $pracFeedback.textContent = '';
    $pracFeedback.className = 'feedback';
    $pracSolution.style.display = 'none';
    $pracSolution.innerHTML = '';
    $btnPCheck.style.display = '';
    $btnPNext.style.display = 'none';
    $ppInput.disabled = false;
    $ppInput.focus();
    render();
  }

  function checkPractice() {
    if (pAnswered) return;
    var val = parseFloat($ppInput.value);
    if (isNaN(val)) {
      $pracFeedback.textContent = 'Please enter a number';
      $pracFeedback.className = 'feedback err';
      return;
    }
    pAnswered = true;
    pTotal++;
    var correct = pProblem.answer;
    var tol = Math.abs(correct) * 0.01;
    if (tol < 0.00001) tol = 0.00001;
    var ok = Math.abs(val - correct) <= tol;
    if (ok) {
      pScore++;
      $pracFeedback.textContent = '✓ Correct!';
      $pracFeedback.className = 'feedback ok';
    } else {
      $pracFeedback.textContent = '✗ Answer: ' + correct + (pProblem.unit ? ' ' + pProblem.unit : '');
      $pracFeedback.className = 'feedback err';
    }
    $pScore.textContent = pScore;
    $pTotal.textContent = pTotal;
    $ppInput.disabled = true;
    $btnPCheck.style.display = 'none';
    $btnPNext.style.display = '';
    /* Show solution */
    $pracSolution.style.display = '';
    var html = '<h4>Step-by-step Solution</h4>';
    pProblem.steps.forEach(function (s) {
      html += '<div class="sol-step">' + s.replace(/=\s*([^\s,]+)\s*(MPa|GPa|N|mm²|J\/m³)?$/,
        '= <strong>$1 $2</strong>') + '</div>';
    });
    $pracSolution.innerHTML = html;
  }

  $btnPCheck.addEventListener('click', checkPractice);
  $ppInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      if (pAnswered) newPractice();
      else checkPractice();
    }
  });
  $btnPNext.addEventListener('click', function () { newPractice(); });

  /* ────────────────────────────────────────────────────────────────
     19. QUIZ MODE — Mixed MCQ + Numeric
     ──────────────────────────────────────────────────────────────── */
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    shuffle(pool);
    quizQs = pool.slice(0, 5);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    $quizResult.style.display = 'none';
    $quizPanel.style.display = '';
    $quizBar.style.display = '';
    showQuizQuestion();
    render();
  }

  function showQuizQuestion() {
    var q = quizQs[quizIdx];
    quizAnswered = false;
    $quizQNum.textContent = quizIdx + 1;
    $quizQTotal.textContent = quizQs.length;
    $quizFeedback.textContent = '';
    $quizFeedback.className = 'quiz-feedback';
    $btnQuizNext.style.display = 'none';
    $qpPrompt.textContent = q.q;
    $quizAnswers.innerHTML = '';

    if (q.type === 'mcq') {
      /* Shuffle options but track correct */
      var opts = q.opts.map(function (o, i) { return { text: o, isCorrect: i === q.correct }; });
      shuffle(opts);
      opts.forEach(function (o) {
        var btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = o.text;
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          /* Record */
          q._userAnswer = o.text;
          q._wasCorrect = o.isCorrect;
          if (o.isCorrect) {
            quizScore++;
            btn.classList.add('correct');
            $quizFeedback.textContent = '✓ Correct!';
            $quizFeedback.className = 'quiz-feedback ok';
          } else {
            btn.classList.add('wrong');
            $quizFeedback.textContent = '✗ Incorrect';
            $quizFeedback.className = 'quiz-feedback err';
            /* Highlight correct */
            Array.from($quizAnswers.children).forEach(function (b) {
              var opt = opts.find(function (x) { return x.text === b.textContent; });
              if (opt && opt.isCorrect) b.classList.add('correct');
              b.classList.add('locked');
            });
          }
          Array.from($quizAnswers.children).forEach(function (b) { b.classList.add('locked'); });
          $btnQuizNext.style.display = '';
        });
        $quizAnswers.appendChild(btn);
      });
    } else {
      /* Numeric question */
      var row = document.createElement('div');
      row.className = 'quiz-input-row';
      var inp = document.createElement('input');
      inp.type = 'number'; inp.step = 'any';
      inp.className = 'qi-input';
      inp.placeholder = 'Your answer';
      var unit = document.createElement('span');
      unit.className = 'qi-unit';
      unit.textContent = q.unit || '';
      var btn2 = document.createElement('button');
      btn2.className = 'btn btn-primary';
      btn2.textContent = 'Submit';
      row.appendChild(inp);
      row.appendChild(unit);
      row.appendChild(btn2);
      $quizAnswers.appendChild(row);

      function submitNumeric() {
        if (quizAnswered) return;
        var val = parseFloat(inp.value);
        if (isNaN(val)) return;
        quizAnswered = true;
        var correct = q.answer;
        var tol = Math.abs(correct) * 0.01;
        if (tol < 0.00001) tol = 0.00001;
        var ok = Math.abs(val - correct) <= tol;
        q._userAnswer = val + (q.unit ? ' ' + q.unit : '');
        q._wasCorrect = ok;
        if (ok) {
          quizScore++;
          $quizFeedback.textContent = '✓ Correct!';
          $quizFeedback.className = 'quiz-feedback ok';
        } else {
          $quizFeedback.textContent = '✗ Answer: ' + correct + (q.unit ? ' ' + q.unit : '');
          $quizFeedback.className = 'quiz-feedback err';
        }
        inp.disabled = true;
        btn2.disabled = true;
        /* Show steps */
        if (q.steps) {
          var sol = document.createElement('div');
          sol.className = 'solution-panel';
          var sh = '<h4>Solution</h4>';
          q.steps.forEach(function (s) {
            sh += '<div class="sol-step">' + s + '</div>';
          });
          sol.innerHTML = sh;
          $quizAnswers.appendChild(sol);
        }
        $btnQuizNext.style.display = '';
      }

      btn2.addEventListener('click', submitNumeric);
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitNumeric(); });
      setTimeout(function () { inp.focus(); }, 50);
    }
    render();
  }

  $btnQuizNext.addEventListener('click', function () {
    quizIdx++;
    if (quizIdx >= quizQs.length) {
      showQuizResult();
    } else {
      showQuizQuestion();
      render();
    }
  });

  function showQuizResult() {
    $quizPanel.style.display = 'none';
    $quizBar.style.display = 'none';
    $quizResult.style.display = '';

    var total = quizQs.length;
    $qrScore.textContent = quizScore + ' / ' + total;
    $qrScore.className = 'qr-score ' + (quizScore === total ? 'perfect' : quizScore >= 3 ? 'good' : 'poor');

    var stars = '';
    for (var i = 0; i < 5; i++) {
      stars += i < quizScore ? '★' : '☆';
    }
    $qrStars.textContent = stars;

    var verdicts = ['Keep practising!', 'Getting there!', 'Not bad!', 'Good job!', 'Great work!', 'Perfect score!'];
    $qrVerdict.textContent = verdicts[Math.min(quizScore, 5)];

    /* Row details */
    $qrRows.innerHTML = '';
    quizQs.forEach(function (q, i) {
      var div = document.createElement('div');
      div.className = 'qr-row ' + (q._wasCorrect ? 'ok' : 'err');
      var short = q.q.length > 60 ? q.q.slice(0, 57) + '…' : q.q;
      div.innerHTML = '<span class="qr-qnum">Q' + (i + 1) + '</span>' +
        '<span class="qr-detail"><strong>' + short + '</strong></span>' +
        '<span class="qr-mark">' + (q._wasCorrect ? '✓' : '✗') + '</span>';
      $qrRows.appendChild(div);
    });
  }

  $btnQuizRetry.addEventListener('click', function () { startQuiz(); render(); });

  /* ────────────────────────────────────────────────────────────────
     20. CANVAS INTERACTION — Drag & Click
     ──────────────────────────────────────────────────────────────── */
  function canvasCoords(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    var clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function findClosestT(mx, my) {
    var bestT = 0, bestD = Infinity;
    for (var i = 0; i <= 200; i++) {
      var t = i / 200;
      var p = curveAt(t);
      var c = toCanvas(p.x, p.y);
      var d = (c.x - mx) * (c.x - mx) + (c.y - my) * (c.y - my);
      if (d < bestD) { bestD = d; bestT = t; }
    }
    return bestT;
  }

  canvas.addEventListener('mousedown', function (e) {
    if (mode !== 'learn' || matToggle === 'brittle') return;
    var coords = canvasCoords(e);
    var p = curveAt(dragT);
    var c = toCanvas(p.x, p.y);
    var dist = Math.sqrt((coords.x - c.x) * (coords.x - c.x) + (coords.y - c.y) * (coords.y - c.y));
    if (dist < 20) {
      isDragging = true;
      e.preventDefault();
    }
  });

  canvas.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    var coords = canvasCoords(e);
    dragT = findClosestT(coords.x, coords.y);
    dragT = Math.max(0, Math.min(1, dragT));
    render();
  });

  window.addEventListener('mouseup', function () { isDragging = false; });

  /* Touch events */
  canvas.addEventListener('touchstart', function (e) {
    if (mode !== 'learn' || matToggle === 'brittle') return;
    var coords = canvasCoords(e);
    var p = curveAt(dragT);
    var c = toCanvas(p.x, p.y);
    var dist = Math.sqrt((coords.x - c.x) * (coords.x - c.x) + (coords.y - c.y) * (coords.y - c.y));
    if (dist < 30) {
      isDragging = true;
      e.preventDefault();
    }
  }, { passive: false });

  canvas.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    e.preventDefault();
    var coords = canvasCoords(e);
    dragT = findClosestT(coords.x, coords.y);
    dragT = Math.max(0, Math.min(1, dragT));
    render();
  }, { passive: false });

  canvas.addEventListener('touchend', function () { isDragging = false; });

  /* ────────────────────────────────────────────────────────────────
     21. INIT
     ──────────────────────────────────────────────────────────────── */
  buildLearnParts();
  setMode('learn');

  /* Resize handler */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      initCanvas();
      render();
    }, 150);
  });

})();
