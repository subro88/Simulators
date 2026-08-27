(function () {
  'use strict';

  /* ================================================================
     SHAPES — Definition & Formulas
     ================================================================ */

  var SHAPES = [
    { id: 'rectangle',       name: 'Rectangle',        icon: 'rect' },
    { id: 'circle',          name: 'Circle',            icon: 'circ' },
    { id: 'hollow-circle',   name: 'Hollow Circle',     icon: 'hcirc' },
    { id: 'hollow-rect',     name: 'Hollow Rect',       icon: 'hrect' },
    { id: 'i-beam',          name: 'I-Beam',            icon: 'ibeam' },
    { id: 't-section',       name: 'T-Section',         icon: 'tsec' },
    { id: 'channel',         name: 'Channel',           icon: 'chan' },
    { id: 'angle',           name: 'Angle',             icon: 'ang' }
  ];

  /* Slider definitions per shape — values stored in mm (SI internal). */
  var SHAPE_SLIDERS = {
    'rectangle':     [{ id: 'b', label: 'Width b',  min: 10, max: 500, step: 1, val: 50 },
                      { id: 'h', label: 'Height h', min: 10, max: 500, step: 1, val: 100 }],
    'circle':        [{ id: 'd', label: 'Diameter d', min: 10, max: 500, step: 1, val: 80 }],
    'hollow-circle': [{ id: 'D', label: 'Outer D',    min: 20, max: 500, step: 1, val: 100 },
                      { id: 'di', label: 'Inner d',   min: 10, max: 498, step: 1, val: 60 }],
    'hollow-rect':   [{ id: 'B', label: 'Outer B', min: 20, max: 500, step: 1, val: 80 },
                      { id: 'H', label: 'Outer H', min: 20, max: 500, step: 1, val: 120 },
                      { id: 'bi', label: 'Inner b', min: 10, max: 498, step: 1, val: 50 },
                      { id: 'hi', label: 'Inner h', min: 10, max: 498, step: 1, val: 80 }],
    'i-beam':        [{ id: 'bf', label: 'Flange bf', min: 20, max: 500, step: 1, val: 100 },
                      { id: 'tf', label: 'Flange tf', min: 5,  max: 80,  step: 1, val: 15 },
                      { id: 'H',  label: 'Total H',   min: 40, max: 1000, step: 1, val: 150 },
                      { id: 'tw', label: 'Web tw',     min: 4,  max: 60,  step: 1, val: 10 }],
    't-section':     [{ id: 'bf', label: 'Flange bf', min: 20, max: 500, step: 1, val: 100 },
                      { id: 'tf', label: 'Flange tf', min: 5,  max: 80,  step: 1, val: 15 },
                      { id: 'hw', label: 'Web hw',    min: 20, max: 500, step: 1, val: 100 },
                      { id: 'tw', label: 'Web tw',    min: 4,  max: 60,  step: 1, val: 10 }],
    'channel':       [{ id: 'bf', label: 'Flange bf', min: 10, max: 400, step: 1, val: 50 },
                      { id: 'H',  label: 'Total H',   min: 40, max: 1000, step: 1, val: 150 },
                      { id: 'tf', label: 'Flange tf', min: 5,  max: 60,  step: 1, val: 12 },
                      { id: 'tw', label: 'Web tw',    min: 4,  max: 40,  step: 1, val: 8 }],
    'angle':         [{ id: 'b', label: 'Width b',    min: 20, max: 400, step: 1, val: 80 },
                      { id: 'h', label: 'Height h',   min: 20, max: 400, step: 1, val: 80 },
                      { id: 't', label: 'Thickness t', min: 4,  max: 50,  step: 1, val: 10 }]
  };

  /* Presets — common structural sections (all in mm). */
  var PRESETS = {
    'rectangle':     [
      { name: 'Small (50×100)',  vals: { b: 50,  h: 100 } },
      { name: 'Med (100×200)',   vals: { b: 100, h: 200 } },
      { name: 'Large (200×400)', vals: { b: 200, h: 400 } }
    ],
    'circle':        [
      { name: 'Rod 25 mm',  vals: { d: 25 } },
      { name: 'Rod 50 mm',  vals: { d: 50 } },
      { name: 'Shaft 100',  vals: { d: 100 } }
    ],
    'hollow-circle': [
      { name: 'Pipe 50/40',   vals: { D: 50,  di: 40 } },
      { name: 'Pipe 100/80',  vals: { D: 100, di: 80 } },
      { name: 'Tube 200/150', vals: { D: 200, di: 150 } }
    ],
    'hollow-rect':   [
      { name: 'RHS 80×120', vals: { B: 80,  H: 120, bi: 70,  hi: 110 } },
      { name: 'SHS 100',         vals: { B: 100, H: 100, bi: 90,  hi: 90 } },
      { name: 'RHS 150×250',vals: { B: 150, H: 250, bi: 135, hi: 235 } }
    ],
    'i-beam':        [
      { name: 'IPE 200',  vals: { bf: 100, tf: 8.5, H: 200, tw: 5.6 } },
      { name: 'IPE 300',  vals: { bf: 150, tf: 10.7, H: 300, tw: 7.1 } },
      { name: 'HE 200B',  vals: { bf: 200, tf: 15, H: 200, tw: 9 } }
    ],
    't-section':     [
      { name: 'T 100×100', vals: { bf: 100, tf: 12, hw: 88,  tw: 8 } },
      { name: 'T 150×150', vals: { bf: 150, tf: 14, hw: 136, tw: 10 } },
      { name: 'T 200×200', vals: { bf: 200, tf: 18, hw: 182, tw: 12 } }
    ],
    'channel':       [
      { name: 'UPN 100', vals: { bf: 50, H: 100, tf: 8.5, tw: 6 } },
      { name: 'UPN 200', vals: { bf: 75, H: 200, tf: 11.5, tw: 8.5 } },
      { name: 'UPN 300', vals: { bf: 100, H: 300, tf: 16, tw: 10 } }
    ],
    'angle':         [
      { name: 'L 50×5',    vals: { b: 50,  h: 50,  t: 5 } },
      { name: 'L 80×8',    vals: { b: 80,  h: 80,  t: 8 } },
      { name: 'L 150×12',  vals: { b: 150, h: 150, t: 12 } }
    ]
  };

  /* ================================================================
     UNIT SYSTEM
     ================================================================ */
  var unitMode = 'si';   /* 'si' | 'imp' */

  /* All conversion factors: SI mm → display unit */
  var MM_PER_IN = 25.4;
  var MM_TO_IN  = 1 / MM_PER_IN;            /* 0.03937 */
  var MM2_TO_IN2 = MM_TO_IN * MM_TO_IN;
  var MM3_TO_IN3 = MM2_TO_IN2 * MM_TO_IN;
  var MM4_TO_IN4 = MM3_TO_IN3 * MM_TO_IN;

  function U() {
    if (unitMode === 'imp') {
      return {
        len:  { toDisp: function (mm) { return mm * MM_TO_IN; },
                fromDisp: function (v) { return v * MM_PER_IN; },
                label: 'in', digits: 3 },
        area: { toDisp: function (mm2) { return mm2 * MM2_TO_IN2; }, label: 'in²', digits: 3 },
        S:    { toDisp: function (mm3) { return mm3 * MM3_TO_IN3; }, label: 'in³', digits: 4 },
        I:    { toDisp: function (mm4) { return mm4 * MM4_TO_IN4; }, label: 'in⁴', digits: 4 }
      };
    }
    return {
      len:  { toDisp: function (mm) { return mm; },
              fromDisp: function (v) { return v; },
              label: 'mm', digits: 1 },
      area: { toDisp: function (mm2) { return mm2; }, label: 'mm²', digits: 1 },
      S:    { toDisp: function (mm3) { return mm3; }, label: 'mm³', digits: 1 },
      I:    { toDisp: function (mm4) { return mm4; }, label: 'mm⁴', digits: 1 }
    };
  }

  /* ================================================================
     CALCULATION ENGINE (all SI — mm)
     ================================================================ */

  function calcProps(shape, p) {
    var r = {};
    var PI = Math.PI;

    switch (shape) {
      case 'rectangle': {
        var b = p.b, h = p.h;
        r.A   = b * h;
        r.cx  = b / 2;
        r.cy  = h / 2;
        r.Ix  = b * h * h * h / 12;
        r.Iy  = h * b * b * b / 12;
        r.Sx  = b * h * h / 6;
        r.Sy  = h * b * b / 6;
        r.rx  = h / Math.sqrt(12);
        r.ry  = b / Math.sqrt(12);
        r.J   = b * h * (b * b + h * h) / 12;
        break;
      }
      case 'circle': {
        var d = p.d;
        r.A   = PI * d * d / 4;
        r.cx  = d / 2;
        r.cy  = d / 2;
        r.Ix  = PI * d * d * d * d / 64;
        r.Iy  = r.Ix;
        r.Sx  = PI * d * d * d / 32;
        r.Sy  = r.Sx;
        r.rx  = d / 4;
        r.ry  = d / 4;
        r.J   = PI * d * d * d * d / 32;
        break;
      }
      case 'hollow-circle': {
        var D = p.D, di = p.di;
        if (di >= D) di = D - 2;
        r.A   = PI * (D * D - di * di) / 4;
        r.cx  = D / 2;
        r.cy  = D / 2;
        r.Ix  = PI * (D * D * D * D - di * di * di * di) / 64;
        r.Iy  = r.Ix;
        r.Sx  = PI * (D * D * D * D - di * di * di * di) / (32 * D);
        r.Sy  = r.Sx;
        r.rx  = Math.sqrt(r.Ix / r.A);
        r.ry  = r.rx;
        r.J   = PI * (D * D * D * D - di * di * di * di) / 32;
        break;
      }
      case 'hollow-rect': {
        var B = p.B, H = p.H, bi = p.bi, hi = p.hi;
        if (bi >= B) bi = B - 2;
        if (hi >= H) hi = H - 2;
        r.A   = B * H - bi * hi;
        r.cx  = B / 2;
        r.cy  = H / 2;
        r.Ix  = (B * H * H * H - bi * hi * hi * hi) / 12;
        r.Iy  = (H * B * B * B - hi * bi * bi * bi) / 12;
        r.Sx  = r.Ix / (H / 2);
        r.Sy  = r.Iy / (B / 2);
        r.rx  = Math.sqrt(r.Ix / r.A);
        r.ry  = Math.sqrt(r.Iy / r.A);
        r.J   = r.Ix + r.Iy;
        break;
      }
      case 'i-beam': {
        var bf = p.bf, tf = p.tf, HH = p.H, tw = p.tw;
        var hw = HH - 2 * tf;
        if (hw < 1) hw = 1;
        r.A   = 2 * bf * tf + hw * tw;
        r.cx  = bf / 2;
        r.cy  = HH / 2;
        r.Ix  = (bf * HH * HH * HH - (bf - tw) * hw * hw * hw) / 12;
        r.Iy  = (2 * tf * bf * bf * bf + hw * tw * tw * tw) / 12;
        r.Sx  = r.Ix / (HH / 2);
        r.Sy  = r.Iy / (bf / 2);
        r.rx  = Math.sqrt(r.Ix / r.A);
        r.ry  = Math.sqrt(r.Iy / r.A);
        r.J   = (2 * bf * tf * tf * tf + hw * tw * tw * tw) / 3;
        r.hw  = hw;
        break;
      }
      case 't-section': {
        var bf2 = p.bf, tf2 = p.tf, hw2 = p.hw, tw2 = p.tw;
        var totalH = hw2 + tf2;
        var Aweb = hw2 * tw2;
        var Aflange = bf2 * tf2;
        r.A = Aweb + Aflange;
        r.cx = bf2 / 2;
        r.cy = (Aweb * (hw2 / 2) + Aflange * (hw2 + tf2 / 2)) / r.A;
        var Iweb  = tw2 * hw2 * hw2 * hw2 / 12;
        var Ifl   = bf2 * tf2 * tf2 * tf2 / 12;
        var dweb  = r.cy - hw2 / 2;
        var dfl   = (hw2 + tf2 / 2) - r.cy;
        r.Ix  = Iweb + Aweb * dweb * dweb + Ifl + Aflange * dfl * dfl;
        r.Iy  = (hw2 * tw2 * tw2 * tw2 + tf2 * bf2 * bf2 * bf2) / 12;
        var cTop = totalH - r.cy;
        var cBot = r.cy;
        r.Sx  = r.Ix / Math.max(cTop, cBot);
        r.Sy  = r.Iy / (bf2 / 2);
        r.rx  = Math.sqrt(r.Ix / r.A);
        r.ry  = Math.sqrt(r.Iy / r.A);
        r.J   = (bf2 * tf2 * tf2 * tf2 + hw2 * tw2 * tw2 * tw2) / 3;
        r.totalH = totalH;
        break;
      }
      case 'channel': {
        var bf3 = p.bf, H3 = p.H, tf3 = p.tf, tw3 = p.tw;
        var hw3 = H3 - 2 * tf3;
        if (hw3 < 1) hw3 = 1;
        r.A = 2 * bf3 * tf3 + hw3 * tw3;
        r.cy = H3 / 2;
        var Aweb3 = hw3 * tw3;
        var Afl3  = bf3 * tf3;
        r.cx = (Aweb3 * (tw3 / 2) + 2 * Afl3 * (bf3 / 2)) / r.A;
        r.Ix = (tw3 * hw3 * hw3 * hw3 / 12) + 2 * (bf3 * tf3 * tf3 * tf3 / 12 + Afl3 * ((H3 - tf3) / 2) * ((H3 - tf3) / 2));
        var IyWeb = hw3 * tw3 * tw3 * tw3 / 12 + Aweb3 * (r.cx - tw3 / 2) * (r.cx - tw3 / 2);
        var IyFl  = tf3 * bf3 * bf3 * bf3 / 12 + Afl3 * (bf3 / 2 - r.cx) * (bf3 / 2 - r.cx);
        r.Iy = IyWeb + 2 * IyFl;
        r.Sx = r.Ix / (H3 / 2);
        r.Sy = r.Iy / Math.max(r.cx, bf3 - r.cx);
        r.rx = Math.sqrt(r.Ix / r.A);
        r.ry = Math.sqrt(r.Iy / r.A);
        r.J  = (hw3 * tw3 * tw3 * tw3 + 2 * bf3 * tf3 * tf3 * tf3) / 3;
        r.hw = hw3;
        break;
      }
      case 'angle': {
        var ba = p.b, ha = p.h, ta = p.t;
        var A1 = ba * ta;
        var A2 = (ha - ta) * ta;
        r.A = A1 + A2;
        r.cx = (A1 * (ba / 2) + A2 * (ta / 2)) / r.A;
        r.cy = (A1 * (ta / 2) + A2 * (ta + (ha - ta) / 2)) / r.A;
        var I1x = ba * ta * ta * ta / 12;
        var I2x = ta * (ha - ta) * (ha - ta) * (ha - ta) / 12;
        var d1x = r.cy - ta / 2;
        var d2x = (ta + (ha - ta) / 2) - r.cy;
        r.Ix = I1x + A1 * d1x * d1x + I2x + A2 * d2x * d2x;
        var I1y = ta * ba * ba * ba / 12;
        var I2y = (ha - ta) * ta * ta * ta / 12;
        var d1y = ba / 2 - r.cx;
        var d2y = r.cx - ta / 2;
        r.Iy = I1y + A1 * d1y * d1y + I2y + A2 * d2y * d2y;
        var cxMax = Math.max(r.cx, ba - r.cx);
        var cyMax = Math.max(r.cy, ha - r.cy);
        r.Sx = r.Ix / cyMax;
        r.Sy = r.Iy / cxMax;
        r.rx = Math.sqrt(r.Ix / r.A);
        r.ry = Math.sqrt(r.Iy / r.A);
        r.J  = (ba * ta * ta * ta + (ha - ta) * ta * ta * ta) / 3;
        break;
      }
    }
    return r;
  }

  /* ================================================================
     DOM REFS
     ================================================================ */

  var canvas    = document.getElementById('main-canvas');
  var ctx       = canvas.getContext('2d');
  var shapeGrid = document.getElementById('shape-grid');
  var sliderBox = document.getElementById('slider-container');
  var readoutEl = document.getElementById('readout-row');
  var simPanel  = document.getElementById('sim-panel');
  var presetBox = document.getElementById('preset-row');
  var simTogglesEl = document.getElementById('sim-toggles');
  var firstHintEl  = document.getElementById('first-hint');

  /* Explore */
  var catRow      = document.getElementById('cat-row');
  var catTabs     = document.getElementById('cat-tabs');
  var itemSel     = document.getElementById('item-selector');
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo    = document.getElementById('item-info');

  /* Practice */
  var practPanel  = document.getElementById('practice-panel');
  var ppPrompt    = document.getElementById('pp-prompt');
  var ppInput     = document.getElementById('pp-input');
  var ppUnit      = document.getElementById('pp-unit');
  var ppCheck     = document.getElementById('pp-check');
  var ppShow      = document.getElementById('pp-show');
  var ppNext      = document.getElementById('pp-next');
  var ppFeedback  = document.getElementById('pp-feedback');
  var ppSolution  = document.getElementById('pp-solution');
  var practBar    = document.getElementById('practice-bar');
  var pbarScoreEl = document.getElementById('pbar-score-val');

  /* Quiz */
  var quizPanel   = document.getElementById('quiz-panel');
  var quizBar     = document.getElementById('quiz-bar');
  var qbarNum     = document.getElementById('qbar-num');
  var quizResult  = document.getElementById('quiz-result');

  /* Shape selector */
  var shapeSel    = document.getElementById('shape-selector');

  /* Learning panels */
  var learnPanels = document.getElementById('learn-panels');
  var lpEqBody    = document.getElementById('lp-eq-body');
  var lpCoachBody = document.getElementById('lp-coach-body');

  /* ================================================================
     STATE
     ================================================================ */

  var mode        = 'simulate';
  var curShape    = 'rectangle';

  /* Landing pages for individual sections (e.g. /tools/moment-of-inertia-i-beam/)
     reuse this exact script and preload their shape via <body data-shape="...">.
     Falls back to the default silently, so the hub page is unaffected. */
  (function () {
    var want = document.body && document.body.getAttribute('data-shape');
    if (!want) return;
    for (var i = 0; i < SHAPES.length; i++) {
      if (SHAPES[i].id === want) { curShape = want; return; }
    }
  })();
  var params      = {};
  var results     = {};

  /* Toggles */
  var showGrid       = true;
  var showAxes       = true;
  var showCentroid   = true;
  var showDimensions = true;

  /* Practice state */
  var pCorrect = 0, pTotal = 0;
  var curProblem = null;
  var pAnswered  = false;

  /* Quiz state */
  var QUIZ_SIZE   = 5;
  var quizSet     = [];
  var quizIdx     = 0;
  var quizScore   = 0;
  var quizAnswered = false;

  /* Explore state */
  var exploreCat  = 'basics';

  /* Undo/Redo */
  var undoStack = [];
  var redoStack = [];
  var UNDO_MAX  = 60;

  /* Custom modal target */
  var customTarget = null;

  /* ================================================================
     SHAPE ICONS
     ================================================================ */

  function shapeIconSVG(icon) {
    var s = '<svg viewBox="0 0 40 40" fill="none" stroke="#ff6d00" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">';
    switch (icon) {
      case 'rect':  s += '<rect x="8" y="10" width="24" height="20" fill="rgba(255,109,0,.15)"/>'; break;
      case 'circ':  s += '<circle cx="20" cy="20" r="12" fill="rgba(255,109,0,.15)"/>'; break;
      case 'hcirc': s += '<circle cx="20" cy="20" r="12" fill="rgba(255,109,0,.15)"/><circle cx="20" cy="20" r="7" fill="#161b27" stroke="#ff6d00"/>'; break;
      case 'hrect': s += '<rect x="6" y="8" width="28" height="24" fill="rgba(255,109,0,.15)"/><rect x="12" y="13" width="16" height="14" fill="#161b27" stroke="#ff6d00"/>'; break;
      case 'ibeam': s += '<path d="M8 8h24v6H24v12h8v6H8v-6h8V14H8z" fill="rgba(255,109,0,.15)"/>'; break;
      case 'tsec':  s += '<path d="M8 8h24v6H24v18h-8V14H8z" fill="rgba(255,109,0,.15)"/>'; break;
      case 'chan':  s += '<path d="M10 8h20v6H16v12h14v6H10z" fill="rgba(255,109,0,.15)"/>'; break;
      case 'ang':   s += '<path d="M8 32h22v-6H14V8H8z" fill="rgba(255,109,0,.15)"/>'; break;
    }
    s += '</svg>';
    return s;
  }

  /* ================================================================
     UNDO / REDO
     ================================================================ */

  function snapState() {
    return {
      shape: curShape,
      params: JSON.parse(JSON.stringify(params)),
      units: unitMode,
      sg: showGrid, sa: showAxes, sc: showCentroid, sd: showDimensions
    };
  }

  function loadState(s) {
    if (!s) return;
    curShape = s.shape;
    unitMode = s.units || 'si';
    showGrid       = (s.sg === undefined) ? true : !!s.sg;
    showAxes       = (s.sa === undefined) ? true : !!s.sa;
    showCentroid   = (s.sc === undefined) ? true : !!s.sc;
    showDimensions = (s.sd === undefined) ? true : !!s.sd;
    buildShapeSelector();
    buildSliders(s.params);
    syncToggleDOM();
    syncUnitDOM();
    enforceConstraints();
    updateFromSliders();
  }

  function saveUndo() {
    undoStack.push(snapState());
    if (undoStack.length > UNDO_MAX) undoStack.shift();
    redoStack.length = 0;
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(snapState());
    loadState(undoStack.pop());
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(snapState());
    loadState(redoStack.pop());
  }

  function syncToggleDOM() {
    var ids = { 'chk-grid': showGrid, 'chk-axes': showAxes, 'chk-centroid': showCentroid, 'chk-dim': showDimensions };
    Object.keys(ids).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.checked = ids[id];
    });
  }

  function syncUnitDOM() {
    var siBtn = document.getElementById('unit-si');
    var imBtn = document.getElementById('unit-imp');
    if (siBtn) siBtn.classList.toggle('active', unitMode === 'si');
    if (imBtn) imBtn.classList.toggle('active', unitMode === 'imp');
  }

  /* ================================================================
     BUILD SHAPE SELECTOR
     ================================================================ */

  function buildShapeSelector() {
    shapeGrid.innerHTML = '';
    SHAPES.forEach(function (sh) {
      var btn = document.createElement('button');
      btn.className = 'shape-btn' + (sh.id === curShape ? ' active' : '');
      btn.dataset.shape = sh.id;
      btn.innerHTML = shapeIconSVG(sh.icon) + '<span class="shape-btn-name">' + sh.name + '</span>';
      btn.addEventListener('click', function () {
        if (sh.id === curShape) return;
        saveUndo();
        curShape = sh.id;
        buildShapeSelector();
        buildSliders();
        buildPresets();
        updateFromSliders();
      });
      shapeGrid.appendChild(btn);
    });
  }

  /* ================================================================
     BUILD SLIDERS (with stepper inputs + unit-aware labels)
     ================================================================ */

  function buildSliders(restoreVals) {
    sliderBox.innerHTML = '';
    var sliders = SHAPE_SLIDERS[curShape];
    params = {};
    sliders.forEach(function (s) {
      params[s.id] = (restoreVals && restoreVals[s.id] != null) ? restoreVals[s.id] : s.val;
    });
    enforceConstraints();
    sliders.forEach(function (s) {
      var u = U();
      var dispVal = u.len.toDisp(params[s.id]);
      var dispMin = u.len.toDisp(s.min);
      var dispMax = u.len.toDisp(s.max);
      var stepDisp = unitMode === 'imp' ? 0.01 : 1;
      var row = document.createElement('div');
      row.className = 'slider-row';
      row.innerHTML =
        '<span class="slider-label">' + s.label + ' <span class="sl-unit">(' + u.len.label + ')</span></span>' +
        '<input class="slider-input" type="range" min="' + dispMin + '" max="' + dispMax + '" step="' + stepDisp + '" value="' + dispVal + '" data-id="' + s.id + '" data-min-mm="' + s.min + '" data-max-mm="' + s.max + '">' +
        '<div class="stepper">' +
          '<button class="stp-btn" data-act="dec" aria-label="Decrease">−</button>' +
          '<input class="stp-inp" id="stp-' + s.id + '" type="text" value="' + dispVal.toFixed(u.len.digits) + '">' +
          '<button class="stp-btn" data-act="inc" aria-label="Increase">+</button>' +
          '<button class="stp-btn stp-custom" data-act="custom" title="Set custom value">…</button>' +
        '</div>';
      sliderBox.appendChild(row);

      var sliderInp = row.querySelector('.slider-input');
      var stepInp   = row.querySelector('.stp-inp');
      var btnDec    = row.querySelector('[data-act="dec"]');
      var btnInc    = row.querySelector('[data-act="inc"]');
      var btnCust   = row.querySelector('[data-act="custom"]');

      var lastUndoVal = params[s.id];
      function commitSliderUndo() {
        if (params[s.id] !== lastUndoVal) {
          /* Push the BEFORE value */
          var snap = snapState();
          snap.params[s.id] = lastUndoVal;
          undoStack.push(snap);
          if (undoStack.length > UNDO_MAX) undoStack.shift();
          redoStack.length = 0;
          lastUndoVal = params[s.id];
        }
      }

      sliderInp.addEventListener('input', function () {
        var dv = parseFloat(sliderInp.value);
        var mm = u.len.fromDisp(dv);
        params[s.id] = mm;
        stepInp.value = dv.toFixed(u.len.digits);
        enforceConstraints();
        syncSliderDOM();
        updateFromSliders();
      });
      sliderInp.addEventListener('change', commitSliderUndo);

      stepInp.addEventListener('change', function () {
        var dv = parseFloat(stepInp.value);
        if (isNaN(dv)) { stepInp.value = U().len.toDisp(params[s.id]).toFixed(U().len.digits); return; }
        saveUndo();
        var mm = u.len.fromDisp(dv);
        mm = Math.max(s.min, Math.min(s.max, mm));
        params[s.id] = mm;
        enforceConstraints();
        syncSliderDOM();
        lastUndoVal = params[s.id];
        updateFromSliders();
      });

      btnDec.addEventListener('click', function () { stepBy(s, -1, stepInp, sliderInp); });
      btnInc.addEventListener('click', function () { stepBy(s, +1, stepInp, sliderInp); });
      btnCust.addEventListener('click', function () { openCustomModal(s); });
    });
  }

  function stepBy(s, dir, stepInp, sliderInp) {
    saveUndo();
    var u = U();
    var stepMm = (unitMode === 'imp') ? MM_PER_IN * 0.1 : 1; /* 0.1 in or 1 mm */
    var mm = params[s.id] + dir * stepMm;
    mm = Math.max(s.min, Math.min(s.max, mm));
    params[s.id] = mm;
    enforceConstraints();
    syncSliderDOM();
    updateFromSliders();
  }

  function syncSliderDOM() {
    var u = U();
    SHAPE_SLIDERS[curShape].forEach(function (s) {
      var sliderInp = document.querySelector('.slider-input[data-id="' + s.id + '"]');
      var stepInp   = document.getElementById('stp-' + s.id);
      if (!sliderInp) return;
      var dv = u.len.toDisp(params[s.id]);
      sliderInp.value = dv;
      if (stepInp && document.activeElement !== stepInp) {
        stepInp.value = dv.toFixed(u.len.digits);
      }
    });
  }

  function enforceConstraints() {
    if (curShape === 'hollow-circle') {
      if (params.di >= params.D) params.di = params.D - 2;
    }
    if (curShape === 'hollow-rect') {
      if (params.bi >= params.B) params.bi = params.B - 2;
      if (params.hi >= params.H) params.hi = params.H - 2;
    }
    if (curShape === 'i-beam') {
      if (2 * params.tf >= params.H) params.tf = Math.floor((params.H - 2) / 2);
    }
    if (curShape === 'channel') {
      if (2 * params.tf >= params.H) params.tf = Math.floor((params.H - 2) / 2);
    }
    if (curShape === 'angle') {
      if (params.t >= params.b) params.t = params.b - 2;
      if (params.t >= params.h) params.t = params.h - 2;
    }
  }

  /* ================================================================
     PRESETS
     ================================================================ */

  function buildPresets() {
    if (!presetBox) return;
    presetBox.innerHTML = '<span class="ctrl-label">Presets</span>';
    var list = PRESETS[curShape] || [];
    list.forEach(function (pre) {
      var btn = document.createElement('button');
      btn.className = 'preset-btn';
      btn.textContent = pre.name;
      btn.addEventListener('click', function () {
        saveUndo();
        Object.keys(pre.vals).forEach(function (k) { params[k] = pre.vals[k]; });
        enforceConstraints();
        syncSliderDOM();
        updateFromSliders();
      });
      presetBox.appendChild(btn);
    });
    var reset = document.createElement('button');
    reset.className = 'preset-btn preset-reset';
    reset.textContent = '↺ Reset';
    reset.addEventListener('click', function () {
      saveUndo();
      var defs = SHAPE_SLIDERS[curShape];
      defs.forEach(function (s) { params[s.id] = s.val; });
      enforceConstraints();
      syncSliderDOM();
      updateFromSliders();
    });
    presetBox.appendChild(reset);
  }

  /* ================================================================
     UPDATE — recalc + draw + readouts + learning panels
     ================================================================ */

  function updateFromSliders() {
    results = calcProps(curShape, params);
    draw();
    updateReadouts();
    updateLearnPanels();
  }

  /* ================================================================
     READOUTS (unit-aware)
     ================================================================ */

  var READOUT_DEFS = [
    { key: 'A',  label: 'Area',           kind: 'area' },
    { key: 'cx', label: 'Centroid x̄', kind: 'len' },
    { key: 'cy', label: 'Centroid ȳ', kind: 'len' },
    { key: 'Ix', label: 'Ix',             kind: 'I' },
    { key: 'Iy', label: 'Iy',             kind: 'I' },
    { key: 'Sx', label: 'Sx',             kind: 'S' },
    { key: 'Sy', label: 'Sy',             kind: 'S' },
    { key: 'rx', label: 'rx',             kind: 'len' },
    { key: 'ry', label: 'ry',             kind: 'len' },
    { key: 'J',  label: 'J (polar)',      kind: 'I' }
  ];

  function buildReadouts() {
    readoutEl.innerHTML = '';
    var u = U();
    READOUT_DEFS.forEach(function (rd) {
      var unit = u[rd.kind].label;
      var card = document.createElement('div');
      card.className = 'readout-card';
      card.innerHTML = '<div class="readout-label">' + rd.label + '</div>' +
        '<div><span class="readout-val" id="ro-' + rd.key + '">0</span>' +
        '<span class="readout-unit" id="ru-' + rd.key + '"> ' + unit + '</span></div>';
      readoutEl.appendChild(card);
    });
  }

  function updateReadouts() {
    var u = U();
    READOUT_DEFS.forEach(function (rd) {
      var el = document.getElementById('ro-' + rd.key);
      var un = document.getElementById('ru-' + rd.key);
      if (!el || results[rd.key] === undefined) return;
      var conv = u[rd.kind].toDisp(results[rd.key]);
      el.textContent = fmt(conv, u[rd.kind].digits);
      if (un) un.textContent = ' ' + u[rd.kind].label;
    });
  }

  function fmt(v, digits) {
    if (!isFinite(v)) return String(v);
    var ab = Math.abs(v);
    if (ab >= 1e9) return (v / 1e9).toFixed(2) + 'G';
    if (ab >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (ab >= 1e3) return (v / 1e3).toFixed(2) + 'k';
    if (ab > 0 && ab < 0.01) return v.toExponential(2);
    return v.toFixed(digits != null ? digits : 2);
  }

  /* ================================================================
     CANVAS DRAWING (DPR-aware)
     ================================================================ */

  var W = 900, H = 480;     /* logical coordinate space */

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    var parent = canvas.closest('.canvas-card');
    var cssW = parent.clientWidth - 16;
    var cssH = Math.min(cssW * (H / W), 480);
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(canvas.width / W, canvas.height / H);
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
    ctx.imageSmoothingQuality = 'high';
  }

  function draw() {
    resizeCanvas();

    /* Background */
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);

    if (showGrid) drawGrid();

    if (mode !== 'simulate') return;

    var bbox = getShapeBBox();
    var margin = 60;
    var scaleX = (W - 2 * margin) / bbox.w;
    var scaleY = (H - 2 * margin) / bbox.h;
    var scale  = Math.min(scaleX, scaleY, 3);

    var ox = W / 2;
    var oy = H / 2;

    ctx.save();
    ctx.translate(ox, oy);

    drawShape(scale, bbox);
    if (showCentroid) drawCentroid(scale, bbox);
    if (showAxes) drawAxes(scale, bbox);
    if (showDimensions) drawDimensions(scale, bbox);

    ctx.restore();

    /* Unit badge */
    ctx.fillStyle = 'rgba(255,109,0,0.15)';
    ctx.strokeStyle = 'rgba(255,109,0,0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, W - 70, 12, 58, 24, 6);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff8a3d';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(unitMode === 'imp' ? 'IMPERIAL' : 'SI mm', W - 41, 24);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(42,48,80,.4)';
    ctx.lineWidth = 0.5;
    var gs = 20;
    for (var x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  }

  function getShapeBBox() {
    switch (curShape) {
      case 'rectangle':     return { w: params.b, h: params.h };
      case 'circle':        return { w: params.d, h: params.d };
      case 'hollow-circle': return { w: params.D, h: params.D };
      case 'hollow-rect':   return { w: params.B, h: params.H };
      case 'i-beam':        return { w: params.bf, h: params.H };
      case 't-section':     return { w: params.bf, h: params.hw + params.tf };
      case 'channel':       return { w: params.bf, h: params.H };
      case 'angle':         return { w: params.b, h: params.h };
    }
    return { w: 100, h: 100 };
  }

  function drawShape(s, bbox) {
    ctx.fillStyle = 'rgba(255,109,0,.18)';
    ctx.strokeStyle = '#ff6d00';
    ctx.lineWidth = 2;

    var hw = bbox.w / 2 * s;
    var hh = bbox.h / 2 * s;

    switch (curShape) {
      case 'rectangle':
        ctx.fillRect(-hw, -hh, bbox.w * s, bbox.h * s);
        ctx.strokeRect(-hw, -hh, bbox.w * s, bbox.h * s);
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, params.d / 2 * s, 0, 2 * Math.PI);
        ctx.fill(); ctx.stroke();
        break;

      case 'hollow-circle':
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, params.D / 2 * s, 0, 2 * Math.PI);
        ctx.arc(0, 0, params.di / 2 * s, 0, 2 * Math.PI, true);
        ctx.fill('evenodd');
        ctx.beginPath();
        ctx.arc(0, 0, params.D / 2 * s, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, params.di / 2 * s, 0, 2 * Math.PI); ctx.stroke();
        ctx.restore();
        break;

      case 'hollow-rect':
        ctx.save();
        ctx.beginPath();
        ctx.rect(-params.B / 2 * s, -params.H / 2 * s, params.B * s, params.H * s);
        ctx.rect(-params.bi / 2 * s, -params.hi / 2 * s, params.bi * s, params.hi * s);
        ctx.fill('evenodd');
        ctx.strokeRect(-params.B / 2 * s, -params.H / 2 * s, params.B * s, params.H * s);
        ctx.strokeRect(-params.bi / 2 * s, -params.hi / 2 * s, params.bi * s, params.hi * s);
        ctx.restore();
        break;

      case 'i-beam': {
        var bf = params.bf * s, tf = params.tf * s, HH = params.H * s, tw = params.tw * s;
        ctx.beginPath();
        ctx.moveTo(-bf / 2, -HH / 2);
        ctx.lineTo(bf / 2, -HH / 2);
        ctx.lineTo(bf / 2, -HH / 2 + tf);
        ctx.lineTo(tw / 2, -HH / 2 + tf);
        ctx.lineTo(tw / 2, HH / 2 - tf);
        ctx.lineTo(bf / 2, HH / 2 - tf);
        ctx.lineTo(bf / 2, HH / 2);
        ctx.lineTo(-bf / 2, HH / 2);
        ctx.lineTo(-bf / 2, HH / 2 - tf);
        ctx.lineTo(-tw / 2, HH / 2 - tf);
        ctx.lineTo(-tw / 2, -HH / 2 + tf);
        ctx.lineTo(-bf / 2, -HH / 2 + tf);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;
      }

      case 't-section': {
        var bft = params.bf * s, tft = params.tf * s, hwt = params.hw * s, twt = params.tw * s;
        var totalHt = hwt + tft;
        ctx.beginPath();
        ctx.moveTo(-twt / 2, totalHt / 2);
        ctx.lineTo(-twt / 2, totalHt / 2 - hwt);
        ctx.lineTo(-bft / 2, totalHt / 2 - hwt);
        ctx.lineTo(-bft / 2, -totalHt / 2);
        ctx.lineTo(bft / 2, -totalHt / 2);
        ctx.lineTo(bft / 2, totalHt / 2 - hwt);
        ctx.lineTo(twt / 2, totalHt / 2 - hwt);
        ctx.lineTo(twt / 2, totalHt / 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;
      }

      case 'channel': {
        var bfc = params.bf * s, Hc = params.H * s, tfc = params.tf * s, twc = params.tw * s;
        ctx.beginPath();
        ctx.moveTo(-bfc / 2, -Hc / 2);
        ctx.lineTo(-bfc / 2 + bfc, -Hc / 2);
        ctx.lineTo(-bfc / 2 + bfc, -Hc / 2 + tfc);
        ctx.lineTo(-bfc / 2 + twc, -Hc / 2 + tfc);
        ctx.lineTo(-bfc / 2 + twc, Hc / 2 - tfc);
        ctx.lineTo(-bfc / 2 + bfc, Hc / 2 - tfc);
        ctx.lineTo(-bfc / 2 + bfc, Hc / 2);
        ctx.lineTo(-bfc / 2, Hc / 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;
      }

      case 'angle': {
        var ba = params.b * s, ha = params.h * s, ta = params.t * s;
        ctx.beginPath();
        ctx.moveTo(-ba / 2, ha / 2);
        ctx.lineTo(ba / 2, ha / 2);
        ctx.lineTo(ba / 2, ha / 2 - ta);
        ctx.lineTo(-ba / 2 + ta, ha / 2 - ta);
        ctx.lineTo(-ba / 2 + ta, -ha / 2);
        ctx.lineTo(-ba / 2, -ha / 2);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
        break;
      }
    }
  }

  function drawCentroid(s, bbox) {
    var cx = 0, cy = 0;
    if (results.cx !== undefined && results.cy !== undefined) {
      cx = (results.cx - bbox.w / 2) * s;
      cy = -(results.cy - bbox.h / 2) * s;
    }
    var sz = 10;
    ctx.strokeStyle = '#3ddc84';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - sz, cy); ctx.lineTo(cx + sz, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy - sz); ctx.lineTo(cx, cy + sz); ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#3ddc84'; ctx.fill();
    ctx.fillStyle = '#3ddc84';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText('C', cx + 12, cy - 4);
  }

  function drawAxes(s, bbox) {
    var cx = 0, cy = 0;
    if (results.cx !== undefined && results.cy !== undefined) {
      cx = (results.cx - bbox.w / 2) * s;
      cy = -(results.cy - bbox.h / 2) * s;
    }
    var extent = Math.max(W, H) / 2;
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255,109,0,.7)';
    ctx.beginPath(); ctx.moveTo(-extent, cy); ctx.lineTo(extent, cy); ctx.stroke();
    ctx.strokeStyle = 'rgba(79,142,247,.7)';
    ctx.beginPath(); ctx.moveTo(cx, -extent); ctx.lineTo(cx, extent); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255,109,0,.9)';
    ctx.fillText('x', extent - 20, cy - 6);
    ctx.fillText('x', -extent + 6, cy - 6);
    ctx.fillStyle = 'rgba(79,142,247,.9)';
    ctx.fillText('y', cx + 6, -extent + 16);
    ctx.fillText('y', cx + 6, extent - 6);
  }

  function dimLabel(mm) {
    var u = U();
    return u.len.toDisp(mm).toFixed(u.len.digits) + ' ' + u.len.label;
  }

  function drawDimensions(s, bbox) {
    ctx.strokeStyle = '#6b7a99';
    ctx.fillStyle = '#dde3f0';
    ctx.lineWidth = 1;
    ctx.font = '11px "Courier New", monospace';

    var hw = bbox.w / 2 * s;
    var hh = bbox.h / 2 * s;
    var offset = 22;

    switch (curShape) {
      case 'rectangle':
        dimLineH(-hw, hh + offset, hw, hh + offset, dimLabel(params.b));
        dimLineV(-hw - offset, -hh, -hw - offset, hh, dimLabel(params.h));
        break;
      case 'circle':
        dimLineH(-hw, hh + offset, hw, hh + offset, 'd=' + dimLabel(params.d));
        break;
      case 'hollow-circle':
        dimLineH(-params.D / 2 * s, hh + offset, params.D / 2 * s, hh + offset, 'D=' + dimLabel(params.D));
        dimLineH(-params.di / 2 * s, hh + offset + 18, params.di / 2 * s, hh + offset + 18, 'd=' + dimLabel(params.di));
        break;
      case 'hollow-rect':
        dimLineH(-params.B / 2 * s, params.H / 2 * s + offset, params.B / 2 * s, params.H / 2 * s + offset, 'B=' + dimLabel(params.B));
        dimLineV(-params.B / 2 * s - offset, -params.H / 2 * s, -params.B / 2 * s - offset, params.H / 2 * s, 'H=' + dimLabel(params.H));
        break;
      case 'i-beam': {
        var bfi = params.bf * s, Hi = params.H * s;
        dimLineH(-bfi / 2, Hi / 2 + offset, bfi / 2, Hi / 2 + offset, 'bf=' + dimLabel(params.bf));
        dimLineV(-bfi / 2 - offset, -Hi / 2, -bfi / 2 - offset, Hi / 2, 'H=' + dimLabel(params.H));
        ctx.fillText('tf=' + dimLabel(params.tf), bfi / 2 + 8, -Hi / 2 + params.tf * s / 2 + 4);
        ctx.fillText('tw=' + dimLabel(params.tw), params.tw / 2 * s + 6, 4);
        break;
      }
      case 't-section': {
        var bft2 = params.bf * s, totalH2 = (params.hw + params.tf) * s;
        dimLineH(-bft2 / 2, -totalH2 / 2 - offset, bft2 / 2, -totalH2 / 2 - offset, 'bf=' + dimLabel(params.bf));
        dimLineV(-bft2 / 2 - offset, -totalH2 / 2, -bft2 / 2 - offset, totalH2 / 2, 'H=' + dimLabel(params.hw + params.tf));
        break;
      }
      case 'channel': {
        var bfc2 = params.bf * s, Hc2 = params.H * s;
        dimLineH(-bfc2 / 2, Hc2 / 2 + offset, -bfc2 / 2 + bfc2, Hc2 / 2 + offset, 'bf=' + dimLabel(params.bf));
        dimLineV(-bfc2 / 2 - offset, -Hc2 / 2, -bfc2 / 2 - offset, Hc2 / 2, 'H=' + dimLabel(params.H));
        break;
      }
      case 'angle': {
        var ba2 = params.b * s, ha2 = params.h * s;
        dimLineH(-ba2 / 2, ha2 / 2 + offset, ba2 / 2, ha2 / 2 + offset, 'b=' + dimLabel(params.b));
        dimLineV(-ba2 / 2 - offset, -ha2 / 2, -ba2 / 2 - offset, ha2 / 2, 'h=' + dimLabel(params.h));
        ctx.fillText('t=' + dimLabel(params.t), -ba2 / 2 + params.t * s + 4, -ha2 / 2 + 14);
        break;
      }
    }
  }

  function dimLineH(x1, y, x2, y2, label) {
    var arrowSz = 5;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x1 + arrowSz, y - arrowSz); ctx.lineTo(x1 + arrowSz, y + arrowSz); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - arrowSz, y - arrowSz); ctx.lineTo(x2 - arrowSz, y + arrowSz); ctx.closePath(); ctx.fill();
    var tw = ctx.measureText(label).width;
    ctx.fillText(label, (x1 + x2) / 2 - tw / 2, y - 5);
  }

  function dimLineV(x, y1, x2, y2, label) {
    var arrowSz = 5;
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x - arrowSz, y1 + arrowSz); ctx.lineTo(x + arrowSz, y1 + arrowSz); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x - arrowSz, y2 - arrowSz); ctx.lineTo(x + arrowSz, y2 - arrowSz); ctx.closePath(); ctx.fill();
    ctx.save();
    ctx.translate(x - 8, (y1 + y2) / 2);
    ctx.rotate(-Math.PI / 2);
    var tw = ctx.measureText(label).width;
    ctx.fillText(label, -tw / 2, 0);
    ctx.restore();
  }

  /* ================================================================
     LEARNING PANELS — Live Equations (KaTeX) + Coach
     ================================================================ */

  var _learnCache = { eq: '', co: '' };

  function shapeFormulaLatex(shape) {
    switch (shape) {
      case 'rectangle':     return ['I_x = \\dfrac{b h^3}{12}', 'I_y = \\dfrac{h b^3}{12}', 'S_x = \\dfrac{b h^2}{6}', 'r_x = \\dfrac{h}{\\sqrt{12}}'];
      case 'circle':        return ['I_x = I_y = \\dfrac{\\pi d^4}{64}', 'S_x = \\dfrac{\\pi d^3}{32}', 'J = \\dfrac{\\pi d^4}{32}', 'r_x = \\dfrac{d}{4}'];
      case 'hollow-circle': return ['I_x = \\dfrac{\\pi (D^4 - d^4)}{64}', 'S_x = \\dfrac{\\pi (D^4 - d^4)}{32 D}', 'J = \\dfrac{\\pi (D^4 - d^4)}{32}'];
      case 'hollow-rect':   return ['I_x = \\dfrac{B H^3 - b h^3}{12}', 'I_y = \\dfrac{H B^3 - h b^3}{12}', 'A = BH - bh'];
      case 'i-beam':        return ['I_x = \\dfrac{b_f H^3 - (b_f - t_w) h_w^3}{12}', 'h_w = H - 2 t_f', 'I_y = \\dfrac{2 t_f b_f^3 + h_w t_w^3}{12}'];
      case 't-section':     return ['\\bar{y} = \\dfrac{\\sum A_i y_i}{\\sum A_i}', 'I_x = \\sum (I_{ci} + A_i d_i^{\\,2})', 'S_x = \\dfrac{I_x}{c_{\\max}}'];
      case 'channel':       return ['\\bar{x} = \\dfrac{\\sum A_i x_i}{\\sum A_i}', 'I_x = I_{web} + 2 (I_{fl} + A_{fl} d^2)', 'I_y = \\sum (I_{ci} + A_i d_i^{\\,2})'];
      case 'angle':         return ['\\bar{x},\\bar{y} = \\dfrac{\\sum A_i x_i}{\\sum A_i}', 'I_x = \\sum (I_{ci} + A_i d_i^{\\,2})', 'I_y = \\sum (I_{ci} + A_i d_i^{\\,2})'];
    }
    return [];
  }

  function updateLearnPanels() {
    if (!lpEqBody || !lpCoachBody) return;

    /* Live equations */
    var formulas = shapeFormulaLatex(curShape);
    var u = U();
    var html = '<div class="lp-shape-name">' + getShapeName(curShape) + '</div>';
    formulas.forEach(function (f) {
      html += '<div class="eq-line">\\[ ' + f + ' \\]</div>';
    });
    html += '<div class="eq-divider">Current values:</div>';
    html += '<div class="eq-line">\\( I_x = ' + fmt(u.I.toDisp(results.Ix), u.I.digits) + '\\;\\mathrm{' + (unitMode === 'imp' ? 'in^4' : 'mm^4') + '} \\)</div>';
    html += '<div class="eq-line">\\( I_y = ' + fmt(u.I.toDisp(results.Iy), u.I.digits) + '\\;\\mathrm{' + (unitMode === 'imp' ? 'in^4' : 'mm^4') + '} \\)</div>';
    html += '<div class="eq-line">\\( S_x = ' + fmt(u.S.toDisp(results.Sx), u.S.digits) + '\\;\\mathrm{' + (unitMode === 'imp' ? 'in^3' : 'mm^3') + '} \\)</div>';

    if (html !== _learnCache.eq) {
      lpEqBody.innerHTML = html;
      _learnCache.eq = html;
    }

    /* Coach */
    var tips = coachTips();
    var ch = '<ul class="coach-list">';
    tips.forEach(function (t) { ch += '<li>' + t + '</li>'; });
    ch += '</ul>';
    if (ch !== _learnCache.co) {
      lpCoachBody.innerHTML = ch;
      _learnCache.co = ch;
    }
  }

  function getShapeName(id) {
    for (var i = 0; i < SHAPES.length; i++) if (SHAPES[i].id === id) return SHAPES[i].name;
    return id;
  }

  function coachTips() {
    var t = [];
    var ratio = results.Ix && results.Iy ? results.Ix / results.Iy : 1;
    if (ratio > 2) t.push('<strong>Ix &gt; Iy</strong> — this section is stiffer in vertical bending. Orient with x-x as the bending axis.');
    else if (ratio < 0.5) t.push('<strong>Iy &gt; Ix</strong> — stiffer about the vertical axis.');
    else t.push('<strong>Ix &asymp; Iy</strong> — biaxially symmetric or near-square; good for columns.');

    if (curShape === 'i-beam') t.push('I-beam puts material in the flanges, far from the neutral axis. The y² term in I = &int;y² dA rewards this distribution.');
    if (curShape === 'circle') t.push('Solid circle: <strong>Ix = Iy</strong> for any axis through centre. Ideal for shafts under combined bending and torsion.');
    if (curShape === 'hollow-circle') t.push('Hollow tube: high I/weight ratio. Material near the neutral axis contributes little, so removing it costs little stiffness.');
    if (curShape === 't-section') t.push('T-section: <strong>centroid is offset</strong>. Top and bottom fibres have different distances to the neutral axis, so c_max controls Sx.');
    if (curShape === 'rectangle') t.push('Rectangle: Ix scales with h³. <strong>Doubling height multiplies Ix by 8</strong> — orient the long side perpendicular to the load.');

    /* Slenderness flag */
    if (results.rx && results.A) {
      var L = 1000; /* hypothetical 1 m column */
      var slender = L / results.rx;
      if (slender > 200) t.push('Long, slender section (L/rx &gt; 200 at L=1 m) — prone to <strong>column buckling</strong>. Use Euler’s formula.');
    }
    return t;
  }

  /* ================================================================
     CALC MODAL — Show Calculations
     ================================================================ */

  function calcStep(num, title, formula, calculation, result) {
    var html = '<div class="cs-step">';
    html += '<div class="cs-step-hd"><span class="cs-num">Step ' + num + '</span><span class="cs-title">' + title + '</span></div>';
    if (formula)     html += '<div class="cs-formula">' + formula + '</div>';
    if (calculation) html += '<div class="cs-calc">' + calculation + '</div>';
    if (result != null) html += '<div class="cs-result">→ <strong>' + result + '</strong></div>';
    html += '</div>';
    return html;
  }

  function rN(x, d) {
    if (!isFinite(x)) return String(x);
    var p = Math.pow(10, d || 0);
    return (Math.round(x * p) / p).toString();
  }

  function buildCalcSteps() {
    var u = U();
    var html = '';
    html += '<div class="cs-inputs"><span class="cs-badge">Given &mdash; ' + getShapeName(curShape) + '</span>';
    html += '<div class="cs-given">';
    SHAPE_SLIDERS[curShape].forEach(function (s) {
      html += '<span>' + s.label + ' = ' + rN(params[s.id], 2) + ' mm</span>';
    });
    html += '</div>';
    html += '<p class="cs-si-note">&#9432; All steps in SI (mm). Final values shown in current display units.</p></div>';

    var step = 1;

    switch (curShape) {
      case 'rectangle': {
        var b = params.b, h = params.h;
        html += calcStep(step++, 'Area', '\\[ A = b \\cdot h \\]',
          '\\( A = ' + rN(b,2) + ' \\times ' + rN(h,2) + ' = ' + rN(results.A,2) + '\\;\\mathrm{mm^2} \\)',
          fmt(u.area.toDisp(results.A), u.area.digits) + ' ' + u.area.label);
        html += calcStep(step++, 'Centroid', '\\[ \\bar{x} = b/2,\\; \\bar{y} = h/2 \\]',
          '\\( \\bar{y} = ' + rN(h/2,2) + '\\;\\mathrm{mm} \\)', null);
        html += calcStep(step++, 'Moment of Inertia about x', '\\[ I_x = \\dfrac{b h^3}{12} \\]',
          '\\( I_x = \\dfrac{' + rN(b,2) + ' \\cdot ' + rN(h,2) + '^3}{12} = ' + rN(results.Ix,0) + '\\;\\mathrm{mm^4} \\)',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Section Modulus', '\\[ S_x = \\dfrac{I_x}{c} = \\dfrac{b h^2}{6} \\]',
          '\\( S_x = \\dfrac{' + rN(b,2) + ' \\cdot ' + rN(h,2) + '^2}{6} = ' + rN(results.Sx,0) + '\\;\\mathrm{mm^3} \\)',
          fmt(u.S.toDisp(results.Sx), u.S.digits) + ' ' + u.S.label);
        html += calcStep(step++, 'Radius of Gyration', '\\[ r_x = \\sqrt{\\dfrac{I_x}{A}} = \\dfrac{h}{\\sqrt{12}} \\]',
          '\\( r_x = ' + rN(h,2) + '/\\sqrt{12} = ' + rN(results.rx,3) + '\\;\\mathrm{mm} \\)',
          fmt(u.len.toDisp(results.rx), u.len.digits) + ' ' + u.len.label);
        break;
      }
      case 'circle': {
        var d = params.d;
        html += calcStep(step++, 'Area', '\\[ A = \\dfrac{\\pi d^2}{4} \\]',
          '\\( A = \\pi \\cdot ' + rN(d,2) + '^2 / 4 = ' + rN(results.A,2) + '\\;\\mathrm{mm^2} \\)',
          fmt(u.area.toDisp(results.A), u.area.digits) + ' ' + u.area.label);
        html += calcStep(step++, 'Ix = Iy (symmetry)', '\\[ I_x = I_y = \\dfrac{\\pi d^4}{64} \\]',
          '\\( I_x = \\pi \\cdot ' + rN(d,2) + '^4 / 64 = ' + rN(results.Ix,0) + '\\;\\mathrm{mm^4} \\)',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Polar J (perpendicular axis)', '\\[ J = I_x + I_y = \\dfrac{\\pi d^4}{32} \\]',
          '\\( J = ' + rN(results.J,0) + '\\;\\mathrm{mm^4} \\)',
          fmt(u.I.toDisp(results.J), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Section Modulus', '\\[ S_x = \\dfrac{\\pi d^3}{32} \\]',
          '\\( S_x = ' + rN(results.Sx,2) + '\\;\\mathrm{mm^3} \\)',
          fmt(u.S.toDisp(results.Sx), u.S.digits) + ' ' + u.S.label);
        break;
      }
      case 'hollow-circle': {
        var D = params.D, di = params.di;
        html += calcStep(step++, 'Area (annulus)', '\\[ A = \\dfrac{\\pi (D^2 - d^2)}{4} \\]',
          '\\( A = \\pi (' + rN(D,2) + '^2 - ' + rN(di,2) + '^2)/4 = ' + rN(results.A,2) + ' \\)',
          fmt(u.area.toDisp(results.A), u.area.digits) + ' ' + u.area.label);
        html += calcStep(step++, 'Ix by subtraction', '\\[ I_x = \\dfrac{\\pi(D^4 - d^4)}{64} \\]',
          '\\( I_x = \\pi(' + rN(D,2) + '^4 - ' + rN(di,2) + '^4)/64 = ' + rN(results.Ix,0) + ' \\)',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Section Modulus', '\\[ S_x = \\dfrac{I_x}{D/2} \\]',
          '\\( S_x = ' + rN(results.Ix,0) + ' / ' + rN(D/2,2) + ' = ' + rN(results.Sx,2) + ' \\)',
          fmt(u.S.toDisp(results.Sx), u.S.digits) + ' ' + u.S.label);
        html += calcStep(step++, 'Efficiency note', null,
          'Removing material near the centre costs little I — hollow shafts are weight-efficient.', null);
        break;
      }
      case 'hollow-rect': {
        var B = params.B, HH = params.H, bi = params.bi, hi = params.hi;
        html += calcStep(step++, 'Area', '\\[ A = BH - bh \\]',
          '\\( A = ' + rN(B,2) + ' \\cdot ' + rN(HH,2) + ' - ' + rN(bi,2) + ' \\cdot ' + rN(hi,2) + ' = ' + rN(results.A,2) + ' \\)',
          fmt(u.area.toDisp(results.A), u.area.digits) + ' ' + u.area.label);
        html += calcStep(step++, 'Ix by subtraction', '\\[ I_x = \\dfrac{B H^3 - b h^3}{12} \\]',
          '\\( I_x = (' + rN(B,2) + '\\cdot ' + rN(HH,2) + '^3 - ' + rN(bi,2) + '\\cdot ' + rN(hi,2) + '^3)/12 \\)',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Iy', '\\[ I_y = \\dfrac{H B^3 - h b^3}{12} \\]',
          '\\( I_y = ' + rN(results.Iy,0) + '\\;\\mathrm{mm^4} \\)',
          fmt(u.I.toDisp(results.Iy), u.I.digits) + ' ' + u.I.label);
        break;
      }
      case 'i-beam': {
        var bf = params.bf, tf = params.tf, HH2 = params.H, tw = params.tw;
        var hw = HH2 - 2 * tf;
        html += calcStep(step++, 'Web height', '\\[ h_w = H - 2 t_f \\]',
          '\\( h_w = ' + rN(HH2,2) + ' - 2 \\cdot ' + rN(tf,2) + ' = ' + rN(hw,2) + '\\;\\mathrm{mm} \\)', null);
        html += calcStep(step++, 'Area', '\\[ A = 2 b_f t_f + h_w t_w \\]',
          '\\( A = 2 \\cdot ' + rN(bf,2) + ' \\cdot ' + rN(tf,2) + ' + ' + rN(hw,2) + ' \\cdot ' + rN(tw,2) + ' = ' + rN(results.A,2) + ' \\)',
          fmt(u.area.toDisp(results.A), u.area.digits) + ' ' + u.area.label);
        html += calcStep(step++, 'Ix (outer rect minus side notches)', '\\[ I_x = \\dfrac{b_f H^3 - (b_f - t_w) h_w^3}{12} \\]',
          '\\( I_x = ' + rN(results.Ix,0) + '\\;\\mathrm{mm^4} \\)',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Section Modulus', '\\[ S_x = \\dfrac{I_x}{H/2} \\]',
          '\\( S_x = ' + rN(results.Sx,0) + '\\;\\mathrm{mm^3} \\)',
          fmt(u.S.toDisp(results.Sx), u.S.digits) + ' ' + u.S.label);
        html += calcStep(step++, 'Design note', null,
          'I-beams maximize Ix per unit area — material is concentrated in flanges at maximum y from the neutral axis.', null);
        break;
      }
      case 't-section': {
        var bf2 = params.bf, tf2 = params.tf, hw2 = params.hw, tw2 = params.tw;
        var Aw = hw2 * tw2, Af = bf2 * tf2;
        html += calcStep(step++, 'Component areas', '\\[ A_{web} = h_w t_w,\\; A_{fl} = b_f t_f \\]',
          '\\( A_{web} = ' + rN(Aw,2) + ',\\; A_{fl} = ' + rN(Af,2) + ' \\)', null);
        html += calcStep(step++, 'Centroid (composite)', '\\[ \\bar{y} = \\dfrac{\\sum A_i y_i}{\\sum A_i} \\]',
          '\\( \\bar{y} = \\dfrac{' + rN(Aw,2) + '\\cdot ' + rN(hw2/2,2) + ' + ' + rN(Af,2) + '\\cdot ' + rN(hw2+tf2/2,2) + '}{' + rN(results.A,2) + '} = ' + rN(results.cy,2) + ' \\)',
          fmt(u.len.toDisp(results.cy), u.len.digits) + ' ' + u.len.label + ' (from bottom)');
        html += calcStep(step++, 'Ix (parallel axis theorem)', '\\[ I_x = \\sum \\left( I_{ci} + A_i d_i^{\\,2} \\right) \\]',
          'Apply Ic = bh³/12 for each component, shift by d to overall centroid.',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Section Modulus (unsymmetric)', '\\[ S_x = \\dfrac{I_x}{c_{\\max}} \\]',
          'Use the larger of cTop, cBot — tension fibre carries max stress.',
          fmt(u.S.toDisp(results.Sx), u.S.digits) + ' ' + u.S.label);
        break;
      }
      case 'channel': {
        var bf3 = params.bf, H3 = params.H, tf3 = params.tf, tw3 = params.tw;
        html += calcStep(step++, 'Component areas', '\\[ A_{web},\\; A_{fl} \\]',
          'Aweb = (H − 2tf) · tw, Afl = bf · tf', null);
        html += calcStep(step++, 'Centroid x (from web)', '\\[ \\bar{x} = \\dfrac{\\sum A_i x_i}{\\sum A_i} \\]',
          '\\( \\bar{x} = ' + rN(results.cx, 2) + '\\;\\mathrm{mm} \\)',
          fmt(u.len.toDisp(results.cx), u.len.digits) + ' ' + u.len.label);
        html += calcStep(step++, 'Ix (parallel axis)',
          '\\[ I_x = I_{web} + 2 \\left( I_{fl} + A_{fl} \\left(\\dfrac{H - t_f}{2}\\right)^2 \\right) \\]',
          'Web contributes Iweb directly; flanges shifted by (H − tf)/2.',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Iy about centroid', '\\[ I_y = \\sum (I_{ci} + A_i d_i^{\\,2}) \\]',
          'Each component’s Iy shifted by distance from x̄.',
          fmt(u.I.toDisp(results.Iy), u.I.digits) + ' ' + u.I.label);
        break;
      }
      case 'angle': {
        var ba = params.b, ha = params.h, ta = params.t;
        html += calcStep(step++, 'Decompose into two legs', null,
          'Horizontal leg b × t, vertical leg (h − t) × t. No overlap at the corner.', null);
        html += calcStep(step++, 'Centroid', '\\[ \\bar{x},\\bar{y} = \\dfrac{\\sum A_i x_i,\\;\\sum A_i y_i}{\\sum A_i} \\]',
          '\\( \\bar{x} = ' + rN(results.cx,2) + ',\\; \\bar{y} = ' + rN(results.cy,2) + ' \\)',
          fmt(u.len.toDisp(results.cx), u.len.digits) + ', ' + fmt(u.len.toDisp(results.cy), u.len.digits) + ' ' + u.len.label);
        html += calcStep(step++, 'Ix, Iy (parallel axis)', '\\[ I = \\sum (I_{ci} + A_i d_i^{\\,2}) \\]',
          'Compute about overall centroid, then sum.',
          fmt(u.I.toDisp(results.Ix), u.I.digits) + ' / ' + fmt(u.I.toDisp(results.Iy), u.I.digits) + ' ' + u.I.label);
        html += calcStep(step++, 'Design note', null,
          'Angle sections are asymmetric — for true principal axes, compute Ix′y′ and rotate. This tool gives Ix, Iy about geometric centroidal axes.', null);
        break;
      }
    }
    return html;
  }

  function openCalcModal() {
    var modal = document.getElementById('calc-modal');
    var body  = document.getElementById('calc-modal-body');
    if (!modal || !body) return;
    body.innerHTML = buildCalcSteps();
    modal.classList.add('active');
    var cb = document.getElementById('calc-modal-close'); if (cb) cb.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeCalcModal() {
    var modal = document.getElementById('calc-modal'); if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    var b = document.getElementById('btn-calc'); if (b) b.focus();
  }

  /* ================================================================
     CUSTOM VALUE MODAL
     ================================================================ */

  function openCustomModal(sliderDef) {
    customTarget = sliderDef;
    var modal = document.getElementById('custom-modal');
    var u = U();
    var dispMin = u.len.toDisp(sliderDef.min);
    var dispMax = u.len.toDisp(sliderDef.max);
    var dispCur = u.len.toDisp(params[sliderDef.id]);
    document.getElementById('custom-modal-title').textContent = 'Set ' + sliderDef.label;
    document.getElementById('custom-modal-range').textContent =
      'Range: ' + dispMin.toFixed(u.len.digits) + ' to ' + dispMax.toFixed(u.len.digits) + ' ' + u.len.label +
      '. Values beyond this range are allowed but may not render correctly.';
    var inp = document.getElementById('custom-modal-input');
    inp.value = dispCur.toFixed(u.len.digits);
    document.getElementById('custom-modal-unit').textContent = u.len.label;
    modal.classList.add('active');
    setTimeout(function () { inp.focus(); inp.select(); }, 40);
    document.body.style.overflow = 'hidden';
  }

  function closeCustomModal() {
    document.getElementById('custom-modal').classList.remove('active');
    document.body.style.overflow = '';
    customTarget = null;
  }

  function submitCustomModal() {
    if (!customTarget) return;
    var inp = document.getElementById('custom-modal-input');
    var dv = parseFloat(inp.value);
    if (isNaN(dv)) return;
    var u = U();
    var mm = u.len.fromDisp(dv);
    if (mm < 1) mm = 1;
    saveUndo();
    params[customTarget.id] = mm;
    enforceConstraints();
    syncSliderDOM();
    updateFromSliders();
    closeCustomModal();
  }

  /* ================================================================
     EXPORT — CSV + PNG
     ================================================================ */

  function exportCSV() {
    var u = U();
    var rows = [];
    rows.push(['Property', 'Value (SI)', 'SI Unit', 'Value (' + (unitMode === 'imp' ? 'Imperial' : 'SI display') + ')', 'Display Unit']);
    rows.push(['Shape', getShapeName(curShape), '', '', '']);
    SHAPE_SLIDERS[curShape].forEach(function (s) {
      rows.push([s.label, params[s.id], 'mm', u.len.toDisp(params[s.id]), u.len.label]);
    });
    READOUT_DEFS.forEach(function (rd) {
      var siUnit = ({ area: 'mm^2', len: 'mm', S: 'mm^3', I: 'mm^4' })[rd.kind];
      var dispUnit = u[rd.kind].label;
      rows.push([rd.label, results[rd.key], siUnit, u[rd.kind].toDisp(results[rd.key]), dispUnit]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'moment-of-inertia-' + curShape + '.csv';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  function exportPNG() {
    var off = document.createElement('canvas');
    var dpr = window.devicePixelRatio || 1;
    off.width  = canvas.width;
    off.height = canvas.height + Math.round(40 * dpr);
    var octx = off.getContext('2d');
    octx.fillStyle = '#0d1117';
    octx.fillRect(0, 0, off.width, off.height);
    octx.drawImage(canvas, 0, 0);
    octx.fillStyle = '#8b9dc3';
    octx.font = 'bold ' + (12 * dpr) + 'px "Segoe UI", sans-serif';
    octx.fillText('NHIT VisualLab  •  ' + getShapeName(curShape) + '  •  Moment of Inertia', 14 * dpr, canvas.height + 24 * dpr);
    var a = document.createElement('a');
    a.href = off.toDataURL('image/png');
    a.download = 'moment-of-inertia-' + curShape + '.png';
    a.click();
  }

  /* ================================================================
     CONTEXT MENU (right-click on canvas)
     ================================================================ */

  var ctxMenu = document.getElementById('ctx-menu');

  function showContextMenu(x, y) {
    if (!ctxMenu) return;
    ctxMenu.style.display = 'block';
    var rect = ctxMenu.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    if (x + rect.width  > vw) x = vw - rect.width  - 6;
    if (y + rect.height > vh) y = vh - rect.height - 6;
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top  = y + 'px';
  }

  function hideContextMenu() {
    if (ctxMenu) ctxMenu.style.display = 'none';
  }

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY);
  });
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideContextMenu(); });

  /* ================================================================
     MODE SWITCHING
     ================================================================ */

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    var m = e.target.dataset.mode;
    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    switchMode(m);
  });

  function switchMode(m) {
    mode = m;

    simPanel.style.display   = 'none';
    shapeSel.style.display   = 'none';
    if (presetBox) presetBox.style.display = 'none';
    if (learnPanels) learnPanels.style.display = 'none';
    catRow.style.display     = 'none';
    itemSel.style.display    = 'none';
    itemInfo.style.display   = 'none';
    practPanel.style.display = 'none';
    practBar.style.display   = 'none';
    quizPanel.style.display  = 'none';
    quizBar.style.display    = 'none';
    quizResult.style.display = 'none';
    canvas.closest('.canvas-card').style.display = 'none';

    switch (m) {
      case 'simulate':
        simPanel.style.display = '';
        shapeSel.style.display = '';
        if (presetBox) presetBox.style.display = '';
        if (learnPanels) learnPanels.style.display = '';
        canvas.closest('.canvas-card').style.display = '';
        draw();
        updateLearnPanels();
        break;
      case 'explore':
        catRow.style.display   = '';
        itemSel.style.display  = '';
        buildExploreGrid();
        break;
      case 'practice':
        practPanel.style.display = '';
        practBar.style.display   = '';
        pCorrect = 0; pTotal = 0; pAnswered = false;
        pbarScoreEl.textContent = '0 / 0';
        newPractice();
        break;
      case 'quiz':
        quizBar.style.display = '';
        startQuiz();
        break;
    }
  }

  /* ================================================================
     EXPLORE MODE — CONCEPTS
     ================================================================ */

  var CONCEPTS = [
    { id: 'area-moment', name: 'Area Moment of Inertia', symbol: 'I', formula: 'I = \\int y^2 \\, dA', unit: 'mm⁴', cat: 'basics',
      desc: 'The area moment of inertia (second moment of area) measures how a cross-section\'s area is distributed relative to an axis. A larger I means greater resistance to bending. It depends on both the amount of material and how far it is from the neutral axis — material farther from the axis contributes more due to the y² term.',
      example: { problem: 'Why does an I-beam have a higher Ix than a rectangle of the same area?', steps: ['I = ∫ y² dA', 'The I-beam concentrates material in flanges far from the neutral axis', 'Large y values are squared, contributing significantly', 'Result: Higher Ix for the same cross-sectional area'] }
    },
    { id: 'centroid', name: 'Centroid', symbol: 'x̄, ȳ', formula: '\\bar{x} = \\dfrac{\\sum A_i x_i}{\\sum A_i}', unit: 'mm', cat: 'basics',
      desc: 'The centroid is the geometric centre of a cross-section, where the first moment of area equals zero. For composite sections, the centroid is the weighted average of each component\'s centroid, weighted by area: x̄ = Σ(Ai·xi)/ΣAi. The neutral axis passes through the centroid for pure bending.',
      example: { problem: 'Find the centroid of a T-section: flange 100×15 mm on top of web 10×100 mm.', steps: ['Af = 100×15 = 1500 mm², yf = 100 + 7.5 = 107.5 mm', 'Aw = 10×100 = 1000 mm², yw = 50 mm', 'ȳ = (1500×107.5 + 1000×50) / 2500', 'ȳ = (161250 + 50000) / 2500 = 84.5 mm from bottom'] }
    },
    { id: 'section-modulus', name: 'Section Modulus', symbol: 'S', formula: 'S = \\dfrac{I}{c}', unit: 'mm³', cat: 'basics',
      desc: 'The elastic section modulus S = I/c, where c is the distance from the neutral axis to the extreme fibre. It relates bending moment to maximum stress through σ = M/S. For symmetric sections, S is the same for top and bottom. For unsymmetric sections (T-beams), use the larger c value for the critical section modulus.',
      example: { problem: 'Find S for a rectangle 40×80 mm.', steps: ['Ix = bh³/12 = 40×80³/12 = 1,706,667 mm⁴', 'c = h/2 = 40 mm', 'S = Ix/c = 1,706,667/40', 'S = 42,667 mm³'] }
    },
    { id: 'radius-gyration', name: 'Radius of Gyration', symbol: 'r', formula: 'r = \\sqrt{\\dfrac{I}{A}}', unit: 'mm', cat: 'basics',
      desc: 'The radius of gyration r = √(I/A) represents the distance at which the entire area could be concentrated to yield the same moment of inertia. It is a key parameter in column buckling analysis: slenderness ratio λ = L/r determines whether a column fails by crushing or buckling.',
      example: { problem: 'Find rx for a circle of d=60 mm.', steps: ['A = π×60²/4 = 2827.4 mm²', 'Ix = π×60⁴/64 = 636,173 mm⁴', 'rx = √(636173/2827.4)', 'rx = d/4 = 15.0 mm'] }
    },
    { id: 'polar-moment', name: 'Polar Moment of Inertia', symbol: 'J', formula: 'J = I_x + I_y', unit: 'mm⁴', cat: 'basics',
      desc: 'The polar moment of inertia J = Ix + Iy (perpendicular axis theorem for planar areas). For circular sections, J = πd⁴/32. It is used in torsion analysis: shear stress τ = Tc/J, where T is the torque and c is the distance from the centre. A larger J means less shear stress under the same torque.',
      example: { problem: 'Find J for a circle of d=50 mm.', steps: ['J = πd⁴/32', 'J = π×50⁴/32', 'J = π×6,250,000/32', 'J = 613,592 mm⁴'] }
    },

    { id: 'shape-rect', name: 'Rectangle Formulas', symbol: 'b × h', formula: 'I_x = \\dfrac{b h^3}{12}', unit: 'mm⁴', cat: 'shapes',
      desc: 'Rectangle (width b, height h): Area = bh, Ix = bh³/12, Iy = hb³/12, Sx = bh²/6, rx = h/√12. The moment of inertia is proportional to the cube of the dimension perpendicular to the axis — doubling the height increases Ix by 8 times.',
      example: { problem: 'Calculate Ix for a rectangle 50×100 mm.', steps: ['Ix = bh³/12', 'Ix = 50 × 100³ / 12', 'Ix = 50 × 1,000,000 / 12', 'Ix = 4,166,667 mm⁴'] }
    },
    { id: 'shape-circle', name: 'Circle Formulas', symbol: 'd', formula: 'I_x = \\dfrac{\\pi d^4}{64}', unit: 'mm⁴', cat: 'shapes',
      desc: 'Circle (diameter d): Area = πd²/4, Ix = Iy = πd⁴/64, Sx = πd³/32, rx = d/4, J = πd⁴/32. The circle is unique in that Ix = Iy regardless of axis orientation, making it ideal for shafts subject to combined bending and torsion.',
      example: { problem: 'Calculate Ix for a circle d=80 mm.', steps: ['Ix = πd⁴/64', 'Ix = π × 80⁴ / 64', 'Ix = π × 40,960,000 / 64', 'Ix = 2,010,619 mm⁴'] }
    },
    { id: 'shape-hollow', name: 'Hollow Sections', symbol: 'D, d', formula: 'I_x = \\dfrac{\\pi (D^4 - d^4)}{64}', unit: 'mm⁴', cat: 'shapes',
      desc: 'Hollow sections (circular or rectangular) subtract the inner shape from the outer. For hollow circles: Ix = π(D⁴−d⁴)/64. Hollow sections are efficient because they remove material near the neutral axis (which contributes little to I) while maintaining material at the extremes.',
      example: { problem: 'Find Ix for a hollow circle D=100, d=60 mm.', steps: ['Ix = π(D⁴ − d⁴)/64', 'Ix = π(100⁴ − 60⁴)/64', 'Ix = π(100,000,000 − 12,960,000)/64', 'Ix = π × 87,040,000/64 = 4,270,079 mm⁴'] }
    },
    { id: 'shape-ibeam', name: 'I-Beam Section', symbol: 'bf, tf, H, tw', formula: 'I_x = \\dfrac{b_f H^3 - (b_f - t_w) h_w^3}{12}', unit: 'mm⁴', cat: 'shapes',
      desc: 'The I-beam (wide flange) is the most efficient structural section for bending about the strong axis. Its formula: Ix = (bf·H³ − (bf−tw)·hw³)/12, where hw = H − 2tf. The flanges carry bending stress while the web resists shear.',
      example: { problem: 'I-beam: bf=100, tf=15, H=150, tw=10 mm. Find Ix.', steps: ['hw = 150 − 2×15 = 120 mm', 'Ix = (100×150³ − (100−10)×120³)/12', 'Ix = (337,500,000 − 155,520,000)/12', 'Ix = 181,980,000/12 = 15,165,000 mm⁴'] }
    },

    { id: 'parallel-axis', name: 'Parallel Axis Theorem', symbol: 'I = Ic + Ad²', formula: 'I = I_c + A d^2', unit: 'mm⁴', cat: 'theorems',
      desc: 'The parallel axis theorem (Steiner\'s theorem) transfers the moment of inertia from the centroidal axis to any parallel axis: I = Ic + Ad². The term Ad² is always positive, so the moment of inertia about any non-centroidal axis is always greater than about the centroid. This is the fundamental tool for analysing composite cross-sections.',
      example: { problem: 'A rectangle 40×20 mm has its centroid 50 mm from the reference axis. Find I about the reference axis.', steps: ['Ic = bh³/12 = 40×20³/12 = 26,667 mm⁴', 'A = 40×20 = 800 mm²', 'I = Ic + Ad² = 26,667 + 800×50²', 'I = 26,667 + 2,000,000 = 2,026,667 mm⁴'] }
    },
    { id: 'perpendicular-axis', name: 'Perpendicular Axis Theorem', symbol: 'J = Ix + Iy', formula: 'J = I_x + I_y', unit: 'mm⁴', cat: 'theorems',
      desc: 'For planar (2D) areas, the polar moment of inertia about an axis perpendicular to the plane equals the sum of the moments about two orthogonal in-plane axes: J = Ix + Iy. It applies only to planar (flat) cross-sections, not to 3D mass moments of inertia.',
      example: { problem: 'A circle has Ix = 636,173 mm⁴. What is J?', steps: ['For a circle: Ix = Iy (symmetry)', 'J = Ix + Iy', 'J = 636,173 + 636,173', 'J = 1,272,345 mm⁴'] }
    },

    { id: 'app-beam', name: 'Beam Design', symbol: 'σ = M/S', formula: '\\sigma = \\dfrac{M}{S}', unit: 'MPa', cat: 'applications',
      desc: 'In beam design, the flexure formula σ = M/S relates bending moment M to maximum bending stress σ through the section modulus S = I/c. (1) Find maximum bending moment M. (2) Choose allowable stress σ_allow. (3) Required S = M/σ_allow. (4) Select a section with S ≥ S_required.',
      example: { problem: 'A beam has M = 50 kN·m and σ_allow = 160 MPa. Find required S.', steps: ['S_req = M / σ_allow', 'S_req = 50 × 10⁶ / 160 (kN·m → N·mm)', 'S_req = 50,000,000 / 160', 'S_req = 312,500 mm³'] }
    },
    { id: 'app-column', name: 'Column Buckling', symbol: 'Pcr = π²EI/L²', formula: 'P_{cr} = \\dfrac{\\pi^2 E I}{(K L)^2}', unit: 'N', cat: 'applications',
      desc: 'Euler\'s critical buckling load Pcr = π²EI/(KL)², where E is the elastic modulus, I is the minimum moment of inertia, K is the effective length factor (1.0 pinned-pinned, 0.5 fixed-fixed), and L is the column length. The column buckles about the axis with the smallest I, so use I_min.',
      example: { problem: 'A pinned-pinned steel column (E=200 GPa), L=3 m, I_min=1,800,000 mm⁴. Find Pcr.', steps: ['Pcr = π²EI / L² (K=1)', 'Pcr = π² × 200,000 × 1,800,000 / 3000²', 'Pcr = 9.8696 × 200,000 × 1,800,000 / 9,000,000', 'Pcr = 394,784 N ≈ 394.8 kN'] }
    },
    { id: 'app-shaft', name: 'Shaft Torsion', symbol: 'τ = Tc/J', formula: '\\tau = \\dfrac{T c}{J}', unit: 'MPa', cat: 'applications',
      desc: 'For circular shafts under torsion, the shear stress τ = Tc/J, where T is the torque, c is the outer radius, and J is the polar moment of inertia. The angle of twist θ = TL/(GJ). Hollow shafts are more efficient than solid shafts for the same weight.',
      example: { problem: 'A solid shaft d=50 mm, T=500 N·m. Find max shear stress.', steps: ['J = πd⁴/32 = π×50⁴/32 = 613,592 mm⁴', 'c = d/2 = 25 mm', 'τ = Tc/J = 500,000 × 25 / 613,592', 'τ = 20.4 MPa'] }
    }
  ];

  catTabs.addEventListener('click', function (e) {
    if (!e.target.matches('.pill')) return;
    exploreCat = e.target.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p === e.target);
    });
    buildExploreGrid();
  });

  function buildExploreGrid() {
    conceptGrid.innerHTML = '';
    itemInfo.style.display = 'none';
    var filtered = CONCEPTS.filter(function (c) { return c.cat === exploreCat; });
    filtered.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'is-btn';
      btn.innerHTML = '<span class="is-btn-name">' + c.name + '</span><span class="is-btn-sym">' + c.symbol + '</span>';
      btn.addEventListener('click', function () {
        conceptGrid.querySelectorAll('.is-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        showConceptInfo(c);
      });
      conceptGrid.appendChild(btn);
    });
    itemSel.style.display = '';
  }

  function showConceptInfo(c) {
    var html = '<div class="ii-top"><span class="ii-name">' + c.name + '</span><span class="ii-cat-badge">' + c.cat + '</span></div>';
    html += '<div class="ii-desc">' + c.desc + '</div>';
    html += '<div class="formula-box"><span class="fb-formula">\\[ ' + c.formula + ' \\]</span><span class="fb-unit">' + c.unit + '</span></div>';
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4>';
      html += '<div class="ex-problem">' + c.example.problem + '</div>';
      c.example.steps.forEach(function (st) {
        html += '<div class="ex-step">→ <strong>' + st + '</strong></div>';
      });
      html += '</div>';
    }
    itemInfo.innerHTML = html;
    itemInfo.style.display = '';
  }

  /* ================================================================
     PRACTICE MODE
     ================================================================ */

  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function round2(v) { return Math.round(v * 100) / 100; }

  var PRACTICE_GEN = [
    function () {
      var b = randInt(20, 80), h = randInt(40, 120);
      var Ix = round2(b * h * h * h / 12);
      return { prompt: 'Find Ix of a rectangle ' + b + ' mm × ' + h + ' mm.', unit: 'mm⁴',
        steps: ['Ix = bh³/12', 'Ix = ' + b + ' × ' + h + '³ / 12', 'Ix = ' + b + ' × ' + (h*h*h) + ' / 12', 'Ix = ' + Ix], answer: Ix };
    },
    function () {
      var b = randInt(20, 80), h = randInt(40, 120);
      var Iy = round2(h * b * b * b / 12);
      return { prompt: 'Find Iy of a rectangle ' + b + ' mm wide, ' + h + ' mm tall.', unit: 'mm⁴',
        steps: ['Iy = hb³/12', 'Iy = ' + h + ' × ' + b + '³ / 12', 'Iy = ' + h + ' × ' + (b*b*b) + ' / 12', 'Iy = ' + Iy], answer: Iy };
    },
    function () {
      var b = randInt(20, 80), h = randInt(40, 120);
      var Sx = round2(b * h * h / 6);
      return { prompt: 'Find Sx (section modulus) of a rectangle ' + b + ' × ' + h + ' mm.', unit: 'mm³',
        steps: ['Sx = bh²/6', 'Sx = ' + b + ' × ' + h + '² / 6', 'Sx = ' + b + ' × ' + (h*h) + ' / 6', 'Sx = ' + Sx], answer: Sx };
    },
    function () {
      var d = randInt(30, 100);
      var Ix = round2(Math.PI * d * d * d * d / 64);
      return { prompt: 'Find Ix of a circle with diameter d = ' + d + ' mm.', unit: 'mm⁴',
        steps: ['Ix = πd⁴/64', 'Ix = π × ' + d + '⁴ / 64', 'Ix = π × ' + (d*d*d*d) + ' / 64', 'Ix = ' + Ix], answer: Ix };
    },
    function () {
      var d = randInt(30, 100);
      var Sx = round2(Math.PI * d * d * d / 32);
      return { prompt: 'Find Sx of a circle d = ' + d + ' mm.', unit: 'mm³',
        steps: ['Sx = πd³/32', 'Sx = π × ' + d + '³ / 32', 'Sx = π × ' + (d*d*d) + ' / 32', 'Sx = ' + Sx], answer: Sx };
    },
    function () {
      var b = randInt(30, 60), h = randInt(40, 80);
      var Ic = b * h * h * h / 12;
      var A = b * h;
      var d = h / 2;
      var Ibase = round2(Ic + A * d * d);
      return { prompt: 'Using the parallel axis theorem, find I about the base for a rectangle b=' + b + ', h=' + h + ' mm.', unit: 'mm⁴',
        steps: ['Ic = bh³/12 = ' + round2(Ic), 'A = bh = ' + A + ' mm²', 'd = h/2 = ' + d + ' mm', 'I_base = Ic + Ad² = ' + round2(Ic) + ' + ' + A + '×' + d + '² = ' + Ibase], answer: Ibase };
    },
    function () {
      var d = randInt(40, 100);
      var rx = round2(d / 4);
      return { prompt: 'Find the radius of gyration rx for a circle d = ' + d + ' mm.', unit: 'mm',
        steps: ['For a circle: rx = d/4', 'rx = ' + d + ' / 4', 'rx = ' + rx + ' mm'], answer: rx };
    },
    function () {
      var D = randInt(60, 120), di = randInt(30, D - 10);
      var Ix = round2(Math.PI * (D*D*D*D - di*di*di*di) / 64);
      return { prompt: 'Find Ix of a hollow circle D=' + D + ', d=' + di + ' mm.', unit: 'mm⁴',
        steps: ['Ix = π(D⁴ − d⁴)/64', 'Ix = π(' + (D*D*D*D) + ' − ' + (di*di*di*di) + ')/64', 'Ix = π × ' + (D*D*D*D - di*di*di*di) + ' / 64', 'Ix = ' + Ix], answer: Ix };
    },
    function () {
      var bf = randInt(60, 120), tf = randInt(8, 20), H = randInt(100, 200), tw = randInt(6, 14);
      var hw = H - 2 * tf;
      var A = 2 * bf * tf + hw * tw;
      return { prompt: 'Find the area of an I-beam: bf=' + bf + ', tf=' + tf + ', H=' + H + ', tw=' + tw + ' mm.', unit: 'mm²',
        steps: ['hw = H − 2tf = ' + H + ' − ' + (2*tf) + ' = ' + hw + ' mm', 'A = 2×bf×tf + hw×tw', 'A = 2×' + bf + '×' + tf + ' + ' + hw + '×' + tw, 'A = ' + (2*bf*tf) + ' + ' + (hw*tw) + ' = ' + A], answer: A };
    },
    function () {
      var d = randInt(30, 100);
      var J = round2(Math.PI * d * d * d * d / 32);
      return { prompt: 'Find the polar moment of inertia J for a circle d=' + d + ' mm.', unit: 'mm⁴',
        steps: ['J = πd⁴/32', 'J = π × ' + d + '⁴ / 32', 'J = π × ' + (d*d*d*d) + ' / 32', 'J = ' + J], answer: J };
    },
    function () {
      var b = randInt(20, 80), h = randInt(40, 120);
      var rx = round2(h / Math.sqrt(12));
      return { prompt: 'Find rx (radius of gyration about x) for a rectangle ' + b + ' × ' + h + ' mm.', unit: 'mm',
        steps: ['rx = h / √12', 'rx = ' + h + ' / 3.4641', 'rx = ' + rx + ' mm'], answer: rx };
    },
    function () {
      var B = randInt(60, 120), HH = randInt(80, 160);
      var bi = randInt(30, B - 10), hi = randInt(40, HH - 10);
      var Ix = round2((B * HH * HH * HH - bi * hi * hi * hi) / 12);
      return { prompt: 'Find Ix of a hollow rectangle: outer ' + B + '×' + HH + ', inner ' + bi + '×' + hi + ' mm.', unit: 'mm⁴',
        steps: ['Ix = (BH³ − bh³)/12', 'Ix = (' + B + '×' + (HH*HH*HH) + ' − ' + bi + '×' + (hi*hi*hi) + ') / 12', 'Ix = (' + (B*HH*HH*HH) + ' − ' + (bi*hi*hi*hi) + ') / 12', 'Ix = ' + Ix], answer: Ix };
    }
  ];

  function newPractice() {
    pAnswered = false;
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppInput.value = '';
    ppInput.disabled = false;
    ppCheck.style.display = '';
    ppShow.style.display = '';
    ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    var gen = PRACTICE_GEN[Math.floor(Math.random() * PRACTICE_GEN.length)];
    curProblem = gen();
    ppPrompt.textContent = curProblem.prompt;
    ppUnit.textContent = curProblem.unit;
    ppInput.focus();
  }

  ppCheck.addEventListener('click', checkPractice);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });

  function checkPractice() {
    if (pAnswered || !curProblem) return;
    var val = parseFloat(ppInput.value);
    if (isNaN(val)) { ppFeedback.textContent = 'Enter a number'; ppFeedback.className = 'feedback err'; return; }
    pAnswered = true;
    pTotal++;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppShow.style.display = 'none';
    ppNext.style.display = '';
    var tol = Math.max(Math.abs(curProblem.answer) * 0.01, 0.5);
    if (Math.abs(val - curProblem.answer) <= tol) {
      pCorrect++;
      ppFeedback.textContent = '✓ Correct!';
      ppFeedback.className = 'feedback ok';
    } else {
      ppFeedback.textContent = '✗ Incorrect. Answer: ' + curProblem.answer;
      ppFeedback.className = 'feedback err';
    }
    showSolution();
    pbarScoreEl.textContent = pCorrect + ' / ' + pTotal;
  }

  ppShow.addEventListener('click', function () {
    if (!curProblem) return;
    showSolution();
  });

  function showSolution() {
    if (!curProblem) return;
    var html = '<h4>Solution</h4>';
    curProblem.steps.forEach(function (st) {
      html += '<div class="sol-step">→ <strong>' + st + '</strong></div>';
    });
    ppSolution.innerHTML = html;
    ppSolution.style.display = '';
  }

  ppNext.addEventListener('click', newPractice);

  /* ================================================================
     QUIZ MODE
     ================================================================ */

  var QUIZ_POOL = [
    { type: 'mcq', prompt: 'Which shape has the highest Ix for the same cross-sectional area?',
      options: ['Circle', 'I-Beam', 'Square', 'Solid triangle'], correct: 1,
      explanation: 'The I-beam concentrates material far from the neutral axis, maximizing Ix.' },
    { type: 'mcq', prompt: 'The parallel axis theorem formula is:',
      options: ['I = Ic − Ad²', 'I = Ic + Ad²', 'I = Ic × d', 'I = Ic / A'], correct: 1,
      explanation: 'I = Ic + Ad² — the transfer term is always positive.' },
    { type: 'mcq', prompt: 'The radius of gyration r is defined as:',
      options: ['r = I/A', 'r = A/I', 'r = √(I/A)', 'r = I²/A'], correct: 2,
      explanation: 'r = √(I/A) gives the distance where area could be concentrated.' },
    { type: 'mcq', prompt: 'For a circular cross-section, which statement is true?',
      options: ['Ix > Iy', 'Ix < Iy', 'Ix = Iy', 'Ix = 2Iy'], correct: 2,
      explanation: 'A circle has equal moments of inertia about any centroidal axis due to symmetry.' },
    { type: 'mcq', prompt: 'Section modulus S is used in which formula?',
      options: ['σ = M × S', 'σ = M / S', 'σ = S / M', 'σ = M + S'], correct: 1,
      explanation: 'The flexure formula: σ = M/S relates bending moment to stress.' },
    { type: 'mcq', prompt: 'The perpendicular axis theorem states:',
      options: ['Ix = Iy', 'J = Ix − Iy', 'J = Ix + Iy', 'J = Ix × Iy'], correct: 2,
      explanation: 'For planar areas, J = Ix + Iy.' },
    { type: 'mcq', prompt: 'Doubling the height h of a rectangle changes Ix by a factor of:',
      options: ['2', '4', '8', '16'], correct: 2,
      explanation: 'Ix = bh³/12 — height is cubed, so doubling h gives 2³ = 8 times.' },
    { type: 'mcq', prompt: 'Which property is most critical for column buckling analysis?',
      options: ['Area', 'Section modulus', 'Minimum moment of inertia', 'Polar moment'], correct: 2,
      explanation: 'Columns buckle about the axis with the smallest I (Pcr = π²EI/L²).' },
    { type: 'numeric', prompt: 'Calculate Ix for a rectangle 50 × 100 mm (in mm⁴).',
      answer: 4166667, unit: 'mm⁴', tolerance: 0.01,
      explanation: 'Ix = 50 × 100³ / 12 = 4,166,667 mm⁴' },
    { type: 'numeric', prompt: 'Find the area of a circle d = 80 mm (in mm²).',
      answer: round2(Math.PI * 80 * 80 / 4), unit: 'mm²', tolerance: 0.01,
      explanation: 'A = πd²/4 = 5026.55 mm²' },
    { type: 'numeric', prompt: 'What is the section modulus of a circle d = 80 mm (in mm³)?',
      answer: round2(Math.PI * 80 * 80 * 80 / 32), unit: 'mm³', tolerance: 0.01,
      explanation: 'Sx = πd³/32 = 50,265.48 mm³' },
    { type: 'numeric', prompt: 'Find rx (radius of gyration) for a rectangle with h = 120 mm (in mm).',
      answer: round2(120 / Math.sqrt(12)), unit: 'mm', tolerance: 0.01,
      explanation: 'rx = h/√12 = 34.64 mm' },
    { type: 'numeric', prompt: 'Find Sx for a rectangle 40 × 80 mm (in mm³).',
      answer: round2(40 * 80 * 80 / 6), unit: 'mm³', tolerance: 0.01,
      explanation: 'Sx = bh²/6 = 42,666.67 mm³' },
    { type: 'numeric', prompt: 'Find J (polar moment) for a circle d = 50 mm (in mm⁴).',
      answer: round2(Math.PI * 50*50*50*50 / 32), unit: 'mm⁴', tolerance: 0.01,
      explanation: 'J = πd⁴/32 = 613,592.32 mm⁴' },
    { type: 'numeric', prompt: 'Ix about the base of a rectangle 30 × 60 mm using parallel axis theorem (mm⁴)?',
      answer: round2(30 * 60*60*60 / 12 + 30*60*(30)*(30)), unit: 'mm⁴', tolerance: 0.01,
      explanation: 'I_base = bh³/3 = 30×60³/3 = 2,160,000 mm⁴' }
  ];

  function startQuiz() {
    quizScore = 0;
    quizIdx = 0;
    quizAnswered = false;
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    var pool = QUIZ_POOL.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    quizSet = pool.slice(0, QUIZ_SIZE);
    quizSet.forEach(function (q) { q.userAnswer = null; q.isCorrect = false; });
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    var q = quizSet[quizIdx];
    qbarNum.textContent = (quizIdx + 1);
    quizAnswered = false;
    var html = '<p class="qp-prompt">' + q.prompt + '</p>';
    if (q.type === 'mcq') {
      html += '<div class="answer-grid">';
      q.options.forEach(function (opt, i) {
        html += '<button class="answer-btn" data-idx="' + i + '">' + opt + '</button>';
      });
      html += '</div>';
    } else {
      html += '<div class="quiz-input-row">';
      html += '<input class="qi-input" id="qi-val" type="number" step="any" placeholder="Answer">';
      html += '<span class="qi-unit">' + q.unit + '</span>';
      html += '<button class="btn btn-primary" id="qi-submit">Submit</button>';
      html += '</div>';
    }
    html += '<div class="quiz-feedback" id="quiz-fb" style="margin-top:10px;"></div>';
    html += '<button class="btn btn-ghost" id="quiz-next" style="display:none;margin-top:10px;">Next →</button>';
    quizPanel.innerHTML = html;
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (quizAnswered) return;
          submitQuizMCQ(parseInt(btn.dataset.idx));
        });
      });
    } else {
      var submitBtn = document.getElementById('qi-submit');
      var inp = document.getElementById('qi-val');
      submitBtn.addEventListener('click', function () { submitQuizNumeric(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitQuizNumeric(); });
      inp.focus();
    }
    var nextBtn = document.getElementById('quiz-next');
    nextBtn.addEventListener('click', function () {
      quizIdx++;
      if (quizIdx < QUIZ_SIZE) renderQuizQuestion();
      else showQuizResult();
    });
  }

  function submitQuizMCQ(idx) {
    if (quizAnswered) return;
    quizAnswered = true;
    var q = quizSet[quizIdx];
    q.userAnswer = q.options[idx];
    var btns = quizPanel.querySelectorAll('.answer-btn');
    btns.forEach(function (b, i) {
      b.classList.add('locked');
      if (i === q.correct) b.classList.add('correct');
      if (i === idx && idx !== q.correct) b.classList.add('wrong');
    });
    q.isCorrect = (idx === q.correct);
    if (q.isCorrect) quizScore++;
    var fb = document.getElementById('quiz-fb');
    fb.textContent = q.isCorrect ? '✓ Correct!' : '✗ ' + q.explanation;
    fb.className = 'quiz-feedback ' + (q.isCorrect ? 'ok' : 'err');
    document.getElementById('quiz-next').style.display = '';
  }

  function submitQuizNumeric() {
    if (quizAnswered) return;
    var inp = document.getElementById('qi-val');
    var val = parseFloat(inp.value);
    if (isNaN(val)) return;
    quizAnswered = true;
    var q = quizSet[quizIdx];
    q.userAnswer = val;
    var tol = Math.max(Math.abs(q.answer) * (q.tolerance || 0.01), 0.5);
    q.isCorrect = (Math.abs(val - q.answer) <= tol);
    if (q.isCorrect) quizScore++;
    inp.disabled = true;
    document.getElementById('qi-submit').disabled = true;
    var fb = document.getElementById('quiz-fb');
    fb.textContent = q.isCorrect ? '✓ Correct!' : '✗ Answer: ' + q.answer + '. ' + q.explanation;
    fb.className = 'quiz-feedback ' + (q.isCorrect ? 'ok' : 'err');
    document.getElementById('quiz-next').style.display = '';
  }

  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizResult.style.display = '';
    var pct = quizScore / QUIZ_SIZE;
    var stars, cls, verdict;
    if (pct >= 1)        { stars = '★★★'; cls = 'perfect'; verdict = 'Perfect score!'; }
    else if (pct >= 0.6) { stars = '★★';      cls = 'good';    verdict = 'Good job!'; }
    else                 { stars = '★';            cls = 'poor';    verdict = 'Keep practising!'; }
    var html = '<div class="qr-header"><div class="qr-title-wrap"><div class="qr-title">Quiz Complete</div><div class="qr-stars">' + stars + '</div></div>';
    html += '<div class="qr-score-wrap"><div class="qr-score ' + cls + '">' + quizScore + ' / ' + QUIZ_SIZE + '</div><div class="qr-verdict">' + verdict + '</div></div></div>';
    html += '<div class="qr-rows">';
    quizSet.forEach(function (q, i) {
      var rowCls = q.isCorrect ? 'ok' : 'err';
      var mark   = q.isCorrect ? '✓' : '✗';
      var detail = q.prompt;
      if (q.type === 'numeric') {
        detail += ' <strong>Your answer: ' + q.userAnswer + '</strong> (Correct: ' + q.answer + ')';
      } else {
        detail += ' <strong>' + (q.userAnswer || 'No answer') + '</strong>' + (q.isCorrect ? '' : ' (Correct: ' + q.options[q.correct] + ')');
      }
      html += '<div class="qr-row ' + rowCls + '"><span class="qr-qnum">Q' + (i + 1) + '</span><span class="qr-detail">' + detail + '</span><span class="qr-mark">' + mark + '</span></div>';
    });
    html += '</div>';
    html += '<button class="btn btn-primary" id="quiz-retry" style="align-self:center;margin-top:8px;">New Quiz</button>';
    quizResult.innerHTML = html;
    document.getElementById('quiz-retry').addEventListener('click', function () {
      quizResult.style.display = 'none';
      startQuiz();
    });
  }

  /* ================================================================
     WIRING — toggles, units, learn panels, calc modal, exports
     ================================================================ */

  function wireToggles() {
    var ids = ['chk-grid', 'chk-axes', 'chk-centroid', 'chk-dim'];
    var setters = {
      'chk-grid': function (v) { showGrid = v; },
      'chk-axes': function (v) { showAxes = v; },
      'chk-centroid': function (v) { showCentroid = v; },
      'chk-dim': function (v) { showDimensions = v; }
    };
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', function () {
        saveUndo();
        setters[id](el.checked);
        draw();
      });
    });
  }

  function wireUnits() {
    var siBtn = document.getElementById('unit-si');
    var imBtn = document.getElementById('unit-imp');
    function setUnit(u) {
      if (unitMode === u) return;
      saveUndo();
      unitMode = u;
      syncUnitDOM();
      buildSliders(params); /* re-render sliders with new labels/values */
      buildReadouts();
      updateFromSliders();
    }
    if (siBtn) siBtn.addEventListener('click', function () { setUnit('si'); });
    if (imBtn) imBtn.addEventListener('click', function () { setUnit('imp'); });
  }

  function wireLearnPanels() {
    var expAll = document.getElementById('learn-expand-all');
    var colAll = document.getElementById('learn-collapse-all');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.learn-card'));
    if (expAll) expAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = true; }); });
    if (colAll) colAll.addEventListener('click', function () { cards.forEach(function (c) { c.open = false; }); });
  }

  function wireCalcModal() {
    var b = document.getElementById('btn-calc');
    if (b) b.addEventListener('click', openCalcModal);
    var c = document.getElementById('calc-modal-close');
    if (c) c.addEventListener('click', closeCalcModal);
    var el = document.getElementById('calc-modal');
    if (el) el.addEventListener('click', function (e) { if (e.target === el) closeCalcModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && el && el.classList.contains('active')) closeCalcModal();
    });
  }

  function wireCustomModal() {
    var cc = document.getElementById('custom-modal-close');
    var cs = document.getElementById('custom-modal-submit');
    var cm = document.getElementById('custom-modal');
    if (cc) cc.addEventListener('click', closeCustomModal);
    if (cs) cs.addEventListener('click', submitCustomModal);
    if (cm) cm.addEventListener('click', function (e) { if (e.target === cm) closeCustomModal(); });
    var inp = document.getElementById('custom-modal-input');
    if (inp) inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitCustomModal();
      if (e.key === 'Escape') closeCustomModal();
    });
  }

  function wireExports() {
    var c = document.getElementById('btn-export-csv');
    var p = document.getElementById('btn-export-png');
    if (c) c.addEventListener('click', exportCSV);
    if (p) p.addEventListener('click', exportPNG);
  }

  function wireContextMenu() {
    if (!ctxMenu) return;
    ctxMenu.addEventListener('click', function (e) {
      var act = e.target.dataset && e.target.dataset.act;
      if (!act) return;
      hideContextMenu();
      switch (act) {
        case 'export-png': exportPNG(); break;
        case 'export-csv': exportCSV(); break;
        case 'toggle-grid':
          saveUndo();
          showGrid = !showGrid;
          syncToggleDOM();
          draw();
          break;
        case 'reset':
          saveUndo();
          var defs = SHAPE_SLIDERS[curShape];
          defs.forEach(function (s) { params[s.id] = s.val; });
          enforceConstraints();
          syncSliderDOM();
          updateFromSliders();
          break;
        case 'show-calc': openCalcModal(); break;
      }
    });
  }

  /* Keyboard shortcuts */
  document.addEventListener('keydown', function (e) {
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  /* Resize */
  window.addEventListener('resize', function () { if (mode === 'simulate') draw(); });
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(function () { if (mode === 'simulate') draw(); }).observe(canvas.closest('.canvas-card'));
  }

  /* First-time hint — dismiss on first interaction */
  function dismissHint() {
    if (firstHintEl) firstHintEl.style.display = 'none';
    canvas.removeEventListener('click', dismissHint);
    sliderBox.removeEventListener('input', dismissHint);
  }
  if (firstHintEl) {
    canvas.addEventListener('click', dismissHint);
    sliderBox.addEventListener('input', dismissHint, true);
  }

  /* ================================================================
     INIT
     ================================================================ */

  buildShapeSelector();
  buildSliders();
  buildPresets();
  buildReadouts();
  syncUnitDOM();
  syncToggleDOM();
  wireToggles();
  wireUnits();
  wireLearnPanels();
  wireCalcModal();
  wireCustomModal();
  wireExports();
  wireContextMenu();
  updateFromSliders();

})();
