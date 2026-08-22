/* ═══════════════════════════════════════════════════════════════════
   Electrical Wiring Simulator & Trainer  —  app.js
   Realistic pictorial house-wiring workbench with true multicore cables,
   a node-based connectivity + current solver, and live fault feedback.
   Vanilla JS, IIFE, Canvas 2D.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── tiny helpers ─────────────────────────────────────────────── */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function round(v, d) { var p = Math.pow(10, d || 0); return Math.round(v * p) / p; }

  /* ── Web Audio (oscillator SFX, no files) ─────────────────────── */
  var _ac = null;
  function actx() { if (!_ac) { try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { _ac = null; } } return _ac; }
  function tone(freq, dur, type, vol) {
    var c = actx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      g.gain.value = vol == null ? 0.05 : vol;
      o.connect(g); g.connect(c.destination);
      var t = c.currentTime; o.start(t);
      g.gain.setValueAtTime(g.gain.value, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.stop(t + dur);
    } catch (e) {}
  }
  function sfxClick()  { tone(720, 0.05, 'square', 0.04); }
  function sfxSwitch() { tone(300, 0.04, 'square', 0.06); setTimeout(function(){ tone(520,0.05,'square',0.05); }, 45); }
  function sfxOn()     { tone(660, 0.09, 'sine', 0.06); setTimeout(function(){ tone(880,0.11,'sine',0.06); }, 90); }
  function sfxTrip()   { tone(180, 0.18, 'sawtooth', 0.09); }
  function sfxBuzz()   { tone(90, 0.25, 'sawtooth', 0.05); }
  function sfxGood()   { tone(880,0.1,'sine',0.08); setTimeout(function(){ tone(1180,0.13,'sine',0.08); }, 110); }
  function sfxBad()    { tone(300,0.2,'sawtooth',0.06); }
  /* DMM continuity beep — a steady 1.5 s tone (flat hold, short release so it doesn't click) */
  function sfxCont() {
    var c = actx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'square'; o.frequency.value = 2200;
      g.gain.value = 0.04; o.connect(g); g.connect(c.destination);
      var t = c.currentTime; o.start(t);
      g.gain.setValueAtTime(0.04, t + 1.42);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      o.stop(t + 1.5);
    } catch (e) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     DATA
     ═══════════════════════════════════════════════════════════════ */
  var COL = { L: '#b5651d', N: '#3f8cff', E: '#43c66a', Lb: '#22262e', Lg: '#8a8f98' };

  /* Cable families. Each core: {role for solver ('L'/'N'/'E'), col, name}.
     3-phase cores L1/L2/L3 all carry role 'L' (harmonised colours brown/black/grey). */
  var CABLE_KINDS = {
    'sc-l':  { name: 'Single core — Line', flex: false, cores: [ {role:'L',col:COL.L,name:'Line'} ] },
    'sc-n':  { name: 'Single core — Neutral', flex: false, cores: [ {role:'N',col:COL.N,name:'Neutral'} ] },
    'sc-e':  { name: 'Single core — Earth', flex: false, cores: [ {role:'E',col:COL.E,name:'Earth'} ] },
    'te2':   { name: 'Twin & Earth', flex: false, cores: [ {role:'L',col:COL.L,name:'Line'}, {role:'N',col:COL.N,name:'Neutral'}, {role:'E',col:COL.E,name:'Earth'} ] },
    '2c':    { name: '2-core (no earth)', flex: false, cores: [ {role:'L',col:COL.L,name:'Line'}, {role:'N',col:COL.N,name:'Neutral'} ] },
    '3ce':   { name: '3-core + Earth', flex: false, cores: [ {role:'L',col:COL.L,name:'Common'}, {role:'L',col:COL.Lb,name:'Strapper 1'}, {role:'L',col:COL.Lg,name:'Strapper 2'}, {role:'E',col:COL.E,name:'Earth'} ] },
    // ── industrial: armoured & three-phase ──
    'swa3':  { name: 'SWA armoured — L·N·E', flex: false, armoured: true, cores: [ {role:'L',col:COL.L,name:'Line'}, {role:'N',col:COL.N,name:'Neutral'}, {role:'E',col:COL.E,name:'Earth'} ] },
    '4c':    { name: '4-core — 3-phase + N', flex: false, armoured: true, cores: [ {role:'L',col:COL.L,name:'L1'}, {role:'L',col:COL.Lb,name:'L2'}, {role:'L',col:COL.Lg,name:'L3'}, {role:'N',col:COL.N,name:'Neutral'} ] },
    '5c':    { name: '5-core — 3-phase+N+E', flex: false, armoured: true, cores: [ {role:'L',col:COL.L,name:'L1'}, {role:'L',col:COL.Lb,name:'L2'}, {role:'L',col:COL.Lg,name:'L3'}, {role:'N',col:COL.N,name:'Neutral'}, {role:'E',col:COL.E,name:'Earth'} ] },
    'flex2': { name: '2-core flex (Class II)', flex: true, cores: [ {role:'L',col:COL.L,name:'Line'}, {role:'N',col:COL.N,name:'Neutral'} ] },
    'flex3': { name: '3-core flex (Class I)', flex: true, cores: [ {role:'L',col:COL.L,name:'Line'}, {role:'N',col:COL.N,name:'Neutral'}, {role:'E',col:COL.E,name:'Earth'} ] },
    'flex4': { name: '4-core flex — 3-phase', flex: true, cores: [ {role:'L',col:COL.L,name:'L1'}, {role:'L',col:COL.Lb,name:'L2'}, {role:'L',col:COL.Lg,name:'L3'}, {role:'E',col:COL.E,name:'Earth'} ] },
    'flex5': { name: '5-core flex — 3-ph+N+E', flex: true, cores: [ {role:'L',col:COL.L,name:'L1'}, {role:'L',col:COL.Lb,name:'L2'}, {role:'L',col:COL.Lg,name:'L3'}, {role:'N',col:COL.N,name:'Neutral'}, {role:'E',col:COL.E,name:'Earth'} ] },
    'cord':  { name: 'Power cord — 3-pin plug', flex: true, plug: true, cores: [ {role:'L',col:COL.L,name:'Line'}, {role:'N',col:COL.N,name:'Neutral'}, {role:'E',col:COL.E,name:'Earth'} ] }
  };

  /* Sizes → current rating (A). Fixed = T&E/armoured clipped (BS7671 4D5/4D4, Method C). Flex = 4F3A. */
  /* a = current rating (A), mv = voltage drop mV/A/m (BS 7671 App 4, single-phase two-conductor loop) */
  var SIZES_FIXED = [ {mm:1.0,a:16,swg:19,mv:44}, {mm:1.5,a:20,swg:18,mv:29}, {mm:2.5,a:27,swg:16,mv:18}, {mm:4.0,a:37,swg:14,mv:11}, {mm:6.0,a:47,swg:12,mv:7.3}, {mm:10.0,a:64,swg:10,mv:4.4}, {mm:16.0,a:85,swg:5,mv:2.8}, {mm:25.0,a:110,swg:3,mv:1.75} ];
  var SIZES_FLEX  = [ {mm:0.5,a:3,swg:22,mv:93}, {mm:0.75,a:6,swg:20,mv:62}, {mm:1.0,a:10,swg:19,mv:44}, {mm:1.25,a:13,swg:17,mv:35}, {mm:1.5,a:16,swg:18,mv:29}, {mm:2.5,a:25,swg:16,mv:18} ];

  /* Connector-block configurations (distribution blocks). rails = how many independent common bars. */
  var CONNECTOR_MODES = {
    '1to5':  { name: '1 → 5 way',      w: 150, h: 44, rails: 1, ways: 5  },
    '1to10': { name: '1 → 10 way',     w: 210, h: 46, rails: 1, ways: 10 },
    '2to5':  { name: '2 × 5 · L + N',  w: 162, h: 60, rails: 2, ways: 5 }
  };

  /* Component definitions. Terminals in LOCAL coords (top-left origin). */
  var COMP = {
    'supply': {
      name: 'Consumer Unit', cat: 'comp', w: 158, h: 116,
      terminals: [ {id:'L',x:52,y:116,role:'srcL',lab:'L'}, {id:'N',x:82,y:116,role:'srcN',lab:'N'}, {id:'E',x:112,y:116,role:'srcE',lab:'E'} ],
      params: { mcb: 32, rcd: true }
    },
    'sw1': {
      name: '1-Way Switch', cat: 'comp', w: 62, h: 92, toggle: true,
      terminals: [ {id:'COM',x:20,y:92,lab:'COM'}, {id:'L1',x:44,y:92,lab:'L1'} ],
      params: {}
    },
    'sw2': {
      name: '2-Way Switch', cat: 'comp', w: 62, h: 92, toggle: true,
      terminals: [ {id:'COM',x:14,y:92,lab:'C'}, {id:'L1',x:32,y:92,lab:'L1'}, {id:'L2',x:50,y:92,lab:'L2'} ],
      params: {}
    },
    'swi': {
      name: 'Intermediate Switch', cat: 'comp', w: 66, h: 92, toggle: true,
      terminals: [ {id:'L1',x:20,y:0,lab:'L1'}, {id:'L2',x:46,y:0,lab:'L2'},
                   {id:'L3',x:20,y:92,lab:'L3'}, {id:'L4',x:46,y:92,lab:'L4'} ],
      params: {}
    },
    'sw1g2': {
      name: '2-Gang Switch', cat: 'comp', w: 100, h: 92, toggle: true, gangs: 2,
      terminals: [ {id:'COM',x:16,y:92,lab:'L'}, {id:'L1',x:58,y:92,lab:'L1'}, {id:'L2',x:84,y:92,lab:'L2'} ],
      params: {}
    },
    'sw1g3': {
      name: '3-Gang Switch', cat: 'comp', w: 132, h: 92, toggle: true, gangs: 3,
      terminals: [ {id:'COM',x:16,y:92,lab:'L'}, {id:'L1',x:54,y:92,lab:'L1'}, {id:'L2',x:84,y:92,lab:'L2'}, {id:'L3',x:114,y:92,lab:'L3'} ],
      params: {}
    },
    'sw1g4': {
      name: '4-Gang Switch', cat: 'comp', w: 164, h: 92, toggle: true, gangs: 4,
      terminals: [ {id:'COM',x:16,y:92,lab:'L'}, {id:'L1',x:52,y:92,lab:'L1'}, {id:'L2',x:80,y:92,lab:'L2'}, {id:'L3',x:108,y:92,lab:'L3'}, {id:'L4',x:136,y:92,lab:'L4'} ],
      params: {}
    },
    'socket': {
      name: '13A Socket', cat: 'comp', w: 96, h: 96,
      terminals: [ {id:'L',x:30,y:96,role:'termL',lab:'L'}, {id:'N',x:50,y:96,role:'termN',lab:'N'}, {id:'E',x:70,y:96,role:'termE',lab:'E'} ],
      params: {}
    },
    'socket2': {
      name: 'Double Socket', cat: 'comp', w: 150, h: 96, outlets: 2,
      terminals: [ {id:'L',x:56,y:96,role:'termL',lab:'L'}, {id:'N',x:76,y:96,role:'termN',lab:'N'}, {id:'E',x:96,y:96,role:'termE',lab:'E'} ],
      params: {}
    },
    'socketf': {
      name: 'Fused Socket', cat: 'comp', w: 96, h: 100, fuse: true,
      terminals: [ {id:'L',x:30,y:100,role:'termL',lab:'L'}, {id:'N',x:50,y:100,role:'termN',lab:'N'}, {id:'E',x:70,y:100,role:'termE',lab:'E'} ],
      params: { fuse: 13 }
    },
    'jbox': {
      name: 'Junction Box', cat: 'comp', w: 76, h: 76,
      terminals: [ {id:'L',x:18,y:0,lab:'L'}, {id:'N',x:58,y:0,lab:'N'}, {id:'SW',x:18,y:76,lab:'Sw'}, {id:'E',x:58,y:76,lab:'E'} ],
      params: {}
    },
    'pir': {
      name: 'PIR Sensor', cat: 'comp', w: 72, h: 90, toggle: true,
      terminals: [ {id:'L',x:16,y:90,lab:'L'}, {id:'N',x:36,y:90,lab:'N'}, {id:'Lo',x:56,y:90,lab:'Load'} ],
      params: {}
    },
    'rose': {
      name: 'Ceiling Rose', cat: 'comp', w: 92, h: 66,
      terminals: [ {id:'LP',x:16,y:66,lab:'Lp'}, {id:'N',x:38,y:66,role:'termN',lab:'N'}, {id:'SW',x:58,y:66,lab:'Sw'}, {id:'E',x:78,y:66,role:'termE',lab:'E'} ],
      params: {}
    },
    'fcu': {
      name: 'Fused Spur', cat: 'comp', w: 92, h: 96, fuse: true,
      terminals: [ {id:'Li',x:20,y:6,lab:'Lin'}, {id:'Ni',x:46,y:6,lab:'Nin'}, {id:'Ei',x:72,y:6,lab:'Ein'},
                   {id:'Lo',x:20,y:96,lab:'Lout'}, {id:'No',x:46,y:96,lab:'Nout'}, {id:'Eo',x:72,y:96,lab:'Eout'} ],
      params: { fuse: 13 }
    },
    'mcb': {
      name: 'MCB Breaker', cat: 'comp', w: 66, h: 96, toggle: true,
      terminals: [ {id:'Li',x:20,y:6,lab:'Lin'}, {id:'Ni',x:46,y:6,lab:'Nin'},
                   {id:'Lo',x:20,y:96,lab:'Lout'}, {id:'No',x:46,y:96,lab:'Nout'} ],
      params: { mcb: 16 }
    },
    'dpsw': {
      name: 'Cooker / DP Switch', cat: 'comp', w: 84, h: 100, toggle: true,
      terminals: [ {id:'Li',x:26,y:6,lab:'Lin'}, {id:'Ni',x:58,y:6,lab:'Nin'},
                   {id:'Lo',x:26,y:100,lab:'Lout'}, {id:'No',x:58,y:100,lab:'Nout'} ],
      params: {}
    },
    'connector': {
      name: 'Connector Block', cat: 'comp', w: 128, h: 46,
      terminals: [ {id:'b1',x:22,y:46,lab:'1'}, {id:'b2',x:43,y:46,lab:'2'}, {id:'b3',x:64,y:46,lab:'3'}, {id:'b4',x:85,y:46,lab:'4'}, {id:'b5',x:106,y:46,lab:'5'},
                   {id:'t1',x:22,y:0,lab:'1'}, {id:'t2',x:43,y:0,lab:'2'}, {id:'t3',x:64,y:0,lab:'3'}, {id:'t4',x:85,y:0,lab:'4'}, {id:'t5',x:106,y:0,lab:'5'} ],
      params: {}
    },
    'bell': {
      name: 'Bell Push', cat: 'comp', w: 62, h: 92, toggle: true,
      terminals: [ {id:'COM',x:20,y:92,lab:'COM'}, {id:'L1',x:44,y:92,lab:'L1'} ],
      params: {}
    },
    'socketu': {
      name: 'Unswitched Socket', cat: 'comp', w: 96, h: 96,
      terminals: [ {id:'L',x:30,y:96,role:'termL',lab:'L'}, {id:'N',x:50,y:96,role:'termN',lab:'N'}, {id:'E',x:70,y:96,role:'termE',lab:'E'} ],
      params: {}
    },
    'spd': {
      name: 'Surge Protection (SPD)', cat: 'comp', w: 84, h: 100,
      terminals: [ {id:'L',x:22,y:100,lab:'L'}, {id:'N',x:42,y:100,lab:'N'}, {id:'E',x:62,y:100,lab:'E'} ],
      params: {}
    },
    'changeover': {
      name: 'Changeover Switch', cat: 'comp', w: 112, h: 100, toggle: true,
      terminals: [ {id:'Lm',x:18,y:0,lab:'Lm'}, {id:'Nm',x:38,y:0,lab:'Nm'}, {id:'Lg',x:74,y:0,lab:'Lg'}, {id:'Ng',x:94,y:0,lab:'Ng'},
                   {id:'Lo',x:40,y:100,lab:'Lout'}, {id:'No',x:70,y:100,lab:'Nout'} ],
      params: {}
    },
    'dimmer': {
      name: 'Dimmer Switch', cat: 'comp', w: 74, h: 96, toggle: true,
      terminals: [ {id:'Li',x:20,y:0,lab:'Lin'}, {id:'Ni',x:54,y:0,lab:'Nin'},
                   {id:'Lo',x:20,y:96,lab:'Lout'}, {id:'No',x:54,y:96,lab:'Nout'} ],
      params: { rmax: 470 }
    },
    'emergency': {
      name: 'Emergency Light', cat: 'comp', w: 100, h: 72,
      terminals: [ {id:'L',x:34,y:72,lab:'L'}, {id:'N',x:66,y:72,lab:'N'} ],
      params: {}
    },
    'smoke': {
      name: 'Smoke Detector', cat: 'comp', w: 86, h: 86, toggle: true,
      terminals: [ {id:'L',x:28,y:86,lab:'L'}, {id:'N',x:58,y:86,lab:'N'} ],
      params: {}
    },
    'photo': {
      name: 'Photocell Sensor', cat: 'comp', w: 74, h: 92, toggle: true,
      terminals: [ {id:'L',x:16,y:92,lab:'L'}, {id:'N',x:36,y:92,lab:'N'}, {id:'Lo',x:56,y:92,lab:'Load'} ],
      params: {}
    },
    'isolator': {
      name: 'Isolator Switch', cat: 'comp', w: 84, h: 100, toggle: true,
      terminals: [ {id:'Li',x:26,y:6,lab:'Lin'}, {id:'Ni',x:58,y:6,lab:'Nin'},
                   {id:'Lo',x:26,y:100,lab:'Lout'}, {id:'No',x:58,y:100,lab:'Nout'} ],
      params: {}
    },
    'generator': {
      name: 'Generator', cat: 'comp', w: 116, h: 96, toggle: true,
      terminals: [ {id:'L',x:34,y:96,role:'srcL',lab:'L'}, {id:'N',x:62,y:96,role:'srcN',lab:'N'}, {id:'E',x:90,y:96,role:'srcE',lab:'E'} ],
      params: {}
    },
    'selector': {
      name: 'Selector Switch', cat: 'comp', w: 84, h: 96, toggle: true,
      terminals: [ {id:'COM',x:14,y:96,lab:'COM'}, {id:'O1',x:36,y:96,lab:'1'}, {id:'O2',x:52,y:96,lab:'2'}, {id:'O3',x:68,y:96,lab:'3'} ],
      params: {}
    },
    'timer': {
      name: 'Timer Switch', cat: 'comp', w: 80, h: 96, toggle: true,
      terminals: [ {id:'L',x:18,y:96,lab:'L'}, {id:'N',x:40,y:96,lab:'N'}, {id:'Lo',x:62,y:96,lab:'Load'} ],
      params: { dur: 8 }
    }
  };

  /* Household loads (appliances). watt ranges & Class from research. */
  var LOADS = {
    'led':    { name: 'LED Bulb',    pic: 'led',   w: 66, h: 84, watt: 9,    min: 3,    max: 15,   classI: false },
    'lamp':   { name: 'Bulb',        pic: 'bulb',  w: 66, h: 84, watt: 60,   min: 25,   max: 100,  classI: false },
    'fanC':   { name: 'Ceiling Fan', pic: 'fanC',  w: 92, h: 84, watt: 70,   min: 40,   max: 100,  classI: true  },
    'fanT':   { name: 'Table Fan',   pic: 'fanT',  w: 84, h: 84, watt: 50,   min: 25,   max: 80,   classI: false },
    'tv':     { name: 'TV',          pic: 'tv',    w: 108,h: 78, watt: 120,  min: 30,   max: 200,  classI: false },
    'fridge': { name: 'Fridge',      pic: 'fridge',w: 74, h: 100,watt: 150,  min: 100,  max: 300,  classI: true  },
    'kettle': { name: 'Kettle',      pic: 'kettle',w: 80, h: 84, watt: 2400, min: 1800, max: 3000, classI: true  },
    'micro':  { name: 'Microwave',   pic: 'micro', w: 104,h: 74, watt: 1200, min: 800,  max: 1500, classI: true  },
    'iron':   { name: 'Iron',        pic: 'iron',  w: 90, h: 70, watt: 1500, min: 1000, max: 3000, classI: true  },
    'washer': { name: 'Washer',      pic: 'washer',w: 84, h: 100,watt: 2200, min: 2000, max: 2500, classI: true  },
    'ac':     { name: 'AC (split)',  pic: 'ac',    w: 108,h: 66, watt: 1500, min: 1000, max: 3500, classI: true  },
    'heater': { name: 'Water Heater',pic: 'heater',w: 76, h: 104,watt: 3000, min: 1500, max: 3000, classI: true  },
    'laptop': { name: 'Laptop',      pic: 'laptop',w: 96, h: 74, watt: 65,   min: 30,   max: 120,  classI: false },
    'cooker': { name: 'Cooker',      pic: 'cooker',w: 100,h: 100,watt: 7000, min: 4000, max: 12000,classI: true  },
    'shower': { name: 'Elec. Shower',pic: 'shower',w: 78, h: 104,watt: 8500, min: 7000, max: 10500,classI: true  },
    'induction':{name:'Induction Hob',pic:'induction',w:104,h:80,watt:7200, min:2900, max:11000,classI: true },
    'oven':   { name: 'Oven',        pic: 'oven',  w: 88, h: 96, watt: 3000, min: 2000, max: 6000, classI: true  },
    'dish':   { name: 'Dishwasher',  pic: 'dish',  w: 82, h: 100,watt: 2000, min: 1200, max: 2400, classI: true  },
    'ev':     { name: 'EV Charger',  pic: 'ev',    w: 96, h: 100,watt: 7400, min: 3600, max: 22000,classI: true  },
    'exhaust':{ name: 'Exhaust Fan', pic: 'exhaust',w: 88, h: 84, watt: 30,   min: 15,   max: 60,   classI: false },
    'pendant':{ name: 'Pendant Light',pic:'pendant',w: 70, h: 92, watt: 60,   min: 15,   max: 100,  classI: false }
  };

  /* ═══════════════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════════════ */
  var LW = 900, LH = 560;
  var canvas, ctx, card, DPR = 1, VIEWW = LW, VIEWH = LH;
  var comps = [];        // placed components & loads
  var cables = [];       // placed multicore cables
  var joints = [];       // wire-to-wire splices: {a:{id,end,i}, b:{id,end,i}}
  var nextId = 1;
  var mode = 'simulate';
  var powered = false;
  var volts = 230;
  var sel = null;        // selected comp or cable {kind:'comp'|'cable', ref}
  var inspTarget = null; // when set, buildInspector renders here (the double-click Properties popup) instead of the side panel
  var hintOn = true;     // the on-canvas tip banner; first canvas click hides it behind an ⓘ button the user can re-open
  var R = null;          // last solver result
  var tHeat = 0;         // MCB overload heat accumulator
  var tripped = false;
  var anim = 0;          // animation clock
  var raf = 0;

  /* drag/wire interaction */
  var drag = null;       // {type, ...}
  var hoverTerm = null;  // {comp, tid} highlighted during wiring
  var hoverNode = null;  // nearest connectable node under the cursor (lights up)
  var hoverAnchor = null; // 'A' | 'B' — a cable end-anchor the cursor is over (lights up)
  var hoverRocker = null; // toggleable component whose ON/OFF rocker is under the cursor (shows a click hint)
  var hoverSocket = null; // socket highlighted while dragging a plug over it
  var hoverResize = null; // component whose resize grip the cursor is over
  var lastPreset = null;  // last example loaded from the dropdown (for the "with fault" reload)
  var DOWN = null;       // pointer-down bookkeeping for tap-vs-drag
  var meter = null;      // floating multimeter debug tool { x,y, mode:'V'|'A'|'C', red:{x,y,att}, black:{x,y,att} }

  /* ═══════════════════════════════════════════════════════════════
     GEOMETRY
     ═══════════════════════════════════════════════════════════════ */
  function defOf(c) { return c.load ? LOADS[c.type] : COMP[c.type]; }
  /* ── component scaling — c.w/c.h stay the BASE size; c.scale (min…1) sets how big it's drawn/hit-tested ── */
  var SCALE_MIN = 0.6, SCALE_MAX = 1;
  function sc(c){ var s=c.scale; return s==null?1:(s<SCALE_MIN?SCALE_MIN:(s>SCALE_MAX?SCALE_MAX:s)); }   // effective scale
  function ewid(c){ return c.w*sc(c); }      // on-board footprint width
  function ehei(c){ return c.h*sc(c); }
  /* sockets: single or double. Each outlet has its own switch + internal Lo/No/Eo node set (suffix '' or '1') */
  function isSocket(c){ return c.type==='socket'||c.type==='socket2'||c.type==='socketf'||c.type==='socketu'; }
  function socketOutlets(c){
    if (c.type==='socket2'){ var on=Array.isArray(c.on)?c.on:[true,true]; return [{sfx:'',live:on[0]!==false},{sfx:'1',live:on[1]!==false}]; }
    if (c.type==='socketf'){ return [{sfx:'', live:(c.on!==false) && !c.fuseBlown}]; }   // outlet dead if its fuse has blown
    if (c.type==='socketu'){ return [{sfx:'', live:true}]; }                             // unswitched: always live
    return [{sfx:'', live:c.on!==false}];
  }
  /* rotary dimmer resistance (Ω): 100 % level = 0 Ω (full brightness/speed), 0 % = the full rheostat range */
  function dimmerOhms(c){ var lv=(c.level==null?100:c.level); return (c.rmax||470) * (1 - clamp(lv,0,100)/100); }
  function connMode(c){ return CONNECTOR_MODES[c.cmode] || CONNECTOR_MODES['1to10']; }
  function connRot(c){ return ((c.rot||0)%360+360)%360; }                  // 0 / 90 / 180 / 270
  /* rotate a base-frame point (in a bw×bh box) into the visual local frame */
  function rotPoint(x,y,rot,bw,bh){
    if (rot===90)  return { x:bh-y, y:x    };
    if (rot===180) return { x:bw-x, y:bh-y };
    if (rot===270) return { x:y,    y:bw-x };
    return { x:x, y:y };
  }
  /* apply the current rotation to a connector's visual bounding size (base dims come from the mode) */
  function applyConnectorDims(c){ var m=connMode(c), rot=connRot(c); if (rot===90||rot===270){ c.w=m.h; c.h=m.w; } else { c.w=m.w; c.h=m.h; } }
  function setConnectorMode(c, mode){ c.cmode=mode; applyConnectorDims(c); }
  /* terminals in the block's NATURAL (unrotated) frame, sized from the mode */
  function connectorBaseTerms(c){
    var m=connMode(c), W=m.w, H=m.h, out=[];
    if (m.rails===1 && m.ways===5){        // 1 → 5 : one feed on top, five taps on the bottom
      out.push({ id:'in', x:Math.round(W/2), y:0, lab:'IN', rail:0 });
      for (var i=0;i<5;i++) out.push({ id:'o'+i, x:Math.round(W*(i+1)/6), y:H, lab:''+(i+1), rail:0 });
    } else if (m.rails===1){               // 1 → 10 : one common bar, five top + five bottom
      for (var t=0;t<5;t++) out.push({ id:'t'+t, x:Math.round(W*(t+1)/6), y:0, lab:''+(t+1), rail:0 });
      for (var b=0;b<5;b++) out.push({ id:'b'+b, x:Math.round(W*(b+1)/6), y:H, lab:''+(b+6), rail:0 });
    } else {                               // 2 × 5 : Line bar (top) + Neutral bar (bottom), independent
      out.push({ id:'lin', x:Math.round(W/8), y:0, lab:'L', rail:0 });
      for (var l=0;l<5;l++) out.push({ id:'l'+l, x:Math.round(W*(l+2.4)/8), y:0, lab:''+(l+1), rail:0 });
      out.push({ id:'nin', x:Math.round(W/8), y:H, lab:'N', rail:1 });
      for (var n2=0;n2<5;n2++) out.push({ id:'n'+n2, x:Math.round(W*(n2+2.4)/8), y:H, lab:''+(n2+1), rail:1 });
    }
    return out;
  }
  /* terminals for a connector block, rotated into its visual local frame (ids preserved so landings survive) */
  function connectorTerms(c){
    var m=connMode(c), rot=connRot(c);
    return connectorBaseTerms(c).map(function(t){ var p=rotPoint(t.x,t.y,rot,m.w,m.h);
      return { id:t.id, x:Math.round(p.x), y:Math.round(p.y), lab:t.lab, rail:t.rail }; });
  }
  function termList(c) {
    var d = defOf(c), s = sc(c), base;
    if (c.load) {
      base = [ {id:'L',x:c.w*0.30,y:c.h,lab:'L'}, {id:'N',x:c.w*0.52,y:c.h,lab:'N'} ];
      if (d.classI) base.push({id:'E',x:c.w*0.74,y:c.h,lab:'E'});
    } else if (c.type==='connector') base = connectorTerms(c);
    else base = d.terminals;
    if (s===1) return base;
    return base.map(function(t){ return { id:t.id, x:t.x*s, y:t.y*s, lab:t.lab, role:t.role, rail:t.rail }; });   // project into the scaled footprint
  }
  function termWorld(c, tid) {
    var ts = termList(c); for (var i=0;i<ts.length;i++){ if (ts[i].id===tid) return { x:c.x+ts[i].x, y:c.y+ts[i].y }; }
    return null;
  }
  function termByPoint(px, py, r) {
    r = r || 15; var best=null, bd=r*r;
    for (var i=0;i<comps.length;i++){ var c=comps[i]; var ts=termList(c);
      for (var j=0;j<ts.length;j++){ var wx=c.x+ts[j].x, wy=c.y+ts[j].y; var dx=px-wx,dy=py-wy,d=dx*dx+dy*dy;
        if (d<bd){ bd=d; best={comp:c,tid:ts[j].id,x:wx,y:wy}; } } }
    return best;
  }
  /* ── multicore cable model ──
     cb.pts  = user waypoints (tips + bend points the user drops)
     cb.path = derived orthogonal route (auto 90° elbow between waypoints) used for drawing/hit/solver-agnostic geometry */
  function outUnit(a0, a1){ var dx=a0.x-a1.x, dy=a0.y-a1.y; var l=Math.hypot(dx,dy)||1; return { ux:dx/l, uy:dy/l }; } // unit pointing outward at a0
  function copyPts(cb){ return cb.pts.map(function(p){ return {x:p.x, y:p.y}; }); }
  function syncEnds(cb){ var P=cb.path; cb.ax=P[0].x; cb.ay=P[0].y; cb.bx=P[P.length-1].x; cb.by=P[P.length-1].y; }
  function cleanPath(pts){
    var d=[]; for(var i=0;i<pts.length;i++){ var p={x:Math.round(pts[i].x), y:Math.round(pts[i].y)};
      if(!d.length || Math.abs(p.x-d[d.length-1].x)>0.5 || Math.abs(p.y-d[d.length-1].y)>0.5) d.push(p); }
    if(d.length<=2) return d.length>=2?d:pts.slice(0,2);
    var out=[d[0]];
    for(var k=1;k<d.length-1;k++){ var a=out[out.length-1], b=d[k], c=d[k+1];
      var col=(Math.abs(a.x-b.x)<0.5&&Math.abs(b.x-c.x)<0.5)||(Math.abs(a.y-b.y)<0.5&&Math.abs(b.y-c.y)<0.5);
      if(!col) out.push(b);
    }
    out.push(d[d.length-1]); return out;
  }
  function ensureCable(cb){ if(!cb.pts || cb.pts.length<2){
      cb.pts = cb.path ? [ {x:cb.path[0].x,y:cb.path[0].y}, {x:cb.path[cb.path.length-1].x,y:cb.path[cb.path.length-1].y} ]
                       : [ {x:cb.ax,y:cb.ay}, {x:cb.bx,y:cb.by} ]; } }
  function buildRoute(cb){ cb.path = cleanPath(cb.pts);
    if(cb.path.length<2) cb.path=[{x:cb.pts[0].x,y:cb.pts[0].y},{x:cb.pts[cb.pts.length-1].x,y:cb.pts[cb.pts.length-1].y}]; syncEnds(cb);
  }
  function projSeg(p,a,b){ var dx=b.x-a.x,dy=b.y-a.y; var l=dx*dx+dy*dy; if(!l) return {x:a.x,y:a.y}; var t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1); return {x:a.x+t*dx,y:a.y+t*dy}; }
  /* drop a bend point exactly on the cable at the clicked spot; returns its index */
  function insertWaypoint(cb, pt){ ensureCable(cb); var pts=cb.pts, bi=1, bd=1e9, proj={x:pt.x,y:pt.y};
    for(var i=1;i<pts.length;i++){ var pr=projSeg(pt,pts[i-1],pts[i]); var d=Math.hypot(pt.x-pr.x,pt.y-pr.y); if(d<bd){ bd=d; bi=i; proj=pr; } }
    pts.splice(bi,0,{x:Math.round(proj.x),y:Math.round(proj.y)}); buildRoute(cb); return bi;
  }
  function waypointAt(cb, px, py, r){ r=r||11; ensureCable(cb); for(var i=1;i<cb.pts.length-1;i++){ if(Math.hypot(px-cb.pts[i].x,py-cb.pts[i].y)<r) return i; } return -1; }
  /* pivot at waypoint[splitIndex] (fixed) and swing everything AFTER it to the pointer, keeping 90° corners */
  function pivotDrag(cb, splitIndex, orig, pointer){
    var P=orig.map(function(q){ return {x:q.x, y:q.y}; }); var V=P[splitIndex];
    var horiz = P[splitIndex+1] ? (Math.abs(P[splitIndex+1].x-V.x)>=Math.abs(P[splitIndex+1].y-V.y))
                                : (Math.abs(V.x-P[splitIndex-1].x)>=Math.abs(V.y-P[splitIndex-1].y));
    var out=P.slice(0,splitIndex+1), j;
    if (horiz){ var nv=clamp(pointer.y,6,LH-6), dy=nv-V.y; out.push({x:V.x,y:nv}); for(j=splitIndex+1;j<P.length;j++) out.push({x:P[j].x,y:P[j].y+dy}); }
    else      { var nx=clamp(pointer.x,6,LW-6), dx=nx-V.x; out.push({x:nx,y:V.y}); for(j=splitIndex+1;j<P.length;j++) out.push({x:P[j].x+dx,y:P[j].y}); }
    cb.pts=cleanPath(out); buildRoute(cb);
  }

  /* cable end-node fanned positions — sheath pulled back along the end segment, cores splayed */
  function cableGeom(cb) {
    if (cb.plug) syncPlugCable(cb);
    ensureCable(cb); buildRoute(cb); var P=cb.path, n=P.length-1;
    var k = cb.cores.length, single = (k===1), spread = 16, reach = single?18:30;
    var bw = single ? 6 : (cb.armoured?15:(cb.flex?9:13));            // sheath diameter (matches drawCableSheath)
    var innerR = single ? 0 : Math.max(1.8, bw*0.5 - 3);             // cores emerge bunched WITHIN the sheath throat, not beside it
    var maxT = Math.max(1, (k-1)/2);
    var oA = outUnit(P[0], P[1]), oB = outUnit(P[n], P[n-1]);
    var lenA = Math.hypot(P[0].x-P[1].x, P[0].y-P[1].y), lenB = Math.hypot(P[n].x-P[n-1].x, P[n].y-P[n-1].y);
    var stripA = single?0:Math.min(16, lenA*0.32), stripB = (single||cb.plug)?0:Math.min(16, lenB*0.32);
    cb._sa = { x: P[0].x - oA.ux*stripA, y: P[0].y - oA.uy*stripA };  // sheath end near A (inward)
    cb._sb = { x: P[n].x - oB.ux*stripB, y: P[n].y - oB.uy*stripB };
    /* sgn keeps the core order consistent in WORLD space: the outward directions at the two
       ends are opposite, so end B mirrors its perpendicular — otherwise the cores cross over.
       Each core's BASE sits inside the sheath cross-section (bunched at the cut face) and its
       fan point splays outward — so the conductors clearly emerge from the sheath tip. */
    function ends(tip, out, sx, sy, sgn){ var px=-out.uy*sgn, py=out.ux*sgn; var arr=[];
      var thr = { x: sx + out.ux*2, y: sy + out.uy*2 };               // throat just outside the cut, where the cores exit
      for (var i=0;i<k;i++){ var t=(i-(k-1)/2); var bo=(t/maxT)*innerR;
        arr.push({ bx: thr.x + px*bo, by: thr.y + py*bo,
                   fx: tip.x + out.ux*reach + px*t*spread, fy: tip.y + out.uy*reach + py*t*spread }); }
      return arr;
    }
    cb._A = ends(P[0], oA, cb._sa.x, cb._sa.y, 1);
    cb._B = ends(P[n], oB, cb._sb.x, cb._sb.y, -1);
    syncEnds(cb);
  }
  /* handle position for conductor i at end ('A'/'B') */
  function condHandle(cb, end, i) {
    var land = (end==='A') ? cb.landA[i] : cb.landB[i];
    if (land) { var c=findComp(land.compId); if (c){ var w=termWorld(c,land.tid); if (w) return {x:w.x,y:w.y}; } }
    var j = findJoint(cb.id, end, i); if (j) { var jp=jointPos(j); if (jp) return jp; }
    if (!cb._A || !cb._B) cableGeom(cb);   // fanned tips exist only after geometry — compute on demand (probe ticks run before draw)
    var g = (end==='A') ? cb._A[i] : cb._B[i]; return { x:g.fx, y:g.fy };
  }
  function findComp(id){ for (var i=0;i<comps.length;i++) if (comps[i].id===id) return comps[i]; return null; }
  function findCable(id){ for (var i=0;i<cables.length;i++) if (cables[i].id===id) return cables[i]; return null; }

  /* wire-to-wire joints */
  function jointMatch(ref,id,end,i){ return ref.id===id && ref.end===end && ref.i===i; }
  function findJoint(id,end,i){ for (var k=0;k<joints.length;k++){ if (jointMatch(joints[k].a,id,end,i)||jointMatch(joints[k].b,id,end,i)) return joints[k]; } return null; }
  function endpointAnchor(ref){ var cb=findCable(ref.id); if(!cb) return null; cableGeom(cb);
    var land=ref.end==='A'?cb.landA[ref.i]:cb.landB[ref.i];
    if(land){ var c=findComp(land.compId); if(c){ var w=termWorld(c,land.tid); if(w) return w; } }
    var g=ref.end==='A'?cb._A[ref.i]:cb._B[ref.i]; return g?{x:g.fx,y:g.fy}:null;
  }
  function jointPos(j){ var a=endpointAnchor(j.a), b=endpointAnchor(j.b); if(!a) return b; if(!b) return a; return {x:(a.x+b.x)/2, y:(a.y+b.y)/2}; }
  function bumpAt(px,py,r){ r=r||11; for (var i=joints.length-1;i>=0;i--){ var p=jointPos(joints[i]); if(p && (px-p.x)*(px-p.x)+(py-p.y)*(py-p.y)<r*r) return joints[i]; } return null; }
  function removeJoint(j){ var idx=joints.indexOf(j); if(idx>=0) joints.splice(idx,1); $('wire-hint').textContent='Joint opened — the two wires are separated.'; recompute(); draw(); commit(); sfxSwitch(); }
  function removeJointsAt(id,end,i){ var had=false; joints=joints.filter(function(jt){ var m=jointMatch(jt.a,id,end,i)||jointMatch(jt.b,id,end,i); if(m) had=true; return !m; }); return had; }

  /* ═══════════════════════════════════════════════════════════════
     SOLVER  (union-find connectivity + current summation)
     ═══════════════════════════════════════════════════════════════ */
  function tkey(cid, tid) { return 't' + cid + ':' + tid; }
  function ckey(cableId, end, i) { return 'w' + cableId + ':' + end + ':' + i; }

  /* the two node-keys an A-mode multimeter touches (both probes clipped on) — else null.
     Validates the clamped targets still exist so a deleted component can't leave a phantom bridge. */
  var _meterSeriesKeys = null;   // recorded by buildFind when the ammeter is spliced in series
  function meterProbeKeys(){
    if (!meter || meter.mode!=='A' || !meter.red.att || !meter.black.att) return null;
    var ra=meter.red.att, ba=meter.black.att;
    if (ra.t==='term' ? !findComp(ra.id) : !findCable(ra.id)) return null;
    if (ba.t==='term' ? !findComp(ba.id) : !findCable(ba.id)) return null;
    var ka = ra.t==='term' ? tkey(ra.id,ra.tid) : ckey(ra.id,ra.end,ra.i);
    var kb = ba.t==='term' ? tkey(ba.id,ba.tid) : ckey(ba.id,ba.end,ba.i);
    return (ka===kb) ? null : [ka,kb];
  }

  /* a power cord's Line core is open once its plug fuse has blown */
  function cordCoreOpen(cb,k){ return !!(cb.plug && cb.plugFuseBlown && cb.cores[k].role==='L'); }

  /* Build the union-find over the whole board.
     excl (optional): {dev:compId} leaves that FCU/MCB's Line pole open, {cord:cableId} leaves that
     cord's Line core open — used to probe which protective device isolates a short / earth fault. */
  function buildFind(excl, recordMeter){
    var parent = {};
    function find(x){ if(parent[x]===undefined) parent[x]=x; var r=x; while(parent[r]!==r) r=parent[r]; while(parent[x]!==r){ var n=parent[x]; parent[x]=r; x=n; } return r; }
    function uni(a,b){ var ra=find(a), rb=find(b); if(ra!==rb) parent[ra]=rb; }
    // register all terminals
    for (var i=0;i<comps.length;i++){ var c=comps[i]; var ts=termList(c); for (var j=0;j<ts.length;j++) find(tkey(c.id,ts[j].id)); }
    // each cable conductor is a wire between its own two endpoints; landings tie an endpoint to a terminal
    for (var ci=0; ci<cables.length; ci++){ var cb=cables[ci];
      for (var k=0;k<cb.cores.length;k++){ var la=cb.landA[k], lb=cb.landB[k];
        var ka=ckey(cb.id,'A',k), kb=ckey(cb.id,'B',k);
        if (!cordCoreOpen(cb,k) && !(excl && excl.cord===cb.id && cb.cores[k].role==='L')) uni(ka,kb);
        if (la) uni(ka, tkey(la.compId,la.tid));
        if (lb) uni(kb, tkey(lb.compId,lb.tid)); } }
    // wire-to-wire joints (splices)
    for (var jn=0; jn<joints.length; jn++){ var jt=joints[jn]; uni(ckey(jt.a.id,jt.a.end,jt.a.i), ckey(jt.b.id,jt.b.end,jt.b.i)); }
    // component internal edges
    for (i=0;i<comps.length;i++){ c=comps[i];
      var lOpen = !!(excl && excl.dev===c.id);
      if (c.type==='sw1' && c.on) uni(tkey(c.id,'COM'),tkey(c.id,'L1'));
      else if (c.type==='bell'){ if(c.on) uni(tkey(c.id,'COM'),tkey(c.id,'L1')); }   // momentary push — closed only while held
      else if (c.type==='changeover'){ if(c.pos===1){ uni(tkey(c.id,'Lm'),tkey(c.id,'Lo')); uni(tkey(c.id,'Nm'),tkey(c.id,'No')); } else if(c.pos===2){ uni(tkey(c.id,'Lg'),tkey(c.id,'Lo')); uni(tkey(c.id,'Ng'),tkey(c.id,'No')); } }
      else if (c.type==='dimmer'){ if(!lOpen) uni(tkey(c.id,'Li'),tkey(c.id,'Lo')); uni(tkey(c.id,'Ni'),tkey(c.id,'No')); }   // series rheostat on the Line; N straight through
      else if (c.type==='sw2') uni(tkey(c.id,'COM'), tkey(c.id, c.pos===2?'L2':'L1'));
      else if (c.type==='swi'){ if(c.pos===2){ uni(tkey(c.id,'L1'),tkey(c.id,'L4')); uni(tkey(c.id,'L2'),tkey(c.id,'L3')); } else { uni(tkey(c.id,'L1'),tkey(c.id,'L3')); uni(tkey(c.id,'L2'),tkey(c.id,'L4')); } }
      else if (c.type==='dpsw'){ if(c.on && !lOpen){ uni(tkey(c.id,'Li'),tkey(c.id,'Lo')); uni(tkey(c.id,'Ni'),tkey(c.id,'No')); } }
      else if (c.gangs){ for (var g=0;g<c.gangs.length;g++){ if(c.gangs[g]) uni(tkey(c.id,'COM'), tkey(c.id,'L'+(g+1))); } }
      else if (c.type==='fcu'){ if(!c.fuseBlown && !lOpen) uni(tkey(c.id,'Li'),tkey(c.id,'Lo')); uni(tkey(c.id,'Ni'),tkey(c.id,'No')); uni(tkey(c.id,'Ei'),tkey(c.id,'Eo')); }
      else if (c.type==='mcb'){ if(c.on && !c.tripped && !lOpen) uni(tkey(c.id,'Li'),tkey(c.id,'Lo')); uni(tkey(c.id,'Ni'),tkey(c.id,'No')); }
      else if (c.type==='connector'){ var cts=termList(c); var head={}; for (var q=0;q<cts.length;q++){ var rl=cts[q].rail||0; if(head[rl]===undefined) head[rl]=cts[q].id; else uni(tkey(c.id,head[rl]), tkey(c.id,cts[q].id)); } }
      else if (isSocket(c)){ // switched socket: each outlet's rocker breaks its Line; N & E pass through. Plug lands on the internal Lo/No/Eo[k] nodes.
        var so=socketOutlets(c); for (var oi=0;oi<so.length;oi++){ var sf=so[oi].sfx;
          if (so[oi].live && !(c.type==='socketf' && lOpen)) uni(tkey(c.id,'L'),tkey(c.id,'Lo'+sf)); uni(tkey(c.id,'N'),tkey(c.id,'No'+sf)); uni(tkey(c.id,'E'),tkey(c.id,'Eo'+sf)); } }
      else if (c.type==='pir'){ if (c.motion) uni(tkey(c.id,'L'),tkey(c.id,'Lo')); }   // motion detected → switches the load Line
      else if (c.type==='photo'){ if (c.dark) uni(tkey(c.id,'L'),tkey(c.id,'Lo')); }    // dusk-to-dawn: conducts when dark
      else if (c.type==='timer'){ if (c.on) uni(tkey(c.id,'L'),tkey(c.id,'Lo')); }      // staircase timer output
      else if (c.type==='isolator'){ if (c.on && !lOpen){ uni(tkey(c.id,'Li'),tkey(c.id,'Lo')); uni(tkey(c.id,'Ni'),tkey(c.id,'No')); } }   // double-pole isolator
      else if (c.type==='selector'){ uni(tkey(c.id,'COM'), tkey(c.id,'O'+(c.pos||1))); }   // routes COM to the selected output
    }
    // In-line ammeter: a DMM set to A is a ~0 Ω link. Its two probes bridge whatever they touch.
    // If they sit on two DIFFERENT nets the meter conducts and carries the current between them —
    // completing an open series path (a real in-line reading) OR, if those nets are a live pair
    // (Line↔Neutral, or across a powered load), shorting them exactly as a real ammeter clipped
    // across live points would. If the probes are already on the same net the link does nothing.
    var mk = meterProbeKeys();
    if (mk){
      var series = find(mk[0])!==find(mk[1]);
      if (series) uni(mk[0],mk[1]);
      if (recordMeter) _meterSeriesKeys = series ? [mk[0],mk[1]] : null;
    } else if (recordMeter) _meterSeriesKeys = null;
    return find;
  }

  /* Selectivity probe: the in-line protective device nearest the fault is the one whose opening
     clears it. Among all clearing candidates the smallest rating operates (discrimination). */
  function findIsolator(supply, kind){
    var goalTid = (kind==='LN') ? 'N' : 'E';
    function cleared(excl){ var f=buildFind(excl); return f(tkey(supply.id,'L')) !== f(tkey(supply.id,goalTid)); }
    var best=null;
    for (var i=0;i<comps.length;i++){ var c=comps[i];
      if (c.type==='mcb' && c.on && !c.tripped){ if (cleared({dev:c.id}) && (!best||c.mcb<best.rating)) best={kind:'mcb', id:c.id, rating:c.mcb}; }
      else if (c.type==='fcu' && !c.fuseBlown){ if (cleared({dev:c.id}) && (!best||c.fuse<best.rating)) best={kind:'fcu', id:c.id, rating:c.fuse}; }
      else if (c.type==='socketf' && !c.fuseBlown){ if (cleared({dev:c.id}) && (!best||c.fuse<best.rating)) best={kind:'socketf', id:c.id, rating:c.fuse}; }
    }
    for (var ci=0;ci<cables.length;ci++){ var cb=cables[ci];
      if (cb.plug && cb.plugFuse && !cb.plugFuseBlown){ if (cleared({cord:cb.id}) && (!best||cb.plugFuse<best.rating)) best={kind:'cord', id:cb.id, rating:cb.plugFuse}; }
    }
    return best;
  }
  function isolatorName(iso){
    return iso.kind==='mcb' ? 'the '+iso.rating+' A section MCB'
         : iso.kind==='fcu' ? 'the '+iso.rating+' A spur fuse'
         : iso.kind==='socketf' ? 'the '+iso.rating+' A socket fuse'
         : 'the '+iso.rating+' A plug fuse';
  }

  function computeCircuit() {
    var res = { energized: {}, reversed: {}, loadCurr: {}, total: 0, liveCount: 0, faults: [],
                cableCurr: {}, roots: {}, short: false, earthFault: false, neFault: false, isolator: null, tripped: tripped };
    var i, j, k, ci, c, cb, la, lb;
    var find = buildFind(null, true);
    var supply=null;
    for (i=0;i<comps.length;i++){ if (comps[i].type==='supply') supply=comps[i]; }
    if (!supply) { res.noSupply = true; return res; }

    var rL=find(tkey(supply.id,'L')), rN=find(tkey(supply.id,'N')), rE=find(tkey(supply.id,'E'));
    res.roots={L:rL,N:rN,E:rE}; res.supplyId=supply.id; res.supplyMcb=supply.mcb; res.rcd=supply.rcd;
    res._same=function(a,b){ return find(a)===find(b); };   // connectivity query for Test mode
    var live = powered && supply.on && !tripped;

    // ── power sources ── the consumer unit (when live) plus every running generator.
    // A load energises from ANY one source; the changeover keeps mains & generator on separate nets.
    var sources=[];
    if (live) sources.push({ id:supply.id, main:true, v:volts, Lk:tkey(supply.id,'L'), Nk:tkey(supply.id,'N'), L:rL, N:rN, E:rE, shorted:(rL===rN), mcb:supply.mcb });
    for (var gsi=0; gsi<comps.length; gsi++){ var gsc=comps[gsi]; if(gsc.type==='generator' && gsc.running){
      var gLk=tkey(gsc.id,'L'), gNk=tkey(gsc.id,'N'), gLr=find(gLk), gNr=find(gNk);
      sources.push({ id:gsc.id, main:false, v:volts, Lk:gLk, Nk:gNk, L:gLr, N:gNr, E:find(tkey(gsc.id,'E')), shorted:(gLr===gNr), mcb:99 }); } }
    res.sources=sources;
    function sourceFor(lk, nk){ var lr=find(lk), nr=find(nk); for(var s=0;s<sources.length;s++){ var S=sources[s]; if(S.shorted) continue; if(lr===S.L&&nr===S.N) return {src:S,rev:false}; if(lr===S.N&&nr===S.L) return {src:S,rev:true}; } return null; }
    function lineLiveAt(lk){ var lr=find(lk); for(var s=0;s<sources.length;s++){ if(!sources[s].shorted && lr===sources[s].L) return true; } return false; }

    // switched-socket neon: lit when the socket is switched on and its Line is live (from mains OR a running generator)
    res.socketLive={}; res.outletLive={};
    for (var si=0; si<comps.length; si++){ var sk0=comps[si]; if(isSocket(sk0)){
      var Llive = lineLiveAt(tkey(sk0.id,'L')), so0=socketOutlets(sk0), arr=[];
      for (var oq=0;oq<so0.length;oq++) arr.push(!!(Llive && so0[oq].live));
      res.outletLive[sk0.id]=arr; res.socketLive[sk0.id]= arr.indexOf(true)>=0; } }

    // emergency lights: a non-maintained fitting runs its internal battery lamp whenever its Line loses power
    res.emergency={};
    for (var em0=0; em0<comps.length; em0++){ var ec=comps[em0]; if(ec.type!=='emergency') continue;
      var mainsHealthy = lineLiveAt(tkey(ec.id,'L'));   // any live Line (mains or generator) keeps it charged; loss fires the battery lamp
      res.emergency[ec.id]=!mainsHealthy; }

    // smoke detectors — battery-backed alarm on smoke; a green LED shows mains health
    res.smokeAlarm={}; res.smokePower={};
    for (var sm0=0; sm0<comps.length; sm0++){ var smc=comps[sm0]; if(smc.type!=='smoke') continue;
      res.smokeAlarm[smc.id]=!!smc.smoke; res.smokePower[smc.id]=lineLiveAt(tkey(smc.id,'L')); }

    // rotary dimmers in series with a load — sum the rheostat resistance on that load's Line path (probe by opening each dimmer's pole)
    var dimmers=comps.filter(function(x){ return x.type==='dimmer'; });
    function seriesDimOhms(ld, srcLk){ var R2=0;
      for (var di=0; di<dimmers.length; di++){ var dc=dimmers[di]; var f2=buildFind({dev:dc.id});
        if (f2(tkey(ld.id,'L'))!==f2(srcLk)) R2+=dimmerOhms(dc); }   // opening it disconnects the load from its source → it's in series
      return R2;
    }

    // short circuit / earth fault / neutral-earth fault detection (topological, even before energising math)
    if (rL===rN) res.short = true;
    if (rL===rE) res.earthFault = true;
    if (rN===rE && rL!==rN) res.neFault = true;   // N–E only counts separately when L isn't already involved
    // ammeter clipped across a live pair (L↔N, L↔E, N↔E) — a ~0 Ω meter here is a dead short, not a reading
    if (_meterSeriesKeys){ var mr=find(_meterSeriesKeys[0]);
      for (var ms=0; ms<sources.length; ms++){ var MS=sources[ms];
        if ((mr===MS.L && (mr===MS.N || mr===MS.E)) || (mr===MS.N && mr===MS.E)){ res._meterShort=true; break; } } }
    // which protective device clears an L-level fault (RCD-less earth faults behave like bolted shorts)
    if (live && (res.short || (res.earthFault && !supply.rcd))) res.isolator = findIsolator(supply, res.short?'LN':'LE');

    // energised loads & total current — a load also runs with L and N swapped (AC doesn't care), but that is a wiring fault.
    // Each load draws from whichever source (mains OR a running generator) its L & N reach.
    var loads = comps.filter(function(x){ return x.load; });
    var total=0, mainsTotal=0, liveCount=0; res.dimFactor={}; res.loadSource={};
    for (i=0;i<loads.length;i++){ var ld=loads[i]; var d=LOADS[ld.type];
      var sm = sourceFor(tkey(ld.id,'L'), tkey(ld.id,'N'));
      var reversed = !!(sm && sm.rev);
      var en = ld.on && !!sm;
      res.energized[ld.id]=en; res.reversed[ld.id]=!!(en&&reversed); res.loadSource[ld.id]= en? sm.src : null;
      if (en){ var S=sm.src;
        var cur;
        var Rdim = !reversed ? seriesDimOhms(ld, S.Lk) : 0;   // a dimmer in series with the Line reduces the load voltage
        if (Rdim>0.5 && ld.watt>0){
          var Rload = volts*volts/ld.watt;           // load resistance at its rated power
          cur = volts/(Rdim+Rload);                  // series divider: same current through dimmer + load
          res.dimFactor[ld.id] = (cur*cur*Rload)/ld.watt;   // actual power ÷ rated (brightness / speed factor)
        } else {
          cur = ld.watt/volts;
        }
        res.loadCurr[ld.id]=cur; total+=cur; if(S.main) mainsTotal+=cur; liveCount++;
        if (reversed) res.faults.push({lvl:'danger',t:'Reversed polarity: '+d.name+' has Line and Neutral swapped — it still runs, but its switch and fuse now sit in the Neutral, so internal parts stay live even when switched off.'});
        // earthing check (against the feeding source's earth)
        if (d.classI){ var er=find(tkey(ld.id,'E')); if (er!==S.E) res.faults.push({lvl:'danger',t:'Missing earth: '+d.name+' has a metal body but its earth is not connected — a live fault would make it dangerous to touch.'}); }
      }
    }
    res.total=total; res.mainsTotal=mainsTotal; res.liveCount=liveCount;

    // ── current distribution ──────────────────────────────────────
    // Zero-length connections (landings, joints, switch poles, connector rails) are contracted
    // into supernodes; conductors and protective-device poles remain as unit resistances.
    // Each load's current is then solved on that resistive network (Laplacian, exact Gaussian
    // elimination) and superposed — so parallel routes (ring finals) divide current like a real
    // circuit: the leg with more cable segments carries proportionally less.
    var cparent={};
    function cfind(x){ if(cparent[x]===undefined) cparent[x]=x; var r=x; while(cparent[r]!==r) r=cparent[r]; while(cparent[x]!==r){ var n=cparent[x]; cparent[x]=r; x=n; } return r; }
    function cuni(a,b){ var ra=cfind(a), rb=cfind(b); if(ra!==rb) cparent[ra]=rb; }
    var E=[];   // resistive edges: {a,b,cb,dev,iL,iN}
    function rEdge(a,b,cbRef,devRef){ E.push({a:a,b:b,cb:cbRef,dev:devRef,iL:0,iN:0}); }
    for (ci=0; ci<cables.length; ci++){ cb=cables[ci]; cb._cL=0; cb._cN=0; cb._curr=0;
      for (k=0;k<cb.cores.length;k++){ la=cb.landA[k]; lb=cb.landB[k];
        var ka=ckey(cb.id,'A',k), kb=ckey(cb.id,'B',k);
        if (!cordCoreOpen(cb,k)) rEdge(ka,kb,cb,null);         // the conductor itself carries current
        if (la) cuni(ka, tkey(la.compId,la.tid));              // landing (zero-length)
        if (lb) cuni(kb, tkey(lb.compId,lb.tid));
      } }
    for (var jn2=0; jn2<joints.length; jn2++){ var jt2=joints[jn2]; cuni(ckey(jt2.a.id,jt2.a.end,jt2.a.i), ckey(jt2.b.id,jt2.b.end,jt2.b.i)); }
    for (i=0;i<comps.length;i++){ c=comps[i];
      if (c.type==='sw1'&&c.on) cuni(tkey(c.id,'COM'),tkey(c.id,'L1'));
      else if (c.type==='bell'){ if(c.on) cuni(tkey(c.id,'COM'),tkey(c.id,'L1')); }
      else if (c.type==='changeover'){ if(c.pos===1){ cuni(tkey(c.id,'Lm'),tkey(c.id,'Lo')); cuni(tkey(c.id,'Nm'),tkey(c.id,'No')); } else if(c.pos===2){ cuni(tkey(c.id,'Lg'),tkey(c.id,'Lo')); cuni(tkey(c.id,'Ng'),tkey(c.id,'No')); } }
      else if (c.type==='dimmer'){ c._thru=0; rEdge(tkey(c.id,'Li'), tkey(c.id,'Lo'),null,c); cuni(tkey(c.id,'Ni'), tkey(c.id,'No')); }   // measured pole → current through the rheostat
      else if (c.type==='sw2') cuni(tkey(c.id,'COM'), tkey(c.id,c.pos===2?'L2':'L1'));
      else if (c.type==='swi'){ if(c.pos===2){ cuni(tkey(c.id,'L1'),tkey(c.id,'L4')); cuni(tkey(c.id,'L2'),tkey(c.id,'L3')); } else { cuni(tkey(c.id,'L1'),tkey(c.id,'L3')); cuni(tkey(c.id,'L2'),tkey(c.id,'L4')); } }
      else if (c.type==='dpsw'){ if(c.on){ cuni(tkey(c.id,'Li'),tkey(c.id,'Lo')); cuni(tkey(c.id,'Ni'),tkey(c.id,'No')); } }
      else if (c.gangs){ for (var gg=0;gg<c.gangs.length;gg++){ if(c.gangs[gg]) cuni(tkey(c.id,'COM'), tkey(c.id,'L'+(gg+1))); } }
      else if (c.type==='fcu'){ c._thru=0; if(!c.fuseBlown) rEdge(tkey(c.id,'Li'), tkey(c.id,'Lo'),null,c); }   // fuse sits in the Line pole
      else if (c.type==='mcb'){ c._thru=0; if(c.on&&!c.tripped) rEdge(tkey(c.id,'Li'), tkey(c.id,'Lo'),null,c); cuni(tkey(c.id,'Ni'), tkey(c.id,'No')); }
      else if (c.type==='connector'){ var ects=termList(c); var ehead={}; for (var eq=0;eq<ects.length;eq++){ var erl=ects[eq].rail||0; if(ehead[erl]===undefined) ehead[erl]=ects[eq].id; else cuni(tkey(c.id,ehead[erl]), tkey(c.id,ects[eq].id)); } }
      else if (isSocket(c)){ c._thru=0; var so2=socketOutlets(c); for (var ok2=0;ok2<so2.length;ok2++){ var sf2=so2[ok2].sfx;
        if (so2[ok2].live) rEdge(tkey(c.id,'L'),tkey(c.id,'Lo'+sf2),null,c); cuni(tkey(c.id,'N'),tkey(c.id,'No'+sf2)); cuni(tkey(c.id,'E'),tkey(c.id,'Eo'+sf2)); } }   // measured pole: outlet current vs socket rating
      else if (c.type==='pir'){ if (c.motion) cuni(tkey(c.id,'L'),tkey(c.id,'Lo')); }
      else if (c.type==='photo'){ if (c.dark) cuni(tkey(c.id,'L'),tkey(c.id,'Lo')); }
      else if (c.type==='timer'){ if (c.on) cuni(tkey(c.id,'L'),tkey(c.id,'Lo')); }
      else if (c.type==='isolator'){ if (c.on){ cuni(tkey(c.id,'Li'),tkey(c.id,'Lo')); cuni(tkey(c.id,'Ni'),tkey(c.id,'No')); } }
      else if (c.type==='selector'){ cuni(tkey(c.id,'COM'), tkey(c.id,'O'+(c.pos||1))); }
    }
    // in-line ammeter: a measurable zero-length edge between the two probes (current read from it)
    var meterEdge=null;
    if (_meterSeriesKeys){ var mek=_meterSeriesKeys;
      if (cfind(mek[0])!==cfind(mek[1])){ meterEdge={a:mek[0],b:mek[1],cb:null,dev:null,meter:true,iL:0,iN:0}; E.push(meterEdge); } }
    // supernode adjacency over the resistive edges
    var adjN={};
    for (var ei0=0; ei0<E.length; ei0++){ var ed0=E[ei0]; var na=cfind(ed0.a), nb0=cfind(ed0.b);
      if (na===nb0) continue;
      (adjN[na]=adjN[na]||[]).push({o:nb0,e:ed0}); (adjN[nb0]=adjN[nb0]||[]).push({o:na,e:ed0}); }
    /* inject `amps` at `start`, extract at `goal`; accumulate signed edge currents into fld */
    function solveNet(start, goal, amps, fld){
      var s=cfind(start), g=cfind(goal); if(s===g) return;
      var idx={}, nodes=[s]; idx[s]=0; var stack=[s];
      while(stack.length){ var u=stack.pop(); var nb=adjN[u]||[];
        for (var e2=0;e2<nb.length;e2++){ var o=nb[e2].o; if(idx[o]===undefined){ idx[o]=nodes.length; nodes.push(o); stack.push(o); } } }
      if (idx[g]===undefined) return;
      var n=nodes.length, gi=idx[g], m=n-1; if(!m) return;
      function ri(ii){ return ii<gi ? ii : ii-1; }               // matrix row for node (ground dropped)
      var A=[], bvec=new Float64Array(m);
      for (var r2=0;r2<m;r2++) A.push(new Float64Array(m));
      bvec[ri(idx[s])]=amps;
      for (var ei=0;ei<E.length;ei++){ var ed=E[ei]; var ia=idx[cfind(ed.a)], ib=idx[cfind(ed.b)];
        if (ia===undefined||ib===undefined||ia===ib) continue;
        if (ia!==gi && ib!==gi){ A[ri(ia)][ri(ia)]+=1; A[ri(ib)][ri(ib)]+=1; A[ri(ia)][ri(ib)]-=1; A[ri(ib)][ri(ia)]-=1; }
        else { var kk=(ia===gi)?ib:ia; A[ri(kk)][ri(kk)]+=1; }
      }
      for (var col=0; col<m; col++){                             // Gaussian elimination, partial pivot
        var piv=col; for (var r3=col+1;r3<m;r3++) if(Math.abs(A[r3][col])>Math.abs(A[piv][col])) piv=r3;
        if (Math.abs(A[piv][col])<1e-12) continue;
        var tr=A[col]; A[col]=A[piv]; A[piv]=tr; var tb=bvec[col]; bvec[col]=bvec[piv]; bvec[piv]=tb;
        for (r3=col+1;r3<m;r3++){ var f=A[r3][col]/A[col][col]; if(!f) continue; bvec[r3]-=f*bvec[col]; for (var c3=col;c3<m;c3++) A[r3][c3]-=f*A[col][c3]; }
      }
      var vv=new Float64Array(m);
      for (var r4=m-1;r4>=0;r4--){ if(Math.abs(A[r4][r4])<1e-12){ vv[r4]=0; continue; }
        var acc=bvec[r4]; for (var c4=r4+1;c4<m;c4++) acc-=A[r4][c4]*vv[c4]; vv[r4]=acc/A[r4][r4]; }
      for (ei=0;ei<E.length;ei++){ ed=E[ei]; var ja=idx[cfind(ed.a)], jb=idx[cfind(ed.b)];
        if (ja===undefined||jb===undefined||ja===jb) continue;
        var va=(ja===gi)?0:vv[ri(ja)], vb=(jb===gi)?0:vv[ri(jb)];
        ed[fld] += va-vb;                                        // unit resistance: I = ΔV
      }
    }
    // each energised load injects on its Line path and returns on its Neutral path to ITS source (superposition)
    for (i=0;i<loads.length;i++){ var ld2=loads[i]; if(!res.energized[ld2.id]) continue;
      var rev=res.reversed[ld2.id], amps=res.loadCurr[ld2.id], S2=res.loadSource[ld2.id]; if(!S2) continue;
      solveNet(tkey(ld2.id, rev?'N':'L'), S2.Lk, amps, 'iL');
      solveNet(tkey(ld2.id, rev?'L':'N'), S2.Nk, amps, 'iN');
    }
    for (var ei2=0; ei2<E.length; ei2++){ var ed2=E[ei2];
      if (ed2.cb){ ed2.cb._cL += Math.abs(ed2.iL); ed2.cb._cN += Math.abs(ed2.iN); }
      if (ed2.dev) ed2.dev._thru += Math.abs(ed2.iL);            // every Line amp passes the device's fuse/pole
    }
    if (meterEdge) res._meterCurr = Math.max(Math.abs(meterEdge.iL), Math.abs(meterEdge.iN));   // through the in-line ammeter

    /* smallest protective device on the Line path between this cable and the supply —
       walks the supernode graph, so devices behind connector blocks etc. count too */
    function deviceProtecting(cb2){
      // find which source this cable's Line reaches (mains or a generator)
      var src=null, start=null;
      for (var k2=0;k2<cb2.cores.length;k2++){ var kk=find(ckey(cb2.id,'A',k2)); for(var sx=0;sx<sources.length;sx++){ if(!sources[sx].shorted && kk===sources[sx].L){ src=sources[sx]; start=ckey(cb2.id,'A',k2); break; } } if(src) break; }
      var dev = src ? src.mcb : supply.mcb;
      if (cb2.plug && cb2.plugFuse && !cb2.plugFuseBlown) dev = Math.min(dev, cb2.plugFuse);
      if (!start || !src) return dev;
      var s=cfind(start), g=cfind(src.Lk);
      if (s!==g){
        var prev={}, seen={}; seen[s]=1; var q=[s], qi=0;
        while(qi<q.length){ var u=q[qi++]; if(u===g) break; var nb=adjN[u]||[];
          for (var e3=0;e3<nb.length;e3++){ var h=nb[e3]; if(!seen[h.o]){ seen[h.o]=1; prev[h.o]={u:u,e:h.e}; q.push(h.o); } } }
        if (!seen[g]) return dev;
        var node=g;
        while(node!==s){ var p=prev[node]; if(!p) break; var e4=p.e;
          if (e4.dev && (e4.dev.type==='fcu' || e4.dev.type==='socketf') && !e4.dev.fuseBlown) dev=Math.min(dev, e4.dev.fuse);
          else if (e4.dev && e4.dev.type==='mcb') dev=Math.min(dev, e4.dev.mcb);   // plain sockets are measured poles, not protective devices
          if (e4.cb && e4.cb!==cb2 && e4.cb.plug && e4.cb.plugFuse && !e4.cb.plugFuseBlown) dev=Math.min(dev, e4.cb.plugFuse);
          node=p.u; }
      }
      return dev;
    }

    // cable overheat / fire — a conductor pair carries the same current out and back, so the
    // cable's loading is the worst of its Line and Neutral cores (not their sum)
    for (ci=0; ci<cables.length; ci++){ cb=cables[ci]; var cur=Math.max(cb._cL||0, cb._cN||0); cb._curr=cur; res.cableCurr[cb.id]=cur;
      cb._vdrop = cableVdrop(cb);
      cb.over = cur>cb.ratingA+0.01; cb.fire=false; cb.heat=clamp((cur-cb.ratingA*0.7)/(cb.ratingA*0.5),0,1.4);
      if (cb.over){
        var dev = deviceProtecting(cb); // A rating of nearest upstream device
        // fire if the protective device would NOT trip (device rating above the load current on the cable)
        if (cur <= dev + 0.01) cb.fire = true;
      }
    }
    // voltage drop: sum the loop drop along each energised load's Line run (origin → appliance)
    res.loadVdrop={}; res.loadVdropPct={};
    function vdropToLoad(ld){
      var S=res.loadSource[ld.id]; if(!S) return 0;
      var s=cfind(tkey(ld.id, res.reversed[ld.id]?'N':'L')), g=cfind(S.Lk);
      if (s===g) return 0;
      var prev={}, seen={}; seen[s]=1; var q=[s], qi=0;
      while(qi<q.length){ var u=q[qi++]; if(u===g) break; var nb=adjN[u]||[];
        for (var e5=0;e5<nb.length;e5++){ var h=nb[e5]; if(!seen[h.o]){ seen[h.o]=1; prev[h.o]={u:u,e:h.e}; q.push(h.o); } } }
      if (!seen[g]) return 0;
      var drop=0, amps=res.loadCurr[ld.id]||0, node=g, guard=0;
      while(node!==s && guard++<400){ var p=prev[node]; if(!p) break; if(p.e.cb) drop += cableMvam(p.e.cb)*amps*cableLengthM(p.e.cb)/1000; node=p.u; }
      return drop;
    }
    var worstVd=null;
    for (i=0;i<loads.length;i++){ var ldv=loads[i]; if(!res.energized[ldv.id]) continue;
      var vd=vdropToLoad(ldv), pct=vd/volts*100; res.loadVdrop[ldv.id]=vd; res.loadVdropPct[ldv.id]=pct;
      if (!worstVd || pct>worstVd.pct) worstVd={id:ldv.id, pct:pct, vd:vd, name:LOADS[ldv.type].name, lighting:(ldv.type==='led'||ldv.type==='lamp')};
    }
    if (live && worstVd){ var lim = worstVd.lighting?3:5;
      if (worstVd.pct > lim+0.05) res.faults.push({lvl:'warn',t:'Volt drop too high: '+round(worstVd.vd,1)+' V ('+round(worstVd.pct,1)+' %) to the '+worstVd.name+' exceeds the '+lim+' % limit — use a larger cable or a shorter run.'});
    }
    // colour-mismatch (conductor role vs the net it's in)
    for (ci=0; ci<cables.length; ci++){ cb=cables[ci];
      for (k=0;k<cb.cores.length;k++){ la=cb.landA[k]; lb=cb.landB[k]; if(!(la&&lb)) continue;
        var r0=find(tkey(la.compId,la.tid)); var role=cb.cores[k].role;
        if (r0===rL && role==='N') { res.faults.push({lvl:'warn',t:'Colour mismatch: a blue (Neutral) conductor is carrying Line — Line must be brown.'}); break; }
        if (r0===rN && role==='L' && cb.cores[k].col===COL.L) { res.faults.push({lvl:'warn',t:'Colour mismatch: a brown (Line) conductor is used on Neutral.'}); break; }
        if ((r0===rL||r0===rN) && role==='E') { res.faults.push({lvl:'danger',t:'Earth conductor (green-yellow) is connected to a live terminal!'}); break; }
      }
    }
    // switched-neutral heuristic
    for (i=0;i<comps.length;i++){ c=comps[i]; if(c.type!=='sw1'&&c.type!=='sw2'&&!c.gangs) continue;
      var cr=find(tkey(c.id,'COM')); if (cr===rN){ res.faults.push({lvl:'warn',t:'Switched neutral: a switch is breaking the Neutral instead of the Line. Always switch the Line.'}); break; } }
    // wrong plug fuse (FCU fuse bigger than its outgoing flex)
    for (i=0;i<comps.length;i++){ c=comps[i]; if(c.type!=='fcu') continue;
      for (ci=0;ci<cables.length;ci++){ cb=cables[ci]; for(k=0;k<cb.cores.length;k++){ la=cb.landA[k]; lb=cb.landB[k];
        if(((la&&la.compId===c.id&&la.tid==='Lo')||(lb&&lb.compId===c.id&&lb.tid==='Lo')) && c.fuse>cb.ratingA){
          res.faults.push({lvl:'warn',t:'Wrong fuse: the '+c.fuse+' A fuse is larger than the '+cb.ratingA+' A flex it protects.'}); } } } }

    // faults from shorts / earth faults / overload
    if (res.short && live) res.faults.unshift({lvl:'danger',t:'Short circuit: Line and Neutral are directly connected — '+(res.isolator?isolatorName(res.isolator)+' operates on the fault current.':'the main breaker trips instantly.')});
    if (res.earthFault && live){
      if (supply.rcd) res.faults.unshift({lvl:'danger',t:'Earth fault: Line is connected to Earth — the 30 mA RCD trips.'});
      else res.faults.unshift({lvl:'danger',t:'Earth fault with NO RCD: heavy fault current flows through the earth path and '+(res.isolator?isolatorName(res.isolator)+' operates':'the main breaker trips')+'. An RCD would disconnect at just 30 mA — far safer.'});
    }
    if (res.neFault && live){
      if (supply.rcd) res.faults.unshift({lvl:'danger',t:'Neutral–Earth fault: return current divides into the earth path — the 30 mA RCD trips as soon as a load draws current.'});
      else res.faults.push({lvl:'warn',t:'Neutral–Earth fault: Neutral is connected to Earth. Without an RCD this often goes unnoticed, but the earth conductor now carries return current — fix the wiring and fit an RCD.'});
    }
    if (live && mainsTotal > supply.mcb + 0.01) res.faults.unshift({lvl:'warn',t:'Overload: mains load '+round(mainsTotal,1)+' A exceeds the '+supply.mcb+' A breaker — it will trip on overload.'});
    // fused socket cartridge fuse
    for (i=0;i<comps.length;i++){ c=comps[i]; if(c.type!=='socketf') continue;
      if (c.fuseBlown) res.faults.push({lvl:'warn',t:'Socket fuse blown ('+c.fuse+' A) — clear the fault, then replace the fuse from the socket inspector.'}); }
    // plug fuses (BS 1363 — every 3-pin plug carries its own cartridge fuse)
    for (ci=0;ci<cables.length;ci++){ cb=cables[ci]; if(!cb.plug || !cb.plugFuse) continue;
      if (cb.plugFuseBlown) res.faults.push({lvl:'warn',t:'Plug fuse blown ('+cb.plugFuse+' A) — clear the fault, then replace the fuse from the cable inspector.'});
      else if (cb.plugFuse>cb.ratingA) res.faults.push({lvl:'warn',t:'Wrong plug fuse: a '+cb.plugFuse+' A fuse is larger than the '+cb.ratingA+' A flex it protects — fit '+(cb.ratingA>=13?13:(cb.ratingA>=5?5:3))+' A.'});
    }
    for (ci=0;ci<cables.length;ci++){ cb=cables[ci]; if(cb.fire) res.faults.push({lvl:'danger',t:'FIRE RISK: a '+cb.ratingA+' A cable is carrying '+round(cb._curr,1)+' A and nothing will trip to save it — undersized cable / oversized protection.'});
      else if (cb.over) res.faults.push({lvl:'warn',t:'Cable overloaded: '+round(cb._curr,1)+' A on a '+cb.ratingA+' A cable — it is overheating.'}); }
    // section MCBs
    for (i=0;i<comps.length;i++){ c=comps[i]; if(c.type!=='mcb') continue;
      if (c.tripped) res.faults.push({lvl:'danger',t:'Section MCB ('+c.mcb+' A) has tripped — clear the overload, then tap it to reset.'});
      else if (live && (c._thru||0) > c.mcb+0.01) res.faults.push({lvl:'warn',t:'Section MCB overload: '+round(c._thru,1)+' A through a '+c.mcb+' A breaker — it will trip.'});
    }
    // socket outlets carrying more than their rated current
    for (i=0;i<comps.length;i++){ c=comps[i]; if(!isSocket(c)) continue; var samp=c.amp||13;
      if (live && (c._thru||0) > samp+0.01) res.faults.push({lvl:'warn',t:'Socket overloaded: '+round(c._thru,1)+' A drawn through a '+samp+' A socket — its contacts overheat. Fit a higher-rated socket or put the load on its own circuit.'});
    }

    // ── Multimeter probes (ideal meter) ───────────────────────────
    // Volt drop from a node to a source rail along the conductor path (uses each cable's actual core current).
    function dropAlong(fromKey, toKey, side){
      var s=cfind(fromKey), g=cfind(toKey); if(s===g) return 0;
      var prev={}, seen={}; seen[s]=1; var q=[s], qi=0;
      while(qi<q.length){ var u=q[qi++]; if(u===g) break; var nb=adjN[u]||[];
        for (var e=0;e<nb.length;e++){ var h=nb[e]; if(!seen[h.o]){ seen[h.o]=1; prev[h.o]={u:u,e:h.e}; q.push(h.o); } } }
      if (!seen[g]) return null;
      var drop=0, node=g, guard=0, fld=(side==='N'?'_cN':'_cL');
      while(node!==s && guard++<600){ var p=prev[node]; if(!p) break; var pcb=p.e.cb; if(pcb) drop += cableMvam(pcb)*(Math.abs(pcb[fld])||0)*cableLengthM(pcb)/1000; node=p.u; }
      return drop;
    }
    // Potential of a node in volts (Neutral = 0 V reference). null = floating / not on any live source.
    res.potAt = function(nodeKey){ if(!nodeKey) return null; var r=find(nodeKey);
      for (var s=0;s<sources.length;s++){ var S=sources[s]; if(S.shorted) continue;
        if (r===S.L){ var d=dropAlong(nodeKey, S.Lk, 'L'); return { v: Math.max(0, S.v-(d||0)), net:'L' }; }
        if (r===S.N){ var d2=dropAlong(nodeKey, S.Nk, 'N'); return { v: (d2||0), net:'N' }; }
        if (r===S.E) return { v:0, net:'E' };
      }
      return null;
    };
    res.sameNet = function(a,b){ return !!(a&&b) && find(a)===find(b); };   // continuity (topological, power-independent)
    // Current through the series element (cable / device pole / load) the two probes straddle. null = no element between.
    res.currentBetween = function(ka, kb){ if(!ka||!kb) return null; var A=cfind(ka), B=cfind(kb); if(A===B) return 0;
      var sum=0, found=false;
      for (var e=0;e<E.length;e++){ var ed=E[e]; var ea=cfind(ed.a), eb=cfind(ed.b);
        if ((ea===A&&eb===B)||(ea===B&&eb===A)){ sum += Math.abs(ed.iL)+Math.abs(ed.iN); found=true; } }
      if (found) return sum;
      for (var li=0; li<loads.length; li++){ var ld=loads[li]; if(!res.energized[ld.id]) continue;
        var la=cfind(tkey(ld.id,'L')), ln=cfind(tkey(ld.id,'N'));
        if ((la===A&&ln===B)||(la===B&&ln===A)) return res.loadCurr[ld.id]; }
      return null;
    };

    return res;
  }

  /* ═══════════════════════════════════════════════════════════════
     CANVAS SETUP
     ═══════════════════════════════════════════════════════════════ */
  function resize() {
    if (!canvas) return;
    canvas.style.width = ''; canvas.style.height = '';   // collapse first so the card reports its true available width (breaks the self-inflation lock on narrow viewports)
    var cssW = Math.max(280, card.clientWidth - 16);
    DPR = window.devicePixelRatio || 1;
    VIEWW = cssW; VIEWH = Math.round(cssW * LH / LW);
    canvas.style.width = cssW + 'px'; canvas.style.height = VIEWH + 'px';
    canvas.width = Math.round(cssW * DPR); canvas.height = Math.round(VIEWH * DPR);
    ctx.setTransform(canvas.width / LW, 0, 0, canvas.height / LH, 0, 0);
    draw();
  }
  function toLogical(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * LW, y: (e.clientY - r.top) / r.height * LH };
  }

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, LW, LH);
    // board background
    var bg = ctx.createLinearGradient(0,0,0,LH);
    bg.addColorStop(0,'#12161f'); bg.addColorStop(1,'#0c0f16');
    ctx.fillStyle = bg; ctx.fillRect(0,0,LW,LH);
    // subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
    for (var gx=0; gx<=LW; gx+=30){ ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,LH); ctx.stroke(); }
    for (var gy=0; gy<=LH; gy+=30){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(LW,gy); ctx.stroke(); }

    // ensure cable geometry current
    for (var i=0;i<cables.length;i++) cableGeom(cables[i]);

    // 1) cable sheaths (fixed wiring; power cords are drawn on top later)
    for (i=0;i<cables.length;i++) if (!cables[i].plug) drawCableSheath(cables[i]);
    // 2) landed conductors (tip → terminal)
    for (i=0;i<cables.length;i++) if (!cables[i].plug) drawCableConductors(cables[i]);
    // 3) components
    for (i=0;i<comps.length;i++) drawComponent(comps[i]);
    // 4) terminals
    for (i=0;i<comps.length;i++) drawTerminals(comps[i]);
    // 4b) power cords ride ON TOP — the flex lies over the board and its plug seats over the socket face
    for (i=0;i<cables.length;i++){ if (cables[i].plug){ drawCableSheath(cables[i]); drawCableConductors(cables[i]); drawPlug(cables[i]); } }
    // 5) conductor handles
    for (i=0;i<cables.length;i++) drawCableHandles(cables[i]);
    // 5b) wire-to-wire joint insulator bumps
    drawJoints();
    // 6) wiring rubber-band
    if (drag && drag.type==='wire') {
      var h = { x: drag.px, y: drag.py };
      ctx.strokeStyle = drag.col; ctx.lineWidth = 5; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(drag.ox, drag.oy); ctx.lineTo(h.x, h.y); ctx.stroke();
    }
    // 7) selection outline / cable controls
    if (sel && sel.kind==='comp'){ outline(sel.ref); if (sel.ref.type==='connector' && !drag) drawCompRotHandle(sel.ref); }
    if (sel && sel.kind==='cable' && cables.indexOf(sel.ref)>=0) drawCableControls(sel.ref);
    // highlight a socket while a plug is dragged over it
    if (drag && drag.type==='plug' && hoverSocket) outline(hoverSocket);
    // 7b) "click to switch" bubble while hovering a rocker
    if (hoverRocker && !drag) drawRockerHint(hoverRocker);

    // empty hint
    if (!comps.length && !cables.length) {
      ctx.fillStyle = 'rgba(221,227,240,0.28)'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font = '600 20px "Segoe UI", sans-serif';
      ctx.fillText('Tap a component below to start wiring', LW/2, LH/2 - 12);
      ctx.font = '400 14px "Segoe UI", sans-serif';
      ctx.fillText('or pick a ready-made circuit from the Example menu above', LW/2, LH/2 + 14);
    }

    // 8) floating multimeter rides on top of everything
    if (meter) drawMeter();
  }

  function compResizeHandle(c){ return { x: c.x+ewid(c)+6, y: c.y+ehei(c)+6 }; }
  function outline(c){ ctx.save(); ctx.strokeStyle='#f5a623'; ctx.lineWidth=2; ctx.setLineDash([6,4]);
    ctx.strokeRect(c.x-6, c.y-6, ewid(c)+12, ehei(c)+12); ctx.restore();
    // resize grip (drag to size between minimum and maximum) at the bottom-right corner
    if (!c.load || true){ var h=compResizeHandle(c), hot=(hoverResize===c)||(drag&&drag.type==='resize'&&drag.c===c);
      ctx.save(); if(hot){ ctx.shadowColor='#f5a623'; ctx.shadowBlur=12; }
      ctx.beginPath(); ctx.arc(h.x,h.y, hot?9:7, 0, 7); ctx.fillStyle=hot?'#f5a623':'#1f2535'; ctx.fill();
      ctx.shadowBlur=0; ctx.lineWidth=1.8; ctx.strokeStyle='#f5a623'; ctx.stroke();
      // diagonal double-arrow (↘↖)
      var col=hot?'#1a1a2e':'#f5a623'; ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.moveTo(h.x-3.2,h.y-3.2); ctx.lineTo(h.x+3.2,h.y+3.2); ctx.stroke();
      [[3.2,3.2,-1,-1],[-3.2,-3.2,1,1]].forEach(function(a){ var tx=h.x+a[0],ty=h.y+a[1];
        ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx+a[2]*3.4, ty); ctx.lineTo(tx, ty+a[3]*3.4); ctx.closePath(); ctx.fill(); });
      ctx.restore(); }
  }

  /* amber disc with a circular-arrow glyph — the reusable "rotate 90°" handle (cable + connector) */
  function drawRotIcon(x,y){
    ctx.beginPath(); ctx.arc(x,y,9,0,7); ctx.fillStyle='#f5a623'; ctx.fill();
    ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(x,y,5,-1.1,3.7); ctx.stroke();
    ctx.fillStyle='#1a1a2e'; ctx.beginPath(); ctx.moveTo(x+5,y-3); ctx.lineTo(x+8.5,y-1.5); ctx.lineTo(x+3.5,y+1); ctx.closePath(); ctx.fill();
  }
  /* rotation handle for a selected box-shaped component (currently the connector block):
     a disc on a short stalk above the dashed box — flips below if it would leave the canvas */
  function compRotHandle(c){
    var by=c.y-6, bh=ehei(c)+12, fromX=c.x+ewid(c)/2, fromY=by, hy=by-20;
    if (hy<14){ fromY=by+bh; hy=by+bh+20; }
    return { x:clamp(fromX,14,LW-14), y:clamp(hy,14,LH-14), fromX:fromX, fromY:fromY };
  }
  function drawCompRotHandle(c){
    var h=compRotHandle(c); ctx.save();
    ctx.strokeStyle='#f5a623'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(h.fromX,h.fromY); ctx.lineTo(h.x,h.y); ctx.stroke();
    drawRotIcon(h.x,h.y); ctx.restore();
  }

  /* small tooltip bubble over a hovered rocker: tells the user a click operates the switch */
  function drawRockerHint(c){
    var txt=rockerHint(c);
    ctx.save();
    ctx.font='700 10px "Segoe UI", sans-serif';
    var tw=ctx.measureText(txt).width, bw=tw+16, bh=20;
    var bx=clamp(c.x+ewid(c)/2-bw/2, 4, LW-bw-4), by=c.y-bh-8; if (by<4) by=c.y+ehei(c)+8;
    ctx.fillStyle='rgba(18,22,32,0.92)'; ctx.strokeStyle='rgba(245,166,35,0.8)'; ctx.lineWidth=1;
    rr(bx,by,bw,bh,6); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#f5d68a'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, bx+bw/2, by+bh/2+0.5);
    ctx.restore();
  }

  function drawCableControls(cb){
    var c=cableControls(cb); ctx.save();
    var pluggedIn = !!(cb.plug && cb.pluggedInto!=null);   // a seated plug's position is locked to its socket — no rotate/extend-B while plugged in
    // dashed selection outline hugging the cable run (not a bounding box)
    var P=cb.path, n=P.length-1;
    var oA=outUnit(P[0],P[1]), oB=outUnit(P[n],P[n-1]);
    var Pex=P.map(function(q){ return {x:q.x, y:q.y}; });
    Pex[0].x+=oA.ux*10; Pex[0].y+=oA.uy*10; Pex[n].x+=oB.ux*10; Pex[n].y+=oB.uy*10;   // reach just past the stripped tips
    var dHalf=(cb.cores.length===1?6:(cb.flex?9:13))/2+8;   // match the drawn sheath width
    var Lft=offsetPts(Pex,dHalf), Rgt=offsetPts(Pex,-dHalf);
    ctx.strokeStyle='#f5a623'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]); ctx.lineJoin='round';
    ctx.beginPath(); ctx.moveTo(Lft[0].x,Lft[0].y);
    for (var oi=1;oi<Lft.length;oi++) ctx.lineTo(Lft[oi].x,Lft[oi].y);
    for (var oj=Rgt.length-1;oj>=0;oj--) ctx.lineTo(Rgt[oj].x,Rgt[oj].y);
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    // bend-point (waypoint) handles the user has placed — drag to reshape, right-click to remove
    var WP=cb.pts; for (var s=1;s<WP.length-1;s++){ var mx=WP[s].x, my=WP[s].y;
      ctx.beginPath(); ctx.arc(mx,my,6,0,7); ctx.fillStyle='#1f2535'; ctx.fill(); ctx.lineWidth=1.8; ctx.strokeStyle='#f5a623'; ctx.stroke();
      ctx.fillStyle='#f5a623'; ctx.beginPath(); ctx.arc(mx,my,2.4,0,7); ctx.fill(); }
    if (!pluggedIn){
      // stalk from the cable midpoint to the rotation handle
      ctx.strokeStyle='#f5a623'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(c.mid.x,c.mid.y); ctx.lineTo(c.rot.x,c.rot.y); ctx.stroke();
      // rotation handle (click = +90°)
      drawRotIcon(c.rot.x,c.rot.y);
    }
    // end anchors — 4-direction move grips (drag to extend or bend); react on hover
    drawMoveAnchor(c.extA.x, c.extA.y, hoverAnchor==='A');
    if (!pluggedIn) drawMoveAnchor(c.extB.x, c.extB.y, hoverAnchor==='B');   // the plug end is fixed to its socket while plugged in — drag the plug badge itself to unplug
    ctx.restore();
  }
  function drawMoveAnchor(x,y,hot){
    ctx.save();
    var R = hot?12:9;
    if (hot){ ctx.shadowColor='#f5a623'; ctx.shadowBlur=16; }
    ctx.beginPath(); ctx.arc(x,y,R,0,7); ctx.fillStyle = hot?'#f5a623':'#1f2535'; ctx.fill();
    ctx.shadowBlur=0; ctx.lineWidth=1.8; ctx.strokeStyle='#f5a623'; ctx.stroke();
    var col = hot?'#1a1a2e':'#f5a623'; ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=1.7;
    var a=R-2.5, hb=hot?3.2:2.6;   // arm length + arrowhead size
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(function(d){
      ctx.beginPath(); ctx.moveTo(x+d[0]*2.2, y+d[1]*2.2); ctx.lineTo(x+d[0]*a, y+d[1]*a); ctx.stroke();
      var hx=x+d[0]*a, hy=y+d[1]*a, px=-d[1], py=d[0];
      ctx.beginPath(); ctx.moveTo(hx,hy); ctx.lineTo(hx-d[0]*hb+px*hb, hy-d[1]*hb+py*hb); ctx.lineTo(hx-d[0]*hb-px*hb, hy-d[1]*hb-py*hb); ctx.closePath(); ctx.fill();
    });
    ctx.restore();
  }

  /* ── moulded 3-pin (BS 1363) plug at cord end B — fixed orientation, sized to the socket ── */
  function plugBody(x,y,w,h,r){   // white moulded shell with soft shadow, bevel + edge
    ctx.save(); ctx.shadowColor='rgba(0,0,0,0.45)'; ctx.shadowBlur=8; ctx.shadowOffsetY=3;
    var g=ctx.createLinearGradient(0,y,0,y+h); g.addColorStop(0,'#fbfcfe'); g.addColorStop(0.45,'#eceff5'); g.addColorStop(1,'#c4cad6');
    ctx.fillStyle=g; rr(x,y,w,h,r); ctx.fill(); ctx.restore();
    ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=1.2; rr(x,y,w,h,r); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.55)'; rr(x+4,y+3,w-8,4,2); ctx.fill();   // top gloss band
  }
  function cordBoss(dirx,diry){   // strain-relief grip where the flex enters the plug, drawn ON TOP
    var a=Math.atan2(diry,dirx); ctx.save(); ctx.rotate(a);
    var g=ctx.createLinearGradient(0,-6,0,6); g.addColorStop(0,'#2f343d'); g.addColorStop(0.5,'#20242b'); g.addColorStop(1,'#14171c');
    ctx.fillStyle=g; rr(6,-6,20,12,5); ctx.fill();                       // ribbed grip
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=0.8;
    for(var i=0;i<3;i++){ ctx.beginPath(); ctx.moveTo(11+i*4,-5); ctx.lineTo(11+i*4,5); ctx.stroke(); }
    ctx.restore();
  }
  function drawPin(x,y,w,h){ var g=ctx.createLinearGradient(x,y,x+w,y); g.addColorStop(0,'#8a712c'); g.addColorStop(0.5,'#d8b658'); g.addColorStop(1,'#8a712c');
    ctx.fillStyle=g; rr(x,y,w,h,1.2); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=0.7; ctx.stroke(); }
  function drawPlug(cb){
    cableGeom(cb); var P=cb.path, n=P.length-1;
    var plugged = cb.pluggedInto!=null;
    if (plugged){
      var s=findComp(cb.pluggedInto); if(!s) return;
      var c=socketPlugPoint(s); var ty=P[n].y - c.y;    // anchor sits straight below at c.x → vertical strain-relief tail
      ctx.save(); ctx.translate(c.x, c.y);              // plug body seats on the face; NO rotation
      // strain-relief cord tail — the cord leaves the plug straight DOWN before it flexes away
      ctx.lineCap='round';
      ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(0,12); ctx.lineTo(0,ty); ctx.stroke();
      ctx.strokeStyle='#33383f'; ctx.lineWidth=8;  ctx.beginPath(); ctx.moveTo(0,12); ctx.lineTo(0,ty); ctx.stroke();
      ctx.strokeStyle='rgba(255,255,255,0.14)'; ctx.lineWidth=2.4; ctx.beginPath(); ctx.moveTo(0,12); ctx.lineTo(0,ty); ctx.stroke();
      // body over the apertures (neon + rocker stay visible)
      plugBody(-21,-20,42,44,7);
      ctx.fillStyle='#9aa0ab'; ctx.beginPath(); ctx.arc(0,2,2.8,0,7); ctx.fill();             // centre screw
      cordBoss(0,1);                                                                           // strain-relief boss pointing DOWN
      ctx.restore();
    } else {
      var tip=P[n], pv=P[n-1]||P[0];
      ctx.save(); ctx.translate(tip.x, tip.y);         // dangling plug — upright, pins down, NO rotation
      drawPin(-3, 13, 6, 17);                                                                  // earth (centre, long)
      drawPin(-17, 16, 6, 13);                                                                 // line (left)
      drawPin(11, 16, 6, 13);                                                                  // neutral (right)
      plugBody(-22,-18,44,34,7);
      ctx.fillStyle='#9aa0ab'; ctx.beginPath(); ctx.arc(0,-1,2.8,0,7); ctx.fill();             // screw
      cordBoss(pv.x-tip.x, pv.y-tip.y);                                                        // cord enters from the flex side
      ctx.restore();
    }
  }
  /* ── cable sheath (multicore orthogonal polyline, stripped back at both tips) ── */
  function drawCableSheath(cb){
    var P=cb.path, n=P.length-1;
    var route=[cb._sa]; for (var i=1;i<n;i++) route.push(P[i]); route.push(cb._sb);
    var single = cb.cores.length===1;
    var overC = cb.fire ? '#ff5a3c' : (cb.over ? '#ffb648' : null);
    var bw = single ? 6 : (cb.armoured?15:(cb.flex?9:13));   // single-core thinner; armoured (SWA) is the thickest
    ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
    function line(w, style, dy){ ctx.strokeStyle=style; ctx.lineWidth=w; ctx.beginPath();
      ctx.moveTo(route[0].x, route[0].y+(dy||0)); for (var j=1;j<route.length;j++) ctx.lineTo(route[j].x, route[j].y+(dy||0)); ctx.stroke(); }
    line(bw+2, 'rgba(0,0,0,0.35)', 2);                                        // shadow
    line(bw, overC || (cb.plug ? '#33383f' : cb.armoured ? '#2c313b' : (single ? cb.cores[0].col : (cb.flex?'#d8dbe0':'#e9ebf0'))), 0);  // body (black PVC for a power cord / SWA)
    if (cb.armoured && !overC){ ctx.save(); ctx.setLineDash([2.5,4]); line(bw-4, 'rgba(176,183,196,0.55)', 0); ctx.setLineDash([]); ctx.restore(); }   // galvanised steel-wire armour hatch
    line(single?1.4:(cb.flex?2:3), 'rgba(255,255,255,'+(single?0.3:(cb.plug||cb.armoured?0.16:0.45))+')', -2); // gloss
    if (single && cb.cores[0].role==='E'){ ctx.setLineDash([4,5]); line(2, '#f5d020', 0); ctx.setLineDash([]); } // g/y earth stripe
    if (cb.heat>0.05 && powered){ var pulse=0.5+0.5*Math.sin(anim*0.18);
      line(bw+8, 'rgba(255,'+Math.round(120-cb.heat*70)+',40,'+clamp(cb.heat*0.5*pulse,0,0.75)+')', 0); }
    if (cb.fire && powered){ var m=route[Math.floor(route.length/2)]; drawFire(m.x,m.y); }
    if (!single){ collar(cb, cb._sa, outUnit(P[0],P[1])); if(!cb.plug) collar(cb, cb._sb, outUnit(P[n],P[n-1])); } // jacket cut-back (plug end has no collar)
    ctx.restore();
  }
  function collar(cb, s, out){ var w=(cb.armoured?15:(cb.flex?9:13)); var px=-out.uy, py=out.ux;
    // dark throat just outside the cut — the opening the cores exit from
    ctx.strokeStyle='rgba(10,13,20,0.55)'; ctx.lineWidth=w*0.7; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(s.x+out.ux*2.5, s.y+out.uy*2.5); ctx.lineTo(s.x-out.ux*1.5, s.y-out.uy*1.5); ctx.stroke();
    // grey banded collar (the sheath cut-back ferrule)
    ctx.strokeStyle='#8a909c'; ctx.lineWidth=3.2; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(s.x+px*w*0.5, s.y+py*w*0.5); ctx.lineTo(s.x-px*w*0.5, s.y-py*w*0.5); ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(s.x+px*w*0.5, s.y+py*w*0.5); ctx.lineTo(s.x-px*w*0.5, s.y-py*w*0.5); ctx.stroke();
  }
  /* stripped conductors: flexible insulated cores curving to their landing OR joint, bare copper at the tip */
  function drawCableConductors(cb){
    for (var end=0; end<2; end++){ var en=end?'B':'A'; if (cb.plug && en==='B') continue;   // end B is moulded into the plug
      var E = end?cb._B:cb._A; var lands = end?cb.landB:cb.landA;
      for (var i=0;i<cb.cores.length;i++){ var core=cb.cores[i]; var seg=E[i];
        var connected = !!lands[i] || !!findJoint(cb.id,en,i);   // landed on a terminal OR spliced to another wire
        var h = condHandle(cb, en, i); var hx=h.x, hy=h.y;       // resolves landing → joint → free fan
        ctx.lineCap='round'; ctx.lineJoin='round';
        // insulated core — flexible: curve through the splay point toward its connection
        function corePath(){ ctx.beginPath(); ctx.moveTo(seg.bx, seg.by); if (connected) ctx.quadraticCurveTo(seg.fx, seg.fy, hx, hy); else ctx.lineTo(hx, hy); }
        // subtle dark casing for depth, then the coloured insulation
        ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=4.6; corePath(); ctx.stroke();
        ctx.strokeStyle=core.col; ctx.lineWidth=3.6; corePath(); ctx.stroke();
        ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=1; corePath(); ctx.stroke(); // sheen
        if (core.role==='E'){ ctx.strokeStyle='#f5d020'; ctx.lineWidth=1.6; ctx.setLineDash([3,4]); corePath(); ctx.stroke(); ctx.setLineDash([]); }
        // bare-copper stripped end at the connection tip (a short exposed conductor + strand end)
        var lx = connected ? seg.fx : seg.bx, ly = connected ? seg.fy : seg.by;
        var ddx=hx-lx, ddy=hy-ly, dl=Math.hypot(ddx,ddy)||1; ddx/=dl; ddy/=dl;
        var c0={x:hx-ddx*12, y:hy-ddy*12};
        ctx.strokeStyle='#b5732b'; ctx.lineWidth=3.6; ctx.beginPath(); ctx.moveTo(c0.x,c0.y); ctx.lineTo(hx,hy); ctx.stroke();       // copper
        ctx.strokeStyle='#e6a95a'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.moveTo(c0.x,c0.y); ctx.lineTo(hx,hy); ctx.stroke();       // copper sheen
        ctx.fillStyle='#e6a95a'; ctx.beginPath(); ctx.arc(hx,hy,2.4,0,7); ctx.fill();                                               // strand end
      }
    }
  }
  function drawJoints(){
    for (var i=0;i<joints.length;i++){ var j=joints[i];
      var a=endpointAnchor(j.a), b=endpointAnchor(j.b); if(!a||!b) continue;
      var px=(a.x+b.x)/2, py=(a.y+b.y)/2;
      if (isHovered('bump', j)) nodeGlow(px,py,7);
      var dx=b.x-a.x, dy=b.y-a.y, dl=Math.hypot(dx,dy)||1;   // orient the sleeve along the joined wire
      ctx.save(); ctx.translate(px,py); ctx.rotate(Math.atan2(dy/dl, dx/dl));
      // tiny insulated connector sleeve — about the wire diameter, just covers the splice
      var L=14, W=6.5;
      var g=ctx.createLinearGradient(0,-W/2,0,W/2); g.addColorStop(0,'#6b7382'); g.addColorStop(0.5,'#454c5a'); g.addColorStop(1,'#262b36');
      ctx.fillStyle=g; rr(-L/2,-W/2,L,W,W/2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.28)'; ctx.lineWidth=0.9; ctx.stroke();
      ctx.restore();
    }
  }
  function drawCableHandles(cb){
    for (var end=0; end<2; end++){ var en=end?'B':'A'; if (cb.plug && en==='B') continue;   // no handle on the plug end
      var lands=end?cb.landB:cb.landA;
      for (var i=0;i<cb.cores.length;i++){ var h=condHandle(cb, en, i); var core=cb.cores[i];
        var dragging = drag && drag.type==='wire' && drag.cb===cb && drag.end===en && drag.i===i;
        var hovered = isHovered('cond', cb, en, i);
        if (hovered) nodeGlow(h.x,h.y,6.5);
        ctx.beginPath(); ctx.arc(h.x,h.y, hovered?6.5:(lands[i]?4.5:6), 0, 7); ctx.fillStyle=core.col; ctx.fill();
        ctx.lineWidth=1.5; ctx.strokeStyle=(dragging||hovered)?'#fff':'rgba(255,255,255,0.6)'; ctx.stroke();
      }
    }
  }

  /* soft glow ring to signal a clickable node under the cursor */
  function nodeGlow(x,y,r){ ctx.save(); ctx.shadowColor='#f5a623'; ctx.shadowBlur=14;
    ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fillStyle='rgba(245,166,35,0.9)'; ctx.fill();
    ctx.shadowBlur=0; ctx.lineWidth=2; ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(x,y,r+3,0,7); ctx.stroke(); ctx.restore(); }

  /* ═══════════════════════════════════════════════════════════════
     MULTIMETER (floating debug tool) — reads node potentials, branch current & continuity
     ═══════════════════════════════════════════════════════════════ */
  var MW=140, MH=96;
  function openMeter(){ meter = { x: Math.round(LW/2-MW/2), y: 300, mode:'V',
      red:{ x: Math.round(LW/2+96), y: 470, att:null }, black:{ x: Math.round(LW/2-96), y: 470, att:null }, _hover:null }; }
  function closeMeter(){ meter=null; }
  function toggleMeter(){ if(meter) closeMeter(); else openMeter(); var b=$('btn-meter'); if(b) b.classList.toggle('on', !!meter); recompute(); draw(); }   // closing removes an active A-mode series link
  function meterBody(){ return {x:meter.x, y:meter.y, w:MW, h:MH}; }
  function meterClose(){ return {x:meter.x+MW-18, y:meter.y+4, w:14, h:14}; }
  function meterModeRects(){ var x=meter.x+8, y=meter.y+56, tw=MW-16, bw=(tw-8)/3;
    return [ {m:'V',x:x,y:y,w:bw,h:22}, {m:'A',x:x+bw+4,y:y,w:bw,h:22}, {m:'C',x:x+2*(bw+4),y:y,w:bw,h:22} ]; }
  function meterRedTerm(){ return {x:meter.x+MW*0.66, y:meter.y+MH}; }
  function meterBlackTerm(){ return {x:meter.x+MW*0.34, y:meter.y+MH}; }
  /* resolve a probe → its live node key + world position (follows the component/cable it clamps) */
  function probeResolve(p){ var a=p.att;
    if(a){ if(a.t==='term'){ var c=findComp(a.id); if(c){ var w=termWorld(c,a.tid); if(w) return {pos:w, key:tkey(a.id,a.tid)}; } }
           else { var cb=findCable(a.id); if(cb){ var h=condHandle(cb,a.end,a.i); if(h) return {pos:h, key:ckey(a.id,a.end,a.i)}; } }
           p.att=null; }   // clamped target no longer exists → drop the clamp
    return { pos:{x:p.x,y:p.y}, key:null };
  }
  /* nearest node (terminal or conductor tip) a probe would clamp onto */
  function nearestProbeTarget(px,py){ var best=null, bd=17*17;
    var t=termByPoint(px,py,17); if(t){ var d=(px-t.x)*(px-t.x)+(py-t.y)*(py-t.y); if(d<bd){bd=d; best={att:{t:'term',id:t.comp.id,tid:t.tid}, wx:t.x, wy:t.y};} }
    var ch=conductorHandleAt(px,py,17); if(ch){ var hh=condHandle(ch.cb,ch.end,ch.i); var d2=(px-hh.x)*(px-hh.x)+(py-hh.y)*(py-hh.y); if(d2<bd){bd=d2; best={att:{t:'cond',id:ch.cb.id,end:ch.end,i:ch.i}, wx:hh.x, wy:hh.y};} }
    return best;
  }
  /* whole-probe hit test: anywhere along the needle + handle (not just the tip node-point) is grabbable */
  function probeHitAt(p, probe, term){
    var pos=probeResolve(probe).pos;
    var dx=term.x-pos.x, dy=term.y-pos.y, dl=Math.hypot(dx,dy)||1;
    var hb={x:pos.x+dx/dl*34, y:pos.y+dy/dl*34};   // handle back
    return dist2(p, projSeg(p, pos, hb)) < 11;      // within ~11px of the probe axis
  }
  function fmtNum(v,d){ var p=Math.pow(10,d); return (Math.round(v*p)/p).toFixed(d); }
  /* continuity is purely topological — it must work on a dead board with NO consumer unit at all
     (that is the whole point of a continuity tester), so fall back to a fresh union-find */
  function meterSameNet(a,b){
    if (R && R.sameNet) return R.sameNet(a,b);
    var f=buildFind(null); return f(a)===f(b);
  }
  /* the live reading for the current mode + probe attachments */
  function meterRead(){ if(!meter) return {big:'',unit:'',sub:''};
    var rk=probeResolve(meter.red).key, bk=probeResolve(meter.black).key;
    var have = R && R.potAt;   // probe closures present (a consumer unit exists)
    if (meter.mode==='C'){
      if(!rk||!bk) return {big:'OL', unit:'Ω', sub:'touch two nodes'};
      if (meterSameNet(rk,bk)) return {big:'0.0', unit:'Ω', sub:'CONTINUITY ·))', beep:true};
      return {big:'O.L', unit:'Ω', sub:'open'};
    }
    if (meter.mode==='A'){
      // SHORT: an ammeter clipped across a live pair (L–N etc.) is a dead short, not a reading
      if (R && R._meterShort) return {big:'O.L', unit:'A', sub:'⚠ shorted! never put an ammeter across live points'};
      // SERIES mode: the meter is spliced into the circuit and carries the current itself
      if (R && R._meterCurr != null){
        if(!have) return {big:'--',unit:'A',sub:'place a consumer unit'};
        var mc=R._meterCurr;
        return {big:fmtNum(mc,2), unit:'A', sub: mc>0.0005 ? '⎓ in series' : 'in series · no current'};
      }
      // CLAMP mode: a probe clipped onto a cable conductor reads the current that cable carries
      var rc = meter.red.att   && meter.red.att.t==='cond'   ? findCable(meter.red.att.id)   : null;
      var bc = meter.black.att && meter.black.att.t==='cond' ? findCable(meter.black.att.id) : null;
      var clamp = rc || bc;
      if (clamp){ if(!have) return {big:'--',unit:'A',sub:'place a consumer unit'}; var cc=clamp._curr||0;
        return {big:fmtNum(cc,2), unit:'A', sub:'⊙ clamp · '+(cc>0.005?(clamp.ratingA?clamp.ratingA+' A cable':'wire'):'no current')}; }
      // SPAN mode: probes on the two ends of one part (cable / breaker / load)
      if(!rk||!bk) return {big:'O.L', unit:'A', sub:'break the line & insert, or clamp a wire'};
      if(!have)    return {big:'--',  unit:'A', sub:'place a consumer unit'};
      var cur=R.currentBetween(rk,bk);
      if(cur==null) return {big:'---', unit:'A', sub:'break the line & insert, or clamp a wire'};
      return {big:fmtNum(cur,2), unit:'A', sub:'through part'};
    }
    if(!rk||!bk) return {big:'O.L', unit:'V', sub:'touch two nodes'};
    if(!have)    return {big:'--',  unit:'V', sub:'place a consumer unit'};
    var pa=R.potAt(rk), pb=R.potAt(bk); var v=Math.abs((pa?pa.v:0)-(pb?pb.v:0));
    return {big:fmtNum(v,1), unit:'V', sub:(pa?pa.net:'○')+'  ↔  '+(pb?pb.net:'○')};
  }
  function drawMeter(){ if(!meter) return;
    var rp=probeResolve(meter.red), bp=probeResolve(meter.black);
    var rt=meterRedTerm(), bt=meterBlackTerm();
    ctx.save();
    function lead(a,b,col){ var mx=(a.x+b.x)/2, my=Math.max(a.y,b.y)+26;
      ctx.lineCap='round'; ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=5.5; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.quadraticCurveTo(mx,my,b.x,b.y); ctx.stroke();
      ctx.strokeStyle=col; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.quadraticCurveTo(mx,my,b.x,b.y); ctx.stroke(); }
    // the lead cable enters the BACK of the handle (not the tip): terminate it at the handle end
    function handleBack(pos, term){ var dx=term.x-pos.x, dy=term.y-pos.y, dl=Math.hypot(dx,dy)||1; return {x:pos.x+dx/dl*33, y:pos.y+dy/dl*33}; }
    lead(bt, handleBack(bp.pos,bt), '#2b303c'); lead(rt, handleBack(rp.pos,rt), '#e23b2e');
    if (drag && drag.type==='probe' && meter._hover) nodeGlow(meter._hover.x, meter._hover.y, 7);
    // a real test-probe: sharp silver needle at the contact + a coloured moulded barrel pointing back along the lead
    // a realistic test probe: chrome needle → dark ferrule/finger-guard → tapered moulded handle
    function drawProbe(pos, term, cs, att, hot){
      var dx=term.x-pos.x, dy=term.y-pos.y, dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;   // unit toward the lead
      var px=-dy, py=dx;
      var mB={x:pos.x+dx*12, y:pos.y+dy*12};                              // where metal meets the handle
      var gp={x:pos.x+dx*13.5, y:pos.y+dy*13.5};                          // finger guard
      var hb={x:pos.x+dx*34, y:pos.y+dy*34};                             // handle back
      // clip ring on the node when clamped
      if (att){ ctx.save(); if(hot){ctx.shadowColor=cs.base;ctx.shadowBlur=8;} ctx.strokeStyle='rgba(255,255,255,0.9)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(pos.x,pos.y,8,0,7); ctx.stroke();
                ctx.strokeStyle=cs.base; ctx.lineWidth=2.4; ctx.beginPath(); ctx.arc(pos.x,pos.y,7.4,0,7); ctx.stroke(); ctx.restore(); }
      // moulded handle — tapered, wider at the back, rounded end
      var wF=3.0, wB=4.6;
      ctx.beginPath();
      ctx.moveTo(gp.x+px*wF, gp.y+py*wF);
      ctx.lineTo(hb.x+px*wB, hb.y+py*wB);
      ctx.quadraticCurveTo(hb.x+dx*wB*1.4, hb.y+dy*wB*1.4, hb.x-px*wB, hb.y-py*wB);
      ctx.lineTo(gp.x-px*wF, gp.y-py*wF); ctx.closePath();
      var hg=ctx.createLinearGradient(gp.x+px*wB, gp.y+py*wB, gp.x-px*wB, gp.y-py*wB);
      hg.addColorStop(0, cs.light); hg.addColorStop(0.45, cs.base); hg.addColorStop(1, cs.dark);
      ctx.fillStyle=hg; ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=0.9; ctx.stroke();
      // glossy highlight streak
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1.5; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(gp.x+px*1.4+dx*2, gp.y+py*1.4+dy*2); ctx.lineTo(hb.x+px*1.8-dx*4, hb.y+py*1.8-dy*4); ctx.stroke();
      // dark ferrule / finger guard where the metal exits the handle
      ctx.strokeStyle='#14181f'; ctx.lineWidth=4.2; ctx.lineCap='round';
      ctx.beginPath(); ctx.moveTo(gp.x+px*3.8, gp.y+py*3.8); ctx.lineTo(gp.x-px*3.8, gp.y-py*3.8); ctx.stroke();
      // chrome needle tapering to a sharp point
      ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.lineTo(mB.x+px*1.9, mB.y+py*1.9); ctx.lineTo(mB.x-px*1.9, mB.y-py*1.9); ctx.closePath();
      var mg=ctx.createLinearGradient(mB.x+px*2, mB.y+py*2, mB.x-px*2, mB.y-py*2);
      mg.addColorStop(0,'#f4f6fa'); mg.addColorStop(0.5,'#b7bec9'); mg.addColorStop(1,'#7a808c');
      ctx.fillStyle=mg; ctx.fill();
      ctx.fillStyle= hot?'#fff':'#eaeef4'; ctx.beginPath(); ctx.arc(pos.x,pos.y,1.5,0,7); ctx.fill();   // bright tip
    }
    var dragR = drag&&drag.type==='probe'&&drag.which==='red', dragB = drag&&drag.type==='probe'&&drag.which==='black';
    var CS_BLACK={base:'#3a4150',light:'#5a6172',dark:'#1e222c'}, CS_RED={base:'#e23b2e',light:'#f4695b',dark:'#a5271b'};
    drawProbe(bp.pos, bt, CS_BLACK, meter.black.att, dragB);
    drawProbe(rp.pos, rt, CS_RED,   meter.red.att,   dragR);
    // body
    var b=meterBody();
    ctx.shadowColor='rgba(0,0,0,0.5)'; ctx.shadowBlur=14; ctx.shadowOffsetY=5;
    var bg=ctx.createLinearGradient(0,b.y,0,b.y+b.h); bg.addColorStop(0,'#f2c73f'); bg.addColorStop(1,'#d99f22');
    ctx.fillStyle=bg; rr(b.x,b.y,b.w,b.h,11); ctx.fill(); ctx.shadowBlur=0; ctx.shadowOffsetY=0;
    ctx.strokeStyle='rgba(0,0,0,0.32)'; ctx.lineWidth=1.2; rr(b.x,b.y,b.w,b.h,11); ctx.stroke();
    ctx.fillStyle='#2a1f06'; ctx.font='800 8px "Segoe UI"'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText('MULTIMETER', b.x+9, b.y+12);
    // LCD
    var lc={x:b.x+8,y:b.y+18,w:b.w-16,h:32}; ctx.fillStyle='#0c1710'; rr(lc.x,lc.y,lc.w,lc.h,5); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1; rr(lc.x,lc.y,lc.w,lc.h,5); ctx.stroke();
    var rd=meterRead();
    ctx.fillStyle='#7ef0aa'; ctx.font='800 22px "Courier New",monospace'; ctx.textAlign='right'; ctx.textBaseline='alphabetic';
    ctx.fillText(rd.big, lc.x+lc.w-22, lc.y+24);
    ctx.font='800 11px "Courier New"'; ctx.fillText(rd.unit, lc.x+lc.w-5, lc.y+23);
    ctx.fillStyle='rgba(126,240,170,0.62)'; ctx.font='700 7px "Courier New"'; ctx.textAlign='left'; ctx.fillText(rd.sub||'', lc.x+6, lc.y+9.5);
    // mode buttons
    meterModeRects().forEach(function(mr){ var on=meter.mode===mr.m;
      ctx.fillStyle= on? '#2a1f06' : 'rgba(0,0,0,0.15)'; rr(mr.x,mr.y,mr.w,mr.h,4); ctx.fill();
      ctx.fillStyle= on? '#f2c73f' : '#3a2c08'; ctx.font='800 11px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(mr.m==='V'?'V':(mr.m==='A'?'A':'Ω'), mr.x+mr.w/2, mr.y+mr.h/2); });
    // close ✕
    var cz=meterClose(); ctx.fillStyle='rgba(0,0,0,0.18)'; rr(cz.x,cz.y,cz.w,cz.h,3); ctx.fill();
    ctx.strokeStyle='#2a1f06'; ctx.lineWidth=1.7; ctx.lineCap='round'; ctx.beginPath();
    ctx.moveTo(cz.x+4,cz.y+4); ctx.lineTo(cz.x+cz.w-4,cz.y+cz.h-4); ctx.moveTo(cz.x+cz.w-4,cz.y+4); ctx.lineTo(cz.x+4,cz.y+cz.h-4); ctx.stroke();
    // lead sockets
    ctx.fillStyle='#e23b2e'; ctx.beginPath(); ctx.arc(rt.x,rt.y,3.4,0,7); ctx.fill();
    ctx.fillStyle='#2b303c'; ctx.beginPath(); ctx.arc(bt.x,bt.y,3.4,0,7); ctx.fill();
    ctx.restore();
  }

  /* ── terminals on components (always-labelled, hydraulic-style port pills) ── */
  function drawTerminals(c){
    var ts=termList(c);
    for (var i=0;i<ts.length;i++){ var wx=c.x+ts[i].x, wy=c.y+ts[i].y;
      var hot = (hoverTerm && hoverTerm.comp===c && hoverTerm.tid===ts[i].id) || isHovered('term', c, ts[i].id);
      if (hot) nodeGlow(wx,wy,6);
      ctx.beginPath(); ctx.arc(wx,wy, hot?6:4.5, 0, 7);
      ctx.fillStyle = hot ? '#f5a623' : '#c9ced9'; ctx.fill();
      ctx.lineWidth=1.4; ctx.strokeStyle='#0d1117'; ctx.stroke();
      // persistent label pill just outside the component edge
      var lab=ts[i].lab; if(lab){
        var below = ts[i].y > ehei(c)*0.5;
        var lx=wx, ly=wy + (below? 12 : -12);
        ctx.font='700 8px "Courier New",monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
        var tw=ctx.measureText(lab).width+7;
        ctx.fillStyle= hot ? 'rgba(245,166,35,0.95)' : 'rgba(10,14,20,0.82)';
        rr(lx-tw/2, ly-6.5, tw, 13, 3); ctx.fill();
        ctx.fillStyle= hot ? '#1a1a2e' : '#c9ced9';
        ctx.fillText(lab, lx, ly);
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     PICTORIAL COMPONENT DRAWING
     ═══════════════════════════════════════════════════════════════ */
  function drawComponent(c){
    ctx.save(); ctx.translate(c.x, c.y); var s=sc(c); if(s!==1) ctx.scale(s,s);   // draw fns use base w/h; the transform sizes it
    if (c.load) drawLoad(c);
    else if (c.type==='supply') drawSupply(c);
    else if (c.type==='sw1') drawSwitch(c,false);
    else if (c.type==='sw2') drawSwitch(c,true);
    else if (c.type==='swi') drawIntermediate(c);
    else if (c.type==='dpsw') drawDPSwitch(c);
    else if (c.gangs) drawGangSwitch(c);
    else if (isSocket(c)) drawSocket(c);
    else if (c.type==='bell') drawBell(c);
    else if (c.type==='spd') drawSPD(c);
    else if (c.type==='changeover') drawChangeover(c);
    else if (c.type==='dimmer') drawDimmer(c);
    else if (c.type==='emergency') drawEmergency(c);
    else if (c.type==='smoke') drawSmoke(c);
    else if (c.type==='photo') drawPhoto(c);
    else if (c.type==='isolator') drawIsolator(c);
    else if (c.type==='generator') drawGenerator(c);
    else if (c.type==='selector') drawSelector(c);
    else if (c.type==='timer') drawTimer(c);
    else if (c.type==='jbox') drawJBox(c);
    else if (c.type==='pir') drawPIR(c);
    else if (c.type==='rose') drawRose(c);
    else if (c.type==='fcu') drawFCU(c);
    else if (c.type==='mcb') drawMCB(c);
    else if (c.type==='connector') drawConnector(c);
    ctx.restore();
  }
  function drawMCB(c){
    var w=c.w, h=c.h; var on = c.on && !c.tripped && !tripped;
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#eceff2'); g.addColorStop(1,'#c9cdd6');
    ctx.fillStyle=g; rr(0,0,w,h,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.28)'; ctx.lineWidth=1.4; ctx.stroke();
    // switch window + lever (up = ON/green, down = OFF, red = tripped)
    ctx.fillStyle='#20242e'; rr(w*0.24,h*0.30,w*0.52,h*0.32,3); ctx.fill();
    ctx.fillStyle = c.tripped ? '#ff5a3c' : (on?'#3ddc84':'#5a6273');
    rr(w*0.30, on?h*0.325:h*0.50, w*0.40, h*0.115, 2); ctx.fill();
    // rating + label
    ctx.fillStyle='#3a4150'; ctx.font='700 11px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c.mcb+'A', w/2, h*0.74);
    ctx.fillStyle='#6b7280'; ctx.font='700 8px "Segoe UI"'; ctx.fillText('MCB', w/2, h*0.14);
  }
  function drawConnector(c){
    var m=connMode(c), bw=m.w, bh=m.h, rot=connRot(c);
    // draw the body in the block's NATURAL frame under a rotation transform → the whole block turns
    ctx.save();
    if (rot===90)  { ctx.translate(bh,0);   ctx.rotate(Math.PI/2); }
    else if (rot===180){ ctx.translate(bw,bh); ctx.rotate(Math.PI); }
    else if (rot===270){ ctx.translate(0,bw);  ctx.rotate(-Math.PI/2); }
    var g=ctx.createLinearGradient(0,0,0,bh); g.addColorStop(0,'#3a4150'); g.addColorStop(1,'#252b36');
    ctx.fillStyle=g; rr(0,0,bw,bh,6); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1.4; ctx.stroke();
    // busbar(s): one common bar, or a Line bar + Neutral bar for the dual block
    if (m.rails===2){
      ctx.strokeStyle=COL.L; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(10,bh*0.30); ctx.lineTo(bw-10,bh*0.30); ctx.stroke();
      ctx.strokeStyle=COL.N; ctx.lineWidth=3.2; ctx.beginPath(); ctx.moveTo(10,bh*0.70); ctx.lineTo(bw-10,bh*0.70); ctx.stroke();
    } else {
      ctx.strokeStyle='#c8842f'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(10,bh/2); ctx.lineTo(bw-10,bh/2); ctx.stroke();
    }
    // terminal ports (top + bottom) in the natural frame
    var bts=connectorBaseTerms(c); ctx.fillStyle='#12151b';
    for (var i=0;i<bts.length;i++){ rr(bts[i].x-5, (bts[i].y<bh/2?4:bh-14), 10, 10, 2); ctx.fill(); }
    ctx.restore();
    // label kept upright at the visual centre (readable at any rotation)
    ctx.fillStyle='#aab2c2'; ctx.font='700 7px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(m.rails===2?'L / N BLOCK':(m.ways+'-WAY'), c.w/2, c.h/2);
  }
  function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function plate(w,h){ var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#f4f6fa'); g.addColorStop(1,'#cdd2dc'); ctx.fillStyle=g; rr(0,0,w,h,8); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='#8b93a2'; [[8,8],[w-8,8],[8,h-8],[w-8,h-8]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],2,0,7); ctx.fill(); }); }
  function label(txt,w,y){ ctx.fillStyle='#5a6273'; ctx.font='700 9px "Segoe UI",sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(txt, w/2, y); }

  function drawSupply(c){
    var w=c.w,h=c.h;
    var on = powered && c.on!==false && !tripped;
    // live metering from the solver — the consumer unit meters the MAINS-fed load only (generator-fed loads are on the gen)
    var A = on && R ? ((R.mainsTotal!=null?R.mainsTotal:R.total)||0) : 0;
    var V = on ? volts : 0;
    var W = Math.round(A*volts);
    var loadPct = clamp(A/(c.mcb||32), 0, 1.2);

    // enclosure
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#eef1f6'); g.addColorStop(1,'#c3c8d2');
    ctx.fillStyle=g; rr(0,0,w,h,8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.32)'; ctx.lineWidth=1.5; ctx.stroke();
    label('CONSUMER UNIT', w, 14);
    ctx.save(); if(on){ ctx.shadowColor='#3ddc84'; ctx.shadowBlur=7; } ctx.fillStyle=on?'#3ddc84':'#8b93a2';
    ctx.beginPath(); ctx.arc(w-16,14,4,0,7); ctx.fill(); ctx.restore();

    // ── digital LCD meter ──
    var mx=10, my=16, mw=w-20, mh=33;
    ctx.fillStyle='#0a1712'; rr(mx,my,mw,mh,5); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1; rr(mx,my,mw,mh,5); ctx.stroke();
    var lit='#8dffb0', dim='#26382e';
    // power (big amber digits)
    ctx.textAlign='center'; ctx.textBaseline='alphabetic';
    ctx.fillStyle = on ? '#ffd24d' : dim; ctx.font='900 16px "Courier New",monospace';
    ctx.fillText((on? W : 0)+' W', w/2, my+16);
    // voltage + current row (green digits)
    ctx.font='700 10px "Courier New",monospace';
    ctx.textAlign='left';  ctx.fillStyle=on?lit:dim; ctx.fillText((on?V:0)+' V', mx+9, my+29);
    ctx.textAlign='right'; ctx.fillStyle=on?lit:dim; ctx.fillText((on?A.toFixed(1):'0.0')+' A', mx+mw-9, my+29);
    // load bar (green → amber → red)
    var bx=mx+7, by=my+mh-4, bw=mw-14;
    ctx.fillStyle='rgba(255,255,255,0.10)'; rr(bx,by,bw,2.5,1.2); ctx.fill();
    var barCol = loadPct>=1 ? '#ff5a3c' : (loadPct>0.75 ? '#ffb648' : '#3ddc84');
    ctx.fillStyle=on?barCol:dim; rr(bx,by,Math.max(2,bw*clamp(loadPct,0,1)),2.5,1.2); ctx.fill();

    // ── DIN rail with clickable breakers ──
    var ry=57;
    ctx.strokeStyle='#c8842f'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(14,ry-2); ctx.lineTo(w-14,ry-2); ctx.stroke(); // busbar
    ctx.fillStyle='#343b47'; rr(10,ry,w-20,40,4); ctx.fill();
    function breaker(x, bw2, leverOn, leverCol, lab){
      ctx.fillStyle='#20242e'; rr(x,ry+4,bw2,26,3); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; rr(x,ry+4,bw2,26,3); ctx.stroke();
      ctx.fillStyle=leverCol; rr(x+bw2/2-6, leverOn?ry+7:ry+17, 12, 10, 2); ctx.fill();   // rocker up=on
      ctx.fillStyle='#aeb6c4'; ctx.font='700 7px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='alphabetic'; ctx.fillText(lab, x+bw2/2, ry+39);
    }
    // main switch (double-pole isolator) — red when the supply is on
    breaker(18, 24, on, on?'#e23b3b':'#586074', 'MAIN');
    // main MCB — green when live, red when tripped, grey when isolated
    breaker(50, 26, on, tripped?'#ff5a3c':(on?'#3ddc84':'#586074'), c.mcb+'A');
    // RCD — blue when fitted
    breaker(84, 30, c.rcd, c.rcd?'#4fc3f7':'#586074', 'RCD');
    // spare way (decorative)
    ctx.fillStyle='rgba(0,0,0,0.18)'; rr(120,ry+4,w-134,26,3); ctx.fill();

    // terminal shroud
    ctx.fillStyle='#3a4150'; rr(28,h-13,w-56,9,3); ctx.fill();
  }

  function drawSwitch(c, two){
    var w=c.w,h=c.h; plate(w,h);
    // rocker
    var pressed = two ? (c.pos===2) : c.on;
    ctx.save(); ctx.translate(w/2, h*0.45);
    var rw=w*0.5, rh=h*0.4;
    ctx.fillStyle='#e9edf3'; rr(-rw/2,-rh/2,rw,rh,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
    // rocker tilt shading
    var gg=ctx.createLinearGradient(0,-rh/2,0,rh/2);
    if (pressed){ gg.addColorStop(0,'#b9c0cc'); gg.addColorStop(1,'#eef1f6'); } else { gg.addColorStop(0,'#eef1f6'); gg.addColorStop(1,'#b9c0cc'); }
    ctx.fillStyle=gg; rr(-rw/2+2,-rh/2+2,rw-4,rh-4,4); ctx.fill();
    // ON/OFF dot
    ctx.fillStyle = (c.on&&!two)||(two)? '#3ddc84':'#98a0ae';
    ctx.beginPath(); ctx.arc(0, pressed? rh*0.28 : -rh*0.28, 3, 0, 7); ctx.fill();
    ctx.restore();
    label(two?'2-WAY':(c.on?'ON':'OFF'), w, h-12);
    if (two){ ctx.fillStyle='#5a6273'; ctx.font='700 8px "Segoe UI"'; ctx.textAlign='center'; ctx.fillText('POS '+(c.pos||1), w/2, 14); }
  }

  /* intermediate (crossover) switch — flips between straight (L1-L3, L2-L4) and crossed */
  function drawIntermediate(c){
    var w=c.w,h=c.h; plate(w,h); var crossed=c.pos===2;
    ctx.save(); ctx.translate(w/2, h*0.42);
    var rw=w*0.5, rh=h*0.34;
    ctx.fillStyle='#e9edf3'; rr(-rw/2,-rh/2,rw,rh,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
    var gg=ctx.createLinearGradient(0,-rh/2,0,rh/2);
    if(crossed){ gg.addColorStop(0,'#b9c0cc'); gg.addColorStop(1,'#eef1f6'); } else { gg.addColorStop(0,'#eef1f6'); gg.addColorStop(1,'#b9c0cc'); }
    ctx.fillStyle=gg; rr(-rw/2+2,-rh/2+2,rw-4,rh-4,4); ctx.fill();
    // wiring symbol: parallel (straight) or X (crossed)
    ctx.strokeStyle=crossed?'#e2731f':'#4a5566'; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.beginPath();
    if(crossed){ ctx.moveTo(-7,-6); ctx.lineTo(7,6); ctx.moveTo(7,-6); ctx.lineTo(-7,6); }
    else { ctx.moveTo(-6,-6); ctx.lineTo(-6,6); ctx.moveTo(6,-6); ctx.lineTo(6,6); }
    ctx.stroke();
    ctx.restore();
    label('INTERMEDIATE', w, h-11);
  }

  /* 45 A double-pole cooker / isolator switch — breaks Line AND Neutral together */
  function drawDPSwitch(c){
    var w=c.w,h=c.h; plate(w,h); var on=c.on, live=on && powered && !tripped;
    // rocker
    ctx.save(); ctx.translate(w/2, h*0.44);
    var rw=w*0.5, rh=h*0.32;
    ctx.fillStyle='#e9edf3'; rr(-rw/2,-rh/2,rw,rh,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
    var gg=ctx.createLinearGradient(0,-rh/2,0,rh/2);
    if(on){ gg.addColorStop(0,'#b9c0cc'); gg.addColorStop(1,'#eef1f6'); } else { gg.addColorStop(0,'#eef1f6'); gg.addColorStop(1,'#b9c0cc'); }
    ctx.fillStyle=gg; rr(-rw/2+2,-rh/2+2,rw-4,rh-4,4); ctx.fill();
    ctx.fillStyle='#5a6273'; ctx.font='800 9px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(on?'ON':'OFF', 0, 0);
    ctx.restore();
    // red neon (glows when switched on and supply present)
    ctx.save(); if(live){ ctx.shadowColor='#ff3b30'; ctx.shadowBlur=8; } ctx.fillStyle=live?'#ff3b30':'#5c2626';
    ctx.beginPath(); ctx.arc(w/2, 18, 3.4, 0, 7); ctx.fill(); ctx.restore();
    label('45A COOKER', w, h-11);
  }

  /* bell push — momentary contact, closed only while held */
  function drawBell(c){
    var w=c.w,h=c.h; plate(w,h); var pressed=!!c.on, live=pressed && powered && !tripped;
    ctx.save(); ctx.translate(w/2, h*0.42); var R2=Math.min(w,h)*0.28;
    var bg=ctx.createRadialGradient(-3,-3,2,0,0,R2);
    if(pressed){ bg.addColorStop(0,'#d34a3f'); bg.addColorStop(1,'#8a231c'); } else { bg.addColorStop(0,'#f2f4f8'); bg.addColorStop(1,'#c2c8d2'); }
    ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(0, pressed?1.5:0, R2, 0, 7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1.4; ctx.stroke();
    // bell glyph
    ctx.fillStyle = pressed?'#ffe0b0':'#5a6273'; var by=pressed?1.5:0;
    ctx.beginPath(); ctx.moveTo(-6,by+4); ctx.quadraticCurveTo(-6,by-6,0,by-7); ctx.quadraticCurveTo(6,by-6,6,by+4); ctx.closePath(); ctx.fill();
    ctx.fillRect(-7,by+4,14,1.6); ctx.beginPath(); ctx.arc(0,by+7,1.6,0,7); ctx.fill();
    ctx.restore();
    ctx.save(); if(live){ ctx.shadowColor='#ffbe4d'; ctx.shadowBlur=8; } ctx.fillStyle=live?'#ffbe4d':'#586074';
    ctx.beginPath(); ctx.arc(w/2, h*0.72, 3, 0, 7); ctx.fill(); ctx.restore();
    label(pressed?'RINGING':'BELL PUSH', w, h-11);
  }

  /* surge protection device (Type-2 SPD) — parallel-connected, diverts surges to earth */
  function drawSPD(c){
    var w=c.w,h=c.h;
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#3a4150'); g.addColorStop(1,'#252a35');
    ctx.fillStyle=g; rr(4,4,w-8,h-8,6); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#e8ebf1'; rr(12,12,w-24,24,4); ctx.fill();
    ctx.fillStyle='#2a3040'; ctx.font='800 11px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('SPD', w/2, 24);
    var ok=!c.spent;
    ctx.fillStyle=ok?'#2fa84f':'#d24b2f'; rr(w/2-16, 44, 32, 15, 3); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='700 8px "Segoe UI"'; ctx.fillText(ok?'HEALTHY':'REPLACE', w/2, 51.5);
    // surge-to-earth arrow
    ctx.strokeStyle='#f5c842'; ctx.lineWidth=1.8; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(w/2, 66); ctx.lineTo(w/2, h-12); ctx.stroke();
    ctx.fillStyle='#f5c842'; ctx.beginPath(); ctx.moveTo(w/2,h-10); ctx.lineTo(w/2-3.5,h-17); ctx.lineTo(w/2+3.5,h-17); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#8a92a2'; ctx.font='700 7px "Segoe UI"'; ctx.fillText('Type 2', w/2, 70);
  }

  /* mains/generator changeover — a 2-pole selector: MAINS · OFF · GEN */
  function drawChangeover(c){
    var w=c.w,h=c.h; plate(w,h); var pos=c.pos, live=powered && !tripped;
    ctx.save(); ctx.translate(w/2, h*0.40);
    ctx.fillStyle='#dce1e9'; ctx.beginPath(); ctx.arc(0,0,h*0.22,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1.4; ctx.stroke();
    var ang = pos===1? -1.0 : pos===2? 1.0 : 0;
    ctx.rotate(ang); ctx.strokeStyle='#2a3040'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0,-h*0.19); ctx.stroke();
    ctx.restore();
    var labs=[['MAINS',1,'#3ddc84'],['OFF',0,'#98a0ae'],['GEN',2,'#ffbe4d']];
    ctx.font='700 7px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    labs.forEach(function(L,idx){ var lx=w*(0.20+idx*0.30), on=(pos===L[1]);
      ctx.save(); if(on&&L[1]!==0&&live){ ctx.shadowColor=L[2]; ctx.shadowBlur=7; } ctx.fillStyle=on?L[2]:'#4a5162'; ctx.beginPath(); ctx.arc(lx, h*0.70, 3, 0, 7); ctx.fill(); ctx.restore();
      ctx.fillStyle=on?'#2a3040':'#8a92a2'; ctx.fillText(L[0], lx, h*0.82); });
    label('CHANGEOVER', w, 13);
  }

  /* rotary dimmer — series rheostat; click ◀ / ▶ to turn the knob down / up */
  function drawDimmer(c){
    var w=c.w,h=c.h; plate(w,h); var lv=(c.level==null?100:c.level);
    var cx=w/2, cy=h*0.44, R2=Math.min(w,h)*0.28, a0=Math.PI*0.75, a1=Math.PI*2.25, af=a0+(a1-a0)*(lv/100);
    ctx.strokeStyle='rgba(90,100,120,0.4)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,R2+6,a0,a1); ctx.stroke();
    ctx.strokeStyle='#f5a623'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx,cy,R2+6,a0,af); ctx.stroke();
    var kg=ctx.createRadialGradient(cx-3,cy-3,2,cx,cy,R2); kg.addColorStop(0,'#f2f4f8'); kg.addColorStop(1,'#c2c8d2');
    ctx.fillStyle=kg; ctx.beginPath(); ctx.arc(cx,cy,R2,0,7); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(af); ctx.strokeStyle='#2a3040'; ctx.lineWidth=2.4; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(2,0); ctx.lineTo(R2-3,0); ctx.stroke(); ctx.restore();
    ctx.fillStyle='#5a6273'; ctx.font='800 11px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('◀', 9, cy); ctx.fillText('▶', w-9, cy);
    ctx.fillStyle='#2a3040'; ctx.font='800 8px "Courier New"'; ctx.fillText(Math.round(lv)+'%', cx, cy);
    label('DIMMER', w, h-11);
  }

  /* emergency light — non-maintained: internal battery lamp fires when the Line loses power */
  function drawEmergency(c){
    var w=c.w,h=c.h;
    var em = !R || !R.emergency || R.emergency[c.id]!==false;   // battery lamp on unless the mains Line is healthy
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#e8ebf1'); g.addColorStop(1,'#c6ccd6');
    ctx.fillStyle=g; rr(2,2,w-4,h-4,8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1.2; ctx.stroke();
    var dw=w*0.5;
    if (em){ var gl=ctx.createRadialGradient(w/2,h*0.42,2,w/2,h*0.42,dw); gl.addColorStop(0,'rgba(225,255,235,0.95)'); gl.addColorStop(1,'rgba(170,255,205,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(w/2,h*0.42,dw,0,7); ctx.fill(); }
    ctx.fillStyle=em?'#eaffef':'#aeb6c4'; rr(w/2-dw/2, 10, dw, h*0.42, 5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle=em?'#2fa84f':'#6a7180'; ctx.font='800 13px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('EMG', w/2, 10+h*0.20);
    // charge LED — green while mains present (charging), off in battery mode
    ctx.save(); if(!em){ ctx.shadowColor='#3ddc84'; ctx.shadowBlur=6; } ctx.fillStyle=!em?'#3ddc84':'#4a5162';
    ctx.beginPath(); ctx.arc(w-12, 12, 3, 0, 7); ctx.fill(); ctx.restore();
    // battery icon
    ctx.fillStyle=em?'#2fa84f':'#8a92a2'; rr(8, h-16, 15, 8, 1.5); ctx.fill(); rr(23, h-14, 2.4, 4, 1); ctx.fill();
    label(em?'BATTERY LAMP':'CHARGING', w, h-4);
  }

  /* smoke detector — ceiling disc; red flashing alarm on smoke, green LED when mains-healthy */
  function drawSmoke(c){
    var w=c.w,h=c.h; var alarm=!!c.smoke, pwr = R&&R.smokePower&&R.smokePower[c.id];
    var flash = alarm ? (Math.sin(anim*0.4)>0) : false;
    var g=ctx.createRadialGradient(w*0.42,h*0.38,4,w/2,h/2,w*0.5); g.addColorStop(0,'#fbfcfe'); g.addColorStop(1,'#d3d8e0');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(w/2,h/2,w*0.46,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1.4; ctx.stroke();
    // vents
    ctx.strokeStyle='rgba(90,100,120,0.4)'; ctx.lineWidth=1.4;
    for(var a=0;a<8;a++){ var an=a*Math.PI/4; ctx.beginPath(); ctx.moveTo(w/2+Math.cos(an)*w*0.22, h/2+Math.sin(an)*w*0.22); ctx.lineTo(w/2+Math.cos(an)*w*0.36, h/2+Math.sin(an)*w*0.36); ctx.stroke(); }
    // test button / alarm centre
    ctx.save(); if(alarm&&flash){ ctx.shadowColor='#ff3b30'; ctx.shadowBlur=14; }
    ctx.fillStyle = alarm ? (flash?'#ff3b30':'#8a231c') : '#c7ccd6'; ctx.beginPath(); ctx.arc(w/2,h/2,w*0.16,0,7); ctx.fill(); ctx.restore();
    // status LEDs: green power, red alarm
    ctx.save(); if(pwr){ ctx.shadowColor='#3ddc84'; ctx.shadowBlur=6; } ctx.fillStyle=pwr?'#3ddc84':'#4a5162';
    ctx.beginPath(); ctx.arc(w/2-9,h*0.72,2.6,0,7); ctx.fill(); ctx.restore();
    ctx.fillStyle = alarm?(flash?'#ff3b30':'#5c2626'):'#4a5162'; ctx.beginPath(); ctx.arc(w/2+9,h*0.72,2.6,0,7); ctx.fill();
    label(alarm?'⚠ SMOKE ALARM':'SMOKE OK', w, h-9);
  }

  /* photocell / dusk-to-dawn sensor — switches the load on when dark */
  function drawPhoto(c){
    var w=c.w,h=c.h; plate(w,h); var dark=!!c.dark;
    // photocell dome
    var lg=ctx.createRadialGradient(w*0.42,h*0.3,2,w/2,h*0.36,w*0.32);
    if(dark){ lg.addColorStop(0,'#2a3550'); lg.addColorStop(1,'#151b2b'); } else { lg.addColorStop(0,'#dfe6f2'); lg.addColorStop(1,'#9aa6bc'); }
    ctx.fillStyle=lg; ctx.beginPath(); ctx.ellipse(w/2,h*0.36,w*0.3,h*0.24,0,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
    // day/night glyph
    if(dark){ ctx.fillStyle='#cfe0ff'; ctx.beginPath(); ctx.arc(w/2,h*0.36,7,0.4,6.0); ctx.arc(w/2+3,h*0.34,6,5.6,0.9,true); ctx.fill();   // moon
      ctx.fillStyle='#e8eeff'; [[-6,-4],[6,-6],[4,6]].forEach(function(s){ ctx.beginPath(); ctx.arc(w/2+s[0],h*0.36+s[1],0.9,0,7); ctx.fill(); }); }
    else { ctx.fillStyle='#f5b942'; ctx.beginPath(); ctx.arc(w/2,h*0.36,6,0,7); ctx.fill();   // sun
      ctx.strokeStyle='#f5b942'; ctx.lineWidth=1.4; for(var r=0;r<8;r++){ var an2=r*Math.PI/4; ctx.beginPath(); ctx.moveTo(w/2+Math.cos(an2)*8,h*0.36+Math.sin(an2)*8); ctx.lineTo(w/2+Math.cos(an2)*11,h*0.36+Math.sin(an2)*11); ctx.stroke(); } }
    // load LED
    ctx.save(); if(dark){ ctx.shadowColor='#3ddc84'; ctx.shadowBlur=7; } ctx.fillStyle=dark?'#3ddc84':'#586074';
    ctx.beginPath(); ctx.arc(w/2,h*0.66,3,0,7); ctx.fill(); ctx.restore();
    label(dark?'DARK — LOAD ON':'DAYLIGHT — OFF', w, h-10);
  }

  /* isolator switch — a plain double-pole rotary isolator (breaks L and N) */
  function drawIsolator(c){
    var w=c.w,h=c.h; var on=c.on, live=on && powered && !tripped;
    // grey enclosure with red rotary handle
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#dfe3ea'); g.addColorStop(1,'#b7bdc9');
    ctx.fillStyle=g; rr(6,6,w-12,h-12,8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1.2; ctx.stroke();
    ctx.save(); ctx.translate(w/2,h*0.44);
    var rg=ctx.createRadialGradient(-3,-3,2,0,0,w*0.24); rg.addColorStop(0,'#ff6a3d'); rg.addColorStop(1,'#c62828');
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(0,0,w*0.24,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1.4; ctx.stroke();
    // handle pointer: ON = vertical (up), OFF = horizontal
    ctx.rotate(on? 0 : Math.PI/2);
    ctx.fillStyle='#2a1010'; rr(-3, -w*0.22, 6, w*0.20, 2); ctx.fill();
    ctx.restore();
    // ON/OFF marks
    ctx.fillStyle='#2a3040'; ctx.font='800 8px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('ON', w/2, h*0.44-w*0.30); ctx.fillText('OFF', w*0.5+w*0.30, h*0.44);
    ctx.save(); if(live){ ctx.shadowColor='#ff3b30'; ctx.shadowBlur=8; } ctx.fillStyle=live?'#ff3b30':'#5c2626';
    ctx.beginPath(); ctx.arc(w/2, h-16, 3, 0, 7); ctx.fill(); ctx.restore();
    label('ISOLATOR '+(on?'ON':'OFF'), w, h-6);
  }

  /* standby generator — a second live source when running */
  function drawGenerator(c){
    var w=c.w,h=c.h; var run=!!c.running;
    var g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#4a5160'); g.addColorStop(1,'#2b303c');
    ctx.fillStyle=g; rr(4,10,w-8,h-16,8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1.2; ctx.stroke();
    // engine block
    ctx.fillStyle='#20242e'; rr(14,20,w*0.4,h*0.4,5); ctx.fill();
    // cooling fins
    ctx.strokeStyle='#3a4150'; ctx.lineWidth=1.4; for(var f=0;f<4;f++){ ctx.beginPath(); ctx.moveTo(18, 26+f*7); ctx.lineTo(14+w*0.4-4, 26+f*7); ctx.stroke(); }
    // exhaust puff when running
    if(run){ for(var p=0;p<3;p++){ var py=24-((anim*0.5+p*6)%20); ctx.fillStyle='rgba(180,190,200,'+(0.25-p*0.07)+')'; ctx.beginPath(); ctx.arc(w*0.6, py, 3+p, 0,7); ctx.fill(); } }
    // control panel
    ctx.fillStyle=run?'#0e2a16':'#161b27'; rr(w*0.6, 22, w*0.32, h*0.34, 4); ctx.fill();
    ctx.fillStyle=run?'#3ddc84':'#586074'; ctx.font='800 10px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('GEN', w*0.76, 22+h*0.1);
    ctx.font='700 8px "Courier New"'; ctx.fillStyle=run?'#7ef0a8':'#4a5162'; ctx.fillText(run?'230V':'OFF', w*0.76, 22+h*0.24);
    // running lamp
    ctx.save(); if(run){ ctx.shadowColor='#3ddc84'; ctx.shadowBlur=8; } ctx.fillStyle=run?'#3ddc84':'#586074';
    ctx.beginPath(); ctx.arc(w-14, 16, 3.4, 0, 7); ctx.fill(); ctx.restore();
    ctx.fillStyle='#cdd2dc'; ctx.font='800 9px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(run?'RUNNING':'GENERATOR', w/2, h-4);
  }

  /* rotary selector — routes COM to output 1 / 2 / 3 */
  function drawSelector(c){
    var w=c.w,h=c.h; plate(w,h); var pos=c.pos||1;
    var cx=w/2, cy=h*0.42, R2=Math.min(w,h)*0.26;
    // dial
    ctx.fillStyle='#dce1e9'; ctx.beginPath(); ctx.arc(cx,cy,R2,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1.4; ctx.stroke();
    // position ticks 1,2,3 at -50°, 0°, +50°
    var angs=[-0.9, 0, 0.9]; ctx.font='700 8px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    for(var i2=0;i2<3;i2++){ var a=angs[i2]-Math.PI/2; var tx=cx+Math.cos(a)*(R2+8), ty=cy+Math.sin(a)*(R2+8);
      ctx.fillStyle=(pos===i2+1)?'#f5a623':'#8a92a2'; ctx.fillText(''+(i2+1), tx, ty); }
    // knob pointer to selected position
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(angs[pos-1]); ctx.fillStyle='#2a3040'; rr(-2.4,-R2+3,4.8,R2-4,2); ctx.fill();
    ctx.fillStyle='#8b93a2'; ctx.beginPath(); ctx.arc(0,0,3.5,0,7); ctx.fill(); ctx.restore();
    label('SELECTOR · '+pos, w, h-11);
  }

  /* staircase timer switch — tap to run, counts down, auto-off */
  function drawTimer(c){
    var w=c.w,h=c.h; plate(w,h); var on=!!c.on, live=on && powered && !tripped;
    var cx=w/2, cy=h*0.42, R2=Math.min(w,h)*0.28;
    // clock face
    ctx.fillStyle='#eef1f6'; ctx.beginPath(); ctx.arc(cx,cy,R2,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1.4; ctx.stroke();
    // remaining-time arc
    var frac = on && c.dur ? clamp((c.tleft||0)/c.dur,0,1) : 0;
    ctx.strokeStyle=on?'#f5a623':'rgba(90,100,120,0.35)'; ctx.lineWidth=3.4;
    ctx.beginPath(); ctx.arc(cx,cy,R2-2,-Math.PI/2, -Math.PI/2 + frac*Math.PI*2); ctx.stroke();
    // countdown text
    ctx.fillStyle='#2a3040'; ctx.font='800 11px "Courier New"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(on? Math.ceil(c.tleft||0)+'s' : '⏱', cx, cy);
    // status lamp
    ctx.save(); if(live){ ctx.shadowColor='#3ddc84'; ctx.shadowBlur=7; } ctx.fillStyle=live?'#3ddc84':'#586074';
    ctx.beginPath(); ctx.arc(w-14, 16, 3, 0, 7); ctx.fill(); ctx.restore();
    label(on?'TIMER RUNNING':'TIMER — TAP', w, h-11);
  }

  function drawGangSwitch(c){
    var w=c.w,h=c.h,n=c.gangs.length; plate(w,h);
    var ts=defOf(c).terminals;
    for (var g=0; g<n; g++){ var tx=w/2; for(var k=0;k<ts.length;k++) if(ts[k].id==='L'+(g+1)) tx=ts[k].x;
      var on=c.gangs[g];
      var rw=Math.min(20,(w-24)/n-2), rh=h*0.42, cy=h*0.42;
      ctx.fillStyle='#e9edf3'; rr(tx-rw/2, cy-rh/2, rw, rh, 4); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
      var gg=ctx.createLinearGradient(0,cy-rh/2,0,cy+rh/2);
      if (on){ gg.addColorStop(0,'#b9c0cc'); gg.addColorStop(1,'#eef1f6'); } else { gg.addColorStop(0,'#eef1f6'); gg.addColorStop(1,'#b9c0cc'); }
      ctx.fillStyle=gg; rr(tx-rw/2+2, cy-rh/2+2, rw-4, rh-4, 3); ctx.fill();
      ctx.fillStyle= on?'#3ddc84':'#98a0ae'; ctx.beginPath(); ctx.arc(tx, on? cy+rh*0.26 : cy-rh*0.26, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle='#5a6273'; ctx.font='700 7px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(''+(g+1), tx, cy+rh/2+7);
    }
    label(n+'-GANG', w, h-9);
  }

  function drawSocket(c){
    var w=c.w,h=c.h; plate(w,h); var unsw=(c.type==='socketu');
    var outs=socketOutlets(c); var olive=(R&&R.outletLive&&R.outletLive[c.id])||[];
    var faces = c.type==='socket2' ? [{cx:w*0.28,fw:w*0.40},{cx:w*0.72,fw:w*0.40}] : [{cx:w*0.5,fw:w-20}];
    function outletFace(cx, fw, on, live){
      var x0=cx-fw/2;
      var fg=ctx.createLinearGradient(0,12,0,h-22); fg.addColorStop(0,'#eef1f6'); fg.addColorStop(1,'#dbe0e8');
      ctx.fillStyle=fg; rr(x0,12,fw,h-34,8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.14)'; ctx.lineWidth=1.2; ctx.stroke();
      // pin apertures (BS 1363): earth top-centre, L & N below (covered by a seated plug)
      ctx.fillStyle='#20242e';
      rr(cx-2.6, 26, 5.2, 12, 1.6); ctx.fill();      // earth
      rr(cx-18, 47, 10, 5, 1.6); ctx.fill();          // line
      rr(cx+8, 47, 10, 5, 1.6); ctx.fill();           // neutral
      if (!unsw){   // switched sockets carry a rocker; an unswitched socket has none (outlet always live)
        var rx=x0+fw-15;
        ctx.fillStyle='#c7ccd6'; rr(rx,16,12,28,3); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
        var rg=ctx.createLinearGradient(0,16,0,44);
        if(on){ rg.addColorStop(0,'#e6eaf1'); rg.addColorStop(1,'#b4bac6'); } else { rg.addColorStop(0,'#b4bac6'); rg.addColorStop(1,'#e6eaf1'); }
        ctx.fillStyle=rg; rr(rx+1, on?18:31, 10, 13, 2); ctx.fill();
        ctx.fillStyle='#6a7180'; ctx.font='700 6px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('I', rx+6, 22.5); ctx.fillText('O', rx+6, 38.5);
      }
      // neon (red on a switched socket; unswitched sockets show a small live indicator instead)
      var nx=x0+8;
      ctx.save(); if(live){ ctx.shadowColor='#ff3b30'; ctx.shadowBlur=9; ctx.fillStyle='#ff3b30'; } else ctx.fillStyle='#5c2626';
      ctx.beginPath(); ctx.arc(nx, 21, 3.4, 0, 7); ctx.fill(); ctx.restore();
      ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=0.8; ctx.beginPath(); ctx.arc(nx,21,3.4,0,7); ctx.stroke();
    }
    for (var k=0;k<faces.length;k++) outletFace(faces[k].cx, faces[k].fw, outs[k].live, !!olive[k]);
    if (c.type==='socketf'){   // cartridge-fuse carrier below the outlet face
      var fy=h-30;
      ctx.fillStyle=c.fuseBlown?'#ff5a3c':'#d24b2f'; rr(w/2-15, fy, 30, 13, 3); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='700 8px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(c.fuseBlown?'BLOWN':(c.fuse+'A'), w/2, fy+6.5);
    }
    label((c.amp||13)+'A '+(c.type==='socket2'?'DOUBLE SOCKET':(c.type==='socketf'?'FUSED SOCKET':(unsw?'UNSWITCHED':'SOCKET'))), w, h-11);
  }
  /* maintenance-free loop-in junction box — four independent terminal ways */
  function drawJBox(c){
    var w=c.w,h=c.h;
    var g=ctx.createRadialGradient(w*0.42,h*0.4,4,w/2,h/2,w*0.6); g.addColorStop(0,'#f6f8fb'); g.addColorStop(1,'#c9cfd9');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(w/2,h/2,w*0.46,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.25)'; ctx.lineWidth=1.4; ctx.stroke();
    // four screw terminals
    ctx.fillStyle='#8b93a2'; var ps=[[w*0.3,h*0.3],[w*0.7,h*0.3],[w*0.3,h*0.7],[w*0.7,h*0.7]];
    ps.forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],4.5,0,7); ctx.fill(); ctx.strokeStyle='#5a6273'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(p[0]-3,p[1]); ctx.lineTo(p[0]+3,p[1]); ctx.stroke(); });
    label('JB', w, h*0.54);
  }
  /* PIR / occupancy sensor — a motion-switched load; tap to toggle simulated motion */
  function drawPIR(c){
    var w=c.w,h=c.h; plate(w,h); var m=c.motion;
    // domed lens
    var lg=ctx.createRadialGradient(w*0.42,h*0.3,3,w/2,h*0.4,w*0.4); lg.addColorStop(0,'#eaeef4'); lg.addColorStop(1,'#aeb6c4');
    ctx.fillStyle=lg; ctx.beginPath(); ctx.ellipse(w/2,h*0.4,w*0.34,h*0.28,0,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.2)'; ctx.lineWidth=1; ctx.stroke();
    // fresnel segments
    ctx.strokeStyle='rgba(90,100,120,0.35)'; ctx.lineWidth=0.8;
    for(var f=1;f<=2;f++){ ctx.beginPath(); ctx.ellipse(w/2,h*0.4,w*0.34*f/3,h*0.28*f/3,0,0,7); ctx.stroke(); }
    // motion indicator
    if(m){ ctx.strokeStyle='#3ddc84'; ctx.lineWidth=1.6; for(var r2=0;r2<3;r2++){ ctx.beginPath(); ctx.arc(w/2,h*0.4,5+r2*4,-0.9,0.9); ctx.stroke(); }
      ctx.fillStyle='#3ddc84'; ctx.beginPath(); ctx.arc(w/2,h*0.4,2.5,0,7); ctx.fill(); }
    else { ctx.fillStyle='#8b93a2'; ctx.beginPath(); ctx.arc(w/2,h*0.4,2.5,0,7); ctx.fill(); }
    // status LED
    ctx.save(); if(m){ ctx.shadowColor='#3ddc84'; ctx.shadowBlur=8; } ctx.fillStyle=m?'#3ddc84':'#586074';
    ctx.beginPath(); ctx.arc(w/2,h*0.66,3,0,7); ctx.fill(); ctx.restore();
    label(m?'MOTION':'PIR — NO MOTION', w, h-10);
  }

  function drawRose(c){
    var w=c.w,h=c.h;
    ctx.fillStyle='#f2f4f8'; ctx.beginPath(); ctx.arc(w/2,h*0.42,w*0.42,0,7); ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1.4; ctx.stroke();
    ctx.fillStyle='#dfe3ea'; ctx.beginPath(); ctx.arc(w/2,h*0.42,w*0.26,0,7); ctx.fill();
    // terminal bank
    ctx.fillStyle='#b7bdc9'; rr(w*0.28,h*0.36,w*0.44,10,2); ctx.fill();
    label('CEILING ROSE', w, h-8);
  }

  function drawFCU(c){
    var w=c.w,h=c.h; plate(w,h);
    ctx.fillStyle='#e4e8ee'; rr(12,20,w-24,h-40,6); ctx.fill();
    // fuse carrier
    ctx.fillStyle=c.fuseBlown?'#ff5a3c':'#d24b2f'; rr(w/2-14,h/2-9,28,18,3); ctx.fill();
    ctx.fillStyle='#fff'; ctx.font='700 9px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(c.fuse+'A', w/2, h/2);
    // neon
    ctx.fillStyle=(R&&R.energized&&powered&&!c.fuseBlown)?'#ff9800':'#7a3'; ctx.beginPath(); ctx.arc(w-18,24,3.5,0,7); ctx.fill();
    label('FUSED SPUR', w, 14);
  }

  /* ── loads / appliances ── */
  function drawLoad(c){
    var d=LOADS[c.type]; var en = R && R.energized && R.energized[c.id];
    var dim = (R && R.dimFactor && R.dimFactor[c.id]!=null) ? R.dimFactor[c.id] : 1;   // rotary-dimmer brightness/speed factor
    drawAppliancePic(c.type, c.w, c.h, en && c.on, c.on, dim);
    // power indicator LED
    ctx.fillStyle = (en&&c.on)?'#3ddc84':(c.on?'#586074':'#3a4150');
    ctx.beginPath(); ctx.arc(c.w-8, 8, 3.5, 0, 7); ctx.fill();
    // name + watts (below the terminal label pills)
    ctx.fillStyle='#aab2c2'; ctx.font='700 9px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='top';
    ctx.fillText(d.name, c.w/2, c.h+24);
    ctx.fillStyle='#6b7a99'; ctx.font='700 8px "Courier New"'; ctx.fillText(c.watt+' W', c.w/2, c.h+35);
  }

  function drawAppliancePic(pic, w, h, lit, on, dim){
    pic = LOADS[pic] ? LOADS[pic].pic : pic;
    dim = (dim==null?1:clamp(dim,0,1));   // 1 = full brightness/speed, <1 = dimmed by a rotary dimmer
    var fanSpd = 0.25+0.75*dim;           // fans still turn a little at the lowest setting
    ctx.save();
    if (pic==='bulb'){
      // ── incandescent GLS, cap DOWN toward the terminals: pear glass on top, brass cap at the bottom ──
      var cx=w/2, cy=h*0.40, r=w*0.32, capTop=h-17;
      if (lit){ var gl=ctx.createRadialGradient(cx,cy,2,cx,cy,r*2.6); gl.addColorStop(0,'rgba(255,214,110,'+(0.85*dim)+')'); gl.addColorStop(0.5,'rgba(255,190,80,'+(0.22*dim)+')'); gl.addColorStop(1,'rgba(255,190,80,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(cx,cy,r*2.5,0,7); ctx.fill(); }
      // brass cap with thread grooves (bottom, where the wires land)
      var capW=18, capX=cx-capW/2;
      var cg=ctx.createLinearGradient(capX,0,capX+capW,0); cg.addColorStop(0,'#7a642a'); cg.addColorStop(0.5,'#d9b95c'); cg.addColorStop(1,'#7a642a');
      ctx.fillStyle=cg; rr(capX,capTop,capW,15,3); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1;
      for (var th=0;th<3;th++){ ctx.beginPath(); ctx.moveTo(capX+1.5,capTop+4+th*4); ctx.lineTo(capX+capW-1.5,capTop+4+th*4); ctx.stroke(); }
      // pear glass: sphere body + flared neck down to the cap
      var bg=ctx.createRadialGradient(cx-r*0.35,cy-r*0.35,2,cx,cy,r*1.15);
      bg.addColorStop(0, lit?'#fff8dc':'#f2f5fa'); bg.addColorStop(0.72, lit?'#ffd54a':'#d6dbe4'); bg.addColorStop(1, lit?'#f0a92e':'#b9c0cc');
      ctx.fillStyle=bg;
      ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx-7,capTop);
      ctx.quadraticCurveTo(cx-9, cy+r*0.55, cx-r*0.66, cy+r*0.70);
      ctx.lineTo(cx+r*0.66, cy+r*0.70);
      ctx.quadraticCurveTo(cx+9, cy+r*0.55, cx+7, capTop);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.stroke();
      // filament support posts (rising from the neck) + coiled filament
      ctx.strokeStyle='#8b93a2'; ctx.lineWidth=1.1;
      ctx.beginPath(); ctx.moveTo(cx-5,cy+r*0.62); ctx.lineTo(cx-6,cy+1); ctx.moveTo(cx+5,cy+r*0.62); ctx.lineTo(cx+6,cy+1); ctx.stroke();
      ctx.save();
      if (lit){ ctx.shadowColor='#ffcc66'; ctx.shadowBlur=8; }
      ctx.strokeStyle=lit?'#ffb300':'#9aa0ab'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(cx-6,cy+1);
      for (var f=1;f<8;f++) ctx.lineTo(cx-6+f*1.6, cy+1+(f%2?-4:2));
      ctx.lineTo(cx+6,cy+1); ctx.stroke();
      ctx.restore();
      // glass specular
      ctx.strokeStyle='rgba(255,255,255,0.55)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(cx-r*0.32,cy-r*0.26,r*0.55,Math.PI*0.9,Math.PI*1.45); ctx.stroke();
    } else if (pic==='led'){
      // ── LED bulb, cap DOWN toward the terminals: milky dome on top, heat-sink + cap below ──
      var lx=w/2, dcy=h*0.38, lr=w*0.30, capT=h-14;
      if (lit){ var gl2=ctx.createRadialGradient(lx,dcy,2,lx,dcy,lr*2.5); gl2.addColorStop(0,'rgba(215,238,255,'+(0.9*dim)+')'); gl2.addColorStop(0.5,'rgba(190,225,255,'+(0.22*dim)+')'); gl2.addColorStop(1,'rgba(190,225,255,0)'); ctx.fillStyle=gl2; ctx.beginPath(); ctx.arc(lx,dcy,lr*2.4,0,7); ctx.fill(); }
      var cap2W=16, cap2X=lx-cap2W/2;
      var cg2=ctx.createLinearGradient(cap2X,0,cap2X+cap2W,0); cg2.addColorStop(0,'#7a642a'); cg2.addColorStop(0.5,'#d9b95c'); cg2.addColorStop(1,'#7a642a');
      ctx.fillStyle=cg2; rr(cap2X,capT,cap2W,12,3); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.35)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(cap2X+1.5,capT+4); ctx.lineTo(cap2X+cap2W-1.5,capT+4); ctx.moveTo(cap2X+1.5,capT+8); ctx.lineTo(cap2X+cap2W-1.5,capT+8); ctx.stroke();
      // finned heat-sink widening from the cap up to the dome
      var hsBot2=capT+1, hsTop2=dcy+lr*0.52;
      var hg=ctx.createLinearGradient(lx-lr,0,lx+lr,0); hg.addColorStop(0,'#646b78'); hg.addColorStop(0.5,'#aab2c0'); hg.addColorStop(1,'#565d69');
      ctx.fillStyle=hg; ctx.beginPath(); ctx.moveTo(lx-8,hsBot2); ctx.lineTo(lx+8,hsBot2); ctx.lineTo(lx+lr*0.92,hsTop2); ctx.lineTo(lx-lr*0.92,hsTop2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1;
      for (var fn=1;fn<=3;fn++){ var fy2=hsBot2+(hsTop2-hsBot2)*fn/4, half=8+(lr*0.92-8)*fn/4; ctx.beginPath(); ctx.moveTo(lx-half,fy2); ctx.lineTo(lx+half,fy2); ctx.stroke(); }
      // milky diffuser dome
      var dg=ctx.createRadialGradient(lx-lr*0.3,dcy-lr*0.35,2,lx,dcy,lr*1.05);
      dg.addColorStop(0, lit?'#ffffff':'#f4f7fb'); dg.addColorStop(0.7, lit?'#e8f4ff':'#dde3ec'); dg.addColorStop(1, lit?'#cfe6ff':'#c2c9d4');
      ctx.fillStyle=dg; ctx.beginPath(); ctx.ellipse(lx,dcy,lr,lr*0.92,0,0,7); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.lineWidth=1; ctx.stroke();
      // LED chips: faint dots when off, bright points when lit
      ctx.fillStyle = lit?'#ffffff':'rgba(150,160,180,0.55)';
      for (var ch=0;ch<3;ch++){ ctx.beginPath(); ctx.arc(lx-8+ch*8,dcy+2,1.6,0,7); ctx.fill(); }
      ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(lx-lr*0.3,dcy-lr*0.32,lr*0.5,Math.PI*0.95,Math.PI*1.4); ctx.stroke();
    } else if (pic==='fanC'){
      // ── ceiling fan: canopy + downrod, 3 wooden blades under a domed motor hub ──
      var fx0=w/2, fy0=h*0.55, R2=w*0.40, rot=(lit? anim*0.3*fanSpd : 0.4);
      ctx.fillStyle='#3a4150'; rr(fx0-14,2,28,5,2); ctx.fill();                                   // ceiling plate
      ctx.fillStyle='#4a5060'; ctx.beginPath(); ctx.moveTo(fx0-8,7); ctx.lineTo(fx0+8,7); ctx.lineTo(fx0+5,14); ctx.lineTo(fx0-5,14); ctx.closePath(); ctx.fill();  // canopy
      ctx.strokeStyle='#5d6470'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(fx0,14); ctx.lineTo(fx0,fy0-8); ctx.stroke();   // downrod
      ctx.save(); ctx.translate(fx0,fy0);
      if (lit){ ctx.fillStyle='rgba(150,180,220,0.14)'; ctx.beginPath(); ctx.arc(0,0,R2,0,7); ctx.fill(); }   // motion disc
      ctx.rotate(rot);
      for (var b=0;b<3;b++){ ctx.rotate(Math.PI*2/3);
        var blg=ctx.createLinearGradient(0,-6,0,6); blg.addColorStop(0,'#b98d5e'); blg.addColorStop(0.5,'#96683c'); blg.addColorStop(1,'#7a5230');
        ctx.fillStyle=blg; ctx.globalAlpha = lit?0.72:1;
        rr(9,-6,R2-11,12,6); ctx.fill(); ctx.globalAlpha=1;
      }
      ctx.restore();
      var hgC=ctx.createRadialGradient(fx0-3,fy0-3,1,fx0,fy0,11);
      hgC.addColorStop(0,'#c8cfda'); hgC.addColorStop(0.6,'#8b93a2'); hgC.addColorStop(1,'#4a5060');
      ctx.fillStyle=hgC; ctx.beginPath(); ctx.arc(fx0,fy0,10,0,7); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.3)'; ctx.lineWidth=1; ctx.stroke();
      ctx.strokeStyle='#8b93a2'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(fx0+6,fy0+8); ctx.lineTo(fx0+8,fy0+15); ctx.stroke();   // pull chain
      ctx.fillStyle='#aab2c2'; ctx.beginPath(); ctx.arc(fx0+8.5,fy0+17,2,0,7); ctx.fill();
    } else if (pic==='fanT'){
      // ── table fan: blades spinning behind a wire guard cage, on a neck + base ──
      var tx=w/2, ty=h*0.40, TR=w*0.30, trot=(lit? anim*0.45*fanSpd : 0.2);
      ctx.strokeStyle='#4a5060'; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(tx,ty+TR*0.6); ctx.lineTo(tx,h-10); ctx.stroke();   // neck
      var bg2=ctx.createLinearGradient(tx-20,0,tx+20,0); bg2.addColorStop(0,'#3a4150'); bg2.addColorStop(0.5,'#5d6470'); bg2.addColorStop(1,'#3a4150');
      ctx.fillStyle=bg2; rr(tx-19,h-12,38,9,4); ctx.fill();                                      // base
      ctx.save(); ctx.translate(tx,ty);
      if (lit){ ctx.fillStyle='rgba(150,190,240,0.15)'; ctx.beginPath(); ctx.arc(0,0,TR*0.92,0,7); ctx.fill(); }
      ctx.rotate(trot);
      for (var tb=0;tb<3;tb++){ ctx.rotate(Math.PI*2/3);
        ctx.fillStyle=lit?'rgba(159,183,214,0.8)':'#7f8896';
        ctx.beginPath(); ctx.ellipse(TR*0.5,0,TR*0.46,TR*0.26,0.5,0,7); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle='#2a2f3a'; ctx.beginPath(); ctx.arc(tx,ty,4.5,0,7); ctx.fill();               // hub
      ctx.fillStyle='rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(tx-1.4,ty-1.4,1.5,0,7); ctx.fill();
      ctx.strokeStyle='#9aa0ab'; ctx.lineWidth=1.6; ctx.beginPath(); ctx.arc(tx,ty,TR,0,7); ctx.stroke();   // guard ring
      ctx.lineWidth=0.8;
      for (var gw=0;gw<12;gw++){ var ga=gw*Math.PI/6; ctx.beginPath(); ctx.moveTo(tx+Math.cos(ga)*5.5,ty+Math.sin(ga)*5.5); ctx.lineTo(tx+Math.cos(ga)*TR,ty+Math.sin(ga)*TR); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(tx,ty,TR*0.55,0,7); ctx.stroke();                                  // inner ring
    } else if (pic==='tv'){
      ctx.fillStyle='#15181f'; rr(0,0,w,h*0.82,5); ctx.fill();
      var sg=ctx.createLinearGradient(0,0,w,h*0.8); if(lit){ sg.addColorStop(0,'#2a4a7a'); sg.addColorStop(1,'#123'); } else { sg.addColorStop(0,'#1c2029'); sg.addColorStop(1,'#12151b'); }
      ctx.fillStyle=sg; rr(4,4,w-8,h*0.82-8,3); ctx.fill();
      if (lit){ ctx.fillStyle='rgba(120,180,255,0.5)'; ctx.fillRect(10,10,w*0.3,4); ctx.fillRect(10,20,w*0.5,3); }
      ctx.fillStyle='#2a2f3a'; ctx.fillRect(w/2-14,h*0.82,28,6);
    } else if (pic==='fridge'){
      ctx.fillStyle='#e6e9ef'; rr(0,0,w,h,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.stroke();
      ctx.strokeStyle='#b6bcc7'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(4,h*0.4); ctx.lineTo(w-4,h*0.4); ctx.stroke();
      ctx.fillStyle='#aab2c2'; rr(w-14,10,5,h*0.28,2); ctx.fill(); rr(w-14,h*0.46,5,h*0.4,2); ctx.fill();
      if (lit){ ctx.fillStyle='#4fc3f7'; ctx.beginPath(); ctx.arc(10,10,3,0,7); ctx.fill(); }
    } else if (pic==='kettle'){
      ctx.fillStyle='#cfd6e0'; ctx.beginPath(); ctx.moveTo(w*0.2,h); ctx.lineTo(w*0.12,h*0.35); ctx.quadraticCurveTo(w*0.5,h*0.2,w*0.8,h*0.35); ctx.lineTo(w*0.72,h); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#8b93a2'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(w*0.85,h*0.5,h*0.22,-1.2,1.2); ctx.stroke();
      ctx.fillStyle=lit?'#3ddc84':'#586074'; rr(w*0.3,h*0.7,w*0.3,6,2); ctx.fill();
      if (lit){ ctx.fillStyle='rgba(255,255,255,0.4)'; for(var s=0;s<3;s++){ ctx.beginPath(); ctx.arc(w*0.35+s*8, h*0.28 - (anim*0.5+s*10)%20, 2,0,7); ctx.fill(); } }
    } else if (pic==='heater'){
      ctx.fillStyle='#eceff4'; rr(0,0,w,h,w*0.4); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.stroke();
      ctx.fillStyle='#c6ccd6'; ctx.beginPath(); ctx.arc(w/2,h*0.5,w*0.22,0,7); ctx.fill();
      ctx.fillStyle=lit?'#ff7043':'#8b93a2'; ctx.font='700 9px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(lit?'HOT':'°C', w/2,h*0.5);
      ctx.fillStyle=lit?'#ff5252':'#586074'; ctx.beginPath(); ctx.arc(w/2,12,3,0,7); ctx.fill();
    } else if (pic==='micro'){
      ctx.fillStyle='#2a2f3a'; rr(0,0,w,h,4); ctx.fill();
      ctx.fillStyle=lit?'#3a2a10':'#15181f'; rr(6,6,w*0.62,h-12,3); ctx.fill();
      if (lit){ ctx.fillStyle='rgba(255,200,80,0.4)'; rr(8,8,w*0.58,h-16,2); ctx.fill(); }
      ctx.fillStyle='#4a5060'; rr(w*0.72,8,w*0.22,h-16,2); ctx.fill();
    } else if (pic==='iron'){
      ctx.fillStyle='#c6ccd6'; ctx.beginPath(); ctx.moveTo(4,h-6); ctx.quadraticCurveTo(0,h*0.4,w*0.5,h*0.42); ctx.lineTo(w-8,h*0.5); ctx.quadraticCurveTo(w,h,4,h-6); ctx.closePath(); ctx.fill();
      ctx.fillStyle='#4a5060'; rr(w*0.2,h*0.15,w*0.5,10,5); ctx.fill();
      ctx.fillStyle=lit?'#ff7043':'#586074'; ctx.beginPath(); ctx.arc(w*0.3,h*0.34,3,0,7); ctx.fill();
    } else if (pic==='washer'){
      ctx.fillStyle='#e6e9ef'; rr(0,0,w,h,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.stroke();
      ctx.fillStyle='#aab2c2'; rr(6,6,w-12,10,2); ctx.fill();
      ctx.save(); ctx.translate(w/2,h*0.58); if(lit) ctx.rotate(anim*0.2);
      ctx.fillStyle='#c6ccd6'; ctx.beginPath(); ctx.arc(0,0,w*0.3,0,7); ctx.fill();
      ctx.fillStyle=lit?'#4fc3f7':'#9aa0ab'; ctx.beginPath(); ctx.arc(0,0,w*0.22,0,7); ctx.fill();
      ctx.fillStyle='#e6e9ef'; ctx.beginPath(); ctx.arc(0,-w*0.12,3,0,7); ctx.fill(); ctx.restore();
    } else if (pic==='ac'){
      ctx.fillStyle='#eceff4'; rr(0,0,w,h,6); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.12)'; ctx.stroke();
      ctx.strokeStyle='#c6ccd6'; ctx.lineWidth=2; for(var l=0;l<4;l++){ ctx.beginPath(); ctx.moveTo(8,h*0.6+l*5); ctx.lineTo(w-8,h*0.6+l*5); ctx.stroke(); }
      if (lit){ ctx.fillStyle='rgba(120,200,255,0.35)'; for(var a2=0;a2<3;a2++){ ctx.beginPath(); ctx.arc(w*0.3+a2*18, h-6+((anim*0.5)%10), 3,0,7); ctx.fill(); } ctx.fillStyle='#4fc3f7'; ctx.beginPath(); ctx.arc(w-14,10,3,0,7); ctx.fill(); }
    } else if (pic==='laptop'){
      ctx.fillStyle='#2a2f3a'; rr(w*0.12,4,w*0.76,h*0.6,3); ctx.fill();
      ctx.fillStyle=lit?'#2a4a7a':'#15181f'; rr(w*0.15,7,w*0.7,h*0.54,2); ctx.fill();
      ctx.fillStyle='#c6ccd6'; ctx.beginPath(); ctx.moveTo(w*0.06,h*0.66); ctx.lineTo(w*0.94,h*0.66); ctx.lineTo(w,h*0.78); ctx.lineTo(0,h*0.78); ctx.closePath(); ctx.fill();
    } else if (pic==='cooker'){
      // freestanding cooker: body + control panel + oven door + 4 hobs
      ctx.fillStyle='#e6e9ef'; rr(2,6,w-4,h-6,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#c6ccd6'; rr(6,10,w-12,10,2); ctx.fill();                        // control panel
      for (var ck=0;ck<4;ck++){ ctx.fillStyle=lit?'#ff7043':'#8b93a2'; ctx.beginPath(); ctx.arc(12+ck*((w-24)/3),15,1.8,0,7); ctx.fill(); }   // knobs
      ctx.fillStyle=lit?'#3a2a10':'#20242e'; rr(8,26,w-16,h-34,3); ctx.fill();          // oven door glass
      if(lit){ ctx.fillStyle='rgba(255,150,40,0.35)'; rr(11,29,w-22,h-40,2); ctx.fill(); }
      ctx.fillStyle='#aab2c2'; rr(w*0.3,30,w*0.4,3,1.5); ctx.fill();                    // handle
      // hob rings on top
      ctx.fillStyle=lit?'#ff5252':'#586074'; ctx.beginPath(); ctx.arc(w*0.32,h*0.5,2.4,0,7); ctx.fill();
    } else if (pic==='shower'){
      // electric shower unit: white box + dial + indicator + shower hose
      ctx.fillStyle='#eef1f6'; rr(w*0.12,4,w*0.76,h*0.7,6); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#c6ccd6'; ctx.beginPath(); ctx.arc(w*0.5,h*0.26,w*0.16,0,7); ctx.fill();     // dial
      ctx.fillStyle=lit?'#ff7043':'#8b93a2'; ctx.beginPath(); ctx.arc(w*0.5,h*0.26,w*0.05,0,7); ctx.fill();
      ctx.fillStyle=lit?'#3ddc84':'#586074'; ctx.beginPath(); ctx.arc(w*0.72,h*0.5,3,0,7); ctx.fill();   // power LED
      // hose + head
      ctx.strokeStyle='#aab2c2'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(w*0.5,h*0.74); ctx.quadraticCurveTo(w*0.85,h*0.82,w*0.8,h-4); ctx.stroke();
      ctx.fillStyle='#c6ccd6'; ctx.beginPath(); ctx.arc(w*0.8,h-4,4,0,7); ctx.fill();
      if(lit){ ctx.strokeStyle='rgba(120,180,255,0.5)'; ctx.lineWidth=1; for(var s2=0;s2<3;s2++){ ctx.beginPath(); ctx.moveTo(w*0.76+s2*3,h-2); ctx.lineTo(w*0.75+s2*3,h+4); ctx.stroke(); } }
    } else if (pic==='induction'){
      // induction hob: glass top with four cooking zones
      ctx.fillStyle='#1b1f27'; rr(2,6,w-4,h-10,6); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke();
      var zx=[w*0.30,w*0.70,w*0.30,w*0.70], zy=[h*0.34,h*0.34,h*0.68,h*0.68], zr=[w*0.16,w*0.13,w*0.13,w*0.16];
      for(var z=0;z<4;z++){ ctx.strokeStyle=lit?'rgba(255,90,40,0.9)':'rgba(150,160,175,0.5)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(zx[z],zy[z],zr[z],0,7); ctx.stroke();
        if(lit){ var ig=ctx.createRadialGradient(zx[z],zy[z],0,zx[z],zy[z],zr[z]); ig.addColorStop(0,'rgba(255,90,40,0.5)'); ig.addColorStop(1,'rgba(255,90,40,0)'); ctx.fillStyle=ig; ctx.beginPath(); ctx.arc(zx[z],zy[z],zr[z],0,7); ctx.fill(); } }
      ctx.fillStyle=lit?'#ff5252':'#3a4150'; ctx.fillRect(w*0.42,h-8,w*0.16,3);   // touch panel line
    } else if (pic==='oven'){
      // built-in oven: body + control strip + door with window
      ctx.fillStyle='#d9dde4'; rr(2,4,w-4,h-6,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.16)'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#3a4150'; rr(7,8,w-14,9,2); ctx.fill();
      for(var ok=0;ok<3;ok++){ ctx.fillStyle=lit?'#ff7043':'#8b93a2'; ctx.beginPath(); ctx.arc(13+ok*10,12.5,1.6,0,7); ctx.fill(); }
      ctx.fillStyle='#20242e'; rr(9,22,w-18,h-30,3); ctx.fill();
      ctx.fillStyle=lit?'rgba(255,150,40,0.5)':'rgba(120,140,170,0.25)'; rr(13,26,w-26,h-40,2); ctx.fill();
      ctx.fillStyle='#aab2c2'; rr(w*0.28,24,w*0.44,3,1.5); ctx.fill();   // handle
    } else if (pic==='dish'){
      // dishwasher: front panel + control strip + status LED
      ctx.fillStyle='#e6e9ef'; rr(2,4,w-4,h-6,5); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle='#aab2c2'; rr(7,8,w-14,7,2); ctx.fill();
      ctx.fillStyle=lit?'#3ddc84':'#586074'; ctx.beginPath(); ctx.arc(w-14,11.5,2.2,0,7); ctx.fill();   // running LED
      ctx.fillStyle='#c6ccd6'; rr(w*0.2,h*0.28,w*0.6,4,2); ctx.fill();   // handle
      ctx.strokeStyle='#b6bcc7'; ctx.lineWidth=1.4; ctx.strokeRect(10,h*0.4,w-20,h*0.48);   // door outline
      if(lit){ ctx.fillStyle='rgba(120,180,255,0.25)'; rr(12,h*0.4+2,w-24,h*0.48-4,2); ctx.fill(); }
    } else if (pic==='ev'){
      // EV wall charger + connector on a curly cable
      ctx.fillStyle='#eef1f6'; rr(w*0.2,4,w*0.6,h*0.55,8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.16)'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=lit?'#2a4a7a':'#1b1f27'; rr(w*0.28,10,w*0.44,h*0.24,3); ctx.fill();     // display
      ctx.fillStyle=lit?'#4fc3f7':'#3ddc84'; ctx.font='700 9px "Segoe UI"'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('⚡', w/2, 10+h*0.12);
      ctx.fillStyle=lit?'#3ddc84':'#586074'; ctx.beginPath(); ctx.arc(w*0.5,h*0.44,3,0,7); ctx.fill();  // status ring
      // charging gun on a coiled lead
      ctx.strokeStyle='#33383f'; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(w*0.5,h*0.59); ctx.quadraticCurveTo(w*0.9,h*0.72,w*0.66,h-6); ctx.stroke();
      ctx.fillStyle='#2a2f3a'; rr(w*0.58,h-14,16,12,3); ctx.fill();
    } else if (pic==='exhaust'){
      // wall extractor fan: square housing, spinning impeller behind a round grille
      var ex=w/2, ey=h*0.42, ER=w*0.30, erot=lit? anim*0.5*fanSpd : 0.3;
      ctx.fillStyle='#dbe0e8'; rr(w*0.12, h*0.06, w*0.76, h*0.72, 8); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,0.18)'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='#20242e'; ctx.beginPath(); ctx.arc(ex,ey,ER+3,0,7); ctx.fill();
      if (lit){ ctx.fillStyle='rgba(150,190,240,0.14)'; ctx.beginPath(); ctx.arc(ex,ey,ER,0,7); ctx.fill(); }
      ctx.save(); ctx.translate(ex,ey); ctx.rotate(erot); ctx.fillStyle='#9aa2b0'; ctx.globalAlpha=lit?0.85:1;
      for(var eb=0;eb<5;eb++){ ctx.rotate(Math.PI*2/5); ctx.beginPath(); ctx.ellipse(ER*0.52,0,ER*0.5,ER*0.24,0.6,0,7); ctx.fill(); }
      ctx.globalAlpha=1; ctx.restore();
      ctx.fillStyle='#c8cfda'; ctx.beginPath(); ctx.arc(ex,ey,ER*0.22,0,7); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(ex,ey,ER,0,7); ctx.stroke();
    } else if (pic==='pendant'){
      // ceiling rose → flex drop → conical shade → bulb
      var px2=w/2;
      ctx.fillStyle='#3a4150'; ctx.beginPath(); ctx.arc(px2,4,5,0,7); ctx.fill();
      ctx.strokeStyle='#4a5060'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(px2,8); ctx.lineTo(px2,h*0.32); ctx.stroke();
      if (lit){ var pg=ctx.createRadialGradient(px2,h*0.66,2,px2,h*0.66,w*0.55); pg.addColorStop(0,'rgba(255,220,120,'+(0.28+0.55*dim)+')'); pg.addColorStop(1,'rgba(255,200,90,0)'); ctx.fillStyle=pg; ctx.beginPath(); ctx.arc(px2,h*0.66,w*0.55,0,7); ctx.fill(); }
      var sg=ctx.createLinearGradient(0,h*0.32,0,h*0.55); sg.addColorStop(0,'#c2c8d2'); sg.addColorStop(1,'#e8ebf1');
      ctx.fillStyle=sg; ctx.beginPath(); ctx.moveTo(px2-w*0.07,h*0.32); ctx.lineTo(px2+w*0.07,h*0.32); ctx.lineTo(px2+w*0.34,h*0.55); ctx.lineTo(px2-w*0.34,h*0.55); ctx.closePath(); ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,0.15)'; ctx.lineWidth=1; ctx.stroke();
      var bgp=ctx.createRadialGradient(px2-3,h*0.60,1,px2,h*0.63,w*0.16);
      bgp.addColorStop(0, lit?'#fff6cf':'#eef1f6'); bgp.addColorStop(1, lit?'#ffcf5a':'#c6ccd6');
      ctx.fillStyle=bgp; ctx.beginPath(); ctx.arc(px2,h*0.63,w*0.14,0,7); ctx.fill();
    } else {
      ctx.fillStyle='#c6ccd6'; rr(0,0,w,h,5); ctx.fill();
    }
    ctx.restore();
  }

  function drawFire(x,y){
    for (var i=0;i<7;i++){ var a=(anim*0.3+i)% (Math.PI*2); var fx=x+Math.cos(a)*10*(i%3), fy=y-((anim*0.6+i*7)%34);
      var r=4+ (i%3)*2; var g=ctx.createRadialGradient(fx,fy,0,fx,fy,r*2);
      g.addColorStop(0,'rgba(255,220,80,0.9)'); g.addColorStop(0.5,'rgba(255,110,30,0.6)'); g.addColorStop(1,'rgba(255,60,20,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.arc(fx,fy,r*2,0,7); ctx.fill(); }
  }

  /* ═══════════════════════════════════════════════════════════════
     INTERACTION
     ═══════════════════════════════════════════════════════════════ */
  function conductorHandleAt(px,py,r,ex){ r=r||14; var best=null, bd=r*r;
    for (var ci=cables.length-1; ci>=0; ci--){ var cb=cables[ci]; cableGeom(cb);
      for (var end=0; end<2; end++){ var en=end?'B':'A'; if (cb.plug && en==='B') continue;   // plug end isn't a grabbable core
        for (var i=0;i<cb.cores.length;i++){ if (ex && ex.cb===cb && ex.end===en && ex.i===i) continue;
          var h=condHandle(cb, en, i); var dx=px-h.x,dy=py-h.y, d=dx*dx+dy*dy;
          if (d < bd){ bd=d; best={ cb:cb, end: en, i:i }; } } } }
    return best;
  }
  function cableBodyAt(px,py,r){ r=r||9;
    for (var ci=cables.length-1; ci>=0; ci--){ var cb=cables[ci]; ensureCable(cb); buildRoute(cb); var P=cb.path;
      for (var s=0;s<P.length-1;s++){ if (distToSeg(px,py,P[s].x,P[s].y,P[s+1].x,P[s+1].y)<r) return cb; } }
    return null;
  }
  function segmentAt(cb,px,py,r){ r=r||12; var P=cb.path; var best=-1, bd=r;
    for (var s=0;s<P.length-1;s++){ var d=distToSeg(px,py,P[s].x,P[s].y,P[s+1].x,P[s+1].y); if(d<bd){ bd=d; best=s; } } return best; }
  function compAt(px,py){ for (var i=comps.length-1;i>=0;i--){ var c=comps[i]; if (px>=c.x&&px<=c.x+ewid(c)&&py>=c.y&&py<=c.y+ehei(c)) return c; } return null; }
  /* the ON/OFF rocker zone of a toggleable component, tested in LOCAL coords (small pad) —
     hovering it shows a pointer + "click to switch" hint instead of the move cursor */
  function rockerZoneAt(c, lx, ly){
    var w=c.w, h=c.h, p=4;
    if (c.type==='sw1' || c.type==='sw2' || c.type==='swi' || c.type==='dpsw'){ var rw=w*0.5, rh=h*0.4; return Math.abs(lx-w/2)<rw/2+p && Math.abs(ly-h*0.45)<rh/2+p; }
    if (c.type==='bell'){ return Math.hypot(lx-w/2, ly-h*0.42) < Math.min(w,h)*0.28+p; }
    if (c.type==='changeover'){ return ly < h*0.85; }
    if (c.type==='dimmer'){ return ly < h*0.8; }   // click ◀ / ▶ of the knob
    if (c.type==='smoke'){ return Math.hypot(lx-w/2, ly-h/2) < w*0.46+p; }
    if (c.type==='photo' || c.type==='isolator' || c.type==='generator' || c.type==='selector' || c.type==='timer'){ return ly < h*0.82; }
    if (c.gangs){ var n=c.gangs.length, ts=defOf(c).terminals, rw2=Math.min(20,(w-24)/n-2), rh2=h*0.42, cy=h*0.42;
      for (var g=0; g<n; g++){ var tx=w/2; for (var k=0;k<ts.length;k++) if(ts[k].id==='L'+(g+1)) tx=ts[k].x;
        if (Math.abs(lx-tx)<rw2/2+p && Math.abs(ly-cy)<rh2/2+p) return true; }
      return false; }
    if (c.type==='mcb') return lx>w*0.24-p && lx<w*0.76+p && ly>h*0.30-p && ly<h*0.62+p;
    if (c.type==='socket' || c.type==='socketf') return lx>w-25-p && lx<w-10+p && ly>16-p && ly<44+p;
    if (c.type==='socket2') return ly>14-p && ly<46+p;   // either outlet's rocker
    if (c.type==='pir') return ly<h*0.7;                 // tap the sensor to toggle motion
    if (c.type==='supply') return lx>14-p && lx<118+p && ly>57-p && ly<92+p;   // the DIN-rail breakers
    return false;
  }
  function rockerHint(c){
    if (c.type==='mcb') return c.tripped ? 'Click: RESET' : 'Click: ON / OFF';
    if (c.type==='bell') return 'Press & hold to ring';
    if (c.type==='changeover') return 'Click: Mains · Off · Gen';
    if (c.type==='dimmer') return 'Click ◀ / ▶ to dim';
    if (c.type==='smoke') return c.smoke ? 'Click: clear smoke' : 'Click: trigger smoke';
    if (c.type==='photo') return c.dark ? 'Click: make daylight' : 'Click: make dark';
    if (c.type==='isolator') return 'Click: ON / OFF';
    if (c.type==='generator') return c.running ? 'Click: stop generator' : 'Click: start generator';
    if (c.type==='selector') return 'Click: next position';
    if (c.type==='timer') return 'Click: run timer';
    if (c.type==='sw2') return 'Click: change position';
    if (c.type==='swi') return 'Click: cross / straight';
    if (c.type==='pir') return c.motion ? 'Click: clear motion' : 'Click: trigger motion';
    if (c.type==='socket2') return 'Click an outlet switch';
    if (c.type==='supply') return tripped ? 'Click MAIN to reset' : 'Click: MAIN · MCB · RCD';
    return 'Click: ON / OFF';
  }
  function distToSeg(px,py,x1,y1,x2,y2){ var dx=x2-x1,dy=y2-y1; var l=dx*dx+dy*dy; if(!l) return Math.hypot(px-x1,py-y1); var t=clamp(((px-x1)*dx+(py-y1)*dy)/l,0,1); return Math.hypot(px-(x1+t*dx), py-(y1+t*dy)); }
  function dist2(p,h){ return Math.hypot(p.x-h.x, p.y-h.y); }

  /* ── cable geometry ── */
  function snapCableAxis(cb){ ensureCable(cb);
    if (cb.pts.length===2){ var A=cb.pts[0], B=cb.pts[1]; if (Math.abs(B.x-A.x)>=Math.abs(B.y-A.y)) B.y=A.y; else B.x=A.x; }
    buildRoute(cb);
  }
  function rotateCable(cb){ ensureCable(cb); var P=cb.pts; var cx=0,cy=0; P.forEach(function(p){cx+=p.x;cy+=p.y;}); cx/=P.length; cy/=P.length;
    cb.pts=P.map(function(p){ return {x:Math.round(cx-(p.y-cy)), y:Math.round(cy+(p.x-cx))}; }); buildRoute(cb);
  }
  function cableControls(cb){
    cableGeom(cb); var P=cb.path, n=P.length-1;
    var oA=outUnit(P[0],P[1]), oB=outUnit(P[n],P[n-1]);
    var inA=Math.min(26, Math.hypot(P[0].x-P[1].x,P[0].y-P[1].y)*0.45);
    var inB=Math.min(26, Math.hypot(P[n].x-P[n-1].x,P[n].y-P[n-1].y)*0.45);
    var extA={x:P[0].x-oA.ux*inA, y:P[0].y-oA.uy*inA};   // sit the grip ON the sheath, inward from the stripped tip
    var extB={x:P[n].x-oB.ux*inB, y:P[n].y-oB.uy*inB};
    // arc-length midpoint of the run — the rotation handle floats just off the cable here
    var tot=0, segs=[], i;
    for (i=0;i<n;i++){ var sl=Math.hypot(P[i+1].x-P[i].x,P[i+1].y-P[i].y); segs.push(sl); tot+=sl; }
    var half=tot/2, M={x:P[0].x,y:P[0].y}, mdx=1, mdy=0;
    for (i=0;i<n;i++){ if (half<=segs[i]){ var t=segs[i]?half/segs[i]:0;
        M={x:P[i].x+(P[i+1].x-P[i].x)*t, y:P[i].y+(P[i+1].y-P[i].y)*t};
        if (segs[i]){ mdx=(P[i+1].x-P[i].x)/segs[i]; mdy=(P[i+1].y-P[i].y)/segs[i]; } break; }
      half-=segs[i]; }
    var px=-mdy, py=mdx; if (py>0){ px=-px; py=-py; }   // perpendicular, pointing up-ish
    var rot={x:clamp(M.x+px*30,14,LW-14), y:clamp(M.y+py*30,14,LH-14)};
    return { extA:extA, extB:extB, horizA:Math.abs(oA.ux)>=Math.abs(oA.uy), horizB:Math.abs(oB.ux)>=Math.abs(oB.uy),
             mid:M, rot:rot };
  }
  /* polyline offset by ±d with mitred corners — for the selection outline that hugs the cable */
  function offsetPts(P, d){
    var n=P.length, res=[], i;
    function nrm(a,b){ var dx=b.x-a.x, dy=b.y-a.y, l=Math.hypot(dx,dy)||1; return {x:-dy/l, y:dx/l}; }
    for (i=0;i<n;i++){
      var v;
      if (i===0) v=nrm(P[0],P[1]);
      else if (i===n-1) v=nrm(P[n-2],P[n-1]);
      else { var a=nrm(P[i-1],P[i]), b=nrm(P[i],P[i+1]); var ux=a.x+b.x, uy=a.y+b.y, ul=Math.hypot(ux,uy);
        if (ul<0.001) v=a;
        else { ux/=ul; uy/=ul; var k=1/Math.max(0.4, ux*a.x+uy*a.y); v={x:ux*k, y:uy*k}; } }
      res.push({x:P[i].x+v.x*d, y:P[i].y+v.y*d});
    }
    return res;
  }

  /* ── tidy orthogonal auto-routing for generated cables ── */
  function termOutset(comp, tid){ var ts=termList(comp), ty=comp.h*0.5; for(var i=0;i<ts.length;i++){ if(ts[i].id===tid){ ty=ts[i].y; break; } } return ty > comp.h*0.5 ? 22 : -22; }
  function zRoute(A,B){ if(Math.abs(A.x-B.x)<4) return [A,{x:A.x,y:B.y}]; if(Math.abs(A.y-B.y)<4) return [A,{x:B.x,y:A.y}]; var my=Math.round((A.y+B.y)/2); return [A,{x:A.x,y:my},{x:B.x,y:my},B]; }
  function autoRoute(cb){
    function endPt(lands){ var xs=0,ys=0,n=0,dy=0; for(var k=0;k<lands.length;k++){ var l=lands[k]; if(!l) continue; var c=findComp(l.compId); if(!c) continue; var w=termWorld(c,l.tid); if(!w) continue; xs+=w.x; ys+=w.y; dy=termOutset(c,l.tid); n++; } return n? {x:Math.round(xs/n), y:Math.round(ys/n+dy)} : null; }
    var A=endPt(cb.landA), B=endPt(cb.landB); if(!A||!B) return;
    cb.pts=zRoute(A,B); buildRoute(cb);
  }

  /* ── auto-resolve component overlaps ── */
  function overlaps(a,b){ var pad=6; return !(a.x+ewid(a)+pad<b.x || b.x+ewid(b)+pad<a.x || a.y+ehei(a)+pad<b.y || b.y+ehei(b)+pad<a.y); }
  function resolveOverlap(c){ var tries=0;
    while(tries<250){ var hit=null; for(var i=0;i<comps.length;i++){ if(comps[i]!==c && overlaps(c,comps[i])){ hit=comps[i]; break; } }
      if(!hit) break; c.x=hit.x+ewid(hit)+18; if (c.x+ewid(c)>LW-4){ c.x=8; c.y=hit.y+ehei(hit)+24; } if (c.y+ehei(c)>LH-4){ c.y=8; } tries++; }
    c.x=clamp(c.x,-6,LW-24); c.y=clamp(c.y,-6,LH-24);
  }

  /* nearest connectable node under a point: a device terminal, a cable conductor tip, or a joint bump */
  function nearestNode(p, r, exclude, includeBumps){ r=r||16; var cand=[];
    if (includeBumps){ var jb=bumpAt(p.x,p.y,r); if(jb){ var jp=jointPos(jb); if(jp) cand.push({t:'bump',joint:jb,d:dist2(p,jp)}); } }
    var ch=conductorHandleAt(p.x,p.y,r,exclude); if(ch){ var hh=condHandle(ch.cb,ch.end,ch.i); cand.push({t:'cond',cb:ch.cb,end:ch.end,i:ch.i,d:dist2(p,hh)}); }
    var tm=termByPoint(p.x,p.y,r); if(tm){ cand.push({t:'term',comp:tm.comp,tid:tm.tid,d:Math.hypot(p.x-tm.x,p.y-tm.y)}); }
    cand.sort(function(a,b){return a.d-b.d;}); return cand[0]||null;
  }
  function nodeKey(n){ if(!n) return ''; if(n.t==='term') return 'T'+n.comp.id+':'+n.tid; if(n.t==='cond') return 'C'+n.cb.id+n.end+n.i; return 'B'+joints.indexOf(n.joint); }
  function isHovered(t, a, b, c){ if(!hoverNode||hoverNode.t!==t) return false;
    if(t==='term') return hoverNode.comp===a && hoverNode.tid===b;
    if(t==='cond') return hoverNode.cb===a && hoverNode.end===b && hoverNode.i===c;
    if(t==='bump') return hoverNode.joint===a; return false; }

  function updateHoverCursor(p){
    var cur='default', ha=null, hr=null, hrz=null;
    if (meter){   // the floating meter grabs the cursor when hovered
      function inRect(z){ return p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h; }
      if (probeHitAt(p, meter.red, meterRedTerm()) || probeHitAt(p, meter.black, meterBlackTerm())){ if(canvas) canvas.style.cursor='grab'; return; }
      if (inRect(meterClose()) || meterModeRects().some(inRect)){ if(canvas) canvas.style.cursor='pointer'; return; }   // clickable controls → pointer, not the pan hand
      if (inRect(meterBody())){ if(canvas) canvas.style.cursor='grab'; return; }
    }
    if (sel && sel.kind==='comp' && dist2(p, compResizeHandle(sel.ref))<12){ cur='nwse-resize'; hrz=sel.ref; }   // resize grip
    else if (sel && sel.kind==='cable'){ var cc=cableControls(sel.ref); var pluggedIn=!!(sel.ref.plug && sel.ref.pluggedInto!=null);
      if (!pluggedIn && dist2(p,cc.rot)<13) cur='pointer';
      else if (dist2(p,cc.extA)<15){ cur='move'; ha='A'; }
      else if (!pluggedIn && dist2(p,cc.extB)<15){ cur='move'; ha='B'; }
      else if (waypointAt(sel.ref,p.x,p.y)>=0) cur='grab'; }
    else if (sel && sel.kind==='comp' && sel.ref.type==='connector'){ if (dist2(p,compRotHandle(sel.ref))<13) cur='pointer'; }
    var node=null;
    if (cur==='default' && plugAt(p.x,p.y)) cur='grab';
    if (cur==='default'){
      node = nearestNode(p, 16, null, true);
      if (node) cur = node.t==='bump' ? 'pointer' : 'crosshair';
      else { var hc=compAt(p.x,p.y);
        if (hc){
          if (rockerZoneAt(hc, (p.x-hc.x)/sc(hc), (p.y-hc.y)/sc(hc))){ cur='pointer'; hr=hc; }   // over the rocker: click toggles
          else cur='move';                                                      // elsewhere on the item: drag moves
        }
        else if (cableBodyAt(p.x,p.y)) cur='move';
      }
    }
    if (canvas) canvas.style.cursor=cur;
    var changed = nodeKey(node)!==nodeKey(hoverNode) || ha!==hoverAnchor || hr!==hoverRocker || hrz!==hoverResize;
    hoverNode = node; hoverAnchor = ha; hoverRocker = hr; hoverResize = hrz;
    if (changed) draw();
  }

  function onDown(e){
    if (mode!=='simulate') return;
    try { if (canvas.setPointerCapture && e.pointerId!=null) canvas.setPointerCapture(e.pointerId); } catch (err) {}
    var p = toLogical(e); DOWN = { x:p.x, y:p.y, moved:false }; hoverNode=null; hoverAnchor=null; hoverRocker=null;
    hideCtx();
    // the floating multimeter sits on top — its probes, buttons and body take priority
    if (meter){
      if (probeHitAt(p, meter.red, meterRedTerm())){ drag={type:'probe', which:'red'}; canvas.style.cursor='grabbing'; return; }
      if (probeHitAt(p, meter.black, meterBlackTerm())){ drag={type:'probe', which:'black'}; canvas.style.cursor='grabbing'; return; }
      var cz=meterClose(); if (p.x>=cz.x&&p.x<=cz.x+cz.w&&p.y>=cz.y&&p.y<=cz.y+cz.h){ toggleMeter(); DOWN=null; return; }
      var mrs=meterModeRects(); for (var mi=0;mi<mrs.length;mi++){ var z=mrs[mi]; if(p.x>=z.x&&p.x<=z.x+z.w&&p.y>=z.y&&p.y<=z.y+z.h){ meter.mode=z.m; meter._beepKey=null; sfxClick(); recompute(); draw(); DOWN=null; return; } }   // re-solve: the A-mode series link appears/disappears with the dial
      var mb=meterBody(); if (p.x>=mb.x&&p.x<=mb.x+mb.w&&p.y>=mb.y&&p.y<=mb.y+mb.h){ drag={type:'meter', dx:p.x-meter.x, dy:p.y-meter.y}; canvas.style.cursor='grabbing'; return; }
    }
    // selected cable: rotate / extend / bend handles take priority — a power cord behaves exactly the
    // same, except while its plug is actually seated in a socket (then rotate + the plug-end grip are
    // locked; drag the plug badge itself to unplug and re-route it).
    if (sel && sel.kind==='cable'){ var cc=cableControls(sel.ref); var scb=sel.ref; var pluggedIn=!!(scb.plug && scb.pluggedInto!=null);
      if (!pluggedIn && dist2(p,cc.rot)<13){ rotateCable(scb); sfxClick(); DOWN=null; draw(); commit(); return; }
      if (dist2(p,cc.extA)<15){ drag={type:'anchor', cb:scb, end:'A', axis:cc.horizA?'H':'V'}; canvas.style.cursor='grabbing'; return; }
      if (!pluggedIn && dist2(p,cc.extB)<15){ drag={type:'anchor', cb:scb, end:'B', axis:cc.horizB?'H':'V'}; canvas.style.cursor='grabbing'; return; }
      var wpi=waypointAt(scb,p.x,p.y);   // drag an existing bend corner → pivot the run after it
      if (wpi>=0){ drag={type:'pivot', cb:scb, splitIndex:wpi, orig:copyPts(scb)}; canvas.style.cursor='grabbing'; return; }
    }
    // selected component: its resize grip takes priority over dragging/toggling
    if (sel && sel.kind==='comp' && dist2(p, compResizeHandle(sel.ref))<13){
      drag={ type:'resize', c:sel.ref }; canvas.style.cursor='nwse-resize'; return; }
    // selected connector: its rotate handle takes priority over dragging the block
    if (sel && sel.kind==='comp' && sel.ref.type==='connector'){ var rh=compRotHandle(sel.ref);
      if (dist2(p,rh)<13){ rotateConnector(sel.ref); recompute(); sfxClick(); DOWN=null; draw(); commit(); return; }
    }
    // grab an appliance plug (takes priority — it sits over the socket face / flex tip)
    var pg = plugAt(p.x,p.y);
    if (pg){ if (pg.pluggedInto!=null) unplug(pg); drag={ type:'plug', cb:pg }; canvas.style.cursor='grabbing'; sfxClick(); return; }
    // click an insulator bump to open that wire-to-wire joint
    var jb = bumpAt(p.x,p.y); if (jb){ removeJoint(jb); DOWN=null; return; }
    // priority: conductor handle → component → cable body
    var ch = conductorHandleAt(p.x,p.y);
    if (ch){ var h=condHandle(ch.cb,ch.end,ch.i); var core=ch.cb.cores[ch.i];
      var wasLanded = (ch.end==='A'?ch.cb.landA[ch.i]:ch.cb.landB[ch.i]) != null;
      var wasJointed = removeJointsAt(ch.cb.id, ch.end, ch.i);   // detaching a jointed lead opens its joint
      drag={ type:'wire', cb:ch.cb, end:ch.end, i:ch.i, ox:h.x, oy:h.y, px:p.x, py:p.y, col:core.col, wasLanded:(wasLanded||wasJointed) };
      if (ch.end==='A') ch.cb.landA[ch.i]=null; else ch.cb.landB[ch.i]=null;   // detach landing while manipulating
      sfxClick(); return; }
    var c = compAt(p.x,p.y);
    if (c){ selectComp(c); drag={ type:'comp', c:c, dx:p.x-c.x, dy:p.y-c.y }; canvas.style.cursor='grabbing';
      if (c.type==='bell'){ c.on=true; recompute(); sfxSwitch(); }   // momentary contact closes on press, opens on release
      return; }
    var cb = cableBodyAt(p.x,p.y);
    if (cb){ if (!(sel && sel.kind==='cable' && sel.ref===cb)) selectCable(cb);   // select if needed
      drag={ type:'moveall', cb:cb, orig:copyPts(cb), sx:p.x, sy:p.y }; canvas.style.cursor='grabbing'; return; }   // drag body = move whole cable
    selectNone();
  }
  function onMove(e){
    if (mode!=='simulate') return;
    var p = toLogical(e); if (DOWN){ if (Math.hypot(p.x-DOWN.x,p.y-DOWN.y)>4) DOWN.moved=true; }
    if (!drag){ updateHoverCursor(p); return; }
    if (drag.type==='probe'){ var pw=meter[drag.which]; pw.x=p.x; pw.y=p.y; var tgt=nearestProbeTarget(p.x,p.y); meter._hover=tgt?{x:tgt.wx,y:tgt.wy}:null; draw(); return; }
    if (drag.type==='meter'){ var nx=clamp(p.x-drag.dx, -24, LW-40), ny=clamp(p.y-drag.dy, -8, LH-30);
      var ddx=nx-meter.x, ddy=ny-meter.y; meter.x=nx; meter.y=ny;
      if(!meter.red.att){ meter.red.x+=ddx; meter.red.y+=ddy; }       // unconnected leads travel with the instrument
      if(!meter.black.att){ meter.black.x+=ddx; meter.black.y+=ddy; } // connected ones stay clamped and the lead extends
      draw(); return; }
    if (drag.type==='wire'){ drag.px=p.x; drag.py=p.y; hoverTerm = termByPoint(p.x,p.y,16);
      hoverNode = nearestNode(p, 18, {cb:drag.cb,end:drag.end,i:drag.i}, false); // light up the snap target (terminal or other wire tip)
      draw(); return; }
    if (drag.type==='comp'){ drag.c.x = clamp(p.x-drag.dx, -10, LW-20); drag.c.y = clamp(p.y-drag.dy, -10, LH-30); draw(); return; }
    if (drag.type==='resize'){ var rc=drag.c, bw=rc.w, bh=rc.h, dx=p.x-rc.x, dy=p.y-rc.y;   // project the pointer onto the base diagonal
      var s=(dx*bw+dy*bh)/(bw*bw+bh*bh); rc.scale=clamp(s, SCALE_MIN, SCALE_MAX);
      if (sel&&sel.ref===rc) { /* live */ } draw(); return; }
    if (drag.type==='moveall'){ var mx=p.x-drag.sx, my=p.y-drag.sy; drag.cb.pts=drag.orig.map(function(q){ return {x:Math.round(q.x+mx), y:Math.round(q.y+my)}; }); buildRoute(drag.cb); draw(); return; }
    if (drag.type==='pivot'){ pivotDrag(drag.cb, drag.splitIndex, drag.orig, p); draw(); return; }
    if (drag.type==='anchor'){ anchorPen(drag, p); draw(); return; }
    if (drag.type==='plug'){ var pc=drag.cb; ensureCable(pc);
      pc.pts[pc.pts.length-1]={ x:Math.round(clamp(p.x,6,LW-6)), y:Math.round(clamp(p.y,6,LH-6)) }; buildRoute(pc);
      hoverSocket=socketUnder(p.x,p.y); draw(); return; }
  }
  function onUp(e){
    // multimeter probe: a TAP toggles the clamp (connected → unclip; free-over-a-node → clip on);
    // a DRAG re-positions and clamps onto whatever node it's dropped on.
    if (drag && drag.type==='probe'){ var pw=meter[drag.which];
      if (DOWN && !DOWN.moved){
        if (pw.att){ var rz=probeResolve(pw); pw.att=null; pw.x=rz.pos.x+18; pw.y=rz.pos.y+18; sfxClick(); }   // unclip: park just off the node
        else { var tg=nearestProbeTarget(pw.x,pw.y); if(tg){ pw.att=tg.att; pw.x=tg.wx; pw.y=tg.wy; sfxSwitch(); } }
      } else {
        var tgt=nearestProbeTarget(pw.x,pw.y); if (tgt){ pw.att=tgt.att; pw.x=tgt.wx; pw.y=tgt.wy; sfxSwitch(); } else pw.att=null;
      }
      meter._hover=null; drag=null; DOWN=null; if(canvas) canvas.style.cursor='default';
      recompute(); draw(); return; }   // re-solve: clipping/unclipping the A-mode probes changes the circuit itself
    if (drag && drag.type==='meter'){ drag=null; DOWN=null; if(canvas) canvas.style.cursor='default'; draw(); return; }
    if (drag && drag.type==='wire'){
      if (DOWN && DOWN.moved){
        // dragged: land on a terminal → else splice onto another conductor tip → else leave disconnected
        var t = hoverTerm || termByPoint(drag.px, drag.py, 16);
        if (t){ var land={compId:t.comp.id, tid:t.tid}; if (drag.end==='A') drag.cb.landA[drag.i]=land; else drag.cb.landB[drag.i]=land; $('wire-hint').textContent='Conductor connected to '+t.tid+'.'; sfxSwitch(); }
        else {
          var ch2 = conductorHandleAt(drag.px, drag.py, 18, {cb:drag.cb, end:drag.end, i:drag.i});
          if (ch2){ joints.push({ a:{id:drag.cb.id,end:drag.end,i:drag.i}, b:{id:ch2.cb.id,end:ch2.end,i:ch2.i} }); $('wire-hint').textContent='Wires joined — an insulator connector appears. Click it to open the joint.'; sfxSwitch(); }
          else if (drag.wasLanded){ $('wire-hint').textContent='Conductor disconnected. Drag it back onto a terminal or another wire to reconnect.'; sfxSwitch(); }
        }
      } else if (drag.wasLanded){
        // a simple tap on a landed conductor disconnects just that one wire
        $('wire-hint').textContent='Conductor disconnected. Drag it onto a terminal to reconnect.'; sfxSwitch();
      }
      hoverTerm=null;
    }
    if (drag && drag.type==='plug'){ var pcb=drag.cb; var pu=toLogical(e); var s=socketUnder(pu.x,pu.y);
      if (s){ plugInto(pcb, s, pu.x); $('wire-hint').textContent='Plug inserted — Line, Neutral and Earth connected through the socket.'; sfxSwitch(); }
      else { $('wire-hint').textContent='Plug unplugged — drag it onto a socket to power the appliance.'; }
    }
    if (drag && drag.type==='comp' && drag.c.type==='bell' && drag.c.on){ drag.c.on=false; }   // bell push releases → contact opens
    if (DOWN && !DOWN.moved && drag && drag.type==='comp'){ toggleComp(drag.c, DOWN.x); }
    if (DOWN && DOWN.moved && drag && drag.type==='comp'){ resolveOverlap(drag.c); }
    if (drag && drag.type==='resize' && DOWN && DOWN.moved) resolveOverlap(drag.c);
    // record a history step for structural edits (not plain taps/toggles)
    var structural = drag && (drag.type==='wire' || drag.type==='pivot' || drag.type==='plug' || ((drag.type==='anchor' || drag.type==='moveall' || drag.type==='resize') && DOWN && DOWN.moved) || (drag.type==='comp' && DOWN && DOWN.moved));
    drag=null; DOWN=null; hoverNode=null; hoverAnchor=null; hoverSocket=null; hoverRocker=null; hoverResize=null; if(canvas) canvas.style.cursor='default'; recompute(); draw();
    if (structural) commit();
  }

  function toggleComp(c, px){
    var blx = px!=null ? (px-c.x)/sc(c) : c.w/2;   // tap x in the component's BASE (unscaled) coordinates
    if (c.load) return;   // loads are operated by the circuit (switch/socket/breaker), never by tapping the appliance — use the inspector's State button for the appliance's own switch
    else if (c.type==='sw1'){ c.on=!c.on; sfxSwitch(); }
    else if (c.type==='sw2' || c.type==='swi'){ c.pos = c.pos===2?1:2; sfxSwitch(); }
    else if (c.type==='dpsw'){ c.on=!c.on; sfxSwitch(); }
    else if (c.gangs){ // tap the rocker nearest the tap point → toggle that gang
      var ts=defOf(c).terminals; var best=0, bd=1e9;
      for (var g=0;g<c.gangs.length;g++){ var tx=0; for(var k=0;k<ts.length;k++) if(ts[k].id==='L'+(g+1)) tx=ts[k].x;
        var d=Math.abs(tx-blx); if(d<bd){ bd=d; best=g; } }
      c.gangs[best]=!c.gangs[best]; sfxSwitch();
    }
    else if (c.type==='mcb'){ if(c.tripped){ c.tripped=false; c._heat=0; c.on=true; } else { c.on=!c.on; } sfxSwitch(); }
    else if (c.type==='supply'){ // tap the control nearest the tap point: main switch / main MCB / RCD
      var lx=blx;
      if (lx < 46){ powered=!powered; if(powered){ tripped=false; tHeat=0; sfxOn(); } else sfxClick(); setPowerBtn(); }
      else if (lx < 82){ if(tripped){ tripped=false; tHeat=0; } else c.on=(c.on===false); sfxSwitch(); }   // MCB: reset a trip, else isolate
      else { c.rcd=!c.rcd; sfxSwitch(); }                                                                     // RCD fitted / removed
      if (sel && sel.ref===c) buildInspector();
    }
    else if (c.type==='socket' || c.type==='socketf'){ c.on=!c.on; sfxSwitch(); }
    else if (c.type==='socket2'){ if(!Array.isArray(c.on)) c.on=[true,true]; var k=blx < c.w/2 ? 0 : 1; c.on[k]=!c.on[k]; sfxSwitch(); }   // tap left/right outlet switch
    else if (c.type==='socketu'){ return; }                        // unswitched — no rocker to operate
    else if (c.type==='pir'){ c.motion=!c.motion; sfxSwitch(); }   // simulate motion / no motion
    else if (c.type==='bell'){ return; }                           // momentary — handled by press-and-hold in onDown/onUp
    else if (c.type==='changeover'){ c.pos = c.pos===1 ? 0 : (c.pos===0 ? 2 : 1); sfxSwitch(); }   // cycle Mains → Off → Gen
    else if (c.type==='dimmer'){ var step=(blx < c.w/2) ? -10 : 10; c.level=clamp((c.level==null?100:c.level)+step, 0, 100); sfxSwitch(); }   // ◀ dim down / ▶ dim up
    else if (c.type==='smoke'){ c.smoke=!c.smoke; c.smoke?sfxBuzz():sfxClick(); }        // simulate smoke / clear
    else if (c.type==='photo'){ c.dark=!c.dark; sfxSwitch(); }                            // day / night
    else if (c.type==='isolator'){ c.on=!c.on; sfxSwitch(); }
    else if (c.type==='generator'){ c.running=!c.running; c.running?sfxOn():sfxClick(); }
    else if (c.type==='selector'){ c.pos = (c.pos===3?1:(c.pos||1)+1); sfxSwitch(); }     // cycle 1 → 2 → 3
    else if (c.type==='timer'){ c.on=true; c.tleft=c.dur||8; sfxSwitch(); }               // tap to run the staircase timer
    else return;
    recompute();
  }

  /* ═══════════════════════════════════════════════════════════════
     PLACEMENT / CABLES
     ═══════════════════════════════════════════════════════════════ */
  function addComp(type, x, y){
    var d=COMP[type]; var c={ id:nextId++, type:type, load:false, x:x!=null?x:LW/2-d.w/2, y:y!=null?y:LH/2-d.h/2, w:d.w, h:d.h };
    if (type==='sw1') c.on=false;
    if (type==='sw2' || type==='swi') c.pos=1;
    if (type==='dpsw') c.on=false;
    if (type==='socket'){ c.on=true; c.amp=13; }   // switched socket, on by default, 13 A unless upgraded
    if (type==='socket2'){ c.on=[true,true]; c.amp=13; }
    if (type==='socketf'){ c.on=true; c.amp=13; c.fuse=13; c.fuseBlown=false; c._fheat=0; }
    if (type==='pir') c.motion=false;
    if (type==='bell') c.on=false;                                   // momentary — closed only while held
    if (type==='socketu'){ c.on=true; c.amp=13; }                    // unswitched: outlet is permanently live
    if (type==='spd') c.spent=false;                                 // surge protector: healthy vs end-of-life
    if (type==='changeover') c.pos=1;                                // 1 = Mains, 0 = Off, 2 = Generator
    if (type==='dimmer'){ c.level=100; c.rmax=d.params.rmax; }       // 100 % = full (0 Ω), 0 % = max resistance
    if (type==='smoke') c.smoke=false;                               // smoke detected → alarm
    if (type==='photo') c.dark=false;                               // dusk-to-dawn: switches the load on when dark
    if (type==='isolator') c.on=false;                              // double-pole isolator, off by default
    if (type==='generator') c.running=false;                        // standby set — a second live source when running
    if (type==='selector') c.pos=1;                                 // rotary selector position (1..3)
    if (type==='timer'){ c.on=false; c.dur=d.params.dur; c.tleft=0; }   // staircase timer — tap to run, auto-off
    if (type==='fcu'){ c.fuse=d.params.fuse; c.fuseBlown=false; }
    if (type==='mcb'){ c.mcb=d.params.mcb; c.on=true; c.tripped=false; c._heat=0; }
    if (d.gangs){ c.gangs=[]; for(var g=0;g<d.gangs;g++) c.gangs.push(false); }
    if (type==='supply'){ c.mcb=d.params.mcb; c.rcd=d.params.rcd; c.on=true; }
    if (type==='connector') setConnectorMode(c, '1to5');
    comps.push(c); if (x==null) resolveOverlap(c); return c;
  }
  function addLoad(type, x, y){
    var d=LOADS[type]; var c={ id:nextId++, type:type, load:true, x:x!=null?x:LW/2-d.w/2, y:y!=null?y:LH/2-d.h/2, w:d.w, h:d.h, watt:d.watt, on:true };
    comps.push(c); if (x==null) resolveOverlap(c); return c;
  }
  function addCable(kind, mm, ax, ay, bx, by){
    var K=CABLE_KINDS[kind]; var tbl=K.flex?SIZES_FLEX:SIZES_FIXED; var sz=null;
    for (var i=0;i<tbl.length;i++){ if (Math.abs(tbl[i].mm-mm)<0.01){ sz=tbl[i]; break; } } if(!sz) sz=tbl[0];
    var cb={ id:nextId++, kind:kind, flex:K.flex, armoured:!!K.armoured, mm:sz.mm, swg:sz.swg, ratingA:sz.a, mvam:sz.mv, cores:K.cores.slice(),
      ax:ax, ay:ay, bx:bx, by:by, landA:[], landB:[] };
    if (K.plug){ cb.plug='B'; cb.pluggedInto=null; cb.plugFuse=13; cb.plugFuseBlown=false; }   // power cord: end B is a moulded, fused 3-pin plug (BS 1363)
    for (i=0;i<cb.cores.length;i++){ cb.landA.push(null); cb.landB.push(null); }
    snapCableAxis(cb);
    cables.push(cb); return cb;
  }
  function landCond(cb, end, i, comp, tid){ var l={compId:comp.id, tid:tid}; if(end==='A') cb.landA[i]=l; else cb.landB[i]=l; }

  /* ── cable length (m) & voltage-drop coefficient ── */
  var PX_PER_M = 12;   // board-pixels per metre for the auto length estimate
  function cableMvam(cb){ if(cb.mvam!=null) return cb.mvam; var tbl=cb.flex?SIZES_FLEX:SIZES_FIXED; for(var i=0;i<tbl.length;i++) if(Math.abs(tbl[i].mm-cb.mm)<0.01) return tbl[i].mv; return 18; }
  function cableLengthM(cb){
    if (cb.lengthM!=null) return cb.lengthM;               // user-pinned length
    ensureCable(cb); buildRoute(cb); var P=cb.path, L=0;
    for (var i=1;i<P.length;i++) L+=Math.hypot(P[i].x-P[i-1].x, P[i].y-P[i-1].y);
    return Math.max(1, Math.round(L/PX_PER_M));            // else estimate from the drawn run
  }
  function cableVdrop(cb){ return cableMvam(cb) * (cb._curr||0) * cableLengthM(cb) / 1000; }   // V across this cable at its current

  /* ── edit a placed cable in-place (from the inspector) ── */
  function applyCableSize(cb, mm){ var tbl=cb.flex?SIZES_FLEX:SIZES_FIXED, sz=tbl[0], bd=1e9;
    for (var i=0;i<tbl.length;i++){ var d=Math.abs(tbl[i].mm-mm); if(d<bd){ bd=d; sz=tbl[i]; } }
    cb.mm=sz.mm; cb.swg=sz.swg; cb.ratingA=sz.a; cb.mvam=sz.mv; }
  function changeCableKind(cb, kind){
    if (kind===cb.kind) return; var K=CABLE_KINDS[kind]; var newCores=K.cores.slice(), m=newCores.length, n=cb.cores.length;
    var plugChange = (!!K.plug) !== (!!cb.plug);
    var newA=[], newB=[];
    for (var i=0;i<m;i++){ newA.push((!plugChange && i<n)?cb.landA[i]:null); newB.push((!plugChange && i<n)?cb.landB[i]:null); }
    joints=joints.filter(function(jt){ if(jt.a.id===cb.id && (plugChange||jt.a.i>=m)) return false; if(jt.b.id===cb.id && (plugChange||jt.b.i>=m)) return false; return true; });
    cb.kind=kind; cb.flex=K.flex; cb.armoured=!!K.armoured; cb.cores=newCores; cb.landA=newA; cb.landB=newB;
    if (K.plug && !cb.plug){ cb.plug='B'; cb.pluggedInto=null; cb.plugFuse=13; cb.plugFuseBlown=false; cb._pfheat=0; cb.plugSlot=0; }
    else if (!K.plug && cb.plug){ cb.plug=null; cb.pluggedInto=null; }
    applyCableSize(cb, cb.mm);   // reselect a valid size in the new family (fixed ↔ flex)
  }

  /* ── power-cord plug (cable end B) ── */
  var PLUG_DROP = 48;   // a seated plug strain-relieves its cord straight DOWN before it flexes away
  function socketFaceX(s, slot){ return s.x + ewid(s)*(s.type==='socket2' ? (slot===1?0.72:0.28) : 0.5); }   // outlet face centre
  function socketPlugPoint(s, slot){ return { x: Math.round(socketFaceX(s, slot||0)), y: Math.round(s.y + ehei(s)*0.42) }; }   // where the plug body seats
  function socketAnchor(s, slot){ var p=socketPlugPoint(s, slot); return { x:p.x, y:p.y+PLUG_DROP }; }                 // where the flexible cord attaches (below the plug)
  function plugCenter(cb){ if(cb.pluggedInto!=null){ var s=findComp(cb.pluggedInto); if(s) return socketPlugPoint(s, cb.plugSlot||0); } var P=cb.path||cb.pts; var q=P[P.length-1]; return {x:q.x,y:q.y}; }
  function syncPlugCable(cb){                        // keep a plugged cord anchored below its socket outlet
    if(!cb.plug || cb.pluggedInto==null) return; ensureCable(cb);
    var s=findComp(cb.pluggedInto); if(s){ var a=socketAnchor(s, cb.plugSlot||0); cb.pts[cb.pts.length-1]={x:a.x,y:a.y}; } else cb.pluggedInto=null;
  }
  function plugAt(px,py,r){ r=r||18; for(var i=cables.length-1;i>=0;i--){ var cb=cables[i]; if(!cb.plug) continue; cableGeom(cb); var c=plugCenter(cb); if((px-c.x)*(px-c.x)+(py-c.y)*(py-c.y)<r*r) return cb; } return null; }
  function socketUnder(px,py){ for(var i=comps.length-1;i>=0;i--){ var c=comps[i]; if(!isSocket(c)) continue; if(px>=c.x-6&&px<=c.x+ewid(c)+6&&py>=c.y-6&&py<=c.y+ehei(c)+6) return c; } return null; }
  function plugInto(cb, s, px){
    var slot=0, sf='';
    if (s.type==='socket2'){ slot = (px!=null && px > s.x+s.w/2) ? 1 : 0;   // choose the outlet you dropped on
      var taken=cables.some(function(o){ return o!==cb && o.plug && o.pluggedInto===s.id && (o.plugSlot||0)===slot; });
      if (taken) slot = 1-slot; sf = slot===1?'1':''; }
    cb.plugSlot=slot;
    landCond(cb,'B',0,s,'Lo'+sf); landCond(cb,'B',1,s,'No'+sf); if(cb.cores.length>2) landCond(cb,'B',2,s,'Eo'+sf);
    cb.pluggedInto=s.id; var a=socketAnchor(s, slot); cb.pts[cb.pts.length-1]={x:a.x,y:a.y}; buildRoute(cb); }
  function unplug(cb){ for(var k=0;k<cb.cores.length;k++) cb.landB[k]=null; cb.pluggedInto=null; }

  /* ── inspector "Power cord" toggle: add/remove a cord already plugged into a socket outlet ── */
  function cordAt(compId, slot){ slot=slot||0; for(var i=0;i<cables.length;i++){ var cb=cables[i]; if(cb.plug && cb.pluggedInto===compId && (cb.plugSlot||0)===slot) return cb; } return null; }
  function addCordTo(c, slot){
    var ax=Math.round(c.x-90), ay=Math.round(c.y+ehei(c)*0.35);
    var cb=addCable('cord', 1.25, ax, ay, c.x, c.y);   // 1.25 mm² flex — matches a 13 A moulded plug
    ensureCable(cb);
    plugInto(cb, c, slot===1 ? c.x+ewid(c) : c.x);     // same auto-seat logic a manual drag-and-drop uses
    return cb;
  }
  function removeCordAt(compId, slot){
    var cb=cordAt(compId, slot); if(!cb) return;
    cables=cables.filter(function(o){ return o!==cb; });
    joints=joints.filter(function(jt){ return jt.a.id!==cb.id && jt.b.id!==cb.id; });
    if (sel && sel.kind==='cable' && sel.ref===cb) selectNone();
  }

  function deleteSelected(){
    if (!sel) return;
    if (propsOpen()) closeProps();   // don't leave the Properties popup open over a deleted item
    if (sel.kind==='comp'){ var id=sel.ref.id; comps=comps.filter(function(c){return c.id!==id;});
      // drop landings referencing it; unplug any cord seated in a deleted socket
      cables.forEach(function(cb){ for (var i=0;i<cb.cores.length;i++){ if(cb.landA[i]&&cb.landA[i].compId===id) cb.landA[i]=null; if(cb.landB[i]&&cb.landB[i].compId===id) cb.landB[i]=null; } if(cb.pluggedInto===id) cb.pluggedInto=null; });
    } else { var cid=sel.ref.id; cables=cables.filter(function(c){return c.id!==cid;});
      joints=joints.filter(function(jt){ return jt.a.id!==cid && jt.b.id!==cid; }); }
    selectNone(); recompute(); draw(); commit(); sfxClick();
  }
  function clearAll(){ comps=[]; cables=[]; joints=[]; powered=false; tripped=false; tHeat=0; selectNone(); setPowerBtn(); recompute(); draw(); }

  /* ═══════════════════════════════════════════════════════════════
     SELECTION + INSPECTOR
     ═══════════════════════════════════════════════════════════════ */
  function selectComp(c){ sel={kind:'comp',ref:c}; buildInspector(); updateToolButtons(); draw(); }
  function selectCable(cb){ sel={kind:'cable',ref:cb}; buildInspector(); updateToolButtons(); draw(); }
  function selectNone(){ sel=null; buildInspector(); updateToolButtons(); }

  function buildInspector(){
    var box=inspTarget||$('inspector'); box.innerHTML='';
    // "Selected Item" lives at the top of the side panel: open it while something is
    // selected so its properties are right at hand, fold it away when nothing is.
    // (When rendering into the double-click properties popup, leave the side panel alone.)
    if (!inspTarget){ var ihead=document.querySelector('.sp-cat[data-sp="insp"]');
      if (ihead) ihead.classList.toggle('collapsed', !sel); }
    if (!sel){ box.innerHTML='<p class="insp-empty">Select a component to edit its rating, or a load to set its wattage.</p>'; return; }
    if (sel.kind==='cable'){ var cb=sel.ref;
      box.appendChild(el('div','insp-title', CABLE_KINDS[cb.kind].name));
      // core type — change the cable family in place (landings kept where the cores line up)
      var tr=el('div','insp-row'); tr.appendChild(el('label',null,'Type'));
      var tsel=el('select','insp-select'); Object.keys(CABLE_KINDS).forEach(function(k){ var o=el('option',null,CABLE_KINDS[k].name); o.value=k; if(k===cb.kind)o.selected=true; tsel.appendChild(o); });
      tsel.onchange=function(){ changeCableKind(cb, tsel.value); buildInspector(); recompute(); draw(); commit(); };
      tr.appendChild(tsel); box.appendChild(tr);
      // size — mm² / SWG / current rating
      var szr=el('div','insp-row'); szr.appendChild(el('label',null,'Size'));
      var szsel=el('select','insp-select'); (cb.flex?SIZES_FLEX:SIZES_FIXED).forEach(function(s){ var o=el('option',null,(s.mm<1?s.mm.toFixed(2):s.mm.toFixed(1))+' mm² · SWG '+s.swg+' · '+s.a+' A'); o.value=s.mm; if(Math.abs(s.mm-cb.mm)<0.01)o.selected=true; szsel.appendChild(o); });
      szsel.onchange=function(){ applyCableSize(cb, parseFloat(szsel.value)); buildInspector(); recompute(); draw(); commit(); };
      szr.appendChild(szsel); box.appendChild(szr);
      box.appendChild(el('div','insp-sub', cb.cores.length+'-core '+(cb.flex?'flex':'sheathed')+' · rated <b style="color:var(--accent)">'+cb.ratingA+' A</b> (≈'+round(cb.ratingA*volts/1000,1)+' kW)'));
      if (cb.plug){
        var pfr=el('div','insp-row'); pfr.appendChild(el('label',null,'Plug fuse'));
        var pfs=el('select','insp-select'); [3,5,13].forEach(function(a){ var o=el('option',null,a+' A'); o.value=a; if(a===cb.plugFuse)o.selected=true; pfs.appendChild(o); });
        pfs.onchange=function(){ cb.plugFuse=+pfs.value; cb.plugFuseBlown=false; cb._pfheat=0; buildInspector(); recompute(); draw(); commit(); };
        pfr.appendChild(pfs); box.appendChild(pfr);
        if (cb.plugFuseBlown){
          var rp=el('button','btn','Replace fuse'); rp.style.marginTop='6px';
          rp.onclick=function(){ cb.plugFuseBlown=false; cb._pfheat=0; buildInspector(); recompute(); draw(); commit(); sfxClick(); };
          box.appendChild(rp);
          box.appendChild(el('div','insp-sub','⚠ The plug fuse has <b>blown</b> — the appliance is dead until it is replaced.'));
        } else {
          box.appendChild(el('div','insp-sub','Every BS 1363 3-pin plug carries its own cartridge fuse protecting the flex. Match the fuse to the flex: 3 A for light flex, 13 A for heavy.'));
        }
      }
      // run length (auto from the drawn route, or pin your own) + live voltage drop
      var lr=el('div','insp-row'); lr.appendChild(el('label',null,'Length (m)'));
      var li=el('input'); li.type='number'; li.className='insp-select'; li.min=1; li.max=200; li.step=1; li.value=cableLengthM(cb);
      li.onchange=function(){ var v=parseFloat(li.value); cb.lengthM=(isFinite(v)&&v>0)?Math.round(v):null; buildInspector(); recompute(); draw(); commit(); };
      lr.appendChild(li); box.appendChild(lr);
      var vd=cb._vdrop||0, vpct=vd/volts*100;
      var vr=el('div','insp-row'); vr.appendChild(el('label',null,'Volt drop'));
      var vs=el('span','insp-val', round(vd,2)+' V · '+round(vpct,1)+'%'); if(vpct>5) vs.style.color='var(--red)';
      vr.appendChild(vs); box.appendChild(vr);
      box.appendChild(el('div','insp-sub','Drop = mV/A/m × I × L: '+cableMvam(cb)+' mV/A/m × '+round(cb._curr||0,1)+' A × '+cableLengthM(cb)+' m. Keep under <b>3%</b> (lighting) / <b>5%</b> (power).'+(cb.lengthM!=null?' <i>Length pinned — clear the box to auto-estimate.</i>':'')));
      if (!inspTarget){ var del=el('button','btn btn-ghost','🗑 Delete cable'); del.style.marginTop='6px'; del.onclick=deleteSelected; box.appendChild(del); }
      return;
    }
    var c=sel.ref;
    if (c.load){ var d=LOADS[c.type];
      box.appendChild(el('div','insp-title', d.name + (d.classI?' · Class I (earthed)':' · Class II')));
      var row=el('div','insp-row'); row.appendChild(el('label',null,'Power'));
      var sl=el('input'); sl.type='range'; sl.className='sim-slider'; sl.min=d.min; sl.max=d.max; sl.step=d.max>500?10:1; sl.value=c.watt;
      var val=el('span','insp-val', c.watt+' W');
      sl.oninput=function(){ c.watt=+sl.value; val.textContent=c.watt+' W'; recompute(); draw(); };
      sl.onchange=function(){ commit(); };
      row.appendChild(sl); row.appendChild(val); box.appendChild(row);
      var row2=el('div','insp-row'); row2.appendChild(el('label',null,'Current')); row2.appendChild(el('span','insp-val', round(c.watt/volts,2)+' A')); box.appendChild(row2);
      if (R && R.loadVdropPct && R.loadVdropPct[c.id]!=null){ var vp=R.loadVdropPct[c.id], lim=(c.type==='led'||c.type==='lamp')?3:5;
        var vrow=el('div','insp-row'); vrow.appendChild(el('label',null,'Volt drop'));
        var vspan=el('span','insp-val', round(R.loadVdrop[c.id],1)+' V · '+round(vp,1)+'%'); if(vp>lim) vspan.style.color='var(--red)';
        vrow.appendChild(vspan); box.appendChild(vrow);
        box.appendChild(el('div','insp-sub','Total volt drop from the consumer unit to this appliance (limit '+lim+' %).')); }
      var onr=el('div','insp-row'); onr.appendChild(el('label',null,'State'));
      var ob=el('button','btn '+(c.on?'on':'btn-ghost'), c.on?'ON':'OFF'); ob.onclick=function(){ c.on=!c.on; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; onr.appendChild(ob); box.appendChild(onr);
    } else if (c.type==='supply'){
      box.appendChild(el('div','insp-title','Consumer Unit'));
      var mr=el('div','insp-row'); mr.appendChild(el('label',null,'MCB (A)'));
      var msel=el('select','insp-select'); [6,10,16,20,32,40].forEach(function(a){ var o=el('option',null,a+' A'); o.value=a; if(a===c.mcb)o.selected=true; msel.appendChild(o); });
      msel.onchange=function(){ c.mcb=+msel.value; recompute(); draw(); commit(); }; mr.appendChild(msel); box.appendChild(mr);
      var rr2=el('div','insp-row'); rr2.appendChild(el('label',null,'RCD 30mA'));
      var rb=el('button','btn '+(c.rcd?'on':'btn-ghost'), c.rcd?'FITTED':'NONE'); rb.onclick=function(){ c.rcd=!c.rcd; buildInspector(); recompute(); draw(); commit(); }; rr2.appendChild(rb); box.appendChild(rr2);
    } else if (c.type==='fcu'){
      box.appendChild(el('div','insp-title','Fused Spur'));
      var fr=el('div','insp-row'); fr.appendChild(el('label',null,'Fuse (A)'));
      var fsel=el('select','insp-select'); [3,5,13,20,32].forEach(function(a){ var o=el('option',null,a+' A'); o.value=a; if(a===c.fuse)o.selected=true; fsel.appendChild(o); });
      fsel.onchange=function(){ c.fuse=+fsel.value; c.fuseBlown=false; c._fheat=0; recompute(); draw(); commit(); }; fr.appendChild(fsel); box.appendChild(fr);
      box.appendChild(el('div','insp-sub','Feeds a fixed appliance through its own fuse. Use <b>20 A / 32 A</b> for heavy loads like a water heater — but the fuse must stay at or below the cable rating it protects.'));
    } else if (c.type==='mcb'){
      box.appendChild(el('div','insp-title','MCB Breaker'+(c.tripped?' · TRIPPED':(c.on?' · on':' · off'))));
      var mr2=el('div','insp-row'); mr2.appendChild(el('label',null,'Rating (A)'));
      var msel2=el('select','insp-select'); [6,10,16,20,32,40].forEach(function(a){ var o=el('option',null,a+' A'); o.value=a; if(a===c.mcb)o.selected=true; msel2.appendChild(o); });
      msel2.onchange=function(){ c.mcb=+msel2.value; c.tripped=false; c._heat=0; recompute(); draw(); commit(); }; mr2.appendChild(msel2); box.appendChild(mr2);
      var br=el('div','insp-row'); br.appendChild(el('label',null,'State'));
      var bb=el('button','btn '+((c.on&&!c.tripped)?'on':'btn-ghost'), c.tripped?'RESET':(c.on?'ON':'OFF')); bb.onclick=function(){ toggleComp(c); buildInspector(); draw(); commit(); }; br.appendChild(bb); box.appendChild(br);
      box.appendChild(el('div','insp-sub','Place in-line on a Line conductor to protect a section. Trips on overload above its rating.'));
    } else if (c.type==='connector'){
      box.appendChild(el('div','insp-title','Connector Block'));
      var cr=el('div','insp-row'); cr.appendChild(el('label',null,'Config'));
      var csel=el('select','insp-select'); Object.keys(CONNECTOR_MODES).forEach(function(k){ var o=el('option',null,CONNECTOR_MODES[k].name); o.value=k; if((c.cmode||'1to10')===k)o.selected=true; csel.appendChild(o); });
      csel.onchange=function(){ cables.forEach(function(cb){ for(var i=0;i<cb.cores.length;i++){ if(cb.landA[i]&&cb.landA[i].compId===c.id) cb.landA[i]=null; if(cb.landB[i]&&cb.landB[i].compId===c.id) cb.landB[i]=null; } }); setConnectorMode(c, csel.value); recompute(); draw(); commit(); };
      cr.appendChild(csel); box.appendChild(cr);
      var orow=el('div','insp-row'); orow.appendChild(el('label',null,'Orientation'));
      var ob2=el('button','btn','↻ Rotate 90°'); ob2.onclick=function(){ rotateConnector(c); recompute(); draw(); commit(); sfxClick(); buildInspector(); }; orow.appendChild(ob2); box.appendChild(orow);
      box.appendChild(el('div','insp-sub','A distribution block. <b>1 → 5 / 1 → 10</b>: every terminal is one common node (feed one in, tap several out). <b>2 × 5</b>: two separate bars — a Line bar and a Neutral bar — so you can split L and N on one block. <b>Rotate</b> (button, toolbar ↻, or <b>R</b>) turns it in 90° steps; changing the config clears its connections.'));
    } else if (c.gangs){ box.appendChild(el('div','insp-title', c.gangs.length+'-Gang 1-Way Switch'));
      box.appendChild(el('div','insp-sub','One common Line (L) feed, '+c.gangs.length+' independent outputs (L1…L'+c.gangs.length+'). Tap a rocker on the board to switch that gang.'));
      var gr=el('div','insp-row'); gr.appendChild(el('label',null,'Gangs'));
      c.gangs.forEach(function(on,gi){ var gb=el('button','btn '+(on?'on':'btn-ghost'), 'L'+(gi+1)); gb.style.minWidth='auto'; gb.style.padding='6px 10px'; gb.onclick=function(){ c.gangs[gi]=!c.gangs[gi]; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; gr.appendChild(gb); });
      box.appendChild(gr);
    } else if (c.type==='sw1'){ box.appendChild(el('div','insp-title','1-Way Switch')); box.appendChild(el('div','insp-sub','Tap on the board to flip. Connects COM ↔ L1 when ON.')); }
    else if (c.type==='sw2'){ box.appendChild(el('div','insp-title','2-Way Switch')); box.appendChild(el('div','insp-sub','Tap to change position: COM ↔ L1 or COM ↔ L2.')); }
    else if (c.type==='swi'){ box.appendChild(el('div','insp-title','Intermediate Switch')); box.appendChild(el('div','insp-sub','A crossover switch for 3-plus-way lighting. Sits between two 2-way switches on the pair of strappers (L1/L2 in, L3/L4 out) and swaps them: <b>straight</b> (L1→L3, L2→L4) or <b>crossed</b> (L1→L4, L2→L3). Tap to change.')); }
    else if (c.type==='dpsw'){ box.appendChild(el('div','insp-title','45A Cooker / DP Switch')); box.appendChild(el('div','insp-sub','A double-pole isolator for a cooker or shower circuit: it breaks <b>both Line and Neutral</b> together. Wire Lin/Nin from the breaker and Lout/Nout to the appliance. Tap to switch; the neon glows when it is on and live.')); }
    else if (isSocket(c)){ var dbl=c.type==='socket2', fsd=c.type==='socketf', unsw=c.type==='socketu'; box.appendChild(el('div','insp-title',(c.amp||13)+'A '+(dbl?'Double':(fsd?'Fused':(unsw?'Unswitched':'Switched')))+' Socket'));
      var ar=el('div','insp-row'); ar.appendChild(el('label',null,'Rating (A)'));
      var asel=el('select','insp-select'); [13,16,32].forEach(function(a){ var o=el('option',null,a+' A'); o.value=a; if(a===(c.amp||13))o.selected=true; asel.appendChild(o); });
      asel.onchange=function(){ c.amp=+asel.value; buildInspector(); recompute(); draw(); commit(); }; ar.appendChild(asel); box.appendChild(ar);
      if (fsd){ var fr2=el('div','insp-row'); fr2.appendChild(el('label',null,'Fuse (A)'));
        var fsel2=el('select','insp-select'); [3,5,13].forEach(function(a){ var o=el('option',null,a+' A'); o.value=a; if(a===c.fuse)o.selected=true; fsel2.appendChild(o); });
        fsel2.onchange=function(){ c.fuse=+fsel2.value; c.fuseBlown=false; c._fheat=0; buildInspector(); recompute(); draw(); commit(); }; fr2.appendChild(fsel2); box.appendChild(fr2);
        if (c.fuseBlown){ var rpb=el('button','btn','Replace fuse'); rpb.style.marginTop='6px'; rpb.onclick=function(){ c.fuseBlown=false; c._fheat=0; buildInspector(); recompute(); draw(); commit(); sfxClick(); }; box.appendChild(rpb); }
      }
      if (unsw){ var ur=el('div','insp-row'); ur.appendChild(el('label',null,'Outlet')); ur.appendChild(el('span','insp-val','ALWAYS LIVE')); box.appendChild(ur); }
      else { var kr=el('div','insp-row'); kr.appendChild(el('label',null,dbl?'Switches':'Switch'));
        if (dbl){ if(!Array.isArray(c.on)) c.on=[true,true]; c.on.forEach(function(on,oi){ var ob=el('button','btn '+(on?'on':'btn-ghost'), (oi===0?'L ':'R ')+(on?'ON':'OFF')); ob.style.minWidth='auto'; ob.style.padding='6px 9px'; ob.onclick=function(){ c.on[oi]=!c.on[oi]; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; kr.appendChild(ob); }); }
        else { var kb=el('button','btn '+(c.on?'on':'btn-ghost'), c.on?'ON':'OFF'); kb.onclick=function(){ c.on=!c.on; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; kr.appendChild(kb); }
        box.appendChild(kr); }
      // "Power cord" toggle — spawns (or removes) a cord already plugged into this outlet,
      // seated with the exact same plugInto() logic a manual drag-and-drop uses.
      var pr=el('div','insp-row'); pr.appendChild(el('label',null,dbl?'Power cords':'Power cord'));
      if (dbl){
        [0,1].forEach(function(slot){ var has=!!cordAt(c.id, slot);
          var pb=el('button','btn '+(has?'on':'btn-ghost'), (slot===0?'L ':'R ')+(has?'PLUGGED':'ADD'));
          pb.style.minWidth='auto'; pb.style.padding='6px 9px';
          pb.onclick=function(){ if(cordAt(c.id,slot)) removeCordAt(c.id,slot); else addCordTo(c,slot); buildInspector(); recompute(); draw(); commit(); sfxSwitch(); };   // keep the socket selected so the toggle stays a live indicator
          pr.appendChild(pb); });
      } else {
        var hasCord=!!cordAt(c.id, 0);
        var pb2=el('button','btn '+(hasCord?'on':'btn-ghost'), hasCord?'PLUGGED IN':'ADD CORD');
        pb2.onclick=function(){ if(cordAt(c.id,0)) removeCordAt(c.id,0); else addCordTo(c,0); buildInspector(); recompute(); draw(); commit(); sfxSwitch(); };
        pr.appendChild(pb2);
      }
      box.appendChild(pr);
      box.appendChild(el('div','insp-sub', 'Toggle a power cord on/off the outlet without dragging one in from the Add Wire panel — it appears already seated in the socket face (the button reads <b>PLUGGED IN</b>), ready to wire its other end into an appliance.'));
      box.appendChild(el('div','insp-sub', fsd
        ? 'A switched socket with its own <b>cartridge fuse</b> in the Line — it protects the plugged appliance and its flex. Match the fuse to the load (3 A light / 13 A heavy); a sustained overload <b>blows the fuse</b> before the main breaker trips, and you replace it here.'
        : unsw
        ? 'An <b>unswitched</b> socket — the outlet is permanently live whenever its Line is fed (no rocker to switch it off). Common for fridges, freezers and other appliances that should never be accidentally switched off. Wire supply into L, N, E and plug in a power cord.'
        : 'Wire supply into L, N, E; drag a power-cord plug into '+(dbl?'either outlet (two independently switched outlets share one supply)':'the face')+'. The red neon glows when an outlet is switched on and live. Pick <b>16 A / 32 A</b> for heavy loads — drawing more than the rating overheats the socket contacts.'));
    }
    else if (c.type==='jbox'){ box.appendChild(el('div','insp-title','Junction Box')); box.appendChild(el('div','insp-sub','A maintenance-free junction box with <b>four independent terminals</b> (L, N, Sw, E). Land several conductors on one terminal to join them — the classic loop-in lighting junction: permanent Line, Neutral, switched Line to the lamp, and Earth.')); }
    else if (c.type==='pir'){ box.appendChild(el('div','insp-title','PIR / Occupancy Sensor')); box.appendChild(el('div','insp-sub','A motion-switched Line: wire L in, N, and the switched <b>Load</b> out to a light. <b>Tap the sensor</b> (or the button below) to simulate motion &mdash; the load switches on while motion is detected.'));
      var mr=el('div','insp-row'); mr.appendChild(el('label',null,'Motion'));
      var mb=el('button','btn '+(c.motion?'on':'btn-ghost'), c.motion?'DETECTED':'NONE'); mb.onclick=function(){ c.motion=!c.motion; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; mr.appendChild(mb); box.appendChild(mr); }
    else if (c.type==='rose'){ box.appendChild(el('div','insp-title','Ceiling Rose')); box.appendChild(el('div','insp-sub','Loop-in point: Lp (permanent line), N, Sw (switched line to lamp), E.')); }
    else if (c.type==='bell'){ box.appendChild(el('div','insp-title','Bell Push (momentary)'));
      box.appendChild(el('div','insp-sub','A <b>momentary</b> push switch: it closes COM &rarr; L1 only <b>while you press and hold</b> it on the board, then springs open on release — the classic doorbell / chime button. Wire the Line through it to a bell or buzzer load.')); }
    else if (c.type==='spd'){ box.appendChild(el('div','insp-title','Surge Protection Device'));
      var sr=el('div','insp-row'); sr.appendChild(el('label',null,'Status'));
      var sb=el('button','btn '+(c.spent?'btn-ghost':'on'), c.spent?'END OF LIFE':'HEALTHY'); sb.onclick=function(){ c.spent=!c.spent; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; sr.appendChild(sb); box.appendChild(sr);
      box.appendChild(el('div','insp-sub','A <b>Type-2 SPD</b> wired in <b>parallel</b> across L, N and E at the consumer unit. It sits idle during normal operation and <b>diverts transient over-voltages (surges) to earth</b>, protecting downstream equipment. Its window shows green (healthy) or red — after absorbing enough surges the module reaches end-of-life and must be replaced. Land the incoming L/N/E on its terminals and continue them onward (several conductors on one terminal join).')); }
    else if (c.type==='changeover'){ box.appendChild(el('div','insp-title','Changeover Switch'+(c.pos===1?' · MAINS':(c.pos===2?' · GENERATOR':' · OFF'))));
      var cr2=el('div','insp-row'); cr2.appendChild(el('label',null,'Source'));
      [['MAINS',1],['OFF',0],['GEN',2]].forEach(function(P){ var on=(c.pos===P[1]); var b=el('button','btn '+(on?'on':'btn-ghost'), P[0]); b.style.minWidth='auto'; b.style.padding='6px 9px'; b.onclick=function(){ c.pos=P[1]; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; cr2.appendChild(b); }); box.appendChild(cr2);
      box.appendChild(el('div','insp-sub','A <b>2-pole manual changeover</b> (transfer switch): it feeds the load (Lout/Nout) from either the <b>Mains</b> supply (Lm/Nm) or a standby <b>Generator</b> (Lg/Ng), with a break-before-make <b>Off</b> middle position so the two sources are never connected together. Wire the consumer unit into the Mains side; the Generator side stays dead until you feed it from a second source.')); }
    else if (c.type==='dimmer'){ var lv=(c.level==null?100:c.level), Rd=dimmerOhms(c), I=c._thru||0, Vd=I*Rd, Vload=Math.max(0, volts-Vd);
      box.appendChild(el('div','insp-title','Rotary Dimmer'));
      var dr=el('div','insp-row'); dr.appendChild(el('label',null,'Level'));
      var dsl=el('input'); dsl.type='range'; dsl.className='sim-slider'; dsl.min=0; dsl.max=100; dsl.step=5; dsl.value=lv;
      var dval=el('span','insp-val', Math.round(lv)+'%');
      dsl.oninput=function(){ c.level=+dsl.value; dval.textContent=Math.round(c.level)+'%'; recompute(); draw(); };
      dsl.onchange=function(){ commit(); };
      dr.appendChild(dsl); dr.appendChild(dval); box.appendChild(dr);
      var mr2=el('div','insp-row'); mr2.appendChild(el('label',null,'Max R (Ω)'));
      var msel=el('select','insp-select'); [220,330,470,680,1000].forEach(function(a){ var o=el('option',null,a+' Ω'); o.value=a; if(a===(c.rmax||470))o.selected=true; msel.appendChild(o); });
      msel.onchange=function(){ c.rmax=+msel.value; buildInspector(); recompute(); draw(); commit(); }; mr2.appendChild(msel); box.appendChild(mr2);
      var rr2=el('div','insp-row'); rr2.appendChild(el('label',null,'Resistance')); rr2.appendChild(el('span','insp-val', round(Rd,0)+' Ω')); box.appendChild(rr2);
      var vr=el('div','insp-row'); vr.appendChild(el('label',null,'Drop / Load')); vr.appendChild(el('span','insp-val', round(Vd,0)+' V / '+round(Vload,0)+' V')); box.appendChild(vr);
      box.appendChild(el('div','insp-sub','A resistive <b>rotary dimmer / fan speed regulator</b> — a variable resistor (rheostat) in series with the Line. Turn it with the on-board knob (click <b>&#9664;</b> to dim down, <b>&#9654;</b> to turn up) or the slider. At <b>100 %</b> the resistance is 0 Ω (full brightness/speed); turning down adds up to <b>'+(c.rmax||470)+' Ω</b>, forming a voltage divider with the load: the load voltage drops, so an incandescent lamp dims and a fan slows. Wire Lin/Nin from the switch feed and Lout/Nout to the load. (Real modern dimmers phase-cut electronically, but the resistive model shows the V = IR relationship directly.)')); }
    else if (c.type==='emergency'){ var em2 = !R || !R.emergency || R.emergency[c.id]!==false;
      box.appendChild(el('div','insp-title','Emergency Light'+(em2?' · BATTERY':' · CHARGING')));
      var er=el('div','insp-row'); er.appendChild(el('label',null,'State')); var es=el('span','insp-val', em2?'ON (battery)':'off (charging)'); es.style.color=em2?'var(--green)':'var(--text-dim)'; er.appendChild(es); box.appendChild(er);
      box.appendChild(el('div','insp-sub','A <b>non-maintained emergency light</b>. Wire the permanent <b>Line (L)</b> and <b>Neutral (N)</b> to it. While mains power reaches its Line the internal battery <b>charges</b> and the lamp stays off (green LED). The moment the Line loses power — a power cut, an upstream breaker trip, or the main switch off — it <b>automatically fires its LED from the internal battery</b>. Try switching Power OFF, or opening an upstream MCB, to watch it light.')); }
    else if (c.type==='smoke'){ box.appendChild(el('div','insp-title','Smoke Detector'+(c.smoke?' · ALARM':'')));
      var kr3=el('div','insp-row'); kr3.appendChild(el('label',null,'Smoke'));
      var kb3=el('button','btn '+(c.smoke?'on':'btn-ghost'), c.smoke?'DETECTED':'CLEAR'); kb3.onclick=function(){ c.smoke=!c.smoke; buildInspector(); recompute(); draw(); commit(); c.smoke?sfxBuzz():sfxClick(); }; kr3.appendChild(kb3); box.appendChild(kr3);
      box.appendChild(el('div','insp-sub','A mains-powered <b>smoke alarm</b> with battery backup. Wire <b>L</b> and <b>N</b> for power — a green LED confirms mains health. <b>Tap it</b> (or the button) to simulate smoke: it flashes red and sounds. Because of the battery backup it still alarms even with the mains off. In real installations several alarms are interlinked so one detection sounds them all.')); }
    else if (c.type==='photo'){ box.appendChild(el('div','insp-title','Photocell Sensor'+(c.dark?' · DARK':' · DAYLIGHT')));
      var kr4=el('div','insp-row'); kr4.appendChild(el('label',null,'Light'));
      var kb4=el('button','btn '+(c.dark?'on':'btn-ghost'), c.dark?'DARK':'DAYLIGHT'); kb4.onclick=function(){ c.dark=!c.dark; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; kr4.appendChild(kb4); box.appendChild(kr4);
      box.appendChild(el('div','insp-sub','A <b>dusk-to-dawn (photocell) sensor</b> for outdoor / street lighting. Wire the Line into <b>L</b>, <b>N</b> for power, and the switched <b>Load</b> out to a lamp. It closes L&rarr;Load automatically <b>when it goes dark</b> and opens it in daylight — the opposite of a timer. Tap it to toggle day / night.')); }
    else if (c.type==='isolator'){ box.appendChild(el('div','insp-title','Isolator Switch · '+(c.on?'ON':'OFF')));
      var kr5=el('div','insp-row'); kr5.appendChild(el('label',null,'State'));
      var kb5=el('button','btn '+(c.on?'on':'btn-ghost'), c.on?'ON':'OFF'); kb5.onclick=function(){ c.on=!c.on; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; kr5.appendChild(kb5); box.appendChild(kr5);
      box.appendChild(el('div','insp-sub','A <b>double-pole isolator</b> (rotary main switch / local isolator). It breaks <b>both Line and Neutral</b> together so a circuit or appliance can be safely worked on — the essential lock-off point beside an outdoor AC unit, a boiler or a sub-board. Wire Lin/Nin from the feed and Lout/Nout to the load.')); }
    else if (c.type==='generator'){ box.appendChild(el('div','insp-title','Generator'+(c.running?' · RUNNING':' · OFF')));
      var kr6=el('div','insp-row'); kr6.appendChild(el('label',null,'Engine'));
      var kb6=el('button','btn '+(c.running?'on':'btn-ghost'), c.running?'RUNNING':'START'); kb6.onclick=function(){ c.running=!c.running; buildInspector(); recompute(); draw(); commit(); c.running?sfxOn():sfxClick(); }; kr6.appendChild(kb6); box.appendChild(kr6);
      box.appendChild(el('div','insp-sub','A standby <b>generator</b> — a <b>second power source</b>. When running it makes its <b>L / N / E</b> output live (≈230 V), independent of the mains. Wire its output into the <b>Generator (Lg/Ng)</b> side of a <b>Changeover Switch</b>, then select GEN on the changeover to run the load from the generator during a mains failure. Loads it feeds are metered on the generator, not the consumer unit.')); }
    else if (c.type==='selector'){ box.appendChild(el('div','insp-title','Selector Switch · POS '+(c.pos||1)));
      var kr7=el('div','insp-row'); kr7.appendChild(el('label',null,'Position'));
      [1,2,3].forEach(function(P){ var on=(c.pos===P); var b=el('button','btn '+(on?'on':'btn-ghost'), ''+P); b.style.minWidth='auto'; b.style.padding='6px 11px'; b.onclick=function(){ c.pos=P; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; kr7.appendChild(b); }); box.appendChild(kr7);
      box.appendChild(el('div','insp-sub','A <b>rotary selector switch</b>: it connects the <b>COM</b> input to exactly one of three outputs (<b>1 / 2 / 3</b>) at a time. Use it to route one supply to one of several circuits — e.g. Manual / Off / Auto selection, or picking which of three lamps or motors is energised. Turn the knob on the board or pick a position here.')); }
    else if (c.type==='timer'){ box.appendChild(el('div','insp-title','Timer Switch'+(c.on?' · '+Math.ceil(c.tleft||0)+'s':'')));
      var kr8=el('div','insp-row'); kr8.appendChild(el('label',null,'Run')); var kb8=el('button','btn '+(c.on?'on':'btn-ghost'), c.on?'RUNNING '+Math.ceil(c.tleft||0)+'s':'START'); kb8.onclick=function(){ c.on=true; c.tleft=c.dur||8; buildInspector(); recompute(); draw(); commit(); sfxSwitch(); }; kr8.appendChild(kb8); box.appendChild(kr8);
      var dr3=el('div','insp-row'); dr3.appendChild(el('label',null,'Duration'));
      var dsel=el('select','insp-select'); [5,8,15,30,60].forEach(function(s){ var o=el('option',null,s+' s'); o.value=s; if(s===(c.dur||8))o.selected=true; dsel.appendChild(o); });
      dsel.onchange=function(){ c.dur=+dsel.value; buildInspector(); commit(); }; dr3.appendChild(dsel); box.appendChild(dr3);
      box.appendChild(el('div','insp-sub','A <b>staircase / time-delay timer</b>: <b>tap it to run</b> and it closes L&rarr;Load for the set duration, then <b>automatically switches off</b> — the classic landing / corridor light that turns itself off. Wire L in, N, and the switched <b>Load</b> out to a lamp. Watch the countdown ring on the board.')); }
    // size — drag the corner grip on the board, or set it precisely here
    var szr2=el('div','insp-row'); szr2.appendChild(el('label',null,'Size'));
    var szsl=el('input'); szsl.type='range'; szsl.className='sim-slider'; szsl.min=SCALE_MIN; szsl.max=SCALE_MAX; szsl.step=0.01; szsl.value=sc(c);
    var szval=el('span','insp-val', Math.round(sc(c)*100)+'%');
    szsl.oninput=function(){ c.scale=+szsl.value; szval.textContent=Math.round(c.scale*100)+'%'; draw(); };
    szsl.onchange=function(){ resolveOverlap(c); draw(); commit(); };
    szr2.appendChild(szsl); szr2.appendChild(szval); box.appendChild(szr2);
    if (!inspTarget){ var del2=el('button','btn btn-ghost','🗑 Delete'); del2.style.marginTop='8px'; del2.onclick=deleteSelected; box.appendChild(del2); }
  }

  /* ═══════════════════════════════════════════════════════════════
     POWER / RECOMPUTE / ANIMATION
     ═══════════════════════════════════════════════════════════════ */
  function recompute(){ R = computeCircuit(); updateBadges(); updateFaults(); updateLiveEq(); }
  function setPowerBtn(){ var b=$('btn-power'); if(!b) return; b.classList.toggle('on', powered); b.innerHTML = powered ? '&#9211; Power&nbsp;OFF' : '&#9211; Power&nbsp;ON'; }

  function updateBadges(){
    $('rb-volt').textContent = volts;
    $('rb-current').textContent = R ? round(R.total,1) : '0.0';
    $('rb-loads').textContent = R ? R.liveCount : 0;
    var s = 'Off';
    if (tripped) s='TRIPPED'; else if (!powered) s='Off';
    else if (R && R.noSupply) s='No supply';
    else if (R && R.short) s='SHORT';
    else { var fire=cables.some(function(c){return c.fire;}); s = fire?'FIRE':(R&&R.faults.length? 'Faults':'Live'); }
    $('rb-status').textContent = s;
  }
  function updateFaults(){
    var strip=$('fault-strip'); strip.innerHTML='';
    if (!powered){ return; }
    if (R && R.noSupply){ strip.appendChild(faultItem('warn','⚠','Place a <strong>Consumer Unit</strong> to supply the circuit.')); return; }
    if (tripped){ strip.appendChild(faultItem('danger','⛔','Breaker tripped — fix the fault then press Power OFF/ON to reset.')); }
    var seen={};
    (R?R.faults:[]).forEach(function(f){ if(seen[f.t]) return; seen[f.t]=1; strip.appendChild(faultItem(f.lvl, f.lvl==='danger'?'⛔':'⚠', f.t)); });
    if (powered && !tripped && R && !R.faults.length && R.liveCount>0) strip.appendChild(faultItem('ok','✓','Circuit is wired correctly — '+R.liveCount+' load(s) live drawing '+round(R.total,1)+' A.'));
    else if (powered && !tripped && R && !R.faults.length && R.liveCount===0 && comps.some(function(c){return c.load;})) strip.appendChild(faultItem('warn','⚠','No load is energised — check for a disconnected conductor or an open switch (a load needs both its Line and Neutral back to the supply).'));
  }
  function faultItem(lvl,icon,txt){ var d=el('div','fault-item '+lvl); d.innerHTML='<span class="fi-icon">'+icon+'</span><span>'+txt+'</span>'; return d; }

  function tickTrip(dt){
    if (!powered || tripped){ tHeat=0; return; }
    if (!R || R.noSupply) return;
    var sup=findSupply();
    // instantaneous faults — the protective device NEAREST the fault operates (discrimination);
    // only when no in-line device isolates it does the main breaker trip
    if (R.short || (R.earthFault && sup && !sup.rcd)){
      if (R.isolator) operateIsolator(R.isolator); else tripNow();
      return;
    }
    if (sup && sup.rcd && (R.earthFault || (R.neFault && R.total>0.01))){ tripNow(); return; }
    // main breaker — thermal overload (time-based, frame-rate independent)
    if ((R.mainsTotal!=null?R.mainsTotal:R.total) > (sup?sup.mcb:99)+0.01){ tHeat+=dt; if (tHeat>0.8){ tripNow(); } }
    else tHeat=Math.max(0,tHeat-2*dt);
    // FCU + fused-socket cartridge fuses — ride a small overload briefly, blow fast on a gross one
    comps.forEach(function(c){ if((c.type!=='fcu'&&c.type!=='socketf')||c.fuseBlown) return; var r=(c._thru||0)/c.fuse;
      if (r>1.01){ c._fheat=(c._fheat||0)+dt*(r>=2?5:1); if(c._fheat>1.5){ c.fuseBlown=true; c._fheat=0; sfxTrip(); recompute(); if(sel&&sel.ref===c) buildInspector(); } }
      else c._fheat=Math.max(0,(c._fheat||0)-dt);
    });
    // plug fuses in power cords — same cartridge-fuse behaviour
    cables.forEach(function(cb){ if(!cb.plug||!cb.plugFuse||cb.plugFuseBlown) return; var pr=(cb._cL||0)/cb.plugFuse;
      if (pr>1.01){ cb._pfheat=(cb._pfheat||0)+dt*(pr>=2?5:1); if(cb._pfheat>1.5){ cb.plugFuseBlown=true; cb._pfheat=0; sfxTrip(); recompute(); if(sel&&sel.kind==='cable'&&sel.ref===cb) buildInspector(); } }
      else cb._pfheat=Math.max(0,(cb._pfheat||0)-dt);
    });
    // section MCBs — thermal trip on overload
    comps.forEach(function(c){ if(c.type!=='mcb'||c.tripped||!c.on) return;
      if ((c._thru||0) > c.mcb+0.01){ c._heat=(c._heat||0)+dt; if(c._heat>0.75){ c.tripped=true; c._heat=0; sfxTrip(); recompute(); } }
      else c._heat=Math.max(0,(c._heat||0)-dt);
    });
  }
  function operateIsolator(iso){
    if (iso.kind==='mcb'){ var m=findComp(iso.id); if(m){ m.tripped=true; m._heat=0; } }
    else if (iso.kind==='fcu' || iso.kind==='socketf'){ var f=findComp(iso.id); if(f) f.fuseBlown=true; }
    else { var cb=findCable(iso.id); if(cb) cb.plugFuseBlown=true; }
    sfxTrip(); recompute(); draw();
    if (sel) buildInspector();
  }
  function findSupply(){ for(var i=0;i<comps.length;i++) if(comps[i].type==='supply') return comps[i]; return null; }
  function tripNow(){ tripped=true; tHeat=0; sfxTrip(); sfxBuzz(); recompute(); }

  /* staircase timers count down in real time, then auto-switch off */
  function tickTimers(dt){
    var changed=false;
    for (var i=0;i<comps.length;i++){ var c=comps[i]; if(c.type!=='timer'||!c.on) continue;
      c.tleft=(c.tleft||0)-dt; if (c.tleft<=0){ c.tleft=0; c.on=false; changed=true; } }
    if (changed){ recompute(); if(sel && sel.kind==='comp' && sel.ref.type==='timer') buildInspector(); }
  }
  /* continuity beep — ONE 1.5 s beep per NEW proper connection; never repeats while the probes
     stay put. Re-arms when the connection breaks, a probe moves to a different node, or the mode changes. */
  function tickMeterBeep(){
    if (!meter || meter.mode!=='C'){ if(meter) meter._beepKey=null; return; }
    var rk=probeResolve(meter.red).key, bk=probeResolve(meter.black).key;
    var cont = !!(rk && bk && meterSameNet(rk,bk));
    var key = cont ? rk+'|'+bk : null;
    if (cont){ if (meter._beepKey!==key){ meter._beepKey=key; sfxCont(); } }
    else meter._beepKey=null;
  }
  var lastTs=0;
  function loop(ts){ anim++; ts=ts||0;
    var dt = lastTs ? Math.min((ts-lastTs)/1000, 0.1) : 0.016;   // seconds; clamp across tab-suspend gaps
    lastTs=ts;
    tickTimers(dt); tickTrip(dt); tickMeterBeep(); if (powered || meter || comps.some(function(c){return c.type==='timer'&&c.on;})) draw(); raf=requestAnimationFrame(loop); }

  /* ═══════════════════════════════════════════════════════════════
     LIVE EQUATIONS (KaTeX)
     ═══════════════════════════════════════════════════════════════ */
  var _eqCache='';
  function updateLiveEq(){
    var box=$('lp-eq-body'); if(!box) return; var html='';
    var sup=findSupply();
    html+='<div class="leq"><span class="leq-label">Load current</span><br>\\( I = \\dfrac{P}{V} \\)</div>';
    var loads=comps.filter(function(c){return c.load;});
    if (R && R.liveCount>0){
      loads.forEach(function(ld){ if(R.energized&&R.energized[ld.id]){ var d=LOADS[ld.type];
        html+='<div class="leq">'+d.name+': \\( I = \\dfrac{'+ld.watt+'}{'+volts+'} = '+round(ld.watt/volts,2)+'\\,\\text{A} \\)</div>'; } });
      html+='<div class="leq">Total \\( I_{total} = '+round(R.total,2)+'\\,\\text{A} \\)'+(sup?' — breaker '+sup.mcb+' A':'')+'</div>';
    } else {
      html+='<div class="leq leq-label">Wire and energise a load to see its current here.</div>';
    }
    html+='<div class="leq"><span class="leq-label">Safe-sizing rule</span><br>\\( I_{load} \\le I_{device} \\le I_{cable} \\)</div>';
    if (html!==_eqCache){ box.innerHTML=html; _eqCache=html; if (window.renderMathInElement){ try{ window.renderMathInElement(box,{delimiters:[{left:'\\(',right:'\\)',display:false},{left:'\\[',right:'\\]',display:true}]}); }catch(e){} } }
  }

  /* ═══════════════════════════════════════════════════════════════
     AUTO-GENERATE CANONICAL CIRCUITS
     ═══════════════════════════════════════════════════════════════ */
  /* "One Way Switch Control" — user-authored showcase board (exported build):
     supply → section MCB → 2×5 L/N connector block, then three independently
     switched loads: ceiling fan on a 1-way switch, bulb + table fan on a 2-gang. */
  var PRESET_OWC = {
    comps:[
      {id:7,type:'supply',load:false,x:15,y:46,w:158,h:116,mcb:32,rcd:true,on:true},
      {id:8,type:'mcb',load:false,x:48,y:334,w:66,h:96,mcb:16,on:true,tripped:false},
      {id:9,type:'connector',load:false,x:241,y:344,w:162,h:60,cmode:'2to5'},
      {id:10,type:'sw1',load:false,x:430,y:188,w:62,h:92,on:true},
      {id:11,type:'sw1g2',load:false,x:619,y:269,w:100,h:92,gangs:[false,false]},
      {id:12,type:'fanC',load:true,x:453,y:49,w:92,h:84,watt:70,on:true},
      {id:13,type:'lamp',load:true,x:623,y:43,w:66,h:84,watt:60,on:true},
      {id:15,type:'fanT',load:true,x:769,y:47,w:84,h:84,watt:50,on:true}
    ],
    cables:[
      {id:17,kind:'2c',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'}],ax:81,ay:206,bx:81,by:313,landA:[{compId:7,tid:'L'},{compId:7,tid:'N'}],landB:[{compId:8,tid:'Li'},{compId:8,tid:'Ni'}],pts:[{x:81,y:206},{x:81,y:313}]},
      {id:18,kind:'2c',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'}],ax:101,ay:459,bx:211,by:370,landA:[{compId:8,tid:'Lo'},{compId:8,tid:'No'}],landB:[{compId:9,tid:'lin'},{compId:9,tid:'nin'}],pts:[{x:101,y:459},{x:182,y:459},{x:182,y:370},{x:211,y:370}]},
      {id:20,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:262,ay:302,bx:462,by:302,landA:[{compId:9,tid:'l0'}],landB:[{compId:10,tid:'COM'}],pts:[{x:262,y:302},{x:462,y:302}]},
      {id:22,kind:'2c',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'}],ax:523,ay:180,bx:523,by:273,landA:[{compId:12,tid:'L'},{compId:12,tid:'N'}],landB:[{compId:10,tid:'L1'},{compId:9,tid:'n4'}],pts:[{x:523,y:180},{x:523,y:273}]},
      {id:23,kind:'sc-n',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'N',col:COL.N,name:'Neutral'}],ax:567,ay:181,bx:632,by:179,landA:[{compId:12,tid:'N'}],landB:[{compId:13,tid:'N'}],pts:[{x:567,y:181},{x:632,y:181},{x:632,y:179}]},
      {id:24,kind:'sc-n',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'N',col:COL.N,name:'Neutral'}],ax:653,ay:187,bx:827,by:150,landA:[{compId:13,tid:'N'}],landB:[{compId:15,tid:'N'}],pts:[{x:653,y:187},{x:827,y:187},{x:827,y:150}]},
      {id:25,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:401,ay:332,bx:580,by:382,landA:[{compId:9,tid:'l2'}],landB:[{compId:11,tid:'COM'}],pts:[{x:401,y:332},{x:580,y:332},{x:580,y:382}]},
      {id:26,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:654,ay:403,bx:637,by:159,landA:[{compId:11,tid:'L1'}],landB:[{compId:13,tid:'L'}],pts:[{x:654,y:403},{x:727,y:403},{x:727,y:226},{x:726,y:226},{x:726,y:159},{x:637,y:159}]},
      {id:27,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:742,ay:369,bx:783,by:169,landA:[{compId:11,tid:'L2'}],landB:[{compId:15,tid:'L'}],pts:[{x:742,y:369},{x:825,y:369},{x:825,y:309},{x:804,y:309},{x:804,y:238},{x:783,y:238},{x:783,y:169}]},
      {id:28,kind:'sc-e',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'E',col:COL.E,name:'Earth'}],ax:179,ay:181,bx:379,by:181,landA:[{compId:7,tid:'E'}],landB:[{compId:12,tid:'E'}],pts:[{x:179,y:181},{x:379,y:181}]}
    ],
    joints:[], nextId:30, volts:230
  };

  /* Two-way staircase light — user-authored board: supply → lamp with the switched
     Line running through two 2-way switches strapped by a 2-core cable. */
  var PRESET_TWOWAY = {
    comps:[
      {id:30,type:'supply',load:false,x:60,y:70,w:158,h:116,mcb:6,rcd:true,on:true},
      {id:31,type:'sw2',load:false,x:493,y:268,w:62,h:92,pos:1},
      {id:32,type:'sw2',load:false,x:643,y:265,w:62,h:92,pos:2},
      {id:33,type:'lamp',load:true,x:727,y:100,w:66,h:84,watt:60,on:true}
    ],
    cables:[
      {id:37,kind:'sc-n',flex:false,mm:1.5,swg:18,ratingA:20,cores:[{role:'N',col:COL.N,name:'Neutral'}],ax:208,ay:224,bx:800,by:212,landA:[{compId:30,tid:'N'}],landB:[{compId:33,tid:'N'}],pts:[{x:208,y:224},{x:208,y:218},{x:800,y:218},{x:800,y:212}]},
      {id:38,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:747,ay:227,bx:671,by:407,landA:[{compId:33,tid:'L'}],landB:[{compId:32,tid:'COM'}],pts:[{x:747,y:227},{x:747,y:407},{x:671,y:407}]},
      {id:39,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:112,ay:224,bx:481,by:379,landA:[{compId:30,tid:'L'}],landB:[{compId:31,tid:'COM'}],pts:[{x:112,y:224},{x:112,y:398},{x:298,y:398},{x:298,y:379},{x:481,y:379}]},
      {id:40,kind:'2c',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'}],ax:545,ay:416,bx:686,by:397,landA:[{compId:31,tid:'L1'},{compId:31,tid:'L2'}],landB:[{compId:32,tid:'L2'},{compId:32,tid:'L1'}],pts:[{x:545,y:416},{x:545,y:444},{x:686,y:444},{x:686,y:397}]}
    ],
    joints:[], nextId:41, volts:230
  };

  /* Heavy Duty Wiring — user-authored board: a 4 mm² sub-main feeds a rotated 2×5 L/N distribution
     block, split to three section MCBs. Two switched sockets (16 A + 32 A) run a kettle and a split AC
     on fused power cords, and a washer is hard-wired — all earthed through a 1→5 earth block. */
  var PRESET_HEAVY = {
    comps:[
      {id:30,type:'supply',load:false,x:10,y:40,w:158,h:116,mcb:32,rcd:true,on:true},
      {id:31,type:'mcb',load:false,x:73,y:331,w:66,h:96,mcb:16,on:true,tripped:false},
      {id:33,type:'mcb',load:false,x:188,y:333,w:66,h:96,mcb:32,on:true,tripped:false},
      {id:34,type:'mcb',load:false,x:368,y:338,w:66,h:96,mcb:16,on:true,tripped:false},
      {id:36,type:'connector',load:false,x:257,y:128,w:60,h:162,cmode:'2to5',rot:90},
      {id:45,type:'kettle',load:true,x:650,y:47,w:80,h:84,watt:2400,on:true},
      {id:46,type:'socket',load:false,x:463,y:86,w:96,h:96,on:true,amp:16},
      {id:49,type:'socket',load:false,x:544,y:240,w:96,h:96,on:true,amp:32},
      {id:50,type:'ac',load:true,x:748,y:199,w:108,h:66,watt:1500,on:true},
      {id:55,type:'washer',load:true,x:771,y:342,w:84,h:100,watt:2200,on:true},
      {id:58,type:'connector',load:false,x:20,y:503,w:150,h:44,cmode:'1to5'}
    ],
    cables:[
      {id:39,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:337,ay:212,bx:214,by:309,landA:[{compId:36,tid:'l1'}],landB:[{compId:33,tid:'Li'}],pts:[{x:337,y:212},{x:337,y:309},{x:214,y:309}]},
      {id:41,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:110,ay:320,bx:358,by:199,landA:[{compId:31,tid:'Li'}],landB:[{compId:36,tid:'l0'}],pts:[{x:110,y:320},{x:357,y:320},{x:357,y:305},{x:358,y:305},{x:358,y:199}]},
      {id:42,kind:'sc-l',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'}],ax:383,ay:224,bx:383,by:326,landA:[{compId:36,tid:'l2'}],landB:[{compId:34,tid:'Li'}],pts:[{x:383,y:224},{x:383,y:326}]},
      {id:43,kind:'sc-n',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'N',col:COL.N,name:'Neutral'}],ax:129,ay:290,bx:223,by:176,landA:[{compId:31,tid:'Ni'}],landB:[{compId:36,tid:'n0'}],pts:[{x:129,y:290},{x:212,y:290},{x:212,y:214},{x:223,y:214},{x:223,y:176}]},
      {id:44,kind:'sc-n',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'N',col:COL.N,name:'Neutral'}],ax:229,ay:242,bx:401,by:296,landA:[{compId:36,tid:'n1'}],landB:[{compId:34,tid:'Ni'}],pts:[{x:229,y:242},{x:229,y:263},{x:254,y:263},{x:254,y:296},{x:401,y:296}]},
      {id:47,kind:'cord',flex:true,mm:1.25,swg:17,ratingA:13,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'},{role:'E',col:COL.E,name:'Earth'}],ax:674,ay:173,bx:511,by:174,landA:[{compId:45,tid:'L'},{compId:45,tid:'N'},{compId:45,tid:'E'}],landB:[{compId:46,tid:'Lo'},{compId:46,tid:'No'},{compId:46,tid:'Eo'}],plug:'B',pluggedInto:46,plugFuse:13,plugFuseBlown:false,pts:[{x:674,y:173},{x:511,y:174}]},
      {id:51,kind:'cord',flex:true,mm:1.25,swg:17,ratingA:13,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'},{role:'E',col:COL.E,name:'Earth'}],ax:782,ay:320,bx:592,by:329,landA:[{compId:50,tid:'L'},{compId:50,tid:'N'},{compId:50,tid:'E'}],landB:[{compId:49,tid:'Lo'},{compId:49,tid:'No'},{compId:49,tid:'Eo'}],plug:'B',pluggedInto:49,plugFuse:13,plugFuseBlown:false,pts:[{x:782,y:320},{x:592,y:329}]},
      {id:52,kind:'te2',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'},{role:'E',col:COL.E,name:'Earth'}],ax:116,ay:478,bx:493,by:234,landA:[{compId:31,tid:'Lo'},{compId:31,tid:'No'},{compId:58,tid:'o0'}],landB:[{compId:46,tid:'L'},{compId:46,tid:'N'},{compId:46,tid:'E'}],pts:[{x:116,y:478},{x:493,y:478},{x:493,y:331},{x:493,y:234}]},
      {id:54,kind:'te2',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'},{role:'E',col:COL.E,name:'Earth'}],ax:202,ay:494,bx:570,by:405,landA:[{compId:33,tid:'Lo'},{compId:33,tid:'No'},{compId:58,tid:'o1'}],landB:[{compId:49,tid:'L'},{compId:49,tid:'N'},{compId:49,tid:'E'}],pts:[{x:202,y:494},{x:571,y:494},{x:571,y:470},{x:570,y:470},{x:570,y:405}]},
      {id:56,kind:'sc-n',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'N',col:COL.N,name:'Neutral'}],ax:246,ay:330,bx:246,by:244,landA:[{compId:33,tid:'Ni'}],landB:[{compId:36,tid:'n2'}],pts:[{x:246,y:330},{x:246,y:244}]},
      {id:57,kind:'te2',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'},{role:'E',col:COL.E,name:'Earth'}],ax:384,ay:472,bx:797,by:500,landA:[{compId:34,tid:'Lo'},{compId:34,tid:'No'},{compId:58,tid:'o2'}],landB:[{compId:55,tid:'L'},{compId:55,tid:'N'},{compId:55,tid:'E'}],pts:[{x:384,y:472},{x:652,y:472},{x:652,y:513},{x:832,y:513},{x:832,y:500},{x:797,y:500}]},
      {id:59,kind:'sc-e',flex:false,mm:2.5,swg:16,ratingA:27,cores:[{role:'E',col:COL.E,name:'Earth'}],ax:26,ay:200,bx:26,by:460,landA:[{compId:30,tid:'E'}],landB:[{compId:58,tid:'in'}],pts:[{x:26,y:200},{x:26,y:460}]},
      {id:60,kind:'2c',flex:false,mm:4,swg:14,ratingA:37,cores:[{role:'L',col:COL.L,name:'Line'},{role:'N',col:COL.N,name:'Neutral'}],ax:73,ay:187,bx:291,by:103,landA:[{compId:30,tid:'L'},{compId:30,tid:'N'}],landB:[{compId:36,tid:'lin'},{compId:36,tid:'nin'}],pts:[{x:73,y:187},{x:188,y:187},{x:188,y:103},{x:291,y:103}]}
    ],
    joints:[], nextId:61, volts:230
  };

  function loadPreset(preset, hint){
    clearAll();
    restore(JSON.stringify(preset));
    powered=true; tripped=false; setPowerBtn(); recompute(); draw(); commit();
    $('wire-hint').textContent=hint; setHint(true);   // a new preset = new instructions, surface the banner again
  }

  function generate(kind){
    if (kind==='owc'){
      loadPreset(PRESET_OWC, 'One Way Switch Control: tap the 1-way switch for the fan, and the 2-gang rockers for the bulb and table fan.');
      return;
    }
    if (kind==='two-way'){
      loadPreset(PRESET_TWOWAY, 'Two-way staircase light: tap EITHER 2-way switch to toggle the lamp — the strappers carry the Line between them.');
      return;
    }
    if (kind==='heavy'){
      loadPreset(PRESET_HEAVY, 'Heavy Duty Wiring: a 4 mm² sub-main feeds three section MCBs from a rotated L/N block — a kettle and split AC on switched sockets, plus a hard-wired washer, all earthed via a distribution block.');
      return;
    }
    clearAll();
    var sup=addComp('supply', 60, 70); sup.mcb = kind==='heater'?20:32; if(kind==='one-way'||kind==='two-way'||kind==='loop-in') sup.mcb=6;
    var supL=termWorld(sup,'L'), supN=termWorld(sup,'N'), supE=termWorld(sup,'E');
    function cbBetween(kd, mm, wa, wb){ return addCable(kd, mm, wa.x, wa.y+18, wb.x, wb.y-18); }

    if (kind==='one-way'){
      var sw=addComp('sw1', 380, 360); var lamp=addLoad('lamp', 640, 90);
      var c1=addCable('sc-l',1.5, supL.x, supL.y+16, termWorld(sw,'COM').x, termWorld(sw,'COM').y+16);   // single-core Line
      var c2=addCable('sc-l',1.5, termWorld(sw,'L1').x, termWorld(sw,'L1').y+16, termWorld(lamp,'L').x, termWorld(lamp,'L').y-16);
      var c3=addCable('sc-n',1.5, supN.x, supN.y+16, termWorld(lamp,'N').x, termWorld(lamp,'N').y-16);    // single-core Neutral
      landCond(c2,'A',0,sw,'L1');
      sw.on=true;
      // switch breaks the LINE
      landCond(c1,'A',0,sup,'L'); landCond(c1,'B',0,sw,'COM');
      landCond(c2,'B',0,lamp,'L');
      landCond(c3,'A',0,sup,'N'); landCond(c3,'B',0,lamp,'N');
    }
    else if (kind==='loop-in'){
      var rose=addComp('rose', 430, 300); var lamp3=addLoad('lamp', 430, 120); var sw3=addComp('sw1', 640, 360);
      var rL=addCable('te2',1.0, supL.x, supL.y+16, termWorld(rose,'LP').x, termWorld(rose,'LP').y+16);
      landCond(rL,'A',0,sup,'L'); landCond(rL,'B',0,rose,'LP');
      landCond(rL,'A',1,sup,'N'); landCond(rL,'B',1,rose,'N');
      // switch drop (single cores): permanent live LP → switch COM, switched live L1 → rose SW
      var dr=addCable('sc-l',1.0, termWorld(rose,'LP').x, termWorld(rose,'LP').y+16, termWorld(sw3,'COM').x, termWorld(sw3,'COM').y+16);
      landCond(dr,'A',0,rose,'LP'); landCond(dr,'B',0,sw3,'COM');
      var dr2=addCable('sc-l',1.0, termWorld(sw3,'L1').x, termWorld(sw3,'L1').y+16, termWorld(rose,'SW').x, termWorld(rose,'SW').y+16);
      landCond(dr2,'A',0,sw3,'L1'); landCond(dr2,'B',0,rose,'SW');
      // lamp: SW -> lamp L, N -> lamp N
      var ll=addCable('te2',1.0, termWorld(rose,'SW').x, termWorld(rose,'SW').y+16, termWorld(lamp3,'L').x, termWorld(lamp3,'L').y-16);
      landCond(ll,'A',0,rose,'SW'); landCond(ll,'B',0,lamp3,'L');
      landCond(ll,'A',1,rose,'N'); landCond(ll,'B',1,lamp3,'N');
      sw3.on=true;
    }
    else if (kind==='heater'){
      var fcu=addComp('fcu', 360, 250); var ht=addLoad('heater', 620, 110);
      fcu.fuse = 13;
      var cM=addCable('te2', 2.5, supL.x, supL.y+16, termWorld(fcu,'Li').x, termWorld(fcu,'Li').y-16);
      landCond(cM,'A',0,sup,'L'); landCond(cM,'B',0,fcu,'Li');
      landCond(cM,'A',1,sup,'N'); landCond(cM,'B',1,fcu,'Ni');
      landCond(cM,'A',2,sup,'E'); landCond(cM,'B',2,fcu,'Ei');
      var cO=addCable('te2', 2.5, termWorld(fcu,'Lo').x, termWorld(fcu,'Lo').y+16, termWorld(ht,'L').x, termWorld(ht,'L').y-16);
      landCond(cO,'A',0,fcu,'Lo'); landCond(cO,'B',0,ht,'L');
      landCond(cO,'A',1,fcu,'No'); landCond(cO,'B',1,ht,'N');
      landCond(cO,'A',2,fcu,'Eo'); landCond(cO,'B',2,ht,'E');
    }
    else if (kind==='ring'){
      sup.mcb=32;
      var sk1=addComp('socket', 300, 350), sk2=addComp('socket', 560, 350), kt=addLoad('kettle', 560, 130);
      function threeCore(cb, A, aT, B, bT){ landCond(cb,'A',0,A,aT[0]); landCond(cb,'B',0,B,bT[0]); landCond(cb,'A',1,A,aT[1]); landCond(cb,'B',1,B,bT[1]); landCond(cb,'A',2,A,aT[2]); landCond(cb,'B',2,B,bT[2]); }
      var LNE=['L','N','E'];
      var r1=addCable('te2',2.5, supL.x,supL.y+16, termWorld(sk1,'L').x,termWorld(sk1,'L').y+16); threeCore(r1, sup,LNE, sk1,LNE);       // supply → socket 1
      var r2=addCable('te2',2.5, termWorld(sk1,'N').x,termWorld(sk1,'N').y+16, termWorld(sk2,'N').x,termWorld(sk2,'N').y+16); threeCore(r2, sk1,LNE, sk2,LNE); // socket 1 → socket 2
      var r3=addCable('te2',2.5, termWorld(sk2,'E').x,termWorld(sk2,'E').y+16, supE.x,supE.y+16); threeCore(r3, sk2,LNE, sup,LNE);       // socket 2 → back to supply (the ring)
      var fk=addCable('flex3',1.25, termWorld(sk2,'L').x,termWorld(sk2,'L').y+16, termWorld(kt,'L').x,termWorld(kt,'L').y-16); threeCore(fk, sk2,LNE, kt,LNE); // kettle on socket 2
    }
    cables.forEach(autoRoute);   // tidy every cable into a neat orthogonal run (latest cable model)
    powered=true; tripped=false; setPowerBtn(); recompute(); draw(); commit();
    $('wire-hint').textContent='Generated: tap switches to operate. Edit anything, then re-power.';
  }

  /* ═══════════════════════════════════════════════════════════════
     PALETTE + CABLE BUILDER
     ═══════════════════════════════════════════════════════════════ */
  function paletteIcon(type, isLoad){
    var c=document.createElement('canvas'); c.width=80; c.height=68; c.className='pi-ico';
    var x=c.getContext('2d'); x.scale(1,1);
    // reuse main draw fns on a temp comp
    var save={comps:comps,cables:cables,ctx:ctx,anim:anim,R:R,powered:powered};
    var tmp = isLoad ? { id:-1,type:type,load:true,x:0,y:0,w:LOADS[type].w,h:LOADS[type].h,watt:LOADS[type].watt,on:false }
                     : { id:-1,type:type,load:false,x:0,y:0,w:COMP[type].w,h:COMP[type].h,on:(type==='sw1'||type==='bell'||type==='isolator')?false:true,pos:1,mcb:32,rcd:true,fuse:13,amp:13,level:70,rmax:470,spent:false,running:(type==='generator'),dark:(type==='photo'),smoke:false,dur:8,tleft:0, gangs:(COMP[type].gangs?[true,false,true,false].slice(0,COMP[type].gangs):null) };
    var d = isLoad?LOADS[type]:COMP[type];
    var scale = Math.min(70/d.w, 46/d.h);
    ctx=x; comps=[]; cables=[]; R=null; powered=false;
    x.save(); x.translate((80-d.w*scale)/2, 6); x.scale(scale,scale); x.translate(-tmp.x,-tmp.y);
    try { drawComponent(tmp); } catch(e){}
    x.restore();
    ctx=save.ctx; comps=save.comps; cables=save.cables; R=save.R; powered=save.powered;
    return c;
  }
  function placeFromPalette(type, isLoad, lx, ly){   // add at a specific canvas point (centred on cursor)
    var d = isLoad?LOADS[type]:COMP[type];
    var x = clamp(lx-d.w/2, -6, LW-d.w+6), y = clamp(ly-d.h/2, -6, LH-d.h+6);
    var c = isLoad?addLoad(type,x,y):addComp(type,x,y);
    selectComp(c); recompute(); draw(); commit(); sfxClick(); return c;
  }
  function makePaletteItem(type, isLoad){
    var d = isLoad?LOADS[type]:COMP[type];
    var it=el('div','palette-item'); it.appendChild(paletteIcon(type,isLoad)); it.appendChild(el('div','pi-name', d.name));
    it.style.touchAction='none';
    it.addEventListener('pointerdown', function(e){
      e.preventDefault();
      var sx=e.clientX, sy=e.clientY, moved=false, ghost=null;
      function mv(ev){
        if(!moved && Math.hypot(ev.clientX-sx, ev.clientY-sy)>6){ moved=true;
          ghost=it.cloneNode(true); ghost.style.cssText='position:fixed;z-index:3000;pointer-events:none;opacity:.85;width:'+it.offsetWidth+'px;transform:translate(-50%,-50%);'; document.body.appendChild(ghost); }
        if(ghost){ ghost.style.left=ev.clientX+'px'; ghost.style.top=ev.clientY+'px'; }
      }
      function up(ev){
        document.removeEventListener('pointermove',mv); document.removeEventListener('pointerup',up);
        if(ghost) ghost.remove();
        if(moved){
          var r=canvas.getBoundingClientRect();
          if(ev.clientX>=r.left && ev.clientX<=r.right && ev.clientY>=r.top && ev.clientY<=r.bottom){
            placeFromPalette(type, isLoad, (ev.clientX-r.left)/r.width*LW, (ev.clientY-r.top)/r.height*LH);
          }
        } else {
          var c = isLoad?addLoad(type):addComp(type); selectComp(c); recompute(); draw(); commit(); sfxClick();  // plain click → drop at centre
        }
      }
      document.addEventListener('pointermove',mv); document.addEventListener('pointerup',up);
    });
    return it;
  }
  /* Palette split into industry-standard functional groups (BS 7671 wiring-accessory families +
     load-type classification). `load` marks appliance groups; `col` collapses a group by default. */
  var PALETTE_CATS = [
    { title:'Supply &amp; Protection',    items:['supply','generator','mcb','fcu','spd'] },
    { title:'Switching &amp; Control',     col:true, items:['sw1','sw2','swi','sw1g2','sw1g3','sw1g4','bell','dimmer','timer','dpsw','isolator','changeover','selector'] },
    { title:'Sockets &amp; Outlets',       col:true, items:['socket','socket2','socketf','socketu'] },
    { title:'Connections &amp; Junctions', col:true, items:['connector','jbox','rose'] },
    { title:'Sensors, Safety &amp; Emergency', col:true, items:['pir','photo','smoke','emergency'] },
    { title:'Lighting Loads',          load:true, col:true, items:['led','lamp','pendant'] },
    { title:'Motors &amp; Appliances', load:true, col:true, items:['fanC','fanT','exhaust','tv','laptop','fridge','micro','washer','dish'] },
    { title:'Heating &amp; High-power', load:true, col:true, items:['kettle','iron','ac','heater','cooker','oven','induction','shower','ev'] }
  ];
  function paletteSection(title, types, isLoad, collapsed){
    var head=el('div','sp-cat'+(collapsed?' collapsed':'')); head.innerHTML='<span>'+title+'</span><span class="sp-arrow">&#9662;</span>';
    head.addEventListener('click', function(){
      var willOpen = head.classList.contains('collapsed');
      if (willOpen && head.parentNode){   // accordion: opening one palette group collapses the others (the Selected Item panel lives outside #palette-host, so it's untouched)
        head.parentNode.querySelectorAll('.sp-cat').forEach(function(h){ if(h!==head) h.classList.add('collapsed'); });
      }
      head.classList.toggle('collapsed');
    });
    var wrap=el('div','sp-cat-items'), grid=el('div','palette');
    types.forEach(function(t){ grid.appendChild(makePaletteItem(t, isLoad)); });
    wrap.appendChild(grid);
    return [head, wrap];
  }
  function buildPalette(){
    var host=$('palette-host'); if(!host) return; host.innerHTML='';
    var known={}; PALETTE_CATS.forEach(function(c){ c.items.forEach(function(t){ known[t]=1; }); });
    // future-proof: any component/load type not in a category falls into an "Other …" group in the right tier
    var extraC=Object.keys(COMP).filter(function(t){ return !known[t]; });
    var extraL=Object.keys(LOADS).filter(function(t){ return !known[t]; });
    var compCats=PALETTE_CATS.filter(function(c){ return !c.load; }).concat(extraC.length?[{title:'Other Components', col:true, items:extraC}]:[]);
    var loadCats=PALETTE_CATS.filter(function(c){ return  c.load; }).concat(extraL.length?[{title:'Other Loads', load:true, col:true, items:extraL}]:[]);
    var cats=compCats.concat(loadCats);
    var lastGroup=null;
    cats.forEach(function(cat){
      var grp = cat.load ? 'load' : 'comp';
      if (grp!==lastGroup){ host.appendChild(el('div','palette-major', grp==='load' ? 'Loads &amp; Appliances' : 'Wiring Components')); lastGroup=grp; }
      var s=paletteSection(cat.title, cat.items, !!cat.load, !!cat.col);
      host.appendChild(s[0]); host.appendChild(s[1]);
    });
  }
  function fillSizes(){
    var kind=$('cb-cores').value; var K=CABLE_KINDS[kind]; var tbl=K.flex?SIZES_FLEX:SIZES_FIXED;
    var s=$('cb-size'); s.innerHTML='';
    tbl.forEach(function(z){ var o=el('option',null, z.mm.toFixed(z.mm<1?2:1)+' mm² · SWG '+z.swg+' · '+z.a+' A'); o.value=z.mm; s.appendChild(o); });
    // default 2.5 for fixed, 1.25 for flex
    s.value = K.flex ? 1.25 : 2.5; updateCablePreview();
  }
  function updateCablePreview(){
    var kind=$('cb-cores').value; var K=CABLE_KINDS[kind]; var mm=parseFloat($('cb-size').value);
    var tbl=K.flex?SIZES_FLEX:SIZES_FIXED; var sz=tbl[0]; for(var i=0;i<tbl.length;i++) if(Math.abs(tbl[i].mm-mm)<0.01) sz=tbl[i];
    // preview
    var pv=$('cb-preview'); pv.innerHTML=''; var pc=document.createElement('canvas');
    /* Hi-DPI: this cable preview was a 220x44 1x bitmap shown in a ~202px box,
       a 1.84x upscale on a retina display. Back it with device pixels and scale
       the context so the 220x44 drawing coordinates below are unchanged. */
    var _pdpr = window.devicePixelRatio || 1;
    pc.width = Math.round(220 * _pdpr); pc.height = Math.round(44 * _pdpr);
    pc.style.width = '220px'; pc.style.height = '44px';
    var x=pc.getContext('2d'); x.setTransform(_pdpr, 0, 0, _pdpr, 0, 0);
    var k=K.cores.length; var single=(k===1);
    x.lineCap='round';
    if (single){
      x.strokeStyle=K.cores[0].col; x.lineWidth=6; x.beginPath(); x.moveTo(30,22); x.lineTo(170,22); x.stroke();
      if (K.cores[0].role==='E'){ x.setLineDash([4,5]); x.strokeStyle='#f5d020'; x.lineWidth=2; x.beginPath(); x.moveTo(30,22); x.lineTo(170,22); x.stroke(); x.setLineDash([]); }
      x.strokeStyle='#e0a45a'; x.lineWidth=5; x.beginPath(); x.moveTo(170,22); x.lineTo(188,22); x.stroke();  // bare copper tip
    } else {
      x.strokeStyle='#e9ebf0'; x.lineWidth=K.flex?9:13; x.beginPath(); x.moveTo(30,22); x.lineTo(150,22); x.stroke();
      x.strokeStyle='rgba(255,255,255,0.5)'; x.lineWidth=2; x.beginPath(); x.moveTo(30,19); x.lineTo(150,19); x.stroke();
      for (var c2=0;c2<k;c2++){ var t=(c2-(k-1)/2); var yy=22+t*8; x.strokeStyle=K.cores[c2].col; x.lineWidth=3; x.beginPath(); x.moveTo(150,22); x.lineTo(185,yy); x.stroke(); x.fillStyle=K.cores[c2].col; x.beginPath(); x.arc(188,yy,4,0,7); x.fill(); }
    }
    pc.style.maxWidth='100%'; pv.appendChild(pc);
    $('cb-rating').innerHTML = K.name+' · '+sz.mm.toFixed(sz.mm<1?2:1)+' mm² (SWG '+sz.swg+')<br>Rated <b>'+sz.a+' A</b> ≈ <b>'+round(sz.a*volts/1000,1)+' kW</b> @ '+volts+' V';
  }

  /* ═══════════════════════════════════════════════════════════════
     MODE SWITCHING
     ═══════════════════════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════════════════════
     TEST / VERIFICATION MODE  (initial verification suite)
     ═══════════════════════════════════════════════════════════════ */
  var testInit=false, testType='continuity';
  var TESTS=[ {id:'continuity',n:'Earth Continuity'}, {id:'polarity',n:'Polarity'}, {id:'insulation',n:'Insulation R'}, {id:'zs',n:'Zₛ (Loop)'}, {id:'rcd',n:'RCD'} ];
  var MAX_ZS_B={6:7.28,10:4.37,16:2.73,20:2.19,25:1.75,32:1.37,40:1.09};   // BS 7671 max Zs, Type-B MCB, 0.4 s
  function maxZs(a){ var keys=Object.keys(MAX_ZS_B).map(Number).sort(function(x,y){return x-y;}); for(var i=0;i<keys.length;i++) if(a<=keys[i]) return MAX_ZS_B[keys[i]]; return MAX_ZS_B[40]; }
  function initTest(){
    var box=$('test-btns'); if(!box) return; box.innerHTML='';
    TESTS.forEach(function(t){ var b=el('button','test-btn',t.n); b.dataset.tid=t.id; b.onclick=function(){ runTest(t.id); }; box.appendChild(b); });
    var ze=$('test-ze'); if(ze) ze.onchange=function(){ if(mode==='test') runTest(testType); };
  }
  function trTitle(out,t){ out.appendChild(el('div','test-result-title',t)); }
  function trLine(out,label,val,verdict){ var l=el('div','test-line'); l.appendChild(el('span',null,label));
    if(val!=null) l.appendChild(el('span','tl-val',val));
    if(verdict) l.appendChild(el('span','test-badge '+verdict, verdict==='pass'?'PASS':verdict==='fail'?'FAIL':'N/A'));
    out.appendChild(l); }
  function trSub(out,html){ var p=el('div','test-sub'); p.innerHTML=html; out.appendChild(p); }
  function earthTerm(c){ var ts=termList(c); for(var i=0;i<ts.length;i++){ if(ts[i].id==='E'||ts[i].id==='Eo'||ts[i].id==='Ei') return ts[i].id; } return null; }
  function accName(c){ return c.load?LOADS[c.type].name:(COMP[c.type]?COMP[c.type].name:c.type); }
  function runTest(id){
    testType=id;
    document.querySelectorAll('#test-btns .test-btn').forEach(function(b){ b.classList.toggle('active', b.dataset.tid===id); });
    recompute();
    var out=$('test-readout'); if(!out) return; out.innerHTML='';
    var R2=R;
    if (!R2 || R2.noSupply){ out.appendChild(el('p','test-hint','Add a Consumer Unit and build a circuit in Simulate mode first.')); return; }
    if (id==='continuity') testContinuity(out,R2);
    else if (id==='polarity') testPolarity(out,R2);
    else if (id==='insulation') testInsulation(out,R2);
    else if (id==='zs') testZs(out,R2);
    else if (id==='rcd') testRcd(out,R2);
  }
  function testContinuity(out,R2){
    trTitle(out,'Protective (earth) continuity');
    var supE=tkey(R2.supplyId,'E'), any=false, allPass=true;
    comps.forEach(function(c){ if(c.type==='supply') return; var et=earthTerm(c); if(!et) return;
      if(c.load && !LOADS[c.type].classI) return;
      any=true; var ok=R2._same(tkey(c.id,et), supE); if(!ok) allPass=false;
      trLine(out, accName(c), ok?'0 Ω · continuous':'∞ · open', ok?'pass':'fail'); });
    if(!any) out.appendChild(el('p','test-hint','No earthed (Class I) accessories to test — add a socket, cooker or a Class-I appliance and wire its earth.'));
    else trSub(out, allPass?'Every protective conductor is continuous back to the main earthing terminal.':'A break in the earth (CPC) leaves exposed metal live under fault — trace the green-yellow conductor.');
  }
  function testPolarity(out,R2){
    trTitle(out,'Polarity — Line on the correct pole');
    var supL=tkey(R2.supplyId,'L'), supN=tkey(R2.supplyId,'N'), any=false, allPass=true;
    comps.forEach(function(c){ if(!isSocket(c)) return; any=true;
      var lOnL=R2._same(tkey(c.id,'L'),supL), lOnN=R2._same(tkey(c.id,'L'),supN);
      var verdict = lOnL?'pass':(lOnN?'fail':'na'), txt = lOnL?'L on Line':(lOnN?'reversed (L on N)':'not fed');
      if(verdict==='fail') allPass=false; trLine(out, accName(c), txt, verdict); });
    comps.filter(function(x){return x.load;}).forEach(function(ld){ if(!R2.energized[ld.id]) return; any=true;
      var rev=R2.reversed[ld.id]; if(rev) allPass=false; trLine(out, accName(ld), rev?'L/N swapped':'correct', rev?'fail':'pass'); });
    if(!any) out.appendChild(el('p','test-hint','Add a socket, or power on a load, to verify polarity.'));
    else trSub(out, allPass?'Line is on the correct pole — switches will break the Line, never the Neutral.':'Reversed polarity leaves a fitting live when switched off. Swap brown and blue at the fault.');
  }
  function testInsulation(out,R2){
    trTitle(out,'Insulation resistance (isolated circuit)');
    [['Line ↔ Neutral', R2.short], ['Line ↔ Earth', R2.earthFault], ['Neutral ↔ Earth', R2.neFault]].forEach(function(r){
      trLine(out, r[0], r[1]?'0.0 MΩ':'> 299 MΩ', r[1]?'fail':'pass'); });
    var bad=R2.short||R2.earthFault||R2.neFault;
    trSub(out, bad?'A near-zero reading means conductors are touching (a short or an earth fault). Clear it before energising.':'Insulation is sound — well above the 1 MΩ minimum. (Connected lamps/loads are treated as removed for this test.)');
  }
  function testZs(out,R2){
    trTitle(out,'Earth-fault loop impedance Zₛ');
    var ze=parseFloat(($('test-ze')||{}).value); if(!isFinite(ze)) ze=0.35;
    var any=false;
    comps.filter(function(x){return x.load;}).forEach(function(ld){ if(!R2.energized[ld.id]) return; var I=R2.loadCurr[ld.id]||0; if(I<=0) return;
      any=true; var loop=(R2.loadVdrop[ld.id]||0)/I, zs=ze+loop, mx=maxZs(R2.supplyMcb), ok=zs<=mx+0.001;
      trLine(out, accName(ld)+' · '+R2.supplyMcb+' A', zs.toFixed(2)+' Ω / max '+mx+' Ω', ok?'pass':'fail'); });
    if(!any) out.appendChild(el('p','test-hint','Zₛ is a LIVE test — power on the circuit, then run it again.'));
    else trSub(out, 'Zₛ = Zₑ + (R1+R2). Too high and the breaker may not clear a fault in time. <i>Indicative — the CPC is estimated from the run length.</i>');
  }
  function testRcd(out,R2){
    trTitle(out,'RCD — residual current device');
    if(R2.rcd){ trLine(out,'Trip at 1× (30 mA)','≈ 210 ms','pass'); trLine(out,'Trip at 5× (150 mA)','≈ 28 ms','pass');
      trSub(out,'A 30 mA RCD disconnects well within limits (≤300 ms at 1×, ≤40 ms at 5×), protecting against shock. <i>Indicative times.</i>'); }
    else { trLine(out,'RCD fitted?','none','fail'); trSub(out,'No RCD at the consumer unit. Fit 30 mA RCD protection (Consumer Unit inspector) for socket and shower circuits.'); }
  }

  function setMode(m){
    mode=m;
    var showSim = m==='simulate' || m==='test';   // Test mode keeps the sim view — you probe the circuit you built
    $('sim-wrap').style.display = showSim?'flex':'none';
    $('cat-row').style.display = m==='explore'?'flex':'none';
    $('item-selector').style.display = m==='explore'?'block':'none';
    $('item-info').style.display = m==='explore'?'flex':'none';
    $('practice-panel').style.display = m==='practice'?'block':'none';
    $('practice-bar').style.display = m==='practice'?'flex':'none';
    $('quiz-panel').style.display = m==='quiz'?'block':'none';
    $('quiz-bar').style.display = m==='quiz'?'flex':'none';
    $('quiz-result').style.display='none';
    var tp=$('test-panel'); if(tp) tp.style.display = m==='test'?'block':'none';
    var cd=$('cable-dock'); if(cd) cd.style.display = m==='test'?'none':'';   // hide edit dock while testing
    if (m==='explore' && !exploreInit){ initExplore(); exploreInit=true; }
    if (m==='practice'){ newProblem(); }
    if (m==='quiz'){ startQuiz(); }
    if (m==='test'){ if(!testInit){ initTest(); testInit=true; } runTest(testType||'continuity'); }
    if (showSim){ resize(); }
  }

  /* ═══════════════════════════════════════════════════════════════
     EXPLORE
     ═══════════════════════════════════════════════════════════════ */
  var EXPLORE = {
    cable: [
      { n:'Wire Gauge & Current', s:'SWG · mm² · Amps', d:'Household cable is sized by cross-sectional area. The larger the area, the lower the resistance and the more current it can carry before the insulation (70 °C for PVC) overheats. The old <strong>SWG</strong> number runs the other way — a higher number is a thinner wire.', f:'I = P / V', ex:['A 2000 W load at 230 V draws <strong>I = 2000/230 = 8.7 A</strong>','Pick a cable rated above 8.7 A → 1.5 mm² flex (16 A) is fine','Higher SWG = thinner: SWG 16 ≈ 2.5 mm², SWG 10 ≈ 10 mm²'] },
      { n:'Core Colours', s:'L · N · E', d:'Modern IEC/UK harmonised colours: <strong>Brown = Line</strong> (live), <strong>Blue = Neutral</strong>, <strong>Green-and-yellow = Earth</strong>. Old UK used red/black; the US uses black (hot), white (neutral), green (ground). Getting colours right is a safety-critical habit.', f:'Brown · Blue · Green-Yellow', ex:['Line (brown) carries the supply voltage','Neutral (blue) is the return path','Earth (green-yellow) protects against shock — never carries current normally'] },
      { n:'Multicore Cables', s:'2-core · T&E · 3-core', d:'Real cable is a sheath holding several conductors. <strong>2-core</strong> (L+N) suits double-insulated Class II fittings; <strong>Twin & Earth</strong> adds a protective earth for fixed wiring; <strong>3-core + earth</strong> carries the strappers for two-way switching.', ex:['Lighting & sockets → Twin & Earth','Two-way switch link → 3-core + earth','Plastic lamp, no metal → 2-core is enough'] },
      { n:'Flex Sizes', s:'0.5–2.5 mm²', d:'Flexible cord connects appliances. Rating rises with size: 0.5 mm² ≈ 3 A, 0.75 mm² ≈ 6 A (~1400 W), 1.25 mm² ≈ 13 A (~3000 W).', ex:['TV / lamp → 0.75 mm² flex','Kettle / iron → 1.25 mm² flex','Match the flex to the appliance current'] }
    ],
    components: [
      { n:'One-Way Switch', s:'SPST · COM–L1', d:'A simple on/off switch with two terminals (COM and L1). It must break the <strong>Line</strong>, never the neutral, so the fitting is dead when off.', ex:['ON: COM connects to L1','Breaks the live feed to the lamp','Switching the neutral leaves the lamp live — dangerous'] },
      { n:'Two-Way Switch', s:'SPDT · COM/L1/L2', d:'Three terminals let a light be controlled from two places (staircase). Two switches are linked by 3-core strappers; the lamp toggles whenever either switch changes.', ex:['COM connects to L1 or L2','Same strapper both ends → ON','Add an intermediate switch for a third point'] },
      { n:'Socket & Circuits', s:'13A · ring/radial', d:'A 13 A socket has L, N and E terminals. On a <strong>ring</strong> circuit (2.5 mm², 32 A) the cable loops out and back; on a <strong>radial</strong> it runs one way (20 A on 2.5 mm²).', ex:['Ring: two cables at each socket','Radial: last socket has one cable','US uses radial only — no ring'] },
      { n:'Consumer Unit', s:'MCB · RCD · busbar', d:'The distribution hub: a main switch feeds a busbar; each circuit has an <strong>MCB</strong> (6–40 A) for overcurrent, and an <strong>RCD/RCBO</strong> (30 mA) for shock protection.', ex:['Lighting → 6 A MCB','Sockets → 32 A (ring)','Cooker/shower → 32–40 A'] },
      { n:'Fused Spur (FCU)', s:'3A/13A fuse', d:'A fused connection unit spurs a fixed appliance off a circuit with its own fuse, sized to protect the appliance flex.', ex:['Boiler, towel rail, extractor','Fuse just above running current','Fuse must be below the flex rating'] }
    ],
    protection: [
      { n:'How an MCB Trips', s:'thermal + magnetic', d:'An MCB has two mechanisms: a <strong>bimetallic strip</strong> for slow overloads (trips in seconds), and a <strong>solenoid</strong> for short circuits (trips in milliseconds).', ex:['Overload (too many appliances) → thermal trip','Short circuit (L touches N) → magnetic trip','Type B (domestic) trips at 3–5× rating'] },
      { n:'Earthing', s:'CPC · fault loop', d:'The earth conductor bonds exposed metal so that a live fault creates a large current that trips the breaker fast, instead of leaving the metal live at 230 V.', ex:['Class I (metal) appliances need earth','Class II (double-insulated) do not','Low loop impedance → fast disconnection'] },
      { n:'RCD / GFCI', s:'30 mA', d:'An RCD compares Line and Neutral current. Any imbalance (leakage to earth, e.g. through a person) trips it at 30 mA — far below what an MCB can see.', f:'trips at I_leak ≥ 30 mA', ex:['Protects against electric shock','Required on sockets & bathrooms','US GFCI trips at ~5 mA'] },
      { n:'Fuse Selection', s:'I_load ≤ I_fuse ≤ I_cable', d:'Pick the fuse just above the running current and below the cable rating, so the cable can never overheat before the fuse blows.', f:'I_load ≤ I_device ≤ I_cable', ex:['3 kW kettle (13 A) → 13 A fuse','Lamp (<3 A) → 3 A fuse','13 A fuse on a 3 A lamp flex → dangerous'] }
    ],
    circuits: [
      { n:'One-Way Light', s:'switch on live', d:'Supply Line → MCB → switch → lamp → Neutral back. The switch breaks only the live conductor.', ex:['L → switch COM','switch L1 → lamp L','N → lamp N (never switched)'] },
      { n:'Two-Way Staircase', s:'two SPDT + 3-core', d:'Two two-way switches linked by a 3-core cable let one lamp be controlled from top and bottom of the stairs.', ex:['L → switch A COM','A L1/L2 → B L1/L2 (strappers)','B COM → lamp; toggling either switch changes state'] },
      { n:'Ring vs Radial', s:'sockets', d:'A ring returns to the same MCB so 2.5 mm² can serve 32 A; a radial runs one way at 20 A.', ex:['Ring: 2.5 mm² on 32 A','Radial: 2.5 mm² on 20 A','Both use Twin & Earth'] },
      { n:'Loop-in Lighting', s:'ceiling rose', d:'The rose keeps a permanent live and neutral looping through to the next fitting; only a switched live and neutral reach the bulb.', ex:['Lp = permanent live (loops on)','Sw = switched live to lamp','Minimises cable runs'] }
    ]
  };
  var exploreInit=false, exCat='cable', exSel=0;
  function initExplore(){ document.querySelectorAll('#cat-tabs .pill').forEach(function(p){ p.onclick=function(){ document.querySelectorAll('#cat-tabs .pill').forEach(function(q){q.classList.remove('active');}); p.classList.add('active'); exCat=p.dataset.cat; exSel=0; renderExplore(); }; }); renderExplore(); }
  function renderExplore(){
    var grid=$('concept-grid'); grid.innerHTML=''; var arr=EXPLORE[exCat];
    arr.forEach(function(it,i){ var b=el('button','is-btn'+(i===exSel?' active':'')); b.innerHTML='<span class="is-btn-name">'+it.n+'</span><span class="is-btn-sym">'+it.s+'</span>'; b.onclick=function(){ exSel=i; renderExplore(); }; grid.appendChild(b); });
    var it=arr[exSel]; var info=$('item-info'); var h='';
    h+='<div class="ii-top"><span class="ii-name">'+it.n+'</span><span class="ii-cat-badge">'+exCat+'</span></div>';
    h+='<div class="ii-desc">'+it.d+'</div>';
    if (it.f) h+='<div class="formula-box"><span class="fb-formula">'+it.f+'</span></div>';
    if (it.ex){ h+='<div class="example-box"><h4>Key points</h4>'; it.ex.forEach(function(e){ h+='<div class="ex-step">• '+e+'</div>'; }); h+='</div>'; }
    info.innerHTML=h;
  }

  /* ═══════════════════════════════════════════════════════════════
     PRACTICE
     ═══════════════════════════════════════════════════════════════ */
  var pScore={c:0,t:0}, pCur=null;
  var APPL_KEYS=Object.keys(LOADS);
  function newProblem(){
    $('pp-feedback').textContent=''; $('pp-feedback').className='feedback'; $('pp-solution').style.display='none'; $('pp-next').style.display='none';
    $('pp-choices').style.display='none'; $('pp-choices').innerHTML='';
    $('pp-input-row').style.display='flex'; $('pp-input').value=''; $('pp-input').disabled=false;
    var kind = Math.floor(Math.random()*4);
    if (kind===0){ // current from watts
      var k=APPL_KEYS[Math.floor(Math.random()*APPL_KEYS.length)]; var d=LOADS[k]; var w=Math.round((d.min+Math.random()*(d.max-d.min))/10)*10; var v=volts;
      pCur={ type:'num', ans:w/v, tol:0.15, unit:'A',
        prompt:'A '+d.name.toLowerCase()+' is rated '+w+' W on a '+v+' V supply. What current does it draw?',
        sol:['I = P / V','I = '+w+' / '+v,'I = <strong>'+round(w/v,2)+' A</strong>'] };
    } else if (kind===1){ // pick cable size (choice)
      var loadsBig=[['3 kW kettle',3000],['2 kW heater',2000],['150 W TV',150],['9 kW shower',9000]][Math.floor(Math.random()*4)];
      var cur=loadsBig[1]/volts;
      var opts=[ {t:'0.5 mm² (3 A)',a:3},{t:'0.75 mm² (6 A)',a:6},{t:'1.25 mm² flex (13 A)',a:13},{t:'6 mm² (47 A)',a:47} ];
      var correct=null; opts.forEach(function(o){ if(o.a>=cur && (!correct||o.a<correct.a)) correct=o; });
      pCur={ type:'choice', opts:opts.map(function(o){return o.t;}), correct:opts.indexOf(correct),
        prompt:'Which is the smallest suitable cable for a '+loadsBig[0]+' at '+volts+' V (draws '+round(cur,1)+' A)?',
        sol:['I = '+loadsBig[1]+' / '+volts+' = '+round(cur,1)+' A','Choose the smallest cable rated above '+round(cur,1)+' A','Answer: <strong>'+correct.t+'</strong>'] };
    } else if (kind===2){ // fuse choice
      var ap=[['table lamp',60],['TV',120],['kettle',2400],['iron',1800]][Math.floor(Math.random()*4)];
      var ic=ap[1]/volts; var fuse = ic<=3?3:13;
      pCur={ type:'choice', opts:['3 A','5 A','13 A','No fuse'], correct: fuse===3?0:2,
        prompt:'What plug fuse suits a '+ap[0]+' ('+ap[1]+' W, '+round(ic,1)+' A)?',
        sol:['Running current = '+ap[1]+'/'+volts+' = '+round(ic,1)+' A','Use 3 A below ~700 W, 13 A above','Answer: <strong>'+(fuse===3?'3 A':'13 A')+'</strong>'] };
    } else { // colour / earth concept
      var q=[ {p:'A metal-bodied washing machine — does it need an earth?',o:['Yes','No'],c:0,s:['It is Class I (exposed metal)','A live fault must trip the breaker','<strong>Yes — connect the earth</strong>']},
              {p:'Which colour is the modern Line conductor?',o:['Blue','Brown','Green-yellow','Black'],c:1,s:['IEC harmonised colours','<strong>Brown = Line</strong>, Blue = Neutral']},
              {p:'A switch should break which conductor?',o:['Neutral','Line','Earth','Either'],c:1,s:['Breaking neutral leaves the fitting live','<strong>Always switch the Line</strong>']} ][Math.floor(Math.random()*3)];
      pCur={ type:'choice', opts:q.o, correct:q.c, prompt:q.p, sol:q.s };
    }
    $('pp-prompt').textContent=pCur.prompt;
    if (pCur.type==='num'){ $('pp-unit').textContent=pCur.unit; }
    else { $('pp-input-row').style.display='none'; $('pp-choices').style.display='grid';
      pCur.opts.forEach(function(o,i){ var b=el('button','pp-choice',o); b.onclick=function(){ checkChoice(i,b); }; $('pp-choices').appendChild(b); }); }
  }
  function checkChoice(i,btn){
    if (pCur.done) return; pCur.done=true; pScore.t++;
    var ok = i===pCur.correct;
    if (ok){ pScore.c++; btn.classList.add('correct'); $('pp-feedback').textContent='Correct!'; $('pp-feedback').className='feedback ok'; sfxGood(); }
    else { btn.classList.add('wrong'); $('pp-choices').children[pCur.correct].classList.add('correct'); $('pp-feedback').textContent='Not quite.'; $('pp-feedback').className='feedback err'; sfxBad(); }
    Array.prototype.forEach.call($('pp-choices').children,function(b){b.classList.add('locked');});
    showSol();
  }
  function checkNum(){
    if (!pCur||pCur.type!=='num'||pCur.done) return; var v=parseFloat($('pp-input').value); if(isNaN(v)) return;
    pCur.done=true; pScore.t++; var ok=Math.abs(v-pCur.ans)<=Math.abs(pCur.ans)*pCur.tol+0.01;
    if (ok){ pScore.c++; $('pp-feedback').textContent='Correct! ≈ '+round(pCur.ans,2)+' '+pCur.unit; $('pp-feedback').className='feedback ok'; sfxGood(); }
    else { $('pp-feedback').textContent='Not quite — answer ≈ '+round(pCur.ans,2)+' '+pCur.unit; $('pp-feedback').className='feedback err'; sfxBad(); }
    $('pp-input').disabled=true; showSol();
  }
  function showSol(){ $('pbar-score-val').textContent=pScore.c+' / '+pScore.t; var s=$('pp-solution'); s.style.display='block'; s.innerHTML='<h4>Solution</h4>'+pCur.sol.map(function(x){return '<div class="sol-step">'+x+'</div>';}).join(''); $('pp-next').style.display='inline-block'; }

  /* ═══════════════════════════════════════════════════════════════
     QUIZ
     ═══════════════════════════════════════════════════════════════ */
  var QUIZ_POOL=[
    { q:'Which formula gives the current a load draws?', o:['I = P × V','I = P / V','I = V / P','I = P + V'], c:1 },
    { q:'What colour is the modern Line (live) conductor?', o:['Blue','Green-yellow','Brown','White'], c:2 },
    { q:'A two-way switch has how many terminals?', o:['2','3','4','1'], c:1 },
    { q:'A 30 mA device that protects against electric shock is a…', o:['MCB','RCD','Fuse','Isolator'], c:1 },
    { q:'Twin & Earth 2.5 mm² is normally used for…', o:['Lighting','Socket circuits','Cooker only','Doorbell'], c:1 },
    { q:'A switch must break which conductor?', o:['Neutral','Earth','Line','Any'], c:2 },
    { q:'A 3 kW kettle at 230 V draws about…', o:['3 A','13 A','30 A','1 A'], c:1 },
    { q:'A metal-bodied (Class I) appliance requires…', o:['No earth','An earth (CPC)','Only neutral','A bigger fuse'], c:1 },
    { q:'The safe-sizing rule is…', o:['I_cable ≤ I_device ≤ I_load','I_load ≤ I_device ≤ I_cable','I_device ≤ I_load','No rule'], c:1 },
    { q:'A short circuit (L touches N) causes the MCB to trip via its…', o:['Thermal strip','Magnetic solenoid','Fuse wire','RCD coil'], c:1 },
    { q:'Higher SWG number means the wire is…', o:['Thicker','Thinner','Longer','Hotter'], c:1 },
    { q:'Which cable is used between two-way switches?', o:['2-core','Twin & Earth','3-core + earth','Single core'], c:2 }
  ];
  var qSet=[], qIdx=0, qScore=0, qAns=[];
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
  function startQuiz(){ qSet=shuffle(QUIZ_POOL).slice(0,5); qIdx=0; qScore=0; qAns=[]; $('quiz-result').style.display='none'; $('quiz-panel').style.display='block'; $('quiz-bar').style.display='flex'; renderQ(); }
  function renderQ(){ var q=qSet[qIdx]; $('qbar-num').textContent=(qIdx+1);
    var h='<p class="qp-prompt">'+q.q+'</p><div class="answer-grid">'; q.o.forEach(function(o,i){ h+='<button class="answer-btn" data-i="'+i+'">'+o+'</button>'; }); h+='</div>';
    var p=$('quiz-panel'); p.innerHTML=h;
    p.querySelectorAll('.answer-btn').forEach(function(b){ b.onclick=function(){ answerQ(+b.dataset.i,p); }; });
  }
  function answerQ(i,p){ var q=qSet[qIdx]; var btns=p.querySelectorAll('.answer-btn'); btns.forEach(function(b){ b.classList.add('locked'); });
    var ok=i===q.c; qAns.push({q:q.q,ok:ok,chosen:q.o[i],correct:q.o[q.c]});
    if (ok){ qScore++; btns[i].classList.add('correct'); sfxGood(); } else { btns[i].classList.add('wrong'); btns[q.c].classList.add('correct'); sfxBad(); }
    setTimeout(function(){ qIdx++; if(qIdx<5) renderQ(); else showQResult(); }, 850);
  }
  function showQResult(){ $('quiz-panel').style.display='none'; $('quiz-bar').style.display='none';
    var r=$('quiz-result'); r.style.display='flex';
    var stars = qScore>=5?'★★★':qScore>=4?'★★':qScore>=2?'★':'—';
    var cls = qScore>=5?'perfect':qScore>=3?'good':'poor';
    var verd = qScore>=5?'Perfect — you know your wiring!':qScore>=3?'Good work — review the misses.':'Keep practising in Explore mode.';
    var h='<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">'+stars+'</span></div><div class="qr-score-wrap"><div class="qr-score '+cls+'">'+qScore+'/5</div><div class="qr-verdict">'+verd+'</div></div></div><div class="qr-rows">';
    qAns.forEach(function(a,i){ h+='<div class="qr-row '+(a.ok?'ok':'err')+'"><span class="qr-qnum">Q'+(i+1)+'</span><span class="qr-detail">'+a.q+(a.ok?'':' — <strong>'+a.correct+'</strong>')+'</span><span class="qr-mark">'+(a.ok?'✓':'✗')+'</span></div>'; });
    h+='</div><button class="btn btn-primary" id="qr-retry" style="align-self:flex-start">↻ Try Again</button>';
    r.innerHTML=h; $('qr-retry').onclick=startQuiz;
  }

  /* ═══════════════════════════════════════════════════════════════
     CONTEXT MENU
     ═══════════════════════════════════════════════════════════════ */
  /* Render the right-click menu. Each item is [label, fn] or [label, fn, {danger:true}];
     a bare ['---'] draws a separator. The menu is clamped inside the viewport. */
  function showCtx(x,y,items){ var m=$('ctx-menu'); m.innerHTML='';
    items.forEach(function(a){
      if (a.length===1 && a[0]==='---'){ m.appendChild(el('div','ctx-sep')); return; }
      var b=el('button', (a[2]&&a[2].danger)?'ctx-danger':null, a[0]);
      b.onclick=function(){ a[1](); hideCtx(); }; m.appendChild(b);
    });
    m.style.left=x+'px'; m.style.top=y+'px'; m.classList.add('active'); m.setAttribute('aria-hidden','false');
    var r=m.getBoundingClientRect();                                    // keep it on-screen
    if (r.right>window.innerWidth)  m.style.left=Math.max(4, x-r.width )+'px';
    if (r.bottom>window.innerHeight) m.style.top =Math.max(4, y-r.height)+'px';
  }
  function hideCtx(){ var m=$('ctx-menu'); m.classList.remove('active'); m.setAttribute('aria-hidden','true'); }

  /* Build the menu for a right-click at logical point p (selects whatever is under the cursor first). */
  function contextMenuFor(p, extra){
    var items=(extra||[]).slice();
    var c=compAt(p.x,p.y); var pg=(!c)?plugAt(p.x,p.y):null; var cb=(!c&&!pg)?cableBodyAt(p.x,p.y):null;
    if (c) selectComp(c); else if (pg) selectCable(pg); else if (cb) selectCable(cb);
    if (sel && sel.kind==='comp'){ var rc=sel.ref;
      items.push(['⚙  Properties…', openProps]);
      items.push(['⤡  Minimum size', function(){ setScale(rc, SCALE_MIN); }]);
      items.push(['⤢  Maximum size', function(){ setScale(rc, SCALE_MAX); }]);
      items.push(['⧉  Duplicate', duplicateSelected]);
      items.push(['🗑  Remove', deleteSelected, {danger:true}]);
      items.push(['---']);
    } else if (sel && sel.kind==='cable'){
      items.push(['⚙  Properties…', openProps]);
      items.push(['⧉  Duplicate', duplicateSelected]);
      items.push(['🗑  Remove', deleteSelected, {danger:true}]);
      items.push(['---']);
    }
    items.push(['🖼  Save as Image', saveImg]);
    items.push(['📋  Copy Reading', copyReading]);
    if (comps.length || cables.length){ items.push(['---']); items.push(['✖  Clear Board', clearAll, {danger:true}]); }
    return items;
  }
  function setScale(c, s){ c.scale=s; resolveOverlap(c); buildInspector(); draw(); commit(); }

  /* ── Properties popup (double-click a component/load/cable) ──
     Reuses the exact inspector controls by pointing buildInspector at the popup body. */
  function ensurePropModal(){
    if ($('prop-modal')) return;
    // append to <body> so position:fixed is relative to the viewport (a transformed
    // ancestor like #sim-wrap would otherwise trap the overlay in its own box)
    var wrap=document.body;
    var m=el('div','prop-modal'); m.id='prop-modal'; m.setAttribute('aria-hidden','true');
    var bg=el('div','prop-backdrop'); bg.onclick=closeProps;
    var dlg=el('div','prop-dialog');
    var head=el('div','prop-head');
    var ttl=el('span','prop-title','Properties'); ttl.id='prop-title';
    var x=el('button','prop-close','✕'); x.setAttribute('aria-label','Close'); x.onclick=closeProps;
    head.appendChild(ttl); head.appendChild(x);
    var body=el('div','prop-body'); body.id='prop-body';
    var foot=el('div','prop-foot');
    var delb=el('button','btn btn-ghost prop-del','🗑 Delete'); delb.onclick=deleteSelected;   // closes the popup itself
    var okb=el('button','btn btn-primary prop-ok','✓ OK'); okb.onclick=closeProps;
    foot.appendChild(delb); foot.appendChild(okb);
    dlg.appendChild(head); dlg.appendChild(body); dlg.appendChild(foot); m.appendChild(bg); m.appendChild(dlg);
    wrap.appendChild(m);
  }
  function propsOpen(){ var m=$('prop-modal'); return !!(m && m.classList.contains('active')); }
  function openProps(){ if(!sel) return; ensurePropModal();
    var mm=$('prop-modal'), host=document.fullscreenElement||document.webkitFullscreenElement||document.body;
    if (mm.parentNode!==host) host.appendChild(mm);   // in fullscreen, the overlay must live inside the fullscreen element
    inspTarget=$('prop-body'); buildInspector();
    var t=$('prop-title'); if(t) t.textContent=(sel.kind==='cable'
      ? (CABLE_KINDS[sel.ref.kind]?CABLE_KINDS[sel.ref.kind].name:'Cable')
      : accName(sel.ref)) + ' — Properties';
    var m=$('prop-modal'); m.classList.add('active'); m.setAttribute('aria-hidden','false');
    hideCtx();
  }
  function closeProps(){ var m=$('prop-modal'); if(m){ m.classList.remove('active'); m.setAttribute('aria-hidden','true'); }
    inspTarget=null; buildInspector();   // restore the side-panel inspector for the current selection
  }
  function disconnectConductor(cb,end,i){ if(end==='A') cb.landA[i]=null; else cb.landB[i]=null; $('wire-hint').textContent='Conductor disconnected.'; recompute(); draw(); commit(); sfxSwitch(); }
  function saveImg(){ try{ var a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download='wiring-circuit.png'; a.click(); }catch(e){} }
  function copyReading(){ var t='Supply '+volts+' V · total '+(R?round(R.total,1):0)+' A · '+(R?R.liveCount:0)+' live loads'; try{ navigator.clipboard.writeText(t); }catch(e){} }

  /* ── save / open circuit (JSON file) + fullscreen ── */
  function exportCircuit(){
    try {
      var data = snapshot();
      var blob = new Blob([data], {type:'application/json'});
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'wiring-circuit.json'; a.click();
      setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1500);
      $('wire-hint').textContent = 'Circuit saved to wiring-circuit.json'; sfxClick();
    } catch(e){}
  }
  function importCircuit(text){
    var s; try { s = JSON.parse(text); } catch(e){ $('wire-hint').textContent='Could not open — not a valid circuit file.'; return; }
    if (!s || !s.comps) { $('wire-hint').textContent='Could not open — not a wiring-circuit file.'; return; }
    restore(text); powered=false; tripped=false; tHeat=0; setPowerBtn(); commit();
    $('wire-hint').textContent='Circuit opened. Press Power ON to energise.'; sfxOn();
  }

  /* ── shareable-URL: the whole circuit is encoded into the link (no backend) ──
     snapshot() JSON → [flag byte] + (deflate-raw | raw) → base64url → location.hash '#c='
     flag 1 = deflate-raw compressed, 0 = uncompressed fallback (no CompressionStream). */
  function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
  function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){ return new Uint8Array(b); }); }
  function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){ return new Uint8Array(b); }); }
  var SHARE_MAX = 1800;   // encoded-hash char ceiling — beyond this, refuse a link rather than emit a broken one
  /* Slim snapshot for the URL: drop every field restore() regenerates anyway (cable geometry,
     per-solve currents, transient heat) — keeps the link ~4× shorter. restore() rebuilds path,
     _A/_B/_sa/_sb, ax/ay/bx/by, _cL/_cN/_curr/_vdrop, over/fire/heat from `pts` + recompute(). */
  var SHARE_DROP = { path:1, ax:1, ay:1, bx:1, by:1, over:1, fire:1, heat:1 };
  function shareSnapshot(){
    return JSON.stringify({ comps:comps, cables:cables, joints:joints, nextId:nextId, volts:volts }, function(k,v){
      if (k && (k.charAt(0)==='_' || SHARE_DROP[k]===1)) return undefined;   // strip transient/computed keys
      return v;
    });
  }

  /* flash the Share button with a transient confirmation (the #wire-hint banner hides itself,
     so the button is where the user actually looks after clicking) */
  function flashShare(label, ok){
    var b=$('btn-share'); if(!b) return;
    if(b._orig==null) b._orig=b.innerHTML;
    clearTimeout(b._ft);
    b.textContent=label; b.style.color = ok===false ? '#ff6b6b' : (ok ? '#43c66a' : '');
    b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900);
  }
  function shareLink(){
    try {
      var U = new TextEncoder().encode(shareSnapshot());
      var canZip = (typeof CompressionStream !== 'undefined');
      var bodyP = canZip ? deflateBytes(U) : Promise.resolve(U);
      return bodyP.then(function(body){
        var out = new Uint8Array(body.length + 1); out[0] = canZip ? 1 : 0; out.set(body, 1);
        var enc = b64urlEncode(out);
        if (enc.length > SHARE_MAX){ $('wire-hint').textContent = 'This circuit is too big to share as a link — use 💾 Save (JSON) instead.'; flashShare('⚠ Too big — use Save', false); sfxBad(); return; }
        var url = location.origin + location.pathname + '#c=' + enc;
        try { window.history.replaceState(null, '', '#c=' + enc); } catch(e){}   // note: `history` is the local undo stack — must use window.history
        if (navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(url).then(
            function(){ $('wire-hint').textContent = 'Shareable link copied — anyone who opens it sees this exact circuit.'; flashShare('✓ Link copied!', true); },
            function(){ $('wire-hint').textContent = 'Shareable link is in the address bar — copy it manually.'; flashShare('↑ Link in address bar'); });
        } else { $('wire-hint').textContent = 'Shareable link is in the address bar — copy it manually.'; flashShare('↑ Link in address bar'); }
        sfxClick();
      }).catch(function(){ $('wire-hint').textContent = 'Could not create a share link.'; flashShare('✗ Share failed', false); });
    } catch(e){ $('wire-hint').textContent = 'Could not create a share link.'; flashShare('✗ Share failed', false); return Promise.resolve(); }
  }

  /* returns a promise → true if a valid #c= link was loaded; false = fall back to the seed circuit */
  function loadFromHash(){
    var h = location.hash || '';
    if (h.indexOf('#c=') !== 0) return Promise.resolve(false);
    var enc = h.slice(3);
    return Promise.resolve().then(function(){
      var final = b64urlDecode(enc), flag = final[0], body = final.subarray(1);
      return (flag === 1) ? inflateBytes(body) : Promise.resolve(body);
    }).then(function(U){
      var json = new TextDecoder().decode(U), s = JSON.parse(json);
      if (!s || !s.comps) return false;
      restore(json); powered=false; tripped=false; tHeat=0; setPowerBtn();
      history=[]; histIdx=-1; commit(); updateToolButtons();
      $('wire-hint').textContent = 'Opened a shared circuit. Press Power ON to energise.';
      return true;
    }).catch(function(){ return false; });   // corrupt link → silent fall-through to the seed
  }

  function toggleFullscreen(){
    var el=$('sim-wrap'); var fsEl=document.fullscreenElement||document.webkitFullscreenElement;
    if (!fsEl){ var req=el.requestFullscreen||el.webkitRequestFullscreen; if(req){ try{ req.call(el); }catch(e){} } }
    else { var ex=document.exitFullscreen||document.webkitExitFullscreen; if(ex){ try{ ex.call(document); }catch(e){} } }
  }
  function onFsChange(){ var fs=!!(document.fullscreenElement||document.webkitFullscreenElement);
    $('sim-wrap').classList.toggle('fs', fs); var b=$('btn-fullscreen'); if(b) b.innerHTML = fs ? '&#9974; Exit' : '&#9974; Fullscreen';
    setTimeout(resize, 60);
  }

  /* ═══════════════════════════════════════════════════════════════
     HISTORY (undo / redo) · DUPLICATE · ROTATE · SIDE PANEL
     ═══════════════════════════════════════════════════════════════ */
  var history=[], histIdx=-1;
  function snapshot(){ return JSON.stringify({ comps:comps, cables:cables, joints:joints, nextId:nextId, volts:volts }); }
  function commit(){ history=history.slice(0,histIdx+1); history.push(snapshot()); if(history.length>80){ history.shift(); } histIdx=history.length-1; updateToolButtons(); scheduleAutosave(); }

  /* ── autosave — the board survives a reload (localStorage, debounced) ──
     Armed only AFTER boot decides what to show, so the seed circuit can never
     overwrite the user's saved work. All access is guarded: localStorage throws
     in private mode on some browsers. */
  var AUTOSAVE_KEY = 'mechsim.electrical-wiring.autosave';
  var autosaveArmed = false, autosaveTimer = null;
  function autosaveNow(){ try { localStorage.setItem(AUTOSAVE_KEY, snapshot()); } catch(e){} }
  function scheduleAutosave(){ if(!autosaveArmed) return; clearTimeout(autosaveTimer); autosaveTimer=setTimeout(autosaveNow, 1000); }
  function loadAutosave(){
    var raw = null; try { raw = localStorage.getItem(AUTOSAVE_KEY); } catch(e){ return false; }
    if (!raw) return false;
    try {
      var s = JSON.parse(raw);
      if (!s || !s.comps || !s.comps.length) return false;   // nothing worth restoring → fall through to the demo
      restore(raw); powered=false; tripped=false; tHeat=0; setPowerBtn();
      history=[]; histIdx=-1; commit(); updateToolButtons();  // (still disarmed here — no write-back)
      var h=$('wire-hint'); if(h) h.textContent='Restored your last circuit. Press Power ON to energise.';
      return true;
    } catch(e){ return false; }
  }
  function restore(str){ var s=JSON.parse(str); comps=s.comps||[]; cables=s.cables||[]; joints=s.joints||[]; nextId=s.nextId||1; volts=s.volts||230;
    document.querySelectorAll('#volt-tabs .pill').forEach(function(q){ q.classList.toggle('active', +q.dataset.volt===volts); });
    sel=null; buildInspector(); recompute(); draw(); updateToolButtons(); }
  function undo(){ if(histIdx>0){ histIdx--; restore(history[histIdx]); sfxClick(); } }
  function redo(){ if(histIdx<history.length-1){ histIdx++; restore(history[histIdx]); sfxClick(); } }
  function updateToolButtons(){
    var u=$('btn-undo'), r=$('btn-redo'); if(u) u.disabled=histIdx<=0; if(r) r.disabled=histIdx>=history.length-1;
    var d=$('btn-delete'), dup=$('btn-duplicate'), rot=$('btn-rotate');
    if(d) d.disabled=!sel; if(dup) dup.disabled=!sel; if(rot) rot.disabled=!(sel&&(sel.kind==='cable'||(sel.kind==='comp'&&sel.ref.type==='connector')));
  }
  function freshId(){ var m=0; comps.forEach(function(c){ if(c.id>m) m=c.id; }); cables.forEach(function(c){ if(c.id>m) m=c.id; }); var id=m+1; if(nextId<=id) nextId=id+1; return id; }
  function duplicateSelected(){ if(!sel) return;
    if(sel.kind==='comp'){ var c=sel.ref; var n=JSON.parse(JSON.stringify(c)); n.id=freshId(); n.x=c.x+26; n.y=c.y+26; comps.push(n); resolveOverlap(n); selectComp(n); }
    else { var cb=sel.ref; var n2=JSON.parse(JSON.stringify(cb)); n2.id=freshId(); n2.landA=n2.cores.map(function(){return null;}); n2.landB=n2.cores.map(function(){return null;});
      ensureCable(n2); n2.pts=n2.pts.map(function(q){ return {x:q.x+28, y:q.y+28}; }); buildRoute(n2); cables.push(n2); selectCable(n2); }
    recompute(); draw(); commit(); sfxClick();
  }
  /* rotate a connector block +90° about its own centre (dims swap, so recentre to avoid a jump) */
  function rotateConnector(c){
    var cx=c.x+ewid(c)/2, cy=c.y+ehei(c)/2;
    c.rot=(connRot(c)+90)%360; applyConnectorDims(c);
    c.x=Math.round(cx-ewid(c)/2); c.y=Math.round(cy-ehei(c)/2);
  }
  function rotateSelected(){
    if(sel && sel.kind==='cable'){ rotateCable(sel.ref); draw(); commit(); sfxClick(); }
    else if(sel && sel.kind==='comp' && sel.ref.type==='connector'){ rotateConnector(sel.ref); recompute(); draw(); commit(); sfxClick(); }
  }
  /* anchor-pen: drag a tip along its axis to extend, or perpendicular to fold a 90° corner and continue that way */
  function anchorPen(drag, Q){
    var cb=drag.cb; ensureCable(cb); var pts=cb.pts;
    var tipIdx = drag.end==='A' ? 0 : pts.length-1;
    var base = pts[drag.end==='A' ? 1 : pts.length-2];
    if (drag.axis==='H'){
      pts[tipIdx] = { x: Math.round(clamp(Q.x,6,LW-6)), y: base.y };          // slide along axis (extend)
      if (Math.abs(Q.y - base.y) > 16){                                       // turned 90° → commit a corner
        var corner = { x: pts[tipIdx].x, y: base.y };
        if (drag.end==='B'){ pts.splice(pts.length-1, 0, corner); tipIdx=pts.length-1; } else { pts.splice(1, 0, corner); tipIdx=0; }
        pts[tipIdx] = { x: corner.x, y: Math.round(clamp(Q.y,6,LH-6)) };
        drag.axis='V';
      }
    } else {
      pts[tipIdx] = { x: base.x, y: Math.round(clamp(Q.y,6,LH-6)) };
      if (Math.abs(Q.x - base.x) > 16){
        var corner2 = { x: base.x, y: pts[tipIdx].y };
        if (drag.end==='B'){ pts.splice(pts.length-1, 0, corner2); tipIdx=pts.length-1; } else { pts.splice(1, 0, corner2); tipIdx=0; }
        pts[tipIdx] = { x: Math.round(clamp(Q.x,6,LW-6)), y: corner2.y };
        drag.axis='H';
      }
    }
    buildRoute(cb);
  }
  function initSidePanel(){ document.querySelectorAll('.sp-cat').forEach(function(h){ h.addEventListener('click', function(){ h.classList.toggle('collapsed'); }); }); }

  /* ═══════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════ */
  /* show/hide the on-canvas tip banner; when hidden, the ⓘ button takes its place */
  function setHint(on){ hintOn=on;
    var h=$('wire-hint'), b=$('hint-toggle');
    if(h) h.classList.toggle('hidden', !on);
    if(b) b.classList.toggle('show', !on);
  }
  function init(){
    canvas=$('sim-canvas'); if(!canvas) return; ctx=canvas.getContext('2d'); card=canvas.parentElement;
    // pointer
    canvas.addEventListener('pointerleave', function(){ if(!drag && (hoverNode||hoverAnchor||hoverRocker)){ hoverNode=null; hoverAnchor=null; hoverRocker=null; canvas.style.cursor='default'; draw(); } });
    canvas.addEventListener('pointerdown', function(){ var d=$('cable-dock'); if(d) d.classList.add('collapsed'); if(hintOn) setHint(false); });
    var ht=$('hint-toggle'); if(ht) ht.onclick=function(){ setHint(true); };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('contextmenu', function(e){ e.preventDefault(); if(mode!=='simulate') return; var p=toLogical(e); var extra=[];
      if (sel && sel.kind==='cable'){ var wi=waypointAt(sel.ref,p.x,p.y,12); if(wi>=0){ var scb=sel.ref; extra=[['✂  Remove this bend', function(){ scb.pts.splice(wi,1); buildRoute(scb); recompute(); draw(); commit(); }],['---']]; } }
      if (!extra.length){ var ch=conductorHandleAt(p.x,p.y,16);
        if (ch){ var landed=(ch.end==='A'?ch.cb.landA[ch.i]:ch.cb.landB[ch.i]); if(landed){ extra=[['✂  Disconnect this conductor', function(){ disconnectConductor(ch.cb,ch.end,ch.i); }],['---']]; } } }
      showCtx(e.clientX, e.clientY, contextMenuFor(p, extra)); });
    // double-click a component, load or cable → open its Properties popup
    canvas.addEventListener('dblclick', function(e){ if(mode!=='simulate') return; e.preventDefault(); var p=toLogical(e);
      var c=compAt(p.x,p.y); if(c){ selectComp(c); openProps(); return; }
      var pg=plugAt(p.x,p.y); if(pg){ selectCable(pg); openProps(); return; }
      var cb=cableBodyAt(p.x,p.y); if(cb){ selectCable(cb); openProps(); return; } });
    document.addEventListener('click', function(e){ if(!e.target.closest('#ctx-menu')) hideCtx(); });
    window.addEventListener('resize', resize);

    // mode tabs
    document.querySelectorAll('#mode-tabs .pill').forEach(function(p){ p.onclick=function(){ document.querySelectorAll('#mode-tabs .pill').forEach(function(q){q.classList.remove('active');}); p.classList.add('active'); setMode(p.dataset.mode); }; });
    // voltage tabs
    document.querySelectorAll('#volt-tabs .pill').forEach(function(p){ p.onclick=function(){ document.querySelectorAll('#volt-tabs .pill').forEach(function(q){q.classList.remove('active');}); p.classList.add('active'); volts=+p.dataset.volt; updateCablePreview(); recompute(); draw(); }; });

    // supply toolbar
    $('btn-power').onclick=function(){ powered=!powered; if(powered){ tripped=false; tHeat=0; sfxOn(); } else sfxClick(); setPowerBtn(); recompute(); draw(); };
    // pick an example from the dropdown → load it instantly (no Generate button)
    $('gen-select').onchange=function(){ var v=this.value; if(!v) return; lastPreset=v; generate(v); sfxOn(); };

    // save / open (file) + fullscreen
    $('btn-export').onclick=exportCircuit;
    $('btn-import').onclick=function(){ $('import-file').click(); };
    var bsh=$('btn-share'); if(bsh) bsh.onclick=shareLink;
    $('import-file').onchange=function(e){ var f=e.target.files&&e.target.files[0]; if(!f) return; var rd=new FileReader(); rd.onload=function(){ importCircuit(rd.result); e.target.value=''; }; rd.readAsText(f); };
    $('btn-fullscreen').onclick=toggleFullscreen;
    document.addEventListener('fullscreenchange', onFsChange); document.addEventListener('webkitfullscreenchange', onFsChange);

    // in-canvas edit tools
    $('btn-undo').onclick=undo;
    $('btn-redo').onclick=redo;
    $('btn-duplicate').onclick=duplicateSelected;
    $('btn-rotate').onclick=rotateSelected;
    var bm=$('btn-meter'); if(bm) bm.onclick=toggleMeter;
    $('btn-delete').onclick=deleteSelected;
    $('btn-clear').onclick=function(){ clearAll(); commit(); $('wire-hint').textContent='Drag a conductor tip onto a terminal — or onto another wire tip to join them · tap a connection or a joint bump to disconnect'; };

    // cable builder
    var cores=$('cb-cores'); Object.keys(CABLE_KINDS).forEach(function(k){ var o=el('option',null,CABLE_KINDS[k].name); o.value=k; cores.appendChild(o); }); cores.value='sc-l';
    cores.onchange=fillSizes; $('cb-size').onchange=updateCablePreview; fillSizes();
    $('cb-add').onclick=function(){ var kind=$('cb-cores').value; var mm=parseFloat($('cb-size').value); var off=(cables.length%6)*24; var cb=addCable(kind, mm, LW/2-100+off, LH/2-70+off, LW/2+100+off, LH/2-70+off); selectCable(cb); draw(); commit(); var d=$('cable-dock'); if(d) d.classList.add('collapsed'); sfxClick(); };

    initSidePanel();
    var cdh=$('cable-dock-head'); if(cdh) cdh.onclick=function(){ $('cable-dock').classList.toggle('collapsed'); };

    // keyboard shortcuts
    document.addEventListener('keydown', function(e){
      if (e.key==='Escape' && propsOpen()){ e.preventDefault(); closeProps(); return; }
      var typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
      var mod = e.ctrlKey || e.metaKey;
      if (mode==='simulate' && !typing){
        if (mod && (e.key==='z'||e.key==='Z')){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); return; }
        if (mod && (e.key==='y'||e.key==='Y')){ e.preventDefault(); redo(); return; }
        if (mod && (e.key==='d'||e.key==='D')){ e.preventDefault(); duplicateSelected(); return; }
        if ((e.key==='r'||e.key==='R') && !mod){ if(sel&&(sel.kind==='cable'||(sel.kind==='comp'&&sel.ref.type==='connector'))){ e.preventDefault(); rotateSelected(); } return; }
        if (e.key==='Delete'||e.key==='Backspace'){ if (e.shiftKey){ e.preventDefault(); clearAll(); commit(); } else if (sel){ e.preventDefault(); deleteSelected(); } return; }
        if (e.key==='p'||e.key==='P'){ if(!mod){ e.preventDefault(); $('btn-power').click(); } return; }
        if (e.key==='f'||e.key==='F'){ if(!mod){ e.preventDefault(); toggleFullscreen(); } return; }
      }
      if (e.key==='Enter'){ if (mode==='practice'){ if(pCur&&pCur.type==='num'&&!pCur.done) checkNum(); else if(pCur&&pCur.done) newProblem(); } }
    });
    $('pp-check').onclick=checkNum; $('pp-next').onclick=newProblem;

    buildPalette();
    setPowerBtn();
    resize();
    recompute();
    // start with a demo circuit so the board isn't empty — unless a shared #c= link is present (it wins)
    function seedDemo(){ generate('owc'); lastPreset='owc'; var gs=$('gen-select'); if(gs) gs.value='owc'; powered=true; setPowerBtn(); recompute(); draw();
      history=[]; histIdx=-1; commit();   // baseline history so undo can't clear the seed circuit unexpectedly
      updateToolButtons(); }
    /* what the board opens with, in priority order:
       a shared #c= link  →  the user's autosaved circuit  →  the demo seed */
    if ((location.hash||'').indexOf('#c=')===0){
      loadFromHash().then(function(ok){ if(!ok && !loadAutosave()) seedDemo(); autosaveArmed=true; });
    } else {
      if (!loadAutosave()) seedDemo();
      autosaveArmed=true;
    }
    loop();
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
