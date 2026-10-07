/* ==========================================================================
   Digital Logic Design (DLD) Virtual Laboratory Engine
   WBSCTE Diploma CST 3rd Semester (CST/3/303)
   4-State IEEE Logic, Manhattan Auto-Routing, K-Map Minimizer, Logic Analyzer
   Zero External Dependencies | Vanilla JS & HTML5 Canvas 2D
   ========================================================================== */

(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // 1. WEB AUDIO API SYNTHESIZER
  // ══════════════════════════════════════════════════════════════════════════
  const SoundFX = {
    ctx: null,
    enabled: true,
    volume: 0.18,

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx();
        } catch (e) {
          console.warn('AudioContext unavailable:', e);
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    toggle() {
      this.init();
      this.enabled = !this.enabled;
      const btn = document.getElementById('btn-sound-toggle');
      if (btn) {
        btn.innerHTML = this.enabled ? '&#128264;' : '&#128263;';
        btn.classList.toggle('muted', !this.enabled);
      }
    },

    playTone(freq, type, duration, gainVal, slideFreq) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideFreq) {
          osc.frequency.exponentialRampToValueAtTime(slideFreq, this.ctx.currentTime + duration);
        }

        gain.gain.setValueAtTime(gainVal * this.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio error fail-safe
      }
    },

    switchClick() {
      // Crisp mechanical snap
      this.playTone(1400, 'triangle', 0.03, 0.45, 400);
    },

    clockTick() {
      // Woodblock-like clock metronome tick
      this.playTone(600, 'sine', 0.04, 0.35);
    },

    contentionBuzz() {
      // Low buzzing alarm for logic X contention
      this.playTone(110, 'sawtooth', 0.16, 0.5, 90);
    },

    successChord() {
      // Ascending C5-E5-G5 triad chord
      if (!this.enabled || !this.ctx) return;
      [523.25, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'triangle', 0.14, 0.35), i * 40);
      });
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 2. 4-STATE IEEE 1164 DISCRETE LOGIC ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  const Logic = {
    // 4 States: '0', '1', 'Z', 'X'
    AND(a, b) {
      if (a === '0' || b === '0') return '0';
      if (a === '1' && b === '1') return '1';
      if (a === 'X' || b === 'X') return 'X';
      return 'Z';
    },

    OR(a, b) {
      if (a === '1' || b === '1') return '1';
      if (a === '0' && b === '0') return '0';
      if (a === 'X' || b === 'X') return 'X';
      return 'Z';
    },

    NOT(a) {
      if (a === '1') return '0';
      if (a === '0') return '1';
      return a;
    },

    NAND(a, b) {
      return this.NOT(this.AND(a, b));
    },

    NOR(a, b) {
      return this.NOT(this.OR(a, b));
    },

    XOR(a, b) {
      if (a === 'X' || b === 'X') return 'X';
      if (a === 'Z' || b === 'Z') return 'Z';
      return (a !== b) ? '1' : '0';
    },

    XNOR(a, b) {
      return this.NOT(this.XOR(a, b));
    },

    // Bus contention resolver (wired-OR / tri-state bus resolution)
    resolveBus(signals) {
      let active1 = false;
      let active0 = false;
      let hasX = false;
      let onlyZ = true;

      signals.forEach(s => {
        if (s === '1') { active1 = true; onlyZ = false; }
        else if (s === '0') { active0 = true; onlyZ = false; }
        else if (s === 'X') { hasX = true; onlyZ = false; }
      });

      if (hasX || (active1 && active0)) return 'X'; // Bus Contention!
      if (active1) return '1';
      if (active0) return '0';
      if (onlyZ) return 'Z';
      return 'X';
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 2B. INTERACTIVE CUSTOM NETLIST SANDBOX STATE MANAGER
  // ══════════════════════════════════════════════════════════════════════════
  const CustomSandbox = {
    components: [],
    wires: [],
    selectedCompId: null,
    selectedWireId: null,
    wiringSource: null,
    hoveredPin: null,
    mousePos: { x: 0, y: 0 },
    draggingComp: null,
    dragOffset: { x: 0, y: 0 },
    nextId: 1,

    globalInputs: [
      { name: 'IN0', val: '0', y: 100 },
      { name: 'IN1', val: '1', y: 180 },
      { name: 'IN2', val: '0', y: 260 },
      { name: 'IN3', val: '0', y: 340 }
    ],
    globalOutputs: [
      { name: 'OUT0', val: '0', y: 180 },
      { name: 'OUT1', val: '0', y: 280 }
    ],

    getPinPos(ref) {
      if (ref.compId === '__global_in__') {
        const g = this.globalInputs[ref.pinIdx];
        return { x: 50, y: g ? g.y : 100 };
      }
      if (ref.compId === '__global_out__') {
        const g = this.globalOutputs[ref.pinIdx];
        return { x: 770, y: g ? g.y : 180 };
      }
      const c = this.components.find(comp => comp.id === ref.compId);
      if (!c) return { x: 0, y: 0 };
      if (ref.isOutput) {
        const pin = c.outPins[ref.pinIdx];
        return { x: c.x + (pin ? pin.relX : c.w), y: c.y + (pin ? pin.relY : c.h / 2) };
      } else {
        const pin = c.inPins[ref.pinIdx];
        return { x: c.x + (pin ? pin.relX : 0), y: c.y + (pin ? pin.relY : c.h / 2) };
      }
    },

    createComponent(type, x, y) {
      const id = 'gate_' + (this.nextId++);
      let w = 70, h = 48;
      let inPins = [];
      let outPins = [];

      if (type === 'NOT') {
        w = 60; h = 42;
        inPins = [{ name: 'A', relX: 0, relY: 21 }];
        outPins = [{ name: 'Y', relX: 60, relY: 21 }];
      } else if (type === 'AND' || type === 'OR' || type === 'NAND' || type === 'NOR' || type === 'XOR') {
        w = 72; h = 50;
        inPins = [
          { name: 'A', relX: 0, relY: 15 },
          { name: 'B', relX: 0, relY: 35 }
        ];
        outPins = [{ name: 'Y', relX: 72, relY: 25 }];
      } else if (type === 'MUX') {
        w = 84; h = 86;
        inPins = [
          { name: 'D0', relX: 0, relY: 14 },
          { name: 'D1', relX: 0, relY: 28 },
          { name: 'D2', relX: 0, relY: 42 },
          { name: 'D3', relX: 0, relY: 56 },
          { name: 'S0', relX: 28, relY: 86 },
          { name: 'S1', relX: 56, relY: 86 }
        ];
        outPins = [{ name: 'Y', relX: 84, relY: 42 }];
      } else if (type === 'JK') {
        w = 84; h = 76;
        inPins = [
          { name: 'J', relX: 0, relY: 18 },
          { name: 'CLK', relX: 0, relY: 38 },
          { name: 'K', relX: 0, relY: 58 }
        ];
        outPins = [
          { name: 'Q', relX: 84, relY: 22 },
          { name: "Q'", relX: 84, relY: 54 }
        ];
      } else {
        w = 70; h = 48;
        inPins = [{ name: 'A', relX: 0, relY: 15 }, { name: 'B', relX: 0, relY: 33 }];
        outPins = [{ name: 'Y', relX: 70, relY: 24 }];
      }

      return {
        id,
        type,
        x: Math.round(x / 10) * 10,
        y: Math.round(y / 10) * 10,
        w,
        h,
        inPins,
        outPins,
        inVals: inPins.map(() => '0'),
        outVals: outPins.map(() => '0'),
        state: { q: '0', qBar: '1' }
      };
    },

    initDefault() {
      this.components = [];
      this.wires = [];
      this.selectedCompId = null;
      this.selectedWireId = null;
      this.wiringSource = null;
      this.hoveredPin = null;
      this.nextId = 1;

      // Starter netlist: Half-Adder circuit for immediate interactive exploration
      const xor1 = this.createComponent('XOR', 280, 110);
      const and1 = this.createComponent('AND', 280, 240);
      this.components.push(xor1, and1);

      this.wires.push({
        id: 'w1',
        from: { compId: '__global_in__', pinIdx: 0, isOutput: true },
        to: { compId: xor1.id, pinIdx: 0, isOutput: false }
      });
      this.wires.push({
        id: 'w2',
        from: { compId: '__global_in__', pinIdx: 0, isOutput: true },
        to: { compId: and1.id, pinIdx: 0, isOutput: false }
      });
      this.wires.push({
        id: 'w3',
        from: { compId: '__global_in__', pinIdx: 1, isOutput: true },
        to: { compId: xor1.id, pinIdx: 1, isOutput: false }
      });
      this.wires.push({
        id: 'w4',
        from: { compId: '__global_in__', pinIdx: 1, isOutput: true },
        to: { compId: and1.id, pinIdx: 1, isOutput: false }
      });
      this.wires.push({
        id: 'w5',
        from: { compId: xor1.id, pinIdx: 0, isOutput: true },
        to: { compId: '__global_out__', pinIdx: 0, isOutput: false }
      });
      this.wires.push({
        id: 'w6',
        from: { compId: and1.id, pinIdx: 0, isOutput: true },
        to: { compId: '__global_out__', pinIdx: 1, isOutput: false }
      });
    },

    deleteSelected() {
      if (this.selectedCompId) {
        this.components = this.components.filter(c => c.id !== this.selectedCompId);
        this.wires = this.wires.filter(w => w.from.compId !== this.selectedCompId && w.to.compId !== this.selectedCompId);
        this.selectedCompId = null;
        return true;
      }
      if (this.selectedWireId) {
        this.wires = this.wires.filter(w => w.id !== this.selectedWireId);
        this.selectedWireId = null;
        return true;
      }
      return false;
    },

    clear() {
      this.components = [];
      this.wires = [];
      this.selectedCompId = null;
      this.selectedWireId = null;
      this.wiringSource = null;
      this.hoveredPin = null;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 3. CIRCUIT DEFINITIONS & PRESET EXPERIMENTS
  // ══════════════════════════════════════════════════════════════════════════
  const CIRCUITS = {
    full_adder: {
      name: '1-Bit Full Adder',
      icBadge: 'IC 7486 (XOR) + IC 7408 (AND) + IC 7432 (OR)',
      inputs: [
        { name: 'A', val: '1' },
        { name: 'B', val: '1' },
        { name: 'Cin', val: '0' }
      ],
      outputs: [
        { name: 'Sum', val: '0' },
        { name: 'Cout', val: '1' }
      ],
      evaluate(inputs) {
        const A = inputs[0] || '0';
        const B = inputs[1] || '0';
        const Cin = inputs[2] || '0';

        const xor1 = Logic.XOR(A, B);
        const sum = Logic.XOR(xor1, Cin);

        const and1 = Logic.AND(A, B);
        const and2 = Logic.AND(Cin, xor1);
        const cout = Logic.OR(and1, and2);

        return {
          outputs: [sum, cout],
          internal: { xor1, and1, and2 }
        };
      },
      sop: 'Sum = A &oplus; B &oplus; Cin',
      pos: 'Cout = AB + BCin + ACin',
      chipName: 'SN7486N / SN7408N / SN7432N'
    },

    half_adder: {
      name: 'Half Adder',
      icBadge: 'IC 7486 (XOR) + IC 7408 (AND)',
      inputs: [
        { name: 'A', val: '1' },
        { name: 'B', val: '1' }
      ],
      outputs: [
        { name: 'Sum', val: '0' },
        { name: 'Carry', val: '1' }
      ],
      evaluate(inputs) {
        const A = inputs[0] || '0';
        const B = inputs[1] || '0';
        const sum = Logic.XOR(A, B);
        const carry = Logic.AND(A, B);
        return { outputs: [sum, carry], internal: {} };
      },
      sop: 'Sum = A &oplus; B',
      pos: 'Carry = A &bull; B',
      chipName: 'SN7486N &bull; QUAD 2-INPUT XOR'
    },

    mux_4to1: {
      name: '4-to-1 Multiplexer',
      icBadge: 'IC 74151 (8:1 MUX configured as 4:1)',
      inputs: [
        { name: 'D0', val: '1' },
        { name: 'D1', val: '0' },
        { name: 'D2', val: '1' },
        { name: 'D3', val: '0' },
        { name: 'S0', val: '0' },
        { name: 'S1', val: '0' }
      ],
      outputs: [
        { name: 'Y (Out)', val: '1' },
        { name: 'Y_bar', val: '0' }
      ],
      evaluate(inputs) {
        const d0 = inputs[0] || '0';
        const d1 = inputs[1] || '0';
        const d2 = inputs[2] || '0';
        const d3 = inputs[3] || '0';
        const s0 = inputs[4] || '0';
        const s1 = inputs[5] || '0';

        let y = '0';
        if (s1 === '0' && s0 === '0') y = d0;
        else if (s1 === '0' && s0 === '1') y = d1;
        else if (s1 === '1' && s0 === '0') y = d2;
        else if (s1 === '1' && s0 === '1') y = d3;

        return { outputs: [y, Logic.NOT(y)], internal: {} };
      },
      sop: 'Y = S1\'S0\'D0 + S1\'S0D1 + S1S0\'D2 + S1S0D3',
      pos: 'Dual-line complementary output',
      chipName: 'SN74151N &bull; 8-TO-1 DATA SELECTOR'
    },

    decoder_2to4: {
      name: '2-to-4 Line Decoder',
      icBadge: 'IC 74139 (Dual 2:4 Decoder)',
      inputs: [
        { name: 'A (In0)', val: '0' },
        { name: 'B (In1)', val: '1' },
        { name: 'Enable', val: '1' }
      ],
      outputs: [
        { name: 'Y0', val: '0' },
        { name: 'Y1', val: '0' },
        { name: 'Y2', val: '1' },
        { name: 'Y3', val: '0' }
      ],
      evaluate(inputs) {
        const a = inputs[0] || '0';
        const b = inputs[1] || '0';
        const en = inputs[2] || '1';

        if (en === '0') {
          return { outputs: ['0', '0', '0', '0'], internal: {} };
        }
        const y0 = (a === '0' && b === '0') ? '1' : '0';
        const y1 = (a === '1' && b === '0') ? '1' : '0';
        const y2 = (a === '0' && b === '1') ? '1' : '0';
        const y3 = (a === '1' && b === '1') ? '1' : '0';
        return { outputs: [y0, y1, y2, y3], internal: {} };
      },
      sop: 'Y0 = A\'B\'En, Y1 = AB\'En, Y2 = A\'BEn, Y3 = ABEn',
      pos: '1-of-4 Active High Decoder',
      chipName: 'SN74139N &bull; DUAL 2-LINE TO 4-LINE DECODER'
    },

    jk_flip_flop: {
      name: 'Master-Slave JK Flip-Flop',
      icBadge: 'IC 7476 (Dual JK Flip-Flop with Preset/Clear)',
      inputs: [
        { name: 'J', val: '1' },
        { name: 'K', val: '1' },
        { name: 'CLK', val: '0' }
      ],
      outputs: [
        { name: 'Q', val: '0' },
        { name: 'Q_bar', val: '1' }
      ],
      state: { q: '0' },
      evaluate(inputs, state, isClockEdge) {
        const j = inputs[0] || '0';
        const k = inputs[1] || '0';
        let q = state ? state.q : '0';

        if (isClockEdge) {
          if (j === '0' && k === '0') {
            // Hold
          } else if (j === '0' && k === '1') {
            q = '0'; // Reset
          } else if (j === '1' && k === '0') {
            q = '1'; // Set
          } else if (j === '1' && k === '1') {
            q = (q === '1') ? '0' : '1'; // Toggle!
          }
          if (state) state.q = q;
        }

        const qBar = (q === '1') ? '0' : '1';
        return { outputs: [q, qBar], internal: {} };
      },
      sop: 'Q_next = J &bull; Q\' + K\' &bull; Q',
      pos: 'Toggle Mode when J=1, K=1 on active edge &uarr;',
      chipName: 'SN7476N &bull; DUAL J-K FLIP-FLOPS'
    },

    counter_mod4: {
      name: 'Synchronous Mod-4 Binary Up Counter',
      icBadge: '2 &times; Cascaded JK Flip-Flops (IC 7476)',
      inputs: [
        { name: 'CLK', val: '0' }
      ],
      outputs: [
        { name: 'Q0 (LSB)', val: '0' },
        { name: 'Q1 (MSB)', val: '0' }
      ],
      state: { q0: '0', q1: '0' },
      evaluate(inputs, state, isClockEdge) {
        let q0 = state ? state.q0 : '0';
        let q1 = state ? state.q1 : '0';

        if (isClockEdge) {
          // FF0 toggles on every clock edge
          const nextQ0 = (q0 === '1') ? '0' : '1';
          // FF1 toggles only when FF0 was 1 (Synchronous count)
          const nextQ1 = (q0 === '1') ? ((q1 === '1') ? '0' : '1') : q1;

          q0 = nextQ0;
          q1 = nextQ1;
          if (state) {
            state.q0 = q0;
            state.q1 = q1;
          }
        }

        return { outputs: [q0, q1], internal: {} };
      },
      sop: 'Count Sequence: 00 &rarr; 01 &rarr; 10 &rarr; 11 &rarr; 00',
      pos: 'Frequency: f(Q0) = f_clk / 2; f(Q1) = f_clk / 4',
      chipName: 'SN7476N / SN7490 SYNCHRONOUS COUNTER'
    },

    custom_sandbox: {
      name: 'Custom Netlist Sandbox (Interactive Wiring)',
      icBadge: 'Dynamic Netlist &bull; Drag & Drop &bull; Manhattan Auto-Routing',
      chipName: 'MODULAR TTL NETLIST ENGINE',
      sop: 'Custom User Netlist Evaluated Live',
      pos: 'Use palette to drop gates; Click pins to wire; Drag to arrange; Del to delete',
      inputs: CustomSandbox.globalInputs,
      outputs: CustomSandbox.globalOutputs,
      state: {},
      evaluate(inputs, state, isClockEdge) {
        // Sync global input values
        CustomSandbox.globalInputs.forEach((g, idx) => {
          g.val = (inputs && inputs[idx] !== undefined) ? inputs[idx] : (g.val || '0');
        });

        // 5 propagation passes to resolve multi-tier gates
        for (let pass = 0; pass < 5; pass++) {
          CustomSandbox.components.forEach(comp => {
            // Read input pin values from incoming wires
            comp.inPins.forEach((pin, pIdx) => {
              const wire = CustomSandbox.wires.find(w => w.to.compId === comp.id && w.to.pinIdx === pIdx);
              if (!wire) {
                comp.inVals[pIdx] = '0';
              } else {
                if (wire.from.compId === '__global_in__') {
                  const srcIn = CustomSandbox.globalInputs[wire.from.pinIdx];
                  comp.inVals[pIdx] = srcIn ? srcIn.val : '0';
                } else {
                  const srcComp = CustomSandbox.components.find(c => c.id === wire.from.compId);
                  comp.inVals[pIdx] = (srcComp && srcComp.outVals[wire.from.pinIdx]) ? srcComp.outVals[wire.from.pinIdx] : '0';
                }
              }
            });

            // Evaluate gate function
            const inA = comp.inVals[0] || '0';
            const inB = comp.inVals[1] || '0';
            if (comp.type === 'AND') comp.outVals[0] = Logic.AND(inA, inB);
            else if (comp.type === 'OR') comp.outVals[0] = Logic.OR(inA, inB);
            else if (comp.type === 'NOT') comp.outVals[0] = Logic.NOT(inA);
            else if (comp.type === 'NAND') comp.outVals[0] = Logic.NAND(inA, inB);
            else if (comp.type === 'NOR') comp.outVals[0] = Logic.NOR(inA, inB);
            else if (comp.type === 'XOR') comp.outVals[0] = Logic.XOR(inA, inB);
            else if (comp.type === 'MUX') {
              const d0 = comp.inVals[0] || '0';
              const d1 = comp.inVals[1] || '0';
              const d2 = comp.inVals[2] || '0';
              const d3 = comp.inVals[3] || '0';
              const s0 = comp.inVals[4] || '0';
              const s1 = comp.inVals[5] || '0';
              const sel = (s1 === '1' ? 2 : 0) + (s0 === '1' ? 1 : 0);
              comp.outVals[0] = [d0, d1, d2, d3][sel] || '0';
            } else if (comp.type === 'JK') {
              const j = comp.inVals[0] || '0';
              const clk = comp.inVals[1] || '0';
              const k = comp.inVals[2] || '0';
              if (isClockEdge) {
                let q = comp.state.q;
                if (j === '0' && k === '0') { /* No change */ }
                else if (j === '0' && k === '1') { q = '0'; }
                else if (j === '1' && k === '0') { q = '1'; }
                else if (j === '1' && k === '1') { q = (q === '1') ? '0' : '1'; }
                comp.state.q = q;
                comp.state.qBar = (q === '1') ? '0' : '1';
              }
              comp.outVals[0] = comp.state.q;
              comp.outVals[1] = comp.state.qBar;
            }
          });
        }

        // Resolve global outputs
        const outVals = CustomSandbox.globalOutputs.map((gOut, idx) => {
          const wire = CustomSandbox.wires.find(w => w.to.compId === '__global_out__' && w.to.pinIdx === idx);
          if (!wire) return '0';
          if (wire.from.compId === '__global_in__') {
            const srcIn = CustomSandbox.globalInputs[wire.from.pinIdx];
            return srcIn ? srcIn.val : '0';
          }
          const srcComp = CustomSandbox.components.find(c => c.id === wire.from.compId);
          return (srcComp && srcComp.outVals[wire.from.pinIdx]) ? srcComp.outVals[wire.from.pinIdx] : '0';
        });

        CustomSandbox.globalOutputs.forEach((g, idx) => {
          g.val = outVals[idx];
        });

        return {
          outputs: outVals,
          internal: {}
        };
      }
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 4. MULTI-CHANNEL LOGIC ANALYZER OSCILLOSCOPE
  // ══════════════════════════════════════════════════════════════════════════
  class LogicAnalyzer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.channels = [
        { name: 'CLK', history: [] },
        { name: 'A', history: [] },
        { name: 'B', history: [] },
        { name: 'Cin', history: [] },
        { name: 'Sum', history: [] },
        { name: 'Cout', history: [] }
      ];
      this.maxSamples = 120;
    }

    resetChannels(channelNames) {
      this.channels = (channelNames || ['CLK', 'A', 'B', 'Sum', 'Cout']).map(name => ({
        name,
        history: []
      }));
    }

    recordSample(sampleMap) {
      this.channels.forEach(ch => {
        const val = sampleMap[ch.name] !== undefined ? sampleMap[ch.name] : '0';
        ch.history.push(val);
        if (ch.history.length > this.maxSamples) {
          ch.history.shift();
        }
      });
      this.draw();
    }

    draw() {
      if (!this.canvas || !this.ctx) return;
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#020712';
      ctx.fillRect(0, 0, w, h);

      // Grid Lines
      ctx.strokeStyle = '#0a172e';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      const numCh = Math.max(1, this.channels.length);
      const chHeight = Math.floor(h / numCh);

      this.channels.forEach((ch, chIdx) => {
        const baseY = (chIdx + 1) * chHeight - 8;
        const highY = baseY - (chHeight - 14);

        // Divider
        ctx.strokeStyle = '#122240';
        ctx.beginPath(); ctx.moveTo(0, baseY + 6); ctx.lineTo(w, baseY + 6); ctx.stroke();

        // Channel Label
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(ch.name, 10, baseY - 4);

        // Waveform Traces
        if (ch.history.length > 1) {
          ctx.strokeStyle = (ch.name === 'CLK') ? '#f59e0b' : '#10b981';
          ctx.lineWidth = 2;
          ctx.beginPath();

          const stepX = (w - 70) / (this.maxSamples - 1);
          const startX = 70;

          ch.history.forEach((state, i) => {
            const x = startX + i * stepX;
            const y = (state === '1') ? highY : (state === '0' ? baseY : (highY + baseY) / 2);

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              const prevState = ch.history[i - 1];
              const prevY = (prevState === '1') ? highY : (prevState === '0' ? baseY : (highY + baseY) / 2);
              // Draw finite rise/fall transition with subtle slope
              if (prevY !== y) {
                ctx.lineTo(x - 2, prevY);
                ctx.lineTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
          });
          ctx.stroke();

          // Contention / High-Z styling
          const latest = ch.history[ch.history.length - 1];
          if (latest === 'X') {
            ctx.fillStyle = '#ec4899';
            ctx.fillText('⚠ CONT', w - 50, baseY - 4);
          }
        }
      });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. CANVAS SCHEMATIC & BREADBOARD RENDERER
  // ══════════════════════════════════════════════════════════════════════════
  function drawSchematicCanvas(circuitKey, curCircuit, inputVals, outputVals, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#030814';
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid
    ctx.strokeStyle = '#09152b';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Helper: Wire Color
    const wireColor = (val) => {
      if (val === '1') return '#10b981'; // Emerald Green
      if (val === '0') return '#334155'; // Slate
      if (val === 'Z') return '#06b6d4'; // Cyan
      return '#ec4899';                  // Magenta (X)
    };

    // Draw IEEE Gates depending on active circuit
    if (circuitKey === 'full_adder') {
      const A = inputVals[0];
      const B = inputVals[1];
      const Cin = inputVals[2];
      const evalRes = curCircuit.evaluate(inputVals);
      const xor1 = evalRes.internal.xor1;
      const and1 = evalRes.internal.and1;
      const and2 = evalRes.internal.and2;
      const sum = evalRes.outputs[0];
      const cout = evalRes.outputs[1];

      // Draw Gate 1: XOR1 (A, B) at (250, 100)
      drawGateSymbol(ctx, 'XOR', 250, 100, 70, 50, [A, B], xor1, 'XOR1');

      // Draw Gate 2: XOR2 (XOR1, Cin) at (480, 130) -> Sum
      drawGateSymbol(ctx, 'XOR', 480, 130, 70, 50, [xor1, Cin], sum, 'XOR2 (Sum)');

      // Draw Gate 3: AND1 (A, B) at (250, 260)
      drawGateSymbol(ctx, 'AND', 250, 260, 70, 50, [A, B], and1, 'AND1');

      // Draw Gate 4: AND2 (Cin, XOR1) at (480, 290)
      drawGateSymbol(ctx, 'AND', 480, 290, 70, 50, [Cin, xor1], and2, 'AND2');

      // Draw Gate 5: OR (AND1, AND2) at (660, 280) -> Cout
      drawGateSymbol(ctx, 'OR', 660, 280, 70, 50, [and1, and2], cout, 'OR (Cout)');

      // Manhattan Signal Wires with glowing levels
      drawManhattanWire(ctx, 60, 90, 250, 90, wireColor(A), A);
      drawManhattanWire(ctx, 60, 120, 250, 120, wireColor(B), B);
      drawManhattanWire(ctx, 60, 160, 480, 160, wireColor(Cin), Cin);

      // Connecting internal nets
      drawManhattanWire(ctx, 320, 110, 480, 120, wireColor(xor1), xor1);
      drawManhattanWire(ctx, 320, 270, 660, 270, wireColor(and1), and1);
      drawManhattanWire(ctx, 550, 300, 660, 295, wireColor(and2), and2);

      // Output Wire Lines
      drawManhattanWire(ctx, 550, 140, 760, 140, wireColor(sum), sum);
      drawManhattanWire(ctx, 730, 290, 770, 290, wireColor(cout), cout);

      // Input / Output Terminals Text
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = wireColor(A); ctx.fillText(`A: ${A}`, 50, 95);
      ctx.fillStyle = wireColor(B); ctx.fillText(`B: ${B}`, 50, 125);
      ctx.fillStyle = wireColor(Cin); ctx.fillText(`Cin: ${Cin}`, 50, 165);

      ctx.textAlign = 'left';
      ctx.fillStyle = wireColor(sum); ctx.fillText(`Sum: ${sum}`, 770, 145);
      ctx.fillStyle = wireColor(cout); ctx.fillText(`Cout: ${cout}`, 780, 295);

    } else if (circuitKey === 'half_adder') {
      const A = inputVals[0];
      const B = inputVals[1];
      const sum = outputVals[0];
      const carry = outputVals[1];

      drawGateSymbol(ctx, 'XOR', 320, 130, 80, 60, [A, B], sum, 'XOR (Sum)');
      drawGateSymbol(ctx, 'AND', 320, 280, 80, 60, [A, B], carry, 'AND (Carry)');

      drawManhattanWire(ctx, 80, 120, 320, 120, wireColor(A), A);
      drawManhattanWire(ctx, 80, 160, 320, 160, wireColor(B), B);
      drawManhattanWire(ctx, 160, 120, 320, 270, wireColor(A), A);
      drawManhattanWire(ctx, 180, 160, 320, 300, wireColor(B), B);
      drawManhattanWire(ctx, 400, 150, 700, 150, wireColor(sum), sum);
      drawManhattanWire(ctx, 400, 300, 700, 300, wireColor(carry), carry);

      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = wireColor(A); ctx.fillText(`A: ${A}`, 70, 125);
      ctx.fillStyle = wireColor(B); ctx.fillText(`B: ${B}`, 70, 165);

      ctx.textAlign = 'left';
      ctx.fillStyle = wireColor(sum); ctx.fillText(`Sum: ${sum}`, 710, 155);
      ctx.fillStyle = wireColor(carry); ctx.fillText(`Carry: ${carry}`, 710, 305);

    } else if (circuitKey === 'jk_flip_flop') {
      const j = inputVals[0];
      const k = inputVals[1];
      const clk = inputVals[2];
      const q = outputVals[0];
      const qBar = outputVals[1];

      drawGateSymbol(ctx, 'JK', 360, 140, 130, 160, [j, clk, k], q, 'JK Flip-Flop');

      drawManhattanWire(ctx, 80, 160, 360, 160, wireColor(j), j);
      drawManhattanWire(ctx, 80, 220, 360, 220, '#f59e0b', clk);
      drawManhattanWire(ctx, 80, 275, 360, 275, wireColor(k), k);

      drawManhattanWire(ctx, 490, 175, 720, 175, wireColor(q), q);
      drawManhattanWire(ctx, 490, 260, 720, 260, wireColor(qBar), qBar);

      ctx.font = 'bold 14px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = wireColor(j); ctx.fillText(`J: ${j}`, 70, 165);
      ctx.fillStyle = '#f59e0b'; ctx.fillText(`CLK: ${clk}`, 70, 225);
      ctx.fillStyle = wireColor(k); ctx.fillText(`K: ${k}`, 70, 280);

      ctx.textAlign = 'left';
      ctx.fillStyle = wireColor(q); ctx.fillText(`Q: ${q}`, 730, 180);
      ctx.fillStyle = wireColor(qBar); ctx.fillText(`Q': ${qBar}`, 730, 265);

    } else if (circuitKey === 'custom_sandbox') {
      drawCustomSandbox(ctx, w, h);
      return;
    } else {
      // Generic MSI Block (MUX / Decoder / Counter)
      ctx.fillStyle = '#0a172e';
      ctx.strokeStyle = '#29b6f6';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(280, 80, 240, 280, 12);
      ctx.fill(); ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(curCircuit.name, 400, 120);
      ctx.font = '11px Inter, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(curCircuit.icBadge, 400, 145);

      // Pins labels
      ctx.font = '12px "JetBrains Mono", monospace';
      inputVals.forEach((val, i) => {
        const y = 170 + i * 26;
        drawManhattanWire(ctx, 100, y, 280, y, wireColor(val), val);
        ctx.fillStyle = wireColor(val);
        ctx.textAlign = 'right';
        ctx.fillText(`${curCircuit.inputs[i].name}: ${val}`, 90, y + 4);
      });

      outputVals.forEach((val, i) => {
        const y = 190 + i * 40;
        drawManhattanWire(ctx, 520, y, 700, y, wireColor(val), val);
        ctx.fillStyle = wireColor(val);
        ctx.textAlign = 'left';
        ctx.fillText(`${curCircuit.outputs[i].name}: ${val}`, 710, y + 4);
      });
    }

    // Top Title & Annotation
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`Topological Reverse Kahn DAG Engine &bull; IEEE 1164 Logic Resolution`, 30, 30);
  }

  // Draw Interactive Custom Netlist Sandbox Canvas
  function drawCustomSandbox(ctx, w, h) {
    const wireColor = (val) => {
      if (val === '1') return '#10b981';
      if (val === '0') return '#475569';
      if (val === 'Z') return '#06b6d4';
      return '#ec4899';
    };

    // Top Instruction Banner
    ctx.fillStyle = '#0b1329';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(80, 8, w - 160, 26, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\uD83D\uDEE0\uFE0F Custom Netlist Sandbox \u2022 Drag gates to move \u2022 Click pins to wire \u2022 Select gate/wire + Del to delete', w / 2, 25);

    // 1. Draw Global Inputs on Left
    CustomSandbox.globalInputs.forEach((gIn, idx) => {
      const isHigh = gIn.val === '1';
      const cardY = gIn.y - 18;
      // Switch Card
      ctx.fillStyle = isHigh ? 'rgba(16, 185, 129, 0.15)' : '#0b1329';
      ctx.strokeStyle = isHigh ? '#10b981' : '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(10, cardY, 40, 36, 6);
      ctx.fill(); ctx.stroke();

      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isHigh ? '#10b981' : '#94a3b8';
      ctx.fillText(gIn.name, 30, cardY + 15);
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText(gIn.val, 30, cardY + 29);

      // Pin Port on Right edge of card
      const px = 50;
      const py = gIn.y;
      const isSrc = CustomSandbox.wiringSource && CustomSandbox.wiringSource.compId === '__global_in__' && CustomSandbox.wiringSource.pinIdx === idx;
      const isHov = CustomSandbox.hoveredPin && CustomSandbox.hoveredPin.compId === '__global_in__' && CustomSandbox.hoveredPin.pinIdx === idx;

      ctx.fillStyle = isHigh ? '#10b981' : '#38bdf8';
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();

      if (isSrc || isHov) {
        ctx.strokeStyle = isSrc ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.stroke();
      }
    });

    // 2. Draw Global Outputs on Right
    CustomSandbox.globalOutputs.forEach((gOut, idx) => {
      const isHigh = gOut.val === '1';
      const cardY = gOut.y - 18;
      // Output Card
      ctx.fillStyle = isHigh ? 'rgba(16, 185, 129, 0.15)' : '#0b1329';
      ctx.strokeStyle = isHigh ? '#10b981' : '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(770, cardY, 40, 36, 6);
      ctx.fill(); ctx.stroke();

      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = isHigh ? '#10b981' : '#94a3b8';
      ctx.fillText(gOut.name, 790, cardY + 15);

      // Mini LED status lamp
      ctx.fillStyle = isHigh ? '#10b981' : '#334155';
      ctx.beginPath(); ctx.arc(790, cardY + 26, 4.5, 0, Math.PI * 2); ctx.fill();

      // Pin Port on Left edge of card
      const px = 770;
      const py = gOut.y;
      const isSrc = CustomSandbox.wiringSource && CustomSandbox.wiringSource.compId === '__global_out__' && CustomSandbox.wiringSource.pinIdx === idx;
      const isHov = CustomSandbox.hoveredPin && CustomSandbox.hoveredPin.compId === '__global_out__' && CustomSandbox.hoveredPin.pinIdx === idx;

      ctx.fillStyle = '#94a3b8';
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, Math.PI * 2); ctx.fill();

      if (isSrc || isHov) {
        ctx.strokeStyle = isSrc ? '#10b981' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.stroke();
      }
    });

    // 3. Draw Completed Wires
    CustomSandbox.wires.forEach(wire => {
      const p1 = CustomSandbox.getPinPos(wire.from);
      const p2 = CustomSandbox.getPinPos(wire.to);
      let wireVal = '0';
      if (wire.from.compId === '__global_in__') {
        const srcIn = CustomSandbox.globalInputs[wire.from.pinIdx];
        wireVal = srcIn ? srcIn.val : '0';
      } else {
        const srcComp = CustomSandbox.components.find(c => c.id === wire.from.compId);
        wireVal = (srcComp && srcComp.outVals[wire.from.pinIdx]) ? srcComp.outVals[wire.from.pinIdx] : '0';
      }

      const isSelected = CustomSandbox.selectedWireId === wire.id;
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.beginPath();
        const midX = (p1.x + p2.x) / 2;
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(midX, p1.y);
        ctx.lineTo(midX, p2.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      }

      drawManhattanWire(ctx, p1.x, p1.y, p2.x, p2.y, wireColor(wireVal), wireVal);
    });

    // 4. Draw In-Progress Rubber-Band Wire
    if (CustomSandbox.wiringSource) {
      const p1 = CustomSandbox.getPinPos(CustomSandbox.wiringSource);
      const p2 = CustomSandbox.mousePos;
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      const midX = (p1.x + p2.x) / 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(midX, p1.y);
      ctx.lineTo(midX, p2.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 5. Draw Placed Components
    CustomSandbox.components.forEach(comp => {
      const isSelected = CustomSandbox.selectedCompId === comp.id;

      // Selection Halo
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(comp.x - 5, comp.y - 5, comp.w + 10, comp.h + 10, 8);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Gate Body
      drawGateSymbol(ctx, comp.type, comp.x, comp.y, comp.w, comp.h, comp.inVals, comp.outVals[0], comp.type);

      // Draw Input Pins
      comp.inPins.forEach((pin, pIdx) => {
        const px = comp.x + pin.relX;
        const py = comp.y + pin.relY;
        const isSrc = CustomSandbox.wiringSource && CustomSandbox.wiringSource.compId === comp.id && !CustomSandbox.wiringSource.isOutput && CustomSandbox.wiringSource.pinIdx === pIdx;
        const isHov = CustomSandbox.hoveredPin && CustomSandbox.hoveredPin.compId === comp.id && !CustomSandbox.hoveredPin.isOutput && CustomSandbox.hoveredPin.pinIdx === pIdx;

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();

        if (isSrc || isHov) {
          ctx.strokeStyle = isSrc ? '#10b981' : '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
        }

        // Pin Label
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'left';
        ctx.fillText(pin.name, px + 5, py + 3);
      });

      // Draw Output Pins
      comp.outPins.forEach((pin, pIdx) => {
        const px = comp.x + pin.relX;
        const py = comp.y + pin.relY;
        const outVal = comp.outVals[pIdx] || '0';
        const isSrc = CustomSandbox.wiringSource && CustomSandbox.wiringSource.compId === comp.id && CustomSandbox.wiringSource.isOutput && CustomSandbox.wiringSource.pinIdx === pIdx;
        const isHov = CustomSandbox.hoveredPin && CustomSandbox.hoveredPin.compId === comp.id && CustomSandbox.hoveredPin.isOutput && CustomSandbox.hoveredPin.pinIdx === pIdx;

        ctx.fillStyle = wireColor(outVal);
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();

        if (isSrc || isHov) {
          ctx.strokeStyle = isSrc ? '#10b981' : '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.stroke();
        }

        // Pin Label
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        ctx.fillText(pin.name, px - 5, py + 3);
      });
    });
  }

  // Draw Physical Solderless Breadboard Mode
  function drawBreadboardCanvas(curCircuit, inputVals, outputVals, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#060d1c';
    ctx.fillRect(0, 0, w, h);

    // Solderless Breadboard Plate
    const bx = 60, by = 40, bw = w - 120, bh = h - 80;
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill(); ctx.stroke();

    // Red Power Rail (+5V) & Blue Ground Rail (0V)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(bx + 20, by + 25); ctx.lineTo(bx + bw - 20, by + 25); ctx.stroke();
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(bx + 20, by + 45); ctx.lineTo(bx + bw - 20, by + 45); ctx.stroke();

    // Bottom Rails
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(bx + 20, by + bh - 45); ctx.lineTo(bx + bw - 20, by + bh - 45); ctx.stroke();
    ctx.strokeStyle = '#3b82f6';
    ctx.beginPath(); ctx.moveTo(bx + 20, by + bh - 25); ctx.lineTo(bx + bw - 20, by + bh - 25); ctx.stroke();

    // Tie-Point Holes Matrix
    ctx.fillStyle = '#64748b';
    for (let c = bx + 50; c < bx + bw - 40; c += 16) {
      for (let r = by + 80; r < by + bh - 80; r += 16) {
        // Skip center dividing ravine
        if (r > by + bh / 2 - 20 && r < by + bh / 2 + 20) continue;
        ctx.beginPath(); ctx.arc(c, r, 2.2, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Central DIP IC Socket
    const icX = bx + bw / 2 - 90;
    const icY = by + bh / 2 - 35;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(icX, icY, 180, 70, 4); ctx.fill(); ctx.stroke();

    // Notch on Left
    ctx.beginPath(); ctx.arc(icX, icY + 35, 8, -Math.PI / 2, Math.PI / 2); ctx.stroke();

    // Silver DIP Pins
    for (let p = 0; p < 7; p++) {
      const px = icX + 20 + p * 22;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(px, icY - 8, 8, 8); // Top pins
      ctx.fillRect(px, icY + 70, 8, 8); // Bottom pins
    }

    // Chip Part Number Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(curCircuit.chipName.split('&bull;')[0].trim(), icX + 90, icY + 35);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('TTL DIP-14 PACKAGE', icX + 90, icY + 52);

    // Colored Jumper Wires connecting to DIP pins
    inputVals.forEach((val, i) => {
      const color = (val === '1') ? '#10b981' : '#64748b';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(bx + 40, by + 120 + i * 35);
      ctx.bezierCurveTo(bx + 140, by + 120 + i * 35, icX - 40, icY + 20 + i * 15, icX + 25 + i * 22, icY - 5);
      ctx.stroke();
    });

    outputVals.forEach((val, i) => {
      const color = (val === '1') ? '#10b981' : '#64748b';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(icX + 60 + i * 40, icY + 75);
      ctx.bezierCurveTo(icX + 160, by + bh - 100, bx + bw - 100, by + 140 + i * 40, bx + bw - 30, by + 140 + i * 40);
      ctx.stroke();
    });

    // Top status banner
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    ctx.fillText('SOLDERLESS BREADBOARD EXPERIMENTAL JIG &bull; 7400 SERIES TTL CHIP', bx + 20, by - 12);
  }

  // Draw Gate Symbol Helper
  function drawGateSymbol(ctx, type, x, y, gw, gh, inVals, outVal, label) {
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = (outVal === '1') ? '#10b981' : (outVal === 'X' ? '#ec4899' : '#38bdf8');
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    if (type === 'AND') {
      ctx.moveTo(x, y);
      ctx.lineTo(x + gw * 0.6, y);
      ctx.arc(x + gw * 0.6, y + gh / 2, gh / 2, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(x, y + gh);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (type === 'NAND') {
      ctx.moveTo(x, y);
      ctx.lineTo(x + gw * 0.55, y);
      ctx.arc(x + gw * 0.55, y + gh / 2, gh / 2, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(x, y + gh);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Invert bubble
      ctx.beginPath();
      ctx.arc(x + gw * 0.55 + gh / 2 + 4, y + gh / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill(); ctx.stroke();
    } else if (type === 'OR') {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + gw * 0.7, y + gh * 0.1, x + gw, y + gh / 2);
      ctx.quadraticCurveTo(x + gw * 0.7, y + gh * 0.9, x, y + gh);
      ctx.quadraticCurveTo(x + gw * 0.3, y + gh / 2, x, y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (type === 'NOR') {
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + gw * 0.65, y + gh * 0.1, x + gw - 6, y + gh / 2);
      ctx.quadraticCurveTo(x + gw * 0.65, y + gh * 0.9, x, y + gh);
      ctx.quadraticCurveTo(x + gw * 0.3, y + gh / 2, x, y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Invert bubble
      ctx.beginPath();
      ctx.arc(x + gw - 1, y + gh / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill(); ctx.stroke();
    } else if (type === 'NOT') {
      ctx.moveTo(x, y);
      ctx.lineTo(x + gw - 10, y + gh / 2);
      ctx.lineTo(x, y + gh);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Invert bubble
      ctx.beginPath();
      ctx.arc(x + gw - 5, y + gh / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill(); ctx.stroke();
    } else if (type === 'XOR') {
      // Curved back and double back line
      ctx.moveTo(x + 10, y);
      ctx.quadraticCurveTo(x + gw * 0.7, y + gh * 0.1, x + gw, y + gh / 2);
      ctx.quadraticCurveTo(x + gw * 0.7, y + gh * 0.9, x + 10, y + gh);
      ctx.quadraticCurveTo(x + gw * 0.3 + 10, y + gh / 2, x + 10, y);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      // Outer curved bar
      ctx.beginPath();
      ctx.arc(x, y + gh / 2, gh * 0.6, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    } else if (type === 'MUX') {
      // Trapezoid
      ctx.moveTo(x, y);
      ctx.lineTo(x + gw, y + 10);
      ctx.lineTo(x + gw, y + gh - 10);
      ctx.lineTo(x, y + gh);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (type === 'JK') {
      ctx.roundRect(x, y, gw, gh, 8);
      ctx.fill(); ctx.stroke();
    } else {
      ctx.rect(x, y, gw, gh);
      ctx.fill(); ctx.stroke();
    }

    // Gate Label Inside
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label || type, x + gw / 2, y + gh / 2 + 4);
  }

  // Manhattan Wire Route Helper
  function drawManhattanWire(ctx, x1, y1, x2, y2, color, val) {
    ctx.strokeStyle = color || '#334155';
    ctx.lineWidth = (val === '1') ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    const midX = (x1 + x2) / 2;
    ctx.lineTo(midX, y1);
    ctx.lineTo(midX, y2);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Terminal Node Dots
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x1, y1, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x2, y2, 3, 0, Math.PI * 2); ctx.fill();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 6. KARNAUGH MAP (K-MAP) GENERATOR & SOP MINIMIZER
  // ══════════════════════════════════════════════════════════════════════════
  const KMapModule = {
    // 3-variable grid (A \ BC): 2 rows, 4 columns
    cells: [
      ['0', '1', '0', '1'], // A=0: 00, 01, 11, 10
      ['1', '0', '1', '0']  // A=1: 00, 01, 11, 10
    ],

    init(curCircuit) {
      this.updateForCircuit(curCircuit);
      this.render();
    },

    updateForCircuit(curCircuit) {
      if (!curCircuit) return;
      // Populate K-map cells based on circuit truth table
      if (curCircuit.name === '1-Bit Full Adder') {
        // Sum values
        this.cells = [
          ['0', '1', '1', '0'], // A=0, BC: 00(0), 01(1), 11(0), 10(1)
          ['1', '0', '1', '0']  // A=1, BC: 00(1), 01(0), 11(1), 10(0)
        ];
      } else if (curCircuit.name && curCircuit.name.includes('Custom')) {
        try {
          this.cells = [
            [curCircuit.evaluate(['0', '0', '0']).outputs[0], curCircuit.evaluate(['0', '0', '1']).outputs[0], curCircuit.evaluate(['0', '1', '1']).outputs[0], curCircuit.evaluate(['0', '1', '0']).outputs[0]],
            [curCircuit.evaluate(['1', '0', '0']).outputs[0], curCircuit.evaluate(['1', '0', '1']).outputs[0], curCircuit.evaluate(['1', '1', '1']).outputs[0], curCircuit.evaluate(['1', '1', '0']).outputs[0]]
          ];
        } catch (e) {
          this.cells = [['0', '0', '0', '0'], ['0', '0', '0', '0']];
        }
      } else {
        this.cells = [
          ['0', '1', '0', '1'],
          ['1', '0', '1', '0']
        ];
      }
      this.render();
    },

    render() {
      const tbody = document.getElementById('kmap-body');
      if (!tbody) return;
      let html = '';
      const rowLabels = ['A = 0', 'A = 1'];

      this.cells.forEach((row, rIdx) => {
        html += `<tr><th>${rowLabels[rIdx]}</th>`;
        row.forEach((val, cIdx) => {
          const cls = (val === '1') ? 'state-1' : (val === 'X' ? 'state-x' : '');
          html += `<td class="kmap-cell ${cls}" data-r="${rIdx}" data-c="${cIdx}">${val}</td>`;
        });
        html += `</tr>`;
      });
      tbody.innerHTML = html;

      // Cell click to toggle 0 -> 1 -> X -> 0
      tbody.querySelectorAll('.kmap-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const r = parseInt(cell.dataset.r, 10);
          const c = parseInt(cell.dataset.c, 10);
          const cur = this.cells[r][c];
          this.cells[r][c] = (cur === '0') ? '1' : (cur === '1' ? 'X' : '0');
          this.render();
          SoundFX.switchClick();
        });
      });
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 7. TRUTH TABLE INSPECTOR
  // ══════════════════════════════════════════════════════════════════════════
  const TruthTableModule = {
    render(curCircuit, currentInputs) {
      const headerTr = document.getElementById('tt-header-tr');
      const tbody = document.getElementById('tt-tbody');
      if (!headerTr || !tbody) return;

      const inNames = curCircuit.inputs.map(i => i.name);
      const outNames = curCircuit.outputs.map(o => o.name);

      headerTr.innerHTML = `<th>Row</th>${inNames.map(n => `<th>${n}</th>`).join('')}${outNames.map(n => `<th style="color:#38bdf8;">${n}</th>`).join('')}`;

      const numRows = Math.pow(2, inNames.length);
      let html = '';

      for (let r = 0; r < numRows; r++) {
        const binVec = [];
        for (let b = inNames.length - 1; b >= 0; b--) {
          binVec.push(((r >> b) & 1).toString());
        }

        const evalRes = curCircuit.evaluate(binVec);
        const outs = evalRes.outputs;

        // Check if this row matches active user switch inputs
        const isActive = inNames.every((_, idx) => binVec[idx] === (currentInputs[idx] || '0'));

        html += `<tr class="${isActive ? 'truth-row-active' : ''}">
          <td style="color:#64748b;">m${r}</td>
          ${binVec.map(b => `<td style="font-weight:700;">${b}</td>`).join('')}
          ${outs.map(o => `<td style="color:${o === '1' ? '#10b981' : '#cbd5e1'};font-weight:800;">${o}</td>`).join('')}
        </tr>`;
      }
      tbody.innerHTML = html;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 8. INTERACTIVE DIGITAL DESIGN CHALLENGE ENGINE
  // ══════════════════════════════════════════════════════════════════════════
  const ChallengeEngine = {
    currentTrack: 1,
    currentIdx: 0,
    score: 0,
    streak: 0,

    challenges: [
      {
        track: 'Track 1: Universal NAND Gates',
        title: 'Challenge 1: Implement 2-Input XOR with NAND Gates',
        desc: 'Construct a 2-Input Exclusive-OR (XOR) gate using EXACTLY 4 two-input NAND gates and no other gate types.',
        options: [
          { text: 'A. Connect 3 NAND gates in series with an inverter at the output', correct: false },
          { text: 'B. Compute (A·B)\' with NAND 1, route to NAND 2 with A and NAND 3 with B, then combine in NAND 4', correct: true },
          { text: 'C. Connect 4 NAND gates in parallel and tie all outputs to a pull-up resistor', correct: false },
          { text: 'D. An XOR gate cannot be constructed with NAND gates alone', correct: false }
        ],
        derivation: 'A ⊕ B = A·B\' + A\'·B = (A·(A·B)\')\' · (B·(A·B)\')\'. NAND 1 produces (A·B)\'. NAND 2 computes (A·(A·B)\')\'. NAND 3 computes (B·(A·B)\')\'. NAND 4 combines them, yielding A ⊕ B in exactly 4 gates.'
      },
      {
        track: 'Track 2: Hazard Hunting & Consensus',
        title: 'Challenge 2: Eliminate Static-1 Glitch in K-Map',
        desc: 'Given the function F = A\'·C + B·C\', an asynchronous transition of variable C from 1 to 0 can produce a momentary false 0 glitch (Static-1 Hazard).',
        options: [
          { text: 'A. Add the consensus term A\'·B to bridge the adjacent K-Map loops', correct: true },
          { text: 'B. Remove all AND gates from the circuit', correct: false },
          { text: 'C. Increase clock frequency by 10x', correct: false },
          { text: 'D. Replace all connections with open-collector buffers', correct: false }
        ],
        derivation: 'In the K-Map, the prime implicants A\'C and BC\' are adjacent but not overlapped. When C transitions, gate delay causes both terms to be 0 temporarily. Adding the redundant consensus term A\'B covers both states and eliminates the hazard.'
      },
      {
        track: 'Track 3: Sequential Counters',
        title: 'Challenge 3: Modulo-4 Up Counter JK Configuration',
        desc: 'To construct a 2-bit Synchronous Mod-4 Up Counter using two JK Flip-Flops (FF0 and FF1):',
        options: [
          { text: 'A. J0=0, K0=0 and J1=1, K1=1', correct: false },
          { text: 'B. J0=1, K0=1 and J1=Q0, K1=Q0 with common Clock', correct: true },
          { text: 'C. Tie clock to Q0 with asynchronous ripple cascade', correct: false },
          { text: 'D. Invert Q1 and feedback to J0', correct: false }
        ],
        derivation: 'In a synchronous counter, FF0 toggles on every clock edge (J0=K0=1). FF1 toggles only when FF0 was in state 1 (J1=K1=Q0). Both share the same synchronous clock.'
      }
    ],

    init() {
      this.render();
      document.getElementById('btn-check-ch').addEventListener('click', () => this.checkAnswer());
      document.getElementById('btn-toggle-ch-deriv').addEventListener('click', () => {
        const box = document.getElementById('ch-derivation-box');
        box.classList.toggle('hidden');
      });
      document.getElementById('btn-next-ch').addEventListener('click', () => this.nextChallenge());
    },

    render() {
      const ch = this.challenges[this.currentIdx];
      if (!ch) return;

      document.getElementById('ch-track-name').textContent = ch.track;
      document.getElementById('ch-title').textContent = ch.title;
      document.getElementById('ch-desc').textContent = ch.desc;
      document.getElementById('ch-derivation-box').textContent = ch.derivation;
      document.getElementById('ch-derivation-box').classList.add('hidden');

      const container = document.getElementById('ch-options-container');
      container.innerHTML = '';
      ch.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'challenge-option-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          container.querySelectorAll('.challenge-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.selectedIdx = idx;
        });
        container.appendChild(btn);
      });
      this.selectedIdx = -1;
    },

    checkAnswer() {
      if (this.selectedIdx === -1) {
        const container = document.getElementById('ch-options-container');
        if (container) {
          container.style.boxShadow = '0 0 0 2px #f43f5e';
          setTimeout(() => { if (container) container.style.boxShadow = ''; }, 900);
        }
        return;
      }
      const ch = this.challenges[this.currentIdx];
      const isCorrect = ch.options[this.selectedIdx].correct;
      const btns = document.querySelectorAll('#ch-options-container .challenge-option-btn');

      btns.forEach((b, idx) => {
        if (ch.options[idx].correct) b.classList.add('correct');
        else if (idx === this.selectedIdx) b.classList.add('wrong');
      });

      if (isCorrect) {
        this.score += 150;
        this.streak++;
        SoundFX.successChord();
      } else {
        this.streak = 0;
        SoundFX.contentionBuzz();
      }

      document.getElementById('ch-score').textContent = this.score;
      document.getElementById('ch-streak').textContent = `★ ${this.streak}`;
      document.getElementById('ch-derivation-box').classList.remove('hidden');
    },

    nextChallenge() {
      this.currentIdx = (this.currentIdx + 1) % this.challenges.length;
      this.render();
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 9. DIGITAL DESIGN QUIZ MODULE (10 QUESTIONS)
  // ══════════════════════════════════════════════════════════════════════════
  const QuizModule = {
    score: 0,
    questions: [
      {
        q: '1. Which of the following pairs of logic gates are known as Universal Gates?',
        opts: ['A. AND and OR', 'B. NAND and NOR', 'C. XOR and XNOR', 'D. NOT and BUFFER'],
        ans: 1,
        exp: 'NAND and NOR can independently implement all elementary Boolean functions without any other gate.'
      },
      {
        q: '2. In an IEEE 1164 digital logic simulator, what does logic state "X" represent?',
        opts: ['A. High-Impedance', 'B. Unknown / Bus Contention', 'C. Constant 5V', 'D. Ground'],
        ans: 1,
        exp: 'X represents an unknown or invalid state, typically caused by bus contention or uninitialized flip-flops.'
      },
      {
        q: '3. A Full Adder computes the sum of three binary bits (A, B, Cin). The output Sum expression is:',
        opts: ['A. A · B + Cin', 'B. A ⊕ B ⊕ Cin', 'C. (A + B) · Cin', 'D. A ⊙ B ⊙ Cin'],
        ans: 1,
        exp: 'Sum = A ⊕ B ⊕ Cin; Cout = AB + BCin + ACin.'
      },
      {
        q: '4. In a Karnaugh Map, cells are arranged in Gray-code sequence so that adjacent cells differ by:',
        opts: ['A. Exactly 1 bit', 'B. Exactly 2 bits', 'C. Any power of 2 bits', 'D. Random bits'],
        ans: 0,
        exp: 'Gray-code ensures only one variable changes state between adjacent cells, allowing common terms to factor out.'
      },
      {
        q: '5. When both J and K inputs of a JK Flip-Flop are held HIGH (J=1, K=1), what happens on each active clock edge?',
        opts: ['A. Q resets to 0', 'B. Q sets to 1', 'C. Q toggles to its complement (Q_next = Q\')', 'D. Enters race condition'],
        ans: 2,
        exp: 'J=1, K=1 places the JK flip-flop in toggle mode, dividing clock frequency by 2.'
      },
      {
        q: '6. What is the fundamental requirement to avoid metastability in an edge-triggered flip-flop?',
        opts: ['A. Data input must change exactly at the clock edge', 'B. Data must remain stable for setup time (ts) before and hold time (th) after the clock edge', 'C. Clock voltage must exceed 10V', 'D. Power rail must be AC'],
        ans: 1,
        exp: 'Violating setup time (ts) or hold time (th) creates a race condition in the internal latch, causing output oscillation.'
      },
      {
        q: '7. How many 2-to-1 Multiplexers are required to construct a 4-to-1 Multiplexer?',
        opts: ['A. 1', 'B. 2', 'C. 3 (2 for first stage, 1 for second stage)', 'D. 4'],
        ans: 2,
        exp: 'Two 2:1 MUXes select between (D0, D1) and (D2, D3) using S0, and a third 2:1 MUX selects between the results using S1.'
      },
      {
        q: '8. In a 7400-series TTL IC, pin 7 and pin 14 on a standard DIP-14 package are typically assigned to:',
        opts: ['A. Input A and Input B', 'B. GND (0V) and VCC (+5V)', 'C. Clock and Reset', 'D. Q and Q_bar'],
        ans: 1,
        exp: 'Pin 7 is standard GND (Ground) and Pin 14 is VCC (+5V DC power).'
      },
      {
        q: '9. A 4-bit binary ripple counter constructed from 4 cascaded toggle flip-flops has a modulus of:',
        opts: ['A. 4', 'B. 8', 'C. 16 (Counts 0 to 15)', 'D. 32'],
        ans: 2,
        exp: 'An n-bit binary counter has 2^n states. For n=4, 2^4 = 16 states (Mod-16).'
      },
      {
        q: '10. What is De Morgan\'s second law of Boolean algebra?',
        opts: ['A. (A + B)\' = A\' · B\'', 'B. (A · B)\' = A · B', 'C. A + A = 1', 'D. A · 0 = 1'],
        ans: 0,
        exp: 'De Morgan\'s laws: (A · B)\' = A\' + B\' and (A + B)\' = A\' · B\'.'
      }
    ],

    init() {
      const container = document.getElementById('quiz-questions-list');
      if (!container) return;
      container.innerHTML = '';

      this.questions.forEach((qObj, qIdx) => {
        const item = document.createElement('div');
        item.className = 'quiz-item';
        item.innerHTML = `
          <div class="quiz-q-text">${qObj.q}</div>
          <div class="quiz-opt-list" id="q-opts-${qIdx}">
            ${qObj.opts.map((opt, oIdx) => `<button class="quiz-opt-btn" data-q="${qIdx}" data-o="${oIdx}">${opt}</button>`).join('')}
          </div>
          <div class="quiz-explanation" id="q-exp-${qIdx}">${qObj.exp}</div>
        `;
        container.appendChild(item);
      });

      container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const qIdx = parseInt(btn.dataset.q, 10);
          const oIdx = parseInt(btn.dataset.o, 10);
          this.answer(qIdx, oIdx);
        });
      });
    },

    answer(qIdx, oIdx) {
      const qObj = this.questions[qIdx];
      const optList = document.getElementById(`q-opts-${qIdx}`);
      if (!optList || optList.dataset.answered) return;
      optList.dataset.answered = 'true';

      const expEl = document.getElementById(`q-exp-${qIdx}`);
      const btns = optList.querySelectorAll('.quiz-opt-btn');

      if (oIdx === qObj.ans) {
        btns[oIdx].classList.add('correct');
        this.score++;
        SoundFX.successChord();
      } else {
        btns[oIdx].classList.add('wrong');
        btns[qObj.ans].classList.add('correct');
        SoundFX.contentionBuzz();
      }

      if (expEl) expEl.style.display = 'block';
      const scoreVal = document.getElementById('quiz-score-val');
      if (scoreVal) scoreVal.textContent = this.score;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // 10. MAIN APP CONTROLLER & DOM BINDINGS
  // ══════════════════════════════════════════════════════════════════════════
  window.addEventListener('DOMContentLoaded', () => {
    let currentCircuitKey = 'full_adder';
    let currentViewMode = 'schematic'; // 'schematic' | 'breadboard'
    let autoClockTimer = null;
    let clkState = '0';

    const canvas = document.getElementById('dld-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const analyzer = new LogicAnalyzer('analyzer-canvas');

    function getActiveCircuit() {
      return CIRCUITS[currentCircuitKey];
    }

    function syncUI() {
      const cur = getActiveCircuit();
      const inputVals = cur.inputs.map(i => i.val);
      const evalRes = cur.evaluate(inputVals, cur.state, false);
      const outputVals = evalRes.outputs;

      // Update badge & title
      const badge = document.getElementById('circuit-badge');
      if (badge) badge.textContent = cur.name;

      const chipTitle = document.getElementById('ic-chip-name');
      if (chipTitle) chipTitle.textContent = cur.chipName;

      // Update Input Buttons
      const swContainer = document.getElementById('switches-container');
      if (swContainer) {
        let swHtml = '<span class="ctrl-label">Inputs:</span>';
        cur.inputs.forEach((inp, idx) => {
          swHtml += `<button class="btn-toggle-switch ${inp.val === '1' ? 'active' : ''}" data-idx="${idx}">
            ${inp.name}: ${inp.val}
          </button>`;
        });
        swContainer.innerHTML = swHtml;

        swContainer.querySelectorAll('.btn-toggle-switch').forEach(btn => {
          btn.addEventListener('click', () => {
            SoundFX.init();
            SoundFX.switchClick();
            const idx = parseInt(btn.dataset.idx, 10);
            cur.inputs[idx].val = (cur.inputs[idx].val === '1') ? '0' : '1';
            syncUI();
          });
        });
      }

      // Update Output LEDs
      const ledsContainer = document.getElementById('leds-container');
      if (ledsContainer) {
        let ledHtml = '<span class="ctrl-label">Outputs:</span>';
        cur.outputs.forEach((out, idx) => {
          const val = outputVals[idx] || '0';
          ledHtml += `<div class="led-indicator-card">
            <span class="led-lamp ${val === '1' ? 'on' : ''}"></span>
            <span>${out.name}: ${val}</span>
          </div>`;
        });
        ledsContainer.innerHTML = ledHtml;
      }

      // Update Formula display
      const sopBox = document.getElementById('kmap-sop-expr');
      if (sopBox) sopBox.innerHTML = cur.sop;
      const carryBox = document.getElementById('kmap-carry-expr');
      if (carryBox) carryBox.innerHTML = cur.pos;

      // Update Truth Table & K-Map
      TruthTableModule.render(cur, inputVals);
      KMapModule.updateForCircuit(cur);

      // Record to Logic Analyzer
      const sampleMap = { CLK: clkState };
      cur.inputs.forEach((inp, i) => sampleMap[inp.name] = inputVals[i]);
      cur.outputs.forEach((out, i) => sampleMap[out.name] = outputVals[i]);
      analyzer.recordSample(sampleMap);

      // Draw Main Canvas
      if (ctx) {
        if (currentViewMode === 'schematic') {
          drawSchematicCanvas(currentCircuitKey, cur, inputVals, outputVals, ctx, canvas.width, canvas.height);
        } else {
          drawBreadboardCanvas(cur, inputVals, outputVals, ctx, canvas.width, canvas.height);
        }
      }
    }

    // Switch between Presets
    document.getElementById('circuit-preset-select').addEventListener('change', (e) => {
      currentCircuitKey = e.target.value;
      const cur = getActiveCircuit();
      const channelNames = ['CLK', ...cur.inputs.map(i => i.name), ...cur.outputs.map(o => o.name)];
      analyzer.resetChannels(channelNames);
      syncUI();
    });

    // View Mode Switcher (Schematic vs. Breadboard)
    document.querySelectorAll('#view-mode-tabs .view-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#view-mode-tabs .view-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentViewMode = btn.dataset.view;

        const titleEl = document.getElementById('canvas-view-title');
        const subtextEl = document.getElementById('canvas-view-subtext');
        if (currentViewMode === 'schematic') {
          if (titleEl) titleEl.innerHTML = '&#128208; Vector Schematic Netlist Canvas';
          if (subtextEl) subtextEl.textContent = '[IEEE / ANSI Symbols with 4-State Live Streamers]';
        } else {
          if (titleEl) titleEl.innerHTML = '&#128187; Solderless Breadboard Jig';
          if (subtextEl) subtextEl.textContent = '[Real TTL DIP-14/16 ICs, Jumper Wires & Tie-Points]';
        }
        syncUI();
      });
    });

    // Clock Execution Buttons
    function triggerClockPulse() {
      SoundFX.init();
      SoundFX.clockTick();
      clkState = (clkState === '0') ? '1' : '0';
      const cur = getActiveCircuit();
      const inputVals = cur.inputs.map(i => i.val);
      // Evaluate on rising edge
      if (cur.evaluate) {
        cur.evaluate(inputVals, cur.state, clkState === '1');
      }
      syncUI();
    }

    document.getElementById('btn-pulse-clk').addEventListener('click', triggerClockPulse);

    document.getElementById('btn-auto-clk').addEventListener('click', (e) => {
      SoundFX.init();
      if (autoClockTimer) {
        clearInterval(autoClockTimer);
        autoClockTimer = null;
        e.target.innerHTML = '&#9199; Auto CLK';
      } else {
        const freq = parseFloat(document.getElementById('clk-freq-slider').value) || 1.0;
        const interval = Math.max(50, 1000 / (freq * 2));
        autoClockTimer = setInterval(triggerClockPulse, interval);
        e.target.innerHTML = '&#9208; Pause CLK';
      }
    });

    document.getElementById('clk-freq-slider').addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      document.getElementById('clk-freq-val').textContent = `${val.toFixed(1)}Hz`;
      if (autoClockTimer) {
        clearInterval(autoClockTimer);
        const interval = Math.max(50, 1000 / (val * 2));
        autoClockTimer = setInterval(triggerClockPulse, interval);
      }
    });

    document.getElementById('btn-reset-circuit').addEventListener('click', () => {
      const cur = getActiveCircuit();
      cur.inputs.forEach(inp => inp.val = '0');
      if (cur.state) {
        Object.keys(cur.state).forEach(k => cur.state[k] = '0');
      }
      clkState = '0';
      syncUI();
    });

    document.getElementById('btn-sound-toggle').addEventListener('click', () => {
      SoundFX.toggle();
    });

    document.getElementById('btn-clear-traces').addEventListener('click', () => {
      const cur = getActiveCircuit();
      const channelNames = ['CLK', ...cur.inputs.map(i => i.name), ...cur.outputs.map(o => o.name)];
      analyzer.resetChannels(channelNames);
      analyzer.draw();
    });

    // Right Pane Tab Switching
    document.querySelectorAll('#analysis-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#analysis-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.tab;

        ['tab-analyzer', 'tab-kmap', 'tab-tt', 'tab-pinout', 'tab-challenge'].forEach(id => {
          document.getElementById(id).classList.toggle('hidden', id !== target);
        });
      });
    });

    // Canonical Mode Switcher (Simulate / 3D Model / Theory / Quiz)
    document.querySelectorAll('#mode-tabs .pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#mode-tabs .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const mode = pill.dataset.mode;

        document.getElementById('sim-wrapper').classList.toggle('hidden', mode !== 'simulate');
        document.getElementById('model3d-wrapper').classList.toggle('hidden', mode !== '3d-model');
        document.getElementById('explore-wrapper').classList.toggle('hidden', mode !== 'explore');
        document.getElementById('quiz-wrapper').classList.toggle('hidden', mode !== 'quiz');

        if (mode === '3d-model' && !window.three3DInitialized) {
          init3DModel();
        }
      });
    });

    // ══════════════════════════════════════════════════════════════════════
    // INTERACTIVE CUSTOM SANDBOX CANVAS CONTROLS & WIRING
    // ══════════════════════════════════════════════════════════════════════

    // Helper: Map client mouse to canvas coordinates
    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    // Helper: Pin hit test
    function findHitPin(mx, my) {
      // 1. Global inputs (source pins)
      for (let i = 0; i < CustomSandbox.globalInputs.length; i++) {
        const pos = CustomSandbox.getPinPos({ compId: '__global_in__', pinIdx: i, isOutput: true });
        if (Math.hypot(mx - pos.x, my - pos.y) <= 12) {
          return { compId: '__global_in__', pinIdx: i, isOutput: true, name: CustomSandbox.globalInputs[i].name };
        }
      }
      // 2. Global outputs (sink pins)
      for (let i = 0; i < CustomSandbox.globalOutputs.length; i++) {
        const pos = CustomSandbox.getPinPos({ compId: '__global_out__', pinIdx: i, isOutput: false });
        if (Math.hypot(mx - pos.x, my - pos.y) <= 12) {
          return { compId: '__global_out__', pinIdx: i, isOutput: false, name: CustomSandbox.globalOutputs[i].name };
        }
      }
      // 3. Components
      for (const comp of CustomSandbox.components) {
        // Inputs
        for (let pIdx = 0; pIdx < comp.inPins.length; pIdx++) {
          const pin = comp.inPins[pIdx];
          const px = comp.x + pin.relX;
          const py = comp.y + pin.relY;
          if (Math.hypot(mx - px, my - py) <= 12) {
            return { compId: comp.id, pinIdx: pIdx, isOutput: false, name: `${comp.type}.${pin.name}` };
          }
        }
        // Outputs
        for (let pIdx = 0; pIdx < comp.outPins.length; pIdx++) {
          const pin = comp.outPins[pIdx];
          const px = comp.x + pin.relX;
          const py = comp.y + pin.relY;
          if (Math.hypot(mx - px, my - py) <= 12) {
            return { compId: comp.id, pinIdx: pIdx, isOutput: true, name: `${comp.type}.${pin.name}` };
          }
        }
      }
      return null;
    }

    // Helper: Component hit test
    function findHitComponent(mx, my) {
      for (let i = CustomSandbox.components.length - 1; i >= 0; i--) {
        const c = CustomSandbox.components[i];
        if (mx >= c.x - 4 && mx <= c.x + c.w + 4 && my >= c.y - 4 && my <= c.y + c.h + 4) {
          return c;
        }
      }
      return null;
    }

    // Helper: Wire hit test
    function findHitWire(mx, my) {
      for (let i = CustomSandbox.wires.length - 1; i >= 0; i--) {
        const wire = CustomSandbox.wires[i];
        const p1 = CustomSandbox.getPinPos(wire.from);
        const p2 = CustomSandbox.getPinPos(wire.to);
        const midX = (p1.x + p2.x) / 2;

        const hitSeg1 = Math.abs(my - p1.y) <= 8 && mx >= Math.min(p1.x, midX) - 5 && mx <= Math.max(p1.x, midX) + 5;
        const hitSeg2 = Math.abs(mx - midX) <= 8 && my >= Math.min(p1.y, p2.y) - 5 && my <= Math.max(p1.y, p2.y) + 5;
        const hitSeg3 = Math.abs(my - p2.y) <= 8 && mx >= Math.min(midX, p2.x) - 5 && mx <= Math.max(midX, p2.x) + 5;

        if (hitSeg1 || hitSeg2 || hitSeg3) {
          return wire;
        }
      }
      return null;
    }

    // Helper: Connect two pins
    function connectPins(pA, pB) {
      if (pA.isOutput === pB.isOutput) return false;
      const src = pA.isOutput ? pA : pB;
      const dst = pA.isOutput ? pB : pA;

      if (src.compId === dst.compId) return false;

      // Remove existing wire to destination input (single driver rule)
      CustomSandbox.wires = CustomSandbox.wires.filter(w => !(w.to.compId === dst.compId && w.to.pinIdx === dst.pinIdx));

      CustomSandbox.wires.push({
        id: 'w_' + (++CustomSandbox.nextId),
        from: { compId: src.compId, pinIdx: src.pinIdx, isOutput: true },
        to: { compId: dst.compId, pinIdx: dst.pinIdx, isOutput: false }
      });

      return true;
    }

    // Canvas Mouse Interaction Handlers
    canvas.addEventListener('mousedown', (e) => {
      if (currentCircuitKey !== 'custom_sandbox' || currentViewMode !== 'schematic') return;
      SoundFX.init();
      const coords = getCanvasCoords(e);
      const mx = coords.x, my = coords.y;

      // 1. Check if clicking on Global Input Switch Card directly on canvas
      for (let i = 0; i < CustomSandbox.globalInputs.length; i++) {
        const gIn = CustomSandbox.globalInputs[i];
        if (mx >= 10 && mx <= 50 && my >= gIn.y - 18 && my <= gIn.y + 18) {
          gIn.val = (gIn.val === '1') ? '0' : '1';
          SoundFX.switchClick();
          syncUI();
          return;
        }
      }

      // 2. Check Pin Click (Wiring)
      const hitPin = findHitPin(mx, my);
      if (hitPin) {
        if (!CustomSandbox.wiringSource) {
          CustomSandbox.wiringSource = hitPin;
          SoundFX.switchClick();
        } else {
          if (connectPins(CustomSandbox.wiringSource, hitPin)) {
            SoundFX.successChord();
          } else {
            SoundFX.switchClick();
          }
          CustomSandbox.wiringSource = null;
        }
        syncUI();
        return;
      }

      // If clicked elsewhere while wiring in progress, cancel wiring
      if (CustomSandbox.wiringSource) {
        CustomSandbox.wiringSource = null;
        syncUI();
        return;
      }

      // 3. Check Component Click (Select & Drag)
      const hitComp = findHitComponent(mx, my);
      if (hitComp) {
        CustomSandbox.selectedCompId = hitComp.id;
        CustomSandbox.selectedWireId = null;
        CustomSandbox.draggingComp = hitComp;
        CustomSandbox.dragOffset = { x: mx - hitComp.x, y: my - hitComp.y };
        SoundFX.switchClick();
        syncUI();
        return;
      }

      // 4. Check Wire Click (Select Wire)
      const hitWire = findHitWire(mx, my);
      if (hitWire) {
        CustomSandbox.selectedWireId = hitWire.id;
        CustomSandbox.selectedCompId = null;
        SoundFX.switchClick();
        syncUI();
        return;
      }

      // 5. Empty Canvas Click (Deselect)
      CustomSandbox.selectedCompId = null;
      CustomSandbox.selectedWireId = null;
      syncUI();
    });

    canvas.addEventListener('mousemove', (e) => {
      if (currentCircuitKey !== 'custom_sandbox' || currentViewMode !== 'schematic') return;
      const coords = getCanvasCoords(e);
      CustomSandbox.mousePos = coords;

      if (CustomSandbox.draggingComp) {
        CustomSandbox.draggingComp.x = Math.max(70, Math.min(680, Math.round((coords.x - CustomSandbox.dragOffset.x) / 10) * 10));
        CustomSandbox.draggingComp.y = Math.max(40, Math.min(410, Math.round((coords.y - CustomSandbox.dragOffset.y) / 10) * 10));
        syncUI();
        return;
      }

      // Update Hover
      const hitPin = findHitPin(coords.x, coords.y);
      const prevHovered = CustomSandbox.hoveredPin;
      CustomSandbox.hoveredPin = hitPin;

      if (hitPin) {
        canvas.style.cursor = 'crosshair';
      } else if (findHitComponent(coords.x, coords.y)) {
        canvas.style.cursor = 'move';
      } else if (findHitWire(coords.x, coords.y)) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }

      if (CustomSandbox.wiringSource || (hitPin && !prevHovered) || (!hitPin && prevHovered)) {
        syncUI();
      }
    });

    canvas.addEventListener('mouseup', () => {
      if (CustomSandbox.draggingComp) {
        CustomSandbox.draggingComp = null;
        syncUI();
      }
    });

    canvas.addEventListener('mouseleave', () => {
      CustomSandbox.draggingComp = null;
      CustomSandbox.hoveredPin = null;
      canvas.style.cursor = 'default';
      if (currentCircuitKey === 'custom_sandbox') {
        syncUI();
      }
    });

    // Keyboard Del / Backspace handler
    window.addEventListener('keydown', (e) => {
      if (currentCircuitKey === 'custom_sandbox') {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
          if (CustomSandbox.deleteSelected()) {
            SoundFX.init();
            SoundFX.switchClick();
            syncUI();
            e.preventDefault();
          }
        }
      }
    });

    // Delete Button in Palette
    const btnDel = document.getElementById('btn-delete-selected');
    if (btnDel) {
      btnDel.addEventListener('click', () => {
        SoundFX.init();
        if (CustomSandbox.deleteSelected()) {
          SoundFX.switchClick();
          syncUI();
        }
      });
    }

    // Clear Sandbox Button in Palette
    const btnClear = document.getElementById('btn-clear-sandbox');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        SoundFX.init();
        CustomSandbox.clear();
        SoundFX.switchClick();
        syncUI();
      });
    }

    // Component Palette Buttons: Spawn Gates in Custom Sandbox Mode
    document.querySelectorAll('.btn-palette[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        SoundFX.init();
        SoundFX.switchClick();
        const gateType = btn.dataset.add;
        if (!gateType) return;

        // Auto switch to custom sandbox mode if on preset
        if (currentCircuitKey !== 'custom_sandbox') {
          currentCircuitKey = 'custom_sandbox';
          const presetSelect = document.getElementById('circuit-preset-select');
          if (presetSelect) presetSelect.value = 'custom_sandbox';
          const cur = getActiveCircuit();
          const channelNames = ['CLK', ...cur.inputs.map(i => i.name), ...cur.outputs.map(o => o.name)];
          analyzer.resetChannels(channelNames);
        }

        // Auto switch to schematic view if in breadboard view
        if (currentViewMode !== 'schematic') {
          currentViewMode = 'schematic';
          document.querySelectorAll('#view-mode-tabs .view-pill').forEach(b => b.classList.toggle('active', b.dataset.view === 'schematic'));
          const titleEl = document.getElementById('canvas-view-title');
          const subtextEl = document.getElementById('canvas-view-subtext');
          if (titleEl) titleEl.innerHTML = '&#128208; Vector Schematic Netlist Canvas';
          if (subtextEl) subtextEl.textContent = '[IEEE / ANSI Symbols with 4-State Live Streamers]';
        }

        // Calculate spawn coordinate centered / staggered
        const count = CustomSandbox.components.length;
        const spawnX = 220 + (count % 4) * 60;
        const spawnY = 90 + (count % 4) * 55;

        const newComp = CustomSandbox.createComponent(gateType, spawnX, spawnY);
        CustomSandbox.components.push(newComp);
        CustomSandbox.selectedCompId = newComp.id;
        CustomSandbox.selectedWireId = null;

        syncUI();
      });
    });

    // Initialize Default Custom Sandbox Netlist
    CustomSandbox.initDefault();

    // Initialize Sub-Engines
    KMapModule.init(getActiveCircuit());
    ChallengeEngine.init();
    QuizModule.init();

    // 3D Model Embed Loader
    function init3DModel() {
      window.three3DInitialized = true;
      const canvas3d = document.getElementById('sim3d-canvas');
      const aside = document.getElementById('sim3d-components');
      if (!canvas3d || !window.THREE) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0e17);

      const camera = new THREE.PerspectiveCamera(45, canvas3d.clientWidth / canvas3d.clientHeight, 0.1, 100);
      camera.position.set(3.5, 3.2, 4.0);

      const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
      renderer.setSize(canvas3d.clientWidth, canvas3d.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);

      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334466, 1.4);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight.position.set(6, 12, 8);
      scene.add(dirLight);

      const loader = new THREE.GLTFLoader();
      loader.load('/models/digital_logic_design.glb', (gltf) => {
        scene.add(gltf.scene);
        if (aside) {
          aside.innerHTML = '';
          gltf.scene.traverse((child) => {
            if (child.isMesh) {
              const b = document.createElement('button');
              b.className = 'sim3d-comp';
              b.textContent = child.name || 'Component';
              b.addEventListener('click', () => {
                aside.querySelectorAll('.sim3d-comp').forEach(btn => btn.classList.remove('active'));
                b.classList.add('active');
                if (child.material && child.material.color) {
                  const orig = child.material.color.getHex();
                  child.material.color.setHex(0x10b981);
                  setTimeout(() => child.material.color.setHex(orig), 700);
                }
              });
              aside.appendChild(b);
            }
          });
        }
      }, undefined, (err) => {
        console.warn('3D model load error:', err);
      });

      function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }
      animate();

      // Fullscreen toggle
      const fsBtn = document.getElementById('sim3d-fs-toggle');
      if (fsBtn) {
        fsBtn.addEventListener('click', () => {
          const sec = document.getElementById('sim3d-section');
          sec.classList.toggle('fullscreen');
          const isFs = sec.classList.contains('fullscreen');
          fsBtn.textContent = isFs ? '✕ Close' : '⤢ Fullscreen';
          setTimeout(() => {
            renderer.setSize(canvas3d.clientWidth, canvas3d.clientHeight);
            camera.aspect = canvas3d.clientWidth / canvas3d.clientHeight;
            camera.updateProjectionMatrix();
          }, 60);
        });
      }
    }

    // Initial render
    syncUI();
  });

})();
