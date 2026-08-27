(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════════
     Ohm's Law & DC Circuits Simulator — Slice 1
     Canvas infra + palette + components + select/move/rotate/delete
     + pan/zoom + undo. Connections, annotations, solver come in later
     slices.
     ═══════════════════════════════════════════════════════════════════ */

  /* ── DOM refs ─────────────────────────────────────────────── */
  var canvas = document.getElementById('sim-canvas');
  if (!canvas) return; // safety
  var ctx = canvas.getContext('2d');
  var canvasCard = document.getElementById('canvas-card');
  var simPanel = document.getElementById('sim-panel');
  var palette = document.getElementById('palette');
  var propsPanel = document.getElementById('props-panel');
  var propsBody = document.getElementById('props-body');
  var toolbarHint = document.getElementById('toolbar-hint');
  var hintBanner = document.getElementById('hint-banner');
  var hintDismissBtn = document.getElementById('hint-dismiss');

  /* ── World / viewport transform ──────────────────────────── */
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var viewOffX = 0, viewOffY = 0, viewScale = 1;
  var MIN_SCALE = 0.3, MAX_SCALE = 3;
  var cssW = 0, cssH = 0;

  function toSX(wx) { return (wx + viewOffX) * viewScale; }
  function toSY(wy) { return (wy + viewOffY) * viewScale; }
  function toWX(sx) { return sx / viewScale - viewOffX; }
  function toWY(sy) { return sy / viewScale - viewOffY; }

  function formatV(v) {
    if (v == null || isNaN(v)) return '';
    var av = Math.abs(v);
    if (av >= 1e6) return (v / 1e6).toFixed(av >= 1e7 ? 0 : 1) + 'MV';
    if (av >= 1e3) return (v / 1e3).toFixed(av >= 1e4 ? 0 : 1) + 'kV';
    if (av >= 1)   return v.toFixed(v % 1 ? 1 : 0) + 'V';
    return (v * 1000).toFixed(0) + 'mV';
  }
  function formatR(r) {
    if (r == null || isNaN(r)) return '';
    if (r >= 1e6) return (r / 1e6).toFixed(1) + 'MΩ';
    if (r >= 1000) return (r / 1000).toFixed(r >= 10000 ? 0 : 1) + 'kΩ';
    return r.toFixed(r % 1 ? 1 : 0) + 'Ω';
  }
  // Auto-scale a meter reading to a SI prefix that fits in 3-4 chars.
  // Returns { val:'12.0', unit:'kV' } so the meter draws value + unit on two lines.
  // baseUnit is 'V' or 'A'.
  function autoMeter(absVal, baseUnit) {
    if (absVal == null || isNaN(absVal)) return { val: '0.00', unit: baseUnit };
    var scales = [
      { thresh: 1e9,  div: 1e9,  pre: 'G' },
      { thresh: 1e6,  div: 1e6,  pre: 'M' },
      { thresh: 1e3,  div: 1e3,  pre: 'k' },
      { thresh: 1,    div: 1,    pre: ''  },
      { thresh: 1e-3, div: 1e-3, pre: 'm' },
      { thresh: 0,    div: 1e-6, pre: 'µ' }
    ];
    var s;
    for (var i = 0; i < scales.length; i++) {
      if (absVal >= scales[i].thresh) { s = scales[i]; break; }
    }
    if (!s) s = scales[scales.length - 1];
    var v = absVal / s.div;
    // pick a precision that keeps the string short (fits inside the 36px circle face)
    var str;
    if (v >= 100) str = v.toFixed(0);
    else if (v >= 10) str = v.toFixed(1);
    else if (v >= 0.01) str = v.toFixed(2);
    else if (absVal > 0) str = '<0.01';   // non-zero but rounds to 0 at this prefix
    else str = '0.00';
    return { val: str, unit: s.pre + baseUnit };
  }

  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    cssW = rect.width;
    cssH = rect.height || 460;
    canvas.width = Math.round(cssW * DPR);
    canvas.height = Math.round(cssH * DPR);
    scheduleDraw();
  }
  window.addEventListener('resize', resizeCanvas);

  /* ── State ────────────────────────────────────────────────── */
  var state = {
    components: [],      // {id, type, x, y, rot, props:{}, state:{}}
    connections: [],     // added in slice 2
    annStrokes: [],      // added in slice 3
    annShapes: [],       // added in slice 3
    nextId: 1
  };
  var selectedId = null;         // component id
  var selectedConnId = null;     // connection id
  var hoverId = null;
  var hoverPort = null;          // { compId, portIdx }
  var hoverConnId = null;
  var tool = 'move';  // move | sketch | shape | pan
  var isRunning = false;
  var currentMode = 'simulate';

  // wiring in progress
  var pendingWire = null;        // { from:{compId,portIdx}, waypoints:[{x,y}], cursor:{x,y} }

  // annotation state
  var sketchColor = '#ffffff', sketchWidth = 2;
  var shapeType = 'rect', shapeColor = '#ffffff', shapeWidth = 2, shapeFilled = false;
  var selectedShape = null;  // legacy; kept only for text-edit index
  var annSel = null; // {type:'shape'|'stroke', idx}
  var annVisible = true;
  var showNodeVoltages = false; // X4: opt-in node-voltage labels
  var textEditing = null;    // shape index while editing text

  // drag state
  var drag = null; // {kind:'move'|'pan'|'sketch'|'shape-draw'|'shape-move', ...}

  // solver dirty flag — set whenever circuit topology or component params change
  var circuitDirty = true;
  function markDirty(){ circuitDirty = true; if (typeof faults !== 'undefined' && faults) clearFaults(); }

  // undo stack
  var undoStack = [], redoStack = [];
  var MAX_UNDO = 30;

  function snapshot() {
    return JSON.stringify({
      components: state.components,
      connections: state.connections,
      annStrokes: state.annStrokes,
      annShapes: state.annShapes,
      nextId: state.nextId
    });
  }
  function saveUndo() {
    undoStack.push(snapshot());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
    markDirty();
  }
  function restore(snap) {
    var s = JSON.parse(snap);
    state.components = s.components || [];
    state.connections = s.connections || [];
    state.annStrokes = s.annStrokes || [];
    state.annShapes = s.annShapes || [];
    state.nextId = s.nextId || 1;
    selectedId = null;
    renderProps();
    markDirty();
    scheduleDraw();
  }
  function doUndo() {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
  }
  function doRedo() {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
  }

  /* ── Component definitions ───────────────────────────────── */
  // ports[] are in local (unrotated) coords relative to component center
  var COMP_DEFS = {
    battery:    { w: 80, h: 40, label: 'V',  ports: [{x:-40,y:0,name:'+'},{x:40,y:0,name:'-'}], props: { V: 9, r: 0 } },
    ground:     { w: 40, h: 40, label: 'GND',ports: [{x:0,y:-20,name:'n'}], props: {} },
    resistor:   { w: 80, h: 30, label: 'R',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 220 } },
    rheostat:   { w: 80, h: 30, label: 'R',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 100, Rmax: 1000 } },
    lamp:       { w: 60, h: 60, label: 'L',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { R: 48 } },
    led:        { w: 60, h: 40, label: 'D',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'k'}], props: { Vf: 2.0, R: 30 } },
    fan:        { w: 70, h: 70, label: 'M',  ports: [{x:-35,y:0,name:'a'},{x:35,y:0,name:'b'}], props: { R: 24 } },
    buzzer:     { w: 60, h: 60, label: 'BZ', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { R: 120 } },
    heater:     { w: 80, h: 40, label: 'H',  ports: [{x:-40,y:0,name:'a'},{x:40,y:0,name:'b'}], props: { R: 12 } },
    fuse:       { w: 70, h: 30, label: 'F',  ports: [{x:-35,y:0,name:'a'},{x:35,y:0,name:'b'}], props: { Irated: 1, blown: false } },
    switch:     { w: 70, h: 30, label: 'S',  ports: [{x:-35,y:0,name:'a'},{x:35,y:0,name:'b'}], props: { closed: false } },
    pushbutton: { w: 60, h: 30, label: 'PB', ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: { closed: false } },
    ammeter:    { w: 60, h: 60, label: 'A',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: {} },
    voltmeter:  { w: 60, h: 60, label: 'V',  ports: [{x:-30,y:0,name:'a'},{x:30,y:0,name:'b'}], props: {} },
    junction:   { w: 20, h: 20, label: '',   ports: [{x:-10,y:0,name:'a'},{x:10,y:0,name:'b'},{x:0,y:-10,name:'c'}], props: {} },
    junction4:  { w: 20, h: 20, label: '',   ports: [{x:-10,y:0,name:'a'},{x:10,y:0,name:'b'},{x:0,y:-10,name:'c'},{x:0,y:10,name:'d'}], props: {} }
  };

  var COMP_LABELS = {
    battery:'Battery', ground:'Ground', resistor:'Resistor', rheostat:'Rheostat',
    lamp:'Lamp', led:'LED', fan:'Fan', buzzer:'Buzzer', heater:'Heater',
    fuse:'Fuse', switch:'Switch', pushbutton:'Push Button', ammeter:'Ammeter', voltmeter:'Voltmeter',
    junction:'Junction', junction4:'Junction 4-way'
  };

  function makeComponent(type, x, y) {
    var def = COMP_DEFS[type];
    if (!def) return null;
    var props = {};
    for (var k in def.props) props[k] = def.props[k];
    return {
      id: state.nextId++,
      type: type,
      x: x, y: y,
      rot: 0,
      props: props,
      state: {}
    };
  }

  /* ── Rotate helper ───────────────────────────────────────── */
  function rotatePoint(px, py, rot) {
    // rot in 0/90/180/270 degrees
    var r = rot * Math.PI / 180;
    var c = Math.cos(r), s = Math.sin(r);
    return { x: px*c - py*s, y: px*s + py*c };
  }
  function portWorld(comp, portIdx) {
    var def = COMP_DEFS[comp.type];
    var p = def.ports[portIdx];
    var rp = rotatePoint(p.x, p.y, comp.rot);
    return { x: comp.x + rp.x, y: comp.y + rp.y };
  }
  function compBounds(comp) {
    var def = COMP_DEFS[comp.type];
    var w = def.w, h = def.h;
    // after rotation, bounding box swaps if 90/270
    if (comp.rot % 180 !== 0) { var t = w; w = h; h = t; }
    return { x: comp.x - w/2, y: comp.y - h/2, w: w, h: h };
  }
  function hitComponent(wx, wy) {
    for (var i = state.components.length - 1; i >= 0; i--) {
      var c = state.components[i];
      var b = compBounds(c);
      if (wx >= b.x && wx <= b.x+b.w && wy >= b.y && wy <= b.y+b.h) return c;
    }
    return null;
  }

  function hitPort(wx, wy, tol) {
    tol = tol != null ? tol : 8;
    for (var i = state.components.length - 1; i >= 0; i--) {
      var c = state.components[i];
      var def = COMP_DEFS[c.type];
      for (var j = 0; j < def.ports.length; j++) {
        var p = portWorld(c, j);
        if (Math.abs(p.x - wx) < tol && Math.abs(p.y - wy) < tol) {
          return { compId: c.id, portIdx: j, x: p.x, y: p.y };
        }
      }
    }
    return null;
  }

  /* ── Connection routing (orthogonal, horizontal-first) ──── */
  function connectionPoints(conn) {
    var fc = state.components.find(function(x){return x.id===conn.from.compId;});
    var tc = state.components.find(function(x){return x.id===conn.to.compId;});
    if (!fc || !tc) return null;
    var a = portWorld(fc, conn.from.portIdx);
    var b = portWorld(tc, conn.to.portIdx);
    var pts = [a];
    (conn.waypoints || []).forEach(function (wp) { pts.push({x:wp.x,y:wp.y}); });
    pts.push(b);
    // expand each segment into orthogonal (horizontal then vertical)
    var ortho = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var p0 = ortho[ortho.length-1], p1 = pts[i];
      if (p0.x !== p1.x && p0.y !== p1.y) {
        ortho.push({x: p1.x, y: p0.y});
      }
      ortho.push(p1);
    }
    return ortho;
  }

  function hitConnection(wx, wy, tol) {
    tol = tol || 6;
    for (var i = 0; i < state.connections.length; i++) {
      var conn = state.connections[i];
      var pts = connectionPoints(conn);
      if (!pts) continue;
      for (var j = 0; j < pts.length - 1; j++) {
        var a = pts[j], b = pts[j+1];
        if (pointOnSegment(wx, wy, a, b, tol)) return conn;
      }
    }
    return null;
  }
  function pointOnSegment(px, py, a, b, tol) {
    var minX = Math.min(a.x,b.x) - tol, maxX = Math.max(a.x,b.x) + tol;
    var minY = Math.min(a.y,b.y) - tol, maxY = Math.max(a.y,b.y) + tol;
    if (px < minX || px > maxX || py < minY || py > maxY) return false;
    if (a.x === b.x) return Math.abs(px - a.x) < tol;
    if (a.y === b.y) return Math.abs(py - a.y) < tol;
    return false;
  }

  // Splice an existing connection at point p by inserting a 4-way junction.
  // Returns { jcomp, freePortIdx } so the caller can attach a wire to the perpendicular port.
  // freePortIdx prefers the side closest to `approach` (a world point of the incoming wire's previous vertex).
  function tapIntoConnection(conn, p, approach) {
    var pts = connectionPoints(conn);
    if (!pts) return null;
    var bestIdx = -1, bestDist = Infinity, bestProj = null, bestOrient = null;
    for (var j = 0; j < pts.length - 1; j++) {
      var a = pts[j], b = pts[j+1];
      if (a.x === b.x) {
        var py = Math.max(Math.min(a.y, b.y), Math.min(Math.max(a.y, b.y), p.y));
        var d = Math.abs(p.x - a.x);
        if (d < bestDist) { bestDist = d; bestIdx = j; bestProj = {x:a.x, y:py}; bestOrient = 'V'; }
      } else if (a.y === b.y) {
        var px = Math.max(Math.min(a.x, b.x), Math.min(Math.max(a.x, b.x), p.x));
        var d2 = Math.abs(p.y - a.y);
        if (d2 < bestDist) { bestDist = d2; bestIdx = j; bestProj = {x:px, y:a.y}; bestOrient = 'H'; }
      }
    }
    if (bestIdx < 0) return null;

    var jx = Math.round(bestProj.x/10)*10, jy = Math.round(bestProj.y/10)*10;
    var jcomp = makeComponent('junction4', jx, jy);
    state.components.push(jcomp);

    // junction4 ports: 0=a(left x=-10), 1=b(right x=+10), 2=c(top y=-10), 3=d(bottom y=+10)
    var portFrom, portTo, freePort;
    var fc = state.components.find(function(x){return x.id===conn.from.compId;});
    var fromW = fc ? portWorld(fc, conn.from.portIdx) : null;
    if (bestOrient === 'H') {
      // original wire is horizontal — consume left/right ports for it
      portFrom = (fromW && fromW.x < jx) ? 0 : 1;
      portTo   = portFrom === 0 ? 1 : 0;
      // perpendicular pair (top/bottom) free for tap; pick side near approach
      freePort = (approach && approach.y > jy) ? 3 : 2;
    } else {
      // vertical — consume top/bottom ports
      portFrom = (fromW && fromW.y < jy) ? 2 : 3;
      portTo   = portFrom === 2 ? 3 : 2;
      freePort = (approach && approach.x > jx) ? 1 : 0;
    }

    var origWps = (conn.waypoints || []).slice();
    var origIdx = state.connections.indexOf(conn);
    if (origIdx >= 0) state.connections.splice(origIdx, 1);

    state.connections.push({
      id: state.nextId++,
      from: conn.from,
      to: { compId: jcomp.id, portIdx: portFrom },
      waypoints: origWps
    });
    state.connections.push({
      id: state.nextId++,
      from: { compId: jcomp.id, portIdx: portTo },
      to: conn.to,
      waypoints: []
    });
    return { jcomp: jcomp, freePort: freePort };
  }

  function removeConnectionsForComponent(compId) {
    state.connections = state.connections.filter(function (c) {
      return c.from.compId !== compId && c.to.compId !== compId;
    });
  }

  /* ── Auto-routing ────────────────────────────────────────── */
  // Returns the outward unit direction the wire should leave a port along.
  // Derived from the port's local position (ports always sit on the bbox edge),
  // then rotated into world orientation by the component's rotation.
  function portDirection(comp, portIdx) {
    var def = COMP_DEFS[comp.type];
    var p = def.ports[portIdx];
    var dx = 0, dy = 0;
    if (Math.abs(p.x) >= Math.abs(p.y)) {
      dx = p.x >= 0 ? 1 : -1;
    } else {
      dy = p.y >= 0 ? 1 : -1;
    }
    var r = rotatePoint(dx, dy, comp.rot || 0);
    // snap to integer axis after rotation (rot is multiple of 90)
    return { dx: Math.round(r.x), dy: Math.round(r.y) };
  }

  function snapG(v) { return Math.round(v / 10) * 10; }

  // Returns inflated bounding boxes of every component except those in `exceptIds`.
  function obstacleBoxes(exceptIds) {
    var pad = 6;
    var boxes = [];
    for (var i = 0; i < state.components.length; i++) {
      var c = state.components[i];
      if (exceptIds && exceptIds.indexOf(c.id) >= 0) continue;
      if (c.type === 'junction' || c.type === 'junction4' || c.type === 'ground') continue;
      var b = compBounds(c);
      boxes.push({ x: b.x - pad, y: b.y - pad, w: b.w + 2*pad, h: b.h + 2*pad });
    }
    return boxes;
  }

  // Does the orthogonal segment a→b intersect any obstacle box?
  function segmentHitsBoxes(a, b, boxes) {
    var minX = Math.min(a.x, b.x), maxX = Math.max(a.x, b.x);
    var minY = Math.min(a.y, b.y), maxY = Math.max(a.y, b.y);
    for (var i = 0; i < boxes.length; i++) {
      var bx = boxes[i];
      if (maxX < bx.x || minX > bx.x + bx.w) continue;
      if (maxY < bx.y || minY > bx.y + bx.h) continue;
      return bx;
    }
    return null;
  }

  function pathHitsBoxes(pts, boxes) {
    for (var i = 1; i < pts.length; i++) {
      if (segmentHitsBoxes(pts[i-1], pts[i], boxes)) return true;
    }
    return false;
  }

  // Build an orthogonal route between two stub points whose outgoing
  // axis we know (dirA, dirB are unit vectors).
  // Returns waypoints between (not including) p1 and p2.
  function routeBetweenStubs(p1, dirA, p2, dirB) {
    var hA = dirA.dx !== 0;  // first segment is horizontal?
    var hB = dirB.dx !== 0;  // last segment is horizontal?
    if (hA && hB) {
      // both horizontal: vertical bridge in the middle
      if (p1.y === p2.y) return [];
      var midX = snapG((p1.x + p2.x) / 2);
      // make sure the bridge actually moves AWAY from each port (no backtrack)
      // dirA.dx > 0 means outward is +x; bridge must be at x >= p1.x for that to not backtrack
      if (dirA.dx > 0 && midX < p1.x) midX = p1.x + 20;
      if (dirA.dx < 0 && midX > p1.x) midX = p1.x - 20;
      if (dirB.dx > 0 && midX < p2.x) midX = p2.x + 20;
      if (dirB.dx < 0 && midX > p2.x) midX = p2.x - 20;
      return [{ x: midX, y: p1.y }, { x: midX, y: p2.y }];
    }
    if (!hA && !hB) {
      // both vertical: horizontal bridge in the middle
      if (p1.x === p2.x) return [];
      var midY = snapG((p1.y + p2.y) / 2);
      if (dirA.dy > 0 && midY < p1.y) midY = p1.y + 20;
      if (dirA.dy < 0 && midY > p1.y) midY = p1.y - 20;
      if (dirB.dy > 0 && midY < p2.y) midY = p2.y + 20;
      if (dirB.dy < 0 && midY > p2.y) midY = p2.y - 20;
      return [{ x: p1.x, y: midY }, { x: p2.x, y: midY }];
    }
    // mixed: single L corner (extend the horizontal stub to the vertical port's x)
    if (hA && !hB) return [{ x: p2.x, y: p1.y }];
    return [{ x: p1.x, y: p2.y }];
  }

  // Try a few detour candidates if the basic Z hits an obstacle.
  function detourAround(p1, dirA, p2, dirB, boxes) {
    var basic = routeBetweenStubs(p1, dirA, p2, dirB);
    var path = [p1].concat(basic).concat([p2]);
    if (!pathHitsBoxes(path, boxes)) return basic;

    // candidate detours: route over/under or left/right of the union bbox of obstacles
    // get union of hit boxes along the line a→b
    var ux1 = Math.min(p1.x, p2.x), uy1 = Math.min(p1.y, p2.y);
    var ux2 = Math.max(p1.x, p2.x), uy2 = Math.max(p1.y, p2.y);
    var hits = boxes.filter(function (b) {
      return !(b.x + b.w < ux1 || b.x > ux2 || b.y + b.h < uy1 || b.y > uy2);
    });
    if (!hits.length) return basic;
    var ox1 = Math.min.apply(null, hits.map(function(b){return b.x;}));
    var oy1 = Math.min.apply(null, hits.map(function(b){return b.y;}));
    var ox2 = Math.max.apply(null, hits.map(function(b){return b.x + b.w;}));
    var oy2 = Math.max.apply(null, hits.map(function(b){return b.y + b.h;}));

    var candidates = [
      // detour above
      [{x:p1.x, y:snapG(oy1) - 10}, {x:p2.x, y:snapG(oy1) - 10}],
      // detour below
      [{x:p1.x, y:snapG(oy2) + 10}, {x:p2.x, y:snapG(oy2) + 10}],
      // detour left
      [{x:snapG(ox1) - 10, y:p1.y}, {x:snapG(ox1) - 10, y:p2.y}],
      // detour right
      [{x:snapG(ox2) + 10, y:p1.y}, {x:snapG(ox2) + 10, y:p2.y}]
    ];
    for (var i = 0; i < candidates.length; i++) {
      var cp = [p1].concat(candidates[i]).concat([p2]);
      if (!pathHitsBoxes(cp, boxes)) return candidates[i];
    }
    return basic; // give up — let user fix manually
  }

  // Generate auto-waypoints (excluding endpoint ports) for a wire.
  function autoRouteWire(fromComp, fromPort, toComp, toPort) {
    var a = portWorld(fromComp, fromPort);
    var b = portWorld(toComp, toPort);
    var dirA = portDirection(fromComp, fromPort);
    var dirB = portDirection(toComp, toPort);
    var STUB = 20;
    var p1 = { x: snapG(a.x + dirA.dx * STUB), y: snapG(a.y + dirA.dy * STUB) };
    var p2 = { x: snapG(b.x + dirB.dx * STUB), y: snapG(b.y + dirB.dy * STUB) };
    // collinear straight shot? skip stubs entirely
    if (a.x === b.x && (dirA.dx === 0) && (dirB.dx === 0)) return [];
    if (a.y === b.y && (dirA.dy === 0) && (dirB.dy === 0)) return [];
    var boxes = obstacleBoxes([fromComp.id, toComp.id]);
    var mid = detourAround(p1, dirA, p2, dirB, boxes);
    var wps = [p1].concat(mid).concat([p2]);
    // dedupe consecutive identical points
    var out = [];
    for (var i = 0; i < wps.length; i++) {
      var w = wps[i];
      if (out.length && out[out.length-1].x === w.x && out[out.length-1].y === w.y) continue;
      out.push(w);
    }
    return out;
  }

  /* ── Palette icons (schematic mini-drawings) ─────────────── */
  function drawPaletteIcons() {
    var _dpr = window.devicePixelRatio || 1;
    var items = palette.querySelectorAll('.palette-item');
    items.forEach(function (it) {
      var type = it.getAttribute('data-type');
      var cv = it.querySelector('canvas.palette-icon');
      if (!cv) return;
      /* DPR backing store. These palette icons were fixed 36x36 bitmaps
         stretched by the browser on a retina display, so every component symbol
         rendered at 2x upscale. Size the backing to device pixels and scale the
         context, keeping the 36-unit logical space the drawing code uses. */
      var _need = Math.round(36 * _dpr);
      if (cv.width !== _need) {
        cv.width = _need; cv.height = _need;
        cv.style.width = '36px'; cv.style.height = '36px';
      }
      var g = cv.getContext('2d');
      var w = 36, h = 36;   /* logical space */
      g.setTransform(_dpr, 0, 0, _dpr, 0, 0);
      g.clearRect(0,0,w,h);
      g.save();
      g.translate(w/2, h/2);
      g.strokeStyle = '#ffa000';
      g.fillStyle = '#ffa000';
      g.lineWidth = 1.5;
      drawComponentShape(g, type, 0.45);
      g.restore();
    });
  }

  /* ── Component drawing — takes ctx, draws centered at (0,0)
         at natural size scaled by `s` ─────────────────────── */
  function drawComponentShape(g, type, s, opts) {
    s = s || 1;
    opts = opts || {};
    var def = COMP_DEFS[type];
    var w = def.w*s, h = def.h*s;
    var glow = opts.glow || 0; // 0..1
    var on = opts.on;

    g.lineWidth = Math.max(1, 2*s);

    switch (type) {
      case 'battery': {
        // leads + cells (long +, short -)
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-8*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(8*s, 0);
        g.stroke();
        // long line (+)
        g.beginPath();
        g.moveTo(-8*s, -12*s); g.lineTo(-8*s, 12*s);
        g.stroke();
        // short line (-)
        g.beginPath();
        g.moveTo(2*s, -7*s); g.lineTo(2*s, 7*s);
        g.stroke();
        // second cell
        g.beginPath();
        g.moveTo(-2*s, -10*s); g.lineTo(-2*s, 10*s);
        g.moveTo(8*s, -5*s);  g.lineTo(8*s, 5*s);
        g.stroke();
        g.font = (10*s).toFixed(0)+'px sans-serif';
        g.textAlign = 'left'; g.textBaseline = 'bottom';
        g.fillText('+', -12*s, -14*s);
        g.fillText('-', 6*s, -10*s);
        break;
      }
      case 'ground': {
        g.beginPath();
        g.moveTo(0, -h/2); g.lineTo(0, 0);
        g.moveTo(-12*s, 0); g.lineTo(12*s, 0);
        g.moveTo(-8*s, 4*s); g.lineTo(8*s, 4*s);
        g.moveTo(-4*s, 8*s); g.lineTo(4*s, 8*s);
        g.stroke();
        break;
      }
      case 'resistor':
      case 'rheostat': {
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-20*s, 0);
        // zigzag
        var zx = -20*s, zy = 0, zw = 4*s;
        for (var i = 0; i < 6; i++) {
          zx += zw;
          zy = (i % 2 === 0) ? -6*s : 6*s;
          g.lineTo(zx, zy);
        }
        g.lineTo(20*s, 0);
        g.lineTo(w/2, 0);
        g.stroke();
        if (type === 'rheostat') {
          // arrow
          g.beginPath();
          g.moveTo(-8*s, 14*s); g.lineTo(8*s, -6*s);
          g.stroke();
          // arrowhead
          g.beginPath();
          g.moveTo(8*s, -6*s); g.lineTo(3*s, -5*s); g.lineTo(6*s, -1*s); g.closePath();
          g.fill();
        }
        break;
      }
      case 'lamp': {
        g.beginPath();
        g.arc(0, 0, 14*s, 0, Math.PI*2);
        if (glow > 0) {
          var rg = g.createRadialGradient(0,0,2*s, 0,0,20*s);
          rg.addColorStop(0, 'rgba(255,240,100,'+(0.3+0.7*glow)+')');
          rg.addColorStop(1, 'rgba(255,240,100,0)');
          g.fillStyle = rg; g.fill();
          g.fillStyle = '#ffa000';
        }
        g.stroke();
        // X inside
        g.beginPath();
        g.moveTo(-10*s,-10*s); g.lineTo(10*s,10*s);
        g.moveTo(10*s,-10*s); g.lineTo(-10*s,10*s);
        g.stroke();
        // leads
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-14*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(14*s, 0);
        g.stroke();
        break;
      }
      case 'led': {
        // triangle + bar
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-8*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(8*s, 0);
        g.stroke();
        g.beginPath();
        g.moveTo(-8*s, -8*s); g.lineTo(8*s, 0); g.lineTo(-8*s, 8*s); g.closePath();
        if (glow > 0) {
          g.fillStyle = 'rgba(255,100,100,'+(0.5+0.5*glow)+')';
          g.fill();
          g.fillStyle = '#ffa000';
        } else {
          g.stroke();
        }
        g.beginPath();
        g.moveTo(8*s, -8*s); g.lineTo(8*s, 8*s);
        g.stroke();
        // emission arrows
        g.beginPath();
        g.moveTo(2*s,-12*s); g.lineTo(6*s,-16*s);
        g.moveTo(8*s,-12*s); g.lineTo(12*s,-16*s);
        g.stroke();
        break;
      }
      case 'fan': {
        g.beginPath();
        g.arc(0, 0, 18*s, 0, Math.PI*2);
        g.stroke();
        g.font = 'bold '+(14*s).toFixed(0)+'px sans-serif';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('M', 0, 0);
        // leads
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-18*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(18*s, 0);
        g.stroke();
        // blades (animated rotation applied by caller when on)
        if (opts.rot) {
          g.save(); g.rotate(opts.rot);
          for (var k = 0; k < 3; k++) {
            g.save(); g.rotate(k*2*Math.PI/3);
            g.beginPath();
            g.moveTo(0,0); g.lineTo(14*s, 3*s); g.lineTo(14*s, -3*s); g.closePath();
            g.fill();
            g.restore();
          }
          g.restore();
        }
        break;
      }
      case 'buzzer': {
        g.beginPath();
        g.arc(0, 0, 16*s, Math.PI*1.1, Math.PI*1.9, false);
        g.stroke();
        g.beginPath();
        g.moveTo(-11*s, -5*s); g.lineTo(11*s, -5*s);
        g.stroke();
        g.font = 'bold '+(10*s).toFixed(0)+'px sans-serif';
        g.textAlign='center'; g.textBaseline='middle';
        g.fillText('BZ', 0, 5*s);
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-16*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(16*s, 0);
        g.stroke();
        break;
      }
      case 'heater': {
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-22*s, 0);
        // sine-like coils
        for (var i = -22; i <= 22; i += 4) {
          g.lineTo(i*s, (((i/4)|0) % 2 === 0 ? -8*s : 8*s));
        }
        g.lineTo(w/2, 0);
        g.stroke();
        if (glow > 0) {
          g.strokeStyle = 'rgba(255,80,0,'+glow+')';
          g.lineWidth = Math.max(2, 4*s);
          g.beginPath();
          g.moveTo(-22*s, 0);
          for (var j = -22; j <= 22; j += 4) {
            g.lineTo(j*s, (((j/4)|0) % 2 === 0 ? -8*s : 8*s));
          }
          g.stroke();
        }
        break;
      }
      case 'fuse': {
        var fw = 20*s, fh = 8*s;
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-fw, 0);
        g.moveTo(w/2, 0);  g.lineTo(fw, 0);
        g.stroke();
        g.beginPath();
        g.rect(-fw, -fh, fw*2, fh*2);
        g.stroke();
        g.beginPath();
        if (opts && opts.blown) {
          // element parted in the middle
          g.moveTo(-fw, 0); g.lineTo(-5*s, 0);
          g.moveTo(5*s, 0);  g.lineTo(fw, 0);
          g.stroke();
          g.beginPath();
          g.moveTo(-5*s, -4*s); g.lineTo(-1*s, 0); g.lineTo(-5*s, 4*s);
          g.moveTo(5*s, -4*s);  g.lineTo(1*s, 0);  g.lineTo(5*s, 4*s);
          g.stroke();
        } else {
          g.moveTo(-fw, 0); g.lineTo(fw, 0);
          g.stroke();
        }
        break;
      }
      case 'switch': {
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-14*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(14*s, 0);
        g.stroke();
        g.beginPath();
        g.arc(-14*s, 0, 2.5*s, 0, Math.PI*2);
        g.arc(14*s, 0, 2.5*s, 0, Math.PI*2);
        g.fill();
        // blade
        g.beginPath();
        g.moveTo(-14*s, 0);
        if (opts.closed) g.lineTo(14*s, 0);
        else g.lineTo(10*s, -12*s);
        g.stroke();
        break;
      }
      case 'pushbutton': {
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-12*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(12*s, 0);
        g.stroke();
        g.beginPath();
        g.moveTo(-12*s, 0); g.lineTo(12*s, 0);
        g.stroke();
        g.beginPath();
        g.moveTo(0, 0); g.lineTo(0, -10*s);
        g.moveTo(-6*s, -10*s); g.lineTo(6*s, -10*s);
        g.stroke();
        break;
      }
      case 'ammeter':
      case 'voltmeter': {
        g.beginPath();
        g.arc(0, 0, 18*s, 0, Math.PI*2);
        g.stroke();
        // Live reading when simulating; otherwise just the symbol
        var reading = opts.reading;
        if (reading != null) {
          // accept either { val, unit } object or legacy string
          var rVal, rUnit;
          if (typeof reading === 'object') { rVal = reading.val; rUnit = reading.unit; }
          else { rVal = String(reading); rUnit = (type === 'ammeter' ? 'A' : 'V'); }
          // shrink font if value is long so it doesn't bleed past the circle
          var valFont = rVal.length > 5 ? 7 : (rVal.length > 4 ? 8 : 9);
          g.font = 'bold '+(valFont*s).toFixed(0)+'px sans-serif';
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillStyle = '#ffa000';
          g.fillText(rVal, 0, -3*s);
          g.font = (7*s).toFixed(0)+'px sans-serif';
          g.fillStyle = g.strokeStyle;
          g.fillText(rUnit, 0, 7*s);
        } else {
          g.font = 'bold '+(14*s).toFixed(0)+'px sans-serif';
          g.textAlign = 'center'; g.textBaseline = 'middle';
          g.fillText(type === 'ammeter' ? 'A' : 'V', 0, 0);
        }
        g.beginPath();
        g.moveTo(-w/2, 0); g.lineTo(-18*s, 0);
        g.moveTo(w/2, 0);  g.lineTo(18*s, 0);
        g.stroke();
        break;
      }
      case 'junction':
      case 'junction4': {
        g.beginPath();
        g.arc(0, 0, 4*s, 0, Math.PI*2);
        g.fill();
        break;
      }
    }
  }

  /* ── Rendering ───────────────────────────────────────────── */
  var drawScheduled = false;
  function scheduleDraw() {
    if (drawScheduled) return;
    drawScheduled = true;
    requestAnimationFrame(function () { drawScheduled = false; draw(); });
  }

  function drawGrid() {
    var step = 20;
    var leftW = toWX(0), rightW = toWX(cssW);
    var topW = toWY(0), botW = toWY(cssH);
    var x0 = Math.floor(leftW/step)*step;
    var y0 = Math.floor(topW/step)*step;
    ctx.strokeStyle = 'rgba(136,160,200,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var x = x0; x <= rightW; x += step) {
      ctx.moveTo(toSX(x)*DPR, 0);
      ctx.lineTo(toSX(x)*DPR, cssH*DPR);
    }
    for (var y = y0; y <= botW; y += step) {
      ctx.moveTo(0, toSY(y)*DPR);
      ctx.lineTo(cssW*DPR, toSY(y)*DPR);
    }
    ctx.stroke();
  }

  function drawComponent(c) {
    var def = COMP_DEFS[c.type];
    ctx.save();
    ctx.translate(toSX(c.x)*DPR, toSY(c.y)*DPR);
    ctx.scale(viewScale*DPR, viewScale*DPR);
    ctx.rotate(c.rot * Math.PI/180);

    var isSel = c.id === selectedId;
    var isHover = c.id === hoverId;
    var isFault = faults && faults.compIds && faults.compIds[c.id];
    if (isFault) {
      var pulseC = faultPulse();
      ctx.strokeStyle = 'rgba(255,' + Math.round(40 + pulseC*60) + ',' + Math.round(40 + pulseC*40) + ',1)';
      ctx.shadowColor = '#ff3b3b';
      ctx.shadowBlur = (10 + pulseC * 14);
      ctx.lineWidth = (1 + pulseC * 1.2);
    } else {
      ctx.strokeStyle = isSel ? '#ffa000' : (isHover ? '#ffd180' : '#dde3f0');
    }
    ctx.fillStyle = ctx.strokeStyle;

    var opts = {};
    if (c.type === 'switch' || c.type === 'pushbutton') opts.closed = !!c.props.closed;
    if (c.type === 'fuse') opts.blown = !!c.props.blown;
    if (isRunning && sim) {
      var p = Math.abs(sim.compP[c.id] || 0);
      if (c.type === 'lamp' || c.type === 'led' || c.type === 'heater') {
        opts.glow = Math.max(0, Math.min(1, p / 2));
      }
      if (c.type === 'fan' || c.type === 'buzzer') {
        var i = Math.abs(sim.compI[c.id] || 0);
        opts.rot = (performance.now() / 1000) * i * 40;
      }
      if (c.type === 'ammeter') {
        opts.reading = autoMeter(Math.abs(sim.compI[c.id] || 0), 'A');
      }
      if (c.type === 'voltmeter') {
        opts.reading = autoMeter(Math.abs(sim.compV[c.id] || 0), 'V');
      }
    }

    drawComponentShape(ctx, c.type, 1, opts);

    // label (with live parameter value so users can see what changed via the props panel)
    if (def.label && c.type !== 'junction' && c.type !== 'junction4' && c.type !== 'ground') {
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#8b9dc3';
      var lbl = def.label + (c.id ? c.id : '');
      var paramLbl = '';
      if (c.type === 'battery') paramLbl = formatV(c.props.V);
      else if (c.type === 'resistor' || c.type === 'rheostat' || c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') paramLbl = formatR(c.props.R);
      else if (c.type === 'led') paramLbl = formatR(c.props.R);
      else if (c.type === 'fuse') paramLbl = c.props.blown ? 'BLOWN' : (c.props.Irated + 'A');
      if (paramLbl) lbl += ' · ' + paramLbl;
      ctx.fillText(lbl, 0, -def.h/2 - 4);
    }

    ctx.restore();

    // selection box (in screen space)
    if (isSel) {
      var b = compBounds(c);
      ctx.save();
      ctx.strokeStyle = '#ffa000';
      ctx.setLineDash([4,3]);
      ctx.lineWidth = 1;
      ctx.strokeRect(
        toSX(b.x)*DPR - 3, toSY(b.y)*DPR - 3,
        b.w*viewScale*DPR + 6, b.h*viewScale*DPR + 6
      );
      ctx.restore();
    }

    // ports
    ctx.save();
    for (var i = 0; i < def.ports.length; i++) {
      var pw = portWorld(c, i);
      ctx.beginPath();
      ctx.arc(toSX(pw.x)*DPR, toSY(pw.y)*DPR, 4*DPR, 0, Math.PI*2);
      ctx.fillStyle = isSel ? '#ffa000' : '#64b5f6';
      ctx.fill();
    }
    ctx.restore();
  }

  function draw() {
    if (!cssW) return;
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();

    // connections under components — precompute all horizontal segments for crossover-hump rendering
    _hSegs = [];
    for (var ci0 = 0; ci0 < state.connections.length; ci0++) {
      var pts0 = connectionPoints(state.connections[ci0]);
      if (!pts0) continue;
      for (var si0 = 1; si0 < pts0.length; si0++) {
        var a0 = pts0[si0-1], b0 = pts0[si0];
        if (a0.y === b0.y && a0.x !== b0.x) {
          _hSegs.push({ y: a0.y, x1: Math.min(a0.x,b0.x), x2: Math.max(a0.x,b0.x), connId: state.connections[ci0].id });
        }
      }
    }
    for (var ci = 0; ci < state.connections.length; ci++) {
      drawConnection(state.connections[ci]);
    }

    for (var i = 0; i < state.components.length; i++) {
      drawComponent(state.components[i]);
    }

    // pending wire ghost
    if (pendingWire) drawPendingWire();

    // node voltage labels (X4)
    if (showNodeVoltages && sim && sim.netOf && sim.voltages) drawNodeVoltages();

    // annotations (on top)
    if (annVisible) drawAnnotations();

    // hovered port highlight
    if (hoverPort && !pendingWire) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(toSX(hoverPort.x)*DPR, toSY(hoverPort.y)*DPR, 7*DPR, 0, Math.PI*2);
      ctx.strokeStyle = '#ffa000';
      ctx.lineWidth = 2*DPR;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // populated each draw() — list of all horizontal segments in world coords for crossover-hump detection
  var _hSegs = [];

  // Draw a vertical segment from (x,y1) to (x,y2) with arc humps over each
  // horizontal wire it crosses (excluding wires belonging to this connection).
  function drawVerticalWithHumps(x, y1, y2, connId) {
    var sx = toSX(x) * DPR;
    var sgn = y2 > y1 ? 1 : -1;
    // collect crossing y values in world coords, sorted in travel direction
    var crossings = [];
    var lo = Math.min(y1, y2), hi = Math.max(y1, y2);
    for (var i = 0; i < _hSegs.length; i++) {
      var h = _hSegs[i];
      if (h.connId === connId) continue;
      if (h.y <= lo + 0.5 || h.y >= hi - 0.5) continue;
      if (x <= h.x1 + 0.5 || x >= h.x2 - 0.5) continue;
      crossings.push(h.y);
    }
    crossings.sort(function (p, q) { return (p - q) * sgn; });
    var humpR = 5 * DPR; // arc radius in screen px
    var cy = toSY(y1) * DPR;
    ctx.moveTo(sx, cy);
    for (var k = 0; k < crossings.length; k++) {
      var cyHit = toSY(crossings[k]) * DPR;
      var beforeY = cyHit - sgn * humpR;
      var afterY = cyHit + sgn * humpR;
      ctx.lineTo(sx, beforeY);
      // arc bumping toward +x (right) — anti-clockwise when going down, clockwise when going up
      // start angle, end angle for an arc centered at (sx, cyHit) radius humpR
      var startA = sgn > 0 ? -Math.PI/2 : Math.PI/2;
      var endA   = sgn > 0 ?  Math.PI/2 : -Math.PI/2;
      var ccw = sgn < 0; // going up → ccw to bump right
      ctx.arc(sx, cyHit, humpR, startA, endA, ccw);
      ctx.moveTo(sx, afterY);
    }
    ctx.lineTo(sx, toSY(y2) * DPR);
  }

  function drawConnection(conn) {
    var pts = connectionPoints(conn);
    if (!pts) return;
    var isSel = conn.id === selectedConnId;
    var isHover = conn.id === hoverConnId;
    var isFault = faults && faults.wireIds && faults.wireIds[conn.id];
    ctx.save();
    if (isFault) {
      var pulse = faultPulse();
      ctx.lineWidth = (4 + pulse * 2) * DPR;
      ctx.strokeStyle = 'rgba(255,' + Math.round(40 + pulse*60) + ',' + Math.round(40 + pulse*40) + ',1)';
      ctx.shadowColor = '#ff3b3b';
      ctx.shadowBlur = (8 + pulse * 12) * DPR;
    } else {
      ctx.lineWidth = (isSel ? 3 : 2) * DPR;
      ctx.strokeStyle = isSel ? '#ffa000' : (isHover ? '#ffd180' : '#64b5f6');
    }
    ctx.beginPath();
    // walk segments — vertical segments use humps, others draw straight
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i+1];
      if (a.x === b.x && a.y !== b.y) {
        // vertical → may need humps over horizontal wires
        drawVerticalWithHumps(a.x, a.y, b.y, conn.id);
      } else {
        // horizontal or zero-length: straight
        if (i === 0) ctx.moveTo(toSX(a.x)*DPR, toSY(a.y)*DPR);
        ctx.lineTo(toSX(b.x)*DPR, toSY(b.y)*DPR);
      }
    }
    ctx.stroke();
    // waypoint dots
    if (conn.waypoints && conn.waypoints.length) {
      ctx.fillStyle = isSel ? '#ffa000' : '#64b5f6';
      conn.waypoints.forEach(function (wp) {
        ctx.beginPath();
        ctx.arc(toSX(wp.x)*DPR, toSY(wp.y)*DPR, 3*DPR, 0, Math.PI*2);
        ctx.fill();
      });
    }
    // animated current dots when simulating — uses signed wire current so dots flow + → load → –
    if (isRunning && sim) {
      var I = wireSignedCurrent(conn);
      var absI = Math.abs(I);
      if (absI > 1e-6) {
        // build cumulative length
        var segLens = [0], total = 0;
        for (var si = 1; si < pts.length; si++) {
          var dx = pts[si].x - pts[si-1].x, dy = pts[si].y - pts[si-1].y;
          total += Math.sqrt(dx*dx + dy*dy);
          segLens.push(total);
        }
        if (total > 2) {
          var spacing = 40;
          var speed = Math.min(120, 30 + absI * 200);
          var dir = I > 0 ? 1 : -1;
          var phase = ((performance.now() / 1000) * speed * dir) % spacing;
          if (phase < 0) phase += spacing;
          ctx.fillStyle = '#ffa000';
          for (var d = phase; d < total; d += spacing) {
            // find segment
            var seg = 1;
            while (seg < segLens.length && segLens[seg] < d) seg++;
            if (seg >= segLens.length) break;
            var segLen = segLens[seg] - segLens[seg-1];
            var t = segLen > 0 ? (d - segLens[seg-1]) / segLen : 0;
            var px = pts[seg-1].x + (pts[seg].x - pts[seg-1].x) * t;
            var py = pts[seg-1].y + (pts[seg].y - pts[seg-1].y) * t;
            ctx.beginPath();
            ctx.arc(toSX(px)*DPR, toSY(py)*DPR, 3*DPR, 0, Math.PI*2);
            ctx.fill();
          }
        }
      }
    }
    ctx.restore();
  }

  /* ── Annotation drawing ─────────────────────────────────── */
  var selectionUI = { corners: null, delBtn: null, dupBtn: null, rotBtn: null, kind: null };
  function strokeBounds(s) {
    var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for (var i=0;i<s.points.length;i++) {
      if (s.points[i].x<minX) minX=s.points[i].x;
      if (s.points[i].y<minY) minY=s.points[i].y;
      if (s.points[i].x>maxX) maxX=s.points[i].x;
      if (s.points[i].y>maxY) maxY=s.points[i].y;
    }
    return { x:minX, y:minY, w:maxX-minX, h:maxY-minY, cx:(minX+maxX)/2, cy:(minY+maxY)/2 };
  }
  function drawStrokeSingle(s) {
    if (!s.points || s.points.length < 2) return;
    var rot = s.rotation || 0;
    ctx.save();
    if (rot) {
      var b = strokeBounds(s);
      ctx.translate(toSX(b.cx)*DPR, toSY(b.cy)*DPR);
      ctx.rotate(rot);
      ctx.translate(-toSX(b.cx)*DPR, -toSY(b.cy)*DPR);
    }
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * viewScale * DPR;
    ctx.beginPath();
    ctx.moveTo(toSX(s.points[0].x)*DPR, toSY(s.points[0].y)*DPR);
    for (var i = 1; i < s.points.length; i++) {
      ctx.lineTo(toSX(s.points[i].x)*DPR, toSY(s.points[i].y)*DPR);
    }
    ctx.stroke();
    ctx.restore();
  }
  function drawNodeVoltages() {
    // Pick the leftmost-topmost port for each unique net so the label sits in
    // a stable, legible spot. Skip components with no real ports (sketch types).
    var seenNets = {};
    var labels = [];
    for (var i = 0; i < state.components.length; i++) {
      var c = state.components[i];
      var def = COMP_DEFS[c.type];
      if (!def || !def.ports) continue;
      for (var pi = 0; pi < def.ports.length; pi++) {
        var net = sim.netOf(c.id, pi);
        if (net == null) continue;
        var V = sim.voltages[net];
        if (V == null || !isFinite(V)) continue;
        var pos = portWorld(c, pi);
        var prev = seenNets[net];
        if (!prev || pos.y < prev.y - 0.001 || (Math.abs(pos.y - prev.y) <= 0.001 && pos.x < prev.x)) {
          seenNets[net] = { x: pos.x, y: pos.y, V: V, net: net };
        }
      }
    }
    for (var k in seenNets) labels.push(seenNets[k]);
    if (!labels.length) return;
    ctx.save();
    var fs = Math.max(10, 11 * viewScale) * DPR;
    ctx.font = '600 ' + fs + 'px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var li = 0; li < labels.length; li++) {
      var L = labels[li];
      var sx = toSX(L.x) * DPR;
      var sy = (toSY(L.y) - 14) * DPR; // 14px above port
      var txt = L.V.toFixed(L.V === 0 ? 0 : (Math.abs(L.V) >= 10 ? 1 : 2)) + ' V';
      var tw = ctx.measureText(txt).width;
      var pad = 4 * DPR;
      ctx.fillStyle = 'rgba(20,28,42,0.92)';
      ctx.strokeStyle = '#ffa000';
      ctx.lineWidth = 1.2 * DPR;
      var bx = sx - tw/2 - pad, by = sy - fs/2 - pad*0.7;
      var bw = tw + pad*2, bh = fs + pad*1.4;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 4*DPR);
      else ctx.rect(bx, by, bw, bh);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd166';
      ctx.fillText(txt, sx, sy);
    }
    ctx.restore();
  }
  function drawAnnotations() {
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    state.annStrokes.forEach(drawStrokeSingle);
    ctx.restore();
    // shapes
    state.annShapes.forEach(function (sh, idx) {
      drawShape(sh, annSel && annSel.type === 'shape' && annSel.idx === idx);
    });
    // selection overlay (handles + action icons)
    drawSelectionOverlay();
  }
  function shapeBoundsScreen(sh) {
    var x1 = toSX(sh.x)*DPR, y1 = toSY(sh.y)*DPR;
    var x2 = toSX(sh.x + sh.w)*DPR, y2 = toSY(sh.y + sh.h)*DPR;
    var mnX = Math.min(x1,x2), mxX = Math.max(x1,x2);
    var mnY = Math.min(y1,y2), mxY = Math.max(y1,y2);
    if (sh.type === 'text') {
      var fs = Math.max(8, Math.abs(sh.h) || 20) * viewScale * DPR;
      ctx.save(); ctx.font = fs + 'px sans-serif';
      var tw = ctx.measureText(sh.text || '(text)').width;
      ctx.restore();
      mnX = x1; mnY = y1; mxX = x1 + tw; mxY = y1 + fs*1.15;
    }
    var pad = 6*DPR;
    return { x: mnX-pad, y: mnY-pad, w: mxX-mnX+2*pad, h: mxY-mnY+2*pad, cx:(mnX+mxX)/2, cy:(mnY+mxY)/2 };
  }
  function drawSelectionOverlay() {
    selectionUI = { corners: null, delBtn: null, dupBtn: null, rotBtn: null, kind: null };
    if (!annSel) return;
    var b, rot = 0;
    if (annSel.type === 'shape') {
      var sh = state.annShapes[annSel.idx]; if (!sh) return;
      b = shapeBoundsScreen(sh);
      rot = sh.rotation || 0;
    } else {
      var st = state.annStrokes[annSel.idx]; if (!st) return;
      var wb = strokeBounds(st);
      var sx1 = toSX(wb.x)*DPR, sy1 = toSY(wb.y)*DPR;
      var sx2 = toSX(wb.x+wb.w)*DPR, sy2 = toSY(wb.y+wb.h)*DPR;
      var pad = 6*DPR;
      b = { x: Math.min(sx1,sx2)-pad, y: Math.min(sy1,sy2)-pad,
            w: Math.abs(sx2-sx1)+2*pad, h: Math.abs(sy2-sy1)+2*pad,
            cx:(sx1+sx2)/2, cy:(sy1+sy2)/2 };
      rot = st.rotation || 0;
    }
    // rotated polygon corners
    var c = [
      {x:b.x, y:b.y}, {x:b.x+b.w, y:b.y},
      {x:b.x+b.w, y:b.y+b.h}, {x:b.x, y:b.y+b.h}
    ];
    if (rot) {
      var cosR = Math.cos(rot), sinR = Math.sin(rot);
      c = c.map(function(p){
        var dx = p.x-b.cx, dy = p.y-b.cy;
        return { x: b.cx + dx*cosR - dy*sinR, y: b.cy + dx*sinR + dy*cosR };
      });
    }
    selectionUI.kind = annSel.type;
    selectionUI.corners = c;
    ctx.save();
    ctx.strokeStyle = '#ffa000'; ctx.lineWidth = 1.5*DPR; ctx.setLineDash([5*DPR, 3*DPR]);
    ctx.beginPath(); ctx.moveTo(c[0].x,c[0].y);
    ctx.lineTo(c[1].x,c[1].y); ctx.lineTo(c[2].x,c[2].y); ctx.lineTo(c[3].x,c[3].y);
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    // corner handles
    var hs = 5*DPR; ctx.fillStyle = '#ffa000';
    for (var i=0;i<4;i++) ctx.fillRect(c[i].x-hs, c[i].y-hs, hs*2, hs*2);
    // action buttons above bounding box
    var mnX = Math.min(c[0].x,c[1].x,c[2].x,c[3].x);
    var mxX = Math.max(c[0].x,c[1].x,c[2].x,c[3].x);
    var mnY = Math.min(c[0].y,c[1].y,c[2].y,c[3].y);
    var mxY = Math.max(c[0].y,c[1].y,c[2].y,c[3].y);
    var iconSize = 26*DPR, gap = 6*DPR, totalW = iconSize*3 + gap*2;
    var icX = (mnX + mxX)/2 - totalW/2;
    var icY = mnY - iconSize - 10*DPR;
    if (icY < 2*DPR) icY = mxY + 10*DPR;
    function roundRect(x,y,w,h,r){
      ctx.beginPath();
      ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
      ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
      ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
      ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y);
    }
    ctx.font = (13*DPR)+'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // delete
    var delBtn = { x:icX, y:icY, w:iconSize, h:iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1*DPR;
    roundRect(delBtn.x, delBtn.y, delBtn.w, delBtn.h, 5*DPR); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('\u2716', delBtn.x+iconSize/2, delBtn.y+iconSize/2);
    selectionUI.delBtn = delBtn;
    // duplicate
    var dupBtn = { x:icX+iconSize+gap, y:icY, w:iconSize, h:iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#4fc3f7';
    roundRect(dupBtn.x, dupBtn.y, dupBtn.w, dupBtn.h, 5*DPR); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('\u2750', dupBtn.x+iconSize/2, dupBtn.y+iconSize/2);
    selectionUI.dupBtn = dupBtn;
    // rotate
    var rotBtn = { x:icX+(iconSize+gap)*2, y:icY, w:iconSize, h:iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#a78bfa';
    roundRect(rotBtn.x, rotBtn.y, rotBtn.w, rotBtn.h, 5*DPR); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('\u21BB', rotBtn.x+iconSize/2, rotBtn.y+iconSize/2);
    selectionUI.rotBtn = rotBtn;
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }
  function drawShape(sh, selected) {
    var rot = sh.rotation || 0;
    ctx.save();
    if (rot) {
      var b = shapeBoundsScreen(sh);
      ctx.translate(b.cx, b.cy);
      ctx.rotate(rot);
      ctx.translate(-b.cx, -b.cy);
    }
    ctx.strokeStyle = sh.color; ctx.fillStyle = sh.color;
    ctx.lineWidth = sh.width * viewScale * DPR;
    var x1 = toSX(sh.x)*DPR, y1 = toSY(sh.y)*DPR;
    var x2 = toSX(sh.x + sh.w)*DPR, y2 = toSY(sh.y + sh.h)*DPR;
    switch (sh.type) {
      case 'rect':
        if (sh.filled) ctx.fillRect(x1, y1, x2-x1, y2-y1);
        else ctx.strokeRect(x1, y1, x2-x1, y2-y1);
        break;
      case 'circle': {
        var cx = (x1+x2)/2, cy = (y1+y2)/2;
        var r = Math.min(Math.abs(x2-x1), Math.abs(y2-y1))/2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
        if (sh.filled) ctx.fill(); else ctx.stroke();
        break;
      }
      case 'ellipse': {
        var cx2 = (x1+x2)/2, cy2 = (y1+y2)/2;
        ctx.beginPath();
        ctx.ellipse(cx2, cy2, Math.abs(x2-x1)/2, Math.abs(y2-y1)/2, 0, 0, Math.PI*2);
        if (sh.filled) ctx.fill(); else ctx.stroke();
        break;
      }
      case 'line':
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
        break;
      case 'arrow':
        drawArrow(x1,y1,x2,y2, sh.width * viewScale * DPR, false);
        break;
      case 'dblarrow':
        drawArrow(x1,y1,x2,y2, sh.width * viewScale * DPR, true);
        break;
      case 'text':
        // Font size scales with the bounding-box height so corner-drag resize works.
        var _fsW = Math.max(8, Math.abs(sh.h) || 20) * viewScale * DPR;
        ctx.font = _fsW + 'px sans-serif';
        ctx.textBaseline = 'top';
        ctx.fillText(sh.text || '(text)', x1, y1);
        break;
    }
    ctx.restore();
  }
  function drawArrow(x1,y1,x2,y2,w,dbl) {
    var head = Math.max(8, w*3);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    var ang = Math.atan2(y2-y1, x2-x1);
    function arrowhead(hx, hy, a) {
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - head*Math.cos(a - Math.PI/6), hy - head*Math.sin(a - Math.PI/6));
      ctx.lineTo(hx - head*Math.cos(a + Math.PI/6), hy - head*Math.sin(a + Math.PI/6));
      ctx.closePath(); ctx.fill();
    }
    arrowhead(x2,y2,ang);
    if (dbl) arrowhead(x1,y1, ang + Math.PI);
  }

  function hitShape(wx, wy) {
    for (var i = state.annShapes.length - 1; i >= 0; i--) {
      var sh = state.annShapes[i];
      var x1 = sh.x, y1 = sh.y, x2 = sh.x + sh.w, y2 = sh.y + sh.h;
      if (sh.type === 'text') {
        // Text width is measured from rendered glyphs; height drives font size.
        var fs = Math.max(8, Math.abs(sh.h) || 20);
        ctx.save(); ctx.font = fs + 'px sans-serif';
        var tw = ctx.measureText(sh.text || '(text)').width / DPR;
        ctx.restore();
        x2 = x1 + Math.max(tw, 20);
        y2 = y1 + fs * 1.15;
      }
      var mnx=Math.min(x1,x2)-8, mxx=Math.max(x1,x2)+8, mny=Math.min(y1,y2)-8, mxy=Math.max(y1,y2)+8;
      if (wx >= mnx && wx <= mxx && wy >= mny && wy <= mxy) return i;
    }
    return -1;
  }

  function hitStroke(wx, wy) {
    for (var i = state.annStrokes.length - 1; i >= 0; i--) {
      var s = state.annStrokes[i];
      var tol = Math.max(8, (s.width || 2) + 4);
      for (var j = 1; j < s.points.length; j++) {
        if (pointOnSegment(wx, wy, s.points[j-1], s.points[j], tol)) return i;
      }
    }
    return -1;
  }

  function hitAnyAnnotation(wx, wy) {
    var sIdx = hitShape(wx, wy);
    if (sIdx >= 0) return { type:'shape', idx: sIdx };
    var tIdx = hitStroke(wx, wy);
    if (tIdx >= 0) return { type:'stroke', idx: tIdx };
    return null;
  }

  function hitBtn(sx, sy, btn) {
    if (!btn) return false;
    var pad = 4 * DPR;
    return sx >= btn.x-pad && sx <= btn.x+btn.w+pad && sy >= btn.y-pad && sy <= btn.y+btn.h+pad;
  }

  function hitCornerHandle(sx, sy, corners) {
    if (!corners) return -1;
    var t = 12 * DPR;
    for (var i = 0; i < 4; i++) {
      if (Math.abs(sx-corners[i].x) < t && Math.abs(sy-corners[i].y) < t) return i;
    }
    return -1;
  }

  function deleteSelectedAnn() {
    if (!annSel) return;
    saveUndo();
    if (annSel.type === 'shape') state.annShapes.splice(annSel.idx, 1);
    else state.annStrokes.splice(annSel.idx, 1);
    annSel = null; selectedShape = null;
    scheduleDraw();
  }

  function duplicateSelectedAnn() {
    if (!annSel) return;
    saveUndo();
    if (annSel.type === 'shape') {
      var sh = state.annShapes[annSel.idx]; if (!sh) return;
      var c = JSON.parse(JSON.stringify(sh));
      c.x += 16; c.y += 16; c.id = state.nextId++;
      state.annShapes.push(c);
      annSel = { type:'shape', idx: state.annShapes.length - 1 };
    } else {
      var st = state.annStrokes[annSel.idx]; if (!st) return;
      var cs = JSON.parse(JSON.stringify(st));
      cs.points = cs.points.map(function(p){ return { x:p.x+16, y:p.y+16 }; });
      cs.id = state.nextId++;
      state.annStrokes.push(cs);
      annSel = { type:'stroke', idx: state.annStrokes.length - 1 };
    }
    scheduleDraw();
  }

  function rotateSelectedAnn() {
    if (!annSel) return;
    saveUndo();
    var obj = annSel.type === 'shape' ? state.annShapes[annSel.idx] : state.annStrokes[annSel.idx];
    if (!obj) return;
    obj.rotation = (obj.rotation || 0) + Math.PI/12;
    scheduleDraw();
  }

  function drawPendingWire() {
    if (!pendingWire || !pendingWire.cursor) return;
    var fc = state.components.find(function(x){return x.id===pendingWire.from.compId;});
    if (!fc) return;
    var pts = [portWorld(fc, pendingWire.from.portIdx)];
    pendingWire.waypoints.forEach(function(wp){ pts.push({x:wp.x,y:wp.y}); });
    pts.push(pendingWire.cursor);
    // orthogonalise for preview
    var ortho = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var p0 = ortho[ortho.length-1], p1 = pts[i];
      if (p0.x !== p1.x && p0.y !== p1.y) ortho.push({x:p1.x,y:p0.y});
      ortho.push(p1);
    }
    ctx.save();
    ctx.setLineDash([6*DPR, 4*DPR]);
    ctx.lineWidth = 2*DPR;
    ctx.strokeStyle = '#ffa000';
    ctx.beginPath();
    ctx.moveTo(toSX(ortho[0].x)*DPR, toSY(ortho[0].y)*DPR);
    for (var j = 1; j < ortho.length; j++) {
      ctx.lineTo(toSX(ortho[j].x)*DPR, toSY(ortho[j].y)*DPR);
    }
    ctx.stroke();
    // waypoints
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffa000';
    pendingWire.waypoints.forEach(function(wp){
      ctx.beginPath();
      ctx.arc(toSX(wp.x)*DPR, toSY(wp.y)*DPR, 3*DPR, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.restore();
  }

  /* ── Pointer handling ────────────────────────────────────── */
  function screenToWorldFromEvent(ev) {
    var rect = canvas.getBoundingClientRect();
    var sx = ev.clientX - rect.left;
    var sy = ev.clientY - rect.top;
    return { x: toWX(sx), y: toWY(sy), sx: sx, sy: sy };
  }

  function onPointerDown(ev) {
    if (ev.button === 2) return; // right-click → contextmenu handler
    var p = screenToWorldFromEvent(ev);

    // middle button or space = pan
    if (ev.button === 1 || spaceHeld || tool === 'pan') {
      drag = { kind:'pan', startX: p.sx, startY: p.sy, startOffX: viewOffX, startOffY: viewOffY };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      return;
    }

    // annotation tools
    if (tool === 'sketch') {
      saveUndo();
      var stroke = { color: sketchColor, width: sketchWidth, points: [{x:p.x,y:p.y}] };
      state.annStrokes.push(stroke);
      drag = { kind:'sketch', stroke: stroke };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      return;
    }
    if (tool === 'shape') {
      if (shapeType === 'text') {
        ev.preventDefault();
        startTextEdit(p.x, p.y);
        // text is a one-shot creator — drop back to move tool so the new label is selectable
        setTool('move');
        annSel = { type:'shape', idx: state.annShapes.length - 1 };
        return;
      }
      saveUndo();
      var sh = { type: shapeType, x: p.x, y: p.y, w: 0, h: 0, color: shapeColor, width: shapeWidth, filled: shapeFilled, rotation: 0 };
      state.annShapes.push(sh);
      annSel = { type:'shape', idx: state.annShapes.length - 1 };
      drag = { kind:'shape-draw', shape: sh };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      return;
    }

    // in move mode: action buttons / corners first, then annotation pick
    if (tool === 'move') {
      var sxScr = p.sx * DPR, syScr = p.sy * DPR;
      if (annSel && selectionUI) {
        if (hitBtn(sxScr,syScr,selectionUI.delBtn)) { deleteSelectedAnn(); return; }
        if (hitBtn(sxScr,syScr,selectionUI.dupBtn)) { duplicateSelectedAnn(); return; }
        if (hitBtn(sxScr,syScr,selectionUI.rotBtn)) { rotateSelectedAnn(); return; }
        var corner = hitCornerHandle(sxScr,syScr,selectionUI.corners);
        if (corner >= 0) {
          saveUndo();
          drag = { kind:'ann-resize', corner: corner };
          canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
          return;
        }
      }
      var pick = hitAnyAnnotation(p.x, p.y);
      if (pick) {
        if (annSel && annSel.type === pick.type && annSel.idx === pick.idx) {
          // re-click → drag
          if (pick.type === 'shape') {
            drag = { kind:'shape-move', idx: pick.idx, dx: state.annShapes[pick.idx].x - p.x, dy: state.annShapes[pick.idx].y - p.y, moved:false };
          } else {
            drag = { kind:'stroke-move', idx: pick.idx, sx:p.x, sy:p.y, moved:false };
          }
          canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
          return;
        }
        annSel = pick;
        selectedShape = pick.type === 'shape' ? pick.idx : null;
        selectedId = null; selectedConnId = null;
        renderProps(); scheduleDraw();
        return;
      }
      annSel = null; selectedShape = null;
    }

    // PRIORITY 1: port click (starts or completes a wire)
    var port = hitPort(p.x, p.y);
    if (port) {
      if (!pendingWire) {
        pendingWire = { from: { compId: port.compId, portIdx: port.portIdx }, waypoints: [], cursor: {x:port.x,y:port.y} };
      } else {
        // completing — can't wire to same port/component self
        if (port.compId !== pendingWire.from.compId || port.portIdx !== pendingWire.from.portIdx) {
          saveUndo();
          state.connections.push({
            id: state.nextId++,
            from: pendingWire.from,
            to: { compId: port.compId, portIdx: port.portIdx },
            waypoints: pendingWire.waypoints
          });
        }
        pendingWire = null;
      }
      scheduleDraw();
      return;
    }

    // PRIORITY 1.5: tap into an existing wire while completing a pending wire
    // → splice in a 4-way junction at the click point and connect to its perpendicular port.
    if (pendingWire) {
      var tapConn = hitConnection(p.x, p.y, 8);
      if (tapConn) {
        // approach point = previous vertex on the pending wire (last waypoint or starting port)
        var approach;
        if (pendingWire.waypoints && pendingWire.waypoints.length) {
          approach = pendingWire.waypoints[pendingWire.waypoints.length - 1];
        } else {
          var fcA = state.components.find(function(x){return x.id===pendingWire.from.compId;});
          approach = fcA ? portWorld(fcA, pendingWire.from.portIdx) : null;
        }
        saveUndo();
        var tap = tapIntoConnection(tapConn, p, approach);
        if (tap) {
          state.connections.push({
            id: state.nextId++,
            from: pendingWire.from,
            to: { compId: tap.jcomp.id, portIdx: tap.freePort },
            waypoints: pendingWire.waypoints
          });
          pendingWire = null;
          scheduleDraw();
          return;
        }
      }
    }

    // PRIORITY 2: waypoint during wire
    if (pendingWire) {
      pendingWire.waypoints.push({x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10});
      scheduleDraw();
      return;
    }

    // PRIORITY 3a: waypoint drag on selected connection
    if (selectedConnId) {
      var selConn = state.connections.find(function(x){ return x.id === selectedConnId; });
      if (selConn && selConn.waypoints) {
        for (var wi = 0; wi < selConn.waypoints.length; wi++) {
          var wp = selConn.waypoints[wi];
          if (Math.abs(p.x - wp.x) < 10 && Math.abs(p.y - wp.y) < 10) {
            saveUndo();
            drag = { kind:'waypoint-move', connId: selectedConnId, wpIdx: wi };
            canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
            return;
          }
        }
      }
    }

    // PRIORITY 3: component click (components beat wires so a wire crossing a body doesn't steal the click)
    var c = hitComponent(p.x, p.y);
    if (c) {
      selectedId = c.id;
      selectedConnId = null;
      drag = { kind:'move', id: c.id, dx: c.x - p.x, dy: c.y - p.y, moved: false };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      renderProps();
      showCompPopover(c);
      scheduleDraw();
      return;
    }

    // PRIORITY 4: connection click
    var conn = hitConnection(p.x, p.y);
    if (conn) {
      // shift-click on a not-yet-selected wire (or double-click): tap a junction in
      // and immediately start a new pending wire from its perpendicular port.
      if ((ev.shiftKey || ev.detail === 2) && selectedConnId !== conn.id) {
        saveUndo();
        var tap2 = tapIntoConnection(conn, p, p);
        if (tap2) {
          pendingWire = {
            from: { compId: tap2.jcomp.id, portIdx: tap2.freePort },
            waypoints: [],
            cursor: { x: tap2.jcomp.x, y: tap2.jcomp.y }
          };
          selectedConnId = null;
          scheduleDraw();
          return;
        }
      }
      // alt/shift-click on selected wire: insert waypoint
      if ((ev.altKey || ev.shiftKey) && selectedConnId === conn.id) {
        saveUndo();
        conn.waypoints = conn.waypoints || [];
        conn.waypoints.push({ x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10 });
        drag = { kind:'waypoint-move', connId: conn.id, wpIdx: conn.waypoints.length - 1 };
        canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
        scheduleDraw();
        return;
      }
      selectedConnId = conn.id;
      selectedId = null;
      hideCompPopover();
      renderProps();
      scheduleDraw();
      return;
    }

    {
      // empty → pan
      selectedId = null;
      selectedConnId = null;
      hideCompPopover();
      drag = { kind:'pan', startX: p.sx, startY: p.sy, startOffX: viewOffX, startOffY: viewOffY };
      canvas.setPointerCapture && canvas.setPointerCapture(ev.pointerId);
      renderProps();
      scheduleDraw();
    }
  }

  function onPointerMove(ev) {
    var p = screenToWorldFromEvent(ev);

    // update pending wire cursor
    if (pendingWire) {
      var sp = hitPort(p.x, p.y);
      pendingWire.cursor = sp ? { x: sp.x, y: sp.y } : { x: Math.round(p.x/10)*10, y: Math.round(p.y/10)*10 };
      hoverPort = sp;
      scheduleDraw();
      return;
    }

    // hover
    var prevHover = hoverId, prevPort = hoverPort, prevConn = hoverConnId;
    if (!drag) {
      var port = hitPort(p.x, p.y);
      hoverPort = port;
      if (port) { hoverId = null; hoverConnId = null; canvas.style.cursor = 'pointer'; }
      else {
        var c = hitComponent(p.x, p.y);
        hoverId = c ? c.id : null;
        if (!c) {
          var hc = hitConnection(p.x, p.y);
          hoverConnId = hc ? hc.id : null;
        } else hoverConnId = null;
        // Tool-aware cursor
        if (tool === 'pan') canvas.style.cursor = 'grab';
        else if (tool === 'sketch') canvas.style.cursor = PENCIL_CURSOR;
        else if (tool === 'shape') canvas.style.cursor = 'crosshair';
        else canvas.style.cursor = (hoverId || hoverConnId) ? 'move' : 'crosshair';

        // In move mode, hovering over selection handles / buttons / annotations should reflect cursor
        if (tool === 'move') {
          var sxScr = p.sx * DPR, syScr = p.sy * DPR;
          if (annSel && selectionUI) {
            var hCorner = hitCornerHandle(sxScr, syScr, selectionUI.corners);
            if (hCorner >= 0) {
              canvas.style.cursor = (hCorner === 0 || hCorner === 2) ? 'nwse-resize' : 'nesw-resize';
            } else if (hitBtn(sxScr,syScr,selectionUI.delBtn) || hitBtn(sxScr,syScr,selectionUI.dupBtn) || hitBtn(sxScr,syScr,selectionUI.rotBtn)) {
              canvas.style.cursor = 'pointer';
            } else if (hitAnyAnnotation(p.x, p.y)) {
              canvas.style.cursor = 'move';
            }
          } else if (hitAnyAnnotation(p.x, p.y)) {
            canvas.style.cursor = 'move';
          }
        }
      }
      if (hoverId !== prevHover || hoverPort !== prevPort || hoverConnId !== prevConn) scheduleDraw();
    }
    if (!drag) return;

    if (drag.kind === 'pan') {
      viewOffX = drag.startOffX + (p.sx - drag.startX)/viewScale;
      viewOffY = drag.startOffY + (p.sy - drag.startY)/viewScale;
      scheduleDraw();
      return;
    }
    if (drag.kind === 'move') {
      var c2 = state.components.find(function(x){return x.id===drag.id;});
      if (!c2) return;
      if (!drag.moved) { saveUndo(); drag.moved = true; hideCompPopover(); }
      c2.x = Math.round((p.x + drag.dx)/10)*10;
      c2.y = Math.round((p.y + drag.dy)/10)*10;
      scheduleDraw();
    }
    if (drag.kind === 'sketch') {
      drag.stroke.points.push({x:p.x,y:p.y});
      scheduleDraw();
    }
    if (drag.kind === 'shape-draw') {
      drag.shape.w = p.x - drag.shape.x;
      drag.shape.h = p.y - drag.shape.y;
      scheduleDraw();
    }
    if (drag.kind === 'shape-move') {
      if (!drag.moved) { saveUndo(); drag.moved = true; }
      var sh = state.annShapes[drag.idx];
      if (sh) { sh.x = p.x + drag.dx; sh.y = p.y + drag.dy; scheduleDraw(); }
    }
    if (drag.kind === 'waypoint-move') {
      var cW = state.connections.find(function(x){ return x.id === drag.connId; });
      if (cW && cW.waypoints && cW.waypoints[drag.wpIdx]) {
        cW.waypoints[drag.wpIdx].x = Math.round(p.x/10)*10;
        cW.waypoints[drag.wpIdx].y = Math.round(p.y/10)*10;
        scheduleDraw();
      }
      return;
    }
    if (drag.kind === 'stroke-move') {
      if (!drag.moved) { saveUndo(); drag.moved = true; }
      var st = state.annStrokes[drag.idx];
      if (st) {
        var ddx = p.x - drag.sx, ddy = p.y - drag.sy;
        st.points.forEach(function(pt){ pt.x += ddx; pt.y += ddy; });
        drag.sx = p.x; drag.sy = p.y;
        scheduleDraw();
      }
    }
    if (drag.kind === 'ann-resize') {
      if (!annSel) return;
      if (annSel.type === 'shape') {
        var sh2 = state.annShapes[annSel.idx]; if (!sh2) return;
        // corners indexed 0:NW 1:NE 2:SE 3:SW (relative to unrotated bbox)
        var x1 = sh2.x, y1 = sh2.y, x2 = sh2.x + sh2.w, y2 = sh2.y + sh2.h;
        if (drag.corner === 0) { sh2.x = p.x; sh2.y = p.y; sh2.w = x2 - p.x; sh2.h = y2 - p.y; }
        else if (drag.corner === 1) { sh2.y = p.y; sh2.w = p.x - sh2.x; sh2.h = y2 - p.y; }
        else if (drag.corner === 2) { sh2.w = p.x - sh2.x; sh2.h = p.y - sh2.y; }
        else if (drag.corner === 3) { sh2.x = p.x; sh2.w = x2 - p.x; sh2.h = p.y - sh2.y; }
        scheduleDraw();
      } else {
        // scale stroke about opposite corner
        var st2 = state.annStrokes[annSel.idx]; if (!st2) return;
        var b = strokeBounds(st2);
        var opp;
        if (drag.corner === 0) opp = { x: b.x+b.w, y: b.y+b.h };
        else if (drag.corner === 1) opp = { x: b.x, y: b.y+b.h };
        else if (drag.corner === 2) opp = { x: b.x, y: b.y };
        else opp = { x: b.x+b.w, y: b.y };
        var nw = Math.abs(p.x - opp.x), nh = Math.abs(p.y - opp.y);
        var sxF = b.w > 1 ? nw / b.w : 1, syF = b.h > 1 ? nh / b.h : 1;
        if (!isFinite(sxF) || sxF < 0.05) sxF = 0.05;
        if (!isFinite(syF) || syF < 0.05) syF = 0.05;
        st2.points.forEach(function(pt){
          pt.x = opp.x + (pt.x - opp.x) * sxF * (Math.sign(p.x-opp.x)||1) / (Math.sign(b.w)||1);
          pt.y = opp.y + (pt.y - opp.y) * syF * (Math.sign(p.y-opp.y)||1) / (Math.sign(b.h)||1);
        });
        scheduleDraw();
      }
    }
  }

  function onPointerUp(ev) {
    if (drag) {
      try { canvas.releasePointerCapture(ev.pointerId); } catch(e){}
      // After drawing a shape, auto-switch back to move tool so the user can
      // immediately resize / rotate / duplicate / delete the new shape via its
      // selection handles. Sketch stays sticky for continuous drawing.
      if (drag.kind === 'shape-draw') {
        // discard zero-size accidental clicks (no real drag)
        if (drag.shape && Math.abs(drag.shape.w) < 3 && Math.abs(drag.shape.h) < 3) {
          var idx = state.annShapes.indexOf(drag.shape);
          if (idx >= 0) state.annShapes.splice(idx, 1);
          annSel = null;
        }
        setTool('move');
      }
      // After moving a component, reposition the popover to follow it
      if (drag.kind === 'move' && drag.moved) {
        var cm = state.components.find(function(x){return x.id===drag.id;});
        if (cm) showCompPopover(cm);
      }
    }
    drag = null;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  canvas.addEventListener('dblclick', function(ev){
    var p = screenToWorldFromEvent(ev);
    var idx = hitShape(p.x, p.y);
    if (idx < 0) return;
    var sh = state.annShapes[idx];
    if (!sh || sh.type !== 'text') return;
    var textInputEl = document.getElementById('shape-text-input');
    if (!textInputEl) return;
    textEditing = idx;
    selectedShape = idx;
    textInputEl.value = sh.text || '';
    textInputEl.style.display = 'block';
    textInputEl.style.left = toSX(sh.x) + 'px';
    textInputEl.style.top  = toSY(sh.y) + 'px';
    textInputEl.focus();
    textInputEl.select();
  });

  /* ── Wheel zoom ──────────────────────────────────────────── */
  canvas.addEventListener('wheel', function (ev) {
    if (!ev.ctrlKey && !ev.metaKey) return;
    ev.preventDefault();
    var rect = canvas.getBoundingClientRect();
    var sx = ev.clientX - rect.left, sy = ev.clientY - rect.top;
    var wx = toWX(sx), wy = toWY(sy);
    var factor = ev.deltaY < 0 ? 1.1 : 1/1.1;
    viewScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewScale * factor));
    viewOffX = sx/viewScale - wx;
    viewOffY = sy/viewScale - wy;
    scheduleDraw();
  }, { passive: false });

  /* ── Palette drag & drop ────────────────────────────────── */
  var paletteDragType = null;
  palette.addEventListener('dragstart', function (ev) {
    var item = ev.target.closest('.palette-item');
    if (!item) return;
    paletteDragType = item.getAttribute('data-type');
    ev.dataTransfer.effectAllowed = 'copy';
    ev.dataTransfer.setData('text/plain', paletteDragType);
  });
  canvas.addEventListener('dragover', function (ev) { ev.preventDefault(); ev.dataTransfer.dropEffect = 'copy'; });
  canvas.addEventListener('drop', function (ev) {
    ev.preventDefault();
    var type = paletteDragType || (ev.dataTransfer && ev.dataTransfer.getData('text/plain'));
    if (!type || !COMP_DEFS[type]) return;
    var rect = canvas.getBoundingClientRect();
    var sx = ev.clientX - rect.left, sy = ev.clientY - rect.top;
    saveUndo();
    var c = makeComponent(type, Math.round(toWX(sx)/10)*10, Math.round(toWY(sy)/10)*10);
    state.components.push(c);
    selectedId = c.id;
    renderProps();
    scheduleDraw();
    paletteDragType = null;
  });
  // click-to-add fallback (mobile)
  palette.addEventListener('click', function (ev) {
    var item = ev.target.closest('.palette-item');
    if (!item) return;
    var type = item.getAttribute('data-type');
    if (!COMP_DEFS[type]) return;
    saveUndo();
    var cx = toWX(cssW/2), cy = toWY(cssH/2);
    var c = makeComponent(type, Math.round(cx/10)*10, Math.round(cy/10)*10);
    state.components.push(c);
    selectedId = c.id;
    renderProps();
    scheduleDraw();
  });

  /* ── Palette category collapse ──────────────────────────── */
  palette.querySelectorAll('.palette-cat').forEach(function (cat) {
    cat.addEventListener('click', function () { cat.classList.toggle('collapsed'); });
  });

  /* ── Properties panel ────────────────────────────────────── */
  function renderProps() {
    if (!propsPanel) return;
    var c = state.components.find(function(x){return x.id===selectedId;});
    if (!c) { propsPanel.style.display = 'none'; return; }
    propsPanel.style.display = '';
    var def = COMP_DEFS[c.type];
    var html = '<div style="font-weight:600;color:var(--text);margin-bottom:6px;">'+
      (COMP_LABELS[c.type]||c.type)+' #'+c.id+'</div>';
    if (c.type === 'battery') {
      html += propUnitSlider(c, 'V', 'Voltage', 'V');
      html += propNumber(c, 'r', 'Internal R \u03A9 (0 = ideal)');
    } else if (c.type === 'resistor') {
      html += propUnitSlider(c, 'R', 'Resistance', 'R');
    } else if (c.type === 'rheostat') {
      html += propUnitSlider(c, 'R', 'Current R', 'R');
      html += propNumber(c, 'Rmax', 'Max R (Ω)');
    } else if (c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') {
      html += propUnitSlider(c, 'R', 'Resistance', 'R');
    } else if (c.type === 'led') {
      html += propNumber(c, 'Vf', 'Forward V (V)');
      html += propUnitSlider(c, 'R', 'Series R', 'R');
    } else if (c.type === 'fuse') {
      html += propNumber(c, 'Irated', 'Rating (A)');
      html += '<label><span class="prop-val">State: '+(c.props.blown?'BLOWN':'Intact')+'</span>'+
              '<button class="btn btn-ghost" data-act="replace-fuse" style="margin-top:4px;">Replace Fuse</button></label>';
    } else if (c.type === 'switch' || c.type === 'pushbutton') {
      html += '<label><span class="prop-val">State: '+(c.props.closed?'Closed':'Open')+'</span>'+
              '<button class="btn btn-ghost" data-act="toggle" style="margin-top:4px;">Toggle</button></label>';
    }
    html += '<label><button class="btn btn-ghost" data-act="rotate">↻ Rotate 90°</button> '+
            '<button class="btn btn-ghost" data-act="delete">🗑 Delete</button></label>';
    propsBody.innerHTML = html;

    propsBody.querySelectorAll('input[data-prop]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var key = inp.getAttribute('data-prop');
        var val = parseFloat(inp.value);
        if (isNaN(val)) return;
        var mul = parseFloat(inp.getAttribute('data-mul'));
        if (!isNaN(mul) && mul > 0) {
          // slider value is in display unit; store base = display * mul, rounded to mitigate float drift
          var base = val * mul;
          // round to 6 significant digits to avoid 9.000000000001 type artifacts
          base = Math.round(base * 1e6) / 1e6;
          c.props[key] = base;
        } else {
          c.props[key] = val;
        }
        var span = propsBody.querySelector('[data-val="'+key+'"]');
        if (span) span.textContent = formatDispVal(val);
        markDirty();
        scheduleDraw();
      });
    });
    propsBody.querySelectorAll('select[data-unit]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var key = sel.getAttribute('data-unit');
        var unitKey = (key === 'V') ? 'Vunit' : 'Runit';
        var newMul = parseFloat(sel.value);
        if (!newMul || newMul <= 0) return;
        c.props[unitKey] = newMul;
        // re-render the panel so slider min/max/step + displayed value reflect the new unit
        renderProps();
        scheduleDraw();
      });
    });
    propsBody.querySelectorAll('button[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'toggle') { saveUndo(); c.props.closed = !c.props.closed; try{sfx.click();}catch(e){} renderProps(); scheduleDraw(); }
        else if (act === 'replace-fuse') { saveUndo(); c.props.blown = false; clearFaults(); markDirty(); try{sfx.click();}catch(e){} renderProps(); scheduleDraw(); }
        else if (act === 'rotate') { saveUndo(); c.rot = (c.rot + 90) % 360; scheduleDraw(); }
        else if (act === 'delete') { saveUndo(); deleteSelected(); }
      });
    });
  }
  function propSlider(c, key, label, unit, min, max, step) {
    return '<label>'+label+' <span class="prop-val" data-val="'+key+'">'+c.props[key]+'</span> '+unit+
      '<input type="range" data-prop="'+key+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+c.props[key]+'"></label>';
  }
  // Unit-aware slider: kind is 'R' (Ω/kΩ/MΩ) or 'V' (V/kV/MV).
  // Internal storage stays in BASE units (Ω, V); the slider works in the user-selected unit.
  function unitOptionsFor(kind) {
    if (kind === 'R') return [{label:'Ω',mul:1},{label:'kΩ',mul:1000},{label:'MΩ',mul:1000000}];
    return [{label:'V',mul:1},{label:'kV',mul:1000},{label:'MV',mul:1000000}];
  }
  function stepForMul(mul) {
    if (mul >= 1e6) return 0.01;
    if (mul >= 1e3) return 0.1;
    return 1;
  }
  function formatDispVal(v) {
    if (v == null || isNaN(v)) return '0';
    if (Math.abs(v) >= 100) return v.toFixed(0);
    if (Math.abs(v) >= 10)  return v.toFixed(1);
    return v.toFixed(2).replace(/\.?0+$/, '');
  }
  function propUnitSlider(c, key, label, kind) {
    var unitKey = (kind === 'V') ? 'Vunit' : 'Runit';
    if (c.props[unitKey] == null) {
      // pick a sensible default based on the existing base value so legacy components look right
      var base = c.props[key] || 0;
      if (base >= 1e6) c.props[unitKey] = 1e6;
      else if (base >= 1e3) c.props[unitKey] = 1e3;
      else c.props[unitKey] = 1;
    }
    var mul = c.props[unitKey];
    var min = 1, max = 10000, step = stepForMul(mul);
    // dispActual = true stored value in selected units; dispSlider = clamped slider position.
    // Showing dispActual in the readout means switching units never silently changes the stored value
    // — the slider thumb just sits at the nearest valid edge until the user actually moves it.
    var dispActual = (c.props[key] || 0) / mul;
    var dispSlider = Math.round(dispActual / step) * step;
    if (dispSlider < min) dispSlider = min;
    if (dispSlider > max) dispSlider = max;
    var opts = unitOptionsFor(kind);
    var optsHtml = opts.map(function(o){
      return '<option value="'+o.mul+'"'+(o.mul===mul?' selected':'')+'>'+o.label+'</option>';
    }).join('');
    return '<label>'+label+
      ' <span class="prop-val" data-val="'+key+'">'+formatDispVal(dispActual)+'</span> '+
      '<select data-unit="'+key+'" style="margin-left:4px;">'+optsHtml+'</select>'+
      '<input type="range" data-prop="'+key+'" data-mul="'+mul+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+dispSlider+'"></label>';
  }
  function propNumber(c, key, label) {
    return '<label>'+label+
      '<input type="number" data-prop="'+key+'" value="'+c.props[key]+'" step="any"></label>';
  }

  /* ── Component popover (in-canvas quick editor) ──────────── */
  var compPopover = null;
  var compPopoverFor = null;
  function ensureCompPopover() {
    if (compPopover) return compPopover;
    compPopover = document.createElement('div');
    compPopover.id = 'comp-popover';
    compPopover.className = 'comp-popover';
    compPopover.style.display = 'none';
    if (canvasCard) canvasCard.appendChild(compPopover);
    // outside click closes (but ignore canvas — its own pointerdown handles re-selection)
    document.addEventListener('mousedown', function (ev) {
      if (!compPopover || compPopover.style.display === 'none') return;
      if (compPopover.contains(ev.target)) return;
      if (ev.target === canvas) return;
      hideCompPopover();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && compPopover && compPopover.style.display !== 'none') hideCompPopover();
    });
    return compPopover;
  }
  function hideCompPopover() {
    if (compPopover) { compPopover.style.display = 'none'; compPopoverFor = null; }
  }
  function compEditField(c, key, label, kind) {
    var unitKey = (kind === 'V') ? 'Vunit' : 'Runit';
    if (c.props[unitKey] == null) {
      var base = c.props[key] || 0;
      if (base >= 1e6) c.props[unitKey] = 1e6;
      else if (base >= 1e3) c.props[unitKey] = 1e3;
      else c.props[unitKey] = 1;
    }
    var mul = c.props[unitKey];
    var min = 1, max = 10000, step = stepForMul(mul);
    var dispActual = (c.props[key] || 0) / mul;
    var dispSlider = Math.min(max, Math.max(min, Math.round(dispActual / step) * step));
    var opts = unitOptionsFor(kind);
    var optsHtml = opts.map(function(o){
      return '<option value="'+o.mul+'"'+(o.mul===mul?' selected':'')+'>'+o.label+'</option>';
    }).join('');
    return '<div class="cp-label">'+label+
      '<div class="cp-row">'+
        '<input type="number" data-cp-text="'+key+'" value="'+formatDispVal(dispActual)+'" step="'+step+'" min="0">'+
        '<select data-cp-unit="'+key+'">'+optsHtml+'</select>'+
      '</div>'+
      '<input type="range" data-cp-slider="'+key+'" data-mul="'+mul+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+dispSlider+'">'+
    '</div>';
  }
  function showCompPopover(c) {
    if (!c) { hideCompPopover(); return; }
    ensureCompPopover();
    compPopoverFor = c.id;
    var html = '<div class="cp-head">'+(COMP_LABELS[c.type]||c.type)+' #'+c.id+
      '<button class="cp-close" type="button" title="Close">&times;</button></div>';
    if (c.type === 'battery') {
      html += compEditField(c, 'V', 'EMF', 'V');
      html += '<div class="cp-label">Internal R \u03A9 (0 = ideal)<input type="number" data-cp="r" value="'+(c.props.r||0)+'" step="any" min="0"></div>';
    }
    else if (c.type === 'resistor' || c.type === 'lamp' || c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater')
      html += compEditField(c, 'R', 'Resistance', 'R');
    else if (c.type === 'rheostat') {
      html += compEditField(c, 'R', 'Current R', 'R');
      html += '<div class="cp-label">Max R (Ω)<input type="number" data-cp="Rmax" value="'+c.props.Rmax+'" step="any"></div>';
    }
    else if (c.type === 'led') {
      html += '<div class="cp-label">Forward V (V)<input type="number" data-cp="Vf" value="'+c.props.Vf+'" step="any"></div>';
      html += compEditField(c, 'R', 'Series R', 'R');
    }
    else if (c.type === 'fuse') {
      html += '<div class="cp-label">Rating (A)<input type="number" data-cp="Irated" value="'+c.props.Irated+'" step="any" min="0"></div>';
      html += '<div class="cp-label">State: <strong>'+(c.props.blown?'BLOWN':'Intact')+'</strong>'+
        '<button class="btn btn-ghost cp-act" data-act="replace-fuse" type="button" style="margin-left:8px;">Replace</button></div>';
    }
    else if (c.type === 'switch' || c.type === 'pushbutton') {
      html += '<div class="cp-label">State: <strong>'+(c.props.closed?'Closed':'Open')+'</strong>'+
        '<button class="btn btn-ghost cp-act" data-act="toggle" type="button" style="margin-left:8px;">Toggle</button></div>';
    }
    html += '<div class="cp-actions">'+
      '<button class="btn btn-ghost cp-act" data-act="rotate" type="button">↻ Rotate</button>'+
      '<button class="btn btn-ghost cp-act" data-act="delete" type="button">🗑 Delete</button>'+
    '</div>';
    compPopover.innerHTML = html;
    compPopover.style.display = 'block';

    // Position: prefer above the component; fall back below; clamp inside card
    var sx = (canvas.offsetLeft || 0) + toSX(c.x);
    var sy = (canvas.offsetTop  || 0) + toSY(c.y);
    var pw = compPopover.offsetWidth, ph = compPopover.offsetHeight;
    var def = COMP_DEFS[c.type] || { h: 40 };
    var halfH = (def.h / 2) * viewScale;
    var top = sy - halfH - ph - 12;
    if (top < 4) top = sy + halfH + 12;
    var left = sx - pw / 2;
    var cardW = (canvasCard && canvasCard.clientWidth) || 800;
    var cardH = (canvasCard && canvasCard.clientHeight) || 600;
    if (left < 6) left = 6;
    if (left + pw > cardW - 6) left = cardW - pw - 6;
    if (top + ph > cardH - 6) top = Math.max(6, cardH - ph - 6);
    compPopover.style.left = left + 'px';
    compPopover.style.top  = top  + 'px';

    wireCompPopoverEvents(c);
  }
  function wireCompPopoverEvents(c) {
    var x = compPopover.querySelector('.cp-close');
    if (x) x.addEventListener('click', hideCompPopover);

    compPopover.querySelectorAll('input[data-cp-text]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var key = inp.getAttribute('data-cp-text');
        var v = parseFloat(inp.value); if (isNaN(v)) return;
        var unitKey = (key === 'V') ? 'Vunit' : 'Runit';
        var mul = c.props[unitKey] || 1;
        c.props[key] = Math.round(v * mul * 1e6) / 1e6;
        var sld = compPopover.querySelector('input[data-cp-slider="'+key+'"]');
        if (sld) {
          var lo = parseFloat(sld.min), hi = parseFloat(sld.max);
          sld.value = Math.max(lo, Math.min(hi, v));
        }
        markDirty(); scheduleDraw(); renderProps();
      });
    });
    compPopover.querySelectorAll('input[data-cp-slider]').forEach(function (sld) {
      sld.addEventListener('input', function () {
        var key = sld.getAttribute('data-cp-slider');
        var v = parseFloat(sld.value);
        var mul = parseFloat(sld.getAttribute('data-mul')) || 1;
        c.props[key] = Math.round(v * mul * 1e6) / 1e6;
        var inp = compPopover.querySelector('input[data-cp-text="'+key+'"]');
        if (inp) inp.value = formatDispVal(v);
        markDirty(); scheduleDraw(); renderProps();
      });
    });
    compPopover.querySelectorAll('select[data-cp-unit]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var key = sel.getAttribute('data-cp-unit');
        var unitKey = (key === 'V') ? 'Vunit' : 'Runit';
        var mul = parseFloat(sel.value); if (!mul || mul <= 0) return;
        c.props[unitKey] = mul;
        showCompPopover(c); renderProps(); scheduleDraw();
      });
    });
    compPopover.querySelectorAll('input[data-cp]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        var key = inp.getAttribute('data-cp');
        var v = parseFloat(inp.value); if (isNaN(v)) return;
        c.props[key] = v;
        markDirty(); scheduleDraw(); renderProps();
      });
    });
    compPopover.querySelectorAll('button[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.getAttribute('data-act');
        if (act === 'toggle') { saveUndo(); c.props.closed = !c.props.closed; try{sfx.click();}catch(e){} showCompPopover(c); renderProps(); scheduleDraw(); }
        else if (act === 'replace-fuse') { saveUndo(); c.props.blown = false; clearFaults(); markDirty(); try{sfx.click();}catch(e){} showCompPopover(c); renderProps(); scheduleDraw(); }
        else if (act === 'rotate') { saveUndo(); c.rot = (c.rot + 90) % 360; showCompPopover(c); scheduleDraw(); }
        else if (act === 'delete') { saveUndo(); deleteSelected(); hideCompPopover(); }
      });
    });
  }

  /* ── Delete / rotate / clear ─────────────────────────────── */
  function deleteSelected() {
    if (selectedShape != null) {
      saveUndo();
      state.annShapes.splice(selectedShape, 1);
      selectedShape = null; scheduleDraw();
      return;
    }
    if (selectedConnId != null) {
      saveUndo();
      state.connections = state.connections.filter(function(x){return x.id!==selectedConnId;});
      selectedConnId = null;
      scheduleDraw();
      return;
    }
    if (selectedId == null) return;
    saveUndo();
    removeConnectionsForComponent(selectedId);
    state.components = state.components.filter(function(x){return x.id!==selectedId;});
    selectedId = null;
    renderProps();
    scheduleDraw();
  }
  function rotateSelected() {
    var c = state.components.find(function(x){return x.id===selectedId;});
    if (!c) return;
    saveUndo();
    c.rot = (c.rot + 90) % 360;
    scheduleDraw();
  }
  function clearCanvas() {
    if (!state.components.length && !state.connections.length) return;
    saveUndo();
    state.components = [];
    state.connections = [];
    selectedId = null;
    renderProps();
    scheduleDraw();
  }

  /* ── Toolbar buttons ─────────────────────────────────────── */
  function on(id, ev, fn) { var el = document.getElementById(id); if (el) el.addEventListener(ev, fn); }
  on('btn-delete', 'click', deleteSelected);
  on('btn-rotate', 'click', rotateSelected);
  on('btn-clear', 'click', function () {
    if (state.components.length && !confirm('Clear the canvas?')) return;
    clearCanvas();
  });
  on('btn-undo', 'click', doUndo);
  on('btn-redo', 'click', doRedo);
  var animRAF = 0;
  var animStart = 0;
  function animLoop(t) {
    if (!isRunning) { animRAF = 0; return; }
    if (!animStart) animStart = t;
    if (circuitDirty || !sim) { runSolve(); circuitDirty = false; }
    draw();
    animRAF = requestAnimationFrame(animLoop);
  }
  function startSim() {
    // Pre-flight fault check: short circuits, dangling sources, no-battery
    var f = checkFaults();
    if (f) {
      showFaults(f);
      // Keep redraw loop alive so the red flash animates
      if (!animRAF) animRAF = requestAnimationFrame(function flash(){
        if (!faults) { animRAF = 0; return; }
        scheduleDraw();
        animRAF = requestAnimationFrame(flash);
      });
      return; // do NOT enter simulation
    }
    clearFaults();
    // Run the solver once up-front so we can check whether current actually flows.
    runSolve();
    if (pendingFuseFault) {
      sim = null;
      showFaults(pendingFuseFault);
      if (!animRAF) animRAF = requestAnimationFrame(function flash(){
        if (!faults) { animRAF = 0; return; }
        scheduleDraw();
        animRAF = requestAnimationFrame(flash);
      });
      return;
    }
    var f2 = checkPostSolveFaults(sim);
    if (f2) {
      sim = null; // don't show stale 0-current readings
      showFaults(f2);
      if (!animRAF) animRAF = requestAnimationFrame(function flash(){
        if (!faults) { animRAF = 0; return; }
        scheduleDraw();
        animRAF = requestAnimationFrame(flash);
      });
      return;
    }
    isRunning = true;
    document.getElementById('btn-run').style.display = 'none';
    document.getElementById('btn-stop').style.display = '';
    document.getElementById('sim-readouts').style.display = '';
    animStart = 0;
    try { sfx.start(); } catch(e){}
    if (!animRAF) animRAF = requestAnimationFrame(animLoop);
  }
  function stopSim() {
    isRunning = false;
    sim = null;
    document.getElementById('btn-run').style.display = '';
    document.getElementById('btn-stop').style.display = 'none';
    document.getElementById('sim-readouts').style.display = 'none';
    updateReadouts();
    try { sfx.stop(); } catch(e){}
    if (animRAF) { cancelAnimationFrame(animRAF); animRAF = 0; }
    scheduleDraw();
  }
  on('btn-run', 'click', startSim);
  on('btn-stop', 'click', stopSim);

  /* ── Zoom / pan toolbar ─────────────────────────────────── */
  function zoomAt(factor, cx, cy) {
    cx = cx == null ? cssW/2 : cx;
    cy = cy == null ? cssH/2 : cy;
    var wx = toWX(cx), wy = toWY(cy);
    viewScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, viewScale * factor));
    viewOffX = cx/viewScale - wx;
    viewOffY = cy/viewScale - wy;
    scheduleDraw();
  }
  on('btn-zoom-in', 'click', function () { zoomAt(1.2); });
  on('btn-zoom-out', 'click', function () { zoomAt(1/1.2); });
  on('btn-zoom-reset', 'click', function () { viewScale = 1; viewOffX = 0; viewOffY = 0; scheduleDraw(); });
  on('btn-zoom-fit', 'click', fitAll);
  on('btn-pan-toggle', 'click', function () {
    tool = tool === 'pan' ? 'move' : 'pan';
    document.getElementById('btn-pan-toggle').classList.toggle('active', tool === 'pan');
    canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';
  });

  function fitAll() {
    if (!state.components.length) { viewScale=1; viewOffX=0; viewOffY=0; scheduleDraw(); return; }
    var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    state.components.forEach(function(c){
      var b = compBounds(c);
      if (b.x<minX) minX=b.x; if (b.y<minY) minY=b.y;
      if (b.x+b.w>maxX) maxX=b.x+b.w; if (b.y+b.h>maxY) maxY=b.y+b.h;
    });
    var pad = 40;
    var w = (maxX-minX)+pad*2, h = (maxY-minY)+pad*2;
    var s = Math.min(cssW/w, cssH/h, MAX_SCALE);
    viewScale = Math.max(MIN_SCALE, s);
    viewOffX = (cssW/viewScale - (minX+maxX))/2;
    viewOffY = (cssH/viewScale - (minY+maxY))/2;
    scheduleDraw();
  }

  /* ── Keyboard ────────────────────────────────────────────── */
  var spaceHeld = false;
  window.addEventListener('keydown', function (ev) {
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA') return;
    if (ev.code === 'Space') { spaceHeld = true; ev.preventDefault(); }
    if (ev.key === 'Delete' || ev.key === 'Backspace') {
      if (annSel) { deleteSelectedAnn(); ev.preventDefault(); }
      else if (selectedId != null || selectedConnId != null || selectedShape != null) {
        deleteSelected(); ev.preventDefault();
      }
    }
    if (ev.key === 'r' || ev.key === 'R') rotateSelected();
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
      if (ev.shiftKey) doRedo(); else doUndo();
      ev.preventDefault();
    }
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === '=' || ev.key === '+')) { zoomAt(1.2); ev.preventDefault(); }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === '-') { zoomAt(1/1.2); ev.preventDefault(); }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === '0') { viewScale=1; viewOffX=0; viewOffY=0; scheduleDraw(); ev.preventDefault(); }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === '1') { fitAll(); ev.preventDefault(); }
    if (ev.key === 'h' || ev.key === 'H') {
      tool = tool === 'pan' ? 'move' : 'pan';
      document.getElementById('btn-pan-toggle').classList.toggle('active', tool === 'pan');
      canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';
    }
    if (ev.key === 'Escape') {
      if (pendingWire) { pendingWire = null; }
      selectedId = null; selectedConnId = null;
      renderProps(); scheduleDraw();
    }
  });
  window.addEventListener('keyup', function (ev) {
    if (ev.code === 'Space') spaceHeld = false;
  });

  /* ── Hint banner dismiss ─────────────────────────────────── */
  if (hintDismissBtn) hintDismissBtn.addEventListener('click', function () { hintBanner.style.display = 'none'; });

  /* ── Mode switching (stub — Explore/Practice/Quiz in slice 5) ─ */
  var modeTabs = document.getElementById('mode-tabs');
  if (modeTabs) {
    modeTabs.addEventListener('click', function (ev) {
      var b = ev.target.closest('.pill');
      if (!b) return;
      modeTabs.querySelectorAll('.pill').forEach(function(p){ p.classList.toggle('active', p===b); });
      currentMode = b.getAttribute('data-mode');
      applyMode();
    });
  }
  function applyMode() {
    var show = function(id, v){ var e=document.getElementById(id); if(e) e.style.display=v?'':'none'; };
    show('sim-panel', currentMode === 'simulate');
    show('cat-row', currentMode === 'explore');
    show('item-selector', currentMode === 'explore');
    show('item-info', currentMode === 'explore');
    show('practice-panel', currentMode === 'practice');
    show('practice-bar', currentMode === 'practice');
    show('quiz-panel', currentMode === 'quiz');
    show('calc-panel', currentMode === 'calculate');
    show('quiz-bar', currentMode === 'quiz');
    var qr = document.getElementById('quiz-result');
    if (qr) qr.style.display = 'none';
    if (currentMode === 'explore') { buildConceptGrid(); }
    if (currentMode === 'practice') { newPracticeProblem(); }
    if (currentMode === 'quiz') { startQuiz(); }
  }

  /* ── Context menus ──────────────────────────────────────── */
  var ctxConnMenu = document.getElementById('ctx-conn-menu');
  var ctxCompMenu = document.getElementById('ctx-menu');
  var ctxCanvasMenu = document.getElementById('ctx-canvas-menu');

  function hideCtxMenus() {
    if (ctxConnMenu) ctxConnMenu.style.display = 'none';
    if (ctxCompMenu) ctxCompMenu.style.display = 'none';
    if (ctxCanvasMenu) ctxCanvasMenu.style.display = 'none';
  }
  document.addEventListener('click', function(ev){
    if (!ev.target.closest('#ctx-conn-menu,#ctx-menu,#ctx-canvas-menu')) hideCtxMenus();
  });

  // Position a context menu at (x, y) but clamp to the viewport so edge clicks
  // never leave the menu half-off-screen. Measures the menu after making it visible.
  function placeCtxMenu(menu, x, y) {
    menu.style.display = 'block';
    menu.style.left = '0px'; menu.style.top = '0px';      // reset before measuring
    var rect = menu.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    var px = Math.min(x, vw - rect.width  - 8);
    var py = Math.min(y, vh - rect.height - 8);
    if (px < 8) px = 8;
    if (py < 8) py = 8;
    menu.style.left = px + 'px';
    menu.style.top  = py + 'px';
  }

  canvas.addEventListener('contextmenu', function (ev) {
    ev.preventDefault();
    hideCtxMenus();
    var p = screenToWorldFromEvent(ev);
    var conn = hitConnection(p.x, p.y);
    if (conn) {
      selectedConnId = conn.id; selectedId = null;
      placeCtxMenu(ctxConnMenu, ev.clientX, ev.clientY);
      scheduleDraw();
      return;
    }
    var c = hitComponent(p.x, p.y);
    if (c) {
      selectedId = c.id; selectedConnId = null;
      // show toggle only for switches — set visibility BEFORE measuring so the
      // clamped height accounts for the visible rows.
      var tog = document.getElementById('ctx-toggle');
      if (tog) {
        var togFor = (c.type === 'switch' || c.type === 'pushbutton') ? 'toggle'
                   : (c.type === 'fuse' ? 'fuse' : null);
        tog.style.display = togFor ? '' : 'none';
        if (togFor === 'fuse') tog.innerHTML = '\u26a1 Replace Fuse';
        else if (togFor === 'toggle') tog.innerHTML = '\u2699 Toggle State';
      }
      placeCtxMenu(ctxCompMenu, ev.clientX, ev.clientY);
      renderProps();
      scheduleDraw();
      return;
    }
    // empty canvas
    placeCtxMenu(ctxCanvasMenu, ev.clientX, ev.clientY);
  });

  on('ctx-conn-delete', 'click', function(){ hideCtxMenus(); deleteSelected(); });
  on('ctx-conn-clear-wp', 'click', function(){
    hideCtxMenus();
    var conn = state.connections.find(function(x){return x.id===selectedConnId;});
    if (conn) { saveUndo(); conn.waypoints = []; scheduleDraw(); }
  });
  on('ctx-delete', 'click', function(){ hideCtxMenus(); deleteSelected(); });
  on('ctx-rotate', 'click', function(){ hideCtxMenus(); rotateSelected(); });
  on('ctx-duplicate', 'click', function(){
    hideCtxMenus();
    var c = state.components.find(function(x){return x.id===selectedId;});
    if (!c) return;
    saveUndo();
    var def = COMP_DEFS[c.type];
    var nc = makeComponent(c.type, c.x + 30, c.y + 30);
    for (var k in c.props) nc.props[k] = c.props[k];
    nc.rot = c.rot;
    state.components.push(nc);
    selectedId = nc.id; renderProps(); scheduleDraw();
  });
  on('ctx-toggle', 'click', function(){
    hideCtxMenus();
    var c = state.components.find(function(x){return x.id===selectedId;});
    if (!c) return;
    saveUndo();
    if (c.type === 'fuse') { c.props.blown = false; clearFaults(); markDirty(); }
    else c.props.closed = !c.props.closed;
    try{sfx.click();}catch(e){} renderProps(); scheduleDraw();
  });
  on('ctx-canvas-clear', 'click', function(){ hideCtxMenus(); if (confirm('Clear the canvas?')) clearCanvas(); });

  /* ══════════════════════════════════════════════════════════
     MNA Solver — slice 4
     ══════════════════════════════════════════════════════════ */
  var sim = null;  // last solve result { nets, voltages, compV, compI, compP, totalI, totalP, Veq, Req, dt }

  function portKey(compId, portIdx) { return compId + ':' + portIdx; }

  /* ── Fault detection (short circuits, dangling sources) ── */
  var faults = null; // { wireIds:{id:true}, compIds:{id:true}, messages:[] }

  function checkFaults() {
    var parent = {};
    function find(k) { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; }
    function union(a,b){ a=find(a); b=find(b); if (a!==b) parent[a]=b; }
    state.components.forEach(function (c) {
      var def = COMP_DEFS[c.type];
      for (var i = 0; i < def.ports.length; i++) parent[portKey(c.id,i)] = portKey(c.id,i);
    });
    state.connections.forEach(function (conn) {
      union(portKey(conn.from.compId, conn.from.portIdx), portKey(conn.to.compId, conn.to.portIdx));
    });
    state.components.forEach(function (c) {
      if (c.type === 'junction' || c.type === 'junction4') {
        var def = COMP_DEFS[c.type];
        for (var i = 1; i < def.ports.length; i++) union(portKey(c.id,0), portKey(c.id,i));
      }
    });

    var wireIds = {}, compIds = {}, msgs = [];
    var batteries = state.components.filter(function (c) { return c.type === 'battery'; });

    if (batteries.length === 0) {
      msgs.push('⚠ No battery in the circuit — add a voltage source to run a simulation.');
    }

    // Short circuit: battery + and − on the same wire-only net
    batteries.forEach(function (b) {
      if (find(portKey(b.id,0)) === find(portKey(b.id,1))) {
        compIds[b.id] = true;
        msgs.push('⚠ Short circuit across battery #' + b.id + ' (' + (b.props.V||0) + 'V) — + and − terminals share the same node with no resistance between them.');
        var sn = find(portKey(b.id,0));
        state.connections.forEach(function (conn) {
          if (find(portKey(conn.from.compId, conn.from.portIdx)) === sn ||
              find(portKey(conn.to.compId, conn.to.portIdx)) === sn) {
            wireIds[conn.id] = true;
          }
        });
        // include any junction / passthrough on that net
        state.components.forEach(function (cc) {
          if (cc.type === 'junction' || cc.type === 'junction4') {
            if (find(portKey(cc.id,0)) === sn) compIds[cc.id] = true;
          }
        });
      }
    });

    // Disconnected battery: at least one terminal has no wire to anything else
    batteries.forEach(function (b) {
      var p0 = find(portKey(b.id,0)), p1 = find(portKey(b.id,1));
      var p0Conn = false, p1Conn = false;
      state.connections.forEach(function (conn) {
        var fk = find(portKey(conn.from.compId, conn.from.portIdx));
        var tk = find(portKey(conn.to.compId, conn.to.portIdx));
        if (fk === p0 || tk === p0) p0Conn = true;
        if (fk === p1 || tk === p1) p1Conn = true;
      });
      if (!p0Conn || !p1Conn) {
        compIds[b.id] = true;
        msgs.push('⚠ Battery #' + b.id + ' is not fully wired — both + and − terminals must connect into the circuit.');
      }
    });

    // Conflicting batteries in parallel: two batteries whose (+ , −) terminals
    // share the same wire-only nets but with DIFFERENT voltages → KVL violation.
    // The MNA matrix becomes singular and the solver returns nothing useful.
    for (var bi = 0; bi < batteries.length; bi++) {
      for (var bj = bi + 1; bj < batteries.length; bj++) {
        var b1 = batteries[bi], b2 = batteries[bj];
        var b1p = find(portKey(b1.id, 0)), b1n = find(portKey(b1.id, 1));
        var b2p = find(portKey(b2.id, 0)), b2n = find(portKey(b2.id, 1));
        var sameOrient = (b1p === b2p && b1n === b2n);
        var oppOrient  = (b1p === b2n && b1n === b2p);
        if (sameOrient || oppOrient) {
          var v1 = b1.props.V || 0, v2 = b2.props.V || 0;
          var effective = oppOrient ? -v2 : v2;
          if (Math.abs(v1 - effective) > 1e-6) {
            compIds[b1.id] = true; compIds[b2.id] = true;
            msgs.push('⚠ Battery #' + b1.id + ' (' + v1 + 'V) and #' + b2.id +
              ' (' + v2 + 'V) are wired in parallel with conflicting voltages — KVL violation. Add a resistor between them or match their voltages.');
          }
        }
      }
    }

    // Ammeter shorting a real load: an ideal ammeter (≈0 Ω) wired in parallel
    // with a resistor/lamp/etc. silently bypasses it — the load drops to ~0 V
    // and almost all current goes through the meter. Catch this topology.
    var ammeters = state.components.filter(function (c) { return c.type === 'ammeter'; });
    var loadTypes = ['resistor','rheostat','lamp','fan','buzzer','heater','led'];
    ammeters.forEach(function (a) {
      var an0 = find(portKey(a.id, 0)), an1 = find(portKey(a.id, 1));
      if (an0 === an1) return; // self-shorted ammeter handled elsewhere
      state.components.forEach(function (cc) {
        if (loadTypes.indexOf(cc.type) < 0) return;
        var cn0 = find(portKey(cc.id, 0)), cn1 = find(portKey(cc.id, 1));
        if ((cn0 === an0 && cn1 === an1) || (cn0 === an1 && cn1 === an0)) {
          compIds[a.id] = true; compIds[cc.id] = true;
          msgs.push('⚠ Ammeter #' + a.id + ' is wired in parallel with ' + cc.type +
            ' #' + cc.id + ' — an ammeter is nearly 0 Ω and will short-circuit it. Place ammeters in SERIES with the load, not across it.');
        }
      });
    });

    // Duplicate wires between the same two ports: stamps add twice, halving the
    // effective resistance of any branch that runs between them.
    var seenPairs = {};
    state.connections.forEach(function (conn) {
      var a = conn.from.compId + ':' + conn.from.portIdx;
      var b = conn.to.compId   + ':' + conn.to.portIdx;
      var k = a < b ? (a + '|' + b) : (b + '|' + a);
      if (seenPairs[k]) {
        wireIds[conn.id] = true; wireIds[seenPairs[k]] = true;
        msgs.push('⚠ Duplicate wires connect the same two ports — remove the redundant wire to avoid distorted readings.');
      } else {
        seenPairs[k] = conn.id;
      }
    });

    if (msgs.length === 0) return null;
    return { wireIds: wireIds, compIds: compIds, messages: msgs };
  }

  // Post-solve check: if the solver found no current path (or refused to converge),
  // the user has an open loop, a voltmeter blocking the only return path, an open
  // switch in series, or similar wiring problem the topology check can't see.
  function checkPostSolveFaults(s) {
    var batteries = state.components.filter(function (c) { return c.type === 'battery'; });
    if (batteries.length === 0) return null;
    var liveBatts = batteries.filter(function (b) { return Math.abs(b.props.V || 0) > 1e-9; });
    if (liveBatts.length === 0) return null;

    var wireIds = {}, compIds = {}, msgs = [];

    if (!s) {
      liveBatts.forEach(function (b) { compIds[b.id] = true; });
      msgs.push('⚠ Solver could not produce a result — likely a hard short across an ideal voltage source or a singular configuration. Re-check wiring.');
    } else {
      // Three complementary "no useful current" detectors:
      //   (a) totalI below 1 nA — dead loop or numerical noise. (Threshold
      //       lowered from 1 µA so legit 1 V / 1 MΩ ≈ 1 µA still passes.)
      //   (b) A VOLTMETER is carrying the loop current — it sits in series with
      //       the load, not across it. The voltmeter's near-infinite R then
      //       collapses the loop current to nanoamps. Detect by checking whether
      //       any voltmeter's compI is ≥ 50% of totalI (only true when the
      //       voltmeter is on the main current path, not in parallel).
      //   (c) ALL real-load branches are starved (carry < 1% of totalI) AND
      //       totalI is below 1 µA — defensive fallback.
      var realLoadTypes = ['resistor','rheostat','lamp','fan','buzzer','heater','led'];
      var maxLoadI = 0, maxVmI = 0;
      if (s.compI) {
        state.components.forEach(function (c) {
          var i = s.compI[c.id] || 0;
          if (realLoadTypes.indexOf(c.type) >= 0 && i > maxLoadI) maxLoadI = i;
          if (c.type === 'voltmeter' && i > maxVmI) maxVmI = i;
        });
      }
      var totI = Math.abs(s.totalI || 0);
      var deadCurrent      = !isFinite(s.totalI) || totI < 1e-9;
      var voltmeterInLoop  = !deadCurrent && totI < 1e-6 && maxVmI >= 0.5 * totI;
      var loadStarved      = !deadCurrent && totI < 1e-6 && maxLoadI < 0.01 * totI;
      if (!deadCurrent && !voltmeterInLoop && !loadStarved) return null;
      // No current is flowing anywhere despite a live battery → open loop or
      // voltmeter-only return path. Highlight the battery + every wire touching its nets
      // so the user can spot where the current path breaks.
      liveBatts.forEach(function (b) {
        compIds[b.id] = true;
        var nA = s.netOf ? s.netOf(b.id, 0) : null;
        var nB = s.netOf ? s.netOf(b.id, 1) : null;
        state.connections.forEach(function (conn) {
          var fn = s.netOf ? s.netOf(conn.from.compId, conn.from.portIdx) : null;
          var tn = s.netOf ? s.netOf(conn.to.compId,   conn.to.portIdx)   : null;
          if (fn === nA || fn === nB || tn === nA || tn === nB) wireIds[conn.id] = true;
        });
      });
      // Look for a likely culprit to mention by name
      var hasVm = state.components.some(function (c) { return c.type === 'voltmeter'; });
      var hasOpenSwitch = state.components.some(function (c) {
        return (c.type === 'switch' || c.type === 'pushbutton') && !c.props.closed;
      });
      var hasBlownFuse = state.components.some(function (c) { return c.type === 'fuse' && c.props.blown; });
      var hint = hasBlownFuse ? ' A blown fuse is an open circuit — right-click it and choose Replace Fuse, then lower the current before running again.' :
                 hasVm ? ' A voltmeter has near-infinite resistance — it cannot be the only return path; it must sit in parallel across what it measures.' :
                 hasOpenSwitch ? ' An open switch breaks the loop — close it or remove it from the main current path.' :
                 ' Check that every component has a complete loop back to the battery without gaps.';
      msgs.push('⚠ No current flowing — the circuit has no closed conductive loop.' + hint);
    }

    if (msgs.length === 0) return null;
    return { wireIds: wireIds, compIds: compIds, messages: msgs };
  }

  function clearFaults() {
    if (!faults) return;
    faults = null;
    var bn = document.getElementById('fault-banner');
    if (bn) bn.style.display = 'none';
    scheduleDraw();
  }
  function showFaults(f) {
    faults = f;
    try { if (typeof sfx !== 'undefined' && sfx) sfx.fault(); } catch(e){}
    // Build / show banner
    var bn = document.getElementById('fault-banner');
    if (!bn) {
      bn = document.createElement('div');
      bn.id = 'fault-banner';
      bn.className = 'fault-banner';
      bn.innerHTML = '<div class="fb-text"></div><button class="fb-close" type="button" aria-label="Dismiss">&times;</button>';
      if (canvasCard) canvasCard.appendChild(bn);
      bn.querySelector('.fb-close').addEventListener('click', clearFaults);
    }
    bn.querySelector('.fb-text').innerHTML = f.messages.map(function (m) {
      return '<div>' + m.replace(/[<>&]/g, function(ch){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[ch];}) + '</div>';
    }).join('');
    bn.style.display = 'block';
    // Keep scheduleDraw running for the flash
    scheduleDraw();
  }
  // Flash pulse 0..1 derived from time
  function faultPulse() { return 0.5 + 0.5 * Math.sin(performance.now() / 180); }

  function solve() {
    // Build union-find over all (compId, portIdx) nodes, merged by connections.
    var parent = {};
    function find(k) { while (parent[k] !== k) { parent[k] = parent[parent[k]]; k = parent[k]; } return k; }
    function union(a,b){ a = find(a); b = find(b); if (a!==b) parent[a]=b; }
    state.components.forEach(function (c) {
      var def = COMP_DEFS[c.type];
      for (var i = 0; i < def.ports.length; i++) {
        var k = portKey(c.id, i);
        parent[k] = k;
      }
    });
    state.connections.forEach(function (conn) {
      union(portKey(conn.from.compId, conn.from.portIdx), portKey(conn.to.compId, conn.to.portIdx));
    });
    // Junction components merge their own ports
    state.components.forEach(function (c) {
      if (c.type === 'junction' || c.type === 'junction4') {
        var def = COMP_DEFS[c.type];
        for (var i = 1; i < def.ports.length; i++) {
          union(portKey(c.id, 0), portKey(c.id, i));
        }
      }
    });

    // Assign net ids
    var netIdMap = {}, nets = [];
    Object.keys(parent).forEach(function (k) {
      var r = find(k);
      if (netIdMap[r] == null) { netIdMap[r] = nets.length; nets.push(r); }
    });
    var N = nets.length;
    function netOf(compId, portIdx) { return netIdMap[find(portKey(compId, portIdx))]; }

    // Choose ground
    var groundNet = -1;
    for (var i = 0; i < state.components.length; i++) {
      if (state.components[i].type === 'ground') { groundNet = netOf(state.components[i].id, 0); break; }
    }
    if (groundNet < 0) {
      // use battery '-' terminal of first battery
      for (var j = 0; j < state.components.length; j++) {
        if (state.components[j].type === 'battery') { groundNet = netOf(state.components[j].id, 1); break; }
      }
    }
    if (groundNet < 0) return null;

    // Collect voltage sources (batteries). Deduplicate identical parallel
    // batteries — two batteries on the same (+ , −) net pair with the same V add
    // a redundant equation row to the MNA matrix, making it singular. The
    // pre-flight `checkFaults` already rejects CONFLICTING parallel batteries; here
    // we silently merge IDENTICAL ones (skipping all but the first), which is the
    // physically correct equivalent. Their displayed currents will be split among
    // the originals after solve via per-source bookkeeping below.
    var vSources = [];
    var vSeenKeys = {};
    var vAliases = {};   // batteryId → primary batteryId (for current attribution)
    state.components.forEach(function (c) {
      if (c.type !== 'battery') return;
      var nplus = netOf(c.id, 0), nmin = netOf(c.id, 1);
      var V = c.props.V || 0;
      // A cell with internal resistance is NOT a bare voltage source: two such
      // cells in parallel each drop I·r independently, so the matrix stays
      // non-singular and both must be stamped. Only ideal (r = 0) cells need
      // the dedup below.
      if ((+c.props.r || 0) > 1e-9) { vSources.push(c); return; }
      // Normalize key so that opposite-orientation duplicates also collapse only
      // if the resulting V matches (orientation flips sign).
      var fwdKey = nplus + '|' + nmin + '|' + V.toFixed(9);
      var revKey = nmin + '|' + nplus + '|' + (-V).toFixed(9);
      if (vSeenKeys[fwdKey] != null) {
        vAliases[c.id] = vSources[vSeenKeys[fwdKey]].id;
      } else if (vSeenKeys[revKey] != null) {
        vAliases[c.id] = vSources[vSeenKeys[revKey]].id;
      } else {
        vSeenKeys[fwdKey] = vSources.length;
        vSources.push(c);
      }
    });
    if (!vSources.length) return null;
    var M = vSources.length;

    // Internal nodes for cells with internal resistance. A real cell is an ideal
    // EMF in series with r, which nodal analysis cannot express without an extra
    // node: the EMF sits between internal node X and the '−' port net, and r
    // sits between X and the '+' port net. Terminal voltage then falls out of
    // the solution directly as E − I·r.
    var battIntNet = {};
    var NT = N;
    vSources.forEach(function (v) {
      if ((+v.props.r || 0) > 1e-9) battIntNet[v.id] = NT++;
    });

    // Size of system: (NT-1) + M. Map non-ground nets → 0..NT-2
    var netIdx = new Array(NT);
    var idx = 0;
    for (var n = 0; n < NT; n++) netIdx[n] = (n === groundNet ? -1 : idx++);
    var SIZE = (NT - 1) + M;
    if (SIZE <= 0) return null;

    // Allocate A, b
    var A = [];
    for (var r = 0; r < SIZE; r++) { var row = new Array(SIZE); for (var c2 = 0; c2 < SIZE; c2++) row[c2] = 0; A.push(row); }
    var B = new Array(SIZE); for (var z = 0; z < SIZE; z++) B[z] = 0;

    function stampG(na, nb, g) {
      var ia = netIdx[na], ib = netIdx[nb];
      if (ia >= 0) A[ia][ia] += g;
      if (ib >= 0) A[ib][ib] += g;
      if (ia >= 0 && ib >= 0) { A[ia][ib] -= g; A[ib][ia] -= g; }
    }

    function resistanceOf(c) {
      if (c.type === 'resistor' || c.type === 'rheostat' || c.type === 'lamp' ||
          c.type === 'fan' || c.type === 'buzzer' || c.type === 'heater') return Math.max(0.01, c.props.R);
      if (c.type === 'led') return Math.max(5, c.props.R); // simplified linear
      if (c.type === 'ammeter') return 0.001;
      if (c.type === 'voltmeter') return 1e9;
      if (c.type === 'switch' || c.type === 'pushbutton') return c.props.closed ? 0.001 : null;
      if (c.type === 'fuse') return c.props.blown ? null : 0.01;
      return null; // non-branch (ground, junction, battery)
    }

    var branches = []; // {comp, na, nb, R}
    state.components.forEach(function (c) {
      var R = resistanceOf(c);
      if (R == null) return;
      branches.push({ comp: c, na: netOf(c.id, 0), nb: netOf(c.id, 1), R: R });
    });
    branches.forEach(function (b) { stampG(b.na, b.nb, 1/b.R); });

    // Voltage source stamping
    vSources.forEach(function (v, k) {
      var nplus = netOf(v.id, 0), nmin = netOf(v.id, 1);
      if (battIntNet[v.id] != null) {
        stampG(battIntNet[v.id], nplus, 1 / Math.max(1e-6, +v.props.r));
        nplus = battIntNet[v.id];   // the EMF now sits behind r
      }
      var mRow = (NT - 1) + k;
      var ip = netIdx[nplus], im = netIdx[nmin];
      if (ip >= 0) { A[mRow][ip] = 1; A[ip][mRow] = 1; }
      if (im >= 0) { A[mRow][im] = -1; A[im][mRow] = -1; }
      B[mRow] = v.props.V;
    });

    // Solve Ax=B via Gaussian elimination with partial pivoting
    for (var p = 0; p < SIZE; p++) {
      var maxA = Math.abs(A[p][p]); var piv = p;
      for (var pp = p+1; pp < SIZE; pp++) {
        if (Math.abs(A[pp][p]) > maxA) { maxA = Math.abs(A[pp][p]); piv = pp; }
      }
      // Pivot threshold raised from 1e-12 to 1e-9. With 1e9 Ω voltmeters and 1e-3 Ω
      // ammeters the conductance spread is 1e12; a pivot just above 1e-12 still
      // produces catastrophic cancellation downstream. 1e-9 is a safer floor — any
      // physically valid configuration produces pivots well above it.
      if (!isFinite(maxA) || maxA < 1e-9) return null;
      if (piv !== p) { var tmp = A[p]; A[p] = A[piv]; A[piv] = tmp; var tb = B[p]; B[p] = B[piv]; B[piv] = tb; }
      for (var rr = p+1; rr < SIZE; rr++) {
        var f = A[rr][p] / A[p][p];
        if (f !== 0) {
          for (var cc = p; cc < SIZE; cc++) A[rr][cc] -= f * A[p][cc];
          B[rr] -= f * B[p];
        }
      }
    }
    var x = new Array(SIZE);
    for (var bk = SIZE-1; bk >= 0; bk--) {
      var s2 = B[bk];
      for (var ck = bk+1; ck < SIZE; ck++) s2 -= A[bk][ck] * x[ck];
      var denom = A[bk][bk];
      if (!isFinite(denom) || Math.abs(denom) < 1e-15) return null;
      x[bk] = s2 / denom;
      if (!isFinite(x[bk])) return null;          // catch ±Infinity / NaN early
    }

    // Extract voltages
    var voltages = new Array(NT);
    for (var nn = 0; nn < NT; nn++) voltages[nn] = (nn === groundNet) ? 0 : x[netIdx[nn]];
    var compV = {}, compI = {}, compP = {}, compCurrentDir = {};
    // portI[compId][portIdx] = signed current INTO the component at that port from the wire
    var portI = {};
    state.components.forEach(function (c) {
      var def = COMP_DEFS[c.type];
      portI[c.id] = new Array(def.ports.length);
      for (var pi = 0; pi < def.ports.length; pi++) portI[c.id][pi] = 0;
    });
    branches.forEach(function (b) {
      var v = voltages[b.na] - voltages[b.nb];
      var i = v / b.R; // flows from port 0 → port 1 internally when positive
      compV[b.comp.id] = Math.abs(v);
      compI[b.comp.id] = Math.abs(i);
      compP[b.comp.id] = Math.abs(v*i);
      compCurrentDir[b.comp.id] = i; // signed
      // KCL at the component: positive i enters at port 0, exits at port 1
      portI[b.comp.id][0] = i;
      portI[b.comp.id][1] = -i;
    });
    // ib (per MNA stamping) = current INTO the + terminal of a source from the
    // external network — negative when the source delivers power.
    //
    // Reporting strategy:
    //   • totalP = |Σ V·ib|  — by energy conservation this equals the total power
    //     dissipated by all loads, and is correct in EVERY topology (parallel,
    //     series-aiding, series-opposing, mixed).
    //   • totalI = max(|ib|) — the "loop current" is well-defined per source.
    //     • single battery: equals |ib| of that battery (correct).
    //     • series-aiding/opposing: every source carries the same |ib| (the loop
    //       current); max picks it correctly without double-counting.
    //     • parallel-aiding (identical sources): max picks one share. The deduper
    //       below prevents this case from reaching us at all.
    //   The previous Σ|ib| formula inflated multi-source totals; the intermediate
    //   |Σ ib| formula cancelled series-opposing currents to zero.
    var maxIbAbs = 0, pNetDelivered = 0, pIntLoss = 0, anyRint = false;
    var battTerm = {};                     // batteryId → { emf, vterm, lost, r }
    vSources.forEach(function (v, k) {
      var ib = x[(NT - 1) + k];
      var rInt = +v.props.r || 0;
      // Terminal voltage is measured across the PORTS, so it already has I·r
      // subtracted; with r = 0 it reduces exactly to the EMF.
      var vterm = voltages[netOf(v.id, 0)] - voltages[netOf(v.id, 1)];
      if (rInt > 1e-9) anyRint = true;
      battTerm[v.id] = { emf: v.props.V, vterm: vterm, lost: v.props.V - vterm, r: rInt };
      compV[v.id] = Math.abs(vterm);
      compI[v.id] = Math.abs(ib);
      compP[v.id] = Math.abs(vterm * ib);  // power delivered to the EXTERNAL circuit
      compCurrentDir[v.id] = -ib;          // positive = this source is delivering external current
      portI[v.id][0] = ib;                 // negative → current leaves at +
      portI[v.id][1] = -ib;
      if (Math.abs(ib) > maxIbAbs) maxIbAbs = Math.abs(ib);
      pNetDelivered += -vterm * ib;
      pIntLoss += ib * ib * rInt;
    });
    // Mirror the primary's readings onto any deduped-alias batteries so the UI
    // can still display current/voltage for the visually-present extra source.
    // Each alias is shown carrying an EQUAL share of the primary's current
    // (physically what would happen with two ideal sources in parallel).
    Object.keys(vAliases).forEach(function (aliasIdStr) {
      var aliasId = +aliasIdStr;
      var primaryId = vAliases[aliasIdStr];
      var groupSize = 1;
      Object.keys(vAliases).forEach(function (k) { if (vAliases[k] === primaryId) groupSize++; });
      var scale = 1 / groupSize;
      compV[aliasId] = compV[primaryId];
      if (battTerm[primaryId]) battTerm[aliasId] = battTerm[primaryId];
      compI[aliasId] = (compI[primaryId] || 0) * scale;
      compP[aliasId] = (compP[primaryId] || 0) * scale;
      compCurrentDir[aliasId] = (compCurrentDir[primaryId] || 0) * scale;
      var pportI = portI[primaryId];
      if (pportI) {
        portI[aliasId] = portI[aliasId] || [0, 0];
        portI[aliasId][0] = pportI[0] * scale;
        portI[aliasId][1] = pportI[1] * scale;
      }
      // Also rescale the primary's displayed (per-source) current to its share
      compI[primaryId] *= scale;
      compP[primaryId] *= scale;
      if (pportI) { pportI[0] *= scale; pportI[1] *= scale; }
    });
    var totalI = maxIbAbs;
    var totalP = Math.abs(pNetDelivered);

    // Junction current distribution: junctions short all their ports to one net.
    // Their per-port current is determined by KCL — but for animation, we treat
    // each wire incident on a junction as carrying the current of its NON-junction endpoint.
    // (Branch–to–junction wires get full direction info; junction-to-junction wires fall back to net potential gradient.)

    var Veq = vSources[0].props.V;
    // Req is what the source "sees" outside its own terminals, so it is derived
    // from the terminal voltage — with r = 0 that is the EMF and nothing changes.
    var Vterm0 = battTerm[vSources[0].id] ? battTerm[vSources[0].id].vterm : Veq;
    var Req = totalI > 1e-9 ? Math.abs(Vterm0) / totalI : Infinity;

    return {
      N: N, NT: NT, nets: nets, voltages: voltages, groundNet: groundNet,
      battTerm: battTerm, anyRint: anyRint, pIntLoss: pIntLoss, Vterm: Vterm0,
      compV: compV, compI: compI, compP: compP, compCurrentDir: compCurrentDir,
      portI: portI,
      totalI: totalI, totalP: totalP, Veq: Veq, Req: Req,
      netOf: netOf
    };
  }

  // Branch-bearing component types — their per-port currents are well defined.
  var BRANCH_TYPES = ['resistor','rheostat','lamp','fan','buzzer','heater','led','ammeter','voltmeter','battery','switch','pushbutton','fuse'];
  function isBranchComp(c) { return c && BRANCH_TYPES.indexOf(c.type) >= 0; }

  // Signed wire current for an existing connection. Positive → flows from .from → .to.
  // ALWAYS uses BFS through the net graph: shortcut "use the branch endpoint directly"
  // is wrong when the same port net is shared by multiple wires (fan-out at a port).
  // BFS sums branch-port currents reachable on the from-side without crossing the
  // target wire — by KCL this uniquely identifies the wire current regardless of fan-out.
  function wireSignedCurrent(conn) {
    if (!sim || !sim.portI) return 0;
    return netSliceCurrent(conn);
  }

  // Cached per-solve adjacency for net-graph BFS.
  var _adjCache = null, _adjCacheKey = 0;
  function buildAdj() {
    var key = function(c,p){ return c+'|'+p; };
    var adj = {};
    function addEdge(a, b, id) { (adj[a] = adj[a] || []).push({ id:id, other:b }); }
    state.connections.forEach(function (cn) {
      var a = key(cn.from.compId, cn.from.portIdx);
      var b = key(cn.to.compId, cn.to.portIdx);
      addEdge(a, b, cn.id); addEdge(b, a, cn.id);
    });
    state.components.forEach(function (c) {
      if (c.type === 'junction' || c.type === 'junction4') {
        var def = COMP_DEFS[c.type];
        for (var i = 1; i < def.ports.length; i++) {
          var sId = '__s_' + c.id + '_' + i;
          addEdge(key(c.id, 0), key(c.id, i), sId);
          addEdge(key(c.id, i), key(c.id, 0), sId);
        }
      }
    });
    return adj;
  }
  function getAdj() {
    var sigKey = state.connections.length * 1000 + state.components.length;
    if (!_adjCache || _adjCacheKey !== sigKey) {
      _adjCache = buildAdj();
      _adjCacheKey = sigKey;
    }
    return _adjCache;
  }

  // BFS over the net graph from the from-port of `conn`, skipping `conn` and
  // never crossing into the to-port. Sum of branch-port currents leaving their
  // components on the visited side = current that must cross the wire toward
  // the to-side. KCL guarantees uniqueness even with port fan-out.
  function netSliceCurrent(conn) {
    var key = function(c,p){ return c+'|'+p; };
    var startKey = key(conn.from.compId, conn.from.portIdx);
    var endKey   = key(conn.to.compId,   conn.to.portIdx);
    var skipId   = conn.id;
    var adj = getAdj();
    var visited = {}; visited[startKey] = true; visited[endKey] = true;
    var queue = [startKey];
    var totalI = 0;
    while (queue.length) {
      var k = queue.shift();
      var dot = k.indexOf('|');
      var cid = parseInt(k.substr(0, dot), 10);
      var pidx = parseInt(k.substr(dot+1), 10);
      var c = state.components.find(function(x){ return x.id === cid; });
      if (isBranchComp(c) && sim.portI[cid]) {
        // current LEAVING component into the net = -portI (portI is INTO comp).
        totalI += -sim.portI[cid][pidx];
      }
      var nbrs = adj[k] || [];
      for (var ni = 0; ni < nbrs.length; ni++) {
        var n = nbrs[ni];
        if (n.id === skipId) continue;
        if (!visited[n.other]) { visited[n.other] = true; queue.push(n.other); }
      }
    }
    return totalI;
  }

  // A fuse carrying more than its rating parts the circuit, so the solve has to
  // be repeated on the new topology. Blowing one fuse can push current through
  // another, so this cascades — hence the bounded loop.
  function blowOverloadedFuses() {
    var fuses = state.components.filter(function (c) { return c.type === 'fuse' && !c.props.blown; });
    if (!fuses.length || !sim) return [];
    var justBlown = [];
    for (var pass = 0; pass < 8; pass++) {
      var blewThisPass = false;
      fuses.forEach(function (f) {
        if (f.props.blown) return;
        var rated = Math.abs(+f.props.Irated || 0);
        if (rated <= 0) return;
        var i = Math.abs((sim && sim.compI && sim.compI[f.id]) || 0);
        if (i > rated * 1.0000001) {
          f.props.blown = true;
          justBlown.push({ comp: f, i: i, rated: rated });
          blewThisPass = true;
        }
      });
      if (!blewThisPass) break;
      try { sim = solve(); } catch (e) { sim = null; }
      if (!sim) break;
    }
    return justBlown;
  }

  // Set by runSolve when a fuse parts on this pass, so startSim can report the
  // real cause instead of the generic "no current is flowing" message the now-open
  // circuit would otherwise trigger.
  var pendingFuseFault = null;

  function runSolve() {
    pendingFuseFault = null;
    try { sim = solve(); }
    catch (e) { console.error('Solver error', e); sim = null; }
    var blownNow = blowOverloadedFuses();
    if (blownNow.length) {
      var fCompIds = {}, fMsgs = [];
      blownNow.forEach(function (b) {
        fCompIds[b.comp.id] = true;
        fMsgs.push('\u26a1 Fuse F' + b.comp.id + ' blew \u2014 it carried ' +
          (b.i >= 1 ? b.i.toFixed(2) + ' A' : (b.i * 1000).toFixed(0) + ' mA') +
          ', over its ' + b.rated + ' A rating. Right-click the fuse to replace it.');
      });
      pendingFuseFault = { compIds: fCompIds, wireIds: {}, messages: fMsgs };
      showFaults(pendingFuseFault);
    }
    updateReadouts();
    scheduleDraw();
  }

  function updateReadouts() {
    var rv = document.getElementById('r-v');
    var rit = document.getElementById('r-it');
    var rrt = document.getElementById('r-rt');
    var rp = document.getElementById('r-p');
    var rn = document.getElementById('r-n');
    var rs = document.getElementById('r-status');
    var warn = document.getElementById('warning-bar');
    if (rn) rn.textContent = state.components.length;
    if (!sim) {
      if (rv) rv.textContent = '0.0';
      if (rit) rit.textContent = '0.0';
      if (rrt) rrt.textContent = '—';
      if (rp) rp.textContent = '0.00';
      if (rs) rs.textContent = isRunning ? 'Open' : 'Idle';
      if (warn && isRunning) {
        warn.style.display = '';
        warn.textContent = 'Circuit has no complete path. Add a battery and close the loop.';
      } else if (warn) warn.style.display = 'none';
      return;
    }
    if (warn) warn.style.display = 'none';
    var rcvt = document.getElementById('rc-vt'), rclost = document.getElementById('rc-lost');
    var rvt = document.getElementById('r-vt'), rlost = document.getElementById('r-lost');
    if (rcvt && rclost) {
      var on = !!sim.anyRint;
      rcvt.style.display = on ? '' : 'none';
      rclost.style.display = on ? '' : 'none';
      if (on) {
        if (rvt) rvt.textContent = Math.abs(sim.Vterm).toFixed(2);
        if (rlost) rlost.textContent = Math.abs(sim.Veq - Math.abs(sim.Vterm)).toFixed(2);
      }
    }
    if (rv) rv.textContent = sim.Veq.toFixed(2);
    if (rit) rit.textContent = (sim.totalI*1000).toFixed(1);
    if (rrt) rrt.textContent = isFinite(sim.Req) ? sim.Req.toFixed(1) : '∞';
    if (rp) rp.textContent = sim.totalP.toFixed(3);
    var svLbl = document.getElementById('r-v-label');
    if (svLbl) svLbl.textContent = sim.anyRint ? 'EMF (Source)' : 'Supply Voltage';
    if (rs) rs.textContent = 'Running';
  }

  /* ── Annotation toolbar ────────────────────────────────── */
  // Pencil-tip SVG cursor — same one used by pneumatic-circuit; hotspot near the tip (2,22).
  var PENCIL_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3Cpath d='M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3C/svg%3E\") 2 22, crosshair";
  var markBar = document.getElementById('mark-bar');
  function setTool(t) {
    tool = t;
    markBar.querySelectorAll('.tool-btn').forEach(function (b) {
      if (b.hasAttribute('data-tool')) b.classList.toggle('active', b.getAttribute('data-tool') === t);
    });
    if (t === 'sketch') canvas.style.cursor = PENCIL_CURSOR;
    else if (t === 'shape') canvas.style.cursor = 'crosshair';
    else if (t === 'pan') canvas.style.cursor = 'grab';
    else canvas.style.cursor = 'default';
    hideDropdowns();
  }
  function hideDropdowns() {
    var sd = document.getElementById('sketch-dropdown');
    var shd = document.getElementById('shape-dropdown');
    if (sd) sd.style.display = 'none';
    if (shd) shd.style.display = 'none';
  }
  markBar.querySelectorAll('.tool-btn[data-tool]').forEach(function (b) {
    b.addEventListener('click', function () { setTool(b.getAttribute('data-tool')); });
  });

  // sketch dropdown
  var sketchDrop = document.getElementById('sketch-dropdown');
  var sketchDropToggle = document.getElementById('sketch-drop-toggle');
  if (sketchDropToggle) sketchDropToggle.addEventListener('click', function (ev) {
    ev.stopPropagation();
    hideDropdowns();
    var shown = sketchDrop.style.display === 'block';
    sketchDrop.style.display = shown ? 'none' : 'block';
    var r = sketchDropToggle.getBoundingClientRect();
    sketchDrop.style.left = r.left + 'px';
    sketchDrop.style.top = (r.bottom + 4) + 'px';
  });
  sketchDrop && sketchDrop.querySelectorAll('.swatch').forEach(function (s) {
    s.addEventListener('click', function () {
      sketchColor = s.getAttribute('data-color');
      sketchDrop.querySelectorAll('.swatch').forEach(function(x){x.classList.remove('active');});
      s.classList.add('active');
      document.documentElement.style.setProperty('--sketch-color', sketchColor);
    });
  });
  sketchDrop && sketchDrop.querySelectorAll('.width-btn').forEach(function (w) {
    w.addEventListener('click', function () {
      sketchWidth = parseInt(w.getAttribute('data-width'), 10);
      sketchDrop.querySelectorAll('.width-btn').forEach(function(x){x.classList.remove('active');});
      w.classList.add('active');
    });
  });

  // shape dropdown
  var shapeDrop = document.getElementById('shape-dropdown');
  var shapeDropToggle = document.getElementById('shape-drop-toggle');
  if (shapeDropToggle) shapeDropToggle.addEventListener('click', function (ev) {
    ev.stopPropagation();
    hideDropdowns();
    var shown = shapeDrop.style.display === 'block';
    shapeDrop.style.display = shown ? 'none' : 'block';
    var r = shapeDropToggle.getBoundingClientRect();
    shapeDrop.style.left = r.left + 'px';
    shapeDrop.style.top = (r.bottom + 4) + 'px';
  });
  shapeDrop && shapeDrop.querySelectorAll('.shape-pick').forEach(function (b) {
    b.addEventListener('click', function () {
      shapeType = b.getAttribute('data-shape');
      shapeDrop.querySelectorAll('.shape-pick').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
      var si = document.getElementById('shape-icon'); if (si) si.innerHTML = b.innerHTML;
      // Auto-activate shape tool for single use; closes dropdown via setTool->hideDropdowns
      setTool('shape');
    });
  });
  shapeDrop && shapeDrop.querySelectorAll('.shape-colors .swatch').forEach(function (s) {
    s.addEventListener('click', function () {
      shapeColor = s.getAttribute('data-color');
      shapeDrop.querySelectorAll('.shape-colors .swatch').forEach(function(x){x.classList.remove('active');});
      s.classList.add('active');
      document.documentElement.style.setProperty('--shape-color', shapeColor);
    });
  });
  shapeDrop && shapeDrop.querySelectorAll('.shape-widths .width-btn').forEach(function (w) {
    w.addEventListener('click', function () {
      shapeWidth = parseInt(w.getAttribute('data-width'), 10);
      shapeDrop.querySelectorAll('.shape-widths .width-btn').forEach(function(x){x.classList.remove('active');});
      w.classList.add('active');
    });
  });
  shapeDrop && shapeDrop.querySelectorAll('.fill-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      shapeFilled = b.getAttribute('data-fill') === 'true';
      shapeDrop.querySelectorAll('.fill-btn').forEach(function(x){x.classList.remove('active');});
      b.classList.add('active');
    });
  });

  // close dropdowns on outside click
  document.addEventListener('click', function (ev) {
    if (!ev.target.closest('#sketch-dropdown,#shape-dropdown,#sketch-drop-toggle,#shape-drop-toggle,#sketch-group,#shape-group')) hideDropdowns();
  });

  // clear & toggle annotations
  var clearBtn = document.getElementById('btn-clear-annotations');
  var clearOverlay = document.getElementById('clear-ann-confirm');
  if (clearBtn) clearBtn.addEventListener('click', function () {
    clearOverlay.style.display = 'flex';
  });
  var clearNo = document.getElementById('clear-ann-no');
  var clearYes = document.getElementById('clear-ann-yes');
  var clearCat = document.getElementById('clear-ann-category');
  if (clearNo) clearNo.addEventListener('click', function(){ clearOverlay.style.display = 'none'; });
  if (clearYes) clearYes.addEventListener('click', function () {
    saveUndo();
    var cat = clearCat.value;
    if (cat === 'all' || cat === 'sketches') state.annStrokes = [];
    if (cat === 'all' || cat === 'shapes') state.annShapes = [];
    selectedShape = null;
    clearOverlay.style.display = 'none';
    scheduleDraw();
  });
  var toggleAnnBtn = document.getElementById('btn-toggle-annotations');
  if (toggleAnnBtn) toggleAnnBtn.addEventListener('click', function () {
    annVisible = !annVisible;
    toggleAnnBtn.classList.toggle('active', !annVisible);
    scheduleDraw();
  });

  // X4: Node voltage labels toggle (default OFF)
  var toggleVBtn = document.getElementById('btn-toggle-voltages');
  if (toggleVBtn) toggleVBtn.addEventListener('click', function () {
    showNodeVoltages = !showNodeVoltages;
    toggleVBtn.classList.toggle('active', showNodeVoltages);
    toggleVBtn.setAttribute('aria-pressed', showNodeVoltages ? 'true' : 'false');
    scheduleDraw();
  });

  // initial tool button colors
  document.documentElement.style.setProperty('--sketch-color', sketchColor);
  document.documentElement.style.setProperty('--shape-color', shapeColor);

  /* ── Text label editing ────────────────────────────────── */
  var textInput = document.getElementById('shape-text-input');
  function startTextEdit(wx, wy) {
    if (!textInput) { console.warn('[ohms-law] shape-text-input element missing'); return; }
    saveUndo();
    var sh = { type: 'text', x: wx, y: wy, w: 100, h: 20, color: shapeColor, width: shapeWidth, filled: false, text: '' };
    state.annShapes.push(sh);
    textEditing = state.annShapes.length - 1;
    selectedShape = textEditing;
    textInput.value = '';
    textInput.style.display = 'block';
    // The input is absolutely positioned inside .canvas-card. Add the canvas's
    // own offset within the card (the mark-bar above it pushes the canvas down).
    var cOffX = canvas.offsetLeft || 0, cOffY = canvas.offsetTop || 0;
    textInput.style.left = (cOffX + toSX(wx)) + 'px';
    textInput.style.top  = (cOffY + toSY(wy)) + 'px';
    // Defer focus until after the pointer event chain settles, so the canvas
    // doesn't immediately steal it back and trigger our blur-deletes-empty handler.
    setTimeout(function () { try { textInput.focus(); textInput.select(); } catch (e) {} }, 0);
    scheduleDraw();
  }
  if (textInput) {
    textInput.addEventListener('input', function(){
      if (textEditing == null) return;
      state.annShapes[textEditing].text = textInput.value;
      scheduleDraw();
    });
    textInput.addEventListener('blur', function(){
      if (textEditing != null) {
        if (!state.annShapes[textEditing].text) state.annShapes.splice(textEditing, 1);
        textEditing = null;
      }
      textInput.style.display = 'none';
      scheduleDraw();
    });
    textInput.addEventListener('keydown', function(ev){
      if (ev.key === 'Enter' || ev.key === 'Escape') textInput.blur();
    });
  }

  /* ══════════════════════════════════════════════════════════
     SLICE 5 — Explore / Practice / Quiz / Prebuilt / Export
     ══════════════════════════════════════════════════════════ */

  /* ── Data: CONCEPTS ─────────────────────────────────────── */
  var CONCEPTS = [
    { id:'ohms-law', name:"Ohm's Law", symbol:'V = IR', formula:'V = I \u00D7 R', unit:'V, A, \u03A9', cat:'fundamentals',
      desc:"Ohm's Law states that the voltage across a conductor is directly proportional to the current flowing through it. V = IR is the most fundamental equation in electrical engineering.",
      example:{ problem:'A 220 \u03A9 resistor carries 50 mA. Find V.', steps:['V = I \u00D7 R','V = 0.050 \u00D7 220','V = 11 V'] } },
    { id:'current', name:'Electric Current', symbol:'I = Q/t', formula:'I = Q / t', unit:'A (amperes)', cat:'fundamentals',
      desc:'Current is the rate of flow of charge. 1 A = 1 coulomb per second.',
      example:{ problem:'15 C in 3 s. Find I.', steps:['I = Q / t','I = 15 / 3','I = 5 A'] } },
    { id:'voltage', name:'Voltage (EMF)', symbol:'V = W/Q', formula:'V = W / Q', unit:'V (volts)', cat:'fundamentals',
      desc:'Voltage is the work done per unit charge between two points.',
      example:{ problem:'36 J moves 3 C. Find V.', steps:['V = W / Q','V = 36 / 3','V = 12 V'] } },
    { id:'resistance', name:'Resistance', symbol:'R = \u03C1L/A', formula:'R = \u03C1L / A', unit:'\u03A9 (ohms)', cat:'fundamentals',
      desc:'Resistance opposes the flow of current; depends on resistivity, length and area.',
      example:{ problem:'Copper \u03C1=1.68\u00D710\u207B\u2078, L=10 m, A=1 mm\u00B2. Find R.', steps:['R = \u03C1L/A','R = 0.168 \u03A9'] } },
    { id:'kcl', name:"Kirchhoff's Current Law", symbol:'\u03A3I = 0', formula:'\u03A3I_in = \u03A3I_out', unit:'A', cat:'laws',
      desc:'KCL: algebraic sum of currents at any node is zero (conservation of charge).',
      example:{ problem:'I_in=5 A, I\u2081=2 A, I\u2082=1.5 A. Find I\u2083.', steps:['5 = 2 + 1.5 + I\u2083','I\u2083 = 1.5 A'] } },
    { id:'kvl', name:"Kirchhoff's Voltage Law", symbol:'\u03A3V = 0', formula:'\u03A3V_drops = V_source', unit:'V', cat:'laws',
      desc:'KVL: sum of voltage rises and drops around any closed loop is zero.',
      example:{ problem:'12 V source, V\u2081 = 4 V across R\u2081. Find V\u2082.', steps:['12 = 4 + V\u2082','V\u2082 = 8 V'] } },
    { id:'power', name:'Electrical Power', symbol:'P = VI', formula:'P = VI = I\u00B2R = V\u00B2/R', unit:'W', cat:'laws',
      desc:'Power is the rate of energy conversion in a circuit.',
      example:{ problem:'470 \u03A9, 9 V. Find P.', steps:['P = V\u00B2/R','P = 81 / 470','P = 0.172 W'] } },
    { id:'series', name:'Series Circuits', symbol:'R\u209C = \u03A3R', formula:'R_total = R\u2081 + R\u2082 + ...', unit:'\u03A9', cat:'laws',
      desc:'Same current through each component; voltages add; resistances add.',
      example:{ problem:'100 + 220 + 330 \u03A9 in series with 12 V.', steps:['R = 650 \u03A9','I = 18.46 mA'] } },
    { id:'parallel', name:'Parallel Circuits', symbol:'1/R\u209C', formula:'1/R_total = \u03A3 1/R', unit:'\u03A9', cat:'components',
      desc:'Same voltage across each branch; currents add; total R less than smallest.',
      example:{ problem:'100 \u03A9 || 200 \u03A9.', steps:['1/R = 1/100 + 1/200','R = 66.67 \u03A9'] } },
    { id:'voltage-divider', name:'Voltage Divider', symbol:'V\u2082 = V\u00B7R\u2082/(R\u2081+R\u2082)', formula:'V_out = V_in \u00D7 R\u2082 / (R\u2081 + R\u2082)', unit:'V', cat:'components',
      desc:'Two resistors in series produce a fraction of input voltage.',
      example:{ problem:'12 V, R\u2081=1 k\u03A9, R\u2082=2 k\u03A9.', steps:['V_out = 12 \u00D7 2000/3000','V_out = 8 V'] } }
  ];

  /* ── Data: PROBLEM_GEN ────────────────────────────────── */
  function rInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
  function r2(n){ return +(Math.round(n*100)/100).toFixed(2); }
  var PROBLEM_GEN = [
    function(){ var I=rInt(5,500), R=rInt(10,1000), V=r2(I*R/1000); return { prompt:'A '+R+' \u03A9 resistor carries '+I+' mA. Find V.', steps:['V = IR','V = '+(I/1000)+' \u00D7 '+R,'V = '+V+' V'], answer:V, unit:'V', tol:0.1 }; },
    function(){ var V=rInt(1,24), R=rInt(10,1000), I=r2(V/R*1000); return { prompt:V+' V across '+R+' \u03A9. Find I (mA).', steps:['I = V/R','I = '+V+'/'+R,'I = '+I+' mA'], answer:I, unit:'mA', tol:0.5 }; },
    function(){ var V=rInt(3,24), I=rInt(5,500), R=r2(V/(I/1000)); return { prompt:V+' V, '+I+' mA. Find R (\u03A9).', steps:['R = V/I','R = '+R+' \u03A9'], answer:R, unit:'\u03A9', tol:0.5 }; },
    function(){ var V=rInt(3,24), R=rInt(10,500), I=V/R, P=r2(V*I); return { prompt:V+' V across '+R+' \u03A9. Find P (W).', steps:['P = V\u00B2/R','P = '+(V*V)+'/'+R,'P = '+P+' W'], answer:P, unit:'W', tol:0.05 }; },
    function(){ var a=rInt(10,500), b=rInt(10,500), c=rInt(10,500); return { prompt:'Series: '+a+', '+b+', '+c+' \u03A9. Find R_total.', steps:['R = '+a+'+'+b+'+'+c,'R = '+(a+b+c)+' \u03A9'], answer:a+b+c, unit:'\u03A9', tol:0.5 }; },
    function(){ var a=rInt(50,500), b=rInt(50,500), Rt=r2(a*b/(a+b)); return { prompt:'Parallel: '+a+' \u03A9 and '+b+' \u03A9. Find R_total.', steps:['R = '+a+'\u00D7'+b+'/('+a+'+'+b+')','R = '+Rt+' \u03A9'], answer:Rt, unit:'\u03A9', tol:0.5 }; },
    function(){ var V=rInt(6,24), a=rInt(50,500), b=rInt(50,500), Rt=a+b, V1=r2(V*a/Rt); return { prompt:V+' V, R\u2081='+a+' \u03A9, R\u2082='+b+' \u03A9 in series. Find V\u2081.', steps:['I = V/R = '+r2(V/Rt)+' A','V\u2081 = IR\u2081 = '+V1+' V'], answer:V1, unit:'V', tol:0.1 }; },
    function(){ var Vin=rInt(5,24), a=rInt(100,1000), b=rInt(100,1000), Vo=r2(Vin*b/(a+b)); return { prompt:'Divider: V_in='+Vin+' V, R\u2081='+a+', R\u2082='+b+' \u03A9. Find V_out.', steps:['V_out = V \u00D7 R\u2082/(R\u2081+R\u2082)','V_out = '+Vo+' V'], answer:Vo, unit:'V', tol:0.1 }; }
  ];

  /* ── Data: QUIZ POOL ────────────────────────────────────── */
  function genQuizPool() {
    var pool = [
      { type:'mcq', prompt:"Ohm's Law states:", options:['V = IR','V = I/R','V = R/I','I = VR'], correct:0 },
      { type:'mcq', prompt:"In a series circuit, what is constant?", options:['Current','Voltage','Resistance','Power'], correct:0 },
      { type:'mcq', prompt:"In a parallel circuit, what is the same across every branch?", options:['Voltage','Current','Resistance','Power'], correct:0 },
      { type:'mcq', prompt:"KCL is based on conservation of:", options:['Charge','Energy','Momentum','Mass'], correct:0 },
      { type:'mcq', prompt:"KVL is based on conservation of:", options:['Energy','Charge','Power','Resistance'], correct:0 },
      { type:'mcq', prompt:"Power can be P = VI, P = I\u00B2R, and:", options:['P = V\u00B2/R','P = V/R\u00B2','P = IR\u00B2','P = V\u00B2R'], correct:0 },
      { type:'mcq', prompt:"Two 100 \u03A9 resistors in parallel:", options:['50 \u03A9','100 \u03A9','200 \u03A9','25 \u03A9'], correct:0 },
      { type:'mcq', prompt:"Conductance is measured in:", options:['Siemens (S)','Ohms','Watts','Volts'], correct:0 },
      { type:'mcq', prompt:"Doubling R at constant V:", options:['Halves current','Doubles current','No change','Quadruples current'], correct:0 },
      { type:'mcq', prompt:"Voltage divider, equal resistors, V_out is:", options:['Half V_in','Equal V_in','Zero','Double V_in'], correct:0 }
    ];
    var V1=rInt(5,20), R1n=rInt(100,500);
    pool.push({ type:'numeric', prompt:V1+' V across '+R1n+' \u03A9. Current (mA)?', answer:r2(V1/R1n*1000), unit:'mA', tol:0.5 });
    var Ra=rInt(100,400), Rb=rInt(100,400);
    pool.push({ type:'numeric', prompt:Ra+' + '+Rb+' \u03A9 series. R_total?', answer:Ra+Rb, unit:'\u03A9', tol:0.5 });
    var Rc=rInt(100,500), Rd=rInt(100,500);
    pool.push({ type:'numeric', prompt:Rc+' || '+Rd+' \u03A9. R_total?', answer:r2(Rc*Rd/(Rc+Rd)), unit:'\u03A9', tol:0.5 });
    for (var i=pool.length-1; i>0; i--) { var j=rInt(0,i), t=pool[i]; pool[i]=pool[j]; pool[j]=t; }
    return pool;
  }

  /* ── Explore UI ─────────────────────────────────────────── */
  var exploreCat = 'fundamentals';
  var conceptGrid = document.getElementById('concept-grid');
  var itemInfo = document.getElementById('item-info');
  var catTabs = document.getElementById('cat-tabs');
  if (catTabs) catTabs.addEventListener('click', function(e){
    var b = e.target.closest('.pill'); if (!b) return;
    exploreCat = b.getAttribute('data-cat');
    catTabs.querySelectorAll('.pill').forEach(function(p){ p.classList.toggle('active', p===b); });
    buildConceptGrid();
    if (itemInfo) itemInfo.style.display = 'none';
  });
  function buildConceptGrid() {
    if (!conceptGrid) return;
    conceptGrid.innerHTML = '';
    CONCEPTS.filter(function(c){return c.cat===exploreCat;}).forEach(function(c){
      var btn = document.createElement('button');
      btn.className = 'is-btn';
      btn.innerHTML = '<span class="is-btn-name">'+c.name+'</span><span class="is-btn-sym">'+c.symbol+'</span>';
      btn.addEventListener('click', function(){
        conceptGrid.querySelectorAll('.is-btn').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
        showConceptInfo(c);
      });
      conceptGrid.appendChild(btn);
    });
    if (itemInfo) itemInfo.style.display = 'none';
  }
  function showConceptInfo(c) {
    if (!itemInfo) return;
    itemInfo.style.display = '';
    var labels = { fundamentals:'Fundamentals', laws:'Circuit Laws', components:'Components' };
    var h = '<div class="ii-top"><span class="ii-name">'+c.name+'</span><span class="ii-cat-badge">'+labels[c.cat]+'</span></div>';
    h += '<p class="ii-desc">'+c.desc+'</p>';
    h += '<div class="formula-box"><span class="fb-formula">'+c.formula+'</span><span class="fb-unit">'+c.unit+'</span></div>';
    if (c.example) {
      h += '<div class="example-box"><h4>Example</h4><p class="ex-problem">'+c.example.problem+'</p>';
      c.example.steps.forEach(function(s){ h += '<p class="ex-step">'+s+'</p>'; });
      h += '</div>';
    }
    itemInfo.innerHTML = h;
  }

  /* ── Practice UI ────────────────────────────────────────── */
  var pScore=0, pTotal=0, curProblem=null, pAnswered=false;
  var ppPrompt = document.getElementById('pp-prompt');
  var ppInput = document.getElementById('pp-input');
  var ppUnit = document.getElementById('pp-unit');
  var ppCheck = document.getElementById('pp-check');
  var ppNext = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');
  function newPracticeProblem() {
    if (!ppPrompt) return;
    curProblem = PROBLEM_GEN[rInt(0, PROBLEM_GEN.length-1)]();
    pAnswered = false;
    ppPrompt.textContent = curProblem.prompt;
    ppUnit.textContent = curProblem.unit;
    ppInput.value = ''; ppInput.disabled = false;
    ppFeedback.textContent = ''; ppFeedback.className = 'feedback';
    ppCheck.style.display = ''; ppNext.style.display = 'none';
    ppSolution.style.display = 'none';
    ppInput.focus();
  }
  if (ppCheck) ppCheck.addEventListener('click', function(){
    if (pAnswered) return;
    var v = parseFloat(ppInput.value);
    if (isNaN(v)) { ppInput.focus(); return; }
    pAnswered = true; pTotal++;
    var ok = Math.abs(v - curProblem.answer) <= (curProblem.tol||0.5);
    if (ok) { pScore++; ppFeedback.textContent='Correct!'; ppFeedback.className='feedback ok'; }
    else { ppFeedback.textContent='Incorrect. Answer: '+curProblem.answer+' '+curProblem.unit; ppFeedback.className='feedback err'; }
    ppInput.disabled = true;
    ppCheck.style.display = 'none'; ppNext.style.display = '';
    if (pbarScoreVal) pbarScoreVal.textContent = pScore+' / '+pTotal;
    var s = '<h4>Solution</h4>';
    curProblem.steps.forEach(function(st){ s += '<p class="sol-step">'+st+'</p>'; });
    ppSolution.innerHTML = s; ppSolution.style.display = '';
  });
  if (ppNext) ppNext.addEventListener('click', newPracticeProblem);
  if (ppInput) ppInput.addEventListener('keydown', function(e){
    if (e.key === 'Enter') { if (!pAnswered) ppCheck.click(); else ppNext.click(); }
  });

  /* ── Quiz UI ────────────────────────────────────────────── */
  var QUIZ_SIZE = 5;
  var quizSet=[], quizIdx=0, quizScore=0, quizAnswered=false, quizHistory=[];
  var quizPanel = document.getElementById('quiz-panel');
  var quizBar = document.getElementById('quiz-bar');
  var quizResult = document.getElementById('quiz-result');
  var qbarNum = document.getElementById('qbar-num');
  function startQuiz() {
    if (!quizPanel) return;
    quizSet = genQuizPool().slice(0, QUIZ_SIZE);
    quizIdx = 0; quizScore = 0; quizHistory = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = ''; quizBar.style.display = '';
    showQuizQuestion();
  }
  function showQuizQuestion() {
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx+1;
    quizAnswered = false;
    var h = '<p class="qp-prompt">Q'+(quizIdx+1)+'. '+q.prompt+'</p>';
    if (q.type === 'mcq') {
      h += '<div class="answer-grid">';
      q.options.forEach(function(o,i){ h += '<button class="answer-btn" data-idx="'+i+'">'+o+'</button>'; });
      h += '</div>';
    } else {
      h += '<div class="quiz-input-row"><input class="qi-input" id="qi-input" type="number" step="any" placeholder="Answer"><span class="qi-unit">'+q.unit+'</span><button class="btn btn-primary" id="qi-submit">Submit</button></div>';
    }
    h += '<div style="margin-top:12px;display:flex;align-items:center;gap:10px;"><span class="quiz-feedback" id="quiz-fb"></span><button class="btn btn-ghost" id="quiz-next" style="display:none;margin-left:auto;">Next \u2192</button></div>';
    quizPanel.innerHTML = h;
    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.answer-btn').forEach(function(btn){
        btn.addEventListener('click', function(){ if (!quizAnswered) submitMCQ(parseInt(btn.dataset.idx)); });
      });
    } else {
      document.getElementById('qi-submit').addEventListener('click', submitNumeric);
      var qi = document.getElementById('qi-input');
      qi.addEventListener('keydown', function(e){ if (e.key==='Enter') submitNumeric(); });
      qi.focus();
    }
    document.getElementById('quiz-next').addEventListener('click', nextQuiz);
  }
  function submitMCQ(idx) {
    quizAnswered = true;
    var q = quizSet[quizIdx];
    var ok = idx === q.correct;
    if (ok) quizScore++;
    quizHistory.push({ prompt:q.prompt, given:q.options[idx], correct:q.options[q.correct], ok:ok });
    quizPanel.querySelectorAll('.answer-btn').forEach(function(b){
      b.classList.add('locked');
      var i = parseInt(b.dataset.idx);
      if (i === q.correct) b.classList.add('correct');
      else if (i === idx && !ok) b.classList.add('wrong');
    });
    var fb = document.getElementById('quiz-fb');
    fb.textContent = ok ? 'Correct!' : 'Incorrect!';
    fb.className = 'quiz-feedback '+(ok?'ok':'err');
    document.getElementById('quiz-next').style.display = '';
  }
  function submitNumeric() {
    if (quizAnswered) return;
    var q = quizSet[quizIdx];
    var input = document.getElementById('qi-input');
    var v = parseFloat(input.value);
    if (isNaN(v)) { input.focus(); return; }
    quizAnswered = true;
    var ok = Math.abs(v - q.answer) <= (q.tol||0.5);
    if (ok) quizScore++;
    quizHistory.push({ prompt:q.prompt, given:v+' '+q.unit, correct:q.answer+' '+q.unit, ok:ok });
    var fb = document.getElementById('quiz-fb');
    fb.textContent = ok ? 'Correct!' : ('Incorrect. Answer: '+q.answer+' '+q.unit);
    fb.className = 'quiz-feedback '+(ok?'ok':'err');
    input.disabled = true;
    document.getElementById('qi-submit').disabled = true;
    document.getElementById('quiz-next').style.display = '';
  }
  function nextQuiz() {
    quizIdx++;
    if (quizIdx >= QUIZ_SIZE) showQuizResult();
    else showQuizQuestion();
  }
  function showQuizResult() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';
    var pct = quizScore/QUIZ_SIZE;
    var cls = pct===1?'perfect':pct>=0.6?'good':'poor';
    var stars = pct===1?'\u2605\u2605\u2605':pct>=0.6?'\u2605\u2605\u2606':'\u2605\u2606\u2606';
    var verdict = pct===1?'Perfect score!':pct>=0.6?'Good work!':'Keep practising!';
    var h = '<div class="qr-header"><div class="qr-title-wrap"><span class="qr-title">Quiz Complete</span><span class="qr-stars">'+stars+'</span></div><div class="qr-score-wrap"><span class="qr-score '+cls+'">'+quizScore+'/'+QUIZ_SIZE+'</span><span class="qr-verdict">'+verdict+'</span></div></div><div class="qr-rows">';
    quizHistory.forEach(function(x,i){
      h += '<div class="qr-row '+(x.ok?'ok':'err')+'"><span class="qr-qnum">Q'+(i+1)+'</span><span class="qr-detail"><strong>'+x.given+'</strong> \u2014 Correct: '+x.correct+'</span><span class="qr-mark">'+(x.ok?'\u2713':'\u2717')+'</span></div>';
    });
    h += '</div><button class="btn btn-primary" id="quiz-retry">New Quiz</button>';
    quizResult.innerHTML = h;
    document.getElementById('quiz-retry').addEventListener('click', function(){ quizResult.style.display='none'; startQuiz(); });
  }

  /* ── Prebuilt circuits ─────────────────────────────────── */
  function addComp(type, x, y, props, rot) {
    var c = makeComponent(type, x, y);
    if (props) for (var k in props) c.props[k] = props[k];
    if (rot) c.rot = rot;
    state.components.push(c);
    return c;
  }
  function addConn(a, pa, b, pb, wps) {
    state.connections.push({ id:state.nextId++, from:{compId:a.id, portIdx:pa}, to:{compId:b.id, portIdx:pb}, waypoints:wps||[] });
  }
  var PREBUILT = {
    single: function(){
      // b -- a -- R -- gnd, voltmeter across R
      var b = addComp('battery', 80, 200, {V:9});
      var a = addComp('ammeter', 240, 200);
      var r = addComp('resistor', 400, 200, {R:220});
      var vm = addComp('voltmeter', 400, 340);
      var g = addComp('ground', 240, 380);
      addConn(b, 0, a, 0);
      addConn(a, 1, r, 0);
      addConn(r, 1, g, 0, [{x:460,y:200},{x:460,y:360},{x:240,y:360}]);
      addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:360},{x:240,y:360}]);
      addConn(r, 0, vm, 0, [{x:360,y:200},{x:360,y:340}]);
      addConn(r, 1, vm, 1, [{x:460,y:200},{x:460,y:280},{x:430,y:280},{x:430,y:340}]);
    },
    series: function(){
      // b -- a -- R1 -- R2 -- gnd, voltmeter across R1
      var b = addComp('battery', 80, 220, {V:12});
      var a = addComp('ammeter', 220, 220);
      var r1 = addComp('resistor', 380, 220, {R:220});
      var r2 = addComp('resistor', 560, 220, {R:330});
      var vm = addComp('voltmeter', 380, 360);
      var g = addComp('ground', 320, 400);
      addConn(b, 0, a, 0);
      addConn(a, 1, r1, 0);
      addConn(r1, 1, r2, 0);
      addConn(r2, 1, g, 0, [{x:620,y:220},{x:620,y:380},{x:320,y:380}]);
      addConn(b, 1, g, 0, [{x:40,y:220},{x:40,y:380},{x:320,y:380}]);
      addConn(r1, 0, vm, 0, [{x:340,y:220},{x:340,y:360}]);
      addConn(r1, 1, vm, 1, [{x:420,y:220},{x:420,y:300},{x:410,y:300},{x:410,y:360}]);
    },
    parallel: function(){
      // b -- a -- jL -- (R1 || R2) -- jR -- gnd, voltmeter across pair (jL-jR)
      var b = addComp('battery', 60, 240, {V:9});
      var a = addComp('ammeter', 200, 240);
      var jL = addComp('junction', 320, 240);
      var r1 = addComp('resistor', 440, 180, {R:220});
      var r2 = addComp('resistor', 440, 300, {R:330});
      var jR = addComp('junction', 560, 240);
      var vm = addComp('voltmeter', 440, 400);
      var g = addComp('ground', 660, 380);
      addConn(b, 0, a, 0);
      addConn(a, 1, jL, 0);
      addConn(jL, 1, r1, 0, [{x:340,y:240},{x:340,y:180},{x:400,y:180}]);
      addConn(jL, 1, r2, 0, [{x:340,y:240},{x:340,y:300},{x:400,y:300}]);
      addConn(r1, 1, jR, 0, [{x:480,y:180},{x:580,y:180},{x:580,y:240},{x:570,y:240}]);
      addConn(r2, 1, jR, 0, [{x:480,y:300},{x:580,y:300},{x:580,y:240},{x:570,y:240}]);
      addConn(jR, 1, g, 0, [{x:580,y:240},{x:660,y:240},{x:660,y:360}]);
      addConn(b, 1, g, 0, [{x:20,y:240},{x:20,y:420},{x:660,y:420},{x:660,y:360}]);
      addConn(jL, 2, vm, 0, [{x:320,y:230},{x:320,y:400},{x:400,y:400}]);
      addConn(jR, 2, vm, 1, [{x:560,y:230},{x:560,y:400},{x:480,y:400}]);
    },
    mixed: function(){
      // b -- a -- R1 -- jL -- (R2 || R3) -- jR -- gnd, voltmeter across (R2||R3)
      var b = addComp('battery', 60, 220, {V:12});
      var a = addComp('ammeter', 200, 220);
      var r1 = addComp('resistor', 340, 220, {R:100});
      var jL = addComp('junction', 440, 220);
      var r2 = addComp('resistor', 560, 160, {R:220});
      var r3 = addComp('resistor', 560, 280, {R:330});
      var jR = addComp('junction', 680, 220);
      var vm = addComp('voltmeter', 560, 400);
      var g = addComp('ground', 760, 360);
      addConn(b, 0, a, 0);
      addConn(a, 1, r1, 0);
      addConn(r1, 1, jL, 0);
      addConn(jL, 1, r2, 0, [{x:460,y:220},{x:460,y:160},{x:520,y:160}]);
      addConn(r2, 1, jR, 0, [{x:600,y:160},{x:700,y:160},{x:700,y:220},{x:690,y:220}]);
      addConn(jL, 1, r3, 0, [{x:460,y:220},{x:460,y:280},{x:520,y:280}]);
      addConn(r3, 1, jR, 0, [{x:600,y:280},{x:700,y:280},{x:700,y:220},{x:690,y:220}]);
      addConn(jR, 1, g, 0, [{x:700,y:220},{x:760,y:220},{x:760,y:340}]);
      addConn(b, 1, g, 0, [{x:20,y:220},{x:20,y:420},{x:760,y:420},{x:760,y:340}]);
      addConn(jL, 2, vm, 0, [{x:440,y:210},{x:440,y:400},{x:520,y:400}]);
      addConn(jR, 2, vm, 1, [{x:680,y:210},{x:680,y:400},{x:600,y:400}]);
    },
    led: function(){
      // b -- a -- R -- LED -- gnd, voltmeter across LED
      var b = addComp('battery', 80, 200, {V:5});
      var a = addComp('ammeter', 220, 200);
      var r = addComp('resistor', 360, 200, {R:330});
      var d = addComp('led', 520, 200, {R:30});
      var vm = addComp('voltmeter', 520, 340);
      var g = addComp('ground', 280, 380);
      addConn(b, 0, a, 0);
      addConn(a, 1, r, 0);
      addConn(r, 1, d, 0);
      addConn(d, 1, g, 0, [{x:580,y:200},{x:580,y:360},{x:280,y:360}]);
      addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:360},{x:280,y:360}]);
      addConn(d, 0, vm, 0, [{x:480,y:200},{x:480,y:340}]);
      addConn(d, 1, vm, 1, [{x:580,y:200},{x:580,y:280},{x:560,y:280},{x:560,y:340}]);
    },
    fuse: function(){
      // b -- fuse -- rheostat -- lamp -- gnd. Wind the rheostat down and the
      // rising current parts the 0.5 A fuse.
      var b = addComp('battery', 80, 200, {V:12});
      var a = addComp('ammeter', 220, 200);
      var f = addComp('fuse', 360, 200, {Irated:0.5});
      var rh = addComp('rheostat', 500, 200, {R:60, Rmax:200});
      var l = addComp('lamp', 640, 200, {R:12});
      var g = addComp('ground', 340, 400);
      addConn(b, 0, a, 0);
      addConn(a, 1, f, 0);
      addConn(f, 1, rh, 0);
      addConn(rh, 1, l, 0);
      addConn(l, 1, g, 0, [{x:700,y:200},{x:700,y:380},{x:340,y:380}]);
      addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:380},{x:340,y:380}]);
    },
    'lamp-switch': function(){
      // b -- a -- switch -- lamp -- gnd, voltmeter across lamp
      var b = addComp('battery', 80, 200, {V:12});
      var a = addComp('ammeter', 220, 200);
      var s = addComp('switch', 360, 200, {closed:false});
      var l = addComp('lamp', 500, 200);
      var vm = addComp('voltmeter', 500, 360);
      var g = addComp('ground', 320, 400);
      addConn(b, 0, a, 0);
      addConn(a, 1, s, 0);
      addConn(s, 1, l, 0);
      addConn(l, 1, g, 0, [{x:560,y:200},{x:560,y:380},{x:320,y:380}]);
      addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:380},{x:320,y:380}]);
      addConn(l, 0, vm, 0, [{x:470,y:200},{x:470,y:360}]);
      addConn(l, 1, vm, 1, [{x:560,y:200},{x:560,y:300},{x:530,y:300},{x:530,y:360}]);
    },
    fan: function(){
      // b -- a -- switch -- fan -- gnd, voltmeter across fan
      var b = addComp('battery', 80, 200, {V:12});
      var a = addComp('ammeter', 220, 200);
      var s = addComp('switch', 360, 200, {closed:true});
      var f = addComp('fan', 500, 200, {R:50});
      var vm = addComp('voltmeter', 500, 380);
      var g = addComp('ground', 320, 420);
      addConn(b, 0, a, 0);
      addConn(a, 1, s, 0);
      addConn(s, 1, f, 0);
      addConn(f, 1, g, 0, [{x:570,y:200},{x:570,y:400},{x:320,y:400}]);
      addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:400},{x:320,y:400}]);
      addConn(f, 0, vm, 0, [{x:465,y:200},{x:465,y:380}]);
      addConn(f, 1, vm, 1, [{x:570,y:200},{x:570,y:320},{x:535,y:320},{x:535,y:380}]);
    },
    'ammeter-voltmeter': function(){
      var b = addComp('battery', 100, 200, {V:9});
      var a = addComp('ammeter', 240, 200);
      var r = addComp('resistor', 400, 200, {R:220});
      var vm = addComp('voltmeter', 400, 320);
      var g = addComp('ground', 240, 360);
      addConn(b, 0, a, 0);
      addConn(a, 1, r, 0);
      addConn(r, 1, g, 0, [{x:460,y:200},{x:460,y:340},{x:240,y:340}]);
      addConn(b, 1, g, 0, [{x:60,y:200},{x:60,y:340},{x:240,y:340}]);
      addConn(r, 0, vm, 0, [{x:360,y:200},{x:360,y:320}]);
      addConn(r, 1, vm, 1, [{x:460,y:200},{x:460,y:320}]);
    },
    divider: function(){
      var b = addComp('battery', 120, 200, {V:12});
      var r1 = addComp('resistor', 300, 140, {R:1000});
      var r2 = addComp('resistor', 300, 260, {R:2000});
      var vm = addComp('voltmeter', 460, 260);
      var g = addComp('ground', 120, 360);
      addConn(b, 0, r1, 0, [{x:240,y:160},{x:260,y:140}]);
      addConn(r1, 1, r2, 1, [{x:360,y:140},{x:360,y:260}]);
      addConn(r2, 0, b, 1, [{x:260,y:260},{x:80,y:260},{x:80,y:200}]);
      addConn(r2, 1, vm, 0, [{x:360,y:260},{x:420,y:260}]);
      addConn(r2, 0, vm, 1, [{x:260,y:260},{x:260,y:340},{x:500,y:340},{x:500,y:260}]);
      addConn(b, 1, g, 0, [{x:80,y:260},{x:120,y:340}]);
    },
    /* ── Advanced ───────────────────────────────────────── */
    bridge: function(){
      // Wheatstone bridge: 4 resistors in a ladder, voltmeter (galvanometer) across the middle.
      // Battery+ammeter feed top rail (jT), ground at bottom rail (jB).
      // Balance condition: R1/R3 = R2/R4 → voltmeter reads zero.
      var b  = addComp('battery', 60, 280, {V:12});
      var a  = addComp('ammeter', 200, 280);
      var jT = addComp('junction', 440, 160);   // top rail node
      var jB = addComp('junction4', 440, 400);  // bottom rail node (4 ports — left/right/top/bottom)
      var jL = addComp('junction', 320, 280);   // left mid (one VM probe)
      var jR = addComp('junction', 560, 280);   // right mid (other VM probe)
      var r1 = addComp('resistor', 380, 220, {R:1000}); // jL ↔ jT (upper-left arm)
      var r2 = addComp('resistor', 500, 220, {R:2200}); // jT ↔ jR (upper-right arm)
      var r3 = addComp('resistor', 380, 340, {R:1000}); // jL ↔ jB (lower-left arm)
      var r4 = addComp('resistor', 500, 340, {R:2200}); // jB ↔ jR (lower-right arm) — balanced as drawn
      var vm = addComp('voltmeter', 440, 280);          // across jL–jR
      var g  = addComp('ground', 660, 420);
      // battery+ammeter to top rail
      addConn(b, 0, a, 0);
      addConn(a, 1, jT, 2, [{x:280,y:280},{x:280,y:160},{x:440,y:160},{x:440,y:150}]);
      // R1 between jL and jT
      addConn(jL, 2, r1, 0, [{x:320,y:270},{x:320,y:220},{x:340,y:220}]);
      addConn(r1, 1, jT, 0, [{x:420,y:220},{x:430,y:220},{x:430,y:160}]);
      // R2 between jT and jR
      addConn(jT, 1, r2, 0, [{x:450,y:160},{x:450,y:220},{x:460,y:220}]);
      addConn(r2, 1, jR, 2, [{x:540,y:220},{x:560,y:220},{x:560,y:270}]);
      // R3 between jL and jB
      addConn(jL, 1, r3, 0, [{x:330,y:280},{x:330,y:340},{x:340,y:340}]);
      addConn(r3, 1, jB, 0, [{x:420,y:340},{x:430,y:340},{x:430,y:400}]);
      // R4 between jB and jR
      addConn(jB, 1, r4, 0, [{x:450,y:400},{x:450,y:340},{x:460,y:340}]);
      addConn(r4, 1, jR, 0, [{x:540,y:340},{x:550,y:340},{x:550,y:280}]);
      // voltmeter across jL ↔ jR
      addConn(jL, 1, vm, 0, [{x:330,y:280},{x:410,y:280}]);
      addConn(jR, 0, vm, 1, [{x:550,y:280},{x:470,y:280}]);
      // ground at bottom node
      addConn(jB, 3, g, 0, [{x:440,y:410},{x:440,y:440},{x:660,y:440},{x:660,y:400}]);
      addConn(b, 1, g, 0, [{x:20,y:280},{x:20,y:460},{x:660,y:460},{x:660,y:400}]);
    },
    'multi-lamp': function(){
      // 3 lamps in parallel, each with its own switch and ammeter.
      // Main ammeter reads total current; each branch ammeter reads that branch's current.
      var b  = addComp('battery', 60, 260, {V:12});
      var aT = addComp('ammeter', 200, 260);  // total current
      var jL = addComp('junction4', 320, 260);
      var jR = addComp('junction4', 760, 260);
      // branch 1 (top)
      var s1 = addComp('switch', 420, 160, {closed:true});
      var a1 = addComp('ammeter', 560, 160);
      var l1 = addComp('lamp', 680, 160, {R:48});
      // branch 2 (middle)
      var s2 = addComp('switch', 420, 260, {closed:true});
      var a2 = addComp('ammeter', 560, 260);
      var l2 = addComp('lamp', 680, 260, {R:48});
      // branch 3 (bottom)
      var s3 = addComp('switch', 420, 360, {closed:false});
      var a3 = addComp('ammeter', 560, 360);
      var l3 = addComp('lamp', 680, 360, {R:48});
      var vm = addComp('voltmeter', 540, 460);
      var g  = addComp('ground', 860, 440);
      // main path
      addConn(b, 0, aT, 0);
      addConn(aT, 1, jL, 0);
      // branch 1
      addConn(jL, 2, s1, 0, [{x:320,y:250},{x:320,y:160},{x:385,y:160}]);
      addConn(s1, 1, a1, 0);
      addConn(a1, 1, l1, 0);
      addConn(l1, 1, jR, 2, [{x:710,y:160},{x:760,y:160},{x:760,y:250}]);
      // branch 2 (straight across)
      addConn(jL, 1, s2, 0);
      addConn(s2, 1, a2, 0);
      addConn(a2, 1, l2, 0);
      addConn(l2, 1, jR, 0);
      // branch 3
      addConn(jL, 3, s3, 0, [{x:320,y:270},{x:320,y:360},{x:385,y:360}]);
      addConn(s3, 1, a3, 0);
      addConn(a3, 1, l3, 0);
      addConn(l3, 1, jR, 3, [{x:710,y:360},{x:760,y:360},{x:760,y:270}]);
      // voltmeter across the lamp bus (jL ↔ jR)
      addConn(jL, 3, vm, 0, [{x:320,y:270},{x:320,y:460},{x:500,y:460}]);
      addConn(jR, 3, vm, 1, [{x:760,y:270},{x:760,y:460},{x:580,y:460}]);
      // ground
      addConn(jR, 1, g, 0, [{x:780,y:260},{x:860,y:260},{x:860,y:420}]);
      addConn(b, 1, g, 0, [{x:20,y:260},{x:20,y:480},{x:860,y:480},{x:860,y:420}]);
    },
    'two-loop': function(){
      // Two-loop circuit (Kirchhoff demo): one battery, three resistors arranged so
      // current splits at jL into two loops sharing the middle branch (R3).
      // Ammeters in each branch let you verify KCL: I_total = I1 + I2 at jL.
      var b  = addComp('battery', 60, 260, {V:12});
      var aT = addComp('ammeter', 200, 260);  // total from battery
      var jL = addComp('junction4', 340, 260);
      // upper loop: jL → R1 → aU → top → jR
      var r1 = addComp('resistor', 460, 160, {R:220});
      var aU = addComp('ammeter', 600, 160);
      // lower loop: jL → R2 → aD → bottom → jR
      var r2 = addComp('resistor', 460, 360, {R:330});
      var aD = addComp('ammeter', 600, 360);
      var jR = addComp('junction4', 740, 260);
      // shared middle branch back to ground
      var r3 = addComp('resistor', 740, 380, {R:100});  // rotated vertical via rot=90? keep horizontal, route around
      var vm = addComp('voltmeter', 460, 480);
      var g  = addComp('ground', 860, 440);
      // main
      addConn(b, 0, aT, 0);
      addConn(aT, 1, jL, 0);
      // upper branch
      addConn(jL, 2, r1, 0, [{x:340,y:250},{x:340,y:160},{x:420,y:160}]);
      addConn(r1, 1, aU, 0);
      addConn(aU, 1, jR, 2, [{x:630,y:160},{x:740,y:160},{x:740,y:250}]);
      // lower branch
      addConn(jL, 3, r2, 0, [{x:340,y:270},{x:340,y:360},{x:420,y:360}]);
      addConn(r2, 1, aD, 0);
      addConn(aD, 1, jR, 3, [{x:630,y:360},{x:740,y:360},{x:740,y:270}]);
      // shared resistor in main return (between jR and ground)
      addConn(jR, 1, r3, 1, [{x:760,y:260},{x:790,y:260},{x:790,y:380},{x:780,y:380}]);
      addConn(r3, 0, g, 0, [{x:700,y:380},{x:680,y:380},{x:680,y:440},{x:860,y:440},{x:860,y:420}]);
      // voltmeter across upper resistor R1
      addConn(r1, 0, vm, 0, [{x:420,y:160},{x:400,y:160},{x:400,y:480},{x:420,y:480}]);
      addConn(r1, 1, vm, 1, [{x:500,y:160},{x:520,y:160},{x:520,y:480},{x:500,y:480}]);
      // battery- back to ground rail
      addConn(b, 1, g, 0, [{x:20,y:260},{x:20,y:500},{x:860,y:500},{x:860,y:420}]);
    }
  };
  var prebuiltTabs = document.getElementById('prebuilt-tabs');
  var circuitDesc = document.getElementById('circuit-desc');
  var CIRCUIT_DESC = {
    fuse: 'A 0.5 A fuse protects the lamp branch. Lower the rheostat until the current exceeds 0.5 A and the fuse parts the circuit — then right-click it to replace it.',
    single:'Single-resistor loop. V = IR demonstrated in simplest form.',
    series:'Two resistors in series. Same current, voltages add.',
    parallel:'Two resistors in parallel. Same voltage, currents add.',
    mixed:'R\u2081 in series with (R\u2082 || R\u2083). Combines series and parallel.',
    led:'LED with current-limit resistor. Don\u2019t drive an LED without one!',
    'lamp-switch':'Lamp controlled by a switch. Toggle the switch to turn it on.',
    fan:'DC fan (motor) driven through a switch.',
    'ammeter-voltmeter':'Ammeter in series, voltmeter in parallel with the resistor.',
    divider:'Voltage divider: V_out = V\u00B7R\u2082/(R\u2081+R\u2082). Voltmeter reads V_out.',
    bridge:'Wheatstone bridge \u2014 4 resistors in a diamond. When R\u2081/R\u2083 = R\u2082/R\u2084 the bridge is balanced and the voltmeter (galvanometer) reads zero. Try unbalancing one resistor to see the deflection.',
    'multi-lamp':'Three parallel lamps, each with its own switch and ammeter. Toggle switches independently \u2014 the main ammeter equals the sum of branch ammeters (KCL).',
    'two-loop':'Two-loop network sharing a common return path through R\u2083. Demonstrates Kirchhoff\u2019s current law: I_total = I\u2081 + I\u2082 at the left junction.'
  };
  if (prebuiltTabs) prebuiltTabs.addEventListener('click', function(e){
    var b = e.target.closest('.pill'); if (!b) return;
    var k = b.getAttribute('data-circuit');
    if (!PREBUILT[k]) return;
    saveUndo();
    clearCanvas();
    PREBUILT[k]();
    prebuiltTabs.querySelectorAll('.pill').forEach(function(p){ p.classList.toggle('active', p===b); });
    if (circuitDesc) { circuitDesc.style.display = ''; circuitDesc.textContent = CIRCUIT_DESC[k] || ''; }
    fitAll();
  });

  /* ── Export PNG ─────────────────────────────────────────── */
  function exportPNG(withAnnotations) {
    var prev = annVisible;
    if (!withAnnotations) annVisible = false;
    draw();
    // watermark
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = 'rgba(255,160,0,0.6)';
    ctx.font = (11*DPR)+'px sans-serif';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('NHIT VisualLab', canvas.width-8, canvas.height-6);
    ctx.restore();
    var url = canvas.toDataURL('image/png');
    annVisible = prev;
    var a = document.createElement('a');
    a.href = url; a.download = 'ohms-law-circuit.png';
    a.click();
    scheduleDraw();
  }
  on('canvas-export-btn', 'click', function(){ exportPNG(true); });
  on('ctx-canvas-export', 'click', function(){ hideCtxMenus(); exportPNG(true); });
  on('ctx-canvas-export-clean', 'click', function(){ hideCtxMenus(); exportPNG(false); });

  /* ── Export CSV (readings table) ────────────────────────── */
  function csvCell(v) {
    if (v == null) return '';
    var s = String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
  }
  function fmtNum(n, d) {
    if (n == null || !isFinite(n)) return '';
    return Number(n).toFixed(d == null ? 6 : d);
  }
  function exportCSV() {
    var rows = [];
    rows.push(["Ohm's Law Simulator - Circuit Readings"]);
    rows.push(['Exported', new Date().toISOString()]);
    rows.push(['Source', 'NHIT VisualLab/tools/ohms-law/']);
    rows.push([]);
    if (sim) {
      rows.push(['TOTALS']);
      rows.push(['Supply V (V)','Total I (A)','Total P (W)','R_eq (ohm)']);
      rows.push([fmtNum(sim.Veq,4), fmtNum(sim.totalI,6), fmtNum(sim.totalP,6),
                 (sim.Req === Infinity ? 'Infinity' : fmtNum(sim.Req,4))]);
      rows.push([]);
    } else {
      rows.push(['(Circuit not solved - no readings available)']);
      rows.push([]);
    }
    rows.push(['COMPONENTS']);
    rows.push(['ID','Type','Properties','Voltage (V)','Current (A)','Power (W)']);
    state.components.forEach(function(c){
      var V = sim && sim.compV ? sim.compV[c.id] : null;
      var I = sim && sim.compI ? sim.compI[c.id] : null;
      var P = sim && sim.compP ? sim.compP[c.id] : null;
      rows.push([c.id, c.type, JSON.stringify(c.props||{}), fmtNum(V,6), fmtNum(I,6), fmtNum(P,6)]);
    });
    rows.push([]);
    rows.push(['CONNECTIONS']);
    rows.push(['ID','From (comp:port)','To (comp:port)']);
    state.connections.forEach(function(conn){
      rows.push([conn.id,
                 conn.from.compId + ':' + conn.from.portIdx,
                 conn.to.compId + ':' + conn.to.portIdx]);
    });
    var csv = rows.map(function(r){ return r.map(csvCell).join(','); }).join('\r\n');
    var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'ohms-law-readings.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }
  on('canvas-export-csv-btn', 'click', exportCSV);

  /* ── Fullscreen ─────────────────────────────────────────── */
  function toggleFullscreen() {
    var p = document.getElementById('sim-panel');
    if (!p) return;
    p.classList.toggle('is-fullscreen');
    var btn = document.getElementById('btn-fullscreen');
    if (btn) {
      var on = p.classList.contains('is-fullscreen');
      btn.title = on ? 'Exit fullscreen (Esc / F11)' : 'Fullscreen (F11)';
      btn.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Enter fullscreen');
    }
    setTimeout(resizeCanvas, 50);
  }
  // Esc closes fullscreen
  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var p = document.getElementById('sim-panel');
    if (p && p.classList.contains('is-fullscreen')) {
      toggleFullscreen();
      e.preventDefault();
    }
  });
  on('btn-fullscreen', 'click', toggleFullscreen);
  window.addEventListener('keydown', function(e){
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'F11') { toggleFullscreen(); e.preventDefault(); }
    if ((e.key === 'd' || e.key === 'D') && selectedId != null && !e.ctrlKey && !e.metaKey) {
      var ev = document.getElementById('ctx-duplicate');
      if (ev) ev.click();
    }
  });

  /* ── X1: Web Audio sound effects (lazy AudioContext) ────── */
  var sfxMuted = false;
  try { sfxMuted = localStorage.getItem('ohms-law-sfx-muted') === '1'; } catch(e){}
  var _ac = null;
  function ac() {
    if (sfxMuted) return null;
    if (!_ac) {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        _ac = new AC();
      } catch (e) { return null; }
    }
    if (_ac.state === 'suspended') { try { _ac.resume(); } catch(e){} }
    return _ac;
  }
  function tone(freq, dur, type, gain) {
    var a = ac(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    var t = a.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.08, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  var sfx = {
    click: function () { tone(720, 0.04, 'square', 0.05); },
    start: function () { tone(440, 0.06, 'sine', 0.06); setTimeout(function(){ tone(660, 0.08, 'sine', 0.06); }, 60); },
    stop:  function () { tone(440, 0.06, 'sine', 0.05); },
    fault: function () { tone(220, 0.12, 'sawtooth', 0.07); setTimeout(function(){ tone(160, 0.18, 'sawtooth', 0.07); }, 110); }
  };
  var sfxBtn = document.getElementById('btn-toggle-sound');
  function paintSfxBtn() {
    if (!sfxBtn) return;
    sfxBtn.innerHTML = sfxMuted ? '&#128263;' : '&#128266;';
    sfxBtn.setAttribute('aria-pressed', sfxMuted ? 'false' : 'true');
    sfxBtn.classList.toggle('active', !sfxMuted);
  }
  paintSfxBtn();
  if (sfxBtn) sfxBtn.addEventListener('click', function () {
    sfxMuted = !sfxMuted;
    try { localStorage.setItem('ohms-law-sfx-muted', sfxMuted ? '1' : '0'); } catch(e){}
    paintSfxBtn();
    if (!sfxMuted) sfx.click();
  });

  /* ── Hint banner localStorage ──────────────────────────── */
  var HINT_KEY = 'ohms-law-hint-dismissed';
  try {
    if (localStorage.getItem(HINT_KEY) === '1' && hintBanner) hintBanner.style.display = 'none';
  } catch(e){}
  if (hintDismissBtn) hintDismissBtn.addEventListener('click', function(){
    try { localStorage.setItem(HINT_KEY, '1'); } catch(e){}
  });

  /* ── Debug hook for automated tests (no UI side effects) ─── */
  window.__OHM_DEBUG = {
    state: state,
    solve: function(){ return solve(); },
    checkFaults: function(){ return checkFaults(); },
    checkPostSolveFaults: function(s){ return checkPostSolveFaults(s); },
    addComp: addComp,
    addConn: addConn,
    reset: function(){
      state.components.length = 0;
      state.connections.length = 0;
      state.annStrokes.length = 0;
      state.annShapes.length = 0;
      state.nextId = 1;
    }
  };

  /* ── Init ────────────────────────────────────────────────── */
  drawPaletteIcons();
  resizeCanvas();
  // Nudge view so origin isn't at corner
  viewOffX = 40; viewOffY = 40;
  // Load "Single Resistor" prebuilt by default so the canvas isn't empty
  try {
    if (PREBUILT.single) {
      PREBUILT.single();
      var defPill = prebuiltTabs && prebuiltTabs.querySelector('[data-circuit="single"]');
      if (defPill) defPill.classList.add('active');
      if (circuitDesc) { circuitDesc.style.display = ''; circuitDesc.textContent = CIRCUIT_DESC.single || ''; }
      fitAll();
    }
  } catch (e) { /* non-fatal — just show empty canvas */ }
  scheduleDraw();

  /* ================================================================
     SHAREABLE URL — the whole circuit is encoded into the link (no backend).
     snapshot() JSON → [flag] + deflate-raw|raw → base64url → '#c='
     ================================================================ */
  (function () {
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
    function toolHint(m){ var h=document.getElementById('toolbar-hint'); if(h) h.textContent=m; }
    function flashShare(label, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=label; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900); }
    function shareSnapshot(){ return JSON.stringify({ components: state.components, connections: state.connections, annStrokes: state.annStrokes, annShapes: state.annShapes, nextId: state.nextId }, function(k,v){ return (k && k.charAt(0)==='_') ? undefined : v; }); }
    function shareLink(){
      if(!state.components.length){ flashShare('Nothing to place',false); toolHint('Build a circuit first, then Share.'); return Promise.resolve(); }
      try{
        var U=new TextEncoder().encode(shareSnapshot());
        var canZip=(typeof CompressionStream!=='undefined');
        return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
          var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
          var enc=b64urlEncode(out);
          if(enc.length>SHARE_MAX){ flashShare('⚠ Too big',false); toolHint('Circuit too big to share as a link — use fewer parts.'); return; }
          var url=location.origin+location.pathname+'#c='+enc;
          try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(
              function(){ flashShare('✓ Link copied!',true); toolHint('Shareable link copied — opens this exact circuit.'); },
              function(){ flashShare('↑ In address bar'); toolHint('Shareable link is in the address bar.'); });
          } else { flashShare('↑ In address bar'); toolHint('Shareable link is in the address bar.'); }
        }).catch(function(){ flashShare('✗ Failed',false); });
      }catch(e){ flashShare('✗ Failed',false); return Promise.resolve(); }
    }
    function loadFromHash(){
      var h=location.hash||''; if(h.indexOf('#c=')!==0) return;
      var enc=h.slice(3);
      Promise.resolve().then(function(){
        var final=b64urlDecode(enc), flag=final[0], body=final.subarray(1);
        return (flag===1)?inflateBytes(body):Promise.resolve(body);
      }).then(function(U){
        var json=new TextDecoder().decode(U), s=JSON.parse(json);
        if(!s || !Array.isArray(s.components)) return;   // shape mismatch → ignore
        restore(json);                                    // ohms restore() takes the JSON string
        toolHint('Opened a shared circuit. Press Run to simulate.');
      }).catch(function(){});                             // corrupt link → keep the seed circuit
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // after the synchronous boot above (rAF-free so it isn't throttled)
  })();

  /* ══════════════════════════════════════════════════════════
     Calculate mode — Ohm's law solver, formula wheel,
     series/parallel and voltage-divider calculators.
     ══════════════════════════════════════════════════════════ */
  var CALC = (function () {
    var KEYS = ['V', 'I', 'R', 'P'];
    var UNIT = { V: 'V', I: 'A', R: 'Ω', P: 'W' };
    // Most-recently-edited first. The two newest filled fields are the inputs;
    // the other two are derived, so typing a third value retires the oldest.
    var order = [];

    function el(id) { return document.getElementById(id); }
    // The share-link block has its own toolHint scoped to that IIFE, so keep a
    // local one here rather than reaching across scopes.
    function hint(m) { var h = document.getElementById('toolbar-hint'); if (h) h.textContent = m; }
    function field(k) { return el('c-' + k); }
    function mul(k) { var s = el('c-' + k + '-u'); return s ? parseFloat(s.value) || 1 : 1; }

    // SI value of a field, or null when blank/unparseable.
    function raw(k) {
      var i = field(k);
      if (!i || i.value.trim() === '') return null;
      var v = parseFloat(i.value);
      if (!isFinite(v)) return null;
      return v * mul(k);
    }

    function fmt(x) {
      if (!isFinite(x)) return '∞';
      var a = Math.abs(x);
      if (a !== 0 && a < 1e-4) return x.toExponential(3);
      if (a >= 1e6) return x.toExponential(3);
      var s = x.toPrecision(6);
      if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
      return s;
    }
    // Human-readable SI value for the working-steps text.
    function si(x, u) {
      if (!isFinite(x)) return '∞ ' + u;
      var a = Math.abs(x);
      if (a >= 1e6) return fmt(x / 1e6) + ' M' + u;
      if (a >= 1e3) return fmt(x / 1e3) + ' k' + u;
      if (a >= 1)   return fmt(x) + ' ' + u;
      if (a >= 1e-3) return fmt(x * 1e3) + ' m' + u;
      if (a > 0)     return fmt(x * 1e6) + ' µ' + u;
      return '0 ' + u;
    }
    // Write an SI value back into a field, choosing the unit option that keeps
    // the displayed number in a readable range.
    function put(k, val) {
      var i = field(k), sel = el('c-' + k + '-u');
      if (!i) return;
      if (val == null || !isFinite(val)) { i.value = ''; return; }
      if (sel) {
        var opts = Array.prototype.map.call(sel.options, function (o) { return parseFloat(o.value); });
        var best = 1, bestScore = Infinity;
        opts.forEach(function (m) {
          var d = Math.abs(val) / m;
          // prefer a display number in [1, 1000)
          var score = (d >= 1 && d < 1000) ? Math.abs(Math.log10(d) - 1) : 100 + Math.abs(Math.log10(d || 1e-30));
          if (score < bestScore) { bestScore = score; best = m; }
        });
        sel.value = String(best);
      }
      i.value = fmt(val / (parseFloat(sel && sel.value) || 1));
    }

    function bump(k) {
      var idx = order.indexOf(k);
      if (idx >= 0) order.splice(idx, 1);
      order.unshift(k);
    }

    // Which two the user most recently supplied.
    function activeInputs() {
      var filled = order.filter(function (k) { return raw(k) != null; });
      KEYS.forEach(function (k) { if (raw(k) != null && filled.indexOf(k) < 0) filled.push(k); });
      return filled.slice(0, 2);
    }

    function solveFrom(a, b, va, vb) {
      var key = [a, b].sort().join('');
      var out = {}, steps = [];
      function bad(msg) { return { err: msg }; }
      if (key === 'IV') {
        if (va === 0 && vb === 0) return bad('Both V and I are zero — R is undefined.');
        var V = a === 'V' ? va : vb, I = a === 'I' ? va : vb;
        if (I === 0) return bad('I = 0 makes R infinite (an open circuit).');
        out.R = V / I; out.P = V * I;
        steps.push('R = V ÷ I = ' + si(V, 'V') + ' ÷ ' + si(I, 'A') + ' = ' + si(out.R, 'Ω'));
        steps.push('P = V × I = ' + si(V, 'V') + ' × ' + si(I, 'A') + ' = ' + si(out.P, 'W'));
      } else if (key === 'RV') {
        var V2 = a === 'V' ? va : vb, R2 = a === 'R' ? va : vb;
        if (R2 === 0) return bad('R = 0 is a short circuit — current would be infinite.');
        out.I = V2 / R2; out.P = V2 * V2 / R2;
        steps.push('I = V ÷ R = ' + si(V2, 'V') + ' ÷ ' + si(R2, 'Ω') + ' = ' + si(out.I, 'A'));
        steps.push('P = V² ÷ R = ' + si(out.P, 'W'));
      } else if (key === 'PV') {
        var V3 = a === 'V' ? va : vb, P3 = a === 'P' ? va : vb;
        if (V3 === 0) return bad('V = 0 with non-zero power is not physically possible.');
        out.I = P3 / V3; out.R = V3 * V3 / P3;
        if (P3 === 0) return bad('P = 0 with a non-zero voltage means no current — R is infinite.');
        steps.push('I = P ÷ V = ' + si(P3, 'W') + ' ÷ ' + si(V3, 'V') + ' = ' + si(out.I, 'A'));
        steps.push('R = V² ÷ P = ' + si(out.R, 'Ω'));
      } else if (key === 'IR') {
        var I4 = a === 'I' ? va : vb, R4 = a === 'R' ? va : vb;
        out.V = I4 * R4; out.P = I4 * I4 * R4;
        steps.push('V = I × R = ' + si(I4, 'A') + ' × ' + si(R4, 'Ω') + ' = ' + si(out.V, 'V'));
        steps.push('P = I² × R = ' + si(out.P, 'W'));
      } else if (key === 'IP') {
        var I5 = a === 'I' ? va : vb, P5 = a === 'P' ? va : vb;
        if (I5 === 0) return bad('I = 0 with non-zero power is not physically possible.');
        out.V = P5 / I5; out.R = P5 / (I5 * I5);
        steps.push('V = P ÷ I = ' + si(P5, 'W') + ' ÷ ' + si(I5, 'A') + ' = ' + si(out.V, 'V'));
        steps.push('R = P ÷ I² = ' + si(out.R, 'Ω'));
      } else if (key === 'PR') {
        var P6 = a === 'P' ? va : vb, R6 = a === 'R' ? va : vb;
        if (R6 <= 0) return bad('R must be greater than zero to solve from P and R.');
        if (P6 < 0) return bad('Power cannot be negative in a purely resistive circuit.');
        out.V = Math.sqrt(P6 * R6); out.I = Math.sqrt(P6 / R6);
        steps.push('V = √(P × R) = √(' + si(P6, 'W') + ' × ' + si(R6, 'Ω') + ') = ' + si(out.V, 'V'));
        steps.push('I = √(P ÷ R) = ' + si(out.I, 'A'));
      } else {
        return bad('Enter any two different quantities.');
      }
      return { out: out, steps: steps };
    }

    function recalc() {
      var work = el('calc-work');
      var ins = activeInputs();
      KEYS.forEach(function (k) {
        var wrap = field(k) && field(k).closest('.calc-field');
        if (wrap) { wrap.classList.remove('is-derived'); }
      });
      if (ins.length < 2) {
        KEYS.forEach(function (k) { if (ins.indexOf(k) < 0) put(k, null); });
        if (work) work.textContent = ins.length === 0
          ? 'Enter any two values to solve.'
          : 'Enter one more value to solve.';
        return;
      }
      var a = ins[0], b = ins[1];
      var res = solveFrom(a, b, raw(a), raw(b));
      if (res.err) {
        KEYS.forEach(function (k) { if (ins.indexOf(k) < 0) put(k, null); });
        if (work) work.innerHTML = '<span class="cw-warn">⚠ ' + res.err + '</span>';
        return;
      }
      KEYS.forEach(function (k) {
        if (ins.indexOf(k) >= 0) return;
        put(k, res.out[k]);
        var wrap = field(k) && field(k).closest('.calc-field');
        if (wrap) wrap.classList.add('is-derived');
      });
      if (work) {
        work.innerHTML = '<span class="cw-step">Known: ' + a + ' and ' + b + '</span>' +
          res.steps.map(function (s) { return '<span class="cw-step">' + s + '</span>'; }).join('');
      }
    }

    /* ── Series / parallel ─────────────────────────────────── */
    var spVals = [220, 330];
    function spRender() {
      var list = el('sp-list');
      if (!list) return;
      list.innerHTML = spVals.map(function (v, i) {
        return '<div class="sp-row"><span class="sp-tag">R' + (i + 1) + '</span>' +
          '<input type="number" step="any" min="0" inputmode="decimal" data-sp="' + i + '" value="' + v + '" aria-label="Resistor ' + (i + 1) + ' in ohms">' +
          '<button class="sp-del" type="button" data-spdel="' + i + '" aria-label="Remove resistor ' + (i + 1) + '">&times;</button></div>';
      }).join('');
      list.querySelectorAll('input[data-sp]').forEach(function (inp) {
        inp.addEventListener('input', function () {
          var i = +inp.getAttribute('data-sp');
          var v = parseFloat(inp.value);
          spVals[i] = isFinite(v) ? v : 0;
          spCalc();
        });
      });
      list.querySelectorAll('button[data-spdel]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (spVals.length <= 1) return;
          spVals.splice(+btn.getAttribute('data-spdel'), 1);
          spRender(); spCalc();
        });
      });
    }
    function spCalc() {
      var vals = spVals.filter(function (v) { return isFinite(v) && v > 0; });
      var sEl = el('sp-series'), pEl = el('sp-parallel');
      var sEq = el('sp-series-eq'), pEq = el('sp-parallel-eq');
      var work = el('sp-work');
      if (!vals.length) {
        if (sEl) sEl.textContent = '—';
        if (pEl) pEl.textContent = '—';
        if (sEq) sEq.textContent = '';
        if (pEq) pEq.textContent = '';
        if (work) work.textContent = 'Add resistor values to calculate.';
        return;
      }
      var Rs = vals.reduce(function (a, b) { return a + b; }, 0);
      var invSum = vals.reduce(function (a, b) { return a + 1 / b; }, 0);
      var Rp = 1 / invSum;
      if (sEl) sEl.textContent = si(Rs, 'Ω');
      if (pEl) pEl.textContent = si(Rp, 'Ω');
      if (sEq) sEq.textContent = 'R = ' + vals.join(' + ') + ' Ω';
      if (pEq) pEq.textContent = '1/R = ' + vals.map(function (v) { return '1/' + v; }).join(' + ');
      var lines = [];
      lines.push('Series:   R = ' + vals.join(' + ') + ' = ' + si(Rs, 'Ω'));
      lines.push('Parallel: 1/R = ' + vals.map(function (v) { return '1/' + v; }).join(' + ') +
        ' = ' + fmt(invSum) + ' S  →  R = ' + si(Rp, 'Ω'));
      var vIn = parseFloat((el('sp-v') || {}).value);
      if (isFinite(vIn) && vIn !== 0) {
        lines.push('');
        lines.push('At ' + si(vIn, 'V') + ':');
        lines.push('  series  → I = ' + si(vIn / Rs, 'A') + ' (same through every resistor)');
        lines.push('  parallel → I_total = ' + si(vIn / Rp, 'A'));
        vals.forEach(function (v, i) {
          lines.push('     branch R' + (i + 1) + ' = ' + v + ' Ω → ' + si(vIn / v, 'A'));
        });
      }
      if (work) work.innerHTML = lines.map(function (l) { return '<span class="cw-step">' + (l || '&nbsp;') + '</span>'; }).join('');
    }

    /* ── Voltage divider ───────────────────────────────────── */
    function vdCalc() {
      var vin = parseFloat((el('vd-vin') || {}).value);
      var r1 = parseFloat((el('vd-r1') || {}).value);
      var r2 = parseFloat((el('vd-r2') || {}).value);
      var rl = parseFloat((el('vd-rl') || {}).value);
      var work = el('vd-work');
      if (!work) return;
      if (!isFinite(vin) || !isFinite(r1) || !isFinite(r2) || r1 < 0 || r2 < 0) {
        work.innerHTML = '<span class="cw-warn">⚠ Enter V_in, R₁ and R₂.</span>';
        return;
      }
      if (r1 + r2 === 0) {
        work.innerHTML = '<span class="cw-warn">⚠ R₁ + R₂ = 0 is a short across the supply.</span>';
        return;
      }
      var lines = [];
      var vout = vin * r2 / (r1 + r2);
      var i = vin / (r1 + r2);
      lines.push('V_out = V_in × R₂ ÷ (R₁ + R₂)');
      lines.push('      = ' + si(vin, 'V') + ' × ' + r2 + ' ÷ ' + (r1 + r2) + ' = ' + si(vout, 'V'));
      lines.push('I     = ' + si(i, 'A') + '   (same through both resistors)');
      lines.push('P_R1  = ' + si(i * i * r1, 'W') + ',  P_R2 = ' + si(i * i * r2, 'W'));
      if (isFinite(rl) && rl > 0) {
        // A load across R2 sits in parallel with it, which pulls V_out down —
        // the mistake that catches people out when they size a divider.
        var r2p = 1 / (1 / r2 + 1 / rl);
        var voutL = vin * r2p / (r1 + r2p);
        lines.push('');
        lines.push('With R_load = ' + si(rl, 'Ω') + ' across R₂:');
        lines.push('  R₂ ∥ R_load = ' + si(r2p, 'Ω'));
        lines.push('  V_out = ' + si(voutL, 'V') + '  (drops ' + si(vout - voutL, 'V') +
          ', ' + (vout !== 0 ? (100 * (vout - voutL) / vout).toFixed(1) : '0') + '% below the unloaded value)');
      }
      work.innerHTML = lines.map(function (l) { return '<span class="cw-step">' + (l || '&nbsp;') + '</span>'; }).join('');
    }

    /* ── Hand a calculated result to the builder ───────────── */
    function switchToSimulate() {
      var tabs = document.getElementById('mode-tabs');
      if (!tabs) return;
      var target = tabs.querySelector('.pill[data-mode="simulate"]');
      if (!target) return;
      tabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p === target); });
      currentMode = 'simulate';
      applyMode();
    }
    function buildSimple() {
      var V = raw('V'), R = raw('R');
      if (V == null || R == null || !isFinite(V) || !isFinite(R) || R <= 0) {
        hint('Enter enough values for a voltage and a resistance first.');
        return;
      }
      saveUndo(); clearCanvas();
      var b = addComp('battery', 80, 200, { V: +V.toPrecision(6) });
      var a = addComp('ammeter', 240, 200);
      var r = addComp('resistor', 400, 200, { R: +R.toPrecision(6) });
      var vm = addComp('voltmeter', 400, 340);
      var g = addComp('ground', 240, 380);
      addConn(b, 0, a, 0);
      addConn(a, 1, r, 0);
      addConn(r, 1, g, 0, [{x:460,y:200},{x:460,y:360},{x:240,y:360}]);
      addConn(b, 1, g, 0, [{x:40,y:200},{x:40,y:360},{x:240,y:360}]);
      addConn(r, 0, vm, 0, [{x:360,y:200},{x:360,y:340}]);
      addConn(r, 1, vm, 1, [{x:460,y:200},{x:460,y:280},{x:430,y:280},{x:430,y:340}]);
      switchToSimulate();
      fitAll();
      hint('Built from the calculator — press Run Circuit to energise it.');
    }
    function buildDivider() {
      var vin = parseFloat((el('vd-vin') || {}).value);
      var r1 = parseFloat((el('vd-r1') || {}).value);
      var r2 = parseFloat((el('vd-r2') || {}).value);
      if (!isFinite(vin) || !isFinite(r1) || !isFinite(r2) || r1 <= 0 || r2 <= 0) {
        hint('Enter V_in, R₁ and R₂ first.');
        return;
      }
      saveUndo(); clearCanvas();
      var b = addComp('battery', 80, 240, { V: +vin.toPrecision(6) });
      var ra = addComp('resistor', 300, 140, { R: +r1.toPrecision(6) }, 90);
      var rb = addComp('resistor', 300, 340, { R: +r2.toPrecision(6) }, 90);
      var vm = addComp('voltmeter', 470, 340);
      var g = addComp('ground', 140, 440);
      addConn(b, 0, ra, 0, [{x:80,y:100},{x:300,y:100}]);
      addConn(ra, 1, rb, 0);
      addConn(rb, 1, g, 0, [{x:300,y:420},{x:140,y:420}]);
      addConn(b, 1, g, 0, [{x:40,y:240},{x:40,y:420},{x:140,y:420}]);
      addConn(rb, 0, vm, 0, [{x:370,y:240},{x:370,y:300},{x:440,y:300},{x:440,y:340}]);
      addConn(rb, 1, vm, 1, [{x:300,y:420},{x:520,y:420},{x:520,y:370}]);
      switchToSimulate();
      fitAll();
      hint('Divider built — press Run Circuit; the voltmeter reads V_out.');
    }

    function init() {
      KEYS.forEach(function (k) {
        var i = field(k), s = el('c-' + k + '-u');
        if (i) i.addEventListener('input', function () {
          if (i.value.trim() === '') {
            var idx = order.indexOf(k);
            if (idx >= 0) order.splice(idx, 1);
          } else bump(k);
          recalc();
        });
        if (s) s.addEventListener('change', function () { if (raw(k) != null) bump(k); recalc(); });
      });
      var clr = el('calc-clear');
      if (clr) clr.addEventListener('click', function () {
        order = [];
        KEYS.forEach(function (k) {
          var i = field(k);
          if (i) i.value = '';
          var wrap = i && i.closest('.calc-field');
          if (wrap) wrap.classList.remove('is-derived');
        });
        recalc();
      });
      var tb = el('calc-to-builder');
      if (tb) tb.addEventListener('click', buildSimple);
      var vtb = el('vd-to-builder');
      if (vtb) vtb.addEventListener('click', buildDivider);

      spRender(); spCalc();
      var add = el('sp-add');
      if (add) add.addEventListener('click', function () {
        if (spVals.length >= 12) return;
        spVals.push(100); spRender(); spCalc();
      });
      var rst = el('sp-reset');
      if (rst) rst.addEventListener('click', function () { spVals = [220, 330]; spRender(); spCalc(); });
      var spv = el('sp-v');
      if (spv) spv.addEventListener('input', spCalc);

      ['vd-vin', 'vd-r1', 'vd-r2', 'vd-rl'].forEach(function (id) {
        var e = el(id);
        if (e) e.addEventListener('input', vdCalc);
      });
      vdCalc();
    }

    return { init: init, recalc: recalc };
  })();
  CALC.init();

})();
