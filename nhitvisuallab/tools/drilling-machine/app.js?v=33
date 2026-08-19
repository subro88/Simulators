/* ═══════════════════════════════════════════════════════════════════════
   Drilling Machine Simulator — app.js
   Column Drill Press · Parts Identification · Cutting Parameters
   Simulate · Explore · Practice · Quiz
   Accent: #43a047  (green)
   ═══════════════════════════════════════════════════════════════════════ */
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
    var c = a.slice();
    for (var i = c.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = c[i]; c[i] = c[j]; c[j] = t;
    }
    return c;
  }
  function roundRect(ctx2, x, y, w, h, r) {
    if (w < 0) { x += w; w = -w; }
    if (h < 0) { y += h; h = -h; }
    r = Math.min(r, w / 2, h / 2);
    ctx2.beginPath();
    ctx2.moveTo(x + r, y);
    ctx2.lineTo(x + w - r, y);
    ctx2.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx2.lineTo(x + w, y + h - r);
    ctx2.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx2.lineTo(x + r, y + h);
    ctx2.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx2.lineTo(x, y + r);
    ctx2.quadraticCurveTo(x, y, x + r, y);
    ctx2.closePath();
  }
  function hexToRGBA(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  function drawLeaderLine(ctx2, x1, y1, x2, y2, text, align) {
    ctx2.save();
    ctx2.strokeStyle = '#6b7a99';
    ctx2.lineWidth = 0.8;
    ctx2.setLineDash([3, 3]);
    ctx2.beginPath();
    ctx2.moveTo(x1, y1);
    ctx2.lineTo(x2, y2);
    ctx2.stroke();
    ctx2.setLineDash([]);
    /* dot at source */
    ctx2.fillStyle = ACCENT;
    ctx2.beginPath();
    ctx2.arc(x1, y1, 2.5, 0, Math.PI * 2);
    ctx2.fill();
    /* text */
    ctx2.fillStyle = '#dde3f0';
    ctx2.font = '600 10px "Segoe UI", system-ui, sans-serif';
    ctx2.textAlign = align || 'left';
    ctx2.textBaseline = 'middle';
    ctx2.fillText(text, x2 + (align === 'right' ? -4 : 4), y2);
    ctx2.restore();
  }
  function drawArrow(ctx2, x1, y1, x2, y2, color, w) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    var ux = dx / len, uy = dy / len;
    var headLen = Math.min(10, len * 0.3);
    ctx2.save();
    ctx2.strokeStyle = color || '#dde3f0';
    ctx2.fillStyle = color || '#dde3f0';
    ctx2.lineWidth = w || 2;
    ctx2.beginPath();
    ctx2.moveTo(x1, y1);
    ctx2.lineTo(x2 - ux * headLen, y2 - uy * headLen);
    ctx2.stroke();
    ctx2.beginPath();
    ctx2.moveTo(x2, y2);
    ctx2.lineTo(x2 - ux * headLen - uy * headLen * 0.4, y2 - uy * headLen + ux * headLen * 0.4);
    ctx2.lineTo(x2 - ux * headLen + uy * headLen * 0.4, y2 - uy * headLen - ux * headLen * 0.4);
    ctx2.closePath();
    ctx2.fill();
    ctx2.restore();
  }

  /* ═══════════════════════════════════════════════════════════════
     S2  CONSTANTS & DATA
     ═══════════════════════════════════════════════════════════════ */
  var ACCENT = '#43a047';
  var ACCENT_LO = 'rgba(67,160,71,0.22)';
  var BG = '#0d1117';
  var TEXT = '#dde3f0';
  var DIM = '#6b7a99';
  var SURFACE = '#161b27';
  var BORDER = '#2a3050';

  var OPERATIONS = [
    { id: 'drilling',       name: 'Drilling',       desc: 'Standard hole making with a twist drill', kFactor: 1.0, feedFactor: 1.0 },
    { id: 'reaming',        name: 'Reaming',        desc: 'Finishing to precise size and surface finish', kFactor: 0.4, feedFactor: 2.0 },
    { id: 'boring',         name: 'Boring',         desc: 'Enlarging an existing hole to precise diameter', kFactor: 0.6, feedFactor: 0.8 },
    { id: 'counterboring',  name: 'Counterboring',  desc: 'Flat-bottom recess for bolt heads', kFactor: 0.7, feedFactor: 0.6 },
    { id: 'countersinking', name: 'Countersinking', desc: 'Conical recess (90 deg) for screw heads', kFactor: 0.5, feedFactor: 0.5 },
    { id: 'tapping',        name: 'Tapping',        desc: 'Cutting internal threads with a tap', kFactor: 0.8, feedFactor: 1.0 }
  ];

  /* ── DRILL BIT TYPES (ISO standard) ── */
  var DRILL_BITS = [
    { id: 'twist',       name: 'Twist Drill',      standard: 'DIN 338',  pointAngle: 118, flutes: 2,
      desc: 'General-purpose HSS twist drill with two helical flutes for chip evacuation. Most common drill type for metals.' },
    { id: 'center',      name: 'Center Drill',      standard: 'DIN 333',  pointAngle: 60,  flutes: 2,
      desc: 'Combined drill and countersink for starting holes or creating lathe centre points. Short and rigid.' },
    { id: 'step',        name: 'Step Drill',         standard: 'ISO 5765', pointAngle: 118, flutes: 2,
      desc: 'Stepped cone bit for drilling multiple diameters in one pass. Used for sheet metal and thin stock.' },
    { id: 'countersink', name: 'Countersink Bit',    standard: 'DIN 335',  pointAngle: 90,  flutes: 3,
      desc: 'Conical cutter with multiple flutes for creating screw-head recesses. 90-degree included angle.' },
    { id: 'spade',       name: 'Spade / Flat Bit',   standard: 'DIN 7487', pointAngle: 0,   flutes: 0,
      desc: 'Flat paddle-shaped bit with centre point. For large holes in wood, plastic, and soft materials.' }
  ];
  var DRILL_SIZES = [2, 3, 4, 5, 6, 8, 10, 12, 14, 16]; /* metric mm */

  var MATERIALS = [
    { id: 'mild-steel',      name: 'Mild Steel',      Ks: 2100, Vrec: 25, color: '#78909c' },
    { id: 'aluminum',        name: 'Aluminum',         Ks: 900,  Vrec: 75, color: '#b0c4de' },
    { id: 'cast-iron',       name: 'Cast Iron',        Ks: 1500, Vrec: 20, color: '#616161' },
    { id: 'stainless-steel', name: 'Stainless Steel',  Ks: 2500, Vrec: 15, color: '#90a4ae' },
    { id: 'brass',           name: 'Brass',            Ks: 1100, Vrec: 50, color: '#d4a843' }
  ];

  /* ═══════════════════════════════════════════════════════════════
     S3  EXPLORE PARTS DATABASE (18 parts)
     ═══════════════════════════════════════════════════════════════ */
  var PARTS = [
    { id: 'base',          name: 'Base',              cat: 'Structure',       desc: 'Heavy cast iron foundation that supports the entire machine. Has T-slots for clamping workpieces directly and provides stability during drilling operations.' },
    { id: 'column',        name: 'Column',            cat: 'Structure',       desc: 'Vertical precision-machined cylindrical pillar. Guides the table and head assembly, maintaining alignment between the spindle and work surface.' },
    { id: 'table',         name: 'Table',             cat: 'Structure',       desc: 'Adjustable work surface with T-slots for clamping fixtures and vises. Can be raised, lowered, and swiveled around the column to accommodate different workpiece sizes.' },
    { id: 'table-clamp',   name: 'Table Clamp',       cat: 'Structure',       desc: 'Locking mechanism that secures the table at the desired height on the column. Must be tightened firmly before drilling to prevent table movement under cutting forces.' },
    { id: 'head',          name: 'Head Assembly',      cat: 'Drive System',   desc: 'Houses the motor, V-belt drive, spindle bearings, and speed change mechanism. Mounted at the top of the column and contains all the power transmission components.' },
    { id: 'motor',         name: 'Motor',             cat: 'Drive System',   desc: 'Electric induction motor (typically 0.5 to 3 HP) that provides rotary power to the spindle through a belt drive system. Speed is typically 1440 or 2880 RPM.' },
    { id: 'spindle',       name: 'Spindle',           cat: 'Drive System',   desc: 'Hollow rotating shaft that transmits torque to the cutting tool. Has a Morse taper bore at the lower end for mounting drill chucks or taper-shank tools directly.' },
    { id: 'quill',         name: 'Quill',             cat: 'Feed Mechanism', desc: 'Non-rotating sleeve that holds the spindle. Moves vertically up and down to provide the feed motion. Returned to top position by the return spring after each drilling cycle.' },
    { id: 'chuck',         name: 'Chuck',             cat: 'Work Holding',   desc: 'Three-jaw drill chuck that grips parallel-shank drill bits concentrically. Tightened with a chuck key. Available in sizes from 6 mm to 16 mm capacity.' },
    { id: 'drill-bit',     name: 'Drill Bit',        cat: 'Work Holding',   desc: 'HSS or carbide twist drill with two helical flutes for chip evacuation. Standard point angle is 118 deg with a chisel edge at the center. The primary cutting tool.' },
    { id: 'feed-handle',   name: 'Feed Handle',       cat: 'Feed Mechanism', desc: 'Three-spoke handle for manual downward feed of the quill and spindle. The operator controls feed rate and feel through this handle, sensing cutting resistance.' },
    { id: 'depth-stop',    name: 'Depth Stop',        cat: 'Feed Mechanism', desc: 'Adjustable rod and nut mechanism that limits the maximum depth of quill travel. Essential for drilling blind holes to precise depths and preventing table damage.' },
    { id: 'return-spring', name: 'Return Spring',     cat: 'Feed Mechanism', desc: 'Coil spring inside the head assembly that automatically returns the quill and spindle to the top position when the feed handle is released after drilling.' },
    { id: 'speed-sel',     name: 'Speed Selector',    cat: 'Drive System',   desc: 'Step pulley system or variable speed dial for changing spindle RPM. Step pulleys provide 4-6 discrete speeds by moving the V-belt between different diameter pulleys.' },
    { id: 'power-switch',  name: 'Power Switch',      cat: 'Safety',         desc: 'ON/OFF switch with emergency stop capability (typically a mushroom-head push button). Should be easily accessible to the operator for quick shutdown in emergencies.' },
    { id: 'guard',         name: 'Guard',             cat: 'Safety',         desc: 'Transparent polycarbonate safety shield around the chuck and drill bit area. Prevents chips and broken drill bits from injuring the operator. Must be in place during operation.' },
    { id: 'coolant',       name: 'Coolant System',    cat: 'Safety',         desc: 'Pump, flexible nozzle, and reservoir for delivering cutting fluid to the drill point. Reduces heat, improves surface finish, extends tool life, and helps evacuate chips.' },
    { id: 'vice',          name: 'Worktable Vice',    cat: 'Work Holding',   desc: 'Machine vice bolted to the table T-slots. Holds workpieces firmly with parallel jaws. Must be properly aligned so the drill enters perpendicular to the workpiece surface.' }
  ];

  var PART_CATS = ['Structure', 'Drive System', 'Feed Mechanism', 'Work Holding', 'Safety'];

  /* ═══════════════════════════════════════════════════════════════
     S4  STATE
     ═══════════════════════════════════════════════════════════════ */
  var state = {
    mode: 'simulate',
    opIdx: 0,
    matIdx: 0,
    speed: 500,      /* RPM */
    feed: 0.10,      /* mm/rev */
    dia: 10,         /* mm */
    depth: 20,       /* mm */
    tableHeight: 0,  /* 0..180 px — how much table is raised toward drill */
    tableMoving: 0,  /* -1 down, 0 stopped, +1 up (for canvas arrow buttons) */
    tableDragging: false, /* true when user is click-dragging the table */
    tableDragStartY: 0,   /* canvas Y where drag started */
    tableDragStartH: 0,   /* tableHeight when drag started */
    feedHandleDown: false, /* true when user holds the feed handle */
    machineOn: false, /* true = power ON, spindle rotates */
    running: false,   /* true = auto drilling cycle active (Start Drilling btn) */
    cutting: false,   /* true only when drill tip contacts workpiece */
    drillPhase: 'idle', /* idle → descend → cut → retract → idle */
    maxAnimT: 0,     /* animT value where drill tip meets workpiece top */
    contactWarning: '',
    warningTimer: 0,
    animT: 0,        /* 0..1 quill travel (0=top, 1=max descent) */
    holeAnimT: 0,        /* animT at deepest cut — persists after retract */
    holeContactAnimT: 0, /* animT when drill first touched workpiece */
    holePenetAnimT: 0,   /* animT when drill fully through workpiece */
    holeDia: 0,          /* mm diameter of the persistent hole */
    holeBitType: '',     /* bit type of the persistent hole */
    _activeHoleOp: '',   /* operation id recorded at the start of the active cut */
    holeHistory: [],     /* completed hole layers: [{op,bitType,dia,depthFrac}] — cleared only on Reset */
    drillMode: 'auto',   /* 'auto' | 'manual' — Auto = Start Drilling button; Manual = feed handle */
    manualHintSeen: false, /* true once user interacts in Manual; reset when toggling back to Manual */
    animAngle: 0,    /* spindle rotation angle */
    animFrame: null,
    lastTS: 0,
    chips: [],       /* animated chip particles */
    chipPile: [],    /* accumulated chips on workpiece */
    coolDrops: [],   /* coolant splash particles */
    heatGlow: 0,     /* heat intensity at drill tip 0..1 */
    vibAmp: 0,       /* vibration amplitude (px) */
    beltPhase: 0,    /* belt animation phase */
    zoomed: false,   /* true = zoom into drilling zone */
    showLabels: false, /* true = show leader-line labels (toggle with Aa button) */
    _zoomCenterX: 0, /* stored during draw for inverse transform */
    _zoomCenterY: 0,
    estop: false,    /* emergency stop latched */
    spindleDir: 1,   /* +1 = FWD (CW), -1 = REV (CCW) */
    soundEnabled: true, /* false = muted */
    coolantOn: true,    /* true = coolant nozzle & stream visible */
    bitType: 'twist', /* selected drill bit type id */
    bitPopup: false,  /* true = bit selector popup is open */
    bitPopupType: 'twist', /* temp selection in popup */
    bitPopupSize: 10,      /* temp size in popup */
    hoverDrillBit: false,  /* true when mouse is over drill bit */
    /* physics results */
    V: 0, N: 0, f: 0, Q: 0, T: 0, Ft: 0, P: 0, Ra: 0, tm: 0,
    /* explore */
    expCat: 'Structure',
    expPartIdx: 0,
    /* practice */
    pProb: null,
    pCorrect: 0,
    pTotal: 0,
    pAnswered: false,
    /* quiz */
    qSet: [],
    qIdx: 0,
    qScore: 0,
    qAnswered: false,
    qLog: []
  };

  /* ═══════════════════════════════════════════════════════════════
     S5  DOM REFERENCES
     ═══════════════════════════════════════════════════════════════ */
  var mCanvas, mCtx, MW, MH;
  var gCanvas, gCtx, GW, GH;
  var eCanvas, eCtx, EW, EH;

  var elSimWrapper, elExpWrapper, elPracWrapper, elQuizWrapper;
  var elOpTabs, elMatTabs;
  var elSpeedSlider, elSpeedVal, elFeedSlider, elFeedVal;
  var elDiaSlider, elDiaVal, elDepthSlider, elDepthVal;
  var elTableSlider, elTableVal;
  var elBtnStart, elBtnReset;
  var elBadgeV, elBadgeN, elBadgeF, elBadgeP;
  var elResCS, elResFR, elResMRR, elResPow, elResTorque, elResThrust, elResRough, elResTime;
  var elExpCats, elExpGrid, elExpInfo;
  var elPracPrompt, elPracInput, elPracUnit, elPracFeedback, elPracSolution;
  var elBtnCheck, elBtnShowSol, elBtnNextProb, elPracScore;
  var elQuizPanel, elQuizCounter, elQuizPrompt, elQuizOptions, elQuizNumRow;
  var elQuizNumInput, elQuizNumUnit, elBtnQuizSubmit, elQuizFeedback, elBtnQuizNext;
  var elQuizResult, elQrStars, elQrScore, elQrTable, elBtnNewQuiz;

  /* ═══════════════════════════════════════════════════════════════
     S5b  DRILL BIT ICON DRAWING + POPUP LOGIC
     ═══════════════════════════════════════════════════════════════ */
  function drawBitIcon(canvas, typeId, selected) {
    var c = canvas.getContext('2d');
    var w = canvas.width, h = canvas.height;
    c.clearRect(0, 0, w, h);

    /* Background */
    c.fillStyle = selected ? 'rgba(67,160,71,0.1)' : '#0d1117';
    c.fillRect(0, 0, w, h);

    var cx = w / 2, bodyW = w * 0.22, bodyTop = 6, tipY = h - 8;
    var bodyH = tipY - bodyTop;

    /* Shank (top part — same for all, silver) */
    c.fillStyle = '#6a7080';
    c.fillRect(cx - bodyW / 2, bodyTop, bodyW, bodyH * 0.2);
    /* Separator ring */
    c.fillStyle = '#8a9aaa';
    c.fillRect(cx - bodyW / 2 - 1, bodyTop + bodyH * 0.18, bodyW + 2, 3);

    var cutStart = bodyTop + bodyH * 0.22;
    var cutLen = bodyH * 0.78;

    if (typeId === 'twist') {
      /* Straight body → V-point */
      c.fillStyle = '#c8a830';
      c.beginPath();
      c.moveTo(cx - bodyW / 2, cutStart);
      c.lineTo(cx + bodyW / 2, cutStart);
      c.lineTo(cx + bodyW / 2, tipY - bodyW * 0.6);
      c.lineTo(cx, tipY);
      c.lineTo(cx - bodyW / 2, tipY - bodyW * 0.6);
      c.closePath(); c.fill();
      /* Helical flute lines */
      c.strokeStyle = 'rgba(0,0,0,0.45)';
      c.lineWidth = 1;
      for (var fy = cutStart + 4; fy < tipY - bodyW * 0.8; fy += 5) {
        var fx = Math.sin(fy * 0.3) * bodyW * 0.3;
        c.beginPath(); c.moveTo(cx + fx, fy); c.lineTo(cx + fx + 1, fy + 4); c.stroke();
      }
      /* Point highlight */
      c.strokeStyle = '#ff9900';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - 2, tipY - 1); c.lineTo(cx + 2, tipY - 1); c.stroke();

    } else if (typeId === 'center') {
      /* 60-deg countersink cone (top/wide) → narrow pilot → 60-deg point (tip/bottom) */
      var pilotW = bodyW * 0.4;
      var coneLen = cutLen * 0.45;
      var pilotLen2 = cutLen * 0.42;
      /* 60-deg countersink cone at TOP (wide→narrow) */
      c.fillStyle = '#c8a830';
      c.beginPath();
      c.moveTo(cx - bodyW * 0.7, cutStart);
      c.lineTo(cx + bodyW * 0.7, cutStart);
      c.lineTo(cx + pilotW / 2, cutStart + coneLen);
      c.lineTo(cx - pilotW / 2, cutStart + coneLen);
      c.closePath(); c.fill();
      /* Narrow pilot */
      c.fillRect(cx - pilotW / 2, cutStart + coneLen, pilotW, pilotLen2);
      /* 60-deg drill point at tip (bottom) */
      c.beginPath();
      c.moveTo(cx - pilotW / 2, cutStart + coneLen + pilotLen2);
      c.lineTo(cx, tipY);
      c.lineTo(cx + pilotW / 2, cutStart + coneLen + pilotLen2);
      c.closePath(); c.fill();

    } else if (typeId === 'step') {
      /* Stepped cone — 4 steps */
      var steps = 4;
      c.fillStyle = '#c8a830';
      for (var si = 0; si < steps; si++) {
        var sTop = cutStart + si * (cutLen / steps);
        var sH = cutLen / steps;
        var sW = bodyW * 0.4 + (bodyW * 0.7) * ((steps - si) / steps);
        c.fillRect(cx - sW / 2, sTop, sW, sH - 1);
        /* Step edge highlight */
        c.strokeStyle = 'rgba(0,0,0,0.35)';
        c.lineWidth = 0.5;
        c.strokeRect(cx - sW / 2, sTop, sW, sH - 1);
      }
      /* Tip */
      var lastW = bodyW * 0.4;
      c.beginPath();
      c.moveTo(cx - lastW / 2, tipY - 2);
      c.lineTo(cx, tipY);
      c.lineTo(cx + lastW / 2, tipY - 2);
      c.closePath(); c.fill();

    } else if (typeId === 'countersink') {
      /* Narrow shank → wide 90-degree cone, 3 flute lines */
      var shankW = bodyW * 0.35;
      var shankLen = cutLen * 0.45;
      c.fillStyle = '#c8a830';
      c.fillRect(cx - shankW / 2, cutStart, shankW, shankLen);
      /* 90-degree cone */
      c.beginPath();
      c.moveTo(cx - shankW / 2, cutStart + shankLen);
      c.lineTo(cx - bodyW * 0.9, tipY);
      c.lineTo(cx + bodyW * 0.9, tipY);
      c.lineTo(cx + shankW / 2, cutStart + shankLen);
      c.closePath(); c.fill();
      /* 3 flute lines on cone */
      c.strokeStyle = 'rgba(0,0,0,0.4)';
      c.lineWidth = 0.8;
      for (var fi = 0; fi < 3; fi++) {
        var fAngle = fi * Math.PI * 2 / 3 + 0.3;
        var fxOff = Math.sin(fAngle) * bodyW * 0.5;
        c.beginPath();
        c.moveTo(cx, cutStart + shankLen + 2);
        c.lineTo(cx + fxOff, tipY - 1);
        c.stroke();
      }

    } else if (typeId === 'spade') {
      /* Narrow shank → flat paddle with centre spike */
      var shW = bodyW * 0.3;
      var shLen = cutLen * 0.5;
      c.fillStyle = '#c8a830';
      c.fillRect(cx - shW / 2, cutStart, shW, shLen);
      /* Paddle */
      var padW = bodyW * 1.4;
      var padH = cutLen * 0.35;
      c.fillRect(cx - padW / 2, cutStart + shLen, padW, padH);
      /* Centre spike */
      c.beginPath();
      c.moveTo(cx - 2, cutStart + shLen + padH);
      c.lineTo(cx, tipY);
      c.lineTo(cx + 2, cutStart + shLen + padH);
      c.closePath(); c.fill();
      /* Cutting edge highlight */
      c.strokeStyle = 'rgba(0,0,0,0.5)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(cx - padW / 2, cutStart + shLen + padH);
      c.lineTo(cx + padW / 2, cutStart + shLen + padH);
      c.stroke();
    }

    /* Border */
    c.strokeStyle = selected ? ACCENT : '#2a3050';
    c.lineWidth = selected ? 1.5 : 0.5;
    c.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  /* Build / rebuild the popup content */
  function buildBitPopup() {
    var typesEl = document.getElementById('bit-popup-types');
    var sizesEl = document.getElementById('bit-popup-sizes');
    var descEl  = document.getElementById('bit-popup-desc');
    if (!typesEl || !sizesEl) return;

    /* Type cards */
    typesEl.innerHTML = '';
    DRILL_BITS.forEach(function(bit) {
      var card = document.createElement('div');
      card.className = 'bit-type-card' + (bit.id === state.bitPopupType ? ' active' : '');
      var cvs = document.createElement('canvas');
      cvs.width = 40; cvs.height = 64;
      cvs.style.width = '40px'; cvs.style.height = '64px';
      drawBitIcon(cvs, bit.id, bit.id === state.bitPopupType);
      var info = document.createElement('div');
      info.className = 'bit-type-info';
      info.innerHTML = '<div class="bit-type-name">' + bit.name + '</div>' +
        '<div class="bit-type-std">' + bit.standard + ' \u2022 ' + bit.pointAngle + '\u00B0</div>' +
        '<div class="bit-type-desc">' + bit.desc.substring(0, 60) + '...</div>';
      card.appendChild(cvs);
      card.appendChild(info);
      card.addEventListener('click', function() {
        state.bitPopupType = bit.id;
        buildBitPopup();
      });
      typesEl.appendChild(card);
    });

    /* Description */
    var selBit = DRILL_BITS.filter(function(b) { return b.id === state.bitPopupType; })[0];
    if (descEl && selBit) {
      descEl.innerHTML = '<strong>' + selBit.name + '</strong> (' + selBit.standard + ')<br>' +
        selBit.desc + '<br><em>Point angle: ' + selBit.pointAngle + '\u00B0 \u2022 Flutes: ' + selBit.flutes + '</em>';
    }

    /* Size buttons */
    sizesEl.innerHTML = '';
    DRILL_SIZES.forEach(function(sz) {
      var btn = document.createElement('button');
      btn.className = 'bit-size-btn' + (sz === state.bitPopupSize ? ' active' : '');
      btn.textContent = '\u00D8' + sz;
      btn.addEventListener('click', function() {
        state.bitPopupSize = sz;
        buildBitPopup();
      });
      sizesEl.appendChild(btn);
    });
  }

  function openBitPopup() {
    state.bitPopup = true;
    state.bitPopupType = state.bitType;
    state.bitPopupSize = state.dia;
    buildBitPopup();
    var el = document.getElementById('bit-popup');
    if (el) el.style.display = '';
  }

  function closeBitPopup() {
    state.bitPopup = false;
    var el = document.getElementById('bit-popup');
    if (el) el.style.display = 'none';
  }

  function applyBitSelection() {
    state.bitType = state.bitPopupType;
    state.dia = state.bitPopupSize;
    if (elDiaSlider) elDiaSlider.value = state.dia;
    syncSliderLabels();
    updatePhysics(); updateReadouts(); updateBadges();
    closeBitPopup();
    drawMachine(); drawGraph();
  }

  /* ═══════════════════════════════════════════════════════════════
     S6  INIT CANVASES & DOM
     ═══════════════════════════════════════════════════════════════ */
  function initCanvases() {
    mCanvas = $('machine-canvas');
    gCanvas = $('graph-canvas');
    eCanvas = $('explore-canvas');

    var dpr = window.devicePixelRatio || 1;
    function hiDPI(canvas) {
      if (!canvas) return null;
      var lw = canvas.width, lh = canvas.height;
      canvas.width  = lw * dpr;
      canvas.height = lh * dpr;
      /* No inline style — CSS controls display size so canvases scale responsively */
      var ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      return { ctx: ctx, lw: lw, lh: lh };
    }
    var mr = hiDPI(mCanvas); if (mr) { mCtx = mr.ctx; MW = mr.lw; MH = mr.lh; }
    var gr = hiDPI(gCanvas); if (gr) { gCtx = gr.ctx; GW = gr.lw; GH = gr.lh; }
    var er = hiDPI(eCanvas); if (er) { eCtx = er.ctx; EW = er.lw; EH = er.lh; }

    elSimWrapper  = $('sim-wrapper');
    elExpWrapper  = $('explore-wrapper');
    elPracWrapper = $('practice-wrapper');
    elQuizWrapper = $('quiz-wrapper');

    elOpTabs  = $('op-tabs');
    elMatTabs = $('mat-tabs');

    elSpeedSlider = $('speed-slider');
    elSpeedVal    = $('speed-val');
    elFeedSlider  = $('feed-slider');
    elFeedVal     = $('feed-val');
    elDiaSlider   = $('dia-slider');
    elDiaVal      = $('dia-val');
    elDepthSlider = $('depth-slider');
    elDepthVal    = $('depth-val');

    elTableSlider = $('table-slider');
    elTableVal    = $('table-val');

    elBtnStart = $('btn-start');
    elBtnReset = $('btn-reset');

    elBadgeV = $('badge-v');
    elBadgeN = $('badge-n');
    elBadgeF = $('badge-f');
    elBadgeP = $('badge-p');

    elResCS      = $('res-cutting-speed');
    elResFR      = $('res-feed-rate');
    elResMRR     = $('res-mrr');
    elResPow     = $('res-power');
    elResTorque  = $('res-torque');
    elResThrust  = $('res-thrust');
    elResRough   = $('res-roughness');
    elResTime    = $('res-time');

    elExpCats  = $('explore-cats');
    elExpGrid  = $('explore-grid');
    elExpInfo  = $('explore-info');

    elPracPrompt   = $('practice-prompt');
    elPracInput    = $('practice-input');
    elPracUnit     = $('practice-unit');
    elPracFeedback = $('practice-feedback');
    elPracSolution = $('practice-solution');
    elBtnCheck     = $('btn-check');
    elBtnShowSol   = $('btn-show-sol');
    elBtnNextProb  = $('btn-next-prob');
    elPracScore    = $('practice-score');

    elQuizPanel    = $('quiz-panel');
    elQuizCounter  = $('quiz-counter');
    elQuizPrompt   = $('quiz-prompt');
    elQuizOptions  = $('quiz-options');
    elQuizNumRow   = $('quiz-num-row');
    elQuizNumInput = $('quiz-num-input');
    elQuizNumUnit  = $('quiz-num-unit');
    elBtnQuizSubmit = $('btn-quiz-submit');
    elQuizFeedback = $('quiz-feedback');
    elBtnQuizNext  = $('btn-quiz-next');
    elQuizResult   = $('quiz-result');
    elQrStars      = $('qr-stars');
    elQrScore      = $('qr-score');
    elQrTable      = $('qr-table');
    elBtnNewQuiz   = $('btn-new-quiz');
  }

  /* ═══════════════════════════════════════════════════════════════
     S7  BUILD OPERATION & MATERIAL PILLS
     ═══════════════════════════════════════════════════════════════ */
  function buildOpPills() {
    if (!elOpTabs) return;
    elOpTabs.innerHTML = '';
    OPERATIONS.forEach(function (op, i) {
      var btn = document.createElement('button');
      btn.className = 'config-pill' + (i === state.opIdx ? ' active' : '');
      btn.textContent = op.name;
      btn.addEventListener('click', function () {
        state.opIdx = i;
        buildOpPills();
        updatePhysics();
        updateReadouts();
        updateBadges();
        drawMachine();
        drawGraph();
      });
      elOpTabs.appendChild(btn);
    });
  }

  function buildMatPills() {
    if (!elMatTabs) return;
    elMatTabs.innerHTML = '';
    MATERIALS.forEach(function (mat, i) {
      var btn = document.createElement('button');
      btn.className = 'config-pill' + (i === state.matIdx ? ' active' : '');
      btn.textContent = mat.name;
      btn.addEventListener('click', function () {
        state.matIdx = i;
        buildMatPills();
        updatePhysics();
        updateReadouts();
        updateBadges();
        drawMachine();
        drawGraph();
      });
      elMatTabs.appendChild(btn);
    });
  }

  /* ═══════════════════════════════════════════════════════════════
     S8  WIRE SLIDERS & BUTTONS
     ═══════════════════════════════════════════════════════════════ */
  function wireSliders() {
    if (elSpeedSlider) {
      elSpeedSlider.addEventListener('input', function () {
        state.speed = parseInt(this.value, 10);
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        drawMachine(); drawGraph();
      });
    }
    if (elFeedSlider) {
      elFeedSlider.addEventListener('input', function () {
        state.feed = parseFloat(this.value);
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        drawMachine(); drawGraph();
      });
    }
    if (elDiaSlider) {
      elDiaSlider.addEventListener('input', function () {
        state.dia = parseInt(this.value, 10);
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        drawMachine(); drawGraph();
      });
    }
    if (elDepthSlider) {
      elDepthSlider.addEventListener('input', function () {
        state.depth = parseInt(this.value, 10);
        syncSliderLabels();
        updatePhysics(); updateReadouts(); updateBadges();
        drawMachine(); drawGraph();
      });
    }
    if (elTableSlider) {
      elTableSlider.addEventListener('input', function () {
        state.tableHeight = parseInt(this.value, 10);
        syncSliderLabels();
        drawMachine(); drawGraph();
      });
    }
  }

  function wireButtons() {
    if (elBtnStart) {
      elBtnStart.addEventListener('click', function () {
        if (state.running) {
          pauseAnim();
        } else if (!state.machineOn) {
          state.contactWarning = '\u26A0 Spindle is OFF! Press ON switch first.';
          state.warningTimer = 3;
          if (!state.animFrame) { state.lastTS = performance.now(); state.animFrame = requestAnimationFrame(animLoop); }
        } else if (state.estop) {
          state.contactWarning = '\u26D4 Release E-Stop first!';
          state.warningTimer = 3;
          if (!state.animFrame) { state.lastTS = performance.now(); state.animFrame = requestAnimationFrame(animLoop); }
        } else {
          startAnim();
        }
      });
    }
    if (elBtnReset) {
      elBtnReset.addEventListener('click', function () {
        resetAnim();
      });
    }

    /* Drill bit popup buttons */
    var bpApply = document.getElementById('bit-popup-apply');
    var bpCancel = document.getElementById('bit-popup-cancel');
    var bpCancel2 = document.getElementById('bit-popup-cancel2');
    if (bpApply) bpApply.addEventListener('click', applyBitSelection);
    if (bpCancel) bpCancel.addEventListener('click', closeBitPopup);
    if (bpCancel2) bpCancel2.addEventListener('click', closeBitPopup);

    /* Mode tabs */
    var modeTabs = $('mode-tabs');
    if (modeTabs) {
      var pills = modeTabs.querySelectorAll('.pill');
      for (var i = 0; i < pills.length; i++) {
        (function (pill) {
          pill.addEventListener('click', function () {
            setMode(pill.dataset.mode);
          });
        })(pills[i]);
      }
    }

    /* Canvas arrow buttons for table height */
    if (mCanvas) {
      function getCanvasPos(e) {
        var rect = mCanvas.getBoundingClientRect();
        var scaleX = MW / rect.width;
        var scaleY = MH / rect.height;
        var clientX, clientY;
        if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          clientX = e.clientX;
          clientY = e.clientY;
        }
        var cx = (clientX - rect.left) * scaleX;
        var cy = (clientY - rect.top) * scaleY;
        return { x: cx, y: cy };
      }
      /* Reverse zoom transform: screen canvas coords → machine coords */
      function screenToMachine(pos) {
        if (!state.zoomed) return pos;
        var zs = 1.8;
        var mx = (pos.x - MW / 2) / zs + state._zoomCenterX;
        var my = (pos.y - MH / 2) / zs + state._zoomCenterY;
        return { x: mx, y: my };
      }
      function hitTest(pos, rect) {
        return rect && pos.x >= rect.x && pos.x <= rect.x + rect.w &&
               pos.y >= rect.y && pos.y <= rect.y + rect.h;
      }
      function handleDown(e) {
        _initAudio(); /* resume / create AudioContext on first user gesture */
        var pos = getCanvasPos(e);
        var mpos = screenToMachine(pos);

        /* ── Head panel controls (in machine coords) ── */
        /* ON button — powers machine, spindle starts rotating */
        if (hitTest(mpos, state._onBtnRect)) {
          if (state.estop) {
            state.contactWarning = '\u26D4 Release E-Stop first!';
            state.warningTimer = 2;
          } else {
            state.machineOn = true;
            state.contactWarning = '\u2705 Spindle ON. Use feed handle or Start Drilling.';
            state.warningTimer = 2;
            /* Start animation loop for spindle rotation if not already */
            if (!state.animFrame) {
              state.lastTS = performance.now();
              state.animFrame = requestAnimationFrame(animLoop);
            }
          }
          drawMachine();
          e.preventDefault(); return;
        }
        /* OFF button — cuts power, stops spindle + everything */
        if (hitTest(mpos, state._offBtnRect)) {
          state.machineOn = false;
          if (state.running) pauseAnim();
          state.feedHandleDown = false;
          state.contactWarning = '\u26A0 Spindle OFF.';
          state.warningTimer = 2;
          drawMachine();
          e.preventDefault(); return;
        }
        /* E-STOP toggle */
        if (hitTest(mpos, state._estopBtnRect)) {
          state.estop = !state.estop;
          if (state.estop) {
            state.machineOn = false;
            if (state.running) pauseAnim();
            state.feedHandleDown = false;
            state.contactWarning = '\u26D4 EMERGENCY STOP — Machine halted!';
            state.warningTimer = 4;
          } else {
            state.contactWarning = '\u2705 E-Stop released. Press ON to power up.';
            state.warningTimer = 3;
          }
          drawMachine();
          e.preventDefault(); return;
        }
        /* Speed CW (+50 RPM) */
        if (hitTest(mpos, state._speedCwRect)) {
          state.speed = clamp(state.speed + 50, 0, 2500);
          if (elSpeedSlider) elSpeedSlider.value = state.speed;
          syncSliderLabels();
          updatePhysics(); updateReadouts(); updateBadges();
          drawMachine(); drawGraph();
          e.preventDefault(); return;
        }
        /* Speed CCW (-50 RPM) */
        if (hitTest(mpos, state._speedCcwRect)) {
          state.speed = clamp(state.speed - 50, 0, 2500);
          if (elSpeedSlider) elSpeedSlider.value = state.speed;
          syncSliderLabels();
          updatePhysics(); updateReadouts(); updateBadges();
          drawMachine(); drawGraph();
          e.preventDefault(); return;
        }
        /* Direction FWD */
        if (hitTest(mpos, state._dirFwdRect)) {
          state.spindleDir = 1;
          drawMachine();
          e.preventDefault(); return;
        }
        /* Direction REV */
        if (hitTest(mpos, state._dirRevRect)) {
          state.spindleDir = -1;
          drawMachine();
          e.preventDefault(); return;
        }

        /* Change Bit popup */
        if (hitTest(pos, state._bitBtnRect)) {
          openBitPopup();
          e.preventDefault(); return;
        }
        /* Zoom toggle */
        if (hitTest(pos, state._zoomBtnRect)) {
          state.zoomed = !state.zoomed;
          drawMachine(); drawGraph();
          e.preventDefault();
          return;
        }
        /* Labels toggle */
        if (hitTest(pos, state._labelBtnRect)) {
          state.showLabels = !state.showLabels;
          drawMachine();
          e.preventDefault();
          return;
        }
        /* Canvas Start/Pause button */
        if (hitTest(pos, state._canvasStartRect)) {
          if (state.drillMode === 'manual') {
            state.contactWarning = '\u26A0 Switch to AUTO mode to use Start Drilling.';
            state.warningTimer = 2.5;
            if (!state.animFrame) { state.lastTS = performance.now(); state.animFrame = requestAnimationFrame(animLoop); }
            e.preventDefault(); return;
          }
          if (state.running) {
            pauseAnim();
          } else if (!state.machineOn) {
            state.contactWarning = '\u26A0 Spindle is OFF! Press ON switch first.';
            state.warningTimer = 3;
            if (!state.animFrame) { state.lastTS = performance.now(); state.animFrame = requestAnimationFrame(animLoop); }
          } else if (state.estop) {
            state.contactWarning = '\u26D4 Release E-Stop first!';
            state.warningTimer = 3;
            if (!state.animFrame) { state.lastTS = performance.now(); state.animFrame = requestAnimationFrame(animLoop); }
          } else {
            startAnim();
          }
          e.preventDefault(); return;
        }
        /* Sound mute toggle button */
        if (hitTest(pos, state._canvasSoundRect)) {
          state.soundEnabled = !state.soundEnabled;
          if (!state.soundEnabled) _silenceAudio();
          drawMachine();
          e.preventDefault(); return;
        }
        /* Coolant On/Off toggle button */
        if (hitTest(pos, state._canvasCoolantRect)) {
          state.coolantOn = !state.coolantOn;
          if (!state.coolantOn) state.coolDrops = [];
          drawMachine();
          e.preventDefault(); return;
        }
        /* Auto / Manual toggle button */
        if (hitTest(pos, state._canvasToggleRect)) {
          state.drillMode = (state.drillMode === 'auto') ? 'manual' : 'auto';
          if (state.drillMode === 'manual') {
            state.manualHintSeen = false; /* show hints fresh each time user enters Manual */
            if (state.running) pauseAnim(); /* stop auto-drill if active */
          }
          drawMachine();
          e.preventDefault(); return;
        }
        /* Canvas Reset button */
        if (hitTest(pos, state._canvasResetRect)) {
          resetAnim();
          e.preventDefault(); return;
        }
        /* Table arrows */
        if (hitTest(pos, state._arrowUpRect)) {
          state.manualHintSeen = true; /* dismiss first-use hints on first interaction */
          state.tableMoving = 1;
          if (!state.animFrame) {
            state.lastTS = performance.now();
            state.animFrame = requestAnimationFrame(animLoop);
          }
          e.preventDefault();
          return;
        }
        if (hitTest(pos, state._arrowDnRect)) {
          state.manualHintSeen = true; /* dismiss first-use hints on first interaction */
          state.tableMoving = -1;
          if (!state.animFrame) {
            state.lastTS = performance.now();
            state.animFrame = requestAnimationFrame(animLoop);
          }
          e.preventDefault();
          return;
        }
        /* Drill bit click — change bit (requires machine OFF) */
        if (hitTest(mpos, state._drillBitRect)) {
          if (state.machineOn || state.running) {
            state.contactWarning = '\u26A0 Turn OFF the machine before changing drill bit!';
            state.warningTimer = 3;
            drawMachine();
          } else {
            openBitPopup();
          }
          e.preventDefault(); return;
        }
        /* Feed handle — press and hold to manually drill (requires spindle ON) */
        if (hitTest(mpos, state._feedHandleRect)) {
          if (!state.machineOn) {
            state.contactWarning = '\u26A0 Spindle is OFF! Press ON switch first.';
            state.warningTimer = 3;
            drawMachine();
          } else if (state.estop) {
            state.contactWarning = '\u26D4 Release E-Stop first!';
            state.warningTimer = 3;
            drawMachine();
          } else {
            state.manualHintSeen = true; /* dismiss first-use hints on first interaction */
            state.feedHandleDown = true;
            if (!state.animFrame) {
              state.lastTS = performance.now();
              state.animFrame = requestAnimationFrame(animLoop);
            }
          }
          e.preventDefault();
          return;
        }
        /* Table drag — click on table/workpiece/vice area to start dragging */
        if (hitTest(mpos, state._tableDragRect)) {
          state.manualHintSeen = true; /* dismiss first-use hints on first interaction */
          state.tableDragging = true;
          state.tableDragStartY = pos.y;
          state.tableDragStartH = state.tableHeight;
          mCanvas.style.cursor = 'ns-resize';
          e.preventDefault();
        }
      }
      function handleMove(e) {
        var pos = getCanvasPos(e);
        var mpos = screenToMachine(pos);
        if (state.tableDragging) {
          /* Dragging in screen space — convert delta to machine space */
          var dy = state.zoomed ? (pos.y - state.tableDragStartY) / 1.8 : (pos.y - state.tableDragStartY);
          var newH = state.tableDragStartH + (-dy / 0.75);
          state.tableHeight = clamp(Math.round(newH), 0, 180);
          if (elTableSlider) elTableSlider.value = state.tableHeight;
          syncSliderLabels();
          drawMachine(); drawGraph();
          e.preventDefault();
        } else {
          /* Hover cursor hint — machine-space for zoomed elements, screen for UI buttons */
          var isScreenBtn = hitTest(pos, state._bitBtnRect) || hitTest(pos, state._zoomBtnRect) || hitTest(pos, state._labelBtnRect) ||
                            hitTest(pos, state._canvasStartRect) || hitTest(pos, state._canvasResetRect) || hitTest(pos, state._canvasToggleRect) ||
                            hitTest(pos, state._canvasSoundRect) || hitTest(pos, state._canvasCoolantRect);
          var isDrillBit = hitTest(mpos, state._drillBitRect);
          /* Track drill bit hover for tooltip */
          if (isDrillBit !== state.hoverDrillBit) {
            state.hoverDrillBit = isDrillBit;
            if (!state.running && !state.machineOn) drawMachine(); /* redraw for tooltip */
          }
          var isPanel = isScreenBtn || isDrillBit || hitTest(mpos, state._onBtnRect) || hitTest(mpos, state._offBtnRect) ||
                        hitTest(mpos, state._estopBtnRect) || hitTest(mpos, state._speedCwRect) ||
                        hitTest(mpos, state._speedCcwRect) || hitTest(mpos, state._dirFwdRect) ||
                        hitTest(mpos, state._dirRevRect) || hitTest(mpos, state._feedHandleRect);
          mCanvas.style.cursor = isPanel ? 'pointer' :
                                 hitTest(mpos, state._tableDragRect) ? 'ns-resize' : '';
        }
      }
      function handleUp() {
        /* End feed handle hold */
        if (state.feedHandleDown) {
          state.feedHandleDown = false;
          /* Keep anim running briefly for retract, or stop if idle */
        }
        /* End table drag */
        if (state.tableDragging) {
          state.tableDragging = false;
          mCanvas.style.cursor = '';
        }
        /* End arrow hold */
        if (state.tableMoving !== 0) {
          state.tableMoving = 0;
        }
        /* Stop loop if nothing is active (but keep running if machineOn for spindle visual) */
        if (!state.running && !state.feedHandleDown && !state.tableDragging && state.tableMoving === 0 && !state.machineOn) {
          if (state.animT <= 0 && state.drillPhase === 'idle') {
            if (state.animFrame) {
              cancelAnimationFrame(state.animFrame);
              state.animFrame = null;
            }
            drawMachine();
          }
        }
      }
      mCanvas.addEventListener('mousedown', handleDown);
      mCanvas.addEventListener('touchstart', handleDown, { passive: false });
      mCanvas.addEventListener('mousemove', handleMove);
      mCanvas.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S9  PHYSICS ENGINE
     ═══════════════════════════════════════════════════════════════ */
  function updatePhysics() {
    var op  = OPERATIONS[state.opIdx];
    var mat = MATERIALS[state.matIdx];
    var D = state.dia;
    var N = state.speed;
    var f = state.feed;
    var L = state.depth;
    var Ks = mat.Ks;

    /* Cutting Speed: V = pi * D * N / 1000 (m/min) */
    state.V = Math.PI * D * N / 1000;

    /* Feed per tooth (2 flute drill) */
    var fz = f / 2;

    /* MRR: Q = pi/4 * D^2 * f * N (mm^3/min) */
    state.Q = (Math.PI / 4) * D * D * f * N * op.kFactor;

    /* Torque: T = Ks * f * D^2 / (4 * 1000) (N*m) */
    state.T = Ks * f * op.feedFactor * D * D / (4 * 1000) * op.kFactor;

    /* Thrust Force: Ft = Ks * f * D / 2 (N) */
    state.Ft = Ks * f * op.feedFactor * D / 2 * op.kFactor;

    /* Power: P = T * 2*pi*N / 60000 (kW) */
    state.P = state.T * 2 * Math.PI * N / 60000;

    /* Surface Roughness: Ra = f^2 / (32 * r) where r = D/4 (um) */
    var r = D / 4;
    state.Ra = (f * f) / (32 * r) * 1000; /* convert to um */

    /* Machining Time: t = L / (f * N) * 60 (seconds), L = depth + approach */
    var approach = D / 2 * Math.tan((90 - 59) * Math.PI / 180); /* point angle 118deg, half=59deg */
    var totalL = L + approach;
    state.tm = (f * N > 0) ? (totalL / (f * N)) * 60 : 0;

    state.N = N;
    state.f = f;
  }

  /* ═══════════════════════════════════════════════════════════════
     S10  READOUTS & BADGES
     ═══════════════════════════════════════════════════════════════ */
  /* ================================================================
     DISPLAY UNITS  (display only — every cut calculation stays metric)
     US drilling practice: SFM, in/rev, inches, in³/min, hp, lbf·in, lbf,
     microinch Ra. Spindle speed (RPM) and machining time (sec) are the same.
     ================================================================ */
  var unitSys = 'si';
  function isImp() { return unitSys === 'imp'; }
  var DU = {
    vc:     { f: 3.28084,    si: 'm/min',        imp: 'SFM',       d: 0 },
    frev:   { f: 0.0393701,  si: 'mm/rev',       imp: 'in/rev',    d: 4 },
    len:    { f: 0.0393701,  si: 'mm',           imp: 'in',        d: 3 },
    mrr:    { f: 6.10237e-5, si: 'mm\u00B3/min',    imp: 'in\u00B3/min', d: 4 },
    power:  { f: 1.34102,    si: 'kW',           imp: 'hp',        d: 3 },
    torque: { f: 8.850746,   si: 'N\u00B7m',        imp: 'lbf\u00B7in',  d: 2 },
    force:  { f: 0.2248089,  si: 'N',            imp: 'lbf',       d: 1 },
    ra:     { f: 39.3701,    si: '\u00B5m Ra',      imp: '\u00B5in Ra',  d: 1 }
  };
  function dv(val, k) { return isImp() ? val * DU[k].f : val; }
  function du(k)      { return isImp() ? DU[k].imp : DU[k].si; }
  function dfix(val, k, dSI) {
    return dv(val, k).toFixed(isImp() ? DU[k].d : (dSI == null ? DU[k].d : dSI));
  }
  /* Single owner of the five slider captions. */
  function syncSliderLabels() {
    if (elSpeedVal) elSpeedVal.textContent = state.speed + ' RPM';
    if (elFeedVal)  elFeedVal.textContent  = dfix(state.feed, 'frev', 2) + ' ' + du('frev');
    if (elDiaVal)   elDiaVal.textContent   = dfix(state.dia, 'len', 0) + ' ' + du('len');
    if (elDepthVal) elDepthVal.textContent = dfix(state.depth, 'len', 0) + ' ' + du('len');
    if (elTableVal) elTableVal.textContent = dfix(state.tableHeight, 'len', 0) + ' ' + du('len');
  }

  function updateReadouts() {
    if (elResCS)      elResCS.textContent      = dfix(state.V, 'vc', 2);
    if (elResFR)      elResFR.textContent      = dfix(state.f, 'frev', 2);
    if (elResMRR)     elResMRR.textContent     = dfix(state.Q, 'mrr', 1);
    if (elResPow)     elResPow.textContent     = dfix(state.P, 'power', 3);
    if (elResTorque)  elResTorque.textContent  = dfix(state.T, 'torque', 2);
    if (elResThrust)  elResThrust.textContent  = dfix(state.Ft, 'force', 1);
    if (elResRough)   elResRough.textContent   = dfix(state.Ra, 'ra', 2);
    if (elResTime)    elResTime.textContent    = roundN(state.tm, 2);   /* seconds either way */
    var caps = { 'ru-cutting-speed': du('vc'), 'ru-feed-rate': du('frev'),
                 'ru-mrr': du('mrr'), 'ru-power': du('power'),
                 'ru-torque': du('torque'), 'ru-thrust': du('force'),
                 'ru-roughness': du('ra') };
    Object.keys(caps).forEach(function (id) {
      var e = $(id); if (e) e.textContent = caps[id];
    });
    syncSliderLabels();
  }

  /* Unit toggle — display only; the cut model stays metric */
  function wireUnitToggle() {
    Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (btn) {
      btn.addEventListener('click', function () {
        var u = btn.getAttribute('data-unit');
        if (!u || u === unitSys) return;
        unitSys = u;
        Array.prototype.forEach.call(document.querySelectorAll('#unit-tabs .pill'), function (b) {
          b.classList.toggle('active', b === btn);
        });
        syncSliderLabels();
        updateReadouts();
        updateBadges();
        if (typeof draw === 'function') draw();
      });
    });
  }

  function updateBadges() {
    if (elBadgeV) elBadgeV.textContent = dfix(state.V, 'vc', 1);
    if (elBadgeN) elBadgeN.textContent = state.speed;
    if (elBadgeF) elBadgeF.textContent = dfix(state.f, 'frev', 2);
    if (elBadgeP) elBadgeP.textContent = dfix(state.P, 'power', 2);
    var bu = { 'bu-v': du('vc'), 'bu-f': du('frev'), 'bu-p': du('power') };
    Object.keys(bu).forEach(function (id) { var e = $(id); if (e) e.textContent = bu[id]; });
  }

  /* ═══════════════════════════════════════════════════════════════
     S10B  WEB AUDIO DRILL SOUND ENGINE
     ═══════════════════════════════════════════════════════════════ */
  var _ac = null;          /* AudioContext */
  var _masterG = null;     /* master GainNode */
  var _cutNoise = null;    /* looping white-noise BufferSource */
  var _cutFilter = null;   /* bandpass filter shaping cutting sound */
  var _cutGain = null;
  var _audioReady = false;

  function _initAudio() {
    if (_audioReady) {
      if (_ac && _ac.state === 'suspended') _ac.resume();
      return;
    }
    try {
      _ac = new (window.AudioContext || window.webkitAudioContext)();

      _masterG = _ac.createGain();
      _masterG.gain.value = 0.45;
      _masterG.connect(_ac.destination);

      /* Cutting noise — 2-second looping white noise through bandpass filter */
      var bufLen = _ac.sampleRate * 2;
      var noiseBuf = _ac.createBuffer(1, bufLen, _ac.sampleRate);
      var nd = noiseBuf.getChannelData(0);
      for (var ni = 0; ni < bufLen; ni++) nd[ni] = Math.random() * 2 - 1;
      _cutNoise = _ac.createBufferSource();
      _cutNoise.buffer = noiseBuf;
      _cutNoise.loop = true;
      _cutFilter = _ac.createBiquadFilter();
      _cutFilter.type = 'bandpass';
      _cutFilter.frequency.value = 900;
      _cutFilter.Q.value = 1.8;
      _cutGain = _ac.createGain();
      _cutGain.gain.value = 0;
      _cutNoise.connect(_cutFilter);
      _cutFilter.connect(_cutGain);
      _cutGain.connect(_masterG);

      _cutNoise.start();
      _audioReady = true;
    } catch (e) { /* no Web Audio support */ }
  }

  function _updateDrillSound() {
    if (!_audioReady || !state.soundEnabled) { if (_audioReady) _silenceAudio(); return; }
    if (_ac.state === 'suspended') _ac.resume();
    var now = _ac.currentTime;

    /* Cutting noise only — plays when drill tip is in contact with workpiece */
    var cutVol = state.cutting ? 0.32 : 0;

    /* Noise frequency: higher speed & harder material → higher-pitched screech */
    var mat = MATERIALS[state.matIdx];
    var ks  = mat && mat.ks ? mat.ks : 1500;
    var cutFreq = clamp(500 + state.speed * 0.9 + ks * 0.12, 350, 3200);
    _cutFilter.frequency.setTargetAtTime(cutFreq, now, 0.12);
    _cutGain.gain.setTargetAtTime(cutVol, now, state.cutting ? 0.06 : 0.14);
  }

  function _silenceAudio() {
    if (!_audioReady) return;
    _cutGain.gain.setTargetAtTime(0, _ac.currentTime, 0.10);
  }

  /* ═══════════════════════════════════════════════════════════════
     S11  ANIMATION LOOP
     ═══════════════════════════════════════════════════════════════ */
  function startAnim() {
    /* AUTO mode: if drill can't reach workpiece, auto-set table to a workable height */
    if (state.drillMode === 'auto') {
      var _autoWpTopY = 500 - state.tableHeight * 0.75 - 30;
      var _autoCat    = (_autoWpTopY - 360) / 80; /* contactAnimT at current tableHeight */
      if (_autoCat > 1) {
        /* Target contactAnimT ≈ 0.35 → tableHeight = (110 − 0.35×80) / 0.75 ≈ 109 */
        state.tableHeight = clamp(Math.round((110 - 0.35 * 80) / 0.75), 0, 180);
        if (elTableSlider) elTableSlider.value = state.tableHeight;
        syncSliderLabels();
      }
    }
    state.running = true;
    if (state.drillPhase === 'idle') state.drillPhase = 'descend';
    if (elBtnStart) elBtnStart.innerHTML = '\u23F8 Pause';
    state.lastTS = performance.now();
    state.animFrame = requestAnimationFrame(animLoop);
  }

  function pauseAnim() {
    state.running = false;
    state.cutting = false;
    if (elBtnStart) elBtnStart.innerHTML = '\u25B6 Resume';
    if (state.animFrame) { cancelAnimationFrame(state.animFrame); state.animFrame = null; }
    _silenceAudio();
  }

  function resetAnim() {
    state.machineOn = false;
    state.running = false;
    state.cutting = false;
    state.drillPhase = 'idle';
    state.maxAnimT = 0;
    state.animT = 0;
    state.holeAnimT = 0;
    state.holeContactAnimT = 0;
    state.holePenetAnimT = 0;
    state.holeDia = 0;
    state.holeBitType = '';
    state._activeHoleOp = '';
    state.holeHistory = [];
    state.animAngle = 0;
    state.chips = [];
    state.chipPile = [];
    state.coolDrops = [];
    state.heatGlow = 0;
    state.vibAmp = 0;
    state.beltPhase = 0;
    state.contactWarning = '';
    state.warningTimer = 0;
    state.tableMoving = 0;
    state.feedHandleDown = false;
    state.estop = false;
    state.spindleDir = 1;
    state.tableHeight = 0;
    if (elTableSlider) elTableSlider.value = 0;
    if (elTableVal) elTableVal.textContent = '0 mm';
    if (elBtnStart) elBtnStart.innerHTML = '\u25B6 Start Drilling';
    if (state.animFrame) { cancelAnimationFrame(state.animFrame); state.animFrame = null; }
    _silenceAudio();
    drawMachine();
    drawGraph();
  }

  /* ── Contact detection helper ── */
  function getContactInfo() {
    /* Geometry constants — must match drawMachine() */
    var headY = 80, headH = 120;
    var quillTop = headY + headH;
    var quillBaseLen = 80;
    var drillTravel = 80;
    var drillOffset = state.animT * drillTravel;
    var quillLen = quillBaseLen + drillOffset;
    var chuckH = 20;
    var bitLen = 60;
    var bitTipY = quillTop + quillLen + chuckH + bitLen;

    var wpH = 30;
    var tableBaseY = 500;
    var tableRaise = state.tableHeight * 0.75;
    var wpTopY = tableBaseY - tableRaise - wpH;

    var gap = wpTopY - bitTipY;
    return {
      bitTipY: bitTipY,
      wpTopY: wpTopY,
      gap: gap,
      contact: gap <= 0,
      penetration: -gap,
      wpH: wpH
    };
  }

  function animLoop(ts) {
    var dt = (ts - state.lastTS) / 1000;
    state.lastTS = ts;
    if (dt > 0.1) dt = 0.1;

    /* E-stop override — kills everything */
    if (state.estop) {
      state.running = false;
      state.cutting = false;
      state.feedHandleDown = false;
    }

    /* Spindle rotation — runs whenever machine is ON */
    var rps = state.speed / 60;
    if (state.machineOn && !state.estop) {
      state.animAngle += rps * dt * Math.PI * 2 * state.spindleDir;
      if (state.animAngle > Math.PI * 2) state.animAngle -= Math.PI * 2;
      if (state.animAngle < 0) state.animAngle += Math.PI * 2;
      state.beltPhase += rps * dt * Math.PI * 2 * 0.3;
      if (state.beltPhase > Math.PI * 2) state.beltPhase -= Math.PI * 2;
    }

    /* Table movement from canvas arrows */
    if (state.tableMoving !== 0) {
      var tableSpeed = 80;
      state.tableHeight = clamp(state.tableHeight + state.tableMoving * tableSpeed * dt, 0, 180);
      if (elTableSlider) elTableSlider.value = Math.round(state.tableHeight);
      if (elTableVal) elTableVal.textContent = Math.round(state.tableHeight) + ' mm';
    }

    /* ── Compute where the drill tip WOULD contact the workpiece ── */
    /* At animT=0 the tip is at its resting Y; at animT=1 it's at max travel.
       We need the animT value that puts the tip exactly at the workpiece top. */
    var ci2 = getContactInfo();
    /* bitTipY at animT = quillTop + quillBaseLen + animT*drillTravel + chuckH + bitLen
       We need bitTipY == wpTopY to find contact animT.
       bitTipAtRest = 200 + 80 + 0 + 20 + 60 = 360
       bitTipAtT    = 360 + T * 80
       wpTopY computed from getContactInfo() uses current animT, but we want the
       resting tip Y (at animT=0) and the wpTopY (independent of animT). */
    var bitTipRest = 200 + 80 + 20 + 60; /* = 360: headY+headH + quillBaseLen + chuckH + bitLen */
    var drillTravelPx = 80;
    var tableRaisePx = state.tableHeight * 0.75;
    var wpTopY = 500 - tableRaisePx - 30; /* tableBaseY - raise - wpH */
    var contactAnimT = (wpTopY - bitTipRest) / drillTravelPx; /* animT when tip meets workpiece */
    var wpH = 30;
    var maxPenetAnimT = contactAnimT + wpH / drillTravelPx; /* animT when fully through */

    /* ── STATE MACHINE: descend → cut → retract ── */
    var descendSpeed = state.tm > 0 ? dt / state.tm : dt * 0.1;

    if (state.drillPhase === 'descend') {
      /* Quill going down */
      state.animT += descendSpeed;
      if (state.animT > 1) state.animT = 1;

      /* Check if we reached the workpiece */
      if (contactAnimT >= 0 && contactAnimT <= 1 && state.animT >= contactAnimT) {
        state.drillPhase = 'cut';
        state.holeDia = state.dia;              /* snapshot hole dimensions at first contact */
        state.holeBitType = state.bitType;
        state.holeContactAnimT = contactAnimT;  /* save animT geometry for cross-section mapping */
        state.holePenetAnimT = maxPenetAnimT;
        state._activeHoleOp = OPERATIONS[state.opIdx].id; /* record which operation started */
        state.contactWarning = '\u2705 Contact! Cutting started.';
        state.warningTimer = 2;
      }
      /* Quill maxed out but never reached workpiece */
      if (state.animT >= 1 && (contactAnimT > 1 || contactAnimT < 0)) {
        state.contactWarning = '\u26A0 Raise the table! Drill cannot reach workpiece.';
        state.warningTimer = 0.5;
      }

    } else if (state.drillPhase === 'cut') {
      /* Drill is inside the workpiece — keep descending at cutting speed */
      state.animT += descendSpeed;
      state.holeAnimT = state.animT; /* track live cut depth for cross-section display */
      /* Stop exactly when penetration reaches workpiece bottom — never go past */
      if (state.animT >= maxPenetAnimT) {
        state.animT = Math.min(maxPenetAnimT, 1);
        state.drillPhase = 'retract';
        state.contactWarning = '\u2705 Hole complete! Retracting...';
        state.warningTimer = 2;
      }
      if (state.animT > 1) { state.animT = 1; state.drillPhase = 'retract'; }

    } else if (state.drillPhase === 'retract') {
      /* Quill returning to top — fast retract */
      var retractSpeed = descendSpeed * 3; /* 3x faster return */
      state.animT -= retractSpeed;
      if (state.animT <= 0) {
        state.animT = 0;
        state.drillPhase = 'idle';
        state.contactWarning = '\u2705 Drilling complete! Quill returned.';
        state.warningTimer = 3;
        state.running = false;
        state.cutting = false;
        if (elBtnStart) elBtnStart.innerHTML = '\u25B6 Start Drilling';
        /* Commit completed hole layer to persistent history */
        if (state.holeDia > 0) {
          var _cHPR = state.holePenetAnimT - state.holeContactAnimT;
          var _cFrac = _cHPR > 0.001
            ? clamp((state.holeAnimT - state.holeContactAnimT) / _cHPR, 0, 1)
            : clamp(state.holeAnimT, 0, 1);
          state.holeHistory.push({ op: state._activeHoleOp || OPERATIONS[state.opIdx].id, bitType: state.holeBitType, dia: state.holeDia, depthFrac: _cFrac });
          state.holeDia = 0; state.holeAnimT = 0; state.holeContactAnimT = 0; state.holePenetAnimT = 0; state.holeBitType = ''; state._activeHoleOp = '';
        }
        if (state.animFrame) { cancelAnimationFrame(state.animFrame); state.animFrame = null; }
        drawMachine(); drawGraph();
        return;
      }
    }

    /* ── MANUAL FEED HANDLE: press & hold to push drill down ── */
    if (state.feedHandleDown && !state.running) {
      var manualSpeed = state.tm > 0 ? dt / state.tm : dt * 0.1;
      state.animT += manualSpeed;
      /* Stop at workpiece bottom — never drill into the table */
      if (maxPenetAnimT > 0 && maxPenetAnimT <= 1 && state.animT >= maxPenetAnimT) {
        state.animT = maxPenetAnimT;
        state.contactWarning = '\u2705 Hole complete! Release handle.';
        state.warningTimer = 0.5;
      }
      /* Warn if table too low */
      if (state.animT >= 1 && (contactAnimT > 1 || contactAnimT < 0)) {
        state.animT = 1;
        state.contactWarning = '\u26A0 Raise the table! Drill cannot reach workpiece.';
        state.warningTimer = 0.5;
      }
      if (state.animT > 1) state.animT = 1;

      /* Track hole geometry for cross-section display (mirrors auto-drill logic) */
      if (contactAnimT >= 0 && contactAnimT <= 1 && state.animT >= contactAnimT) {
        /* Snapshot on first contact */
        if (state.holeDia === 0) {
          state.holeDia = state.dia;
          state.holeBitType = state.bitType;
          state.holeContactAnimT = contactAnimT;
          state.holePenetAnimT = maxPenetAnimT;
          state._activeHoleOp = state._activeHoleOp || OPERATIONS[state.opIdx].id;
        }
        state.holeAnimT = state.animT; /* live depth — cross-section reads this */
      }
    }
    /* When feed handle released — retract quill back to top */
    if (!state.feedHandleDown && !state.running && state.drillPhase === 'idle' && state.animT > 0) {
      var retSpeed = (state.tm > 0 ? dt / state.tm : dt * 0.1) * 3;
      state.animT -= retSpeed;
      if (state.animT <= 0) {
        state.animT = 0;
        /* Commit manual hole layer to persistent history when quill returns to rest */
        if (state.holeDia > 0) {
          var _mHPR = state.holePenetAnimT - state.holeContactAnimT;
          var _mFrac = _mHPR > 0.001
            ? clamp((state.holeAnimT - state.holeContactAnimT) / _mHPR, 0, 1)
            : clamp(state.holeAnimT, 0, 1);
          state.holeHistory.push({ op: state._activeHoleOp || OPERATIONS[state.opIdx].id, bitType: state.holeBitType, dia: state.holeDia, depthFrac: _mFrac });
          state.holeDia = 0; state.holeAnimT = 0; state.holeContactAnimT = 0; state.holePenetAnimT = 0; state.holeBitType = ''; state._activeHoleOp = '';
        }
      }
    }

    /* Contact detection for effects */
    ci2 = getContactInfo(); /* re-check after animT updated */
    var wasCutting = state.cutting;
    var manualCutting = state.feedHandleDown && ci2.contact && !state.running;
    state.cutting = (ci2.contact && state.drillPhase === 'cut') || manualCutting;

    /* Warning timer */
    if (state.warningTimer > 0) {
      state.warningTimer -= dt;
      if (state.warningTimer <= 0) { state.contactWarning = ''; state.warningTimer = 0; }
    }

    /* Vibration — only when cutting */
    var vibTarget = state.cutting ? clamp(state.Ft / 3000, 0, 1) * 1.2 : 0;
    state.vibAmp = lerp(state.vibAmp, vibTarget, dt * 8);

    /* Heat glow — only when cutting */
    var mat = MATERIALS[state.matIdx];
    var heatTarget = state.cutting ? clamp(state.V / (mat.Vrec * 1.5), 0, 1) : 0;
    state.heatGlow = lerp(state.heatGlow, heatTarget, dt * 3);

    /* Generate chips — only when cutting */
    if (state.cutting) {
      var chipRate = clamp(state.Q / 5000, 0.2, 0.9);
      if (Math.random() < chipRate) {
        var chipType = mat.id === 'cast-iron' ? 'powder' :
                       mat.id === 'aluminum' ? 'continuous' : 'curly';
        var side = Math.random() < 0.5 ? -1 : 1;
        state.chips.push({
          x: side * randFloat(2, 6),
          y: 0,
          vx: side * randFloat(20, 60),
          vy: -randFloat(30, 80),
          life: 1.0,
          size: chipType === 'powder' ? randFloat(0.8, 2) : randFloat(2, 4.5),
          type: chipType,
          curl: randFloat(0.3, 1.2),
          angle: randFloat(0, Math.PI * 2),
          rotSpeed: randFloat(-4, 4)
        });
      }
      if (Math.random() < 0.15 && state.chipPile.length < 50) {
        state.chipPile.push({
          x: randFloat(-30, 30), y: randFloat(-3, 0),
          size: randFloat(1.5, 3), angle: randFloat(0, Math.PI * 2)
        });
      }
    }

    /* Update chips */
    for (var ci = state.chips.length - 1; ci >= 0; ci--) {
      var chip = state.chips[ci];
      chip.x += chip.vx * dt;
      chip.y += chip.vy * dt;
      chip.vy += 150 * dt;
      chip.vx *= 0.98;
      chip.life -= dt * 1.0;
      chip.angle += chip.rotSpeed * dt;
      if (chip.life <= 0) state.chips.splice(ci, 1);
    }

    /* Coolant splash — only when cutting */
    if (state.cutting) {
      if (Math.random() < 0.5) {
        state.coolDrops.push({
          x: 0, y: 0, vx: randFloat(-40, 40),
          vy: randFloat(-50, -10), life: 0.6, size: randFloat(0.8, 2)
        });
      }
    }
    for (var di = state.coolDrops.length - 1; di >= 0; di--) {
      var drop = state.coolDrops[di];
      drop.x += drop.vx * dt; drop.y += drop.vy * dt;
      drop.vy += 200 * dt; drop.life -= dt * 2;
      if (drop.life <= 0) state.coolDrops.splice(di, 1);
    }

    /* Sound update */
    _updateDrillSound();

    /* Redraw */
    drawMachine();
    drawGraph();

    /* Stop loop if nothing needs continuous updates */
    var needsLoop = state.running || state.machineOn || state.feedHandleDown ||
                    state.tableMoving !== 0 || state.animT > 0 ||
                    state.chips.length > 0 || state.chipPile.length > 0 ||
                    state.vibAmp > 0.01 || state.heatGlow > 0.01 ||
                    state.warningTimer > 0;
    if (needsLoop) {
      state.animFrame = requestAnimationFrame(animLoop);
    } else {
      state.animFrame = null;
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S12  DRAW MACHINE CANVAS (560x700) — COLUMN DRILL PRESS
     ═══════════════════════════════════════════════════════════════ */
  function drawMachine() {
    if (!mCtx) return;
    var c = mCtx;
    var dpr = window.devicePixelRatio || 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, MW, MH);

    /* Background */
    c.fillStyle = BG;
    c.fillRect(0, 0, MW, MH);

    /* ── Zoom transform ── */
    /* When zoomed, scale 2.2x and centre on the drill-workpiece zone */
    var zoomScale = 1;
    if (state.zoomed) {
      zoomScale = 1.8;  /* less aggressive zoom so feed handle stays visible */
      var tableRaiseForZoom = state.tableHeight * 0.75;
      var drillOffset = state.animT * 80;
      /* Feed handle is at ~quillTop + quillLen - 20. Include it in the view. */
      var feedHandleY = 200 + 80 + drillOffset - 20;
      var wpTopForZoom = 500 - tableRaiseForZoom - 30;
      /* Center between feed handle and workpiece bottom */
      var zoomCenterY = (feedHandleY + wpTopForZoom + 30) / 2;
      var zoomCenterX = 210;
      state._zoomCenterX = zoomCenterX;
      state._zoomCenterY = zoomCenterY;
      c.save();
      c.translate(MW / 2, MH / 2);
      c.scale(zoomScale, zoomScale);
      c.translate(-zoomCenterX, -zoomCenterY);
    }

    /* Subtle grid */
    c.strokeStyle = 'rgba(42,48,80,0.08)';
    c.lineWidth = 0.5;
    for (var gx = 0; gx < MW; gx += 40) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, MH); c.stroke(); }
    for (var gy = 0; gy < MH; gy += 40) { c.beginPath(); c.moveTo(0, gy); c.lineTo(MW, gy); c.stroke(); }

    /* ── Vibration offset for the whole machine ── */
    var vib = state.vibAmp;
    var vibX = vib > 0.01 ? Math.sin(performance.now() * 0.05) * vib : 0;
    var vibY = vib > 0.01 ? Math.cos(performance.now() * 0.07) * vib * 0.5 : 0;
    c.save();
    c.translate(vibX, vibY);

    /* Machine geometry reference points */
    var machX = 180;  /* center X of column/spindle */
    var baseY = 650;
    var baseH = 30;
    var baseW = 250;
    var colW = 28;
    var colX = machX - colW / 2;
    var tableRaise = state.tableHeight * 0.75; /* px per mm of table slider */
    var tableY = 500 - tableRaise;
    var tableH = 18;
    var tableW = 200;
    var headY = 80;
    var headH = 120;
    var headW = 140;

    /* Drilling progress offset — quill descends when drilling */
    var drillTravel = 80; /* max travel in pixels for animation */
    var drillOffset = state.animT * drillTravel;

    /* ─── 1. BASE ─── */
    /* Drop shadow */
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.4)';
    c.shadowBlur = 12;
    c.shadowOffsetY = 4;
    c.fillStyle = '#3a4050';
    roundRect(c, machX - baseW / 2, baseY, baseW, baseH, 4);
    c.fill();
    c.restore();
    /* Surface gradient */
    var baseGrad = c.createLinearGradient(0, baseY, 0, baseY + baseH);
    baseGrad.addColorStop(0, '#4a5060');
    baseGrad.addColorStop(0.3, '#3a4050');
    baseGrad.addColorStop(1, '#2e3545');
    c.fillStyle = baseGrad;
    roundRect(c, machX - baseW / 2, baseY, baseW, baseH, 4);
    c.fill();
    c.strokeStyle = '#4a5060';
    c.lineWidth = 1;
    roundRect(c, machX - baseW / 2, baseY, baseW, baseH, 4);
    c.stroke();
    /* Top edge highlight */
    c.strokeStyle = 'rgba(255,255,255,0.08)';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(machX - baseW / 2 + 4, baseY + 1); c.lineTo(machX + baseW / 2 - 4, baseY + 1); c.stroke();
    /* T-slots on base */
    c.strokeStyle = '#2a3040';
    c.lineWidth = 1.5;
    for (var ts = 0; ts < 3; ts++) {
      var tsx = machX - 60 + ts * 60;
      c.beginPath(); c.moveTo(tsx - 15, baseY + 10); c.lineTo(tsx + 15, baseY + 10); c.stroke();
      c.beginPath(); c.moveTo(tsx, baseY + 5); c.lineTo(tsx, baseY + 15); c.stroke();
    }

    /* ─── 2. COLUMN ─── */
    var colGrad = c.createLinearGradient(colX, 0, colX + colW, 0);
    colGrad.addColorStop(0, '#4a5565');
    colGrad.addColorStop(0.15, '#5a6a7a');
    colGrad.addColorStop(0.4, '#8a9aaa');
    colGrad.addColorStop(0.6, '#8a9aaa');
    colGrad.addColorStop(0.85, '#6a7a8a');
    colGrad.addColorStop(1, '#4a5565');
    c.fillStyle = colGrad;
    c.fillRect(colX, headY + headH, colW, baseY - headY - headH);
    /* Column specular highlight */
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fillRect(colX + 5, headY + headH, 4, baseY - headY - headH);
    /* Column shadow edge */
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.fillRect(colX, headY + headH, 2, baseY - headY - headH);
    c.fillRect(colX + colW - 2, headY + headH, 2, baseY - headY - headH);

    /* ─── 3. TABLE ─── */
    var tblX = machX - tableW / 2;
    /* Drop shadow under table */
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.3)';
    c.shadowBlur = 8;
    c.shadowOffsetY = 3;
    c.fillStyle = '#4a5565';
    roundRect(c, tblX, tableY, tableW, tableH, 3);
    c.fill();
    c.restore();
    var tblGrad = c.createLinearGradient(0, tableY, 0, tableY + tableH);
    tblGrad.addColorStop(0, '#5a6575');
    tblGrad.addColorStop(0.2, '#4a5565');
    tblGrad.addColorStop(1, '#3a4555');
    c.fillStyle = tblGrad;
    roundRect(c, tblX, tableY, tableW, tableH, 3);
    c.fill();
    c.strokeStyle = '#5a6575';
    c.lineWidth = 1;
    roundRect(c, tblX, tableY, tableW, tableH, 3);
    c.stroke();
    /* Table top surface highlight */
    c.fillStyle = 'rgba(255,255,255,0.07)';
    c.fillRect(tblX + 2, tableY + 1, tableW - 4, 2);
    /* T-slots on table */
    c.strokeStyle = '#3a4555';
    c.lineWidth = 1.2;
    for (var tt = 0; tt < 3; tt++) {
      var ttx = machX - 50 + tt * 50;
      c.beginPath(); c.moveTo(ttx - 12, tableY + 9); c.lineTo(ttx + 12, tableY + 9); c.stroke();
      c.beginPath(); c.moveTo(ttx, tableY + 5); c.lineTo(ttx, tableY + 13); c.stroke();
    }
    /* Table support bracket */
    c.fillStyle = '#3a4555';
    c.fillRect(machX - 20, tableY + tableH, 10, 20);
    /* Table height handle */
    c.fillStyle = '#607080';
    c.fillRect(tblX - 12, tableY + 4, 14, 10);
    c.fillStyle = '#708090';
    c.beginPath(); c.arc(tblX - 18, tableY + 9, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.beginPath(); c.arc(tblX - 19, tableY + 7, 2, 0, Math.PI * 2); c.fill();

    /* ─── Table Clamp ─── */
    c.fillStyle = '#556070';
    roundRect(c, colX - 8, tableY + tableH + 2, colW + 16, 12, 2);
    c.fill();
    /* Clamp bolt */
    c.fillStyle = '#708090';
    c.beginPath(); c.arc(colX - 4, tableY + tableH + 8, 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.15)';
    c.beginPath(); c.arc(colX - 5, tableY + tableH + 7, 1.5, 0, Math.PI * 2); c.fill();

    /* Store table drag hit zone (table + workpiece + vice area) */
    state._tableDragRect = { x: tblX - 25, y: tableY - 35, w: tableW + 50, h: tableH + 50 };
    /* Drag handle hint — small up/down arrows on the right edge of table */
    c.fillStyle = state.tableDragging ? ACCENT : 'rgba(100,120,140,0.5)';
    c.font = '10px sans-serif';
    c.textAlign = 'center';
    c.fillText('\u25B2', tblX + tableW + 18, tableY + 4);
    c.fillText('\u25BC', tblX + tableW + 18, tableY + tableH - 1);
    c.fillStyle = state.tableDragging ? ACCENT : 'rgba(100,120,140,0.35)';
    c.font = '6px "Segoe UI", sans-serif';
    c.fillText('DRAG', tblX + tableW + 18, tableY + tableH / 2 + 2);

    /* ─── Workpiece on table ─── */
    var mat = MATERIALS[state.matIdx];
    var wpW = Math.max(40, state.dia * 2.5);
    var wpH = 30;
    var wpX = machX - wpW / 2;
    var wpY = tableY - wpH;
    /* Workpiece with subtle gradient */
    var wpGrad = c.createLinearGradient(0, wpY, 0, wpY + wpH);
    wpGrad.addColorStop(0, mat.color);
    wpGrad.addColorStop(1, hexToRGBA(mat.color, 0.7));
    c.fillStyle = wpGrad;
    c.fillRect(wpX, wpY, wpW, wpH);
    c.strokeStyle = 'rgba(255,255,255,0.12)';
    c.lineWidth = 0.5;
    c.strokeRect(wpX, wpY, wpW, wpH);
    /* Top edge highlight */
    c.strokeStyle = 'rgba(255,255,255,0.15)';
    c.beginPath(); c.moveTo(wpX + 1, wpY + 0.5); c.lineTo(wpX + wpW - 1, wpY + 0.5); c.stroke();

    /* ─── Hole being drilled in workpiece (operation-specific) ─── */
    var op = OPERATIONS[state.opIdx];
    var cinfo = getContactInfo();
    if (cinfo.contact && cinfo.penetration > 0) {
      var holeW = Math.max(4, state.dia * 0.4);
      var holePx = clamp(cinfo.penetration, 0, wpH);

      if (op.id === 'countersinking') {
        /* Conical entry + hole */
        var coneW = holeW * 2.2;
        var coneDepth = Math.min(holePx, 8);
        c.fillStyle = '#0a0e14';
        c.beginPath();
        c.moveTo(machX - coneW / 2, wpY);
        c.lineTo(machX - holeW / 2, wpY + coneDepth);
        c.lineTo(machX - holeW / 2, wpY + holePx);
        c.lineTo(machX + holeW / 2, wpY + holePx);
        c.lineTo(machX + holeW / 2, wpY + coneDepth);
        c.lineTo(machX + coneW / 2, wpY);
        c.closePath();
        c.fill();
      } else if (op.id === 'counterboring') {
        /* Wide flat recess + pilot hole */
        var cbW = holeW * 2;
        var cbDepth = Math.min(holePx, 10);
        c.fillStyle = '#0a0e14';
        c.fillRect(machX - cbW / 2, wpY, cbW, cbDepth);
        c.fillRect(machX - holeW / 2, wpY + cbDepth, holeW, holePx - cbDepth);
      } else if (op.id === 'tapping') {
        /* Threaded hole */
        c.fillStyle = '#0a0e14';
        c.fillRect(machX - holeW / 2, wpY, holeW, holePx);
        /* Thread lines inside hole */
        c.strokeStyle = 'rgba(120,140,160,0.5)';
        c.lineWidth = 0.5;
        for (var thd = 0; thd < holePx; thd += 3) {
          c.beginPath();
          c.moveTo(machX - holeW / 2, wpY + thd);
          c.lineTo(machX + holeW / 2, wpY + thd);
          c.stroke();
        }
      } else {
        /* Standard cylindrical hole with depth shading */
        c.fillStyle = '#0a0e14';
        c.fillRect(machX - holeW / 2, wpY, holeW, holePx);
        /* Depth gradient to simulate 3D */
        var holeShade = c.createLinearGradient(machX - holeW / 2, 0, machX + holeW / 2, 0);
        holeShade.addColorStop(0, 'rgba(255,255,255,0.06)');
        holeShade.addColorStop(0.5, 'rgba(0,0,0,0)');
        holeShade.addColorStop(1, 'rgba(0,0,0,0.1)');
        c.fillStyle = holeShade;
        c.fillRect(machX - holeW / 2, wpY, holeW, holePx);
      }
      /* Burr/deformation at hole entry */
      if (holePx > 5) {
        c.strokeStyle = hexToRGBA(mat.color, 0.6);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(machX - holeW / 2 - 2, wpY);
        c.quadraticCurveTo(machX - holeW / 2 - 1, wpY - 1.5, machX - holeW / 2, wpY);
        c.stroke();
        c.beginPath();
        c.moveTo(machX + holeW / 2 + 2, wpY);
        c.quadraticCurveTo(machX + holeW / 2 + 1, wpY - 1.5, machX + holeW / 2, wpY);
        c.stroke();
      }
    }

    /* ─── Chip pile on workpiece ─── */
    if (state.chipPile.length > 0) {
      c.save();
      for (var cpi = 0; cpi < state.chipPile.length; cpi++) {
        var cp = state.chipPile[cpi];
        c.fillStyle = hexToRGBA(mat.color, 0.6);
        c.save();
        c.translate(machX + cp.x, wpY + cp.y);
        c.rotate(cp.angle);
        c.fillRect(-cp.size, -cp.size * 0.3, cp.size * 2, cp.size * 0.6);
        c.restore();
      }
      c.restore();
    }

    /* ─── Worktable Vice ─── */
    var viceY = wpY;
    /* Left jaw with 3D gradient */
    var ljGrad = c.createLinearGradient(wpX - 16, 0, wpX, 0);
    ljGrad.addColorStop(0, '#4a5565');
    ljGrad.addColorStop(0.3, '#657585');
    ljGrad.addColorStop(1, '#556575');
    c.fillStyle = ljGrad;
    c.fillRect(wpX - 16, viceY + 2, 16, wpH - 4);
    /* Right jaw */
    var rjGrad = c.createLinearGradient(wpX + wpW, 0, wpX + wpW + 16, 0);
    rjGrad.addColorStop(0, '#556575');
    rjGrad.addColorStop(0.7, '#657585');
    rjGrad.addColorStop(1, '#4a5565');
    c.fillStyle = rjGrad;
    c.fillRect(wpX + wpW, viceY + 2, 16, wpH - 4);
    /* Vice base */
    c.fillStyle = '#4a5565';
    c.fillRect(wpX - 20, tableY - 6, wpW + 40, 6);
    /* Vice handle */
    c.strokeStyle = '#708090';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(wpX + wpW + 16, viceY + wpH / 2);
    c.lineTo(wpX + wpW + 35, viceY + wpH / 2);
    c.stroke();
    c.fillStyle = '#708090';
    c.beginPath(); c.arc(wpX + wpW + 38, viceY + wpH / 2, 4, 0, Math.PI * 2); c.fill();

    /* ─── 4. HEAD ASSEMBLY ─── */
    var hdX = machX - headW / 2;
    /* Drop shadow */
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.35)';
    c.shadowBlur = 10;
    c.shadowOffsetY = 3;
    var hdGrad = c.createLinearGradient(hdX, headY, hdX, headY + headH);
    hdGrad.addColorStop(0, '#4a5565');
    hdGrad.addColorStop(0.3, '#576575');
    hdGrad.addColorStop(0.7, '#556575');
    hdGrad.addColorStop(1, '#4a5565');
    c.fillStyle = hdGrad;
    roundRect(c, hdX, headY, headW, headH, 6);
    c.fill();
    c.restore();
    c.strokeStyle = '#5a6a7a';
    c.lineWidth = 1;
    roundRect(c, hdX, headY, headW, headH, 6);
    c.stroke();
    /* Top edge highlight */
    c.strokeStyle = 'rgba(255,255,255,0.06)';
    c.beginPath(); c.moveTo(hdX + 6, headY + 1); c.lineTo(hdX + headW - 6, headY + 1); c.stroke();

    /* Motor housing on top */
    var motGrad = c.createLinearGradient(0, headY - 40, 0, headY + 2);
    motGrad.addColorStop(0, '#3a4a5a');
    motGrad.addColorStop(0.5, '#445565');
    motGrad.addColorStop(1, '#3a4a5a');
    c.fillStyle = motGrad;
    roundRect(c, hdX + 10, headY - 40, headW - 20, 42, 5);
    c.fill();
    c.strokeStyle = '#4a5a6a';
    roundRect(c, hdX + 10, headY - 40, headW - 20, 42, 5);
    c.stroke();
    /* Motor ventilation lines */
    c.strokeStyle = '#2a3a4a';
    c.lineWidth = 1;
    for (var mv = 0; mv < 5; mv++) {
      var mvx = hdX + 25 + mv * 18;
      c.beginPath(); c.moveTo(mvx, headY - 35); c.lineTo(mvx, headY - 5); c.stroke();
    }

    /* ─── Belt guard with ANIMATED belt drive ─── */
    c.fillStyle = 'rgba(100,120,140,0.3)';
    roundRect(c, hdX + headW - 35, headY + 10, 30, 60, 3);
    c.fill();
    c.strokeStyle = '#5a6a7a';
    c.setLineDash([4, 3]);
    roundRect(c, hdX + headW - 35, headY + 10, 30, 60, 3);
    c.stroke();
    c.setLineDash([]);

    /* Animated step pulleys */
    var pulleyTopCx = hdX + headW - 20;
    var pulleyTopCy = headY + 25;
    var pulleyBotCx = hdX + headW - 20;
    var pulleyBotCy = headY + 55;
    var pulleyTopR = 10;
    var pulleyBotR = 14;
    /* Motor pulley (top) — spinning */
    c.save();
    c.translate(pulleyTopCx, pulleyTopCy);
    c.rotate(state.beltPhase * 2);
    c.strokeStyle = '#708090';
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(0, 0, pulleyTopR, 0, Math.PI * 2); c.stroke();
    /* Pulley spokes */
    c.strokeStyle = '#5a6a7a';
    c.lineWidth = 1;
    for (var psp = 0; psp < 4; psp++) {
      var psa = psp * Math.PI / 2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(psa) * (pulleyTopR - 2), Math.sin(psa) * (pulleyTopR - 2)); c.stroke();
    }
    c.restore();
    /* Spindle pulley (bottom) — spinning slower */
    c.save();
    c.translate(pulleyBotCx, pulleyBotCy);
    c.rotate(state.beltPhase * 1.4);
    c.strokeStyle = '#708090';
    c.lineWidth = 1.5;
    c.beginPath(); c.arc(0, 0, pulleyBotR, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#5a6a7a';
    c.lineWidth = 1;
    for (var psp2 = 0; psp2 < 4; psp2++) {
      var psa2 = psp2 * Math.PI / 2;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(psa2) * (pulleyBotR - 2), Math.sin(psa2) * (pulleyBotR - 2)); c.stroke();
    }
    c.restore();
    /* Animated V-belt (moving dashes) */
    c.strokeStyle = '#2a2a2a';
    c.lineWidth = 2.5;
    var beltDashOffset = state.beltPhase * 10;
    c.setLineDash([6, 4]);
    c.lineDashOffset = -beltDashOffset;
    /* Right side belt */
    c.beginPath();
    c.moveTo(pulleyTopCx + pulleyTopR, pulleyTopCy);
    c.lineTo(pulleyBotCx + pulleyBotR, pulleyBotCy);
    c.stroke();
    /* Left side belt */
    c.beginPath();
    c.moveTo(pulleyTopCx - pulleyTopR, pulleyTopCy);
    c.lineTo(pulleyBotCx - pulleyBotR, pulleyBotCy);
    c.stroke();
    c.setLineDash([]);
    c.lineDashOffset = 0;

    /* ═══ CONTROL PANEL (left side of belt guard) ═══ */
    var cpX = hdX + 5;      /* panel left */
    var cpW = headW - 42;   /* panel width (leave room for belt guard) */

    /* ── Row 1: ON / OFF / E-STOP buttons (y = headY+12) ── */
    var btnY = headY + 12;
    var btnS = 14; /* button size */

    /* ON button — green square */
    var onX = cpX + 4;
    c.fillStyle = '#1a6b1a';
    c.fillRect(onX, btnY, btnS, btnS);
    c.strokeStyle = '#2aaa2a';
    c.lineWidth = 1.5;
    c.strokeRect(onX, btnY, btnS, btnS);
    c.fillStyle = '#44ee44';
    c.font = 'bold 6px sans-serif';
    c.textAlign = 'center';
    c.fillText('ON', onX + btnS / 2, btnY + btnS / 2 + 2);
    state._onBtnRect = { x: onX, y: btnY, w: btnS, h: btnS };

    /* OFF button — red square */
    var offX = cpX + 24;
    c.fillStyle = '#6b1a1a';
    c.fillRect(offX, btnY, btnS, btnS);
    c.strokeStyle = '#cc3333';
    c.lineWidth = 1.5;
    c.strokeRect(offX, btnY, btnS, btnS);
    c.fillStyle = '#ff5555';
    c.font = 'bold 6px sans-serif';
    c.fillText('OFF', offX + btnS / 2, btnY + btnS / 2 + 2);
    state._offBtnRect = { x: offX, y: btnY, w: btnS, h: btnS };

    /* E-STOP — round mushroom-head button */
    var esR = 9;
    var esCx = cpX + 60;
    var esCy = btnY + btnS / 2;
    /* Yellow ring */
    c.fillStyle = '#c8a800';
    c.beginPath(); c.arc(esCx, esCy, esR + 3, 0, Math.PI * 2); c.fill();
    /* Button face — red, pushed-in when latched */
    if (state.estop) {
      /* Latched (pushed in) — darker, smaller */
      c.fillStyle = '#881111';
      c.beginPath(); c.arc(esCx, esCy, esR - 2, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#cc2222';
      c.beginPath(); c.arc(esCx, esCy, esR - 4, 0, Math.PI * 2); c.fill();
    } else {
      /* Released (popped out) — bright red dome */
      c.fillStyle = '#dd2222';
      c.beginPath(); c.arc(esCx, esCy, esR, 0, Math.PI * 2); c.fill();
      /* Highlight dome */
      c.fillStyle = 'rgba(255,100,100,0.4)';
      c.beginPath(); c.arc(esCx - 2, esCy - 2, esR * 0.5, 0, Math.PI * 2); c.fill();
    }
    /* STOP text */
    c.fillStyle = '#fff';
    c.font = 'bold 5px sans-serif';
    c.textAlign = 'center';
    c.fillText('E', esCx, esCy - 1);
    c.fillText('STOP', esCx, esCy + 5);
    state._estopBtnRect = { x: esCx - esR - 3, y: esCy - esR - 3, w: (esR + 3) * 2, h: (esR + 3) * 2 };

    /* ── Row 2: Status lights (y = headY+32) ── */
    var ltY = headY + 33;
    /* Green light — ON when machine powered on */
    var greenOn = state.machineOn && !state.estop;
    c.fillStyle = greenOn ? '#33ff33' : '#1a3a1a';
    c.beginPath(); c.arc(cpX + 11, ltY, 4, 0, Math.PI * 2); c.fill();
    if (greenOn) {
      c.save(); c.shadowColor = '#33ff33'; c.shadowBlur = 6;
      c.beginPath(); c.arc(cpX + 11, ltY, 3, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    c.strokeStyle = '#3a5a3a';
    c.lineWidth = 0.8;
    c.beginPath(); c.arc(cpX + 11, ltY, 4, 0, Math.PI * 2); c.stroke();

    /* Red light — ON when machine OFF or E-stop */
    var redOn = !state.machineOn || state.estop;
    c.fillStyle = redOn ? '#ff3333' : '#3a1a1a';
    c.beginPath(); c.arc(cpX + 31, ltY, 4, 0, Math.PI * 2); c.fill();
    if (redOn) {
      c.save(); c.shadowColor = '#ff3333'; c.shadowBlur = 6;
      c.beginPath(); c.arc(cpX + 31, ltY, 3, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    c.strokeStyle = '#5a3a3a';
    c.lineWidth = 0.8;
    c.beginPath(); c.arc(cpX + 31, ltY, 4, 0, Math.PI * 2); c.stroke();

    /* Light labels */
    c.fillStyle = DIM;
    c.font = '5px sans-serif';
    c.textAlign = 'center';
    c.fillText('RUN', cpX + 11, ltY + 10);
    c.fillText('STOP', cpX + 31, ltY + 10);

    /* ── Row 3: Speed Knob (large, centred) ── */
    var knobCx = cpX + cpW / 2;
    var knobCy = headY + 65;
    var knobR = 18; /* large knob */

    /* Knob background plate */
    c.fillStyle = '#1a2233';
    c.beginPath(); c.arc(knobCx, knobCy, knobR + 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#3a4a5a';
    c.lineWidth = 1;
    c.beginPath(); c.arc(knobCx, knobCy, knobR + 6, 0, Math.PI * 2); c.stroke();

    /* Scale markings around knob */
    c.strokeStyle = '#4a5a6a';
    c.lineWidth = 0.8;
    for (var km = 0; km <= 10; km++) {
      var kAngle = -Math.PI * 0.75 + km * (Math.PI * 1.5 / 10);
      var kInner = knobR + 2;
      var kOuter = knobR + 5;
      c.beginPath();
      c.moveTo(knobCx + Math.cos(kAngle) * kInner, knobCy + Math.sin(kAngle) * kInner);
      c.lineTo(knobCx + Math.cos(kAngle) * kOuter, knobCy + Math.sin(kAngle) * kOuter);
      c.stroke();
    }

    /* Knob body — metallic circle */
    var knobGrad = c.createRadialGradient(knobCx - 4, knobCy - 4, 2, knobCx, knobCy, knobR);
    knobGrad.addColorStop(0, '#6a7a8a');
    knobGrad.addColorStop(0.5, '#4a5a6a');
    knobGrad.addColorStop(1, '#2a3a4a');
    c.fillStyle = knobGrad;
    c.beginPath(); c.arc(knobCx, knobCy, knobR, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#5a6a7a';
    c.lineWidth = 1;
    c.beginPath(); c.arc(knobCx, knobCy, knobR, 0, Math.PI * 2); c.stroke();

    /* Knob indicator line — synced with speed */
    var knobAngle = (state.speed / 2500) * Math.PI * 1.5 - Math.PI * 0.75;
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(knobCx + Math.cos(knobAngle) * 4, knobCy + Math.sin(knobAngle) * 4);
    c.lineTo(knobCx + Math.cos(knobAngle) * (knobR - 2), knobCy + Math.sin(knobAngle) * (knobR - 2));
    c.stroke();
    /* Center dot */
    c.fillStyle = '#aabbcc';
    c.beginPath(); c.arc(knobCx, knobCy, 3, 0, Math.PI * 2); c.fill();

    /* SPEED label above knob */
    c.fillStyle = ACCENT;
    c.font = 'bold 7px "Courier New", monospace';
    c.textAlign = 'center';
    c.fillText('SPEED', knobCx, headY + 44);

    /* RPM value below knob */
    c.fillStyle = '#fff';
    c.font = 'bold 8px "Courier New", monospace';
    c.fillText(state.speed + ' RPM', knobCx, knobCy + knobR + 12);

    /* CW arrow (right side — increase speed) */
    var cwX = knobCx + knobR + 11;
    var cwY = knobCy;
    c.strokeStyle = ACCENT;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cwX, cwY, 7, -Math.PI * 0.6, Math.PI * 0.4);
    c.stroke();
    /* Arrowhead */
    c.fillStyle = ACCENT;
    var cwAx = cwX + 7 * Math.cos(Math.PI * 0.4);
    var cwAy = cwY + 7 * Math.sin(Math.PI * 0.4);
    c.beginPath();
    c.moveTo(cwAx + 3, cwAy - 2);
    c.lineTo(cwAx - 1, cwAy + 3);
    c.lineTo(cwAx - 3, cwAy - 2);
    c.closePath(); c.fill();
    c.fillStyle = ACCENT;
    c.font = 'bold 5px sans-serif';
    c.fillText('+', cwX, cwY + 1);
    state._speedCwRect = { x: cwX - 10, y: cwY - 10, w: 20, h: 20 };

    /* CCW arrow (left side — decrease speed) */
    var ccwX = knobCx - knobR - 11;
    var ccwY = knobCy;
    c.strokeStyle = ACCENT;
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(ccwX, ccwY, 7, Math.PI * 0.6, -Math.PI * 0.4, true);
    c.stroke();
    /* Arrowhead */
    var ccwAx = ccwX + 7 * Math.cos(-Math.PI * 0.4);
    var ccwAy = ccwY + 7 * Math.sin(-Math.PI * 0.4);
    c.fillStyle = ACCENT;
    c.beginPath();
    c.moveTo(ccwAx - 3, ccwAy - 2);
    c.lineTo(ccwAx + 1, ccwAy + 3);
    c.lineTo(ccwAx + 3, ccwAy - 2);
    c.closePath(); c.fill();
    c.fillStyle = ACCENT;
    c.font = 'bold 5px sans-serif';
    c.fillText('\u2212', ccwX, ccwY + 1);
    state._speedCcwRect = { x: ccwX - 10, y: ccwY - 10, w: 20, h: 20 };

    /* ── Row 4: Direction toggle switch (y = headY+100) ── */
    var dirY = headY + headH - 14;
    var dirCx = cpX + cpW / 2;
    var dirW = 30;
    var dirH = 10;

    /* Switch track */
    c.fillStyle = '#1a2233';
    roundRect(c, dirCx - dirW / 2, dirY - dirH / 2, dirW, dirH, 4);
    c.fill();
    c.strokeStyle = '#4a5a6a';
    c.lineWidth = 1;
    roundRect(c, dirCx - dirW / 2, dirY - dirH / 2, dirW, dirH, 4);
    c.stroke();

    /* Toggle handle — slides left (FWD) or right (REV) */
    var toggleX = state.spindleDir === 1 ? dirCx - dirW / 2 + 4 : dirCx + dirW / 2 - 14;
    c.fillStyle = state.spindleDir === 1 ? '#2a8a2a' : '#aa6622';
    roundRect(c, toggleX, dirY - dirH / 2 + 1, 10, dirH - 2, 3);
    c.fill();

    /* FWD / REV labels */
    c.fillStyle = state.spindleDir === 1 ? ACCENT : DIM;
    c.font = 'bold 5px sans-serif';
    c.textAlign = 'right';
    c.fillText('FWD', dirCx - dirW / 2 - 2, dirY + 2);
    c.fillStyle = state.spindleDir === -1 ? '#dd8833' : DIM;
    c.textAlign = 'left';
    c.fillText('REV', dirCx + dirW / 2 + 2, dirY + 2);

    /* Hit rects for direction toggle */
    state._dirFwdRect = { x: dirCx - dirW / 2 - 12, y: dirY - 8, w: dirW / 2 + 12, h: 16 };
    state._dirRevRect = { x: dirCx, y: dirY - 8, w: dirW / 2 + 12, h: 16 };

    /* ─── 5. QUILL & SPINDLE ─── */
    var quillTop = headY + headH;
    var quillW = 18;
    var quillBaseLen = 80;
    var quillLen = quillBaseLen + drillOffset;

    /* Quill (outer sleeve) with enhanced cylindrical shading */
    var qGrad = c.createLinearGradient(machX - quillW / 2, 0, machX + quillW / 2, 0);
    qGrad.addColorStop(0, '#4a5a6a');
    qGrad.addColorStop(0.15, '#6a7a8a');
    qGrad.addColorStop(0.4, '#8a9aaa');
    qGrad.addColorStop(0.6, '#8a9aaa');
    qGrad.addColorStop(0.85, '#6a7a8a');
    qGrad.addColorStop(1, '#4a5a6a');
    c.fillStyle = qGrad;
    c.fillRect(machX - quillW / 2, quillTop, quillW, quillLen);

    /* Spindle inside quill (narrower, polished steel look) */
    var spW = 10;
    var spGrad = c.createLinearGradient(machX - spW / 2, 0, machX + spW / 2, 0);
    spGrad.addColorStop(0, '#7a8b98');
    spGrad.addColorStop(0.3, '#aabbc8');
    spGrad.addColorStop(0.5, '#c0d0dd');
    spGrad.addColorStop(0.7, '#aabbc8');
    spGrad.addColorStop(1, '#7a8b98');
    c.fillStyle = spGrad;
    c.fillRect(machX - spW / 2, quillTop + 5, spW, quillLen - 5);

    /* Rotation marks on spindle (animated helical lines) */
    if (state.running || state.animT > 0) {
      c.save();
      c.globalAlpha = 0.4;
      c.lineWidth = 0.8;
      var rotMarkY = quillTop + 15;
      while (rotMarkY < quillTop + quillLen - 15) {
        var helixPhase = state.animAngle * 2 + rotMarkY * 0.12;
        var helixX = Math.sin(helixPhase) * (spW / 2 - 1);
        /* Draw helix as visible line crossing the spindle */
        c.strokeStyle = helixX > 0 ? 'rgba(200,220,240,0.5)' : 'rgba(80,90,100,0.5)';
        c.beginPath();
        c.moveTo(machX + helixX, rotMarkY);
        c.quadraticCurveTo(machX + Math.sin(helixPhase + 0.3) * (spW / 2 - 1), rotMarkY + 5,
                           machX + Math.sin(helixPhase + 0.6) * (spW / 2 - 1), rotMarkY + 10);
        c.stroke();
        rotMarkY += 10;
      }
      c.restore();
    }

    /* ─── Depth Stop ─── */
    var dsX = machX + quillW / 2 + 6;
    var dsY = quillTop + 10;
    c.fillStyle = '#607080';
    c.fillRect(dsX, dsY, 5, 50);
    /* Depth stop nut */
    c.fillStyle = '#808a9a';
    c.fillRect(dsX - 2, dsY + 20, 9, 8);
    /* Stop collar at bottom */
    c.fillStyle = '#708090';
    c.fillRect(dsX - 3, dsY + 45, 11, 6);

    /* ─── 6. FEED HANDLE (3-spoke, 50% larger, interactive) ─── */
    var fhCx = machX + quillW / 2 + 40;
    var fhCy = quillTop + quillLen - 20;
    var fhR = 33; /* 50% larger than original 22 */
    /* Feed handle rotation — based on quill descent (rack mechanism), NOT spindle RPM */
    var fhAngleBase = state.animT * Math.PI * 4; /* rotates proportional to quill travel */
    /* Store hit-test circle as a rect bounding box */
    state._feedHandleRect = { x: fhCx - fhR - 6, y: fhCy - fhR - 6, w: (fhR + 6) * 2, h: (fhR + 6) * 2 };

    c.save();
    c.translate(fhCx, fhCy);
    c.rotate(fhAngleBase);

    /* Glow ring when pressed */
    if (state.feedHandleDown) {
      c.shadowColor = ACCENT;
      c.shadowBlur = 15;
    }

    /* Hub */
    c.fillStyle = state.feedHandleDown ? ACCENT : '#606a7a';
    c.beginPath(); c.arc(0, 0, 8, 0, Math.PI * 2); c.fill();
    c.shadowBlur = 0; c.shadowColor = 'transparent';

    /* Three spokes */
    c.strokeStyle = state.feedHandleDown ? '#8acf8e' : '#708090';
    c.lineWidth = 4;
    for (var sp = 0; sp < 3; sp++) {
      var spAngle = sp * Math.PI * 2 / 3;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(spAngle) * fhR, Math.sin(spAngle) * fhR);
      c.stroke();
      /* Knob at end — larger */
      c.fillStyle = state.feedHandleDown ? ACCENT : '#3a4a5a';
      c.beginPath();
      c.arc(Math.cos(spAngle) * fhR, Math.sin(spAngle) * fhR, 6, 0, Math.PI * 2);
      c.fill();
      /* Knob highlight */
      c.fillStyle = 'rgba(255,255,255,0.15)';
      c.beginPath();
      c.arc(Math.cos(spAngle) * fhR - 1, Math.sin(spAngle) * fhR - 1, 2, 0, Math.PI * 2);
      c.fill();
    }

    /* "Press & hold" hint text below handle */
    c.rotate(-fhAngleBase); /* un-rotate for text */
    if (!state.running && !state.feedHandleDown) {
      c.fillStyle = 'rgba(100,120,140,0.5)';
      c.font = '6px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText('HOLD TO', 0, fhR + 12);
      c.fillText('DRILL', 0, fhR + 19);
    }

    c.restore();

    /* ─── 7. CHUCK (with rotation shading) ─── */
    var chuckTop = quillTop + quillLen;
    var chuckH = 20;
    var chuckTopW = quillW;
    var chuckBotW = 12;
    /* Chuck body with metallic gradient */
    var ckGrad = c.createLinearGradient(machX - chuckTopW / 2, 0, machX + chuckTopW / 2, 0);
    ckGrad.addColorStop(0, '#5a6a7a');
    ckGrad.addColorStop(0.3, '#8a9aaa');
    ckGrad.addColorStop(0.5, '#9aabb8');
    ckGrad.addColorStop(0.7, '#8a9aaa');
    ckGrad.addColorStop(1, '#5a6a7a');
    c.fillStyle = ckGrad;
    c.beginPath();
    c.moveTo(machX - chuckTopW / 2, chuckTop);
    c.lineTo(machX + chuckTopW / 2, chuckTop);
    c.lineTo(machX + chuckBotW / 2, chuckTop + chuckH);
    c.lineTo(machX - chuckBotW / 2, chuckTop + chuckH);
    c.closePath();
    c.fill();
    /* Chuck jaws (3 lines) with rotation-aware highlight */
    c.lineWidth = 1;
    for (var cj = 0; cj < 3; cj++) {
      var cjY = chuckTop + 5 + cj * 5;
      var cjHalfW = lerp(chuckTopW / 2, chuckBotW / 2, (cjY - chuckTop) / chuckH);
      /* Rotating highlight on jaw lines */
      var jawPhase = Math.sin(state.animAngle * 3 + cj * 2.1);
      c.strokeStyle = jawPhase > 0 ? 'rgba(180,200,220,0.5)' : 'rgba(60,70,85,0.7)';
      c.beginPath();
      c.moveTo(machX - cjHalfW, cjY);
      c.lineTo(machX + cjHalfW, cjY);
      c.stroke();
    }
    /* Chuck key hole */
    c.fillStyle = '#3a4a5a';
    c.beginPath(); c.arc(machX + chuckBotW / 2 + 2, chuckTop + chuckH / 2, 2, 0, Math.PI * 2); c.fill();

    /* ─── 8. DRILL BIT (with enhanced helical flutes) ─── */
    var bitTop = chuckTop + chuckH;
    var bitLen = 60;
    var bitW = Math.max(4, state.dia * 0.35);

    /* ── Drill bit — TiN-coated yellow/gold with black flute lines ── */
    var bitGrad = c.createLinearGradient(machX - bitW / 2, 0, machX + bitW / 2, 0);
    bitGrad.addColorStop(0, '#8a7020');
    bitGrad.addColorStop(0.15, '#b89828');
    bitGrad.addColorStop(0.35, '#d4b040');
    bitGrad.addColorStop(0.5, '#e0c050');
    bitGrad.addColorStop(0.65, '#d4b040');
    bitGrad.addColorStop(0.85, '#b89828');
    bitGrad.addColorStop(1, '#8a7020');

    /* Speed blur effect — concentric motion lines when spinning fast */
    var isSpinning = state.running;
    var speedFactor = state.speed / 3000; /* 0..1 */

    /* ── Draw bit shape based on state.bitType ── */
    var bt = state.bitType;

    if (bt === 'twist') {
      /* TWIST DRILL (DIN 338) — V-point, 2 helical flutes */
      c.fillStyle = bitGrad;
      c.beginPath();
      c.moveTo(machX - bitW / 2, bitTop);
      c.lineTo(machX + bitW / 2, bitTop);
      c.lineTo(machX + bitW / 2, bitTop + bitLen - 8);
      c.lineTo(machX, bitTop + bitLen);
      c.lineTo(machX - bitW / 2, bitTop + bitLen - 8);
      c.closePath(); c.fill();
      c.strokeStyle = '#0a0a05'; c.lineWidth = 1; c.stroke();
      /* Animated helical flutes */
      var fluteStep = 5;
      c.lineWidth = 1.5;
      for (var fy = bitTop + 3; fy < bitTop + bitLen - 10; fy += fluteStep) {
        var localW = bitW / 2 * clamp(1 - (fy - (bitTop + bitLen - 12)) / 8, 0, 1);
        for (var fl = 0; fl < 2; fl++) {
          var fPhase = state.animAngle * 2 + fy * 0.2 + fl * Math.PI;
          var fX = Math.sin(fPhase) * localW * 0.9;
          var fNextX = Math.sin(fPhase + fluteStep * 0.2) * localW * 0.9;
          var fVis = Math.cos(fPhase);
          /* Dark black flute grooves on golden body */
          c.strokeStyle = fVis > 0.1 ? 'rgba(10,10,0,' + (0.35 + fVis * 0.45) + ')' :
                                        'rgba(180,160,60,' + (0.15 + Math.abs(fVis) * 0.2) + ')';
          c.beginPath();
          c.moveTo(machX + fX, fy);
          c.quadraticCurveTo(machX + (fX + fNextX) / 2 + Math.cos(fPhase) * 2, fy + fluteStep / 2,
                             machX + fNextX, fy + fluteStep);
          c.stroke();
        }
      }
      /* Point cutting edges — black lines on gold */
      c.strokeStyle = 'rgba(0,0,0,0.7)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(machX - bitW / 2, bitTop + bitLen - 8);
      c.lineTo(machX, bitTop + bitLen); c.lineTo(machX + bitW / 2, bitTop + bitLen - 8); c.stroke();
      /* Chisel edge — bright tip */
      c.strokeStyle = '#fff'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(machX - 2, bitTop + bitLen - 1); c.lineTo(machX + 2, bitTop + bitLen - 1); c.stroke();

    } else if (bt === 'center') {
      /* CENTER DRILL (DIN 333) — 60-deg cone (top) + narrow pilot + 60-deg point (tip) */
      var pilotW = bitW * 0.4;
      var coneLen = bitLen * 0.45;
      var pilotLen = bitLen * 0.42;
      var tipLen = bitLen * 0.13;
      /* 60-deg countersink cone at TOP (wide at shank → narrow at bottom of cone) */
      c.fillStyle = bitGrad;
      c.beginPath();
      c.moveTo(machX - bitW * 0.7, bitTop);
      c.lineTo(machX + bitW * 0.7, bitTop);
      c.lineTo(machX + pilotW / 2, bitTop + coneLen);
      c.lineTo(machX - pilotW / 2, bitTop + coneLen);
      c.closePath(); c.fill();
      c.strokeStyle = '#0a0a05'; c.lineWidth = 0.5; c.stroke();
      /* Edge highlights on cone — black lines on gold */
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(machX - bitW * 0.7, bitTop);
      c.lineTo(machX - pilotW / 2, bitTop + coneLen); c.stroke();
      c.beginPath(); c.moveTo(machX + bitW * 0.7, bitTop);
      c.lineTo(machX + pilotW / 2, bitTop + coneLen); c.stroke();
      /* Narrow pilot section */
      c.fillStyle = bitGrad;
      c.fillRect(machX - pilotW / 2, bitTop + coneLen, pilotW, pilotLen);
      c.strokeStyle = '#0a0a05'; c.lineWidth = 0.5;
      c.strokeRect(machX - pilotW / 2, bitTop + coneLen, pilotW, pilotLen);
      /* 60-deg drill point at TIP (bottom) */
      c.fillStyle = bitGrad;
      c.beginPath();
      c.moveTo(machX - pilotW / 2, bitTop + coneLen + pilotLen);
      c.lineTo(machX, bitTop + coneLen + pilotLen + tipLen);
      c.lineTo(machX + pilotW / 2, bitTop + coneLen + pilotLen);
      c.closePath(); c.fill();
      /* Bright chisel edge at tip */
      c.strokeStyle = '#fff'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(machX - 2, bitTop + coneLen + pilotLen + 1); c.lineTo(machX + 2, bitTop + coneLen + pilotLen + 1); c.stroke();

    } else if (bt === 'step') {
      /* STEP DRILL (Unibit) — 4 stepped diameters */
      var steps = 4;
      c.fillStyle = bitGrad;
      for (var si = 0; si < steps; si++) {
        var sTop = bitTop + si * (bitLen / steps);
        var sH = bitLen / steps - 1;
        var sW = bitW * 0.35 + bitW * 0.7 * ((steps - si) / steps);
        c.fillRect(machX - sW / 2, sTop, sW, sH);
        c.strokeStyle = '#0a0a05'; c.lineWidth = 0.5;
        c.strokeRect(machX - sW / 2, sTop, sW, sH);
        /* Step edge — black line on gold */
        c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(machX - sW / 2, sTop + sH); c.lineTo(machX + sW / 2, sTop + sH); c.stroke();
      }
      /* Tip point on smallest step */
      var tipW = bitW * 0.35;
      c.fillStyle = bitGrad;
      c.beginPath();
      c.moveTo(machX - tipW / 2, bitTop + bitLen);
      c.lineTo(machX, bitTop + bitLen + 4);
      c.lineTo(machX + tipW / 2, bitTop + bitLen);
      c.closePath(); c.fill();
      /* Straight flute lines — dark on gold */
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.8;
      for (var sfl = 0; sfl < 2; sfl++) {
        var sfx = machX + (sfl === 0 ? -1 : 1) * 1.5;
        c.beginPath(); c.moveTo(sfx, bitTop + 3); c.lineTo(sfx, bitTop + bitLen - 2); c.stroke();
      }

    } else if (bt === 'countersink') {
      /* COUNTERSINK BIT (DIN 335) — narrow shank + 90-deg cone, 3 flutes */
      var csShankW = bitW * 0.3;
      var csShankLen = bitLen * 0.5;
      /* Shank */
      c.fillStyle = bitGrad;
      c.fillRect(machX - csShankW / 2, bitTop, csShankW, csShankLen);
      c.strokeStyle = '#0a0a05'; c.lineWidth = 0.5;
      c.strokeRect(machX - csShankW / 2, bitTop, csShankW, csShankLen);
      /* 90-degree cone */
      c.fillStyle = bitGrad;
      c.beginPath();
      c.moveTo(machX - csShankW / 2, bitTop + csShankLen);
      c.lineTo(machX - bitW, bitTop + bitLen);
      c.lineTo(machX + bitW, bitTop + bitLen);
      c.lineTo(machX + csShankW / 2, bitTop + csShankLen);
      c.closePath(); c.fill();
      c.strokeStyle = '#0a0a05'; c.lineWidth = 0.5; c.stroke();
      /* 3 radial flute lines on cone — dark on gold */
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.2;
      for (var cfi = 0; cfi < 3; cfi++) {
        var cfAngle = cfi * Math.PI * 2 / 3 + state.animAngle;
        var cfxEnd = Math.sin(cfAngle) * bitW * 0.7;
        c.beginPath();
        c.moveTo(machX, bitTop + csShankLen + 3);
        c.lineTo(machX + cfxEnd, bitTop + bitLen - 1);
        c.stroke();
      }
      /* Bottom edge — black on gold */
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(machX - bitW, bitTop + bitLen);
      c.lineTo(machX + bitW, bitTop + bitLen); c.stroke();

    } else if (bt === 'spade') {
      /* SPADE / FLAT BIT (DIN 7487) — narrow shank + flat paddle + centre spike */
      var spShankW = bitW * 0.25;
      var spShankLen = bitLen * 0.45;
      var spPadW = bitW * 1.3;
      var spPadH = bitLen * 0.35;
      /* Shank */
      c.fillStyle = bitGrad;
      c.fillRect(machX - spShankW / 2, bitTop, spShankW, spShankLen);
      c.strokeStyle = '#0a0a05'; c.lineWidth = 0.5;
      c.strokeRect(machX - spShankW / 2, bitTop, spShankW, spShankLen);
      /* Paddle */
      c.fillStyle = bitGrad;
      c.fillRect(machX - spPadW / 2, bitTop + spShankLen, spPadW, spPadH);
      c.strokeStyle = '#0a0a05'; c.lineWidth = 0.5;
      c.strokeRect(machX - spPadW / 2, bitTop + spShankLen, spPadW, spPadH);
      /* Centre spike */
      c.fillStyle = bitGrad;
      c.beginPath();
      c.moveTo(machX - 2, bitTop + spShankLen + spPadH);
      c.lineTo(machX, bitTop + bitLen + 4);
      c.lineTo(machX + 2, bitTop + spShankLen + spPadH);
      c.closePath(); c.fill();
      /* Cutting edge — black on gold */
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(machX - spPadW / 2, bitTop + spShankLen + spPadH);
      c.lineTo(machX + spPadW / 2, bitTop + spShankLen + spPadH);
      c.stroke();
      /* Flat face line — dark on gold */
      c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(machX, bitTop + spShankLen + 2);
      c.lineTo(machX, bitTop + spShankLen + spPadH - 2); c.stroke();
    }

    /* Speed blur — for all bit types when spinning */
    if (isSpinning && speedFactor > 0.1) {
      c.save();
      c.globalAlpha = speedFactor * 0.35;
      c.strokeStyle = 'rgba(140,170,200,0.5)';
      c.lineWidth = 0.5;
      var blurCount = Math.floor(3 + speedFactor * 6);
      for (var bi = 0; bi < blurCount; bi++) {
        var blurY = bitTop + 5 + (bitLen - 15) * (bi / blurCount);
        var blurW2 = bitW / 2 + 2 + speedFactor * 4;
        c.beginPath(); c.moveTo(machX - blurW2, blurY); c.lineTo(machX - blurW2 - 2 - speedFactor * 3, blurY + 1); c.stroke();
        c.beginPath(); c.moveTo(machX + blurW2, blurY); c.lineTo(machX + blurW2 + 2 + speedFactor * 3, blurY + 1); c.stroke();
      }
      c.restore();
    }

    /* Store drill bit hit zone for click-to-change */
    state._drillBitRect = { x: machX - bitW / 2 - 5, y: bitTop - 5, w: bitW + 10, h: bitLen + 15 };

    /* Hover tooltip — "Click to change drill bit" */
    if (state.hoverDrillBit && !state.machineOn && !state.running) {
      c.save();
      c.fillStyle = 'rgba(0,0,0,0.75)';
      var ttW = 90, ttH = 16;
      var ttX = machX - ttW / 2;
      var ttY = bitTop - 22;
      c.fillRect(ttX, ttY, ttW, ttH);
      c.fillStyle = '#fff';
      c.font = 'bold 7px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText('\uD83D\uDD27 Click to change bit', machX, ttY + 11);
      c.restore();
    }

    /* ─── Heat haze effect at drill tip ─── */
    if (state.heatGlow > 0.05) {
      c.save();
      var heatAlpha = state.heatGlow * 0.6;
      /* Orange/red glow at the cutting zone */
      var heatGrad = c.createRadialGradient(machX, bitTop + bitLen, 0, machX, bitTop + bitLen, 20);
      heatGrad.addColorStop(0, 'rgba(255,120,30,' + heatAlpha * 0.5 + ')');
      heatGrad.addColorStop(0.5, 'rgba(255,80,20,' + heatAlpha * 0.25 + ')');
      heatGrad.addColorStop(1, 'rgba(255,40,10,0)');
      c.fillStyle = heatGrad;
      c.fillRect(machX - 25, bitTop + bitLen - 15, 50, 35);
      /* Wavy heat distortion lines */
      c.strokeStyle = 'rgba(255,150,50,' + heatAlpha * 0.4 + ')';
      c.lineWidth = 0.8;
      var hTime = performance.now() * 0.003;
      for (var hi = 0; hi < 3; hi++) {
        c.beginPath();
        var hStartY = bitTop + bitLen - 5 + hi * 6;
        c.moveTo(machX - 10, hStartY);
        c.quadraticCurveTo(machX - 5 + Math.sin(hTime + hi) * 4, hStartY - 4,
                           machX, hStartY - 2 + Math.sin(hTime * 1.3 + hi) * 3);
        c.quadraticCurveTo(machX + 5 + Math.cos(hTime + hi) * 4, hStartY - 5,
                           machX + 10, hStartY - 1);
        c.stroke();
      }
      c.restore();
    }

    /* ─── Cutting force indicators (concentric rings at drill point) ─── */
    if (state.cutting) {
      c.save();
      var forceIntensity = clamp(state.Ft / 2500, 0.1, 1);
      var ringTime = performance.now() * 0.004;
      for (var ri = 0; ri < 3; ri++) {
        var ringR = 5 + (ringTime + ri * 1.5) % 20;
        var ringAlpha = (1 - ringR / 25) * forceIntensity * 0.35;
        if (ringAlpha > 0) {
          c.strokeStyle = 'rgba(255,200,100,' + ringAlpha + ')';
          c.lineWidth = 1;
          c.beginPath();
          c.arc(machX, bitTop + bitLen, ringR, 0, Math.PI * 2);
          c.stroke();
        }
      }
      c.restore();
    }

    /* ─── Guard (transparent shield with chip bouncing effect) ─── */
    c.save();
    var guardX = machX - 35;
    var guardY = chuckTop - 10;
    var guardW2 = 70;
    var guardH2 = chuckH + bitLen + 25;
    c.fillStyle = 'rgba(100,200,255,0.04)';
    roundRect(c, guardX, guardY, guardW2, guardH2, 8);
    c.fill();
    /* Guard edge with subtle reflection */
    c.strokeStyle = 'rgba(100,200,255,0.25)';
    c.lineWidth = 1.5;
    roundRect(c, guardX, guardY, guardW2, guardH2, 8);
    c.stroke();
    /* Specular reflection on guard */
    c.strokeStyle = 'rgba(200,240,255,0.12)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(guardX + 4, guardY + 10);
    c.lineTo(guardX + 4, guardY + guardH2 - 10);
    c.stroke();
    /* Chip impact marks on guard when cutting */
    if (state.cutting) {
      var impactTime = performance.now() * 0.005;
      for (var gi = 0; gi < 2; gi++) {
        var giy = guardY + 15 + ((impactTime * 7 + gi * 37) % (guardH2 - 30));
        var gix = guardX + (gi % 2 === 0 ? 2 : guardW2 - 2);
        c.fillStyle = 'rgba(255,200,100,' + (0.3 + Math.sin(impactTime + gi * 3) * 0.2) + ')';
        c.beginPath(); c.arc(gix, giy, 1.5, 0, Math.PI * 2); c.fill();
      }
    }
    c.restore();

    /* ─── Coolant nozzle & enhanced stream ─── */
    if (state.coolantOn) {
      var coolX = machX - 40;
      var coolY = chuckTop + 5;
      /* Nozzle arm — metallic tube */
      var nozGrad = c.createLinearGradient(hdX + 5, headY + headH - 5, coolX, coolY);
      nozGrad.addColorStop(0, '#4477aa');
      nozGrad.addColorStop(1, '#5588bb');
      c.strokeStyle = nozGrad;
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(hdX + 5, headY + headH - 5);
      c.quadraticCurveTo(coolX - 20, coolY - 30, coolX, coolY);
      c.stroke();
      /* Nozzle tip */
      c.fillStyle = '#5588bb';
      c.beginPath(); c.arc(coolX, coolY, 3.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.15)';
      c.beginPath(); c.arc(coolX - 1, coolY - 1, 1.5, 0, Math.PI * 2); c.fill();

      /* Coolant flowing stream when cutting */
      if (state.cutting) {
        c.save();
        var coolTime = performance.now() * 0.005;
        /* Main stream — bezier curve from nozzle to workpiece */
        var streamEndX = machX - 5;
        var streamEndY = wpY - 2;
        for (var si = 0; si < 4; si++) {
          var sAlpha = 0.15 + si * 0.08;
          c.strokeStyle = 'rgba(80,170,255,' + sAlpha + ')';
          c.lineWidth = 2.5 - si * 0.4;
          c.beginPath();
          c.moveTo(coolX + Math.sin(coolTime + si) * 1, coolY + 2);
          c.bezierCurveTo(
            coolX + 8 + Math.sin(coolTime * 1.2 + si) * 3, coolY + (streamEndY - coolY) * 0.3,
            streamEndX - 5 + Math.sin(coolTime * 0.8 + si) * 2, coolY + (streamEndY - coolY) * 0.7,
            streamEndX + Math.sin(coolTime + si * 1.5) * 2, streamEndY
          );
          c.stroke();
        }
        /* Splash particles at impact point */
        for (var spi = 0; spi < state.coolDrops.length; spi++) {
          var sd = state.coolDrops[spi];
          c.globalAlpha = clamp(sd.life, 0, 0.6);
          c.fillStyle = 'rgba(100,180,255,0.7)';
          c.beginPath();
          c.arc(streamEndX + sd.x, streamEndY + sd.y, sd.size, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
        c.restore();
      }
    }

    /* ─── Animated Chips (material-specific shapes) ─── */
    if (state.chips.length > 0) {
      var chipBaseX = machX;
      var chipBaseY = wpY;
      c.save();
      for (var ci2 = 0; ci2 < state.chips.length; ci2++) {
        var chip2 = state.chips[ci2];
        c.globalAlpha = clamp(chip2.life, 0, 1);
        c.save();
        c.translate(chipBaseX + chip2.x, chipBaseY + chip2.y);
        c.rotate(chip2.angle);

        if (chip2.type === 'powder') {
          /* Cast iron — tiny dust particles */
          c.fillStyle = mat.color;
          c.fillRect(-chip2.size / 2, -chip2.size / 2, chip2.size, chip2.size);
        } else if (chip2.type === 'continuous') {
          /* Aluminum — long curly ribbons */
          c.strokeStyle = mat.color;
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(0, 0);
          var curlR = chip2.size * 1.5;
          c.arc(curlR, 0, curlR, Math.PI, Math.PI + chip2.curl * Math.PI * 1.5, false);
          c.stroke();
        } else {
          /* Curly chip — spiral arc (steel/brass/stainless) */
          c.strokeStyle = mat.color;
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(0, 0);
          c.quadraticCurveTo(chip2.size * chip2.curl, -chip2.size,
                             chip2.size * 2, -chip2.size * chip2.curl * 0.5);
          c.stroke();
          /* Chip body */
          c.fillStyle = hexToRGBA(mat.color, 0.6);
          c.beginPath(); c.arc(chip2.size, -chip2.size * 0.3, chip2.size * 0.4, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }
      c.restore();
    }

    /* ─── Progress bar (drilling depth based on actual penetration) ─── */
    var drillPct = cinfo.contact ? clamp(cinfo.penetration / wpH, 0, 1) : 0;
    if (drillPct > 0 || state.animT > 0) {
      var pbX = machX + baseW / 2 - 25;
      var pbY = tableY - 60;
      var pbW2 = 8;
      var pbH2 = 50;
      /* Track */
      c.fillStyle = '#1f2535';
      roundRect(c, pbX, pbY, pbW2, pbH2, 3);
      c.fill();
      /* Fill — green for actual penetration */
      if (drillPct > 0) {
        c.fillStyle = ACCENT;
        var fillH = drillPct * pbH2;
        roundRect(c, pbX, pbY + pbH2 - fillH, pbW2, fillH, 3);
        c.fill();
      }
      /* Label — show penetration % */
      c.fillStyle = DIM;
      c.font = '9px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(Math.round(drillPct * 100) + '%', pbX + pbW2 / 2, pbY + pbH2 + 12);
      /* Depth value in mm */
      c.fillStyle = ACCENT;
      c.font = 'bold 8px "Courier New", monospace';
      var penetMm = cinfo.contact ? roundN(cinfo.penetration / wpH * state.depth, 1) : 0;
      c.fillText(dfix(penetMm, 'len', 1) + ' ' + du('len'), pbX + pbW2 / 2, pbY - 6);
    }

    /* ─── Return spring indicator ─── */
    c.save();
    /* Spring color shifts when compressed */
    var springStress = state.animT;
    c.strokeStyle = springStress > 0.5 ? 'rgba(180,100,80,' + (0.5 + springStress * 0.4) + ')' : '#607080';
    c.lineWidth = 1.2;
    var rsX = machX - quillW / 2 - 8;
    var rsY1 = quillTop + 5;
    var rsY2 = quillTop + 30 + drillOffset * 0.3;
    var rsAmps = 3 + springStress * 1;
    var rsSegs = 10;
    c.beginPath();
    c.moveTo(rsX, rsY1);
    for (var rsi = 1; rsi <= rsSegs; rsi++) {
      var rsProgress = rsi / rsSegs;
      var rsy = rsY1 + (rsY2 - rsY1) * rsProgress;
      var rsx = rsX + (rsi % 2 === 0 ? -rsAmps : rsAmps);
      c.lineTo(rsx, rsy);
    }
    c.lineTo(rsX, rsY2);
    c.stroke();
    c.restore();

    /* ═══ LABELS WITH LEADER LINES (togglable, hidden by default) ═══ */
    if (state.showLabels) {
      var rX = 390;  /* right column: label text starts here */
      var lX = 118;  /* left column:  label text ends here (right-aligned) */
      var bitLabel = DRILL_BITS.filter(function(b) { return b.id === state.bitType; })[0];

      /* ──────────────────────────────────────────────────────────────
         RIGHT-SIDE LABELS — ordered by source Y (no line crossings)
         ────────────────────────────────────────────────────────────── */

      /* 6. Motor — top of head housing */
      drawLeaderLine(c, hdX + headW / 2, headY - 18, rX, 62, '6. Motor');
      /* 19. Emergency Stop — red mushroom button on control panel */
      drawLeaderLine(c, esCx, esCy, rX, 90, '19. Emergency Stop');
      /* 15. Power Switch — ON/OFF rocker on control panel */
      drawLeaderLine(c, onX + btnS / 2, btnY + btnS / 2, rX, 118, '15. Power Switch (ON/OFF)');
      /* 14. Speed Selector — step pulley belt guard */
      drawLeaderLine(c, hdX + headW - 18, headY + 40, rX, 146, '14. Speed Selector');
      /* 5. Head Assembly — main housing */
      drawLeaderLine(c, hdX + headW / 2, headY + headH / 2, rX, 174, '5. Head Assembly');
      /* 7. Spindle — rotating shaft inside quill */
      drawLeaderLine(c, machX + quillW / 2, quillTop + 22, rX, 214, '7. Spindle');
      /* 12. Depth Stop — rod alongside quill */
      drawLeaderLine(c, dsX + 4, dsY + 16, rX, 242, '12. Depth Stop');
      /* 8. Quill — sliding sleeve */
      drawLeaderLine(c, machX + quillW / 2, quillTop + quillLen / 2, rX, 270, '8. Quill');
      /* 11. Feed Handle — three-spoke handle */
      drawLeaderLine(c, fhCx, fhCy, rX, 298, '11. Feed Handle');
      /* 16. Guard — transparent safety shield */
      drawLeaderLine(c, guardX + guardW2, guardY + guardH2 / 3, rX, 326, '16. Guard');
      /* 9. Chuck — three-jaw grip */
      drawLeaderLine(c, machX + quillW / 2, chuckTop + chuckH / 2, rX, 354, '9. Chuck');
      /* 10. Drill Bit — cutting tool */
      drawLeaderLine(c, machX + 4, bitTop + bitLen * 0.45, rX, 382, '10. ' + (bitLabel ? bitLabel.name : 'Drill Bit') + ' \u00D8' + state.dia);
      /* 2. Column — vertical pillar */
      drawLeaderLine(c, machX + colW / 2, (headY + headH + tableY) / 2, rX, 415, '2. Column');
      /* 18. Vice & Workpiece */
      drawLeaderLine(c, wpX + wpW + 18, wpY + wpH / 2, rX, 462, '18. Vice & Workpiece');
      /* 3. Table */
      drawLeaderLine(c, machX + tableW / 2 - 8, tableY + tableH / 2, rX, 490, '3. Table');
      /* 4. Table Clamp */
      drawLeaderLine(c, colX - 4, tableY + tableH + 8, rX, 516, '4. Table Clamp');

      /* ──────────────────────────────────────────────────────────────
         LEFT-SIDE LABELS — parts naturally on the left of the column
         ────────────────────────────────────────────────────────────── */

      /* 13. Return Spring — coil spring left of quill */
      drawLeaderLine(c, rsX, (rsY1 + rsY2) / 2, lX, quillTop + 22, '13. Return Spring', 'right');
      /* 17. Coolant Nozzle — flexible tube on left */
      if (state.coolantOn) drawLeaderLine(c, machX - 40, chuckTop + 5, lX, chuckTop + 15, '17. Coolant Nozzle', 'right');
      /* 1. Base — heavy cast iron base (partially below canvas) */
      drawLeaderLine(c, machX - colW / 2, MH - 18, lX, MH - 30, '1. Base', 'right');
    }

    /* End vibration transform */
    c.restore();

    /* End zoom transform */
    if (state.zoomed) c.restore();

    /* ═══ CANVAS TOOL BUTTONS (always drawn at fixed screen position) ═══ */

    /* ── Tool buttons (top-right, vertical, compact) ── */
    var tbX = MW - 32;   /* right edge */
    var tbW = 24;
    var tbH = 24;
    var zoomBtnY = 50;
    var labelBtnY = 80;
    state._zoomBtnRect = { x: tbX - tbW / 2, y: zoomBtnY - tbH / 2, w: tbW, h: tbH };
    state._labelBtnRect = { x: tbX - tbW / 2, y: labelBtnY - tbH / 2, w: tbW, h: tbH };

    /* Zoom button */
    c.fillStyle = state.zoomed ? ACCENT : 'rgba(22,27,39,0.85)';
    c.fillRect(tbX - tbW / 2, zoomBtnY - tbH / 2, tbW, tbH);
    c.strokeStyle = state.zoomed ? '#66bb6a' : 'rgba(67,160,71,0.6)';
    c.lineWidth = 1;
    c.strokeRect(tbX - tbW / 2, zoomBtnY - tbH / 2, tbW, tbH);
    /* Magnifier icon */
    c.strokeStyle = state.zoomed ? '#fff' : ACCENT;
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(tbX - 2, zoomBtnY - 1, 5, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(tbX + 2, zoomBtnY + 3); c.lineTo(tbX + 5, zoomBtnY + 6); c.stroke();
    /* +/- inside lens */
    c.fillStyle = state.zoomed ? '#fff' : ACCENT;
    c.font = 'bold 7px sans-serif';
    c.textAlign = 'center';
    c.fillText(state.zoomed ? '\u2212' : '+', tbX - 2, zoomBtnY + 1);

    /* Labels toggle button */
    c.fillStyle = state.showLabels ? ACCENT : 'rgba(22,27,39,0.85)';
    c.fillRect(tbX - tbW / 2, labelBtnY - tbH / 2, tbW, tbH);
    c.strokeStyle = state.showLabels ? '#66bb6a' : 'rgba(67,160,71,0.6)';
    c.lineWidth = 1;
    c.strokeRect(tbX - tbW / 2, labelBtnY - tbH / 2, tbW, tbH);
    /* Tag/label icon */
    c.fillStyle = state.showLabels ? '#fff' : ACCENT;
    c.font = 'bold 9px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('Aa', tbX, labelBtnY + 3);

    /* Change Bit button */
    var bitBtnY = 110;
    state._bitBtnRect = { x: tbX - tbW / 2, y: bitBtnY - tbH / 2, w: tbW, h: tbH };
    c.fillStyle = 'rgba(22,27,39,0.85)';
    c.fillRect(tbX - tbW / 2, bitBtnY - tbH / 2, tbW, tbH);
    c.strokeStyle = 'rgba(67,160,71,0.6)';
    c.lineWidth = 1;
    c.strokeRect(tbX - tbW / 2, bitBtnY - tbH / 2, tbW, tbH);
    /* Drill bit icon — small silhouette */
    c.fillStyle = ACCENT;
    c.beginPath();
    c.moveTo(tbX - 2, bitBtnY - 8);
    c.lineTo(tbX + 2, bitBtnY - 8);
    c.lineTo(tbX + 2, bitBtnY + 4);
    c.lineTo(tbX, bitBtnY + 8);
    c.lineTo(tbX - 2, bitBtnY + 4);
    c.closePath(); c.fill();
    /* Flute lines */
    c.strokeStyle = 'rgba(22,27,39,0.6)';
    c.lineWidth = 0.5;
    c.beginPath(); c.moveTo(tbX, bitBtnY - 6); c.lineTo(tbX, bitBtnY + 3); c.stroke();

    /* ── Sound mute toggle ── */
    var soundBtnY = bitBtnY + 34;
    state._canvasSoundRect = { x: tbX - tbW / 2, y: soundBtnY - tbH / 2, w: tbW, h: tbH };
    var isMuted = !state.soundEnabled;
    c.fillStyle = isMuted ? 'rgba(40,15,15,0.9)' : 'rgba(10,22,40,0.9)';
    c.fillRect(tbX - tbW / 2, soundBtnY - tbH / 2, tbW, tbH);
    c.strokeStyle = isMuted ? '#883333' : 'rgba(67,160,71,0.6)';
    c.lineWidth = 1;
    c.strokeRect(tbX - tbW / 2, soundBtnY - tbH / 2, tbW, tbH);
    c.font = '13px "Segoe UI Emoji","Apple Color Emoji",sans-serif';
    c.textAlign = 'center';
    c.fillText(isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A', tbX, soundBtnY + 5);

    /* ── Coolant On/Off toggle ── */
    var coolBtnY = soundBtnY + 34;
    state._canvasCoolantRect = { x: tbX - tbW / 2, y: coolBtnY - tbH / 2, w: tbW, h: tbH };
    var coolOn = state.coolantOn;
    c.fillStyle = coolOn ? 'rgba(10,25,45,0.9)' : 'rgba(22,27,39,0.85)';
    c.fillRect(tbX - tbW / 2, coolBtnY - tbH / 2, tbW, tbH);
    c.strokeStyle = coolOn ? 'rgba(80,160,255,0.8)' : 'rgba(67,160,71,0.4)';
    c.lineWidth = 1;
    c.strokeRect(tbX - tbW / 2, coolBtnY - tbH / 2, tbW, tbH);
    /* Droplet icon */
    c.fillStyle = coolOn ? '#55aaff' : '#4a5570';
    c.beginPath();
    c.moveTo(tbX, coolBtnY - 8);
    c.bezierCurveTo(tbX + 5, coolBtnY - 3, tbX + 7, coolBtnY + 2, tbX, coolBtnY + 8);
    c.bezierCurveTo(tbX - 7, coolBtnY + 2, tbX - 5, coolBtnY - 3, tbX, coolBtnY - 8);
    c.fill();
    /* OFF cross */
    if (!coolOn) {
      c.strokeStyle = '#cc4444';
      c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(tbX - 5, coolBtnY - 5); c.lineTo(tbX + 5, coolBtnY + 5); c.stroke();
      c.beginPath(); c.moveTo(tbX + 5, coolBtnY - 5); c.lineTo(tbX - 5, coolBtnY + 5); c.stroke();
    }

    /* ═══ TABLE UP/DOWN ARROW BUTTONS (fixed screen position) ═══ */
    var arrowX = MW - 40;
    var arrowUpY = MH - 130;
    var arrowDnY = MH - 75;
    /* Store for hit testing */
    state._arrowUpRect = { x: arrowX - 20, y: arrowUpY - 20, w: 40, h: 40 };
    state._arrowDnRect = { x: arrowX - 20, y: arrowDnY - 20, w: 40, h: 40 };

    /* UP arrow button */
    var upActive = state.tableMoving > 0;
    c.fillStyle = upActive ? ACCENT : '#1f2a3a';
    c.fillRect(arrowX - 20, arrowUpY - 20, 40, 40);
    c.strokeStyle = upActive ? '#66bb6a' : ACCENT;
    c.lineWidth = 2;
    c.strokeRect(arrowX - 20, arrowUpY - 20, 40, 40);
    /* Up triangle */
    c.fillStyle = upActive ? '#fff' : ACCENT;
    c.beginPath();
    c.moveTo(arrowX, arrowUpY - 11);
    c.lineTo(arrowX - 12, arrowUpY + 9);
    c.lineTo(arrowX + 12, arrowUpY + 9);
    c.closePath();
    c.fill();

    /* DOWN arrow button */
    var dnActive = state.tableMoving < 0;
    c.fillStyle = dnActive ? ACCENT : '#1f2a3a';
    c.fillRect(arrowX - 20, arrowDnY - 20, 40, 40);
    c.strokeStyle = dnActive ? '#66bb6a' : ACCENT;
    c.lineWidth = 2;
    c.strokeRect(arrowX - 20, arrowDnY - 20, 40, 40);
    /* Down triangle */
    c.fillStyle = dnActive ? '#fff' : ACCENT;
    c.beginPath();
    c.moveTo(arrowX, arrowDnY + 11);
    c.lineTo(arrowX - 12, arrowDnY - 9);
    c.lineTo(arrowX + 12, arrowDnY - 9);
    c.closePath();
    c.fill();

    /* Label next to arrows */
    c.fillStyle = TEXT;
    c.font = 'bold 10px "Courier New", monospace';
    c.textAlign = 'left';
    c.fillText('TABLE', arrowX + 26, arrowUpY + 2);
    c.fillStyle = ACCENT;
    c.fillText(dfix(state.tableHeight, 'len', 0) + ' ' + du('len'), arrowX + 26, arrowDnY + 2);
    c.fillStyle = DIM;
    c.font = '7px "Segoe UI", sans-serif';
    c.fillText('hold \u25B2\u25BC to move', arrowX + 26, arrowDnY + 14);

    /* ═══ START / RESET / MODE CANVAS BUTTONS (bottom-right of machine canvas) ═══ */
    var cbBtnH = 28;
    var cbBtnW = 108;
    var cbPad  = 10;
    var cbResetW = 62;
    var cbToggleW = 62;
    var cbStartX  = MW - cbPad - cbBtnW;
    var cbResetX  = MW - cbPad - cbBtnW - cbResetW - 6;
    var cbToggleX = cbResetX - cbToggleW - 6;
    var cbBtnY = MH - cbPad - cbBtnH;

    /* Auto / Manual toggle button */
    var isAutoMode = state.drillMode === 'auto';
    c.fillStyle = isAutoMode ? '#0d2e1a' : '#1a1e2e';
    roundRect(c, cbToggleX, cbBtnY, cbToggleW, cbBtnH, 6); c.fill();
    c.strokeStyle = isAutoMode ? '#3ddc84' : '#4488ff';
    c.lineWidth = 1.5;
    roundRect(c, cbToggleX, cbBtnY, cbToggleW, cbBtnH, 6); c.stroke();
    c.fillStyle = isAutoMode ? '#3ddc84' : '#4488ff';
    c.font = 'bold 9px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText(isAutoMode ? '\u2699 AUTO' : '\u270B MANUAL', cbToggleX + cbToggleW / 2, cbBtnY + cbBtnH / 2 + 4);
    state._canvasToggleRect = { x: cbToggleX, y: cbBtnY, w: cbToggleW, h: cbBtnH };

    /* Reset button */
    c.fillStyle = '#1f2535';
    roundRect(c, cbResetX, cbBtnY, cbResetW, cbBtnH, 6);
    c.fill();
    c.strokeStyle = '#2a3050';
    c.lineWidth = 1.2;
    roundRect(c, cbResetX, cbBtnY, cbResetW, cbBtnH, 6);
    c.stroke();
    c.fillStyle = '#6b7a99';
    c.font = 'bold 10px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('\u8635 Reset', cbResetX + cbResetW / 2, cbBtnY + cbBtnH / 2 + 4);
    state._canvasResetRect = { x: cbResetX, y: cbBtnY, w: cbResetW, h: cbBtnH };

    /* Start / Pause button — grey out in Manual mode */
    var startDisabled = (state.drillMode === 'manual' && !state.running);
    var startBg     = startDisabled ? '#191c27' : (state.running ? '#1a4a1a' : ACCENT);
    var startBorder = startDisabled ? '#2e3350' : (state.running ? '#3ddc84' : '#66bb6a');
    c.fillStyle = startBg;
    roundRect(c, cbStartX, cbBtnY, cbBtnW, cbBtnH, 6);
    c.fill();
    c.strokeStyle = startBorder;
    c.lineWidth = 1.5;
    roundRect(c, cbStartX, cbBtnY, cbBtnW, cbBtnH, 6);
    c.stroke();
    c.fillStyle = startDisabled ? '#3a4060' : '#fff';
    c.font = 'bold 10px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    var startLabel = state.running ? '\u23F8 Pause' : '\u25B6 Start Drilling';
    c.fillText(startLabel, cbStartX + cbBtnW / 2, cbBtnY + cbBtnH / 2 + 4);
    state._canvasStartRect = { x: cbStartX, y: cbBtnY, w: cbBtnW, h: cbBtnH };

    /* ═══ BLINK: ON button when machine is OFF and warning asks to turn on ═══ */
    var needsOn  = state.contactWarning && state.warningTimer > 0 &&
                   (state.contactWarning.indexOf('ON') >= 0 || state.contactWarning.indexOf('Spindle is OFF') >= 0) &&
                   !state.estop;
    var needsEstopRelease = state.contactWarning && state.warningTimer > 0 &&
                            state.contactWarning.indexOf('E-Stop') >= 0 && state.estop;
    var blinkOn = Math.floor(performance.now() / 350) % 2 === 0;
    if (needsOn && blinkOn) {
      /* Bright glow ring around ON button */
      c.save();
      c.shadowColor = '#44ee44';
      c.shadowBlur = 12;
      c.strokeStyle = '#44ee44';
      c.lineWidth = 2.5;
      c.strokeRect(state._onBtnRect.x - 3, state._onBtnRect.y - 3,
                   state._onBtnRect.w + 6, state._onBtnRect.h + 6);
      c.restore();
    }
    if (needsEstopRelease && blinkOn) {
      /* Bright glow ring around E-STOP button */
      c.save();
      c.shadowColor = '#ff5555';
      c.shadowBlur = 14;
      c.strokeStyle = '#ff5555';
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(state._estopBtnRect.x + state._estopBtnRect.w / 2,
            state._estopBtnRect.y + state._estopBtnRect.h / 2,
            state._estopBtnRect.w / 2 + 3, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    /* ═══ CONTACT PROXIMITY INDICATOR ═══ */
    var gap = cinfo.gap;
    if (!cinfo.contact && gap < 40) {
      /* Approaching — show distance */
      c.fillStyle = '#f5c842';
      c.font = 'bold 9px "Courier New", monospace';
      c.textAlign = 'center';
      c.fillText('GAP: ' + dfix(gap / 0.75, 'len', 0) + ' ' + du('len'), machX, wpY - 10);
      /* Proximity bar */
      var proxPct = 1 - gap / 110;
      c.fillStyle = proxPct > 0.8 ? '#ff5555' : proxPct > 0.5 ? '#f5c842' : '#3ddc84';
      c.fillRect(machX - 20, wpY - 6, 40 * proxPct, 3);
    }

    /* ═══ WARNING BANNER ═══ */
    if (state.contactWarning && state.warningTimer > 0) {
      c.save();
      var wAlpha = Math.min(1, state.warningTimer);
      c.globalAlpha = wAlpha;
      var isError = state.contactWarning.indexOf('DANGER') >= 0 || state.contactWarning.indexOf('EMERGENCY') >= 0;
      var isWarn  = state.contactWarning.indexOf('\u26A0') >= 0 || state.contactWarning.indexOf('\u26D4') >= 0;
      var wBg = isError ? 'rgba(200,30,30,0.92)' : isWarn ? 'rgba(200,130,0,0.92)' : 'rgba(34,120,50,0.92)';
      c.fillStyle = wBg;
      var wY = MH / 2 - 20;
      roundRect(c, 20, wY, MW - 40, 34, 8);
      c.fill();
      /* subtle border */
      c.strokeStyle = 'rgba(255,255,255,0.25)';
      c.lineWidth = 1;
      roundRect(c, 20, wY, MW - 40, 34, 8);
      c.stroke();
      c.fillStyle = '#fff';
      c.font = 'bold 12px "Segoe UI", sans-serif';
      c.textAlign = 'center';
      c.fillText(state.contactWarning, MW / 2, wY + 22);
      c.restore();
    }

    /* Status text (outside vibration transform) */
    c.fillStyle = ACCENT;
    c.font = 'bold 11px "Segoe UI", sans-serif';
    c.textAlign = 'left';
    var statusText = state.drillPhase === 'retract' ? 'RETRACTING...' :
                     state.cutting ? 'CUTTING — ' + Math.round(drillPct * 100) + '% depth' :
                     (state.drillPhase === 'descend' && state.animT >= 1) ? 'RAISE TABLE — Drill cannot reach workpiece!' :
                     state.drillPhase === 'descend' ? 'DRILL DESCENDING...' :
                     (!state.running && state.animT === 0 && state.chipPile.length > 0) ? 'DRILLING COMPLETE — Quill returned' :
                     state.running ? 'RUNNING...' :
                     state.animT > 0 ? 'PAUSED' : 'READY — Adjust table, then Start Drilling';
    c.fillText(statusText, 15, 20);

    /* Current operation & material */
    c.fillStyle = DIM;
    c.font = '10px "Segoe UI", sans-serif';
    c.fillText('Op: ' + op.name + '  |  Mat: ' + mat.name + '  |  \u00D8' + dfix(state.dia, 'len', 0) + ' ' + du('len'), 15, 35);

    /* ═══ MANUAL MODE FIRST-USE HINTS ═══ */
    if (state.drillMode === 'manual' && !state.manualHintSeen) {
      var pulse = 0.5 + 0.5 * Math.abs(Math.sin(Date.now() / 450));
      c.save();
      c.globalAlpha = pulse;

      /* Helper: badge + arrow pointing right to (tx, ty) */
      function drawHintBadge(lines, tx, ty) {
        var badgeW = 118, lineH = 14, badgePad = 8;
        var badgeH = lines.length * lineH + badgePad;
        var tailX = tx - 72, tailY = ty;
        var badgeX = tailX - badgeW - 4, badgeY = tailY - badgeH / 2;
        /* shadow */
        c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 8;
        /* badge background */
        c.fillStyle = 'rgba(10,14,28,0.85)';
        roundRect(c, badgeX, badgeY, badgeW, badgeH, 5); c.fill();
        c.shadowBlur = 0;
        /* badge border */
        c.strokeStyle = '#ffcc00'; c.lineWidth = 1;
        roundRect(c, badgeX, badgeY, badgeW, badgeH, 5); c.stroke();
        /* text */
        c.fillStyle = '#ffdd55';
        c.font = 'bold 9px "Segoe UI", sans-serif';
        c.textAlign = 'center';
        lines.forEach(function(ln, i) {
          c.fillText(ln, badgeX + badgeW / 2, badgeY + badgePad / 2 + lineH * (i + 0.85));
        });
        /* arrow shaft */
        c.strokeStyle = '#ffcc00'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(tailX, tailY); c.lineTo(tx - 12, ty); c.stroke();
        /* arrowhead */
        c.fillStyle = '#ffcc00';
        c.beginPath(); c.moveTo(tx - 12, ty); c.lineTo(tx - 20, ty - 5); c.lineTo(tx - 20, ty + 5); c.closePath(); c.fill();
      }

      /* Hint 1 — Feed Handle */
      drawHintBadge(['\u2193 Click & hold', 'to drill manually'], fhCx, fhCy);

      /* Hint 2 — Table height arrows */
      drawHintBadge(['\u2191\u2193 Click to adjust', 'drill bed height'], arrowX, arrowUpY);

      c.restore();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S13  DRAW GRAPH CANVAS (560x630)
     ═══════════════════════════════════════════════════════════════ */
  function drawGraph() {
    if (!gCtx) return;
    var c = gCtx;
    var dpr = window.devicePixelRatio || 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, GW, GH);
    c.fillStyle = BG;
    c.fillRect(0, 0, GW, GH);

    var topH = 230;    /* cross-section | force diagram row */
    var paramsH = 200; /* cutting parameter bars */

    /* ─── Left half: Cross-section ─── */
    drawDrillingCrossSection(c, 0, 0, GW / 2, topH);

    /* ─── Right half: Force diagram ─── */
    drawForceDiagram(c, GW / 2, 0, GW / 2, topH);

    /* ─── Vertical divider between top panels ─── */
    c.strokeStyle = BORDER; c.lineWidth = 1;
    c.beginPath(); c.moveTo(GW / 2, 8); c.lineTo(GW / 2, topH - 8); c.stroke();

    /* ─── Full width: Parameter bars ─── */
    drawParameterBars(c, 0, topH, GW, paramsH);
  }

  /* ═══════════════════════════════════════════════════════════════
     CROSS-SECTION HELPERS  (hole layers + operation tools)
     ═══════════════════════════════════════════════════════════════ */

  /* Find the most recent layer of a given set of op types, before index `beforeIdx` */
  function _findPrevHoleLayer(layers, beforeIdx, opTypes) {
    for (var i = beforeIdx - 1; i >= 0; i--) {
      if (opTypes.indexOf(layers[i].op) >= 0) return layers[i];
    }
    return null;
  }

  /* Point length for a V-tip at radius r given included angle (deg) */
  function _vPointLen(r, angleDeg) {
    return angleDeg > 0 ? r * Math.tan((90 - angleDeg / 2) * Math.PI / 180) : 0;
  }

  /* Draw outline of a simple V-bottom cylinder hole (fillStyle must be set by caller) */
  function _cutCylVHole(c, r, cx, topY, depthY, pointLen) {
    var bodyBotY = Math.max(topY, depthY - pointLen);
    c.fillRect(cx - r, topY, r * 2, bodyBotY - topY);
    if (pointLen > 0.5 && depthY > bodyBotY) {
      c.beginPath();
      c.moveTo(cx - r, bodyBotY); c.lineTo(cx, depthY); c.lineTo(cx + r, bodyBotY);
      c.closePath(); c.fill();
    }
    return bodyBotY;
  }

  /* Draw wall outlines for a cylindrical section */
  function _wallLines(c, r, cx, topY, botY) {
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx - r, topY); c.lineTo(cx - r, botY); c.stroke();
    c.beginPath(); c.moveTo(cx + r, topY); c.lineTo(cx + r, botY); c.stroke();
  }

  /* Surface-finish marks — fine horizontal ticks on both walls */
  function _finishMarks(c, r, cx, topY, botY, col) {
    c.strokeStyle = col || 'rgba(160,190,220,0.35)'; c.lineWidth = 0.6;
    for (var fy = topY + 3; fy < botY - 2; fy += 4) {
      c.beginPath(); c.moveTo(cx - r + 1, fy); c.lineTo(cx - r + 3, fy); c.stroke();
      c.beginPath(); c.moveTo(cx + r - 3, fy); c.lineTo(cx + r - 1, fy); c.stroke();
    }
  }

  /* ── Drilling hole shapes per bit type ── */
  function _drawDrillingHole(c, layer, r, cx, wpTopY, wpH2, depthY) {
    c.fillStyle = BG;
    var bt = layer.bitType;

    if (bt === 'twist') {
      var pLen = _vPointLen(r, 118);
      var bBotY = _cutCylVHole(c, r, cx, wpTopY, depthY, pLen);
      _wallLines(c, r, cx, wpTopY, bBotY);

    } else if (bt === 'center') {
      /* Wide 60° countersink cone at entry + narrow pilot + 60° tip */
      var pilotR = r * 0.38;
      var csD = Math.min((r - pilotR) * Math.tan(60 * Math.PI / 180), wpH2 * 0.28);
      var csBotY = wpTopY + csD;
      /* Entry countersink cone */
      c.beginPath();
      c.moveTo(cx - r, wpTopY); c.lineTo(cx - pilotR, csBotY);
      c.lineTo(cx + pilotR, csBotY); c.lineTo(cx + r, wpTopY);
      c.closePath(); c.fill();
      /* Pilot cylinder + V-tip */
      var pilotPL = _vPointLen(pilotR, 60);
      var pilotBotY = _cutCylVHole(c, pilotR, cx, csBotY, depthY, pilotPL);
      /* Walls */
      c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - r, wpTopY); c.lineTo(cx - pilotR, csBotY); c.lineTo(cx - pilotR, pilotBotY); c.stroke();
      c.beginPath(); c.moveTo(cx + r, wpTopY); c.lineTo(cx + pilotR, csBotY); c.lineTo(cx + pilotR, pilotBotY); c.stroke();

    } else if (bt === 'step') {
      /* Stepped hole: widest at top (entry), narrowest at bottom (tip) */
      var steps = 4;
      var totalH = depthY - wpTopY;
      var sH = totalH / steps;
      for (var si = 0; si < steps; si++) {
        var sR = r * (1 - 0.55 * si / (steps - 1));
        c.fillRect(cx - sR, wpTopY + si * sH, sR * 2, sH);
      }
      /* Step shoulder lines */
      c.strokeStyle = 'rgba(0,0,0,0.6)'; c.lineWidth = 1;
      for (var sj = 1; sj < steps; sj++) {
        var sjR = r * (1 - 0.55 * sj / (steps - 1));
        var sjRP = r * (1 - 0.55 * (sj - 1) / (steps - 1));
        var sjY = wpTopY + sj * sH;
        c.beginPath(); c.moveTo(cx - sjRP, sjY); c.lineTo(cx - sjR, sjY); c.stroke();
        c.beginPath(); c.moveTo(cx + sjR, sjY); c.lineTo(cx + sjRP, sjY); c.stroke();
      }

    } else if (bt === 'countersink') {
      /* Pure 90° cone recess (no pilot channel) */
      c.beginPath();
      c.moveTo(cx - r, wpTopY); c.lineTo(cx, depthY); c.lineTo(cx + r, wpTopY);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - r, wpTopY); c.lineTo(cx, depthY); c.stroke();
      c.beginPath(); c.moveTo(cx + r, wpTopY); c.lineTo(cx, depthY); c.stroke();

    } else if (bt === 'spade') {
      /* Wide flat-bottom + tiny centre spike */
      var spR = r * 1.15;
      c.fillRect(cx - spR, wpTopY, spR * 2, depthY - wpTopY);
      c.beginPath(); c.moveTo(cx - 2, depthY); c.lineTo(cx, depthY + 5); c.lineTo(cx + 2, depthY); c.closePath(); c.fill();
      _wallLines(c, spR, cx, wpTopY, depthY);
      c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - spR, depthY); c.lineTo(cx - 2, depthY); c.stroke();
      c.beginPath(); c.moveTo(cx + 2, depthY); c.lineTo(cx + spR, depthY); c.stroke();
    }
  }

  /* ── Reaming layer ── same hole widened slightly + polished walls */
  function _drawReamingHole(c, layer, r, cx, wpTopY, depthY, layers, li, mS) {
    var base = _findPrevHoleLayer(layers, li, ['drilling', 'boring']);
    var useR  = base ? (base.dia * mS) / 2 + 1 : r;
    var useDY = base ? wpTopY + clamp(base.depthFrac, 0, 1) * 70 + (base.depthFrac >= 0.99 ? 6 : 0) : depthY;
    c.fillStyle = BG;
    var pLen = _vPointLen(useR, 118);
    var bBotY = _cutCylVHole(c, useR, cx, wpTopY, useDY, pLen);
    _finishMarks(c, useR, cx, wpTopY, bBotY, 'rgba(180,210,240,0.5)');
    _wallLines(c, useR, cx, wpTopY, bBotY);
    /* Ra improvement label */
    c.fillStyle = '#88bbff'; c.font = '7px "Courier New", monospace'; c.textAlign = 'left';
    c.fillText('Ra \u2193 finish', cx + useR + 3, wpTopY + 22);
  }

  /* ── Boring layer ── wide cylinder + flat bottom */
  function _drawBoringHole(c, r, cx, wpTopY, depthY) {
    c.fillStyle = BG;
    c.fillRect(cx - r, wpTopY, r * 2, depthY - wpTopY);
    /* Flat bottom */
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx - r, depthY); c.lineTo(cx + r, depthY); c.stroke();
    _wallLines(c, r, cx, wpTopY, depthY);
    _finishMarks(c, r, cx, wpTopY, depthY);
  }

  /* ── Counterboring layer ── wide flat pocket at top + pilot hole below */
  function _drawCounterboringHole(c, layer, r, cx, wpTopY, wpH2, depthY, layers, li, mS) {
    var base = _findPrevHoleLayer(layers, li, ['drilling']);
    var pilotR = base ? (base.dia * mS) / 2 : r * 0.48;
    var cbDepth = wpH2 * 0.30;
    var cbBotY  = wpTopY + cbDepth;
    c.fillStyle = BG;
    /* Wide counterbore pocket */
    c.fillRect(cx - r, wpTopY, r * 2, cbDepth);
    /* Pilot hole continues below */
    if (base) {
      var pilotPL  = _vPointLen(pilotR, 118);
      var pilotDY  = wpTopY + clamp(base.depthFrac, 0, 1) * wpH2 + (base.depthFrac >= 0.99 ? 6 : 0);
      var pilotBotY = _cutCylVHole(c, pilotR, cx, cbBotY, pilotDY, pilotPL);
      _wallLines(c, pilotR, cx, cbBotY, pilotBotY);
      /* Step shoulders */
      c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - r, cbBotY); c.lineTo(cx - pilotR, cbBotY); c.stroke();
      c.beginPath(); c.moveTo(cx + pilotR, cbBotY); c.lineTo(cx + r, cbBotY); c.stroke();
    } else {
      /* No pilot: flat bottom */
      c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - r, cbBotY); c.lineTo(cx + r, cbBotY); c.stroke();
    }
    /* CB outer walls */
    _wallLines(c, r, cx, wpTopY, cbBotY);
    /* CB depth annotation */
    c.strokeStyle = '#4488ff'; c.lineWidth = 0.7; c.setLineDash([2, 2]);
    c.beginPath(); c.moveTo(cx - r + 2, cbBotY); c.lineTo(cx + r - 2, cbBotY); c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#4488ff'; c.font = '7px "Segoe UI", sans-serif'; c.textAlign = 'right';
    c.fillText('cb', cx - r - 2, cbBotY + 6);
  }

  /* ── Countersinking layer ── 90° chamfer at hole entry */
  function _drawCountersinkingHole(c, layer, r, cx, wpTopY, depthY, layers, li, mS) {
    var base   = _findPrevHoleLayer(layers, li, ['drilling', 'boring']);
    var holeR  = base ? (base.dia * mS) / 2 : r * 0.5;
    var csDepth = Math.max(4, r - holeR); /* 90° → depth = width difference per side */
    var csBotY  = wpTopY + csDepth;
    c.fillStyle = BG;
    /* Chamfer cone */
    c.beginPath();
    c.moveTo(cx - r, wpTopY); c.lineTo(cx - holeR, csBotY);
    c.lineTo(cx + holeR, csBotY); c.lineTo(cx + r, wpTopY);
    c.closePath(); c.fill();
    /* Chamfer outlines */
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx - r, wpTopY); c.lineTo(cx - holeR, csBotY); c.stroke();
    c.beginPath(); c.moveTo(cx + r, wpTopY); c.lineTo(cx + holeR, csBotY); c.stroke();
    /* 90° angle label */
    c.strokeStyle = '#ffaa44'; c.lineWidth = 0.7; c.setLineDash([2, 2]);
    c.beginPath(); c.moveTo(cx - holeR, wpTopY); c.lineTo(cx - r, wpTopY); c.stroke();
    c.beginPath(); c.moveTo(cx - holeR, wpTopY); c.lineTo(cx - holeR, csBotY + 4); c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#ffaa44'; c.font = '7px "Courier New", monospace'; c.textAlign = 'left';
    c.fillText('90\u00B0', cx - holeR + 3, wpTopY + 11);
    /* Hole below chamfer */
    if (!base) {
      c.fillStyle = BG;
      var sPL = _vPointLen(holeR, 118);
      _cutCylVHole(c, holeR, cx, csBotY, depthY, sPL);
      _wallLines(c, holeR, cx, csBotY, depthY - sPL);
    }
  }

  /* ── Tapping layer ── thread marks on existing hole walls */
  function _drawTappingHole(c, layer, r, cx, wpTopY, depthY, layers, li, mS) {
    var base  = _findPrevHoleLayer(layers, li, ['drilling', 'boring']);
    var useR  = base ? (base.dia * mS) / 2 : r;
    var useDY = base ? wpTopY + clamp(base.depthFrac, 0, 1) * 70 + (base.depthFrac >= 0.99 ? 6 : 0) : depthY;
    c.fillStyle = BG;
    var pLen = _vPointLen(useR, 118);
    var bBotY = _cutCylVHole(c, useR, cx, wpTopY, useDY, pLen);
    /* Thread marks — V-profile on walls */
    var pitch = 5;
    c.strokeStyle = '#7799bb'; c.lineWidth = 1;
    for (var ty = wpTopY + 3; ty < bBotY - 4; ty += pitch) {
      c.beginPath(); c.moveTo(cx - useR, ty); c.lineTo(cx - useR + 4, ty + pitch * 0.5); c.lineTo(cx - useR, ty + pitch); c.stroke();
      c.beginPath(); c.moveTo(cx + useR, ty); c.lineTo(cx + useR - 4, ty + pitch * 0.5); c.lineTo(cx + useR, ty + pitch); c.stroke();
    }
    _wallLines(c, useR, cx, wpTopY, bBotY);
    /* Thread label */
    c.fillStyle = '#7799bb'; c.font = '7px "Segoe UI", sans-serif'; c.textAlign = 'left';
    c.fillText('M' + layer.dia, cx + useR + 3, wpTopY + 28);
  }

  /* ── Tool cross-section by operation ── */
  function _drawOperationToolCS(c, opId, cx, topY, tipY, bH, selBit) {
    var bt = state.bitType;
    c.fillStyle = '#a0b0c0';

    if (opId === 'drilling') {
      /* Per-bit-type tool (same shapes as before but clean) */
      if (bt === 'twist') {
        var pL = _vPointLen(bH, 118);
        c.fillRect(cx - bH, topY, bH * 2, tipY - topY - pL);
        c.beginPath(); c.moveTo(cx - bH, tipY - pL); c.lineTo(cx, tipY); c.lineTo(cx + bH, tipY - pL); c.closePath(); c.fill();
        c.strokeStyle = '#7a8a9a'; c.lineWidth = 0.7;
        c.beginPath(); c.moveTo(cx - 1, topY + 5); c.lineTo(cx - 1, tipY - pL - 3); c.stroke();
        c.beginPath(); c.moveTo(cx + 1, topY + 5); c.lineTo(cx + 1, tipY - pL - 3); c.stroke();
        c.strokeStyle = '#ff8800'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(cx - bH * 0.15, tipY - pL * 0.1); c.lineTo(cx + bH * 0.15, tipY - pL * 0.1); c.stroke();

      } else if (bt === 'center') {
        var cpW = bH * 0.5, ccL = (tipY - topY) * 0.42, cpBL = (tipY - topY) * 0.42;
        c.beginPath(); c.moveTo(cx - bH, topY); c.lineTo(cx + bH, topY); c.lineTo(cx + cpW, topY + ccL); c.lineTo(cx - cpW, topY + ccL); c.closePath(); c.fill();
        c.fillRect(cx - cpW, topY + ccL, cpW * 2, cpBL);
        c.beginPath(); c.moveTo(cx - cpW, topY + ccL + cpBL); c.lineTo(cx, tipY); c.lineTo(cx + cpW, topY + ccL + cpBL); c.closePath(); c.fill();

      } else if (bt === 'step') {
        var stS = 4, stBH = (tipY - topY) * 0.85;
        for (var stt = 0; stt < stS; stt++) {
          var stHf = bH * (0.3 + 0.7 * (stS - stt) / stS);
          c.fillRect(cx - stHf, topY + stt * (stBH / stS), stHf * 2, stBH / stS - 1);
        }
        var stTH = bH * (0.3 + 0.7 / stS);
        c.beginPath(); c.moveTo(cx - stTH, topY + stBH); c.lineTo(cx, tipY); c.lineTo(cx + stTH, topY + stBH); c.closePath(); c.fill();

      } else if (bt === 'countersink') {
        var csSW = bH * 0.35, csSL = (tipY - topY) * 0.45;
        c.fillRect(cx - csSW, topY, csSW * 2, csSL);
        c.beginPath(); c.moveTo(cx - csSW, topY + csSL); c.lineTo(cx - bH * 1.1, tipY); c.lineTo(cx + bH * 1.1, tipY); c.lineTo(cx + csSW, topY + csSL); c.closePath(); c.fill();
        c.strokeStyle = '#7a8a9a'; c.lineWidth = 0.7;
        for (var cfi = 0; cfi < 3; cfi++) { var cfx = cx + (cfi - 1) * bH * 0.5; c.beginPath(); c.moveTo(cx, topY + csSL + 2); c.lineTo(cfx, tipY - 1); c.stroke(); }

      } else if (bt === 'spade') {
        var spSW = bH * 0.3, spSL = (tipY - topY) * 0.4, spPH = (tipY - topY) * 0.35;
        c.fillRect(cx - spSW, topY, spSW * 2, spSL);
        c.fillRect(cx - bH * 1.2, topY + spSL, bH * 2.4, spPH);
        c.beginPath(); c.moveTo(cx - 2, topY + spSL + spPH); c.lineTo(cx, tipY); c.lineTo(cx + 2, topY + spSL + spPH); c.closePath(); c.fill();
      }

    } else if (opId === 'reaming') {
      /* Reamer — straight body, 6 flutes, tiny flat chamfer */
      var rPL = 4;
      c.fillRect(cx - bH, topY, bH * 2, tipY - topY - rPL);
      c.beginPath(); c.moveTo(cx - bH, tipY - rPL); c.lineTo(cx - bH * 0.7, tipY); c.lineTo(cx + bH * 0.7, tipY); c.lineTo(cx + bH, tipY - rPL); c.closePath(); c.fill();
      c.strokeStyle = '#7a8a9a'; c.lineWidth = 0.6;
      for (var rf = 0; rf < 6; rf++) { var rfx = cx - bH + (rf + 0.5) * (bH * 2 / 6); c.beginPath(); c.moveTo(rfx, topY + 5); c.lineTo(rfx, tipY - rPL - 2); c.stroke(); }

    } else if (opId === 'boring') {
      /* Boring bar — narrow shank + wide head + single-point insert */
      var bSR = bH * 0.28;
      c.fillRect(cx - bSR, topY, bSR * 2, tipY - topY - 10);
      c.fillRect(cx - bH * 0.65, tipY - 10, bH * 1.3, 10);
      c.fillStyle = '#66aacc';
      c.beginPath(); c.moveTo(cx + bH * 0.65, tipY - 10); c.lineTo(cx + bH * 0.65 + 7, tipY - 5); c.lineTo(cx + bH * 0.65, tipY); c.closePath(); c.fill();
      c.fillStyle = '#a0b0c0';

    } else if (opId === 'counterboring') {
      /* Counterbore tool — shank + pilot + wide flat face */
      var cbSR = bH * 0.28, cbPR = bH * 0.48;
      c.fillRect(cx - cbSR, topY, cbSR * 2, tipY - topY - 18);
      c.fillRect(cx - cbPR, tipY - 18, cbPR * 2, 10);
      c.fillRect(cx - bH, tipY - 8, bH * 2, 8);
      c.strokeStyle = '#0a0a0a'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx - bH, tipY); c.lineTo(cx - cbPR, tipY); c.stroke();
      c.beginPath(); c.moveTo(cx + cbPR, tipY); c.lineTo(cx + bH, tipY); c.stroke();

    } else if (opId === 'countersinking') {
      /* Countersink tool — narrow shank + 90° cone */
      var csSR2 = bH * 0.3, csSL2 = (tipY - topY) * 0.45;
      c.fillRect(cx - csSR2, topY, csSR2 * 2, csSL2);
      c.beginPath(); c.moveTo(cx - csSR2, topY + csSL2); c.lineTo(cx - bH, tipY); c.lineTo(cx + bH, tipY); c.lineTo(cx + csSR2, topY + csSL2); c.closePath(); c.fill();
      c.strokeStyle = '#7a8a9a'; c.lineWidth = 0.7;
      for (var cfi2 = 0; cfi2 < 3; cfi2++) { var cfx2 = cx + (cfi2 - 1) * bH * 0.5; c.beginPath(); c.moveTo(cx, topY + csSL2 + 2); c.lineTo(cfx2, tipY - 1); c.stroke(); }

    } else if (opId === 'tapping') {
      /* Tap — threaded cylinder with taper lead */
      var tpR = bH * 0.55, tpBL = tipY - topY - 8;
      c.fillRect(cx - tpR, topY, tpR * 2, tpBL);
      c.strokeStyle = '#7a8a9a'; c.lineWidth = 0.6;
      for (var tht = topY + 4; tht < topY + tpBL - 2; tht += 3) { c.beginPath(); c.moveTo(cx - tpR, tht); c.lineTo(cx + tpR, tht); c.stroke(); }
      c.fillStyle = '#a0b0c0';
      c.beginPath(); c.moveTo(cx - tpR, topY + tpBL); c.lineTo(cx - tpR * 0.3, tipY); c.lineTo(cx + tpR * 0.3, tipY); c.lineTo(cx + tpR, topY + tpBL); c.closePath(); c.fill();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     DRILLING CROSS-SECTION — composite multi-operation view
     ═══════════════════════════════════════════════════════════════ */
  function drawDrillingCrossSection(c, ox, oy, w, h) {
    c.save();

    /* Title — placeholder, replaced after op lookup */
    c.fillStyle = ACCENT;
    c.font = 'bold 11px "Segoe UI", sans-serif';
    /* ── Geometry ── */
    var cx = ox + w / 2;
    var cy = oy + Math.min(Math.round(h * 0.52), h - 88);
    var wpTopY = cy - 10;
    var wpH2   = 70;

    /* ── Build layers: history + optional live in-progress ── */
    var layers = state.holeHistory.slice();
    if (state.holeDia > 0 && state.holeAnimT > 0) {
      var lHPR = state.holePenetAnimT - state.holeContactAnimT;
      var liveFrac = lHPR > 0.001
        ? clamp((state.holeAnimT - state.holeContactAnimT) / lHPR, 0, 1)
        : clamp(state.holeAnimT, 0, 1);
      layers.push({ op: state._activeHoleOp || OPERATIONS[state.opIdx].id,
                    bitType: state.holeBitType || state.bitType,
                    dia: state.holeDia, depthFrac: liveFrac, isLive: true });
    }

    /* ── Master scale — keeps proportions when multiple diameters present ── */
    var mxDia = state.dia;
    for (var li0 = 0; li0 < layers.length; li0++) { if (layers[li0].dia > mxDia) mxDia = layers[li0].dia; }
    var mS   = clamp(60 / mxDia, 0.8, 4);
    var wpW  = Math.max(mxDia * mS * 3.2, 80);

    /* ── Title (shows last-completed or current operation name) ── */
    var curOp = OPERATIONS[state.opIdx];
    var titleOp = layers.length > 0
      ? (OPERATIONS.filter(function(o){ return o.id === layers[layers.length - 1].op; })[0] || curOp)
      : curOp;
    c.textAlign = 'center';
    c.fillText(titleOp.name.toUpperCase() + ' \u2014 CROSS-SECTION', cx, oy + 18);

    /* ── Workpiece block ── */
    c.fillStyle = MATERIALS[state.matIdx].color;
    c.globalAlpha = 0.7;
    c.fillRect(cx - wpW / 2, wpTopY, wpW, wpH2);
    c.globalAlpha = 1;
    c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 0.5;
    c.strokeRect(cx - wpW / 2, wpTopY, wpW, wpH2);

    /* ── Render hole layers (history + live) ── */
    for (var li = 0; li < layers.length; li++) {
      var layer = layers[li];
      var r     = (layer.dia * mS) / 2;
      var dFrac = layer.depthFrac;
      var depthY = wpTopY + clamp(dFrac, 0, 1) * wpH2 + (dFrac >= 0.99 ? 6 : 0);
      if      (layer.op === 'drilling')      { _drawDrillingHole(c, layer, r, cx, wpTopY, wpH2, depthY); }
      else if (layer.op === 'reaming')       { _drawReamingHole(c, layer, r, cx, wpTopY, depthY, layers, li, mS); }
      else if (layer.op === 'boring')        { _drawBoringHole(c, r, cx, wpTopY, depthY); }
      else if (layer.op === 'counterboring') { _drawCounterboringHole(c, layer, r, cx, wpTopY, wpH2, depthY, layers, li, mS); }
      else if (layer.op === 'countersinking'){ _drawCountersinkingHole(c, layer, r, cx, wpTopY, depthY, layers, li, mS); }
      else if (layer.op === 'tapping')       { _drawTappingHole(c, layer, r, cx, wpTopY, depthY, layers, li, mS); }
    }

    /* ── Guide text when no hole yet ── */
    if (layers.length === 0) {
      c.fillStyle = DIM; c.font = '9px "Segoe UI", sans-serif'; c.textAlign = 'center';
      var guideTxt = (curOp.id === 'drilling')
        ? 'Start drilling to see cross-section'
        : 'Drill a pilot hole first, then run ' + curOp.name;
      c.fillText(guideTxt, cx, wpTopY + wpH2 / 2 + 4);
    }

    /* ── Operation sequence badge (multiple layers) ── */
    if (layers.length > 1) {
      c.fillStyle = DIM; c.font = '7px "Segoe UI", sans-serif'; c.textAlign = 'left';
      var seqStr = layers.map(function(l, idx) {
        var op = OPERATIONS.filter(function(o){ return o.id === l.op; })[0];
        return (idx + 1) + '. ' + (op ? op.name : l.op);
      }).join(' \u2192 ');
      c.fillText(seqStr, ox + 5, oy + 30);
    }

    /* ── Tool visualization ── */
    var selBitCS = DRILL_BITS.filter(function(b) { return b.id === state.bitType; })[0] || DRILL_BITS[0];
    var drawnD   = state.dia * mS;
    var bitHalf  = drawnD / 2;
    var drillTopY = wpTopY - 50;
    /* Live drill tip position */
    var _hPR = state.holePenetAnimT - state.holeContactAnimT;
    var drillTipY = (_hPR > 0.001 && state.animT > 0)
      ? wpTopY + clamp((state.animT - state.holeContactAnimT) / _hPR, 0, 1) * wpH2
      : wpTopY;
    _drawOperationToolCS(c, curOp.id, cx, drillTopY, drillTipY, bitHalf, selBitCS);

    /* ── Chip curls when actively cutting ── */
    if (state.animT > 0.05) {
      c.strokeStyle = MATERIALS[state.matIdx].color;
      c.lineWidth = 1.5; c.globalAlpha = 0.8;
      c.beginPath(); c.moveTo(cx - bitHalf, drillTipY - 5);
      c.quadraticCurveTo(cx - bitHalf - 10, drillTipY - 20, cx - bitHalf - 5, drillTipY - 30); c.stroke();
      c.beginPath(); c.moveTo(cx + bitHalf, drillTipY - 5);
      c.quadraticCurveTo(cx + bitHalf + 10, drillTipY - 20, cx + bitHalf + 5, drillTipY - 30); c.stroke();
      c.globalAlpha = 1;
    }

    /* ── Diameter dimension line ── */
    c.strokeStyle = '#4caf50'; c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(cx - bitHalf, drillTopY + 10); c.lineTo(cx + bitHalf, drillTopY + 10); c.stroke();
    c.beginPath(); c.moveTo(cx - bitHalf, drillTopY + 6); c.lineTo(cx - bitHalf, drillTopY + 14); c.stroke();
    c.beginPath(); c.moveTo(cx + bitHalf, drillTopY + 6); c.lineTo(cx + bitHalf, drillTopY + 14); c.stroke();
    c.fillStyle = '#4caf50'; c.font = '9px "Courier New", monospace'; c.textAlign = 'center';
    c.fillText('\u00D8' + dfix(state.dia, 'len', 0) + ' ' + du('len'), cx, drillTopY + 5);

    /* ── Point angle lines (drilling only) ── */
    if (curOp.id === 'drilling' && selBitCS.pointAngle > 0) {
      var csAngle = selBitCS.pointAngle;
      var pointLen = _vPointLen(bitHalf, csAngle);
      c.strokeStyle = '#ff9900'; c.lineWidth = 0.8; c.setLineDash([3, 2]);
      c.beginPath(); c.moveTo(cx, drillTipY); c.lineTo(cx - bitHalf - 15, drillTipY - pointLen - 5); c.stroke();
      c.beginPath(); c.moveTo(cx, drillTipY); c.lineTo(cx + bitHalf + 15, drillTipY - pointLen - 5); c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#ff9900'; c.font = '9px "Courier New", monospace'; c.textAlign = 'center';
      c.fillText(csAngle + '\u00B0', cx, drillTipY + 14);
    }

    /* ── Rotation arrow ── */
    c.strokeStyle = ACCENT; c.lineWidth = 1.5;
    c.beginPath(); c.arc(cx, drillTopY - 10, 15, -Math.PI * 0.8, Math.PI * 0.3); c.stroke();
    c.fillStyle = ACCENT;
    var _aAng = Math.PI * 0.3;
    var _arx  = cx + 15 * Math.cos(_aAng);
    var _ary  = drillTopY - 10 + 15 * Math.sin(_aAng);
    c.beginPath(); c.moveTo(_arx + 3, _ary - 4); c.lineTo(_arx, _ary + 2); c.lineTo(_arx - 4, _ary - 3); c.closePath(); c.fill();
    c.fillStyle = ACCENT; c.font = '8px "Courier New", monospace'; c.textAlign = 'center';
    c.fillText('N=' + state.speed + ' RPM', cx, drillTopY - 30);

    /* ── Info strip ── */
    c.fillStyle = TEXT; c.font = '8px "Segoe UI", sans-serif'; c.textAlign = 'left';
    var infoY = oy + h - 26;
    c.fillText('Op: ' + curOp.name + '  |  Tool: ' + selBitCS.name + '  |  Std: ' + selBitCS.standard, ox + 5, infoY);
    c.fillText('\u00D8 ' + dfix(state.dia, 'len', 0) + ' ' + du('len') + '   Flutes: ' + selBitCS.flutes + '   Angle: ' + (selBitCS.pointAngle > 0 ? selBitCS.pointAngle + '\u00B0' : 'Flat'), ox + 5, infoY + 14);

    c.restore();
  }

  function drawForceDiagram(c, ox, oy, w, h) {
    c.save();

    /* Separator line — only when below another section */
    if (oy > 0) {
      c.strokeStyle = BORDER;
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(ox + 20, oy); c.lineTo(ox + w - 20, oy); c.stroke();
    }

    /* Title */
    c.fillStyle = ACCENT;
    c.font = 'bold 11px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('FORCE DIAGRAM', ox + w / 2, oy + 18);

    /* Left column: circle + arrows; right column: formulas */
    var cx = ox + w * 0.17;  /* shift circle left so torque label clears formula column */
    var cy = oy + 75;  /* fixed: title at oy+18, circle at cy±22, thrust ends at cy+70 < oy+h */

    /* Drill cross-section (top view - circle) */
    c.strokeStyle = '#7a8a9a';
    c.lineWidth = 2;
    c.beginPath(); c.arc(cx, cy, 22, 0, Math.PI * 2); c.stroke();
    /* Center point */
    c.fillStyle = '#7a8a9a';
    c.beginPath(); c.arc(cx, cy, 3, 0, Math.PI * 2); c.fill();
    /* Flute lines */
    c.strokeStyle = '#5a6a7a';
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(cx, cy - 22); c.lineTo(cx, cy + 22); c.stroke();

    /* Thrust force (downward arrow) */
    drawArrow(c, cx, cy + 28, cx, cy + 55, '#ff5555', 2.5);
    c.fillStyle = '#ff5555';
    c.font = 'bold 10px "Courier New", monospace';
    c.textAlign = 'center';
    c.fillText('Ft = ' + dfix(state.Ft, 'force', 1) + ' ' + du('force'), cx, cy + 70);
    c.font = '8px "Segoe UI", sans-serif';
    c.fillText('(Thrust Force)', cx, cy + 82);

    /* Torque (curved arrow) */
    c.strokeStyle = '#4488ff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(cx, cy, 32, -Math.PI * 0.7, Math.PI * 0.2);
    c.stroke();
    /* Arrowhead for torque */
    var tAng = Math.PI * 0.2;
    var tax = cx + 32 * Math.cos(tAng);
    var tay = cy + 32 * Math.sin(tAng);
    c.fillStyle = '#4488ff';
    c.beginPath();
    c.moveTo(tax + 4, tay - 3);
    c.lineTo(tax - 1, tay + 4);
    c.lineTo(tax - 3, tay - 4);
    c.closePath();
    c.fill();
    c.fillStyle = '#4488ff';
    c.font = 'bold 9px "Courier New", monospace';
    c.textAlign = 'left';
    c.fillText('T = ' + roundN(state.T, 2) + ' N\u00B7m', cx + 30, cy - 12);
    c.font = '8px "Segoe UI", sans-serif';
    c.fillText('(Torque)', cx + 30, cy);

    /* Formula summary — right column (0.55 with 8px font keeps all text within w) */
    var formX = ox + w * 0.55;
    var formY = oy + 32;
    c.fillStyle = TEXT;
    c.font = '8px "Courier New", monospace';
    c.textAlign = 'left';
    c.fillText('Ft = Ks \u00D7 f \u00D7 D / 2', formX, formY);
    c.fillText('T  = Ks \u00D7 f \u00D7 D\u00B2 / 4000', formX, formY + 15);
    c.fillText('P  = T \u00D7 2\u03C0N / 60000', formX, formY + 30);
    c.fillText('V  = \u03C0DN / 1000', formX, formY + 45);
    c.fillText('Q  = \u03C0/4 \u00D7 D\u00B2 \u00D7 f \u00D7 N', formX, formY + 60);
    c.fillStyle = DIM;
    c.font = '8px "Segoe UI", sans-serif';
    c.fillText('Ks = ' + MATERIALS[state.matIdx].Ks + ' N/mm\u00B2', formX, formY + 80);
    c.fillText('Vrec = ' + MATERIALS[state.matIdx].Vrec + ' m/min', formX, formY + 93);

    c.restore();
  }

  function drawParameterBars(c, ox, oy, w, h) {
    c.save();

    /* Separator */
    c.strokeStyle = BORDER;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(ox + 20, oy); c.lineTo(ox + w - 20, oy); c.stroke();

    /* Title */
    c.fillStyle = ACCENT;
    c.font = 'bold 11px "Segoe UI", sans-serif';
    c.textAlign = 'center';
    c.fillText('CUTTING PARAMETERS', ox + w / 2, oy + 18);

    var barData = [
      { label: 'Power',  value: state.P,  max: 5,     unit: 'kW',      color: '#ff9800' },
      { label: 'MRR',    value: state.Q,  max: 50000, unit: 'mm\u00B3/min', color: '#4caf50' },
      { label: 'Torque', value: state.T,  max: 50,    unit: 'N\u00B7m', color: '#2196f3' },
      { label: 'Thrust', value: state.Ft, max: 5000,  unit: 'N',       color: '#f44336' }
    ];

    var barX = ox + 95;
    var barW = w - 205;
    var barH2 = 16;
    var barGap = 30;
    var startY = oy + 38;

    for (var bi = 0; bi < barData.length; bi++) {
      var bd = barData[bi];
      var by = startY + bi * barGap;
      var ratio = clamp(bd.value / bd.max, 0, 1);

      /* Label */
      c.fillStyle = TEXT;
      c.font = '10px "Segoe UI", sans-serif';
      c.textAlign = 'right';
      c.fillText(bd.label, barX - 8, by + barH2 / 2 + 3);

      /* Track */
      c.fillStyle = '#1f2535';
      roundRect(c, barX, by, barW, barH2, 4);
      c.fill();

      /* Fill */
      if (ratio > 0.005) {
        c.fillStyle = bd.color;
        c.globalAlpha = 0.8;
        roundRect(c, barX, by, barW * ratio, barH2, 4);
        c.fill();
        c.globalAlpha = 1;
      }

      /* Value text */
      c.fillStyle = TEXT;
      c.font = 'bold 9px "Courier New", monospace';
      c.textAlign = 'left';
      c.fillText(roundN(bd.value, 2) + ' ' + bd.unit, barX + barW + 8, by + barH2 / 2 + 3);
    }

    c.restore();
  }

  /* ═══════════════════════════════════════════════════════════════
     S14  MODE SWITCHING
     ═══════════════════════════════════════════════════════════════ */
  function setMode(m) {
    state.mode = m;

    /* Update pills */
    var modeTabs = $('mode-tabs');
    if (modeTabs) {
      var pills = modeTabs.querySelectorAll('.pill');
      for (var pi = 0; pi < pills.length; pi++) {
        pills[pi].classList.toggle('active', pills[pi].dataset.mode === m);
      }
    }

    /* Show/hide wrappers */
    if (elSimWrapper)  elSimWrapper.style.display  = m === 'simulate' ? '' : 'none';
    if (elExpWrapper)  elExpWrapper.style.display  = m === 'explore'  ? '' : 'none';
    if (elPracWrapper) elPracWrapper.style.display = m === 'practice' ? '' : 'none';
    if (elQuizWrapper) elQuizWrapper.style.display = m === 'quiz'     ? '' : 'none';

    if (m === 'explore') {
      buildExploreCats();
      buildExploreGrid();
      selectPart(state.expPartIdx);
    }
    if (m === 'practice') {
      if (!state.pProb) newPractice();
    }
    if (m === 'quiz') {
      if (state.qSet.length === 0) startQuiz();
    }
    if (m === 'simulate') {
      drawMachine();
      drawGraph();
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S15  EXPLORE MODE — PARTS IDENTIFICATION
     ═══════════════════════════════════════════════════════════════ */
  function buildExploreCats() {
    if (!elExpCats) return;
    elExpCats.innerHTML = '';
    PART_CATS.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.className = 'config-pill' + (cat === state.expCat ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', function () {
        state.expCat = cat;
        buildExploreCats();
        buildExploreGrid();
        /* Auto-select first part in category */
        var firstInCat = PARTS.findIndex(function (p) { return p.cat === cat; });
        if (firstInCat >= 0) {
          state.expPartIdx = firstInCat;
          selectPart(firstInCat);
        }
      });
      elExpCats.appendChild(btn);
    });
  }

  function buildExploreGrid() {
    if (!elExpGrid) return;
    elExpGrid.innerHTML = '';
    var filtered = PARTS.filter(function (p) { return p.cat === state.expCat; });
    filtered.forEach(function (part) {
      var absIdx = PARTS.indexOf(part);
      var btn = document.createElement('button');
      btn.className = 'explore-btn' + (absIdx === state.expPartIdx ? ' active' : '');
      btn.textContent = part.name;
      btn.addEventListener('click', function () {
        state.expPartIdx = absIdx;
        buildExploreGrid();
        selectPart(absIdx);
      });
      elExpGrid.appendChild(btn);
    });
  }

  function selectPart(idx) {
    var part = PARTS[idx];
    if (!part || !elExpInfo) return;

    elExpInfo.innerHTML = '<h3>' + part.name + '</h3>' +
      '<p>' + part.desc + '</p>' +
      '<div class="formula-box">Category: ' + part.cat + '</div>';

    drawExplorePart(part);
  }

  /* ═══════════════════════════════════════════════════════════════
     S16  EXPLORE CANVAS (900x400) — PART DIAGRAMS
     ═══════════════════════════════════════════════════════════════ */
  function drawExplorePart(part) {
    if (!eCtx) return;
    var c = eCtx;
    var dpr = window.devicePixelRatio || 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, EW, EH);
    c.fillStyle = BG;
    c.fillRect(0, 0, EW, EH);

    /* Grid */
    c.strokeStyle = 'rgba(42,48,80,0.1)';
    c.lineWidth = 0.5;
    for (var gx = 0; gx < EW; gx += 30) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, EH); c.stroke(); }
    for (var gy = 0; gy < EH; gy += 30) { c.beginPath(); c.moveTo(0, gy); c.lineTo(EW, gy); c.stroke(); }

    /* Draw full machine outline with the selected part highlighted */
    drawExploreFullMachine(c, part);
  }

  function drawExploreFullMachine(c, highlightPart) {
    /* Simplified side-view of full drill press for explore mode */
    var mx = 300; /* machine center */
    var baseY = 360;
    var baseH = 20;
    var baseW = 200;
    var colW2 = 20;
    var colX2 = mx - colW2 / 2;
    var headY2 = 50;
    var headH2 = 80;
    var headW2 = 110;
    var tableY2 = 270;
    var tableH2 = 14;
    var tableW2 = 160;
    var quillTop2 = headY2 + headH2;
    var quillLen2 = 50;
    var chuckTop2 = quillTop2 + quillLen2;
    var chuckH2 = 14;
    var bitTop2 = chuckTop2 + chuckH2;
    var bitLen2 = 40;

    var pid = highlightPart ? highlightPart.id : '';

    /* Helper: draw a shape, glow if highlighted */
    function partStyle(partId) {
      if (partId === pid) {
        c.fillStyle = hexToRGBA(ACCENT, 0.4);
        c.strokeStyle = ACCENT;
        c.lineWidth = 2.5;
        /* glow */
        c.shadowColor = ACCENT;
        c.shadowBlur = 15;
      } else {
        c.fillStyle = '#3a4a5a';
        c.strokeStyle = '#5a6a7a';
        c.lineWidth = 1;
        c.shadowColor = 'transparent';
        c.shadowBlur = 0;
      }
    }
    function resetShadow() {
      c.shadowColor = 'transparent';
      c.shadowBlur = 0;
    }

    /* ─ Base ─ */
    partStyle('base');
    roundRect(c, mx - baseW / 2, baseY, baseW, baseH, 3);
    c.fill();
    roundRect(c, mx - baseW / 2, baseY, baseW, baseH, 3);
    c.stroke();
    resetShadow();

    /* ─ Column ─ */
    partStyle('column');
    c.fillRect(colX2, headY2 + headH2, colW2, baseY - headY2 - headH2);
    c.strokeRect(colX2, headY2 + headH2, colW2, baseY - headY2 - headH2);
    resetShadow();

    /* ─ Table ─ */
    partStyle('table');
    roundRect(c, mx - tableW2 / 2, tableY2, tableW2, tableH2, 2);
    c.fill();
    roundRect(c, mx - tableW2 / 2, tableY2, tableW2, tableH2, 2);
    c.stroke();
    resetShadow();

    /* ─ Table Clamp ─ */
    partStyle('table-clamp');
    roundRect(c, colX2 - 6, tableY2 + tableH2 + 2, colW2 + 12, 10, 2);
    c.fill();
    roundRect(c, colX2 - 6, tableY2 + tableH2 + 2, colW2 + 12, 10, 2);
    c.stroke();
    resetShadow();

    /* ─ Head Assembly ─ */
    partStyle('head');
    roundRect(c, mx - headW2 / 2, headY2, headW2, headH2, 5);
    c.fill();
    roundRect(c, mx - headW2 / 2, headY2, headW2, headH2, 5);
    c.stroke();
    resetShadow();

    /* ─ Motor ─ */
    partStyle('motor');
    roundRect(c, mx - headW2 / 2 + 10, headY2 - 30, headW2 - 20, 32, 4);
    c.fill();
    roundRect(c, mx - headW2 / 2 + 10, headY2 - 30, headW2 - 20, 32, 4);
    c.stroke();
    resetShadow();

    /* ─ Spindle ─ */
    partStyle('spindle');
    c.fillRect(mx - 5, quillTop2 + 3, 10, quillLen2 - 3);
    c.strokeRect(mx - 5, quillTop2 + 3, 10, quillLen2 - 3);
    resetShadow();

    /* ─ Quill ─ */
    partStyle('quill');
    c.fillRect(mx - 8, quillTop2, 16, quillLen2);
    c.strokeRect(mx - 8, quillTop2, 16, quillLen2);
    resetShadow();

    /* ─ Chuck ─ */
    partStyle('chuck');
    c.beginPath();
    c.moveTo(mx - 10, chuckTop2);
    c.lineTo(mx + 10, chuckTop2);
    c.lineTo(mx + 6, chuckTop2 + chuckH2);
    c.lineTo(mx - 6, chuckTop2 + chuckH2);
    c.closePath();
    c.fill(); c.stroke();
    resetShadow();

    /* ─ Drill Bit ─ */
    partStyle('drill-bit');
    c.beginPath();
    c.moveTo(mx - 4, bitTop2);
    c.lineTo(mx + 4, bitTop2);
    c.lineTo(mx + 4, bitTop2 + bitLen2 - 6);
    c.lineTo(mx, bitTop2 + bitLen2);
    c.lineTo(mx - 4, bitTop2 + bitLen2 - 6);
    c.closePath();
    c.fill(); c.stroke();
    resetShadow();

    /* ─ Feed Handle ─ */
    partStyle('feed-handle');
    var fhX2 = mx + 20;
    var fhY2 = quillTop2 + quillLen2 - 10;
    c.beginPath(); c.arc(fhX2 + 18, fhY2, 12, 0, Math.PI * 2); c.fill(); c.stroke();
    /* Spokes */
    c.lineWidth = pid === 'feed-handle' ? 2.5 : 1;
    for (var fs = 0; fs < 3; fs++) {
      var fsa = fs * Math.PI * 2 / 3;
      c.beginPath();
      c.moveTo(fhX2 + 18, fhY2);
      c.lineTo(fhX2 + 18 + Math.cos(fsa) * 12, fhY2 + Math.sin(fsa) * 12);
      c.stroke();
    }
    resetShadow();

    /* ─ Depth Stop ─ */
    partStyle('depth-stop');
    c.fillRect(mx + 12, quillTop2 + 5, 4, 35);
    c.strokeRect(mx + 12, quillTop2 + 5, 4, 35);
    resetShadow();

    /* ─ Return Spring ─ */
    partStyle('return-spring');
    var rsX2 = mx - 14;
    c.beginPath();
    c.moveTo(rsX2, quillTop2 + 5);
    for (var rs = 1; rs <= 6; rs++) {
      c.lineTo(rsX2 + (rs % 2 === 0 ? -3 : 3), quillTop2 + 5 + rs * 5);
    }
    c.stroke();
    resetShadow();

    /* ─ Speed Selector ─ */
    partStyle('speed-sel');
    c.beginPath(); c.arc(mx + headW2 / 2 - 25, headY2 + 30, 12, 0, Math.PI * 2);
    c.fill(); c.stroke();
    resetShadow();

    /* ─ Power Switch ─ */
    partStyle('power-switch');
    roundRect(c, mx - headW2 / 2 + 8, headY2 + headH2 - 22, 14, 14, 2);
    c.fill();
    roundRect(c, mx - headW2 / 2 + 8, headY2 + headH2 - 22, 14, 14, 2);
    c.stroke();
    resetShadow();

    /* ─ Guard ─ */
    partStyle('guard');
    c.globalAlpha = pid === 'guard' ? 0.4 : 0.15;
    roundRect(c, mx - 22, chuckTop2 - 8, 44, chuckH2 + bitLen2 + 18, 6);
    c.fill();
    c.globalAlpha = 1;
    roundRect(c, mx - 22, chuckTop2 - 8, 44, chuckH2 + bitLen2 + 18, 6);
    c.stroke();
    resetShadow();

    /* ─ Coolant System ─ */
    partStyle('coolant');
    c.lineWidth = pid === 'coolant' ? 3 : 2;
    c.beginPath();
    c.moveTo(mx - headW2 / 2 + 5, headY2 + headH2 - 5);
    c.quadraticCurveTo(mx - 35, chuckTop2 - 20, mx - 28, chuckTop2 + 5);
    c.stroke();
    c.beginPath(); c.arc(mx - 28, chuckTop2 + 5, 3, 0, Math.PI * 2); c.fill();
    resetShadow();

    /* ─ Worktable Vice ─ */
    partStyle('vice');
    var wpW2 = 50;
    /* Vice jaws */
    c.fillRect(mx - wpW2 / 2 - 10, tableY2 - 18, 10, 16);
    c.fillRect(mx + wpW2 / 2, tableY2 - 18, 10, 16);
    c.strokeRect(mx - wpW2 / 2 - 10, tableY2 - 18, 10, 16);
    c.strokeRect(mx + wpW2 / 2, tableY2 - 18, 10, 16);
    /* Workpiece between jaws */
    c.fillStyle = pid === 'vice' ? hexToRGBA(ACCENT, 0.3) : '#78909c';
    c.fillRect(mx - wpW2 / 2, tableY2 - 18, wpW2, 16);
    resetShadow();

    /* ─── Info panel on right side ─── */
    if (highlightPart) {
      var infoX = 550;
      var infoY = 50;
      var infoW2 = 320;
      var infoH2 = 300;

      /* Panel background */
      c.fillStyle = SURFACE;
      c.strokeStyle = ACCENT;
      c.lineWidth = 1;
      roundRect(c, infoX, infoY, infoW2, infoH2, 8);
      c.fill();
      roundRect(c, infoX, infoY, infoW2, infoH2, 8);
      c.stroke();

      /* Part name */
      c.fillStyle = ACCENT;
      c.font = 'bold 14px "Segoe UI", sans-serif';
      c.textAlign = 'left';
      c.fillText(highlightPart.name, infoX + 15, infoY + 28);

      /* Category badge */
      c.fillStyle = hexToRGBA(ACCENT, 0.2);
      var catText = highlightPart.cat;
      c.font = '10px "Segoe UI", sans-serif';
      var catW = c.measureText(catText).width + 12;
      roundRect(c, infoX + 15, infoY + 38, catW, 18, 4);
      c.fill();
      c.fillStyle = ACCENT;
      c.fillText(catText, infoX + 21, infoY + 51);

      /* Description - word wrap */
      c.fillStyle = TEXT;
      c.font = '11px "Segoe UI", sans-serif';
      var descWords = highlightPart.desc.split(' ');
      var descLine = '';
      var descY = infoY + 80;
      var maxDescW = infoW2 - 30;
      for (var dw = 0; dw < descWords.length; dw++) {
        var testLine = descLine + (descLine ? ' ' : '') + descWords[dw];
        if (c.measureText(testLine).width > maxDescW && descLine) {
          c.fillText(descLine, infoX + 15, descY);
          descLine = descWords[dw];
          descY += 16;
        } else {
          descLine = testLine;
        }
      }
      if (descLine) c.fillText(descLine, infoX + 15, descY);

      /* Part number */
      var partNum = PARTS.indexOf(highlightPart) + 1;
      c.fillStyle = DIM;
      c.font = '10px "Courier New", monospace';
      c.fillText('Part #' + partNum + ' of ' + PARTS.length, infoX + 15, infoY + infoH2 - 15);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S17  PRACTICE MODE — 12 PROBLEM GENERATORS
     ═══════════════════════════════════════════════════════════════ */
  var PRACTICE_GENERATORS = [
    /* 1. Cutting speed */
    function () {
      var D = randInt(6, 40);
      var N = randInt(200, 2000);
      var V = Math.PI * D * N / 1000;
      return {
        prompt: 'A drill bit of diameter <strong>' + D + ' mm</strong> rotates at <strong>' + N + ' RPM</strong>. Calculate the cutting speed V.',
        unit: 'm/min',
        answer: roundN(V, 2),
        tolerance: 0.5,
        solution: 'V = \u03C0 \u00D7 D \u00D7 N / 1000<br>V = \u03C0 \u00D7 ' + D + ' \u00D7 ' + N + ' / 1000<br><strong>V = ' + roundN(V, 2) + ' m/min</strong>'
      };
    },
    /* 2. RPM for given cutting speed */
    function () {
      var D = randInt(6, 30);
      var V = randInt(15, 80);
      var N = (V * 1000) / (Math.PI * D);
      return {
        prompt: 'Find the required RPM to achieve a cutting speed of <strong>' + V + ' m/min</strong> with a <strong>' + D + ' mm</strong> drill bit.',
        unit: 'RPM',
        answer: roundN(N, 1),
        tolerance: 5,
        solution: 'N = V \u00D7 1000 / (\u03C0 \u00D7 D)<br>N = ' + V + ' \u00D7 1000 / (\u03C0 \u00D7 ' + D + ')<br><strong>N = ' + roundN(N, 1) + ' RPM</strong>'
      };
    },
    /* 3. MRR */
    function () {
      var D = randInt(8, 30);
      var f = roundN(randFloat(0.05, 0.3), 2);
      var N = randInt(300, 1500);
      var Q = (Math.PI / 4) * D * D * f * N;
      return {
        prompt: 'Calculate the MRR when drilling with D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>, N = <strong>' + N + ' RPM</strong>.',
        unit: 'mm\u00B3/min',
        answer: roundN(Q, 1),
        tolerance: Q * 0.02,
        solution: 'Q = \u03C0/4 \u00D7 D\u00B2 \u00D7 f \u00D7 N<br>Q = \u03C0/4 \u00D7 ' + D + '\u00B2 \u00D7 ' + f + ' \u00D7 ' + N + '<br><strong>Q = ' + roundN(Q, 1) + ' mm\u00B3/min</strong>'
      };
    },
    /* 4. Machining time */
    function () {
      var L = randInt(15, 60);
      var f = roundN(randFloat(0.05, 0.25), 2);
      var N = randInt(400, 1500);
      var D = randInt(8, 25);
      var approach = D / 2 * Math.tan((90 - 59) * Math.PI / 180);
      var totalL = L + approach;
      var tm = (totalL / (f * N)) * 60;
      return {
        prompt: 'Calculate machining time for drilling a hole: depth = <strong>' + L + ' mm</strong>, D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>, N = <strong>' + N + ' RPM</strong>. Include approach distance (point angle 118\u00B0).',
        unit: 'seconds',
        answer: roundN(tm, 2),
        tolerance: tm * 0.05,
        solution: 'Approach = D/2 \u00D7 tan(31\u00B0) = ' + roundN(approach, 2) + ' mm<br>Total L = ' + L + ' + ' + roundN(approach, 2) + ' = ' + roundN(totalL, 2) + ' mm<br>t = (L / (f \u00D7 N)) \u00D7 60<br>t = (' + roundN(totalL, 2) + ' / (' + f + ' \u00D7 ' + N + ')) \u00D7 60<br><strong>t = ' + roundN(tm, 2) + ' seconds</strong>'
      };
    },
    /* 5. Torque */
    function () {
      var mi = randInt(0, MATERIALS.length - 1);
      var mat = MATERIALS[mi];
      var D = randInt(8, 30);
      var f = roundN(randFloat(0.05, 0.25), 2);
      var T = mat.Ks * f * D * D / (4 * 1000);
      return {
        prompt: 'Calculate drilling torque for <strong>' + mat.name + '</strong> (Ks = ' + mat.Ks + ' N/mm\u00B2), D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>.',
        unit: 'N\u00B7m',
        answer: roundN(T, 2),
        tolerance: T * 0.03,
        solution: 'T = Ks \u00D7 f \u00D7 D\u00B2 / (4 \u00D7 1000)<br>T = ' + mat.Ks + ' \u00D7 ' + f + ' \u00D7 ' + D + '\u00B2 / 4000<br><strong>T = ' + roundN(T, 2) + ' N\u00B7m</strong>'
      };
    },
    /* 6. Thrust force */
    function () {
      var mi = randInt(0, MATERIALS.length - 1);
      var mat = MATERIALS[mi];
      var D = randInt(6, 25);
      var f = roundN(randFloat(0.05, 0.3), 2);
      var Ft = mat.Ks * f * D / 2;
      return {
        prompt: 'Calculate thrust force for drilling <strong>' + mat.name + '</strong> (Ks = ' + mat.Ks + ' N/mm\u00B2), D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>.',
        unit: 'N',
        answer: roundN(Ft, 1),
        tolerance: Ft * 0.03,
        solution: 'Ft = Ks \u00D7 f \u00D7 D / 2<br>Ft = ' + mat.Ks + ' \u00D7 ' + f + ' \u00D7 ' + D + ' / 2<br><strong>Ft = ' + roundN(Ft, 1) + ' N</strong>'
      };
    },
    /* 7. Power */
    function () {
      var mi = randInt(0, MATERIALS.length - 1);
      var mat = MATERIALS[mi];
      var D = randInt(8, 25);
      var f = roundN(randFloat(0.05, 0.2), 2);
      var N = randInt(400, 1500);
      var T = mat.Ks * f * D * D / (4 * 1000);
      var P = T * 2 * Math.PI * N / 60000;
      return {
        prompt: 'Calculate power required to drill <strong>' + mat.name + '</strong> (Ks = ' + mat.Ks + ' N/mm\u00B2) with D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>, N = <strong>' + N + ' RPM</strong>.',
        unit: 'kW',
        answer: roundN(P, 3),
        tolerance: P * 0.05,
        solution: 'T = Ks \u00D7 f \u00D7 D\u00B2 / 4000 = ' + roundN(T, 3) + ' N\u00B7m<br>P = T \u00D7 2\u03C0N / 60000<br>P = ' + roundN(T, 3) + ' \u00D7 2\u03C0 \u00D7 ' + N + ' / 60000<br><strong>P = ' + roundN(P, 3) + ' kW</strong>'
      };
    },
    /* 8. Feed per tooth */
    function () {
      var f = roundN(randFloat(0.05, 0.4), 2);
      var fz = f / 2;
      return {
        prompt: 'A twist drill has 2 flutes and the feed rate is <strong>' + f + ' mm/rev</strong>. What is the feed per tooth (fz)?',
        unit: 'mm/tooth',
        answer: roundN(fz, 3),
        tolerance: 0.002,
        solution: 'fz = f / z = f / 2<br>fz = ' + f + ' / 2<br><strong>fz = ' + roundN(fz, 3) + ' mm/tooth</strong>'
      };
    },
    /* 9. Surface roughness */
    function () {
      var D = randInt(8, 30);
      var f = roundN(randFloat(0.05, 0.25), 2);
      var r = D / 4;
      var Ra = (f * f) / (32 * r) * 1000;
      return {
        prompt: 'Estimate surface roughness Ra for drilling with D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>. Use tool nose radius r = D/4.',
        unit: '\u00B5m',
        answer: roundN(Ra, 2),
        tolerance: Ra * 0.05,
        solution: 'r = D/4 = ' + D + '/4 = ' + roundN(r, 2) + ' mm<br>Ra = f\u00B2 / (32 \u00D7 r) \u00D7 1000<br>Ra = ' + f + '\u00B2 / (32 \u00D7 ' + roundN(r, 2) + ') \u00D7 1000<br><strong>Ra = ' + roundN(Ra, 2) + ' \u00B5m</strong>'
      };
    },
    /* 10. Drill point advance (approach distance) */
    function () {
      var D = randInt(8, 40);
      var pointAngle = 118;
      var halfAngle = pointAngle / 2;
      var approach = (D / 2) / Math.tan(halfAngle * Math.PI / 180);
      return {
        prompt: 'Calculate the drill point advance (approach distance) for a drill of diameter <strong>' + D + ' mm</strong> with a point angle of <strong>' + pointAngle + '\u00B0</strong>.',
        unit: 'mm',
        answer: roundN(approach, 2),
        tolerance: approach * 0.03,
        solution: 'Approach = (D/2) / tan(point angle/2)<br>= (' + D + '/2) / tan(' + halfAngle + '\u00B0)<br>= ' + roundN(D / 2, 1) + ' / ' + roundN(Math.tan(halfAngle * Math.PI / 180), 4) + '<br><strong>Approach = ' + roundN(approach, 2) + ' mm</strong>'
      };
    },
    /* 11. Number of holes per minute */
    function () {
      var L = randInt(10, 30);
      var f = roundN(randFloat(0.08, 0.2), 2);
      var N = randInt(500, 1500);
      var D = randInt(6, 16);
      var approach = D / 2 * Math.tan((90 - 59) * Math.PI / 180);
      var totalL = L + approach;
      var tmMin = totalL / (f * N); /* minutes per hole */
      var holesPerMin = 1 / tmMin;
      return {
        prompt: 'How many holes per minute can be drilled? Depth = <strong>' + L + ' mm</strong>, D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>, N = <strong>' + N + ' RPM</strong>. (Ignore positioning time, include approach)',
        unit: 'holes/min',
        answer: roundN(holesPerMin, 2),
        tolerance: holesPerMin * 0.05,
        solution: 'Approach = ' + roundN(approach, 2) + ' mm<br>Total L = ' + roundN(totalL, 2) + ' mm<br>Time per hole = L / (f\u00D7N) = ' + roundN(tmMin, 4) + ' min<br><strong>Holes/min = ' + roundN(holesPerMin, 2) + '</strong>'
      };
    },
    /* 12. Specific cutting energy */
    function () {
      var mi = randInt(0, MATERIALS.length - 1);
      var mat = MATERIALS[mi];
      var D = randInt(8, 25);
      var f = roundN(randFloat(0.05, 0.2), 2);
      var N = randInt(400, 1200);
      var T = mat.Ks * f * D * D / (4 * 1000);
      var P = T * 2 * Math.PI * N / 60000; /* kW */
      var Q = (Math.PI / 4) * D * D * f * N; /* mm^3/min */
      var Qm3s = Q / (60 * 1e9); /* m^3/s */
      var Pw = P * 1000; /* W */
      var u = (Qm3s > 0) ? Pw / Qm3s : 0; /* J/m^3 = Pa */
      var uGPa = u / 1e9;
      return {
        prompt: 'Calculate specific cutting energy for drilling <strong>' + mat.name + '</strong> (Ks = ' + mat.Ks + ' N/mm\u00B2) with D = <strong>' + D + ' mm</strong>, f = <strong>' + f + ' mm/rev</strong>, N = <strong>' + N + ' RPM</strong>. Express in GPa (= GJ/m\u00B3).',
        unit: 'GPa',
        answer: roundN(uGPa, 3),
        tolerance: uGPa * 0.05,
        solution: 'P = ' + roundN(P, 4) + ' kW = ' + roundN(Pw, 2) + ' W<br>Q = ' + roundN(Q, 1) + ' mm\u00B3/min = ' + roundN(Qm3s * 1e6, 6) + ' \u00D7 10\u207B\u2076 m\u00B3/s<br>u = P/Q = ' + roundN(Pw, 2) + ' / ' + roundN(Qm3s * 1e6, 6) + 'e-6<br><strong>u = ' + roundN(uGPa, 3) + ' GPa</strong>'
      };
    }
  ];

  function newPractice() {
    var genIdx = randInt(0, PRACTICE_GENERATORS.length - 1);
    state.pProb = PRACTICE_GENERATORS[genIdx]();
    state.pAnswered = false;

    if (elPracPrompt) elPracPrompt.innerHTML = state.pProb.prompt;
    if (elPracUnit) elPracUnit.textContent = state.pProb.unit;
    if (elPracInput) { elPracInput.value = ''; elPracInput.disabled = false; }
    if (elPracFeedback) { elPracFeedback.textContent = ''; elPracFeedback.className = 'practice-feedback'; }
    if (elPracSolution) { elPracSolution.style.display = 'none'; elPracSolution.innerHTML = ''; }
    if (elBtnShowSol) elBtnShowSol.style.display = 'none';
    if (elBtnCheck) elBtnCheck.disabled = false;
  }

  function checkPractice() {
    if (!state.pProb || state.pAnswered) return;
    var userVal = parseFloat(elPracInput ? elPracInput.value : '');
    if (isNaN(userVal)) {
      if (elPracFeedback) { elPracFeedback.textContent = 'Please enter a number.'; elPracFeedback.className = 'practice-feedback err'; }
      return;
    }

    state.pAnswered = true;
    state.pTotal++;
    var diff = Math.abs(userVal - state.pProb.answer);
    var tol = state.pProb.tolerance;
    var correct = diff <= tol;

    if (correct) {
      state.pCorrect++;
      if (elPracFeedback) { elPracFeedback.innerHTML = 'Correct! (' + state.pProb.answer + ')'; elPracFeedback.className = 'practice-feedback ok'; }
    } else {
      if (elPracFeedback) { elPracFeedback.innerHTML = 'Incorrect. Expected: ' + state.pProb.answer + ' ' + state.pProb.unit; elPracFeedback.className = 'practice-feedback err'; }
      if (elBtnShowSol) elBtnShowSol.style.display = '';
    }

    if (elPracInput) elPracInput.disabled = true;
    if (elBtnCheck) elBtnCheck.disabled = true;
    if (elPracScore) elPracScore.textContent = state.pCorrect + ' / ' + state.pTotal;
  }

  function showSolution() {
    if (!state.pProb) return;
    if (elPracSolution) {
      elPracSolution.innerHTML = state.pProb.solution;
      elPracSolution.style.display = 'block';
    }
  }

  function wirePractice() {
    if (elBtnCheck) elBtnCheck.addEventListener('click', checkPractice);
    if (elBtnShowSol) elBtnShowSol.addEventListener('click', showSolution);
    if (elBtnNextProb) elBtnNextProb.addEventListener('click', newPractice);
    if (elPracInput) {
      elPracInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') checkPractice();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S18  QUIZ MODE — 15 QUESTIONS (10 MCQ + 5 NUMERIC)
     ═══════════════════════════════════════════════════════════════ */
  var QUIZ_MCQ_POOL = [
    /* Parts identification */
    {
      q: 'Which part of a drilling machine supports the entire weight and provides stability?',
      opts: ['Base', 'Column', 'Table', 'Head Assembly'],
      ans: 0
    },
    {
      q: 'The quill in a drilling machine is:',
      opts: ['A rotating shaft that holds the drill', 'A non-rotating sleeve that holds the spindle and moves vertically', 'The motor housing', 'The belt guard'],
      ans: 1
    },
    {
      q: 'What is the function of the return spring in a drill press?',
      opts: ['Controls spindle speed', 'Returns the quill to the top position after drilling', 'Holds the workpiece', 'Adjusts the table height'],
      ans: 1
    },
    {
      q: 'Which component limits the maximum drilling depth?',
      opts: ['Feed handle', 'Table clamp', 'Depth stop', 'Power switch'],
      ans: 2
    },
    {
      q: 'The standard point angle for a general-purpose HSS twist drill is:',
      opts: ['90\u00B0', '118\u00B0', '135\u00B0', '150\u00B0'],
      ans: 1
    },
    /* Operation identification */
    {
      q: 'Which drilling operation creates a flat-bottom recess for bolt heads?',
      opts: ['Countersinking', 'Counterboring', 'Reaming', 'Tapping'],
      ans: 1
    },
    {
      q: 'Reaming is primarily performed to:',
      opts: ['Create a new hole', 'Cut internal threads', 'Finish a hole to precise size and surface quality', 'Enlarge a hole by a large amount'],
      ans: 2
    },
    {
      q: 'Tapping on a drill press is used to:',
      opts: ['Make the hole deeper', 'Cut internal threads', 'Polish the hole surface', 'Measure the hole diameter'],
      ans: 1
    },
    {
      q: 'Countersinking produces what type of recess?',
      opts: ['Flat bottom cylindrical', 'Conical (typically 90\u00B0)', 'Spherical', 'Square'],
      ans: 1
    },
    /* Safety & best practices */
    {
      q: 'Why is a safety guard important on a drilling machine?',
      opts: ['It lubricates the drill', 'It prevents chips and broken bits from hitting the operator', 'It reduces vibration', 'It increases cutting speed'],
      ans: 1
    },
    {
      q: 'What is the purpose of cutting fluid (coolant) in drilling?',
      opts: ['Only to lubricate the spindle bearings', 'To reduce heat, improve finish, extend tool life, and help evacuate chips', 'Only to keep the motor cool', 'To increase the hardness of the drill bit'],
      ans: 1
    },
    {
      q: 'The chuck key should be removed from the chuck:',
      opts: ['After the motor is started', 'Before the motor is started', 'Only when changing drill bits', 'Never \u2014 it stays in during operation'],
      ans: 1
    },
    /* Drill bit geometry */
    {
      q: 'How many flutes does a standard twist drill have?',
      opts: ['1', '2', '3', '4'],
      ans: 1
    },
    {
      q: 'The helix angle on a standard twist drill is typically:',
      opts: ['10-15\u00B0', '18-22\u00B0', '25-33\u00B0', '40-50\u00B0'],
      ans: 2
    },
    {
      q: 'The chisel edge of a twist drill:',
      opts: ['Is the sharpest cutting edge', 'Is at the center and pushes rather than cuts material', 'Is along the outside diameter', 'Is only present on carbide drills'],
      ans: 1
    },
    /* Cutting parameter formulas */
    {
      q: 'The formula for cutting speed in drilling is:',
      opts: ['V = D \u00D7 N / 1000', 'V = \u03C0DN / 1000', 'V = 2\u03C0DN / 1000', 'V = \u03C0D\u00B2N / 1000'],
      ans: 1
    },
    {
      q: 'Material Removal Rate (MRR) in drilling depends on:',
      opts: ['Only spindle speed', 'Drill diameter, feed rate, and spindle speed', 'Only the material hardness', 'Only the depth of hole'],
      ans: 1
    },
    {
      q: 'Which material generally requires the highest cutting speed?',
      opts: ['Stainless Steel', 'Cast Iron', 'Aluminum', 'Mild Steel'],
      ans: 2
    },
    {
      q: 'What does Ks represent in drilling calculations?',
      opts: ['Spindle stiffness constant', 'Specific cutting force (N/mm\u00B2)', 'Surface finish factor', 'Thermal conductivity'],
      ans: 1
    },
    {
      q: 'Step pulleys on a drill press are used to:',
      opts: ['Hold the drill bit', 'Change spindle speed', 'Adjust the table', 'Lock the column'],
      ans: 1
    }
  ];

  var QUIZ_NUM_POOL = [
    function () {
      var D = randInt(8, 25);
      var N = randInt(300, 1500);
      var V = Math.PI * D * N / 1000;
      return { q: 'Calculate cutting speed (m/min) for D = ' + D + ' mm, N = ' + N + ' RPM.', ans: roundN(V, 2), unit: 'm/min', tol: 0.5 };
    },
    function () {
      var D = randInt(8, 20);
      var V = randInt(15, 60);
      var N = V * 1000 / (Math.PI * D);
      return { q: 'Find RPM for V = ' + V + ' m/min, D = ' + D + ' mm.', ans: roundN(N, 1), unit: 'RPM', tol: 5 };
    },
    function () {
      var D = randInt(8, 20);
      var f = roundN(randFloat(0.05, 0.2), 2);
      var N = randInt(400, 1200);
      var Q = Math.PI / 4 * D * D * f * N;
      return { q: 'MRR for D = ' + D + ' mm, f = ' + f + ' mm/rev, N = ' + N + ' RPM?', ans: roundN(Q, 1), unit: 'mm\u00B3/min', tol: Q * 0.03 };
    },
    function () {
      var mi = randInt(0, MATERIALS.length - 1);
      var mat = MATERIALS[mi];
      var D = randInt(8, 20);
      var f = roundN(randFloat(0.05, 0.15), 2);
      var T = mat.Ks * f * D * D / 4000;
      return { q: 'Torque for ' + mat.name + ' (Ks=' + mat.Ks + '), D=' + D + ' mm, f=' + f + ' mm/rev?', ans: roundN(T, 2), unit: 'N\u00B7m', tol: T * 0.05 };
    },
    function () {
      var mi = randInt(0, MATERIALS.length - 1);
      var mat = MATERIALS[mi];
      var D = randInt(6, 20);
      var f = roundN(randFloat(0.05, 0.2), 2);
      var Ft = mat.Ks * f * D / 2;
      return { q: 'Thrust force for ' + mat.name + ' (Ks=' + mat.Ks + '), D=' + D + ' mm, f=' + f + ' mm/rev?', ans: roundN(Ft, 1), unit: 'N', tol: Ft * 0.05 };
    },
    function () {
      var D = randInt(8, 30);
      var f = roundN(randFloat(0.05, 0.2), 2);
      var r = D / 4;
      var Ra = f * f / (32 * r) * 1000;
      return { q: 'Surface roughness Ra for D = ' + D + ' mm, f = ' + f + ' mm/rev? (r = D/4)', ans: roundN(Ra, 2), unit: '\u00B5m', tol: Ra * 0.05 };
    },
    function () {
      var mi = randInt(0, MATERIALS.length - 1);
      var mat = MATERIALS[mi];
      var D = randInt(8, 20);
      var f = roundN(randFloat(0.05, 0.15), 2);
      var N = randInt(400, 1200);
      var T = mat.Ks * f * D * D / 4000;
      var P = T * 2 * Math.PI * N / 60000;
      return { q: 'Power (kW) for ' + mat.name + ' (Ks=' + mat.Ks + '), D=' + D + ', f=' + f + ', N=' + N + '?', ans: roundN(P, 3), unit: 'kW', tol: P * 0.05 };
    },
    function () {
      var D = randInt(10, 40);
      var halfAngle = 59;
      var approach = (D / 2) / Math.tan(halfAngle * Math.PI / 180);
      return { q: 'Drill point advance (approach distance) for D = ' + D + ' mm, point angle 118\u00B0?', ans: roundN(approach, 2), unit: 'mm', tol: approach * 0.05 };
    }
  ];

  function generateQuizSet() {
    /* 10 MCQ + 5 numeric */
    var mcqs = shuffleArr(QUIZ_MCQ_POOL).slice(0, 10).map(function (m) {
      return { type: 'mcq', q: m.q, opts: m.opts, ans: m.ans };
    });
    var nums = [];
    var numPool = shuffleArr(QUIZ_NUM_POOL.map(function (fn) { return fn; }));
    for (var ni = 0; ni < 5; ni++) {
      var gen = numPool[ni % numPool.length];
      var prob = gen();
      nums.push({ type: 'num', q: prob.q, ans: prob.ans, unit: prob.unit, tol: prob.tol });
    }
    return shuffleArr(mcqs.concat(nums));
  }

  function startQuiz() {
    state.qSet = generateQuizSet();
    state.qIdx = 0;
    state.qScore = 0;
    state.qAnswered = false;
    state.qLog = [];

    if (elQuizResult) elQuizResult.style.display = 'none';
    if (elQuizPanel) elQuizPanel.style.display = '';

    showQuizQuestion();
  }

  function showQuizQuestion() {
    var q = state.qSet[state.qIdx];
    if (!q) return;

    state.qAnswered = false;

    if (elQuizCounter) elQuizCounter.textContent = 'Question ' + (state.qIdx + 1) + ' of ' + state.qSet.length;
    if (elQuizPrompt) elQuizPrompt.textContent = q.q;
    if (elQuizFeedback) { elQuizFeedback.textContent = ''; elQuizFeedback.className = 'quiz-feedback'; }
    if (elBtnQuizNext) elBtnQuizNext.style.display = 'none';

    if (q.type === 'mcq') {
      if (elQuizOptions) { elQuizOptions.style.display = ''; elQuizOptions.innerHTML = ''; }
      if (elQuizNumRow) elQuizNumRow.style.display = 'none';

      q.opts.forEach(function (opt, oi) {
        var btn = document.createElement('button');
        btn.className = 'quiz-opt';
        btn.textContent = opt;
        btn.addEventListener('click', function () {
          if (state.qAnswered) return;
          answerQuizMCQ(oi);
        });
        elQuizOptions.appendChild(btn);
      });
    } else {
      if (elQuizOptions) { elQuizOptions.style.display = 'none'; elQuizOptions.innerHTML = ''; }
      if (elQuizNumRow) elQuizNumRow.style.display = 'flex';
      if (elQuizNumInput) { elQuizNumInput.value = ''; elQuizNumInput.disabled = false; }
      if (elQuizNumUnit) elQuizNumUnit.textContent = q.unit || '';
      if (elBtnQuizSubmit) elBtnQuizSubmit.disabled = false;
    }
  }

  function answerQuizMCQ(chosenIdx) {
    state.qAnswered = true;
    var q = state.qSet[state.qIdx];
    var correct = chosenIdx === q.ans;

    var optBtns = elQuizOptions ? elQuizOptions.querySelectorAll('.quiz-opt') : [];
    for (var oi = 0; oi < optBtns.length; oi++) {
      optBtns[oi].classList.add('disabled');
      if (oi === q.ans) optBtns[oi].classList.add('correct');
      if (oi === chosenIdx && !correct) optBtns[oi].classList.add('wrong');
    }

    if (correct) {
      state.qScore++;
      if (elQuizFeedback) { elQuizFeedback.textContent = 'Correct!'; elQuizFeedback.className = 'quiz-feedback ok'; }
    } else {
      if (elQuizFeedback) { elQuizFeedback.textContent = 'Incorrect. Answer: ' + q.opts[q.ans]; elQuizFeedback.className = 'quiz-feedback err'; }
    }

    state.qLog.push({ q: q.q, correct: correct, userAns: q.opts[chosenIdx], correctAns: q.opts[q.ans] });
    if (elBtnQuizNext) elBtnQuizNext.style.display = '';
  }

  function answerQuizNum() {
    if (state.qAnswered) return;
    var q = state.qSet[state.qIdx];
    var userVal = parseFloat(elQuizNumInput ? elQuizNumInput.value : '');
    if (isNaN(userVal)) {
      if (elQuizFeedback) { elQuizFeedback.textContent = 'Enter a valid number.'; elQuizFeedback.className = 'quiz-feedback err'; }
      return;
    }

    state.qAnswered = true;
    var diff = Math.abs(userVal - q.ans);
    var correct = diff <= q.tol;

    if (correct) {
      state.qScore++;
      if (elQuizFeedback) { elQuizFeedback.textContent = 'Correct! (' + q.ans + ' ' + q.unit + ')'; elQuizFeedback.className = 'quiz-feedback ok'; }
    } else {
      if (elQuizFeedback) { elQuizFeedback.textContent = 'Incorrect. Answer: ' + q.ans + ' ' + q.unit; elQuizFeedback.className = 'quiz-feedback err'; }
    }

    if (elQuizNumInput) elQuizNumInput.disabled = true;
    if (elBtnQuizSubmit) elBtnQuizSubmit.disabled = true;
    state.qLog.push({ q: q.q, correct: correct, userAns: userVal + ' ' + q.unit, correctAns: q.ans + ' ' + q.unit });
    if (elBtnQuizNext) elBtnQuizNext.style.display = '';
  }

  function nextQuizQuestion() {
    state.qIdx++;
    if (state.qIdx >= state.qSet.length) {
      showQuizResult();
      return;
    }
    showQuizQuestion();
  }

  function showQuizResult() {
    if (elQuizPanel) elQuizPanel.style.display = 'none';
    if (elQuizResult) elQuizResult.style.display = '';

    var total = state.qSet.length;
    var score = state.qScore;
    var pct = Math.round(score / total * 100);

    /* Stars */
    var starCount = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;
    if (elQrStars) {
      var starHTML = '';
      for (var si = 0; si < 5; si++) {
        starHTML += si < starCount ? '\u2605' : '\u2606';
      }
      elQrStars.textContent = starHTML;
    }

    /* Score */
    if (elQrScore) {
      elQrScore.textContent = score + ' / ' + total + ' (' + pct + '%)';
      elQrScore.className = 'qr-score' + (pct >= 90 ? ' perfect' : pct >= 60 ? ' good' : ' poor');
    }

    /* Table */
    if (elQrTable) {
      var tbody = elQrTable.querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = '';
        state.qLog.forEach(function (entry, ei) {
          var tr = document.createElement('tr');
          tr.className = 'qr-row ' + (entry.correct ? 'ok' : 'err');
          tr.innerHTML = '<td>' + (ei + 1) + '</td><td>' + entry.q + '</td><td>' + (entry.correct ? '\u2714' : '\u2718 ' + entry.correctAns) + '</td>';
          tbody.appendChild(tr);
        });
      }
    }
  }

  function wireQuiz() {
    if (elBtnQuizSubmit) elBtnQuizSubmit.addEventListener('click', answerQuizNum);
    if (elBtnQuizNext) elBtnQuizNext.addEventListener('click', nextQuizQuestion);
    if (elBtnNewQuiz) elBtnNewQuiz.addEventListener('click', startQuiz);
    if (elQuizNumInput) {
      elQuizNumInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') answerQuizNum();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     S19  INITIALIZATION
     ═══════════════════════════════════════════════════════════════ */
  initCanvases();
  buildOpPills();
  buildMatPills();
  wireSliders();
  wireUnitToggle();
  wireButtons();
  wirePractice();
  wireQuiz();
  updatePhysics();
  updateReadouts();
  updateBadges();
  setMode('simulate');
  drawMachine();
  drawGraph();

})();
