(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     1. CHEMICAL DATABASE
     ══════════════════════════════════════════════════════════════ */
  var CHEMICALS = [
    { name: 'Hydrochloric Acid', formula: 'HCl',           pH: 1,   color: 'rgba(200,210,220,0.35)', category: 'strong-acid' },
    { name: 'Sulfuric Acid',     formula: 'H₂SO₄', pH: 1,   color: 'rgba(200,210,220,0.30)', category: 'strong-acid' },
    { name: 'Lemon Juice',       formula: 'Citric Acid',   pH: 2,   color: 'rgba(255,235,59,0.55)',  category: 'weak-acid' },
    { name: 'Vinegar',           formula: 'CH₃COOH',  pH: 3,   color: 'rgba(210,170,100,0.50)', category: 'weak-acid' },
    { name: 'Tomato Juice',      formula: 'Mixed Acids',   pH: 4,   color: 'rgba(230,80,40,0.55)',   category: 'weak-acid' },
    { name: 'Black Coffee',      formula: 'Mixed Acids',   pH: 5,   color: 'rgba(80,50,30,0.75)',    category: 'weak-acid' },
    { name: 'Milk',              formula: 'Lactic Acid',   pH: 6,   color: 'rgba(255,250,240,0.80)', category: 'weak-acid' },
    { name: 'Pure Water',        formula: 'H₂O',      pH: 7,   color: 'rgba(100,180,255,0.18)', category: 'neutral' },
    { name: 'Blood',             formula: 'Plasma',        pH: 7.4, color: 'rgba(180,30,30,0.60)',   category: 'neutral' },
    { name: 'Baking Soda',       formula: 'NaHCO₃',   pH: 8,   color: 'rgba(230,230,240,0.45)', category: 'weak-base' },
    { name: 'Borax Solution',    formula: 'Na₂B₄O₇', pH: 9,   color: 'rgba(200,210,220,0.25)', category: 'weak-base' },
    { name: 'Milk of Magnesia',  formula: 'Mg(OH)₂',  pH: 10,  color: 'rgba(240,240,250,0.75)', category: 'weak-base' },
    { name: 'Ammonia Solution',  formula: 'NH₃',      pH: 11,  color: 'rgba(220,220,180,0.25)', category: 'strong-base' },
    { name: 'Bleach',            formula: 'NaClO',         pH: 13,  color: 'rgba(210,230,180,0.30)', category: 'strong-base' },
    { name: 'Sodium Hydroxide',  formula: 'NaOH',          pH: 14,  color: 'rgba(200,210,220,0.22)', category: 'strong-base' }
  ];

  /* pH indicator colour map */
  var PH_COLORS = {
    1:  '#ff1744', 2:  '#ff5722', 3:  '#ff9800', 4:  '#ffc107',
    5:  '#ffeb3b', 6:  '#cddc39', 7:  '#4caf50', 8:  '#009688',
    9:  '#00bcd4', 10: '#2196f3', 11: '#3f51b5', 12: '#673ab7',
    13: '#9c27b0', 14: '#4a148c'
  };

  /* Helper: parse hex to [r,g,b] */
  function hexToRgb(hex) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  function rgbStr(r, g, b) { return 'rgb(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ')'; }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpColor(c1, c2, t) {
    return rgbStr(lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t));
  }

  function classify(pH) {
    if (pH <= 2) return 'Strong Acid';
    if (pH <= 6) return 'Weak Acid';
    if (pH <= 7.5) return 'Neutral';
    if (pH <= 10) return 'Weak Base';
    return 'Strong Base';
  }

  function getPHColor(pH) {
    var lo = Math.floor(pH);
    var hi = Math.ceil(pH);
    if (lo < 1) lo = 1;
    if (hi > 14) hi = 14;
    if (lo === hi) return hexToRgb(PH_COLORS[lo]);
    var t = pH - lo;
    var c1 = hexToRgb(PH_COLORS[lo]);
    var c2 = hexToRgb(PH_COLORS[hi]);
    return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
  }

  /* ══════════════════════════════════════════════════════════════
     2. DOM REFS
     ══════════════════════════════════════════════════════════════ */
  var canvas = document.getElementById('main-canvas');
  var ctx = canvas.getContext('2d');

  /* Logical drawing surface (CSS-independent). The backing store is scaled by
     devicePixelRatio so every graphic stays crisp on Hi-DPI / upscaled canvases. */
  var CW = 900, CH = 520, DPR = 1;
  function setupCanvas() {
    DPR = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.round(CW * DPR);
    canvas.height = Math.round(CH * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  setupCanvas();

  var modeTabs = document.getElementById('mode-tabs');
  var secSimulate = document.getElementById('sec-simulate');
  var secExplore = document.getElementById('sec-explore');
  var secPractice = document.getElementById('sec-practice');
  var secQuiz = document.getElementById('sec-quiz');

  var chemBtns = document.getElementById('chem-btns');
  var paperTabs = document.getElementById('paper-tabs');

  var btnPour = document.getElementById('btn-pour');
  var btnDip = document.getElementById('btn-dip');
  var btnReset = document.getElementById('btn-reset');
  var btnExportPng = document.getElementById('btn-export-png');
  var btnCopyResult = document.getElementById('btn-copy-result');

  /* Readout value spans */
  var roName = document.querySelector('#ro-name .ro-value');
  var roFormula = document.querySelector('#ro-formula .ro-value');
  var roPH = document.querySelector('#ro-ph .ro-value');
  var roClass = document.querySelector('#ro-class .ro-value');
  var roLitmus = document.querySelector('#ro-litmus .ro-value');

  /* Readout cells (for show/hide) */
  var cellRoName = document.getElementById('ro-name');
  var cellRoFormula = document.getElementById('ro-formula');
  var cellRoPH = document.getElementById('ro-ph');
  var cellRoClass = document.getElementById('ro-class');
  var cellRoLitmus = document.getElementById('ro-litmus');

  var exploreTabs = document.getElementById('explore-tabs');
  var exploreCards = document.getElementById('explore-cards');

  var btnNewQ = document.getElementById('btn-new-q');
  var btnCheck = document.getElementById('btn-check');
  var btnShowSol = document.getElementById('btn-show-sol');
  var pScore = document.getElementById('p-score');
  var pTotal = document.getElementById('p-total');
  var pqText = document.getElementById('pq-text');
  var pqInputRow = document.getElementById('pq-input-row');
  var pqInput = document.getElementById('pq-input');
  var pqUnit = document.getElementById('pq-unit');
  var pqMcq = document.getElementById('pq-mcq');
  var pqFeedback = document.getElementById('pq-feedback');
  var pqSolution = document.getElementById('pq-solution');

  var btnStartQuiz = document.getElementById('btn-start-quiz');
  var btnSubmitQ = document.getElementById('btn-submit-q');
  var btnNextQ = document.getElementById('btn-next-q');
  var quizCounter = document.getElementById('quiz-counter');
  var qqText = document.getElementById('qq-text');
  var qqOptions = document.getElementById('qq-options');
  var qqInputRow = document.getElementById('qq-input-row');
  var qqInput = document.getElementById('qq-input');
  var qqUnit = document.getElementById('qq-unit');
  var qqFeedback = document.getElementById('qq-feedback');
  var quizResultDiv = document.getElementById('quiz-result');

  /* Context menu */
  var ctxMenu = document.getElementById('canvas-ctx-menu');

  /* Custom pH panel */
  var customPanel = document.getElementById('custom-panel');
  var customNameInput = document.getElementById('custom-name-input');
  var customPhSlider = document.getElementById('custom-ph-slider');
  var customPhDisplay = document.getElementById('custom-ph-display');
  var btnCustomTest = document.getElementById('btn-custom-test');
  var btnCustomCancel = document.getElementById('btn-custom-cancel');

  /* ══════════════════════════════════════════════════════════════
     3. STATE
     ══════════════════════════════════════════════════════════════ */
  var mode = 'simulate';
  var chemIdx = -1;
  var paperType = 'red'; // red | blue | universal
  var labState = 'idle'; // idle | pouring | poured | dipping | dipped | result

  /* Animation progress values 0-1 */
  var pourProgress = 0;
  var dipProgress = 0;
  var colorProgress = 0;
  var animRAF = null;
  var animStart = 0;

  /* Chain instruction state */
  var chainStep = 0;
  var prevChainStep = 0;
  var chainLineAnim = 0;
  var chainAnimRAF2 = null;
  var chainAnimStart2 = 0;
  var CHAIN_DUR = 650;

  /* Custom chemical slot */
  var customChemIndex = -1;

  /* Practice state */
  var practiceScore = 0;
  var practiceTotal = 0;
  var currentProblem = null;
  var practiceSelected = -1;

  /* Quiz state */
  var QUIZ_SIZE = 5;
  var quizSet = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswers = [];
  var quizLocked = false;

  /* ══════════════════════════════════════════════════════════════
     4. SOUND EFFECTS (Web Audio API)
     ══════════════════════════════════════════════════════════════ */
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playPourSound() {
    try {
      var ac = getAudioCtx();
      var dur = 1.2;
      var buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.8;
      }
      var src = ac.createBufferSource();
      src.buffer = buf;
      var filter = ac.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, ac.currentTime);
      filter.frequency.linearRampToValueAtTime(180, ac.currentTime + dur);
      filter.Q.value = 0.8;
      var gain = ac.createGain();
      gain.gain.setValueAtTime(0.25, ac.currentTime);
      gain.gain.linearRampToValueAtTime(0, ac.currentTime + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      src.start();
      src.stop(ac.currentTime + dur);
    } catch (e) {}
  }

  function playDipSound() {
    try {
      var ac = getAudioCtx();
      var osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ac.currentTime + 0.18);
      var gain = ac.createGain();
      gain.gain.setValueAtTime(0.2, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + 0.22);
    } catch (e) {}
  }

  function playResultChime() {
    try {
      var ac = getAudioCtx();
      var freqs = [523, 659, 784]; /* C5 E5 G5 */
      freqs.forEach(function (f, i) {
        var osc = ac.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = f;
        var gain = ac.createGain();
        var t = ac.currentTime + i * 0.13;
        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } catch (e) {}
  }

  /* ══════════════════════════════════════════════════════════════
     5. CHAIN INSTRUCTION HELPERS
     ══════════════════════════════════════════════════════════════ */
  function getChainStep() {
    if (chemIdx < 0) return 0;
    if (labState === 'idle') return 1;
    if (labState === 'pouring' || labState === 'poured') return 2;
    return 3;
  }

  function advanceChain() {
    var target = getChainStep();
    if (target === chainStep) return;
    prevChainStep = chainStep;
    chainStep = target;
    chainLineAnim = 0;
    chainAnimStart2 = performance.now();
    if (chainAnimRAF2) { cancelAnimationFrame(chainAnimRAF2); chainAnimRAF2 = null; }
    animateChainLine();
  }

  function animateChainLine() {
    var elapsed = performance.now() - chainAnimStart2;
    chainLineAnim = Math.min(elapsed / CHAIN_DUR, 1);
    draw();
    if (chainLineAnim < 1) {
      chainAnimRAF2 = requestAnimationFrame(animateChainLine);
    } else {
      chainAnimRAF2 = null;
    }
  }

  function drawChainInstructions() {
    var steps = [
      { label: 'Select Chemical', sub: 'Click a chemical above' },
      { label: 'Pour Chemical',   sub: 'Click “Pour Chemical”' },
      { label: 'Dip Paper',       sub: 'Click “Dip Paper”' },
      { label: 'View Result',     sub: 'Check the readout panel' }
    ];

    var x = 14;
    var y = 20;
    var nodeR = 10;
    var stepH = 58;
    var panelW = 176;
    var panelH = steps.length * stepH + 4;

    ctx.fillStyle = 'rgba(10,14,20,0.84)';
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 12, panelW, panelH, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(245,200,66,0.22)';
    ctx.lineWidth = 1;
    ctx.stroke();

    steps.forEach(function (step, i) {
      var isDone   = i < chainStep;
      var isActive = i === chainStep;
      var sy = y + i * stepH;
      var nx = x + nodeR;
      var ny = sy + nodeR;

      ctx.beginPath();
      ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
      if (isDone) {
        ctx.fillStyle = '#3ddc84';
      } else if (isActive) {
        ctx.fillStyle = '#f5c842';
      } else {
        ctx.fillStyle = 'rgba(42,48,80,0.7)';
      }
      ctx.fill();
      if (!isDone && !isActive) {
        ctx.strokeStyle = '#3a4070';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = (isDone || isActive) ? '#0d1117' : '#4a5580';
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isDone ? '✓' : String(i + 1), nx, ny + 3.5);

      ctx.textAlign = 'left';
      ctx.font = isActive ? 'bold 12px Segoe UI, sans-serif' : '11px Segoe UI, sans-serif';
      ctx.fillStyle = isActive ? '#f5c842' : isDone ? '#3ddc84' : '#4a5580';
      ctx.fillText(step.label, nx + nodeR + 7, ny + 1);

      if (isActive) {
        ctx.fillStyle = 'rgba(245,200,66,0.58)';
        ctx.font = '9px Segoe UI, sans-serif';
        ctx.fillText(step.sub, nx + nodeR + 7, ny + 14);
      }

      if (i < steps.length - 1) {
        var lineX  = nx;
        var lineY1 = ny + nodeR + 3;
        var lineY2 = y + (i + 1) * stepH - nodeR - 2;
        var lineFrac;
        if (i < prevChainStep) {
          lineFrac = 1;
        } else if (i === prevChainStep && chainStep > prevChainStep) {
          lineFrac = chainLineAnim;
        } else {
          lineFrac = 0;
        }

        if (lineFrac > 0) {
          var drawLen = (lineY2 - lineY1) * lineFrac;
          ctx.strokeStyle = (i < chainStep) ? '#3ddc84' : '#f5c842';
          ctx.lineWidth = 2;
          if (lineFrac < 1) { ctx.setLineDash([4, 3]); }
          ctx.beginPath();
          ctx.moveTo(lineX, lineY1);
          ctx.lineTo(lineX, lineY1 + drawLen);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════════════
     6. READOUT VISIBILITY (E4)
     ══════════════════════════════════════════════════════════════ */
  function syncReadoutVisibility() {
    var showInfo = chemIdx >= 0 && labState !== 'idle';
    cellRoName.classList.toggle('hidden', !showInfo);
    cellRoFormula.classList.toggle('hidden', !showInfo);
    cellRoPH.classList.toggle('hidden', !showInfo);
    cellRoClass.classList.toggle('hidden', !showInfo);
    cellRoLitmus.classList.toggle('hidden', !showInfo);
    /* Export buttons visible only after result */
    var showExport = labState === 'result';
    btnExportPng.classList.toggle('hidden', !showExport);
    btnCopyResult.classList.toggle('hidden', !showExport);
  }

  /* ══════════════════════════════════════════════════════════════
     7. CHEMICAL BUTTONS
     ══════════════════════════════════════════════════════════════ */
  function buildChemBtns() {
    chemBtns.innerHTML = '';
    CHEMICALS.forEach(function (c, i) {
      var btn = document.createElement('button');
      btn.className = 'chem-btn' + (i === chemIdx ? ' active' : '');
      var dotColor = PH_COLORS[Math.round(c.pH)] || '#4caf50';
      var label = c.isCustom ? ('★ ' + c.name) : c.name;
      btn.innerHTML = '<span class="chem-dot" style="background:' + dotColor + '"></span>' +
        label + ' <span class="chem-ph">pH ' + c.pH + '</span>';
      btn.addEventListener('pointerdown', function () { selectChemical(i); });
      chemBtns.appendChild(btn);
    });

    /* + Custom button */
    var addBtn = document.createElement('button');
    addBtn.className = 'chem-btn chem-btn-add';
    addBtn.textContent = '+ Custom';
    addBtn.addEventListener('pointerdown', toggleCustomPanel);
    chemBtns.appendChild(addBtn);
  }

  function updateGuideBlink() {
    btnPour.classList.remove('guide-blink');
    btnDip.classList.remove('guide-blink');
    btnReset.classList.remove('guide-blink');
    if (labState === 'result' || labState === 'dipped') {
      btnReset.classList.add('guide-blink');
    } else if (labState === 'poured') {
      btnDip.classList.add('guide-blink');
    } else if (labState === 'idle' && chemIdx >= 0) {
      btnPour.classList.add('guide-blink');
    }
  }

  function selectChemical(i) {
    if (labState !== 'idle') {
      if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
      stopAmbient();
      pourProgress = 0;
      dipProgress  = 0;
      colorProgress = 0;
      labState = 'idle';
      btnDip.disabled = true;
      roName.textContent    = '--';
      roFormula.textContent = '--';
      roPH.textContent      = '--';
      roPH.style.color      = '';
      roClass.textContent   = '--';
      roLitmus.textContent  = '--';
      prevChainStep = 0;
      chainStep     = 0;
      chainLineAnim = 0;
      if (chainAnimRAF2) { cancelAnimationFrame(chainAnimRAF2); chainAnimRAF2 = null; }
    }
    chemIdx = i;
    var btns = chemBtns.querySelectorAll('.chem-btn');
    btns.forEach(function (b, j) { b.classList.toggle('active', j === i); });
    btnPour.disabled = false;
    advanceChain();
    updateGuideBlink();
    syncReadoutVisibility();
    draw();
  }

  buildChemBtns();
  selectChemical(0);
  syncReadoutVisibility();

  /* ══════════════════════════════════════════════════════════════
     8. MODE SWITCHING
     ══════════════════════════════════════════════════════════════ */
  function setMode(m) {
    mode = m;
    [secSimulate, secExplore, secPractice, secQuiz].forEach(function (s) { s.classList.add('hidden'); });
    if (m === 'simulate') secSimulate.classList.remove('hidden');
    else if (m === 'explore') { secExplore.classList.remove('hidden'); renderExplore(); }
    else if (m === 'practice') secPractice.classList.remove('hidden');
    else if (m === 'quiz') secQuiz.classList.remove('hidden');
    modeTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.value === m);
    });
  }

  modeTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (pill) setMode(pill.dataset.value);
  });

  paperTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    paperType = pill.dataset.value;
    paperTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.value === paperType);
    });
    if (labState === 'result' || labState === 'dipped') {
      labState = 'poured';
      dipProgress = 0;
      colorProgress = 0;
      btnDip.disabled = false;
      updateGuideBlink();
      updateReadout();
      syncReadoutVisibility();
      requestAmbient();
    }
    draw();
  });

  /* ══════════════════════════════════════════════════════════════
     9. LAB ACTIONS & ANIMATIONS
     ══════════════════════════════════════════════════════════════ */
  btnPour.addEventListener('pointerdown', function () {
    if (chemIdx < 0 || labState !== 'idle') return;
    labState = 'pouring';
    pourProgress = 0;
    btnPour.disabled = true;
    seedBubbles();
    stopAmbient();
    updateGuideBlink();
    animStart = performance.now();
    playPourSound();
    animatePour();
  });

  btnDip.addEventListener('pointerdown', function () {
    if (labState !== 'poured' && labState !== 'dipped' && labState !== 'result') return;
    labState = 'dipping';
    dipProgress = 0;
    colorProgress = 0;
    btnDip.disabled = true;
    stopAmbient();
    updateGuideBlink();
    animStart = performance.now();
    playDipSound();
    animateDip();
  });

  btnReset.addEventListener('pointerdown', function () {
    resetLab();
  });

  function resetLab() {
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = null; }
    stopAmbient();
    labState = 'idle';
    pourProgress = 0;
    dipProgress = 0;
    colorProgress = 0;
    chemIdx = -1;
    btnPour.disabled = true;
    btnDip.disabled = true;
    chemBtns.querySelectorAll('.chem-btn').forEach(function (b) { b.classList.remove('active'); });
    roName.textContent = '--';
    roFormula.textContent = '--';
    roPH.textContent = '--';
    roPH.style.color = '';
    roClass.textContent = '--';
    roLitmus.textContent = '--';
    if (chainAnimRAF2) { cancelAnimationFrame(chainAnimRAF2); chainAnimRAF2 = null; }
    chainStep = 0;
    prevChainStep = 0;
    chainLineAnim = 0;
    updateGuideBlink();
    syncReadoutVisibility();
    draw();
  }

  function animatePour() {
    var now = performance.now();
    var elapsed = now - animStart;
    var duration = 1500;
    pourProgress = Math.min(elapsed / duration, 1);
    draw();
    if (pourProgress < 1) {
      animRAF = requestAnimationFrame(animatePour);
    } else {
      labState = 'poured';
      btnDip.disabled = false;
      advanceChain();
      updateGuideBlink();
      updateReadout();
      syncReadoutVisibility();
      draw();
      requestAmbient();
    }
  }

  function animateDip() {
    var now = performance.now();
    var elapsed = now - animStart;
    var dipDuration = 500;
    var colorStart = 500;
    var colorDuration = 2000;
    var totalDuration = colorStart + colorDuration;

    dipProgress = Math.min(elapsed / dipDuration, 1);
    if (elapsed > colorStart) {
      colorProgress = Math.min((elapsed - colorStart) / colorDuration, 1);
    }
    draw();
    if (elapsed < totalDuration) {
      animRAF = requestAnimationFrame(animateDip);
    } else {
      labState = 'result';
      dipProgress = 1;
      colorProgress = 1;
      btnDip.disabled = false; /* allow dipping a fresh strip (e.g. after switching paper type) */
      advanceChain();
      updateGuideBlink();
      updateReadout();
      syncReadoutVisibility();
      playResultChime();
      draw();
      requestAmbient();
    }
  }

  function updateReadout() {
    if (chemIdx < 0) return;
    var c = CHEMICALS[chemIdx];
    roName.textContent = c.name;
    roFormula.textContent = c.formula;
    var phRgb = getPHColor(c.pH);
    roPH.textContent = c.pH;
    roPH.style.color = rgbStr(phRgb[0], phRgb[1], phRgb[2]);
    roClass.textContent = classify(c.pH);

    if (labState === 'result' || labState === 'dipped') {
      if (paperType === 'red') {
        if (c.pH > 7) roLitmus.textContent = 'Red → Blue (base detected)';
        else if (c.pH < 7) roLitmus.textContent = 'Stays Red (acid)';
        else roLitmus.textContent = 'No Change (neutral)';
      } else if (paperType === 'blue') {
        if (c.pH < 7) roLitmus.textContent = 'Blue → Red (acid detected)';
        else if (c.pH > 7) roLitmus.textContent = 'Stays Blue (base)';
        else roLitmus.textContent = 'No Change (neutral)';
      } else {
        roLitmus.textContent = 'Colour = pH ' + c.pH + ' (' + classify(c.pH) + ')';
      }
    } else {
      roLitmus.textContent = 'Dip paper to test';
    }
  }

  /* ══════════════════════════════════════════════════════════════
     10. CANVAS CONTEXT MENU (D4c)
     ══════════════════════════════════════════════════════════════ */
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    var rect = canvas.getBoundingClientRect();
    ctxMenu.style.left = e.clientX + 'px';
    ctxMenu.style.top  = e.clientY + 'px';
    ctxMenu.classList.remove('hidden');
  });

  document.addEventListener('pointerdown', function (e) {
    if (!ctxMenu.contains(e.target)) ctxMenu.classList.add('hidden');
  });

  document.getElementById('ctx-export-png').addEventListener('click', function () {
    ctxMenu.classList.add('hidden');
    exportPNG();
  });

  document.getElementById('ctx-reset-lab').addEventListener('click', function () {
    ctxMenu.classList.add('hidden');
    resetLab();
  });

  /* ══════════════════════════════════════════════════════════════
     11. EXPORT RESULTS (D16)
     ══════════════════════════════════════════════════════════════ */
  function exportPNG() {
    var dataURL = canvas.toDataURL('image/png');
    var a = document.createElement('a');
    a.href = dataURL;
    a.download = 'litmus-test-result.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function copyResultText() {
    if (chemIdx < 0) return;
    var c = CHEMICALS[chemIdx];
    var text = 'Litmus Paper Test Result\n' +
      'Chemical: ' + c.name + '\n' +
      'Formula: ' + c.formula + '\n' +
      'pH: ' + c.pH + '\n' +
      'Classification: ' + classify(c.pH) + '\n' +
      'Paper: ' + (paperType === 'red' ? 'Red Litmus' : paperType === 'blue' ? 'Blue Litmus' : 'Universal pH') + '\n' +
      'Litmus Result: ' + roLitmus.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        btnCopyResult.textContent = '✔ Copied!';
        setTimeout(function () { btnCopyResult.textContent = '📋 Copy Result'; }, 2000);
      });
    }
  }

  btnExportPng.addEventListener('pointerdown', exportPNG);
  btnCopyResult.addEventListener('pointerdown', copyResultText);

  /* ══════════════════════════════════════════════════════════════
     12. CUSTOM pH INPUT (D14)
     ══════════════════════════════════════════════════════════════ */
  function toggleCustomPanel() {
    customPanel.classList.toggle('hidden');
    if (!customPanel.classList.contains('hidden')) {
      customNameInput.focus();
    }
  }

  /* Sync slider display */
  customPhSlider.addEventListener('input', function () {
    customPhDisplay.textContent = 'pH ' + parseFloat(customPhSlider.value).toFixed(1);
    var rounded = Math.round(parseFloat(customPhSlider.value));
    var color = PH_COLORS[Math.min(14, Math.max(1, rounded))] || '#4caf50';
    customPhDisplay.style.color = color;
  });

  btnCustomCancel.addEventListener('pointerdown', function () {
    customPanel.classList.add('hidden');
  });

  btnCustomTest.addEventListener('pointerdown', function () {
    var name = customNameInput.value.trim() || 'Custom Chemical';
    var pH = Math.max(0, Math.min(14, parseFloat(customPhSlider.value) || 7));
    pH = Math.round(pH * 10) / 10; /* 1 dp */
    var rounded = Math.round(pH);
    var color = PH_COLORS[Math.min(14, Math.max(1, rounded))] || '#4caf50';
    var newChem = {
      name: name,
      formula: 'Custom',
      pH: pH,
      color: 'rgba(150,180,200,0.35)',
      category: classify(pH).toLowerCase().replace(' ', '-'),
      isCustom: true
    };
    if (customChemIndex >= 0) {
      CHEMICALS[customChemIndex] = newChem;
    } else {
      customChemIndex = CHEMICALS.length;
      CHEMICALS.push(newChem);
    }
    customPanel.classList.add('hidden');
    buildChemBtns();
    selectChemical(customChemIndex);
  });

  /* ══════════════════════════════════════════════════════════════
     13. CANVAS DRAWING — PURE RENDER (elevated graphics)
     ══════════════════════════════════════════════════════════════ */

  /* ---- colour helpers ---- */
  function parseRGBA(s) {
    var m = /rgba?\(([^)]+)\)/.exec(s);
    if (!m) return { r: 150, g: 180, b: 210, a: 0.4 };
    var p = m[1].split(',').map(function (v) { return parseFloat(v); });
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function rgbaStr(o, a) {
    return 'rgba(' + Math.round(o.r) + ',' + Math.round(o.g) + ',' + Math.round(o.b) + ',' + (a == null ? o.a : a) + ')';
  }
  function shade(o, f) { /* f<1 darker, f>1 lighter */
    return { r: Math.min(255, o.r * f), g: Math.min(255, o.g * f), b: Math.min(255, o.b * f), a: o.a };
  }

  /* Smooth pH colour ramp cached as a gradient on a tiny offscreen scale */
  function applyPHGradient(grad) {
    for (var p = 1; p <= 14; p++) {
      grad.addColorStop((p - 1) / 13, PH_COLORS[p]);
    }
    return grad;
  }

  /* ---- rising-bubble system (seeded once, animated by clock) ---- */
  var bubbles = [];
  function seedBubbles() {
    bubbles = [];
    var n = 16;
    for (var i = 0; i < n; i++) {
      bubbles.push({
        x: Math.random(),
        r: 0.7 + Math.random() * 2.1,
        speed: 0.10 + Math.random() * 0.30,
        phase: Math.random(),
        wob: 2 + Math.random() * 4
      });
    }
  }

  /* ---- ambient animation driver (subtle motion while liquid is settled) ---- */
  var ambientRAF = null;
  function shouldAmbient() {
    return chemIdx >= 0 && (labState === 'poured' || labState === 'dipped' || labState === 'result');
  }
  function ambientLoop() {
    if (!shouldAmbient()) { ambientRAF = null; return; }
    draw();
    ambientRAF = requestAnimationFrame(ambientLoop);
  }
  function requestAmbient() { if (!ambientRAF) ambientLoop(); }
  function stopAmbient() { if (ambientRAF) { cancelAnimationFrame(ambientRAF); ambientRAF = null; } }

  /* ---- beaker geometry (open top, rounded bottom) ---- */
  function traceBeakerInterior(x, top, w, h, inset) {
    var i = inset || 0;
    var L = x + i, R = x + w - i, Tp = top + i, B = top + h - i, r = 16 - i;
    if (r < 2) r = 2;
    ctx.beginPath();
    ctx.moveTo(L, Tp);
    ctx.lineTo(L, B - r);
    ctx.quadraticCurveTo(L, B, L + r, B);
    ctx.lineTo(R - r, B);
    ctx.quadraticCurveTo(R, B, R, B - r);
    ctx.lineTo(R, Tp);
  }

  /* Layout shared between draw helpers */
  function beakerRect() {
    var W = CW, H = CH;
    var bw = 168, bh = 232;
    var bx = Math.round(W * 0.40 - bw / 2 + 20);
    var bt = Math.round(H * 0.74 - 10 - bh);
    return { bx: bx, bt: bt, bw: bw, bh: bh, fillFrac: 0.62 };
  }

  function draw() {
    var W = CW, H = CH;
    var benchY = H * 0.74;
    ctx.clearRect(0, 0, W, H);

    /* ---------- background: lab ambience ---------- */
    var bg = ctx.createLinearGradient(0, 0, 0, benchY);
    bg.addColorStop(0, '#10131f');
    bg.addColorStop(0.55, '#161a2b');
    bg.addColorStop(1, '#1b2034');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, benchY);

    var R = beakerRect();
    var spotX = R.bx + R.bw / 2;

    /* soft spotlight glow behind the beaker */
    var glow = ctx.createRadialGradient(spotX, benchY - 70, 30, spotX, benchY - 70, 280);
    glow.addColorStop(0, 'rgba(124,77,255,0.16)');
    glow.addColorStop(0.5, 'rgba(90,120,200,0.06)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, benchY);

    /* ---------- wooden bench ---------- */
    var wood = ctx.createLinearGradient(0, benchY, 0, H);
    wood.addColorStop(0, '#3a2c20');
    wood.addColorStop(0.06, '#4a3526');
    wood.addColorStop(1, '#2a1d14');
    ctx.fillStyle = wood;
    ctx.fillRect(0, benchY, W, H - benchY);

    /* front-edge highlight */
    ctx.fillStyle = 'rgba(255,190,120,0.10)';
    ctx.fillRect(0, benchY, W, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(0, benchY + 3, W, 2);

    /* plank grain */
    ctx.strokeStyle = 'rgba(20,12,6,0.30)';
    ctx.lineWidth = 1;
    for (var gx = 150; gx < W; gx += 230) {
      ctx.beginPath();
      ctx.moveTo(gx, benchY + 6);
      ctx.lineTo(gx + 14, H);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(255,200,140,0.04)';
    for (var gy = benchY + 14; gy < H; gy += 11) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(W, gy + 2);
      ctx.stroke();
    }

    /* contact shadow under the beaker */
    var sh = ctx.createRadialGradient(spotX, R.bt + R.bh + 4, 8, spotX, R.bt + R.bh + 4, R.bw * 0.72);
    sh.addColorStop(0, 'rgba(0,0,0,0.45)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(0, 0);
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(spotX, R.bt + R.bh + 6, R.bw * 0.66, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ---------- pH reference scale ---------- */
    drawPHScale(W - 78, 36, 34, H * 0.60);

    /* ---------- beaker + liquid (layered) ---------- */
    var hasLiquid = chemIdx >= 0 && (labState === 'pouring' || labState === 'poured' || labState === 'dipping' || labState === 'dipped' || labState === 'result');

    drawBeakerGlass(R.bx, R.bt, R.bw, R.bh);

    if (hasLiquid) {
      var fillLevel = labState === 'pouring' ? pourProgress : 1;
      drawLiquid(R.bx, R.bt, R.bw, R.bh, fillLevel);
    }

    if (chemIdx >= 0 && labState === 'pouring') {
      drawBottlePour(R.bx, R.bt, R.bw, R.bh, pourProgress);
    }

    drawPaper(R.bx + R.bw / 2, R.bt, R.bh);

    /* glass sheen + graduations sit above the liquid for a "through-glass" look */
    drawBeakerSheen(R.bx, R.bt, R.bw, R.bh);

    if (labState === 'result' && chemIdx >= 0) {
      drawResultLabel(R.bx + R.bw / 2, R.bt - 40);
    }

    drawChainInstructions();
  }

  /* Glass body drawn UNDER the liquid */
  function drawBeakerGlass(x, top, w, h) {
    var lipW = 11;

    /* body fill — faint cool glass */
    var body = ctx.createLinearGradient(x, 0, x + w, 0);
    body.addColorStop(0, 'rgba(150,190,230,0.10)');
    body.addColorStop(0.12, 'rgba(200,225,250,0.05)');
    body.addColorStop(0.5, 'rgba(160,195,235,0.03)');
    body.addColorStop(0.88, 'rgba(140,180,225,0.05)');
    body.addColorStop(1, 'rgba(120,160,205,0.10)');
    traceBeakerInterior(x, top, w, h, 0);
    ctx.fillStyle = body;
    ctx.fill();

    /* spouts / rim caps */
    ctx.strokeStyle = 'rgba(190,220,250,0.40)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    /* pour spout (left) */
    ctx.beginPath();
    ctx.moveTo(x, top + 11);
    ctx.quadraticCurveTo(x - 3, top + 1, x - lipW, top - 3);
    ctx.stroke();
    /* right rim cap */
    ctx.beginPath();
    ctx.moveTo(x + w, top + 11);
    ctx.quadraticCurveTo(x + w + 3, top + 1, x + w + lipW, top - 3);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }

  /* Glass outline, specular streaks & graduations drawn OVER the liquid */
  function drawBeakerSheen(x, top, w, h) {
    /* outline */
    traceBeakerInterior(x, top, w, h, 0);
    ctx.strokeStyle = 'rgba(200,228,255,0.55)';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    /* inner edge shadow for thickness */
    traceBeakerInterior(x, top, w, h, 2.4);
    ctx.strokeStyle = 'rgba(120,150,190,0.22)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    /* bright vertical specular streak (left) */
    var spec = ctx.createLinearGradient(x + 8, 0, x + 26, 0);
    spec.addColorStop(0, 'rgba(255,255,255,0.0)');
    spec.addColorStop(0.5, 'rgba(255,255,255,0.22)');
    spec.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = spec;
    ctx.fillRect(x + 9, top + 14, 15, h - 34);

    /* faint secondary streak (right) */
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x + w - 16, top + 18, 6, h - 40);

    /* graduation marks */
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    var marks = [
      { label: '300', y: top + h * 0.18 },
      { label: '200', y: top + h * 0.42 },
      { label: '100', y: top + h * 0.66 }
    ];
    marks.forEach(function (m) {
      ctx.beginPath();
      ctx.moveTo(x + w - 30, m.y);
      ctx.lineTo(x + w - 12, m.y);
      ctx.strokeStyle = 'rgba(210,232,255,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
      /* minor tick */
      ctx.beginPath();
      ctx.moveTo(x + w - 22, m.y + (h * 0.12));
      ctx.lineTo(x + w - 12, m.y + (h * 0.12));
      ctx.strokeStyle = 'rgba(210,232,255,0.18)';
      ctx.stroke();
      ctx.fillStyle = 'rgba(210,232,255,0.45)';
      ctx.fillText(m.label, x + 12, m.y + 3.5);
    });
    ctx.fillStyle = 'rgba(210,232,255,0.30)';
    ctx.fillText('mL', x + 12, top + h * 0.18 - 12);
  }

  function drawLiquid(bx, bt, bw, bh, fillLevel) {
    if (chemIdx < 0 || fillLevel <= 0) return;
    if (bubbles.length === 0) seedBubbles();
    var c = CHEMICALS[chemIdx];
    var col = parseRGBA(c.color);
    var T = performance.now() / 1000;

    var maxFill = bh * 0.62;
    var liquidH = maxFill * fillLevel;
    var liquidTop = bt + bh - liquidH;
    var surfRy = 6; /* surface ellipse half-height */

    ctx.save();
    traceBeakerInterior(bx, bt, bw, bh, 3);
    ctx.clip();

    /* watery base tint so even "clear" chemicals read as a body of liquid */
    ctx.fillStyle = 'rgba(150,185,215,0.10)';
    ctx.fillRect(bx, liquidTop, bw, liquidH + 4);

    /* chemical colour, slightly deeper toward the bottom */
    var lg = ctx.createLinearGradient(0, liquidTop, 0, bt + bh);
    lg.addColorStop(0, rgbaStr(shade(col, 1.12), Math.min(1, col.a + 0.05)));
    lg.addColorStop(1, rgbaStr(shade(col, 0.72), Math.min(1, col.a + 0.22)));
    ctx.fillStyle = lg;
    ctx.fillRect(bx, liquidTop, bw, liquidH + 4);

    /* refraction shimmer band */
    var shim = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    shim.addColorStop(0, 'rgba(255,255,255,0)');
    shim.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    shim.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = shim;
    ctx.fillRect(bx, liquidTop + liquidH * 0.5, bw, 8);

    /* rising bubbles (only on a settled body) */
    if (fillLevel >= 0.98) {
      for (var i = 0; i < bubbles.length; i++) {
        var b = bubbles[i];
        var prog = (T * b.speed + b.phase) % 1;
        var by2 = (bt + bh - 4) - prog * (liquidH - 6);
        var bxp = bx + 6 + b.x * (bw - 12) + Math.sin((T + b.phase * 6) * 1.6) * b.wob;
        var alpha = 0.20 * (1 - prog) + 0.05;
        ctx.beginPath();
        ctx.arc(bxp, by2, b.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
        ctx.fill();
      }
    }

    /* surface meniscus ellipse */
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, liquidTop, bw / 2 - 3, surfRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgbaStr(shade(col, 1.25), Math.min(1, col.a + 0.18));
    ctx.fill();
    /* surface rim + specular */
    ctx.beginPath();
    ctx.ellipse(bx + bw / 2, liquidTop, bw / 2 - 3, surfRy, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();
  }

  function drawBottlePour(bx, bt, bw, bh, progress) {
    if (chemIdx < 0) return;
    var c = CHEMICALS[chemIdx];
    var col = parseRGBA(c.color);
    var T = performance.now() / 1000;

    var spoutX = bx + bw / 2;          /* where the stream lands */
    var maxFill = bh * 0.62;
    var liquidTop = bt + bh - maxFill * progress;

    /* reagent bottle, tilted above the beaker */
    var anchorX = bx + bw / 2 + 8;
    var anchorY = bt - 26;
    var angle = -0.42 + Math.min(progress, 1) * 0.26;

    ctx.save();
    ctx.translate(anchorX, anchorY);
    ctx.rotate(angle);

    /* bottle body */
    var bgrad = ctx.createLinearGradient(-18, 0, 18, 0);
    bgrad.addColorStop(0, 'rgba(70,90,120,0.55)');
    bgrad.addColorStop(0.5, 'rgba(150,180,210,0.30)');
    bgrad.addColorStop(1, 'rgba(60,80,110,0.55)');
    ctx.fillStyle = bgrad;
    ctx.strokeStyle = 'rgba(200,225,250,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18, -56, 36, 66, 6);
    ctx.fill();
    ctx.stroke();

    /* liquid inside the bottle */
    ctx.fillStyle = rgbaStr(shade(col, 0.95), Math.min(1, col.a + 0.25));
    ctx.beginPath();
    ctx.roundRect(-15, -30, 30, 37, 4);
    ctx.fill();

    /* neck + cap */
    ctx.fillStyle = bgrad;
    ctx.beginPath();
    ctx.roundRect(-7, -78, 14, 24, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(-9, -84, 18, 7);

    /* label */
    ctx.fillStyle = 'rgba(245,247,255,0.85)';
    ctx.beginPath();
    ctx.roundRect(-14, -20, 28, 16, 2);
    ctx.fill();
    ctx.fillStyle = '#3a2b6b';
    ctx.font = 'bold 7px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.formula.length <= 7 ? c.formula : c.name.split(' ')[0], 0, -9);

    /* glass highlight */
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-15, -52, 4, 56);
    ctx.restore();

    /* falling stream from the spout to the surface */
    if (progress > 0.02 && progress < 0.97) {
      var sx = anchorX - 14;            /* approx spout opening after rotation */
      var sy = anchorY - 6;
      var ex = spoutX + Math.sin(T * 8) * 1.5;
      var ey = liquidTop;
      var sgrad = ctx.createLinearGradient(0, sy, 0, ey);
      sgrad.addColorStop(0, rgbaStr(shade(col, 1.05), Math.min(1, col.a + 0.30)));
      sgrad.addColorStop(1, rgbaStr(col, Math.min(1, col.a + 0.15)));
      ctx.strokeStyle = sgrad;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + (ex - sx) * 0.4, sy + (ey - sy) * 0.55, ex, ey);
      ctx.stroke();
      ctx.lineCap = 'butt';

      /* a couple of stray droplets */
      for (var d = 0; d < 3; d++) {
        var dp = ((T * 1.4 + d * 0.33) % 1);
        var dy = sy + dp * (ey - sy);
        var dx = sx + (ex - sx) * dp + Math.sin(dp * 6) * 2;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = rgbaStr(col, Math.min(1, col.a + 0.25));
        ctx.fill();
      }

      /* splash ripple at the surface */
      ctx.save();
      traceBeakerInterior(bx, bt, bw, bh, 3);
      ctx.clip();
      var rr = 6 + (T * 30 % 14);
      ctx.beginPath();
      ctx.ellipse(ex, ey, rr, rr * 0.32, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.25 * (1 - (rr - 6) / 14)).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPaper(cx, beakerTop, beakerH) {
    if (labState !== 'poured' && labState !== 'dipping' && labState !== 'dipped' && labState !== 'result') return;

    var paperW = 20, paperH = 92;
    var paperX = cx + 34;
    var restY = beakerTop - paperH - 6;
    var liquidTop = beakerTop + beakerH - beakerH * 0.62;
    var dipY = liquidTop - paperH * 0.34;
    var currentY = (labState === 'dipping' || labState === 'dipped' || labState === 'result')
      ? lerp(restY, dipY, dipProgress) : restY;

    var left = paperX - paperW / 2;
    var top = currentY;

    /* base & reacted colours for this paper / chemical */
    var startColor, endColor;
    var c = chemIdx >= 0 ? CHEMICALS[chemIdx] : null;
    if (paperType === 'red') {
      startColor = [218, 70, 72];
      endColor = (c && c.pH > 7) ? [60, 95, 205] : [218, 70, 72];
    } else if (paperType === 'blue') {
      startColor = [70, 100, 205];
      endColor = (c && c.pH < 7) ? [212, 60, 60] : [70, 100, 205];
    } else {
      startColor = [206, 204, 130];
      endColor = c ? getPHColor(c.pH) : startColor;
    }

    /* soft drop shadow */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = lerpColor(startColor, startColor, 0);
    roundRectPath(left, top, paperW, paperH, 3);
    ctx.fill();
    ctx.restore();

    /* dry paper body with a subtle vertical sheen */
    var dry = ctx.createLinearGradient(left, 0, left + paperW, 0);
    var s = rgbStr(startColor[0], startColor[1], startColor[2]);
    dry.addColorStop(0, rgbStr(startColor[0] * 0.9, startColor[1] * 0.9, startColor[2] * 0.9));
    dry.addColorStop(0.5, s);
    dry.addColorStop(1, rgbStr(startColor[0] * 0.82, startColor[1] * 0.82, startColor[2] * 0.82));
    ctx.fillStyle = dry;
    roundRectPath(left, top, paperW, paperH, 3);
    ctx.fill();

    /* capillary wet diffusion: reacted colour climbs from the submerged base */
    var t = colorProgress;
    if (t > 0) {
      ctx.save();
      roundRectPath(left, top, paperW, paperH, 3);
      ctx.clip();
      var wetFrac = lerp(0.30, 1.0, t);          /* fraction of strip that is wet, from bottom */
      var boundary = 1 - wetFrac;                 /* 0=top .. 1=bottom */
      var wet = ctx.createLinearGradient(0, top, 0, top + paperH);
      var e = endColor, sc = startColor;
      var feather = 0.10;
      wet.addColorStop(0, 'rgba(0,0,0,0)');
      wet.addColorStop(Math.max(0, boundary - feather), 'rgba(0,0,0,0)');
      wet.addColorStop(Math.min(1, boundary), rgbStr((sc[0] + e[0]) / 2, (sc[1] + e[1]) / 2, (sc[2] + e[2]) / 2));
      wet.addColorStop(1, rgbStr(e[0], e[1], e[2]));
      ctx.fillStyle = wet;
      ctx.fillRect(left, top, paperW, paperH);

      /* damp sheen over the wet zone */
      var dampTop = top + paperH * boundary;
      var damp = ctx.createLinearGradient(left, 0, left + paperW, 0);
      damp.addColorStop(0, 'rgba(255,255,255,0.0)');
      damp.addColorStop(0.35, 'rgba(255,255,255,0.10)');
      damp.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.fillStyle = damp;
      ctx.fillRect(left, dampTop, paperW, top + paperH - dampTop);

      /* bright capillary waterline */
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(left + 1, dampTop);
      ctx.lineTo(left + paperW - 1, dampTop);
      ctx.stroke();
      ctx.restore();
    }

    /* paper fibre texture */
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var fy = top + 4; fy < top + paperH; fy += 6) {
      ctx.beginPath();
      ctx.moveTo(left + 2, fy);
      ctx.lineTo(left + paperW - 2, fy + 1);
      ctx.stroke();
    }

    /* crisp outline */
    ctx.strokeStyle = 'rgba(255,255,255,0.30)';
    ctx.lineWidth = 1;
    roundRectPath(left + 0.5, top + 0.5, paperW - 1, paperH - 1, 3);
    ctx.stroke();

    /* metal holding clip at the top */
    var clipW = paperW + 8, clipH = 13;
    var clipGrad = ctx.createLinearGradient(0, top - clipH, 0, top + 4);
    clipGrad.addColorStop(0, '#d7dbe4');
    clipGrad.addColorStop(0.5, '#9aa0ad');
    clipGrad.addColorStop(1, '#6e7480');
    ctx.fillStyle = clipGrad;
    roundRectPath(paperX - clipW / 2, top - clipH + 3, clipW, clipH, 3);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(paperX - clipW / 2 + 2, top - clipH + 4, clipW - 4, 1.5);

    /* label above the clip */
    ctx.fillStyle = 'rgba(190,205,235,0.85)';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    var paperLabel = paperType === 'red' ? 'Red Litmus' : paperType === 'blue' ? 'Blue Litmus' : 'pH Paper';
    ctx.fillText(paperLabel, paperX, top - clipH - 2);
  }

  function roundRectPath(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawPHScale(x, y, w, h) {
    /* frosted backing */
    ctx.fillStyle = 'rgba(8,10,18,0.55)';
    roundRectPath(x - 8, y - 22, w + 30, h + 36, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#aeb6cf';
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('pH', x + w / 2, y - 9);

    /* smooth continuous gradient strip */
    var grad = applyPHGradient(ctx.createLinearGradient(0, y, 0, y + h));
    roundRectPath(x, y, w, h, 5);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
    /* glass sheen on the strip */
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w * 0.4, h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    roundRectPath(x, y, w, h, 5);
    ctx.stroke();

    /* numeric ticks */
    for (var p = 1; p <= 14; p++) {
      var py = y + (p - 0.5) * (h / 14);
      ctx.fillStyle = (p >= 5 && p <= 7) ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)';
      ctx.font = '9px Segoe UI, sans-serif';
      ctx.fillText(p, x + w / 2, py + 3);
    }

    /* live marker for the current chemical */
    if (chemIdx >= 0 && (labState === 'poured' || labState === 'dipping' || labState === 'dipped' || labState === 'result')) {
      var c = CHEMICALS[chemIdx];
      var phClamped = Math.max(1, Math.min(14, c.pH));
      var markerY = y + (phClamped - 0.5) * (h / 14);
      var phRgb = getPHColor(c.pH);

      /* glow */
      ctx.save();
      ctx.shadowColor = rgbStr(phRgb[0], phRgb[1], phRgb[2]);
      ctx.shadowBlur = 12;
      /* arrow */
      ctx.beginPath();
      ctx.moveTo(x + w + 4, markerY);
      ctx.lineTo(x + w + 13, markerY - 6);
      ctx.lineTo(x + w + 13, markerY + 6);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.restore();

      /* pH bubble */
      ctx.fillStyle = rgbStr(phRgb[0], phRgb[1], phRgb[2]);
      roundRectPath(x + w + 13, markerY - 9, 30, 18, 5);
      ctx.fill();
      ctx.fillStyle = (c.pH >= 5 && c.pH <= 7) ? '#10131f' : '#fff';
      ctx.font = 'bold 10px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(c.pH, x + w + 28, markerY + 3.5);
    }
  }

  function drawResultLabel(cx, y) {
    if (chemIdx < 0) return;
    var c = CHEMICALS[chemIdx];
    var phRgb = getPHColor(c.pH);
    var color = rgbStr(phRgb[0], phRgb[1], phRgb[2]);
    var text = 'pH ' + c.pH + ' — ' + classify(c.pH);

    ctx.font = 'bold 14px Segoe UI, sans-serif';
    var wpx = ctx.measureText(text).width + 34;

    /* glow ring */
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(14,17,28,0.92)';
    roundRectPath(cx - wpx / 2, y - 16, wpx, 32, 9);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundRectPath(cx - wpx / 2, y - 16, wpx, 32, 9);
    ctx.stroke();

    /* colour swatch */
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx - wpx / 2 + 16, y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, cx + 10, y + 5);
  }

  draw();

  /* ══════════════════════════════════════════════════════════════
     14. EXPLORE MODE DATA & RENDER
     ══════════════════════════════════════════════════════════════ */
  var EXPLORE_DATA = {
    'ph-scale': [
      { title: 'What is pH?', body: 'pH stands for "potential of hydrogen" and is a measure of how acidic or basic a solution is. It ranges from 0 (most acidic) to 14 (most basic), with 7 being neutral. The concept was introduced by Danish chemist S.P.L. Sørensen in 1909.', formula: 'pH = -log₁₀[H⁺]' },
      { title: 'The Logarithmic Nature of pH', body: 'The pH scale is logarithmic, meaning each whole number change represents a tenfold change in hydrogen ion concentration. A solution at pH 3 is 10 times more acidic than pH 4, and 100 times more acidic than pH 5. This is why even small pH changes can be significant.', example: 'pH 1 has [H⁺] = 0.1 M, pH 2 has [H⁺] = 0.01 M — a 10× difference' },
      { title: 'Hydrogen Ion Concentration', body: 'pH is defined as the negative logarithm (base 10) of the hydrogen ion concentration in moles per litre. A high [H⁺] means low pH (acidic), while a low [H⁺] means high pH (basic).', formula: '[H⁺] = 10^(-pH)', example: 'At pH 3: [H⁺] = 10⁻³ = 0.001 mol/L' },
      { title: 'Water Autoionization', body: 'Pure water naturally dissociates into equal amounts of H⁺ and OH⁻ ions. At 25°C, [H⁺] = [OH⁻] = 10⁻⁷ mol/L, giving water a neutral pH of 7. The ion product Kw = [H⁺][OH⁻] = 10⁻¹⁴ at 25°C.', formula: 'H₂O ⇌ H⁺ + OH⁻' }
    ],
    'indicators': [
      { title: 'How Litmus Works', body: 'Litmus is a natural dye extracted from lichens (primarily Roccella tinctoria). The dye molecule exists in two forms: a red form (HLit) in acidic conditions and a blue form (Lit⁻) in basic conditions. The transition occurs around pH 4.5-8.3, making litmus a useful but imprecise indicator.', example: 'HLit (red) ⇌ H⁺ + Lit⁻ (blue)' },
      { title: 'Red vs Blue Litmus Paper', body: 'Red litmus paper is pre-treated with acid so it starts red. It can only detect bases (turns blue when pH > 7). Blue litmus paper is pre-treated with base so it starts blue. It can only detect acids (turns red when pH < 7). Neither changes at pH 7. To fully identify an unknown solution, you need both papers.', example: 'Unknown solution turns red litmus blue but blue litmus stays blue → the solution is basic' },
      { title: 'Universal Indicator', body: 'Universal indicator is a mixture of several pH indicators (typically methyl red, bromothymol blue, thymol blue, and phenolphthalein) that produces a continuous colour spectrum across the full pH range. It gives a more precise pH reading than simple litmus paper.', example: 'Red (pH 1-2) → Orange (3-4) → Yellow (5-6) → Green (7) → Blue (8-10) → Purple (11-14)' },
      { title: 'Other Indicators', body: 'Phenolphthalein is colourless in acid and turns pink/magenta in base (pH 8.2-10). Methyl orange is red below pH 3.1 and yellow above pH 4.4. Bromothymol blue is yellow in acid and blue in base (pH 6.0-7.6). Each indicator works within a specific pH range, chosen based on the expected pH of the solution being tested.' }
    ],
    'acids': [
      { title: 'What is an Acid?', body: 'According to the Brønsted-Lowry definition, an acid is a proton (H⁺) donor. When dissolved in water, acids release hydrogen ions, increasing the [H⁺] concentration and lowering the pH below 7. Acids taste sour, react with metals to produce hydrogen gas, and turn blue litmus red.' },
      { title: 'Strong vs Weak Acids', body: 'Strong acids (HCl, H₂SO₄, HNO₃) completely dissociate in water — every molecule releases its H⁺ ions. Weak acids (CH₃COOH, citric acid) only partially dissociate, establishing an equilibrium. A 0.1 M HCl solution has pH 1, while 0.1 M acetic acid has pH ≈ 2.9.', formula: 'HCl → H⁺ + Cl⁻ (complete)\nCH₃COOH ⇌ H⁺ + CH₃COO⁻ (partial)' },
      { title: 'Common Acids in Daily Life', body: 'Citric acid gives lemons and oranges their sour taste (pH 2). Acetic acid is the active component in vinegar (pH 3). Carbonic acid forms when CO₂ dissolves in water, making carbonated drinks slightly acidic (pH ~4). Hydrochloric acid is found in stomach acid (pH 1.5-3.5), essential for digestion.' },
      { title: 'Acid Dissociation Constant (Ka)', body: 'The strength of a weak acid is measured by its dissociation constant Ka. A larger Ka means a stronger acid. pKa = -log(Ka) is often used instead. Acetic acid has Ka = 1.8 × 10⁻⁵ (pKa = 4.74), while hydrofluoric acid has Ka = 6.8 × 10⁻⁴ (pKa = 3.17).', formula: 'Ka = [H⁺][A⁻] / [HA]' }
    ],
    'bases': [
      { title: 'What is a Base?', body: 'A base is a proton (H⁺) acceptor or a substance that produces hydroxide ions (OH⁻) in water. Bases feel slippery, taste bitter, and turn red litmus blue. The Brønsted-Lowry definition includes substances like ammonia that accept protons without directly producing OH⁻.' },
      { title: 'Strong vs Weak Bases', body: 'Strong bases (NaOH, KOH, Ca(OH)₂) completely dissociate in water, releasing all their OH⁻ ions. Weak bases (NH₃, NaHCO₃) only partially react with water. A 0.1 M NaOH solution has pH 13, while 0.1 M ammonia has pH ≈ 11.1.', formula: 'NaOH → Na⁺ + OH⁻ (complete)\nNH₃ + H₂O ⇌ NH₄⁺ + OH⁻ (partial)' },
      { title: 'Neutralization Reactions', body: 'When an acid reacts with a base, they neutralize each other to form a salt and water. The pH of the resulting solution depends on the strength of the acid and base used. Strong acid + strong base gives pH 7 (neutral). Strong acid + weak base gives pH < 7. Weak acid + strong base gives pH > 7.', formula: 'HCl + NaOH → NaCl + H₂O' },
      { title: 'Common Bases in Daily Life', body: 'Baking soda (NaHCO₃, pH 8-9) is used in cooking and cleaning. Ammonia (pH 11) is a common household cleaner. Bleach (NaClO, pH 13) is a powerful disinfectant. Soap is mildly basic (pH 9-10). Milk of magnesia (pH 10) is used as an antacid. Drain cleaners contain NaOH (pH 14), one of the strongest common bases.' }
    ]
  };

  var exploreCategory = 'ph-scale';

  function renderExplore() {
    var cards = EXPLORE_DATA[exploreCategory] || [];
    exploreCards.innerHTML = '';
    cards.forEach(function (card) {
      var div = document.createElement('div');
      div.className = 'explore-card';
      var html = '<h3>' + card.title + '</h3>';
      html += '<p>' + card.body + '</p>';
      if (card.formula) html += '<div class="ec-formula">' + card.formula + '</div>';
      if (card.example) html += '<div class="ec-example">' + card.example + '</div>';
      div.innerHTML = html;
      exploreCards.appendChild(div);
    });
  }

  exploreTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    exploreCategory = pill.dataset.value;
    exploreTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.value === exploreCategory);
    });
    renderExplore();
  });

  renderExplore();

  /* ══════════════════════════════════════════════════════════════
     15. PRACTICE MODE
     ══════════════════════════════════════════════════════════════ */
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randItem(arr) { return arr[randInt(0, arr.length - 1)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = randInt(0, i);
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  var PRACTICE_GENERATORS = [
    function () {
      var c = randItem(CHEMICALS);
      var options = shuffle(['Strong Acid', 'Weak Acid', 'Neutral', 'Weak Base', 'Strong Base']);
      var answer = classify(c.pH);
      return { type: 'mcq', q: 'What is the pH classification of ' + c.name + ' (' + c.formula + ')?',
        options: options, answer: answer,
        explain: c.name + ' has pH ' + c.pH + ', which is classified as ' + answer + '.' };
    },
    function () {
      var c = randItem(CHEMICALS);
      var changes = c.pH > 7;
      var options = ['Yes — turns blue', 'No — stays red'];
      return { type: 'mcq', q: 'Does red litmus paper change colour in ' + c.name + ' (pH ' + c.pH + ')?',
        options: options, answer: changes ? 'Yes — turns blue' : 'No — stays red',
        explain: changes ? 'Red litmus turns blue in bases (pH > 7). ' + c.name + ' has pH ' + c.pH + '.' : 'Red litmus stays red in acids and neutral solutions (pH ≤ 7). ' + c.name + ' has pH ' + c.pH + '.' };
    },
    function () {
      var c = randItem(CHEMICALS);
      var changes = c.pH < 7;
      var options = ['Yes — turns red', 'No — stays blue'];
      return { type: 'mcq', q: 'Does blue litmus paper change colour in ' + c.name + ' (pH ' + c.pH + ')?',
        options: options, answer: changes ? 'Yes — turns red' : 'No — stays blue',
        explain: changes ? 'Blue litmus turns red in acids (pH < 7). ' + c.name + ' has pH ' + c.pH + '.' : 'Blue litmus stays blue in bases and neutral solutions (pH ≥ 7). ' + c.name + ' has pH ' + c.pH + '.' };
    },
    function () {
      var c = randItem(CHEMICALS);
      var rounded = Math.round(c.pH);
      var colorNames = { 1: 'Red', 2: 'Deep Orange', 3: 'Orange', 4: 'Amber', 5: 'Yellow', 6: 'Lime Green',
        7: 'Green', 8: 'Teal', 9: 'Cyan', 10: 'Blue', 11: 'Indigo', 12: 'Deep Purple', 13: 'Purple', 14: 'Dark Purple' };
      var correct = colorNames[rounded] || 'Green';
      var allColors = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple'];
      var options = [correct];
      while (options.length < 4) {
        var pick = randItem(allColors);
        if (options.indexOf(pick) < 0) options.push(pick);
      }
      options = shuffle(options);
      return { type: 'mcq', q: 'What colour does universal indicator show for ' + c.name + ' (pH ' + c.pH + ')?',
        options: options, answer: correct,
        explain: 'At pH ' + c.pH + ', universal indicator shows ' + correct + '.' };
    },
    function () {
      var c = randItem(CHEMICALS);
      var options = shuffle([c.pH + '', randInt(1, 14) + '', randInt(1, 14) + '', randInt(1, 14) + '']);
      var seen = {};
      options = options.filter(function (o) { if (seen[o]) return false; seen[o] = true; return true; });
      while (options.length < 4) {
        var v = randInt(1, 14) + '';
        if (!seen[v]) { options.push(v); seen[v] = true; }
      }
      if (options.indexOf(c.pH + '') < 0) options[0] = c.pH + '';
      options = shuffle(options);
      return { type: 'mcq', q: 'What is the approximate pH of ' + c.name + '?',
        options: options, answer: c.pH + '',
        explain: c.name + ' (' + c.formula + ') has a pH of ' + c.pH + '.' };
    },
    function () {
      var isAcid = Math.random() > 0.5;
      var subset = shuffle(CHEMICALS.slice()).slice(0, 4);
      var names = subset.map(function (c) { return c.name; });
      var correct;
      if (isAcid) {
        correct = subset.reduce(function (a, b) { return a.pH < b.pH ? a : b; }).name;
      } else {
        correct = subset.reduce(function (a, b) { return a.pH > b.pH ? a : b; }).name;
      }
      return { type: 'mcq', q: 'Which of these is the ' + (isAcid ? 'strongest acid (lowest pH)' : 'strongest base (highest pH)') + '?',
        options: shuffle(names), answer: correct,
        explain: correct + ' has pH ' + subset.find(function (c) { return c.name === correct; }).pH + '.' };
    },
    function () {
      var pH = randInt(1, 13);
      var hConc = Math.pow(10, -pH);
      return { type: 'numeric', q: 'Calculate the hydrogen ion concentration [H⁺] in mol/L for a solution with pH = ' + pH + '. Give your answer in scientific notation as a power of 10 (e.g., enter -3 for 10⁻³).',
        answer: -pH, unit: '(exponent)', tol: 0.1,
        explain: 'pH = -log[H⁺], so [H⁺] = 10^(-pH) = 10^(' + (-pH) + ') = ' + hConc.toExponential(0) + ' mol/L.' };
    },
    function () {
      var exp = -randInt(1, 13);
      var pH = -exp;
      return { type: 'numeric', q: 'A solution has [H⁺] = 10^(' + exp + ') mol/L. What is its pH?',
        answer: pH, unit: '', tol: 0.1,
        explain: 'pH = -log[H⁺] = -log(10^' + exp + ') = -(' + exp + ') = ' + pH + '.' };
    },
    function () {
      var startpH = randInt(1, 4);
      var dilution = randItem([10, 100]);
      var newpH = startpH + Math.log10(dilution);
      return { type: 'numeric', q: 'A strong acid solution has pH = ' + startpH + '. If it is diluted by a factor of ' + dilution + ' with water, what is the new pH? (Assume strong acid, complete dissociation)',
        answer: newpH, unit: '', tol: 0.2,
        explain: 'Diluting by ' + dilution + '× reduces [H⁺] by ' + dilution + '×. New pH = ' + startpH + ' + log₁₀(' + dilution + ') = ' + startpH + ' + ' + Math.log10(dilution) + ' = ' + newpH + '.' };
    },
    function () {
      var pairs = [
        { acid: 'HCl', base: 'NaOH', salt: 'NaCl + H₂O', wrong: ['NaH + ClOH', 'Na₂Cl + H₂', 'NaCl₂ + H₂O'] },
        { acid: 'H₂SO₄', base: 'NaOH', salt: 'Na₂SO₄ + H₂O', wrong: ['NaSO₄ + H₂', 'Na₂S + O₄H₂', 'NaHSO₄ only'] },
        { acid: 'HCl', base: 'KOH', salt: 'KCl + H₂O', wrong: ['KH + ClOH', 'K₂Cl + H₂', 'KClO + H₂'] }
      ];
      var p = randItem(pairs);
      var options = shuffle([p.salt].concat(p.wrong));
      return { type: 'mcq', q: 'What are the products of the neutralization reaction between ' + p.acid + ' and ' + p.base + '?',
        options: options, answer: p.salt,
        explain: p.acid + ' + ' + p.base + ' → ' + p.salt + '. Acid + Base → Salt + Water.' };
    },
    function () {
      var scenarios = [
        { redResult: 'stays red', blueResult: 'turns red', answer: 'Acidic (pH < 7)', explain: 'Blue litmus turning red indicates acid. Red litmus not changing confirms it is not a base.' },
        { redResult: 'turns blue', blueResult: 'stays blue', answer: 'Basic (pH > 7)', explain: 'Red litmus turning blue indicates a base. Blue litmus not changing confirms it is not an acid.' },
        { redResult: 'stays red', blueResult: 'stays blue', answer: 'Neutral (pH = 7)', explain: 'Neither litmus paper changes colour, indicating a neutral solution.' }
      ];
      var s = randItem(scenarios);
      var options = shuffle(['Acidic (pH < 7)', 'Basic (pH > 7)', 'Neutral (pH = 7)', 'Cannot determine']);
      return { type: 'mcq', q: 'An unknown solution: red litmus paper ' + s.redResult + ', blue litmus paper ' + s.blueResult + '. What is the solution?',
        options: options, answer: s.answer,
        explain: s.explain };
    },
    function () {
      var buffers = [
        { name: 'acetic acid/sodium acetate', pKa: 4.74, ratioDesc: 'equal concentrations', ratio: 1, pH: 4.74 },
        { name: 'acetic acid/sodium acetate', pKa: 4.74, ratioDesc: '10:1 [A⁻]/[HA]', ratio: 10, pH: 5.74 },
        { name: 'NH₃/NH₄Cl', pKa: 9.25, ratioDesc: 'equal concentrations', ratio: 1, pH: 9.25 }
      ];
      var b = randItem(buffers);
      return { type: 'numeric', q: 'A buffer solution is made from ' + b.name + ' (pKa = ' + b.pKa + ') with ' + b.ratioDesc + '. Estimate the pH using the Henderson-Hasselbalch equation.',
        answer: b.pH, unit: '', tol: 0.1,
        explain: 'pH = pKa + log([A⁻]/[HA]) = ' + b.pKa + ' + log(' + b.ratio + ') = ' + b.pKa + ' + ' + Math.log10(b.ratio).toFixed(2) + ' = ' + b.pH.toFixed(2) + '.' };
    }
  ];

  function newPractice() {
    practiceSelected = -1;
    pqFeedback.classList.add('hidden');
    pqFeedback.className = 'feedback hidden';
    pqSolution.classList.add('hidden');
    pqMcq.classList.add('hidden');
    pqMcq.innerHTML = '';
    pqInputRow.classList.add('hidden');

    var gen = PRACTICE_GENERATORS[randInt(0, PRACTICE_GENERATORS.length - 1)];
    currentProblem = gen();
    pqText.textContent = currentProblem.q;

    if (currentProblem.type === 'mcq') {
      pqMcq.classList.remove('hidden');
      currentProblem.options.forEach(function (opt, i) {
        var btn = document.createElement('button');
        btn.className = 'pq-opt';
        btn.textContent = opt;
        btn.addEventListener('pointerdown', function () {
          practiceSelected = i;
          pqMcq.querySelectorAll('.pq-opt').forEach(function (b, j) {
            b.classList.toggle('selected', j === i);
          });
        });
        pqMcq.appendChild(btn);
      });
    } else {
      pqInputRow.classList.remove('hidden');
      pqInput.value = '';
      pqUnit.textContent = currentProblem.unit || '';
      pqInput.focus();
    }
  }

  function checkPractice() {
    if (!currentProblem) return;
    practiceTotal++;
    pTotal.textContent = practiceTotal;

    var correct = false;
    if (currentProblem.type === 'mcq') {
      if (practiceSelected < 0) return;
      var chosen = currentProblem.options[practiceSelected];
      correct = chosen === currentProblem.answer;
      pqMcq.querySelectorAll('.pq-opt').forEach(function (b) {
        if (b.textContent === currentProblem.answer) b.classList.add('correct');
        else if (b.classList.contains('selected')) b.classList.add('wrong');
      });
    } else {
      var val = parseFloat(pqInput.value);
      if (isNaN(val)) return;
      correct = Math.abs(val - currentProblem.answer) <= (currentProblem.tol || 0.5);
    }

    if (correct) { practiceScore++; pScore.textContent = practiceScore; }
    pqFeedback.textContent = correct ? 'Correct!' : 'Incorrect.';
    pqFeedback.className = 'feedback ' + (correct ? 'ok' : 'err');
    pqFeedback.classList.remove('hidden');
  }

  function showSolution() {
    if (!currentProblem) return;
    pqSolution.textContent = currentProblem.explain;
    pqSolution.classList.remove('hidden');
  }

  btnNewQ.addEventListener('pointerdown', newPractice);
  btnCheck.addEventListener('pointerdown', checkPractice);
  btnShowSol.addEventListener('pointerdown', showSolution);

  /* ══════════════════════════════════════════════════════════════
     16. QUIZ MODE
     ══════════════════════════════════════════════════════════════ */
  var QUIZ_POOL = [
    { type: 'mcq', q: 'What colour does blue litmus paper turn in hydrochloric acid (pH 1)?', options: ['Red', 'Green', 'Blue', 'Yellow'], answer: 'Red', explain: 'Blue litmus turns red in acids (pH < 7).' },
    { type: 'mcq', q: 'Red litmus paper is dipped into a solution of baking soda (pH 8). What happens?', options: ['Turns blue', 'Stays red', 'Turns green', 'Turns yellow'], answer: 'Turns blue', explain: 'Red litmus turns blue in basic solutions (pH > 7). Baking soda is a weak base.' },
    { type: 'mcq', q: 'Which of the following has the lowest pH?', options: ['Lemon juice', 'Vinegar', 'Milk', 'Pure water'], answer: 'Lemon juice', explain: 'Lemon juice has pH 2, vinegar pH 3, milk pH 6, water pH 7.' },
    { type: 'mcq', q: 'What is the pH of a neutral solution at 25°C?', options: ['0', '7', '14', '1'], answer: '7', explain: 'At 25°C, pure water has equal [H⁺] and [OH⁻] at 10⁻⁷ mol/L each, giving pH = 7.' },
    { type: 'mcq', q: 'Universal indicator turns green. What does this indicate?', options: ['Strong acid', 'Weak acid', 'Neutral (pH 7)', 'Strong base'], answer: 'Neutral (pH 7)', explain: 'Green on universal indicator corresponds to pH 7, which is neutral.' },
    { type: 'mcq', q: 'Which household substance is the strongest base?', options: ['Baking soda', 'Ammonia', 'Bleach', 'Milk'], answer: 'Bleach', explain: 'Bleach has pH 13, ammonia pH 11, baking soda pH 8, milk pH 6.' },
    { type: 'mcq', q: 'Litmus is obtained from which natural source?', options: ['Tree bark', 'Lichens', 'Flower petals', 'Sea algae'], answer: 'Lichens', explain: 'Litmus dye is extracted from lichens, particularly Roccella tinctoria.' },
    { type: 'mcq', q: 'A solution has pH = 3. How many times more acidic is it than pH = 5?', options: ['2 times', '10 times', '100 times', '1000 times'], answer: '100 times', explain: 'Each pH unit = 10× difference. Two units = 10² = 100 times more acidic.' },
    { type: 'numeric', q: 'What is the pH of pure water at 25°C?', answer: 7, tol: 0.1, explain: 'Pure water has [H⁺] = 10⁻⁷, so pH = -log(10⁻⁷) = 7.' },
    { type: 'numeric', q: 'What is the hydrogen ion concentration exponent for a solution with pH 4? (Enter as a negative number, e.g., -4)', answer: -4, tol: 0.1, explain: '[H⁺] = 10^(-pH) = 10⁻⁴ mol/L.' },
    { type: 'numeric', q: 'A solution has [H⁺] = 10⁻¹¹ mol/L. What is its pH?', answer: 11, tol: 0.1, explain: 'pH = -log(10⁻¹¹) = 11.' },
    { type: 'numeric', q: 'An acid solution of pH 2 is diluted 100 times. What is the new pH?', answer: 4, tol: 0.2, explain: 'Diluting 100×: new pH = 2 + log(100) = 2 + 2 = 4.' },
    { type: 'numeric', q: 'If [OH⁻] = 10⁻³ mol/L, what is the pH? (Kw = 10⁻¹⁴)', answer: 11, tol: 0.1, explain: 'pOH = -log(10⁻³) = 3. pH = 14 - pOH = 14 - 3 = 11.' },
    { type: 'numeric', q: 'What is the pH of a 0.01 M HCl solution (strong acid, complete dissociation)?', answer: 2, tol: 0.1, explain: '[H⁺] = 0.01 = 10⁻² mol/L. pH = -log(10⁻²) = 2.' },
    { type: 'numeric', q: 'How many times more concentrated in H⁺ is pH 1 compared to pH 4? (Enter as a whole number)', answer: 1000, tol: 1, explain: 'Difference = 10^(4-1) = 10³ = 1000 times.' }
  ];

  function startQuiz() {
    quizSet = shuffle(QUIZ_POOL.slice()).slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswers = [];
    quizLocked = false;
    quizResultDiv.classList.add('hidden');
    btnStartQuiz.classList.add('hidden');
    btnSubmitQ.classList.remove('hidden');
    btnNextQ.classList.add('hidden');
    showQuizQ();
  }

  function showQuizQ() {
    var q = quizSet[quizIdx];
    quizCounter.textContent = 'Q ' + (quizIdx + 1) + ' / ' + QUIZ_SIZE;
    qqText.textContent = q.q;
    qqFeedback.classList.add('hidden');
    qqFeedback.className = 'feedback hidden';
    qqOptions.classList.add('hidden');
    qqOptions.innerHTML = '';
    qqInputRow.classList.add('hidden');
    quizLocked = false;

    if (q.type === 'mcq') {
      qqOptions.classList.remove('hidden');
      q.options.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.className = 'qq-opt';
        btn.textContent = opt;
        btn.addEventListener('pointerdown', function () {
          if (quizLocked) return;
          qqOptions.querySelectorAll('.qq-opt').forEach(function (b) { b.classList.remove('selected'); });
          btn.classList.add('selected');
        });
        qqOptions.appendChild(btn);
      });
    } else {
      qqInputRow.classList.remove('hidden');
      qqInput.value = '';
      qqUnit.textContent = '';
      qqInput.focus();
    }
  }

  function submitQuiz() {
    var q = quizSet[quizIdx];
    var correct = false;
    var userAnswer = '';

    if (q.type === 'mcq') {
      var sel = qqOptions.querySelector('.qq-opt.selected');
      if (!sel) return;
      userAnswer = sel.textContent;
      correct = userAnswer === q.answer;
      qqOptions.querySelectorAll('.qq-opt').forEach(function (b) {
        if (b.textContent === q.answer) b.classList.add('correct');
        else if (b.classList.contains('selected')) b.classList.add('wrong');
      });
    } else {
      var val = parseFloat(qqInput.value);
      if (isNaN(val)) return;
      userAnswer = val + '';
      correct = Math.abs(val - q.answer) <= (q.tol || 0.5);
    }

    quizLocked = true;
    if (correct) quizScore++;
    quizAnswers.push({ q: q.q, correct: correct, userAnswer: userAnswer, realAnswer: q.answer + '', explain: q.explain });
    qqFeedback.textContent = correct ? 'Correct!' : 'Incorrect. Answer: ' + q.answer;
    qqFeedback.className = 'feedback ' + (correct ? 'ok' : 'err');
    qqFeedback.classList.remove('hidden');

    btnSubmitQ.classList.add('hidden');
    if (quizIdx < QUIZ_SIZE - 1) {
      btnNextQ.classList.remove('hidden');
    } else {
      setTimeout(showQuizResult, 800);
    }
  }

  function nextQuizQ() {
    quizIdx++;
    btnNextQ.classList.add('hidden');
    btnSubmitQ.classList.remove('hidden');
    showQuizQ();
  }

  function showQuizResult() {
    btnSubmitQ.classList.add('hidden');
    btnNextQ.classList.add('hidden');
    btnStartQuiz.classList.remove('hidden');
    btnStartQuiz.textContent = 'Retake Quiz';
    qqText.textContent = '';
    qqOptions.classList.add('hidden');
    qqInputRow.classList.add('hidden');
    qqFeedback.classList.add('hidden');
    quizCounter.textContent = 'Finished!';

    var pct = Math.round(quizScore / QUIZ_SIZE * 100);
    var stars = quizScore === 5 ? '★★★' : quizScore >= 3 ? '★★☆' : '★☆☆';
    var cls = quizScore === 5 ? 'perfect' : quizScore >= 3 ? 'good' : 'poor';

    var html = '<div class="qr-header">';
    html += '<div class="qr-score ' + cls + '">' + quizScore + ' / ' + QUIZ_SIZE + ' (' + pct + '%)</div>';
    html += '<div class="qr-stars">' + stars + '</div>';
    html += '</div><div class="qr-rows">';
    quizAnswers.forEach(function (a, i) {
      html += '<div class="qr-row ' + (a.correct ? 'ok' : 'err') + '">';
      html += '<strong>Q' + (i + 1) + ':</strong> ' + a.q + '<br>';
      html += a.correct ? 'Your answer: ' + a.userAnswer + ' ✔' : 'Your answer: ' + a.userAnswer + ' ✘ — Correct: ' + a.realAnswer;
      html += '<br><em>' + a.explain + '</em></div>';
    });
    html += '</div>';
    quizResultDiv.innerHTML = html;
    quizResultDiv.classList.remove('hidden');
  }

  btnStartQuiz.addEventListener('pointerdown', startQuiz);
  btnSubmitQ.addEventListener('pointerdown', submitQuiz);
  btnNextQ.addEventListener('pointerdown', nextQuizQ);

  /* ══════════════════════════════════════════════════════════════
     17. WINDOW RESIZE
     ══════════════════════════════════════════════════════════════ */
  window.addEventListener('resize', function () { setupCanvas(); draw(); });

})();
