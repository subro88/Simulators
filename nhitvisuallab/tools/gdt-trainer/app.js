/* ═══════════════════════════════════════════════════════════════════
   GD&T Trainer — app.js  v1
   ASME Y14.5 Geometric Dimensioning & Tolerancing
   NHIT VisualLab · https://nhitvisuallab.org
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────
     1. GD&T DATA — All 14 symbols by category
     ──────────────────────────────────────────────────────────────── */
  /* tolSI = canonical SI tolerance value in mm used for the example FCF and
     for the unit toggle. iso = matching ISO 1101 / ISO 5459 reference. */
  var SYMBOLS = [
    /* FORM (no datum) */
    { id: 'flatness',      name: 'Flatness',            iso: 'ISO 1101', cat: 'form',        datum: false, tolSI: 0.05, zone: 'Two parallel planes within which the entire surface must lie.',                          example: 'Sealing surface of an engine block gasket face — must be flat within 0.05 mm to prevent leaks.' },
    { id: 'straightness',  name: 'Straightness',        iso: 'ISO 1101', cat: 'form',        datum: false, tolSI: 0.02, zone: 'Two parallel lines (surface) or a cylinder (axis) within which the feature must lie.',   example: 'Edge of a machine guide rail — must be straight within 0.02 mm over its full length.' },
    { id: 'circularity',   name: 'Circularity',         iso: 'ISO 1101', cat: 'form',        datum: false, tolSI: 0.01, zone: 'Two concentric circles at each cross-section, defining an annular ring tolerance.',      example: 'Bearing journal on a crankshaft — each cross-section must be round within 0.01 mm.' },
    { id: 'cylindricity',  name: 'Cylindricity',        iso: 'ISO 1101', cat: 'form',        datum: false, tolSI: 0.03, zone: 'Two concentric cylinders — controls roundness, straightness, and taper simultaneously.', example: 'Hydraulic cylinder bore — must be cylindrical within 0.03 mm for proper piston seal.' },

    /* ORIENTATION (datum required) */
    { id: 'perpendicularity', name: 'Perpendicularity', iso: 'ISO 1101', cat: 'orientation', datum: true,  tolSI: 0.05, zone: 'Two parallel planes perpendicular to the datum plane or axis.',                         example: 'Flange face perpendicular to bore axis — must be within 0.05 mm to datum A.' },
    { id: 'angularity',      name: 'Angularity',        iso: 'ISO 1101', cat: 'orientation', datum: true,  tolSI: 0.08, zone: 'Two parallel planes at the specified basic angle to the datum.',                        example: 'Dovetail slide at 60° to the base — angle tolerance zone is 0.08 mm wide.' },
    { id: 'parallelism',     name: 'Parallelism',       iso: 'ISO 1101', cat: 'orientation', datum: true,  tolSI: 0.02, zone: 'Two parallel planes (or a cylinder) parallel to the datum plane or axis.',              example: 'Top surface of a machine bed parallel to the bottom datum — within 0.02 mm.' },

    /* LOCATION (datum required) */
    { id: 'position',       name: 'Position',           iso: 'ISO 5458', cat: 'location',    datum: true,  tolSI: 0.25, zone: 'A cylinder (for holes/pins) or two planes centered on true position.',                  example: 'Bolt hole pattern — each hole axis within ⌀0.25 mm of true position at MMC.' },
    { id: 'concentricity',  name: 'Concentricity',      iso: 'ISO 1101', cat: 'location',    datum: true,  tolSI: 0.05, zone: 'A cylinder centered on the datum axis within which the feature\'s median points must lie.', example: 'Inner and outer diameters of a sleeve — axes within ⌀0.05 mm concentricity.' },
    { id: 'symmetry',       name: 'Symmetry',           iso: 'ISO 1101', cat: 'location',    datum: true,  tolSI: 0.10, zone: 'Two parallel planes equally disposed about the datum center plane.',                    example: 'Keyway centered on a shaft — symmetry tolerance of 0.1 mm about shaft axis.' },

    /* PROFILE */
    { id: 'profile-line',    name: 'Profile of a Line',    iso: 'ISO 1660', cat: 'profile', datum: false, tolSI: 0.10, zone: 'Two curved lines equally disposed about the true profile at each cross-section.',        example: 'Turbine blade airfoil cross-section — profile tolerance of 0.1 mm per section.' },
    { id: 'profile-surface', name: 'Profile of a Surface', iso: 'ISO 1660', cat: 'profile', datum: false, tolSI: 0.50, zone: 'Two surfaces equally disposed about the true profile — controls the entire 3D surface.', example: 'Car body panel contour — entire surface within 0.5 mm of CAD nominal shape.' },

    /* RUNOUT (datum required) */
    { id: 'circular-runout', name: 'Circular Runout', iso: 'ISO 1101', cat: 'runout', datum: true, tolSI: 0.03, zone: 'Full Indicator Movement (FIM) at each individual cross-section as part rotates about datum axis.', example: 'Shaft shoulder face — FIM of 0.03 mm at each circular element when rotated on datum axis.' },
    { id: 'total-runout',    name: 'Total Runout',    iso: 'ISO 1101', cat: 'runout', datum: true, tolSI: 0.02, zone: 'Full Indicator Movement (FIM) across the entire surface simultaneously as part rotates about datum axis.', example: 'Entire cylindrical surface of a precision spindle — total FIM of 0.02 mm relative to datum axis.' }
  ];

  var CATEGORIES = {
    form:        'Form',
    orientation: 'Orientation',
    location:    'Location',
    profile:     'Profile',
    runout:      'Runout'
  };

  var CAT_ORDER = ['form', 'orientation', 'location', 'profile', 'runout'];

  /* Learn-mode FCF parts */
  var LEARN_PARTS = [
    { name: 'Geometric Symbol',        color: '#00bfa5', desc: 'The first compartment of the FCF contains the geometric characteristic symbol (e.g., ⊥ for perpendicularity, ⌖ for position). It tells you WHAT type of tolerance is being applied.' },
    { name: 'Tolerance Value',         color: '#4fc3f7', desc: 'The second compartment shows the tolerance value in mm or inches. A ⌀ prefix indicates a cylindrical (diameter) tolerance zone instead of two parallel planes.' },
    { name: 'Material Condition',      color: '#f5c842', desc: 'An optional modifier after the tolerance value: Ⓜ (MMC — Maximum Material Condition) allows bonus tolerance, Ⓛ (LMC — Least Material Condition), or none (RFS — Regardless of Feature Size).' },
    { name: 'Primary Datum (A)',       color: '#e91e63', desc: 'The third compartment references the primary datum — the most important reference feature that constrains 3 degrees of freedom (a plane removes translation and two rotations).' },
    { name: 'Secondary Datum (B)',     color: '#ff9800', desc: 'The fourth compartment references the secondary datum — constrains 2 additional degrees of freedom. May include its own material condition modifier.' },
    { name: 'Tertiary Datum (C)',      color: '#a78bfa', desc: 'The fifth compartment references the tertiary datum — constrains the final degree of freedom, fully locking the datum reference frame (DRF).' }
  ];

  /* ────────────────────────────────────────────────────────────────
     2. DOM REFS
     ──────────────────────────────────────────────────────────────── */
  var canvas = document.getElementById('gdt-canvas');
  var ctx    = canvas.getContext('2d');
  var W = 900, H = 520;

  /* Panels */
  var elLearnInfo      = document.getElementById('learn-info');
  var elSymbolSelector = document.getElementById('symbol-selector');
  var elSymInfo        = document.getElementById('sym-info');
  var elPracticePanel  = document.getElementById('practice-panel');
  var elPracticeBar    = document.getElementById('practice-bar');
  var elQuizPanel      = document.getElementById('quiz-panel');
  var elQuizBar        = document.getElementById('quiz-bar');
  var elQuizResult     = document.getElementById('quiz-result');

  /* ────────────────────────────────────────────────────────────────
     3. STATE
     ──────────────────────────────────────────────────────────────── */
  var mode      = 'learn';
  var selCat    = 'form';
  var selSymbol = SYMBOLS[0];
  var learnPart = -1;
  var units     = 'si';        /* 'si' = mm, 'imp' = inch */
  var showGrid  = false;       /* canvas background grid toggle */

  /* fmtTol(SI mm) → display string. Imperial uses 0.001 in resolution.
     Returns just the numeric portion; unit label is appended separately. */
  function fmtTol(tolSI) {
    if (units === 'imp') {
      var inch = tolSI * 0.03937;
      return inch < 0.01 ? inch.toFixed(4) : inch.toFixed(3);
    }
    return (tolSI < 0.1 ? tolSI.toFixed(2) : tolSI.toFixed(2));
  }
  function uLabel() { return units === 'imp' ? 'in' : 'mm'; }

  /* The real-world application notes quote a tolerance in millimetres
     ("flat within 0.05 mm"). Restate them in the active system so the prose
     can't contradict the feature control frame drawn right above it. */
  function localizeExample(text) {
    if (units !== 'imp' || !text) return text;
    return text.replace(/(\d+(?:\.\d+)?)\s*mm\b/g, function (_, n) {
      return fmtTol(parseFloat(n)) + ' in';
    });
  }

  /* Practice */
  var pScore = 0, pTotal = 0, pCurrent = null, pLocked = false;
  var pQuestionType = 'symbol'; // 'symbol' | 'zone' | 'fcf'

  /* Quiz */
  var QUIZ_SIZE = 5;
  var quizSet = [], quizIdx = 0, quizScore = 0, quizLocked = false;
  var quizAnswers = [];

  /* Persistent stats — best score, attempts, lifetime accuracy. */
  var STATS_KEY = 'gdt-trainer-stats-v1';
  var stats = loadStats();
  function loadStats() {
    try {
      var raw = window.localStorage && localStorage.getItem(STATS_KEY);
      if (!raw) return { bestPct: 0, bestScore: 0, bestSize: 0, attempts: 0, correctTotal: 0, questionTotal: 0 };
      var s = JSON.parse(raw);
      if (!s || typeof s !== 'object') throw 0;
      return {
        bestPct:       +s.bestPct       || 0,
        bestScore:     +s.bestScore     || 0,
        bestSize:      +s.bestSize      || 0,
        attempts:      +s.attempts      || 0,
        correctTotal:  +s.correctTotal  || 0,
        questionTotal: +s.questionTotal || 0
      };
    } catch (err) {
      return { bestPct: 0, bestScore: 0, bestSize: 0, attempts: 0, correctTotal: 0, questionTotal: 0 };
    }
  }
  function saveStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(stats)); } catch (e) {}
  }
  /* ── Web Audio: procedural feedback chirps (no external files) ── */
  var audioCtx = null;
  var soundOn = true;
  function ensureAudio() {
    if (audioCtx) return audioCtx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    } catch (e) { audioCtx = null; }
    return audioCtx;
  }
  function tone(freq, dur, type, gain) {
    if (!soundOn) return;
    var ac = ensureAudio();
    if (!ac) return;
    var osc = ac.createOscillator();
    var g   = ac.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = freq;
    g.gain.value = 0.0001;
    osc.connect(g); g.connect(ac.destination);
    var t0 = ac.currentTime;
    osc.start(t0);
    g.gain.exponentialRampToValueAtTime(gain || 0.18, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.stop(t0 + dur + 0.02);
  }
  function playCorrect() {
    /* Ascending two-note chirp: pleasant, brief. */
    tone(660, 0.10, 'sine', 0.18);
    setTimeout(function () { tone(990, 0.14, 'sine', 0.20); }, 80);
  }
  function playWrong() {
    /* Low buzz — sawtooth descending. */
    tone(220, 0.16, 'sawtooth', 0.14);
    setTimeout(function () { tone(165, 0.20, 'sawtooth', 0.12); }, 90);
  }

  function recordQuizComplete(score, size) {
    stats.attempts++;
    stats.correctTotal  += score;
    stats.questionTotal += size;
    var pct = size ? (score / size) * 100 : 0;
    if (pct > stats.bestPct ||
        (pct === stats.bestPct && size > stats.bestSize)) {
      stats.bestPct   = pct;
      stats.bestScore = score;
      stats.bestSize  = size;
    }
    saveStats();
  }

  /* ────────────────────────────────────────────────────────────────
     4. DRAWING HELPERS
     ──────────────────────────────────────────────────────────────── */
  function clear() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
    if (showGrid) drawBgGrid();
  }

  function drawBgGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(139,157,195,0.10)';
    ctx.lineWidth = 1;
    var step = 30;
    for (var x = step; x < W; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = step; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawText(txt, x, y, opts) {
    opts = opts || {};
    ctx.font = (opts.weight || '600') + ' ' + (opts.size || 13) + 'px ' + (opts.family || "'Segoe UI', system-ui, sans-serif");
    ctx.fillStyle = opts.color || '#dde3f0';
    ctx.textAlign = opts.align || 'center';
    ctx.textBaseline = opts.baseline || 'middle';
    ctx.fillText(txt, x, y);
  }

  function drawSectionLabel(txt, x, y) {
    drawText(txt, x, y, { size: 11, weight: '700', color: '#6b7a99' });
  }

  /* ────────────────────────────────────────────────────────────────
     5. GD&T SYMBOL DRAWING — Precise geometric shapes
     ──────────────────────────────────────────────────────────────── */
  function drawGDTSymbol(id, cx, cy, size, color) {
    color = color || '#00bfa5';
    var s = size || 32;
    var hs = s / 2;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (id) {
      case 'flatness': {
        // Parallelogram (leaning rhombus) — ASME Y14.5 form-tolerance symbol
        var fw = hs * 0.95;   // horizontal half-width of top/bottom edges
        var fh = hs * 0.45;   // vertical half-height
        var sk = hs * 0.45;   // skew (right-lean) of top edge vs bottom edge
        ctx.beginPath();
        ctx.moveTo(cx - fw + sk, cy - fh); // top-left
        ctx.lineTo(cx + fw + sk, cy - fh); // top-right
        ctx.lineTo(cx + fw - sk, cy + fh); // bottom-right
        ctx.lineTo(cx - fw - sk, cy + fh); // bottom-left
        ctx.closePath();
        ctx.stroke();
        break;
      }

      case 'straightness':
        // Single horizontal line
        ctx.beginPath();
        ctx.moveTo(cx - hs, cy);
        ctx.lineTo(cx + hs, cy);
        ctx.stroke();
        break;

      case 'circularity':
        // Circle
        ctx.beginPath();
        ctx.arc(cx, cy, hs * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'cylindricity': {
        // Circle between two slanted tangent lines (ASME Y14.5)
        var cr = hs * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.stroke();
        var sx = hs * 0.45; // tangent-line skew
        // Top tangent (slants down-left to up-right, leaning right)
        ctx.beginPath();
        ctx.moveTo(cx - hs - sx * 0.2, cy - cr + sx * 0.2);
        ctx.lineTo(cx + hs - sx * 0.2, cy - cr - sx * 0.6);
        ctx.stroke();
        // Bottom tangent (parallel to top)
        ctx.beginPath();
        ctx.moveTo(cx - hs + sx * 0.2, cy + cr + sx * 0.6);
        ctx.lineTo(cx + hs + sx * 0.2, cy + cr - sx * 0.2);
        ctx.stroke();
        break;
      }

      case 'perpendicularity':
        // Inverted T: vertical line with horizontal base at top
        ctx.beginPath();
        ctx.moveTo(cx, cy + hs * 0.7);
        ctx.lineTo(cx, cy - hs * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.6, cy - hs * 0.3);
        ctx.lineTo(cx + hs * 0.6, cy - hs * 0.3);
        ctx.stroke();
        break;

      case 'angularity':
        // Angled line from bottom-left, horizontal base at bottom
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.5, cy + hs * 0.5);
        ctx.lineTo(cx + hs * 0.5, cy + hs * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.5, cy + hs * 0.5);
        ctx.lineTo(cx + hs * 0.3, cy - hs * 0.6);
        ctx.stroke();
        break;

      case 'parallelism':
        // Two parallel slanted lines
        var dx = hs * 0.25;
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.4 - dx, cy + hs * 0.5);
        ctx.lineTo(cx + hs * 0.4 - dx, cy - hs * 0.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.4 + dx, cy + hs * 0.5);
        ctx.lineTo(cx + hs * 0.4 + dx, cy - hs * 0.5);
        ctx.stroke();
        break;

      case 'position':
        // Circle with crosshairs
        var pr = hs * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, pr, 0, Math.PI * 2);
        ctx.stroke();
        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.8, cy);
        ctx.lineTo(cx + hs * 0.8, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - hs * 0.8);
        ctx.lineTo(cx, cy + hs * 0.8);
        ctx.stroke();
        break;

      case 'concentricity':
        // Two concentric circles
        ctx.beginPath();
        ctx.arc(cx, cy, hs * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, hs * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'symmetry':
        // Two long horizontal lines + one short centered line (ASME Y14.5-2009)
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.75, cy - hs * 0.45);
        ctx.lineTo(cx + hs * 0.75, cy - hs * 0.45);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.30, cy);
        ctx.lineTo(cx + hs * 0.30, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.75, cy + hs * 0.45);
        ctx.lineTo(cx + hs * 0.75, cy + hs * 0.45);
        ctx.stroke();
        break;

      case 'profile-line':
        // Arc (half-circle open at bottom)
        ctx.beginPath();
        ctx.arc(cx, cy + hs * 0.1, hs * 0.6, Math.PI, 0);
        ctx.stroke();
        break;

      case 'profile-surface':
        // D-shape: arc + vertical line (closed)
        ctx.beginPath();
        ctx.arc(cx + hs * 0.05, cy, hs * 0.55, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(cx + hs * 0.05 - hs * 0.55, cy + hs * 0.55);
        ctx.lineTo(cx + hs * 0.05 - hs * 0.55, cy - hs * 0.55);
        ctx.closePath();
        ctx.stroke();
        break;

      case 'circular-runout':
        // Single arrow pointing upper-right
        ctx.beginPath();
        ctx.moveTo(cx - hs * 0.6, cy + hs * 0.5);
        ctx.lineTo(cx + hs * 0.5, cy - hs * 0.4);
        ctx.stroke();
        // Arrowhead
        var ax = cx + hs * 0.5, ay = cy - hs * 0.4;
        var angle = Math.atan2(-0.9, 1.1);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4));
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4));
        ctx.stroke();
        break;

      case 'total-runout': {
        // Two parallel diagonal arrows pointing upper-right (ASME Y14.5)
        var trAngle = Math.atan2(-0.9, 1.1);
        var offX = 6 * Math.sin(trAngle);   // perpendicular offset between the two shafts
        var offY = -6 * Math.cos(trAngle);
        for (var k = 0; k < 2; k++) {
          var ox = (k === 0 ? -offX : offX);
          var oy = (k === 0 ? -offY : offY);
          var sx0 = cx - hs * 0.6 + ox, sy0 = cy + hs * 0.5 + oy;
          var ex  = cx + hs * 0.5 + ox, ey  = cy - hs * 0.4 + oy;
          ctx.beginPath();
          ctx.moveTo(sx0, sy0);
          ctx.lineTo(ex, ey);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 8 * Math.cos(trAngle - 0.4), ey - 8 * Math.sin(trAngle - 0.4));
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - 8 * Math.cos(trAngle + 0.4), ey - 8 * Math.sin(trAngle + 0.4));
          ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
  }

  /* ────────────────────────────────────────────────────────────────
     6. FEATURE CONTROL FRAME DRAWING
     ──────────────────────────────────────────────────────────────── */
  function drawFCF(cx, cy, symbolId, opts) {
    opts = opts || {};
    var boxH = opts.boxH || 44;
    var boxW = opts.boxW || 44;
    var tolVal = opts.tolVal || '0.05';
    var isDia = opts.isDia !== undefined ? opts.isDia : false;
    var matCond = opts.matCond || ''; // 'M', 'L', or ''
    var datumA = opts.datumA || 'A';
    var datumB = opts.datumB || 'B';
    var datumC = opts.datumC || '';
    var highlight = opts.highlight !== undefined ? opts.highlight : -1;
    var showLabels = opts.showLabels !== undefined ? opts.showLabels : false;

    // Calculate total width
    var compartments = [];
    compartments.push({ type: 'symbol', w: boxW });
    var tolW = boxW + (isDia ? 10 : 0) + (matCond ? 10 : 0);
    if (tolW < boxW) tolW = boxW;
    compartments.push({ type: 'tolerance', w: tolW + 14 });
    compartments.push({ type: 'datumA', w: boxW - 4 });
    if (datumB) compartments.push({ type: 'datumB', w: boxW - 4 });
    if (datumC) compartments.push({ type: 'datumC', w: boxW - 4 });

    var totalW = 0;
    for (var i = 0; i < compartments.length; i++) totalW += compartments[i].w;
    var startX = cx - totalW / 2;
    var startY = cy - boxH / 2;

    // Highlight colors for learn mode parts
    var partColors = [];
    for (var p = 0; p < LEARN_PARTS.length; p++) partColors.push(LEARN_PARTS[p].color);

    // Draw each compartment
    var curX = startX;
    for (var c = 0; c < compartments.length; c++) {
      var comp = compartments[c];
      var isHighlighted = false;
      var hlColor = '#00bfa5';

      // Determine if highlighted
      if (highlight === 0 && comp.type === 'symbol') { isHighlighted = true; hlColor = partColors[0]; }
      if (highlight === 1 && comp.type === 'tolerance') { isHighlighted = true; hlColor = partColors[1]; }
      if (highlight === 2 && comp.type === 'tolerance') { isHighlighted = true; hlColor = partColors[2]; }
      if (highlight === 3 && comp.type === 'datumA') { isHighlighted = true; hlColor = partColors[3]; }
      if (highlight === 4 && comp.type === 'datumB') { isHighlighted = true; hlColor = partColors[4]; }
      if (highlight === 5 && comp.type === 'datumC') { isHighlighted = true; hlColor = partColors[5]; }

      // Background highlight
      if (isHighlighted) {
        ctx.fillStyle = hlColor + '22';
        ctx.fillRect(curX, startY, comp.w, boxH);
      }

      // Border
      ctx.strokeStyle = isHighlighted ? hlColor : '#546e7a';
      ctx.lineWidth = isHighlighted ? 2.5 : 2;
      ctx.strokeRect(curX, startY, comp.w, boxH);

      // Content
      var ccx = curX + comp.w / 2;
      var ccy = cy;

      if (comp.type === 'symbol') {
        drawGDTSymbol(symbolId, ccx, ccy, boxH * 0.65, isHighlighted ? hlColor : '#00bfa5');
      } else if (comp.type === 'tolerance') {
        var tolStr = '';
        if (isDia) tolStr += '\u2300';
        tolStr += tolVal;
        var tolColor = (highlight === 1) ? partColors[1] : '#dde3f0';
        drawText(tolStr, ccx - (matCond ? 8 : 0), ccy, { size: 14, weight: '700', color: tolColor, family: "'Courier New', monospace" });
        if (matCond) {
          // Draw circled letter for material condition
          var mcx = ccx + comp.w / 2 - 16;
          var mcColor = (highlight === 2) ? partColors[2] : '#f5c842';
          ctx.beginPath();
          ctx.arc(mcx, ccy, 9, 0, Math.PI * 2);
          ctx.strokeStyle = mcColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          drawText(matCond, mcx, ccy, { size: 10, weight: '700', color: mcColor });
        }
      } else if (comp.type === 'datumA') {
        var daColor = (highlight === 3) ? partColors[3] : '#dde3f0';
        drawText(datumA, ccx, ccy, { size: 16, weight: '700', color: daColor });
      } else if (comp.type === 'datumB') {
        var dbColor = (highlight === 4) ? partColors[4] : '#dde3f0';
        drawText(datumB, ccx, ccy, { size: 16, weight: '700', color: dbColor });
      } else if (comp.type === 'datumC') {
        var dcColor = (highlight === 5) ? partColors[5] : '#dde3f0';
        drawText(datumC, ccx, ccy, { size: 16, weight: '700', color: dcColor });
      }

      // Labels below for learn mode
      if (showLabels) {
        var labelMap = {
          symbol: 'Geometric\nSymbol',
          tolerance: isDia ? '\u2300 Tolerance\n+ Modifier' : 'Tolerance\nValue',
          datumA: 'Primary\nDatum',
          datumB: 'Secondary\nDatum',
          datumC: 'Tertiary\nDatum'
        };
        var label = labelMap[comp.type] || '';
        var lines = label.split('\n');
        var labelColor = '#6b7a99';
        if (comp.type === 'symbol' && highlight === 0) labelColor = partColors[0];
        if (comp.type === 'tolerance' && (highlight === 1 || highlight === 2)) labelColor = partColors[highlight];
        if (comp.type === 'datumA' && highlight === 3) labelColor = partColors[3];
        if (comp.type === 'datumB' && highlight === 4) labelColor = partColors[4];
        if (comp.type === 'datumC' && highlight === 5) labelColor = partColors[5];
        for (var li = 0; li < lines.length; li++) {
          drawText(lines[li], ccx, startY + boxH + 16 + li * 13, { size: 10, weight: '600', color: labelColor });
        }

        // Draw small triangle pointer
        ctx.fillStyle = labelColor;
        ctx.beginPath();
        ctx.moveTo(ccx, startY + boxH + 2);
        ctx.lineTo(ccx - 4, startY + boxH + 8);
        ctx.lineTo(ccx + 4, startY + boxH + 8);
        ctx.closePath();
        ctx.fill();
      }

      curX += comp.w;
    }

    return { x: startX, y: startY, w: totalW, h: boxH };
  }

  /* ────────────────────────────────────────────────────────────────
     7. TOLERANCE ZONE VISUALIZATION
     ──────────────────────────────────────────────────────────────── */
  function drawToleranceZone(symbolId, cx, cy, size) {
    var s = size || 200;
    ctx.save();

    switch (symbolId) {
      case 'flatness': {
        // Rectangular part with two parallel plane zone
        var pw = s * 0.9, ph = s * 0.25;
        // Part body
        ctx.fillStyle = '#2a3050';
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.fillRect(cx - pw / 2, cy - ph / 2, pw, ph);
        ctx.strokeRect(cx - pw / 2, cy - ph / 2, pw, ph);
        // Top surface (the controlled surface)
        ctx.strokeStyle = '#dde3f0';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - pw / 2, cy - ph / 2);
        ctx.lineTo(cx + pw / 2, cy - ph / 2);
        ctx.stroke();
        // Tolerance zone — two dashed lines above surface
        var zoneH = 12;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - pw / 2 + 10, cy - ph / 2 - zoneH / 2 - 15);
        ctx.lineTo(cx + pw / 2 - 10, cy - ph / 2 - zoneH / 2 - 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - pw / 2 + 10, cy - ph / 2 - zoneH / 2 - 15 + zoneH);
        ctx.lineTo(cx + pw / 2 - 10, cy - ph / 2 - zoneH / 2 - 15 + zoneH);
        ctx.stroke();
        ctx.setLineDash([]);
        // Zone fill
        ctx.fillStyle = 'rgba(0,191,165,.12)';
        ctx.fillRect(cx - pw / 2 + 10, cy - ph / 2 - zoneH / 2 - 15, pw - 20, zoneH);
        // Dimension arrow
        var dimX = cx + pw / 2 - 5;
        drawDimArrow(dimX, cy - ph / 2 - 15 - zoneH / 2, dimX, cy - ph / 2 - 15 + zoneH / 2, 't', '#00bfa5');
        drawText('t', dimX + 14, cy - ph / 2 - 15, { size: 11, color: '#00bfa5', weight: '700' });
        // Label
        drawText('Tolerance Zone: Two Parallel Planes', cx, cy + ph / 2 + 22, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'straightness': {
        // Long bar with tolerance band
        var bw = s * 0.9, bh = 10;
        ctx.fillStyle = '#2a3050';
        ctx.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
        // Two parallel dashed lines
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - bw / 2 + 5, cy - 14);
        ctx.lineTo(cx + bw / 2 - 5, cy - 14);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - bw / 2 + 5, cy + 14);
        ctx.lineTo(cx + bw / 2 - 5, cy + 14);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,191,165,.12)';
        ctx.fillRect(cx - bw / 2 + 5, cy - 14, bw - 10, 28);
        drawText('Tolerance Zone: Two Parallel Lines', cx, cy + 35, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'circularity': {
        // Cross section with annular ring
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        // Tolerance zone rings
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        // Fill zone
        ctx.fillStyle = 'rgba(0,191,165,.1)';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
        ctx.arc(cx, cy, s * 0.25, 0, Math.PI * 2, true);
        ctx.fill();
        drawText('Tolerance Zone: Annular Ring', cx, cy + s * 0.35 + 22, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'cylindricity': {
        // Side view of cylinder with zone
        var cw = s * 0.5, ch = s * 0.7;
        // Outer zone
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 1.5;
        drawCylinder(cx, cy, cw + 14, ch, '#00bfa5', true);
        // Part
        ctx.setLineDash([]);
        drawCylinder(cx, cy, cw, ch, '#546e7a', false);
        // Inner zone
        ctx.setLineDash([6, 4]);
        drawCylinder(cx, cy, cw - 14, ch, '#00bfa5', true);
        ctx.setLineDash([]);
        drawText('Tolerance Zone: Two Concentric Cylinders', cx, cy + ch / 2 + 28, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'perpendicularity': {
        // L-shaped part with datum plane and perpendicular zone
        drawOrientedZone(cx, cy, s, 90, 'Perpendicular to Datum A');
        break;
      }

      case 'angularity': {
        drawOrientedZone(cx, cy, s, 60, 'At Basic Angle to Datum A');
        break;
      }

      case 'parallelism': {
        drawOrientedZone(cx, cy, s, 0, 'Parallel to Datum A');
        break;
      }

      case 'position': {
        // Top view of hole with cylindrical tolerance zone
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        // Part outline
        ctx.fillStyle = '#2a3050';
        ctx.fillRect(cx - s * 0.4, cy - s * 0.35, s * 0.8, s * 0.7);
        ctx.strokeRect(cx - s * 0.4, cy - s * 0.35, s * 0.8, s * 0.7);
        // True position crosshairs
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = '#6b7a99';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - s * 0.3);
        ctx.lineTo(cx, cy + s * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.35, cy);
        ctx.lineTo(cx + s * 0.35, cy);
        ctx.stroke();
        ctx.setLineDash([]);
        // Hole
        ctx.strokeStyle = '#dde3f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx + 5, cy - 3, s * 0.12, 0, Math.PI * 2);
        ctx.stroke();
        // Tolerance zone cylinder
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.18, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,191,165,.1)';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
        drawText('\u2300 Tol Zone', cx, cy + s * 0.22, { size: 9, color: '#00bfa5', weight: '700' });
        drawText('Tolerance Zone: Cylinder at True Position', cx, cy + s * 0.35 + 22, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'concentricity': {
        // Two concentric circles
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
        ctx.stroke();
        // Inner feature offset slightly
        ctx.beginPath();
        ctx.arc(cx + 3, cy - 2, s * 0.15, 0, Math.PI * 2);
        ctx.stroke();
        // Datum axis
        ctx.fillStyle = '#4fc3f7';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
        // Tolerance zone
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.08, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,191,165,.12)';
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.08, 0, Math.PI * 2);
        ctx.fill();
        drawText('Datum Axis', cx, cy + s * 0.08 + 14, { size: 9, color: '#4fc3f7', weight: '700' });
        drawText('Tolerance Zone: Cylinder about Datum Axis', cx, cy + s * 0.35 + 22, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'symmetry': {
        // Rectangular part with center plane
        var sw = s * 0.8, sh = s * 0.35;
        ctx.fillStyle = '#2a3050';
        ctx.fillRect(cx - sw / 2, cy - sh / 2, sw, sh);
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - sw / 2, cy - sh / 2, sw, sh);
        // Datum center plane
        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - sh / 2 - 15);
        ctx.lineTo(cx, cy + sh / 2 + 15);
        ctx.stroke();
        // Tolerance zone planes
        ctx.strokeStyle = '#00bfa5';
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - sh / 2 - 10);
        ctx.lineTo(cx - 8, cy + sh / 2 + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 8, cy - sh / 2 - 10);
        ctx.lineTo(cx + 8, cy + sh / 2 + 10);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0,191,165,.1)';
        ctx.fillRect(cx - 8, cy - sh / 2 - 10, 16, sh + 20);
        drawText('Tolerance Zone: Two Parallel Planes about Datum', cx, cy + sh / 2 + 32, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'profile-line': {
        // Curved line with tolerance band
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.4, cy + 10);
        ctx.quadraticCurveTo(cx - s * 0.1, cy - s * 0.3, cx + s * 0.15, cy - 5);
        ctx.quadraticCurveTo(cx + s * 0.3, cy + 10, cx + s * 0.4, cy);
        ctx.stroke();
        // Tolerance band
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.4, cy + 10 - 10);
        ctx.quadraticCurveTo(cx - s * 0.1, cy - s * 0.3 - 10, cx + s * 0.15, cy - 5 - 10);
        ctx.quadraticCurveTo(cx + s * 0.3, cy + 10 - 10, cx + s * 0.4, cy - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.4, cy + 10 + 10);
        ctx.quadraticCurveTo(cx - s * 0.1, cy - s * 0.3 + 10, cx + s * 0.15, cy - 5 + 10);
        ctx.quadraticCurveTo(cx + s * 0.3, cy + 10 + 10, cx + s * 0.4, cy + 10);
        ctx.stroke();
        ctx.setLineDash([]);
        drawText('Tolerance Zone: Two Curved Lines (per section)', cx, cy + s * 0.3 + 15, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'profile-surface': {
        // 3D surface representation
        ctx.strokeStyle = '#546e7a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.4, cy + s * 0.15);
        ctx.bezierCurveTo(cx - s * 0.2, cy - s * 0.25, cx + s * 0.15, cy - s * 0.2, cx + s * 0.4, cy + s * 0.05);
        ctx.stroke();
        // Zone band
        ctx.setLineDash([5, 3]);
        ctx.strokeStyle = '#00bfa5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.4, cy + s * 0.15 - 12);
        ctx.bezierCurveTo(cx - s * 0.2, cy - s * 0.25 - 12, cx + s * 0.15, cy - s * 0.2 - 12, cx + s * 0.4, cy + s * 0.05 - 12);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - s * 0.4, cy + s * 0.15 + 12);
        ctx.bezierCurveTo(cx - s * 0.2, cy - s * 0.25 + 12, cx + s * 0.15, cy - s * 0.2 + 12, cx + s * 0.4, cy + s * 0.05 + 12);
        ctx.stroke();
        ctx.setLineDash([]);
        drawText('Tolerance Zone: Two Surfaces about True Profile', cx, cy + s * 0.3 + 15, { size: 11, color: '#6b7a99', weight: '600' });
        break;
      }

      case 'circular-runout': {
        // Shaft rotating with single indicator
        drawRunoutZone(cx, cy, s, false);
        break;
      }

      case 'total-runout': {
        drawRunoutZone(cx, cy, s, true);
        break;
      }
    }
    ctx.restore();
  }

  /* Helper: draw oriented tolerance zone (perpendicularity, angularity, parallelism) */
  function drawOrientedZone(cx, cy, s, angleDeg, label) {
    var pw = s * 0.7, ph = s * 0.12;
    // Base datum plane
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(cx - pw / 2, cy + s * 0.15, pw, ph);
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - pw / 2, cy + s * 0.15, pw, ph);
    // Datum label
    drawText('Datum A', cx, cy + s * 0.15 + ph + 14, { size: 10, color: '#4fc3f7', weight: '700' });
    // Datum indicator triangle
    ctx.fillStyle = '#4fc3f7';
    ctx.beginPath();
    ctx.moveTo(cx - pw / 2 + 20, cy + s * 0.15);
    ctx.lineTo(cx - pw / 2 + 14, cy + s * 0.15 - 10);
    ctx.lineTo(cx - pw / 2 + 26, cy + s * 0.15 - 10);
    ctx.closePath();
    ctx.fill();

    // Vertical feature at angle
    var angleRad = (90 - angleDeg) * Math.PI / 180;
    var fLen = s * 0.45;
    var fBase = { x: cx - pw * 0.1, y: cy + s * 0.15 };

    ctx.strokeStyle = '#dde3f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(fBase.x, fBase.y);
    ctx.lineTo(fBase.x + fLen * Math.sin(angleRad * -1 + Math.PI / 2), fBase.y - fLen * Math.cos(angleRad * -1 + Math.PI / 2));
    ctx.stroke();

    // Tolerance zone lines
    var zoneOffset = 7;
    var perpAngle = angleRad * -1 + Math.PI / 2;
    var nx = -Math.sin(perpAngle - Math.PI / 2);
    var ny = Math.cos(perpAngle - Math.PI / 2);

    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#00bfa5';
    ctx.lineWidth = 1.5;

    var tipX = fBase.x + fLen * Math.sin(angleRad * -1 + Math.PI / 2);
    var tipY = fBase.y - fLen * Math.cos(angleRad * -1 + Math.PI / 2);

    ctx.beginPath();
    ctx.moveTo(fBase.x + nx * zoneOffset, fBase.y + ny * zoneOffset);
    ctx.lineTo(tipX + nx * zoneOffset, tipY + ny * zoneOffset);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(fBase.x - nx * zoneOffset, fBase.y - ny * zoneOffset);
    ctx.lineTo(tipX - nx * zoneOffset, tipY - ny * zoneOffset);
    ctx.stroke();
    ctx.setLineDash([]);

    // Zone fill
    ctx.fillStyle = 'rgba(0,191,165,.1)';
    ctx.beginPath();
    ctx.moveTo(fBase.x + nx * zoneOffset, fBase.y + ny * zoneOffset);
    ctx.lineTo(tipX + nx * zoneOffset, tipY + ny * zoneOffset);
    ctx.lineTo(tipX - nx * zoneOffset, tipY - ny * zoneOffset);
    ctx.lineTo(fBase.x - nx * zoneOffset, fBase.y - ny * zoneOffset);
    ctx.closePath();
    ctx.fill();

    // Angle arc for angularity
    if (angleDeg !== 90 && angleDeg !== 0) {
      ctx.strokeStyle = '#f5c842';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(fBase.x, fBase.y, 30, -Math.PI / 2, -Math.PI / 2 + (90 - angleDeg) * Math.PI / 180);
      ctx.stroke();
      var midAngle = -Math.PI / 2 + (90 - angleDeg) * Math.PI / 360;
      drawText(angleDeg + '\u00B0', fBase.x + 42 * Math.cos(midAngle), fBase.y + 42 * Math.sin(midAngle), { size: 10, color: '#f5c842', weight: '700' });
    }

    drawText('Tolerance Zone: ' + label, cx, cy + s * 0.15 + ph + 32, { size: 11, color: '#6b7a99', weight: '600' });
  }

  /* Helper: draw cylinder outline (side view) */
  function drawCylinder(cx, cy, w, h, color, dashed) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    // Top ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy - h / 2 + 8, w / 2, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Bottom ellipse
    ctx.beginPath();
    ctx.ellipse(cx, cy + h / 2 - 8, w / 2, 8, 0, 0, Math.PI);
    ctx.stroke();
    // Side lines
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy - h / 2 + 8);
    ctx.lineTo(cx - w / 2, cy + h / 2 - 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + w / 2, cy - h / 2 + 8);
    ctx.lineTo(cx + w / 2, cy + h / 2 - 8);
    ctx.stroke();
  }

  /* Helper: draw runout zone */
  function drawRunoutZone(cx, cy, s, isTotal) {
    // Shaft
    var sw = s * 0.15, sh = s * 0.6;
    ctx.fillStyle = '#2a3050';
    ctx.fillRect(cx - sw / 2, cy - sh / 2, sw, sh);
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - sw / 2, cy - sh / 2, sw, sh);

    // Datum axis
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#4fc3f7';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy - sh / 2 - 15);
    ctx.lineTo(cx, cy + sh / 2 + 15);
    ctx.stroke();
    ctx.setLineDash([]);
    drawText('Datum Axis', cx, cy + sh / 2 + 26, { size: 9, color: '#4fc3f7', weight: '700' });

    // Rotation arrows
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy - sh / 2 - 8, 12, 0.3, Math.PI * 1.7);
    ctx.stroke();
    // arrow tip
    var arrowAngle = Math.PI * 1.7;
    ctx.beginPath();
    ctx.moveTo(cx + 12 * Math.cos(arrowAngle), cy - sh / 2 - 8 + 12 * Math.sin(arrowAngle));
    ctx.lineTo(cx + 12 * Math.cos(arrowAngle) + 5, cy - sh / 2 - 8 + 12 * Math.sin(arrowAngle) - 3);
    ctx.stroke();

    // Dial indicator
    var indY = cy - 5;
    ctx.strokeStyle = '#00bfa5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + sw / 2, indY);
    ctx.lineTo(cx + sw / 2 + 30, indY);
    ctx.stroke();
    // Indicator dial
    ctx.beginPath();
    ctx.arc(cx + sw / 2 + 42, indY, 12, 0, Math.PI * 2);
    ctx.stroke();
    drawText('FIM', cx + sw / 2 + 42, indY, { size: 7, color: '#00bfa5', weight: '700' });

    if (isTotal) {
      // Show indicator sweeping along length
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = 'rgba(0,191,165,.4)';
      ctx.lineWidth = 1;
      for (var i = -3; i <= 3; i++) {
        if (i === 0) continue;
        var iy = indY + i * 18;
        ctx.beginPath();
        ctx.moveTo(cx + sw / 2, iy);
        ctx.lineTo(cx + sw / 2 + 25, iy);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      drawText('Indicator sweeps entire surface', cx, cy + sh / 2 + 42, { size: 10, color: '#6b7a99', weight: '600' });
      drawText('Tolerance Zone: FIM Across Entire Surface', cx, cy + sh / 2 + 58, { size: 11, color: '#6b7a99', weight: '600' });
    } else {
      drawText('Indicator at one cross-section', cx, cy + sh / 2 + 42, { size: 10, color: '#6b7a99', weight: '600' });
      drawText('Tolerance Zone: FIM at Each Cross-Section', cx, cy + sh / 2 + 58, { size: 11, color: '#6b7a99', weight: '600' });
    }
  }

  /* Helper: dimension arrow */
  function drawDimArrow(x1, y1, x2, y2, label, color) {
    ctx.strokeStyle = color || '#00bfa5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    // Arrowheads
    var sz = 4;
    ctx.fillStyle = color || '#00bfa5';
    ctx.beginPath();
    ctx.moveTo(x1 - sz, y1 + sz);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1 + sz, y1 + sz);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x2 - sz, y2 - sz);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 + sz, y2 - sz);
    ctx.closePath();
    ctx.fill();
  }

  /* ────────────────────────────────────────────────────────────────
     8. MAIN DRAW FUNCTION — Pure render, no state mutation
     ──────────────────────────────────────────────────────────────── */
  function draw() {
    clear();

    if (mode === 'learn') {
      drawLearnMode();
    } else if (mode === 'explore') {
      drawExploreMode();
    } else if (mode === 'practice') {
      drawPracticeMode();
    } else if (mode === 'quiz') {
      drawQuizMode();
    }
  }

  /* ── LEARN MODE ── */
  function drawLearnMode() {
    drawSectionLabel('FEATURE CONTROL FRAME — ASME Y14.5', W / 2, 28);

    // Draw large FCF
    drawFCF(W / 2, H * 0.3, 'position', {
      boxH: 56, boxW: 56,
      tolVal: fmtTol(0.25), isDia: true, matCond: 'M',
      datumA: 'A', datumB: 'B', datumC: 'C',
      highlight: learnPart,
      showLabels: true
    });

    // Draw leader line from FCF to a part feature
    var fcfBottom = H * 0.3 + 56;
    var partY = H * 0.72;

    // Small part drawing
    ctx.fillStyle = '#2a3050';
    ctx.strokeStyle = '#546e7a';
    ctx.lineWidth = 2;
    ctx.fillRect(W / 2 - 100, partY - 25, 200, 50);
    ctx.strokeRect(W / 2 - 100, partY - 25, 200, 50);
    // Hole
    ctx.strokeStyle = '#dde3f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2 + 40, partY, 12, 0, Math.PI * 2);
    ctx.stroke();
    // Centerlines
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(W / 2 + 40, partY - 20);
    ctx.lineTo(W / 2 + 40, partY + 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W / 2 + 22, partY);
    ctx.lineTo(W / 2 + 58, partY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Leader line
    ctx.strokeStyle = '#6b7a99';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 + 40, partY - 12);
    ctx.lineTo(W / 2 + 40, fcfBottom + 50);
    ctx.stroke();
    // Arrow at feature
    ctx.fillStyle = '#6b7a99';
    ctx.beginPath();
    ctx.moveTo(W / 2 + 40, partY - 12);
    ctx.lineTo(W / 2 + 36, partY - 20);
    ctx.lineTo(W / 2 + 44, partY - 20);
    ctx.closePath();
    ctx.fill();

    // Datum labels on part
    // Datum A - bottom surface
    ctx.fillStyle = '#e91e63';
    var triY = partY + 25;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 60, triY);
    ctx.lineTo(W / 2 - 66, triY + 12);
    ctx.lineTo(W / 2 - 54, triY + 12);
    ctx.closePath();
    ctx.fill();
    drawText('A', W / 2 - 60, triY + 22, { size: 11, weight: '700', color: '#e91e63' });

    // Datum B - left surface
    ctx.fillStyle = '#ff9800';
    ctx.beginPath();
    ctx.moveTo(W / 2 - 100, partY);
    ctx.lineTo(W / 2 - 112, partY - 6);
    ctx.lineTo(W / 2 - 112, partY + 6);
    ctx.closePath();
    ctx.fill();
    drawText('B', W / 2 - 122, partY, { size: 11, weight: '700', color: '#ff9800' });

    drawText('Click a part below to highlight it on the diagram', W / 2, H - 14, { size: 10, color: '#6b7a99', weight: '600' });
  }

  /* ── EXPLORE MODE ── */
  function drawExploreMode() {
    var sym = selSymbol;
    drawSectionLabel(CATEGORIES[sym.cat].toUpperCase() + ' TOLERANCE', W / 2, 22);

    // Left: Large symbol
    var leftX = W * 0.22;
    drawText(sym.name, leftX, 52, { size: 16, weight: '800', color: '#dde3f0' });

    // Symbol in a box
    ctx.strokeStyle = '#2a3050';
    ctx.lineWidth = 2;
    ctx.strokeRect(leftX - 50, 68, 100, 80);
    ctx.fillStyle = '#161b27';
    ctx.fillRect(leftX - 49, 69, 98, 78);
    drawGDTSymbol(sym.id, leftX, 108, 50, '#00bfa5');

    // Category badge
    drawText(sym.datum ? 'Datum Required' : 'No Datum Required', leftX, 168, {
      size: 10, weight: '700', color: sym.datum ? '#f5c842' : '#3ddc84'
    });

    // FCF example
    drawText('Feature Control Frame Example', leftX, 198, { size: 10, color: '#6b7a99', weight: '700' });
    drawFCF(leftX, 235, sym.id, {
      boxH: 38, boxW: 38,
      tolVal: fmtTol(sym.tolSI || 0.05),
      isDia: (sym.id === 'position' || sym.id === 'concentricity'),
      matCond: sym.datum ? 'M' : '',
      datumA: sym.datum ? 'A' : '',
      datumB: (sym.cat === 'location') ? 'B' : '',
      datumC: ''
    });

    // Right: Tolerance zone visualization
    var rightX = W * 0.65;
    drawText('TOLERANCE ZONE VISUALIZATION', rightX, 52, { size: 10, color: '#6b7a99', weight: '700' });
    drawToleranceZone(sym.id, rightX, H * 0.48, Math.min(W * 0.45, 280));
  }

  /* ── PRACTICE MODE ── */
  function drawPracticeMode() {
    if (!pCurrent) return;
    var q = pCurrent;

    if (q.type === 'symbol') {
      drawSectionLabel('IDENTIFY THIS GD&T SYMBOL', W / 2, 30);
      // Large symbol in center
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 2;
      var boxSize = 140;
      ctx.strokeRect(W / 2 - boxSize / 2, H / 2 - boxSize / 2 - 20, boxSize, boxSize);
      ctx.fillStyle = '#161b27';
      ctx.fillRect(W / 2 - boxSize / 2 + 1, H / 2 - boxSize / 2 - 19, boxSize - 2, boxSize - 2);
      drawGDTSymbol(q.symbolId, W / 2, H / 2 - 20, 80, '#00bfa5');

    } else if (q.type === 'zone') {
      drawSectionLabel('WHAT TOLERANCE ZONE DOES THIS SYMBOL CREATE?', W / 2, 30);
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 2;
      var zoneBoxSize = 120;
      ctx.strokeRect(W / 2 - zoneBoxSize / 2, H / 2 - zoneBoxSize / 2 - 20, zoneBoxSize, zoneBoxSize);
      ctx.fillStyle = '#161b27';
      ctx.fillRect(W / 2 - zoneBoxSize / 2 + 1, H / 2 - zoneBoxSize / 2 - 19, zoneBoxSize - 2, zoneBoxSize - 2);
      drawGDTSymbol(q.symbolId, W / 2, H / 2 - 20, 70, '#00bfa5');
      drawText(q.symbolName, W / 2, H / 2 + zoneBoxSize / 2 - 5, { size: 13, weight: '700', color: '#dde3f0' });

    } else if (q.type === 'fcf') {
      drawSectionLabel('WHAT DOES THIS FEATURE CONTROL FRAME SPECIFY?', W / 2, 30);
      drawFCF(W / 2, H / 2 - 10, q.symbolId, {
        boxH: 48, boxW: 48,
        tolVal: fmtTol(q.tolSI != null ? q.tolSI : 0.05),
        isDia: q.isDia || false,
        matCond: q.matCond || '',
        datumA: q.datumA || 'A',
        datumB: q.datumB || '',
        datumC: ''
      });
    }
  }

  /* ── QUIZ MODE ── */
  function drawQuizMode() {
    if (quizIdx >= quizSet.length) return;
    var q = quizSet[quizIdx];

    if (q.type === 'symbol') {
      drawSectionLabel('IDENTIFY THIS GD&T SYMBOL  (' + (quizIdx + 1) + '/' + QUIZ_SIZE + ')', W / 2, 30);
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 2;
      var qs = 140;
      ctx.strokeRect(W / 2 - qs / 2, H / 2 - qs / 2 - 20, qs, qs);
      ctx.fillStyle = '#161b27';
      ctx.fillRect(W / 2 - qs / 2 + 1, H / 2 - qs / 2 - 19, qs - 2, qs - 2);
      drawGDTSymbol(q.symbolId, W / 2, H / 2 - 20, 80, '#00bfa5');

    } else if (q.type === 'zone') {
      drawSectionLabel('MATCH THE TOLERANCE ZONE  (' + (quizIdx + 1) + '/' + QUIZ_SIZE + ')', W / 2, 30);
      ctx.strokeStyle = '#2a3050';
      ctx.lineWidth = 2;
      var zs = 120;
      ctx.strokeRect(W / 2 - zs / 2, H / 2 - zs / 2 - 20, zs, zs);
      ctx.fillStyle = '#161b27';
      ctx.fillRect(W / 2 - zs / 2 + 1, H / 2 - zs / 2 - 19, zs - 2, zs - 2);
      drawGDTSymbol(q.symbolId, W / 2, H / 2 - 20, 70, '#00bfa5');
      drawText(q.symbolName, W / 2, H / 2 + zs / 2 - 5, { size: 13, weight: '700', color: '#dde3f0' });

    } else if (q.type === 'fcf') {
      drawSectionLabel('READ THIS FEATURE CONTROL FRAME  (' + (quizIdx + 1) + '/' + QUIZ_SIZE + ')', W / 2, 30);
      drawFCF(W / 2, H / 2 - 10, q.symbolId, {
        boxH: 48, boxW: 48,
        tolVal: fmtTol(q.tolSI != null ? q.tolSI : 0.05),
        isDia: q.isDia || false,
        matCond: q.matCond || '',
        datumA: q.datumA || 'A',
        datumB: q.datumB || '',
        datumC: ''
      });

    } else if (q.type === 'datum') {
      drawSectionLabel('GD&T KNOWLEDGE  (' + (quizIdx + 1) + '/' + QUIZ_SIZE + ')', W / 2, 30);
      // Text question - wrap long text
      var lines = wrapText(q.question, 60);
      for (var i = 0; i < lines.length; i++) {
        drawText(lines[i], W / 2, H / 2 - 30 + i * 22, { size: 15, weight: '700', color: '#dde3f0' });
      }
    }
  }

  function wrapText(str, maxChars) {
    var words = str.split(' ');
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      if ((line + ' ' + words[i]).trim().length > maxChars) {
        lines.push(line.trim());
        line = words[i];
      } else {
        line += ' ' + words[i];
      }
    }
    if (line.trim()) lines.push(line.trim());
    return lines;
  }

  /* ────────────────────────────────────────────────────────────────
     9. UI: MODE SWITCHING & PANEL VISIBILITY
     ──────────────────────────────────────────────────────────────── */
  function showPanels() {
    elLearnInfo.style.display      = mode === 'learn' ? '' : 'none';
    elSymbolSelector.style.display = mode === 'explore' ? '' : 'none';
    elSymInfo.style.display        = mode === 'explore' ? '' : 'none';
    elPracticePanel.style.display  = mode === 'practice' ? '' : 'none';
    elPracticeBar.style.display    = mode === 'practice' ? '' : 'none';
    elQuizPanel.style.display      = mode === 'quiz' && quizIdx < quizSet.length ? '' : 'none';
    elQuizBar.style.display        = mode === 'quiz' && quizIdx < quizSet.length ? '' : 'none';
    elQuizResult.style.display     = 'none';
  }

  /* ────────────────────────────────────────────────────────────────
     10. UI: LEARN MODE PARTS
     ──────────────────────────────────────────────────────────────── */
  function buildLearnParts() {
    var container = document.getElementById('learn-parts');
    container.innerHTML = '';
    for (var i = 0; i < LEARN_PARTS.length; i++) {
      var part = LEARN_PARTS[i];
      var el = document.createElement('div');
      el.className = 'learn-part' + (learnPart === i ? ' active' : '');
      el.setAttribute('data-idx', i);
      el.innerHTML = '<div class="learn-dot" style="background:' + part.color + '"></div>' +
        '<div><div class="learn-part-name">' + part.name + '</div>' +
        '<div class="learn-part-desc">' + part.desc + '</div></div>';
      container.appendChild(el);
    }
  }

  document.getElementById('learn-parts').addEventListener('pointerdown', function (e) {
    var el = e.target.closest('.learn-part');
    if (!el) return;
    var idx = parseInt(el.getAttribute('data-idx'), 10);
    learnPart = (learnPart === idx) ? -1 : idx;
    buildLearnParts();
    draw();
  });

  /* ────────────────────────────────────────────────────────────────
     11. UI: EXPLORE MODE — Category tabs & symbol grid
     ──────────────────────────────────────────────────────────────── */
  function buildSymGrid() {
    var grid = document.getElementById('sym-grid');
    grid.innerHTML = '';
    var filtered = SYMBOLS.filter(function (s) { return s.cat === selCat; });
    for (var i = 0; i < filtered.length; i++) {
      var sym = filtered[i];
      var btn = document.createElement('button');
      btn.className = 'ws-btn' + (sym.id === selSymbol.id ? ' active' : '');
      btn.setAttribute('data-id', sym.id);
      btn.innerHTML = '<span class="ws-btn-name">' + sym.name + '</span>' +
        '<span class="ws-btn-id">' + (sym.datum ? 'Datum Required' : 'No Datum') + '</span>';
      grid.appendChild(btn);
    }
  }

  function updateSymInfo() {
    var s = selSymbol;
    document.getElementById('si-name').textContent = s.name;
    document.getElementById('si-cat').textContent = CATEGORIES[s.cat];
    var isoEl = document.getElementById('si-iso');
    if (isoEl) isoEl.textContent = s.iso || 'ISO 1101';
    document.getElementById('si-desc').textContent = s.zone;
    document.getElementById('si-datum').textContent = s.datum ? 'Yes — tolerance is measured relative to a datum reference frame.' : 'No — this is a form tolerance that controls an individual feature independently.';
    document.getElementById('si-zone').textContent = s.zone;
    document.getElementById('si-example').textContent = localizeExample(s.example);
  }

  document.getElementById('sym-grid').addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.ws-btn');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    for (var i = 0; i < SYMBOLS.length; i++) {
      if (SYMBOLS[i].id === id) { selSymbol = SYMBOLS[i]; break; }
    }
    buildSymGrid();
    updateSymInfo();
    draw();
  });

  /* Unit toggle (mm ↔ inch) */
  var unitTabs = document.getElementById('unit-tabs');
  if (unitTabs) unitTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var v = pill.getAttribute('data-units');
    if (!v || v === units) return;
    units = v;
    var pills = this.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    pill.classList.add('active');
    if (mode === 'explore') updateSymInfo();
    draw();
  });

  document.getElementById('cat-tabs').addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    selCat = pill.getAttribute('data-value');
    // Update active pill
    var pills = this.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    pill.classList.add('active');
    // Select first symbol in category
    var filtered = SYMBOLS.filter(function (s) { return s.cat === selCat; });
    if (filtered.length) selSymbol = filtered[0];
    buildSymGrid();
    updateSymInfo();
    draw();
  });

  /* ────────────────────────────────────────────────────────────────
     12. UI: PRACTICE MODE
     ──────────────────────────────────────────────────────────────── */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function generatePracticeQuestion() {
    var types = ['symbol', 'symbol', 'symbol', 'zone', 'fcf'];
    var type = types[Math.floor(Math.random() * types.length)];
    var sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    var question = {};
    question.type = type;
    question.symbolId = sym.id;
    question.symbolName = sym.name;
    question.correct = sym.name;

    if (type === 'symbol') {
      question.prompt = 'Identify this GD&T symbol:';
    } else if (type === 'zone') {
      question.prompt = 'What tolerance zone does ' + sym.name + ' create?';
      question.correct = sym.zone.split('.')[0]; // First sentence
    } else if (type === 'fcf') {
      question.prompt = 'What geometric tolerance does this FCF specify?';
      question.tolSI = +(Math.random() * 0.1 + 0.01).toFixed(2);
      question.isDia = (sym.id === 'position' || sym.id === 'concentricity');
      question.matCond = sym.datum ? 'M' : '';
      question.datumA = sym.datum ? 'A' : '';
      question.datumB = (sym.cat === 'location') ? 'B' : '';
    }

    // Generate wrong answers
    var others = SYMBOLS.filter(function (s) { return s.id !== sym.id; });
    others = shuffle(others).slice(0, 3);

    if (type === 'zone') {
      question.answers = shuffle([
        { text: sym.zone.split('.')[0], correct: true },
        { text: others[0].zone.split('.')[0], correct: false },
        { text: others[1].zone.split('.')[0], correct: false },
        { text: others[2].zone.split('.')[0], correct: false }
      ]);
    } else {
      question.answers = shuffle([
        { text: sym.name, correct: true },
        { text: others[0].name, correct: false },
        { text: others[1].name, correct: false },
        { text: others[2].name, correct: false }
      ]);
    }

    return question;
  }

  /* Look up a symbol by id. */
  function symById(id) {
    for (var i = 0; i < SYMBOLS.length; i++) if (SYMBOLS[i].id === id) return SYMBOLS[i];
    return null;
  }

  /* Render an explanation card after an answer is locked. mode='practice'|'quiz'. */
  function showExplanation(panelMode, q, wasCorrect) {
    var el = document.getElementById(panelMode === 'practice' ? 'p-explain' : 'q-explain');
    if (!el) return;
    var html = '';
    var s = q && q.symbolId ? symById(q.symbolId) : null;
    if (s) {
      html += '<div class="ex-hd">';
      html += '<span class="ex-badge ' + (wasCorrect ? 'ok' : 'err') + '">' +
              (wasCorrect ? 'Correct' : 'Review') + '</span>';
      html += '<span class="ex-name">' + s.name + '</span>';
      html += '<span class="ex-iso">' + (s.iso || 'ISO 1101') + ' · ' + CATEGORIES[s.cat] + '</span>';
      html += '</div>';
      html += '<div class="ex-row"><span class="ex-lbl">Tolerance Zone</span>' +
              '<span class="ex-val">' + s.zone + '</span></div>';
      html += '<div class="ex-row"><span class="ex-lbl">Real-World Example</span>' +
              '<span class="ex-val">' + s.example + '</span></div>';
      html += '<div class="ex-row"><span class="ex-lbl">Datum</span>' +
              '<span class="ex-val">' + (s.datum ? 'Required — referenced from a datum reference frame.'
                                                   : 'Not required — controls a feature independently.') + '</span></div>';
    } else if (q && q.question) {
      /* datum-knowledge style question */
      html += '<div class="ex-hd"><span class="ex-badge ' + (wasCorrect ? 'ok' : 'err') + '">' +
              (wasCorrect ? 'Correct' : 'Review') + '</span></div>';
      html += '<div class="ex-row"><span class="ex-lbl">Answer</span>' +
              '<span class="ex-val">' + q.correctAnswer + '</span></div>';
    }
    el.innerHTML = html;
    el.style.display = html ? '' : 'none';
  }

  function showPracticeQuestion() {
    pCurrent = generatePracticeQuestion();
    pLocked = false;

    document.getElementById('p-prompt').textContent = pCurrent.prompt;
    document.getElementById('p-feedback').textContent = '';
    document.getElementById('p-feedback').className = 'feedback';
    var pExp = document.getElementById('p-explain'); if (pExp) pExp.style.display = 'none';

    var grid = document.getElementById('practice-answers');
    grid.innerHTML = '';
    for (var i = 0; i < pCurrent.answers.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.setAttribute('data-idx', i);
      btn.innerHTML = '<span class="kbd-hint">' + (i + 1) + '</span>' +
                      '<span class="ans-txt">' + pCurrent.answers[i].text + '</span>';
      grid.appendChild(btn);
    }
    draw();
  }

  document.getElementById('practice-answers').addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.answer-btn');
    if (!btn || pLocked) return;
    pLocked = true;
    pTotal++;

    var idx = parseInt(btn.getAttribute('data-idx'), 10);
    var isCorrect = pCurrent.answers[idx].correct;

    // Mark all buttons
    var btns = this.querySelectorAll('.answer-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.add('locked');
      if (pCurrent.answers[i].correct) btns[i].classList.add('correct');
    }
    if (!isCorrect) btn.classList.add('wrong');

    var fb = document.getElementById('p-feedback');
    if (isCorrect) {
      pScore++;
      fb.textContent = '\u2714 Correct!';
      fb.className = 'feedback ok';
      playCorrect();
    } else {
      fb.textContent = '\u2718 Wrong — ' + pCurrent.correct;
      fb.className = 'feedback err';
      playWrong();
    }
    document.getElementById('p-score').textContent = pScore;
    document.getElementById('p-total').textContent = pTotal;
    showExplanation('practice', pCurrent, isCorrect);
  });

  document.getElementById('btn-p-new').addEventListener('pointerdown', function () {
    showPracticeQuestion();
  });

  /* Hint button — reveals category + first letter without scoring penalty. */
  var hintBtn = document.getElementById('btn-p-hint');
  if (hintBtn) hintBtn.addEventListener('pointerdown', function () {
    if (!pCurrent || pLocked) return;
    var s = symById(pCurrent.symbolId);
    if (!s) return;
    var fb = document.getElementById('p-feedback');
    var initial = s.name.charAt(0);
    fb.textContent = 'Hint: ' + CATEGORIES[s.cat] + ' tolerance · starts with "' + initial + '"';
    fb.className = 'feedback hint';
  });

  /* ────────────────────────────────────────────────────────────────
     13. UI: QUIZ MODE
     ──────────────────────────────────────────────────────────────── */
  function generateQuizSet() {
    var pool = [];

    // Symbol identification questions — pool ALL 14 so a 14-q quiz has variety
    var syms = shuffle(SYMBOLS);
    for (var i = 0; i < Math.min(14, syms.length); i++) {
      var s = syms[i];
      var others = shuffle(SYMBOLS.filter(function (x) { return x.id !== s.id; })).slice(0, 3);
      pool.push({
        type: 'symbol',
        symbolId: s.id,
        symbolName: s.name,
        correctAnswer: s.name,
        answers: shuffle([
          { text: s.name, correct: true },
          { text: others[0].name, correct: false },
          { text: others[1].name, correct: false },
          { text: others[2].name, correct: false }
        ])
      });
    }

    // Zone matching questions
    var zoneSym = shuffle(SYMBOLS);
    for (var z = 0; z < Math.min(3, zoneSym.length); z++) {
      var zs = zoneSym[z];
      var zOthers = shuffle(SYMBOLS.filter(function (x) { return x.id !== zs.id; })).slice(0, 3);
      pool.push({
        type: 'zone',
        symbolId: zs.id,
        symbolName: zs.name,
        correctAnswer: zs.zone.split('.')[0],
        answers: shuffle([
          { text: zs.zone.split('.')[0], correct: true },
          { text: zOthers[0].zone.split('.')[0], correct: false },
          { text: zOthers[1].zone.split('.')[0], correct: false },
          { text: zOthers[2].zone.split('.')[0], correct: false }
        ])
      });
    }

    // FCF reading questions
    var fcfSym = shuffle(SYMBOLS.filter(function (s) { return s.datum; }));
    for (var f = 0; f < Math.min(3, fcfSym.length); f++) {
      var fs = fcfSym[f];
      var fOthers = shuffle(SYMBOLS.filter(function (x) { return x.id !== fs.id; })).slice(0, 3);
      pool.push({
        type: 'fcf',
        symbolId: fs.id,
        symbolName: fs.name,
        correctAnswer: fs.name,
        tolSI: +(Math.random() * 0.1 + 0.01).toFixed(2),
        isDia: (fs.id === 'position' || fs.id === 'concentricity'),
        matCond: 'M',
        datumA: 'A',
        datumB: (fs.cat === 'location') ? 'B' : '',
        answers: shuffle([
          { text: fs.name, correct: true },
          { text: fOthers[0].name, correct: false },
          { text: fOthers[1].name, correct: false },
          { text: fOthers[2].name, correct: false }
        ])
      });
    }

    // Datum knowledge questions
    pool.push({
      type: 'datum',
      question: 'Which GD&T category does NOT require a datum reference?',
      correctAnswer: 'Form',
      answers: shuffle([
        { text: 'Form', correct: true },
        { text: 'Orientation', correct: false },
        { text: 'Location', correct: false },
        { text: 'Runout', correct: false }
      ])
    });

    pool.push({
      type: 'datum',
      question: 'What does the \u2300 symbol mean before a tolerance value in a FCF?',
      correctAnswer: 'Cylindrical tolerance zone',
      answers: shuffle([
        { text: 'Cylindrical tolerance zone', correct: true },
        { text: 'Spherical tolerance zone', correct: false },
        { text: 'Diameter of the feature', correct: false },
        { text: 'Bilateral tolerance', correct: false }
      ])
    });

    pool.push({
      type: 'datum',
      question: 'What does the circled M (\u24C2) modifier mean in a feature control frame?',
      correctAnswer: 'Maximum Material Condition',
      answers: shuffle([
        { text: 'Maximum Material Condition', correct: true },
        { text: 'Minimum Material Condition', correct: false },
        { text: 'Metric measurement', correct: false },
        { text: 'Material specification required', correct: false }
      ])
    });

    pool.push({
      type: 'datum',
      question: 'How many degrees of freedom does the primary datum constrain?',
      correctAnswer: '3 degrees of freedom',
      answers: shuffle([
        { text: '3 degrees of freedom', correct: true },
        { text: '1 degree of freedom', correct: false },
        { text: '2 degrees of freedom', correct: false },
        { text: '6 degrees of freedom', correct: false }
      ])
    });

    return shuffle(pool).slice(0, QUIZ_SIZE);
  }

  function startQuiz() {
    quizSet = generateQuizSet();
    quizIdx = 0;
    quizScore = 0;
    quizLocked = false;
    quizAnswers = [];
    showQuizQuestion();
  }

  function showQuizQuestion() {
    if (quizIdx >= quizSet.length) {
      showQuizResult();
      return;
    }
    quizLocked = false;
    var q = quizSet[quizIdx];

    document.getElementById('quiz-q-num').textContent = quizIdx + 1;
    document.getElementById('quiz-q-total').textContent = QUIZ_SIZE;
    document.getElementById('quiz-feedback').textContent = '';
    document.getElementById('quiz-feedback').className = 'quiz-feedback';
    document.getElementById('btn-quiz-next').style.display = 'none';
    var qExp = document.getElementById('q-explain'); if (qExp) qExp.style.display = 'none';

    var prompt = 'Identify the GD&T symbol shown above:';
    if (q.type === 'zone') prompt = 'What tolerance zone does this symbol create?';
    if (q.type === 'fcf') prompt = 'What geometric tolerance does this FCF specify?';
    if (q.type === 'datum') prompt = q.question;
    document.getElementById('q-prompt').textContent = prompt;

    var grid = document.getElementById('quiz-answers');
    grid.innerHTML = '';
    for (var i = 0; i < q.answers.length; i++) {
      var btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.setAttribute('data-idx', i);
      btn.innerHTML = '<span class="kbd-hint">' + (i + 1) + '</span>' +
                      '<span class="ans-txt">' + q.answers[i].text + '</span>';
      grid.appendChild(btn);
    }

    showPanels();
    draw();
  }

  document.getElementById('quiz-answers').addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.answer-btn');
    if (!btn || quizLocked) return;
    quizLocked = true;

    var idx = parseInt(btn.getAttribute('data-idx'), 10);
    var q = quizSet[quizIdx];
    var isCorrect = q.answers[idx].correct;

    var btns = this.querySelectorAll('.answer-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.add('locked');
      if (q.answers[i].correct) btns[i].classList.add('correct');
    }
    if (!isCorrect) btn.classList.add('wrong');

    if (isCorrect) quizScore++;

    quizAnswers.push({
      correct: isCorrect,
      correctAnswer: q.correctAnswer,
      givenAnswer: q.answers[idx].text
    });

    var fb = document.getElementById('quiz-feedback');
    if (isCorrect) {
      fb.textContent = '\u2714 Correct!';
      fb.className = 'quiz-feedback ok';
      playCorrect();
    } else {
      fb.textContent = '\u2718 Wrong — ' + q.correctAnswer;
      fb.className = 'quiz-feedback err';
      playWrong();
    }
    showExplanation('quiz', q, isCorrect);

    document.getElementById('btn-quiz-next').style.display = '';
  });

  document.getElementById('btn-quiz-next').addEventListener('pointerdown', function () {
    quizIdx++;
    showQuizQuestion();
  });

  function showQuizResult() {
    recordQuizComplete(quizScore, QUIZ_SIZE);

    elQuizPanel.style.display = 'none';
    elQuizBar.style.display = 'none';
    elQuizResult.style.display = '';

    var pct = Math.round(quizScore / QUIZ_SIZE * 100);
    document.getElementById('qr-score').textContent = quizScore + ' / ' + QUIZ_SIZE;
    document.getElementById('qr-score').className = 'qr-score ' + (pct === 100 ? 'perfect' : pct >= 60 ? 'good' : 'poor');

    var stars = '';
    if (pct === 100)     stars = '\u2605\u2605\u2605';
    else if (pct >= 80)  stars = '\u2605\u2605\u2606';
    else if (pct >= 60)  stars = '\u2605\u2606\u2606';
    else                 stars = '\u2606\u2606\u2606';
    document.getElementById('qr-stars').textContent = stars;

    var verdicts = {
      100: 'Perfect score! GD&T master!',
      80: 'Great job! Almost there.',
      60: 'Good effort. Keep practicing!',
      0: 'Review the symbols and try again.'
    };
    var vKey = pct === 100 ? 100 : pct >= 80 ? 80 : pct >= 60 ? 60 : 0;
    document.getElementById('qr-verdict').textContent = verdicts[vKey];

    /* Lifetime stats display */
    var bestEl   = document.getElementById('stat-best');
    var attEl    = document.getElementById('stat-attempts');
    var accEl    = document.getElementById('stat-accuracy');
    if (bestEl)   bestEl.textContent   = stats.bestSize ? (stats.bestScore + ' / ' + stats.bestSize) : '—';
    if (attEl)    attEl.textContent    = stats.attempts;
    if (accEl)    accEl.textContent    = stats.questionTotal
                                          ? Math.round(stats.correctTotal / stats.questionTotal * 100) + '%'
                                          : '—';

    var rows = document.getElementById('qr-rows');
    rows.innerHTML = '';
    for (var i = 0; i < quizAnswers.length; i++) {
      var a = quizAnswers[i];
      var row = document.createElement('div');
      row.className = 'qr-row ' + (a.correct ? 'ok' : 'err');
      row.innerHTML = '<div class="qr-qnum">Q' + (i + 1) + '</div>' +
        '<div class="qr-correct">Correct: <strong>' + a.correctAnswer + '</strong></div>' +
        '<div class="qr-given">Your answer: <strong>' + a.givenAnswer + '</strong></div>' +
        '<div class="qr-mark">' + (a.correct ? '\u2714' : '\u2718') + '</div>';
      rows.appendChild(row);
    }
  }

  document.getElementById('btn-quiz-retry').addEventListener('pointerdown', function () {
    startQuiz();
  });

  /* Quiz length selector — restarts the quiz with the chosen size. */
  var qLenTabs = document.getElementById('quiz-length-tabs');
  if (qLenTabs) qLenTabs.addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var n = parseInt(pill.getAttribute('data-len'), 10);
    if (!n || n === QUIZ_SIZE) return;
    QUIZ_SIZE = n;
    var pills = this.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    pill.classList.add('active');
    if (mode === 'quiz') startQuiz();
  });

  /* ────────────────────────────────────────────────────────────────
     14. MODE TAB HANDLING
     ──────────────────────────────────────────────────────────────── */
  document.getElementById('mode-tabs').addEventListener('pointerdown', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var newMode = pill.getAttribute('data-value');
    if (newMode === mode) return;

    mode = newMode;
    var pills = this.querySelectorAll('.pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
    pill.classList.add('active');

    if (mode === 'practice') {
      showPracticeQuestion();
    } else if (mode === 'quiz') {
      startQuiz();
    } else if (mode === 'explore') {
      buildSymGrid();
      updateSymInfo();
    }

    showPanels();
    draw();
  });

  /* ────────────────────────────────────────────────────────────────
     15. CANVAS RESIZE
     ──────────────────────────────────────────────────────────────── */
  function resize() {
    var rect = canvas.parentElement.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var displayW = rect.width - 16;
    var scale = displayW / W;
    canvas.style.width = displayW + 'px';
    canvas.style.height = (H * scale) + 'px';
    /* Size to the canvas's REAL display width, not a fixed W. The CSS
       stretches this canvas to its card, so W*dpr was being presented across a
       wider box — a 1.16x upscale. Scaling by displayW/W keeps the 900x520
       coordinate system exactly as the drawing code expects. */
    var _dW = canvas.getBoundingClientRect().width;
    if (!(_dW > 40)) _dW = W;
    canvas.width = Math.round(_dW * dpr);
    canvas.height = Math.round(_dW * (H / W) * dpr);
    ctx.setTransform((_dW*dpr)/W, 0, 0, (_dW*dpr)/W, 0, 0);
    draw();
  }

  window.addEventListener('resize', resize);

  /* ────────────────────────────────────────────────────────────────
     15b. KEYBOARD SHORTCUTS
     ──────────────────────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    /* Don't capture when user is typing in a real input. */
    var tag = (e.target && e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    /* Close context menu on Escape (handled later when menu exists). */
    if (e.key === 'Escape') {
      var menu = document.getElementById('gdt-ctx-menu');
      if (menu && menu.style.display === 'block') { menu.style.display = 'none'; e.preventDefault(); return; }
    }

    /* Answer-selection shortcuts (1..4) for Practice and Quiz modes. */
    if (mode === 'practice' && !pLocked && /^[1-4]$/.test(e.key)) {
      var pBtn = document.querySelector('#practice-answers .answer-btn[data-idx="' + (+e.key - 1) + '"]');
      if (pBtn) { pBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); e.preventDefault(); }
      return;
    }
    if (mode === 'quiz' && !quizLocked && /^[1-4]$/.test(e.key)) {
      var qBtn = document.querySelector('#quiz-answers .answer-btn[data-idx="' + (+e.key - 1) + '"]');
      if (qBtn) { qBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); e.preventDefault(); }
      return;
    }

    /* Enter / Space → Next in Practice; Next in Quiz when locked. */
    if (e.key === 'Enter' || e.key === ' ') {
      if (mode === 'practice') {
        var nextBtn = document.getElementById('btn-p-new');
        if (nextBtn) { nextBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); e.preventDefault(); }
      } else if (mode === 'quiz' && quizLocked) {
        var qNext = document.getElementById('btn-quiz-next');
        if (qNext && qNext.style.display !== 'none') {
          qNext.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); e.preventDefault();
        }
      }
      return;
    }

    /* Arrow keys cycle symbols in Explore mode. */
    if (mode === 'explore' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      var filtered = SYMBOLS.filter(function (s) { return s.cat === selCat; });
      var idx = filtered.findIndex(function (s) { return s.id === selSymbol.id; });
      if (idx < 0) return;
      idx = (idx + (e.key === 'ArrowRight' ? 1 : -1) + filtered.length) % filtered.length;
      selSymbol = filtered[idx];
      buildSymGrid();
      updateSymInfo();
      draw();
      e.preventDefault();
    }
  });

  /* ────────────────────────────────────────────────────────────────
     15c. CONTEXT MENU + EXPORT PNG
     ──────────────────────────────────────────────────────────────── */
  var ctxMenu = document.getElementById('gdt-ctx-menu');

  function openCtxMenu(x, y) {
    if (!ctxMenu) return;
    ctxMenu.style.display = 'block';
    ctxMenu.setAttribute('aria-hidden', 'false');
    /* Clamp to viewport */
    var mw = ctxMenu.offsetWidth  || 200;
    var mh = ctxMenu.offsetHeight || 160;
    var vw = window.innerWidth, vh = window.innerHeight;
    ctxMenu.style.left = Math.min(x, vw - mw - 8) + 'px';
    ctxMenu.style.top  = Math.min(y, vh - mh - 8) + 'px';
  }
  function closeCtxMenu() {
    if (!ctxMenu) return;
    ctxMenu.style.display = 'none';
    ctxMenu.setAttribute('aria-hidden', 'true');
  }

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    openCtxMenu(e.clientX, e.clientY);
  });
  document.addEventListener('pointerdown', function (e) {
    if (ctxMenu && ctxMenu.style.display === 'block' && !ctxMenu.contains(e.target)) closeCtxMenu();
  });
  window.addEventListener('scroll', closeCtxMenu, { passive: true });
  window.addEventListener('resize', closeCtxMenu);

  function exportPNG() {
    /* Re-render onto a static-size temp canvas so the file is consistent across viewport sizes,
       then add a small watermark. */
    var off = document.createElement('canvas');
    off.width  = W;
    off.height = H + 36;
    var octx = off.getContext('2d');
    /* background */
    octx.fillStyle = '#0d1117';
    octx.fillRect(0, 0, off.width, off.height);
    /* draw current canvas content scaled to logical W×H */
    octx.drawImage(canvas, 0, 0, W, H);
    /* watermark */
    octx.fillStyle = '#6b7a99';
    octx.font = '600 13px "Segoe UI", system-ui, sans-serif';
    octx.textAlign = 'left';
    octx.textBaseline = 'middle';
    octx.fillText('NHIT VisualLab · GD&T Trainer', 14, H + 18);
    octx.textAlign = 'right';
    var lbl = mode === 'explore' ? selSymbol.name + ' (' + (selSymbol.iso || 'ISO 1101') + ')'
            : mode.charAt(0).toUpperCase() + mode.slice(1) + ' mode';
    octx.fillText(lbl, W - 14, H + 18);

    var a = document.createElement('a');
    a.download = 'gdt-trainer-' + mode + '-' + Date.now() + '.png';
    a.href = off.toDataURL('image/png');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function copySymbolName() {
    if (mode !== 'explore' || !selSymbol) return;
    var txt = selSymbol.name + ' (' + (selSymbol.iso || 'ISO 1101') + ') — ' + CATEGORIES[selSymbol.cat];
    try {
      if (navigator.clipboard) navigator.clipboard.writeText(txt);
    } catch (e) {}
  }

  if (ctxMenu) ctxMenu.addEventListener('click', function (e) {
    var btn = e.target.closest('.ctx-item');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'export-png')   exportPNG();
    else if (act === 'copy-name')   copySymbolName();
    else if (act === 'toggle-grid') { showGrid = !showGrid; draw(); }
    else if (act === 'reset')       { showGrid = false; learnPart = -1; draw(); }
    closeCtxMenu();
  });

  /* Learning panels — expand/collapse all (§8 Pattern 1) */
  (function wireLearnPanels() {
    var expAll = document.getElementById('learn-expand-all');
    var colAll = document.getElementById('learn-collapse-all');
    var cards  = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  })();

  /* ────────────────────────────────────────────────────────────────
     16. INIT
     ──────────────────────────────────────────────────────────────── */
  canvas.style.touchAction = 'none';
  buildLearnParts();
  buildSymGrid();
  updateSymInfo();
  showPanels();
  resize();
})();
