(function () {
  'use strict';

  /* ================================================================
     SECTION 1 — DOM REFS, CONSTANTS
     ================================================================ */

  var cvs = document.getElementById('ladder-canvas');
  var ctx = cvs.getContext('2d');
  var W = 900, H = 540;
  var CELL_W = 80, CELL_H = 70;
  var COLS = 8;
  var RAIL_X_L = 40;
  var RAIL_X_R = RAIL_X_L + (COLS + 1) * CELL_W;
  var IO_PANEL_W = 170;
  var RUNG_HEADER = 18;
  var _fontFamily = 'system-ui, -apple-system, "Segoe UI", sans-serif';
  var _monoFont = '"SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace';

  /* DOM panels */
  var simPanel      = document.getElementById('sim-panel');
  var catRow        = document.getElementById('cat-row');
  var catTabs       = document.getElementById('cat-tabs');
  var itemSelector  = document.getElementById('item-selector');
  var conceptGrid   = document.getElementById('concept-grid');
  var itemInfo      = document.getElementById('item-info');
  var practicePanel = document.getElementById('practice-panel');
  var practiceBar   = document.getElementById('practice-bar');
  var quizPanel     = document.getElementById('quiz-panel');
  var quizBar       = document.getElementById('quiz-bar');
  var quizResult    = document.getElementById('quiz-result');
  var palette       = document.getElementById('palette');
  var propsPanel    = document.getElementById('props-panel');
  var propsBody     = document.getElementById('props-body');
  var programDesc   = document.getElementById('program-desc');
  var presetTabs    = document.getElementById('preset-tabs');
  var warningBar    = document.getElementById('warning-bar');
  var readoutsBar   = document.getElementById('sim-readouts');
  var ctxMenu       = document.getElementById('ctx-menu');

  /* Readout elements */
  var rScanTime    = document.getElementById('r-scan-time');
  var rCycleCount  = document.getElementById('r-cycle-count');
  var rActiveRungs = document.getElementById('r-active-rungs');
  var rMemory      = document.getElementById('r-memory');
  var statScanTime = document.getElementById('stat-scan-time');
  var statCycleCount = document.getElementById('stat-cycle-count');

  /* Buttons */
  var btnRun     = document.getElementById('btn-run');
  var btnStop    = document.getElementById('btn-stop');
  var btnStep    = document.getElementById('btn-step');
  var btnUndo    = document.getElementById('btn-undo');
  var btnDelete  = document.getElementById('btn-delete');
  var btnClear   = document.getElementById('btn-clear');
  var btnAddRung = document.getElementById('btn-add-rung');
  var toolbarHint = document.getElementById('toolbar-hint');

  /* Practice DOM */
  var ppPrompt   = document.getElementById('pp-prompt');
  var ppInput    = document.getElementById('pp-input');
  var ppUnit     = document.getElementById('pp-unit');
  var ppCheck    = document.getElementById('pp-check');
  var ppNext     = document.getElementById('pp-next');
  var ppFeedback = document.getElementById('pp-feedback');
  var ppSolution = document.getElementById('pp-solution');
  var pbarScoreVal = document.getElementById('pbar-score-val');

  /* Quiz DOM */
  var qbarNum = document.getElementById('qbar-num');

  /* ================================================================
     SECTION 2 — COMP_DEFS  (22 instruction types)
     ================================================================ */

  var COMP_DEFS = {
    /* ── Contacts ────────────────────────────────────────────── */
    'contact-no': {
      name: 'NO Contact', cat: 'contacts', symbol: '[ ]',
      cellsW: 1, cellsH: 1, isContact: true, isCoil: false, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'I0.0' } }
    },
    'contact-nc': {
      name: 'NC Contact', cat: 'contacts', symbol: '[/]',
      cellsW: 1, cellsH: 1, isContact: true, isCoil: false, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'I0.1' } }
    },
    'contact-pos': {
      name: 'Positive Edge', cat: 'contacts', symbol: '[P]',
      cellsW: 1, cellsH: 1, isContact: true, isCoil: false, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'I0.0' } }
    },
    'contact-neg': {
      name: 'Negative Edge', cat: 'contacts', symbol: '[N]',
      cellsW: 1, cellsH: 1, isContact: true, isCoil: false, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'I0.0' } }
    },
    /* ── Coils ───────────────────────────────────────────────── */
    'coil': {
      name: 'Output Coil', cat: 'coils', symbol: '( )',
      cellsW: 1, cellsH: 1, isContact: false, isCoil: true, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'Q0.0' } }
    },
    'coil-set': {
      name: 'Set (Latch)', cat: 'coils', symbol: '(S)',
      cellsW: 1, cellsH: 1, isContact: false, isCoil: true, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'Q0.0' } }
    },
    'coil-reset': {
      name: 'Reset (Unlatch)', cat: 'coils', symbol: '(R)',
      cellsW: 1, cellsH: 1, isContact: false, isCoil: true, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'Q0.0' } }
    },
    'coil-neg': {
      name: 'Negated Coil', cat: 'coils', symbol: '(/)',
      cellsW: 1, cellsH: 1, isContact: false, isCoil: true, isBlock: false,
      params: { address: { label: 'Address', type: 'text', def: 'Q0.0' } }
    },
    'res': {
      name: 'RES (Reset T/C)', cat: 'coils', symbol: '(R?)',
      cellsW: 1, cellsH: 1, isContact: false, isCoil: true, isBlock: false,
      params: { address: { label: 'Timer/Counter', type: 'text', def: 'T0' } }
    },
    /* ── Timers ──────────────────────────────────────────────── */
    'ton': {
      name: 'TON (On-Delay)', cat: 'timers', symbol: 'TON',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: false, isBlock: true,
      params: {
        address: { label: 'Timer', type: 'text', def: 'T0' },
        preset:  { label: 'Preset (ms)', type: 'number', def: 3000 }
      }
    },
    'tof': {
      name: 'TOF (Off-Delay)', cat: 'timers', symbol: 'TOF',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: false, isBlock: true,
      params: {
        address: { label: 'Timer', type: 'text', def: 'T1' },
        preset:  { label: 'Preset (ms)', type: 'number', def: 3000 }
      }
    },
    'tp': {
      name: 'TP (Pulse)', cat: 'timers', symbol: 'TP',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: false, isBlock: true,
      params: {
        address: { label: 'Timer', type: 'text', def: 'T2' },
        preset:  { label: 'Preset (ms)', type: 'number', def: 1000 }
      }
    },
    'rto': {
      name: 'RTO (Retentive)', cat: 'timers', symbol: 'RTO',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: false, isBlock: true,
      params: {
        address: { label: 'Timer', type: 'text', def: 'T3' },
        preset:  { label: 'Preset (ms)', type: 'number', def: 5000 }
      }
    },
    /* ── Counters ────────────────────────────────────────────── */
    'ctu': {
      name: 'CTU (Count Up)', cat: 'counters', symbol: 'CTU',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: false, isBlock: true,
      params: {
        address: { label: 'Counter', type: 'text', def: 'C0' },
        preset:  { label: 'Preset', type: 'number', def: 10 },
        reset:   { label: 'Reset Address', type: 'text', def: '' }
      }
    },
    'ctd': {
      name: 'CTD (Count Down)', cat: 'counters', symbol: 'CTD',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: false, isBlock: true,
      params: {
        address: { label: 'Counter', type: 'text', def: 'C1' },
        preset:  { label: 'Preset', type: 'number', def: 10 }
      }
    },
    'ctud': {
      name: 'CTUD (Up/Down)', cat: 'counters', symbol: 'CTUD',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: false, isBlock: true,
      params: {
        address: { label: 'Counter', type: 'text', def: 'C2' },
        preset:  { label: 'Preset', type: 'number', def: 10 },
        downSrc: { label: 'Down Input (CD)', type: 'text', def: 'I0.1' }
      }
    },
    /* ── Compare ─────────────────────────────────────────────── */
    'equ': {
      name: 'EQU (Equal)', cat: 'compare', symbol: 'EQU',
      cellsW: 2, cellsH: 1, isContact: true, isCoil: false, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' }
      }
    },
    'neq': {
      name: 'NEQ (Not Equal)', cat: 'compare', symbol: 'NEQ',
      cellsW: 2, cellsH: 1, isContact: true, isCoil: false, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' }
      }
    },
    'grt': {
      name: 'GRT (Greater)', cat: 'compare', symbol: 'GRT',
      cellsW: 2, cellsH: 1, isContact: true, isCoil: false, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' }
      }
    },
    'les': {
      name: 'LES (Less Than)', cat: 'compare', symbol: 'LES',
      cellsW: 2, cellsH: 1, isContact: true, isCoil: false, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' }
      }
    },
    'geq': {
      name: 'GEQ (Greater or Equal)', cat: 'compare', symbol: 'GEQ',
      cellsW: 2, cellsH: 1, isContact: true, isCoil: false, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' }
      }
    },
    'leq': {
      name: 'LEQ (Less or Equal)', cat: 'compare', symbol: 'LEQ',
      cellsW: 2, cellsH: 1, isContact: true, isCoil: false, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' }
      }
    },
    /* ── Math ────────────────────────────────────────────────── */
    'mov': {
      name: 'MOV (Move)', cat: 'math', symbol: 'MOV',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: true, isBlock: true,
      params: {
        src:  { label: 'Source', type: 'text', def: 'D0' },
        dest: { label: 'Destination', type: 'text', def: 'D1' }
      }
    },
    'add': {
      name: 'ADD', cat: 'math', symbol: 'ADD',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: true, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' },
        dest: { label: 'Destination', type: 'text', def: 'D2' }
      }
    },
    'sub': {
      name: 'SUB', cat: 'math', symbol: 'SUB',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: true, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' },
        dest: { label: 'Destination', type: 'text', def: 'D2' }
      }
    },
    'mul': {
      name: 'MUL (Multiply)', cat: 'math', symbol: 'MUL',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: true, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' },
        dest: { label: 'Destination', type: 'text', def: 'D2' }
      }
    },
    'div': {
      name: 'DIV (Divide)', cat: 'math', symbol: 'DIV',
      cellsW: 2, cellsH: 1, isContact: false, isCoil: true, isBlock: true,
      params: {
        srcA: { label: 'Source A', type: 'text', def: 'D0' },
        srcB: { label: 'Source B', type: 'text', def: 'D1' },
        dest: { label: 'Destination', type: 'text', def: 'D2' }
      }
    },
    /* ── Structure ───────────────────────────────────────────── */
    'branch-start': {
      name: 'Branch Start (OR)', cat: 'structure', symbol: '|+',
      cellsW: 0, cellsH: 0, isContact: false, isCoil: false, isBlock: false,
      isBranch: true, params: {}
    },
    'branch-end': {
      name: 'Branch End', cat: 'structure', symbol: '+|',
      cellsW: 0, cellsH: 0, isContact: false, isCoil: false, isBlock: false,
      isBranch: true, params: {}
    }
  };

  /* ================================================================
     SECTION 2.5 — BLOCK_DEFS (FBD block catalog, 18 types)
     ----------------------------------------------------------------
     Each block entry declares:
       name      — display label
       cat       — palette category (io | logic | timers | counters | latch | edge)
       w, h      — block dimensions in pixels
       inputs    — array of port names (drawn on left edge)
       outputs   — array of port names (drawn on right edge)
       params    — { paramKey: { label, type, def } } — user-editable
       evaluate  — function(block, ins) → { portName: value } for output ports.
                   Pure for stateless gates; stateful blocks read/write PLC state
                   (timers/counters/memory) via closures over the module scope.
     ================================================================ */

  var FBD_PALETTE_CATS = ['io', 'logic', 'timers', 'counters', 'compare', 'math', 'latch', 'edge'];

  var BLOCK_DEFS = {
    /* ── I/O ─────────────────────────────────────────────────── */
    'input': {
      name: 'Input Var', cat: 'io', w: 80, h: 48,
      inputs: [], outputs: ['out'],
      params: { address: { label: 'Address', type: 'text', def: 'I0.0' } },
      evaluate: function (b) { return { out: getAddress(b.address) === true }; }
    },
    'output': {
      name: 'Output Var', cat: 'io', w: 80, h: 48,
      inputs: ['in'], outputs: [],
      params: { address: { label: 'Address', type: 'text', def: 'Q0.0' } },
      evaluate: function (b, ins) { /* commit in phase 4 */ return {}; }
    },
    /* ── Logic gates ─────────────────────────────────────────── */
    'and':  { name: 'AND',  cat: 'logic', w: 90, h: 60, inputs: ['in1','in2'], outputs: ['out'], params: {},
              evaluate: function (b, ins) { return { out: !!ins.in1 && !!ins.in2 }; } },
    'or':   { name: 'OR',   cat: 'logic', w: 90, h: 60, inputs: ['in1','in2'], outputs: ['out'], params: {},
              evaluate: function (b, ins) { return { out: !!ins.in1 || !!ins.in2 }; } },
    'not':  { name: 'NOT',  cat: 'logic', w: 80, h: 48, inputs: ['in'],        outputs: ['out'], params: {},
              evaluate: function (b, ins) { return { out: !ins.in }; } },
    'xor':  { name: 'XOR',  cat: 'logic', w: 90, h: 60, inputs: ['in1','in2'], outputs: ['out'], params: {},
              evaluate: function (b, ins) { return { out: !!ins.in1 !== !!ins.in2 }; } },
    'nand': { name: 'NAND', cat: 'logic', w: 90, h: 60, inputs: ['in1','in2'], outputs: ['out'], params: {},
              evaluate: function (b, ins) { return { out: !(ins.in1 && ins.in2) }; } },
    'nor':  { name: 'NOR',  cat: 'logic', w: 90, h: 60, inputs: ['in1','in2'], outputs: ['out'], params: {},
              evaluate: function (b, ins) { return { out: !(ins.in1 || ins.in2) }; } },
    /* ── Timers ──────────────────────────────────────────────── */
    /* Timers use evaluate (pure — reads current DN) + commit (mutates
       state once per scan with final settled inputs). This prevents the
       fixpoint iteration from restarting/resetting timers on every pass
       when there's feedback (e.g. self-retriggering TP for a flashing
       beacon: TP.q → NOT → AND → TP.en). */
    'fbd-ton': {
      name: 'TON', cat: 'timers', w: 120, h: 76, inputs: ['en'], outputs: ['q'],
      params: { address: { label: 'Timer', type: 'text', def: 'T0' },
                preset:  { label: 'Preset (ms)', type: 'number', def: 3000 } },
      evaluate: function (b) {
        var t = timers[b.address];
        return { q: t ? t.DN : false };
      },
      commit: function (b, ins) {
        updateTimer({ type: 'ton', address: b.address, params: b.params }, !!ins.en);
      }
    },
    'fbd-tof': {
      name: 'TOF', cat: 'timers', w: 120, h: 76, inputs: ['en'], outputs: ['q'],
      params: { address: { label: 'Timer', type: 'text', def: 'T1' },
                preset:  { label: 'Preset (ms)', type: 'number', def: 3000 } },
      evaluate: function (b) {
        var t = timers[b.address];
        return { q: t ? t.DN : false };
      },
      commit: function (b, ins) {
        updateTimer({ type: 'tof', address: b.address, params: b.params }, !!ins.en);
      }
    },
    'fbd-tp': {
      name: 'TP', cat: 'timers', w: 120, h: 76, inputs: ['en'], outputs: ['q'],
      params: { address: { label: 'Timer', type: 'text', def: 'T2' },
                preset:  { label: 'Preset (ms)', type: 'number', def: 1000 } },
      evaluate: function (b) {
        var t = timers[b.address];
        return { q: t ? t.DN : false };
      },
      commit: function (b, ins) {
        updateTimer({ type: 'tp', address: b.address, params: b.params }, !!ins.en);
      }
    },
    /* ── Counters ────────────────────────────────────────────── */
    'fbd-ctu': {
      name: 'CTU', cat: 'counters', w: 120, h: 76, inputs: ['cu','r'], outputs: ['q'],
      params: { address: { label: 'Counter', type: 'text', def: 'C0' },
                preset:  { label: 'Preset', type: 'number', def: 5 } },
      evaluate: function (b) {
        var c = counters[b.address];
        return { q: c ? c.DN : false };
      },
      commit: function (b, ins) {
        var el = { type: 'ctu', address: b.address, params: { preset: b.params.preset, reset: '' } };
        if (ins.r) {
          /* IEC 61131-3 CTU: R is DOMINANT — while held, CV stays 0 and CU
             edges are ignored. Track _prevCU so releasing R with CU already
             high does not count a phantom edge. */
          updateCounter(el, false); /* ensure the counter exists */
          var c = counters[b.address];
          c.CV = 0; c.DN = false; c.OV = false;
          c._prevCU = !!ins.cu;
          c.CU = !!ins.cu;
        } else {
          updateCounter(el, !!ins.cu);
        }
      }
    },
    'fbd-ctd': {
      name: 'CTD', cat: 'counters', w: 120, h: 76, inputs: ['cd','ld'], outputs: ['q'],
      params: { address: { label: 'Counter', type: 'text', def: 'C1' },
                preset:  { label: 'Preset', type: 'number', def: 5 } },
      evaluate: function (b) {
        var c = counters[b.address];
        return { q: c ? c.DN : false };
      },
      commit: function (b, ins) {
        var el = { type: 'ctd', address: b.address, params: { preset: b.params.preset } };
        if (ins.ld) {
          /* IEC 61131-3 CTD: LD is DOMINANT — while held, CV stays at PV and
             CD edges are ignored. */
          updateCounter(el, false); /* ensure the counter exists */
          var c = counters[b.address];
          c.CV = _sanePreset(b.params.preset, 5);
          c.DN = c.CV <= 0;
          c._prevCD = !!ins.cd;
          c.CD = !!ins.cd;
        } else {
          updateCounter(el, !!ins.cd);
        }
      }
    },
    /* ── Compare (source blocks: read data operands, emit BOOL) ──
       Operands may be D registers, literals, T0 (=ACC) or C0 (=CV),
       mirroring the ladder EQU/NEQ/GRT/LES instructions. */
    'fbd-gt': {
      name: 'GT', cat: 'compare', w: 110, h: 60, inputs: [], outputs: ['q'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' } },
      evaluate: function (b) { return { q: getRegister(b.params.srcA) > getRegister(b.params.srcB) }; }
    },
    'fbd-lt': {
      name: 'LT', cat: 'compare', w: 110, h: 60, inputs: [], outputs: ['q'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' } },
      evaluate: function (b) { return { q: getRegister(b.params.srcA) < getRegister(b.params.srcB) }; }
    },
    'fbd-eq': {
      name: 'EQ', cat: 'compare', w: 110, h: 60, inputs: [], outputs: ['q'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' } },
      evaluate: function (b) { return { q: getRegister(b.params.srcA) === getRegister(b.params.srcB) }; }
    },
    'fbd-ne': {
      name: 'NE', cat: 'compare', w: 110, h: 60, inputs: [], outputs: ['q'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' } },
      evaluate: function (b) { return { q: getRegister(b.params.srcA) !== getRegister(b.params.srcB) }; }
    },
    'fbd-ge': {
      name: 'GE', cat: 'compare', w: 110, h: 60, inputs: [], outputs: ['q'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' } },
      evaluate: function (b) { return { q: getRegister(b.params.srcA) >= getRegister(b.params.srcB) }; }
    },
    'fbd-le': {
      name: 'LE', cat: 'compare', w: 110, h: 60, inputs: [], outputs: ['q'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' } },
      evaluate: function (b) { return { q: getRegister(b.params.srcA) <= getRegister(b.params.srcB) }; }
    },
    /* ── Math (EN-gated; write in the COMMIT phase with settled EN so the
       fixpoint iteration never double-executes them; ENO passes EN through) ── */
    'fbd-mov': {
      name: 'MOV', cat: 'math', w: 110, h: 64, inputs: ['en'], outputs: ['eno'],
      params: { src:  { label: 'Source', type: 'text', def: 'D0' },
                dest: { label: 'Destination', type: 'text', def: 'D1' } },
      evaluate: function (b, ins) { return { eno: !!ins.en }; },
      commit: function (b, ins) {
        if (ins.en && b.params.dest) registers[b.params.dest] = getRegister(b.params.src);
      }
    },
    'fbd-add': {
      name: 'ADD', cat: 'math', w: 110, h: 64, inputs: ['en'], outputs: ['eno'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' },
                dest: { label: 'Destination', type: 'text', def: 'D2' } },
      evaluate: function (b, ins) { return { eno: !!ins.en }; },
      commit: function (b, ins) {
        if (ins.en && b.params.dest) registers[b.params.dest] = getRegister(b.params.srcA) + getRegister(b.params.srcB);
      }
    },
    'fbd-sub': {
      name: 'SUB', cat: 'math', w: 110, h: 64, inputs: ['en'], outputs: ['eno'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' },
                dest: { label: 'Destination', type: 'text', def: 'D2' } },
      evaluate: function (b, ins) { return { eno: !!ins.en }; },
      commit: function (b, ins) {
        if (ins.en && b.params.dest) registers[b.params.dest] = getRegister(b.params.srcA) - getRegister(b.params.srcB);
      }
    },
    'fbd-mul': {
      name: 'MUL', cat: 'math', w: 110, h: 64, inputs: ['en'], outputs: ['eno'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' },
                dest: { label: 'Destination', type: 'text', def: 'D2' } },
      evaluate: function (b, ins) { return { eno: !!ins.en }; },
      commit: function (b, ins) {
        if (ins.en && b.params.dest) registers[b.params.dest] = getRegister(b.params.srcA) * getRegister(b.params.srcB);
      }
    },
    'fbd-div': {
      name: 'DIV', cat: 'math', w: 110, h: 64, inputs: ['en'], outputs: ['eno'],
      params: { srcA: { label: 'Source A', type: 'text', def: 'D0' },
                srcB: { label: 'Source B', type: 'text', def: 'D1' },
                dest: { label: 'Destination', type: 'text', def: 'D2' } },
      evaluate: function (b, ins) { return { eno: !!ins.en }; },
      commit: function (b, ins) {
        if (!ins.en || !b.params.dest) return;
        var dv = getRegister(b.params.srcB);
        /* Divide-by-zero holds the destination (see the ladder DIV note) */
        if (dv === 0) {
          b._mathFault = true;
          showWarning('DIV by zero on ' + (b.params.srcB || 'Source B') +
                      ' — destination ' + b.params.dest + ' left unchanged. A real PLC would set a math fault bit.');
        } else {
          b._mathFault = false;
          registers[b.params.dest] = getRegister(b.params.srcA) / dv;
        }
      }
    },
    /* ── Latches ─────────────────────────────────────────────────
       Like the timers/counters, latches use evaluate (pure — returns the
       STORED state) + commit (writes memory once per scan with the settled
       inputs). Writing memory inside evaluate let transient not-yet-settled
       values in feedback graphs spuriously set the latch — and a latch
       remembers, so the wrong state survived. Returning the stored state
       also keeps negative-feedback loops (q → NOT → s) convergent; the new
       state appears on q one scan later, standard block-execution latency. */
    'sr': {
      /* SET-dominant: when both S and R are true, S wins (Q=true) */
      name: 'SR', cat: 'latch', w: 100, h: 60, inputs: ['s','r'], outputs: ['q'],
      params: { address: { label: 'Memory', type: 'text', def: 'M0.0' } },
      evaluate: function (b) {
        return { q: !!getAddress(b.address) };
      },
      commit: function (b, ins) {
        if (ins.s) setAddress(b.address, true);
        else if (ins.r) setAddress(b.address, false);
      }
    },
    'rs': {
      /* RESET-dominant: when both are true, R wins (Q=false) */
      name: 'RS', cat: 'latch', w: 100, h: 60, inputs: ['s','r'], outputs: ['q'],
      params: { address: { label: 'Memory', type: 'text', def: 'M0.0' } },
      evaluate: function (b) {
        return { q: !!getAddress(b.address) };
      },
      commit: function (b, ins) {
        if (ins.r) setAddress(b.address, false);
        else if (ins.s) setAddress(b.address, true);
      }
    },
    /* ── Edge detectors ──────────────────────────────────────── */
    /* _edgePrev holds the clk value AT THE START of this scan. During the
       fixpoint iteration we MUST NOT mutate it, otherwise the edge pulse
       gets "consumed" by the first pass and disappears. The evaluator
       commits `_edgePrev = clk` once after the fixpoint converges. */
    'r_trig': {
      name: 'R_TRIG', cat: 'edge', w: 100, h: 48, inputs: ['clk'], outputs: ['q'],
      params: {},
      evaluate: function (b, ins) {
        return { q: !!ins.clk && !b._edgePrev };
      },
      commit: function (b, ins) { b._edgePrev = !!ins.clk; }
    },
    'f_trig': {
      name: 'F_TRIG', cat: 'edge', w: 100, h: 48, inputs: ['clk'], outputs: ['q'],
      params: {},
      evaluate: function (b, ins) {
        return { q: !ins.clk && !!b._edgePrev };
      },
      commit: function (b, ins) { b._edgePrev = !!ins.clk; }
    }
  };

  /* ================================================================
     SECTION 3 — STATE VARIABLES
     ================================================================ */

  var mode = 'simulate';
  var running = false;
  var stepping = false;
  var simTime = 0;
  var scanCount = 0;
  var lastTime = 0;
  var animFrame = null;
  var scanDurationMs = 0;

  /* Address space */
  var inputs   = {};
  var outputs  = {};
  var memory   = {};
  var timers   = {};
  var counters = {};
  var registers = {};

  /* Initialise addresses */
  var i, m;
  for (i = 0; i < 8; i++) {
    inputs['I0.' + i]  = false;
    outputs['Q0.' + i] = false;
  }
  for (m = 0; m < 16; m++) {
    memory['M0.' + m] = false;
  }
  for (i = 0; i < 8; i++) registers['D' + i] = 0;

  /* Program defaults for data registers. A preset's setpoints/constants are
     part of the PROGRAM, so Reset restores these rather than zeroing (see
     resetSim). Presets declare them via _setRegisterDefault(). */
  var registerDefaults = {};
  function _setRegisterDefault(addr, val) {
    registerDefaults[addr] = val;
    registers[addr] = val;
  }

  /* I/O labels */
  var inputLabels  = ['Start', 'Stop', 'Sensor1', 'Sensor2', '', '', '', ''];
  var outputLabels = ['Motor', 'Valve', 'Lamp', 'Alarm', '', '', '', ''];

  /* Input kinds — lets the user pick how each input behaves:
       'toggle' → maintained switch (click flips state; default for all inputs)
       'mom-no' → momentary NO push button (rest=OFF, active while held)
       'mom-nc' → momentary NC push button (rest=ON, active-low while held;
                  matches a fail-safe Stop / Emergency button)
     Store per-address so each input can be configured independently. */
  var inputKinds = {};
  function _inputKind(addr) { return inputKinds[addr] || 'toggle'; }

  /* Ladder program */
  var rungs = [];
  var nextRungId = 1;

  /* FBD program — graph of blocks connected by directed wires. Shared I/O
     space with ladder (same I/Q/M/T/C addresses) but a separate program.
     viewMode picks which program is active; the other persists. */
  var viewMode = 'ladder';      /* 'ladder' | 'fbd' */
  var fbdBlocks = [];
  var fbdWires  = [];
  var nextFbdBlockId = 1;
  var nextFbdWireId  = 1;

  /* View transform (zoom + pan) — applies to BOTH ladder and FBD canvas */
  var viewOffX = 0, viewOffY = 0, viewScale = 1;
  var panMode = false;
  var panActive = false, panStartX = 0, panStartY = 0, panOffX0 = 0, panOffY0 = 0;

  /* Annotation system (ported from pneumatic-circuit) — works in both views.
     Strokes and shapes are stored in WORLD coords so they track zoom/pan. */
  var annStrokes = [];
  var annShapes  = [];
  var annActiveStroke = null;
  var annActiveShape  = null;
  var annTool         = 'move';   /* 'move' | 'sketch' | 'shape' */
  var sketchColor = '#ffffff';
  var sketchWidth = 2;
  var shapeType   = 'rect';
  var shapeColor  = '#ffffff';
  var shapeWidth  = 2;
  var shapeFilled = false;
  var showAnnotations = true;
  var annSelectedIdx  = -1;
  var annSelectedType = '';
  var annDrag = null;
  var annCursorPos = null;

  /* FBD editor state */
  var fbdSelectedBlockId = null;
  var fbdSelectedWireId  = null;
  var fbdMove = null;           /* { blockId, offsetX, offsetY, undoSaved } during drag */
  var fbdWireDraft = null;      /* { blockId, port, waypoints:[] } while connecting */
  var fbdWireSegDrag = null;    /* { wireId, segIdx, axis, startVal, undoSaved } while reshaping */
  var fbdMouse = { x: 0, y: 0 };
  /* Port hover state (ported from pneumatic) */
  var hoveredPort = null;       /* { block, port, side } when mouse is near a port */
  var hoveredPortSX = 0;        /* CSS-px screen X of the hovered port (for tooltip) */
  var hoveredPortSY = 0;        /* CSS-px screen Y */
  var hoveredBlockId = null;    /* block currently under cursor (for port label visibility) */

  /* Port description dictionary — shown in tooltip on hover.
     Keyed by "blockType:portName". Falls back to "portName" only. */
  var PORT_DESC = {
    /* I/O */
    'input:out':    'Reads the bit at this address — emits BOOL',
    'output:in':    'Writes to the output address when powered',
    /* Logic gates */
    'and:in1':      'Boolean input 1',
    'and:in2':      'Boolean input 2',
    'and:out':      'TRUE when ALL inputs are TRUE',
    'or:in1':       'Boolean input 1',
    'or:in2':       'Boolean input 2',
    'or:out':       'TRUE when ANY input is TRUE',
    'not:in':       'Boolean input to invert',
    'not:out':      'Logical NOT of input',
    'xor:in1':      'Boolean input 1',
    'xor:in2':      'Boolean input 2',
    'xor:out':      'TRUE when inputs differ',
    'nand:in1':     'Boolean input 1',
    'nand:in2':     'Boolean input 2',
    'nand:out':     'NOT(in1 AND in2)',
    'nor:in1':      'Boolean input 1',
    'nor:in2':      'Boolean input 2',
    'nor:out':      'NOT(in1 OR in2)',
    /* Timers */
    'fbd-ton:en':   'Enable — starts timer while TRUE',
    'fbd-ton:q':    'Done (DN) — TRUE after PT elapses',
    'fbd-tof:en':   'Enable — DN follows EN then delays off',
    'fbd-tof:q':    'Done (DN) — stays TRUE during delay',
    'fbd-tp:en':    'Trigger — fires a fixed PT pulse on rising edge',
    'fbd-tp:q':     'Pulse output — TRUE for PT after trigger',
    /* Counters */
    'fbd-ctu:cu':   'Count-up — increments on rising edge',
    'fbd-ctu:r':    'Reset — clears CV to 0 while TRUE',
    'fbd-ctu:q':    'Done — CV >= preset',
    'fbd-ctd:cd':   'Count-down — decrements on rising edge',
    'fbd-ctd:ld':   'Load — reloads CV = preset while TRUE',
    'fbd-ctd:q':    'Done — CV <= 0',
    /* Latches */
    'sr:s':         'Set (dominant when both S and R are TRUE)',
    'sr:r':         'Reset',
    'sr:q':         'Latched output',
    'rs:s':         'Set',
    'rs:r':         'Reset (dominant when both S and R are TRUE)',
    'rs:q':         'Latched output',
    /* Edge detectors */
    'r_trig:clk':   'Clock input',
    'r_trig:q':     'Single-scan pulse on rising edge of CLK',
    'f_trig:clk':   'Clock input',
    'f_trig:q':     'Single-scan pulse on falling edge of CLK',
    /* Compare */
    'fbd-gt:q':     'TRUE while Source A > Source B',
    'fbd-lt:q':     'TRUE while Source A < Source B',
    'fbd-eq:q':     'TRUE while Source A = Source B',
    'fbd-ne:q':     'TRUE while Source A ≠ Source B',
    'fbd-ge:q':     'TRUE while Source A ≥ Source B',
    'fbd-le:q':     'TRUE while Source A ≤ Source B',
    /* Math */
    'fbd-mov:en':   'Enable — copies Source to Destination every scan while TRUE',
    'fbd-mov:eno':  'Enable-out — follows EN',
    'fbd-add:en':   'Enable — Destination = A + B every scan while TRUE',
    'fbd-add:eno':  'Enable-out — follows EN',
    'fbd-sub:en':   'Enable — Destination = A − B every scan while TRUE',
    'fbd-sub:eno':  'Enable-out — follows EN',
    'fbd-mul:en':   'Enable — Destination = A × B every scan while TRUE',
    'fbd-mul:eno':  'Enable-out — follows EN',
    'fbd-div:en':   'Enable — Destination = A ÷ B every scan while TRUE',
    'fbd-div:eno':  'Enable-out — follows EN'
  };

  function _fbdPortDesc(blockType, portName) {
    return PORT_DESC[blockType + ':' + portName] || PORT_DESC[portName] || '';
  }

  /* Editor state */
  var selectedCell = null;
  var selectedElement = null;
  var hoveredCell = null;
  var activePreset = null;
  var draggingType = null;
  var scrollY = 0;

  /* Undo */
  var undoStack = [];
  var MAX_UNDO = 30;

  /* Edge detection: two snapshots — current scan vs last scan */
  var prevValues = {};     /* snapshot from START of THIS scan (all bits)      */
  var prePrevValues = {};  /* snapshot from START of PREVIOUS scan (all bits)  */
  var inputSnapshot = {};  /* inputs latched at start of scan (real-PLC semantics) */
  var scanActive = false;  /* true while scanCycle is executing rungs */

  /* Explore / Practice / Quiz state */
  var exploreCat = 'fundamentals';
  var selectedConcept = null;
  var currentProblem = null;
  var practiceAnswered = false;
  var practiceCorrect = 0;
  var practiceTotal = 0;
  var quizSet = [];
  var quizIdx = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizAnswers = [];
  var QUIZ_SIZE = 5;

  /* Context menu state */
  var ctxTarget = null;

  /* ================================================================
     SECTION 4 — RUNG DATA MODEL
     ================================================================ */

  function createRung(id) {
    return {
      id: id || nextRungId++,
      comment: '',
      elements: [],
      branches: [],
      outputPower: false
    };
  }

  function addElement(rungIdx, type, col, row, address) {
    var rung = rungs[rungIdx];
    if (!rung) return false;

    var def = COMP_DEFS[type];
    if (!def) return false;

    /* Branch items are structural, not placed in cells */
    if (def.isBranch) return addBranchFromTool(rungIdx, type);

    var r = row || 0;
    var w = def.cellsW || 1;

    /* Branch rows accept simple contacts only (parallel paths carry contacts;
       coils/timers/blocks belong on the main row). Coils are forced to the
       main row's rightmost column below. */
    if (r > 0 && (!def.isContact || def.isBlock)) return false;

    /* Coils must be in rightmost column */
    if (def.isCoil && !def.isBlock && col !== COLS - 1) {
      col = COLS - 1;
      r = 0;
    }

    /* Contacts must not be in last column */
    if (def.isContact && !def.isBlock && col >= COLS - 1) {
      col = Math.min(col, COLS - 2);
    }

    /* Check cell availability */
    var dc, dr;
    for (dc = 0; dc < w; dc++) {
      for (dr = 0; dr < (def.cellsH || 1); dr++) {
        if (getElementAt(rungIdx, col + dc, r + dr)) return false;
      }
    }

    /* Bounds check */
    if (col < 0 || col + w - 1 >= COLS) return false;

    /* Branch-row placement must land inside a branch's elements array —
       elements left in rung.elements at row > 0 are invisible to the logic
       engine. Find a covering branch, widen one to reach the column, or
       reject if no branch can hold this cell. */
    var targetBranch = null;
    if (r > 0) {
      targetBranch = _branchForCell(rung, col, r);
      if (!targetBranch) return false;
    }

    var addr = address || (def.params.address ? def.params.address.def : '');

    /* Build params from defaults */
    var params = {};
    for (var pk in def.params) {
      if (pk === 'address') continue;
      params[pk] = def.params[pk].def;
    }

    var newEl = {
      type: type,
      col: col,
      row: r,
      address: addr,
      params: params,
      state: false,
      _prevState: false
    };
    if (targetBranch) targetBranch.elements.push(newEl);
    else rung.elements.push(newEl);
    return true;
  }

  /* Find the branch that owns (col, subRow), widening an existing branch on
     that sub-row when the drop lands just outside its span. Widening is
     rejected if it would collide with another branch or the coil column. */
  function _branchForCell(rung, col, subRow) {
    var i, bb;
    for (i = 0; i < rung.branches.length; i++) {
      bb = rung.branches[i];
      if (bb.subRow === subRow && col >= bb.startCol && col <= bb.endCol) return bb;
    }
    for (i = 0; i < rung.branches.length; i++) {
      bb = rung.branches[i];
      if (bb.subRow !== subRow) continue;
      var ns = Math.min(bb.startCol, col);
      var ne = Math.max(bb.endCol, col);
      if (ne >= COLS - 1) continue;
      var clash = false;
      for (var j = 0; j < rung.branches.length; j++) {
        var other = rung.branches[j];
        if (other === bb) continue;
        if (ns <= other.endCol && ne >= other.startCol) { clash = true; break; }
      }
      if (clash) continue;
      bb.startCol = ns;
      bb.endCol = ne;
      return bb;
    }
    return null;
  }

  function removeElement(rungIdx, col, row) {
    var rung = rungs[rungIdx];
    if (!rung) return;
    var r = row || 0;
    for (var i = 0; i < rung.elements.length; i++) {
      var el = rung.elements[i];
      var def = COMP_DEFS[el.type];
      var w = (def && def.cellsW) || 1;
      var h = (def && def.cellsH) || 1;
      if (col >= el.col && col < el.col + w && r >= el.row && r < el.row + h) {
        rung.elements.splice(i, 1);
        return;
      }
    }
    /* Branch elements are selectable, so they must be deletable too. If the
       branch empties out, remove the branch as well — an empty branch is a
       bare wire that would short around the main-path contacts. */
    for (var b = 0; b < rung.branches.length; b++) {
      var branch = rung.branches[b];
      for (var be = 0; be < branch.elements.length; be++) {
        var bel = branch.elements[be];
        var bdef = COMP_DEFS[bel.type];
        var bw = (bdef && bdef.cellsW) || 1;
        var bh = (bdef && bdef.cellsH) || 1;
        if (col >= bel.col && col < bel.col + bw && r >= bel.row && r < bel.row + bh) {
          branch.elements.splice(be, 1);
          if (branch.elements.length === 0) rung.branches.splice(b, 1);
          return;
        }
      }
    }
  }

  function _branchOfElement(rungIdx, el) {
    var rung = rungs[rungIdx];
    if (!rung) return null;
    for (var b = 0; b < rung.branches.length; b++) {
      if (rung.branches[b].elements.indexOf(el) >= 0) return rung.branches[b];
    }
    return null;
  }

  /* Legacy programs (saved before branch-row placement was fixed) may carry
     row > 0 contacts inside rung.elements, where the logic engine cannot see
     them. Migrate them into the covering branch; run after any program load. */
  function normalizeRungs() {
    for (var r = 0; r < rungs.length; r++) {
      var rung = rungs[r];
      for (var i = rung.elements.length - 1; i >= 0; i--) {
        var el = rung.elements[i];
        if (!el || el.row === 0) continue;
        var def = COMP_DEFS[el.type];
        if (!def || !def.isContact || def.isBlock) continue;
        var br = _branchForCell(rung, el.col, el.row);
        if (br) {
          rung.elements.splice(i, 1);
          br.elements.push(el);
        }
      }
    }
  }

  function getElementAt(rungIdx, col, row) {
    var rung = rungs[rungIdx];
    if (!rung) return null;
    var r = row || 0;
    for (var i = 0; i < rung.elements.length; i++) {
      var el = rung.elements[i];
      var def = COMP_DEFS[el.type];
      var w = (def && def.cellsW) || 1;
      var h = (def && def.cellsH) || 1;
      if (col >= el.col && col < el.col + w && r >= el.row && r < el.row + h) {
        return el;
      }
    }
    /* Check branches */
    for (var b = 0; b < rung.branches.length; b++) {
      var branch = rung.branches[b];
      for (var be = 0; be < branch.elements.length; be++) {
        var bel = branch.elements[be];
        var bdef = COMP_DEFS[bel.type];
        var bw = (bdef && bdef.cellsW) || 1;
        var bh = (bdef && bdef.cellsH) || 1;
        if (col >= bel.col && col < bel.col + bw && r >= bel.row && r < bel.row + bh) {
          return bel;
        }
      }
    }
    return null;
  }

  function addBranchFromTool(rungIdx, type) {
    var rung = rungs[rungIdx];
    if (!rung) return false;

    if (type === 'branch-start') {
      var startCol = 0;
      var endCol = 0; /* B3: default to single column span, not COLS-2 */
      if (selectedCell) {
        startCol = selectedCell.col;
        endCol = startCol; /* Branch parallels just the selected column */
      }
      /* B3: validate — endCol >= startCol, within bounds, no overlapping branches */
      if (endCol < startCol) endCol = startCol;
      if (endCol >= COLS - 1) endCol = COLS - 2;
      if (startCol >= COLS - 1) return false;

      /* Check for overlapping branches on same rung */
      for (var bi = 0; bi < rung.branches.length; bi++) {
        var existing = rung.branches[bi];
        if (startCol <= existing.endCol && endCol >= existing.startCol) {
          return false; /* overlap — reject */
        }
      }

      rung.branches.push({
        startCol: startCol,
        endCol: endCol,
        subRow: 1,
        elements: []
      });
      return true;
    }
    return false;
  }

  function addBranch(rungIdx, startCol, endCol) {
    var rung = rungs[rungIdx];
    if (!rung) return;
    rung.branches.push({
      startCol: startCol,
      endCol: endCol,
      subRow: 1,
      elements: []
    });
  }

  function addRung(afterIdx) {
    var idx = (afterIdx !== undefined) ? afterIdx + 1 : rungs.length;
    var rung = createRung();
    rungs.splice(idx, 0, rung);
    return idx;
  }

  function removeRung(idx) {
    if (idx >= 0 && idx < rungs.length) {
      rungs.splice(idx, 1);
    }
  }

  function getRungHeight(rung) {
    var maxRow = 0;
    for (var i = 0; i < rung.elements.length; i++) {
      var el = rung.elements[i];
      var def = COMP_DEFS[el.type];
      var h = (def && def.cellsH) || 1;
      maxRow = Math.max(maxRow, el.row + h);
    }
    for (var b = 0; b < rung.branches.length; b++) {
      maxRow = Math.max(maxRow, rung.branches[b].subRow + 1);
      for (var be = 0; be < rung.branches[b].elements.length; be++) {
        var bel = rung.branches[b].elements[be];
        var bdef = COMP_DEFS[bel.type];
        var bh = (bdef && bdef.cellsH) || 1;
        maxRow = Math.max(maxRow, bel.row + bh);
      }
    }
    return Math.max(1, maxRow);
  }

  function getRungY(rungIdx) {
    var y = RUNG_HEADER;
    for (var r = 0; r < rungIdx; r++) {
      y += getRungHeight(rungs[r]) * CELL_H + RUNG_HEADER;
    }
    return y - scrollY;
  }

  function getTotalHeight() {
    var h = RUNG_HEADER;
    for (var r = 0; r < rungs.length; r++) {
      h += getRungHeight(rungs[r]) * CELL_H + RUNG_HEADER;
    }
    return h;
  }

  /* ================================================================
     SECTION 5 — SCAN CYCLE ENGINE
     ================================================================ */

  function getAddress(addr) {
    if (!addr || addr === '') return false;
    var ch = addr.charAt(0);

    /* Real-PLC semantics: during a scan, I-addresses read from the snapshot
       latched at scan start. Outside of a scan (drawing, I/O panel), read live. */
    if (ch === 'I') {
      if (scanActive && (addr in inputSnapshot)) return inputSnapshot[addr];
      return inputs[addr] || false;
    }
    if (ch === 'Q') return outputs[addr] || false;
    if (ch === 'M') return memory[addr] || false;

    if (ch === 'T') {
      /* T0, T0.DN, T0.TT, T0.EN */
      var dotPos = addr.indexOf('.');
      var tBase, tBit;
      if (dotPos > 0) {
        tBase = addr.substring(0, dotPos);
        tBit = addr.substring(dotPos + 1);
      } else {
        tBase = addr;
        tBit = 'DN';
      }
      var t = timers[tBase];
      if (!t) return false;
      if (tBit === 'DN') return t.DN;
      if (tBit === 'TT') return t.TT;
      if (tBit === 'EN') return t.EN;
      return t.DN;
    }

    if (ch === 'C') {
      var cDotPos = addr.indexOf('.');
      var cBase, cBit;
      if (cDotPos > 0) {
        cBase = addr.substring(0, cDotPos);
        cBit = addr.substring(cDotPos + 1);
      } else {
        cBase = addr;
        cBit = 'DN';
      }
      var c = counters[cBase];
      if (!c) return false;
      if (cBit === 'DN') return c.DN;
      if (cBit === 'OV') return c.OV;
      return c.DN;
    }

    if (ch === 'D') return registers[addr] || 0;

    return false;
  }

  function setAddress(addr, value) {
    if (!addr) return;
    var ch = addr.charAt(0);
    if (ch === 'Q') outputs[addr] = !!value;
    else if (ch === 'M') memory[addr] = !!value;
    else if (ch === 'D') registers[addr] = (typeof value === 'number') ? value : 0;
  }

  function getRegister(addr) {
    if (!addr) return 0;
    /* Literal number */
    var num = parseFloat(addr);
    if (!isNaN(num)) return num;
    /* Register address */
    if (addr.charAt(0) === 'D') return registers[addr] || 0;
    /* Timer ACC */
    if (addr.charAt(0) === 'T') {
      var t = timers[addr];
      return t ? Math.floor(t.ACC) : 0;
    }
    /* Counter CV */
    if (addr.charAt(0) === 'C') {
      var c = counters[addr];
      return c ? c.CV : 0;
    }
    return 0;
  }

  /* Scan snapshots store timer/counter bits under suffixed keys ('T0.DN').
     getAddress() resolves a bare 'T0'/'C0' to its DN bit, so edge contacts
     must look the snapshot up under the same suffixed key or they'd fall
     back to the live value and fire every scan instead of one-shot. */
  function _edgeKey(addr) {
    if (!addr) return addr;
    var ch = addr.charAt(0);
    if ((ch === 'T' || ch === 'C') && addr.indexOf('.') < 0) return addr + '.DN';
    return addr;
  }

  function evaluateElement(el) {
    if (!el) return true;
    var def = COMP_DEFS[el.type];
    if (!def) return true;
    var addr = el.address;

    switch (el.type) {
      case 'contact-no':
        return getAddress(addr) === true;

      case 'contact-nc':
        return getAddress(addr) !== true;

      case 'contact-pos': {
        /* One-scan edge: THIS scan's start-of-scan value vs PREVIOUS scan's.
           Works uniformly across I/Q/M/T.DN/C.DN because both snapshots carry
           all bit types (see scanCycle). */
        var keyP = _edgeKey(addr);
        var curP = (keyP in prevValues) ? prevValues[keyP] : getAddress(addr);
        var prevP = prePrevValues[keyP] || false;
        return curP === true && prevP !== true;
      }

      case 'contact-neg': {
        var keyN = _edgeKey(addr);
        var curN = (keyN in prevValues) ? prevValues[keyN] : getAddress(addr);
        var prevN = prePrevValues[keyN] || false;
        return curN !== true && prevN === true;
      }

      case 'equ':
        return getRegister(el.params.srcA) === getRegister(el.params.srcB);

      case 'neq':
        return getRegister(el.params.srcA) !== getRegister(el.params.srcB);

      case 'grt':
        return getRegister(el.params.srcA) > getRegister(el.params.srcB);

      case 'les':
        return getRegister(el.params.srcA) < getRegister(el.params.srcB);

      case 'geq':
        return getRegister(el.params.srcA) >= getRegister(el.params.srcB);

      case 'leq':
        return getRegister(el.params.srcA) <= getRegister(el.params.srcB);

      default:
        /* A5 FIX: unknown types should block power, not pass it */
        return false;
    }
  }

  function executeOutput(el, power) {
    var addr = el.address;
    switch (el.type) {
      case 'coil':
        setAddress(addr, power);
        break;
      case 'coil-set':
        if (power) setAddress(addr, true);
        break;
      case 'coil-reset':
        if (power) setAddress(addr, false);
        break;
      case 'coil-neg':
        setAddress(addr, !power);
        break;
      case 'res':
        /* Reset the referenced timer or counter. For CTD, reload CV = PV so the
           next cycle can count down again. For CTU/CTUD/timers, zero everything. */
        if (power && addr) {
          var ch = addr.charAt(0);
          if (ch === 'T' && timers[addr]) {
            var rt = timers[addr];
            rt.ACC = 0; rt.DN = false; rt.TT = false; rt.EN = false;
            rt.startTime = null; rt._resumeAt = null; rt._prevInput = false;
          } else if (ch === 'C' && counters[addr]) {
            var rc = counters[addr];
            /* Find the counter's owning instruction to know if it's CTD */
            var isCtd = false;
            for (var rri = 0; rri < rungs.length && !isCtd; rri++) {
              var rels = rungs[rri].elements;
              for (var rej = 0; rej < rels.length; rej++) {
                if (rels[rej].type === 'ctd' && rels[rej].address === addr) { isCtd = true; break; }
              }
            }
            rc.CV = isCtd ? rc.PV : 0;
            rc.DN = false; rc.OV = false;
            rc._prevCU = false; rc._prevCD = false;
            rc.CU = false; rc.CD = false;
          }
        }
        break;
    }
  }

  function executeMathBlock(el, power) {
    if (!power) return;
    switch (el.type) {
      case 'mov': {
        var val = getRegister(el.params.src);
        if (el.params.dest) {
          registers[el.params.dest] = val;
        }
        break;
      }
      case 'add': {
        var a = getRegister(el.params.srcA);
        var b = getRegister(el.params.srcB);
        if (el.params.dest) {
          registers[el.params.dest] = a + b;
        }
        break;
      }
      case 'sub': {
        var sa = getRegister(el.params.srcA);
        var sb = getRegister(el.params.srcB);
        if (el.params.dest) {
          registers[el.params.dest] = sa - sb;
        }
        break;
      }
      case 'mul': {
        var ma = getRegister(el.params.srcA);
        var mb = getRegister(el.params.srcB);
        if (el.params.dest) {
          registers[el.params.dest] = ma * mb;
        }
        break;
      }
      case 'div': {
        var da = getRegister(el.params.srcA);
        var db = getRegister(el.params.srcB);
        if (el.params.dest) {
          /* Divide-by-zero: a real PLC faults or sets an overflow/math
             status bit rather than producing Infinity/NaN. Hold the
             destination, flag the rung, and warn the student. */
          if (db === 0) {
            el._mathFault = true;
            showWarning('DIV by zero on ' + (el.params.srcB || 'Source B') +
                        ' — destination ' + el.params.dest + ' left unchanged. A real PLC would set a math fault bit.');
          } else {
            el._mathFault = false;
            registers[el.params.dest] = da / db;
          }
        }
        break;
      }
    }
  }

  function _isTimerType(type)   { return type === 'ton' || type === 'tof' || type === 'tp' || type === 'rto'; }
  function _isCounterType(type) { return type === 'ctu' || type === 'ctd' || type === 'ctud'; }
  function _isMathType(type)    { return type === 'mov' || type === 'add' || type === 'sub' || type === 'mul' || type === 'div'; }

  /* Pass power through one in-line series element.
     Contacts/compares AND their result into the incoming power.
     Timer/counter blocks are updated with the incoming power and their DN (Q)
     bit becomes the downstream power — IEC 61131-3 box semantics, matching the
     series drawing (a coil after a TON waits for the timer to finish). */
  function _powerThrough(el, p) {
    if (_isTimerType(el.type)) {
      updateTimer(el, p);
      var t = timers[el.address];
      return t ? t.DN : false;
    }
    if (_isCounterType(el.type)) {
      updateCounter(el, p);
      var c = counters[el.address];
      return c ? c.DN : false;
    }
    var r = evaluateElement(el);
    el.state = r;
    return p && r;
  }

  function evaluateRung(rung) {
    /* ── Classify main-row elements ──────────────────────
       seriesEls = everything that sits in the power path (contacts, compare
       blocks, timers, counters) on row 0. Coils and math blocks execute with
       the final rung power. Parallel-path elements live in rung.branches. */
    var coilEls = [], mathEls = [], seriesEls = [];
    var sorted = rung.elements.slice().sort(function (a, b) { return a.col - b.col; });

    for (var i = 0; i < sorted.length; i++) {
      var el = sorted[i];
      var def = COMP_DEFS[el.type];
      if (!def) continue;
      if (_isMathType(el.type)) mathEls.push(el);
      else if (def.isCoil && !def.isBlock) coilEls.push(el);
      else if (el.row === 0 && (def.isContact || _isTimerType(el.type) || _isCounterType(el.type))) {
        seriesEls.push(el);
      }
    }

    /* ── Pre-evaluate each branch's internal series power ── */
    var branchResults = [];
    for (var b = 0; b < rung.branches.length; b++) {
      var branch = rung.branches[b];
      var bels = branch.elements.slice().sort(function (x, y) { return x.col - y.col; });
      var branchPower = true;
      for (var be = 0; be < bels.length; be++) {
        branchPower = _powerThrough(bels[be], branchPower);
      }
      branchResults.push({ startCol: branch.startCol, endCol: branch.endCol, power: branchPower, branch: branch });
    }
    branchResults.sort(function (x, y) { return x.startCol - y.startCol; });

    /* ── Column walk with branch-aware OR ──────────────────
       At each column: if a branch span starts here, run the main-row segment
       across the span in series and OR it with the branch path, then skip past
       the span. Otherwise pass power through the element at this column. */
    var power = true;
    var bIdx = 0;
    var col = 0;
    /* Per-segment power profile for the renderer: segPower[k] is the power on
       the wire segment LEFT of column k's junction (k=0 → segment leaving the
       left rail). This lets drawRung highlight the conducting run up to the
       first open contact — the RSLogix/TIA-style diagnostic view. */
    var segPower = [true];
    while (col < COLS) {
      if (bIdx < branchResults.length && branchResults[bIdx].startCol === col) {
        var sp = branchResults[bIdx];
        /* Remember the power ARRIVING at the branch point so the renderer can
           colour the branch wire as true current flow, not just local state */
        sp.branch._inPower = power;
        var mainAcc = true;
        for (var sc = sp.startCol; sc <= sp.endCol; sc++) {
          for (var si = 0; si < seriesEls.length; si++) {
            var sel = seriesEls[si];
            if (sel.col === sc) mainAcc = _powerThrough(sel, power && mainAcc);
          }
          /* Inside the span the main-row wire carries the series progression;
             the final boundary carries the OR-merged result. */
          segPower[sc + 1] = (sc < sp.endCol) ? (power && mainAcc)
                                              : (power && (mainAcc || sp.power));
        }
        power = power && (mainAcc || sp.power);
        col = sp.endCol + 1;
        bIdx++;
      } else {
        for (var sj = 0; sj < seriesEls.length; sj++) {
          if (seriesEls[sj].col === col) {
            power = _powerThrough(seriesEls[sj], power);
          }
        }
        segPower[col + 1] = power;
        col++;
      }
    }
    rung._segPower = segPower;

    /* ── Execute coil outputs ──────────────────────────── */
    rung.outputPower = power;
    for (var o = 0; o < coilEls.length; o++) {
      coilEls[o].state = power;
      executeOutput(coilEls[o], power);
    }

    /* ── Execute math blocks ───────────────────────────── */
    for (var mi = 0; mi < mathEls.length; mi++) {
      mathEls[mi].state = power;
      executeMathBlock(mathEls[mi], power);
    }

    return power;
  }

  /* Coerce a user-entered preset to a sane number. Handles:
       - undefined/null  → default
       - numeric string  → parsed + clamped ≥ 0
       - 0 is valid      → DN fires immediately (useful teaching case)
       - negative → clamped to 0 (no such thing as a negative preset in PLCs) */
  function _sanePreset(v, def) {
    if (v === undefined || v === null || v === '') return def;
    var n = (typeof v === 'number') ? v : parseFloat(v);
    if (!isFinite(n)) return def;
    return Math.max(0, n);
  }

  function updateTimer(el, inputPower) {
    var addr = el.address;
    var preMs = _sanePreset(el.params.preset, 3000);
    if (!timers[addr]) {
      timers[addr] = {
        EN: false, TT: false, DN: false,
        PRE: preMs,
        ACC: 0, startTime: null, _prevInput: false, _resumeAt: null
      };
    }
    var t = timers[addr];
    t.PRE = preMs;
    t.EN = inputPower;

    if (el.type === 'rto') {
      /* Retentive on-delay: accumulates only while input is high, but ACC
         PERSISTS when input goes low (unlike TON). Only RES clears it. */
      if (inputPower) {
        if (t._resumeAt === null) t._resumeAt = simTime - (t.ACC / 1000);
        t.ACC = Math.min((simTime - t._resumeAt) * 1000, t.PRE);
      } else {
        t._resumeAt = null; /* pause — do NOT reset ACC */
      }
      t.TT = inputPower && t.ACC < t.PRE;
      t.DN = t.ACC >= t.PRE;
      el.state = t.DN;
      return;
    }

    if (el.type === 'ton') {
      /* TON: times while input is TRUE, resets when input goes FALSE.
         TT = timing (EN true, not yet done) — true from the first scan, per AB. */
      if (inputPower) {
        if (t.startTime === null) t.startTime = simTime;
        t.ACC = Math.min((simTime - t.startTime) * 1000, t.PRE);
        t.DN = t.ACC >= t.PRE;
        t.TT = !t.DN;
      } else {
        t.startTime = null;
        t.ACC = 0;
        t.TT = false;
        t.DN = false;
      }
    } else if (el.type === 'tof') {
      /* TOF: output goes TRUE immediately, stays TRUE for preset after input drops */
      if (inputPower) {
        t.DN = true;
        t.TT = false;
        t.ACC = 0;
        t.startTime = null;
      } else {
        if (t.DN && t.startTime === null) {
          t.startTime = simTime;
        }
        if (t.startTime !== null) {
          t.ACC = Math.min((simTime - t.startTime) * 1000, t.PRE);
          t.TT = t.ACC < t.PRE;
          if (t.ACC >= t.PRE) {
            t.DN = false;
            t.TT = false;
          }
        }
      }
    } else if (el.type === 'tp') {
      /* TP: fixed-duration pulse on rising edge. Per IEC 61131-3 the pulse is
         NON-retriggerable — a rising edge arriving while the pulse is still
         timing is ignored; a new pulse needs the current one to finish AND a
         fresh rising edge. */
      var tpRising = inputPower && !t._prevInput;
      var tpTiming = t.startTime !== null && t.DN;
      if (tpRising && !tpTiming) {
        t.startTime = simTime;
        t.DN = true;
        t.ACC = 0;
      }
      if (t.startTime !== null) {
        t.ACC = Math.min((simTime - t.startTime) * 1000, t.PRE);
        if (t.ACC >= t.PRE) t.DN = false;
      }
      t.TT = t.DN;
      t._prevInput = inputPower;
    }

    el.state = t.DN;
  }

  function updateCounter(el, inputPower) {
    var addr = el.address;
    var preset = _sanePreset(el.params.preset, 10);
    if (!counters[addr]) {
      /* CTD starts loaded with PV; CTU/CTUD start at 0. */
      counters[addr] = {
        CU: false, CD: false, DN: false, OV: false,
        PV: preset,
        CV: (el.type === 'ctd') ? preset : 0,
        _prevCU: false, _prevCD: false
      };
    }
    var c = counters[addr];
    c.PV = preset;

    if (el.type === 'ctu') {
      /* Count up on rising edge of input power */
      if (inputPower && !c._prevCU) {
        c.CV++;
        if (c.CV > 32767) { c.CV = 0; c.OV = true; }
      }
      c._prevCU = inputPower;
      c.CU = inputPower;
      c.DN = c.CV >= c.PV;

      /* Optional reset bit (inline param) */
      if (el.params.reset && el.params.reset !== '' && getAddress(el.params.reset)) {
        c.CV = 0;
        c.DN = false;
        c.OV = false;
      }
    } else if (el.type === 'ctd') {
      /* Count down on rising edge of input power. DN true when CV ≤ 0.
         CV is reloaded to PV by the RES instruction (see executeOutput). */
      if (inputPower && !c._prevCD) {
        c.CV = Math.max(-32768, c.CV - 1);
      }
      c._prevCD = inputPower;
      c.CD = inputPower;
      c.DN = c.CV <= 0;
    } else if (el.type === 'ctud') {
      /* Up/Down: CU = rung power, CD = downSrc bit (configurable address).
         Both trigger on rising edge. CV clamps to [-32768, 32767]. */
      var cdBit = el.params.downSrc ? getAddress(el.params.downSrc) : false;
      if (inputPower && !c._prevCU) {
        if (c.CV < 32767) c.CV++; else c.OV = true;
      }
      if (cdBit && !c._prevCD) {
        c.CV = Math.max(-32768, c.CV - 1);
      }
      c._prevCU = inputPower;
      c._prevCD = cdBit;
      c.CU = inputPower;
      c.CD = cdBit;
      c.DN = c.CV >= c.PV;
    }

    el.state = c.DN;
  }

  function scanCycle(dt) {
    var scanStart = performance.now();

    /* Roll snapshot history. prevValues = bit image at start of THIS scan;
       prePrevValues = start of PREVIOUS scan. Edge contacts compare these two
       so every bit type (I/Q/M/T.DN/C.DN) has consistent one-scan edge latency. */
    prePrevValues = prevValues;
    prevValues = {};
    var k;
    for (k in inputs) prevValues[k] = inputs[k];
    for (k in outputs) prevValues[k] = outputs[k];
    for (k in memory) prevValues[k] = memory[k];
    for (k in timers) {
      prevValues[k + '.DN'] = timers[k].DN;
      prevValues[k + '.TT'] = timers[k].TT;
      prevValues[k + '.EN'] = timers[k].EN;
    }
    for (k in counters) {
      prevValues[k + '.DN'] = counters[k].DN;
      prevValues[k + '.OV'] = counters[k].OV;
    }

    /* Input image: latch inputs at scan start (real-PLC semantics). Mid-scan
       UI toggles are deferred to the next scan, preventing rung-order artefacts. */
    inputSnapshot = {};
    for (k in inputs) inputSnapshot[k] = inputs[k];
    scanActive = true;

    if (viewMode === 'fbd') {
      evaluateFBD();
    } else {
      /* Evaluate all rungs top to bottom. Coils write outputs; last write wins
         (IEC semantics). Seal-in reads work because M/Q changes from earlier rungs
         are visible to later rungs in the same scan. */
      for (var ri = 0; ri < rungs.length; ri++) {
        evaluateRung(rungs[ri]);
      }
    }

    scanActive = false;
    scanCount++;
    scanDurationMs = performance.now() - scanStart;
  }

  /* ================================================================
     SECTION 5b — FBD EVALUATION ENGINE
     ----------------------------------------------------------------
     Fixpoint iteration over directed block graph. Up to 20 passes; bails
     early on stability. Inputs default to false if unconnected. Wires
     referencing deleted blocks are culled at the start of each scan.
     ================================================================ */

  function _findBlock(id) {
    for (var i = 0; i < fbdBlocks.length; i++) if (fbdBlocks[i].id === id) return fbdBlocks[i];
    return null;
  }

  function _findWireTo(blockId, port) {
    for (var i = 0; i < fbdWires.length; i++) {
      var w = fbdWires[i];
      if (w.to.blockId === blockId && w.to.port === port) return w;
    }
    return null;
  }

  function _cullOrphanWires() {
    /* Remove wires whose endpoints no longer exist (block was deleted) */
    for (var i = fbdWires.length - 1; i >= 0; i--) {
      var w = fbdWires[i];
      if (!_findBlock(w.from.blockId) || !_findBlock(w.to.blockId)) {
        fbdWires.splice(i, 1);
      }
    }
  }

  function evaluateFBD() {
    _cullOrphanWires();

    /* Phase 1 — reset per-scan wire markers, seed input blocks */
    for (var wi = 0; wi < fbdWires.length; wi++) fbdWires[wi]._powered = false;
    for (var bi = 0; bi < fbdBlocks.length; bi++) {
      var b = fbdBlocks[bi];
      if (!b._out) b._out = {};
      if (b.type === 'input') {
        b._out.out = getAddress(b.address) === true;
      }
    }

    /* Phase 2 — fixpoint iteration. Feedback loops (e.g., SR latch) converge
       in 2–3 passes; cap at 20 to guarantee termination on pathological cycles. */
    var MAX_PASSES = 20;
    for (var pass = 0; pass < MAX_PASSES; pass++) {
      var changed = false;
      for (var k = 0; k < fbdBlocks.length; k++) {
        var blk = fbdBlocks[k];
        var def = BLOCK_DEFS[blk.type];
        if (!def) continue;
        if (blk.type === 'input' || blk.type === 'output') continue;

        /* Gather inputs from incoming wires */
        var ins = {};
        for (var pi = 0; pi < def.inputs.length; pi++) {
          var portName = def.inputs[pi];
          var wire = _findWireTo(blk.id, portName);
          var val = false;
          if (wire) {
            var src = _findBlock(wire.from.blockId);
            if (src && src._out) val = !!src._out[wire.from.port];
          }
          ins[portName] = val;
        }
        blk._in = ins;

        /* Evaluate via block def */
        var out = def.evaluate(blk, ins) || {};
        for (var ok in out) {
          if (blk._out[ok] !== out[ok]) { blk._out[ok] = out[ok]; changed = true; }
        }
      }
      if (!changed) break;
    }

    /* Phase 3a — per-block commit hooks (e.g., edge detectors update _edgePrev
       once the fixpoint has settled, so the edge pulse survives for this scan). */
    for (var ci = 0; ci < fbdBlocks.length; ci++) {
      var cb = fbdBlocks[ci];
      var cdef = BLOCK_DEFS[cb.type];
      if (cdef && typeof cdef.commit === 'function') cdef.commit(cb, cb._in || {});
    }

    /* Phase 3b — commit outputs (write Q/M addresses) */
    for (var oi = 0; oi < fbdBlocks.length; oi++) {
      var ob = fbdBlocks[oi];
      if (ob.type === 'output' && ob.address) {
        var ow = _findWireTo(ob.id, 'in');
        var ov = false;
        if (ow) {
          var osrc = _findBlock(ow.from.blockId);
          if (osrc && osrc._out) ov = !!osrc._out[ow.from.port];
        }
        ob._in = { in: ov };
        setAddress(ob.address, ov);
      }
    }

    /* Phase 4 — mark wire power for rendering */
    for (var wj = 0; wj < fbdWires.length; wj++) {
      var ww = fbdWires[wj];
      var wsrc = _findBlock(ww.from.blockId);
      ww._powered = !!(wsrc && wsrc._out && wsrc._out[ww.from.port]);
    }
  }

  /* ================================================================
     SECTION 6 — DRAWING FUNCTIONS
     ================================================================ */

  /* World ↔ screen coordinate helpers (for zoom/pan + annotations). */
  function toSX(wx) { return wx * viewScale + viewOffX; }
  function toSY(wy) { return wy * viewScale + viewOffY; }
  function toWX(sx) { return (sx - viewOffX) / viewScale; }
  function toWY(sy) { return (sy - viewOffY) / viewScale; }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    /* Background */
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, H);

    if (viewMode === 'fbd') {
      /* FBD: apply zoom/pan transform. Annotations render after restore (on top). */
      ctx.save();
      ctx.translate(viewOffX, viewOffY);
      ctx.scale(viewScale, viewScale);
      drawFBD();
      ctx.restore();
      /* Port tooltip — screen-space, drawn above all layers, suppressed during
         drag / wire-draft (halo already communicates target during connect). */
      if (hoveredPort && !fbdMove && !fbdWireDraft && !fbdWireSegDrag) {
        drawFBDPortTooltip(hoveredPort);
      }
      if (typeof drawAnnotations === 'function') drawAnnotations();
      return;
    }

    /* Ladder: apply the same zoom/pan transform as FBD so the +/- , pan,
       reset and fit tools act on the diagram (they previously only moved
       the annotation layer, which drew via toSX/toSY — so zooming
       desynced the notes from the rungs). Annotations render after the
       restore and apply the transform themselves. */
    ctx.save();
    ctx.translate(viewOffX, viewOffY);
    ctx.scale(viewScale, viewScale);

    var ladderW = W;

    /* Draw grid */
    drawGrid(ladderW);

    /* Draw power rails */
    drawPowerRails(ladderW);

    /* Draw rungs */
    for (var r = 0; r < rungs.length; r++) {
      drawRung(rungs[r], r, ladderW);
    }

    /* Draw drag preview */
    if (draggingType && hoveredCell) {
      drawDragPreview();
    }

    /* Draw selection highlight */
    if (selectedCell) {
      drawCellHighlight(selectedCell);
    }

    /* Empty state hint */
    if (rungs.length === 0) {
      ctx.font = '14px ' + _fontFamily;
      ctx.fillStyle = '#2a3050';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Click "Add Rung" or load a preset to begin', ladderW / 2, H / 2);
    }

    ctx.restore();

    if (typeof drawAnnotations === 'function') drawAnnotations();
  }

  function drawGrid(ladderW) {
    ctx.strokeStyle = '#111825';
    ctx.lineWidth = 0.5;

    /* Span the visible world height so zoom-out doesn't end the lines
       mid-canvas (toWY maps the screen edges back into world space). */
    var gridBot = Math.max(H, getTotalHeight(), toWY(H));

    /* Vertical grid lines */
    for (var c = 0; c <= COLS + 1; c++) {
      var x = RAIL_X_L + c * CELL_W;
      if (x > ladderW) break;
      ctx.beginPath();
      ctx.moveTo(x, Math.min(0, toWY(0)));
      ctx.lineTo(x, gridBot);
      ctx.stroke();
    }

    /* Horizontal grid lines per rung */
    var yOff = RUNG_HEADER - scrollY;
    for (var r = 0; r < rungs.length; r++) {
      var rH = getRungHeight(rungs[r]);
      for (var row = 0; row <= rH; row++) {
        var y = yOff + row * CELL_H;
        ctx.beginPath();
        ctx.moveTo(RAIL_X_L, y);
        ctx.lineTo(RAIL_X_R, y);
        ctx.stroke();
      }
      yOff += rH * CELL_H + RUNG_HEADER;
    }
  }

  function drawPowerRails(ladderW) {
    /* Reach the visible world edges so the rails still span the canvas
       when zoomed out or panned (see drawGrid). */
    var railTop = Math.min(0, toWY(0));
    var totalH = Math.max(H, getTotalHeight(), toWY(H));

    /* Left rail (L1 / +24V) */
    ctx.strokeStyle = running ? '#7cb342' : '#4a5578';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(RAIL_X_L, railTop);
    ctx.lineTo(RAIL_X_L, totalH);
    ctx.stroke();

    /* Right rail (L2 / 0V) */
    ctx.beginPath();
    ctx.moveTo(RAIL_X_R, railTop);
    ctx.lineTo(RAIL_X_R, totalH);
    ctx.stroke();

    /* Rail labels */
    ctx.font = '700 10px ' + _monoFont;
    ctx.fillStyle = running ? '#7cb342' : '#6b7a99';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('L1', RAIL_X_L, 8);
    ctx.fillText('L2', RAIL_X_R, 8);
  }

  function drawRung(rung, rungIdx, ladderW) {
    var rY = getRungY(rungIdx);
    var rH = getRungHeight(rung);
    var y = rY + CELL_H / 2;
    var energized = rung.outputPower && running;

    /* Rung header background */
    ctx.fillStyle = '#0c1018';
    ctx.fillRect(0, rY - RUNG_HEADER, ladderW, RUNG_HEADER);

    /* Rung number */
    ctx.font = '700 10px ' + _monoFont;
    ctx.fillStyle = energized ? '#7cb342' : '#4a5578';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('' + rungIdx, RAIL_X_L - 8, y);

    /* Rung comment */
    if (rung.comment) {
      ctx.font = '10px ' + _fontFamily;
      ctx.fillStyle = '#4a5578';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('// ' + rung.comment, RAIL_X_L + 8, rY - 3);
    }

    /* Horizontal rung wire (main row) — drawn per SEGMENT so the green
       highlight shows true power flow up to the first open contact
       (RSLogix/TIA diagnostic convention), not all-or-nothing. */
    var segs = running ? rung._segPower : null;
    for (var sk = 0; sk <= COLS; sk++) {
      var sx1 = RAIL_X_L + sk * CELL_W;
      var sx2 = sx1 + CELL_W;
      var segOn = segs ? !!segs[sk] : false;
      ctx.strokeStyle = segOn ? '#7cb342' : '#1e2636';
      ctx.lineWidth = segOn ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(sx1, y);
      ctx.lineTo(sx2, y);
      ctx.stroke();
      /* Power flow animation only on conducting segments */
      if (segOn) drawPowerFlowDots(sx1, y, sx2, y);
    }

    /* Draw elements */
    for (var e = 0; e < rung.elements.length; e++) {
      drawElement(rung.elements[e], rungIdx, ladderW);
    }

    /* Draw branches */
    for (var b = 0; b < rung.branches.length; b++) {
      drawBranch(rung.branches[b], rungIdx);
    }
  }

  function drawPowerFlowDots(x1, y1, x2, y2) {
    var phase = (simTime * 120) % 40;
    ctx.fillStyle = 'rgba(124, 179, 66, 0.6)';
    for (var x = x1 + phase; x < x2; x += 40) {
      ctx.beginPath();
      ctx.arc(x, y1, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawElement(el, rungIdx, ladderW) {
    var rY = getRungY(rungIdx);
    var x = RAIL_X_L + (el.col + 1) * CELL_W;
    var y = rY + CELL_H / 2 + el.row * CELL_H;

    var def = COMP_DEFS[el.type];
    if (!def) return;
    var energized = el.state && running;
    var isSelected = selectedElement === el;

    switch (el.type) {
      case 'contact-no':
        drawContactNO(x, y, el, energized, isSelected);
        break;
      case 'contact-nc':
        drawContactNC(x, y, el, energized, isSelected);
        break;
      case 'contact-pos':
        drawContactEdge(x, y, el, 'P', energized, isSelected);
        break;
      case 'contact-neg':
        drawContactEdge(x, y, el, 'N', energized, isSelected);
        break;
      case 'coil':
        drawCoil(x, y, el, '', energized, isSelected);
        break;
      case 'coil-set':
        drawCoil(x, y, el, 'S', energized, isSelected);
        break;
      case 'coil-reset':
        drawCoil(x, y, el, 'R', energized, isSelected);
        break;
      case 'coil-neg':
        drawCoil(x, y, el, '/', energized, isSelected);
        break;
      case 'res':
        drawCoil(x, y, el, 'R?', energized, isSelected);
        break;
      case 'ton': case 'tof': case 'tp': case 'rto':
        drawTimerBlock(x, y, el, energized, isSelected);
        break;
      case 'ctu': case 'ctd': case 'ctud':
        drawCounterBlock(x, y, el, energized, isSelected);
        break;
      case 'equ': case 'neq': case 'grt': case 'les': case 'geq': case 'leq':
        drawCompareBlock(x, y, el, energized, isSelected);
        break;
      case 'mov': case 'add': case 'sub': case 'mul': case 'div':
        drawMathBlock(x, y, el, energized, isSelected);
        break;
    }
  }

  /* Friendly name for an address, from the I/O panel labels. Real PLC
     software shows the symbolic name beside the address (Studio 5000 alias
     tags, TIA symbolic names) — an unlabelled rung of I0.0/Q0.1 is far
     harder to read than one that also says Start / Motor. */
  function _addrLabel(addr) {
    if (!addr) return '';
    var m = /^([IQ])0\.(\d)$/.exec(addr);
    if (!m) return '';
    var idx = +m[2];
    var arr = (m[1] === 'I') ? inputLabels : outputLabels;
    return (arr && arr[idx]) ? arr[idx] : '';
  }

  /* Draw the symbolic name under an element, if it has one. */
  function _drawAddrLabel(x, yBelow, addr) {
    var name = _addrLabel(addr);
    if (!name) return;
    ctx.font = '9px ' + _fontFamily;
    ctx.fillStyle = '#5f6f92';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(name, x, yBelow);
  }

  function drawContactNO(x, y, el, energized, selected) {
    var hw = 18, hh = 14;
    var color = energized ? '#7cb342' : '#8899bb';
    var wireColor = energized ? '#7cb342' : '#3a4a68';

    /* Wire stubs */
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = energized ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - CELL_W / 2, y);
    ctx.lineTo(x - hw, y);
    ctx.moveTo(x + hw, y);
    ctx.lineTo(x + CELL_W / 2, y);
    ctx.stroke();

    /* Contact symbol: two vertical bars */
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - hw, y - hh);
    ctx.lineTo(x - hw, y + hh);
    ctx.moveTo(x + hw, y - hh);
    ctx.lineTo(x + hw, y + hh);
    ctx.stroke();

    /* Energized fill */
    if (energized) {
      ctx.fillStyle = 'rgba(124, 179, 66, 0.08)';
      ctx.fillRect(x - hw - 2, y - hh - 2, hw * 2 + 4, hh * 2 + 4);
    }

    /* Address label above */
    ctx.font = '700 10px ' + _monoFont;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(el.address, x, y - hh - 4);

    /* Symbolic name below (Start, Stop, …) */
    _drawAddrLabel(x, y + hh + 4, el.address);

    /* Selection indicator */
    if (selected) drawSelectionRing(x - hw - 6, y - hh - 16, hw * 2 + 12, hh * 2 + 26);
  }

  function drawContactNC(x, y, el, energized, selected) {
    /* Draw same frame as NO */
    drawContactNO(x, y, el, energized, selected);

    /* Add diagonal slash */
    var color = energized ? '#7cb342' : '#8899bb';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 13, y + 10);
    ctx.lineTo(x + 13, y - 10);
    ctx.stroke();
  }

  function drawContactEdge(x, y, el, letter, energized, selected) {
    /* Draw same frame as NO */
    drawContactNO(x, y, el, energized, selected);

    /* Add edge letter (P or N) inside */
    var color = energized ? '#7cb342' : '#8899bb';
    ctx.font = '700 11px ' + _monoFont;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, x, y);
  }

  function drawCoil(x, y, el, letter, energized, selected) {
    var r = 15;
    var color = energized ? '#7cb342' : '#8899bb';
    var wireColor = energized ? '#7cb342' : '#3a4a68';

    /* Wire from left */
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = energized ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - CELL_W / 2, y);
    ctx.lineTo(x - r, y);
    ctx.stroke();

    /* Wire to right rail */
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + CELL_W / 2, y);
    ctx.stroke();

    /* Coil symbol: parentheses arcs */
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    /* Left arc */
    ctx.beginPath();
    ctx.arc(x - 4, y, r, Math.PI * 0.35, Math.PI * 1.65);
    ctx.stroke();
    /* Right arc */
    ctx.beginPath();
    ctx.arc(x + 4, y, r, -Math.PI * 0.65, Math.PI * 0.65);
    ctx.stroke();

    /* Glow effect when energized */
    if (energized) {
      ctx.strokeStyle = 'rgba(124, 179, 66, 0.25)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(124, 179, 66, 0.06)';
      ctx.beginPath();
      ctx.arc(x, y, r + 3, 0, Math.PI * 2);
      ctx.fill();
    }

    /* Letter inside (S, R, /, or blank) */
    if (letter) {
      ctx.font = '700 12px ' + _monoFont;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter, x, y);
    }

    /* Address above */
    ctx.font = '700 10px ' + _monoFont;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(el.address, x, y - r - 4);

    /* Symbolic name below (Motor, Valve, …) */
    _drawAddrLabel(x, y + r + 4, el.address);

    /* Selection */
    if (selected) drawSelectionRing(x - r - 6, y - r - 16, r * 2 + 12, r * 2 + 26);
  }

  function drawTimerBlock(x, y, el, energized, selected) {
    var bw = CELL_W * 1.8, bh = CELL_H * 0.82;
    var bx = x - bw / 2 + CELL_W * 0.4, by = y - bh / 2;
    var color = energized ? '#7cb342' : '#dde3f0';
    var borderColor = energized ? '#7cb342' : '#3a4a68';

    /* Wire stubs */
    ctx.strokeStyle = energized ? '#7cb342' : '#3a4a68';
    ctx.lineWidth = energized ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - CELL_W / 2, y);
    ctx.lineTo(bx, y);
    ctx.moveTo(bx + bw, y);
    ctx.lineTo(bx + bw + CELL_W * 0.3, y);
    ctx.stroke();

    /* Block background */
    ctx.fillStyle = energized ? 'rgba(124, 179, 66, 0.10)' : 'rgba(20, 28, 44, 0.9)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    /* Timer type label */
    ctx.font = '700 12px ' + _monoFont;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(el.type.toUpperCase(), bx + bw / 2, by + 5);

    /* Address */
    ctx.font = '600 9px ' + _monoFont;
    ctx.fillStyle = energized ? '#a0d060' : '#6b7a99';
    ctx.fillText(el.address, bx + bw / 2, by + 20);

    /* Timer values */
    var t = timers[el.address];
    if (t) {
      ctx.font = '600 9px ' + _monoFont;
      ctx.fillStyle = '#8899bb';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('PRE: ' + t.PRE + 'ms', bx + 6, by + bh - 26);
      ctx.fillText('ACC: ' + Math.floor(t.ACC) + 'ms', bx + 6, by + bh - 15);

      /* Progress bar */
      var prog = t.PRE > 0 ? Math.min(t.ACC / t.PRE, 1) : 0;
      var barY = by + bh - 7;
      ctx.fillStyle = '#1a2030';
      ctx.fillRect(bx + 6, barY, bw - 12, 4);
      ctx.fillStyle = energized ? '#7cb342' : '#3a6020';
      ctx.fillRect(bx + 6, barY, (bw - 12) * prog, 4);

      /* Status bits */
      ctx.font = '600 7px ' + _monoFont;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      drawStatusBit(bx + bw - 6, by + 5, 'EN', t.EN);
      drawStatusBit(bx + bw - 6, by + 14, 'TT', t.TT);
      drawStatusBit(bx + bw - 6, by + 23, 'DN', t.DN);
    } else {
      ctx.font = '600 9px ' + _monoFont;
      ctx.fillStyle = '#4a5578';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('PRE: ' + _sanePreset(el.params.preset, 3000) + 'ms', bx + bw / 2, by + bh - 20);
    }

    if (selected) drawSelectionRing(bx - 3, by - 3, bw + 6, bh + 6);
  }

  function drawStatusBit(x, y, label, value) {
    ctx.fillStyle = value ? '#7cb342' : '#3a4a68';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(label, x, y);
  }

  function drawCounterBlock(x, y, el, energized, selected) {
    var bw = CELL_W * 1.8, bh = CELL_H * 0.82;
    var bx = x - bw / 2 + CELL_W * 0.4, by = y - bh / 2;
    var color = energized ? '#7cb342' : '#dde3f0';
    var borderColor = energized ? '#7cb342' : '#3a4a68';

    /* Wire stubs */
    ctx.strokeStyle = energized ? '#7cb342' : '#3a4a68';
    ctx.lineWidth = energized ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - CELL_W / 2, y);
    ctx.lineTo(bx, y);
    ctx.moveTo(bx + bw, y);
    ctx.lineTo(bx + bw + CELL_W * 0.3, y);
    ctx.stroke();

    /* Block background */
    ctx.fillStyle = energized ? 'rgba(124, 179, 66, 0.10)' : 'rgba(20, 28, 44, 0.9)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    /* Counter type label */
    ctx.font = '700 12px ' + _monoFont;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(el.type.toUpperCase(), bx + bw / 2, by + 5);

    /* Address */
    ctx.font = '600 9px ' + _monoFont;
    ctx.fillStyle = energized ? '#a0d060' : '#6b7a99';
    ctx.fillText(el.address, bx + bw / 2, by + 20);

    /* Counter values */
    var c = counters[el.address];
    if (c) {
      ctx.font = '700 11px ' + _monoFont;
      ctx.fillStyle = '#f5c842';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('CV: ' + c.CV + ' / PV: ' + c.PV, bx + bw / 2, by + bh - 8);

      /* Status bits */
      ctx.font = '600 7px ' + _monoFont;
      drawStatusBit(bx + bw - 6, by + 5, 'CU', c._prevCU);
      drawStatusBit(bx + bw - 6, by + 14, 'DN', c.DN);
    } else {
      ctx.font = '600 9px ' + _monoFont;
      ctx.fillStyle = '#4a5578';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('PV: ' + _sanePreset(el.params.preset, 10), bx + bw / 2, by + bh - 8);
    }

    if (selected) drawSelectionRing(bx - 3, by - 3, bw + 6, bh + 6);
  }

  function drawCompareBlock(x, y, el, energized, selected) {
    var bw = CELL_W * 1.8, bh = CELL_H * 0.72;
    var bx = x - bw / 2 + CELL_W * 0.4, by = y - bh / 2;
    var color = energized ? '#7cb342' : '#dde3f0';
    var borderColor = energized ? '#42a5f5' : '#2a4a80';

    /* Wire stubs */
    ctx.strokeStyle = energized ? '#7cb342' : '#3a4a68';
    ctx.lineWidth = energized ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - CELL_W / 2, y);
    ctx.lineTo(bx, y);
    ctx.moveTo(bx + bw, y);
    ctx.lineTo(bx + bw + CELL_W * 0.3, y);
    ctx.stroke();

    /* Block */
    ctx.fillStyle = energized ? 'rgba(66, 165, 245, 0.10)' : 'rgba(20, 28, 44, 0.9)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    /* Label */
    ctx.font = '700 11px ' + _monoFont;
    ctx.fillStyle = energized ? '#42a5f5' : '#6b8abf';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(el.type.toUpperCase(), bx + bw / 2, by + 4);

    /* Sources */
    ctx.font = '600 9px ' + _monoFont;
    ctx.fillStyle = '#8899bb';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    var srcA = el.params.srcA || 'D0';
    var srcB = el.params.srcB || 'D1';
    ctx.fillText('A: ' + srcA + ' (' + getRegister(srcA) + ')', bx + 6, by + 18);
    ctx.fillText('B: ' + srcB + ' (' + getRegister(srcB) + ')', bx + 6, by + 29);

    /* Result indicator */
    ctx.beginPath();
    ctx.arc(bx + bw - 12, by + bh / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = energized ? '#42a5f5' : '#1a2030';
    ctx.fill();

    if (selected) drawSelectionRing(bx - 3, by - 3, bw + 6, bh + 6);
  }

  function drawMathBlock(x, y, el, energized, selected) {
    var bw = CELL_W * 1.8, bh = CELL_H * 0.72;
    var bx = x - bw / 2 + CELL_W * 0.4, by = y - bh / 2;
    var color = energized ? '#f5c842' : '#dde3f0';
    var borderColor = energized ? '#f5c842' : '#5a4a28';

    /* Wire stubs */
    ctx.strokeStyle = energized ? '#7cb342' : '#3a4a68';
    ctx.lineWidth = energized ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x - CELL_W / 2, y);
    ctx.lineTo(bx, y);
    ctx.moveTo(bx + bw, y);
    ctx.lineTo(bx + bw + CELL_W * 0.3, y);
    ctx.stroke();

    /* Block */
    ctx.fillStyle = energized ? 'rgba(245, 200, 66, 0.08)' : 'rgba(20, 28, 44, 0.9)';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.stroke();

    /* Label */
    ctx.font = '700 11px ' + _monoFont;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(el.type.toUpperCase(), bx + bw / 2, by + 4);

    /* Params */
    ctx.font = '600 9px ' + _monoFont;
    ctx.fillStyle = '#8899bb';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    if (el.type === 'mov') {
      ctx.fillText('Src: ' + (el.params.src || 'D0'), bx + 6, by + 18);
      ctx.fillText('Dst: ' + (el.params.dest || 'D1'), bx + 6, by + 29);
    } else {
      ctx.fillText('A: ' + (el.params.srcA || 'D0'), bx + 6, by + 18);
      ctx.fillText('B: ' + (el.params.srcB || 'D1') + ' Dst: ' + (el.params.dest || 'D2'), bx + 6, by + 29);
    }

    /* Divide-by-zero fault marker — the destination is held, so without a
       marker the block would look like it simply isn't executing. */
    if (el._mathFault && running) {
      ctx.font = '700 9px ' + _monoFont;
      ctx.fillStyle = '#ff5555';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('÷0 FAULT', bx + bw - 6, by + bh - 4);
    }

    if (selected) drawSelectionRing(bx - 3, by - 3, bw + 6, bh + 6);
  }

  function drawBranch(branch, rungIdx) {
    var rY = getRungY(rungIdx);
    var yMain = rY + CELL_H / 2;
    var yBranch = rY + CELL_H / 2 + branch.subRow * CELL_H;
    var xStart = RAIL_X_L + (branch.startCol + 1) * CELL_W - CELL_W / 2;
    var xEnd   = RAIL_X_L + (branch.endCol + 1) * CELL_W + CELL_W / 2;

    /* Energized = true POWER FLOW: power must reach the branch point
       (branch._inPower, recorded by evaluateRung) AND every branch contact
       must conduct. Colouring on local contact state alone would show a
       hot-green parallel wire on a rung whose left side is open. */
    var branchPower = true;
    for (var i = 0; i < branch.elements.length; i++) {
      branchPower = branchPower && branch.elements[i].state;
    }
    var en = branchPower && branch._inPower === true && running;

    var wireColor = en ? '#7cb342' : '#2a3a58';

    /* Vertical down from main to branch */
    ctx.strokeStyle = wireColor;
    ctx.lineWidth = en ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(xStart, yMain);
    ctx.lineTo(xStart, yBranch);
    ctx.stroke();

    /* Horizontal branch wire */
    ctx.beginPath();
    ctx.moveTo(xStart, yBranch);
    ctx.lineTo(xEnd, yBranch);
    ctx.stroke();
    if (en) drawPowerFlowDots(xStart, yBranch, xEnd, yBranch);

    /* Vertical up from branch to main */
    ctx.beginPath();
    ctx.moveTo(xEnd, yBranch);
    ctx.lineTo(xEnd, yMain);
    ctx.stroke();

    /* Branch junction dots */
    ctx.fillStyle = wireColor;
    ctx.beginPath(); ctx.arc(xStart, yMain, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(xEnd, yMain, 3, 0, Math.PI * 2); ctx.fill();

    /* Draw branch elements */
    for (var e = 0; e < branch.elements.length; e++) {
      var bel = branch.elements[e];
      var x = RAIL_X_L + (bel.col + 1) * CELL_W;
      var y = yBranch;
      var elEn = bel.state && running;
      var isSel = selectedElement === bel;

      switch (bel.type) {
        case 'contact-no': drawContactNO(x, y, bel, elEn, isSel); break;
        case 'contact-nc': drawContactNC(x, y, bel, elEn, isSel); break;
        case 'contact-pos': drawContactEdge(x, y, bel, 'P', elEn, isSel); break;
        case 'contact-neg': drawContactEdge(x, y, bel, 'N', elEn, isSel); break;
        default: break;
      }
    }
  }

  function drawDragPreview() {
    if (!hoveredCell || !draggingType) return;
    var def = COMP_DEFS[draggingType];
    if (!def || def.isBranch) return;

    var rY = getRungY(hoveredCell.rungIdx);
    var x = RAIL_X_L + (hoveredCell.col + 1) * CELL_W;
    var y = rY + CELL_H / 2 + hoveredCell.row * CELL_H;
    var w = (def.cellsW || 1) * CELL_W;
    var h = (def.cellsH || 1) * CELL_H;

    ctx.fillStyle = 'rgba(66, 165, 245, 0.12)';
    ctx.strokeStyle = 'rgba(66, 165, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.fillRect(x - CELL_W / 2, y - CELL_H / 2, w, h);
    ctx.strokeRect(x - CELL_W / 2, y - CELL_H / 2, w, h);
    ctx.setLineDash([]);

    /* Type name */
    ctx.font = '600 9px ' + _monoFont;
    ctx.fillStyle = 'rgba(66, 165, 245, 0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.symbol, x, y);
  }

  function drawCellHighlight(cell) {
    if (cell.rungIdx >= rungs.length) return;
    var rY = getRungY(cell.rungIdx);
    var x = RAIL_X_L + (cell.col + 1) * CELL_W - CELL_W / 2;
    var y = rY + cell.row * CELL_H;

    ctx.strokeStyle = 'rgba(66, 165, 245, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x + 1, y + 1, CELL_W - 2, CELL_H - 2);
    ctx.setLineDash([]);
  }

  function drawSelectionRing(x, y, w, h) {
    ctx.strokeStyle = '#42a5f5';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  }

  function roundRect(context, x, y, w, h, r) {
    if (context.roundRect) {
      context.beginPath();
      context.roundRect(x, y, w, h, r);
    } else {
      context.beginPath();
      context.moveTo(x + r, y);
      context.lineTo(x + w - r, y);
      context.quadraticCurveTo(x + w, y, x + w, y + r);
      context.lineTo(x + w, y + h - r);
      context.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      context.lineTo(x + r, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - r);
      context.lineTo(x, y + r);
      context.quadraticCurveTo(x, y, x + r, y);
      context.closePath();
    }
  }

  /* ================================================================
     SECTION 6b — FBD RENDERING
     ----------------------------------------------------------------
     drawFBD() paints the block graph onto the same ladder-canvas.
     Wires are orthogonal H-V-H paths. Ports are small circles; they
     glow green when their owning block's output is true.
     ================================================================ */

  var FBD_PORT_R = 4;
  var FBD_COLOR_HOT  = '#7cb342';
  var FBD_COLOR_COLD = '#3a4a68';
  var FBD_COLOR_PORT_HOT  = '#a0d060';
  var FBD_COLOR_BG = 'rgba(20, 28, 44, 0.95)';
  var FBD_COLOR_TEXT = '#dde3f0';
  var FBD_COLOR_ACCENT = '#8899bb';

  function fbdPortPos(block, portName, side) {
    /* Returns port position in WORLD coords. The zoom/pan transform on the
       canvas context handles the screen mapping. */
    var def = BLOCK_DEFS[block.type];
    if (!def) return { x: block.x, y: block.y };
    var list = side === 'in' ? def.inputs : def.outputs;
    var idx = list.indexOf(portName);
    if (idx < 0) return { x: block.x, y: block.y };
    var n = list.length;
    var spacing = block._h || def.h;
    var px = side === 'in' ? block.x : block.x + (block._w || def.w);
    var py = block.y + (spacing * (idx + 1)) / (n + 1);
    return { x: px, y: py };
  }

  function drawFBD() {
    /* Grid — cover the VISIBLE world rect (we're drawing under the pan/zoom
       transform; looping 0..W in world units leaves bare background once the
       user pans or zooms away from the origin). */
    ctx.strokeStyle = '#111825';
    ctx.lineWidth = 0.5;
    var gs = 20;
    var wx0 = Math.floor(toWX(0) / gs) * gs;
    var wx1 = toWX(W);
    var wy0 = Math.floor(toWY(0) / gs) * gs;
    var wy1 = toWY(H);
    for (var gx = wx0; gx < wx1; gx += gs) {
      ctx.beginPath(); ctx.moveTo(gx, wy0); ctx.lineTo(gx, wy1); ctx.stroke();
    }
    for (var gy = wy0; gy < wy1; gy += gs) {
      ctx.beginPath(); ctx.moveTo(wx0, gy); ctx.lineTo(wx1, gy); ctx.stroke();
    }

    /* Wires first (so blocks sit on top) */
    for (var wi = 0; wi < fbdWires.length; wi++) {
      drawFBDWire(fbdWires[wi]);
    }

    /* Wire draft (while user is connecting) — includes waypoints.
       Line colour indicates target validity:
         orange = no target yet
         green  = valid input port on different block
         red    = invalid (same block or not an input port) */
    if (fbdWireDraft) {
      var src = _findBlock(fbdWireDraft.blockId);
      if (src) {
        var sp = fbdPortPos(src, fbdWireDraft.port, 'out');
        /* Determine target validity from hoveredPort */
        var dropValid = null;  /* null = no target, true/false = valid/invalid */
        if (hoveredPort) {
          if (hoveredPort.side === 'in' && hoveredPort.block.id !== fbdWireDraft.blockId) {
            dropValid = true;
          } else {
            dropValid = false;
          }
        }
        ctx.strokeStyle = dropValid === true ? '#66bb6a' :
                          dropValid === false ? '#ef5350' : '#f5c842';
        ctx.setLineDash([6, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y);
        var prevX = sp.x, prevY = sp.y;
        for (var wp = 0; wp < fbdWireDraft.waypoints.length; wp++) {
          var w = fbdWireDraft.waypoints[wp];
          ctx.lineTo(w.x, w.y);
          prevX = w.x; prevY = w.y;
        }
        /* Snap preview tail orthogonally from last point. fbdMouse is world coords. */
        var tx = fbdMouse.x, ty = fbdMouse.y;
        /* If hovering a valid target port, run the line straight to that port */
        if (dropValid === true) {
          var tgtPos = fbdPortPos(hoveredPort.block, hoveredPort.port, 'in');
          /* Orthogonal final leg */
          if (Math.abs(tgtPos.x - prevX) > Math.abs(tgtPos.y - prevY)) {
            ctx.lineTo(prevX, tgtPos.y);
          } else {
            ctx.lineTo(tgtPos.x, prevY);
          }
          ctx.lineTo(tgtPos.x, tgtPos.y);
        } else {
          if (Math.abs(tx - prevX) > Math.abs(ty - prevY)) ty = prevY;
          else tx = prevX;
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        /* Waypoint dots */
        ctx.fillStyle = '#f5c842';
        for (var wd = 0; wd < fbdWireDraft.waypoints.length; wd++) {
          ctx.beginPath();
          ctx.arc(fbdWireDraft.waypoints[wd].x, fbdWireDraft.waypoints[wd].y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        /* Halo around candidate drop port */
        if (dropValid !== null) {
          var haloPos = fbdPortPos(hoveredPort.block, hoveredPort.port, hoveredPort.side);
          ctx.beginPath();
          ctx.arc(haloPos.x, haloPos.y, 9, 0, Math.PI * 2);
          ctx.strokeStyle = dropValid ? '#66bb6a' : '#ef5350';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    /* Blocks */
    for (var bi = 0; bi < fbdBlocks.length; bi++) {
      drawFBDBlock(fbdBlocks[bi]);
    }

    /* Empty state hint */
    if (fbdBlocks.length === 0) {
      ctx.font = '14px ' + _fontFamily;
      ctx.fillStyle = '#2a3050';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Drag blocks from the palette. Click an output port and release on an input port to wire.', W / 2, H / 2);
    }
  }

  /* ── FBD wire routing (ported from pneumatic-circuit) ──
     Orthogonal router with block-body obstacle avoidance and optional user
     waypoints. Output ports exit the right edge; input ports enter the left.
     The router therefore always joins two horizontal stubs with a vertical
     bridge at some X between them. If the bridge or a leg crosses a block
     body, we nudge the bridge X outward in 10px steps until we find a clear
     channel. Legacy H-V-H is kept only as a fallback. */

  var FBD_ROUTE_GRID = 10;
  var FBD_ROUTE_PAD  = 8;   /* clearance around block bodies */
  var FBD_STUB       = 18;  /* distance from port circle to first bend */

  function _fbdSnap(v) { return Math.round(v / FBD_ROUTE_GRID) * FBD_ROUTE_GRID; }

  /* Block body bbox in WORLD coords (ignores port stubs). */
  function _fbdBlockBBox(block, pad) {
    var def = BLOCK_DEFS[block.type];
    if (!def) return null;
    pad = pad || 0;
    return { x1: block.x - pad, y1: block.y - pad,
             x2: block.x + def.w + pad, y2: block.y + def.h + pad };
  }

  /* True if axis-aligned segment crosses any block body (excluding `excludeIds`).
     Points are in WORLD coords (pre-scroll); bboxes are also world. */
  function _fbdSegHitsBlock(x1, y1, x2, y2, excludeIds) {
    excludeIds = excludeIds || [];
    var sxMin = Math.min(x1, x2), sxMax = Math.max(x1, x2);
    var syMin = Math.min(y1, y2), syMax = Math.max(y1, y2);
    for (var i = 0; i < fbdBlocks.length; i++) {
      var b = fbdBlocks[i];
      if (excludeIds.indexOf(b.id) !== -1) continue;
      var bb = _fbdBlockBBox(b, FBD_ROUTE_PAD);
      if (!bb) continue;
      if (sxMax < bb.x1 || sxMin > bb.x2) continue;
      if (syMax < bb.y1 || syMin > bb.y2) continue;
      return b;
    }
    return null;
  }

  /* Find an X between src.x and dst.x such that a vertical bridge at that X
     plus the two horizontal legs to the port stubs don't cross any block. */
  function _fbdFindClearBridgeX(fpS, tpS, natural, excludeIds) {
    var attempts = [natural];
    for (var k = 1; k <= 8; k++) {
      attempts.push(natural + k * FBD_ROUTE_GRID);
      attempts.push(natural - k * FBD_ROUTE_GRID);
    }
    for (var a = 0; a < attempts.length; a++) {
      var x = _fbdSnap(attempts[a]);
      if (_fbdSegHitsBlock(fpS.x, fpS.y, x, fpS.y, excludeIds)) continue;
      if (_fbdSegHitsBlock(x, tpS.y, tpS.x, tpS.y, excludeIds)) continue;
      if (_fbdSegHitsBlock(x, fpS.y, x, tpS.y, excludeIds)) continue;
      return x;
    }
    return _fbdSnap(natural);
  }

  /* Compute the polyline for a wire. Returns an array of {x,y} points in
     WORLD coords (caller subtracts scrollY for rendering). */
  function _fbdWirePath(w) {
    var src = _findBlock(w.from.blockId);
    var dst = _findBlock(w.to.blockId);
    if (!src || !dst) return null;

    /* Port positions in WORLD coords (scrollY not subtracted; renderer does that) */
    var srcDef = BLOCK_DEFS[src.type], dstDef = BLOCK_DEFS[dst.type];
    if (!srcDef || !dstDef) return null;

    var srcIdx = srcDef.outputs.indexOf(w.from.port);
    var dstIdx = dstDef.inputs.indexOf(w.to.port);
    if (srcIdx < 0 || dstIdx < 0) return null;

    var fp = { x: src.x + srcDef.w,                                  y: src.y + (srcDef.h * (srcIdx + 1)) / (srcDef.outputs.length + 1) };
    var tp = { x: dst.x,                                              y: dst.y + (dstDef.h * (dstIdx + 1)) / (dstDef.inputs.length + 1) };

    /* Horizontal stubs: exit right from src, enter left of dst. */
    var fpS = { x: fp.x + FBD_STUB, y: fp.y };
    var tpS = { x: tp.x - FBD_STUB, y: tp.y };

    /* If user has placed explicit waypoints, honour them. */
    if (w.waypoints && w.waypoints.length > 0) {
      var pts = [fp, fpS];
      for (var wi = 0; wi < w.waypoints.length; wi++) pts.push(w.waypoints[wi]);
      pts.push(tpS);
      pts.push(tp);
      return _fbdCleanPath(pts);
    }

    var excludeIds = [src.id, dst.id];
    var points = [fp, fpS];

    /* If stubs already line up (same Y or X) we can join directly. */
    if (Math.abs(fpS.y - tpS.y) < 1) {
      /* Pure horizontal — need nothing more between stubs */
    } else if (fpS.x >= tpS.x) {
      /* Source stub is past target stub — need a U-bend going around below/above.
         Pick the shorter vertical detour. */
      var upY = Math.min(fp.y, tp.y) - 30;
      var dnY = Math.max(fp.y, tp.y) + 30;
      var useY = (Math.abs(upY - (fp.y + tp.y) / 2) < Math.abs(dnY - (fp.y + tp.y) / 2)) ? upY : dnY;
      /* Extend right further to avoid backtracking into blocks */
      var detourX = Math.max(fpS.x, tpS.x) + 30;
      var detourBackX = Math.min(fpS.x, tpS.x) - 30;
      points.push({ x: fpS.x, y: useY });
      points.push({ x: tpS.x, y: useY });
    } else {
      /* Normal case: vertical bridge between the stubs. Find clear X. */
      var naturalX = (fpS.x + tpS.x) / 2;
      var bridgeX = _fbdFindClearBridgeX(fpS, tpS, naturalX, excludeIds);
      points.push({ x: bridgeX, y: fpS.y });
      points.push({ x: bridgeX, y: tpS.y });
    }
    points.push(tpS);
    points.push(tp);
    return _fbdCleanPath(points);
  }

  function _fbdCleanPath(path) {
    if (!path || path.length < 2) return path;
    /* Insert orthogonal corners for any diagonal segments (defensive) */
    var fixed = [path[0]];
    for (var i = 1; i < path.length; i++) {
      var prev = fixed[fixed.length - 1], cur = path[i];
      if (Math.abs(cur.x - prev.x) > 1 && Math.abs(cur.y - prev.y) > 1) {
        fixed.push({ x: cur.x, y: prev.y });
      }
      fixed.push(cur);
    }
    /* Merge collinear runs */
    var res = [fixed[0]];
    for (var j = 1; j < fixed.length; j++) {
      if (res.length >= 2) {
        var pp = res[res.length - 2], p = res[res.length - 1], c = fixed[j];
        if ((Math.abs(pp.x - p.x) < 1 && Math.abs(p.x - c.x) < 1) ||
            (Math.abs(pp.y - p.y) < 1 && Math.abs(p.y - c.y) < 1)) {
          res[res.length - 1] = c;
          continue;
        }
      }
      var prev2 = res[res.length - 1];
      if (!(Math.abs(fixed[j].x - prev2.x) < 1 && Math.abs(fixed[j].y - prev2.y) < 1)) {
        res.push(fixed[j]);
      }
    }
    return res;
  }

  function _fbdPointToSegDist(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    var cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }

  function drawFBDWire(w) {
    var path = _fbdWirePath(w);
    if (!path || path.length < 2) return;
    var hot = w._powered && running;
    var selected = fbdSelectedWireId === w.id;
    if (selected) {
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (var i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = selected ? '#00e5ff' : (hot ? FBD_COLOR_HOT : '#2a3a58');
    ctx.lineWidth = selected ? 2.5 : (hot ? 2 : 1.5);
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (var k = 1; k < path.length; k++) ctx.lineTo(path[k].x, path[k].y);
    ctx.stroke();
  }

  function drawFBDBlock(block) {
    var def = BLOCK_DEFS[block.type];
    if (!def) return;
    var w = def.w, h = def.h;
    block._w = w; block._h = h;
    var x = block.x, y = block.y;
    var energized = running && _fbdBlockOutActive(block);
    var selected = fbdSelectedBlockId === block.id;

    /* Body */
    var isIO = block.type === 'input' || block.type === 'output';
    ctx.fillStyle = isIO ? 'rgba(66, 120, 200, 0.12)'
                   : (block.type === 'not' ? 'rgba(180, 110, 220, 0.12)'
                   : 'rgba(20, 28, 44, 0.92)');
    ctx.strokeStyle = selected ? '#f5c842' : (energized ? FBD_COLOR_HOT : FBD_COLOR_COLD);
    ctx.lineWidth = selected ? 2 : 1.5;
    roundRect(ctx, x, y, w, h, 6);
    ctx.fill();
    ctx.stroke();

    /* Title */
    ctx.font = '700 12px ' + _monoFont;
    ctx.fillStyle = energized ? FBD_COLOR_HOT : FBD_COLOR_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(def.name, x + w / 2, y + 6);

    /* Subtitle for stateful blocks — address + preset/CV */
    if (block.address) {
      ctx.font = '600 10px ' + _monoFont;
      ctx.fillStyle = FBD_COLOR_ACCENT;
      ctx.fillText(block.address, x + w / 2, y + 22);
      /* Symbolic name under I/O var blocks (Start, Motor, …) */
      if (isIO) {
        var ioName = _addrLabel(block.address);
        if (ioName) {
          ctx.font = '9px ' + _fontFamily;
          ctx.fillStyle = '#5f6f92';
          ctx.fillText(ioName, x + w / 2, y + 34);
        }
      }
    }
    if (block.type === 'fbd-ton' || block.type === 'fbd-tof' || block.type === 'fbd-tp') {
      var t = timers[block.address];
      if (t) {
        ctx.font = '600 9px ' + _monoFont;
        ctx.fillStyle = '#6b7a99';
        ctx.textAlign = 'center';
        ctx.fillText('PT:' + t.PRE + '  ET:' + Math.floor(t.ACC), x + w / 2, y + h - 14);
      } else {
        ctx.font = '600 9px ' + _monoFont;
        ctx.fillStyle = '#6b7a99';
        ctx.fillText('PT:' + _sanePreset(block.params.preset, 3000), x + w / 2, y + h - 14);
      }
    }
    if (block.type === 'fbd-ctu' || block.type === 'fbd-ctd') {
      var c = counters[block.address];
      if (c) {
        ctx.font = '600 9px ' + _monoFont;
        ctx.fillStyle = '#f5c842';
        ctx.fillText('CV:' + c.CV + ' / PV:' + c.PV, x + w / 2, y + h - 14);
      } else {
        ctx.font = '600 9px ' + _monoFont;
        ctx.fillStyle = '#6b7a99';
        ctx.fillText('PV:' + _sanePreset(block.params.preset, 5), x + w / 2, y + h - 14);
      }
    }
    /* Compare blocks: show the live comparison "A ? B" with values */
    if (block.type === 'fbd-gt' || block.type === 'fbd-lt' || block.type === 'fbd-eq' ||
        block.type === 'fbd-ne' || block.type === 'fbd-ge' || block.type === 'fbd-le') {
      var cmpSym = block.type === 'fbd-gt' ? '>' : block.type === 'fbd-lt' ? '<'
                 : block.type === 'fbd-eq' ? '=' : block.type === 'fbd-ne' ? '≠'
                 : block.type === 'fbd-ge' ? '≥' : '≤';
      ctx.font = '600 10px ' + _monoFont;
      ctx.fillStyle = FBD_COLOR_ACCENT;
      ctx.fillText(block.params.srcA + ' ' + cmpSym + ' ' + block.params.srcB, x + w / 2, y + 24);
      ctx.font = '600 9px ' + _monoFont;
      ctx.fillStyle = '#6b7a99';
      ctx.fillText(getRegister(block.params.srcA) + ' ' + cmpSym + ' ' + getRegister(block.params.srcB), x + w / 2, y + h - 14);
    }
    /* Math blocks: show the operation and destination value */
    if (block.type === 'fbd-mov' || block.type === 'fbd-add' || block.type === 'fbd-sub' ||
        block.type === 'fbd-mul' || block.type === 'fbd-div') {
      ctx.font = '600 10px ' + _monoFont;
      ctx.fillStyle = FBD_COLOR_ACCENT;
      var mathOp = block.type === 'fbd-add' ? ' + ' : block.type === 'fbd-sub' ? ' − '
                 : block.type === 'fbd-mul' ? ' × ' : ' ÷ ';
      var mathTxt = block.type === 'fbd-mov'
        ? block.params.src + ' → ' + block.params.dest
        : block.params.srcA + mathOp + block.params.srcB + ' → ' + block.params.dest;
      ctx.fillText(mathTxt, x + w / 2, y + 24);
      ctx.font = '600 9px ' + _monoFont;
      ctx.fillStyle = '#6b7a99';
      ctx.fillText(block.params.dest + ' = ' + getRegister(block.params.dest), x + w / 2, y + h - 14);
    }

    /* Port labels are shown when: block is hovered, selected, or a wire is
       being drafted (any connect mode). Matches pneumatic convention. */
    var showPortLabels = (hoveredBlockId === block.id) || selected || (fbdWireDraft != null);

    /* Input ports (left edge) */
    for (var i = 0; i < def.inputs.length; i++) {
      var pn = def.inputs[i];
      var p = fbdPortPos(block, pn, 'in');
      var portHot = running && !!(block._in && block._in[pn]);
      var isHov = hoveredPort && hoveredPort.block.id === block.id &&
                  hoveredPort.port === pn && hoveredPort.side === 'in';
      var r = isHov ? 6 : FBD_PORT_R;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      /* Colour: hot-green when powered, light-cyan when hovered cold, dark otherwise */
      if (portHot)      ctx.fillStyle = FBD_COLOR_PORT_HOT;
      else if (isHov)   ctx.fillStyle = '#80d8ff';
      else              ctx.fillStyle = '#1a2030';
      ctx.fill();
      ctx.strokeStyle = portHot ? FBD_COLOR_HOT : (isHov ? '#80d8ff' : FBD_COLOR_ACCENT);
      ctx.lineWidth = isHov ? 1.5 : 1.2;
      ctx.stroke();
      /* Port label pill — shown only when block hovered/selected/connecting */
      if (showPortLabels && pn) {
        ctx.save();
        ctx.font = 'bold 8px ' + _monoFont;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        var lblX = p.x + r + 3, lblY = p.y;
        var tw = ctx.measureText(pn).width + 6;
        ctx.fillStyle = 'rgba(10,14,20,0.85)';
        roundRectA(lblX - 3, lblY - 6, tw, 12, 3);
        ctx.fill();
        ctx.fillStyle = isHov ? '#80d8ff' : '#00bcd4';
        ctx.fillText(pn, lblX, lblY);
        ctx.restore();
      }
    }

    /* Output ports (right edge) */
    for (var j = 0; j < def.outputs.length; j++) {
      var opn = def.outputs[j];
      var op = fbdPortPos(block, opn, 'out');
      var opHot = running && !!(block._out && block._out[opn]);
      var isOHov = hoveredPort && hoveredPort.block.id === block.id &&
                   hoveredPort.port === opn && hoveredPort.side === 'out';
      var isDraftSrc = fbdWireDraft && fbdWireDraft.blockId === block.id &&
                       fbdWireDraft.port === opn;
      var oR = (isOHov || isDraftSrc) ? 6 : FBD_PORT_R;
      ctx.beginPath();
      ctx.arc(op.x, op.y, oR, 0, Math.PI * 2);
      if (isDraftSrc)    ctx.fillStyle = '#ff9900';         /* orange = active wire source */
      else if (opHot)    ctx.fillStyle = FBD_COLOR_PORT_HOT;
      else if (isOHov)   ctx.fillStyle = '#80d8ff';
      else               ctx.fillStyle = '#1a2030';
      ctx.fill();
      ctx.strokeStyle = isDraftSrc ? '#ff9900' : (opHot ? FBD_COLOR_HOT : (isOHov ? '#80d8ff' : FBD_COLOR_ACCENT));
      ctx.lineWidth = (isOHov || isDraftSrc) ? 1.5 : 1.2;
      ctx.stroke();
      if (showPortLabels && opn) {
        ctx.save();
        ctx.font = 'bold 8px ' + _monoFont;
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        var olblX = op.x - oR - 3, olblY = op.y;
        var otw = ctx.measureText(opn).width + 6;
        ctx.fillStyle = 'rgba(10,14,20,0.85)';
        roundRectA(olblX - otw + 3, olblY - 6, otw, 12, 3);
        ctx.fill();
        ctx.fillStyle = isOHov ? '#80d8ff' : '#00bcd4';
        ctx.fillText(opn, olblX, olblY);
        ctx.restore();
      }
    }
  }

  function _fbdBlockOutActive(block) {
    if (!block._out) return false;
    var def = BLOCK_DEFS[block.type];
    if (!def) return false;
    if (block.type === 'output') return !!(block._in && block._in['in']);
    for (var i = 0; i < def.outputs.length; i++) if (block._out[def.outputs[i]]) return true;
    return false;
  }

  /* Port tooltip — dark box with an arrow pointing at the hovered port.
     Ported from pneumatic drawPortTooltip. Renders in CANVAS pixel space
     (not world), so we bypass the zoom/pan transform. */
  function drawFBDPortTooltip(port) {
    if (!port || !port.block || !BLOCK_DEFS[port.block.type]) return;
    var def = BLOCK_DEFS[port.block.type];

    /* Title: e.g. "Port in1", "Port out" — or include address for I/O blocks */
    var title = 'Port ' + port.port;
    if (port.block.type === 'input' || port.block.type === 'output') {
      title = (port.block.type === 'input' ? 'Input' : 'Output') + ' · ' + (port.block.address || '?');
    }
    var desc = _fbdPortDesc(port.block.type, port.port);

    /* Is this a valid target during wire draft? (Colour the border) */
    var isInvalid = false;
    if (fbdWireDraft) {
      if (port.side !== 'in' || port.block.id === fbdWireDraft.blockId) isInvalid = true;
    }
    var borderCol = isInvalid ? '#ef5350' : '#f5c518';
    var labelCol  = isInvalid ? '#ff8a80' : '#ffd700';
    var descCol   = isInvalid ? '#ffcdd2' : '#ffe98a';

    /* Tooltip coords are in screen CSS-px; canvas internal resolution may be
       larger (DPR). We draw in canvas units so multiply CSS-px by W/rect.width. */
    var rect = cvs.getBoundingClientRect();
    var scX = W / rect.width;
    var scY = H / rect.height;
    var sx = hoveredPortSX * scX;
    var sy = hoveredPortSY * scY;
    if (!isFinite(sx) || !isFinite(sy)) return;

    var PORT_R = 6, ARROW_H = 8;
    var PAD_X = 12, PAD_Y = 7;
    var F1 = 12, F2 = 11, GAP = 4, BRAD = 5;

    ctx.save();
    ctx.font = 'bold ' + F1 + 'px ' + _fontFamily;
    var w1 = ctx.measureText(title).width;
    ctx.font = F2 + 'px ' + _fontFamily;
    var w2 = desc ? ctx.measureText(desc).width : 0;

    var bw = Math.max(w1, w2) + PAD_X * 2;
    var bh = PAD_Y + F1 + (desc ? GAP + F2 : 0) + PAD_Y;

    var bx = sx - bw / 2;
    var by = sy - PORT_R - ARROW_H - bh;

    /* Clamp horizontally + flip vertically if no room above */
    if (bx < 4) bx = 4;
    if (bx + bw > W - 4) bx = W - bw - 4;
    var flipped = by < 4;
    if (flipped) by = sy + PORT_R + ARROW_H;

    /* Shadow */
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#0d1625';
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 1.3;
    roundRectA(bx, by, bw, bh, BRAD);
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.stroke();

    /* Arrow pointing toward port */
    var arrowBaseY = flipped ? by : by + bh;
    var arrowTipY  = flipped ? by - ARROW_H : by + bh + ARROW_H;
    var arrowX = Math.max(bx + 10, Math.min(bx + bw - 10, sx));
    ctx.beginPath();
    ctx.moveTo(arrowX - 6, arrowBaseY);
    ctx.lineTo(arrowX + 6, arrowBaseY);
    ctx.lineTo(arrowX, arrowTipY);
    ctx.closePath();
    ctx.fillStyle = '#0d1625';
    ctx.fill();
    ctx.strokeStyle = borderCol;
    ctx.stroke();

    /* Title */
    ctx.font = 'bold ' + F1 + 'px ' + _fontFamily;
    ctx.fillStyle = labelCol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(title, bx + bw / 2, by + PAD_Y);

    /* Description */
    if (desc) {
      ctx.font = F2 + 'px ' + _fontFamily;
      ctx.fillStyle = descCol;
      ctx.fillText(desc, bx + bw / 2, by + PAD_Y + F1 + GAP);
    }

    ctx.restore();
  }

  /* ================================================================
     SECTION 6c — FBD EDITOR EVENT HANDLERS
     ================================================================ */

  function _fbdPointToPort(cx, cy) {
    /* Returns { block, port, side } under the cursor, or null. cx/cy in canvas coords.
       Tolerance is divided by viewScale so it stays constant in SCREEN pixels —
       a fixed world-unit tolerance shrinks to ~2px at min zoom, unhittable. */
    var HIT = (FBD_PORT_R + 4) / Math.min(1, viewScale);
    for (var i = 0; i < fbdBlocks.length; i++) {
      var b = fbdBlocks[i];
      var def = BLOCK_DEFS[b.type];
      if (!def) continue;
      for (var j = 0; j < def.inputs.length; j++) {
        var p = fbdPortPos(b, def.inputs[j], 'in');
        if (Math.abs(cx - p.x) <= HIT && Math.abs(cy - p.y) <= HIT) return { block: b, port: def.inputs[j], side: 'in' };
      }
      for (var k = 0; k < def.outputs.length; k++) {
        var op = fbdPortPos(b, def.outputs[k], 'out');
        if (Math.abs(cx - op.x) <= HIT && Math.abs(cy - op.y) <= HIT) return { block: b, port: def.outputs[k], side: 'out' };
      }
    }
    return null;
  }

  function _fbdPointToBlock(cx, cy) {
    /* Hit-test block body. Returns block or null. */
    for (var i = fbdBlocks.length - 1; i >= 0; i--) {
      var b = fbdBlocks[i];
      var def = BLOCK_DEFS[b.type];
      if (!def) continue;
      var bx = b.x, by = b.y;
      if (cx >= bx && cx <= bx + def.w && cy >= by && cy <= by + def.h) return b;
    }
    return null;
  }

  /* Hit-test wires. Returns { wire, segIdx, axis } where axis is 'h' or 'v',
     or null. 6px tolerance. Iterate topmost-first. */
  function _fbdPointToWire(cx, cy) {
    for (var i = fbdWires.length - 1; i >= 0; i--) {
      var w = fbdWires[i];
      var path = _fbdWirePath(w);
      if (!path || path.length < 2) continue;
      for (var s = 1; s < path.length; s++) {
        var a = path[s - 1], b = path[s];
        /* Both path points and cursor (cx/cy) are in world coords here.
           Tolerance scaled so it stays ~6 screen px at any zoom. */
        if (_fbdPointToSegDist(cx, cy, a.x, a.y, b.x, b.y) < 6 / Math.min(1, viewScale)) {
          var axis = Math.abs(a.x - b.x) < 1 ? 'v' : 'h';
          return { wire: w, segIdx: s - 1, axis: axis };
        }
      }
    }
    return null;
  }

  function fbdAddBlock(type, x, y) {
    var def = BLOCK_DEFS[type];
    if (!def) return null;
    saveUndo();
    var blk = {
      id: nextFbdBlockId++,
      type: type,
      x: Math.round(x / 10) * 10,
      y: Math.round(y / 10) * 10,
      address: def.params.address ? def.params.address.def : '',
      params: {},
      _in: {}, _out: {}
    };
    for (var pk in def.params) {
      if (pk === 'address') continue;
      blk.params[pk] = def.params[pk].def;
    }
    fbdBlocks.push(blk);
    return blk;
  }

  function fbdDeleteBlock(id) {
    saveUndo();
    for (var i = fbdBlocks.length - 1; i >= 0; i--) if (fbdBlocks[i].id === id) fbdBlocks.splice(i, 1);
    for (var j = fbdWires.length - 1; j >= 0; j--) {
      var w = fbdWires[j];
      if (w.from.blockId === id || w.to.blockId === id) fbdWires.splice(j, 1);
    }
    if (fbdSelectedBlockId === id) fbdSelectedBlockId = null;
    fbdSelectedWireId = null;
  }

  function fbdConnect(fromBlockId, fromPort, toBlockId, toPort, waypoints) {
    if (fromBlockId === toBlockId) return false;  /* no direct self-loop on same port */
    /* Enforce single incoming wire per input port — replace any existing */
    for (var i = fbdWires.length - 1; i >= 0; i--) {
      var w = fbdWires[i];
      if (w.to.blockId === toBlockId && w.to.port === toPort) fbdWires.splice(i, 1);
    }
    saveUndo();
    fbdWires.push({
      id: nextFbdWireId++,
      from: { blockId: fromBlockId, port: fromPort },
      to:   { blockId: toBlockId,   port: toPort },
      waypoints: (waypoints && waypoints.length > 0) ? waypoints.slice() : [],
      _powered: false
    });
    return true;
  }

  function setViewMode(mode) {
    if (mode !== 'ladder' && mode !== 'fbd') return;
    if (viewMode === mode) return;
    if (running) stopSim();
    viewMode = mode;
    fbdSelectedBlockId = null;
    selectedElement = null;
    selectedCell = null;
    fbdWireDraft = null;
    hideProperties();
    updateViewTabs();
    updatePaletteVisibility();
    updateToolbarState();
    draw();
  }

  function updateViewTabs() {
    var tabs = document.querySelectorAll('#view-tabs .pill');
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-view') === viewMode;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function updatePaletteVisibility() {
    /* Show FBD categories when view=fbd, ladder categories (everything not marked fbd) when view=ladder */
    var ladderCats = document.querySelectorAll('#palette .palette-cat:not(.fbd-cat), #palette .palette-cat-items:not(.fbd-cat)');
    var fbdCats    = document.querySelectorAll('#palette .fbd-cat');
    if (viewMode === 'fbd') {
      ladderCats.forEach(function (el) { el.style.display = 'none'; });
      fbdCats.forEach(function (el) { el.style.display = ''; });
    } else {
      ladderCats.forEach(function (el) { el.style.display = ''; });
      fbdCats.forEach(function (el) { el.style.display = 'none'; });
    }
    /* Hide Add Rung / Undo / Clear labels that don't apply in FBD? Keep Undo/Clear */
    var btnAddRung = document.getElementById('btn-add-rung');
    if (btnAddRung) btnAddRung.style.display = viewMode === 'fbd' ? 'none' : '';
  }

  /* ================================================================
     SECTION 7 — ANIMATION LOOP
     ================================================================ */

  function animate(timestamp) {
    if (!running && !stepping) return;

    var dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    simTime += dt;

    scanCycle(dt);
    updateIOPanel();
    updateReadouts();
    refreshPropsModalLive();
    draw();

    if (stepping) {
      stepping = false;
      running = false;
      updateToolbarState();
    } else {
      animFrame = requestAnimationFrame(animate);
    }
  }

  function _hasActiveProgram() {
    return (viewMode === 'fbd') ? fbdBlocks.length > 0 : rungs.length > 0;
  }

  /* ================================================================
     PROGRAM VALIDATION — address syntax, context fit, duplicate OTEs.
     A typo like "Q00" or "i0.0" silently reads FALSE / writes nowhere,
     which students cannot distinguish from a logic error, so Run/Step
     surfaces these in the warning bar.
     ================================================================ */

  var _RE_BIT  = /^[IQM]\d+\.\d+$/;
  var _RE_TMR  = /^T\d+(\.(DN|TT|EN))?$/;
  var _RE_CTR  = /^C\d+(\.(DN|OV))?$/;
  var _RE_DREG = /^D\d+$/;

  /* Validate the main address of an element/block for its instruction type.
     Returns a problem string, or null if fine. */
  function _addressProblem(addr, elType) {
    var readable = function (a) {
      return _RE_BIT.test(a) || _RE_TMR.test(a) || _RE_CTR.test(a);
    };
    if (elType === 'branch-start' || elType === 'branch-end') return null;
    if (!addr || addr === '') return 'address is empty';
    if (/\s/.test(addr)) return 'address contains spaces';

    /* Contacts / FBD input read any bit */
    if (elType === 'contact-no' || elType === 'contact-nc' ||
        elType === 'contact-pos' || elType === 'contact-neg' || elType === 'input') {
      return readable(addr) ? null
        : 'not a valid bit address (use I0.0 / Q0.0 / M0.0 / T0.DN / C0.DN)';
    }
    /* Output-writing coils / FBD output must be Q or M */
    if (elType === 'coil' || elType === 'coil-set' || elType === 'coil-reset' ||
        elType === 'coil-neg' || elType === 'output') {
      if (_RE_BIT.test(addr)) {
        return addr.charAt(0) === 'I'
          ? 'coils cannot write to an INPUT — use a Q (output) or M (memory) bit'
          : null;
      }
      return 'not a valid coil address (use Q0.0 or M0.0)';
    }
    /* Latches write M/Q bits */
    if (elType === 'sr' || elType === 'rs') {
      return (_RE_BIT.test(addr) && addr.charAt(0) !== 'I') ? null
        : 'latch memory must be an M or Q bit (e.g. M0.0)';
    }
    /* RES targets a timer or counter base */
    if (elType === 'res') {
      return (/^T\d+$/.test(addr) || /^C\d+$/.test(addr)) ? null
        : 'RES must name a timer or counter base (T0 or C0)';
    }
    /* Timers */
    if (_isTimerType(elType) || elType === 'fbd-ton' || elType === 'fbd-tof' || elType === 'fbd-tp') {
      return /^T\d+$/.test(addr) ? null : 'timer must be named T0, T1, … (no bit suffix)';
    }
    /* Counters */
    if (_isCounterType(elType) || elType === 'fbd-ctu' || elType === 'fbd-ctd') {
      return /^C\d+$/.test(addr) ? null : 'counter must be named C0, C1, … (no bit suffix)';
    }
    return null;
  }

  /* Validate a data-source/dest param (compare & math operands). */
  function _regParamProblem(v, isDest) {
    if (v === undefined || v === null || v === '') return 'operand is empty';
    var s = String(v).trim();
    if (isDest) {
      return _RE_DREG.test(s) ? null : 'destination must be a D register (D0…D7)';
    }
    if (isFinite(parseFloat(s)) && /^[-+]?\d+(\.\d+)?$/.test(s)) return null; /* literal */
    if (_RE_DREG.test(s) || /^T\d+$/.test(s) || /^C\d+$/.test(s)) return null;
    return 'source must be a number, D register, timer (T0=ACC) or counter (C0=CV)';
  }

  function validateProgram() {
    var issues = [];
    function _isBitRead(a) { return _RE_BIT.test(a) || _RE_TMR.test(a) || _RE_CTR.test(a); }
    function checkEl(el, where) {
      var def = COMP_DEFS[el.type];
      /* Only elements that declare an address param carry one (compare/math
         blocks use src/dest operands instead). */
      if (def && def.params && def.params.address) {
        var prob = _addressProblem(el.address, el.type);
        if (prob) issues.push(where + ' ' + def.name + ': ' + prob);
      }
      var p = el.params || {};
      ['src', 'srcA', 'srcB'].forEach(function (k) {
        if (k in p) { var m = _regParamProblem(p[k], false); if (m) issues.push(where + ' ' + el.type.toUpperCase() + ' ' + k + ': ' + m); }
      });
      if ('dest' in p) { var md = _regParamProblem(p.dest, true); if (md) issues.push(where + ' ' + el.type.toUpperCase() + ' dest: ' + md); }
      if (p.reset && !_isBitRead(String(p.reset))) {
        issues.push(where + ' CTU reset: not a valid bit address');
      }
      if (p.downSrc && !_isBitRead(String(p.downSrc))) {
        issues.push(where + ' CTUD down input: not a valid bit address');
      }
    }
    if (viewMode === 'ladder') {
      var oteRungs = {};   /* OTE address → [rung numbers] for duplicate check */
      for (var r = 0; r < rungs.length; r++) {
        var where = 'Rung ' + (r + 1) + ':';
        for (var i = 0; i < rungs[r].elements.length; i++) {
          var el = rungs[r].elements[i];
          checkEl(el, where);
          if ((el.type === 'coil' || el.type === 'coil-neg') && el.address) {
            if (!oteRungs[el.address]) oteRungs[el.address] = [];
            if (oteRungs[el.address].indexOf(r + 1) < 0) oteRungs[el.address].push(r + 1);
          }
        }
        for (var b = 0; b < rungs[r].branches.length; b++) {
          for (var be = 0; be < rungs[r].branches[b].elements.length; be++) {
            checkEl(rungs[r].branches[b].elements[be], where);
          }
        }
      }
      for (var oa in oteRungs) {
        if (oteRungs[oa].length > 1) {
          issues.push('Output ' + oa + ' is driven by coils on rungs ' + oteRungs[oa].join(' and ') +
            ' — only the LAST rung’s result sticks each scan (last-write-wins). Use Set/Reset coils or one rung with a branch.');
        }
      }
    } else {
      for (var fb = 0; fb < fbdBlocks.length; fb++) {
        var blk = fbdBlocks[fb];
        var bdef = BLOCK_DEFS[blk.type];
        if (!bdef) continue;
        if (bdef.params && bdef.params.address) {
          var bprob = _addressProblem(blk.address, blk.type);
          if (bprob) issues.push(bdef.name + ' block: ' + bprob);
        }
        var bp = blk.params || {};
        ['src', 'srcA', 'srcB'].forEach(function (k) {
          if (k in bp) { var bm = _regParamProblem(bp[k], false); if (bm) issues.push(bdef.name + ' block ' + k + ': ' + bm); }
        });
        if ('dest' in bp) { var bmd = _regParamProblem(bp.dest, true); if (bmd) issues.push(bdef.name + ' block dest: ' + bmd); }
      }
    }
    return issues;
  }

  function startSim() {
    if (running) return;
    if (!_hasActiveProgram()) {
      showWarning(viewMode === 'fbd'
        ? 'Add FBD blocks before running the simulation.'
        : 'Add rungs before running the simulation.');
      return;
    }
    /* An empty branch is a bare wire in parallel — it shorts around every
       main-path contact in its span. Warn so students don't mistake the
       always-ON output for correct logic. */
    if (viewMode === 'ladder') {
      for (var wr = 0; wr < rungs.length; wr++) {
        var emptyBr = false;
        for (var wb = 0; wb < rungs[wr].branches.length; wb++) {
          if (rungs[wr].branches[wb].elements.length === 0) { emptyBr = true; break; }
        }
        if (emptyBr) {
          showWarning('Rung ' + (wr + 1) + ' has an empty branch — a bare parallel wire bypasses (shorts around) the contacts in its span. Place a contact on it or delete it.');
          break;
        }
      }
    }
    /* Surface address typos / context misuse / duplicate OTEs before running */
    var vIssues = validateProgram();
    if (vIssues.length) {
      showWarning('⚠ ' + vIssues[0] + (vIssues.length > 1 ? '  (+' + (vIssues.length - 1) + ' more issue' + (vIssues.length > 2 ? 's' : '') + ')' : ''));
    }
    running = true;
    lastTime = performance.now();
    animFrame = requestAnimationFrame(animate);
    updateToolbarState();
  }

  /* PAUSE — freeze scanning with all state (incl. outputs) held for
     inspection and step-debugging. */
  function stopSim() {
    running = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
    updateToolbarState();
    draw();
  }

  /* STOP — real-PLC STOP-mode semantics: scanning halts and the OUTPUT
     image is de-energized. Retentive state (memory bits, timers, counters,
     registers) is kept, exactly like switching a PLC from RUN to STOP. */
  function plcStop() {
    stopSim();
    for (var k in outputs) outputs[k] = false;
    updateIOPanel();
    draw();
  }

  function stepSim() {
    if (!_hasActiveProgram()) {
      showWarning(viewMode === 'fbd' ? 'Add FBD blocks before stepping.' : 'Add rungs before stepping.');
      return;
    }
    stepping = true;
    running = true;
    lastTime = performance.now();
    animFrame = requestAnimationFrame(animate);
  }

  function resetSim() {
    stopSim();
    simTime = 0;
    scanCount = 0;
    scanDurationMs = 0;

    /* Reset all addresses — but respect input kinds: NC momentaries rest at
       TRUE, so they should return to TRUE, not FALSE. */
    var k;
    for (k in inputs) inputs[k] = (_inputKind(k) === 'mom-nc');
    for (k in outputs)   outputs[k] = false;
    for (k in memory)    memory[k] = false;
    /* Registers return to their PROGRAM defaults, not to zero. A preset's
       setpoints (e.g. the thermostat's D1=30 / D2=20) are part of the
       program, so zeroing them on Reset silently broke the program. */
    for (k in registers) registers[k] = (k in registerDefaults) ? registerDefaults[k] : 0;
    timers = {};
    counters = {};
    prevValues = {};
    prePrevValues = {};
    inputSnapshot = {};
    scanActive = false;

    /* FBD runtime state — clear per-block input/output/edge flags so a fresh
       Run starts from a known zero. Block topology (position/wires) is preserved. */
    for (var fb = 0; fb < fbdBlocks.length; fb++) {
      fbdBlocks[fb]._in = {};
      fbdBlocks[fb]._out = {};
      fbdBlocks[fb]._edgePrev = false;
    }
    for (var fw = 0; fw < fbdWires.length; fw++) {
      fbdWires[fw]._powered = false;
    }

    /* Reset element states */
    for (var r = 0; r < rungs.length; r++) {
      rungs[r].outputPower = false;
      for (var e = 0; e < rungs[r].elements.length; e++) {
        rungs[r].elements[e].state = false;
        rungs[r].elements[e]._prevState = false;
      }
      for (var b = 0; b < rungs[r].branches.length; b++) {
        for (var be = 0; be < rungs[r].branches[b].elements.length; be++) {
          rungs[r].branches[b].elements[be].state = false;
        }
      }
    }

    updateIOPanel();
    updateReadouts();
    draw();
  }

  function updateToolbarState() {
    btnRun.style.display = running ? 'none' : '';
    btnStop.style.display = running ? '' : 'none';
    var _bps = document.getElementById('btn-plc-stop');
    if (_bps) _bps.style.display = running ? '' : 'none';
    if (readoutsBar) readoutsBar.style.display = running || scanCount > 0 ? '' : 'none';

    if (toolbarHint) {
      toolbarHint.textContent = running
        ? 'Simulation running. Toggle inputs in the I/O panel below.'
        : 'Click an instruction to add it to a rung. Toggle inputs in the I/O panel.';
    }
  }

  function updateIOPanel() {
    /* Update input toggle buttons — also reflect kind (toggle/mom-no/mom-nc)
       via data attribute + visible kind chip next to each input. */
    var inputBtns = document.querySelectorAll('#input-grid .io-toggle');
    inputBtns.forEach(function (btn) {
      var addr = btn.getAttribute('data-addr');
      var isOn = inputs[addr] || false;
      btn.classList.toggle('on', isOn);
      var kind = _inputKind(addr);
      btn.setAttribute('data-kind', kind);
      btn.title = addr + ' — ' +
        (kind === 'toggle' ? 'Switch — maintained (click to flip)' :
         kind === 'mom-no' ? 'Momentary NO push-button (hold to energise)' :
                             'Momentary NC push-button (rest=ON, hold to de-energise)');

      /* Ensure a visible kind chip exists and reflects the current kind. */
      var item = btn.closest('.io-item');
      if (item) {
        var chip = item.querySelector('.io-kind-chip');
        if (!chip) {
          chip = document.createElement('button');
          chip.className = 'io-kind-chip';
          chip.setAttribute('data-addr', addr);
          chip.title = 'Click to cycle type: Switch → NO → NC';
          item.appendChild(chip);
        }
        chip.setAttribute('data-kind', kind);
        chip.textContent =
          kind === 'toggle' ? 'Switch' :
          kind === 'mom-no' ? 'NO'  : 'NC';
      }
    });

    /* Update input labels */
    for (var i = 0; i < 8; i++) {
      var lbl = document.getElementById('lbl-I0.' + i);
      if (lbl) lbl.textContent = inputLabels[i] || '';
    }

    /* Update output LEDs */
    var outputLeds = document.querySelectorAll('#output-grid .io-led');
    outputLeds.forEach(function (led) {
      var addr = led.getAttribute('data-addr');
      var isOn = outputs[addr] || false;
      led.classList.toggle('on', isOn);
    });

    /* Update output labels */
    for (var o = 0; o < 8; o++) {
      var olbl = document.getElementById('lbl-Q0.' + o);
      if (olbl) olbl.textContent = outputLabels[o] || '';
    }

    /* Status display */
    if (statScanTime) statScanTime.textContent = scanDurationMs.toFixed(2) + ' ms';
    if (statCycleCount) statCycleCount.textContent = '' + scanCount;
    var statState = document.getElementById('stat-state');
    if (statState) statState.textContent = running ? 'RUNNING' : 'STOPPED';

    updateDataPanel();
  }

  /* ================================================================
     DATA / WATCH PANEL — memory bits, data registers, and timer /
     counter internals. The I/O panel only exposes physical I/O, so
     without this the M bits are invisible and the D registers can't
     be set at all (which left every compare/math instruction — and
     the thermostat preset — impossible to exercise from the UI).
     Values are editable live, like a TIA Portal watch table.
     ================================================================ */

  var memoryGrid   = document.getElementById('memory-grid');
  var registerGrid = document.getElementById('register-grid');
  var tcGrid       = document.getElementById('tc-grid');
  var _regEditing  = null;   /* address being typed into — don't clobber it */

  function _buildDataPanel() {
    if (memoryGrid && !memoryGrid.childNodes.length) {
      var mHtml = '';
      for (var m = 0; m < 8; m++) {
        mHtml += '<button class="mem-chip" data-addr="M0.' + m + '" ' +
                 'title="M0.' + m + ' — click to force this memory bit" ' +
                 'aria-label="Memory bit M0.' + m + '">' +
                 '<span class="mem-dot"></span>M0.' + m + '</button>';
      }
      memoryGrid.innerHTML = mHtml;
    }
    if (registerGrid && !registerGrid.childNodes.length) {
      var rHtml = '';
      for (var d = 0; d < 8; d++) {
        rHtml += '<div class="data-reg-row">' +
                 '<span class="data-reg-addr">D' + d + '</span>' +
                 '<input class="data-reg-input" type="number" step="any" ' +
                 'data-addr="D' + d + '" value="0" ' +
                 'title="D' + d + ' — type a value to force it (works while running)" ' +
                 'aria-label="Data register D' + d + '"></div>';
      }
      registerGrid.innerHTML = rHtml;
    }
  }

  function updateDataPanel() {
    /* Memory bits */
    if (memoryGrid) {
      var bits = memoryGrid.querySelectorAll('.mem-chip');
      for (var i = 0; i < bits.length; i++) {
        bits[i].classList.toggle('on', !!memory[bits[i].getAttribute('data-addr')]);
      }
    }
    /* Data registers — skip the field the user is currently typing into */
    if (registerGrid) {
      var regs = registerGrid.querySelectorAll('.data-reg-input');
      for (var r = 0; r < regs.length; r++) {
        var ra = regs[r].getAttribute('data-addr');
        if (_regEditing === ra) continue;
        var rv = registers[ra] || 0;
        /* Trim float noise from DIV without lying about the value */
        var shown = (Math.round(rv * 1000) / 1000);
        if (regs[r].value !== String(shown)) regs[r].value = shown;
      }
    }
    /* Timers & counters — only those the program actually instantiated */
    if (!tcGrid) return;
    var html = '';
    var tk;
    for (tk in timers) {
      var t = timers[tk];
      html += '<div class="data-tc-row"><span class="data-tc-name">' + tk + '</span>' +
              '<span class="data-tc-val">PRE <b>' + Math.round(t.PRE) + '</b> ms · ACC <b>' + Math.round(t.ACC) + '</b> ms</span>' +
              '<span class="data-tc-bits">' +
              '<span class="data-tc-bit' + (t.EN ? ' on' : '') + '">EN</span>' +
              '<span class="data-tc-bit' + (t.TT ? ' on' : '') + '">TT</span>' +
              '<span class="data-tc-bit' + (t.DN ? ' on' : '') + '">DN</span>' +
              '</span></div>';
    }
    for (tk in counters) {
      var c = counters[tk];
      html += '<div class="data-tc-row"><span class="data-tc-name">' + tk + '</span>' +
              '<span class="data-tc-val">CV <b>' + c.CV + '</b> · PV <b>' + c.PV + '</b></span>' +
              '<span class="data-tc-bits">' +
              '<span class="data-tc-bit' + (c.DN ? ' on' : '') + '">DN</span>' +
              '<span class="data-tc-bit' + (c.OV ? ' on' : '') + '">OV</span>' +
              '</span></div>';
    }
    if (!html) html = '<span class="data-empty">No timers or counters in this program.</span>';
    if (tcGrid.innerHTML !== html) tcGrid.innerHTML = html;
  }

  _buildDataPanel();

  /* Force a memory bit by clicking it */
  if (memoryGrid) {
    memoryGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('.mem-chip');
      if (!btn) return;
      var addr = btn.getAttribute('data-addr');
      memory[addr] = !memory[addr];
      updateDataPanel();
      if (!running) draw();
    });
  }

  /* ── Inputs / Data tab strip ──────────────────────────────── */
  (function () {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.io-tab'));
    if (!tabs.length) return;
    var hintInputs = document.querySelector('.io-hint-for-inputs');
    var hintData   = document.querySelector('.io-hint-for-data');

    function selectTab(name, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-iotab') === name;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
        if (on && focus) t.focus();
      });
      if (hintInputs) hintInputs.hidden = (name !== 'inputs');
      if (hintData)   hintData.hidden   = (name !== 'data');
      /* Values are only painted into a visible panel — refresh on show */
      if (name === 'data') updateDataPanel();
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { selectTab(t.getAttribute('data-iotab'), false); });
    });
    /* Left/Right arrow keys move between tabs (WAI-ARIA tabs pattern) */
    document.querySelector('.io-tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      var next = (e.key === 'ArrowRight') ? (i + 1) % tabs.length : (i - 1 + tabs.length) % tabs.length;
      selectTab(tabs[next].getAttribute('data-iotab'), true);
    });
  })();

  /* Force a data register by typing into it */
  if (registerGrid) {
    registerGrid.addEventListener('focusin', function (e) {
      var inp = e.target.closest('.data-reg-input');
      if (inp) _regEditing = inp.getAttribute('data-addr');
    });
    registerGrid.addEventListener('focusout', function (e) {
      var inp = e.target.closest('.data-reg-input');
      if (inp && _regEditing === inp.getAttribute('data-addr')) _regEditing = null;
      updateDataPanel();
    });
    registerGrid.addEventListener('input', function (e) {
      var inp = e.target.closest('.data-reg-input');
      if (!inp) return;
      var addr = inp.getAttribute('data-addr');
      var v = parseFloat(inp.value);
      registers[addr] = isFinite(v) ? v : 0;
      if (!running) draw();
    });
  }

  function updateReadouts() {
    if (rScanTime) rScanTime.textContent = scanDurationMs.toFixed(2);
    if (rCycleCount) rCycleCount.textContent = '' + scanCount;
    if (rActiveRungs) {
      var active = 0;
      for (var r = 0; r < rungs.length; r++) {
        if (rungs[r].outputPower) active++;
      }
      rActiveRungs.textContent = '' + active;
      var total = rActiveRungs.parentNode;
      if (total) {
        var unitSpan = total.querySelector('.readout-unit');
        if (unitSpan) unitSpan.textContent = ' / ' + rungs.length;
      }
    }
    if (rMemory) {
      var usedBits = 0;
      for (var k in memory) { if (memory[k]) usedBits++; }
      for (var k2 in outputs) { if (outputs[k2]) usedBits++; }
      var totalBits = 16 + 8; /* memory + outputs */
      rMemory.textContent = totalBits > 0 ? Math.round(usedBits / totalBits * 100) : 0;
    }
  }

  function showWarning(msg) {
    if (!warningBar) return;
    warningBar.textContent = msg;
    warningBar.style.display = '';
    setTimeout(function () { warningBar.style.display = 'none'; }, 3000);
  }

  /* ================================================================
     SECTION 8 — EVENT HANDLERS
     ================================================================ */

  function getCanvasPos(e) {
    var rect = cvs.getBoundingClientRect();
    var scaleX = W / rect.width;
    var scaleY = H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  /* World-space version — used when hit-testing content that's been zoom/panned.
     Ladder uses screen coords directly (simpler); FBD uses world coords. */
  function getCanvasWorldPos(e) {
    var p = getCanvasPos(e);
    return { x: toWX(p.x), y: toWY(p.y) };
  }

  /* Ladder pointer position in WORLD coords. The ladder is drawn under the
     same zoom/pan transform as FBD, so every ladder hit-test must undo it —
     using raw screen coords would mis-target as soon as the user zooms. */
  function getLadderPos(e) {
    return getCanvasWorldPos(e);
  }

  function getCellAt(px, py) {
    /* Determine which rung and cell the point is in */
    var yOff = RUNG_HEADER - scrollY;
    for (var r = 0; r < rungs.length; r++) {
      var rH = getRungHeight(rungs[r]);
      var rungTop = yOff;
      var rungBot = yOff + rH * CELL_H;

      if (py >= rungTop && py < rungBot) {
        var col = Math.floor((px - RAIL_X_L) / CELL_W) - 1;
        var row = Math.floor((py - rungTop) / CELL_H);
        if (col >= 0 && col < COLS) {
          return { rungIdx: r, col: col, row: row };
        }
      }
      yOff += rH * CELL_H + RUNG_HEADER;
    }
    return null;
  }

  /* Canvas pointerdown — place elements, select, or toggle canvas I/O */
  cvs.addEventListener('pointerdown', function (e) {
    if (mode !== 'simulate') return;
    if (viewMode === 'fbd') { _fbdPointerDown(e); return; }

    /* Pan mode (or middle button) drags the ladder view, same as FBD */
    if (panMode || e.button === 1) {
      var sp = getCanvasPos(e);
      panActive = true;
      panStartX = sp.x; panStartY = sp.y;
      panOffX0 = viewOffX; panOffY0 = viewOffY;
      cvs.style.cursor = 'grabbing';
      e.preventDefault();
      return;
    }

    var pos = getLadderPos(e);

    /* Only block scroll when touching an interactive cell */
    var cell = getCellAt(pos.x, pos.y);
    if (cell || draggingType) e.preventDefault();

    /* Cell click */
    if (!cell) {
      selectedElement = null;
      selectedCell = null;
      hideProperties();
      /* Empty area: allow touch/pointer drag to scroll a tall ladder
         (the canvas has touch-action:none, so this is the only scroll
         path on touch devices besides the wheel). */
      if (annTool === 'move' && !draggingType) {
        _scrollDrag = { y: pos.y, sy: scrollY };
      }
      draw();
      return;
    }

    /* If we have a palette selection, place it */
    if (draggingType) {
      saveUndo();
      var placed = addElement(cell.rungIdx, draggingType, cell.col, cell.row, null);
      if (!placed) {
        showWarning('Cannot place instruction here. Check placement rules.');
      }
      /* Don't clear draggingType so user can place multiple */
      draw();
      return;
    }

    /* D2: Select existing element — start drag-to-reposition */
    var el = getElementAt(cell.rungIdx, cell.col, cell.row);
    if (el) {
      /* Running: a click on an input-bound contact operates that input
         (toggle / momentary, same semantics as the I/O panel buttons). */
      if (running) {
        var opAddr = _contactInputAddr(el);
        if (opAddr) { _canvasOperateInput(opAddr, e.pointerId); return; }
      }
      selectedElement = el;
      selectedCell = cell;
      _dragEl = { el: el, rungIdx: cell.rungIdx, origCol: el.col, origRow: el.row, moved: false };
      updateProperties();
    } else {
      selectedElement = null;
      selectedCell = cell;
      _dragEl = null;
      hideProperties();
      /* Empty cell: eligible for drag-to-scroll too */
      if (annTool === 'move') {
        _scrollDrag = { y: pos.y, sy: scrollY };
      }
    }
    draw();
  });

  var _dragEl = null;
  var _scrollDrag = null;

  /* Canvas mousemove — hover preview + D2 drag reposition */
  cvs.addEventListener('pointermove', function (e) {
    if (mode !== 'simulate') return;
    if (viewMode === 'fbd') { _fbdPointerMove(e); return; }

    /* Ladder pan drag */
    if (panActive) {
      var pp = getCanvasPos(e);
      viewOffX = panOffX0 + (pp.x - panStartX);
      viewOffY = panOffY0 + (pp.y - panStartY);
      draw();
      return;
    }

    if (_dragEl) e.preventDefault();
    var pos = getLadderPos(e);

    /* Drag-to-scroll (started on an empty area in pointerdown) */
    if (_scrollDrag && e.buttons === 1 && !_dragEl && !draggingType) {
      var maxScrollD = getTotalHeight() - H + 40;
      if (maxScrollD > 0) {
        var nsY = Math.max(0, Math.min(_scrollDrag.sy - (pos.y - _scrollDrag.y), maxScrollD));
        if (nsY !== scrollY) { scrollY = nsY; draw(); }
        return;
      }
    }

    var cell = getCellAt(pos.x, pos.y);

    /* D2: drag-to-reposition existing element. Elements move within their own
       row: main-row elements stay on row 0; branch elements stay inside their
       branch's span (moving them out of the branch array would disconnect
       them from the logic engine). */
    if (_dragEl && cell && e.buttons === 1) {
      var def = COMP_DEFS[_dragEl.el.type];
      if (def && !def.isBranch && cell.rungIdx === _dragEl.rungIdx && cell.row === _dragEl.el.row) {
        var newCol = cell.col;
        /* Validate new position */
        if (def.isCoil && !def.isBlock) newCol = COLS - 1;
        if (def.isContact && !def.isBlock && newCol >= COLS - 1) newCol = COLS - 2;
        /* Branch elements are clamped to their branch span */
        var homeBranch = _branchOfElement(_dragEl.rungIdx, _dragEl.el);
        if (homeBranch) {
          newCol = Math.max(homeBranch.startCol, Math.min(homeBranch.endCol, newCol));
        }
        if (newCol !== _dragEl.el.col) {
          /* Check destination is empty (ignoring self) */
          var canMove = true;
          var w = def.cellsW || 1;
          for (var dc = 0; dc < w; dc++) {
            var existing = getElementAt(_dragEl.rungIdx, newCol + dc, cell.row);
            if (existing && existing !== _dragEl.el) { canMove = false; break; }
          }
          if (canMove && newCol >= 0 && newCol + w - 1 < COLS) {
            if (!_dragEl.moved) saveUndo();
            _dragEl.el.col = newCol;
            _dragEl.moved = true;
            draw();
          }
        }
      }
      return;
    }

    if (cell !== hoveredCell) {
      hoveredCell = cell;
      if (draggingType) draw();
    }
  });

  cvs.addEventListener('pointerup', function (e) {
    _releaseCanvasMomentary(e);   /* momentary canvas-node hold, both views */
    if (viewMode === 'fbd') { _fbdPointerUp(e); return; }
    if (panActive) {
      panActive = false;
      cvs.style.cursor = panMode ? 'grab' : '';
      return;
    }
    _dragEl = null;
    _scrollDrag = null;
  });

  /* FBD pointer — click-based wiring (ported from pneumatic).
       • Click OUTPUT port  → start wire draft (fbdWireDraft). Mouse now follows.
       • Click EMPTY canvas → add an orthogonal waypoint to the draft.
       • Click INPUT port   → complete the wire and commit.
       • Esc / click same   → cancel draft.
     Dragging blocks only starts when you click a block BODY (not a port). */
  function _fbdPointerDown(e) {
    e.preventDefault();

    /* Pan mode — middle-button or H-pan toggle */
    if (panMode || e.button === 1) {
      var sp = getCanvasPos(e);
      panActive = true;
      panStartX = sp.x; panStartY = sp.y;
      panOffX0 = viewOffX; panOffY0 = viewOffY;
      cvs.style.cursor = 'grabbing';
      return;
    }

    var pos = getCanvasWorldPos(e);
    fbdMouse = pos;

    /* Palette click-to-add */
    if (draggingType && BLOCK_DEFS[draggingType]) {
      fbdAddBlock(draggingType, pos.x - 40, pos.y - 20);
      draw();
      return;
    }

    var port = _fbdPointToPort(pos.x, pos.y);

    /* ── CASE A: Click OUTPUT port ── */
    if (port && port.side === 'out') {
      if (fbdWireDraft && fbdWireDraft.blockId === port.block.id && fbdWireDraft.port === port.port) {
        /* Same source clicked — cancel draft */
        fbdWireDraft = null; draw(); return;
      }
      /* Start (or restart) wire draft. Mouse will follow via pointermove. */
      fbdWireDraft = { blockId: port.block.id, port: port.port, waypoints: [] };
      fbdSelectedBlockId = null; fbdSelectedWireId = null;
      draw();
      return;
    }

    /* ── CASE B: Click INPUT port ── */
    if (port && port.side === 'in') {
      if (fbdWireDraft && port.block.id !== fbdWireDraft.blockId) {
        /* Complete the wire */
        fbdConnect(fbdWireDraft.blockId, fbdWireDraft.port,
                   port.block.id, port.port, fbdWireDraft.waypoints);
        fbdWireDraft = null;
        draw();
        return;
      }
      /* No draft — unwire this input port (quick disconnect) */
      for (var i = fbdWires.length - 1; i >= 0; i--) {
        var ww = fbdWires[i];
        if (ww.to.blockId === port.block.id && ww.to.port === port.port) {
          saveUndo(); fbdWires.splice(i, 1); draw(); return;
        }
      }
      return;
    }

    /* ── CASE C: Draft active + click empty → add waypoint ── */
    if (fbdWireDraft) {
      var srcBlk = _findBlock(fbdWireDraft.blockId);
      if (srcBlk) {
        var srcDef = BLOCK_DEFS[srcBlk.type];
        var idx = srcDef.outputs.indexOf(fbdWireDraft.port);
        if (idx >= 0) {
          var wx = _fbdSnap(pos.x), wy = _fbdSnap(pos.y);
          var prev = fbdWireDraft.waypoints.length > 0
            ? fbdWireDraft.waypoints[fbdWireDraft.waypoints.length - 1]
            : { x: srcBlk.x + srcDef.w + FBD_STUB,
                y: srcBlk.y + (srcDef.h * (idx + 1)) / (srcDef.outputs.length + 1) };
          if (Math.abs(wx - prev.x) > Math.abs(wy - prev.y)) wy = prev.y;
          else wx = prev.x;
          if (Math.abs(wx - prev.x) > 2 || Math.abs(wy - prev.y) > 2) {
            fbdWireDraft.waypoints.push({ x: wx, y: wy });
            draw();
          }
        }
      }
      return;
    }

    /* ── CASE D: Block hit → select + start drag-move ── */
    var blk = _fbdPointToBlock(pos.x, pos.y);
    if (blk) {
      /* Running: clicking an Input Var block operates its input directly
         (toggle / momentary, same semantics as the I/O panel buttons). */
      if (running && blk.type === 'input' && blk.address && blk.address.charAt(0) === 'I') {
        _canvasOperateInput(blk.address, e.pointerId);
        draw();
        return;
      }
      fbdSelectedBlockId = blk.id;
      fbdSelectedWireId = null;
      selectedElement = blk;
      fbdMove = { blockId: blk.id, offsetX: pos.x - blk.x, offsetY: pos.y - blk.y, undoSaved: false };
      updateProperties();
      draw();
      return;
    }

    /* ── CASE E: Wire hit → select; middle segment enters reshape mode ── */
    var wireHit = _fbdPointToWire(pos.x, pos.y);
    if (wireHit) {
      fbdSelectedWireId = wireHit.wire.id;
      fbdSelectedBlockId = null;
      selectedElement = null;
      hideProperties();
      var path = _fbdWirePath(wireHit.wire);
      if (path && wireHit.segIdx > 0 && wireHit.segIdx < path.length - 2) {
        fbdWireSegDrag = {
          wireId: wireHit.wire.id, segIdx: wireHit.segIdx, axis: wireHit.axis,
          startX: pos.x, startY: pos.y, origPath: path, undoSaved: false
        };
      }
      draw();
      return;
    }

    /* ── CASE F: Click empty canvas → deselect ── */
    fbdSelectedBlockId = null;
    fbdSelectedWireId = null;
    selectedElement = null;
    hideProperties();
    draw();
  }

  function _fbdPointerMove(e) {
    /* Pan drag */
    if (panActive && e.buttons >= 1) {
      var sp = getCanvasPos(e);
      viewOffX = panOffX0 + (sp.x - panStartX);
      viewOffY = panOffY0 + (sp.y - panStartY);
      draw();
      return;
    }

    var pos = getCanvasWorldPos(e);
    fbdMouse = pos;

    /* Port hover detection — runs on every move, even during wire draft so
       the candidate drop port can be highlighted with a halo. */
    var prevHovered = hoveredPort;
    var prevBlockId = hoveredBlockId;
    var portHit = _fbdPointToPort(pos.x, pos.y);
    hoveredPort = portHit;
    hoveredBlockId = null;
    if (portHit) {
      /* Store CSS-pixel position of the port centre for tooltip arrow */
      var _portPos = fbdPortPos(portHit.block, portHit.port, portHit.side);
      /* Convert world coords to screen coords accounting for zoom/pan + DPR */
      var _rect = cvs.getBoundingClientRect();
      var _sfX = _rect.width / W, _sfY = _rect.height / H;
      hoveredPortSX = (toSX ? toSX(_portPos.x) : _portPos.x) * _sfX;
      hoveredPortSY = (toSY ? toSY(_portPos.y) : _portPos.y) * _sfY;
    } else {
      var hoveredBlk = _fbdPointToBlock(pos.x, pos.y);
      hoveredBlockId = hoveredBlk ? hoveredBlk.id : null;
    }
    /* Cursor feedback — 'pointer' over a port or (while running) a
       toggleable Input Var block, 'move' over any other block body */
    if (annTool === 'move' && !panMode) {
      if (portHit) cvs.style.cursor = 'pointer';
      else if (hoveredBlockId != null) {
        var hovBlk = _findBlock(hoveredBlockId);
        cvs.style.cursor = (running && hovBlk && hovBlk.type === 'input' &&
                            hovBlk.address && hovBlk.address.charAt(0) === 'I')
          ? 'pointer' : 'move';
      }
      /* Else leave whatever annotation cursor logic set */
    }
    /* Redraw if the hover state changed */
    if (hoveredPort !== prevHovered || hoveredBlockId !== prevBlockId) draw();

    if (fbdMove && e.buttons === 1) {
      var blk = _findBlock(fbdMove.blockId);
      if (blk) {
        if (!fbdMove.undoSaved) { saveUndo(); fbdMove.undoSaved = true; }
        blk.x = Math.round((pos.x - fbdMove.offsetX) / 10) * 10;
        blk.y = Math.round((pos.y - fbdMove.offsetY) / 10) * 10;
        if (blk.x < 0) blk.x = 0;
        if (blk.y < 0) blk.y = 0;
        draw();
      }
      return;
    }

    /* Wire segment drag — user reshapes a wire by dragging a middle segment. */
    if (fbdWireSegDrag && e.buttons === 1) {
      var moveDx = Math.abs(pos.x - fbdWireSegDrag.startX);
      var moveDy = Math.abs(pos.y - fbdWireSegDrag.startY);
      if (moveDx > 3 || moveDy > 3) {
        if (!fbdWireSegDrag.undoSaved) { saveUndo(); fbdWireSegDrag.undoSaved = true; }
        var w = _findWireById(fbdWireSegDrag.wireId);
        if (w) {
          /* Extract middle waypoints from original auto-routed path, then
             offset the dragged segment. Path is: [fp, fpS, ...middle..., tpS, tp] */
          var origPath = fbdWireSegDrag.origPath;
          if (!w.waypoints || w.waypoints.length === 0) {
            /* Copy middle points (index 2..length-3 inclusive) into waypoints */
            var middle = [];
            for (var i = 2; i <= origPath.length - 3; i++) {
              middle.push({ x: origPath[i].x, y: origPath[i].y });
            }
            w.waypoints = middle;
          }
          /* Shift the segment: if vertical, move x of both endpoints of the seg;
             if horizontal, move y. We map segIdx to waypoints: segIdx 1=wp0->wp1 etc. */
          var segIdx = fbdWireSegDrag.segIdx;
          /* Path segIdx 0 = fp->fpS (stub, don't touch)
             Path segIdx 1 = fpS->wp0, etc. We nudge waypoints adjacent to segIdx. */
          if (w.waypoints.length >= 2) {
            var axis = fbdWireSegDrag.axis;
            var dragVal = axis === 'v' ? pos.x : pos.y;
            /* Segment N in path corresponds to waypoints [N-1] and [N] (for interior) */
            var i1 = segIdx - 1, i2 = segIdx;
            if (i1 >= 0 && i1 < w.waypoints.length) {
              if (axis === 'v') w.waypoints[i1].x = _fbdSnap(dragVal);
              else w.waypoints[i1].y = _fbdSnap(dragVal);
            }
            if (i2 >= 0 && i2 < w.waypoints.length) {
              if (axis === 'v') w.waypoints[i2].x = _fbdSnap(dragVal);
              else w.waypoints[i2].y = _fbdSnap(dragVal);
            }
          }
          draw();
        }
      }
      return;
    }

    if (fbdWireDraft) { draw(); return; }
  }

  function _findWireById(id) {
    for (var i = 0; i < fbdWires.length; i++) if (fbdWires[i].id === id) return fbdWires[i];
    return null;
  }

  /* FBD context menu — dynamic. Shows block / wire / canvas items based on
     what was right-clicked. Ported structure from pneumatic-circuit. */
  var _fbdCtxTarget = null;  /* { block, wire } — whichever is non-null */

  function _fbdShowContextMenu(clientX, clientY, target) {
    var menu = document.getElementById('ctx-fbd-menu');
    if (!menu) return;
    _fbdCtxTarget = target || { block: null, wire: null };

    /* Toggle item visibility based on target */
    var items = menu.querySelectorAll('.ctx-item');
    var hasBlock = !!_fbdCtxTarget.block;
    var hasWire  = !!_fbdCtxTarget.wire;
    var hasEmpty = !hasBlock && !hasWire;
    items.forEach(function (it) {
      var a = it.getAttribute('data-action') || '';
      var show = (a.indexOf('blk-') === 0 && hasBlock) ||
                 (a.indexOf('wire-') === 0 && hasWire) ||
                 (a.indexOf('canvas-') === 0 && hasEmpty);
      it.style.display = show ? '' : 'none';
    });

    /* Select the clicked thing for visual feedback */
    if (hasBlock) {
      fbdSelectedBlockId = _fbdCtxTarget.block.id;
      fbdSelectedWireId = null;
    } else if (hasWire) {
      fbdSelectedWireId = _fbdCtxTarget.wire.id;
      fbdSelectedBlockId = null;
    }
    draw();

    menu.style.display = '';
    /* Clamp to viewport */
    var mw = menu.offsetWidth || 180, mh = menu.offsetHeight || 120;
    var cx = Math.min(clientX, window.innerWidth - mw - 8);
    var cy = Math.min(clientY, window.innerHeight - mh - 8);
    menu.style.left = Math.max(4, cx) + 'px';
    menu.style.top  = Math.max(4, cy) + 'px';
  }

  function _fbdHideContextMenu() {
    var menu = document.getElementById('ctx-fbd-menu');
    if (menu) menu.style.display = 'none';
    _fbdCtxTarget = null;
  }

  /* Wire the FBD context menu actions */
  (function () {
    var menu = document.getElementById('ctx-fbd-menu');
    if (!menu) return;
    menu.addEventListener('click', function (e) {
      var item = e.target.closest('.ctx-item');
      if (!item) return;
      var a = item.getAttribute('data-action');
      var tgt = _fbdCtxTarget;
      _fbdHideContextMenu();
      if (!tgt) return;

      if (a === 'blk-props' && tgt.block) {
        fbdSelectedBlockId = tgt.block.id;
        selectedElement = tgt.block;
        updateProperties();
        openPropsModal(tgt.block, true);
      } else if (a === 'blk-delete' && tgt.block) {
        fbdDeleteBlock(tgt.block.id);
        hideProperties(); draw();
      } else if (a === 'blk-duplicate' && tgt.block) {
        saveUndo();
        var orig = tgt.block;
        var def = BLOCK_DEFS[orig.type] || { w: 80, h: 48 };
        var copy = JSON.parse(JSON.stringify(orig));
        copy.id = nextFbdBlockId++;
        copy.x += 30; copy.y += 30;
        copy._in = {}; copy._out = {}; copy._edgePrev = false;
        fbdBlocks.push(copy);
        fbdSelectedBlockId = copy.id;
        draw();
      } else if (a === 'wire-delete' && tgt.wire) {
        saveUndo();
        for (var i = fbdWires.length - 1; i >= 0; i--) {
          if (fbdWires[i].id === tgt.wire.id) fbdWires.splice(i, 1);
        }
        fbdSelectedWireId = null;
        draw();
      } else if (a === 'wire-duplicate' && tgt.wire) {
        saveUndo();
        var dup = JSON.parse(JSON.stringify(tgt.wire));
        dup.id = nextFbdWireId++;
        dup._powered = false;
        /* If the target input already has an incoming wire, refuse — single-input rule.
           Instead, just duplicate as a no-op copy (user will rewire manually) by shifting
           the waypoints downward 30px if any, then insert. If the destination input is
           busy we leave the duplicate orphaned at a new waypoint offset for visibility. */
        if (dup.waypoints && dup.waypoints.length) {
          for (var wi = 0; wi < dup.waypoints.length; wi++) dup.waypoints[wi].y += 30;
        }
        fbdWires.push(dup);
        draw();
      } else if (a === 'wire-reset' && tgt.wire) {
        saveUndo();
        var w = _findWireById(tgt.wire.id);
        if (w) { w.waypoints = []; draw(); }
      } else if (a === 'canvas-reset-view') {
        resetView();
      } else if (a === 'canvas-fit-all') {
        fitAllBlocks();
      } else if (a === 'canvas-clear') {
        if (confirm('Clear ALL FBD blocks and wires?')) {
          saveUndo();
          fbdBlocks = []; fbdWires = [];
          fbdSelectedBlockId = null; fbdSelectedWireId = null;
          hideProperties();
          resetSim();
          draw();
        }
      }
    });
    /* Close on outside click */
    document.addEventListener('pointerdown', function (e) {
      if (!menu.contains(e.target)) _fbdHideContextMenu();
    }, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') _fbdHideContextMenu();
    });
  })();

  /* ── Zoom / Pan (FBD view; shared helpers work for both) ── */
  function zoomCentre(factor) {
    var cx = W / 2, cy = H / 2;
    var newScale = viewScale * factor;
    if (newScale < 0.3 || newScale > 5) return;
    viewOffX = cx - (cx - viewOffX) * factor;
    viewOffY = cy - (cy - viewOffY) * factor;
    viewScale = newScale;
    draw();
  }

  function setPanMode(on) {
    panMode = !!on;
    var btn = document.getElementById('btn-pan-toggle');
    if (btn) btn.classList.toggle('active', panMode);
    /* Pan and marking are mutually exclusive. Drop any active marking tool
       inline — calling setAnnTool() here would recurse straight back into
       setPanMode(false) and cancel the pan we're turning on. */
    if (panMode && annTool !== 'move') {
      annTool = 'move';
      annActiveStroke = null; annActiveShape = null;
      var tb = document.querySelectorAll('#mark-bar .tool-btn[data-tool]');
      for (var i = 0; i < tb.length; i++) {
        tb[i].classList.toggle('active', tb[i].getAttribute('data-tool') === 'move');
      }
    }
    cvs.style.cursor = panMode ? 'grab' : '';
  }

  function resetView() {
    viewOffX = 0; viewOffY = 0; viewScale = 1;
    if (viewMode === 'ladder') scrollY = 0;
    draw();
  }

  function fitAllBlocks() {
    /* Ladder: fit the rung area (rails + all rungs) into view */
    if (viewMode === 'ladder') {
      if (rungs.length === 0) { resetView(); return; }
      var lPad = 20;
      var lw = (RAIL_X_R - RAIL_X_L) + lPad * 2;
      var lh = getTotalHeight() + lPad * 2;
      var ls = Math.min((W - lPad * 2) / lw, (H - lPad * 2) / lh, 2);
      if (ls < 0.3) ls = 0.3;
      viewScale = ls;
      viewOffX = (W - lw * ls) / 2 - (RAIL_X_L - lPad) * ls;
      viewOffY = lPad;
      scrollY = 0;   /* fit shows everything — internal scroll would fight it */
      draw();
      return;
    }
    if (fbdBlocks.length === 0) { resetView(); return; }
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < fbdBlocks.length; i++) {
      var b = fbdBlocks[i], def = BLOCK_DEFS[b.type];
      if (!def) continue;
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + def.w > maxX) maxX = b.x + def.w;
      if (b.y + def.h > maxY) maxY = b.y + def.h;
    }
    var pad = 40;
    var rw = maxX - minX, rh = maxY - minY;
    var sx = (W - pad * 2) / rw, sy = (H - pad * 2) / rh;
    var s = Math.min(sx, sy, 3);
    if (s < 0.3) s = 0.3;
    viewScale = s;
    viewOffX = (W - rw * s) / 2 - minX * s;
    viewOffY = (H - rh * s) / 2 - minY * s;
    draw();
  }

  /* Canvas wheel → zoom when Ctrl held (both views; plain wheel still
     scrolls the ladder via the handler below) */
  cvs.addEventListener('wheel', function (e) {
    if (!e.ctrlKey && !e.metaKey) return;  /* page scroll / ladder scroll otherwise */
    e.preventDefault();
    var rect = cvs.getBoundingClientRect();
    var mx = (e.clientX - rect.left) * (W / rect.width);
    var my = (e.clientY - rect.top) * (H / rect.height);
    var factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    var newScale = viewScale * factor;
    if (newScale < 0.3 || newScale > 5) return;
    viewOffX = mx - (mx - viewOffX) * factor;
    viewOffY = my - (my - viewOffY) * factor;
    viewScale = newScale;
    draw();
  }, { passive: false });

  function _fbdPointerUp(e) {
    if (panActive) {
      panActive = false;
      cvs.style.cursor = panMode ? 'grab' : '';
      return;
    }
    /* Note: we do NOT auto-complete wires on pointerup anymore. Click-based
       connect means the wire is completed by a fresh pointerdown on the target
       port — this matches the pneumatic UX. Mouse release just ends a drag. */
    fbdMove = null;
    fbdWireSegDrag = null;
  }

  /* Canvas scroll — only consume wheel when content overflows */
  cvs.addEventListener('wheel', function (e) {
    if (viewMode !== 'ladder') return;
    if (e.ctrlKey || e.metaKey) return;   /* Ctrl+wheel is zoom (handler above) */
    var maxScroll = getTotalHeight() - H + 40;
    if (maxScroll <= 0) return;  /* content fits — let page scroll */

    var prev = scrollY;
    scrollY = Math.max(0, Math.min(scrollY + e.deltaY * 0.5, maxScroll));

    /* At scroll limits, let the page scroll instead */
    if (scrollY === prev) return;

    e.preventDefault();
    draw();
  }, { passive: false });

  /* Context menu on canvas */
  cvs.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (mode !== 'simulate') return;

    /* FBD view: right-click shows a proper context menu — block / wire / canvas */
    if (viewMode === 'fbd') {
      var wp = getCanvasWorldPos(e);
      var blk = _fbdPointToBlock(wp.x, wp.y);
      var wireHit = blk ? null : _fbdPointToWire(wp.x, wp.y);
      _fbdShowContextMenu(e.clientX, e.clientY, { block: blk, wire: wireHit && wireHit.wire });
      return;
    }

    var pos = getLadderPos(e);
    var cell = getCellAt(pos.x, pos.y);
    if (!cell) return;

    var el = getElementAt(cell.rungIdx, cell.col, cell.row);
    ctxTarget = { cell: cell, element: el };
    selectedCell = cell;
    if (el) selectedElement = el;
    draw();

    /* Show context menu — A14 FIX: clamp to viewport */
    ctxMenu.style.display = '';
    var mw = ctxMenu.offsetWidth || 160;
    var mh = ctxMenu.offsetHeight || 180;
    var cx = Math.min(e.clientX, window.innerWidth - mw - 8);
    var cy = Math.min(e.clientY, window.innerHeight - mh - 8);
    ctxMenu.style.left = Math.max(4, cx) + 'px';
    ctxMenu.style.top = Math.max(4, cy) + 'px';

    /* Show/hide relevant items */
    var delItem = document.getElementById('ctx-delete');
    var editItem = document.getElementById('ctx-edit-addr');
    var propsItem = document.getElementById('ctx-props');
    var expPng = document.getElementById('ctx-export-png');
    var resetSim2 = document.getElementById('ctx-reset-sim');
    delItem.style.display = el ? '' : 'none';
    editItem.style.display = el ? '' : 'none';
    if (propsItem) propsItem.style.display = el ? '' : 'none';
    /* D4b: Show canvas-level options when no element clicked */
    if (expPng) expPng.style.display = '';
    if (resetSim2) resetSim2.style.display = '';
  });

  /* Hide context menu on click elsewhere */
  document.addEventListener('pointerdown', function (e) {
    if (ctxMenu && !ctxMenu.contains(e.target)) {
      ctxMenu.style.display = 'none';
    }
  });

  /* Context menu actions */
  document.getElementById('ctx-delete').addEventListener('click', function () {
    if (ctxTarget && ctxTarget.element && ctxTarget.cell) {
      saveUndo();
      removeElement(ctxTarget.cell.rungIdx, ctxTarget.cell.col, ctxTarget.cell.row);
      selectedElement = null;
      hideProperties();
      draw();
    }
    ctxMenu.style.display = 'none';
  });

  document.getElementById('ctx-props').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    if (ctxTarget && ctxTarget.element) {
      selectedElement = ctxTarget.element;
      updateProperties();
      openPropsModal(ctxTarget.element, false);
    }
  });

  document.getElementById('ctx-edit-addr').addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    if (ctxTarget && ctxTarget.element) {
      var newAddr = prompt('Enter new address:', ctxTarget.element.address);
      if (newAddr !== null && newAddr.trim() !== '') {
        saveUndo();
        /* Normalize like every other address entry point */
        var na = newAddr.trim().toUpperCase();
        ctxTarget.element.address = na;
        var pmsg = _addressProblem(na, ctxTarget.element.type);
        if (pmsg) showWarning('Address "' + na + '": ' + pmsg);
        updateProperties();
        draw();
      }
    }
  });

  document.getElementById('ctx-insert-above').addEventListener('click', function () {
    if (ctxTarget && ctxTarget.cell) {
      saveUndo();
      addRung(ctxTarget.cell.rungIdx - 1);
      draw();
    }
    ctxMenu.style.display = 'none';
  });

  document.getElementById('ctx-insert-below').addEventListener('click', function () {
    if (ctxTarget && ctxTarget.cell) {
      saveUndo();
      addRung(ctxTarget.cell.rungIdx);
      draw();
    }
    ctxMenu.style.display = 'none';
  });

  /* D4b + D16: Export PNG */
  var ctxExPng = document.getElementById('ctx-export-png');
  if (ctxExPng) ctxExPng.addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    exportPNG();
  });

  /* D16: Export CSV */
  var ctxExCsv = document.getElementById('ctx-export-csv');
  if (ctxExCsv) ctxExCsv.addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    exportCSV();
  });

  /* D4b: Reset Simulation from context menu */
  var ctxResetBtn = document.getElementById('ctx-reset-sim');
  if (ctxResetBtn) ctxResetBtn.addEventListener('click', function () {
    ctxMenu.style.display = 'none';
    resetSim();
    draw();
  });

  function exportPNG() {
    /* Draw to a temp canvas at 2x for quality */
    var tmpCvs = document.createElement('canvas');
    var tmpCtx = tmpCvs.getContext('2d');
    var totalH = Math.max(H, getTotalHeight() + 20);
    tmpCvs.width = W * 2;
    tmpCvs.height = totalH * 2;
    tmpCtx.setTransform(2, 0, 0, 2, 0, 0);
    /* Save/restore scroll to draw full diagram */
    var savedScroll = scrollY;
    scrollY = 0;
    var savedCtx = ctx;
    ctx = tmpCtx;
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, W, totalH);
    drawGrid(W);
    drawPowerRails(W);
    for (var r = 0; r < rungs.length; r++) drawRung(rungs[r], r, W);
    /* Watermark */
    ctx.font = '10px ' + _fontFamily;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    ctx.fillText('NHIT VisualLab', W - 10, totalH - 6);
    ctx = savedCtx;
    scrollY = savedScroll;
    /* Download */
    var link = document.createElement('a');
    link.download = 'plc-ladder-' + (activePreset || 'custom') + '.png';
    link.href = tmpCvs.toDataURL('image/png');
    link.click();
  }

  function exportCSV() {
    var rows = ['Address,Type,State,Value'];
    for (var k in inputs) rows.push(k + ',Input,' + inputs[k] + ',');
    for (var q in outputs) rows.push(q + ',Output,' + outputs[q] + ',');
    for (var m in memory) rows.push(m + ',Memory,' + memory[m] + ',');
    for (var t in timers) {
      var tm = timers[t];
      rows.push(t + ',Timer,' + tm.DN + ',' + Math.round(tm.ACC) + '/' + tm.PRE + 'ms');
    }
    for (var c in counters) {
      var ct = counters[c];
      rows.push(c + ',Counter,' + ct.DN + ',' + ct.CV + '/' + ct.PV);
    }
    for (var d in registers) rows.push(d + ',Register,,' + registers[d]);
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var link = document.createElement('a');
    link.download = 'plc-io-state.csv';
    link.href = URL.createObjectURL(blob);
    link.click();
  }

  /* I/O Panel — kind-aware input handlers.
     • toggle: click flips state.
     • mom-no: pointerdown → ON, pointerup → OFF.
     • mom-nc: pointerdown → OFF, pointerup → ON (fail-safe Stop semantics).
     Real-PLC input image: all value changes take effect at the start of the
     NEXT scan (never re-enter scanCycle mid-frame). The rAF loop picks up the
     new value on its next iteration; in STOP mode we draw() once. */
  var inputGrid = document.getElementById('input-grid');
  var _momHeld = {};   /* pointerId → addr, tracks active momentary presses */

  function _setInputValue(addr, v) {
    inputs[addr] = !!v;
    updateIOPanel();
    if (!running) draw();
  }

  /* ── Canvas node toggling ────────────────────────────────────────
     While the simulation is RUNNING, clicking a contact bound to a
     physical input (I-address) on the ladder canvas — or an Input Var
     block on the FBD canvas — operates that input directly, with the
     same toggle / momentary semantics as the I/O panel buttons. The
     hover cursor switches to 'pointer' over these nodes so users can
     see they are clickable. While stopped, clicks keep their editing
     behaviour (select / drag). */
  var _canvasMomHeld = {};   /* pointerId → input address (momentary hold) */

  function _contactInputAddr(el) {
    var def = COMP_DEFS[el.type];
    if (!def || !def.isContact || def.isBlock) return null;
    return (el.address && el.address.charAt(0) === 'I') ? el.address : null;
  }

  function _canvasOperateInput(addr, pointerId) {
    var kind = _inputKind(addr);
    if (kind === 'mom-no') {
      _canvasMomHeld[pointerId] = addr;
      _setInputValue(addr, true);
      try { cvs.setPointerCapture(pointerId); } catch (_) {}
    } else if (kind === 'mom-nc') {
      _canvasMomHeld[pointerId] = addr;
      _setInputValue(addr, false);
      try { cvs.setPointerCapture(pointerId); } catch (_) {}
    } else {
      _setInputValue(addr, !inputs[addr]);
    }
  }

  function _releaseCanvasMomentary(e) {
    var addr = _canvasMomHeld[e.pointerId];
    if (!addr) return;
    delete _canvasMomHeld[e.pointerId];
    var kind = _inputKind(addr);
    if (kind === 'mom-no') _setInputValue(addr, false);
    else if (kind === 'mom-nc') _setInputValue(addr, true);
  }
  cvs.addEventListener('pointercancel', _releaseCanvasMomentary);
  cvs.addEventListener('pointerleave',  _releaseCanvasMomentary);

  /* Hover cursor for ladder-canvas elements: 'pointer' over a toggleable
     input contact while running, 'move' over any other placed element.
     Called from the annotation pointermove's fall-through so annotation
     handles/selection keep cursor priority. */
  /* pos is SCREEN space (comes from the annotation pointermove); the ladder
     hit-test needs world space. */
  function _elementHoverCursor(pos) {
    if (mode !== 'simulate' || viewMode !== 'ladder' || draggingType) return '';
    var cell = getCellAt(toWX(pos.x), toWY(pos.y));
    if (!cell) return '';
    var el = getElementAt(cell.rungIdx, cell.col, cell.row);
    if (!el) return '';
    if (running && _contactInputAddr(el)) return 'pointer';
    return 'move';
  }

  if (inputGrid) {
    /* pointerdown — for momentary kinds, transition to active state. Toggle kind
       is handled on click (below) so clicks and keyboard activation both work. */
    inputGrid.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest('.io-toggle');
      if (!btn) return;
      var addr = btn.getAttribute('data-addr');
      if (!addr) return;
      var kind = _inputKind(addr);
      if (kind === 'mom-no') {
        _momHeld[e.pointerId] = addr;
        _setInputValue(addr, true);
        try { btn.setPointerCapture(e.pointerId); } catch(_){}
        e.preventDefault();
      } else if (kind === 'mom-nc') {
        _momHeld[e.pointerId] = addr;
        _setInputValue(addr, false);
        try { btn.setPointerCapture(e.pointerId); } catch(_){}
        e.preventDefault();
      }
      /* For 'toggle' kind, let the subsequent click event handle the flip. */
    });

    function _releaseMomentary(e) {
      var addr = _momHeld[e.pointerId];
      if (!addr) return;
      delete _momHeld[e.pointerId];
      var kind = _inputKind(addr);
      if (kind === 'mom-no') _setInputValue(addr, false);
      else if (kind === 'mom-nc') _setInputValue(addr, true);
    }
    inputGrid.addEventListener('pointerup',     _releaseMomentary);
    inputGrid.addEventListener('pointercancel', _releaseMomentary);
    inputGrid.addEventListener('pointerleave',  _releaseMomentary);

    /* Click — maintained toggle behaviour (only fires for 'toggle' kind because
       momentary kinds consume the interaction in pointerdown + capture). Also
       handles the visible "kind chip" next to each input: cycle TGL → NO → NC. */
    inputGrid.addEventListener('click', function (e) {
      var chip = e.target.closest('.io-kind-chip');
      if (chip) {
        /* Cycle kind and update the input's value to the new rest state */
        var caddr = chip.getAttribute('data-addr');
        if (!caddr) return;
        saveUndo();
        var cur = _inputKind(caddr);
        var next = cur === 'toggle' ? 'mom-no' : cur === 'mom-no' ? 'mom-nc' : 'toggle';
        if (next === 'toggle') delete inputKinds[caddr];
        else inputKinds[caddr] = next;
        /* Snap to natural rest state */
        if (next === 'mom-nc')      _setInputValue(caddr, true);
        else if (next === 'mom-no') _setInputValue(caddr, false);
        else /* toggle */           _setInputValue(caddr, false);
        updateIOPanel();
        return;
      }
      var btn = e.target.closest('.io-toggle');
      if (!btn) return;
      var addr = btn.getAttribute('data-addr');
      if (!addr) return;
      if (_inputKind(addr) !== 'toggle') return;
      inputs[addr] = !inputs[addr];
      updateIOPanel();
      if (!running) draw();
    });

    /* Right-click — show kind-picker menu (Toggle / Momentary NO / Momentary NC) */
    inputGrid.addEventListener('contextmenu', function (e) {
      var btn = e.target.closest('.io-toggle');
      if (!btn) return;
      e.preventDefault();
      var addr = btn.getAttribute('data-addr');
      if (!addr) return;
      _showInputKindMenu(addr, e.clientX, e.clientY);
    });
  }

  /* ── Input kind picker menu ─────────────────────────────── */
  function _showInputKindMenu(addr, clientX, clientY) {
    var menu = document.getElementById('input-kind-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'input-kind-menu';
      menu.style.cssText =
        'display:none;position:fixed;z-index:999;background:#151c2c;border:1px solid #2a3a5a;' +
        'border-radius:6px;padding:4px 0;min-width:200px;box-shadow:0 6px 20px rgba(0,0,0,.5);' +
        'font-size:0.82rem;';
      menu.innerHTML =
        '<div class="kind-head" style="padding:6px 14px 4px;color:#8899bb;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;">Input Type</div>' +
        '<div class="ctx-item" data-kind="toggle" style="padding:7px 14px;color:#c0d0e8;cursor:pointer;">&#x2B24; Switch (maintained)</div>' +
        '<div class="ctx-item" data-kind="mom-no" style="padding:7px 14px;color:#c0d0e8;cursor:pointer;">&#x25A0; Momentary NO</div>' +
        '<div class="ctx-item" data-kind="mom-nc" style="padding:7px 14px;color:#c0d0e8;cursor:pointer;">&#x25A1; Momentary NC</div>';
      document.body.appendChild(menu);
      menu.addEventListener('click', function (ev) {
        var item = ev.target.closest('.ctx-item');
        if (!item) return;
        var kind = item.getAttribute('data-kind');
        var target = menu.getAttribute('data-addr');
        if (target && kind) {
          saveUndo();
          if (kind === 'toggle') delete inputKinds[target];
          else inputKinds[target] = kind;
          /* Reset the input to the new kind's natural rest state */
          if (kind === 'mom-nc') _setInputValue(target, true);
          else if (kind === 'mom-no') _setInputValue(target, false);
          updateIOPanel();
        }
        menu.style.display = 'none';
      });
    }
    menu.setAttribute('data-addr', addr);
    /* Highlight current kind */
    var curKind = _inputKind(addr);
    menu.querySelectorAll('.ctx-item').forEach(function (it) {
      it.style.fontWeight = it.getAttribute('data-kind') === curKind ? '700' : '400';
      it.style.color = it.getAttribute('data-kind') === curKind ? '#f5c842' : '#c0d0e8';
    });
    menu.style.display = '';
    /* Clamp */
    var mw = menu.offsetWidth || 200, mh = menu.offsetHeight || 120;
    var cx = Math.min(clientX, window.innerWidth - mw - 8);
    var cy = Math.min(clientY, window.innerHeight - mh - 8);
    menu.style.left = Math.max(4, cx) + 'px';
    menu.style.top  = Math.max(4, cy) + 'px';
  }

  /* Close kind menu on outside click or Escape */
  document.addEventListener('pointerdown', function (e) {
    var m = document.getElementById('input-kind-menu');
    if (m && m.style.display !== 'none' && !m.contains(e.target)) m.style.display = 'none';
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var m = document.getElementById('input-kind-menu');
    if (m) m.style.display = 'none';
  });

  /* Palette — click to select instruction type */
  palette.addEventListener('click', function (e) {
    /* Category accordion */
    var catHeader = e.target.closest('.palette-cat');
    if (catHeader) {
      var catHeaders = palette.querySelectorAll('.palette-cat');
      var wasCollapsed = catHeader.classList.contains('collapsed');
      catHeaders.forEach(function (h) { h.classList.add('collapsed'); });
      if (wasCollapsed) catHeader.classList.remove('collapsed');
      return;
    }

    /* Item click */
    var item = e.target.closest('.palette-item');
    if (!item) return;
    var type = item.getAttribute('data-type');
    if (!type) return;

    if (draggingType === type) {
      /* Deselect */
      draggingType = null;
      palette.querySelectorAll('.palette-item').forEach(function (p) { p.classList.remove('selected'); });
    } else {
      draggingType = type;
      palette.querySelectorAll('.palette-item').forEach(function (p) {
        p.classList.toggle('selected', p === item);
      });
    }
  });

  /* Palette — drag and drop */
  palette.addEventListener('dragstart', function (e) {
    var item = e.target.closest('.palette-item');
    if (!item) return;
    var type = item.getAttribute('data-type');
    if (type) e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
  });

  cvs.addEventListener('dragover', function (e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';

    var pos = getLadderPos(e);
    var cell = getCellAt(pos.x, pos.y);
    if (cell !== hoveredCell) {
      hoveredCell = cell;
      draggingType = draggingType || e.dataTransfer.getData('text/plain');
      draw();
    }
  });

  cvs.addEventListener('drop', function (e) {
    e.preventDefault();
    var type = e.dataTransfer.getData('text/plain');
    if (!type) return;
    var pos = getLadderPos(e);

    if (viewMode === 'fbd' && BLOCK_DEFS[type]) {
      /* Centre block on cursor */
      var d = BLOCK_DEFS[type];
      var wp = getCanvasWorldPos(e);
      fbdAddBlock(type, wp.x - d.w / 2, wp.y - d.h / 2);
      draw();
      hoveredCell = null;
      draggingType = null;
      return;
    }

    var cell = getCellAt(pos.x, pos.y);
    if (cell) {
      saveUndo();
      addElement(cell.rungIdx, type, cell.col, cell.row, null);
      draw();
    }
    hoveredCell = null;
  });

  /* Collapse all palette categories except first */
  (function () {
    var catHeaders = palette.querySelectorAll('.palette-cat');
    catHeaders.forEach(function (h, i) {
      if (i > 0) h.classList.add('collapsed');
    });
  })();

  /* Draw palette icons */
  function drawPaletteIcons() {
    palette.querySelectorAll('.palette-item').forEach(function (item) {
      var type = item.getAttribute('data-type');
      var isFbd = item.getAttribute('data-view') === 'fbd';
      var def = isFbd ? BLOCK_DEFS[type] : COMP_DEFS[type];
      if (!def) return;
      var c = item.querySelector('canvas');
      if (!c) return;
      var pCtx = c.getContext('2d');
      var s = 36;
      /* Hi-DPI backing so palette symbols are crisp on Retina */
      var pDpr = window.devicePixelRatio || 1;
      if (c.width !== s * pDpr) {
        c.width = s * pDpr;
        c.height = s * pDpr;
        c.style.width = s + 'px';
        c.style.height = s + 'px';
      }
      pCtx.setTransform(pDpr, 0, 0, pDpr, 0, 0);
      pCtx.clearRect(0, 0, s, s);
      pCtx.fillStyle = '#0d1117';
      pCtx.fillRect(0, 0, s, s);

      var cx = s / 2, cy = s / 2;
      pCtx.strokeStyle = '#8899bb';
      pCtx.fillStyle = '#8899bb';
      pCtx.lineWidth = 1.5;

      /* FBD blocks — generic rounded-rect icon with label */
      if (isFbd) {
        var pad = 5;
        roundRect(pCtx, pad, 9, s - pad * 2, 18, 3);
        pCtx.stroke();
        pCtx.font = '700 8px ' + _monoFont;
        pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';
        var label = def.name || type.toUpperCase();
        if (label.length > 6) label = label.slice(0, 6);
        pCtx.fillText(label, cx, 18);
        /* Small port circles */
        if (def.inputs && def.inputs.length) { pCtx.beginPath(); pCtx.arc(pad - 1, 18, 2, 0, Math.PI * 2); pCtx.fill(); }
        if (def.outputs && def.outputs.length) { pCtx.beginPath(); pCtx.arc(s - pad + 1, 18, 2, 0, Math.PI * 2); pCtx.fill(); }
        return;
      }

      switch (type) {
        case 'contact-no':
          pCtx.beginPath(); pCtx.moveTo(4, cy); pCtx.lineTo(12, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, cy); pCtx.lineTo(32, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(12, 8); pCtx.lineTo(12, 28); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, 8); pCtx.lineTo(24, 28); pCtx.stroke();
          break;
        case 'contact-nc':
          pCtx.beginPath(); pCtx.moveTo(4, cy); pCtx.lineTo(12, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, cy); pCtx.lineTo(32, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(12, 8); pCtx.lineTo(12, 28); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, 8); pCtx.lineTo(24, 28); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(14, 26); pCtx.lineTo(22, 10); pCtx.stroke();
          break;
        case 'contact-pos':
          pCtx.beginPath(); pCtx.moveTo(4, cy); pCtx.lineTo(12, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, cy); pCtx.lineTo(32, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(12, 8); pCtx.lineTo(12, 28); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, 8); pCtx.lineTo(24, 28); pCtx.stroke();
          pCtx.font = '700 10px ' + _monoFont;
          pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';
          pCtx.fillText('P', cx, cy);
          break;
        case 'contact-neg':
          pCtx.beginPath(); pCtx.moveTo(4, cy); pCtx.lineTo(12, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, cy); pCtx.lineTo(32, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(12, 8); pCtx.lineTo(12, 28); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, 8); pCtx.lineTo(24, 28); pCtx.stroke();
          pCtx.font = '700 10px ' + _monoFont;
          pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';
          pCtx.fillText('N', cx, cy);
          break;
        case 'coil':
          pCtx.beginPath(); pCtx.moveTo(4, cy); pCtx.lineTo(12, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, cy); pCtx.lineTo(32, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.arc(cx - 2, cy, 10, Math.PI * 0.35, Math.PI * 1.65); pCtx.stroke();
          pCtx.beginPath(); pCtx.arc(cx + 2, cy, 10, -Math.PI * 0.65, Math.PI * 0.65); pCtx.stroke();
          break;
        case 'coil-set':
        case 'coil-reset':
        case 'coil-neg':
        case 'res':
          pCtx.beginPath(); pCtx.moveTo(4, cy); pCtx.lineTo(12, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(24, cy); pCtx.lineTo(32, cy); pCtx.stroke();
          pCtx.beginPath(); pCtx.arc(cx - 2, cy, 10, Math.PI * 0.35, Math.PI * 1.65); pCtx.stroke();
          pCtx.beginPath(); pCtx.arc(cx + 2, cy, 10, -Math.PI * 0.65, Math.PI * 0.65); pCtx.stroke();
          var ltr = type === 'coil-set' ? 'S' : type === 'coil-reset' ? 'R' :
                    type === 'res' ? 'R?' : '/';
          pCtx.font = '700 9px ' + _monoFont;
          pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';
          pCtx.fillText(ltr, cx, cy);
          break;
        case 'ton': case 'tof': case 'tp': case 'rto':
        case 'ctu': case 'ctd': case 'ctud':
        case 'equ': case 'neq': case 'grt': case 'les': case 'geq': case 'leq':
        case 'mov': case 'add': case 'sub': case 'mul': case 'div':
          /* Block icon — rectangle with label */
          pCtx.strokeRect(6, 8, 24, 20);
          pCtx.font = '700 8px ' + _monoFont;
          pCtx.textAlign = 'center'; pCtx.textBaseline = 'middle';
          pCtx.fillText(type.toUpperCase(), cx, cy);
          break;
        case 'branch-start':
          pCtx.beginPath(); pCtx.moveTo(cx, 6); pCtx.lineTo(cx, 30); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(cx, 6); pCtx.lineTo(30, 6); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(cx, 30); pCtx.lineTo(30, 30); pCtx.stroke();
          break;
        case 'branch-end':
          pCtx.beginPath(); pCtx.moveTo(cx, 6); pCtx.lineTo(cx, 30); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(6, 6); pCtx.lineTo(cx, 6); pCtx.stroke();
          pCtx.beginPath(); pCtx.moveTo(6, 30); pCtx.lineTo(cx, 30); pCtx.stroke();
          break;
      }
    });
  }

  /* Keyboard shortcuts */
  document.addEventListener('keydown', function (e) {
    /* Escape: cancel current interaction in priority order.
       1. Wire draft (FBD)   — clicked an output port, about to pick target
       2. Wire segment drag  — reshaping a committed wire
       3. Active annotation  — mid-sketch or mid-shape drag
       4. Pan mode           — exit grab cursor
       5. Context menu       — dismiss any open right-click menu
       6. Palette dragging   — deselect palette item
       7. Selection + props  — final fallback deselect */
    if (e.key === 'Escape') {
      /* Don't consume Escape when user is typing in a text field */
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      if (fbdWireDraft) { fbdWireDraft = null; draw(); return; }
      if (fbdWireSegDrag) { fbdWireSegDrag = null; draw(); return; }
      if (annActiveStroke) { annActiveStroke = null; draw(); return; }
      if (annActiveShape)  { annActiveShape  = null; draw(); return; }
      if (panMode) { setPanMode(false); draw(); return; }
      if (typeof _fbdHideContextMenu === 'function') _fbdHideContextMenu();
      if (draggingType) {
        draggingType = null;
        palette.querySelectorAll('.palette-item').forEach(function (p) { p.classList.remove('selected'); });
        draw();
        return;
      }
      if (annSelectedIdx >= 0) {
        annSelectedIdx = -1; annSelectedType = '';
        selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
        draw();
        return;
      }
      if (fbdSelectedBlockId != null || fbdSelectedWireId != null) {
        fbdSelectedBlockId = null; fbdSelectedWireId = null;
        selectedElement = null;
        hideProperties();
        draw();
        return;
      }
      selectedElement = null;
      selectedCell = null;
      hideProperties();
      if (ctxMenu) ctxMenu.style.display = 'none';
      draw();
      return;
    }

    if (mode !== 'simulate') return;

    /* Space: toggle run/stop */
    if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      running ? stopSim() : startSim();
      return;
    }

    /* Delete/Backspace: remove selected element */
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (viewMode === 'fbd' && fbdSelectedBlockId != null) {
        fbdDeleteBlock(fbdSelectedBlockId);
        selectedElement = null;
        hideProperties();
        draw();
        return;
      }
      if (viewMode === 'fbd' && fbdSelectedWireId != null) {
        saveUndo();
        for (var wi = fbdWires.length - 1; wi >= 0; wi--) {
          if (fbdWires[wi].id === fbdSelectedWireId) fbdWires.splice(wi, 1);
        }
        fbdSelectedWireId = null;
        draw();
        return;
      }
      if (selectedElement && selectedCell) {
        saveUndo();
        removeElement(selectedCell.rungIdx, selectedCell.col, selectedCell.row);
        selectedElement = null;
        selectedCell = null;
        hideProperties();
        draw();
      }
      return;
    }

    /* Ctrl+Shift+Z or Ctrl+Y: redo (D5) */
    if ((e.ctrlKey || e.metaKey) && (e.key === 'Z' || e.key === 'y')) {
      e.preventDefault();
      redo();
      return;
    }

    /* Ctrl+Z: undo */
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
      return;
    }

    /* Zoom/pan shortcuts (FBD view primarily) */
    if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); resetView(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '1') { e.preventDefault(); fitAllBlocks(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) { e.preventDefault(); zoomCentre(1.15); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); zoomCentre(1/1.15); return; }
    if (e.key === 'h' || e.key === 'H') {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      setPanMode(!panMode); return;
    }
    /* (Escape is fully handled in the first block at the top of this listener) */
  });

  /* View mode toggle (Ladder / FBD) */
  (function(){
    var vt = document.getElementById('view-tabs');
    if (!vt) return;
    vt.addEventListener('click', function (e) {
      var b = e.target.closest('button.pill');
      if (!b) return;
      var v = b.getAttribute('data-view');
      if (v) setViewMode(v);
    });
  })();

  /* Toolbar buttons */
  btnRun.addEventListener('click', startSim);
  btnStop.addEventListener('click', stopSim);   /* Pause — freeze for inspection */
  btnStep.addEventListener('click', stepSim);
  var btnPlcStop = document.getElementById('btn-plc-stop');
  if (btnPlcStop) btnPlcStop.addEventListener('click', plcStop);
  btnUndo.addEventListener('click', undo);

  /* Delete button — removes whatever is currently selected:
       • FBD: selected block (cascades its wires) OR selected wire
       • Ladder: selected element inside its rung cell
       • Annotation: selected stroke or shape (works in either view)
     Mirrors the Del / Backspace keyboard shortcut. */
  if (btnDelete) {
    btnDelete.addEventListener('click', function () {
      /* Annotation first — most recently selected */
      if (annSelectedIdx >= 0) {
        deleteSelectedAnnotation();
        return;
      }
      if (viewMode === 'fbd') {
        if (fbdSelectedBlockId != null) {
          fbdDeleteBlock(fbdSelectedBlockId);
          selectedElement = null;
          hideProperties();
          draw();
          return;
        }
        if (fbdSelectedWireId != null) {
          saveUndo();
          for (var wi = fbdWires.length - 1; wi >= 0; wi--) {
            if (fbdWires[wi].id === fbdSelectedWireId) fbdWires.splice(wi, 1);
          }
          fbdSelectedWireId = null;
          draw();
          return;
        }
        showWarning('Nothing selected. Click a block or wire first.');
        return;
      }
      /* Ladder */
      if (selectedElement && selectedCell) {
        saveUndo();
        removeElement(selectedCell.rungIdx, selectedCell.col, selectedCell.row);
        selectedElement = null;
        selectedCell = null;
        hideProperties();
        draw();
        return;
      }
      showWarning('Nothing selected. Click an instruction first.');
    });
  }

  btnClear.addEventListener('click', function () {
    saveUndo();
    if (viewMode === 'fbd') {
      fbdBlocks = [];
      fbdWires = [];
      fbdSelectedBlockId = null;
    } else {
      rungs = [];
    }
    activePreset = null;
    presetTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.remove('active'); });
    if (programDesc) programDesc.style.display = 'none';
    selectedElement = null;
    hideProperties();
    resetSim();
    draw();
  });

  btnAddRung.addEventListener('click', function () {
    saveUndo();
    rungs.push(createRung());
    draw();
  });

  /* ================================================================
     SECTION 9 — PRESET CIRCUITS
     ================================================================ */

  var PRESET_DESCS = {
    'motor-start-stop': 'Classic self-latching motor start/stop circuit with seal-in contact. Press Start (I0.0) to energise the motor; seal-in bit M0.0 keeps it running. The Stop button is a physically NC push button (bit = 1 when healthy) examined with a normally-open (XIC) instruction — so pressing Stop, or a broken wire, drops the bit and stops the motor (fail-safe).',
    'traffic-light': 'Sequential traffic light using TON timers. Enable with I0.0. Red (5s) \u2192 Green (4s) \u2192 Yellow (2s), then repeats. Each timer triggers the next phase.',
    'conveyor-counter': 'Conveyor belt with parts counter. Sensor I0.0 counts parts using CTU counter C0 (preset 10). When count reaches 10, conveyor stops and Full LED turns on. Reset with I0.1.',
    'star-delta': 'Star-Delta motor starter with automatic switchover. Press Start (I0.0); Stop (I0.1) is a physically NC button examined with an XIC instruction (fail-safe). Main contactor Q0.0 energises, Star Q0.1 engages first. After 5 seconds (TON T0), Star drops out and Delta Q0.2 engages. Overload I0.2 trips all.',
    'tank-level': 'Tank level control with pump. Low Level sensor (I0.0) starts the pump. Pump runs until High Level sensor (I0.1) detects full. Memory bit M0.0 provides seal-in latching.',
    'fbd-bottle-filling': 'FBD preset — Bottle Filling System. I0 (Bottle present) AND NOT I1 (Level full) opens the Fill Valve (Q0). The same condition starts a 5-second TON; its DN bit advances the Conveyor (Q1).',
    'alarm-latch': 'Latching alarm with 3 sensors. Any of sensors I0.0\u2013I0.2 sets the alarm latch (SR block, M0.0). Acknowledge button I0.3 resets it. Toggle to FBD view to see the OR\u2192SR block diagram.',
    'flash-beacon': 'Classic two-timer flasher. Enable I0.0: TON T0 times the 500\u202fms off-period, TON T1 times the 500\u202fms on-period, and T1 done restarts the cycle. Beacon Q0.0 flashes at 1\u202fHz. Toggle to FBD view for the block diagram.',
    'step-sequencer': '3-step conveyor sequencer using Set/Reset memory bits. Enable I0.0: Step\u00a01 runs 3\u202fs, then Step\u00a02 runs 2\u202fs, then Step\u00a03 runs 2\u202fs. Stop I0.1 clears all. Toggle to FBD view to see the SR\u2192TON chain.',
    'thermostat': 'Hysteresis thermostat. GRT (D0\u202f>\u202f30) sets hot flag M0.1 (heater off). LES (D0\u202f<\u202f20) sets cold flag M0.0 (heater on). Each flag resets the other for dead-band hysteresis. Toggle to FBD view.',
    'bottle-filler': 'Automated bottle-filling station. Bottle present (I0.0) AND NOT line full opens valve Q0.0 and starts TON T0 (4\u202fs). T0.DN increments CTU counter C0 (preset\u202f5). After 5 bottles, line stops. Reset with I0.1.'
  };

  /* Presets that carry both a ladder program AND an FBD graph so the user
     can toggle views freely after loading. */
  var DUAL_PRESETS = {
    'motor-start-stop': true, 'traffic-light': true, 'conveyor-counter': true,
    'star-delta': true, 'tank-level': true, 'fbd-bottle-filling': true,
    'alarm-latch': true, 'flash-beacon': true, 'step-sequencer': true,
    'thermostat': true,  'bottle-filler': true
  };

  function buildPreset(name) {
    saveUndo();
    resetSim();
    rungs = [];
    /* Dual presets: preserve current view, build both representations.
       FBD-only presets: force fbd view, wipe ladder.
       Classic presets: force ladder view, wipe fbd. */
    if (DUAL_PRESETS[name]) {
      /* keep viewMode; clear both and refill both below */
      fbdBlocks = [];
      fbdWires = [];
      nextFbdBlockId = 1;
      nextFbdWireId  = 1;
    } else {
      viewMode = (name && name.indexOf('fbd-') === 0) ? 'fbd' : 'ladder';
      if (viewMode === 'ladder') {
        fbdBlocks = [];
        fbdWires = [];
      }
    }
    activePreset = name;

    /* Each preset declares its own input kinds (e.g. a fail-safe NC Stop
       button). Clear leftovers from the previous program first. */
    for (var ikClear in inputKinds) delete inputKinds[ikClear];
    /* Same for register defaults (preset setpoints/constants) */
    for (var rdClear in registerDefaults) delete registerDefaults[rdClear];

    switch (name) {
      case 'motor-start-stop':
        /* Classic self-latching motor start/stop.
           FAIL-SAFE STOP: the Stop button is a PHYSICALLY NC push button
           (input bit = 1 when healthy, drops to 0 when pressed OR when the
           wire breaks). The program examines it with a normally-open (XIC)
           instruction, so any loss of the signal opens the rung and stops
           the motor — the standard industrial convention. */
        inputLabels = ['Start', 'Stop', '', '', '', '', '', ''];
        outputLabels = ['Motor', '', '', '', '', '', '', ''];
        inputKinds['I0.1'] = 'mom-nc';   /* physically NC stop button, rests at 1 */

        /* Rung 0: (Start OR Seal-in) AND Stop-healthy -> Motor */
        rungs.push(createRung());
        rungs[0].comment = 'Motor Start/Stop with seal-in (Stop: NC button, XIC instruction)';
        addElement(0, 'contact-no', 0, 0, 'I0.0');    /* Start button */
        addElement(0, 'contact-no', 2, 0, 'I0.1');    /* NC Stop button: bit=1 healthy → XIC conducts */
        addElement(0, 'coil', COLS - 1, 0, 'Q0.0');   /* Motor output */
        /* Branch: M0.0 seal-in parallel with Start */
        rungs[0].branches.push({
          startCol: 0, endCol: 1, subRow: 1,
          elements: [{ type: 'contact-no', col: 0, row: 1, address: 'M0.0', params: {}, state: false, _prevState: false }]
        });

        /* Rung 1: Motor running -> Set seal-in memory */
        rungs.push(createRung());
        rungs[1].comment = 'Seal-in memory bit';
        addElement(1, 'contact-no', 0, 0, 'Q0.0');
        addElement(1, 'coil-set', COLS - 1, 0, 'M0.0');

        /* Rung 2: Stop pressed (bit drops to 0) -> Reset seal-in */
        rungs.push(createRung());
        rungs[2].comment = 'Stop pressed (bit=0) resets seal-in';
        addElement(2, 'contact-nc', 0, 0, 'I0.1');
        addElement(2, 'coil-reset', COLS - 1, 0, 'M0.0');

        /* ── FBD ───────────────────────────────────────────────── */
        /* Start(I0.0)      ──► RS(M0.0).S ──► Q0.0 (Motor)
           NOT Stop(I0.1)   ──► RS(M0.0).R
           RS is RESET-dominant: while Stop is pressed (bit 0 → NOT → 1),
           Start cannot win — stop-priority, the safe choice for motors. */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var st  = mk2('input',    50, 100, 'I0.0');
          var sp  = mk2('input',    50, 260, 'I0.1');
          var inv = mk2('not',     170, 260);
          var rs  = mk2('rs',      320, 170, 'M0.0');
          var out = mk2('output',  510, 170, 'Q0.0');
          wi2(st,  'out', rs,  's');
          wi2(sp,  'out', inv, 'in');
          wi2(inv, 'out', rs,  'r');
          wi2(rs,  'q',   out, 'in');
        })();
        break;

      case 'traffic-light':
        inputLabels = ['Enable', '', '', '', '', '', '', ''];
        outputLabels = ['Red', 'Green', 'Yellow', '', '', '', '', ''];

        /* FIX #5: State-machine traffic light using Set/Reset memory bits.
           M0.0 = Red phase, M0.1 = Green phase, M0.2 = Yellow phase.
           Each phase runs a timer; when DN fires (1 scan), it transitions
           to the next phase. Set/Reset are retentive so the state holds. */

        /* Rung 0: Initialise — start Red if no phase active */
        rungs.push(createRung());
        rungs[0].comment = 'Init: start Red when enabled';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'contact-nc', 1, 0, 'M0.0');
        addElement(0, 'contact-nc', 2, 0, 'M0.1');
        addElement(0, 'contact-nc', 3, 0, 'M0.2');
        addElement(0, 'coil-set', COLS - 1, 0, 'M0.0');

        /* Rung 1: Red timer — M0.0 → TON T0 (5s) */
        rungs.push(createRung());
        rungs[1].comment = 'Red phase timer (5s)';
        addElement(1, 'contact-no', 0, 0, 'M0.0');
        addElement(1, 'ton', 3, 0, 'T0');
        rungs[1].elements[1].params.preset = 5000;

        /* Rung 2: T0.DN → transition to Green */
        rungs.push(createRung());
        rungs[2].comment = 'Red done → start Green';
        addElement(2, 'contact-no', 0, 0, 'T0.DN');
        addElement(2, 'coil-set', COLS - 1, 0, 'M0.1');

        /* Rung 3: T0.DN → end Red */
        rungs.push(createRung());
        rungs[3].comment = 'Red done → clear Red';
        addElement(3, 'contact-no', 0, 0, 'T0.DN');
        addElement(3, 'coil-reset', COLS - 1, 0, 'M0.0');

        /* Rung 4: Green timer — M0.1 → TON T1 (4s) */
        rungs.push(createRung());
        rungs[4].comment = 'Green phase timer (4s)';
        addElement(4, 'contact-no', 0, 0, 'M0.1');
        addElement(4, 'ton', 3, 0, 'T1');
        rungs[4].elements[1].params.preset = 4000;

        /* Rung 5: T1.DN → transition to Yellow */
        rungs.push(createRung());
        rungs[5].comment = 'Green done → start Yellow';
        addElement(5, 'contact-no', 0, 0, 'T1.DN');
        addElement(5, 'coil-set', COLS - 1, 0, 'M0.2');

        /* Rung 6: T1.DN → end Green */
        rungs.push(createRung());
        rungs[6].comment = 'Green done → clear Green';
        addElement(6, 'contact-no', 0, 0, 'T1.DN');
        addElement(6, 'coil-reset', COLS - 1, 0, 'M0.1');

        /* Rung 7: Yellow timer — M0.2 → TON T2 (2s) */
        rungs.push(createRung());
        rungs[7].comment = 'Yellow phase timer (2s)';
        addElement(7, 'contact-no', 0, 0, 'M0.2');
        addElement(7, 'ton', 3, 0, 'T2');
        rungs[7].elements[1].params.preset = 2000;

        /* Rung 8: T2.DN → cycle back to Red */
        rungs.push(createRung());
        rungs[8].comment = 'Yellow done → restart Red';
        addElement(8, 'contact-no', 0, 0, 'T2.DN');
        addElement(8, 'coil-set', COLS - 1, 0, 'M0.0');

        /* Rung 9: T2.DN → end Yellow */
        rungs.push(createRung());
        rungs[9].comment = 'Yellow done → clear Yellow';
        addElement(9, 'contact-no', 0, 0, 'T2.DN');
        addElement(9, 'coil-reset', COLS - 1, 0, 'M0.2');

        /* Rung 10: Outputs — M0.0 → Red */
        rungs.push(createRung());
        rungs[10].comment = 'Red light output';
        addElement(10, 'contact-no', 0, 0, 'M0.0');
        addElement(10, 'coil', COLS - 1, 0, 'Q0.0');

        /* Rung 11: M0.1 → Green */
        rungs.push(createRung());
        rungs[11].comment = 'Green light output';
        addElement(11, 'contact-no', 0, 0, 'M0.1');
        addElement(11, 'coil', COLS - 1, 0, 'Q0.1');

        /* Rung 12: M0.2 → Yellow */
        rungs.push(createRung());
        rungs[12].comment = 'Yellow light output';
        addElement(12, 'contact-no', 0, 0, 'M0.2');
        addElement(12, 'coil', COLS - 1, 0, 'Q0.2');

        /* ── FBD ───────────────────────────────────────────────── */
        /* Mirrors the ladder state machine. The Red latch is SET by
           "Enable AND no phase active" (init — same as ladder rung 0) OR by
           the Yellow timer finishing (cycle wrap). Holding Enable directly
           on SR_Red.S would out-fight every reset (SR is set-dominant) and
           end with ALL THREE lights latched ON. */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var en    = mk2('input',    40, 330, 'I0.0');
          var orP1  = mk2('or',      170, 420);           /* red OR green   */
          var orP2  = mk2('or',      300, 450);           /* … OR yellow    */
          var notP  = mk2('not',     430, 450);           /* no phase active */
          var andIn = mk2('and',     560, 380);           /* Enable AND idle */
          var orS   = mk2('or',      170, 260);           /* init OR cycle-wrap */
          var sr_r  = mk2('sr',      300, 100, 'M0.0');
          var t0    = mk2('fbd-ton', 460,  70, 'T0', { preset: 5000 });
          var sr_g  = mk2('sr',      630, 100, 'M0.1');
          var t1    = mk2('fbd-ton', 790,  70, 'T1', { preset: 4000 });
          var sr_y  = mk2('sr',      960, 100, 'M0.2');
          var t2    = mk2('fbd-ton',1120,  70, 'T2', { preset: 2000 });
          var o_r   = mk2('output',  460, 250, 'Q0.0');
          var o_g   = mk2('output',  630, 250, 'Q0.1');
          var o_y   = mk2('output',  800, 250, 'Q0.2');
          /* init detector: Enable AND NOT(any phase) */
          wi2(sr_r,  'q',   orP1,  'in1');
          wi2(sr_g,  'q',   orP1,  'in2');
          wi2(orP1,  'out', orP2,  'in1');
          wi2(sr_y,  'q',   orP2,  'in2');
          wi2(orP2,  'out', notP,  'in');
          wi2(en,    'out', andIn, 'in1');
          wi2(notP,  'out', andIn, 'in2');
          /* Red set = init OR yellow-timer done */
          wi2(andIn, 'out', orS,   'in1');
          wi2(t2,    'q',   orS,   'in2');
          wi2(orS,   'out', sr_r,  's');
          /* phase chain */
          wi2(sr_r, 'q',   t0,   'en');
          wi2(sr_r, 'q',   o_r,  'in');
          wi2(t0,   'q',   sr_g, 's');
          wi2(t0,   'q',   sr_r, 'r');
          wi2(sr_g, 'q',   t1,   'en');
          wi2(sr_g, 'q',   o_g,  'in');
          wi2(t1,   'q',   sr_y, 's');
          wi2(t1,   'q',   sr_g, 'r');
          wi2(sr_y, 'q',   t2,   'en');
          wi2(sr_y, 'q',   o_y,  'in');
          wi2(t2,   'q',   sr_y, 'r');
        })();
        break;

      case 'conveyor-counter':
        inputLabels = ['Sensor', 'Reset', '', '', '', '', '', ''];
        outputLabels = ['Conveyor', 'Full LED', '', '', '', '', '', ''];

        /* Rung 0: Sensor -> CTU C0 (preset 10) */
        rungs.push(createRung());
        rungs[0].comment = 'Count parts on conveyor';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'ctu', 3, 0, 'C0');
        rungs[0].elements[1].params.preset = 10;
        rungs[0].elements[1].params.reset = 'I0.1';

        /* Rung 1: C0.DN -> Full LED */
        rungs.push(createRung());
        rungs[1].comment = 'Full indicator when count reached';
        addElement(1, 'contact-no', 0, 0, 'C0.DN');
        addElement(1, 'coil', COLS - 1, 0, 'Q0.1');

        /* Rung 2: NOT C0.DN -> Conveyor runs */
        rungs.push(createRung());
        rungs[2].comment = 'Conveyor runs while not full';
        addElement(2, 'contact-nc', 0, 0, 'C0.DN');
        addElement(2, 'coil', COLS - 1, 0, 'Q0.0');

        /* ── FBD ───────────────────────────────────────────────── */
        /* Sensor(I0.0) ──► CTU(C0,10).cu
           Reset(I0.1)  ──► CTU.r
           CTU.q ──► NOT ──► Q0.0 (Conveyor — runs while not full)
           CTU.q ──────────► Q0.1 (Full LED)                      */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var sen  = mk2('input',    50, 100, 'I0.0');
          var rst  = mk2('input',    50, 250, 'I0.1');
          var ctu  = mk2('fbd-ctu', 220, 160, 'C0', { preset: 10 });
          var nnot = mk2('not',     420,  80);
          var outC = mk2('output',  570,  80, 'Q0.0');
          var outF = mk2('output',  420, 250, 'Q0.1');
          wi2(sen,  'out', ctu,  'cu');
          wi2(rst,  'out', ctu,  'r');
          wi2(ctu,  'q',   nnot, 'in');
          wi2(nnot, 'out', outC, 'in');
          wi2(ctu,  'q',   outF, 'in');
        })();
        break;

      case 'star-delta':
        inputLabels = ['Start', 'Stop', 'Overload', '', '', '', '', ''];
        outputLabels = ['Main', 'Star', 'Delta', '', '', '', '', ''];
        inputKinds['I0.1'] = 'mom-nc';   /* physically NC stop button, rests at 1 */

        /* FIX #6: Timer on its own rung (no coil after timer block).
           Star/Delta contactors use T0 status bits on separate rungs.
           Stop is a physically NC button examined with XIC (fail-safe);
           Overload models the trip FLAG (bit goes 1 on trip → XIO opens). */

        /* Rung 0: Start/Stop latch → Main contactor Q0.0 */
        rungs.push(createRung());
        rungs[0].comment = 'Main contactor (Stop: NC button, XIC instruction)';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'contact-no', 2, 0, 'I0.1');
        addElement(0, 'contact-nc', 3, 0, 'I0.2');
        addElement(0, 'coil', COLS - 1, 0, 'Q0.0');
        rungs[0].branches.push({
          startCol: 0, endCol: 1, subRow: 1,
          elements: [{ type: 'contact-no', col: 0, row: 1, address: 'Q0.0', params: {}, state: false, _prevState: false }]
        });

        /* Rung 1: Switchover timer — Q0.0 → TON T0 (5s) */
        rungs.push(createRung());
        rungs[1].comment = 'Star-Delta switchover timer (5s)';
        addElement(1, 'contact-no', 0, 0, 'Q0.0');
        addElement(1, 'ton', 3, 0, 'T0');
        rungs[1].elements[1].params.preset = 5000;

        /* Rung 2: Star contactor — Q0.0 AND NOT T0.DN → Q0.1 */
        rungs.push(createRung());
        rungs[2].comment = 'Star contactor (before timer done)';
        addElement(2, 'contact-no', 0, 0, 'Q0.0');
        addElement(2, 'contact-nc', 1, 0, 'T0.DN');
        addElement(2, 'contact-nc', 2, 0, 'Q0.2');
        addElement(2, 'coil', COLS - 1, 0, 'Q0.1');

        /* Rung 3: Delta contactor — Q0.0 AND T0.DN → Q0.2 */
        rungs.push(createRung());
        rungs[3].comment = 'Delta contactor (after timer done)';
        addElement(3, 'contact-no', 0, 0, 'Q0.0');
        addElement(3, 'contact-no', 1, 0, 'T0.DN');
        addElement(3, 'contact-nc', 2, 0, 'Q0.1');
        addElement(3, 'coil', COLS - 1, 0, 'Q0.2');

        /* ── FBD ───────────────────────────────────────────────── */
        /* Start(I0.0)                    ──► RS(M0.0).S ──► Q0.0(Main) ──► TON(T0,5s)
           OR(NOT Stop, Overload).out    ──► RS(M0.0).R   (reset-dominant: stop priority)
           Q0.0 AND NOT(T0.q)   ──► Q0.1 (Star  — runs before switchover)
           Q0.0 AND T0.q        ──► Q0.2 (Delta — runs after  switchover) */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var st   = mk2('input',    50,  80, 'I0.0');
          var sp   = mk2('input',    50, 200, 'I0.1');
          var ol   = mk2('input',    50, 300, 'I0.2');
          var inv  = mk2('not',     150, 200);
          var orG  = mk2('or',      260, 240);
          var rs   = mk2('rs',      400, 140, 'M0.0');
          var outM = mk2('output',  580,  80, 'Q0.0');
          var ton  = mk2('fbd-ton', 570, 200, 'T0', { preset: 5000 });
          var notT = mk2('not',     740, 130);
          var andS = mk2('and',     880, 100);
          var andD = mk2('and',     880, 250);
          var outS = mk2('output', 1030, 100, 'Q0.1');
          var outD = mk2('output', 1030, 250, 'Q0.2');
          wi2(st,   'out', rs,   's');
          wi2(sp,   'out', inv,  'in');
          wi2(inv,  'out', orG,  'in1');
          wi2(ol,   'out', orG,  'in2');
          wi2(orG,  'out', rs,   'r');
          wi2(rs,   'q',   outM, 'in');
          wi2(rs,   'q',   ton,  'en');
          wi2(rs,   'q',   andS, 'in2');
          wi2(rs,   'q',   andD, 'in2');
          wi2(ton,  'q',   notT, 'in');
          wi2(notT, 'out', andS, 'in1');
          wi2(ton,  'q',   andD, 'in1');
          wi2(andS, 'out', outS, 'in');
          wi2(andD, 'out', outD, 'in');
        })();
        break;

      case 'tank-level':
        inputLabels = ['Low Level', 'High Level', '', '', '', '', '', ''];
        outputLabels = ['Pump', 'Full LED', '', '', '', '', '', ''];

        /* Rung 0: (Low OR seal-in) AND NOT High → M0.0
           Branch spans col 0 only; I0.1 NC at col 2 is post-series */
        rungs.push(createRung());
        rungs[0].comment = 'Pump control with seal-in (runs until full)';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'contact-nc', 2, 0, 'I0.1');
        addElement(0, 'coil', COLS - 1, 0, 'M0.0');
        rungs[0].branches.push({
          startCol: 0, endCol: 0, subRow: 1,
          elements: [{ type: 'contact-no', col: 0, row: 1, address: 'M0.0', params: {}, state: false, _prevState: false }]
        });

        /* Rung 1: M0.0 -> Pump Q0.0 */
        rungs.push(createRung());
        rungs[1].comment = 'Pump output';
        addElement(1, 'contact-no', 0, 0, 'M0.0');
        addElement(1, 'coil', COLS - 1, 0, 'Q0.0');

        /* Rung 2: High Level -> Full LED */
        rungs.push(createRung());
        rungs[2].comment = 'Full indicator';
        addElement(2, 'contact-no', 0, 0, 'I0.1');
        addElement(2, 'coil', COLS - 1, 0, 'Q0.1');

        /* ── FBD ───────────────────────────────────────────────── */
        /* Low(I0.0)  ──► RS(M0.0).S ──► Q0.0 (Pump)
           High(I0.1) ──► RS(M0.0).R
           High(I0.1) ──► Q0.1 (Full LED)
           RS (reset-dominant): if Low and High are ever true together,
           High wins and the pump stops — same as the ladder's NC High
           contact breaking the seal-in rung. */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var low  = mk2('input',    50, 100, 'I0.0');
          var high = mk2('input',    50, 270, 'I0.1');
          var rs   = mk2('rs',      230, 170, 'M0.0');
          var pump = mk2('output',  420, 100, 'Q0.0');
          var full = mk2('output',  230, 340, 'Q0.1');
          wi2(low,  'out', rs,   's');
          wi2(high, 'out', rs,   'r');
          wi2(rs,   'q',   pump, 'in');
          wi2(high, 'out', full, 'in');
        })();
        break;

      /* ═══════════════════════════════════════════════════════════
         DUAL PRESETS — each populates both ladder rungs AND fbd graph
         so the user can toggle Ladder ↔ FBD freely.
         mk() and wi() are local helpers reused from fbd-bottle-filling.
         ═══════════════════════════════════════════════════════════ */

      case 'alarm-latch': {
        /* ── LADDER ────────────────────────────────────────────── */
        inputLabels  = ['Sensor1', 'Sensor2', 'Sensor3', 'Ack', '', '', '', ''];
        outputLabels = ['Alarm', '', '', '', '', '', '', ''];

        /* Rungs 0-2: each sensor sets the alarm latch */
        rungs.push(createRung());
        rungs[0].comment = 'Sensor 1 sets alarm latch';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'coil-set', COLS - 1, 0, 'M0.0');

        rungs.push(createRung());
        rungs[1].comment = 'Sensor 2 sets alarm latch';
        addElement(1, 'contact-no', 0, 0, 'I0.1');
        addElement(1, 'coil-set', COLS - 1, 0, 'M0.0');

        rungs.push(createRung());
        rungs[2].comment = 'Sensor 3 sets alarm latch';
        addElement(2, 'contact-no', 0, 0, 'I0.2');
        addElement(2, 'coil-set', COLS - 1, 0, 'M0.0');

        /* Rung 3: Acknowledge resets latch */
        rungs.push(createRung());
        rungs[3].comment = 'Acknowledge resets latch';
        addElement(3, 'contact-no', 0, 0, 'I0.3');
        addElement(3, 'coil-reset', COLS - 1, 0, 'M0.0');

        /* Rung 4: Alarm output */
        rungs.push(createRung());
        rungs[4].comment = 'Alarm output';
        addElement(4, 'contact-no', 0, 0, 'M0.0');
        addElement(4, 'coil', COLS - 1, 0, 'Q0.0');

        /* ── FBD ───────────────────────────────────────────────── */
        /* I0.0 ─┐
                  OR1 ─┐
           I0.1 ─┘      OR2.S ──► SR(M0.0) ──► Q0.0
           I0.2 ────────┘
           I0.3 ────────────────► SR(M0.0).R                      */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var s0  = mk2('input',  50,  60, 'I0.0');
          var s1  = mk2('input',  50, 150, 'I0.1');
          var s2  = mk2('input',  50, 240, 'I0.2');
          var ack = mk2('input',  50, 330, 'I0.3');
          var or1 = mk2('or',    210, 105);
          var or2 = mk2('or',    340, 172);
          var sr  = mk2('sr',    480, 200, 'M0.0');
          var out = mk2('output', 620, 160, 'Q0.0');
          wi2(s0, 'out', or1, 'in1');
          wi2(s1, 'out', or1, 'in2');
          wi2(or1,'out', or2, 'in1');
          wi2(s2, 'out', or2, 'in2');
          wi2(or2,'out', sr,  's');
          wi2(ack,'out', sr,  'r');
          wi2(sr, 'q',   out, 'in');
        })();
        break;
      }

      case 'flash-beacon': {
        /* ── LADDER ────────────────────────────────────────────── */
        /* Classic TWO-TIMER FLASHER (the standard industrial idiom):
           T0 times the OFF period, T1 times the ON period.
           T0 runs while T1 is not done; when T0 finishes, the beacon turns
           on and T1 starts; when T1 finishes it breaks T0's rung, both
           timers reset, and the cycle repeats. 500 ms off / 500 ms on. */
        inputLabels  = ['Enable', '', '', '', '', '', '', ''];
        outputLabels = ['Beacon', '', '', '', '', '', '', ''];

        /* Rung 0: Enable AND NOT T1.DN → TON T0 (off-period 500 ms) */
        rungs.push(createRung());
        rungs[0].comment = 'Off-period timer (500 ms)';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'contact-nc', 1, 0, 'T1.DN');
        addElement(0, 'ton', 3, 0, 'T0');
        rungs[0].elements[2].params.preset = 500;

        /* Rung 1: T0.DN → TON T1 (on-period 500 ms) */
        rungs.push(createRung());
        rungs[1].comment = 'On-period timer (500 ms)';
        addElement(1, 'contact-no', 0, 0, 'T0.DN');
        addElement(1, 'ton', 3, 0, 'T1');
        rungs[1].elements[1].params.preset = 500;

        /* Rung 2: Beacon is ON while T0 is done (i.e., during T1's period) */
        rungs.push(createRung());
        rungs[2].comment = 'Beacon on during the on-period';
        addElement(2, 'contact-no', 0, 0, 'T0.DN');
        addElement(2, 'coil', COLS - 1, 0, 'Q0.0');

        /* ── FBD ───────────────────────────────────────────────── */
        /* Same two-timer flasher as the ladder:
             AND(Enable, NOT T1.q) ──► TON T0 (500 ms, off period)
             T0.q ──► TON T1 (500 ms, on period)
             T0.q ──► Q0.0 (Beacon)                                */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var en   = mk2('input',    40, 120, 'I0.0');
          var nnot = mk2('not',     200, 220);
          var andG = mk2('and',     340, 160);
          var t0   = mk2('fbd-ton', 500, 160, 'T0', { preset: 500 });
          var t1   = mk2('fbd-ton', 680, 260, 'T1', { preset: 500 });
          var out  = mk2('output',  680, 100, 'Q0.0');
          wi2(en,   'out', andG, 'in1');
          wi2(nnot, 'out', andG, 'in2');
          wi2(andG, 'out', t0,   'en');
          wi2(t0,   'q',   t1,   'en');
          wi2(t0,   'q',   out,  'in');
          wi2(t1,   'q',   nnot, 'in');   /* feedback: T1.q → NOT → AND */
        })();
        break;
      }

      case 'step-sequencer': {
        /* ── LADDER ────────────────────────────────────────────── */
        inputLabels  = ['Enable', 'Stop', '', '', '', '', '', ''];
        outputLabels = ['Step1', 'Step2', 'Step3', '', '', '', '', ''];

        /* Init: Enable AND no step active → set Step1 */
        rungs.push(createRung());
        rungs[0].comment = 'Init: start Step 1 on enable';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'contact-nc', 1, 0, 'M0.0');
        addElement(0, 'contact-nc', 2, 0, 'M0.1');
        addElement(0, 'contact-nc', 3, 0, 'M0.2');
        addElement(0, 'coil-set', COLS - 1, 0, 'M0.0');

        /* Step 1 timer (3 s) */
        rungs.push(createRung());
        rungs[1].comment = 'Step 1 timer 3 s';
        addElement(1, 'contact-no', 0, 0, 'M0.0');
        addElement(1, 'ton', 3, 0, 'T0');
        rungs[1].elements[1].params.preset = 3000;

        /* T0.DN → set Step2, clear Step1 */
        rungs.push(createRung());
        rungs[2].comment = 'Step 1 done → start Step 2';
        addElement(2, 'contact-no', 0, 0, 'T0.DN');
        addElement(2, 'coil-set', COLS - 1, 0, 'M0.1');

        rungs.push(createRung());
        rungs[3].comment = 'Step 1 done → clear Step 1';
        addElement(3, 'contact-no', 0, 0, 'T0.DN');
        addElement(3, 'coil-reset', COLS - 1, 0, 'M0.0');

        /* Step 2 timer (2 s) */
        rungs.push(createRung());
        rungs[4].comment = 'Step 2 timer 2 s';
        addElement(4, 'contact-no', 0, 0, 'M0.1');
        addElement(4, 'ton', 3, 0, 'T1');
        rungs[4].elements[1].params.preset = 2000;

        /* T1.DN → set Step3, clear Step2 */
        rungs.push(createRung());
        rungs[5].comment = 'Step 2 done → start Step 3';
        addElement(5, 'contact-no', 0, 0, 'T1.DN');
        addElement(5, 'coil-set', COLS - 1, 0, 'M0.2');

        rungs.push(createRung());
        rungs[6].comment = 'Step 2 done → clear Step 2';
        addElement(6, 'contact-no', 0, 0, 'T1.DN');
        addElement(6, 'coil-reset', COLS - 1, 0, 'M0.1');

        /* Step 3 timer (2 s) */
        rungs.push(createRung());
        rungs[7].comment = 'Step 3 timer 2 s';
        addElement(7, 'contact-no', 0, 0, 'M0.2');
        addElement(7, 'ton', 3, 0, 'T2');
        rungs[7].elements[1].params.preset = 2000;

        /* T2.DN → clear Step3 (sequence ends, re-enable to restart) */
        rungs.push(createRung());
        rungs[8].comment = 'Step 3 done → clear Step 3';
        addElement(8, 'contact-no', 0, 0, 'T2.DN');
        addElement(8, 'coil-reset', COLS - 1, 0, 'M0.2');

        /* Stop button resets all */
        rungs.push(createRung());
        rungs[9].comment = 'Stop clears Step 1';
        addElement(9, 'contact-no', 0, 0, 'I0.1');
        addElement(9, 'coil-reset', COLS - 1, 0, 'M0.0');

        rungs.push(createRung());
        rungs[10].comment = 'Stop clears Step 2';
        addElement(10, 'contact-no', 0, 0, 'I0.1');
        addElement(10, 'coil-reset', COLS - 1, 0, 'M0.1');

        rungs.push(createRung());
        rungs[11].comment = 'Stop clears Step 3';
        addElement(11, 'contact-no', 0, 0, 'I0.1');
        addElement(11, 'coil-reset', COLS - 1, 0, 'M0.2');

        /* Outputs */
        rungs.push(createRung());
        rungs[12].comment = 'Step 1 output';
        addElement(12, 'contact-no', 0, 0, 'M0.0');
        addElement(12, 'coil', COLS - 1, 0, 'Q0.0');

        rungs.push(createRung());
        rungs[13].comment = 'Step 2 output';
        addElement(13, 'contact-no', 0, 0, 'M0.1');
        addElement(13, 'coil', COLS - 1, 0, 'Q0.1');

        rungs.push(createRung());
        rungs[14].comment = 'Step 3 output';
        addElement(14, 'contact-no', 0, 0, 'M0.2');
        addElement(14, 'coil', COLS - 1, 0, 'Q0.2');

        /* ── FBD ───────────────────────────────────────────────── */
        /* Mirrors the ladder state machine. Step 1 is SET by
           "Enable AND no step active" (init) — holding Enable directly on
           SR1.S would out-fight the resets (SR is set-dominant) and pile
           all three steps ON. Stop (I0.1) ORs into every latch reset,
           same as the ladder's three Stop rungs. */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var en   = mk2('input',    40, 330, 'I0.0');
          var sp   = mk2('input',    40, 470, 'I0.1');
          var orP1 = mk2('or',      170, 400);            /* s1 OR s2       */
          var orP2 = mk2('or',      300, 430);            /* … OR s3        */
          var notP = mk2('not',     430, 430);            /* no step active */
          var andI = mk2('and',     560, 360);            /* Enable AND idle */
          var notS = mk2('not',     560, 470);            /* NOT Stop        */
          var andG = mk2('and',     700, 390);            /* init AND NOT Stop */
          var orR1 = mk2('or',      170, 260);            /* t0.q OR Stop   */
          var orR2 = mk2('or',      490, 260);            /* t1.q OR Stop   */
          var orR3 = mk2('or',      810, 260);            /* t2.q OR Stop   */
          var sr1  = mk2('sr',      300, 130, 'M0.0');
          var t0   = mk2('fbd-ton', 450, 100, 'T0', { preset: 3000 });
          var sr2  = mk2('sr',      620, 130, 'M0.1');
          var t1   = mk2('fbd-ton', 770, 100, 'T1', { preset: 2000 });
          var sr3  = mk2('sr',      940, 130, 'M0.2');
          var t2   = mk2('fbd-ton',1090, 100, 'T2', { preset: 2000 });
          var o1   = mk2('output',  450, 470, 'Q0.0');
          var o2   = mk2('output',  620, 470, 'Q0.1');
          var o3   = mk2('output',  790, 470, 'Q0.2');
          /* init detector: Enable AND NOT(any step) */
          wi2(sr1,  'q',   orP1, 'in1');
          wi2(sr2,  'q',   orP1, 'in2');
          wi2(orP1, 'out', orP2, 'in1');
          wi2(sr3,  'q',   orP2, 'in2');
          wi2(orP2, 'out', notP, 'in');
          wi2(en,   'out', andI, 'in1');
          wi2(notP, 'out', andI, 'in2');
          wi2(sp,   'out', notS, 'in');
          wi2(andI, 'out', andG, 'in1');
          wi2(notS, 'out', andG, 'in2');
          wi2(andG, 'out', sr1,  's');
          /* step chain with Stop OR'd into every reset */
          wi2(sr1, 'q',   t0,   'en');
          wi2(sr1, 'q',   o1,   'in');
          wi2(t0,  'q',   sr2,  's');
          wi2(t0,  'q',   orR1, 'in1');
          wi2(sp,  'out', orR1, 'in2');
          wi2(orR1,'out', sr1,  'r');
          wi2(sr2, 'q',   t1,   'en');
          wi2(sr2, 'q',   o2,   'in');
          wi2(t1,  'q',   sr3,  's');
          wi2(t1,  'q',   orR2, 'in1');
          wi2(sp,  'out', orR2, 'in2');
          wi2(orR2,'out', sr2,  'r');
          wi2(sr3, 'q',   t2,   'en');
          wi2(sr3, 'q',   o3,   'in');
          wi2(t2,  'q',   orR3, 'in1');
          wi2(sp,  'out', orR3, 'in2');
          wi2(orR3,'out', sr3,  'r');
        })();
        break;
      }

      case 'thermostat': {
        /* ── LADDER ────────────────────────────────────────────── */
        inputLabels  = ['', '', '', '', '', '', '', ''];
        outputLabels = ['Heater', 'CoolLED', '', '', '', '', '', ''];
        /* Program constants — survive Reset (see registerDefaults).
           Edit D0 live in the Data panel to drive the hysteresis. */
        _setRegisterDefault('D0', 22);   /* current temperature (editable) */
        _setRegisterDefault('D1', 30);   /* upper setpoint */
        _setRegisterDefault('D2', 20);   /* lower setpoint */

        /* GRT D0>D1 → set hot flag M0.1 */
        rungs.push(createRung());
        rungs[0].comment = 'D0 > 30 → set hot flag (heater off)';
        addElement(0, 'grt', 0, 0, '');
        rungs[0].elements[0].params.srcA = 'D0';
        rungs[0].elements[0].params.srcB = 'D1';
        addElement(0, 'coil-set', COLS - 1, 0, 'M0.1');

        /* LES D0<D2 → set cold flag M0.0 */
        rungs.push(createRung());
        rungs[1].comment = 'D0 < 20 → set cold flag (heater on)';
        addElement(1, 'les', 0, 0, '');
        rungs[1].elements[0].params.srcA = 'D0';
        rungs[1].elements[0].params.srcB = 'D2';
        addElement(1, 'coil-set', COLS - 1, 0, 'M0.0');

        /* Hot flag resets cold flag (hysteresis cross-reset) */
        rungs.push(createRung());
        rungs[2].comment = 'Hot → clear cold flag';
        addElement(2, 'contact-no', 0, 0, 'M0.1');
        addElement(2, 'coil-reset', COLS - 1, 0, 'M0.0');

        /* Cold flag resets hot flag */
        rungs.push(createRung());
        rungs[3].comment = 'Cold → clear hot flag';
        addElement(3, 'contact-no', 0, 0, 'M0.0');
        addElement(3, 'coil-reset', COLS - 1, 0, 'M0.1');

        /* Outputs */
        rungs.push(createRung());
        rungs[4].comment = 'Heater on when cold flag set';
        addElement(4, 'contact-no', 0, 0, 'M0.0');
        addElement(4, 'coil', COLS - 1, 0, 'Q0.0');

        rungs.push(createRung());
        rungs[5].comment = 'Cool LED when hot flag set';
        addElement(5, 'contact-no', 0, 0, 'M0.1');
        addElement(5, 'coil', COLS - 1, 0, 'Q0.1');

        /* ── FBD ───────────────────────────────────────────────── */
        /* TRUE ladder parity using the compare blocks — no digital
           stand-ins. Same registers as the ladder view:
           GT(D0 > D1) ──► SR(M0.1, hot flag).S ──► SR(M0.0).R
                              SR(M0.1).Q  ──────────► Q0.1 (Cool LED)
           LT(D0 < D2) ──► SR(M0.0, cold flag).S
                              SR(M0.0).Q  ──────────► Q0.0 (Heater)
                              SR(M0.0).Q  ──────────► SR(M0.1).R
           Edit D0 (temperature) in the readouts to drive the hysteresis. */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var hot  = mk2('fbd-gt', 40,  80, '', { srcA: 'D0', srcB: 'D1' });  /* too hot  */
          var cold = mk2('fbd-lt', 40, 270, '', { srcA: 'D0', srcB: 'D2' });  /* too cold */
          var srH  = mk2('sr',    230,  80, 'M0.1');   /* hot flag: S-dominant */
          var srC  = mk2('sr',    230, 270, 'M0.0');   /* cold flag: S-dominant */
          var oH   = mk2('output', 430,  80, 'Q0.1');  /* Cool LED */
          var oC   = mk2('output', 430, 270, 'Q0.0');  /* Heater */
          wi2(hot,  'q',   srH, 's');
          wi2(cold, 'q',   srC, 's');
          wi2(srH,  'q',   srC, 'r');   /* hot resets cold */
          wi2(srC,  'q',   srH, 'r');   /* cold resets hot */
          wi2(srH,  'q',   oH,  'in');
          wi2(srC,  'q',   oC,  'in');
        })();
        break;
      }

      case 'bottle-filler': {
        /* ── LADDER ────────────────────────────────────────────── */
        inputLabels  = ['Bottle', 'Reset', '', '', '', '', '', ''];
        outputLabels = ['Valve', 'LineFull', '', '', '', '', '', ''];

        /* Bottle present AND NOT line full → open valve */
        rungs.push(createRung());
        rungs[0].comment = 'Bottle present → open fill valve';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'contact-nc', 1, 0, 'C0.DN');
        addElement(0, 'coil', COLS - 1, 0, 'Q0.0');

        /* Valve open → fill timer 4 s */
        rungs.push(createRung());
        rungs[1].comment = 'Fill timer 4 s';
        addElement(1, 'contact-no', 0, 0, 'Q0.0');
        addElement(1, 'ton', 3, 0, 'T0');
        rungs[1].elements[1].params.preset = 4000;

        /* T0.DN → count filled bottles (preset 5) */
        rungs.push(createRung());
        rungs[2].comment = 'Count filled bottles — preset 5';
        addElement(2, 'contact-no', 0, 0, 'T0.DN');
        addElement(2, 'ctu', 3, 0, 'C0');
        rungs[2].elements[1].params.preset = 5;
        rungs[2].elements[1].params.reset  = 'I0.1';

        /* C0.DN → line full indicator */
        rungs.push(createRung());
        rungs[3].comment = 'Line full indicator';
        addElement(3, 'contact-no', 0, 0, 'C0.DN');
        addElement(3, 'coil', COLS - 1, 0, 'Q0.1');

        /* ── FBD ───────────────────────────────────────────────── */
        /*  Bottle(I0.0) ─┐
                           AND ──┬── Valve(Q0.0)
            NOT(C0.DN) ───┘       └── TON(T0,4s).Q ── CTU(C0,5).CU
            Reset(I0.1) ────────────────────────────── CTU.R
            CTU.Q ──► LineFull(Q0.1)                              */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var bot  = mk2('input',   50,  80, 'I0.0');
          var cDN  = mk2('input',   50, 190, 'C0.DN');
          var rst  = mk2('input',   50, 310, 'I0.1');
          var nnot = mk2('not',    190, 190);
          var gand = mk2('and',    320, 120);
          var outV = mk2('output', 470,  80, 'Q0.0');
          var ton  = mk2('fbd-ton', 460, 190, 'T0', { preset: 4000 });
          var ctu  = mk2('fbd-ctu', 630, 230, 'C0', { preset: 5 });
          var outF = mk2('output', 790, 230, 'Q0.1');
          wi2(bot,  'out', gand, 'in1');
          wi2(cDN,  'out', nnot, 'in');
          wi2(nnot, 'out', gand, 'in2');
          wi2(gand, 'out', outV, 'in');
          wi2(gand, 'out', ton,  'en');
          wi2(ton,  'q',   ctu,  'cu');
          wi2(rst,  'out', ctu,  'r');
          wi2(ctu,  'q',   outF, 'in');
        })();
        break;
      }

      case 'fbd-bottle-filling': {
        /* Dual preset — Ladder + FBD.
           Bottle Filling System:
             (Bottle present AND NOT Level full) → Fill valve open
             Valve open → TON(T0, 5s) → Conveyor advance             */
        inputLabels  = ['Bottle', 'Level',  '', '', '', '', '', ''];
        outputLabels = ['Valve',  'Conveyor','', '', '', '', '', ''];

        /* ── LADDER ────────────────────────────────────────────── */
        /* Rung 0: Bottle present AND level NOT full → open valve */
        rungs.push(createRung());
        rungs[0].comment = 'Bottle present → open fill valve';
        addElement(0, 'contact-no', 0, 0, 'I0.0');
        addElement(0, 'contact-nc', 1, 0, 'I0.1');
        addElement(0, 'coil', COLS - 1, 0, 'Q0.0');

        /* Rung 1: Valve open → fill timer 5 s */
        rungs.push(createRung());
        rungs[1].comment = 'Fill timer 5 s';
        addElement(1, 'contact-no', 0, 0, 'Q0.0');
        addElement(1, 'ton', 3, 0, 'T0');
        rungs[1].elements[1].params.preset = 5000;

        /* Rung 2: Timer done → advance conveyor */
        rungs.push(createRung());
        rungs[2].comment = 'Timer done → conveyor advance';
        addElement(2, 'contact-no', 0, 0, 'T0.DN');
        addElement(2, 'coil', COLS - 1, 0, 'Q0.1');

        /* ── FBD ───────────────────────────────────────────────── */
        /* I0.0 (Bottle) ─┐
                           AND ──┬── Q0.0 (Valve)
           NOT(I0.1) ─────┘       └── TON(T0,5s).q ── Q0.1 (Conveyor) */
        (function () {
          var mk2 = function (type, x, y, addr, params) {
            var d = BLOCK_DEFS[type];
            var b = { id: nextFbdBlockId++, type: type, x: x, y: y,
                      address: addr !== undefined ? addr : (d.params && d.params.address ? d.params.address.def : ''),
                      params: {}, _in: {}, _out: {} };
            for (var pk in d.params) if (pk !== 'address') b.params[pk] = (params && params[pk] !== undefined) ? params[pk] : d.params[pk].def;
            fbdBlocks.push(b); return b;
          };
          var wi2 = function (f, fp, t, tp) {
            fbdWires.push({ id: nextFbdWireId++, from: { blockId: f.id, port: fp }, to: { blockId: t.id, port: tp }, _powered: false });
          };
          var in0   = mk2('input',    60,  80, 'I0.0');
          var in1   = mk2('input',    60, 220, 'I0.1');
          var nnot  = mk2('not',     220, 220);
          var gand  = mk2('and',     380, 120);
          var outQ0 = mk2('output',  560,  80, 'Q0.0');
          var tton  = mk2('fbd-ton', 540, 200, 'T0', { preset: 5000 });
          var outQ1 = mk2('output',  720, 220, 'Q0.1');
          wi2(in0,  'out', gand,  'in1');
          wi2(in1,  'out', nnot,  'in');
          wi2(nnot, 'out', gand,  'in2');
          wi2(gand, 'out', outQ0, 'in');
          wi2(gand, 'out', tton,  'en');
          wi2(tton, 'q',   outQ1, 'in');
        })();
        break;
      }
    }

    /* Show description */
    if (programDesc) {
      var desc = PRESET_DESCS[name];
      if (desc) {
        programDesc.textContent = desc;
        programDesc.style.display = '';
      } else {
        programDesc.style.display = 'none';
      }
    }

    /* Re-apply input rest states now the preset's inputKinds are in place
       (resetSim ran before the kinds were set; NC momentaries rest TRUE). */
    for (var ikRest in inputs) inputs[ikRest] = (_inputKind(ikRest) === 'mom-nc');

    updateIOPanel();
    /* Sync view tabs + palette visibility + toolbar state to the new view */
    updateViewTabs();
    updatePaletteVisibility();
    updateToolbarState();
    draw();
  }

  /* Preset tab handler */
  presetTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    var name = pill.getAttribute('data-preset');
    if (!name) return;
    presetTabs.querySelectorAll('.pill').forEach(function (p) {
      p.classList.toggle('active', p === pill);
    });
    buildPreset(name);
  });

  /* ================================================================
     SECTION 10 — PROPERTIES PANEL
     ================================================================ */

  function updateProperties() {
    if (!selectedElement || !propsPanel || !propsBody) return;
    var el = selectedElement;
    /* Dispatch: ladder element uses COMP_DEFS; FBD block uses BLOCK_DEFS */
    var isFbd = (viewMode === 'fbd') && BLOCK_DEFS[el.type];
    var def = isFbd ? BLOCK_DEFS[el.type] : COMP_DEFS[el.type];
    if (!def) { hideProperties(); return; }

    propsPanel.style.display = '';
    var html = '<div style="margin-bottom:8px;font-weight:700;color:#dde3f0;font-size:0.9rem;">' + def.name + '</div>';

    /* Address field */
    if (def.params.address) {
      html += '<div class="props-row">';
      html += '<label class="props-label">' + def.params.address.label + '</label>';
      html += '<input class="props-input" id="prop-address" value="' + (el.address || '') + '" />';
      html += '</div>';
    }

    /* Other params */
    for (var pk in def.params) {
      if (pk === 'address') continue;
      var param = def.params[pk];
      var val = el.params[pk] !== undefined ? el.params[pk] : param.def;
      html += '<div class="props-row">';
      html += '<label class="props-label">' + param.label + '</label>';
      html += '<input class="props-input" id="prop-' + pk + '" type="' + (param.type || 'text') + '" value="' + val + '" />';
      html += '</div>';
    }

    /* State display */
    if (running || scanCount > 0) {
      html += '<div style="margin-top:8px;padding:6px 8px;background:rgba(124,179,66,0.08);border-radius:4px;font-size:0.78rem;">';
      html += '<strong>State:</strong> ' + (el.state ? '<span style="color:#7cb342">TRUE</span>' : '<span style="color:#ff5555">FALSE</span>');
      html += '</div>';
    }

    propsBody.innerHTML = html;

    /* Bind change events */
    var addrInput = document.getElementById('prop-address');
    if (addrInput) {
      addrInput.addEventListener('change', function () {
        saveUndo();
        /* Normalize case (q0.0 → Q0.0) — the engine keys on uppercase */
        var norm = addrInput.value.trim().toUpperCase();
        el.address = norm;
        addrInput.value = norm;
        var msg = _addressProblem(norm, el.type);
        if (msg) showWarning('Address "' + norm + '": ' + msg);
        draw();
      });
    }

    for (var pk2 in def.params) {
      if (pk2 === 'address') continue;
      (function (key) {
        var inp = document.getElementById('prop-' + key);
        if (inp) {
          inp.addEventListener('change', function () {
            saveUndo();
            if (def.params[key].type === 'number') {
              /* E12: validate — presets must be >= 1 */
              var numVal = parseFloat(inp.value);
              if (isNaN(numVal) || numVal < 1) numVal = def.params[key].def;
              el.params[key] = numVal;
            } else {
              /* Text params are addresses or numeric literals — normalize
                 case so d0 → D0 (the engine keys on uppercase). */
              el.params[key] = inp.value.trim().toUpperCase();
              inp.value = el.params[key];
            }
            /* Update timer/counter objects if they exist (ladder + FBD) */
            var tTypes = ['ton','tof','tp','rto','fbd-ton','fbd-tof','fbd-tp'];
            var cTypes = ['ctu','ctd','ctud','fbd-ctu','fbd-ctd'];
            if (tTypes.indexOf(el.type) >= 0 && key === 'preset') {
              var t = timers[el.address];
              if (t) t.PRE = _sanePreset(el.params.preset, 3000);
            }
            if (cTypes.indexOf(el.type) >= 0 && key === 'preset') {
              var c = counters[el.address];
              if (c) c.PV = _sanePreset(el.params.preset, 10);
            }
            draw();
          });
        }
      })(pk2);
    }
  }

  function hideProperties() {
    if (propsPanel) propsPanel.style.display = 'none';
  }

  /* ================================================================
     PROPERTIES MODAL
     Double-click any ladder instruction or FBD block (or right-click →
     Edit Properties) to edit every attribute it exposes — address,
     timer/counter presets, compare & math operands — plus swap the
     instruction for another of the same family in place.
     ================================================================ */

  var propModal     = document.getElementById('prop-modal');
  var propModalBody = document.getElementById('prop-modal-body');
  var propModalTitle= document.getElementById('prop-modal-title');
  var propModalSub  = document.getElementById('prop-modal-sub');
  var _pmEl = null;      /* element / block being edited */
  var _pmIsFbd = false;

  /* Short "what it does" line per instruction family — the param labels
     alone don't explain e.g. why RTO differs from TON. */
  var PROP_HINTS = {
    'contact-no': 'Passes power while the bit is TRUE (Allen-Bradley XIC).',
    'contact-nc': 'Passes power while the bit is FALSE (Allen-Bradley XIO).',
    'contact-pos': 'Conducts for ONE scan on a FALSE→TRUE transition.',
    'contact-neg': 'Conducts for ONE scan on a TRUE→FALSE transition.',
    'coil': 'Writes rung power to the bit every scan (OTE).',
    'coil-set': 'Latches the bit ON and leaves it (OTL). Needs a Reset coil.',
    'coil-reset': 'Unlatches the bit (OTU).',
    'coil-neg': 'Writes the INVERSE of rung power to the bit.',
    'res': 'Clears the named timer/counter (CTD reloads to preset).',
    'ton': 'On-delay: times while enabled; DN after preset. Resets when input drops.',
    'tof': 'Off-delay: DN immediately, holds DN for preset after input drops.',
    'tp': 'Pulse: fixed-width DN on a rising edge; non-retriggerable (IEC).',
    'rto': 'Retentive: accumulates only while enabled, KEEPS value when it drops. Only RES clears it.',
    'ctu': 'Counts up once per FALSE→TRUE of rung power. DN when CV ≥ preset.',
    'ctd': 'Counts down once per rising edge. DN when CV ≤ 0. RES reloads to preset.',
    'ctud': 'Counts up on rung power, down on the Down Input. DN when CV ≥ preset.',
    'equ': 'Conducts while Source A = Source B.',
    'neq': 'Conducts while Source A ≠ Source B.',
    'grt': 'Conducts while Source A > Source B.',
    'les': 'Conducts while Source A < Source B.',
    'geq': 'Conducts while Source A ≥ Source B.',
    'leq': 'Conducts while Source A ≤ Source B.',
    'mov': 'Copies Source into Destination every scan while powered.',
    'add': 'Destination = A + B, every scan while powered.',
    'sub': 'Destination = A − B, every scan while powered.',
    'mul': 'Destination = A × B, every scan while powered.',
    'div': 'Destination = A ÷ B. Divide-by-zero holds the destination and faults.'
  };

  /* Operands accept a register, a literal number, or a timer/counter value */
  var PROP_PARAM_HINTS = {
    srcA: 'D register, literal number, T0 (=ACC) or C0 (=CV)',
    srcB: 'D register, literal number, T0 (=ACC) or C0 (=CV)',
    src:  'D register, literal number, T0 (=ACC) or C0 (=CV)',
    dest: 'Destination D register (D0–D7)',
    reset: 'Optional bit that clears the counter (e.g. I0.1)',
    downSrc: 'Bit that counts DOWN on its rising edge (e.g. I0.1)',
    preset: ''
  };

  /* Types the element can be swapped to: same family, same footprint. */
  function _propSwapTypes(el, isFbd) {
    var defs = isFbd ? BLOCK_DEFS : COMP_DEFS;
    var def = defs[el.type];
    if (!def || !def.cat) return [];
    var list = [];
    for (var k in defs) {
      var d = defs[k];
      if (!d || d.cat !== def.cat) continue;
      if (isFbd) { if (d.w !== def.w || d.inputs.length !== def.inputs.length) continue; }
      else if ((d.cellsW || 1) !== (def.cellsW || 1)) continue;
      list.push(k);
    }
    return list.length > 1 ? list : [];
  }

  function _propShortName(type, isFbd) {
    var d = (isFbd ? BLOCK_DEFS : COMP_DEFS)[type];
    if (!d) return type.toUpperCase();
    /* "TON (On-Delay)" → "TON";  "NO Contact" → "NO" */
    var n = d.name;
    var m = /^([A-Z0-9_]+)\b/.exec(n);
    return m ? m[1] : n.split(' ')[0];
  }

  function openPropsModal(el, isFbd) {
    if (!el || !propModal) return;
    var defs = isFbd ? BLOCK_DEFS : COMP_DEFS;
    if (!defs[el.type]) return;
    _pmEl = el; _pmIsFbd = !!isFbd;
    propModal.style.display = '';
    _renderPropsModal();
    /* Focus the first field for keyboard users */
    var first = propModalBody.querySelector('input');
    if (first) { try { first.focus(); first.select(); } catch (_) {} }
  }

  function closePropsModal() {
    if (!propModal) return;
    propModal.style.display = 'none';
    _pmEl = null;
    draw();
  }

  function _renderPropsModal() {
    var el = _pmEl;
    if (!el) return;
    var defs = _pmIsFbd ? BLOCK_DEFS : COMP_DEFS;
    var def = defs[el.type];
    if (!def) { closePropsModal(); return; }

    propModalTitle.textContent = def.name;
    propModalSub.textContent = (_pmIsFbd ? 'FBD block' : 'Ladder instruction') +
                               (el.address ? ' · ' + el.address : '');

    var html = '';

    /* Type switcher */
    var swaps = _propSwapTypes(el, _pmIsFbd);
    if (swaps.length) {
      html += '<div class="prop-types" role="group" aria-label="Instruction type">';
      for (var i = 0; i < swaps.length; i++) {
        html += '<button type="button" class="prop-type-btn' + (swaps[i] === el.type ? ' active' : '') +
                '" data-swap="' + swaps[i] + '" title="' + (defs[swaps[i]].name) + '">' +
                _propShortName(swaps[i], _pmIsFbd) + '</button>';
      }
      html += '</div>';
    }

    if (PROP_HINTS[el.type]) {
      html += '<div class="prop-hint" style="margin-bottom:12px;">' + PROP_HINTS[el.type] + '</div>';
    }

    /* Address */
    if (def.params.address) {
      html += '<div class="prop-field">' +
              '<label for="pm-address">' + def.params.address.label + '</label>' +
              '<input id="pm-address" type="text" value="' + (el.address || '') + '">' +
              '<div class="prop-err" id="pm-address-err"></div></div>';
    }

    /* Other params */
    for (var pk in def.params) {
      if (pk === 'address') continue;
      var p = def.params[pk];
      var v = el.params[pk] !== undefined ? el.params[pk] : p.def;
      var hint = PROP_PARAM_HINTS[pk] || '';
      html += '<div class="prop-field">' +
              '<label for="pm-' + pk + '">' + p.label + '</label>' +
              '<input id="pm-' + pk + '" data-key="' + pk + '" type="' + (p.type || 'text') +
              '" value="' + v + '"' + (p.type === 'number' ? ' min="0" step="any"' : '') + '>' +
              (hint ? '<div class="prop-hint">' + hint + '</div>' : '') +
              '<div class="prop-err" id="pm-' + pk + '-err"></div></div>';
    }

    /* Live values */
    html += _propLiveHtml(el);
    propModalBody.innerHTML = html;
    _bindPropsModal(def);
  }

  /* Always emits the container so refreshPropsModalLive() has something to
     fill once the user presses Run with the modal already open. */
  function _propLiveHtml(el) {
    var bits = function (b) { return b ? '<span class="on">TRUE</span>' : '<span class="off">FALSE</span>'; };
    var h = '<div class="prop-live">';
    if (!running && scanCount === 0) {
      return h + 'Press Run to watch live values here.</div>';
    }
    var t = timers[el.address], c = counters[el.address];
    if (t && (_isTimerType(el.type) || /^fbd-t/.test(el.type))) {
      h += 'PRE <b>' + Math.round(t.PRE) + '</b> ms · ACC <b>' + Math.round(t.ACC) + '</b> ms<br>' +
           'EN ' + bits(t.EN) + ' · TT ' + bits(t.TT) + ' · DN ' + bits(t.DN);
    } else if (c && (_isCounterType(el.type) || /^fbd-ct/.test(el.type))) {
      h += 'CV <b>' + c.CV + '</b> · PV <b>' + c.PV + '</b><br>DN ' + bits(c.DN) + ' · OV ' + bits(c.OV);
    } else if (el.params && (el.params.srcA !== undefined || el.params.src !== undefined)) {
      var a = el.params.srcA !== undefined ? el.params.srcA : el.params.src;
      h += a + ' = <b>' + getRegister(a) + '</b>';
      if (el.params.srcB !== undefined) h += ' · ' + el.params.srcB + ' = <b>' + getRegister(el.params.srcB) + '</b>';
      if (el.params.dest !== undefined) h += '<br>' + el.params.dest + ' = <b>' + getRegister(el.params.dest) + '</b>';
    } else {
      h += 'State: ' + bits(el.state);
    }
    h += '</div>';
    return h;
  }

  /* Shared param write — keeps the live timer/counter objects in step with
     an edited preset (same rule the inline panel uses). */
  function _applyPropParam(el, def, key, raw) {
    if (def.params[key].type === 'number') {
      var n = parseFloat(raw);
      if (isNaN(n) || n < 0) return false;
      el.params[key] = n;
    } else {
      el.params[key] = String(raw).trim().toUpperCase();
    }
    var tT = ['ton','tof','tp','rto','fbd-ton','fbd-tof','fbd-tp'];
    var cT = ['ctu','ctd','ctud','fbd-ctu','fbd-ctd'];
    if (key === 'preset' && tT.indexOf(el.type) >= 0 && timers[el.address]) {
      timers[el.address].PRE = _sanePreset(el.params.preset, 3000);
    }
    if (key === 'preset' && cT.indexOf(el.type) >= 0 && counters[el.address]) {
      counters[el.address].PV = _sanePreset(el.params.preset, 10);
    }
    return true;
  }

  function _bindPropsModal(def) {
    var el = _pmEl;

    /* Type swap — carry matching params across, default the rest */
    propModalBody.querySelectorAll('.prop-type-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var nt = b.getAttribute('data-swap');
        if (!nt || nt === el.type) return;
        saveUndo();
        var defs = _pmIsFbd ? BLOCK_DEFS : COMP_DEFS;
        var nd = defs[nt];
        var kept = {};
        for (var k in nd.params) {
          if (k === 'address') continue;
          kept[k] = (el.params && el.params[k] !== undefined) ? el.params[k] : nd.params[k].def;
        }
        el.type = nt;
        el.params = kept;
        if (nd.params.address && !el.address) el.address = nd.params.address.def;
        _renderPropsModal();
        draw();
      });
    });

    /* Address */
    var ai = document.getElementById('pm-address');
    if (ai) {
      ai.addEventListener('change', function () {
        saveUndo();
        var norm = ai.value.trim().toUpperCase();
        el.address = norm; ai.value = norm;
        var msg = _addressProblem(norm, el.type);
        var errEl = document.getElementById('pm-address-err');
        if (errEl) errEl.textContent = msg || '';
        ai.classList.toggle('bad', !!msg);
        propModalSub.textContent = (_pmIsFbd ? 'FBD block' : 'Ladder instruction') + (norm ? ' · ' + norm : '');
        draw();
      });
    }

    /* Params */
    propModalBody.querySelectorAll('input[data-key]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var key = inp.getAttribute('data-key');
        saveUndo();
        var ok = _applyPropParam(el, def, key, inp.value);
        var errEl = document.getElementById('pm-' + key + '-err');
        if (!ok) {
          if (errEl) errEl.textContent = 'Must be a number ≥ 0';
          inp.classList.add('bad');
        } else {
          inp.value = el.params[key];
          var m = (key === 'dest') ? _regParamProblem(el.params[key], true)
                : (key === 'srcA' || key === 'srcB' || key === 'src') ? _regParamProblem(el.params[key], false)
                : null;
          if (errEl) errEl.textContent = m || '';
          inp.classList.toggle('bad', !!m);
        }
        draw();
      });
    });
  }

  /* Refresh the live-values block while the sim runs and the modal is open */
  function refreshPropsModalLive() {
    if (!_pmEl || !propModal || propModal.style.display === 'none') return;
    var live = propModalBody.querySelector('.prop-live');
    if (!live) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = _propLiveHtml(_pmEl);
    var next = tmp.querySelector('.prop-live');
    if (next && live.innerHTML !== next.innerHTML) live.innerHTML = next.innerHTML;
  }

  (function () {
    if (!propModal) return;
    var closeBtn = document.getElementById('prop-modal-close');
    var doneBtn  = document.getElementById('prop-modal-done');
    var delBtn   = document.getElementById('prop-modal-delete');
    if (closeBtn) closeBtn.addEventListener('click', closePropsModal);
    if (doneBtn)  doneBtn.addEventListener('click', closePropsModal);
    if (delBtn) delBtn.addEventListener('click', function () {
      var el = _pmEl;
      if (!el) return closePropsModal();
      saveUndo();
      if (_pmIsFbd) {
        fbdDeleteBlock(el.id);
      } else {
        /* find and remove from whichever rung / branch owns it */
        for (var r = 0; r < rungs.length; r++) {
          var i = rungs[r].elements.indexOf(el);
          if (i >= 0) { rungs[r].elements.splice(i, 1); break; }
          var br = _branchOfElement(r, el);
          if (br) {
            br.elements.splice(br.elements.indexOf(el), 1);
            if (br.elements.length === 0) rungs[r].branches.splice(rungs[r].branches.indexOf(br), 1);
            break;
          }
        }
        selectedElement = null;
        hideProperties();
      }
      closePropsModal();
    });
    /* Click the backdrop or press Escape to dismiss */
    propModal.addEventListener('pointerdown', function (e) {
      if (e.target === propModal) closePropsModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && propModal.style.display !== 'none') closePropsModal();
    });
  })();

  /* ================================================================
     SECTION 11 — UNDO SYSTEM
     ================================================================ */

  var redoStack = [];

  function _undoSnapshot() {
    return {
      rungs:      JSON.parse(JSON.stringify(rungs)),
      fbdBlocks:  JSON.parse(JSON.stringify(fbdBlocks)),
      fbdWires:   JSON.parse(JSON.stringify(fbdWires)),
      annStrokes: JSON.parse(JSON.stringify(annStrokes)),
      annShapes:  JSON.parse(JSON.stringify(annShapes)),
      inputKinds: JSON.parse(JSON.stringify(inputKinds))
    };
  }

  function _undoRestore(s) {
    if (!s) return;
    if (Array.isArray(s)) {
      /* Legacy pre-v6 snapshot format: just rungs */
      rungs = s;
    } else {
      rungs      = s.rungs      || [];
      fbdBlocks  = s.fbdBlocks  || [];
      fbdWires   = s.fbdWires   || [];
      annStrokes = s.annStrokes || [];
      annShapes  = s.annShapes  || [];
      if (s.inputKinds) inputKinds = s.inputKinds;
    }
  }

  function saveUndo() {
    undoStack.push(_undoSnapshot());
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
  }

  function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(_undoSnapshot());
    _undoRestore(undoStack.pop());
    selectedElement = null;
    selectedCell = null;
    fbdSelectedBlockId = null;
    hideProperties();
    draw();
  }

  function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(_undoSnapshot());
    _undoRestore(redoStack.pop());
    selectedElement = null;
    selectedCell = null;
    fbdSelectedBlockId = null;
    hideProperties();
    draw();
  }

  /* ================================================================
     SECTION 12 — CANVAS RESIZE & MODE SWITCHING
     ================================================================ */

  var dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    var wrap = cvs.parentElement;
    if (!wrap) return;
    /* Re-read DPR each resize — browser zoom or moving the window to a
       different-density monitor changes it, and a stale value blurs the
       backing store until reload. */
    dpr = window.devicePixelRatio || 1;
    var ww = wrap.clientWidth;
    W = Math.max(700, ww);
    H = Math.max(400, Math.round(W * 0.55));
    cvs.width = W * dpr;
    cvs.height = H * dpr;
    cvs.style.width = ww + 'px';
    cvs.style.height = Math.round(H * (ww / W)) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    RAIL_X_R = RAIL_X_L + (COLS + 1) * CELL_W;
  }

  window.addEventListener('resize', function () {
    resizeCanvas();
    draw();
  });

  function switchMode(m) {
    /* A8 FIX: stop simulation when leaving Simulate mode */
    if (m !== 'simulate' && running) stopSim();
    mode = m;
    simPanel.style.display       = m === 'simulate' ? '' : 'none';
    catRow.style.display          = m === 'explore'  ? '' : 'none';
    itemSelector.style.display    = m === 'explore'  ? '' : 'none';
    itemInfo.style.display        = 'none';
    practicePanel.style.display   = m === 'practice' ? '' : 'none';
    practiceBar.style.display     = m === 'practice' ? '' : 'none';
    quizPanel.style.display       = m === 'quiz'     ? '' : 'none';
    quizBar.style.display         = m === 'quiz'     ? '' : 'none';
    quizResult.style.display      = 'none';

    document.querySelectorAll('#mode-tabs .pill').forEach(function (p) {
      p.classList.toggle('active', p.dataset.mode === m);
    });

    if (m === 'simulate') { resizeCanvas(); draw(); }
    if (m === 'explore')  renderConceptGrid();
    if (m === 'practice') generateProblem();
    if (m === 'quiz')     startQuiz();
  }

  document.getElementById('mode-tabs').addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    switchMode(pill.dataset.mode);
  });

  /* ================================================================
     SECTION 13 — EXPLORE MODE (16 concepts, 6 categories)
     ================================================================ */

  var CONCEPTS = [
    /* ── Fundamentals ──────────────────────────────────────── */
    {
      id: 'scan-cycle', name: 'PLC Scan Cycle', symbol: 'Scan',
      formula: 'Input Scan \u2192 Program Scan \u2192 Output Scan',
      unit: '\u2014', cat: 'fundamentals',
      desc: 'Every PLC operates in a continuous scan cycle with three phases. First, the Input Scan reads all physical input signals (pushbuttons, sensors, limit switches) and copies their states into an input image table in memory. Second, the Program Scan executes the ladder logic program from the first rung to the last, evaluating each contact condition against the input image and writing coil states to an output image table. Third, the Output Scan transfers the output image table to the physical output modules. A typical scan cycle takes 1 to 10 milliseconds depending on program size. This deterministic, cyclic operation is what makes PLCs reliable for industrial control.',
      tips: ['Scan time increases with program size \u2014 keep programs efficient', 'Outputs only update at the end of each scan, not during logic execution', 'Fast events (< scan time) may be missed without high-speed interrupt inputs']
    },
    {
      id: 'power-rails', name: 'Power Rails', symbol: 'L1/L2',
      formula: 'L1 (+24V) \u2500\u2500\u2500 [Logic] \u2500\u2500\u2500 L2 (0V)',
      unit: '\u2014', cat: 'fundamentals',
      desc: 'In a ladder diagram, the left vertical rail (L1) represents the power supply (+24V DC or line voltage) and the right rail (L2) represents the return path (0V or neutral). Horizontal rungs connect from L1 to L2. Power "flows" from left to right through contacts (conditions) to reach coils (outputs). If all contacts in a series path are TRUE, power reaches the coil and it energises. This visual representation directly mirrors traditional relay logic circuits, which is why ladder logic was adopted as the primary PLC programming language.',
      tips: ['Power always flows left to right, never right to left', 'Each rung must have at least one output element (coil) at the right end', 'Multiple rungs can drive the same output \u2014 last rung wins for normal coils']
    },
    {
      id: 'boolean-logic', name: 'Boolean Logic in Ladder', symbol: 'AND/OR',
      formula: 'Series = AND, Parallel = OR',
      unit: '\u2014', cat: 'fundamentals',
      desc: 'Ladder logic implements Boolean operations through physical wire connections. When contacts are placed in SERIES (one after another on the same rung), they perform AND logic \u2014 all contacts must be TRUE for power to pass. When contacts are on PARALLEL branches (vertical connections between horizontal paths), they perform OR logic \u2014 any one branch being TRUE passes power. Combining series and parallel connections allows you to build any Boolean expression. A contact with a diagonal slash represents NOT (negation) \u2014 it passes power when its address is FALSE.',
      tips: ['Series contacts = AND: both must be TRUE', 'Parallel branches = OR: either can be TRUE', 'NC contact = NOT: inverts the bit value', 'Complex logic: break into multiple rungs for clarity']
    },
    /* ── Contacts & Coils ─────────────────────────────────── */
    {
      id: 'no-contact', name: 'NO Contact', symbol: '[ ]',
      formula: '\u2500] [\u2500  passes power when address = TRUE',
      unit: '\u2014', cat: 'contacts-coils',
      desc: 'The Normally Open (NO) contact is the most basic ladder logic instruction. It examines its assigned address (input, output, memory bit, or timer/counter status bit) and passes power if that address is TRUE (logic 1). When the address is FALSE (logic 0), the contact blocks power flow. Think of it like a physical pushbutton that is normally disconnected \u2014 pressing it (making it TRUE) closes the circuit. NO contacts are used for all positive conditions: "if button pressed", "if sensor active", "if timer done".',
      tips: ['Most commonly used instruction in ladder logic', 'Can examine any bit: I, Q, M, T.DN, C.DN', 'Multiple NO contacts in series = all must be TRUE (AND)']
    },
    {
      id: 'nc-contact', name: 'NC Contact', symbol: '[/]',
      formula: '\u2500]/[\u2500  passes power when address = FALSE',
      unit: '\u2014', cat: 'contacts-coils',
      desc: 'The Normally Closed (NC) contact \u2014 called XIO (Examine If Open) in Allen-Bradley \u2014 passes power when its assigned address is FALSE and blocks power when it is TRUE. This is the inverse of the NO contact, and it is drawn with a slash through the contact symbol. IMPORTANT distinction: the NC *instruction* in the program is not the same thing as an NC *field device*. A fail-safe stop circuit uses a PHYSICALLY NC push button (its input bit is 1 while the button is healthy) examined by a normally-open (XIC) instruction \u2014 pressing the button, or a broken wire, drops the bit to 0 and the XIC opens the rung. If you instead used an NC instruction on that input, a broken wire (bit = 0) would make the instruction PASS power and the machine would keep running \u2014 the opposite of fail-safe.',
      tips: ['NC instruction (XIO) = true when the bit is 0', 'Fail-safe stop = physically NC button + NO (XIC) instruction', 'A broken wire must always take the circuit to the SAFE state', 'Use NC instructions for inverting flags, interlock bits, "not full" conditions']
    },
    {
      id: 'set-reset', name: 'Set/Reset Coils', symbol: '(S)/(R)',
      formula: '(S) latches ON, (R) latches OFF',
      unit: '\u2014', cat: 'contacts-coils',
      desc: 'Set (Latch) and Reset (Unlatch) coils provide retentive output control. A Set coil (S) turns its address ON when the rung has power and KEEPS it ON even after the rung power drops \u2014 it is "latched". Only a Reset coil (R) on a different rung can turn it back OFF. This is an alternative to the seal-in circuit pattern. Set/Reset is useful when the ON condition and OFF condition are completely different and cannot be expressed on the same rung. Important: if both Set and Reset are powered simultaneously, the LAST one evaluated (lower rung) wins.',
      tips: ['Set coil: address stays TRUE even after input drops', 'Only a Reset coil can turn a Set coil OFF', 'If both powered: last rung evaluated wins', 'Prefer Set/Reset when ON and OFF conditions are on separate rungs']
    },
    {
      id: 'negated-coil', name: 'Negated Coil', symbol: '(/)',
      formula: '(/) output = NOT rung_power',
      unit: '\u2014', cat: 'contacts-coils',
      desc: 'The Negated coil inverts the rung power state before writing to its address. When the rung has power, the address is set to FALSE. When the rung has NO power, the address is set to TRUE. This provides a convenient way to create "default ON" outputs that turn off only under specific conditions. For example, a warning light that is normally ON and turns off only when all conditions are safe.',
      tips: ['Opposite of normal coil: powered rung = FALSE output', 'Useful for "normally ON" indicators', 'Can replace NC contact + normal coil in simple cases']
    },
    /* ── Timers ───────────────────────────────────────────── */
    {
      id: 'ton-timer', name: 'TON Timer (On-Delay)', symbol: 'TON',
      formula: 'EN \u2192 wait PRE ms \u2192 DN = TRUE',
      unit: 'ms', cat: 'timers',
      desc: 'The TON (Timer On-Delay) is the most commonly used PLC timer. When the input condition (EN) becomes TRUE, the timer starts accumulating time. When the accumulated value (ACC) reaches the preset value (PRE), the Done bit (DN) turns TRUE. If the input drops to FALSE before the preset is reached, the timer resets ACC to zero and DN stays FALSE. The Timing bit (TT) is TRUE while the timer is actively counting (EN is TRUE and DN is not yet TRUE). TON timers are used for delayed starts, debouncing, time-based sequences, and any situation where you need to wait before taking action.',
      example: {
        problem: 'A TON timer has PRE = 3000 ms. Input goes TRUE at t=0. When does DN become TRUE?',
        steps: ['Timer starts at t = 0 when EN goes TRUE', 'ACC accumulates from 0 towards 3000', 'At t = 3000 ms, ACC = PRE = 3000', 'DN becomes TRUE at t = 3000 ms (3 seconds)'],
        answer: 3000, unit: 'ms'
      }
    },
    {
      id: 'tof-timer', name: 'TOF Timer (Off-Delay)', symbol: 'TOF',
      formula: 'EN drops \u2192 wait PRE ms \u2192 DN = FALSE',
      unit: 'ms', cat: 'timers',
      desc: 'The TOF (Timer Off-Delay) keeps its output ON for a specified time after the input turns OFF. When EN goes TRUE, DN immediately goes TRUE (no delay on turn-on). When EN drops to FALSE, the timer starts counting. After ACC reaches PRE, DN turns FALSE. If EN goes TRUE again before the preset, the timer resets and DN stays TRUE. TOF timers are used for cooling fans that run after a motor stops, lights that stay on after motion stops, or any application requiring an off-delay.',
      example: {
        problem: 'A TOF timer has PRE = 5000 ms. Input goes FALSE at t=2000. When does DN become FALSE?',
        steps: ['DN was TRUE while EN was TRUE', 'EN drops to FALSE at t = 2000 ms', 'Timer starts counting from t = 2000', 'ACC reaches PRE (5000) at t = 7000 ms', 'DN becomes FALSE at t = 7000 ms'],
        answer: 7000, unit: 'ms'
      }
    },
    {
      id: 'tp-timer', name: 'TP Timer (Pulse)', symbol: 'TP',
      formula: 'Rising edge \u2192 DN = TRUE for PRE ms',
      unit: 'ms', cat: 'timers',
      desc: 'The TP (Timer Pulse) generates a fixed-duration output pulse on each rising edge of the input signal. When the input transitions from FALSE to TRUE, DN goes TRUE and stays TRUE for exactly PRE milliseconds, regardless of how long the input remains TRUE. After the pulse completes, DN returns to FALSE. A new pulse cannot start until the current one finishes and a new rising edge occurs. TP timers are used for generating fixed-width pulses, one-shot operations, and situations where you need a consistent output duration regardless of input duration.',
      example: {
        problem: 'A TP timer has PRE = 2000 ms. Input goes TRUE at t=0 and stays TRUE. When does DN become FALSE?',
        steps: ['Rising edge detected at t = 0', 'DN goes TRUE immediately', 'Pulse duration = PRE = 2000 ms', 'DN returns to FALSE at t = 2000 ms', 'Input staying TRUE does not extend the pulse'],
        answer: 2000, unit: 'ms'
      }
    },
    /* ── Counters ─────────────────────────────────────────── */
    {
      id: 'ctu-counter', name: 'CTU Counter (Count Up)', symbol: 'CTU',
      formula: 'Rising edge \u2192 CV++ \u2192 if CV \u2265 PV then DN',
      unit: '\u2014', cat: 'counters',
      desc: 'The CTU (Count Up) counter increments its current value (CV) by one on each rising edge (FALSE-to-TRUE transition) of the count input. When CV reaches or exceeds the preset value (PV), the Done bit (DN) turns TRUE. The counter does NOT increment on every scan \u2014 only on the rising edge of the input. This is critical: a contact held TRUE will only count once, not every scan cycle. A separate Reset input can be used to set CV back to zero. CTU counters are used for counting parts on a conveyor, tracking production batches, or any event-counting application.',
      example: {
        problem: 'CTU counter C0 has PV = 5. After 7 rising edges, what is CV and is DN TRUE?',
        steps: ['Each rising edge increments CV by 1', 'After 5 edges: CV = 5, CV \u2265 PV, DN = TRUE', 'After 7 edges: CV = 7', 'DN remains TRUE (CV \u2265 PV)', 'CV continues counting beyond PV'],
        answer: 7, unit: 'counts'
      }
    },
    {
      id: 'ctd-counter', name: 'CTD Counter (Count Down)', symbol: 'CTD',
      formula: 'Rising edge \u2192 CV\u2212\u2212 \u2192 if CV \u2264 0 then DN',
      unit: '\u2014', cat: 'counters',
      desc: 'The CTD (Count Down) counter decrements its current value (CV) by one on each rising edge of the count input. When CV reaches zero or below, the Done bit (DN) turns TRUE. Like CTU, it only counts on rising edges, not on every scan. CTD counters are useful for tracking remaining items (e.g., parts in a hopper), implementing countdown sequences, or creating a "count down to zero" trigger. Note: like Allen-Bradley counters, CV continues below zero if pulses keep arriving \u2014 DN simply stays TRUE for any CV \u2264 0. Use the RES instruction to reload CV = PV.',
      tips: ['Only counts on rising edge (FALSE \u2192 TRUE transition)', 'DN becomes TRUE when CV \u2264 0 (CV can go negative, as in Allen-Bradley)', 'RES reloads CV = PV to restart the countdown', 'Load PV into CV before starting countdown']
    },
    {
      id: 'counter-reset', name: 'Counter Reset', symbol: 'RES',
      formula: 'Reset address \u2192 CV = 0, DN = FALSE',
      unit: '\u2014', cat: 'counters',
      desc: 'Counters accumulate across scan cycles and need to be explicitly reset. A reset can be implemented by configuring a Reset Address in the counter parameters, or by using a Reset (R) coil with the counter address. When the reset condition is TRUE, the counter CV is set back to 0 and DN is cleared to FALSE. Always include a reset path for your counters to allow operators to restart counting or to automatically reset after a batch is complete.',
      tips: ['Configure reset address in counter properties', 'Or use a separate rung with Reset (R) coil', 'Always provide a reset path for production use', 'Counter values are not preserved across power cycles in this simulator']
    },
    /* ── Logic ────────────────────────────────────────────── */
    {
      id: 'and-logic', name: 'Series (AND) Logic', symbol: 'AND',
      formula: 'A AND B = A \u2500] [\u2500 B \u2500] [\u2500',
      unit: '\u2014', cat: 'logic',
      desc: 'When two or more contacts are placed in series (one after another on the same horizontal line), they form AND logic. Power can only pass through to the output if ALL contacts in the series are TRUE. This is the most fundamental logic pattern in ladder diagrams. For example, a motor might require both a start button AND a safety guard to be active. In Boolean algebra: Output = A AND B. In a ladder diagram, this is simply two contacts on the same rung.',
      tips: ['All series contacts must be TRUE for power to pass', 'Add more contacts in series for more AND conditions', 'Common pattern: Start AND Safety AND Enable']
    },
    {
      id: 'or-logic', name: 'Parallel (OR) Logic', symbol: 'OR',
      formula: 'A OR B = parallel branches',
      unit: '\u2014', cat: 'logic',
      desc: 'Parallel branches in a ladder diagram create OR logic. If power can flow through ANY of the parallel paths, the output is energised. Branches are created by adding vertical connections that split from and rejoin the main rung. For example, a motor might be started from Button A OR Button B (two operator stations). In Boolean algebra: Output = A OR B. In the simulator, use the Branch Start instruction to create a parallel path.',
      tips: ['Any one parallel path being TRUE energises the output', 'Use branches for multiple start stations or conditions', 'The seal-in circuit uses OR: Start OR Self-hold']
    },
    {
      id: 'mixed-logic', name: 'Mixed AND/OR Logic', symbol: 'Mixed',
      formula: '(A OR B) AND C = branches + series',
      unit: '\u2014', cat: 'logic',
      desc: 'Complex control logic combines series (AND) and parallel (OR) connections. For example, (Button1 OR Button2) AND SafetySwitch requires a parallel branch for the two buttons followed by a series safety contact. The order matters: evaluate the OR group first, then AND with the remaining series contacts. Any Boolean expression can be translated to ladder logic using these two patterns. Break complex expressions into sub-groups: first identify OR groups, create branches for them, then place AND conditions in series.',
      tips: ['Break complex logic into smaller groups', 'Create OR branches first, then add AND series', 'Use memory bits (M) to store intermediate results', 'Multiple rungs can simplify complex expressions']
    },
    /* ── Applications ─────────────────────────────────────── */
    {
      id: 'motor-control', name: 'Motor Control', symbol: 'Motor',
      formula: 'Start OR Seal-in AND NOT Stop \u2192 Motor',
      unit: '\u2014', cat: 'applications',
      desc: 'The motor start/stop circuit is the most fundamental PLC program. A Start pushbutton (physically NO, momentary) initiates motor operation. A seal-in contact (memory bit or output feedback) in parallel with Start maintains the circuit after the button is released. The Stop pushbutton is PHYSICALLY NC — its input bit is 1 while the circuit is healthy — and the program examines it with a normally-open (XIC) instruction in series. Pressing Stop (or a broken stop-button wire) drops the bit to 0, the XIC opens, and the motor stops: fail-safe. The fail-safety comes from the physical NC wiring of the button, not from using an NC instruction in the program.',
      tips: ['Stop button: physically NC device + NO (XIC) instruction', 'Seal-in contact goes in parallel with Start button', 'Add overload contact in series for motor protection', 'Use Set/Reset coils as an alternative to seal-in — with STOP priority (reset last / reset-dominant)']
    },
    {
      id: 'safety-circuits', name: 'Safety Circuits', symbol: 'Safety',
      formula: 'E-Stop AND Guard AND Enable \u2192 Output',
      unit: '\u2014', cat: 'applications',
      desc: 'Safety devices — emergency stops, guard switches, light curtains — are PHYSICALLY wired as NC (de-energise to trip): the input is energised while everything is safe, and activating the device (or a broken wire) drops the signal. In the PLC program those healthy signals are examined with NO (XIC) instructions in series, so losing any one of them stops the output. CRITICAL: per ISO 13850 / IEC 60204-1, a real emergency-stop FUNCTION must not depend on standard PLC program logic alone — it must act through hardwired circuits or safety-rated devices (safety relay, safety PLC). The interlock rungs you build here are for process logic and status; the E-stop itself is implemented in the safety circuit, and the PLC merely monitors it.',
      tips: ['Safety devices are physically NC — de-energise to trip', 'Examine the healthy (1) signals with XIC instructions in series', 'E-stop functions must be hardwired or safety-rated — never standard PLC logic alone (ISO 13850)', 'Use dual-channel monitoring + a safety relay for Category 3/4']
    },
    {
      id: 'sequence-control', name: 'Sequence Control', symbol: 'Seq',
      formula: 'Step 1 done \u2192 Step 2 \u2192 Step 3 \u2192 ...',
      unit: '\u2014', cat: 'applications',
      desc: 'Sequential control uses memory bits and timer done bits to advance through a multi-step process. Each step is active when the previous step is complete. For example: Step 1 (fill tank) starts when Start is pressed. When the tank-full sensor activates, Step 1 is done and Step 2 (mix for 30 seconds using TON) begins. When T0.DN is TRUE, Step 3 (drain) starts. Memory bits M0.0, M0.1, M0.2 track which step is active. Only one step should be active at a time. This is the manual equivalent of a Sequential Function Chart (SFC).',
      tips: ['Use memory bits to track active step', 'Each step enables the next when complete', 'Include a reset/home condition for the sequence', 'Timers provide time-based step transitions']
    }
  ];

  function renderConceptGrid() {
    conceptGrid.innerHTML = '';
    CONCEPTS.forEach(function (c) {
      if (c.cat !== exploreCat) return;
      var card = document.createElement('div');
      card.className = 'is-card' + (selectedConcept === c ? ' active' : '');
      card.innerHTML = '<div class="is-card-name">' + c.name + '</div><div class="is-card-symbol">' + c.symbol + '</div>';
      card.addEventListener('click', function () {
        selectedConcept = c;
        renderConceptGrid();
        renderConceptInfo(c);
      });
      conceptGrid.appendChild(card);
    });
  }

  function renderConceptInfo(c) {
    itemInfo.style.display = '';
    var html = '<h3>' + c.name + ' (' + c.symbol + ')</h3>';
    html += '<div class="formula-box">' + c.formula + '</div>';
    html += '<p>' + c.desc + '</p>';

    /* Tips */
    if (c.tips && c.tips.length) {
      html += '<div style="margin-top:12px;padding:10px 12px;background:rgba(255,187,51,0.06);border-left:3px solid #ffbb33;border-radius:4px;">';
      html += '<div style="font-weight:700;color:#ffbb33;font-size:0.82rem;margin-bottom:6px;">Practical Tips</div>';
      html += '<ul style="margin:0;padding-left:18px;font-size:0.82rem;color:#b8b090;line-height:1.6;">';
      c.tips.forEach(function (t) { html += '<li>' + t + '</li>'; });
      html += '</ul></div>';
    }

    /* Worked example */
    if (c.example) {
      html += '<div class="example-box"><h4>Worked Example</h4><p><strong>' + c.example.problem + '</strong></p>';
      c.example.steps.forEach(function (s) { html += '<div class="step">' + s + '</div>'; });
      if (c.example.answer !== undefined) {
        html += '<p><strong>Answer: ' + c.example.answer + ' ' + (c.example.unit || '') + '</strong></p>';
      }
      html += '</div>';
    }

    itemInfo.innerHTML = html;
  }

  catTabs.addEventListener('click', function (e) {
    var pill = e.target.closest('.pill');
    if (!pill) return;
    exploreCat = pill.dataset.cat;
    catTabs.querySelectorAll('.pill').forEach(function (p) { p.classList.toggle('active', p.dataset.cat === exploreCat); });
    selectedConcept = null;
    itemInfo.style.display = 'none';
    renderConceptGrid();
  });

  /* ================================================================
     SECTION 14 — PRACTICE MODE (12 problem generators)
     ================================================================ */

  function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function rndChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function rndBool() { return Math.random() < 0.5; }

  var PRACTICE = [
    /* 1. NO contact evaluation */
    function () {
      var inputs_state = [];
      var addrs = [];
      var n = rndInt(2, 4);
      var result = true;
      for (var i = 0; i < n; i++) {
        var on = rndBool();
        inputs_state.push(on);
        addrs.push('I0.' + i);
        result = result && on;
      }
      var desc = 'Series (AND) circuit with ' + n + ' NO contacts. ';
      for (var j = 0; j < n; j++) {
        desc += addrs[j] + ' = ' + (inputs_state[j] ? 'TRUE' : 'FALSE');
        if (j < n - 1) desc += ', ';
      }
      desc += '. What is the output coil state? (1 = TRUE, 0 = FALSE)';
      return {
        prompt: desc,
        answer: result ? 1 : 0,
        tol: 0,
        unit: '',
        steps: [
          'Series contacts = AND logic',
          'All contacts must be TRUE for output to be TRUE',
          addrs.map(function (a, idx) { return a + ' = ' + (inputs_state[idx] ? 'TRUE' : 'FALSE'); }).join(', '),
          'Result: ' + (result ? 'TRUE (1)' : 'FALSE (0)')
        ]
      };
    },
    /* 2. NC contact evaluation */
    function () {
      var addr = 'I0.' + rndInt(0, 7);
      var bitVal = rndBool();
      var result = !bitVal;
      return {
        prompt: 'A single NC contact examines ' + addr + '. ' + addr + ' = ' + (bitVal ? 'TRUE' : 'FALSE') + '. Does the NC contact pass power? (1 = yes, 0 = no)',
        answer: result ? 1 : 0,
        tol: 0,
        unit: '',
        steps: [
          'NC contact passes power when address is FALSE',
          addr + ' = ' + (bitVal ? 'TRUE' : 'FALSE'),
          'NC contact output = NOT(' + bitVal + ') = ' + result,
          'Answer: ' + (result ? '1 (passes power)' : '0 (blocks power)')
        ]
      };
    },
    /* 3. Mixed AND/OR evaluation */
    function () {
      var a = rndBool(), b = rndBool(), c = rndBool();
      /* (A OR B) AND C */
      var result = (a || b) && c;
      return {
        prompt: 'Rung has I0.0 and I0.1 in parallel (OR), followed by I0.2 in series (AND). I0.0=' + (a ? 'T' : 'F') + ', I0.1=' + (b ? 'T' : 'F') + ', I0.2=' + (c ? 'T' : 'F') + '. Output? (1/0)',
        answer: result ? 1 : 0,
        tol: 0,
        unit: '',
        steps: [
          'Parallel: I0.0 OR I0.1 = ' + (a ? 'T' : 'F') + ' OR ' + (b ? 'T' : 'F') + ' = ' + ((a || b) ? 'TRUE' : 'FALSE'),
          'Series: (' + ((a || b) ? 'TRUE' : 'FALSE') + ') AND I0.2(' + (c ? 'T' : 'F') + ') = ' + (result ? 'TRUE' : 'FALSE'),
          'Answer: ' + (result ? '1' : '0')
        ]
      };
    },
    /* 4. TON timer calculation */
    function () {
      var pre = rndInt(2, 10) * 1000;
      var elapsed = rndInt(1, 15) * 1000;
      var dn = elapsed >= pre;
      return {
        prompt: 'TON timer with PRE = ' + pre + ' ms. Input has been TRUE for ' + elapsed + ' ms. Is DN TRUE? (1/0)',
        answer: dn ? 1 : 0,
        tol: 0,
        unit: '',
        steps: [
          'TON: DN becomes TRUE when ACC >= PRE',
          'PRE = ' + pre + ' ms',
          'ACC = ' + elapsed + ' ms (input has been TRUE this long)',
          elapsed + (elapsed >= pre ? ' >= ' : ' < ') + pre,
          'DN = ' + (dn ? 'TRUE' : 'FALSE')
        ]
      };
    },
    /* 5. TON timer time to DN */
    function () {
      var pre = rndInt(1, 20) * 500;
      return {
        prompt: 'A TON timer has PRE = ' + pre + ' ms. Input goes TRUE at t=0. At what time (ms) does DN become TRUE?',
        answer: pre,
        tol: 0,
        unit: 'ms',
        steps: [
          'TON starts timing when input goes TRUE',
          'ACC increases from 0 towards PRE',
          'DN becomes TRUE when ACC = PRE = ' + pre + ' ms',
          'Answer: ' + pre + ' ms'
        ]
      };
    },
    /* 6. CTU counter after N pulses */
    function () {
      var pv = rndInt(3, 15);
      var pulses = rndInt(1, 20);
      var cv = pulses;
      var dn = cv >= pv;
      return {
        prompt: 'CTU counter with PV = ' + pv + '. After ' + pulses + ' rising edges, what is CV?',
        answer: cv,
        tol: 0,
        unit: 'counts',
        steps: [
          'CTU increments CV on each rising edge',
          'After ' + pulses + ' edges: CV = ' + cv,
          'PV = ' + pv,
          'DN = ' + (dn ? 'TRUE (CV >= PV)' : 'FALSE (CV < PV)')
        ]
      };
    },
    /* 7. Counter DN status */
    function () {
      var pv = rndInt(5, 20);
      var cv = rndInt(1, 25);
      var dn = cv >= pv;
      return {
        prompt: 'CTU counter C0 has PV = ' + pv + ' and CV = ' + cv + '. Is C0.DN TRUE? (1/0)',
        answer: dn ? 1 : 0,
        tol: 0,
        unit: '',
        steps: [
          'CTU: DN = TRUE when CV >= PV',
          'CV = ' + cv + ', PV = ' + pv,
          cv + (cv >= pv ? ' >= ' : ' < ') + pv,
          'DN = ' + (dn ? 'TRUE (1)' : 'FALSE (0)')
        ]
      };
    },
    /* 8. Debug: find the error */
    function () {
      var scenarios = [
        {
          desc: 'A motor circuit uses a PHYSICALLY NC Stop button (its input bit is 1 while healthy). The programmer examined it with an NC (XIO) instruction: (Start ∥ Seal-in) in series with Stop(XIO) -> Motor coil. The motor never starts. What is the error? (enter 1 when identified)',
          answer: 1,
          steps: ['The Stop input bit is 1 at rest (the button is physically NC)', 'An XIO instruction is TRUE only when its bit is 0 — so it blocks the rung while the button is healthy', 'A physically NC button must be examined with a normally-open XIC instruction: bit 1 → conducts; pressed or broken wire → bit 0 → rung opens (fail-safe)', 'Answer: 1 (replace the XIO with an XIC on the NC stop input)']
        },
        {
          desc: 'A seal-in circuit has: Start(NO) || Seal(NO), then Motor(coil). After pressing Start, the motor turns on but stops when Start is released. What is missing?',
          answer: 1,
          steps: ['The seal-in contact is reading the wrong address', 'Seal contact must read the motor output (Q0.0) or a memory bit that the motor sets', 'Answer: 1 (seal-in address is wrong or missing)']
        },
        {
          desc: 'TON timer T0 has PRE=5000ms. Contact examines T0.DN to start the next step. But T0 never reaches DN. Input I0.0 flickers ON/OFF every 2 seconds. What is the problem?',
          answer: 1,
          steps: ['TON resets ACC to 0 when input goes FALSE', 'Input flickers every 2000ms, but PRE = 5000ms', 'Timer never accumulates past 2000ms before resetting', 'Answer: 1 (input must stay TRUE for full PRE duration)']
        }
      ];
      var s = rndChoice(scenarios);
      return { prompt: s.desc, answer: s.answer, tol: 0, unit: '', steps: s.steps };
    },
    /* 9. More debug */
    function () {
      var scenarios = [
        {
          desc: 'A part counter should count 10 parts then stop the conveyor. The programmer used ADD (D0 = D0 + 1) on a rung driven by the part sensor. CV jumps to thousands the moment a part sits in front of the sensor. What is the error? (enter 1 when identified)',
          answer: 1,
          steps: ['ADD executes on EVERY scan while its rung has power \u2014 thousands of scans per second', 'A CTU counter increments only on the RISING EDGE of its input: one part = one count, no matter how long the sensor stays TRUE', 'Answer: 1 (replace the ADD rung with a CTU counter, or one-shot the sensor with a [P] contact)']
        },
        {
          desc: 'A motor output Q0.0 is assigned to a coil on rung 3 and also to a coil on rung 7. Rung 3 should turn it ON, but it stays OFF. Why?',
          answer: 1,
          steps: ['Normal coils are re-evaluated every scan', 'Rung 7 executes AFTER rung 3', 'If rung 7 coil has no power, it writes FALSE to Q0.0', 'Last rung evaluated wins for normal coils', 'Answer: 1 (use Set/Reset coils or remove duplicate)']
        }
      ];
      var s = rndChoice(scenarios);
      return { prompt: s.desc, answer: s.answer, tol: 0, unit: '', steps: s.steps };
    },
    /* 10. Design question: how many contacts needed */
    function () {
      var n = rndInt(2, 4);
      return {
        prompt: 'You need ' + n + ' conditions to ALL be TRUE before a motor starts (AND logic). How many NO contacts in series do you need?',
        answer: n,
        tol: 0,
        unit: 'contacts',
        steps: [
          'AND logic = series contacts',
          'Each condition needs one NO contact',
          n + ' conditions = ' + n + ' NO contacts in series',
          'Answer: ' + n
        ]
      };
    },
    /* 11. TOF timer question */
    function () {
      var pre = rndInt(2, 8) * 1000;
      var offTime = rndInt(1, 12) * 1000;
      var stillOn = offTime < pre;
      return {
        prompt: 'TOF timer with PRE = ' + pre + ' ms. Input was TRUE, then went FALSE. After ' + offTime + ' ms of FALSE, is DN still TRUE? (1/0)',
        answer: stillOn ? 1 : 0,
        tol: 0,
        unit: '',
        steps: [
          'TOF: DN stays TRUE for PRE ms after input drops',
          'PRE = ' + pre + ' ms',
          'Time since input went FALSE = ' + offTime + ' ms',
          offTime + (offTime < pre ? ' < ' : ' >= ') + pre,
          'DN = ' + (stillOn ? 'TRUE (still in delay period)' : 'FALSE (delay expired)')
        ]
      };
    },
    /* 12. Memory addressing */
    function () {
      var byte_n = rndInt(0, 3);
      var bit_n = rndInt(0, 7);
      var type = rndChoice(['I', 'Q', 'M']);
      var typeName = type === 'I' ? 'Input' : type === 'Q' ? 'Output' : 'Memory';
      return {
        prompt: 'In IEC 61131-3 addressing, what does ' + type + byte_n + '.' + bit_n + ' represent? Enter the bit number (0-7).',
        answer: bit_n,
        tol: 0,
        unit: '',
        steps: [
          type + byte_n + '.' + bit_n + ' = ' + typeName + ' byte ' + byte_n + ', bit ' + bit_n,
          'Format: [Type][Byte].[Bit]',
          type + ' = ' + typeName,
          byte_n + ' = byte address',
          bit_n + ' = bit within that byte',
          'Answer: bit ' + bit_n
        ]
      };
    }
  ];

  function generateProblem() {
    var gen = PRACTICE[Math.floor(Math.random() * PRACTICE.length)];
    currentProblem = gen();
    practiceAnswered = false;

    ppPrompt.textContent = currentProblem.prompt;
    ppUnit.textContent = currentProblem.unit;
    ppInput.value = '';
    ppInput.disabled = false;
    ppInput.type = 'number';
    ppFeedback.textContent = '';
    ppFeedback.className = 'feedback';
    ppSolution.style.display = 'none';
    ppCheck.style.display = '';
    ppNext.style.display = 'none';
    ppInput.focus();
  }

  ppCheck.addEventListener('click', function () {
    if (practiceAnswered || !currentProblem) return;
    var userVal = parseFloat(ppInput.value);
    if (isNaN(userVal)) return;
    practiceAnswered = true;
    practiceTotal++;

    var diff = Math.abs(userVal - currentProblem.answer);
    var correct = diff <= (currentProblem.tol || 0);

    if (correct) {
      practiceCorrect++;
      ppFeedback.textContent = 'Correct!';
      ppFeedback.className = 'feedback correct';
    } else {
      ppFeedback.textContent = 'Incorrect. Answer: ' + currentProblem.answer + ' ' + currentProblem.unit;
      ppFeedback.className = 'feedback wrong';
    }

    pbarScoreVal.textContent = practiceCorrect + ' / ' + practiceTotal;
    ppInput.disabled = true;
    ppCheck.style.display = 'none';
    ppNext.style.display = '';

    ppSolution.style.display = '';
    ppSolution.innerHTML = '<strong>Solution:</strong><br>' + currentProblem.steps.join('<br>');
  });

  ppNext.addEventListener('click', generateProblem);
  ppInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') ppCheck.click(); });

  /* ================================================================
     SECTION 15 — QUIZ MODE (15 questions pool, 5 per quiz)
     ================================================================ */

  var QUIZ_POOL = [
    /* MCQ questions */
    {
      type: 'mcq',
      q: 'What does an NC (Normally Closed) contact do in ladder logic?',
      opts: [
        'Passes power when its address is TRUE',
        'Passes power when its address is FALSE',
        'Latches the output ON',
        'Generates a pulse on rising edge'
      ],
      ans: 1
    },
    {
      type: 'mcq',
      q: 'In a PLC scan cycle, what happens during the Program Scan phase?',
      opts: [
        'Physical inputs are read into memory',
        'Physical outputs are updated from memory',
        'Ladder logic is executed rung by rung, top to bottom',
        'Timers and counters are reset'
      ],
      ans: 2
    },
    {
      type: 'mcq',
      q: 'When does a TON timer\'s DN (Done) bit become TRUE?',
      opts: [
        'Immediately when the input goes TRUE',
        'When the accumulated time reaches the preset value',
        'When the input goes FALSE',
        'After each scan cycle'
      ],
      ans: 1
    },
    {
      type: 'mcq',
      q: 'What triggers a CTU (Count Up) counter to increment?',
      opts: [
        'Every scan cycle while input is TRUE',
        'Rising edge (FALSE to TRUE) of the count input',
        'Falling edge (TRUE to FALSE) of the count input',
        'When the Done bit is TRUE'
      ],
      ans: 1
    },
    {
      type: 'mcq',
      q: 'What does the Set (Latch) coil do differently from a normal coil?',
      opts: [
        'It turns OFF when the rung loses power',
        'It stays ON even after the rung loses power',
        'It inverts the rung power state',
        'It resets all timers'
      ],
      ans: 1
    },
    {
      type: 'mcq',
      q: 'Why should Stop buttons be physically wired as NC (Normally Closed)?',
      opts: [
        'To make the button easier to press',
        'For fail-safe operation \u2014 a broken wire stops the machine',
        'To save wiring costs',
        'Because NC buttons are cheaper'
      ],
      ans: 1
    },
    {
      type: 'mcq',
      q: 'What happens to a TON timer if the input goes FALSE before the preset is reached?',
      opts: [
        'The timer continues counting',
        'The timer pauses and resumes when input returns',
        'The timer resets to zero',
        'The DN bit goes TRUE immediately'
      ],
      ans: 2
    },
    {
      type: 'mcq',
      q: 'In IEC 61131-3 addressing, what does "M0.5" represent?',
      opts: [
        'Physical input byte 0, bit 5',
        'Physical output byte 0, bit 5',
        'Internal memory byte 0, bit 5',
        'Timer number 5'
      ],
      ans: 2
    },
    {
      type: 'mcq',
      q: 'Contacts in series on a rung implement which Boolean operation?',
      opts: ['OR', 'AND', 'NOT', 'XOR'],
      ans: 1
    },
    {
      type: 'mcq',
      q: 'What is a "seal-in" circuit in PLC programming?',
      opts: [
        'A circuit that prevents unauthorised access',
        'A self-holding circuit that maintains output after momentary input',
        'A circuit that seals pneumatic connections',
        'A circuit that resets all outputs'
      ],
      ans: 1
    },
    /* Scenario / numerical questions */
    {
      type: 'num',
      q: 'A TON timer has PRE = 4000 ms. Input goes TRUE at t=0 and stays TRUE. At what time (ms) does DN become TRUE?',
      ans: 4000,
      tol: 0,
      unit: 'ms'
    },
    {
      type: 'num',
      q: 'A CTU counter has PV = 8. After 12 rising edges on the count input, what is the current value (CV)?',
      ans: 12,
      tol: 0,
      unit: ''
    },
    {
      type: 'num',
      q: 'Three NO contacts are in series. I0.0=TRUE, I0.1=FALSE, I0.2=TRUE. Is the output energised? (1=yes, 0=no)',
      ans: 0,
      tol: 0,
      unit: ''
    },
    {
      type: 'num',
      q: 'A TOF timer has PRE = 3000 ms. Input goes TRUE at t=0, then FALSE at t=2000. At what time (ms) does DN become FALSE?',
      ans: 5000,
      tol: 0,
      unit: 'ms'
    },
    {
      type: 'num',
      q: 'I0.0=TRUE, I0.1=TRUE in parallel (OR), followed by I0.2=FALSE in series (AND). Is the output ON? (1/0)',
      ans: 0,
      tol: 0,
      unit: ''
    }
  ];

  function startQuiz() {
    var shuffled = QUIZ_POOL.slice().sort(function () { return Math.random() - 0.5; });
    quizSet = shuffled.slice(0, QUIZ_SIZE);
    quizIdx = 0;
    quizScore = 0;
    quizAnswered = false;
    quizAnswers = [];
    quizResult.style.display = 'none';
    quizPanel.style.display = '';
    quizBar.style.display = '';
    renderQuizQuestion();
  }

  function renderQuizQuestion() {
    if (quizIdx >= quizSet.length) { showQuizResults(); return; }
    var q = quizSet[quizIdx];
    qbarNum.textContent = quizIdx + 1;
    quizAnswered = false;

    var html = '<p class="q-prompt"><strong>Q' + (quizIdx + 1) + '.</strong> ' + q.q + '</p>';

    if (q.type === 'mcq') {
      html += '<div class="q-options">';
      q.opts.forEach(function (opt, oi) {
        html += '<div class="q-opt" data-idx="' + oi + '">' + opt + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="q-num-input"><input type="number" step="any" id="quiz-num-input" placeholder="Your answer"> <span>' + (q.unit || '') + '</span> <button class="btn btn-primary" id="quiz-num-check">Check</button></div>';
    }

    quizPanel.innerHTML = html;

    if (q.type === 'mcq') {
      quizPanel.querySelectorAll('.q-opt').forEach(function (opt) {
        opt.addEventListener('click', function () {
          if (quizAnswered) return;
          quizAnswered = true;
          var idx = parseInt(opt.dataset.idx);
          var correct = idx === q.ans;
          if (correct) { quizScore++; opt.classList.add('correct'); }
          else {
            opt.classList.add('wrong');
            quizPanel.querySelectorAll('.q-opt')[q.ans].classList.add('correct');
          }
          quizAnswers.push({ q: q.q, correct: correct });
          setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1200);
        });
      });
    } else {
      var numCheck = document.getElementById('quiz-num-check');
      var numInput = document.getElementById('quiz-num-input');
      if (numCheck) {
        numCheck.addEventListener('click', function () {
          if (quizAnswered) return;
          var val = parseFloat(numInput.value);
          if (isNaN(val)) return;
          quizAnswered = true;
          var correct = Math.abs(val - q.ans) <= (q.tol || 0.5);
          if (correct) {
            quizScore++;
            numCheck.textContent = 'Correct!';
            numCheck.style.background = '#3ddc84';
          } else {
            numCheck.textContent = 'Answer: ' + q.ans + ' ' + (q.unit || '');
            numCheck.style.background = '#ff5555';
          }
          quizAnswers.push({ q: q.q, correct: correct });
          setTimeout(function () { quizIdx++; renderQuizQuestion(); }, 1500);
        });
        numInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') numCheck.click(); });
        numInput.focus();
      }
    }
  }

  function showQuizResults() {
    quizPanel.style.display = 'none';
    quizBar.style.display = 'none';
    quizResult.style.display = '';
    var pct = Math.round(quizScore / QUIZ_SIZE * 100);
    var html = '<h3>Quiz Complete!</h3>';
    html += '<div class="score">' + quizScore + ' / ' + QUIZ_SIZE + ' (' + pct + '%)</div>';
    html += '<p style="margin-top:12px;color:#6b7a99;">';
    html += pct >= 80 ? 'Excellent work! You have a strong understanding of PLC ladder logic.' :
            pct >= 60 ? 'Good effort! Review the concepts you missed in Explore mode.' :
            'Keep practising! Use Explore mode to review fundamental concepts.';
    html += '</p>';

    /* Answer review */
    html += '<div style="margin-top:16px;">';
    quizAnswers.forEach(function (a, i) {
      html += '<div style="padding:4px 0;font-size:0.82rem;color:' + (a.correct ? '#7cb342' : '#ff5555') + ';">';
      html += (a.correct ? '\u2713' : '\u2717') + ' Q' + (i + 1) + ': ' + a.q.substring(0, 60) + '...';
      html += '</div>';
    });
    html += '</div>';

    html += '<button class="btn btn-primary" style="margin-top:16px;" id="quiz-retry">Try Again</button>';
    quizResult.innerHTML = html;
    document.getElementById('quiz-retry').addEventListener('click', startQuiz);
  }

  /* ================================================================
     SECTION 16 — USER GUIDE
     ================================================================ */

  (function () {
    var btnGuide = document.getElementById('btn-guide');
    var guideSection = document.getElementById('user-guide');
    if (btnGuide && guideSection) {
      btnGuide.addEventListener('click', function (e) {
        e.preventDefault();
        guideSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  })();

  /* ================================================================
     SECTION 17 — INITIALISATION
     ================================================================ */

  resizeCanvas();
  drawPaletteIcons();

  /* ── Autosave to localStorage (inspired by MakersDeck) ─────────
     Polls every 2s and writes current program if it changed since last write.
     On boot, tries to restore a saved program before falling back to the
     default preset. Key is namespaced per tool. */
  var LS_KEY = 'mechsim.plc-ladder.program.v1';
  var _lastSavedJson = null;

  function serializeProgram() {
    return {
      schema: 4,
      viewMode: viewMode,
      rungs: rungs,
      fbdBlocks: fbdBlocks,
      fbdWires: fbdWires,
      annStrokes: annStrokes,
      annShapes: annShapes,
      viewOffX: viewOffX, viewOffY: viewOffY, viewScale: viewScale,
      inputLabels: inputLabels,
      outputLabels: outputLabels,
      inputKinds: inputKinds,
      registerDefaults: registerDefaults,
      registers: registers,
      activePreset: activePreset
    };
  }

  function autoSave() {
    try {
      var obj = serializeProgram();
      var json = JSON.stringify(obj);
      if (json !== _lastSavedJson) {
        localStorage.setItem(LS_KEY, json);
        _lastSavedJson = json;
      }
    } catch (_) { /* quota / disabled localStorage — silent */ }
  }

  function tryAutoLoad() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return false;
      var obj = JSON.parse(raw);
      if (!obj) return false;
      var hasLadder = Array.isArray(obj.rungs) && obj.rungs.length > 0;
      var hasFbd    = Array.isArray(obj.fbdBlocks) && obj.fbdBlocks.length > 0;
      if (!hasLadder && !hasFbd) return false;
      rungs = obj.rungs || [];
      fbdBlocks = obj.fbdBlocks || [];
      fbdWires  = obj.fbdWires  || [];
      annStrokes = Array.isArray(obj.annStrokes) ? obj.annStrokes : [];
      annShapes  = Array.isArray(obj.annShapes)  ? obj.annShapes  : [];
      viewOffX = (typeof obj.viewOffX === 'number') ? obj.viewOffX : 0;
      viewOffY = (typeof obj.viewOffY === 'number') ? obj.viewOffY : 0;
      viewScale = (typeof obj.viewScale === 'number') ? obj.viewScale : 1;
      viewMode = (obj.viewMode === 'fbd') ? 'fbd' : 'ladder';
      if (Array.isArray(obj.inputLabels))  inputLabels  = obj.inputLabels;
      if (Array.isArray(obj.outputLabels)) outputLabels = obj.outputLabels;
      inputKinds = (obj.inputKinds && typeof obj.inputKinds === 'object') ? obj.inputKinds : {};
      if (obj.registerDefaults && typeof obj.registerDefaults === 'object') {
        for (var rdk in registerDefaults) delete registerDefaults[rdk];
        for (var rdk2 in obj.registerDefaults) registerDefaults[rdk2] = obj.registerDefaults[rdk2];
      }
      if (obj.registers && typeof obj.registers === 'object') {
        for (var rgk in obj.registers) registers[rgk] = obj.registers[rgk];
      }
      activePreset = obj.activePreset || null;
      _lastSavedJson = raw;
      /* Ensure any nextRungId collision doesn't break new-rung creation */
      var maxRungId = 0;
      for (var i = 0; i < rungs.length; i++) if (rungs[i].id > maxRungId) maxRungId = rungs[i].id;
      nextRungId = maxRungId + 1;
      var maxBlockId = 0;
      for (var j = 0; j < fbdBlocks.length; j++) if (fbdBlocks[j].id > maxBlockId) maxBlockId = fbdBlocks[j].id;
      nextFbdBlockId = maxBlockId + 1;
      var maxWireId = 0;
      for (var k = 0; k < fbdWires.length; k++) if (fbdWires[k].id > maxWireId) maxWireId = fbdWires[k].id;
      nextFbdWireId = maxWireId + 1;
      normalizeRungs();
      return true;
    } catch (_) { return false; }
  }

  if (!tryAutoLoad()) {
    buildPreset('motor-start-stop');
    /* Activate first preset pill */
    var firstPill = presetTabs.querySelector('[data-preset="motor-start-stop"]');
    if (firstPill) firstPill.classList.add('active');
  } else {
    /* Highlight the preset pill if the restored program matches a known preset */
    if (activePreset) {
      var pill = presetTabs.querySelector('[data-preset="' + activePreset + '"]');
      if (pill) pill.classList.add('active');
    }
  }

  /* Write every 2 seconds if dirty. Cheap; no string-diff cost on quiet periods. */
  setInterval(autoSave, 2000);
  /* Final flush before unload */
  window.addEventListener('beforeunload', autoSave);

  /* ================================================================
     ANNOTATION SYSTEM — strokes, 7 shape types, text labels
     Ported from tools/pneumatic-circuit/app.js (functions renderStroke,
     renderShape, drawAnnotations, findNearestAnnotation, etc.)
     ================================================================ */

  function drawArrowhead(x, y, angle, size, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size * 0.45); ctx.lineTo(-size, size * 0.45);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore();
  }

  function renderStroke(stroke) {
    var pts = stroke.points;
    if (!pts || pts.length < 2) return;
    var sRot = stroke.rotation || 0;
    if (sRot) {
      var sMinX = Infinity, sMinY = Infinity, sMaxX = -Infinity, sMaxY = -Infinity;
      for (var ri = 0; ri < pts.length; ri++) {
        var rpx = toSX(pts[ri].wx), rpy = toSY(pts[ri].wy);
        if (rpx < sMinX) sMinX = rpx; if (rpy < sMinY) sMinY = rpy;
        if (rpx > sMaxX) sMaxX = rpx; if (rpy > sMaxY) sMaxY = rpy;
      }
      var scx = (sMinX + sMaxX) / 2, scy = (sMinY + sMaxY) / 2;
      ctx.save(); ctx.translate(scx, scy); ctx.rotate(sRot); ctx.translate(-scx, -scy);
    }
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.9;
    /* Detect pressure sensitivity — any point whose p deviates from 0.5 */
    var hasPressure = false;
    for (var k = 0; k < pts.length; k++) {
      if (pts[k].p > 0 && Math.abs(pts[k].p - 0.5) > 0.05) { hasPressure = true; break; }
    }
    if (!hasPressure) {
      ctx.lineWidth = stroke.width;
      ctx.beginPath();
      ctx.moveTo(toSX(pts[0].wx), toSY(pts[0].wy));
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (toSX(pts[i].wx) + toSX(pts[i + 1].wx)) / 2;
        var my = (toSY(pts[i].wy) + toSY(pts[i + 1].wy)) / 2;
        ctx.quadraticCurveTo(toSX(pts[i].wx), toSY(pts[i].wy), mx, my);
      }
      ctx.lineTo(toSX(pts[pts.length - 1].wx), toSY(pts[pts.length - 1].wy));
      ctx.stroke();
    } else {
      for (var j = 1; j < pts.length; j++) {
        var p0 = pts[j - 1], p1 = pts[j];
        ctx.lineWidth = stroke.width * (0.4 + p1.p * 0.8);
        ctx.beginPath();
        ctx.moveTo(toSX(p0.wx), toSY(p0.wy));
        ctx.lineTo(toSX(p1.wx), toSY(p1.wy));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    if (sRot) ctx.restore();
  }

  function renderShape(s) {
    var x1 = toSX(s.wx1), y1 = toSY(s.wy1), x2 = toSX(s.wx2), y2 = toSY(s.wy2);
    var rot = s.rotation || 0;
    if (rot) {
      var rcx = (x1 + x2) / 2, rcy = (y1 + y2) / 2;
      ctx.save(); ctx.translate(rcx, rcy); ctx.rotate(rot); ctx.translate(-rcx, -rcy);
    }
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color; ctx.lineWidth = s.width;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = 0.9;
    var headSize = Math.max(10, s.width * 3);
    switch (s.type) {
      case 'line':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); break;
      case 'arrow':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        drawArrowhead(x2, y2, Math.atan2(y2 - y1, x2 - x1), headSize, s.color); break;
      case 'dblarrow':
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        drawArrowhead(x2, y2, Math.atan2(y2 - y1, x2 - x1), headSize, s.color);
        drawArrowhead(x1, y1, Math.atan2(y1 - y2, x1 - x2), headSize, s.color); break;
      case 'rect':
        var rx = Math.min(x1, x2), ry = Math.min(y1, y2),
            rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fillRect(rx, ry, rw, rh); ctx.globalAlpha = 0.9; }
        ctx.strokeRect(rx, ry, rw, rh); break;
      case 'circle':
        var cdx = x2 - x1, cdy = y2 - y1, radius = Math.sqrt(cdx * cdx + cdy * cdy);
        ctx.beginPath(); ctx.arc(x1, y1, radius, 0, Math.PI * 2);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 0.9; }
        ctx.stroke(); break;
      case 'ellipse':
        var ecx = (x1 + x2) / 2, ecy = (y1 + y2) / 2,
            erx = Math.abs(x2 - x1) / 2, ery = Math.abs(y2 - y1) / 2;
        if (erx < 1 || ery < 1) break;
        ctx.beginPath(); ctx.ellipse(ecx, ecy, erx, ery, 0, 0, Math.PI * 2);
        if (s.filled) { ctx.globalAlpha = 0.15; ctx.fill(); ctx.globalAlpha = 0.9; }
        ctx.stroke(); break;
      case 'text':
        if (!s.text) break;
        var tbW = Math.abs(x2 - x1), tbH = Math.abs(y2 - y1);
        if (tbW < 4) tbW = 60; if (tbH < 4) tbH = 22;
        var fontSize = Math.max(8, Math.round(tbH * 0.64));
        ctx.font = 'bold ' + fontSize + 'px ' + _fontFamily;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        var tbX = Math.min(x1, x2), tbY = Math.min(y1, y2);
        ctx.fillStyle = 'rgba(13,17,23,0.85)'; ctx.strokeStyle = s.color; ctx.lineWidth = 1;
        ctx.fillRect(tbX, tbY, tbW, tbH);
        ctx.strokeRect(tbX, tbY, tbW, tbH);
        ctx.fillStyle = s.color;
        ctx.fillText(s.text, tbX + 6, tbY + (tbH - fontSize) / 2);
        break;
    }
    ctx.globalAlpha = 1;
    if (rot) ctx.restore();
  }

  function drawAnnotations() {
    if (!showAnnotations) return;
    for (var i = 0; i < annStrokes.length; i++) renderStroke(annStrokes[i]);
    if (annActiveStroke) renderStroke(annActiveStroke);
    for (var j = 0; j < annShapes.length; j++) renderShape(annShapes[j]);
    if (annActiveShape) renderShape(annActiveShape);
    /* Selection indicator (corners + action buttons) */
    drawSelectionIndicator();
    /* Cursor dot preview (sketch/shape hover) */
    if (annCursorPos && (annTool === 'sketch' || annTool === 'shape')) {
      var color = annTool === 'sketch' ? sketchColor : shapeColor;
      var size = annTool === 'sketch' ? sketchWidth : shapeWidth;
      var r = Math.max(3, size);
      ctx.beginPath(); ctx.arc(annCursorPos.x, annCursorPos.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.globalAlpha = 0.6; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5; ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function distToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    var cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
  }

  function findNearestAnnotation(sx, sy) {
    var threshold = 15, best = null, bestDist = threshold;
    /* Shapes (topmost wins) */
    for (var i = annShapes.length - 1; i >= 0; i--) {
      var s = annShapes[i];
      var x1 = toSX(s.wx1), y1 = toSY(s.wy1), x2 = toSX(s.wx2), y2 = toSY(s.wy2);
      var d = Infinity;
      switch (s.type) {
        case 'line': case 'arrow': case 'dblarrow':
          d = distToSegment(sx, sy, x1, y1, x2, y2); break;
        case 'rect':
          var rx = Math.min(x1, x2), ry = Math.min(y1, y2),
              rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
          if (sx >= rx - threshold && sx <= rx + rw + threshold && sy >= ry - threshold && sy <= ry + rh + threshold) {
            d = Math.min(Math.abs(sx - rx), Math.abs(sx - rx - rw), Math.abs(sy - ry), Math.abs(sy - ry - rh));
            if (s.filled && sx >= rx && sx <= rx + rw && sy >= ry && sy <= ry + rh) d = 0;
          } break;
        case 'circle':
          var cr = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
          var cd = Math.sqrt((sx - x1) * (sx - x1) + (sy - y1) * (sy - y1));
          d = Math.abs(cd - cr); if (s.filled && cd <= cr) d = 0; break;
        case 'ellipse':
          var eex = (x1 + x2) / 2, eey = (y1 + y2) / 2,
              eerx = Math.abs(x2 - x1) / 2, eery = Math.abs(y2 - y1) / 2;
          if (eerx > 0 && eery > 0) {
            var enorm = Math.sqrt(((sx - eex) * (sx - eex)) / (eerx * eerx) + ((sy - eey) * (sy - eey)) / (eery * eery));
            d = Math.abs(enorm - 1) * Math.min(eerx, eery);
            if (s.filled && enorm <= 1) d = 0;
          } break;
        case 'text':
          var ttx = Math.min(x1, x2), tty = Math.min(y1, y2),
              ttw = Math.abs(x2 - x1), tth = Math.abs(y2 - y1);
          if (ttw < 4) { ttw = 60; tth = 22; }
          if (sx >= ttx - 4 && sx <= ttx + ttw + 4 && sy >= tty - 4 && sy <= tty + tth + 4) d = 0;
          break;
      }
      if (d < bestDist) { bestDist = d; best = { type: 'shape', idx: i }; }
    }
    /* Strokes */
    for (var k = annStrokes.length - 1; k >= 0; k--) {
      var spts = annStrokes[k].points;
      for (var m = 1; m < spts.length; m++) {
        var sd = distToSegment(sx, sy, toSX(spts[m - 1].wx), toSY(spts[m - 1].wy), toSX(spts[m].wx), toSY(spts[m].wy));
        if (sd < bestDist) { bestDist = sd; best = { type: 'stroke', idx: k }; break; }
      }
    }
    return best;
  }

  function setAnnTool(t) {
    if (panMode) setPanMode(false);
    annTool = t;
    annSelectedIdx = -1; annSelectedType = '';
    annActiveStroke = null; annActiveShape = null;
    selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
    var btns = document.querySelectorAll('#mark-bar .tool-btn[data-tool]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-tool') === t);
    }
    if (t === 'sketch') cvs.style.cursor = PENCIL_CURSOR;
    else if (t === 'shape') cvs.style.cursor = 'crosshair';
    else cvs.style.cursor = '';
    draw();
  }

  function deleteSelectedAnnotation() {
    if (annSelectedIdx < 0) return;
    saveUndo();
    if (annSelectedType === 'shape') annShapes.splice(annSelectedIdx, 1);
    else annStrokes.splice(annSelectedIdx, 1);
    annSelectedIdx = -1; annSelectedType = '';
    draw();
  }

  function createTextLabel(sx, sy) {
    var inp = document.getElementById('shape-text-input');
    if (!inp) return;
    var rect = cvs.getBoundingClientRect();
    var sfX = rect.width / W, sfY = rect.height / H;
    inp.style.display = 'block';
    /* Position relative to canvas-card (absolute) — canvas-card is the offsetParent */
    inp.style.left = (sx * sfX) + 'px';
    inp.style.top  = (sy * sfY) + 'px';
    inp.value = ''; inp.focus();
    var committed = false;
    function commit() {
      if (committed) return; committed = true;
      var txt = inp.value.trim();
      inp.style.display = 'none';
      inp.removeEventListener('keydown', onKey);
      inp.removeEventListener('blur', commit);
      document.removeEventListener('pointerdown', onOutside, true);
      if (!txt) { setAnnTool('move'); return; }
      saveUndo();
      var wx = toWX(sx), wy = toWY(sy);
      ctx.font = 'bold 14px ' + _fontFamily;
      var tw = ctx.measureText(txt).width + 16;
      annShapes.push({
        type: 'text', wx1: wx, wy1: wy,
        wx2: wx + tw / viewScale, wy2: wy + 24 / viewScale,
        color: shapeColor, width: shapeWidth, filled: false, rotation: 0, text: txt
      });
      setAnnTool('move'); draw();
    }
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { inp.value = ''; commit(); }
    }
    function onOutside(e) { if (e.target !== inp) commit(); }
    inp.addEventListener('keydown', onKey);
    inp.addEventListener('blur', commit);
    document.addEventListener('pointerdown', onOutside, true);
  }

  /* ──────────────────────────────────────────────────────────────
     1:1 port of pneumatic annotation handlers — supports:
       • selection + drag to move
       • 4 corner handles to resize (nw/ne/se/sw)
       • floating Delete / Duplicate / Rotate buttons above selection
       • dynamic cursor (nwse-resize, nesw-resize, move, pointer, pencil)
       • double-click to edit text
       • shape auto-resets to 'move' after placement; sketch stays active
       • pressure-sensitive stroke drawing + pointer capture
       • Escape cancels active stroke/shape; click-outside commits text
     ────────────────────────────────────────────────────────────── */

  /* Pencil SVG cursor used while sketch tool is active */
  var PENCIL_CURSOR = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3Cpath d='M20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%23fff' stroke='%23000' stroke-width='.8'/%3E%3C/svg%3E\") 2 22, crosshair";

  /* Selection UI hitbox cache (populated by drawSelectionIndicator) */
  var selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
  var lockIconPositions = false;

  /* ── Geometry helpers ── */
  function rotatePoint(px, py, cx, cy, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var dx = px - cx, dy = py - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }
  function unrotatePoint(px, py, cx, cy, angle) {
    if (!angle) return { x: px, y: py };
    return rotatePoint(px, py, cx, cy, -angle);
  }
  function pointInPolygon(px, py, corners) {
    if (!corners || corners.length < 3) return false;
    var n = corners.length, inside = true;
    for (var i = 0, j = n - 1; i < n; j = i++) {
      var cross = (corners[i].x - corners[j].x) * (py - corners[j].y) -
                  (corners[i].y - corners[j].y) * (px - corners[j].x);
      if (i === 0) inside = cross >= 0;
      else if ((cross >= 0) !== inside) return false;
    }
    return true;
  }

  /* Compute rotated bounding box + 4 corners for current selection */
  function getSelectionBounds() {
    if (annSelectedIdx < 0) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var rot = 0, corners = null;
    if (annSelectedType === 'shape') {
      var s = annShapes[annSelectedIdx]; if (!s) return null;
      rot = s.rotation || 0;
      var sx1 = toSX(s.wx1), sy1 = toSY(s.wy1), sx2 = toSX(s.wx2), sy2 = toSY(s.wy2);
      var lMinX, lMinY, lMaxX, lMaxY;
      if (s.type === 'circle') {
        var r = Math.sqrt((sx2 - sx1) * (sx2 - sx1) + (sy2 - sy1) * (sy2 - sy1));
        lMinX = sx1 - r; lMinY = sy1 - r; lMaxX = sx1 + r; lMaxY = sy1 + r;
      } else {
        lMinX = Math.min(sx1, sx2); lMinY = Math.min(sy1, sy2);
        lMaxX = Math.max(sx1, sx2); lMaxY = Math.max(sy1, sy2);
      }
      var pad = 6; lMinX -= pad; lMinY -= pad; lMaxX += pad; lMaxY += pad;
      var cx = (lMinX + lMaxX) / 2, cy = (lMinY + lMaxY) / 2;
      corners = [
        rotatePoint(lMinX, lMinY, cx, cy, rot),
        rotatePoint(lMaxX, lMinY, cx, cy, rot),
        rotatePoint(lMaxX, lMaxY, cx, cy, rot),
        rotatePoint(lMinX, lMaxY, cx, cy, rot)
      ];
      for (var ci = 0; ci < 4; ci++) {
        if (corners[ci].x < minX) minX = corners[ci].x;
        if (corners[ci].y < minY) minY = corners[ci].y;
        if (corners[ci].x > maxX) maxX = corners[ci].x;
        if (corners[ci].y > maxY) maxY = corners[ci].y;
      }
    } else if (annSelectedType === 'stroke') {
      var st = annStrokes[annSelectedIdx]; if (!st) return null;
      rot = st.rotation || 0;
      var pts = st.points;
      var lMinXs = Infinity, lMinYs = Infinity, lMaxXs = -Infinity, lMaxYs = -Infinity;
      for (var pi = 0; pi < pts.length; pi++) {
        var spx = toSX(pts[pi].wx), spy = toSY(pts[pi].wy);
        if (spx < lMinXs) lMinXs = spx; if (spy < lMinYs) lMinYs = spy;
        if (spx > lMaxXs) lMaxXs = spx; if (spy > lMaxYs) lMaxYs = spy;
      }
      var padS = 8; lMinXs -= padS; lMinYs -= padS; lMaxXs += padS; lMaxYs += padS;
      var scx = (lMinXs + lMaxXs) / 2, scy = (lMinYs + lMaxYs) / 2;
      corners = [
        rotatePoint(lMinXs, lMinYs, scx, scy, rot),
        rotatePoint(lMaxXs, lMinYs, scx, scy, rot),
        rotatePoint(lMaxXs, lMaxYs, scx, scy, rot),
        rotatePoint(lMinXs, lMaxYs, scx, scy, rot)
      ];
      for (var cj = 0; cj < 4; cj++) {
        if (corners[cj].x < minX) minX = corners[cj].x;
        if (corners[cj].y < minY) minY = corners[cj].y;
        if (corners[cj].x > maxX) maxX = corners[cj].x;
        if (corners[cj].y > maxY) maxY = corners[cj].y;
      }
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY, rotation: rot,
             cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, corners: corners };
  }

  function hitCorner(sx, sy, b) {
    if (!b || !b.corners) return null;
    var t = 12, labels = ['nw', 'ne', 'se', 'sw'];
    for (var ci = 0; ci < 4; ci++) {
      if (Math.abs(sx - b.corners[ci].x) < t && Math.abs(sy - b.corners[ci].y) < t) return labels[ci];
    }
    return null;
  }

  function hitBtn(sx, sy, btn) {
    if (!btn) return false;
    return sx >= btn.x && sx <= btn.x + btn.w && sy >= btn.y && sy <= btn.y + btn.h;
  }

  /* Selection indicator — dashed outline, 4 corner handles, 3 action buttons */
  function drawSelectionIndicator() {
    var b = getSelectionBounds();
    if (!b) { selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null }; return; }
    selectionUI.box = b;
    var c = b.corners;
    /* Dashed selection polygon (follows rotation) */
    ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 3]); ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(c[0].x, c[0].y);
    ctx.lineTo(c[1].x, c[1].y); ctx.lineTo(c[2].x, c[2].y); ctx.lineTo(c[3].x, c[3].y);
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]);
    /* Corner squares */
    var hs = 5; ctx.fillStyle = '#4fc3f7'; ctx.globalAlpha = 1;
    for (var chi = 0; chi < 4; chi++) ctx.fillRect(c[chi].x - hs, c[chi].y - hs, hs * 2, hs * 2);
    /* Action icons above (or below if no room) */
    var iconSize = 24, gap = 6, totalW = iconSize * 3 + gap * 2;
    var icX, icY;
    if (lockIconPositions && selectionUI.deleteBtn) {
      icX = selectionUI.deleteBtn.x; icY = selectionUI.deleteBtn.y;
    } else {
      icX = (b.minX + b.maxX) / 2 - totalW / 2;
      icY = b.minY - iconSize - 8;
      if (icY < 2) icY = b.maxY + 8;
    }
    ctx.font = '12px ' + _fontFamily; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    /* Delete */
    var delBtn = { x: icX, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#ff6b6b'; ctx.lineWidth = 1;
    roundRectA(delBtn.x, delBtn.y, delBtn.w, delBtn.h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff6b6b';
    ctx.fillText('\u2716', delBtn.x + iconSize / 2, delBtn.y + iconSize / 2 + 1);
    selectionUI.deleteBtn = delBtn;
    /* Duplicate */
    var dupBtn = { x: icX + iconSize + gap, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#4fc3f7'; ctx.lineWidth = 1;
    roundRectA(dupBtn.x, dupBtn.y, dupBtn.w, dupBtn.h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText('\u2750', dupBtn.x + iconSize / 2, dupBtn.y + iconSize / 2 + 1);
    selectionUI.dupBtn = dupBtn;
    /* Rotate */
    var rotBtn = { x: icX + (iconSize + gap) * 2, y: icY, w: iconSize, h: iconSize };
    ctx.fillStyle = 'rgba(13,17,23,0.9)'; ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 1;
    roundRectA(rotBtn.x, rotBtn.y, rotBtn.w, rotBtn.h, 5); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#a78bfa';
    ctx.fillText('\u21BB', rotBtn.x + iconSize / 2, rotBtn.y + iconSize / 2 + 1);
    selectionUI.rotateBtn = rotBtn;
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }

  function roundRectA(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }

  /* Delete / Duplicate / Rotate selected annotation */
  function deleteSelectedAnnotation() {
    if (annSelectedIdx < 0) return;
    saveUndo();
    if (annSelectedType === 'shape') annShapes.splice(annSelectedIdx, 1);
    else if (annSelectedType === 'stroke') annStrokes.splice(annSelectedIdx, 1);
    annSelectedIdx = -1; annSelectedType = '';
    selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
    draw();
  }
  function duplicateSelectedAnnotation() {
    if (annSelectedIdx < 0) return;
    saveUndo();
    var offset = 20 / viewScale;
    if (annSelectedType === 'shape') {
      var orig = annShapes[annSelectedIdx]; if (!orig) return;
      var dup = JSON.parse(JSON.stringify(orig));
      dup.wx1 += offset; dup.wy1 += offset; dup.wx2 += offset; dup.wy2 += offset;
      annShapes.push(dup); annSelectedIdx = annShapes.length - 1;
    } else if (annSelectedType === 'stroke') {
      var origS = annStrokes[annSelectedIdx]; if (!origS) return;
      var dupS = JSON.parse(JSON.stringify(origS));
      for (var i = 0; i < dupS.points.length; i++) { dupS.points[i].wx += offset; dupS.points[i].wy += offset; }
      annStrokes.push(dupS); annSelectedIdx = annStrokes.length - 1;
    }
    draw();
  }
  function rotateSelectedAnnotation() {
    if (annSelectedIdx < 0) return;
    saveUndo();
    if (annSelectedType === 'shape') {
      var s = annShapes[annSelectedIdx];
      if (s) s.rotation = ((s.rotation || 0) + Math.PI / 12) % (Math.PI * 2);
    } else if (annSelectedType === 'stroke') {
      var st = annStrokes[annSelectedIdx];
      if (st) st.rotation = ((st.rotation || 0) + Math.PI / 12) % (Math.PI * 2);
    }
    lockIconPositions = true; draw(); lockIconPositions = false;
  }

  /* Edit an existing text shape via double-click */
  function editTextShape(idx, shape) {
    var sx = toSX(shape.wx1), sy = toSY(shape.wy1);
    var inp = document.getElementById('shape-text-input');
    if (!inp) return;
    var rect = cvs.getBoundingClientRect();
    var sfX = rect.width / W, sfY = rect.height / H;
    inp.style.display = 'block';
    inp.style.left = (sx * sfX) + 'px';
    inp.style.top  = (sy * sfY) + 'px';
    inp.value = shape.text || ''; inp.focus(); inp.select();
    var committed = false;
    function commit() {
      if (committed) return; committed = true;
      var txt = inp.value.trim();
      inp.style.display = 'none';
      inp.removeEventListener('keydown', onKey);
      inp.removeEventListener('blur', commit);
      document.removeEventListener('pointerdown', onOutside, true);
      if (txt) {
        saveUndo();
        shape.text = txt;
        ctx.font = 'bold 14px ' + _fontFamily;
        var tw = ctx.measureText(txt).width + 16;
        shape.wx2 = shape.wx1 + tw / viewScale;
      }
      draw();
    }
    function onKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { inp.value = shape.text || ''; commit(); }
    }
    function onOutside(e) { if (e.target !== inp) commit(); }
    inp.addEventListener('keydown', onKey);
    inp.addEventListener('blur', commit);
    document.addEventListener('pointerdown', onOutside, true);
  }

  /* Canvas pointer handlers — pointer capture + comprehensive selection UX */
  cvs.addEventListener('pointerdown', function (e) {
    /* Pan owns the drag while pan mode is on — don't start a selection or
       stroke underneath it. */
    if (panMode) return;
    var pos = getCanvasPos(e);
    annCursorPos = pos;

    /* Move tool — action buttons, corner handles, body drag, then fallthrough */
    if (annTool === 'move') {
      /* 1) Action buttons on current selection */
      if (hitBtn(pos.x, pos.y, selectionUI.deleteBtn)) { deleteSelectedAnnotation(); e.preventDefault(); e.stopPropagation(); return; }
      if (hitBtn(pos.x, pos.y, selectionUI.dupBtn))    { duplicateSelectedAnnotation(); e.preventDefault(); e.stopPropagation(); return; }
      if (hitBtn(pos.x, pos.y, selectionUI.rotateBtn)) { rotateSelectedAnnotation(); e.preventDefault(); e.stopPropagation(); return; }

      /* 2) Corner handle → resize */
      var bounds = getSelectionBounds();
      var corner = hitCorner(pos.x, pos.y, bounds);
      if (corner) {
        annDrag = { type: annSelectedType, idx: annSelectedIdx, corner: corner,
                    lastWx: toWX(pos.x), lastWy: toWY(pos.y) };
        try { cvs.setPointerCapture(e.pointerId); } catch(_){}
        e.preventDefault(); e.stopPropagation(); return;
      }

      /* 3) Body of selected → move-drag */
      if (bounds && bounds.corners && pointInPolygon(pos.x, pos.y, bounds.corners)) {
        annDrag = { type: annSelectedType, idx: annSelectedIdx, corner: null,
                    lastWx: toWX(pos.x), lastWy: toWY(pos.y) };
        try { cvs.setPointerCapture(e.pointerId); } catch(_){}
        e.preventDefault(); e.stopPropagation(); return;
      }

      /* 4) Hit an unselected annotation → select + start drag */
      var hit = findNearestAnnotation(pos.x, pos.y);
      if (hit) {
        annSelectedIdx = hit.idx; annSelectedType = hit.type;
        fbdSelectedBlockId = null; fbdSelectedWireId = null; selectedElement = null;
        hideProperties();
        annDrag = { type: hit.type, idx: hit.idx, corner: null,
                    lastWx: toWX(pos.x), lastWy: toWY(pos.y) };
        try { cvs.setPointerCapture(e.pointerId); } catch(_){}
        draw();
        e.preventDefault(); e.stopPropagation(); return;
      }

      /* 5) Empty click → deselect */
      if (annSelectedIdx >= 0) {
        annSelectedIdx = -1; annSelectedType = '';
        selectionUI = { box: null, corners: null, deleteBtn: null, dupBtn: null, rotateBtn: null };
        draw();
      }
      return;  /* Fall through for FBD/ladder handlers below */
    }

    /* Sketch tool — begin stroke with pressure sensitivity + capture */
    if (annTool === 'sketch') {
      saveUndo();
      annActiveStroke = {
        points: [{ wx: toWX(pos.x), wy: toWY(pos.y), p: (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.5 }],
        color: sketchColor, width: sketchWidth, rotation: 0
      };
      try { cvs.setPointerCapture(e.pointerId); } catch(_){}
      e.preventDefault(); e.stopPropagation(); return;
    }

    /* Shape tool — begin shape preview, or open text input */
    if (annTool === 'shape') {
      if (shapeType === 'text') {
        createTextLabel(pos.x, pos.y);
        e.preventDefault(); e.stopPropagation(); return;
      }
      var wx = toWX(pos.x), wy = toWY(pos.y);
      annActiveShape = { type: shapeType, wx1: wx, wy1: wy, wx2: wx, wy2: wy,
                         color: shapeColor, width: shapeWidth, filled: shapeFilled, rotation: 0 };
      try { cvs.setPointerCapture(e.pointerId); } catch(_){}
      e.preventDefault(); e.stopPropagation(); return;
    }
  }, true);

  cvs.addEventListener('pointermove', function (e) {
    var pos = getCanvasPos(e);
    annCursorPos = pos;

    /* Drag (move/resize of selection) */
    if (annDrag) {
      var nowWx = toWX(pos.x), nowWy = toWY(pos.y);
      if (annDrag.corner) {
        if (annDrag.type === 'shape') {
          var rsh = annShapes[annDrag.idx];
          if (rsh) {
            var c = annDrag.corner;
            if (c === 'nw')      { rsh.wx1 = nowWx; rsh.wy1 = nowWy; }
            else if (c === 'ne') { rsh.wx2 = nowWx; rsh.wy1 = nowWy; }
            else if (c === 'sw') { rsh.wx1 = nowWx; rsh.wy2 = nowWy; }
            else if (c === 'se') { rsh.wx2 = nowWx; rsh.wy2 = nowWy; }
          }
        } else if (annDrag.type === 'stroke') {
          /* Stroke corner-resize: scale all points around selection centre */
          var rst = annStrokes[annDrag.idx];
          if (rst && rst.points.length > 1) {
            /* Simple approach: compute current bbox in world coords, then scale points relative to it */
            var wMinX = Infinity, wMinY = Infinity, wMaxX = -Infinity, wMaxY = -Infinity;
            for (var i = 0; i < rst.points.length; i++) {
              if (rst.points[i].wx < wMinX) wMinX = rst.points[i].wx;
              if (rst.points[i].wy < wMinY) wMinY = rst.points[i].wy;
              if (rst.points[i].wx > wMaxX) wMaxX = rst.points[i].wx;
              if (rst.points[i].wy > wMaxY) wMaxY = rst.points[i].wy;
            }
            var cc = annDrag.corner;
            var targetMinX = wMinX, targetMinY = wMinY, targetMaxX = wMaxX, targetMaxY = wMaxY;
            if (cc === 'nw')      { targetMinX = nowWx; targetMinY = nowWy; }
            else if (cc === 'ne') { targetMaxX = nowWx; targetMinY = nowWy; }
            else if (cc === 'sw') { targetMinX = nowWx; targetMaxY = nowWy; }
            else if (cc === 'se') { targetMaxX = nowWx; targetMaxY = nowWy; }
            var sxR = (targetMaxX - targetMinX) / Math.max(0.001, wMaxX - wMinX);
            var syR = (targetMaxY - targetMinY) / Math.max(0.001, wMaxY - wMinY);
            for (var j = 0; j < rst.points.length; j++) {
              rst.points[j].wx = targetMinX + (rst.points[j].wx - wMinX) * sxR;
              rst.points[j].wy = targetMinY + (rst.points[j].wy - wMinY) * syR;
            }
          }
        }
      } else {
        /* Move drag */
        var dwx = nowWx - annDrag.lastWx, dwy = nowWy - annDrag.lastWy;
        annDrag.lastWx = nowWx; annDrag.lastWy = nowWy;
        if (annDrag.type === 'shape') {
          var ms = annShapes[annDrag.idx];
          if (ms) { ms.wx1 += dwx; ms.wy1 += dwy; ms.wx2 += dwx; ms.wy2 += dwy; }
        } else if (annDrag.type === 'stroke') {
          var mst = annStrokes[annDrag.idx];
          if (mst) { for (var k = 0; k < mst.points.length; k++) { mst.points[k].wx += dwx; mst.points[k].wy += dwy; } }
        }
      }
      draw();
      e.stopPropagation();
      return;
    }

    /* Active stroke — extend */
    if (annActiveStroke) {
      annActiveStroke.points.push({ wx: toWX(pos.x), wy: toWY(pos.y),
                                    p: (typeof e.pressure === 'number' && e.pressure > 0) ? e.pressure : 0.5 });
      draw();
      e.stopPropagation();
      return;
    }

    /* Active shape — resize preview */
    if (annActiveShape) {
      annActiveShape.wx2 = toWX(pos.x);
      annActiveShape.wy2 = toWY(pos.y);
      draw();
      e.stopPropagation();
      return;
    }

    /* Hover cursor — only in move tool, outside of pan mode */
    if (annTool === 'move' && !panMode) {
      var hBounds = getSelectionBounds();
      var hCorner = hitCorner(pos.x, pos.y, hBounds);
      if (hCorner) {
        cvs.style.cursor = (hCorner === 'nw' || hCorner === 'se') ? 'nwse-resize' : 'nesw-resize';
      } else if (hitBtn(pos.x, pos.y, selectionUI.deleteBtn) ||
                 hitBtn(pos.x, pos.y, selectionUI.dupBtn) ||
                 hitBtn(pos.x, pos.y, selectionUI.rotateBtn)) {
        cvs.style.cursor = 'pointer';
      } else if (hBounds && hBounds.corners && pointInPolygon(pos.x, pos.y, hBounds.corners)) {
        cvs.style.cursor = 'move';
      } else if (findNearestAnnotation(pos.x, pos.y)) {
        cvs.style.cursor = 'move';
      } else {
        /* Fall through to ladder element hover: 'pointer' over toggleable
           input contacts while running, 'move' over placed elements.
           (FBD hover sets its own cursor in _fbdPointerMove.) */
        cvs.style.cursor = _elementHoverCursor(pos);
      }
    }

    /* Redraw cursor dot preview for sketch/shape hover */
    if (annTool === 'sketch' || annTool === 'shape') draw();
  }, true);

  cvs.addEventListener('pointerup', function (e) {
    try { cvs.releasePointerCapture(e.pointerId); } catch(_){}

    if (annDrag) { annDrag = null; return; }

    if (annActiveStroke) {
      if (annActiveStroke.points.length > 1) annStrokes.push(annActiveStroke);
      annActiveStroke = null;
      /* Sketch stays active — restore pencil cursor */
      cvs.style.cursor = PENCIL_CURSOR;
      draw();
      e.stopPropagation();
      return;
    }

    if (annActiveShape) {
      var sdx = toSX(annActiveShape.wx2) - toSX(annActiveShape.wx1);
      var sdy = toSY(annActiveShape.wy2) - toSY(annActiveShape.wy1);
      if (Math.abs(sdx) > 3 || Math.abs(sdy) > 3) {
        saveUndo();
        annShapes.push(annActiveShape);
      }
      annActiveShape = null;
      /* Shape auto-resets to 'move' — single-use pneumatic convention */
      setAnnTool('move');
      draw();
      e.stopPropagation();
      return;
    }
  }, true);

  cvs.addEventListener('pointerleave', function () { annCursorPos = null; draw(); });

  /* Double-click: edit an existing text annotation, otherwise open the
     properties modal for the ladder instruction / FBD block underneath. */
  cvs.addEventListener('dblclick', function (e) {
    if (annTool !== 'move' || panMode) return;
    var dp = getCanvasPos(e);
    var hit = findNearestAnnotation(dp.x, dp.y);
    if (hit && hit.type === 'shape') {
      var sh = annShapes[hit.idx];
      if (sh && sh.type === 'text') { editTextShape(hit.idx, sh); return; }
    }
    if (mode !== 'simulate') return;

    if (viewMode === 'fbd') {
      var wp = getCanvasWorldPos(e);
      var blk = _fbdPointToBlock(wp.x, wp.y);
      if (blk) {
        fbdSelectedBlockId = blk.id; fbdSelectedWireId = null;
        selectedElement = blk; updateProperties();
        openPropsModal(blk, true);
      }
      return;
    }

    var lp = getLadderPos(e);
    var cell = getCellAt(lp.x, lp.y);
    if (!cell) return;
    var el = getElementAt(cell.rungIdx, cell.col, cell.row);
    if (el) {
      selectedElement = el; selectedCell = cell;
      updateProperties();
      openPropsModal(el, false);
    }
  });

  /* Escape cancels active stroke/shape */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (annActiveStroke) { annActiveStroke = null; draw(); }
      if (annActiveShape)  { annActiveShape = null; draw(); }
    }
  });

  /* Wire mark-bar buttons */
  (function () {
    var mb = document.getElementById('mark-bar');
    if (!mb) return;
    mb.addEventListener('click', function (e) {
      var btn = e.target.closest('.tool-btn[data-tool]');
      if (btn) {
        var t = btn.getAttribute('data-tool');
        /* Clicking the already-active tool turns it OFF, back to move/select.
           'move' is itself the neutral state, so it never toggles off.
           (Shape and text already auto-reset to move after one use — that
           single-use behaviour is left alone.) */
        if (t !== 'move' && annTool === t) { setAnnTool('move'); return; }
        setAnnTool(t);
        return;
      }
      /* Dropdown toggles */
      if (e.target.closest('#sketch-drop-toggle')) {
        var dd = document.getElementById('sketch-dropdown');
        var visible = dd.style.display !== 'none';
        dd.style.display = visible ? 'none' : '';
        if (!visible) {
          var r = e.target.getBoundingClientRect();
          dd.style.left = r.left + 'px'; dd.style.top = (r.bottom + 4) + 'px';
        }
        var sd = document.getElementById('shape-dropdown');
        if (sd) sd.style.display = 'none';
        return;
      }
      if (e.target.closest('#shape-drop-toggle')) {
        var sdd = document.getElementById('shape-dropdown');
        var sv = sdd.style.display !== 'none';
        sdd.style.display = sv ? 'none' : '';
        if (!sv) {
          var r2 = e.target.getBoundingClientRect();
          sdd.style.left = r2.left + 'px'; sdd.style.top = (r2.bottom + 4) + 'px';
        }
        var skd = document.getElementById('sketch-dropdown');
        if (skd) skd.style.display = 'none';
        return;
      }
      if (e.target.id === 'btn-clear-annotations') {
        document.getElementById('clear-ann-confirm').style.display = '';
        return;
      }
      if (e.target.id === 'btn-toggle-annotations') {
        showAnnotations = !showAnnotations;
        e.target.classList.toggle('active', !showAnnotations);
        draw();
        return;
      }
    });
  })();

  /* Sketch dropdown colour / width */
  (function () {
    var dd = document.getElementById('sketch-dropdown');
    if (!dd) return;
    dd.addEventListener('click', function (e) {
      var sw = e.target.closest('.swatch');
      if (sw) {
        sketchColor = sw.getAttribute('data-color');
        dd.querySelectorAll('.swatch').forEach(function (s) { s.classList.remove('active'); });
        sw.classList.add('active');
      }
      var wb = e.target.closest('.width-btn');
      if (wb) {
        sketchWidth = parseInt(wb.getAttribute('data-width'), 10) || 2;
        dd.querySelectorAll('.width-btn').forEach(function (w) { w.classList.remove('active'); });
        wb.classList.add('active');
      }
    });
  })();

  /* Shape dropdown: shape picker / colour / width / fill */
  (function () {
    var dd = document.getElementById('shape-dropdown');
    if (!dd) return;
    dd.addEventListener('click', function (e) {
      var sp = e.target.closest('.shape-pick');
      if (sp) {
        shapeType = sp.getAttribute('data-shape');
        dd.querySelectorAll('.shape-pick').forEach(function (x) { x.classList.remove('active'); });
        sp.classList.add('active');
        var icon = document.getElementById('shape-icon');
        if (icon) icon.textContent = sp.textContent;
        setAnnTool('shape');
      }
      var sw = e.target.closest('.shape-colors .swatch');
      if (sw) {
        shapeColor = sw.getAttribute('data-color');
        dd.querySelectorAll('.shape-colors .swatch').forEach(function (s) { s.classList.remove('active'); });
        sw.classList.add('active');
      }
      var wb = e.target.closest('.shape-widths .width-btn');
      if (wb) {
        shapeWidth = parseInt(wb.getAttribute('data-width'), 10) || 2;
        dd.querySelectorAll('.shape-widths .width-btn').forEach(function (w) { w.classList.remove('active'); });
        wb.classList.add('active');
      }
      var fb = e.target.closest('.fill-btn');
      if (fb) {
        shapeFilled = fb.getAttribute('data-fill') === 'true';
        dd.querySelectorAll('.fill-btn').forEach(function (f) { f.classList.remove('active'); });
        fb.classList.add('active');
      }
    });
  })();

  /* Clear-annotations dialog */
  (function () {
    var yes = document.getElementById('clear-ann-yes');
    var no = document.getElementById('clear-ann-no');
    var ov = document.getElementById('clear-ann-confirm');
    var sel = document.getElementById('clear-ann-category');
    if (!yes || !no || !ov) return;
    no.addEventListener('click', function () { ov.style.display = 'none'; });
    yes.addEventListener('click', function () {
      saveUndo();
      var cat = sel.value;
      if (cat === 'all' || cat === 'sketches') annStrokes = [];
      if (cat === 'all' || cat === 'shapes') annShapes = [];
      annSelectedIdx = -1; annSelectedType = '';
      ov.style.display = 'none';
      draw();
    });
  })();

  /* Graph toolbar buttons */
  (function () {
    var zi = document.getElementById('btn-zoom-in');
    var zo = document.getElementById('btn-zoom-out');
    var pt = document.getElementById('btn-pan-toggle');
    var zr = document.getElementById('btn-zoom-reset');
    var zf = document.getElementById('btn-zoom-fit');
    if (zi) zi.addEventListener('click', function () { zoomCentre(1.15); });
    if (zo) zo.addEventListener('click', function () { zoomCentre(1 / 1.15); });
    if (pt) pt.addEventListener('click', function () { setPanMode(!panMode); });
    if (zr) zr.addEventListener('click', resetView);
    if (zf) zf.addEventListener('click', fitAllBlocks);
  })();

  /* Fullscreen — ported from pneumatic wireFullscreen() */
  (function () {
    var btn = document.getElementById('btn-fullscreen');
    var card = document.getElementById('sim-panel');
    if (!btn || !card) return;
    function isFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
    function enterFS() {
      if (card.requestFullscreen) card.requestFullscreen();
      else if (card.webkitRequestFullscreen) card.webkitRequestFullscreen();
    }
    function exitFS() {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    /* Swap only the label + icon paths \u2014 never the whole button contents,
       or the SVG icon and label span would be destroyed on first toggle. */
    var fsLabel = btn.querySelector('.fs-label');
    var fsIcon  = btn.querySelector('.fs-icon');
    var ICON_EXPAND = '<polyline points="4 9 4 4 9 4"></polyline>' +
                      '<polyline points="15 4 20 4 20 9"></polyline>' +
                      '<polyline points="20 15 20 20 15 20"></polyline>' +
                      '<polyline points="9 20 4 20 4 15"></polyline>';
    var ICON_SHRINK = '<polyline points="9 4 9 9 4 9"></polyline>' +
                      '<polyline points="20 9 15 9 15 4"></polyline>' +
                      '<polyline points="15 20 15 15 20 15"></polyline>' +
                      '<polyline points="4 15 9 15 9 20"></polyline>';
    function onFSChange() {
      var full = isFS();
      card.classList.toggle('is-fullscreen', full);
      if (fsLabel) fsLabel.textContent = full ? 'Exit Full Screen' : 'Full Screen';
      if (fsIcon)  fsIcon.innerHTML = full ? ICON_SHRINK : ICON_EXPAND;
      btn.title = full ? 'Return to the normal page view (Esc)' : 'Expand the editor to fill the screen';
      requestAnimationFrame(function () { requestAnimationFrame(function () { resizeCanvas(); draw(); }); });
    }
    btn.addEventListener('click', function () { if (isFS()) exitFS(); else enterFS(); });
    document.addEventListener('fullscreenchange', onFSChange);
    document.addEventListener('webkitfullscreenchange', onFSChange);
  })();

  /* ================================================================
     SAVE / LOAD / EXPORT / IMPORT  (multi-slot)
     Document = ladder rungs + FBD blocks/wires + view mode + input kinds.
     ================================================================ */
  (function () {
    var STORAGE_KEY = 'mechsim.plc-ladder.programs.v1';   /* { name: {savedAt, data} } */
    var SCHEMA = 'mechsim.plc-ladder.v1';

    function showToast(msg, kind) {
      var t = document.getElementById('_plc-toast');
      if (!t) {
        t = document.createElement('div');
        t.id = '_plc-toast';
        t.className = 'toast';
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        document.body.appendChild(t);
      }
      t.textContent = msg;
      t.className = 'toast show' + (kind === 'error' ? ' toast-error' : (kind === 'success' ? ' toast-success' : ''));
      clearTimeout(t._tid);
      t._tid = setTimeout(function () { t.className = 'toast'; }, 2200);
    }

    function deepClone(v) { return JSON.parse(JSON.stringify(v)); }

    /* Strip runtime/transient fields, keep only structural data. */
    function cleanRung(r) {
      return {
        id: r.id,
        comment: r.comment || '',
        elements: (r.elements || []).map(function (el) {
          return { type: el.type, col: el.col, row: el.row || 0, address: el.address, params: deepClone(el.params || {}) };
        }),
        branches: (r.branches || []).map(function (br) {
          return {
            startCol: br.startCol, endCol: br.endCol, subRow: br.subRow || 1,
            elements: (br.elements || []).map(function (el) {
              return { type: el.type, col: el.col, row: el.row || 0, address: el.address, params: deepClone(el.params || {}) };
            })
          };
        })
      };
    }
    function cleanFbdBlock(b) {
      return { id: b.id, type: b.type, x: b.x, y: b.y, address: b.address || '', params: deepClone(b.params || {}) };
    }
    function cleanFbdWire(w) {
      return {
        id: w.id,
        from: { blockId: w.from.blockId, port: w.from.port },
        to:   { blockId: w.to.blockId,   port: w.to.port   },
        waypoints: (w.waypoints && w.waypoints.length) ? deepClone(w.waypoints) : []
      };
    }

    function serialize() {
      return {
        schema: SCHEMA,
        savedAt: new Date().toISOString(),
        viewMode: viewMode,
        view: { offX: viewOffX, offY: viewOffY, scale: viewScale },
        ladder: { rungs: rungs.map(cleanRung) },
        fbd:    { blocks: fbdBlocks.map(cleanFbdBlock), wires: fbdWires.map(cleanFbdWire) },
        inputKinds: deepClone(inputKinds || {}),
        registerDefaults: deepClone(registerDefaults || {})
      };
    }

    function validate(data) {
      if (!data || typeof data !== 'object') return 'Not a valid program file';
      if (data.schema !== SCHEMA) return 'Unrecognised schema (expected ' + SCHEMA + ')';
      if (!data.ladder || !Array.isArray(data.ladder.rungs)) return 'Missing ladder.rungs';
      if (!data.fbd || !Array.isArray(data.fbd.blocks) || !Array.isArray(data.fbd.wires)) return 'Missing fbd.blocks or fbd.wires';
      for (var i = 0; i < data.ladder.rungs.length; i++) {
        var r = data.ladder.rungs[i];
        if (!Array.isArray(r.elements) || !Array.isArray(r.branches)) return 'Rung ' + i + ' has invalid structure';
      }
      for (var j = 0; j < data.fbd.blocks.length; j++) {
        var b = data.fbd.blocks[j];
        if (typeof b.id !== 'number' || typeof b.type !== 'string' || typeof b.x !== 'number' || typeof b.y !== 'number') {
          return 'FBD block ' + j + ' has invalid fields';
        }
      }
      for (var k = 0; k < data.fbd.wires.length; k++) {
        var w = data.fbd.wires[k];
        if (!w.from || !w.to || typeof w.from.blockId !== 'number' || typeof w.to.blockId !== 'number') {
          return 'FBD wire ' + k + ' has invalid endpoints';
        }
      }
      return null;
    }

    function restore(data) {
      if (running) stopSim();
      saveUndo();
      /* Rehydrate ladder rungs (add back runtime fields with defaults) */
      rungs = data.ladder.rungs.map(function (r) {
        return {
          id: r.id,
          comment: r.comment || '',
          outputPower: false,
          elements: (r.elements || []).map(function (el) {
            return { type: el.type, col: el.col, row: el.row || 0, address: el.address, params: deepClone(el.params || {}), state: false, _prevState: false };
          }),
          branches: (r.branches || []).map(function (br) {
            return {
              startCol: br.startCol, endCol: br.endCol, subRow: br.subRow || 1,
              elements: (br.elements || []).map(function (el) {
                return { type: el.type, col: el.col, row: el.row || 0, address: el.address, params: deepClone(el.params || {}), state: false, _prevState: false };
              })
            };
          })
        };
      });
      /* Rehydrate FBD blocks + wires */
      fbdBlocks = data.fbd.blocks.map(function (b) {
        return { id: b.id, type: b.type, x: b.x, y: b.y, address: b.address || '', params: deepClone(b.params || {}), _in: {}, _out: {} };
      });
      fbdWires = data.fbd.wires.map(function (w) {
        return {
          id: w.id,
          from: { blockId: w.from.blockId, port: w.from.port },
          to:   { blockId: w.to.blockId,   port: w.to.port   },
          waypoints: (w.waypoints && w.waypoints.length) ? deepClone(w.waypoints) : [],
          _powered: false
        };
      });
      normalizeRungs();
      /* Recompute next IDs */
      var maxR = 0; for (var i = 0; i < rungs.length; i++) if (rungs[i].id > maxR) maxR = rungs[i].id;
      nextRungId = maxR + 1;
      var maxB = 0; for (var j = 0; j < fbdBlocks.length; j++) if (fbdBlocks[j].id > maxB) maxB = fbdBlocks[j].id;
      nextFbdBlockId = maxB + 1;
      var maxW = 0; for (var k = 0; k < fbdWires.length; k++) if (fbdWires[k].id > maxW) maxW = fbdWires[k].id;
      nextFbdWireId = maxW + 1;
      /* Input kinds */
      if (data.inputKinds && typeof data.inputKinds === 'object') {
        for (var ik in inputKinds) delete inputKinds[ik];
        for (var ak in data.inputKinds) inputKinds[ak] = data.inputKinds[ak];
      }
      /* Register defaults (preset setpoints/constants) */
      for (var rk in registerDefaults) delete registerDefaults[rk];
      if (data.registerDefaults && typeof data.registerDefaults === 'object') {
        for (var rak in data.registerDefaults) registerDefaults[rak] = data.registerDefaults[rak];
      }
      /* View transform */
      if (data.view) {
        viewOffX = +data.view.offX || 0;
        viewOffY = +data.view.offY || 0;
        viewScale = +data.view.scale || 1;
      }
      /* Selection / draft state cleared */
      selectedElement = null;
      fbdSelectedBlockId = null;
      fbdSelectedWireId = null;
      fbdWireDraft = null;
      hideProperties();
      resetSim();
      /* Switch view mode if needed */
      if (data.viewMode && data.viewMode !== viewMode) {
        setViewMode(data.viewMode);
      } else {
        updateViewTabs();
        updatePaletteVisibility();
        draw();
      }
    }

    function readSlots() {
      var slots = {};
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) { var parsed = JSON.parse(raw); if (parsed && typeof parsed === 'object') slots = parsed; }
      } catch (e) { /* ignore */ }
      return slots;
    }
    function writeSlots(slots) { localStorage.setItem(STORAGE_KEY, JSON.stringify(slots)); }

    function defaultSaveName() {
      var d = new Date();
      var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
      return 'Program ' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
           + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }
    function fmtDate(iso) {
      try { var d = new Date(iso); if (isNaN(d.getTime())) return iso || ''; return d.toLocaleString(); }
      catch (e) { return iso || ''; }
    }

    function isEmpty() {
      return rungs.length === 0 && fbdBlocks.length === 0 && fbdWires.length === 0;
    }

    /* Save */
    var btnSave = document.getElementById('btn-save');
    if (btnSave) btnSave.addEventListener('click', function () {
      if (isEmpty()) { showToast('Nothing to save — program is empty', 'error'); return; }
      var slots = readSlots();
      var name = prompt('Save program as:', defaultSaveName());
      if (name === null) return;
      name = String(name).trim();
      if (!name) { showToast('Name cannot be empty', 'error'); return; }
      if (name.length > 60) name = name.slice(0, 60);
      if (slots[name] && !confirm('A program named "' + name + '" already exists. Overwrite?')) return;
      try {
        slots[name] = { savedAt: new Date().toISOString(), data: serialize() };
        writeSlots(slots);
        showToast('Saved as "' + name + '"', 'success');
      } catch (err) { showToast('Save failed: ' + (err && err.message ? err.message : 'storage error'), 'error'); }
    });

    /* Load (picker) */
    var btnLoad = document.getElementById('btn-load');
    var pickerOverlay = document.getElementById('load-picker-overlay');
    var pickerList    = document.getElementById('load-picker-list');
    var pickerEmpty   = document.getElementById('load-picker-empty');
    var pickerClose   = document.getElementById('load-picker-close');

    function renderPicker() {
      if (!pickerList) return;
      var slots = readSlots();
      var names = Object.keys(slots).sort(function (a, b) {
        return (slots[b].savedAt || '').localeCompare(slots[a].savedAt || '');
      });
      pickerList.innerHTML = '';
      if (!names.length) {
        pickerList.style.display = 'none';
        if (pickerEmpty) pickerEmpty.style.display = '';
        return;
      }
      pickerList.style.display = '';
      if (pickerEmpty) pickerEmpty.style.display = 'none';
      names.forEach(function (n) {
        var rec = slots[n];
        var d = rec.data || {};
        var rungCount  = d.ladder && d.ladder.rungs ? d.ladder.rungs.length : 0;
        var blockCount = d.fbd && d.fbd.blocks ? d.fbd.blocks.length : 0;
        var metaParts = [];
        if (rungCount)  metaParts.push(rungCount + ' rung' + (rungCount === 1 ? '' : 's'));
        if (blockCount) metaParts.push(blockCount + ' FBD block' + (blockCount === 1 ? '' : 's'));
        if (d.viewMode) metaParts.push(d.viewMode.toUpperCase());
        metaParts.push(fmtDate(rec.savedAt));
        var row = document.createElement('div'); row.className = 'saved-item';
        var info = document.createElement('div'); info.className = 'saved-item-info';
        var nameEl = document.createElement('div'); nameEl.className = 'saved-item-name'; nameEl.textContent = n;
        var metaEl = document.createElement('div'); metaEl.className = 'saved-item-meta';
        metaEl.textContent = metaParts.join(' · ');
        info.appendChild(nameEl); info.appendChild(metaEl);
        var actions = document.createElement('div'); actions.className = 'saved-item-actions';
        var loadBtn = document.createElement('button'); loadBtn.type = 'button';
        loadBtn.className = 'saved-item-btn'; loadBtn.textContent = 'Load';
        loadBtn.setAttribute('aria-label', 'Load program ' + n);
        loadBtn.addEventListener('click', function () {
          var verr = validate(rec.data);
          if (verr) { showToast(verr, 'error'); return; }
          if (!isEmpty() && !confirm('Replace current program with "' + n + '"?')) return;
          restore(rec.data);
          if (pickerOverlay) pickerOverlay.style.display = 'none';
          showToast('Loaded "' + n + '"', 'success');
        });
        var delBtn = document.createElement('button'); delBtn.type = 'button';
        delBtn.className = 'saved-item-btn saved-item-delete'; delBtn.textContent = 'Delete';
        delBtn.setAttribute('aria-label', 'Delete program ' + n);
        delBtn.addEventListener('click', function () {
          if (!confirm('Delete saved program "' + n + '"? This cannot be undone.')) return;
          var s = readSlots(); delete s[n]; writeSlots(s);
          renderPicker(); showToast('Deleted "' + n + '"', 'success');
        });
        actions.appendChild(loadBtn); actions.appendChild(delBtn);
        row.appendChild(info); row.appendChild(actions);
        pickerList.appendChild(row);
      });
    }

    if (btnLoad && pickerOverlay) {
      btnLoad.addEventListener('click', function () { renderPicker(); pickerOverlay.style.display = 'flex'; });
      if (pickerClose) pickerClose.addEventListener('click', function () { pickerOverlay.style.display = 'none'; });
      pickerOverlay.addEventListener('click', function (e) { if (e.target === pickerOverlay) pickerOverlay.style.display = 'none'; });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pickerOverlay.style.display === 'flex') {
          pickerOverlay.style.display = 'none'; e.stopPropagation();
        }
      });
    }

    /* Export */
    var btnExport = document.getElementById('btn-export-json');
    if (btnExport) btnExport.addEventListener('click', function () {
      if (isEmpty()) { showToast('Nothing to export — program is empty', 'error'); return; }
      try {
        var json = JSON.stringify(serialize(), null, 2);
        var blob = new Blob([json], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        var a = document.createElement('a');
        a.href = url; a.download = 'plc-program-' + stamp + '.json';
        document.body.appendChild(a); a.click();
        setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
        showToast('Program exported', 'success');
      } catch (e) { showToast('Export failed: ' + e.message, 'error'); }
    });

    /* Import */
    var btnImport = document.getElementById('btn-import-json');
    var fileInput = document.getElementById('import-json-input');
    if (btnImport && fileInput) {
      btnImport.addEventListener('click', function () { fileInput.value = ''; fileInput.click(); });
      fileInput.addEventListener('change', function (e) {
        var f = e.target.files && e.target.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function (ev) {
          var data;
          try { data = JSON.parse(ev.target.result); }
          catch (er) { showToast('File is not valid JSON', 'error'); return; }
          var verr = validate(data);
          if (verr) { showToast(verr, 'error'); return; }
          if (!isEmpty() && !confirm('Replace current program with imported one?')) return;
          restore(data);
          showToast('Program imported', 'success');
        };
        reader.onerror = function () { showToast('Could not read file', 'error'); };
        reader.readAsText(f);
      });
    }

    /* ================================================================
       SHAREABLE URL — the whole program is encoded into the link (no backend).
       serialize() (minus savedAt) → [flag] + deflate-raw|raw → base64url → '#c='
       ================================================================ */
    function b64urlEncode(u8){ var s=''; for(var i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
    function b64urlDecode(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; var bin=atob(str), u8=new Uint8Array(bin.length); for(var i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8; }
    function deflateBytes(u8){ var cs=new CompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(cs)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    function inflateBytes(u8){ var ds=new DecompressionStream('deflate-raw'); return new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer().then(function(b){return new Uint8Array(b);}); }
    var SHARE_MAX = 1800;
    function shareSnapshot(){ var d=serialize(); delete d.savedAt; return JSON.stringify(d); }   // drop savedAt → same program yields the same link
    function flashShare(label, ok){ var b=document.getElementById('btn-share'); if(!b) return; if(b._orig==null) b._orig=b.innerHTML; clearTimeout(b._ft); b.textContent=label; b.style.color = ok===false?'#ff6b6b':(ok?'#43c66a':''); b._ft=setTimeout(function(){ b.innerHTML=b._orig; b.style.color=''; }, 1900); }
    function shareLink(){
      try{
        var U=new TextEncoder().encode(shareSnapshot());
        var canZip=(typeof CompressionStream!=='undefined');
        return (canZip?deflateBytes(U):Promise.resolve(U)).then(function(body){
          var out=new Uint8Array(body.length+1); out[0]=canZip?1:0; out.set(body,1);
          var enc=b64urlEncode(out);
          if(enc.length>SHARE_MAX){ showToast('Program too big to share as a link — use Export (JSON) instead','error'); flashShare('⚠ Too big — use Export',false); return; }
          var url=location.origin+location.pathname+'#c='+enc;
          try{ window.history.replaceState(null,'','#c='+enc); }catch(e){}
          if(navigator.clipboard&&navigator.clipboard.writeText){
            navigator.clipboard.writeText(url).then(
              function(){ showToast('Shareable link copied — opens this exact program','success'); flashShare('✓ Link copied!',true); },
              function(){ showToast('Shareable link is in the address bar','success'); flashShare('↑ Link in address bar'); });
          } else { showToast('Shareable link is in the address bar','success'); flashShare('↑ Link in address bar'); }
        }).catch(function(){ showToast('Could not create a share link','error'); flashShare('✗ Share failed',false); });
      }catch(e){ showToast('Could not create a share link','error'); flashShare('✗ Share failed',false); return Promise.resolve(); }
    }
    function loadFromHash(){
      var h=location.hash||''; if(h.indexOf('#c=')!==0) return;
      var enc=h.slice(3);
      Promise.resolve().then(function(){
        var final=b64urlDecode(enc), flag=final[0], body=final.subarray(1);
        return (flag===1)?inflateBytes(body):Promise.resolve(body);
      }).then(function(U){
        var data=JSON.parse(new TextDecoder().decode(U));
        if(validate(data)) return;               // schema/shape mismatch → ignore silently
        restore(data);
        showToast('Opened a shared program','success');
      }).catch(function(){});                     // corrupt link → keep the current program
    }
    var btnShare=document.getElementById('btn-share');
    if(btnShare) btnShare.addEventListener('click', shareLink);
    setTimeout(loadFromHash, 0);   // runs after the synchronous boot (rAF-free so it's not throttled in background tabs)
  })();

  updateToolbarState();
  updateIOPanel();
  updateViewTabs();
  updatePaletteVisibility();
  switchMode('simulate');

  /* Debug hook (for advanced users and automated audits). Read-only on the
     surface, but mutating getters here shouldn't break simulation. */
  window.plcSim = {
    getRungs:    function () { return rungs; },
    setRungs:    function (r) { rungs = r; nextRungId = (r.reduce(function(m,x){return Math.max(m,x.id||0);},0)) + 1; resetSim(); draw(); },
    /* FBD-aware accessors */
    getViewMode: function () { return viewMode; },
    setViewMode: function (m) { setViewMode(m); },
    getFbd:      function () { return { blocks: fbdBlocks, wires: fbdWires }; },
    setFbd:      function (program) {
      fbdBlocks = (program && program.blocks) || [];
      fbdWires  = (program && program.wires)  || [];
      nextFbdBlockId = (fbdBlocks.reduce(function (m, b) { return Math.max(m, b.id || 0); }, 0)) + 1;
      nextFbdWireId  = (fbdWires.reduce (function (m, w) { return Math.max(m, w.id || 0); }, 0)) + 1;
      resetSim(); draw();
    },
    getState:    function () {
      return {
        viewMode: viewMode,
        inputs: JSON.parse(JSON.stringify(inputs)),
        outputs: JSON.parse(JSON.stringify(outputs)),
        memory: JSON.parse(JSON.stringify(memory)),
        registers: JSON.parse(JSON.stringify(registers)),
        timers: JSON.parse(JSON.stringify(timers)),
        counters: JSON.parse(JSON.stringify(counters)),
        fbdBlocks: fbdBlocks.map(function (b) { return { id: b.id, type: b.type, address: b.address, _in: b._in, _out: b._out }; }),
        scanCount: scanCount,
        running: running
      };
    },
    setInput:    function (addr, val) { inputs[addr] = !!val; updateIOPanel(); if (!running) draw(); },
    setRegister: function (addr, val) { registers[addr] = val; },
    start:       function () { startSim(); },
    stop:        function () { stopSim(); },
    step:        function () { stepSim(); },
    reset:       function () { resetSim(); },
    /* Synchronous single scan — for testing without the rAF loop.
       Advances simTime so timers accumulate correctly. */
    scanOnce:    function (dt) {
      var d = dt || 0.016;
      simTime += d;
      scanCycle(d);
      updateIOPanel();
      refreshPropsModalLive();
      draw();
    },
    /* Synchronous multi-scan for stress testing — runs n scans, each advancing
       simTime by dtMs milliseconds. Useful when rAF is throttled (backgrounded tab).
       Mirrors animate()'s panel refresh so the DOM matches the engine state. */
    runSync:     function (n, dtMs) {
      var d = (dtMs || 16) / 1000;
      for (var i = 0; i < n; i++) { simTime += d; scanCycle(d); }
      updateIOPanel();
      refreshPropsModalLive();
      draw();
    }
  };

})();
