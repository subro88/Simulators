(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     1. CHEMICAL DATABASE — 7 Acids + 7 Bases
     Fixed concentrations, handbook Ka/Kb values.
     ══════════════════════════════════════════════════════════════ */
  var ACIDS = [
    { name: 'Hydrochloric Acid', formula: 'HCl', type: 'strong-acid', conc: 0.1, nH: 1,
      color: '#b3e5fc', liquidAlpha: 0.25, info: 'Strong monoprotic acid. Fully dissociates in water. Common in lab titrations and stomach acid.' },
    { name: 'Sulfuric Acid', formula: 'H₂SO₄', type: 'strong-acid', conc: 0.1, nH: 2,
      color: '#e0e0e0', liquidAlpha: 0.20, info: 'Strong diprotic acid. Most produced industrial chemical. Used in batteries and fertilizers.' },
    { name: 'Nitric Acid', formula: 'HNO₃', type: 'strong-acid', conc: 0.1, nH: 1,
      color: '#fff9c4', liquidAlpha: 0.22, info: 'Strong monoprotic acid. Oxidizing acid used in fertilizers and explosives manufacturing.' },
    { name: 'Acetic Acid', formula: 'CH₃COOH', type: 'weak-acid', conc: 0.1, nH: 1,
      Ka: 1.8e-5, color: '#fff3e0', liquidAlpha: 0.30, info: 'Weak monoprotic acid. Main component of vinegar (~5%). Ka = 1.8×10⁻⁵.' },
    { name: 'Citric Acid', formula: 'C₆H₈O₇', type: 'weak-acid', conc: 0.1, nH: 3,
      Ka: 7.4e-4, color: '#fffde7', liquidAlpha: 0.28, info: 'Weak triprotic acid found in citrus fruits. Ka₁ = 7.4×10⁻⁴. Used as food preservative.' },
    { name: 'Phosphoric Acid', formula: 'H₃PO₄', type: 'weak-acid', conc: 0.1, nH: 3,
      Ka: 7.1e-3, color: '#eceff1', liquidAlpha: 0.20, info: 'Weak triprotic acid. Ka₁ = 7.1×10⁻³. Used in soft drinks and fertilizers.' },
    { name: 'Carbonic Acid', formula: 'H₂CO₃', type: 'weak-acid', conc: 0.04, nH: 2,
      Ka: 4.3e-7, color: '#e3f2fd', liquidAlpha: 0.12, info: 'Weak diprotic acid. Formed when CO₂ dissolves in water. Ka₁ = 4.3×10⁻⁷.' }
  ];

  var BASES = [
    { name: 'Sodium Hydroxide', formula: 'NaOH', type: 'strong-base', conc: 0.1, nOH: 1,
      color: '#e8eaf6', liquidAlpha: 0.18, info: 'Strong monoprotic base (caustic soda/lye). Used in soap making and drain cleaner.' },
    { name: 'Potassium Hydroxide', formula: 'KOH', type: 'strong-base', conc: 0.1, nOH: 1,
      color: '#ede7f6', liquidAlpha: 0.16, info: 'Strong monoprotic base (caustic potash). Used in liquid soap and alkaline batteries.' },
    { name: 'Calcium Hydroxide', formula: 'Ca(OH)₂', type: 'strong-base', conc: 0.02, nOH: 2,
      color: '#fafafa', liquidAlpha: 0.50, info: 'Strong diprotic base (lime water). Limited solubility ≈ 1.5 g/L. Used in water treatment.' },
    { name: 'Ammonia', formula: 'NH₃', type: 'weak-base', conc: 0.1, nOH: 1,
      Kb: 1.8e-5, color: '#f3e5f5', liquidAlpha: 0.15, info: 'Weak monoprotic base. Kb = 1.8×10⁻⁵. Used in cleaning products and fertilizers.' },
    { name: 'Sodium Bicarbonate', formula: 'NaHCO₃', type: 'weak-base', conc: 0.1, nOH: 1,
      Kb: 2.4e-8, color: '#fafafa', liquidAlpha: 0.35, info: 'Very weak base (baking soda). Amphoteric. Used as antacid and in baking.' },
    { name: 'Sodium Carbonate', formula: 'Na₂CO₃', type: 'weak-base', conc: 0.1, nOH: 2,
      Kb: 2.1e-4, color: '#eceff1', liquidAlpha: 0.30, info: 'Moderate base (washing soda). Kb = 2.1×10⁻⁴. Used in water softening and glass making.' },
    { name: 'Magnesium Hydroxide', formula: 'Mg(OH)₂', type: 'strong-base', conc: 0.02, nOH: 2,
      color: '#ffffff', liquidAlpha: 0.65, info: 'Strong but sparingly soluble base (milk of magnesia). Used as antacid and laxative.' }
  ];

  var ALL_CHEMICALS = ACIDS.concat(BASES);

  /* pH color scale — matches litmus-test simulator */
  var PH_COLORS = {
    0: '#ff0000', 1: '#ff1744', 2: '#ff5722', 3: '#ff9800', 4: '#ffc107',
    5: '#ffeb3b', 6: '#cddc39', 7: '#4caf50', 8: '#009688',
    9: '#00bcd4', 10: '#2196f3', 11: '#3f51b5', 12: '#673ab7',
    13: '#9c27b0', 14: '#4a148c'
  };

  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }
  function rgbStr(r, g, b) { return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')'; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpColor(c1, c2, t) { return rgbStr(lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)); }

  function getPHColor(pH) {
    var clamped = Math.max(0, Math.min(14, pH));
    var lo = Math.floor(clamped);
    var hi = Math.ceil(clamped);
    if (lo === hi || hi > 14) return hexToRgb(PH_COLORS[lo] || PH_COLORS[14]);
    var t = clamped - lo;
    var c1 = hexToRgb(PH_COLORS[lo]);
    var c2 = hexToRgb(PH_COLORS[hi]);
    return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
  }

  function getPHColorHex(pH) {
    var c = getPHColor(pH);
    return '#' + [c[0], c[1], c[2]].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
  }

  function classify(pH) {
    if (pH <= 2) return 'Strong Acid';
    if (pH <= 6) return 'Weak Acid';
    if (pH < 7.5 && pH >= 6.5) return 'Neutral';
    if (pH <= 10) return 'Weak Base';
    return 'Strong Base';
  }

  /* ══════════════════════════════════════════════════════════════
     2. pH CALCULATION ENGINE — Rigorous Acid-Base Chemistry
     ══════════════════════════════════════════════════════════════ */
  var Kw = 1e-14;

  function purePH(chem) {
    if (chem.type === 'strong-acid') {
      var h = chem.conc * (chem.nH || 1);
      return -Math.log10(h);
    }
    if (chem.type === 'strong-base') {
      var oh = chem.conc * (chem.nOH || 1);
      return 14 + Math.log10(oh);
    }
    if (chem.type === 'weak-acid') {
      var Ka = chem.Ka;
      var C = chem.conc;
      var disc = Ka * Ka + 4 * Ka * C;
      var x = (-Ka + Math.sqrt(disc)) / 2;
      return -Math.log10(x);
    }
    if (chem.type === 'weak-base') {
      var Kb = chem.Kb;
      var Cb = chem.conc;
      if (chem.formula === 'NaHCO₃') return 8.34;
      var disc2 = Kb * Kb + 4 * Kb * Cb;
      var xb = (-Kb + Math.sqrt(disc2)) / 2;
      return 14 + Math.log10(xb);
    }
    return 7;
  }

  function mixPH(chemA, chemB, volA_mL, volB_mL) {
    var Va = volA_mL / 1000;
    var Vb = volB_mL / 1000;
    var Vt = Va + Vb;
    if (Vt <= 0) return 7;

    var isAcidA = chemA.type.indexOf('acid') >= 0;
    var isAcidB = chemB.type.indexOf('acid') >= 0;

    if (isAcidA && isAcidB) return mixTwoAcids(chemA, chemB, Va, Vb, Vt);
    if (!isAcidA && !isAcidB) return mixTwoBases(chemA, chemB, Va, Vb, Vt);

    var acid = isAcidA ? chemA : chemB;
    var base = isAcidA ? chemB : chemA;
    var Va2 = isAcidA ? Va : Vb;
    var Vb2 = isAcidA ? Vb : Va;
    return mixAcidBase(acid, base, Va2, Vb2, Vt);
  }

  function mixTwoAcids(a, b, Va, Vb, Vt) {
    var molesH = 0;
    molesH += effectiveHmoles(a, Va);
    molesH += effectiveHmoles(b, Vb);
    var concH = molesH / Vt;
    return Math.max(0, -Math.log10(concH));
  }

  function mixTwoBases(a, b, Va, Vb, Vt) {
    var molesOH = 0;
    molesOH += effectiveOHmoles(a, Va);
    molesOH += effectiveOHmoles(b, Vb);
    var concOH = molesOH / Vt;
    return Math.min(14, 14 + Math.log10(concOH));
  }

  function effectiveHmoles(acid, V) {
    if (acid.type === 'strong-acid') return acid.conc * (acid.nH || 1) * V;
    var Ka = acid.Ka;
    var C = acid.conc;
    var disc = Ka * Ka + 4 * Ka * C;
    var x = (-Ka + Math.sqrt(disc)) / 2;
    return x * V;
  }

  function effectiveOHmoles(base, V) {
    if (base.type === 'strong-base') return base.conc * (base.nOH || 1) * V;
    if (base.formula === 'NaHCO₃') return Math.pow(10, -(14 - 8.34)) * V;
    var Kb = base.Kb;
    var C = base.conc;
    var disc = Kb * Kb + 4 * Kb * C;
    var x = (-Kb + Math.sqrt(disc)) / 2;
    return x * V;
  }

  function mixAcidBase(acid, base, Va, Vb, Vt) {
    var molesAcid = acid.conc * Va * (acid.nH || 1);
    var molesBase = base.conc * Vb * (base.nOH || 1);

    var isStrongAcid = acid.type === 'strong-acid';
    var isStrongBase = base.type === 'strong-base';

    if (isStrongAcid && isStrongBase) {
      if (Math.abs(molesAcid - molesBase) < 1e-10) return 7.00;
      if (molesAcid > molesBase) {
        var exH = (molesAcid - molesBase) / Vt;
        return -Math.log10(exH);
      }
      var exOH = (molesBase - molesAcid) / Vt;
      return 14 + Math.log10(exOH);
    }

    if (isStrongAcid && !isStrongBase) {
      var molesB = base.conc * Vb;
      var molesH = molesAcid;
      if (molesH > molesB) {
        var excess = (molesH - molesB) / Vt;
        return -Math.log10(excess);
      }
      if (Math.abs(molesH - molesB) < 1e-10) {
        var Ka_conj = Kw / base.Kb;
        var Cc = molesB / Vt;
        var hConc = Math.sqrt(Ka_conj * Cc);
        return -Math.log10(hConc);
      }
      var molesBaseRem = molesB - molesH;
      var molesConjAcid = molesH;
      var pKb = -Math.log10(base.Kb);
      var pOH = pKb + Math.log10(molesConjAcid / molesBaseRem);
      return 14 - pOH;
    }

    if (!isStrongAcid && isStrongBase) {
      var molesA = acid.conc * Va;
      var molesOH2 = molesBase;
      if (molesOH2 > molesA) {
        var excessOH = (molesOH2 - molesA) / Vt;
        return 14 + Math.log10(excessOH);
      }
      if (Math.abs(molesOH2 - molesA) < 1e-10) {
        var Kb_conj = Kw / acid.Ka;
        var Cconj = molesA / Vt;
        var ohConc = Math.sqrt(Kb_conj * Cconj);
        return 14 + Math.log10(ohConc);
      }
      var molesAcidRem = molesA - molesOH2;
      var molesConjBase = molesOH2;
      var pKa = -Math.log10(acid.Ka);
      return pKa + Math.log10(molesConjBase / molesAcidRem);
    }

    /* Weak acid + Weak base */
    var molesWA = acid.conc * Va;
    var molesWB = base.conc * Vb;
    if (Math.abs(molesWA - molesWB) < 1e-10) {
      var pKaW = -Math.log10(acid.Ka);
      var pKbW = -Math.log10(base.Kb);
      return 7 + 0.5 * (pKaW - pKbW);
    }
    if (molesWA > molesWB) {
      var rem = molesWA - molesWB;
      var conj = molesWB;
      return -Math.log10(acid.Ka) + Math.log10(conj / rem);
    }
    var remB = molesWB - molesWA;
    var conjA = molesWA;
    var pKbW2 = -Math.log10(base.Kb);
    var pOH2 = pKbW2 + Math.log10(conjA / remB);
    return 14 - pOH2;
  }

  /* ══════════════════════════════════════════════════════════════
     3. REACTION PRODUCT GENERATOR
     ══════════════════════════════════════════════════════════════ */
  var ACID_ANIONS = {
    'HCl': { ion: 'Cl⁻', salt: 'chloride' },
    'H₂SO₄': { ion: 'SO₄²⁻', salt: 'sulfate' },
    'HNO₃': { ion: 'NO₃⁻', salt: 'nitrate' },
    'CH₃COOH': { ion: 'CH₃COO⁻', salt: 'acetate' },
    'C₆H₈O₇': { ion: 'C₆H₅O₇³⁻', salt: 'citrate' },
    'H₃PO₄': { ion: 'PO₄³⁻', salt: 'phosphate' },
    'H₂CO₃': { ion: 'CO₃²⁻', salt: 'carbonate' }
  };

  var BASE_CATIONS = {
    'NaOH': { ion: 'Na⁺', prefix: 'Sodium' },
    'KOH': { ion: 'K⁺', prefix: 'Potassium' },
    'Ca(OH)₂': { ion: 'Ca²⁺', prefix: 'Calcium' },
    'NH₃': { ion: 'NH₄⁺', prefix: 'Ammonium' },
    'NaHCO₃': { ion: 'Na⁺', prefix: 'Sodium' },
    'Na₂CO₃': { ion: 'Na⁺', prefix: 'Sodium' },
    'Mg(OH)₂': { ion: 'Mg²⁺', prefix: 'Magnesium' }
  };

  function getReactionInfo(chemA, chemB) {
    var isAcidA = chemA.type.indexOf('acid') >= 0;
    var isAcidB = chemB.type.indexOf('acid') >= 0;

    if (isAcidA && isAcidB) {
      return { hasReaction: false, equation: 'No reaction (both acids)', product: 'Diluted acid mixture', gasEvolved: false };
    }
    if (!isAcidA && !isAcidB) {
      return { hasReaction: false, equation: 'No reaction (both bases)', product: 'Diluted base mixture', gasEvolved: false };
    }

    var acid = isAcidA ? chemA : chemB;
    var base = isAcidA ? chemB : chemA;
    var anion = ACID_ANIONS[acid.formula] || { salt: 'salt' };
    var cation = BASE_CATIONS[base.formula] || { prefix: 'Metal' };
    var saltName = cation.prefix + ' ' + anion.salt;

    var gasEvolved = false;
    var gasName = '';
    if (acid.formula === 'H₂CO₃' || base.formula === 'NaHCO₃' || base.formula === 'Na₂CO₃') {
      if (isAcidA !== (base.formula === 'NaHCO₃' || base.formula === 'Na₂CO₃')) {
        gasEvolved = true;
        gasName = 'CO₂';
      }
    }
    if ((base.formula === 'NaHCO₃' || base.formula === 'Na₂CO₃') && isAcidA) {
      gasEvolved = true;
      gasName = 'CO₂';
    }

    var equation = acid.formula + ' + ' + base.formula + ' → ' + saltName + ' + H₂O';
    if (gasEvolved) equation += ' + ' + gasName + '↑';

    return { hasReaction: true, equation: equation, product: saltName, gasEvolved: gasEvolved, gasName: gasName };
  }

  /* ══════════════════════════════════════════════════════════════
     4. DOM REFS
     ══════════════════════════════════════════════════════════════ */
  var canvas = document.getElementById('sim-canvas');
  var ctx = canvas.getContext('2d');

  var simPanel = document.getElementById('sim-panel');
  var catRow = document.getElementById('cat-row');
  var itemSelector = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar = document.getElementById('practice-bar');
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');
  var learnPanels = document.getElementById('learn-panels');
  var canvasActionBar = document.getElementById('canvas-action-bar');

  var selChemA = document.getElementById('sel-chem-a');
  var selChemB = document.getElementById('sel-chem-b');
  var slVolA = document.getElementById('sl-vol-a');
  var slVolB = document.getElementById('sl-vol-b');
  var inVolA = document.getElementById('in-vol-a');
  var inVolB = document.getElementById('in-vol-b');

  var rChemA = document.getElementById('r-chem-a');
  var rChemB = document.getElementById('r-chem-b');
  var rReaction = document.getElementById('r-reaction');
  var rProduct = document.getElementById('r-product');
  var rPH = document.getElementById('r-ph');
  var rClass = document.getElementById('r-class');

  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppShow = document.getElementById('pp-show');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  var qbarNum = document.getElementById('qbar-num');

  var btnMix = document.getElementById('btn-mix');
  var btnTest = document.getElementById('btn-test');
  var btnReset = document.getElementById('btn-reset');
  var btnPng = document.getElementById('btn-png');
  var ctxMenu = document.getElementById('ctx-menu');

  /* ══════════════════════════════════════════════════════════════
     5. STATE
     ══════════════════════════════════════════════════════════════ */
  var mode = 'simulate';
  var chemAIdx = 0;
  var chemBIdx = 7;
  var volA = 100;
  var volB = 100;

  var labState = 'idle';
  var pourProgress = 0;
  var mixProgress = 0;
  var dipProgress = 0;
  var colorProgress = 0;
  var animRAF = null;
  var animStart = 0;

  var resultPH = null;
  var reactionInfo = null;
  var paperType = 'universal';

  var bubbles = [];
  var swirlAngle = 0;
  var ripples = [];
  var swirlParticles = [];
  var lastDrip = null;
  var reactionBubbles = [];
  var steamParticles = [];
  var reactionIntensity = 0;
  var W = 900, H = 480;

  var practiceScore = 0, practiceTotal = 0, currentProblem = null, practiceAnswered = false;
  var QUIZ_SIZE = 5, quizSet = [], quizIdx = 0, quizScore = 0, quizAnswered = false, quizAnswers = [];
  var exploreCat = 'acids', selectedConcept = null;

  /* ══════════════════════════════════════════════════════════════
     6. SOUND EFFECTS (Web Audio API)
     ══════════════════════════════════════════════════════════════ */
  var audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function playPourSound() {
    try {
      var ac = getAudioCtx();
      var dur = 1.0;
      var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.6;
      var src = ac.createBufferSource(); src.buffer = buf;
      var filter = ac.createBiquadFilter(); filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, ac.currentTime);
      filter.frequency.linearRampToValueAtTime(200, ac.currentTime + dur);
      var gain = ac.createGain();
      gain.gain.setValueAtTime(0.2, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
      src.connect(filter); filter.connect(gain); gain.connect(ac.destination);
      src.start(); src.stop(ac.currentTime + dur);
    } catch (e) {}
  }

  function playBubbleSound() {
    try {
      var ac = getAudioCtx();
      var osc = ac.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ac.currentTime + 0.15);
      var gain = ac.createGain();
      gain.gain.setValueAtTime(0.12, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.2);
      osc.connect(gain); gain.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.2);
    } catch (e) {}
  }

  function playFizzSound() {
    try {
      var ac = getAudioCtx();
      var dur = 2.5;
      var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        var t = i / ac.sampleRate;
        var env = Math.exp(-t * 1.5) * 0.5;
        data[i] = (Math.random() * 2 - 1) * env + Math.sin(t * 120) * env * 0.3;
      }
      var src = ac.createBufferSource(); src.buffer = buf;
      var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 8000;
      var gain = ac.createGain();
      gain.gain.setValueAtTime(0.18, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
      src.connect(hp); hp.connect(lp); lp.connect(gain); gain.connect(ac.destination);
      src.start(); src.stop(ac.currentTime + dur);
    } catch (e) {}
  }

  function playResultChime() {
    try {
      var ac = getAudioCtx();
      [523, 659, 784].forEach(function (f, i) {
        var osc = ac.createOscillator(); osc.type = 'triangle'; osc.frequency.value = f;
        var gain = ac.createGain(); var t = ac.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain); gain.connect(ac.destination);
        osc.start(t); osc.stop(t + 0.4);
      });
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     7. CANVAS RENDERING
     ══════════════════════════════════════════════════════════════ */
  var pourDroplets = [];

  function sizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var w = rect.width || 900;
    canvas.width = w * dpr;
    canvas.height = (w * H / W) * dpr;
    canvas.style.height = (w * H / W) + 'px';
    ctx.setTransform(dpr * w / W, 0, 0, dpr * (w * H / W) / H, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', function () { sizeCanvas(); draw(); });

  /* Layout constants — single source of truth */
  var BEAKER_A = { x: 50,  y: 160, w: 90, h: 140 };
  var BEAKER_B = { x: 680, y: 160, w: 90, h: 140 };
  var MIX_BKR  = { x: 320, y: 180, w: 180, h: 200 };
  var PH_SCALE = { x: 845, y: 60, w: 18, h: 350 };
  var CHAIN_X = 18, CHAIN_Y = 26;
  var PAPER_CX = MIX_BKR.x + MIX_BKR.w * 0.65;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawBackground();
    if (labState !== 'pouring') { drawBeakerA(); drawBeakerB(); }
    drawMixingBeaker();
    if (labState === 'pouring') drawPouringScene();
    drawRipples();
    drawLastDrip();
    if (mixProgress > 0.5 && mixProgress < 1) { drawMixingSwirl(); drawSwirlParticles(); }
    if (reactionInfo && reactionInfo.gasEvolved && mixProgress > 0.3) drawBubbles();
    if (reactionIntensity > 0) { drawHeatGlow(); drawReactionBubbles(); drawSteam(); }
    if (labState === 'testing' || labState === 'result') drawLitmusPaper();
    drawPHScale();
    drawChainInstructions();
  }

  function drawBackground() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(42,48,80,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.fillStyle = 'rgba(0,150,136,0.04)';
    ctx.fillRect(10, 10, W - 20, H - 20);
    ctx.fillStyle = 'rgba(200,220,240,0.08)';
    ctx.font = '9px Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Chemical Mixing Virtual Lab', W - 18, H - 12);
  }

  function drawBeaker(x, y, w, h, liquidColor, liquidAlpha, fillLevel, label, formula, volText) {
    ctx.save();
    ctx.strokeStyle = 'rgba(200,220,240,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + 5, y); ctx.stroke();

    for (var m = 1; m <= 3; m++) {
      var my = y + h - h * (m / 4);
      ctx.strokeStyle = 'rgba(200,220,240,0.12)';
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(x + 3, my); ctx.lineTo(x + 12, my); ctx.stroke();
    }

    if (fillLevel > 0) {
      var lh = h * fillLevel;
      ctx.fillStyle = liquidColor;
      ctx.globalAlpha = liquidAlpha;
      ctx.fillRect(x + 1, y + h - lh, w - 2, lh);

      ctx.globalAlpha = liquidAlpha * 0.3;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x + 3, y + h - lh, 4, lh);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = '#dde3f0';
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    var cx = x + w / 2;
    ctx.fillText(label || '', cx, y + h + 16);
    if (formula) {
      ctx.fillStyle = '#009688';
      ctx.font = '9px Courier New, monospace';
      ctx.fillText(formula, cx, y + h + 28);
    }
    if (volText) {
      ctx.fillStyle = '#4a5580';
      ctx.font = '8px Segoe UI, sans-serif';
      ctx.fillText(volText, cx, y + h + 40);
    }
    ctx.restore();
  }

  function volToLevel(vol) {
    return 0.15 + (vol - 10) / (200 - 10) * 0.65;
  }

  function mixFillFrac() {
    return 0.2 + (volA + volB - 20) / (400 - 20) * 0.6;
  }

  function drawBeakerA() {
    var chem = ALL_CHEMICALS[chemAIdx];
    var b = BEAKER_A;
    var base = volToLevel(volA);
    var level = base;
    if (labState === 'pouring') level = base * (1 - pourProgress * 0.85);
    else if (labState !== 'idle') level = base * 0.15;
    drawBeaker(b.x, b.y, b.w, b.h, chem.color, chem.liquidAlpha + 0.3, level,
      chem.name, chem.formula, volA + ' mL • ' + chem.conc + ' M');
  }

  function drawBeakerB() {
    var chem = ALL_CHEMICALS[chemBIdx];
    var b = BEAKER_B;
    var base = volToLevel(volB);
    var level = base;
    if (labState === 'pouring') level = base * (1 - pourProgress * 0.85);
    else if (labState !== 'idle') level = base * 0.15;
    drawBeaker(b.x, b.y, b.w, b.h, chem.color, chem.liquidAlpha + 0.3, level,
      chem.name, chem.formula, volB + ' mL • ' + chem.conc + ' M');
  }

  function drawMixingBeaker() {
    var bx = MIX_BKR.x, by = MIX_BKR.y, bw = MIX_BKR.w, bh = MIX_BKR.h;
    var taperX = 8;
    ctx.strokeStyle = 'rgba(200,220,240,0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - taperX, by + bh);
    ctx.lineTo(bx + bw + taperX, by + bh);
    ctx.lineTo(bx + bw, by);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx, by); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx + bw, by); ctx.lineTo(bx + bw + 6, by); ctx.stroke();

    for (var m = 1; m <= 4; m++) {
      var my = by + bh - bh * (m / 5);
      var mSlope = taperX / bh;
      var mOffset = (bh - bh * (m / 5)) * mSlope;
      ctx.strokeStyle = 'rgba(200,220,240,0.08)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bx - taperX + mOffset + 3, my);
      ctx.lineTo(bx - taperX + mOffset + 14, my);
      ctx.stroke();
    }

    if (mixProgress > 0) {
      var fillH = bh * mixFillFrac() * Math.min(mixProgress, 1);
      var chemA = ALL_CHEMICALS[chemAIdx];
      var chemB = ALL_CHEMICALS[chemBIdx];

      var colA = hexToRgb(chemA.color || '#b3e5fc');
      var colB = hexToRgb(chemB.color || '#e8eaf6');
      var blendT = Math.min(mixProgress * 2, 1);
      var mixColor = [lerp(colA[0], colB[0], blendT * 0.5), lerp(colA[1], colB[1], blendT * 0.5), lerp(colA[2], colB[2], blendT * 0.5)];
      var alpha = 0.4 + Math.min(mixProgress, 1) * 0.35;
      var colStr = Math.round(mixColor[0]) + ',' + Math.round(mixColor[1]) + ',' + Math.round(mixColor[2]);

      var bottomY = by + bh;
      var topY = bottomY - fillH;
      var distFromTop = bh - fillH;

      var leftTop = bx - taperX * distFromTop / bh;
      var rightTop = bx + bw + taperX * distFromTop / bh;
      var leftBot = bx - taperX;
      var rightBot = bx + bw + taperX;

      var waveT = performance.now() * 0.003;
      var waveAmp = 2;
      if (labState === 'pouring') waveAmp = 5 + pourProgress * 3;
      else if (reactionIntensity > 0) waveAmp = 3 + reactionIntensity * 6;
      else if (mixProgress < 1) waveAmp = 3;
      var waveCycles = 3;

      var grad = ctx.createLinearGradient(bx, topY, bx, bottomY);
      grad.addColorStop(0, 'rgba(' + colStr + ',' + (alpha * 0.75) + ')');
      grad.addColorStop(0.4, 'rgba(' + colStr + ',' + alpha + ')');
      grad.addColorStop(1, 'rgba(' + colStr + ',' + (alpha + 0.1) + ')');
      ctx.fillStyle = grad;

      ctx.beginPath();
      ctx.moveTo(leftBot, bottomY);
      ctx.lineTo(rightBot, bottomY);

      var segs = 24;
      for (var i = 0; i <= segs; i++) {
        var t = i / segs;
        var wx = lerp(rightTop, leftTop, t);
        var wy = topY + Math.sin(waveT + t * Math.PI * waveCycles) * waveAmp;
        if (i === 0) ctx.lineTo(rightTop, wy);
        else ctx.lineTo(wx, wy);
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (var j = 0; j <= segs; j++) {
        var t2 = j / segs;
        var sx = lerp(rightTop, leftTop, t2);
        var sy = topY + Math.sin(waveT + t2 * Math.PI * waveCycles) * waveAmp;
        if (j === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fillRect(leftBot + 4, topY, 5, fillH);

      if (labState === 'pouring' || (mixProgress > 0 && mixProgress < 1)) {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.8;
        for (var r = 0; r < 3; r++) {
          var ry = topY + fillH * (0.2 + r * 0.25);
          var rx = (leftBot + rightBot) / 2;
          var rw = (rightBot - leftBot) * (0.15 + r * 0.1);
          ctx.beginPath();
          ctx.ellipse(rx, ry, rw, 3 + r * 2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = '#4a5580';
    ctx.font = '9px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Mixing Beaker', bx + bw / 2, by + bh + 18);

    if (labState === 'result' && resultPH !== null) {
      var phC = getPHColor(resultPH);
      var phHex = getPHColorHex(resultPH);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx + bw / 2 - 55, by + bh - 50, 110, 28, 6);
      else ctx.rect(bx + bw / 2 - 55, by + bh - 50, 110, 28);
      ctx.fill();
      ctx.fillStyle = phHex;
      ctx.font = 'bold 14px Courier New, monospace';
      ctx.fillText('pH = ' + resultPH.toFixed(2), bx + bw / 2, by + bh - 31);
    }
  }

  function spawnDroplets() {
    var mb = MIX_BKR;
    if (Math.random() < 0.5) {
      var chemA = ALL_CHEMICALS[chemAIdx];
      pourDroplets.push({ x: mb.x + mb.w * 0.35 + (Math.random() - 0.5) * 20, y: mb.y + 10, vy: 1 + Math.random() * 2, r: 1.5 + Math.random() * 2, color: chemA.color, alpha: 0.7 });
    }
    if (Math.random() < 0.5) {
      var chemB = ALL_CHEMICALS[chemBIdx];
      pourDroplets.push({ x: mb.x + mb.w * 0.65 + (Math.random() - 0.5) * 20, y: mb.y + 10, vy: 1 + Math.random() * 2, r: 1.5 + Math.random() * 2, color: chemB.color, alpha: 0.7 });
    }
  }

  function updateDroplets() {
    for (var i = pourDroplets.length - 1; i >= 0; i--) {
      var d = pourDroplets[i];
      d.y += d.vy;
      d.vy += 0.3;
      d.alpha -= 0.02;
      var liquidY = MIX_BKR.y + MIX_BKR.h - MIX_BKR.h * mixFillFrac() * Math.min(mixProgress, 1);
      if (d.y > liquidY || d.alpha <= 0) pourDroplets.splice(i, 1);
    }
  }

  function drawDroplets() {
    for (var i = 0; i < pourDroplets.length; i++) {
      var d = pourDroplets[i];
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = d.color;
      ctx.globalAlpha = d.alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function computePourState(rest, pour, maxAngle, p) {
    var PL = 0.12, PM = 0.32, PP = 0.78;
    var x = rest.x, y = rest.y, angle = 0, showHand = false, level = 0.7;

    if (p < PL) {
      var t = smoothstep(p / PL);
      y = rest.y - 25 * t;
      showHand = p > PL * 0.3;
    } else if (p < PM) {
      var t = smoothstep((p - PL) / (PM - PL));
      x = lerp(rest.x, pour.x, t);
      y = lerp(rest.y - 25, pour.y, t);
      showHand = true;
    } else if (p < PP) {
      var t = (p - PM) / (PP - PM);
      x = pour.x; y = pour.y;
      angle = maxAngle * smoothstep(Math.min(t * 1.3, 1));
      level = 0.7 * (1 - t * 0.85);
      showHand = true;
    } else {
      var t = smoothstep((p - PP) / (1 - PP));
      x = lerp(pour.x, rest.x, t);
      y = lerp(pour.y, rest.y, t);
      angle = maxAngle * (1 - t);
      level = 0.7 * 0.15;
      showHand = t < 0.6;
    }
    return { x: x, y: y, angle: angle, showHand: showHand, level: level };
  }

  function drawTiltedBeaker(cx, topY, w, h, angle, chem, fillLevel, showHand, side) {
    ctx.save();
    ctx.translate(cx, topY);
    ctx.rotate(angle);

    ctx.strokeStyle = 'rgba(200,220,240,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, h);
    ctx.lineTo(w / 2, h); ctx.lineTo(w / 2, 0);
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-w / 2 - 5, 0); ctx.lineTo(-w / 2, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2 + 5, 0); ctx.stroke();

    for (var m = 1; m <= 3; m++) {
      var my = h - h * (m / 4);
      ctx.strokeStyle = 'rgba(200,220,240,0.12)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-w / 2 + 3, my); ctx.lineTo(-w / 2 + 12, my); ctx.stroke();
    }

    if (fillLevel > 0) {
      var lh = h * fillLevel;
      ctx.fillStyle = chem.color;
      ctx.globalAlpha = chem.liquidAlpha + 0.3;
      ctx.fillRect(-w / 2 + 1, h - lh, w - 2, lh);
      ctx.globalAlpha = (chem.liquidAlpha + 0.3) * 0.3;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-w / 2 + 3, h - lh, 4, lh);
      ctx.globalAlpha = 1;
    }

    if (showHand) drawLabHand(w, side);
    ctx.restore();
  }

  function drawLabHand(bw, side) {
    var gc = 'rgba(160,215,235,0.88)';
    var gd = 'rgba(130,190,215,0.75)';
    var armW = 20, armH = 50;

    ctx.fillStyle = gc;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-armW / 2, -armH - 3, armW, armH, [5, 5, 0, 0]);
    else ctx.rect(-armW / 2, -armH - 3, armW, armH);
    ctx.fill();

    ctx.fillStyle = gd;
    ctx.fillRect(-armW / 2 - 1, -armH - 3, armW + 2, 5);

    ctx.fillStyle = gc;
    var ts = -side;
    ctx.beginPath();
    ctx.ellipse(ts * (bw / 2 + 6), 12, 5, 11, ts * 0.25, 0, Math.PI * 2);
    ctx.fill();

    var fs = side;
    for (var f = 0; f < 4; f++) {
      ctx.beginPath();
      ctx.ellipse(fs * (bw / 2 + 4), 3 + f * 8, 4.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(armW / 2 * fs, -3);
    ctx.lineTo(fs * (bw / 2 + 4), -1);
    ctx.lineTo(fs * (bw / 2 + 4), 35);
    ctx.lineTo(armW / 2 * fs, 25);
    ctx.closePath();
    ctx.fill();
  }

  function getRotatedRim(cx, topY, bw, angle, side) {
    var rx = side * bw / 2;
    return {
      x: cx + rx * Math.cos(angle),
      y: topY + rx * Math.sin(angle)
    };
  }

  function drawPourStream(fx, fy, tx, ty, color, alpha) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.globalAlpha = alpha * 0.65;
    ctx.beginPath(); ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo((fx + tx) / 2, fy + (ty - fy) * 0.4, tx, ty);
    ctx.stroke();
    ctx.lineWidth = 2; ctx.globalAlpha = alpha * 0.35;
    ctx.beginPath(); ctx.moveTo(fx + 3, fy);
    ctx.quadraticCurveTo((fx + tx) / 2 + 3, fy + (ty - fy) * 0.4 + 5, tx + 2, ty);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawPouringScene() {
    var chemA = ALL_CHEMICALS[chemAIdx], chemB = ALL_CHEMICALS[chemBIdx];
    var bA = BEAKER_A, bB = BEAKER_B, mb = MIX_BKR;
    var p = pourProgress;

    var pourA = { x: mb.x + mb.w * 0.12, y: mb.y - bA.h + 30 };
    var pourB = { x: mb.x + mb.w * 0.88, y: mb.y - bB.h + 30 };

    var stA = computePourState({ x: bA.x + bA.w / 2, y: bA.y }, pourA, Math.PI / 4.5, p);
    var stB = computePourState({ x: bB.x + bB.w / 2, y: bB.y }, pourB, -Math.PI / 4.5, p);

    drawTiltedBeaker(stA.x, stA.y, bA.w, bA.h, stA.angle, chemA, stA.level, stA.showHand, 1);
    drawTiltedBeaker(stB.x, stB.y, bB.w, bB.h, stB.angle, chemB, stB.level, stB.showHand, -1);

    if (p >= 0.32 && p < 1) {
      var sa = p < 0.78 ? Math.min((p - 0.32) / 0.1, 1) : Math.max(1 - (p - 0.78) / 0.22, 0);
      var rimA = getRotatedRim(stA.x, stA.y, bA.w, stA.angle, 1);
      drawPourStream(rimA.x, rimA.y, mb.x + mb.w * 0.4, mb.y + 10, chemA.color, sa);
      var rimB = getRotatedRim(stB.x, stB.y, bB.w, stB.angle, -1);
      drawPourStream(rimB.x, rimB.y, mb.x + mb.w * 0.6, mb.y + 10, chemB.color, sa);
    }
    drawDroplets();
  }

  /* --- Splash ripples --- */
  function spawnRipple(x, y) {
    ripples.push({ x: x, y: y, r: 2, maxR: 15 + Math.random() * 10, alpha: 0.5 });
  }

  function updateRipples() {
    for (var i = ripples.length - 1; i >= 0; i--) {
      var rp = ripples[i];
      rp.r += 1.2;
      rp.alpha -= 0.025;
      if (rp.alpha <= 0 || rp.r > rp.maxR) ripples.splice(i, 1);
    }
  }

  function drawRipples() {
    for (var i = 0; i < ripples.length; i++) {
      var rp = ripples[i];
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.3, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + rp.alpha + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  /* --- Last drip effect --- */
  function spawnLastDrip() {
    var mb = MIX_BKR;
    lastDrip = {
      x: mb.x + mb.w * 0.4 + Math.random() * mb.w * 0.2,
      y: mb.y - 10,
      vy: 0.5,
      r: 3,
      color: ALL_CHEMICALS[chemAIdx].color,
      alpha: 0.8,
      splashed: false
    };
  }

  function updateLastDrip() {
    if (!lastDrip) return;
    var mb = MIX_BKR;
    var liquidTop = mb.y + mb.h - mb.h * mixFillFrac() * Math.min(mixProgress, 1);
    lastDrip.y += lastDrip.vy;
    lastDrip.vy += 0.25;
    if (lastDrip.y >= liquidTop && !lastDrip.splashed) {
      lastDrip.splashed = true;
      spawnRipple(lastDrip.x, liquidTop);
      spawnRipple(lastDrip.x - 4, liquidTop);
      spawnRipple(lastDrip.x + 5, liquidTop);
      lastDrip = null;
    }
  }

  function drawLastDrip() {
    if (!lastDrip) return;
    ctx.beginPath();
    ctx.ellipse(lastDrip.x, lastDrip.y, lastDrip.r, lastDrip.r * 1.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = lastDrip.color;
    ctx.globalAlpha = lastDrip.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* --- Color swirl particles for mixing phase --- */
  function spawnSwirlParticles() {
    var mb = MIX_BKR;
    var cx = mb.x + mb.w / 2;
    var fillH = mb.h * mixFillFrac();
    var liquidTop = mb.y + mb.h - fillH;
    var chemA = ALL_CHEMICALS[chemAIdx];
    var chemB = ALL_CHEMICALS[chemBIdx];
    swirlParticles = [];
    for (var i = 0; i < 40; i++) {
      var isA = i < 20;
      var angle = (i / 20) * Math.PI * 2;
      var dist = 20 + Math.random() * 40;
      swirlParticles.push({
        cx: cx, cy: liquidTop + fillH * 0.5,
        angle: angle + (isA ? 0 : Math.PI),
        dist: dist,
        r: 2.5 + Math.random() * 3,
        color: isA ? chemA.color : chemB.color,
        alpha: 0.5 + Math.random() * 0.3,
        speed: 0.02 + Math.random() * 0.015,
        yOff: (Math.random() - 0.5) * fillH * 0.6
      });
    }
  }

  function updateSwirlParticles(mergeT) {
    var mb = MIX_BKR;
    var cx = mb.x + mb.w / 2;
    var fillH = mb.h * mixFillFrac();
    var liquidTop = mb.y + mb.h - fillH;
    var cy = liquidTop + fillH * 0.5;
    for (var i = 0; i < swirlParticles.length; i++) {
      var sp = swirlParticles[i];
      sp.angle += sp.speed;
      sp.dist = lerp(sp.dist, 5, mergeT * 0.02);
      sp.alpha = lerp(sp.alpha, 0, mergeT * 0.015);
      sp.cx = lerp(sp.cx, cx, 0.01);
      sp.cy = lerp(sp.cy, cy, 0.01);
    }
  }

  function drawSwirlParticles() {
    for (var i = 0; i < swirlParticles.length; i++) {
      var sp = swirlParticles[i];
      if (sp.alpha < 0.02) continue;
      var px = sp.cx + Math.cos(sp.angle) * sp.dist;
      var py = sp.cy + Math.sin(sp.angle) * sp.dist * 0.5 + sp.yOff;
      ctx.beginPath();
      ctx.arc(px, py, sp.r, 0, Math.PI * 2);
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = sp.alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawBubbles() {
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (b.alpha * 0.7) + ')';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,' + (b.alpha * 0.25) + ')';
      ctx.fill();
    }
  }

  function updateBubbles() {
    var mb = MIX_BKR;
    var liquidTop = mb.y + mb.h - mb.h * mixFillFrac() * Math.min(mixProgress, 1);
    for (var i = bubbles.length - 1; i >= 0; i--) {
      bubbles[i].y -= bubbles[i].speed;
      bubbles[i].x += (Math.random() - 0.5) * 1.2;
      bubbles[i].alpha -= 0.006;
      if (bubbles[i].alpha <= 0 || bubbles[i].y < liquidTop) bubbles.splice(i, 1);
    }
    if (bubbles.length < 25 && Math.random() < 0.35) {
      bubbles.push({
        x: mb.x + 20 + Math.random() * (mb.w - 40),
        y: mb.y + mb.h - 15 - Math.random() * 20,
        r: 1.5 + Math.random() * 3.5,
        speed: 0.8 + Math.random() * 1.5,
        alpha: 0.4 + Math.random() * 0.3
      });
    }
  }

  function drawMixingSwirl() {
    var mb = MIX_BKR;
    var cx = mb.x + mb.w / 2;
    var fillH = mb.h * mixFillFrac() * Math.min(mixProgress, 1);
    var liquidTop = mb.y + mb.h - fillH;
    var liquidMid = liquidTop + fillH * 0.5;
    var swirlT = (mixProgress - 0.5) / 0.5;
    var intensity = Math.min(swirlT * 2, 1) * (1 - Math.max(swirlT - 0.7, 0) / 0.3);

    ctx.save();
    ctx.globalAlpha = 0.25 * intensity;
    for (var ring = 0; ring < 3; ring++) {
      var r = 12 + ring * 18;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.2;
      ctx.arc(cx, liquidMid, r * intensity, swirlAngle + ring * 2.1, swirlAngle + ring * 2.1 + 2.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    var barW = 28 * intensity;
    var barH = 6;
    var barY = mb.y + mb.h - 14;
    ctx.save();
    ctx.translate(cx, barY);
    ctx.rotate(swirlAngle * 1.5);
    ctx.fillStyle = 'rgba(200,200,200,0.45)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-barW / 2, -barH / 2, barW, barH, barH / 2);
    else ctx.rect(-barW / 2, -barH / 2, barW, barH);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function updateReactionBubbles() {
    var mb = MIX_BKR;
    var fillH = mb.h * mixFillFrac();
    var liquidTop = mb.y + mb.h - fillH;
    for (var i = reactionBubbles.length - 1; i >= 0; i--) {
      var b = reactionBubbles[i];
      b.y -= b.speed;
      b.x += Math.sin(b.wobble) * 0.8;
      b.wobble += 0.15;
      b.alpha -= 0.008;
      if (b.y < liquidTop - 5 || b.alpha <= 0) {
        if (b.y < liquidTop + 3 && Math.random() < 0.4) spawnRipple(b.x, liquidTop);
        reactionBubbles.splice(i, 1);
      }
    }
    var maxBubbles = Math.floor(50 * reactionIntensity);
    var spawnRate = 0.6 * reactionIntensity;
    while (reactionBubbles.length < maxBubbles && Math.random() < spawnRate) {
      reactionBubbles.push({
        x: mb.x + 15 + Math.random() * (mb.w - 30),
        y: mb.y + mb.h - 10 - Math.random() * (fillH * 0.3),
        r: 1 + Math.random() * 4,
        speed: 1.2 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.5,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }

  function drawReactionBubbles() {
    for (var i = 0; i < reactionBubbles.length; i++) {
      var b = reactionBubbles[i];
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (b.alpha * 0.5) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (b.alpha * 0.7) + ')';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (b.alpha * 0.8) + ')';
      ctx.fill();
    }
  }

  function updateSteam() {
    var mb = MIX_BKR;
    var liquidTop = mb.y + mb.h - mb.h * mixFillFrac();
    for (var i = steamParticles.length - 1; i >= 0; i--) {
      var s = steamParticles[i];
      s.y -= s.speed;
      s.x += Math.sin(s.drift) * 0.5;
      s.drift += 0.04;
      s.r += 0.15;
      s.alpha -= 0.012;
      if (s.alpha <= 0) steamParticles.splice(i, 1);
    }
    var maxSteam = Math.floor(20 * reactionIntensity);
    if (steamParticles.length < maxSteam && Math.random() < 0.3 * reactionIntensity) {
      steamParticles.push({
        x: mb.x + mb.w * 0.2 + Math.random() * mb.w * 0.6,
        y: liquidTop - 2 - Math.random() * 8,
        r: 3 + Math.random() * 5,
        speed: 0.4 + Math.random() * 0.8,
        alpha: 0.15 + Math.random() * 0.2,
        drift: Math.random() * Math.PI * 2
      });
    }
  }

  function drawSteam() {
    for (var i = 0; i < steamParticles.length; i++) {
      var s = steamParticles[i];
      var grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, 'rgba(220,230,245,' + s.alpha + ')');
      grad.addColorStop(1, 'rgba(220,230,245,0)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  function drawHeatGlow() {
    if (reactionIntensity < 0.05) return;
    var mb = MIX_BKR;
    var fillH = mb.h * mixFillFrac();
    var liquidTop = mb.y + mb.h - fillH;
    var glowAlpha = reactionIntensity * 0.12;
    var grad = ctx.createLinearGradient(mb.x, mb.y + mb.h, mb.x, liquidTop);
    grad.addColorStop(0, 'rgba(255,120,50,' + glowAlpha + ')');
    grad.addColorStop(0.4, 'rgba(255,180,80,' + (glowAlpha * 0.5) + ')');
    grad.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(mb.x - 8, liquidTop, mb.w + 16, fillH);
  }

  function drawLitmusPaper() {
    var mb = MIX_BKR;
    var paperW = 18, paperH = 85;
    var px = PAPER_CX;
    var liquidTop = mb.y + mb.h - mb.h * mixFillFrac();
    var restY = mb.y - paperH - 15;
    var dipY = liquidTop - paperH * 0.35;
    var currentY = restY;

    if (labState === 'testing' || labState === 'result') {
      currentY = lerp(restY, dipY, dipProgress);
    }

    var startColor, endColor;
    if (paperType === 'red') {
      startColor = [220, 50, 50];
      endColor = (resultPH !== null && resultPH > 7) ? [50, 80, 200] : [220, 50, 50];
    } else if (paperType === 'blue') {
      startColor = [50, 80, 200];
      endColor = (resultPH !== null && resultPH < 7) ? [220, 50, 50] : [50, 80, 200];
    } else {
      startColor = [200, 200, 120];
      endColor = resultPH !== null ? getPHColor(resultPH) : startColor;
    }

    var t = colorProgress;
    var upperH = paperH * 0.3;
    var lowerH = paperH - upperH;

    var upperColor = lerpColor(startColor, endColor, t * 0.3);
    ctx.fillStyle = upperColor;
    ctx.fillRect(px - paperW / 2, currentY, paperW, upperH);

    var lowerColor = lerpColor(startColor, endColor, t);
    ctx.fillStyle = lowerColor;
    ctx.fillRect(px - paperW / 2, currentY + upperH, paperW, lowerH);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px - paperW / 2, currentY, paperW, paperH);

    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(px - paperW / 2 + 2, currentY, paperW - 4, 7);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '9px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    var paperLabel = paperType === 'red' ? 'Red Litmus' : paperType === 'blue' ? 'Blue Litmus' : 'Universal';
    ctx.fillText(paperLabel, px, currentY - 5);
  }

  function drawPHScale() {
    var sx = PH_SCALE.x, sy = PH_SCALE.y, sw = PH_SCALE.w, sh = PH_SCALE.h;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(sx - 3, sy - 3, sw + 6, sh + 20);

    for (var i = 0; i <= 14; i++) {
      var y = sy + (i / 14) * sh;
      var col = getPHColor(i);
      ctx.fillStyle = rgbStr(col[0], col[1], col[2]);
      ctx.fillRect(sx, y, sw, sh / 14 + 1);
    }
    ctx.strokeStyle = 'rgba(200,220,240,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx, sy, sw, sh);

    ctx.fillStyle = '#6b7a99';
    ctx.font = '8px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    for (var j = 0; j <= 14; j += 2) {
      ctx.fillText(j.toString(), sx + sw + 3, sy + (j / 14) * sh + 4);
    }
    ctx.fillText('pH', sx, sy - 6);

    if (labState === 'result' && resultPH !== null) {
      var markerY = sy + (resultPH / 14) * sh;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(sx - 6, markerY);
      ctx.lineTo(sx, markerY - 4);
      ctx.lineTo(sx, markerY + 4);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawChainInstructions() {
    var steps = [
      { label: 'Select Chemicals', done: true },
      { label: 'Set Volumes', done: labState !== 'idle' || pourProgress > 0 },
      { label: 'Mix Chemicals', done: mixProgress >= 1 },
      { label: 'Test with Litmus', done: labState === 'result' }
    ];
    var active = 0;
    if (labState === 'idle') active = 0;
    else if (labState === 'pouring' || mixProgress < 1) active = 2;
    else if (mixProgress >= 1 && labState !== 'result') active = 3;
    else active = 3;

    var stepW = 200, circR = 11, barH = 36;
    var totalW = steps.length * stepW;
    var startX = (W - totalW) / 2;
    var y = 10;

    ctx.fillStyle = 'rgba(10,14,20,0.82)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(startX - 10, y - 6, totalW + 20, barH + 12, 10);
    else ctx.rect(startX - 10, y - 6, totalW + 20, barH + 12);
    ctx.fill();

    steps.forEach(function (step, i) {
      var cx = startX + i * stepW + circR + 6;
      var cy = y + barH / 2;
      var isDone = i < active || (i === active && step.done && labState === 'result');
      var isActive = i === active && !isDone;

      ctx.beginPath();
      ctx.arc(cx, cy, circR, 0, Math.PI * 2);
      ctx.fillStyle = isDone ? '#3ddc84' : isActive ? '#f5c842' : 'rgba(42,48,80,0.7)';
      ctx.fill();

      ctx.fillStyle = isDone || isActive ? '#0d1117' : '#4a5580';
      ctx.font = 'bold 11px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isDone ? '✓' : String(i + 1), cx, cy + 4);

      ctx.textAlign = 'left';
      ctx.font = isActive ? 'bold 13px Segoe UI, sans-serif' : '12px Segoe UI, sans-serif';
      ctx.fillStyle = isActive ? '#f5c842' : isDone ? '#3ddc84' : '#4a5580';
      ctx.fillText(step.label, cx + circR + 8, cy + 5);

      if (i < steps.length - 1) {
        var lineStartX = cx + circR + 8 + ctx.measureText(step.label).width + 8;
        var lineEndX = startX + (i + 1) * stepW + 6 - 6;
        if (lineEndX > lineStartX + 4) {
          ctx.strokeStyle = isDone ? '#3ddc84' : 'rgba(42,48,80,0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(lineStartX, cy);
          ctx.lineTo(lineEndX, cy);
          ctx.stroke();
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     8. ANIMATION ENGINE
     ══════════════════════════════════════════════════════════════ */
  function startMixAnimation() {
    labState = 'pouring';
    pourProgress = 0;
    mixProgress = 0;
    resultPH = null;
    bubbles = [];

    var chemA = ALL_CHEMICALS[chemAIdx];
    var chemB = ALL_CHEMICALS[chemBIdx];
    reactionInfo = getReactionInfo(chemA, chemB);
    resultPH = mixPH(chemA, chemB, volA, volB);

    playPourSound();
    animStart = performance.now();
    if (animRAF) cancelAnimationFrame(animRAF);
    animateMix();
  }

  function animateMix() {
    var elapsed = performance.now() - animStart;
    var POUR_DUR = 3000;
    var MIX_DUR = 1800;
    var hasReaction = reactionInfo && reactionInfo.hasReaction;
    var REACT_DUR = hasReaction ? 2500 : 0;

    if (elapsed < POUR_DUR) {
      pourProgress = elapsed / POUR_DUR;
      if (pourProgress < 0.32) {
        mixProgress = 0;
      } else if (pourProgress < 0.78) {
        mixProgress = ((pourProgress - 0.32) / 0.46) * 0.75;
      } else {
        mixProgress = 0.75 + ((pourProgress - 0.78) / 0.22) * 0.05;
      }
      if (pourProgress > 0.35 && pourProgress < 0.78) {
        spawnDroplets();
        updateDroplets();
        if (mixProgress > 0.1 && Math.random() < 0.15) {
          var mb = MIX_BKR;
          var lt = mb.y + mb.h - mb.h * mixFillFrac() * Math.min(mixProgress, 1);
          spawnRipple(mb.x + mb.w * 0.3 + Math.random() * mb.w * 0.4, lt);
        }
      }
      updateRipples();
      if (pourProgress > 0.80 && !lastDrip) spawnLastDrip();
      updateLastDrip();
    } else if (elapsed < POUR_DUR + MIX_DUR) {
      pourProgress = 1;
      var mixElapsed = elapsed - POUR_DUR;
      mixProgress = 0.8 + (mixElapsed / MIX_DUR) * 0.2;
      swirlAngle += 0.12;
      if (swirlParticles.length === 0) spawnSwirlParticles();
      var mergeT = mixElapsed / MIX_DUR;
      updateSwirlParticles(mergeT);
      updateRipples();
      updateLastDrip();
      if (reactionInfo && reactionInfo.gasEvolved) updateBubbles();
    } else if (elapsed < POUR_DUR + MIX_DUR + REACT_DUR) {
      pourProgress = 1;
      mixProgress = 1;
      swirlParticles = [];
      var reactElapsed = elapsed - POUR_DUR - MIX_DUR;
      if (reactElapsed < 50) playFizzSound();
      var reactT = reactElapsed / REACT_DUR;
      reactionIntensity = reactT < 0.3 ? reactT / 0.3 : reactT < 0.7 ? 1.0 : 1.0 - (reactT - 0.7) / 0.3;
      swirlAngle += 0.08 * reactionIntensity;
      updateReactionBubbles();
      updateSteam();
      updateRipples();
      if (reactionInfo.gasEvolved) updateBubbles();
      if (Math.random() < 0.25 * reactionIntensity) {
        var rmb = MIX_BKR;
        var rlt = rmb.y + rmb.h - rmb.h * mixFillFrac();
        spawnRipple(rmb.x + rmb.w * 0.15 + Math.random() * rmb.w * 0.7, rlt);
      }
    } else {
      pourProgress = 1;
      mixProgress = 1;
      swirlAngle = 0;
      reactionIntensity = 0;
      labState = 'mixed';
      pourDroplets = [];
      swirlParticles = [];
      reactionBubbles = [];
      steamParticles = [];
      ripples = [];
      lastDrip = null;
      if (reactionInfo && reactionInfo.gasEvolved) playBubbleSound();
      updateReadouts();
      draw();
      return;
    }
    draw();
    animRAF = requestAnimationFrame(animateMix);
  }

  function startLitmusTest() {
    if (mixProgress < 1 || resultPH === null) return;
    labState = 'testing';
    dipProgress = 0;
    colorProgress = 0;
    animStart = performance.now();
    if (animRAF) cancelAnimationFrame(animRAF);
    animateLitmus();
  }

  function animateLitmus() {
    var elapsed = performance.now() - animStart;
    var DIP_DUR = 500;
    var COLOR_DUR = 2000;

    if (elapsed < DIP_DUR) {
      dipProgress = elapsed / DIP_DUR;
    } else if (elapsed < DIP_DUR + COLOR_DUR) {
      dipProgress = 1;
      colorProgress = (elapsed - DIP_DUR) / COLOR_DUR;
    } else {
      dipProgress = 1;
      colorProgress = 1;
      labState = 'result';
      playResultChime();
      updateReadouts();
      draw();
      return;
    }
    draw();
    animRAF = requestAnimationFrame(animateLitmus);
  }

  function resetLab() {
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
    labState = 'idle';
    pourProgress = 0;
    mixProgress = 0;
    dipProgress = 0;
    colorProgress = 0;
    resultPH = null;
    reactionInfo = null;
    bubbles = [];
    pourDroplets = [];
    swirlAngle = 0;
    ripples = [];
    swirlParticles = [];
    reactionBubbles = [];
    steamParticles = [];
    reactionIntensity = 0;
    lastDrip = null;
    btnMix.disabled = false;
    btnTest.disabled = true;
    updateReadouts();
    draw();
  }

  /* ══════════════════════════════════════════════════════════════
     9. READOUTS & LEARNING PANELS
     ══════════════════════════════════════════════════════════════ */
  function updateReadouts() {
    var chemA = ALL_CHEMICALS[chemAIdx];
    var chemB = ALL_CHEMICALS[chemBIdx];
    var phA = purePH(chemA), phB = purePH(chemB);
    rChemA.innerHTML = chemA.formula + ' (' + chemA.conc + ' M) &nbsp; <span style="color:' + getPHColorHex(phA) + '">pH ' + phA.toFixed(2) + '</span>';
    rChemB.innerHTML = chemB.formula + ' (' + chemB.conc + ' M) &nbsp; <span style="color:' + getPHColorHex(phB) + '">pH ' + phB.toFixed(2) + '</span>';

    if (labState === 'result' && resultPH !== null) {
      rPH.textContent = resultPH.toFixed(2);
      rPH.style.color = getPHColorHex(resultPH);
      rClass.textContent = classify(resultPH);
      if (reactionInfo) {
        rReaction.textContent = reactionInfo.hasReaction ? 'Neutralization' : 'No reaction';
        rProduct.textContent = reactionInfo.product;
      }
    } else {
      rPH.textContent = '--';
      rPH.style.color = '';
      rClass.textContent = '--';
      rReaction.textContent = '--';
      rProduct.textContent = '--';
    }

    updateLearnPanels();
  }

  function updateLearnPanels() {
    var chemA = ALL_CHEMICALS[chemAIdx];
    var chemB = ALL_CHEMICALS[chemBIdx];
    var eqBody = document.getElementById('lp-eq-body');
    var cmpBody = document.getElementById('lp-cmp-body');
    var coachBody = document.getElementById('lp-coach-body');

    if (labState === 'result' && resultPH !== null && reactionInfo) {
      eqBody.innerHTML = '<div class="eq-line"><b>Reaction:</b> ' + reactionInfo.equation + '</div>' +
        '<div class="eq-line"><b>pH (A alone):</b> ' + purePH(chemA).toFixed(2) + '</div>' +
        '<div class="eq-line"><b>pH (B alone):</b> ' + purePH(chemB).toFixed(2) + '</div>' +
        '<div class="eq-line"><b>pH (mixed):</b> ' + resultPH.toFixed(2) + '</div>' +
        '<div class="eq-line"><b>Classification:</b> ' + classify(resultPH) + '</div>';
    } else {
      eqBody.innerHTML = '<p style="color:#6b7a99;">Mix chemicals to see reaction equations and pH calculations.</p>';
    }

    var rows = '';
    ALL_CHEMICALS.forEach(function (c) {
      var ph = purePH(c);
      rows += '<tr><td>' + c.name + '</td><td>' + c.formula + '</td><td>' + c.conc + '</td><td style="color:' + getPHColorHex(ph) + '">' + ph.toFixed(2) + '</td><td>' + classify(ph) + '</td></tr>';
    });
    cmpBody.innerHTML = '<table class="cmp-table"><thead><tr><th>Chemical</th><th>Formula</th><th>Conc (M)</th><th>pH</th><th>Type</th></tr></thead><tbody>' + rows + '</tbody></table>';

    var tips = [];
    if (labState === 'result' && resultPH !== null) {
      if (resultPH > 6.5 && resultPH < 7.5) tips.push('The solution is neutral — the acid and base have neutralized each other.');
      if (resultPH < 3) tips.push('Very acidic — handle with care! This would corrode metals rapidly.');
      if (resultPH > 11) tips.push('Very alkaline — caustic solution! Can burn skin on contact.');
      if (reactionInfo && reactionInfo.gasEvolved) tips.push('CO₂ gas is being evolved — you would see fizzing/bubbling in a real lab!');
      tips.push('Try adjusting volumes to see how the pH shifts toward the excess reagent.');
    } else if (labState === 'mixed') {
      tips.push('Chemicals are mixed! Use the litmus paper test to determine the pH.');
      tips.push('Select your paper type (Red, Blue, or Universal) and click "Test pH".');
    } else {
      tips.push('Select two chemicals and click "Mix" to see the neutralization reaction.');
      tips.push('Strong acid + Strong base at equal moles gives pH = 7 (neutral).');
      tips.push('Weak acids create buffer solutions when partially neutralized.');
    }
    coachBody.innerHTML = '<ul class="coach-list">' + tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
  }

  /* ══════════════════════════════════════════════════════════════
     10. EXPLORE MODE — Acid-Base Concepts
     ══════════════════════════════════════════════════════════════ */
  var CONCEPTS = [
    { id: 'strong-acids', name: 'Strong Acids', symbol: 'HCl, H₂SO₄, HNO₃', cat: 'acids',
      formula: '100% dissociation: HA → H⁺ + A⁻', unit: 'pH < 1 at 0.1 M',
      desc: 'Strong acids completely dissociate in water. Every molecule releases its H⁺ ion(s). The pH of a strong acid depends only on its concentration and number of acidic protons: pH = −log₁₀([H⁺]).',
      example: { problem: 'Find pH of 0.1 M HCl.', steps: ['HCl → H⁺ + Cl⁻ (complete dissociation)', '[H⁺] = 0.1 M', 'pH = −log(0.1) = 1.00'], answer: '1.00' }},
    { id: 'weak-acids', name: 'Weak Acids', symbol: 'CH₃COOH, H₂CO₃', cat: 'acids',
      formula: 'Partial: HA ⇌ H⁺ + A⁻ (Ka)', unit: 'pH 2–5 at 0.1 M',
      desc: 'Weak acids only partially dissociate. The equilibrium constant Ka measures the extent of dissociation. Smaller Ka means weaker acid. Use the quadratic formula or approximation: [H⁺] ≈ √(Ka × C).',
      example: { problem: 'Find pH of 0.1 M CH₃COOH (Ka = 1.8×10⁻⁵).', steps: ['[H⁺] = √(Ka × C) = √(1.8×10⁻⁵ × 0.1)', '[H⁺] = √(1.8×10⁻⁶) = 1.34×10⁻³ M', 'pH = −log(1.34×10⁻³) = 2.87'], answer: '2.87' }},
    { id: 'strong-bases', name: 'Strong Bases', symbol: 'NaOH, KOH, Ca(OH)₂', cat: 'bases',
      formula: '100% dissociation: BOH → B⁺ + OH⁻', unit: 'pH > 13 at 0.1 M',
      desc: 'Strong bases completely dissociate releasing OH⁻ ions. pH = 14 + log₁₀([OH⁻]). Diprotic bases like Ca(OH)₂ release 2 OH⁻ per formula unit.',
      example: { problem: 'Find pH of 0.02 M Ca(OH)₂.', steps: ['Ca(OH)₂ → Ca²⁺ + 2OH⁻', '[OH⁻] = 2 × 0.02 = 0.04 M', 'pOH = −log(0.04) = 1.40', 'pH = 14 − 1.40 = 12.60'], answer: '12.60' }},
    { id: 'weak-bases', name: 'Weak Bases', symbol: 'NH₃, NaHCO₃', cat: 'bases',
      formula: 'B + H₂O ⇌ BH⁺ + OH⁻ (Kb)', unit: 'pH 8–12',
      desc: 'Weak bases partially react with water to produce OH⁻. The Kb constant measures base strength. NH₃ is a common weak base: NH₃ + H₂O ⇌ NH₄⁺ + OH⁻.',
      example: { problem: 'Find pH of 0.1 M NH₃ (Kb = 1.8×10⁻⁵).', steps: ['[OH⁻] = √(Kb × C) = √(1.8×10⁻⁵ × 0.1)', '[OH⁻] = 1.34×10⁻³ M', 'pOH = 2.87', 'pH = 14 − 2.87 = 11.13'], answer: '11.13' }},
    { id: 'neutralization', name: 'Neutralization', symbol: 'Acid + Base → Salt + H₂O', cat: 'reactions',
      formula: 'H⁺ + OH⁻ → H₂O', unit: 'ΔH ≈ −57 kJ/mol',
      desc: 'Neutralization is the reaction between an acid and a base producing a salt and water. Strong acid + strong base at equal moles gives pH 7. If one is in excess, the pH shifts toward that excess.',
      example: { problem: '50 mL of 0.1 M HCl + 50 mL of 0.1 M NaOH. Find pH.', steps: ['moles H⁺ = 0.1 × 0.05 = 0.005', 'moles OH⁻ = 0.1 × 0.05 = 0.005', 'Equal moles: complete neutralization', 'pH = 7.00 (neutral salt NaCl formed)'], answer: '7.00' }},
    { id: 'buffer', name: 'Buffer Solutions', symbol: 'HA + A⁻', cat: 'reactions',
      formula: 'pH = pKa + log([A⁻]/[HA])', unit: 'Henderson-Hasselbalch',
      desc: 'A buffer resists pH change when small amounts of acid or base are added. It contains a weak acid and its conjugate base (or weak base + conjugate acid). Henderson-Hasselbalch equation: pH = pKa + log([A⁻]/[HA]).',
      example: { problem: '100 mL of 0.1 M CH₃COOH + 50 mL of 0.1 M NaOH. Find pH.', steps: ['moles acid = 0.01, moles base = 0.005', 'After reaction: 0.005 mol HA + 0.005 mol A⁻', 'pH = pKa + log(0.005/0.005)', 'pH = 4.74 + 0 = 4.74 (buffer at half-equivalence)'], answer: '4.74' }},
    { id: 'ph-scale', name: 'The pH Scale', symbol: 'pH = −log[H⁺]', cat: 'reactions',
      formula: 'pH + pOH = 14 (at 25°C)', unit: '0–14',
      desc: 'pH measures hydrogen ion concentration on a logarithmic scale. Each unit represents a 10× change in [H⁺]. pH 7 is neutral (pure water). Below 7 is acidic, above 7 is basic. At 25°C, pH + pOH = 14 because Kw = [H⁺][OH⁻] = 10⁻¹⁴.',
      example: { problem: 'If [H⁺] = 3.2×10⁻⁴ M, find pH and pOH.', steps: ['pH = −log(3.2×10⁻⁴) = 3.49', 'pOH = 14 − 3.49 = 10.51', '[OH⁻] = 10⁻¹⁰·⁵¹ = 3.1×10⁻¹¹ M'], answer: '3.49' }},
    { id: 'indicators', name: 'pH Indicators', symbol: 'Litmus, Phenolphthalein', cat: 'reactions',
      formula: 'HIn ⇌ H⁺ + In⁻ (color change)', unit: 'Transition range',
      desc: 'pH indicators are weak acids/bases that change color at specific pH ranges. Litmus: red below pH 4.5, blue above pH 8.3. Universal indicator shows a continuous color spectrum. Phenolphthalein: colorless below pH 8.2, pink above.',
      example: { problem: 'What color is litmus paper in pH 3 solution?', steps: ['pH 3 < 4.5 (litmus transition)', 'Blue litmus turns RED', 'Red litmus stays RED', 'Universal indicator shows RED/ORANGE'], answer: 'Red' }},
    { id: 'dilution', name: 'Dilution', symbol: 'C₁V₁ = C₂V₂', cat: 'applications',
      formula: 'Moles before = Moles after', unit: 'mol',
      desc: 'Dilution changes concentration but not the number of moles. When you mix two solutions of the same solute, the final concentration is: C_f = (C₁V₁ + C₂V₂) / (V₁ + V₂). pH changes logarithmically with dilution.',
      example: { problem: '100 mL of 0.1 M HCl diluted to 500 mL. Find new pH.', steps: ['moles = 0.1 × 0.1 = 0.01 mol', 'New [HCl] = 0.01/0.5 = 0.02 M', 'pH = −log(0.02) = 1.70'], answer: '1.70' }},
    { id: 'titration', name: 'Titration', symbol: 'Endpoint', cat: 'applications',
      formula: 'C_a V_a n_a = C_b V_b n_b', unit: 'mol',
      desc: 'Titration determines unknown concentration by reacting with a standard solution until the equivalence point. The endpoint is detected by an indicator color change. At equivalence: moles acid × n = moles base × n.',
      example: { problem: '25 mL of HCl neutralized by 30 mL of 0.1 M NaOH. Find [HCl].', steps: ['At equivalence: C_a × V_a = C_b × V_b', 'C_a × 25 = 0.1 × 30', 'C_a = 3.0/25 = 0.12 M'], answer: '0.12 M' }},
    { id: 'salts', name: 'Salt Hydrolysis', symbol: 'Salt + H₂O', cat: 'applications',
      formula: 'pH depends on parent acid/base strength', unit: 'pH',
      desc: 'Salts dissolve to give neutral, acidic, or basic solutions depending on parent acid/base. Strong acid + strong base → neutral salt (NaCl, pH 7). Strong acid + weak base → acidic salt (NH₄Cl). Weak acid + strong base → basic salt (CH₃COONa).',
      example: { problem: 'Predict pH of 0.1 M CH₃COONa solution.', steps: ['Parent: weak acid CH₃COOH + strong base NaOH', 'CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻', 'Kb = Kw/Ka = 10⁻¹⁴/1.8×10⁻⁵ = 5.6×10⁻¹⁰', 'pH ≈ 8.72 (basic)'], answer: '~8.72' }},
    { id: 'everyday', name: 'Everyday Acids & Bases', symbol: 'Food, Cleaning, Body', cat: 'applications',
      formula: 'Stomach acid pH ≈ 1.5, Blood pH ≈ 7.4', unit: 'pH',
      desc: 'Acids and bases are everywhere: stomach acid (HCl, pH 1.5), lemon juice (citric acid, pH 2), vinegar (acetic acid, pH 3), blood (buffered at pH 7.4), baking soda (pH 8.3), soap (pH 9–10), bleach (pH 12–13), drain cleaner (NaOH, pH 14).',
      example: { problem: 'Why does antacid (Mg(OH)₂) relieve heartburn?', steps: ['Stomach acid: HCl at pH ≈ 1.5', 'Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O', 'Neutralizes excess acid', 'Raises stomach pH toward normal (~2–3)'], answer: 'Neutralization' }}
  ];

  /* ══════════════════════════════════════════════════════════════
     11. PRACTICE PROBLEMS
     ══════════════════════════════════════════════════════════════ */
  function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function randFloat(a, b, d) { return +(a + Math.random() * (b - a)).toFixed(d || 1); }

  var PROBLEM_GEN = [
    function () {
      var c = randFloat(0.01, 0.5, 2);
      var pH = +(-Math.log10(c)).toFixed(2);
      return { prompt: 'Find pH of ' + c + ' M HCl (strong acid).', steps: ['[H⁺] = ' + c + ' M (complete dissociation)', 'pH = −log(' + c + ')', 'pH = ' + pH], answer: pH, unit: '', tol: 0.05 };
    },
    function () {
      var c = randFloat(0.01, 0.5, 2);
      var oh = c; var pOH = +(-Math.log10(oh)).toFixed(2); var pH = +(14 - pOH).toFixed(2);
      return { prompt: 'Find pH of ' + c + ' M NaOH (strong base).', steps: ['[OH⁻] = ' + c + ' M', 'pOH = −log(' + c + ') = ' + pOH, 'pH = 14 − ' + pOH + ' = ' + pH], answer: pH, unit: '', tol: 0.05 };
    },
    function () {
      var Ka = 1.8e-5; var c = randFloat(0.05, 0.5, 2);
      var h = Math.sqrt(Ka * c); var pH = +(-Math.log10(h)).toFixed(2);
      return { prompt: 'Find pH of ' + c + ' M CH₃COOH (Ka = 1.8×10⁻⁵).', steps: ['[H⁺] = √(Ka×C) = √(1.8×10⁻⁵ × ' + c + ')', '[H⁺] = ' + h.toExponential(2), 'pH = ' + pH], answer: pH, unit: '', tol: 0.1 };
    },
    function () {
      var va = randInt(20, 100); var vb = randInt(20, 100);
      var ma = 0.1 * va / 1000; var mb = 0.1 * vb / 1000;
      var vt = (va + vb) / 1000; var pH;
      if (Math.abs(ma - mb) < 1e-10) { pH = 7.00; }
      else if (ma > mb) { pH = +(-Math.log10((ma - mb) / vt)).toFixed(2); }
      else { pH = +(14 + Math.log10((mb - ma) / vt)).toFixed(2); }
      return { prompt: va + ' mL of 0.1 M HCl + ' + vb + ' mL of 0.1 M NaOH. Find pH.', steps: ['moles H⁺ = 0.1 × ' + (va / 1000).toFixed(3) + ' = ' + ma.toFixed(4), 'moles OH⁻ = 0.1 × ' + (vb / 1000).toFixed(3) + ' = ' + mb.toFixed(4), ma > mb ? 'Excess acid: [H⁺] = ' + ((ma - mb) / vt).toExponential(2) : mb > ma ? 'Excess base: [OH⁻] = ' + ((mb - ma) / vt).toExponential(2) : 'Equal moles: neutral', 'pH = ' + pH], answer: pH, unit: '', tol: 0.1 };
    },
    function () {
      var va = 100; var vb = randInt(30, 80);
      var molesA = 0.1 * va / 1000; var molesOH = 0.1 * vb / 1000;
      var pKa = -Math.log10(1.8e-5);
      var rem = molesA - molesOH; var conj = molesOH;
      var pH = +(pKa + Math.log10(conj / rem)).toFixed(2);
      return { prompt: va + ' mL of 0.1 M CH₃COOH + ' + vb + ' mL of 0.1 M NaOH. Find pH.', steps: ['moles acid = ' + molesA.toFixed(4) + ', moles OH⁻ = ' + molesOH.toFixed(4), 'Excess acid → buffer forms', 'pH = pKa + log([A⁻]/[HA])', 'pH = 4.74 + log(' + conj.toFixed(4) + '/' + rem.toFixed(4) + ') = ' + pH], answer: pH, unit: '', tol: 0.15 };
    },
    function () {
      var c = randFloat(0.01, 0.2, 2); var nH = 2;
      var h = c * nH; var pH = +(-Math.log10(h)).toFixed(2);
      return { prompt: 'Find pH of ' + c + ' M H₂SO₄ (strong diprotic acid).', steps: ['H₂SO₄ → 2H⁺ + SO₄²⁻', '[H⁺] = 2 × ' + c + ' = ' + h, 'pH = −log(' + h + ') = ' + pH], answer: pH, unit: '', tol: 0.05 };
    },
    function () {
      var c = randFloat(0.01, 0.05, 3); var nOH = 2;
      var oh = c * nOH; var pOH = +(-Math.log10(oh)).toFixed(2); var pH = +(14 - pOH).toFixed(2);
      return { prompt: 'Find pH of ' + c + ' M Ca(OH)₂.', steps: ['Ca(OH)₂ → Ca²⁺ + 2OH⁻', '[OH⁻] = 2 × ' + c + ' = ' + oh.toFixed(4), 'pOH = ' + pOH, 'pH = ' + pH], answer: pH, unit: '', tol: 0.1 };
    },
    function () {
      var Kb = 1.8e-5; var c = randFloat(0.05, 0.5, 2);
      var oh = Math.sqrt(Kb * c); var pOH = +(-Math.log10(oh)).toFixed(2); var pH = +(14 - pOH).toFixed(2);
      return { prompt: 'Find pH of ' + c + ' M NH₃ (Kb = 1.8×10⁻⁵).', steps: ['[OH⁻] = √(Kb×C) = √(1.8×10⁻⁵ × ' + c + ')', '[OH⁻] = ' + oh.toExponential(2), 'pOH = ' + pOH + ', pH = ' + pH], answer: pH, unit: '', tol: 0.1 };
    }
  ];

  /* ══════════════════════════════════════════════════════════════
     12. QUIZ POOL
     ══════════════════════════════════════════════════════════════ */
  var QUIZ_POOL = [
    { q: 'pH of 0.1 M HCl?', opts: ['0', '1', '7', '13'], correct: 1 },
    { q: 'pH of 0.1 M NaOH?', opts: ['1', '7', '13', '14'], correct: 2 },
    { q: 'Which is a weak acid?', opts: ['HCl', 'HNO₃', 'CH₃COOH', 'H₂SO₄'], correct: 2 },
    { q: 'Strong acid + strong base (equal moles) gives pH?', opts: ['0', '7', '14', 'Depends on acid'], correct: 1 },
    { q: 'What does Ka measure?', opts: ['Base strength', 'Acid dissociation', 'Salt solubility', 'Reaction speed'], correct: 1 },
    { q: 'Which indicator turns pink in base?', opts: ['Litmus', 'Methyl orange', 'Phenolphthalein', 'Bromothymol blue'], correct: 2 },
    { q: 'pH + pOH = ?', opts: ['7', '10', '14', 'Depends on temp'], correct: 2 },
    { q: 'Weak acid + strong base at equivalence → ?', opts: ['pH = 7', 'pH > 7', 'pH < 7', 'No reaction'], correct: 1 },
    { q: 'Buffer solution contains:', opts: ['Strong acid only', 'Weak acid + conjugate base', 'Two strong acids', 'Pure water'], correct: 1 },
    { q: 'Henderson-Hasselbalch equation is:', opts: ['pH = pKa + log([HA]/[A⁻])', 'pH = pKa + log([A⁻]/[HA])', 'pH = Ka × C', 'pH = 14 − pOH'], correct: 1 },
    { q: 'NaHCO₃ solution is:', opts: ['Strongly acidic', 'Neutral', 'Slightly basic', 'Strongly basic'], correct: 2 },
    { q: 'Carbonic acid reacts with NaOH to produce:', opts: ['NaCl + H₂O', 'Na₂CO₃ + H₂O', 'NaHCO₃ only', 'No reaction'], correct: 1 },
    { q: 'Which has lowest pH at 0.1 M?', opts: ['CH₃COOH', 'H₃PO₄', 'HCl', 'H₂CO₃'], correct: 2 },
    { q: 'Milk of magnesia (Mg(OH)₂) is used as:', opts: ['Fertilizer', 'Fuel', 'Antacid', 'Bleach'], correct: 2 },
    { q: 'What gas is produced when acid reacts with Na₂CO₃?', opts: ['H₂', 'O₂', 'CO₂', 'N₂'], correct: 2 }
  ];

  /* ══════════════════════════════════════════════════════════════
     13. CHEMICAL SELECTORS
     ══════════════════════════════════════════════════════════════ */
  function buildSelectors() {
    selChemA.innerHTML = '';
    selChemB.innerHTML = '';
    var acidGroup = '<optgroup label="Acids">';
    var baseGroup = '<optgroup label="Bases">';
    ALL_CHEMICALS.forEach(function (c, i) {
      var opt = '<option value="' + i + '">' + c.name + ' (' + c.formula + ') — ' + c.conc + ' M</option>';
      if (i < 7) acidGroup += opt; else baseGroup += opt;
    });
    acidGroup += '</optgroup>'; baseGroup += '</optgroup>';
    selChemA.innerHTML = acidGroup + baseGroup;
    selChemB.innerHTML = acidGroup + baseGroup;
    selChemA.value = chemAIdx;
    selChemB.value = chemBIdx;
  }
  buildSelectors();

  /* ══════════════════════════════════════════════════════════════
     14. MODE SWITCHING
     ══════════════════════════════════════════════════════════════ */
  function setMode(m) {
    mode = m;
    var sects = ['sim-panel', 'cat-row', 'item-selector', 'item-info', 'practice-panel', 'practice-bar', 'quiz-panel', 'quiz-bar', 'quiz-result', 'learn-panels', 'canvas-action-bar'];
    sects.forEach(function (id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; });

    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.mode === m); });

    if (m === 'simulate') {
      simPanel.style.display = '';
      canvasActionBar.style.display = '';
      learnPanels.style.display = '';
    } else if (m === 'explore') {
      catRow.style.display = '';
      itemSelector.style.display = '';
      buildExploreGrid();
    } else if (m === 'practice') {
      practicePanel.style.display = '';
      practiceBar.style.display = '';
      if (!currentProblem) newProblem();
    } else if (m === 'quiz') {
      quizPanel.style.display = '';
      quizBar.style.display = '';
      startQuiz();
    }
    draw();
  }

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (pill && pill.dataset.mode) setMode(pill.dataset.mode);
  });

  /* ══════════════════════════════════════════════════════════════
     15. EXPLORE MODE
     ══════════════════════════════════════════════════════════════ */
  function buildExploreGrid() {
    conceptGrid.innerHTML = '';
    CONCEPTS.forEach(function (c) {
      if (c.cat !== exploreCat) return;
      var btn = document.createElement('button');
      btn.className = 'is-btn' + (selectedConcept === c ? ' active' : '');
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () { selectConcept(c); });
      conceptGrid.appendChild(btn);
    });
  }

  function selectConcept(c) {
    selectedConcept = c;
    buildExploreGrid();
    itemInfo.style.display = '';
    itemInfo.innerHTML = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>' +
      '<div class="formula-box"><span class="fb-formula">' + c.formula + '</span><span class="fb-unit">' + c.unit + '</span></div>' +
      '<p class="ii-desc">' + c.desc + '</p>' +
      (c.example ? '<div class="example-box"><h4>Worked Example</h4><p class="ex-problem">' + c.example.problem + '</p>' +
      c.example.steps.map(function (s) { return '<p class="ex-step">' + s + '</p>'; }).join('') +
      '<p class="ex-step"><strong>Answer: ' + c.example.answer + '</strong></p></div>' : '');
  }

  document.getElementById('cat-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.cat) return;
    exploreCat = pill.dataset.cat;
    document.querySelectorAll('#cat-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.cat === exploreCat); });
    selectedConcept = null;
    itemInfo.style.display = 'none';
    buildExploreGrid();
  });

  /* ══════════════════════════════════════════════════════════════
     16. PRACTICE MODE
     ══════════════════════════════════════════════════════════════ */
  function newProblem() {
    var gen = PROBLEM_GEN[randInt(0, PROBLEM_GEN.length - 1)];
    currentProblem = gen();
    practiceAnswered = false;
    ppPrompt.textContent = currentProblem.prompt;
    ppInput.value = '';
    ppUnit.textContent = currentProblem.unit;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppNext.style.display = 'none';
    ppCheck.style.display = '';
    ppShow.style.display = '';
  }

  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Enter a number'; ppFeedback.className = 'feedback err'; return; }
    practiceAnswered = true;
    practiceTotal++;
    var diff = Math.abs(val - currentProblem.answer);
    if (diff <= (currentProblem.tol || 0.1)) {
      practiceScore++;
      ppFeedback.textContent = '✓ Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '✗ Answer: ' + currentProblem.answer;
      ppFeedback.className = 'feedback err';
    }
    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;
    ppNext.style.display = '';
    ppCheck.style.display = 'none';
    ppShow.style.display = 'none';
    showSolution();
  });

  ppShow.addEventListener('click', function () {
    if (practiceAnswered) return;
    practiceAnswered = true;
    practiceTotal++;
    ppFeedback.textContent = 'Solution shown';
    ppFeedback.className = 'feedback err';
    pbarScoreVal.textContent = practiceScore + ' / ' + practiceTotal;
    ppNext.style.display = '';
    ppCheck.style.display = 'none';
    ppShow.style.display = 'none';
    showSolution();
  });

  ppNext.addEventListener('click', newProblem);

  function showSolution() {
    if (!currentProblem) return;
    ppSolution.style.display = '';
    ppSolution.innerHTML = '<h4>Solution</h4>' + currentProblem.steps.map(function (s) { return '<p class="sol-step">' + s + '</p>'; }).join('');
  }

  /* ══════════════════════════════════════════════════════════════
     17. QUIZ MODE
     ══════════════════════════════════════════════════════════════ */
  function startQuiz() {
    var pool = QUIZ_POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) { var j = randInt(0, i); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    quizSet = pool.slice(0, QUIZ_SIZE);
    quizIdx = 0; quizScore = 0; quizAnswered = false; quizAnswers = [];
    quizResult.style.display = 'none';
    showQuizQuestion();
  }

  function showQuizQuestion() {
    if (quizIdx >= QUIZ_SIZE) { showQuizResult(); return; }
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;
    quizPanel.innerHTML = '<p class="qp-prompt">' + q.q + '</p><div class="answer-grid">' +
      q.opts.map(function (o, i) { return '<button class="answer-btn" data-idx="' + i + '">' + o + '</button>'; }).join('') + '</div>';
    quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { answerQuiz(parseInt(btn.dataset.idx)); });
    });
  }

  function answerQuiz(idx) {
    if (quizAnswered) return;
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var correct = idx === q.correct;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.q, picked: idx, correct: q.correct, ok: correct });

    quizPanel.querySelectorAll('.answer-btn').forEach(function (btn, i) {
      btn.classList.add('locked');
      if (i === q.correct) btn.classList.add('correct');
      if (i === idx && !correct) btn.classList.add('wrong');
    });

    setTimeout(function () { quizIdx++; showQuizQuestion(); }, 1200);
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';
    var pct = quizScore / QUIZ_SIZE;
    var cls = pct >= 0.8 ? 'perfect' : pct >= 0.5 ? 'good' : 'poor';
    var stars = '';
    for (var i = 0; i < QUIZ_SIZE; i++) stars += i < quizScore ? '⭐' : '☆';

    quizResult.innerHTML = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">' + stars + '</span></div><div class="qr-score-wrap"><span class="qr-score ' + cls + '">' + quizScore + '/' + QUIZ_SIZE + '</span></div></div>' +
      '<div class="qr-rows">' + quizAnswers.map(function (a, i) {
        return '<div class="qr-row ' + (a.ok ? 'ok' : 'err') + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + a.q + '</span><span class="qr-mark">' + (a.ok ? '✓' : '✗') + '</span></div>';
      }).join('') + '</div>' +
      '<button class="btn btn-primary" id="btn-retry-quiz">Retry Quiz</button>';
    document.getElementById('btn-retry-quiz').addEventListener('click', function () {
      quizResult.style.display = 'none';
      quizPanel.style.display = '';
      quizBar.style.display = '';
      startQuiz();
    });
  }

  /* ══════════════════════════════════════════════════════════════
     18. EVENT WIRING
     ══════════════════════════════════════════════════════════════ */
  selChemA.addEventListener('change', function () { chemAIdx = parseInt(selChemA.value); resetLab(); });
  selChemB.addEventListener('change', function () { chemBIdx = parseInt(selChemB.value); resetLab(); });

  function syncVol(slider, input, setter) {
    slider.addEventListener('input', function () { var v = parseFloat(slider.value); input.value = v; setter(v); });
    input.addEventListener('change', function () { var v = Math.max(10, Math.min(200, parseFloat(input.value) || 100)); input.value = v; slider.value = v; setter(v); });
  }
  syncVol(slVolA, inVolA, function (v) { volA = v; draw(); });
  syncVol(slVolB, inVolB, function (v) { volB = v; draw(); });

  btnMix.addEventListener('click', function () {
    if (labState !== 'idle') resetLab();
    btnMix.disabled = true;
    btnTest.disabled = true;
    startMixAnimation();
    setTimeout(function () { btnTest.disabled = false; }, 7500);
  });

  btnTest.addEventListener('click', function () {
    if (labState !== 'mixed') return;
    startLitmusTest();
  });

  btnReset.addEventListener('click', resetLab);

  /* Paper type selector */
  document.getElementById('paper-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill || !pill.dataset.paper) return;
    paperType = pill.dataset.paper;
    document.querySelectorAll('#paper-tabs .pill').forEach(function (p) { p.classList.toggle('active', p.dataset.paper === paperType); });
    draw();
  });

  /* PNG Export */
  btnPng.addEventListener('click', function () {
    var link = document.createElement('a');
    link.download = 'chemical-mixing-' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  /* Context menu */
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    ctxMenu.style.left = e.pageX + 'px';
    ctxMenu.style.top = e.pageY + 'px';
    ctxMenu.style.display = 'block';
  });
  document.addEventListener('click', function () { ctxMenu.style.display = 'none'; });
  ctxMenu.addEventListener('click', function (e) {
    var item = e.target.closest('.ctx-item');
    if (!item) return;
    var action = item.dataset.ctx;
    if (action === 'png') btnPng.click();
    else if (action === 'reset') resetLab();
    else if (action === 'copy-ph' && resultPH !== null) {
      navigator.clipboard.writeText('pH = ' + resultPH.toFixed(2));
    }
    ctxMenu.style.display = 'none';
  });

  /* ══════════════════════════════════════════════════════════════
     19. INIT
     ══════════════════════════════════════════════════════════════ */
  updateReadouts();
  draw();
  setMode('simulate');

})();
