/* ═══════════════════════════════════════════════════════════════════
   Lathe Machine Simulator — app.js (v2 — realistic industrial upgrade)
   Centre Lathe: Parts Identification · 6 Operations · 5 Materials
   ─ Multi-color realistic graphics (industrial Colchester green)
   ─ Click-to-identify parts with hit-testing
   ─ Power / Coolant / Direction / Guard / Worklight toggles + E-Stop
   ─ Tool nose radius & workpiece length controls
   ─ Realistic chip curls, sparks, coolant stream, motion blur
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     S1  HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function $(id) { return document.getElementById(id); }
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function roundN(v, n) { var f = Math.pow(10, n); return Math.round(v * f) / f; }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function randFloat(a, b) { return a + Math.random() * (b - a); }
  function shuffleArr(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  function lightenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  function darkenColor(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ═══════════════════════════════════════════════════════════════
     S2  CONSTANTS & COLOR PALETTE
     ═══════════════════════════════════════════════════════════════ */
  var ACCENT = '#1e88e5';
  var ACCENT_LO = 'rgba(30,136,229,0.22)';
  var GREEN = '#3ddc84';
  var RED = '#ff5555';
  var GOLD = '#f5c842';
  var BG = '#0d1117';
  var SURFACE = '#161b27';
  var SURFACE2 = '#1f2535';
  var BORDER = '#2a3050';
  var TEXT = '#dde3f0';
  var TEXT_DIM = '#6b7a99';

  /* ── Industrial Colchester-style color palette ── */
  var COL = {
    paintDark:   '#1e4a2d',    // shadow side of green paint
    paintMid:    '#2e6e44',
    paintLight:  '#48a566',    // highlight
    paintHi:     '#6dc28a',    // top highlight
    bedTop:      '#3a3f48',    // machined gray top of bed
    bedShadow:   '#1f2329',
    castIron:    '#33383f',
    steel:       '#a8b0bc',
    steelDark:   '#5a626e',
    steelLight:  '#e8ecf2',
    chrome:      '#dde2eb',
    brass:       '#c9a063',    // lead screw
    brassDark:   '#876b3e',
    bronze:      '#a37a3e',    // spindle bearings
    chuckBody:   '#6c7480',
    chuckRing:   '#4a5260',
    chuckJaw:    '#c8ccd4',
    toolHolder:  '#e87b1a',    // safety orange tool holder
    toolHolderD: '#b85a08',
    insertGold:  '#f0c040',    // carbide insert
    insertEdge:  '#fff9c4',
    handwheel:   '#181a20',
    handwheelR:  '#c0392b',    // red center
    handle:      '#3a3f48',
    label:       '#0e1116',
    hazardY:     '#f5c842',
    hazardB:     '#0e1116',
    coolantBlue: '#3ec1ff',
    coolantHose: '#1a1d24',
    worklight:   '#fff4b8',
    pan:         '#262a31',
    panEdge:     '#3a3f48',
    chipMS:      '#c8b88a',    // mild steel chip color (heated)
    boltGray:    '#272a31',
    boltShine:   '#7a808a'
  };

  /* Operations */
  var OPERATIONS = [
    { id: 'turning',  name: 'Turning',       desc: 'Reducing diameter along length' },
    { id: 'facing',   name: 'Facing',        desc: 'Machining flat end surface' },
    { id: 'boring',   name: 'Boring',        desc: 'Enlarging internal hole' },
    { id: 'threading',name: 'Threading',     desc: 'Cutting screw threads (V-thread)' },
    { id: 'taper',    name: 'Taper Turning',  desc: 'Producing conical surface' },
    { id: 'knurling', name: 'Knurling',      desc: 'Creating diamond/straight knurl pattern' }
  ];

  /* Materials — with realistic colors and highlight tints for shading */
  var MATERIALS = [
    { id: 'mild-steel',      name: 'Mild Steel',      Ks: 2100, Vrec: 30,  color: '#8c95a0', hl: '#c8d0d8', chip: '#c8b88a' },
    { id: 'aluminum',        name: 'Aluminum',         Ks: 900,  Vrec: 100, color: '#c8cdd4', hl: '#f0f3f7', chip: '#e0e4ea' },
    { id: 'cast-iron',       name: 'Cast Iron',        Ks: 1500, Vrec: 25,  color: '#4a4d54', hl: '#7a7f88', chip: '#3a3d44' },
    { id: 'stainless-steel', name: 'Stainless Steel',  Ks: 2500, Vrec: 18,  color: '#a0a8b2', hl: '#e2e8f0', chip: '#b0b8c0' },
    { id: 'brass',           name: 'Brass',            Ks: 1100, Vrec: 60,  color: '#caa860', hl: '#e8d090', chip: '#d4b878' }
  ];

  /* ═══════════════════════════════════════════════════════════════
     S3  EXPLORE PARTS DATABASE + COLOR LEGEND
     ═══════════════════════════════════════════════════════════════ */
  var PART_CATEGORIES = [
    'All', 'Bed & Structure', 'Headstock', 'Tailstock',
    'Carriage Assembly', 'Drive & Feed', 'Work/Tool Holding'
  ];

  var PARTS = [
    { id: 1, name: 'Bed', cat: 'Bed & Structure', swatch: COL.paintMid,
      desc: 'Precision-machined cast iron casting with V-ways and flat ways. Provides the main reference surface on which all other components are mounted. Made of high-grade grey cast iron for vibration damping and wear resistance.' },
    { id: 2, name: 'Headstock', cat: 'Headstock', swatch: COL.paintDark,
      desc: 'Houses the main spindle, speed change gears, and back gear mechanism. Located at the left end of the bed. Contains the main driving mechanism that rotates the workpiece at various speeds.' },
    { id: 3, name: 'Spindle', cat: 'Headstock', swatch: COL.bronze,
      desc: 'Main rotating element of the lathe, hollow for passing bar stock through. Has a Morse taper nose for mounting chucks and faceplates. Supported by precision bearings for accurate rotation.' },
    { id: 4, name: 'Chuck (3-jaw)', cat: 'Work/Tool Holding', swatch: COL.chuckBody,
      desc: 'Self-centering three-jaw chuck that automatically centers round and hexagonal workpieces. All three jaws move simultaneously via a scroll plate. Most commonly used for routine turning operations.' },
    { id: 5, name: 'Chuck (4-jaw)', cat: 'Work/Tool Holding', swatch: COL.chuckRing,
      desc: 'Independent four-jaw chuck where each jaw moves independently. Used for holding irregular-shaped workpieces or when very accurate centering is required. Allows eccentric turning.' },
    { id: 6, name: 'Faceplate', cat: 'Work/Tool Holding', swatch: COL.steelDark,
      desc: 'Flat circular plate that mounts on the spindle nose for clamping irregular-shaped workpieces. Has T-slots and holes for bolting or clamping work that cannot be held in a chuck.' },
    { id: 7, name: 'Tailstock', cat: 'Tailstock', swatch: COL.paintDark,
      desc: 'Movable unit on the right end of the bed that can slide along and be clamped in any position. Supports long workpieces with a center and houses a quill for drilling operations.' },
    { id: 8, name: 'Tailstock Quill', cat: 'Tailstock', swatch: COL.steel,
      desc: 'Cylindrical sleeve that slides in and out of the tailstock body by a handwheel. Has a Morse taper bore for holding dead centers, drill chucks, or reamers. Feed is controlled by a graduated sleeve.' },
    { id: 9, name: 'Dead Center', cat: 'Tailstock', swatch: COL.chrome,
      desc: 'Non-rotating 60-degree conical point that fits into the tailstock quill. Supports the workpiece between centers. Requires lubrication as the workpiece rotates against it.' },
    { id: 10, name: 'Live Center', cat: 'Tailstock', swatch: COL.chrome,
      desc: 'Ball-bearing mounted center that rotates with the workpiece. Eliminates friction heating and workpiece damage. Preferred for high-speed operations and precision work.' },
    { id: 11, name: 'Carriage', cat: 'Carriage Assembly', swatch: COL.paintMid,
      desc: 'Main assembly that slides along the bed ways carrying the cross-slide, compound rest, and tool post. Provides longitudinal feed for turning operations. Moved by hand wheel or power feed.' },
    { id: 12, name: 'Cross-slide', cat: 'Carriage Assembly', swatch: COL.paintLight,
      desc: 'Mounted on top of the carriage, moves perpendicular to the bed axis. Controls the depth of cut by advancing the tool toward or away from the workpiece center. Has a graduated dial for precise movement.' },
    { id: 13, name: 'Compound Rest', cat: 'Carriage Assembly', swatch: COL.steelDark,
      desc: 'Swivel-mounted platform on top of the cross-slide. Can be set to any angle for taper turning and threading operations. Graduated base shows the angle of swivel.' },
    { id: 14, name: 'Tool Post', cat: 'Work/Tool Holding', swatch: COL.toolHolder,
      desc: 'Mounted on the compound rest to clamp the cutting tool at the correct center height. Available in standard (lantern), quick-change, and turret types. Quick-change allows rapid tool swapping.' },
    { id: 15, name: 'Apron', cat: 'Carriage Assembly', swatch: COL.paintDark,
      desc: 'Front face of the carriage containing the feed engagement mechanism, half-nut lever, and hand wheels. Houses gears that convert rotary motion from the feed rod into carriage movement.' },
    { id: 16, name: 'Lead Screw', cat: 'Drive & Feed', swatch: COL.brass,
      desc: 'Long precision Acme-thread screw running along the front of the bed. Used exclusively for thread cutting operations. The half-nut engages it for precise thread cutting.' },
    { id: 17, name: 'Feed Rod', cat: 'Drive & Feed', swatch: COL.steel,
      desc: 'Round shaft parallel to the lead screw that drives automatic carriage feed for turning and facing. Transmits power through a keyway to gears in the apron. Used for all non-threading operations.' },
    { id: 18, name: 'Half-nut Lever', cat: 'Drive & Feed', swatch: COL.handwheelR,
      desc: 'Lever on the apron that engages or disengages the split nut (half-nut) on the lead screw. When engaged, the carriage moves at a rate determined by the thread being cut. Only used during threading.' },
    { id: 19, name: 'Cutting Tool', cat: 'Work/Tool Holding', swatch: COL.insertGold,
      desc: 'HSS or carbide insert tool that removes material from the workpiece. Various shapes for different operations: right-hand turning, facing, boring, threading, and parting tools. Tool geometry includes rake, clearance, and nose radius.' },
    { id: 20, name: 'Steady Rest', cat: 'Work/Tool Holding', swatch: COL.paintLight,
      desc: 'Three-jaw support fixture clamped to the bed to support long flexible workpieces at an intermediate point. Prevents vibration and deflection during machining. Used when length-to-diameter ratio exceeds 10:1.' },
    { id: 21, name: 'Follow Rest', cat: 'Work/Tool Holding', swatch: COL.paintLight,
      desc: 'Two-jaw support fixture attached to the carriage that moves with the cutting tool. Supports the workpiece near the cutting zone to prevent deflection. Has two jaws that bear against the finished surface.' },
    { id: 22, name: 'Chip Pan', cat: 'Bed & Structure', swatch: COL.pan,
      desc: 'Tray or trough located below the bed to collect chips (swarf) and cutting fluid during machining. Prevents chips from falling on the floor and allows cutting fluid recirculation.' },
    { id: 23, name: 'Handwheel', cat: 'Carriage Assembly', swatch: COL.handwheel,
      desc: 'Manual rotation control for moving the carriage longitudinally along the bed. Calibrated dial allows precise positioning. The apron handwheel is used for hand-feed of the carriage.' },
    { id: 24, name: 'Coolant Nozzle', cat: 'Drive & Feed', swatch: COL.coolantBlue,
      desc: 'Adjustable nozzle that directs cutting fluid (coolant) onto the cutting zone. Cools the tool/workpiece, flushes chips away, and improves surface finish and tool life.' }
  ];

  /* ═══════════════════════════════════════════════════════════════
     S4  STATE
     ═══════════════════════════════════════════════════════════════ */
  var state = {
    mode: 'simulate',
    opIdx: 0,
    matIdx: 0,
    speed: 500,
    feed: 0.20,
    doc: 2.0,
    dia: 50,
    wpLength: 100,
    noseRadius: 0.8,
    running: false,
    time: 0,
    animFrame: null,
    lastTS: 0,
    toolPos: 0.18,
    chuckAngle: 0,
    chips: [],
    sparks: [],
    // Machine toggles
    power: true,
    coolant: true,
    direction: 1,     // 1 = CW, -1 = CCW
    worklight: true,
    guard: true,
    estopShake: 0,
    // Highlighted part (click)
    highlightedPart: null,
    hotspots: [],
    hoverPart: null,
    // Explore
    exploreCat: 'All',
    explorePart: null,
    // Practice
    pracProb: null, pracCorrect: 0, pracTotal: 0, pracAnswered: false,
    // Quiz
    quizBank: [], quizIdx: 0, quizAnswers: [], quizAnswered: false, quizDone: false
  };

  var phys = { V: 0, N: 0, f: 0, d: 0, Fc: 0, Ff: 0, Fr: 0, P: 0, MRR: 0, Ra: 0, time: 0 };

  /* ═══════════════════════════════════════════════════════════════
     S5  CANVAS SETUP
     ═══════════════════════════════════════════════════════════════ */
  var mcCanvas, mcCtx, grCanvas, grCtx, exCanvas, exCtx;

  /* Logical drawing spaces — every draw call below works in these units. */
  var LATHE_LOG = { 'machine-canvas': [600, 380], 'graph-canvas': [560, 500], 'explore-canvas': [900, 400] };

  /* Hi-DPI. All three canvases carried fixed width/height attributes while the
     CSS stretches them to their cards, so on a 2x display the machine view drew
     at 2.46x and the parameter graph at 2.64x — the worst upscales in this
     sweep. Backing stores now follow device pixels with the context scaled, so
     the logical spaces above are untouched. */
  function fitLathe(cv, ctx2) {
    if (!cv || !ctx2) return;
    var L = LATHE_LOG[cv.id]; if (!L) return;
    var dpr = window.devicePixelRatio || 1;
    var dW = cv.getBoundingClientRect().width;
    if (!(dW > 40)) dW = L[0];
    cv.width  = Math.round(dW * dpr);
    cv.height = Math.round(dW * (L[1] / L[0]) * dpr);
    var sc = (dW * dpr) / L[0];
    ctx2.setTransform(sc, 0, 0, sc, 0, 0);
  }
  function fitAllLathe() {
    fitLathe(mcCanvas, mcCtx); fitLathe(grCanvas, grCtx); fitLathe(exCanvas, exCtx);
  }

  function initCanvases() {
    mcCanvas = $('machine-canvas');
    grCanvas = $('graph-canvas');
    exCanvas = $('explore-canvas');
    if (mcCanvas) mcCtx = mcCanvas.getContext('2d');
    if (grCanvas) grCtx = grCanvas.getContext('2d');
    if (exCanvas) exCtx = exCanvas.getContext('2d');
    fitAllLathe();
    window.addEventListener('resize', fitAllLathe);
  }

  /* ═══════════════════════════════════════════════════════════════
     S6  OPERATION & MATERIAL PILLS
     ═══════════════════════════════════════════════════════════════ */
  function buildOpPills() {
    var container = $('op-tabs');
    if (!container) return;
    container.innerHTML = '';
    OPERATIONS.forEach(function (op, i) {
      var btn = document.createElement('button');
      btn.className = 'config-pill' + (i === state.opIdx ? ' active' : '');
      btn.textContent = op.name;
      btn.addEventListener('click', function () {
        state.opIdx = i;
        highlightPills(container, i);
        recomputeAndDraw();
      });
      container.appendChild(btn);
    });
  }

  function buildMatPills() {
    var container = $('mat-tabs');
    if (!container) return;
    container.innerHTML = '';
    MATERIALS.forEach(function (mat, i) {
      var btn = document.createElement('button');
      btn.className = 'config-pill mat-pill' + (i === state.matIdx ? ' active' : '');
      var sw = document.createElement('span');
      sw.className = 'mat-swatch';
      sw.style.background = mat.color;
      btn.appendChild(sw);
      btn.appendChild(document.createTextNode(mat.name));
      btn.addEventListener('click', function () {
        state.matIdx = i;
        highlightPills(container, i);
        recomputeAndDraw();
      });
      container.appendChild(btn);
    });
  }

  function highlightPills(container, activeIdx) {
    var pills = container.querySelectorAll('.config-pill');
    pills.forEach(function (p, i) {
      if (i === activeIdx) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  function recomputeAndDraw() {
    updatePhysics();
    updateReadouts();
    updateBadges();
    drawMachine();
    drawGraph();
  }

  /* ═══════════════════════════════════════════════════════════════
     S7  SLIDERS, BUTTONS, TOOLBAR
     ═══════════════════════════════════════════════════════════════ */
  function setSliderFill(input) {
    var min = parseFloat(input.min), max = parseFloat(input.max), val = parseFloat(input.value);
    var pct = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--pct', pct + '%');
  }

  function wireSliders() {
    var ss = $('speed-slider'), sv = $('speed-val');
    var fs = $('feed-slider'),  fv = $('feed-val');
    var ds = $('doc-slider'),   dv = $('doc-val');
    var dias = $('dia-slider'), diav = $('dia-val');
    var lens = $('len-slider'), lenv = $('len-val');
    var nose = $('nose-slider'), nosev = $('nose-val');

    function attach(input, valEl, prop, fmt) {
      if (!input) return;
      setSliderFill(input);
      input.addEventListener('input', function () {
        state[prop] = parseFloat(this.value);
        syncSliderLabels();
        setSliderFill(this);
        recomputeAndDraw();
      });
    }
  /* Unit toggle — display only; the cut model stays metric */
    Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (btn) {
      btn.addEventListener('click', function () {
        var u = btn.getAttribute('data-unit');
        if (!u || u === unitSys) return;
        unitSys = u;
        Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (b) {
          b.classList.toggle('active', b === btn);
        });
        syncSliderLabels();
        recomputeAndDraw();
      });
    });

    attach(ss, sv, 'speed', function (v) { return v + ' RPM'; });
    attach(fs, fv, 'feed', function (v) { return v.toFixed(2) + ' mm/rev'; });
    attach(ds, dv, 'doc', function (v) { return v.toFixed(1) + ' mm'; });
    attach(dias, diav, 'dia', function (v) { return v + ' mm'; });
    attach(lens, lenv, 'wpLength', function (v) { return v + ' mm'; });
    attach(nose, nosev, 'noseRadius', function (v) { return v.toFixed(1) + ' mm'; });
  }

  function wireButtons() {
    var startBtn = $('btn-start');
    var resetBtn = $('btn-reset');
    if (startBtn) startBtn.addEventListener('click', function () {
      if (!state.power) { flashTooltip('Power is OFF — switch on POWER first.'); return; }
      if (state.running) pauseAnim(); else startAnim();
    });
    if (resetBtn) resetBtn.addEventListener('click', resetAnim);
  }

  function wireToolbar() {
    function toggle(id, prop, onLabel, offLabel) {
      var b = $(id);
      if (!b) return;
      b.addEventListener('click', function () {
        state[prop] = !state[prop];
        b.classList.toggle('on', state[prop]);
        if (onLabel && offLabel) b.textContent = state[prop] ? onLabel : offLabel;
        if (prop === 'power' && !state.power && state.running) pauseAnim();
        drawMachine();
      });
    }
    toggle('tb-power', 'power');
    toggle('tb-coolant', 'coolant');
    toggle('tb-worklight', 'worklight');
    toggle('tb-guard', 'guard');

    var dirBtn = $('tb-direction');
    if (dirBtn) dirBtn.addEventListener('click', function () {
      state.direction *= -1;
      dirBtn.innerHTML = state.direction === 1 ? 'CW' : 'CCW';
      drawMachine();
    });

    var estop = $('btn-estop');
    if (estop) estop.addEventListener('click', function () {
      if (state.running) pauseAnim();
      state.estopShake = 1;
      flashTooltip('EMERGENCY STOP activated — spindle halted.');
      drawMachine();
    });
  }

  function flashTooltip(msg) {
    var tt = $('part-tooltip');
    if (!tt) return;
    tt.innerHTML = '<strong>' + msg + '</strong>';
    tt.style.display = 'block';
    tt.style.left = '12px';
    tt.style.top = '40px';
    setTimeout(function () { tt.style.display = 'none'; }, 1800);
  }

  /* ═══════════════════════════════════════════════════════════════
     S8  PHYSICS ENGINE (unchanged formulas)
     ═══════════════════════════════════════════════════════════════ */
  function updatePhysics() {
    var N = state.speed, f = state.feed, d = state.doc, D = state.dia;
    var mat = MATERIALS[state.matIdx];
    var op = OPERATIONS[state.opIdx];

    var V = Math.PI * D * N / 1000;
    var MRR = V * f * d * 1000;
    var Fc = mat.Ks * f * d;
    var Ff = 0.4 * Fc;
    var Fr = 0.3 * Fc;
    var P = Fc * V / (60 * 1000);
    var Ra = (f * f) / (32 * state.noseRadius) * 1000;
    var machTime;
    if (op.id === 'facing') machTime = (D / 2) / (f * N) * 60;
    else machTime = state.wpLength / (f * N) * 60;

    phys.V = V; phys.N = N; phys.f = f; phys.d = d;
    phys.Fc = Fc; phys.Ff = Ff; phys.Fr = Fr;
    phys.P = P; phys.MRR = MRR; phys.Ra = Ra; phys.time = machTime;
  }

  /* ═══════════════════════════════════════════════════════════════
     S9  READOUTS & BADGES (with warning indicators)
     ═══════════════════════════════════════════════════════════════ */
  /* ================================================================
     DISPLAY UNITS  (display only — every cut calculation stays metric)
     US turning practice: SFM, in/rev, inches, in³/min, hp, lbf, µin Ra.
     Spindle speed (RPM) and machining time (sec) are the same in both.
     ================================================================ */
  var unitSys = 'si';
  function isImp() { return unitSys === 'imp'; }
  var LU = {
    vc:    { f: 3.28084,    si: 'm/min',    imp: 'SFM',       d: 0 },
    frev:  { f: 0.0393701,  si: 'mm/rev',   imp: 'in/rev',    d: 4 },
    len:   { f: 0.0393701,  si: 'mm',       imp: 'in',        d: 3 },
    mrr:   { f: 6.10237e-5, si: 'mm\u00B3/min', imp: 'in\u00B3/min', d: 3 },
    power: { f: 1.34102,    si: 'kW',       imp: 'hp',        d: 3 },
    force: { f: 0.2248089,  si: 'N',        imp: 'lbf',       d: 1 },
    ra:    { f: 39.3701,    si: '\u00B5m Ra',  imp: '\u00B5in Ra',  d: 1 }
  };
  function lv(val, k) { return isImp() ? val * LU[k].f : val; }
  function lu(k)      { return isImp() ? LU[k].imp : LU[k].si; }
  function lfix(val, k, dSI) {
    return lv(val, k).toFixed(isImp() ? LU[k].d : (dSI == null ? LU[k].d : dSI));
  }

  function updateReadouts() {
    var mat = MATERIALS[state.matIdx];
    function setCard(id, val, decimals, warn) {
      var el = $('res-' + id);
      if (el) el.textContent = roundN(val, decimals);
      if (el && el.parentElement) el.parentElement.classList.toggle('warn', !!warn);
    }
    /* Warning thresholds stay in SI — they are machine limits, not display. */
    setCard('cutting-speed', lv(phys.V, 'vc'),   isImp() ? 0 : 2, phys.V > mat.Vrec * 1.5);
    setCard('feed-rate',     lv(phys.f, 'frev'), isImp() ? 4 : 2, false);
    setCard('doc',           lv(phys.d, 'len'),  isImp() ? 3 : 1, phys.d > 5);
    setCard('mrr',           lv(phys.MRR,'mrr'), isImp() ? 3 : 1, false);
    setCard('power',         lv(phys.P,'power'), 3, phys.P > 7.5);
    setCard('force',         lv(phys.Fc,'force'),1, phys.Fc > 8000);
    setCard('roughness',     lv(phys.Ra,'ra'),   isImp() ? 1 : 2, false);
    setCard('time',          phys.time, 2, false);      /* seconds either way */
    var caps = { 'ru-cutting-speed': lu('vc'), 'ru-feed-rate': lu('frev'),
                 'ru-doc': lu('len'), 'ru-mrr': lu('mrr'), 'ru-power': lu('power'),
                 'ru-force': lu('force'), 'ru-roughness': lu('ra') };
    Object.keys(caps).forEach(function (id) {
      var e = $(id); if (e) e.textContent = caps[id];
    });
    syncSliderLabels();
  }

  /* Single owner of the six slider captions. */
  function syncSliderLabels() {
    var set = function (id, txt) { var e = $(id); if (e) e.textContent = txt; };
    set('speed-val', state.speed + ' RPM');
    set('feed-val',  lfix(state.feed, 'frev', 2) + ' ' + lu('frev'));
    set('doc-val',   lfix(state.doc, 'len', 1) + ' ' + lu('len'));
    set('dia-val',   lfix(state.dia, 'len', 0) + ' ' + lu('len'));
    set('len-val',   lfix(state.wpLength, 'len', 0) + ' ' + lu('len'));
    set('nose-val',  lfix(state.noseRadius, 'len', 1) + ' ' + lu('len'));
  }

  function updateBadges() {
    var mat = MATERIALS[state.matIdx];
    var v = $('badge-v'); if (v) v.textContent = lfix(phys.V, 'vc', 1);
    var n = $('badge-n'); if (n) n.textContent = state.speed;
    var f = $('badge-f'); if (f) f.textContent = lfix(state.feed, 'frev', 2);
    var p = $('badge-p'); if (p) p.textContent = lfix(phys.P, 'power', 2);
    var bu = { 'bu-v': lu('vc'), 'bu-f': lu('frev'), 'bu-p': lu('power') };
    Object.keys(bu).forEach(function (id) { var e = $(id); if (e) e.textContent = bu[id]; });
    var vw = $('badge-v-wrap'); if (vw) vw.classList.toggle('warn', phys.V > mat.Vrec * 1.5);
    var pw = $('badge-p-wrap'); if (pw) pw.classList.toggle('warn', phys.P > 7.5);
  }

  /* ═══════════════════════════════════════════════════════════════
     S10  ANIMATION LOOP
     ═══════════════════════════════════════════════════════════════ */
  function setStartBtn(running) {
    var btn = $('btn-start');
    if (!btn) return;
    btn.classList.toggle('is-running', !!running);
    var lbl = btn.querySelector('.mb-label');
    if (lbl) {
      lbl.textContent = running ? 'PAUSE MACHINING' : 'START MACHINING';
    } else {
      btn.innerHTML = running
        ? '<span class="mb-led"></span><span class="mb-label">PAUSE MACHINING</span>'
        : '<span class="mb-led"></span><span class="mb-label">START MACHINING</span>';
    }
  }

  function startAnim() {
    state.running = true;
    state.lastTS = performance.now();
    setStartBtn(true);
    animate();
  }
  function pauseAnim() {
    state.running = false;
    if (state.animFrame) cancelAnimationFrame(state.animFrame);
    state.animFrame = null;
    setStartBtn(false);
  }
  function resetAnim() {
    pauseAnim();
    state.time = 0;
    state.toolPos = 0;
    state.chuckAngle = 0;
    state.chips = [];
    state.sparks = [];
    state.estopShake = 0;
    drawMachine();
    drawGraph();
  }

  function animate() {
    if (!state.running) return;
    var now = performance.now();
    var dt = (now - state.lastTS) / 1000;
    state.lastTS = now;
    dt = Math.min(dt, 0.05);

    state.time += dt;

    var rps = state.speed / 60;
    state.chuckAngle = (state.chuckAngle + state.direction * rps * 360 * dt) % 360;

    var travelPerSec = (state.feed * state.speed / 60) / Math.max(state.wpLength, 10);
    state.toolPos += travelPerSec * dt * 0.6;
    if (state.toolPos > 1) state.toolPos = 0;

    // Generate curled chips — anchored to tool tip, modest velocities
    if (Math.random() < 0.5) {
      var mat = MATERIALS[state.matIdx];
      state.chips.push({
        x: 0, y: 0,
        vx: randFloat(-1.4, -0.4) * state.direction,
        vy: randFloat(-1.6, -0.4),
        life: 1,
        size: randFloat(3, 5.5),
        curl: randFloat(0.7, 1.3),
        rot: randFloat(0, Math.PI * 2),
        rotV: randFloat(-0.25, 0.25),
        color: mat.chip
      });
    }

    // Sparks if overspeed
    var matRef = MATERIALS[state.matIdx];
    if (phys.V > matRef.Vrec * 1.5 && Math.random() < 0.6) {
      state.sparks.push({
        x: 0, y: 0,
        vx: randFloat(-2, 2),
        vy: randFloat(-4, -1.5),
        life: 1,
        size: randFloat(1, 2)
      });
    }

    for (var i = state.chips.length - 1; i >= 0; i--) {
      var c = state.chips[i];
      c.x += c.vx; c.y += c.vy;
      c.vy += 0.22;            // stronger gravity so chips fall quickly
      c.rot += c.rotV;
      c.life -= dt * 1.8;       // fade faster
      if (c.life <= 0) state.chips.splice(i, 1);
    }
    for (var k = state.sparks.length - 1; k >= 0; k--) {
      var s = state.sparks[k];
      s.x += s.vx; s.y += s.vy;
      s.vy += 0.25;
      s.life -= dt * 2;
      if (s.life <= 0) state.sparks.splice(k, 1);
    }

    if (state.estopShake > 0) state.estopShake = Math.max(0, state.estopShake - dt * 2);

    drawMachine();
    drawGraph();

    state.animFrame = requestAnimationFrame(animate);
  }

  /* ═══════════════════════════════════════════════════════════════
     S11  REALISTIC MACHINE CANVAS DRAWING (600×520)
     ═══════════════════════════════════════════════════════════════ */
  function drawMachine() {
    if (!mcCtx) return;
    var ctx = mcCtx;
    var W = 600, H = 380;   /* logical space; backing is DPR-scaled */

    state.hotspots = [];

    ctx.clearRect(0, 0, W, H);

    // Background gradient (shop floor ambience)
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#10141a');
    bgGrad.addColorStop(1, '#06080c');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle grid floor
    ctx.strokeStyle = 'rgba(40,50,70,0.18)';
    ctx.lineWidth = 0.5;
    for (var gx = 0; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, H - 60); ctx.lineTo(gx, H); ctx.stroke();
    }

    // Title strip
    ctx.fillStyle = TEXT;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Centre Lathe — ' + OPERATIONS[state.opIdx].name + '  ', W / 2 - 30, 18);
    ctx.fillStyle = MATERIALS[state.matIdx].color;
    ctx.fillText('• ' + MATERIALS[state.matIdx].name, W / 2 + 90, 18);

    var shakeX = state.estopShake > 0 ? Math.sin(performance.now() / 30) * state.estopShake * 4 : 0;
    ctx.save();
    ctx.translate(shakeX, 0);

    // Worklight glow
    if (state.power && state.worklight) {
      var lightX = 200, lightY = 30;
      var lg = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, 250);
      lg.addColorStop(0, 'rgba(255,244,184,0.20)');
      lg.addColorStop(0.5, 'rgba(255,244,184,0.06)');
      lg.addColorStop(1, 'rgba(255,244,184,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(0, 0, W, H);
    }

    drawLatheMachine(ctx, 30, 35, W - 60, 290);

    ctx.restore();

    // Status info strip at bottom
    drawStatusBar(ctx, W, H);

    // Highlight clicked part
    if (state.highlightedPart) {
      drawHighlight(ctx, state.highlightedPart);
    }
  }

  function addHotspot(id, x, y, w, h) {
    state.hotspots.push({ id: id, x: x, y: y, w: w, h: h });
  }

  function drawLatheMachine(ctx, mx, my, mw, mh) {
    var op = OPERATIONS[state.opIdx];
    var mat = MATERIALS[state.matIdx];

    // Layout (compact, realistic proportions)
    var spindleY = my + 130;
    var bedY = spindleY + 55;       // bed top just below workpiece
    var bedH = 50;
    var bedBottom = bedY + bedH;
    var panY = bedBottom + 4;
    var panH = 20;
    var legsY = panY + panH;
    var legsH = my + mh - legsY + 25;

    // ── FLOOR SHADOW ──
    var shadowY = legsY + legsH;
    var shadowGrad = ctx.createRadialGradient(mx + mw / 2, shadowY, 0, mx + mw / 2, shadowY, mw * 0.55);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.55)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(mx + mw / 2, shadowY + 4, mw * 0.5, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── LEGS (cast iron, painted green) ──
    drawPaintedBox(ctx, mx + 40, legsY - 10, 70, legsH, true);
    drawPaintedBox(ctx, mx + mw - 110, legsY - 10, 70, legsH, true);
    // Cross brace at the bottom
    drawPaintedBox(ctx, mx + 80, legsY + legsH - 22, mw - 160, 12, false);
    // Hazard markings on cross brace
    drawHazardStripe(ctx, mx + 84, legsY + legsH - 20, mw - 168, 8);

    // ── CHIP PAN (gunmetal) ──
    ctx.fillStyle = COL.pan;
    ctx.beginPath();
    ctx.moveTo(mx + 20, panY);
    ctx.lineTo(mx + mw - 20, panY);
    ctx.lineTo(mx + mw - 36, panY + panH);
    ctx.lineTo(mx + 36, panY + panH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.panEdge;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(mx + 26, panY + 2);
    ctx.lineTo(mx + mw - 26, panY + 2);
    ctx.stroke();
    addHotspot(22, mx + 20, panY, mw - 40, panH);

    // ── BED (green casting with machined gray top) ──
    // Front (green painted) panel
    var bedGrad = ctx.createLinearGradient(0, bedY, 0, bedY + bedH);
    bedGrad.addColorStop(0, COL.paintMid);
    bedGrad.addColorStop(0.5, COL.paintLight);
    bedGrad.addColorStop(1, COL.paintDark);
    ctx.fillStyle = bedGrad;
    ctx.fillRect(mx, bedY + 12, mw, bedH - 12);
    // Top machined surface
    var bedTopGrad = ctx.createLinearGradient(0, bedY, 0, bedY + 14);
    bedTopGrad.addColorStop(0, COL.bedTop);
    bedTopGrad.addColorStop(1, '#2a2f36');
    ctx.fillStyle = bedTopGrad;
    ctx.fillRect(mx, bedY, mw, 14);
    // Top edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(mx, bedY); ctx.lineTo(mx + mw, bedY); ctx.stroke();
    // Outline
    ctx.strokeStyle = COL.castIron;
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, bedY, mw, bedH);
    // V-ways (two precision ridges)
    drawVWay(ctx, mx + 8, bedY + 2, mw - 16);
    drawVWay(ctx, mx + 8, bedY + 9, mw - 16);
    // Bolts on bed front
    for (var bb = mx + 30; bb < mx + mw; bb += 60) drawBolt(ctx, bb, bedY + 40, 4);
    addHotspot(1, mx, bedY, mw, bedH);

    // ── LEAD SCREW (brass) — front of bed
    var lsY = bedY + bedH * 0.55;
    drawLeadScrew(ctx, mx + 90, lsY, mx + mw - 50);
    addHotspot(16, mx + 90, lsY - 5, mw - 140, 10);

    // ── FEED ROD (steel) — front of bed below lead screw
    var frY = bedY + bedH * 0.82;
    ctx.lineWidth = 5;
    var frGrad = ctx.createLinearGradient(0, frY - 3, 0, frY + 3);
    frGrad.addColorStop(0, COL.steel);
    frGrad.addColorStop(0.5, COL.steelLight);
    frGrad.addColorStop(1, COL.steelDark);
    ctx.strokeStyle = frGrad;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx + 90, frY); ctx.lineTo(mx + mw - 50, frY); ctx.stroke();
    ctx.lineCap = 'butt';
    addHotspot(17, mx + 90, frY - 4, mw - 140, 8);

    // ── HEADSTOCK ──
    var hsX = mx, hsY = my + 30, hsW = 130, hsH = bedY - hsY + 10;
    drawHeadstock(ctx, hsX, hsY, hsW, hsH);
    addHotspot(2, hsX, hsY, hsW, hsH);

    // ── SPINDLE (bronze nose) ──
    drawSpindleNose(ctx, hsX + hsW - 8, spindleY, 30, 14);
    addHotspot(3, hsX + hsW - 8, spindleY - 7, 30, 14);

    // ── CHUCK (side view: horizontal cylinder) ──
    var chuckW = 34;        // axial length of chuck in side view
    var chuckR = 44;        // chuck radius (vertical extent in side view)
    var chuckCX = hsX + hsW + 12 + chuckW / 2;
    drawChuck(ctx, chuckCX, spindleY, chuckR, chuckW, state.chuckAngle);
    addHotspot(4, chuckCX - chuckW / 2, spindleY - chuckR, chuckW, chuckR * 2);

    // ── WORKPIECE (extends out of chuck's right face) ──
    var wpStartX = chuckCX + chuckW / 2 - 2;
    var wpEndX = mx + mw - 130;
    var wpR = Math.min(state.dia / 200 * 48 + 14, 44);
    drawWorkpiece(ctx, wpStartX, spindleY, wpEndX - wpStartX, wpR, op, mat);

    // ── TAILSTOCK ──
    var tsX = mx + mw - 95;
    var tsY = my + 55;
    var tsW = 95;
    var tsH = bedY - tsY + 10;
    drawTailstock(ctx, tsX, tsY, tsW, tsH, spindleY);
    addHotspot(7, tsX, tsY, tsW, tsH);
    addHotspot(8, tsX - 38, spindleY - 7, 42, 14);
    addHotspot(9, tsX - 48, spindleY - 6, 14, 12);

    // ── CARRIAGE ASSEMBLY ── (keeps clear of the chuck even at toolPos = 0)
    var carrW = 72;
    var carrXMin = chuckCX + chuckW / 2 + 18;
    var carrXMax = tsX - carrW - 10;
    var carrX = carrXMin + state.toolPos * (carrXMax - carrXMin);
    drawCarriage(ctx, carrX, bedY, carrW, bedH, op, spindleY, wpR, bedBottom);

    // ── SAFETY GUARD (if on) ──
    if (state.guard) {
      drawSafetyGuard(ctx, chuckCX, spindleY, wpEndX);
    }

    // ── COOLANT NOZZLE & STREAM (if running and coolant on) ──
    if (state.coolant && state.power) {
      drawCoolantNozzle(ctx, carrX + carrW / 2, spindleY - wpR - 50, spindleY - wpR);
    }
    addHotspot(24, carrX + carrW / 2 - 8, spindleY - wpR - 55, 16, 30);

    // ── CHIP PARTICLES (emit at cutting point: tool tip touches workpiece) ──
    var cutPointX = carrX + carrW / 2;
    var cutPointY = spindleY;
    if (state.chips.length > 0) {
      state.chips.forEach(function (chip) {
        drawCurledChip(ctx, cutPointX + chip.x, cutPointY + chip.y, chip);
      });
    }

    // ── SPARKS (overspeed warning) ──
    if (state.sparks.length > 0) {
      state.sparks.forEach(function (sp) {
        ctx.fillStyle = 'rgba(255,210,120,' + sp.life + ')';
        ctx.shadowColor = '#ffd66b';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(cutPointX + sp.x, cutPointY + sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }

    // ── PARTS LABELS (subtle, numbered) ──
    var carrY = bedY;
    var carrH = bedH;
    drawPartLabels(ctx, mx, my, mw, mh, hsX, hsW, chuckCX, spindleY, wpStartX, wpEndX, wpR, tsX, tsY, tsW, tsH, carrX, carrY, carrW, carrH, bedY, lsY, frY);
  }

  /* ── DRAWING PRIMITIVES ── */
  function drawPaintedBox(ctx, x, y, w, h, vertical) {
    var grad = vertical
      ? ctx.createLinearGradient(x, 0, x + w, 0)
      : ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, COL.paintDark);
    grad.addColorStop(0.45, COL.paintMid);
    grad.addColorStop(0.6, COL.paintLight);
    grad.addColorStop(1, COL.paintDark);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = COL.paintDark;
    ctx.lineWidth = 1;
    ctx.stroke();
    // Highlight stripe
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(x + 3, y + 2, w - 6, 2);
  }

  function drawHazardStripe(ctx, x, y, w, h) {
    var stripe = 8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (var i = -h; i < w + h; i += stripe * 2) {
      ctx.fillStyle = COL.hazardY;
      ctx.beginPath();
      ctx.moveTo(x + i, y); ctx.lineTo(x + i + stripe, y);
      ctx.lineTo(x + i + stripe + h, y + h); ctx.lineTo(x + i + h, y + h);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = COL.hazardB;
      ctx.beginPath();
      ctx.moveTo(x + i + stripe, y); ctx.lineTo(x + i + stripe * 2, y);
      ctx.lineTo(x + i + stripe * 2 + h, y + h); ctx.lineTo(x + i + stripe + h, y + h);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawBolt(ctx, x, y, r) {
    ctx.fillStyle = COL.boltGray;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COL.boltShine;
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Hex slot
    ctx.strokeStyle = '#0a0c10';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y);
    ctx.stroke();
  }

  function drawVWay(ctx, x, y, w) {
    var grad = ctx.createLinearGradient(0, y, 0, y + 5);
    grad.addColorStop(0, '#8a9098');
    grad.addColorStop(0.5, '#5a626c');
    grad.addColorStop(1, '#2a2e34');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
  }

  function drawLeadScrew(ctx, x1, y, x2) {
    var grad = ctx.createLinearGradient(0, y - 4, 0, y + 4);
    grad.addColorStop(0, lightenColor(COL.brass, 30));
    grad.addColorStop(0.5, COL.brass);
    grad.addColorStop(1, COL.brassDark);
    ctx.lineWidth = 8;
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
    ctx.lineCap = 'butt';
    // Acme thread grooves
    ctx.strokeStyle = COL.brassDark;
    ctx.lineWidth = 1.2;
    for (var xx = x1 + 4; xx < x2 - 4; xx += 7) {
      ctx.beginPath();
      ctx.moveTo(xx, y - 4); ctx.lineTo(xx + 4, y + 4);
      ctx.stroke();
    }
    // Top highlight
    ctx.strokeStyle = 'rgba(255,235,180,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y - 3); ctx.lineTo(x2, y - 3); ctx.stroke();
  }

  function drawHeadstock(ctx, x, y, w, h) {
    // Main body (painted)
    var grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, COL.paintDark);
    grad.addColorStop(0.4, COL.paintMid);
    grad.addColorStop(0.55, COL.paintLight);
    grad.addColorStop(1, COL.paintDark);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = '#0e2818';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top access panel
    ctx.fillStyle = darkenColor(COL.paintDark, 10);
    roundRect(ctx, x + 8, y + 6, w - 16, 12, 2);
    ctx.fill();
    ctx.strokeStyle = '#0a1a10';
    ctx.lineWidth = 0.5;
    ctx.stroke();
    drawBolt(ctx, x + 14, y + 12, 2.5);
    drawBolt(ctx, x + w - 14, y + 12, 2.5);

    // Bolts around frame
    drawBolt(ctx, x + 8, y + h - 10, 3);
    drawBolt(ctx, x + w - 8, y + h - 10, 3);
    drawBolt(ctx, x + 8, y + h / 2, 3);
    drawBolt(ctx, x + w - 8, y + h / 2, 3);

    // Speed selector dial (large, clearly visible)
    var dialX = x + 35, dialY = y + 50;
    ctx.fillStyle = '#15181e';
    ctx.beginPath(); ctx.arc(dialX, dialY, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COL.steelLight;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Tick marks
    ctx.strokeStyle = '#aab4c0';
    ctx.lineWidth = 1;
    for (var t = 0; t < 12; t++) {
      var ta = (t / 12) * Math.PI * 1.6 - Math.PI * 0.8;
      ctx.beginPath();
      ctx.moveTo(dialX + Math.cos(ta) * 18, dialY + Math.sin(ta) * 18);
      ctx.lineTo(dialX + Math.cos(ta) * 21, dialY + Math.sin(ta) * 21);
      ctx.stroke();
    }
    // Pointer
    var dialA = (state.speed / 2000) * Math.PI * 1.6 - Math.PI * 0.8;
    ctx.strokeStyle = COL.handwheelR;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(dialX, dialY);
    ctx.lineTo(dialX + Math.cos(dialA) * 16, dialY + Math.sin(dialA) * 16);
    ctx.stroke();
    // Hub
    ctx.fillStyle = COL.steelLight;
    ctx.beginPath(); ctx.arc(dialX, dialY, 3, 0, Math.PI * 2); ctx.fill();
    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RPM', dialX, dialY + 32);

    // Gear housing (lower)
    var ghX = x + 70, ghY = y + 35;
    ctx.fillStyle = '#1d2129';
    roundRect(ctx, ghX, ghY, 52, 50, 3);
    ctx.fill();
    ctx.strokeStyle = '#0a0c10';
    ctx.stroke();
    // Gear visible
    drawGear(ctx, ghX + 18, ghY + 25, 12, 8, state.power && state.running ? state.chuckAngle : 0);
    drawGear(ctx, ghX + 36, ghY + 20, 8, 6, state.power && state.running ? -state.chuckAngle * 1.5 : 0);

    // Power indicator LED
    var ledX = x + w - 15, ledY = y + 22;
    ctx.fillStyle = state.power ? GREEN : '#2a2f36';
    ctx.beginPath(); ctx.arc(ledX, ledY, 4, 0, Math.PI * 2); ctx.fill();
    if (state.power) {
      ctx.shadowColor = GREEN; ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.strokeStyle = '#404754';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Brand-style nameplate
    ctx.fillStyle = '#0a0d12';
    roundRect(ctx, x + 14, y + h - 30, 80, 14, 2);
    ctx.fill();
    ctx.strokeStyle = COL.brass;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.fillStyle = COL.brass;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MECH-LATHE 4000', x + 54, y + h - 20);
  }

  function drawGear(ctx, cx, cy, r, teeth, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle * Math.PI / 180);
    ctx.fillStyle = COL.steel;
    ctx.beginPath();
    for (var i = 0; i < teeth; i++) {
      var a = (i / teeth) * Math.PI * 2;
      var a2 = ((i + 0.5) / teeth) * Math.PI * 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.lineTo(Math.cos(a2) * (r * 0.78), Math.sin(a2) * (r * 0.78));
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.steelDark;
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = '#1a1e26';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSpindleNose(ctx, x, y, w, h) {
    var grad = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2);
    grad.addColorStop(0, lightenColor(COL.bronze, 30));
    grad.addColorStop(0.5, COL.bronze);
    grad.addColorStop(1, COL.brassDark);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y - h / 2, w, h);
    ctx.strokeStyle = COL.brassDark;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y - h / 2, w, h);
    // Highlight
    ctx.fillStyle = 'rgba(255,240,200,0.5)';
    ctx.fillRect(x, y - h / 2 + 1, w, 2);
  }

  // Side-view chuck: a short horizontal cylinder whose visible surface
  // scrolls based on `angle` (degrees) so its rotation is synchronised
  // with the workpiece spinning beside it.
  function drawChuck(ctx, cx, cy, r, w, angle) {
    ctx.save();
    ctx.translate(cx, cy);

    var halfW = w / 2;

    // Cylindrical body shading (lighter at the axis, darker at top/bottom edges)
    var bodyGrad = ctx.createLinearGradient(0, -r, 0, r);
    bodyGrad.addColorStop(0, darkenColor(COL.chuckBody, 35));
    bodyGrad.addColorStop(0.35, COL.chuckBody);
    bodyGrad.addColorStop(0.5, lightenColor(COL.chuckBody, 28));
    bodyGrad.addColorStop(0.65, COL.chuckBody);
    bodyGrad.addColorStop(1, darkenColor(COL.chuckBody, 35));
    ctx.fillStyle = bodyGrad;

    // Main body with rounded corners (cylinder profile)
    var rad = 5;
    ctx.beginPath();
    ctx.moveTo(-halfW + rad, -r);
    ctx.lineTo(halfW - rad, -r);
    ctx.quadraticCurveTo(halfW, -r, halfW, -r + rad);
    ctx.lineTo(halfW, r - rad);
    ctx.quadraticCurveTo(halfW, r, halfW - rad, r);
    ctx.lineTo(-halfW + rad, r);
    ctx.quadraticCurveTo(-halfW, r, -halfW, r - rad);
    ctx.lineTo(-halfW, -r + rad);
    ctx.quadraticCurveTo(-halfW, -r, -halfW + rad, -r);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darkenColor(COL.chuckBody, 45);
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Front face plate (right side) where the jaws would mount —
    // shown as a darker ring on the right edge of the cylinder
    var faceX = halfW - 7;
    ctx.fillStyle = COL.chuckRing;
    ctx.beginPath();
    ctx.moveTo(faceX, -r + 2);
    ctx.lineTo(halfW - 1, -r + 2);
    ctx.lineTo(halfW - 1, r - 2);
    ctx.lineTo(faceX, r - 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = darkenColor(COL.chuckRing, 25);
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Three jaw tracks visible on the front face (side view shows two of
    // the three on the visible silhouette: one near the top, one near the
    // bottom). Their radial position moves slightly with rotation so the
    // viewer can perceive the chuck spinning.
    var a = angle * Math.PI / 180;
    for (var j = 0; j < 3; j++) {
      var ja = a + j * (Math.PI * 2 / 3);
      var jy = Math.sin(ja) * (r - 4);
      var jVisibleX = Math.cos(ja);  // > 0 means jaw is on the visible right face
      if (jVisibleX < -0.2) continue; // hide jaws on the back side
      var alpha = clamp(0.4 + jVisibleX * 0.6, 0.3, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      // Jaw block
      var jawGrad = ctx.createLinearGradient(faceX, jy - 5, halfW, jy - 5);
      jawGrad.addColorStop(0, COL.steelDark);
      jawGrad.addColorStop(0.5, COL.chuckJaw);
      jawGrad.addColorStop(1, COL.steelLight);
      ctx.fillStyle = jawGrad;
      ctx.fillRect(faceX - 1, jy - 5, 8, 10);
      ctx.strokeStyle = COL.steelLight;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(faceX - 1, jy - 5, 8, 10);
      // Serrations
      ctx.strokeStyle = '#1a1d22';
      ctx.lineWidth = 0.4;
      for (var s = 0; s < 3; s++) {
        ctx.beginPath();
        ctx.moveTo(faceX, jy - 4 + s * 3);
        ctx.lineTo(faceX + 6, jy - 4 + s * 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Scrolling surface marks on the cylindrical body — these create the
    // illusion of rotation, perfectly synced with the workpiece.
    var nMarks = 18;
    ctx.lineCap = 'round';
    for (var m = 0; m < nMarks; m++) {
      var ma = a + (m / nMarks) * Math.PI * 2;
      var yPos = Math.sin(ma) * (r - 1);
      var cosV = Math.cos(ma);
      if (cosV < 0.05) continue;            // only show marks on visible (front) half
      var depth = cosV;                      // 1 at axis, 0 near the silhouette
      var alpha = depth * 0.55;
      // Surface lines are oriented along the rotation axis (horizontal in side view)
      ctx.strokeStyle = 'rgba(15,20,28,' + alpha.toFixed(2) + ')';
      ctx.lineWidth = 0.5 + depth * 0.4;
      ctx.beginPath();
      ctx.moveTo(-halfW + 2, yPos);
      ctx.lineTo(faceX - 1, yPos);
      ctx.stroke();
      // Highlight specular dot at the very top of the rotation
      if (depth > 0.85 && Math.abs(yPos) < r * 0.15) {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(-halfW + 3, yPos - 0.4, w - 10, 0.9);
      }
    }

    // Bolts on the back face (left side, attaching chuck to spindle nose)
    for (var bb = 0; bb < 4; bb++) {
      var byb = -r + 8 + bb * (r * 2 - 16) / 3;
      drawBolt(ctx, -halfW + 4, byb, 2.2);
    }

    // Bright top edge highlight (catches the worklight)
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-halfW + rad, -r + 0.5);
    ctx.lineTo(halfW - rad, -r + 0.5);
    ctx.stroke();

    // Soft motion blur band when spindle is running fast
    if (state.running && state.speed > 800) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = COL.chuckBody;
      ctx.fillRect(-halfW - 2, -r - 2, w + 4, r * 2 + 4);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  function drawWorkpiece(ctx, startX, centerY, length, radius, op, mat) {
    if (length < 2) return;

    // Material gradient (cylinder shading)
    function matGrad() {
      var g = ctx.createLinearGradient(0, centerY - radius, 0, centerY + radius);
      g.addColorStop(0, darkenColor(mat.color, 25));
      g.addColorStop(0.35, mat.color);
      g.addColorStop(0.5, mat.hl);
      g.addColorStop(0.65, mat.color);
      g.addColorStop(1, darkenColor(mat.color, 35));
      return g;
    }

    if (op.id === 'turning') {
      ctx.fillStyle = matGrad();
      ctx.fillRect(startX, centerY - radius, length, radius * 2);
      // Machined region (slightly reduced + brighter)
      if (state.running || state.toolPos > 0) {
        var cutLen = state.toolPos * length;
        var newR = radius - clamp(state.doc / state.dia * radius * 2, 0, radius * 0.6);
        ctx.fillStyle = mat.color;
        ctx.fillRect(startX, centerY - newR, cutLen, newR * 2);
        // Polished band highlight
        ctx.fillStyle = hexToRGBA(mat.hl, 0.6);
        ctx.fillRect(startX, centerY - 2, cutLen, 3);
      }
      // Surface texture lines (turned finish marks)
      ctx.strokeStyle = hexToRGBA(darkenColor(mat.color, 25), 0.5);
      ctx.lineWidth = 0.4;
      for (var tx = startX + 5; tx < startX + length; tx += 4) {
        ctx.beginPath();
        ctx.moveTo(tx, centerY - radius + 2);
        ctx.lineTo(tx, centerY + radius - 2);
        ctx.stroke();
      }
    } else if (op.id === 'facing') {
      ctx.fillStyle = matGrad();
      ctx.fillRect(startX, centerY - radius, length, radius * 2);
      // End face polish
      var faceDepth = clamp(state.toolPos * 14, 0, length);
      if (faceDepth > 0) {
        ctx.fillStyle = mat.hl;
        ctx.fillRect(startX + length - faceDepth, centerY - radius, faceDepth, radius * 2);
      }
      // Concentric face rings
      ctx.strokeStyle = hexToRGBA(darkenColor(mat.color, 20), 0.6);
      ctx.lineWidth = 0.5;
      for (var rg = 2; rg < radius - 2; rg += 3) {
        ctx.beginPath();
        ctx.moveTo(startX + length - faceDepth + 1, centerY - rg);
        ctx.lineTo(startX + length, centerY - rg);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(startX + length - faceDepth + 1, centerY + rg);
        ctx.lineTo(startX + length, centerY + rg);
        ctx.stroke();
      }
    } else if (op.id === 'boring') {
      ctx.fillStyle = matGrad();
      ctx.fillRect(startX, centerY - radius, length, radius * 2);
      var boreR = clamp(radius * 0.35 + state.toolPos * radius * 0.25, 5, radius * 0.7);
      // Inner bore (dark hole)
      var boreGrad = ctx.createLinearGradient(0, centerY - boreR, 0, centerY + boreR);
      boreGrad.addColorStop(0, '#000');
      boreGrad.addColorStop(0.5, '#1a1d22');
      boreGrad.addColorStop(1, '#000');
      ctx.fillStyle = boreGrad;
      ctx.fillRect(startX, centerY - boreR, length * 0.85, boreR * 2);
      // Bore edge highlight
      ctx.strokeStyle = mat.hl;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(startX, centerY - boreR);
      ctx.lineTo(startX + length * 0.85, centerY - boreR);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX, centerY + boreR);
      ctx.lineTo(startX + length * 0.85, centerY + boreR);
      ctx.stroke();
    } else if (op.id === 'threading') {
      ctx.fillStyle = matGrad();
      ctx.fillRect(startX, centerY - radius, length, radius * 2);
      var threadLen = state.toolPos * length;
      var pitch = 4;
      // Thread profile drawn as V grooves
      for (var tt = startX; tt < startX + threadLen; tt += pitch) {
        // Groove shadow
        ctx.fillStyle = hexToRGBA('#000', 0.5);
        ctx.beginPath();
        ctx.moveTo(tt, centerY - radius);
        ctx.lineTo(tt + pitch * 0.5, centerY - radius + 2);
        ctx.lineTo(tt + pitch, centerY - radius);
        ctx.lineTo(tt + pitch, centerY - radius + 4);
        ctx.lineTo(tt + pitch * 0.5, centerY - radius + 6);
        ctx.lineTo(tt, centerY - radius + 4);
        ctx.closePath();
        ctx.fill();
        // bottom groove (mirror)
        ctx.beginPath();
        ctx.moveTo(tt, centerY + radius);
        ctx.lineTo(tt + pitch * 0.5, centerY + radius - 2);
        ctx.lineTo(tt + pitch, centerY + radius);
        ctx.lineTo(tt + pitch, centerY + radius - 4);
        ctx.lineTo(tt + pitch * 0.5, centerY + radius - 6);
        ctx.lineTo(tt, centerY + radius - 4);
        ctx.closePath();
        ctx.fill();
      }
      // Thread crest highlights
      ctx.strokeStyle = mat.hl;
      ctx.lineWidth = 0.8;
      for (var tc = startX; tc < startX + threadLen; tc += pitch) {
        ctx.beginPath();
        ctx.moveTo(tc, centerY - radius + 1);
        ctx.lineTo(tc + 1, centerY + radius - 1);
        ctx.stroke();
      }
    } else if (op.id === 'taper') {
      var taperRatio = state.toolPos * 0.45;
      ctx.fillStyle = matGrad();
      ctx.beginPath();
      ctx.moveTo(startX, centerY - radius);
      ctx.lineTo(startX + length, centerY - radius * (1 - taperRatio));
      ctx.lineTo(startX + length, centerY + radius * (1 - taperRatio));
      ctx.lineTo(startX, centerY + radius);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darkenColor(mat.color, 25);
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Highlight
      ctx.strokeStyle = mat.hl;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX, centerY - 1);
      ctx.lineTo(startX + length, centerY - 1);
      ctx.stroke();
    } else if (op.id === 'knurling') {
      ctx.fillStyle = matGrad();
      ctx.fillRect(startX, centerY - radius, length, radius * 2);
      var knurlLen = state.toolPos * length;
      ctx.strokeStyle = darkenColor(mat.color, 35);
      ctx.lineWidth = 0.6;
      var kp = 5;
      for (var kx = startX; kx < startX + knurlLen; kx += kp) {
        ctx.beginPath();
        ctx.moveTo(kx, centerY - radius);
        ctx.lineTo(kx + kp * 2, centerY + radius);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(kx + kp * 2, centerY - radius);
        ctx.lineTo(kx, centerY + radius);
        ctx.stroke();
      }
    }

    // Rotation indicator when running
    if (state.running && state.power) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.strokeStyle = state.direction === 1 ? '#90e0ef' : '#ffb4a2';
      ctx.lineWidth = 1;
      var midX = startX + length / 2;
      var rotA = state.chuckAngle * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(midX, centerY, radius + 7, rotA, rotA + Math.PI * 0.35);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(midX, centerY, radius + 7, rotA + Math.PI, rotA + Math.PI * 1.35);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawTailstock(ctx, x, y, w, h, spindleY) {
    // Body
    var grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, COL.paintDark);
    grad.addColorStop(0.5, COL.paintMid);
    grad.addColorStop(1, COL.paintLight);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = '#0e2818';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bolts
    drawBolt(ctx, x + 8, y + 10, 3);
    drawBolt(ctx, x + w - 8, y + 10, 3);
    drawBolt(ctx, x + 8, y + h - 10, 3);
    drawBolt(ctx, x + w - 8, y + h - 10, 3);

    // Quill (chrome cylinder)
    var qGrad = ctx.createLinearGradient(0, spindleY - 7, 0, spindleY + 7);
    qGrad.addColorStop(0, COL.steelDark);
    qGrad.addColorStop(0.4, COL.steel);
    qGrad.addColorStop(0.55, COL.steelLight);
    qGrad.addColorStop(1, COL.steelDark);
    ctx.fillStyle = qGrad;
    ctx.fillRect(x - 38, spindleY - 7, 42, 14);
    ctx.strokeStyle = COL.steelLight;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x - 38, spindleY - 7, 42, 14);
    // Calibration marks on quill
    ctx.strokeStyle = '#1a1d22';
    ctx.lineWidth = 0.5;
    for (var qm = 0; qm < 8; qm++) {
      ctx.beginPath();
      ctx.moveTo(x - 36 + qm * 5, spindleY - 6);
      ctx.lineTo(x - 36 + qm * 5, spindleY - 3);
      ctx.stroke();
    }

    // Dead center (60° conical chrome point)
    var ccx = x - 38, ccy = spindleY;
    var cGrad = ctx.createLinearGradient(ccx - 14, ccy - 6, ccx - 14, ccy + 6);
    cGrad.addColorStop(0, COL.steelLight);
    cGrad.addColorStop(0.5, COL.chrome);
    cGrad.addColorStop(1, COL.steelDark);
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.moveTo(ccx, ccy - 6);
    ctx.lineTo(ccx - 14, ccy);
    ctx.lineTo(ccx, ccy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Tailstock handwheel (large, black with red center)
    drawHandwheel(ctx, x + w - 18, y + h - 40, 16, true);

    // Lock lever
    ctx.strokeStyle = COL.handwheelR;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 15, y + h - 18);
    ctx.lineTo(x + 30, y + h - 32);
    ctx.stroke();
    ctx.fillStyle = COL.handwheelR;
    ctx.beginPath();
    ctx.arc(x + 32, y + h - 34, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkenColor(COL.handwheelR, 30);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Tailstock label panel
    ctx.fillStyle = '#0a0d12';
    ctx.fillRect(x + 8, y + 35, w - 16, 10);
    ctx.fillStyle = COL.brass;
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TAILSTOCK', x + w / 2, y + 42);
  }

  function drawHandwheel(ctx, cx, cy, r, withHandle) {
    // Outer ring
    var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
    grad.addColorStop(0, '#3a4048');
    grad.addColorStop(0.6, COL.handwheel);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a626c';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Spokes
    ctx.strokeStyle = '#0a0c10';
    ctx.lineWidth = 2;
    for (var sp = 0; sp < 4; sp++) {
      var spa = sp * Math.PI / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(spa) * 3, cy + Math.sin(spa) * 3);
      ctx.lineTo(cx + Math.cos(spa) * (r - 2), cy + Math.sin(spa) * (r - 2));
      ctx.stroke();
    }
    // Red center cap
    ctx.fillStyle = COL.handwheelR;
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a0a0a';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    // Handle nub
    if (withHandle) {
      ctx.fillStyle = COL.chrome;
      ctx.beginPath();
      ctx.arc(cx + r - 2, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }

  function drawCarriage(ctx, x, bedTopY, w, bedH, op, spindleY, wpR, bedBottom) {
    // Compact carriage stack with tall tool shank that visibly reaches the workpiece.
    var saddleTop = bedTopY - 10;
    var saddleBot = bedTopY + 4;
    var crossSlideTop = saddleTop - 6;         // 6 tall
    var compoundTop = crossSlideTop - 6;        // 6 tall
    var toolPostTop = compoundTop - 10;         // 10 tall tool post (top sits at workpiece outer bottom)
    var toolPostBot = compoundTop;
    // Tool tip at workpiece centerline so it visibly engages the workpiece in side view
    var toolTipTarget = spindleY;

    // ── APRON (front face of bed) — distinct darker green panel
    var apronH = bedBottom - bedTopY - 2;
    var apronY = bedTopY + 9;
    var apronGrad = ctx.createLinearGradient(0, apronY, 0, apronY + apronH);
    apronGrad.addColorStop(0, '#0e2818');
    apronGrad.addColorStop(0.5, '#1e4a2d');
    apronGrad.addColorStop(1, '#0a1e12');
    ctx.fillStyle = apronGrad;
    roundRect(ctx, x - 6, apronY, w + 12, apronH, 3);
    ctx.fill();
    ctx.strokeStyle = '#0a1a10';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Inner inset (raised panel look)
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(x - 3, apronY + 3, w + 6, apronH - 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - 3, apronY + 3, w + 6, apronH - 6);
    state.hotspots.push({ id: 15, x: x - 6, y: apronY, w: w + 12, h: apronH });

    // Apron bolts
    drawBolt(ctx, x + 2, apronY + 4, 2.2);
    drawBolt(ctx, x + w - 2, apronY + 4, 2.2);
    drawBolt(ctx, x + 2, apronY + apronH - 4, 2.2);
    drawBolt(ctx, x + w - 2, apronY + apronH - 4, 2.2);

    // Apron handwheel (manual carriage feed)
    drawHandwheel(ctx, x + w / 2 - 8, apronY + apronH / 2 + 1, 9, false);
    state.hotspots.push({ id: 23, x: x + w / 2 - 17, y: apronY + apronH / 2 - 8, w: 18, h: 18 });

    // Half-nut lever
    var hnEng = op.id === 'threading';
    ctx.strokeStyle = hnEng ? COL.handwheelR : '#aab4c0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var leverBaseY = apronY + apronH * 0.4;
    var leverEndY = hnEng ? apronY + apronH - 4 : apronY + apronH * 0.15;
    ctx.moveTo(x + w - 4, leverBaseY);
    ctx.lineTo(x + w + 12, leverEndY);
    ctx.stroke();
    ctx.fillStyle = hnEng ? COL.handwheelR : '#c0c8d0';
    ctx.beginPath();
    ctx.arc(x + w + 12, leverEndY, 3.2, 0, Math.PI * 2);
    ctx.fill();
    state.hotspots.push({ id: 18, x: x + w + 4, y: leverEndY - 6, w: 14, h: 14 });

    // ── SADDLE (gray machined, sits on bed ways) ──
    var saddleH = saddleBot - saddleTop;
    var sadGrad = ctx.createLinearGradient(0, saddleTop, 0, saddleBot);
    sadGrad.addColorStop(0, '#5a626c');
    sadGrad.addColorStop(0.4, COL.bedTop);
    sadGrad.addColorStop(1, '#2a2f36');
    ctx.fillStyle = sadGrad;
    ctx.fillRect(x - 11, saddleTop, w + 22, saddleH);
    ctx.strokeStyle = COL.castIron;
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 11, saddleTop, w + 22, saddleH);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.moveTo(x - 11, saddleTop + 0.5); ctx.lineTo(x + w + 11, saddleTop + 0.5);
    ctx.stroke();
    state.hotspots.push({ id: 11, x: x - 11, y: saddleTop, w: w + 22, h: saddleH });

    // ── CROSS-SLIDE (bright green plate, with calibration scale) ──
    var csH = saddleTop - crossSlideTop;
    var csGrad = ctx.createLinearGradient(0, crossSlideTop, 0, saddleTop);
    csGrad.addColorStop(0, COL.paintHi);
    csGrad.addColorStop(0.5, COL.paintLight);
    csGrad.addColorStop(1, COL.paintMid);
    ctx.fillStyle = csGrad;
    ctx.fillRect(x + 2, crossSlideTop, w - 4, csH);
    ctx.strokeStyle = '#0a1a10';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 2, crossSlideTop, w - 4, csH);
    // Calibration ticks
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 0.5;
    for (var ct = 0; ct < 10; ct++) {
      ctx.beginPath();
      ctx.moveTo(x + 6 + ct * (w - 8) / 9, crossSlideTop + 2);
      ctx.lineTo(x + 6 + ct * (w - 8) / 9, crossSlideTop + 5);
      ctx.stroke();
    }
    state.hotspots.push({ id: 12, x: x + 2, y: crossSlideTop, w: w - 4, h: csH });

    // Cross-slide handwheel (right side, with red dial graduations)
    drawHandwheel(ctx, x + w + 5, (crossSlideTop + saddleTop) / 2, 7, false);

    // ── COMPOUND REST + TOOL POST + TOOL (rotated for taper/threading) ──
    var compAngle = 0;
    if (op.id === 'taper') compAngle = 6 * Math.PI / 180;
    if (op.id === 'threading') compAngle = 29 * Math.PI / 180;

    var compH = crossSlideTop - compoundTop;
    var compCenterX = x + w / 2;
    var compCenterY = compoundTop + compH / 2;

    ctx.save();
    ctx.translate(compCenterX, compCenterY);
    ctx.rotate(compAngle);

    // Compound rest base (brushed steel)
    var crGrad = ctx.createLinearGradient(0, -compH / 2, 0, compH / 2);
    crGrad.addColorStop(0, COL.steel);
    crGrad.addColorStop(0.5, COL.steelLight);
    crGrad.addColorStop(1, COL.steelDark);
    ctx.fillStyle = crGrad;
    ctx.fillRect(-28, -compH / 2, 56, compH);
    ctx.strokeStyle = COL.steelDark;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-28, -compH / 2, 56, compH);
    // Graduated swivel scale at the bottom edge
    ctx.strokeStyle = '#1a1d22';
    ctx.lineWidth = 0.5;
    for (var ag = 0; ag < 13; ag++) {
      ctx.beginPath();
      var tx = -27 + ag * (54 / 12);
      ctx.moveTo(tx, compH / 2 - 3);
      ctx.lineTo(tx, compH / 2);
      ctx.stroke();
    }
    state.hotspots.push({ id: 13, x: compCenterX - 28, y: compoundTop, w: 56, h: compH });

    // Tool post (safety-orange, ABOVE compound rest)
    var tpH = compoundTop - toolPostTop;
    var tpY = -compH / 2 - tpH;  // top of tool post in local frame
    var tpGrad = ctx.createLinearGradient(-16, tpY, 16, tpY);
    tpGrad.addColorStop(0, COL.toolHolderD);
    tpGrad.addColorStop(0.4, COL.toolHolder);
    tpGrad.addColorStop(0.6, lightenColor(COL.toolHolder, 30));
    tpGrad.addColorStop(1, COL.toolHolderD);
    ctx.fillStyle = tpGrad;
    roundRect(ctx, -16, tpY, 32, tpH, 2);
    ctx.fill();
    ctx.strokeStyle = darkenColor(COL.toolHolder, 40);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Clamp bolt on top
    drawBolt(ctx, 0, tpY + tpH / 2, 3);
    // Top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(-15, tpY + 1, 30, 2);
    state.hotspots.push({ id: 14, x: compCenterX - 16, y: toolPostTop, w: 32, h: tpH });

    // Cutting tool — shank reaches up to the workpiece, insert tip touches outer surface
    var toolTipLocalY = toolTipTarget - compCenterY;
    drawCuttingToolV3(ctx, op, tpY, toolTipLocalY, wpR);

    ctx.restore();
  }

  // Tool drawing: shank extends from tool post top (tpY) up to workpiece outer surface (toolTipY).
  function drawCuttingToolV3(ctx, op, tpY, toolTipY, wpR) {
    var shankBottom = tpY;             // bottom of shank = top of tool post
    var shankTop = toolTipY + 7;       // insert occupies top 7px above shank
    if (shankTop > shankBottom - 4) shankTop = shankBottom - 4;
    var shankH = shankBottom - shankTop;

    // Dark, high-contrast shank so it stands out against the workpiece
    var shankGrad = ctx.createLinearGradient(-8, 0, 8, 0);
    shankGrad.addColorStop(0, '#0e1116');
    shankGrad.addColorStop(0.45, '#2a3140');
    shankGrad.addColorStop(0.55, '#4a5260');
    shankGrad.addColorStop(1, '#0e1116');

    if (op.id === 'boring') {
      // Boring bar = horizontal cantilever shank with insert pointing inward
      ctx.fillStyle = shankGrad;
      ctx.fillRect(-4, shankTop, 8, shankH);
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(-4, shankTop, 8, shankH);
      // Insert at the tip
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.arc(3, shankTop, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.insertEdge;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      return;
    }

    if (op.id === 'knurling') {
      // Two knurling wheels at the top of a short holder
      var holderTop = shankTop + 2;
      ctx.fillStyle = shankGrad;
      ctx.fillRect(-10, holderTop, 20, shankBottom - holderTop);
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(-10, holderTop, 20, shankBottom - holderTop);
      ctx.fillStyle = COL.steel;
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(-5, shankTop - 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, shankTop - 2, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#3a4048';
      ctx.lineWidth = 0.4;
      for (var kw = 0; kw < 6; kw++) {
        var kwa = kw * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(-5 + Math.cos(kwa) * 1.5, shankTop - 2 + Math.sin(kwa) * 1.5);
        ctx.lineTo(-5 + Math.cos(kwa) * 4.5, shankTop - 2 + Math.sin(kwa) * 4.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5 + Math.cos(kwa) * 1.5, shankTop - 2 + Math.sin(kwa) * 1.5);
        ctx.lineTo(5 + Math.cos(kwa) * 4.5, shankTop - 2 + Math.sin(kwa) * 4.5);
        ctx.stroke();
      }
      return;
    }

    // Standard tools: thick dark shank + prominent gold insert
    ctx.fillStyle = shankGrad;
    ctx.fillRect(-8, shankTop, 16, shankH);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, shankTop, 16, shankH);
    // Specular highlight on shank
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(-7, shankTop + 1, 2, shankH - 2);

    // Carbide insert at the very top — BIG, gold, glowing
    var insertSize = 9;
    ctx.fillStyle = COL.insertGold;
    if (op.id === 'threading') {
      ctx.beginPath();
      ctx.moveTo(-7, shankTop);
      ctx.lineTo(0, shankTop - 8);
      ctx.lineTo(7, shankTop);
      ctx.closePath();
    } else if (op.id === 'facing') {
      ctx.beginPath();
      ctx.moveTo(-7, shankTop);
      ctx.lineTo(0, shankTop - 7);
      ctx.lineTo(8, shankTop - 2);
      ctx.lineTo(8, shankTop);
      ctx.closePath();
    } else {
      // Diamond/rhombus insert
      ctx.beginPath();
      ctx.moveTo(-7, shankTop);
      ctx.lineTo(0, shankTop - insertSize);
      ctx.lineTo(7, shankTop);
      ctx.lineTo(0, shankTop + 2);
      ctx.closePath();
    }
    // Soft yellow glow behind insert
    ctx.save();
    ctx.shadowColor = 'rgba(255,220,80,0.9)';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = COL.insertEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
    // Bright cutting-edge glint at very tip
    ctx.fillStyle = '#fffce5';
    ctx.beginPath();
    ctx.arc(0, shankTop - insertSize + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Hot contact point when running — orange/red glow at workpiece
    if (state.running) {
      ctx.save();
      ctx.shadowColor = '#ff7030';
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(255,140,60,0.9)';
      ctx.beginPath();
      ctx.arc(0, shankTop - insertSize, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,240,140,0.95)';
      ctx.beginPath();
      ctx.arc(0, shankTop - insertSize, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Updated cutting tool: drawn relative to top-edge of tool post (y = tpY).
  // Tool shank goes upward, insert tip at top.
  function drawCuttingToolV2(ctx, op, tpY) {
    var shankGrad = ctx.createLinearGradient(-12, 0, 12, 0);
    shankGrad.addColorStop(0, COL.steelDark);
    shankGrad.addColorStop(0.5, COL.steel);
    shankGrad.addColorStop(1, COL.steelLight);

    if (op.id === 'turning' || op.id === 'taper' || op.id === 'facing' || op.id === 'threading') {
      // Tool shank extends up from tool post
      var shankH = 14;
      ctx.fillStyle = shankGrad;
      ctx.fillRect(-7, tpY - shankH, 14, shankH);
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(-7, tpY - shankH, 14, shankH);
      // Carbide insert at the tip
      ctx.fillStyle = COL.insertGold;
      if (op.id === 'threading') {
        // V-shape insert
        ctx.beginPath();
        ctx.moveTo(-5, tpY - shankH);
        ctx.lineTo(0, tpY - shankH - 7);
        ctx.lineTo(5, tpY - shankH);
        ctx.closePath();
      } else {
        // Diamond/rhombus insert
        ctx.beginPath();
        ctx.moveTo(-6, tpY - shankH);
        ctx.lineTo(0, tpY - shankH - 6);
        ctx.lineTo(6, tpY - shankH);
        ctx.lineTo(0, tpY - shankH + 2);
        ctx.closePath();
      }
      ctx.fill();
      ctx.strokeStyle = COL.insertEdge;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // Sparkling cutting edge
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-1, tpY - shankH - 6);
      ctx.lineTo(1, tpY - shankH - 6);
      ctx.stroke();
    } else if (op.id === 'boring') {
      // Boring bar extends UPWARD-RIGHT toward the workpiece center
      ctx.fillStyle = shankGrad;
      ctx.fillRect(-5, tpY - 22, 10, 22);
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(-5, tpY - 22, 10, 22);
      // Insert at the tip
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.arc(2, tpY - 22, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COL.insertEdge;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    } else if (op.id === 'knurling') {
      // Knurling wheels stacked horizontally above tool post
      ctx.fillStyle = COL.steel;
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(-5, tpY - 8, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(5, tpY - 8, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Cross-hatching on wheels
      ctx.strokeStyle = '#3a4048';
      ctx.lineWidth = 0.4;
      for (var kw = 0; kw < 6; kw++) {
        var kwa = kw * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(-5 + Math.cos(kwa) * 1.5, tpY - 8 + Math.sin(kwa) * 1.5);
        ctx.lineTo(-5 + Math.cos(kwa) * 4.5, tpY - 8 + Math.sin(kwa) * 4.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(5 + Math.cos(kwa) * 1.5, tpY - 8 + Math.sin(kwa) * 1.5);
        ctx.lineTo(5 + Math.cos(kwa) * 4.5, tpY - 8 + Math.sin(kwa) * 4.5);
        ctx.stroke();
      }
    }
  }

  function drawCuttingTool(ctx, op, x, y) {
    // Shank (gray steel)
    var shankGrad = ctx.createLinearGradient(0, y, 0, y + 10);
    shankGrad.addColorStop(0, COL.steelLight);
    shankGrad.addColorStop(0.5, COL.steel);
    shankGrad.addColorStop(1, COL.steelDark);

    if (op.id === 'turning' || op.id === 'taper') {
      ctx.fillStyle = shankGrad;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 22, y);
      ctx.lineTo(x - 22, y + 9);
      ctx.lineTo(x - 2, y + 9);
      ctx.lineTo(x, y + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      // Carbide insert (gold)
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 1, y + 5);
      ctx.lineTo(x - 4, y + 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COL.insertEdge;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    } else if (op.id === 'facing') {
      ctx.fillStyle = shankGrad;
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x - 22, y + 2);
      ctx.lineTo(x - 22, y + 11);
      ctx.lineTo(x - 3, y + 11);
      ctx.lineTo(x, y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.6;
      ctx.stroke();
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.moveTo(x, y + 2);
      ctx.lineTo(x + 1, y + 7);
      ctx.lineTo(x - 4, y + 5);
      ctx.closePath();
      ctx.fill();
    } else if (op.id === 'boring') {
      ctx.fillStyle = shankGrad;
      ctx.fillRect(x, y + 3, 26, 6);
      ctx.strokeStyle = COL.steelDark;
      ctx.lineWidth = 0.6;
      ctx.strokeRect(x, y + 3, 26, 6);
      // Boring tip
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.moveTo(x + 26, y + 2);
      ctx.lineTo(x + 30, y + 6);
      ctx.lineTo(x + 26, y + 10);
      ctx.closePath();
      ctx.fill();
    } else if (op.id === 'threading') {
      ctx.fillStyle = shankGrad;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 20, y);
      ctx.lineTo(x - 20, y + 9);
      ctx.lineTo(x - 3, y + 9);
      ctx.lineTo(x - 1, y + 6);
      ctx.lineTo(x + 1, y + 9);
      ctx.lineTo(x + 1, y);
      ctx.closePath();
      ctx.fill();
      // Sharp V insert
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 4);
      ctx.lineTo(x, y + 8);
      ctx.lineTo(x + 2, y + 4);
      ctx.closePath();
      ctx.fill();
    } else if (op.id === 'knurling') {
      // Knurling wheels
      ctx.fillStyle = COL.steel;
      ctx.beginPath(); ctx.arc(x + 4, y + 4, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = COL.steelDark; ctx.lineWidth = 0.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 4, y + 14, 5, 0, Math.PI * 2); ctx.fill();
      ctx.stroke();
      // Cross-hatching on wheels
      ctx.strokeStyle = '#3a4048';
      ctx.lineWidth = 0.4;
      for (var kw = 0; kw < 6; kw++) {
        var kwa = kw * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(x + 4 + Math.cos(kwa) * 1.5, y + 4 + Math.sin(kwa) * 1.5);
        ctx.lineTo(x + 4 + Math.cos(kwa) * 4.5, y + 4 + Math.sin(kwa) * 4.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 4 + Math.cos(kwa) * 1.5, y + 14 + Math.sin(kwa) * 1.5);
        ctx.lineTo(x + 4 + Math.cos(kwa) * 4.5, y + 14 + Math.sin(kwa) * 4.5);
        ctx.stroke();
      }
      // Holder
      ctx.fillStyle = shankGrad;
      ctx.fillRect(x - 22, y + 5, 22, 8);
      ctx.strokeStyle = COL.steelDark; ctx.strokeRect(x - 22, y + 5, 22, 8);
    }
  }

  function drawSafetyGuard(ctx, chuckX, spindleY, endX) {
    // Transparent blue tinted polycarbonate guard
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#7ec8ff';
    var gx1 = chuckX - 25, gx2 = endX + 20, gy = spindleY - 70;
    ctx.beginPath();
    ctx.moveTo(gx1, gy);
    ctx.lineTo(gx2, gy);
    ctx.lineTo(gx2, gy + 35);
    ctx.lineTo(gx1, gy + 35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Frame
    ctx.strokeStyle = '#8aa0b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(chuckX - 25, spindleY - 70);
    ctx.lineTo(endX + 20, spindleY - 70);
    ctx.lineTo(endX + 20, spindleY - 35);
    ctx.stroke();
    // Hinge dots
    ctx.fillStyle = COL.brass;
    ctx.beginPath(); ctx.arc(chuckX - 25, spindleY - 70, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(endX + 20, spindleY - 70, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawCoolantNozzle(ctx, x, topY, targetY) {
    // Hose (segmented black)
    ctx.strokeStyle = COL.coolantHose;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 12, topY - 8);
    ctx.quadraticCurveTo(x - 6, topY, x, topY + 6);
    ctx.stroke();
    // Segment rings
    ctx.strokeStyle = '#3a3f48';
    ctx.lineWidth = 1.2;
    for (var sg = 0; sg < 5; sg++) {
      var t = sg / 4;
      var sx = lerp(x - 12, x, t);
      var sy = lerp(topY - 8, topY + 6, t);
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Nozzle tip
    ctx.fillStyle = COL.brass;
    ctx.beginPath();
    ctx.moveTo(x - 3, topY + 5);
    ctx.lineTo(x + 3, topY + 5);
    ctx.lineTo(x + 1, topY + 12);
    ctx.lineTo(x - 1, topY + 12);
    ctx.closePath();
    ctx.fill();

    // Stream (only when running)
    if (state.running) {
      // Main stream
      ctx.strokeStyle = hexToRGBA(COL.coolantBlue, 0.7);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, topY + 13);
      ctx.lineTo(x + 2, targetY);
      ctx.stroke();
      // Droplets
      for (var dr = 0; dr < 6; dr++) {
        var dx = x + randFloat(-4, 6);
        var dy = topY + 14 + dr * ((targetY - topY) / 6) + randFloat(-3, 3);
        ctx.fillStyle = hexToRGBA(COL.coolantBlue, randFloat(0.3, 0.7));
        ctx.beginPath();
        ctx.arc(dx, dy, randFloat(1.2, 2.2), 0, Math.PI * 2);
        ctx.fill();
      }
      // Splash at workpiece
      ctx.fillStyle = hexToRGBA(COL.coolantBlue, 0.5);
      ctx.beginPath();
      ctx.ellipse(x + 2, targetY + 2, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCurledChip(ctx, x, y, chip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(chip.rot);
    ctx.globalAlpha = chip.life;
    // Curl: spiral pattern
    ctx.strokeStyle = chip.color;
    ctx.lineWidth = chip.size * 0.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    var spiralR = chip.size;
    for (var s = 0; s < 12; s++) {
      var ang = s * 0.5 * chip.curl;
      var r = spiralR * (1 - s / 14);
      var px = Math.cos(ang) * r;
      var py = Math.sin(ang) * r;
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    // Hot tip glow
    ctx.fillStyle = hexToRGBA('#ff8a3a', chip.life * 0.4);
    ctx.beginPath();
    ctx.arc(spiralR, 0, chip.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPartLabels(ctx, mx, my, mw, mh, hsX, hsW, chuckX, spindleY, wpStartX, wpEndX, wpR, tsX, tsY, tsW, tsH, carrX, carrY, carrW, carrH, bedY, lsY, frY) {
    // Show numbered tags above each major part
    var labels = [
      { n: 2,  x: hsX + hsW / 2, y: my + 25 },
      { n: 4,  x: chuckX, y: spindleY - 50 },
      { n: 7,  x: tsX + tsW / 2, y: tsY - 6 },
      { n: 11, x: carrX + carrW / 2, y: carrY + carrH + 10 },
      { n: 16, x: mx + mw / 2, y: lsY + 18 }
    ];
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    labels.forEach(function (lbl) {
      ctx.fillStyle = COL.hazardY;
      ctx.beginPath();
      ctx.arc(lbl.x, lbl.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0a0c10';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#0a0c10';
      ctx.fillText(lbl.n, lbl.x, lbl.y + 3);
    });
  }

  function drawHighlight(ctx, partId) {
    // Find latest hotspot matching this id
    var hit = null;
    for (var i = state.hotspots.length - 1; i >= 0; i--) {
      if (state.hotspots[i].id === partId) { hit = state.hotspots[i]; break; }
    }
    if (!hit) return;
    ctx.save();
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 4]);
    ctx.shadowColor = ACCENT;
    ctx.shadowBlur = 12;
    roundRect(ctx, hit.x - 3, hit.y - 3, hit.w + 6, hit.h + 6, 6);
    ctx.stroke();
    ctx.restore();
  }

  function drawStatusBar(ctx, W, H) {
    var mat = MATERIALS[state.matIdx];
    var op = OPERATIONS[state.opIdx];
    var y = H - 38;
    ctx.fillStyle = 'rgba(8,12,18,0.85)';
    roundRect(ctx, 10, y, W - 20, 32, 6);
    ctx.fill();
    ctx.strokeStyle = BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Status dot
    var statusColor = !state.power ? RED
      : state.running ? GREEN : GOLD;
    var statusText = !state.power ? 'POWER OFF'
      : state.running ? 'MACHINING' : 'READY';
    ctx.fillStyle = statusColor;
    ctx.beginPath(); ctx.arc(24, y + 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = statusColor; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = TEXT;
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(statusText, 36, y + 19);

    // Op + material info
    ctx.fillStyle = TEXT_DIM;
    ctx.font = '9px sans-serif';
    ctx.fillText('Op: ' + op.name + ' | ' + mat.name + ' | Ks=' + mat.Ks + ' N/mm²', 130, y + 13);
    // Performance line
    ctx.fillStyle = ACCENT;
    ctx.fillText('V=' + lfix(phys.V,'vc',1) + ' ' + lu('vc') + ' · MRR=' + lfix(phys.MRR,'mrr',0) + ' ' + lu('mrr') + ' · P=' + lfix(phys.P,'power',2) + ' ' + lu('power'), 130, y + 25);

    // Warning
    if (phys.V > mat.Vrec * 1.5) {
      ctx.fillStyle = RED;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚠ OVERSPEED (max ' + lfix(mat.Vrec * 1.5,'vc',0) + ' ' + lu('vc') + ')', W - 18, y + 19);
    } else if (phys.P > 7.5) {
      ctx.fillStyle = GOLD;
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚠ High Power Demand', W - 18, y + 19);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S11b  CANVAS INTERACTION (click + hover)
     ═══════════════════════════════════════════════════════════════ */
  function wireMachineInteraction() {
    if (!mcCanvas) return;
    var tooltip = $('part-tooltip');

    function getCanvasPos(e) {
      var rect = mcCanvas.getBoundingClientRect();
      /* Map into LOGICAL space. This divided by the backing store, which was
         only correct while backing == logical; now that the canvas is DPR-scaled
         that would land every click off by the DPR factor. */
      var scaleX = 600 / rect.width;
      var scaleY = 380 / rect.height;
      var cx = (e.clientX - rect.left) * scaleX;
      var cy = (e.clientY - rect.top) * scaleY;
      return { x: cx, y: cy, displayX: e.clientX - rect.left, displayY: e.clientY - rect.top };
    }

    function hitTest(pos) {
      for (var i = state.hotspots.length - 1; i >= 0; i--) {
        var h = state.hotspots[i];
        if (pos.x >= h.x && pos.x <= h.x + h.w && pos.y >= h.y && pos.y <= h.y + h.h) {
          return h.id;
        }
      }
      return null;
    }

    mcCanvas.addEventListener('mousemove', function (e) {
      var pos = getCanvasPos(e);
      var id = hitTest(pos);
      if (id) {
        var part = findPart(id);
        if (part && tooltip) {
          tooltip.innerHTML = '<strong>' + part.id + '. ' + part.name + '</strong>' +
                              part.desc.substring(0, 130) + (part.desc.length > 130 ? '…' : '') +
                              '<br><em style="color:#6b7a99">Click to highlight</em>';
          tooltip.style.display = 'block';
          var rect = mcCanvas.getBoundingClientRect();
          var px = pos.displayX + 16;
          var py = pos.displayY + 12;
          if (px + 240 > rect.width) px = pos.displayX - 250;
          if (py + 100 > rect.height) py = pos.displayY - 80;
          tooltip.style.left = px + 'px';
          tooltip.style.top = py + 'px';
        }
        mcCanvas.style.cursor = 'pointer';
      } else {
        if (tooltip) tooltip.style.display = 'none';
        mcCanvas.style.cursor = 'crosshair';
      }
    });

    mcCanvas.addEventListener('mouseleave', function () {
      if (tooltip) tooltip.style.display = 'none';
    });

    mcCanvas.addEventListener('click', function (e) {
      var pos = getCanvasPos(e);
      var id = hitTest(pos);
      if (id) {
        state.highlightedPart = (state.highlightedPart === id) ? null : id;
        highlightLegendItem(id);
        drawMachine();
      }
    });
  }

  function findPart(id) {
    for (var i = 0; i < PARTS.length; i++) if (PARTS[i].id === id) return PARTS[i];
    return null;
  }

  /* ═══════════════════════════════════════════════════════════════
     S11c  PARTS LEGEND (color-coded)
     ═══════════════════════════════════════════════════════════════ */
  function buildPartsLegend() {
    var c = $('parts-legend');
    if (!c) return;
    c.innerHTML = '';
    // Show first 14 most important parts in the legend
    var legendIds = [1, 2, 3, 4, 7, 11, 12, 13, 14, 15, 16, 17, 19, 24];
    legendIds.forEach(function (id) {
      var part = findPart(id);
      if (!part) return;
      var item = document.createElement('div');
      item.className = 'legend-item';
      item.setAttribute('data-id', id);
      var sw = document.createElement('span');
      sw.className = 'legend-swatch';
      sw.style.background = part.swatch;
      var lbl = document.createElement('span');
      lbl.textContent = part.id + '. ' + part.name;
      item.appendChild(sw);
      item.appendChild(lbl);
      item.addEventListener('click', function () {
        state.highlightedPart = (state.highlightedPart === id) ? null : id;
        highlightLegendItem(id);
        drawMachine();
      });
      c.appendChild(item);
    });
  }

  function highlightLegendItem(id) {
    var items = document.querySelectorAll('#parts-legend .legend-item');
    items.forEach(function (it) {
      var iid = parseInt(it.getAttribute('data-id'), 10);
      it.classList.toggle('active', iid === state.highlightedPart);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     S12  GRAPH CANVAS DRAWING (560×500) — same logic, refreshed
     ═══════════════════════════════════════════════════════════════ */
  function drawGraph() {
    if (!grCtx) return;
    var ctx = grCtx;
    var W = 560, H = 500;   /* logical space; backing is DPR-scaled */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    drawCuttingCrossSection(ctx, 0, 0, W, 180);
    drawForceDiagram(ctx, 0, 185, W, 155);
    drawParameterBars(ctx, 0, 345, W, 155);
  }

  function drawCuttingCrossSection(ctx, x, y, w, h) {
    var op = OPERATIONS[state.opIdx];
    var mat = MATERIALS[state.matIdx];

    ctx.fillStyle = TEXT_DIM;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Cutting Operation Cross-Section — ' + op.name, x + w / 2, y + 15);

    var cx = x + w / 2, cy = y + h / 2 + 10;

    if (op.id === 'turning' || op.id === 'taper') {
      var wpR = 50;
      var docPx = state.doc / state.dia * wpR * 2;
      // Workpiece filled
      var wpGrad = ctx.createRadialGradient(cx - 15, cy - 15, 5, cx, cy, wpR);
      wpGrad.addColorStop(0, mat.hl);
      wpGrad.addColorStop(0.6, mat.color);
      wpGrad.addColorStop(1, darkenColor(mat.color, 30));
      ctx.fillStyle = wpGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, wpR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darkenColor(mat.color, 20);
      ctx.lineWidth = 2;
      ctx.stroke();
      // Inner machined circle
      var newR = wpR - docPx;
      ctx.fillStyle = hexToRGBA(mat.hl, 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(newR, 5), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotation arrow
      ctx.strokeStyle = state.direction === 1 ? GREEN : '#ff9947';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, wpR + 14, -Math.PI * 0.3, Math.PI * 0.3);
      ctx.stroke();
      var arrA = Math.PI * 0.3;
      ctx.fillStyle = state.direction === 1 ? GREEN : '#ff9947';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(arrA) * (wpR + 14), cy + Math.sin(arrA) * (wpR + 14));
      ctx.lineTo(cx + Math.cos(arrA) * (wpR + 14) - 6, cy + Math.sin(arrA) * (wpR + 14) - 3);
      ctx.lineTo(cx + Math.cos(arrA) * (wpR + 14) - 3, cy + Math.sin(arrA) * (wpR + 14) + 4);
      ctx.closePath();
      ctx.fill();

      // Tool (orange holder + gold insert)
      ctx.fillStyle = COL.toolHolder;
      ctx.fillRect(cx + wpR - docPx - 3, cy - 15, 60, 12);
      ctx.strokeStyle = COL.toolHolderD;
      ctx.lineWidth = 0.8;
      ctx.strokeRect(cx + wpR - docPx - 3, cy - 15, 60, 12);
      // Insert
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.moveTo(cx + wpR - docPx - 3, cy - 12);
      ctx.lineTo(cx + wpR - docPx + 4, cy - 6);
      ctx.lineTo(cx + wpR - docPx - 3, cy - 6);
      ctx.closePath();
      ctx.fill();

      // Depth-of-cut dimension
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx + wpR, cy - 25); ctx.lineTo(cx + newR, cy - 25); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + wpR, cy - 28); ctx.lineTo(cx + wpR, cy - 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + newR, cy - 28); ctx.lineTo(cx + newR, cy - 22); ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.font = '9px sans-serif';
      ctx.fillText('d=' + lfix(state.doc,'len',1) + lu('len'), cx + (wpR + newR) / 2, cy - 30);

      // Labels
      ctx.fillStyle = TEXT_DIM;
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('D=' + lfix(state.dia,'len',0) + ' ' + lu('len'), cx - wpR - 50, cy + 5);
      ctx.fillText('Tool', cx + wpR + 12, cy - 5);

      // Feed arrow
      ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + wpR + 30, cy + 20); ctx.lineTo(cx + wpR + 30, cy + 40); ctx.stroke();
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.moveTo(cx + wpR + 30, cy + 42);
      ctx.lineTo(cx + wpR + 26, cy + 36);
      ctx.lineTo(cx + wpR + 34, cy + 36);
      ctx.closePath();
      ctx.fill();
      ctx.fillText('Feed (f)', cx + wpR + 36, cy + 35);
    } else if (op.id === 'facing') {
      var wpR2 = 50;
      var wpGrad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, wpR2);
      wpGrad2.addColorStop(0, mat.hl);
      wpGrad2.addColorStop(1, darkenColor(mat.color, 30));
      ctx.fillStyle = wpGrad2;
      ctx.beginPath(); ctx.arc(cx, cy, wpR2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = mat.color;
      ctx.lineWidth = 2; ctx.stroke();

      // Faced ring
      var facedR = wpR2 * (1 - state.toolPos * 0.8);
      ctx.fillStyle = hexToRGBA(mat.hl, 0.5);
      ctx.beginPath();
      ctx.arc(cx, cy, wpR2, 0, Math.PI * 2);
      ctx.arc(cx, cy, facedR, 0, Math.PI * 2, true);
      ctx.fill();

      // Tool
      ctx.fillStyle = COL.toolHolder;
      ctx.fillRect(cx + facedR, cy - 5, 40, 10);
      ctx.strokeStyle = COL.toolHolderD; ctx.strokeRect(cx + facedR, cy - 5, 40, 10);

      ctx.strokeStyle = ACCENT; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + wpR2 + 15, cy); ctx.lineTo(cx + 15, cy); ctx.stroke();
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.moveTo(cx + 12, cy); ctx.lineTo(cx + 20, cy - 4); ctx.lineTo(cx + 20, cy + 4);
      ctx.closePath(); ctx.fill();
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Tool feeds from OD to center', cx, cy + wpR2 + 20);
    } else if (op.id === 'threading') {
      var baseY = cy + 20, profW = w - 100, sX = x + 50, pitch = 20;
      ctx.fillStyle = hexToRGBA(mat.color, 0.5);
      ctx.fillRect(sX, baseY - 30, profW, 30);
      ctx.strokeStyle = mat.color;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sX, baseY);
      var tc = Math.floor(profW / pitch);
      for (var ti = 0; ti < tc; ti++) {
        var tx2 = sX + ti * pitch;
        ctx.lineTo(tx2 + pitch / 2, baseY - 15);
        ctx.lineTo(tx2 + pitch, baseY);
      }
      ctx.stroke();
      // Pitch dim
      ctx.strokeStyle = ACCENT; ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sX + pitch / 2, baseY - 25);
      ctx.lineTo(sX + pitch + pitch / 2, baseY - 25);
      ctx.stroke();
      ctx.fillStyle = ACCENT;
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Pitch (p)', sX + pitch, baseY - 28);
      // V tool
      ctx.fillStyle = COL.toolHolder;
      ctx.beginPath();
      ctx.moveTo(sX + state.toolPos * profW, baseY - 40);
      ctx.lineTo(sX + state.toolPos * profW - 8, baseY - 55);
      ctx.lineTo(sX + state.toolPos * profW + 8, baseY - 55);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = COL.toolHolderD; ctx.stroke();
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath();
      ctx.arc(sX + state.toolPos * profW, baseY - 42, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (op.id === 'boring') {
      var oR = 50, iR = 25 + state.toolPos * 15;
      ctx.fillStyle = hexToRGBA(mat.color, 0.4);
      ctx.beginPath();
      ctx.arc(cx, cy, oR, 0, Math.PI * 2);
      ctx.arc(cx, cy, iR, 0, Math.PI * 2, true);
      ctx.fill();
      ctx.strokeStyle = mat.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, oR, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, iR, 0, Math.PI * 2); ctx.stroke();
      // Boring bar (orange + gold insert)
      ctx.fillStyle = COL.toolHolder;
      ctx.fillRect(cx - 5, cy - iR + 5, 10, iR * 2 - 10);
      ctx.strokeStyle = COL.toolHolderD; ctx.strokeRect(cx - 5, cy - iR + 5, 10, iR * 2 - 10);
      ctx.fillStyle = COL.insertGold;
      ctx.beginPath(); ctx.arc(cx + 5, cy - iR + 7, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = TEXT_DIM;
      ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Boring: Enlarging internal diameter', cx, cy + oR + 18);
    } else if (op.id === 'knurling') {
      var kBX = x + 80, kBY = cy - 30, kW = w - 160, kH = 60;
      ctx.fillStyle = hexToRGBA(mat.color, 0.4);
      ctx.fillRect(kBX, kBY, kW, kH);
      ctx.strokeStyle = mat.color; ctx.strokeRect(kBX, kBY, kW, kH);
      var dp = 8;
      ctx.strokeStyle = darkenColor(mat.color, 25);
      ctx.lineWidth = 0.8;
      for (var dx2 = kBX; dx2 < kBX + kW; dx2 += dp) {
        ctx.beginPath(); ctx.moveTo(dx2, kBY); ctx.lineTo(dx2 + dp * 2, kBY + kH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(dx2 + dp * 2, kBY); ctx.lineTo(dx2, kBY + kH); ctx.stroke();
      }
      // Wheels
      ctx.fillStyle = COL.steel; ctx.strokeStyle = COL.steelLight; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(kBX + kW * state.toolPos, kBY - 12, 10, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(kBX + kW * state.toolPos, kBY + kH + 12, 10, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = TEXT_DIM; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Diamond Knurl Pattern', cx, kBY + kH + 35);
    }
  }

  function drawForceDiagram(ctx, x, y, w, h) {
    ctx.fillStyle = TEXT_DIM; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Cutting Force Components', x + w / 2, y + 15);

    ctx.strokeStyle = BORDER; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x + 20, y + 2); ctx.lineTo(x + w - 20, y + 2); ctx.stroke();

    var cx = x + w / 3, cy = y + h / 2 + 10;

    ctx.fillStyle = hexToRGBA(MATERIALS[state.matIdx].color, 0.4);
    ctx.beginPath(); ctx.arc(cx - 40, cy, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = MATERIALS[state.matIdx].color; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = COL.toolHolder;
    ctx.fillRect(cx - 5, cy - 30, 10, 28);
    ctx.strokeStyle = COL.toolHolderD; ctx.strokeRect(cx - 5, cy - 30, 10, 28);

    var maxForce = Math.max(phys.Fc, 1);
    var scale = 80 / maxForce;

    var fcLen = clamp(phys.Fc * scale, 10, 120);
    drawArrow(ctx, cx, cy, cx + fcLen, cy, '#ff6b6b', 2);
    ctx.fillStyle = '#ff6b6b'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Fc = ' + lfix(phys.Fc,'force',0) + ' ' + lu('force'), cx + fcLen + 5, cy + 4);

    var ffLen = clamp(phys.Ff * scale, 8, 80);
    drawArrow(ctx, cx, cy, cx, cy + ffLen, GREEN, 2);
    ctx.fillStyle = GREEN; ctx.textAlign = 'center';
    ctx.fillText('Ff = ' + lfix(phys.Ff,'force',0) + ' ' + lu('force'), cx, cy + ffLen + 14);

    var frLen = clamp(phys.Fr * scale, 6, 60);
    drawArrow(ctx, cx, cy, cx - frLen, cy - frLen * 0.5, '#ffa726', 2);
    ctx.fillStyle = '#ffa726'; ctx.textAlign = 'right';
    ctx.fillText('Fr = ' + lfix(phys.Fr,'force',0) + ' ' + lu('force'), cx - frLen - 5, cy - frLen * 0.5);

    var legX = x + w * 0.62, legY = y + 35;
    ctx.textAlign = 'left'; ctx.font = '9px sans-serif';
    ctx.fillStyle = '#ff6b6b'; ctx.fillRect(legX, legY, 10, 3);
    ctx.fillText('Fc: Tangential (cutting) force', legX + 15, legY + 4);
    ctx.fillStyle = GREEN; ctx.fillRect(legX, legY + 18, 10, 3);
    ctx.fillText('Ff: Feed (axial) = 0.4×Fc', legX + 15, legY + 22);
    ctx.fillStyle = '#ffa726'; ctx.fillRect(legX, legY + 36, 10, 3);
    ctx.fillText('Fr: Radial = 0.3×Fc', legX + 15, legY + 40);

    ctx.fillStyle = ACCENT;
    ctx.font = '9px monospace';
    ctx.fillText('Fc = Ks × f × d', legX, legY + 60);
    ctx.fillStyle = TEXT_DIM; ctx.font = '8px sans-serif';
    ctx.fillText('= ' + MATERIALS[state.matIdx].Ks + ' × ' + state.feed.toFixed(2) + ' × ' + state.doc.toFixed(1), legX, legY + 74);
    ctx.fillText('= ' + roundN(phys.Fc, 1) + ' N', legX, legY + 88);
  }

  function drawParameterBars(ctx, x, y, w, h) {
    ctx.fillStyle = TEXT_DIM; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Performance Parameters', x + w / 2, y + 15);
    ctx.strokeStyle = BORDER; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x + 20, y + 2); ctx.lineTo(x + w - 20, y + 2); ctx.stroke();

    var mat = MATERIALS[state.matIdx];
    var barX = x + 120, barW = w - 170, barH = 16, gap = 28, startY = y + 32;
    var bars = [
      { label: 'Power',      value: phys.P,   unit: 'kW',         max: 15,     color: '#ff6b6b', decimals: 2 },
      { label: 'MRR',        value: phys.MRR, unit: 'mm³/min',     max: 200000, color: ACCENT,    decimals: 0 },
      { label: 'Force (Fc)', value: phys.Fc,  unit: 'N',          max: 40000,  color: '#ffa726', decimals: 0 },
      { label: 'Roughness',  value: phys.Ra,  unit: 'µm Ra',       max: 50,     color: GREEN,     decimals: 2 }
    ];
    bars.forEach(function (bar, i) {
      var by = startY + i * gap;
      ctx.fillStyle = TEXT_DIM; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
      ctx.fillText(bar.label, barX - 10, by + 12);
      ctx.fillStyle = SURFACE2;
      roundRect(ctx, barX, by, barW, barH, 4); ctx.fill();
      var fillW = clamp(bar.value / bar.max, 0, 1) * barW;
      if (fillW > 2) {
        var bg = ctx.createLinearGradient(barX, by, barX + fillW, by);
        bg.addColorStop(0, hexToRGBA(bar.color, 0.6));
        bg.addColorStop(1, bar.color);
        ctx.fillStyle = bg;
        roundRect(ctx, barX, by, fillW, barH, 4); ctx.fill();
      }
      ctx.fillStyle = TEXT; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'left';
      ctx.fillText(roundN(bar.value, bar.decimals) + ' ' + bar.unit, barX + barW + 8, by + 12);
    });
    var csY = startY + bars.length * gap + 5;
    ctx.fillStyle = TEXT_DIM; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('V = ' + roundN(phys.V, 1) + ' m/min', barX, csY + 5);
    var over = phys.V > mat.Vrec * 1.3;
    ctx.fillStyle = over ? RED : GREEN;
    ctx.fillText(over ? ' (exceeds rec. ' + mat.Vrec + ' m/min)' : ' (recommended: ' + mat.Vrec + ' m/min)', barX + 100, csY + 5);
  }

  function drawArrow(ctx, x1, y1, x2, y2, color, width) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    var ux = dx / len, uy = dy / len, headLen = 8;
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * headLen, y2 - uy * headLen);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * headLen - uy * headLen * 0.4, y2 - uy * headLen + ux * headLen * 0.4);
    ctx.lineTo(x2 - ux * headLen + uy * headLen * 0.4, y2 - uy * headLen - ux * headLen * 0.4);
    ctx.closePath(); ctx.fill();
  }

  /* ═══════════════════════════════════════════════════════════════
     S13  EXPLORE MODE
     ═══════════════════════════════════════════════════════════════ */
  function buildExploreCats() {
    var c = $('explore-cats');
    if (!c) return;
    c.innerHTML = '';
    PART_CATEGORIES.forEach(function (cat) {
      var b = document.createElement('button');
      b.className = 'config-pill' + (cat === state.exploreCat ? ' active' : '');
      b.textContent = cat;
      b.addEventListener('click', function () {
        state.exploreCat = cat;
        buildExploreCats();
        buildExploreGrid();
        drawExploreCanvas();
      });
      c.appendChild(b);
    });
  }

  function buildExploreGrid() {
    var c = $('explore-grid');
    if (!c) return;
    c.innerHTML = '';
    PARTS.filter(function (p) { return state.exploreCat === 'All' || p.cat === state.exploreCat; })
      .forEach(function (part) {
        var b = document.createElement('button');
        b.className = 'explore-btn' + (state.explorePart && state.explorePart.id === part.id ? ' active' : '');
        var sw = document.createElement('span');
        sw.className = 'ex-swatch';
        sw.style.background = part.swatch;
        b.appendChild(sw);
        b.appendChild(document.createTextNode(part.id + '. ' + part.name));
        b.addEventListener('click', function () {
          state.explorePart = part;
          buildExploreGrid();
          showExploreInfo(part);
          drawExploreCanvas();
        });
        c.appendChild(b);
      });
  }

  function showExploreInfo(part) {
    var c = $('explore-info');
    if (!c) return;
    c.innerHTML = '';
    var h3 = document.createElement('h3');
    h3.textContent = part.id + '. ' + part.name;
    c.appendChild(h3);
    var catP = document.createElement('p');
    catP.innerHTML = '<strong>Category:</strong> ' + part.cat;
    c.appendChild(catP);
    var descP = document.createElement('p');
    descP.textContent = part.desc;
    c.appendChild(descP);
    var ex = getPartExtra(part);
    if (ex) {
      var d = document.createElement('div');
      d.className = 'example-box';
      d.innerHTML = ex;
      c.appendChild(d);
    }
  }

  function getPartExtra(part) {
    var extras = {
      'Bed': '<strong>Material:</strong> High-grade grey cast iron (FG 220)<br><strong>Key Feature:</strong> V-ways provide accurate alignment and guidance.',
      'Headstock': '<strong>Contains:</strong> Back gear, geared mechanism, spindle bearings<br><strong>Function:</strong> Provides multiple spindle speeds.',
      'Spindle': '<strong>Taper:</strong> MT3 to MT6<br><strong>Bore:</strong> Allows bar stock to pass through.',
      'Chuck (3-jaw)': '<strong>Centering accuracy:</strong> ±0.05 mm typical<br><strong>Holds:</strong> Round, hexagonal, polygonal shapes.',
      'Chuck (4-jaw)': '<strong>Centering accuracy:</strong> ±0.01 mm with dial indicator<br><strong>Advantage:</strong> Independent jaws for irregular shapes.',
      'Faceplate': '<strong>Mounting:</strong> Threaded spindle nose or cam-lock<br><strong>Usage:</strong> Large/irregular workpieces.',
      'Tailstock': '<strong>Alignment:</strong> Can be offset for taper turning<br><strong>Quill travel:</strong> 100–150 mm typical.',
      'Cross-slide': '<strong>Travel:</strong> 1 division = 0.02 mm on diameter<br><strong>Note:</strong> 1 mm cross-slide = 0.5 mm DOC.',
      'Compound Rest': '<strong>Swivel range:</strong> 360°<br><strong>Uses:</strong> 29° for threading, half-taper for tapers.',
      'Lead Screw': '<strong>Thread:</strong> Acme thread<br><strong>Pitch:</strong> Determines thread pitches that can be cut.',
      'Cutting Tool': '<strong>Materials:</strong> HSS, Carbide, Ceramic, CBN, Diamond<br><strong>Geometry:</strong> Rake, clearance, nose radius.',
      'Coolant Nozzle': '<strong>Flow:</strong> 5–30 L/min typical<br><strong>Purpose:</strong> Cooling, chip flushing, surface finish.'
    };
    return extras[part.name] || null;
  }

  /* ═══════════════════════════════════════════════════════════════
     S14  EXPLORE CANVAS (compact realistic lathe with labels)
     ═══════════════════════════════════════════════════════════════ */
  function drawExploreCanvas() {
    if (!exCtx) return;
    var ctx = exCtx;
    var W = 900, H = 400;   /* logical space; backing is DPR-scaled */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0e14'; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = TEXT;
    ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Centre Lathe — Parts Identification Diagram', W / 2, 20);

    drawExploreLathe(ctx, W, H);

    if (state.explorePart) highlightExplorePart(ctx, state.explorePart, W, H);
  }

  function drawExploreLathe(ctx, W, H) {
    var mx = 50, my = 50, mw = W - 100, mh = H - 120;

    // Floor shadow
    var shGrad = ctx.createRadialGradient(mx + mw / 2, my + mh + 30, 0, mx + mw / 2, my + mh + 30, mw * 0.5);
    shGrad.addColorStop(0, 'rgba(0,0,0,0.5)');
    shGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(mx + mw / 2, my + mh + 35, mw * 0.45, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPaintedBox(ctx, mx + 50, my + mh, 80, 50, true);
    drawPaintedBox(ctx, mx + mw - 130, my + mh, 80, 50, true);

    // Chip pan
    var panY = my + mh - 10;
    ctx.fillStyle = COL.pan;
    ctx.beginPath();
    ctx.moveTo(mx + 30, panY);
    ctx.lineTo(mx + mw - 30, panY);
    ctx.lineTo(mx + mw - 50, panY + 20);
    ctx.lineTo(mx + 50, panY + 20);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COL.panEdge; ctx.stroke();

    // Bed
    var bedY = my + mh - 65, bedH = 55;
    var bedG = ctx.createLinearGradient(0, bedY, 0, bedY + bedH);
    bedG.addColorStop(0, COL.bedTop);
    bedG.addColorStop(0.2, COL.paintMid);
    bedG.addColorStop(0.8, COL.paintLight);
    bedG.addColorStop(1, COL.paintDark);
    ctx.fillStyle = bedG;
    ctx.fillRect(mx, bedY, mw, bedH);
    ctx.strokeStyle = COL.castIron; ctx.lineWidth = 1.5; ctx.strokeRect(mx, bedY, mw, bedH);
    // V-ways
    ctx.fillStyle = COL.bedTop;
    ctx.fillRect(mx, bedY, mw, 12);

    // Lead screw + feed rod
    var lsY = bedY + bedH + 8;
    drawLeadScrew(ctx, mx + 110, lsY, mx + mw - 60);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = COL.steel;
    ctx.beginPath(); ctx.moveTo(mx + 110, lsY + 14); ctx.lineTo(mx + mw - 60, lsY + 14); ctx.stroke();
    ctx.lineCap = 'butt';

    // Headstock
    var hsX = mx, hsY = my + 30, hsW = 140, hsH = mh - 95;
    drawHeadstock(ctx, hsX, hsY, hsW, hsH);

    var spindleY = my + 110;
    drawSpindleNose(ctx, hsX + hsW - 8, spindleY, 25, 14);

    // Chuck (side view)
    var chuckW = 38;
    var chuckR = 48;
    var chuckX = hsX + hsW + 14 + chuckW / 2;
    drawChuck(ctx, chuckX, spindleY, chuckR, chuckW, 0);

    // Workpiece
    var wpX = chuckX + chuckW / 2 - 2;
    var wpEndX = mx + mw - 130;
    var wpR = 26;
    drawWorkpiece(ctx, wpX, spindleY, wpEndX - wpX, wpR, OPERATIONS[0], MATERIALS[0]);

    // Tailstock
    var tsX = mx + mw - 110, tsY2 = my + 50, tsW = 110, tsH2 = mh - 115;
    drawTailstock(ctx, tsX, tsY2, tsW, tsH2, spindleY);

    // Carriage
    var carrX = mx + mw / 2 - 50, carrY = my + 130;
    var carrW = 100, carrH = bedY - carrY;
    // bedBottom (9th arg) was omitted here, so the apron's height came out NaN
    // and createLinearGradient threw — Explore Parts rendered no carriage at all.
    // Same definition the Simulate view uses: the bottom of the bed casting.
    drawCarriage(ctx, carrX, carrY, carrW, carrH, OPERATIONS[0], spindleY, wpR, bedY + bedH);

    // Labels with leader lines
    drawExploreLabels(ctx, mx, my, mw, mh, hsX, hsW, chuckX, spindleY, tsX, tsY2, tsW, tsH2, carrX, carrY, carrW, carrH, bedY, lsY);
  }

  function drawExploreLabels(ctx, mx, my, mw, mh, hsX, hsW, chuckX, spindleY, tsX, tsY2, tsW, tsH2, carrX, carrY, carrW, carrH, bedY, lsY) {
    ctx.font = '10px sans-serif'; ctx.textAlign = 'left';
    var labels = [
      { num: 1,  text: 'Bed',           px: mx + mw / 2 + 80, py: bedY + 25, lx: mx + mw / 2 + 130, ly: bedY + 55 },
      { num: 2,  text: 'Headstock',     px: hsX + hsW / 2, py: my + 35, lx: hsX - 10, ly: my + 10 },
      { num: 3,  text: 'Spindle',       px: hsX + hsW + 5, py: spindleY, lx: hsX + hsW + 5, ly: spindleY - 35 },
      { num: 4,  text: 'Chuck (3-jaw)', px: chuckX, py: spindleY - 30, lx: chuckX - 20, ly: spindleY - 65 },
      { num: 7,  text: 'Tailstock',     px: tsX + tsW / 2, py: tsY2 + 20, lx: tsX + tsW + 10, ly: tsY2 - 5 },
      { num: 8,  text: 'Quill',         px: tsX - 18, py: spindleY, lx: tsX - 80, ly: spindleY - 25 },
      { num: 9,  text: 'Dead Center',   px: tsX - 45, py: spindleY, lx: tsX - 120, ly: spindleY + 20 },
      { num: 11, text: 'Carriage',      px: carrX + carrW / 2, py: carrY + 35, lx: carrX - 60, ly: carrY + carrH + 8 },
      { num: 12, text: 'Cross-slide',   px: carrX + carrW / 2, py: carrY - 3, lx: carrX + carrW + 20, ly: carrY - 12 },
      { num: 13, text: 'Compound Rest', px: carrX + carrW / 2, py: carrY - 16, lx: carrX + carrW + 20, ly: carrY - 30 },
      { num: 14, text: 'Tool Post',     px: carrX + carrW / 2, py: carrY - 28, lx: carrX + carrW + 20, ly: carrY - 50 },
      { num: 15, text: 'Apron',         px: carrX + carrW / 2, py: carrY + carrH - 10, lx: carrX - 60, ly: carrY + carrH + 30 },
      { num: 16, text: 'Lead Screw',    px: mx + mw / 2, py: lsY, lx: mx + mw / 2 - 140, ly: lsY + 25 },
      { num: 17, text: 'Feed Rod',      px: mx + mw / 2, py: lsY + 14, lx: mx + mw / 2 - 140, ly: lsY + 38 },
      { num: 22, text: 'Chip Pan',      px: mx + mw / 2, py: my + mh - 5, lx: mx + mw / 2 + 140, ly: my + mh + 15 }
    ];
    labels.forEach(function (lbl) {
      var sel = state.explorePart && state.explorePart.id === lbl.num;
      ctx.strokeStyle = sel ? ACCENT : 'rgba(30,136,229,0.4)';
      ctx.lineWidth = sel ? 1.5 : 0.8;
      ctx.beginPath(); ctx.moveTo(lbl.px, lbl.py); ctx.lineTo(lbl.lx, lbl.ly); ctx.stroke();
      ctx.fillStyle = sel ? ACCENT : hexToRGBA(ACCENT, 0.6);
      ctx.beginPath(); ctx.arc(lbl.px, lbl.py, sel ? 4 : 3, 0, Math.PI * 2); ctx.fill();
      var label = lbl.num + '. ' + lbl.text;
      var tw = ctx.measureText(label).width;
      ctx.fillStyle = sel ? 'rgba(30,136,229,0.25)' : 'rgba(10,14,20,0.9)';
      ctx.fillRect(lbl.lx - 3, lbl.ly - 10, tw + 6, 13);
      ctx.fillStyle = sel ? ACCENT : TEXT;
      ctx.font = sel ? 'bold 10px sans-serif' : '10px sans-serif';
      ctx.fillText(label, lbl.lx, lbl.ly);
    });
  }

  function highlightExplorePart(ctx, part) {
    // Simplified: just glow a circle around the labeled point
    ctx.save();
    ctx.fillStyle = ACCENT;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Selected: ' + part.name, 900 / 2, 400 - 14);   /* logical space */
    ctx.restore();
  }

  /* ═══════════════════════════════════════════════════════════════
     S15  PRACTICE MODE
     ═══════════════════════════════════════════════════════════════ */
  var PRACTICE_GENERATORS = [
    function () {
      var D = randInt(20, 150), N = randInt(100, 1500);
      var V = Math.PI * D * N / 1000;
      return { prompt: 'A workpiece of diameter <strong>' + D + ' mm</strong> rotates at <strong>' + N + ' RPM</strong>. Calculate the cutting speed.',
        unit: 'm/min', answer: roundN(V, 2),
        solution: 'V = π × D × N / 1000<br>V = π × ' + D + ' × ' + N + ' / 1000<br><strong>V = ' + roundN(V, 2) + ' m/min</strong>' };
    },
    function () {
      var D = randInt(20, 120), V = randInt(15, 100);
      var N = (V * 1000) / (Math.PI * D);
      return { prompt: 'What RPM is needed for a cutting speed of <strong>' + V + ' m/min</strong> on a workpiece of diameter <strong>' + D + ' mm</strong>?',
        unit: 'RPM', answer: roundN(N, 1),
        solution: 'N = V × 1000 / (π × D)<br>N = ' + V + ' × 1000 / (π × ' + D + ')<br><strong>N = ' + roundN(N, 1) + ' RPM</strong>' };
    },
    function () {
      var D = randInt(30, 100), N = randInt(200, 1000);
      var f = roundN(randFloat(0.1, 0.5), 2), d = roundN(randFloat(0.5, 4.0), 1);
      var V = Math.PI * D * N / 1000, MRR = V * f * d * 1000;
      return { prompt: 'Calculate the MRR for turning: D=<strong>' + D + ' mm</strong>, N=<strong>' + N + ' RPM</strong>, f=<strong>' + f + ' mm/rev</strong>, d=<strong>' + d + ' mm</strong>.',
        unit: 'mm³/min', answer: roundN(MRR, 1),
        solution: 'V = π × ' + D + ' × ' + N + ' / 1000 = ' + roundN(V, 2) + ' m/min<br>MRR = V × f × d × 1000<br><strong>MRR = ' + roundN(MRR, 1) + ' mm³/min</strong>' };
    },
    function () {
      var L = randInt(50, 200), f = roundN(randFloat(0.1, 0.4), 2), N = randInt(200, 1000);
      var t = L / (f * N) * 60;
      return { prompt: 'Calculate machining time for turning a length of <strong>' + L + ' mm</strong> at N=<strong>' + N + ' RPM</strong> and f=<strong>' + f + ' mm/rev</strong>.',
        unit: 'seconds', answer: roundN(t, 2),
        solution: 't = L / (f × N) × 60<br><strong>t = ' + roundN(t, 2) + ' s</strong>' };
    },
    function () {
      var D = randInt(40, 120), f = roundN(randFloat(0.1, 0.4), 2), N = randInt(200, 800);
      var t = (D / 2) / (f * N) * 60;
      return { prompt: 'Calculate machining time for facing a workpiece of diameter <strong>' + D + ' mm</strong> at N=<strong>' + N + ' RPM</strong>, f=<strong>' + f + ' mm/rev</strong>.',
        unit: 'seconds', answer: roundN(t, 2),
        solution: 't = (D/2) / (f × N) × 60<br><strong>t = ' + roundN(t, 2) + ' s</strong>' };
    },
    function () {
      var mi = randInt(0, MATERIALS.length - 1), mat = MATERIALS[mi];
      var f = roundN(randFloat(0.1, 0.5), 2), d = roundN(randFloat(0.5, 4.0), 1);
      var Fc = mat.Ks * f * d;
      return { prompt: 'Calculate cutting force for <strong>' + mat.name + '</strong> (Ks=' + mat.Ks + ' N/mm²) with f=<strong>' + f + ' mm/rev</strong> and d=<strong>' + d + ' mm</strong>.',
        unit: 'N', answer: roundN(Fc, 1),
        solution: 'Fc = Ks × f × d<br><strong>Fc = ' + roundN(Fc, 1) + ' N</strong>' };
    },
    function () {
      var Fc = randInt(500, 5000), V = randInt(15, 80);
      var P = Fc * V / 60000;
      return { prompt: 'Calculate the power required if Fc=<strong>' + Fc + ' N</strong> and V=<strong>' + V + ' m/min</strong>.',
        unit: 'kW', answer: roundN(P, 3),
        solution: 'P = Fc × V / 60000<br><strong>P = ' + roundN(P, 3) + ' kW</strong>' };
    },
    function () {
      var f = roundN(randFloat(0.05, 0.4), 2), r = roundN(randFloat(0.4, 1.6), 1);
      var Ra = (f * f) / (32 * r) * 1000;
      return { prompt: 'Calculate Ra for f=<strong>' + f + ' mm/rev</strong> and nose radius r=<strong>' + r + ' mm</strong>.',
        unit: 'µm', answer: roundN(Ra, 2),
        solution: 'Ra = f² / (32 × r) × 1000<br><strong>Ra = ' + roundN(Ra, 2) + ' µm</strong>' };
    },
    function () {
      var D = randInt(40, 100), s = D - randInt(5, 30), L = randInt(50, 200);
      var a = Math.atan((D - s) / (2 * L)) * 180 / Math.PI;
      return { prompt: 'Calculate the taper half-angle for D=<strong>' + D + ' mm</strong>, d=<strong>' + s + ' mm</strong>, L=<strong>' + L + ' mm</strong>.',
        unit: 'degrees', answer: roundN(a, 2),
        solution: 'α = arctan((D - d) / (2 × L))<br><strong>α = ' + roundN(a, 2) + '°</strong>' };
    },
    function () {
      var tpi = randInt(8, 32), p = 25.4 / tpi;
      return { prompt: 'A thread has <strong>' + tpi + ' TPI</strong>. Calculate the pitch in mm.',
        unit: 'mm', answer: roundN(p, 3),
        solution: 'Pitch = 25.4 / TPI<br><strong>Pitch = ' + roundN(p, 3) + ' mm</strong>' };
    },
    function () {
      var D1 = randInt(50, 150), D2 = D1 - randInt(2, 20);
      var doc = (D1 - D2) / 2;
      return { prompt: 'Workpiece turned from <strong>' + D1 + ' mm</strong> to <strong>' + D2 + ' mm</strong>. What is the depth of cut?',
        unit: 'mm', answer: roundN(doc, 1),
        solution: 'd = (D₁ - D₂) / 2<br><strong>d = ' + roundN(doc, 1) + ' mm</strong>' };
    },
    function () {
      var td = randInt(5, 20), mD = roundN(randFloat(1.5, 4.0), 1);
      var p = Math.ceil(td / mD);
      return { prompt: 'Total material on radius: <strong>' + td + ' mm</strong>. Max DOC: <strong>' + mD + ' mm</strong>. How many passes?',
        unit: 'passes', answer: p,
        solution: 'Passes = ⌈ ' + td + ' / ' + mD + ' ⌉ = <strong>' + p + '</strong>' };
    }
  ];

  function generatePractice() {
    var i = randInt(0, PRACTICE_GENERATORS.length - 1);
    state.pracProb = PRACTICE_GENERATORS[i]();
    state.pracAnswered = false;
    var p = $('practice-prompt'), inp = $('practice-input'), u = $('practice-unit');
    var fb = $('practice-feedback'), sol = $('practice-solution'), sb = $('btn-show-sol');
    if (p) p.innerHTML = state.pracProb.prompt;
    if (inp) { inp.value = ''; inp.disabled = false; inp.focus(); }
    if (u) u.textContent = state.pracProb.unit;
    if (fb) { fb.textContent = ''; fb.className = 'practice-feedback'; }
    if (sol) { sol.style.display = 'none'; sol.innerHTML = ''; }
    if (sb) sb.style.display = 'none';
  }
  function checkPractice() {
    if (!state.pracProb || state.pracAnswered) return;
    var inp = $('practice-input'), fb = $('practice-feedback'), sb = $('btn-show-sol');
    if (!inp || !fb) return;
    var u = parseFloat(inp.value);
    if (isNaN(u)) { fb.textContent = 'Please enter a number.'; fb.className = 'practice-feedback err'; return; }
    var c = state.pracProb.answer, tol = Math.max(Math.abs(c) * 0.05, 0.1);
    state.pracAnswered = true; state.pracTotal++; inp.disabled = true;
    if (Math.abs(u - c) <= tol) { state.pracCorrect++; fb.textContent = 'Correct!'; fb.className = 'practice-feedback ok'; }
    else { fb.textContent = 'Incorrect. Correct answer: ' + c + ' ' + state.pracProb.unit; fb.className = 'practice-feedback err'; if (sb) sb.style.display = ''; }
    var s = $('practice-score'); if (s) s.textContent = state.pracCorrect + ' / ' + state.pracTotal;
  }
  function showPracticeSolution() {
    var s = $('practice-solution');
    if (s && state.pracProb) { s.innerHTML = state.pracProb.solution; s.style.display = 'block'; }
  }
  function wirePractice() {
    var bc = $('btn-check'), bs = $('btn-show-sol'), bn = $('btn-next-prob'), inp = $('practice-input');
    if (bc) bc.addEventListener('click', checkPractice);
    if (bs) bs.addEventListener('click', showPracticeSolution);
    if (bn) bn.addEventListener('click', generatePractice);
    if (inp) inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') checkPractice(); });
  }

  /* ═══════════════════════════════════════════════════════════════
     S16  QUIZ MODE
     ═══════════════════════════════════════════════════════════════ */
  var QUIZ_BANK_GENERATORS = [
    function () { return { type: 'mcq', prompt: 'Which part houses the main spindle and speed-change gears?', options: ['Headstock', 'Tailstock', 'Carriage', 'Apron'], correct: 0 }; },
    function () { return { type: 'mcq', prompt: 'The lead screw is primarily used for which operation?', options: ['Turning', 'Threading', 'Facing', 'Knurling'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'Which chuck type has independently adjustable jaws?', options: ['3-jaw chuck', '4-jaw chuck', 'Collet chuck', 'Magnetic chuck'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'The compound rest is set at 29° for which operation?', options: ['Turning', 'Facing', 'Threading', 'Boring'], correct: 2 }; },
    function () { return { type: 'mcq', prompt: 'Which operation produces a conical (tapered) surface?', options: ['Turning', 'Knurling', 'Taper Turning', 'Facing'], correct: 2 }; },
    function () { return { type: 'mcq', prompt: 'What is the formula for cutting speed in a lathe?', options: ['V = πDN/1000', 'V = DN/1000', 'V = 2πDN/1000', 'V = πD²N/1000'], correct: 0 }; },
    function () { return { type: 'mcq', prompt: 'The apron is located on which part of the lathe?', options: ['Headstock', 'Tailstock', 'Front face of carriage', 'Bed'], correct: 2 }; },
    function () { return { type: 'mcq', prompt: 'Which device holds irregular workpieces that cannot fit a chuck?', options: ['Live center', 'Faceplate', 'Steady rest', 'Follow rest'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'A live center differs from a dead center because it:', options: ['Mounted in the headstock', 'Rotates with the workpiece on bearings', 'Has a Morse taper only', 'Used only for boring'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'Before starting the lathe you should always:', options: ['Apply cutting fluid', 'Check chuck key is removed and workpiece is secure', 'Set maximum RPM', 'Engage the half-nut lever'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'Knurling is performed to:', options: ['Reduce diameter', 'Create a grip pattern on the surface', 'Cut internal threads', 'Face the end surface'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'The depth of cut when reducing diameter from 60 mm to 52 mm is:', options: ['8 mm', '4 mm', '2 mm', '6 mm'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'The steady rest supports the workpiece to prevent:', options: ['Overheating', 'Vibration and deflection of long workpieces', 'Chuck loosening', 'Lead screw wear'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'Increasing tool nose radius will:', options: ['Increase surface roughness', 'Decrease surface roughness (better finish)', 'Not affect finish', 'Increase cutting speed'], correct: 1 }; },
    function () { return { type: 'mcq', prompt: 'The cross-slide moves:', options: ['Along the bed axis', 'Perpendicular to the bed axis', 'At 45°', 'Vertically'], correct: 1 }; },
    function () { var D = randInt(30, 100), N = randInt(200, 1000); var V = Math.PI * D * N / 1000; return { type: 'numeric', prompt: 'Calculate cutting speed (m/min) for D=' + D + ' mm, N=' + N + ' RPM.', unit: 'm/min', answer: roundN(V, 1) }; },
    function () { var mi = randInt(0, MATERIALS.length - 1), mat = MATERIALS[mi]; var f = roundN(randFloat(0.1, 0.4), 2), d = roundN(randFloat(1, 3), 1); var Fc = mat.Ks * f * d; return { type: 'numeric', prompt: 'Cutting force for ' + mat.name + ' (Ks=' + mat.Ks + '), f=' + f + ' mm/rev, d=' + d + ' mm?', unit: 'N', answer: roundN(Fc, 0) }; },
    function () { var Fc = randInt(800, 4000), V = randInt(20, 60); var P = Fc * V / 60000; return { type: 'numeric', prompt: 'Power required for Fc=' + Fc + ' N, V=' + V + ' m/min?', unit: 'kW', answer: roundN(P, 2) }; },
    function () { var L = randInt(60, 150), f = roundN(randFloat(0.1, 0.3), 2), N = randInt(300, 800); var t = L / (f * N) * 60; return { type: 'numeric', prompt: 'Machining time for L=' + L + ' mm, f=' + f + ' mm/rev, N=' + N + ' RPM?', unit: 'sec', answer: roundN(t, 1) }; },
    function () { var f = roundN(randFloat(0.08, 0.3), 2), r = 0.8; var Ra = (f * f) / (32 * r) * 1000; return { type: 'numeric', prompt: 'Ra for f=' + f + ' mm/rev, nose radius 0.8 mm?', unit: 'µm', answer: roundN(Ra, 2) }; },
    function () { var D = randInt(25, 80), V = randInt(20, 60); var N = V * 1000 / (Math.PI * D); return { type: 'numeric', prompt: 'RPM for V=' + V + ' m/min on D=' + D + ' mm?', unit: 'RPM', answer: roundN(N, 0) }; },
    function () { var D1 = randInt(50, 120), D2 = D1 - randInt(4, 16); return { type: 'numeric', prompt: 'Depth of cut from ' + D1 + ' mm to ' + D2 + ' mm?', unit: 'mm', answer: (D1 - D2) / 2 }; }
  ];

  function generateQuiz() {
    state.quizDone = false; state.quizAnswers = []; state.quizIdx = 0; state.quizAnswered = false;
    var mcqs = [], nums = [];
    QUIZ_BANK_GENERATORS.forEach(function (g) { var q = g(); if (q.type === 'mcq') mcqs.push(g); else nums.push(g); });
    shuffleArr(mcqs); shuffleArr(nums);
    var sel = [];
    for (var i = 0; i < Math.min(10, mcqs.length); i++) sel.push(mcqs[i]);
    for (var j = 0; j < Math.min(5, nums.length); j++) sel.push(nums[j]);
    shuffleArr(sel);
    state.quizBank = sel.map(function (g) { return g(); });
    showQuizQuestion();
    var r = $('quiz-result'), p = $('quiz-panel');
    if (r) r.style.display = 'none';
    if (p) p.style.display = '';
  }

  function showQuizQuestion() {
    if (state.quizIdx >= state.quizBank.length) { showQuizResult(); return; }
    var q = state.quizBank[state.quizIdx];
    state.quizAnswered = false;
    var c = $('quiz-counter'), p = $('quiz-prompt'), o = $('quiz-options'),
        nr = $('quiz-num-row'), ni = $('quiz-num-input'), nu = $('quiz-num-unit'),
        fb = $('quiz-feedback'), nb = $('btn-quiz-next');
    if (c) c.textContent = 'Question ' + (state.quizIdx + 1) + ' of ' + state.quizBank.length;
    if (p) p.textContent = q.prompt;
    if (fb) { fb.textContent = ''; fb.className = 'quiz-feedback'; }
    if (nb) nb.style.display = 'none';
    if (q.type === 'mcq') {
      if (o) {
        o.innerHTML = ''; o.style.display = '';
        q.options.forEach(function (opt, idx) {
          var b = document.createElement('button');
          b.className = 'quiz-opt'; b.textContent = opt;
          b.addEventListener('click', function () { if (!state.quizAnswered) handleQuizMCQ(idx); });
          o.appendChild(b);
        });
      }
      if (nr) nr.style.display = 'none';
    } else {
      if (o) { o.innerHTML = ''; o.style.display = 'none'; }
      if (nr) nr.style.display = '';
      if (ni) { ni.value = ''; ni.disabled = false; }
      if (nu) nu.textContent = q.unit;
    }
  }

  function handleQuizMCQ(idx) {
    if (state.quizAnswered) return;
    state.quizAnswered = true;
    var q = state.quizBank[state.quizIdx];
    var ok = idx === q.correct;
    state.quizAnswers.push({ question: q.prompt, correct: ok, userAnswer: q.options[idx], correctAnswer: q.options[q.correct] });
    var o = $('quiz-options');
    if (o) {
      var bs = o.querySelectorAll('.quiz-opt');
      bs.forEach(function (b, i) { b.classList.add('disabled'); if (i === q.correct) b.classList.add('correct'); if (i === idx && !ok) b.classList.add('wrong'); });
    }
    var fb = $('quiz-feedback');
    if (fb) { fb.textContent = ok ? 'Correct!' : 'Incorrect. Answer: ' + q.options[q.correct]; fb.className = 'quiz-feedback ' + (ok ? 'ok' : 'err'); }
    var nb = $('btn-quiz-next'); if (nb) nb.style.display = '';
  }

  function handleQuizNumeric() {
    if (state.quizAnswered) return;
    var q = state.quizBank[state.quizIdx];
    var inp = $('quiz-num-input'); if (!inp) return;
    var u = parseFloat(inp.value);
    if (isNaN(u)) { var fb = $('quiz-feedback'); if (fb) { fb.textContent = 'Please enter a number.'; fb.className = 'quiz-feedback err'; } return; }
    state.quizAnswered = true; inp.disabled = true;
    var tol = Math.max(Math.abs(q.answer) * 0.05, 0.5);
    var ok = Math.abs(u - q.answer) <= tol;
    state.quizAnswers.push({ question: q.prompt, correct: ok, userAnswer: u + ' ' + q.unit, correctAnswer: q.answer + ' ' + q.unit });
    var fbe = $('quiz-feedback');
    if (fbe) { fbe.textContent = ok ? 'Correct!' : 'Incorrect. Answer: ' + q.answer + ' ' + q.unit; fbe.className = 'quiz-feedback ' + (ok ? 'ok' : 'err'); }
    var nb = $('btn-quiz-next'); if (nb) nb.style.display = '';
  }

  function nextQuizQuestion() { state.quizIdx++; showQuizQuestion(); }
  function showQuizResult() {
    state.quizDone = true;
    var p = $('quiz-panel'), r = $('quiz-result');
    if (p) p.style.display = 'none';
    if (r) r.style.display = '';
    var c = state.quizAnswers.filter(function (a) { return a.correct; }).length;
    var t = state.quizAnswers.length, pct = t > 0 ? c / t : 0;
    var s = $('qr-stars');
    if (s) {
      var sc = pct >= 0.9 ? 5 : pct >= 0.7 ? 4 : pct >= 0.5 ? 3 : pct >= 0.3 ? 2 : 1;
      s.textContent = '';
      for (var i = 0; i < 5; i++) s.textContent += i < sc ? '★' : '☆';
    }
    var se = $('qr-score');
    if (se) { se.textContent = c + ' / ' + t + ' (' + Math.round(pct * 100) + '%)'; se.className = 'qr-score ' + (pct >= 0.8 ? 'perfect' : pct >= 0.5 ? 'good' : 'poor'); }
    var tb = $('qr-table');
    if (tb) {
      var b = tb.querySelector('tbody'); if (b) {
        b.innerHTML = '';
        state.quizAnswers.forEach(function (a, i) {
          var tr = document.createElement('tr');
          tr.className = 'qr-row ' + (a.correct ? 'ok' : 'err');
          tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + a.question.substring(0, 60) + '...</td><td>' + (a.correct ? '✔' : '✘') + '</td>';
          b.appendChild(tr);
        });
      }
    }
  }
  function wireQuiz() {
    var sb = $('btn-quiz-submit'), nb = $('btn-quiz-next'), wb = $('btn-new-quiz'), ni = $('quiz-num-input');
    if (sb) sb.addEventListener('click', handleQuizNumeric);
    if (nb) nb.addEventListener('click', nextQuizQuestion);
    if (wb) wb.addEventListener('click', generateQuiz);
    if (ni) ni.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleQuizNumeric(); });
  }

  /* ═══════════════════════════════════════════════════════════════
     S17  MODE SWITCHING
     ═══════════════════════════════════════════════════════════════ */
  function setMode(mode) {
    state.mode = mode;
    var tabs = document.querySelectorAll('#mode-tabs .pill');
    tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-mode') === mode); });
    var sim = $('sim-wrapper'), explore = $('explore-wrapper'), practice = $('practice-wrapper'), quiz = $('quiz-wrapper');
    hide(sim); hide(explore); hide(practice); hide(quiz);
    if (mode === 'simulate') {
      show(sim);
      drawMachine(); drawGraph();
    } else if (mode === 'explore') {
      show(explore);
      buildExploreCats(); buildExploreGrid(); drawExploreCanvas();
      if (!state.explorePart) {
        state.explorePart = PARTS[0];
        buildExploreGrid(); showExploreInfo(PARTS[0]); drawExploreCanvas();
      }
    } else if (mode === 'practice') {
      show(practice);
      if (!state.pracProb) generatePractice();
    } else if (mode === 'quiz') {
      show(quiz);
      if (state.quizBank.length === 0) generateQuiz();
    }
  }

  function wireModeTabs() {
    var tabs = document.querySelectorAll('#mode-tabs .pill');
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { setMode(t.getAttribute('data-mode')); });
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     S18  UTILITY DRAWING HELPERS
     ═══════════════════════════════════════════════════════════════ */
  function roundRect(ctx, x, y, w, h, r) {
    if (r === undefined) r = 4;
    var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  /* ═══════════════════════════════════════════════════════════════
     S19  INITIALIZATION
     ═══════════════════════════════════════════════════════════════ */
  function init() {
    initCanvases();
    buildOpPills();
    buildMatPills();
    wireSliders();
    wireButtons();
    wireToolbar();
    wireModeTabs();
    wirePractice();
    wireQuiz();
    wireMachineInteraction();
    buildPartsLegend();
    updatePhysics();
    updateReadouts();
    updateBadges();
    setMode('simulate');
    drawMachine();
    drawGraph();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
