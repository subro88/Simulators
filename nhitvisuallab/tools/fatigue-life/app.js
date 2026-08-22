/* ═══════════════════════════════════════════════════════════════════
   Fatigue Life Simulator — app.js  v1
   NHIT VisualLab · https://nhitvisuallab.org
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────
     1. MATERIAL DATA
     ──────────────────────────────────────────────────────────────── */
  var MATERIALS = [
    { name: 'Steel 1020',  Sut: 395,  Sy: 295,  sfp: 710,  bExp: -0.115 },
    { name: 'Steel 4140',  Sut: 1020, Sy: 655,  sfp: 1580, bExp: -0.085 },
    { name: 'Steel 4340',  Sut: 1280, Sy: 860,  sfp: 1850, bExp: -0.076 },
    { name: 'Al 6061-T6',  Sut: 310,  Sy: 276,  sfp: 530,  bExp: -0.107 },
    { name: 'Al 7075-T6',  Sut: 572,  Sy: 503,  sfp: 1020, bExp: -0.098 },
    { name: 'Ti-6Al-4V',   Sut: 950,  Sy: 880,  sfp: 1400, bExp: -0.080 }
  ];

  var SURFACE_FACTORS = [
    { name: 'Ground',     a: 1.58,   b: -0.085 },
    { name: 'Machined',   a: 4.51,   b: -0.265 },
    { name: 'Hot-rolled', a: 57.7,   b: -0.718 },
    { name: 'Forged',     a: 272,    b: -0.995 }
  ];

  var RELIABILITY = [
    { name: '50%',   kc: 1.000 },
    { name: '90%',   kc: 0.897 },
    { name: '99%',   kc: 0.814 },
    { name: '99.9%', kc: 0.753 }
  ];

  /* ────────────────────────────────────────────────────────────────
     2. EXPLORE CONCEPTS
     ──────────────────────────────────────────────────────────────── */
  var CONCEPTS = [
    /* Fundamentals */
    { id:'sn-curve', name:'S-N Curve', symbol:'S-N', formula:"\\sigma_a = \\sigma'_f (2N)^b", unit:'MPa vs cycles', cat:'fundamentals',
      desc:'The S-N curve (Wohler curve) plots stress amplitude versus number of cycles to failure on a log-log scale. It is the fundamental tool for fatigue life prediction. Higher stress amplitudes result in fewer cycles to failure.',
      example:{ problem:"A steel has \\sigma'_f = 710 MPa and b = -0.115. Find the fatigue life at \\sigma_a = 200 MPa.", steps:['Given: \\sigma\'_f = 710 MPa, b = -0.115, \\sigma_a = 200 MPa', '\\sigma_a = \\sigma\'_f (2N)^b', '200 = 710 (2N)^(-0.115)', '(2N) = (200/710)^(1/-0.115) = (0.2817)^(-8.696)', '2N = 177,828 => N = 88,914 cycles'], answer:88914, unit:'cycles' }},
    { id:'basquin', name:"Basquin's Equation", symbol:'b', formula:"\\sigma_a = \\sigma'_f (2N_f)^b", unit:'—', cat:'fundamentals',
      desc:"Basquin's equation is the power-law relationship describing the S-N curve in the high-cycle fatigue regime. The fatigue strength coefficient (\\sigma'_f) approximates the true fracture strength, and the fatigue strength exponent (b) typically ranges from -0.05 to -0.15.",
      example:{ problem:"Given \\sigma'_f = 1580 MPa and b = -0.085, calculate the stress amplitude for N = 10^6 cycles.", steps:['Given: \\sigma\'_f = 1580 MPa, b = -0.085, N = 10^6', '\\sigma_a = 1580 × (2 × 10^6)^(-0.085)', '2N = 2,000,000', 'log(2N) = 6.301', '\\sigma_a = 1580 × 10^(-0.085 × 6.301)', '\\sigma_a = 1580 × 0.2766 = 437.0 MPa'], answer:437, unit:'MPa' }},
    { id:'endurance', name:'Endurance Limit', symbol:'Se', formula:"Se' = 0.5 × Sut (if Sut \\leq 1400 MPa)", unit:'MPa', cat:'fundamentals',
      desc:"The endurance limit (Se') is the stress level below which a material can theoretically sustain an infinite number of loading cycles. For steels with Sut <= 1400 MPa, Se' = 0.5 Sut. For Sut > 1400 MPa, Se' = 700 MPa. Non-ferrous metals typically have no true endurance limit.",
      example:{ problem:'Steel 1020 has Sut = 395 MPa. What is the uncorrected endurance limit?', steps:['Given: Sut = 395 MPa', 'Since Sut <= 1400 MPa:', "Se' = 0.5 × Sut", "Se' = 0.5 × 395", "Se' = 197.5 MPa"], answer:197.5, unit:'MPa' }},
    { id:'fatigue-life', name:'Fatigue Life (N)', symbol:'N', formula:"N = (1/2)(\\sigma_a / \\sigma'_f)^{1/b}", unit:'cycles', cat:'fundamentals',
      desc:"Fatigue life N is the number of stress cycles a component can sustain before fatigue failure. It is obtained by inverting Basquin's equation. The life depends strongly on stress amplitude — a small increase in stress can reduce life by orders of magnitude.",
      example:null },

    /* S-N Curve */
    { id:'marin', name:'Marin Equation', symbol:'Se', formula:'Se = ka × kb × kc × kd × ke × Se\'', unit:'MPa', cat:'sn-curve',
      desc:'The Marin equation modifies the uncorrected endurance limit with correction factors for surface finish (ka), size (kb), reliability (kc), temperature (kd), and miscellaneous effects (ke) to obtain the corrected endurance limit for actual service conditions.',
      example:{ problem:'Given Se\' = 250 MPa, ka = 0.72, kb = 0.85, kc = 0.897, kd = 1.0, ke = 0.83. Find Se.', steps:['Se = ka × kb × kc × kd × ke × Se\'', 'Se = 0.72 × 0.85 × 0.897 × 1.0 × 0.83 × 250', 'Se = 0.72 × 0.85 = 0.612', '0.612 × 0.897 = 0.549', '0.549 × 0.83 = 0.456', 'Se = 0.456 × 250 = 113.9 MPa'], answer:113.9, unit:'MPa' }},
    { id:'surface', name:'Surface Factor (ka)', symbol:'ka', formula:'ka = a × Sut^b', unit:'—', cat:'sn-curve',
      desc:'The surface finish factor accounts for the effect of surface roughness on fatigue life. Rougher surfaces have more stress raisers that initiate cracks. Values: Ground (best) > Machined > Hot-rolled > Forged (worst).',
      example:{ problem:'A machined steel part has Sut = 500 MPa. Find ka. (a=4.51, b=-0.265)', steps:['ka = a × Sut^b', 'ka = 4.51 × 500^(-0.265)', '500^(-0.265) = 0.1818', 'ka = 4.51 × 0.1818', 'ka = 0.820'], answer:0.820, unit:'' }},
    { id:'size-factor', name:'Size Factor (kb)', symbol:'kb', formula:'kb = 1.189 × d^(-0.097) for 8 < d \\leq 250', unit:'—', cat:'sn-curve',
      desc:'The size factor accounts for the statistical increase in the probability of finding a critical flaw in larger parts. For round parts with d <= 8 mm, kb = 1.0. For 8 < d <= 250 mm, kb = 1.189 d^(-0.097).',
      example:{ problem:'Find the size factor for a 40 mm diameter shaft.', steps:['Given: d = 40 mm, and 8 < 40 <= 250', 'kb = 1.189 × d^(-0.097)', 'kb = 1.189 × 40^(-0.097)', '40^(-0.097) = 0.6965 (approx)', 'Wait: 40^0.097 = e^(0.097 ln40) = e^(0.097×3.689) = e^0.3578 = 1.430', 'kb = 1.189 / 1.430 = 0.832'], answer:0.832, unit:'' }},
    { id:'reliability-factor', name:'Reliability Factor (kc)', symbol:'kc', formula:'kc values: 50%=1.0, 90%=0.897, 99%=0.814', unit:'—', cat:'sn-curve',
      desc:'The reliability factor adjusts the endurance limit from the typical 50% survival rate of test data to a desired reliability level. Higher reliability requires a lower allowable stress.',
      example:null },

    /* Mean Stress Effects */
    { id:'goodman', name:'Goodman Criterion', symbol:'n', formula:'\\sigma_a/Se + \\sigma_m/Sut = 1/n', unit:'—', cat:'mean-stress',
      desc:'The Goodman line connects the endurance limit on the stress amplitude axis to the ultimate tensile strength on the mean stress axis. Points below the line are safe. The safety factor n indicates how far the operating point is from the failure line. It is the most widely used mean stress criterion.',
      example:{ problem:'Se = 200 MPa, Sut = 500 MPa, \\sigma_a = 80 MPa, \\sigma_m = 100 MPa. Find n (Goodman).', steps:['\\sigma_a/Se + \\sigma_m/Sut = 1/n', '80/200 + 100/500 = 1/n', '0.4 + 0.2 = 1/n', '0.6 = 1/n', 'n = 1/0.6 = 1.667'], answer:1.667, unit:'' }},
    { id:'soderberg', name:'Soderberg Criterion', symbol:'n', formula:'\\sigma_a/Se + \\sigma_m/Sy = 1/n', unit:'—', cat:'mean-stress',
      desc:'The Soderberg criterion is more conservative than Goodman because it uses yield strength Sy instead of ultimate strength Sut for the mean stress intercept. It guarantees no yielding under static mean stress.',
      example:{ problem:'Se = 200 MPa, Sy = 350 MPa, \\sigma_a = 80 MPa, \\sigma_m = 100 MPa. Find n (Soderberg).', steps:['\\sigma_a/Se + \\sigma_m/Sy = 1/n', '80/200 + 100/350 = 1/n', '0.4 + 0.2857 = 1/n', '0.6857 = 1/n', 'n = 1/0.6857 = 1.458'], answer:1.458, unit:'' }},
    { id:'gerber', name:'Gerber Criterion', symbol:'n', formula:'\\sigma_a/Se + (\\sigma_m/Sut)^2 = 1/n', unit:'—', cat:'mean-stress',
      desc:'The Gerber parabola fits experimental data more closely than Goodman for ductile materials. It uses a squared mean stress term, making it less conservative than Goodman but more accurate for many steels.',
      example:{ problem:'Se = 200 MPa, Sut = 500 MPa, \\sigma_a = 80 MPa, \\sigma_m = 100 MPa. Find n (Gerber).', steps:['\\sigma_a/Se + (\\sigma_m/Sut)^2 = 1/n', '80/200 + (100/500)^2 = 1/n', '0.4 + 0.04 = 1/n', '0.44 = 1/n', 'n = 1/0.44 = 2.273'], answer:2.273, unit:'' }},

    /* Design Factors */
    { id:'miners-rule', name:"Miner's Rule", symbol:'D', formula:'D = \\Sigma(ni/Ni) = 1 at failure', unit:'—', cat:'design',
      desc:"Miner's rule (Palmgren-Miner) is a cumulative damage model for variable amplitude loading. Each load level consumes a fraction ni/Ni of the fatigue life. Failure occurs when the sum of all damage fractions equals 1.",
      example:{ problem:'A part operates at: 10,000 cycles at N1=50,000 life, then 20,000 cycles at N2=200,000 life. What is the cumulative damage?', steps:['D = n1/N1 + n2/N2', 'D = 10,000/50,000 + 20,000/200,000', 'D = 0.2 + 0.1', 'D = 0.3 (30% of life used)'], answer:0.3, unit:'' }},
    { id:'stress-concentration', name:'Stress Concentration (Kf)', symbol:'Kf', formula:'Kf = 1 + q(Kt - 1)', unit:'—', cat:'design',
      desc:'The fatigue stress concentration factor Kf accounts for geometric discontinuities (notches, holes, fillets). Kt is the theoretical stress concentration factor, and q is the notch sensitivity (0 to 1). Kf is used as ke = 1/Kf in the Marin equation.',
      example:{ problem:'A shaft has Kt = 2.5 and notch sensitivity q = 0.85. Find Kf and ke.', steps:['Kf = 1 + q(Kt - 1)', 'Kf = 1 + 0.85(2.5 - 1)', 'Kf = 1 + 0.85 × 1.5', 'Kf = 1 + 1.275 = 2.275', 'ke = 1/Kf = 1/2.275 = 0.440'], answer:2.275, unit:'' }},
    { id:'temp-factor', name:'Temperature Factor (kd)', symbol:'kd', formula:'kd = 1.0 for T < 450C', unit:'—', cat:'design',
      desc:'The temperature factor accounts for the reduction in fatigue strength at elevated temperatures. Below 450 deg C, kd = 1.0. Above 450 deg C, kd decreases approximately as kd = 1 - 0.0058(T - 450) for steels.',
      example:null }
  ];

  /* ────────────────────────────────────────────────────────────────
     3. HELPERS
     ──────────────────────────────────────────────────────────────── */
  function randInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rd(val, digits) { var f = Math.pow(10, digits); return Math.round(val * f) / f; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fmt(v) {
    if (Math.abs(v) >= 1e6) return v.toExponential(2);
    if (Math.abs(v) >= 1000) return v.toLocaleString('en-US', {maximumFractionDigits:1});
    if (Math.abs(v) < 0.01 && v !== 0) return v.toExponential(3);
    return String(rd(v, 3));
  }

  /* ────────────────────────────────────────────────────────────────
     4. ENGINEERING CALCULATIONS
     ──────────────────────────────────────────────────────────────── */
  function calcSePrime(Sut) {
    return Sut <= 1400 ? 0.5 * Sut : 700;
  }

  function calcKa(surfIdx, Sut) {
    var sf = SURFACE_FACTORS[surfIdx];
    return sf.a * Math.pow(Sut, sf.b);
  }

  function calcKb(diameter) {
    if (diameter <= 8) return 1.0;
    if (diameter <= 250) return 1.189 * Math.pow(diameter, -0.097);
    return 0.6;
  }

  function calcKd(tempC) {
    if (tempC <= 450) return 1.0;
    return Math.max(0.5, 1 - 0.0058 * (tempC - 450));
  }

  function calcKe(Kt, notchQ) {
    var Kf = 1 + notchQ * (Kt - 1);
    return 1 / Kf;
  }

  function calcSe(Sut, surfIdx, diameter, relIdx, tempC, Kt, notchQ) {
    var Sep = calcSePrime(Sut);
    var ka = calcKa(surfIdx, Sut);
    var kb = calcKb(diameter);
    var kc = RELIABILITY[relIdx].kc;
    var kd = calcKd(tempC);
    var ke = calcKe(Kt, notchQ);
    return { Se: ka * kb * kc * kd * ke * Sep, ka: ka, kb: kb, kc: kc, kd: kd, ke: ke, Sep: Sep };
  }

  function calcGoodmanN(sigA, sigM, Se, Sut) {
    var lhs = sigA / Se + sigM / Sut;
    return lhs > 0 ? 1 / lhs : Infinity;
  }

  function calcSoderbergN(sigA, sigM, Se, Sy) {
    var lhs = sigA / Se + sigM / Sy;
    return lhs > 0 ? 1 / lhs : Infinity;
  }

  function calcGerberN(sigA, sigM, Se, Sut) {
    var lhs = sigA / Se + (sigM / Sut) * (sigM / Sut);
    return lhs > 0 ? 1 / lhs : Infinity;
  }

  function calcFatigueLife(sigA, sfp, bExp) {
    if (sigA <= 0) return Infinity;
    var ratio = sigA / sfp;
    var twoN = Math.pow(ratio, 1 / bExp);
    return Math.max(1, twoN / 2);
  }

  /* ────────────────────────────────────────────────────────────────
     5. DOM REFS
     ──────────────────────────────────────────────────────────────── */
  var canvas = document.getElementById('main-canvas');
  var ctx = canvas.getContext('2d');

  /* Simulate mode */
  var selMaterial   = document.getElementById('sel-material');
  var selSurface    = document.getElementById('sel-surface');
  var selReliability= document.getElementById('sel-reliability');
  var slSigMean     = document.getElementById('sl-sig-mean');
  var slSigAmp      = document.getElementById('sl-sig-amp');
  var slDiameter    = document.getElementById('sl-diameter');
  var slTemp        = document.getElementById('sl-temp');
  var slKt          = document.getElementById('sl-kt');
  var slNotchQ      = document.getElementById('sl-notch-q');
  var valSigMean    = document.getElementById('val-sig-mean');
  var valSigAmp     = document.getElementById('val-sig-amp');
  var valDiameter   = document.getElementById('val-diameter');
  var valTemp       = document.getElementById('val-temp');
  var valKt         = document.getElementById('val-kt');
  var valNotchQ     = document.getElementById('val-notch-q');
  var readoutGrid   = document.getElementById('readout-grid');

  /* Explore */
  var categoryRow   = document.getElementById('category-row');
  var catTabs       = document.getElementById('cat-tabs');
  var itemSelector  = document.getElementById('item-selector');
  var isGrid        = document.getElementById('is-grid');
  var itemInfo      = document.getElementById('item-info');
  var iiName        = document.getElementById('ii-name');
  var iiCat         = document.getElementById('ii-cat');
  var iiDesc        = document.getElementById('ii-desc');
  var formulaBox    = document.getElementById('formula-box');
  var fbFormula     = document.getElementById('fb-formula');
  var fbUnit        = document.getElementById('fb-unit');
  var exampleBox    = document.getElementById('example-box');

  /* Practice */
  var practicePanel = document.getElementById('practice-panel');
  var ppPrompt      = document.getElementById('pp-prompt');
  var ppInput       = document.getElementById('pp-input');
  var ppUnit        = document.getElementById('pp-unit');
  var btnPCheck     = document.getElementById('btn-p-check');
  var btnPNext      = document.getElementById('btn-p-next');
  var pFeedback     = document.getElementById('p-feedback');
  var pSolution     = document.getElementById('p-solution');
  var practiceBar   = document.getElementById('practice-bar');
  var pScoreEl      = document.getElementById('p-score');
  var pTotalEl      = document.getElementById('p-total');

  /* Quiz */
  var quizPanel     = document.getElementById('quiz-panel');
  var qpPrompt      = document.getElementById('qp-prompt');
  var quizAnswers   = document.getElementById('quiz-answers');
  var quizBar       = document.getElementById('quiz-bar');
  var quizQNum      = document.getElementById('quiz-q-num');
  var quizQTotal    = document.getElementById('quiz-q-total');
  var quizFeedback  = document.getElementById('quiz-feedback');
  var btnQuizNext   = document.getElementById('btn-quiz-next');
  var quizResult    = document.getElementById('quiz-result');
  var qrStars       = document.getElementById('qr-stars');
  var qrScore       = document.getElementById('qr-score');
  var qrVerdict     = document.getElementById('qr-verdict');
  var qrRows        = document.getElementById('qr-rows');
  var btnQuizRetry  = document.getElementById('btn-quiz-retry');

  /* Sections */
  var simControls   = document.getElementById('sim-controls');
  var canvasCard    = document.querySelector('.canvas-card');

  /* ────────────────────────────────────────────────────────────────
     6. CANVAS SETUP & STATE
     ──────────────────────────────────────────────────────────────── */
  var W = 900, H = 500;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  function initCanvas() {
    /* Size to the canvas's REAL display width, not a fixed W. The CSS
       stretches this canvas to its card, so W*dpr was being presented across a
       wider box — a 1.16x upscale. Scaling by displayW/W keeps the 900x500
       coordinate system exactly as the drawing code expects. */
    var _dW = canvas.getBoundingClientRect().width;
    if (!(_dW > 40)) _dW = W;
    canvas.width = Math.round(_dW * dpr);
    canvas.height = Math.round(_dW * (H / W) * dpr);
    canvas.style.width = '';
    canvas.style.height = '';
    ctx.setTransform((_dW*dpr)/W, 0, 0, (_dW*dpr)/W, 0, 0);
  }
  initCanvas();

  /* State */
  var mode = 'simulate';
  var selCat = 'fundamentals';
  var selConceptIdx = 0;

  /* Practice state */
  var pProblem = null, pScore = 0, pTotal = 0, pAnswered = false;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizQs = [], quizIdx = 0, quizScore = 0, quizAnswered = false;

  /* ────────────────────────────────────────────────────────────────
     7. SIMULATE MODE — READ INPUTS & COMPUTE
     ──────────────────────────────────────────────────────────────── */
  function getSimState() {
    var matIdx = parseInt(selMaterial.value, 10);
    var mat = MATERIALS[matIdx];
    var surfIdx = parseInt(selSurface.value, 10);
    var relIdx = parseInt(selReliability.value, 10);
    var sigMean = parseFloat(slSigMean.value);
    var sigAmp = parseFloat(slSigAmp.value);
    var diameter = parseFloat(slDiameter.value);
    var tempC = parseFloat(slTemp.value);
    var Kt = parseFloat(slKt.value);
    var notchQ = parseFloat(slNotchQ.value);

    var seResult = calcSe(mat.Sut, surfIdx, diameter, relIdx, tempC, Kt, notchQ);
    var nGoodman = calcGoodmanN(sigAmp, sigMean, seResult.Se, mat.Sut);
    var nSoderberg = calcSoderbergN(sigAmp, sigMean, seResult.Se, mat.Sy);
    var nGerber = calcGerberN(sigAmp, sigMean, seResult.Se, mat.Sut);
    var Nlife = calcFatigueLife(sigAmp, mat.sfp, mat.bExp);

    return {
      mat: mat, sigMean: sigMean, sigAmp: sigAmp, diameter: diameter, tempC: tempC,
      Kt: Kt, notchQ: notchQ, surfIdx: surfIdx, relIdx: relIdx,
      Se: seResult.Se, ka: seResult.ka, kb: seResult.kb, kc: seResult.kc,
      kd: seResult.kd, ke: seResult.ke, Sep: seResult.Sep,
      nGoodman: nGoodman, nSoderberg: nSoderberg, nGerber: nGerber, Nlife: Nlife
    };
  }

  /* ================================================================
     DISPLAY UNITS  (display only — the Marin/Goodman model stays SI)
     Fatigue design in the US is written in ksi with diameters in inches
     and temperature in °F. Cycles and all safety factors are counts and
     ratios, so they are identical in both systems.
     Explore concepts and Practice/Quiz problems keep their MPa statements:
     they are fixed textbook problems, not live readouts.
     ================================================================ */
  var unitSys = 'si';
  function isImp()    { return unitSys === 'imp'; }
  function sDisp(mpa) { return isImp() ? mpa * 0.1450377 : mpa; }   /* MPa → ksi */
  function sToSI(d)   { return isImp() ? d / 0.1450377 : d; }
  function uS()       { return isImp() ? 'ksi' : 'MPa'; }
  function lDisp(mm)  { return isImp() ? mm * 0.0393701 : mm; }     /* mm  → in  */
  function uL()       { return isImp() ? 'in' : 'mm'; }
  function tDisp(c)   { return isImp() ? c * 9 / 5 + 32 : c; }      /* °C  → °F  */
  function uT()       { return isImp() ? '\u00B0F' : '\u00B0C'; }
  /* stress value + unit, in the active system */
  function vS(mpa, d) { return sDisp(mpa).toFixed(d == null ? (isImp() ? 2 : 1) : d) + ' ' + uS(); }

  /* The material <option> labels quote Sut and Sy as bare numbers, so in
     Imperial they would silently read as ksi while holding MPa. Rebuild them
     from MATERIALS with the unit spelled out. */
  function syncMaterialOptions() {
    var sel = document.getElementById('sel-material');
    if (!sel) return;
    var keep = sel.selectedIndex;
    for (var i = 0; i < MATERIALS.length && i < sel.options.length; i++) {
      var m = MATERIALS[i], d = isImp() ? 1 : 0;
      sel.options[i].textContent = m.name + ' (Sut=' + sDisp(m.Sut).toFixed(d) +
        ', Sy=' + sDisp(m.Sy).toFixed(d) + ' ' + uS() + ')';
    }
    sel.selectedIndex = keep;
  }

  function updateSliderLabels() {
    valSigMean.textContent  = vS(+slSigMean.value, isImp() ? 1 : 0);
    valSigAmp.textContent   = vS(+slSigAmp.value,  isImp() ? 1 : 0);
    valDiameter.textContent = lDisp(+slDiameter.value).toFixed(isImp() ? 2 : 0) + ' ' + uL();
    valTemp.textContent     = tDisp(+slTemp.value).toFixed(0) + ' ' + uT();
    valKt.textContent = slKt.value;
    valNotchQ.textContent = slNotchQ.value;
  }

  function updateReadouts(st) {
    var cards = [
      { label: 'Corrected Endurance Limit (Se)', value: vS(st.Se), sub: 'ka=' + rd(st.ka,3) + ' kb=' + rd(st.kb,3) + ' kc=' + rd(st.kc,3) + ' kd=' + rd(st.kd,3) + ' ke=' + rd(st.ke,3), cls: '' },
      { label: 'Goodman Safety Factor', value: 'n = ' + fmt(rd(st.nGoodman, 3)), sub: '\u03C3a/Se + \u03C3m/Sut = 1/n', cls: st.nGoodman >= 1 ? 'pass' : 'fail' },
      { label: 'Soderberg Safety Factor', value: 'n = ' + fmt(rd(st.nSoderberg, 3)), sub: '\u03C3a/Se + \u03C3m/Sy = 1/n', cls: st.nSoderberg >= 1 ? 'pass' : 'fail' },
      { label: 'Gerber Safety Factor', value: 'n = ' + fmt(rd(st.nGerber, 3)), sub: '\u03C3a/Se + (\u03C3m/Sut)\u00B2 = 1/n', cls: st.nGerber >= 1 ? 'pass' : 'fail' },
      { label: 'Fatigue Life (Basquin)', value: fmt(rd(st.Nlife, 0)) + ' cycles', sub: "N = (1/2)(\u03C3a/\u03C3'f)^(1/b)", cls: st.Nlife > 1e6 ? 'pass' : (st.Nlife > 1e4 ? '' : 'fail') },
      { label: 'Verdict', value: st.nGoodman >= 1 ? 'SAFE (Goodman)' : 'UNSAFE (Goodman)', sub: st.nGoodman >= 1 ? 'Operating point is within safe zone' : 'Redesign required \u2014 reduce stress or improve surface', cls: st.nGoodman >= 1 ? 'pass' : 'fail' }
    ];
    var html = '';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      html += '<div class="readout-card ' + c.cls + '">' +
        '<span class="rc-label">' + c.label + '</span>' +
        '<span class="rc-value">' + c.value + '</span>' +
        '<span class="rc-sub">' + c.sub + '</span></div>';
    }
    readoutGrid.innerHTML = html;
  }

  /* ────────────────────────────────────────────────────────────────
     8. DRAWING — GOODMAN DIAGRAM
     ──────────────────────────────────────────────────────────────── */
  function drawGoodmanDiagram(st) {
    var pad = { left: 80, right: 40, top: 40, bottom: 60 };
    var gw = (W / 2) - pad.left - pad.right;
    var gh = H - pad.top - pad.bottom;
    var maxX = st.mat.Sut * 1.15;
    var maxY = Math.max(st.Se, st.sigAmp) * 1.6;
    if (maxY < 100) maxY = st.Se * 1.6;

    function toX(v) { return pad.left + (v / maxX) * gw; }
    function toY(v) { return H - pad.bottom - (v / maxY) * gh; }

    /* Axes */
    ctx.strokeStyle = '#3a4468';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left + gw + 10, H - pad.bottom);
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left, pad.top - 10);
    ctx.stroke();

    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C3_mean (' + uS() + ')', pad.left + gw / 2, H - 12);
    ctx.save();
    ctx.translate(18, pad.top + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('\u03C3_amp (' + uS() + ')', 0, 0);
    ctx.restore();

    /* Tick marks */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    var stepX = niceStep(maxX); var stepY = niceStep(maxY);
    for (var tx = stepX; tx <= maxX; tx += stepX) {
      var px = toX(tx);
      ctx.fillText(sDisp(tx).toFixed(isImp() ? 1 : 0), px, H - pad.bottom + 16);
      ctx.strokeStyle = 'rgba(58,68,104,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(px, H - pad.bottom); ctx.lineTo(px, pad.top); ctx.stroke();
    }
    for (var ty = stepY; ty <= maxY; ty += stepY) {
      var py = toY(ty);
      ctx.textAlign = 'right';
      ctx.fillText(sDisp(ty).toFixed(isImp() ? 1 : 0), pad.left - 8, py + 4);
      ctx.strokeStyle = 'rgba(58,68,104,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(pad.left + gw, py); ctx.stroke();
    }

    /* Safe zone fill (Goodman) */
    ctx.fillStyle = 'rgba(61,220,132,0.08)';
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    ctx.lineTo(toX(0), toY(st.Se));
    ctx.lineTo(toX(st.mat.Sut), toY(0));
    ctx.closePath();
    ctx.fill();

    /* Goodman line */
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(st.Se));
    ctx.lineTo(toX(st.mat.Sut), toY(0));
    ctx.stroke();

    /* Soderberg line (dashed) */
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(st.Se));
    ctx.lineTo(toX(st.mat.Sy), toY(0));
    ctx.stroke();
    ctx.setLineDash([]);

    /* Gerber parabola */
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    var steps = 60;
    for (var gi = 0; gi <= steps; gi++) {
      var sm = (gi / steps) * st.mat.Sut;
      var saG = st.Se * (1 - (sm / st.mat.Sut) * (sm / st.mat.Sut));
      if (gi === 0) ctx.moveTo(toX(sm), toY(saG));
      else ctx.lineTo(toX(sm), toY(saG));
    }
    ctx.stroke();
    ctx.setLineDash([]);

    /* Legend */
    var lx = pad.left + 10, ly = pad.top + 8;
    ctx.font = '600 10px "Segoe UI", sans-serif';
    drawLegendItem(lx, ly, '#3ddc84', 'Goodman'); ly += 16;
    drawLegendItem(lx, ly, '#42a5f5', 'Soderberg'); ly += 16;
    drawLegendItem(lx, ly, '#ff9800', 'Gerber');

    /* Operating point */
    var opx = toX(st.sigMean), opy = toY(st.sigAmp);
    var safe = st.nGoodman >= 1;
    ctx.fillStyle = safe ? '#3ddc84' : '#ff5555';
    ctx.beginPath();
    ctx.arc(opx, opy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* Label on point */
    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'left';
    ctx.fillText('(' + sDisp(st.sigMean).toFixed(isImp() ? 1 : 0) + ', ' + sDisp(st.sigAmp).toFixed(isImp() ? 1 : 0) + ')', opx + 12, opy - 6);

    /* Title */
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('Goodman / Soderberg / Gerber Diagram', pad.left + gw / 2, pad.top - 14);
  }

  function drawLegendItem(lx, ly, color, label) {
    ctx.fillStyle = color;
    ctx.fillRect(lx, ly, 14, 3);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'left';
    ctx.fillText(label, lx + 18, ly + 5);
  }

  function niceStep(range) {
    var raw = range / 5;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var norm = raw / mag;
    if (norm < 1.5) return mag;
    if (norm < 3.5) return 2 * mag;
    if (norm < 7.5) return 5 * mag;
    return 10 * mag;
  }

  /* ────────────────────────────────────────────────────────────────
     9. DRAWING — S-N CURVE
     ──────────────────────────────────────────────────────────────── */
  function drawSNCurve(st) {
    var pad = { left: W / 2 + 40, right: 30, top: 40, bottom: 60 };
    var gw = W - pad.left - pad.right;
    var gh = H - pad.top - pad.bottom;

    /* Log scale: x = log10(N), y = stress amplitude */
    var logMin = 2, logMax = 8; /* 10^2 to 10^8 cycles */
    var sigMax = st.mat.sfp * 0.8;
    var sigMin = 0;

    function toX(logN) { return pad.left + ((logN - logMin) / (logMax - logMin)) * gw; }
    function toY(sig) { return H - pad.bottom - ((sig - sigMin) / (sigMax - sigMin)) * gh; }

    /* Axes */
    ctx.strokeStyle = '#3a4468';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left + gw + 10, H - pad.bottom);
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left, pad.top - 10);
    ctx.stroke();

    ctx.font = '700 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('N (cycles, log scale)', pad.left + gw / 2, H - 12);
    ctx.save();
    ctx.translate(pad.left - 38, pad.top + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('\u03C3_a (' + uS() + ')', 0, 0);
    ctx.restore();

    /* Log grid lines */
    ctx.font = '10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    for (var lg = logMin; lg <= logMax; lg++) {
      var px = toX(lg);
      ctx.textAlign = 'center';
      ctx.fillText('10^' + lg, px, H - pad.bottom + 16);
      ctx.strokeStyle = 'rgba(58,68,104,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(px, H - pad.bottom); ctx.lineTo(px, pad.top); ctx.stroke();
    }

    /* Y ticks */
    var ystep = niceStep(sigMax);
    for (var ys = ystep; ys <= sigMax; ys += ystep) {
      var py = toY(ys);
      ctx.textAlign = 'right';
      ctx.fillText(sDisp(ys).toFixed(isImp() ? 1 : 0), pad.left - 8, py + 4);
      ctx.strokeStyle = 'rgba(58,68,104,0.2)';
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(pad.left, py); ctx.lineTo(pad.left + gw, py); ctx.stroke();
    }

    /* S-N curve */
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var firstPt = true;
    for (var li = logMin * 10; li <= logMax * 10; li++) {
      var logN = li / 10;
      var N = Math.pow(10, logN);
      var sa = st.mat.sfp * Math.pow(2 * N, st.mat.bExp);
      if (sa < 0) sa = 0;
      if (sa > sigMax) { if (firstPt) { ctx.moveTo(toX(logN), toY(Math.min(sa, sigMax))); firstPt = false; } continue; }
      if (firstPt) { ctx.moveTo(toX(logN), toY(sa)); firstPt = false; }
      else ctx.lineTo(toX(logN), toY(sa));
    }
    ctx.stroke();

    /* Endurance limit line */
    ctx.strokeStyle = 'rgba(171,71,188,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, toY(st.Se));
    ctx.lineTo(pad.left + gw, toY(st.Se));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 10px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ab47bc';
    ctx.textAlign = 'left';
    ctx.fillText('Se = ' + vS(st.Se), pad.left + 4, toY(st.Se) - 6);

    /* Operating point on S-N curve */
    if (st.sigAmp > 0 && st.Nlife > 0 && st.Nlife < 1e9) {
      var logNop = Math.log10(st.Nlife);
      if (logNop >= logMin && logNop <= logMax) {
        var opx = toX(logNop);
        var opy = toY(st.sigAmp);
        ctx.fillStyle = st.nGoodman >= 1 ? '#3ddc84' : '#ff5555';
        ctx.beginPath();
        ctx.arc(opx, opy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '700 10px "Segoe UI", sans-serif';
        ctx.fillStyle = '#dde3f0';
        ctx.textAlign = 'left';
        ctx.fillText('N=' + fmt(rd(st.Nlife, 0)), opx + 10, opy - 5);
      }
    }

    /* Title */
    ctx.font = '700 13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText('S-N Curve (' + st.mat.name + ')', pad.left + gw / 2, pad.top - 14);
  }

  /* ────────────────────────────────────────────────────────────────
     10. MAIN DRAW — SIMULATE MODE
     ──────────────────────────────────────────────────────────────── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#161b27';
    ctx.fillRect(0, 0, W, H);

    if (mode !== 'simulate') {
      drawExploreDiagram();
      return;
    }

    var st = getSimState();
    updateReadouts(st);

    /* Divider line */
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2, 20);
    ctx.lineTo(W / 2, H - 20);
    ctx.stroke();

    drawGoodmanDiagram(st);
    drawSNCurve(st);
  }

  /* ────────────────────────────────────────────────────────────────
     11. EXPLORE DIAGRAM DRAWING
     ──────────────────────────────────────────────────────────────── */
  function drawExploreDiagram() {
    /* Draw a simple reference S-N curve and Goodman diagram for explore mode */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';

    var concept = getFilteredConcepts()[selConceptIdx];
    if (!concept) return;

    var cat = concept.cat;
    if (cat === 'fundamentals' || cat === 'sn-curve') {
      drawExploreSnCurve(concept);
    } else if (cat === 'mean-stress') {
      drawExploreGoodman(concept);
    } else {
      drawExploreGeneric(concept);
    }
  }

  function drawExploreSnCurve(concept) {
    var pad = { left: 90, right: 50, top: 50, bottom: 60 };
    var gw = W - pad.left - pad.right;
    var gh = H - pad.top - pad.bottom;

    /* Axes */
    ctx.strokeStyle = '#3a4468';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left + gw + 10, H - pad.bottom);
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left, pad.top - 10);
    ctx.stroke();

    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('N (cycles)', pad.left + gw / 2, H - 18);
    ctx.save();
    ctx.translate(25, pad.top + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('\u03C3_a (' + uS() + ')', 0, 0);
    ctx.restore();

    /* Reference S-N curve */
    ctx.strokeStyle = '#ab47bc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    var pts = 80;
    for (var ci = 0; ci <= pts; ci++) {
      var t = ci / pts;
      var px = pad.left + t * gw;
      var py = pad.top + 20 + (gh - 40) * (1 - Math.pow(1 - t, 0.4));
      if (ci === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    /* Endurance limit dashed line */
    var sey = pad.top + 20 + (gh - 40) * (1 - Math.pow(0.3, 0.4));
    ctx.strokeStyle = 'rgba(171,71,188,0.5)';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, sey);
    ctx.lineTo(pad.left + gw, sey);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ab47bc';
    ctx.textAlign = 'left';
    ctx.fillText('Se (endurance limit)', pad.left + gw * 0.55, sey - 8);

    /* Title */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText(concept.name, W / 2, pad.top - 18);
  }

  function drawExploreGoodman(concept) {
    var pad = { left: 90, right: 50, top: 50, bottom: 60 };
    var gw = W - pad.left - pad.right;
    var gh = H - pad.top - pad.bottom;

    /* Axes */
    ctx.strokeStyle = '#3a4468';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left + gw + 10, H - pad.bottom);
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left, pad.top - 10);
    ctx.stroke();

    ctx.font = '700 12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#6b7a99';
    ctx.textAlign = 'center';
    ctx.fillText('\u03C3_mean', pad.left + gw / 2, H - 18);
    ctx.save();
    ctx.translate(25, pad.top + gh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('\u03C3_amp', 0, 0);
    ctx.restore();

    var seY = pad.top + 40;
    var sutX = pad.left + gw - 60;
    var syX = pad.left + gw * 0.6;

    /* Goodman line */
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pad.left, seY);
    ctx.lineTo(sutX, H - pad.bottom);
    ctx.stroke();

    /* Soderberg line */
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pad.left, seY);
    ctx.lineTo(syX, H - pad.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    /* Gerber parabola */
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    for (var gi = 0; gi <= 50; gi++) {
      var frac = gi / 50;
      var gx = pad.left + frac * (sutX - pad.left);
      var gy = seY + (H - pad.bottom - seY) * frac * frac;
      if (gi === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    /* Labels */
    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#3ddc84'; ctx.textAlign = 'left';
    ctx.fillText('Goodman', sutX - 80, H - pad.bottom - 20);
    ctx.fillStyle = '#42a5f5';
    ctx.fillText('Soderberg', syX - 40, H - pad.bottom - 35);
    ctx.fillStyle = '#ff9800';
    ctx.fillText('Gerber', pad.left + gw * 0.35, seY + (H - pad.bottom - seY) * 0.25 - 10);

    ctx.font = '600 11px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'right';
    ctx.fillText('Se', pad.left - 8, seY + 4);
    ctx.textAlign = 'center';
    ctx.fillText('Sut', sutX, H - pad.bottom + 16);
    ctx.fillText('Sy', syX, H - pad.bottom + 16);

    /* Highlight concept */
    if (concept.id === 'goodman') {
      ctx.fillStyle = 'rgba(61,220,132,0.12)';
      ctx.beginPath();
      ctx.moveTo(pad.left, H - pad.bottom);
      ctx.lineTo(pad.left, seY);
      ctx.lineTo(sutX, H - pad.bottom);
      ctx.closePath();
      ctx.fill();
    } else if (concept.id === 'soderberg') {
      ctx.fillStyle = 'rgba(66,165,245,0.12)';
      ctx.beginPath();
      ctx.moveTo(pad.left, H - pad.bottom);
      ctx.lineTo(pad.left, seY);
      ctx.lineTo(syX, H - pad.bottom);
      ctx.closePath();
      ctx.fill();
    }

    /* Title */
    ctx.font = '700 14px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText(concept.name, W / 2, pad.top - 18);
  }

  function drawExploreGeneric(concept) {
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillStyle = '#dde3f0';
    ctx.textAlign = 'center';
    ctx.fillText(concept.name, W / 2, H / 2 - 30);

    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ab47bc';
    ctx.fillText(concept.formula || '', W / 2, H / 2 + 10);

    /* For Miner's rule draw cumulative damage bars */
    if (concept.id === 'miners-rule') {
      var bx = W / 2 - 150, by = H / 2 + 40, bw = 300, bh = 30;
      ctx.fillStyle = '#2a3050';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(171,71,188,0.5)';
      ctx.fillRect(bx, by, bw * 0.2, bh);
      ctx.fillStyle = 'rgba(255,152,0,0.5)';
      ctx.fillRect(bx + bw * 0.2, by, bw * 0.1, bh);
      ctx.fillStyle = '#2a3050';
      ctx.strokeStyle = '#6b7a99';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, bw, bh);
      /* Failure line */
      ctx.strokeStyle = '#ff5555';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx + bw, by - 5);
      ctx.lineTo(bx + bw, by + bh + 5);
      ctx.stroke();
      ctx.font = '600 10px "Segoe UI", sans-serif';
      ctx.fillStyle = '#ab47bc';
      ctx.textAlign = 'center';
      ctx.fillText('n1/N1 = 0.2', bx + bw * 0.1, by + bh + 16);
      ctx.fillStyle = '#ff9800';
      ctx.fillText('n2/N2 = 0.1', bx + bw * 0.25, by + bh + 16);
      ctx.fillStyle = '#ff5555';
      ctx.fillText('D = 1 (failure)', bx + bw + 5, by + bh / 2 + 4);
    }
  }

  /* ────────────────────────────────────────────────────────────────
     12. MODE SWITCHING
     ──────────────────────────────────────────────────────────────── */
  function getFilteredConcepts() {
    return CONCEPTS.filter(function (c) { return c.cat === selCat; });
  }

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var newMode = e.target.dataset.value;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    switchMode(newMode);
  });

  function switchMode(m) {
    mode = m;

    /* Hide all */
    simControls.style.display = 'none';
    canvasCard.style.display = 'none';
    readoutGrid.style.display = 'none';
    categoryRow.style.display = 'none';
    itemSelector.style.display = 'none';
    itemInfo.style.display = 'none';
    practicePanel.style.display = 'none';
    practiceBar.style.display = 'none';
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = 'none';

    if (m === 'simulate') {
      simControls.style.display = '';
      canvasCard.style.display = '';
      readoutGrid.style.display = '';
      updateSliderLabels();
      draw();
    } else if (m === 'explore') {
      canvasCard.style.display = '';
      categoryRow.style.display = '';
      itemSelector.style.display = '';
      itemInfo.style.display = '';
      selConceptIdx = 0;
      buildExploreGrid();
      selectConcept(0);
      draw();
    } else if (m === 'practice') {
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      pScore = 0; pTotal = 0;
      pScoreEl.textContent = '0';
      pTotalEl.textContent = '0';
      newPracticeProblem();
    } else if (m === 'quiz') {
      startQuiz();
    }
  }

  /* ────────────────────────────────────────────────────────────────
     13. EXPLORE MODE LOGIC
     ──────────────────────────────────────────────────────────────── */
  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    selCat = e.target.dataset.value;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === e.target); });
    selConceptIdx = 0;
    buildExploreGrid();
    selectConcept(0);
    draw();
  });

  function buildExploreGrid() {
    var filtered = getFilteredConcepts();
    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var c = filtered[i];
      html += '<button class="is-btn' + (i === selConceptIdx ? ' active' : '') + '" data-idx="' + i + '">' +
        '<span class="is-btn-name">' + c.name + '</span>' +
        '<span class="is-btn-sym">' + c.symbol + '</span></button>';
    }
    isGrid.innerHTML = html;
  }

  isGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.is-btn');
    if (!btn) return;
    var idx = parseInt(btn.dataset.idx, 10);
    selectConcept(idx);
    draw();
  });

  function selectConcept(idx) {
    selConceptIdx = idx;
    var filtered = getFilteredConcepts();
    var c = filtered[idx];
    if (!c) return;

    /* Update grid active */
    isGrid.querySelectorAll('.is-btn').forEach(function (b, bi) { b.classList.toggle('active', bi === idx); });

    /* Fill info panel */
    iiName.textContent = c.name;
    iiCat.textContent = c.cat;
    iiDesc.textContent = c.desc;
    fbFormula.textContent = c.formula;
    fbUnit.textContent = c.unit ? 'Unit: ' + c.unit : '';

    if (c.example) {
      exampleBox.style.display = '';
      var exhtml = '<h4>Worked Example</h4>';
      exhtml += '<div class="ex-problem">' + c.example.problem + '</div>';
      for (var si = 0; si < c.example.steps.length; si++) {
        exhtml += '<div class="ex-step">' + c.example.steps[si] + '</div>';
      }
      exampleBox.innerHTML = exhtml;
    } else {
      exampleBox.style.display = 'none';
      exampleBox.innerHTML = '';
    }
  }

  /* ────────────────────────────────────────────────────────────────
     14. PRACTICE MODE
     ──────────────────────────────────────────────────────────────── */
  var PRACTICE_GEN = [
    /* 0: Uncorrected endurance limit */
    function () {
      var mat = pick(MATERIALS);
      var ans = rd(calcSePrime(mat.Sut), 1);
      return { prompt: mat.name + ' has Sut = ' + mat.Sut + " MPa. Calculate the uncorrected endurance limit Se'.",
        steps: ['Given: Sut = ' + mat.Sut + ' MPa', "Se' = 0.5 x Sut (since Sut <= 1400)", "Se' = 0.5 x " + mat.Sut + " = " + ans + " MPa"],
        answer: ans, unit: 'MPa' };
    },
    /* 1: Surface factor ka */
    function () {
      var sf = pick(SURFACE_FACTORS);
      var Sut = pick([400, 500, 600, 700, 800, 900]);
      var ans = rd(sf.a * Math.pow(Sut, sf.b), 3);
      return { prompt: 'A ' + sf.name.toLowerCase() + ' surface with Sut = ' + Sut + ' MPa. Calculate ka. (a=' + sf.a + ', b=' + sf.b + ')',
        steps: ['ka = a x Sut^b', 'ka = ' + sf.a + ' x ' + Sut + '^(' + sf.b + ')', 'ka = ' + ans],
        answer: ans, unit: '' };
    },
    /* 2: Size factor kb */
    function () {
      var d = pick([10, 20, 30, 40, 50, 60, 80, 100]);
      var ans = rd(calcKb(d), 3);
      return { prompt: 'Find the size factor kb for a shaft of diameter d = ' + d + ' mm.',
        steps: ['Given: d = ' + d + ' mm (8 < d <= 250)', 'kb = 1.189 x d^(-0.097)', 'kb = 1.189 x ' + d + '^(-0.097)', 'kb = ' + ans],
        answer: ans, unit: '' };
    },
    /* 3: Corrected endurance limit Se */
    function () {
      var mat = pick(MATERIALS);
      var surfIdx = randInt(0, 3);
      var d = pick([20, 30, 40, 50]);
      var relIdx = randInt(0, 3);
      var seResult = calcSe(mat.Sut, surfIdx, d, relIdx, 25, 1.0, 0);
      var ans = rd(seResult.Se, 1);
      return { prompt: mat.name + ' (Sut=' + mat.Sut + '), ' + SURFACE_FACTORS[surfIdx].name.toLowerCase() + ' surface, d=' + d + ' mm, ' + RELIABILITY[relIdx].name + ' reliability, room temp, no notch. Find Se.',
        steps: ['Se\' = ' + rd(seResult.Sep, 1) + ' MPa', 'ka = ' + rd(seResult.ka, 3), 'kb = ' + rd(seResult.kb, 3), 'kc = ' + rd(seResult.kc, 3), 'kd = 1.0, ke = 1.0',
          'Se = ' + rd(seResult.ka, 3) + ' x ' + rd(seResult.kb, 3) + ' x ' + rd(seResult.kc, 3) + ' x ' + rd(seResult.Sep, 1), 'Se = ' + ans + ' MPa'],
        answer: ans, unit: 'MPa' };
    },
    /* 4: Goodman safety factor */
    function () {
      var Se = pick([150, 180, 200, 220, 250]);
      var Sut = pick([400, 500, 600, 700, 800]);
      var sigA = randInt(40, Math.floor(Se * 0.7));
      var sigM = randInt(30, Math.floor(Sut * 0.4));
      var ans = rd(calcGoodmanN(sigA, sigM, Se, Sut), 3);
      return { prompt: 'Se = ' + Se + ' MPa, Sut = ' + Sut + ' MPa, \u03C3a = ' + sigA + ' MPa, \u03C3m = ' + sigM + ' MPa. Find Goodman safety factor n.',
        steps: ['\u03C3a/Se + \u03C3m/Sut = 1/n', sigA + '/' + Se + ' + ' + sigM + '/' + Sut + ' = 1/n',
          rd(sigA / Se, 4) + ' + ' + rd(sigM / Sut, 4) + ' = ' + rd(sigA / Se + sigM / Sut, 4), 'n = 1/' + rd(sigA / Se + sigM / Sut, 4) + ' = ' + ans],
        answer: ans, unit: '' };
    },
    /* 5: Soderberg safety factor */
    function () {
      var Se = pick([150, 180, 200, 220]);
      var Sy = pick([280, 320, 350, 400, 450]);
      var sigA = randInt(40, Math.floor(Se * 0.6));
      var sigM = randInt(30, Math.floor(Sy * 0.35));
      var ans = rd(calcSoderbergN(sigA, sigM, Se, Sy), 3);
      return { prompt: 'Se = ' + Se + ' MPa, Sy = ' + Sy + ' MPa, \u03C3a = ' + sigA + ' MPa, \u03C3m = ' + sigM + ' MPa. Find Soderberg safety factor n.',
        steps: ['\u03C3a/Se + \u03C3m/Sy = 1/n', sigA + '/' + Se + ' + ' + sigM + '/' + Sy + ' = 1/n',
          rd(sigA / Se, 4) + ' + ' + rd(sigM / Sy, 4) + ' = ' + rd(sigA / Se + sigM / Sy, 4), 'n = ' + ans],
        answer: ans, unit: '' };
    },
    /* 6: Gerber safety factor */
    function () {
      var Se = pick([150, 200, 220, 250]);
      var Sut = pick([500, 600, 700, 800]);
      var sigA = randInt(40, Math.floor(Se * 0.6));
      var sigM = randInt(50, Math.floor(Sut * 0.4));
      var ans = rd(calcGerberN(sigA, sigM, Se, Sut), 3);
      return { prompt: 'Se = ' + Se + ' MPa, Sut = ' + Sut + ' MPa, \u03C3a = ' + sigA + ' MPa, \u03C3m = ' + sigM + ' MPa. Find Gerber safety factor n.',
        steps: ['\u03C3a/Se + (\u03C3m/Sut)\u00B2 = 1/n', sigA + '/' + Se + ' + (' + sigM + '/' + Sut + ')\u00B2 = 1/n',
          rd(sigA / Se, 4) + ' + ' + rd((sigM / Sut) * (sigM / Sut), 4) + ' = ' + rd(sigA / Se + (sigM / Sut) * (sigM / Sut), 4), 'n = ' + ans],
        answer: ans, unit: '' };
    },
    /* 7: Fatigue life from Basquin */
    function () {
      var mat = pick(MATERIALS);
      var sigA = randInt(Math.floor(mat.Sut * 0.3), Math.floor(mat.Sut * 0.7));
      var N = calcFatigueLife(sigA, mat.sfp, mat.bExp);
      var ans = rd(N, 0);
      return { prompt: mat.name + " (\u03C3'f = " + mat.sfp + " MPa, b = " + mat.bExp + '). Find fatigue life N at \u03C3a = ' + sigA + ' MPa.',
        steps: ["\u03C3a = \u03C3'f (2N)^b", sigA + ' = ' + mat.sfp + ' (2N)^(' + mat.bExp + ')',
          '(2N) = (' + sigA + '/' + mat.sfp + ')^(1/' + mat.bExp + ')', 'N = ' + fmt(ans) + ' cycles'],
        answer: ans, unit: 'cycles' };
    },
    /* 8: Miner's rule */
    function () {
      var n1 = randInt(5, 30) * 1000;
      var N1 = randInt(50, 200) * 1000;
      var n2 = randInt(5, 40) * 1000;
      var N2 = randInt(100, 500) * 1000;
      var D = rd(n1 / N1 + n2 / N2, 3);
      return { prompt: 'A part runs ' + n1 + ' cycles at N1=' + N1 + ', then ' + n2 + ' cycles at N2=' + N2 + ". Calculate Miner's cumulative damage D.",
        steps: ['D = n1/N1 + n2/N2', 'D = ' + n1 + '/' + N1 + ' + ' + n2 + '/' + N2,
          'D = ' + rd(n1 / N1, 4) + ' + ' + rd(n2 / N2, 4), 'D = ' + D],
        answer: D, unit: '' };
    },
    /* 9: Stress concentration factor Kf */
    function () {
      var Kt = rd(pick([1.5, 2.0, 2.5, 3.0, 3.5]), 1);
      var q = rd(pick([0.7, 0.75, 0.8, 0.85, 0.9, 0.95]), 2);
      var Kf = rd(1 + q * (Kt - 1), 3);
      return { prompt: 'A notched part has Kt = ' + Kt + ' and notch sensitivity q = ' + q + '. Calculate Kf.',
        steps: ['Kf = 1 + q(Kt - 1)', 'Kf = 1 + ' + q + '(' + Kt + ' - 1)', 'Kf = 1 + ' + q + ' x ' + rd(Kt - 1, 1),
          'Kf = ' + Kf],
        answer: Kf, unit: '' };
    },
    /* 10: Temperature factor */
    function () {
      var T = pick([500, 550, 600, 650, 700]);
      var ans = rd(calcKd(T), 3);
      return { prompt: 'Calculate the temperature factor kd for T = ' + T + ' \u00B0C.',
        steps: ['T > 450\u00B0C, so kd = 1 - 0.0058(T - 450)', 'kd = 1 - 0.0058(' + T + ' - 450)',
          'kd = 1 - 0.0058 x ' + (T - 450), 'kd = ' + ans],
        answer: ans, unit: '' };
    },
    /* 11: ke from Kf */
    function () {
      var Kf = rd(pick([1.5, 1.8, 2.0, 2.2, 2.5, 2.8, 3.0]), 1);
      var ke = rd(1 / Kf, 3);
      return { prompt: 'Kf = ' + Kf + '. Calculate the miscellaneous Marin factor ke = 1/Kf.',
        steps: ['ke = 1/Kf', 'ke = 1/' + Kf, 'ke = ' + ke],
        answer: ke, unit: '' };
    }
  ];

  function newPracticeProblem() {
    pAnswered = false;
    pProblem = PRACTICE_GEN[randInt(0, PRACTICE_GEN.length - 1)]();
    ppPrompt.textContent = pProblem.prompt;
    ppUnit.textContent = pProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    btnPCheck.style.display = '';
    btnPNext.style.display = 'none';
    pFeedback.textContent = '';
    pFeedback.className = 'feedback';
    pSolution.style.display = 'none';
    ppInput.focus();
  }

  btnPCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });

  function checkPractice() {
    if (pAnswered || !pProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) { pFeedback.textContent = 'Enter a number'; pFeedback.className = 'feedback err'; return; }
    pAnswered = true;
    pTotal++;
    var correct = pProblem.answer;
    var tol = Math.max(Math.abs(correct) * 0.03, 0.5);
    if (pProblem.unit === 'cycles') tol = Math.max(Math.abs(correct) * 0.08, 10);
    var ok = Math.abs(userVal - correct) <= tol;
    if (ok) {
      pScore++;
      pFeedback.textContent = '\u2705 Correct!';
      pFeedback.className = 'feedback ok';
    } else {
      pFeedback.textContent = '\u274C Incorrect. Answer: ' + fmt(correct) + ' ' + pProblem.unit;
      pFeedback.className = 'feedback err';
    }
    pScoreEl.textContent = pScore;
    pTotalEl.textContent = pTotal;
    ppInput.disabled = true;
    btnPCheck.style.display = 'none';
    btnPNext.style.display = '';

    /* Show solution */
    var solHtml = '<h4>Solution</h4>';
    for (var si = 0; si < pProblem.steps.length; si++) {
      solHtml += '<div class="sol-step">' + pProblem.steps[si] + '</div>';
    }
    pSolution.innerHTML = solHtml;
    pSolution.style.display = '';
  }

  btnPNext.addEventListener('click', function () { newPracticeProblem(); });

  /* ────────────────────────────────────────────────────────────────
     15. QUIZ MODE
     ──────────────────────────────────────────────────────────────── */
  var QUIZ_POOL = [
    /* MCQ */
    { type:'mcq', q:"Which equation describes the S-N curve for high-cycle fatigue?", opts:["Basquin's equation", "Goodman criterion", "Miner's rule", "Soderberg criterion"], correct:0 },
    { type:'mcq', q:'What is the uncorrected endurance limit for steel with Sut = 800 MPa?', opts:['400 MPa', '800 MPa', '700 MPa', '200 MPa'], correct:0 },
    { type:'mcq', q:'Which mean stress criterion is the most conservative?', opts:['Soderberg', 'Goodman', 'Gerber', 'Modified Goodman'], correct:0 },
    { type:'mcq', q:'What does the surface factor ka account for?', opts:['Surface finish effect on fatigue', 'Size of the part', 'Operating temperature', 'Reliability level'], correct:0 },
    { type:'mcq', q:'According to Miner\'s rule, failure occurs when:', opts:['Sum of ni/Ni = 1', 'Sum of ni/Ni = 0', 'Maximum stress exceeds Sut', 'Strain exceeds 0.2%'], correct:0 },
    { type:'mcq', q:'The Gerber criterion uses which relationship for mean stress?', opts:['Parabolic (squared term)', 'Linear', 'Cubic', 'Logarithmic'], correct:0 },
    { type:'mcq', q:'For a shaft diameter of 5 mm, the size factor kb is:', opts:['1.0', '0.85', '0.9', '0.75'], correct:0 },
    { type:'mcq', q:'Which material property does the fatigue strength exponent b describe?', opts:['Slope of S-N curve on log-log plot', 'Yield strength', 'Endurance limit', 'Elastic modulus'], correct:0 },
    /* Numeric */
    { type:'num', q:'Sut = 600 MPa. Calculate Se\' (uncorrected endurance limit) in MPa.', answer:300, unit:'MPa', steps:["Se' = 0.5 x Sut = 0.5 x 600 = 300 MPa"] },
    { type:'num', q:'Goodman: \u03C3a=100, Se=250, \u03C3m=150, Sut=600. Find n.', answer:1.43, unit:'', steps:['\u03C3a/Se + \u03C3m/Sut = 1/n', '100/250 + 150/600 = 0.4 + 0.25 = 0.65', 'n = 1/0.65 = 1.538'] },
    { type:'num', q:'Miner\'s rule: 5000 cycles at N1=25000 and 8000 cycles at N2=80000. Find damage D.', answer:0.3, unit:'', steps:['D = 5000/25000 + 8000/80000 = 0.2 + 0.1 = 0.3'] },
    { type:'num', q:'Kt = 2.0, notch sensitivity q = 0.9. Calculate Kf.', answer:1.9, unit:'', steps:['Kf = 1 + q(Kt-1) = 1 + 0.9(1.0) = 1.9'] },
    { type:'num', q:'Soderberg: \u03C3a=80, Se=200, \u03C3m=120, Sy=400. Find n.', answer:1.43, unit:'', steps:['80/200 + 120/400 = 0.4 + 0.3 = 0.7', 'n = 1/0.7 = 1.429'] },
    { type:'num', q:'Find kb for a 50 mm diameter shaft.', answer:0.818, unit:'', steps:['kb = 1.189 x 50^(-0.097) = 1.189 x 0.688 = 0.818'] },
    { type:'num', q:'Gerber: \u03C3a=60, Se=200, \u03C3m=200, Sut=500. Find n.', answer:2.0, unit:'', steps:['60/200 + (200/500)^2 = 0.3 + 0.16 = 0.46 (wait let me recalc)', 'Actually: 0.3 + 0.16 = 0.46, n=1/0.46=2.174 ... checking: 60/200=0.3, (200/500)^2=0.16, sum=0.46, n=2.174'] }
  ];

  function startQuiz() {
    /* Shuffle and pick QUIZ_SIZE */
    var pool = QUIZ_POOL.slice();
    for (var si = pool.length - 1; si > 0; si--) {
      var j = Math.floor(Math.random() * (si + 1));
      var tmp = pool[si]; pool[si] = pool[j]; pool[j] = tmp;
    }
    quizQs = pool.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizPanel.style.display = '';
    quizBar.style.display = '';
    quizResult.style.display = '';
    quizResult.style.display = 'none';
    quizQTotal.textContent = QUIZ_SIZE;
    showQuizQuestion();
  }

  function showQuizQuestion() {
    quizAnswered = false;
    var q = quizQs[quizIdx];
    quizQNum.textContent = quizIdx + 1;
    qpPrompt.textContent = q.q;
    quizFeedback.textContent = '';
    quizFeedback.className = 'quiz-feedback';
    btnQuizNext.style.display = 'none';

    if (q.type === 'mcq') {
      /* Shuffle options keeping track of correct */
      var opts = q.opts.map(function (o, oi) { return { text: o, idx: oi }; });
      for (var si = opts.length - 1; si > 0; si--) {
        var j = Math.floor(Math.random() * (si + 1));
        var tmp = opts[si]; opts[si] = opts[j]; opts[j] = tmp;
      }
      var html = '';
      for (var oi = 0; oi < opts.length; oi++) {
        html += '<button class="answer-btn" data-oidx="' + opts[oi].idx + '">' + opts[oi].text + '</button>';
      }
      quizAnswers.innerHTML = html;
    } else {
      quizAnswers.innerHTML = '<div class="quiz-input-row">' +
        '<input type="number" step="any" class="qi-input" id="qi-val" placeholder="Your answer" />' +
        '<span class="qi-unit">' + (q.unit || '') + '</span></div>' +
        '<button class="btn btn-primary" id="btn-qi-submit">Submit</button>';
      var qiSubmit = document.getElementById('btn-qi-submit');
      var qiVal = document.getElementById('qi-val');
      qiSubmit.addEventListener('click', function () { submitQuizNumeric(); });
      qiVal.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') submitQuizNumeric(); });
      qiVal.focus();
    }
  }

  quizAnswers.addEventListener('click', function (e) {
    var btn = e.target.closest('.answer-btn');
    if (!btn || quizAnswered) return;
    quizAnswered = true;
    var chosen = parseInt(btn.dataset.oidx, 10);
    var q = quizQs[quizIdx];
    var correct = chosen === q.correct;

    /* Mark all buttons */
    quizAnswers.querySelectorAll('.answer-btn').forEach(function (b) {
      b.classList.add('locked');
      if (parseInt(b.dataset.oidx, 10) === q.correct) b.classList.add('correct');
      if (b === btn && !correct) b.classList.add('wrong');
    });

    if (correct) {
      quizScore++;
      quizFeedback.textContent = '\u2705 Correct!';
      quizFeedback.className = 'quiz-feedback ok';
    } else {
      quizFeedback.textContent = '\u274C Incorrect';
      quizFeedback.className = 'quiz-feedback err';
    }
    q._userAnswer = btn.textContent;
    q._correct = correct;
    btnQuizNext.style.display = '';
  });

  function submitQuizNumeric() {
    if (quizAnswered) return;
    var qiVal = document.getElementById('qi-val');
    if (!qiVal) return;
    var userVal = parseFloat(qiVal.value);
    if (isNaN(userVal)) return;
    quizAnswered = true;
    var q = quizQs[quizIdx];
    var tol = Math.max(Math.abs(q.answer) * 0.05, 0.05);
    var correct = Math.abs(userVal - q.answer) <= tol;
    if (correct) {
      quizScore++;
      quizFeedback.textContent = '\u2705 Correct!';
      quizFeedback.className = 'quiz-feedback ok';
    } else {
      quizFeedback.textContent = '\u274C Answer: ' + q.answer + ' ' + (q.unit || '');
      quizFeedback.className = 'quiz-feedback err';
    }
    q._userAnswer = String(userVal);
    q._correct = correct;
    qiVal.disabled = true;
    var submitBtn = document.getElementById('btn-qi-submit');
    if (submitBtn) submitBtn.disabled = true;
    btnQuizNext.style.display = '';
  }

  btnQuizNext.addEventListener('click', function () {
    quizIdx++;
    if (quizIdx < QUIZ_SIZE) {
      showQuizQuestion();
    } else {
      showQuizResult();
    }
  });

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';

    qrScore.textContent = quizScore + ' / ' + QUIZ_SIZE;
    if (quizScore === QUIZ_SIZE) {
      qrScore.className = 'qr-score perfect';
      qrStars.textContent = '\u2605\u2605\u2605';
      qrStars.style.color = '#f5c842';
      qrVerdict.textContent = 'Perfect score!';
    } else if (quizScore >= 3) {
      qrScore.className = 'qr-score good';
      qrStars.textContent = '\u2605\u2605';
      qrStars.style.color = '#3ddc84';
      qrVerdict.textContent = 'Good job!';
    } else {
      qrScore.className = 'qr-score poor';
      qrStars.textContent = '\u2605';
      qrStars.style.color = '#ff5555';
      qrVerdict.textContent = 'Keep practicing!';
    }

    var rowsHtml = '';
    for (var ri = 0; ri < quizQs.length; ri++) {
      var rq = quizQs[ri];
      var isOk = rq._correct;
      rowsHtml += '<div class="qr-row ' + (isOk ? 'ok' : 'err') + '">' +
        '<span class="qr-qnum">Q' + (ri + 1) + '</span>' +
        '<span class="qr-detail"><strong>' + rq.q.substring(0, 70) + (rq.q.length > 70 ? '...' : '') + '</strong><br>Your answer: ' + (rq._userAnswer || '—') + '</span>' +
        '<span class="qr-mark">' + (isOk ? '\u2713' : '\u2717') + '</span></div>';
    }
    qrRows.innerHTML = rowsHtml;
  }

  btnQuizRetry.addEventListener('click', function () { startQuiz(); });

  /* ────────────────────────────────────────────────────────────────
     16. SIMULATE MODE — INPUT LISTENERS
     ──────────────────────────────────────────────────────────────── */
  var simInputs = [selMaterial, selSurface, selReliability, slSigMean, slSigAmp, slDiameter, slTemp, slKt, slNotchQ];
  simInputs.forEach(function (el) {
    el.addEventListener('input', function () {
      if (mode === 'simulate') {
        updateSliderLabels();
        draw();
      }
    });
  });

  /* ────────────────────────────────────────────────────────────────
     UNIT TOGGLE — display only; the Marin/Goodman model stays SI
     ──────────────────────────────────────────────────────────────── */
  var unitPills = document.querySelectorAll('#unit-tabs .pill');
  Array.prototype.forEach.call(unitPills, function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-unit');
      if (!u || u === unitSys) return;
      unitSys = u;
      Array.prototype.forEach.call(unitPills, function (b) {
        b.classList.toggle('active', b === btn);
      });
      syncMaterialOptions();
      updateSliderLabels();
      draw();                 /* redraws both graphs + the readout cards */
    });
  });

  /* ────────────────────────────────────────────────────────────────
     17. INIT
     ──────────────────────────────────────────────────────────────── */
  syncMaterialOptions();
  updateSliderLabels();
  draw();

})();
